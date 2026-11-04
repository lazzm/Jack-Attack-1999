// Repeatable outdoor cameras, native pixels, one browser; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert(['before','after'].includes(tag));
const dir=new URL(`./shots/outdoors/${tag}/`,import.meta.url).pathname;
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
 ['rear-garden','G',[120,210,-250],[-20,155,-2050]],
 ['rear-east','G',[-210,210,-1010],[1600,80,-1650]],
 ['bedroom-window','U',[75,-70,145],[190,-65,-56]],
 ['kitchen-window','G',[-100,210,-40],[-100,145,-1600]],
 ['kitchen-side','G',[80,210,-20],[195,189,-120]],
];
const password='Throwaway-1999';
await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})});
const f=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password),seed:1999,onPage:async p=>{
 if(tag==='before')for(const file of ['hs-world.js','hs-house.js','hs-environment.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({body:execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8',maxBuffer:8*1024*1024}),contentType:'application/javascript'}));
}});
const report=JSON.parse(await readFile(dir+'report.json','utf8').catch(()=>'[]'));
try{
 await f.page.evaluate(()=>{
  for(const r of Object.values(House.ROOMS))House.buildRoom(r);
  House.adapt(3,{pin:true,force:true});
  for(const id of ['front','kitchen','back','bedroom'])if(House.DOORS[id])House.setDoor(id,true,true);
  HouseFamily?.debug.clock({md:1016,dow:6,t:9.5});HouseFamily?.debug.sim(150,.1);
 });
 // Let late chore/media geometry arrive, then explicitly settle existing static
 // batches. A first-frame sample otherwise measures startup work as an art change.
 await f.page.waitForTimeout(20000);
 await f.page.evaluate(()=>{for(const r of Object.values(House.ROOMS))HouseStatic?.merge(r.group);House.dirty()});
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
    await f.view(eye,target,{level});
    await f.page.evaluate(()=>House.dirty());await f.page.waitForTimeout(400);
    const file=`${mode}-${phase}-${name}.png`;
    await f.page.screenshot({path:dir+file});
    const info=await f.page.evaluate(()=>{let lights=0;House.root.traverse(o=>{if(o.isLight)lights++});return{calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles,room:House.here,touch:GameInput.touch,rung:House.Q.adapt,lights,car:House.ROOMS.drive.car.present}});
    const old=report.findIndex(r=>r.file===file);if(old>=0)report.splice(old,1);
    report.push({file,eye,target,...info});
    await writeFile(dir+'report.json',JSON.stringify(report,null,2));console.log('SHOT',file,JSON.stringify(info));
   }
  }
 }
 if(tag==='after'&&process.env.OUTDOORS_WALK==='1'){
  await f.page.evaluate(()=>{HouseFamily.debug.hide(true);House.hush();HousePause.close()});
  const plan=await f.page.evaluate(()=>{
   const floor=(x,z)=>!!House._.floorAt(x,z,'G',353);
   return{leftBlocked:!floor(-340,1000),rightBlocked:!floor(721,1000),mowing:[780,1000,1250].every(z=>floor(-310,z)),path:[800,950,1250,1410].every(z=>floor(290,z)),drive:[780,1000,1280,1410].every(z=>floor(660,z)),rearJoin:[[-336,-180],[436,-60]].every(([x,z])=>House._.grids.block.some(b=>b.lvl==='G'&&x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1))};
  });
  assert(plan.leftBlocked&&plan.rightBlocked,'Garden boundaries must be solid');
  assert(plan.mowing&&plan.path&&plan.drive,'Keep mowing, gate and route past car clear');
  console.log('OUTDOOR PLAN',JSON.stringify(plan));
  for(const [name,eye,target,check]of [
   ['wall',[-290,210,1000],[-600,210,1000],p=>p.x>=-317.1],
   ['drive-hedge',[665,210,1250],[900,210,1250],p=>p.x<=694.1],
   ['pedestrian-gate',[290,210,1300],[290,210,1600],p=>p.z>=1400],
  ]){
   await f.view(eye,target,{level:'G'});
   await f.page.evaluate(()=>{House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;House.P.y=House.W.fy-House.W.eye;House.dirty()});
   await f.page.keyboard.down('w');await f.page.waitForTimeout(1800);await f.page.keyboard.up('w');
   const pose=await f.page.evaluate(()=>({x:House.W.x,z:House.W.z}));assert(check(pose),name+': '+JSON.stringify(pose));
   await f.page.screenshot({path:dir+'walk-'+name+'.png'});console.log('WALK PASS',name,JSON.stringify(pose));
  }
  await f.view([290,210,1210],[100,155,1700],{level:'G'});
  await f.page.evaluate(()=>{House.hush();House._.setMode('walk');House.W.eyeNow=House.W.eye;House.P.y=House.W.fy-House.W.eye;House.saveThings(true);House.dirty()});
  await f.page.waitForTimeout(2400);
  const saved=await f.page.evaluate(()=>({power:localStorage.getItem('jhp_off'),things:Apps.loadGame('hs.things',1),x:House.W.x,z:House.W.z}));
  for(let n=1;n<=2;n++){
   await f.page.reload({waitUntil:'domcontentloaded'});
   await f.until(()=>!!(window.House?.live&&window.AccountGate?.allowed&&!document.querySelector('.hs-loading,#houseEntry')));
   await f.until(()=>House.mode==='walk');
   const pose=await f.page.evaluate(()=>({power:localStorage.getItem('jhp_off'),x:House.W.x,z:House.W.z,mode:House.mode,room:House.here}));
   assert.equal(pose.room,'drive');assert.equal(pose.power,saved.power);assert(Math.hypot(pose.x-saved.x,pose.z-saved.z)<.2);
   await f.page.screenshot({path:dir+'refresh-'+n+'.png'});console.log('REFRESH PASS',n,JSON.stringify(pose));
  }
 }
 assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}
