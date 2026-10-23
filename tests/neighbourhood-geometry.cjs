/* CPU-only: actual r128 geometry and HouseKit; no renderer, browser or server. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),T=require(path.join(base,'app/public/vendor/three.min.js'));
const context2d={fillRect(){},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}};
const H={ok:true,T,root:new T.Group(),scene:new T.Scene(),ambient:new Set(),dirty(){}};
const window={THREE:T,House:H,HouseArt:{}};
const sandbox=vm.createContext({window,document:{createElement(){return{getContext(){return context2d}}},getElementById(){return{classList:{contains:p=>p==='rm-day'}}}},console});
function run(file){vm.runInContext(fs.readFileSync(path.join(base,'app/public/js',file),'utf8'),sandbox,{filename:file})}
run('hs-kit.js');
const K=window.HouseKit,add=K.Batch.prototype.add;
let primitives=0,triangles=0;
const primitiveTypes=new Set(),playable=[[-340,700,470,1120],[-300,-560,215,-56]];
K.Batch.prototype.add=function(geometry,matrix,material,uv){
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
 if(bb.min.y<352.8-1e-4)for(const [x0,z0,x1,z1]of playable){
  assert(!(bb.max.x>x0&&bb.min.x<x1&&bb.max.z>z0&&bb.min.z<z1),'new scenery intrudes into playable garden/drive');
 }
 primitives++;primitiveTypes.add(geometry.type);triangles+=count/3;
 return add.call(this,geometry,matrix,material,uv);
};
run('hs-environment.js');
const E=window.HouseEnvironment;
assert.equal(E.homes.length,17);assert.equal(H.ambient.size,1);
assert.deepEqual(Array.from(E.group.children,g=>g.name),['street','opposite houses','rear houses','side houses']);
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
assert(meshes<=55,'bounded static draw calls');assert(triangles<60000,'bounded triangle budget');
const before=E.group.children.map(g=>g.children.length);E.update();
assert.deepEqual(E.group.children.map(g=>g.children.length),before,'sky update does not rebuild scenery');
console.log(JSON.stringify({homes:E.homes.length,primitives,primitiveTypes:[...primitiveTypes],triangles,meshes,checks:'closed outward volumes; finite attributes; walkable clearance; bounded static batches; no renderer'},null,2));
