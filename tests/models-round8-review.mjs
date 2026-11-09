// Resumeable serial capture/review runner; one browser descendant at a time.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {openSync,closeSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url).pathname,file=root+'tests/shots/models/r8-review-results.json';
const current=[];
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(','),history=JSON.parse(await readFile(file,'utf8').catch(()=>'[]'));
const art=(baseline,part,device)=>['tests/models-round8.mjs',...(baseline?['--baseline']:[]),'--append','--compact','--parts='+part,...(device?['--devices='+device]:[])];
const tasks=[
 ['before-tablet-portrait',art(true,'profiles','tablet-portrait')],['before-tablet-landscape',art(true,'profiles','tablet-landscape')],
 ['before-acting',art(true,'acting')],['before-props',art(true,'props')],['before-groups',art(true,'groups')],
 ...['desktop','portrait','landscape','tablet-portrait','tablet-landscape'].map(d=>['after-'+d,art(false,'profiles',d)]),
 ['after-acting',art(false,'acting')],['after-props',art(false,'props')],['after-groups',art(false,'groups')],
 ['decoded',['tests/models-cues-r8.mjs']],
 ['exchange-before',['tests/models-exchanges-r8.mjs','--baseline','--devices=desktop']],
 ['exchange-after',['tests/models-exchanges-r8.mjs']],
 ['models-final',['tests/models-animation.mjs','--label=r8-final-probe','--only=idle,walk,stairs,stairs-down,talk,question,page,release,magazine,carry,sit,stand','--skip-perf','--stairs-rise=20']],
 ['mobile-pair',['tests/models-round8-mobile-pair.mjs']],
 ['main-pc-controls',['smoke.mjs','--only=pc-controls','--keep-shots'],{cwd:root+'tests',env:{SMOKE_SCALE:'3',STORY_SCALE:'3',MODELS_BASELINE_REF:'HEAD',NODE_OPTIONS:'--require='+root+'tests/browser-budget.cjs --require='+root+'tests/models-main-preload.cjs'}}],
 ['smoke-final',['smoke.mjs'],{cwd:root+'tests',env:{SMOKE_SCALE:'3',STORY_SCALE:'3'}}]
];
await mkdir(root+'tests/shots/models',{recursive:true});let child,stopping=false;
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{stopping=true;child?.kill('SIGTERM');process.exitCode=130});
for(const [name,args,options={}]of tasks){
 if(stopping)break;if(only&&!only.includes(name))continue;
 const log='/tmp/r8-review-'+name+'-'+Date.now()+'.log',fd=openSync(log,'w'),start=Date.now();console.log('START',name);
 const env={...process.env,NODE_OPTIONS:'--require='+root+'tests/browser-budget.cjs',...options.env};
 child=spawn(process.execPath,args,{cwd:options.cwd||root,env,stdio:['ignore',fd,fd]});closeSync(fd);
 const pulse=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)),30000),timeout=setTimeout(()=>child?.kill('SIGTERM'),name==='exchange-after'?900000:600000);
 const [exit,signal]=await once(child,'exit');clearInterval(pulse);clearTimeout(timeout);child=null;
 const result={name,command:(options.cwd?'cd tests && ':'')+Object.entries(options.env||{}).map(([k,v])=>k+'='+JSON.stringify(v)).join(' ')+(options.env?' ': '')+'node '+args.join(' '),exit,signal,seconds:(Date.now()-start)/1000,log};history.push(result);current.push(result);await writeFile(file,JSON.stringify(history,null,2));console.log('RESULT',JSON.stringify(result));
 if(exit!==0)console.log((await readFile(log,'utf8')).slice(-3500));
}
process.exitCode=stopping?130:current.some(r=>r.exit!==0)?1:0;
