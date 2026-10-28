// The enlarged lawn keeps old pixels and completed job strips without sending progress/payment events.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),world=fs.readFileSync(path.join(root,'app/public/js/hs-world.js'),'utf8'),source=fs.readFileSync(path.join(root,'app/public/js/ch-out.js'),'utf8');
const fs0=world.indexOf('  const FRONT = Object.freeze('),fe=world.indexOf('  // A placement saved before',fs0),FRONT=vm.runInNewContext(world.slice(fs0,fe)+';FRONT');
const a=source.indexOf('  const LAWN = '),b=source.indexOf('  let mowerBlock',a),c=source.indexOf('  function restoreGrassCut('),d=source.indexOf('  function mowerModel()',c);assert(a>=0&&b>a&&c>=0&&d>c);
const completed=new Set(),ctx={H:{FRONT},GY:353,CK:{has:(id,key)=>id==='lawn'&&completed.has(key)},Uint8Array};
const {restoreGrassCut:restore,NX,NZ}=vm.runInNewContext(source.slice(a,b)+source.slice(c,d)+';({restoreGrassCut,NX,NZ})',ctx);
assert.equal(NX,32);assert.equal(NZ,44,'The approved 7 m plot has 44 grass rows');
const old=String.fromCharCode(...Array.from({length:NX*39},(_,i)=>i%5===0?0:i%2+1));
for(let i=0;i<8;i++)completed.add('l'+i);
const full=restore(old);assert.deepEqual(Array.from(full.slice(0,old.length)),Array.from(old,c=>c.charCodeAt(0)),'Old cut cells changed');assert(Array.from(full.slice(old.length)).every(v=>v>0),'Completed strips became unfinished');assert.equal(completed.size,8);
completed.clear();completed.add('l3');const partial=restore(old);
for(let i=old.length;i<partial.length;i++)assert.equal(partial[i]>0,Math.floor((i%NX)/4)===3,'Only already completed strips extend to the new edge');
assert.deepEqual(Array.from(partial.slice(0,old.length)),Array.from(old,c=>c.charCodeAt(0)));
const again=restore(String.fromCharCode(...partial));assert.deepEqual(Array.from(again),Array.from(partial),'Repeated loads changed cut state');
completed.clear();assert(Array.from(restore('')).every(v=>v===0));
console.log('GRASS STATE PASS: old cells, completed and partial strips, expanded edge, repeated loads; no progress/payment API used');
