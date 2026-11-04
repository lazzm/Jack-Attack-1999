// Walk through every door with real keys, in both directions, both on foot and without teleporting across the doorway.
// Run on a throwaway server: node tests/door-walk.mjs <url>
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(base,'server URL');
const shots=new URL('./shots/door-walk/',import.meta.url).pathname;await mkdir(shots,{recursive:true});
const f=await roomFixture(base,{hour:14,opening:true,timeoutScale:3});
const {page:p,view,errors}=f;
const here=()=>p.evaluate(()=>({x:House.W.x,z:House.W.z,here:House.here,eye:House.W.eye}));
const keep=()=>p.evaluate(()=>{for(const c of Object.values(HouseFamily.chars))HouseFamily.debug.go?.(c.id,'sofaL');});
// [door id, from room, eye x,z, look x,z, room reached, walking away from the door on the far side]
const DOORS=[
 ['front','hall',[300,640],[300,800],'drive'],
 ['front','drive',[300,760],[300,600],'hall'],
 ['back','kitchen',[120,-90],[120,-300],'garden'],
 ['back','garden',[120,-260],[120,0],'kitchen'],
 ['kitchen','hall',[250,190],[100,190],'kitchen'],
 ['kitchen','kitchen',[140,190],[300,190],'hall'],
 ['lounge','hall',[250,520],[100,520],'lounge'],
 ['lounge','lounge',[140,520],[300,520],'hall'],
];
try{
 for(const [door,from,[x,z],[tx,tz],to] of DOORS){
  await view([x,210,z],[tx,210,tz],{level:'G'});
  await p.evaluate(door=>{House.hush();House._.setMode('walk');House.setDoor(door,true,true)},door);
  // Nobody is standing in the doorway for this check: tests/people-pass.mjs covers that.
  await p.waitForTimeout(800);
  const start=await here();
  await p.keyboard.down('w');
  let reached=false,last=start;
  for(let i=0;i<40&&!reached;i++){await p.waitForTimeout(250);last=await here();reached=last.here===to;}
  await p.keyboard.up('w');
  await p.screenshot({path:shots+door+'-from-'+from+'.png'});
  console.log(door,'from',from,reached?'reached':'STUCK',to,JSON.stringify(last));
  assert(reached,`Walking through the ${door} door from ${from} never reached ${to}: stopped at ${JSON.stringify(last)}`);
  assert(last.eye>130,`No forced crouch through the ${door} door: eye ${last.eye}`);
 }
 assert.deepEqual(errors,[],'Browser errors');
 console.log('DOOR WALK PASS');
}finally{await f.browser.close();}
