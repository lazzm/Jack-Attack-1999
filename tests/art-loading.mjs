import{chromium}from'playwright';import assert from'node:assert/strict';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
await p.goto(process.argv[2]||'http://localhost:18340',{waitUntil:'domcontentloaded'});
await p.locator('.hs-loading').waitFor({state:'visible',timeout:30000});
await p.screenshot({path:'shots/art-loading.png'});
assert.equal(await p.evaluate(()=>House.grab('cube')&&House.inspect('cube')),false,'Inspection must not bypass loading');
await p.locator('.hs-loading').waitFor({state:'detached',timeout:30000});
if(await p.evaluate(()=>House.held()))await p.evaluate(()=>House.putBack());
await p.screenshot({path:'shots/art-loaded-room.png'});
assert.deepEqual(errors,[]);console.log('ART LOADING PASS');
}finally{await b.close()}
