// Original production-rig probes, matched cameras/timestamps, serial Chromium.
// Owns a disposable server and DATA_DIR; never opens the game or real saves.
// node tests/models-animation.mjs --label=before [--baseline] [--only=idle,walk,...]
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname, out=root+'tests/shots/models/';
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8)||'after';
assert(/^[a-z0-9-]+$/.test(label));
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const baseline=process.argv.includes('--baseline');
const stairRise=Number(process.argv.find(a=>a.startsWith('--stairs-rise='))?.slice(14)||17.5);
assert(stairRise===17.5||stairRise===20,'Supported diagnostic / house riser height');
let port,server,browser,log='';const data=await mkdtemp('/tmp/jhp-models-');
await mkdir(out+label,{recursive:true});
for(let p=18080;p<=18099;p++)if(await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))})){port=p;break;}
assert(port,'No free throwaway port');
try{
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;
 for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await page.addInitScript(()=>{let seed=1999;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}});
 await page.route('**/__models.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Rig evidence</title><link rel="icon" href="data:,"><style>html,body{margin:0;overflow:hidden;background:#b5ada0}canvas{display:block}</style><script src="/vendor/three.min.js"></script><script src="/js/np-rig.js"></script>'}));
 if(baseline)await page.route('**/js/np-rig.js',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{cwd:root,encoding:'utf8'})}));
 await page.goto(base+'/__models.html',{waitUntil:'load'});
 assert(await page.evaluate(()=>!!window.NPCRig));
 await page.evaluate(stairRise=>{
  const T=THREE,s=window.probe={};
  s.scene=new T.Scene();s.scene.background=new T.Color('#b5ada0');
  s.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});s.renderer.setPixelRatio(1);document.body.appendChild(s.renderer.domElement);
  s.camera=new T.PerspectiveCamera(52,1,1,2000);
  s.scene.add(new T.HemisphereLight(0xfff3dc,0x777585,.95));
  const key=new T.DirectionalLight(0xffefdb,.75);key.position.set(-160,300,250);s.scene.add(key);
  s.stage=new T.Group();s.scene.add(s.stage);
  const floor=new T.Mesh(new T.BoxGeometry(1800,2,1800),new T.MeshLambertMaterial({color:0xb9ab96}));floor.position.y=-1;s.stage.add(floor);
  s.stairs=new T.Group();s.stage.add(s.stairs);
  for(let i=0;i<9;i++){const h=(i+1)*stairRise,m=new T.Mesh(new T.BoxGeometry(100,h,25),new T.MeshLambertMaterial({color:i%2?0x9a8974:0xa5947d}));m.position.set(0,h/2,i*25+12.5);s.stairs.add(m)}
  {const h=9*stairRise,m=new T.Mesh(new T.BoxGeometry(100,h,150),new T.MeshLambertMaterial({color:0xa5947d}));m.position.set(0,h/2,300);s.stairs.add(m);}
  s.wrapper=new T.Group();s.wrapper.scale.y=-1;s.scene.add(s.wrapper);
  s.render=(dist,angle=0)=>{const r=s.rig;s.renderer.setSize(innerWidth,innerHeight,false);s.camera.aspect=innerWidth/innerHeight;s.camera.updateProjectionMatrix();const x=r.st.x,z=r.st.z,y=-r.st.y;s.camera.position.set(x+Math.sin(angle)*dist,y+110,z+Math.cos(angle)*dist);s.camera.lookAt(x,y+r.S.H*.48,z);s.renderer.render(s.scene,s.camera)};
  s.reset=(id,state)=>{s.rig?.dispose();const r=s.rig=NPCRig.create(id,{tier:'low',outfit:id==='dad'?'home':undefined});s.wrapper.add(r.group);r.floor=state.startsWith('stairs')?(x,z)=>z<0?0:-Math.min(9*stairRise,(Math.floor(z/25)+1)*stairRise):()=>0;r.teleport(0,state==='stairs-down'?-9*stairRise:0,state==='stairs-down'?250:state==='stairs'?-40:0,state==='stairs-down'?Math.PI:0);Object.assign(r.st,{t:12,seed:2.7,lean:id==='dad'?-1:1,blinkAt:13.1,glanceAt:100,saccadeAt:100,talkSeed:2});r.st.gaze.x=r.st.gaze.y=0;s.stairs.visible=state.startsWith('stairs');r.set({action:['magazine','draw','water'].includes(state)?state:state==='briefcase'?'leave':['page','release'].includes(state)?'paper':state==='carry'?'mug':state==='job'?(id==='mom'?'washup':id==='dad'?'paper':'draw'):state==='door'?'reach':null,carry:state==='carry'});if((state==='job'&&id!=='mom')||['magazine','draw','page','release'].includes(state))r.set({seat:{h:45,back:true,footH:id==='sister'?24:undefined}});for(let i=0;i<60;i++)r.update(1/60,true);if(state==='release')for(let n=0;n<180;n++)r.update(1/60,true);if(state==='page')r.st.t=5.95;s.frame=0;s.state=state;if(state==='question'){r.set({engage:true,look:{x:60,y:-r.S.neck,z:200}});r.talk(10000,'Would you like to help?',{started:true,ended:false,level:()=>.7,progress:()=>Math.min(.99,s.frame/90)});}};
  s.advance=target=>{const r=s.rig,state=s.state,dt=1/60;for(;s.frame<target;s.frame++){
   const t=(s.frame+1)*dt;
   if(['walk','stop','stairs','stairs-down'].includes(state)){const speed=state==='stop'&&t>0.65?Math.max(0,r.S.speed*(1-(t-.65)/.35)):r.S.speed*(state.startsWith('stairs')?.65:1);const down=state==='stairs-down',z=r.st.z+speed*dt*(down?-1:1);const y=state.startsWith('stairs')?-Math.max(0,Math.min(9*stairRise,(z+12.5)/25*stairRise)):0;r.root(0,y,z,down?Math.PI:0,speed);}
   if(state==='side'){r.root(t*42,0,0,0,0);}
   if(state.startsWith('turn')){const angle=Number(state.slice(4))||180;r.root(0,0,0,Math.min(angle*Math.PI/180,t*Math.PI/1.25),0);}
   if(state==='release'&&s.frame===0)r.set({engage:true});
   if(state==='armless')r.set({seat:{h:45,back:false,footH:r.kind==='sister'?24:undefined},action:'sit'});
   if(state==='sit')r.set({seat:{h:45,back:true,footH:r.kind==='sister'?24:undefined}});
   if(state==='stand'){if(s.frame===0){r.set({seat:{h:45,back:true,footH:r.kind==='sister'?24:undefined}});for(let i=0;i<180;i++)r.update(dt,true);}r.set({seat:null});}
   if(state==='talk'){r.talk(10000,'That sounds like a good idea!');r.st.talkStart=performance.now()-t*1000;r.set({look:{x:80,y:-140,z:200}});}
   r.update(dt,true);
  }};
 },stairRise);
 const report={label,baseline,stairRise,units:'milliseconds per rig.update; warmed serial JS batches, no rendering',triangles:{},performance:{},frames:[]};
 report.triangles=await page.evaluate(()=>{const o={};for(const tier of ['low','high'])for(const id of Object.keys(NPCRig.OUTFITS))for(const outfit of NPCRig.OUTFITS[id]){const r=NPCRig.create(id,{tier,outfit});for(const near of [true,false]){r.update(.016,near);o[[tier,id,outfit,near?'near':'far'].join('.')]=r.tris+6;}r.dispose()}return o});
 report.performance=process.argv.includes('--skip-perf')?{}:await page.evaluate(()=>{
  const out={};for(const mode of ['idle','walk','job','far']){const rigs=['mom','dad','sister'].map(id=>NPCRig.create(id,{tier:'low'}));for(const r of rigs){r.floor=()=>0;r.teleport(0,0,0,0);if(mode==='job')r.set({action:r.kind==='mom'?'washup':'paper'});}
   let frame=0;const run=()=>{frame++;for(const r of rigs){if(mode==='walk')r.root(0,0,frame*r.S.speed/60,0,r.S.speed);r.update(1/60,mode!=='far')}};
   for(let i=0;i<1500;i++)run();const a=[];for(let b=0;b<13;b++){const t=performance.now();for(let i=0;i<2000;i++)run();a.push((performance.now()-t)/2000/3)}a.sort((a,b)=>a-b);out[mode]={median:a[6],p95:a[12],all:a};for(const r of rigs)r.dispose();
  }return out;
 });
 const states=['question','magazine','draw','water','briefcase','page','release','armless','stairs-down','turn45','turn90','turn180','idle','walk','stop','turn','side','stairs','door','sit','stand','job','carry','talk','rear'];
 for(const device of ['desktop','phone']){
  await page.setViewportSize(device==='phone'?{width:390,height:844}:{width:1366,height:860});
  for(const id of ['mom','dad','sister'])for(const dist of [200,400])for(const state of states){
   if(only&&!only.includes(state))continue;
   const owner={magazine:'mom',draw:'sister',water:'mom',briefcase:'dad',page:'dad',release:'dad'}[state];if(owner&&id!==owner)continue;
   await page.evaluate(({id,state})=>probe.reset(id,state),{id,state});
   for(const [i,n] of (state==='release'?[0,1,3,6]:[6,24,48,84]).entries()){
    await page.evaluate(({n,dist,state})=>{probe.advance(n);probe.render(dist,state==='rear'?Math.PI:state.startsWith('stairs')||state==='side'?Math.PI/2:Math.PI/8)}, {n,dist,state});
    const name=[device,id,dist,state,i].join('-')+'.png';
    // Keep actual projected size; the desktop crop removes only empty margins.
    await page.screenshot({path:out+label+'/'+name,clip:device==='desktop'?{x:443,y:0,width:480,height:860}:undefined});
    report.frames.push({name,device,id,dist,state,frame:n});
   }
  }
 }
 report.renderer=await page.evaluate(()=>{const r=probe.renderer,g=r.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');probe.stage.visible=false;probe.render(200);return {renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown',calls:r.info.render.calls,triangles:r.info.render.triangles}});
 assert.equal(report.renderer.calls,2,'Rig draws increased');
 for(const [k,n]of Object.entries(report.triangles))if(k.startsWith('low'))assert(n<=3000,k+' exceeds 3k: '+n);
 assert.deepEqual(errors,[]);
 await writeFile(out+label+'/metrics.json',JSON.stringify(report,null,2));
 console.log('MODELS',JSON.stringify({label,renderer:report.renderer,performance:report.performance,triangles:report.triangles,frames:report.frames.length}));
 assert(!/mod failed to load/i.test(log),'Server mod failed to load');
}finally{await browser?.close();if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end}await rm(data,{recursive:true,force:true});}
