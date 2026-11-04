// Real PV10 placement load, physical bodies and two ordinary token-resume refreshes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {workBed} from './bed-actions.mjs';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const account='S3Save'+Date.now().toString(36),pass='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass})})).ok);
const seed={pv:10,t:{cube:['bedroom',74,0,28,25,0,0,{keep:'edge'}],beanbag:['bedroom',-100,73,56,-135,0,0],chair:['bedroom',-35,73,45,180,0,0,{sw:42}],'test.drawer':['bedroom',56,10,0,19,0,0,{keep:'drawer'}],'test.tower':['bedroom',17,-42.3,-30,0,0,0],'test.garden':['garden',20,353,-400,0,0,0],'test.slot':['bedroom',74,0,28,0,'fixed-slot',0]},o:{drawer:0}};
const standing={pv:10,x:100,y:-70,z:170,rx:0,ry:0,lvl:'U',seat:0};
const dir=new URL('./shots/sizing3/save/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const f=await roomFixture(base,{account,password:pass,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,pass,account,standing),storage:{'jhp_gs_hs.things':{f:1,v:1,t:Date.now(),s:seed}}});
try{
 const p=f.page;
 await f.until(()=>!!(House.THINGS.cube?.body&&House.THINGS.beanbag?.body&&House.THINGS.chair?.body&&!House.THINGS.cube._placementMoved));
 await f.until(()=>House.physics.awake===0);
 await p.evaluate(()=>{HouseFamily.debug.hide(true);House.saveThings(true)});
 const snapshot=()=>p.evaluate(()=>({things:structuredClone(Apps.loadGame('hs.things',1)),bodies:Object.fromEntries(['cube','beanbag','chair'].map(id=>[id,{at:{...House.THINGS[id].at},overlap:House.physics.world.overlapping(House.physics.body(id))}])),power:localStorage.getItem('jhp_off'),pose:{x:House.W.x,z:House.W.z,mode:House.mode},door:House.DOORS.bedroom.open}));
 const first=await snapshot();assert.equal(first.things.pv,11);assert(Math.abs(first.bodies.cube.at.x)<=56);assert(first.bodies.cube.at.z>=-54&&first.bodies.cube.at.z<=18);assert(first.bodies.cube.at.y<=0&&first.bodies.cube.at.y>=-15);assert(Math.hypot(first.bodies.beanbag.at.x+116,first.bodies.beanbag.at.z-82)<=45,'Beanbag clearance moved more than 45 cm');assert.equal(first.bodies.beanbag.at.y,73);assert.equal(first.bodies.chair.at.room,'bedroom');assert.equal(first.bodies.chair.at.x,-35);assert.equal(first.bodies.chair.at.z,45);
 assert.equal(first.things.t.chair[7].sw,42);assert.deepEqual(first.things.t['test.drawer'],['bedroom',52,10,-13,19,0,0,{keep:'drawer'}]);assert.equal(first.things.t['test.tower'][2],-42.3);assert.equal(first.things.t['test.slot'][5],'fixed-slot');assert.equal(first.things.t['test.garden'][3],-400);
 assert.equal(first.pose.x,100);assert.equal(first.pose.z,170);assert.equal(first.pose.mode,'walk');assert.equal(first.door,false);
 for(const [id,b]of Object.entries(first.bodies))assert(!b.overlap,id+' overlaps '+b.overlap);
 await p.screenshot({path:dir+'old-save.png'});
 const refreshes=Number(process.env.SIZING3_REFRESHES ?? 2);
 for(let i=0;i<refreshes;i++){
  await p.evaluate(()=>{House.saveWalkState();House.saveThings(true)});
  await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>!!(window.House?.live&&window.AccountGate?.allowed&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry')));
  await p.evaluate(()=>Room.ensureHouse());await f.until(()=>!!window.HouseRooms?.ready);await f.until(()=>House.physics.awake===0);await p.evaluate(()=>{HouseFamily.debug.hide(true);House.saveThings(true)});
  const next=await snapshot();for(const id of Object.keys(seed.t))assert.deepEqual(next.things.t[id],first.things.t[id],id+' changed on refresh');assert.deepEqual(next.pose,first.pose);assert.equal(next.power,first.power);assert.equal(next.door,false);
  await p.screenshot({path:dir+'refresh-'+i+'.png'});
 }
 // The relocated drawer remains a real sliding drawer; reversing it and pausing mid-motion leaves it usable.
 await f.view([90,-70,105],[52,8,18]);await p.evaluate(()=>{House.toggle('drawer');House.toggle('drawer');House.toggle('drawer')});await p.waitForTimeout(1200);
 await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.evaluate(()=>House.OPEN.drawer.open&&House.toggle('drawer'));await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>House.OPEN.drawer.open),false);
 await p.evaluate(()=>{HousePause.close();House._.setMode('walk');House.act('posterrobot')});await f.until(()=>!!(House.focused&&House.mode==='focus'));await p.screenshot({path:dir+'a1-poster-close.png'});await p.keyboard.press('q');await f.until(()=>!House.focused&&!House.gliding);
 await p.evaluate(()=>ChoreKit.begin('bed'));
 for(const [id,sid]of [['ch.pillow','ch.s.pillow'],['ch.pjs','ch.s.pjs']]){
  const target=await p.evaluate(sid=>House.SNAPS[sid].pose,sid);
  await f.view([110,-70,0],[target.x,target.y,target.z]);await p.evaluate(()=>{House._.setMode('walk');House.hush()});assert(await p.evaluate(id=>House.grab(id),id));
  let placed=false;
  for(let n=0;n<15;n++){
   if(await p.evaluate(sid=>House.ghost()?.snap?.id===sid,sid)){await p.keyboard.press('e');placed=true;break}
   await p.keyboard.press('+');
  }
  assert(placed,'No gold pillow/bedding target: '+id);await f.until(id=>!House.held()&&House.THINGS[id].st!=='anim',id);
  if(id==='ch.pillow'){await workBed(p,['pillow']);assert.equal(await p.evaluate(()=>House.THINGS['ch.pillow'].at.z),-24)}
 }
 assert.equal(await p.evaluate(()=>ChoreKit.has('bed','pjs')),true);
 assert.equal(await p.evaluate(()=>House.THINGS['ch.pjs'].at.y),24.9);
 await f.view([95,-70,65],[190,24,-24]);await p.screenshot({path:dir+'full-size-pillow-folded-pjs.png'});
 await writeFile(dir+'report.json',JSON.stringify({first,errors:f.errors},null,2));assert.deepEqual(f.errors,[]);
 console.log('SIZING3 SAVE PASS ('+refreshes+' refreshes): PV10 desk/drawer/beanbag + real bodies, custom chair/swivel, slot/metadata, standing + PC power + shut door, two exact refreshes; drawer reversals/Esc; A1 close-up; real gold E pillow/pyjamas placements and bed work');
}finally{await f.browser.close()}
