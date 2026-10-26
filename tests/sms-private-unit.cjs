/* CPU-only; loads the module with an in-memory context and deterministic crypto for collision tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync(require.resolve('../app/mods/sms.js'), 'utf8');
function fixture(data = {}, options = {}) {
  const members = options.members || { alice: { name: 'Alice', no: 1, pass: 'unchanged', rupees: 67 }, bob: { name: 'Bob', no: 2 }, cara: { name: 'Cara', no: 3 }, dormant: { name: 'Dormant', no: 4 } };
  const state = { members, mods: { sms: data, economy: { pence: 123, caps: [7] } }, saves: { untouched: true } };
  const before = JSON.stringify({ members, economy: state.mods.economy, saves: state.saves });
  const packets = [], events = {}, clients = new Map(); let dirty = 0, ticks = 0;
  class Bucket {
    constructor(rate, burst) { this.rate = rate; this.burst = burst; this.t = burst; this.last = ticks; }
    take() { this.t = Math.min(this.burst, this.t + (ticks - this.last) * this.rate / 1000); this.last = ticks; if (this.t < 1) return false; this.t--; return true; }
  }
  const mod = { exports: {} };
  vm.runInNewContext(source, { require: n => n === 'node:crypto' ? options.crypto || crypto : require(n), module: mod, setInterval: () => ({ unref() {} }), Map, Set, Date });
  const ctx = { data, state, clients, Bucket, on: (e, f) => events[e] = f, markDirty: () => dirty++, clean: (v, n) => String(v || '').replace(/[<>\x00-\x1f]/g, '').trim().slice(0, n), delink: v => v, send: (ws, m) => packets.push({ ws, m: JSON.parse(JSON.stringify(m)) }), broadcast: () => assert.fail('Private SMS must not broadcast') };
  mod.exports.init(ctx);
  function client(member, ip = member) { const c = { ready: true, member, nick: member, ip }, ws = {}; clients.set(ws, c); return { c, ws }; }
  const a = client('Alice'), b = client('Bob'), outsider = client('Cara'), guest = client('');
  function send(who, msg) { mod.exports.handle(who.ws, who.c, msg); return packets.filter(p => p.ws === who.ws).at(-1)?.m; }
  function get(who) { return send(who, { t: 'smsPhoneGet', ref: 'p' }); }
  return { data, state, packets, events, clients, a, b, outsider, guest, send, get, client, get dirty() { return dirty; }, advance() { ticks += 60000; }, preserved() { assert.equal(JSON.stringify({ members, economy: state.mods.economy, saves: state.saves }), before); } };
}
const legacy = { id: 'old-id', from: 'Alice', fromNo: 1, text: 'old message', ts: 123 };
const f = fixture({ box: { bob: [legacy] } });
assert.equal(f.dirty, 0); assert.equal(f.data.numbers, undefined);
f.events.hello(f.b.ws, f.b.c); assert.deepEqual(f.packets.at(-1).m.item, legacy); assert.equal(f.dirty, 0);
f.events.login(f.a.c); assert.equal(f.data.numbers, undefined);
f.send(f.guest, { t: 'smsPhoneGet' }); f.send(f.guest, { t: 'smsContactSave', name: 'Someone', number: '19990000000000000000' });
assert.equal(f.data.numbers, undefined); assert.equal(f.data.contacts, undefined);
const alice = f.get(f.a); assert.match(alice.number, /^1999\d{16}$/); assert.equal(f.dirty, 1); assert.deepEqual(Object.keys(f.data.numbers), ['alice']);
assert.equal(f.get(f.a).number, alice.number); assert.equal(f.dirty, 1);
const bob = f.get(f.b); assert.notEqual(bob.number, alice.number); assert.equal(f.dirty, 2);
assert(!f.packets.some(p => p.ws === f.outsider.ws)); assert(!f.data.numbers.dormant);
let save = f.send(f.a, { t: 'smsContactSave', name: 'My mate', number: bob.number });
assert(save.ok); const contact = save.contacts[0]; assert.equal(contact.name, 'My mate');
const d = f.dirty; f.send(f.a, { t: 'smsContactSave', ...contact }); assert.equal(f.dirty, d, 'No-op contact edit must not write');
assert.deepEqual(f.get(f.b).contacts, []);
f.advance();
// A syntactically valid but unallocated number can be saved: phonebook edits are never a lookup oracle.
assert(f.send(f.a, { t: 'smsContactSave', name: 'Unverified', number: '19999999999999999999' }).ok);
assert.equal(f.data.numbers.dormant, undefined);
assert.equal(f.send(f.a, { t: 'smsContactDelete', id: 'not-mine' }).ok, false);
f.advance();
let failure;
for (const to of ['Bob', 'bob', '2', 2, '', '19999999999999999999', alice.number]) {
  f.advance(); const result = f.send(f.a, { t: 'smsSend', to, text: 'hello', ref: 'try' });
  assert.equal(result.ok, false); failure ||= result.err; assert.equal(result.err, failure);
  assert(!('to' in result)); assert(!('number' in result));
}
const beforeSend = f.dirty;
f.advance(); const sent = f.send(f.a, { t: 'smsSend', to: bob.number, text: 'hello', ref: 'ok' });
assert(sent.ok); assert.equal(sent.to, bob.number); assert.equal(f.dirty, beforeSend + 1);
const newPacket = f.packets.filter(p => p.ws === f.b.ws && p.m.t === 'smsNew').at(-1).m.item;
assert.equal(newPacket.fromPhone, alice.number); assert(!('fromNo' in newPacket)); assert.equal(f.data.box.bob[0], legacy);
assert.deepEqual(f.get(f.b).replies, [{ id: sent.id, fromPhone: alice.number }]);
const reports = () => f.packets.filter(p => p.m.t === 'smsDelivered');
f.send(f.outsider, { t: 'smsAck', ids: [sent.id] }); assert.equal(reports().length, 0); assert.equal(f.data.box.bob.length, 2);
f.send(f.b, { t: 'smsAck', ids: [sent.id] }); assert.equal(reports().length, 1); assert.equal(f.data.box.bob.length, 1);
f.send(f.b, { t: 'smsAck', ids: [sent.id] }); assert.equal(reports().length, 1);
// Old inbox remains intact through restart and offline delivery.
const restarted = fixture(JSON.parse(JSON.stringify(f.data)));
assert.equal(restarted.get(restarted.a).number, alice.number); assert.equal(restarted.dirty, 0);
restarted.clients.delete(restarted.b.ws); restarted.advance();
assert.equal(restarted.send(restarted.a, { t: 'smsSend', to: bob.number, text: 'offline' }).queued, true);
const bobBack = restarted.client('Bob'); restarted.events.hello(bobBack.ws, bobBack.c);
assert(restarted.packets.some(p => p.ws === bobBack.ws && p.m.item?.id === 'old-id'));
assert(restarted.packets.some(p => p.ws === bobBack.ws && p.m.item?.text === 'offline'));
// Limits persist across same-account reconnects, with generic send errors.
const limited = fixture(); limited.get(limited.b);
for (let i = 0; i < 3; i++) limited.send(limited.a, { t: 'smsSend', to: 'Bob', text: 'no' });
const again = limited.client('Alice', 'new-address');
assert.equal(limited.send(again, { t: 'smsSend', to: limited.data.numbers.bob, text: 'no' }).err, failure);
assert.equal(limited.data.numbers.alice, undefined);
// Force one collision, then allocate a different number without touching the first.
let ints = [0, 0, 1, 2];
const collision = fixture({ numbers: { bob: '19990000000000000000' } }, { crypto: { ...crypto, randomInt: () => ints.shift() } });
assert.equal(collision.get(collision.a).number, '19990000000100000002'); assert.equal(collision.data.numbers.bob, '19990000000000000000');
const exhausted = fixture({ numbers: { bob: '19990000000000000000' } }, { crypto: { ...crypto, randomInt: () => 0 } });
assert.equal(exhausted.get(exhausted.a).ok, false); assert.equal(exhausted.dirty, 0); assert(!exhausted.data.numbers.alice);
// Full queues retain every existing message, without silent eviction.
const full = fixture({ numbers: { alice: alice.number, bob: bob.number }, box: { bob: Array.from({ length: 20 }, (_, i) => ({ id: 'old' + i })) } });
assert.equal(full.send(full.a, { t: 'smsSend', to: bob.number, text: 'full' }).ok, false); assert.equal(full.data.box.bob.length, 20); assert.equal(full.dirty, 0);
// Editing or deleting somebody else's contact id is impossible.
f.advance(); assert.equal(f.send(f.b, { t: 'smsContactSave', ...contact, name: 'Stolen' }).ok, false);
f.advance(); assert(f.send(f.a, { t: 'smsContactSave', ...contact, name: 'Renamed' }).ok);
f.advance(); assert(f.send(f.a, { t: 'smsContactDelete', id: contact.id }).ok);
assert(!f.get(f.a).contacts.some(x => x.id === contact.id));
// A recycled sender socket cannot receive reports after changing account.
const switched = fixture({ numbers: { alice: alice.number, bob: bob.number } });
const sw = switched.send(switched.a, { t: 'smsSend', to: bob.number, text: 'switch' });
switched.a.c.member = 'Cara'; switched.send(switched.b, { t: 'smsAck', ids: [sw.id] });
assert(!switched.packets.some(p => p.m.t === 'smsDelivered'));
// Contact cap and receipt history stay bounded, with no changes to other accounts.
const manyContacts = fixture({ contacts: { alice: Array.from({ length: 50 }, (_, i) => ({ id: 'c' + i, name: 'Friend', number: '1999' + String(i).padStart(16, '0') })) } });
assert.equal(manyContacts.send(manyContacts.a, { t: 'smsContactSave', name: 'Extra', number: bob.number }).ok, false); assert.equal(manyContacts.dirty, 0);
const receipts = fixture({ numbers: { alice: alice.number, bob: bob.number }, replies: { bob: Array.from({ length: 60 }, (_, i) => ({ id: 'r' + i, fromPhone: alice.number })) } });
assert(receipts.send(receipts.a, { t: 'smsSend', to: bob.number, text: 'bounded' }).ok); assert.equal(receipts.data.replies.bob.length, 60); assert.equal(receipts.data.replies.bob[0].id, 'r1');
f.preserved(); restarted.preserved(); collision.preserved();
console.log('SMS PRIVATE CPU PASS: lazy additive writes, stable crypto numbers/collisions, authentication, no name/member/online discovery, private contacts/replies, generic failures, reconnect limits, legacy/offline preservation and recipient-bound ACKs.');
