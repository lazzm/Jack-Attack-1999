import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2],{touch:true});
await mkdir('shots/shelf-print-polish',{recursive:true});
try{
 await page.evaluate(()=>House.grab('pm.catalogue'));
 const sn=await page.evaluate(()=>House.SNAPS['reading.slot.2']);
 await view([-155,-55,165],[sn.x,sn.y-15,234]);await page.evaluate(()=>House._.setMode('walk'));await page.waitForTimeout(350);await page.keyboard.press('e');
 await until(()=>House.THINGS['pm.catalogue'].snap==='reading.slot.2');
 assert.equal(await page.evaluate(()=>House.THINGS['pm.catalogue'].at.ry),90);
 for(const [name,eye]of [['catalogue-front',[-100,-85,168]],['catalogue-side',[-210,-60,170]]]){await view(eye,[sn.x,sn.y-14,234]);await page.screenshot({path:'shots/shelf-print-polish/'+name+'.png'})}
 await page.evaluate(()=>{House._.setMode('walk');House.grab('reading.book.0')});await page.keyboard.press('f');
 assert(await page.evaluate(()=>{let ok=true;House.THINGS['reading.book.0'].obj.traverse(o=>{if(o.isMesh&&o.layers.mask!==2)ok=false});return ok}),'Pages escaped the held-object render layer');
 await page.locator('[data-turn="1"]').focus();await page.keyboard.press('Enter');await until(()=>!Magazines.reading.flipping);assert.equal(await page.evaluate(()=>Magazines.reading.page),2);
 await page.locator('[data-turn="-1"]').focus();await page.keyboard.press('Space');await until(()=>!Magazines.reading.flipping);assert.equal(await page.evaluate(()=>Magazines.reading.page),0);
 await page.keyboard.press('Control+ArrowRight');assert.equal(await page.evaluate(()=>Magazines.reading.page),0);
 await page.setViewportSize({width:390,height:844});await page.keyboard.press('q');await page.keyboard.press('f');await page.waitForTimeout(500);
 await page.locator('[data-turn="1"]').tap();await until(()=>!Magazines.reading.flipping);assert.equal(await page.evaluate(()=>Magazines.reading.page),1);
 await page.screenshot({path:'shots/shelf-print-polish/narrow-book.png'});await page.keyboard.press('q');
 assert(await page.evaluate(()=>{let ok=true;House.THINGS['reading.book.0'].obj.traverse(o=>{if(o.isMesh&&o.layers.mask!==2)ok=false});return ok}),'Closed cover escaped the held-object render layer');await page.evaluate(()=>House.putBack());
 const monthly=await page.evaluate(()=>Object.keys(House.THINGS).find(id=>/^pmb\.pm\.mag\./.test(id)));
 assert(monthly,'Owned monthly magazine is missing');
 await page.evaluate(id=>House.grab(id),monthly);await page.keyboard.press('f');await page.locator('.magazine-page-controls button').filter({hasText:'Take cover CD'}).tap();
 await until(()=>/^pmd\.pm\.mag\./.test(House.held()||''));
 await page.evaluate(()=>House.putBack());await page.waitForTimeout(400);
 await page.evaluate(()=>{House._.setMode('walk');House.saveWalkState()});await page.reload({waitUntil:'domcontentloaded'});
 await until(()=>AccountGate.allowed&&House.live&&PMGL.built&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await page.evaluate(()=>House.THINGS['pm.catalogue'].at.ry),90);assert.equal(await page.evaluate(()=>House.THINGS['pm.catalogue'].snap),'reading.slot.2');
 await page.evaluate(()=>House.buildRoom(House.ROOMS.lounge));await page.setViewportSize({width:1366,height:860});
 await view([90,225,555],[164,325,610],{level:'G'});await page.screenshot({path:'shots/shelf-print-polish/phone-table.png'});
 await view([110,250,570],[164,332,610],{level:'G'});await page.evaluate(()=>{House._.setMode('walk');House.grab('hs.pbook')});await page.waitForTimeout(400);await page.keyboard.press('e');
 await until(()=>House.THINGS['hs.pbook'].st==='rest');assert.equal(await page.evaluate(()=>House.THINGS['hs.pbook'].at.y),332,'Directory fell through lower shelf');
 await view([-30,225,500],[-88,309,456],{level:'G'});await page.screenshot({path:'shots/shelf-print-polish/tv-guide.png'});
 assert.deepEqual(errors,[]);console.log('PASS: upright outward Pixel Post/refresh, keyboard Enter/Space and modifiers, touch page turn, held-layer pages/covers, owned magazine cover CD, physical phone book/guide and lower-shelf placement; no console errors/warnings');
}catch(e){await page.screenshot({path:'shots/shelf-print-polish/failure.png'});throw e}finally{await browser.close()}
