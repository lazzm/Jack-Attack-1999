/* Run sequentially against a clean disposable server. Actual Chromium touch
 * input drives the pad: no synthetic clicks and no direct cursor mutation.
 *   node pc-trackpad-touch.mjs http://localhost:18080
 */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base = process.argv[2] || 'http://localhost:18080';
await mkdir('shots', {recursive:true});
const {browser,page:p,errors,until} = await roomFixture(base,{touch:true,width:390,height:844});
const cdp = await p.context().newCDPSession(p);
let live = new Map();
async function frame(type, points) {
  live = new Map(points.map(q=>[q.id,q]));
  await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(q=>({...q,radiusX:3,radiusY:3,force:1}))});
}
async function end(cancel=false) { await frame(cancel?'touchCancel':'touchEnd',[]); }
async function center(selector) {
  const r=await p.locator(selector).boundingBox();assert(r,'Missing '+selector);
  return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height};
}
async function touchClick(selector) {
  const q=await center(selector);await frame('touchStart',[{id:1,x:q.x,y:q.y}]);await end();
}
async function stroke(dx,dy,selector='.pc-touch-pad') {
  const q=await center(selector),sx=q.x-dx/2,sy=q.y-dy/2;
  await frame('touchStart',[{id:1,x:sx,y:sy}]);
  // A short positioning correction is still a stroke, not a click. Include
  // enough real travel to disambiguate it from a stationary pad press.
  if(selector==='.pc-touch-pad'&&Math.hypot(dx,dy)<8)await frame('touchMove',[{id:1,x:sx+10,y:sy}]);
  for(let i=1;i<=4;i++)await frame('touchMove',[{id:1,x:sx+dx*i/4,y:sy+dy*i/4}]);
  await end();
}
async function moveTo(x,y) {
  for(let i=0;i<45;i++) {
    const at=await p.evaluate(()=>PCTouch.state),q=await center('.pc-touch-pad');
    const dx=x-at.x,dy=y-at.y;if(Math.hypot(dx,dy)<2)return;
    const scale=Math.min(1,(q.width-20)*2.4/Math.max(1,Math.abs(dx)),(q.height-16)*2.4/Math.max(1,Math.abs(dy)));
    await stroke(dx*scale/2.4,dy*scale/2.4);
  }
  throw Error('Cursor did not reach '+x+','+y);
}
async function aim(selector,fx=.5,fy=.5) {
  const r=await p.locator(selector).evaluate(el=>DesktopSurface.rect(el));
  await moveTo(r.left+r.width*fx,r.top+r.height*fy);
}
async function zero() {
  assert.deepEqual(await p.evaluate(()=>{const s=PCTouch.state;return[s.buttons,s.dragging,s.captured,s.pointers]}),[0,false,false,0]);
}
async function screenshot(tag) {await p.screenshot({path:`shots/pc-trackpad-${tag}.png`});}
async function fit() {
  await p.waitForTimeout(250);
  const result=await p.evaluate(()=>{
    const a=DesktopSurface.client(0,0),b=DesktopSurface.client(1024,0),c=DesktopSurface.client(1024,768);
    const css=getComputedStyle(document.documentElement),bottom=parseFloat(css.getPropertyValue('--pc-touch-reserve-bottom'))||0,right=parseFloat(css.getPropertyValue('--pc-touch-reserve-right'))||0;
    return{ratio:Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(c.x-b.x,c.y-b.y),a,c,bottom,right,w:innerWidth,h:innerHeight};
  });
  assert(Math.abs(result.ratio-4/3)<.015,JSON.stringify(result));
  assert(result.a.x>=-2&&result.a.y>=-2,JSON.stringify(result));
  assert(result.c.x<=result.w-result.right+3&&result.c.y<=result.h-result.bottom+3,'Renderer must consume trackpad insets: '+JSON.stringify(result));
}
try {
  await p.evaluate(()=>{House.hush();House.sitDown()});await until(()=>House.mode==='monitor'&&PCTouch.state.visible);
  assert(await p.evaluate(()=>PCTouch.enabled));
  await fit();await screenshot('portrait-world');
  // Use the real Apps window manager: its capture-based title and resize
  // handlers must run, alongside controls whose defaults need browser support.
  await p.evaluate(()=>{
    const body=document.createElement('div');body.innerHTML='<button class="pct-action">Click counter</button><label><input class="pct-check" type="checkbox"> Check box</label><form><input class="pct-text" aria-label="Practice text"><input class="pct-next" aria-label="Next text"><button type="submit">Send</button></form><div class="pct-scroll" style="overflow:auto;height:100px"><div style="height:800px">Scroll this page</div></div>';
    window.pctEvents=[];window.pctCount=0;window.pctSubmit=0;
    window.pctWin=Apps.win('Trackpad practice',body,{w:600,h:420,x:100,y:100});pctWin.el.id='pctWindow';
    body.querySelector('.pct-action').addEventListener('click',()=>pctCount++);
    body.querySelector('.pct-action').addEventListener('contextmenu',ev=>{ev.preventDefault();IE.menu([{label:'Trackpad properties',act:()=>pctCount+=10}],ev.clientX,ev.clientY)});
    body.querySelector('form').addEventListener('submit',ev=>{ev.preventDefault();pctSubmit++});
    for(const type of ['pointerdown','mousedown','pointerup','mouseup','click','pointercancel','input','change','wheel'])body.addEventListener(type,ev=>pctEvents.push({type,button:ev.button,buttons:ev.buttons,pointerType:ev.pointerType}));
  });
  await aim('.pct-action');await touchClick('[data-pct=left]');assert.equal(await p.evaluate(()=>pctCount),1);
  const events=await p.evaluate(()=>pctEvents.slice(0,5));
  assert.deepEqual(events.map(e=>e.type),['pointerdown','mousedown','pointerup','mouseup','click']);
  assert.equal(events[0].pointerType,'mouse');assert.equal(events[0].buttons,1);assert.equal(events[2].buttons,0);
  await aim('.pct-check');await touchClick('.pc-touch-pad');assert(await p.locator('.pct-check').isChecked(),'Native checkbox activation');
  await aim('.pct-action');await touchClick('[data-pct=right]');
  await p.waitForFunction(()=>[...document.querySelectorAll('.menu button')].some(b=>b.textContent.includes('Trackpad properties')));
  const item=p.locator('.menu button').filter({hasText:'Trackpad properties'});await aim('.menu button',.5,.5);await touchClick('[data-pct=left]');
  assert.equal(await p.evaluate(()=>pctCount),11,'Pad pointer closed context menu before translated click');assert.equal(await item.count(),0);
  // Native monitor coordinates round-trip in the in-world projection.
  const mapped=await p.evaluate(()=>{const {x,y}=PCTouch.state,c=DesktopSurface.client(x,y),v=DesktopSurface.point(c.x,c.y);return Math.hypot(v.x-x,v.y-y)});assert(mapped<.01);
  await aim('#pctWindow .tb',.35,.5);
  const before=await p.locator('#pctWindow').evaluate(el=>({x:el.offsetLeft,y:el.offsetTop}));
  await touchClick('[data-pct=drag]');assert(await p.evaluate(()=>PCTouch.state.captured));
  await stroke(30,16);await touchClick('[data-pct=drag]');await zero();
  const after=await p.locator('#pctWindow').evaluate(el=>({x:el.offsetLeft,y:el.offsetTop}));assert(after.x>before.x+55&&after.y>before.y+25,'Real titlebar drag failed');
  await aim('#pctWindow .appgrip');const oldWidth=await p.locator('#pctWindow').evaluate(el=>el.offsetWidth);
  await touchClick('[data-pct=drag]');await stroke(15,8);await touchClick('[data-pct=drag]');await zero();assert(await p.locator('#pctWindow').evaluate((el,w)=>el.offsetWidth>w,oldWidth));
  await aim('#pctWindow .tb',.35,.5);await touchClick('[data-pct=double]');assert(await p.locator('#pctWindow').evaluate(el=>el.classList.contains('maxwin')),'Double click did not maximise');
  await aim('#pctWindow .tb',.35,.5);await touchClick('[data-pct=double]');assert.equal(await p.locator('#pctWindow').evaluate(el=>el.classList.contains('maxwin')),false);
  // Hold Left with one actual touch and move the pad with another.
  await aim('#pctWindow .tb',.35,.5);const heldBefore=await p.locator('#pctWindow').evaluate(el=>el.offsetLeft);
  const left=await center('[data-pct=left]'),pad=await center('.pc-touch-pad');
  await frame('touchStart',[{id:1,x:left.x,y:left.y}]);
  await frame('touchStart',[{id:1,x:left.x,y:left.y},{id:2,x:pad.x,y:pad.y}]);
  await frame('touchMove',[{id:1,x:left.x,y:left.y},{id:2,x:pad.x+15,y:pad.y}]);await end();await zero();
  assert(await p.locator('#pctWindow').evaluate((el,x)=>el.offsetLeft>x+20,heldBefore));
  // Two-finger scrolling must perform the wheel default inside the page.
  await aim('.pct-scroll');const q=await center('.pc-touch-pad');
  await frame('touchStart',[{id:1,x:q.x-25,y:q.y+15},{id:2,x:q.x+25,y:q.y+15}]);
  for(let i=1;i<=4;i++)await frame('touchMove',[{id:1,x:q.x-25,y:q.y+15-i*7},{id:2,x:q.x+25,y:q.y+15-i*7}]);await end();
  assert(await p.locator('.pct-scroll').evaluate(el=>el.scrollTop>30));
  await p.locator('.pct-scroll').evaluate(el=>el.scrollTop=0);await stroke(0,-22,'.pc-touch-scroll');assert(await p.locator('.pct-scroll').evaluate(el=>el.scrollTop>30));
  await aim('.pct-text');await touchClick('[data-pct=left]');await touchClick('[data-pct=type]');
  await p.locator('.pc-touch-editor input').fill('quiet type 1999');assert.equal(await p.locator('.pct-text').inputValue(),'quiet type 1999');
  assert.equal(await p.evaluate(()=>House.mode),'monitor','Text Q/T escaped the PC');
  await touchClick('[data-pct=enter]');assert.equal(await p.evaluate(()=>pctSubmit),1);
  await touchClick('[data-pct=tab]');await p.locator('.pc-touch-editor input').fill('second field');assert.equal(await p.locator('.pct-next').inputValue(),'second field');
  await screenshot('text-entry');await touchClick('[data-pct=done]');
  // Real Notepad gets multiline input and its input listener sees edits.
  await p.evaluate(()=>Apps.open('notepad'));await until(()=>!!document.querySelector('.npwin textarea'));
  await aim('.npwin textarea',.3,.3);await touchClick('[data-pct=left]');await touchClick('[data-pct=type]');
  await p.locator('.pc-touch-editor textarea').fill('First line');await touchClick('[data-pct=enter]');await p.locator('.pc-touch-editor textarea').press('End');await p.locator('.pc-touch-editor textarea').pressSequentially('Second line');
  assert.equal(await p.locator('.npwin textarea').inputValue(),'First line\nSecond line');await touchClick('[data-pct=done]');
  // Cancel, menu, viewport change, and leave-PC each release both protocols.
  await p.evaluate(()=>{document.querySelector('.npwin').style.display='none';pctWin.focus()});
  await aim('#pctWindow .tb',.35,.5);await touchClick('[data-pct=drag]');
  const insets=await p.evaluate(()=>['--pc-touch-reserve-bottom','--pc-touch-reserve-right'].map(k=>document.documentElement.style.getPropertyValue(k)));
  await p.keyboard.press('Escape');await zero();assert(await p.evaluate(()=>HousePause.open));
  assert.deepEqual(await p.evaluate(()=>['--pc-touch-reserve-bottom','--pc-touch-reserve-right'].map(k=>document.documentElement.style.getPropertyValue(k))),insets,'Pause shifted the PC camera');await p.keyboard.press('Escape');
  await aim('.pct-action');const held=await center('[data-pct=left]');await frame('touchStart',[{id:1,x:held.x,y:held.y}]);await end(true);await zero();assert(await p.evaluate(()=>pctEvents.some(e=>e.type==='pointercancel')));
  await aim('#pctWindow .tb',.35,.5);await touchClick('[data-pct=drag]');await p.setViewportSize({width:844,height:390});await zero();await fit();await screenshot('landscape-world');
  await touchClick('[data-pct=lock]');assert(await p.evaluate(()=>House.desktopDisplay()));await fit();await screenshot('landscape-lock');
  await p.setViewportSize({width:390,height:844});await fit();await screenshot('portrait-lock');
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PCTouch?.state.visible&&!document.querySelector('.hs-loading,#houseEntry'));await fit();await screenshot('portrait-refresh');await zero();
  await touchClick('[data-pct=fold]');assert(await p.evaluate(()=>PCTouch.state.folded));await screenshot('minimised');await touchClick('[data-pct=fold]');
  await touchClick('[data-pct=menu]');await p.locator('[name=pcTrackpad]').uncheck();await p.locator('[data-pause=resume]').tap();assert.equal(await p.locator('.pc-touch').isVisible(),false);
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&!!window.PCTouch&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>PCTouch.enabled),false);
  await p.locator('.hs-menu-button').tap();await p.locator('[name=pcTrackpad]').check();await p.locator('[data-pause=resume]').tap();await until(()=>PCTouch.state.visible);
  await aim('#brTitleBar',.3,.5);await touchClick('[data-pct=drag]');assert.equal(await p.evaluate(()=>PCTouch.state.buttons),1);
  await p.keyboard.press('q');await until(()=>House.mode==='walk');await zero();assert.equal(await p.locator('.pc-touch').isVisible(),false);await screenshot('room-exit');
  assert.deepEqual(errors,[]);
} catch(e) {await screenshot('failure');throw e} finally {await browser.close()}
// A fresh fine-pointer desktop must keep its native mouse path and default UI.
const desk=await roomFixture(base,{width:1366,height:860});
try {
  const p=desk.page;await p.evaluate(()=>{House.hush();House.sitDown()});await desk.until(()=>House.mode==='monitor');
  assert.equal(await p.evaluate(()=>PCTouch.enabled),false);assert.equal(await p.locator('.pc-touch').isVisible(),false);
  await p.evaluate(()=>{const body=document.createElement('div');body.textContent='Desktop mouse check';window.pctDesktop=Desk.openWin('Mouse properties',body,320);pctDesktop.el.id='pctDesktop'});
  const r=await p.locator('#pctDesktop .tb').boundingBox(),old=await p.locator('#pctDesktop').evaluate(el=>el.offsetLeft);
  await p.mouse.move(r.x+r.width*.3,r.y+r.height*.5);await p.mouse.down();await p.mouse.move(r.x+r.width*.3+35,r.y+r.height*.5+15,{steps:5});await p.mouse.up();
  assert(await p.locator('#pctDesktop').evaluate((el,x)=>el.offsetLeft>x+15,old),'Direct desktop mouse changed');
  await p.screenshot({path:'shots/pc-trackpad-desktop-mouse.png'});assert.deepEqual(desk.errors,[]);
  console.log('PC TRACKPAD PASS: actual touch; native pointer/mouse/capture/defaults, double/right click, hold/latched drag, scroll, text/form/Notepad; portrait, landscape, LOCK IN, refresh/disable, lifecycle, native desktop mouse.');
} finally {await desk.browser.close()}
