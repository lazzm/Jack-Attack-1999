// Serial browser gate; every browser fixture owns a disposable /tmp server.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {openSync,closeSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url).pathname,out=root+'tests/shots/models/r11/';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(','),rows=[];let child,stopping=false;
await mkdir(out,{recursive:true});
const paths=['np-rig.js','np-life.js','np-beats.js','hs-house.js','ch-kitchen.js','ch-out.js'];
const hashes=async()=>Object.fromEntries(await Promise.all(paths.map(async f=>[f,createHash('sha256').update(await readFile(root+'app/public/js/'+f)).digest('hex')])));
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{stopping=true;child?.kill('SIGTERM');process.exitCode=130});
const jobs=[
 ['units',['tests/models-round10-gate.mjs','--only=units']],
 ['models',['tests/models-round10-gate.mjs','--only=models']],
 ['characters',['tests/characters.mjs','--only=day,space,bump']],
 ['people',['tests/people-pass.mjs','--desktop','--skip-perf']],
 ['voices',['tests/models-round10-gate.mjs','--only=voices'],{SMOKE_SCALE:'3'}],
 ['identity',['tests/identity-house.mjs','--case=sarah']],
 ['cupboard',['tests/models-round10-gate.mjs','--only=cupboard']],
 ['ui',['tests/ui-hud.mjs'],{UI_HUD_RUN:'r11',UI_HUD_PROGRESS:'1'}],
 ['smoke',['smoke.mjs'],{SMOKE_SCALE:'3',STORY_SCALE:'3'},root+'tests'],
 ['paper',['tests/models-paper-r10.mjs']],
 ['drawing',['tests/models-drawing-r10.mjs']],
 ['mouths',['tests/models-mouths-r10.mjs']],
 ['intent',['tests/models-intent-r10.mjs'],{MODELS_EXCHANGE_LABEL:'r11-r10-intent'}],
 ['intent11',['tests/models-intent-r11.mjs']],
 ['cues',['tests/models-cues-r8.mjs']],
 ['exchanges',['tests/models-exchanges-r8.mjs'],{MODELS_EXCHANGE_LABEL:'r11'}],
 ['route',['tests/models-route-recovery-r10b.mjs']],
 ['native',['tests/models-round11.mjs','--folder=r11-final-house','--actions=washup,cook,water,wipe,carwash']],
 ['perf',['tests/models-round11-mobile-pair.mjs']],
 ['work',['tests/models-round11.mjs','--contacts-only','--folder=r11-interruptions']],
 ['before-wipe',['tests/models-round11.mjs','--baseline','--folder=r11-final-house','--actions=wipe','--append']]
];
async function run(name,args,extra={},cwd=root){
 const log=out+name+'-'+Date.now()+'.log',fd=openSync(log,'w'),before=await hashes(),start=Date.now();
 const env={...process.env,FIXTURE_RASTER_RATIO:'.35',...extra};
 if(name==='native'||name==='perf')delete env.FIXTURE_RASTER_RATIO;
 console.log('START',name);child=spawn(process.execPath,args,{cwd,env,stdio:['ignore',fd,fd]});closeSync(fd);
 const pulse=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)),30000);
 const [exit,signal]=await once(child,'exit');clearInterval(pulse);child=null;const after=await hashes();
 const row={name,command:(cwd===root+'tests'?'cd tests && ':'')+Object.entries({...(name!=='native'&&name!=='perf'?{FIXTURE_RASTER_RATIO:'.35'}:{}),...extra}).map(([k,v])=>k+'='+v+' ').join('')+'node '+args.join(' '),exit,signal,seconds:(Date.now()-start)/1000,log,sourceStable:JSON.stringify(before)===JSON.stringify(after),source:after};
 rows.push(row);const ledger=out+'results.json',prior=JSON.parse(await readFile(ledger,'utf8').catch(()=>'[]'));prior.push(row);await writeFile(ledger,JSON.stringify(prior,null,2)+'\n');console.log('RESULT',JSON.stringify(row));if(exit!==0)console.log((await readFile(log,'utf8')).slice(-5000));return exit;
}
for(const [name,args,extra,cwd]of jobs){if(stopping)break;if(only&&!only.includes(name))continue;const exit=await run(name,args,extra,cwd);if(name==='characters'&&exit!==0)await run('bump-alone',['tests/characters.mjs','--only=bump']);}
process.exitCode=stopping?130:rows.some(r=>r.exit!==0||!r.sourceStable)?1:0;
