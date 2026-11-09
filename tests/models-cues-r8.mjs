// Decode the real 40 clips with Chromium's WebAudio, then probe the production
// handle at each contact on its source clock. No speech assets are modified.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname,pack=JSON.parse(await readFile(root+'app/public/audio/voice-name-phonemes.json','utf8'));let server,browser,data,log='';const report=[];
let closing;async function close(){return closing||=(async()=>{await browser?.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 data=await mkdtemp('/tmp/jhp-r8-cues-');let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
 await page.route('**/__r8-cues.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Source cue check</title><link rel="icon" href="data:,">'+['sound','cast','np-lines','np-beats','st-voice'].map(n=>'<script src="/js/'+n+'.js"></script>').join('')}));
 await page.goto(base+'/__r8-cues.html');await page.keyboard.press('Shift');await page.evaluate(async()=>{await st.loadVoices();Cast.bind('cue-fixture',{first:'Qzxqzx',g:'m'});Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock()});
 for(const [id,t]of Object.entries(pack.names)){
  const row=await page.evaluate(async({id,t})=>{const [speaker,first]=id.split('/'),line={'mom-call':'c1.wake.mom.call','mom-shout':'c1.wake.mom.shout','dad-shout':'c3.hangup.dad','sis-whine':'c1.sis.stairs'}[speaker];Cast.bind('cue-fixture',{first,g:'m'});const options={callout:speaker};st.prefetch(line,options);const start=performance.now();while(!st.voiceReady(line,options)){if(performance.now()-start>20000)throw Error('decode timeout '+id);await new Promise(r=>setTimeout(r,5))}const h=st.play(line,options);while(!h.started)await new Promise(r=>setTimeout(r,5));const samples=[];for(let i=0;i<t.cues.length-1;i++){const [a,shape]=t.cues[i],b=t.cues[i+1][0];if(b-a<.028)continue;h.t0=h.ctx.currentTime-(a+b)/2+.012;samples.push({a,b,want:shape,got:h.phoneme(),source:h.sourceTime()})}h.t0=h.ctx.currentTime-h.nameDur-.05;const gap=h.phoneme(),source=h.sourceTime();const row={id,nameId:h.nameId,duration:h.nameDur,expected:t.dur,gap,source,samples};h.stop();return row},{id,t});report.push(row);assert.equal(row.nameId,id);assert(Math.abs(row.duration-t.dur)<.035,id+' stale decoded duration');assert.equal(row.gap,0,id+' join gap is not closed');assert(Math.abs(row.source+.05)<.012,id+' source clock includes name');for(const s of row.samples)assert.equal(s.got,s.want,id+' cue at '+s.a);
 }
 // Source times for every authored performance also use real decoded clips.
 const acting=await page.evaluate(async()=>{const rows=[];Cast.bind('cue-fixture',{first:'Qzxqzx',g:'m'});for(const [id,d]of Object.entries(NPCBeats)){if(!d.file){rows.push({id,textOnly:true});continue;}st.prefetch(id);const start=performance.now();while(!st.voiceReady(id)){if(performance.now()-start>20000)throw Error('decode '+id);await new Promise(r=>setTimeout(r,5))}const h=st.play(id,{});while(!h.started)await new Promise(r=>setTimeout(r,5));const samples=[];for(const b of d.beats){h.t0=h.ctx.currentTime-b[1];samples.push({kind:b[0],want:b[1],got:h.sourceTime()})}rows.push({id,expected:d.dur,decoded:h.dur,samples});h.stop()}return rows});
 for(const r of acting.filter(r=>!r.textOnly)){assert(Math.abs(r.decoded-r.expected)<.035,r.id+' acting clip duration');for(const s of r.samples)assert(Math.abs(s.got-s.want)<.012,r.id+' acting clock')}
 await writeFile(root+'tests/shots/models/r8-decoded-acting.json',JSON.stringify(acting,null,2));
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS real decoded cues',report.length,'names; source clocks for',acting.filter(r=>!r.textOnly).length,'recorded acting lines;',acting.filter(r=>r.textOnly).length,'text-only directions');
}finally{await writeFile(root+'tests/shots/models/r8-decoded-cues.json',JSON.stringify(report,null,2)+'\n');await writeFile('/tmp/r8-cues-server.log',log);await close()}
