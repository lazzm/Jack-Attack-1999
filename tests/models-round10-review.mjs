// Serial evidence: one child/browser, /tmp servers, pinned source per stage.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {openSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url).pathname,path=root+'tests/shots/models/r10-review-results.json',only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const files=['app/public/js/np-rig.js','app/public/js/np-life.js','app/public/js/np-beats.js','app/public/js/hs-house.js','app/public/js/ch-kitchen.js','app/public/audio/voice-phonemes.json'];
const hashes=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,createHash('sha256').update(await readFile(root+f)).digest('hex')])));
const tasks=[
 ['units',['tests/models-round10-gate.mjs','--only=units']],
 ['models',['tests/models-round10-gate.mjs','--only=models']],
 ['native-work-before',['tests/models-round10.mjs','--baseline','--folder=r10-final-house','--actions=washup,cook']],
 ['native-work-after',['tests/models-round10.mjs','--folder=r10-final-house','--actions=washup,cook']],
 ['native-page-before',['tests/models-round10.mjs','--baseline','--folder=r10-final-house','--actions=water,paper','--append']],
 ['native-page-after',['tests/models-round10.mjs','--folder=r10-final-house','--actions=water,paper','--append']],
 ['native-paper-after',['tests/models-round10.mjs','--folder=r10-final-house','--actions=paper','--append']],
 ['native-mobile-before',['tests/models-round10.mjs','--baseline','--folder=r10-final-house','--only-phone','--append']],
 ['native-mobile-after',['tests/models-round10.mjs','--folder=r10-final-house','--only-phone','--append']],
 ['paper-before',['tests/models-paper-r10.mjs','--baseline']],
 ['paper-after',['tests/models-paper-r10.mjs']],
 ['mouths',['tests/models-mouths-r10.mjs']],
 ['exchanges-desktop',['tests/models-exchanges-r8.mjs','--devices=desktop'],{MODELS_EXCHANGE_LABEL:'r10-final-desktop'}],
 ['exchanges-landscape',['tests/models-exchanges-r8.mjs','--devices=landscape'],{MODELS_EXCHANGE_LABEL:'r10-final-landscape'}],
 ['drawing-before',['tests/models-drawing-r10.mjs','--baseline']],
 ['drawing-after',['tests/models-drawing-r10.mjs']],
 ['name-cues',['tests/models-cues-r8.mjs']],
 ['intent',['tests/models-intent-r10.mjs']],
 ['mobile-pair',['tests/models-round10-mobile-pair.mjs']]
];
await mkdir(root+'tests/shots/models',{recursive:true});const history=JSON.parse(await readFile(path,'utf8').catch(()=>'[]'));const current=[];let child,stopping=false;
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{stopping=true;child?.kill('SIGTERM');process.exitCode=130});
for(const [name,args,extra={}]of tasks){
 if(stopping)break;if(only&&!only.includes(name))continue;
 const log='/tmp/r10-review-'+name+'-'+Date.now()+'.log',fd=openSync(log,'w'),start=Date.now(),env={...process.env,NODE_OPTIONS:'--require='+root+'tests/browser-budget.cjs',...extra};delete env.FIXTURE_RASTER_RATIO;delete env.MODELS_BASELINE_REF;
 const sourceBefore=await hashes();console.log('START',name);child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore',fd,fd]});closeSync(fd);
 const pulse=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)),30000);
 const [exit,signal]=await once(child,'exit');clearInterval(pulse);child=null;
 const sourceAfter=await hashes(),sourceStable=JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter);
 const result={name,sourceBefore,sourceAfter,sourceStable,command:Object.entries(extra).map(([k,v])=>k+'='+v+' ').join('')+'node '+args.join(' '),exit,signal,seconds:(Date.now()-start)/1000,log};current.push(result);const latest=JSON.parse(await readFile(path,'utf8').catch(()=>'[]'));latest.push(result);await writeFile(path,JSON.stringify(latest,null,2));console.log('RESULT',JSON.stringify(result));if(exit!==0)console.log((await readFile(log,'utf8')).slice(-5000));
}
process.exitCode=stopping?130:current.some(r=>r.exit!==0||!r.sourceStable)?1:0;
