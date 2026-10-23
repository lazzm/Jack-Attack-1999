// Sequential localhost review. Real touch opens desktop/Start/folder shortcuts
// and launches a pinball ball; no game-open APIs stand in for those gestures.
// ?allsoft is this disposable fixture's installed-software precondition only.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
let browser;
const watchdog=setTimeout(()=>{console.error('Mobile game launch exceeded 240 seconds');Promise.resolve(browser?.close()).finally(()=>process.exit(1))},240000);
try {
 const base=new URL(process.argv[2]||'http://localhost:18080');assert(['localhost','127.0.0.1'].includes(base.hostname));base.searchParams.set('allsoft','1');
 const f=await roomFixture(base.href,{touch:true,width:390,height:844});browser=f.browser;const p=f.page;
 p.setDefaultTimeout(12000);await mkdir('shots',{recursive:true});
 await p.evaluate(()=>{House.hush();House.sitDown()});await f.until(()=>House.mode==='monitor'&&!!window.GameInput);
 await p.evaluate(()=>{window.PCTouch?.setEnabled(false);House.desktopDisplay(true)});
 if(await p.locator('#brClose').isVisible())await p.locator('#brClose').tap();
 const cdp=await p.context().newCDPSession(p);
 async function shot(tag){await p.screenshot({path:`shots/mobile-game-launch-${tag}.png`})}
 async function live(){await f.until(()=>!!window.JGames?.live.pinball?.dbg);assert.equal(await p.locator('.jgw-pinball').count(),1);assert(await p.evaluate(()=>GameInput.touch&&JGames.live.pinball.phone()))}
 async function closePinball(){await p.locator('.jgw-pinball [data-w=close]').tap();await f.until(()=>!JGames.live.pinball)}
 async function play(){
  const cv=p.locator('.jgw-pinball canvas').first(),r=await cv.boundingBox();assert(r);
  // A restored game may be paused. Carry on through the actual canvas first.
  if(await p.evaluate(()=>JGames.live.pinball.dbg().paused))await cv.tap();
  const before=await p.evaluate(()=>JGames.live.pinball.dbgBalls().map(b=>({x:b.x,y:b.y,vy:b.vy})));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:r.x+r.width*.6,y:r.y+r.height*.7}]});
  await p.waitForTimeout(420);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  // Assert physical state, not merely that a handler received an event.
  await f.until(()=>JGames.live.pinball.dbgBalls().some(b=>Math.abs(b.vy)>20));
  const after=await p.evaluate(()=>JGames.live.pinball.dbgBalls().map(b=>({x:b.x,y:b.y,vy:b.vy})));
  assert.notDeepEqual(after,before,'Touch failed to launch the ball');
 }
 await p.locator('#iconPinball').tap();await live();await play();await shot('desktop-touch-play');await closePinball();
 await p.locator('#startBtn').tap();await p.locator('#startMenu [data-sm=programs]').tap();
 await p.locator('.menu button.sub').filter({hasText:/^Games$/}).tap();
 await p.locator('.menu button').filter({hasText:/^Space Jack Pinball$/}).tap();await live();await play();await shot('start-touch-play');await closePinball();
 await p.locator('#iconGamesFolder').tap();const folder=p.locator('.appwin').filter({has:p.locator('.jgfolder')});await folder.waitFor({state:'visible'});
 await folder.locator('.jgfi').filter({hasText:'Space Jack Pinball'}).tap();await live();await play();await shot('folder-touch-play');await closePinball();
 // The web shortcut uses the same icon activation path.
 await folder.locator('.jgfi').filter({hasText:'Games Arcade (Web)'}).tap();await f.until(()=>document.querySelector('[data-sec=demos]')?.classList.contains('on'));await shot('web-shortcut');
 if(await p.locator('#brClose').isVisible())await p.locator('#brClose').tap();await folder.locator('[data-w=close]').tap();
 // Same narrow viewport, real physical mouse: first click selects, second opens.
 await p.mouse.move(3,3);await p.locator('#iconPinball').click();assert.equal(await p.evaluate(()=>GameInput.mode),'mouse');assert.equal(await p.locator('.jgw-pinball').count(),0);
 await p.waitForTimeout(500);await p.locator('#iconPinball').dblclick();await f.until(()=>!!JGames.live.pinball?.dbg);assert.equal(await p.locator('.jgw-pinball').count(),1);assert(!await p.evaluate(()=>JGames.live.pinball.phone()));
 await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>GameInput.mode),'keyboard');assert(!await p.evaluate(()=>JGames.live.pinball.phone()));await shot('hybrid-keyboard');
 // A software/text-field key must not make touch controls disappear.
 await p.locator('.jgw-pinball canvas').first().tap();assert(await p.evaluate(()=>GameInput.touch));
 await p.evaluate(()=>{window.inputProbe=document.createElement('input');inputProbe.setAttribute('aria-label','Input mode test');inputProbe.style.cssText='position:absolute;left:8px;top:8px;z-index:99;width:180px;min-height:44px';document.querySelector('.jghost').appendChild(inputProbe)});
 await p.getByLabel('Input mode test').tap();await p.keyboard.type('hello');assert(await p.evaluate(()=>GameInput.touch),'Text typing changed current input');await p.evaluate(()=>inputProbe.remove());
 await closePinball();
 // Hybrid console presentation: leave the PC before using physical hardware.
 await p.keyboard.press('q');await f.until(()=>House.mode==='walk');
 await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('n64.range')});await f.until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('q');await f.until(()=>RoomTV._dbg()?.background);await p.evaluate(()=>House.act('telly'));await f.until(()=>House.mode==='focus'&&RoomTV.open_);
 await p.locator('.rm-tvv.on .rm-lock').tap();assert(await p.evaluate(()=>GameInput.touch));
 assert.deepEqual(await p.locator('.rm-tvv.on .rm-tools button').allTextContents(),['BACK','MENU','IN ROOM']);
 const key=await p.evaluate(()=>{window.hybridConsole=RoomTV.dbg();return RoomTV.dbg().id});assert.equal(key,'n64.range');
 await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>GameInput.mode),'keyboard');assert(await p.locator('.rm-tvv.on .rm-pad').isHidden());assert(await p.evaluate(()=>RoomTV.dbg()===hybridConsole));
 await p.keyboard.down('w');assert(await p.evaluate(()=>RoomTV.dbg().held('moveForward')));await p.mouse.move(200,400);await p.mouse.move(215,405);assert.equal(await p.evaluate(()=>GameInput.mode),'mouse');assert(await p.evaluate(()=>RoomTV.dbg().held('moveForward')),'Mouse aim cancelled WASD');await p.keyboard.up('w');assert(!await p.evaluate(()=>RoomTV.dbg().held('moveForward')));
 await p.locator('.rm-tvv.on .rm-lock').tap();assert(await p.evaluate(()=>GameInput.touch));assert(await p.locator('.rm-tvv.on .rm-pad').isVisible());assert(await p.evaluate(()=>RoomTV.dbg()===hybridConsole));await shot('console-hybrid');
 assert.deepEqual(f.errors,[]);console.log('MOBILE GAME LAUNCH PASS: real desktop/Start/folder/web touch paths, ball launched via touch, narrow mouse double-click, keyboard/text exclusion and same-instance console mode changes. Inspect shots/mobile-game-launch-* images.');
} finally {clearTimeout(watchdog);await browser?.close()}
