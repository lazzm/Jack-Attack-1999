// Inspect the production solids: closed cloth, clear doorways and sealed walls.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js');
const {execFileSync}=require('node:child_process'),path=require('node:path');
for(const file of ['app/public/js/hs-house.js','app/public/js/hs-kit.js','app/public/js/hs-art.js','app/public/js/hs-world.js','app/public/js/st-guide.js','tests/room-fixture.mjs','tests/polish-1102.mjs','tests/polish-1102-geometry.cjs','tests/polish-1102-review.mjs'])execFileSync(process.execPath,['--check',path.resolve(__dirname,'..',file)],{stdio:'inherit'});
const src=fs.readFileSync(require.resolve('../app/public/js/hs-house.js'),'utf8');
const context={T};vm.createContext(context);
vm.runInContext(src.slice(src.indexOf('  function solidWall('),src.indexOf('  // a door in a wall'))+src.slice(src.indexOf('  function clothBody('),src.indexOf('  function hallCoat('))+src.slice(src.indexOf('  function spindle('),src.indexOf('  // A newel post:')),context);
function closed(g){
 const p=g.attributes.position,ix=g.index?.array||Array.from({length:p.count},(_,i)=>i),edges=new Map();let volume=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e4)).join(',');
 for(const v of p.array)assert(Number.isFinite(v));
 for(let i=0;i<ix.length;i+=3){const ids=[ix[i],ix[i+1],ix[i+2]],v=ids.map(k=>new T.Vector3().fromBufferAttribute(p,k));volume+=v[0].dot(v[1].clone().cross(v[2]))/6;for(let j=0;j<3;j++){const a=key(ids[j]),b=key(ids[(j+1)%3]);if(a===b)continue;const k=[a,b].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}}
 assert([...edges.values()].every(n=>n===2),'open or nonmanifold boundary');assert(volume>1,'inward-facing or flat solid');
}
let meshes=[];
const B={geo(g,x,y,z,m,o={}){closed(g);const mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.position.set(x,y,z);mesh.rotation.y=(o.ry||0)*Math.PI/180;mesh.updateMatrixWorld(true);meshes.push(mesh);}};
context.doorWall(B,250,415,90,130,700,-185,73,[[150,230,-132],[300,380,-132],[450,530,-132]],null);
const ray=(z,y)=>new T.Raycaster(new T.Vector3(290,y,z),new T.Vector3(-1,0,0)).intersectObjects(meshes).length;
assert.equal(ray(340,-50),0,'bathroom opening blocked');assert(ray(340,-150)>0,'crack above bathroom');assert(ray(260,-50)>0,'solid partition missing');
meshes=[];
context.solidWall(B,410,415,-90,[[-285,-185],[285,-185],[285,95],[185,95],[185,353],[-165,353],[-165,95],[-285,95]],null,4,[[[-15,-80],[65,-80],[65,60],[-15,60]]]);
const windowRay=(z,y)=>new T.Raycaster(new T.Vector3(390,y,z),new T.Vector3(1,0,0)).intersectObjects(meshes).length;
assert.equal(windowRay(440,-10),0,'landing window blocked');assert(windowRay(440,-120)>0,'window lintel missing');assert(windowRay(380,-10)>0,'window pier missing');
meshes=[];
context.clothBody(B,[[0,3,0,4,2.4],[0,8,0,9.2,4.5],[0,22,.6,7.5,4],[0,69,1,8.9,5],[0,75,1,8.2,4.1]],null);
const g=meshes[0].geometry;g.computeBoundingBox();assert(g.boundingBox.getSize(new T.Vector3()).z>9,'coat lost its rounded depth');assert(g.index.count/3<200,'coat body triangle budget');
meshes=[];context.spindle(B,0,0,0,81.4,null);
const spindle=meshes[0].geometry;spindle.computeBoundingBox();
assert(spindle.attributes.position.count/3<=170,'spindle triangle budget');
for(const y of [2,12,69,79]){const hit=new T.Raycaster(new T.Vector3(8,y,0),new T.Vector3(-1,0,0)).intersectObjects(meshes)[0];assert(hit&&Math.abs(hit.point.x-1.65)<.002,'square stock not centred / straight');}
assert(Math.abs(spindle.boundingBox.min.x+spindle.boundingBox.max.x)<.001,'spindle off centre');
const kitContext={window:{THREE:T},Float32Array,Uint16Array,Uint32Array,console};vm.createContext(kitContext);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),kitContext);
const K=kitContext.window.HouseKit,pivot=new T.Group(),leaf=K.mat('#304a38'),glass=K.mat({c:'#c8d3c5',o:.58,tr:true,dw:false}),slab=K.doorLeaf(pivot,{cx:0,cy:0,cz:0,w:80,h:205,t:3.6,along:true,leaf,mould:leaf,field:leaf,brass:leaf,handleA:32,handleY:2,glazing:{w:42,h:78,y:-44,material:glass},glass:true});
closed(slab.geometry);pivot.updateMatrixWorld(true);
for(const side of [-1,1]){
 const direction=new T.Vector3(0,0,-side),aperture=new T.Raycaster(new T.Vector3(0,-44,side*20),direction),stile=new T.Raycaster(new T.Vector3(29,-44,side*20),direction);
 assert.equal(aperture.intersectObject(slab).length,0,'opaque door slab behind glass');assert(stile.intersectObject(slab).length>0,'door stile missing');assert(aperture.intersectObject(pivot,true).some(h=>h.object.material===glass),'glass face missing');
}
console.log('POLISH GEOMETRY PASS: closed outward cloth/walls; clear apertures and sealed lintels; solid glazing visible from both sides.');

// Compare the real entry-point browser options against HEAD using a stub that
// stops before any page/network work. Existing callers must remain identical.
(async()=>{
 const head=execFileSync('git',['show','HEAD:tests/room-fixture.mjs'],{encoding:'utf8'}),working=fs.readFileSync(require.resolve('./room-fixture.mjs'),'utf8');
 const optionCalls=async(source,opts)=>{let called;const stop=new Error('captured');const ctx={chromium:{launch:async()=>({newPage:async o=>{called=o;throw stop}})},assert,os:require('node:os'),process,URL};vm.createContext(ctx);vm.runInContext(source.replace(/^import .*;$/gm,'').replace('export async function','async function')+';this.fixture=roomFixture;',ctx);await assert.rejects(ctx.fixture('http://localhost:18081',opts),e=>e===stop);return JSON.parse(JSON.stringify(called));};
 for(const opts of [{},{signup:false,opening:true,width:1024,height:768},{opening:true,resume:true,storageState:{cookies:[],origins:[]}},{touch:true,recordVideo:{dir:'/tmp/fixture-option-proof'}}])assert.deepEqual(await optionCalls(working,opts),await optionCalls(head,opts),'non-opt-in fixture options changed');
 const phone=await optionCalls(working,{touch:true,contextOptions:{isMobile:true,userAgent:'test-phone',deviceScaleFactor:1}});assert.equal(phone.isMobile,true);assert.equal(phone.hasTouch,true);assert.equal(phone.userAgent,'test-phone');
 console.log('FIXTURE OPTIONS PASS: HEAD-equivalent for non-opt-in callers; explicit phone context only.');
})().catch(e=>{console.error(e);process.exitCode=1});
