// Real F / Esc / resize / refresh after explicitly staged initial poses.
// Furniture and stair heights come from the production controller/world.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const root=new URL('../',import.meta.url).pathname,out=root+'tests/shots/models/r6-layouts/';
const select=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1].split(',');
const devices=select('devices')||['desktop','portrait','tablet','short'],cases=select('cases')||['seated-mom','seated-dad','seated-sister','stairs-dad','oblique-mom','wall-sister'];
const profiles={desktop:[1366,860,false],portrait:[390,844,true],tablet:[768,1024,true],short:[740,360,true]};
let server,fixture,data,log='';const report={setup:'Only initial actor/player poses and carry/objective inventory are staged. Conversation uses real F, menu uses Esc; captures native requested resolution. Navigation raster .25.',cases:[],refresh:[]};
try{
 await mkdir(out,{recursive:true});if(process.argv.includes('--append'))Object.assign(report,JSON.parse(await readFile(out+'report.json','utf8')));data=await mkdtemp('/tmp/jhp-r6-layout-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 for(const device of devices){
  const [width,height,touch]=profiles[device];assert(width);console.log('LAYOUT DEVICE',device);
  fixture=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,hour:18,tier:'low',seed:1999,width,height,touch,contextOptions:{isMobile:touch},storageState:await bonfireLogin(base,password,'Jack',{pv:12,x:270,y:210,z:340,rx:0,ry:180,lvl:'G',seat:0}),onPage:async p=>p.addInitScript(()=>{
   let ren,raw,desired=1,limit=.25;setInterval(()=>{if(window.House?.ren&&House.ren!==ren){ren=House.ren;raw=ren.setPixelRatio.bind(ren);desired=ren.getPixelRatio();ren.setPixelRatio=n=>{desired=n;raw(Math.min(n,limit));};raw(Math.min(desired,limit));}window.__r6Raster=n=>{limit=n;if(raw)raw(Math.min(desired,limit));window.House?.dirty();};},20);
  })});
  const {page,errors}=fixture,cdp=await page.context().newCDPSession(page);
  async function until(fn,arg,ms=60000){const end=Date.now()+ms;while(Date.now()<end){assert.deepEqual(errors,[]);if(await page.evaluate(fn,arg))return;await page.waitForTimeout(150);}throw Error('Layout timeout: '+fn);}
  await until(()=>!!window.HouseFamily?.ready);
  if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:width/2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until(()=>window.GameInput?.touch);}
  async function shot(name){await page.evaluate(()=>{__r6Raster(Infinity);House._.renderForBenchmark()});try{const capture=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(capture.data,'base64'))}finally{await page.evaluate(()=>__r6Raster(.25))}}
  for(const name of cases){
   const [kind,id]=name.split('-');console.log('LAYOUT CASE',device,name);
   const setup=await page.evaluate(({kind,id})=>{
    const H=House,F=HouseFamily,sp=F.debug.speech;H.putBack();H.hush();HousePause.close();F.debug.clock({md:1012,dow:2,t:18.1});sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;sp.freeze=true;NPCBubble.clear();
    for(const room of ['hall','landing','lounge','kitchen'])H.buildRoom(H.ROOMS[room]);for(const d of ['lounge','kitchen'])H.setDoor(d,true,true);
    for(const c of Object.values(F.chars)){const key='r6park'+c.id;F.debug.spots[key]={lvl:'U',x:-170+(['mom','dad','sister'].indexOf(c.id))*55,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);c.hold=0;c.backoff=c.backHome=c.aside=null;c.rig.hush();}
    let spot;if(kind==='seated')spot={mom:'sofaL',dad:'armchair',sister:'sofaR'}[id];else{spot='r6speaker';F.debug.spots[spot]=kind==='stairs'?{lvl:'G',x:371.5,z:550,face:0}:kind==='wall'?{lvl:'G',x:270,z:680,face:180}:{lvl:'G',x:270,z:580,face:180};}
    F.debug.go(id,spot);F.debug.place(id,spot);F.debug.sim(kind==='seated'?12:.2,.1);const c=F.chars[id];c.hold=0;c.yieldAt=Infinity;
    for(let i=0;i<120;i++)c.rig.update(1/60,true);
    const a=c.h+(kind==='oblique'?Math.PI*.32:0),distance=kind==='wall'?65:kind==='stairs'?64:kind==='seated'?(id==='sister'?60:id==='mom'?80:100):110;
    const x=c.x+Math.sin(a)*distance,z=c.z+Math.cos(a)*distance,lvl='G',fy=NPCNav.floor(lvl,x,z),y=fy-143;
    const eyes=c.rig.eyeWorld(new THREE.Vector3()),rx=Math.atan2(y-eyes.y,Math.hypot(eyes.x-x,eyes.z-z))*180/Math.PI,ry=Math.atan2(eyes.x-x,-(eyes.z-z))*180/Math.PI;
    H.setWalkFrom({x,y,z,lvl,seat:0});Object.assign(H.P,{x,y,z,rx,ry,lvl,seat:0});H._.setMode('walk');sp.q.length=0;sp.cur=null;sp.freeze=false;H.dirty();return{seated:!!c.seated,position:{x,y,z,rx,ry},actor:{x:c.x,z:c.z},floor:fy};
   },{kind,id});
   if(kind==='seated')assert(setup.seated,'Fixture did not reach real seat '+id);
   await page.waitForTimeout(900);const start=await page.evaluate(()=>({x:House.W.x,z:House.W.z}));
   if(touch){
    // The preceding real Esc intentionally selects keyboard input. A real
    // screen press restores touch controls before the next conversation.
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:width/2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until(()=>GameInput.touch);
    await until(()=>!House.held()&&!document.querySelector('.ht-acts.ht-carrying'),null,15000);
    await shot(device+'-'+name+'-before-f.png');
    console.log('PRE F',await page.evaluate(()=>({pose:{x:House.P.x,y:House.P.y,z:House.P.z,rx:House.P.rx,ry:House.P.ry},pick:House.pick(innerWidth/2,innerHeight/2)?.spot,buttons:document.querySelector('.ht-acts')?.textContent,touch:GameInput.touch,mode:House.mode,busy:House.busy})));
    await page.locator('.ht-acts [data-k=f]').tap();
   }else await page.keyboard.press('f');
   await until(id=>HouseFamily.chars[id].hold>0,id,20000);await page.waitForTimeout(650);
   await until(id=>NPCBubble.live.some(b=>b.key===id&&!b.out&&b.mode==='head'&&b.said.length>0)&&[...document.querySelectorAll('.np-bub:not(.np-out)')].some(e=>+getComputedStyle(e).opacity>.9),id,20000);
   await page.evaluate(()=>{ChoreKit.chip('bed');if(!House.grab('ch.v.0'))throw Error('Cannot stage carried video');House.dirty()});await page.waitForTimeout(200);
   if(touch)await until(()=>document.querySelector('.ht-acts')?.classList.contains('ht-carrying'),null,15000);
   // Touch's existing stack measures after the carrying controls update. Wait
   // for that real layout pass rather than sampling the old one-frame offset.
   if(touch&&height>width)await until(()=>{const a=document.querySelector('.hs-hold:not([hidden])')?.getBoundingClientRect(),b=document.querySelector('.ch-chip:not([hidden])')?.getBoundingClientRect();return a&&b&&b.top>=a.bottom+6;},null,15000);
   const sample=await page.evaluate(id=>{
    const H=House,r=HouseFamily.chars[id].rig,p=r.eyeWorld(new THREE.Vector3()),eyes=H.toScreen(p.x,p.y,p.z),project=p=>{p.project(H.camera);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight}},top=project(r.headTop(new THREE.Vector3())),mouth=project(r.mouthWorld(new THREE.Vector3())),span=Math.max(18,Math.hypot(top.x-mouth.x,top.y-mouth.y)),face={x:eyes.x-span*.6,y:top.y+span*.28,w:span*1.2,h:mouth.y+span*.2-(top.y+span*.28)};
    const visible=e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return e.getBoundingClientRect().width>0};
    const panels=[...document.querySelectorAll('.hs-tip.on,.ht-target.on,.hs-hold:not([hidden]),.ch-chip:not([hidden]),.st-objective:not([hidden]),.se-objective:not([hidden]),.np-bub:not(.np-out)')].filter(visible).map(e=>{const b=e.getBoundingClientRect();return{class:e.className,text:e.textContent.trim().slice(0,90),x:b.x,y:b.y,w:b.width,h:b.height}}),overlaps=panels.filter(b=>b.x<face.x+face.w&&b.x+b.w>face.x&&b.y<face.y+face.h&&b.y+b.h>face.y);
    const carry=panels.find(p=>/hs-hold/.test(p.class)),objective=panels.find(p=>/ch-chip/.test(p.class)),intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y,stackOverlap=!!(carry&&objective&&intersects(carry,objective));
    const buttons=[...document.querySelectorAll('.ht-hud button')].filter(visible).map(e=>{const b=e.getBoundingClientRect();return{text:e.textContent.trim(),x:b.x,y:b.y,w:b.width,h:b.height}}),objectiveControls=objective?buttons.filter(b=>intersects(objective,b)):[];
    const ancestry=[];for(let p=r.mesh;p;p=p.parent)ancestry.push({name:p.name,type:p.type,visible:p.visible});const actorVisible=ancestry.every(p=>p.visible),edgeBubble=panels.some(p=>/np-edge/.test(p.class));
    return{eyes,face,panels,overlaps,stackOverlap,buttons,objectiveControls,ancestry,actorVisible,edgeBubble,room:HouseFamily.chars[id].room,inside:eyes.x>10&&eyes.x<innerWidth-10&&eyes.y>10&&eyes.y<innerHeight-10,pose:{x:H.W.x,z:H.W.z,rx:H.P.rx,ry:H.P.ry},actor:{x:HouseFamily.chars[id].x,z:HouseFamily.chars[id].z},seat:!!HouseFamily.chars[id].seated,carry:!!H.held(),hold:HouseFamily.chars[id].hold};
   },id);
   const filename=device+'-'+name+'.png';await shot(filename);report.cases=report.cases.filter(c=>c.device!==device||c.name!==name);report.cases.push({device,name,filename,setup,start,...sample});await writeFile(out+'report.json',JSON.stringify(report,null,2));
   assert(sample.actorVisible,filename+' actor hidden by room ancestry');assert(!sample.edgeBubble,filename+' conversation used offscreen edge bubble');assert(sample.inside,filename+' face outside view');assert.deepEqual(sample.overlaps,[],filename+' panels cover face');assert(!sample.stackOverlap,filename+' carry and objective panels overlap');assert.deepEqual(sample.objectiveControls,[],filename+' objective covers touch buttons');assert(Math.hypot(sample.pose.x-start.x,sample.pose.z-start.z)<.15,filename+' F moved player');
   if(kind==='stairs')assert(!sample.seat,'Stair speaker unexpectedly seated');
   await page.keyboard.press('q');await page.keyboard.press('Escape');await page.waitForTimeout(150);assert(await page.evaluate(()=>HousePause.open),'Esc did not open game menu');await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{House.putBack();House.saveWalkState()});const saved=await page.evaluate(()=>({x:House.W.x,z:House.W.z,rx:House.P.rx,ry:House.P.ry,mode:House.mode,stood:House.stood}));await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.HouseFamily?.ready&&House.mode==='walk'&&!House.gliding);await page.waitForTimeout(400);const resumed=await page.evaluate(()=>({x:House.W.x,z:House.W.z,rx:House.P.rx,ry:House.P.ry,mode:House.mode,stood:House.stood}));assert(Math.hypot(saved.x-resumed.x,saved.z-resumed.z)<.3,'Refresh changed standing pose');assert.equal(saved.mode,resumed.mode);assert.equal(saved.stood,resumed.stood);report.refresh.push({device,saved,resumed});await shot(device+'-refresh.png');
  assert.deepEqual(errors,[]);await fixture.browser.close();fixture=null;await writeFile(out+'report.json',JSON.stringify(report,null,2));
 }
 assert(!/mod failed to load/i.test(log));console.log('PASS layouts',report.cases.length,'cases',report.refresh.length,'refreshes');
}finally{await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}await writeFile('/tmp/jhp-r6-layout-server.log',log);if(data)await rm(data,{recursive:true,force:true});}
