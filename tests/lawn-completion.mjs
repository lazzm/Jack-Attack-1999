import assert from'node:assert/strict';import{roomFixture}from'./room-fixture.mjs';
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
async function pose(x,z,ry){await p.evaluate(({x,z,ry})=>{House.hush();House.setWalkFrom({x,y:195,z,lvl:'G',ry,rx:-55,seat:0});Object.assign(House.P,{x,y:195,z,ry,rx:-55});House._.setMode('walk')},{x,z,ry});await p.waitForTimeout(250)}
async function walk(ms){await p.keyboard.down('w');await p.waitForTimeout(ms);await p.keyboard.up('w');await p.waitForTimeout(100)}
try{
 await p.evaluate(async()=>{House.buildRoom(House.ROOMS.drive);await Apps.load('js/ch-core.js');await Apps.load('js/ch-out.js')});await until(()=>ChoreKit.MODS.lawn._built);
 await pose(220,790,0);await p.evaluate(()=>House.act('ch.mower'));await p.keyboard.press('f');await until(()=>ChoreKit.tool.plugged);
 for(let strip=0;strip<8;strip++){
  if(!await p.evaluate(()=>ChoreKit.tool.plugged)){await pose(220,790,0);await p.keyboard.press('f');await until(()=>ChoreKit.tool.plugged)}
  const x=-330+(strip+.5)*446/8;await pose(x,1015,0);await walk(1900);await p.evaluate(()=>House.P.ry=180);await walk(1900);
  console.log('MOW STRIP',strip,await p.evaluate(()=>({x:House.W.x,z:House.W.z,done:Array.from({length:8},(_,i)=>ChoreKit.has('lawn','l'+i)),plugged:ChoreKit.tool.plugged})));
 }
 assert(await p.evaluate(()=>Array.from({length:8},(_,i)=>ChoreKit.has('lawn','l'+i)).every(Boolean)),'Not all lawn strips are reachable');
 await pose(196,780,180);await p.waitForTimeout(200);await p.keyboard.press('f');await until(()=>!ChoreKit.tool.cur&&ChoreKit.done('lawn'));await p.screenshot({path:'shots/exterior/lawn-complete.png'});
 const saved=await p.evaluate(()=>ChoreKit.S.v.lawn.cut);await p.evaluate(()=>House.saveWalkState());await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&window.ChoreKit?.MODS.lawn?._built&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>ChoreKit.S.v.lawn.cut),saved);assert(await p.evaluate(()=>ChoreKit.done('lawn')));assert.deepEqual(errors,[]);console.log('LAWN COMPLETION PASS: all eight strips reachable, F plug/put-away, completed state and grass mask survive refresh; zero errors');
}catch(e){await p.screenshot({path:'shots/exterior/lawn-completion-failure.png'});throw e}finally{await f.browser.close()}
