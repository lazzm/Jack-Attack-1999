import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18370';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Throwaway localhost only');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
async function until(fn){for(let n=0;n<350;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('State timeout '+fn)}
async function logon(){await until(()=>!!document.querySelector('.logon [data-g]'));await p.locator('.logon [data-g]').click();await until(()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon')&&!document.body.classList.contains('pc-power'))}
async function same(){assert(await p.evaluate(()=>window.originalHouse===House&&originalCube===House.THINGS.cube.obj&&House.THINGS.cube.at.x===-68),'PC lifecycle replaced the house or its belongings');assert.equal(await p.evaluate(()=>!!document.pointerLockElement),false)}
await p.addInitScript(()=>{if(!localStorage.getItem('jhp_everbooted')){localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))}});
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 await p.evaluate(()=>{window.originalHouse=House;window.originalCube=House.THINGS.cube.obj;House.THINGS.cube.at.x=-68;House.place(House.THINGS.cube);House.saveThings(true)});
 await p.locator('#startBtn').click();await p.locator('#smShutdown').click();
 await p.locator('input[name=sd][value=restart]').check();await p.locator('form').filter({has:p.locator('input[name=sd]')}).locator('button[type=submit]').click();
 await until(()=>House.mode==='pcboot');await same();await p.screenshot({path:'shots/restart-bios.png'});
 await p.keyboard.press('Escape');await logon();await same();await p.screenshot({path:'shots/restart-desktop.png'});
 // Rapid duplicate restart requests must produce one boot and one logon.
 await p.evaluate(()=>{Desk.reboot('bios');Desk.reboot('bios')});await logon();await same();
 await p.locator('#startBtn').click();await p.locator('#smLogoff').click();
 await p.getByRole('button',{name:'Yes',exact:true}).click();
 await until(()=>!!document.querySelector('.logon [data-g]'));await same();await p.screenshot({path:'shots/logoff-guest.png'});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(400);await p.screenshot({path:'shots/logoff-narrow.png'});
 await logon();await same();await p.setViewportSize({width:1366,height:860});
 // Logoff must be repeatable, and the member path must not retain a scene.
 await p.evaluate(()=>{window.savedMember=Net.me.member;Net.me.member=true;window.memberGuard=PCPower.logoff();Net.me.member=window.savedMember});
 assert.equal(await p.evaluate(()=>window.memberGuard),false);assert.equal(await p.evaluate(()=>House.mode),'monitor');
 await p.evaluate(()=>PCPower.logoff());await logon();await same();
 await p.keyboard.press('F2');await until(()=>House.mode==='walk');await p.screenshot({path:'shots/restart-standing.png'});
 await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');
 // Refresh during BIOS must leave a usable PC rather than a black frame.
 await p.evaluate(()=>Desk.reboot('bios'));await until(()=>House.mode==='pcboot');
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 assert.equal(await p.evaluate(()=>House.THINGS.cube.at.x),-68);await p.screenshot({path:'shots/restart-refresh.png'});
 assert.deepEqual(errors,[]);console.log('PC RESTART / GUEST LOGOFF PASS');
}finally{await b.close()}
