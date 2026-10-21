/* grind: more reasons to stay and play. The Great Rupee Hunt (ten gems hidden round the PC and the JackNet every day),
 * Pocket Money jobs (mini-games that pay a little), JackNet Rank (XP and levels from everything you do) and the
 * JackNet Hall of Fame (this 1999 week + all time). The numbers live in public/js/grind-cat.js (shared with the browser).
 * Money only moves through econ's earn path (daily caps, diminishing returns, gaps), so loot drops and missions ride on
 * it too. Amounts are never taken from the browser: it says WHICH gem it clicked or WHAT score a round got, and the
 * server checks the gem is real today, the round really lasted that long and the score is possible.
 *   client -> { t:'grHunt' }                    <- { t:'grHunt', day, spots:[{id,c,clue,hint}], got, top, bonus }
 *   client -> { t:'grClaim', id }               <- { t:'grClaimed', id, c, amt, n, all, bonus }
 *   client -> { t:'grJobGo', j }                <- { t:'grJobGo', j, tok, n, runs }
 *   client -> { t:'grJobDone', j, tok, sc }     <- { t:'grJobDone', j, sc, amt, n, best, pb }
 *   client -> { t:'grMe' }                      <- { t:'grMe', xp, lv, ... }      server -> { t:'grLevel', lv, ... } on a level-up
 *   client -> { t:'grWin', g }                  a top-ten finish in a PC game (small, capped)
 *   client -> { t:'grHof' }                     <- { t:'grHof', wk, all }          server -> { t:'grHi', rk } / { t:'grRk', n, lv }
 * Data: state.mods.grind = { v, p:{memberKey: P}, wk:{w, sc:{game:{n,s}}}, top:{day, list} } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const G = require(path.join(__dirname, '..', 'public', 'js', 'grind-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const LCAT = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const NEED = 'Only JackNet members keep what they earn. Joining is FREE: Start > Log Off, then pick a name and a password!';
let ctx, D, E;

// our earn sources, added to econ's table (the same module object econ.js and loot.js use, so caps, gaps and loot drops all work)
const EARN_ADD = {
  gem: { amt: 1, cap: 12, drop: 0.05, label: 'Rupee Hunt: found a gem' },
  hunt: { amt: G.HUNT.bonus, cap: 1, drop: 1, label: 'Rupee Hunt: all ten found' },
  job: { amt: 5, cap: 30, drop: 0.06, label: 'Pocket Money job' }, // no gap: every round is already checked (token, time, score rate)
  gamewin: { amt: 4, cap: 6, gap: 60, drop: 0.06, label: 'Top-ten finish in a PC game' },
  mpwin: { amt: 10, cap: 5, drop: 0.15, label: 'Won an online game in the JackNet Zone' },
};
const SRC_OURS = new Set(Object.keys(EARN_ADD));

// ---------------------------------------------------------------- dates (UK day -> the 1999 week)
const today = () => E.uk().day;
function week(day) {
  const y = +day.slice(0, 4), m = +day.slice(5, 7), d = Math.min(+day.slice(8, 10), m === 2 ? 28 : 31);
  const t = Date.UTC(1999, m - 1, d), dow = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  const mon = t - dow * 864e5, thu = mon + 3 * 864e5, ty = new Date(thu).getUTCFullYear();
  const no = Math.floor((thu - Date.UTC(ty, 0, 1)) / (7 * 864e5)) + 1;
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fd = x => { const q = new Date(x); return q.getUTCDate() + ' ' + M[q.getUTCMonth()]; };
  return { w: y + '.' + no, no, label: `Week ${no} of 1999 (${fd(mon)} - ${fd(mon + 6 * 864e5)})` };
}

// ---------------------------------------------------------------- per member
const keyOf = name => { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; };
const memberName = key => { const m = ctx.state.members[key]; return m ? m.name : null; };
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') {
    // a new rank card: start from the Rupees you have already earned, so old members don't start as Newbies
    const a = E.acctByKey(key), seed = a ? Math.max(0, Math.floor(a.earned || 0)) : 0;
    p = D.p[key] = { xp: seed, lv: G.levelOf(seed), ux: { day: '', n: 0 }, hunt: { day: '', got: [] }, finds: 0, jobs: { day: '', n: {} }, best: {}, wk: { w: '', e: 0, g: 0, jb: {} }, at: Date.now() };
    for (const [lv, id] of G.RANK_LOOT) if (p.lv >= lv) giveLoot(key, id);
    ctx.markDirty();
  }
  return fix(p);
}
// THE DATABASE IS SACRED: old records are only ever added to (missing fields get defaults), never reset or dropped.
function fix(p) {
  if (typeof p.xp !== 'number') p.xp = 0;
  if (typeof p.lv !== 'number') p.lv = G.levelOf(p.xp);
  if (!p.ux || typeof p.ux !== 'object') p.ux = { day: '', n: 0 };
  if (!p.hunt || typeof p.hunt !== 'object' || !Array.isArray(p.hunt.got)) p.hunt = { day: '', got: [] };
  if (!p.jobs || typeof p.jobs !== 'object' || !p.jobs.n) p.jobs = { day: '', n: {} };
  if (!p.best || typeof p.best !== 'object') p.best = {};
  if (!p.wk || typeof p.wk !== 'object') p.wk = { w: '', e: 0, g: 0, jb: {} };
  if (!p.jt || typeof p.jt !== 'object') p.jt = {};           // every job round ever, per job
  if (!p.jr || typeof p.jr !== 'object') p.jr = {};           // Rupees ever earned per job
  if (!Array.isArray(p.wks)) p.wks = [];                     // past weeks: { w, e, g, jb }
  if (!Array.isArray(p.hlog)) p.hlog = [];                   // hunt days: [day, gems found]
  p.finds = p.finds | 0; p.full = p.full | 0;                // gems ever found, days with all ten
  return p;
}
function wkOf(p) {
  const w = week(today()).w;
  if (!p.wk || p.wk.w !== w) {
    const o = p.wk; if (o && o.w && (o.e || o.g || Object.keys(o.jb || {}).length)) { p.wks = p.wks || []; p.wks.push({ w: o.w, e: o.e | 0, g: o.g | 0, jb: o.jb || {} }); } // keep last week's numbers forever
    p.wk = { w, e: 0, g: 0, jb: {} };
  }
  return p.wk;
}
function giveLoot(key, id) {
  try {
    const L = require('./loot.js'); if (!L || !L.giveOnce || !LCAT.ITEM[id]) return false;
    return L.giveOnce(key, id, 'rank'); // one each
  } catch (e) { console.error('grind loot', e.message); return false; }
}

// ---------------------------------------------------------------- XP (piggy-backs econ's earn path)
function onEarn(a, src, amt, paying) {
  const key = keyOf(a.name); if (!key || !memberName(key)) return;
  const p = P(key), d = today();
  let gain = 0;
  if (paying && amt > 0) { gain = amt + G.XP.perPaid; wkOf(p).e += amt; }
  else { if (p.ux.day !== d) p.ux = { day: d, n: 0 }; if (p.ux.n < G.XP.unpaidDay) { p.ux.n++; gain = G.XP.unpaid; } }
  if (gain) addXp(key, p, a, gain);
  if (SRC_OURS.has(src)) hofAt = 0;
}
function addXp(key, p, a, n) {
  p.xp = Math.min(1e12, (p.xp || 0) + n); ctx.markDirty();
  const lv = G.levelOf(p.xp);
  if (lv > p.lv) { const from = p.lv; p.lv = lv; levelUp(key, p, a, from, lv); }
}
function levelUp(key, p, a, from, to) {
  let rw = 0; const items = [];
  for (let lv = from + 1; lv <= to; lv++) {
    rw += E.credit(a, G.levelReward(lv), 'rank', `JackNet Rank ${lv}: ${G.TITLES[lv]}!`, true);
    for (const [ml, id] of G.RANK_LOOT) if (ml === lv && giveLoot(key, id)) items.push(id);
  }
  if (rw) E.toMember(a.name, { t: 'ecEarn', amt: rw, code: 'rank', note: `JackNet Rank ${to}: ${G.TITLES[to]}`, bal: a.bal });
  E.toMember(a.name, Object.assign(meView(key), { t: 'grLevel', from, rw, items }));
  ctx.broadcast({ t: 'grRk', n: a.name, lv: to });
  if (to >= 10 && to % 5 === 0) ctx.pushChat({ sys: true, text: `*** ${a.name} reached JackNet Rank ${to}: ${G.TITLES[to]}!`, ts: Date.now() });
  hofAt = 0;
}
function meView(key) {
  const p = P(key), d = today(), lv = p.lv;
  if (!p.jobs || p.jobs.day !== d) p.jobs = { day: d, n: {} };
  const wk = wkOf(p);
  return { t: 'grMe', xp: p.xp, lv, title: G.TITLES[lv], cur: G.xpFor(lv), next: lv < G.MAXLV ? G.xpFor(lv + 1) : 0, finds: p.finds | 0, best: p.best, jobs: p.jobs.n, wk: { e: wk.e, g: wk.g, jb: wk.jb } };
}
function rankMap() { const o = {}; for (const k in D.p) { const p = D.p[k], nm = memberName(k); if (nm && p && p.lv >= 2) o[nm] = p.lv; } return o; }

// ---------------------------------------------------------------- The Great Rupee Hunt
let huntDay = '', huntList = [];
function todays() { const d = today(); if (d !== huntDay) { huntDay = d; huntList = G.hunt(d); } return huntList; }
function topToday() {
  if (!D.top || D.top.day !== today()) {
    if (D.top && D.top.day && D.top.list && D.top.list.length) { D.topHist = D.topHist || []; D.topHist.push({ day: D.top.day, list: D.top.list.slice(0, 3) }); } // yesterday's podium is history
    D.top = { day: today(), list: [] };
  }
  return D.top;
}
function huntView(key) {
  const p = key ? P(key) : null, d = today();
  const got = p && p.hunt.day === d ? p.hunt.got : [];
  return { t: 'grHunt', day: d, spots: todays().map(s => ({ id: s.id, c: s.c, clue: G.SPOT[s.id].clue, hint: G.SPOT[s.id].hint })), got, top: topToday().list.slice(0, 10), bonus: G.HUNT.bonus };
}
function claim(ws, c, key, m) {
  const id = String(m.id || ''), spot = todays().find(s => s.id === id);
  if (!spot) return ctx.send(ws, { t: 'grErr', msg: "That gem has already faded away. (The hunt moves at midnight.) Check today's clues on the Rupee Hunt page!" });
  const p = P(key), d = today(), a = E.acctByKey(key); if (!a) return;
  if (p.hunt.day !== d) p.hunt = { day: d, got: [] };
  if (p.hunt.got.includes(id)) return ctx.send(ws, { t: 'grClaimed', id, c: spot.c, amt: 0, n: p.hunt.got.length, again: 1 });
  const now = Date.now(); if (now - (c.grLastGem || 0) < 1500) return; c.grLastGem = now; // no machine-gun clicking
  p.hunt.got.push(id); p.finds = (p.finds | 0) + 1; wkOf(p).g++;
  const hl = p.hlog[p.hlog.length - 1]; if (hl && hl[0] === d) hl[1] = p.hunt.got.length; else p.hlog.push([d, p.hunt.got.length]);
  const T = topToday(); let row = T.list.find(r => r.n === a.name);
  if (!row) T.list.push(row = { n: a.name, f: 0, at: 0 });
  row.f = p.hunt.got.length; row.at = now; T.list.sort((x, y) => y.f - x.f || x.at - y.at); if (T.list.length > 50) T.list.length = 50;
  ctx.markDirty(); hofAt = 0;
  const amt = Math.max(0, E.earnA(a, 'gem', `Rupee Hunt: a ${G.GEM_NAME[spot.c]} Rupee!`, G.GEM[spot.c]));
  const all = p.hunt.got.length >= todays().length;
  let bonus = 0;
  if (all) {
    bonus = Math.max(0, E.earnA(a, 'hunt', 'Rupee Hunt: all ten found!', G.HUNT.bonus)); p.full = (p.full | 0) + 1;
    const first = T.list.filter(r => r.f >= todays().length).length === 1;
    ctx.pushChat({ sys: true, text: `*** ${a.name} found ALL TEN gems in today's Great Rupee Hunt${first ? ' (the first today!)' : ''}! (www.rupeehunt.jnet)`, ts: now });
  }
  ctx.send(ws, { t: 'grClaimed', id, c: spot.c, amt, n: p.hunt.got.length, all, bonus });
}

// ---------------------------------------------------------------- Pocket Money jobs
function jobGo(ws, c, key, m) {
  const j = String(m.j || ''); if (!own(G.JOBS, j) || G.JOBS[j].room) return; // (room:1 jobs are done round the house: mods/ch.js checks and books them)
  const tok = crypto.randomBytes(6).toString('hex');
  c.grJob = { j, tok, t0: Date.now() };
  let n = 0; if (key) { const p = P(key); if (p.jobs.day !== today()) p.jobs = { day: today(), n: {} }; n = p.jobs.n[j] | 0; }
  ctx.send(ws, { t: 'grJobGo', j, tok, n, runs: G.RUNS.length });
}
function jobDone(ws, c, key, m) {
  const j = String(m.j || ''), J = G.JOBS[j], R = c.grJob; if (!J || !R || R.j !== j || R.tok !== String(m.tok || '')) return;
  c.grJob = null;
  const dt = (Date.now() - R.t0) / 1000, sc = Math.floor(+m.sc);
  if (!(sc >= 0 && sc <= J.max) || dt < 8 || dt > 900) return ctx.send(ws, { t: 'grJobDone', j, sc: 0, amt: 0, bad: 1 });
  if (sc > Math.ceil((J.rate || J.max / J.secs) * (dt + 3))) return ctx.send(ws, { t: 'grJobDone', j, sc: 0, amt: 0, bad: 1 }); // faster than anybody could
  if (!key) return ctx.send(ws, { t: 'grJobDone', j, sc, amt: 0, guest: 1 });
  const p = P(key), a = E.acctByKey(key); if (!a) return;
  if (p.jobs.day !== today()) p.jobs = { day: today(), n: {} };
  const n = p.jobs.n[j] | 0, want = G.jobPay(j, sc, n);
  p.jobs.n[j] = n + 1; p.jt[j] = (p.jt[j] | 0) + 1;
  let amt = 0;
  if (want > 0) amt = Math.max(0, E.earnA(a, 'job', `${J.n}: ${sc} ${J.unit}`, want));
  else onEarn(a, 'job', 0, false); // past today's paid rounds (or a zero): a little XP, no Rupees, and it doesn't use up the cap
  if (amt) p.jr[j] = (p.jr[j] | 0) + amt;
  const pb = sc > (p.best[j] | 0); if (pb) p.best[j] = sc;
  const wk = wkOf(p); if (sc > (wk.jb[j] | 0)) wk.jb[j] = sc;
  ctx.markDirty(); hofAt = 0;
  ctx.send(ws, { t: 'grJobDone', j, sc, amt, cashPence:amt*5, want, n: n + 1, runs: G.RUNS.length, best: p.best[j] | 0, pb });
  ctx.emit('grJob', c, key, j, sc, amt); // (mods/ex.js: odd-job streaks, the Job of the Day and The Mega Masters)
}

// a round another mod has checked for itself (mods/ch.js: Mom's jobs, done for real round the 3D house) is booked like any
// other round: today's count, history, bests, the Hall of Fame, odd-job streaks and the Job of the Day. Pays `want` through
// the 'job' source (its daily cap). Returns { amt, pb, best }.
function jobBook(c, key, j, sc, want, note) {
  const J = G.JOBS[j]; if (!J || !key || !E) return { amt: 0 };
  const p = P(key), a = E.acctByKey(key); if (!a) return { amt: 0 };
  if (p.jobs.day !== today()) p.jobs = { day: today(), n: {} };
  p.jobs.n[j] = (p.jobs.n[j] | 0) + 1; p.jt[j] = (p.jt[j] | 0) + 1;
  let amt = 0;
  if (want > 0) amt = Math.max(0, E.earnA(a, 'job', note || `${J.n}: ${sc} ${J.unit}`, want));
  else onEarn(a, 'job', 0, false);
  if (amt) p.jr[j] = (p.jr[j] | 0) + amt;
  const pb = sc > (p.best[j] | 0); if (pb) p.best[j] = sc;
  const wk = wkOf(p); if (sc > (wk.jb[j] | 0)) wk.jb[j] = sc;
  ctx.markDirty(); hofAt = 0;
  ctx.emit('grJob', c, key, j, sc, amt);
  return { amt, pb, best: p.best[j] | 0 };
}

// ---------------------------------------------------------------- the Hall of Fame
let hofCache = null, hofAt = 0;
function hof() {
  if (hofCache && hofAt && Date.now() - hofAt < 20000) return hofCache;
  const W = week(today()), rows = [];
  for (const k in D.p) { const p = D.p[k], nm = memberName(k); if (nm && p) rows.push([nm, p, E.acctByKey(k)]); }
  const top = (f, n) => rows.map(([nm, p, a]) => ({ n: nm, v: f(p, a) })).filter(r => r.v > 0).sort((x, y) => y.v - x.v || x.n.localeCompare(y.n)).slice(0, n || 10);
  const thisWk = p => (p.wk && p.wk.w === W.w ? p.wk : null);
  const jb = {}, jall = {};
  for (const j in G.JOBS) { jb[j] = top(p => (thisWk(p) ? thisWk(p).jb[j] | 0 : 0), 3); jall[j] = top(p => p.best[j] | 0, 3); }
  const wkSc = (D.wk && D.wk.w === W.w) ? D.wk.sc : {};
  const allSc = {}; const S = ctx.state.scores || {}; for (const g in S) if (Array.isArray(S[g]) && S[g][0]) allSc[g] = { n: S[g][0].n, s: S[g][0].s };
  hofCache = {
    t: 'grHof', label: W.label,
    wk: { e: top(p => (thisWk(p) ? thisWk(p).e : 0)), g: top(p => (thisWk(p) ? thisWk(p).g : 0)), jb, sc: wkSc },
    all: { e: top((p, a) => (a ? Math.floor(a.earned || 0) : 0)), g: top(p => p.finds | 0), xp: rows.map(([nm, p]) => ({ n: nm, v: p.xp | 0, lv: p.lv })).filter(r => r.v > 0).sort((x, y) => y.v - x.v).slice(0, 10), jb: jall, sc: allSc },
  };
  hofAt = Date.now();
  return hofCache;
}
function onScore(c, game, sc) {
  if (!c.member) return;
  const W = week(today()).w;
  if (!D.wk || D.wk.w !== W) { if (D.wk && D.wk.w && Object.keys(D.wk.sc || {}).length) { D.wkHist = D.wkHist || []; D.wkHist.push(D.wk); } D.wk = { w: W, sc: {} }; }
  const g = String(game).slice(0, 16), cur = D.wk.sc[g], asc = g === 'sweep';
  if (!cur || (asc ? sc < cur.s : sc > cur.s)) { D.wk.sc[g] = { n: c.member, s: sc }; ctx.markDirty(); hofAt = 0; }
}

// ---------------------------------------------------------------- a little pay for good play where there wasn't any
// PC games that keep their own top-ten tables (Pinball, SkiJack, Mahjong, Pipes, Chess...) say when you make the table.
// The browser can't prove it, so it's small and capped (like loot's Solitaire wins): 4 Rupees, 6 a day, one a minute.
const GAME_RE = /^[a-z0-9._-]{1,32}$/;
function gameWin(ws, c, key, m) {
  const g = String(m.g || '').toLowerCase(); if (!GAME_RE.test(g)) return;
  const a = E.acctByKey(key); if (!a) return;
  E.earnA(a, 'gamewin', `Top-ten finish: ${g.replace(/[._-]+/g, ' ')}`);
}
// online wins in the JackNet Zone (mods/mp.js counts them once both players agree): pay the winner a little
function mpWins() {
  const W = ctx.state.mods && ctx.state.mods.mp && ctx.state.mods.mp.wins; if (!W) return;
  D.mps = D.mps || {};
  for (const key in W) {
    const n = W[key] && W[key].w | 0, seen = D.mps[key];
    if (seen == null) { D.mps[key] = n; ctx.markDirty(); continue; } // no back-pay for wins from before
    if (n > seen) { D.mps[key] = n; ctx.markDirty(); const a = E.acctByKey(key); if (a && memberName(key)) for (let i = 0; i < Math.min(3, n - seen); i++) E.earnA(a, 'mpwin', 'Won an online game in the JackNet Zone'); }
  }
}

// ---------------------------------------------------------------- dispatch
function handle(ws, c, m) {
  if (!c.grRl) c.grRl = new ctx.Bucket(3, 15);
  if (!c.grRl.take()) return;
  const key = c.member ? keyOf(c.member) : null;
  switch (m.t) {
    case 'grHunt': return ctx.send(ws, huntView(key));
    case 'grHof': return ctx.send(ws, Object.assign({}, hof(), { me: key ? meView(key) : null }));
    case 'grJobGo': return jobGo(ws, c, key, m);
    case 'grJobDone': return jobDone(ws, c, key, m);
  }
  if (!key) return ctx.send(ws, { t: 'grErr', msg: NEED, guest: 1 });
  switch (m.t) {
    case 'grMe': return ctx.send(ws, meView(key));
    case 'grClaim': return claim(ws, c, key, m);
    case 'grWin': return gameWin(ws, c, key, m);
  }
}

module.exports = {
  name: 'grind',
  types: ['grHunt', 'grClaim', 'grJobGo', 'grJobDone', 'grMe', 'grHof', 'grWin'],
  init(x) {
    ctx = x; D = x.data;
    // never reset: only fill in what's missing (old saves keep every field they had)
    D.v = D.v || 1; if (!D.p || typeof D.p !== 'object') D.p = {}; if (D.wk === undefined) D.wk = null; if (D.top === undefined) D.top = null;
    E = ECON.api; if (!E || !E.HOOKS) { console.error('grind: econ is missing'); return; }
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    // the rank rewards are JackLoot exclusives (never random): add them to the shared catalogue object
    for (const [, id, name, r, type, art, d] of G.RANK_LOOT) if (!LCAT.ITEM[id]) { const it = { id, name, r, type, art, d, ex: 1 }; LCAT.ITEMS.push(it); LCAT.ITEM[id] = it; }
    E.HOOKS.earn.push(onEarn);
    x.on('hello', (ws, c) => { ctx.send(ws, { t: 'grHi', rk: rankMap() }); const key = c.member && keyOf(c.member); if (key) ctx.send(ws, meView(key)); });
    x.on('login', c => { const key = keyOf(c.member); if (!key) return; const p = P(key); E.toMember(c.member, meView(key)); if (p.lv >= 2) ctx.broadcast({ t: 'grRk', n: c.member, lv: p.lv }); });
    x.on('score', onScore);
    setTimeout(() => { try { mpWins(); } catch (e) { console.error('grind mp', e); } }, 3000);
    setInterval(() => { try { mpWins(); } catch (e) { console.error('grind mp', e); } }, 15000);
  },
  handle, jobBook,
  _test: { get D() { return D; }, week, todays, P, addXp, hof, meView, mpWins },
};
