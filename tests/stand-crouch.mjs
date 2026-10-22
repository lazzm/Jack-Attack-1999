import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2]);
await mkdir('shots/stand-crouch',{recursive:true});
try{
 for(const width of [1366,390]){
  await page.setViewportSize({width,height:width===390?844:860});
  for(const yaw of [730,-725]){
   await view([40,-55,155],[-15,-24,0]);
   await page.evaluate(yaw=>{House._.setMode('walk');House.P.ry=yaw;House.sitDown()},yaw);
   await until(()=>House.mode==='monitor');
   await page.evaluate(()=>{window.standFrames=[];window.recordStand=true;const frame=()=>{standFrames.push({...House.P,mode:House.mode});if(recordStand)requestAnimationFrame(frame)};frame()});
   await page.keyboard.press(yaw>0?'q':'F2');
   await page.waitForTimeout(300);await page.screenshot({path:`shots/stand-crouch/${width}-${yaw}-moving.png`});
   await until(()=>House.mode==='walk');await page.waitForTimeout(200);
   const frames=await page.evaluate(()=>{recordStand=false;return standFrames});
   const turn=frames.slice(1).reduce((n,p,i)=>n+Math.abs(p.ry-frames[i].ry),0);
   assert(turn<=180.1,`Excessive stand-up turn: ${turn}`);
   assert(Math.abs(((frames.at(-1).ry-yaw)%360+540)%360-180)<.01);
   assert.equal(await page.evaluate(()=>House.gliding),false);
   console.log(width,yaw,'turn',turn);
  }
  await page.keyboard.press('Escape');await page.locator('[name=crouchToggle]').check();
  await page.screenshot({path:`shots/stand-crouch/${width}-settings.png`});
  await page.keyboard.press('Escape');await page.waitForTimeout(500);
  const upright=await page.evaluate(()=>House.P.y);
  await page.keyboard.press('c');await page.waitForTimeout(900);
  assert((await page.evaluate(()=>House.P.y))-upright>30,'Toggle crouch did not persist on release');
  await page.keyboard.press('c');await page.waitForTimeout(900);
  assert(Math.abs((await page.evaluate(()=>House.P.y))-upright)<1,'Second press did not stand');
  await page.keyboard.press('Escape');await page.locator('[name=crouchToggle]').uncheck();await page.keyboard.press('Escape');
  await page.keyboard.down('c');await page.waitForTimeout(900);
  assert((await page.evaluate(()=>House.P.y))-upright>30,'Hold crouch failed');
  await page.keyboard.up('c');await page.waitForTimeout(900);
  assert(Math.abs((await page.evaluate(()=>House.P.y))-upright)<1,'Release did not stand');
  await page.screenshot({path:`shots/stand-crouch/${width}-room.png`});
 }
 await page.evaluate(()=>House.crouchSetting(true));await page.reload({waitUntil:'domcontentloaded'});
 await until(()=>AccountGate.allowed&&House.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await page.evaluate(()=>House.crouchSetting()),true);
 assert.deepEqual(errors,[]);console.log('PASS: shortest-path stand-up, hold/toggle crouch, saved preference, desktop/narrow; no console errors/warnings');
}finally{await browser.close()}
