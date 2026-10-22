import assert from 'node:assert/strict';import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450';const{browser,page:p,errors,until,view}=await roomFixture(base);
try{
 await p.evaluate(()=>House.act('pc.power'));await until(()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon'));
 await p.screenshot({path:'shots/render-monitor-desktop.png'});assert.equal(await p.evaluate(()=>!!document.pointerLockElement),false);
 await p.keyboard.press('F2');await until(()=>House.mode==='walk');
 await p.evaluate(()=>{House.grab('cube');House.inspect('cube')});await until(()=>House.mode==='inspect');await p.screenshot({path:'shots/render-inspected-cube.png'});await p.keyboard.press('Escape');await p.keyboard.press('Escape');
 await p.evaluate(()=>{House.sitDown();House.sitDown()});await p.keyboard.press('Escape');await until(()=>House.mode==='monitor');
 await p.evaluate(()=>House.grab('cube'));await p.waitForTimeout(700);await p.screenshot({path:'shots/render-held-over-monitor.png'});
 assert(await p.evaluate(()=>{const c=document.querySelector('.hs-gl2');return !!c&&c.isConnected&&getComputedStyle(c).display!=='none'}),'Front prop canvas missing');
 await p.keyboard.press('Escape');await p.keyboard.press('F2');await until(()=>House.mode==='walk');
 await p.evaluate(()=>RoomTV.test('n64.kart'));await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('Enter');await p.waitForTimeout(1200);await p.evaluate(()=>window.keepConsole=RoomTV.dbg());await p.keyboard.press('Escape');await until(()=>House.mode==='walk');
 const time=await p.evaluate(()=>RoomTV.dbg().t);await p.waitForTimeout(1500);assert(await p.evaluate(t=>RoomTV.dbg().t>t+.3,time));
 await p.evaluate(()=>House.act('telly'));await until(()=>House.mode==='focus'&&RoomTV.open_);assert(await p.evaluate(()=>RoomTV.dbg()===window.keepConsole));await p.screenshot({path:'shots/render-live-console.png'});await p.keyboard.press('Escape');
 await p.evaluate(()=>{House.setDoor('front',true,true);House.goRoom('hall',0);House.hush()});await p.waitForTimeout(900);await p.screenshot({path:'shots/render-front-door-glass.png'});
 await p.evaluate(()=>{House.setDoor('back',true,true);House.goRoom('kitchen',0);House.hush()});await p.waitForTimeout(900);await p.screenshot({path:'shots/render-kitchen-window.png'});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await p.screenshot({path:'shots/render-narrow-kitchen.png'});
 await p.setViewportSize({width:1366,height:860});await view([266,210,536],[330,340,550],{level:'G'});await p.screenshot({path:'shots/shadow-fixed-stair-wall.png'});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/render-narrow-stair-floor.png'});
 assert.deepEqual(errors,[]);console.log('ROOM RENDER LIFECYCLE PASS: monitor, front prop layer, inspect/Esc, console continuation, glass and resize');
}finally{await browser.close()}
