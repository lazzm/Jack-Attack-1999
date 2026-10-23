import assert from 'node:assert/strict';import{roomFixture}from'./room-fixture.mjs';
const f=await roomFixture(process.argv[2]),{page:p,until,errors,browser}=f;
try{
 await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('n64.range')});await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('q');await until(()=>RoomTV._dbg()?.background);await p.evaluate(()=>House.act('telly'));await until(()=>House.mode==='focus'&&RoomTV.open_);
 await p.evaluate(()=>window.pcConsole=RoomTV.dbg());assert.equal(await p.locator('.rm-pad,.hs-joy,.hs-use,.hs-jump,.hs-duck,.pc-touch').count(),0);
 await p.keyboard.down('w');assert(await p.evaluate(()=>RoomTV.dbg().held('moveForward')));await p.mouse.move(300,300);await p.mouse.move(330,310);assert(await p.evaluate(()=>RoomTV.dbg().held('moveForward')));await p.keyboard.down('ArrowLeft');assert(await p.evaluate(()=>RoomTV.dbg().stick().x===-1));await p.keyboard.up('ArrowLeft');await p.keyboard.up('w');
 await p.keyboard.down('z');await p.keyboard.down('Space');await p.keyboard.up('z');assert(await p.evaluate(()=>RoomTV.dbg().held('a')));await p.keyboard.up('Space');assert(!await p.evaluate(()=>RoomTV.dbg().held('a')));
 await p.keyboard.press('t');assert(await p.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg()===pcConsole));
 for(const [width,height]of [[1366,860],[1920,1080],[2560,1080]]){await p.setViewportSize({width,height});await p.waitForTimeout(150);const r=await p.locator('.rm-tvv.on .rm-glass').boundingBox();assert(Math.abs(r.width/r.height-4/3)<.01);await p.screenshot({path:`shots/pc-only/console-${width}.png`})}
 await p.evaluate(()=>{window.pcPad={index:0,connected:true,buttons:Array.from({length:16},(_,i)=>({pressed:i===0,value:i===0?1:0})),axes:[.7,-.4]};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pcPad?[pcPad]:[]})});
 await until(()=>GameInput.mode==='gamepad'&&RoomTV.dbg().held('a'));assert(Math.abs(await p.evaluate(()=>RoomTV.dbg().stick().x)-.7)<.01);assert.equal(await p.locator('.rm-pad').count(),0);
 await p.evaluate(()=>{window.pcPad=null;window.dispatchEvent(new Event('gamepaddisconnected'))});await until(()=>!RoomTV.dbg().held('a'));assert.equal(await p.evaluate(()=>RoomTV.dbg().stick().x),0);
 await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));assert.equal(await p.locator('[name=pcTrackpad]').count(),0);await p.keyboard.press('Escape');await p.keyboard.press('q');await until(()=>RoomTV._dbg()?.background);const frame=await p.evaluate(()=>RoomTV.dbg().frame);await p.waitForTimeout(500);assert(await p.evaluate(n=>RoomTV.dbg().frame>n+5,frame));
 await p.evaluate(()=>House.act('telly'));await until(()=>House.mode==='focus'&&RoomTV.open_);assert(await p.evaluate(()=>RoomTV.dbg()===pcConsole));assert.deepEqual(errors,[]);
 console.log('PC CONSOLE PASS: WASD/mouse/arrow aim, aliased keys, simulated gamepad/disconnect, Esc, same-instance Q/background/T, native ratio at three desktop sizes; no mobile overlays or errors');
}finally{await browser.close()}
