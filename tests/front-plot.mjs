// Real finger movement around the approved front plot, with open boot and saved pose; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=fileURLToPath(new URL('shots/front-plot/',import.meta.url));await mkdir(shots,{recursive:true});
const account='Front'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,touch:true,width:390,height:844});
try{
 const {page,until,view,errors}=f,cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r);HouseFamily.debug.hide(true)});
 const m=await page.evaluate(()=>{const F=House.FRONT,c=House.ROOMS.drive.carFrame,s=House.ROOMS.drive.supports.find(s=>s.x0<=300&&s.x1>=300&&s.z0>=700&&s.z1<=800);return{fz:F.FZ,frame:{...c},behind:c.z-205*c.s-s.z1,ahead:F.FZ-5-c.z-205*c.s,pavement:House._.cellOk('G',290,F.FZ+36),npcPavement:NPCNav.clear('G',290,F.FZ+36),npcEnd:(()=>{const r=NPCNav.route({lvl:'G',x:300,z:800},{lvl:'G',x:290,z:F.FZ+36});return r?NPCNav.at(r,r.len):null})()}});
 assert.equal(m.fz,1400);assert(m.pavement);assert(m.npcPavement>=25.5&&m.npcEnd&&Math.hypot(m.npcEnd.x-290,m.npcEnd.z-1436)<10,'Family route stops short of the pavement');assert(Math.abs(m.behind-109.8)<.1&&Math.abs(m.ahead-106.8)<.1);console.log('Front clearances',m);
 await page.evaluate(()=>{if(!House.ROOMS.drive.carBoot.open)House.act('hs.carboot')});await until(()=>House.ROOMS.drive.carBoot.hinge.rotation.x<-1.2);
 const finger=(type,x=80,y=650)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{id:1,x,y,radiusX:6,radiusY:6,force:1}]});
 async function cross(name,x,z,end){
  await view([x,210,z],[x+400,210,z],{level:'G'});await page.evaluate(()=>House._.setMode('walk'));await finger('touchStart',190,25);await finger('touchEnd');await until(()=>document.documentElement.dataset.touchState==='walk');
  await finger('touchStart');await finger('touchMove',80,570);
  try{const endTime=Date.now()+30000;let arrived=false;while(Date.now()<endTime){if(await page.evaluate(()=>House.W.x>=window.__frontTarget)){arrived=true;break}await page.waitForTimeout(100)}assert(arrived,'Touch walk did not reach the far side')}finally{await finger('touchEnd')}
  await until(()=>Math.hypot(House.W.vx,House.W.vz)<1);const p=await page.evaluate(()=>({x:House.W.x,z:House.W.z}));
  assert(p.x>=end&&Math.abs(p.z-z)<3,'Touch route stopped or drifted: '+JSON.stringify(p));await page.screenshot({path:shots+name+'.png'});console.log('TOUCH CROSS',name,p);
 }
 await page.evaluate(()=>window.__frontTarget=620);await cross('behind-open-boot',300,800,620);
 await page.evaluate(()=>window.__frontTarget=650);await cross('ahead-of-car',400,1340,650);
 await page.evaluate(async()=>{House.saveWalkState();await Roam.syncNow()});
 const before=await page.evaluate(()=>({x:House.W.x,z:House.W.z,power:localStorage.getItem('jhp_off')}));
 await page.reload({waitUntil:'domcontentloaded',timeout:120000});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
 await page.evaluate(()=>House.buildRoom(House.ROOMS.drive));
 const after=await page.evaluate(()=>({x:House.W.x,z:House.W.z,power:localStorage.getItem('jhp_off'),boot:House.ROOMS.drive.carBoot.open}));
 assert(Math.hypot(before.x-after.x,before.z-after.z)<2,'Refresh moved the standing player');assert.equal(after.power,before.power);assert(after.boot,'Refresh closed the boot');
 for(const[width,height]of [[844,390],[768,1024],[1024,768]]){await page.setViewportSize({width,height});await page.waitForTimeout(600);await page.screenshot({path:shots+'resume-'+width+'x'+height+'.png'})}
 assert.deepEqual(errors,[]);console.log('FRONT PLOT PASS: approved clearances, real touch behind open boot and ahead of car, pavement, refresh/power/boot and rotation');
}catch(e){console.log(await f.page.evaluate(()=>({mode:House.mode,input:GameInput.mode,state:document.documentElement.dataset.touchState,paused:House.paused,walk:{...House.W}})).catch(()=>({})));await f.page.screenshot({path:shots+'failure.png'}).catch(()=>{});throw e}finally{await f.browser.close()}
