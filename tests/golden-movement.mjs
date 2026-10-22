import assert from'node:assert/strict';import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18464');
const position=()=>p.evaluate(()=>__rangeDbg.camera.position.toArray());
try{
 await p.evaluate(()=>RoomTV.test('n64.range'));await until(()=>window.__rangeDbg&&RoomTV?._dbg()?.st==='game');await p.evaluate(()=>{__rangeDbg.SV.opt.assist=false;__rangeDbg.start(0,0)});
 const start=await position();await p.keyboard.down('d');await p.waitForTimeout(400);await p.keyboard.up('d');const right=await position();assert(right[0]>start[0]+.25,'D must move right');assert(Math.abs((await p.evaluate(()=>__rangeDbg.aimPos))[0])<.05,'D must not aim');
 await p.keyboard.down('a');await p.waitForTimeout(400);await p.keyboard.up('a');const left=await position();assert(left[0]<right[0]-.25,'A must move left');
 await p.keyboard.down('s');await p.waitForTimeout(400);await p.keyboard.up('s');const back=await position();assert(back[2]>left[2]+.25,'S must move back');await p.keyboard.down('w');await p.waitForTimeout(400);await p.keyboard.up('w');const forward=await position();assert(forward[2]<back[2]-.25,'W must move forward');
 const aim=await p.evaluate(()=>__rangeDbg.aimPos);await p.keyboard.down('ArrowRight');await p.waitForTimeout(300);await p.keyboard.up('ArrowRight');assert((await p.evaluate(()=>__rangeDbg.aimPos))[0]>aim[0]+.05,'Right arrow must aim');const noWalk=await position();assert(Math.hypot(noWalk[0]-forward[0],noWalk[2]-forward[2])<.05,'Arrow aimed but moved camera');
 await p.keyboard.down('w');await p.waitForTimeout(1300);await p.keyboard.up('w');const wall=await position();assert(wall[2]>-.7,'Walked through firing-booth counter');await p.screenshot({path:'shots/golden-wasd-desktop.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/golden-wasd-narrow.png'});
 await p.keyboard.down('d');await p.keyboard.press('Backspace');await p.keyboard.up('d');await until(()=>House.mode==='walk');const paused=await position();await p.waitForTimeout(300);const later=await position();assert(Math.abs(later[0]-paused[0])<.05,'Held movement stuck after leaning out');
 await p.keyboard.press('Escape');assert(await p.locator('.hs-pause-version').innerText());await p.screenshot({path:'shots/pause-version-narrow.png'});await p.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('GOLDEN WASD PASS: four directions, independent arrow aiming, counter collision, lean-out input clearing; pause release label');
}catch(e){await p.screenshot({path:'shots/golden-wasd-failure.png'});console.error(await p.evaluate(()=>({state:RoomTV._dbg(),camera:window.__rangeDbg?.camera.position.toArray(),aim:window.__rangeDbg?.aim})));throw e}finally{await browser.close()}
