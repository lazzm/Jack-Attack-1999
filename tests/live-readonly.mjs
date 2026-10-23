// Post-deploy visual health check only: no logon, game input or server mutations.
import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2];if(!base)throw Error('Supply the deployed URL');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
try{
const response=await p.goto(base,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
let ready=false;for(let n=0;n<300;n++){ready=await p.evaluate(()=>window.Net?.connected&&window.AccountGate?.blocked&&!!document.querySelector('#accountGate form'));if(ready)break;await p.waitForTimeout(200)}assert(ready,'Required account screen did not become ready');await p.waitForTimeout(4000);
assert.equal(await p.locator('#accountGate [data-g],#accountGate [data-c]').count(),0);
if(process.argv[3])assert.equal(await p.locator('.hs-pause-version').textContent(),'VERSION '+process.argv[3]);
await p.screenshot({path:'shots/live-accounts-reviewed.png'});assert.deepEqual(errors,[]);console.log('LIVE READ-ONLY PASS: HTTP 200; mandatory account screen; no guest bypass or browser errors/warnings');
}finally{await b.close()}
