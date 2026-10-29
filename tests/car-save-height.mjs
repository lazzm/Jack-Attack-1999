// Load a real pre-PV9 lid placement through the ordinary account/house entry path.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
await withTestServer(async base=>{
 const account='Lid'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,hour:18,timeoutScale:3}),{page:p,until,view,errors}=f;
 const load=async()=>{await p.evaluate(()=>House.buildRoom(House.ROOMS.drive));await until(()=>HouseFamily.ready&&!!House.ROOMS.drive.car)};
 try{
  await load();await view([-40,-70,150],[-40,0,0]);
  await p.evaluate(()=>{House._.setMode('walk');House.saveWalkState();House.saveThings(true);const s=structuredClone(Apps.loadGame('hs.things',1)),c=House.FRONT.CAR;s.pv=8;delete s.pv0;s.t.mug=['drive',c.x,c.y-79*c.s,c.z-160*c.s,15,0,0];sessionStorage.setItem('__oldCarLid',JSON.stringify(s))});
  await p.addInitScript(()=>{const s=sessionStorage.getItem('__oldCarLid');if(s){sessionStorage.removeItem('__oldCarLid');localStorage.setItem('jhp_hs_things',JSON.stringify({...JSON.parse(s),_savedAt:Date.now()+10000}))}});
  const reload=async()=>{await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));await load()};
  await reload();
  const pose=()=>p.evaluate(()=>{const t=House.THINGS.mug,c=House.FRONT.CAR,b=House.physics.body('mug');return{at:{...t.at},expected:c.y-81.5*c.s,overlap:House.physics.world.overlapping(b)}});
  const a=await pose();assert.equal(a.at.room,'drive');assert(Math.abs(a.at.y-a.expected)<.11,JSON.stringify(a));assert(!a.overlap,JSON.stringify(a));
  const c=await p.evaluate(()=>House.FRONT.CAR),eye=await p.evaluate(()=>House.LV.G-House.STAND);await view([c.x-110,eye,c.z-280],[c.x,c.y-81.5*c.s,c.z-160*c.s],{level:'G'});await mkdir(new URL('shots/car-save-height/',import.meta.url),{recursive:true});await p.screenshot({path:new URL('shots/car-save-height/lid.png',import.meta.url).pathname,timeout:180000});
  await view([-40,-70,150],[-40,0,0]);await p.evaluate(()=>{House._.setMode('walk');House.saveWalkState();House.saveThings(true)});await reload();const b=await pose();assert.deepEqual(b.at,a.at);assert(!b.overlap);assert.deepEqual(errors,[]);console.log('CAR SAVE HEIGHT PASS: real PV8 lid migration, physical contact and repeat refresh');
 }finally{await f.browser.close()}
});
