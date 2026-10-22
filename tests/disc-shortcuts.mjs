import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18466');
try {
 await page.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');
 for(const id of ['city','park','boss','keepa']){
  await page.evaluate(async id=>{
   await Apps.load('js/discs-'+id+'.js');const original=Discs.MODS[id];
   Discs.MODS[id]=(G,arg)=>{const menu=G.menu;G.menu=items=>{window.shortcutMenus=items;return menu(items)};return original(G,arg)};
   window.shortcutWindow=Discs.launch(id);
  },id);
  await until(()=>!!window.Discs?.LIVE[window.shortcutWindow?.el.querySelector('.dg-host')?.className.match(/dg-(city|park|boss|keepa)\b/)?.[1]]);
  await page.evaluate(()=>{const help=shortcutMenus.find(([label])=>/Help/.test(label));const items=typeof help[1]==='function'?help[1]():help[1];items.find(item=>/Keyboard Keys|^Keys/.test(item.label))?.act()});
  const text=await page.locator('#monitorSurface').innerText();
  const expected={city:'Query tool',park:'J: queue lines',boss:'Squad',keepa:'Raiding: U / W / E'};
  assert(text.includes(expected[id]),id+' help missing');
  assert(!/Q: queue|T: shops|Raiding: Q|F1 R T M B/.test(text),'Stale house shortcut in help');
  await page.screenshot({path:'shots/disc-shortcuts-'+id+'.png'});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  await page.screenshot({path:'shots/disc-shortcuts-'+id+'-narrow.png'});
  await page.setViewportSize({width:1366,height:860});await page.evaluate(()=>shortcutWindow.close());
 }
 assert.deepEqual(errors,[]);console.log('DISC SHORTCUTS PASS: four real modules and key-help dialogs load, remapped help, desktop/narrow captures; zero browser errors/warnings');
}catch(e){await page.screenshot({path:'shots/disc-shortcuts-failure.png'});throw e}finally{await browser.close()}
