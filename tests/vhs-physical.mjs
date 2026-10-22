import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18460');
async function aimSlot(id,item){const s=await p.evaluate(id=>{const s=House.SNAPS[id];return{x:s.x,y:s.y,z:s.z}},id);await view([s.x,225,s.z+95],[s.x,s.y,s.z],{level:'G'});await p.evaluate(item=>{House.hush();House._.setMode('walk');House.grab(item)},item);await p.waitForTimeout(400);await p.keyboard.press('f');console.log('VHS place',id,item,await p.evaluate(()=>({held:House.held(),vcr:HouseTelly.st.vcr})));assert.equal(await p.evaluate(()=>House.held()),null,'F did not reach '+id)}
try{
 await p.evaluate(()=>House.goRoom('lounge',0));await until(()=>!!window.HouseTelly&&!!House.THINGS['ch.v.3']);
 assert(await p.evaluate(()=>House.SNAPS.vcr.accepts('chvhs')));
 await aimSlot('vcr','ch.v.3');await until(()=>HouseTelly.st.vcr==='ch.v.3');
 assert(await p.evaluate(()=>HouseTelly.st.on&&HouseTelly.st.speed===1&&HouseTelly.st.ch===0));
 await p.evaluate(()=>HouseTelly.open('vcr'));await until(()=>House.mode==='focus');await p.keyboard.press('0');assert(await p.evaluate(()=>House.surfaceScreen()?.locked));await p.screenshot({path:'shots/lock-in-family-tv.png'});await p.keyboard.press('0');assert.equal(await p.evaluate(()=>House.surfaceScreen()?.locked),false);await p.evaluate(()=>House.unfocus());await until(()=>House.mode==='walk');
 await p.waitForTimeout(1300);const time=await p.evaluate(()=>JSON.parse(localStorage.getItem('jhp_hs_telly')).tapes['ch.v.3']||0);
 await view([-60,240,405],[-64,274,320],{level:'G'});await p.screenshot({path:'shots/vhs-galaxy-walk-playing.png'});
 await p.evaluate(()=>House.goRoom('kitchen',0));await p.waitForTimeout(2500);assert(await p.evaluate(time=>(JSON.parse(localStorage.getItem('jhp_hs_telly')).tapes['ch.v.3']||0)>time,time),'Hidden-room VHS did not keep playing');
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await p.evaluate(()=>Room.ensureHouse());await until(()=>HouseRooms.ready);await p.evaluate(()=>House.goRoom('lounge',0));await until(()=>!!window.HouseTelly&&!!House.THINGS['ch.v.3']);
 assert.equal(await p.evaluate(()=>HouseTelly.st.vcr),'ch.v.3');assert(await p.evaluate(()=>House.THINGS['ch.v.3'].at.hide));
 await p.evaluate(()=>HouseTelly.press('eject'));await until(()=>House.THINGS['ch.v.3'].st==='rest');assert.equal(await p.evaluate(()=>!!House.THINGS['ch.v.3'].at.hide),false);
 for(const id of ['ch.v.3','ch.v.0']){await aimSlot('ch.s.tower',id);for(let i=0;i<50;i++){if(await p.evaluate(id=>House.THINGS[id].st==='snap',id))break;await p.waitForTimeout(100)}assert.equal(await p.evaluate(id=>House.THINGS[id].st,id),'snap');assert(await p.evaluate(id=>!House.THINGS[id].canGrab||House.THINGS[id].canGrab(),id),'Tidied tape cannot be played again')}
 assert.notEqual(await p.evaluate(()=>House.THINGS['ch.v.0'].at.y),await p.evaluate(()=>House.THINGS['ch.v.3'].at.y),'Returned tapes overlap');
 await view([65,235,410],[14,310,322],{level:'G'});await p.screenshot({path:'shots/vhs-returned-slots.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/vhs-returned-slots-narrow.png'});
 await p.evaluate(()=>{House.grab('ch.v.3');House.inspect('ch.v.3')});await p.screenshot({path:'shots/vhs-galaxy-walk-label-narrow.png'});await p.setViewportSize({width:1366,height:860});await p.screenshot({path:'shots/vhs-galaxy-walk-label.png'});
 assert.deepEqual(errors,[]);console.log('PHYSICAL VHS PASS: F insertion, autoplay, hidden-room continuation, refresh, eject, independent return slots and reusable tidy tapes');
}finally{await browser.close()}
