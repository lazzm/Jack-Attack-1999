// Main runs sequentially: node window-artifacts.mjs http://localhost:18479
// CPU geometry only (no server/browser): node window-artifacts.mjs --source-only
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

function sourceGeometry() {
 const require=createRequire(import.meta.url),T=require('../app/public/vendor/three.min.js');
 const noop=()=>{},textures=new Map();
 const paint=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:s=>({width:s.length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
 const document={getElementById:()=>null,createElement:()=>({getContext:()=>paint})};
 const art=new Proxy({t:key=>{if(!textures.has(key))textures.set(key,new T.Texture());return textures.get(key)},FONT:'serif',HAND:'serif',UIF:'serif'},{get:(o,k)=>o[k]??noop});
 const window={THREE:T,HouseArt:art,Room:{_:{}},RoomCat:{FINDS:[]}};
 const context=vm.createContext({window,document,localStorage:{getItem:()=>null},Apps:{defineSecret:noop},console,Date,Math,Promise});
 vm.runInContext(readFileSync(new URL('../app/public/js/hs-kit.js',import.meta.url),'utf8'),context);
 const K=window.HouseKit,H=window.House={K,T,ok:true,SPOTS:{},DOORS:{},ambient:{add:noop},dirty:noop,relight:noop};
 H.spot=(id,def)=>(H.SPOTS[id]=def);
 for(const method of ['walkRect','block','support'])H[method]=noop;
 const cylinders=[],originalInto=K.into;
 K.into=(...args)=>{
  const builder=originalInto(...args),cyl=builder.cyl;
  builder.cyl=(x,y,z,rt,rb,h,segments,material,options)=>{
   const geometry=new T.CylinderGeometry(rt,rb,h,segments);
   geometry.computeBoundingBox();
   const box=geometry.boundingBox.clone().applyMatrix4(K.xform(builder.base,x,y,z,options||{}));
   cylinders.push({box,rt,rb,h,material});geometry.dispose();
   return cyl(x,y,z,rt,rb,h,segments,material,options);
  };
  return builder;
 };
 const source=readFileSync(new URL('../app/public/js/hs-house.js',import.meta.url),'utf8');
 const marker='  const HouseRooms = window.HouseRooms = {';
 assert(source.includes(marker),'Source export marker changed');
 vm.runInContext(source.replace(marker,'  window.windowChecks = { buildGarden };\n'+marker),context);
 window.windowChecks.buildGarden({group:new T.Group()});
 const pipe=cylinders.find(c=>c.rt===5&&c.rb===5&&c.h===600&&c.material.color.getHexString()==='2a2a2a');
 assert(pipe,'Find the actual generated drainpipe');
 const opening=new T.Box3(new T.Vector3(156,-112,-70),new T.Vector3(226,-14,-54));
 assert(!pipe.box.intersectsBox(opening),'Black drainpipe intersects the bedroom window: '+JSON.stringify(pipe.box));
 console.log('SOURCE GEOMETRY PASS: generated drainpipe clears bedroom opening',JSON.stringify(pipe.box));
}

sourceGeometry();
if(!process.argv.includes('--source-only')) {
 const base=process.argv[2]||'http://localhost:18479';
 const {roomFixture}=await import('./room-fixture.mjs');
 const {browser,page,errors,until,view}=await roomFixture(base,{hour:14});
 const shots=new URL('./shots/',import.meta.url);mkdirSync(shots,{recursive:true});
 const report=[];
 // These are diagnostic camera placements, not walked collision-path tests.
 const windows=[
  {room:'bedroom',level:'U',outside:'garden',target:[207,-55,-68],point:[140,-85,110],eyes:[[191,-63,-18],[140,-85,110],[120,-63,-10],[222,-63,85]]},
  {room:'landing',level:'U',target:[410.8,-10,440],point:[300,-85,440],eyes:[[380,-10,440],[285,-70,440],[300,-35,380],[300,-35,500]]},
  {room:'lounge',level:'G',outside:'drive',target:[-95,225,708],point:[-60,195,570],eyes:[[-95,225,660],[-60,195,450],[-190,210,580],[70,210,580]]},
  {room:'kitchen',level:'G',outside:'garden',target:[-105,225,-61],point:[-80,195,75],eyes:[[-105,225,-12],[-80,195,140],[-180,210,45],[15,210,60]]}
 ];
 async function drawn() {
  return page.evaluate(()=>new Promise(resolve=>{
   const renderer=House.ren,old=renderer.render,seen=new Set();
   renderer.render=function(...args){
    for(const r of Object.values(House.ROOMS))if(r.group.visible)seen.add(r.id);
    return old.apply(this,args);
   };
   House.dirty();requestAnimationFrame(()=>requestAnimationFrame(()=>{renderer.render=old;resolve([...seen])}));
  }));
 }
 try {
  for(const d of await page.evaluate(()=>Object.values(House.DOORS).filter(d=>!d.always).map(d=>d.id))) {
   await page.evaluate(id=>House.setDoor(id,false,true),d);
  }
  await until(()=>![...House.anims.keys()].some(k=>k.startsWith('door:')));
  for(const size of [{width:1366,height:860},{width:390,height:844}]) {
   await page.setViewportSize(size);
   for(const w of windows.filter(w=>!process.argv[3]||w.room===process.argv[3]))for(const [i,eye]of w.eyes.entries()) {
    await view(eye,w.target,{level:w.level,roomPoint:w.point});
    const state=await page.evaluate(({eye,target})=>{
     const T=House.T;House.scene.updateMatrixWorld(true);
     const start=new T.Vector3(...eye).applyMatrix4(House.root.matrixWorld);
     const end=new T.Vector3(...target).applyMatrix4(House.root.matrixWorld);
     const ray=new T.Raycaster(start,end.clone().sub(start).normalize());
     const inverse=House.root.matrixWorld.clone().invert();
     const hits=ray.intersectObjects(House.root.children,true).filter(h=>{
      for(let o=h.object;o;o=o.parent)if(!o.visible)return false;
      const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;
      return m?.visible&&m.opacity>0;
     }).slice(0,12).map(h=>{
      const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;
      let owner=null;for(let o=h.object;o;o=o.parent)for(const r of Object.values(House.ROOMS))if(o===r.group)owner=r.id;
      return {owner,name:h.object.name,point:h.point.clone().applyMatrix4(inverse).toArray(),distance:h.distance,color:m.color?.getHexString(),transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,side:m.side};
     });
     return {room:House.here,visible:Object.values(House.ROOMS).filter(r=>r.group.visible).map(r=>r.id),hits};
    },{eye,target:w.target});
    const rendered=await drawn(),file=`window-artifacts-${w.room}-${size.width}-${['near','far','left','right'][i]}.png`;
    await page.screenshot({path:new URL(file,shots).pathname});
    report.push({window:w.room,size,eye,target:w.target,...state,rendered,screenshot:file});
    // Capture every room before asserting so failures still leave all angles.
    writeFileSync(new URL('window-artifacts.json',shots),JSON.stringify(report,null,2));
   }
  }
  for(const state of report) {
   const w=windows.find(w=>w.room===state.window);
   assert.equal(state.room,w.room,'Camera room ownership');
   if(w.outside) {
    assert(state.visible.includes(w.outside),w.room+' lost logical outdoor visibility');
    assert(state.rendered.includes(w.outside),w.room+' culled outdoors while looking through its window');
   }
   if(w.room==='bedroom')assert(!state.hits.some(h=>h.color==='2a2a2a'&&h.point[2]<-54&&h.point[2]>-70&&h.point[0]>=156&&h.point[0]<=226),'Black object inside bedroom glazing');
  }
  assert.deepEqual(errors,[],'Browser console warnings/errors');
  console.log('WINDOW ARTIFACTS PASS: '+report.length+' desktop/phone near/far/oblique captures and ray/material/render diagnostics. Inspect shots/window-artifacts-*.png; landing is diagnostic only (no outdoor sight-line metadata).');
 } finally {await browser.close()}
}
