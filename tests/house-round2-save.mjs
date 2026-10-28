// Real saved house records across migration, lazy room construction and repeated refresh; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=fileURLToPath(new URL('shots/house-round2-save/',import.meta.url));await mkdir(shots,{recursive:true});
const seed={pv:3,t:{mug:['drive',488,214.16,1000,25,0,0],cube:['garden',40,353,-180,25,0,0],
 'test.boot':['drive',488,301,834,45,0,0,{note:'keep metadata'}],
 'test.sofa':['lounge',-60,308,560,20,0,0], 'test.chair':['lounge',110,308,430,10,0,0],
 'test.newfootprint':['lounge',0,353,620,0,0,0],
 'test.unbuilt':['cupboard',370,353,420,17,0,1,{sw:99}],
 'test.snap':['drive',488,214.16,1000,22,'preserved.snap',1]},o:{'unbuilt.drawer':1}};
const account='Migrate'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,storage:{'jhp_gs_hs.things':{f:1,v:1,t:Date.now(),s:seed}}});
const {page,until,view,errors}=f;
try{
 await page.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r);HouseFamily.debug.hide(true);House.saveThings(true)});
 console.log('Migration restored',await page.evaluate(()=>({mug:House.THINGS.mug?.at,cube:House.THINGS.cube?.at,pv:Apps.loadGame('hs.things',1)?.pv})));
 await until(()=>House.THINGS.mug?.at.room==='drive'&&House.THINGS.cube?.at.room==='garden');
 const first=await page.evaluate(()=>({save:Apps.loadGame('hs.things',1),mug:{...House.THINGS.mug.at},cube:{...House.THINGS.cube.at},frame:{...House.ROOMS.drive.carFrame}}));
 assert.equal(first.save.pv,6);assert(Math.abs(first.mug.y-(353-first.frame.roof*first.frame.s))<.1,'Mug floats over the lowered car roof');
 assert(Math.hypot(first.mug.x-first.frame.x,first.mug.z-first.frame.z)<.1,'Roof item did not follow the car');
 assert.deepEqual(first.save.t['test.boot'],['drive',first.frame.x,301,first.frame.z-166,45,0,0,{note:'keep metadata'}]);
 assert.deepEqual(first.save.t['test.sofa'],['lounge',-60,308,605,20,0,0]);
 assert.deepEqual(first.save.t['test.chair'],['lounge',110,308,395,18,0,0]);
 assert(first.save.t['test.newfootprint'][3]<560,'A floor item was left under the moved sofa');
 for(const id of ['test.unbuilt','test.snap'])assert.deepEqual(first.save.t[id],seed.t[id],id+' lost flags or metadata');
 assert(first.save.o['unbuilt.drawer']);assert.equal(first.cube.x,40);assert.equal(first.cube.z,-180);
 await view([360,210,1120],[first.frame.x,first.mug.y-6,first.frame.z],{level:'G'});await page.screenshot({path:shots+'roof-native-eye.png'});
 await view([400,180,1280],[first.frame.x,first.mug.y-6,first.frame.z],{level:'G'});await page.screenshot({path:shots+'roof-contact-close.png'});
 await page.evaluate(()=>House.saveThings(true));
 const retained=await page.evaluate(()=>Apps.loadGame('hs.things',1));
 for(let pass=1;pass<=2;pass++){
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  await page.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r);HouseFamily.debug.hide(true);House.saveThings(true)});
  const next=await page.evaluate(()=>Apps.loadGame('hs.things',1));assert.equal(next.pv,6);
  for(const id of Object.keys(seed.t))assert.deepEqual(next.t[id],retained.t[id],'Repeat refresh moved or lost '+id);
  assert(next.o['unbuilt.drawer']);
 }
 assert.deepEqual(errors,[]);console.log('HOUSE ROUND 2 SAVE PASS: roof contact, car/sofa/chair remap, unbuilt/snapped/hidden records, metadata and two repeat refreshes');
}finally{await f.browser.close()}
