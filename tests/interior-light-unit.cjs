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
assert(!b.stats.ready,'Bake must return before scanning the atlas');assert(timers.length,'Work was queued');assert(b.ao.image.data.every(v=>v===255),'Pending AO must be neutral, never black');assert.equal(b.ao.image.data.length,b.width*b.height,'AO stores one lossless greyscale channel');
const versions=[b.light.version,b.ao.version];let slices=0;while(timers.length){timers.shift()();if(!b.stats.ready){assert(b.ao.image.data.every(v=>v===255),'A pending atlas exposed partially baked AO before its first GPU upload');assert(b.light.image.data.every(v=>v===0),'A pending atlas exposed partially baked bounce')}assert(++slices<10000)}
assert(slices>1,'Large atlas must span several tasks');assert(b.stats.ready);assert.equal(b.light.version,versions[0]+1,'Upload once on completion');assert.equal(b.ao.version,versions[1]+1);
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
 assert.deepEqual(Buffer.from(room.lightBake.light.image.data),pixels);assert.deepEqual(Buffer.from(room.lightBake.ao.image.data),ao);
 console.log('INTERIOR WORKER PASS: byte-identical light and occlusion, one shared worker, completed upload');
}
// Projector planes transformed on the CPU must give the same aperture
// coordinates from Phong's existing view position and interpolated vertices.
{
 const sh={uniforms:{},vertexShader:T.ShaderLib.phong.vertexShader,fragmentShader:T.ShaderLib.phong.fragmentShader};material.onBeforeCompile(sh);assert(sh.vertexShader.includes('houseProjected0=vec3(dot(houseProjector0[0],mvPosition)'));assert(!sh.fragmentShader.includes('dot(projector[0],p)'));
 K.interiorFor(r);const original=sh.uniforms.houseProjector0.value.clone(),camera=new T.PerspectiveCamera();camera.position.set(80,130,350);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);K.interiorFor(r,camera);
 for(const point of [[10,-40,100],[-120,20,-20],[200,-80,200]]){const view=new T.Vector4(point[0],-point[1],point[2],1).applyMatrix4(camera.matrixWorldInverse),world=new T.Vector4(...point,1);for(const column of [0,1,3]){const a=new T.Vector4().fromArray(original.elements,column*4).dot(world),b=new T.Vector4().fromArray(sh.uniforms.houseProjector0.value.elements,column*4).dot(view);assert(Math.abs(a-b)<1e-8,'Window plane changed with camera')}}
 // Perspective-correct interpolation of an affine projector must equal
 // projecting the interpolated surface position, even across a sloping face.
 const vertices=[new T.Vector4(-120,20,-20,1),new T.Vector4(200,-80,200,1),new T.Vector4(10,-40,100,1)],weights=[.2,.35,.45],depth=[.8,2,5],den=weights.reduce((n,w,i)=>n+w/depth[i],0),point=new T.Vector4(0,0,0,0);
 vertices.forEach((v,i)=>point.addScaledVector(v,weights[i]/depth[i]/den));
 for(const column of [0,1,3]){const plane=new T.Vector4().fromArray(original.elements,column*4),interpolated=vertices.reduce((n,v,i)=>n+plane.dot(v)*weights[i]/depth[i]/den,0);assert(Math.abs(interpolated-plane.dot(point))<1e-8,'Aperture interpolation moved the sun patch')}
 console.log('INTERIOR PROJECTOR PASS: view planes and perspective interpolation preserve window projection');
}
// Failed, blocked, silent and suspended workers cannot strand a room's atlas.
for(const failure of ['constructor','post','post-second','error','message','payload','timeout','pagehide']){
 const pending=new Map(),listeners={},workers=[];let serial=0,terminations=0;
 class FaultWorker{constructor(){if(failure==='constructor')throw Error('blocked');workers.push(this)}postMessage(){this.posts=(this.posts||0)+1;if(failure==='post'||failure==='post-second'&&this.posts===2)throw Error('disconnected')}terminate(){terminations++}}
 const f={...k,Worker:FaultWorker,URL,document:{...k.document,currentScript:{src:'http://localhost/js/hs-kit.js'}},setTimeout:(fn,delay)=>(pending.set(++serial,{fn,delay}),serial),clearTimeout:id=>pending.delete(id),addEventListener:(name,fn)=>listeners[name]=fn};delete f.HouseKit;f.window=f;f.House={...k.House,ROOMS:{}};vm.createContext(f);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),f);
 const kit=f.HouseKit;kit.TEX.wallBlue=map;const group=new T.Group();group.add(new T.Mesh(new T.BoxGeometry(300,200,250),kit.mat({map})));group.children[0].updateMatrix();const room={id:'bedroom',group,lights:()=>[]};f.House.ROOMS.bedroom=room;kit.bakeInterior(room);
 let second;if(failure==='post-second'){const group=new T.Group();group.add(new T.Mesh(new T.BoxGeometry(300,200,250),kit.mat({map})));group.children[0].updateMatrix();second={id:'landing',group,lights:()=>[]};f.House.ROOMS.landing=second;kit.bakeInterior(second)}
 const worker=workers[0],late=worker?.onmessage;
 if(failure==='error')worker.onerror({preventDefault(){}});
 if(failure==='message')worker.onmessageerror();
 if(failure==='payload')worker.onmessage({data:{id:'bedroom',light:new Uint8Array(1),ao:new Uint8Array(1)}});
 if(failure==='timeout'){const [id,timer]=[...pending].find(([,t])=>t.delay===30000);pending.delete(id);timer.fn()}
 if(failure==='pagehide'){listeners.pagehide();assert(![...pending.values()].some(t=>t.delay===0));assert.equal(terminations,1);listeners.pageshow()}
 let count=0;while(pending.size){const [id,timer]=pending.entries().next().value;pending.delete(id);timer.fn();assert(++count<10000)}
 if(second)assert(second.lightBake.stats.ready,'A send failure stranded an earlier room');
 assert(room.lightBake.stats.ready,failure+' stranded the atlas');assert.equal(room.lightBake.stats.worker,false);assert.deepEqual(Buffer.from(room.lightBake.light.image.data),pixels);assert.deepEqual(Buffer.from(room.lightBake.ao.image.data),ao);
 const version=room.lightBake.light.version;if(late)late({data:{id:'bedroom',light:new Uint8Array(1),ao:new Uint8Array(1)}});listeners.pageshow();assert.equal(room.lightBake.light.version,version,'Late reply or pageshow uploaded twice');assert.equal(pending.size,0);
 console.log('INTERIOR FALLBACK PASS:',failure,room.lightBake.stats.fallback);
}
