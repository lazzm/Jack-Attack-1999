import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450',tag=process.argv[3]||'review',tier=process.argv[4]||'low';
const {browser,page:p,errors}=await roomFixture(base,{tier,month:9});
try{
 for(const [phase,hour]of [['day',14],['dusk',17],['night',22]]){
  await p.evaluate(hour=>{window.auditHour=hour;window.auditMinute+=5;House.dirty()},hour);await p.waitForTimeout(900);
  await p.waitForFunction(phase=>document.getElementById('bootPower').classList.contains('rm-'+phase),phase);
  for(const id of ['bedroom','landing','hall','cupboard','lounge','kitchen','garden','drive']){
   await p.evaluate(id=>{House.goRoom(id,0);House.hush();House.relight()},id);await p.waitForTimeout(900);
   await p.screenshot({path:'shots/lighting-'+tag+'-'+tier+'-'+phase+'-'+id+'.png'});
   assert(await p.evaluate(id=>House._.lightingSnapshot(id)?.ambient>0,id));console.log('LIGHTING VIEW',phase,id,tier);
  }
 }
 await p.evaluate(()=>{House.goRoom('bedroom',0);House.hush();House.relight()});await p.waitForTimeout(1100);
 const stable=await p.evaluate(()=>House._.lightingSnapshot('bedroom'));
 for(const id of ['landing','hall','lounge','kitchen']){await p.evaluate(id=>{House.goRoom(id,0);House.act('hs.switch.'+id);House.hush()},id);await p.waitForTimeout(500)}
 assert.deepEqual(await p.evaluate(()=>House._.lightingSnapshot('bedroom')),stable,'A different room switch changed bedroom lighting');
 const offBudget=await p.evaluate(async()=>{const r=House.ROOMS.bedroom,old=r.lights;try{r.lights=()=>[...Array.from({length:8},(_,i)=>({x:i,y:0,z:0,i:0,d:400})),{x:8,y:0,z:0,i:0.8,d:400}];House.relight();for(let n=0;n<60;n++){await new Promise(resolve=>setTimeout(resolve,250));if(House._.lightingSnapshot('bedroom').lights.some(l=>l.x===8&&l.i>0.7))return true}return false}finally{r.lights=old;House.relight()}});
 assert(offBudget,'Off bulbs used the light budget');assert.deepEqual(errors,[]);console.log('LIGHTING REVIEW PASS',tier);
}catch(e){await p.screenshot({path:'shots/lighting-failure.png'}).catch(()=>{});console.log('LIGHTING FAILURE STATE',await p.evaluate(()=>({mode:House.mode,here:House.here,P:House.P,rooms:Object.values(House.ROOMS).map(r=>[r.id,r.group.visible]),diag:JSON.parse(localStorage.getItem('jhp_hs_diag')||'[]')})).catch(()=>null));throw e}finally{await browser.close()}
