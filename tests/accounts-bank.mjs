import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18390';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];const name='Bank'+Date.now().toString(36),pass='Test-only-1999';
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
async function until(fn){for(let n=0;n<400;n++){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('State timeout '+fn)}
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#accountGate form').waitFor();await until(()=>window.House?.live&&Net.connected);
 await p.screenshot({path:'shots/accounts-logon.png'});assert.equal(await p.locator('#accountGate [data-g],#accountGate [data-c]').count(),0);
 const pos=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));await p.keyboard.press('Escape');await p.keyboard.press('F2');await p.keyboard.press('w');
 assert(await p.locator('#accountGate').isVisible());assert(await p.evaluate(s=>House.W.x===s.x&&House.W.z===s.z,pos));
 await p.locator('#accountGate [data-switch]').click();await p.locator('#accountGate [name=name]').fill(name);await p.locator('#accountGate [name=password]').fill(pass);await p.locator('#accountGate [name=confirm]').fill('wrong');await p.locator('#accountGate [type=submit]').click();assert.match(await p.locator('.account-error').innerText(),/do not match/);
 await p.locator('#accountGate [name=confirm]').fill(pass);await p.screenshot({path:'shots/accounts-signup.png'});await p.locator('#accountGate [type=submit]').click();
 await until(()=>Net.me.member&&AccountGate.allowed&&window.Econ?.me?.wallet&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await p.evaluate(()=>Econ.me.wallet.pence),0);console.log('SIGNUP / GATE PASS');
 // Complete a real timed odd-job request: no test credit endpoint or browser wallet edits.
 await p.evaluate(()=>{Net.on('grJobGo',m=>window.testJob=m);Net.on('grJobDone',m=>window.testDone=m);Net.send({t:'grJobGo',j:'paper'})});await until(()=>!!window.testJob);
 await p.waitForTimeout(9000);await p.evaluate(()=>Net.send({t:'grJobDone',j:'paper',tok:testJob.tok,sc:10}));await until(()=>!!window.testDone);
 assert(await p.evaluate(()=>testDone.cashPence>=5&&Econ.me.wallet.pence>=5),'Validated jobs must pay pocket cash');
 await p.evaluate(()=>House.act('pc.power'));await until(()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon'));
 await p.evaluate(()=>document.querySelectorAll('.float .ctl [aria-label=Close]').forEach(b=>b.click()));
 await p.evaluate(()=>IE.navigate('http://www.jacknetbank.webcom/'));await p.locator('.bk-login input[type=password]').fill('gubbinz');await p.locator('.bk-login button[type=submit]').click();await p.locator('[data-exchange]').waitFor();
 await p.screenshot({path:'shots/bank-pocket-money.png'});const before=await p.evaluate(()=>({bal:Econ.bal,cash:Econ.me.wallet.pence,nonce:Econ.me.wallet.nonce}));
 await p.evaluate(s=>window.expectedCash=s.cash-5,before);await p.locator('[data-exchange] input').fill('0.05');await p.locator('[data-exchange] button').dblclick();await until(()=>Econ.me.wallet.pence===window.expectedCash);
 assert.equal(await p.evaluate(()=>Econ.me.wallet.pence),before.cash-5);assert.equal(await p.evaluate(()=>Econ.bal),before.bal+1);
 await p.evaluate(s=>Net.send({t:'ecExchange',pence:5,nonce:s.nonce}),before);await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>Econ.me.wallet.pence),before.cash-5);
 await p.screenshot({path:'shots/bank-exchange-receipt.png'});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&Net.me.member&&window.House?.mode==='monitor');assert.equal(await p.evaluate(()=>Econ.me.wallet.pence),before.cash-5);
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await p.screenshot({path:'shots/bank-narrow.png'});
 // A separate fresh browser still requires an account, including after resize.
 const q=await b.newPage({viewport:{width:390,height:844}});await q.goto(base,{waitUntil:'domcontentloaded'});await q.locator('#accountGate form').waitFor();await q.screenshot({path:'shots/accounts-narrow.png'});await q.close();
 assert.deepEqual(errors,[]);console.log('ACCOUNTS / CASH / BANK BROWSER PASS');
}finally{await b.close()}
