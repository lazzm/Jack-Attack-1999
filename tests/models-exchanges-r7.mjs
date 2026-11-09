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
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=root+'tests/shots/models/r7-exchanges/'+label+'/';
const devices=process.argv.find(a=>a.startsWith('--devices='))?.slice(10).split(',')||['desktop','landscape'];
const lines=[['mom','talk.mom.evening.02'],['sister','talk.sister.afternoon.03'],['dad','talk.dad.evening.01'],['mom','talk.mom.afternoon.01'],['dad','talk.dad.afternoon.03'],['sister','talk.sister.evening.02'],['mom','talk.mom.morning.01'],['dad','talk.dad.evening.02'],['sister','talk.sister.morning.01'],['mom','talk.mom.evening.01'],['dad','talk.dad.morning.01'],['sister','talk.sister.evening.01']];
const report={baseline,base:execFileSync('git',['rev-parse','main'],{cwd:root,encoding:'utf8'}).trim(),method:'12 alternating queued recorded lines, live house/controller/audio, native captures; navigation raster .25',devices:[]};let data,server,f,log='';
let closing;async function close(){return closing||=(async()=>{await f?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 await mkdir(out,{recursive:true});data=await mkdtemp('/tmp/jhp-r7-exchange-');let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const device of devices){
  const account='Ex'+device;assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
  const touch=device==='landscape',width=touch?844:1366,height=touch?390:860;
  f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,width,height,touch,contextOptions:{isMobile:touch},hour:18,tier:'low',seed:1999,storage:{jhp_audio_effects:1,jhp_audio_music:0,jhp_audio_volume:1},storageState:await bonfireLogin(base,password,account,{pv:12,x:0,y:210,z:390,rx:0,ry:180,lvl:'G',seat:0}),launchOptions:{args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']},onPage:async page=>{
   if(baseline)for(const file of ['np-life.js','np-rig.js','st-voice.js'])await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',report.base+':app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
   await page.addInitScript(()=>{let renderer;const timer=setInterval(()=>{if(!window.House?.ren||renderer)return;renderer=House.ren;const raw=renderer.setPixelRatio.bind(renderer);renderer.setPixelRatio=n=>raw(Math.min(n,.25));raw(.25);window.__r7Raster=n=>raw(n);clearInterval(timer)},20)});
  }});
  const {page,until,errors}=f,cdp=await page.context().newCDPSession(page);await until(()=>!!window.HouseFamily?.ready);await page.keyboard.press('Shift');
  await page.evaluate(async lines=>{
   House.hush();HousePause.close();HouseFamily.debug.clock({md:1012,dow:2,t:18.1});st.clearVoiceQueue();Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock();await st.loadVoices();
   const F=HouseFamily,sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;sp.freeze=true;NPCBubble.clear();House.setDoor('lounge',true,true);
   for(const [i,id]of ['mom','dad','sister'].entries()){const key='r7exchange'+id;F.debug.spots[key]={lvl:'G',x:-90+i*90,z:id==='dad'?535:550,face:180};F.debug.go(id,key);F.debug.place(id,key);const c=F.chars[id];c.hold=0;c.talking=false;c.rig.hush();c.yieldAt=Infinity;}
   for(const [,id]of lines)st.prefetch(id);
  },lines);
  await f.view([0,210,390],[0,205,540],{level:'G'});await page.evaluate(()=>{House._.setMode('walk');HouseFamily.debug.speech.freeze=false});
  if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  // Wait for the first recorded cue, then request each reply only as its
  // predecessor finishes. This is a conversation, not an all-at-once queue.
  const record={device,turns:[],samples:[],screenshots:[]};report.devices.push(record);
  for(const [turn,[speaker,line]]of lines.entries()){
   console.log('EXCHANGE',label,device,turn,speaker,line);
   const accepted=await page.evaluate(({speaker,line})=>HouseFamily.say(speaker,line,{force:true,requested:true,prio:9}),{speaker,line});assert(accepted,'line refused '+line);
   const started=Date.now();let heard=false,done=false,lastSample=null,shots=0;
   while(Date.now()-started<25000){
    await page.waitForTimeout(70);
    const sample=await page.evaluate(()=>{const sp=HouseFamily.debug.speech,v=sp.voice,c=sp.cur?.c;return{wall:performance.now(),line:sp.cur?.lineId,speaker:c?.id,voice:!!v,started:v?.started,ended:v?.ended,progress:v?.progress(),sourceLevel:v?.level(),cue:v?.phoneme?.(),jokeCue:v?.speechCue?.('joke'),playing:st.voicesPlaying.length,queue:sp.q.length,people:Object.fromEntries(Object.entries(HouseFamily.chars).map(([id,c])=>[id,{look:c.rig.st.look?{x:c.rig.st.look.x,y:c.rig.st.look.y,z:c.rig.st.look.z}:null,listen:c.rig.st.listen?.kind,mouth:c.rig.face.mouth,smile:c.rig.mesh.material.userData.np.npAct.value.y,lid:c.rig.mesh.material.userData.np.npLid.value,gaze:c.rig.mesh.material.userData.np.npGaze.value.toArray(),head:c.rig.bones.head.quaternion.toArray(),eyes:c.rig.eyeWorld(new THREE.Vector3()).toArray()}]))}},null);
    record.samples.push(sample);assert(sample.playing<=1,'overlapping voices');if(sample.line===line&&sample.started)heard=true;
    // Native capture can stall this software renderer for more than the
    // deliberate turn gap. Keep most turns free of that diagnostic stall.
    const capture=turn%3===2&&(sample.line===line&&sample.progress>.65&&shots===0||sample.line===line&&sample.ended&&shots===1);
    if(capture){const name=`${device}-turn-${String(turn).padStart(2,'0')}-${shots?'boundary':'late'}.png`;await page.evaluate(()=>{__r7Raster(1);House._.renderForBenchmark()});try{const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(shot.data,'base64'))}finally{await page.evaluate(()=>__r7Raster(.25))}record.screenshots.push(name);shots++;}
    if(heard&&sample.line!==line){done=true;lastSample=sample;break;}
    lastSample=sample;
   }
   record.turns.push({speaker,line,heard,done,seconds:(Date.now()-started)/1000,lastSample});await writeFile(out+'report.json',JSON.stringify(report,null,2));assert(heard&&done,'recording did not complete '+line);
   // A short real turn gap: gaze should hold the last person, then hand over.
   await page.waitForTimeout(240);
   const gap=await page.evaluate(()=>({wall:performance.now(),speaker:HouseFamily.debug.speech.cur?.c?.id,people:Object.fromEntries(Object.entries(HouseFamily.chars).map(([id,c])=>[id,{listen:c.rig.st.listen?.kind,listenUntil:c.listenUntil,hold:c.hold,talking:c.talking,look:c.rig.st.look?{x:c.rig.st.look.x,y:c.rig.st.look.y,z:c.rig.st.look.z}:null}]))}));
   record.turns.at(-1).gap=gap;
   if(!baseline&&!gap.speaker)for(const id of ['mom','dad','sister'])if(id!==speaker&&gap.wall<=gap.people[id].listenUntil)assert.equal(gap.people[id].listen,speaker,'listener lost their addressee in the turn gap');
   await writeFile(out+'report.json',JSON.stringify(report,null,2));
  }
  record.metrics={sourceCueSamples:record.samples.filter(s=>s.cue!==null&&s.cue!==undefined).length,contacts:record.samples.filter(s=>s.cue===5||s.cue===6).length,peakListenerSmile:Math.max(...record.samples.flatMap(s=>Object.entries(s.people).filter(([id])=>id!==s.speaker).map(([,p])=>p.smile))),heldGapListeners:record.turns.reduce((n,t)=>n+Object.entries(t.gap.people).filter(([id,p])=>id!==t.speaker&&p.listen===t.speaker).length,0)};
  assert.deepEqual(errors,[]);await f.browser.close();f=null;
 }
 assert(!/mod failed to load/i.test(log));console.log('PASS',label,report.devices.length*12,'alternating recorded turns; no overlapping voices');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await close();await writeFile('/tmp/jhp-r7-exchange-'+label+'-server.log',log);}
