// R180: two powered screens must LOCK IN the one the player is using.
// Disposable localhost only. --before records the original defect without asserting the fix.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {devices} from 'playwright';
const base=process.argv[2],before=process.argv.includes('--before'),powerOnly=process.argv.includes('--power-only');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=new URL('shots/games-1102/',import.meta.url).pathname;
await mkdir(shots,{recursive:true});
const account='Focus'+Date.now().toString(36),password='Throwaway-1999';
const profile=process.argv.find(a=>a.startsWith('--profile='))?.split('=')[1];
for(const touch of (before?[false]:[false,true]).filter(t=>!profile||profile===(t?'phone':'desktop'))){
 const deviceAccount=account+(touch?'P':'D');
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:deviceAccount,pass:password})})).ok);
 const f=await roomFixture(base,{account:deviceAccount,password,signup:false,touch,width:touch?412:1366,height:touch?915:860,timeoutScale:1.5,debug:true,onPage:async p=>{
  if(touch){const c=await p.context().newCDPSession(p);await c.send('Emulation.setUserAgentOverride',{userAgent:devices['Pixel 7'].userAgent,platform:'Android'});await c.send('Emulation.setDeviceMetricsOverride',{width:412,height:915,deviceScaleFactor:1,mobile:true});}
 }});
 const {page:p,until}=f,tag=(before?'before':'after')+'-'+(touch?'phone':'desktop');
 const shot=async name=>p.screenshot({path:shots+tag+'-'+name+'.png'});
 try{
  console.log(tag,'room ready');await p.evaluate(()=>Apps.load('js/rm-tv.js'));console.log(tag,'TV loaded');
  if(!before){await p.evaluate(()=>{Net.send({t:'rmFind',id:'cart.ps.grav'});Net.send({t:'rmMe'})});await until(()=>Room.owned('ps.grav'));await p.evaluate(()=>Room.syncMedia());}
  if(before){await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor'&&!House.gliding)}
  await p.evaluate(()=>RoomTV.test('ps.grav'));
  await until(()=>RoomTV._dbg()?.st==='game');console.log(tag,'cartridge running',await p.evaluate(()=>House.mode));
  await until(()=>!House.gliding);
  if(!before){await p.evaluate(()=>RoomTV.close());await until(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>House.act('ps'));}
  await until(()=>RoomTV.open_&&!House.gliding);
  // QA's direct cartridge launch left the legacy PC camera following its boot
  // model. Reproduce that reported state explicitly; normal use is checked below.
  if(before)await p.evaluate(()=>House._.setMode('follow'));
  console.log(tag,'before lock',await p.evaluate(()=>({mode:House.mode,pc:document.body.classList.contains('pc-monitor'),active:ScreenLock.current})));
  await p.keyboard.press('t');await p.waitForTimeout(1200);await shot('tv-pc-on-lock');
  const locked=await p.evaluate(()=>({console:RoomTV.lockIn(),active:ScreenLock.current?.type}));
  console.log(tag,locked);
  if(before){assert.equal(locked.console,false,'Original R180 must reproduce');}
  else {assert.equal(locked.console,true);assert.equal(locked.active,'console');}
  if(!before){
   const wait=async(fn,arg)=>{const end=Date.now()+120000;while(Date.now()<end){if(await p.evaluate(fn,arg))return;await p.waitForTimeout(150)}throw Error('Timeout '+fn)};
   const press=async selector=>{const r=await p.locator(selector).boundingBox();assert(r,selector);if(touch)await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await p.locator(selector).click()};
   const lock=async()=>{
    const was=await p.evaluate(()=>RoomTV.lockIn());
    if(!touch){await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press('t')}
    else {await press('.rm-tvv.on .rm-menu');await wait(()=>HousePause.open);await press('.hs-pause [name=desktopFull]');await press('.hs-pause [data-pause=resume]')}
    await p.waitForTimeout(800);
    assert.equal(await p.evaluate(()=>RoomTV.lockIn()),!was,'LOCK IN changes the active TV, including after reopening its menu');
   };
   const back=async()=>{if(touch)await press('.rm-tvv.on .rm-lean');else await p.keyboard.press('q');await wait(()=>House.mode==='walk'&&!House.gliding&&!!RoomTV._dbg()?.background)};
   const tv=async con=>{console.log(tag,'focus TV',con);await p.evaluate(con=>House.act(con),con);await wait(()=>House.mode==='focus'&&RoomTV.open_&&!House.gliding&&RoomTV._dbg()?.st==='game')};
   const reload=async(mode,off)=>{
    console.log(tag,'refresh expects',mode,off);await p.evaluate(()=>House.saveWalkState());await p.reload({waitUntil:'domcontentloaded'});
    await wait(()=>!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));
    await wait(mode=>House.mode===mode&&!House.gliding,mode);
    assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')==='1'),off,'Refresh preserves PC power');
   };
   const resumeMenu=async()=>{await p.waitForTimeout(250);if(await p.evaluate(()=>HousePause.open))await press('.hs-pause [data-pause=resume]')};
   if(!powerOnly){
   // PC preference on/off cannot redirect the TV's lock. Running instance survives.
   await p.evaluate(()=>window.focusGame=RoomTV.dbg());
   for(const full of [false,true]){
    await p.evaluate(full=>House.desktopDisplay(full),full);
    if(await p.evaluate(()=>RoomTV.lockIn()))await lock();
    await lock();assert(await p.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg()===focusGame));
    assert.equal(await p.evaluate(()=>House.desktopDisplay()),full);
    await lock();assert(!await p.evaluate(()=>RoomTV.lockIn()));
   }
   await lock();await shot('tv-first-lock');
   if(touch){await p.setViewportSize({width:915,height:412});await p.waitForTimeout(500);await shot('tv-landscape');await p.setViewportSize({width:412,height:915});}
   console.log(tag,'leave and refocus TV');await back();await tv('ps');await lock();
   console.log(tag,'reload TV');await reload('focus',false);await wait(()=>window.RoomTV?._dbg()?.st==='game');await shot('tv-refresh');assert(await p.evaluate(()=>RoomTV.lockIn()),'TV LOCK IN survives refresh');
   await back();
   // TV stays powered in the background while PC owns input and LOCK IN.
   await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding);
   assert.equal(await p.evaluate(()=>ScreenLock.current.type),'pc');
   for(const full of [false,true]){await p.evaluate(full=>House.desktopDisplay(full),full);assert.equal(await p.evaluate(()=>ScreenLock.current.locked),full);assert(!await p.evaluate(()=>RoomTV.open_));}
   console.log(tag,'reload PC with TV on');await reload('monitor',false);assert(await p.evaluate(()=>House.desktopDisplay()));await shot('pc-tv-on-refresh');
   await p.keyboard.press('q');await wait(()=>House.mode==='walk'&&!House.gliding);
   // PC first, then a different bedroom-TV console, with PC's lock preference retained.
   await p.evaluate(()=>RoomTV.close(true));await p.waitForTimeout(400);
   await p.evaluate(()=>RoomTV.test('n64.kart'));await wait(()=>RoomTV._dbg()?.st==='game');
   await p.evaluate(()=>RoomTV.close());await tv('n64');
   await lock();assert.equal(await p.evaluate(()=>ScreenLock.current.type),'console');await shot('pc-first-kart-lock');await back();
   // Shut JackOS down through its real form, leaving the TV powered.
   await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding);
   await p.evaluate(()=>{document.getElementById('smShutdown').click();document.querySelector('input[name=sd][value=off]').checked=true;document.querySelector('input[name=sd]').form.requestSubmit()});
   await wait(()=>document.body.classList.contains('pc-power')&&House.mode==='walk'&&!House.gliding);
   assert(await p.evaluate(()=>localStorage.getItem('jhp_off')==='1'));
   await tv('n64');await lock();assert(await p.evaluate(()=>RoomTV.lockIn()));await shot('pc-off-tv-lock');
   console.log(tag,'reload TV, PC off');await reload('focus',true);await wait(()=>!!window.RoomTV?.open_&&RoomTV.lockIn());await shot('pc-off-tv-refresh');await back();
   await p.evaluate(()=>RoomTV.close(true));await wait(()=>!RoomTV.open_);assert(!await p.evaluate(()=>ScreenLock.available),'Both screens off');
   }else{
    await p.evaluate(()=>RoomTV.close(true));await wait(()=>House.mode==='walk'&&!House.gliding);await resumeMenu();
    await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding);
    await p.evaluate(()=>{document.getElementById('smShutdown').click();document.querySelector('input[name=sd][value=off]').checked=true;document.querySelector('input[name=sd]').form.requestSubmit()});
    await wait(()=>document.body.classList.contains('pc-power')&&House.mode==='walk'&&!House.gliding);
   }
   // The opposite power order: start the TV while the PC is off, leave its
   // game running, then boot JackOS and return to that same TV instance.
   if(await p.evaluate(()=>HousePause.open))await p.keyboard.press('Escape');
   console.log(tag,'power TV first, PC off');
   await p.evaluate(()=>RoomTV.test('n64.kart'));await resumeMenu();await wait(()=>RoomTV._dbg()?.st==='game');
   await p.evaluate(()=>RoomTV.close());await tv('n64');await back();
   await p.evaluate(()=>window.powerOrderGame=RoomTV.dbg());
   await p.evaluate(()=>document.querySelector('#bootPower .powerbtn').click());
   await wait(()=>House.mode==='monitor'&&!House.gliding&&!localStorage.getItem('jhp_off'));
   assert.equal(await p.evaluate(()=>ScreenLock.current.type),'pc');
   assert(await p.evaluate(()=>RoomTV._dbg().background&&RoomTV.dbg()===powerOrderGame),'PC boot preserves the powered TV');
   await p.keyboard.press('q');await wait(()=>House.mode==='walk'&&!House.gliding);await tv('n64');await lock();await shot('tv-powered-first');await back();
   await p.evaluate(()=>RoomTV.close(true));await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding);
   await p.evaluate(()=>House.desktopDisplay(false));await p.waitForTimeout(350);assert(!await p.evaluate(()=>House.desktopDisplay()),'Delayed phone arrival must respect the newer In room choice');console.log(tag,'PC room choice before refresh',await p.evaluate(()=>({full:House.desktopDisplay(),saved:localStorage.getItem('jhp_hs_desktop_full'),boot:window.JHPBoot})));await reload('monitor',false);await p.waitForTimeout(400);await shot('pc-tv-off-refresh');assert(!await p.evaluate(()=>House.desktopDisplay()),'PC In room survives refresh');
   // Exact stale-class/follow state from QA, including the old PC-full preference.
   await p.evaluate(()=>{House.desktopDisplay(false);RoomTV.test('ps.grav')});await wait(()=>RoomTV._dbg()?.st==='game');
   await p.evaluate(()=>House._.setMode('follow'));
   assert(await p.evaluate(()=>document.body.classList.contains('pc-monitor')));
   await p.keyboard.press('t');await p.waitForTimeout(800);assert(await p.evaluate(()=>RoomTV.lockIn()));assert(!await p.evaluate(()=>House.desktopDisplay()));await shot('qa-follow-state');
   await p.evaluate(()=>RoomTV.close(true));
   console.log('SCREEN FOCUS PASS '+tag+(powerOnly?': TV-first power, PC boot, same running game, saved PC In room and staged QA focus':': TV/PC first, both PC preferences, PC on/off, TV on/off, reload focused PC/TV, one-press Q, same game, phone rotation and touch menu'));
  }
  assert.deepEqual(f.errors,[]);
 }catch(e){await shot('failure');throw e}finally{await f.browser.close()}
}
