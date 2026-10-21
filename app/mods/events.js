/* events: JackNet Events for JACK ATTACK! Online (client: public/js/events*.js, numbers + music: public/js/events-cat.js).
 *   Weekly events on UK clock time (the PC's 1999 calendar): Hangout Theme Night, the Request Hour, LAN Night, the Grand
 *   Quiz Night and the monthly Cover CD Launch Party. The server starts and ends them, counts who is there, keeps the
 *   tallies (frags straight from the JackReal referee, QuizJack's right answers, party poppers) and pays the prizes
 *   through econ's earn path (daily caps) and loot's minting (so nothing comes from the browser).
 *     client -> { t:'evHi' }                 <- { t:'evHi', now, week:[{id,s,e,x}], live:[L] }
 *     client -> { t:'evHere', id, on }        (I am at that event: in the game / channel / room)
 *     client -> { t:'evAct', id, a }          ('pop' a party popper)          server -> { t:'evLive', L } / { t:'evStart', L } / { t:'evEnd', id, res }
 *   Radio Jack Listening Party: one playlist, played in sync. The server keeps the track start times; clients seek.
 *     { t:'radSync', c } <- { t:'radSync', c, s }    { t:'radSub', on }  { t:'radTune', on }  { t:'radReq', i, to, msg }
 *     server -> { t:'radNow', i, start, ded, q, n } / { t:'radCount', n } / { t:'radReqOk', pos } / { t:'radErr', msg }
 *   Byte, the communal pet:  { t:'bpGet' } { t:'bpSub', on } { t:'bpAct', a } -> { t:'bpView', pet, top, log, me } / { t:'bpSay', text, ok }
 *   The Millennium Vault (time capsules): { t:'capGet' } { t:'capBury', m, p } { t:'capWall', y, pg } { t:'capReport', y, id }
 *     -> { t:'capState', ... } / { t:'capWall', ... } / { t:'capOk' } / { t:'capErr', msg }
 *   The NO CARRIER puzzle trail: { t:'argMark', s } { t:'argTry', k, a } { t:'argHall' } -> { t:'argRes', k, ok, ... } / { t:'argHall', list }
 * Testing (only when the server runs with EVENTS_TEST=1): { t:'evForce', id, len, end } starts/ends an event now;
 *   { t:'evForce', k:'cap', v:'open'|'archive'|'' } simulates Y2K Night; { t:'evForce', k:'pet', v:'grow' }.
 * Data: state.mods.events = { v, ev:{done,hist}, rad:{i,start,q,bag,wall,last}, pet:{...}, cap:{y,list,arch,force}, arg:{hall,p} } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const EC = require(path.join(__dirname, '..', 'public', 'js', 'events-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const LCAT = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECON = require('./econ.js');

const TEST = process.env.EVENTS_TEST === '1';
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const keyOf = name => { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; };
const NEED = 'That is for JackNet members only. Joining is FREE: Start > Log Off, then pick a name and a password!';
const MIN = 60000, DAY = 864e5;
let ctx, D, E;

// our earn sources, added to econ's table (one bank, one set of daily caps; "drop" = the chance of a Lootling with it)
const EARN_ADD = {
  evgo: { amt: 10, cap: 3, drop: 0.2, label: 'Went to a JackNet event' },
  evwin: { amt: 25, cap: 4, drop: 0.35, label: 'Won a prize at a JackNet event' },
  capbury: { amt: 15, cap: 1, drop: 0.25, label: 'Buried a Millennium time capsule' },
  bytecare: { amt: 1, cap: 10, gap: 60, drop: 0.03, label: 'Looked after Byte' },
  bytemile: { amt: 10, cap: 5, drop: 0.3, label: 'Byte carer milestone' },
  bytegrow: { amt: 15, cap: 3, drop: 0.25, label: 'Helped Byte grow up' },
  argsolve: { amt: 150, cap: 1, drop: 1, label: 'Cracked the NO CARRIER mystery' },
};

// ---------------------------------------------------------------- UK clock + the 1999 calendar
const FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function ukp(ts) { const p = {}; for (const x of FMT.formatToParts(new Date(ts))) p[x.type] = x.value; return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second }; }
function ukTs(y, m, d, h, mi) { // UK wall-clock time -> timestamp (handles BST)
  const want = Date.UTC(y, m - 1, d, h, mi); let t = want;
  for (let i = 0; i < 3; i++) { const p = ukp(t); t += want - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi); }
  return t;
}
const d99 = (m, d) => Date.UTC(1999, m - 1, m === 2 && d === 29 ? 28 : d);
const dow99 = (m, d) => new Date(d99(m, d)).getUTCDay();
const night = ts => { const h = ukp(ts).h; return h >= 22 || h < 7; };

// ---------------------------------------------------------------- helpers
const byKeyClients = key => [...ctx.clients].filter(([, c]) => c.ready && c.member && keyOf(c.member) === key);
const toKey = (key, msg) => { const s = JSON.stringify(msg); for (const [ws] of byKeyClients(key)) ctx.send(ws, s); };
const nameOfKey = key => { const m = ctx.state.members[key]; return m ? m.name : null; };
const rl = (c, n, rate, burst) => { c.evRl = c.evRl || {}; if (!c.evRl[n]) c.evRl[n] = new ctx.Bucket(rate, burst); return c.evRl[n].take(); };
function acctFor(key) {
  for (const [, c] of byKeyClients(key)) { const a = E.acct(c); if (a) return a; }
  return E.acctByKey(key);
}
function pay(key, src, note, amt) { const a = acctFor(key); return a ? E.earnA(a, src, note, amt) : -1; }
function loot(key, minR, why) {
  try {
    const L = require('./loot.js')._test; if (!L || !acctFor(key)) return null;
    const id = L.roll(LCAT.RAR.map(r => r.wp), minR | 0); if (!id) return null;
    return L.give(key, L.mint(id, why), why);
  } catch (e) { console.error('events loot', e.message); return null; }
}
const sys = text => ctx.pushChat({ sys: true, text: String(text).slice(0, 300), ts: Date.now() });
const err = (ws, t, msg, x) => ctx.send(ws, Object.assign({ t, msg }, x || {}));

// ================================================================ WEEKLY EVENTS
const live = new Map(); // id -> L (memory only; a restart mid-event carries on with fresh tallies)
const DEF = {}; for (const e of EC.EVENTS) DEF[e.id] = e;
function occurs(ev, p) { // p = UK date parts; does ev happen on that date?
  if (dow99(p.m, p.d) !== ev.dow) return false;
  if (ev.first) return p.d <= 7;
  return true;
}
function week(from) {
  const out = [];
  for (let k = -1; k <= 8; k++) {
    const p = ukp(from + k * DAY);
    for (const ev of EC.EVENTS) {
      if (!occurs(ev, p)) continue;
      const s = ukTs(p.y, p.m, p.d, ev.h, ev.mi), e = s + ev.len * MIN;
      if (e <= from - 6 * 3600000) continue;
      const o = { id: ev.id, s, e, md: p.m * 100 + p.d };
      if (ev.id === 'theme') o.x = EC.themeOf(d99(p.m, p.d)).id;
      if (!out.some(q => q.id === o.id && q.s === o.s)) out.push(o);
    }
  }
  return out.sort((a, b) => a.s - b.s);
}
const liveView = L => ({ id: L.id, s: L.s, e: L.e, x: L.x || '', here: L.hereN | 0, who: L.who || [], board: L.board || [], meter: L.id === 'cd' ? [Math.floor(L.pops), L.target, L.launched ? 1 : 0] : null, forced: L.forced ? 1 : 0, tick: L.tick | 0 });
function hello(ws) { ctx.send(ws, { t: 'evHi', now: Date.now(), week: week(Date.now()).filter(o => o.e > Date.now() - 3600000), live: [...live.values()].map(liveView), hist: D.ev.hist.slice(-6), test: TEST ? 1 : 0 }); }

function startEvent(id, s, e, forced) {
  if (live.has(id)) return live.get(id);
  const ev = DEF[id];
  const L = { id, s, e, forced: !!forced, x: id === 'theme' ? EC.themeOf(d99(ukp(s).m, ukp(s).d)).id : '', ppl: new Map(), tally: new Map(), pops: 0, target: 60, launched: false, prompts: 0, hereN: 0, who: [], board: [], tick: 0 };
  live.set(id, L);
  const where = id === 'lan' ? 'Open JackReal Tournament and join any server!' : id === 'quiz' ? 'Type /join #quiznight in JackIRC (or Start > Run > quiznight).' : id === 'theme' ? `Tonight's theme: ${(EC.THEMES.find(t => t.id === L.x) || EC.THEMES[0]).n}. Come to the Hangout!` : id === 'cd' ? 'Pull a party popper at What\'s On (www.whatson.jnet)!' : 'Tune in at www.listeningparty.wubwub and send a request!';
  sys(`*** IT'S ON! ${ev.n} has started. ${where}`);
  ctx.broadcast({ t: 'evStart', L: liveView(L) });
  return L;
}
function personOf(L, c) {
  const k = c.member ? 'm:' + keyOf(c.member) : 'g:' + (c.cid || c.id);
  let p = L.ppl.get(k); if (!p) { p = { k, key: c.member ? keyOf(c.member) : null, n: c.nick, ms: 0 }; L.ppl.set(k, p); }
  p.n = c.nick; return p;
}
function tallyAdd(L, name, key, bot, n) {
  const k = key ? 'm:' + key : (bot ? 'b:' : 'g:') + name;
  let t = L.tally.get(k); if (!t) { t = { n: name, key, bot: !!bot, v: 0 }; L.tally.set(k, t); }
  t.v += n || 1; L.dirty = true;
}
const boardOf = L => [...L.tally.values()].sort((a, b) => b.v - a.v).slice(0, 10).map(t => [t.n, t.v, t.bot ? 1 : 0]);
const PART_MS = TEST ? 8000 : 5 * MIN;
const BOTS = ['Dave', 'Luke', 'Callum', "Nan's Cat", 'Dial-Up Dan', "Jack's Cousin", 'Lagmonster']; // shared by everyone, so roles, never a visitor's own cast name (js/cast.js)
function evTick() {
  const now = Date.now();
  // start anything that should be on now
  for (const o of week(now)) {
    if (now < o.s || now >= o.e || live.has(o.id)) continue;
    const key = o.id + ':' + o.s; if (D.ev.done[key]) continue;
    startEvent(o.id, o.s, o.e, false).dkey = key;
  }
  for (const L of [...live.values()]) {
    L.tick++;
    // who is here (counted every 5 seconds)
    const here = [...ctx.clients.values()].filter(c => c.ready && c.evHere === L.id);
    for (const c of here) personOf(L, c).ms += 5000;
    const n = here.length, who = here.slice(0, 14).map(c => c.nick);
    // the party: bots pull poppers too, so one or two people can still launch the disc
    if (L.id === 'cd' && !L.launched) {
      L.target = Math.max(60, 40 + 25 * n);
      if (Math.random() < 0.5) { L.pops += 1 + Math.floor(Math.random() * (n ? 2 : 3)); L.botPop = BOTS[Math.floor(Math.random() * BOTS.length)]; L.dirty = true; }
      if (L.pops >= L.target) { L.launched = true; L.dirty = true; sys('*** WHOOSH! THE COVER CD HAS LAUNCHED! Everyone at the party gets a goodie bag. Pop the disc in: Start > Run > covercd'); ctx.broadcast({ t: 'evLaunch', id: 'cd' }); }
    }
    // theme night: DJ Gubbinz asks the room something every half an hour
    if (L.id === 'theme' && L.prompts < 4 && now - L.s >= L.prompts * 30 * MIN) {
      const th = EC.THEMES.find(t => t.id === L.x) || EC.THEMES[0];
      if (L.prompts) sys(`*** DJ Gubbinz (${th.n}, in the Hangout): ${th.prompts[(L.prompts - 1) % th.prompts.length]}`);
      L.prompts++;
    }
    if (L.id === 'lan' && Math.random() < 0.1 && L.tally.size < 3) tallyAdd(L, BOTS[Math.floor(Math.random() * BOTS.length)] + ' (bot)', null, true, 1); // the bots are warming up
    const board = boardOf(L), changed = L.dirty || n !== L.hereN || who.join() !== L.who.join() || L.tick % 6 === 0;
    L.hereN = n; L.who = who; L.board = board; L.dirty = false;
    if (changed) ctx.broadcast({ t: 'evLive', L: Object.assign(liveView(L), { pop: L.botPop || '' }) });
    L.botPop = '';
    if (now >= L.e) endEvent(L);
  }
}
function endEvent(L) {
  live.delete(L.id);
  if (L.dkey) D.ev.done[L.dkey] = Date.now();
  const ev = DEF[L.id], res = { paid: [], win: [], launched: L.launched };
  const ppl = [...L.ppl.values()];
  // everyone who was really there (members) gets the turning-up Rupees
  for (const p of ppl) if (p.key && p.ms >= PART_MS) { const amt = pay(p.key, 'evgo', `${ev.short}: thanks for coming!`); if (amt >= 0) res.paid.push(nameOfKey(p.key) || p.n); }
  // the top three (members only: a guest's name is gone tomorrow; bots get a round of applause)
  const RW = [[25, 1], [15, 0], [10, 0]];
  if (L.id === 'lan' || L.id === 'quiz' || L.id === 'cd') {
    const top = [...L.tally.values()].filter(t => t.key && !t.bot && t.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
    top.forEach((t, i) => { pay(t.key, 'evwin', `${ev.short}: ${['1st', '2nd', '3rd'][i]} place!`, RW[i][0]); loot(t.key, RW[i][1], 'event'); res.win.push([nameOfKey(t.key) || t.n, t.v, i + 1]); });
  } else { // theme night / request hour: a spot prize for one member who was there
    const pool = ppl.filter(p => p.key && p.ms >= PART_MS);
    if (pool.length) { const p = pool[crypto.randomInt(0, pool.length)]; pay(p.key, 'evwin', `${ev.short}: spot prize!`, 20); loot(p.key, 1, 'event'); res.win.push([nameOfKey(p.key) || p.n, 0, 1]); }
  }
  if (L.id === 'cd' && L.launched) for (const p of ppl) if (p.key && p.ms >= PART_MS) { pay(p.key, 'evwin', 'Cover CD launched: goodie bag!', 10); }
  D.ev.hist.push({ id: L.id, s: L.s, at: Date.now(), n: ppl.length, win: res.win, x: L.x || '' }); if (D.ev.hist.length > 500) D.ev.hist.splice(0, D.ev.hist.length - 500);
  for (const k of Object.keys(D.ev.done)) if (Date.now() - D.ev.done[k] > 14 * DAY) delete D.ev.done[k];
  ctx.markDirty();
  const unit = L.id === 'lan' ? 'frags' : L.id === 'quiz' ? 'right' : 'pops';
  sys(`*** ${ev.n} is over! ${res.win.length ? (L.id === 'theme' || L.id === 'req' ? 'Spot prize: ' + res.win[0][0] + '!' : 'Winners: ' + res.win.map(w => `${w[2]}. ${w[0]} (${w[1]} ${unit})`).join(', ')) : 'Thanks to everyone who came!'} ${ppl.length} came along.`);
  ctx.broadcast({ t: 'evEnd', id: L.id, res, board: boardOf(L) });
}

// LAN Night: frags straight from the JackReal Tournament referee (shared with mods/loot.js; we chain after its hook)
function hookArena() {
  let AR = null; try { AR = require(path.join(__dirname, '..', 'public', 'js', 'pcgames-arena.js')); } catch (e) { return; }
  const RP = AR && AR.Referee && AR.Referee.prototype; if (!RP || RP._evHooked) return;
  RP._evHooked = true;
  const kill0 = RP.kill;
  RP.kill = function (k, v, w) {
    const r = kill0.apply(this, arguments);
    try {
      const L = live.get('lan');
      if (L && k && v && k !== v && w >= 0) {
        if (k.bot) tallyAdd(L, k.name + ' (bot)', null, true, 1);
        else { const c = [...ctx.clients.values()].find(x => x.id === k.id); tallyAdd(L, c ? c.nick : k.name, c && c.member ? keyOf(c.member) : null, false, 1); }
      }
    } catch (e) { console.error('events frag', e); }
    return r;
  };
}

// ================================================================ RADIO JACK LISTENING PARTY
const RAD_N = EC.TUNES.length;
function radNext(now) {
  const R = D.rad, prevEnd = R.start + EC.dur(R.i) * 1000 + EC.RADIO.gap * 1000;
  let ded = null, i;
  if (R.q.length) { const q = R.q.shift(); i = q.i; ded = { from: q.from, to: q.to, msg: q.msg, i }; }
  else {
    // the request hour: if nobody's asking, the regulars do (so it never feels empty)
    if (live.has('req') && Math.random() < 0.5) { const b = BOTS[crypto.randomInt(0, BOTS.length)], t2 = BOTS[crypto.randomInt(0, BOTS.length)]; i = crypto.randomInt(0, RAD_N); ded = { from: b, to: t2 === b ? 'everyone' : t2, msg: ['Happy Thursday!', 'Turn it UP!', 'For the bus stop crew', 'Sorry about your Tamagotchi', 'You are ace', 'Miss you at school'][crypto.randomInt(0, 6)], i, bot: 1 }; }
    else { if (!R.bag.length) { R.bag = [...Array(RAD_N).keys()].filter(x => x !== R.i); for (let k = R.bag.length - 1; k > 0; k--) { const j = crypto.randomInt(0, k + 1); [R.bag[k], R.bag[j]] = [R.bag[j], R.bag[k]]; } } i = R.bag.shift(); }
  }
  R.i = i; R.start = now - prevEnd < 30000 && now >= prevEnd ? prevEnd : now; R.ded = ded;
  if (ded) { R.wall.push(Object.assign({ at: now }, ded)); if (R.wall.length > 12) R.wall.splice(0, R.wall.length - 12); }
  R.played.push([i, R.start]); if (R.played.length > 10) R.played.shift();
  ctx.markDirty();
  radBroadcast();
}
const radQ = () => D.rad.q.map(q => [q.i, q.from, q.to]);
const radView = () => ({ t: 'radNow', i: D.rad.i, start: D.rad.start, ded: D.rad.ded, q: radQ(), wall: D.rad.wall.slice(-8), n: radCount(), now: Date.now(), hour: live.has('req') ? 1 : 0 });
const radCount = () => [...ctx.clients.values()].filter(c => c.ready && c.radOn).length;
function radBroadcast() { const s = JSON.stringify(radView()); for (const [ws, c] of ctx.clients) if (c.ready && (c.radSub || c.radOn)) ctx.send(ws, s); }
let radLastN = -1;
function radCountSend() { const n = radCount(); if (n === radLastN) return; radLastN = n; const s = JSON.stringify({ t: 'radCount', n }); for (const [ws, c] of ctx.clients) if (c.ready && (c.radSub || c.radOn)) ctx.send(ws, s); }
function radTick() {
  const now = Date.now(), R = D.rad;
  if (!(R.i >= 0 && R.i < RAD_N) || !R.start) { R.i = 0; R.start = now; }
  if (now >= R.start + EC.dur(R.i) * 1000 + EC.RADIO.gap * 1000) radNext(now);
}
function radReq(ws, c, m) {
  const key = c.member && keyOf(c.member); if (!key) return err(ws, 'radErr', NEED, { guest: 1 });
  if (!rl(c, 'rq', 0.2, 2)) return err(ws, 'radErr', 'Slow down! The DJ only has one pair of hands.');
  const i = m.i | 0; if (!(i >= 0 && i < RAD_N) || !Number.isInteger(m.i)) return err(ws, 'radErr', 'That tune is not in the record box.');
  const R = D.rad, now = Date.now(), gap = (live.has('req') ? EC.RADIO.reqGapHour : EC.RADIO.reqGap) * 1000;
  const last = R.last[key] || 0;
  if (now - last < gap) return err(ws, 'radErr', `You can send another request in ${Math.ceil((gap - (now - last)) / 60000)} minute(s). ${live.has('req') ? '' : 'During the Request Hour (Thursdays, 8pm) they come round much faster!'}`);
  if (R.q.some(q => q.key === key)) return err(ws, 'radErr', 'You already have a request in the queue. Wait for it to play!');
  if (R.q.length >= EC.RADIO.qMax) return err(ws, 'radErr', 'The request queue is full. Try again in a few tunes!');
  const to = ctx.delink(ctx.clean(m.to, EC.RADIO.toMax)).replace(/[\r\n]/g, ' ') || 'everyone';
  const msg = ctx.delink(ctx.clean(m.msg, EC.RADIO.msgMax)).replace(/[\r\n]/g, ' ');
  R.q.push({ i, from: c.member, to, msg, at: now, key }); R.last[key] = now;
  for (const k of Object.keys(R.last)) if (now - R.last[k] > DAY) delete R.last[k];
  ctx.markDirty();
  ctx.send(ws, { t: 'radReqOk', pos: R.q.length });
  radBroadcast();
}

// ================================================================ BYTE, THE COMMUNAL PET
const PS = EC.PET.STAGES;
function petInit() {
  if (!D.pet || typeof D.pet !== 'object') D.pet = { born: Date.now(), st: 0, xp: 0, f: 75, p: 75, c: 80, e: 85, care: {}, log: [], grown: [[0, Date.now()]], said: '' };
}
function petTick() {
  const P = D.pet, nt = night(Date.now()), cl = v => Math.max(0, Math.min(100, v));
  if (P.st === 0) return; // eggs don't get hungry
  P.f = cl(P.f - (nt ? 0.12 : 0.3)); P.p = cl(P.p - (nt ? 0.1 : 0.42)); P.c = cl(P.c - 0.16);
  P.e = cl(P.e + (nt ? 1.1 : -0.18));
  ctx.markDirty();
}
function petMood() { return EC.mood(D.pet, night(Date.now())); }
function petView(key) {
  const P = D.pet;
  const top = Object.entries(P.care).filter(([k]) => ctx.state.members[k]).sort((a, b) => b[1].pts - a[1].pts).slice(0, 10).map(([k, v]) => [nameOfKey(k), v.pts]);
  const mine = key && P.care[key] ? { pts: P.care[key].pts, cd: P.care[key].last || {}, ms: P.care[key].ms | 0 } : null;
  return { t: 'bpView', pet: { st: P.st, xp: P.xp, f: Math.round(P.f), p: Math.round(P.p), c: Math.round(P.c), e: Math.round(P.e), born: P.born, mood: petMood(), night: night(Date.now()) ? 1 : 0, grown: P.grown, carers: Object.keys(P.care).length }, top, log: P.log.slice(-10), me: mine, now: Date.now() };
}
function petSend(only) {
  if (only) return ctx.send(only[0], petView(only[1]));
  for (const [ws, c] of ctx.clients) if (c.ready && c.bpSub) ctx.send(ws, petView(c.member && keyOf(c.member)));
}
function petGrowCheck(force) {
  const P = D.pet, next = PS[P.st + 1]; if (!next) return;
  if (!force && (P.xp < next.xp || (!TEST && Date.now() - P.born < next.days * DAY))) return;
  P.st++; P.grown.push([P.st, Date.now()]);
  sys(`*** BYTE HAS GROWN UP! The JackNet's pet is now a ${next.n.toUpperCase()}! Thanks, everybody. (www.bytepet.jnet)`);
  // everyone who cared during the last stage gets a little something
  for (const [k, v] of Object.entries(P.care)) if (v.sp > 0) { pay(k, 'bytegrow', `Byte grew into a ${next.n}!`); v.sp = 0; }
  ctx.broadcast({ t: 'bpGrow', st: P.st });
  ctx.markDirty();
}
function petAct(ws, c, m) {
  const key = c.member && keyOf(c.member);
  if (!key) return ctx.send(ws, { t: 'bpSay', ok: 0, guest: 1, text: 'Byte waves at you! (Only JackNet members can feed and play with Byte. Joining is FREE.)' });
  if (!rl(c, 'bp', 1, 4)) return;
  const A = EC.PET.ACT[m.a]; if (!A || !own(EC.PET.ACT, m.a)) return;
  const P = D.pet, now = Date.now(), me = P.care[key] = P.care[key] || { pts: 0, last: {}, ms: 0, sp: 0 };
  const cd = A.cd * 1000 / (TEST ? 30 : 1), last = me.last[m.a] || 0;
  if (now - last < cd) { const s = Math.ceil((cd - (now - last)) / 1000); return ctx.send(ws, { t: 'bpSay', ok: 0, text: `You can ${A.n.toLowerCase()} Byte again in ${s >= 60 ? Math.ceil(s / 60) + ' minute(s)' : s + ' seconds'}. Let someone else have a go!` }); }
  let text, item = '';
  if (P.st === 0) { // the egg: any kindness keeps it warm
    me.last[m.a] = now; P.xp += 1; me.pts += 1; me.sp = (me.sp | 0) + 1;
    text = ['You keep the egg warm. It hums happily.', 'You put a crisp next to the egg. It appreciates the thought.', 'The egg wobbles! Something is in there.', 'You polish the egg. It is very shiny now.', 'You tell the egg a joke. It does not laugh. It is an egg.'][crypto.randomInt(0, 5)];
  } else {
    const val = P[A.stat];
    if (val >= A.full) return ctx.send(ws, { t: 'bpSay', ok: 0, text: { feed: 'Byte is stuffed! Maybe later.', play: 'Byte is all played out (happy though).', clean: 'Byte is already squeaky clean!', tuck: 'Byte is wide awake! Not tired at all.', pat: 'Byte is happy already!' }[m.a] });
    if (m.a === 'play' && P.e < 12) return ctx.send(ws, { t: 'bpSay', ok: 0, text: 'Byte is too sleepy to play. Maybe tuck Byte in?' });
    me.last[m.a] = now;
    P[A.stat] = Math.min(100, val + A.add);
    if (m.a === 'play') P.e = Math.max(0, P.e - 4);
    if (m.a === 'feed') item = EC.PET.SNACKS[crypto.randomInt(0, EC.PET.SNACKS.length)];
    if (m.a === 'play') item = EC.PET.TOYS[crypto.randomInt(0, EC.PET.TOYS.length)];
    P.xp += A.pts; me.pts += A.pts; me.sp = (me.sp | 0) + A.pts;
    text = { feed: `You gave Byte ${item}. Nom nom nom!`, play: `You played with Byte: ${item}!`, clean: 'Scrub scrub! Byte is sparkly clean.', pat: 'You pat Byte. Byte does a happy wiggle.', tuck: 'You tuck Byte in with a little blanket. Zzz...' }[m.a];
  }
  P.log.push([now, c.member, m.a, item]); if (P.log.length > 30) P.log.splice(0, P.log.length - 30);
  pay(key, 'bytecare', 'Looked after Byte');
  // milestones for carers
  const MS = EC.PET.MILES;
  while ((me.ms | 0) < MS.length && me.pts >= MS[me.ms | 0][0]) { const [pts, amt] = MS[me.ms | 0]; me.ms = (me.ms | 0) + 1; pay(key, 'bytemile', `Byte carer: ${pts} care points!`, amt); if (me.ms >= 3) loot(key, me.ms >= 5 ? 2 : 1, 'byte'); ctx.send(ws, { t: 'bpMile', pts, amt }); }
  ctx.markDirty();
  ctx.send(ws, { t: 'bpSay', ok: 1, text, a: m.a });
  petGrowCheck(false);
  ctx.broadcast({ t: 'bpPing', n: c.member, a: m.a }); // trays animate
  petSend();
}

// ================================================================ THE MILLENNIUM VAULT (time capsules)
const CAP_MAX = 3000, MSG_MAX = 280, PIC_RE = /^[0-9a-f]{768}$/;
const capNo = y => y - 2025; // the first Millennium on this site
function capInit() {
  const y = ukp(Date.now()).y;
  if (!D.cap || typeof D.cap !== 'object') D.cap = { y, list: {}, arch: {}, force: '' };
  if (!D.cap.arch) D.cap.arch = {};
}
function capArchive(now) { // the year turned over: the old capsule goes in the archive (it is opened all of 01/01)
  const C = D.cap;
  const entries = Object.entries(C.list).map(([k, v]) => Object.assign({ k }, v)).sort((a, b) => a.at - b.at);
  const prev = C.arch[C.y]; // never overwrite an archived capsule: add to it (the database is sacred)
  C.arch[C.y] = prev ? Object.assign(prev, { list: prev.list.concat(entries.filter(e => !prev.list.some(q => q.k === e.k && q.at === e.at))), at: now }) : { list: entries, at: now, no: capNo(C.y) };
  C.list = {}; C.y = ukp(now).y; C.force = '';
  ctx.markDirty();
  sys(`*** THE MILLENNIUM VAULT IS OPEN! ${entries.length} time capsule(s) from 1999 have been dug up. Read them all at www.millenniumvault.jnet`);
  ctx.broadcast({ t: 'capOpen', y: Object.keys(C.arch).map(Number).sort((a, b) => b - a)[0] });
}
function capPhase(now) {
  const p = ukp(now), C = D.cap;
  if (C.force === 'open') return { st: 'open', wallY: C.y, buryY: 0 };
  if (p.m === 1 && p.d === 1) { const wy = p.y - 1; return { st: 'open', wallY: C.arch[wy] ? wy : C.y, buryY: p.y }; }
  if (p.m === 12 && p.d === 31 && p.h >= 23) return { st: 'closing', wallY: 0, buryY: 0 };
  return { st: 'sealed', wallY: 0, buryY: p.y };
}
function capTick() { const p = ukp(Date.now()); if (p.y > D.cap.y) capArchive(Date.now()); }
const entryId = (y, k) => crypto.createHash('sha256').update('cap' + y + ':' + k).digest('hex').slice(0, 8);
function capWallList(y) {
  const C = D.cap;
  const src = C.arch[y] ? C.arch[y].list : y === C.y ? Object.entries(C.list).map(([k, v]) => Object.assign({ k }, v)).sort((a, b) => a.at - b.at) : [];
  return src.filter(e => !e.h && !(e.rep && e.rep.length >= 3));
}
function capState(ws, c) {
  const C = D.cap, now = Date.now(), ph = capPhase(now), key = c.member && keyOf(c.member);
  const mine = key && C.list[key] ? { m: C.list[key].m, p: C.list[key].p, at: C.list[key].at } : null;
  const names = Object.values(C.list).slice(-60).map(v => v.n);
  const arch = Object.keys(C.arch).map(Number).sort((a, b) => b - a).map(y => [y, C.arch[y].no || capNo(y), capWallList(y).length]);
  ctx.send(ws, { t: 'capState', st: ph.st, wallY: ph.wallY, wallNo: ph.wallY ? capNo(ph.wallY) : 0, y: C.y, no: capNo(C.y), n: Object.keys(C.list).length, names, mine, arch, now, test: TEST ? 1 : 0 });
}
function capBury(ws, c, m) {
  const key = c.member && keyOf(c.member); if (!key) return err(ws, 'capErr', NEED, { guest: 1 });
  if (!rl(c, 'cap', 0.1, 3)) return err(ws, 'capErr', 'Slow down! The shovel needs a rest.');
  const C = D.cap, ph = capPhase(Date.now());
  if (ph.st === 'closing') return err(ws, 'capErr', 'The vault door is closing for the Millennium! Come back at midnight to see everyone\'s capsules.');
  if (ph.st === 'open' && C.force === 'open') return err(ws, 'capErr', 'The vault is open right now! Read everyone\'s capsules. You can bury a new one tomorrow.');
  let msg = String(m.m == null ? '' : m.m).replace(/\r\n?/g, '\n').split('\n').slice(0, 6).map(l => ctx.delink(ctx.clean(l, MSG_MAX))).join('\n').trim().slice(0, MSG_MAX);
  const pic = typeof m.p === 'string' && PIC_RE.test(m.p) && /[^0]/.test(m.p) ? m.p : '';
  if (msg.length < 3) return err(ws, 'capErr', 'Write a message first! (At least a few letters.)');
  const had = !!C.list[key];
  if (!had && Object.keys(C.list).length >= CAP_MAX) return err(ws, 'capErr', 'The vault is FULL! (3,000 capsules. That is a lot of capsules.)');
  C.list[key] = { n: c.member, m: msg, p: pic, at: Date.now(), rep: [] };
  ctx.markDirty();
  if (!had) pay(key, 'capbury', 'Buried a time capsule in the Millennium Vault');
  ctx.send(ws, { t: 'capOk', re: had ? 1 : 0 });
  ctx.broadcast({ t: 'capN', n: Object.keys(C.list).length, by: c.member });
}
function capWall(ws, c, m) {
  if (!rl(c, 'cw', 2, 8)) return;
  const C = D.cap, y = m.y | 0, ph = capPhase(Date.now());
  const ok = C.arch[y] || (ph.st === 'open' && y === ph.wallY);
  if (!ok) return err(ws, 'capErr', 'That capsule is still sealed! It opens on Y2K Night.');
  const list = capWallList(y), per = 24, pages = Math.max(1, Math.ceil(list.length / per)), pg = Math.max(0, Math.min(pages - 1, m.pg | 0));
  ctx.send(ws, { t: 'capWall', y, no: capNo(y), pg, pages, n: list.length, list: list.slice(pg * per, pg * per + per).map(e => ({ id: entryId(y, e.k), n: e.n, m: e.m, p: e.p, at: e.at })) });
}
function capReport(ws, c, m) {
  const key = c.member && keyOf(c.member); if (!key) return err(ws, 'capErr', NEED, { guest: 1 });
  if (!rl(c, 'cr', 0.2, 3)) return;
  const C = D.cap, y = m.y | 0, id = String(m.id || '').slice(0, 8);
  const src = C.arch[y] ? C.arch[y].list : y === C.y ? Object.entries(C.list).map(([k, v]) => { v.k = k; return v; }) : [];
  const e = src.find(x => entryId(y, x.k) === id); if (!e) return;
  e.rep = e.rep || []; if (!e.rep.includes(key) && e.k !== key) e.rep.push(key);
  ctx.markDirty(); ctx.send(ws, { t: 'capOk', rep: 1 });
}

// ================================================================ THE NO CARRIER PUZZLE TRAIL
// The answers live here (the browser only ever sends what you typed). Normalised: lower case letters/numbers/spaces.
const ARG = { bbs: ['nightowl', 'handshake'], nest: 'never hang up', start: 2 };
const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
function argTry(ws, c, m) {
  if (!rl(c, 'arg', 0.4, 5)) return ctx.send(ws, { t: 'argRes', k: String(m.k || ''), ok: 0, slow: 1 });
  const key = c.member && keyOf(c.member);
  if (m.k === 'bbs') {
    const u = norm(m.u), p = norm(m.a), ok = u === ARG.bbs[0] && p === ARG.bbs[1];
    return ctx.send(ws, { t: 'argRes', k: 'bbs', ok: ok ? 1 : 0, user: ok ? 'NIGHTOWL' : '' });
  }
  if (m.k === 'nest') {
    const ok = norm(m.a) === ARG.nest;
    if (!ok) return ctx.send(ws, { t: 'argRes', k: 'nest', ok: 0 });
    const A = D.arg; let pos = 0, fresh = false;
    if (key) {
      const had = A.hall.findIndex(h => keyOf(h.n) === key);
      if (had >= 0) pos = had + 1;
      else {
        const t0 = (A.p[key] && A.p[key].t0) || c.argT0 || Date.now();
        A.hall.push({ n: c.member, at: Date.now(), t0, dur: Math.max(0, Date.now() - t0) }); pos = A.hall.length; fresh = true;
        delete A.p[key];
        ctx.markDirty();
        pay(key, 'argsolve', 'Cracked the NO CARRIER mystery!'); loot(key, 2, 'puzzle');
        sys(`*** NO CARRIER... CARRIER DETECTED! ${c.member} has cracked NIGHTOWL's puzzle trail and signed the Hall of Puzzlers (Puzzler #${pos}).`);
      }
    } else A.guests = (A.guests | 0) + 1;
    return ctx.send(ws, { t: 'argRes', k: 'nest', ok: 1, pos, fresh: fresh ? 1 : 0, member: key ? 1 : 0, hall: hallView() });
  }
}
const hallView = () => D.arg.hall.slice(0, 200).map((h, i) => [i + 1, h.n, h.at, h.dur]);

// ================================================================ dispatch
function handle(ws, c, m) {
  if (!rl(c, 'all', 8, 30)) return;
  const key = c.member && keyOf(c.member);
  switch (m.t) {
    case 'evHi': return hello(ws);
    case 'evHere': { const id = typeof m.id === 'string' && DEF[m.id] ? m.id : ''; c.evHere = m.on && id ? id : (c.evHere === id || !id ? '' : c.evHere); return; }
    case 'evAct': {
      const L = live.get(m.id); if (!L) return;
      if (L.id === 'cd' && m.a === 'pop' && rl(c, 'pop', 0.6, 3)) { L.pops++; tallyAdd(L, c.nick, key, false, 1); personOf(L, c); c.evHere = 'cd'; }
      return;
    }
    case 'evForce': {
      if (!TEST) return;
      if (m.k === 'cap') { if (m.v === 'archive') capArchive(Date.now()); else { D.cap.force = m.v === 'open' ? 'open' : ''; if (m.v === 'open') ctx.broadcast({ t: 'capOpen', y: D.cap.y }); } ctx.markDirty(); return capState(ws, c); }
      if (m.k === 'pet') { if (m.v === 'grow') petGrowCheck(true); return petSend(); }
      if (!DEF[m.id]) return;
      if (m.end) { const L = live.get(m.id); if (L) { L.e = Date.now(); endEvent(L); } return; }
      const len = Math.max(0.2, Math.min(120, +m.len || 5)) * MIN;
      startEvent(m.id, Date.now(), Date.now() + len, true);
      return;
    }
    case 'radSync': if (rl(c, 'rs', 2, 8)) ctx.send(ws, { t: 'radSync', c: +m.c || 0, s: Date.now() }); return;
    case 'radSub': c.radSub = !!m.on; if (m.on) ctx.send(ws, radView()); return radCountSend();
    case 'radTune': c.radOn = !!m.on; c.evHere = m.on && live.has('req') ? 'req' : (c.evHere === 'req' ? '' : c.evHere); return radCountSend();
    case 'radReq': return radReq(ws, c, m);
    case 'bpGet': return ctx.send(ws, petView(key));
    case 'bpSub': c.bpSub = !!m.on; if (m.on) ctx.send(ws, petView(key)); return;
    case 'bpAct': return petAct(ws, c, m);
    case 'capGet': return capState(ws, c);
    case 'capBury': return capBury(ws, c, m);
    case 'capWall': return capWall(ws, c, m);
    case 'capReport': return capReport(ws, c, m);
    case 'argMark': {
      const s = m.s | 0; if (s < ARG.start || s > 14) return;
      if (key) { const p = D.arg.p[key] = D.arg.p[key] || {}; if (!p.t0) { p.t0 = Date.now(); ctx.markDirty(); } p.s = Math.max(p.s | 0, s); }
      else if (!c.argT0) c.argT0 = Date.now();
      return;
    }
    case 'argTry': return argTry(ws, c, m);
    case 'argHall': if (rl(c, 'ah', 0.5, 4)) ctx.send(ws, { t: 'argHall', list: hallView(), n: D.arg.hall.length }); return;
  }
}

module.exports = {
  name: 'events',
  types: ['evHi', 'evHere', 'evAct', 'evForce', 'radSync', 'radSub', 'radTune', 'radReq', 'bpGet', 'bpSub', 'bpAct', 'capGet', 'capBury', 'capWall', 'capReport', 'argMark', 'argTry', 'argHall'],
  init(x) {
    ctx = x; D = x.data;
    D.v = 1;
    D.ev = D.ev || {}; D.ev.done = D.ev.done || {}; D.ev.hist = D.ev.hist || [];
    D.rad = D.rad || {}; const R = D.rad; R.i = R.i | 0; R.start = R.start || Date.now(); R.q = Array.isArray(R.q) ? R.q : []; R.bag = Array.isArray(R.bag) ? R.bag : []; R.wall = Array.isArray(R.wall) ? R.wall : []; R.last = R.last || {}; R.played = R.played || []; R.ded = R.ded || null;
    petInit(); capInit();
    D.arg = D.arg || {}; D.arg.hall = D.arg.hall || []; D.arg.p = D.arg.p || {};
    E = ECON.api; if (!E || !E.HOOKS) { console.error('events: econ is missing'); return; }
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    x.on('hello', (ws) => hello(ws));
    x.on('close', c => { if (c.radOn) { c.radOn = false; setTimeout(radCountSend, 50); } });
    x.on('quiz', c => { const L = live.get('quiz'); if (L) tallyAdd(L, c.nick, c.member ? keyOf(c.member) : null, false, 1); });
    hookArena();
    setInterval(() => { try { evTick(); } catch (e) { console.error('events tick', e); } }, 5000);
    setInterval(() => { try { radTick(); radCountSend(); } catch (e) { console.error('events radio', e); } }, 1000);
    setInterval(() => { try { petTick(); petSend(); } catch (e) { console.error('events pet', e); } }, MIN);
    setInterval(() => { try { capTick(); } catch (e) { console.error('events cap', e); } }, 30000);
    if (TEST) console.log('events: EVENTS_TEST is on (evForce allowed)');
  },
  handle,
  _test: { get D() { return D; }, week, ukp, ukTs, dow99, live, endEvent, startEvent, petGrowCheck, capArchive, capPhase },
};
