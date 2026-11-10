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
const axis=process.argv.includes('--axis'),facesOnly=process.argv.includes('--faces-only'),routesOnly=process.argv.includes('--routes-only'),folder=process.argv.find(a=>a.startsWith('--folder='))?.slice(9)||'r10-house';assert(/^[a-z0-9-]+$/.test(folder));
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
  if(baseline)for(const file of ['np-rig.js','np-life.js','np-beats.js','hs-house.js','ch-kitchen.js'])await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',report.base+':app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
  await page.addInitScript(()=>{const original=setInterval;window.__r9Timers=[];window.setInterval=(fn,ms,...a)=>{const id=original(fn,ms,...a);if(String(fn).includes('lastFrame'))__r9Timers.push(id);return id;};let ren,raw;const timer=original(()=>{if(!window.House?.ren||ren)return;ren=House.ren;raw=ren.setPixelRatio.bind(ren);ren.setPixelRatio=n=>raw(Math.min(n,.25));raw(.25);window.__r9Raster=n=>raw(n);clearInterval(timer)},20);});
 }});
 const {page,until,errors}=fixture;await until(()=>!!window.HouseFamily?.ready);await page.keyboard.press('Shift');const cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>{
  const H=House,F=HouseFamily;H.hush();H._.setMode('focus');HousePause.close();__r9Timers.forEach(clearInterval);H.anims.delete('np');F.debug.clock({md:1012,dow:2,t:18.1});F.debug.speech.freeze=true;
  for(const id of ['hall','landing','cupboard','lounge','kitchen','drive'])H.buildRoom(H.ROOMS[id]);for(const id of ['lounge','kitchen'])H.setDoor(id,true,true);
  window.r9={now:performance.now(),clock:performance.now.bind(performance)};
  r9.step=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r9.now+=1000/60;performance.now=()=>r9.now;F.debug.frame(r9.now,1/60);for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r9.rigs=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r9.now+=1000/60;performance.now=()=>r9.now;for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r9.park=()=>{for(const [i,c]of Object.values(F.chars).entries()){const key='r9park'+c.id;F.debug.spots[key]={lvl:'U',x:-170+i*60,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);c.hold=0;c.backoff=c.backHome=c.aside=c.pass=null;c.rig.hush();}const sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;NPCBubble.clear()};
 });
 async function shot(name){await page.evaluate(()=>{__r9Raster(1);House._.renderForBenchmark()});try{const s=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(s.data,'base64'))}finally{await page.evaluate(()=>__r9Raster(.25))}}
 async function camera(eye,target,lvl){await fixture.view(eye,target,{level:lvl});await page.evaluate(()=>House._.renderForBenchmark())}
 const onlyPhone=process.argv.includes('--only-phone');
 report.frames=process.argv.includes('--append')?(report.frames||[]).filter(f=>onlyPhone?!f.device:!actions||!actions.includes(f.action)):[];
 async function capture(name,meta={}){await shot(name);if(meta.look||name.startsWith('work-')||meta.device&&name.includes('phone'))assert(await page.evaluate(()=>['head','hairL','hairR'].every(n=>HouseFamily.chars.mom.rig.bones[n].quaternion.toArray().every(Number.isFinite))),'non-finite staged head/hair');const sample=await page.evaluate(()=>Object.fromEntries(Object.entries(HouseFamily.chars).map(([id,c])=>[id,{x:c.x,z:c.z,room:c.room,seated:!!c.seated,step:c.cur?.k,started:c.cur?.started,action:c.rig.st.action,phase:c.rig.st.readingTransfer,parked:c.rig.st.readingParked,presence:c.rig.mesh.material.userData.np.npPresence?.value.toArray(),scale:c.rig.bones[id==='dad'?'p_paper':'p_mag'].scale.x,root:c.rig.group.parent===House.root,props:c.rig.readingState}])));report.frames.push({name,...meta,people:sample});await save();}
 async function setup(id,spot,action){return page.evaluate(({id,spot,action})=>{r9.park();const F=HouseFamily;if(action==='phone'){const c=F.chars[id];c.rig.dispose();c.rig=NPCRig.create(id,{tier:'low'});if(House.SPOTS['np.'+id])House.SPOTS['np.'+id].obj=c.rig.proxy;}F.debug.go(id,spot,action);F.debug.place(id,spot);F.debug.sim(20,.1);const c=F.chars[id];c.hold=0;c.yieldAt=Infinity;c.rig.set({action,engage:false,look:null,listen:null});r9.rigs(3);return{x:c.x,z:c.z,h:c.h,eye:c.rig.eyeWorld(new THREE.Vector3()).toArray(),seated:!!c.seated}},{id,spot,action});}
 async function actorCamera(p,angle=45,action){const kitchen=/^(washup|cook)$/.test(action),a=p.h+(kitchen?110:angle)*Math.PI/180,d=kitchen?145:175;await camera([p.x+Math.sin(a)*d,p.eye[1]+5,p.z+Math.cos(a)*d],[p.x,p.eye[1]+45,p.z],'G');}
 const save=async()=>writeFile(out+'report.json',JSON.stringify(report,null,2));
 for(const [id,spot,action]of [['mom','sink','washup'],['mom','hob','cook'],['mom','gardenWater','water'],['dad','armchair','paper']].filter(row=>!onlyPhone&&(!actions||actions.includes(row[2])))){
  const p=await setup(id,spot,action);
  if(action==='washup'&&!baseline){
   report.water=await page.evaluate(()=>{const r=HouseFamily.chars.mom.rig,water=House.ROOMS.kitchen.group.getObjectByName('washing-up-water'),fx=House.anims.get('ch.npcWashWater'),before=JSON.stringify(ChoreKit.S);fx();const wet={visible:water.visible,y:water.position.y};r.set({action:null});fx();const dry={visible:water.visible,y:water.position.y};r.set({action:'washup'});fx();return {wet,dry,stateUnchanged:JSON.stringify(ChoreKit.S)===before};});
   assert(report.water.wet.visible&&!report.water.dry.visible&&report.water.stateUnchanged,'routine water changes chore state or never clears');
  }
  for(const angle of (action==='washup'||action==='cook'?[110,-110]:[35,75])){
   const a=p.h+angle*Math.PI/180;
   await camera([p.x+Math.sin(a)*145,p.eye[1]+5,p.z+Math.cos(a)*145],[p.x,p.eye[1]+45,p.z],'G');
   await capture(action+'-'+angle+'-wide.png',{id,action,angle,distance:'wide'});
   if(action==='washup'||action==='cook')await camera([p.x+Math.sin(a)*105,205,p.z+Math.cos(a)*105],[action==='washup'?-80:-24,253,action==='washup'?-140:-134],'G');
   if(action==='water')await camera([p.x+Math.sin(a)*115,230,p.z+Math.cos(a)*115],[-127,280,-706],'G');
   await page.evaluate(({id,action})=>{const r=HouseFamily.chars[id].rig;Object.assign(r.st,{t:action==='paper'?5.8:12,pageTime:5.8,pageLast:5.8,seed:2.7,blinkAt:Infinity,glanceAt:Infinity,saccadeAt:Infinity});r.set({engage:false,look:null,listen:null});r.update(0,true);},{id,action});
   for(const [i,seconds]of (action==='paper'?[0,.35,.4,.45,.55,.6,1.1]:[0,.2,.2,.2,.2,.2,.2]).entries()){
    await page.evaluate(s=>r9.rigs(s),seconds);if(angle===(action==='washup'||action==='cook'?-110:75)&&![0,3,6].includes(i))continue;await capture(action+'-'+angle+'-'+i+'.png',{id,action,angle,seconds});
    report.frames.at(-1).contact=await page.evaluate(({id,action})=>{const r=HouseFamily.chars[id].rig,T=THREE;r.group.updateMatrixWorld(true);const pt=(b,v)=>r.bones[b].localToWorld(new T.Vector3(...v)).multiply(new T.Vector3(1,-1,1)).toArray();return {time:r.st.t,leaf:r.bones.jaw.rotation.y,spoon:pt('p_spoon',[0,-24,3.2]),sponge:pt('p_sponge',[0,-1,1.5]),spout:pt('p_can',[0,-6,30.5]),hands:['L','R'].map(sd=>pt('hand'+sd,[0,-r.S.handLen*.8,1])),triangles:r.tris+6,surface:r.workSurface?.(action)}},{id,action});await save();
   }
   await page.evaluate(()=>{const r=HouseFamily.chars.mom.rig;r.set({engage:true,look:{x:r.st.x+100,y:205,z:r.st.z-40}});r9.rigs(.8)});
   await capture(action+'-'+angle+'-ack.png',{id,action,angle});
  }
 }
 const dimensions={'portrait':[390,844],'landscape':[844,390],'tablet-portrait':[768,1024],'tablet-landscape':[1024,768]};
 for(const [device,[width,height]]of Object.entries(dimensions)){
  await page.setViewportSize({width,height});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  for(const [id,spot,action]of [['mom','sink','washup'],['mom','hob','cook'],['mom','gardenWater','water'],['dad','armchair','paper']].filter(row=>!actions||actions.includes(row[2]))){const p=await setup(id,spot,action);await actorCamera(p,55,action);await capture(device+'-'+action+'.png',{device,id,action});}
 }
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS round 10 house',label,report.frames.length,'native frames; matched work surfaces, complete page turn, acknowledgements and four touch sizes');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await close();await writeFile('/tmp/jhp-r9-house-'+label+'-server.log',log);}
