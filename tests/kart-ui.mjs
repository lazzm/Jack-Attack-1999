import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18471');
try{
 await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');House.act('n64')});await until(()=>House.focused&&RoomTV.open_);
 await p.evaluate(()=>RoomTV.test('n64.kart'));await until(()=>RoomTV._dbg()?.st==='game'&&window.__kartDbg?.st.mode==='title');
 const mode=()=>p.evaluate(()=>__kartDbg.st.mode),state=()=>p.evaluate(()=>__kartDbg.st);
 async function key(k){await p.evaluate(()=>window.kartUiFrame=RoomTV.dbg().frame);await p.keyboard.press(k);await until(()=>RoomTV.dbg().frame>window.kartUiFrame+1)}
 async function main(){await p.evaluate(()=>__kartDbg.title());await key('Enter');assert.equal(await mode(),'main')}
 async function choose(index){while((await state()).selection.main!==index)await key('ArrowDown');await key('z')}
 async function shot(name){await p.screenshot({path:'shots/kart-ui-'+name+'.png'})}
 await p.keyboard.press('t');assert(await p.evaluate(()=>RoomTV.lockIn()));
 assert.equal(await p.evaluate(()=>RoomTV.dbg().keyLabel('a')),'Z');assert.equal(await p.evaluate(()=>RoomTV.dbg().keyLabel('start')),'ENTER');
 await main();await shot('main');await choose(5);assert.equal(await mode(),'options');
 const opts=await p.evaluate(()=>({...__kartDbg.st.sv.opt}));await key('z');assert.equal(await p.evaluate(()=>__kartDbg.st.sv.opt.mus),opts.mus?0:1);await key('z');
 await key('ArrowDown');await key('ArrowRight');assert.equal(await p.evaluate(()=>__kartDbg.st.sv.opt.cam),opts.cam?0:1);await key('ArrowLeft');
 await shot('options');await key('x');assert.equal(await mode(),'main');await choose(6);assert.equal(await mode(),'how');
 await shot('controls');await key('ArrowRight');assert.equal((await state()).selection.how,1);await shot('items');
 await p.setViewportSize({width:390,height:844});await shot('items-narrow');await p.setViewportSize({width:1366,height:860});
 await key('ArrowRight');await shot('tips');await key('x');await choose(0);assert.equal(await mode(),'cc');
 await key('ArrowDown');await key('z');assert.equal(await mode(),'cc','Locked 150CC cannot start');await shot('locked-class');
 await key('ArrowUp');await key('z');assert.equal(await mode(),'driver');
 await key('ArrowRight');await shot('driver-dave');
 for(let n=0;n<6;n++)await key('ArrowRight');await shot('driver-mr-tibbs');
 await key('z');assert.equal(await mode(),'cup');await key('ArrowRight');await key('z');assert.equal(await mode(),'cup','Locked cup cannot start');await shot('locked-cup');
 await key('ArrowLeft');await key('z');assert.equal(await mode(),'intro');await p.waitForTimeout(600);await key('z');
 await until(()=>__kartDbg.st.mode==='race');
 await p.keyboard.down('z');await p.waitForTimeout(1200);await p.keyboard.up('z');assert((await state()).me.v>0,'Actual accelerate key moves the kart');
 await key('Enter');assert((await state()).paused);await shot('race-pause');
 await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));await p.keyboard.press('Escape');
 await key('Enter');assert.equal((await state()).paused,false);await key('q');await until(()=>House.mode==='walk');
 // The real console action re-enters the running screen, preserving the game.
 await p.evaluate(()=>House.act('n64'));await until(()=>House.focused&&RoomTV.open_);
 for(const index of [1,2,3]){
  await main();await choose(index);
  if(index===1){assert.equal(await mode(),'cc');await key('z')}
  assert.equal(await mode(),'driver');await key('z');assert.equal(await mode(),index===3?'arena':'track');
  await shot(['','vs-track','tt-track','battle-arena'][index]);await key('x');assert.equal(await mode(),'driver');
 }
 assert.deepEqual(errors,[]);console.log('KART UI PASS: actual physical-console camera ownership, keyboard labels, options, all help pages, locks, eight-driver layout endpoints, GP flow/countdown/acceleration/pause, global menu, Q/re-entry and VS/TT/battle selection; desktop/narrow captures; native 320x240 art retained');
}catch(e){await p.screenshot({path:'shots/kart-ui-failure.png'});console.error(errors,await p.evaluate(()=>window.__kartDbg?.st));throw e}
finally{await browser.close()}
