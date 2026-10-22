import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450',tag=process.argv[3]||'after';const{browser,page:p,errors}=await roomFixture(base);
try{
 await p.evaluate(()=>House.ambient.clear());const rows=[];
 for(const [id,open]of [['bedroom',false],['bedroom',true],['hall',true],['drive',true]]){
  await p.evaluate(({id,open})=>{for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,open,true);House.goRoom(id,0);House.hush()},{id,open});await p.waitForTimeout(1200);
  const data=await p.evaluate(()=>new Promise(resolve=>{const values=[],frames=[],ren=House.ren,old=ren.render;let cost=0,passes=0,draws=0,triangles=0,last=0,n=0;
   ren.render=function(...args){const start=performance.now(),out=old.apply(this,args);cost+=performance.now()-start;passes++;return out};
   function frame(now){if(last&&n>10){values.push(cost);frames.push(now-last);draws=ren.info.render.calls;triangles=ren.info.render.triangles}cost=0;last=now;House.dirty();if(++n<70)requestAnimationFrame(frame);else{ren.render=old;values.sort((a,b)=>a-b);frames.sort((a,b)=>a-b);resolve({medianRenderMs:values[Math.floor(values.length/2)],p95RenderMs:values[Math.floor(values.length*.95)],medianFrameMs:frames[Math.floor(frames.length/2)],passes:passes/n,draws,triangles,geometries:ren.info.memory.geometries,programs:ren.info.programs.length})}}requestAnimationFrame(frame);
  }));rows.push({id,open,...data});console.log(tag,id,open,JSON.stringify(data));
 }
 assert.deepEqual(errors,[]);await writeFile('shots/render-perf-'+tag+'.json',JSON.stringify(rows,null,2));
}finally{await browser.close()}
