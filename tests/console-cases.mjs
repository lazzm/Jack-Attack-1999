import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
import {insertCase} from './case-actions.mjs';
const base = process.argv[2] || 'http://localhost:18461';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Disposable server only');
const account = 'Cases' + Date.now().toString(36), password = 'Throwaway-1999';
assert((await fetch(base + '/admin/register', {method: 'POST', headers: {'x-admin-token': 'testtoken', 'content-type': 'application/json'}, body: JSON.stringify({name: account, pass: password})})).ok);
const{browser,page:p,errors,view}=await roomFixture(base,{account,password,signup:false,timeoutScale:3});
async function until(fn){for(let i=0;i<150;i++){if(await p.evaluate(fn))return;await p.waitForTimeout(150)}throw Error('Timeout '+fn+' state '+JSON.stringify(await p.evaluate(()=>({held:House.held(),box:House.THINGS['media.box.ps.run'].st,media:House.THINGS['media.ps.run'].st,snap:House.THINGS['media.ps.run'].snap}))))}
async function walk(eye,target){await view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')});await until(()=>Math.abs(House.W.eyeNow-House.W.eye)<.05);await p.evaluate(([tx,ty,tz])=>{const P=House.P;P.rx=Math.atan2(-(ty-P.y),Math.hypot(tx-P.x,tz-P.z))*180/Math.PI;P.ry=Math.atan2(tx-P.x,-(tz-P.z))*180/Math.PI;House.dirty()},target);await p.waitForTimeout(200)}
try{
 const boxes=await p.evaluate(()=>Object.values(House.THINGS).filter(t=>t.kind==='console-case').map(t=>({id:t.id,game:t.gameId,at:t.at,home:t.home,details:!!t.obj.userData.mediaCase})));
 assert(boxes.length>=5);assert(boxes.every(t=>t.details));assert.equal(new Set(boxes.map(t=>t.home.snap)).size,boxes.length);
 for(const box of boxes)assert(await p.evaluate(id=>{const t=House.THINGS['media.'+id];return t.at.hide&&t.snap==='media.case.'+id},box.game),'Medium does not start in its own case');
 const box=boxes.find(t=>t.game==='ps.run'),cart=boxes.find(t=>t.game==='n64.kart');assert(box&&cart);
 assert.equal(await p.evaluate(()=>House.SNAPS['console.ps'].accepts('console-case',House.THINGS['media.box.ps.run'])),false,'Console accepted the whole box');assert(await p.evaluate(()=>House.SNAPS['console.ps'].accepts('console-disc',House.THINGS['media.ps.run'])));
 const rackX=box.home.x;
 for(const [name,eye,target] of [['front',[-180,-10,55],[rackX,28,-43]],['side',[-140,-15,0],[rackX,28,-43]]]){
  await view(eye,target);await p.screenshot({path:`shots/console-cases-${name}.png`});await p.setViewportSize({width:390,height:844});await p.screenshot({path:`shots/console-cases-${name}-narrow.png`});await p.setViewportSize({width:1366,height:860});
 }
 // Custom slot, through the same crosshair/E path as real play.
 const target=await p.evaluate(()=>House.SNAPS['media.slot.19'].pose);
 await walk([-220,-55,35],[box.at.x,box.at.y-6,-36]);assert(await p.evaluate(()=>!!House._.floorAt(House.W.x,House.W.z,'U',73)),'Test stands inside furniture');await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),box.id,'Real E did not pick the jewel case');
 await walk([-220,-55,35],[target.x,target.y-6,-36]);await p.waitForTimeout(350);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),null,'Shelf target did not accept box');await until(()=>House.THINGS['media.box.ps.run'].st==='snap');
 assert.equal(await p.evaluate(()=>House.THINGS['media.box.ps.run'].snap),'media.slot.19');assert.equal(await p.evaluate(()=>Apps.store.get('jhp_console_slots',{})['ps.run']),19);
 console.log('Custom slot saved');
 // Filled disc and cartridge cases use the same physical machine transaction.
 for(const item of [box,cart]){
  await p.evaluate(()=>{HousePause.close();House.pauseControls(false)});
  const sid='console.'+item.game.split('.')[0];await insertCase({page:p,view},item.id,sid);await until(()=>!HouseCases.busy&&RoomTV?._dbg()?.st==='game');
  assert(await p.evaluate(id=>House.physics.body(id).fixed,item.id));await p.keyboard.press('q');await until(()=>!House.gliding&&!House.focused);await p.evaluate(()=>{HousePause.close();House.pauseControls(false);House._.setMode('walk')});
  assert(await p.evaluate(sid=>HouseCases.eject(sid),sid));await until(()=>!HouseCases.busy);assert.equal(await p.evaluate(id=>House.THINGS['media.'+id].snap,item.game),'media.case.'+item.game);
  if(!await p.evaluate(()=>House.held()))assert(await p.evaluate(id=>House.grab(id),item.id));assert.equal(await p.evaluate(()=>House.held()),item.id);await p.evaluate(()=>House.putBack());await until(()=>!House.held());
 }
 // Tidy follows the user's newly assigned slot, including after refresh.
 await p.evaluate(()=>{Room.tidy();House.saveThings(true)});assert.equal(await p.evaluate(()=>House.THINGS['media.box.ps.run'].at.y),target.y);
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&House.THINGS?.['media.box.ps.run']&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await p.evaluate(()=>House.THINGS['media.box.ps.run'].home.snap),'media.slot.19');assert.equal(await p.evaluate(()=>House.THINGS['media.ps.run'].snap),'media.case.ps.run');
 await view([-165,-5,60],[rackX,32,-43]);await p.screenshot({path:'shots/console-cases-custom-refresh.png'});
 await p.evaluate(()=>{House.hush();House._.setMode('walk');House.grab('media.box.ps.run');House.inspect('media.box.ps.run')});await p.waitForTimeout(400);await p.screenshot({path:'shots/console-case-inspect-front.png'});await p.mouse.move(600,400);await p.mouse.down();await p.mouse.move(1100,450,{steps:20});await p.mouse.up();await p.screenshot({path:'shots/console-case-inspect-reverse.png'});await p.keyboard.press('q');await p.evaluate(()=>House.putBack());
 await p.evaluate(()=>{for(const g of RoomCat.GAMES.filter(g=>!RoomCat.CONSOLES[g.con].away)){Room._.S.f['cart.'+g.id]=1;Room._.emit('find','cart.'+g.id)}Room.tidy()});
 const full=await p.evaluate(()=>Object.values(House.THINGS).filter(t=>t.kind==='console-case'&&t.home.room==='bedroom').map(t=>({home:t.home,h:t.h,hx:t.hx,hz:t.hz})));assert.equal(full.length,19);assert.equal(new Set(full.map(t=>t.home.snap)).size,19);assert(full.every(t=>t.h<14&&t.hz<2&&t.hx<7.3));
 await view([-180,-10,55],[rackX,28,-43]);await p.screenshot({path:'shots/console-cases-full-rack.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/console-cases-full-rack-narrow.png'});
 assert.deepEqual(errors,[]);console.log('CONSOLE CASES PASS: owned games boxed, solid hinged models, custom slot via E, filled-case insertion, fixed parking, disc/cartridge return to same case, tidy and refresh');
}finally{await browser.close()}
