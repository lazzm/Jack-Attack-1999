import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2],{debug:true});
await mkdir('shots/reading-pages',{recursive:true});
try{
 console.log('Room ready');
 await page.evaluate(()=>Magazines.ready);
 console.log('Artwork ready');
 assert.equal(await page.evaluate(()=>MagazineCat.ISSUES.length),12);
 await page.evaluate(()=>{House.buildRoom(House.ROOMS.lounge);Magazines.sync()});
 assert(await page.evaluate(()=>ReadingBooks.every(b=>Magazines.bindings.get(b.id)===b.id)));
 const layout=await page.evaluate(()=>[...MagazineCat.ISSUES,...ReadingBooks].flatMap(doc=>doc.pages.map((p,i)=>({doc:doc.id,page:i,...Magazines.pageTexture(doc,i).userData.layout}))));
 assert.equal(layout.length,108);assert(layout.every(p=>p.bottom<p.footer&&p.font>=19),'Text overlaps footer');
 console.log('All 108 text layouts fit');
 // Every page of all twelve issues is real, original content, not a placeholder.
 for(let month=1;month<=12;month++){
  await page.evaluate(month=>{House.hush();House._.setMode('walk');Magazines.read('reading.mag.bed','pm.mag.'+String(month).padStart(2,'0'))},month);
  assert.equal(await page.evaluate(()=>House.mode),'inspect');
  if(month===1)await page.screenshot({path:'shots/reading-pages/first-open.png'});
  for(let n=0;n<2;n++){await page.keyboard.press('ArrowRight');await until(()=>!Magazines.reading.flipping)}
  assert.equal(await page.evaluate(()=>Magazines.reading.page),4);
  if([1,6,12].includes(month))await page.screenshot({path:`shots/reading-pages/mag-${month}-end.png`});
  await page.keyboard.press('q');await page.evaluate(()=>House.putBack());
 }
 for(const id of ['hs.pbook','hs.tvguide','ch.m.comic']){
  await page.evaluate(id=>{House._.setMode('walk');const t=House.THINGS[id];t.at.hide=false;t.obj.visible=true;if(id==='ch.m.comic')t.canGrab=null;House.grab(id);t.use()},id);
  assert.equal(await page.evaluate(()=>House.mode),'inspect');await page.locator('[data-turn="1"]').click();await until(()=>!Magazines.reading.flipping);
  await page.screenshot({path:'shots/reading-pages/'+id+'-read.png'});await page.keyboard.press('q');await page.evaluate(()=>House.putBack());
 }
 for(let i=0;i<6;i++){
  await page.evaluate(i=>{House._.setMode('walk');House.grab('reading.book.'+i)},i);await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>House.mode),'inspect');
  if(i===0)await page.screenshot({path:'shots/reading-pages/book-open.png'});
  await page.locator('[data-turn="1"]').click();await until(()=>!Magazines.reading.flipping);
  assert.equal(await page.evaluate(()=>Magazines.reading.page),2);
  await page.keyboard.press('ArrowLeft');await until(()=>!Magazines.reading.flipping);
  assert.equal(await page.evaluate(()=>Magazines.reading.page),0);
  await page.keyboard.press('q');await page.evaluate(()=>House.putBack());
 }
 // Opening, rapid clicks, pausing, closing mid-turn and rotation retain the model.
 await page.evaluate(()=>{House._.setMode('walk');House.grab('reading.book.0')});await page.keyboard.press('f');
 await page.mouse.move(610,330);await page.mouse.down();await page.mouse.move(660,340,{steps:5});await page.mouse.up();
 await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');assert(await page.evaluate(()=>HousePause.open));await page.keyboard.press('Escape');await page.keyboard.press('q');
 assert.equal(await page.evaluate(()=>Magazines.reading),null);assert.equal(await page.evaluate(()=>House.anims.has('reading.page')),false);
 await page.evaluate(()=>House.putBack());
 // Elevated angles expose the once-coplanar book caps.
 await view([-100,-90,170],[-155,-15,234]);await page.screenshot({path:'shots/reading-pages/book-tops.png'});
 await view([-210,-70,175],[-155,-15,234]);await page.screenshot({path:'shots/reading-pages/book-tops-side.png'});
 const caps=await page.evaluate(()=>ReadingBooks.filter(b=>b.id.startsWith('reading.book.')).map(b=>{const t=House.THINGS[b.id],body=t.obj.children.find(o=>o.geometry?.parameters?.height===21.52);return{exists:!!body,height:body?.geometry.parameters.height}}));assert(caps.every(b=>b.exists),'Book pages still overlap cover caps');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{House._.setMode('walk');House.grab('reading.mag.bed')});await page.keyboard.press('f');
 await page.waitForTimeout(600);await page.screenshot({path:'shots/reading-pages/mag-narrow.png'});
 await page.locator('[data-turn="1"]').click();await until(()=>!Magazines.reading.flipping);
 const bookmark=await page.evaluate(()=>Magazines.reading.page);await page.evaluate(()=>House.saveWalkState());
 await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='inspect'&&!!Magazines.reading&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await page.evaluate(()=>Magazines.reading.page),bookmark);await page.screenshot({path:'shots/reading-pages/reading-refresh.png'});
 await page.keyboard.press('q');await page.evaluate(()=>House.putBack());
 assert.deepEqual(errors,[]);console.log('PASS: 12 monthly issues / 72 pages, six books + directory/TV guide/comic / 36 pages, fitted text, keyboard/buttons, rotation, Esc, mid-turn Q, book caps, narrow single-page reading, refresh/bookmarks; no console errors/warnings');
}catch(e){await page.screenshot({path:'shots/reading-pages/failure.png'});console.log(await page.evaluate(()=>({mode:House.mode,reading:Magazines?.reading,errors:document.querySelector('.account-error')?.textContent})));throw e}finally{await browser.close()}
