// Matched native strips, production rig, one serial browser and disposable data.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import net from 'node:net';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=root+'tests/shots/models/r9/'+label+'/';
let server,browser,log='';const data=await mkdtemp('/tmp/jhp-r9-art-');const report={label,frames:[],budgets:{}};
try{
 await mkdir(out,{recursive:true});let port;for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const stream of [server.stdout,server.stderr])stream.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port;for(let i=0;i<100;i++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__r9.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Rig evidence</title><link rel="icon" href="data:,"><style>body{margin:0}canvas{display:block}</style><script src="/vendor/three.min.js"></script><script src="/js/np-rig.js"></script>'}));
 if(baseline)await page.route('**/js/np-rig.js',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{cwd:root,encoding:'utf8'})}));
 await page.addInitScript(()=>{let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});await page.goto(base+'/__r9.html');
 await page.evaluate(()=>{
 const T=THREE,p=window.p={clock:0};performance.now=()=>p.clock;
 p.scene=new T.Scene();p.scene.background=new T.Color('#b5ada0');p.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});p.renderer.setSize(1366,860);document.body.appendChild(p.renderer.domElement);
 p.camera=new T.PerspectiveCamera(40,1366/860,1,2000);p.scene.add(new T.HemisphereLight(0xfff3dc,0x777585,.95));const key=new T.DirectionalLight(0xffefdb,.75);key.position.set(-160,300,250);p.scene.add(key);p.wrapper=new T.Group();p.wrapper.scale.y=-1;p.scene.add(p.wrapper);
 p.step=n=>{for(let i=0;i<n;i++){p.clock+=1000/60;p.rig.update(1/60,true)}};
 p.reset=(id,action)=>{p.rig?.dispose();const r=p.rig=NPCRig.create(id,{tier:'low',outfit:id==='dad'?'home':undefined});p.wrapper.add(r.group);r.floor=()=>0;r.teleport(0,0,0,0);r.set({action,seat:action==='phone'?null:{h:45,back:true}});Object.assign(r.st,{t:12,seed:2.7,lean:1,blinkAt:Infinity,glanceAt:Infinity,saccadeAt:Infinity});p.step(180);r.st.sipAt=-1;r.st.sipK=0;r.st.sipRest=0;r.st.sipQuiet=0;};
 p.render=angle=>{const r=p.rig,a=angle*Math.PI/180;p.camera.position.set(Math.sin(a)*260,110,Math.cos(a)*260);p.camera.lookAt(0,95,0);p.renderer.render(p.scene,p.camera)};
 p.metrics=()=>{const r=p.rig;r.group.updateMatrixWorld(true);const pt=(b,v=new T.Vector3())=>r.bones[b].localToWorld(v),a=pt('armR'),e=pt('foreR'),hand=pt('handR'),ear=pt('head',new T.Vector3(-r.S.head.r[0]-.7,r.S.head.c[1]-r.J.head[1]-.8,1.5-r.J.head[2]));return{sip:r.st.sipK,elbowBelow:a.y-e.y,elbowOut:Math.max(0,Math.abs(e.x)-Math.abs(a.x)),rimGap:pt('p_mug',new T.Vector3(3.2,4.5,-3.5)).distanceTo(pt('mouth')),phoneGap:Math.min(pt('p_phone',new T.Vector3(1.2,-7,1.8)).distanceTo(ear),pt('p_phone',new T.Vector3(1.2,8,1.8)).distanceTo(ear)),paperScale:r.bones.p_paper.scale.x,magScale:r.bones.p_mag.scale.x,sit:r.st.sitK,reading:r.st.readingTransfer,draws:p.renderer.info.render.calls,triangles:r.tris+6};};
 });
 async function shot(name,angle,meta){await page.evaluate(a=>p.render(a),angle);await page.screenshot({path:out+name,clip:{x:333,y:0,width:700,height:860}});report.frames.push({name,...meta,...await page.evaluate(()=>p.metrics())});}
 for(const id of ['mom','dad','sister'])for(const angle of [0,45,90]){
 await page.evaluate(id=>p.reset(id,'tea'),id);for(const [i,n]of [30,48,54,30,54].entries()){await page.evaluate(n=>p.step(n),n);await shot(`sip-${id}-${angle}-${i}.png`,angle,{id,action:'tea',angle,frame:i});}}
 for(const angle of [0,45,90]){await page.evaluate(()=>{p.reset('mom','phone');p.rig.set({engage:true,look:{x:150,y:-145,z:100}})});for(const [i,n]of [1,12,24,30].entries()){await page.evaluate(n=>p.step(n),n);await shot(`phone-mom-${angle}-${i}.png`,angle,{id:'mom',action:'phone',angle,frame:i});}}
 for(const [id,action]of [['dad','paper'],['mom','magazine']])for(const angle of [0,45,90]){
 await page.evaluate(({id,action})=>p.reset(id,action),{id,action});for(const [i,n]of [0,18,30,42,90,30,48,90,90].entries()){
 await page.evaluate(({i,n,action})=>{if(i===1){p.rig.prepareReading?.();}if(i===4)p.rig.set({seat:null,action:null});if(i===5)p.rig.set({seat:{h:45,back:true},action});p.step(n)},{i,n,action});await shot(`reading-${id}-${angle}-${i}.png`,angle,{id,action,angle,frame:i});}}
 report.budgets=await page.evaluate(()=>{const o={};for(const tier of ['low','potato'])for(const id of Object.keys(NPCRig.OUTFITS))for(const outfit of NPCRig.OUTFITS[id]){const r=NPCRig.create(id,{tier,outfit});for(const near of [true,false]){r.update(.016,near);o[[tier,id,outfit,near?'near':'far'].join('.')]=r.tris+6;}r.dispose()}return o});assert(Object.values(report.budgets).every(n=>n<=3000));assert(report.frames.every(f=>f.draws===2));assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));
 console.log('PASS',label,report.frames.length,'native poses; every Low/Potato outfit <=3000, two draws');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await browser?.close();if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}await writeFile(out+'server.log',log);await rm(data,{recursive:true,force:true});}
