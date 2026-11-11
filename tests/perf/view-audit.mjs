// Per-view render audit (docs/PERF-AUDIT-2026-11-11.md). Throwaway server and data only.
//   node tests/perf/view-audit.mjs [--out=FILE] [--profile] [--ab]
// For every main view at desktop 1366x860 and portrait 390x844 (touch, DPR 1, rung 0 pinned) it records
// draw calls, triangles, programs, GL texture residency (bytes, from a texImage/texStorage tracker installed
// before the app loads), which drawn calls produce no visible sample (occlusion queries against the frame's
// own final depth), and the textures each view actually samples. --profile adds a CPU split (rAF update vs
// house render) on a slowly turning walking camera at 4x CPU throttle. --ab compares the frame with the
// unseen-work savings switched off (House._.aperture(false)) against on, in the same task, pixel by pixel.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {withTestServer} from './server.mjs';
import {roomFixture} from '../room-fixture.mjs';
const opt=Object.fromEntries(process.argv.slice(2).filter(a=>a.startsWith('--')).map(a=>{const [k,v]=a.slice(2).split('=');return[k,v??true]}));
const out=opt.out||fileURLToPath(new URL('../shots/perf/view-audit.json',import.meta.url));
const shotDir=fileURLToPath(new URL('../shots/perf/view-audit/',import.meta.url));await mkdir(shotDir,{recursive:true});
const VIEWS=[['bedroom',0],['bedroom-walk',null],['landing',0],['landing',1],['hall',0],['hall',1],['cupboard',0],['lounge',0],['lounge',1],['lounge',2],['kitchen',0],['kitchen',2],['garden',0],['garden',1],['garden',2],['drive',0],['drive',1],['drive',2]];
function tracker(){
 const T=new Map(),ctxs=new Map(),bpp=(f,t)=>{const per={0x1406:4,0x140B:2,0x8D61:2}[t]||1;const ch={0x1908:4,0x1907:3,0x1909:1,0x190A:2,0x1906:1,0x1903:1,0x8058:4,0x8051:3}[f]||4;return ch*per};
 for(const P of [WebGLRenderingContext.prototype,window.WebGL2RenderingContext?.prototype].filter(Boolean)){
  const o={};for(const k of ['activeTexture','bindTexture','texImage2D','texStorage2D','texImage3D','deleteTexture','generateMipmap','compressedTexImage2D'])o[k]=P[k];
  const st=gl=>{let s=ctxs.get(gl);if(!s)ctxs.set(gl,s={unit:0,bound:new Map()});return s};
  const cur=(gl,target)=>st(gl).bound.get(st(gl).unit+':'+(target>=0x8515&&target<=0x851A?0x8513:target));
  const rec=(gl,tex)=>{let r=T.get(tex);if(!r){r={gl,levels:new Map(),mip:false};T.set(tex,r)}return r};
  P.activeTexture=function(u){st(this).unit=u;return o.activeTexture.apply(this,arguments)};
  P.bindTexture=function(t,tex){st(this).bound.set(st(this).unit+':'+t,tex);return o.bindTexture.apply(this,arguments)};
  P.texImage2D=function(target,level,ifmt){const tex=cur(this,target);if(tex){let w,h,f,ty;if(arguments.length>=9||typeof arguments[3]==='number'&&arguments.length>=8){w=arguments[3];h=arguments[4];f=arguments[6];ty=arguments[7]}else{const s=arguments[5];w=s?.videoWidth||s?.naturalWidth||s?.width||0;h=s?.videoHeight||s?.naturalHeight||s?.height||0;f=arguments[3];ty=arguments[4]}rec(this,tex).levels.set(target+':'+level,w*h*bpp(f,ty))}return o.texImage2D.apply(this,arguments)};
  if(o.texStorage2D)P.texStorage2D=function(target,levels,ifmt,w,h){const tex=cur(this,target);if(tex){const r=rec(this,tex);for(let l=0;l<levels;l++)r.levels.set(target+':'+l,Math.max(1,w>>l)*Math.max(1,h>>l)*4*(target===0x8513?6:1))}return o.texStorage2D.apply(this,arguments)};
  if(o.texImage3D)P.texImage3D=function(target,level,ifmt,w,h,d){const tex=cur(this,target);if(tex&&typeof w==='number')rec(this,tex).levels.set(target+':'+level,w*h*d*4);return o.texImage3D.apply(this,arguments)};
  P.compressedTexImage2D=function(target,level,ifmt,w,h,b,data){const tex=cur(this,target);if(tex)rec(this,tex).levels.set(target+':'+level,data?.byteLength||0);return o.compressedTexImage2D.apply(this,arguments)};
  P.generateMipmap=function(target){const tex=cur(this,target);if(tex)rec(this,tex).mip=true;return o.generateMipmap.apply(this,arguments)};
  P.deleteTexture=function(tex){T.delete(tex);return o.deleteTexture.apply(this,arguments)};
 }
 window.__glTex={T,bytes(tex){const r=T.get(tex);if(!r)return 0;let b=0;for(const v of r.levels.values())b+=v;return Math.round(b*(r.mip&&r.levels.size<=6?4/3:1))}};
 // rAF split: every callback timed; the house loop's own render() time comes from House.perf().
 const raf=window.requestAnimationFrame.bind(window);window.__rafLog=null;
 const sites=new WeakMap();window.requestAnimationFrame=function(fn){let k=sites.get(fn);if(!k){const line=(new Error().stack||'').split('\n')[2]||'';const m=/\/([\w-]+\.js)[^:]*:(\d+)/.exec(line);k=(fn.name||'anon')+'@'+(m?m[1]+':'+m[2]:'?');sites.set(fn,k)}return raf(t=>{const log=window.__rafLog;if(!log)return fn(t);const s=performance.now();try{return fn(t)}finally{const d=performance.now()-s;log.total+=d;log.by[k]=(log.by[k]||0)+d}})};
}
await withTestServer(async base=>{
 const account='Aud'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const result={recordedAt:new Date().toISOString(),load:os.loadavg(),profiles:{}};
 for(const [profile,vp] of [['desktop',{width:1366,height:860,touch:false}],['portrait',{width:390,height:844,touch:true}]]){
  if(opt.only&&!String(opt.only).split(',').includes(profile))continue;
  const f=await roomFixture(base,{account,password,signup:false,...vp,timeoutScale:4,seed:1999,onPage:p=>p.addInitScript(tracker),contextOptions:vp.touch?{isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'}:{}});
  const {page:p,errors}=f;p.setDefaultTimeout(180000);
  try{
   await p.evaluate(()=>{House.adapt(0,{pin:true,force:true});House.hush()});
   await p.waitForTimeout(1500);
   const views=[];
   for(const [room,st] of (opt['cpu-only']?[]:VIEWS)){
    const label=room+(st===null?'':'-'+st);
    if(st===null){await p.evaluate(()=>{House.goRoom('bedroom',0);House.cancelGlide(true);Object.assign(House.P,{x:40,y:-85,z:155,rx:-6,ry:20});House.setWalkFrom({x:40,y:-85,z:155,lvl:'U',seat:0});House._.setMode('focus');House.dirty()})}
    else await p.evaluate(([id,st])=>{House.goRoom(id,st);const target=House._.glide?.to;House.cancelGlide(true);if(target){const pose=typeof target==='function'?target():target;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');House.dirty()},[room,st]);
    await p.waitForTimeout(700);
    const v=await p.evaluate(async()=>{
     const ren=House.ren,gl=ren.getContext(),isGL2=ren.capabilities.isWebGL2,props=ren.properties;
     const texName=new Map(Object.entries(House.K.TEX||{}).map(([k,v])=>[v,'K.TEX.'+k]));
     const rooms=new Map(Object.values(House.ROOMS).map(r=>[r.group,r.id])),things=new Map(Object.entries(House.THINGS).map(([k,v])=>[v.obj,k]));
     const draws=[];const orig=ren.renderBufferDirect;let queries=false;
     const owner=o=>{let room=null,top=o,sub=null,thing=null;for(let q=o;q;q=q.parent){if(!thing&&things.has(q))thing=things.get(q);if(rooms.has(q)){room=rooms.get(q);break}if(q===House.root||q===House.scene)break;sub=top;top=q}const tn=top?.name||top?.type||'?';return{room,thing,top:room?tn:tn+(sub&&sub!==top?'>'+(sub.name||sub.type)+(sub===o?'':'')+(o!==sub?'>'+(o.name||o.type):''):'')}};
     const matTex=m=>{const s=[];for(const k in m){const t=m[k];if(t?.isTexture)s.push(t)}const u=m.uniforms;if(u)for(const k in u){const t=u[k]?.value;if(t?.isTexture)s.push(t)}return s};
     ren.renderBufferDirect=function(camera,scene,geometry,material,object,group){
      const tris=Math.round((group?.count??(geometry.index?geometry.index.count:geometry.attributes.position?.count||0))/3)*(object.isInstancedMesh?object.count:1);
      const d={...owner(object),name:object.name||object.type,tris,static:!!object.userData.staticBatch,mat:material.type,tex:matTex(material).map(t=>props.get(t).__webglTexture).filter(Boolean),texObj:matTex(material),q:null};
      if(queries){d.q=gl.createQuery();gl.beginQuery(gl.ANY_SAMPLES_PASSED,d.q)}
      try{return orig.apply(this,arguments)}finally{if(queries)gl.endQuery(gl.ANY_SAMPLES_PASSED);draws.push(d)}};
     let passes=0;const r0=ren.render;ren.render=function(){passes++;return r0.apply(this,arguments)};
     const t0=performance.now();
     try{House._.renderForBenchmark()}finally{ren.render=r0}
     const renderMs=performance.now()-t0,info={calls:ren.info.render.calls,triangles:ren.info.render.triangles,programs:ren.info.programs.length,geometries:ren.info.memory.geometries,textures:ren.info.memory.textures};
     const firstDraws=draws.splice(0);
     // Second identical pass against the first pass's depth: draws that pass no sample are unseen.
     if(isGL2){const clear=ren.clear,df=gl.depthFunc;ren.clear=function(){};gl.depthFunc=function(f){return df.call(this,f===gl.LESS?gl.LEQUAL:f)};queries=true;
      try{House._.renderForBenchmark()}finally{ren.clear=clear;gl.depthFunc=df;queries=false;ren.renderBufferDirect=orig;ren.state.reset()}
      for(let i=0;i<20;i++){await new Promise(r=>requestAnimationFrame(r));if(draws.every(d=>gl.getQueryParameter(d.q,gl.QUERY_RESULT_AVAILABLE)))break}
      for(const d of draws){d.seen=gl.getQueryParameter(d.q,gl.QUERY_RESULT_AVAILABLE)?!!gl.getQueryParameter(d.q,gl.QUERY_RESULT):null;gl.deleteQuery(d.q);d.q=null}}
     ren.renderBufferDirect=orig;House._.renderForBenchmark();if(!isGL2)draws.push(...firstDraws);
     const byRoom={},byTop={};for(const d of draws){const rk=d.room||'(root)';const R=byRoom[rk]||(byRoom[rk]={calls:0,tris:0,unseenCalls:0,unseenTris:0});R.calls++;R.tris+=d.tris;if(d.seen===false){R.unseenCalls++;R.unseenTris+=d.tris}
      const tk=rk+'/'+(d.thing||d.top);const G=byTop[tk]||(byTop[tk]={calls:0,tris:0,unseenCalls:0,unseenTris:0});G.calls++;G.tris+=d.tris;if(d.seen===false){G.unseenCalls++;G.unseenTris+=d.tris}}
     const used=new Set();for(const d of draws)for(const t of d.tex)used.add(t);let usedBytes=0;for(const t of used)usedBytes+=__glTex.bytes(t);
     let resident=0,residentN=0;for(const [tex,r] of __glTex.T)if(r.gl===gl){resident+=__glTex.bytes(tex);residentN++}
     window.__usedTex=window.__usedTex||new Set();for(const t of used)__usedTex.add(t);
     const vis=Object.values(House.ROOMS).filter(r=>r.group.visible).map(r=>r.id);
     return{passes,renderMs:+renderMs.toFixed(1),...info,draws:draws.length,firstPassDraws:firstDraws.length,unseenCalls:draws.filter(d=>d.seen===false).length,unseenTris:draws.filter(d=>d.seen===false).reduce((a,d)=>a+d.tris,0),visibleRooms:vis,
      byRoom,top:Object.entries(byTop).sort((a,b)=>b[1].calls-a[1].calls).slice(0,14),topTris:Object.entries(byTop).sort((a,b)=>b[1].tris-a[1].tris).slice(0,8),
      texUsedMB:+(usedBytes/1048576).toFixed(1),texUsedN:used.size,texResidentMB:+(resident/1048576).toFixed(1),texResidentN:residentN,pose:{x:+House.P.x.toFixed(0),y:+House.P.y.toFixed(0),z:+House.P.z.toFixed(0),rx:+House.P.rx.toFixed(1),ry:+House.P.ry.toFixed(1)},here:House.here};
    });
    if(opt.ab)v.ab=await p.evaluate(()=>{const ren=House.ren,gl=ren.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,a=new Uint8Array(w*h*4),b=new Uint8Array(w*h*4);
     const shot=(off,buf)=>{House._.aperture(!off);House._.renderForBenchmark();const c=ren.info.render.calls,t=ren.info.render.triangles;gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);return{calls:c,triangles:t}};
     const pn=performance.now,frozen=pn.call(performance),dn=Date.now,fd=dn();performance.now=()=>frozen;Date.now=()=>fd;let off,on;try{off=shot(true,a);on=shot(false,b)}finally{performance.now=pn;Date.now=dn;House._.aperture(true)}let diff=0,maxd=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(d){diff++;if(d>maxd)maxd=d}}
     const skipped=House._.apertureSkipped().length;let where=[];if(diff){for(let i=0;i<a.length&&where.length<5;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]){const px=(i/4)%w,py=h-1-Math.floor(i/4/w);where.push([px,py,[a[i],a[i+1],a[i+2]],[b[i],b[i+1],b[i+2]]])}
      // Which skipped meshes project onto the first differing pixel (diagnosis only).
      if(where.length){const T=THREE,v=new T.Vector3(),[px,py]=where[0];House.ren.getSize(v);const nx=px/(gl.drawingBufferWidth)*2-1,ny=1-py/(gl.drawingBufferHeight)*2;const cands=[];for(const o of House._.apertureSkipped()){const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();const bb=g.boundingBox.clone().applyMatrix4(o.matrixWorld);let x0=9,x1=-9,y0=9,y1=-9;for(let k=0;k<8;k++){v.set(k&1?bb.max.x:bb.min.x,k&2?bb.max.y:bb.min.y,k&4?bb.max.z:bb.min.z).project(House.camera);x0=Math.min(x0,v.x);x1=Math.max(x1,v.x);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y)}if(nx>=x0&&nx<=x1&&ny>=y0&&ny<=y1){let path=[];for(let q=o;q&&path.length<4;q=q.parent)path.push(q.name||q.type);cands.push(path.join('<'))}}where.push({candidates:cands.slice(0,8)})}}
     return{off,on,skipped,pixels:w*h,diffPixels:diff,maxChannelDiff:maxd,where}});
    // Street batching A/B: the shipped coarse cells against the old street-wide buckets (main), same frame and clocks.
    if(opt['batch-ab'])v.batch=await p.evaluate(()=>{const ren=House.ren,gl=ren.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,a=new Uint8Array(w*h*4),b=new Uint8Array(w*h*4),nb=House.root.children.find(o=>o.name==='neighbourhood');
     const shot=buf=>{House._.renderForBenchmark();const r={calls:ren.info.render.calls,triangles:ren.info.render.triangles,batches:HouseStatic.stats(nb).batches};gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);return r};
     const pn=performance.now,frozen=pn.call(performance),dn=Date.now,fd=dn();performance.now=()=>frozen;Date.now=()=>fd;let main,cells;
     let alt,altDiff=0;try{HouseStatic.unmerge(nb);HouseStatic.merge(nb,{bigCell:0});main=shot(a);HouseStatic.unmerge(nb);HouseStatic.merge(nb,{bigCell:2400});const c=new Uint8Array(w*h*4);alt=shot(c);for(let i=0;i<a.length;i+=4)if(a[i]!==c[i]||a[i+1]!==c[i+1]||a[i+2]!==c[i+2])altDiff++;HouseStatic.unmerge(nb);HouseStatic.merge(nb);cells=shot(b)}finally{performance.now=pn;Date.now=dn}
     let diff=0,maxd=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(d){diff++;if(d>maxd)maxd=d}}
     return{main,cells,alt2400:{...alt,diffPixels:altDiff},diffPixels:diff,maxChannelDiff:maxd}});
    if(v.batch)console.log('   street batches',label,JSON.stringify(v.batch));
    await p.screenshot({path:shotDir+profile+'-'+label+'.png'});
    views.push({label,...v});console.log(profile.padEnd(9),label.padEnd(13),`calls ${v.calls} (${v.unseenCalls} unseen) tris ${v.triangles} (${v.unseenTris} unseen) passes ${v.passes} progs ${v.programs} tex used ${v.texUsedMB}/${v.texResidentMB} MB rooms ${v.visibleRooms.join(',')}`+(v.ab?` AB calls ${v.ab.off.calls}->${v.ab.on.calls} tris ${v.ab.off.triangles}->${v.ab.on.triangles} diffPx ${v.ab.diffPixels} max ${v.ab.maxChannelDiff}`+(v.ab.diffPixels?' '+JSON.stringify(v.ab.where):''):''));
   }
   // Residency: textures uploaded to the house context that no audited view samples.
   const residency=opt['cpu-only']?{}:await p.evaluate(()=>{const ren=House.ren,gl=ren.getContext(),props=ren.properties,names=new Map();
    const note=(t,n)=>{const w=props.get(t).__webglTexture;if(w&&!names.has(w))names.set(w,{name:n,size:t.image?.width?t.image.width+'x'+t.image.height:'?'})};
    for(const [k,t] of Object.entries(House.K.TEX||{}))if(t?.isTexture)note(t,'K.TEX.'+k);
    const refs=new Set(),shownRefs=new Set(),roomGroups=new Set(Object.values(House.ROOMS).map(r=>r.group));const chainShown=o=>{for(let q=o;q&&q!==House.scene;q=q.parent)if(!q.visible&&!roomGroups.has(q))return false;return true};House.scene.traverse(o=>{for(const m of [].concat(o.material||[])){for(const k in m)if(m[k]?.isTexture){refs.add(props.get(m[k]).__webglTexture);if(chainShown(o)&&m.visible!==false)shownRefs.add(props.get(m[k]).__webglTexture)}for(const k in m)if(m[k]?.isTexture)note(m[k],(o.name||o.type)+'.'+k+(o.parent?.name?' <'+o.parent.name:''));if(m.uniforms)for(const k in m.uniforms){const t=m.uniforms[k]?.value;if(t?.isTexture)note(t,(o.name||o.type)+'.u.'+k)}}});
    let all=0,unused=0,unref=0,hiddenOnly=0;const list=[];for(const [tex,r] of __glTex.T){if(r.gl!==gl)continue;const b=__glTex.bytes(tex);all+=b;if(!__usedTex.has(tex)){unused+=b;if(!refs.has(tex))unref+=b;else if(!shownRefs.has(tex))hiddenOnly+=b;list.push({bytes:b,ref:refs.has(tex),shown:shownRefs.has(tex),...(names.get(tex)||{name:'(unnamed)'})})}}
    list.sort((a,b)=>b.bytes-a.bytes);const contexts=new Map();for(const [,r] of __glTex.T){contexts.set(r.gl,(contexts.get(r.gl)||0)+1)}
    const groups={};for(const e of list){const k=e.name.replace(/\d+/g,'#').slice(0,60);const g=groups[k]||(groups[k]={n:0,bytes:0});g.n++;g.bytes+=e.bytes}
    return{residentMB:+(all/1048576).toFixed(1),neverSampledMB:+(unused/1048576).toFixed(1),unreferencedMB:+(unref/1048576).toFixed(1),hiddenOnlyMB:+(hiddenOnly/1048576).toFixed(1),neverSampledN:list.length,top:list.slice(0,40),groups:Object.entries(groups).sort((a,b)=>b[1].bytes-a[1].bytes).slice(0,30).map(([k,g])=>[k,g.n,+(g.bytes/1048576).toFixed(2)]),glContexts:contexts.size,texturesPerContext:[...contexts.values()]}});
   if(!opt['cpu-only'])console.log(profile,'residency',JSON.stringify({residentMB:residency.residentMB,neverSampledMB:residency.neverSampledMB,unreferencedMB:residency.unreferencedMB,hiddenOnlyMB:residency.hiddenOnlyMB,n:residency.neverSampledN,contexts:residency.texturesPerContext}));
   let cpu=null;
   if(opt.profile){
    cpu=[];const cdp=await p.context().newCDPSession(p);
    for(const [room,st] of [['bedroom',0],['lounge',0],['kitchen',0],['garden',0],['drive',2]]){
     await p.evaluate(([id,st])=>{House.goRoom(id,st);const target=House._.glide?.to;House.cancelGlide(true);if(target){const pose=typeof target==='function'?target():target;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('walk');window.__turn0=House.P.ry;House.anims.set('audit-turn',()=>{House.P.ry+=0.6;return true})},[room,st]);
     await p.waitForTimeout(800);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
     await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});
     const f0=await p.evaluate(()=>{window.__rafLog={total:0,by:{}};return House.perf().frames});await cdp.send('Profiler.start');
     await p.waitForTimeout(5000);
     const {profile:prof}=await cdp.send('Profiler.stop');await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
     const r=await p.evaluate(f0=>{const l=window.__rafLog;window.__rafLog=null;House.anims.delete('audit-turn');House._.setMode('focus');const pf=House.perf();return{frames:pf.frames-f0,rafMsPerFrame:+(l.total/Math.max(1,pf.frames-f0)).toFixed(1),rafBy:Object.fromEntries(Object.entries(l.by).map(([k,v])=>[k,+(v/Math.max(1,pf.frames-f0)).toFixed(1)])),renderP50:+pf.renderP50.toFixed(1),frameP50:+pf.frameP50.toFixed(1),calls:pf.calls}},f0);
     const self=new Map(),byId=new Map(prof.nodes.map(n=>[n.id,n])),dtTotal=prof.timeDeltas.reduce((a,b)=>a+b,0);
     for(let i=0;i<prof.samples.length;i++){const n=byId.get(prof.samples[i]);const k=(n.callFrame.functionName||'(anon)')+' '+n.callFrame.url.split('/').pop()+':'+(n.callFrame.lineNumber+1);self.set(k,(self.get(k)||0)+(prof.timeDeltas[i]||0))}
     const files=new Map();for(const [k,v] of self){const f=k.split(' ')[1].split(':')[0]||'(native)';files.set(f,(files.get(f)||0)+v)}
     r.topSelf=[...self].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,v])=>[k,+(100*v/dtTotal).toFixed(1)]);r.byFile=[...files].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>[k,+(100*v/dtTotal).toFixed(1)]);
     cpu.push({view:room+'-'+st,...r});console.log(profile,'cpu4x',room+'-'+st,JSON.stringify({frames:r.frames,raf:r.rafMsPerFrame,render:r.renderP50,frame:r.frameP50,calls:r.calls,rafBy:r.rafBy}));console.log('   files',JSON.stringify(r.byFile));
    }
   }
   result.profiles[profile]={views,residency,cpu,errors:[...errors]};
   assert.deepEqual(errors,[],'browser errors');
  }finally{await f.browser.close()}
 }
 await writeFile(out,JSON.stringify(result,(k,v)=>k==='tex'||k==='texObj'?undefined:v,1));console.log('wrote',out);
});
