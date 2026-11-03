import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base = process.argv[2], tag = process.argv[3] || 'after', out = 'tests/shots/fixes4/';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
await mkdir(out, {recursive:true});
const name = 'BootQA' + Date.now().toString(36), pass = 'Temporary-1999';
for (const [url,body] of [['register',{name,pass}],['fixes4-checkpoint',{name}]]) {
  const res = await fetch(base+'/admin/'+url,{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify(body)}); assert.equal(res.status,200);
}
const f = await roomFixture(base,{account:name,password:pass,signup:false,opening:true,hour:14,debug:true,onPage:async p=>p.addInitScript(()=>{Date.prototype.getMonth=()=>10;Date.prototype.getDate=()=>3;const timer=setInterval(()=>{if(window.House?.live&&House.ren){House.ren.setPixelRatio(.65);House.dirty();clearInterval(timer)}},200);})});
const p=f.page;
const shot=async name=>{await p.evaluate(()=>{House.ren.setPixelRatio(1);House.dirty()});await p.screenshot({path:out+name+'.png'});await p.evaluate(()=>{House.ren.setPixelRatio(.65);House.dirty()})};
const state=()=>({present:House.ROOMS.drive.car.present,boot:House.ROOMS.drive.carBoot.open,pose:[House.W.x,House.W.z,House.W.lvl],objective:st.current()?.id,parts:['tower','monitor','keys','speakers'].map(k=>{const t=House.THINGS['st.pc.'+k];return {visible:t.obj.visible,away:House.isAway(t),grab:t.canGrab()}})});
try {
  await f.until(()=>!!window.StoryOpening?.built&&!!window.HouseFamily?.ready);
  const cf=await p.evaluate(()=>House.ROOMS.drive.carFrame);
  await f.view([cf.x,195,cf.z-285],[cf.x,270,cf.z-150],{level:'G'});
  await p.evaluate(()=>{House._.setMode('walk');HousePause.close();HouseFamily.debug.clock({md:1103,dow:3,t:14});if(!House.ROOMS.drive.carBoot.open)House.act('st.boot');});
  await f.until(()=>!!st.getState().done.boot&&House.ROOMS.drive.carBoot.hinge.rotation.x < -1.2);
  await p.keyboard.down('w');try {await f.until(()=>House.W.z>House.ROOMS.drive.carFrame.z-237);} finally {await p.keyboard.up('w');}
  await p.waitForTimeout(700);await p.evaluate(()=>House.saveWalkState());
  const before=await p.evaluate(state);console.log('BEFORE',JSON.stringify(before));
  await shot('r193-'+tag+'-pre-refresh');
  await p.reload({waitUntil:'domcontentloaded'});
  await f.until(()=>!!window.AccountGate?.allowed&&!!window.StoryOpening?.built&&!!window.HouseFamily?.ready&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
  await p.waitForTimeout(800);
  const after=await p.evaluate(state);console.log('AFTER',JSON.stringify(after));
  await shot('r193-'+tag+'-post-refresh');
  assert.equal(after.present,true,'Refresh hid the story car');assert.equal(after.boot,true,'Refresh closed the boot');assert.deepEqual(after.pose,before.pose,'Refresh moved the player');assert.deepEqual(after.parts,before.parts,'Refresh hid the uncollected parts');
  // Old stuck saves can also have an absent cached Dad and no arrival/home-day
  // marker. Recover the same pose through a real second reload, with no movement.
  await p.evaluate(()=>{HouseFamily.chars.dad.present=false;HouseFamily.debug.save();localStorage.removeItem('jhp_np_dadhome');House.saveWalkState();});
  await p.reload({waitUntil:'domcontentloaded'});
  await f.until(()=>!!window.AccountGate?.allowed&&!!window.StoryOpening?.built&&!!window.HouseFamily?.ready&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
  const recovered=await p.evaluate(state);console.log('RECOVERED',JSON.stringify(recovered));assert.deepEqual(recovered,after,'Old stuck save did not recover itself');
  assert.equal(await p.evaluate(()=>!!HouseFamily.chars.dad.present),true,'Story Dad was lost to the work routine');
  const target=await p.evaluate(()=>{const t=House.THINGS['st.pc.tower'],v=new House.T.Box3().setFromObject(t.obj).getCenter(new House.T.Vector3());const P=House.P;P.rx=Math.atan2(v.y+P.y,Math.hypot(v.x-P.x,v.z-P.z))*180/Math.PI;P.ry=Math.atan2(v.x-P.x,-(v.z-P.z))*180/Math.PI;House.dirty();return House.pick(innerWidth/2,innerHeight/2)?.spot});
  console.log('Native pickup target',target);await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),'st.pc.tower','Native E failed after refresh');
  await shot('r193-'+tag+'-native-E');
  await p.evaluate(async()=>{House.putBack();if(House.ROOMS.drive.carBoot.open)House.act('st.boot');House.saveWalkState();await Roam.syncNow();});
  await writeFile('/tmp/fixes4-story-browser.json',JSON.stringify(await p.context().storageState()));
  assert.deepEqual(f.errors,[]);console.log('FIXES4 BOOT PASS');
} finally {await f.browser.close();}
