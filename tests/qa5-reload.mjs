import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],account='Jack',password='Throwaway-1999';
await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});
const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,account),hour:null});
const {page,until}=f;let deliveries=[];
try{
 await page.exposeFunction('recordSeason',id=>deliveries.push(id));
 await page.addInitScript(()=>{const t=setInterval(()=>{if(!window.st?.say)return;clearInterval(t);const say=st.say;st.say=function(id,...a){if(id.startsWith('bf.tail.'))window.recordSeason(id);return say.call(this,id,...a)}},10)});
 // Reload to install observation before the first phase announcement.
 await page.reload();await until(()=>window.OwnerTools?.allowed&&window.HouseFamily?.ready);
 await page.evaluate(()=>{Net.send({t:'ownerAction',rid:'reload-test',action:'clock',date:'1999-11-06',hour:19});HousePause.close()});
 await until(()=>window.Season?.packs.bonfire99&&window.HouseFamily?.ready);
 await page.waitForTimeout(16000);
 await until(()=>!HouseFamily.speaking&&!st.voiceBusy);
 const before=deliveries.length;assert(before>=1,'initial announcement delivered');
 const pose=await page.evaluate(()=>({x:House.W.x,z:House.W.z,mode:House.mode,power:localStorage.getItem('jhp_off')}));
 for(let n=1;n<=2;n++){await page.reload();await until(()=>window.HouseFamily?.ready&&window.Season?.packs.bonfire99);await page.waitForTimeout(14000);assert.equal(deliveries.length,before,'completed announcement must not replay on reload '+n);const after=await page.evaluate(()=>({x:House.W.x,z:House.W.z,mode:House.mode,power:localStorage.getItem('jhp_off')}));assert(Math.hypot(after.x-pose.x,after.z-pose.z)<1);assert.equal(after.mode,pose.mode);assert.equal(after.power,pose.power);await page.screenshot({path:'tests/shots/fixqa5/reload-'+n+'.png'});}
 assert.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('R221 REAL RELOAD PASS',JSON.stringify(deliveries));
}finally{await f.browser.close()}
