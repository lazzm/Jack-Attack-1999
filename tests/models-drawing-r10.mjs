// Matched native strips, production rig, one serial browser and disposable data.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=root+'tests/shots/models/r10-drawing/'+label+'/';
let server,browser,log='';const data=await mkdtemp('/tmp/jhp-r9-art-');const report={label,frames:[],budgets:{}};
try{
 await mkdir(out,{recursive:true});let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall due to ReadPixels/.test(m.text()))errors.push(m.text())});
 await page.route('**/__r9.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Rig evidence</title><link rel="icon" href="data:,"><style>body{margin:0}canvas{display:block}</style><script src="/vendor/three.min.js"></script><script src="/js/np-rig.js"></script>'}));
 if(baseline)await page.route('**/js/np-rig.js',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{cwd:root,encoding:'utf8'})}));
 await page.addInitScript(()=>{let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});await page.goto(base+'/__r9.html');
 await page.evaluate(()=>{
 const T=THREE,p=window.p={clock:0};performance.now=()=>p.clock;
 p.scene=new T.Scene();p.scene.background=new T.Color('#b5ada0');p.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});p.renderer.setSize(1366,860);document.body.appendChild(p.renderer.domElement);
 p.camera=new T.PerspectiveCamera(40,1366/860,1,2000);p.scene.add(new T.HemisphereLight(0xfff3dc,0x777585,.95));const key=new T.DirectionalLight(0xffefdb,.75);key.position.set(-160,300,250);p.scene.add(key);p.wrapper=new T.Group();p.wrapper.scale.y=-1;p.scene.add(p.wrapper);
 p.step=n=>{for(let i=0;i<n;i++){p.clock+=1000/60;p.rig.update(1/60,true)}};
 p.reset=(id,action)=>{p.rig?.dispose();const r=p.rig=NPCRig.create(id,{tier:'low',outfit:id==='dad'?'home':undefined});p.wrapper.add(r.group);r.floor=()=>0;r.teleport(0,0,0,0);r.set({action,seat:action==='phone'?null:{h:45,back:true}});Object.assign(r.st,{t:12,seed:2.7,lean:1,blinkAt:Infinity,glanceAt:Infinity,saccadeAt:Infinity});const body=r.mesh.onBeforeRender;r.mesh.onBeforeRender=function(...a){p.calls++;body.apply(this,a)};r.shadow.onBeforeRender=()=>p.calls++;p.step(180);r.st.sipAt=-1;r.st.sipK=0;r.st.sipRest=0;r.st.sipQuiet=0;};
 p.render=angle=>{const r=p.rig,a=angle*Math.PI/180;p.camera.position.set(Math.sin(a)*260,110,Math.cos(a)*260);p.camera.lookAt(0,95,0);p.calls=0;p.renderer.render(p.scene,p.camera)};
 p.metrics=()=>{const r=p.rig;r.group.updateMatrixWorld(true);const pt=(b,v=new T.Vector3())=>r.bones[b].localToWorld(v),a=pt('armR'),e=pt('foreR'),hand=pt('handR'),ear=pt('head',new T.Vector3(-r.S.head.r[0]-.7,r.S.head.c[1]-r.J.head[1]-.8,1.5-r.J.head[2]));return{sip:r.st.sipK,elbowBelow:a.y-e.y,elbowOut:Math.max(0,Math.abs(e.x)-Math.abs(a.x)),rimGap:pt('p_mug',new T.Vector3(3.2,4.5,-3.5)).distanceTo(pt('mouth')),phoneGap:Math.min(pt('p_phone',new T.Vector3(1.2,-7,1.8)).distanceTo(ear),pt('p_phone',new T.Vector3(1.2,8,1.8)).distanceTo(ear)),paperScale:r.bones.p_paper.scale.x,magScale:r.bones.p_mag.scale.x,sit:r.st.sitK,reading:r.st.readingTransfer,draws:p.calls,sceneCalls:p.renderer.info.render.calls,triangles:r.tris+6};};
 });
 async function shot(name,angle,meta){await page.evaluate(a=>p.render(a),angle);await page.screenshot({path:out+name,clip:{x:333,y:0,width:700,height:860}});report.frames.push({name,...meta,...await page.evaluate(()=>p.metrics())});}
 await page.evaluate(()=>{
  p.table=new THREE.Group();const m=new THREE.MeshLambertMaterial({color:0x9d7750});const box=(x,y,z,w,h,d)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.table.add(o)};box(0,65.7,30,54,3,42);for(const x of [-22,22])for(const z of [14,46])box(x,32.1,z,3,64.2,3);p.scene.add(p.table);
  p.drawView=view=>{p.table.visible=view!=='reverse';if(view==='wide'){p.camera.position.set(110,115,150);p.camera.lookAt(0,75,20)}else if(view==='close'){p.camera.position.set(-28,125,86);p.camera.lookAt(-5,68,30)}else{p.camera.position.set(-5,45,65);p.camera.lookAt(0,67,30)}p.calls=0;p.renderer.render(p.scene,p.camera)};
 });
 for(const view of ['wide','close']){
  await page.evaluate(()=>{p.reset('sister','draw');p.rig.st.drawElapsed=0;p.rig.st.drawLast=p.rig.st.t;p.rig.update(0,true)});
  for(const [i,n]of [0,70,105,175,175,210,315,210].entries()){
   await page.evaluate(({n,view})=>{p.step(n);p.drawView(view)},{n,view});await page.screenshot({path:out+view+'-'+i+'.png'});
   report.frames.push({name:view+'-'+i+'.png',view,...await page.evaluate(()=>{const r=p.rig;r.group.updateMatrixWorld(true);const tip=r.bones.p_crayon.localToWorld(new THREE.Vector3(0,-6,1.5)),local=r.bones.p_pad.worldToLocal(tip.clone());return {draws:p.calls,sceneCalls:p.renderer.info.render.calls,elapsed:r.st.drawElapsed||0,ink:r.mesh.material.userData.np.npDrawing?.value||0,tip:local.toArray(),triangles:r.tris+6}})});
  }
 }
 await page.evaluate(()=>p.drawView('reverse'));await page.screenshot({path:out+'reverse.png'});
 report.tiers=[];
 for(const tier of ['potato','std']){
  const info=await page.evaluate(tier=>{p.rig.dispose();const r=p.rig=NPCRig.create('sister',{tier});p.wrapper.add(r.group);r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,table:67,back:true},action:'draw'});r.restoreDrawing?.({elapsed:21});p.step(180);p.drawView('close');return {tier,triangles:r.tris+6,sceneCalls:p.renderer.info.render.calls,skinned:r.group.children.filter(o=>o.isSkinnedMesh).length}},tier);
  await page.screenshot({path:out+'tier-'+tier+'.png'});report.tiers.push(info);assert.equal(info.skinned,2);assert.equal(info.sceneCalls,7);
 }
 for(const [device,width,height]of [['phone-portrait',390,844],['phone-landscape',844,390],['tablet-portrait',768,1024],['tablet-landscape',1024,768]]){
  await page.setViewportSize({width,height});await page.evaluate(({width,height})=>{p.renderer.setSize(width,height);p.camera.aspect=width/height;p.camera.updateProjectionMatrix();p.drawView('wide')},{width,height});await page.screenshot({path:out+device+'.png'});
 }
 report.budgets=await page.evaluate(()=>{const o={};for(const tier of ['low','potato'])for(const id of Object.keys(NPCRig.OUTFITS))for(const outfit of NPCRig.OUTFITS[id]){const r=NPCRig.create(id,{tier,outfit});for(const near of [true,false]){r.update(.016,near);o[[tier,id,outfit,near?'near':'far'].join('.')]=r.tris+6;}r.dispose()}return o});assert(Object.values(report.budgets).every(n=>n<=3000));assert(report.frames.every(f=>f.draws===2));assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));
 console.log('PASS',label,report.frames.length,'native poses; every Low/Potato outfit <=3000, two draws');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await browser?.close();if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}await writeFile(out+'server.log',log);await rm(data,{recursive:true,force:true});}
