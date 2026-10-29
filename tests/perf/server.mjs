import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
// Runs the test and its server in the same process tree. Only this child PID is killed.
export async function withTestServer(run){
 const root=fileURLToPath(new URL('../../',import.meta.url));let server,data,log='',cleaning;
 async function cleanup(){if(cleaning)return cleaning;cleaning=(async()=>{if(server?.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve()},2000);server.once('exit',()=>{clearTimeout(timer);resolve()})})}if(data)await rm(data,{recursive:true,force:true})})();return cleaning}
 const stop=async()=>{await cleanup();process.exit(1)};process.once('SIGINT',stop);process.once('SIGTERM',stop);
 try{
  const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,()=>{const port=s.address().port;s.close(()=>resolve(port))})});
  data=await mkdtemp('/tmp/jhp-stage0-check-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',s=>log+=s);
  const base='http://localhost:'+port;for(let i=0;i<300;i++){assert(server.exitCode===null,'Test server exited before readiness: '+log);try{if((await fetch(base+'/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));assert(i<299,'Server failed to start')}
  await run(base);assert(!/mod failed to load/i.test(log),'Server module failure: '+log);
 }finally{await cleanup();process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop)}
}
