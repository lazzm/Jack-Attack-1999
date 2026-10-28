// One-look diagnostics: per room (first station, rung 0) draws/triangles with the static merge and without it
// (HouseStatic.unmerge in the same session), merge statistics and cost. Disposable localhost only.
//   node gfx-probe.mjs http://localhost:PORT [--shots=dir]
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],arg=k=>(process.argv.find(a=>a.startsWith('--'+k+'='))||'').slice(k.length+3),shots=arg('shots'),light=arg('light'),only=arg('only');
const acct='Gp'+Date.now().toString(36);
await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:acct,pass:'Throwaway-1999'})});
const f=await roomFixture(base,{account:acct,password:'Throwaway-1999',signup:false,timeoutScale:4});
const {page:p,errors}=f;p.setDefaultTimeout(180000);
if(shots)await mkdir(shots,{recursive:true});if(light)await mkdir(light,{recursive:true});
try{
 await p.waitForTimeout(+(arg('wait')||35000));
 await p.evaluate(()=>{House.hush();House.ambient.clear();if(House.adapt)House.adapt(0,{pin:true,force:true});else House.gfx('high');for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true)});
 const rooms=(await p.evaluate(()=>Object.keys(House.ROOMS))).filter(r=>!only||only.split(',').includes(r));
 if(light){ // lighting review: every room at morning, midday, dusk and night (lamps as the house sets them)
  for(const hour of [9,13,19,23]){
   await p.evaluate(h=>{window.auditHour=h;dispatchEvent(new Event('ownerclock'));window.HouseEnvironment?.update(0);House.relight()},hour);await p.waitForTimeout(600);
   for(const id of rooms){await p.evaluate(id=>{House.goRoom(id,0);const target=House._.glide?.to;House.cancelGlide(true);if(target){const pose=typeof target==='function'?target():target;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');House.relight();House._.renderForBenchmark()},id);await p.waitForTimeout(700);await p.evaluate(()=>House._.renderForBenchmark());await p.screenshot({path:light+'/'+id+'-'+String(hour).padStart(2,'0')+'.png',style:'.hs-toast,.balloon,.hs-note,.hs-ui{visibility:hidden!important}'})}
  }
  console.log('lighting shots in',light);
 }
 if(!light||process.argv.includes('--stats')){
 const rows=[];
 for(const id of rooms){
  const r=await p.evaluate(id=>{House.goRoom(id,0);const target=House._.glide?.to;House.cancelGlide(true);if(target){const pose=typeof target==='function'?target():target;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');House._.renderForBenchmark();const i=House.ren.info.render;return{room:id,calls:i.calls,tris:i.triangles,...HouseStatic.stats(House.ROOMS[id].group)}},id);
  if(shots)await p.screenshot({path:shots+'/'+id+'.png',style:'.hs-toast,.balloon,.hs-note{visibility:hidden!important}'});
  rows.push(r);
 }
 const ms=await p.evaluate(()=>HouseStatic.ms);
 // why the rest are not merged: every drawable mesh of each room, by reason
 const why=await p.evaluate(()=>{const out={};const plain=T=>0;for(const [id,r] of Object.entries(House.ROOMS)){const c={};const add=k=>c[k]=(c[k]||0)+1;
  r.group.traverse(o=>{if(!o.isMesh||o.layers.mask!==1)return;for(let q=o;q&&q!==r.group;q=q.parent)if(!q.visible)return;
   if(o.userData.staticBatch)return add('batch');const ms=[].concat(o.material);
   let thing=false;for(let q=o;q&&q!==r.group;q=q.parent)if(q.userData.thing)thing=true;if(thing)return add('thing');
   if(o.isInstancedMesh)return add('instanced');if(ms.some(m=>m.transparent))return add('transparent');
   if(ms.some(m=>m.isShaderMaterial))return add('shader');if(ms.some(m=>m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile&&!m.userData.houseSurface))return add('onBeforeCompile');
   if(o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return add('onBeforeRender');
   if(ms.some(m=>m.map))return add('textured');add('other:'+ms[0].type)});out[id]=c}return out});
 console.log('WHY',JSON.stringify(why,null,0));
 await p.evaluate(()=>{for(const r of Object.values(House.ROOMS))HouseStatic.unmerge(r.group);for(const o of House.root.children)HouseStatic.unmerge(o)});
 for(const row of rows){const r=await p.evaluate(id=>{House.goRoom(id,0);const target=House._.glide?.to;House.cancelGlide(true);if(target){const pose=typeof target==='function'?target():target;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');House._.renderForBenchmark();const i=House.ren.info.render;return{calls:i.calls,tris:i.triangles}},row.room);row.unmergedCalls=r.calls;row.unmergedTris=r.tris}
 console.log('room        merged-draws  unmerged  batches  sources  dissolved');
 for(const r of rows)console.log(r.room.padEnd(12),String(r.calls).padStart(8),String(r.unmergedCalls).padStart(10),String(r.batches).padStart(8),String(r.sources).padStart(8),String(r.dissolved).padStart(9));
 for(const r of rows){assert(r.calls>0&&r.tris>0,JSON.stringify(r));assert(r.calls<r.unmergedCalls,'No draw reduction: '+JSON.stringify(r))}console.log('DRAW RESULTS',JSON.stringify(rows));
 console.log('REASONS',JSON.stringify(await p.evaluate(()=>HouseStatic.REASONS)));
 console.log('merge ms total',ms.toFixed(1),'programs',await p.evaluate(()=>House.ren.info.programs.length));
 }
 assert.deepEqual(errors,[]);console.log('errors',JSON.stringify(errors));
}finally{await f.browser.close()}
