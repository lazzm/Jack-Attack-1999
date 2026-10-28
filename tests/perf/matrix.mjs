// Reproducible house graphics diagnostics. No production URL/data, no new dependencies.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
import os from 'node:os';
import {roomFixture} from '../room-fixture.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const opt=Object.fromEntries(process.argv.slice(2).map(a=>{const [k,...v]=a.replace(/^--/,'').split('=');return[k,v.join('=')||true]}));
const tag=String(opt.tag||'after'),backend=String(opt.backend||'swiftshader');
assert(/^[\w-]+$/.test(tag));if(opt.app)assert(String(opt.app).startsWith('/tmp/'),'Alternate app must be a disposable /tmp snapshot');assert(['swiftshader','llvmpipe'].includes(backend));
// One look (docs/GRAPHICS.md): 'best' is adaptation rung 0 (what every capable device draws), 'floor' the last rung.
const RUNGS={best:0,floor:5},tiers=String(opt.tiers||'best').split(',');
const cpuFrames=+(opt.frames||300),fillFrames=+(opt['fill-frames']||30),walkFrames=+(opt['walk-frames']||600);
const rates=String(opt['cpu-rates']||'1').split(',').map(Number);
assert([cpuFrames,fillFrames,walkFrames,...rates].every(n=>Number.isFinite(n)&&n>0));
const shots=root+'tests/shots/perf/'+tag+'/',out=root+String(opt.out||`docs/perf-stage0-${tag}-${backend}.json`);
await mkdir(shots,{recursive:true});
const canonical=[
 ['bedroom-door',[205,-55,220],[0,-15,10],'U'],
 ['desk-pc',[65,-55,140],[-15,-24,0],'U'],
 ['tv-consoles',[-120,-55,160],[-216,-5,-16],'U'],
 ['landing-stairs',[300,-85,175],[370,220,520],'U'],
 ['kitchen',[120,205,260],[-60,287,170],'G'],
 ['front-garden',[80,95,1950],[60,25,700],'G',[220,195,1040]]
];
// A deterministic camera rail, not a collision test. All doors open for the rail.
// Includes a cupboard detour, both stair levels, garden return and street view.
const path=[
 [40,-85,155,'U'],[205,-85,175,'U'],[300,-85,175,'U'],[370,-85,250,'U'],
 [370,55,425,'U'],[370,195,600,'G'],[300,195,640,'G'],[100,195,640,'G'],
 [100,195,420,'G'],[280,195,400,'G'],[362,241,400,'G'],[280,195,400,'G'],
 [270,195,280,'G'],[100,195,260,'G'],[-40,195,90,'G'],[-40,195,-120,'G'],
 [40,195,-360,'G'],[-40,195,-120,'G'],[-40,195,120,'G'],[100,195,260,'G'],
 [280,195,280,'G'],[300,195,640,'G'],[300,195,800,'G'],[220,195,1050,'G'],[220,195,1100,'G']
];
let server,fixture,data,log='';let results={schema:1,tag,backend,recordedAt:new Date().toISOString(),host:{cpus:os.cpus().length,load:os.loadavg()},config:{cpuFrames,fillFrames,walkFrames,rates,seed:1999,viewport:[1366,860],walkViewport:[854,536],hour:14,probeDOM:'hidden',walkDOM:'normal'},rows:[],rooms:[],walk:[],failures:[]};
if(opt.resume){const saved=JSON.parse(await readFile(out,'utf8'));assert.deepEqual(saved.config,results.config,'Resume configuration changed');results=saved;delete results.error;}
let cleaned=false;
async function cleanup(){if(cleaned)return;cleaned=true;await fixture?.browser.close().catch(()=>{});if(server?.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>{const t=setTimeout(()=>{server.kill('SIGKILL');resolve()},2000);server.once('exit',()=>{clearTimeout(t);resolve()})})}if(data)await rm(data,{recursive:true,force:true})}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await writeFile(out,JSON.stringify(results,null,2));await cleanup();process.exit(1)});
const args=['--headless=new','--use-gl=angle','--ignore-gpu-blocklist','--enable-precise-memory-info',backend==='swiftshader'?'--use-angle=swiftshader':'--use-angle='+String(opt['mesa-angle']||'gl-egl'),...(backend==='swiftshader'?['--enable-unsafe-swiftshader']:[])];
let budgets;try{budgets=JSON.parse(await readFile(root+'tests/perf/budgets.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
function gate(row,key){if(opt['no-gates'])return;assert(budgets,'Missing tests/perf/budgets.json');const b=budgets.tiers[row.tier]?.[key];if(!b){results.failures.push('Missing budget: '+row.tier+'/'+key);return}for(const metric of ['calls','triangles','textures','geometries','programs','textureMB'])if(row[metric]>(opt.reuse?Math.max(...Object.values(budgets.tiers).map(t=>t[key]?.[metric]||0)):b[metric])*(1+(budgets.tolerance??.1)))results.failures.push(`${row.tier}/${key}: ${metric} ${row[metric]} > ${b[metric]} +10%`)}
async function save(){await writeFile(out,JSON.stringify(results,null,2)+'\n')}
try{
 let port;for(let p=18080;p<=18099;p++){const free=await new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)))});if(free){port=p;break}}assert(port,'No free throwaway port');
 data=await mkdtemp('/tmp/jhp-perf-');server=spawn(process.execPath,['server.js'],{cwd:opt.app?String(opt.app):root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',s=>{log+=s});server.stderr.on('data',s=>{log+=s});
 const base='http://localhost:'+port;
 for(let i=0;i<200;i++){try{if((await fetch(base+'/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));assert(i<199,'Server start failed')}
 console.log(`Stage 0 ${tag} / ${backend}; ${cpuFrames} CPU, ${fillFrames} fill, ${walkFrames} walk frames; CPU rates ${rates}`);
 console.log('tier    view             CPU p50/p95   fill 1x/.5x p50   draws   tris  texMB');
 for(const tier of tiers){
  assert(tier in RUNGS,'Tiers are best/floor (graphics options were removed)');
  if(opt.resume&&canonical.every(([name])=>results.rows.some(r=>r.tier===tier&&r.view===name&&r.cpu?.[0]?.samples===cpuFrames&&r.fill?.[0]?.samples===fillFrames))&&results.walk.some(w=>w.tier===tier&&w.samples===walkFrames)){console.log(tier+' complete checkpoint retained');continue}
  if(!fixture){
  const account='P0'+tier[0]+Date.now().toString(36),password='Throwaway-1999';
  const reg=await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})});assert(reg.ok);
  fixture=await roomFixture(base,{account,password,signup:false,tier,width:opt['counts-only']?640:1366,height:opt['counts-only']?480:860,storage:opt['no-msaa']?{}:{jhp_hs_msaa:true},debug:!!opt.debug,timeoutScale:4,seed:1999,launchOptions:{args,env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',LP_NUM_THREADS:String(opt['mesa-threads']||2)}}});
  }
  await fixture.page.evaluate(level=>House.adapt(level,{pin:true,force:true}),RUNGS[tier]);
  const {page:p,view,errors}=fixture;p.setDefaultTimeout(120000);if(opt['counts-only'])await p.setViewportSize({width:1366,height:860});const cdp=await p.context().newCDPSession(p);
  await p.evaluate(tier=>{{const a=Math.min(8,House.ren.capabilities.getMaxAnisotropy());const set=t=>{if(!t?.isTexture||t.userData?.jackLive)return;const n=t.magFilter===THREE.NearestFilter?1:a;if(t.anisotropy!==n){t.anisotropy=n;t.needsUpdate=true}};for(const k in House.K.TEX)set(House.K.TEX[k]);House.scene.traverse(o=>{const ms=Array.isArray(o.material)?o.material:o.material?[o.material]:[];for(const m of ms){set(m.map);set(m.emissiveMap)}})}House.ambient.clear();House.hush();for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)},tier);
  const gpu=await p.evaluate(()=>{const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
  results.renderer=gpu;assert(new RegExp(backend==='swiftshader'?'SwiftShader':'llvmpipe','i').test(gpu),`Requested ${backend}, actually ${gpu}. Backend unavailable; do not compare it.`);
  // Install instrumentation outside the app. The wrapper measures all room passes
  // in a house frame. Sampling readback is ONLY at validation frames, never in play.
  await p.evaluate(()=>{
   const r=House.ren,old=r.__perfOriginal||r.render;r.__perfOriginal=old;window.perfState={serial:0,cost:0,pending:false,lum:255,check:false};
   const samples=new Uint8Array(4),uv=[[.15,.15],[.5,.15],[.85,.15],[.15,.5],[.5,.5],[.85,.5],[.15,.85],[.5,.85],[.85,.85]];
   r.render=function(scene,camera){const s=perfState,t=performance.now(),out=old.call(this,scene,camera);s.cost+=performance.now()-t;if(!s.pending){s.pending=true;queueMicrotask(()=>{s.serial++;s.pending=false;if(s.check){let lum=0;const gl=r.getContext();for(const[x,y]of uv){gl.readPixels(Math.floor(x*gl.drawingBufferWidth),Math.floor(y*gl.drawingBufferHeight),1,1,gl.RGBA,gl.UNSIGNED_BYTE,samples);lum+=.2126*samples[0]+.7152*samples[1]+.0722*samples[2]}s.lum=lum/uv.length;s.check=false}})}return out};
   window.perfStats=()=>{const textures=new Set();function collect(m){for(const key in m){const t=m[key];if(t?.isTexture)textures.add(t)}if(m.userData?.rmCRTUniforms?.rmHUD?.value)textures.add(m.userData.rmCRTUniforms.rmHUD.value)}House.scene.traverse(o=>{if(Array.isArray(o.material))o.material.forEach(collect);else if(o.material)collect(o.material)});if(House.scene.background?.isTexture)textures.add(House.scene.background);let bytes=0;for(const t of textures){const imgs=Array.isArray(t.image)?t.image:[t.image];for(const im of imgs)if(im)bytes+=(im.width||im.videoWidth||0)*(im.height||im.videoHeight||0)*4*(t.generateMipmaps?4/3:1)}const gl=r.getContext();return{calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,geometries:r.info.memory.geometries,programs:r.info.programs.length,textureMB:+(bytes/1048576).toFixed(2),pixels:gl.drawingBufferWidth*gl.drawingBufferHeight,luminance:perfState.lum}};
   window.perfSnapshot=()=>new Promise(resolve=>{perfState.check=true;House._.renderForBenchmark();queueMicrotask(()=>resolve(perfStats()))});
   window.perfDirect=({frames,fill=false})=>{
    const r=House.ren,gl=r.getContext(),px=new Uint8Array(4),costs=[],submit=[],gpu=[];
    for(let i=-10;i<frames;i++){
      perfState.cost=0;const t=performance.now();House._.renderForBenchmark();const submitted=performance.now()-t;
      if(fill)gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
      const elapsed=performance.now()-t;if(i>=0){costs.push(perfState.cost);submit.push(submitted);gpu.push(elapsed)}
    }
    function stats(v){v.sort((a,b)=>a-b);const q=p=>+(v[Math.min(v.length-1,Math.floor(v.length*p))]||0).toFixed(3);return{p50:q(.5),p95:q(.95),p99:q(.99)}}
    return{samples:frames,renderMs:stats(costs),submitMs:stats(submit),frameMs:stats(gpu)};
   };
   window.perfMeasure=({frames,walk,path})=>new Promise(resolve=>{let n=-10,last=0,serial=-1;const times=[],costs=[],heaps=[],black=[],rooms=new Set(),longTasks=[];const observer=new PerformanceObserver(list=>{for(const e of list.getEntries())longTasks.push({start:e.startTime,duration:e.duration})});observer.observe({type:'longtask',buffered:false});
    function frame(t){const s=perfState;if(s.serial!==serial){if(n>=0&&last){times.push(t-last);costs.push(s.cost)}s.cost=0;serial=s.serial;last=t;n++;if(n>=0&&n%30===0)heaps.push({frame:n,bytes:performance.memory?.usedJSHeapSize||0});if(s.lum<8)black.push({frame:n,luminance:s.lum,room:House.here});rooms.add(House.here)}
     if(n>=frames){observer.disconnect();function stats(v){v.sort((a,b)=>a-b);const q=p=>+(v[Math.min(v.length-1,Math.floor(v.length*p))]||0).toFixed(3);return{p50:q(.5),p95:q(.95),p99:q(.99)}}resolve({renderMs:stats(costs),frameMs:stats(times),jank33:100*times.filter(t=>t>33).length/times.length,jank50:100*times.filter(t=>t>50).length/times.length,longTasks,heaps,black,rooms:[...rooms],samples:times.length});return}
     if(walk&&n>=0){const u=n/(frames-1)*(path.length-1),i=Math.min(path.length-2,Math.floor(u)),a=path[i],b=path[i+1],k=u-i,x=a[0]+(b[0]-a[0])*k,y=a[1]+(b[1]-a[1])*k,z=a[2]+(b[2]-a[2])*k,lvl=k<.5?a[3]:b[3];House.setWalkFrom({x,y,z,lvl,seat:0});Object.assign(House.P,{x,y,z,rx:-6,ry:Math.atan2(b[0]-a[0],-(b[2]-a[2]))*180/Math.PI,lvl,seat:0});if(n%60===0)s.check=true}
     House.dirty();requestAnimationFrame(frame)}requestAnimationFrame(frame)});
  });
  for(const [name,eye,target,level,roomPoint=eye]of canonical){
   await view(eye,target,{level,roomPoint});await p.evaluate(()=>{perfState.check=true;House.dirty()});await p.waitForTimeout(100);
   if(opt.resume&&results.rows.some(r=>r.tier===tier&&r.view===name&&r.cpu?.[0]?.samples===cpuFrames&&r.fill?.[0]?.samples===fillFrames)){console.log(tier+' '+name+' checkpoint retained');continue}
   const info=await p.evaluate(()=>perfSnapshot());assert(info.calls>0&&info.luminance>8,name+': black/empty frame');gate({tier,...info},name);
   await p.screenshot({path:shots+tier+'-'+name+'.png',timeout:120000,style:'.hs-toast,.balloon {visibility:hidden!important}'});
   const row={tier,view:name,backend,gpu,...info,cpu:[],fill:[]};
   if(!opt['counts-only']){
   const probeStyle=await p.addStyleTag({content:'#monitorSurface,.hs-ui,.pc-stage{visibility:hidden!important}'});
   await p.evaluate(()=>{House.ren.setPixelRatio(1);House.ren.setSize(64,48,false);House.dirty()});
   for(const rate of rates){await cdp.send('Emulation.setCPUThrottlingRate',{rate});const m=await p.evaluate(frames=>perfDirect({frames}),cpuFrames);row.cpu.push({rate,...m})}await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
   for(const scale of [1,.5]){await p.evaluate(scale=>{House.ren.setPixelRatio(scale);House.ren.setSize(1366,860,false);House.dirty()},scale);const m=await p.evaluate(frames=>perfDirect({frames,fill:true}),fillFrames);row.fill.push({scale,...m})}
   await probeStyle.evaluate(el=>el.remove());}
   results.rows.push(row);await save();
   if(opt['counts-only'])console.log(`${tier.padEnd(7)} ${name.padEnd(16)} counts ${row.calls} draws / ${row.triangles} triangles / ${row.textureMB} MB`);else console.log(`${tier.padEnd(7)} ${name.padEnd(16)} ${row.cpu[0].renderMs.p50.toFixed(1).padStart(5)}/${row.cpu[0].renderMs.p95.toFixed(1).padEnd(5)} ${row.fill.map(m=>m.frameMs.p50.toFixed(1)).join('/').padStart(13)} ${String(row.calls).padStart(7)} ${String(row.triangles).padStart(6)} ${row.textureMB}`);
   await p.evaluate(()=>{dispatchEvent(new Event('resize'));House.dirty()});
  }
  // Room budgets are whole visible-scene budgets at each room's first station.
  for(const id of await p.evaluate(()=>Object.keys(House.ROOMS))){await p.evaluate(id=>{House.goRoom(id,0);const target=House._.glide?.to;House.cancelGlide(true);if(target){const pose=typeof target==='function'?target():target;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');perfState.check=true;House.dirty()},id);await p.waitForTimeout(180);const row={tier,room:id,...await p.evaluate(()=>perfSnapshot())};assert(row.calls>0&&row.luminance>8,id+': black/empty frame');results.rooms.push(row);gate(row,'room:'+id)}
  await save();
  if(opt['counts-only']){assert.deepEqual(errors,[],'Browser errors');if(!opt.reuse||tier===tiers[tiers.length-1]){await fixture.browser.close();fixture=null}await save();continue}
  await p.setViewportSize({width:854,height:536});
  await p.evaluate(()=>{for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true);House._.setMode('focus');dispatchEvent(new Event('resize'))});
  await cdp.send('HeapProfiler.collectGarbage');const heapBefore=await p.evaluate(()=>performance.memory?.usedJSHeapSize||0);await cdp.send('HeapProfiler.startSampling',{samplingInterval:65536});
  if(opt.debug)console.log(tier+' starting 600-frame rail');
  const walk=await p.evaluate(({frames,path})=>perfMeasure({frames,walk:true,path}),{frames:walkFrames,path});
  const {profile}=await cdp.send('HeapProfiler.stopSampling');await cdp.send('HeapProfiler.collectGarbage');const heapAfter=await p.evaluate(()=>performance.memory?.usedJSHeapSize||0);
  const allocations=[];function collect(node){if(node.selfSize)allocations.push({function:node.callFrame.functionName,url:node.callFrame.url.split('/').pop(),line:node.callFrame.lineNumber+1,bytes:node.selfSize});for(const c of node.children)collect(c)}collect(profile.head);allocations.sort((a,b)=>b.bytes-a.bytes);
  const requiredRooms=['bedroom','landing','hall','lounge','cupboard','kitchen','garden','drive'];for(const id of requiredRooms)if(!walk.rooms.includes(id))results.failures.push(tier+': rail missed '+id);
  const heapGrowthMB=(heapAfter-heapBefore)/1048576;results.walk.push({tier,...walk,heapGrowthMB,allocations:allocations.slice(0,20)});
  if(walk.black.length)results.failures.push(tier+': black walk frames '+JSON.stringify(walk.black));if(heapGrowthMB>16)results.failures.push(tier+': retained heap grew >16MB: '+heapGrowthMB.toFixed(1));
  console.log(`${tier.padEnd(7)} WALK frame p50/p95/p99 ${walk.frameMs.p50}/${walk.frameMs.p95}/${walk.frameMs.p99} ms; >33ms ${walk.jank33.toFixed(1)}%; retained ${heapGrowthMB.toFixed(2)}MB; rooms ${walk.rooms.join(',')}`);
  assert.deepEqual(errors,[],'Browser errors');await fixture.browser.close();fixture=null;await save();
 }
 assert(!/mod failed to load/i.test(log),'Server mod failed to load');results.serverLogOK=true;await save();
 assert.deepEqual(results.failures,[],'Performance gates');console.log('PASS; JSON: '+out+'; screenshots: '+shots);
}catch(e){results.error=String(e.stack||e);await save();throw e}finally{await cleanup()}
