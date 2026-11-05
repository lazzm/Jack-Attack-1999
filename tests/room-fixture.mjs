import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import os from 'node:os';
import {stillCapture} from './still-capture.mjs';
export const fixtureScale=Math.max(1,Math.min(4,os.loadavg()[0]/os.cpus().length*1.3));
// Explicit software-host diagnostic only; native layout and inputs are retained.
export async function fixtureRaster(page,cap=Number(process.env.FIXTURE_RASTER_RATIO)){

 if(cap>0&&cap<=1)await page.addInitScript(cap=>{
  const timer=setInterval(()=>{const r=window.House?.ren;if(!r)return;clearInterval(timer);
   const set=r.setPixelRatio.bind(r);r.setPixelRatio=n=>set(n===undefined?n:Math.min(n,cap));r.setPixelRatio(r.getPixelRatio());
  },20);
 },cap);
}
// signup:false logs into an existing account; provisioning stays with the caller.
export async function roomFixture(base,{hour=14,tier='low',width=1366,height=860,storage={},account='Review'+Date.now().toString(36),password='Throwaway-1999',touch=false,signup=true,opening=false,resume=false,storageState,debug=process.env.FIXTURE_DEBUG==='1',recordVideo,onPage,launchOptions={},contextOptions={},seed,timeoutScale=fixtureScale}={}){
 assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Use throwaway localhost data');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader'],...launchOptions});
 const page=await browser.newPage({...contextOptions,viewport:{width,height},hasTouch:touch,...(storageState?{storageState}:{}),...(recordVideo?{recordVideo}:{})}),errors=[];
 await onPage?.(page);
 if(process.env.FIXTURE_STILL_CAPTURE==='1')await stillCapture(page);
 // Optional CPU-host raster cap for functional regressions; layout and input stay in CSS pixels.
 await fixtureRaster(page);

 if(seed!==undefined)await page.addInitScript(seed=>{let s=seed>>>0;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}},seed);
 page.setDefaultNavigationTimeout(90000*timeoutScale);
 page.setDefaultTimeout(30000*timeoutScale);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 if(debug){page.on('pageerror',e=>console.log('Fixture page error:',e.message));page.on('console',m=>{if(['warning','error'].includes(m.type()))console.log('Fixture console:',m.text())})}
 await page.addInitScript(({hour,tier,storage})=>{if(Object.keys(storage).length&&!localStorage.getItem('jhp_test_seeded')){for(const[k,v]of Object.entries(storage))localStorage.setItem(k,JSON.stringify(v));localStorage.setItem('jhp_test_seeded','1')}localStorage.setItem('jhp_hs_gfx',JSON.stringify(tier));window.auditHour=hour;window.auditMinute=0;if(hour!==null){Date.prototype.getHours=()=>window.auditHour;Date.prototype.getMinutes=()=>window.auditMinute}},{hour,tier,storage});
 async function until(fn,arg){for(let i=0;i<500*timeoutScale;i++){if(errors.length)throw Error('Fixture browser errors: '+errors.join('; '));try{if(await page.evaluate(fn,arg))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}if(debug&&i>0&&i%50===0)console.log('Fixture waiting',String(fn),await page.evaluate(()=>({ready:document.readyState,connected:window.Net?.connected,member:!!window.Net?.me?.member,mode:window.House?.mode,gate:!!document.querySelector('#accountGate'),loading:!!document.querySelector('.hs-loading,#houseEntry')})));await page.waitForTimeout(200)}throw Error('Timeout '+fn)}
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000*timeoutScale});await until(()=>window.Net?.connected&&!!Net.me.id);
  if(debug)console.log('Fixture connected');
  if(!resume){
  if(signup!==!!(await page.locator('.account-character').count()))await page.locator('#accountGate [data-switch]').click();
  await page.locator('[name=name]').fill(account);await page.locator('[name=password]').fill(password);
  await page.locator('#accountGate [type=submit]').click();
  await until(()=>window.AccountGate?.allowed||!!document.querySelector('.account-identity #accountFirst'));
  if(await page.locator('.account-identity #accountFirst').count())await page.locator('#accountGate [type=submit]').click();
  }
  if(resume){
    await until(()=>!!(window.AccountGate?.allowed||document.querySelector('.account-identity #accountFirst')));
    if(await page.locator('.account-identity #accountFirst').count())await page.locator('#accountGate [type=submit]').click();
  }
  await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  if(debug)console.log('Fixture room built',await page.evaluate(()=>House.mode));
  if(opening)await until(()=>!sessionStorage.getItem('jhp_login_seat')&&House.mode==='walk');
  else await until(()=>!sessionStorage.getItem('jhp_login_seat')&&House.mode==='monitor');
  if(!opening)await page.keyboard.press('q');await until(()=>House.mode==='walk');
  if(debug)console.log('Fixture standing');
  assert.deepEqual(errors,[],'Initial room errors');
  await page.evaluate(()=>Room.ensureHouse());await until(()=>window.HouseRooms?.ready);
 }catch(e){await browser.close();throw e}
 async function view(eye,target,{roomPoint=eye,level='U'}={}){await page.evaluate(({eye,target,roomPoint,level})=>{House.hush();House.setWalkFrom({x:roomPoint[0],y:roomPoint[1],z:roomPoint[2],lvl:level,seat:0});const[x,y,z]=eye,[tx,ty,tz]=target;Object.assign(House.P,{x,y,z,rx:Math.atan2(-(ty-y),Math.hypot(tx-x,tz-z))*180/Math.PI,ry:Math.atan2(tx-x,-(tz-z))*180/Math.PI,seat:0,lvl:level});House._.setMode('focus');House.dirty()},{eye,target,roomPoint,level});await page.waitForTimeout(500)}
 return{browser,page,errors,until,view};
}
