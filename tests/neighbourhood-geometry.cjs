/* CPU-only: actual r128 geometry and HouseKit; no renderer, browser or server. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),T=require(path.join(base,'app/public/vendor/three.min.js'));
const context2d={fillRect(){},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}};
const H={ok:true,T,root:new T.Group(),scene:new T.Scene(),ambient:new Set(),dirty(){}};
let phase='day',dirtyCalls=0;H.dirty=()=>dirtyCalls++;
const window={THREE:T,House:H,HouseArt:{}};
const sandbox=vm.createContext({window,document:{createElement(){return{getContext(){return context2d}}},getElementById(){return{classList:{contains:p=>p==='rm-'+phase}}}},console});
function run(file){vm.runInContext(fs.readFileSync(path.join(base,'app/public/js',file),'utf8'),sandbox,{filename:file})}
run('hs-kit.js');
const K=window.HouseKit,add=K.Batch.prototype.add;
let primitives=0,triangles=0,trunks=0,roofShells=0;
const solids=[],treeBases=[];
const primitiveTypes=new Set(),playable=[[-340,700,716,1370],[-300,-560,215,-56]];
K.Batch.prototype.add=function(geometry,matrix,material,uv){
 assert(matrix.elements.every(Number.isFinite),'finite primitive transform');
 assert(matrix.determinant()>0,'scenery never relies on mirrored or collapsed solids');
 const p=geometry.attributes.position,idx=geometry.index?.array,edges=new Map();let volume=0;
 const v=i=>new T.Vector3().fromBufferAttribute(p,i);
 const key=a=>[a.x,a.y,a.z].map(x=>Math.round(x*1000)).join(',');
 const count=idx?idx.length:p.count;
 for(let i=0;i<count;i+=3){
  const a=v(idx?idx[i]:i),b=v(idx?idx[i+1]:i+1),c=v(idx?idx[i+2]:i+2);
  assert([a,b,c].every(q=>[q.x,q.y,q.z].every(Number.isFinite)),'finite primitive');
  // Sphere poles intentionally contain zero-area triangles; exclude those.
  if(new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).lengthSq()<1e-12)continue;
  volume+=a.dot(new T.Vector3().crossVectors(b,c))/6;
  for(const [from,to] of [[key(a),key(b)],[key(b),key(c)],[key(c),key(a)]]){
   if(from===to)continue;
   const edge=from<to?from+'|'+to:to+'|'+from,record=edges.get(edge)||{count:0,direction:0};
   record.count++;record.direction+=from<to?1:-1;edges.set(edge,record);
  }
 }
 assert(volume>0,geometry.type+' must have positive, outward-facing volume');
 for(const edge of edges.values())assert(edge.count===2&&edge.direction===0,geometry.type+' must be closed with consistent winding');
 // Do not introduce scenery solids above the existing walkable ground.
 geometry.computeBoundingBox();const bb=geometry.boundingBox.clone().applyMatrix4(matrix);
 solids.push({bb:bb.clone(),material,geometry:geometry.type});
 if(geometry.type==='ExtrudeGeometry')roofShells++;
 const gp=geometry.parameters;
 if(geometry.type==='CylinderGeometry'&&gp.height>200&&Math.max(gp.radiusTop,gp.radiusBottom)>=12){
  trunks++;treeBases.push(bb.clone());
 }
 if(bb.min.y<-200&&bb.max.y>-370)assert(!(bb.max.x>-326&&bb.min.x<446&&bb.max.z>-82&&bb.min.z<726),'main house roof volume stays clear');
 if(bb.min.y<352.8-1e-4)for(const [x0,z0,x1,z1]of playable){
  assert(!(bb.max.x>x0&&bb.min.x<x1&&bb.max.z>z0&&bb.min.z<z1),'new scenery intrudes into playable garden/drive');
 }
 primitives++;primitiveTypes.add(geometry.type);triangles+=count/3;
 return add.call(this,geometry,matrix,material,uv);
};
run('hs-environment.js');
const E=window.HouseEnvironment;
assert.equal(E.homes.length,17);assert.equal(H.ambient.size,1);
assert.equal(new Set(E.homes.map(h=>h.type)).size,4,'four coherent house archetypes');
assert(roofShells>=34,'every house has both a solid gable and a closed roof shell');
assert(trunks>=8,'town trees are grounded solids');
for(const [i,h]of E.homes.entries()){
 assert([h.x,h.z,h.ry,h.width,h.depth,h.eave,h.rise,h.front].every(Number.isFinite));
 assert(h.width>=500&&h.width<=560,'credible house widths in centimetres');
 assert(h.eave>=470&&h.eave<=510,'two storeys, without stretched giant facades');
 assert(h.front-h.depth/2>=250,'usable front garden and uninterrupted path');
 assert(h.ry===0||h.ry===180,'homes face their street, not the playable plot');
 const frontEdge=h.z+(h.ry===180?-1:1)*(h.front+20);
 assert.equal(frontEdge,i<7?2170:i<13?-1290:1300,'garden threshold meets footpath edge (opposite: the far pavement, 17.8 m from our front wall)');
 for(const other of E.homes.slice(0,i))if(h.z===other.z)
  assert(Math.abs(h.x-other.x)>=680,'separate plots do not overlap');
}
// Check the physical seams, not only the home metadata. Flat ground is the only
// scenery permitted beneath the playable garden and drive.
function surfaceAt(x,z){return solids.filter(({bb})=>bb.min.x<x&&bb.max.x>x&&bb.min.z<z&&bb.max.z>z&&bb.max.y-bb.min.y<=20&&bb.min.y>=340).sort((a,b)=>a.bb.min.y-b.bb.min.y)[0]}
for(const [x,z,top]of [[-2000,1650,353],[2000,1650,353],[-2000,1350,352.8],[17,2100,352.8],[0,2020,341],[0,-940,353],[17,-1240,352.8],[17,-640,352.8],[0,900,359],[0,-400,359],
  [2710,600,353],[2710,1700,353],[2710,3000,353],[2400,630,352.8],[3020,3030,352.8],[2465,1000,341],[4000,1350,352.8],[-5000,1700,353],[2200,600,354],[3300,0,354]]){
 const solid=surfaceAt(x,z);assert(solid,`missing ground at ${x},${z}`);
 assert(Math.abs(solid.bb.min.y-top)<.01,`ground/kerb level at ${x},${z}`);
}
for(const bb of treeBases){
 const surface=surfaceAt((bb.min.x+bb.max.x)/2,(bb.min.z+bb.max.z)/2);
 assert(surface&&Math.abs(surface.bb.min.y-bb.max.y)<.01,'tree trunk meets its actual lawn/foundation');
}
for(const h of E.homes){
 const direction=h.ry===180?-1:1,doorX=h.type===2?0:h.width*.27;
 for(const localZ of [h.depth/2+60,(h.depth/2+55+h.front)/2,h.front-10,h.front+10]){
  const surface=surfaceAt(h.x+direction*doorX,h.z+direction*localZ);
  assert(surface&&surface.bb.min.y>=351.65&&surface.bb.min.y<=352.01,`continuous doorstep-to-footpath paving: ${h.x},${h.z},${localZ}: ${surface?.bb.min.y}`);
 }
}
assert.deepEqual(Array.from(E.group.children,g=>g.name),['street','opposite houses','rear houses','side houses','far houses']);
// The village carries on: simpler far houses in every row out to the backdrop, never on the side road or the playable plot.
assert(E.farHomes.length>=18,'the rows continue past the end of the street');
for(const h of E.farHomes){
 assert(h.ry===0||h.ry===180);const frontEdge=h.z+(h.ry===180?-1:1)*(h.front+20);
 assert([2170,-1290,1300].includes(frontEdge),'far gardens meet their footpath');
 if(h.z!==-1850)assert(h.x+330<=2370||h.x-330>=3050,'no house on the side road');
 for(const o of [...E.homes,...E.farHomes])if(o!==h&&o.z===h.z)assert(Math.abs(o.x-h.x)>=680,'far plots do not overlap');
}
// The horizon ring travels with the camera and is never part of the static batches.
const B=E.backdrop;assert(B&&B.parent===H.root&&!E.group.children.includes(B),'backdrop is its own mesh');
assert.equal(B.frustumCulled,false);assert.equal(B.material.side,T.BackSide);assert(B.material.alphaTest>0&&!B.material.transparent);
const ringR=B.geometry.parameters.radiusTop;assert(ringR>=3000&&ringR<4000,'inside the camera far plane (4000), outside the playable plot');
{const cam=new T.PerspectiveCamera();cam.position.set(123,-200,456);cam.updateMatrixWorld();B.onBeforeRender(null,null,cam);assert.equal(B.position.x,123);assert.equal(B.position.z,456)}
let meshes=0;
E.group.traverse(o=>{
 assert.equal(o.userData.noPick,true);
 if(!o.geometry)return;
 meshes++;assert(o.frustumCulled);assert.equal(o.matrixAutoUpdate,false);
 assert.equal(o.material.side,T.FrontSide);assert.equal(o.material.transparent,false);
 const g=o.geometry;assert(g.boundingSphere.radius>0&&Number.isFinite(g.boundingSphere.radius));
 assert.equal(g.attributes.position.count,g.attributes.normal.count);assert.equal(g.attributes.position.count,g.attributes.color.count);
 for(const name of ['position','normal','uv','color'])assert(Array.from(g.attributes[name].array).every(Number.isFinite),name+' must stay finite');
});
console.log('meshes',meshes,'triangles',triangles,E.group.children.map(g=>g.name+':'+g.children.length).join(' '));assert(meshes<=84,'bounded static draw calls (55 for the near rows, about 26 for the far rows and the crossroads)');assert(triangles<90000,'bounded triangle budget including solid garden fences and the far rows');
const before=E.group.children.flatMap(g=>g.children.map(m=>[m.uuid,m.geometry.uuid,m.geometry.attributes.position.array]));
const meshGeometry=()=>E.group.children.flatMap(g=>g.children.map(m=>[m.uuid,m.geometry.uuid,m.geometry.attributes.position.array]));
const allMaterials=new Set();E.group.traverse(o=>{if(o.material)allMaterials.add(o.material)});
const daylight=Array.from(allMaterials,m=>m.color.getHex());
assert.equal(H.scene.background,E.sky,'translation-free cubemap remains the scene background');
E.group.traverse(o=>assert(!o.isLight,'scenery uses no lights'));
for(const ph of ['night','dusk','dawn','day']){
 phase=ph;E.update();assert.equal(E.phase,ph);
 assert.deepEqual(meshGeometry(),before,'phase changes never replace meshes, geometry or buffers');
 assert.equal(H.ambient.size,1,'one sky updater throughout phase changes');
 if(ph==='night')assert.notDeepEqual(Array.from(allMaterials,m=>m.color.getHex()),daylight,'night tint applies');
}
assert.deepEqual(Array.from(allMaterials,m=>m.color.getHex()),daylight,'daylight palette restores exactly');
const clean=dirtyCalls;E.update();assert.equal(dirtyCalls,clean,'unchanged sky does no work');
console.log(JSON.stringify({homes:E.homes.length,trunks,roofShells,primitives,primitiveTypes:[...primitiveTypes],triangles,meshes,checks:'closed outward volumes; finite attributes; walkable clearance; aligned plots/paths/kerbs; grounded trees; bounded static batches; stable phase geometry; no renderer'},null,2));
