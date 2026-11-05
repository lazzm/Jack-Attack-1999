// Exercise the real save/restore functions without a renderer or any account data.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const save=source.slice(source.indexOf('  function walkingPose() {'),source.indexOf('  function savePose()'));
const restore=source.slice(source.indexOf('  function restorePose(s) {'),source.indexOf('  function saveStood()'));
assert(save.includes('function validPose'));assert(restore.includes('return true'));
function fixture(limit){
 const room={id:'cupboard',eye:112},context={PV:12,RAD:22,THINGS:{},REAR:{kitchenBlocks:[[-124,66,4,154],[-80,26,-40,62],[-80,158,-40,194],[-156,90,-116,130],[-4,90,36,130]]},P:{x:0,y:0,z:0,rx:0,ry:90},W:{x:214.999999999,z:392,fy:353,eyeNow:112,seat:false},STAND:128,LV:{U:73,G:353},D2R:Math.PI/180,
  DOORS:{cupboard:{open:false,ang:0,swing:100,pivot:{rotation:{y:0}}}},anims:new Map(),grids:{dirty:false},cur:null,stIdx:-1,
  roomAt:(x,z,lvl)=>lvl==='G'&&x>0&&x<400&&z>0&&z<500?room:null,
  floorAt:(x,z,lvl,y)=>x<limit&&lvl==='G'&&Math.abs(y-353)<1?{y:353,lvl:'G'}:null,
  buildRoom(){},visCalc(){},nearestStation:()=>2,ui:{where(){}},emit(){},
 };
 context.W.lvl='G';context.setWalkFrom=s=>{context.W.x=s.x;context.W.z=s.z};vm.createContext(context);vm.runInContext(save+restore,context);return context;
}
const pose=()=>({x:215,y:241,z:392,rx:0,ry:90,seat:0,lvl:'G',d:{cupboard:true}});
let c=fixture(215);assert.equal(c.walkingPose().x,214.999999999,'Saving rounded across a collision boundary');
let s=pose();s.x=214.999999999;assert(c.restorePose(s));assert.equal(c.P.x,s.x,'Valid precise pose moved');assert(c.DOORS.cupboard.open);assert.equal(c.DOORS.cupboard.pivot.rotation.y,100*Math.PI/180);
c=fixture(215);s=pose();assert(c.restorePose(s));assert.equal(c.P.x,214.949,'Legacy rounding was not recovered');assert.equal(s.x,215,'Input save was mutated');assert.equal(c.P.z,392);
c=fixture(208);s=pose();assert(c.restorePose(s));assert.equal(c.P.x,207.5,'New solid-door margin did not recover nearby');assert.equal(c.cur.id,'cupboard');assert(Math.hypot(c.P.x-s.x,c.P.z-s.z)<=30);
c=fixture(-1000);assert.equal(c.restorePose(pose()),false,'Unsafe pose should not be accepted');assert.equal(c.P.x,0);
c=fixture(215);s=pose();s.x=NaN;assert.equal(c.restorePose(s),false,'Non-finite pose was accepted');
console.log('WORLD POSE PASS: precise save, exact resume, legacy rounding recovery, bounded same-room collision migration, invalid pose rejection');

const clearance=source.slice(source.indexOf('  function lowDoorAt('),source.indexOf('  // the floor under (x, z)'));
const cRoom={lvl:'G'},lintel={open:true,headroom:93.8,floorY:353,rooms:['hall'],closedBounds:{x0:326,x1:330,z0:362,z1:438}},doorContext={DOORS:{cupboard:lintel},ROOMS:{hall:cRoom},STAND:128,RAD:22};vm.createContext(doorContext);vm.runInContext(clearance,doorContext);
assert.equal(doorContext.headFitsDoor(327,392,'G',353,128),false,'Standing head crossed low opening');
assert.equal(doorContext.headFitsDoor(327,392,'G',353,84),true,'Crouched player blocked');
assert.equal(doorContext.headFitsDoor(327,392,'G',213,128),true,'Stair flight mistaken for ground-floor opening');
assert.equal(doorContext.headFitsDoor(327,340,'G',353,128),true,'Outside opening falsely restricted');
console.log('LOW LINTEL PASS: standing/crouched clearance and floor/doorway bounds');

// Dynamic room state must be prepared before validating an exact outdoor pose.
{
 const c=fixture(300),r=c.roomAt(200,200,'G');let prepared=false;
 const floor=c.floorAt;c.floorAt=(...args)=>prepared?floor(...args):null;
 r.preparePose=p=>{assert.equal(p.x,200);assert.equal(p.z,200);prepared=true};
 assert(c.restorePose({x:200,y:241,z:200,rx:0,ry:0,lvl:'G',seat:0}));
 assert(prepared);assert.equal(c.W.x,200);assert.equal(c.W.z,200);
 console.log('ROOM PREPARE PASS: dynamic vehicle state precedes exact saved-pose validation');
}

// A pre-extension garden save remains outside; the new table cannot cover an old standing pose.
{
 const c=fixture(500),garden={id:'garden',eye:143},kitchen={id:'kitchen',eye:143};
 c.roomAt=(x,z,lvl)=>lvl!=='G'?null:z< -176?garden:kitchen;
 c.floorAt=()=>({y:353,lvl:'G'});
 const old={x:120,y:210,z:-100,rx:0,ry:0,seat:0,lvl:'G',d:{cupboard:false}};
 assert(c.restorePose(old));assert.equal(c.cur.id,'garden');assert.equal(c.P.z,-220);assert.equal(old.z,-100);
 const current={...old,z:c.P.z,pv:10};assert(c.restorePose(current));assert.equal(c.P.z,-220,'Repeat refresh moved the outdoor pose');
 assert(c.restorePose({...old,x:-60,z:44}));assert.equal(c.P.x,-205,'New chair trapped the old player');assert.equal(c.cur.id,'kitchen');
 assert(c.restorePose({...old,x:150,z:100}));assert.equal(c.P.x,150,'Clear standing pose moved unnecessarily');
 assert.equal(c.walkingPose().pv,12,'New standing saves must identify the completed layout migration');
 console.log('REAR POSE PASS: one-time outdoor and furniture transfers, exact repeat refresh and clear-pose preservation');
}

{
 const c=fixture(500),bedroom={id:'bedroom',eye:143};c.roomAt=()=>bedroom;c.floorAt=()=>({y:73,lvl:'U'});
 c.THINGS.beanbag={at:{room:'bedroom',x:-116,y:73,z:82}};
 const old={pv:10,x:-145,y:-70,z:110,rx:0,ry:30,seat:0,lvl:'U'};
 assert(c.restorePose(old));assert.equal(c.P.z,150,'Enlarged beanbag covered an old valid standing pose');assert.equal(old.z,110);
 assert(c.restorePose({...old,pv:11,z:150}));assert.equal(c.P.z,150,'Repeat refresh moved the player');
 c.THINGS.beanbag.at.x=-200;assert(c.restorePose(old));assert.equal(c.P.z,110,'Moved beanbag changed an unrelated player pose');
 console.log('PV11 POSE PASS: enlarged home clearance, exact repeated refresh, moved furniture and immutable input');
}

{
 const c=fixture(500),room={id:'cupboard',eye:143,ceilingAt:(x,z)=>96.5+.8*(z-250)};
 c.roomAt=()=>room;c.floorAt=(x,z,lvl,y)=>y===353?{y:353,lvl:'G'}:null;
 const old={pv:11,x:370,y:241,z:275,rx:0,ry:0,lvl:'G',seat:0,d:{cupboard:true}};
 assert(c.restorePose(old));assert.equal(c.P.z,337);assert.equal(c.P.x,370);assert.equal(c.DOORS.cupboard.open,true);assert.equal(old.z,275);
 assert(c.restorePose({...old,pv:12,y:300,z:465}));assert.equal(c.P.z,465,'Low saved pose must use ground floor, not the standing eye');
 console.log('PV12 WALK PASS: moved high-end floor, open door and low crouched refresh remain in the cupboard');
}
