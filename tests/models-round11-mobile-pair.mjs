// A complete, read-only main archive first, then this worktree. Each browser
// and server has finished before the next starts; all writable state is /tmp.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,symlink,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import net from 'node:net';
const root=new URL('../',import.meta.url).pathname,out=root+'tests/shots/mobile/';
const ref=execFileSync('git',['rev-parse','main'],{cwd:root,encoding:'utf8'}).trim(),results=[];
let archive,data,server,child,log='';
async function stop(){if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}server=null;if(data)await rm(data,{recursive:true,force:true});data=null;}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{child?.kill('SIGTERM');await stop();process.exit(130)});
const hashes=async app=>Object.fromEntries(await Promise.all(['public/js/np-rig.js','public/js/np-life.js','public/js/st-voice.js','public/js/np-beats.js','public/audio/voice-name-phonemes.json','public/audio/voice-phonemes.json','public/js/ch-kitchen.js','public/js/ch-out.js','public/js/hs-house.js','public/index.html'].map(async file=>[file,await readFile(app+'/'+file).then(b=>createHash('sha256').update(b).digest('hex')).catch(()=>null)])));
try{
 await mkdir(out,{recursive:true});archive=await mkdtemp('/tmp/jhp-r11-main-');
 execFileSync('tar',['-x','-C',archive],{input:execFileSync('git',['archive',ref,'app'],{cwd:root,maxBuffer:256*1024*1024})});
 await symlink(root+'app/node_modules',archive+'/app/node_modules');await symlink(root+'app/public/audio/voice',archive+'/app/public/audio/voice');
 for(const [label,app]of [['main',archive+'/app'],['tree',root+'app']]){
  data=await mkdtemp('/tmp/jhp-r11-perf-');log='';let port;
  for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
  server=spawn(process.execPath,['server.js'],{cwd:app,env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',d=>log+=d);
  const base='http://127.0.0.1:'+port;for(let n=0;n<150;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  const sourceBefore=await hashes(app),env={...process.env};delete env.MODELS_BASELINE_REF;delete env.FIXTURE_RASTER_RATIO;
  console.log('START',label,ref);child=spawn(process.execPath,['tests/mobile.mjs',base,'--only=perf'],{cwd:root,env,stdio:'inherit'});const [code,signal]=await once(child,'exit');child=null;
  const report=JSON.parse(await readFile(out+'report.json','utf8'));report.label=label;report.baselineRef=ref;report.fullMainArchive=label==='main';report.testExit=code;report.signal=signal;report.sourceBefore=sourceBefore;report.sourceAfter=await hashes(app);
  assert.deepEqual(report.sourceAfter,sourceBefore,'source changed within '+label+' sample');assert(!/mod failed to load/i.test(log));await writeFile(out+'r11-final-'+label+'-perf.json',JSON.stringify(report,null,2));await writeFile(out+'r11-final-'+label+'-server.log',log);results.push({label,command:'node tests/mobile.mjs '+base+' --only=perf',exit:code});await stop();
 }
 await writeFile(out+'r11-pair-results.json',JSON.stringify(results,null,2));process.exitCode=results.some(r=>r.exit!==0)?1:0;
}finally{child?.kill('SIGTERM');await stop();if(archive)await rm(archive,{recursive:true,force:true})}
