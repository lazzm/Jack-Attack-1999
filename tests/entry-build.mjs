// Entry runs before Apps exists: stale unversioned executable packs must never be requested.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
await mkdir(new URL('shots/entry-build/',import.meta.url),{recursive:true});
await withTestServer(async base=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 try{for(const [width,height,name] of [[1366,860,'desktop'],[390,844,'phone']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width===390}),p=await context.newPage(),errors=[],bare=[],packs=[];
  p.setDefaultTimeout(120000);p.setDefaultNavigationTimeout(180000);
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
  await p.route(/\/js\/(hs-house|hs-cat|hs-life|hs-telly)\.js(?:\?|$)/,async route=>{
   if(route.request().resourceType()!=='script'){await route.continue();return}const url=new URL(route.request().url());packs.push(url);if(!url.searchParams.get('v')){bare.push(url.pathname);await route.fulfill({contentType:'text/javascript',body:'throw new Error("Stale unversioned house pack requested");'});return}await route.continue();
  });
  for(let reload=0;reload<2;reload++){
   if(reload)await p.reload({waitUntil:'domcontentloaded'});else await p.goto(base,{waitUntil:'domcontentloaded'});
   for(let n=0;n<500;n++){assert.deepEqual(errors,[]);if(await p.evaluate(()=>window.Net?.connected&&window.AccountGate?.blocked&&window.HouseRooms?.ready&&House.ROOMS.lounge.built))break;assert(n<499,'Fresh entry never built the lounge');await p.waitForTimeout(200)}
   await p.waitForTimeout(4000);assert.deepEqual(errors,[]);assert.deepEqual(bare,[],'Early loader requested an unversioned pack');
   const frame=await p.evaluate(()=>House.ROOMS.lounge.coffeeFrame);assert.equal(frame.x,-72);assert.equal(frame.z,456.5);
   const stamp=await p.locator('script[src*="js/rm-room.js"]').evaluate(s=>new URL(s.src).searchParams.get('v'));assert(stamp);assert(packs.some(u=>u.pathname.endsWith('/hs-house.js')&&u.searchParams.get('v')===stamp),'Downstairs pack did not inherit bedroom build token');
   assert.equal(await p.locator('#accountGate [data-g],#accountGate [data-c]').count(),0);
   await p.screenshot({path:new URL('shots/entry-build/'+name+'-'+reload+'.png',import.meta.url).pathname,timeout:180000});console.log('Fresh entry/reload PASS',name,reload,'stamped packs',packs.length);
  }
  await context.close();
 }}finally{await browser.close()}
});
console.log('ENTRY BUILD PASS: poisoned stale unversioned assets, pre-logon desktop/phone, current lounge frame, reload and no errors');
