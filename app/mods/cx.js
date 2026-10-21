/* cx: the JACK ATTACK! back issues (January to December 1999). Every monthly issue has a competition: three
 * questions about that issue. The browser only ever says WHICH answers you picked; the answer sheet lives here, the server
 * decides if you won, and the prize comes through econ's earn path (daily cap, so twelve issues are a few days' work).
 * An issue only opens on its date (1st of its month, UK time, same day and month as the 1999 calendar), so nobody can enter
 * the December compo in October. Win all twelve and the loot server gives you the Super Reader badge (once).
 *   client -> { t:'cxCompo', iss, a:[i,i,i] }   <- { t:'cxCompo', iss, ok, right, amt, left, won, full, shut, guest }
 *   client -> { t:'cxWins' }                    <- { t:'cxWins', open, won:[iss...], win:{ iss:{ n, names:[...] } } }
 * Data: state.mods.cx = { v, p:{ memberKey:{ won:{iss:ts}, tr:{iss:[day, n]} } }, win:{ iss:{ n, names:[] } } } */
'use strict';
const path = require('path');
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const LCAT = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const NEED = 'Only JackNet members can enter the competitions (the prize is Rupees, and Rupees need a bank account). Joining is FREE: Start > Log Off, then pick a name and a password!';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PRIZE = 40, TRIES = 3; // Rupees per competition won; goes per issue per day
const EARN_ADD = { cxcompo: { amt: PRIZE, cap: 3, drop: 0.35, label: 'Won a JACK ATTACK! back-issue competition' } };
const BADGE = { id: 'badge.cx_superreader', name: 'Super Reader Badge', r: 3, type: 'badge', art: ['#e10600', '#ffd400', 'JA!'], d: 'Won all twelve JACK ATTACK! competitions of 1999. You read every page. Even the small print.', ex: 1 };

// The answer sheet: for each issue, the index (0-3) of the right option for each question, in the order the questions
// appear on the page (public/js/cx-mag-a.js and cx-mag-b.js). Keep the two in step when you change a question.
const ANS = {
  1: [1, 3, 0], 2: [2, 0, 1], 3: [3, 1, 2], 4: [0, 2, 3], 5: [1, 0, 2], 6: [2, 3, 1],
  7: [0, 1, 3], 8: [3, 2, 0], 9: [1, 2, 1], 10: [2, 0, 3], 11: [0, 3, 2], 12: [3, 1, 0],
};

let ctx, D, E, LOOT = null;
const keyOf = name => { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; };
const ukDay = () => E.uk().day;                      // 'YYYY-MM-DD' (UK)
const monthNow = () => +ukDay().slice(5, 7);          // the 1999 month we're in
const isOpen = iss => iss >= 1 && iss <= 12 && iss <= monthNow();
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') { p = D.p[key] = { won: {}, tr: {} }; ctx.markDirty(); }
  if (!p.won || typeof p.won !== 'object') p.won = {};   // THE DATABASE IS SACRED: only ever fill in what's missing
  if (!p.tr || typeof p.tr !== 'object') p.tr = {};
  return p;
}
function winsView(key) {
  const win = {};
  for (let i = 1; i <= 12; i++) { const w = D.win[i]; if (w && w.n) win[i] = { n: w.n, names: w.names.slice(0, 12) }; }
  const p = key ? P(key) : null;
  return { t: 'cxWins', open: monthNow(), won: p ? Object.keys(p.won).map(Number).filter(n => n >= 1 && n <= 12).sort((a, b) => a - b) : [], win };
}
function compo(ws, c, key, m) {
  const iss = m.iss | 0;
  if (!own(ANS, iss)) return;
  if (!isOpen(iss)) return ctx.send(ws, { t: 'cxCompo', iss, shut: 1, msg: `The ${MONTHS[iss - 1]} issue isn't in the shops yet. It comes out on 1 ${MONTHS[iss - 1]}!` });
  const a = Array.isArray(m.a) ? m.a.slice(0, 3).map(x => x | 0) : [];
  if (a.length !== 3 || a.some(x => x < 0 || x > 3)) return;
  if (!key) return ctx.send(ws, { t: 'cxCompo', iss, guest: 1, msg: NEED });
  const p = P(key);
  if (p.won[iss]) return ctx.send(ws, { t: 'cxCompo', iss, won: 1, ok: 1, right: 3, amt: 0, again: 1 });
  const day = ukDay(), tr = Array.isArray(p.tr[iss]) && p.tr[iss][0] === day ? p.tr[iss] : [day, 0];
  if (tr[1] >= TRIES) return ctx.send(ws, { t: 'cxCompo', iss, left: 0, msg: 'That\'s three goes at this one today. Mom (the judge) says come back tomorrow. Read the issue again first!' });
  const ac = E.acct(c); if (!ac) return;
  const right = ANS[iss].reduce((n, x, i) => n + (x === a[i] ? 1 : 0), 0);
  if (right < 3) {
    tr[1]++; p.tr[iss] = tr; ctx.markDirty();
    return ctx.send(ws, { t: 'cxCompo', iss, ok: 0, right, left: TRIES - tr[1] });
  }
  // all three right: the prize pot (econ's daily cap) decides if we can pay today. If it's empty, nothing is used up.
  E.rollDay(ac);
  if ((ac.caps.cxcompo | 0) >= EARN_ADD.cxcompo.cap) return ctx.send(ws, { t: 'cxCompo', iss, ok: 1, right: 3, full: 1, msg: 'All three right! But Jack has run out of prizes for today (three a day, he only gets so much pocket money). Come back tomorrow and send it in again!' });
  const amt = Math.max(0, E.earnA(ac, 'cxcompo', `JACK ATTACK! ${MONTHS[iss - 1]} 1999 competition: WINNER!`, PRIZE));
  p.won[iss] = Date.now();
  const w = D.win[iss] = D.win[iss] && Array.isArray(D.win[iss].names) ? D.win[iss] : { n: 0, names: [] };
  w.n = (w.n | 0) + 1; if (w.names.length < 40) w.names.push(ac.name);
  ctx.markDirty();
  const all = Object.keys(p.won).length >= 12;
  let badge = false;
  if (all && LOOT && typeof LOOT.giveOnce === 'function') { try { badge = !!LOOT.giveOnce(key, BADGE.id, 'cx'); } catch (e) { console.error('cx badge', e); } }
  ctx.send(ws, { t: 'cxCompo', iss, ok: 1, right: 3, amt, won: 1, all, badge });
  ctx.pushChat({ sys: true, text: `*** ${ac.name} won the JACK ATTACK! ${MONTHS[iss - 1]} 1999 competition!${all ? ' That\'s ALL TWELVE: a Super Reader!' : ''}`, ts: Date.now() });
}

function handle(ws, c, m) {
  if (!E) return;
  if (!c.cxRl) c.cxRl = new ctx.Bucket(0.5, 6);
  if (!c.cxRl.take()) return;
  const key = c.member ? keyOf(c.member) : null;
  switch (m.t) {
    case 'cxWins': return ctx.send(ws, winsView(key));
    case 'cxCompo': return compo(ws, c, key, m);
  }
}

module.exports = {
  name: 'cx',
  types: ['cxCompo', 'cxWins'],
  init(x) {
    ctx = x; D = x.data;
    D.v = D.v || 1; if (!D.p || typeof D.p !== 'object') D.p = {}; if (!D.win || typeof D.win !== 'object') D.win = {};
    E = ECON.api; if (!E || !E.HOOKS) { E = null; console.error('cx: econ is missing'); return; }
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    if (!LCAT.ITEM[BADGE.id]) { const it = Object.assign({}, BADGE); LCAT.ITEMS.push(it); LCAT.ITEM[it.id] = it; }
    try { LOOT = require('./loot.js'); } catch (e) { LOOT = null; }
    x.on('login', c => { const key = keyOf(c.member); if (key) for (const [ws, cc] of ctx.clients) if (cc === c) ctx.send(ws, winsView(key)); });
  },
  handle,
  _test: { get D() { return D; }, ANS, isOpen, winsView },
};
