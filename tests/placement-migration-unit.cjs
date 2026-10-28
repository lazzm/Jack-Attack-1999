// Saved placements follow geometry once; this runs the production migration without a browser or user data.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/public/js/hs-world.js'),'utf8');
const start=source.indexOf('  const PV = '),end=source.indexOf('  function saveThings(',start);
assert(start>=0&&end>start,'Production placement migration is present');
const ms=source.indexOf('  function migrateSave(save)'),me=source.indexOf('  // Placements saved before the physics pass',ms);
const {PV,FRONT,migratePlacement:move,migrateSave}=vm.runInNewContext(source.slice(start,end)+source.slice(ms,me)+';({PV,FRONT,migratePlacement,migrateSave})',{LV:{G:353},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
assert.equal(PV,6,'Latest migration version must be stamped into saves');
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
const chair={room:'lounge',x:110,y:308,z:430,ry:10};assert(move(chair,3));near(chair.x,110);near(chair.z,395);near(chair.y,308);near(chair.ry,18);
const underSofa={room:'lounge',x:0,y:353,z:620};assert(move(underSofa,3));assert(underSofa.z<560);near(underSofa.y,353);
for(const a of [null,{room:'bedroom',x:20,y:73,z:100},{room:'drive',x:-200,y:353,z:900},{room:'drive',x:-100,y:353,z:1260},{room:'lounge',x:-200,y:353,z:450},{room:'drive',x:NaN,y:353,z:900}]){
 const saved=JSON.stringify(a);assert(!move(a,3));assert.equal(JSON.stringify(a),saved,'An unrelated placement changed');
}
for(const a of [sofa,chair,underSofa,ground,hedge,roof]){const saved=JSON.stringify(a);assert(!move(a,PV));assert.equal(JSON.stringify(a),saved)}
const record={pv:3,t:{chair:['lounge',110,308,430,10,0,0,{keep:true}],unbuilt:['bedroom',20,73,100,45,0,1,{sw:80}]},o:{drawer:1}};
migrateSave(record);assert.equal(record.pv,6);assert.deepEqual(Array.from(record.t.chair),['lounge',110,308,395,18,0,0,{keep:true}]);assert.deepEqual(record.t.unbuilt,['bedroom',20,73,100,45,0,1,{sw:80}]);const stored=JSON.parse(JSON.stringify(record));delete stored.pv0;const snapshot=JSON.stringify(stored.t);migrateSave(stored);assert.equal(JSON.stringify(stored.t),snapshot);assert.equal(stored.o.drawer,1);
console.log('PLACEMENT MIGRATION PASS: versions 0..6, boot/roof/floor/hedge, sofa/chair, unrelated poses and repeated loads');
