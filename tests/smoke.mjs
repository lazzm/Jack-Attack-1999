// Deploy gate. Owns only disposable localhost state and the child server it starts.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const shots=fileURLToPath(new URL('shots/smoke/',import.meta.url));
const args=process.argv.slice(2), only=args.find(a=>a.startsWith('--only='))?.slice(7);
const keep=args.includes('--keep-shots');
const account='Smoke'+Date.now().toString(36),password='Throwaway-1999';
let registeredAccount=false;
let server, data, fixture, activeBrowser, base, log='', renderer='unavailable', results=[], draws=[];
const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// SMOKE_SCALE stretches every time budget (default: 1, or 2 automatically when the 1-minute load average exceeds the CPU count).
const OS=await import('node:os');
const SCALE=+process.env.SMOKE_SCALE||Math.max(1,Math.min(4,Math.round(OS.loadavg()[0]/OS.cpus().length*1.3*10)/10));
const reason=e=>String(e.message||e).replace(/\s+/g,' ').slice(0,320);
let cleanupPromise;
function cleanup(){return cleanupPromise ||= dispose()}
async function dispose(){
  if(activeBrowser){await activeBrowser.close().catch(()=>{});activeBrowser=null}
  if(server?.pid&&server.exitCode===null&&server.signalCode===null){
    const ended=once(server,'exit');server.kill('SIGTERM');
    const timer=setTimeout(()=>server.kill('SIGKILL'),1500);
    await ended;clearTimeout(timer);
  }
  if(data)await rm(data,{recursive:true,force:true});
}
let stopping=false;
async function stop(signal){if(stopping)return;stopping=true;console.log(`FAIL runner: ${signal}`);await cleanup();console.log(`SUMMARY ${results.filter(Boolean).length}/${results.length+1} passed; aborted=${signal}; renderer=${renderer}; draw calls: ${draws.join(', ')||'not sampled'}`);process.exit(1)}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>void stop(signal));
const watchdog=setTimeout(()=>void stop(`${400*SCALE}s total timeout`),400000*SCALE);
function observe(page){
  activeBrowser=page.context().browser();
  if(stopping){void activeBrowser.close();return;}
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.setDefaultTimeout(8000*SCALE);
}
async function room(){
  if(!fixture){
    if(!registeredAccount){
      const registered=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});
      assert(registered.ok,'Admin registration failed: '+registered.status);registeredAccount=true;
    }
    fixture=await roomFixture(base,{account,password,signup:false,onPage:observe,timeoutScale:SCALE});fixture.page.setDefaultNavigationTimeout(60000*SCALE);
    renderer=await fixture.page.evaluate(()=>{const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unavailable'});
  }
  return fixture;
}
async function wait(page,fn,ms=8000){const deadline=Date.now()+ms*SCALE;while(Date.now()<deadline){
  // (a first logon on a new device may reload once to apply the account's profile: js/roam.js)
  try{if(await page.evaluate(fn))return}catch(e){if(!/context was destroyed|navigation/i.test(e.message))throw e}
  await page.waitForTimeout(100)}throw Error('State timeout: '+fn+'; '+JSON.stringify(await page.evaluate(()=>({mode:window.House?.mode,held:window.House?.held?.(),phone:window.FamilyPhone?.state?.()}))))}
async function until(fn){const {page}=await room();await wait(page,fn)}
async function aim(eye,target){const f=await room();await f.view(eye,target);await f.page.evaluate(()=>{House.hush();House._.setMode('walk')})}
// Save timestamps advance while the desktop is open; compare the actual pose and power.
async function houseSave(page){return page.evaluate(()=>{
  const pose=JSON.parse(localStorage.getItem('jhp_hs_pose')||'null');if(pose)delete pose.t;
  return{pose,stand:JSON.parse(localStorage.getItem('jhp_hs_stand')||'null')?.p,power:localStorage.getItem('jhp_off')};
})}
async function reload(){const {page}=await room();await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'))}
const checks=[
 ['sparse-signup',90000,async()=>{
   let sparse;
   try{
     sparse=await roomFixture(base,{onPage:observe,opening:true,timeoutScale:SCALE});
     const {page}=sparse;
     assert.equal(await page.evaluate(()=>localStorage.getItem('jhp_starter')),'1');
     assert(await page.evaluate(()=>House.mode==='walk'&&!House.pcGL.visible&&!document.body.classList.contains('pc-monitor')),'New story player must start without a PC or screen layer');
     assert(await page.evaluate(()=>House.THINGS.gb?.obj.visible),'Game Lad missing');
     assert.deepEqual(await page.evaluate(()=>['n64','ps','md','dc'].filter(id=>House.SPOTS[id]||House.THINGS[id])),[],'Sparse room contains consoles');
     assert.deepEqual(await page.evaluate(()=>PM.items().map(item=>item.id).sort()),['pm.mag.01','pm.mag.02']);
     assert(await page.evaluate(()=>['pmb.pm.mag.01','pmb.pm.mag.02'].every(id=>House.THINGS[id]?.obj.visible)),'Starter magazine models missing');
     await sparse.view([-80,-55,180],[-185,40,-25]);
     if(keep)await page.screenshot({path:shots+'sparse-signup.png'});
     assert.deepEqual(sparse.errors,[],'Sparse signup browser errors');
   }finally{if(sparse)await sparse.browser.close();activeBrowser=fixture?.browser}
 }],
 ['account-house',90000,async()=>{
   const {page}=await room();
   renderer=await page.evaluate(()=>{const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');if(gl.isContextLost())throw Error('WebGL context lost');if(!ext)throw Error('UNMASKED_RENDERER unavailable');return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))});
   assert(await page.evaluate(()=>Net.me.member&&House.live&&House.ren.domElement.width>0));
   assert(await page.evaluate(()=>localStorage.getItem('jhp_starter')!=='1'&&['n64','ps','md','dc'].every(id=>!!House.SPOTS[id])),'Existing player lost the full room');
   assert(await page.evaluate(()=>{const a=__jhpDebug();a.camera.x=999999;return __jhpDebug().camera.x!==999999&&Number.isFinite(a.renderer.calls)&&!!a.version}),'Debug snapshot invalid');
 }],
 ['walk-refresh',90000,async()=>{
   const {page}=await room();await aim([40,-55,180],[40,-55,-20]);
   const before=await page.evaluate(()=>[House.W.x,House.W.z]);
   for(const key of ['w','a','s','d']){await page.keyboard.down(key);await page.waitForTimeout(180);await page.keyboard.up(key)}
   await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');
   await until(()=>Math.hypot(House.W.vx,House.W.vz)<1);
   const walked=await page.evaluate(()=>[House.W.x,House.W.z]);assert(Math.hypot(walked[0]-before[0],walked[1]-before[1])>5,'WASD did not move player');
   await page.waitForTimeout(500);await reload();
   const after=await page.evaluate(()=>({mode:House.mode,p:[House.W.x,House.W.z]}));
   assert.equal(after.mode,'walk');assert(Math.hypot(after.p[0]-walked[0],after.p[1]-walked[1])<1,`Refresh changed walking pose: ${JSON.stringify(walked)} -> ${JSON.stringify(after.p)}`);
 }],
 ['pc-controls',20000,async()=>{
   const {page}=await room();await aim([40,-55,155],[-15,-24,0]);await page.keyboard.press('f');
   await until(()=>House.mode==='monitor'&&!House.gliding&&DesktopSurface.ready());
   await page.evaluate(async()=>{await Apps.open('notepad')});
   assert.equal(await page.locator('.appwin').count(),1);
   await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('t');await until(()=>House.desktopDisplay());
   await page.keyboard.press('t');assert(!await page.evaluate(()=>House.desktopDisplay()));
   await page.evaluate(()=>document.querySelector('.appwin [data-w=close]').click());assert.equal(await page.locator('.appwin').count(),0);
   await page.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
   await aim([40,-55,155],[-15,-24,0]);await page.keyboard.press('f');await until(()=>House.mode==='monitor'&&!House.gliding);
   await page.keyboard.press('F2');await until(()=>House.mode==='walk'&&!House.gliding);
 }],
 ['console-game',20000,async()=>{
   const {page}=await room();
   const home=await page.evaluate(()=>House.THINGS['media.box.n64.kart'].at);
   await aim([-220,-55,35],[home.x,home.y-6,-36]);await page.keyboard.press('e');await until(()=>House.held()==='media.box.n64.kart');
   await aim([-80,-55,220],[-130,73,145]);await page.keyboard.press('e');await until(()=>House.THINGS['media.box.n64.kart'].st==='rest');
   await aim([-80,-55,220],[-130,67,146.6]);await page.keyboard.press('f');await until(()=>House.THINGS['media.box.n64.kart'].caseOpen);
   await aim([-80,-55,220],[-130,69,146.3]);await page.keyboard.press('e');await until(()=>House.held()==='media.n64.kart');
   const slot=await page.evaluate(()=>House.SNAPS['console.n64']);await aim([-185,-55,120],[slot.x,slot.y,slot.z]);await page.keyboard.press('e');
   await until(()=>window.RoomTV?._dbg()?.st==='game');await page.keyboard.press('Enter');await page.keyboard.down('ArrowUp');await page.waitForTimeout(600);await page.keyboard.up('ArrowUp');
   assert.equal(await page.evaluate(()=>RoomTV._dbg().gid),'n64.kart');
   await page.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);assert(await page.evaluate(()=>RoomTV._dbg().background));
 }],
 ['phone-typing',15000,async()=>{
   const {page}=await room();await page.evaluate(()=>HouseMobile.use());await until(()=>window.FamilyPhone?.isOpen()&&House.focused&&!House.gliding);console.log('phone-typing: focused');
   await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.press('Enter');await until(()=>FamilyPhone.state().id==='edit');console.log('phone-typing: editor');
   await page.keyboard.type('wasd saw dad');assert.equal(await page.evaluate(()=>FamilyPhone.state().text),'wasd saw dad','House movement swallowed phone letters');console.log('phone-typing: text accepted');
   await page.keyboard.press('Escape');await page.locator('[data-pause=leave]').click();await until(()=>House.mode==='walk'&&!House.gliding);console.log('phone-typing: left phone');
 }],
 ['prop-refresh',90000,async()=>{
   const {page}=await room();await aim([-100,-55,135],[-100,52,56]);await page.keyboard.press('e');await until(()=>House.held()==='beanbag');
   await aim([-100,-55,215],[-100,73,145]);await page.keyboard.press('e');await until(()=>!House.held()&&House.THINGS.beanbag.st==='rest');
   const at=await page.evaluate(()=>({...House.THINGS.beanbag.at}));await page.waitForTimeout(600);await reload();
   const restored=await page.evaluate(()=>House.THINGS.beanbag.at);assert.equal(restored.room,at.room);for(const key of ['x','y','z','ry'])assert(Math.abs((restored[key]||0)-(at[key]||0))<.6,`Prop refresh changed ${key}`);
 }],
 ['escape-menu',10000,async()=>{
   const {page}=await room();await page.keyboard.press('Escape');assert(await page.evaluate(()=>HousePause.open&&House.paused));
   const before=await page.evaluate(()=>[House.W.x,House.W.z]);await page.keyboard.down('w');await page.waitForTimeout(150);await page.keyboard.up('w');assert.deepEqual(await page.evaluate(()=>[House.W.x,House.W.z]),before);
   await page.keyboard.press('Escape');assert(!await page.evaluate(()=>HousePause.open||House.paused));
 }],
 ['canonical-views',90000,async()=>{
   const f=await room(),{page}=f;await mkdir(shots,{recursive:true});
   await page.evaluate(()=>Room.ensureHouse());await until(()=>window.HouseRooms?.ready);
   // Fixed world coordinates, fixed 14:00 daylight, low tier, identical desktop viewport.
   const views=[
     ['bedroom-door',[205,-55,220],[0,-15,10],'U'],
     ['desk-pc',[65,-55,140],[-15,-24,0],'U'],
     ['tv-consoles',[-120,-55,160],[-216,-5,-16],'U'],
     ['landing-stairs',[300,-85,175],[370,220,520],'U'],
     ['kitchen',[120,205,260],[-60,287,170],'G'],
     ['front-garden',[80,95,1950],[60,25,700],'G',[220,195,1040]],
   ];
   await page.evaluate(()=>{RoomTV.close();for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)});
   for(const [name,eye,target,level,roomPoint=eye]of views){
     await f.view(eye,target,{level,roomPoint});await page.evaluate(()=>House.dirty());await page.waitForTimeout(180);
     const debug=await page.evaluate(()=>__jhpDebug());assert(debug.renderer.calls>0,`${name}: empty render`);
     draws.push(`${name}=${debug.renderer.calls}`);await page.screenshot({path:shots+name+'.png',timeout:30000*SCALE,style:'.hs-toast,.balloon { visibility: hidden !important; }'}); // (the exterior view is the slowest software-rendered capture)
   }
 }],
 ['mobile-desktop',120000,async()=>{
   // Device policy (2026-10-26): a phone plays the whole game. It gets the 3D house with touch controls and the phone
   // sharp look, sharing the account's saves and PC power state; JackOS on its own is only the player's chosen fallback.
   const {browser,page:desktop}=await room();
   await desktop.evaluate(()=>{
     House.hush();House._.setMode('focus');
     localStorage.setItem('jhp_hs_stand',JSON.stringify({t:Date.now(),p:{x:101,y:-55,z:151,rx:0,ry:0,lvl:'U',seat:0}}));
     localStorage.setItem('jhp_off','1');
   });
   const saved=await houseSave(desktop),beanbag=await desktop.evaluate(()=>({...House.THINGS.beanbag.at}));
   // An autosave can already be uploading, or have used the save bucket. Confirm the real upload before switching devices.
   let uploaded=false;
   for(let attempt=0;attempt<3&&!uploaded;attempt++){
     uploaded=await desktop.evaluate(()=>Roam.syncNow());
     if(!uploaded&&attempt<2)await desktop.waitForTimeout(21000);
   }
   assert(uploaded,'Existing account profile did not upload after waiting for the save allowance');
   await desktop.close(); // This is the final room check; stop software WebGL before opening the phone.

   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
   const page=await context.newPage();observe(page);
   try{
     const house=()=>window.AccountGate?.allowed&&window.House?.ok&&House.live&&!document.querySelector('.hs-loading,#houseEntry');
     page.setDefaultNavigationTimeout(60000*SCALE);
     await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#accountGate form').waitFor({timeout:30000*SCALE});
     await page.locator('[name=name]').fill(account);await page.locator('[name=password]').fill(password);await page.locator('#accountGate [type=submit]').tap();
     await wait(page,house,40000);await page.waitForTimeout(1500);await wait(page,house,40000);
     const state=await page.evaluate(()=>({handheld:PCOnly.handheld,jackos:PCOnly.desktopOnly,touch:GameInput.touch,tier:House.Q.tier,sharp:House.Q.pixelRatio>=Math.min(devicePixelRatio,1.75)*.85-1e-6,hud:!!document.querySelector('.ht-hud')}));
     assert.deepEqual(state,{handheld:true,jackos:false,touch:true,tier:'high',sharp:true,hud:true},'Phone must get the house with touch controls and the one sharp look');
     // The same account's room on the phone: the beanbag the desktop moved (prop-refresh) is where the desktop left it.
     const moved=await page.evaluate(()=>({...House.THINGS.beanbag.at}));
     for(const key of ['x','z','ry'])assert(Math.abs((moved[key]||0)-(beanbag[key]||0))<.6,`Phone room differs from the desktop save: beanbag ${key}`);
     if(keep)await page.screenshot({path:shots+'mobile-portrait.png'});
     await page.setViewportSize({width:844,height:390});await page.waitForTimeout(800);assert(await page.evaluate(()=>House.live&&!House.ren.getContext().isContextLost()));
     if(keep)await page.screenshot({path:shots+'mobile-landscape.png'});
     // (refresh mid-walk, touch walking and every phone/tablet layout: tests/mobile.mjs)
     // The player's own choice of JackOS only (a weak phone): no house is built, no room save is written.
     await page.evaluate(()=>{PCOnly.choose('jackos');House.saveWalkState()});const chosen=await houseSave(page);
     await page.reload({waitUntil:'domcontentloaded'});
     await wait(page,()=>window.AccountGate?.allowed&&window.MobileDesktop&&window.DesktopSurface?.ready(),20000);
     assert.equal(await page.locator('#boot,.hs-gl,.hs-gl2,.hs-ui,.ht-hud,.hs-getup').count(),0);
     assert(await page.evaluate(()=>!window.Room&&!window.House?.ok&&!document.pointerLockElement));
     assert.deepEqual(await houseSave(page),chosen,'JackOS-only changed the account house save');
     await page.evaluate(()=>PCOnly.choose('house'));
   }finally{await context.close()}
 }],
 ['browser-errors',5000,async()=>{assert.equal(errors.length,0,errors.join(' | '))}],
 ['server-log',5000,async()=>{assert(!/mod failed to load|unhandled|fatal/i.test(log),log.split('\n').filter(l=>/mod failed to load|unhandled|fatal/i.test(l)).join(' | '));assert(server.exitCode===null&&server.signalCode===null,'Server exited unexpectedly')}],
];

async function start(){
  data=await mkdtemp('/tmp/jhp-smoke-');
  for(let port=18080;port<=18099;port++){
    const free=await new Promise(resolve=>{const probe=net.createServer();probe.once('error',()=>resolve(false));probe.listen(port,'127.0.0.1',()=>probe.close(()=>resolve(true)))});
    if(!free)continue;
    let output='';
    server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
    let spawnError;server.on('error',e=>{spawnError=e});
    for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{output+=chunk;log+=chunk});
    base=`http://127.0.0.1:${port}`;
    for(let i=0;i<100;i++){
      if(spawnError)throw spawnError;
      if(server.exitCode!==null){if(/EADDRINUSE/.test(output))break;throw Error('Server startup: '+reason(output))}
      // Only probe HTTP after our child reports listening, avoiding port-race false readiness.
      if(output.includes(`online at :${port}`)){const r=await fetch(base,{signal:AbortSignal.timeout(1000)});if(r.ok)return}
      await delay(100);
    }
    if(server.exitCode===null)throw Error('Server readiness timeout');
  }
  throw Error('No free throwaway port in 18080-18099');
}
try{
  assert(args.every(a=>a==='--keep-shots'||a.startsWith('--only=')),'Usage: node smoke.mjs [--keep-shots] [--only=<name>]');
  assert(!only||checks.some(([name])=>name===only),'Unknown check '+only+'; names: '+checks.map(c=>c[0]).join(', '));
  await start();
  if(!keep)await rm(shots,{recursive:true,force:true});await mkdir(shots,{recursive:true});
  for(const [name,timeout,run]of checks){
    if(stopping)break;
    if(only&&name!==only)continue;
    const began=Date.now();let timer;
    try{
      if(!fixture&&!['sparse-signup','account-house','browser-errors','server-log'].includes(name)){
        await Promise.race([room(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`${60*SCALE}s room setup timeout`)),60000*SCALE)})]);clearTimeout(timer);
      }
      await Promise.race([run(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`${timeout*SCALE/1000}s timeout`)),timeout*SCALE)})]);
      results.push(true);console.log(`PASS ${name} (${((Date.now()-began)/1000).toFixed(1)}s)`);
    }catch(e){
      results.push(false);console.log(`FAIL ${name}: ${reason(e)}`);
      const failedPage=fixture?.page||activeBrowser?.contexts()[0]?.pages()[0];
      if(failedPage){
        const state=await Promise.race([failedPage.evaluate(()=>({mode:window.House?.mode,focus:!!window.House?.focused,paused:!!window.House?.paused,loading:!!document.querySelector('.hs-loading,#houseEntry'),gate:!!document.querySelector('#accountGate'),phone:window.FamilyPhone?.state?.().id,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.className)})).catch(()=>null),delay(3000)]);
        console.log('Failure state',name,state);
        if(keep)await failedPage.screenshot({path:shots+`failure-${name}.png`,timeout:15000}).catch(()=>{});
      }
      // Closing the page cancels any in-flight Playwright operation before the next check.
      if(activeBrowser)await activeBrowser.close().catch(()=>{});activeBrowser=null;fixture=null;
    }finally{clearTimeout(timer)}
  }
}catch(e){results.push(false);console.log(`FAIL runner: ${reason(e)}`)}
finally{clearTimeout(watchdog);await cleanup()}
console.log(`SUMMARY ${results.filter(Boolean).length}/${results.length} passed; renderer=${renderer}; draw calls: ${draws.join(', ')||'not sampled'}`);
process.exitCode=results.every(Boolean)&&results.length>0?0:1;
