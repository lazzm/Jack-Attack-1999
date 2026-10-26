/* Headless CPU UI/protocol regression. No browser/server, external data or real timers. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const number = '19991234567812345678', sender = '19998765432187654321';
const events = {}, sent = [], cache = new Map(), timers = new Map(); let serial = 0, phoneWindow;
const sms = { inbox: [{ id: 'new', from: 'Friend', text: 'new text', ts: 200, read: true }, { id: 'legacy', from: 'Old friend', fromNo: 2, text: 'old text', ts: 100, read: true }], sent: [], blocked: [] };
function element() {
  return { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, listeners: {}, addEventListener(t, cb) { this.listeners[t] = cb; }, appendChild() {}, focus() {}, closest() { return null; }, querySelectorAll() { return []; }, querySelector(s) { if (!this.children) this.children = {}; return this.children[s] ||= element(); }, getContext() { return { createImageData: (w, h) => ({ data: new Uint8Array(w * h * 4) }), putImageData() {} }; } };
}
const sandbox = {
  document: { head: element(), createElement: element },
  Cast: { slug: () => 'crystal', t: s => s },
  Apps: { store: { get(k, fallback) { return cache.get(k) || (k === 'jhp_family_phone' ? { readS: { s0: true }, seen: 101 } : fallback); }, set(k, v) { cache.set(k, v); } }, esc: s => s, secret() {}, win() { return phoneWindow = { el: element(), restore() {}, closed: false }; } },
  Family: { today: () => ({ md: 101, d: 1, m: 1 }), icons: {}, sms: () => sms, saveSms() {} },
  Net: { me: { member: true, nick: 'Alice', no: 1 }, connected: true, send(m) { sent.push(m); return true; }, on(t, cb) { (events[t] ||= []).push(cb); } },
  setInterval: cb => ++serial, clearInterval() {}, setTimeout: (cb, delay) => { const id = ++serial; timers.set(id, { cb, delay }); return id; }, clearTimeout: id => timers.delete(id), Date, Uint8Array, Uint8ClampedArray,
};
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(require.resolve('../app/public/js/family-phone.js'), 'utf8'), sandbox);
const P = sandbox.FamilyPhone;
function emit(t, m) { for (const cb of events[t] || []) cb({ t, ...m }); }
function press(...keys) { for (const k of keys) P.press(k); }
function typed(text) { for (const key of text) phoneWindow.el.listeners.keydown({ key, target: element(), preventDefault() {} }); }
function reset() { sandbox.Net.me.nick = 'Alice'; emit('loginOk', {}); }
function respond() { emit('smsPhone', { ref: sent.at(-1).ref, ok: true, owner: 'alice', number, contacts: [], replies: [{ id: 'new', fromPhone: sender }] }); }
P.open(); assert.equal(sent.at(-1).t, 'smsPhoneGet'); respond();
assert.equal(sms.inbox[0].fromPhone, sender); assert.equal(sms.inbox[1].fromPhone, undefined);
press('sel', 'sel', '5'); assert.equal(P.state().id, 'myNumber');
press('c', '4', 'sel'); assert.equal(P.state().id, 'edit');
typed('My friend'); press('sel'); typed('abc_+' + sender);
assert.equal(P.state().text, sender, 'Manual number entry must accept digits only');
press('sel'); const save = sent.at(-1); assert.equal(save.t, 'smsContactSave'); assert.equal(save.number, sender); assert.equal(save.name, 'My friend');
press('sel'); assert.equal(sent.at(-1), save, 'Repeated Save must wait for the existing request');
const contact = { id: 'contact1', name: 'My friend', number: sender };
emit('smsContactResult', { ref: save.ref, ok: true, owner: 'alice', contacts: [contact] });
press('sel'); // dismiss saved popup
press('down', 'sel', 'down', 'down', 'sel'); // saved contact -> Edit contact
assert.equal(P.state().id, 'edit'); typed('!'); press('sel', 'sel');
const edit = sent.at(-1); assert.equal(edit.t, 'smsContactSave'); assert.equal(edit.id, contact.id); assert.equal(edit.name, 'My friend!');
emit('smsContactResult', { ref: edit.ref, ok: true, owner: 'alice', contacts: [{ ...contact, name: edit.name }] }); press('sel');
press('sel', 'down', 'down', 'down', 'sel', 'down', 'sel');
const del = sent.at(-1); assert.equal(del.t, 'smsContactDelete'); assert.equal(del.id, contact.id);
emit('smsContactResult', { ref: del.ref, ok: true, owner: 'alice', contacts: [] }); press('sel');
reset(); respond();
press('sel', 'sel', '2', 'sel', 'sel', 'sel'); // messages -> inbox -> new -> options -> reply
assert.equal(P.state().id, 'edit'); typed('Hello'); press('sel', 'sel');
assert.equal(sent.at(-1).t, 'smsSend'); assert.equal(sent.at(-1).to, sender);
reset(); respond();
press('sel', 'sel', '2', 'down', 'sel', 'sel', 'sel');
assert.match(P.state().pop, /Old message.*Ask your friend/); assert.equal(sent.at(-1).t, 'smsPhoneGet');
// Cancelling a pending contact edit must not pop whichever screen the player opens next.
reset(); respond(); press('sel', 'sel', '4', 'sel'); typed('Cancel test'); press('sel'); typed(sender); press('sel');
const interrupted = sent.at(-1); press('clearall', 'c');
const depthBefore = P.state().depth;
emit('smsContactResult', { ref: interrupted.ref, ok: true, owner: 'alice', contacts: [contact] });
assert.equal(P.state().depth, depthBefore); press('sel');
reset(); respond();
// Private data clears on account switching and stale responses cannot rebuild it.
const previousRef = sent.at(-1).ref;
sandbox.Net.me.nick = 'Bob'; emit('loginOk', {}); assert.equal(P.state().id, 'idle');
emit('smsPhone', { ref: previousRef, ok: true, owner: 'alice', number, contacts: [contact] });
press('sel', 'sel', '5'); assert.equal(P.state().id, 'myNumber');
assert.equal(events.online, undefined, 'Phone must never subscribe to public presence');
assert(!fs.readFileSync(require.resolve('../app/public/js/family-phone.js'), 'utf8').includes('Enter number/name'));
console.log('PHONE UI CPU PASS: private receipt restoration, My number, numeric manual add/edit/delete, rapid Save, reply by fromPhone, readable legacy inbox, account-switch reset and no presence directory.');
