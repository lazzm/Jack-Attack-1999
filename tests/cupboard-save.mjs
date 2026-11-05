// Load real PV11 records through the account/house restore path on disposable data.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],name='CupSave'+Date.now().toString(36),pass='Throwaway-1999';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass})})).ok);
const standing={pv:11,x:370,y:241,z:275,rx:0,ry:180,lvl:'G',seat:0,d:{cupboard:true}};
const seed={pv:11,t:{cube:['cupboard',380,309,315,20,0,0,{keep:'chest'}],'media.box.sn.zero':['cupboard',385,353,370,90,'media.sn.slot.0',0],'cup.unknown':['cupboard',370,353,275,17,0,0,{keep:'unbuilt'}]},o:{drawer:0}};
const dir=new URL('./shots/cupboard/save/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const f=await roomFixture(base,{account:name,password:pass,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,pass,name,standing),storage:{'jhp_gs_hs.things':{f:1,v:1,t:Date.now(),s:seed},'jhp_gs_media.cases':{f:1,v:1,t:Date.now(),s:{parks:{'console.sn':{room:'cupboard',x:379,y:353,z:345,ry:0,keep:'park'}}}}}}),p=f.page;
try{
 await f.until(()=>!!House.THINGS.cube?.body);await p.evaluate(()=>{HouseFamily.debug.hide(true);House.saveThings(true)});
 const snapshot=()=>p.evaluate(()=>({mode:House.mode,pose:{x:House.W.x,z:House.W.z},door:House.DOORS.cupboard.open,things:Apps.loadGame('hs.things',1),park:House.SNAPS['case.park.console.sn']?.pose,power:localStorage.getItem('jhp_off')}));
 const a=await snapshot();assert.equal(a.things.pv,12);assert.equal(a.pose.x,370);assert.equal(a.pose.z,337);assert.equal(a.door,true);assert.equal(a.mode,'walk');assert.equal(a.things.t.cube[3],288);assert.equal(a.things.t['cup.unknown'][3],337);assert.equal(a.things.t['cup.unknown'][7].keep,'unbuilt');assert.equal(a.things.t['media.box.sn.zero'][5],'media.sn.slot.0');assert.equal(a.things.t['media.box.sn.zero'][3],370);
 assert(a.park);assert.equal(a.park.x,397);assert.equal(a.park.z,311);assert.equal(a.park.keep,'park');
 for(let i=0;i<2;i++){
  await p.evaluate(()=>House.saveWalkState());await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>!!(window.House?.live&&AccountGate.allowed&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry')));await p.evaluate(()=>Room.ensureHouse());await f.until(()=>!!window.HouseRooms?.ready);await p.evaluate(()=>{HouseFamily.debug.hide(true);House.saveThings(true)});
  const b=await snapshot();assert.deepEqual(b.pose,a.pose);assert.equal(b.mode,a.mode);assert.equal(b.door,true);assert.equal(b.power,a.power);for(const id of Object.keys(seed.t))assert.deepEqual(b.things.t[id],a.things.t[id],id+' changed on refresh');assert.deepEqual(b.park,a.park);await p.screenshot({path:dir+'refresh-'+i+'.png'});
 }
 await writeFile(dir+'report.json',JSON.stringify(a,null,2));assert.deepEqual(f.errors,[]);console.log('CUPBOARD OLD SAVE PASS: PV11 standing, supported item, unbuilt item, rack slot, retained parking metadata, open door and two exact refreshes');
}finally{await f.browser.close()}
