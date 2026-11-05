// The family's line memory (js/np-life.js): least recently heard first, kept per account across a refresh.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../app/public/js/np-life.js'), 'utf8');
const start = src.indexOf('  let heard = null'), end = src.indexOf('return tier[Math.floor(Math.random() * tier.length)];', start);
assert(start > 0 && end > start, 'line memory block found');
const block = src.slice(start, src.indexOf('}', end) + 1);
function world(store, nick, clock) {
  const w = { store, Date: { now: () => clock.t }, Math, Object, JSON, setTimeout: undefined, clearTimeout: undefined };
  w.ls = { get: k => (k in store ? JSON.parse(store[k]) : null), set: (k, v) => { store[k] = JSON.stringify(v); } };
  w.member = () => nick;
  vm.createContext(w); vm.runInContext(block + '\nthis.api={hear,heardAt,freshest};', w);
  return w.api;
}
const store = {}, clock = { t: 1e12 }, ids = ['a', 'b', 'c', 'd', 'e'];
let api = world(store, 'sarah', clock);
const seen = [];
for (let i = 0; i < 5; i++) { const id = api.freshest(ids, x => x, seen.at(-1)); seen.push(id); api.hear(id); clock.t += 60000; }
assert.equal(new Set(seen).size, 5, 'all five lines before any repeat: ' + seen);
assert.equal(api.freshest(ids), seen[0], 'the sixth is the one heard longest ago');
api = world(store, 'sarah', clock);
assert.equal(api.freshest(ids), seen[0], 'a refresh keeps the memory');
assert.equal(world(store, 'other', clock).heardAt(seen[4]), 0, 'each account has its own memory');
for (let i = 0; i < 700; i++) api.hear('x' + i);
assert(Object.keys(JSON.parse(store['np.heard.sarah'])).length <= 600, 'memory stays bounded');
console.log('NO-REPEAT UNIT PASS: least recently heard, refresh-safe, per account, bounded');
