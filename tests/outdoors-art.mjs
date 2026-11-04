// Repeatable outdoor cameras, native pixels, one browser; disposable localhost only.
// OUTDOORS_BEFORE_REF pins the original source even after a review commit/merge.
// OUTDOORS_RUN keeps distinct review rounds; reports record each source revision.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert(['before','after'].includes(tag));
const run=process.env.OUTDOORS_RUN||'';assert(!run||/^[a-z0-9-]+$/.test(run));
const beforeRef=process.env.OUTDOORS_BEFORE_REF||'HEAD';assert(/^[a-zA-Z0-9_.\/-]+$/.test(beforeRef));
const revision=execFileSync('git',['rev-parse',tag==='before'?beforeRef:'HEAD'],{encoding:'utf8'}).trim();
const sources={};for(const file of ['hs-world.js','hs-house.js','hs-environment.js'])sources[file]=tag==='before'?execFileSync('git',['show',beforeRef+':app/public/js/'+file],{encoding:'utf8',maxBuffer:8*1024*1024}):await readFile(new URL('../app/public/js/'+file,import.meta.url),'utf8');
const sourceHash=createHash('sha256').update(Object.entries(sources).map(([file,body])=>file+'\0'+body).join('\0')).digest('hex');
const dir=new URL(`./shots/outdoors/${run?run+'/':''}${tag}/`,import.meta.url).pathname;
await mkdir(dir,{recursive:true});
const views=[
 ['jack-lawn','G',[-150,210,905],[1700,115,2400]],
 ['jack-owner','G',[160,210,760],[-1400,135,1700]],
 ['owner-door','G',[305,210,690],[-700,175,1800]],
 ['owner-window','G',[-70,210,685],[-800,175,2100]],
 ['jack-door','G',[295,210,680],[1500,155,2100]],
 ['front-west','G',[220,210,1270],[-1100,160,1000]],
 ['street-east','G',[320,210,1490],[2600,120,2450]],
 ['street-west','G',[320,210,1490],[-2600,120,2450]],
 ['kerb-detail','G',[575,210,1510],[675,353,1568]],
 ['rear-garden','G',[120,210,-250],[-20,155,-2050]],
 ['rear-house','G',[20,210,-1360],[30,35,-56]],
 ['rear-east','G',[-210,210,-1010],[1600,80,-1650]],
 ['bedroom-window','U',[75,-70,145],[190,-65,-56]],
 ['kitchen-window','G',[-100,210,-40],[-100,145,-1600]],
 ['kitchen-side','G',[80,210,-20],[195,189,-120]],
];
const password='Throwaway-1999';
await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})});
const f=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password),seed:1999,onPage:async p=>{
 if(tag==='before')for(const [file,body]of Object.entries(sources))await p.route('**/js/'+file+'*',r=>r.fulfill({body,contentType:'application/javascript'}));
}});
async function outdoorPlan(){
 const plan=await f.page.evaluate(()=>{
   const floor=(x,z)=>!!House._.floorAt(x,z,'G',353);
   return{leftBlocked:!floor(-340,1000),rightBlocked:!floor(721,1000),mowing:[780,1000,1250].every(z=>floor(-310,z)),path:[800,950,1250,1410].every(z=>floor(290,z)),drive:[[660,780],[660,1000],[660,1280],[560,1410]].every(([x,z])=>floor(x,z)),rearBoundary:!floor(-335,-500)&&!floor(435,-500)&&floor(-305,-210)&&floor(405,-95)};
  });
 assert(plan.leftBlocked&&plan.rightBlocked,'Garden boundaries must be solid');
 assert(plan.mowing&&plan.path&&plan.drive,'Keep mowing, gate and route past car clear');
 assert(plan.rearBoundary,'Rear fence approaches and both side boundaries remain intact');
 return plan;
}
const report=JSON.parse(await readFile(dir+'report.json','utf8').catch(()=>'[]'));
try{
 await f.page.evaluate(async()=>{
  for(const r of Object.values(House.ROOMS))House.buildRoom(r);
  await Chores.load();for(const id of ['bedroom','hall','lounge','kitchen','drive','garden'])await Chores.part(id);
  House.adapt(3,{pin:true,force:true});
  for(const id of ['front','kitchen','back','bedroom'])if(House.DOORS[id])House.setDoor(id,true,true);
  HouseFamily?.debug.clock({md:1016,dow:6,t:9.5});HouseFamily?.debug.sim(150,.1);
  window.__outdoorChoresReady=false;Net.on('chMe',m=>{if(m?.day)window.__outdoorChoresReady=true});Net.send({t:'chMe'});
 });
 // Wait for real construction, not elapsed shared-host time, before settling
 // the batches and sampling the next rendered frame.
 await f.until(()=>!!(window.__outdoorChoresReady&&HouseFamily?.ready&&ChoreKit?.MODS.lawn&&House.SPOTS['ch.mower']));
 await f.page.evaluate(()=>{for(const r of Object.values(House.ROOMS))HouseStatic?.merge(r.group);House.dirty()});
 if(tag==='after'&&process.env.OUTDOORS_WALK==='1')console.log('PREFLIGHT',JSON.stringify(await outdoorPlan()));
 const cdp=await f.page.context().newCDPSession(f.page);
 const modes=[['desktop',false,1366,860],['phone',true,390,844]];
 if(process.env.OUTDOORS_EXTRA==='1')modes.push(['phone-landscape',true,844,390],['tablet-portrait',true,768,1024],['tablet-landscape',true,1024,768]);
 for(const [mode,phone,width,height]of modes){
  if(process.env.OUTDOORS_MODES&&!process.env.OUTDOORS_MODES.split(',').includes(mode))continue;
  await f.page.setViewportSize({width,height});
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:phone,maxTouchPoints:1});
  if(phone){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:387,y:6}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await f.page.keyboard.press('Shift');
  await f.page.evaluate(phone=>{House.Q.mob=phone;HousePause.close();House.dirty()},phone);
  for(const [phase,hour]of [['day',14],['night',21],['dusk',18],['dawn',7]]){
   if(process.env.OUTDOORS_PHASES&&!process.env.OUTDOORS_PHASES.split(',').includes(phase))continue;
   await f.page.evaluate(({phase,hour})=>{window.auditHour=hour;const c=document.getElementById('bootPower').classList;for(const p of ['day','night','dawn','dusk'])c.toggle('rm-'+p,p===phase);House.relight();HouseEnvironment.update();House.dirty()},{phase,hour});
   for(const [name,level,eye,target]of views){
    if(process.env.OUTDOORS_ONLY&&!process.env.OUTDOORS_ONLY.split(',').includes(name))continue;
    if(['dusk','dawn'].includes(phase)&&process.env.OUTDOORS_TRANSITION_VIEWS&&!process.env.OUTDOORS_TRANSITION_VIEWS.split(',').includes(name))continue;
    if(name==='kitchen-window')await f.page.evaluate(()=>HouseFamily.debug.hide(true));
    await f.view(eye,target,{level});
    await f.page.evaluate(()=>{window.__outdoorFrame=House.ren.info.render.frame;House.dirty()});
    await f.until(()=>House.ren.info.render.frame>window.__outdoorFrame);
    const file=`${mode}-${phase}-${name}.png`;
    await f.page.screenshot({path:dir+file});
    const info=await f.page.evaluate(()=>{let lights=0;House.root.traverse(o=>{if(o.isLight)lights++});const fog=House.scene.fog;return{calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles,room:House.here,touch:GameInput.touch,rung:House.Q.adapt,lights,car:House.ROOMS.drive.car.present,fog:fog?{near:fog.near,far:fog.far,color:fog.color.getHexString()}:null,cameraFar:House.camera.far}});
    if(process.env.OUTDOORS_CLEAR_AIR==='1'){
     assert.equal(info.cameraFar,11000,'keep the distant closed street ends inside the view');
     if(info.fog){assert.equal(info.fog.near,5000);assert.equal(info.fog.far,35000);assert.equal(info.fog.color,{day:'cedadf',night:'26344b',dusk:'d89774',dawn:'ddb69a'}[phase],'fog matches the actual sky horizon');}
    }
    const old=report.findIndex(r=>r.file===file);if(old>=0)report.splice(old,1);
    report.push({file,eye,target,revision,sourceHash,...info});
    await writeFile(dir+'report.json',JSON.stringify(report,null,2));console.log('SHOT',file,JSON.stringify(info));
    if(name==='kitchen-window')await f.page.evaluate(()=>HouseFamily.debug.hide(false));
   }
  }
 }
 if(tag==='after'&&process.env.OUTDOORS_WALK==='1'){
  await f.page.evaluate(()=>{HouseFamily.debug.hide(true);House.hush();HousePause.close()});
  const plan=await outdoorPlan();
  console.log('OUTDOOR PLAN',JSON.stringify(plan));
  for(const [name,eye,target,reach,check]of [
   ['wall',[-290,210,1000],[-600,210,1000],()=>House.W.x<=-316.5,p=>p.x>=-317.1],
   ['drive-hedge',[665,210,1250],[900,210,1250],()=>House.W.x>=693.5,p=>p.x<=694.1],
   ['pedestrian-gate',[290,210,1300],[290,210,1600],()=>House.W.z>=1410,p=>p.z>=1400],
  ]){
   await f.view(eye,target,{level:'G'});
   await f.page.evaluate(()=>{House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;House.P.y=House.W.fy-House.W.eye;House.dirty()});
   await f.page.keyboard.down('w');try{await f.until(reach)}finally{await f.page.keyboard.up('w')}
   const pose=await f.page.evaluate(()=>({x:House.W.x,z:House.W.z}));assert(check(pose),name+': '+JSON.stringify(pose));
   await f.page.screenshot({path:dir+'walk-'+name+'.png'});console.log('WALK PASS',name,JSON.stringify(pose));
  }
  await f.view([290,210,1210],[100,155,1700],{level:'G'});
  await f.page.evaluate(()=>{
   House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;House.P.y=House.W.fy-House.W.eye;
   const cube=House.THINGS.cube;if(!cube)throw Error('Missing persistence fixture cube');
   cube.at={room:'drive',x:660,y:353,z:1000,ry:35,hide:false};cube.st='rest';House.ROOMS.drive.things.add(cube.obj);House.place(cube);
   House.saveThings(true);House.saveWalkState();House.dirty();
  });
  const saved=await f.page.evaluate(()=>({power:localStorage.getItem('jhp_off'),cube:{...House.THINGS.cube.at},x:House.W.x,z:House.W.z}));
  for(let n=1;n<=2;n++){
   await f.page.reload({waitUntil:'domcontentloaded'});
   await f.until(()=>!!(window.House?.live&&window.AccountGate?.allowed&&!document.querySelector('.hs-loading,#houseEntry')));
   await f.until(()=>House.mode==='walk');
   await f.until(()=>House.THINGS.cube?.at.room==='drive');
   const pose=await f.page.evaluate(()=>({power:localStorage.getItem('jhp_off'),cube:{...House.THINGS.cube.at},x:House.W.x,z:House.W.z,mode:House.mode,room:House.here}));
   assert.equal(pose.room,'drive');assert.equal(pose.power,saved.power);assert(Math.hypot(pose.x-saved.x,pose.z-saved.z)<.2);
   for(const key of ['x','y','z','ry'])assert(Math.abs(pose.cube[key]-saved.cube[key])<.2,'Saved driveway prop changed '+key);
   await f.page.screenshot({path:dir+'refresh-'+n+'.png'});console.log('REFRESH PASS',n,JSON.stringify(pose));
  }
 }
 assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}
