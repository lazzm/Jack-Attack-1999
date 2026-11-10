// Decode the real 40 clips with Chromium's WebAudio, then probe the production
// handle at each contact on its source clock. No speech assets are modified.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname,pack=JSON.parse(await readFile(root+'app/public/audio/voice-phonemes.json','utf8'));let server,browser,data,log='';const report=[];const live=[];const out=root+'tests/shots/models/r10-mouths/';await mkdir(out,{recursive:true});
let closing;async function close(){return closing||=(async()=>{await browser?.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 data=await mkdtemp('/tmp/jhp-r7-cues-');let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall due to ReadPixels/.test(m.text()))errors.push(m.text())});
 await page.route('**/__r7-cues.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Source cue check</title><link rel="icon" href="data:,">'+['vendor/three.min','js/np-rig','js/sound','js/cast','js/np-lines','js/st-voice'].map(n=>'<script src="/'+n+'.js"></script>').join('')}));
 await page.goto(base+'/__r7-cues.html');await page.keyboard.press('Shift');await page.evaluate(async()=>{await st.loadVoices();Cast.bind('cue-fixture',{first:'Qzxqzx',g:'m'});Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock()});
 for(const [id,t]of Object.entries(pack.lines)){
  const row=await page.evaluate(async({id,t})=>{st.prefetch(id);const start=performance.now();while(!st.voiceReady(id)){if(performance.now()-start>15000)throw Error('decode timeout '+id);await new Promise(r=>setTimeout(r,10))}const h=st.play(id,{});while(!h.started)await new Promise(r=>setTimeout(r,5));const samples=[];for(let i=0;i<t.cues.length-1;i++){const [a,shape]=t.cues[i],b=t.cues[i+1][0];if(b-a<.028)continue;h.t0=h.ctx.currentTime-(a+b)/2+.012;samples.push({a,b,want:shape<0?null:shape,got:h.phoneme()});}const row={id,manifest:st.voiceInfo(id).dur,decoded:h.dur,expected:t.dur,phrases:h.phraseEnds?.length,samples};h.stop();return row},{id,t});report.push(row);assert(Math.abs(row.decoded-t.dur)<.035,id+' decoder duration mismatch');assert(row.phrases!==undefined,id+' source timing disabled');for(const s of row.samples)assert.equal(s.got,s.want,id+' cue at '+s.a);console.log('PASS',id,row.samples.length,'source cues');
 }

 await page.evaluate(()=>{
  const T=THREE,p=window.p={};document.body.style.margin='0';p.scene=new T.Scene();p.scene.background=new T.Color('#b5ada0');p.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});p.renderer.setSize(1366,860);document.body.appendChild(p.renderer.domElement);
  p.camera=new T.PerspectiveCamera(40,1366/860,1,1000);p.scene.add(new T.HemisphereLight(0xfff3dc,0x777585,.95));const key=new T.DirectionalLight(0xffefdb,.75);key.position.set(-160,300,250);p.scene.add(key);p.wrapper=new T.Group();p.wrapper.scale.y=-1;p.scene.add(p.wrapper);
  let last=performance.now();function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(p.rig){p.rig.update(dt,true);const h=p.voice;if(h?.started&&!h.ended){const cue=h.phoneme();p.samples.push({source:h.sourceTime(),cue,mouth:p.rig.face.mouth,mix:p.rig.mesh.material.userData.np.npMouthMix.value,level:h.level()});}p.renderer.render(p.scene,p.camera);}p.raf=requestAnimationFrame(frame);}p.raf=requestAnimationFrame(frame);
 });
 for(const [person,id]of [['mom','chore.washup.give'],['mom','chore.bed.give'],['dad','c2.pocket.dad'],['mom','house.moment.zpcfic'],['sister','talk.sister.afternoon.02'],['dad','talk.dad.evening.05']]){
  for(let attempt=1;attempt<=3;attempt++){
  const duration=await page.evaluate(async({person,id})=>{p.rig?.dispose();p.rig=NPCRig.create(person,{tier:'low'});p.wrapper.add(p.rig.group);p.rig.floor=()=>0;p.rig.teleport(0,0,0,0);p.rig.set({engage:true});for(let i=0;i<120;i++)p.rig.update(1/60,true);const y=p.rig.S.head.c[1];p.camera.position.set(0,y,85);p.camera.lookAt(0,y-1,0);p.samples=[];Cast.bind('cue-fixture',{first:'Jack',g:'m'});p.voice=st.play(id,{});while(!p.voice.started)await new Promise(r=>setTimeout(r,5));p.rig.talk(p.voice.dur*1000,NPCLines[id][1],p.voice,null,id);return p.voice.dur;},{person,id});
  const track=pack.lines[id],contacts=track.cues.map(([a,shape],i)=>({a,b:track.cues[i+1]?.[0]||a,shape})).filter(c=>(c.shape===6||c.shape===5)&&c.b-c.a>.055&&c.a>1);
  const contact=contacts[0];if(contact){await page.waitForFunction(a=>p.voice.sourceTime()>=a,contact.a+.018,{polling:'raf',timeout:20000});await page.screenshot({path:out+id+'.png'});}
  await page.waitForFunction(()=>p.voice.ended,null,{polling:30,timeout:30000});
  const row=await page.evaluate(()=>({samples:p.samples,duration:p.voice.dur,nameId:p.voice.nameId,nameDuration:p.voice.nameDur}));row.id=id;row.contacts=row.samples.filter(s=>s.cue===5||s.cue===6);row.closures=row.samples.filter(s=>s.cue===6&&s.mouth===6&&s.mix>.95).length;row.attempt=attempt;live.push(row);await writeFile(out+'live.json',JSON.stringify(live,null,2));
  assert(row.contacts.length,id+' no live consonant contacts sampled');assert(row.contacts.every(s=>s.cue===s.mouth),id+' painted consonant differs from real playback');if(row.closures){console.log('LIVE',id,row.contacts.length,'contacts;',row.closures,'fully closed frames; attempt',attempt);break;}assert(attempt<3,id+' no fully closed MBP frame in three actual plays');
  }
 }
 await page.evaluate(()=>cancelAnimationFrame(p.raf));await writeFile(out+'live.json',JSON.stringify(live,null,2));
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS real decoded cues',report.length);
}finally{await writeFile(root+'tests/shots/models/r10-decoded-cues.json',JSON.stringify(report,null,2)+'\n');await writeFile('/tmp/r7-cues-server.log',log);await close()}
