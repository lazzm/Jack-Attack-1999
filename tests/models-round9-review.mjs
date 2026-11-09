// Final serial handoff: one browser descendant at a time; each child owns /tmp data.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {openSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url).pathname,path=root+'tests/shots/models/r9-review-results.json',only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const hashes=async()=>Object.fromEntries(await Promise.all(['np-rig.js','np-life.js','np-beats.js'].map(async f=>[f,createHash('sha256').update(await readFile(root+'app/public/js/'+f)).digest('hex')])));
const tasks=[
 ['gate',['tests/models-round9-gate.mjs','--only=units,models,characters,people-pass']],
 ['native-before',['tests/models-round9.mjs','--baseline']],
 ['native-after',['tests/models-round9.mjs']],
 ['house-before',['tests/models-house-r9.mjs','--baseline',...(process.argv.includes('--house-phone-only')?['--only-phone','--append']:[])]],
 ['house-after',['tests/models-house-r9.mjs',...(process.argv.includes('--house-phone-only')?['--only-phone','--append']:[])]],
 ['decoded',['tests/models-cues-r8.mjs']],
 ['exchanges',['tests/models-exchanges-r8.mjs'],{MODELS_EXCHANGE_LABEL:'r9-final'}],
 ['mobile-pair',['tests/models-round9-mobile-pair.mjs']]
];
await mkdir(root+'tests/shots/models',{recursive:true});const history=JSON.parse(await readFile(path,'utf8').catch(()=>'[]')),current=[];let child,stopping=false;
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{stopping=true;child?.kill('SIGTERM');process.exitCode=130});
if(process.argv.includes('--verify')){
 const currentSource=await hashes(),latest=new Map(history.map(r=>[r.name,r]));const bad=tasks.map(t=>t[0]).filter(n=>{const r=latest.get(n);return !r||r.exit!==0||!r.sourceStable||JSON.stringify(r.sourceAfter)!==JSON.stringify(currentSource)});
 console.log(bad.length?'FAIL current-source stages: '+bad.join(','):'PASS all eight serial stages have passing, stable results for the current source');process.exit(bad.length?1:0);
}
for(const [name,args,extra={}]of tasks){
 if(stopping)break;if(only&&!only.includes(name))continue;
 const log='/tmp/r9-review-'+name+'-'+Date.now()+'.log',fd=openSync(log,'w'),start=Date.now(),env={...process.env,NODE_OPTIONS:'--require='+root+'tests/browser-budget.cjs',...extra};delete env.FIXTURE_RASTER_RATIO;delete env.MODELS_BASELINE_REF;
 const sourceBefore=await hashes();console.log('START',name);child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore',fd,fd]});closeSync(fd);
 const pulse=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)),30000),timeout=setTimeout(()=>child?.kill('SIGTERM'),name==='gate'?1800000:900000);
 const [exit,signal]=await once(child,'exit');clearInterval(pulse);clearTimeout(timeout);child=null;
 const sourceAfter=await hashes(),sourceStable=JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter);
 const result={name,sourceBefore,sourceAfter,sourceStable,command:Object.entries(extra).map(([k,v])=>k+'='+v+' ').join('')+'node '+args.join(' '),exit,signal,seconds:(Date.now()-start)/1000,log};current.push(result);history.push(result);await writeFile(path,JSON.stringify(history,null,2));console.log('RESULT',JSON.stringify(result));if(exit!==0)console.log((await readFile(log,'utf8')).slice(-5000));
}
process.exitCode=stopping?130:current.some(r=>r.exit!==0||!r.sourceStable)?1:0;
