// Real GPU equivalence plus room/time/device lighting review. Disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const f=await roomFixture(process.argv[2],{timeoutScale:4}),{page:p,errors}=f;
p.setDefaultTimeout(180000);const dir=new URL('shots/gfx-lighting/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
try{
 const result=await p.evaluate(()=>{
  const T=THREE,S=HouseStatic,r=House.ren,scene=new T.Scene(),g=new T.Group(),cam=new T.OrthographicCamera(-45,45,35,-35,.1,300);cam.position.set(40,40,100);cam.lookAt(0,0,0);scene.add(g,new T.HemisphereLight(0xffffff,0x555555,.8));const lamp=new T.DirectionalLight(0xffffff,.7);lamp.position.set(10,40,60);scene.add(lamp);
  for(let i=0;i<4;i++){const m=new T.Mesh(new T.BoxGeometry(14,20,10),new T.MeshPhongMaterial({color:[0xa36f46,0x4488aa,0x74a452,0xd5b371][i],shininess:22}));m.position.x=(i-1.5)*18;m.rotation.y=i*.23;if(i===2)m.scale.x=-1;g.add(m);}
  const target=new T.WebGLRenderTarget(160,120),prior=r.getRenderTarget(),a=new Uint8Array(160*120*4),b=new Uint8Array(a.length);r.setRenderTarget(target);r.render(scene,cam);r.readRenderTargetPixels(target,0,0,160,120,a);const batches=S.merge(g);r.render(scene,cam);r.readRenderTargetPixels(target,0,0,160,120,b);let changed=0,max=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d>2)changed++;max=Math.max(max,d);}S.unmerge(g);g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});r.setRenderTarget(prior);target.dispose();House.dirty();return{batches,changed,max,channels:a.length};
 });assert(result.batches>0);assert(result.changed/result.channels<.001,JSON.stringify(result));console.log('BATCH IMAGE',JSON.stringify(result));
 await p.evaluate(()=>{House.hush();House.ambient.clear();House.anims.clear();House.adapt(0,{pin:true,force:true})});
 const rooms=await p.evaluate(()=>Object.keys(House.ROOMS));let count=0;
 async function station(id){await p.evaluate(id=>{House.goRoom(id,0);const t=House._.glide?.to;House.cancelGlide(true);if(t){const pose=typeof t==='function'?t():t;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');House.relight();House._.renderForBenchmark()},id);await p.waitForTimeout(450);await p.evaluate(()=>House._.renderForBenchmark());}
 for(const hour of [9,13,19,23]){await p.evaluate(hour=>{window.auditHour=hour;dispatchEvent(new Event('ownerclock'));HouseEnvironment.update(0);House.relight()},hour);for(const id of rooms){await station(id);await p.screenshot({path:dir+`${id}-${hour}.png`});count++;}}
 for(const [w,h]of [[1920,1080],[390,844],[844,390],[768,1024],[1024,768]]){await p.setViewportSize({width:w,height:h});for(const id of ['bedroom','kitchen','hall','drive']){await station(id);await p.screenshot({path:dir+`${id}-${w}x${h}-night.png`});count++;}}
 // A readable poster view at daylight and night, with its full A2 title visible.
 await p.setViewportSize({width:1366,height:860});for(const hour of [13,23]){await p.evaluate(h=>{window.auditHour=h;dispatchEvent(new Event('ownerclock'));House.relight()},hour);await f.view([-80,-70,65],[-52,-82,-56]);await p.screenshot({path:dir+`poster-${hour}.png`});}
 assert.deepEqual(errors,[]);console.log('GFX INTEGRITY PASS:',count+2,'room/device/time captures, merged geometry image equivalence, zero errors');
}finally{await f.browser.close()}
