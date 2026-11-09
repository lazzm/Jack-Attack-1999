// Hero reflections must leave the existing low lighting path without a cube sampler.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
const paint={createLinearGradient:()=>({addColorStop(){}}),fillRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},strokeRect(){}};
const c={THREE:T,console,document:{createElement:()=>({getContext:()=>paint})}};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/hs-kit.js'),'utf8'),c);
const K=c.HouseKit,m=K.mat({c:'#bbb',reflect:.34}),scene=new T.Scene(),mesh=new T.Mesh(new T.BoxGeometry(),m);scene.add(mesh);
const pane=K.glazing(.36),cabinet=K.glazing(.48);scene.add(new T.Mesh(mesh.geometry,pane),new T.Mesh(mesh.geometry,cabinet));assert.equal(pane.map,cabinet.map,'All panes must share the same reflection artwork');assert.equal(pane.map.image.width,256);assert.equal(pane.depthWrite,false);
const env=m.envMap;assert(env?.isCubeTexture);assert.equal(env.image.length,6);assert(env.image.every(face=>face.width===64&&face.height===64));
K.interiorAdapt(4,scene);assert.equal(m.envMap,null);assert.equal(pane.envMap,null);assert.equal(cabinet.envMap,null);const version=m.version;K.interiorAdapt(5,scene);assert.equal(m.version,version,'Cheap rung changes must not invalidate the material');
const lowClone=m.clone();const cloneMesh=new T.Mesh(mesh.geometry,lowClone);scene.add(cloneMesh);assert.equal(lowClone.envMap,null,'Copies made on weak devices cannot restore the sampler');
K.interiorAdapt(0,scene);assert.equal(m.envMap,env);assert.equal(pane.envMap,env);assert.equal(cabinet.envMap,env);assert.equal(lowClone.envMap,env,'Copies must reuse the same tiny cube on recovery');assert.equal(m.clone().envMap,env);
K.interiorAdapt(4,scene);const latePane=K.glazing(.42);assert.equal(latePane.envMap,null,'New glazing built on weak devices cannot restore the sampler');const late=K.mat({c:'#aaa',reflect:.2});assert.equal(late.envMap,null,'Rooms built after adaptation must start without the cube');assert.equal(mesh.material,m);assert.equal(mesh.geometry,cloneMesh.geometry);
console.log('MATERIAL REFLECTION PASS: one shared 64px cube; no low-level sampler; stable material/geometry; clones and lazy rooms recover');
