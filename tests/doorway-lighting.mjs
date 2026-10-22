import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450',tag=process.argv[3]||'final',hours=process.argv[4]==='all'?[14,17,22]:[Number(process.argv[4]||14)],tier=process.argv[5]||'low';
const {browser,page:p,errors,view}=await roomFixture(base,{hour:hours[0],tier,month:9,width:tier==='high'?390:1366,height:tier==='high'?844:860});
async function sample(){const pixels=await p.evaluate(()=>{House.dirty();return new Promise(resolve=>requestAnimationFrame(()=>{const src=document.querySelector('.hs-gl'),c=document.createElement('canvas');c.width=320;c.height=180;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,320,180);resolve(Array.from(g.getImageData(80,40,160,100).data))}))});assert(pixels.some((v,i)=>i%4!==3&&v>30),'Sampled a cleared drawing buffer');return pixels}
try{
 const budget=tier==='low'?3:5,phaseSkies=new Set();
 await p.evaluate(()=>{window.auditLightingCallbacks=[...House.ambient];House.ambient.clear()});
 assert.equal(await p.evaluate(()=>House.root.children.filter(o=>o.isPointLight).length),budget);
 for(const hour of hours){
 await p.setViewportSize({width:1366,height:860});
 await p.evaluate(hour=>{window.auditHour=hour;window.auditMinute+=5;for(const fn of window.auditLightingCallbacks)fn(performance.now());House.relight();House.dirty()},hour);await p.waitForTimeout(1500);
 if(hours.length===3)assert(await p.evaluate(phase=>document.getElementById('bootPower').classList.contains('rm-'+phase),hour===14?'day':hour===17?'dusk':'night'),'Wrong sky phase for hour '+hour);
 phaseSkies.add(await p.evaluate(()=>House._.lightingSnapshot('bedroom').sky));
 await p.evaluate(()=>{House.setDoor('bedroom',true,true);House.ambient.clear()});await p.waitForTimeout(800);
 await view([292,-55,190],[65,20,170]);await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-landing.png`});
 await view([255,-55,190],[95,30,190]);await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-threshold.png`});
 const eye=[258,-55,190],target=[35,-30,58];
 await view(eye,target,{roomPoint:[235,-55,190]});await p.waitForTimeout(900);const before=await sample();
 await view(eye,target,{roomPoint:[255,-55,190]});await p.waitForTimeout(900);const after=await sample();
 let total=0,channels=0;for(let i=0;i<before.length;i++)if(i%4!==3){total+=Math.abs(before[i]-after[i]);channels++}const delta=total/channels;
 console.log('Boundary pixel mean delta',delta.toFixed(5));assert(delta<0.25,'The same room/view changed brightness when the current room changed');
 for(const [size,width,height]of [['desktop',1366,860],['narrow',390,844]]){
  await p.setViewportSize({width,height});
  for(const open of [false,true]){
   await p.evaluate(open=>House.setDoor('bedroom',open,true),open);await p.waitForTimeout(800);
   await view([292,-55,190],[65,20,170]);
   await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-${size}-${open?'open':'closed'}.png`});
   assert.equal(await p.evaluate(()=>House.DOORS.bedroom.open),open);
   assert(await p.evaluate(()=>House._.lightingSnapshot('bedroom').lights.length<= (HouseQ==='low'?3:5)));
  }
 }
 for(const [id,z]of [['kitchen',190],['lounge',520]]){
  await p.evaluate(id=>House.setDoor(id,true,true),id);await p.waitForTimeout(800);
  await p.setViewportSize({width:1366,height:860});
  await view([210,220,z],[0,280,z],{roomPoint:[190,220,z],level:'G'});await p.waitForTimeout(900);assert.equal(await p.evaluate(()=>House.here),id);const inside=await sample();
  await view([210,220,z],[0,280,z],{roomPoint:[220,220,z],level:'G'});await p.waitForTimeout(900);assert.equal(await p.evaluate(()=>House.here),'hall');const outside=await sample();
  const delta=inside.reduce((sum,v,i)=>sum+(i%4===3?0:Math.abs(v-outside[i])),0)/(inside.length*.75);
  const floor=await p.evaluate(({id,z})=>[196,200,204].flatMap(x=>[z-38,z,z+38].map(a=>{
   const ray=new House.T.Raycaster(new House.T.Vector3(x,-350,a),new House.T.Vector3(0,-1,0),0,10);
   const hit=ray.intersectObject(House.ROOMS[id].group,true)[0];return hit?-hit.point.y:null;
  })),{id,z});
  assert(floor.every(y=>y!==null&&Math.abs(y-352.9)<.01),id+' has an uncovered floor gap beneath its door');
  console.log(id,'boundary pixel mean delta',delta.toFixed(5));assert(delta<.25,id+' changed brightness across its boundary');
  for(const [size,width,height]of [['desktop',1366,860],['narrow',390,844]]){
   await p.setViewportSize({width,height});
   for(const open of [false,true]){
    await p.evaluate(({id,open})=>House.setDoor(id,open,true),{id,open});await p.waitForTimeout(800);
    await view([260,220,z],[80,340,z],{level:'G'});
    await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-${id}-${size}-${open?'open':'closed'}.png`});
    if(!open){
     await view([145,220,z],[260,340,z],{level:'G'});
     assert(await p.evaluate(id=>House.ROOMS[id].group.visible,id));
     const sealed=await p.evaluate(({id,z})=>{
      const g=House.ROOMS[id].group,T=House.T;
      const hit=(x,y,a,dx,dy,dz)=>new T.Raycaster(new T.Vector3(x,-y,a),new T.Vector3(dx,-dy,dz),0,20).intersectObject(g,true).length>0;
      return [hit(208,350,z,0,1,0),hit(202,300,z-38,0,0,-1),hit(202,300,z+38,0,0,1),hit(202,150,z,0,-1,0)].every(Boolean);
     },{id,z});
     assert(sealed,id+' lost its threshold or reveals when the hall was hidden');
     await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-${id}-${size}-closed-inside.png`});
    }
   }
  }
 }
 assert.equal(await p.evaluate(()=>House.root.children.filter(o=>o.isPointLight).length),budget,'Room traversal allocated more GPU point lights');
 assert.deepEqual(errors,[]);console.log('DOORWAY QA PASS',tag,hour,tier);
 }
 if(hours.length===3)assert.equal(phaseSkies.size,3,'Day/dusk/night did not update the bedroom sky lighting');
}finally{await browser.close()}
