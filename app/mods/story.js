/* Additive, account-owned story progress. Physical observations never mint currency.
 * Existing chore/job rewards stay entirely in their original capped server paths. */
'use strict';
const CAT = require('../public/js/st-cat.js');
let ctx, D;
const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const limits = new Map();
function keyOf(c) {
  if (typeof c?.member !== 'string') return null;
  const k = c.member.toLowerCase();
  return !/^(?:__proto__|constructor|prototype)$/.test(k) && own(ctx.state.members, k) ? k : null;
}
function player(k) {
  if (!own(D.p, k)) {
    const veteran = ctx.state.members[k].starterSparse !== 1;
    D.p[k] = { ch: veteran ? 6 : 1, done: {}, flags: veteran ? { veteran: true } : {}, trust: 0, v: CAT.version };
    if (veteran) for (const s of CAT.steps) D.p[k].done[s.id] = Date.now();
    if (!veteran && ctx.state.members[k].storyOpening !== 2) D.p[k].v = 1;
    ctx.markDirty();
  }
  const p = D.p[k];
  // Every pre-opening account had a working PC, even if it never read the diary.
  // Adopt it permanently; only newly registered v2 players do the physical chain.
  if (p.v < 2) {
    p.flags.pcOwned = true;
    for (const s of CAT.steps.filter(s => s.ch === 1 && /^(dad|boot|part\.|lead\.|power|install)/.test(s.id))) p.done[s.id] ||= Date.now();
    p.v = CAT.version; ctx.markDirty();
  }
  if (p.flags.veteran || p.done.power) p.flags.pcOwned = true;
  return p;
}
function hardware(k) {
  return (ctx.state.mods.pmx?.p?.[k]?.o || []).filter(o => /^hardware\.(n64|ps|md|dc)$/.test(o.id));
}
function verified(k, p, s) {
  const mods = ctx.state.mods;
  // Talking to someone is a flag the client sets; real progress past it (a later step done, or its chore
  // already counted by the server) also counts, so nobody is ever stuck behind a conversation.
  if (s.test.startsWith('talk.')) {
    if (p.flags[s.id] === true) return true;
    const later = CAT.steps.slice(CAT.steps.indexOf(s) + 1).filter(x => x.ch === s.ch);
    return later.some(x => own(p.done, x.id) || x.test.startsWith('chore.') && verified(k, p, x));
  }
  if (s.test.startsWith('chore.')) {
    const id = s.test.slice(6), ch = mods.ch?.p?.[k];
    return !!(ch?.n?.[id] > 0 || ch?.done?.[id] && !ch.done[id].bad && ch.done[id].sc > 0);
  }
  if (s.test === 'money.console') {
    const a = mods.econ?.acct?.[k];
    return hardware(k).length > 0 || (a?.bal || 0) + Math.floor((a?.wallet?.pence || 0) / 5) >= 360;
  }
  if (s.test === 'order.console') return hardware(k).length > 0;
  if (s.test === 'phone.mate') {
    return p.flags.mate === true || (mods.sms?.contacts?.[k] || []).length > 0;
  }
  if (['parcel.console', 'carry.console', 'connect.console', 'play.console'].includes(s.test) && !hardware(k).length) return false;
  return p.flags[s.id] === true;
}
function advance(k, p) {
  if (p.flags.veteran || k==='jack' && p.flags.ownerChapter===p.ch) return [];
  const completed = [];
  for (const s of CAT.steps) {
    if (own(p.done, s.id)) continue;
    if (!verified(k, p, s)) break;
    p.done[s.id] = Date.now(); completed.push(s.id);
    // Mom's good books: bookkeeping only, once per story chore, no economic payout.
    if (s.test.startsWith('chore.')) p.trust = Math.min(100, p.trust + 1);
  }
  const ch = CAT.current(p)?.ch || 3;
  if (ch !== p.ch || completed.length) { p.ch = ch; ctx.markDirty(); }
  return completed;
}
function view(k) {
  const p = player(k);
  return { t: 'stState', ch: p.ch, done: { ...p.done }, flags: { ...p.flags }, trust: p.trust, v: p.v };
}
function publish(k, completed = []) {
  const m = { ...view(k), completed };
  for (const [ws, c] of ctx.clients) if (keyOf(c) === k) ctx.send(ws, m);
}
function sync(c) {
  const k = keyOf(c); if (!k) return;
  const p = player(k); advance(k, p); publish(k);
}
module.exports = {
  name: 'story', types: ['stEvent'],
  init(x) {
    ctx = x; D = x.data; limits.clear();
    if (!D.p) D.p = {}; if (!D.v) D.v = CAT.version;
    x.on('hello', (_ws, c) => sync(c));
    // starter.js sorts before story.js, so registration has its sparse marker here.
    x.on('login', c => sync(c));
    x.on('story-phone', c => {
      const k = keyOf(c); if (!k) return;
      const p = player(k); if (p.flags.veteran || p.ch !== 2 || p.flags.mate) return;
      p.flags.mate = true; ctx.markDirty(); publish(k, advance(k, p));
    });
  },
  handle(ws, c, m) {
    const k = keyOf(c); if (!k) return;
    let b = limits.get(k);
    if (!b || Date.now() - b.last > 600000) {
      b = new ctx.Bucket(2, 12); limits.set(k, b);
      for (const [id, bucket] of limits) if (Date.now() - bucket.last > 600000) limits.delete(id);
    }
    if (!b.take()) return;
    const p = player(k);
    if (p.flags.veteran) return ctx.send(ws, view(k));
    if (m.id === 'sync') { const completed = advance(k, p); publish(k, completed); return; }
    if (typeof m.id !== 'string' || !own(CAT.byId, m.id)) return;
    const s = CAT.byId[m.id];
    if (own(p.done, s.id)) return ctx.send(ws, view(k));
    // A future chapter cannot be skipped by forged observations. Within a chapter,
    // remember real actions done early (e.g. the bin bag already went downstairs).
    if (s.ch > p.ch) return;
    // Physical assembly is ordered and permanent. Replays cannot remove a part,
    // connect a future lead, or turn a collection of flags into money.
    if ((s.test.startsWith('physical.') || ['dad', 'pc'].includes(s.id)) && CAT.current(p)?.id !== s.id) return;
    if (!s.test.startsWith('chore.') && !['money.console', 'order.console', 'phone.mate'].includes(s.test)) {
      if (['parcel.console', 'carry.console', 'connect.console', 'play.console'].includes(s.test) && !hardware(k).length) return;
      if (!p.flags[s.id]) { p.flags[s.id] = true; ctx.markDirty(); }
    }
    const completed = advance(k, p);
    if (p.done.power) p.flags.pcOwned = true;
    publish(k, completed);
  },
};
