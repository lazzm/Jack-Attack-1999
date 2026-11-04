// Family passage through the real walking controller. Fixture APIs place the
// starting poses only; every measured pass uses held keys or CDP fingers.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const root=new URL('../',import.meta.url).pathname,shots=root+'tests/shots/people-pass/';
const baseline=process.argv.includes('--baseline'),only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const report={baseline,cases:[],perf:[]};let server,data,f,log='';
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{if(server?.exitCode===null)server.kill('SIGTERM');if(f)await f.browser.close().catch(()=>{});process.exit(130)});
await mkdir(shots,{recursive:true});
try{
 data=await mkdtemp('/tmp/jhp-people-pass-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))})){port=p;break;}
 assert(port,'No free throwaway port');
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://localhost:'+port,password='Throwaway-1999';
 for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 for(const touch of (baseline?[false]:process.argv.includes('--desktop')?[false]:[false,true])){
  f=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,hour:14,seed:1999,touch,width:touch?390:1366,height:touch?844:860,contextOptions:touch?{isMobile:true}: {},storageState:await bonfireLogin(base,password,'Jack',{pv:10,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async page=>{
   if(baseline)for(const file of ['np-life.js','hs-world.js'])await page.route('**/js/'+file+'*',route=>route.fulfill({body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:root,encoding:'utf8'}),contentType:'application/javascript'}));
  }});
  const {page,until,errors}=f,cdp=await page.context().newCDPSession(page);
  await until(()=>!!window.HouseFamily?.ready);
  await page.evaluate(()=>{window.__initialClock=null;Net.on('ownerResult',m=>{if(m.rid==='people-initial-clock')window.__initialClock=m});Net.send({t:'ownerAction',rid:'people-initial-clock',action:'clock',date:'1999-10-12',hour:14});});await until(()=>!!window.__initialClock);assert(await page.evaluate(()=>__initialClock.ok));
  await page.evaluate(()=>{HouseFamily.debug.clock({md:1012,dow:2,t:10.6});HouseFamily.debug.sim(120,.1);HousePause.close();});
  if(process.argv.includes('--inspect')){console.log(JSON.stringify(await page.evaluate(()=>({doors:Object.fromEntries(Object.entries(House.DOORS).map(([id,d])=>[id,{rooms:d.rooms,b:d.closedBounds}])),stairs:House._.grids.stairs.map(s=>({x0:s.x0,x1:s.x1,z0:s.z0,z1:s.z1})),walk:House._.grids.walk,block:House._.grids.block.filter(b=>b.lvl==='G')})),null,2));break;}
  const finger=(type,x=80,y=touch?680:650)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{id:1,x,y,radiusX:6,radiusY:6,force:1}]});
  async function pose(x,z,lvl,ux,uz){await page.evaluate(({x,z,lvl,ux,uz})=>{const H=House,fy=NPCNav.onFlight(x,z)?NPCNav.ramp(z):H.LV[lvl];H.hush();HousePause.close();H.setWalkFrom({x,y:fy-H.STAND,z,lvl,seat:0});Object.assign(H.P,{x,y:fy-H.STAND,z,lvl,seat:0,rx:0,ry:Math.atan2(ux,-uz)*180/Math.PI});H._.setMode('walk');H.dirty();},{x,z,lvl,ux,uz});await page.waitForTimeout(250);}
  await pose(280,420,'G',0,1);
  // Matched, uncapped rendered-frame and family-update timing; software GPU
  // numbers describe this shared host, not real-device performance.
  const perf=process.argv.includes('--skip-perf')?{}:await page.evaluate(()=>new Promise(resolve=>{const frames=[],cpu=[];let last=performance.now(),start=last;const old=House.anims.get('np');if(old)House.anims.set('np',function(...args){const t=performance.now(),r=old(...args);cpu.push(performance.now()-t);return r});function sample(now){frames.push(now-last);last=now;if((now-start<6500||frames.length<24)&&now-start<30000)requestAnimationFrame(sample);else{if(old)House.anims.set('np',old);frames.splice(0,4);frames.sort((a,b)=>a-b);cpu.sort((a,b)=>a-b);resolve({median:frames[Math.floor(frames.length/2)],p95:frames[Math.floor(frames.length*.95)],familyMedian:cpu[Math.floor(cpu.length/2)],familyP95:cpu[Math.floor(cpu.length*.95)],frames:frames.length,width:innerWidth,draws:House.ren.info.render.calls,renderer:House.ren.getContext().getParameter(House.ren.getContext().getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)})}}requestAnimationFrame(sample)}));
  report.perf.push({touch,...perf});console.log('FRAME',JSON.stringify(report.perf.at(-1)));if(baseline||process.argv.includes('--perf-only')){await f.browser.close();f=null;continue;}
  const cases=[
   {name:'hall',x:270,z:500,lvl:'G',ux:0,uz:1},
   {name:'landing',x:290,z:335,lvl:'U',ux:0,uz:1},
   {name:'stairs-up',x:371.5,z:435,lvl:'G',ux:0,uz:-1},
   {name:'stairs-down',x:371.5,z:390,lvl:'U',ux:0,uz:1},
   {name:'kitchen-table',x:20,z:-68,lvl:'G',ux:1,uz:0,start:100,finish:95},
   {name:'sink',spot:'sink',x:-80,z:-84,lvl:'G',ux:1,uz:0,playerZ:-65,start:95,finish:100},
   {name:'sofa-front',spot:'sofaL',x:-110.4,z:608,lvl:'G',ux:1,uz:0,playerZ:535,start:90,finish:140},
   {name:'garden',x:0,z:-650,lvl:'G',ux:0,uz:-1,bonfire:true},
   {name:'front',x:270,z:1040,lvl:'G',ux:0,uz:1},
   {name:'two-people',x:270,z:490,lvl:'G',ux:0,uz:1,two:true,finish:130},
   {name:'oncoming',x:270,z:540,lvl:'G',ux:0,uz:1,oncoming:true},
   {name:'conversation',x:270,z:500,lvl:'G',ux:0,uz:1,talk:true},
  ];
  const doors=await page.evaluate(()=>Object.entries(House.DOORS).filter(([,d])=>!d.always&&d.closedBounds).map(([id,d])=>({id,b:d.closedBounds,lvl:House.ROOMS[d.rooms[0]].lvl})));
  for(const {id,b,lvl} of doors){const wide=b.x1-b.x0>b.z1-b.z0;cases.push({name:'door-'+id,door:id,x:(b.x0+b.x1)/2,z:(b.z0+b.z1)/2,lvl,ux:wide?0:1,uz:wide?1:0,start:id==='cupboard'?45:90,finish:id==='cupboard'?35:90});}
  for(const q of cases){
   const name=(touch?'phone-':'desktop-')+q.name;if(only&&!only.includes(q.name)&&!only.includes(name))continue;
   try{
    await page.evaluate(q=>{const F=HouseFamily,H=House;H.hush();HousePause.close();const sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.freeze=false;for(const c of Object.values(F.chars)){c.hold=0;c.talking=false;c.aside=null;c.asideFor=null;c.pass=null;c.yieldAt=0;c.pushN=0;c.backoff=c.backHome=null;c.rig.hush();}F.debug.clock({md:1012,dow:2,t:10.6});F.debug.go('dad',null);F.debug.go('sister',null);F.debug.sim(120,.1);for(const c of [F.chars.dad,F.chars.sister]){c.present=false;c.rig.group.visible=false;}for(const id of Object.keys(H.DOORS))if(!H.DOORS[id].always)H.setDoor(id,true);F.debug.spots.__pass={lvl:q.lvl,x:q.x,z:q.z,face:0,act:'paper'};const spot=q.spot||'__pass';F.debug.go('mom',spot);F.debug.place('mom',spot);if(!q.spot){const c=F.chars.mom;c.goal={key:'debug.'+spot,spot:F.debug.spots[spot],spotKey:spot};c.cur={k:'act',t:1};c.plan=[];}F.debug.sim(q.spot?7:3,.1);if(q.two){F.debug.spots.__second={lvl:q.lvl,x:q.x+12,z:q.z+60,face:180};F.debug.go('dad','__second');F.debug.place('dad','__second');F.debug.sim(2,.1);}},q);
    if(q.bonfire){await page.evaluate(()=>{window.__clockReply=null;Net.on('ownerResult',m=>{if(m.rid==='people-clock')window.__clockReply=m});Net.send({t:'ownerAction',rid:'people-clock',action:'clock',date:'1999-11-05',hour:19});});await until(()=>!!window.__clockReply);assert((await page.evaluate(()=>__clockReply.ok)));await until(()=>!!window.Bonfire?.on);}
    const start=q.start||100,finish=q.finish||65,px=q.x-q.ux*start,pz=(q.playerZ??q.z)-q.uz*start;
    await pose(px,pz,q.lvl,q.ux,q.uz);if(q.bonfire)assert.equal(await page.evaluate(()=>Bonfire.familySpace()),150,'Real Bonfire evening route reserve is active');
    if(q.oncoming)await page.evaluate(()=>{HouseFamily.debug.spots.__destination={lvl:'G',x:270,z:360};HouseFamily.debug.go('mom','__destination');});
    if(q.talk){await page.evaluate(()=>HouseFamily.talk('mom'));await page.waitForTimeout(500);const a=await page.evaluate(()=>({x:HouseFamily.chars.mom.x,z:HouseFamily.chars.mom.z}));await page.waitForTimeout(600);const b=await page.evaluate(()=>({x:HouseFamily.chars.mom.x,z:HouseFamily.chars.mom.z}));assert(Math.hypot(a.x-b.x,a.z-b.z)<2,'Conversation moved before walking');}
    await page.evaluate(({q,px,pz,finish,start})=>{window.__passOrigin={x:px,z:pz};window.__passFinish=start+finish;window.__passSamples=[];window.__passActive=true;window.__capturing=false;let last=performance.now();const sample=now=>{if(!window.__passActive)return;const W=House.W,c=HouseFamily.chars.mom;__passSamples.push({t:now,dt:now-last,capture:window.__capturing,x:W.x,z:W.z,fy:W.fy,cx:c.x,cz:c.z,narrow:!!c.aside?.narrow,clear:c.seated?999:NPCNav.onFlight(c.x,c.z)?Math.min(c.x-333,410-c.x):NPCNav.clear(c.lvl,c.x,c.z),d:Math.hypot(c.x-W.x,c.z-W.z),aside:!!c.aside,goal:c.goal?.key,step:c.cur?.k});last=now;if((W.x-window.__passOrigin.x)*q.ux+(W.z-window.__passOrigin.z)*q.uz>window.__passFinish){window.__passActive=false;return;}requestAnimationFrame(sample)};requestAnimationFrame(sample)},{q,px,pz,finish,start});
    if(touch){await finger('touchStart',385,6);await finger('touchEnd');await until(()=>document.documentElement.dataset.touchState==='walk');await finger('touchStart');await finger('touchMove',80,600);}else await page.keyboard.down('w');
    let passed=false,shot=false;let end=Date.now()+35000;
    try{while(Date.now()<end){await page.waitForTimeout(100);const p=await page.evaluate(()=>({x:House.W.x,z:House.W.z}));const progress=(p.x-px)*q.ux+(p.z-pz)*q.uz;if(!shot&&progress>start-65){const t=Date.now();await page.evaluate(()=>window.__capturing=true);if(touch)await finger('touchEnd');else await page.keyboard.up('w');await page.waitForTimeout(200);await page.screenshot({path:shots+name+'.png',timeout:20000});if(touch){await finger('touchStart');await finger('touchMove',80,600);}else await page.keyboard.down('w');await page.evaluate(()=>window.__capturing=false);end+=Date.now()-t;shot=true;}if(progress>start+finish){passed=true;break;}}}finally{if(touch)await finger('touchEnd');else await page.keyboard.up('w');await page.evaluate(()=>window.__passActive=false);}
    const samples=await page.evaluate(()=>__passSamples);const endPose=await page.evaluate(()=>({x:House.W.x,z:House.W.z,mode:House.mode}));
    assert(passed,'Did not get past: '+JSON.stringify(endPose));assert(samples.length>5,'Not enough rendered samples');
    let stalled=0,worstStall=0,back=0,maxSpeed=0;for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if(a.capture||b.capture)continue;const d=Math.hypot(b.x-a.x,b.z-a.z);stalled=d<.1?stalled+b.dt:0;worstStall=Math.max(worstStall,stalled);back=Math.max(back,-((b.x-a.x)*q.ux+(b.z-a.z)*q.uz));maxSpeed=Math.max(maxSpeed,d/Math.max(.001,b.dt/1000));}
    assert(worstStall<1800,'Stuck rendered frames '+worstStall);assert(back<1,'Backwards jitter '+back);assert(maxSpeed<240,'Position jump '+maxSpeed);assert(Math.min(...samples.map(s=>s.d))>=26-1,'Camera entered body');assert(samples.every(s=>s.clear>=(s.narrow?16:24)),'Person entered furniture/wall');assert(samples.every((s,i)=>!i||Math.hypot(s.cx-samples[i-1].cx,s.cz-samples[i-1].cz)<130*s.dt/1000+1),'Person jumped during passage');
    const moved=Math.max(...samples.map(s=>Math.hypot(s.cx-q.x,s.cz-q.z)));if(q.name==='hall')assert(samples.some(s=>s.aside&&s.d>65),'No early yield');
    // Once clear, fast-forward only the job return (the pass itself was real input).
    await pose(100,100,'U',0,-1);await page.evaluate(()=>HouseFamily.debug.sim(70,.1));const after=await page.evaluate(()=>{const c=HouseFamily.chars.mom;return {goal:c.goal?.key,step:c.cur?.k,x:c.x,z:c.z,aside:!!c.aside}});
    assert(!after.aside&&after.step==='act'&&after.goal===(q.oncoming?'debug.__destination':'debug.'+(q.spot||'__pass')),'Did not return to job '+JSON.stringify(after));
    if(q.bonfire){await page.evaluate(()=>{window.__initialClock=null;Net.send({t:'ownerAction',rid:'people-initial-clock',action:'clock',date:'1999-10-12',hour:14});});await until(()=>!!window.__initialClock);}
    const result={name,seconds:(samples.at(-1).t-samples[0].t)/1000,minDistance:Math.min(...samples.map(s=>s.d)),worstStall,back,maxSpeed,moved,after};report.cases.push(result);console.log('PASS',name,JSON.stringify(result));await writeFile(shots+name+'.json',JSON.stringify(samples));await rm(shots+name+'-failure.png',{force:true});await rm(shots+name+'-failure.json',{force:true});
   }catch(e){report.cases.push({name,error:e.message});console.error('FAIL',name,e.message,JSON.stringify(await page.evaluate(()=>({person:HouseFamily.debug.dump()[0],walk:{...House.W},aside:HouseFamily.chars.mom.aside,door:Object.fromEntries(Object.entries(House.DOORS).map(([k,v])=>[k,{open:v.open,ang:v.ang}]))}))));await writeFile(shots+name+'-failure.json',JSON.stringify(await page.evaluate(()=>window.__passSamples||[])));await page.screenshot({path:shots+name+'-failure.png'});}
  }
  assert.deepEqual(errors,[],'Browser errors');await f.browser.close();f=null;
 }
 assert(!/mod failed to load/i.test(log),'Server mod failed to load');
 await writeFile(shots+(baseline?'baseline':'report')+'.json',JSON.stringify(report,null,2));
 assert(!report.cases.some(c=>c.error),'Some passage cases failed');
}finally{if(f)await f.browser.close();if(server?.exitCode===null){const ended=once(server,'exit');server.kill('SIGTERM');await ended;}if(data)await rm(data,{recursive:true,force:true});}
