import {workBed} from './bed-actions.mjs';
// Real physical chore permutations and diary guidance on disposable localhost data.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
assert(process.argv[2], 'Supply a disposable localhost server URL on port 18080–18099.');
const base=process.argv[2];
assert(+new URL(base).port>=18080 && +new URL(base).port<=18099);
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=fileURLToPath(new URL('shots/quest-ux/',import.meta.url));await mkdir(shots,{recursive:true});
const scenarios=process.argv[3]==='phone'?[]:process.argv[3]?[process.argv[3]]:['half-tidy-bed','bin-first','bed-bin-first'];
let savedStorage=process.argv[3]==='phone'?JSON.parse(await readFile('/tmp/jhp-quest-ux-browser.json','utf8')):null;
for(const scenario of scenarios){
 const f=await roomFixture(base,{account:'Quest'+Date.now().toString(36),opening:true,debug:true});
 const {page:p,until,view}=f;
 const wait=async(fn,arg)=>{for(let i=0;i<150;i++){if(await p.evaluate(fn,arg))return;await p.waitForTimeout(160)}throw Error('Timeout '+fn)};
 const done=id=>wait(id=>!!st.getState().done[id],id);
 const aim=async(eye,target,level='U')=>{await view(eye,target,{level});await p.evaluate(()=>{House.hush();House._.setMode('walk');HousePause.close()})};
 const shot=async name=>{await p.evaluate(()=>House.hush());await p.waitForTimeout(250);await p.screenshot({path:shots+scenario+'-'+name+'.png'})};
 async function drop(id,snap){
  const s=await p.evaluate(snap=>{const s=House.SNAPS[snap];return{x:s.x,y:s.y,z:s.z,room:s.room}},snap);
  for(let n=0;n<3;n++){
   const side = s.room === 'bedroom' && s.z > 180 ? -1 : 1;
   await aim([s.x,s.room==='kitchen'?245:-55,s.z+55*side],[s.x,s.y,s.z+8*side],s.room==='kitchen'?'G':'U');
   assert(await p.evaluate(id=>House.grab(id),id),'Cannot grab '+id);
   for(let j=0;j<5+n;j++)await p.keyboard.press('+');
   // Public physical drop API avoids a synthetic camera teleport's pointer-lock
   // exit opening the pause menu between keyboard events on busy software GL.
   await p.evaluate(()=>{HousePause.close();House.drop()});
   await wait(id=>!House.held() && ['snap','rest'].includes(House.THINGS[id].st),id);
   if(await p.evaluate(({id,snap})=>House.THINGS[id].snap===snap || id.startsWith('ch.m.')&&ChoreKit.has('tidy',id.slice(5)),{id,snap}))return;
  }
  console.log('Snap miss',await p.evaluate(({id,snap})=>({thing:House.THINGS[id].at,snap:House.SNAPS[snap],W:House.W,P:House.P}),{id,snap}));
  throw Error('Missed physical snap '+id+' -> '+snap);
 }
 async function bed(){
  await p.evaluate(()=>ChoreKit.begin('bed'));await p.waitForTimeout(1200);
  await drop('ch.pillow','ch.s.pillow');await p.waitForTimeout(1200);
  await workBed(p,['pillow']);
  await drop('ch.pjs','ch.s.pjs');await p.waitForTimeout(1200);
  // Completed pillow/pyjamas never remain guidance targets, even before payment.
  assert(!await p.evaluate(()=>StoryGuide.targets().includes('ch.pjs')));
  await workBed(p,['pullL','pullR','smooth']);
  await done('bed');console.log(scenario,'bed complete early');
 }
 async function bin(){
  await p.evaluate(()=>House.act('ch.binbag'));await until(()=>ChoreKit.has('bin','tie'));
  await p.waitForTimeout(5500);await drop('ch.binbag','ch.s.kbin');await done('bin');console.log(scenario,'bin complete');
 }
 async function lad(){
  await p.evaluate(()=>{House._.setMode('walk');House.interact('gb')});await until(()=>RoomTV.open_);
  await p.evaluate(()=>RoomTV.playPhysical('gb.blocks'));await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('Enter');await done('lad');
  await p.waitForTimeout(200);assert(!await p.locator('.st-marker').isVisible());
  await p.keyboard.press('t');assert(!await p.locator('.st-marker').isVisible());await p.keyboard.press('t');
  await p.keyboard.press('q');await until(()=>!RoomTV.open_&&!House.gliding);
  // A portable Game Lad used away from the bedroom returns to its close-up
  // first; Q again leans back to walking, just as it does during normal play.
  if(await p.evaluate(()=>House.mode==='focus'))await p.keyboard.press('q');
  await until(()=>House.mode==='walk'&&!House.gliding);
 }
 async function refresh(){
  await aim([40,-55,180],[40,-10,0]);await p.waitForTimeout(700);
  await p.evaluate(async()=>{House.saveWalkState();await Roam.syncNow()});
  const pose=await p.evaluate(()=>({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')}));
  await p.reload({waitUntil:'domcontentloaded'});
  await until(()=>window.House?.live&&!!window.st?.getState()&&window.StoryOpening?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.mode),'walk');
  assert.deepEqual(await p.evaluate(()=>({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')})),pose);
  await p.evaluate(async()=>{await Chores.load();House.buildRoom(House.ROOMS.kitchen);await Chores.part('bedroom');await Chores.part('kitchen')});
 }
 try{
  await until(()=>!!st.getState()&&!!StoryOpening?.built);
  await p.evaluate(async()=>{await Room.ensureHouse();await Chores.load();await Chores.part('bedroom');House.buildRoom(House.ROOMS.kitchen);await Chores.part('kitchen')});
  await until(()=>!!House.THINGS['ch.pjs']&&!!House.SNAPS['ch.s.sink']);
  assert(Object.values(await p.evaluate(()=>Object.fromEntries(Object.entries(House.SNAPS).filter(([id])=>id.startsWith('ch.s.rack')).map(([id,s])=>[id,s.room])))).includes('bedroom'),'Kitchen loading removed the bedroom CD return slot');
  if(scenario==='half-tidy-bed'){
   await lad();await until(()=>st.current().id==='tidy');
   await aim([30,-55,195],[65,38,130]);
   await p.keyboard.press('j');assert(await p.locator('.st-quests').isVisible());
   await shot('01-picker');
   await p.locator('[data-quest="chore.bed"]').click();assert.equal(await p.evaluate(()=>st.tracked().key),'chore.bed');
   await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>House.paused),false);
   await shot('02-bed-tracked');
   assert.deepEqual(await p.evaluate(()=>{const ids=new Set(StoryGuide.targets()),bad=[];House.scene.traverse(o=>{if(o.userData.questRim&&o.visible&&!ids.has(o.userData.questRim))bad.push(o.userData.questRim)});return bad}),[]);
   const calm=await p.evaluate(async()=>{const points=[];for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,40));const m=document.querySelector('.st-marker');points.push([parseFloat(m.style.left),parseFloat(m.style.top)])}return points});
   assert(Math.max(...calm.map(v=>v[0]))-Math.min(...calm.map(v=>v[0]))<3,'Idle marker jitters horizontally');
   assert(Math.max(...calm.map(v=>v[1]))-Math.min(...calm.map(v=>v[1]))<3,'Idle marker jitters vertically');
   await refresh();assert.equal(await p.evaluate(()=>st.tracked().key),'chore.bed');
   await p.keyboard.press('j');await p.keyboard.press('Escape');assert(!await p.locator('.st-quests').isVisible());assert(!await p.evaluate(()=>HousePause.open));
   await p.keyboard.press('j');await p.keyboard.press('Home');assert.equal(await p.evaluate(()=>document.activeElement.dataset.quest),'story');await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>st.tracked().key),'story');
  }
  const mess=await p.evaluate(()=>ChoreCat.tidyFor(ChoreKit.day(),true));
  const split=scenario==='half-tidy-bed'?Math.floor(mess.length/2):0;
  async function tidyRange(a,b){
   for(const m of mess.slice(a,b)){await drop('ch.m.'+m.id,{clothes:'ch.s.basket',rubbish:'ch.s.bin',dish:'ch.s.sink'}[m.kind]);await p.waitForTimeout(1800)}
  }
  if(scenario==='bin-first')await bin();
  await tidyRange(0,split);
  if(scenario==='half-tidy-bed'){
   await shot('03-tidy-half');
   await p.evaluate(()=>st.track('chore.bed'));
  }
  if(scenario!=='bin-first')await bed();
  if(scenario==='bed-bin-first')await bin();
  await refresh();
  assert.equal(await p.evaluate(()=>!!st.getState().done.bed),scenario!=='bin-first');
  if(scenario==='half-tidy-bed'){
   assert.equal(await p.evaluate(()=>st.current().id),'tidy');assert.equal(await p.evaluate(()=>st.tracked().key),'story');
   assert(!await p.evaluate(()=>StoryGuide.targets().includes('ch.pjs')));
   // Light/dark and both desktop sizes; centre remains clear while turning.
   for(const [w,h] of [[1366,860],[1920,1080],[390,844],[844,390]]){
    await p.setViewportSize({width:w,height:h});
    await aim([30,-55,195],[30,-20,310]);await p.waitForTimeout(700);await shot('04-edge-'+w+'x'+h);
    const box=await p.locator('.st-marker').boundingBox();
    if(box){assert(box.x>=0&&box.x+box.width<=w+1);assert(box.y>=80&&box.y+box.height<h-70);assert(!(box.x<w/2&&box.x+box.width>w/2&&box.y<h/2&&box.y+box.height>h/2),'Marker covers the centre')}
   }
   await p.setViewportSize({width:1366,height:860});
   await aim([30,-55,195],[65,38,130]);await p.waitForTimeout(800);await shot('05-tidy-near');
   await p.evaluate(()=>StoryGuide.setting('off'));await p.waitForTimeout(150);assert(!await p.locator('.st-marker').isVisible());
   assert.equal(await p.evaluate(()=>{let n=0;House.scene.traverse(o=>{if(o.userData.questRim&&o.visible)n++});return n}),0);
   await p.evaluate(()=>StoryGuide.setting('full'));
   await p.keyboard.press('j');await p.keyboard.press('j');await p.keyboard.press('j');await p.keyboard.press('Escape');assert(!await p.evaluate(()=>House.paused));
  }
  await tidyRange(split,mess.length);await done('tidy');
  if(scenario==='bin-first')await bed();
  if(scenario==='half-tidy-bed')await bin();
  if(scenario!=='half-tidy-bed')await lad();
  await until(()=>st.current()?.id==='dad');
  assert.equal(await p.evaluate(()=>st.getState().trust),3);
  assert(!await p.evaluate(()=>StoryGuide.targets().includes('ch.pjs')));
  await refresh();assert.equal(await p.evaluate(()=>st.current().id),'dad');
  // No bounds helpers or wireframe materials were created by guidance.
  assert.deepEqual(await p.evaluate(()=>{const bad=[];House.scene.traverse(o=>{if(o.type==='BoxHelper'||o.type==='Box3Helper'||o.userData.questRim&&o.material.wireframe)bad.push(o.type)});return bad}),[]);
  if(scenario==='half-tidy-bed'){
   await aim([30,-55,195],[30,-20,310]);await p.waitForTimeout(900);await shot('06-dad-marker');
   await p.keyboard.press('Escape');assert(!await p.locator('.st-marker').isVisible());await p.keyboard.press('Escape');
   await p.evaluate(()=>House.interact('st.diary'));await until(()=>!!Magazines.reading);assert(!await p.locator('.st-marker').isVisible());await shot('07-reader-clean');await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
   await p.evaluate(async()=>{House.putBack();House.saveWalkState();await Roam.syncNow()});
   savedStorage=await p.context().storageState();
   await writeFile('/tmp/jhp-quest-ux-browser.json',JSON.stringify(savedStorage));
  }
  assert.deepEqual(f.errors,[]);console.log('STORY ORDER BROWSER PASS:',scenario);
 }catch(e){console.error('Scenario failure:',e);await p.screenshot({path:shots+scenario+'-failure.png'}).catch(()=>{});console.log(await p.evaluate(()=>({story:window.st?.getState(),tracked:window.st?.tracked(),targets:window.StoryGuide?.targets(),ch:window.ChoreKit?.S.prog,done:window.ChoreKit?.S.done,held:window.House?.held(),mode:window.House?.mode})));throw e}
 finally{await f.browser.close()}
}
if(savedStorage&&process.argv[4]!=='--skip-phone'){
 const {chromium}=await import('playwright');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});let phonePage=null;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',storageState:savedStorage});/* JackOS on a phone: the player's per-device JackOS-only choice (js/pc-only.js; the house is the default since 2026-10-26) */await context.addInitScript(()=>localStorage.setItem('jhp_device_view','jackos'));
  const p=await context.newPage(),errors=[];phonePage=p;p.on('pageerror',e=>errors.push(e.message));
  async function phoneUntil(fn){const end=Date.now()+90000;while(Date.now()<end){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed|Cannot find context/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('Phone state timeout: '+fn)}
  await p.goto(base,{waitUntil:'domcontentloaded'});
  await phoneUntil(()=>window.AccountGate?.allowed&&window.MobileDesktop&&window.DesktopSurface?.ready()&&!!window.st?.getState());
  await phoneUntil(()=>{if(!window.AccountGate?.allowed||!window.DesktopSurface?.ready()||!window.stDiary||!window.st?.getState())return false;if(!document.querySelector('.st-copy'))Apps.open('st.diary');return !!document.querySelector('.st-copy')});
  const pose=await p.evaluate(()=>['jhp_hs_pose','jhp_hs_stand','jhp_off'].map(k=>localStorage.getItem(k)));
  await p.getByRole('button',{name:'Things to do',exact:true}).tap();await p.screenshot({path:shots+'phone-picker-390x844.png'});
  assert(await p.locator('.st-quests').isVisible());
  await p.getByRole('button',{name:'Close diary',exact:true}).tap();assert(!await p.locator('.st-quests').isVisible());
  await p.setViewportSize({width:844,height:390});await p.getByRole('button',{name:'Things to do',exact:true}).tap();await p.screenshot({path:shots+'phone-picker-844x390.png'});assert.deepEqual(errors,[]);
  assert.deepEqual(await p.evaluate(()=>['jhp_hs_pose','jhp_hs_stand','jhp_off'].map(k=>localStorage.getItem(k))),pose,'Diary picker changed the house save');
  console.log('STORY ORDER PHONE PASS: portrait/landscape diary picker');
 }catch(e){if(phonePage){await phonePage.screenshot({path:shots+'phone-failure.png'}).catch(()=>{});console.log(await phonePage.evaluate(()=>({allowed:window.AccountGate?.allowed,ready:window.DesktopSurface?.ready(),mobile:!!window.MobileDesktop,copies:document.querySelectorAll('.st-copy').length,body:document.body.className,diaryRegistered:!!window.Apps?.apps?.['st.diary']})).catch(()=>({})));}throw e}finally{await browser.close()}
}
