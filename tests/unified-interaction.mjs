import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
await mkdir('shots/interactions',{recursive:true});
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
const shot=n=>p.screenshot({path:'shots/interactions/'+n+'.png'});
try{
 await f.view([25,-70,125],[0,0,-12]);await p.evaluate(()=>House._.setMode('walk'));
 for(const id of ['mug','football','vpet','cube']){
  await p.evaluate(id=>House.grab(id),id);await p.keyboard.press('f');await until(()=>House.mode==='inspect');
  assert.equal(await p.locator('.hs-hold').isVisible(),false);
  if(id==='mug'){assert(await p.locator('.hs-inspect-description').isVisible());assert(!await p.locator('.hs-note').evaluate(el=>el.classList.contains('on')));await p.keyboard.press('f');await shot('mug')}
  if(id==='vpet'){await p.keyboard.press('a');await p.keyboard.press('b');await p.keyboard.press('c');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('jhp_rm_pet')).care>0),true);await shot('pet')}
  if(id==='football'){const before=await p.evaluate(()=>House.THINGS.football.obj.quaternion.toArray());await p.keyboard.press('ArrowUp');assert.notDeepEqual(await p.evaluate(()=>House.THINGS.football.obj.quaternion.toArray()),before);await p.keyboard.press('+');await p.keyboard.press('r');await shot('football')}
  await p.keyboard.press('Escape');await until(()=>HousePause.open);await shot('inspect-menu');await p.keyboard.press('Escape');await until(()=>!HousePause.open);assert.equal(await p.evaluate(()=>House.mode),'inspect');await p.keyboard.press('q');await until(()=>House.mode==='walk');assert.equal(await p.evaluate(()=>House.held()),id);await p.keyboard.press('q');await until(()=>!House.held());await p.waitForTimeout(400);
 }
 await p.evaluate(()=>House.grab('mug'));await p.keyboard.press('i');await until(()=>House.mode==='inspect');assert(await p.locator('.hs-inspect-description').isVisible());await p.keyboard.press('q');await p.keyboard.press('q');
 for(const seat of ['beanbag','chair']){
  assert(await p.evaluate(id=>House.sitOn(id),seat));await until(()=>House.mode==='focus'&&!!House._.focusS?.o.seatId&&!House.gliding);
  await p.evaluate(()=>House.grab('vpet'));await p.keyboard.press('f');await until(()=>House.mode==='inspect');await p.keyboard.press('a');await shot(seat+'-pet');await p.keyboard.press('q');await until(()=>House.mode==='focus');assert.equal(await p.evaluate(()=>House.seated),seat);assert.equal(await p.evaluate(()=>House.held()),'vpet');await p.keyboard.press('q');await until(()=>!House.held());
  await p.evaluate(()=>House.grab('reading.mag.bed'));await p.keyboard.press('f');await until(()=>House.mode==='inspect'&&!!Magazines.reading);await p.keyboard.press('ArrowRight');await until(()=>!Magazines.reading.flipping);await shot(seat+'-reading');await p.keyboard.press('q');await until(()=>House.mode==='focus');assert.equal(await p.evaluate(()=>House.seated),seat);await p.keyboard.press('q');await until(()=>!House.held());
  await p.evaluate(()=>House.grab('gb'));await p.keyboard.press('f');await until(()=>window.RoomTV?.open_&&House.mode==='focus'&&!House.gliding);assert.equal(await p.evaluate(()=>House.seated),seat);await p.evaluate(()=>RoomTV.playPhysical('gb.blocks'));await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('Enter');await p.waitForTimeout(250);await shot(seat+'-handheld');
  await p.keyboard.press('t');assert(await p.evaluate(()=>RoomTV.lockIn()));await p.keyboard.press('t');await p.keyboard.press('q');await until(()=>House.mode==='focus'&&House._.focusS?.o.seatId&&!House.gliding);assert.equal(await p.evaluate(()=>House.seated),seat);assert.equal(await p.evaluate(()=>House.held()),'gb');await shot(seat+'-return');
  await p.keyboard.press('q');await until(()=>!House.held());await p.evaluate(()=>House.saveWalkState());await p.reload({waitUntil:'domcontentloaded'});await until(()=>House.mode==='focus'&&!!House.seated&&!House.gliding&&AccountGate.allowed&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>House.seated),seat);await p.keyboard.press('w');await until(()=>House.mode==='walk'&&!House.gliding);
 }
 const at=await p.evaluate(()=>({...House.THINGS.beanbag.at}));await f.view([at.x+110,-55,at.z],[at.x,at.y-24,at.z]);await p.evaluate(()=>{House._.setMode('walk');House.grab('gb')});await p.keyboard.press('f');await until(()=>House.seated==='beanbag'&&!House.gliding);assert.equal(await p.evaluate(()=>House.held()),'gb');await shot('sit-with-handheld');await p.keyboard.press('q');await p.keyboard.press('w');await until(()=>House.mode==='walk'&&!House.gliding);
 assert.deepEqual(errors,[]);console.log('UNIFIED INTERACTION PASS: F/I same real close-up, contextual descriptions, use/rotation/zoom, Esc/cursor, pet care, chair/beanbag pet+held Game Lad/LOCK IN/Q/refresh, zero errors');
}catch(e){await shot('failure');console.log(await p.evaluate(()=>({mode:House.mode,seat:House.seated,held:House.held(),focus:House._.focusS?.o.seatId,parent:House._.focusS?.parent?.o.seatId})));throw e}finally{await f.browser.close()}
