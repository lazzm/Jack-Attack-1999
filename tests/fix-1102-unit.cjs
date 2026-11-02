// Timing regressions use the production functions, without WebGL or changing test limits.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const world=fs.readFileSync('app/public/js/hs-world.js','utf8');
const doorCode=world.slice(world.indexOf('  function setDoor('),world.indexOf('  let visSet ='));
let time=1000;
const d={open:false,ang:0,ms:650,swing:100,dir:-1,rooms:[],pivot:{rotation:{y:0}}};
const ctx={DOORS:{back:d},grids:{dirty:false},ROOMS:{},anims:new Map(),performance:{now:()=>time},D2R:Math.PI/180,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),ease:t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,buildRoom(){},visCalc(){},dirty(){},sfxDoor(){},emit(){}};
vm.createContext(ctx);vm.runInContext(doorCode,ctx);
ctx.setDoor('back',true);
let move=ctx.anims.get('door:back');
move(800);assert.equal(d.ang,0,'A delayed frame must not swing behind the closed frame');
move(1325);assert.equal(d.ang,.5);
time=1325;ctx.setDoor('back',false);move=ctx.anims.get('door:back');
move(1000);assert.equal(d.ang,.5,'Rapid reversal must not overshoot its starting angle');
move(1650);assert.equal(d.ang,.25);move(1975);assert.equal(d.ang,0);assert.equal(Math.abs(d.pivot.rotation.y),0);
ctx.setDoor('back',true,true);assert.equal(d.ang,1);assert(!ctx.anims.has('door:back'));
ctx.setDoor('back',false,true);assert.equal(d.ang,0);assert.equal(Math.abs(d.pivot.rotation.y),0);
time=2000;ctx.setDoor('back',true);ctx.anims.get('door:back')(2325);
ctx.setDoor('back',true,true);assert.equal(d.ang,1,'Instant restore settles an already requested open door');assert(!ctx.anims.has('door:back'));
console.log('PASS door: stale frame timestamp, reversal, immediate open/shut and interrupted restore');
const life=fs.readFileSync('app/public/js/np-life.js','utf8');
const opening=life.slice(life.indexOf('  const firstBeat ='),life.indexOf('  function storyDirectives()')) + '\nif(firstBeat())setTimeout(openingCall,7000);';
let state,current,timer,hour,calls;
const speech={storyOn:()=>!state.flags.veteran,window:{st:{current:()=>({id:current}),getState:()=>state}},setTimeout:f=>{timer=f},clock:()=>({t:hour}),say:(id,line,opts)=>calls.push({id,line,...opts})};
vm.createContext(speech);
function arm(t){hour=t;state={flags:{},done:{}};current='lad';calls=[];timer=null;vm.runInContext("{\n"+opening+"\n}",speech)}
for(const[h,suffix]of [[0,'.night'],[5.99,'.night'],[6,''],[9,''],[11.99,''],[12,'.day'],[14,'.day'],[17.99,'.day'],[18,'.evening'],[21.99,'.evening'],[22,'.night'],[23,'.night']]){
 arm(h);assert(timer);timer();assert.equal(calls.length,1);assert.equal(calls[0].line,'c1.wake.mom.call'+suffix);assert.equal(calls[0].onceId,'c1.wake.mom.call');
 if(suffix)assert(calls[0].text&&!/morning|breakfast/i.test(calls[0].text));
}
arm(9);hour=23;timer();assert.equal(calls[0].line,'c1.wake.mom.call.night','Read the hour at speech time');
arm(23);current='meetmom';timer();assert.equal(calls.length,0);
arm(23);state.done.bed=true;timer();assert.equal(calls.length,0,'Out-of-order work cancels a stale opening call');
arm(23);state.flags.veteran=true;timer();assert.equal(calls.length,0);
console.log('PASS opening: four periods/boundaries, delayed clock change, progression, early chore and veteran');
// A subtitle-only variant keeps its own clip id but shares the original once key.
const sayCode=life.slice(life.indexOf('  function say(id, lineId, o)'),life.indexOf('  // Where a speaker is'));
const saved=new Map(),q=[],prefetched=[];
const voice={C:{mom:{id:'mom',present:false,said:{}}},L:{'c1.wake.mom.call':['mom','original morning recording','downstairs']},inEarshot:()=>false,member:()=> 'temporary',ls:{get:k=>saved.get(k),set:(k,v)=>saved.set(k,v)},nowMs:()=>1000,speech:{q},window:{st:{current:()=>({id:'lad'}),prefetch:id=>prefetched.push(id)}}};
vm.createContext(voice);vm.runInContext(sayCode,voice);
assert(voice.say('mom','c1.wake.mom.call.night',{text:'Keep it down, it is late.',call:true,once:true,onceId:'c1.wake.mom.call'}));
assert.equal(q[0].text,'Keep it down, it is late.');assert.equal(q[0].lineId,'c1.wake.mom.call.night');assert.equal(prefetched[0],q[0].lineId);
assert(!voice.say('mom','c1.wake.mom.call',{call:true,once:true}),'A refresh at another hour must not replay the introduction');
console.log('PASS fallback: independent clip id/text and original once key across periods');

const heldCode=life.slice(life.indexOf('  function dialogueHeld('),life.indexOf('  function tick(dt)'));
const who={hold:0,talking:true},held={speech:{cur:{c:who,lineId:'bark.mom.mess2',talk:false}}};vm.createContext(held);vm.runInContext(heldCode,held);
assert.equal(held.dialogueHeld(who),false,'An ambient bark cannot block a new avoidance goal');
held.speech.cur.talk=true;assert.equal(held.dialogueHeld(who),true);
held.speech.cur.talk=false;held.speech.cur.lineId='c1.mom.give';assert.equal(held.dialogueHeld(who),true);
held.speech.cur=null;assert.equal(held.dialogueHeld(who),false,'A stale talking flag is not a conversation');
who.hold=1;assert.equal(held.dialogueHeld(who),true);
console.log('PASS speech lock: ambient/stale speech releases planning; conversations and story lines hold');
const stepCode=life.slice(life.indexOf('  function step(c, dt, clk)'),life.indexOf('  function follow(c, s, dt)'));
const blocker=[{x:238,z:420,r:51}],routeCalls=[],resumed={cur:{k:'route',to:{lvl:'G',x:262,z:610},t:0},plan:[],hold:0,resumeAvoid:true};
const walk={peopleAvoid:()=>blocker,routeFrom:(c,to,avoid)=>{routeCalls.push(avoid);return{len:300}},follow:()=>{}};vm.createContext(walk);vm.runInContext(stepCode,walk);walk.step(resumed,.1,{});
assert.equal(routeCalls[0],blocker,'The first resumed leg must route around the standing blocker');assert.equal(resumed.resumeAvoid,false);
routeCalls.length=0;resumed.cur.r=null;resumed.resumeAvoid=true;walk.routeFrom=(c,to,avoid)=>{routeCalls.push(avoid);return avoid?null:{len:300}};walk.step(resumed,.1,{});
assert.equal(routeCalls[0],blocker);assert.equal(routeCalls.length,2);assert.equal(routeCalls[1],undefined,'A blocked avoidance plan falls back to ordinary traffic coordination');
console.log('PASS aside resume: checked body avoidance before returning to the routine');
// The back leaf must sit within the shallow exterior casing, rather than
// exposing several centimetres of dark recess in a pitched garden view.
const house=fs.readFileSync('app/public/js/hs-house.js','utf8');
const doorwayCode=house.slice(house.indexOf('  function doorway('),house.indexOf('  const pickBox ='));
const hinge=Number(house.match(/'backdoor', 'n', -56, 80, 160, GY, \{ inside: true, hingeNormal: ([\d.-]+)/)[1]);
const frame={T:{Group:class{constructor(){this.position={set:(x,y,z)=>Object.assign(this.position,{x,y,z})}}}},K:{into:()=>({}),doorLeaf:(p,o)=>p.leaf=o},M:v=>v,tex:()=>null,mBrass:{}};vm.createContext(frame);vm.runInContext(doorwayCode,frame);
const leaf=frame.doorway({group:{add(){}}},{},'backdoor','n',-56,80,160,353,{inside:true,hingeNormal:hinge,noframe:true,mat:{}});
const recess=leaf.position.z-leaf.leaf.t/2-(-60);assert(recess>=0&&recess<=1.5,'Closed leaf sits behind the shallow casing: '+recess);
console.log('PASS back-door seating: exterior-face recess '+recess.toFixed(1)+' cm');
