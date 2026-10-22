import {chromium} from 'playwright';
import assert from 'node:assert/strict';
export async function roomFixture(base,{hour=14,tier='low',width=1366,height=860,storage={},account='Review'+Date.now().toString(36),password='Throwaway-1999',touch=false,debug=false}={}){
 assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Use throwaway localhost data');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width,height},hasTouch:touch}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 if(debug){page.on('pageerror',e=>console.log('Fixture page error:',e.message));page.on('console',m=>{if(['warning','error'].includes(m.type()))console.log('Fixture console:',m.text())})}
 await page.addInitScript(({hour,tier,storage})=>{if(Object.keys(storage).length&&!localStorage.getItem('jhp_test_seeded')){for(const[k,v]of Object.entries(storage))localStorage.setItem(k,JSON.stringify(v));localStorage.setItem('jhp_test_seeded','1')}localStorage.setItem('jhp_hs_gfx',JSON.stringify(tier));window.auditHour=hour;window.auditMinute=0;Date.prototype.getHours=()=>window.auditHour;Date.prototype.getMinutes=()=>window.auditMinute},{hour,tier,storage});
 async function until(fn){for(let i=0;i<500;i++){try{if(await page.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await page.waitForTimeout(200)}throw Error('Timeout '+fn)}
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.Net?.connected&&!!Net.me.id);
  if(debug)console.log('Fixture connected');
  await page.locator('#accountGate [data-switch]').click();await page.locator('[name=name]').fill(account);await page.locator('[name=password]').fill(password);await page.locator('[name=confirm]').fill(password);await page.locator('#accountGate [type=submit]').click();
  await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  if(debug)console.log('Fixture room built',await page.evaluate(()=>House.mode));
  await until(()=>House.mode==='monitor'&&!sessionStorage.getItem('jhp_login_seat'));
  await page.keyboard.press('q');await until(()=>House.mode==='walk');
  if(debug)console.log('Fixture standing');
  assert.deepEqual(errors,[],'Initial room errors');
  await page.evaluate(()=>Room.ensureHouse());await until(()=>window.HouseRooms?.ready);
 }catch(e){await browser.close();throw e}
 async function view(eye,target,{roomPoint=eye,level='U'}={}){await page.evaluate(({eye,target,roomPoint,level})=>{House.hush();House.setWalkFrom({x:roomPoint[0],y:roomPoint[1],z:roomPoint[2],lvl:level,seat:0});const[x,y,z]=eye,[tx,ty,tz]=target;Object.assign(House.P,{x,y,z,rx:Math.atan2(-(ty-y),Math.hypot(tx-x,tz-z))*180/Math.PI,ry:Math.atan2(tx-x,-(tz-z))*180/Math.PI,seat:0,lvl:level});House._.setMode('focus');House.dirty()},{eye,target,roomPoint,level});await page.waitForTimeout(500)}
 return{browser,page,errors,until,view};
}
