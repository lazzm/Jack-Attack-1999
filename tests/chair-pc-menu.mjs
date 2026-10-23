import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18460';
const{browser,page:p,errors,until,view}=await roomFixture(base);
try{
 const model=await p.evaluate(()=>{const t=House.THINGS.chair;return{details:t.obj.userData.periodChair,bounds:[t.hx,t.hz,t.h],seat:House.seatPose()}});
 assert.equal(model.details.castors,5);assert.equal(model.details.wheels,10);assert.equal(model.seat.ry,0);assert.equal(model.seat.rx,-3);
 for(const[name,eye,target]of [
  ['front',[156,-35,225],[77,27,100]],['rear',[-20,-45,20],[77,26,100]],
  ['base',[145,60,118],[77,63,100]],['desk',[-8,-53,182],[77,20,100]]]){
  await p.setViewportSize({width:1366,height:860});await view(eye,target);await p.screenshot({path:`shots/chair-1999-${name}.png`});
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:`shots/chair-1999-${name}-narrow.png`});
 }
 await p.setViewportSize({width:1366,height:860});await view([40,-55,155],[-15,-24,0]);await p.evaluate(()=>{House.hush();House._.setMode('walk')});
 await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open&&House.paused));
 const before=await p.evaluate(()=>[House.W.x,House.W.z]);await p.keyboard.down('w');await p.waitForTimeout(350);await p.keyboard.up('w');assert.deepEqual(await p.evaluate(()=>[House.W.x,House.W.z]),before);
 await p.screenshot({path:'shots/pause-1999-room.png'});await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>HousePause.open),false);
 await p.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();House.act('pc.power')});
 await until(()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon'));
 console.log('PC straight lean complete');
 await p.screenshot({path:'shots/pc-first-person-monitor.png'});
 assert.equal(await p.evaluate(()=>House.P.ry),0);assert.equal(await p.evaluate(()=>!!document.pointerLockElement),false);
 await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));await p.locator('.hs-pause [name=desktopFull]').check();
 await p.locator('.hs-pause [data-pause=resume]').click();
 const full=await p.evaluate(()=>{const r=document.getElementById('monitorSurface').getBoundingClientRect();return{full:document.documentElement.classList.contains('pc-desktop-full'),ratio:r.width/r.height,width:r.width,height:r.height}});
 assert(full.full);assert(Math.abs(full.width-1366)<1);assert(Math.abs(full.height-860)<1);await p.screenshot({path:'shots/pc-fullscreen-desktop.png'});
 await p.keyboard.press('Escape');await p.screenshot({path:'shots/pause-1999-desktop.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/pause-1999-narrow.png'});
 await p.locator('.hs-pause [data-pause=resume]').click();await p.screenshot({path:'shots/pc-fullscreen-desktop-narrow.png'});
 await p.setViewportSize({width:1920,height:1080});await p.screenshot({path:'shots/pc-fullscreen-desktop-wide.png'});await p.setViewportSize({width:2560,height:1080});await p.screenshot({path:'shots/pc-fullscreen-desktop-ultrawide.png'});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.mode==='monitor'&&!document.querySelector('.logon'));assert(await p.evaluate(()=>House.desktopDisplay()&&document.documentElement.classList.contains('pc-desktop-full')));
 await p.keyboard.press('F2');await until(()=>House.mode==='walk');assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('pc-desktop-full')),false);
 await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');assert(await p.evaluate(()=>document.documentElement.classList.contains('pc-desktop-full')));
 await p.keyboard.press('Escape');await p.locator('.hs-pause [name=desktopFull]').uncheck();await p.locator('.hs-pause [data-pause=resume]').click();assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('pc-desktop-full')),false);
 assert.deepEqual(errors,[]);console.log('CHAIR / PC / MENU PASS: solid model, 5 twin castors, first-person view, Esc, movement guard, viewport-filling LOCK IN, resize and refresh');
}finally{await browser.close()}
