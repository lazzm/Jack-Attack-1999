// Decode the real 40 clips with Chromium's WebAudio, then probe the production
// handle at each contact on its source clock. No speech assets are modified.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname,pack=JSON.parse(await readFile(root+'app/public/audio/voice-phonemes.json','utf8'));let server,browser,data,log='';const report=[];
let closing;async function close(){return closing||=(async()=>{await browser?.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 data=await mkdtemp('/tmp/jhp-r7-cues-');let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
 await page.route('**/__r7-cues.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Source cue check</title><link rel="icon" href="data:,">'+['sound','cast','np-lines','st-voice'].map(n=>'<script src="/js/'+n+'.js"></script>').join('')}));
 await page.goto(base+'/__r7-cues.html');await page.keyboard.press('Shift');await page.evaluate(async()=>{await st.loadVoices();Cast.bind('cue-fixture',{first:'Qzxqzx',g:'m'});Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock()});
 for(const [id,t]of Object.entries(pack.lines)){
  const row=await page.evaluate(async({id,t})=>{st.prefetch(id);const start=performance.now();while(!st.voiceReady(id)){if(performance.now()-start>15000)throw Error('decode timeout '+id);await new Promise(r=>setTimeout(r,10))}const h=st.play(id,{});while(!h.started)await new Promise(r=>setTimeout(r,5));const samples=[];for(let i=0;i<t.cues.length-1;i++){const [a,shape]=t.cues[i],b=t.cues[i+1][0];if(b-a<.028)continue;h.t0=h.ctx.currentTime-(a+b)/2+.012;samples.push({a,b,want:shape<0?null:shape,got:h.phoneme()});}const row={id,manifest:st.voiceInfo(id).dur,decoded:h.dur,expected:t.dur,phrases:h.phraseEnds?.length,samples};h.stop();return row},{id,t});report.push(row);assert(Math.abs(row.decoded-t.dur)<.035,id+' decoder duration mismatch');assert(row.phrases!==undefined,id+' source timing disabled');for(const s of row.samples)assert.equal(s.got,s.want,id+' cue at '+s.a);console.log('PASS',id,row.samples.length,'source cues');
 }
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS real decoded cues',report.length);
}finally{await writeFile(root+'tests/shots/models/r7-decoded-cues.json',JSON.stringify(report,null,2)+'\n');await writeFile('/tmp/r7-cues-server.log',log);await close()}
