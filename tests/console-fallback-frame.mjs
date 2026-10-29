// Cartridges without a screenPose hook still fit the real portable TV and controls.
import assert from 'node:assert/strict';
import{mkdir}from'node:fs/promises';
import{roomFixture}from'./room-fixture.mjs';
import{playCase}from'./case-actions.mjs';
const touch=process.argv.includes('--touch'),tag=touch?'touch-':'';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const account='Fallback'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,touch,timeoutScale:3}),{page:p,until,errors}=f;
await mkdir('shots/console-fallback-frame',{recursive:true});
try{
 await p.evaluate(()=>{House.buildRoom(House.ROOMS.cupboard);House.goRoom('cupboard',0)});await until(()=>!House.gliding);await playCase(f,'sn.fight');await p.evaluate(()=>window.fallbackInstance=RoomTV.dbg());
 for(const [width,height]of[[1366,860],[1920,1080],[390,844],[844,390],[768,1024],[1024,768]]){
  await p.setViewportSize({width,height});await until(()=>!House.gliding);await p.waitForTimeout(250);
  const bounds=await p.evaluate(()=>{const screen=House.ROOMS.cupboard.cupScreen;screen.parent.updateWorldMatrix(true,false);const points=[[-17,0,7.5],[17,0,7.5],[-17,-28,7.5],[17,-28,7.5]].map(a=>{const p=new THREE.Vector3(...a).applyMatrix4(screen.parent.matrixWorld);return House.toScreen(p.x,-p.y,p.z)});return {points,same:RoomTV.dbg()===fallbackInstance,surface:RoomTV._dbg().surface,hook:typeof RoomTV.defs['sn.fight'].screenPose}});
  assert(bounds.same&&bounds.surface);assert.equal(bounds.hook,'undefined');for(const q of bounds.points)assert(q&&q.x>=0&&q.x<=width&&q.y>=48&&q.y<=height,`Portable TV cropped at ${width}x${height}: ${JSON.stringify(bounds.points)}`);
  await p.screenshot({path:`shots/console-fallback-frame/${tag}${width}x${height}.png`,timeout:180000});
 }
 await p.keyboard.press('q');await until(()=>!House.gliding&&!House.focused);await p.evaluate(()=>House.act('snes'));await until(()=>RoomTV.open_&&!House.gliding);assert(await p.evaluate(()=>RoomTV.dbg()===fallbackInstance));assert.deepEqual(errors,[]);
 console.log(tag+'FALLBACK FRAME PASS: whole physical TV in six sizes, same cartridge, native Q and resume');
}finally{await f.browser.close()}
