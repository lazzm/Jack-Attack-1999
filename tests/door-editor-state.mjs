import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const before=process.argv.includes('--before'),tag=before?'before':'after';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2]);
await mkdir('shots/door-editor',{recursive:true});
try{
 await until(()=>!!House.DOORS.bedroom.pivot.userData.ed?.key);
 await view([200,-55,190],[243,-30,190]);
 await page.evaluate(()=>{const d=House.DOORS.bedroom,p=d.pivot,key=p.userData.ed.key,v={x:p.position.x,y:p.position.y,z:p.position.z,rx:0,ry:96,rz:0};localStorage.setItem('jhp_god_edits',JSON.stringify({[key]:{now:v,original:{...v,ry:0}}}));House._.setMode('walk');House.saveWalkState()});
 await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));await page.waitForTimeout(1000);
 await view([200,-55,190],[243,-30,190]);
 const state=await page.evaluate(()=>{const d=House.DOORS.bedroom;return{open:d.open,angle:d.ang,visibleDegrees:d.pivot.rotation.y*180/Math.PI,landing:House.ROOMS.landing.group.visible}});
 await page.screenshot({path:'shots/door-editor/'+tag+'-closed.png'});console.log(tag,state);
 assert.equal(state.open,false);assert.equal(state.angle,0);assert.equal(state.landing,false);
 if(before)assert(Math.abs(state.visibleDegrees)>90,'Stale saved hinge did not reproduce');
 else{
  assert.equal(state.visibleDegrees,0,'Editor replay opened a logically closed door');
  await page.evaluate(()=>House.act('door'));await until(()=>House.DOORS.bedroom.open&&House.DOORS.bedroom.ang===1);assert(await page.evaluate(()=>House.ROOMS.landing.group.visible));
  await page.screenshot({path:'shots/door-editor/after-open.png'});
  for(let i=0;i<6;i++){await page.evaluate(()=>House.act('door'));await page.waitForTimeout(90)}await page.waitForTimeout(850);
  assert(await page.evaluate(()=>{const d=House.DOORS.bedroom;return d.open&&d.ang===1&&Math.abs(d.pivot.rotation.y-d.swing*Math.PI/180)<.001}));
  await page.evaluate(()=>House.setDoor('bedroom',false));await until(()=>House.DOORS.bedroom.ang===0&&!House.anims.has('door:bedroom'));assert.equal(await page.evaluate(()=>House.DOORS.bedroom.pivot.rotation.y),0);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'shots/door-editor/after-narrow-closed.png'});
 }
 assert.deepEqual(errors,[]);console.log('PASS:',tag,'saved editor hinge replay and logical door state');
}finally{await browser.close()}
