// Walking lens/eye and CSS/WebGL alignment on disposable data, with native-lens room captures.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const baseline=process.argv.includes('--baseline'),expectedEye=baseline?128:143,app=process.argv.find(a=>a.startsWith('--app-root='))?.slice(11)||root+'app';
const shots=root+'tests/shots/camera-lens/'+(baseline?'before/':'');await mkdir(shots,{recursive:true});
const data=await mkdtemp('/tmp/jhp-camera-lens-');
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const server=spawn(process.execPath,['server.js'],{cwd:app,env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
let log='',f;for(const out of [server.stdout,server.stderr])out.on('data',c=>log+=c);
const report=[];
try{
 const base='http://localhost:'+port;
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
 const account='Camera'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 f=await roomFixture(base,{account,password,signup:false,touch:true});
 const{page,until,view,errors}=f;
 await page.evaluate(()=>{Room.ensureHouse();HouseFamily.debug.hide(true);});
 for(const[width,height]of [[1366,860],[1920,1080],[390,844],[844,390],[768,1024],[1024,768]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{const H=House;H.hush();H.setWalkFrom({x:30,y:73-(H.STAND||128),z:150,lvl:'U',seat:0});H._.setMode('walk');H.dirty();});
  await until(()=>Math.abs(House.W.eyeNow-(House.STAND||128))<.1&&Math.abs(House.P.y-(House.W.fy-(House.STAND||128)))<.2);
  await page.waitForTimeout(1200);
  const m=await page.evaluate(()=>{
   const H=House,v=H.camera.fov,h=2*Math.atan(Math.tan(v*Math.PI/360)*innerWidth/innerHeight)*180/Math.PI;
   return{width:innerWidth,height:innerHeight,vertical:v,horizontal:h,eye:H.W.eyeNow,stand:H.STAND||128,css:parseFloat(getComputedStyle(document.querySelector('#bootPower .pc-stage')).perspective),focal:innerHeight/(2*Math.tan(v*Math.PI/360))};
  });
  assert.equal(m.stand,expectedEye);assert(Math.abs(m.eye-expectedEye)<.1,'Standing eye did not settle');
  if(!baseline)assert(m.horizontal<=95.1,'Walking lens is too wide');
  if(!baseline&&width<height)assert(m.horizontal>=49.9,'Portrait view is too narrow');
  else if(!baseline&&width/height<=1.8)assert(Math.abs(m.vertical-60)<.2,'Desktop/tablet walking lens is not 60 degrees');
  assert(Math.abs(m.css-m.focal)<1,'CSS and WebGL focal lengths diverged: '+JSON.stringify(m));
  report.push(m);console.log('LENS '+JSON.stringify(m));
  for(const[name,lvl,eye,target]of [
   ['bedroom','U',[225,73-expectedEye,215],[-220,20,-20]],
   ['hall','G',[300,353-expectedEye,650],[260,220,100]],
   ['lounge','G',[180,353-expectedEye,640],[-240,250,360]],
   ['drive','G',[300,353-expectedEye,740],[430,260,1030]],
  ]){
   await view(eye,target,{level:lvl});await page.screenshot({path:shots+`${width}x${height}-${name}.png`});
   const field=await page.evaluate(()=>House.camera.fov);assert(Math.abs(field-m.vertical)<.2,'Gallery silently changed the walking lens');
  }
 }
 // Legacy standing saves keep their location and mode when the eye height changes.
 await page.setViewportSize({width:1366,height:860});
 await page.evaluate(()=>{const H=House;H.hush();H.setWalkFrom({x:30,y:73-(H.STAND||128),z:150,lvl:'U',seat:0});H._.setMode('walk');H.saveWalkState();for(const key of ['jhp_hs_pose','jhp_hs_stand']){const v=JSON.parse(localStorage.getItem(key)||'null');if(v){if(v.p)v.p.y=73-128;else v.y=73-128;localStorage.setItem(key,JSON.stringify(v));}}});
 await page.reload({waitUntil:'domcontentloaded',timeout:120000});
 await until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
 const pose=await page.evaluate(()=>({x:House.W.x,z:House.W.z,mode:House.mode,eye:House.W.eye}));
 assert.equal(pose.mode,'walk');assert(Math.hypot(pose.x-30,pose.z-150)<2,'Legacy pose moved: '+JSON.stringify(pose));assert.equal(pose.eye,expectedEye);
 await page.screenshot({path:shots+'legacy-standing-resume.png'});
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));
 await writeFile(shots+'report.json',JSON.stringify({report,legacy:pose},null,2));
 console.log('PASS camera-lens: six viewports, aligned renderers, native-lens views and legacy standing resume');
}finally{await f?.browser.close();if(server.exitCode===null){server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));}await rm(data,{recursive:true,force:true});}
