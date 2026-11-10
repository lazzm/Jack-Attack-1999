// Build production cupboard/hall geometry without WebGL; compare the unreleased PV11 baseline.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),T=require('../app/public/vendor/three.min.js');
const read=n=>fs.readFileSync(require.resolve('../app/public/js/'+n),'utf8');
const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*7}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
function build(src){
 const c={THREE:T,URL,location:{href:'http://localhost/'},document:{currentScript:null,getElementById:()=>null,createElement:()=>({getContext:()=>paint})},console,performance,localStorage:{getItem:()=>null},Room:{_:{secret(){},S:{f:{}}},hasConsole:()=>true},RoomCat:{FINDS:[]}};c.window=c;vm.createContext(c);vm.runInContext(read('hs-kit.js'),c);
 const K=c.HouseKit,tex=n=>K.tex(n,16,16,()=>{});K.TEX.fade=tex('fade');
 c.HouseArt={t:tex,text(){},grain(){},FONT:'serif',HAND:'serif',UIF:'serif',P:{}};
 const H=c.House={ok:true,K,T,STAND:143,FRONT:{FZ:1400,CAR:{},STREET:{kerb:1550,pave:[1400,1545]},PIERS:[],HEDGE:[]},REAR:{z1:-176,bedroomWindows:[]},ROOMS:{},DOORS:{},SPOTS:{},ambient:new Set(),spot(id,d){return this.SPOTS[id]={...d,id}},door(id,d){this.DOORS[id]={...d,open:false,id};return this.DOORS[id]},walkRect(){},block(){},solid(){},support(){},dirty(){}};
 src=src.replace(/\}\)\(\);\s*$/, 'window.cupGeometry={buildHall,buildCupboard};})();');vm.runInContext(src,c);
 const hall={group:new T.Group()},cup={group:new T.Group()};H.ROOMS.cupboard=cup;c.cupGeometry.buildHall(hall);c.cupGeometry.buildCupboard(cup);
 const draws=g=>{let n=0;g.traverse(m=>{if(m.isMesh&&m.visible)n+=Array.isArray(m.material)?m.geometry.groups.filter(q=>m.material[q.materialIndex]?.visible!==false).length:m.material.visible===false?0:1});return n};
 return {c,H,hall,cup,draws:{hall:draws(hall.group),cupboard:draws(cup.group)}};
}
const before=build(execFileSync('git',['show','b34c2557062b5bb208f6d667d1f1808617caeff0:app/public/js/hs-house.js'],{encoding:'utf8'})),after=build(read('hs-house.js'));
console.log('ROOM DRAW SUBMISSIONS (unculled, before runtime merge)',before.draws,'=>',after.draws);
assert(after.draws.hall+after.draws.cupboard<=before.draws.hall+before.draws.cupboard+3,'Cupboard/hall draw budget increased');
const d=after.H.DOORS.cupboard,slab=d.pivot.children.find(m=>m.geometry?.type==='BoxGeometry');assert(slab);assert.equal(d.open,false);assert.equal(d.swing,180);
for(let angle=0;angle<=180;angle+=2){
 d.pivot.rotation.y=-angle*Math.PI/180;d.pivot.updateMatrixWorld(true);const p=slab.geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(slab.matrixWorld);assert(v.y<=351.001,'Leaf cuts carpet');assert(v.x>240,'Leaf reaches hall wall/fittings');
  if(v.x>331)assert(v.y>=96.5+.8*(v.z-250),'Leaf cuts soffit');
 }
}
d.pivot.rotation.y=-Math.PI;d.pivot.updateMatrixWorld(true);const open=new T.Box3().setFromObject(d.pivot);assert(open.max.x<326.8,'Open leaf/handles overlap casing');
const closed=after.cup;assert(closed.cupScreen);assert(after.H.SPOTS['hs.cup.box']);assert(after.H.SPOTS['hs.cup.shelf']);assert(after.H.SPOTS['hs.cup.bag']);
console.log('CUPBOARD GEOMETRY PASS: production builds, combined draw budget, 91 door angles, carpet/soffit/hall clearance, folded casing clearance and retained interaction IDs');

const world=read('hs-world.js'),roofContext={Number};vm.createContext(roofContext);vm.runInContext(world.slice(world.indexOf('  function fitsCeiling('),world.indexOf('  function freeGhost(')),roofContext);
const roof={ceilingAt:(x,z)=>96.5+.8*(z-250)};
assert(roofContext.fitsCeiling(roof,370,353,470,30,10));assert(!roofContext.fitsCeiling(roof,370,353,520,50,12));assert(roofContext.fitsCeiling({},370,353,520,200,40));
console.log('CUPBOARD PLACEMENT PASS: low storage fits, tall item/footprint refused under slope, ordinary rooms unchanged');
// Check all authored prop vertices against the lining/soffit, excluding the
// structural shell, invisible picking volumes and contact-shadow skirts.
after.cup.group.updateMatrixWorld(true);
let vertices=0;
after.cup.group.traverse(m=>{
 if(!m.isMesh||m.material.visible===false||m.userData.contactShadow||m.material.transparent)return;
 const materials=[].concat(m.material),p=m.geometry.attributes.position;
 if(materials.some(mt=>mt.map===after.H.K.TEX['hs.cupboard.plaster']||mt.map===after.H.K.TEX.carpetBeige))return;
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);vertices++;
  assert(v.x>=330.8&&v.x<=409.2,'Prop cuts side lining: '+v.toArray());assert(v.z>=251.1&&v.z<=547.2,'Prop cuts end lining: '+v.toArray());
  assert(v.y>=96.5+.8*(v.z-250)-.8,'Prop cuts soffit: '+v.toArray());assert(v.y<=353.2,'Prop cuts carpet: '+v.toArray());
 }
});
console.log('CUPBOARD PROP FIT PASS: '+vertices+' solid prop vertices inside lining, above carpet and below soffit');
// Keep the approved layout and reviewed hall budget: the pendant saving funds a lit woven runner.
const reviewed=build(execFileSync('git',['show','52ce5e1:app/public/js/hs-house.js'],{encoding:'utf8'}));
assert(after.draws.hall<=reviewed.draws.hall,'Pendant batching funds the non-emissive woven runner without increasing the reviewed hall budget');
assert(after.draws.cupboard<=reviewed.draws.cupboard,'Shared vacuum finish must not increase cupboard submissions');
const floorRay=new T.Raycaster(new T.Vector3(200,340,190),new T.Vector3(0,1,0));
for(const r of [reviewed.hall,after.hall])r.group.updateMatrixWorld(true);
const floorHits=r=>floorRay.intersectObject(r.group,true).filter(h=>h.object.material.visible!==false&&!h.object.material.transparent);
assert.equal(floorHits(reviewed.hall).length,0,'Approved baseline already had a threshold surface');
assert(floorHits(after.hall).some(h=>Math.abs(h.point.y-353)<.01),'Hall carpet must fill the missing threshold');
console.log('ROUND 2 PASS: approved 52ce5e1 geometry and reviewed hall budget; missing 10 cm doorway floor strip now closed');

// Exercise the real swept leaf against a nearby body at fast and loaded frame
// cadences. The final pose must be exact once the animation retires; a tiny
// floating-point remainder used to strand exact-state/browser save checks.
{
 const root=new T.Group();root.scale.y=-1;root.add(d.pivot);
 let time=0;
 Object.assign(d,{ms:650,ang:1,open:true});
 const c={T,DOORS:{cupboard:d},ROOMS:{hall:{lvl:'G'},cupboard:{lvl:'G'}},W:{x:270,z:310,fy:353,lvl:'G'},RAD:22,D2R:Math.PI/180,live:true,mode:'walk',grids:{},anims:new Map(),performance:{now:()=>time},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),ease:t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,buildRoom(){},visCalc(){},dirty(){},sfxDoor(){},emit(){}};
 vm.createContext(c);
 vm.runInContext(world.slice(world.indexOf('  function circleBox('),world.indexOf('  function shellContacts('))+world.slice(world.indexOf('  const doorPoint ='),world.indexOf('  const doorObstructs='))+world.slice(world.indexOf('  function setDoor('),world.indexOf('  let visSet =')),c);
 const tick=n=>{for(const[k,move]of c.anims)if(!move(n))c.anims.delete(k)};
 for(const cadence of [1000/60,100,1500]){
  time=0;c.setDoor('cupboard',true,true);Object.assign(c.W,{x:270,z:310});
  c.setDoor('cupboard',false);
  for(time=cadence;time<2000;time+=cadence)tick(time);
  tick(2000);
  const held=d.ang;assert(held>0&&held<1,'Safe sweep did not arrest for the player');assert(c.anims.has('door:cupboard'));
  assert.equal(c.doorContacts(c.W.x,c.W.z,303,'G',24,d).length,0,'Leaf crossed the nearby player');
  Object.assign(c.W,{x:240,z:360});tick(3000);
  console.log('CUPBOARD SWEEP',JSON.stringify({cadence,held,closed:d.ang,active:c.anims.has('door:cupboard')}));
  assert.equal(d.ang,0,'Retired safe sweep must finish at the exact closed pose');assert(!c.anims.has('door:cupboard'));
  time=3000;c.setDoor('cupboard',true);tick(3400);c.setDoor('cupboard',false);c.setDoor('cupboard',true);c.setDoor('cupboard',false);tick(5000);
  assert.equal(d.ang,0,'Rapid reversals did not close');assert(!c.anims.has('door:cupboard'));
 }
 console.log('CUPBOARD SWEEP PASS: real leaf/player collision, 60/10/0.67 FPS, resumed closure, exact endpoints and rapid reversals');
}
