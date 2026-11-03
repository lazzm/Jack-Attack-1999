// Isolate events-bonfire's final page-load timeout. The first run retained its
// 30s limit; navigation now matches the shared room fixture's 90s allowance.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {fixtureScale} from './room-fixture.mjs';
const base=process.argv[2],family='Family'+Date.now().toString(36),password='Throwaway-1999';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:family,pass:password})})).ok);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('jhp_device_view','jackos'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?date99=11-02&time=19:00:00',{waitUntil:'domcontentloaded',timeout:90000*fixtureScale});
 await page.locator('[name=name]').fill(family);await page.locator('[name=password]').fill(password);await page.locator('#accountGate [type=submit]').click();
 async function until(fn){for(let i=0;i<150;i++){if(await page.evaluate(fn))return;await page.waitForTimeout(200)}throw Error('Isolated cast wait: '+fn)}
 await until(()=>!!(window.AccountGate?.allowed||document.querySelector('#accountFirst')));
 if(await page.locator('#accountFirst').count())await page.locator('#accountGate [type=submit]').click();
 await until(()=>!!(AccountGate.allowed&&window.Cast&&window.Season));
 const cast=await page.evaluate(()=>({sister:Cast.n('sister'),task:Season.cast(SeasonCat.byId.bonfire99.objById['bf-guy'].text)}));
 assert.notEqual(cast.sister,'Crystal');assert(cast.task.includes(cast.sister));assert(!cast.task.includes('{sister}'));assert.deepEqual(errors,[]);
 await page.screenshot({path:new URL('./shots/fixes2-1102/after-isolated-cast.png',import.meta.url).pathname});
 console.log('PASS isolated page load and non-owner cast',JSON.stringify(cast));
}finally{await browser.close()}
