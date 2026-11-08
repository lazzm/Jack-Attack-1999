// Own disposable server; mobile.mjs owns its one browser. Optional baseline
// routes production assets from git without changing the working tree.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import net from 'node:net';
const root=new URL('../',import.meta.url).pathname,label=process.argv.find(a=>a.startsWith('--label='))?.slice(8)||'tree';assert(/^[a-z0-9-]+$/.test(label));
let server,child,data,log='';
try{
 data=await mkdtemp('/tmp/jhp-r6-mobile-');let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 const env={...process.env};delete env.FIXTURE_RASTER_RATIO;if(process.argv.includes('--baseline'))env.MODELS_BASELINE_REF=execFileSync('git',['rev-parse','main'],{cwd:root,encoding:'utf8'}).trim();else delete env.MODELS_BASELINE_REF;
 const hashes=async()=>Object.fromEntries(await Promise.all(['js/np-rig.js','js/st-voice.js','js/np-life.js','js/np-bubble.js','js/hs-world.js','css/hs-captions.css'].map(async file=>[file,createHash('sha256').update(env.MODELS_BASELINE_REF?execFileSync('git',['show',env.MODELS_BASELINE_REF+':app/public/'+file],{cwd:root}):await readFile(root+'app/public/'+file)).digest('hex')]))),sourceBefore=await hashes();
 child=spawn(process.execPath,['tests/mobile.mjs',base,'--only=perf'],{cwd:root,env,stdio:'inherit'});const [code,signal]=await once(child,'exit');child=null;
 const report=JSON.parse(await readFile(root+'tests/shots/mobile/report.json','utf8'));report.modelsBaseline=env.MODELS_BASELINE_REF||null;report.testExit=code;report.signal=signal;
 report.sourceBefore=sourceBefore;report.sourceAfter=await hashes();assert.deepEqual(report.sourceAfter,sourceBefore,'Production assets changed during the paired sample');
 await writeFile(root+'tests/shots/mobile/r6-'+label+'-perf.json',JSON.stringify(report,null,2));assert(!/mod failed to load/i.test(log));process.exitCode=code===0?0:1;
}finally{child?.kill('SIGTERM');if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}await writeFile('/tmp/jhp-r6-mobile-'+label+'-server.log',log);if(data)await rm(data,{recursive:true,force:true});}
