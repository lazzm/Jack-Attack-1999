// Native matched views. HEAD is the manager-approved main baseline; no checkout changes.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {once} from 'node:events';
import net from 'node:net';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {stillCapture} from './still-capture.mjs';
const root=new URL('../',import.meta.url).pathname,tag=process.argv[2]||'after';
assert(['before','after'].includes(tag));
const dir=root+'tests/shots/world-art-round3/'+tag+'/';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.split('=')[1]?.split(',');
const budgetOnly=process.argv.includes('--budget-only');
const profiles=arg('profiles')||(budgetOnly?['fallback-noaa']:['full','fallback','portrait','landscape','tablet']),selected=arg('views');
const report={tag,views:[],errors:[]};let server,f,data,log='';
if(arg('profiles')||selected||budgetOnly)try{Object.assign(report,JSON.parse(await readFile(dir+'metrics.json','utf8')))}catch{}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{await f?.browser.close().catch(()=>{});if(server?.exitCode===null)server.kill('SIGTERM');process.exit(130)});
try{
 await mkdir(dir,{recursive:true});data=await mkdtemp('/tmp/jhp-world3-');let port;
 for(let p=18080;p<=18099;p++)if(await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(p,'127.0.0.1',()=>s.close(()=>r(true)))})){port=p;break}
 assert(port);server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=d);
 for(let i=0;i<300&&!log.includes('online at :'+port);i++)await new Promise(r=>setTimeout(r,100));
 assert(log.includes('online at :'+port));const base='http://localhost:'+port,password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).ok);
 for(const mode of profiles){
  const touch=mode!=='full'&&!mode.startsWith('fallback'),rung=mode==='full'?0:5;
  const [width,height]=mode==='portrait'?[390,844]:mode==='landscape'?[844,390]:mode==='tablet'?[768,1024]:[1366,860];
  console.log('START',tag,mode,new Date().toISOString());
  f=await roomFixture(base,{account:'Jack',password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,'Jack',{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),hour:12,width,height,touch,seed:1999,contextOptions:{deviceScaleFactor:1,isMobile:touch},onPage:async p=>{
   await stillCapture(p);
   await p.addInitScript(msaa=>{localStorage.setItem('jhp_hs_msaa',JSON.stringify(msaa));localStorage.setItem('jhp_touch_slow_asked','true');Date.prototype.getSeconds=()=>0},!process.argv.includes('--no-msaa'));
   if(tag==='before')for(const file of ['hs-house.js','hs-kit.js','hs-environment.js','hs-art.js'])await p.route('**/js/'+file+'*',route=>route.fulfill({body:execFileSync('git',['show','HEAD:app/public/js/'+file],{cwd:root,encoding:'utf8',maxBuffer:16<<20}),contentType:'application/javascript'}));
  }});
  const {page:p}=f;console.log('READY',mode,new Date().toISOString());
  await p.evaluate(rung=>{House.warmRooms();House.adapt(rung,{pin:true,force:true});House.hush();StoryGuide.setting('off');HousePause.close();},rung);
  console.log('WARM',mode,new Date().toISOString());
  await f.until(()=>Object.values(House.ROOMS).every(r=>!r.lightBake||r.lightBake.stats.ready));
  console.log('BAKED',mode,new Date().toISOString());
  if(mode==='full'){
   const sheet=await p.evaluate(()=>HouseKit.TEX['hs.family.prints']?.image.toDataURL());
   if(sheet)await writeFile(dir+'personal-print-atlas.png',Buffer.from(sheet.split(',')[1],'base64'));
  }
  const all=[
   ['mantel-front',[-105,210,500],[-236,230,500],'G'],
   ['mantel-side',[-170,210,540],[-260,270,415],'G'],
   ['pictures-close',[-183,218,475],[-236,229,475],'G'],
   ['certificate-close',[-196,224,530],[-236,230,530],'G'],
   ['hall-family',[309,205,250],[309,199,60],'G'],
   ['landing-family',[330,-72,245],[330,-75,130],'U'],
   ['kitchen-left',[40,210,70],[-80,285,-145],'G'],
   ['kitchen-right',[-150,210,-20],[20,285,-145],'G'],
   ['kitchen-border',[160,210,40],[90,230,-175],'G'],
   ['street-noon',[200,210,1350],[1300,120,1600],'G'],
   ['street-crowns',[500,210,1450],[1420,-10,320],'G'],
   ['street-dusk',[200,210,1350],[1300,120,1600],'G',19],
   ['street-trees-green',[1500,150,1900],[2230,-120,560],'G'],
   ['street-trees-close',[1850,150,1250],[2230,-160,560],'G'],
   ['street-trees-dusk',[1500,150,1900],[2230,-120,560],'G',16],
  ];
  const budgets=[['budget-bedroom',[-90,-70,175],[50,-20,-40],'U'],['budget-landing',[300,-70,200],[380,-25,480],'U'],['budget-hall',[265,210,640],[335,255,310],'G'],['budget-cupboard',[370,210,340],[370,320,535],'G'],['budget-lounge',[100,210,520],[-210,260,500],'G'],['budget-kitchen',[100,210,240],[-100,265,-145],'G'],['budget-garden',[120,210,-260],[-40,280,-1000],'G'],['budget-front',[180,210,1300],[150,120,700],'G'],['budget-street',[200,210,1350],[1300,200,1600],'G']];
  const views=budgetOnly?[...budgets,...all.filter(v=>['kitchen-left','kitchen-right'].includes(v[0]))]:touch?all.filter(v=>['mantel-front','kitchen-right','street-trees-green','street-trees-dusk'].includes(v[0])):all;
  for(const [name,eye,target,level,hour=12]of views){
   if(selected&&!selected.includes(name))continue;
   await p.evaluate(hour=>{window.auditHour=hour;dispatchEvent(new Event('ownerclock'));House.relight();},hour);
   await f.view(eye,target,{level});await p.waitForTimeout(800);
   const metrics=await p.evaluate(()=>{
    const H=House,r=H.ren,gl=r.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),seen=new Set();let bytes=0;
    H.scene.traverse(o=>{for(const m of [].concat(o.material||[]))for(const k of ['map','emissiveMap','alphaMap','lightMap','aoMap','normalMap','specularMap','bumpMap','envMap']){const t=m[k],im=t?.image;if(!im||seen.has(t.uuid))continue;seen.add(t.uuid);for(const i of [].concat(im))bytes+=(i.width||0)*(i.height||0)*4*(t.generateMipmaps?4/3:1)}});
    return {calls:r.info.render.calls,triangles:r.info.render.triangles,geometries:r.info.memory.geometries,textures:r.info.memory.textures,textureBytes:Math.round(bytes),raster:[r.domElement.width,r.domElement.height],adapt:H.Q.adapt,antialias:gl.getContextAttributes().antialias,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),lighting:H.graphicsGet().lighting||'pixel',pose:{...H.P}};
   });
   assert.deepEqual(metrics.raster,[width,height]);assert.equal(metrics.adapt,rung);
   if(!name.startsWith('budget-'))await p.screenshot({path:dir+mode+'-'+name+'.png',timeout:90000});
   report.views=report.views.filter(v=>v.mode!==mode||v.name!==name);report.views.push({mode,name,...metrics});console.log('SHOT',mode,name,metrics.calls,metrics.triangles,metrics.textureBytes);
  }
  if(tag==='after'&&mode==='full'){
   await f.view([-105,210,500],[-236,230,500],{level:'G'});
   await p.evaluate(()=>{window.auditHour=12;window.auditMinute=5;House.dirty()});
   await f.until(()=>House.ROOMS.lounge.mantelClockMinute===725);
   report.clock={minuteUpdates:true,displayOffsetMinutes:10};
   await p.evaluate(()=>{window.auditMinute=0;House.dirty()});
  }
  report.errors.push(...f.errors);await f.browser.close();f=null;
 }
 assert.deepEqual(report.errors,[]);assert(!/mod failed to load/.test(log));
}finally{
 if(f)await f.browser.close().catch(()=>{});
 if(server?.exitCode===null){const done=once(server,'exit');server.kill('SIGTERM');await done}
 await writeFile(dir+'metrics.json',JSON.stringify(report,null,2));await writeFile(dir+'server.log',log);
 if(data)await rm(data,{recursive:true,force:true});
}
