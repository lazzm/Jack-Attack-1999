// Real keyboard routes on disposable accounts; collision-valid planning follows world-audit.
// node tests/movement-audit.mjs before|after [--quick] [--doors-only] [--account=full|sparse]
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {roomFixture} from './room-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const tag=process.argv[2]||'after',quick=process.argv.includes('--quick'),matrix=process.argv.includes('--matrix'),fast=process.argv.includes('--fast'),resume=process.argv.includes('--resume'),retry=resume||process.argv.includes('--retry');
assert(/^[\w-]+$/.test(tag));
const dir=root+'tests/shots/movement/'+tag;
let server,data,fixture,log='';
const reports=[];
const original=new Map();
if(process.env.MOVEMENT_SOURCE_DIR)for(const file of ['hs-world.js','hs-house.js'])original.set(file,await readFile(process.env.MOVEMENT_SOURCE_DIR+'/'+file,'utf8'));
const controllerHash=createHash('sha256').update(original.get('hs-world.js')||await readFile(root+'app/public/js/hs-world.js')).update(original.get('hs-house.js')||await readFile(root+'app/public/js/hs-house.js')).digest('hex');
if(fast&&!original.has('hs-world.js'))original.set('hs-world.js',await readFile(root+'app/public/js/hs-world.js','utf8'));
if(fast){const s=original.get('hs-world.js'),needle='  function render() {';assert(s.includes(needle));original.set('hs-world.js',s.replace(needle,needle+'\n    if(!window.movementCapture&&((window.movementDraws=(window.movementDraws||0)+1)%10))return; // test-only draw budget; physics/input remain on every RAF\n'));}
async function cleanup(){if(fixture)await fixture.browser.close().catch(()=>{});if(server?.exitCode===null&&server.signalCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end}if(data)await rm(data,{recursive:true,force:true})}
for(const sig of ['SIGTERM','SIGINT'])process.once(sig,()=>void cleanup().finally(()=>process.exit(1)));
const timeout=setTimeout(()=>{console.error('Movement audit timed out');void cleanup().finally(()=>process.exit(1))},2400000);
try{
 await mkdir(dir,{recursive:true});data=await mkdtemp('/tmp/jhp-movement-');
 const requestedPort=Number(process.argv.find(a=>a.startsWith('--port='))?.slice(7)||0);assert(!requestedPort||Number.isInteger(requestedPort)&&requestedPort>=18080&&requestedPort<=18099,'Use a disposable test port');
 let port;for(let p=requestedPort||18080;p<=(requestedPort||18099);p++){const s=net.createServer();if(await new Promise(r=>{s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))})){port=p;break}}
 assert(port,'No free test port');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const out of [server.stdout,server.stderr])out.on('data',c=>log+=c);
 for(let i=0;i<200&&!log.includes(`online at :${port}`)&&server.exitCode===null;i++)await new Promise(r=>setTimeout(r,100));assert(log.includes(`online at :${port}`),'Disposable server startup failed: '+log.slice(-2000));
 const base=`http://127.0.0.1:${port}`,account='Movement'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const selected=process.argv.find(a=>a.startsWith('--account='))?.slice(10);assert(!selected||['full','sparse'].includes(selected));
 for(const kind of selected?[selected]:['full','sparse']){
  const previous=retry?JSON.parse(await readFile(dir+'/'+kind+'.json','utf8')):null;
  if(previous?.controllerHash)assert.equal(previous.controllerHash,controllerHash,'Controller changed: start a fresh full audit');
  const retryNames=previous?new Set(previous.findings.filter(f=>f.route).map(f=>f.route)):null;
  const passedNames=previous?new Set(previous.routes.filter(r=>r.arrived).map(r=>r.name)):null;
  const progressFile=dir+'/'+kind+(retry?'-retry-progress':'')+'.json';
  console.log('MOVEMENT loading '+kind);
  const onPage=page=>{if(original.size)page.route('**/js/*.js*',route=>{const body=original.get(new URL(route.request().url()).pathname.split('/').pop());return body?route.fulfill({body,contentType:'application/javascript'}):route.continue()})};
  fixture=await roomFixture(base,{...(kind==='full'?{account,password,signup:false}:{opening:true}),onPage});
  const {page:p}=fixture;
  await p.evaluate(()=>{Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true);House.ren.setPixelRatio(.5);House.dirty()});await p.waitForTimeout(500);
  await p.evaluate(()=>{window.movementFrames=null;window.movementClock=0;let last=0;const sample=t=>{if(window.movementFrames){window.movementClock+=last?Math.min(.12,(t-last)/1000):0;const W=House.W,P=House.P;movementFrames.push({t,clock:movementClock,x:W.x,z:W.z,y:W.fy,eye:P.y,height:W.eyeNow,bob:W.bob,jump:W.jh});}last=t;requestAnimationFrame(sample)};requestAnimationFrame(sample)});
  const plan=await p.evaluate(planRoutes);
  await writeFile(dir+'/'+kind+'-plan.json',JSON.stringify(plan,null,2));
  console.log('MOVEMENT plan '+kind+' '+JSON.stringify(plan.stations));
  const report={account:kind,controllerHash,method:'10 cm collision-valid graph; real Playwright W/A/S/D and mouse movement; 0.4 s of controller updates without progress; closed doors are expected stops',renderBudget:fast?'one full draw per ten requested draws; unmodified physics/input on every RAF; full draws for screenshots':'normal rendering',routes:[],findings:[],doors:[],errors:[]};reports.push(report);
  let mouseX=683;
  async function pose(node){await p.evaluate(n=>{House.hush();House.cancelGlide(true);House.setWalkFrom({x:n.x,z:n.z,y:n.y-(House.STAND||128),lvl:n.lvl,seat:0,ry:0,rx:0});House.W.vx=House.W.vz=0;House.W.bob=0;House._.setMode('walk');House.dirty()},node);await p.waitForTimeout(150)}
  async function shot(name){const path=`${dir}/${kind}-${name}.png`;if(fast){await p.evaluate(()=>{window.movementCapture=true;House.dirty()});await p.waitForTimeout(350)}await p.screenshot({path});if(fast)await p.evaluate(()=>{window.movementCapture=false});return path}
  const modes=process.argv.includes('--doors-only')?[]:quick?['walk']:['walk','jog','crouch','small','large'];
  for(const mode of modes){
   if(['small','large'].includes(mode))await p.evaluate(mode=>{const B=HouseKit,g=new THREE.Group(),b=B.into(g);b.box(0,mode==='large'?-16:-4,0,mode==='large'?50:10,mode==='large'?32:8,mode==='large'?40:8,B.mat('#ba9560'));House.thing('movement.'+mode,{obj:g,label:'Movement audit parcel',home:{room:'bedroom',x:80,y:73,z:180},obstacle:true,floorOnly:mode==='large'});House.grab('movement.'+mode)},mode);
   // Quick is one continuous full lap plus reverse. Full visits every ordered pair.
   const lap=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,6],[6,5],[5,4],[4,3],[3,2],[2,1],[1,0],[2,7],[7,2]];
   const selectedRoute=process.argv.find(a=>a.startsWith('--route='))?.slice(8);
   const pairs=(quick||mode!=='walk'&&!matrix?lap:plan.stations.flatMap((_,a)=>plan.stations.map((_,b)=>[a,b]).filter(([a,b])=>a!==b))).filter(([a,b])=>{const name=mode+'-'+plan.stations[a].name+'-'+plan.stations[b].name;return(!selectedRoute||plan.stations[a].name+':'+plan.stations[b].name===selectedRoute)&&(!retryNames||(resume?!passedNames.has(name):retryNames.has(name)))});
   let previousEnd=null;
   for(const [a,b]of pairs){
    const route=plan.routes[a+':'+b],name=mode+'-'+plan.stations[a].name+'-'+plan.stations[b].name;
    if(!route){await pose(plan.stations[a]);report.findings.push({kind:'no-sampled-route',rank:100,route:name,position:plan.stations[a],screenshot:await shot('unreachable-'+name)});previousEnd=null;continue}
    const continuous=(quick||mode!=='walk')&&previousEnd===a;
    if(!continuous)await pose(route[0]);
    let crouchHeld=mode==='crouch'||a===7;
    if(crouchHeld)await p.keyboard.down('c');if(mode==='jog')await p.keyboard.down('Shift');
    // A/S/D take turns providing forward travel after yaw rotation, exercising all keys.
    const key=quick?'w':['w','d','s','a'][report.routes.length%4],offset={w:0,d:-90,s:180,a:90}[key];
    if(!continuous)await p.evaluate(yaw=>{House.P.ry=yaw;House.P.rx=0;House.dirty()},Math.atan2(route[1].x-route[0].x,-(route[1].z-route[0].z))*180/Math.PI+offset);
    // Acquire browser pointer lock through a real key gesture before turning.
    await p.keyboard.down(key);await p.keyboard.up(key);await p.waitForTimeout(50);
    await p.evaluate(()=>{window.movementFrames=[];window.movementClock=0});
    let keyHeld=false;
    const start=Date.now();let i=1,trace=[],failure=null,windowStart=null;
    while(Date.now()-start<90000){
     const s=await p.evaluate(()=>({x:House.W.x,z:House.W.z,y:House.W.fy,eye:House.P.y,bob:House.W.bob,yaw:House.P.ry,lvl:House.W.lvl,room:House.here,mode:House.mode,clock:window.movementClock}));s.t=Date.now()-start;trace.push(s);
     const wantCrouch=mode==='crouch'||((a===7||b===7)&&s.y>320&&Math.hypot(s.x-330,s.z-392)<140);
     if(wantCrouch!==crouchHeld){if(wantCrouch)await p.keyboard.down('c');else await p.keyboard.up('c');crouchHeld=wantCrouch;windowStart=null}
     while(i<route.length-1&&Math.hypot(s.x-route[i].x,s.z-route[i].z)<12)i++;
     const end=route.at(-1);if(i===route.length-1&&Math.hypot(s.x-end.x,s.z-end.z)<10)break;
     // Pursue a visible point ahead instead of orbiting 10 cm waypoints at
     // walking speed. Every shortcut is checked through the production floor API.
     const ahead=await p.evaluate(({route,i})=>{const H=House;let best=i;for(let k=i;k<Math.min(route.length,i+8);k++){const t=route[k],distance=Math.hypot(t.x-H.W.x,t.z-H.W.z);if(distance>65)break;let fy=H.W.fy,lvl=H.W.lvl,ok=true;for(let n=1;n<=Math.ceil(distance/4);n++){const f=n/Math.ceil(distance/4),p=H._.floorAt(H.W.x+(t.x-H.W.x)*f,H.W.z+(t.z-H.W.z)*f,lvl,fy,H.W.eyeNow);if(!p){ok=false;break}fy=p.y;lvl=p.lvl}if(ok)best=k;}return best},{route:route.slice(0),i});i=ahead;
     const target=route[i],yaw=Math.atan2(target.x-s.x,-(target.z-s.z))*180/Math.PI+offset;
     const turn=((yaw-s.yaw)%360+540)%360-180;
     if(Math.abs(turn)>30&&keyHeld){await p.keyboard.up(key);keyHeld=false;windowStart=null}
     if(Math.abs(turn)>1){mouseX+=turn*10;await p.mouse.move(mouseX,430)}
     if(!keyHeld&&Math.abs(turn)<=30){await p.keyboard.down(key);keyHeld=true;windowStart=null}
     else if(keyHeld)await p.keyboard.down(key); // OS-style auto-repeat; Playwright does not generate it automatically.
     if(!windowStart&&keyHeld)windowStart=s;
     if(windowStart&&s.t-windowStart.t>=400&&s.clock-windowStart.clock>=.4){
      const distance=Math.hypot(s.x-windowStart.x,s.z-windowStart.z);
      if(distance<1&&s.t>600){failure={kind:'stuck',rank:100,route:name,position:s,duration:s.t-windowStart.t,target,waypoint:i,diagnostic:await p.evaluate(()=>House._.movementState?.())};break}
      windowStart=s;
     }
     await p.waitForTimeout(60);
    }
    await p.keyboard.up(key);if(crouchHeld)await p.keyboard.up('c');if(mode==='jog')await p.keyboard.up('Shift');
    if(Date.now()-start>=90000&&!failure)failure={kind:'timeout',rank:100,route:name,position:trace.at(-1)};
    const frames=await p.evaluate(()=>{const frames=window.movementFrames;window.movementFrames=null;return frames});
    const result={name,seconds:(Date.now()-start)/1000,arrived:!failure,trace,frames};report.routes.push(result);
    result.frameTiming={maxGap:Math.max(0,...frames.slice(1).map((f,i)=>f.t-frames[i].t)),gapsOver400ms:frames.slice(1).filter((f,i)=>f.t-frames[i].t>400).length};
    const frameIssues=new Set();
    for(let j=1;j<frames.length;j++){
     const a=frames[j-1],b=frames[j],distance=Math.hypot(b.x-a.x,b.z-a.z),ramp=HouseRampDelta(a,b);
     const issue=Math.abs(b.bob)>1.5||Math.abs(b.eye-(b.y-b.height-b.bob-b.jump))>.05?'camera-bob':Math.abs(b.y-a.y-ramp)>8?'stair-stutter':distance>30?'pushed-or-teleported':null;
     if(issue&&!frameIssues.has(issue)){frameIssues.add(issue);report.findings.push({kind:issue,rank:70,route:name,position:b,delta:b.y-a.y,expected:ramp})}
    }
    if(failure){failure.screenshot=await shot('finding-'+name);report.findings.push(failure)}
    previousEnd=failure?null:b;
    if(mode==='walk'&&(quick||b===(a+1)%7))result.screenshot=await shot('lap-'+name);
    console.log('MOVEMENT '+kind+' '+name+' '+(failure?failure.kind:'PASS')+' '+result.seconds.toFixed(1)+'s');
    await writeFile(progressFile,JSON.stringify(report,null,2));
   }
   if(['small','large'].includes(mode)){await p.evaluate(()=>House.putBack());await p.waitForTimeout(400);await p.evaluate(mode=>{const t=House.THINGS['movement.'+mode];House.unspot(t.id);t.obj.parent?.remove(t.obj);delete House.THINGS[t.id]},mode)}
  }
  // Wait for the same capped RAF time the production controller consumes, rather than a loaded host's wall clock.
  async function holdWalk(seconds){
   await p.evaluate(()=>{window.movementFrames=[];window.movementClock=0});
   await p.keyboard.down('w');
   try{
    const end=Date.now()+15000;let elapsed=0;
    while(Date.now()<end&&(elapsed=await p.evaluate(()=>window.movementClock))<seconds)await p.waitForTimeout(100);
    assert(elapsed>=seconds,'Controller did not receive its door-walking time');
   }finally{await p.keyboard.up('w');await p.evaluate(()=>{window.movementFrames=null})}
  }
  // Door barriers are intentional: push while shut, open with F, then cross.
  for(const d of plan.doors){
   await p.evaluate(id=>House.setDoor(id,false,true),d.id);await p.waitForTimeout(100);await pose(d.from);
   // (the cupboard door is 94 cm high: from a crouch at the eye height of 143-38 you look down at it, not over it)
   await p.evaluate(([yaw,rx])=>{House.P.ry=yaw;House.P.rx=rx;House.dirty()},[d.yaw,d.id==='cupboard'?-30:0]);
   if(d.id==='cupboard'){await p.keyboard.down('c');await p.waitForTimeout(600)}
   const before=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));await holdWalk(.7);
   const shut=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));
   const barrierAxis=Math.abs(Math.sin(d.yaw*Math.PI/180))>.5?'x':'z',bounds=d.barrier;
   const plane=(bounds[barrierAxis+'0']+bounds[barrierAxis+'1'])/2;
   assert((before[barrierAxis]-plane)*(shut[barrierAxis]-plane)>0,'Crossed shut '+d.id+' door');
   await p.keyboard.press('f');await p.waitForTimeout(900);
   const open=await p.evaluate(id=>House.DOORS[id].open,d.id);
   await holdWalk(1.1);
   const after=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));
   if(d.id==='cupboard')await p.keyboard.up('c');
   report.doors.push({id:d.id,before,shut,after,openedWithF:open,screenshot:await shot('door-open-'+d.id)});
   if(!open||Math.hypot(after.x-shut.x,after.z-shut.z)<30||(before[barrierAxis]-plane)*(after[barrierAxis]-plane)>=0)report.findings.push({kind:'door-crossing',rank:95,door:d.id,position:after,screenshot:await shot('door-'+d.id)});
   await p.evaluate(id=>House.setDoor(id,true,true),d.id);
  }
  if(process.argv.includes('--details')){
   if(kind==='full'){
    await fixture.view([190,-55,190],[240,73,190]);
    await p.evaluate(()=>{House._.setMode('walk');House.grab('chair')});await p.waitForTimeout(350);
    await p.keyboard.press('e');assert.equal(await p.evaluate(()=>House.held()),'chair','Furniture obstructed the bedroom door');
    await shot('chair-door-rejected');await p.keyboard.press('q');await fixture.until(()=>House.THINGS.chair.st==='rest');
    const originalChair=await p.evaluate(()=>({...House.THINGS.chair.at}));
    await fixture.view([originalChair.x,-55,originalChair.z+90],[originalChair.x,73,originalChair.z]);
    await p.evaluate(()=>{House._.setMode('walk');House.grab('chair')});await p.waitForTimeout(350);
    const expected=await p.evaluate(()=>House.placement()?.target);assert(expected,'Original chair footprint must fit');
    await p.keyboard.press('e');await fixture.until(()=>!House.held()&&House.THINGS.chair.st==='rest');
    const placedChair=await p.evaluate(()=>House.THINGS.chair.at);assert(Math.hypot(placedChair.x-expected.x,placedChair.z-expected.z)<.1,'Clear floor placement snapped back');
    assert(await p.evaluate(()=>!!House._.floorAt(House.W.x,House.W.z,House.W.lvl,House.W.fy)),'Furniture trapped its player');
    await shot('chair-clear-floor');
   }
   for(const width of [1366,1920]){
    await p.setViewportSize({width,height:width===1366?860:1080});
    for(const [name,eye,target]of [['hall-doors',[290,225,600],[205,235,430]],['kitchen-hinge',[100,225,280],[195,235,230]],['lounge-hinge',[60,225,640],[192,235,560]],['stairs',[300,-55,180],[370,100,500]]]){
     await fixture.view(eye,target,{level:name==='stairs'?'U':'G'});await shot(name+'-'+width);
    }
   }
  }
  report.errors=fixture.errors;assert.deepEqual(fixture.errors,[]);
  if(previous){
   await writeFile(dir+'/'+kind+'-before-retry.json',JSON.stringify(previous,null,2));
   const replacements=new Map(report.routes.map(r=>[r.name,r])),remaining=previous.routes.filter(r=>!replacements.has(r.name));
   report.routes=[...remaining,...report.routes];
   report.findings=[...previous.findings.filter(f=>f.route&&!replacements.has(f.route)),...report.findings];
   report.retriedRoutes=[...retryNames];
   report.resumed=resume;
  }
  const lapNames=['bedroom-landing','landing-hall','hall-lounge','lounge-kitchen','kitchen-garden','garden-drive','drive-bedroom'];
  const lapFrames=lapNames.map(name=>report.routes.find(r=>r.name==='walk-'+name&&r.screenshot));
  if(lapFrames.every(Boolean))await writeFile(dir+'/'+kind+'-lap.html',`<!doctype html><meta charset="utf-8"><title>House movement frame sequence</title><style>body{background:#d4d0c8;color:#111;font:16px Tahoma,sans-serif;margin:24px}h1{background:#000080;color:white;padding:12px;font-size:22px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;background:white;padding:8px;border:2px inset #eee}img{width:100%;height:auto}figcaption{padding:8px}a{color:#000080}</style><h1>${kind}: full house lap</h1><p>Real keyboard and mouse route legs; station frames in traversal order. ${quick?'Consecutive legs preserve the previous endpoint.':'Each leg begins at its representative station.'} See <a href="${kind}.json">raw positions and animation-frame traces</a>. Rendering: ${report.renderBudget}.</p><main>${lapFrames.map((r,i)=>`<figure><img src="${r.screenshot.split('/').at(-1)}"><figcaption>${i+1}. ${r.name.slice(5).replaceAll('-',' → ')} · ${r.seconds.toFixed(1)} seconds · ${r.frames.length} sampled frames</figcaption></figure>`).join('')}</main>`);
  await writeFile(dir+'/'+kind+'.json',JSON.stringify(report,null,2));await fixture.browser.close();fixture=null;
 }
 const findings=reports.flatMap(r=>r.findings.map(f=>({account:r.account,...f}))).sort((a,b)=>b.rank-a.rank);
 await writeFile(dir+'/ranked.json',JSON.stringify(findings,null,2));await writeFile(dir+'/server.log',log);
 console.log('MOVEMENT SUMMARY '+JSON.stringify({routes:reports.reduce((n,r)=>n+r.routes.length,0),stuck:findings.filter(f=>f.kind==='stuck').length,findings:findings.length,dir}));
 assert(!/mod failed to load|SyntaxError|ReferenceError/.test(log));if(tag.startsWith('after'))assert.equal(findings.length,0,'Movement findings remain');
}catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(timeout);await cleanup()}

function planRoutes(){
 const H=House,nodes=new Map(),size=10,heights={U:73,G:353};
 for(const lvl of ['U','G','S'])for(let x=-277.5;x<470;x+=size)for(let z=-557.5;z<1110;z+=size){
  const stair=H._.grids.stairs.find(s=>x>=s.x0+22&&x<=s.x1-22&&z>=s.z0&&z<=s.z1);
  if(lvl==='S'&&!stair)continue;
  const y=lvl==='S'?stair.y(x,z):heights[lvl],L=y<213?'U':'G';
  const f=H._.floorAt(x,z,L,y,60);if(f&&Math.abs(f.y-y)<1)nodes.set(lvl+':'+x+':'+z,{id:lvl+':'+x+':'+z,x,z,y,lvl:L,edges:[]});
 }
 for(const n of nodes.values())for(const dx of [-10,0,10])for(const dz of [-10,0,10])if(dx||dz)for(const layer of ['U','G','S']){
  const m=nodes.get(layer+':'+(n.x+dx)+':'+(n.z+dz));if(!m||Math.abs(m.y-n.y)>(H._.grids.shells?8.01:25))continue;
  const f=H._.floorAt((n.x+m.x)/2,(n.z+m.z)/2,n.lvl,n.y,60);if(f&&Math.abs(f.y-m.y)<=25)n.edges.push(m.id);
 }
 const defs=[['bedroom',80,180,'U'],['landing',300,190,'U'],['hall',280,640,'G'],['lounge',100,560,'G'],['kitchen',120,260,'G'],['garden',20,-360,'G'],['drive',300,880,'G'],['cupboard',365,400,'G']];
 const stations=defs.map(([name,x,z,lvl])=>{const n=[...nodes.values()].filter(n=>n.lvl===lvl&&Math.abs(n.y-heights[lvl])<1).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];return{...n,name,edges:undefined}});
 function path(a,b){const start=stations[a],goal=stations[b],open=new Set([start.id]),cost=new Map([[start.id,0]]),prev=new Map();
  while(open.size){let id,best=Infinity;for(const k of open){const n=nodes.get(k),f=cost.get(k)+Math.hypot(n.x-goal.x,n.z-goal.z,n.y-goal.y);if(f<best){best=f;id=k}}
   if(id===goal.id){const out=[];for(let k=id;k;k=prev.get(k)){const n=nodes.get(k);out.unshift({x:n.x,z:n.z,y:n.y,lvl:n.lvl})}return out}
   open.delete(id);const n=nodes.get(id);for(const k of n.edges){const m=nodes.get(k),c=cost.get(id)+Math.hypot(n.x-m.x,n.z-m.z,n.y-m.y);if(c<(cost.get(k)??Infinity)){cost.set(k,c);prev.set(k,id);open.add(k)}}
  }return null;
 }
 const routes={};for(let a=0;a<stations.length;a++)for(let b=0;b<stations.length;b++)if(a!==b)routes[a+':'+b]=path(a,b);
 const doors=[['bedroom',190,190,90,'U'],['kitchen',265,190,-90,'G'],['lounge',265,520,-90,'G'],['back',120,10,0,'G'],['front',300,640,180,'G'],['cupboard',285,392,90,'G']].map(([id,x,z,yaw,lvl])=>({id,yaw,barrier:H.DOORS[id].closedBounds,from:{x,z,y:heights[lvl],lvl}}));
 const hallClearance=[230,250,400,438,520,550,560,580,600].map(z=>{const runs=[];let start=null;for(let x=207;x<=329;x++){const ok=x<329&&H._.floorAt(x,z,'G',353,H.STAND||128)?.y===353;if(ok&&start===null)start=x;if(!ok&&start!==null){runs.push([start,x-1]);start=null}}return{z,freeBodyCentres:runs}});
 return{stations,routes,doors,hallClearance};
}
function HouseRampDelta(a,b){
 const ramp=p=>p.x>=355&&p.x<=388&&p.z>=200&&p.z<=650;
 return ramp(a)&&ramp(b) ? .8*(Math.max(0,Math.min(350,b.z-250))-Math.max(0,Math.min(350,a.z-250))) : 0;
}
