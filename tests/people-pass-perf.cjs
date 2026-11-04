// CPU-only comparison of production passage/contact APIs through the same
// geometry fixture. A frame budgets 3 walking substeps and 12 contact queries.
// --baseline reads HEAD; run both commands serially while the browser is closed.
const fs=require('node:fs'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks');
const baseline=process.argv.includes('--baseline'),fixtureSource=fs.readFileSync(require.resolve('./people-pass-unit.cjs'),'utf8').split('for(const width of [121,76,75])')[0];
const read=path=>baseline?execFileSync('git',['show','HEAD:app/public/js/'+path],{encoding:'utf8'}):fs.readFileSync(require.resolve('../app/public/js/'+path),'utf8');
const code=fixtureSource.replace("fs.readFileSync(require.resolve('../app/public/js/hs-world.js'),'utf8')","read('hs-world.js')").replace("fs.readFileSync(require.resolve('../app/public/js/np-life.js'),'utf8')","read('np-life.js')");
const make=new Function('require','read',code+';return fixture;')(require,read);
const out={baseline,units:'milliseconds per frame (3 passage calls, 12 blocker calls)',samples:{}};
for(const state of ['standing','absent','far','near']){
 const f=make(121),{F,c}=f;Object.values(F.chars).forEach((p,i)=>Object.assign(p,{present:state!=='absent',x:1000+i*100,z:1000,lvl:'G'}));
 if(state==='near')Object.assign(f.m,{x:60,z:160});
 const canStand=(x,z)=>!!c.floorAt(x,z),dz=state==='standing'?0:140/60;
 function time(fn){for(let i=0;i<2000;i++)fn();const a=[];for(let b=0;b<12;b++){const t=performance.now();for(let i=0;i<10000;i++)fn();a.push((performance.now()-t)/10000)}a.sort((a,b)=>a-b);return{median:a[6],p95:a[11]};}
 out.samples[state]={passage:time(()=>{for(let s=0;s<3;s++)F.passage(0,dz,1/60,canStand)}),blockers:time(()=>{for(let s=0;s<12;s++)F.blockers(60,state==='near'?135:80,'G',.5)})};
}
fs.mkdirSync('tests/shots/people-pass',{recursive:true});fs.writeFileSync('tests/shots/people-pass/api-'+(baseline?'before':'after')+'.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
