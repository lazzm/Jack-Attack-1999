// Run sequentially against a disposable localhost server. No media grants or
// ownership changes: all disc paths use audio CDs already owned by the fixture.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18080');
await mkdir('shots',{recursive:true});
const shot=async(name,eye,target)=>{await view(eye,target);await p.screenshot({path:`shots/bedroom-${name}.png`})};
async function aim(eye,target){await view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})}
try {
  await until(()=>!!window.RoomHiFi?.state);
  const pc=await p.evaluate(()=>Discs.drive);
  assert.equal(await p.evaluate(()=>House.THINGS.hifi?.id||null),null,'Hi-fi body must use its physical controls');
  await p.evaluate(()=>{House.hush();House.act('rack')});
  assert.equal(await p.evaluate(()=>!!document.querySelector('.rm-rackbig,.pmd-gw')),false,'Shelf opened a legacy media interface');
  assert.equal(await p.evaluate(()=>House.held()),null);
  await shot('hifi-front',[-156,-38,212],[-250,-24,212]);
  await shot('hifi-side',[-195,-44,163],[-250,-25,209]);
  await shot('hifi-rear',[-276,-41,174],[-256,-23,212]);
  await shot('wardrobe-shut',[-122,-55,205],[-228,-32,118]);
  await p.evaluate(()=>{House.hush();House.toggle('wardrobe0',true);House.toggle('wardrobe1',true)});
  await p.waitForTimeout(550);await shot('wardrobe-open',[-122,-55,205],[-247,-32,118]);
  for(let i=0;i<3;i++){
    await p.evaluate(i=>{House.hush();House.toggle('bedroom.drawer.'+i,true)},i);await p.waitForTimeout(500);
    await shot('drawer-'+i,[-160,-43,189],[-226,20+i*16,212]);
    await p.evaluate(i=>House.toggle('bedroom.drawer.'+i,false),i);await p.waitForTimeout(500);
  }
  await shot('schoolbag-front',[68,21,171],[58,52,226]);
  await shot('schoolbag-straps',[27,17,244],[58,49,226]);
  await shot('coaster-front',[-10,-166,15],[-10,-140,-47]);
  await shot('coaster-side',[30,-165,-8],[-10,-145,-47]);
  await p.evaluate(()=>House.act('coaster'));const car=await p.evaluate(()=>House.ROOMS.bedroom.group.getObjectByName('coaster-car').position.toArray());
  await p.waitForTimeout(700);assert.notDeepEqual(await p.evaluate(()=>House.ROOMS.bedroom.group.getObjectByName('coaster-car').position.toArray()),car);
  const audio=await p.evaluate(()=>['pm.gub','pm.mix'].find(id=>PM.owns(id)&&House.THINGS['pmd.'+id]));
  if(audio){
    await aim([-156,-55,212],[-244,-21,212]);await p.evaluate(()=>House.act('hifi'));await until(()=>RoomHiFi.state.open&&House.SNAPS['hifi.cd'].enabled());
    await p.evaluate(id=>PMGL.takeDisc(id),audio);await until(()=>House.held()?.startsWith('pmd.'));
    await aim([-156,-55,212],[-234,-18.5,212]);await p.keyboard.press('e');
    await until(()=>!!RoomHiFi.state.disc&&House.THINGS[RoomHiFi.state.disc].st==='snap');
    await shot('hifi-loaded-tray',[-174,-49,194],[-234,-18.5,212]);
    await p.evaluate(()=>{House.hush();House.act('hifi.play')});assert(await p.evaluate(()=>RoomHiFi.state.playing));
    assert(await p.evaluate(()=>House.THINGS[RoomHiFi.state.disc].at.hide));
    await p.evaluate(()=>{House.saveThings(true);House.saveWalkState()});
    await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.RoomHiFi?.state?.playing&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
    assert.equal(await p.evaluate(()=>Discs.drive),pc,'Hi-fi must not insert a CD into the PC');
    await p.evaluate(id=>window.expectedHiFiDisc='pmd.'+id,audio);await aim([-156,-55,212],[-243,-14.7,206.8]);await p.keyboard.press('e');await until(()=>House.held()===window.expectedHiFiDisc);
    assert.equal(await p.evaluate(()=>RoomHiFi.state.disc),null);await p.keyboard.press('f');await until(()=>!House.held());
  }else console.log('Physical insertion path unavailable: this disposable profile owns no audio CDs; no ownership was granted. Run the CPU unit test for this branch.');
  // Close events from a later downstairs UI must leave its camera in place.
  await view([30,240,60],[30,270,-40],{roomPoint:[30,240,60],level:'G'});
  const before=await p.evaluate(()=>[House.P.x,House.P.y,House.P.z]);await p.evaluate(()=>Room._.emit('close'));await p.waitForTimeout(900);
  assert.deepEqual(await p.evaluate(()=>[House.P.x,House.P.y,House.P.z]),before,'Downstairs close returned to bedroom');
  await p.setViewportSize({width:390,height:844});
  await shot('hifi-phone',[-173,-34,185],[-249,-24,212]);
  await shot('wardrobe-phone',[-107,-59,195],[-243,-31,119]);
  await shot('coaster-phone',[-10,-164,12],[-10,-141,-47]);
  assert.deepEqual(errors,[]);console.log('BEDROOM BROWSER PASS: physical shelf/CD paths, restore, controls, models and desktop/phone screenshots. Visually inspect the PNGs.');
} finally {await browser.close()}
