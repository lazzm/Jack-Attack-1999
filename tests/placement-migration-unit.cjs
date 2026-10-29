// Saved placements follow geometry once; this runs the production migration without a browser or user data.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const start=source.indexOf('  const PV = '),end=source.indexOf('  function saveThings(',start);
assert(start>=0&&end>start,'Production placement migration is present');
const ms=source.indexOf('  function migrateSave(save)'),me=source.indexOf('  // Placements saved before the physics pass',ms);
const {PV,FRONT,migratePlacement:move,migrateSave}=vm.runInNewContext(source.slice(start,end)+source.slice(ms,me)+';({PV,FRONT,migratePlacement,migrateSave})',{LV:{G:353,U:73},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
assert.equal(PV,8,'Latest migration version must be stamped into saves');
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
migrateSave(current);assert.equal(current.pv,8);assert.deepEqual(Array.from(current.t.table),['lounge',-72,309.5,456.5,15,0,0,{keep:'table'}]);assert.deepEqual(Array.from(current.t.chair),['lounge',141,308,402,-110,0,0]);assert.deepEqual(current.t.hidden,['lounge',110,308,395,0,0,1,{keep:'hidden'}]);assert.deepEqual(current.t.snapped,['lounge',110,308,395,0,'ch.s.cush3',0,{keep:'slot'}]);assert.equal(current.o['hall.front'],1);
const again=JSON.parse(JSON.stringify(current));delete again.pv0;const stable=JSON.stringify(again);migrateSave(again);delete again.pv0;assert.equal(JSON.stringify(again),stable,'PV8 repeated a furniture move');
console.log('PV8 lounge PASS: historical chain, table/chair/floor, hidden/slot metadata and repeat loads');
