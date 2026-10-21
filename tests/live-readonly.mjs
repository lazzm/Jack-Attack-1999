// Post-deploy visual health check only: no logon, game input or server mutations.
import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2];if(!base)throw Error('Supply the deployed URL');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
try{
const response=await p.goto(base,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
await p.waitForFunction(()=>window.House?.mode==='monitor'&&!!House.pcGL,{},{timeout:60000});await p.waitForTimeout(4000);
await p.screenshot({path:'shots/live-2.25.0.png'});assert.deepEqual(errors,[]);console.log('LIVE READ-ONLY PASS: HTTP 200; monitor visible; no browser errors/warnings');
}finally{await b.close()}
