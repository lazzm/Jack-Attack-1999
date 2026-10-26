/* Private JackNet Mobile numbers. These twenty digits work only inside this game.
 * smsPhoneGet -> smsPhone { number, contacts, replies } on the authenticated socket only.
 * smsContactSave/Delete edit that account's manual phonebook; they never look up a member.
 * smsSend accepts only a shared private number. Legacy queued messages are delivered unchanged.
 * numbers, contacts and reply receipts are additive maps under state.mods.sms; no startup migration. */
const crypto = require('node:crypto');
const MAXLEN = 160, PER_BOX = 20, CONTACTS = 50, RECEIPTS = 60;
const PHONE = /^1999\d{16}$/;
const UNAVAILABLE = 'Message unavailable. Check the shared number or try again later.';
let ctx;
const pending = new Map();
const limits = new Map();
const put = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: true, writable: true, configurable: true });
const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const account = c => c && c.ready && typeof c.member === 'string' && own(ctx.state.members, c.member.toLowerCase()) ? c.member.toLowerCase() : null;
const online = key => [...ctx.clients].filter(([, c]) => account(c) === key);
const contacts = key => own(ctx.data.contacts, key) ? ctx.data.contacts[key] : [];
function allowance(c, key, kind) {
  const rate = kind === 'send' ? 1 / 8 : 2, burst = kind === 'send' ? 3 : 12;
  // Shared by all tabs/reconnects of both the account and its address.
  let ok = true;
  for (const id of [kind + ':member:' + key, kind + ':ip:' + c.ip]) {
    let b = limits.get(id); if (!b) { b = new ctx.Bucket(rate, burst); limits.set(id, b); }
    if (!b.take()) ok = false;
  }
  return ok;
}
function numberFor(key) {
  if (own(ctx.data.numbers, key)) return PHONE.test(ctx.data.numbers[key]) ? ctx.data.numbers[key] : null;
  const used = new Set(Object.values(ctx.data.numbers || {}));
  for (let i = 0; i < 32; i++) {
    const number = '1999' + crypto.randomInt(100000000).toString().padStart(8, '0') + crypto.randomInt(100000000).toString().padStart(8, '0');
    if (used.has(number)) continue;
    if (!ctx.data.numbers) ctx.data.numbers = {};
    put(ctx.data.numbers, key, number);
    ctx.markDirty();
    return number;
  }
  return null; // Fail closed if randomness repeatedly collides; never replace a saved number.
}
function privatePhone(ws, key, ref) {
  const number = numberFor(key);
  if (!number) return ctx.send(ws, { t: 'smsPhone', ref, ok: false, err: 'Network busy. Try again later.' });
  ctx.send(ws, { t: 'smsPhone', ref, ok: true, owner: key, number, contacts: contacts(key), replies: own(ctx.data.replies, key) ? ctx.data.replies[key] : [] });
}
function pushBox(ws, c) {
  const key = account(c); if (!key) return;
  const b = own(ctx.data.box, key) ? ctx.data.box[key] : [];
  for (const item of b) ctx.send(ws, { t: 'smsNew', item });
}
function report(id, key) {
  const p = pending.get(id); if (!p || p.recipient !== key) return;
  pending.delete(id);
  // An account switch on the original socket must not receive the old sender's report.
  for (const [ws] of online(p.sender)) ctx.send(ws, { t: 'smsDelivered', id, to: p.to });
}
module.exports = {
  name: 'sms',
  types: ['smsSend', 'smsAck', 'smsPhoneGet', 'smsContactSave', 'smsContactDelete'],
  init(c) {
    ctx = c;
    ctx.on('hello', pushBox);
    ctx.on('login', cl => { for (const [ws, x] of ctx.clients) if (x === cl) pushBox(ws, cl); });
    setInterval(() => {
      const now = Date.now();
      for (const [id, p] of pending) if (now - p.ts > 3 * 3600000) pending.delete(id);
      for (const [id, b] of limits) if (now - b.last > 600000) limits.delete(id);
    }, 300000).unref();
  },
  handle(ws, c, m) {
    const key = account(c), ref = String(m.ref || '').slice(0, 40);
    if (!key) return;
    if (m.t === 'smsAck') {
      const ids = (Array.isArray(m.ids) ? m.ids : []).slice(0, 40).filter(x => typeof x === 'string');
      const b = own(ctx.data.box, key) ? ctx.data.box[key] : [];
      const removed = b.filter(x => ids.includes(x.id));
      if (removed.length) {
        const keep = b.filter(x => !ids.includes(x.id));
        if (keep.length) put(ctx.data.box, key, keep); else delete ctx.data.box[key];
        ctx.markDirty();
        for (const item of removed) report(item.id, key);
      }
      return;
    }
    if (['smsPhoneGet', 'smsContactSave', 'smsContactDelete'].includes(m.t)) {
      const fail = err => ctx.send(ws, { t: m.t === 'smsPhoneGet' ? 'smsPhone' : 'smsContactResult', ref, ok: false, err });
      if (!allowance(c, key, 'phone')) return fail('Network busy. Try again later.');
      if (m.t === 'smsPhoneGet') return privatePhone(ws, key, ref);
      const old = contacts(key), id = typeof m.id === 'string' ? m.id : '', index = old.findIndex(x => x.id === id);
      let next;
      if (m.t === 'smsContactDelete') {
        if (index < 0) return fail('Contact unavailable.');
        next = old.filter(x => x.id !== id);
      } else {
        const name = ctx.clean(m.name, 22), number = typeof m.number === 'string' ? m.number.trim() : '';
        if (!name || !PHONE.test(number) || (id && index < 0)) return fail('Enter a name and a 20-digit JackNet number.');
        if (old.some(x => x.number === number && x.id !== id)) return fail('That number is already in your phonebook.');
        if (index < 0 && old.length >= CONTACTS) return fail('Phonebook full (50 contacts).');
        const entry = { id: id || crypto.randomBytes(12).toString('hex'), name, number };
        if (index >= 0 && old[index].name === name && old[index].number === number) return ctx.send(ws, { t: 'smsContactResult', ref, ok: true, contacts: old, owner: key });
        next = old.slice(); if (index < 0) next.push(entry); else next[index] = entry;
      }
      if (!ctx.data.contacts) ctx.data.contacts = {};
      put(ctx.data.contacts, key, next);
      ctx.markDirty();
      return ctx.send(ws, { t: 'smsContactResult', ref, ok: true, contacts: next, owner: key });
    }
    if (m.t !== 'smsSend') return;
    const fail = () => ctx.send(ws, { t: 'smsSent', ref, ok: false, err: UNAVAILABLE });
    if (!allowance(c, key, 'send')) return fail();
    const text = ctx.delink(ctx.clean(m.text, MAXLEN));
    const raw = typeof m.to === 'string' ? m.to.trim() : '';
    if (!text || !PHONE.test(raw)) return fail();
    const numbers = ctx.data.numbers || {};
    const target = Object.keys(numbers).find(k => numbers[k] === raw && own(ctx.state.members, k));
    if (!target || target === key) return fail();
    const fromPhone = numberFor(key); if (!fromPhone) return fail();
    const item = { id: crypto.randomBytes(16).toString('hex'), from: ctx.state.members[key].name, fromPhone, text, ts: Date.now() };
    if (!ctx.data.box) ctx.data.box = {};
    const b = own(ctx.data.box, target) ? ctx.data.box[target] : (put(ctx.data.box, target, []), ctx.data.box[target]);
    // Keep all queued messages: a full inbox fails instead of discarding an older SMS.
    if (b.length >= PER_BOX) return fail();
    b.push(item);
    // family.js predates private numbers and strips unknown fields from its local inbox.
    // Keep bounded private reply receipts so opening the lazy phone can restore fromPhone.
    if (!ctx.data.replies) ctx.data.replies = {};
    const receipts = own(ctx.data.replies, target) ? ctx.data.replies[target] : [];
    put(ctx.data.replies, target, receipts.concat({ id: item.id, fromPhone }).slice(-RECEIPTS));
    ctx.markDirty();
    const targets = online(target);
    pending.set(item.id, { sender: key, recipient: target, to: raw, ts: Date.now() });
    for (const [w] of targets) ctx.send(w, { t: 'smsNew', item });
    ctx.send(ws, { t: 'smsSent', ref, ok: true, to: raw, id: item.id, queued: !targets.length });
  },
};
