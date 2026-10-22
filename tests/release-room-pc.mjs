import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18460');
try{
 assert.equal(await p.evaluate(()=>RoomCat.GAME['n64.range'].title),'GOLDENBALLS: TARGET RANGE');
 await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('n64.range')});await until(()=>RoomTV._dbg()?.st==='game');await p.waitForTimeout(1200);await p.screenshot({path:'shots/goldenballs-live-telly.png'});
 await p.evaluate(()=>window.lockGame=RoomTV.dbg());await p.keyboard.press('0');assert(await p.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg()===lockGame));await p.screenshot({path:'shots/lock-in-goldenballs.png'});await p.keyboard.press('0');assert.equal(await p.evaluate(()=>RoomTV.lockIn()),false);assert(await p.evaluate(()=>RoomTV.dbg()===lockGame));
 await p.keyboard.press('Backspace');await until(()=>House.mode==='walk');assert(await p.evaluate(()=>RoomTV._dbg()?.background&&RoomTV.dbg()===lockGame&&!HousePause.open));
 await p.evaluate(()=>House.act('pc.power'));await until(()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon'));
 await p.evaluate(()=>{const input=document.createElement('input');input.id='lockTypingTest';document.getElementById('monitorSurface').appendChild(input);input.focus()});await p.keyboard.press('0');assert.equal(await p.locator('#lockTypingTest').inputValue(),'0');assert.equal(await p.evaluate(()=>House.desktopDisplay()),false);await p.evaluate(()=>document.getElementById('lockTypingTest').remove());await p.keyboard.press('0');assert(await p.evaluate(()=>House.desktopDisplay()));await p.keyboard.press('0');assert.equal(await p.evaluate(()=>House.desktopDisplay()),false);
 await p.evaluate(()=>{window.releaseHouse=House;window.releaseChair=House.THINGS.chair.obj});
 await p.evaluate(()=>{const input=document.createElement('input');input.id='quickTypingTest';input.value='qq';document.getElementById('monitorSurface').appendChild(input);input.focus();input.setSelectionRange(2,2)});await p.keyboard.press('Backspace');assert.equal(await p.locator('#quickTypingTest').inputValue(),'q');assert.equal(await p.evaluate(()=>House.mode),'monitor');await p.evaluate(()=>document.getElementById('quickTypingTest').remove());
 await p.keyboard.press('0');await p.keyboard.press('Backspace');await until(()=>House.mode==='walk');assert.equal(await p.evaluate(()=>HousePause.open||document.documentElement.classList.contains('pc-desktop-full')),false);await p.screenshot({path:'shots/quick-back-pc.png'});
 await p.evaluate(()=>House.desktopDisplay(false));await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');
 await p.locator('#startBtn').click();await p.locator('#smShutdown').click();await p.locator('form').filter({has:p.locator('input[name=sd]')}).locator('button[type=submit]').click();
 await until(()=>House.mode==='walk'&&localStorage.getItem('jhp_off')==='1');assert(await p.evaluate(()=>House===releaseHouse&&House.THINGS.chair.obj===releaseChair));
 assert.equal(await p.evaluate(()=>House.P.ry),await p.evaluate(()=>JSON.parse(localStorage.getItem('jhp_hs_pc_return')).ry));await p.screenshot({path:'shots/pc-first-person-shutdown.png'});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),'1');await p.screenshot({path:'shots/pc-first-person-off-refresh.png'});
 await p.evaluate(()=>House.act('pc.power'));await until(()=>House.mode==='monitor'&&!document.body.classList.contains('pc-power')&&!document.querySelector('.logon'));await p.keyboard.press('F2');await until(()=>House.mode==='walk');
 assert.deepEqual(errors,[]);console.log('RELEASE ROOM / PC PASS: Goldenballs, Esc menu, continuing console, same-scene shutdown, first-person exit, off refresh and power-on');
}finally{await browser.close()}
