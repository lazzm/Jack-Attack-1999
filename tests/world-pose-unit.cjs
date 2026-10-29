// Exercise the real save/restore functions without a renderer or any account data.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const save=source.slice(source.indexOf('  function walkingPose() {'),source.indexOf('  function savePose()'));
const restore=source.slice(source.indexOf('  function restorePose(s) {'),source.indexOf('  function saveStood()'));
assert(save.includes('function validPose'));assert(restore.includes('return true'));
function fixture(limit){
 const room={id:'cupboard',eye:112},context={P:{x:0,y:0,z:0,rx:0,ry:90},W:{x:214.999999999,z:392,fy:353,eyeNow:112,seat:false},STAND:128,LV:{U:73,G:353},D2R:Math.PI/180,
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
