/* ch: MOM'S JOBS, done for real round Jack's 3D house (js/ch-*.js; the catalogue is public/js/ch-cat.js). The browser
 * never says what it should be paid. It says which step of which job it just did; the server knows today's steps for
 * every job (they come from the date), checks each one came no quicker than a person could do it, and when the last one
 * lands works out Mom's rating from its own clock and books the round through mods/grind.js (the same Pocket Money job
 * keys as before: washup/tidy/car keep their history, bests, Hall of Fame, streaks and the Job of the Day). Jobs on
 * today's list pay in full, a few extras pay a bit, every job pays once a day, all through econ's capped 'job' source.
 * Guests can do every job (the browser keeps their progress) but only members get paid.
 *   client -> { t:'chMe' }                <- { t:'chMe', day, list, done:{id:{sc,amt}}, prog:{id:[step]}, member, extras, all }
 *   client -> { t:'chGo', c }             (starting a job: the clock starts)            <- { t:'chGo', c, prog }
 *   client -> { t:'chStep', c, s, o }     (a step done; o = little accidents, 0..3)     <- { t:'chStep', c, s, n, of }
 *                                         and after the last step                       <- { t:'chDone', c, sc, amt, list, bonus, mom, bad? }
 * Data: state.mods.ch = { v, p:{memberKey: { day, done:{id:{sc,amt,t}}, run:{id:{t0,last,got:{s:ts},bad,oops}}, extras, all,
 *   n:{id:times}, best:{id:sc}, tot, hist:[[day, jobs, Rupees]] }} } (THE DATABASE IS SACRED: only ever added to) */
'use strict';
const path = require('path');
const CH = require(path.join(__dirname, '..', 'public', 'js', 'ch-cat.js'));
const GCAT = require(path.join(__dirname, '..', 'public', 'js', 'grind-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');
CH.augment(GCAT); // the new jobs go into the shared Pocket Money table straight away (grind's Hall of Fame lists them)

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const EARN_ADD = { chall: { amt: CH.ALLBONUS, cap: 1, drop: 0.2, label: "Did every job on Mom's list" } };
let ctx, D, E;

const today = () => E.uk().day;
const keyOf = c => { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) || !ctx.state.members[k] ? null : k; };
let listDay = '', listNow = [];
const listToday = () => { const d = today(); if (d !== listDay) { listDay = d; listNow = CH.listFor(d); } return listNow; };
const stepCache = new Map(); // 'day|id' -> { ids:Set, g:{s:secs}, n }
function stepsOf(id, day) {
  const k = day + '|' + id; let v = stepCache.get(k);
  if (!v) { const L = CH.steps(id, day); v = { ids: new Set(L.map(x => x.s)), g: {}, n: L.length }; for (const x of L) v.g[x.s] = x.g; stepCache.set(k, v); if (stepCache.size > 200) stepCache.delete(stepCache.keys().next().value); }
  return v;
}
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') { p = D.p[key] = { day: '', done: {}, run: {}, extras: 0, all: 0, n: {}, best: {}, tot: 0, hist: [] }; ctx.markDirty(); }
  if (!p.done || typeof p.done !== 'object') p.done = {};
  if (!p.run || typeof p.run !== 'object') p.run = {};
  if (!p.n || typeof p.n !== 'object') p.n = {};
  if (!p.best || typeof p.best !== 'object') p.best = {};
  if (!Array.isArray(p.hist)) p.hist = [];
  p.tot = p.tot | 0; p.extras = p.extras | 0; p.all = p.all | 0;
  const d = today();
  if (p.day !== d) { // a new day: yesterday goes in the history book, today starts clean
    const nd = Object.keys(p.done).length;
    if (p.day && nd) { p.hist.push([p.day, nd, Object.values(p.done).reduce((s, x) => s + (x.amt | 0), 0)]); if (p.hist.length > 120) p.hist.splice(0, p.hist.length - 120); }
    p.day = d; p.done = {}; p.run = {}; p.extras = 0; p.all = 0; ctx.markDirty();
  }
  return p;
}
function meView(key) {
  const d = today(), list = listToday();
  if (!key) return { t: 'chMe', day: d, list, done: {}, prog: {}, member: false };
  const p = P(key), prog = {};
  for (const id in p.run) prog[id] = Object.keys(p.run[id].got || {});
  const done = {}; for (const id in p.done) done[id] = { sc: p.done[id].sc | 0, amt: p.done[id].amt | 0, cashPence:p.done[id].cashPence, bad: p.done[id].bad ? 1 : 0 };
  return { t: 'chMe', day: d, list, done, prog, member: true, extras: p.extras, all: p.all };
}
const okChore = id => own(CH.CHORE, id) && CH.AREAS[CH.CHORE[id].area];

function go(ws, c, key, m) {
  const id = String(m.c || ''); if (!okChore(id)) return;
  const p = P(key); if (p.done[id]) return ctx.send(ws, { t: 'chGo', c: id, done: 1 });
  let r = p.run[id];
  if (!r) { r = p.run[id] = { t0: Date.now(), last: Date.now(), got: {}, bad: 0, oops: 0 }; ctx.markDirty(); }
  ctx.send(ws, { t: 'chGo', c: id, prog: Object.keys(r.got) });
}
function step(ws, c, key, m) {
  const id = String(m.c || ''), s = String(m.s || '').slice(0, 24); if (!okChore(id)) return;
  const d = today(), st = stepsOf(id, d); if (!st.ids.has(s)) return;
  const p = P(key); if (p.done[id]) return;
  const now = Date.now();
  let r = p.run[id];
  if (!r) r = p.run[id] = { t0: now - st.g[s] * 1000, last: now - st.g[s] * 1000, got: {}, bad: 0, oops: 0 }; // (a step with no start: the clock starts a step ago)
  if (r.got[s]) return ctx.send(ws, { t: 'chStep', c: id, s, n: Object.keys(r.got).length, of: st.n, again: 1 });
  if (now - r.last < st.g[s] * 1000 * 0.85) r.bad++; // quicker than anybody could: Mom won't pay for that
  r.got[s] = now; r.last = now; r.oops = Math.min(9, (r.oops | 0) + Math.max(0, Math.min(3, m.o | 0)));
  ctx.markDirty();
  const n = Object.keys(r.got).length;
  ctx.send(ws, { t: 'chStep', c: id, s, n, of: st.n });
  if (n >= st.n) finish(ws, c, key, p, id, r);
}
function finish(ws, c, key, p, id, r) {
  const C = CH.CHORE[id], secs = (r.last - r.t0) / 1000, list = listToday(), onList = list.includes(id);
  delete p.run[id];
  if (r.bad || secs < C.min) {
    p.done[id] = { sc: 0, amt: 0, bad: 1, t: Date.now() }; ctx.markDirty();
    return ctx.send(ws, { t: 'chDone', c: id, sc: 0, amt: 0, bad: 1, list: onList });
  }
  const sc = CH.rating(id, secs, r.oops);
  let want = CH.payFor(id, sc, onList);
  if (!onList) { if (p.extras >= CH.EXTRAS) want = 0; else p.extras++; }
  let amt = 0, pb = false;
  try {
    const G = require('./grind.js');
    if (G && G.jobBook) { const b = G.jobBook(c, key, C.job, sc, want, `Mom's jobs: ${C.n} (${sc}%)`); amt = b.amt | 0; pb = !!b.pb; }
    else { const a = E.acctByKey(key); if (a && want > 0) amt = Math.max(0, E.earnA(a, 'job', `Mom's jobs: ${C.n}`, want)); }
  } catch (e) { console.error('ch book', e.message); }
  p.done[id] = { sc, amt, cashPence:amt*5, t: Date.now() }; p.n[id] = (p.n[id] | 0) + 1; p.tot += amt;
  if (sc > (p.best[id] | 0)) p.best[id] = sc;
  let bonus = 0;
  if (onList && !p.all && list.every(x => p.done[x] && !p.done[x].bad)) {
    p.all = 1; const a = E.acctByKey(key); if (a) bonus = Math.max(0, E.earnA(a, 'chall', "Every job on Mom's list done!")); p.tot += bonus;
  }
  ctx.markDirty();
  ctx.send(ws, { t: 'chDone', c: id, sc, amt, cashPence:amt*5, want, list: onList, bonus, bonusPence:bonus*5, pb, mom: CH.momSays(sc, p.n[id] + (p.tot % 7)), extras: p.extras });
}

function handle(ws, c, m) {
  if (!c.chRl) c.chRl = new ctx.Bucket(5, 20);
  if (!c.chRl.take()) return;
  const key = keyOf(c);
  if (m.t === 'chMe') return ctx.send(ws, meView(key));
  if (!key) return ctx.send(ws, { t: 'chGuest', c: String(m.c || '').slice(0, 16) });
  if (m.t === 'chGo') return go(ws, c, key, m);
  if (m.t === 'chStep') return step(ws, c, key, m);
}

module.exports = {
  name: 'ch',
  types: ['chMe', 'chGo', 'chStep'],
  init(x) {
    ctx = x; D = x.data;
    D.v = D.v || 1; if (!D.p || typeof D.p !== 'object') D.p = {}; // never reset: only fill in what's missing
    E = ECON.api;
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    x.on('login', cc => { const key = keyOf(cc); if (key) E.toMember(cc.member, meView(key)); });
  },
  handle,
  _test: { get D() { return D; }, P, listToday, stepsOf },
};
