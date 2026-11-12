// Night lighting round 2 (2.92): the vertex rungs compile the shell's moonlit window patch only at night.
// This drives the real room clock across evening -> night and night -> morning (the minute ticker in
// rm-room.js repaints the sky and re-runs every room's light bake, exactly as time passing does), in the
// bedroom, kitchen and garden, on the full desktop path and the cheapest rung. Checks: the patch appears
// at night and is gone by morning, no main-thread frame over the hitch budget on the switch, every shell
// material has a program, nothing renders black, no console errors.
// usage: node night-switch.mjs http://localhost:180xx [--only=bedroom,kitchen,garden] [--rungs=0,5]
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];assert(base,'Supply a throwaway localhost server URL');
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1];
const places=(arg('only')||'bedroom,kitchen,garden').split(','),shots=fileURLToPath(new URL('shots/night-switch/',import.meta.url));
await mkdir(shots,{recursive:true});
const HITCH=Number(process.env.NIGHT_HITCH_MS||100);
const rungsWanted=arg('rungs');
let failures=0;
for(const rungName of (rungsWanted||'full,cheap').split(',')){
 const f=await roomFixture(base,{hour:12,width:1366,height:860,opening:true});
 const {page:p,until,errors}=f;
 try{
  const level=rungName==='full'?0:rungName==='cheap'?5:+rungName;
  await p.evaluate(level=>House.adapt(level,{pin:true,force:true}),level);
  await p.waitForTimeout(1500);
  const sun=await p.evaluate(()=>{const s=window.Season?.sun?.()||{rise:7,set:18};return {rise:s.rise,set:s.set}});
  // Clock helpers: whole game minutes, so the ticker sees each minute change (paintSky on multiples of five).
  const setClock=(mins)=>p.evaluate(m=>{m=((m%1440)+1440)%1440;window.auditHour=Math.floor(m/60);window.auditMinute=m%60},mins);
  const phase=()=>p.evaluate(()=>['night','dusk','dawn','day'].find(k=>document.getElementById('bootPower').classList.contains('rm-'+k)));
  const nightAt=Math.ceil((sun.set+.7)*60/5)*5+5,morningAt=Math.ceil((sun.rise-.7)*60/5)*5+5; // first ticks past each boundary
  for(const place of places){
   const transitions=[['evening-night',nightAt-15,'night'],['night-morning',morningAt-15,'dawn']];
   for(const [name,start,want] of transitions){
    await setClock(start);
    await p.evaluate(()=>dispatchEvent(new Event('ownerclock'))); // settle the starting phase as a fresh tick would
    await p.evaluate(place=>{House.goRoom(place,0);House.hush();House._.setMode('walk');window.HousePause?.close?.();House.relight()},place);
    await p.waitForTimeout(2500);
    const before=await phase();
    // Per-frame renderer cost (the main-thread time a program compile adds to that frame), programs created, and the
    // moment the phase class flips. Software GL makes whole frames slow, so the hitch is the switch frame's renderer
    // time over the median frame's, not the raw frame interval.
    await p.evaluate(want=>{
     const ren=House.ren,s=window.__ns={frames:[],cost:0,switchAt:0,want:'rm-'+want,programs:ren.info.programs.length};
     if(!ren.__nsRender){const orig=ren.render;ren.__nsRender=orig;ren.render=function(){const t=performance.now();try{return orig.apply(this,arguments)}finally{if(window.__ns)window.__ns.cost+=performance.now()-t}}}
     const loop=t=>{const n=ren.info.programs.length;s.frames.push([t,s.cost,n-s.programs]);s.cost=0;s.programs=n;if(!s.stop)requestAnimationFrame(loop)};requestAnimationFrame(loop);
     s.obs=new MutationObserver(()=>{if(!s.switchAt&&document.getElementById('bootPower').classList.contains(s.want))s.switchAt=performance.now()});
     s.obs.observe(document.getElementById('bootPower'),{attributes:true,attributeFilter:['class']});
    },want);
    for(let m=start+1;m<=start+20;m++){await setClock(m);await p.waitForTimeout(1050)}
    await p.waitForTimeout(1500);
    const r=await p.evaluate(()=>{
     const s=window.__ns;s.stop=true;s.obs.disconnect();
     const costs=s.frames.slice(3).map(f=>f[1]).filter(c=>c>0).sort((a,b)=>a-b),median=costs[Math.floor(costs.length/2)]||0;
     const around=s.frames.filter(([t])=>s.switchAt&&t>=s.switchAt-50&&t<=s.switchAt+3000);
     const ren=House.ren,shell=[],missing=[],room=House.ROOMS[House.here];
     room?.group.traverseVisible(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material||[])){if(!m?.userData?.interiorShell)continue;const prog=ren.properties.get(m).currentProgram;if(!prog){missing.push(m.name||m.type);continue}shell.push(prog.cacheKey.includes('r8-pixel-')?'pixel':prog.cacheKey.includes('shell-night')?'night':'day')}});
     const count=k=>shell.filter(x=>x===k).length;
     return {switched:!!s.switchAt,median:+median.toFixed(1),switchCost:+Math.max(0,...around.map(f=>f[1])).toFixed(1),switchPrograms:around.reduce((a,f)=>a+f[2],0),overallMax:+(costs[costs.length-1]||0).toFixed(1),shellNight:count('night'),shellDay:count('day'),shellPixel:count('pixel'),missing:missing.length,programs:ren.info.programs.length,adapt:House.Q.adapt,here:House.here};
    });
    // Nothing black: the screenshot keeps light (read back through an image, as the GL canvas is not preserved).
    const shot=shots+rungName+'-'+place+'-'+name+'.png',png=await p.screenshot({path:shot});
    const lum=await p.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const g=document.createElement('canvas');g.width=64;g.height=40;const x=g.getContext('2d');x.drawImage(img,0,0,64,40);const d=x.getImageData(0,0,64,40).data;let s=0;for(let i=0;i<d.length;i+=4)s+=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722);return +(s/(d.length/4)).toFixed(1)},png.toString('base64'));
    const after=await phase(),night=want==='night',cheap=r.adapt>=4;
    const line={rung:rungName,place,transition:name,before,after,...r,lum};console.log('NIGHT SWITCH',JSON.stringify(line));
    const problems=[];
    if(!r.switched||after!==want)problems.push('clock did not reach '+want);
    if(r.missing)problems.push(r.missing+' shell materials without a program');
    if(cheap&&r.shellNight+r.shellDay&&(night?r.shellDay:r.shellNight))problems.push('shell patch '+(night?'missing at night':'left on by morning'));
    if(!cheap&&r.shellNight)problems.push('night shell on the pixel path');
    if(r.switchCost-r.median>HITCH)problems.push('switch frame renderer '+r.switchCost+'ms (median '+r.median+'ms, '+r.switchPrograms+' programs)');
    if(lum<2)problems.push('frame is black (mean '+lum+')');
    if(errors.length)problems.push('console: '+errors.join('; '));
    if(problems.length){failures++;console.log('FAIL night-switch',rungName,place,name,problems.join(' | '))}
    else console.log('PASS night-switch',rungName,place,name);
   }
  }
 }finally{await f.browser.close()}
}
console.log(failures?'FAIL night-switch '+failures+' problem(s)':'PASS night-switch all');
process.exit(failures?1:0);
