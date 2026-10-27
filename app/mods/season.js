/* season: 1999 seasonal events (Halloween first), account-owned and server-validated (public/js/season-cat.js).
 * The browser says what happened (a carving step, a decoration placed, the porch light, a group at the door, what
 * it handed out); the server checks the event is on (the owner "jack" uses the owner 1999 clock, everyone else the
 * UK day with a day either side for time zones), the order and spacing of steps, the bowl's real stock, and pays
 * each objective once per account per event per loop through econ's capped 'season' source. Event state (the
 * carved pumpkin, the bowl, the porch light, the group waiting at the door) lives here, so a refresh never changes it.
 *   client -> { t:'seMe' }                         <- { t:'seMe', today, loop, ev:{ id: view } }
 *   client -> { t:'seStep', e, o, s, x? }          <- { t:'seStep', e, o, s, ok, done?, amt? } + seMe
 *   client -> { t:'seKnock', e, h }                <- { t:'seGroup', e, g } (a group at the door) or { t:'seKnock', e, wait }
 *   client -> { t:'seTreat', e, g, give:[[kid,sweet]] } <- { t:'seTreat', e, g, happy, n, done?, amt? } + seMe
 * Data: state.mods.season = { v, p:{ memberKey:{ eventId:{ loop:{ obj, paid, steps, carve, bowl, tin, porch, treat, decor } } } } }
 * (THE DATABASE IS SACRED: only ever added to; the owner reset clears progress but keeps the paid record.) */
'use strict';
const path = require('path');
const CAT = require(path.join(__dirname, '..', 'public', 'js', 'season-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const EARN_ADD = { season: { amt: 10, cap: 14, label: 'Seasonal event' } };
let ctx, D, E;

const keyOf = c => { if (!c || !c.member) return null; const k = String(c.member).toLowerCase(); return BADKEY.test(k) || !own(ctx.state.members, k) ? null : k; };
const isOwner = k => k === 'jack' && own(ctx.state.members, 'jack');
const loopOf = () => +E.uk().day.slice(0, 4); // one real year of play = one 1999 loop
// the account's 1999 "today": the owner's clock override, else the UK day and hour
function today(k) {
  const clock = isOwner(k) ? ctx.state.mods.owner?.clock : null;
  if (clock && typeof clock.date === 'string') return { mm: +clock.date.slice(5, 7), dd: +clock.date.slice(8, 10), hour: clock.hour | 0, owner: true };
  const u = E.uk(); let mm = +u.day.slice(5, 7), dd = +u.day.slice(8, 10); if (mm === 2 && dd === 29) dd = 28;
  return { mm, dd, hour: u.h, owner: false };
}
function phase(k, e) { const t = today(k); return t.owner ? CAT.phaseOf(e, t) : CAT.near(e, t); }
function gate(k, e) { // the tutorial stays clean: seasonal objectives start once chapter 1 is done (veterans always pass)
  const p = ctx.state.mods.story?.p?.[k]; if (!p || p.flags?.veteran) return true;
  return (p.ch | 0) >= (e.needs?.chapter || 1);
}
function S(k, e) {
  const all = D.p[k] && typeof D.p[k] === 'object' ? D.p[k] : (D.p[k] = {});
  const ev = all[e.id] && typeof all[e.id] === 'object' ? all[e.id] : (all[e.id] = {});
  const L = String(loopOf());
  let s = ev[L];
  if (!s || typeof s !== 'object') { s = ev[L] = {}; ctx.markDirty(); }
  for (const f of ['obj', 'paid', 'steps', 'decor']) if (!s[f] || typeof s[f] !== 'object') s[f] = {};
  if (!Array.isArray(s.bowl)) s.bowl = (e.sweets || []).map(() => 0);
  if (!Number.isInteger(s.tin)) s.tin = e.tinPours || 0;
  if (!Number.isInteger(s.porch)) s.porch = 0;
  if (!s.treat || typeof s.treat !== 'object') s.treat = { n: 0, happy: 0, trick: 0, seq: 0, last: 0, g: null };
  return s;
}
function view(k) {
  const t = today(k), out = {};
  for (const e of CAT.EVENTS) {
    if (e.soon) continue;
    const ph = phase(k, e), s = S(k, e), g = s.treat.g;
    if (g && Date.now() - g.at > 240000) { s.treat.g = null; s.treat.trick++; s.treat.n++; ctx.markDirty(); }
    out[e.id] = { phase: ph, open: gate(k, e), obj: s.obj, paid: s.paid, steps: s.steps, carve: s.carve || null, bowl: s.bowl, tin: s.tin, porch: s.porch,
      treat: { n: s.treat.n, happy: s.treat.happy, trick: s.treat.trick, g: s.treat.g }, decor: s.decor };
  }
  return { t: 'seMe', today: { mm: t.mm, dd: t.dd, hour: t.hour, owner: t.owner }, loop: loopOf(), ev: out };
}
const sendMe = (ws, k) => ctx.send(ws, view(k));
function toAll(k, m) { for (const [ws, c] of ctx.clients) if (keyOf(c) === k) ctx.send(ws, m); }

// pay an objective (or its bonus) once per loop; the econ cap still applies
function pay(c, k, e, s, id, amt, note) {
  if (own(s.paid, id)) return 0;
  const a = E.acctByKey(k) || E.acct(c); let got = 0;
  if (a && amt > 0) got = Math.max(0, E.earnA(a, 'season', note, amt));
  s.paid[id] = got; ctx.markDirty();
  return got;
}
function complete(c, k, e, s, oid, by) {
  if (own(s.obj, oid)) return 0;
  const o = e.objById[oid];
  s.obj[oid] = { t: Date.now(), by: by || 'me' }; ctx.markDirty();
  const amt = by === 'mom' ? 0 : pay(c, k, e, s, oid, o.reward, e.name + ': ' + o.text.replace(/\{[^}]+\}/g, 'the'));
  // Mom's good books: the main evening done (bookkeeping only, once per loop)
  const core = ['hw-pumpkin', 'hw-decorate', 'hw-bowl', 'hw-treat'];
  if (e.id === 'halloween99' && core.every(id => own(s.obj, id)) && !s.trust) {
    s.trust = 1; const p = ctx.state.mods.story?.p?.[k]; if (p) p.trust = Math.min(100, (p.trust | 0) + 1);
  }
  return amt;
}

function step(ws, c, k, m) {
  const e = CAT.byId[m.e], o = e?.objById[m.o]; if (!e || !o || !o.steps) return;
  const ph = phase(k, e); if (!ph || !o.phases.includes(ph) || !gate(k, e)) return ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: m.s, ok: false, why: 'off' });
  const s = S(k, e), sid = String(m.s || '');
  if (!o.steps.includes(sid)) return;
  // the porch switch toggles; it ticks the objective the first time it goes on
  if (o.id === 'hw-lights') {
    s.porch = s.porch ? 0 : 1; ctx.markDirty();
    let amt = 0; if (s.porch && !own(s.obj, o.id)) amt = complete(c, k, e, s, o.id, today(k).hour < 17 ? 'me' : 'late');
    ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: true, porch: s.porch, done: own(s.obj, o.id), amt });
    return toAll(k, view(k));
  }
  if (own(s.obj, o.id)) return ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: true, again: 1 });
  const got = s.steps[o.id] && typeof s.steps[o.id] === 'object' ? s.steps[o.id] : (s.steps[o.id] = {});
  if (own(got, sid)) return ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: true, again: 1 });
  if (o.ordered) { const next = o.steps.find(x => !own(got, x)); if (next !== sid) return ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: false, why: 'order' }); }
  const now = Date.now(), last = Math.max(0, ...Object.values(got));
  if (last && now - last < (o.gap || 0.5) * 1000) return ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: false, why: 'quick' });
  if (o.id === 'hw-bowl') {
    if (s.tin <= 0) return ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: false, why: 'tin' });
    s.tin--; s.bowl = s.bowl.map((n, i) => n + (e.fill[i] | 0)); s.bowl[0] = Math.max(0, s.bowl[0] - 1); // (Dad: "checking quality")
  }
  if (o.id === 'hw-pumpkin' && sid === 'face') { const f = String(m.x || ''); if (!['grin', 'surprised', 'cat', 'spooky'].includes(f)) return; s.carve = { face: f, wob: [] }; }
  if (o.id === 'hw-pumpkin' && sid === 'carve') {
    const w = Array.isArray(m.x) ? m.x.slice(0, 8) : [];
    if (!w.every(p => Array.isArray(p) && p.length === 2 && p.every(n => Number.isInteger(n) && n >= -20 && n <= 20))) return;
    s.carve = { face: s.carve?.face || 'grin', wob: w };
  }
  if (o.id === 'hw-decorate') s.decor[sid] = now;
  got[sid] = now; ctx.markDirty();
  let amt = 0, done = false;
  if (o.steps.every(x => own(got, x))) { amt = complete(c, k, e, s, o.id); done = true; }
  ctx.send(ws, { t: 'seStep', e: e.id, o: o.id, s: sid, ok: true, done, amt });
  toAll(k, view(k));
}
// topping the bowl up later (the second pour from the tin) is not an objective step
function topup(ws, c, k, m) {
  const e = CAT.byId[m.e]; if (!e || !e.fill) return;
  const ph = phase(k, e); if (ph !== 'day') return;
  const s = S(k, e); if (!own(s.obj, 'hw-bowl') || s.tin <= 0 || s.bowl.reduce((a, b) => a + b, 0) > 16) return ctx.send(ws, { t: 'seTop', e: e.id, ok: false });
  s.tin--; s.bowl = s.bowl.map((n, i) => n + (e.fill[i] | 0)); ctx.markDirty();
  ctx.send(ws, { t: 'seTop', e: e.id, ok: true }); toAll(k, view(k));
}

const KIDN = 24;
function makeGroup(e, s) {
  const seq = ++s.treat.seq, r = () => Math.random(), pick = a => a[Math.floor(r() * a.length)];
  const n = Math.min(5, 2 + Math.floor(r() * (seq > 4 ? 4 : 3)));
  const used = new Set(), kids = [];
  for (let i = 0; i < n; i++) { let id; do id = Math.floor(r() * KIDN); while (used.has(id)); used.add(id); kids.push({ k: id, c: pick(e.costumes), want: 1, avoid: null }); }
  const kind = pick(['plain', 'plain', 'two', 'nuts', 'choc', 'nuts']);
  if (kind === 'two') kids[kids.length - 1].want = 2;
  if (kind === 'nuts') kids[Math.floor(r() * n)].avoid = 'nuts';
  if (kind === 'choc') kids[Math.floor(r() * n)].avoid = 'choc';
  return { id: seq, kind, kids, at: Date.now(), wrong: r() < .25 };
}
function knock(ws, c, k, m) {
  const e = CAT.byId[m.e]; if (!e || !e.treatHours) return;
  const t = today(k), ph = phase(k, e), s = S(k, e);
  const hour = t.owner ? t.hour : Math.max(0, Math.min(23, m.h | 0));
  const why = !gate(k, e) ? 'gate' : ph !== 'day' ? 'phase' : hour < e.treatHours[0] || hour >= e.treatHours[1] ? 'hour' : s.treat.n >= e.maxGroups ? 'done' : s.treat.g ? 'waiting' : null;
  if (why) return ctx.send(ws, { t: 'seKnock', e: e.id, wait: why, g: s.treat.g });
  // Mom's rule: no light, no knocks. From five o'clock Mom puts it on herself if nobody has.
  if (!s.porch) { if (hour >= 17) { s.porch = 2; if (!own(s.obj, 'hw-lights')) complete(c, k, e, s, 'hw-lights', 'mom'); ctx.markDirty(); toAll(k, view(k)); } else return ctx.send(ws, { t: 'seKnock', e: e.id, wait: 'porch' }); }
  const gap = isOwner(k) ? 8000 : 25000;
  if (Date.now() - (s.treat.last || 0) < gap) return ctx.send(ws, { t: 'seKnock', e: e.id, wait: 'soon', in: gap - (Date.now() - s.treat.last) });
  s.treat.g = makeGroup(e, s); s.treat.last = Date.now(); ctx.markDirty();
  toAll(k, { t: 'seGroup', e: e.id, g: s.treat.g });
}
function treat(ws, c, k, m) {
  const e = CAT.byId[m.e]; if (!e || !e.sweets) return;
  const s = S(k, e), g = s.treat.g; if (!g || g.id !== (m.g | 0)) return ctx.send(ws, { t: 'seTreat', e: e.id, g: m.g | 0, ok: false, why: 'gone' });
  const give = Array.isArray(m.give) ? m.give.slice(0, 16) : [];
  const per = g.kids.map(() => []), need = e.sweets.map(() => 0);
  for (const it of give) {
    if (!Array.isArray(it) || !Number.isInteger(it[0]) || it[0] < 0 || it[0] >= g.kids.length) return;
    const si = e.sweets.findIndex(x => x.id === it[1]); if (si < 0) return;
    const kid = g.kids[it[0]], sw = e.sweets[si];
    if (kid.avoid === 'nuts' && sw.nuts || kid.avoid === 'choc' && sw.choc) return ctx.send(ws, { t: 'seTreat', e: e.id, g: g.id, ok: false, why: 'avoid' });
    per[it[0]].push(si); need[si]++;
  }
  if (need.some((n, i) => n > (s.bowl[i] | 0))) return ctx.send(ws, { t: 'seTreat', e: e.id, g: g.id, ok: false, why: 'stock' });
  const happy = give.length > 0 && g.kids.every((kid, i) => per[i].length === kid.want);
  if (give.length && !happy) return ctx.send(ws, { t: 'seTreat', e: e.id, g: g.id, ok: false, why: 'count' });
  s.bowl = s.bowl.map((n, i) => n - need[i]);
  s.treat.g = null; s.treat.n++; if (happy) s.treat.happy++; else s.treat.trick++;
  ctx.markDirty();
  const o = e.objById['hw-treat']; let amt = 0, done = false;
  if (happy && s.treat.happy >= o.count && !own(s.obj, o.id)) { amt += complete(c, k, e, s, o.id); done = true; }
  if (happy && s.treat.happy >= o.bonus.at) amt += pay(c, k, e, s, o.id + ':bonus', o.bonus.amt, e.name + ': ' + o.bonus.at + ' happy trick-or-treaters');
  ctx.send(ws, { t: 'seTreat', e: e.id, g: g.id, ok: true, happy, n: s.treat.n, h: s.treat.happy, done, amt });
  toAll(k, view(k));
}

// owner tools: start the event again (progress only; the paid record stays, so rewards are never paid twice)
function ownerReset(eventId) {
  const e = CAT.byId[eventId]; if (!e) throw Error('Choose an event.');
  const s = S('jack', e), paid = s.paid, trust = s.trust;
  const L = String(loopOf()); D.p.jack[e.id][L] = { paid, trust }; S('jack', e); ctx.markDirty();
  toAll('jack', view('jack'));
}

function handle(ws, c, m) {
  if (!c.seRl) c.seRl = new ctx.Bucket(4, 16);
  if (!c.seRl.take()) return;
  const k = keyOf(c); if (!k) return ctx.send(ws, { t: 'seMe', guest: true, ev: {} });
  if (m.t === 'seMe') return sendMe(ws, k);
  if (m.t === 'seStep') return step(ws, c, k, m);
  if (m.t === 'seTop') return topup(ws, c, k, m);
  if (m.t === 'seKnock') return knock(ws, c, k, m);
  if (m.t === 'seTreat') return treat(ws, c, k, m);
}

module.exports = {
  name: 'season', types: ['seMe', 'seStep', 'seTop', 'seKnock', 'seTreat'],
  init(x) {
    ctx = x; D = x.data; D.v = D.v || 1; if (!D.p || typeof D.p !== 'object') D.p = {};
    E = ECON.api;
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    x.on('login', cc => { const k = keyOf(cc); if (k) for (const [ws, cl] of ctx.clients) if (cl === cc) sendMe(ws, k); });
  },
  handle, ownerReset, ownerClock() { toAll('jack', view('jack')); },
  _test: { get D() { return D; }, view, today, S },
};
