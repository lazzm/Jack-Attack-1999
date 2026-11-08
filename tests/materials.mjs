// Matched native material views. Run against disposable localhost data only.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {stillCapture} from './still-capture.mjs';
import {drawAudit} from './light-draw-audit.mjs';
import {devices} from 'playwright';
const base=process.argv[2],tag=process.argv[3]||'before',dir=new URL('./shots/'+(process.env.MAT_DIR||'mat')+'/',import.meta.url).pathname;
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));await mkdir(dir+tag,{recursive:true});
const surfaces=process.argv.includes('--surfaces'),budget=process.argv.includes('--budget'),mobile=process.argv.includes('--mobile'),profile=mobile?devices['Pixel 7']:{};
const password='Throwaway-1999',name='Mat'+Date.now().toString(36);
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass:password})})).ok);
const f=await roomFixture(base,{touch:mobile,contextOptions:profile,width:mobile?390:1366,height:mobile?844:860,onPage:async page=>{if(mobile)await page.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));await stillCapture(page);if(tag.startsWith('before'))for(const file of ['hs-kit.js','hs-art.js','hs-house.js','hs-world.js','rm-room.js','ch-kitchen.js','ch-lounge.js'])await page.route('**/js/'+file+'*',route=>route.fulfill({body:execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8'}),contentType:'application/javascript'}))},hour:12,seed:1999,account:name,password,signup:false,opening:true,resume:true,storageState:await bonfireLogin(base,password,name,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0})});
const views=[
 ['bedroom-desk','U',[60,-2,-15],[0,-.65,1]],
 ['bedroom-duvet','U',[190,30,82],[-.8,-.6,.3]],
 ['bedroom-hardware','U',[15,-22,-8],[1,-.4,.5]],
 ['handheld','U',[-56,-3,5],[-.2,-.8,1]],
 ['consoles','U',[-195,47,-16.4],[.3,-.6,1]],
 ['landing','U',[250,-24,500],[.2,-.05,-1]],
 ['hall','G',[210,290,400],[.3,-.35,1]],
 ['lounge','G',[-110,295,608],[0,-.3,-1]],
 ['kitchen','G',[-80,260,-146],[.2,-.3,1]],
 ['kitchen-kettle','G',[-200,245,-156],[.15,-.25,1]],
 ['kitchen-dishes','G',[-24,250,-134],[.5,-.35,1]],
 ['paper','G',[-22,277,129],[1,-.8,.4]],
 ['glass','G',[-180,290,336],[.3,-.2,1]],
 ['raw-wood','G',[-337,260,-680],[1,-.15,.2]],
 ['garden','G',[341,285,-280],[-1,-.2,-.3]],
 ['vacuum','G',[345,330,450],[.25,-.3,-1]],
 ['vacuum-upright','G',[224,281,452],[.2,-.15,1]],
];
const surfaceViews=[
 ['surface-hoover','G',[224,281,452],[.15,-.1,1]],
 ['surface-bin','G',[341,285,-280],[-1,-.2,-.3]],
 ['surface-worktop','G',[-90,258,-140],[.15,-.5,1]],
 ['surface-carpet','U',[287,72,470],[.1,-1,.7]],
 ['surface-woodwork','U',[250,-24,500],[.2,-.05,-1]],
 ['surface-wallpaper','G',[-280,220,340],[1,-.05,.2]],
 ['surface-pc','U',[15,-22,-8],[1,-.4,.5]],
 ['surface-console','U',[-195,47,-16.4],[.3,-.6,1]],
 ['surface-fabric','G',[-110,295,608],[0,-.3,-1]],
 ['surface-metal','G',[-80,248,-164],[.3,-.3,1]],
 ['surface-ceramic','U',[46,-4,-8],[0,-.65,1]],
 ['surface-curtain','G',[76,245,690],[0,-.1,-1]],
 ['surface-pan','G',[-24,253,-134],[.4,-.5,1]],
 ['surface-shed','G',[-210,260,-1267],[.2,-.15,1]],
 ['surface-hoover-foot','G',[228,348,452],[.2,-.6,1]],
 ['surface-timber','G',[-337,260,-680],[1,-.15,.2]],
];
const metrics=[];const prior=process.env.MAT_ONLY?JSON.parse(await readFile(dir+tag+'.json','utf8').catch(()=>'[]')):[];
try{
 await f.until(()=>Object.values(House.ROOMS).filter(r=>r.lightBake).every(r=>r.lightBake.stats.ready));
 await f.page.evaluate(()=>{House.hush();HousePause.close();if(window.HouseFamily){HouseFamily.debug.clock({md:1108,dow:1,t:12});HouseFamily.debug.hide(true)}House.Q.pinned=true;House.adapt(0);House.anims.delete('np');House.setDoor('cupboard',true);for(const r of Object.values(House.ROOMS)){HouseStatic.verify(r.group);HouseStatic.merge(r.group)}});
 // The cold budget snapshot waits for the quality-switch bake and normal
 // dynamic/static invalidations, rather than counting an in-flight merge.
 if(budget){await f.page.waitForTimeout(3500);await f.until(()=>Object.values(House.ROOMS).filter(r=>r.lightBake).every(r=>r.lightBake.stats.ready));await f.page.evaluate(()=>{for(const r of Object.values(House.ROOMS)){HouseStatic.verify(r.group);HouseStatic.merge(r.group)}})}
 for(const [width,height]of mobile?[[390,844],[844,390],[768,1024],[1024,768]]:[[1366,860]]){
 await f.page.setViewportSize({width,height});if(mobile)await f.page.touchscreen.tap(width-2,4);
 for(const hour of budget||mobile?[12]:[12,22]){
  await f.page.evaluate(hour=>{window.auditHour=hour;dispatchEvent(new Event('ownerclock'));window.HouseFamily?.debug.hide(true);for(const r of Object.values(House.ROOMS))r.lightBake?.update();House.relight();House.dirty()},hour);
  await f.page.waitForTimeout(1200);
  for(const [id,level,target,dirn]of (surfaces?surfaceViews:views).filter(v=>surfaces?(!process.env.MAT_ONLY||process.env.MAT_ONLY.split(',').includes(v[0])):budget?v[0]==='landing':mobile?['bedroom-hardware','kitchen'].includes(v[0]):!process.env.MAT_ONLY||process.env.MAT_ONLY.split(',').includes(v[0])))for(const cm of surfaces||mobile||budget||['handheld','consoles'].includes(id)?[60]:[60,200]){
   const length=Math.hypot(...dirn),eye=target.map((v,i)=>v+dirn[i]*cm/length);
   await f.view(eye,target,{level});await f.page.evaluate(()=>{HousePause.close();House.dirty()});await f.page.waitForTimeout(180);
   const path=`${tag}/${mobile?width+'x'+height+'-':''}${id}-${hour}-${cm}.png`;await f.page.screenshot({path:dir+path,timeout:60000,...(mobile?{scale:'device'}:{})});
   const m=await f.page.evaluate(()=>{const H=House,ts=new Map(),ms=new Set();H.scene.traverse(o=>{for(const m of [].concat(o.material||[])){ms.add(m.uuid);for(const k of ['map','emissiveMap','alphaMap','lightMap','aoMap','normalMap','specularMap','bumpMap','envMap'])if(m[k]?.image){const t=m[k],i=t.image,w=(Array.isArray(i)?i[0]?.width:i.width)||0,h=(Array.isArray(i)?i[0]?.height:i.height)||0,channels=t.format===H.T.RedFormat||t.format===H.T.LuminanceFormat?1:4;ts.set(t.uuid,{w,h,bytes:w*h*channels*(Array.isArray(i)?i.length:1)*(t.generateMipmaps?4/3:1)})}}});const roomSubmissions={},roomTriangles={};for(const r of Object.values(H.ROOMS)){let calls=0,triangles=0;const seen=new Set();const count=o=>{if(!o.visible||seen.has(o))return;seen.add(o);if(o.isMesh&&(o.layers.mask&H.camera.layers.mask)&&o.geometry.drawRange.count!==0){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(Array.isArray(o.material)){for(const gr of o.geometry.groups)if(gr.count&&o.material[gr.materialIndex]?.visible!==false)calls++;}else if(o.material?.visible!==false)calls++;}for(const child of o.children)count(child)};for(const child of r.group.children)count(child);for(const t of Object.values(H.THINGS||{}))if((t.at?.room||t.home?.room||t.room)===r.id&&t.obj)count(t.obj);roomSubmissions[r.id]=calls;roomTriangles[r.id]=triangles;}return{roomSubmissions,roomTriangles,roomBudgetBasis:'Room groups plus resident House.THINGS, deduplicated; ignoring room-level culling',touch:!!window.GameInput?.touch,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,buffer:[H.ren.domElement.width,H.ren.domElement.height]},static:Object.fromEntries(Object.values(H.ROOMS).map(r=>[r.id,HouseStatic.stats(r.group)])),phase:[...document.getElementById('bootPower').classList].filter(c=>/^rm-(?:day|night|dawn|dusk)$/.test(c)),perf:H.perf(),memory:H.ren.info.memory,textures:ts.size,textureBytes:[...ts.values()].reduce((n,t)=>n+t.bytes,0),materials:ms.size,pose:{...H.P},room:H.here,drawn:Object.values(H.ROOMS).filter(r=>r._renderDrawn).map(r=>r.id)}});
   if(id==='landing'&&cm===60&&hour===12)await writeFile(dir+tag+'-draws.json',JSON.stringify(await drawAudit(f.page),null,2));
   assert(m.phase.includes(hour===12?'rm-day':'rm-night'),'Capture clock phase '+m.phase);metrics.push({path,id,hour,cm,eye,target,...m});await writeFile(dir+tag+'.json',JSON.stringify([...prior.filter(q=>!metrics.some(m=>m.path===q.path)),...metrics],null,2));console.log(path,JSON.stringify({calls:m.perf.calls,textures:m.textures,bytes:m.textureBytes}));
  }
 }
 }
 assert.deepEqual(f.errors,[]);const previous=process.env.MAT_ONLY?JSON.parse(await readFile(dir+tag+'.json','utf8').catch(()=>'[]')):[];await writeFile(dir+tag+'.json',JSON.stringify([...previous.filter(q=>!metrics.some(m=>m.path===q.path)),...metrics],null,2));
}finally{await f.browser.close()}
