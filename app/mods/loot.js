/* loot: JackLoot, the collect-and-trade game on top of the Rupee economy (mods/econ.js keeps the money; this keeps the stuff).
 * The catalogue is public/js/loot-cat.js (shared with the browser). Everything is decided here: drops are rolled with
 * crypto randomness when the server pays Rupees for something (econ's earn path calls us), plus one Daily Parcel a day.
 * Rupees only ever buy SPECIFIC items (shopkeepers, the Bazaar). Nothing random is ever sold. Guests can only look.
 *   client -> { t:'lootMe' }                              <- { t:'lootMe', it:[{u,id,s,at,src,lk}], lw, mis, ach, sets, par, st, pay, md }
 *   client -> { t:'lootEv', k:'site'|'prog'|'install'|'play'|'cards'|'cupboard'|'bazaar', id }   (the few things only the browser sees)
 *   client -> { t:'lootOpen' }                            <- { t:'lootGot', its:[...], src:'parcel' }
 *   client -> { t:'lootEquip', u, slot } / { t:'lootUnequip', slot }
 *   client -> { t:'lootRecycle', us:[u] } / { t:'lootCombine', us:[u x5], want }
 *   client -> { t:'lootPay', to, amt, note }              <- { t:'lootPaid', to, amt } (the other member's bank gets it)
 *   client -> { t:'lootTNew', to } / { t:'lootTSet', id, us, teef } / { t:'lootTOk', id, ok } / { t:'lootTCancel', id } / { t:'lootTList' }
 *          <- { t:'lootTrade', tr } (both sides, live) / { t:'lootTrades', list }
 *   client -> { t:'lootMkt', type, r } / { t:'lootSell', u, price } / { t:'lootUnsell', id } / { t:'lootBuy', id }   <- { t:'lootMkt', list, sold }
 *   client -> { t:'lootShop', k } / { t:'lootShopBuy', k, id }   <- { t:'lootShop', k, stock:[[id, price]] }
 *   client -> { t:'lootHof' } / { t:'lootDb' } / { t:'lootProfile', name }
 *   server -> { t:'lootHi', pub } on connect, { t:'lootPub', n, p } when someone changes what others see, { t:'lootFeed', e }
 * Data: state.mods.loot = { seq, ser:{id:minted}, p:{memberKey: P}, tr:{id: trade}, tseq, mk:{seq, list, sold}, feed } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const L = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECON = require('./econ.js'); // the same module instance the server loaded (same file, same require cache)
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));

const R = L.RULES, ITEM = L.ITEM;
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const rnd = () => crypto.randomInt(0, 1e9) / 1e9;
const rp = n => { n = Math.floor(+n || 0); return `${n.toLocaleString('en-GB')} ${n === 1 ? 'Rupee' : 'Rupees'}`; }; // visible money text: "1 Rupee", "250 Rupees"
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const ECON_SLOTS = ['hat', 'face', 'badge', 'pet', 'cur', 'wall', 'col', 'gub'];
const LOOT_SLOTS = ['amp', 'flower', 'name', 'btn', 'card'];
const PUB_SLOTS = ['name', 'btn', 'card'];
let ctx, D, E;

// ---------------------------------------------------------------- data
function initData() {
  D.v = 1; D.seq = D.seq | 0; D.ser = D.ser || {}; D.ct = D.ct || {}; D.p = D.p || {}; D.tr = D.tr || {}; D.tseq = D.tseq | 0;
  D.mk = D.mk || { seq: 0, list: [], sold: [] }; D.feed = D.feed || [];
}
function keyOf(name) { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; }
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') p = D.p[key] = { it: [], sites: [], progs: [], pb: {}, mis: null, ach: {}, sets: {}, par: [], dr: { day: '', n: 0 }, st: {}, lw: {}, pay: { day: '', sent: 0, recv: 0 }, shop: { day: '', b: {} } };
  return p;
}
const memberName = key => { const m = ctx.state.members[key]; return m ? m.name : null; };
const acctOf = key => { const nm = memberName(key); return nm ? E.acct({ member: nm }) : null; };
const keyOfC = c => (c && c.member ? keyOf(c.member) : null);
const today = () => E.uk().day;
const mdNow = () => { const d = today(); return +d.slice(5, 7) * 100 + +d.slice(8, 10); };
function sendTo(key, msg) { const s = JSON.stringify(msg); for (const [ws, c] of ctx.clients) if (c.member && c.member.toLowerCase() === key) ctx.send(ws, s); }
function err(ws, msg) { ctx.send(ws, { t: 'lootErr', msg }); }
const NEED = 'JackLoot is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!';
const findItem = (p, u) => p.it.find(x => x.u === u);
const pub = x => ({ u: x.u, id: x.id, s: x.s | 0, at: x.at, src: x.src, lk: x.lk || '' });

// ---------------------------------------------------------------- minting + giving
function canMint(it) { return !it.lim || (D.ser[it.id] | 0) < it.lim; }
function mint(id, src) {
  const it = ITEM[id]; if (!it || !canMint(it)) return null;
  const x = { u: ++D.seq, id, s: 0, at: Date.now(), src: String(src || '').slice(0, 12) };
  D.ct[id] = (D.ct[id] | 0) + 1;
  if (it.lim) { D.ser[id] = (D.ser[id] | 0) + 1; x.s = D.ser[id]; }
  ctx.markDirty();
  return x;
}
// pick an item: roll a rarity with the weights, then any eligible item of that rarity (in season, not sold out, not exclusive)
function roll(weights, minR) {
  const md = mdNow();
  let tot = 0; for (let r = minR || 0; r < 6; r++) tot += weights[r];
  let x = rnd() * tot, r = minR || 0;
  for (; r < 5; r++) { x -= weights[r]; if (x < 0) break; }
  for (; r >= 0; r--) {
    const pool = L.ITEMS.filter(it => it.r === r && !it.ex && L.inSeason(it, md) && canMint(it));
    if (pool.length) {
      // seasonal things are a little more likely while their season is on, so they feel special but findable
      const w = pool.map(it => (it.sea ? 3 : 1)); let s = rnd() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) { s -= w[i]; if (s < 0) return pool[i].id; }
      return pool[pool.length - 1].id;
    }
  }
  return null;
}
const W_PLAY = L.RAR.map(r => r.w), W_PARCEL = L.RAR.map(r => r.wp);
function give(key, x, why) {
  const p = P(key), a = acctOf(key); if (!a || !x) return null;
  const it = ITEM[x.id];
  if (p.it.length >= R.invMax) { E.credit(a, L.RAR[it.r].rec, 'recycle', `Chest full! Recycled ${it.name}`); return null; }
  delete x.lk;
  p.it.push(x); ctx.markDirty();
  if (it.r >= 2) feed(a.name, x);
  sendTo(key, { t: 'lootGot', its: [pub(x)], src: why || x.src });
  checkAll(key);
  return x;
}
function feed(name, x) {
  const it = ITEM[x.id], e = { ts: Date.now(), n: name, id: x.id, s: x.s | 0 };
  D.feed.push(e); if (D.feed.length > 40) D.feed.splice(0, D.feed.length - 40);
  ctx.broadcast({ t: 'lootFeed', e });
  if (it.r >= 4) ctx.pushChat({ sys: true, text: `*** WOW! ${name} just found ${it.r === 5 ? 'a JACKPOT' : 'a LEGENDARY'} ${it.name}${x.s ? ` (#${x.s} of ${it.lim})` : ''}! (www.lootlings.jnet)`, ts: Date.now() });
  hofAt = 0;
}
function randomDrop(key, src) {
  const p = P(key), d = today();
  if (p.dr.day !== d) p.dr = { day: d, n: 0 };
  if (p.dr.n >= R.dropsPerDay) return null;
  const id = roll(W_PLAY); if (!id) return null;
  p.dr.n++; p.st.drops = (p.st.drops | 0) + 1;
  return give(key, mint(id, src), src);
}

// ---------------------------------------------------------------- earn hook: missions + drops
function onEarn(a, src, amt, paying) {
  const key = keyOf(a.name); if (!key || !memberName(key)) return;
  const rule = ECAT.EARN[src];
  if (src !== 'mission' && src !== 'set' && src !== 'ach') progress(key, src);
  if (paying && rule && rule.drop && rnd() < rule.drop) randomDrop(key, src);
}
function onDaily(a) {
  const key = keyOf(a.name); if (!key) return;
  const p = P(key), d = today(), md = mdNow();
  if (p.parDay !== d) { p.parDay = d; if (p.par.length < R.parcelsMax) { p.par.push({ day: d, at: Date.now() }); sendTo(key, { t: 'lootParcel', n: p.par.length }); } }
  if (md >= R.openDay && md <= R.openDay + 6) ach(key, 'opening');
  if ((a.days | 0) >= 7) ach(key, 'days7');
  ctx.markDirty();
}

// ---------------------------------------------------------------- daily missions (three a day, the same three all day)
function missions(key) {
  const p = P(key), d = today();
  if (!p.mis || p.mis.day !== d) {
    const pool = L.MISSIONS.slice(), pick = [];
    let h = L.hash(key + '|' + d);
    while (pick.length < 3 && pool.length) { const i = h % pool.length; pick.push(pool.splice(i, 1)[0].id); h = L.hash(String(h) + d); }
    p.mis = { day: d, l: pick.map(id => [id, 0, 0]), bonus: 0 };
    ctx.markDirty();
  }
  return p.mis;
}
function progress(key, ev) {
  const M = missions(key); let changed = false;
  M.l.forEach((row, i) => {
    const m = L.MISS[row[0]]; if (!m || row[2] || !m.ev.includes(ev)) return;
    row[1]++; changed = true;
    if (row[1] >= m.need) {
      row[2] = 1;
      const a = acctOf(key); if (!a) return;
      const p = P(key); p.st.missions = (p.st.missions | 0) + 1;
      E.earnA(a, 'mission', `Daily Mission: ${m.n}`, L.MISSION_TEEF[i] || 15);
      if (rnd() < 0.5) give(key, mint(roll(W_PLAY), 'mission'), 'mission');
      if ((p.st.missions | 0) >= 10) ach(key, 'missions10');
    }
  });
  if (M.l.every(r => r[2]) && !M.bonus) {
    M.bonus = 1; const a = acctOf(key);
    if (a) { E.earnA(a, 'mission', 'Daily Missions: all three done!', L.MISSION_BONUS); give(key, mint(roll(W_PARCEL, 1), 'mission'), 'mission'); ach(key, 'missions'); }
  }
  if (changed) { ctx.markDirty(); sendTo(key, { t: 'lootMis', mis: misView(key) }); }
}
function misView(key) { const M = missions(key); return { day: M.day, bonus: M.bonus, l: M.l.map(([id, n, done], i) => ({ id, n: Math.min(n, L.MISS[id] ? L.MISS[id].need : 1), done: !!done, teef: L.MISSION_TEEF[i] || 15 })) }; }

// ---------------------------------------------------------------- achievements + sets
function ach(key, id) {
  const p = P(key), A = L.ACHI[id]; if (!A || p.ach[id]) return;
  p.ach[id] = Date.now(); ctx.markDirty();
  const a = acctOf(key); if (!a) return;
  if (A.teef) E.earnA(a, 'ach', `Achievement: ${A.n}`, A.teef);
  sendTo(key, { t: 'lootAch', id });
  if (A.give) give(key, mint(A.give, 'ach'), 'ach');
}
function uniq(p) { const s = new Set(); for (const x of p.it) s.add(x.id); return s; }
function checkAll(key) {
  const p = P(key), have = uniq(p), n = have.size;
  if (p.it.length) ach(key, 'firstdrop');
  if (n >= 10) ach(key, 'items10'); if (n >= 50) ach(key, 'items50'); if (n >= 100) ach(key, 'items100');
  const rs = new Set(); for (const id of have) rs.add(ITEM[id].r);
  if (rs.has(2)) ach(key, 'rare'); if (rs.has(3)) ach(key, 'epic'); if (rs.has(4)) ach(key, 'legend'); if (rs.has(5)) ach(key, 'jackpot');
  if (p.it.some(x => x.s === 1)) ach(key, 'serial1');
  for (const S of L.SETS) {
    if (p.sets[S.id]) continue;
    const done = S.rar ? [0, 1, 2, 3, 4, 5].every(r => rs.has(r)) : S.items.every(id => have.has(id));
    if (!done) continue;
    p.sets[S.id] = Date.now(); ctx.markDirty();
    const a = acctOf(key); if (!a) continue;
    E.earnA(a, 'set', `Collection complete: ${S.n}`, S.teef);
    sendTo(key, { t: 'lootSet', id: S.id });
    ach(key, 'set'); if (Object.keys(p.sets).length >= 5) ach(key, 'sets5');
    if (S.give) give(key, mint(S.give, 'set'), 'set');
    ctx.pushChat({ sys: true, text: `*** ${a.name} completed the "${S.n}" collection on Lootlings!`, ts: Date.now() });
  }
}

// ---------------------------------------------------------------- views
function score(p) { let s = 0; for (const id of uniq(p)) s += L.RAR[ITEM[id].r].pts; return s + Object.keys(p.sets).length * 50; }
function pubOf(key) {
  const p = D.p[key]; if (!p) return null;
  const o = {}; for (const sl of PUB_SLOTS) { const x = p.lw[sl] && findItem(p, p.lw[sl]); if (x) o[sl] = x.id; }
  return Object.keys(o).length ? o : null;
}
function meView(key) {
  const p = P(key), a = acctOf(key), d = today();
  if (p.dr.day !== d) p.dr = { day: d, n: 0 };
  if (p.pay.day !== d) p.pay = { day: d, sent: 0, recv: 0 };
  const lw = {}; for (const sl of LOOT_SLOTS) if (p.lw[sl] && findItem(p, p.lw[sl])) lw[sl] = p.lw[sl];
  for (const sl of ECON_SLOTS) { const w = a && a.wear && a.wear[sl]; if (w && w.startsWith('L:') && p.lw[sl] && findItem(p, p.lw[sl]) && findItem(p, p.lw[sl]).id === w.slice(2)) lw[sl] = p.lw[sl]; }
  return { t: 'lootMe', name: a ? a.name : '', it: p.it.map(pub), lw, mis: misView(key), ach: p.ach, sets: p.sets, par: p.par.length, st: p.st, drops: [p.dr.n, R.dropsPerDay], pay: { sent: p.pay.sent, recv: p.pay.recv, max: R.payDayMax, ok: !!(a && (a.earned | 0) >= R.payMinEarned) }, md: mdNow(), score: score(p), sites: p.sites.length, progs: p.progs.length };
}
const sendMe = key => sendTo(key, meView(key));
function tradeView(T, key) {
  const me = T.a === key ? 'a' : 'b', ot = me === 'a' ? 'b' : 'a';
  const side = s => ({ name: T[s + 'n'], items: T['i' + s].map(u => { const x = findItem(P(T[s]), u); return x ? pub(x) : null; }).filter(Boolean), teef: T['t' + s], ok: !!T['o' + s] });
  return { id: T.id, st: T.st, ts: T.ts, up: T.up, mine: side(me), theirs: side(ot), why: T.why || '' };
}
function pushTrade(T) { for (const k of [T.a, T.b]) sendTo(k, { t: 'lootTrade', tr: tradeView(T, k) }); }
function mktView(m) {
  let list = D.mk.list;
  if (m && L.TYPES[m.type]) list = list.filter(x => ITEM[x.it.id].type === m.type);
  if (m && isInt(m.r, 0, 5)) list = list.filter(x => ITEM[x.it.id].r === m.r);
  list = list.slice().sort((x, y) => ITEM[y.it.id].r - ITEM[x.it.id].r || x.p - y.p).slice(0, 80);
  return { t: 'lootMkt', list: list.map(x => ({ id: x.id, n: x.n, it: pub(x.it), p: x.p, at: x.at })), sold: D.mk.sold.slice(-12).reverse(), n: D.mk.list.length, fee: R.feePct };
}
let hofCache = null, hofAt = 0;
function hof() {
  if (hofCache && Date.now() - hofAt < 30000) return hofCache;
  const rare = [], board = [];
  for (const key in D.p) {
    const nm = memberName(key); if (!nm) continue;
    const p = D.p[key];
    for (const x of p.it) if (ITEM[x.id] && ITEM[x.id].r >= 3) rare.push({ n: nm, it: pub(x) });
    board.push({ n: nm, sc: score(p), u: uniq(p).size, sets: Object.keys(p.sets).length, found: p.st.drops | 0 });
  }
  rare.sort((x, y) => ITEM[y.it.id].r - ITEM[x.it.id].r || (x.it.s || 1e9) - (y.it.s || 1e9) || x.it.at - y.it.at);
  board.sort((x, y) => y.sc - x.sc || x.n.localeCompare(y.n));
  hofCache = { t: 'lootHof', rare: rare.slice(0, 40), top: board.slice(0, 25), sets: board.slice().sort((x, y) => y.sets - x.sets || y.sc - x.sc).slice(0, 10), feed: D.feed.slice(-20).reverse(), players: board.length };
  hofAt = Date.now();
  return hofCache;
}
function profile(name) {
  const key = keyOf(name); if (!key || !memberName(key)) return { t: 'lootProfile', name: String(name || '').slice(0, 20), none: true };
  const p = D.p[key]; if (!p || !p.it.length) return { t: 'lootProfile', name: memberName(key), none: true };
  const best = new Map(); for (const x of p.it) { const o = best.get(x.id); if (!o || (x.s && (!o.s || x.s < o.s))) best.set(x.id, x); }
  const top = [...best.values()].sort((x, y) => ITEM[y.id].r - ITEM[x.id].r || (x.s || 1e9) - (y.s || 1e9)).slice(0, 8).map(pub);
  const per = [0, 0, 0, 0, 0, 0]; for (const id of best.keys()) per[ITEM[id].r]++;
  return { t: 'lootProfile', name: memberName(key), score: score(p), u: best.size, n: p.it.length, sets: Object.keys(p.sets), per, top, pub: pubOf(key) };
}

// ---------------------------------------------------------------- equipping
function unequipU(key, u) {
  const p = P(key), a = acctOf(key); let changed = false, pubCh = false, wearCh = false;
  for (const sl of Object.keys(p.lw)) {
    if (p.lw[sl] !== u) continue;
    delete p.lw[sl]; changed = true;
    if (ECON_SLOTS.includes(sl) && a && a.wear && String(a.wear[sl] || '').startsWith('L:')) { delete a.wear[sl]; wearCh = true; }
    if (PUB_SLOTS.includes(sl)) pubCh = true;
  }
  if (changed) { ctx.markDirty(); if (a) { E.meToAll(a); if (wearCh) ctx.broadcast({ t: 'ecWear', n: a.name, w: E.pubWear(a) }); } if (pubCh) ctx.broadcast({ t: 'lootPub', n: memberName(key), p: pubOf(key) }); }
}
function equip(ws, key, m) {
  const p = P(key), a = acctOf(key), u = m.u, slot = String(m.slot || '');
  const x = isInt(u, 1, 1e12) ? findItem(p, u) : null;
  if (!x) return err(ws, "You haven't got that any more.");
  if (x.lk) return err(ws, "That's tied up in a trade or on the Bazaar right now.");
  const it = ITEM[x.id], want = slot || it.type;
  if (it.type === 'trinket') return err(ws, 'Trinkets just sit in your Treasure Chest being shiny. You cannot wear them.');
  if (it.type === 'furni') return err(ws, 'That is JackWorld furni: put it out in your room with the JackWorld 99 program.');
  if (!(want === it.type || (want === 'gub' && it.type === 'hat'))) return;
  p.lw[want] = x.u;
  if (ECON_SLOTS.includes(want)) { a.wear[want] = 'L:' + x.id; if (/^(hat|face|badge|gub)$/.test(want)) ctx.broadcast({ t: 'ecWear', n: a.name, w: E.pubWear(a) }); }
  if (PUB_SLOTS.includes(want)) ctx.broadcast({ t: 'lootPub', n: a.name, p: pubOf(key) });
  ctx.markDirty(); E.meToAll(a); sendMe(key);
}
function unequip(ws, key, m) {
  const p = P(key), a = acctOf(key), slot = String(m.slot || '');
  if (!ECON_SLOTS.includes(slot) && !LOOT_SLOTS.includes(slot)) return;
  delete p.lw[slot];
  if (ECON_SLOTS.includes(slot) && String(a.wear[slot] || '').startsWith('L:')) { delete a.wear[slot]; if (/^(hat|face|badge|gub)$/.test(slot)) ctx.broadcast({ t: 'ecWear', n: a.name, w: E.pubWear(a) }); }
  if (PUB_SLOTS.includes(slot)) ctx.broadcast({ t: 'lootPub', n: a.name, p: pubOf(key) });
  ctx.markDirty(); E.meToAll(a); sendMe(key);
}
function take(key, u) { const p = P(key), i = p.it.findIndex(x => x.u === u); if (i < 0) return null; unequipU(key, u); const x = p.it.splice(i, 1)[0]; ctx.markDirty(); return x; }

// ---------------------------------------------------------------- recycle, combine, parcels, shops
function recycle(ws, key, m) {
  const us = Array.isArray(m.us) ? m.us.slice(0, 60) : [], p = P(key), a = acctOf(key);
  if (!us.length || new Set(us).size !== us.length) return;
  const xs = us.map(u => (isInt(u, 1, 1e12) ? findItem(p, u) : null));
  if (xs.some(x => !x || x.lk)) return err(ws, "Some of those are missing, or tied up in a trade or on the Bazaar.");
  let tot = 0; for (const x of xs) { tot += L.RAR[ITEM[x.id].r].rec; take(key, x.u); }
  E.credit(a, tot, 'recycle', `Recycled ${xs.length} item${xs.length > 1 ? 's' : ''} at Lootlings`);
  p.st.rec = (p.st.rec | 0) + xs.length; if (p.st.rec >= 10) ach(key, 'recycle');
  ctx.send(ws, { t: 'lootDone', what: 'recycle', n: xs.length, teef: tot });
  progress(key, 'recycle'); sendMe(key); E.meToAll(a);
}
function combine(ws, key, m) {
  const us = Array.isArray(m.us) ? m.us : [], p = P(key), want = ITEM[String(m.want || '')];
  if (us.length !== R.combineN || new Set(us).size !== us.length) return err(ws, `Put exactly ${R.combineN} different items in the Combinator.`);
  const xs = us.map(u => (isInt(u, 1, 1e12) ? findItem(p, u) : null));
  if (xs.some(x => !x || x.lk)) return err(ws, 'Some of those are missing, or tied up in a trade or on the Bazaar.');
  if (xs.some(x => ITEM[x.id].nocomb)) return err(ws, "JackWorld furni can't go in the Combinator. (It's furniture. It doesn't fit.)");
  const r = ITEM[xs[0].id].r;
  if (xs.some(x => ITEM[x.id].r !== r) || r >= 5) return err(ws, 'All five must be the same rarity (and Jackpot things cannot be combined).');
  if (!want || want.r !== r + 1 || want.ex) return err(ws, 'Pick something one rarity higher (not an exclusive set or achievement prize).');
  if (!canMint(want)) return err(ws, `Every ${want.name} that will ever exist has already been found! Pick something else.`);
  const x = mint(want.id, 'combine'); if (!x) return;
  for (const y of xs) take(key, y.u);
  p.st.comb = (p.st.comb | 0) + 1; ach(key, 'combine');
  give(key, x, 'combine'); sendMe(key);
}
function openParcel(ws, key) {
  const p = P(key); if (!p.par.length) return err(ws, 'No parcels to open. The postman comes once a day, the first time you log on.');
  p.par.shift(); p.st.parcels = (p.st.parcels | 0) + 1; ctx.markDirty();
  if (mdNow() < R.openDay) ach(key, 'beta');
  const x = mint(roll(W_PARCEL), 'parcel');
  ach(key, 'parcel');
  if (x) give(key, x, 'parcel');
  progress(key, 'parcel'); sendMe(key);
}
function stock(k, d) {
  const S = L.SHOPS[k]; if (!S) return [];
  const md = mdNow();
  const pool = L.ITEMS.filter(it => it.shop === k && it.r <= 2 && L.inSeason(it, md));
  const h = L.hash(k + d);
  return pool.map((it, i) => [it, L.hash(h + '|' + it.id)]).sort((x, y) => x[1] - y[1]).slice(0, 6).map(([it]) => [it.id, it.price || L.PRICE[it.r]]);
}
function shopBuy(ws, key, m) {
  const k = String(m.k || ''), id = String(m.id || ''), d = today(), p = P(key), a = acctOf(key);
  const row = stock(k, d).find(x => x[0] === id); if (!row) return err(ws, "That's not on the shelves today. Shopkeepers restock every morning.");
  if (p.shop.day !== d) p.shop = { day: d, b: {} };
  if ((p.shop.b[id] | 0) >= 3) return err(ws, `${L.SHOPS[k].who} says: "Three of the same is plenty for one day!"`);
  if (p.it.length >= R.invMax) return err(ws, 'Your Treasure Chest is full! Recycle something first.');
  if (!E.debit(a, row[1], 'loot', `${L.SHOPS[k].n}: ${ITEM[id].name}`)) return err(ws, `Not enough Rupees! That costs ${rp(row[1])} and you have ${rp(a.bal)}.`);
  p.shop.b[id] = (p.shop.b[id] | 0) + 1;
  ach(key, 'shop');
  give(key, mint(id, 'shop'), 'shop'); E.meToAll(a); sendMe(key);
}

// ---------------------------------------------------------------- paying other members
function payRoll(p) { const d = today(); if (p.pay.day !== d) p.pay = { day: d, sent: 0, recv: 0 }; }
function canSend(a, p, amt) {
  if ((a.earned | 0) < R.payMinEarned) return `You need to have earned ${rp(R.payMinEarned)} yourself before you can send Rupees to anyone. (Stops people making forty accounts. Dave.)`;
  payRoll(p); if (p.pay.sent + amt > R.payDayMax) return `You can send up to ${rp(R.payDayMax)} a day. You have ${rp(R.payDayMax - p.pay.sent)} left today.`;
  return '';
}
function canRecv(p2, amt, name) { payRoll(p2); return p2.pay.recv + amt > R.payRecvMax ? `${name} has been sent as many Rupees as they can get today (${rp(R.payRecvMax)}). Try tomorrow!` : ''; }
function pay(ws, key, m, c) {
  if (!c.lootPay) c.lootPay = new ctx.Bucket(0.2, 3); if (!c.lootPay.take()) return err(ws, 'Slow down! One payment every few seconds.');
  const to = keyOf(m.to), amt = m.amt, a = acctOf(key), p = P(key);
  if (!to || !memberName(to)) return err(ws, 'There is no JackNet member called that. Check the spelling!');
  if (to === key) return err(ws, 'You cannot pay yourself. (Nice try.)');
  if (!isInt(amt, 1, R.payDayMax)) return err(ws, `Send between 1 and ${rp(R.payDayMax)}.`);
  const b = acctOf(to), p2 = P(to), note = ctx.delink(ctx.clean(m.note, 60));
  const why = canSend(a, p, amt) || canRecv(p2, amt, b.name); if (why) return err(ws, why);
  if (a.bal < amt) return err(ws, `You only have ${rp(a.bal)}.`);
  E.debit(a, amt, 'payout', `To ${b.name}${note ? ': ' + note : ''}`);
  E.credit(b, amt, 'payin', `From ${a.name}${note ? ': ' + note : ''}`);
  p.pay.sent += amt; p2.pay.recv += amt; p.st.paid = (p.st.paid | 0) + amt; ctx.markDirty();
  ach(key, 'pay');
  ctx.send(ws, { t: 'lootPaid', to: b.name, amt, bal: a.bal });
  sendTo(to, { t: 'lootPaidMe', from: a.name, amt, note });
  E.meToAll(a); E.meToAll(b); sendMe(key);
}

// ---------------------------------------------------------------- trades (both sides add items and/or Rupees, both tick OK, the server swaps)
function openTrades(key) { return Object.values(D.tr).filter(T => T.st === 'open' && (T.a === key || T.b === key)); }
function unlockSide(T, s) { const p = P(T[s]); for (const u of T['i' + s]) { const x = findItem(p, u); if (x && x.lk === 't' + T.id) delete x.lk; } }
function closeTrade(T, st, why) { unlockSide(T, 'a'); unlockSide(T, 'b'); T.st = st; T.why = why || ''; T.up = Date.now(); ctx.markDirty(); pushTrade(T); pruneTrades(); }
function pruneTrades() { const closed = Object.values(D.tr).filter(T => T.st !== 'open').sort((x, y) => x.up - y.up); while (closed.length > 200) delete D.tr[closed.shift().id]; }
function tradeNew(ws, key, m, c) {
  if (!c.lootT) c.lootT = new ctx.Bucket(0.3, 4); if (!c.lootT.take()) return err(ws, 'Slow down!');
  const to = keyOf(m.to);
  if (!to || !memberName(to)) return err(ws, 'There is no JackNet member called that. Check the spelling!');
  if (to === key) return err(ws, 'Trading with yourself? That is just moving things about.');
  if (openTrades(key).length >= R.tradeMax) return err(ws, `You can only have ${R.tradeMax} trades open at once. Finish or cancel one first.`);
  if (openTrades(to).length >= R.tradeMax) return err(ws, `${memberName(to)} already has ${R.tradeMax} trades open.`);
  const ex = openTrades(key).find(T => T.a === to || T.b === to); if (ex) return pushTrade(ex);
  const T = { id: ++D.tseq, a: key, b: to, an: memberName(key), bn: memberName(to), ia: [], ib: [], ta: 0, tb: 0, oa: 0, ob: 0, st: 'open', ts: Date.now(), up: Date.now() };
  D.tr[T.id] = T; ctx.markDirty(); pushTrade(T);
  sendTo(to, { t: 'lootTradeAsk', id: T.id, from: T.an });
}
function myTrade(ws, key, id) { const T = isInt(id, 1, 1e9) ? D.tr[id] : null; if (!T || T.st !== 'open' || (T.a !== key && T.b !== key)) { err(ws, 'That trade has finished or been cancelled.'); return null; } return T; }
function tradeSet(ws, key, m) {
  const T = myTrade(ws, key, m.id); if (!T) return;
  const s = T.a === key ? 'a' : 'b', p = P(key);
  const us = Array.isArray(m.us) ? m.us.slice(0, R.tradeItems + 1) : [], teef = m.teef == null ? 0 : m.teef;
  if (us.length > R.tradeItems) return err(ws, `Up to ${R.tradeItems} items each side.`);
  if (new Set(us).size !== us.length || !isInt(teef, 0, R.payDayMax)) return err(ws, `Rupees in a trade: 0 to ${R.payDayMax}.`);
  for (const u of us) { const x = isInt(u, 1, 1e12) ? findItem(p, u) : null; if (!x || (x.lk && x.lk !== 't' + T.id)) return err(ws, "One of those isn't yours to trade right now (it might be on the Bazaar or in another trade)."); }
  if (teef > 0) { const why = canSend(acctOf(key), p, 0); if (why) return err(ws, why); }
  unlockSide(T, s);
  for (const u of us) { const x = findItem(p, u); x.lk = 't' + T.id; unequipU(key, u); }
  T['i' + s] = us; T['t' + s] = teef; T.oa = 0; T.ob = 0; T.up = Date.now(); ctx.markDirty();
  pushTrade(T); sendMe(key);
}
function tradeOk(ws, key, m) {
  const T = myTrade(ws, key, m.id); if (!T) return;
  const s = T.a === key ? 'a' : 'b';
  if (!T.ia.length && !T.ib.length && !T.ta && !T.tb) return err(ws, 'Nobody has put anything in yet!');
  T['o' + s] = m.ok ? 1 : 0; T.up = Date.now(); ctx.markDirty();
  if (!(T.oa && T.ob)) return pushTrade(T);
  // both said yes: check everything again, then swap it all in one go
  const A = acctOf(T.a), B = acctOf(T.b), pa = P(T.a), pb = P(T.b);
  const xa = T.ia.map(u => findItem(pa, u)), xb = T.ib.map(u => findItem(pb, u));
  const bad = why => { T.oa = 0; T.ob = 0; T.why = why; pushTrade(T); err(ws, why); };
  if (xa.some(x => !x || x.lk !== 't' + T.id) || xb.some(x => !x || x.lk !== 't' + T.id)) return bad('Something in the trade went missing. Check it and tick OK again.');
  if (pb.it.length - xb.length + xa.length > R.invMax || pa.it.length - xa.length + xb.length > R.invMax) return bad('Somebody\'s Treasure Chest would be too full.');
  if (A.bal < T.ta) return bad(`${A.name} has not got ${rp(T.ta)} any more.`);
  if (B.bal < T.tb) return bad(`${B.name} has not got ${rp(T.tb)} any more.`);
  const w = (T.ta && (canSend(A, pa, T.ta) || canRecv(pb, T.ta, B.name))) || (T.tb && (canSend(B, pb, T.tb) || canRecv(pa, T.tb, A.name)));
  if (w) return bad(w);
  const moveA = xa.map(x => take(T.a, x.u)), moveB = xb.map(x => take(T.b, x.u));
  for (const x of moveA) { delete x.lk; x.src = 'trade'; pb.it.push(x); }
  for (const x of moveB) { delete x.lk; x.src = 'trade'; pa.it.push(x); }
  if (T.ta) { E.debit(A, T.ta, 'trade', `Trade #${T.id} with ${B.name}`); E.credit(B, T.ta, 'trade', `Trade #${T.id} with ${A.name}`, true); pa.pay.sent += T.ta; pb.pay.recv += T.ta; }
  if (T.tb) { E.debit(B, T.tb, 'trade', `Trade #${T.id} with ${A.name}`); E.credit(A, T.tb, 'trade', `Trade #${T.id} with ${B.name}`, true); pb.pay.sent += T.tb; pa.pay.recv += T.tb; }
  pa.st.trades = (pa.st.trades | 0) + 1; pb.st.trades = (pb.st.trades | 0) + 1;
  T.st = 'done'; T.up = Date.now(); T.got = { a: moveB.map(pub), b: moveA.map(pub) }; ctx.markDirty();
  pushTrade(T);
  ach(T.a, 'trade'); ach(T.b, 'trade'); checkAll(T.a); checkAll(T.b);
  for (const k of [T.a, T.b]) { sendMe(k); const ac = acctOf(k); if (ac) E.meToAll(ac); }
  pruneTrades();
}

// ---------------------------------------------------------------- the Bazaar (fixed-price listings; the Bazaar keeps a small fee, which vanishes)
function sell(ws, key, m, c) {
  if (!c.lootM) c.lootM = new ctx.Bucket(0.5, 5); if (!c.lootM.take()) return err(ws, 'Slow down!');
  const p = P(key), x = isInt(m.u, 1, 1e12) ? findItem(p, m.u) : null, price = m.price;
  if (!x) return err(ws, "You haven't got that any more.");
  if (x.lk) return err(ws, 'That is already in a trade or on the Bazaar.');
  if (!isInt(price, 1, R.priceMax)) return err(ws, `Pick a price from 1 to ${rp(R.priceMax)}.`);
  if (D.mk.list.filter(l => l.k === key).length >= R.listMax) return err(ws, `You can have ${R.listMax} things on the Bazaar at once.`);
  unequipU(key, x.u);
  const id = ++D.mk.seq; x.lk = 'm' + id;
  D.mk.list.push({ id, k: key, n: memberName(key), it: x, p: price, at: Date.now() }); ctx.markDirty();
  ctx.send(ws, { t: 'lootDone', what: 'sell', id }); sendMe(key);
  ctx.broadcast({ t: 'lootMktCh' });
}
function unsell(ws, key, m) {
  const i = D.mk.list.findIndex(l => l.id === m.id && l.k === key); if (i < 0) return err(ws, 'That listing has gone (maybe somebody bought it!).');
  const l = D.mk.list.splice(i, 1)[0], x = findItem(P(key), l.it.u); if (x) delete x.lk;
  ctx.markDirty(); sendMe(key); ctx.send(ws, mktView({})); ctx.broadcast({ t: 'lootMktCh' });
}
function buyListing(ws, key, m, c) {
  if (!c.lootM) c.lootM = new ctx.Bucket(0.5, 5); if (!c.lootM.take()) return err(ws, 'Slow down!');
  const i = D.mk.list.findIndex(l => l.id === m.id); if (i < 0) return err(ws, 'Too slow! Somebody else bought that one.');
  const l = D.mk.list[i]; if (l.k === key) return err(ws, 'That is your own listing. Take it down instead.');
  const a = acctOf(key), s = acctOf(l.k), p = P(key), ps = P(l.k);
  const x = findItem(ps, l.it.u);
  if (!s || !x || x.lk !== 'm' + l.id) { D.mk.list.splice(i, 1); ctx.markDirty(); return err(ws, 'That listing was broken, so the Bazaar took it down.'); }
  if (p.it.length >= R.invMax) return err(ws, 'Your Treasure Chest is full! Recycle something first.');
  if (a.bal < l.p) return err(ws, `Not enough Rupees! It costs ${rp(l.p)} and you have ${rp(a.bal)}.`);
  const it = ITEM[x.id], fee = Math.max(1, Math.floor(l.p * R.feePct / 100));
  E.debit(a, l.p, 'bazaar', `Bazaar: bought ${it.name} from ${s.name}`);
  if (l.p - fee > 0) E.credit(s, l.p - fee, 'bazaar', `Bazaar: sold ${it.name} to ${a.name} (fee ${fee})`);
  D.mk.list.splice(i, 1);
  const y = take(l.k, x.u); delete y.lk; y.src = 'bazaar'; p.it.push(y);
  D.mk.sold.push({ n: it.name, id: it.id, s: y.s | 0, p: l.p, by: a.name, from: s.name, ts: Date.now() }); if (D.mk.sold.length > 40) D.mk.sold.splice(0, D.mk.sold.length - 40);
  ps.st.sold = (ps.st.sold | 0) + 1; p.st.bought = (p.st.bought | 0) + 1; ctx.markDirty();
  ach(key, 'buy'); ach(l.k, 'sell'); checkAll(key);
  ctx.send(ws, { t: 'lootDone', what: 'buy', id: l.id, it: pub(y) });
  sendTo(l.k, { t: 'lootSold', n: it.name, p: l.p, fee, to: a.name });
  sendTo(key, { t: 'lootGot', its: [pub(y)], src: 'bazaar' });
  sendMe(key); sendMe(l.k); E.meToAll(a); E.meToAll(s);
  ctx.broadcast({ t: 'lootMktCh' });
}

// ---------------------------------------------------------------- browser-reported events (rate-limited, de-duplicated, capped by econ)
const HOST_RE = /^[a-z0-9][a-z0-9-]{0,40}(\.[a-z0-9-]{1,30}){1,3}$/, PROG_RE = /^[a-z0-9_.:-]{1,40}$/;
function clientEv(ws, c, key, m) {
  if (!c.lootE) c.lootE = new ctx.Bucket(1, 12); if (!c.lootE.take()) return;
  const k = String(m.k || ''), id = String(m.id || '').toLowerCase().slice(0, 64), p = P(key);
  if (k === 'site') {
    const h = id.replace(/^www\./, ''); if (!HOST_RE.test(h) || p.sites.includes(h)) return;
    p.sites.push(h); if (p.sites.length > 3000) p.sites.shift(); ctx.markDirty();
    if (p.sites.length >= 25) ach(key, 'sites25'); if (p.sites.length >= 100) ach(key, 'sites100');
    return ECON.api.earn(c, 'site', `Visited www.${h}`);
  }
  if (k === 'prog') {
    if (!PROG_RE.test(id) || p.progs.includes(id)) return;
    p.progs.push(id); if (p.progs.length > 1000) p.progs.shift(); ctx.markDirty();
    if (p.progs.length >= 25) ach(key, 'progs25');
    return ECON.api.earn(c, 'prog', 'Tried out a new program');
  }
  if (k === 'play' || k === 'cards' || k === 'cupboard') return ECON.api.earn(c, k);
  if (k === 'install') {
    if (!PROG_RE.test(id)) return;
    p.inst = p.inst || []; if (p.inst.includes(id)) return;
    p.inst.push(id); if (p.inst.length > 1000) p.inst.shift(); ctx.markDirty();
    if (p.inst.length >= 5) ach(key, 'installs5'); if (p.inst.length >= 20) ach(key, 'installs20');
    return ECON.api.earn(c, 'install', 'Installed some new software');
  }
  if (k === 'bazaar') { if (!c.lootBz) { c.lootBz = 1; progress(key, 'bazaar'); } }
}
// personal bests on the arcade tables (the server saw the score, so this one is server-side)
const ASC = { sweep: true };
function onScore(c, game, sc) {
  const key = keyOfC(c); if (!key) return;
  const p = P(key), g = String(game).slice(0, 16), was = p.pb[g];
  if (was === undefined || (ASC[g] ? sc < was : sc > was)) { p.pb[g] = sc; ctx.markDirty(); if (was !== undefined) ECON.api.earn(c, 'pb', `New personal best on ${g.toUpperCase()}!`); }
}

// ---------------------------------------------------------------- JackReal Tournament: frags and match wins, straight from the referee
function hookArena() {
  let AR = null; try { AR = require(path.join(__dirname, '..', 'public', 'js', 'pcgames-arena.js')); } catch (e) { return; }
  const RP = AR && AR.Referee && AR.Referee.prototype; if (!RP || RP._lootHooked) return;
  RP._lootHooked = true;
  const clientById = id => { for (const c of ctx.clients.values()) if (c.id === id && c.member) return c; return null; };
  const kill0 = RP.kill, end0 = RP.end;
  RP.kill = function (k, v, w) { const r = kill0.apply(this, arguments); try { if (k && v && k !== v && w >= 0 && !k.bot) { const c = clientById(k.id); if (c) ECON.api.earn(c, 'frag'); } } catch (e) { console.error('loot frag', e); } return r; };
  RP.end = function (who) {
    const was = this.state, r = end0.apply(this, arguments);
    try {
      if (was === 'play' && this.state === 'end') {
        const ents = [...this.E.values()], humans = ents.filter(e => !e.bot);
        const win = humans.find(e => e.name === who);
        if (win && humans.length >= 2 && win.frags >= 3) { const c = clientById(win.id); if (c) ECON.api.earn(c, 'fragwin', 'Won a JackReal Tournament match!'); }
      }
    } catch (e) { console.error('loot win', e); }
    return r;
  };
}

// ---------------------------------------------------------------- dispatch
function handle(ws, c, m) {
  if (!c.lootR) c.lootR = new ctx.Bucket(6, 25);
  if (!c.lootR.take()) return err(ws, 'Slow down! The Lootlings server is only a 486.');
  const key = keyOfC(c);
  // things anybody (guests too) can look at
  switch (m.t) {
    case 'lootMkt': if (key && !c.lootBz) clientEv(ws, c, key, { k: 'bazaar' }); return ctx.send(ws, mktView(m));
    case 'lootHof': return ctx.send(ws, hof());
    case 'lootDb': return ctx.send(ws, { t: 'lootDb', ct: D.ct, ser: D.ser, md: mdNow() });
    case 'lootProfile': return ctx.send(ws, profile(m.name));
    case 'lootShop': { const k = String(m.k || ''); if (!L.SHOPS[k]) return; return ctx.send(ws, { t: 'lootShop', k, stock: stock(k, today()), day: today() }); }
  }
  if (!key || !memberName(key)) { if (m.t === 'lootMe') return ctx.send(ws, { t: 'lootMe', guest: true, md: mdNow() }); return err(ws, NEED); }
  switch (m.t) {
    case 'lootMe': return sendMe(key);
    case 'lootEv': return clientEv(ws, c, key, m);
    case 'lootOpen': return openParcel(ws, key);
    case 'lootEquip': return equip(ws, key, m);
    case 'lootUnequip': return unequip(ws, key, m);
    case 'lootRecycle': return recycle(ws, key, m);
    case 'lootCombine': return combine(ws, key, m);
    case 'lootShopBuy': return shopBuy(ws, key, m);
    case 'lootPay': return pay(ws, key, m, c);
    case 'lootTNew': return tradeNew(ws, key, m, c);
    case 'lootTSet': return tradeSet(ws, key, m);
    case 'lootTOk': return tradeOk(ws, key, m);
    case 'lootTCancel': { const T = myTrade(ws, key, m.id); if (T) closeTrade(T, 'cancel', `${memberName(key)} cancelled the trade.`); sendMe(T ? T.a : key); if (T) sendMe(T.b); return; }
    case 'lootTList': return ctx.send(ws, { t: 'lootTrades', list: Object.values(D.tr).filter(T => T.a === key || T.b === key).sort((x, y) => y.up - x.up).slice(0, 20).map(T => tradeView(T, key)) });
    case 'lootSell': return sell(ws, key, m, c);
    case 'lootUnsell': return unsell(ws, key, m);
    case 'lootBuy': return buyListing(ws, key, m, c);
  }
}

module.exports = {
  name: 'loot',
  types: ['lootMe', 'lootEv', 'lootOpen', 'lootEquip', 'lootUnequip', 'lootRecycle', 'lootCombine', 'lootShop', 'lootShopBuy', 'lootPay', 'lootTNew', 'lootTSet', 'lootTOk', 'lootTCancel', 'lootTList', 'lootMkt', 'lootSell', 'lootUnsell', 'lootBuy', 'lootHof', 'lootDb', 'lootProfile'],
  init(x) {
    ctx = x; D = x.data; initData();
    E = ECON.api; if (!E || !E.HOOKS) { console.error('loot: econ is missing'); return; }
    E.HOOKS.earn.push(onEarn); E.HOOKS.daily.push(onDaily);
    x.on('hello', (ws, c) => {
      const pubs = {}; for (const k in D.p) { const nm = memberName(k), o = nm && pubOf(k); if (o) pubs[nm] = o; }
      ctx.send(ws, { t: 'lootHi', pub: pubs, md: mdNow() });
      const key = keyOfC(c); if (key) ctx.send(ws, meView(key));
    });
    x.on('login', c => { const key = keyOfC(c); if (key) sendMe(key); });
    x.on('score', onScore);
    hookArena();
  },
  handle,
  // for other mods: give a member one copy of a catalogue item (e.g. grind's rank rewards); false if they already have one
  giveOnce(key, id, src) { if (!L.ITEM[id]) return false; const lp = P(key); if (lp.it.some(x => x.id === id)) return false; return !!give(key, mint(id, src || 'gift'), src || 'gift'); },
  // for other mods (mods/ex.js: booster packs, JackBay Rupee Auctions): the chest itself
  api: { P, mint, canMint, give, take, unequipU, findItem, sendMe, checkAll, feed, pub, ach, R },
  _test: { get D() { return D; }, roll, mint, give, P, progress, missions, meView, hof, stock, checkAll, randomDrop },
};
