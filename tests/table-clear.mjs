// Real table placement, seasonal clearance, old completed poses, refresh and redo.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
import {withTestServer} from './perf/server.mjs';
import {placeChore} from './chore-actions.mjs';
const dir=fileURLToPath(new URL('shots/table-clear/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 const f=await roomFixture(base,{account:'Jack',password,signup:false,touch:true,timeoutScale:3}),{page:p,until,view,errors}=f;
 const shot=name=>p.screenshot({path:dir+name+'.png',timeout:180000});
 async function load(){await p.evaluate(async()=>{await Room.ensureHouse();House.buildRoom(House.ROOMS.kitchen);HouseFamily.debug.hide(true);await Chores.load();await Chores.part('kitchen')});await until(()=>ChoreKit.MODS.table?._built&&OwnerTools.allowed)}
 async function panel(){await p.keyboard.press('Backquote');await until(()=>!!document.querySelector('.owner-tools')?.open);await p.locator('[data-tab=world]').click()}
 async function redo(){await panel();await p.locator('[name=chore]').selectOption('table');await p.locator('[data-owner=chore]').click();await until(()=>!document.querySelector('.owner-tools')?.open&&!ChoreKit.has('table','sauce')&&!House.gliding);await p.evaluate(()=>House.hush())}
 async function clock(date){await panel();await p.locator('[name=date]').fill(date);await p.locator('[name=hour]').fill('14');await p.locator('[data-owner=clock]').click();await p.waitForFunction(date=>OwnerTools.clock?.date===date,date);await p.keyboard.press('Escape');await p.evaluate(()=>HousePause.close());await p.waitForTimeout(1000)}
 const state=()=>p.evaluate(()=>({at:{...House.THINGS['ch.t.sauce'].at},flags:{...ChoreKit.S.prog.table},season:JSON.stringify(Season.server),power:localStorage.getItem('jhp_off')}));
 async function clear(){const q=await p.evaluate(()=>{const t=House.THINGS['ch.t.sauce'],box=new THREE.Box3().setFromObject(t.obj);return{at:t.at,min:box.min.toArray(),max:box.max.toArray(),height:t.h}});assert(Math.hypot(q.at.x+45,q.at.z-174)>15+4+2,'Bottle intersects pumpkin');assert(Math.abs(q.at.y-277)<.01);assert(q.height>19&&q.height<22);return q}
 async function refresh(){const before=await state();await p.evaluate(()=>{House.saveWalkState();ChoreKit.save()});await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await load();const after=await state();assert.deepEqual(after.flags,before.flags);assert.deepEqual(after.at,before.at);assert.equal(after.power,before.power);await clear()}
 try{
  await load();await clock('1999-10-29');await redo();
  for(let i=0;i<4;i++)for(const k of ['p','k','g'])await placeChore(f,'ch.t.'+k+i,'ch.s.t'+k+i);
  await placeChore(f,'ch.t.sauce','ch.s.sauce');await clear();assert(await p.evaluate(()=>Object.keys(ChoreKit.S.prog.table).length===13));console.log('TABLE: thirteen real E placements PASS');
  const completed=await state();
  // Renderer-only old completed position; migration must retain earned flags and seasonal progress.
  await p.evaluate(()=>{const t=House.THINGS['ch.t.sauce'];t.st='rest';t.snap=null;t.at={room:'kitchen',x:-54,y:277,z:172,ry:0};House.place(t);ChoreKit.keep(t.id);ChoreKit.MODS.table.sync()});
  const migrated=await state();assert.deepEqual(migrated.flags,completed.flags);assert.equal(migrated.season,completed.season);await clear();await refresh();console.log('TABLE: old completed pose and refresh PASS');
  for(const[w,h,name]of[[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){await p.setViewportSize({width:w,height:h});await view([90,170,270],[-54,275,172],{level:'G'});await shot('complete-'+name)}
  await p.setViewportSize({width:1366,height:860});for(const[name,eye]of[['left',[-150,190,240]],['close',[-110,220,215]],['right',[40,200,160]]]){await view(eye,[-65,268,169],{level:'G'});await shot('complete-'+name)}
  await clock('1999-09-15');await view([90,170,270],[-54,275,172],{level:'G'});await clear();await shot('no-pumpkin');await clock('1999-10-29');
  await redo();assert(await p.evaluate(()=>['p','k','g'].every(k=>[0,1,2,3].every(i=>House.THINGS['ch.t.'+k+i].at.z<10))&&House.THINGS['ch.t.sauce'].at.z===-20),'Redo did not return all pieces to worktop');
  await p.setViewportSize({width:390,height:844});const cdp=await p.context().newCDPSession(p);
  async function finger(q){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...q,id:1,radiusX:6,radiusY:6,force:1}]});await p.waitForTimeout(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  await finger({x:195,y:2});await p.evaluate(async()=>{if(document.pointerLockElement){document.exitPointerLock();await new Promise(r=>setTimeout(r,200))}HousePause.close()});assert(await p.evaluate(()=>GameInput.touch));
  await placeChore(f,'ch.t.sauce','ch.s.sauce',{place:async()=>{const q=await p.locator('.ht-hud .ht-b[data-k=e]').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});await finger(q)}});await clear();await refresh();await view([-110,220,215],[-75,267,168],{level:'G'});await shot('touch-bottle');
  assert.deepEqual(errors,[]);console.log('TABLE CLEAR PASS: native E, old pose/progress, refresh, six sizes/three angles, seasons, owner redo and actual phone E');
 }catch(e){await shot('failure').catch(()=>{});throw e}finally{await f.browser.close()}
});
