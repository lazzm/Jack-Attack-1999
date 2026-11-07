// Disposable, matched-view evidence for the 2.73 release blockers.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {devices} from 'playwright';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],label=process.argv[3]||'train3';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('./shots/release-blockers/',import.meta.url);await mkdir(dir,{recursive:true});
const expected=label.startsWith('main')?'/opt/stacks/landing/app/public/js/hs-world.js':new URL('../app/public/js/hs-world.js',import.meta.url);
assert.equal(await (await fetch(base+'/js/hs-world.js')).text(),await readFile(expected,'utf8'),'Probe must reach the intended worktree before registering');
const account='Probe'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,width:412,height:915,touch:true,contextOptions:{isMobile:true,deviceScaleFactor:2,userAgent:devices['Pixel 7'].userAgent},storageState:await bonfireLogin(base,password,account,{x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));if(process.argv.includes('--no-bake'))await p.route('**/js/hs-world.js*',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:(await res.text()).replace('K.bakeInterior?.(r);','')})})}});
try{
 const p=f.page;await f.view([40,-70,155],[-90,-30,-40]);await p.evaluate(()=>{House.adapt(5,{pin:true,force:true});House._.setMode('focus');House.hush();for(const id in House.DOORS)House.setDoor(id,false,true);});await p.waitForTimeout(5000);
 const capture=()=>{
  House.ambient.clear();House.anims.clear();const records=[],restore=[];
  House.scene.traverse(o=>{if(!o.isMesh)return;const fn=o.onBeforeRender;restore.push([o,fn]);o.onBeforeRender=function(renderer,scene,camera,geometry,material,group){fn.apply(this,arguments);records.push({name:o.name,room:(()=>{for(let q=o;q;q=q.parent){const r=Object.values(House.ROOMS).find(r=>r.group===q);if(r)return r.id}return 'root'})(),batch:!!o.userData.staticBatch,type:material.type,color:material.color?.getHexString(),map:Object.entries(House.K.TEX).find(([,t])=>t===material.map)?.[0]||material.map?.name||material.map?.image?.src?.split('/').pop(),emissive:material.emissive?.getHexString(),shininess:material.shininess,light:!!material.lightMap,uv2:!!geometry.attributes.uv2,vertices:geometry.attributes.position.count,order:o.renderOrder,box:geometry.boundingBox?{min:geometry.boundingBox.min.toArray(),max:geometry.boundingBox.max.toArray()}:null,material:material.uuid})}});
  House._.renderForBenchmark();for(const [o,fn]of restore)o.onBeforeRender=fn;
  return {calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles,pose:{...House.P},stats:Object.fromEntries(Object.values(House.ROOMS).filter(r=>r.built).map(r=>[r.id,HouseStatic.stats(r.group)])),reasons:{...HouseStatic.REASONS},records};
 };
 const result=await p.evaluate(capture);
 result.device=await p.evaluate(()=>({handheld:PCOnly.handheld,mob:House.Q.mob,pixels:House.ren.domElement.width*House.ren.domElement.height,adapt:House.Q.adapt,bakes:Object.values(House.ROOMS).filter(r=>r.lightBake).length}));assert(result.device.handheld&&result.device.mob,'Genuine phone profile required');assert.equal(result.device.pixels,832932,'Match the mobile gate drawing buffer');
 const cdp=await p.context().newCDPSession(p);result.timing={};
 for(const rate of [4,1]){
  await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  await p.evaluate(()=>{window.__probeFrames=[];window.__probeActive=true;let last;function frame(t){if(!window.__probeActive)return;if(last)window.__probeFrames.push(t-last);last=t;requestAnimationFrame(frame)}requestAnimationFrame(frame);House.anims.set('release-perf',()=>true)});
  await p.waitForTimeout(8000);
  result.timing['cpu'+rate]=await p.evaluate(()=>{window.__probeActive=false;House.anims.delete('release-perf');const f=window.__probeFrames.slice(2).sort((a,b)=>a-b);return{samples:f.length,p50:f[f.length>>1],p95:f[Math.floor(f.length*.95)],calls:House.ren.info.render.calls,pixels:House.ren.domElement.width*House.ren.domElement.height}});
 }
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await p.screenshot({path:new URL(label+'.png',dir).pathname});
 await writeFile(new URL(label+'-initial.json',dir),JSON.stringify(result,null,2));
 console.log('DRAW INITIAL',JSON.stringify({label,calls:result.calls,triangles:result.triangles,timing:result.timing,stats:result.stats,reasons:result.reasons}));
 result.views=[];
 for(const [name,eye,target,level] of (process.argv.includes('--quick')?[['landing',[300,-70,225],[300,-80,440],'U']]:[
  ['tv',[170,-70,210],[100,-30,20],'U'],
  ['landing',[300,-70,225],[300,-80,440],'U'],
  ['kitchen',[-45,205,250],[-60,115,120],'G']
 ])){
  await f.view(eye,target,{level});await p.waitForTimeout(2500);
  const row=await p.evaluate(capture);row.name=name;result.views.push(row);
  await p.screenshot({path:new URL(label+'-'+name+'.png',dir).pathname});
 }
 await writeFile(new URL(label+'.json',dir),JSON.stringify(result,null,2));console.log('DRAW PROBE',JSON.stringify({label,calls:result.calls,triangles:result.triangles,stats:result.stats,timing:result.timing,reasons:result.reasons,views:result.views.map(r=>({name:r.name,calls:r.calls,triangles:r.triangles}))}));assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}
