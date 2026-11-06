// Camera fixtures must finish close-up returns and mouse-lock releases before
// resuming walk mode. A delayed browser release used to open the pause menu.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
await withTestServer(async base=>{
 const account='Camera'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const dir=new URL('./shots/light/round4/',import.meta.url);await mkdir(dir,{recursive:true});
 const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,account,{x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0})});const p=f.page;
 async function lock(){await p.evaluate(()=>{HousePause.close();House._.setMode('walk')});await p.keyboard.press('ArrowUp');await f.until(()=>!!document.pointerLockElement)}
 async function deferRelease(){await p.evaluate(()=>{window.realFixtureExit=document.exitPointerLock.bind(document);window.fixtureExitQueued=false;document.exitPointerLock=()=>{fixtureExitQueued=true}})}
 async function flushRelease(){await p.evaluate(()=>{document.exitPointerLock=realFixtureExit;realFixtureExit()})}
 try{
  await f.until(()=>!House.gliding);await lock();
  await p.screenshot({path:new URL('locked-before-race.png',dir).pathname});
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert(await p.evaluate(()=>!!document.pointerLockElement&&!HousePause.open),'Taking the failure screenshot must not itself release the mouse and open the menu');
  await deferRelease();
  // The old view left release to the 300 ms house interval, then its caller
  // resumed walking without waiting for pointerlockchange.
  await p.evaluate(()=>House._.setMode('focus'));await f.until(()=>fixtureExitQueued);
  await p.evaluate(()=>{HousePause.close();House._.setMode('walk')});await flushRelease();await f.until(()=>HousePause.open);
  const old=await p.evaluate(()=>({pauseOpen:HousePause.open,paused:House.paused,busy:House.busy,mode:House.mode}));assert(old.pauseOpen&&old.paused&&old.busy);
  await lock();await deferRelease();
  const view=f.view([-90,-70,175],[50,-20,-40]);await f.until(()=>fixtureExitQueued);await flushRelease();await view;
  await p.evaluate(()=>{HousePause.close();House._.setMode('walk')});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const fixed=await p.evaluate(()=>({pauseOpen:HousePause.open,paused:House.paused,busy:House.busy,mode:House.mode,locked:!!document.pointerLockElement}));assert(!fixed.pauseOpen&&!fixed.paused&&!fixed.busy&&!fixed.locked);
  assert.deepEqual(f.errors,[]);await writeFile(new URL('pointer-lock-race.json',dir),JSON.stringify({screenshotPreservedLock:true,old,fixed},null,2));console.log('FIXTURE CAMERA PASS',JSON.stringify({screenshotPreservedLock:true,old,fixed}));
 }finally{await f.browser.close()}
});
