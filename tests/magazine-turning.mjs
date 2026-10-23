import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2],{touch:true});
await mkdir('shots/magazine-turning',{recursive:true});
const settled=()=>until(()=>Magazines.reading&&!Magazines.reading.flipping);
async function shot(name){await page.waitForTimeout(250);await page.screenshot({path:'shots/magazine-turning/'+name+'.png'})}
async function refresh(phase,p){await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.mode==='inspect'&&!!Magazines.reading&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await page.evaluate(()=>Magazines.reading.phase),phase);assert.equal(await page.evaluate(()=>Magazines.reading.page),p)}
try{
 for(const width of [1366,390]){
  await page.setViewportSize({width,height:width===390?844:860});
  await view([40,-55,155],[-15,-24,0]);await page.evaluate(()=>{House._.setMode('walk');House.grab('reading.mag.bed')});await page.keyboard.press('f');
  assert.equal(await page.evaluate(()=>Magazines.reading.phase),'front');assert.equal(await page.evaluate(()=>Magazines.reading.page),-1);
  await shot(width+'-front');await refresh('front',-1);
  const camera=await page.evaluate(()=>({...House.P}));
  await page.keyboard.press('f');await page.waitForTimeout(120);await page.screenshot({path:'shots/magazine-turning/'+width+'-opening.png'});await settled();assert.equal(await page.evaluate(()=>Magazines.reading.page),0);await shot(width+'-open');
  const count=width===390?1:2;
  for(let p=count;p<6;p+=count){await page.locator('[data-turn="1"]').tap();await settled();assert.equal(await page.evaluate(()=>Magazines.reading.page),p)}
  await shot(width+'-last-page');await refresh('pages',6-count);
  await page.keyboard.press('ArrowRight');await settled();assert.equal(await page.evaluate(()=>Magazines.reading.phase),'back');await shot(width+'-back');await refresh('back',6);
  assert(await page.locator('[data-turn="1"]').isDisabled());
  assert.deepEqual(await page.evaluate(()=>House.P),camera,'Turning or refresh moved the camera');
  await page.keyboard.press('ArrowLeft');await settled();assert.equal(await page.evaluate(()=>Magazines.reading.page),6-count);
  for(let p=6-count;p>=0;p-=count){await page.keyboard.press('ArrowLeft');await settled()}
  assert.equal(await page.evaluate(()=>Magazines.reading.phase),'front');assert(await page.locator('[data-turn="-1"]').isDisabled());
  await page.keyboard.press('f');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');assert(await page.evaluate(()=>HousePause.open));await page.keyboard.press('Escape');await page.keyboard.press('q');
  assert.equal(await page.evaluate(()=>Magazines.reading),null);assert.equal(await page.evaluate(()=>House.anims.has('reading.page')),false);
  await page.keyboard.press('f');assert.equal(await page.evaluate(()=>Magazines.reading.phase),'front','Fresh F skipped cover because of bookmark');
  if(width===1366){await page.keyboard.press('f');await settled();await page.setViewportSize({width:390,height:844});await settled();assert.equal(await page.evaluate(()=>Magazines.reading.phase),'pages');assert.equal(await page.evaluate(()=>Magazines.reading.page),0);await shot('resize-single-page');await page.setViewportSize({width:1366,height:860});await settled();assert.equal(await page.evaluate(()=>Magazines.reading.phase),'pages');await page.keyboard.press('ArrowLeft');await settled()}
  await page.mouse.move(width/2,330);await page.mouse.down();await page.mouse.move(width/2+80,350,{steps:5});await page.mouse.up();await shot(width+'-turned-in-hand');
  await page.keyboard.press('q');await page.evaluate(()=>House.putBack());
 }
 assert.deepEqual(errors,[]);console.log('PASS: closed front -> all interior pages -> closed back -> reverse, F/buttons/keyboard/touch, cover/page/back refresh, stable camera, rapid input/Esc/Q, rotated inspection, desktop/narrow; no console errors/warnings');
}catch(e){await shot('failure');console.log(await page.evaluate(()=>({mode:House.mode,reader:Magazines.reading})));throw e}finally{await browser.close()}
