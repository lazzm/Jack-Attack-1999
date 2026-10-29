// Vehicle-local washing marks, unchanged chore progress and solid front/back/side views.
import assert from 'node:assert/strict';import{mkdir}from'node:fs/promises';
import{roomFixture}from'./room-fixture.mjs';import{withTestServer}from'./perf/server.mjs';
const dir=new URL('shots/car-details/',import.meta.url);await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='Detail'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,hour:18,touch:true,timeoutScale:3}),{page:p,until,view,errors}=f;
 const shot=name=>p.screenshot({path:new URL(name+'.png',dir).pathname,timeout:180000});
 async function clock(t){await view([-40,-70,150],[-40,0,0]);await p.evaluate(t=>{HouseFamily.debug.clock({md:1029,dow:5,t});HouseFamily.debug.sim(240,.1);House.ROOMS.drive.car.update()},t)}
 const state=()=>p.evaluate(()=>({sc:{...ChoreKit.S.v.car.sc},prog:{...ChoreKit.S.prog.car},done:ChoreKit.done('car')}));
 try{
  await p.evaluate(async()=>{House.buildRoom(House.ROOMS.drive);await Chores.load();await Chores.part('drive')});await until(()=>window.HouseFamily?.ready&&ChoreKit.MODS.car?._built);await clock(18);
  // Renderer/save fixture for a partly cleaned car, without earning or changing server-held money.
  await p.evaluate(()=>{const C=ChoreKit;C.S.v.car.sc[0]=1;C.S.prog.car={...C.S.prog.car,m7:1};C.save();C.MODS.car.sync()});const progress=await state();
  assert(await p.evaluate(()=>Array.from({length:10},(_,i)=>House.SPOTS['ch.mud'+i].obj).every(o=>{for(let q=o;q;q=q.parent)if(q===House.ROOMS.drive.car.group)return true;return false})),'A washing target is detached from the car');
  const c=await p.evaluate(()=>House.ROOMS.drive.carFrame),eye=await p.evaluate(()=>House.LV.G-House.STAND);
  if(process.env.CAR_DETAIL_FAST!=='1')for(const[name,e,t]of [['front',[c.x+20,eye,c.z+360],[c.x,280,c.z+70]],['right',[c.x+190,eye,c.z-40],[c.x,280,c.z]],['left',[c.x-190,eye,c.z+100],[c.x,280,c.z]],['rear',[c.x,eye,c.z-290],[c.x,280,c.z-140]]]){await view(e,t,{level:'G'});await shot(name)}
  await clock(14);await until(()=>!House.ROOMS.drive.car.present);assert.deepEqual(await state(),progress);
  const target=await p.evaluate(()=>{const v=new House.T.Box3().setFromObject(House.SPOTS['ch.bucket'].obj).getCenter(new House.T.Vector3());return[v.x,-v.y,v.z]});await view([target[0]+70,eye,target[2]-60],target,{level:'G'});await p.evaluate(()=>{House.hush();House._.setMode('walk')});assert(['ch.bucket','ch.car-sponge'].includes(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot)),'Neither bucket nor sponge can be used');await p.keyboard.press('f');
  await p.locator('.hs-note.on').waitFor({state:'visible'});const message=await p.locator('.hs-note.on p').textContent();console.log('Away washing message',JSON.stringify(message),await p.evaluate(()=>({present:House.ROOMS.drive.car.present,held:House.held(),tool:ChoreKit.tool.cur?.id,notes:Array.from(document.querySelectorAll('.hs-note')).map(n=>({class:n.className,text:n.textContent}))})));assert(message.includes('car is away'),message);await p.evaluate(()=>House.act('ch.mud0'));assert(await p.evaluate(()=>ChoreKit.tool.cur===null&&House.SPOTS['ch.mud0'].off),'Away car washing can still begin');assert.deepEqual(await state(),progress);
  await view([c.x-190,eye,c.z-240],[c.x,300,c.z],{level:'G'});await shot('away-no-floating-marks');
  await clock(18);await until(()=>House.ROOMS.drive.car.present);assert(await p.evaluate(()=>House.SPOTS['ch.sponge'].obj===House.THINGS['ch.sponge'].obj),'Car sponge replaced the kitchen sponge target');assert.deepEqual(await state(),progress);assert(await p.evaluate(()=>!House.SPOTS['ch.mud0'].off&&House.SPOTS['ch.mud7'].off),'Washing picks lost their partial/completed state');
  assert.deepEqual(errors,[]);console.log('CAR DETAILS PASS: front/back/both sides, attached marks/picks, away washing refused, partial/completed progress retained');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
