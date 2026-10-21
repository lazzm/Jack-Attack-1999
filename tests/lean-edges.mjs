import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:18300';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}), errors=[];
p.on('pageerror',e=>errors.push(e.message));
async function until(fn){for(let n=0;n<160;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('State timeout')}
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
try {
 await p.goto(base,{waitUntil:'domcontentloaded'}); await until(()=>window.House?.mode==='monitor');
 // A PC game's lock must survive the house poll and be released when standing.
 await p.evaluate(()=>{const host=document.createElement('button');host.id='lock-test';host.textContent='Game input';host.style.cssText='position:absolute;left:100px;top:100px;z-index:99999';host.addEventListener('click',()=>host.requestPointerLock());document.getElementById('monitorSurface').appendChild(host)});
 await p.locator('#lock-test').click(); await p.waitForTimeout(600);
 assert.equal(await p.evaluate(()=>document.pointerLockElement?.id),'lock-test');
 await p.keyboard.press('F2'); await until(()=>House.mode==='walk');
 assert.equal(await p.evaluate(()=>!!document.pointerLockElement),false);
 await p.evaluate(()=>document.getElementById('lock-test').remove());
 // Rapid seating and Escape during the locked glide must settle consistently.
 await p.evaluate(()=>{House.sitDown();House.sitDown()}); await p.keyboard.press('Escape'); await until(()=>House.mode==='monitor');
 await p.keyboard.press('F2'); await p.waitForTimeout(100); await p.keyboard.press('Escape'); await until(()=>House.mode==='walk');
 await p.evaluate(()=>House.sitDown()); await until(()=>House.mode==='monitor');
 // A held Escape cannot revive the PC once shutdown owns the transition.
 await p.keyboard.down('Escape'); await p.evaluate(()=>House.shutdownPC()); await p.waitForTimeout(800); await p.keyboard.up('Escape');
 assert.equal(await p.evaluate(()=>House.mode),'shutdown'); assert.equal(await p.evaluate(()=>House.canStand()),false);
 await p.screenshot({path:'shots/lean-shutdown-escape.png'});
 assert.deepEqual(errors,[]); console.log('EDGE PASS');
} finally {await b.close()}
