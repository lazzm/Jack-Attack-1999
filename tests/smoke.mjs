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
let server, data, fixture, activeBrowser, base, log='', renderer='unavailable', results=[], draws=[];
const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
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
const watchdog=setTimeout(()=>void stop('180s total timeout'),180000);
function observe(page){
  activeBrowser=page.context().browser();
  if(stopping){void activeBrowser.close();return;}
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.setDefaultTimeout(8000);
}
async function room(){
  if(!fixture){
    fixture=await roomFixture(base,{onPage:observe});fixture.page.setDefaultNavigationTimeout(20000);
    renderer=await fixture.page.evaluate(()=>{const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'unavailable'});
  }
  return fixture;
}
async function wait(page,fn){const deadline=Date.now()+8000;while(Date.now()<deadline){if(await page.evaluate(fn))return;await page.waitForTimeout(100)}throw Error('State timeout: '+fn+'; '+JSON.stringify(await page.evaluate(()=>({mode:window.House?.mode,held:window.House?.held?.(),phone:window.FamilyPhone?.state?.()}))))}
async function until(fn){const {page}=await room();await wait(page,fn)}
async function aim(eye,target){const f=await room();await f.view(eye,target);await f.page.evaluate(()=>{House.hush();House._.setMode('walk')})}
async function reload(){const {page}=await room();await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'))}
const checks=[
 ['account-house',60000,async()=>{
   const {page}=await room();
   renderer=await page.evaluate(()=>{const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');if(gl.isContextLost())throw Error('WebGL context lost');if(!ext)throw Error('UNMASKED_RENDERER unavailable');return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))});
   assert(await page.evaluate(()=>Net.me.member&&House.live&&House.ren.domElement.width>0));
   assert(await page.evaluate(()=>{const a=__jhpDebug();a.camera.x=999999;return __jhpDebug().camera.x!==999999&&Number.isFinite(a.renderer.calls)&&!!a.version}),'Debug snapshot invalid');
 }],
 ['walk-refresh',35000,async()=>{
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
   const {page}=await room();await page.evaluate(()=>HouseMobile.use());await until(()=>window.FamilyPhone?.isOpen()&&House.focused&&!House.gliding);
   await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.press('Enter');await until(()=>FamilyPhone.state().id==='edit');
   await page.keyboard.type('wasd saw dad');assert.equal(await page.evaluate(()=>FamilyPhone.state().text),'wasd saw dad','House movement swallowed phone letters');
   await page.keyboard.press('Escape');await page.locator('[data-pause=leave]').click();await until(()=>House.mode==='walk'&&!House.gliding);
 }],
 ['prop-refresh',35000,async()=>{
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
 ['canonical-views',35000,async()=>{
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
     draws.push(`${name}=${debug.renderer.calls}`);await page.screenshot({path:shots+name+'.png',style:'.hs-toast,.balloon { visibility: hidden !important; }'});
   }
 }],
 ['mobile-desktop',25000,async()=>{
   const {browser}=await room();
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
   const page=await context.newPage();observe(page);
   try{
     await page.addInitScript(()=>{if(!localStorage.getItem('smoke_mobile')){localStorage.setItem('jhp_hs_stand','{"x":101,"z":151,"lvl":"U","seat":0}');localStorage.setItem('jhp_off','1');localStorage.setItem('smoke_mobile','1')}});
     const noRoom=async()=>{assert.equal(await page.locator('#boot,.hs-gl,.hs-gl2,.hs-ui,.hs-joy,.pc-touch,.hs-getup').count(),0);assert(await page.evaluate(()=>!window.Room&&!window.House?.ok&&!document.pointerLockElement));assert.equal(await page.evaluate(()=>localStorage.getItem('jhp_hs_stand')),'{"x":101,"z":151,"lvl":"U","seat":0}');assert.equal(await page.evaluate(()=>localStorage.getItem('jhp_off')),'1')};
     await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#accountGate form').waitFor();await noRoom();
     await page.locator('#accountGate [data-switch]').tap();await page.locator('[name=name]').fill('MobileSmoke');await page.locator('[name=password]').fill('Throwaway-1999');await page.locator('[name=confirm]').fill('Throwaway-1999');await page.locator('#accountGate [type=submit]').tap();
     const ready=()=>window.AccountGate?.allowed&&window.MobileDesktop&&window.DesktopSurface?.ready();await wait(page,ready);await noRoom();
     if(keep)await page.screenshot({path:shots+'mobile-portrait.png'});
     await page.setViewportSize({width:844,height:390});await page.keyboard.press('F2');await noRoom();
     if(keep)await page.screenshot({path:shots+'mobile-landscape.png'});
     await page.reload({waitUntil:'domcontentloaded'});await wait(page,ready);await noRoom();
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
      if(!fixture&&!['account-house','browser-errors','server-log'].includes(name)){
        await Promise.race([room(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('60s room setup timeout')),60000)})]);clearTimeout(timer);
      }
      await Promise.race([run(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`${timeout/1000}s timeout`)),timeout)})]);
      results.push(true);console.log(`PASS ${name} (${((Date.now()-began)/1000).toFixed(1)}s)`);
    }catch(e){
      results.push(false);console.log(`FAIL ${name}: ${reason(e)}`);
      if(keep&&fixture)await fixture.page.screenshot({path:shots+`failure-${name}.png`,timeout:1500}).catch(()=>{});
      // Closing the page cancels any in-flight Playwright operation before the next check.
      if(activeBrowser)await activeBrowser.close().catch(()=>{});activeBrowser=null;fixture=null;
    }finally{clearTimeout(timer)}
  }
}catch(e){results.push(false);console.log(`FAIL runner: ${reason(e)}`)}
finally{clearTimeout(watchdog);await cleanup()}
console.log(`SUMMARY ${results.filter(Boolean).length}/${results.length} passed; renderer=${renderer}; draw calls: ${draws.join(', ')||'not sampled'}`);
process.exitCode=results.every(Boolean)&&results.length>0?0:1;
