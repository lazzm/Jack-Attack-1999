// Serial regression gate: one browser child at a time, local disposable data.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readdir,mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {openSync,closeSync} from 'node:fs';
import net from 'node:net';
const root=new URL('../',import.meta.url).pathname,dir=root+'tests/shots/models/',file=dir+'r8-test-results.json';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
await mkdir(dir,{recursive:true});const history=JSON.parse(await readFile(file,'utf8').catch(()=>'[]')),results=[];let child,server,data,serverLog='';
async function save(){await writeFile(file,JSON.stringify(history.concat(results),null,2)+'\n')}
async function run(name,args,{cwd=root,env={},timeout=1200000}={}){
 if(only&&!only.includes(name))return;
 const path='/tmp/r8-gate-'+name+'-'+Date.now()+'.log',fd=openSync(path,'w'),start=Date.now();console.log('START',name,args.join(' '));
 child=spawn(process.execPath,args,{cwd,env:{...process.env,FIXTURE_RASTER_RATIO:'.25',...env},stdio:['ignore',fd,fd]});closeSync(fd);
 const timer=setTimeout(()=>child?.kill('SIGTERM'),timeout),heartbeat=setInterval(()=>console.log('RUNNING',name,Math.round((Date.now()-start)/1000)),30000),[code,signal]=await once(child,'exit');clearTimeout(timer);clearInterval(heartbeat);child=null;
 const result={name,command:(cwd===root+'tests'?'cd tests && ':'')+Object.entries(env).map(([k,v])=>k+'='+v+' ').join('')+'node '+args.join(' '),exit:code,signal,seconds:(Date.now()-start)/1000,log:path};results.push(result);await save();console.log('RESULT',JSON.stringify(result));
 if(code!==0)console.log((await readFile(path,'utf8')).slice(-6000));
}
async function stopServer(){if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}server=null;if(data)await rm(data,{recursive:true,force:true});data=null}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>{child?.kill('SIGTERM');server?.kill('SIGTERM');process.exit(130)});
try{
 if(!only||only.includes('units'))for(const f of (await readdir(root+'tests')).filter(f=>f.endsWith('-unit.cjs')).sort()){
  // Keep exact per-file results even though the terminal shows one aggregate.
  const start=Date.now(),path='/tmp/r8-final-'+f+'.log',fd=openSync(path,'w');child=spawn(process.execPath,[f],{cwd:root+'tests',stdio:['ignore',fd,fd]});closeSync(fd);const [code,signal]=await once(child,'exit');child=null;results.push({name:'units',command:'cd tests && node '+f,exit:code,signal,seconds:(Date.now()-start)/1000,log:path});await save();console.log('UNIT',f,code);if(code!==0)console.log((await readFile(path,'utf8')).slice(-4000));
 }
 await run('models',['tests/models-animation.mjs','--label=r8-probe','--only=idle,walk,stairs,stairs-down,talk,question,page,release,magazine,carry,sit,stand','--skip-perf','--stairs-rise=20']);
 await run('characters',['tests/characters.mjs','--only=day,space,bump']);
 if(results.at(-1)?.name==='characters'&&results.at(-1).exit!==0)await run('characters',['tests/characters.mjs','--only=bump']);
 await run('people-pass',['tests/people-pass.mjs','--desktop','--skip-perf']);
 if(!only||only.includes('voices')){
  let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
  data=await mkdtemp('/tmp/jhp-r8-gate-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>serverLog+=d);
  const base='http://127.0.0.1:'+port;for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  await run('voices',['tests/voices.mjs',base],{env:{SMOKE_SCALE:'3'}});await stopServer();await writeFile('/tmp/r8-gate-server.log',serverLog);assert(!/mod failed to load/i.test(serverLog));
 }
 await run('identity',['tests/identity-house.mjs','--case=sarah']);
 await run('smoke',['smoke.mjs'],{cwd:root+'tests',env:{SMOKE_SCALE:'3',STORY_SCALE:'3'}});
}finally{child?.kill('SIGTERM');await stopServer();await save()}
console.log('TOTAL',results.length,'FAILED',results.filter(r=>r.exit!==0).length);process.exitCode=results.some(r=>r.exit!==0)?1:0;
