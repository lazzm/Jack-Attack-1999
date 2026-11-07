'use strict';
// Per-person AB/BA costs on the production rig, no rendering or texture paint.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks'),T=require(path.join(__dirname,'../app/public/vendor/three.min.js'));
const root=path.join(__dirname,'..'),sources={before:execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{cwd:root,encoding:'utf8'}),after:fs.readFileSync(path.join(root,'app/public/js/np-rig.js'),'utf8')};
function load(src){const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}}),w={THREE:T},doc={createElement:()=>({getContext:()=>paint})},math=Object.create(Math);let seed=1999;math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);return new Function('window','document','performance','Math',src+';return window.NPCRig;')(w,doc,performance,math);}
const api={before:load(sources.before),after:load(sources.after)},report={units:'milliseconds per person per update; CPU only, no rendering',batches:'16 alternating AB/BA batches, 2000 updates, after 3000 warmups',people:{}};
for(const id of ['mom','dad','sister']){
 report.people[id]={};for(const mode of ['idle','walk','conversation','listening']){
  const cases={};for(const key of ['before','after']){
   const r=api[key].create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);let frame=0;
   if(mode==='conversation'){r.set({engage:true,look:{x:0,y:-143,z:90}});r.talk(100000,'We can have a look. Shall we try it again?');}
   if(mode==='listening'){const speaker=api[key].create('mom',{tier:'low'});speaker.talk(100000,'We can have a look. Shall we try it again?');r.set({listen:speaker,look:{x:0,y:-146,z:180}});cases[key]={speaker};}
   cases[key]={...cases[key],rig:r,samples:[],step(){if(mode==='walk')r.root(0,0,++frame*r.S.speed/60,0,r.S.speed);r.update(1/60,true)}};
   for(let n=0;n<3000;n++)cases[key].step();
  }
  for(let b=0;b<16;b++)for(const key of b%2?['after','before']:['before','after']){const c=cases[key],t=performance.now();for(let n=0;n<2000;n++)c.step();c.samples.push((performance.now()-t)/2000)}
  const out=report.people[id][mode]={};for(const key of ['before','after']){const c=cases[key],s=c.samples.slice().sort((a,b)=>a-b);out[key]={median:s[8],p95:s[15],samples:c.samples};c.rig.dispose();c.speaker?.dispose();}out.percent=(out.after.median/out.before.median-1)*100;
 }
}
const out=path.join(__dirname,'shots/models/r5-person-cpu.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
