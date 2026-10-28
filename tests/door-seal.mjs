import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';

const base=process.argv[2]||'http://localhost:18464',baseline=process.argv.includes('--baseline'),controlsOnly=process.argv.includes('--controls-only');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Disposable local server only');
const tag=baseline?'before':'after';
const {browser,page:p,errors,until,view}=await roomFixture(base);
const sides=[['bedroom',[0,-55,100],[243,-32,190]],['landing',[300,-55,480],[243,-32,190]]];
async function shot(name){await p.screenshot({path:`shots/door-seal-${tag}-${name}.png`})}
async function seal(){return p.evaluate(()=>{
 const H=House,T=H.T,meshes=[];H.scene.updateMatrixWorld(true);
 H.root.traverseVisible(o=>{if(o.isMesh&&[].concat(o.material).some(m=>m.visible&&!m.transparent))meshes.push(o)});
 return [[-60,150.5],[-131.8,190],[72.75,190]].map(([y,z])=>{
  const outside=H.here==='landing',origin=new T.Vector3(outside?300:180,-y,z),ray=new T.Raycaster(origin,new T.Vector3(outside?-1:1,0,0),0,outside?61:71);
  return {y,z,sealed:ray.intersectObjects(meshes,false).length>0};
 });
 });}
try{
 for(const [side,eye,target]of (controlsOnly?[]:sides)){
  await view(eye,target);await shot(`${side}-closed-oblique`);
  const result=await seal();console.log('SEAL',side,result);
  if(!baseline)assert(result.every(r=>r.sealed),`${side}: open ray through closed perimeter`);
 }
 for(const tier of (controlsOnly||process.argv.includes('--doors-only')?[]:[5,0])){
  await p.evaluate(t=>House.adapt(t,{pin:true,force:true}),tier);
  for(const [name,eye]of [['front',[-52,-45,70]],['rear',[-89,-41,-51]],['left',[-145,-45,-30]],['right',[-9,-36,-30]],['above',[-52,-120,-20]],['below',[-52,-12,40]]]){
   await view(eye,[-52,-35,-30]);await shot(`lamp-${tier}-${name}`);
   assert(await p.evaluate(()=>{const o=House.SPOTS.lamp.obj.getObjectByName('lamp-shell');return o.visible&&o.geometry.index.count>0&&o.material.every(m=>m.visible)}),'Lamp shell missing');
  }
 }
 if(!baseline){
  await p.evaluate(()=>House.adapt(0,{pin:true,force:true}));
  for(const width of (controlsOnly?[]:[1366,390])){
   await p.setViewportSize({width,height:width===390?844:860});
   for(const [side,eye,target]of sides){
    for(const open of [false,true]){
     await p.evaluate(open=>House.setDoor('bedroom',open,true),open);await p.waitForTimeout(750);await view(eye,target);
     assert.equal(await p.evaluate(()=>House.here),side);
     const rigs=await p.evaluate(side=>House._.lightingSnapshot(side),side);
     if(!open)assert.equal(await p.evaluate(side=>House.ROOMS[side==='bedroom'?'landing':'bedroom'].group.visible,side),false,'Closed adjacent room was enabled');
     if(!open){
      // The distant landing view deliberately grazes the architrave; use an
      // unobstructed standing position to check interaction from either side.
      await view([side==='bedroom'?200:290,-55,190],[243,-50,190]);
      const pick=await p.evaluate(()=>{const H=House,s=H.toScreen(243,-50,190);return s&&H.pick(s.x,s.y)?.spot});
      assert.equal(pick,'door',`${side}: door was not pickable`);await view(eye,target);
     }
     await shot(`${width}-${side}-${open?'open':'closed'}`);
     // Use a collision-valid cell for refresh, independently of the audit camera.
     await p.evaluate(side=>{const H=House,pose={x:side==='bedroom'?200:290,y:-55,z:190,rx:0,ry:side==='bedroom'?90:-90,lvl:'U',seat:0};H.setWalkFrom(pose);Object.assign(H.P,pose)},side);
     await p.evaluate(()=>House._.setMode('walk'));
     const before=await p.evaluate(()=>({x:House.P.x,z:House.P.z,side:House.here,open:House.DOORS.bedroom.open}));
     await p.reload({waitUntil:'domcontentloaded'});
     await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
     const after=await p.evaluate(()=>({x:House.P.x,z:House.P.z,side:House.here,open:House.DOORS.bedroom.open}));
     assert.equal(after.side,before.side);assert.equal(after.open,open);assert(Math.hypot(after.x-before.x,after.z-before.z)<1,'Refresh moved player');
     await view(eye,target);await shot(`${width}-${side}-${open?'open':'closed'}-refresh`);
     assert.deepEqual(await p.evaluate(side=>House._.lightingSnapshot(side),side),rigs,'Visible-room lighting changed after refresh');
     console.log('REFRESH PASS',width,side,open?'open':'closed');
    }
   }
  }
  // Real keyboard use, interrupted/repeated animation, and walking collision.
  for(const side of ['bedroom','landing']){
   await p.evaluate(side=>{window.sealStartSide=side;const H=House,pose={x:side==='bedroom'?200:280,y:-55,z:190,rx:0,ry:side==='bedroom'?90:-90,lvl:'U',seat:0};H.hush();H.setDoor('bedroom',false,true);H.W.vx=H.W.vz=0;H.setWalkFrom(pose);Object.assign(H.P,pose);H._.setMode('walk');if(!H._.cellOk('U',pose.x,pose.z))throw Error('Invalid collision test start')},side);await p.waitForTimeout(800);
   await p.keyboard.down('w');await p.waitForTimeout(700);await p.keyboard.up('w');
   assert.equal(await p.evaluate(()=>House.here),side,'Walked through shut door');
   await p.keyboard.press('f');await p.waitForTimeout(100);await p.keyboard.press('Escape');await p.waitForTimeout(150);await p.keyboard.press('Escape');await p.waitForTimeout(850);
   assert(await p.evaluate(()=>House.DOORS.bedroom.open),'F failed to open door');
   // Headless pointer-lock release can deliver a late pause-menu event.
   await p.evaluate(()=>HousePause.close());await p.waitForTimeout(200);
   let crossed=false;
   for(let n=0;n<25&&!crossed;n++){
    await p.keyboard.down('w');await p.waitForTimeout(200);await p.keyboard.up('w');
    crossed=await p.evaluate(()=>House.here!==window.sealStartSide);
   }
   assert(crossed,JSON.stringify(await p.evaluate(()=>({mode:House.mode,paused:House.paused,here:House.here,open:House.DOORS.bedroom.open,x:House.P.x,z:House.P.z}))));
   // Cross explicitly to the opposite collision region, not just room ownership at the seam.
   assert(await p.evaluate(side=>side==='bedroom'?House.P.x>240:House.P.x<250,side));
   for(let i=0;i<4;i++){await p.evaluate(()=>House.act('door'));await p.waitForTimeout(80)}await p.waitForTimeout(850);
   assert(await p.evaluate(()=>House.DOORS.bedroom.open&&House.DOORS.bedroom.ang===1),'Rapid use left a partial door');
   console.log('CONTROLS PASS',side);
  }
 }
 assert.deepEqual(errors,[]);console.log(`DOOR SEAL ${tag.toUpperCase()} PASS`);
}finally{await browser.close()}
