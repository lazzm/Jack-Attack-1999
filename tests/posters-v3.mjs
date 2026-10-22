import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18466');
const posters=[
 ['posterfilm',[-236,-96,40],[-236,-96,-56]],
 ['posterband',[-178,-64,40],[-178,-64,-56]],
 ['postershuttle',[-52,-82,40],[-52,-82,-56]],
 ['postergame',[-180,-70,20],[-280,-70,20]],
 ['posterrobot',[-10,-98,150],[-10,-98,250]]
];
const shot=name=>page.screenshot({path:'shots/posters-v3-'+name+'.png'});
async function walkAt(eye,target){await view([eye[0],-55,eye[2]],target);await page.evaluate(()=>House._.setMode('walk'));}
try {
 await page.evaluate(()=>HouseArt.postersReady);
 assert.equal(await page.evaluate(()=>Object.values(HouseArt.posterImages).filter(im=>im.naturalWidth>0).length),5);
 for(const [id,eye,target] of posters){
  await walkAt(eye,target);
  // A real central click picks the poster instead of opening a 2D alternative.
  await page.mouse.click(683,430);await until(()=>House.mode==='focus'&&House.focused);
  assert.equal(await page.locator('.rm-view:not(.bye),.rm-bits.on').count(),0);
  await shot(id+'-front');
  assert.equal(await page.evaluate(()=>HouseArt.t('posterFilm').image.width),384);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await shot(id+'-narrow');
  assert.equal(await page.evaluate(()=>House.mode),'focus');
  await page.setViewportSize({width:1366,height:860});await page.waitForTimeout(350);
  await page.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.focused);
  await view([eye[0]+(id==='postergame'?0:28),eye[1]+10,eye[2]+(id==='postergame'?28:0)],target);await shot(id+'-angle');
 }
 const [id,eye,target]=posters[1];await walkAt(eye,target);
 await page.mouse.click(683,430);await page.waitForTimeout(60);await page.keyboard.press('q');await until(()=>!House.focused&&House.mode==='walk');
 await walkAt(eye,target);await page.mouse.click(683,430);await page.keyboard.press('Escape');
 assert(await page.locator('.hs-pause').evaluate(el=>el.open));await page.keyboard.press('Escape');await until(()=>House.mode==='focus');
 await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));
 await page.evaluate(()=>HouseArt.postersReady);assert.equal(await page.evaluate(()=>Object.values(HouseArt.posterImages).filter(im=>im.naturalWidth>0).length),5);
 assert.equal(await page.locator('.rm-view:not(.bye)').count(),0);await shot('refresh');
 assert.deepEqual(errors,[]);console.log('POSTERS PASS: five decoded full designs; real wall clicks/zoom, front/angle/narrow views, resize, Q mid-glide, Esc and refresh; zero console errors/warnings');
}catch(e){await shot('failure');console.log(await page.evaluate(()=>({mode:House.mode,focus:House.focused,p:{...House.P},errors:document.querySelector('.hs-pause')?.open})));throw e}finally{await browser.close()}
