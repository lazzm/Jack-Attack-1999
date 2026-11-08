// The production atlas must yield without exposing black AO, changing geometry
// after batching, or repainting textures when only time/switch uniforms change.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
const timers=[],date=new Date(1999,10,5,12),k={THREE:T,performance,console,setTimeout:fn=>(timers.push(fn),timers.length),document:{getElementById:()=>({classList:{contains:()=>false}})},localStorage:{getItem:()=>null},OwnerTools:{now:()=>date},Season:{sun:()=>({rise:7,set:17})}};k.window=k;
k.House={REAR:{bedroomWindows:[{x0:-200,x1:-100,y0:-100,y1:0}]},DOORS:{},ROOMS:{},dirty(){}};
vm.createContext(k);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),k);
const K=k.HouseKit,map=new T.Texture();K.TEX.wallBlue=map;
const mesh=new T.Mesh(new T.BoxGeometry(300,200,250),K.mat({map}));mesh.updateMatrix();
const r={id:'bedroom',group:new T.Group(),lights:()=>[]};r.group.add(mesh);k.House.ROOMS.bedroom=r;
K.bakeInterior(r);const b=r.lightBake,geometry=mesh.geometry,uv=geometry.attributes.uv2,material=mesh.material;
const readiness=()=>{K.interiorFor(r);const sh={uniforms:{},vertexShader:T.ShaderLib.phong.vertexShader,fragmentShader:T.ShaderLib.phong.fragmentShader};material.onBeforeCompile(sh);return sh.uniforms.houseBakeReady.value};assert.equal(readiness(),0,'Pending atlas must retain vertex lamp fill');
assert(!b.stats.ready,'Bake must return before scanning the atlas');assert(timers.length,'Work was queued');assert(b.ao.image.data.every(v=>v===255),'Pending AO must be neutral, never black');assert.equal(b.ao.image.data.length,b.width*b.height,'AO stores one lossless greyscale channel');
const versions=[b.light.version,b.ao.version];let slices=0;while(timers.length){timers.shift()();if(!b.stats.ready){assert(b.ao.image.data.every(v=>v===255),'A pending atlas exposed partially baked AO before its first GPU upload');assert(b.light.image.data.every(v=>v===0),'A pending atlas exposed partially baked bounce')}assert(++slices<10000)}
assert(slices>1,'Large atlas must span several tasks');assert(b.stats.ready);assert.equal(readiness(),1,'Publication must switch off temporary vertex fill atomically');assert.equal(b.light.version,versions[0]+1,'Upload once on completion');assert.equal(b.ao.version,versions[1]+1);
assert.equal(mesh.material.lightMap,b.gpuLight);assert.equal(mesh.material.aoMap,b.gpuSpill);
for(let i=0;i<b.ao.image.data.length;i++){const p=i*4;for(let c=0;c<3;c++)assert.equal(b.gpuLight.image.data[p+c],b.light.image.data[p+c]);assert.equal(b.gpuLight.image.data[p+3],b.ao.image.data[i]);assert.equal(b.gpuSpill.image.data[i],b.light.image.data[p+3])}
assert.equal(mesh.geometry,geometry);assert.equal(geometry.attributes.uv2,uv);assert.equal(mesh.material,material,'Background work cannot invalidate static batches');
const pixels=Buffer.from(b.light.image.data),ao=Buffer.from(b.ao.image.data),complete=[b.light.version,b.ao.version];date.setHours(22);b.update();date.setMinutes(30);b.update();
assert.deepEqual(Buffer.from(b.light.image.data),pixels);assert.deepEqual(Buffer.from(b.ao.image.data),ao);assert.deepEqual([b.light.version,b.ao.version],complete,'Clock updates must stay uniform-only');
console.log('INTERIOR LIGHT PASS: yielding bake, neutral fallback, one completed upload, stable geometry, uniform-only clock');
// The worker must produce exactly the same texels as the yielding fallback.
{
 const workerTimers=[],watchers=new Map();let workerCount=0,terminated=0,watchId=0;
 class Worker {
  constructor(){workerCount++;const ctx={self:{},performance,Uint8Array,Math,setTimeout:fn=>(workerTimers.push(fn),workerTimers.length),postMessage:data=>this.onmessage({data})};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-light-worker.js'),'utf8'),ctx);this.receive=ctx.self.onmessage}
  postMessage(data){this.receive({data})}terminate(){terminated++}
 }
 const w={...k,Worker,URL,document:{...k.document,currentScript:{src:'http://localhost/js/hs-kit.js?v=test'}},setTimeout:(fn,ms)=>{assert.equal(ms,30000,'Worker should own the texel work');watchers.set(++watchId,fn);return watchId},clearTimeout:id=>watchers.delete(id)};delete w.HouseKit;w.window=w;w.House={...k.House,ROOMS:{}};vm.createContext(w);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),w);
 const WK=w.HouseKit;WK.TEX.wallBlue=map;
 const group=new T.Group();group.add(new T.Mesh(new T.BoxGeometry(300,200,250),WK.mat({map})));group.children[0].updateMatrix();const room={id:'bedroom',group,lights:()=>[]};w.House.ROOMS.bedroom=room;WK.bakeInterior(room);
 assert(room.lightBake.stats.worker);while(workerTimers.length)workerTimers.shift()();assert(room.lightBake.stats.ready);assert.equal(workerCount,1);assert.equal(terminated,1,'Finished worker must be released');assert.equal(watchers.size,0);
 assert.deepEqual(Buffer.from(room.lightBake.light.image.data),pixels);assert.deepEqual(Buffer.from(room.lightBake.ao.image.data),ao);assert.deepEqual(Buffer.from(room.lightBake.gpuLight.image.data),Buffer.from(b.gpuLight.image.data));assert.deepEqual(Buffer.from(room.lightBake.gpuSpill.image.data),Buffer.from(b.gpuSpill.image.data));
 console.log('INTERIOR WORKER PASS: byte-identical light and occlusion, one shared worker, completed upload');
}
// Projector planes transformed on the CPU must give the same aperture
// coordinates before and after affine projection is moved to the vertex stage.
{
 const sh={uniforms:{},vertexShader:T.ShaderLib.phong.vertexShader,fragmentShader:T.ShaderLib.phong.fragmentShader};material.onBeforeCompile(sh);assert(sh.vertexShader.includes('houseWindowUV'));assert(!sh.fragmentShader.includes('uniform mat4 houseProjector0'),'Fragment shader must not retain projector matrices');assert(sh.fragmentShader.includes('houseWindowLight(normal,vViewPosition)'),'Curved props must keep the existing fragment normal');
 K.interiorFor(r);const original=sh.uniforms.houseProjector0.value.clone(),camera=new T.PerspectiveCamera();camera.position.set(80,130,350);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);K.interiorFor(r,camera);
 for(const point of [[10,-40,100],[-120,20,-20],[200,-80,200]]){const view=new T.Vector4(point[0],-point[1],point[2],1).applyMatrix4(camera.matrixWorldInverse),world=new T.Vector4(...point,1);for(const column of [0,1,3]){const a=new T.Vector4().fromArray(original.elements,column*4).dot(world),b=new T.Vector4().fromArray(sh.uniforms.houseProjector0.value.elements,column*4).dot(view);assert(Math.abs(a-b)<1e-8,'Window plane changed with camera')}}
 const vertices=[[-100,-20,0],[150,-70,-20],[20,40,-120]].map(p=>new T.Vector4(p[0],-p[1],p[2],1).applyMatrix4(camera.matrixWorldInverse)),lambda=[.21,.37,.42],weights=vertices.map((v,i)=>lambda[i]/-v.z),total=weights.reduce((a,b)=>a+b,0),fragment=new T.Vector4(0,0,0,0);vertices.forEach((v,i)=>fragment.addScaledVector(v,weights[i]/total));
 for(const key of ['houseProjector0','houseProjector1'])for(const column of [0,1,3]){const plane=new T.Vector4().fromArray(sh.uniforms[key].value.elements,column*4),old=plane.dot(fragment),projected=vertices.reduce((sum,v,i)=>sum+plane.dot(v)*weights[i]/total,0);assert(Math.abs(old-projected)<1e-9,'Perspective interpolation moved a window edge')}
 const prop=K.mat({c:'#aabbcc'}),ps={uniforms:{},vertexShader:T.ShaderLib.phong.vertexShader,fragmentShader:T.ShaderLib.phong.fragmentShader};prop.onBeforeCompile(ps);assert(ps.vertexShader.includes('houseWindowUV'),'Props must use vertex window coordinates too');assert(ps.fragmentShader.includes('#include <lights_phong_pars_fragment>'),'Full props must retain Phong highlights');
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};for(const width of [42,108,208])for(const height of [40,98,140])for(const u of [-6,-4,-2,0,2,4,width/2,width-4,width-2,width,width+2,width+4,width+6])for(const v of [-6,-4,-2,0,2,4,height/2,height-4,height-2,height,height+2,height+4,height+6]){const old=smooth(-4,4,u)*(1-smooth(width-4,width+4,u))*smooth(-4,4,v)*(1-smooth(height-4,height+4,v)),fast=smooth(-4,4,Math.min(u,width-u))*smooth(-4,4,Math.min(v,height-v));assert(Math.abs(old-fast)<1e-12,'Nearest-edge ramps changed the window mask')}
 console.log('INTERIOR PROJECTOR PASS: affine vertex coordinates preserve perspective window masks and fragment normals on shells and props');
}
// Automatic adaptation keeps the authored maps and batch/material identity.
{
 const prop=K.mat({c:'#acdfee'}),pendant=K.mat({c:'#eedfac',map});pendant.userData.pendant=true;
 r.group.add(new T.Mesh(new T.BoxGeometry(),prop),new T.Mesh(new T.BoxGeometry(),pendant));
 const compile=(m=material)=>{const sh={uniforms:{},vertexShader:T.ShaderLib.phong.vertexShader,fragmentShader:T.ShaderLib.phong.fragmentShader};m.onBeforeCompile(sh);return sh};
 K.interiorAdapt(0,r.group);const full=compile(),fullProp=compile(prop),fullKey=material.customProgramCacheKey(),version=material.version,propVersion=prop.version;
 K.interiorAdapt(4,r.group);const cheap=compile(),cheapVersion=material.version;
 assert(!cheap.vertexShader.includes('houseWindowUV'),'Fallback must not keep projecting unused sun coordinates');assert(!cheap.fragmentShader.includes('lights_phong'),'Weak shells must not retain Phong fragment lighting');assert(cheap.vertexShader.includes('if(houseBakeReady<.5)'),'Shells must retain vertex lamp fill only until their baked pools are ready');assert(!cheap.fragmentShader.includes('getPointDirectLightIrradiance'),'Fallback shell lamps must never return to fragment lighting');
 for(const ink of ['lightMapTexel.r*houseSky','lightMapTexel.g*houseMain','lightMapTexel.b*houseAccent','houseDoorIrradiance','lightMapTexel.a'])assert(cheap.fragmentShader.includes(ink),'Fallback lost '+ink);
 const cheapProp=compile(prop);assert(cheapProp.vertexShader.includes('if(any(notEqual(pointLights[ i ].color,vec3(0.0))))'));assert(!cheapProp.fragmentShader.includes('houseWindowLight'));assert(prop.version>propVersion,'Props must also invalidate their old pixel program');assert(compile(pendant).fragmentShader.includes('totalEmissiveRadiance*=1.0-houseCord'),'Low pendant must not turn its cord into a glowing shade');
 assert.notEqual(material.customProgramCacheKey(),fullKey);assert(cheapVersion>version);
 K.interiorAdapt(5,r.group);assert.equal(material.version,cheapVersion,'Moving between cheap rungs must not invalidate materials');
 K.interiorAdapt(0,r.group);assert.equal(compile().vertexShader,full.vertexShader);assert.equal(compile().fragmentShader,full.fragmentShader,'Full look must return byte for byte');assert.equal(compile(prop).fragmentShader,fullProp.fragmentShader,'Full prop highlights and sunlight must return exactly');
 assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);assert.equal(material.lightMap,b.gpuLight);assert.equal(material.aoMap,b.gpuSpill);
 console.log('INTERIOR ADAPT SHADER PASS: full shader restored exactly; low vertex props, baked pools, spill, AO and pendant ink without batch mutation');
}
// Failed, blocked, silent and suspended workers cannot strand a room's atlas.
for(const failure of ['constructor','post','post-second','error','message','payload','old-worker','timeout','pagehide']){
 const pending=new Map(),listeners={},workers=[];let serial=0,terminations=0;
 class FaultWorker{constructor(){if(failure==='constructor')throw Error('blocked');workers.push(this)}postMessage(){this.posts=(this.posts||0)+1;if(failure==='post'||failure==='post-second'&&this.posts===2)throw Error('disconnected')}terminate(){terminations++}}
 const f={...k,Worker:FaultWorker,URL,document:{...k.document,currentScript:{src:'http://localhost/js/hs-kit.js'}},setTimeout:(fn,delay)=>(pending.set(++serial,{fn,delay}),serial),clearTimeout:id=>pending.delete(id),addEventListener:(name,fn)=>listeners[name]=fn};delete f.HouseKit;f.window=f;f.House={...k.House,ROOMS:{}};vm.createContext(f);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),f);
 const kit=f.HouseKit;kit.TEX.wallBlue=map;const group=new T.Group();group.add(new T.Mesh(new T.BoxGeometry(300,200,250),kit.mat({map})));group.children[0].updateMatrix();const room={id:'bedroom',group,lights:()=>[]};f.House.ROOMS.bedroom=room;kit.bakeInterior(room);
 let second;if(failure==='post-second'){const group=new T.Group();group.add(new T.Mesh(new T.BoxGeometry(300,200,250),kit.mat({map})));group.children[0].updateMatrix();second={id:'landing',group,lights:()=>[]};f.House.ROOMS.landing=second;kit.bakeInterior(second)}
 const worker=workers[0],late=worker?.onmessage;
 if(failure==='error')worker.onerror({preventDefault(){}});
 if(failure==='message')worker.onmessageerror();
 if(failure==='payload')worker.onmessage({data:{id:'bedroom',light:new Uint8Array(1),ao:new Uint8Array(1)}});
 if(failure==='old-worker')worker.onmessage({data:{id:'bedroom',light:new Uint8Array(b.width*b.height*4),ao:new Uint8Array(b.width*b.height*4)}});
 if(failure==='timeout'){const [id,timer]=[...pending].find(([,t])=>t.delay===30000);pending.delete(id);timer.fn()}
 if(failure==='pagehide'){listeners.pagehide();assert(![...pending.values()].some(t=>t.delay===0));assert.equal(terminations,1);listeners.pageshow()}
 let count=0;while(pending.size){const [id,timer]=pending.entries().next().value;pending.delete(id);timer.fn();assert(++count<10000)}
 if(second)assert(second.lightBake.stats.ready,'A send failure stranded an earlier room');
 assert(room.lightBake.stats.ready,failure+' stranded the atlas');assert.equal(room.lightBake.stats.worker,false);assert.deepEqual(Buffer.from(room.lightBake.light.image.data),pixels);assert.deepEqual(Buffer.from(room.lightBake.ao.image.data),ao);assert.deepEqual(Buffer.from(room.lightBake.gpuLight.image.data),Buffer.from(b.gpuLight.image.data));assert.deepEqual(Buffer.from(room.lightBake.gpuSpill.image.data),Buffer.from(b.gpuSpill.image.data));
 const version=room.lightBake.light.version;if(late)late({data:{id:'bedroom',light:new Uint8Array(1),ao:new Uint8Array(1)}});listeners.pageshow();assert.equal(room.lightBake.light.version,version,'Late reply or pageshow uploaded twice');assert.equal(pending.size,0);
 console.log('INTERIOR FALLBACK PASS:',failure,room.lightBake.stats.fallback);
}
