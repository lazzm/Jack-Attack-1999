import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
try{
 // Aim at real surfaces and use E; the support API must match the visible mesh.
 for(const [id,eye,target,y]of [['trophy',[-30,-55,50],[16,-129.2,-45],-129.2],['cactus',[130,-55,40],[218,-14,-49],-14]]){
  const height=await p.evaluate(({id,target})=>{const t=House.THINGS[id];return House.ROOMS.bedroom.supports.filter(s=>target[0]>=s.x0&&target[0]<=s.x1&&target[2]>=s.z0&&target[2]<=s.z1).map(s=>s.y)}, {id,target});
  const actual=height.filter(h=>h<0).sort((a,b)=>a-b)[0];assert(Number.isFinite(actual));target[1]=actual;
  await f.view(eye,target);await p.evaluate(id=>{House._.setMode('walk');House.grab(id)},id);await p.waitForTimeout(250);await p.keyboard.press('e');await until(()=>!House.held()&&!Object.values(House.THINGS).some(t=>['fall','anim'].includes(t.st)));
  const at=await p.evaluate(id=>House.THINGS[id].at,id);assert(Math.abs(at.y-actual)<.1,`${id}: fell through visible surface: ${JSON.stringify(at)} expected ${actual}`);
  await p.screenshot({path:`shots/props-town/placed-${id}.png`});
 }
 const at=await p.evaluate(()=>{House.saveThings(true);return ['cactus','trophy'].map(id=>({...House.THINGS[id].at}))});await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.THINGS.trophy&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
 for(const [i,id]of ['cactus','trophy'].entries()){const restored=await p.evaluate(id=>House.THINGS[id].at,id);assert.equal(restored.room,at[i].room);for(const axis of ['x','y','z','ry'])assert(Math.abs(restored[axis]-at[i][axis])<=.51,id+' refresh changed '+axis);}
 await p.evaluate(()=>House._.setMode('walk'));
 for(const id of ['chair','beanbag']){
  assert(await p.evaluate(id=>House.sitOn(id),id));await p.waitForTimeout(70);await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);assert(!await p.evaluate(()=>!!localStorage.getItem('jhp_hs_furniture_seat')));
  assert(await p.evaluate(id=>House.sitOn(id),id));await p.waitForTimeout(70);await p.keyboard.press('Escape');await until(()=>HousePause.open);await p.keyboard.press('Escape');await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
 }
 assert.deepEqual(errors,[]);console.log('FINAL PLACEMENT PASS: actual E drops onto shelf/sill, changed placements survive refresh; Q/Esc during entry on both seats; no errors/warnings');
}catch(e){await p.screenshot({path:'shots/props-town/placement-failure.png'});throw e}finally{await f.browser.close()}
