import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,view}=await roomFixture(process.argv[2]),tag=process.argv[3]||'baseline',rows=[];
try{
 await p.evaluate(()=>House.ambient.clear());
 for(const [name,eye,target]of [['pc',[-15,-55,105],[0,-17,-12]],['away',[-15,-55,105],[-230,-20,25]]]){
  await view(eye,target);await p.evaluate(()=>House._.setMode('walk'));
  for(const hidden of [false,true,...(tag==='effects'?['crt','contain']:[])]){
   await p.evaluate(hidden=>{document.getElementById('pcPerfStyle')?.remove();if(hidden){const s=document.createElement('style');s.id='pcPerfStyle';s.textContent=hidden==='crt'?'#monitorSurface::after{display:none!important}#monitorSurface{box-shadow:none!important}':hidden==='contain'?'#monitorSurface{contain:layout paint style;backface-visibility:hidden}':'#monitorSurface{display:none!important}';document.head.appendChild(s)}},hidden);
   const result=await p.evaluate(()=>new Promise(resolve=>{const frames=[],costs=[],r=House.ren,old=r.render;let n=0,last=0,cost=0,calls=0;r.render=function(...args){const t=performance.now(),out=old.apply(this,args);cost+=performance.now()-t;calls=r.info.render.calls;return out};function frame(t){if(last&&n>5){frames.push(t-last);costs.push(cost)}cost=0;last=t;House.dirty();if(++n<35)requestAnimationFrame(frame);else{r.render=old;frames.sort((a,b)=>a-b);costs.sort((a,b)=>a-b);resolve({frameMs:frames[frames.length>>1],renderMs:costs[costs.length>>1],calls,front:document.querySelector('.hs-gl2')?.style.display,desktopNodes:document.querySelector('#monitorSurface').querySelectorAll('*').length})}}requestAnimationFrame(frame)}));
   rows.push({name,hidden,...result});console.log(tag,name,hidden,JSON.stringify(result));
  }
  await p.evaluate(()=>document.getElementById('pcPerfStyle')?.remove());await p.screenshot({path:'shots/pc-perf-'+tag+'-'+name+'.png'});
 }
 assert.deepEqual(errors,[]);await writeFile('shots/pc-perf-'+tag+'.json',JSON.stringify(rows,null,2));
}finally{await browser.close()}
