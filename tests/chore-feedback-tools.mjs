// Visual feedback through production action callbacks/tool-head input.
// This is not a walking-reachability or wage audit. All data is disposable.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
import {withTestServer} from './perf/server.mjs';
const shots=fileURLToPath(new URL('shots/chore-feedback/',import.meta.url));
await mkdir(shots,{recursive:true});
await withTestServer(async base=>{
 const account='Feedback'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,timeoutScale:3}),{page:p,until,view,errors}=f;
 const photo=async(name,eye,target)=>{await view(eye,target,{level:'G'});await p.evaluate(()=>House.hush());await p.screenshot({path:shots+name+'.png',timeout:180000})};
 const act=id=>p.evaluate(id=>House.act(id),id);
 const drop=()=>p.evaluate(()=>ChoreKit.tool.drop(true));
 try{
  await p.evaluate(async()=>{for(const id of ['hall','kitchen','lounge','drive','garden'])House.buildRoom(House.ROOMS[id]);HouseFamily.debug.hide(true);await Chores.load();for(const id of ['bedroom','kitchen','lounge','drive'])await Chores.part(id)});
  await until(()=>['car','hoover','sweep','lawn'].every(id=>ChoreKit.MODS[id]?._built));
  const frame=await p.evaluate(()=>({...House.ROOMS.drive.carFrame}));
  const carEye=[frame.x-210,205,frame.z-70],carTarget=[frame.x-65,300,frame.z];
  await photo('car-before',carEye,carTarget);await act('ch.bucket');
  assert.equal(await p.evaluate(()=>ChoreKit.tool.cur?.id),'sponge');
  for(let i=0;i<10;i++)for(let scrub=0;scrub<3;scrub++){await act('ch.mud'+i);await p.waitForTimeout(350)}
  await until(()=>Array.from({length:10},(_,i)=>House.SPOTS['ch.mud'+i].off&&ChoreKit.has('car','m'+i)).every(Boolean));
  await act('ch.bucket');await until(()=>ChoreKit.has('car','rinse'));
  await photo('car-after',carEye,carTarget);console.log('FEEDBACK car: all ten mud patches removed by real scrub/rinse callbacks');
  await photo('hoover-before',[-80,205,670],[-100,350,480]);await act('ch.hoover');await view([60,210,450],[60,325,307],{level:'G'});await act('ch.socket');
  assert(await p.evaluate(()=>ChoreKit.tool.plugged),'Vacuum did not plug in');
  for(const [x,z]of [[-215,385],[-150,402],[-205,478],[-182,628],[-58,386],[22,402],[32,498],[-92,506],[104,520],[60,642],[-60,534],[-215,520]]){
   await p.evaluate(({x,z})=>ChoreKit.tool.cur.frame({x,z:z-6,fx:0,fz:1,room:'lounge'}),{x,z});await p.waitForTimeout(500);
  }
  await until(()=>Array.from({length:9},(_,i)=>ChoreKit.has('hoover','d'+i)).every(Boolean));await drop();
  await photo('hoover-after',[-80,205,670],[-100,350,480]);console.log('FEEDBACK hoover: nine crumb groups removed by tool-head callbacks');
  // Match the authored leaf piles; leave the car, sack and mower untouched.
  await photo('sweep-before',[270,180,1300],[180,351,970]);await act('ch.broom');
  assert.equal(await p.evaluate(()=>ChoreKit.tool.cur?.id),'broom');
  const leafPoints=await p.evaluate(()=>House.ROOMS.drive.group.children.filter(o=>o.type==='Group'&&o.position.y===353&&o.children.filter(m=>m.isMesh&&m.material?.color&&['c8601a','e0a020','a8401a','8a6a2a','d8802a'].includes(m.material.color.getHexString())).length===26).map(o=>({x:o.position.x,z:o.position.z})));
  console.log('Leaf groups selected:',leafPoints);
  // If the builder changes, fail the fixture instead of claiming an empty pass.
  assert.equal(leafPoints.length,7,'Expected seven real leaf-pile groups');
  for(const q of leafPoints){await p.evaluate(q=>ChoreKit.tool.cur.frame({...q,fx:0,fz:1,room:'drive'}),q);await p.waitForTimeout(600)}
  await until(()=>Array.from({length:7},(_,i)=>ChoreKit.has('sweep','l'+i)).every(Boolean));await act('ch.sack');await until(()=>ChoreKit.has('sweep','tip'));await photo('sweep-after',[270,180,1300],[180,351,970]);
  console.log('FEEDBACK sweep: seven real piles swept and tipped into the sack');
  await photo('lawn-before',[-210,180,1100],[-285,353,1030]);await act('ch.mower');await act('ch.osocket');
  assert(await p.evaluate(()=>ChoreKit.tool.plugged),'Mower did not plug in');
  const lawnEnd=await p.evaluate(()=>House.FRONT.HEDGE[0]-20);
  for(let z=740;z<lawnEnd;z+=28){await p.evaluate(z=>ChoreKit.tool.cur.frame({x:-302,z,fx:0,fz:1,room:'drive'}),z);await p.waitForTimeout(120)}
  const cut=await p.evaluate(()=>{const v=ChoreKit.S.v.lawn;return v?.cut?Array.from(atob(v.cut),c=>c.charCodeAt(0)).filter(Boolean).length:0});
  assert(cut>80,'The mower did not cut a visible strip: '+cut);await drop();
  await photo('lawn-after',[-210,180,1100],[-285,353,1030]);console.log('FEEDBACK lawn: actual cut mask and blade field changed, cut cells',cut);
  assert.deepEqual(errors,[]);console.log('CHORE TOOL FEEDBACK PASS: no browser errors; callbacks/head input, not walking reachability');
 }finally{await f.browser.close()}
});
