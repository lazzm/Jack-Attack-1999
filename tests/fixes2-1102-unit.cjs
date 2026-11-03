'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(require.resolve('../app/public/js/'+f),'utf8');
const life=read('np-life.js'),bf=read('season-bonfire.js');
const looks=life.slice(life.indexOf('  function looks(c)'),life.indexOf('  // ================================================================ the loop'));
const speakingCode=life.slice(life.indexOf('  function displaySpeaking(c)'),life.indexOf('  // at the spot:'));
let set;
const show={x:0,y:-180,z:-650},person={present:true,x:100,z:-100,h:Math.PI,hold:0,talking:false,goal:{key:'bf.mom.watch.right'},rig:{talking:false,set:v=>set=v}};
const gaze={speech:{cur:null},player:()=>({x:110,z:-200}),dist:()=>100,sameFloor:()=>true,eyes:()=>({x:110,y:210,z:-200}),angd:()=>0,D2R:Math.PI/180,window:{Bonfire:{familyLook:()=>show}}};
vm.createContext(gaze);vm.runInContext(speakingCode+looks,gaze);
gaze.looks(person);assert.equal(set.look,show,'Idle family watches the show, even when the player is near');
person.hold=3;gaze.looks(person);assert.equal(set.look,show,'Waiting for a line is not speaking');
person.talking=true;person.rig.talking=true;gaze.looks(person);assert.equal(set.look,show,'A queued/stale flag is not actual speech');
gaze.speech.cur={c:person};gaze.looks(person);assert.equal(set.look.x,110,'Actual speech glances at the player');
person.rig.talking=false;gaze.looks(person);assert.equal(set.look,show,'Return after the utterance, even if the conversation flag remains');
person.talking=false;person.hold=0;gaze.looks(person);assert.equal(set.look,show,'Returns to the show after speaking');
person.goal={key:'routine.sink'};gaze.looks(person);assert.equal(set.look.x,110,'Ordinary proximity gaze is unchanged');
const family=bf.slice(bf.indexOf('  const watchFire'),bf.indexOf('  function familyGoal('));
const scene={enabled:()=>true,phase:'day',catchup:()=>false,leftover:()=>false,showStart:()=>1,stageAt:()=> 'fountain',SE:{today:()=>({hour:20})},H:{here:'garden'}};
vm.createContext(scene);vm.runInContext(family,scene);
for(const saturday of [false,true]){
 scene.phase=saturday?'tail':'day';scene.leftover=()=>saturday;scene.catchup=()=>saturday;
 for(const stage of ['fountain','wheel','rocket','finale','over']){scene.stageAt=()=>stage;const p=scene.familyLook();assert(p);assert.equal(p.z,['rocket','finale'].includes(stage)?-650:-402,`${saturday?'Saturday':'Friday'} ${stage}`);}
}
scene.H.here='kitchen';assert(scene.familyLook(),'Spectators keep watching when the player looks through a window');scene.SE.today=()=>({hour:22});assert.equal(scene.familyLook(),null,'Return to ordinary routines at ten');
console.log('PASS family gaze: Friday/Saturday fire and sky, speaking-only glance, recovery, ordinary routines');
const step=life.slice(life.indexOf('  function step(c, dt, clk)'),life.indexOf('  function follow(c, s, dt)'));
let facing;const holding={window:{Bonfire:{familyLook:()=>show}},speech:{cur:null,q:[]},faceToward:(c,p)=>facing=p,player:()=>({x:110,z:-200})};
vm.createContext(holding);vm.runInContext(speakingCode+step,holding);
const held={cur:{k:'act',t:0},hold:1.5,goal:{key:'bf.mom.watch.right'},rig:{talking:false}};
holding.step(held,.1,{});assert.equal(facing,show,'Body faces the show while waiting for queued speech');
held.rig.talking=true;holding.speech.cur={c:held};holding.step(held,.1,{});assert.equal(facing.x,110);
held.rig.talking=false;holding.step(held,.1,{});assert.equal(facing,show,'Body returns immediately after speech');
console.log('PASS display body: queue wait, actual speech and return without route changes');

const aside=life.slice(life.indexOf('  function stepAside(c, dt)'),life.indexOf('  // ================================================================ seeing and hearing'));
const sink={},player={x:-60,z:85,lvl:'G'};
function sinkMom(distance=53,talking=false){
 const c={id:'mom',x:-80,z:36,lvl:'G',seated:null,goal:{key:'sink',spot:sink},cur:{k:'act'},talking,hold:0};
 const box={SPOT:{sink},dialogueHeld:c=>c.talking,sameFloor:()=>true,dist:()=>distance,player:()=>player,nowMs:()=>10000,chars:[c],NV:{NEED:24,clear:()=>100,route:()=>({})},doorZone:()=>false,peopleAvoid:()=>[],D2R:Math.PI/180};
 vm.createContext(box);vm.runInContext(aside,box);box.stepAside(c,.1);return c;
}
const retreat=sinkMom().aside;assert(retreat,'Stationary player by the sink gets room without pressing into Mom');assert(Math.hypot(retreat.x-player.x,retreat.z-player.z)>=100,'Retreat leaves enough room to work');
assert(!sinkMom(100).aside,'No unneeded retreat at a distance');assert(!sinkMom(53,true).aside,'Do not interrupt a conversation');
console.log('PASS sink space: proactive checked aside, distance and conversation guards');

const kitchen=read('ch-kitchen.js');
const poses=kitchen.slice(kitchen.indexOf('  const OLD_PILE'),kitchen.indexOf('  const RACK'));
const layout={WT:260};vm.createContext(layout);vm.runInContext(poses+'\nthis.poses=PILE;this.old=OLD_PILE',layout);
const [p0,p1,p2,bowl,mug,glass,pan]=layout.poses;
assert.equal(pan[0],-24);assert.equal(pan[2],-14);assert.equal(pan[1],258.1);
for(const p of [p0,p1,p2]){assert(p[0]-12>=20&&p[0]+12<48,'Plate fits the worktop and clears the bread bin');assert(Math.hypot(p[0]-40,p[2]+4)>23,'Plate clears the biscuit tin');assert(p[0]-12>0,'Plate clears Bonfire food preparation');assert(Math.hypot(p[0]-pan[0],p[2]-pan[2])>24);}
for(const [a,ar,b,br]of [[pan,9,bowl,8],[pan,9,mug,4.2],[pan,9,glass,3.4],[bowl,8,mug,4.2],[bowl,8,glass,3.4]])assert(Math.hypot(a[0]-b[0],a[2]-b[2])>ar+br);
const migration=kitchen.slice(kitchen.indexOf('  function updateFactoryPose'),kitchen.indexOf('  let dishes'));
let moved=[];const migrate={CK:{home:id=>moved.push(id)}};vm.createContext(migrate);vm.runInContext(migration,migrate);
const dish={id:'d',st:'rest',at:{room:'kitchen',x:-12,y:260,z:-16,ry:0}};
migrate.updateFactoryPose(dish,layout.old[0]);assert.deepEqual(moved,['d']);
for(const change of [{x:5},{hide:true},{room:'lounge'}]){moved=[];migrate.updateFactoryPose({...dish,at:{...dish.at,...change}},layout.old[0]);assert.deepEqual(moved,[]);}
moved=[];migrate.updateFactoryPose({...dish,st:'snap'},layout.old[0]);assert.deepEqual(moved,[]);
console.log('PASS dishes: separated rings, pan-on-ring height, plate worktop and exact factory-only migration');

const house=read('hs-house.js');
const drive=house.slice(house.indexOf('    drive: { name:'),house.indexOf('    kitchen: { name:',house.indexOf('    drive: { name:')));
const lights=drive.slice(drive.indexOf('lights: () =>')+8,drive.indexOf('\n      amb:')).replace(/,\s*$/,'');
const lightCtx={phase:()=> 'night',GY:353,LAMP:{x:700,z:1528},window:{HouseEnvironment:{streetLamps:[{x:-420,y:-101,z:2130,c:'#ffc078',i:1.7,d:1650},{x:960,y:-101,z:2130,c:'#ffc078',i:1.7,d:1650}]}}};
vm.createContext(lightCtx);vm.runInContext('this.getLights='+lights,lightCtx);
const lamps=lightCtx.getLights();assert.equal(lamps.length,4);
const strongest=lamps.map(l=>({l,s:l.i*Math.max(0,1-Math.hypot(l.x-190,l.y-233,l.z-1121)/l.d)**2})).sort((a,b)=>b.s-a.s).slice(0,3);
assert(strongest.some(({l})=>l.x===354),'Phone three-lamp rig must retain the porch');
assert(strongest.filter(({l})=>l.x!==354).length===2,'Phone keeps two sodium light pools');
lightCtx.phase=()=> 'day';assert.equal(lightCtx.getLights().length,0);
console.log('PASS lighting: existing rig only, three-slot phone porch + two street lamps, daylight off');
