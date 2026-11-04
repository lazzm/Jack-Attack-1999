'use strict';
// Paired AB/BA CPU measurements, same process/clock/three.js and warmed rigs.
// Atlas painting is stubbed; no GPU/render time is included.
const fs=require('node:fs'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks'),T=require('../app/public/vendor/three.min.js');
const source={before:execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}),after:fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8')};
function api(src){const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}}),c={THREE:T},doc={createElement:()=>({getContext:()=>paint})},math=Object.create(Math);let seed=1999;math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};return new Function('window','document','performance','Math',src+';return window.NPCRig;')(c,doc,performance,math);}
const APIs={before:api(source.before),after:api(source.after)},report={units:'ms per frame for all three family rigs, no render',order:'paired AB/BA, 16 batches of 2000 frames after 3000 warmup frames',modes:{}};
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
if(only&&fs.existsSync('tests/shots/models/paired-cpu.json'))Object.assign(report.modes,JSON.parse(fs.readFileSync('tests/shots/models/paired-cpu.json')).modes);
const contactBody=fs.readFileSync(require.resolve('../app/public/js/np-life.js'),'utf8').match(/c\.rig\.floor = \(x, z\) => \{([\s\S]*?)\n    \};/)[1];
for(const mode of ['idle','walk','jobs','far','stairs','house-stairs']){
 if(only&&!only.includes(mode))continue;
 const cases={};for(const key of ['before','after']){const rigs=['mom','dad','sister'].map(id=>APIs[key].create(id,{tier:'low'}));let frame=0;for(const r of rigs){r.floor=mode==='stairs'?(x,z)=>-Math.floor(z/25)*17.5:()=>0;r.teleport(0,0,0,0);if(mode==='jobs')r.set({action:r.kind==='mom'?'washup':'paper'});}
  const people=rigs.map(r=>{
   const person={x:371.5,z:220,lvl:'U'},H={LV:{U:73,G:353}},NV={STAIR:{z0:250},onFlight:(x,z)=>x>=333&&x<=410&&z>=200&&z<=650,ramp:z=>73+.8*Math.max(0,Math.min(350,z-238))};
   NV.floor=(lvl,x,z)=>NV.onFlight(x,z)&&(lvl==='U'?z<440:z>410)?73+.8*Math.max(0,Math.min(350,z-250)):H.LV[lvl];
   if(mode==='house-stairs'){r.floor=key==='before'?(x,z)=>NV.floor(person.lvl,x,z):new Function('NV','H','c','clamp','return (x,z)=>{'+contactBody+'}')(NV,H,person,(x,a,b)=>Math.max(a,Math.min(b,x)));r.teleport(person.x,NV.ramp(person.z),person.z,0);}
   return {person,NV};
  });
  cases[key]={rigs,step(){frame++;for(let i=0;i<rigs.length;i++){const r=rigs[i];if(mode==='house-stairs'){const p=people[i],d=(frame*r.S.speed/60)%840,z=220+(d<420?d:840-d);p.person.z=z;p.person.lvl=z>425?'G':'U';r.root(371.5,p.NV.ramp(z),z,d<420?0:Math.PI,r.S.speed);}else if(mode==='walk'||mode==='stairs'){const z=frame*r.S.speed/60;r.root(0,mode==='stairs'?-z*.7:0,z,0,r.S.speed)}r.update(1/60,mode!=='far')}},samples:[]};
  for(let i=0;i<3000;i++)cases[key].step();
 }
 for(let b=0;b<16;b++)for(const key of b%2?['after','before']:['before','after']){const c=cases[key],t=performance.now();for(let i=0;i<2000;i++)c.step();c.samples.push((performance.now()-t)/2000);}
 report.modes[mode]={};for(const key of ['before','after']){const c=cases[key],a=c.samples.slice().sort((a,b)=>a-b);report.modes[mode][key]={median:a[8],p95:a[15],samples:c.samples};for(const r of c.rigs)r.dispose();}
 report.modes[mode].ratio=report.modes[mode].after.median/report.modes[mode].before.median;
}
fs.mkdirSync('tests/shots/models',{recursive:true});fs.writeFileSync('tests/shots/models/paired-cpu.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
