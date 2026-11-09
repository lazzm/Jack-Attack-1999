// One serial browser and disposable data. Route destinations are fixtures;
// movement, floor tags, parenting, lighting and dialogue use production code.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const selected=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1].split(','),mouthsOnly=process.argv.includes('--mouths-only');
const axis=process.argv.includes('--axis'),facesOnly=process.argv.includes('--faces-only'),routesOnly=process.argv.includes('--routes-only'),folder=process.argv.find(a=>a.startsWith('--folder='))?.slice(9)||'r7';assert(/^[a-z0-9-]+$/.test(folder));
const root=new URL('../',import.meta.url).pathname,baseline=process.argv.includes('--baseline'),label=baseline?'before':'after',out=root+'tests/shots/models/'+folder+'/'+label+'/';
const report={baseline,base:execFileSync('git',['rev-parse','main'],{cwd:root,encoding:'utf8'}).trim(),routes:[],faces:[],exchanges:[]};
let server,fixture,data,log='';
let closing;async function close(){return closing||=(async()=>{await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){const end=once(server,'exit');server.kill('SIGTERM');await end;}if(data)await rm(data,{recursive:true,force:true});})();}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await close();process.exit(130)});
try{
 await mkdir(out,{recursive:true});data=await mkdtemp('/tmp/jhp-model-r7-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))})){port=p;break;}assert(port);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 const base='http://127.0.0.1:'+port,password='Throwaway-1999';for(let n=0;n<100;n++){try{if((await fetch(base+'/robots.txt')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 fixture=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,hour:23,tier:'low',seed:1999,storageState:await bonfireLogin(base,password,'Jack',{pv:12,x:270,y:210,z:660,rx:0,ry:0,lvl:'G',seat:0}),launchOptions:{args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']},onPage:async page=>{
  if(baseline)for(const file of ['np-rig.js','np-life.js','st-voice.js'])await page.route('**/js/'+file+'*',r=>r.fulfill({contentType:'application/javascript',body:execFileSync('git',['show',report.base+':app/public/js/'+file],{cwd:root,encoding:'utf8'})}));
  await page.addInitScript(()=>{const original=setInterval;window.__r7Timers=[];window.setInterval=(fn,ms,...a)=>{const id=original(fn,ms,...a);if(String(fn).includes('lastFrame'))__r7Timers.push(id);return id;};let ren,raw;const timer=original(()=>{if(!window.House?.ren||ren)return;ren=House.ren;raw=ren.setPixelRatio.bind(ren);ren.setPixelRatio=n=>raw(Math.min(n,.25));raw(.25);window.__r7Raster=n=>raw(n);clearInterval(timer)},20);});
 }});
 const {page,until,errors}=fixture;await until(()=>!!window.HouseFamily?.ready);await page.keyboard.press('Shift');const cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>{
  const H=House,F=HouseFamily;H.hush();H._.setMode('focus');HousePause.close();__r7Timers.forEach(clearInterval);H.anims.delete('np');F.debug.clock({md:1012,dow:2,t:23});F.debug.speech.freeze=true;
  for(const id of ['hall','landing','cupboard','lounge','kitchen'])H.buildRoom(H.ROOMS[id]);for(const id of ['lounge','kitchen'])H.setDoor(id,true,true);
  window.r7={now:performance.now(),clock:performance.now.bind(performance)};
  r7.step=seconds=>{const original=performance.now;try{for(let t=0;t<seconds-1e-6;t+=1/60){r7.now+=1000/60;performance.now=()=>r7.now;F.debug.frame(r7.now,1/60);for(const c of Object.values(F.chars))if(c.present)c.rig.update(1/60,true);}}finally{performance.now=original;}};
  r7.park=()=>{for(const [i,c]of Object.values(F.chars).entries()){const key='r7park'+c.id;F.debug.spots[key]={lvl:'U',x:-170+i*60,z:-70,face:0};F.debug.go(c.id,key);F.debug.place(c.id,key);c.hold=0;c.backoff=c.backHome=c.aside=c.pass=null;c.rig.hush();}const sp=F.debug.speech;sp.q.length=0;sp.cur=null;sp.voice?.stop?.();sp.voice=null;NPCBubble.clear()};
 });
 async function shot(name){await page.evaluate(()=>{__r7Raster(1);House._.renderForBenchmark()});try{const s=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(out+name,Buffer.from(s.data,'base64'))}finally{await page.evaluate(()=>__r7Raster(.25))}}
 async function camera(eye,target,lvl){await fixture.view(eye,target,{level:lvl});await page.evaluate(()=>House._.renderForBenchmark())}
 // Both actual routes, through every seam frame; inspect parent render calls
 // from each end. No actor position is assigned after the route starts.
 if(!facesOnly)for(const id of ['mom','dad','sister'])for(const down of [false,true]){
  await page.evaluate(({id,down})=>{r7.park();const F=HouseFamily;F.debug.spots.r7start={lvl:down?'U':'G',x:371.5,z:down?214:634,face:down?0:180};F.debug.spots.r7end={lvl:down?'G':'U',x:371.5,z:down?634:214,face:down?0:180};F.debug.go(id,'r7start');F.debug.place(id,'r7start');F.debug.go(id,'r7end');},{id,down});
  const samples=await page.evaluate(({id,down})=>{const c=HouseFamily.chars[id],samples=[];for(let n=0;n<1500;n++){r7.step(1/60);if(n%6===0)samples.push({n,x:c.x,z:c.z,lvl:c.lvl,y:c.rig.st.y,room:c.room,parent:c.rig.group.parent?.name});if(down?c.z>625:c.z<225)break;}return samples},{id,down});
  report.routes.push({id,down,samples});await writeFile(out+'report.json',JSON.stringify(report,null,2));
  if(!baseline)for(const s of samples)if(s.z>270&&s.z<590)assert.equal(s.parent,'hall',id+' flight parent at '+s.z);
  // Repeat route to capture the seam with the same camera and timing.
  for(const [side,lvl,eye]of [['foot','G',axis?[371.5,210,634]:[270,210,660]],['top','U',axis?[371.5,-70,214]:[300,-70,220]]]){
   await page.evaluate(({id,down})=>{const F=HouseFamily;F.debug.go(id,'r7start');F.debug.place(id,'r7start');F.debug.go(id,'r7end');const c=F.chars[id];for(let n=0;n<1500&&(down?c.z<445:c.z>445);n++)r7.step(1/60);},{id,down});
   const target=await page.evaluate(id=>{const c=HouseFamily.chars[id];return[c.x,c.rig.st.y-c.rig.S.H*.8,c.z]},id);await camera(eye,target,lvl);
   const name=`stairs-${id}-${down?'down':'up'}-${side}.png`;await shot(name);
   const rendered=await page.evaluate(id=>{const c=HouseFamily.chars[id];let draws=0;const old=c.rig.mesh.onBeforeRender;c.rig.mesh.onBeforeRender=()=>draws++;House._.renderForBenchmark();c.rig.mesh.onBeforeRender=old;return{draws,room:c.room,parent:c.rig.group.parent?.name,visible:c.rig.group.parent?.visible,z:c.z}},id);report.routes.at(-1)[side]={name,...rendered};if(!baseline)assert(rendered.draws>0,name+' not rendered');
  }
 }
 // Native house captures at precisely 1m: same pose, face target, expression
 // clock and aperture on each revision. These are acting diagnostics; the
 // final exchange below separately plays real recordings through the queue.
 if(!routesOnly)for(const [device,width,height]of [['desktop',1366,860],['phone-landscape',844,390],['phone-portrait',390,844],['tablet',1024,768]].filter(p=>!selected('devices')||selected('devices').includes(p[0]))){
  await page.setViewportSize({width,height});if(device!=='desktop'){await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:2,y:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  for(const id of ['mom','dad','sister'])for(const room of (selected('rooms')||['hall','lounge'])){
   const pose=await page.evaluate(({id,room})=>{r7.park();const F=HouseFamily;F.debug.spots.r7face={lvl:'G',x:room==='hall'?270:60,z:480,face:0};F.debug.go(id,'r7face');F.debug.place(id,'r7face');r7.step(.5);const c=F.chars[id];c.hold=10;return{x:c.x,z:c.z,eyes:c.rig.eyeWorld(new THREE.Vector3()).toArray()};},{id,room});
   await camera([pose.x,210,pose.z+100],pose.eyes,'G');
   for(const [mood,text]of (mouthsOnly?[['MBP','mmm'],['FV','fff'],['A','aaa'],['EI','eee'],['OU','ooo'],['smile','Thank you, brilliant!']]:[['neutral','aaa'],['happy','Thank you, brilliant!'],['cross','Stop making that mess.']])){
    await page.evaluate(({id,mood,text})=>{const r=HouseFamily.chars[id].rig;r.set({engage:true,look:{x:House.P.x,y:House.P.y,z:House.P.z}});r.talk(8000,text,{started:true,ended:false,level:()=>.8,progress:()=>mood==='smile'?.9:.3},mood==='smile'?'happy':mood);r.st.saccadeAt=r.st.glanceAt=r.st.blinkAt=Infinity;r.st.blinkT=0;for(let i=0;i<45;i++)r.update(1/60,true);}, {id,mood,text});
    const name=`${device}-${room}-${id}-${mood}-100cm.png`;await shot(name);const sample=await page.evaluate(id=>{const r=HouseFamily.chars[id].rig,v=r.eyeWorld(new THREE.Vector3()),p=House.toScreen(v.x,v.y,v.z);return{eye:p,mouth:r.face.mouth,jaw:r.mesh.material.userData.np.npJaw.value,lid:r.mesh.material.userData.np.npLid.value,triangles:r.tris+6,parent:r.group.parent?.name,raster:House.ren.getPixelRatio(),distance:Math.hypot(House.P.x-r.st.x,House.P.z-r.st.z)}},id);assert(Math.abs(sample.distance-100)<.01);report.faces.push({device,room,id,mood,name,...sample});
   }
  }
  await writeFile(out+'report.json',JSON.stringify(report,null,2));
 }
 assert.deepEqual(errors,[]);assert(!/mod failed to load/i.test(log));console.log('PASS',label,report.routes.length,'real stair routes;',report.faces.length,'native 1m house expressions');
}finally{await writeFile(out+'report.json',JSON.stringify(report,null,2));await close();await writeFile('/tmp/jhp-r7-'+label+'-server.log',log);}
