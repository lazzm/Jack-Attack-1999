// Post-deploy visual health check only: no logon, game input or server mutations.
import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2];if(!base)throw Error('Supply the deployed URL');
const entry=process.argv[3]==='entry';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
if(!entry)await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
try{
const response=await p.goto(base,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
let ready=false;for(let n=0;n<300;n++){ready=await p.evaluate(entry=>entry?window.House?.mode==='walk'&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'):window.House?.mode==='monitor'&&!!House.pcGL,entry);if(ready)break;await p.waitForTimeout(200)}assert(ready,'Live view did not become ready');await p.waitForTimeout(4000);
if(entry)assert.equal(await p.evaluate(()=>House.W.seat),false);
await p.screenshot({path:entry?'shots/live-entry-reviewed.png':'shots/live-reviewed.png'});assert.deepEqual(errors,[]);console.log('LIVE READ-ONLY PASS: HTTP 200; '+(entry?'standing room entry':'monitor visible')+'; no browser errors/warnings');
}finally{await b.close()}
