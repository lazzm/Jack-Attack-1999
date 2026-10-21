/* ex: the ECONOMY expansion. Everything here is decided by the server; a browser only ever says what it wants to do.
 *   JackCards Series Two (Byte Beasties): booster packs (Rupees), the free starter deck, decks, Card Clash (vs the
 *     computer, and vs a friend online through the Play Together kit: js/mp.js sessions pair the two browsers here)
 *   JackBay Rupee Auctions: real auctions of JackLoot things for Rupees. The item and every bid are held by the server
 *     (escrow), proxy bidding, an anti-sniper rule, listing + final value fees (they vanish), cancel rules, history
 *   Jacktown Town Hall: daily takings for your plot (capped), business rates (upkeep), upgrades, the town league
 *   The Odd Jobz Board: streaks and the Job of the Day (grind's jobs tell us about each round: ctx event 'grJob')
 *   The Mega Masters: a weekly cup (an arcade game, a Pocket Money job and the Card Clash League), prizes on Monday
 * Money only moves through econ (earn sources in js/ex-cat.js EARN, or credit/debit for prices and prizes) and things
 * only move through the JackLoot chest (mods/loot.js api). The numbers are in public/js/ex-cat.js.
 *   client -> { t:'exMe' } <- { t:'exMe', deck, packs, pday, starter, cs }    { t:'exDeck', deck:[u] }   { t:'exStarter' }
 *   client -> { t:'exPackBuy', n } / { t:'exPackOpen' } <- { t:'exPack', its:[...] }
 *   client -> { t:'exClashCpu', ai } / { t:'exClashGo', id, plays } / { t:'exClashQuit', id } / { t:'exClashMine' } / { t:'exClashPair', sid, ids }
 *          <- { t:'exClash', d:{ id, kind, ai, v, log, dl, res } }
 *   client -> { t:'exBayList', q, ty, sort } / { t:'exBayLot', id } / { t:'exBaySell', u, start, res, dur } / { t:'exBayBid', id, max }
 *             { t:'exBayCancel', id } / { t:'exBayMine' } / { t:'exBayDone' }   <- exBay / exBayLot / exBayMine / exBayDone / exBayCh / exBayNote
 *   client -> { t:'exTown' } / { t:'exTownCollect' } / { t:'exTownUp' } <- { t:'exTown', ... }
 *   client -> { t:'exJobs' } <- { t:'exJobs', streak, best, jotd, done }     client -> { t:'exTour' } <- { t:'exTour', ... }
 * Data: state.mods.ex = { v, p:{memberKey: P}, bay:{seq, lots:{id: lot}, done:[...]}, tour:{w, sc:{arcade, job, clash}, hist}, st:{...} } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const X = require(path.join(__dirname, '..', 'public', 'js', 'ex-cat.js'));
const DU = require(path.join(__dirname, '..', 'public', 'js', 'ex-duel.js'));
const LCAT = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const GCAT = require(path.join(__dirname, '..', 'public', 'js', 'grind-cat.js'));
const ECON = require('./econ.js');
X.augment(LCAT, GCAT); // the cards, trophies, sets, missions and jobs go into the shared catalogues straight away

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const rnd = () => crypto.randomInt(0, 1e9) / 1e9;
const pick = l => l[crypto.randomInt(0, l.length)];
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const rp = n => { n = Math.floor(+n || 0); return `${n.toLocaleString('en-GB')} ${n === 1 ? 'Rupee' : 'Rupees'}`; };
const NEED = 'That is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!';
let ctx, D, E;
const LA = () => { try { const L = require('./loot.js'); return L && L.api ? L.api : null; } catch (e) { return null; } };

// ---------------------------------------------------------------- data (THE DATABASE IS SACRED: only ever add missing bits)
function initData() {
  D.v = D.v || 1;
  if (!D.p || typeof D.p !== 'object') D.p = {};
  if (!D.bay || typeof D.bay !== 'object') D.bay = { seq: 0, lots: {}, done: [] };
  if (!D.bay.lots) D.bay.lots = {}; if (!Array.isArray(D.bay.done)) D.bay.done = []; D.bay.seq = D.bay.seq | 0;
  if (!D.tour || typeof D.tour !== 'object') D.tour = { w: '', sc: { arcade: {}, job: {}, clash: {} }, hist: [] };
  if (!Array.isArray(D.tour.hist)) D.tour.hist = [];
  if (!D.st || typeof D.st !== 'object') D.st = { packs: 0, clash: 0, duels: 0, lots: 0, sold: 0 };
}
const keyOf = name => { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; };
const memberName = key => { const m = ctx.state.members[key]; return m ? m.name : null; };
const keyOfC = c => (c && c.member ? keyOf(c.member) : null);
const today = () => E.uk().day;
const yday = d => { const t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) - 864e5; return new Date(t).toISOString().slice(0, 10); };
const dayDiff = (a, b) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 864e5);
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') p = D.p[key] = {};
  if (!Array.isArray(p.deck)) p.deck = [];
  p.packs = p.packs | 0; p.opened = p.opened | 0; p.starter = +p.starter || 0;
  if (!p.pday || typeof p.pday !== 'object') p.pday = { day: '', n: 0 };
  if (!p.cs || typeof p.cs !== 'object') p.cs = { w: 0, l: 0, d: 0, cpu: {}, pvp: { w: 0, l: 0, d: 0 }, lp: { day: '', n: 0 }, pair: { day: '', m: {} } };
  if (!p.js || typeof p.js !== 'object') p.js = { last: '', n: 0, best: 0, jd: '' };
  if (!p.tw || typeof p.tw !== 'object') p.tw = { lv: 0, last: '', wk: '', wn: 0, tot: 0 };
  if (!p.bay || typeof p.bay !== 'object') p.bay = { sold: 0, bought: 0, earned: 0, spent: 0 };
  return p;
}
const acctOf = key => { const nm = memberName(key); return nm ? E.acct({ member: nm }) : null; };
function sendTo(key, msg) { const s = JSON.stringify(msg); for (const [ws, c] of ctx.clients) if (c.member && c.member.toLowerCase() === key) ctx.send(ws, s); }
// a note for a member: straight to them if they're on, otherwise it waits in their inbox until they next log on
function note(key, msg) {
  let on = false; const s = JSON.stringify(msg);
  for (const [ws, c] of ctx.clients) if (c.member && c.member.toLowerCase() === key) { ctx.send(ws, s); on = true; }
  if (!on && memberName(key)) { const p = P(key); p.inbox = Array.isArray(p.inbox) ? p.inbox : []; p.inbox.push(Object.assign({ late: Date.now() }, msg)); if (p.inbox.length > 20) p.inbox.splice(0, p.inbox.length - 20); ctx.markDirty(); }
}
function inbox(key) { const p = D.p[key]; if (!p || !Array.isArray(p.inbox) || !p.inbox.length) return; const l = p.inbox; p.inbox = []; ctx.markDirty(); setTimeout(() => { for (const m of l) sendTo(key, m); }, 2500); }
function sendCid(cid, msg) { const s = JSON.stringify(msg); for (const [ws, c] of ctx.clients) if (c.id === cid) ctx.send(ws, s); }
const err = (ws, msg) => ctx.send(ws, { t: 'exErr', msg });

// ================================================================ JACKCARDS: packs, the starter deck, decks
function meView(key) {
  const p = P(key), d = today(), L = LA();
  if (p.pday.day !== d) p.pday = { day: d, n: 0 };
  const lp = L ? L.P(key) : null;
  return { t: 'exMe', deck: deckOk(key).filter(u => !!u), packs: p.packs, pday: p.pday.n, pmax: X.PACK.dayMax, starter: p.starter, opened: p.opened, cs: { w: p.cs.w, l: p.cs.l, d: p.cs.d, cpu: p.cs.cpu, pvp: p.cs.pvp }, n: lp ? lp.it.filter(x => x.id.startsWith('card.')).length : 0 };
}
// the saved deck, minus anything that has gone (traded, sold, on the Bazaar or JackBay)
function deckOk(key) {
  const p = P(key), L = LA(); if (!L) return [];
  const lp = L.P(key), seen = new Set();
  return p.deck.filter(u => { if (seen.has(u)) return false; seen.add(u); const x = L.findItem(lp, u); return !!(x && !x.lk && X.BATTLE[x.id]); });
}
function deckRules(ids) {
  if (ids.length > X.DECK.size) return `A deck is ${X.DECK.size} cards.`;
  const n = {}; let g = 0;
  for (const id of ids) {
    const d = X.BATTLE[id], it = LCAT.ITEM[id]; if (!d || !it) return "One of those cards can't be played in Card Clash.";
    n[id] = (n[id] | 0) + 1; if (d.kind === 'g') g++;
    if (n[id] > (it.r >= X.DECK.oneOf ? 1 : X.DECK.copies)) return `Only ${it.r >= X.DECK.oneOf ? 'one' : X.DECK.copies} of "${it.name}" per deck.`;
  }
  if (g > X.DECK.gadgetsMax) return `Up to ${X.DECK.gadgetsMax} gadgets per deck.`;
  return '';
}
function setDeck(ws, key, m) {
  const L = LA(); if (!L) return;
  const us = Array.isArray(m.deck) ? m.deck.slice(0, X.DECK.size + 1) : [];
  if (us.length > X.DECK.size || new Set(us).size !== us.length) return err(ws, `A deck is up to ${X.DECK.size} different cards from your collection.`);
  const lp = L.P(key), ids = [];
  for (const u of us) { const x = isInt(u, 1, 1e12) ? L.findItem(lp, u) : null; if (!x) return err(ws, "One of those cards isn't in your collection any more."); if (x.lk) return err(ws, `Your ${LCAT.ITEM[x.id].name} is tied up in a trade, the Bazaar or JackBay.`); ids.push(x.id); }
  const why = deckRules(ids); if (why) return err(ws, why);
  P(key).deck = us; ctx.markDirty();
  ctx.send(ws, meView(key));
}
// the ids a player brings to a game: their deck, topped up from the loaner deck
function battleDeck(key) {
  const ids = [];
  if (key) { const L = LA(), lp = L && L.P(key); if (lp) for (const u of deckOk(key)) { const x = L.findItem(lp, u); if (x) ids.push(x.id); } }
  for (const id of X.LOANER) { if (ids.length >= X.DECK.size) break; if (!deckRules(ids.concat(id))) ids.push(id); }
  return ids;
}
// a booster: 3 Common, 1 Uncommon, 1 Rare or better (crypto randomness; a limited card that has run out falls back a rarity)
function rollPack(L) {
  const out = [];
  const pool = r => X.CARDS.filter(c => c.r === r && L.canMint(LCAT.ITEM[c.id]));
  for (const slot of X.PACK.slots) {
    let r = slot;
    if (slot === 'r') { let x = rnd() * 100; r = 2; for (const [rr, w] of X.PACK.rare) { x -= w; if (x < 0) { r = rr; break; } } }
    let l = pool(r); while (!l.length && r > 0) l = pool(--r);
    if (l.length) out.push(pick(l).id);
  }
  return out;
}
function packBuy(ws, key, m) {
  const p = P(key), a = acctOf(key), d = today(), n = m.n == null ? 1 : m.n;
  if (!isInt(n, 1, X.PACK.dayMax)) return err(ws, 'Funny number of packets. Try again.');
  if (p.pday.day !== d) p.pday = { day: d, n: 0 };
  if (p.pday.n + n > X.PACK.dayMax) return err(ws, `The Card Korner only lets each customer have ${X.PACK.dayMax} packets a day ("or your Mom will have words with me"). ${p.pday.n >= X.PACK.dayMax ? 'Come back tomorrow!' : `You can have ${X.PACK.dayMax - p.pday.n} more today.`}`);
  if (p.packs + n > X.PACK.held) return err(ws, `You've already got ${p.packs} unopened packets! Open some first.`);
  const cost = X.PACK.price * n;
  if (!E.debit(a, cost, 'cards', `The Card Korner: ${n} JackCards booster${n > 1 ? 's' : ''}`)) return err(ws, `Not enough Rupees! ${n > 1 ? n + ' packets cost' : 'A packet costs'} ${rp(cost)} and you have ${rp(a.bal)}.`);
  p.pday.n += n; p.packs += n; ctx.markDirty();
  ctx.send(ws, { t: 'exPackGot', n, packs: p.packs }); ctx.send(ws, meView(key)); E.meToAll(a);
}
function packOpen(ws, c, key) {
  const p = P(key), L = LA(); if (!L) return err(ws, 'The card shop is shut. (The server lost the key.)');
  if (!p.packs) return err(ws, 'You have no unopened packets. Buy one at The Card Korner (www.cardkorner.kidz)!');
  if (!c.exPk) c.exPk = new ctx.Bucket(0.5, 3); if (!c.exPk.take()) return err(ws, 'Steady on! Open them one at a time.');
  const lp = L.P(key);
  if (lp.it.length + 5 > L.R.invMax) return err(ws, 'Your Treasure Chest is full! Recycle a few things first, then open your packet.');
  const ids = rollPack(L); if (!ids.length) return;
  p.packs--; p.opened++; D.st.packs++;
  const its = [], a = acctOf(key);
  for (const id of ids) { const x = L.mint(id, 'pack'); if (!x) continue; lp.it.push(x); its.push(L.pub(x)); if (LCAT.ITEM[id].r >= 2) L.feed(a ? a.name : key, x); }
  ctx.markDirty();
  ctx.send(ws, { t: 'exPack', its, packs: p.packs });
  L.checkAll(key); L.sendMe(key); ctx.send(ws, meView(key));
}
function starter(ws, key) {
  const p = P(key), L = LA(); if (!L) return;
  if (p.starter) return err(ws, "You've already had your free starter deck. (One each! Mom's rules. And the Card Korner's.)");
  const lp = L.P(key); if (lp.it.length + X.STARTER.length > L.R.invMax) return err(ws, 'Your Treasure Chest is too full for a whole deck! Recycle some things first.');
  const its = [], us = [];
  for (const id of X.STARTER) { const x = L.mint(id, 'starter'); if (!x) continue; lp.it.push(x); its.push(L.pub(x)); us.push(x.u); }
  p.starter = Date.now(); if (!deckOk(key).length) p.deck = us; ctx.markDirty();
  ctx.send(ws, { t: 'exPack', its, starter: 1, packs: p.packs });
  L.checkAll(key); L.sendMe(key); ctx.send(ws, meView(key));
}

// ================================================================ CARD CLASH
const duels = new Map(); // id -> duel (memory only: a game in progress doesn't survive a restart, everything it paid does)
const seatOf = new Map(); // seat key ('m:<member>' or 'g:<visitor id>') -> duel id
const pairs = new Map(); // MP session id -> { cid, seat, key, name, ids, at }
const seatKey = c => (c.member ? 'm:' + c.member.toLowerCase() : 'g:' + c.id);
let duelSeq = 0;
function pushDuel(du, log) {
  du.sides.forEach((sd, s) => {
    if (sd.cpu) return;
    const msg = { t: 'exClash', d: { id: du.id, kind: du.kind, ai: du.ai || '', v: DU.view(du.st, s), log: log ? DU.logFor(log, s) : null, dl: du.dl || 0, dlIn: du.dl ? Math.max(0, du.dl - Date.now()) : 0, res: du.res ? du.res[s] : null, opp: du.sides[1 - s].name, cpuLv: du.ai ? X.CPU[du.ai].lv : -1 } };
    sendCid(sd.cid, msg);
  });
}
function newDuel(kind, a, b, ai) {
  const id = 'd' + (++duelSeq).toString(36) + crypto.randomBytes(3).toString('hex');
  const st = DU.create({ seed: crypto.randomInt(1, 2 ** 31), names: [a.name, b.name], decks: [a.deck, b.deck] });
  const du = { id, kind, ai, st, sides: [a, b], at: Date.now(), touch: Date.now(), dl: 0, res: null };
  duels.set(id, du);
  for (const sd of du.sides) if (!sd.cpu) { const old = seatOf.get(sd.seat); if (old && old !== id) endQuietly(old); seatOf.set(sd.seat, id); }
  if (kind === 'pvp') du.dl = Date.now() + X.DUEL.planSecs * 1000;
  return du;
}
function endQuietly(id) { const du = duels.get(id); if (!du) return; if (du.st.phase !== 'over') { const s = du.sides.findIndex(x => !x.cpu); DU.forfeit(du.st, s < 0 ? 0 : s, 'left'); finish(du, du.st.log); } else drop(du); }
function drop(du) { duels.delete(du.id); for (const sd of du.sides) if (!sd.cpu && seatOf.get(sd.seat) === du.id) seatOf.delete(sd.seat); }
function cpuStart(ws, c, m) {
  const ai = String(m.ai || ''); if (!own(X.CPU, ai)) return;
  const key = keyOfC(c), me = { seat: seatKey(c), cid: c.id, key, name: c.nick || 'You', deck: battleDeck(key) };
  const cpu = { cpu: 1, name: X.CPU[ai].n, deck: X.CPU[ai].deck.slice() };
  const du = newDuel('cpu', me, cpu, ai);
  D.st.clash++; ctx.markDirty();
  pushDuel(du, null);
}
function mine(ws, c) {
  const id = seatOf.get(seatKey(c)), du = id && duels.get(id);
  if (!du) return ctx.send(ws, { t: 'exClash', d: null });
  const s = du.sides.findIndex(sd => sd.seat === seatKey(c)); if (s < 0) return;
  du.sides[s].cid = c.id; // (a reloaded page may have a new visitor id)
  pushDuel(du, null);
}
function go(ws, c, m) {
  const du = duels.get(String(m.id || '')); if (!du) return err(ws, 'That game has finished.');
  const s = du.sides.findIndex(sd => !sd.cpu && sd.seat === seatKey(c)); if (s < 0) return;
  du.sides[s].cid = c.id;
  const plays = Array.isArray(m.plays) ? m.plays.slice(0, 8).map(p => ({ c: p && p.c, lane: p && p.lane })) : [];
  const why = DU.check(du.st, s, plays); if (why) return err(ws, why);
  DU.lock(du.st, s, plays); du.sides[s].idle = 0; du.touch = Date.now();
  if (du.kind === 'cpu') { const o = 1 - s; DU.lock(du.st, o, DU.ai(du.st, o, X.CPU[du.ai].lv)); }
  if (DU.ready(du.st)) round(du);
  else pushDuel(du, null); // (the other player sees "locked in")
}
function round(du) {
  const log = DU.resolve(du.st);
  if (du.kind === 'pvp' && du.st.phase !== 'over') du.dl = Date.now() + X.DUEL.planSecs * 1000;
  if (du.st.phase === 'over') return finish(du, log);
  pushDuel(du, log);
}
function quit(ws, c, m) {
  const du = duels.get(String(m.id || '')); if (!du) return;
  const s = du.sides.findIndex(sd => !sd.cpu && sd.seat === seatKey(c)); if (s < 0) return;
  if (du.st.phase !== 'over') { DU.forfeit(du.st, s, 'quit'); finish(du, du.st.log); } else drop(du);
}
// the end: stats, prizes (members only; the server saw every move), the league
function finish(du, log) {
  const st = du.st, res = [{}, {}];
  du.sides.forEach((sd, s) => {
    if (sd.cpu || !sd.key || !memberName(sd.key)) return;
    const p = P(sd.key), a = acctOf(sd.key), won = st.win === s, draw = st.win === 2, other = du.sides[1 - s];
    if (won) p.cs.w++; else if (draw) p.cs.d++; else p.cs.l++;
    const r = res[s];
    if (du.kind === 'cpu') {
      const cs = p.cs.cpu[du.ai] = p.cs.cpu[du.ai] || { w: 0, l: 0, d: 0 };
      if (won) cs.w++; else if (draw) cs.d++; else cs.l++;
      if (won && a && st.why !== 'left') {
        r.amt = Math.max(0, E.earnA(a, 'exclash', `Card Clash: beat ${X.CPU[du.ai].n}`, X.CPU[du.ai].pay));
        if (du.ai === 'jackk') { r.pts = league(sd.key, X.TOUR.clash.cpu, true); }
      }
    } else {
      const pv = p.cs.pvp; if (won) pv.w++; else if (draw) pv.d++; else pv.l++;
      const ok = other && other.key && memberName(other.key) && other.key !== sd.key;
      if (ok && (won || draw)) {
        const d = today(); if (p.cs.pair.day !== d) p.cs.pair = { day: d, m: {} };
        const seen = p.cs.pair.m[other.key] | 0;
        if (won && seen < 2 && a && st.why !== 'idle0') { p.cs.pair.m[other.key] = seen + 1; r.amt = Math.max(0, E.earnA(a, 'exduel', `Card Clash: beat ${other.name} online`)); }
        if (seen < 2) r.pts = league(sd.key, won ? X.TOUR.clash.pvp : X.TOUR.clash.draw, false);
      }
      D.st.duels++;
    }
    ctx.markDirty();
  });
  du.res = res; du.dl = 0;
  pushDuel(du, log);
  drop(du);
}
// PvP: both browsers in a Play Together session (js/mp.js) say "pair me with session sid"; the second one starts it
function pair(ws, c, m) {
  const sid = String(m.sid || ''); if (!/^[a-z0-9]{6,12}$/.test(sid)) return;
  const ids = Array.isArray(m.ids) ? m.ids.map(x => x | 0).filter(x => x > 0).slice(0, 2) : [];
  if (ids.length !== 2 || !ids.includes(c.id) || ids[0] === ids[1]) return;
  // a reloaded page picking its online game back up: it's the same game, just carry on
  const liveId = seatOf.get(seatKey(c)), live = liveId && duels.get(liveId);
  if (live && live.sid === sid) { const s = live.sides.findIndex(sd => sd.seat === seatKey(c)); if (s >= 0) { live.sides[s].cid = c.id; return pushDuel(live, null); } }
  const key = keyOfC(c), me = { seat: seatKey(c), cid: c.id, key, name: c.nick || 'Player', ids: ids.join(','), at: Date.now() };
  const other = pairs.get(sid);
  if (!other || other.cid === c.id) { pairs.set(sid, me); if (pairs.size > 500) pairs.delete(pairs.keys().next().value); return ctx.send(ws, { t: 'exClashWait', sid }); }
  if (other.ids !== me.ids || other.seat === me.seat) return;
  pairs.delete(sid);
  const host = ids[0] === other.cid ? other : me, guest = host === me ? other : me;
  host.deck = battleDeck(host.key); guest.deck = battleDeck(guest.key);
  const du = newDuel('pvp', host, guest, '');
  du.sid = sid; ctx.markDirty();
  pushDuel(du, null);
}
function duelClock() {
  const now = Date.now();
  for (const du of [...duels.values()]) {
    if (du.kind === 'cpu') { if (now - du.touch > 45 * 60000) drop(du); continue; }
    if (!du.dl || now < du.dl || du.st.phase !== 'plan') continue;
    // time's up: anybody who hasn't locked in plays nothing this round; two of those in a row and they forfeit
    let gone = -1;
    du.sides.forEach((sd, s) => { if (du.st.p[s].lock) return; sd.idle = (sd.idle | 0) + 1; if (sd.idle >= X.DUEL.idleForfeit) gone = s; else DU.lock(du.st, s, []); });
    if (gone >= 0) { DU.forfeit(du.st, gone, 'idle'); finish(du, du.st.log); continue; }
    round(du);
  }
  for (const [sid, p] of pairs) if (now - p.at > 90000) pairs.delete(sid);
}

// ================================================================ THE MEGA MASTERS (weekly cup) + Card Clash League
function tour() {
  const W = X.week(today());
  if (D.tour.w !== W.w) {
    if (D.tour.w) finalTour();
    D.tour.w = W.w; D.tour.label = W.label; D.tour.ev = X.tourEvents(W.w); D.tour.sc = { arcade: {}, job: {}, clash: {} }; D.tour.paid = 0;
    ctx.markDirty();
  }
  if (!D.tour.ev) { D.tour.ev = X.tourEvents(D.tour.w); D.tour.label = W.label; }
  return D.tour;
}
function enter(kind, key, s, add) {
  const T = tour(), tab = T.sc[kind], nm = memberName(key); if (!tab || !nm || !(s > 0)) return 0;
  const row = tab[key] || (tab[key] = { n: nm, s: 0, at: 0 });
  row.n = nm;
  if (add) { row.s += s; row.at = Date.now(); } else if (s > row.s) { row.s = s; row.at = Date.now(); } else return row.s;
  ctx.markDirty(); return row.s;
}
function league(key, pts, cpu) {
  const p = P(key);
  if (cpu) { const d = today(); if (p.cs.lp.day !== d) p.cs.lp = { day: d, n: 0 }; if (p.cs.lp.n >= X.TOUR.clash.cpuDay) return 0; p.cs.lp.n++; }
  enter('clash', key, pts, true); return pts;
}
const board = tab => Object.entries(tab || {}).filter(([k, r]) => r.s > 0 && memberName(k)).sort((x, y) => y[1].s - x[1].s || x[1].at - y[1].at);
function finalTour() {
  const T = D.tour; if (T.paid) return;
  T.paid = 1;
  const L = LA(), out = { w: T.w, label: T.label, ev: [] };
  const evs = T.ev || X.tourEvents(T.w), kinds = { arcade: 'arcade', job: 'job', clash: 'clash' };
  for (const ev of evs) {
    const rows = board(T.sc[kinds[ev.k]]), top = [];
    rows.forEach(([key, r], i) => { try {
      const a = acctOf(key); if (!a) return;
      let prize = X.TOUR.part;
      if (i < 3) { prize += X.TOUR.prizes[i]; top.push({ n: r.n, s: r.s }); try { if (L) L.give(key, L.mint(X.TOUR.cups[i], 'tour'), 'tour'); } catch (e) { console.error('ex tour cup', e); } }
      note(key, { t: 'exTourWin', pos: i + 1, ev: ev.n || evName(ev), prize, w: T.label });
      E.credit(a, prize, 'extour', i < 3 ? `The Mega Masters: ${['1st', '2nd', '3rd'][i]} place (${ev.n || evName(ev)})` : `The Mega Masters: for taking part (${ev.n || evName(ev)})`);
      if (i === 0 && ev.k === 'clash') { try { require('./loot.js').giveOnce(key, 'badge.ex_clash', 'tour'); } catch (e) {} }
    } catch (e) { console.error('ex tour prize', key, e); } });
    out.ev.push({ k: ev.k, g: ev.g, n: ev.n || evName(ev), top, entrants: rows.length });
  }
  T.hist.push(out); if (T.hist.length > 30) T.hist.splice(0, T.hist.length - 30);
  const champ = out.ev.map(e => e.top[0] ? `${e.top[0].n} (${e.n})` : '').filter(Boolean);
  if (champ.length) {
    ctx.pushChat({ sys: true, text: `*** THE MEGA MASTERS ${T.label}: winners ${champ.join(', ')}! Results at www.megamasters.cyb`, ts: Date.now() });
    try { E.gaz('tour', 'MEGA MASTERS CHAMPIONS CROWNED', `This week's Mega Masters cup is over. ${champ.join('; ')} took the gold cups home. A new week of events starts today at www.megamasters.cyb. "I was robbed," said Dave, who did not enter.`); } catch (e) {}
  }
  ctx.broadcast({ t: 'exTourEnd', r: out });
  ctx.markDirty();
}
function evName(ev) { if (ev.k === 'job') { const J = GCAT.JOBS[ev.g]; return J ? J.n.toUpperCase() : ev.g; } return ev.n; }
function tourView(key) {
  const T = tour(), W = X.week(today());
  const kinds = { arcade: 'arcade', job: 'job', clash: 'clash' };
  const ends = Date.now() + ((7 - W.dow) * 864e5) - (Date.now() % 864e5); // (roughly: midnight on Sunday night)
  return { t: 'exTour', w: T.w, label: T.label, ends, prizes: X.TOUR.prizes, part: X.TOUR.part,
    ev: (T.ev || []).map(ev => { const rows = board(T.sc[kinds[ev.k]]); const mi = key ? rows.findIndex(r => r[0] === key) : -1; return { k: ev.k, g: ev.g, n: evName(ev), unit: ev.k === 'job' && GCAT.JOBS[ev.g] ? GCAT.JOBS[ev.g].unit : ev.k === 'clash' ? 'points' : 'points', top: rows.slice(0, 10).map(([, r]) => ({ n: r.n, s: r.s })), count: rows.length, me: mi >= 0 ? { pos: mi + 1, s: rows[mi][1].s } : null }; }),
    hist: T.hist.slice(-6).reverse() };
}

// ================================================================ THE ODD JOBZ BOARD: streaks + Job of the Day
function onJob(c, key, j, sc, amt) {
  if (!key || !memberName(key) || !GCAT.JOBS[j]) return;
  const T = tour(), ev = (T.ev || []).find(e => e.k === 'job');
  if (ev && ev.g === j && sc > 0) enter('job', key, sc, false);
  if (!(amt > 0)) return;
  const p = P(key), a = acctOf(key), d = today(), J = p.js;
  if (J.last !== d) {
    J.n = J.last === yday(d) ? J.n + 1 : 1; J.last = d; J.best = Math.max(J.best | 0, J.n);
    if (J.n >= 2 && a) { const amt2 = Math.min(X.STREAK.max, X.STREAK.per * J.n); E.earnA(a, 'exstreak', `Odd Jobz streak: day ${J.n}!`, amt2); }
  }
  if (j === X.jotd(d) && J.jd !== d && a) { J.jd = d; E.earnA(a, 'exjotd', `Job of the Day bonus: ${GCAT.JOBS[j].n}`, Math.max(3, Math.round(amt / 2))); }
  ctx.markDirty();
  sendTo(key, jobsView(key));
}
function jobsView(key) {
  const d = today(), j = X.jotd(d), p = key ? P(key) : null, J = p ? p.js : null;
  const live = J && (J.last === d || J.last === yday(d)) ? J.n : 0;
  const done = !!(J && J.last === d), nextN = live + 1;
  return { t: 'exJobs', jotd: j, jotdN: GCAT.JOBS[j] ? GCAT.JOBS[j].n : j, jdone: !!(J && J.jd === d), streak: live, today: done, best: J ? J.best | 0 : 0, next: nextN >= 2 ? Math.min(X.STREAK.max, X.STREAK.per * nextN) : 0, per: X.STREAK.per, max: X.STREAK.max };
}

// ================================================================ JACKTOWN TOWN HALL
function plotOf(key) { const ED = E.D, a = acctOf(key); if (!a || a.plot < 0 || !ED.town) return null; const Pl = ED.town.plots[a.plot]; return Pl && Pl.o === a.name ? { i: a.plot, P: Pl } : null; }
function takings(key) {
  const pl = plotOf(key), p = P(key), lv = X.TOWN.levels[p.tw.lv] || X.TOWN.levels[0];
  if (!pl) return { gross: 0, net: 0, rates: lv.rates, cap: lv.cap, mood: 0 };
  let base = 0; for (const ch of pl.P.cells) base += X.TAKE[ch] || 0;
  const hap = (E.D.town.stats && E.D.town.stats.hap) || 50, mood = Math.round((0.6 + hap / 125) * 100) / 100;
  const gross = Math.min(lv.cap, Math.round(base * lv.mult * mood));
  return { base, gross, net: Math.max(0, gross - lv.rates), rates: lv.rates, cap: lv.cap, mood };
}
function plotValue(key) { const pl = plotOf(key); if (!pl) return 0; let v = 0; for (const ch of pl.P.cells) v += (ECAT.BUILD[ch] || { cost: 0 }).cost; const lv = P(key).tw.lv | 0; for (let i = 1; i <= lv; i++) v += X.TOWN.levels[i].cost; return v; }
function townView(key) {
  const d = today(), W = X.week(d).w, rows = [];
  for (const k of Object.keys(E.D.acct)) {
    const nm = memberName(k); if (!nm || !plotOf(k)) continue;
    const p = P(k), pl = plotOf(k);
    rows.push({ n: nm, nm: pl.P.nm || '', i: pl.i, lv: p.tw.lv | 0, v: plotValue(k), wk: p.tw.wk === W ? p.tw.wn | 0 : 0, tot: p.tw.tot | 0 });
  }
  const me = key ? P(key) : null, pl = key ? plotOf(key) : null, tk = key ? takings(key) : null;
  let days = 0; if (me && pl) days = !me.tw.last ? 1 : Math.min(X.TOWN.keep, Math.max(0, dayDiff(me.tw.last, d)));
  return { t: 'exTown', levels: X.TOWN.levels, take: X.TAKE, keep: X.TOWN.keep,
    me: me ? { plot: pl ? pl.i : -1, nm: pl ? pl.P.nm : '', cells: pl ? pl.P.cells : '', lv: me.tw.lv | 0, tk, days, owed: tk ? tk.net * days : 0, last: me.tw.last, wk: me.tw.wk === W ? me.tw.wn | 0 : 0, tot: me.tw.tot | 0, rent: Math.floor((acctOf(key) || {}).rentAcc || 0) } : null,
    byV: rows.slice().sort((x, y) => y.v - x.v).slice(0, 15), byWk: rows.filter(r => r.wk > 0).sort((x, y) => y.wk - x.wk).slice(0, 10), hap: (E.D.town.stats && E.D.town.stats.hap) || 0 };
}
function townCollect(ws, key) {
  const pl = plotOf(key); if (!pl) return err(ws, 'You need a plot in Jacktown first! Claim one at www.jacktown.jnet.');
  const p = P(key), a = acctOf(key), d = today();
  if (p.tw.last === d) return err(ws, "You've already collected today's takings. The till is empty! Come back tomorrow.");
  const days = !p.tw.last ? 1 : Math.min(X.TOWN.keep, Math.max(1, dayDiff(p.tw.last, d)));
  const tk = takings(key), amt = tk.net * days;
  p.tw.last = d;
  let got = 0;
  if (amt > 0) got = Math.max(0, E.earnA(a, 'extake', `Jacktown takings: ${days > 1 ? days + ' days at ' : ''}${pl.P.nm || 'plot ' + (pl.i + 1)} (after ${rp(tk.rates)} business rates)`, amt));
  const W = X.week(d).w; if (p.tw.wk !== W) { p.tw.wk = W; p.tw.wn = 0; } p.tw.wn += got; p.tw.tot = (p.tw.tot | 0) + got;
  ctx.markDirty();
  ctx.send(ws, Object.assign(townView(key), { got, days, gross: tk.gross * days, rates: tk.rates * days }));
}
function townUp(ws, key) {
  if (!plotOf(key)) return err(ws, 'You need a plot in Jacktown first!');
  const p = P(key), a = acctOf(key), lv = p.tw.lv | 0, next = X.TOWN.levels[lv + 1];
  if (!next) return err(ws, "Your plot is already a Retail Park. The council won't let you build any bigger. (They tried. Somebody objected.)");
  if (!E.debit(a, next.cost, 'town', `Jacktown Town Hall: upgraded to ${next.n}`)) return err(ws, `The upgrade to ${next.n} costs ${rp(next.cost)} and you have ${rp(a.bal)}.`);
  p.tw.lv = lv + 1; ctx.markDirty();
  if (p.tw.lv === X.TOWN.levels.length - 1) { try { require('./loot.js').giveOnce(key, 'badge.ex_tycoon', 'town'); } catch (e) {} }
  try { E.gaz('town', `${a.name.toUpperCase()} GOES UP IN THE WORLD`, `The planning committee has approved ${a.name}'s plans: their plot on Jacktown is now officially a ${next.n}. "More shops, more takings, more queues," said the Mayor, cutting a very small ribbon.`); } catch (e) {}
  ctx.send(ws, townView(key)); E.meToAll(a);
}

// ================================================================ JACKBAY RUPEE AUCTIONS
const B = X.BAY;
function priceOf(l) {
  const bs = l.bids.slice().sort((x, y) => y.max - x.max || x.at - y.at);
  if (!bs.length) return { p: l.start, lead: null, bs };
  const lead = bs[0], second = bs.find(b => b.k !== lead.k);
  const p = !second ? l.start : Math.max(l.start, Math.min(lead.max, second.max + B.inc(second.max)));
  return { p, lead, bs };
}
function lotView(l, key, full) {
  const pr = priceOf(l), my = key ? l.bids.find(b => b.k === key) : null;
  const o = { id: l.id, it: l.it, n: l.n, start: l.start, res: l.res ? 1 : 0, resMet: !l.res || (pr.lead && pr.lead.max >= l.res) ? 1 : 0, p: pr.p, nb: l.nb | 0, nbr: new Set(l.bids.map(b => b.k)).size, end: l.end, at: l.at, ext: l.ext | 0, hi: pr.lead ? pr.lead.n : '', st: l.st, mine: l.k === key ? 1 : 0, myMax: my ? my.max : 0, lead: pr.lead && pr.lead.k === key ? 1 : 0, min: pr.lead ? pr.p + B.inc(pr.p) : l.start };
  if (full) o.hist = l.log.slice(-30).reverse(); // [ts, name, shown price]
  return o;
}
function lotLog(l, name) { const pr = priceOf(l); l.log.push([Date.now(), name, pr.p]); if (l.log.length > 60) l.log.splice(0, l.log.length - 60); }
function bayList(ws, key, m) {
  const ty = String(m.ty || ''), q = String(m.q || '').toLowerCase().slice(0, 40), sort = String(m.sort || 'soon');
  let list = Object.values(D.bay.lots).filter(l => l.st === 'open');
  if (ty && LCAT.TYPES[ty]) list = list.filter(l => (LCAT.ITEM[l.it.id] || {}).type === ty);
  if (q) list = list.filter(l => ((LCAT.ITEM[l.it.id] || {}).name || '').toLowerCase().includes(q) || l.n.toLowerCase().includes(q));
  const pv = l => priceOf(l).p;
  list.sort(sort === 'new' ? (x, y) => y.at - x.at : sort === 'price' ? (x, y) => pv(y) - pv(x) : sort === 'cheap' ? (x, y) => pv(x) - pv(y) : sort === 'bids' ? (x, y) => (y.nb | 0) - (x.nb | 0) : (x, y) => x.end - y.end);
  ctx.send(ws, { t: 'exBay', list: list.slice(0, 60).map(l => lotView(l, key)), n: list.length, all: Object.values(D.bay.lots).filter(l => l.st === 'open').length, fees: { pct: B.finalPct, res: B.reserveFee }, now: Date.now() });
}
function baySell(ws, c, key, m) {
  const L = LA(); if (!L) return;
  if (!c.exBs) c.exBs = new ctx.Bucket(0.3, 4); if (!c.exBs.take()) return err(ws, 'Slow down! One listing every few seconds.');
  const lp = L.P(key), a = acctOf(key), x = isInt(m.u, 1, 1e12) ? L.findItem(lp, m.u) : null;
  if (!x) return err(ws, "That isn't in your Treasure Chest any more.");
  if (x.lk) return err(ws, "That's already tied up in a trade, the Bazaar or another auction.");
  const start = m.start, res = m.res == null || m.res === 0 ? 0 : m.res, dur = m.dur;
  if (!isInt(start, 1, B.priceMax)) return err(ws, `Pick a starting price from 1 to ${rp(B.priceMax)}.`);
  if (res && (!isInt(res, start + 1, B.priceMax))) return err(ws, 'A reserve price has to be more than the starting price (or leave it empty).');
  if (!B.durs.some(d => d[0] === dur)) return err(ws, 'Pick how long the auction runs for.');
  const mineN = Object.values(D.bay.lots).filter(l => l.st === 'open' && l.k === key).length;
  if (mineN >= B.maxLots) return err(ws, `You can have ${B.maxLots} auctions running at once. Wait for one to finish!`);
  const fee = B.listFee(start) + (res ? B.reserveFee : 0);
  if (!E.debit(a, fee, 'jackbay', `JackBay listing fee: ${LCAT.ITEM[x.id].name}`)) return err(ws, `The listing fee is ${rp(fee)} and you have ${rp(a.bal)}.`);
  L.unequipU(key, x.u);
  const id = ++D.bay.seq, now = Date.now();
  x.lk = 'b' + id;
  const l = { id, k: key, n: a.name, u: x.u, it: L.pub(x), start, res, dur, at: now, end: now + dur * 60000, ext: 0, bids: [], nb: 0, log: [], st: 'open', fee };
  D.bay.lots[id] = l; D.st.lots++; ctx.markDirty();
  ctx.send(ws, { t: 'exBaySold', id, fee });
  L.sendMe(key); E.meToAll(a);
  ctx.broadcast({ t: 'exBayCh', id, p: start, nb: 0, end: l.end, add: 1 });
}
function bayBid(ws, c, key, m) {
  if (!c.exBb) c.exBb = new ctx.Bucket(0.5, 5); if (!c.exBb.take()) return err(ws, 'Slow down! The auctioneer can only talk so fast.');
  const l = D.bay.lots[m.id | 0]; if (!l || l.st !== 'open') return err(ws, 'That auction has finished.');
  const now = Date.now(); if (now >= l.end) return err(ws, 'Too late! The hammer has come down.');
  if (l.k === key) return err(ws, "You can't bid on your own auction. (That's called shill bidding, and it's naughty.)");
  const a = acctOf(key); if (!a) return;
  if ((a.earned | 0) < B.minEarned) return err(ws, `You need to have earned ${rp(B.minEarned)} yourself before you can bid on JackBay. (It stops people making forty accounts.)`);
  const max = m.max; if (!isInt(max, 1, B.priceMax)) return err(ws, 'Type your maximum bid in whole Rupees.');
  const pr = priceOf(l), my = l.bids.find(b => b.k === key), leading = pr.lead && pr.lead.k === key;
  if (leading) {
    if (max <= my.max) return err(ws, `You're already the high bidder, with a maximum of ${rp(my.max)}. To raise it, bid more than that.`);
  } else {
    const need = pr.lead ? pr.p + B.inc(pr.p) : l.start;
    if (max < need) return err(ws, `Your bid has to be at least ${rp(need)}.`);
    const act = Object.values(D.bay.lots).filter(x => x.st === 'open' && x.bids.some(b => b.k === key && b.hold > 0)).length;
    if (act >= B.maxBids) return err(ws, `You're winning ${B.maxBids} auctions already! Let some finish first.`);
  }
  const hold = my ? my.hold | 0 : 0, extra = max - hold;
  if (extra > 0 && !E.debit(a, extra, 'jackbay', `JackBay bid (held until the end): ${LCAT.ITEM[l.it.id] ? LCAT.ITEM[l.it.id].name : 'item'}`)) return err(ws, `You need ${rp(extra)} to back that bid, and you have ${rp(a.bal)}. (The money waits safely at JackBay; you get it back if somebody outbids you.)`);
  if (my) { my.max = max; my.hold = max; my.at = leading ? my.at : now; } else l.bids.push({ k: key, n: a.name, max, hold: max, at: now });
  l.nb = (l.nb | 0) + 1;
  // whoever isn't winning any more gets their money back straight away
  const after = priceOf(l), oldLead = pr.lead;
  for (const b of l.bids) if (b.hold > 0 && b.k !== after.lead.k) {
    const ba = acctOf(b.k); if (ba) E.credit(ba, b.hold, 'jackbay', `JackBay: outbid on ${LCAT.ITEM[l.it.id] ? LCAT.ITEM[l.it.id].name : 'an item'} (bid returned)`, true);
    b.hold = 0;
    if (ba) { E.meToAll(ba); note(b.k, { t: 'exBayNote', k: 'outbid', id: l.id, name: (LCAT.ITEM[l.it.id] || {}).name || '', p: after.p, by: after.lead.n }); }
  }
  let snipe = 0;
  if (l.end - now < B.snipe * 1000 && (l.ext | 0) < B.snipeMax) { l.end = now + B.snipe * 1000; l.ext = (l.ext | 0) + 1; snipe = 1; }
  lotLog(l, a.name); ctx.markDirty();
  const wonIt = after.lead.k === key;
  ctx.send(ws, { t: 'exBayBidOk', id: l.id, lead: wonIt ? 1 : 0, p: after.p, max, snipe, outbidBy: wonIt ? '' : after.lead.n });
  if (!wonIt && oldLead && oldLead.k !== key) { /* (proxy bidding: the leader's maximum was higher; their price went up) */ }
  E.meToAll(a);
  ctx.broadcast({ t: 'exBayCh', id: l.id, p: after.p, nb: l.nb, end: l.end, hi: after.lead.n, snipe });
}
function bayCancel(ws, key, m) {
  const l = D.bay.lots[m.id | 0]; if (!l || l.st !== 'open' || l.k !== key) return err(ws, "That isn't your auction (or it's already finished).");
  if (l.bids.length) return err(ws, "Somebody has already bid, so you can't cancel it! A deal's a deal. (JackBay rules.)");
  close(l, 'cancel');
  ctx.send(ws, { t: 'exBayDoneOk', id: l.id, st: 'cancel' });
}
// the hammer comes down
function close(l, st) {
  const L = LA(); if (!L) return;
  const pr = priceOf(l), name = (LCAT.ITEM[l.it.id] || {}).name || 'item', seller = acctOf(l.k), lp = memberName(l.k) ? L.P(l.k) : null;
  const x = lp ? L.findItem(lp, l.u) : null;
  const refund = (b, why) => { if (!(b.hold > 0)) return; const ba = acctOf(b.k); if (ba) { E.credit(ba, b.hold, 'jackbay', why, true); E.meToAll(ba); } b.hold = 0; };
  const unlock = () => { if (x && x.lk === 'b' + l.id) delete x.lk; };
  let res = st;
  if (st === 'cancel') { unlock(); }
  else if (!seller || !x || x.lk !== 'b' + l.id) { res = 'broken'; for (const b of l.bids) refund(b, `JackBay: auction ${l.id} was called off (bid returned)`); unlock(); }
  else if (!pr.lead) { res = 'nobids'; unlock(); }
  else if (l.res && pr.lead.max < l.res) { res = 'reserve'; for (const b of l.bids) refund(b, `JackBay: reserve not met on ${name} (bid returned)`); unlock(); }
  else {
    res = 'sold';
    const buyer = acctOf(pr.lead.k), bk = pr.lead.k, price = pr.p, fee = Math.max(1, Math.floor(price * B.finalPct / 100));
    if (!buyer) { res = 'broken'; for (const b of l.bids) refund(b, 'JackBay: auction called off (bid returned)'); unlock(); }
    else {
      for (const b of l.bids) if (b.k !== bk) refund(b, `JackBay: ${name} (bid returned)`);
      const lead = l.bids.find(b => b.k === bk), back = (lead.hold | 0) - price; lead.hold = 0;
      if (back > 0) E.credit(buyer, back, 'jackbay', `JackBay: won ${name} for ${rp(price)} (the rest of your bid back)`, true);
      const y = L.take(l.k, x.u); if (y) { delete y.lk; y.src = 'jackbay'; L.P(bk).it.push(y); }
      E.credit(seller, price - fee, 'jackbay', `JackBay: sold ${name} to ${buyer.name} for ${rp(price)} (fee ${fee})`);
      const ps = P(l.k), pb = P(bk); ps.bay.sold++; ps.bay.earned += price - fee; pb.bay.bought++; pb.bay.spent += price;
      l.price = price; l.buyer = buyer.name; l.bk = bk; l.fee2 = fee; D.st.sold++;
      try { const LM = require('./loot.js'); LM.giveOnce(bk, 'badge.ex_auction', 'jackbay'); } catch (e) {}
      L.checkAll(bk); L.sendMe(bk); E.meToAll(buyer);
      note(bk, { t: 'exBayNote', k: 'won', id: l.id, name, p: price, from: l.n });
      note(l.k, { t: 'exBayNote', k: 'sold', id: l.id, name, p: price, fee, to: buyer.name });
    }
  }
  if (res !== 'sold' && res !== 'cancel') note(l.k, { t: 'exBayNote', k: res, id: l.id, name, p: pr.p });
  if (res === 'reserve' && pr.lead) note(pr.lead.k, { t: 'exBayNote', k: 'noreserve', id: l.id, name });
  l.st = res; l.closed = Date.now();
  delete D.bay.lots[l.id];
  D.bay.done.push({ id: l.id, k: l.k, n: l.n, it: l.it, start: l.start, res: l.res ? 1 : 0, p: l.price || 0, buyer: l.buyer || '', bk: l.bk || '', st: res, nb: l.nb | 0, at: l.at, end: l.closed, ks: [...new Set(l.bids.map(b => b.k))] });
  if (D.bay.done.length > 300) D.bay.done.splice(0, D.bay.done.length - 300);
  if (lp) L.sendMe(l.k); if (seller) E.meToAll(seller);
  ctx.markDirty();
  ctx.broadcast({ t: 'exBayCh', id: l.id, st: res });
}
function bayClock() { const now = Date.now(); for (const l of Object.values(D.bay.lots)) if (l.st === 'open' && now >= l.end) { try { close(l, 'end'); } catch (e) { console.error('ex bay close', e); } } }
function bayMine(ws, key) {
  const open = Object.values(D.bay.lots);
  const done = D.bay.done.filter(d => d.k === key || d.bk === key || (d.ks || []).includes(key)).slice(-40).reverse();
  ctx.send(ws, { t: 'exBayMine', selling: open.filter(l => l.k === key).map(l => lotView(l, key)), bidding: open.filter(l => l.bids.some(b => b.k === key)).map(l => lotView(l, key)), done, me: P(key).bay });
}
function bayDone(ws) {
  const sold = D.bay.done.filter(d => d.st === 'sold').slice(-40).reverse();
  const top = D.bay.done.filter(d => d.st === 'sold').sort((x, y) => y.p - x.p).slice(0, 10);
  ctx.send(ws, { t: 'exBayDone', sold, top, st: { lots: D.st.lots, sold: D.st.sold } });
}

// ================================================================ dispatch
const OPEN = new Set(['exClashCpu', 'exClashGo', 'exClashQuit', 'exClashMine', 'exClashPair', 'exBayList', 'exBayLot', 'exBayDone', 'exTour', 'exJobs', 'exTown']);
function handle(ws, c, m) {
  if (!c.exRl) c.exRl = new ctx.Bucket(8, 40);
  if (!c.exRl.take()) return err(ws, 'Slow down! The JackNet server is only a 486.');
  const key = keyOfC(c), mem = !!(key && memberName(key));
  if (!mem && !OPEN.has(m.t)) { if (m.t === 'exMe') return ctx.send(ws, { t: 'exMe', guest: true }); return err(ws, NEED); }
  switch (m.t) {
    case 'exMe': return ctx.send(ws, meView(key));
    case 'exDeck': return setDeck(ws, key, m);
    case 'exStarter': return starter(ws, key);
    case 'exPackBuy': return packBuy(ws, key, m);
    case 'exPackOpen': return packOpen(ws, c, key);
    case 'exClashCpu': return cpuStart(ws, c, m);
    case 'exClashGo': return go(ws, c, m);
    case 'exClashQuit': return quit(ws, c, m);
    case 'exClashMine': return mine(ws, c);
    case 'exClashPair': return pair(ws, c, m);
    case 'exBayList': return bayList(ws, mem ? key : null, m);
    case 'exBayLot': { const l = D.bay.lots[m.id | 0]; if (l) return ctx.send(ws, { t: 'exBayLot', lot: lotView(l, mem ? key : null, true), now: Date.now() }); const d = D.bay.done.find(x => x.id === (m.id | 0)); return ctx.send(ws, { t: 'exBayLot', lot: null, done: d || null, now: Date.now() }); }
    case 'exBaySell': return baySell(ws, c, key, m);
    case 'exBayBid': return bayBid(ws, c, key, m);
    case 'exBayCancel': return bayCancel(ws, key, m);
    case 'exBayMine': return bayMine(ws, key);
    case 'exBayDone': return bayDone(ws);
    case 'exTown': return ctx.send(ws, townView(mem ? key : null));
    case 'exTownCollect': return townCollect(ws, key);
    case 'exTownUp': return townUp(ws, key);
    case 'exJobs': return ctx.send(ws, jobsView(mem ? key : null));
    case 'exTour': return ctx.send(ws, tourView(mem ? key : null));
  }
}

module.exports = {
  name: 'ex',
  types: ['exMe', 'exDeck', 'exStarter', 'exPackBuy', 'exPackOpen', 'exClashCpu', 'exClashGo', 'exClashQuit', 'exClashMine', 'exClashPair', 'exBayList', 'exBayLot', 'exBaySell', 'exBayBid', 'exBayCancel', 'exBayMine', 'exBayDone', 'exTown', 'exTownCollect', 'exTownUp', 'exJobs', 'exTour'],
  init(x) {
    ctx = x; D = x.data; initData();
    E = ECON.api; if (!E || !E.HOOKS) { console.error('ex: econ is missing'); return; }
    for (const k in X.EARN) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = X.EARN[k];
    setTimeout(() => { try { tour(); } catch (e) { console.error('ex tour', e); } }, 0); // (after every mod has loaded: the prizes need the JackLoot chest)
    x.on('hello', (ws, c) => { const key = keyOfC(c); if (key && memberName(key)) { ctx.send(ws, meView(key)); inbox(key); } const id = seatOf.get(seatKey(c)); if (id && duels.has(id)) ctx.send(ws, { t: 'exClashLive', id }); });
    x.on('login', c => { const key = keyOfC(c); if (key) { sendTo(key, meView(key)); inbox(key); } });
    x.on('score', (c, game, sc) => { const key = keyOfC(c); if (!key || !memberName(key)) return; const T = tour(), ev = (T.ev || []).find(e => e.k === 'arcade'); if (ev && ev.g === String(game) && sc > 0) enter('arcade', key, Math.floor(sc), false); });
    x.on('grJob', onJob);
    setInterval(() => { try { duelClock(); } catch (e) { console.error('ex duel clock', e); } }, 1000);
    setInterval(() => { try { bayClock(); } catch (e) { console.error('ex bay clock', e); } }, 2000);
    setInterval(() => { try { tour(); } catch (e) { console.error('ex tour', e); } }, 60000);
  },
  handle,
  _test: { get D() { return D; }, duels, rollPack, priceOf, close, finalTour, tour, takings, P, battleDeck, deckRules },
};
