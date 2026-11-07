// Native-resolution VFX evidence and integration checks; disposable localhost only.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
const baseline=process.argv.includes('--baseline'),mugOnly=process.argv.includes('--mug-only'),detailsOnly=process.argv.includes('--details-only'),tailOnly=process.argv.includes('--tail-only'),tvOnly=process.argv.includes('--tv-only'),tag=baseline?'before':'after';
const dir=new URL('./shots/vfx/'+tag+'/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='VFX'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,hour:14,seed:1999,debug:true,onPage:async p=>{if(!baseline&&detailsOnly)await p.route('**/js/hs-vfx.js*',async r=>{const response=await r.fetch();const body=(await response.text()).replaceAll('performance.now()', '(window.__fxPhotoNow??performance.now())').replace('function tick(now){','function tick(now){now=window.__fxPhotoNow??now;');await r.fulfill({response,body});});if(baseline){await p.route('**/js/hs-vfx.js*',r=>r.fulfill({body:'/* Baseline: no VFX layer. */',contentType:'application/javascript'}));for(const file of ['hs-world.js','hs-house.js','hs-kit.js','hs-telly.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({body:execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8'}),contentType:'application/javascript'}));}}});
 const {page:p,view,until,errors}=f,rows=[];
 async function shot(name,eye,target,level='G',hour=14){
  await p.evaluate(hour=>{window.auditHour=hour;dispatchEvent(new Event('ownerclock'));House.hush();HousePause.close();House.adapt(0,{pin:true,force:true});},hour);
  await view(eye,target,{level});await p.waitForTimeout(1000);
  if(!baseline&&name==='07-garden')await until(()=>HouseVFX.stats().sources.breath>0);
  await p.evaluate(()=>{House.hush();House._.renderForBenchmark()});
  const info=await p.evaluate(()=>{const fx=window.HouseVFX?.stats?.()||null,on=House.ren.info.render.calls,effects=['house-pooled-atmosphere','house-plaster-and-glass-effects'].map(n=>House.root.getObjectByName(n)).filter(Boolean),visibility=effects.map(o=>o.visible);for(const o of effects)o.visible=false;House._.renderForBenchmark();const off=House.ren.info.render.calls;effects.forEach((o,i)=>o.visible=visibility[i]);House._.renderForBenchmark();return{renderer:window.__jhpDebug().renderer,perf:House.perf(),fx,extraCalls:on-off,lights:House.scene.children.concat(House.root.children).filter(o=>o.isLight).length}});
  assert(info.extraCalls<=2,JSON.stringify(info));
  await p.screenshot({path:dir+name+'.png'});rows.push({name,...info});console.log('VFX VIEW',name,JSON.stringify(info));
 }
 try{
  await p.evaluate(()=>{for(const id of ['kitchen','lounge','garden'])House.buildRoom(House.ROOMS[id]);});
  await until(()=>!!window.HouseTelly);
  if(tvOnly){await p.evaluate(()=>{HouseFamily.debug.hide(true);if(!HouseTelly.on)HouseTelly.press('power')});await shot('04-telly',[-160,204,540],[-75,190,347],'G',21);await shot('05-telly-wall',[80,210,520],[-240,180,375],'G',21);assert.deepEqual(errors,[]);await writeFile(dir+'metrics-tv.json',JSON.stringify(rows,null,2));console.log('VFX TV REVIEW PASS',tag);return;}
  if(detailsOnly){
   if(!baseline){await p.evaluate(()=>{if(!HouseTelly.on)HouseTelly.press('power')});await shot('04-telly',[-160,204,540],[-75,190,347],'G',21);await shot('05-telly-wall',[80,210,520],[-240,180,375],'G',21);await shot('07-garden',[30,210,-370],[-80,250,-650],'G',21);}
   // Static feedback states for native artwork inspection. Only the cosmetic
   // clock is held; the ordinary unpaused review writes motion.json separately.
   await p.evaluate(()=>{HouseFamily.debug.place('mom','kmug1');HouseFamily.debug.go('mom','kmug1','mug');HouseFamily.debug.sim(15,.1);const rig=HouseFamily.chars.mom.rig;rig.set({action:'mug'});for(let i=0;i<20;i++)rig.update(.1,true)});
   await shot('06b-hot-mug',[-130,205,170],[-190,230,100]);
   await view([150,220,250],[194.4,235,246],{level:'G'});
   await p.evaluate(()=>{window.__fxPhotoNow=performance.now();House.act('hs.switch.kitchen');window.__fxPhotoNow+=65;House.hush();House.dirty()});await p.screenshot({path:dir+'10b-switch.png'});await p.evaluate(()=>delete window.__fxPhotoNow);
   await p.evaluate(()=>House.setDoor('kitchen',false,true));await view([255,235,167],[196,250,157],{level:'G'});
   await p.evaluate(()=>{window.__fxPhotoNow=performance.now();House.setDoor('kitchen',true);House.anims.delete('door:kitchen');House.DOORS.kitchen.ang=0;House.DOORS.kitchen.pivot.rotation.y=0;window.__fxPhotoNow+=100;House.dirty()});await p.screenshot({path:dir+'10c-door-latch.png'});await p.evaluate(()=>{delete window.__fxPhotoNow;House.setDoor('kitchen',false,true)});
   await view([25,-55,90],[46,-7,-8],{level:'U'});
   await p.evaluate(()=>{window.__fxPhotoNow=performance.now();House.grab('mug');window.__fxPhotoNow+=70;House.hush();House.dirty()});await p.screenshot({path:dir+'09-pickup.png'});
   await p.evaluate(()=>{window.__fxPhotoNow=performance.now();House.putBack()});await until(()=>House.THINGS.mug.st==='rest');await p.evaluate(()=>{window.__fxPhotoNow+=80;House.dirty()});await p.screenshot({path:dir+'10-put-down.png'});await p.evaluate(()=>delete window.__fxPhotoNow);
   assert.deepEqual(errors,[]);await writeFile(dir+'metrics-details.json',JSON.stringify(rows,null,2));console.log('VFX DETAIL REVIEW PASS',tag);return;
  }
  if(mugOnly){await p.evaluate(()=>{HouseFamily.debug.place('mom','kmug1');HouseFamily.debug.go('mom','kmug1','mug');HouseFamily.debug.sim(15,.1);const rig=HouseFamily.chars.mom.rig;rig.set({action:'mug'});for(let i=0;i<20;i++)rig.update(.1,true)});await shot('06b-hot-mug',[-130,205,170],[-190,230,100]);await writeFile(dir+'metrics-mug.json',JSON.stringify(rows,null,2));assert.deepEqual(errors,[]);console.log('VFX MUG REVIEW PASS',tag);return;}
  if(!tailOnly){
  await shot('01-kettle',[-150,215,-55],[-194,234,-156]);
  await p.evaluate(()=>{House.act('hs.kettle');House.hush()});await p.waitForTimeout(650);await p.screenshot({path:dir+'02-kettle-boiling.png'});
  await shot('03-kettle-side',[-248,220,-70],[-187,229,-156]);
  await p.evaluate(()=>{if(!HouseTelly.on)HouseTelly.press('power')});
  await shot('04-telly',[-160,204,540],[-75,190,347],'G',21);
  await shot('05-telly-wall',[80,210,520],[-240,180,375],'G',21);
  await shot('06-window',[115,-65,85],[190,-75,-56],'U',14);
  await p.evaluate(()=>{HouseFamily.debug.place('mom','kmug1');HouseFamily.debug.go('mom','kmug1','mug');HouseFamily.debug.sim(15,.1);const rig=HouseFamily.chars.mom.rig;rig.set({action:'mug'});for(let i=0;i<20;i++)rig.update(.1,true)});
  await shot('06b-hot-mug',[-130,205,170],[-190,230,100]);
  await shot('07-garden',[30,210,-370],[-80,250,-650],'G',21);
  }
  await shot('08-cold-window',[-110,205,-10],[-100,205,-176],'G',21);
  if(!baseline)await p.evaluate(()=>{const before=HouseVFX.beforeRender,after=HouseVFX.afterRender;window.__vfxMotion={samples:[],restoreErrors:0,maxSquash:0,maxLever:0,maxSwitch:0};let scale;
   HouseVFX.beforeRender=()=>{scale=House.THINGS.mug.obj.scale.clone();before();const o=House.THINGS.mug.obj,squash=o.scale.y/scale.y-1,d=House.DOORS.kitchen?.pivot?.userData.vfxLevers,lever=d?d.geometry.attributes.position.getY(d.ranges[0].first)-d.position[d.ranges[0].first*3+1]:0;__vfxMotion.maxSquash=Math.max(__vfxMotion.maxSquash,Math.abs(squash));__vfxMotion.maxLever=Math.max(__vfxMotion.maxLever,Math.abs(lever));if(__vfxMotion.samples.length<240)__vfxMotion.samples.push({t:performance.now(),squash,lever,particles:HouseVFX.stats().active});};
   HouseVFX.afterRender=()=>{after();if(scale&&!House.THINGS.mug.obj.scale.equals(scale))__vfxMotion.restoreErrors++;};
  });
  await view([25,-55,90],[46,-7,-8],{level:'U'});
  await p.evaluate(()=>{window.auditHour=14;dispatchEvent(new Event('ownerclock'));House.grab('mug');House.hush()});await p.waitForTimeout(70);await p.screenshot({path:dir+'09-pickup.png'});
  await p.evaluate(()=>House.putBack());await p.waitForTimeout(270);await p.screenshot({path:dir+'10-put-down.png'});
  await p.waitForTimeout(900);
  await view([250,210,215],[204,220,270],{level:'G'});
  await p.evaluate(()=>{House.act('hs.switch.kitchen');House.hush()});await p.screenshot({path:dir+'10b-switch.png'});
  await view([250,210,190],[200,250,190],{level:'G'});
  await p.evaluate(()=>House.setDoor('kitchen',true));await p.waitForTimeout(60);await p.screenshot({path:dir+'10c-door-latch.png'});await p.waitForTimeout(900);
  if(!baseline){
   const state=await p.evaluate(()=>({fx:HouseVFX.stats(),held:House.held(),scale:House.THINGS.mug.obj.scale.toArray(),at:House.THINGS.mug.at}));
   assert.equal(state.held,null);assert.deepEqual(state.scale,[1,1,1]);assert(state.fx.events.grab>0&&state.fx.events.contact>0,JSON.stringify(state));
   await p.evaluate(()=>{for(let i=0;i<8;i++){House.grab('mug');House.putBack()}House.motion.reduce=true});await p.waitForTimeout(1000);
   assert.deepEqual(await p.evaluate(()=>House.THINGS.mug.obj.scale.toArray()),[1,1,1]);
   await p.evaluate(()=>{House.motion.reduce=false;House.adapt(5,{pin:true});House.dirty()});await p.waitForTimeout(1500);
   assert((await p.evaluate(()=>HouseVFX.stats().active))<=16);
  }
  for(const [w,h]of [[390,844],[844,390],[768,1024],[1024,768]]){await p.setViewportSize({width:w,height:h});await shot(`11-kettle-${w}x${h}`,[-150,215,-55],[-194,234,-156]);}
  if(!baseline){const motion=await p.evaluate(()=>window.__vfxMotion);assert.equal(motion.restoreErrors,0);await writeFile(dir+'motion.json',JSON.stringify(motion,null,2));console.log('VFX MOTION',JSON.stringify({maxSquash:motion.maxSquash,maxLever:motion.maxLever,restoreErrors:motion.restoreErrors}));}
  assert.deepEqual(errors,[]);await writeFile(dir+(tailOnly?'metrics-tail.json':'metrics.json'),JSON.stringify(rows,null,2));console.log('VFX REVIEW PASS',tag);
 }finally{await f.browser.close()}
});
