// Saved placements follow geometry once; this runs the production migration without a browser or user data.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const start=source.indexOf('  const PV = '),end=source.indexOf('  function saveThings(',start);
assert(start>=0&&end>start,'Production placement migration is present');
const ms=source.indexOf('  function migrateSave(save)'),me=source.indexOf('  // Placements saved before the physics pass',ms);
const {PV,FRONT,migratePlacement:move,migrateSave}=vm.runInNewContext(source.slice(start,end)+source.slice(ms,me)+';({PV,FRONT,migratePlacement,migrateSave})',{LV:{G:353,U:73},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
assert.equal(PV,12,'Latest migration version must be stamped into saves');
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);
for(const from of [3,4,5]){
 const old=from===3?FRONT.CAR3:FRONT.CAR4;
 const a={room:'drive',x:old.x+20,y:301,z:old.z-160,ry:45,hide:false};
 assert(move(a,from));near(a.x,FRONT.CAR.x+20);near(a.z,FRONT.CAR.z-160);near(a.y,301);assert.equal(a.ry,45);
 const once=JSON.stringify(a);assert(!move(a,PV));assert.equal(JSON.stringify(a),once,'A repeated load moved an item twice');
}
for(const from of [0,1,2]){
 const old=FRONT.OLD_CAR,a={room:'drive',x:old.x+10*old.s,y:353-50*old.s,z:old.z-160*old.s};
 assert(move(a,from));near(a.x,FRONT.CAR.x+10*FRONT.CAR.s);near(a.z,FRONT.CAR.z-160*FRONT.CAR.s);near(a.y,353-50*FRONT.CAR.s);
}
const roof={room:'drive',x:FRONT.CAR3.x,y:353-133.5*FRONT.CAR3.s,z:FRONT.CAR3.z};
assert(move(roof,3));near(roof.y,353-126.9*FRONT.CAR.s);near(roof.x,FRONT.CAR.x);near(roof.z,FRONT.CAR.z);
const ground={room:'drive',x:FRONT.CAR.x,y:353,z:FRONT.CAR.z+200};assert(move(ground,3));assert(ground.x<FRONT.CAR.x-100*FRONT.CAR.s);near(ground.y,353);
const hedge={room:'drive',x:-100,y:353,z:1340};assert(move(hedge,3));assert(hedge.z<FRONT.HEDGE[0]-15);
const sofa={room:'lounge',x:-60,y:308,z:560,ry:20};assert(move(sofa,3));near(sofa.x,-60);near(sofa.z,605);near(sofa.y,308);assert.equal(sofa.ry,20);
const chair={room:'lounge',x:110,y:308,z:430,ry:10};assert(move(chair,3));near(chair.x,136);near(chair.z,400);near(chair.y,308);near(chair.ry,18);
const underSofa={room:'lounge',x:0,y:353,z:620};assert(move(underSofa,3));assert(underSofa.z<560);near(underSofa.y,353);
for(const a of [null,{room:'bedroom',x:20,y:73,z:100},{room:'drive',x:-200,y:353,z:900},{room:'drive',x:-100,y:353,z:1260},{room:'lounge',x:-200,y:353,z:450},{room:'drive',x:NaN,y:353,z:900}]){
 const saved=JSON.stringify(a);assert(!move(a,3));assert.equal(JSON.stringify(a),saved,'An unrelated placement changed');
}
for(const a of [sofa,chair,underSofa,ground,hedge,roof]){const saved=JSON.stringify(a);assert(!move(a,PV));assert.equal(JSON.stringify(a),saved)}
const record={pv:3,t:{chair:['lounge',110,308,430,10,0,0,{keep:true}],unbuilt:['bedroom',20,73,100,45,0,1,{sw:80}]},o:{drawer:1}};
migrateSave(record);assert.equal(record.pv,PV);assert.deepEqual(Array.from(record.t.chair),['lounge',136,308,400,18,0,0,{keep:true}]);assert.deepEqual(record.t.unbuilt,['bedroom',20,73,100,45,0,1,{sw:80}]);const stored=JSON.parse(JSON.stringify(record));delete stored.pv0;const snapshot=JSON.stringify(stored.t);migrateSave(stored);assert.equal(JSON.stringify(stored.t),snapshot);assert.equal(stored.o.drawer,1);
console.log('PLACEMENT MIGRATION PASS: versions 0..8, boot/roof/floor/hedge, sofa/chair, unrelated poses and repeated loads');

for(let from=0;from<7;from++){const a={room:'bedroom',x:-94,y:73,z:224,ry:15};assert(move(a,from));assert.equal(a.x,-38);assert.equal(a.z,224);assert.equal(a.y,73);assert.equal(a.ry,15);assert(!move(a,7));}
for(const a of [{room:'bedroom',x:-94,y:0,z:224},{room:'bedroom',x:-140,y:73,z:224},{room:'bedroom',x:-94,y:73,z:180}]){const before=JSON.stringify(a);assert(!move(a,6));assert.equal(JSON.stringify(a),before)}

const treeSave={pv:6,t:{floor:['bedroom',-94,73,224,10,0,0,{keep:true}],raised:['bedroom',-94,0,224,0,0,0]}};migrateSave(treeSave);assert.deepEqual(Array.from(treeSave.t.floor),['bedroom',-38,73,224,10,0,0,{keep:true}]);assert.equal(treeSave.t.raised[1],-94);
for(const a of [sofa,underSofa,ground,hedge,roof]){const before=JSON.stringify(a);assert(!move(a,6));assert.equal(JSON.stringify(a),before,'PV7 repeated an earlier furniture move')}

// PV8 carries raised table/chair items once, keeps hidden/snapped records and safely clears new floor coverage.
for(let from=0;from<8;from++){
 const a={room:'lounge',x:-60,y:309.5,z:450,ry:15};assert(move(a,from));near(a.x,-72);near(a.z,456.5);near(a.y,309.5);assert.equal(a.ry,15);assert(!move(a,8));
}
for(const from of [5,6,7]){const a={room:'lounge',x:115,y:308,z:397,ry:-110};assert(move(a,from));near(a.x,141);near(a.z,402);assert.equal(a.ry,-110);assert(!move(a,8));}
for(const [x,z]of [[185,430],[-115,455]]){const a={room:'lounge',x,y:353,z,ry:25};assert(move(a,7));near(a.x,50);near(a.z,520);assert.equal(a.ry,25);assert(!move(a,8));}
for(const a of [{room:'lounge',x:-60,y:353,z:520},{room:'lounge',x:-60,y:353,z:450},{room:'lounge',x:110,y:308,z:395,hide:true}]){const before=JSON.stringify(a);assert(!move(a,7));assert.equal(JSON.stringify(a),before)}
const current={pv:7,t:{table:['lounge',-60,309.5,450,15,0,0,{keep:'table'}],chair:['lounge',115,308,397,-110,0,0],hidden:['lounge',110,308,395,0,0,1,{keep:'hidden'}],snapped:['lounge',110,308,395,0,'ch.s.cush3',0,{keep:'slot'}]},o:{'hall.front':1}};
migrateSave(current);assert.equal(current.pv,PV);assert.deepEqual(Array.from(current.t.table),['lounge',-72,309.5,456.5,15,0,0,{keep:'table'}]);assert.deepEqual(Array.from(current.t.chair),['lounge',141,308,402,-110,0,0]);assert.deepEqual(current.t.hidden,['lounge',110,308,395,0,0,1,{keep:'hidden'}]);assert.deepEqual(current.t.snapped,['lounge',110,308,395,0,'ch.s.cush3',0,{keep:'slot'}]);assert.equal(current.o['hall.front'],1);
const again=JSON.parse(JSON.stringify(current));delete again.pv0;const stable=JSON.stringify(again);migrateSave(again);delete again.pv0;assert.equal(JSON.stringify(again),stable,'PV8 repeated a furniture move');
console.log('PV8 lounge PASS: historical chain, table/chair/floor, hidden/slot metadata and repeat loads');

// PV9 follows only the corrected lid/rims, with hidden/slot metadata preserved.
for(const [x,z,old,now]of [[0,-160,79,81.5],[-85,-160,75,79.5],[85,-160,75,79.5],[0,-201,73,79.5]]){
 const a={room:'drive',x:FRONT.CAR.x+x*FRONT.CAR.s,z:FRONT.CAR.z+z*FRONT.CAR.s,y:FRONT.CAR.y-old*FRONT.CAR.s,ry:20};assert(move(a,8));near(a.y,FRONT.CAR.y-now*FRONT.CAR.s);assert.equal(a.ry,20);const once=JSON.stringify(a);assert(!move(a,9));assert.equal(JSON.stringify(a),once);
}
for(const [x,z,h]of [[0,-160,23],[0,0,126.9],[0,-160,75],[0,170,79],[-85,100,75]]){const a={room:'drive',x:FRONT.CAR.x+x*FRONT.CAR.s,z:FRONT.CAR.z+z*FRONT.CAR.s,y:FRONT.CAR.y-h*FRONT.CAR.s};const before=JSON.stringify(a);assert(!move(a,8));assert.equal(JSON.stringify(a),before)}
const c=FRONT.CAR,hidden={pv:8,t:{hidden:['drive',c.x,c.y-79*c.s,c.z-160*c.s,0,0,1,{keep:true}],slot:['drive',c.x,c.y-79*c.s,c.z-160*c.s,0,'fixed-slot',0,{keep:true}]}};const before=JSON.stringify(hidden.t);migrateSave(hidden);assert.equal(hidden.pv,PV);assert.equal(JSON.stringify(hidden.t),before);
console.log('PV9 CAR PASS: old lid/rims once; exact boot/roof/unrelated/hidden/slot poses preserved');

// PV10: old counter/table supports follow the rear extension; old lawn is retained.
const rear={pv:9,t:{counter:['kitchen',-174,260,-18,17,0,0,{keep:'counter'}],table:['kitchen',-60,277,170,23,0,0],floor:['kitchen',-60,353,100,45,0,0],patio:['garden',40,353,-100,75,0,0],lid:['garden',160,238,-190,10,0,0],lawn:['garden',20,353,-400,9,0,0],snap:['kitchen',-80,271,-26,15,'ch.s.wsink',0,{keep:'slot'}]},o:{back:true}};
migrateSave(rear);assert.equal(rear.pv,PV);
for(const [id,x,z]of [['counter',-174,-138],['table',-60,110],['floor',-205,100],['patio',40,-220],['lid',370,-280],['lawn',20,-400]]){assert.equal(rear.t[id][1],x,id);assert.equal(rear.t[id][3],z,id);}
assert.equal(rear.t.counter[7].keep,'counter');assert.equal(rear.t.snap[5],'ch.s.wsink');assert(rear.o.back);
const rearAgain=JSON.parse(JSON.stringify(rear));delete rearAgain.pv0;const rearExact=JSON.stringify(rearAgain);migrateSave(rearAgain);delete rearAgain.pv0;assert.equal(JSON.stringify(rearAgain),rearExact,'Rear layout moved a save twice');
console.log('PV10 REAR PASS: counter, table, floor, patio, bin lid, retained lawn, slot metadata and repeated load');

// The daily chore save has its own placement records and must migrate before lazy builders restore them.
const choreSource=fs.readFileSync(path.join(__dirname,'../app/public/js/ch-core.js'),'utf8');
const choreCode=choreSource.slice(choreSource.indexOf('  function migrateChorePlacements()'),choreSource.indexOf('  migrateChorePlacements();'));
let saves=0;const choreCtx={H:{migratePlacement:move,placementVersion:PV},save:()=>saves++,S:{at:{basket:['garden',40,353,-100,45,0,{keep:true}],plate:['kitchen',-201,260,-4,7,0]},prog:{washup:{plug:123}},done:{bins:{sc:100,amt:5}},v:{wash:{sc:{0:2}}},t0:{washup:99},ever:{bins:1}}};
const progress=JSON.stringify([choreCtx.S.prog,choreCtx.S.done,choreCtx.S.v,choreCtx.S.t0,choreCtx.S.ever]);vm.createContext(choreCtx);vm.runInContext(choreCode,choreCtx);choreCtx.migrateChorePlacements();assert.equal(choreCtx.S.pv,PV);assert.equal(choreCtx.S.at.basket[3],-220);assert.equal(choreCtx.S.at.plate[3],-124);assert(choreCtx.S.at.basket[6].keep);assert.equal(JSON.stringify([choreCtx.S.prog,choreCtx.S.done,choreCtx.S.v,choreCtx.S.t0,choreCtx.S.ever]),progress);const choreOnce=JSON.stringify(choreCtx.S);choreCtx.migrateChorePlacements();assert.equal(JSON.stringify(choreCtx.S),choreOnce);assert.equal(saves,1);
console.log('DAILY JOB MIGRATION PASS: unbuilt basket/counter records once; flags, partial washing, scores, timers and metadata retained');

for(const [x,z]of [[-60,104],[-60,234],[-136,170],[16,170]]){const item={room:"kitchen",x,y:308,z,ry:15};assert(move(item,9));assert.equal(item.z,z-60);assert.equal(item.y,308);assert.equal(item.ry,15);const once=JSON.stringify(item);assert(!move(item,10));assert.equal(JSON.stringify(item),once)}

for(const [x,z]of [[-275,-450],[-290,-330],[-230,-1220]]){const at={room:"garden",x,y:353,z,ry:11};assert(move(at,9));assert.equal(at.y,352.7);assert.equal(at.x,x);assert.equal(at.z,z);assert(!move(at,10))}

// PV11: a removed desk strip must not leave a hovering item, nor lose drawer contents or metadata.
const bedroom={pv:10,t:{edge:['bedroom',74,0,28,37,0,0,{keep:'edge'}],drawer:['bedroom',56,10,0,19,0,0],beanbag:['bedroom',-100,73,56,-135,0,0],floor:['bedroom',-130,73,100,80,0,0],chair:['bedroom',-15,73,110,180,0,0,{sw:42}],tower:['bedroom',17,-42.3,-30,12,0,0],hidden:['bedroom',74,0,28,0,0,1],slot:['bedroom',74,0,28,0,'kept-slot',0]},o:{drawer:1}};
migrateSave(bedroom);assert.equal(bedroom.pv,PV);
assert.deepEqual(Array.from(bedroom.t.edge),['bedroom',42,0,4,37,0,0,{keep:'edge'}]);
assert.deepEqual(Array.from(bedroom.t.drawer),['bedroom',52,10,-13,19,0,0]);
assert.deepEqual(Array.from(bedroom.t.beanbag),['bedroom',-116,73,82,-135,0,0]);
assert.equal(bedroom.t.floor[3],166);assert.equal(bedroom.t.chair[3],110);assert.equal(bedroom.t.chair[7].sw,42);
assert.equal(bedroom.t.tower[2],-42.3);assert.equal(bedroom.t.hidden[1],74);assert.equal(bedroom.t.slot[5],'kept-slot');assert.equal(bedroom.o.drawer,1);
const bedroomAgain=JSON.parse(JSON.stringify(bedroom));delete bedroomAgain.pv0;const bedroomExact=JSON.stringify(bedroomAgain);migrateSave(bedroomAgain);delete bedroomAgain.pv0;
assert.equal(JSON.stringify(bedroomAgain),bedroomExact,'A second refresh moved bedroom placements');
console.log('PV11 BEDROOM PASS: removed desk edges, open drawer contents, beanbag clearance, moved chair/swivel, PC support, hidden/slot metadata and exact repeat load');
for(const [y,next]of [[37,37],[26,24.9]]){const a={room:'bedroom',x:190,y,z:-33,ry:24};assert(move(a,10));assert.equal(a.z,-24);assert.equal(a.y,next);assert.equal(a.ry,24);assert(!move(a,11));}
for(const [x,z,nx,nz]of [[-56,18,-56,5],[40,24,40,11],[-68,-22,-56,-12]]){const a={room:'bedroom',x,y:0,z,ry:18};assert(move(a,10));assert.equal(a.x,nx);assert.equal(a.z,nz);assert(!move(a,11));}
const caseSource=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-cases.js'),'utf8');
const parkState={parks:{'console.gb':{room:'bedroom',x:-68,y:0,z:-22,ry:7,keep:'case'}}};let parkSaves=0;
const parkCtx={Math,Number,state:()=>parkState,savePark:(id,p)=>{parkState.parks[id]=p;parkSaves++},H:{placementVersion:PV,SNAPS:{},snap:(id,s)=>({...s,id})}};vm.createContext(parkCtx);
vm.runInContext(caseSource.slice(caseSource.indexOf('  function parking('),caseSource.indexOf('  const ease=')),parkCtx);
let anchor=parkCtx.parking('console.gb',{});assert.equal(anchor.pose.x,-56);assert.equal(anchor.pose.z,-12);assert.equal(anchor.pose.ry,7);assert.equal(anchor.pose.keep,'case');
anchor=parkCtx.parking('console.gb',{});assert.equal(anchor.pose.x,-56);assert.equal(parkSaves,1,'Saved empty case parking migrated twice');
console.log('PV11 CASE PARK PASS: persisted Game Lad anchor, rotation/metadata and one-time migration');

// PV12: only newly occupied floor and moved supports in the cupboard move.
const cup={pv:11,t:{chest:['cupboard',380,309,300,20,0,0,{keep:'chest'}],console:['cupboard',352,325,340,15,0,0],floor:['cupboard',370,353,275,25,0,0],aisle:['cupboard',370,353,410,7,0,0],rack:['cupboard',389,353,370,90,'media.sn.slot.1',0],hidden:['cupboard',380,309,300,0,0,1]},o:{cupboard:1}};
migrateSave(cup);assert.equal(cup.pv,12);
assert.deepEqual(Array.from(cup.t.chest),['cupboard',385,309,273,20,0,0,{keep:'chest'}]);
assert.deepEqual(Array.from(cup.t.console),['cupboard',348,325,275,15,0,0]);
assert.deepEqual(Array.from(cup.t.floor),['cupboard',370,353,337,25,0,0]);
assert.equal(cup.t.aisle[3],410);assert.equal(cup.t.rack[5],'media.sn.slot.1');assert.equal(cup.t.rack[3],370);assert.equal(cup.t.hidden[3],300);assert.equal(cup.o.cupboard,1);
const cupAgain=JSON.parse(JSON.stringify(cup));delete cupAgain.pv0;const cupBefore=JSON.stringify(cupAgain);migrateSave(cupAgain);delete cupAgain.pv0;assert.equal(JSON.stringify(cupAgain),cupBefore);
for(const at of [{room:'hall',x:370,y:353,z:275},{room:'cupboard',x:370,y:353,z:400}]){const before=JSON.stringify(at);assert(!move(at,11));assert.equal(JSON.stringify(at),before)}
console.log('PV12 CUPBOARD PASS: supported items, newly covered floor, unchanged aisle/rack/hidden/metadata/open state and exact repeated migration');
parkState.parks['console.sn']={room:'cupboard',x:379,y:353,z:345,ry:0,keep:'sn'};
anchor=parkCtx.parking('console.sn',{});assert.equal(anchor.pose.x,397);assert.equal(anchor.pose.z,311);assert.equal(anchor.pose.ry,90);assert.equal(anchor.pose.keep,'sn');
const parkOnce=parkSaves;parkCtx.parking('console.sn',{});assert.equal(parkSaves,parkOnce);
parkState.parks['console.sn']={room:'cupboard',x:377,y:353,z:405,ry:25,keep:'custom'};
anchor=parkCtx.parking('console.sn',{});assert.equal(anchor.pose.x,377);assert.equal(anchor.pose.z,405);assert.equal(anchor.pose.ry,25);assert.equal(parkSaves,parkOnce);
console.log('PV12 CASE PARK PASS: factory park follows console once, custom park and metadata survive');
