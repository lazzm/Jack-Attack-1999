// QA6 regression: fixtures establish saves/approaches; actions use real browser input.
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const base=process.argv[2],before=process.argv.includes('--before');
const only=(process.argv.find(a=>a.startsWith('--only='))||'--only=bed').slice(7).split(',');
const out=path.join(__dirname,'shots','qa6-fixes',before?'before':'after');await mkdir(out,{recursive:true});
const results=[];let activeBrowser;
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{Promise.resolve(activeBrowser?.close()).finally(()=>process.exit(130))});
async function run(name,opts,fn){console.log('START',name);if(opts.veteran){const account=opts.owner?'Jack':'FixQA6'+Date.now().toString(36),password='Throwaway-1999';const res=await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})});assert(res.status===200||opts.owner&&[400,409].includes(res.status),'Fixture registration failed');opts={...opts,account,password,signup:false,opening:false};}const f=await roomFixture(base,{opening:true,timeoutScale:3,...opts,onPage:async page=>{await page.addInitScript(()=>{const timer=setInterval(()=>{const r=window.House?.ren;if(!r)return;clearInterval(timer);const set=r.setPixelRatio.bind(r);window.qa6NativeRaster=set;r.setPixelRatio=n=>set(Math.min(n===undefined?1:n,.5));r.setPixelRatio(.5)},20)});if(before){for(const file of execFileSync('git',['diff','--name-only','--','app/public'],{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim().split('\n').filter(Boolean)){const body=execFileSync('git',['show','HEAD:'+file],{cwd:path.join(__dirname,'..')});await page.route('**/'+file.replace('app/public/','')+'*',route=>route.fulfill({body,contentType:file.endsWith('.css')?'text/css':'application/javascript'}))}}}});activeBrowser=f.browser;console.log('READY',name);const p=f.page;p.setDefaultTimeout(20000);await p.evaluate(()=>House.ren.setPixelRatio(.5));if(opts.touch){await p.touchscreen.tap(4,4);await p.waitForTimeout(350);if(await p.evaluate(()=>HousePause.open))await p.locator('[data-pause=resume]').tap()};
 const shot=async label=>{await p.evaluate(()=>{if(window.qa6NativeRaster)qa6NativeRaster(1);else House.ren.setPixelRatio(1);House.dirty()});await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>House.ren.getPixelRatio()),1,'Evidence must use native raster');await p.screenshot({path:path.join(out,label+'.png')});await p.evaluate(()=>House.ren.setPixelRatio(.5));};
 const aim=async(eye,target,level='U')=>{await f.view(eye,target,{level});await p.evaluate(target=>{House._.setMode('walk');HousePause.close();const P=House.P,W=House.W;W.eyeNow=W.eye;P.y=W.fy-W.eye;P.rx=Math.atan2(P.y-target[1],Math.hypot(target[0]-P.x,target[2]-P.z))*180/Math.PI;P.ry=Math.atan2(target[0]-P.x,-(target[2]-P.z))*180/Math.PI;House.dirty()},target);await p.waitForTimeout(400)};
 const wait=async(fn,arg)=>{const end=Date.now()+45000;while(Date.now()<end){if(await p.evaluate(fn,arg))return;await p.waitForTimeout(150)}throw Error('QA6 state timeout: '+fn)};
 try{await fn({...f,until:wait,shot,aim});assert.deepEqual(f.errors,[]);console.log('PASS',name)}catch(e){console.log('STATE',await p.evaluate(()=>({mode:House.mode,paused:House.paused,input:GameInput.mode,pick:House.pick(innerWidth/2,innerHeight/2)?.spot,speech:HouseFamily.debug.speech.cur?.lineId})));await shot(name+'-failure');throw e}finally{await f.browser.close();activeBrowser=null;await writeFile(path.join(out,'results-'+only.join('-')+'.json'),JSON.stringify(results,null,2))}}
if(only.includes('bed')||only.includes('bed-folded'))for(const touch of [false,true])await run('bed-'+(touch?'phone':'desktop'),touch?{touch,width:390,height:844}:{},async({page:p,until,aim,shot})=>{
 const folded=only.includes('bed-folded');
 await p.evaluate(async folded=>{await Chores.load();await Chores.part('bedroom');ChoreKit.begin('bed');(ChoreKit.S.v.bed ||= {}).pillowDocked=true;if(folded)ChoreKit.S.prog.bed={pillow:Date.now(),pjs:Date.now()};ChoreKit.MODS.bed.sync()},folded);
 // Rectangular surface grid, plus pillow. Each F/click must open the real work view.
 const points=folded?[[190,-24]]:[[165,20],[190,20],[220,20],[165,65],[190,65],[220,65],[165,95],[190,95],[220,95],[190,-24]];
 for(let i=0;i<points.length;i++){
  console.log('GRID',touch,i);
  const [x,z]=points[i];await aim([105,-70,115],[x,35,z]);
  const h=await p.evaluate(()=>({spot:House.pick(innerWidth/2,innerHeight/2)?.spot}));
  if(i===4||folded)await shot('r223-'+(folded?'folded-':'')+(touch?'phone':'desktop')+'-duvet');
  if(touch)await p.touchscreen.tap(195,422);else if(i%2)await p.mouse.click(683,430);else await p.keyboard.press('f');
  if(!before)await until(()=>!!document.querySelector('.ch-bed-work'));else await p.waitForTimeout(1600);const opened=await p.locator('.ch-bed-work').count();
  results.push({finding:'R223',touch,point:[x,z],hit:h,opened:!!opened});
  if(!before)assert(opened,'Visible bed point did not open work: '+JSON.stringify({x,z,h,touch}));
  if(opened){
   if(i===4||folded)await shot('r223-'+(folded?'folded-':'')+(touch?'phone':'desktop')+'-work');
   if(i===points.length-1&&!before&&!folded){
    if(touch){const cdp=await p.context().newCDPSession(p),points=await p.evaluate(()=>[-35,-15,-35,-15,-35,-15,-35].map(z=>House.toScreen(190,35,z)));
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:points[0].x,y:points[0].y}]});
     for(const q of points.slice(1)){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:q.x,y:q.y}]});await p.waitForTimeout(90)}
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else{await p.keyboard.down('Space');await until(()=>document.querySelector('.ch-bed-note progress')?.value===1);await p.keyboard.up('Space')}
    assert(await p.evaluate(()=>ChoreKit.has('bed','pillow')),'Native bed gesture did not plump pillow');await shot('r223-'+(touch?'phone':'desktop')+'-plumped');
   }
   if(touch)await p.locator('.hs-getup').tap();else await p.keyboard.press('q');await until(()=>!House.focused&&!House.gliding)
  }
 }
 if(before)assert(results.some(r=>r.finding==='R223'&&r.touch===touch&&!r.opened),'Baseline no longer reproduces duvet failure');
});
if(only.includes('recovery'))for(const [width,height]of [[390,844],[768,1024]])await run('recovery-'+width+'x'+height,{touch:true,width,height},async({page:p,until,shot})=>{
 // Stage the assembled PC at the recovery boundary; native fingers insert every
 // disk. One running installer crosses both orientations, rather than restarting.
 await p.evaluate(async()=>{await StoryOpening.prepare();const s=st.getState();s.flags.pcOwned=true;s.done.power=Date.now();StoryOpening.sync();House.bootPC()});
 await until(()=>!House.gliding);await p.evaluate(()=>{document.querySelector('#monitorSurface').classList.remove('pc-starting');Setup.recover(()=>{window.qa6Installed=true})});await p.waitForTimeout(1000);
 for(let disk=1;disk<=3;disk++){
  await until(disk=>[...document.querySelectorAll('.st-recovery .btn')].some(b=>b.textContent==='Insert Disk '+disk),disk);
  const button=p.locator('.st-recovery .btn').filter({hasText:'Insert Disk '+disk});
  for(const [w,h]of [[width,height],[height,width]]){
   await p.setViewportSize({width:w,height:h});await p.waitForTimeout(600);await button.waitFor({state:'visible'});const box=await button.boundingBox();
   assert(box.x>=0&&box.y>=0&&box.x+box.width<=w+1&&box.y+box.height<=h+1,'Recovery target outside viewport');
   const full=await p.evaluate(()=>House.desktopDisplay());results.push({finding:'R225',width:w,height:h,disk,box,full});
   if(disk===1)await shot('r225-'+w+'x'+h+'-disk1');
   if(before)assert(box.width<44||box.height<44,'Baseline target already finger-sized');
   else {assert(box.width>=44&&box.height>=44,'Recovery target below 44px');assert(full,'Recovery requires undiscovered LOCK IN');}
  }
  if(before)break;
  if(disk===1&&width===390){
   await p.locator('.ht-top [data-k=lock]').tap();await p.waitForTimeout(900);assert.equal(await p.evaluate(()=>House.desktopDisplay()),false,'Recovery overrides explicit In room');
   await p.locator('.ht-top [data-k=lock]').tap();await p.waitForTimeout(900);assert(await p.evaluate(()=>House.desktopDisplay()));
  }
  if(disk%2){await p.setViewportSize({width,height});await p.waitForTimeout(600)}
  assert.equal(await button.textContent(),'Insert Disk '+disk,'Rotation restarted installer');await button.tap();
 }
 if(!before){await until(()=>window.qa6Installed);await shot('r225-'+width+'x'+height+'-complete');}
});
if(only.includes('family'))for(const [width,height,touch]of (before?[[1366,860,false],[390,844,true]]:[[1366,860,false],[390,844,true],[844,390,true],[768,1024,true]]))await run('family-'+width+'x'+height,{veteran:true,width,height,touch,hour:14},async({page:p,until,aim,shot})=>{
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom');ChoreKit.begin('tidy');House.buildRoom(House.ROOMS.lounge);House.buildRoom(House.ROOMS.kitchen);window.qa6Actions=[];House.on('click',id=>qa6Actions.push(id))});
 const cases=before?[['sister','sofaR',205],['mom','sink',65]]:width===390?[['sister','sofaR',205],['mom','sink',65],['mom','sofaL',65],['mom','sofaL',205]]:[['sister','sofaR',205],['mom','sofaL',65]];
 for(const [id,spot,distance]of cases){
  console.log('TALK',width,height,id,spot,distance);
  await until(()=>!HouseFamily.debug.speech.cur&&!HouseFamily.debug.speech.q.length);
  const c=await p.evaluate(({id,spot})=>{const F=HouseFamily;for(const c of Object.values(F.chars)){c.hold=0;c.talking=false;c.backoff=c.backHome=c.pass=c.aside=null;}F.debug.scene(id,spot);F.debug.place(id,spot);F.debug.sim(25,.1);const c=F.chars[id];return{x:c.x,z:c.z}},{id,spot});
  await aim([c.x,210,c.z+(spot==='sink'?distance:-distance)],[c.x,id==='sister'?258:spot==='sink'?238:250,c.z],'G');
  if(touch){await p.touchscreen.tap(4,4);await p.waitForTimeout(300);if(await p.evaluate(()=>HousePause.open))await p.locator('[data-pause=resume]').tap();await p.waitForTimeout(200)}
  const initial=await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot);assert.equal(initial,'np.'+id);
  await p.evaluate(()=>{qa6Actions.length=0;window.qa6ChipHold=setInterval(()=>ChoreKit.begin('tidy'),500);ChoreKit.begin('tidy')});
  if(touch)await p.locator('.ht-acts [data-k=f]').tap();else await p.keyboard.press('f');
  if(!before)await until(id=>{const s=HouseFamily.debug.speech;if(s.cur?.c.id!==id)return false;s.freeze=true;return true},id);
  await p.waitForTimeout(1400);await shot('r226-r227-'+width+'x'+height+'-'+id+'-'+spot+'-'+distance);
  const state=await p.evaluate(id=>{const c=HouseFamily.chars[id],v=c.rig.eyeWorld(new House.T.Vector3()),eye=House.toScreen(v.x,v.y,v.z),mouthWorld=c.rig.mouthWorld(new House.T.Vector3()),mouth=House.toScreen(mouthWorld.x,-mouthWorld.y,mouthWorld.z),r=document.querySelector('.ch-chip').getBoundingClientRect();return{pick:House.pick(innerWidth/2,innerHeight/2)?.spot,eye,mouth,chip:{x:r.x,y:r.y,w:r.width,h:r.height},conversation:House.ui.el.classList.contains('np-conversation'),text:HouseFamily.debug.speech.cur?.text}},id);
  results.push({finding:'R226/R227',width,height,id,spot,distance,...state});
  if(!before){if(id==='mom'&&touch)assert(state.chip.w>0&&state.chip.h>0,'Tidy strip must be visible for face clearance check');assert.equal(state.pick,'np.'+id,'Ease lost conversation target');for(const q of [state.eye,state.mouth])assert(!(q.x>=state.chip.x&&q.x<=state.chip.x+state.chip.w&&q.y>=state.chip.y&&q.y<=state.chip.y+state.chip.h),'Job strip covers face');}
  await p.evaluate(()=>{HouseFamily.debug.speech.freeze=false;clearInterval(window.qa6ChipHold)});
  if(id==='sister'){
   await until(()=>!HouseFamily.debug.speech.cur&&!HouseFamily.debug.speech.q.length);
   await p.evaluate(()=>{qa6Actions.length=0});
   if(touch){if(await p.locator('.ht-acts [data-k=f]').count())await p.locator('.ht-acts [data-k=f]').tap();else await p.touchscreen.tap(width/2,height/2)}else await p.keyboard.press('f');
   await p.waitForTimeout(250);
   const action=await p.evaluate(()=>qa6Actions.at(-1));
   results.push({finding:'R226-second-input',width,height,action});
   if(!before){assert.equal(action,'np.sister','Second F without re-aim selected another object');await until(()=>{const s=HouseFamily.debug.speech;if(s.cur?.c.id!=='sister')return false;s.freeze=true;return true})}
   await shot('r226-'+width+'x'+height+'-second-talk');await p.evaluate(()=>{HouseFamily.debug.speech.freeze=false});
  }
 }
});
if(only.includes('beddialogue'))for(const [width,height]of [[390,844]])await run('beddialogue-'+width+'x'+height,{touch:true,width,height},async({page:p,until,aim,shot})=>{
 await p.evaluate(async()=>{await Chores.load();await Chores.part('bedroom');ChoreKit.begin('bed');(ChoreKit.S.v.bed||={}).pillowDocked=true;ChoreKit.MODS.bed.sync()});
 await aim([105,-70,115],[190,35,65]);await p.touchscreen.tap(width/2,height/2);
 if(before&&!await p.locator('.ch-bed-work').count()){
  // Baseline's exposed-edge workaround, retained only to photograph the overlap.
  await aim([105,-70,115],[236,36,88]);await p.touchscreen.tap(width/2,height/2);
 }
 await until(()=>!!document.querySelector('.ch-bed-work'));
 // Mom's actual Chapter 1 doorway visit, and its automatic completion line.
 await p.evaluate(()=>{HouseFamily.debug.scene('mom','bedDoorMom');HouseFamily.debug.place('mom','bedDoorMom');HouseFamily.debug.sim(10,.1)});
 await until(()=>!HouseFamily.debug.speech.cur&&!HouseFamily.debug.speech.q.length);
 await p.evaluate(()=>HouseFamily.say('mom','c1.tidy.done',{force:true,again:true,prio:5,requested:false}));
 await until(()=>{const s=HouseFamily.debug.speech;if(s.cur?.lineId!=='c1.tidy.done')return false;s.freeze=true;return true});
 await until(()=>NPCBubble.live.some(b=>b.key==='mom'&&!b.out));
 for(const [w,h]of (before?[[390,844],[768,1024]]:[[390,844],[844,390],[768,1024]])){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(1000);await shot('r224-'+w+'x'+h+'-bed-speech');
  const layout=await p.evaluate(()=>{const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};return{note:rect(document.querySelector('.ch-bed-note')),balloons:[...document.querySelectorAll('.np-bub:not(.np-out)')].map(rect)}});results.push({finding:'R224',width:w,height:h,...layout});
  if(!before)for(const b of layout.balloons)assert(!(b.x<layout.note.x+layout.note.w&&b.x+b.w>layout.note.x&&b.y<layout.note.y+layout.note.h&&b.y+b.h>layout.note.y),'Bed note overlaps automatic speech');
 }
 await p.evaluate(()=>{HouseFamily.debug.speech.freeze=false});
 if(!before){
  // A folded bundle must not reintroduce the dead patch over the pillow.
  await p.setViewportSize({width,height});await p.locator('.hs-getup').tap();await until(()=>!House.focused&&!House.gliding);
  await p.evaluate(()=>{ChoreKit.S.prog.bed={pillow:Date.now(),pjs:Date.now()};ChoreKit.MODS.bed.sync()});
  await aim([105,-70,115],[190,35,-24]);await p.touchscreen.tap(width/2,height/2);await until(()=>!!document.querySelector('.ch-bed-work'));
  assert.equal(await p.locator('.ch-bed-note b').textContent(),'Pull the duvet up');await shot('r223-folded-phone-work');
 }
});
if(only.includes('breath'))await run('breath-night',{veteran:true,owner:true,hour:null},async({page:p,until,aim,shot})=>{
 await until(()=>OwnerTools.allowed);await p.evaluate(()=>{Net.send({t:'ownerAction',rid:'qa6-night',action:'clock',date:'1999-11-08',hour:22});House.buildRoom(House.ROOMS.garden);House.buildRoom(House.ROOMS.drive);House.adapt(0,{pin:true,force:true})});await until(()=>OwnerTools.now().getHours()===22&&HouseEnvironment.phase==='night');console.log('NIGHT READY');
 const drive=await p.evaluate(()=>{const f=House.ROOMS.drive.carFrame;return[f.x-150,210,f.z+30]});
 for(const [room,eye,target]of [['garden',[-180,210,-1120],[-180,210,-1250]],['drive',drive,[drive[0],210,drive[2]-150]]]){
  console.log('NIGHT VIEW',room);await aim(eye,target,'G');await p.keyboard.down('w');await p.waitForTimeout(120);await p.keyboard.up('w');
  await p.waitForTimeout(3800);if(before)await p.evaluate(()=>{qa6NativeRaster(1);House.dirty()});if(before)await until(()=>{const o=House.scene.getObjectByName('house-pooled-atmosphere'),s=o.geometry.attributes.style;if(!HouseVFX.stats().sources.breath)return false;const scale=House.ren.domElement.height/(2*Math.tan(House.camera.fov*Math.PI/360));if(Math.abs(o.material.uniforms.pointScale.value-scale)>1)return false;let visible=false;for(let i=0;i<o.geometry.drawRange.count;i++)if(s.getZ(i)===0&&s.getY(i)>.08)visible=true;if(!visible)return false;const tick=[...House.ambient].find(fn=>fn.name==='tick'&&fn.toString().includes('nextBreath'));window.qa6FrozenAtmosphere=tick;House.ambient.delete(tick);return true});
  await p.waitForTimeout(450);await shot('r222-'+room+'-22');
  const state=await p.evaluate(()=>({room:House.here,hour:OwnerTools.now().getHours(),phase:HouseEnvironment.phase,pose:{...House.P},effects:HouseVFX.stats()}));results.push({finding:'R222',...state});assert.equal(state.room,room,'Night view is in the wrong outside room');assert.equal(state.hour,22);assert.equal(state.phase,'night');
  if(!before)assert.equal(state.effects.sources.breath||0,0,'Player still emits first-person breath');
  if(before)await p.evaluate(()=>{if(window.qa6FrozenAtmosphere)House.ambient.add(qa6FrozenAtmosphere);House.dirty()});
 }
});
