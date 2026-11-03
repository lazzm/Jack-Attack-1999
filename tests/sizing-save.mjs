// A real pre-extension save, lazy room build, then exact repeated refresh.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=new URL('./shots/sizing/after/',import.meta.url).pathname;await mkdir(shots,{recursive:true});
const seed={pv:9,t:{cube:['garden',40,353,-100,25,0,0],washing:['garden',-90,353,-150,45,0,0],'test.counter':['kitchen',-174,260,-18,17,0,0,{keep:'counter'}],'test.table':['kitchen',-60,277,170,23,0,0],'test.patio':['garden',40,353,-100,75,0,0],'test.lid':['garden',160,238,-190,10,0,0],'test.lawn':['garden',20,353,-400,9,0,0],'test.basket':['garden',-90,353,-150,45,0,0,{job:'keep'}]},o:{'test.drawer':1}};
const account='Rear'+Date.now().toString(36);assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:'Throwaway-1999'})})).ok);
const jobs={day:new Date().toISOString().slice(0,10),at:{'test.basket':['garden',-90,353,-150,45,0,{job:'keep'}],'test.plate':['kitchen',-201,260,-4,0,0]},prog:{washup:{plug:123456}},done:{},v:{wash:{sc:{0:2},inn:-1}},ever:{washup:1}};
const f=await roomFixture(base,{account,signup:false,storage:{'jhp_gs_hs.things':{f:1,v:1,t:Date.now(),s:seed},'jhp_gs_ch':{f:1,v:1,t:Date.now(),s:jobs}}});
try{
 const p=f.page;await p.evaluate(()=>{for(const r of Object.values(House.ROOMS))House.buildRoom(r);House.saveThings(true)});await p.evaluate(async()=>{await Chores.load();await Chores.part('kitchen')});await f.until(()=>!!window.ChoreKit?.MODS.washup);await f.until(()=>!!(House.THINGS.cube?.body&&House.THINGS.washing?.body));await p.waitForTimeout(1000);await p.evaluate(()=>{HouseFamily?.debug.hide(true);House.saveThings(true)});
 const geometry=await p.evaluate(()=>{
  const H=House,door=H.DOORS.back,old=door.pivot.rotation.y,leaf=[];
  for(let angle=0;angle<=100;angle+=5){door.pivot.rotation.y=angle*Math.PI/180*door.dir;door.pivot.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(door.pivot);leaf.push(b.max.x);}
  door.pivot.rotation.y=old;door.pivot.updateWorldMatrix(true,true);
  const aisle=[];for(let x=-200;x<=150;x+=25)aisle.push(!!H._.floorAt(x,244,'G',353));
  const path=[];for(let z=-1200;z<=-400;z+=25)path.push(!!H._.floorAt(-275,z,'G',353));
  const targets=[[-80,-700],[10,-850],[40,-540],[-180,-1220],[20,-1360]];
  return{leaf,aisle,path,routes:targets.map(([x,z])=>!!NPCNav.route({lvl:'G',x:120,z:-220},{lvl:'G',x,z})),butt:H.REAR.butt.x};
 });
 assert(geometry.leaf.every(x=>x<geometry.butt-27),'Back door crosses the water butt');assert(geometry.aisle.every(Boolean),'South kitchen aisle has an invisible blocker');assert(geometry.path.every(Boolean),'Shed path is not walkable');assert(geometry.routes.every(Boolean),'A family/garden destination is unreachable');
 const first=await p.evaluate(()=>Apps.loadGame('hs.things',1));assert.equal(first.pv,10);const physical=await p.evaluate(()=>({cube:{...House.THINGS.cube.at},basket:{...House.THINGS.washing.at}}));assert.equal(physical.cube.room,'garden');assert.equal(physical.cube.z,-220);assert.equal(physical.basket.z,-270);assert(Math.abs(physical.basket.y-352.7)<.2,'Basket must rest on the new patio');
 for(const [id,x,z]of [['counter',-174,-138],['table',-60,110],['patio',40,-220],['lid',370,-280],['lawn',20,-400],['basket',-90,-270]]){assert.equal(first.t['test.'+id][1],x);assert.equal(first.t['test.'+id][3],z)}
 const migratedJobs=await p.evaluate(()=>JSON.parse(JSON.stringify(ChoreKit.S)));assert.equal(migratedJobs.pv,10);assert.equal(migratedJobs.at['test.basket'][3],-270);assert.equal(migratedJobs.at['test.plate'][3],-124);assert.equal(migratedJobs.prog.washup.plug,123456);assert.equal(migratedJobs.v.wash.sc[0],2);assert.equal(migratedJobs.ever.washup,1);
 assert.equal(first.t['test.basket'][7].job,'keep');assert(first.o['test.drawer']);await f.view([-80,210,-210],[-90,320,-270],{level:'G'});await p.screenshot({path:shots+'old-save-basket.png'});const power=await p.evaluate(()=>localStorage.getItem('jhp_off'));
 // Standing just outside the old back door must remain outdoors after the one-time migration.
 await p.evaluate(()=>{const old={x:120,y:210,z:-100,rx:0,ry:0,seat:0,lvl:'G',d:{back:false},t:Date.now()};localStorage.setItem('jhp_hs_pose',JSON.stringify(old));localStorage.setItem('jhp_hs_stand',JSON.stringify({t:Date.now(),p:old}));House._.setMode('focus')});
 for(let pass=0;pass<2;pass++){
 await p.reload({waitUntil:'domcontentloaded'});await f.until(()=>!!(window.House?.live&&window.AccountGate?.allowed&&!document.querySelector('.hs-loading,#houseEntry')));
 await p.evaluate(()=>Room.ensureHouse());await f.until(()=>!!window.HouseRooms?.ready);
 await f.until(()=>House.mode==='walk');await p.evaluate(()=>HouseFamily?.debug.hide(true));
 assert.equal(await p.evaluate(()=>House.here),'garden');assert(Math.abs(await p.evaluate(()=>House.W.z)+220)<.1);
 await p.evaluate(()=>House.saveThings(true));const next=await p.evaluate(()=>Apps.loadGame('hs.things',1));
 for(const id of Object.keys(seed.t))assert.deepEqual(next.t[id],first.t[id],id+' moved on refresh');assert.equal(await p.evaluate(()=>House.DOORS.back.open),false);assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),power);await p.screenshot({path:shots+'save-refresh-'+pass+'.png'});
 }
 assert.deepEqual(f.errors,[]);console.log('SIZING SAVE PASS: old counter/table/patio/lid/basket, metadata, outdoors standing state, shut back door and two refreshes');
}finally{await f.browser.close()}
