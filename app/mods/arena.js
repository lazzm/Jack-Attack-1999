/* The online shooters: JACKREAL TOURNAMENT and JAQUAKE deathmatch / co-op. Lobbies of up to 8 players (plus spectators),
 * relayed at 10 Hz. The referee (public/js/pcgames-arena.js, shared with the games' practice sessions) is the authority:
 * it checks every client claim (speed, position inside the map, fire rate, ammo, line of sight, damage caps) and keeps
 * health, frags, flags, pickups and the co-op monsters. Empty slots are filled with bots that one player's browser drives
 * (the "host"; also checked by the referee). The host role moves to another player by itself when the host leaves, drops
 * or tabs out, so a match never ends because somebody went for their tea.
 *
 * The [JackNet] public servers are always listed, even when nobody is on: joining an empty one starts a match with bots
 * straight away. Every match ends with a scoreboard and a vote for the next map (map rotation). Members' frags, deaths,
 * wins and best sprees go on weekly and all-time leaderboards (state.mods.arena: only ever added to, never wiped; the
 * weekly table starts again each Monday and last week's top ten is kept).
 *   client -> { t:'arList' }                         <- { t:'arList', games:[{id,name,game,map,mode,n,b,max,sp,lan,pub,ping,host,st}], full }
 *   client -> { t:'arPing', k }                      <- { t:'arPong', k }
 *   client -> { t:'arHost', map, mode, name, lan, bots, skill, frags, full }   <- { t:'arJoined', g } | { t:'arErr', msg }
 *   client -> { t:'arJoin', id, spec }               <- { t:'arJoined', g } | { t:'arErr', msg }
 *   client -> { t:'arQuick', game, full, mode? }     <- { t:'arJoined', g } (the best server for you) | { t:'arErr', msg }
 *   client -> { t:'arVote', i }                      (between matches: which map next)
 *   client -> { t:'arTop' }                          <- { t:'arTop', wk, all, prev, wkId, me }
 *   client -> { t:'arLeave' }                        <- { t:'arLeft', why? }
 *   client -> { t:'arU', s:[x,y,z,yaw,pitch,w], b:[[eid,x,y,z,yaw,pitch,w]...], ev:[...], pg }   (10 Hz; a hidden tab sends just { pg } now and then)
 *           ev: ['f',eid,w,[o],[d]] fire | ['h',eid,vid,w,dmg] hit | ['r',eid] respawn | ['s',eid] suicide | ['c',eid,text] chat
 *   server -> { t:'arS', e:[snapshot rows], ev:[events], w:world, me:{am,has,ud}, sc?:[scores] }   (10 Hz)
 *   server -> { t:'arG', g }  game info whenever players, bots, the host, the map or the vote change */
const path = require('path');
let ECON = null, ECAT = null; // the Rupee bank (same module instances the server loaded): a small, capped reward for playing a match
try { ECON = require('./econ.js'); ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js')); } catch (e) { ECON = null; }
const EARN_ADD = { fpsmatch: { amt: 5, cap: 4, gap: 90, drop: 0.08, label: 'Played a match on a JackNet server' } };
let Arena = null;
try { Arena = require(path.join(__dirname, '..', 'public', 'js', 'pcgames-arena.js')); } catch (e) { console.error('arena: rules missing', e.message); }

const MAX_HUMANS = 8, MAX_SPEC = 8, MAX_GAMES = 24, BOT_BASE = 1000000, MON_BASE = 2000000;
const HOLD_GONE = 120000, HOLD_SILENT = 45000, HOLD_AWAY = 180000, VOTE_MS = 15000;
const BOTS = [['Callum', 4], ['JackK', 3], ['Luke', 2], ['Dave', 1], ['Jumping Jack', 2], ['Spudgun', 2], ['Jack Frost', 3], ['Dial-Up Dan', 1], ['Nan\'s Cat', 2], ['Jack-in-the-Box', 3], ['Lagmonster', 1], ['Y2K Bug', 3]];
// the 24/7 [JackNet] servers. fill = humans + bots; cap = the hardest bot allowed (Callum is GODLIKE on his own servers only)
const PUBS = [
  { id: 1, key: 'dm', game: 'jrt', name: '[JackNet] Deathmatch 24/7', mode: 'dm', fill: 6, skill: -1, cap: 3, frags: 25, time: 10 },
  { id: 2, key: 'ctf', game: 'jrt', name: '[JackNet] Capture the Flag', mode: 'ctf', fill: 8, skill: -1, cap: 3, caps: 3, time: 12 },
  { id: 3, key: 'newb', game: 'jrt', name: '[JackNet] Newbies Only (bots go easy)', mode: 'dm', fill: 5, skill: 0, cap: 0, frags: 15, time: 8 },
  { id: 4, key: 'jqdm', game: 'jq', name: '[JackNet] JAQUAKE Deathmatch', mode: 'dm', fill: 5, skill: -1, cap: 3, frags: 20, time: 10 },
  { id: 5, key: 'jqco', game: 'jq', name: '[JackNet] JAQUAKE Co-op (monster waves)', mode: 'coop', fill: 3, skill: 2, cap: 3, frags: 99, time: 15, waves: 6 },
];
let ctx, D, nextGame = 100, nextBot = 1;
const games = new Map(); // id -> game
const where = new Map(); // client info -> { g, eid, spec }

const nameOf = c => ctx.clean(c.nick || 'Player', 20) || 'Player';
const humans = g => [...g.players.values()].filter(p => !p.spec).length;
const specs = g => [...g.players.values()].filter(p => p.spec).length;
const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
const vec3 = a => Array.isArray(a) && a.length >= 3 ? [num(a[0], 0), num(a[1], 0), num(a[2], 0)] : null;
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const keyOf = c => { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) ? null : k; };

// ---------------------------------------------------------------- the 1999 calendar (UK time): JRT's full version is out on 22 November
const FMT = (() => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { return null; } })();
function ukDay(ts) { const d = new Date(ts || Date.now()); if (!FMT) return d.toISOString().slice(0, 10); const p = {}; for (const x of FMT.formatToParts(d)) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}`; }
const fullNow = () => { const [, m, d] = ukDay().split('-').map(Number); return Arena.fullOn(m * 100 + d); };
function weekId(ts) { // ISO week of the UK date, e.g. 2026-W43
  const [y, m, d] = ukDay(ts).split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d)), dn = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dn + 3); const fy = t.getUTCFullYear(), f = new Date(Date.UTC(fy, 0, 4));
  return `${fy}-W${String(1 + Math.round(((t - f) / 864e5 - 3 + ((f.getUTCDay() + 6) % 7)) / 7)).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- game info for the clients
function voteView(g, forEid) {
  const v = g.vote; if (!v) return null;
  const tally = v.opts.map(() => 0); for (const i of v.votes.values()) tally[i]++;
  return { opts: v.opts, tally, left: Math.max(0, Math.ceil((v.until - Date.now()) / 1000)), mine: v.votes.has(forEid) ? v.votes.get(forEid) : -1 };
}
function info(g, forC) {
  const me = forC ? where.get(forC) : null;
  return {
    id: g.id, name: g.name, game: g.game, map: g.map, mode: g.mode, lan: g.lan, pub: !!g.pub, frags: g.R.o.frags, caps: g.R.o.caps, time: g.R.o.time, match: g.matchNo,
    host: g.host ? (where.get(g.host) || {}).eid || 0 : 0, you: me ? me.eid : 0, spec: me ? me.spec : false,
    bots: g.bots.map(b => [b.eid, b.name, b.skill]), humans: [...g.players.values()].filter(p => !p.spec).map(p => [p.eid, nameOf(p.c), p.c.member ? 1 : 0]),
    vote: voteView(g, me ? me.eid : 0), rot: g.rot.slice(0, 6),
  };
}
function listFor(c) {
  const out = [];
  for (const g of games.values()) {
    if (g.lan && g.ip !== c.ip) continue;
    const hp = g.host ? (g.host.arPing || 60) : 30;
    out.push({ id: g.id, name: g.name, game: g.game, map: g.map, mode: g.mode, n: humans(g), b: g.idle ? 0 : g.bots.length, fill: g.pub ? g.pub.fill : 0, max: MAX_HUMANS, sp: specs(g), lan: g.lan, pub: !!g.pub, ping: Math.min(999, hp), host: g.host ? nameOf(g.host) : '', st: g.idle ? 'idle' : g.vote ? 'vote' : g.R.state, left: g.idle ? -1 : g.R.world().left, fl: g.R.o.frags, tl: g.R.o.time, rot: g.rot.slice(0, 6), players: g.idle ? [] : [...g.players.values()].filter(p => !p.spec).map(p => nameOf(p.c)).concat(g.bots.map(b => b.name + ' (bot)')).slice(0, 12) });
  }
  out.sort((a, b) => (b.pub - a.pub) || (a.pub ? a.id - b.id : b.n - a.n));
  return out;
}
function sendG(g) { for (const p of g.players.values()) ctx.send(p.ws, { t: 'arG', g: info(g, p.c) }); }

// ---------------------------------------------------------------- matches, bots, the host
function newRef(g, mapId) {
  g.map = mapId; g.matchNo = (g.matchNo || 0) + 1; g.vote = null; g.idle = false; g.matchAt = Date.now();
  g.R = new Arena.Referee({ map: mapId, mode: g.mode, frags: g.frags, caps: g.caps || 3, time: g.time, waves: g.waves || 6, hold: true });
  g.mode = g.R.o.mode; // (a map without CTF falls back to deathmatch)
  for (const p of g.players.values()) { if (!p.spec) { g.R.add(p.eid, { name: nameOf(p.c) }); p.since = Date.now(); } }
  for (const b of g.bots) g.R.add(b.eid, { name: b.name, bot: true, skill: b.skill });
  balanceBots(g);
}
function wantBots(g) {
  const h = humans(g); if (!h) return 0;
  return g.pub ? Math.max(0, Math.min(MAX_HUMANS, g.pub.fill) - h) : Math.max(0, Math.min(g.botTarget, MAX_HUMANS - h));
}
// keep (human players + bots) at the server's size; in CTF a bot leaves from whichever team is bigger
function balanceBots(g) {
  const want = wantBots(g);
  while (g.bots.length > want) {
    let i = g.bots.length - 1;
    if (g.R.ctf) { const n = [0, 0]; for (const e of g.R.E.values()) if (e.team >= 0 && !e.mon) n[e.team]++; const big = n[0] > n[1] ? 0 : 1; const j = g.bots.map((b, k) => [b, k]).reverse().find(([b]) => (g.R.E.get(b.eid) || {}).team === big); if (j) i = j[1]; }
    const b = g.bots.splice(i, 1)[0]; g.R.remove(b.eid);
  }
  const used = new Set([...g.bots.map(b => b.name), ...[...g.players.values()].map(p => nameOf(p.c))]);
  while (g.bots.length < want) {
    const pick = BOTS.find(([n]) => !used.has(n)) || ['Bot ' + nextBot, 2];
    used.add(pick[0]);
    let skill = g.botSkill >= 0 ? (pick[0] === 'Callum' && !g.pub ? 4 : g.botSkill) : pick[1];
    if (g.pub) skill = Math.min(g.pub.cap, skill);
    skill = Math.max(0, Math.min(4, skill));
    const b = { eid: BOT_BASE + (nextBot++), name: pick[0], skill };
    g.bots.push(b); g.R.add(b.eid, { name: b.name, bot: true, skill });
  }
}
function pickHost(g, not) {
  const now = Date.now();
  const ok = [...g.players.values()].filter(p => !p.spec && !p.gone && p.c !== not && now - p.last < 1500 && !(g.R.E.get(p.eid) && g.R.away(g.R.E.get(p.eid))));
  const any = ok.length ? ok : [...g.players.values()].filter(p => !p.spec && !p.gone && p.c !== not);
  any.sort((a, b) => (a.c.arPing || 80) - (b.c.arPing || 80));
  return any[0] || null;
}
function setHost(g, p, why) {
  if (!p || g.host === p.c) return;
  g.host = p.c; g.hostAt = Date.now();
  if (why) g.R.say(0, `${nameOf(p.c)} is now running the bots${why}.`);
  sendG(g);
}
function goIdle(g) { // a 24/7 server with nobody on it: stop the match, send the bots home, wait
  for (const b of g.bots) g.R.remove(b.eid);
  g.bots = []; g.idle = true; g.vote = null; g.host = null;
}
function leave(c, why) {
  const w = where.get(c); if (!w) return;
  where.delete(c);
  const g = w.g, p = g.players.get(c.id); g.players.delete(c.id);
  if (!w.spec) { g.R.remove(w.eid); g.R.say(0, `${nameOf(c)} ${why === 'away' ? 'was moved off the server (away for ages)' : why === 'timeout' ? 'timed out' : 'left the game'}.`); }
  if (!humans(g)) {
    if (!g.pub) { for (const q of g.players.values()) ctx.send(q.ws, { t: 'arLeft', why: 'The server has shut down (everybody left).' }); for (const q of g.players.values()) where.delete(q.c); games.delete(g.id); return; }
    goIdle(g);
  } else if (g.host === c) setHost(g, pickHost(g, c), ' (the old host left)');
  balanceBots(g); sendG(g);
  if (p && why === 'away') ctx.send(p.ws, { t: 'arLeft', why: 'You were away for ages, so you were moved off the server. Join again any time!' });
}
function join(ws, c, g, spec) {
  leave(c);
  if (g.idle) newRef(g, g.rot.length ? g.rot[(g.rotI = (g.rotI + 1) % g.rot.length)] : g.map);
  const eid = c.id;
  g.players.set(c.id, { ws, c, eid, spec: !!spec, last: Date.now(), since: Date.now() });
  where.set(c, { g, eid, spec: !!spec });
  if (!spec) { g.R.add(eid, { name: nameOf(c) }); g.R.say(0, `${nameOf(c)} entered the game.`); }
  if (!spec && (!g.host || !g.players.has(g.host.id))) { g.host = c; g.hostAt = Date.now(); } // nobody is running the bots: you are
  balanceBots(g);
  ctx.send(ws, { t: 'arJoined', g: info(g, c) });
  sendG(g);
}
function canJoin(g, c, spec) {
  if (g.lan && g.ip !== c.ip) return 'Could not connect: the server has gone (did Callum switch his PC off?).';
  if (spec) return specs(g) >= MAX_SPEC ? 'Too many spectators already. Grab some popcorn and try again later.' : '';
  return humans(g) >= MAX_HUMANS ? 'Server is full (8/8). Try spectating!' : '';
}

// ---------------------------------------------------------------- end of a match: the map vote, then the next map
function startVote(g) {
  const rot = g.rot.length ? g.rot : [g.map];
  const i = rot.indexOf(g.map), next = rot[(i + 1) % rot.length];
  const opts = [next]; if (!opts.includes(g.map)) opts.push(g.map);
  const rest = rot.filter(m => !opts.includes(m)); if (rest.length) opts.push(rest[Math.floor(Math.random() * rest.length)]);
  g.vote = { opts: opts.slice(0, 3), votes: new Map(), until: Date.now() + VOTE_MS };
  sendG(g);
}
function endVote(g) {
  const v = g.vote; if (!v) return;
  const tally = v.opts.map(() => 0); for (const i of v.votes.values()) tally[i]++;
  let win = 0; tally.forEach((n, i) => { if (n > tally[win]) win = i; });
  const mapId = v.opts[win]; g.rotI = Math.max(0, g.rot.indexOf(mapId));
  newRef(g, mapId);
  g.R.say(0, `Next up: ${Arena.MAPS[mapId].title}!${tally[win] ? ` (${tally[win]} vote${tally[win] === 1 ? '' : 's'})` : ''}`, 1);
  sendG(g);
}

// ---------------------------------------------------------------- stats and leaderboards (members only)
function statsInit() {
  D.v = D.v || 1;
  if (!D.all || typeof D.all !== 'object') D.all = {};
  if (!D.wk || typeof D.wk !== 'object') D.wk = { id: weekId(), rows: {} };
  for (const gm of ['jrt', 'jq']) { if (!D.all[gm] || typeof D.all[gm] !== 'object') D.all[gm] = {}; if (!D.wk.rows[gm] || typeof D.wk.rows[gm] !== 'object') D.wk.rows[gm] = {}; }
  if (!Array.isArray(D.prev)) D.prev = [];
  D.servers = D.servers || {}; // per public server: matches played (for the browser's "matches today" line)
}
function rollWeek() {
  const id = weekId(); if (D.wk.id === id) return;
  D.prev.unshift({ id: D.wk.id, jrt: top(D.wk.rows.jrt, 10), jq: top(D.wk.rows.jq, 10) }); D.prev = D.prev.slice(0, 8);
  D.wk = { id, rows: { jrt: {}, jq: {} } }; topCache = null; ctx.markDirty();
}
function rowOf(tbl, key, name) { let r = tbl[key]; if (!r || typeof r !== 'object') r = tbl[key] = { n: name, f: 0, d: 0, w: 0, m: 0, c: 0, s: 0 }; r.n = name; return r; }
function stat(c, game, field, n, max) {
  const key = keyOf(c); if (!key || !D) return;
  rollWeek();
  for (const tbl of [D.all[game], D.wk.rows[game]]) { if (!tbl) continue; const r = rowOf(tbl, key, c.member); if (max) r[field] = Math.max(r[field] | 0, n); else r[field] = (r[field] | 0) + n; r.t = Date.now(); }
  ctx.markDirty(); topCache = null;
}
const top = (tbl, n) => Object.values(tbl || {}).filter(r => r && r.n && (r.f > 0 || r.w > 0)).sort((a, b) => b.f - a.f || b.w - a.w || a.n.localeCompare(b.n)).slice(0, n).map(r => [r.n, r.f | 0, r.d | 0, r.w | 0, r.m | 0, r.s | 0, r.c | 0]);
let topCache = null, topAt = 0;
function topView(c) {
  rollWeek();
  if (!topCache || Date.now() - topAt > 10000) { topCache = { wk: { jrt: top(D.wk.rows.jrt, 10), jq: top(D.wk.rows.jq, 10) }, all: { jrt: top(D.all.jrt, 10), jq: top(D.all.jq, 10) }, prev: D.prev[0] || null, wkId: D.wk.id }; topAt = Date.now(); }
  const key = keyOf(c), me = key ? { jrt: D.all.jrt[key] || null, jq: D.all.jq[key] || null, wjrt: D.wk.rows.jrt[key] || null, wjq: D.wk.rows.jq[key] || null } : null;
  return Object.assign({ t: 'arTop', me, member: !!key }, topCache);
}
function pay(c, note) { try { if (c && c.member && ECON && ECON.api && ECAT && ECAT.EARN.fpsmatch) ECON.api.earn(c, 'fpsmatch', note); } catch (e) { console.error('arena pay', e); } }
function clientOfEid(g, eid) { const p = g.players.get(eid); return p && !p.spec ? p.c : null; }
function record(g, ev) {
  for (const e of ev) {
    if (e[0] === 'k') {
      const [, kid, vid, w] = e;
      if (kid !== vid && w >= 0) { const kc = clientOfEid(g, kid); if (kc) { stat(kc, g.game, 'f', 1); const k = g.R.E.get(kid); if (k) stat(kc, g.game, 's', k.spree, true); } }
      const vc = clientOfEid(g, vid); if (vc) stat(vc, g.game, 'd', 1);
    } else if (e[0] === 'fl' && e[2] === 'cap') { const c = clientOfEid(g, e[3]); if (c) stat(c, g.game, 'c', 1); }
    else if (e[0] === 'end') {
      const who = String(e[1] || ''), now = Date.now();
      if (g.pub) { D.servers[g.pub.key] = (D.servers[g.pub.key] | 0) + 1; ctx.markDirty(); }
      for (const p of g.players.values()) {
        if (p.spec) continue;
        const x = g.R.E.get(p.eid); if (!x) continue;
        const won = g.R.coop ? who === 'The players' : g.R.ctf ? who === `${Arena.TEAM[x.team]} team` : who === x.name;
        if (won || now - (p.since || now) >= 45000) { stat(p.c, g.game, 'm', 1); pay(p.c, `Finished a match of ${g.game === 'jq' ? 'JAQUAKE' : 'JRT'} on JackNet`); } // a match counts if you won it or were there for 45 seconds
        if (won) stat(p.c, g.game, 'w', 1);
      }
    }
  }
}

// ---------------------------------------------------------------- the 10 Hz tick
function tick() {
  const now = Date.now();
  for (const g of games.values()) {
    if (g.idle) continue;
    // drop players whose browser stopped talking (a closed tab, a laptop asleep), or who have been away for ages
    for (const p of [...g.players.values()]) {
      if (p.spec) { if (now - p.last > HOLD_GONE) leave(p.c, 'timeout'); continue; }
      const e = g.R.E.get(p.eid);
      if (now - p.last > (p.gone ? HOLD_GONE : HOLD_SILENT)) leave(p.c, 'timeout');
      else if (e && now - e.seen > HOLD_AWAY && g.R.state === 'play') leave(p.c, 'away');
    }
    if (!games.has(g.id) || g.idle) continue;
    // the host hasn't sent the bots' moves for a bit (tabbed out, lagging): somebody else drives them
    const driven = g.bots.length || (g.R.coop && [...g.R.E.values()].some(e => e.mon));
    if (driven && now - (g.hostAt || 0) > 2500) { const p = pickHost(g, null); if (p && p.c !== g.host && now - p.last < 1500) setHost(g, p, g.host ? ` (${nameOf(g.host)} went quiet)` : ''); }
    g.R.tick();
    const ev = g.R.drain();
    if (ev.length) record(g, ev);
    if (ev.some(e => e[0] === 'end') && !g.vote) startVote(g);
    if (g.vote && (now > g.vote.until || (g.vote.votes.size && g.vote.votes.size >= humans(g) && now > g.vote.until - VOTE_MS + 3000))) endVote(g);
    g.tickN = (g.tickN || 0) + 1;
    const scoresDue = g.tickN % 10 === 0 || ev.some(e => /^(k|fl|end|start|x|sp)$/.test(e[0]));
    const shared = { t: 'arS', e: g.R.snap(), ev, w: g.R.world() };
    if (scoresDue) shared.sc = g.R.scores().map(r => r.concat([pingOf(g, r[0])]));
    if (g.vote && g.tickN % 5 === 0) shared.vt = voteView(g, 0);
    const tail = JSON.stringify(shared).slice(1);
    for (const p of g.players.values()) {
      if (p.gone) continue;
      const me = p.spec ? null : g.R.mine(p.eid);
      ctx.send(p.ws, '{"me":' + JSON.stringify(me) + ',' + tail);
    }
  }
}
function pingOf(g, eid) { if (eid >= BOT_BASE) return 0; const p = g.players.get(eid); return p ? Math.min(999, p.c.arPing || 0) : 0; }

function makePub(def) {
  const full = fullNow(), rot = Arena.rotation(def.game, def.mode, full);
  const g = { id: def.id, pub: def, name: def.name, game: def.game, mode: def.mode, lan: false, ip: '', host: null, players: new Map(), bots: [], botTarget: def.fill, botSkill: def.skill,
    frags: def.frags || 20, caps: def.caps || 3, time: def.time || 10, waves: def.waves || 6, rot, rotI: Math.floor(Math.random() * Math.max(1, rot.length)), created: Date.now(), full };
  newRef(g, rot[g.rotI] || (def.game === 'jq' ? 'jqdm1' : 'spacegrot'));
  goIdle(g);
  games.set(g.id, g);
}
// the full version comes out on 22 November (and the year loops on 1 January): the 24/7 rotations follow the calendar
function checkCalendar() {
  const full = fullNow();
  for (const g of games.values()) if (g.pub && g.full !== full) { g.full = full; g.rot = Arena.rotation(g.game, g.mode, full); if (g.idle && !g.rot.includes(g.map)) g.map = g.rot[0]; }
}

module.exports = {
  name: 'arena',
  types: ['arList', 'arPing', 'arHost', 'arJoin', 'arLeave', 'arU', 'arQuick', 'arVote', 'arTop'],
  init(c) {
    ctx = c; D = c.data;
    if (!Arena) return;
    if (ECAT && ECAT.EARN) for (const k in EARN_ADD) if (!Object.prototype.hasOwnProperty.call(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    statsInit();
    for (const def of PUBS) makePub(def);
    setInterval(() => { try { tick(); } catch (e) { console.error('arena tick', e); } }, 100);
    setInterval(() => { try { checkCalendar(); rollWeek(); } catch (e) { console.error('arena cal', e); } }, 60000);
    // a connection blip isn't a quit: a player keeps their frags and their place for two minutes (HOLD_GONE in tick)
    // and gets them back when the same visitor id reconnects. Spectators just go.
    ctx.on('close', cl => {
      const w = where.get(cl);
      if (!w || w.spec) return leave(cl, 'quit');
      const g = w.g, p = g.players.get(cl.id); if (!p) return leave(cl, 'quit');
      p.gone = Date.now(); g.R.say(0, `${nameOf(cl)} lost connection... (keeping their place warm)`);
      if (g.host === cl) setHost(g, pickHost(g, cl), '');
    });
    ctx.on('hello', (ws, cl) => {
      for (const g of games.values()) {
        const p = g.players.get(cl.id); if (!p || p.c === cl) continue;
        const w = where.get(p.c); where.delete(p.c); if (w) where.set(cl, w);
        if (g.host === p.c) g.host = cl;
        p.c = cl; p.ws = ws; p.gone = 0; p.last = Date.now();
        if (!p.spec) g.R.say(0, `${nameOf(cl)} is back.`);
        sendG(g);
      }
    });
  },
  handle(ws, c, m) {
    if (!Arena) return ctx.send(ws, { t: 'arErr', msg: 'The tournament server is down for maintenance.' });
    if (m.t === 'arPing') { if (!c.arPg) c.arPg = new ctx.Bucket(2, 6); if (c.arPg.take()) ctx.send(ws, { t: 'arPong', k: num(m.k, 0) }); return; }
    if (m.t === 'arList') { if (!c.arLs) c.arLs = new ctx.Bucket(1, 5); if (c.arLs.take()) ctx.send(ws, { t: 'arList', games: listFor(c), full: fullNow() }); return; }
    if (m.t === 'arTop') { if (!c.arTp) c.arTp = new ctx.Bucket(0.5, 4); if (c.arTp.take()) ctx.send(ws, topView(c)); return; }
    if (m.t === 'arLeave') { leave(c, 'quit'); return ctx.send(ws, { t: 'arLeft' }); }
    if (m.t === 'arHost') {
      if (!c.arHs) c.arHs = new ctx.Bucket(0.1, 3);
      if (!c.arHs.take()) return ctx.send(ws, { t: 'arErr', msg: 'Slow down! You can only start a new server every few seconds.' });
      if (games.size >= MAX_GAMES) return ctx.send(ws, { t: 'arErr', msg: 'The master server is full. Try joining a game instead.' });
      if ([...games.values()].filter(g => g.ip === c.ip).length >= 3) return ctx.send(ws, { t: 'arErr', msg: 'Your network is already running 3 servers. Leave some for everyone else!' });
      const mapId = Arena.MAPS[m.map] ? m.map : 'spacegrot', game = Arena.gameOf(mapId);
      const modes = Arena.MAPS[mapId].modes || ['dm'], mode = modes.includes(m.mode) ? m.mode : 'dm';
      const name = ctx.delink(ctx.clean(m.name, 32)) || `${nameOf(c)}'s server`;
      const frags = Math.max(5, Math.min(50, num(m.frags, 15) | 0));
      const rot = Arena.rotation(game, mode, !!m.full); if (!rot.includes(mapId)) rot.unshift(mapId);
      const g = { id: nextGame++, name, game, mode, lan: !!m.lan, ip: c.ip, host: c, players: new Map(), bots: [], botTarget: Math.max(0, Math.min(7, num(m.bots, 3) | 0)), botSkill: Math.max(-1, Math.min(4, num(m.skill, -1) | 0)),
        frags, caps: 3, time: mode === 'coop' ? 15 : 15, waves: 6, rot, rotI: rot.indexOf(mapId), created: Date.now() };
      newRef(g, mapId);
      games.set(g.id, g);
      join(ws, c, g, false);
      return;
    }
    if (m.t === 'arJoin' || m.t === 'arQuick') {
      if (!c.arJn) c.arJn = new ctx.Bucket(1, 4);
      if (!c.arJn.take()) return ctx.send(ws, { t: 'arErr', msg: 'Hold your horses! Connecting...' });
      let g = null;
      if (m.t === 'arJoin') g = games.get(num(m.id, 0));
      else { // quick match: the busiest game of that type with room (that your version can play), else its [JackNet] server
        const game = m.game === 'jq' ? 'jq' : 'jrt', full = !!m.full, cur = where.get(c);
        const can = x => x.game === game && !(x.lan && x.ip !== c.ip) && humans(x) < MAX_HUMANS && (full || !Arena.MAPS[x.map] || Arena.MAPS[x.map].demo) && (!m.mode || x.mode === m.mode);
        const live = [...games.values()].filter(x => can(x) && humans(x) > 0 && !(cur && cur.g === x)).sort((a, b) => humans(b) - humans(a) || (b.pub ? 1 : 0) - (a.pub ? 1 : 0) || (a.host ? a.host.arPing || 80 : 80) - (b.host ? b.host.arPing || 80 : 80));
        g = live[0] || [...games.values()].find(x => x.pub && can(x) && x.mode === (m.mode || (game === 'jq' ? 'dm' : 'dm')) && x.pub.key !== 'newb') || [...games.values()].find(x => x.pub && can(x));
      }
      if (!g) return ctx.send(ws, { t: 'arErr', msg: 'Could not connect: the server has gone (did Callum switch his PC off?).' });
      const cur = where.get(c); if (cur && cur.g === g && (!m.spec === !cur.spec)) return ctx.send(ws, { t: 'arJoined', g: info(g, c) });
      const no = canJoin(g, c, !!m.spec); if (no) return ctx.send(ws, { t: 'arErr', msg: no });
      join(ws, c, g, !!m.spec);
      return;
    }
    if (m.t === 'arVote') {
      const w = where.get(c); if (!w || w.spec || !w.g.vote) return;
      const i = num(m.i, -1) | 0; if (i < 0 || i >= w.g.vote.opts.length) return;
      w.g.vote.votes.set(w.eid, i); sendG(w.g);
      return;
    }
    if (m.t === 'arU') {
      const w = where.get(c); if (!w) return;
      if (!c.arUb) c.arUb = new ctx.Bucket(15, 25);
      if (!c.arUb.take()) return;
      const g = w.g, R = g.R, p = g.players.get(c.id); if (p) { p.last = Date.now(); p.gone = 0; }
      if (typeof m.pg === 'number') c.arPing = Math.max(0, Math.min(999, m.pg | 0));
      if (w.spec || g.idle) return;
      const isHost = g.host === c;
      const mine = eid => eid === w.eid || (isHost && (g.bots.some(b => b.eid === eid) || (eid >= MON_BASE && R.E.has(eid))));
      const st = s => Array.isArray(s) && s.length >= 6 ? { p: [s[0], s[1], s[2]], yaw: s[3], pitch: s[4], w: s[5] } : null;
      if (Array.isArray(m.s)) { const s = st(m.s); if (s) R.update(w.eid, s); }
      if (isHost && Array.isArray(m.b)) {
        g.hostAt = Date.now();
        for (const b of m.b.slice(0, 24)) { if (!Array.isArray(b)) continue; const eid = num(b[0], 0); if (!mine(eid) || eid === w.eid) continue; const s = st(b.slice(1)); if (s) R.update(eid, s); }
      } else if (isHost && !g.bots.length && Array.isArray(m.s)) g.hostAt = Date.now();
      if (Array.isArray(m.ev)) for (const e of m.ev.slice(0, 32)) {
        if (!Array.isArray(e) || typeof e[0] !== 'string') continue;
        const eid = num(e[1], 0); if (!mine(eid)) continue;
        if (e[0] === 'f') R.fire(eid, num(e[2], 0) | 0, vec3(e[3]), vec3(e[4]));
        else if (e[0] === 'h') R.hit(eid, num(e[2], 0), num(e[3], 0) | 0, num(e[4], 0));
        else if (e[0] === 'r') R.respawn(eid);
        else if (e[0] === 's') R.suicide(eid, 'decided to give up');
        else if (e[0] === 'c') {
          if (!c.arCh) c.arCh = new ctx.Bucket(0.6, 4);
          const text = ctx.delink(ctx.clean(e[2], 80)); if (!text || !c.arCh.take()) continue;
          R.ev.push(['c', eid, text]);
        }
      }
    }
  },
  _test: { games, where, PUBS, fullNow, weekId, topView, tick, get D() { return D; } },
};
