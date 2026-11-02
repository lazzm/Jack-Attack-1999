// Reproducible visual/lighting regression. Caller owns a disposable localhost server.
// node tests/fix-1102.mjs URL after|before rooms|openings
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'after',mode=process.argv[4]||'rooms';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert(+new URL(base).port>=18080&&+new URL(base).port<=18099);
const dir=new URL('shots/fix-1102/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const rows=[];
async function photograph(p,name){console.log('SHOT',name);await p.screenshot({path:dir+tag+'-'+name+'.png',timeout:60000})}
if(mode==='openings'){
 // The first call is automatic. Later hours replay the same production entry
 // point on this disposable profile, without rebuilding four identical houses.
 const f=await roomFixture(base,{opening:true,hour:23,timeoutScale:2,debug:true,onPage:p=>p.addInitScript(()=>{const timer=setInterval(()=>{const s=window.HouseFamily?.debug?.speech;if(s?.cur?.lineId?.startsWith('c1.wake.mom.call')){s.freeze=true;clearInterval(timer)}},50)})});
 try{
  await f.until(()=>!!window.HouseFamily?.ready&&!!HouseFamily.debug.speech.cur?.lineId?.startsWith('c1.wake.mom.call'));
  for(const hour of [23,9,14,19]){
   const expected='c1.wake.mom.call'+(hour<12?'':hour<18?'.day':hour<22?'.evening':'.night');
   if(hour!==23)assert(await f.page.evaluate(hour=>{
    const S=HouseFamily.debug.speech;S.voice?.stop();S.bub?.close(true);if(S.cur){S.cur.c.talking=false;S.cur.c.rig?.hush()}S.cur=null;S.q.length=0;S.voice=S.bub=null;S.freeze=false;S.until=S.hard=0;
    window.auditHour=hour;dispatchEvent(new Event('ownerclock'));localStorage.removeItem('np.once.'+String(Net.me.nick).toLowerCase()+'.c1.wake.mom.call');
    return HouseFamily.debug.openingCall();
   },hour));
   await f.page.waitForFunction(id=>HouseFamily.debug.speech.cur?.lineId===id,expected,{timeout:20000});
   const line=await f.page.evaluate(()=>{const s=HouseFamily.debug.speech.cur;HouseFamily.debug.speech.freeze=true;return{id:s.lineId,text:s.text,hour:new Date().getHours()}});
   assert.equal(line.hour,hour);assert.equal(line.id,expected);
   await f.page.evaluate(line=>st.say(line.id,'Mom (downstairs)',line.text,60000,{audio:false}),line);
   await photograph(f.page,'mom-'+hour);rows.push(line);
  }
  assert.deepEqual(f.errors,[]);
 }finally{await f.browser.close()}
}else{
 const account='Cup'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,hour:process.env.FIX_HOURS?+process.env.FIX_HOURS.split(',')[0]:23,timeoutScale:2,debug:true}),{page:p}=f;
 try{
  await f.until(()=>!!window.HouseFamily?.ready);
  for(const hour of (process.env.FIX_HOURS?process.env.FIX_HOURS.split(',').map(Number):tag==='before'?[23]:[23,9])){
   if(hour===9&&!process.env.FIX_HOURS){
    await p.addInitScript(()=>Object.defineProperty(window,'auditHour',{configurable:true,get:()=>9,set:()=>{}}));
    await p.reload({waitUntil:'domcontentloaded'});
    await f.until(()=>!!window.House?.live&&!!window.HouseRooms?.ready&&!!window.HouseFamily?.ready&&!document.querySelector('.hs-loading,#houseEntry'));
   }
   console.log('COLD VIEW',hour);
   await p.evaluate(()=>{HouseFamily.debug.clock({md:1012,dow:2,t:23.9});HouseFamily.debug.sim(120,.1);House.hush();dispatchEvent(new Event('ownerclock'));House.relight()});
   assert.equal(await p.evaluate(()=>new Date().getHours()),hour);
   // Same native-eye, slightly downward garden view as the reported night photograph.
   await f.view([-35,200,-294],[-35,231.3,-56],{level:'G'});
   const door=await p.evaluate(()=>{const d=House.DOORS.back;return{open:d.open,angle:d.ang,rotation:d.pivot.rotation.toArray(),position:d.pivot.position.toArray(),camera:{...House.P},phase:document.getElementById('bootPower').className}});
   assert(door.phase.includes(hour===23?'rm-night':'rm-day'),'The rendered phase must match the pinned clock');
   assert.equal(door.open,false);assert(Math.abs(door.angle)<.00001);assert(Math.abs(door.rotation[1])<.00001);
   await photograph(p,'back-door-'+hour+'-garden');rows.push({hour,door});
   await f.view([-35,200,-294],[-35,200,-56],{level:'G'});await photograph(p,'back-door-'+hour+'-level');
   await p.evaluate(()=>{House.setDoor('cupboard',true,true);if(House.ROOMS.cupboard.lights()[0].i<=0)House.act('hs.cord')});
   for(const[name,eye,target]of [
    ['front',[362,241,400],[370,240,300]],
    ['soffit',[370,241,370],[370,211,420]],
    ['meter',[356,241,380],[408,208,300]],
    ['low',[374,275,387],[380,300,296]],
   ]){console.log('VIEW',hour,name);await f.view(eye,target,{level:'G'});await photograph(p,'cupboard-'+hour+'-'+name)}
   await f.view([362,241,400],[370,240,300],{level:'G'});
   const perf=await p.evaluate(()=>new Promise(resolve=>{const samples=[],render=[],H=House;let previous=0,n=0;const original=H.ren.render;let cost=0;H.ren.render=function(...args){const start=performance.now();const r=original.apply(this,args);cost+=performance.now()-start;return r};function frame(now){if(previous&&n>5){samples.push(now-previous);render.push(cost)}cost=0;previous=now;H.dirty();if(++n<30)requestAnimationFrame(frame);else{H.ren.render=original;samples.sort((a,b)=>a-b);render.sort((a,b)=>a-b);resolve({frameMedianMs:samples[samples.length>>1],frameP90Ms:samples[Math.floor(samples.length*.9)],renderMedianMs:render[render.length>>1],draws:H.ren.info.render.calls,triangles:H.ren.info.render.triangles,pointLights:H.root.children.filter(o=>o.isPointLight).length})}}requestAnimationFrame(frame)}));
   rows.push({hour,perf});await writeFile(dir+tag+'-'+mode+'-state.json',JSON.stringify(rows,null,2));console.log('PERF',hour,JSON.stringify(perf));
  }
  assert.deepEqual(f.errors,[]);
 }finally{await f.browser.close()}
}
await writeFile(dir+tag+'-'+mode+'-state.json',JSON.stringify(rows,null,2));
console.log('FIX-1102 PASS',tag,mode);
