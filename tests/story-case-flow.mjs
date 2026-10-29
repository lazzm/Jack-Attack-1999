// Fresh-player physical Game Lad tutorial and saved case pair, without fabricated story events.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {insertCase} from './case-actions.mjs';
const dir=fileURLToPath(new URL('shots/story-case-flow/',import.meta.url));await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const f=await roomFixture(base,{opening:true,timeoutScale:3}),{page:p,until,view,errors}=f;
 const shot=n=>p.screenshot({path:dir+n+'.png',timeout:180000});
 try{
  await until(()=>window.StoryGuide&&st.current()?.id==='lad');
  assert.deepEqual(await p.evaluate(()=>StoryGuide.targets()),['media.box.gb.blocks']);
  await view([-56,-70,80],[-56,-1.3,18]);await p.evaluate(()=>House._.setMode('walk'));
  await p.keyboard.press('f');assert(!await p.evaluate(()=>!!window.RoomTV?.open_),'Empty handheld opened the retired game picker');
  await shot('01-filled-case-guidance');
  assert(await p.evaluate(()=>House.grab('media.box.gb.blocks')));
  assert.deepEqual(await p.evaluate(()=>StoryGuide.targets()),['console.gb']);await shot('02-slot-guidance');
  await insertCase(f,'media.box.gb.blocks','console.gb');
  await until(()=>RoomTV?._dbg()?.st==='game'&&!HouseCases.busy&&!House.gliding);
  assert.equal(await p.evaluate(()=>House.THINGS['media.gb.blocks'].snap),'console.gb');
  assert(await p.evaluate(()=>House.physics.body('media.box.gb.blocks').fixed));
  await p.keyboard.press('Enter');await p.keyboard.press('ArrowLeft');await until(()=>!!st.getState()?.done.lad);await shot('03-playing');
  await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
  await p.evaluate(()=>House.saveWalkState());const saved=await p.evaluate(()=>({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')}));
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&window.st?.getState()?.done.lad&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.mode),'walk');assert.deepEqual(await p.evaluate(()=>({x:House.W.x,z:House.W.z,off:localStorage.getItem('jhp_off')})),saved);
  assert.equal(await p.evaluate(()=>House.THINGS['media.gb.blocks'].snap),'console.gb');assert.equal(await p.evaluate(()=>House.THINGS['media.box.gb.blocks'].snap),'case.park.console.gb');
  assert.equal(await p.evaluate(()=>House.held()),null);assert(await p.evaluate(()=>House.physics.body('media.box.gb.blocks').fixed));await shot('04-resumed');
  assert.deepEqual(errors,[]);console.log('STORY CASE FLOW PASS: sparse signup, empty-machine guidance, case/slot targets, native E, real play event, parked/loaded refresh and standing/power');
 }finally{await f.browser.close()}
});
