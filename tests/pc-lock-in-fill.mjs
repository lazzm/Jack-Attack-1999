import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
try{
 await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor'&&!House.gliding);
 await p.evaluate(async()=>{window.fillWin=await Apps.open('notepad');fillWin.el.querySelector('textarea').value='Same desktop. Same program.';fillWin.el.querySelector('[data-w=max]').click()});
 for(const [width,height]of [[1366,860],[1920,1080],[2560,1080]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(150);await p.evaluate(()=>{House.desktopDisplay(false);document.activeElement?.blur()});
  assert.deepEqual(await p.evaluate(()=>[DesktopSurface.width(),DesktopSurface.height()]),[1024,768]);
  await p.keyboard.press('t');assert(await p.evaluate(()=>House.desktopDisplay()));
  const sizes=await p.evaluate(()=>{const r=DesktopSurface.root().getBoundingClientRect(),w=fillWin.el.getBoundingClientRect();return{surface:[r.x,r.y,r.width,r.height],win:[w.x,w.y,w.width,w.height],text:fillWin.el.querySelector('textarea').value}});
  assert.deepEqual(sizes.surface,[0,0,width,height]);assert.equal(sizes.win[2],width);assert.equal(sizes.win[3],height-32);assert.equal(sizes.text,'Same desktop. Same program.');
  await p.screenshot({path:`shots/props-town/jackos-fill-${width}.png`});
  await p.locator('.appwin textarea').focus();await p.keyboard.type('t');assert(await p.evaluate(()=>House.desktopDisplay()),'Typing T left LOCK IN');await p.evaluate(()=>{fillWin.el.querySelector('textarea').value='Same desktop. Same program.';document.activeElement.blur()});
  await p.keyboard.press('t');assert(!await p.evaluate(()=>House.desktopDisplay()));assert.equal(await p.locator('.appwin').count(),1);
 }
 await p.keyboard.press('q');await until(()=>House.mode==='walk');assert.deepEqual(errors,[]);
 console.log('JACKOS LOCK IN PASS: 1024x768 in-world; viewport-filling 1366/1920/2560 desktop and maximised app, same instance/text, typing guard and return');
}catch(e){await p.screenshot({path:'shots/props-town/fullscreen-failure.png'});throw e}finally{await f.browser.close()}
