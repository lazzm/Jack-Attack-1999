// Real input approach and F, with stationary actor fixtures in the existing hall.
// The player starts from a normal saved standing pose; no pose/camera teleport API
// is used after load. All measured travel uses keys and look uses mouse/CDP fingers.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import {once} from 'node:events';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const round=process.argv.find(a=>a.startsWith('--round='))?.slice(8)||'r5';assert(/^r[0-9]+[a-z]?$/.test(round));
const __dirname=path.dirname(fileURLToPath(import.meta.url)),root=path.join(__dirname,'..')+path.sep,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=path.join(__dirname,'shots','models',round+'-conversation',label)+path.sep;
const one=process.argv.includes('--one'),selected=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1].split(','),devices=selected('devices')||(one?['desktop']:['desktop','landscape']),people=selected('people')||(one?['mom']:['mom','dad','sister']),ranges=(selected('ranges')||(one?[100]:[200,100,60])).map(Number),comparisonOnly=process.argv.includes('--comparison-only'),report={baseline,navigationRaster:.25,captureRaster:'native requested ratio',setup:'Initial saved standing hall pose; actor-only fixtures; all subsequent player movement/look/F are real input',cases:[]};
let server,fixture,data,log='',closing;
async function close(){return closing||=(async()=>{await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
const watchdog=setTimeout(async()=>{console.error('CONVERSATION runner timeout');await close();process.exit(1)},1200000);
try{
 await mkdir(out,{recursive:true});if(process.argv.includes('--append')){try{Object.assign(report,JSON.parse(await readFile(out+'report.json','utf8')));}catch(e){if(e.code!=='ENOENT')throw e;}}data=await mkdtemp('/tmp/jhp-r5-talk-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 for(const device of devices){
  console.log('DEVICE',device);
  const touch=device==='landscape',width=touch?844:1366,height=touch?390:860;
  fixture=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,hour:14,seed:1999,width,height,touch,contextOptions:touch?{isMobile:true}:{},launchOptions:{args:['--enable-unsafe-swiftshader','--remote-debugging-port=18099']},storageState:await bonfireLogin(base,password,'Jack',{pv:12,x:270,y:210,z:340,rx:0,ry:180,lvl:'G',seat:0}),onPage:async p=>{
   await p.addInitScript(()=>{let renderer,raw,desired=1,limit=.25;setInterval(()=>{if(window.House?.ren&&House.ren!==renderer){renderer=House.ren;raw=renderer.setPixelRatio.bind(renderer);desired=renderer.getPixelRatio();renderer.setPixelRatio=n=>{desired=n;raw(Math.min(n,limit));};raw(Math.min(desired,limit));}window.__r5Raster=n=>{limit=n;if(raw)raw(Math.min(desired,limit));House?.dirty();};},20);});
   if(baseline)for(const file of ['np-rig.js','np-life.js','hs-world.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
  }});
  const {page,until,errors}=fixture,cdp=await page.context().newCDPSession(page);
  async function shot(name){await page.evaluate(()=>{__r5Raster(Infinity);House._.renderForBenchmark();});try{const data=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(data.data,'base64'));}finally{await page.evaluate(()=>__r5Raster(.25));}}await until(()=>!!window.HouseFamily?.ready);
  const position=()=>page.evaluate(()=>({x:House.W.x,z:House.W.z,rx:House.P.rx,ry:House.P.ry}));
  // Explicit owner clock keeps the existing family schedules deterministic.
  await page.evaluate(()=>{HousePause.close();House.hush();HouseFamily.debug.clock({md:1012,dow:2,t:14});for(const d of ['lounge','kitchen'])House.setDoor(d,true,true);});
  const finger=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{id:1,x,y,radiusX:5,radiusY:5,force:1}]});
  async function aim(target){
   const p=await position(),wantRx=Math.atan2(210-target.y,Math.hypot(target.x-p.x,target.z-p.z))*180/Math.PI,wantRy=Math.atan2(target.x-p.x,-(target.z-p.z))*180/Math.PI;
   const da=(wantRy-p.ry+540)%360-180,dp=wantRx-p.rx;
   if(touch){
    let x=width*.72,y=height*.45;await finger('touchStart',x,y);x+=12;await finger('touchMove',x,y);
    for(let n=0;n<12;n++){const q=await position(),dyaw=(wantRy-q.ry+540)%360-180,dpitch=wantRx-q.rx;if(Math.abs(dyaw)+Math.abs(dpitch)<.6)break;const sens=await page.evaluate(()=>HouseTouch.sensitivity),k=150*sens*1.15/Math.min(width,height);x+=Math.max(-24,Math.min(24,dyaw/k));y-=Math.max(-24,Math.min(24,dpitch/k/.8));await finger('touchMove',x,y);await page.waitForTimeout(40);}
    await finger('touchEnd');
   }else if(await page.evaluate(()=>!!document.pointerLockElement)){
    await page.mouse.move(width/2,height/2);const q=await position(),dy=(wantRy-q.ry+540)%360-180;await page.mouse.move(width/2+dy/.1,height/2-(wantRx-q.rx)/.1);
   }else{
    const x=width/2,y=height/2,k=.22*1366/Math.max(800,width);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+10,y);const q=await position(),dy=(wantRy-q.ry+540)%360-180;await page.mouse.move(x+10+dy/k,y-(wantRx-q.rx)/k);await page.mouse.up();
   }
   await page.waitForTimeout(120);
  }
  let releaseWalk=null;await page.exposeBinding('__r5StopWalk',async()=>{const stop=releaseWalk;releaseWalk=null;if(stop)await stop();});
  async function travel(z,cm){
   for(let n=0;n<16;n++){
    const p=await position();if(cm)z=600-Math.sqrt(Math.max(1,cm*cm-(270-p.x)**2));const d=z-p.z;if(Math.abs(d)<1.9)return;console.log('WALK',z,p.x.toFixed(1),p.z.toFixed(1));const correction=!touch&&Math.abs(d)<10,sign=Math.sign(d);await aim(correction?{x:p.x+(p.x<270?1:-1)*sign*500,y:210,z:p.z+180}:{x:270,y:210,z:p.z+500});const key=d>0?'w':'s',slow=Math.abs(d)<(touch?60:150),fine=Math.abs(d)<25;
    if(correction){await page.keyboard.down('c');await page.keyboard.press(key,{delay:20});await page.keyboard.up('c');await page.waitForTimeout(650);continue;}
    let resolveStop,timer;const stopped=new Promise(r=>resolveStop=r);releaseWalk=async()=>{if(touch)await finger('touchEnd');else{await page.keyboard.up(key);if(slow)await page.keyboard.up('c');}resolveStop();};
    const armWatch=()=>page.evaluate(({z,sign,margin})=>{const watch=()=>{if(sign*(z-House.W.z)<margin)window.__r5StopWalk();else requestAnimationFrame(watch);};requestAnimationFrame(watch);},{z,sign,margin:Math.min(touch&&fine?.65:slow?14:27,Math.max(.1,Math.abs(d)-.5))});
    if(!touch)await armWatch();
    if(touch){await finger('touchStart',70,height-80);await finger('touchMove',70,height-80-sign*(fine?14:slow?20:48));}else{if(slow)await page.keyboard.down('c');await page.keyboard.down(key);}
    if(touch)await armWatch();
    try{await Promise.race([stopped,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Held-input approach timed out')),30000))]);}
    finally{clearTimeout(timer);if(releaseWalk){const stop=releaseWalk;releaseWalk=null;await stop();}}
    await page.waitForTimeout(500);
   }
   throw Error('Real-input travel did not reach '+z+' '+JSON.stringify(await position()));
  }
  for(const id of people)for(const cm of ranges){
   console.log('APPROACH',device,id,cm);
   await page.evaluate(id=>{
    const F=HouseFamily,sp=F.debug.speech;House.hush();sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;sp.freeze=false;
    for(const c of Object.values(F.chars)){const key='r5park'+c.id;F.debug.spots[key]={lvl:'U',x:-160+(['mom','dad','sister'].indexOf(c.id))*55,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);c.hold=0;c.backoff=c.backHome=null;c.rig.hush();}NPCBubble.clear();sp.bub=null;
    F.debug.spots.r5talk={lvl:'G',x:270,z:600,face:180};F.debug.go(id,'r5talk');F.debug.place(id,'r5talk');const c=F.chars[id];c.hold=0;c.plan=[];c.cur={k:'act',t:0};c.goal={key:'debug.r5talk',spot:F.debug.spots.r5talk,spotKey:'r5talk'};c.yieldAt=Infinity;
   },id);
   await page.waitForTimeout(500);await travel(600-cm,cm);await page.waitForTimeout(150);
   console.log('AT RANGE',device,id,cm,await position());const actor=await page.evaluate(id=>{const c=HouseFamily.chars[id];return{x:c.x,z:c.z,y:c.rig.st.y-c.rig.S.chest}},id);await aim(actor);
   // A real pointer must first show the same Talk affordance the player sees.
   await until(id=>{const c=HouseFamily.chars[id];return [...document.querySelectorAll('.hs-tip,.hs-hot,.hs-prompt')].some(e=>/Talk to/.test(e.textContent))||House.pick(innerWidth/2,innerHeight/2)?.spot==='np.'+id},id);
   const start=await position(),preDistance=Math.hypot((await position()).x-actor.x,(await position()).z-actor.z),name=device+'-'+id+'-'+cm;
   assert(Math.abs(preDistance-cm)<2.5,name+' approach missed requested range: '+preDistance);
   if(!comparisonOnly)await shot(name+'-before-f.png');
   if(touch)await page.locator('.ht-acts [data-k=f]').tap();else await page.keyboard.press('f');await page.waitForTimeout(700);
   if(id==='mom')await page.evaluate(()=>ChoreKit.chip('bed'));
   const sample=await page.evaluate(id=>{
    const H=House,c=HouseFamily.chars[id],r=c.rig,p=new THREE.Vector3();
    if(r.eyeWorld)r.eyeWorld(p);else{r.bones.head.updateWorldMatrix(true,false);r.bones.head.localToWorld(p.set(0,r.S.eyeY-r.J.head[1],r.S.shape.front(0,r.S.eyeY)-r.J.head[2]));p.y=-p.y;}
    const eyes=H.toScreen(p.x,p.y,p.z),project=v=>{v.project(H.camera);return{x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight}},mouth=project(r.mouthWorld(new THREE.Vector3())),top=project(r.headTop(new THREE.Vector3())),span=Math.max(18,Math.hypot(mouth.x-top.x,mouth.y-top.y)),face={x:eyes.x-span*.55,y:Math.min(eyes.y,mouth.y)-10,w:span*1.1,h:Math.abs(eyes.y-mouth.y)+24};
    const visible=e=>{for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return e.getBoundingClientRect().width>0;},panels=[...document.querySelectorAll('.hs-tip.on,.ht-target.on,.ch-chip:not([hidden]),.st-objective:not([hidden]),.se-objective:not([hidden]),.np-bub:not(.np-out)')].filter(visible).map(e=>{const b=e.getBoundingClientRect();return{class:e.className,text:e.textContent.trim().slice(0,80),x:b.x,y:b.y,w:b.width,h:b.height}}),overlaps=panels.filter(b=>b.x<face.x+face.w&&b.x+b.w>face.x&&b.y<face.y+face.h&&b.y+b.h>face.y),labels=panels.filter(b=>/hs-tip|ht-target/.test(b.class));
    return{mouth,face,panels,overlaps,labels,player:{x:H.W.x,z:H.W.z,rx:H.P.rx,ry:H.P.ry},actor:{x:c.x,z:c.z},distance:Math.hypot(H.W.x-c.x,H.W.z-c.z),eyes,inside:!!eyes&&eyes.x>0&&eyes.x<innerWidth&&eyes.y>0&&eyes.y<innerHeight,hold:c.hold,speech:HouseFamily.debug.speech.cur?.c?.id,tris:r.tris+6,calls:2};
   },id);
   await shot(name+'-after-f.png');assert(Math.hypot(sample.player.x-start.x,sample.player.z-start.z)<.1,'F moved the player');
   report.cases=report.cases.filter(c=>c.name!==name);report.cases.push({name,cm,device,id,preDistance,start,...sample});await writeFile(out+'report.json',JSON.stringify(report,null,2));console.log('TALK',JSON.stringify(report.cases.at(-1)));
   if(!baseline){assert(sample.inside,name+' eyes outside frame');assert(sample.hold>0,name+' F did not start conversation');if(round!=='r5'){assert.deepEqual(sample.labels,[],name+' redundant action label');assert.deepEqual(sample.overlaps,[],name+' UI covers face');}}
   if(!baseline&&id==='mom'&&cm===100){
    await aim(actor);await page.evaluate(id=>{const sp=HouseFamily.debug.speech;House.hush();sp.q.length=0;sp.cur=null;sp.voice=null;const c=HouseFamily.chars[id];c.hold=0;c.talking=false;c.rig.hush();},id);
    if(touch)await page.locator('.ht-acts [data-k=f]').tap();else await page.keyboard.press('f');await page.waitForTimeout(100);
    if(touch){await finger('touchStart',width*.72,height*.4);await finger('touchMove',width*.72+20,height*.4+12);await finger('touchEnd');}
    else{await page.mouse.move(width/2+15,height/2+10);}
    const cancelled=await position();await page.waitForTimeout(500);const settled=await position();assert(Math.abs(cancelled.rx-settled.rx)<.3,'Look input did not cancel framing');report.cancellations=(report.cancellations||[]).filter(c=>c.device!==device);report.cancellations.push({device,cancelled,settled});
    if(touch&&round!=='r5'){
     await page.evaluate(()=>ChoreKit.chip('bed'));const during=await page.locator('.ch-chip').boundingBox();
     await page.evaluate(id=>{const sp=HouseFamily.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;sp.freeze=true;const c=HouseFamily.chars[id];c.hold=0;c.talking=false;c.rig.hush();NPCBubble.clear();ChoreKit.chip('bed');},id);
     await until(()=>!House.ui.el.classList.contains('np-conversation'));const restored=await page.locator('.ch-chip').boundingBox();
     assert(during&&restored&&during.y>restored.y+80,'Job reminder did not return after conversation');report.objectiveRestore={during,restored};await shot(device+'-objective-restored.png');
    }

   }
   if(!baseline&&id==='sister'&&cm===60){
    await page.evaluate(()=>House.saveWalkState());const saved=await position();await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.HouseFamily?.ready&&window.House?.mode==='walk'&&!House.gliding);await page.waitForTimeout(700);const resumed=await position();assert(Math.hypot(saved.x-resumed.x,saved.z-resumed.z)<.2,'Refresh moved player');assert(Math.abs(saved.rx-resumed.rx)<.2&&Math.abs(saved.ry-resumed.ry)<.2,'Refresh replayed framing or changed view');await shot(name+'-refresh.png');report.refreshes=(report.refreshes||[]).filter(c=>c.device!==device);report.refreshes.push({device,saved,resumed});
   }
   await writeFile(out+'report.json',JSON.stringify(report,null,2));
  }
  assert.deepEqual(errors,[]);await fixture.browser.close();fixture=null;
 }
 assert(!/mod failed to load/i.test(log));console.log('CONVERSATION',report.cases.length,'cases');
}finally{clearTimeout(watchdog);await writeFile('/tmp/jhp-r5-talk-server.log',log);await close();}
