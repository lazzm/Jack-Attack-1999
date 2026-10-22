import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2]);
await mkdir('shots/magazine-covers',{recursive:true});
try{
 await page.evaluate(()=>HouseArt.postersReady);
 const audit=await page.evaluate(()=>['mags','reading.mag.floor1','reading.mag.floor2','reading.mag.bed','reading.mag.back1','reading.mag.back2'].map(id=>{
  const t=House.THINGS[id];let faces; t.obj.traverse(m=>{if(m.isMesh&&Array.isArray(m.material)&&m.material[3]?.map)faces=m.material});
  return{id,label:t.label,width:faces[3].map.image.width,height:faces[3].map.image.height,same:faces[3].map===faces[2].map,texture:faces[3].map.uuid};
 }));
 assert.equal(new Set(audit.map(a=>a.texture)).size,6);assert(audit.every(a=>a.same&&a.width===384&&a.height===512));
 await view([-115,-20,175],[-155,-15,234]);await page.screenshot({path:'shots/magazine-covers/shelf-front.png'});
 await view([-210,-25,165],[-155,-5,234]);await page.screenshot({path:'shots/magazine-covers/shelf-side.png'});
 await page.evaluate(()=>{House._.setMode('walk');House.grab('reading.mag.bed');House.inspect('reading.mag.bed')});
 await page.waitForTimeout(500);await page.screenshot({path:'shots/magazine-covers/cover-held.png'});
 await page.keyboard.press('q');await until(()=>House.mode==='walk');
 const sn=await page.evaluate(()=>House.SNAPS['reading.slot.2']);
 await view([-155,-55,165],[sn.x,sn.y-15,234]);await page.evaluate(()=>House._.setMode('walk'));await page.waitForTimeout(300);await page.keyboard.press('e');
 await until(()=>House.THINGS['reading.mag.bed'].snap==='reading.slot.2');
 await view([-115,-20,175],[-155,-15,234]);await page.screenshot({path:'shots/magazine-covers/cover-shelved.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'shots/magazine-covers/shelf-narrow.png'});
 await page.evaluate(()=>{House._.setMode('walk');House.saveWalkState()});await page.reload({waitUntil:'domcontentloaded'});
 await until(()=>AccountGate.allowed&&House.live&&House.THINGS['reading.mag.bed']&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await page.evaluate(()=>House.THINGS['reading.mag.bed'].snap),'reading.slot.2');
 assert.deepEqual(errors,[]);console.log('PASS: six unique full-size covers, same artwork on both faces, held/shelf/narrow/refresh, no console errors/warnings');
}finally{await browser.close()}
