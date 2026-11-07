// Serial browser gate for this worktree. Child scripts own their browsers;
// this runner owns only its disposable server and reports every real exit.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import {openSync,closeSync} from 'node:fs';
import net from 'node:net';
const round=process.env.MODELS_ROUND||'r3';assert(/^r[0-9]+[a-z]?$/.test(round));
const root=new URL('../',import.meta.url).pathname,out=root+'tests/shots/models/'+round+'-gate-results.json';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
await mkdir(root+'tests/shots/models',{recursive:true});
const history=JSON.parse(await readFile(out,'utf8').catch(()=>'[]')),results=[];let child,server,data,log='';
async function run(name,args,timeout=600000){
 if(only&&!only.includes(name))return;
 timeout=Math.min(timeout,Number(process.env.MODELS_TEST_TIMEOUT)||timeout);
 const path='/tmp/jhp-'+round+'-'+name+'-'+Date.now()+'.log',fd=openSync(path,'w'),start=Date.now();
 console.log('START',name,args.join(' '));const env={...process.env};if(name==='mobile'||name==='models')delete env.FIXTURE_RASTER_RATIO;child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore',fd,fd]});closeSync(fd);
 const heartbeat=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)+'s'),15000);
 const timer=setTimeout(()=>child?.kill('SIGTERM'),timeout),[code,signal]=await once(child,'exit');clearTimeout(timer);clearInterval(heartbeat);child=null;
 const r={name,command:'node '+args.join(' '),code,signal,seconds:(Date.now()-start)/1000,log:path};results.push(r);await writeFile(out,JSON.stringify(history.concat(results),null,2));console.log('RESULT',JSON.stringify(r));
}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{child?.kill('SIGTERM');server?.kill('SIGTERM');process.exit(130)});
try{
 let port;for(let p=18080;p<=18099;p++)if(await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))})){port=p;break;}assert(port);
 data=await mkdtemp('/tmp/jhp-model-gate-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 await run('models',['tests/models-perf.cjs'],180000);
 if(round==='r3')await run('models',['tests/models-house-r3.mjs','--label=r3-real-seats','--seats-only','--seat-matrix','--seats=beanbag','--devices=desktop','--append'],300000);
 if(!process.argv.includes('--skip-probe'))await run('models',['tests/models-animation.mjs','--label='+round+'-probe','--only=idle,walk,stop,turn,rear,stairs,stairs-down,sit,stand,job,carry,talk','--skip-perf','--stairs-rise=20'],600000);
 await run('after',['tests/models-animation.mjs','--label=after']);
 await run('events-bonfire',['tests/events-bonfire.mjs',base],900000);
 await run('voices',['tests/voices.mjs',base],900000);
 await run('door-walk',['tests/door-walk.mjs',base]);
 await run('characters',['tests/characters.mjs','--only=day,space,bump'],1200000);
 await run('mobile',['tests/mobile.mjs',base,'--only=gate,perf']);
 if(server.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}server=null;
 await writeFile('/tmp/jhp-model-gate-server.log',log);assert(!/mod failed to load/i.test(log));
 await run('identity',['tests/identity-house.mjs','--case=sarah']);
 await run('smoke',['tests/smoke.mjs'],900000);
 await run('people-pass',['tests/people-pass.mjs','--desktop','--skip-perf'],1200000);
 await run('contacts',['tests/characters.mjs','--only=feet,draws,budget,refresh'],900000);
}finally{child?.kill('SIGTERM');if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});}
process.exitCode=results.some(r=>r.code!==0)?1:0;
