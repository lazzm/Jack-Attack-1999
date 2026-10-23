import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=new URL(process.argv[2]);base.searchParams.set('allsoft','1');
const f=await roomFixture(base.href),{page:p,until,errors,browser,view}=f;
const rows=[];
try{
 await p.evaluate(()=>{House.ambient.clear();House.graphicsSet({preset:'low'});House.graphicsSet({dynamic:false,scale:.75})});
 await view([-15,-55,105],[0,-17,-12]);await p.evaluate(()=>House._.setMode('walk'));
 await until(()=>document.documentElement.classList.contains('hs-screen-idle'));
 const state=await p.evaluate(async()=>{
  const surface=document.getElementById('monitorSurface');
  const probe=document.createElement('span');probe.id='effortProbe';probe.textContent='Waiting';probe.style.animation='effort-test 1s infinite';surface.appendChild(probe);
  const style=document.createElement('style');style.textContent='@keyframes effort-test{from{opacity:.7}to{opacity:1}}';surface.appendChild(style);
  const marquee=document.createElement('marquee');marquee.textContent='JackNet message';surface.appendChild(marquee);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='effortSVG';surface.appendChild(svg);
  await new Promise(r=>setTimeout(r,100));
  setTimeout(()=>probe.textContent='New message received',50);
  await new Promise(r=>setTimeout(r,150));
  return{paused:getComputedStyle(probe).animationPlayState,message:probe.textContent,svg:svg.animationsPaused(),connected:Net.connected,crt:getComputedStyle(document.getElementById('crtglass')).display};
 });assert.equal(state.paused,'paused');assert.equal(state.message,'New message received');assert(state.svg&&state.connected);assert.equal(state.crt,'none');
 for(const variant of ['resting','hidden']){
  await p.evaluate(v=>document.getElementById('monitorSurface').style.visibility=v==='hidden'?'hidden':'',variant);
  const result=await p.evaluate(()=>new Promise(resolve=>{let last=0,n=0;const times=[];function tick(t){if(last&&n>5)times.push(t-last);last=t;House.dirty();if(++n<40)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);resolve({median:times[times.length>>1],p90:times[Math.floor(times.length*.9)],pixels:House.ren.domElement.width*House.ren.domElement.height})}}requestAnimationFrame(tick)}));rows.push({variant,...result});console.log('SCREEN EFFORT',variant,JSON.stringify(result));
 }
 await p.evaluate(()=>{document.getElementById('monitorSurface').style.visibility='';House.sitDown()});await until(()=>House.mode==='monitor'&&!document.documentElement.classList.contains('hs-screen-idle'));
 assert.equal(await p.locator('#effortProbe').evaluate(el=>getComputedStyle(el).animationPlayState),'running');
 assert.equal(await p.evaluate(()=>document.getElementById('effortSVG').animationsPaused()),false);
 // Backing resolution rests without resizing the game, replacing its kit,
 // or losing state. Re-entering restores its sharp backing immediately.
 await p.evaluate(()=>Apps.open('games.pinball'));await until(()=>!!window.JGames?.live.pinball?.dbg);
 const canvasState=await p.evaluate(()=>{const G=JGames.live.pinball,cv=G.host.querySelector('canvas');window.effortGame=G;window.effortBackingWidth=cv.width;return{width:cv.width,height:cv.height,cssWidth:cv.style.width,cssHeight:cv.style.height}});
 await p.keyboard.press('q');await until(()=>House.mode==='walk');await until(()=>JGames.live.pinball.host.querySelector('canvas').width<window.effortBackingWidth);
 const restingCanvas=await p.evaluate(()=>{const G=JGames.live.pinball,cv=G.host.querySelector('canvas');return{same:G===effortGame,width:cv.width,height:cv.height,cssWidth:cv.style.width,cssHeight:cv.style.height}});
 assert(restingCanvas.same);assert(Math.abs(restingCanvas.width*2-canvasState.width)<=1);assert.equal(restingCanvas.cssWidth,canvasState.cssWidth);assert.equal(restingCanvas.cssHeight,canvasState.cssHeight);
 await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor');await until(()=>JGames.live.pinball.host.querySelector('canvas').width===window.effortBackingWidth);
 assert(await p.evaluate(()=>JGames.live.pinball===effortGame));await p.evaluate(()=>JGames.live.pinball.w.close());await p.keyboard.press('q');await until(()=>House.mode==='walk');
 await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('n64.range')});await until(()=>RoomTV._dbg()?.st==='game');
 await p.evaluate(()=>window.savedScreenGame=RoomTV.dbg());await p.keyboard.press('q');await until(()=>RoomTV._dbg()?.background);
 await view([100,-55,180],[180,-55,180]);await p.evaluate(()=>House._.setMode('walk'));await p.waitForTimeout(700);
 const off=await p.evaluate(()=>{window.offscreenTick=RoomTV.dbg().frame;return RoomTV.dbg().frame});await p.waitForTimeout(1400);
 assert(await p.evaluate(frame=>RoomTV.dbg()===savedScreenGame&&RoomTV.dbg().frame>frame+35,off),'Off-camera game stopped simulating');
 await p.evaluate(()=>House.act('telly'));await until(()=>RoomTV.open_);assert(await p.evaluate(()=>RoomTV.dbg()===savedScreenGame));
 await p.screenshot({path:'shots/screen-effort-console-resume.png'});await p.keyboard.press('q');
 assert.deepEqual(errors,[]);await writeFile('shots/screen-effort.json',JSON.stringify({state,rows,canvasState,restingCanvas},null,2));console.log('SCREEN EFFORT PASS: decorative rest, live DOM/network, SVG resume, fixed-step off-camera console and same-instance return');
}finally{await browser.close()}
