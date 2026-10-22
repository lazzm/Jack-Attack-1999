import assert from 'node:assert/strict';
import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18461');
async function aim(eye,target){await view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})}
try{
 const home=await p.evaluate(()=>House.THINGS['media.box.n64.kart'].at);
 await aim([-220,-55,35],[home.x,home.y-6,-36]);await p.keyboard.press('f');assert.equal(await p.evaluate(()=>House.held()),'media.box.n64.kart');await p.keyboard.press('f');await until(()=>House.held()==='media.n64.kart');
 const slot=await p.evaluate(()=>House.SNAPS['console.n64']);
 await aim([-185,-55,120],[slot.x,slot.y,slot.z]);assert(await p.evaluate(()=>!!House._.floorAt(House.W.x,House.W.z,'U',73)));await p.waitForTimeout(350);await p.keyboard.press('f');await until(()=>House.THINGS['media.n64.kart'].snap==='console.n64'&&RoomTV?._dbg()?.st==='game');
 await p.screenshot({path:'shots/console-case-physical-play.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/console-case-physical-play-narrow.png'});await p.setViewportSize({width:1366,height:860});
 await p.evaluate(()=>window.caseGame=RoomTV.dbg());await p.keyboard.press('Backspace');await until(()=>House.mode==='walk');assert(await p.evaluate(()=>RoomTV._dbg()?.background&&RoomTV.dbg()===caseGame));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&House.THINGS?.['media.n64.kart']&&!document.querySelector('.hs-loading,#houseEntry'));await until(()=>RoomTV?._dbg()?.background&&RoomTV._dbg().gid==='n64.kart');assert.equal(await p.evaluate(()=>House.THINGS['media.n64.kart'].snap),'console.n64');
 await p.evaluate(()=>Room._.ejectMedia('n64'));assert.equal(await p.evaluate(()=>House.held()),'media.n64.kart');await aim([-220,-55,35],[home.x,home.y-6,-36]);await p.waitForTimeout(300);await p.keyboard.press('f');await until(()=>House.THINGS['media.n64.kart'].snap==='media.case.n64.kart');assert(await p.evaluate(()=>House.THINGS['media.n64.kart'].at.hide));
 assert.deepEqual(errors,[]);console.log('BOX TO CONSOLE PASS: real F pickup/open/insert, live screen, Backspace continuation, inserted/background refresh, eject and own-box return');
}finally{await browser.close()}
