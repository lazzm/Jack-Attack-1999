/* Main runs sequentially against clean disposable localhost data.
 * node graphics-menu-ui.mjs http://localhost:18080
 * This uses the real renderer API, touch navigation, native controls and keyboard.
 */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
await mkdir('shots',{recursive:true});
const {browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18080',{width:1366,height:860});
const menu=p.locator('.hs-pause'),page=p.locator('.hs-graphics-menu');
const option=name=>page.locator(`[name=gfx${name}]`);
const get=()=>p.evaluate(()=>House.graphicsGet());
const snapshot=()=>p.evaluate(()=>({music:Sound.musicOn,effects:Sound.effectsOn,volume:Sound.volume,pad:window.PCTouch?.enabled,crouch:House.crouchSetting(),mode:House.mode}));
async function open() {
  if(!await menu.evaluate(el=>el.open)){await p.keyboard.press('Escape');await until(()=>HousePause.open);}
  await p.locator('[data-pause=graphics]').click();
  assert.equal(await p.evaluate(()=>HousePause.page),'graphics');assert(await p.evaluate(()=>House.paused));
  assert.equal(await p.locator('.hs-pause-main').isVisible(),false);
  for(const selector of ['[name=music]','[name=pcTrackpad]','[name=crouchToggle]','[data-pause=logout]'])assert.equal(await p.locator(selector).isVisible(),false,selector+' leaked into submenu');
}
async function bounds(tag) {
  const data=await p.evaluate(()=>{
    const dialog=document.querySelector('.hs-pause'),page=dialog.querySelector('.hs-graphics-menu'),scroll=page.querySelector('.hs-graphics-scroll');
    const r=dialog.getBoundingClientRect(),footer=page.querySelector('.hs-graphics-footer').getBoundingClientRect();
    const controls=[...page.querySelectorAll('button,select,input[type=range],.hs-graphics-check')].map(el=>({name:el.name||el.dataset.gfx||el.textContent.trim(),h:el.getBoundingClientRect().height}));
    return {dialog:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},footer:{y:footer.y,bottom:footer.bottom},controls,overflow:scroll.scrollWidth-scroll.clientWidth,w:innerWidth,h:innerHeight,focused:page.contains(document.activeElement)};
  });
  assert(data.dialog.x>=0&&data.dialog.y>=0&&data.dialog.right<=data.w+1&&data.dialog.bottom<=data.h+1,tag+': dialog outside viewport '+JSON.stringify(data));
  assert(data.footer.y>0&&data.footer.bottom<=data.h,tag+': Back / Resume not visible');
  assert(data.overflow<=1,tag+': horizontal scrolling');
  assert(data.controls.every(c=>c.h>=44),tag+': controls below 44px '+JSON.stringify(data.controls));
  await p.screenshot({path:`shots/graphics-menu-${tag}.png`});
  await page.locator('.hs-graphics-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
  await p.screenshot({path:`shots/graphics-menu-${tag}-bottom.png`});
  await page.locator('.hs-graphics-scroll').evaluate(el=>el.scrollTop=0);
}
try {
  assert(await p.evaluate(()=>typeof House.graphicsGet==='function'&&typeof House.graphicsSet==='function'),'Main renderer API missing');
  assert(await p.evaluate(()=>!!window.HouseGraphicsMenu),'Load hs-graphics-menu.js before hs-pause.js');
  const before=await snapshot();await open();
  assert.deepEqual(await option('Preset').locator('option').allTextContents(),['Automatic','Performance','Balanced','Quality','Custom']);
  await bounds('portrait');
  const presets={};
  for(const preset of ['auto','potato','low','medium','high']) {
    await option('Preset').selectOption(preset);const state=await get();presets[preset]=state;
    assert.equal(state.preset,preset);assert.equal(await option('Preset').inputValue(),preset);
    assert.equal(state.dynamic,preset!=='high','Preset dynamic default');
    assert.equal(await option('Scale').inputValue(),String(state.scale));
    assert.equal(await option('Antialias').inputValue(),state.antialias);
    assert.equal(await option('Decorations').isChecked(),state.decorations);
  }
  await option('Preset').selectOption('medium');
  await option('Scale').focus();await p.keyboard.press('Home');assert.equal((await get()).scale,.5);assert.equal((await get()).preset,'custom');
  assert.equal(await page.locator('output').innerText(),'50%');await p.keyboard.press('End');assert.equal((await get()).scale,1);
  // A trusted touch on the resolution slider, rather than a script-only event.
  await option('Scale').scrollIntoViewIfNeeded();const slider=await option('Scale').boundingBox();
  await p.mouse.click(slider.x+slider.width*.35,slider.y+slider.height/2);
  assert((await get()).scale<1&&(await get()).scale>=.5,'Touch did not change the native slider');
  const dynamic=page.locator('.hs-graphics-check:has([name=gfxDynamic])');
  if(await option('Dynamic').isChecked())await dynamic.click();assert.equal((await get()).dynamic,false);
  for(const aa of ['off','on','auto']) {
    await option('Antialias').selectOption(aa);const state=await get();assert.equal(state.antialias,aa);
    assert.equal(await page.locator('.hs-graphics-aa-actual').innerText(),'Active: '+(state.actualAntialias?'On':'Off')+'.','Requested AA presented as actual AA');
  }
  for(const [name,key,value] of [['PixelRatio','pixelRatio','1.5'],['Anisotropy','anisotropy','16'],['BackgroundFps','backgroundFps','20']]) {
    await option(name).selectOption(value);assert.equal((await get())[key],Number(value));
  }
  await page.locator('.hs-graphics-check:has([name=gfxDecorations])').click();assert.equal((await get()).decorations,true);
  assert.equal(await option('Preset').inputValue(),'custom');
  assert.match(await page.innerText(),/Background screen refresh/);assert.match(await page.innerText(),/Messages and audio keep running/);
  assert.equal(await page.locator('select').count(),5,'Unexpected or unimplemented graphics controls');
  // Selecting a real preset must replace prior custom tuning with its own defaults.
  await option('Preset').selectOption('low');const reset=await get();
  for(const key of ['preset','scale','dynamic','antialias','pixelRatio','anisotropy','backgroundFps','decorations','retro','showFps'])assert.equal(reset[key],presets.low[key],'Preset failed to reset '+key);
  // Back restores unrelated settings and focus without resuming the house.
  await page.locator('[data-gfx=back]').click();assert.equal(await p.evaluate(()=>HousePause.page),'main');assert(await p.evaluate(()=>House.paused));
  assert(await p.locator('[name=music]').isVisible());assert(await p.locator('[data-pause=logout]').isVisible());
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.pause),'graphics');assert.deepEqual(await snapshot(),before);
  await p.locator('[data-pause=graphics]').click();await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>HousePause.page),'main');
  await p.keyboard.press('Escape');assert.equal(await menu.evaluate(el=>el.open),false);assert.equal(await p.evaluate(()=>House.paused),false);
  for(let i=0;i<3;i++){await open();await page.locator('[data-gfx=back]').click()}
  await p.locator('[data-pause=graphics]').click();
  // Resize while inside the page: same page, state and reachable footer.
  for(const [width,height,tag] of [[1920,1080,'desktop-full'],[2560,1080,'ultrawide'],[1366,860,'desktop-return']]) {
    await p.setViewportSize({width,height});assert.equal(await p.evaluate(()=>HousePause.page),'graphics');await bounds(tag);
  }
  // Native dialog cancel must also return one level before closing.
  await menu.evaluate(el=>el.dispatchEvent(new Event('cancel',{cancelable:true})));
  assert.equal(await p.evaluate(()=>HousePause.page),'main');assert(await menu.evaluate(el=>el.open));
  await p.locator('[data-pause=graphics]').click();
  for(let i=0;i<15;i++){await p.keyboard.press('Tab');assert(await menu.evaluate(el=>el.contains(document.activeElement)),'Focus escaped the modal')}
  await page.locator('[data-gfx=resume]').click();assert.equal(await menu.evaluate(el=>el.open),false);assert.equal(await p.evaluate(()=>House.paused),false);
  assert.equal(await menu.evaluate(el=>el.contains(document.activeElement)),false);assert.deepEqual(await snapshot(),before);
  // Saved custom choices survive refresh without changing standing / seated state.
  await open();await option('Anisotropy').selectOption('16');const saved=await get();await page.locator('[data-gfx=resume]').click();
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.live&&window.AccountGate?.allowed&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.mode),before.mode);await open();const restored=await get();
  for(const key of ['preset','scale','dynamic','antialias','pixelRatio','anisotropy','backgroundFps','decorations','retro','showFps'])assert.equal(restored[key],saved[key],'Refresh lost '+key);
  await page.locator('[data-gfx=resume]').click();
  assert.deepEqual(errors,[]);
  console.log('GRAPHICS MENU UI PASS: real presets/custom API, all controls and actual AA; mouse/keyboard, Back/Resume/Esc/native cancel, focus, saved settings, 44px desktop/ultrawide controls and screenshots.');
} catch(e) {await p.screenshot({path:'shots/graphics-menu-failure.png'}).catch(()=>{});throw e} finally {await browser.close()}
