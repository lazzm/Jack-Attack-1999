// One look, kept fast (docs/GRAPHICS.md): no graphics options, sharp buffers, full-resolution textures, merged static
// geometry with self-healing, portal culling, invisible adaptation, live-screen budgets, idle GPU work and frame pacing.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './server.mjs';
import {roomFixture} from '../room-fixture.mjs';
const shots=fileURLToPath(new URL('../shots/perf/options/',import.meta.url));await mkdir(shots,{recursive:true});
await withTestServer(async base=>{
 const account='St0'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 // Old per-device settings (a Potato preset with the counter on) must migrate harmlessly.
 const f=await roomFixture(base,{account,password,signup:false,storage:{jhp_hs_graphics:{preset:'potato',dynamic:false,retro:true,showFps:true}},timeoutScale:4,debug:true});
 const {page:p,view,until,errors}=f;p.setDefaultTimeout(120000);
 try{
  const migrated=await p.evaluate(()=>({gfx:localStorage.getItem('jhp_hs_gfx'),graphics:localStorage.getItem('jhp_hs_graphics'),fps:localStorage.getItem('jhp_hs_fps'),g:House.graphicsGet(),menu:typeof window.HouseGraphicsMenu}));
  assert.equal(migrated.gfx,null);assert.equal(migrated.graphics,null);assert.equal(migrated.fps,'true');assert.equal(migrated.g.showFps,true);assert.equal(migrated.g.tier,'high');assert.equal(migrated.menu,'undefined');
  await p.evaluate(()=>{House.hush();window.stage0Ambient=[...House.ambient];House.ambient.clear();House._.setMode('focus');House.adapt(0,{pin:true,force:true})});
  // Sharp at every size: the drawing buffer is the CSS size times the device pixels (1 here), never a downscale.
  for(const [width,height]of [[1366,860],[2560,1440],[390,844],[844,390]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(250);
   const state=await p.evaluate(()=>{House._.renderForBenchmark();return{w:House.ren.domElement.width,h:House.ren.domElement.height,css:[House.ren.domElement.clientWidth,House.ren.domElement.clientHeight],pr:House.Q.pixelRatio,points:House.scene.children.concat(House.root.children).filter(o=>o.isPointLight&&o.visible).length,rate:House.screenRate(false),render:getComputedStyle(House.ren.domElement).imageRendering}});
   assert.equal(state.pr,1,JSON.stringify(state));assert.equal(state.w,state.css[0],JSON.stringify(state));assert.equal(state.h,state.css[1],JSON.stringify(state));
   assert.equal(state.points,5,'All five lamps light per pixel at rung 0');assert.equal(state.rate,60);assert.notEqual(state.render,'pixelated');
   await p.screenshot({path:shots+`best-${width}x${height}.png`});
  }
  await p.setViewportSize({width:1366,height:860});
  // No options UI: the pause menu has no graphics entry and G does nothing.
  await p.keyboard.press('Escape');await p.waitForTimeout(300);
  assert.equal(await p.locator('[data-pause=graphics],#hsGraphicsMenu').count(),0,'Graphics options removed');
  await p.locator('[data-pause=resume]').click();await p.waitForTimeout(200);
  const before=await p.evaluate(()=>JSON.stringify(House.graphicsGet()));await p.keyboard.press('g');await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>JSON.stringify(House.graphicsGet())),before,'G is not a graphics key any more');
  // Full-resolution, mipmapped, anisotropic textures.
  const tx=await p.evaluate(()=>{const t=House.K.tex('one-look-test-raster',1024,512,(g,w,h)=>{g.fillStyle='#edc779';g.fillRect(0,0,w,h)});return{w:t.image.width,h:t.image.height,mips:t.generateMipmaps,min:t.minFilter===THREE.LinearMipmapLinearFilter,aniso:t.anisotropy,max:House.ren.capabilities.getMaxAnisotropy()}});
  assert.equal(tx.w,1024);assert.equal(tx.h,512);assert(tx.mips&&tx.min);assert.equal(tx.aniso,Math.max(1,Math.min(8,tx.max)));
  // Static geometry is merged; a merged source that changes dissolves its batch at once (nothing goes stale).
  const merge=await p.evaluate(()=>{
   House.goRoom('bedroom',0);House.cancelGlide(true);House._.renderForBenchmark();
   const g=House.ROOMS.bedroom.group,st=HouseStatic.stats(g),calls=House.ren.info.render.calls;
   let src=null;g.traverse(o=>{if(!src&&o.isMesh&&o.layers.mask===HouseStatic.HIDDEN_MASK)src=o});
   const was=src.position.x;src.position.x+=40;src.updateMatrix();House._.renderForBenchmark();
   const healed=src.layers.mask===1,after=HouseStatic.stats(g);src.position.x=was;src.updateMatrix();
   return{st,after,calls,healed};
  });
  assert(merge.st.batches>10&&merge.st.sources>100,JSON.stringify(merge));assert(merge.healed,'Moved source draws again');assert(merge.after.dissolved>merge.st.dissolved,'Batch dissolved');
  const fire=await p.evaluate(()=>{House.goRoom('lounge',0);const r=House.ROOMS.lounge;House._.renderForBenchmark();const tick=()=>{for(const fn of stage0Ambient)fn(performance.now())};if(!r.fireOn)House.act('hs.fire');tick();const on=r.flames.some(f=>f.material.opacity>0);House.act('hs.fire');tick();return{on,off:r.flames.every(f=>f.material.opacity===0)}});assert(fire.on&&fire.off,'Gas fire retained its lit flames');
  // Live CRT: sized to its footprint, no mipmaps, throttled, nothing off camera.
  await view([-120,-55,160],[-216,-5,-16]);
  const live=await p.evaluate(()=>{
   const cv=document.createElement('canvas'),hud=document.createElement('canvas');cv.width=hud.width=640;cv.height=hud.height=480;cv.getContext('2d').fillRect(0,0,640,480);window.stage0Live=[cv,hud];
   const tx=Room._.tvLive(cv,hud,'n64');window.stage0Texture=tx;
   return tx&&{width:tx.image.width,mips:tx.generateMipmaps,aniso:tx.anisotropy,hudMips:tx.userData.hud.generateMipmaps,hudAniso:tx.userData.hud.anisotropy,throttled:!Room._.tvLive(cv,hud,'n64')};
  });assert(live,'Visible CRT did not upload');assert(live.width<=2048);assert.equal(live.mips,false);assert.equal(live.aniso,1);assert.equal(live.hudMips,false);assert.equal(live.hudAniso,1);assert(live.throttled);
  await view([-120,-55,160],[100,-55,250]);assert.equal(await p.evaluate(()=>Room._.tvLive(...stage0Live,'n64')),null,'Off-camera CRT uploaded');
  // The invisible ladder: lamps, screen rate and resolution only step on dense displays (1x here keeps 1).
  const ladder=await p.evaluate(()=>{const out=[];for(const level of [0,2,5]){House.adapt(level,{pin:true});House._.renderForBenchmark();out.push({level,lamps:House.root.children.filter(o=>o.isPointLight&&o.visible).length,rate:House.screenRate(false),pr:House.Q.pixelRatio})}House.adapt(0,{pin:true});return out});
  assert.deepEqual(ladder.map(l=>[l.lamps,l.rate,l.pr]),[[5,60,1],[3,30,1],[3,20,1]],JSON.stringify(ladder));
  // The hidden counter (migrated above) survives a refresh.
  await p.waitForTimeout(700);assert(await p.locator('.hs-perf').isVisible());assert.match(await p.locator('.hs-perf').innerText(),/ms/);
  await p.screenshot({path:shots+'graphics-counter.png'});
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.graphicsGet().showFps),true,'Lost the counter');await p.evaluate(()=>House.showFps(false));
  // No room GPU work when settled, unchanged and without ambient animation.
  await p.evaluate(()=>{StoryGuide.setting('off');House.ambient.clear();House.anims.clear();House._.setMode('focus');House.hush()});await p.waitForTimeout(2300);
  await p.evaluate(()=>{window.idleDraws=0;window.idleStacks=[];window.idleDirty=[];window.originalDirty=House.dirty;House.dirty=function(){if(idleDirty.length<8)idleDirty.push(new Error().stack);return originalDirty()};window.originalRender=House.ren.render;House.ren.render=function(...a){idleDraws++;if(idleStacks.length<12)idleStacks.push(new Error().stack);return originalRender.apply(this,a)}});await p.waitForTimeout(1900);const idle=await p.evaluate(()=>({draws:idleDraws,stacks:idleStacks,dirty:idleDirty,mode:House.mode,anims:[...House.anims.keys()],ambient:House.ambient.size}));console.log('IDLE CHECK',JSON.stringify(idle));assert.equal(idle.draws,0,'Idle room drew');await p.evaluate(()=>{House.ren.render=originalRender;House.dirty=originalDirty});
  // Pacing: measured in a tiny buffer so software fill does not conceal it; never above the 120 Hz desktop cap.
  const pacing=await p.evaluate(()=>new Promise(resolve=>{House.ren.setPixelRatio(1);House.ren.setSize(64,48,false);const start=performance.now(),initial=House.perf().frames;House.anims.set('stage0-cap',()=>true);setTimeout(()=>{House.anims.delete('stage0-cap');resolve({frames:House.perf().frames-initial,elapsed:performance.now()-start})},1600)}));assert(pacing.frames<=pacing.elapsed/1000*121+2,JSON.stringify(pacing));assert(pacing.frames>=10,'The loop kept drawing: '+JSON.stringify(pacing));
  assert.deepEqual(errors,[]);console.log('ONE LOOK PASS: options removed + migrated, sharp buffers, full textures, merged/self-healing statics, live screens, ladder, hidden counter, idle GPU work and pacing.',JSON.stringify({merge,ladder,pacing}));
 }finally{await f.browser.close()}
});
