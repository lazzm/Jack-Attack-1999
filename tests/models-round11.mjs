// One serial browser and disposable data. Route destinations are fixtures;
// movement, floor tags, parenting, lighting and dialogue use production code.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const actions=process.argv.find(a=>a.startsWith('--actions='))?.slice(10).split(',');
const selected=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1].split(','),mouthsOnly=process.argv.includes('--mouths-only');
const axis=process.argv.includes('--axis'),facesOnly=process.argv.includes('--faces-only'),routesOnly=process.argv.includes('--routes-only'),folder=process.argv.find(a=>a.startsWith('--folder='))?.slice(9)||'r11-house';assert(/^[a-z0-9-]+$/.test(folder));
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=root+'tests/shots/models/'+folder+'/'+label+'/';
const report={profiles:[],acting:[],props:[],groups:[],baseline,base:execFileSync('git',['rev-parse','main'],{cwd:root,encoding:'utf8'}).trim(),routes:[],faces:[],exchanges:[]};
let server,fixture,data,log='';
let closing;async function close(){return closing||=(async()=>{await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 await mkdir(out,{recursive:true});if(process.argv.includes('--append')){const prior=JSON.parse(await readFile(out+'report.json','utf8').catch(()=>'null'));if(prior)Object.assign(report,prior)}data=await mkdtemp('/tmp/jhp-model-r9-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 fixture=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,hour:14,tier:'low',seed:1999,storageState:await bonfireLogin(base,password,'Jack',{pv:12,x:270,y:210,z:660,rx:0,ry:0,lvl:'G',seat:0}),launchOptions:{args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']},onPage:async page=>{
  if(baseline)for(const file of ['np-rig.js','np-life.js','np-beats.js','hs-house.js','ch-kitchen.js','ch-out.js'])await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',report.base+':app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
  await page.addInitScript(()=>{const original=setInterval;window.__r9Timers=[];window.setInterval=(fn,ms,...a)=>{const id=original(fn,ms,...a);if(String(fn).includes('lastFrame'))__r9Timers.push(id);return id;};let ren,raw;const timer=original(()=>{if(!window.House?.ren||ren)return;ren=House.ren;raw=ren.setPixelRatio.bind(ren);ren.setPixelRatio=n=>raw(Math.min(n,.25));raw(.25);window.__r9Raster=n=>raw(n);clearInterval(timer)},20);});
 }});
 const {page,until,errors}=fixture;await until(()=>!!window.HouseFamily?.ready);await page.keyboard.press('Shift');const cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>{
  const H=House,F=HouseFamily;H.hush();H._.setMode('focus');HousePause.close();__r9Timers.forEach(clearInterval);H.anims.delete('np');F.debug.clock({md:1012,dow:2,t:18.1});F.debug.speech.freeze=true;
  for(const id of ['hall','landing','cupboard','lounge','kitchen','drive'])H.buildRoom(H.ROOMS[id]);for(const id of ['lounge','kitchen'])H.setDoor(id,true,true);
  window.r9={now:performance.now(),clock:performance.now.bind(performance)};
  r9.step=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r9.now+=1000/60;performance.now=()=>r9.now;F.debug.frame(r9.now,1/60);for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r9.rigs=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r9.now+=1000/60;performance.now=()=>r9.now;for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r9.park=()=>{for(const [i,c]of Object.values(F.chars).entries()){const key='r9park'+c.id;F.debug.spots[key]={lvl:'U',x:-170+i*60,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);c.hold=0;c.backoff=c.backHome=c.aside=c.pass=null;c.rig.hush();}F.debug.spots.counterWipe={lvl:'G',x:-184,z:-86,face:180,act:'wipe'};const sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;NPCBubble.clear()};
 });
 await page.evaluate(()=>Promise.all(['kitchen','garden','drive'].map(r=>window.Chores?.part?.(r)))); // (chore surfaces load after their room)
 async function shot(name){await page.evaluate(()=>{__r9Raster(1);House._.renderForBenchmark()});try{const s=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(s.data,'base64'))}finally{await page.evaluate(()=>__r9Raster(.25))}}
 async function camera(eye,target,lvl){await fixture.view(eye,target,{level:lvl});await page.evaluate(()=>House._.renderForBenchmark())}
 const onlyPhone=process.argv.includes('--only-phone'),contactsOnly=process.argv.includes('--contacts-only');
 report.frames=process.argv.includes('--append')?(report.frames||[]).filter(f=>onlyPhone?!f.device:!actions||!actions.includes(f.action)):[];
 async function capture(name,meta={}){await shot(name);if(meta.look||name.startsWith('work-')||meta.device&&name.includes('phone'))assert(await page.evaluate(()=>['head','hairL','hairR'].every(n=>HouseFamily.chars.mom.rig.bones[n].quaternion.toArray().every(Number.isFinite))),'non-finite staged head/hair');const sample=await page.evaluate(()=>Object.fromEntries(Object.entries(HouseFamily.chars).map(([id,c])=>[id,{x:c.x,z:c.z,room:c.room,seated:!!c.seated,step:c.cur?.k,started:c.cur?.started,action:c.rig.st.action,phase:c.rig.st.readingTransfer,parked:c.rig.st.readingParked,presence:c.rig.mesh.material.userData.np.npPresence?.value.toArray(),scale:c.rig.bones[id==='dad'?'p_paper':'p_mag'].scale.x,root:c.rig.group.parent===House.root,props:c.rig.readingState}])));report.frames.push({name,...meta,people:sample});await save();}
 async function setup(id,spot,action){return page.evaluate(({id,spot,action})=>{r9.park();const F=HouseFamily;if(action==='phone'){const c=F.chars[id];c.rig.dispose();c.rig=NPCRig.create(id,{tier:'low'});if(House.SPOTS['np.'+id])House.SPOTS['np.'+id].obj=c.rig.proxy;}for(const [tid,t]of Object.entries(House.THINGS))if(/^ch\.t\./.test(tid)&&t.at?.room==='kitchen'){t.at.hide=action==='wipe';t.obj.visible=action!=='wipe';}F.debug.go(id,spot,action);F.debug.place(id,spot);F.debug.sim(20,.1);const c=F.chars[id];c.hold=0;c.yieldAt=Infinity;c.rig.set({action,engage:false,look:null,listen:null});r9.rigs(3);return{x:c.x,z:c.z,h:c.h,eye:c.rig.eyeWorld(new THREE.Vector3()).toArray(),seated:!!c.seated}},{id,spot,action});}
 async function actorCamera(p,angle=45,action){const kitchen=/^(washup|cook|wipe)$/.test(action),a=p.h+(kitchen?110:angle)*Math.PI/180,d=kitchen?145:175;await camera([p.x+Math.sin(a)*d,p.eye[1]+5,p.z+Math.cos(a)*d],[p.x,p.eye[1]+45,p.z],'G');}
 const save=async()=>writeFile(out+'report.json',JSON.stringify(report,null,2));
 if(contactsOnly){
  await setup('mom','hob','cook');
  report.movedPan=await page.evaluate(()=>{
   const r=HouseFamily.chars.mom.rig,t=House.THINGS['ch.d.6'],at={...t.at},state=t.st;
   const point=()=>{r.group.updateMatrixWorld(true);return r.bones.p_spoon.localToWorld(new THREE.Vector3(0,-24,3.2)).toArray()};
   r.set({engage:true});r9.rigs(1);const before=point();t.at={...at,x:at.x+3,ry:(at.ry||0)+20};House.place(t);r9.rigs(1);const moved=point(),surface=r.workSurface('cook');
   t.st='held';r9.rigs(1);const absent={surface:r.workSurface('cook'),scale:r.bones.p_spoon.scale.x};
   t.st=state;t.at=at;House.place(t);r.set({engage:false});r9.rigs(1);return {before,moved,surface,absent,resumed:r.bones.p_spoon.scale.x};
  });
  assert(Math.abs(report.movedPan.moved[0]-report.movedPan.before[0]-3)<.1,'spoon does not follow moved pan');assert.equal(report.movedPan.absent.surface,null);assert(report.movedPan.absent.scale<.001&&report.movedPan.resumed>.99);
  await setup('mom','counterWipe','wipe');
  report.borrowedSponge=await page.evaluate(()=>{const r=HouseFamily.chars.mom.rig,t=House.THINGS['ch.sponge'],state=t.st;t.st='held';r9.rigs(1);const result={surface:r.workSurface('wipe'),scale:r.bones.p_sponge.scale.x};t.st=state;return result});
  assert.equal(report.borrowedSponge.surface,null);assert(report.borrowedSponge.scale<.001);
  await setup('dad','carwash','carwash');
  report.absentCar=await page.evaluate(()=>{const r=HouseFamily.chars.dad.rig,car=House.ROOMS.drive.car,present=car.present;car.present=false;r9.rigs(1);const result={surface:r.workSurface('carwash'),scale:r.bones.p_sponge.scale.x};car.present=present;return result});
  assert.equal(report.absentCar.surface,null);assert(report.absentCar.scale<.001);
  report.borrowedCarSponge=await page.evaluate(()=>{const r=HouseFamily.chars.dad.rig;House.act('ch.bucket');r9.rigs(1);const result={tool:ChoreKit.tool.cur?.id,surface:r.workSurface('carwash'),scale:r.bones.p_sponge.scale.x};ChoreKit.tool.drop();return result});
  assert.equal(report.borrowedCarSponge.tool,'sponge');assert.equal(report.borrowedCarSponge.surface,null);assert(report.borrowedCarSponge.scale<.001);
  report.realF=[];
  for(const [spot,action]of [['hob','cook'],['gardenWater','water'],['counterWipe','wipe']]){
   const p=await setup('mom',spot,action);
   await camera([p.x+80,210,p.z+60],[p.x,245,p.z],'G');await page.evaluate(()=>{House._.setMode('walk');House.dirty()});
   assert.equal(await page.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),'np.mom','F camera misses Mom');
   await page.keyboard.press('f');await page.evaluate(()=>r9.step(.9));
   const result=await page.evaluate(action=>{const c=HouseFamily.chars.mom,r=c.rig;return {action,hold:c.hold,engage:r.st.engage,backoff:!!c.backoff,x:c.x,z:c.z,pour:r.bones.p_raygun.scale.y}},action);
   assert(result.hold>0&&result.engage&&!result.backoff,'real F loses work contact');if(action==='water')assert.equal(result.pour,0);
   await capture('real-f-'+action+'.png',{id:'mom',action});await page.keyboard.press('Escape');await page.evaluate(()=>{HousePause.close();House._.setMode('focus')});report.realF.push(result);
  }
  await save();
 }
 for(const [id,spot,action]of [['mom','sink','washup'],['mom','hob','cook'],['mom','gardenWater','water'],['mom','counterWipe','wipe'],['dad','carwash','carwash'],['dad','armchair','paper']].filter(row=>!contactsOnly&&!onlyPhone&&(!actions||actions.includes(row[2])))){
  const p=await setup(id,spot,action);
  if(action==='washup'&&!baseline){
   report.water=await page.evaluate(()=>{const r=HouseFamily.chars.mom.rig,water=House.ROOMS.kitchen.group.getObjectByName('washing-up-water'),fx=House.anims.get('ch.npcWashWater'),before=JSON.stringify(ChoreKit.S);fx();const wet={visible:water.visible,y:water.position.y};r.set({action:null});fx();const dry={visible:water.visible,y:water.position.y};r.set({action:'washup'});fx();return {wet,dry,stateUnchanged:JSON.stringify(ChoreKit.S)===before};});
   assert(report.water.wet.visible&&!report.water.dry.visible&&report.water.stateUnchanged,'routine water changes chore state or never clears');
  }
  for(const angle of (['washup','cook','wipe'].includes(action)?[110,-110]:action==='carwash'?[118,-118]:[35,75])){
   const a=p.h+angle*Math.PI/180;
   await camera([p.x+Math.sin(a)*145,p.eye[1]+5,p.z+Math.cos(a)*145],[p.x,p.eye[1]+45,p.z],'G');
   await capture(action+'-'+angle+'-wide.png',{id,action,angle,distance:'wide'});
   if(['washup','cook','wipe'].includes(action))await camera([p.x+Math.sin(a)*105,205,p.z+Math.cos(a)*105],[action==='washup'?-80:action==='wipe'?-174:-24,253,action==='washup'?-140:action==='wipe'?-130:-134],'G');
   if(action==='water')await camera([p.x+Math.sin(a)*115,230,p.z+Math.cos(a)*115],[-127,280,-706],'G');
   // Car washing: over Dad's shoulder at his hands, so the arm, sponge, palm and glass are all in view.
   if(action==='carwash'){const h=await page.evaluate(()=>{const r=HouseFamily.chars.dad.rig;r.group.updateMatrixWorld(true);const a=r.bones.handL.getWorldPosition(new THREE.Vector3()),b=r.bones.handR.getWorldPosition(new THREE.Vector3());return a.add(b).multiplyScalar(.5).toArray()});await camera([p.x+Math.sin(a)*95,-h[1]-38,p.z+Math.cos(a)*95],[h[0],-h[1]+4,h[2]],'G');}
   await page.evaluate(({id,action})=>{const r=HouseFamily.chars[id].rig;Object.assign(r.st,{t:action==='paper'?5.8:12,pageTime:5.8,pageLast:5.8,seed:2.7,blinkAt:Infinity,glanceAt:Infinity,saccadeAt:Infinity});r.set({engage:false,look:null,listen:null});r.update(0,true);},{id,action});
   for(const [i,seconds]of (action==='paper'?[0,.35,.4,.45,.55,.6,1.1]:[0,.2,.2,.2,.2,.2,.2]).entries()){
    await page.evaluate(s=>r9.rigs(s),seconds);if(angle===(['washup','cook','wipe'].includes(action)?-110:action==='carwash'?-118:75)&&![0,3,6].includes(i))continue;await capture(action+'-'+angle+'-'+i+'.png',{id,action,angle,seconds});
    report.frames.at(-1).contact=await page.evaluate(({id,action})=>{const r=HouseFamily.chars[id].rig,T=THREE;r.group.updateMatrixWorld(true);const pt=(b,v)=>r.bones[b].localToWorld(new T.Vector3(...v)).multiply(new T.Vector3(1,-1,1)).toArray();return {time:r.st.t,leaf:r.bones.jaw.rotation.y,spoon:pt('p_spoon',[0,-24,3.2]),sponge:pt('p_sponge',[0,-1,1.5]),spout:pt('p_can',[0,-6,30.5]),hands:['L','R'].map(sd=>pt('hand'+sd,[0,-r.S.handLen*.8,1])),triangles:r.tris+6,pour:r.bones.p_raygun.scale.toArray(),torso:(r.bones.spine.rotation.x+r.bones.chest.rotation.x)*180/Math.PI,head:r.bones.head.quaternion.toArray(),joints:['armR','foreR','handR','armL','foreL','handL'].map(n=>pt(n,[0,0,0])),surface:r.workSurface?.(action)}},{id,action});await save();
   }
   await page.evaluate(()=>{const r=HouseFamily.chars.mom.rig;r.set({engage:true,look:{x:r.st.x+100,y:205,z:r.st.z-40}});r9.rigs(.8)});
   await capture(action+'-'+angle+'-ack.png',{id,action,angle});
  }
 }
 const dimensions={'portrait':[390,844],'landscape':[844,390],'tablet-portrait':[768,1024],'tablet-landscape':[1024,768]};
 for(const [device,[width,height]]of Object.entries(contactsOnly?{}:dimensions)){
  await page.setViewportSize({width,height});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  for(const [id,spot,action]of [['mom','sink','washup'],['mom','hob','cook'],['mom','gardenWater','water'],['mom','counterWipe','wipe'],['dad','carwash','carwash'],['dad','armchair','paper']].filter(row=>!actions||actions.includes(row[2]))){const p=await setup(id,spot,action);await actorCamera(p,55,action);await capture(device+'-'+action+'.png',{device,id,action});}
 }
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS round 11 house',label,report.frames.length,'native frames; matched work surfaces, complete page turn, acknowledgements and four touch sizes');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await close();await writeFile('/tmp/jhp-r9-house-'+label+'-server.log',log);}
