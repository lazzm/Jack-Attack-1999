// Matched world-space scale views; the old far-end camera is outside its former fence.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2]||'http://localhost:18089',tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('./shots/sizing/'+tag+'/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const views=[['garden-back-door','G',[120,210,-250],[-20,260,-950]],['garden-far-end','G',[20,210,-1360],[20,80,-56]],['bedroom-window','U',[190,-70,-30],[0,295,-900]],['kitchen-hall-door','G',[180,210,220],[-140,260,-110]],['kitchen-back-door','G',[120,210,-40],[-120,270,170]],['kitchen-mom-sink','G',[-200,210,100],[-80,240,-120]]];
const report=process.env.SIZING_ONLY?JSON.parse(await readFile(dir+'report.json','utf8').catch(()=>'[]')):[],account='Jack';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:'Throwaway-1999'})})).ok);
const f=await roomFixture(base,{account,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,'Throwaway-1999'),width:1366,height:860,seed:1999,onPage:async p=>{
 if(tag==='before')await p.route('**/js/*.js*',async route=>{const name=new URL(route.request().url()).pathname.split('/').pop();try{const body=execFileSync('git',['show','HEAD:app/public/js/'+name],{encoding:'utf8',maxBuffer:8*1024*1024});await route.fulfill({body,contentType:'application/javascript'})}catch{await route.continue()}});
}});
try{
 await f.page.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r);House.adapt(3,{pin:true,force:true});for(const id of ['kitchen','back','bedroom'])if(House.DOORS[id])House.setDoor(id,true,true);HouseFamily?.debug.clock({md:1016,dow:6,t:9.5});HouseFamily?.debug.go('mom','sink');HouseFamily?.debug.place('mom','sink');HouseFamily?.debug.sim(2,.1)});
 if(process.env.SIZING_FINAL_CHECKS==='1'){
  await f.until(()=>!!(window.Bonfire?.on&&House.SPOTS['bf.water']));
  await f.view([300,210,-231],[235,335,-196],{level:'G'});
  assert(['hs.butt','bf.water'].includes(await f.page.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot)),'Water butt must be reachable from the clear east side');
  assert(await f.page.evaluate(()=>[[-275,-331],[-222,-331],[-205,-331]].every(([x,z])=>!!House._.floorAt(x,z,'G',353))),'The path turn must join the patio');
  await f.page.evaluate(()=>{House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;House.P.y=House.W.fy-House.W.eye;House.dirty()});
  await f.page.keyboard.press('f');await f.until(()=>!!Season.st('bonfire99')?.steps['bf-code']?.water);
  await f.page.evaluate(()=>document.querySelector('.hs-note.on .rm-x')?.click());
  console.log('FINAL CHECK PASS: real water-butt F acknowledged by server; continuous path turn');
  await f.view([-275,210,-500],[-230,353,-331],{level:'G'});await f.page.screenshot({path:dir+'desktop-day-path-turn-detail.png'});
 }
 const input=await f.page.context().newCDPSession(f.page);
 for(const phone of [false,true]){
  await f.page.setViewportSize(phone?{width:390,height:844}:{width:1366,height:860});
  await input.send('Emulation.setTouchEmulationEnabled',{enabled:phone,maxTouchPoints:1});
  if(phone){await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:387,y:6}]});await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await f.page.keyboard.press('Shift');
  await f.page.evaluate(phone=>{House.Q.mob=phone;HousePause.close();House.dirty()},phone);
  for(const hour of [14,21]){
   await f.page.evaluate(hour=>{window.auditHour=hour;const e=document.getElementById('bootPower');for(const p of ['day','night','dawn','dusk'])e.classList.toggle('rm-'+p,p===(hour===14?'day':'night'));House.relight();HouseEnvironment.update();House.dirty()},hour);
   for(const [name,level,eye,target]of views){
    if(process.env.SIZING_ONLY&&!process.env.SIZING_ONLY.split(',').includes(name))continue;
    if(process.env.SIZING_FINAL_CHECKS==='1'&&name==='garden-back-door')continue;
    await f.view(eye,target,{level,roomPoint:name==='garden-far-end'?[20,210,-450]:eye});await f.page.waitForTimeout(650);
    const file=`${phone?'phone':'desktop'}-${hour===14?'day':'night'}-${name}.png`;await f.page.screenshot({path:dir+file});
    report.push({file,eye,target,...await f.page.evaluate(()=>({room:House.here,touch:GameInput.touch,calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles,grass:House.ROOMS.garden.group.getObjectByName('garden-grass-blades')?.count,visible:Object.values(House.ROOMS).filter(r=>r.group.visible).map(r=>r.id)}))});
    await writeFile(dir+'report.json',JSON.stringify([...new Map(report.map(r=>[r.file,r])).values()],null,2));console.log('SHOT',file);
    if(process.env.SIZING_FINAL_CHECKS==='1'&&phone&&hour===14){await f.view([-275,210,-500],[-230,353,-331],{level:'G'});await f.page.screenshot({path:dir+'phone-day-path-turn-detail.png'});}
   }
  }
 }
 assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}
