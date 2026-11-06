// Matched production-house sequences. Only starting poses/destinations are staged;
// the existing family controller, rig, door animation and room geometry do the work.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
// This harness produces art evidence; functional-gate raster caps must not blur it.
delete process.env.FIXTURE_RASTER_RATIO;
const root=new URL('../',import.meta.url).pathname;
const arg=(k,d)=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1]||d;
const label=arg('label','r3-after'),baseline=process.argv.includes('--baseline');assert(/^[a-z0-9-]+$/.test(label));
const people=arg('people','mom,dad,sister').split(','),devices=arg('devices','desktop,phone,landscape,tablet').split(','),states=process.argv.includes('--seats-only')?[]:arg('only','walk,stairs-up,stairs-down,door,job,sit,stand,talk,carry').split(',');
const distances=arg('distance','near,far').split(','),out=root+'tests/shots/models/'+label+'/house/';
const reference=arg('reference',label.startsWith('r4-')?'r4-before':'r3-before');assert(/^[a-z0-9-]+$/.test(reference));
const matched=baseline?{}:Object.fromEntries(JSON.parse(await readFile(root+'tests/shots/models/'+reference+'/house/report.json','utf8').catch(()=>'{"frames":[]}')).frames.map(f=>[f.name,f]));
let server,fixture,data,log='',closing;const report={label,baseline,base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),frames:[]};
if(process.argv.includes('--append'))Object.assign(report,JSON.parse(await readFile(out+'report.json','utf8').catch(()=>'{"frames":[]}')));
async function close(){return closing||=(async()=>{await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
const watchdog=setTimeout(async()=>{console.error('HOUSE R3 timeout');await close();process.exit(1)},1800000);
try{
 await mkdir(out,{recursive:true});data=await mkdtemp('/tmp/jhp-model-r2-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,account='ModelR2',password='Throwaway-1999';
 for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 fixture=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,seed:1999,hour:process.argv.includes('--reload-matrix')?null:18,tier:'low',storageState:await bonfireLogin(base,password,account,{pv:10,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{
  if(process.argv.includes('--reload-matrix'))await p.addInitScript(()=>{Date.prototype.getMonth=()=>9;Date.prototype.getDate=()=>12;Date.prototype.getDay=()=>2;Date.prototype.getHours=()=>Number(localStorage.getItem('r4hour')||19.2);Date.prototype.getMinutes=()=>0;Date.prototype.getSeconds=()=>0;});
  if(baseline)for(const file of ['np-rig.js','np-life.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
  await p.addInitScript(()=>{const original=setInterval;window.__familyTimers=[];window.setInterval=(fn,ms,...a)=>{const id=original(fn,ms,...a);if(String(fn).includes('lastFrame'))__familyTimers.push(id);return id;};});
 }});
 const {page,until,errors}=fixture;report.rasterCap=Number(process.env.FIXTURE_RASTER_RATIO)||null;await until(()=>!!window.HouseFamily?.ready);
 const initHouse=()=>{
  const H=House,F=HouseFamily;H.hush();H._.setMode('focus');HousePause.close();__familyTimers.forEach(clearInterval);H.anims.delete('np');
  const set=H.anims.set.bind(H.anims),doors=new Map();H.anims.set=(k,v)=>{if(k==='np')return H.anims;if(k.startsWith('door:')){doors.set(k,v);return H.anims;}return set(k,v);};
  for(const room of ['hall','landing','kitchen','lounge'])H.buildRoom(H.ROOMS[room]);
  F.debug.clock({md:1012,dow:2,t:18.1});F.debug.speech.freeze=true;
  window.r2={clock:performance.now.bind(performance),now:performance.now(),doors,id:null,elapsed:0};
  r2.step=seconds=>{const dt=1/60,clock=r2.clock;try{for(let t=0;t<seconds-1e-6;t+=dt){r2.now+=dt*1000;performance.now=()=>r2.now;if(r2.stairTurn){const c=F.chars[r2.id];r2.turnElapsed+=dt;c.h=r2.turnFrom+Math.min(Math.PI/2,r2.turnElapsed*2);c.v=0;c.rig.root(c.x,c.rig.st.y,c.z,c.h,0);}else F.debug.frame(r2.now,dt);for(const [key,fn]of doors)if(!fn(r2.now,dt))doors.delete(key);for(const c of Object.values(F.chars))if(c.present)c.rig.update(dt,true);}}finally{performance.now=clock;}H.dirty();};
  r2.setup=(id,state)=>{
   r2.doors.clear();r2.stairTurn=false;r2.turnElapsed=0;r2.id=id;r2.state=state;r2.elapsed=0;r2.now=performance.now();F.debug.speech.q.length=0;F.debug.speech.cur=null;F.debug.speech.voice=null;F.debug.speech.until=0;F.debug.speech.hard=0;NPCBubble.clear();
   let n=0;for(const c of Object.values(F.chars)){c.hold=0;c.talking=false;c.backoff=c.backHome=c.aside=c.pass=null;c.rig.hush();if(c.id!==id){const key='r2park'+n;F.debug.spots[key]={lvl:'U',x:-170+n++*70,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);}}
   const q=F.debug.spots;let start,end,act;
   if(state==='job'){start={mom:'sink',dad:'armchair',sister:'sofaR'}[id];act=id==='sister'?'draw':undefined;}
   else if(state==='sit'||state==='stand')start={mom:'sofaL',dad:'armchair',sister:'sofaR'}[id];
   else if(state==='door'){q.r2start={lvl:'G',x:270,z:190,face:-90};q.r2end={lvl:'G',x:60,z:190,face:-90};start='r2start';end='r2end';H.setDoor('kitchen',false,true);}
   else if(state.startsWith('stairs')){const down=state.endsWith('down');q.r2start={lvl:down?'U':'G',x:371.5,z:down?214:634,face:down?0:180};q.r2end={lvl:down?'G':'U',x:371.5,z:down?634:214,face:down?0:180};start='r2start';end='r2end';}
   else {q.r2start={lvl:'G',x:260,z:600,face:180};q.r2end={lvl:'G',x:260,z:350,face:180};start=state==='carry'?'kmug2':'r2start';end=state==='walk'||state==='stop'?'r2end':null;act=state==='carry'?'mug':undefined;}
   F.debug.go(id,start,act);F.debug.place(id,start);r2.step(state==='job'||state==='carry'?3:.1);
   const c=F.chars[id];if(end)F.debug.go(id,end);
   if(state==='job'){for(let n=0;n<600&&c.cur?.k!=='act';n++){r2.step(1/60);if(n%120===0)console.log('JOB SEEK',id,n,c.cur?.k,c.x,c.z,c.hold); }if(c.cur?.k!=='act')throw Error('Job never began '+id+' '+c.cur?.k);r2.step(2);}
   if(state==='door'){for(let n=0;n<900&&!c.cur?.reach;n++)r2.step(1/60);}
   if(state.startsWith('stairs-turn')){const down=state.endsWith('down');for(let n=0;n<900&&(down?c.z<280:c.z>580);n++)r2.step(1/60);c.v=0;c.hold=99;c.rig.root(c.x,c.rig.st.y,c.z,c.h,0);r2.turnFrom=c.h;r2.stairTurn=true;}
   if(state==='stop'){for(let n=0;n<1200;n++){if(c.cur?.k==='route'&&c.cur.r&&c.cur.r.len-c.cur.s<70&&c.v>0)break;r2.step(1/60);}}
   if(state==='turn'){q.r3turn={lvl:'G',x:c.x,z:c.z,face:0};F.debug.go(id,'r3turn');}
   if(state==='sit'){for(let n=0;n<1200&&c.cur?.k!=='sit';n++)r2.step(1/60);}
   if(state==='stand'){r2.step(8);q.r2end={lvl:'G',x:30,z:500,face:0};F.debug.go(id,'r2end');for(let n=0;n<1200&&c.cur?.k!=='stand';n++)r2.step(1/60);}
   Object.assign(c.rig.st,{t:12,seed:2.7,blinkAt:13.1,glanceAt:100,saccadeAt:100});
   if(state==='talk'){c.rig.talk(6000,'That looks all right. Shall we try it?');c.rig.set({engage:true});}
  };
  r2.capture=(id,state,dist,targetTime,camera)=>{
   r2.step(targetTime-r2.elapsed);r2.elapsed=targetTime;const c=F.chars[id];
   const near=dist==='near';let eye,level='G';
   if(state==='stairs-down'||state==='stairs-turn-down'){eye=near?[285,-70,380]:[285,-70,620];level='U';}
   else if(state==='stairs-up'||state==='stairs-turn-up'){eye=near?[230,210,680]:[371,-70,215];level=near?'G':'U';}
   else if(state==='door')eye=near?[290,210,375]:[285,210,590];
   else if(state==='stop')eye=near?[275,210,630]:[390,210,680];
   else if(state==='job'||state==='sit'||state==='stand')eye=id==='mom'&&state==='job'?(near?[130,210,-90]:[130,210,240]):id==='dad'?(near?[-30,210,490]:[-200,210,610]):(near?[-100,210,410]:[140,210,330]);
   else if(state==='talk')eye=near?[290,210,400]:[275,210,240];
   else if(state==='carry')eye=near?[20,210,220]:[-180,210,240];
   else eye=near?[390,210,680]:[260,210,230];
   const fy=c.rig.st.y,actualTarget=[c.x,fy-c.rig.S.H*.53,c.z],target=camera?.target||actualTarget;if(camera){eye=camera.eye;level=camera.level||level;}
   H.hush();H.setWalkFrom({x:eye[0],y:eye[1],z:eye[2],lvl:level,seat:0});Object.assign(H.P,{x:eye[0],y:eye[1],z:eye[2],lvl:level,seat:0,rx:Math.atan2(-(target[1]-eye[1]),Math.hypot(target[0]-eye[0],target[2]-eye[2]))*180/Math.PI,ry:Math.atan2(target[0]-eye[0],-(target[2]-eye[2]))*180/Math.PI});H._.setMode('focus');
   if(state==='talk'){c.rig.st.talkStart=performance.now()-targetTime*1000;c.rig.st.talkUntil=performance.now()+5000;c.rig.set({look:{x:eye[0],y:eye[1],z:eye[2]},engage:true});c.rig.update(0,true);}
   if(r2.seatSolo)for(const p of Object.values(F.chars))if(p.id!==id&&p.rig)p.rig.group.visible=false;
   H.dirty();H._.renderForBenchmark();let handError=null;const reach=c.rig.contact?.();if(reach&&c.rig.st.contactSide){const palm=c.rig.bones['hand'+c.rig.st.contactSide].localToWorld(new THREE.Vector3(0,-c.rig.S.handLen*.6,c.rig.S.handLen*.12));handError=Math.hypot(palm.x-reach.x,palm.y+reach.y,palm.z-reach.z);}
   return {eye,target,actorTarget:actualTarget,actorRange:Math.hypot(eye[0]-actualTarget[0],eye[1]-actualTarget[1],eye[2]-actualTarget[2]),level,handError,handle:reach?{...reach}:null,contactK:c.rig.st.contactK||0,range:Math.hypot(eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]),x:c.x,z:c.z,step:c.cur?.k,action:c.rig.st.action,sitK:c.rig.st.sitK,door:House.DOORS.kitchen.ang,tris:c.rig.tris+6};
  };
 };await page.evaluate(initHouse);
 const cdp=await page.context().newCDPSession(page);await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
 for(const device of devices){const viewport={desktop:{width:1366,height:860},phone:{width:390,height:844},landscape:{width:844,height:390},tablet:{width:1024,height:768}}[device];assert(viewport,'Unknown device '+device);await page.setViewportSize(viewport);
  if(device!=='desktop'){await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await page.keyboard.press('Shift');
  for(const id of people)for(const state of states)for(const dist of distances){
   if(state.startsWith('stairs-turn')&&!arg('stair-devices','desktop,phone,landscape,tablet').split(',').includes(device))continue;
   if(process.argv.includes('--fill')&&report.frames.filter(f=>f.device===device&&f.id===id&&f.state===state&&f.dist===dist).length===4)continue;
   console.log('HOUSE',device,id,state,dist);await page.evaluate(({id,state})=>r2.setup(id,state),{id,state});
   for(const [frame,time]of (state==='door'?[.1,.35,.5,.75]:state==='idle'?[.1,2,5,8]:[.1,.4,.8,1.4]).entries()){
    const name=[device,id,state,dist,frame].join('-')+'.png';
    const sample=await page.evaluate(({id,state,dist,time,camera})=>r2.capture(id,state,dist,time,camera),{id,state,dist,time,camera:matched[name]});const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(shot.data,'base64'));report.frames=report.frames.filter(f=>f.name!==name);report.frames.push({name,device,id,state,dist,time,...sample});
   }
   await writeFile(out+'report.json',JSON.stringify(report,null,2));
  }
 }
 if(process.argv.includes('--seat-matrix')){
  report.seatInventory=await page.evaluate(()=>{
   const H=House;
   // In this disposable fixture only, pull the office chair clear of its desk.
   const chair=H.THINGS.chair;if(chair){chair.at.z=90;chair.obj.position.z=90;H.physics.sync('chair');}
   const seats=[...H.ROOMS.lounge.peopleSeats,...H.ROOMS.kitchen.peopleSeats];
   for(const id of ['chair','beanbag']){const t=H.THINGS[id];if(!t?.seat?.person)throw Error('Missing real seat '+id);seats.push({id,room:t.at.room,lvl:H.ROOMS[t.at.room].lvl,x:t.at.x,z:t.at.z,face:(t.at.ry||0)+(t.at.sw||0),...t.seat.person,stagedPull:id==='chair'});}
   return seats;
  });assert.equal(report.seatInventory.length,10,'real indoor seat inventory changed');report.seatFrames=report.seatFrames||[];report.seatChecks=report.seatChecks||[];
  await writeFile(out+'report.json',JSON.stringify(report,null,2));
  for(const id of people)for(const recipe of report.seatInventory){
   if(arg('seats','all')!=='all'&&!arg('seats','all').split(',').includes(recipe.id))continue;
   console.log('REAL SEAT',id,recipe.id);
   const camera=await page.evaluate(({id,recipe})=>{
    const H=House,F=HouseFamily;r2.setup(id,'sit');r2.seatSolo=true;const child=id==='sister',q={...recipe};
    if(q.edge){const a=q.face*Math.PI/180;q.support={side:'L',x:q.x+q.edge.x*Math.cos(a)+q.edge.z*Math.sin(a),y:H.LV[q.lvl]-q.edge.h,z:q.z-q.edge.x*Math.sin(a)+q.edge.z*Math.cos(a),edge:true,yaw:a-Math.PI/2};}
    if(child&&recipe.room==='lounge'){q.hipForward=16;q.footForward=46;q.footH=20;}
    else if(child&&recipe.id!=='beanbag'){q.hipForward=recipe.id==='chair'?8:0;q.footForward=36;q.footH=20;}
    const a=q.face*Math.PI/180,front=q.footForward||54;q.stand=[q.x+Math.sin(a)*front,q.z+Math.cos(a)*front];q.approach=q.stand;
    F.debug.spots.r3seat={lvl:q.lvl,seat:q,act:'sit'};F.debug.go(id,'r3seat','sit');F.debug.place(id,'r3seat');r2.step(1/60);
    const c=F.chars[id];c.hold=0;c.seated=null;c.x=q.stand[0];c.z=q.stand[1];c.h=a;c.lvl=q.lvl;c.rig.set({seat:null,action:null,engage:false,props:{}});c.rig.st.sitK=0;c.rig.teleport(c.x,H.LV[c.lvl],c.z,a);
    for(let n=0;n<120;n++)c.rig.update(1/60,true);
    c.cur={k:'sit',t:0,seat:q};c.plan=[{k:'act'}];r2.elapsed=0;
    let eye=q.room==='lounge'?(q.id==='armchair'?[-30,210,490]:[-100,210,410]):q.room==='kitchen'?(q.face===180?[110,210,-60]:q.face===-90?[-230,210,240]:[130,210,240]):q.id==='beanbag'?[-260,-70,-40]:[100,-70,45];
    return {eye,target:[q.x,H.LV[q.lvl]-q.h-(q.id==='beanbag'?60:42),q.z],level:q.lvl};
   },{id,recipe});
   for(const state of ['sit','stand']){
    if(state==='stand')await page.evaluate(({id})=>{const F=HouseFamily,c=F.chars[id];r2.step(2);F.debug.spots.r3exit={lvl:c.lvl,x:c.cur?.seat?.stand?.[0]??c.x+65,z:c.z+65,face:0};F.debug.go(id,'r3exit');for(let n=0;n<30&&c.cur?.k!=='stand';n++)r2.step(1/60);if(c.cur?.k!=='stand')throw Error('Stand did not begin');r2.elapsed=0;},{id});
    for(const [frame,time]of [.1,.4,.8,1.4].entries()){
     const sample=await page.evaluate(({id,state,time,camera})=>{const f=r2.capture(id,state,'near',time,camera);return {...f,brace:HouseFamily.chars[id].rig.st.seatBraceK||0};},{id,state,time,camera});
     const name=['seat',id,recipe.id,state,frame].join('-')+'.png',shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(shot.data,'base64'));report.seatFrames=report.seatFrames.filter(f=>f.name!==name);report.seatFrames.push({name,id,seat:recipe.id,state,time,...sample});
    }
   }
   await writeFile(out+'report.json',JSON.stringify(report,null,2));
   // Interrupt and restore through the production controller/save functions.
   const checked=await page.evaluate(({id})=>{
    const F=HouseFamily,c=F.chars[id];F.debug.go(id,'r3seat','sit');F.debug.place(id,'r3seat');r2.step(1/60);c.hold=0;c.seated=null;c.cur={k:'sit',t:0,seat:F.debug.spots.r3seat.seat};c.plan=[{k:'act'}];
    r2.step(.25);F.debug.save();const before={x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur.k};F.debug.restore();if(Math.hypot(c.x-before.x,c.z-before.z)>.75||Math.abs(c.rig.st.sitK-before.k)>1e-6)throw Error('Seat restore drift');
    F.debug.go(id,'r3exit');r2.step(1/60);if(c.cur?.k!=='stand'||Math.hypot(c.x-before.x,c.z-before.z)>.75)throw Error('Seat interruption jump '+JSON.stringify({id,before,after:{x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur?.k,hold:c.hold,goal:c.goal?.key}}));
    r2.step(.25);F.debug.save();const k=c.rig.st.sitK;F.debug.restore();if(Math.abs(c.rig.st.sitK-k)>1e-6)throw Error('Stand restore drift');return {sitRestore:true,interrupted:true,standRestore:true};
   },{id});report.seatChecks=report.seatChecks.filter(f=>f.id!==id||f.seat!==recipe.id);report.seatChecks.push({id,seat:recipe.id,...checked});await writeFile(out+'report.json',JSON.stringify(report,null,2));
  }
  console.log('PASS REAL SEATS',report.seatChecks.length,'combinations',report.seatFrames.length,'frames');
 }
 if(process.argv.includes('--reload-matrix')){
  report.reloads=report.reloads||[];
  await page.addInitScript(()=>{
   let event;Object.defineProperty(window,'Bonfire',{configurable:true,get:()=>event,set:v=>{event=v;if(v)v.familyGoal=()=>null;}});
   let wrapped=false;const stop=setInterval(()=>{
    if(window.House&&!wrapped){wrapped=true;const set=House.anims.set.bind(House.anims);House.anims.set=(k,v)=>k==='np'?House.anims:set(k,v);}
    if(!window.HouseFamily?.ready)return;clearInterval(stop);__familyTimers.forEach(clearInterval);House.anims.delete('np');House.hush();House._.setMode('focus');
    const id=localStorage.getItem('r4id'),c=HouseFamily.chars[id];if(c)window.__seatResumed={x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur?.k,goal:c.goal?.key};
   },1);
  });
  for(const [id,key,hour,next]of [['mom','sofaL',19.2,21.2],['dad','armchair',17.7,18.2],['sister','sofaR',17.9,18.7]])for(const state of ['sit','stand']){
   if(!arg('reload-people','mom,dad,sister').split(',').includes(id)||!arg('reload-states','sit,stand').split(',').includes(state))continue;
   if(process.argv.includes('--fill')&&report.reloads.some(r=>r.id===id&&r.state===state))continue;
   console.log('REAL RELOAD',id,key,state);
   const before=await page.evaluate(({id,key,hour,next,state})=>{
    const F=HouseFamily,c=F.chars[id];r2.setup(id,'sit');if(window.Bonfire)Bonfire.familyGoal=()=>null;localStorage.setItem('r4hour',hour);localStorage.setItem('r4id',id);F.debug.clock(null);F.debug.go(id,null);F.debug.place(id,key);
    for(let n=0;n<1800&&c.cur?.k!=='sit';n++)r2.step(1/60);if(c.cur?.k!=='sit')throw Error('Natural sit did not begin '+id);
    if(state==='stand'){
     r2.step(3);localStorage.setItem('r4hour',next);F.debug.clock(null);
     for(let n=0;n<1800&&c.cur?.k!=='stand';n++)r2.step(1/60);if(c.cur?.k!=='stand')throw Error('Natural stand did not begin '+id);
    }
    r2.step(.3);F.debug.save();House.saveWalkState();return {x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur.k,goal:c.goal.key};
   },{id,key,hour,next,state});
   await fixture.view([-100,210,410],await page.evaluate(id=>{const c=HouseFamily.chars[id];return [c.x,c.rig.st.y-c.rig.S.H*.53,c.z]},id),{level:'G'});
   await page.evaluate(()=>{House._.renderForBenchmark();House.saveWalkState();});await page.screenshot({path:out+'reload-'+id+'-'+state+'-before.png'});
   await page.reload({waitUntil:'domcontentloaded',timeout:120000});await until(()=>!!window.__seatResumed);
   const after=await page.evaluate(()=>__seatResumed);assert.equal(after.step,before.step);assert.equal(after.goal,before.goal);assert(Math.hypot(after.x-before.x,after.z-before.z)<2);assert(Math.abs(after.k-before.k)<.12);
   await until(()=>House.live&&!document.querySelector('.hs-loading,#houseEntry'));await fixture.view([-100,210,410],await page.evaluate(id=>{const c=HouseFamily.chars[id];return [c.x,c.rig.st.y-c.rig.S.H*.53,c.z]},id),{level:'G'});await page.evaluate(()=>{House.buildRoom(House.ROOMS.lounge);House._.renderForBenchmark();});await page.screenshot({path:out+'reload-'+id+'-'+state+'-after.png'});
   report.reloads.push({id,key,state,before,after});await writeFile(out+'report.json',JSON.stringify(report,null,2));
   await page.evaluate(initHouse);await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
  }
  console.log('PASS REAL RELOADS',report.reloads.length);
 }
 if(process.argv.includes('--verify-seats')){
  report.seats=await page.evaluate(()=>{
   const F=HouseFamily,H=House,results=[];
   const sample=c=>({x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur?.k});
   const check=(a,b,label)=>{if(Math.hypot(a.x-b.x,a.z-b.z)>.75||Math.abs(a.k-b.k)>1e-6||a.step!==b.step)throw Error(label+JSON.stringify([a,b]));};
   for(const id of ['mom','dad','sister'])for(const key of ['sofaL','sofaR','armchair']){
    r2.setup(id,'sit');F.debug.go(id,key);F.debug.place(id,key);const c=F.chars[id];
    for(let n=0;n<1800&&c.cur?.k!=='sit';n++)r2.step(1/60);if(c.cur?.k!=='sit')throw Error(id+' cannot sit at '+key);
    r2.step(.35);let before=sample(c);F.debug.save();F.debug.restore();check(before,sample(c),id+key+' sit restore ');
    const storageKey=Object.keys(localStorage).find(k=>k.startsWith('jhp_np_v1.'));const legacy=JSON.parse(localStorage.getItem(storageKey)),pose=legacy.c[id].pose;pose.motion=2;pose.t*=1.1/.7;delete pose.x;delete pose.z;localStorage.setItem(storageKey,JSON.stringify(legacy));F.debug.restore();check(before,sample(c),id+key+' legacy phase restore ');
    F.debug.spots.r2end={lvl:'G',x:30,z:500,face:0};F.debug.go(id,'r2end');r2.step(1/60);
    if(c.cur?.k!=='stand'||Math.hypot(c.x-before.x,c.z-before.z)>.75)throw Error(id+key+' sit interruption ');
    r2.step(.35);before=sample(c);F.debug.save();F.debug.restore();check(before,sample(c),id+key+' stand restore ');
    results.push({id,key,sitRestore:true,legacyRestore:true,interrupted:true,standRestore:true});
   }
   return results;
  });
  // A real page refresh of a naturally scheduled, partly completed sit.
  const before=await page.evaluate(()=>{
   const F=HouseFamily,c=F.chars.sister;if(window.Bonfire)Bonfire.familyGoal=()=>null;F.debug.clock(null);for(const id of ['mom','dad','sister'])F.debug.go(id,null);
   F.debug.place('sister','sofaR');for(let n=0;n<1800&&c.cur?.k!=='sit';n++)r2.step(1/60);
   if(c.cur?.k!=='sit')throw Error('Scheduled sister sit did not begin');r2.step(.35);F.debug.save();House.saveWalkState();
   return {x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur.k,goal:c.goal.key};
  });
  await fixture.view([-100,210,410],await page.evaluate(()=>{const c=HouseFamily.chars.sister;return [c.x,c.rig.st.y-c.rig.S.H*.53,c.z]}),{level:'G'});
  await page.evaluate(()=>{House._.renderForBenchmark();House.saveWalkState();});await page.screenshot({path:out+'refresh-before.png'});
  await page.addInitScript(()=>{let event;Object.defineProperty(window,'Bonfire',{configurable:true,get:()=>event,set:v=>{event=v;if(v)v.familyGoal=()=>null;}});let wrapped=false;const stop=setInterval(()=>{if(window.House&&!wrapped){wrapped=true;const set=House.anims.set.bind(House.anims);House.anims.set=(k,v)=>k==='np'?House.anims:set(k,v);}
   if(!window.HouseFamily?.ready)return;clearInterval(stop);__familyTimers.forEach(clearInterval);House.anims.delete('np');House.hush();House._.setMode('focus');const c=HouseFamily.chars.sister;window.__seatResumed={x:c.x,z:c.z,k:c.rig.st.sitK,step:c.cur?.k,goal:c.goal?.key};},1);});
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});await until(()=>!!window.__seatResumed);
  const after=await page.evaluate(()=>__seatResumed);assert.equal(after.step,before.step);assert.equal(after.goal,before.goal);assert(Math.hypot(after.x-before.x,after.z-before.z)<2);assert(Math.abs(after.k-before.k)<.12);
  await until(()=>House.live&&!document.querySelector('.hs-loading,#houseEntry'));
  await fixture.view([-100,210,410],await page.evaluate(()=>{const c=HouseFamily.chars.sister;return [c.x,c.rig.st.y-c.rig.S.H*.53,c.z]}),{level:'G'});await page.evaluate(()=>{House.buildRoom(House.ROOMS.lounge);House._.renderForBenchmark();});await page.screenshot({path:out+'refresh-after.png'});
  report.refresh={before,after};console.log('PASS seats',report.seats.length,'and real mid-sit refresh');await writeFile(out+'report.json',JSON.stringify(report,null,2));
 }
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS HOUSE R3',report.frames.length);
}finally{clearTimeout(watchdog);await writeFile('/tmp/jhp-model-r3-house-server.log',log);await close();}
