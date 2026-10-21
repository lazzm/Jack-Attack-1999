import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18370';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
async function until(fn){for(let n=0;n<350;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('State timeout '+fn)}
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 await p.keyboard.press('F2');await until(()=>House.mode==='walk'&&!!window.RoomTV);
 await p.evaluate(()=>RoomTV.test('n64.kart'));await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('Enter');await p.waitForTimeout(500);await p.keyboard.press('Escape');await until(()=>House.mode==='walk');
 await p.evaluate(()=>{window.recoveryHouse=House;window.recoveryGame=RoomTV.dbg();window.recoveryTime=RoomTV.dbg().t;House.sitDown()});await until(()=>House.mode==='monitor');
 for(let n=0;n<2;n++){
  await p.evaluate(()=>Desk.bsod('test'));await p.waitForTimeout(700);
  assert(await p.locator('#bsod').isVisible(),'Repeated crash overlay must be visible');await p.screenshot({path:`shots/recovery-crash-${n}.png`});
  await p.keyboard.press('Enter');await until(()=>House.mode==='pcboot');
  await until(()=>!document.getElementById('bootScan').hidden);await p.screenshot({path:`shots/recovery-scandisk-${n}.png`});
  await until(()=>!!document.querySelector('.logon [data-g]'));await p.locator('.logon [data-g]').click();
  await until(()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon'));
  assert(await p.evaluate(()=>House===recoveryHouse&&RoomTV.dbg()===recoveryGame&&RoomTV.dbg().t>recoveryTime),'Crash recovery must retain the house and live console session');
  assert.equal(await p.locator('#bsod').isVisible(),false);console.log('RECOVERED CRASH',n+1);
 }
 await p.keyboard.press('F2');await until(()=>House.mode==='walk');await p.screenshot({path:'shots/recovery-tv-still-running.png'});
 assert.deepEqual(errors,[]);console.log('PC RECOVERY / TV CONTINUATION PASS');
}finally{await b.close()}
