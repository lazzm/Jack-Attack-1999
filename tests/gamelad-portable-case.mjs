// Loaded handheld stays visible and saved when carried to another room.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {playCase} from './case-actions.mjs';
const dir=fileURLToPath(new URL('shots/gamelad-portable-case/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='Portable'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,timeoutScale:3}),{page:p,view,until,errors}=f;
 p.on('console',m=>{if(m.type()==='info'&&m.text().startsWith('[house]'))console.log(m.text())});
 const shot=n=>p.screenshot({path:dir+n+'.png',timeout:180000});
 async function coherent(){assert(await p.evaluate(()=>{const g=House.THINGS.gb,m=House.THINGS['media.gb.blocks'];return House.SNAPS['console.gb'].room==='kitchen'&&m.obj.parent===g.obj.parent&&m.obj.visible}),'Cartridge is not visible in the handheld room')}
 try{
  await playCase(f,'gb.blocks');await p.evaluate(()=>window.portableGame=RoomTV.dbg());await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);assert(await p.evaluate(()=>House.grab('gb')));
  const cell=await p.evaluate(()=>{House.buildRoom(House.ROOMS.kitchen);const r=House.ROOMS.kitchen;for(const a of r.area)for(let z=a[1]+50;z<a[3]-40;z+=35)for(let x=a[0]+50;x<a[2]-40;x+=35)if(House._.cellOk('G',x,z))return[x,House.LV.G-(r.eye||House.STAND),z];return null});assert(cell,'No clear kitchen fixture cell');
  await view(cell,[cell[0],cell[1],cell[2]-50],{level:'G'});await p.evaluate(()=>House._.setMode('walk'));await until(()=>House.here==='kitchen'&&House.THINGS.gb.at.room==='kitchen');await coherent();await shot('01-carried-downstairs');
  await p.keyboard.press('x');await until(()=>!House.held()&&House.THINGS.gb.st==='rest');await coherent();assert.equal(await p.evaluate(()=>House.THINGS['media.gb.blocks'].at.room),'kitchen');await shot('02-settled');
  const home=await p.evaluate(()=>({...House.THINGS.gb.at}));await p.evaluate(()=>House.interact('gb'));await until(()=>RoomTV.open_&&!House.gliding);assert(await p.evaluate(()=>RoomTV.dbg()===portableGame),'Moving the handheld restarted its game');await coherent();await shot('03-playing');
  await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding&&House.THINGS.gb.st==='rest');assert(await p.evaluate(h=>{const a=House.THINGS.gb.at;return a.room===h.room&&Math.hypot(a.x-h.x,a.y-h.y,a.z-h.z)<.1},home),'Handheld did not return to its kitchen placement');
  await p.evaluate(()=>House.saveWalkState());assert.equal(await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem('jhp_gs_hs.things')||'null'),b=JSON.parse(localStorage.getItem('jhp_gsl_hs.things')||'null');return (!a||b&&b.t>a.t?b:a)?.s?.t?.gb?.[0]}),'kitchen','Handheld pose was not saved before refresh');const saved=await p.evaluate(()=>({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')}));await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&House.THINGS.gb.at.room==='kitchen'&&!document.querySelector('.hs-loading,#houseEntry'));await p.waitForTimeout(500);await coherent();
  assert.equal(await p.evaluate(()=>House.mode),'walk');assert.deepEqual(await p.evaluate(()=>({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')})),saved);assert.equal(await p.evaluate(()=>House.THINGS['media.box.gb.blocks'].at.room),'bedroom');assert.equal(await p.evaluate(()=>House.THINGS['media.box.gb.blocks'].snap),'case.park.console.gb');assert(await p.evaluate(()=>House.physics.body('media.box.gb.blocks').fixed));await shot('04-refreshed');await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&House.THINGS.gb.at.room==='kitchen'&&!document.querySelector('.hs-loading,#houseEntry'));await coherent();assert.equal(await p.evaluate(()=>House.mode),'walk');await view([home.x+30,home.y-28,home.z+45],[home.x,home.y-4,home.z],{level:'G'});await shot('05-refreshed-close');assert.deepEqual(errors,[]);
  console.log('PORTABLE CASE PASS: real X drop downstairs, room/layer visibility, same running game, exact return, original fixed case and standing/power refresh');
 }finally{await f.browser.close()}
});
