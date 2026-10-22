import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18460';
const{browser,page:p,errors,until,view}=await roomFixture(base);
async function walkView(eye,target){await view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')});}
try{
 await until(()=>!!window.ChoreKit&&!!House.THINGS['ch.pillow']);
 console.log('PROPS ready');
 assert(await p.evaluate(()=>['beanbag','chair','schoolbag','books','mug','pencilpot','hifi'].every(id=>House.THINGS[id])));
 await walkView([-100,-55,135],[-100,52,56]);
 await p.keyboard.down('f');await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>House.held()),'beanbag','F did not pick up beanbag');await p.keyboard.up('f');
 console.log('PROPS F grab passed');
 await walkView([-10,-55,160],[-10,73,60]);await p.keyboard.press('f');assert.equal(await p.evaluate(()=>House.held()),'beanbag','Unsafe PC placement was allowed');
 await walkView([-100,-55,215],[-100,73,145]);await p.waitForTimeout(350);await p.keyboard.press('f');
 console.log('PROPS drop',await p.evaluate(()=>({held:House.held(),state:House.THINGS.beanbag.st,toast:document.querySelector('.hs-toast')?.textContent})));
 assert.equal(await p.evaluate(()=>House.held()),null,'Clear-floor drop was rejected');
 await until(()=>House.THINGS.beanbag.st==='rest');
 const placed=await p.evaluate(()=>{const t=House.THINGS.beanbag;return{at:t.at,blocked:!House._.floorAt(t.at.x,t.at.z,'U',73),oldFree:!!House._.floorAt(-100,56,'U',73)}});
 assert(placed.blocked,'Moved beanbag has no walking collision');assert(placed.oldFree,'Ghost collision at old beanbag position');assert.equal(placed.at.y,73);
 await view([-150,-10,210],[placed.at.x,55,placed.at.z]);await p.screenshot({path:'shots/props-beanbag-moved.png'});
 await p.evaluate(()=>{House.hush();House._.setMode('walk');House.grab('mug')});await p.keyboard.press('i');await until(()=>House.mode==='inspect');await p.screenshot({path:'shots/props-mug-inspect.png'});await p.keyboard.press('Escape');await p.locator('.hs-pause [data-pause=leave]').click();await p.keyboard.press('Escape');await p.locator('.hs-pause [data-pause=return]').click();await until(()=>House.THINGS.mug.st==='rest');
 // One pillow, physically returned through the normal snap animation.
 await walkView([112,-55,80],[190,33,-33]);await p.evaluate(()=>{House.grab('ch.pillow');House.hush()});
 // The snap's generous bed target is intentionally reached by aiming at it.
 await p.keyboard.press('f');await until(()=>ChoreKit.has('bed','pillow'));
 assert.equal(await p.evaluate(()=>House.THINGS['ch.pillow'].at.y),37,'Pillow floats over mattress');
 await view([110,-25,150],[190,35,-20]);await p.screenshot({path:'shots/props-only-pillow-tidied.png'});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/props-only-pillow-tidied-narrow.png'});await p.setViewportSize({width:1366,height:860});
 await p.evaluate(()=>{House.hush();House._.setMode('walk');House.saveThings()});await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&House.THINGS?.beanbag&&!document.querySelector('.hs-loading,#houseEntry'));
 const refreshed=await p.evaluate(()=>House.THINGS.beanbag.at);for(const key of ['room','x','y','z','ry'])assert.equal(refreshed[key],placed.at[key],'Refresh changed beanbag '+key);await until(()=>!!House.THINGS['ch.pillow']);assert.equal(await p.evaluate(()=>House.THINGS['ch.pillow'].at.y),37);
 assert.deepEqual(errors,[]);console.log('PROPS / F CONTROLS PASS: repeat guard, safe furniture placement, dynamic collision, inspection, single pillow and refresh');
}finally{await browser.close()}
