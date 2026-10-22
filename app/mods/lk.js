/* lk: THE CABLE CLUB. Pocket Critters (js/rm-g-mon.js, Moss and Puddle Versions on the Game Boy in Jack's room) can link
 * up with another member's Game Boy over JackNet: trade critters (escrowed: the server holds both offers, then writes
 * both deliveries down before either Game Boy hears about it, and keeps them until each one says "got it") and battle
 * (refereed here, with the shared rule book public/js/lk-crit.js: the server rolls every dice). You need a link cable:
 * found in your room (rm-cat.js FINDS 'link.cable', recorded by mods/rm.js) or bought off Dave for Rupees.
 *   client -> { t:'lkHello' }                     <- { t:'lkHello', member, cable, rec:{w,l,tr}, top:[[n,w,l]], inbox:[{tid, give, mon, from}] }
 *   client -> { t:'lkBuy' }                       <- lkHello (cable: true) | { t:'lkErr', msg }
 *   client -> { t:'lkClub', on, ver }             (in / out of the Cable Club)  club members <- { t:'lkList', list:[{id, n, ver, busy}] }
 *   client -> { t:'lkAsk', to, k:'trade'|'battle' }   to <- { t:'lkAsk', from, n, k, ver }
 *   client -> { t:'lkAns', from, yes }            both <- { t:'lkStart', sid, k, foe:{n, ver} } | asker <- { t:'lkNo', n }
 *   client -> { t:'lkQuit', sid }                 the other <- { t:'lkEnd', sid, why }
 *   trade:  { t:'lkOffer', sid, mon } -> the other <- { t:'lkOffer', sid, mon }; { t:'lkOk', sid } x2 -> both <- { t:'lkGot', sid, tid, give, mon }
 *           { t:'lkAck', tid }  (the delivery is in the save: forget it)
 *   battle: { t:'lkTeam', sid, team } x2 -> each <- { t:'lkBStart', sid, me:i, sd:[teamView, teamView], foe }
 *           { t:'lkAct', sid, a } -> each <- { t:'lkTurn', sid, ev:[...], need:[b,b], over, n }   then { t:'lkBEnd', sid, win, amt }
 * Data: state.mods.lk = { v, p:{key:{w, l, tr, cable}}, inbox:{key:[{tid, give, mon, from, ts}]}, log:[[ts, a, b, sa, sb]] } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const LC = require(path.join(__dirname, '..', 'public', 'js', 'lk-crit.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const CABLE_PRICE = 40, TURN_MS = 40000, ASK_MS = 30000;
const EARN_ADD = {
  lkwin: { amt: 8, cap: 3, gap: 60, drop: 0.1, label: 'Won a Pocket Critters link battle' },
  lktrade: { amt: 5, cap: 2, drop: 0.05, label: 'Traded a Pocket Critter over the link cable' },
};
let ctx, D, E;
const club = new Map(); // visitor id -> { ws, c, ver }
const sess = new Map(); // sid -> session
let listT = 0;

const keyOf = c => { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) ? null : k; };
function P(key) { let p = D.p[key]; if (!p || typeof p !== 'object') { p = D.p[key] = { w: 0, l: 0, tr: 0 }; ctx.markDirty(); } return p; }
function hasCable(key) {
  if (!key) return false;
  if (own(D.p, key) && D.p[key].cable) return true;
  const rm = ctx.state.mods && ctx.state.mods.rm; const rp = rm && rm.p && own(rm.p, key) ? rm.p[key] : null;
  return !!(rp && rp.f && own(rp.f, 'link.cable'));
}
const top = () => Object.keys(D.p).map(k => [D.p[k].n || k, D.p[k].w | 0, D.p[k].l | 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || a[2] - b[2]).slice(0, 5);
function hello(ws, c) {
  const key = keyOf(c);
  if (!key) return ctx.send(ws, { t: 'lkHello', member: false, cable: false, rec: null, top: top(), inbox: [] });
  const p = own(D.p, key) ? D.p[key] : { w: 0, l: 0, tr: 0 };
  ctx.send(ws, { t: 'lkHello', member: true, cable: hasCable(key), price: CABLE_PRICE, rec: { w: p.w | 0, l: p.l | 0, tr: p.tr | 0 }, top: top(), inbox: (D.inbox[key] || []).map(x => ({ tid: x.tid, give: x.give, mon: x.mon, from: x.from, ver: x.ver })) });
}
const nameOf = c => (c.member || c.nick || 'SOMEBODY').slice(0, 16);
function wsOf(c) { for (const [ws, cc] of ctx.clients) if (cc === c) return ws; return null; }

// ---------------------------------------------------------------- the club (who's plugged in right now)
function listNow() {
  if (listT) return;
  listT = setTimeout(() => {
    listT = 0;
    const list = [...club.values()].map(x => ({ id: x.c.id, n: nameOf(x.c), ver: x.ver, busy: x.c.lkS ? 1 : 0 }));
    for (const x of club.values()) ctx.send(x.ws, { t: 'lkList', list: list.filter(y => y.id !== x.c.id) });
  }, 250);
}
function join(ws, c, m) {
  const key = keyOf(c);
  if (!m.on) { if (club.delete(c.id)) listNow(); return; }
  if (!key) return ctx.send(ws, { t: 'lkErr', msg: 'Log on to JackNet to use the Cable Club.' });
  if (!hasCable(key)) return ctx.send(ws, { t: 'lkErr', msg: 'You need a link cable!' });
  const ver = m.ver === 'puddle' ? 'puddle' : 'moss';
  const was = club.get(c.id);
  club.set(c.id, { ws, c, ver });
  P(key).n = c.member;
  listNow();
  // let everybody know there's somebody to play with (not too often)
  const p = P(key);
  if (!was && Date.now() - (p.ad || 0) > 15 * 60000) { p.ad = Date.now(); ctx.pushChat({ sys: true, text: `*** ${c.member} has plugged a link cable into their Game Lad and is waiting in the Pocket Critters Cable Club (${ver === 'puddle' ? 'Puddle' : 'Moss'} Version)!`, ts: Date.now() }); }
}
function ask(ws, c, m) {
  const me = club.get(c.id), to = [...club.values()].find(x => String(x.c.id) === String(m.to));
  if (!me || !to || to.c === c || c.lkS || to.c.lkS) return ctx.send(ws, { t: 'lkNo', n: to ? nameOf(to.c) : '', busy: 1 });
  if (keyOf(to.c) === keyOf(c)) return ctx.send(ws, { t: 'lkNo', n: nameOf(to.c), self: 1 });
  const k = m.k === 'battle' ? 'battle' : 'trade';
  c.lkAsk = { to: to.c.id, k, t: Date.now() };
  ctx.send(to.ws, { t: 'lkAsk', from: c.id, n: nameOf(c), k, ver: me.ver });
}
function answer(ws, c, m) {
  const from = [...club.values()].find(x => String(x.c.id) === String(m.from)), me = club.get(c.id);
  if (!from || !me) return;
  const A = from.c.lkAsk;
  if (!A || A.to !== c.id || Date.now() - A.t > ASK_MS) return;
  from.c.lkAsk = null;
  if (!m.yes || c.lkS || from.c.lkS) return ctx.send(from.ws, { t: 'lkNo', n: nameOf(c) });
  const sid = crypto.randomBytes(5).toString('hex');
  const S = { sid, k: A.k, pl: [from, me], offers: [null, null], ok: [false, false], B: null, teams: [null, null], acts: [null, null], idle: [0, 0], timer: 0, t0: Date.now() };
  sess.set(sid, S); from.c.lkS = sid; c.lkS = sid;
  S.pl.forEach((x, i) => ctx.send(x.ws, { t: 'lkStart', sid, k: S.k, foe: { n: nameOf(S.pl[1 - i].c), ver: S.pl[1 - i].ver } }));
  listNow();
}
function end(S, why, quitter) {
  if (!sess.has(S.sid)) return;
  sess.delete(S.sid); clearTimeout(S.timer);
  S.pl.forEach((x, i) => { x.c.lkS = null; if (i !== quitter) ctx.send(wsOf(x.c) || x.ws, { t: 'lkEnd', sid: S.sid, why }); });
  listNow();
}
const seat = (S, c) => S.pl.findIndex(x => x.c === c);
function getS(c, m) { const S = sess.get(String(m.sid || '')); return S && seat(S, c) >= 0 ? S : null; }

// ---------------------------------------------------------------- trading (escrowed)
function offer(ws, c, m) {
  const S = getS(c, m); if (!S || S.k !== 'trade') return;
  const i = seat(S, c), mon = LC.clean(m.mon, nameOf(c)), key = keyOf(c);
  if (!mon) return ctx.send(ws, { t: 'lkErr', msg: 'That critter looks a bit funny. The cable would not take it.' });
  // (a critter that has already gone down the cable can't go twice: no copying critters with two Game Boys)
  if (key && own(D.p, key) && (D.p[key].gone || []).includes(mon.id)) return ctx.send(ws, { t: 'lkErr', msg: 'That critter has already been traded away!' });
  S.offers[i] = mon; S.ok = [false, false];
  ctx.send(S.pl[1 - i].ws, { t: 'lkOffer', sid: S.sid, mon });
}
function confirm(ws, c, m) {
  const S = getS(c, m); if (!S || S.k !== 'trade' || !S.offers[0] || !S.offers[1]) return;
  const i = seat(S, c); S.ok[i] = true;
  ctx.send(S.pl[1 - i].ws, { t: 'lkOk', sid: S.sid });
  if (!S.ok[0] || !S.ok[1]) return;
  // both said yes: write both deliveries down first (they survive a crash or a dropped line), then tell the Game Boys
  const ks = S.pl.map(x => keyOf(x.c)); if (!ks[0] || !ks[1]) return end(S, 'error');
  const tid = crypto.randomBytes(6).toString('hex'), ts = Date.now();
  S.pl.forEach((x, j) => {
    const box = D.inbox[ks[j]] = (D.inbox[ks[j]] || []).slice(-9);
    const got = Object.assign({}, S.offers[1 - j]);
    if (LC.TRADE_EVO[got.s] != null) got.evo = LC.TRADE_EVO[got.s]; // (it changes on the way down the cable)
    box.push({ tid: tid + j, give: S.offers[j].id, mon: got, from: nameOf(S.pl[1 - j].c), ver: S.pl[j].ver, ts });
  });
  D.log.push([ts, nameOf(S.pl[0].c), nameOf(S.pl[1].c), S.offers[0].s, S.offers[1].s]); if (D.log.length > 200) D.log.splice(0, D.log.length - 200);
  ctx.markDirty();
  S.pl.forEach((x, j) => {
    const p = P(ks[j]); p.tr = (p.tr | 0) + 1; p.n = x.c.member;
    p.gone = (p.gone || []).filter(id => id !== S.offers[1 - j].id).concat([S.offers[j].id]).slice(-300);
    const a = E.acct(x.c); let amt = 0;
    if (a && S.offers[0].s !== S.offers[1].s) amt = Math.max(0, E.earnA(a, 'lktrade', `Traded ${LC.SP[S.offers[j].s].n} for ${LC.SP[S.offers[1 - j].s].n}`));
    const it = D.inbox[ks[j]][D.inbox[ks[j]].length - 1];
    ctx.send(x.ws, { t: 'lkGot', sid: S.sid, tid: it.tid, give: it.give, mon: it.mon, from: it.from, ver: it.ver, amt });
  });
  S.offers = [null, null]; S.ok = [false, false]; // (they can trade again in the same session)
}
function ack(ws, c, m) {
  const key = keyOf(c); if (!key || !D.inbox[key]) return;
  const n = D.inbox[key].length;
  D.inbox[key] = D.inbox[key].filter(x => x.tid !== String(m.tid || ''));
  if (!D.inbox[key].length) delete D.inbox[key];
  if ((D.inbox[key] || []).length !== n) ctx.markDirty();
}

// ---------------------------------------------------------------- battling (refereed)
const view = sd => sd.team.map(x => ({ s: x.s, lv: x.lv, moves: x.moves, hp: x.hp, max: x.max }));
function team(ws, c, m) {
  const S = getS(c, m); if (!S || S.k !== 'battle' || S.B) return;
  const i = seat(S, c), t = Array.isArray(m.team) ? m.team.slice(0, 6).map(x => LC.clean(x, nameOf(c))) : [];
  if (!t.length || t.some(x => !x)) return ctx.send(ws, { t: 'lkErr', msg: 'The cable would not take that team.' });
  S.teams[i] = t;
  if (!S.teams[0] || !S.teams[1]) return;
  S.B = LC.battle(S.teams[0], S.teams[1]);
  S.pl.forEach((x, j) => ctx.send(x.ws, { t: 'lkBStart', sid: S.sid, me: j, sd: S.B.sd.map(view), foe: nameOf(S.pl[1 - j].c) }));
  wait(S);
}
const needs = S => { const B = S.B; return B.sd[0].need || B.sd[1].need ? [0, 1].filter(i => B.sd[i].need) : [0, 1]; };
function wait(S) {
  clearTimeout(S.timer); S.acts = [null, null];
  S.timer = setTimeout(() => { // a Game Boy went quiet: the referee picks for it (three in a row and it gives up)
    if (!sess.has(S.sid)) return;
    for (const i of needs(S)) if (!S.acts[i]) { S.idle[i]++; S.acts[i] = S.idle[i] >= 3 ? { k: 'quit' } : LC.auto(S.B, i); }
    resolve(S);
  }, TURN_MS);
  if (S.timer.unref) S.timer.unref();
}
function action(ws, c, m) {
  const S = getS(c, m); if (!S || S.k !== 'battle' || !S.B || S.B.over >= 0) return;
  const i = seat(S, c), a = m.a && { k: String(m.a.k || ''), i: m.a.i | 0 };
  if (!needs(S).includes(i) || S.acts[i] || !LC.okAct(S.B, i, a)) return;
  S.acts[i] = a; S.idle[i] = 0;
  ctx.send(S.pl[1 - i].ws, { t: 'lkReady', sid: S.sid });
  if (needs(S).every(j => S.acts[j])) resolve(S);
}
function resolve(S) {
  clearTimeout(S.timer);
  const acts = [0, 1].map(i => S.acts[i] || { k: 'move', i: 0 });
  const ev = LC.turn(S.B, acts, Math.random);
  const need = [S.B.sd[0].need, S.B.sd[1].need];
  S.pl.forEach(x => ctx.send(wsOf(x.c) || x.ws, { t: 'lkTurn', sid: S.sid, ev, need, over: S.B.over, n: S.B.n }));
  if (S.B.over >= 0) return over(S, S.B.over);
  wait(S);
}
function over(S, w) {
  const ks = S.pl.map(x => keyOf(x.c));
  let amt = 0;
  if (ks[0] && ks[1] && ks[0] !== ks[1]) {
    const pw = P(ks[w]), pl = P(ks[1 - w]); pw.w = (pw.w | 0) + 1; pl.l = (pl.l | 0) + 1; ctx.markDirty();
    const a = E.acct(S.pl[w].c);
    if (a && S.B.n >= 3) amt = Math.max(0, E.earnA(a, 'lkwin', `Beat ${nameOf(S.pl[1 - w].c)} in a link battle`));
  }
  S.pl.forEach((x, j) => ctx.send(wsOf(x.c) || x.ws, { t: 'lkBEnd', sid: S.sid, win: j === w, amt: j === w ? amt : 0 }));
  sess.delete(S.sid); clearTimeout(S.timer); S.pl.forEach(x => { x.c.lkS = null; }); listNow();
}
function quit(ws, c, m) {
  const S = getS(c, m) || (c.lkS && sess.get(c.lkS)); if (!S) return;
  const i = seat(S, c);
  if (S.k === 'battle' && S.B && S.B.over < 0) { S.B.over = 1 - i; const ev = [{ t: 'quit', sd: i }, { t: 'win', sd: 1 - i }]; ctx.send(S.pl[1 - i].ws, { t: 'lkTurn', sid: S.sid, ev, need: [false, false], over: 1 - i, n: S.B.n }); return over(S, 1 - i); }
  end(S, 'quit', i);
}

function buy(ws, c) {
  const key = keyOf(c); if (!key) return E.need(ws);
  if (hasCable(key)) return hello(ws, c);
  const a = E.acct(c); if (!a) return;
  if (!E.debit(a, CABLE_PRICE, 'lkcable', 'Bought a Game Lad link cable off Dave')) return ctx.send(ws, { t: 'lkErr', msg: `You need ${CABLE_PRICE} Rupees for Dave's spare cable.`, poor: 1 });
  P(key).cable = Date.now(); ctx.markDirty(); E.meToAll(a);
  hello(ws, c);
}

function handle(ws, c, m) {
  if (!c.lkB) c.lkB = new ctx.Bucket(4, 24);
  if (!c.lkB.take()) return;
  switch (m.t) {
    case 'lkHello': return hello(ws, c);
    case 'lkBuy': return buy(ws, c);
    case 'lkClub': return join(ws, c, m);
    case 'lkAsk': return ask(ws, c, m);
    case 'lkAns': return answer(ws, c, m);
    case 'lkQuit': return quit(ws, c, m);
    case 'lkOffer': return offer(ws, c, m);
    case 'lkOk': return confirm(ws, c, m);
    case 'lkAck': return ack(ws, c, m);
    case 'lkTeam': return team(ws, c, m);
    case 'lkAct': return action(ws, c, m);
  }
}

module.exports = {
  name: 'lk',
  types: ['lkHello', 'lkBuy', 'lkClub', 'lkAsk', 'lkAns', 'lkQuit', 'lkOffer', 'lkOk', 'lkAck', 'lkTeam', 'lkAct'],
  init(x) {
    ctx = x; D = x.data;
    D.v = 1; D.p = D.p || {}; D.inbox = D.inbox || {}; D.log = D.log || [];
    E = ECON.api; if (!E || !E.earnA) { console.error('lk: econ is missing'); return; }
    for (const k in EARN_ADD) if (!ECAT.EARN[k]) ECAT.EARN[k] = EARN_ADD[k];
    x.on('close', c => { if (club.delete(c.id)) listNow(); if (c.lkS) { const S = sess.get(c.lkS); if (S) quit(null, c, { sid: S.sid }); } });
    x.on('login', c => { if (club.has(c.id)) { club.delete(c.id); listNow(); } });
  },
  handle,
  _test: { get D() { return D; }, club, sess },
};
