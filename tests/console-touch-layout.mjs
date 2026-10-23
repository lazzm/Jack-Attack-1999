// Run sequentially against main's disposable localhost server. Four-minute cap.
// Captures six controller families at desktop, 390x844 and 844x390, and sends
// real simultaneous touch contacts through Chromium's input pipeline.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
let browser;
const watchdog=setTimeout(()=>{console.error('Console touch review exceeded 240 seconds');Promise.resolve(browser?.close()).finally(()=>process.exit(1))},240000);
try {
 const f=await roomFixture(process.argv[2]||'http://localhost:18080',{touch:true,width:390,height:844});browser=f.browser;const p=f.page;
 p.setDefaultTimeout(12000);await mkdir('shots',{recursive:true});await p.evaluate(()=>Apps.load('js/rm-tv.js'));await p.touchscreen.tap(2,2);
 const cdp=await p.context().newCDPSession(p), rect=async s=>{const r=await p.locator('.rm-tvv.on '+s).boundingBox();assert(r,'Missing '+s);return r};
 const contacts=new Map();
 async function contact(type,id,r,x=.5,y=.5){if(type==='touchEnd'){const point=contacts.get(id);contacts.delete(id);await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:point?[point]:[]});return}contacts.set(id,{id,x:r.x+r.width*x,y:r.y+r.height*y,radiusX:2,radiusY:2});await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...contacts.values()]})}
 async function cancel(){contacts.clear();await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})}
 for(const gid of ['n64.range','ps.sneak','gb.blocks','md.zip','dc.taxi','sn.fight']) {
  assert(await p.evaluate(gid=>{window.consoleTouchExpected=gid;return RoomTV.test(gid)},gid));await f.until(()=>RoomTV._dbg()?.gid===window.consoleTouchExpected&&RoomTV._dbg()?.st==='game');
  await p.evaluate(()=>{window.consoleTouchInstance=RoomTV.dbg();window.consoleTouchCanvas=RoomTV.dbg().cv});
  for(const [width,height,label] of [[390,844,'portrait'],[844,390,'landscape'],[1366,860,'desktop']]) {
   await p.setViewportSize({width,height});await p.evaluate(()=>RoomTV.lockIn(true));await p.waitForTimeout(120);
   const geometry=await p.evaluate(()=>{
    const root=document.querySelector('.rm-tvv.on'),glass=root.querySelector('.rm-glass'),r=glass.getBoundingClientRect(),k=RoomTV.dbg();
    const intersects=b=>Math.min(r.right,b.right)-Math.max(r.left,b.left)>.5&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>.5;
    const visible=e=>{const b=e.getBoundingClientRect(),style=getComputedStyle(e);return b.width>0&&b.height>0&&style.display!=='none'&&style.visibility!=='hidden'};
    const buttons=[...root.querySelectorAll('.rm-pad [data-b],.rm-tools button')].filter(visible);
    const controls=[...buttons,...root.querySelectorAll('.rm-pad .rm-stick,.rm-pad .rm-dpad')].filter(visible);
    return {ratio:r.width/r.height,native:k.W/k.H,inside:r.left>=-.5&&r.top>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,overlaps:controls.filter(e=>intersects(e.getBoundingClientRect())).map(e=>e.dataset.b||e.className),unreachable:buttons.flatMap(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return e===hit||e.contains(hit)?[]:[{button:e.dataset.b||e.className,rect:{x:b.x,y:b.y,w:b.width,h:b.height},hit:hit?.outerHTML.slice(0,300)}]}),same:k===consoleTouchInstance&&k.cv===consoleTouchCanvas,keys:buttons.map(e=>e.dataset.b).filter(Boolean)};
   });
   await p.screenshot({path:`shots/console-touch-${gid.replace('.','-')}-${label}.png`});
   assert(Math.abs(geometry.ratio-geometry.native)<.005,JSON.stringify(geometry));assert(geometry.inside);assert.deepEqual(geometry.overlaps,[],'Controls cover native screen');assert.deepEqual(geometry.unreachable,[],gid+' '+label+' obscured control');assert(geometry.same);
   const expected=await p.evaluate(()=>[...RoomTV.dbg().def.buttons,'start',...(RoomTV.LOOK[RoomTV.dbg().con].keys.select?['select']:[])]);
   for(const b of expected)assert(geometry.keys.includes(b),gid+' has no '+b+' button');
   await p.screenshot({path:`shots/console-touch-${gid.replace('.','-')}-${label}.png`});
   // Press every face/shoulder/start/select button using native touch input.
   for(const b of expected){const r=await rect(`.rm-pad [data-b="${b}"]`);await contact('touchStart',1,r);assert(await p.evaluate(b=>RoomTV.dbg().held(b),b),gid+' did not hold '+b);await contact('touchEnd',1);assert(!await p.evaluate(b=>RoomTV.dbg().held(b),b))}
   if(gid==='n64.range') {
    const move=await rect('.rm-pad .rm-dpad'),aim=await rect('.rm-pad .rm-stick'),fire=await rect('.rm-pad [data-b="a"]');
    await contact('touchStart',1,move,.5,.08);await contact('touchStart',2,aim,.92,.5);await contact('touchStart',3,fire);
    assert(await p.evaluate(()=>RoomTV.dbg().held('moveForward')&&RoomTV.dbg().held('a')&&RoomTV.dbg().stick().x>.5));
    await contact('touchEnd',2);const releasedAim=await p.evaluate(()=>({move:RoomTV.dbg().held('moveForward'),up:RoomTV.dbg().held('up'),fire:RoomTV.dbg().held('a'),stick:RoomTV.dbg().stick(),mode:GameInput.mode,dual:document.querySelector('.rm-tvv.on').classList.contains('rm-dual')}));assert(releasedAim.move&&releasedAim.stick.x===0&&releasedAim.stick.y===0,'Move became aim after aim release: '+JSON.stringify(releasedAim));
    await cancel();assert(await p.evaluate(()=>!RoomTV.dbg().held('a')&&!RoomTV.dbg().held('moveForward')));
   }
  }
  await p.locator('.rm-tvv.on .rm-menu').tap();assert(await p.evaluate(()=>HousePause.open));await p.evaluate(()=>HousePause.close());
  await p.evaluate(()=>{for(let i=0;i<8;i++){RoomTV.lockIn(false);RoomTV.lockIn(true)}});assert(await p.evaluate(()=>RoomTV.dbg()===consoleTouchInstance));
  await p.locator('.rm-tvv.on .rm-lock').tap();assert(!await p.evaluate(()=>RoomTV.lockIn()));
  await p.screenshot({path:`shots/console-touch-${gid.replace('.','-')}-in-room.png`});
  const live=await p.evaluate(()=>!RoomCat.CONSOLES[RoomTV.dbg().con].away);
  if(live){await p.locator('.rm-tvv.on .rm-lean').tap();assert(await p.evaluate(()=>RoomTV._dbg()?.background));await p.evaluate(()=>RoomTV.open(consoleTouchInstance.con));assert(await p.evaluate(()=>RoomTV.dbg()===consoleTouchInstance&&!RoomTV.lockIn()),'Back restarted the console')}
 }
 assert.deepEqual(f.errors,[]);console.log('CONSOLE TOUCH LAYOUT PASS: six controller families, three sizes, reachable actions, native screen clearance, real multitouch/cancellation, menu, rapid LOCK IN and same-instance back/re-entry. Inspect shots/console-touch-* images.');
} finally {clearTimeout(watchdog);await browser?.close()}
