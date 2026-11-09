// One serial browser and disposable data. Route destinations are fixtures;
// movement, floor tags, parenting, lighting and dialogue use production code.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const selected=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1].split(','),mouthsOnly=process.argv.includes('--mouths-only');
const axis=process.argv.includes('--axis'),facesOnly=process.argv.includes('--faces-only'),routesOnly=process.argv.includes('--routes-only'),folder=process.argv.find(a=>a.startsWith('--folder='))?.slice(9)||'r8';assert(/^[a-z0-9-]+$/.test(folder));
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=root+'tests/shots/models/'+folder+'/'+label+'/';
const report={profiles:[],acting:[],props:[],groups:[],baseline,base:execFileSync('git',['rev-parse','main'],{cwd:root,encoding:'utf8'}).trim(),routes:[],faces:[],exchanges:[]};
let server,fixture,data,log='';
let closing;async function close(){return closing||=(async()=>{await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 await mkdir(out,{recursive:true});if(process.argv.includes('--append')){const prior=JSON.parse(await readFile(out+'report.json','utf8').catch(()=>'null'));if(prior)Object.assign(report,prior)}data=await mkdtemp('/tmp/jhp-model-r7-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 fixture=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,hour:14,tier:'low',seed:1999,storageState:await bonfireLogin(base,password,'Jack',{pv:12,x:270,y:210,z:660,rx:0,ry:0,lvl:'G',seat:0}),launchOptions:{args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']},onPage:async page=>{
  if(baseline)for(const file of ['np-rig.js','np-life.js','st-voice.js'])await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',report.base+':app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
  await page.addInitScript(()=>{const original=setInterval;window.__r7Timers=[];window.setInterval=(fn,ms,...a)=>{const id=original(fn,ms,...a);if(String(fn).includes('lastFrame'))__r7Timers.push(id);return id;};let ren,raw;const timer=original(()=>{if(!window.House?.ren||ren)return;ren=House.ren;raw=ren.setPixelRatio.bind(ren);ren.setPixelRatio=n=>raw(Math.min(n,.25));raw(.25);window.__r7Raster=n=>raw(n);clearInterval(timer)},20);});
 }});
 const {page,until,errors}=fixture;await until(()=>!!window.HouseFamily?.ready);await page.keyboard.press('Shift');const cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>{
  const H=House,F=HouseFamily;H.hush();H._.setMode('focus');HousePause.close();__r7Timers.forEach(clearInterval);H.anims.delete('np');F.debug.clock({md:1012,dow:2,t:18.1});F.debug.speech.freeze=true;
  for(const id of ['hall','landing','cupboard','lounge','kitchen','drive'])H.buildRoom(H.ROOMS[id]);for(const id of ['lounge','kitchen'])H.setDoor(id,true,true);
  window.r7={now:performance.now(),clock:performance.now.bind(performance)};
  r7.step=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r7.now+=1000/60;performance.now=()=>r7.now;F.debug.frame(r7.now,1/60);for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r7.rigs=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r7.now+=1000/60;performance.now=()=>r7.now;for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r7.park=()=>{for(const [i,c]of Object.values(F.chars).entries()){const key='r7park'+c.id;F.debug.spots[key]={lvl:'U',x:-170+i*60,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);c.hold=0;c.backoff=c.backHome=c.aside=c.pass=null;c.rig.hush();}const sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;NPCBubble.clear()};
 });
 async function shot(name){await page.evaluate(()=>{__r7Raster(1);House._.renderForBenchmark()});try{const s=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(s.data,'base64'))}finally{await page.evaluate(()=>__r7Raster(.25))}}
 async function camera(eye,target,lvl){await fixture.view(eye,target,{level:lvl});await page.evaluate(()=>House._.renderForBenchmark())}
 // Keep identical simulation steps in both revisions. Main captures the full
 // superset; the candidate retains the distinct native poses, skipping only
 // redundant PNG readbacks (never animation updates).
 const compact=process.argv.includes('--compact'),parts=selected('parts');
 const mainProfiles=baseline?[]:JSON.parse(await readFile(root+'tests/shots/models/r8/before/report.json','utf8')).profiles;
 if(parts?.includes('profiles'))report.profiles=report.profiles.filter(r=>!(selected('devices')||['desktop','portrait','landscape','tablet-portrait','tablet-landscape']).includes(r.device));
 if(parts?.includes('acting'))report.acting=[];if(parts?.includes('props'))report.props=[];if(parts?.includes('groups'))report.groups=[];
 const devices=selected('devices')||['desktop','portrait','landscape','tablet-portrait','tablet-landscape'];
 const profiles={desktop:[1366,860],portrait:[390,844],landscape:[844,390],'tablet-portrait':[768,1024],'tablet-landscape':[1024,768]};
 async function save(){await writeFile(out+'report.json',JSON.stringify(report,null,2))}
 async function face(id){return page.evaluate(id=>{r7.park();const F=HouseFamily,key='r8face';F.debug.spots[key]={lvl:'G',x:-100,z:House.FRONT.FZ-210,face:0};F.debug.go(id,key);F.debug.place(id,key);const c=F.chars[id],r=c.rig;c.hold=0;c.yieldAt=Infinity;r.set({look:null,listen:null,engage:false,action:null,seat:null});r.st.glanceAt=r.st.saccadeAt=r.st.blinkAt=Infinity;r.st.glance=null;r.st.blinkT=0;r.st.gaze.x=r.st.gaze.y=0;r7.rigs(2);return r.eyeWorld(new THREE.Vector3()).toArray()},id)}
 if(!parts||parts.includes('profiles'))for(const device of devices){
  const [width,height]=profiles[device];assert(width);await page.setViewportSize({width,height});
  if(device!=='desktop'){await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  for(const id of ['mom','dad','sister']){
   const eye=await face(id),position=await page.evaluate(id=>{const c=HouseFamily.chars[id];return{x:c.x,z:c.z}},id);
   for(const angle of (device==='desktop'?[0,45,80,-80]:[45,80])){
    const rad=angle*Math.PI/180;await camera([position.x+Math.sin(rad)*100,eye[1],position.z+Math.cos(rad)*100],eye,'G');
    for(const [shape,text,mood]of (device==='desktop'?[['rest','mmm','neutral'],['A','aaa','neutral'],['EI','eee','neutral'],['OU','ooo','neutral'],['FV','fff','neutral'],['question','eee','cheeky']]:[['OU','ooo','neutral'],['question','eee','cheeky']])){
     await page.evaluate(({id,text,mood,shape})=>{const r=HouseFamily.chars[id].rig;r.set({look:null,engage:false});r.talk(10000,text,{started:true,ended:false,level:()=>.8,progress:()=>.3},mood);r7.rigs(.65);if(shape==='question'){r.st.brow=.055;r.mesh.material.userData.np.npBrow.value=.055}}, {id,text,mood,shape});
     const name=`${device}-${id}-${angle}-${shape}.png`,capture=baseline&&!compact||device!=='desktop'||angle!==-80||['OU','question'].includes(shape);if(capture)await shot(name);
     const sample=await page.evaluate(id=>{const r=HouseFamily.chars[id].rig,e=r.eyeWorld(new THREE.Vector3());return{eye:House.toScreen(e.x,e.y,e.z),mouth:r.face.mouth,triangles:r.tris+6,brow:r.st.brow,tier:window.HouseQ||'std',lod:r.lod,outfit:r.outfit}},id);if(capture)report.profiles.push({device,id,angle,shape,name,...sample});if(!baseline){const same=mainProfiles.filter(p=>p.id===id);assert(same.length&&sample.triangles<=Math.max(...same.map(p=>p.triangles)),id+' native geometry exceeds main at the same house tier')} 
    }
   }
  }
  await save();console.log('PROFILE',label,device);
 }
 // Native strips replay real decoded clip energy and phonemes. The acting
 // clock is the clip source time, rather than wall time spent taking PNGs.
 await page.setViewportSize({width:1366,height:860});await page.evaluate(async()=>{Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock();await st.loadVoices()});
 if(!parts||parts.includes('acting'))for(const [id,line]of [['mom','talk.mom.evening.02'],['dad','c1.dad.offer'],['sister','talk.sister.afternoon.03']]){
  const eye=await face(id),position=await page.evaluate(id=>{const c=HouseFamily.chars[id];return{x:c.x,z:c.z}},id);await camera([position.x,eye[1],position.z+100],eye,'G');
  const data=await page.evaluate(async line=>{st.prefetch(line);const start=performance.now();while(!st.voiceReady(line)){if(performance.now()-start>20000)throw Error('decode '+line);await new Promise(r=>setTimeout(r,10))}const h=st.play(line,{});while(!h.started)await new Promise(r=>setTimeout(r,5));const beats=NPCBeats[line].beats,punch=beats.find(b=>b[0]==='joke')||beats.at(-1),trace=[];for(let i=0;i<15;i++){const t=Math.max(0,punch[1]-.5+i*.1);h.t0=h.ctx.currentTime-t;trace.push({t,level:h.level(),shape:h.phoneme?.()??null})}const result={line,dur:h.dur,text:NPCLines[line][1],mood:NPCDialogue?.[line]?.mood||VoiceDirections?.[line],punch,trace};h.stop();return result},line);
  await page.evaluate(({id,data})=>{const r=HouseFamily.chars[id].rig;window.r8={data,source:0,sample:0};const v={lineId:data.line,dur:data.dur,started:true,get ended(){return r8.source>=data.dur},sourceTime:()=>r8.source,progress:()=>r8.source/data.dur,level:()=>data.trace[r8.sample].level,phoneme:()=>data.trace[r8.sample].shape};r.talk(data.dur*1000,data.text,v,data.mood,data.line);r.st.blinkAt=Infinity;r.st.blinkT=0}, {id,data});
  const frames=[];for(let i=0;i<data.trace.length;i++){
   const sample=await page.evaluate(({id,i})=>{r8.sample=i;r8.source=r8.data.trace[i].t;r7.rigs(.1);const r=HouseFamily.chars[id].rig;return{source:r8.source,smile:r.mesh.material.userData.np.npAct.value.y,brow:r.st.brow,beatSmile:r.st.beatSmile||0,mouth:r.face.mouth}}, {id,i});const name=`beat-${id}-${String(i).padStart(2,'0')}.png`,capture=baseline&&!compact||[0,3,5,7,9,11,14].includes(i);if(capture){await shot(name);frames.push({name,...sample})}
  }
  report.acting.push({id,...data,frames});await save();
 }
 // Use the real furniture, seat heights and approach solver. Only starting
 // poses and the requested action are staged; solve all hand/prop animation.
 if(!parts||parts.includes('props'))for(const [id,spot,action,prop]of [['dad','armchair','paper','paper'],['mom','sofaL','magazine','mag'],['mom','sofaL','tea','mug'],['sister','sofaR','tea','mug'],['sister','sofaR','draw','crayon']]){
  const setup=await page.evaluate(({id,spot,action})=>{r7.park();const F=HouseFamily;F.debug.go(id,spot);F.debug.place(id,spot);F.debug.sim(12,.1);const c=F.chars[id];c.hold=0;c.yieldAt=Infinity;c.rig.set({action,engage:false,listen:null,look:null});c.rig.hush();r7.rigs(3);const r=c.rig,a=c.h;return{x:c.x,z:c.z,a,eye:r.eyeWorld(new THREE.Vector3()).toArray(),seated:!!c.seated}}, {id,spot,action});assert(setup.seated,'seat fixture '+id);
  for(const angle of [0,65]){
   const a=setup.a+angle*Math.PI/180,dist=angle?155:170;await camera([setup.x+Math.sin(a)*dist,210,setup.z+Math.cos(a)*dist],setup.eye,'G');
   await page.evaluate(({id,action})=>{const r=HouseFamily.chars[id].rig;r.set({engage:false,look:null});r.hush();r7.rigs(4);r.st.sipAt=-1;r.st.sipQuiet=0;r.st.sipRest=r.st.t+4}, {id,action});
   const frames=[];for(const [state,seconds]of [['reading',0],['address',.15],['speaking',.6],['listen',1],['sip',1],['return',2]]){
    const sample=await page.evaluate(({id,action,state,seconds})=>{const r=HouseFamily.chars[id].rig;if(state==='address'){r.set({engage:true,look:{x:House.P.x,y:House.P.y,z:House.P.z}});r.talk(10000,'Come and tell me about your day.')}if(state==='listen'){r.hush();r.st.sipAt=-1;r.st.sipQuiet=0;r.st.sipRest=r.st.t}if(state==='return')r.set({engage:false,look:null});r7.rigs(seconds);r.group.updateMatrixWorld(true);const p=r.bones['p_'+(action==='paper'?'paper':action==='magazine'?'mag':action==='draw'?'crayon':'mug')];return{state,propScale:p.scale.x,sip:r.st.sipK||0,paperLower:r.st.paperLower||0,prop:p.getWorldPosition(new THREE.Vector3()).toArray(),hands:['L','R'].map(s=>r.bones['hand'+s].getWorldPosition(new THREE.Vector3()).toArray())}}, {id,action,state,seconds});const name=`prop-${id}-${action}-${angle}-${state}.png`,capture=baseline&&!compact||['reading','speaking','sip','return'].includes(state);if(capture){await shot(name);frames.push({name,...sample})}
   }report.props.push({id,action,prop,angle,...setup,frames});await save();
  }
 }
 // Controller-driven wide group: the queue is held on one visible speaker,
 // and real frame ticks choose listener targets and advance planted pivots.
 if(!parts||parts.includes('groups')) {
 await page.setViewportSize({width:1366,height:860});
 await page.evaluate(()=>{r7.park();const F=HouseFamily;for(const [id,x,z,face]of [['mom',-100,480,90],['dad',100,480,0],['sister',0,620,0]]){const key='r8group'+id;F.debug.spots[key]={lvl:'G',x,z,face};F.debug.go(id,key);F.debug.place(id,key)}F.debug.sim(3,.1);F.debug.speech.cur={c:F.chars.mom,lineId:'talk.mom.evening.02',person:true,talk:false};F.chars.mom.talking=true;for(const c of Object.values(F.chars)){c.hold=0;c.yieldAt=Infinity;c.rig.hush()}});
 await camera([-40,210,335],[0,230,520],'G');
 for(const [i,seconds]of [0,.5,.5,.8,1,1,1].entries()){
  await page.evaluate(seconds=>r7.step(seconds),seconds);const people=await page.evaluate(()=>Object.fromEntries(['mom','dad','sister'].map(id=>{const c=HouseFamily.chars[id];return[id,{h:c.h,x:c.x,z:c.z,listen:c.listenTo?.id,feet:c.rig.st.feet.map(f=>({x:f.x,y:f.y,z:f.z,lift:f.lift,swing:!!f.swing}))}]})));const name=`group-${i}.png`;await shot(name);report.groups.push({name,seconds,people});await save();
 }
 }
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS round 8 native',label,report.profiles.length,'profiles',report.acting.length,'decoded acting strips',report.props.length,'seated exchanges',report.groups.length,'wide group frames');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await close();await writeFile('/tmp/jhp-r8-'+label+'-server.log',log);}
