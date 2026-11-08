// Matched-camera shader ablations and synchronized per-room/pass attribution.
// Readbacks are diagnostic only, outside the normal mobile performance gate.
import assert from 'node:assert/strict';
import {devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'before',dir=new URL('./shots/light/round9/',import.meta.url);
await mkdir(dir,{recursive:true});
const account='Cost'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const normalOnly=process.argv.includes('--normal-only');
const f=await roomFixture(base,{account,password,signup:false,width:412,height:915,touch:true,seed:1999,hour:14,contextOptions:{userAgent:devices['Pixel 7'].userAgent,deviceScaleFactor:2,isMobile:true},onPage:async p=>{
 await p.addInitScript(normalOnly=>window.__costNormalOnly=normalOnly,normalOnly);
 await p.addInitScript(zeroOnly=>window.__costZeroOnly=zeroOnly,process.argv.includes('--zero-only'));
 await p.route('**/js/hs-world.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('function wdCheck() {','function wdCheck() {if(window.__costQuiet)return;')})});
}}),p=f.page,report=[];
try{
 await p.evaluate(()=>{House.warmRooms();HouseFamily.debug.hide(true);StoryGuide.setting('off');House.hush();House.adapt(5,{pin:true,force:true})});
 await f.until(()=>Object.values(House.ROOMS).every(r=>!r.lightBake||r.lightBake.stats.ready));
 await f.view([-127.15830796844816,-70,43.99901763359356],[-225.43,-55.95,25.46]);
 await p.evaluate(()=>{window.__costQuiet=true;House.ambient.clear();House.anims.clear();for(const r of Object.values(House.ROOMS)){HouseStatic.verify(r.group);HouseStatic.merge(r.group)}});
 const cdp=await p.context().newCDPSession(p);
 for(const rate of [4,1]){
 await cdp.send('Emulation.setCPUThrottlingRate',{rate});
 const variants=await p.evaluate(()=>{
  const gl=House.ren.getContext(),pixel=new Uint8Array(4),out=[],verify=HouseStatic.verify;HouseStatic.verify=()=>false;
  const complete=()=>gl.readPixels(1,1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
  const stock=THREE.Material.prototype.onBeforeCompile;
  const names=window.__costZeroOnly?['normal','black-lamps-on','normal','black-lamps-on','normal']:window.__costNormalOnly?['normal','normal','normal']:['normal','no-window','normal','no-atlas','normal','no-shell-direct','normal','stock-props','normal','stock-shell','normal','lambert-props','normal','lambert-all','normal'];
  for(const name of names){
   const saved=[],seen=new Set();
   if(name!=='normal')House.scene.traverse(o=>{for(const m of [].concat(o.material||[])){
    if(seen.has(m)||!m.isMeshPhongMaterial||!m.customProgramCacheKey().startsWith('house-interior-'))continue;seen.add(m);
    if((name==='stock-props'||name==='lambert-props')&&m.userData.interiorShell||name==='stock-shell'&&!m.userData.interiorShell||name==='no-shell-direct'&&!m.userData.interiorShell)continue;
    saved.push([m,m.onBeforeCompile,m.customProgramCacheKey]);const fn=m.onBeforeCompile;
    m.onBeforeCompile=function(shader){fn.call(this,shader);
     if(name==='black-lamps-on')shader.vertexShader=shader.vertexShader.replace('if(any(notEqual(pointLights[ i ].color,vec3(0.0))))','if(true)');
     if(name==='no-window')shader.fragmentShader=shader.fragmentShader.replace('PI*houseWindowLight(normal,vViewPosition)','vec3(0.0)');
     if(name==='no-atlas'&&this.userData.interiorShell)shader.fragmentShader=shader.fragmentShader.replace(/vec4 lightMapTexel\s*=\s*texture2D\( lightMap, vUv2 \);/,'vec4 lightMapTexel=vec4(0.0,0.0,0.0,1.0);').replace('texture2D(aoMap,vUv2).r','0.0');
     if(name==='no-shell-direct')shader.fragmentShader=shader.fragmentShader.replaceAll('RE_Direct( directLight, geometry, material, reflectedLight );','');
     if(name.startsWith('stock-')){shader.vertexShader=THREE.ShaderLib.phong.vertexShader;shader.fragmentShader=THREE.ShaderLib.phong.fragmentShader;}
     if(name.startsWith('lambert-')){
      shader.vertexShader=THREE.ShaderLib.lambert.vertexShader;shader.fragmentShader=THREE.ShaderLib.lambert.fragmentShader;
      if(this.userData.interiorShell){
       shader.vertexShader=shader.vertexShader.replace('#include <lights_lambert_vertex>',THREE.ShaderChunk.lights_lambert_vertex.replace(/#if NUM_POINT_LIGHTS > 0[\s\S]*?(?=#if NUM_HEMI_LIGHTS > 0)/,''));
       shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 houseSky,houseMain,houseAccent,houseSpill;')
        .replace('#include <lightmap_fragment>',`#ifdef USE_LIGHTMAP
         vec4 lightMapTexel=texture2D(lightMap,vUv2);
         reflectedLight.indirectDiffuse += PI*(lightMapTexel.r*houseSky+lightMapTexel.g*houseMain+lightMapTexel.b*houseAccent+texture2D(aoMap,vUv2).r*houseSpill);
         #endif`)
        .replace('#include <aomap_fragment>',THREE.ShaderChunk.aomap_fragment.replace('texture2D( aoMap, vUv2 ).r','lightMapTexel.a'));
      }
     }
    };m.customProgramCacheKey=()=> 'cost-r9-'+name+'-'+fn.call.toString().length+(m.userData.interiorShell?'shell':'prop')+(m.userData.pendant?'pendant':'');m.needsUpdate=true;
   }});
   for(let i=0;i<3;i++){House._.renderForBenchmark();complete()}
   const samples=[];for(let i=0;i<5;i++){const start=performance.now();House._.renderForBenchmark();const submitted=performance.now();complete();samples.push({submit:submitted-start,wait:performance.now()-submitted,total:performance.now()-start})}
   out.push({name,samples,calls:House.ren.info.render.calls,triangles:House.ren.info.render.triangles});
   for(const [m,fn,key]of saved){m.onBeforeCompile=fn;m.customProgramCacheKey=key;m.needsUpdate=true}
  }
  // Serialize passes once to attribute GPU completion without overlapping work.
  const renderer=House.ren,render=renderer.render,passes=[];
  renderer.render=function(scene,camera){const rooms=Object.values(House.ROOMS).filter(r=>r.group.visible).map(r=>r.id),calls=this.info.render.calls,start=performance.now();const result=render.call(this,scene,camera),submitted=performance.now();complete();passes.push({rooms,submit:submitted-start,wait:performance.now()-submitted,calls:this.info.render.calls-calls});return result};
  try{House._.renderForBenchmark()}finally{renderer.render=render}
  HouseStatic.verify=verify;return {out,passes,perf:House.perf(),shadowMap:renderer.shadowMap.enabled,renderTarget:!!renderer.getRenderTarget(),timerQuery:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')};
 });assert.equal(variants.perf.pixels,832932,'Match the normal mobile performance framebuffer');assert.equal(new Set(variants.out.map(x=>x.calls)).size,1,'Ablations must preserve draw calls and static batches');report.push({rate,...variants});console.log('COST',tag,rate,JSON.stringify(variants));
 }
 assert.deepEqual(f.errors,[]);
}finally{await writeFile(new URL(tag+'-cost.json',dir),JSON.stringify({report,errors:f.errors},null,2));await f.browser.close()}
