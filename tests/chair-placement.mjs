import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until,view}=await roomFixture(process.argv[2]||'http://localhost:18461');
try{
 for(const [width,height,size] of [[1366,860,'desktop'],[390,844,'narrow']]){
  await p.setViewportSize({width,height});
  for(const [name,target,key] of [
   ['level',[-100,-55,145],'e'],['floor',[-100,73,145],'e'],
   ['near-feet',[-100,73,180],'e'],['desk-chair',[-15,73,95],'e'],['steep',[-60,73,210],'click']]){
   await view([-90,-55,215],target);await p.evaluate(()=>{House.hush();House._.setMode('walk');House.grab('chair')});
   if(name==='steep')await p.keyboard.press('r');
   await p.waitForTimeout(500);
   const preview=await p.evaluate(()=>House.placement());assert(preview?.target,`${name}: expected a green placement footprint`);
   if(name==='desk-chair'){assert(Math.abs(preview.target.x+15)<1&&Math.abs(preview.target.z-95)<1);await p.screenshot({path:`shots/chair-preview-${size}.png`})}
   if(size==='desktop')assert((await p.locator('.hs-hkeys').innerText()).includes('E / Click: place'));
   if(key==='click')await p.mouse.click(width/2,height/2);else await p.keyboard.press(key);
   assert.equal(await p.evaluate(()=>House.held()),null,`${size} ${name} rejected a clear-floor drop`);
   await until(()=>House.THINGS.chair.st==='rest');
   const placed=await p.evaluate(()=>{const t=House.THINGS.chair;return{at:t.at,rx:t.obj.rotation.x,rz:t.obj.rotation.z,blocks:!House._.floorAt(t.at.x,t.at.z,'U',73),playerClear:!!House._.floorAt(House.W.x,House.W.z,'U',73),player:[House.W.x,House.W.z]}});
   console.log(size,name,placed);
   assert.equal(placed.at.y,73);assert(placed.blocks);assert(placed.playerClear);assert(Math.abs(placed.rx)<.001&&Math.abs(placed.rz)<.001);
   assert(Math.abs(placed.at.x-preview.target.x)<1&&Math.abs(placed.at.z-preview.target.z)<1,'Drop differs from placement preview');
   await view([-165,-20,230],[placed.at.x,30,placed.at.z]);await p.screenshot({path:`shots/chair-place-${size}-${name}.png`});
  }
  // Safety rules still reject furniture on the PC approach, not just at feet.
  await view([-10,-55,160],[-10,73,60]);await p.evaluate(()=>{House.hush();House._.setMode('walk');House.grab('chair')});await p.waitForTimeout(400);await p.keyboard.press('e');
  assert.equal(await p.evaluate(()=>House.held()),'chair','Chair blocked the monitor approach');
  await p.keyboard.press('Escape');await p.locator('.hs-pause [data-pause=return]').click();await until(()=>House.THINGS.chair.st==='rest');
 }
 const before=await p.evaluate(()=>{House.saveThings(true);return House.THINGS.chair.at});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House?.live&&House.THINGS?.chair&&!document.querySelector('.hs-loading,#houseEntry'));
 const after=await p.evaluate(()=>House.THINGS.chair.at);for(const key of ['x','y','z','ry'])assert(Math.abs(after[key]-before[key])<=.51,'Refresh changed chair '+key);
 assert.deepEqual(errors,[]);
 console.log('CHAIR PLACEMENT PASS: E/click, near-feet/steep/level aims, rotation, floor contact, walking collision, PC protection, menu return and refresh at desktop/narrow sizes');
}finally{await browser.close()}
