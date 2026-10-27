// Seasonal event catalogue: windows agree with the PC's seasons (js/seasons.js), phases, daylight and server rules.
// node tests/season-cat-unit.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const C = require('../app/public/js/season-cat.js');
const src = fs.readFileSync(path.join(__dirname, '../app/public/js/seasons.js'), 'utf8');
const block = /const SEASONS = \[([\s\S]*?)\];/.exec(src)[1];
const SEASONS = [...block.matchAll(/\['(\w+)', (\d+), (\d+), (\d+), (\d+)\]/g)].map(m => [m[1], +m[2], +m[3], +m[4], +m[5]]);
const mmdd = n => String(Math.floor(n / 100)).padStart(2, '0') + '-' + String(n % 100).padStart(2, '0');
for (const e of C.EVENTS) {
  const w = SEASONS.find(s => s[0] === e.web); assert(w, e.id + ' has a PC season');
  assert.equal(e.from, mmdd(w[1]), e.id + ' from'); assert.equal(e.to, mmdd(w[2]), e.id + ' to'); assert.equal(e.peak, mmdd(w[3]), e.id + ' peak');
  assert.equal(e.phases[0].from, e.from, e.id + ' first phase');
}
const on = (mm, dd, hour) => C.active({ mm, dd, hour }).map(x => x.e.id + ':' + x.phase).join(',');
assert.equal(on(10, 10, 14), '');
assert.equal(on(10, 24, 9), 'halloween99:lead');
assert.equal(on(10, 31, 18), 'halloween99:day');
assert.equal(on(11, 1, 9), 'halloween99:tail,bonfire99:lead');
assert.equal(on(11, 1, 12), 'bonfire99:lead'); // Halloween decor goes at noon on 1 Nov
assert.equal(on(11, 2, 14), 'bonfire99:lead');
assert.equal(C.near(C.byId.halloween99, { mm: 10, dd: 23, hour: 23 }), 'lead', 'a day either side for time zones');
const s = C.sun(10, 31), b = C.sun(10, 30);
assert(s.set > 16.4 && s.set < 16.8 && !s.bst, 'sunset about 16:35 GMT on 31 Oct');
assert(b.set > 17.4 && b.set < 17.8 && b.bst, 'about 17:37 BST the day before');
assert(C.sun(6, 21).set > 21 && C.sun(12, 21).set < 16.2, 'midsummer and midwinter');
const H = C.byId.halloween99;
assert.deepEqual(H.objectives.map(o => o.id), ['hw-pumpkin', 'hw-decorate', 'hw-lights', 'hw-bowl', 'hw-treat', 'hw-clean']);
assert(H.objectives.reduce((a, o) => a + o.reward, 0) + H.objById['hw-treat'].bonus.amt <= 100, 'event rewards stay within 100 Rupees');
assert.equal(H.fill.reduce((a, b) => a + b, 0) * H.tinPours >= H.maxGroups * 3, true, 'enough sweets for the night');
console.log('season-cat-unit: PASS');
