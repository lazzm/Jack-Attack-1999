import assert from 'node:assert/strict';import{writeFile}from'node:fs/promises';import{roomFixture}from'./room-fixture.mjs';
const tag=process.argv[3]||'baseline',{browser,page:p,errors,view}=await roomFixture(process.argv[2]);const rows=[];
try{
 await p.evaluate(()=>House.ambient.clear());await view([-15,-55,105],[0,-17,-12]);await p.evaluate(()=>House._.setMode('walk'));
 for(const scale of [1,.75,.5]){
  await p.evaluate(scale=>{House.ren.setPixelRatio(scale);House.ren.setSize(innerWidth,innerHeight,false);House.dirty()},scale);await p.waitForTimeout(400);
  const result=await p.evaluate(()=>new Promise(resolve=>{let n=0,last=0;const times=[];function tick(t){if(last&&n>6)times.push(t-last);last=t;House.dirty();if(++n<45)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);const r=House.ren,g=r.getContext();resolve({medianMs:times[times.length>>1],p90Ms:times[Math.floor(times.length*.9)],draws:r.info.render.calls,pixels:g.drawingBufferWidth*g.drawingBufferHeight,antialias:g.getContextAttributes().antialias})}}requestAnimationFrame(tick)}));rows.push({scale,...result});console.log('FRAME BUDGET',tag,scale,JSON.stringify(result));
  await p.screenshot({path:`shots/frame-budget-${tag}-${scale}.png`});
 }
 assert.deepEqual(errors,[]);await writeFile('shots/frame-budget-'+tag+'.json',JSON.stringify(rows,null,2));
}finally{await browser.close()}
