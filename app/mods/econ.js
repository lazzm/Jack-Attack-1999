// econ: the Rupee economy for JACK ATTACK! Online (inside, the money is still called "teef": keys, codes and ids never
// change, so balances carried over 1:1). Server-authoritative balances, The Rupee Emporium shop, the Jack Stock
// Exchange, Jacktown (a shared town sim), JackNet Bank, JackLotto, Jackdown Park kart races and per-member Pixel Pet Farms.
// Everything a client says is validated here; amounts are never taken from the client. Simulations run on timers.
'use strict';
const path = require('path');
const crypto = require('crypto');
const CAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));

const MAXB = CAT.MAX, LOGN = 50;
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = v => Math.round(v * 100) / 100;
const rnd = () => crypto.randomInt(0, 1e9) / 1e9;
const rint = (a, b) => crypto.randomInt(a, b + 1);
const pick = l => l[crypto.randomInt(0, l.length)];
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const ID_RE = /^[a-z0-9_.-]{1,40}$/i;
const T = CAT.TOWN, NPLOT = T.N * T.N;
const SLOTS = ['wall', 'cur', 'snd', 'col', 'hat', 'face', 'gub', 'badge', 'pet', 'wal']; // wal: Rupee Wallet (cosmetic)

// UK time (the site lives in UK time; the lottery is drawn at 21:00 UK)
const FMT = (() => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (e) { return null; } })();
function uk(ts) {
  const d = new Date(ts || Date.now());
  if (!FMT) return { day: d.toISOString().slice(0, 10), h: d.getUTCHours(), mi: d.getUTCMinutes() };
  const p = {}; for (const x of FMT.formatToParts(d)) p[x.type] = x.value;
  return { day: `${p.year}-${p.month}-${p.day}`, h: +p.hour % 24, mi: +p.minute };
}

let ctx, D;
const COS = {}; for (const co of CAT.COS) COS[co.sym] = co;

// ---------------------------------------------------------------- data
function initData() {
  D.v = 1;
  D.acct = D.acct || {};
  D.orders = D.orders | 0;
  D.day = D.day || uk().day;
  if (!D.mkt) D.mkt = { s: {}, news: [], tape: [], tick: 0 };
  for (const co of CAT.COS) {
    if (!D.mkt.s[co.sym]) D.mkt.s[co.sym] = { p: co.p0, open: co.p0, fair: co.p0, mom: 0, press: 0, m: [co.p0], h: [co.p0], d: [co.p0], hi: co.p0, lo: co.p0, vol: 0 };
  }
  if (!D.town) {
    D.town = { plots: [], stats: null, hist: [], ev: [], tick: 0, treasury: 0, gaz: [] };
    gaz('town', 'JACKTOWN OPENS FOR BUSINESS!', 'The Mayor (a man in a VERY big hat) cut the ribbon on Jacktown today. "Plots are free to claim," he said, "but bring your own Rupees for the building." Every JackNet member can claim one plot and build on it. The Town Hall has a Big Power Station in the cellar, and the Jack Exchange is open on Market Square.');
  }
  while (D.town.plots.length < NPLOT) D.town.plots.push(null);
  if (!D.lotto) D.lotto = { no: 1, jackpot: CAT.LOTTO.seed, tickets: [], last: null, lastDay: '', hist: [] };
  if (!D.race) D.race = { no: 0, cur: null, hist: [] };
}
function acctKey(c) { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) ? null : k; }
function acct(c) {
  const k = acctKey(c); if (!k) return null;
  let a = D.acct[k];
  if (!a || typeof a !== 'object') a = D.acct[k] = { name: c.member, bal: 0, earned: 0, spent: 0, inv: {}, wear: {}, log: [], day: '', caps: {}, streak: 0, lastDay: '', sec: [], st: {}, cost: {}, plot: -1, farm: null, rentAcc: 0, opened: Date.now(), lt: [], tix: [] };
  a.name = c.member;
  return a;
}
function rollDay(a) { const d = uk().day; if (a.day !== d) { a.day = d; a.caps = {}; } }
function socketsOf(name) { const out = []; for (const [ws, c] of ctx.clients) if (c.member === name) out.push(ws); return out; }
function toMember(name, msg) { const s = JSON.stringify(msg); for (const ws of socketsOf(name)) ctx.send(ws, s); }
function subs(flag, msg) { const s = JSON.stringify(msg); for (const [ws, c] of ctx.clients) if (c.ec && c.ec[flag]) ctx.send(ws, s); }

function addLog(a, amt, code, note) {
  a.log.push([Date.now(), amt, code, String(note).slice(0, 80), a.bal]);
  if (a.log.length > LOGN) a.log.splice(0, a.log.length - LOGN);
}
function credit(a, amt, code, note, quiet) {
  amt = Math.floor(amt); if (!(amt > 0)) return 0;
  amt = Math.min(amt, MAXB - a.bal); if (amt <= 0) return 0;
  a.bal += amt; a.earned = Math.min(MAXB, (a.earned || 0) + amt);
  addLog(a, amt, code, note); ctx.markDirty();
  if (!quiet) toMember(a.name, { t: 'ecEarn', amt, code, note, bal: a.bal });
  return amt;
}
function debit(a, amt, code, note) {
  amt = Math.floor(amt); if (!(amt > 0) || a.bal < amt) return false;
  a.bal -= amt; a.spent = Math.min(MAXB, (a.spent || 0) + amt);
  addLog(a, -amt, code, note); ctx.markDirty();
  return true;
}
// THE earn path (the balance table is in public/js/econ-cat.js, EARN). Every source has a daily cap, an optional
// diminishing-returns point (half) and an optional minimum gap between two events (anti-farm). Events past the cap
// still count (missions, item drops) but pay nothing. Returns the Rupees paid, or -1 when the event was ignored as spam.
const HOOKS = { earn: [], daily: [] }; // other mods (mods/loot.js) hear about every earn event and every first logon of a day
const lastEv = new Map(); // member key -> { src: ts } (memory only)
function earnA(a, src, note, amtOverride) {
  const rule = CAT.EARN[src]; if (!a || !rule) return -1;
  rollDay(a);
  const k = a.name.toLowerCase(), now = Date.now();
  if (rule.gap) { let L = lastEv.get(k); if (!L) lastEv.set(k, L = {}); if (now - (L[src] || 0) < rule.gap * 1000) return -1; L[src] = now; }
  const n = a.caps[src] | 0, paying = n < rule.cap;
  let amt = 0;
  if (paying) {
    a.caps[src] = n + 1;
    const base = amtOverride != null ? Math.max(0, Math.floor(amtOverride)) : rule.amt;
    amt = rule.half && n >= rule.half ? Math.ceil(base / 2) : base;
    if (['job','chall','hspocket'].includes(src)) {
      // Keep legacy job/XP bookkeeping in five-pence units; only the wallet is paid.
      const w = wallet(a), pence = Math.min(amt * 5, 5000000 - w.pence);
      amt = Math.floor(pence / 5); w.pence += amt * 5;
      w.log.push([Date.now(), amt * 5, String(note || rule.label).slice(0,100)]); w.log = w.log.slice(-50);
      ctx.markDirty(); meToAll(a);
    } else amt = credit(a, amt, src, note || rule.label);
  }
  for (const fn of HOOKS.earn) { try { fn(a, src, amt, paying); } catch (e) { console.error('econ earn hook', e); } }
  return amt;
}
function earn(c, src, note, amt) { const a = acct(c); return a ? earnA(a, src, note, amt) : -1; }
// Lazy additive wallet: never convert or replace an existing Rupee balance.
function wallet(a) {
  if (!a.wallet) { a.wallet = {pence:0,log:[],nonce:crypto.randomBytes(16).toString('hex'),day:'',exchanged:0,last:null}; ctx.markDirty(); }
  return a.wallet;
}
function exchange(ws,c,m) {
  const a=acct(c);if(!a)return need(ws);
  const w=wallet(a), p=m.pence;
  if(typeof m.nonce!=='string'||m.nonce!==w.nonce){
    if(w.last&&m.nonce===w.last.nonce&&p===w.last.pence){ctx.send(ws,{t:'ecExchanged',...w.last,duplicate:true});sendMe(ws,c);return;}
    sendMe(ws,c);return err(ws,'That exchange slip has expired. Check your balance and try again.');
  }
  if(!isInt(p,5,2000)||p%5)return err(ws,'Exchange 5p to £20 in multiples of 5p.');
  const day=uk().day;if(w.day!==day){w.day=day;w.exchanged=0;}
  if(w.pence<p)return err(ws,'You do not have that much pocket money.');
  if(w.exchanged+p>2000)return err(ws,'The bank exchanges at most £20 of pocket money per day.');
  rollDay(a);if((a.caps.cashExchange||0)>=CAT.EARN.cashExchange.cap)return err(ws,'The daily exchange limit has been reached.');
  if(a.bal+p/5>MAXB)return err(ws,'Your Rupee account is full. No pocket money was taken.');
  const receipt={nonce:w.nonce,pence:p,rupees:p/5};
  w.pence-=p;w.exchanged+=p;w.nonce=crypto.randomBytes(16).toString('hex');w.last=receipt;
  w.log.push([Date.now(),-p,'Exchanged for '+p/5+' Rupees']);w.log=w.log.slice(-50);
  earnA(a,'cashExchange','JackNet Bank: exchanged pocket money',p/5);
  ctx.markDirty();meToAll(a);ctx.send(ws,{t:'ecExchanged',...receipt});
}
function err(ws, msg) { ctx.send(ws, { t: 'ecErr', msg }); }
function need(ws) { err(ws, 'You need to be a JackNet member to earn and spend Rupees. Join for FREE (Start > Log Off, then pick a name and a password), it takes 10 seconds!'); }

// ---------------------------------------------------------------- views
function bidOf(sym) { return r2(D.mkt.s[sym].p * 0.99); }
function askOf(sym) { return r2(D.mkt.s[sym].p * 1.01); }
function farmView(a) { const f = a.farm; if (!f) return null; farmGrow(f); return { pens: f.pens, feed: f.feed, sq: Math.floor(f.sq), cap: f.pens * CAT.FARM.perPen, rate: r2(farmRate(f) * 60), price: squigPrice(), sold: f.sold | 0, name: f.name || '', penCost: CAT.FARM.penCost(f.pens), feedCost: CAT.FARM.feedCost(f.feed) }; }
function worth(a) {
  let w = a.bal;
  for (const s in a.st) if (own(D.mkt.s, s)) w += Math.floor(a.st[s] * bidOf(s));
  if (a.plot >= 0 && D.town.plots[a.plot]) for (const ch of D.town.plots[a.plot].cells) w += Math.floor((CAT.BUILD[ch] || { cost: 0 }).cost / 3);
  return Math.min(MAXB, w);
}
function pubWear(a) { const w = a.wear || {}; return [w.hat || '', w.face || '', w.badge || '', w.gub || '', w.wal || '']; }
function meView(a) {
  rollDay(a);
  const caps = {}; for (const k in CAT.EARN) caps[k] = [a.caps[k] | 0, CAT.EARN[k].cap];
  const st = {}; for (const s in a.st) if (a.st[s] > 0) st[s] = [a.st[s], a.cost[s] | 0];
  const w = wallet(a);
  return { t: 'ecMe', name: a.name, bal: a.bal, earned: a.earned | 0, spent: a.spent | 0, inv: a.inv, wear: a.wear, log: a.log.slice(-LOGN), caps, streak: a.streak | 0, st, plot: a.plot, farm: farmView(a), rentAcc: r2(a.rentAcc || 0), worth: worth(a), opened: a.opened, tix: (a.tix || []).filter(t => t.no === D.lotto.no).map(t => t.n), lt: a.lt || [], secrets: (a.sec || []).length, wallet:{pence:w.pence,log:w.log,nonce:w.nonce,remaining:2000-(w.day===uk().day?w.exchanged:0),rate:20} };
}
function sendMe(ws, c) { const a = acct(c); if (a) ctx.send(ws, meView(a)); }
function meToAll(a) { toMember(a.name, meView(a)); }
let richCache = null, richAt = 0;
function richList() {
  if (richCache && Date.now() - richAt < 15000) return richCache;
  richCache = Object.values(D.acct).filter(a => a && a.name && ctx.state.members[a.name.toLowerCase()]).map(a => ({ n: a.name, w: worth(a), b: a.bal, e: a.earned | 0, badge: (a.wear || {}).badge || '', gold: !!(a.inv && a.inv['misc.goldtoof']), plot: a.plot })).sort((x, y) => y.w - x.w || x.n.localeCompare(y.n));
  richAt = Date.now();
  return richCache;
}

// ---------------------------------------------------------------- earning hooks
function daily(c) {
  const a = acct(c); if (!a) return;
  rollDay(a);
  const day = uk().day; if (a.lastDay === day) return;
  // a gentle streak: every day you log on adds one; missing a day just pauses it (it never goes back down)
  a.streak = (a.streak | 0) + 1;
  a.days = (a.days | 0) + 1;
  a.lastDay = day; a.caps.daily = 1;
  const amt = CAT.EARN.daily.amt + Math.min(6, a.streak - 1) * 5;
  credit(a, amt, 'daily', a.streak > 1 ? `Daily log-on bonus (streak: day ${a.streak}!)` : 'Daily log-on bonus');
  for (const fn of HOOKS.daily) { try { fn(a, c); } catch (e) { console.error('econ daily hook', e); } }
}

// ---------------------------------------------------------------- the shop
function canHave(a, it) {
  if (it.req === 'plot') return a.plot >= 0 ? '' : 'You need to own a plot in Jacktown first! (www.jacktown.jnet)';
  if (it.req === 'farm5') return a.farm && a.farm.pens >= 5 ? '' : 'You need a Pixel Pet Farm with 5 or more pens first! (www.mypixelfarm.webcom)';
  return '';
}
function buy(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const id = String(m.id || ''); if (!own(CAT.ITEM, id)) return err(ws, 'That item does not exist. (Gubbinz ate the catalogue page.)');
  const it = CAT.ITEM[id], n = m.n == null ? 1 : m.n;
  if (!isInt(n, 1, it.use ? 20 : 1)) return err(ws, 'Funny number. Try again.');
  const have = a.inv[id] | 0;
  if (!it.use && have) return err(ws, `You already own the ${it.name}! It's in Your Stash.`);
  if (it.use && have + n > (it.max || 99)) return err(ws, `Your stash can only hold ${it.max || 99} of those.`);
  const why = canHave(a, it); if (why) return err(ws, why);
  const total = it.price * n;
  if (a.bal < total) return err(ws, `Not enough Rupees! That costs ${total} and you have ${a.bal}.`);
  debit(a, total, 'buy', `The Rupee Emporium: ${n > 1 ? n + ' x ' : ''}${it.name}`);
  a.inv[id] = have + n;
  const order = ++D.orders;
  ctx.send(ws, { t: 'ecBought', id, n, total, order, bal: a.bal });
  meToAll(a);
  if (it.price >= 400 && !it.use) gaz('shop', `BIG SPENDER: ${a.name} BUYS THE ${it.name.toUpperCase()}`, `Staff at The Rupee Emporium were "gobsmacked" when ${a.name} walked in and bought the ${it.name} for ${it.price} Rupees. "They didn't even haggle," said Kev on the till.`);
}
function wear(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const slot = String(m.slot || ''), id = String(m.id || '');
  if (!SLOTS.includes(slot)) return;
  if (id) {
    if (!own(CAT.ITEM, id) || !(a.inv[id] > 0)) return err(ws, "You don't own that.");
    const cat = CAT.ITEM[id].cat;
    if (slot === 'gub' ? cat !== 'hat' : cat !== slot) return;
    a.wear[slot] = id;
  } else delete a.wear[slot];
  ctx.markDirty();
  meToAll(a);
  if (/^(hat|face|badge|gub|wal)$/.test(slot)) ctx.broadcast({ t: 'ecWear', n: a.name, w: pubWear(a) });
}
function useItem(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const id = String(m.id || ''); if (!own(CAT.ITEM, id) || !CAT.ITEM[id].use) return;
  if (!(a.inv[id] > 0)) return err(ws, "You haven't got any of those left. Buy some at The Rupee Emporium!");
  const now = Date.now(); if (now - (a.lastUse || 0) < 20000) return err(ws, 'Gubbinz is still chewing. Give him 20 seconds!');
  const p = ctx.state.pet; if (!p || p.dead) return err(ws, 'Gubbinz is... not with us any more. Hatch a new one on his page first.');
  a.lastUse = now;
  a.inv[id]--; if (!a.inv[id]) delete a.inv[id];
  let did = 'feed';
  if (id === 'gub.chow') { p.food = Math.min(100, p.food + 40); p.feeds = (p.feeds | 0) + 1; }
  else if (id === 'gub.cake') { p.food = Math.min(100, p.food + 15); p.fun = Math.min(100, p.fun + 30); did = 'play'; }
  else if (id === 'gub.soap') { p.clean = 100; did = 'clean'; }
  p.lastBy = c.nick; ctx.markDirty();
  ctx.broadcast({ t: 'pet', pet: Object.assign({}, p, { deaths: ctx.state.petDeaths }), by: c.nick, did });
  ctx.send(ws, { t: 'ecUsed', id });
  meToAll(a);
}
function secretFound(ws, c, m) {
  const a = acct(c); if (!a) return;
  const id = String(m.id || ''); if (!ID_RE.test(id)) return;
  a.sec = a.sec || [];
  if (a.sec.includes(id)) return;
  if (a.sec.length >= 1000) return;
  a.sec.push(id); ctx.markDirty();
  earn(c, 'secret', 'Secret found on the PC');
}

// ---------------------------------------------------------------- Jack Stock Exchange
const NEWS = [
  ['SQIG', -0.3, 'PIXEL POX! Pixel Pets plc crashes as half the keyring pets catch a virus off a floppy disk'],
  ['SQIG', 0.15, 'Pixel Pets plc wins contract to put a free pet in every cereal box'],
  ['SQIG', -0.12, 'Pixel Pets banned from three schools for "beeping in maths"; shares slide'],
  ['TEEF', 0.12, 'NEW GEM SEAM FOUND under the Jacktown school playground'],
  ['TEEF', -0.15, 'Rupee Mining Co. digs for a week and only finds green ones; shares tumble'],
  ['TEEF', 0.1, 'Rupee Mining Co. digs up a RAINBOW Rupee. Experts: "that is a very shiny Rupee"'],
  ['GROT', -0.2, 'Jiffy Couriers van drives into Jacktown pond. Again.'],
  ['GROT', 0.18, 'Jiffy Couriers delivers a parcel ON TIME for the first time ever'],
  ['DAKA', 0.2, 'Millennium firework orders go BOOM for Bang Bros Fireworks'],
  ['DAKA', -0.12, "Mom's Knitting Club complains about 'very loud whistles'; Bang Bros falls"],
  ['GUBZ', 0.15, 'Gubbinz declares new Mushroom Cake "the best thing ever"'],
  ['GUBZ', -0.18, 'Gubbinz Pet Food recall: Gubbinz Chow tins found to contain one sock each'],
  ['MEKK', 0.12, 'Turbo Karts unveils new kart. It is red. It goes faster.'],
  ['MEKK', -0.15, 'Turbo Karts recalls 400 karts after the wheels "go wandering off"'],
  ['JNET', 0.25, 'JackNet Online announces it is "going dot-com"; shares ROCKET'],
  ['JNET', -0.3, "JackNet Online goes down for six hours: somebody's Mom picked up the phone"],
  ['JNET', 0.15, 'JackNet Online launches FREE CD-ROM on the front of every comic'],
  ['CUBE', 0.14, 'Cube craze sweeps playgrounds again; Kube Toys sells out'],
  ['CUBE', -0.12, 'Kube Toys in trouble after a boy peels off all the stickers and "solves" it'],
  ['*', -0.08, 'Y2K PANIC! Traders sell everything and buy tins of beans'],
  ['*', 0.06, 'Bank holiday cheer lifts the whole Jack Exchange'],
  ['*', -0.05, 'It is raining. The whole market feels a bit damp.'],
];
function addNews(sym, chg, text) {
  const e = { ts: Date.now(), sym, chg: r2(chg * 100), text };
  D.mkt.news.push(e); if (D.mkt.news.length > 40) D.mkt.news.splice(0, D.mkt.news.length - 40);
  subs('mkt', { t: 'ecNews', e });
  if (Math.abs(chg) >= 0.15) gaz('mkt', text.toUpperCase().replace(/;.*/, ''), `Shares in ${sym === '*' ? 'every company on the Jack Exchange' : COS[sym].name + ' (' + CAT.dsym(sym) + ')'} moved ${chg > 0 ? 'up' : 'down'} about ${Math.abs(Math.round(chg * 100))}% on the news. "${chg > 0 ? 'Buy buy buy!' : 'Sell sell sell!'}" shouted a trader in red braces on the trading floor, before falling over.`);
}
function shock(sym, chg) { const S = D.mkt.s[sym]; if (!S) return; S.p = r2(clamp(S.p * (1 + chg), 0.5, 99999)); S.mom += chg * 0.05; }
function mktTick() {
  const M = D.mkt; M.tick++;
  const town = D.town.stats || {};
  for (const co of CAT.COS) {
    const S = M.s[co.sym];
    S.fair *= Math.exp(co.drift);
    let fair = S.fair;
    if (co.sym === 'SQIG') fair *= 1 + Math.min(0.6, (town.sq || 0) / 300);
    if (co.sym === 'GUBZ') fair *= 1 + Math.min(0.5, (town.mush || 0) / 300);
    if (co.sym === 'MEKK') fair *= 1 + Math.min(0.3, (town.jobs || 0) / 2000);
    const z = gauss();
    let r = co.drift + co.vol * z + S.mom + clamp(S.press, -0.015, 0.015) - 0.003 * Math.log(S.p / fair);
    S.mom = S.mom * 0.85 + co.vol * z * 0.04; S.press *= 0.3;
    if (co.sym === 'JNET' && rnd() < 1 / 3000) { r -= 0.35; addNews('JNET', -0.35, 'DOT-COM WOBBLE! JackNet Online shares fall off a cliff'); }
    S.p = r2(clamp(S.p * Math.exp(r), 0.5, 99999));
    S.hi = Math.max(S.hi, S.p); S.lo = Math.min(S.lo, S.p);
    S.m.push(S.p); if (S.m.length > 240) S.m.splice(0, S.m.length - 240);
    if (M.tick % 60 === 0) { S.h.push(S.p); if (S.h.length > 336) S.h.splice(0, S.h.length - 336); }
  }
  if (rnd() < 1 / 40) {
    const [sym, chg, text] = pick(NEWS), size = chg * (0.35 + rnd() * 0.4);
    if (sym === '*') for (const co of CAT.COS) shock(co.sym, size * (0.5 + rnd())); else shock(sym, size);
    addNews(sym, size, text);
  }
  ctx.markDirty();
  const p = {}; for (const co of CAT.COS) p[co.sym] = M.s[co.sym].p;
  subs('mkt', { t: 'ecTick', p, ix: index() });
}
function index() { let s = 0; for (const co of CAT.COS) s += D.mkt.s[co.sym].p / co.p0; return r2(s / CAT.COS.length * 1000); }
function mktView() {
  const s = {}; for (const co of CAT.COS) { const S = D.mkt.s[co.sym]; s[co.sym] = { p: S.p, open: S.open, hi: S.hi, lo: S.lo, m: S.m.slice(-60), vol: S.vol | 0 }; }
  return { t: 'ecMkt', s, news: D.mkt.news.slice(-20), tape: D.mkt.tape.slice(-15), ix: index(), tick: D.mkt.tick };
}
function trade(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const sym = String(m.sym || ''), n = m.n, side = m.side;
  if (!own(COS, sym) || (side !== 'b' && side !== 's') || !isInt(n, 1, 10000)) return err(ws, 'That order form is filled in wrong.');
  const S = D.mkt.s[sym], held = a.st[sym] | 0;
  if (side === 'b') {
    const cost = Math.ceil(askOf(sym) * n);
    if (held + n > 100000) return err(ws, 'The Exchange only lets one member hold 100,000 shares of a company.');
    if (a.bal < cost) return err(ws, `Not enough Rupees! ${n} ${CAT.dsym(sym)} costs ${cost.toLocaleString('en-GB')} and you have ${a.bal.toLocaleString('en-GB')}.`);
    debit(a, cost, 'stock', `Bought ${n} ${sym} @ ${askOf(sym)}`);
    a.st[sym] = held + n; a.cost[sym] = Math.min(MAXB, (a.cost[sym] | 0) + cost);
    S.press += Math.min(0.01, cost / 40000); S.vol = (S.vol | 0) + n;
    tape(a.name, 'b', sym, n, askOf(sym));
    ctx.send(ws, { t: 'ecTraded', side, sym, n, total: cost });
  } else {
    if (held < n) return err(ws, `You only have ${held} ${sym} shares.`);
    const got = Math.floor(bidOf(sym) * n);
    a.cost[sym] = Math.round((a.cost[sym] | 0) * (held - n) / held);
    a.st[sym] = held - n; if (!a.st[sym]) { delete a.st[sym]; delete a.cost[sym]; }
    S.press -= Math.min(0.01, got / 40000); S.vol = (S.vol | 0) + n;
    credit(a, got, 'stock', `Sold ${n} ${sym} @ ${bidOf(sym)}`, true);
    tape(a.name, 's', sym, n, bidOf(sym));
    ctx.send(ws, { t: 'ecTraded', side, sym, n, total: got });
  }
  meToAll(a);
}
function tape(name, side, sym, n, p) {
  const e = { ts: Date.now(), by: name, side, sym, n, p };
  D.mkt.tape.push(e); if (D.mkt.tape.length > 30) D.mkt.tape.splice(0, D.mkt.tape.length - 30);
  subs('mkt', { t: 'ecTape', e });
}

// ---------------------------------------------------------------- Jacktown
function plotCells(i) { const P = D.town.plots[i]; return P ? P.cells : '.'.repeat(16); }
function townView() {
  return { t: 'ecTown', plots: D.town.plots.map(P => P ? [P.o, P.nm || '', P.cells, (D.acct[P.o.toLowerCase()] && D.acct[P.o.toLowerCase()].wear.badge) || ''] : null), stats: D.town.stats, hist: D.town.hist.slice(-48), ev: D.town.ev, treasury: Math.floor(D.town.treasury), tick: D.town.tick };
}
function plotOf(a) { if (a.plot < 0) return null; const P = D.town.plots[a.plot]; if (!P || P.o !== a.name) { a.plot = -1; return null; } return P; }
function claim(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const i = m.i; if (!isInt(i, 0, NPLOT - 1) || T.RESERVED.includes(i)) return err(ws, "You can't claim that plot.");
  if (plotOf(a)) return err(ws, 'You already have a plot! One each, by order of the Mayor.');
  if (D.town.plots[i]) return err(ws, 'Somebody already lives there.');
  if (!debit(a, 25, 'town', `Jacktown: deeds for plot ${i + 1}`)) return err(ws, 'The deeds cost 25 Rupees and you have not got 25 Rupees.');
  D.town.plots[i] = { o: a.name, nm: '', cells: '.'.repeat(16), at: Date.now() };
  a.plot = i; ctx.markDirty();
  subs('town', { t: 'ecPlot', i, p: [a.name, '', '.'.repeat(16), (a.wear || {}).badge || ''] });
  gaz('town', `NEW NEIGHBOUR: ${a.name.toUpperCase()} MOVES IN`, `${a.name} has bought the deeds to plot ${i + 1} on ${address(i)}. "I'm going to build ${pick(['a cinema', 'loads of houses', 'a pet shop empire', 'a massive fountain', 'something red', 'a mushroom farm'])}," they told the Gazette. The neighbours said "'ello".`);
  meToAll(a);
}
function address(i) { return `${CAT.ROADS[(i / T.N) | 0]} / ${CAT.AVES[i % T.N]}`; }
function build(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  if (!c.ecB) c.ecB = new ctx.Bucket(4, 12);
  const P = plotOf(a); if (!P) return err(ws, 'Claim a plot first!');
  const k = m.k, b = String(m.b || '');
  if (!isInt(k, 0, 15) || !own(CAT.BUILD, b)) return;
  if (!c.ecB.take()) return err(ws, 'Whoa, slow down! The builders are only human.');
  const old = P.cells[k]; if (old === b) return;
  const B = CAT.BUILD[b];
  if (b !== '.') {
    const count = [...P.cells].filter(x => x === b).length;
    if (count >= B.max) return err(ws, `Only ${B.max} ${B.n}${B.max > 1 ? 's' : ''} allowed per plot (planning rules).`);
  }
  const refund = old !== '.' ? Math.floor(CAT.BUILD[old].cost / 3) : 0;
  const cost = B.cost;
  if (cost > 0 && a.bal + refund < cost) return err(ws, `A ${B.n} costs ${cost} Rupees. You have ${a.bal}.`);
  if (refund) credit(a, refund, 'town', `Jacktown: bulldozed ${CAT.BUILD[old].n}`, true);
  if (cost > 0 && !debit(a, cost, 'town', `Jacktown: built ${B.n}`)) return;
  P.cells = P.cells.slice(0, k) + b + P.cells.slice(k + 1); ctx.markDirty();
  subs('town', { t: 'ecCell', i: a.plot, k, b, by: a.name });
  if (cost >= 140) gaz('build', `${a.name.toUpperCase()} BUILDS ${B.n.toUpperCase()}`, `Big news on ${address(a.plot)}: ${a.name} has built ${an(B.n)}. ${B.d}`);
  meToAll(a);
}
function plotName(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const P = plotOf(a); if (!P) return;
  if (!c.ecN) c.ecN = new ctx.Bucket(0.2, 3); if (!c.ecN.take()) return err(ws, 'You only just renamed it!');
  P.nm = ctx.delink(ctx.clean(m.nm, 24)); ctx.markDirty();
  subs('town', { t: 'ecPlot', i: a.plot, p: [P.o, P.nm, P.cells, (a.wear || {}).badge || ''] });
}
function abandon(ws, c) {
  const a = acct(c); if (!a) return need(ws);
  const P = plotOf(a); if (!P) return;
  const i = a.plot; D.town.plots[i] = null; a.plot = -1; ctx.markDirty();
  subs('town', { t: 'ecPlot', i, p: null });
  gaz('town', `${a.name.toUpperCase()} MOVES OUT`, `Plot ${i + 1} on ${address(i)} is up for grabs again after ${a.name} packed up and left. The builders flattened everything. A fox has already moved in.`);
  meToAll(a);
}
const LANDMARK = { 24: { pow: 20, jobs: 10, hap: 4 }, 17: { jobs: 12, hap: 1 }, 31: { jobs: 6, hap: 3 } };
const TOWN_EV = [
  { id: 'stampede', need: s => s.sq > 0, t: 3, hap: -8, h: 'PIXEL PET STAMPEDE!', b: s => `A herd of ${10 + s.sq * 2} Pixel Pets escaped from the pet shops and beeped their way down ${pick(CAT.ROADS)}, flattening flower beds and eating a bin. Pixel Pets plc shares wobbled.`, mk: ['SQIG', -0.06] },
  { id: 'parade', t: 3, hap: 10, crime: 3, h: 'FANCY DRESS PARADE THROUGH TOWN', b: () => 'Hundreds of people dressed as Jedi, robots, wizards, space marines and one very wobbly Pikachu marched down the high street. Everyone had a lovely time apart from the bloke who has to clean up.' },
  { id: 'powercut', t: 2, pow: -1, h: 'POWER CUT!', b: s => s.powOk < 1 ? `The Big Power Station gave up trying to power ${s.demand} buildings on ${s.supply} units of electricity. Build more generators or windmills!` : 'Somebody plugged in a kettle, a telly AND a hairdryer at the same time. The whole town went dark for half an hour.' },
  { id: 'crime', t: 3, crime: 12, h: 'CRIME WAVE', b: () => 'Sneaky burglars have been nicking Rupees from the Town Treasury piggy bank. The Mayor wants more Neighbourhood Watch Huts.', tre: -0.1 },
  { id: 'bumper', need: s => s.mush > 0, t: 3, hap: 3, h: 'BUMPER MUSHROOM HARVEST', b: s => `The mushroom farms grew ${s.mush * 7} kilos of mushrooms this week. Gubbinz Pet Food is "well chuffed".`, mk: ['GUBZ', 0.05] },
  { id: 'rain', t: 2, hap: -3, h: 'IT RAINED', b: () => 'It rained all day in Jacktown. Again. Everyone stayed in and played on their computers.' },
  { id: 'sun', t: 2, hap: 5, h: 'SUNNY SPELL!', b: () => 'The sun came out for an entire afternoon. Dads were seen in shorts. It was not pretty.' },
  { id: 'tourists', need: s => s.statue > 0, t: 3, rent: 0.25, h: 'COACH-LOAD OF TOURISTS', b: () => "A coach-load of tourists arrived to try and solve the giant Rubik's Cube statue. Nobody managed it, but the shops and cafes did very well." },
  { id: 'premiere', need: s => s.cinema > 0, t: 3, hap: 6, h: 'EPISODE I SOLD OUT AGAIN', b: s => `Every seat at Jacktown's ${s.cinema} cinema${s.cinema > 1 ? 's' : ''} sold out again. One boy has now seen it 41 times. "Jar Jar is my favourite," he said, bravely.` },
  { id: 'y2k', t: 2, hap: -4, h: 'Y2K DRILL AT TOWN HALL', b: () => 'The council practised for the Millennium Bug by switching everything off and on again. Mostly it came back on.' },
  { id: 'fair', t: 3, hap: 8, rent: 0.1, h: 'FUNFAIR COMES TO TOWN', b: () => 'A funfair set up on the green: dodgems, a big wheel and a candyfloss stall. The arcade was NOT happy about the competition.' },
];
function townTick() {
  const TW = D.town; TW.tick++;
  const tot = { pop: 0, jobs: 0, hap: 0, crime: 0, poll: 0, sq: 0, mush: 0, supply: 0, demand: 0, statue: 0, cinema: 0, built: 0 };
  const plotRent = [];
  for (let i = 0; i < NPLOT; i++) {
    const L = LANDMARK[i]; if (L) { tot.supply += L.pow || 0; tot.jobs += L.jobs || 0; tot.hap += L.hap || 0; continue; }
    let P = TW.plots[i]; plotRent[i] = 0; if (!P) continue;
    if (!ctx.state.members[String(P.o).toLowerCase()]) { TW.plots[i] = null; subs('town', { t: 'ecPlot', i, p: null }); continue; } // the member was deleted: the plot goes back on sale
    for (const ch of P.cells) {
      const B = CAT.BUILD[ch]; if (!B || ch === '.') continue;
      tot.built++; tot.pop += B.pop; tot.jobs += B.jobs; tot.hap += B.hap; tot.crime += B.crime; tot.poll += B.poll; tot.sq += B.sq; tot.mush += B.mush;
      if (B.pow > 0) tot.supply += B.pow; else tot.demand -= B.pow;
      if (ch === 'R') tot.statue++; if (ch === 'c') tot.cinema++;
      plotRent[i] += B.rent;
    }
  }
  TW.ev = TW.ev.filter(e => e.until > TW.tick);
  const mod = { hap: 0, crime: 0, rent: 0, pow: 0 };
  for (const e of TW.ev) { mod.hap += e.hap || 0; mod.crime += e.crime || 0; mod.rent += e.rent || 0; if (e.pow) mod.pow = -1; }
  const powOk = mod.pow < 0 ? 0 : tot.demand ? Math.min(1, tot.supply / tot.demand) : 1;
  const workers = tot.pop * 0.6, unemp = Math.max(0, workers - tot.jobs), unempRate = workers ? unemp / workers : 0;
  const crime = Math.max(0, Math.round(tot.crime + tot.pop / 25 + mod.crime));
  const poll = Math.max(0, Math.round(tot.poll));
  const scale = 10 + tot.pop / 8;
  const hap = Math.round(clamp(50 + 30 * Math.tanh((tot.hap - poll * 0.8 - crime * 0.8) / scale) - unempRate * 20 - (1 - powOk) * 15 + mod.hap, 0, 100));
  const mult = (0.4 + hap / 100) * (0.5 + 0.5 * powOk) * (1 + mod.rent);
  const S = { pop: tot.pop, jobs: tot.jobs, unemp: Math.round(unemp), hap, crime, poll, sq: tot.sq, mush: tot.mush, supply: tot.supply, demand: tot.demand, powOk: r2(powOk), built: tot.built, statue: tot.statue, cinema: tot.cinema, mult: r2(mult), plots: TW.plots.filter(Boolean).length, ts: Date.now() };
  TW.stats = S;
  TW.hist.push([S.pop, S.hap, S.crime, S.poll, S.sq]); if (TW.hist.length > 96) TW.hist.splice(0, TW.hist.length - 96);
  // rent: 10% goes to the Town Treasury, the rest piles up for the owner and is paid out every hour
  const payNow = TW.tick % 20 === 0;
  for (let i = 0; i < NPLOT; i++) {
    const P = TW.plots[i]; if (!P || !plotRent[i]) continue;
    const a = D.acct[P.o.toLowerCase()]; if (!a) continue;
    const r = plotRent[i] * mult;
    a.rentAcc = Math.min(1e6, (a.rentAcc || 0) + r * 0.9); TW.treasury = Math.min(1e9, TW.treasury + r * 0.1);
  }
  if (payNow) for (const a of Object.values(D.acct)) if (a && a.rentAcc >= 1) { const n = Math.floor(a.rentAcc); a.rentAcc -= n; credit(a, n, 'rent', 'Jacktown rent (the last hour)'); }
  // random town events (about one every 15-20 minutes)
  if (rnd() < 0.18) {
    const choices = TOWN_EV.filter(e => (!e.need || e.need(S)) && !TW.ev.some(x => x.id === e.id));
    if (choices.length) {
      const e = pick(choices);
      TW.ev.push({ id: e.id, h: e.h, until: TW.tick + e.t, hap: e.hap || 0, crime: e.crime || 0, rent: e.rent || 0, pow: e.pow || 0 });
      if (e.tre) TW.treasury *= 1 + e.tre;
      if (e.mk) { shock(e.mk[0], e.mk[1]); addNews(e.mk[0], e.mk[1], `Jacktown: ${e.h.toLowerCase()}`); }
      gaz('event', e.h, e.b(S));
      subs('town', { t: 'ecTownEv', h: e.h });
    }
  }
  ctx.markDirty();
  subs('town', { t: 'ecStats', stats: S, ev: TW.ev, treasury: Math.floor(TW.treasury) });
}
function gaz(k, h, b) {
  const g = D.town.gaz; g.push({ ts: Date.now(), k, h: String(h).slice(0, 90), b: String(b).slice(0, 600) });
  if (g.length > 40) g.splice(0, g.length - 40);
  if (ctx) ctx.markDirty();
}
function plotScore(P) { let s = 0; for (const ch of P.cells) { const B = CAT.BUILD[ch]; if (B && ch !== '.') s += 1 + Math.max(0, B.hap) * 2 - Math.max(0, B.poll); } return s; }

// ---------------------------------------------------------------- the daily roll-over (UK midnight): dividends, interest, best-kept plot
function newDay(day) {
  D.day = day;
  const M = D.mkt;
  const moves = CAT.COS.map(co => [co, M.s[co.sym].open ? M.s[co.sym].p / M.s[co.sym].open - 1 : 0]).sort((x, y) => y[1] - x[1]);
  const pc = v => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
  gaz('mkt', `MARKET REPORT: ${moves[0][0].name.toUpperCase()} TOPS THE DAY`, `On the Jack Exchange yesterday, ${moves[0][0].name} did best (${pc(moves[0][1])}) and ${moves[moves.length - 1][0].name} did worst (${pc(moves[moves.length - 1][1])}). The JX-8 index closed at ${index().toLocaleString('en-GB')}. Dividends have been paid to everyone holding shares. "${moves[0][1] > 0.05 ? 'Champagne all round! Well, squash.' : 'A quiet day,'}" said a man in red braces.`);
  for (const co of CAT.COS) { const S = M.s[co.sym]; S.d.push(S.p); if (S.d.length > 120) S.d.splice(0, S.d.length - 120); S.open = S.p; S.hi = S.p; S.lo = S.p; S.vol = 0; }
  for (const a of Object.values(D.acct)) {
    if (!a || !a.name) continue;
    let div = 0; for (const s in a.st) if (own(COS, s)) div += a.st[s] * M.s[s].p * COS[s].yld;
    if (div >= 1) credit(a, div, 'div', 'Jack Exchange dividends');
    const intr = Math.min(10, Math.floor(a.bal * 0.001));
    if (intr >= 1) credit(a, intr, 'int', 'JackNet Bank interest (0.1% a day!)');
  }
  let best = -1, bs = 0;
  D.town.plots.forEach((P, i) => { if (P) { const s = plotScore(P); if (s > bs) { bs = s; best = i; } } });
  if (best >= 0 && bs >= 10) {
    const P = D.town.plots[best], a = D.acct[P.o.toLowerCase()];
    if (a) credit(a, 75, 'town', 'Jacktown Best-Kept Plot award');
    gaz('town', `BEST-KEPT PLOT: ${P.o.toUpperCase()}`, `The Planning Inspector (a lady with a clipboard) has named ${P.nm ? '"' + P.nm + '"' : 'plot ' + (best + 1)}, owned by ${P.o}, as Jacktown's Best-Kept Plot of the day. Prize: 75 Rupees and a rosette (the dog ate the rosette).`);
  }
  ctx.markDirty();
}

// ---------------------------------------------------------------- JackLotto (drawn at 21:00 UK every night)
function lottoView(a) { const L = D.lotto; return { t: 'ecLotto', no: L.no, jackpot: L.jackpot, sold: L.tickets.length, last: L.last, hist: L.hist.slice(-10), mine: a ? (a.tix || []).filter(t => t.no === L.no).map(t => t.n) : [], lt: a ? a.lt || [] : [], next: nextDrawTs() }; }
function nextDrawTs() { // approximate: next time the UK clock says 21:00
  const now = Date.now(), u = uk(now); let mins = (21 - u.h) * 60 - u.mi; if (mins <= 0 || D.lotto.lastDay === u.day) mins += 24 * 60; return now + mins * 60000 - (now % 60000);
}
function ticket(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const L = D.lotto; let n = m.n;
  if (n === 'dip') { const s = new Set(); while (s.size < 6) s.add(rint(1, 49)); n = [...s]; }
  if (!Array.isArray(n) || n.length !== 6 || !n.every(x => isInt(x, 1, 49)) || new Set(n).size !== 6) return err(ws, 'Pick six different numbers from 1 to 49.');
  n = n.slice().sort((x, y) => x - y);
  a.tix = (a.tix || []).filter(t => t.no === L.no);
  if (a.tix.length >= CAT.LOTTO.maxTickets) return err(ws, `Only ${CAT.LOTTO.maxTickets} tickets per draw. Gambling is bad, says Mom.`);
  if (L.tickets.length >= 5000) return err(ws, 'Sold out!');
  if (!debit(a, CAT.LOTTO.price, 'lotto', `JackLotto ticket (draw ${L.no})`)) return err(ws, `Tickets cost ${CAT.LOTTO.price} Rupees.`);
  a.tix.push({ no: L.no, n }); L.tickets.push({ k: a.name.toLowerCase(), n });
  L.jackpot = Math.min(1e9, L.jackpot + Math.floor(CAT.LOTTO.price / 2));
  ctx.markDirty();
  ctx.send(ws, lottoView(a)); meToAll(a);
}
function draw() {
  const L = D.lotto, balls = []; const s = new Set(); while (s.size < 6) { const b = rint(1, 49); if (!s.has(b)) { s.add(b); balls.push(b); } }
  const winners = [], per = {}, jack = [];
  for (const t of L.tickets) {
    const match = t.n.filter(x => s.has(x)).length;
    (per[t.k] = per[t.k] || []).push({ n: t.n, match, prize: 0 });
    if (match === 6) jack.push(per[t.k][per[t.k].length - 1]);
    else if (CAT.LOTTO.prizes[match]) per[t.k][per[t.k].length - 1].prize = CAT.LOTTO.prizes[match];
  }
  const jp = L.jackpot;
  if (jack.length) for (const j of jack) j.prize = Math.floor(jp / jack.length);
  for (const k in per) {
    const a = D.acct[k]; if (!a) continue;
    a.lt = per[k].map(x => ({ no: L.no, n: x.n, match: x.match, prize: x.prize })).slice(0, 10);
    const won = per[k].reduce((q, x) => q + x.prize, 0);
    for (const x of per[k]) if (x.prize) winners.push({ n: a.name, match: x.match, prize: x.prize });
    if (won) credit(a, won, 'lotto', `JackLotto winnings (draw ${L.no})`);
  }
  L.last = { no: L.no, balls, ts: Date.now(), jackpot: jp, sold: L.tickets.length, winners: winners.sort((x, y) => y.prize - x.prize).slice(0, 20), rolled: !jack.length };
  L.hist.push({ no: L.no, balls, jp, won: !!jack.length }); if (L.hist.length > 30) L.hist.splice(0, L.hist.length - 30);
  L.no++; L.tickets = []; L.jackpot = jack.length ? CAT.LOTTO.seed : jp;
  L.lastDay = uk().day; ctx.markDirty();
  ctx.broadcast({ t: 'ecDraw', last: L.last });
  gaz('lotto', jack.length ? `LOTTO JACKPOT WON! ${jp.toLocaleString('en-GB')} RUPEES` : `JACKLOTTO: ROLLOVER! JACKPOT NOW ${L.jackpot.toLocaleString('en-GB')}`, `Last night's numbers were ${balls.slice().sort((x, y) => x - y).join(', ')}. ${winners.length ? winners.slice(0, 3).map(w => `${w.n} matched ${w.match}`).join(', ') + '.' : 'Nobody won anything. The jackpot rolls over to tomorrow night.'}`);
}

// ---------------------------------------------------------------- Jackdown Park (a race every 10 minutes, bets close 20 seconds before)
const RACE_EVERY = 600000;
function newRace() {
  const R = D.race, at = Math.ceil((Date.now() + 60000) / RACE_EVERY) * RACE_EVERY;
  const names = []; while (names.length < 6) { const n = pick(CAT.GROTS); if (!names.includes(n)) names.push(n); }
  const field = names.map(n => ({ n, str: r2(0.9 + rnd() * 0.2), col: rint(0, 7) }));
  const wins = field.map(() => 0);
  for (let i = 0; i < 3000; i++) { let best = 0, bt = 1e9; field.forEach((g, j) => { const t = raceTime(g.str); if (t < bt) { bt = t; best = j; } }); wins[best]++; }
  field.forEach((g, j) => { const p = (wins[j] + 20) / 3120; g.odds = Math.max(1.5, Math.min(25, Math.round(0.85 / p * 2) / 2)); g.form = [rint(1, 6), rint(1, 6), rint(1, 6)].join('-'); });
  R.no++; R.cur = { no: R.no, at, field, bets: [], state: 'open' };
  ctx.markDirty();
}
const SEG = () => 0.55 + rnd() * 0.9; // how well a kart does one stretch of the course (the real race uses crypto randomness)
function raceTime(str) { let t = 0; for (let s = 0; s < 10; s++) t += 2.2 / (str * (0.55 + Math.random() * 0.9)); return t; } // for working out the odds
function raceView(a) { const R = D.race, cur = R.cur; return { t: 'ecRace', cur: cur && { no: cur.no, at: cur.at, state: cur.state, field: cur.field.map(g => ({ n: g.n, odds: g.odds, form: g.form, col: g.col })), pool: cur.bets.reduce((q, b) => q + b.amt, 0), nb: cur.bets.length, run: cur.run || null, res: cur.state === 'done' ? cur.res : null }, mine: a && cur ? cur.bets.filter(b => b.k === a.name.toLowerCase()).map(b => [b.g, b.amt]) : [], hist: R.hist.slice(-10), now: Date.now() }; }
function bet(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  const R = D.race.cur; if (!R || R.state !== 'open' || Date.now() > R.at - 20000) return err(ws, 'Betting has closed for this race. The karts are on the starting grid!');
  const g = m.g, amt = m.amt;
  if (!isInt(g, 0, 5) || !isInt(amt, 1, 100)) return err(ws, 'Bets are 1 to 100 Rupees.');
  const k = a.name.toLowerCase(); if (R.bets.filter(b => b.k === k).length >= 3) return err(ws, 'Three bets per race, maximum.');
  if (R.bets.length >= 3000) return err(ws, 'The bookie has run out of tickets.');
  if (!debit(a, amt, 'race', `Jackdown Park race ${R.no}: ${amt} on ${R.field[g].n}`)) return err(ws, `You only have ${a.bal} Rupees.`);
  R.bets.push({ k, g, amt }); ctx.markDirty();
  ctx.send(ws, raceView(a)); meToAll(a);
}
function raceStep() {
  const R = D.race, now = Date.now();
  if (!R.cur) return newRace();
  const cur = R.cur;
  if (cur.state === 'open' && now >= cur.at) {
    // run it: every kart gets 10 split times (seconds from the start), the order is decided right here
    const run = cur.field.map(g => { let t = 0; const sp = []; for (let s = 0; s < 10; s++) { t += 2.2 / (g.str * SEG()); sp.push(r2(t)); } return sp; });
    const order = run.map((sp, i) => [sp[9], i]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    cur.run = run; cur.res = order; cur.state = 'running'; cur.end = now + Math.ceil(Math.max(...run.map(sp => sp[9])) * 1000) + 1500;
    ctx.markDirty();
    subs('race', { t: 'ecRun', no: cur.no, run, at: now });
  } else if (cur.state === 'running' && now >= cur.end) {
    const win = cur.res[0], g = cur.field[win];
    const paid = {};
    for (const b of cur.bets) if (b.g === win) paid[b.k] = (paid[b.k] || 0) + Math.floor(b.amt * g.odds);
    for (const k in paid) { const a = D.acct[k]; if (a) credit(a, paid[k], 'race', `Jackdown Park race ${cur.no}: ${g.n} WON at ${g.odds}/1`); }
    cur.state = 'done';
    R.hist.push({ no: cur.no, ts: now, order: cur.res.map(i => cur.field[i].n), odds: g.odds, pool: cur.bets.reduce((q, b) => q + b.amt, 0), winners: Object.keys(paid).length });
    if (R.hist.length > 30) R.hist.splice(0, R.hist.length - 30);
    subs('race', { t: 'ecRaceEnd', no: cur.no, res: cur.res });
    if (g.odds >= 10) gaz('race', `${g.n.toUpperCase()} WINS AT ${g.odds} TO 1!`, `Outsider ${g.n} stormed home in race ${cur.no} at Jackdown Park, beating ${cur.field[cur.res[1]].n} into second. ${Object.keys(paid).length ? 'A few lucky punters cleaned up.' : 'Nobody had backed it. The bookie did a little dance.'}`);
    newRace();
  }
}

// ---------------------------------------------------------------- per-member Pixel Pet Farm (idle game; inside it is still the squig farm)
function farmRate(f) { return f.sq >= 2 ? f.pens / CAT.FARM.breedMin * (1 + 0.2 * f.feed) : 0; } // squigs per minute
function farmGrow(f) {
  const now = Date.now(), mins = Math.max(0, (now - (f.t || now)) / 60000); f.t = now;
  const cap = f.pens * CAT.FARM.perPen;
  if (f.sq < cap && f.sq >= 2) f.sq = Math.min(cap, f.sq + farmRate(f) * mins);
}
function squigPrice() { return Math.max(1, r2(D.mkt.s.SQIG.p / 20)); }
function farm(ws, c, m) {
  const a = acct(c); if (!a) return need(ws);
  if (!c.ecF) c.ecF = new ctx.Bucket(2, 6); if (!c.ecF.take()) return;
  const act = String(m.a || 'look'), F = CAT.FARM;
  if (act === 'start') { if (!a.farm) { a.farm = { pens: 1, feed: 0, sq: 2, t: Date.now(), sold: 0, name: '' }; ctx.markDirty(); } }
  else if (a.farm) {
    const f = a.farm; farmGrow(f);
    if (act === 'sell') {
      const n = Math.floor(f.sq) - 2; if (n < 1) return err(ws, 'Keep at least two Pixel Pets, or they cannot make more Pixel Pets!');
      const got = Math.floor(n * squigPrice()); f.sq -= n; f.sold = (f.sold | 0) + n;
      D.mkt.s.SQIG.press -= Math.min(0.004, n / 20000);
      credit(a, got, 'farm', `Sold ${n} Pixel Pets to Pixel Pets plc`);
    } else if (act === 'pen') {
      if (f.pens >= F.maxPens) return err(ws, 'Your farm is full of pens. There is no room for more pens.');
      const cost = F.penCost(f.pens); if (!debit(a, cost, 'farm', `Pixel Pet Farm: pen #${f.pens + 1}`)) return err(ws, `A new pen costs ${cost} Rupees.`);
      f.pens++;
    } else if (act === 'feed') {
      if (f.feed >= F.maxFeed) return err(ws, 'Your Pixel Pets cannot eat any more snacks. Honestly.');
      const cost = F.feedCost(f.feed); if (!debit(a, cost, 'farm', `Pixel Pet Farm: snack machine #${f.feed + 1}`)) return err(ws, `A snack machine costs ${cost} Rupees.`);
      f.feed++;
    } else if (act === 'name') { f.name = ctx.delink(ctx.clean(m.nm, 24)); }
    ctx.markDirty();
  }
  ctx.send(ws, { t: 'ecFarm', farm: farmView(a), bal: a.bal });
  if (act !== 'look') meToAll(a);
}

// ---------------------------------------------------------------- dispatch
const SUBFLAGS = ['mkt', 'town', 'race'];
function handle(ws, c, m) {
  if (!c.ec) c.ec = { mkt: false, town: false, race: false, rl: new ctx.Bucket(8, 30), warned: 0 };
  if (!c.ec.rl.take()) { if (Date.now() - c.ec.warned > 5000) { c.ec.warned = Date.now(); err(ws, 'Slow down! The JackNet server is only a 486.'); } return; }
  const a = c.member ? acct(c) : null;
  switch (m.t) {
    case 'ecExchange': return exchange(ws,c,m);
    case 'ecMe': if (a) ctx.send(ws, meView(a)); else ctx.send(ws, { t: 'ecMe', guest: true }); return;
    case 'ecSub': for (const f of SUBFLAGS) if (typeof m[f] === 'boolean') c.ec[f] = m[f]; return;
    case 'ecBuy': return buy(ws, c, m);
    case 'ecWear': return wear(ws, c, m);
    case 'ecUse': return useItem(ws, c, m);
    case 'ecSecret': return secretFound(ws, c, m);
    case 'ecMkt': return ctx.send(ws, mktView());
    case 'ecHist': { const sym = String(m.sym || ''); if (!own(COS, sym)) return; const S = D.mkt.s[sym]; return ctx.send(ws, { t: 'ecHist', sym, m: S.m, h: S.h, d: S.d }); }
    case 'ecTrade': return trade(ws, c, m);
    case 'ecRich': { const L = richList(); return ctx.send(ws, { t: 'ecRich', list: L.slice(0, 25), n: L.length, me: a ? L.findIndex(x => x.n === a.name) + 1 : 0 }); }
    case 'ecTown': return ctx.send(ws, townView());
    case 'ecClaim': return claim(ws, c, m);
    case 'ecBuild': return build(ws, c, m);
    case 'ecPlotName': return plotName(ws, c, m);
    case 'ecAbandon': return abandon(ws, c);
    case 'ecGaz': return ctx.send(ws, { t: 'ecGaz', list: D.town.gaz.slice().reverse() });
    case 'ecLotto': return ctx.send(ws, lottoView(a));
    case 'ecTicket': return ticket(ws, c, m);
    case 'ecRace': return ctx.send(ws, raceView(a));
    case 'ecBet': return bet(ws, c, m);
    case 'ecFarm': return farm(ws, c, m);
  }
}

module.exports = {
  name: 'econ',
  types: ['ecExchange', 'ecMe', 'ecSub', 'ecBuy', 'ecWear', 'ecUse', 'ecSecret', 'ecMkt', 'ecHist', 'ecTrade', 'ecRich', 'ecTown', 'ecClaim', 'ecBuild', 'ecPlotName', 'ecAbandon', 'ecGaz', 'ecLotto', 'ecTicket', 'ecRace', 'ecBet', 'ecFarm'],
  init(x) {
    ctx = x; D = x.data; initData();
    x.on('hello', (ws, c) => {
      const wearMap = {}; for (const a of Object.values(D.acct)) if (a && a.wear && (a.wear.hat || a.wear.face || a.wear.badge || a.wear.gub || a.wear.wal)) wearMap[a.name] = pubWear(a);
      ctx.send(ws, { t: 'ecHi', wear: wearMap });
      if (c.member) { daily(c); sendMe(ws, c); }
    });
    x.on('login', c => { daily(c); const a = acct(c); if (a) { meToAll(a); ctx.broadcast({ t: 'ecWear', n: a.name, w: pubWear(a) }); } });
    x.on('score', (c, game, score) => {
      if (!c.member) return;
      const list = ctx.state.scores && ctx.state.scores[game];
      if (list && list[0] && list[0].s === score) earn(c, 'record', `New ${String(game).toUpperCase()} record!`);
      earn(c, 'score', `High score on ${String(game).toUpperCase()}`);
    });
    x.on('post', (c, kind) => { if (c.member) earn(c, kind === 'fNew' ? 'topic' : 'post'); });
    x.on('gb', c => { if (c.member) earn(c, 'gb'); });
    x.on('chat', c => { if (!c.member) return; const now = Date.now(); if (now - (c.ecChat || 0) < 30000) return; c.ecChat = now; earn(c, 'chat'); });
    x.on('cube', c => { if (c.member) earn(c, 'cube'); });
    x.on('waaagh', c => { if (c.member) earn(c, 'waaagh'); });
    x.on('pet', (c, act, useful) => { if (c.member && useful) earn(c, 'petcare'); });
    x.on('quiz', c => { if (c.member) earn(c, 'quiz'); });
    // a JackNet member visiting someone else's homepage pays the owner a little (once per visitor per owner per day)
    const hpSeen = new Set(); let hpDay = '';
    x.on('hpVisit', (c, key) => {
      if (!c.member || !own(D.acct, key) || c.member.toLowerCase() === key) return;
      const d = uk().day; if (d !== hpDay) { hpDay = d; hpSeen.clear(); }
      const k = c.member.toLowerCase() + '>' + key; if (hpSeen.has(k)) return; hpSeen.add(k);
      earnA(D.acct[key], 'hpvisit', `${c.member} visited your homepage`);
    });
    // the clocks: market every minute, races every 2 seconds, town every 3 minutes, day/lotto checks every 30 seconds
    setInterval(() => { try { mktTick(); } catch (e) { console.error('econ mkt', e); } }, 60000);
    setInterval(() => { try { townTick(); } catch (e) { console.error('econ town', e); } }, 180000);
    setInterval(() => { try { raceStep(); } catch (e) { console.error('econ race', e); } }, 2000);
    setInterval(() => {
      try {
        const u = uk(); if (u.day !== D.day) newDay(u.day);
        if (u.h >= 21 && D.lotto.lastDay !== u.day) draw();
      } catch (e) { console.error('econ day', e); }
    }, 30000);
    if (!D.town.stats) try { townTick(); } catch (e) { console.error(e); }
    try { raceStep(); } catch (e) { console.error(e); }
  },
  handle,
  // for other server mods (mods/loot.js): one bank, one earn path
  api: { HOOKS, acct, acctByKey: k => (D && own(D.acct, k) ? D.acct[k] : null), earn, earnA, credit, debit, rollDay, toMember, meToAll, sendMe, pubWear, uk, err, need, gaz, get D() { return D; } },
  _test: { get D() { return D; }, mktTick, townTick, draw, raceStep, newDay, uk, daily, earn },
};
