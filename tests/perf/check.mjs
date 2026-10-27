import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './server.mjs';
import {roomFixture} from '../room-fixture.mjs';
const shots=fileURLToPath(new URL('../shots/perf/options/',import.meta.url));await mkdir(shots,{recursive:true});
await withTestServer(async base=>{
 const account='St0'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,tier:'potato',storage:{jhp_hs_graphics:{preset:'potato',dynamic:false}},timeoutScale:4,debug:true});
 const {page:p,view,until,errors}=f;p.setDefaultTimeout(120000);
 try{
  await p.evaluate(()=>{House.hush();window.stage0Ambient=[...House.ambient];House.ambient.clear();House._.setMode('focus')});
  for(const [width,height]of [[1366,860],[2560,1440],[390,844],[844,390]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(250);
   const state=await p.evaluate(()=>({g:House.graphicsGet(),pixels:House.ren.domElement.width*House.ren.domElement.height,points:House.scene.children.concat(House.root.children).filter(o=>o.isPointLight&&o.visible).length}));
   assert(state.pixels<=350000,JSON.stringify(state));assert.equal(state.points,0);assert.equal(state.g.actualAntialias,false);assert.equal(await p.evaluate(()=>House.screenRate(false)),12);
   await p.screenshot({path:shots+`potato-${width}x${height}.png`});
  }
  await p.setViewportSize({width:1366,height:860});
  const fire=await p.evaluate(()=>{House.goRoom('lounge',0);const r=House.ROOMS.lounge;House._.renderForBenchmark();const tick=()=>{for(const fn of stage0Ambient)fn(performance.now())};if(!r.fireOn)House.act('hs.fire');tick();const on=r.flames.some(f=>f.material.opacity>0);House.act('hs.fire');tick();return{on,off:r.flames.every(f=>f.material.opacity===0)}});assert(fire.on&&fire.off,'Gas fire retained its lit flames');
  // Tier changes restore full authored pixels; texture and material identities survive.
  const memory=await p.evaluate(()=>{
   const tx=House.K.tex('stage0-test-raster',1024,512,(g,w,h)=>{g.fillStyle='#edc779';g.fillRect(0,0,w,h)}),out=[];
   for(const tier of ['potato','medium','low','high']){House.gfx(tier);out.push({tier,width:tx.image.width,height:tx.image.height,source:tx.userData.canvas.width})}return out;
  });assert.deepEqual(memory.map(v=>v.width),[256,1024,512,1024]);assert(memory.every(v=>v.source===1024));
  await view([-120,-55,160],[-216,-5,-16]);
  await p.evaluate(()=>House.gfx('potato'));
  const live=await p.evaluate(()=>{
   const cv=document.createElement('canvas'),hud=document.createElement('canvas');cv.width=hud.width=640;cv.height=hud.height=480;cv.getContext('2d').fillRect(0,0,640,480);window.stage0Live=[cv,hud];
   const tx=Room._.tvLive(cv,hud,'n64');window.stage0Texture=tx;
   return tx&&{width:tx.image.width,mips:tx.generateMipmaps,aniso:tx.anisotropy,hudMips:tx.userData.hud.generateMipmaps,hudAniso:tx.userData.hud.anisotropy,throttled:!Room._.tvLive(cv,hud,'n64')};
  });assert(live,'Visible CRT did not upload');assert(live.width<=256);assert.equal(live.mips,false);assert.equal(live.aniso,1);assert.equal(live.hudMips,false);assert.equal(live.hudAniso,1);assert(live.throttled);
  await view([-120,-55,160],[100,-55,250]);assert.equal(await p.evaluate(()=>Room._.tvLive(...stage0Live,'n64')),null,'Off-camera CRT uploaded');
  // Verify the saved options through the real menu, including the visible counter.
  await p.keyboard.press('Escape');await p.locator('[data-pause=graphics]').click();
  await p.locator('[name=gfxShowFps]').check();await p.locator('[name=gfxRetro]').check();await p.waitForTimeout(700);
  assert(await p.locator('.hs-perf').isVisible());assert.match(await p.locator('.hs-perf').innerText(),/ms/);
  assert(await p.evaluate(()=>House.ren.domElement.width<=640&&House.ren.domElement.height<=480));
  await p.screenshot({path:shots+'graphics-counter.png'});await p.locator('[data-gfx=resume]').click();
  const saved=await p.evaluate(()=>House.graphicsGet());await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
  const restored=await p.evaluate(()=>House.graphicsGet());for(const key of ['tier','preset','retro','showFps'])assert.equal(restored[key],saved[key],'Lost '+key);
  await p.screenshot({path:shots+'counter-restored.png'});
  // No room GPU work when settled, unchanged and without ambient animation.
  await p.evaluate(()=>{House.ambient.clear();House.anims.clear();House._.setMode('focus');House.hush()});await p.waitForTimeout(2300);
  await p.evaluate(()=>{window.idleDraws=0;window.originalRender=House.ren.render;House.ren.render=function(...a){idleDraws++;return originalRender.apply(this,a)}});await p.waitForTimeout(1900);assert.equal(await p.evaluate(()=>idleDraws),0,'Idle room drew');await p.evaluate(()=>House.ren.render=originalRender);
  // Measure the cap in a tiny buffer so software fill does not conceal pacing.
  const pacing=await p.evaluate(()=>new Promise(resolve=>{House.ren.setPixelRatio(1);House.ren.setSize(64,48,false);const start=performance.now(),initial=House.perf().frames;House.anims.set('stage0-cap',()=>true);setTimeout(()=>{House.anims.delete('stage0-cap');resolve({frames:House.perf().frames-initial,elapsed:performance.now()-start})},1600)}));assert(pacing.frames<=pacing.elapsed/1000*31+2,JSON.stringify(pacing));
  assert.deepEqual(errors,[]);console.log('STAGE 0 PASS: pixel caps, no point lights, texture restoration, screen rate/size/visibility, menu/counter/refresh, idle GPU work and frame cap.',JSON.stringify({memory,pacing}));
 }finally{await f.browser.close()}
});
