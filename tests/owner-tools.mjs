import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://localhost:18080';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Throwaway server only');
const shots=new URL('./shots/owner-tools/',import.meta.url).pathname;
const password='Throwaway-1999';let f,normalBrowser;
async function wait(page,fn){for(let i=0;i<500;i++){try{if(await page.evaluate(fn))return}catch(e){if(!/context was destroyed|navigation/.test(e.message))throw e}await page.waitForTimeout(200);}throw Error('Timeout '+fn);} // account-gate may reload the page after login
async function register(name){const r=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass:password})});assert(r.ok,'Admin registration: '+r.status);}
try{
 await register('Jack');await register('NormalOwnerTest');await mkdir(shots,{recursive:true});
 f=await roomFixture(base,{account:'Jack',password,signup:false,hour:null});const{page,until,view}=f;
 await until(()=>window.OwnerTools?.allowed);console.log('Owner fixture ready');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text());});
 async function panel(){await page.keyboard.press('Backquote');await until(()=>document.querySelector('.owner-tools')?.open);}
 async function ready(){await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));await until(()=>window.OwnerTools?.allowed);}
 async function idle(){await until(()=>!document.querySelector('.owner-tools [data-owner=snapshot]')?.disabled);}
 async function tool(name){await page.locator(`[data-owner="${name}"]`).click();await idle();}
 async function tab(name){await page.locator(`[data-tab="${name}"]`).click();}
 async function close(){await page.locator('.owner-tools [data-owner=close]').last().click();}
 // Backquote is ignored in JackOS/HTML text fields, including contenteditable.
 for(const kind of ['input','textarea','div']){
  await page.evaluate(kind=>{const x=document.createElement(kind);x.id='ownerTyping';if(kind==='div')x.contentEditable='true';x.style.cssText='position:fixed;top:20px;left:20px;z-index:999999';document.documentElement.appendChild(x);x.focus();},kind);
  await page.keyboard.press('Backquote');assert.equal(await page.locator('.owner-tools[open]').count(),0);assert(!await page.evaluate(()=>HouseEdit.on));await page.evaluate(()=>document.getElementById('ownerTyping').remove());
 }
 await panel();assert(await page.evaluate(()=>HouseEdit.on));
 await page.screenshot({path:shots+'progress-1366.png'});
 // Capture a visible original prop pose before the replacement round trip.
 const originalStarter=await page.evaluate(()=>localStorage.getItem('jhp_starter'));
 const original=await page.evaluate(()=>{const t=House.THINGS.beanbag;return{room:t.at.room,x:t.at.x,y:t.at.y,z:t.at.z,ry:t.at.ry};});
 await tool('snapshot');const saved=await page.locator('[name=snapshot] option').first().getAttribute('value');assert(saved);
 await tab('unlocks');
 await page.evaluate(()=>{Net.on('ecMe',m=>window.__ownerMoney=m);Net.send({t:'ecMe'});});await until(()=>!!window.__ownerMoney?.wallet);
 const cash=await page.evaluate(()=>__ownerMoney.wallet.pence);await page.locator('[name=amount]').fill('100');await tool('money');await until(()=>__ownerMoney.wallet.pence>0);assert.equal(await page.evaluate(()=>__ownerMoney.wallet.pence),cash+100);
 await page.locator('[name=amount]').fill('-100');await tool('money');assert.equal(await page.evaluate(()=>__ownerMoney.wallet.pence),cash);
 await page.locator('[name=chapter]').selectOption('2');await page.locator('[name=step]').selectOption('order');await tool('storyJump');await until(()=>st.getState()?.ch===2);// story comes only from the server
 await tool('storyComplete');await until(()=>st.getState()?.ch===3);
 await page.screenshot({path:shots+'unlocks-1366.png'});
 await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('[data-owner=unlock][data-kind=all]').click()]);await ready();
 assert.equal(await page.evaluate(()=>localStorage.getItem('jhp_starter')),'0');assert(await page.evaluate(()=>PM.owns('hardware.n64')&&PM.owns('cart.n64.kart')&&PM.owns('pm.mag.12')));
 console.log('Collection unlocked');await page.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
 await panel();await tab('world');
 await page.locator('[name=date]').fill('1999-12-31');await page.locator('[name=hour]').fill('23');await tool('clock');
 assert.equal(await page.evaluate(()=>Desk.today99().md),1231);
 assert.equal(await page.evaluate(()=>HouseLife?.now99?.().h??OwnerTools.now().getHours()),23);
 await page.screenshot({path:shots+'world-1366.png'});
 await tool('overlay');assert(await page.locator('.owner-debug').isVisible());await tool('overlay');
 await tool('clockClear');assert.equal(await page.evaluate(()=>OwnerTools.clock),null);
 await close();
 // Escape during god mode must expose the ordinary game menu and its owner entry.
 if(await page.evaluate(()=>HouseEdit.on)){await page.keyboard.press('Escape');await until(()=>HousePause.open);}else{await page.keyboard.press('Escape');await until(()=>HousePause.open);}
 assert(await page.locator('[data-pause=owner]').isVisible());await page.locator('[data-pause=owner]').click();await until(()=>document.querySelector('.owner-tools')?.open&&!HousePause.open);
 await tab('saves');await page.locator('[data-owner=reset]').click();assert(await page.locator('.owner-confirm').isVisible());await page.locator('[data-owner=cancel]').click();assert(!await page.locator('.owner-confirm').isVisible());
 await page.locator('[data-owner=reset]').click();await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('[data-owner=confirm]').click()]);await ready();
 assert.equal(await page.evaluate(()=>localStorage.getItem('jhp_starter')),'1');
 console.log('Sparse reset loaded');await until(()=>window.st?.getState()?.ch===1);assert(!await page.evaluate(()=>Room.hasConsole('n64')));assert(await page.evaluate(()=>Room.hasConsole('gb')));
 assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('jhp_rm')).f).filter(id=>id.startsWith('cart.')).length),0);
 await page.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
 await view([-120,-55,160],[-216,-5,-16]);await page.screenshot({path:shots+'reset-sparse-room.png'});
 // The fixture view uses focus mode; owner tools remain available from the PC/room.
 await panel();await page.locator('[name=snapshot]').selectOption(saved);await page.locator('[data-owner=restore]').click();await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('[data-owner=confirm]').click()]);await ready();
 assert.equal(await page.evaluate(()=>localStorage.getItem('jhp_starter')),originalStarter);
 const restored=await page.evaluate(()=>{const t=House.THINGS.beanbag;return{room:t.at.room,x:t.at.x,y:t.at.y,z:t.at.z,ry:t.at.ry};});assert.deepEqual(restored,original);
 await page.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);await view([-120,-55,160],[-216,-5,-16]);await page.screenshot({path:shots+'restored-room.png'});
 console.log('Snapshot restored; checking world tools');
 await page.evaluate(()=>House._.setMode('walk'));await panel();await close();assert(await page.evaluate(()=>HouseEdit.on));
 const beforeFly=await page.evaluate(()=>House.P.z);await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');assert.notEqual(await page.evaluate(()=>House.P.z),beforeFly);
 await page.keyboard.press('Escape');await until(()=>HousePause.open);await page.locator('[data-pause=owner]').click();await until(()=>document.querySelector('.owner-tools')?.open&&!HousePause.open);await tab('world');
 await page.locator('[name=station]').selectOption('kitchen|0');await page.locator('[data-owner=teleport]').click();await until(()=>House.here==='kitchen'&&!House.gliding);await page.screenshot({path:shots+'teleport-kitchen.png'});
 await panel();await tab('world');await page.locator('[name=event]').selectOption('tea');await page.locator('[data-owner=event]').click();await until(()=>!!document.querySelector('.hs-voice.on')?.textContent.includes('Tea is ready'));
 await panel();await page.locator('[name=parcel]').selectOption('hardware.md');await tool('parcel');await until(()=>PM.parcels().includes('hardware.md'));
 await page.locator('[name=chore]').selectOption('bed');await page.locator('[data-owner=chore]').click();await until(()=>House.here==='bedroom'&&window.ChoreKit?.started('bed'));assert(!await page.evaluate(()=>ChoreKit.done('bed')));
 await panel();await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('[data-owner=rebuild]').click()]);await ready();assert.equal(await page.evaluate(()=>House.here),'bedroom');
 // A second PC size and native mobile remain usable without a house renderer.
 await panel();await page.setViewportSize({width:1024,height:768});await page.screenshot({path:shots+'progress-1024.png'});await close();
 assert.deepEqual(errors,[],'Owner UI browser errors');
 const token=await page.evaluate(()=>Net.store.get('jhp_token'));
 await f.browser.close();f=null;
 normalBrowser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 const phoneContext=await normalBrowser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 const phone=await phoneContext.newPage();await phone.addInitScript(token=>localStorage.setItem('jhp_token',token),token);await phone.goto(base,{waitUntil:'domcontentloaded'});
 // Device policy (2026-10-26): the owner's phone gets the house with touch controls (owner tools at phone sizes: mobile.mjs).
 await wait(phone,()=>window.AccountGate?.allowed&&window.House?.live&&!window.PCOnly?.desktopOnly&&window.GameInput?.touch&&!document.querySelector('.hs-loading,#houseEntry'));
 assert(await phone.evaluate(()=>!!document.querySelector('.ht-hud')&&OwnerTools.allowed));await phone.screenshot({path:shots+'phone-390.png'});
 await phone.setViewportSize({width:844,height:390});await phone.screenshot({path:shots+'phone-landscape.png'});await phoneContext.close();
 const context=await normalBrowser.newContext({viewport:{width:1366,height:860}}),normal=await context.newPage();
 await normal.goto(base,{waitUntil:'domcontentloaded'});await normal.locator('#accountGate form').waitFor();await normal.locator('[name=name]').fill('NormalOwnerTest');await normal.locator('[name=password]').fill(password);await normal.locator('#accountGate [type=submit]').click();
 await wait(normal,()=>window.AccountGate?.allowed||!!document.querySelector('#accountFirst'));if(await normal.locator('#accountFirst').count())await normal.locator('#accountGate [type=submit]').click();
 await wait(normal,()=>window.AccountGate?.allowed&&window.House?.live&&!House.gliding);
 await normal.keyboard.press('Backquote');assert.equal(await normal.locator('.owner-tools').count(),0);assert(!await normal.evaluate(()=>OwnerTools.allowed));
 const denied=await normal.evaluate(()=>new Promise(resolve=>{Net.on('ownerResult',m=>{if(m.rid==='forged')resolve(m);});Net.send({t:'ownerAction',rid:'forged',member:'jack',nick:'Jack',action:'reset',confirm:'RESET JACK'});}));assert.equal(denied.ok,false);
 await normal.keyboard.press('Escape');await wait(normal,()=>HousePause.open);assert(!await normal.locator('[data-pause=owner]').isVisible());assert.equal(await normal.locator('.owner-tools').count(),0);
 await normal.screenshot({path:shots+'non-owner-menu.png'});
 console.log('PASS owner panel, typing guard, unlocks, clock, overlay, Esc menu, confirmed sparse reset, restore, sizes/mobile, non-owner UI and forged session packet');
}catch(e){if(f)await f.page.screenshot({path:shots+'failure.png'}).catch(()=>{});throw e;}finally{await f?.browser.close();await normalBrowser?.close();}
