import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18460');
try {
  await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('gb.blocks')});
  await until(()=>RoomTV._dbg()?.st==='game');
  await p.evaluate(()=>window.handheldInstance=RoomTV.dbg());
  for(const [width,height,tag] of [[1366,860,'desktop'],[390,844,'narrow']]){
    await p.setViewportSize({width,height});
    if(!await p.evaluate(()=>RoomTV.lockIn()))await p.keyboard.press('t');
    await p.waitForTimeout(400);
    const rect=await p.locator('.rm-tvv.on .rm-glass').boundingBox();
    assert(Math.abs(rect.width/rect.height-10/9)<.01,'Game Lad keeps its native 10:9 screen');
    assert(rect.width<=width+1&&rect.height<=height+1);
    assert(await p.evaluate(()=>RoomTV.dbg()===handheldInstance));
    await p.screenshot({path:`shots/lock-in-handheld-${tag}.png`});
  }
  await p.keyboard.press('t');assert.equal(await p.evaluate(()=>RoomTV.lockIn()),false);
  assert(await p.evaluate(()=>RoomTV.dbg()===handheldInstance));
  await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));
  assert.deepEqual(errors,[]);
  console.log('HANDHELD LOCK IN PASS: T toggle, native 10:9, same game, desktop/narrow resize and Esc menu');
}finally{await browser.close()}
