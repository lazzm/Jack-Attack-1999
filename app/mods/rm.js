/* rm: Jack's bedroom (the room round the family PC, js/rm-room.js). The games consoles' high-score tables, what each
 * member has found in the room, and the daily hunt for Mom's lost change. The catalogue is public/js/rm-cat.js.
 * Money only moves through econ's earn path (daily caps, halves and gaps, loot drops ride on it). The browser never says
 * how much it should get: it says which game it played (with the token the server gave it when the game started) and
 * the score, and the server checks the run lasted long enough and the score is possible in that time.
 *   client -> { t:'rmMe' }                       <- { t:'rmMe', f:{id:ts}, best:{g:sc}, coin:{clue, got}, member }
 *   client -> { t:'rmGo', g }                    <- { t:'rmGo', g, tok }
 *   client -> { t:'rmDone', g, tok, sc }         <- { t:'rmDone', g, sc, amt, best, pb, rank, list, guest?, bad? }
 *   client -> { t:'rmHi', g }                    <- { t:'rmHi', g, list:[{n, s, ts}] }
 *   client -> { t:'rmFind', id }                 <- { t:'rmFound', id, amt, n, all }
 *   client -> { t:'rmCoin', spot }               <- { t:'rmCoin', spot, ok, amt, clue }
 * Data: state.mods.rm = { v, p:{memberKey: {f:{id:ts}, best:{g:sc}, n:{g:plays}, coin:{day, got}}}, hi:{g:[{n,s,ts}]} } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const CAT = require(path.join(__dirname, '..', 'public', 'js', 'rm-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
let ctx, D, E;

// our earn sources, added to econ's table (the same module object econ.js and loot.js use: caps, gaps and loot drops all work)
const EARN_ADD = {
  rmplay: { amt: 4, cap: 10, half: 5, gap: 30, drop: 0.05, label: 'Played a game on the consoles in your room' },
  rmbest: { amt: 10, cap: 3, drop: 0.15, label: 'Beat your best on a console game' },
  rmfind: { amt: 10, cap: 8, drop: 0.1, label: 'Found something in your bedroom' },
  rmcoin: { amt: 8, cap: 1, drop: 0.1, label: "Found Mom's lost change in your room" },
  rmall: { amt: 100, cap: 1, label: 'Found every game in your room' },
};

const keyOfC = c => { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) ? null : k; };
const today = () => E.uk().day; // UK day 'yyyy-mm-dd'
const md99 = () => { const d = today(); return +d.slice(5, 7) * 100 + +d.slice(8, 10); };
const outNow = f => !f.from || CAT.md(f.from) <= md99();
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') { p = D.p[key] = { f: {}, best: {}, n: {}, coin: { day: '', got: 0 } }; ctx.markDirty(); }
  p.f = p.f || {}; p.best = p.best || {}; p.n = p.n || {}; p.coin = p.coin || { day: '', got: 0 };
  return p;
}
// today's hiding place for this member (the same all day, different for everybody)
function coinSpot(key) {
  const h = crypto.createHash('sha1').update('rmcoin|' + today() + '|' + key).digest();
  return CAT.SPOTS[h[0] % CAT.SPOTS.length];
}
const gamesOwnedNow = () => CAT.GAMES.filter(g => !g.own && outNow(CAT.CONSOLES[g.con]));
function meView(key, c) {
  if (!key) return { t: 'rmMe', member: false, f: {}, best: {}, coin: null };
  const p = P(key), cs = coinSpot(key), got = p.coin.day === today();
  return { t: 'rmMe', member: true, f: p.f, best: p.best, coin: { clue: got ? '' : cs[1], got } };
}

function go(ws, c, m) {
  const g = String(m.g || ''); if (!own(CAT.GAME, g)) return;
  const tok = crypto.randomBytes(6).toString('hex');
  c.rmRun = { g, tok, t0: Date.now() };
  ctx.send(ws, { t: 'rmGo', g, tok });
}
function done(ws, c, m) {
  const g = String(m.g || ''), G = CAT.GAME[g], R = c.rmRun; if (!G || !R || R.g !== g || R.tok !== String(m.tok || '')) return;
  c.rmRun = null;
  const dt = (Date.now() - R.t0) / 1000, sc = Math.floor(+m.sc);
  if (!(sc >= 0 && sc <= G.max) || dt > 7200) return ctx.send(ws, { t: 'rmDone', g, sc: 0, amt: 0, bad: 1 });
  if (sc > Math.ceil(G.rate * (dt + 5))) return ctx.send(ws, { t: 'rmDone', g, sc: 0, amt: 0, bad: 1 }); // faster than anybody could
  const key = keyOfC(c);
  if (!key) return ctx.send(ws, { t: 'rmDone', g, sc, amt: 0, guest: 1, list: D.hi[g] || [] });
  const p = P(key), a = E.acct(c); if (!a) return;
  p.n[g] = (p.n[g] | 0) + 1;
  const old = p.best[g] | 0, pb = sc > old && old > 0, first = !old && sc > 0;
  if (sc > old) p.best[g] = sc;
  let amt = 0;
  const real = dt >= G.min && sc >= G.pay; // a proper go, not just switching it on and off again
  if (real) { amt += Math.max(0, E.earnA(a, 'rmplay', `${G.title}: ${sc.toLocaleString('en-GB')}`)); if (pb) amt += Math.max(0, E.earnA(a, 'rmbest', `New best on ${G.title}`)); }
  // the high-score table: one line per member (their best), top ten
  const list = D.hi[g] = D.hi[g] || [];
  let rank = 0;
  if (sc > 0) {
    const mine = list.find(x => x.n === a.name);
    if (!mine) list.push({ n: a.name, s: sc, ts: Date.now() }); else if (sc > mine.s) { mine.s = sc; mine.ts = Date.now(); }
    list.sort((x, y) => y.s - x.s || x.ts - y.ts); list.length = Math.min(list.length, 10);
    rank = list.findIndex(x => x.n === a.name) + 1;
    if (rank === 1 && (sc > old || first) && list.length > 1) ctx.pushChat({ sys: true, text: `*** ${a.name} got the top score on ${G.title} in their bedroom: ${sc.toLocaleString('en-GB')}!`, ts: Date.now() });
  }
  ctx.markDirty();
  ctx.send(ws, { t: 'rmDone', g, sc, amt, best: p.best[g] | 0, pb: pb || first, rank, list, real });
}
function find(ws, c, m) {
  const id = String(m.id || ''), F = CAT.FIND[id]; if (!F || !outNow(F)) return;
  const key = keyOfC(c); if (!key) return ctx.send(ws, { t: 'rmFound', id, amt: 0, guest: 1 });
  const p = P(key);
  if (own(p.f, id)) return ctx.send(ws, { t: 'rmFound', id, amt: 0, n: Object.keys(p.f).length, again: 1 });
  p.f[id] = Date.now(); ctx.markDirty();
  const a = E.acct(c); let amt = a ? Math.max(0, E.earnA(a, 'rmfind', `Found: ${F.n}`)) : 0;
  // every game cartridge and disc in the room: a big one-off reward
  const carts = gamesOwnedNow().map(g => 'cart.' + g.id), all = carts.length > 0 && carts.every(k => own(p.f, k));
  if (all && a) {
    amt += Math.max(0, E.earnA(a, 'rmall', 'Found every game in your bedroom!'));
    try { const LOOT = require('./loot.js'); if (LOOT.giveOnce) LOOT.giveOnce(key, 'trinket.goldfloppy', 'room'); } catch (e) {}
    ctx.pushChat({ sys: true, text: `*** ${a.name} found every single game hidden in their bedroom!`, ts: Date.now() });
  }
  ctx.send(ws, { t: 'rmFound', id, amt, n: Object.keys(p.f).length, all });
}
function coin(ws, c, m) {
  const key = keyOfC(c); if (!key) return ctx.send(ws, { t: 'rmCoin', spot: '', ok: false, guest: 1 });
  const spot = String(m.spot || ''), p = P(key), cs = coinSpot(key);
  if (p.coin.day === today()) return ctx.send(ws, { t: 'rmCoin', spot, ok: false, done: 1 });
  if (spot !== cs[0]) return ctx.send(ws, { t: 'rmCoin', spot, ok: false, clue: cs[1] });
  p.coin = { day: today(), got: 1 }; ctx.markDirty();
  const a = E.acct(c), amt = a ? Math.max(0, E.earnA(a, 'rmcoin', CAT.COIN.label, 5 + crypto.randomInt(0, 11))) : 0;
  ctx.send(ws, { t: 'rmCoin', spot, ok: true, amt });
}

function handle(ws, c, m) {
  if (!c.rmB) c.rmB = new ctx.Bucket(3, 12);
  if (!c.rmB.take()) return;
  const key = keyOfC(c);
  switch (m.t) {
    case 'rmMe': return ctx.send(ws, meView(key, c));
    case 'rmGo': return go(ws, c, m);
    case 'rmDone': return done(ws, c, m);
    case 'rmHi': { const g = String(m.g || ''); if (!own(CAT.GAME, g)) return; return ctx.send(ws, { t: 'rmHi', g, list: D.hi[g] || [] }); }
    case 'rmFind': return find(ws, c, m);
    case 'rmCoin': return coin(ws, c, m);
  }
}

module.exports = {
  name: 'rm',
  types: ['rmMe', 'rmGo', 'rmDone', 'rmHi', 'rmFind', 'rmCoin'],
  init(x) {
    ctx = x; D = x.data;
    D.v = 1; D.p = D.p || {}; D.hi = D.hi || {};
    E = ECON.api; if (!E || !E.earnA) { console.error('rm: econ is missing'); return; }
    for (const k in EARN_ADD) if (!ECAT.EARN[k]) ECAT.EARN[k] = EARN_ADD[k];
    x.on('login', c => { const key = keyOfC(c); if (!key) return; for (const [ws, cc] of ctx.clients) if (cc === c) ctx.send(ws, meView(key, c)); });
  },
  handle,
  _test: { get D() { return D; }, coinSpot, P },
};
