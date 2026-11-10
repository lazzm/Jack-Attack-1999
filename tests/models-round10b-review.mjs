// Release-blocker checks: serial browsers, real exits, disposable server helpers.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {openSync,closeSync} from 'node:fs';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url).pathname,out=root+'tests/shots/models/r10b/';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
await mkdir(out,{recursive:true});const ledger=out+'results.json';let child,stopping=false;
const hash=async()=>Object.fromEntries(await Promise.all(['np-life.js','np-rig.js','np-beats.js','social-irc.js','st-voice.js'].map(async f=>[f,createHash('sha256').update(await readFile(root+'app/public/js/'+f)).digest('hex')])));
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{stopping=true;child?.kill('SIGTERM');process.exitCode=130});
const jobs=[];
jobs.push(['route-before',['tests/models-route-recovery-r10b.mjs','--baseline']],['route-after',['tests/models-route-recovery-r10b.mjs']]);
if(only?.includes('units'))for(const f of (await readdir(root+'tests')).filter(f=>f.endsWith('-unit.cjs')).sort())jobs.push(['units',[f],{},root+'tests']);
for(let i=1;i<=3;i++)jobs.push(['characters-'+i,['tests/characters.mjs','--only=day,space,bump']]);
for(let i=1;i<=2;i++)jobs.push(['ui-'+i,['tests/ui-hud.mjs'],{UI_HUD_CAPTURE:'pause',UI_HUD_RUN:'r10b-final-'+i,FIXTURE_DEBUG:'1',UI_HUD_PROGRESS:'1',FIXTURE_RASTER_RATIO:'.35'}]);
jobs.push(['exchanges',['tests/models-exchanges-r8.mjs'],{MODELS_EXCHANGE_LABEL:'r10b'}],['paper',['tests/models-paper-r10.mjs']],['drawing',['tests/models-drawing-r10.mjs']],['mouths',['tests/models-mouths-r10.mjs']],['intent',['tests/models-intent-r10.mjs']],['house',['tests/models-round10.mjs','--folder=r10b-house']],['voices',['tests/models-round10-gate.mjs','--only=voices'],{FIXTURE_RASTER_RATIO:'.5'}],['smoke',['smoke.mjs'],{SMOKE_SCALE:'3',STORY_SCALE:'3',FIXTURE_RASTER_RATIO:'.5'},root+'tests']);
let failed=false;
for(const [name,args,extra={},cwd=root]of jobs){
 if(stopping)break;
 if(only&&!only.includes(name))continue;
 const log=out+name+'-'+Date.now()+'.log',fd=openSync(log,'w'),sourceBefore=await hash(),start=Date.now();
 const env={...process.env,...extra};console.log('START',name,args.join(' '));
 child=spawn(process.execPath,args,{cwd,env,stdio:['ignore',fd,fd]});closeSync(fd);
 const pulse=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)),30000);
 const [exit,signal]=await once(child,'exit');clearInterval(pulse);child=null;
 const sourceAfter=await hash(),sourceStable=JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter);
 const expectedExit=name==='route-before'?1:0;
 const row={name,command:(cwd===root+'tests'?'cd tests && ':'')+Object.entries({...process.env.FIXTURE_RASTER_RATIO?{FIXTURE_RASTER_RATIO:process.env.FIXTURE_RASTER_RATIO}:{},...extra}).map(([k,v])=>k+'='+v+' ').join('')+'node '+args.join(' '),exit,signal,expectedExit,seconds:(Date.now()-start)/1000,log,sourceBefore,sourceAfter,sourceStable};
 const rows=JSON.parse(await readFile(ledger,'utf8').catch(()=>'[]'));rows.push(row);await writeFile(ledger,JSON.stringify(rows,null,2)+'\n');console.log('RESULT',JSON.stringify(row));
 if(exit!==expectedExit||!sourceStable){failed=true;console.log((await readFile(log,'utf8')).slice(-4500));}
}
process.exitCode=stopping?130:failed?1:0;
