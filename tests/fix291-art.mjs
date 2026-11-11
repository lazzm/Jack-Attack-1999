// QA9 art/world fixes, native 1366x860 captures: R249 (seam under the stairs), R250 (stone pier caps),
// R251 (car wash bucket, suds and sheen), R241 (outside doors after a family day, 12:00 and 22:00).
// Run from any folder: node /path/to/tests/fix291-art.mjs [--before]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const before=process.argv.includes('--before'),phase=before?'before':'after';
const out=path.join(here,'shots','fix291-art',phase);await mkdir(out,{recursive:true});
const assets=['js/hs-house.js','js/ch-out.js','js/np-life.js'],findings=[],evidence={};
const check=(ok,why)=>{if(!ok){findings.push(why);console.log('FINDING',why);if(!before)throw Error(why)}};
await withTestServer(async base=>{
 const name='Art'+Date.now().toString(36),pass='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass})})).ok);
 const f=await roomFixture(base,{account:name,password:pass,signup:false,resume:true,opening:true,hour:12,seed:5,storageState:await bonfireLogin(base,pass,name,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),
  onPage:async p=>{if(before)for(const file of assets)await p.route('**/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:path.join(here,'..'),encoding:'utf8'})}));}});
 const {page:p}=f;
 try{
  for(let i=0;i<240&&!(await p.evaluate(()=>!!window.HouseFamily?.ready));i++)await p.waitForTimeout(500);
  const clock=(md,dow,t,sim=0)=>p.evaluate(({md,dow,t,sim})=>{window.auditHour=Math.floor(t);window.auditMinute=Math.round(t%1*60);HouseFamily.debug.clock({md,dow,t});if(sim)HouseFamily.debug.sim(sim,.1);HousePause.close?.()},{md,dow,t,sim});
  const view=async(eye,target,level='G')=>{await f.view(eye,target,{level});await p.evaluate(()=>{House._.setMode('walk');House.dirty()});await p.waitForTimeout(1200)};
  const shot=async n=>{await p.screenshot({path:path.join(out,n+'.png')});console.log('CAPTURE',n)};
  // R249 and R250
  await view([370,210,340],[370,310,535]);await shot('cupboard-soffit');
  await view([200,210,1350],[1300,120,1600]);await shot('street-pier-caps');
  await view([300,190,1330],[348,120,1395]);await shot('pier-cap-close');
  // R251: Saturday car wash
  await clock(1113,6,10.6,240);
  const dad=await p.evaluate(()=>{const c=HouseFamily.chars.dad;return{present:c.present,room:c.room,act:c.rig?.st?.action,x:c.x,z:c.z,h:c.h}});evidence.dad=dad;
  if(dad.act==='carwash'){
   await view([dad.x-150,210,dad.z+120],[dad.x+60,250,dad.z]);await shot('carwash-pavement');
   await view([dad.x-60,200,dad.z-170],[dad.x+70,270,dad.z+30]);await shot('carwash-behind');
   const props=await p.evaluate(()=>{let v=null;House.ROOMS.drive.group.traverse(o=>{if(o.name==='carwash-props')v=o.visible});return v});evidence.washProps=props;
   check(props===true,'no bucket/suds while Dad washes the car');
  }else check(false,'Dad was not washing the car: '+JSON.stringify(dad));
  // R241: the family's day, then the front and back doors at noon and at 22:00
  await p.evaluate(()=>{House.setDoor('front',true);House.setDoor('back',true)});
  await view([-90,-70,175],[50,-20,-40],'U'); // (the player upstairs in the bedroom while the day runs)
  for(const [t,label] of [[12,'12'],[22,'22']]){
   await clock(1111,4,t,600);await p.waitForTimeout(500);
   const doors=await p.evaluate(()=>({front:House.DOORS.front.open,back:House.DOORS.back.open}));evidence['doors'+label]=doors;
   await view([290,210,1290],[440,220,900]);await shot('doors-'+label+'-drive');
   await view([100,210,240],[-100,265,-145]);await shot('doors-'+label+'-kitchen');
   check(!doors.front&&!doors.back,'outside doors left open at '+label+':00 '+JSON.stringify(doors));
  }
  // A refresh keeps them as they were.
  await view([100,210,240],[-100,265,-145]);await p.waitForTimeout(2600);
  await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));await p.waitForTimeout(1500);
  const after=await p.evaluate(()=>({front:House.DOORS.front.open,back:House.DOORS.back.open}));evidence.refresh=after;
  check(!after.front&&!after.back,'a refresh reopened a door '+JSON.stringify(after));
 }finally{await writeFile(path.join(out,'evidence.json'),JSON.stringify({phase,findings,evidence},null,1));await f.browser.close()}
});
console.log(before?'SUMMARY fix291-art before: '+findings.length+' findings':'PASS fix291-art');
