import assert from 'node:assert/strict';
import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18461');
async function aim(eye,target){await view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})}
const box='media.box.n64.kart',cart='media.n64.kart';
try{
 const home=await p.evaluate(id=>House.THINGS[id].at,box);
 await aim([-220,-55,35],[home.x,home.y-6,-36]);await p.keyboard.press('f');assert.equal(await p.evaluate(()=>House.held()),null,'F grabbed rather than used a case');await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),box);await p.keyboard.press('f');assert.equal(await p.evaluate(()=>House.held()),box,'A held case opened without placing it');
 await aim([-130,-55,220],[-130,73,145]);await p.keyboard.press('e');await until(()=>House.THINGS['media.box.n64.kart'].st==='rest');
 await aim([-130,-55,220],[-130,67,146.6]);await p.keyboard.press('f');await until(()=>House.THINGS['media.box.n64.kart'].caseOpen);await until(()=>!House.THINGS['media.n64.kart'].at.hide);
 await view([-130,35,195],[-130,67,145]);await p.screenshot({path:'shots/controls-open-case.png'});await p.setViewportSize({width:390,height:844});await view([-85,40,165],[-130,67,145]);await p.screenshot({path:'shots/controls-open-case-narrow.png'});await p.setViewportSize({width:1366,height:860});
 await p.evaluate(()=>House.saveThings(true));await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&House.THINGS?.['media.n64.kart']&&!document.querySelector('.hs-loading,#houseEntry'));await until(()=>House.THINGS['media.box.n64.kart'].caseOpen&&!House.THINGS['media.n64.kart'].at.hide);
 await aim([-130,-55,220],[-130,69,146.3]);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),cart);await p.keyboard.press('f');assert.equal(await p.evaluate(()=>House.held()),cart,'F placed the cartridge');
 await aim([-80,-55,220],[-80,73,155]);await p.keyboard.press('e');await until(()=>House.THINGS['media.n64.kart'].st==='rest');
 await aim([-130,-55,220],[-130,67,146.6]);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),box);
 const slot=await p.evaluate(()=>House.SNAPS['media.slot.19'].pose);await aim([-220,-55,35],[slot.x,slot.y-6,-36]);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),box,'An empty case went onto the shelf');await p.evaluate(()=>House.putBack());await until(()=>House.THINGS['media.box.n64.kart'].st==='rest');
 await aim([-80,-55,220],[-80,69,156.3]);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),cart);await aim([-130,-55,220],[-130,67,146.6]);await p.waitForTimeout(250);await p.keyboard.press('e');await until(()=>House.THINGS['media.n64.kart'].snap==='media.case.n64.kart');assert(await p.evaluate(()=>House.THINGS['media.n64.kart'].at.hide));
 await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),box);await aim([-220,-55,35],[slot.x,slot.y-6,-36]);await p.keyboard.press('e');await until(()=>House.THINGS['media.box.n64.kart'].snap==='media.slot.19');
 assert.deepEqual(errors,[]);console.log('F / E MEDIA PASS: use vs carry, floor-first opening, visible removable cartridge, open-case refresh, empty-case shelf rejection, E return and filled-case shelf placement');
}finally{await browser.close()}
