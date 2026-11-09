// Long, alternating recorded exchanges in the production house. Only initial
// actors/destinations and the requested line IDs are staged; production speech
// queues, audio clocks, listening targets and rig animations remain live.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {stillCapture} from './still-capture.mjs';
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=process.env.MODELS_EXCHANGE_LABEL||(baseline?'before':'after'),out=root+'tests/shots/models/r8-exchanges/'+label+'/';
const sipStrip=process.argv.find(a=>a.startsWith('--sip-strip='))?.slice(12);
const devices=process.argv.find(a=>a.startsWith('--devices='))?.slice(10).split(',')||['desktop','landscape'];
const lines=[['mom','talk.mom.evening.02'],['sister','talk.sister.afternoon.03'],['dad','talk.dad.evening.01'],['mom','talk.mom.afternoon.01'],['dad','talk.dad.afternoon.03'],['sister','talk.sister.evening.02'],['mom','talk.mom.morning.01'],['dad','talk.dad.evening.02'],['sister','talk.sister.morning.01'],['mom','talk.mom.evening.01'],['dad','talk.dad.morning.01'],['sister','talk.sister.evening.01']].slice(0,+(process.argv.find(a=>a.startsWith('--turns='))?.slice(8)||12));
const report={baseline,base:execFileSync('git',['rev-parse',process.env.MODELS_EXCHANGE_REF||(baseline?'main':'HEAD')],{cwd:root,encoding:'utf8'}).trim(),method:lines.length+' alternating queued recorded lines in real seats with mug, paper and drawing, live house/controller/audio, native captures; navigation raster .25',devices:[]};let data,server,f,log='';
let closing;async function close(){return closing||=(async()=>{await f?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 await mkdir(out,{recursive:true});data=await mkdtemp('/tmp/jhp-r8-exchange-');let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const device of devices){
  const account='Ex'+device;assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
  const touch=device==='landscape',width=touch?844:1366,height=touch?390:860;
  f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,width,height,touch,contextOptions:{isMobile:touch},hour:18,tier:'low',seed:1999,storage:{jhp_audio_effects:1,jhp_audio_music:0,jhp_audio_volume:1},storageState:await bonfireLogin(base,password,account,{pv:12,x:270,y:210,z:650,rx:0,ry:180,lvl:'G',seat:0}),launchOptions:{args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']},onPage:async page=>{
   if(sipStrip)await stillCapture(page);
   if(baseline)for(const file of ['np-life.js','np-rig.js','st-voice.js'])await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',report.base+':app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
   await page.addInitScript(()=>{let renderer;const timer=setInterval(()=>{if(!window.House?.ren||renderer)return;renderer=House.ren;const raw=renderer.setPixelRatio.bind(renderer);renderer.setPixelRatio=n=>raw(Math.min(n,.25));raw(.25);window.__r8Raster=n=>raw(n);clearInterval(timer)},20)});
  }});
  const {page,until,errors}=f,cdp=await page.context().newCDPSession(page);await until(()=>!!window.HouseFamily?.ready);await page.keyboard.press('Shift');
  await page.evaluate(async lines=>{
   House.hush();HousePause.close();HouseFamily.debug.clock({md:1012,dow:2,t:18.1});st.clearVoiceQueue();Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock();await st.loadVoices();
   const F=HouseFamily,sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;sp.freeze=true;NPCBubble.clear();House.setDoor('lounge',true,true);
   for(const [id,spot]of [['mom','sofaL'],['dad','armchair'],['sister','sofaR']]){F.debug.go(id,spot);F.debug.place(id,spot)}F.debug.sim(20,.1);
   for(const [id,action]of [['mom','tea'],['dad','paper'],['sister','draw']]){const c=F.chars[id];if(!c.seated)throw Error('not seated '+id);c.hold=0;c.talking=false;c.rig.hush();c.yieldAt=Infinity;c.rig.set({action});c.goal.spot={...c.goal.spot,act:action};for(let i=0;i<120;i++)c.rig.update(1/60,true);}
   // Trace both the visible animation loop and the slower maintenance loop.
   // A near=false update is a detail choice, not a new conversation state.
   window.__sipUpdates=[];const rig=F.chars.mom.rig,update=rig.update;
   rig.update=function(dt,near){const at=this.st.sipAt;update.call(this,dt,near);__sipUpdates.push({wall:performance.now(),near,dt,atBefore:at,at:this.st.sipAt,sip:this.st.sipK,quiet:this.st.sipQuiet,rest:this.st.sipRest,clock:this.st.sipClock,talking:this.talking||!!(this.st.talkVoice?.started&&!this.st.talkVoice.ended),action:this.st.action,walking:this.st.walking,speaker:sp.cur?.c?.id});};
   for(const [,id]of lines)st.prefetch(id);
  },lines);
  await f.view(sipStrip?(sipStrip==='oblique'?[-230,225,490]:[-110,225,460]):[-25,210,345],sipStrip?[-110,270,608]:[0,255,540],{level:'G'});await page.evaluate(()=>{House._.setMode('walk');HouseFamily.debug.speech.freeze=false});
  if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  // Wait for the first recorded cue, then request each reply only as its
  // predecessor finishes. This is a conversation, not an all-at-once queue.
  const record={device,turns:[],samples:[],screenshots:[],sipFrames:[]};report.devices.push(record);
  for(const [turn,[speaker,line]]of lines.entries()){
   console.log('EXCHANGE',label,device,turn,speaker,line);
   const accepted=await page.evaluate(({speaker,line})=>HouseFamily.say(speaker,line,{force:true,requested:true,prio:9}),{speaker,line});assert(accepted,'line refused '+line);
   const started=Date.now();let heard=false,done=false,lastSample=null,shots=0;
   while(Date.now()-started<45000){
    await page.waitForTimeout(70);
    const sample=await page.evaluate(()=>{const sp=HouseFamily.debug.speech,v=sp.voice,c=sp.cur?.c;return{wall:performance.now(),line:sp.cur?.lineId,speaker:c?.id,voice:!!v,started:v?.started,ended:v?.ended,progress:v?.progress(),sourceLevel:v?.level(),cue:v?.phoneme?.(),jokeCue:v?.speechCue?.('joke'),playing:st.voicesPlaying.length,queue:sp.q.length,people:Object.fromEntries(Object.entries(HouseFamily.chars).map(([id,c])=>[id,{seated:!!c.seated,action:c.rig.st.action,sip:c.rig.st.sipK||0,sipClock:c.rig.st.sipClock,sipAt:c.rig.st.sipAt,sipRest:c.rig.st.sipRest,sipQuiet:c.rig.st.sipQuiet,rigTalking:c.rig.talking,talkStart:c.rig.st.talkStart,talkUntil:c.rig.st.talkUntil,talkVoiceStarted:c.rig.st.talkVoice?.started,talkVoiceEnded:c.rig.st.talkVoice?.ended,engage:c.rig.st.engage,walking:c.rig.st.walking,rigTime:c.rig.st.t,paperLower:c.rig.st.paperLower||0,props:Object.fromEntries(['mug','paper','pad','crayon'].map(p=>[p,c.rig.bones['p_'+p].scale.x])),look:c.rig.st.look?{x:c.rig.st.look.x,y:c.rig.st.look.y,z:c.rig.st.look.z}:null,listen:c.rig.st.listen?.kind,mouth:c.rig.face.mouth,smile:c.rig.mesh.material.userData.np.npAct.value.y,lid:c.rig.mesh.material.userData.np.npLid.value,gaze:c.rig.mesh.material.userData.np.npGaze.value.toArray(),head:c.rig.bones.head.quaternion.toArray(),eyes:c.rig.eyeWorld(new THREE.Vector3()).toArray(),rimGap:(c.rig.group.updateMatrixWorld(true),c.rig.bones.p_mug.localToWorld(new THREE.Vector3(3.2,4.5,-3.5)).distanceTo(c.rig.bones.mouth.getWorldPosition(new THREE.Vector3())))}]))}},null);
    record.samples.push(sample);assert(sample.playing<=1,'overlapping voices');for(const p of Object.values(sample.people))assert(p.seated,'long exchange left a real seat');if(sample.line===line&&sample.started)heard=true;
    // Native capture can stall this software renderer for more than the
    // deliberate turn gap. Keep most turns free of that diagnostic stall.
    const film=sipStrip&&shots===0&&sample.line===line&&sample.started&&(turn===0&&sample.progress>.15||turn===1&&(baseline?sample.progress>.4:sample.people.mom.sip>.94||sample.progress>.85)||turn===2&&sample.progress>.4||turn===3&&sample.progress>.25);
    const capture=film||!sipStrip&&turn%3===2&&(sample.line===line&&sample.progress>.65&&shots===0||sample.line===line&&sample.ended&&shots===1);
    if(capture){const name=`${device}-turn-${String(turn).padStart(2,'0')}-${sipStrip?'sip-'+shots:shots?'boundary':'late'}.png`;await page.evaluate(pause=>{if(pause)__stillPause();__r8Raster(1);House._.renderForBenchmark()},!!sipStrip);try{const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(shot.data,'base64'))}finally{await page.evaluate(resume=>{__r8Raster(.25);if(resume)__stillResume()},!!sipStrip)}record.screenshots.push(name);if(film)record.sipFrames.push({name,turn,speaker,progress:sample.progress,wall:sample.wall,mom:sample.people.mom});shots++;}
    if(heard&&sample.line!==line){done=true;lastSample=sample;break;}
    lastSample=sample;
   }
   record.sipUpdates=await page.evaluate(()=>__sipUpdates);
   record.turns.push({speaker,line,heard,done,seconds:(Date.now()-started)/1000,lastSample});await writeFile(out+'report.json',JSON.stringify(report,null,2));assert(heard&&done,'recording did not complete '+line);
   // A short real turn gap: gaze should hold the last person, then hand over.
   await page.waitForTimeout(240);
   const gap=await page.evaluate(()=>({wall:performance.now(),speaker:HouseFamily.debug.speech.cur?.c?.id,people:Object.fromEntries(Object.entries(HouseFamily.chars).map(([id,c])=>[id,{listen:c.rig.st.listen?.kind,listenUntil:c.listenUntil,hold:c.hold,talking:c.talking,seated:!!c.seated,action:c.rig.st.action,sip:c.rig.st.sipK||0,sipClock:c.rig.st.sipClock,sipAt:c.rig.st.sipAt,sipRest:c.rig.st.sipRest,sipQuiet:c.rig.st.sipQuiet,rigTalking:c.rig.talking,talkStart:c.rig.st.talkStart,talkUntil:c.rig.st.talkUntil,talkVoiceStarted:c.rig.st.talkVoice?.started,talkVoiceEnded:c.rig.st.talkVoice?.ended,engage:c.rig.st.engage,walking:c.rig.st.walking,rigTime:c.rig.st.t,paperLower:c.rig.st.paperLower||0,props:Object.fromEntries(['mug','paper','pad','crayon'].map(p=>[p,c.rig.bones['p_'+p].scale.x])),look:c.rig.st.look?{x:c.rig.st.look.x,y:c.rig.st.look.y,z:c.rig.st.look.z}:null}]))}));
   record.turns.at(-1).gap=gap;
   if(!baseline&&!gap.speaker)for(const id of ['mom','dad','sister'])if(id!==speaker&&gap.wall<=gap.people[id].listenUntil)assert.equal(gap.people[id].listen,speaker,'listener lost their addressee in the turn gap');
   await writeFile(out+'report.json',JSON.stringify(report,null,2));
  }
  record.metrics={sourceCueSamples:record.samples.filter(s=>s.cue!==null&&s.cue!==undefined).length,contacts:record.samples.filter(s=>s.cue===5||s.cue===6).length,peakListenerSmile:Math.max(...record.samples.flatMap(s=>Object.entries(s.people).filter(([id])=>id!==s.speaker).map(([,p])=>p.smile))),heldGapListeners:record.turns.reduce((n,t)=>n+Object.entries(t.gap.people).filter(([id,p])=>id!==t.speaker&&p.listen===t.speaker).length,0)};
  assert.deepEqual(errors,[]);await f.browser.close();f=null;
 }
 if(!baseline)for(const device of report.devices){const samples=device.samples.filter(s=>s.started);assert(samples.some(s=>s.speaker!=='mom'&&s.people.mom.sip>.8),'Mom never drinks between turns');
 const cancelled=device.sipUpdates.filter(u=>u.atBefore>=0&&u.at<0&&u.clock-u.atBefore<2.25&&!u.talking&&!u.walking&&u.action==='tea');assert.equal(cancelled.length,0,'a detail-only update cancels Mom drinking');
 const own=samples.filter(s=>s.speaker==='mom'&&s.wall-s.people.mom.talkStart>650);assert(own.length&&own.every(s=>s.people.mom.sip<.03),'Mom does not lower her mug to speak');
 assert(samples.every(s=>s.people.mom.props.mug>.98),'Mom loses her held mug');
 device.metrics.sipPeak=Math.max(...samples.map(s=>s.people.mom.sip));device.metrics.prematureSipCancels=cancelled.length;device.metrics.ownSpeechSipPeak=Math.max(...own.map(s=>s.people.mom.sip));device.metrics.rimGaps=samples.filter(s=>s.people.mom.sip>.94).map(s=>s.people.mom.rimGap);assert(device.metrics.rimGaps.some(gap=>gap<2.5),'Mom raises the cup without reaching her mouth');
 assert(samples.some(s=>s.people.dad.paperLower>.9),'Dad never lowers paper');assert(samples.every(s=>s.people.dad.props.paper>.98&&s.people.sister.props.pad>.98&&s.people.sister.props.crayon>.98),'seated prop disappears');}
 assert(!/mod failed to load/i.test(log));console.log('PASS',label,report.devices.length*lines.length,'alternating recorded turns; no overlapping voices');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await close();await writeFile('/tmp/jhp-r8-exchange-'+label+'-server.log',log);}
