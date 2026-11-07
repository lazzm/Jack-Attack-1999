'use strict';
// Actual presentation functions in a controlled Node world; no DOM, GPU or route cost.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks');
const root=path.join(__dirname,'..'),T=require(path.join(root,'app/public/vendor/three.min.js'));
const read=file=>fs.readFileSync(path.join(root,'app/public/js',file),'utf8'),main=file=>execFileSync('git',['show','main:app/public/js/'+file],{cwd:root,encoding:'utf8'});
function rigApi(src){const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}}),w={THREE:T};return new Function('window','document','performance',src+';return window.NPCRig;')(w,{createElement:()=>({getContext:()=>paint})},performance);}
function stats(samples){const s=samples.slice().sort((a,b)=>a-b);return{median:s[s.length>>1],min:s[0],max:s.at(-1),samples};}
function paired(cases,count=10000){for(const c of Object.values(cases))for(let n=0;n<3000;n++)c.run();for(let b=0;b<16;b++)for(const key of b%2?Object.keys(cases).reverse():Object.keys(cases)){const c=cases[key],t=performance.now();for(let n=0;n<count;n++)c.run();c.samples.push((performance.now()-t)/count);}return Object.fromEntries(Object.entries(cases).map(([k,c])=>[k,stats(c.samples)]));}
const report={units:'ms per update; actual functions with controlled world inputs, no render',baseline:'main 2.77.0',looks:{},framing:{}};
for(const mode of ['idle','listening']){
 const cases={};
 for(const [key,source]of Object.entries({main:main('np-life.js'),after:read('np-life.js')})){
  const api=rigApi(key==='main'?main('np-rig.js'):read('np-rig.js')),chars=['mom','dad','sister'].map((id,i)=>{const rig=api.create(id,{tier:'low'});rig.teleport(i*50,353,120,Math.PI);rig.update(1/60,true);return{id,rig,present:true,room:'hall',lvl:'G',x:i*50,z:120,h:Math.PI,goal:null,hold:0,talking:mode==='listening'&&i===0};}),P={x:0,y:210,z:0},ctx={window:{},T,Math,H:{P},player:()=>({...P,lvl:'G'}),sameFloor:(a,b)=>a.lvl===b.lvl,dist:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),angd:(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),D2R:Math.PI/180,displaySpeaking:()=>false,eyes:()=>({...P}),speech:{cur:mode==='listening'?{c:chars[0]}:null}};
  vm.createContext(ctx);const a=source.indexOf('  function looks(c) {'),b=source.indexOf('\n  // ================================================================ the loop',a);if(a<0||b<0)throw Error('Missing looks function');vm.runInContext(source.slice(a,b)+';this.looks=looks;',ctx);
  cases[key]={samples:[],run(){for(const c of chars)ctx.looks(c);},dispose(){for(const c of chars)c.rig.dispose();}};
 }
 report.looks[mode]=paired(cases);for(const c of Object.values(cases))c.dispose();
}
const sources={round5:execFileSync('git',['show','HEAD:app/public/js/hs-world.js'],{cwd:root,encoding:'utf8'}),after:read('hs-world.js')};
for(const mode of ['idle','active','complete']){
 const cases={};
 for(const [key,source]of Object.entries(sources)){
  let guards=0;const ctx={P:{x:0,y:210,z:0,rx:0,ry:180},W:{x:0,z:0},mode:'walk',controlsPaused:false,viewOpen:()=>{guards++;return false;},performance:{now:()=>0},dirty(){},D2R:Math.PI/180,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,angd:(a,b)=>(b-a+540)%360-180,H5:t=>t*t*t*(10+t*(-15+6*t)),Math};vm.createContext(ctx);const a=source.indexOf('  let conversationAim = null;'),b=source.indexOf('  const keys = {};',a);if(a<0||b<0)throw Error('Missing framing function');vm.runInContext(source.slice(a,b)+';this.aim={begin:frameConversation,tick:tickConversationAim};',ctx);if(mode!=='idle')ctx.aim.begin(()=>({x:0,y:200,z:100}),()=>true);if(mode==='complete')ctx.aim.tick(400);guards=0;cases[key]={samples:[],run:()=>ctx.aim.tick(mode==='active'?200:800),guards:()=>guards};
 }
 report.framing[mode]=paired(cases);for(const key in cases)report.framing[mode][key].guardCalls=cases[key].guards();
}
const out=path.join(__dirname,'shots/models/r5b-presentation-cpu.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
