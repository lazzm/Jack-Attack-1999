// Native-raster, repeatable indoor lighting art and cost review. Disposable data only.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {roomFixture} from './room-fixture.mjs';
const tag=process.argv[2]||'before',dir=new URL(`./shots/light/${tag}/`,import.meta.url).pathname;
await mkdir(dir,{recursive:true});
const views=[
 ['bedroom',[-90,-85,175],[50,-20,-40],'U'],
 ['bedroom-reverse',[80,-85,140],[-170,-10,190],'U'],
 ['landing',[300,-85,200],[380,-25,480],'U'],
 ['landing-reverse',[300,-85,640],[285,-20,200],'U'],
 ['hall',[265,195,640],[335,255,310],'G'],
 ['hall-reverse',[270,195,240],[310,245,680],'G'],
 ['stairs',[370,195,640],[370,120,420],'G'],
 ['cupboard',[370,210,340],[370,320,535],'G'],
 ['cupboard-reverse',[370,266,420],[370,280,280],'G'],
 ['lounge',[100,195,520],[-210,260,500],'G'],
 ['lounge-window',[-100,195,400],[-55,245,700],'G'],
 ['lounge-lamp',[-160,195,520],[150,220,330],'G'],
 ['kitchen',[100,195,240],[-100,265,-145],'G'],
 ['kitchen-reverse',[-130,195,20],[130,260,240],'G'],
 ['front',[180,195,1280],[150,100,700],'G'],
 ['rear',[20,195,-680],[40,50,-176],'G']
];
await withTestServer(async base=>{
 const account='Light'+Date.now().toString(36),password='Throwaway-1999';
 await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});
 const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,storageState:await bonfireLogin(base,password,account,{x:-90,y:-85,z:175,rx:0,ry:0,lvl:'U',seat:0}),hour:8,seed:1999,timeoutScale:2,debug:true,onPage:async p=>{const cpu=Number(process.argv.find(a=>a.startsWith('--cpu='))?.slice(6));if(cpu){const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu})}const ref=process.argv.find(a=>a.startsWith('--base='))?.slice(7);if(ref)for(const file of ['hs-kit.js','hs-world.js','hs-house.js','rm-room.js','hs-static.js'])await p.route('**/js/'+file+'*',r=>r.fulfill({body:execFileSync('git',['show',ref+':app/public/js/'+file],{encoding:'utf8'}),contentType:'application/javascript'}));await p.addInitScript(()=>{let paused=false,serial=0;const frames=new Map(),request=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),schedule=f=>f.real=request(t=>{if(!frames.has(f.id))return;frames.delete(f.id);f.cb(t)});window.requestAnimationFrame=cb=>{const f={id:++serial,cb,real:0};frames.set(f.id,f);if(!paused)schedule(f);return f.id};window.cancelAnimationFrame=id=>{const f=frames.get(id);if(f){if(f.real)cancel(f.real);frames.delete(id)}};window.lightPhotoFreeze=()=>{paused=true;for(const f of frames.values()){if(f.real)cancel(f.real);f.real=0}};window.lightPhotoResume=()=>{paused=false;for(const f of frames.values())if(!f.real)schedule(f)};window.lightBakeCosts=[];let kit;Object.defineProperty(window,'HouseKit',{configurable:true,get:()=>kit,set:k=>{kit=k;const bake=k.bakeInterior;k.bakeInterior=r=>{const t=performance.now();bake(r);if(r.lightBake)lightBakeCosts.push({room:r.id,ms:performance.now()-t,stats:r.lightBake.stats})}}})})}});const {page:p}=f,rows=process.argv.includes('--resume')?JSON.parse(await readFile(dir+'metrics.json','utf8').catch(()=>'{"rows":[]}')).rows:[];
 const programSnapshots=[];
 const capture=process.argv.includes('--cdp')?await p.context().newCDPSession(p):null;
 try{
 await p.evaluate(()=>{House.adapt(0,{pin:true,force:true});HouseFamily.debug.hide(true);House.hush();for(const r of Object.values(House.ROOMS))House.buildRoom(r);for(const id of ['bedroom','lounge','kitchen','cupboard'])House.setDoor(id,true,true);StoryGuide.setting('off');window.lightReviewAmbient=[...House.ambient];House.ambient.clear();House.anims.clear();HouseFamily.debug.speech.q.length=0;HouseFamily.debug.speech.cur=null;document.querySelector('.np-speech')?.remove()});
 const sunset=await p.evaluate(()=>Season.sun().set);
 const timeline=[['morning',8],['midday',12],['dusk',sunset],['night',22]],order=process.argv.find(a=>a.startsWith('--phase-order='))?.slice(14).split(',');if(order)timeline.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
 for(const [phase,hour]of timeline){
 const phases=process.argv.find(a=>a.startsWith('--phases='))?.slice(9).split(',');if(phases&&!phases.includes(phase))continue;
 const clock=await p.evaluate(async hour=>{const t=performance.now(),version=()=>Object.values(House.ROOMS).reduce((a,r)=>a+(r.lightBake?.light.version||0)+(r.lightBake?.ao.version||0),0),before=version();window.auditHour=Math.floor(hour);window.auditMinute=Math.round((hour%1)*60);dispatchEvent(new Event('ownerclock'));for(const fn of lightReviewAmbient)fn(performance.now()+100000);House.ambient.clear();House.anims.clear();House.relight();House.dirty();await Promise.resolve();return{cpuMs:performance.now()-t,atlasVersionDelta:version()-before}},hour);await p.waitForTimeout(1500);
 for(const [name,eye,target,level]of views.filter(v=>process.argv.some(a=>a.startsWith('--views='))||(!v[0].includes('reverse')&&v[0]!=='lounge-window'&&v[0]!=='lounge-lamp'&&v[0]!=='stairs'))){
 const only=process.argv.find(a=>a.startsWith('--views='))?.slice(8).split(','),pairs=process.argv.find(a=>a.startsWith('--pairs='))?.slice(8).split(',');if(only&&!only.includes(name)||pairs&&!pairs.includes(phase+':'+name))continue;
 if(rows.some(r=>r.phase===phase&&r.name===name))continue;
 console.log('START VIEW',new Date().toISOString(),phase,name);
 await f.view(eye,target,{level});console.log('POSITIONED',new Date().toISOString(),name);await p.waitForTimeout(300);
 if(process.argv.includes('--steady'))await p.evaluate(()=>{House._.renderForBenchmark();for(const r of Object.values(House.ROOMS)){HouseStatic.verify(r.group);HouseStatic.merge(r.group)}House._.renderForBenchmark()});
 const row=await p.evaluate(async()=>{House._.renderForBenchmark();const r=House.ren,gl=r.getContext();gl.finish();const calls=r.info.render.calls,triangles=r.info.render.triangles,ms=[],versionsBefore=Object.values(House.ROOMS).reduce((a,r)=>a+(r.lightBake?.light?.version||0)+(r.lightBake?.ao?.version||0),0),bakesBefore=Object.values(House.ROOMS).reduce((a,r)=>a+(r.lightBake?.stats?.updates||0),0);for(let i=0;i<7;i++){const t=performance.now();House._.renderForBenchmark();gl.finish();ms.push(performance.now()-t)}ms.sort((a,b)=>a-b);const bakeUpdatesDuringRender=Object.values(House.ROOMS).reduce((a,r)=>a+(r.lightBake?.stats?.updates||0),0)-bakesBefore;const atlasVersionDelta=Object.values(House.ROOMS).reduce((a,r)=>a+(r.lightBake?.light?.version||0)+(r.lightBake?.ao?.version||0),0)-versionsBefore;return{atlasVersionDelta,bakeUpdatesDuringRender,static:HouseStatic.stats(House.ROOMS[House.here].group),programs:r.info.programs.length,textures:r.info.memory.textures,calls,triangles,frameMs:ms[3],p95Ms:ms[6],raster:[r.domElement.width,r.domElement.height],ratio:r.getPixelRatio(),room:House.here,bake:House.ROOMS[House.here]?.lightBake?{charts:House.ROOMS[House.here].lightBake.charts,w:House.ROOMS[House.here].lightBake.width,h:House.ROOMS[House.here].lightBake.height}:null,renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)}});
 assert.equal(row.bakeUpdatesDuringRender,0);assert.equal(row.atlasVersionDelta,0);assert.equal(row.ratio,1);assert.deepEqual(row.raster,[1366,860]);
 const shotPairs=process.argv.find(a=>a.startsWith('--shots='))?.slice(8).split(','),metricsOnly=process.argv.includes('--metrics-only')||!!(shotPairs&&!shotPairs.includes(phase+':'+name));console.log('MEASURED',new Date().toISOString(),name);if(!metricsOnly){await p.evaluate(()=>window.lightPhotoFreeze());try{const path=dir+phase+'-'+name+'.jpg';if(capture){const shot=await capture.send('Page.captureScreenshot',{format:'jpeg',quality:100,fromSurface:true,captureBeyondViewport:false,optimizeForSpeed:true});await writeFile(path,Buffer.from(shot.data,'base64'))}else await p.screenshot({path,type:'jpeg',quality:100,timeout:90000})}finally{await p.evaluate(()=>window.lightPhotoResume())}};if(process.argv.includes('--programs'))programSnapshots.push({phase,name,keys:await p.evaluate(()=>House.ren.info.programs.map(p=>p.cacheKey))});delete row.p95Ms;row.capture=metricsOnly?'metrics only, explicitly settled static batches':'native full-page JPEG quality 100';rows.push({phase,hour,name,eye,target,level,clock,...row});await writeFile(dir+'metrics.json',JSON.stringify({rows,errors:f.errors,programSnapshots,programKeys:process.argv.includes('--programs')?await p.evaluate(()=>House.ren.info.programs.map(p=>p.cacheKey)):undefined,bakeCosts:await p.evaluate(()=>window.lightBakeCosts),bakeStats:await p.evaluate(()=>Object.fromEntries(Object.values(House.ROOMS).filter(r=>r.lightBake).map(r=>[r.id,r.lightBake.stats||null])))},null,2));console.log('LIGHT',tag,phase,name,JSON.stringify(row));
 }
 }
 assert.deepEqual(f.errors,[]);
 }finally{await f.browser.close()}
});
