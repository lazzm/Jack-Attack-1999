'use strict';
// Run the production dialogue and entrance code with a controlled clock, including a reload.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../app/public/js/np-life.js'), 'utf8');
const store = new Map();
function load(member = 'LoopTester') {
  let time = 100000, step = 'lead.power';
  const Empty = class {};
  const H = { ok: true, live: false, FRONT:{FZ:1400,CAR:{x:500,z:1075}}, T: { Frustum: Empty, Matrix4: Empty, Sphere: Empty, Vector3: Empty }, W: { x: 100, z: 190, lvl: 'U' }, DOORS: {}, ROOMS: {} };
  const window = { House: H, NPCRig: {}, NPCNav: {}, Net: { me: { member: true, nick: member } },
    NPCLines: { 'c1.lead.dad': ['Dad', 'Plug the lead in.'], 'bark.dad.react.joke': ['Dad', 'A joke.'] },
    st: { current: () => ({ id: step }) } };
  const ctx = { window, document: { querySelector: () => null }, performance: { now: () => time }, localStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v) }, setTimeout() {}, setInterval() {}, console };
  vm.runInNewContext(source.replace('  boot();', '  window.testLife = { entrance, barks, speech, C, ent, step, stepAside };'), ctx);
  const F = window.HouseFamily, I = window.testLife;
  const dad = I.C.dad; dad.present = true;
  return { F, I, H, N:window.NPCNav, now: n => { time = n; }, step: id => { step = id; } };
}
let f = load();
assert(f.F.say('dad', 'c1.lead.dad', { force: true }));
assert.equal(f.F.say('dad', 'c1.lead.dad', { force: true }), false, 'Do not queue a scene line twice');
f.now(200000);
assert.equal(f.F.say('dad', 'c1.lead.dad', { force: true }), false, 'Scene line stays consumed after cooldown');
f = load();
assert.equal(f.F.say('dad', 'c1.lead.dad', { force: true }), false, 'Scene line stays consumed after reload');
assert(f.F.say('dad', 'c1.lead.dad', { force: true, talk: true }), 'Explicitly requested story help remains available');
f.step('lead.video'); f.now(300000);
assert(f.F.say('dad', 'c1.lead.dad', { force: true }), 'A different step can use its own instruction');
assert(load('OtherTester').F.say('dad', 'c1.lead.dad', { force: true }), 'Dialogue history belongs to the account');
assert(f.F.say('dad', 'bark.dad.react.joke', { force: true }));
assert.equal(f.F.say('dad', 'bark.dad.react.joke', { force: true }), false);
f.now(360001);
assert(f.F.say('dad', 'bark.dad.react.joke', { force: true }), 'Barks return after cooldown');
f.I.entrance('mom', { key: 'test', spot: {} }, { hold: true });
assert(f.F.doorHeld()); f.now(370001);
assert.equal(f.F.doorHeld(), false, 'Soft hold releases by ten real seconds even if no frame advances');
const dad = f.I.C.dad; dad.cur = { k: 'act', t: 0 }; dad.hold = 99;
f.I.speech.q.length = 0; f.I.speech.cur = null;
f.I.step(dad, 0.1, {});
assert(dad.hold < 2, 'A rejected/empty conversation cannot leave the person held indefinitely');
dad.cur = null; dad.plan = []; dad.hold = 99;
f.I.step(dad, 0.1, {});
assert(dad.hold < 2, 'Hold must count down even between planned actions');
f = load('AmbientTester'); f.now(130000);
Object.assign(f.H, { live: true, mode: 'walk', ROOMS: { bedroom: { group: { visible: true } } } });
Object.assign(f.I.C.dad, { x: 120, z: 190, lvl: 'U', room: 'bedroom', cur: { k: 'act' } });
f.I.barks({ t: 14, dow: 2 });
assert.equal(f.I.speech.q.length, 1, 'Ambient barks are audible before the first fifteen minutes');
assert.equal(f.I.speech.q[0].lineId, 'bark.dad.react.joke', 'Bark selection must not consume its own cooldown');
// A third person can unblock a retreat, while request chains may never become circular.
function queuedFamily(){
 const f=load('QueueTester');Object.assign(f.N,{clear:()=>0,NEED:24,route:()=>null});
 const {mom,dad,sister}=f.I.C;
 for(const c of [mom,dad,sister])Object.assign(c,{present:true,lvl:'G',x:0,hold:0,talking:false,seated:null,aside:null,asideFor:null});
 mom.z=45;dad.z=-50;sister.z=0;sister.asideFor=mom;sister.pushFrom={x:0,z:45,lvl:'G'};sister.pushN=6;sister.pushT=100000;
 return{f,mom,dad,sister};
}
let queue=queuedFamily();queue.f.I.stepAside(queue.sister,.1);assert.equal(queue.dad.asideFor,queue.sister,'The trailing person must make room for a blocked retreat');assert.equal(queue.dad.pushN,6);
queue=queuedFamily();queue.mom.asideFor=queue.dad;queue.f.I.stepAside(queue.sister,.1);assert.equal(queue.dad.asideFor,null,'Do not make a circular yield request');
queue=queuedFamily();queue.dad.seated={};queue.f.I.stepAside(queue.sister,.1);assert.equal(queue.dad.asideFor,null,'A passing queue must not pull someone out of their seat');
console.log('PASS people-loop: scene history, account isolation, explicit help, bark cooldown, hold timeout and safe three-person yielding');
