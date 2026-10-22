import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18450',tag=process.argv[3]||'final',hour=Number(process.argv[4]||14),tier=process.argv[5]||'low';
const {browser,page:p,errors,view}=await roomFixture(base,{hour,tier});
async function sample(){const pixels=await p.evaluate(()=>{House.dirty();return new Promise(resolve=>requestAnimationFrame(()=>{const src=document.querySelector('.hs-gl'),c=document.createElement('canvas');c.width=320;c.height=180;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,320,180);resolve(Array.from(g.getImageData(80,40,160,100).data))}))});assert(pixels.some((v,i)=>i%4!==3&&v>30),'Sampled a cleared drawing buffer');return pixels}
try{
 await p.evaluate(()=>{House.setDoor('bedroom',true,true);House.ambient.clear()});await p.waitForTimeout(800);
 await view([292,-55,190],[65,20,170]);await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-landing.png`});
 await view([255,-55,190],[95,30,190]);await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-threshold.png`});
 const eye=[258,-55,190],target=[35,-30,58];
 await view(eye,target,{roomPoint:[235,-55,190]});await p.waitForTimeout(900);const before=await sample();
 await view(eye,target,{roomPoint:[255,-55,190]});await p.waitForTimeout(900);const after=await sample();
 let total=0,channels=0;for(let i=0;i<before.length;i++)if(i%4!==3){total+=Math.abs(before[i]-after[i]);channels++}const delta=total/channels;
 console.log('Boundary pixel mean delta',delta.toFixed(5));if(tag==='final')assert(delta<0.25,'The same room/view changed brightness when the current room changed');
 await p.setViewportSize({width:390,height:844});await view([292,-55,190],[65,20,170]);await p.screenshot({path:`shots/doorway-${tag}-${hour}-${tier}-narrow.png`});
 assert.deepEqual(errors,[]);console.log('DOORWAY QA PASS',tag,hour,tier);
}finally{await browser.close()}
