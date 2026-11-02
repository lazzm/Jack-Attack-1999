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
assert.equal(on(11, 1, 9), 'halloween99:tail');
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

assert.equal(on(11, 6, 9), 'bonfire99:tail');
assert.equal(on(11, 6, 12), 'bonfire99:tail');
assert.equal(on(11, 6, 22), 'bonfire99:tail');
assert.equal(on(11, 6, 23), '');
const B=C.byId.bonfire99; assert.equal(B.objectives.reduce((a,o)=>a+o.reward,0),95); assert(B.pack&&!B.soon);

// Objective hours keep the morning chore and the evening catch-up discoverable without pointing at hidden props.
const vm=require('node:vm'),handlers={};
const browser={SeasonCat:C,OwnerTools:{clock:{date:'1999-11-06',hour:9}},st:{getState:()=>({flags:{veteran:true}})},Net:{on:(id,fn)=>handlers[id]=fn,send(){}},document:{readyState:'complete',querySelector:()=>null},setInterval(){},addEventListener(){},console};browser.window=browser;vm.createContext(browser);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/season.js'),'utf8'),browser);
const eventState={open:true,obj:{},steps:{},display:'friday'};handlers.seMe({ev:{bonfire99:eventState}});
const visible=()=>Array.from(browser.Season.objectives(),x=>x.o.id);
assert(visible().includes('bf-clean'));assert(!visible().includes('bf-light'));
browser.OwnerTools.clock.hour=12;assert(!visible().includes('bf-clean'));assert(!visible().includes('bf-light'));
browser.OwnerTools.clock.hour=19;assert(visible().includes('bf-light'));assert(!visible().includes('bf-clean'));
browser.OwnerTools.clock.hour=22;assert(!visible().includes('bf-light'));
eventState.display='leftovers';eventState.steps['bf-light']={start:1};assert(visible().includes('bf-light'),'Started leftovers can finish after ten');
browser.OwnerTools.clock.hour=23;assert.equal(visible().length,0);console.log('season objective hours: PASS');
