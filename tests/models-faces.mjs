// Recorded-voice traces replayed at exact 60 Hz rig times. Diagnostic stage,
// not house-navigation evidence. One serial browser, disposable server/data.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline');
const label=baseline?'before':'after',out=root+'tests/shots/models/r6-faces/'+label+'/';
let server,browser,log='',data;const report={baseline,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Real st-voice playback sampled every 8ms, then replayed on production rig at 60Hz; frames 0,2,...120 (0..2 seconds). Identical diagnostic stage, not live house capture.',people:{},expressions:[],visemes:[],listening:[]};
report.sourceSHA256=Object.fromEntries(await Promise.all(['np-rig.js','st-voice.js'].map(async name=>[name,createHash('sha256').update(baseline?execFileSync('git',['show','HEAD:app/public/js/'+name],{cwd:root}):await readFile(root+'app/public/js/'+name)).digest('hex')])));
try{
 await mkdir(out,{recursive:true});data=await mkdtemp('/tmp/jhp-r6-faces-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:480,height:480}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text());});
 await page.route('**/__faces.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Facial acting evidence</title><link rel="icon" href="data:,"><style>html,body{margin:0;overflow:hidden}canvas{display:block}</style>'+['/vendor/three.min.js',...['sound','cast','np-lines','st-voice','np-rig'].map(n=>'/js/'+n+'.js')].map(src=>'<script src="'+src+'"></script>').join('')}));
 if(baseline)for(const file of ['np-rig.js','st-voice.js'])await page.route('**/js/'+file,r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
 await page.goto(base+'/__faces.html');await page.keyboard.press('Shift');
 await page.evaluate(async()=>{await st.loadVoices();Cast.bind('Jack');Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock();
  const T=THREE,s=window.faceProbe={clock:0,frame:0};s.scene=new T.Scene();s.scene.background=new T.Color('#b5ada0');s.scene.add(new T.HemisphereLight(0xfff3dc,0x777585,.95));const key=new T.DirectionalLight(0xffefdb,.75);key.position.set(-160,300,250);s.scene.add(key);
  s.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});s.renderer.setSize(480,480);s.renderer.setPixelRatio(1);document.body.appendChild(s.renderer.domElement);s.camera=new T.PerspectiveCamera(29,1,1,2000);
  s.realNow=performance.now.bind(performance);s.withClock=fn=>{const original=performance.now;performance.now=()=>s.clock;try{return fn()}finally{performance.now=original}};
  s.record=async id=>{st.prefetch(id);while(!st.voiceReady(id))await new Promise(r=>setTimeout(r,10));const h=st.play(id,{}),trace=[];await new Promise((resolve,reject)=>{const start=s.realNow(),timer=setInterval(()=>{if(h.started){trace.push({t:h.progress()*h.dur,level:h.level(),...(h.speechProgress?{speech:h.speechProgress()}:{})});if(h.ended||h.progress()>.999){clearInterval(timer);resolve()}}if(s.realNow()-start>30000){clearInterval(timer);reject(Error('Voice trace timeout'))}},8)});st.stopVoice();return{dur:h.dur,trace}};
  s.reset=(id,text,recording,mood)=>{s.rig?.dispose();s.clock=0;s.frame=0;let seed=1999;const random=Math.random;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);try{s.rig=NPCRig.create(id,{tier:'low'})}finally{Math.random=random}const r=s.rig;s.scene.add(r.group);r.group.scale.y=1;r.floor=()=>0;r.teleport(0,0,0,0);r.set({engage:true});r.st.glanceAt=Infinity;r.st.blinkAt=1.15;r.st.saccadeAt=Infinity;
   s.withClock(()=>{for(let n=0;n<180;n++)r.update(1/60,true)});r.st.t=0;r.st.blinkAt=1.15;r.st.blinkLast=-10;r.st.blinkT=0;r.st.quiet=0;
   let cursor=0;s.recording=recording;s.voice={started:true,ended:false,dur:recording?.dur||8,progress:()=>s.clock/1000/(recording?.dur||8),level:()=>{if(!recording)return 0;const t=s.clock/1000,a=recording.trace;while(cursor<a.length-2&&a[cursor+1].t<t)cursor++;const p=a[cursor],q=a[Math.min(cursor+1,a.length-1)],k=Math.max(0,Math.min(1,(t-p.t)/Math.max(.00001,q.t-p.t)));return p.level+(q.level-p.level)*k}};
   if(recording?.trace[0]?.speech!==undefined)s.voice.speechProgress=()=>{const a=recording.trace,t=s.clock/1000;while(cursor<a.length-2&&a[cursor+1].t<t)cursor++;const p=a[cursor],q=a[Math.min(cursor+1,a.length-1)],k=Math.max(0,Math.min(1,(t-p.t)/Math.max(.00001,q.t-p.t)));return p.speech+(q.speech-p.speech)*k};
   s.withClock(()=>r.talk((recording?.dur||8)*1000,text,s.voice,mood));const head=r.S.head.c[1];s.camera.position.set(17,head+1,102);s.camera.lookAt(0,head-2,0);s.render=()=>{s.renderer.render(s.scene,s.camera);return{face:{...r.face},jaw:r.st.mouth,brow:r.st.brow,mood:r.st.mood,uniforms:Object.fromEntries(Object.entries(r.mesh.material.userData.np).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value])),calls:s.renderer.info.render.calls,triangles:s.renderer.info.render.triangles,atlas:[r.mesh.material.map.image.width,r.mesh.material.map.image.height]}};
  };
  s.advance=frame=>{s.withClock(()=>{for(;s.frame<frame;s.frame++){s.clock=(s.frame+1)*1000/60;s.rig.update(1/60,true)}});return s.render()};
  s.beginListen=(id,speaker,text,recording)=>{
   s.listener?.dispose();s.reset(speaker,text,recording);s.teller=s.rig;s.teller.root(-33,0,0,0,0);
   const r=s.listener=NPCRig.create(id,{tier:'low'});s.scene.add(r.group);r.group.scale.y=1;r.floor=()=>0;r.teleport(33,0,0,0);
   s.withClock(()=>{for(let n=0;n<180;n++)r.update(1/60,true)});r.st.t=0;r.st.blinkAt=3;r.set({listen:s.teller});
   const h=(r.S.head.c[1]+s.teller.S.head.c[1])*.5;s.camera.fov=44;s.camera.updateProjectionMatrix();s.camera.position.set(0,h+2,160);s.camera.lookAt(0,h-8,0);
  };
  s.listenFrame=frame=>{
   s.withClock(()=>{for(;s.frame<frame;s.frame++){s.clock=(s.frame+1)*1000/60;s.voice.ended=s.clock>=s.recording.dur*1000;s.teller.update(1/60,true);if(s.clock>s.recording.dur*1000+400)s.listener.set({listen:null});s.listener.update(1/60,true)}});
   s.renderer.render(s.scene,s.camera);return{time:s.clock/1000,smile:s.listener.mesh.material.userData.np.npAct.value.y,mouth:s.listener.face.mouth,calls:s.renderer.info.render.calls};
  };
 });
 for(const [person,id]of [['mom','talk.mom.evening.02'],['dad','c1.dad.hello'],['sister','talk.sister.afternoon.03']]){
  console.log('VOICE TRACE',person,id);const recording=await page.evaluate(id=>faceProbe.record(id),id);assert(recording.trace.some(s=>s.level>.15),'No actual recorded voice amplitude');
  const text=await page.evaluate(id=>Cast.t(NPCLines[id][1]),id);await page.evaluate(({person,text,recording})=>faceProbe.reset(person,text,recording),{person,text,recording});
  const frames=[];for(let frame=0;frame<=120;frame+=2){const sample=await page.evaluate(frame=>faceProbe.advance(frame),frame),name=person+'-'+String(frame).padStart(3,'0')+'.png';await page.screenshot({path:out+name});frames.push({frame,t:frame/60,name,...sample});assert.equal(sample.calls,2,'Character draw budget');}
  report.people[person]={id,text,...recording,frames};await writeFile(out+'report.json',JSON.stringify(report,null,2));
 }
 if(!baseline)for(const person of ['mom','dad','sister'])for(const [mood,text]of Object.entries({neutral:'We can have a look.',happy:'Thank you, that is brilliant!',cross:'Please stop making that mess.',tired:'I am tired after a long day.',cheeky:'Only joking, our little secret!',sad:'Oh dear, I am sorry.',question:'Shall we try again?',thinking:'Hmm, let me think.'})){
  await page.evaluate(({person,text,mood})=>{faceProbe.reset(person,text,null,mood==='question'||mood==='thinking'?undefined:mood);if(mood==='question'){faceProbe.voice.progress=()=>.75;faceProbe.voice.level=()=>.5;}}, {person,text,mood});const sample=await page.evaluate(()=>faceProbe.advance(45)),name=person+'-expression-'+mood+'.png';await page.screenshot({path:out+name});report.expressions.push({...sample,person,mood,name});
 }
 if(!baseline)for(const person of ['mom','dad','sister'])for(const [shape,text]of Object.entries({rest:' ',MBP:'mmm',A:'aaa',EI:'eee',OU:'ooo',FV:'fff',other:'sss'})){
  await page.evaluate(({person,text})=>{faceProbe.reset(person,text,null,'neutral');faceProbe.voice.progress=()=>.5;faceProbe.voice.level=()=>.8;},{person,text});const sample=await page.evaluate(()=>faceProbe.advance(30)),name=person+'-viseme-'+shape+'.png';await page.screenshot({path:out+name});report.visemes.push({...sample,person,shape,name});
 }
 if(!baseline)for(const person of ['mom','dad','sister']){
  const speaker=person==='mom'?'sister':'mom',recording=report.people[speaker];await page.evaluate(({person,speaker,recording})=>faceProbe.beginListen(person,speaker,recording.text,recording),{person,speaker,recording});
  const frames=[];for(const [label,time]of [['before',recording.dur*.55],['punchline',recording.dur*.95],['response',recording.dur+.35],['hold',recording.dur+.65],['settled',recording.dur+1.8]]){
   const sample=await page.evaluate(frame=>faceProbe.listenFrame(frame),Math.ceil(time*60)),name=person+'-listener-'+label+'.png';await page.screenshot({path:out+name});frames.push({label,name,...sample});assert.equal(sample.mouth,0,'listener lips open over a recording');
  }
  assert(frames[0].smile<.005,'listener smiles before final punchline');assert(Math.max(...frames.map(f=>f.smile))>.025,'listener never reacts to recorded joke');assert(frames.at(-1).smile<.005,'listener reaction never releases');report.listening.push({person,speaker,frames});
 }
 assert.deepEqual(errors,[]);report.errors=errors;await writeFile(out+'report.json',JSON.stringify(report,null,2));assert(!/mod failed to load/i.test(log));console.log('PASS',label,'183 recorded-voice frames',report.expressions.length,'expressions');
}finally{await browser?.close();if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}await writeFile('/tmp/jhp-r6-faces-'+label+'-server.log',log);if(data)await rm(data,{recursive:true,force:true});}
