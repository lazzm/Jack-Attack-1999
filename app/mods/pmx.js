/* pmx: PIXEL POST, the mail-order games catalogue (js/pm-cat.js is the price list; js/pm-media.js and js/pm-gl.js the
 * pages and the parcels in Jack's room). JackNet members spend Rupees (through econ's debit: the server decides), the order
 * is recorded here, and the parcel arrives straight away. Nothing can be ordered before its 1999 release date, nothing
 * twice, and at most PMCat.DAYMAX orders a day. No refunds (it's mail order in 1999: you've got the game).
 * (The name is pmx because mods/pm.js is the private mailboxes.)
 *   client -> { t:'pmxMe' }                 <- { t:'pmxMe', orders:[{ no, id, price, ts }], today, max, bal }
 *   client -> { t:'pmxOrder', id }          <- { t:'pmxOrdered', order, bal }  or  { t:'pmxErr', msg }
 * Data (THE DATABASE IS SACRED: only ever add): state.mods.pmx = { v, seq, p: { memberKey: { o:[orders], day, n } }, st: { orders, spent } } */
'use strict';
const path = require('path');
const CAT = require(path.join(__dirname, '..', 'public', 'js', 'pm-cat.js'));
const ECON = require('./econ.js');
try { CAT.addCarts(require(path.join(__dirname, '..', 'public', 'js', 'rm-cat.js'))); } catch (e) {}

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const NEED = 'Ordering is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!';
let ctx, D, E;
const keyOf = c => { const k = c && c.member ? String(c.member).toLowerCase() : ''; return k && !BADKEY.test(k) ? k : null; };
function P(key) {
  let p = D.p[key]; if (!p || typeof p !== 'object') p = D.p[key] = {};
  if (!Array.isArray(p.o)) p.o = []; p.n = p.n | 0; p.day = p.day || '';
  return p;
}
const todayMd = () => { const d = E.uk().day; return +d.slice(5, 7) * 100 + +d.slice(8, 10); };
function view(key) {
  const p = P(key), a = E.acct({ member: ctx.state.members[key] ? ctx.state.members[key].name : key });
  return { t: 'pmxMe', orders: p.o.map(o => ({ no: o.no, id: o.id, price: o.price, ts: o.ts })), today: p.day === E.uk().day ? p.n : 0, max: CAT.DAYMAX, bal: a ? a.bal : 0, md: todayMd() };
}
const err = (ws, msg) => ctx.send(ws, { t: 'pmxErr', msg });
let lastOrder = new Map(); // member key -> ts (no double clicks)
function order(ws, c, m) {
  const key = keyOf(c); if (!key || !ctx.state.members[key]) return err(ws, NEED);
  const id = String(m.id || '').slice(0, 40); if (!own(CAT.byId, id)) return err(ws, 'That isn\'t in the catalogue. (Did you rip the page out?)');
  const it = CAT.byId[id], p = P(key), day = E.uk().day, now = Date.now();
  if (now - (lastOrder.get(key) || 0) < 1500) return err(ws, 'Hang on, the order line is still ringing...');
  lastOrder.set(key, now);
  if (!CAT.out(it, todayMd())) return err(ws, `${it.title} isn't out yet! It's in the shops from ${it.rel.replace('/', ' / ')}. Order it then.`);
  if (p.o.some(o => o.id === id)) return err(ws, `You've already got ${it.title}! It's on your shelf.`);
  if (p.day !== day) { p.day = day; p.n = 0; }
  if (p.n >= CAT.DAYMAX) return err(ws, `That's ${CAT.DAYMAX} orders today. Mom says that's enough parcels for one day. Try again tomorrow!`);
  const a = E.acct(c); if (!a) return err(ws, NEED);
  if (!E.debit(a, it.price, 'pmx', `Pixel Post mail order: ${it.title}`)) return err(ws, `Not enough Rupees! ${it.title} costs ${it.price} and you have ${a.bal}.`);
  const o = { no: 'PP' + String(++D.seq).padStart(5, '0'), id, price: it.price, ts: now };
  p.o.push(o); p.n++;
  D.st.orders = (D.st.orders | 0) + 1; D.st.spent = (D.st.spent | 0) + it.price;
  ctx.markDirty();
  ctx.send(ws, { t: 'pmxOrdered', order: o, bal: a.bal, today: p.n, max: CAT.DAYMAX });
  try { E.meToAll(a); } catch (e) {}
  // the member's other computers hear about it too
  for (const [w2, c2] of ctx.clients) if (w2 !== ws && keyOf(c2) === key) ctx.send(w2, view(key));
}

module.exports = {
  name: 'pmx',
  types: ['pmxMe', 'pmxOrder'],
  init(x) {
    ctx = x; D = x.data;
    D.v = D.v || 1; D.seq = D.seq | 0;
    if (!D.p || typeof D.p !== 'object') D.p = {};
    if (!D.st || typeof D.st !== 'object') D.st = { orders: 0, spent: 0 };
    E = ECON.api; if (!E || !E.debit) { console.error('pmx: econ is missing'); return; }
    x.on('hello', (ws, c) => { const k = keyOf(c); if (k && ctx.state.members[k]) ctx.send(ws, view(k)); });
    x.on('login', c => { const k = keyOf(c); if (!k) return; for (const [w2, c2] of ctx.clients) if (keyOf(c2) === k) ctx.send(w2, view(k)); });
  },
  handle(ws, c, m) {
    if (m.t === 'pmxMe') { const k = keyOf(c); if (k && ctx.state.members[k]) ctx.send(ws, view(k)); else ctx.send(ws, { t: 'pmxMe', guest: true, orders: [], max: CAT.DAYMAX, md: todayMd() }); return; }
    if (m.t === 'pmxOrder') return order(ws, c, m);
  },
  _test: { get D() { return D; }, CAT },
};
