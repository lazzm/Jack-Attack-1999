// CPU-only checks for hs-house models. No browser, server, account or save access.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),T=require('../app/public/vendor/three.min.js');
const noop=()=>{},textures=new Map();
const paint=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:s=>({width:s.length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
const document={getElementById:()=>null,createElement:()=>({getContext:()=>paint})};
const art=new Proxy({t:key=>{if(!textures.has(key)){const tex=new T.Texture();tex.name=key;textures.set(key,tex)}return textures.get(key)},FONT:'serif',HAND:'serif',UIF:'serif'},{get:(o,k)=>o[k]??noop});
const window={THREE:T,HouseArt:art,Room:{_:{}},RoomCat:{FINDS:[]}};
const context=vm.createContext({window,document,localStorage:{getItem:()=>null},Apps:{defineSecret:noop},console,Date,Math,Promise});
vm.runInContext(readFileSync(new URL('../app/public/js/hs-kit.js',import.meta.url),'utf8'),context);
const K=window.HouseKit,records=[],physics=[],H=window.House={K,T,ok:true,SPOTS:{},DOORS:{},ambient:{add:noop},sfx:{},dirty:noop,relight:noop};
H.spot=(id,def)=>(H.SPOTS[id]=def);
H.door=(id,def)=>{H.DOORS[id]=def;physics.push(['door',id,def.rooms,def.swing,def.dir,def.pivot?.position.toArray()])};
for(const name of ['walkRect','block','support'])H[name]=(...args)=>physics.push([name,...args]);
const originalInto=K.into;
function wrap(builder){
 const out={...builder};out.at=(...args)=>wrap(builder.at(...args));
 for(const kind of ['box','rbox','geo'])out[kind]=(...args)=>{
  const base=builder.base,offset=kind==='geo'?1:0,[x,y,z]=args.slice(offset,offset+3),options=args[kind==='box'?7:kind==='rbox'?8:5]||{},matrix=K.xform(base,x,y,z,options);
  let box,material;
  if(kind==='geo'){args[0].computeBoundingBox();box=args[0].boundingBox.clone();material=args[4]}
  else{const [w,h,d]=args.slice(3,6);box=new T.Box3(new T.Vector3(-w/2,-h/2,-d/2),new T.Vector3(w/2,h/2,d/2));material=args[kind==='box'?6:7]}
  box.applyMatrix4(matrix);records.push({kind,args,box,material,options});
  return builder[kind](...args);
 };
 return out;
}
K.into=(...args)=>wrap(originalInto(...args));
const source=readFileSync(new URL('../app/public/js/hs-house.js',import.meta.url),'utf8');
const marker='  const HouseRooms = window.HouseRooms = {';
assert(source.includes(marker));
vm.runInContext(source.replace(marker,'  window.modelChecks = { doorway, sofa, banister, buildLanding, buildHall, buildKitchen, buildGarden };\n'+marker),context);
const F=window.modelChecks,room=()=>({group:new T.Group()}),near=(a,b)=>assert(Math.abs(a-b)<1e-4,`${a} != ${b}`);
function bounds(mesh){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix)}
function overlap(a,b){return ['x','y','z'].every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>1e-4)}
function build(name){records.length=0;const r=room();F['build'+name](r);return {r,parts:records.slice()}}
// The small door's hardware is attached to the leaf, within its height; hinges stay put.
for(const [h,fy,fixed,a0,a1,inside,expected]of [[94,353,330,362,438,false,[327.5,0,438]],[205,353,205,150,230,true,[207.5,0,230]]]){
 const r=room(),frame=new T.Group(),leaf=F.doorway(r,K.into(frame),'test','w',fixed,a0,a1,fy,{h,inside,depth:h===94?1:10});
 assert.deepEqual(leaf.position.toArray(),expected);
 leaf.updateMatrix();const closedSlab=bounds(leaf.children[0]).applyMatrix4(leaf.matrix);
 for(const mesh of frame.children)assert(!overlap(closedSlab,bounds(mesh)),'The closed leaf must clear solid casings and jambs');
 const slab=bounds(leaf.children[0]),handles=leaf.children.filter(m=>m.material.color.getHexString()==='c8a040');assert.equal(handles.length,4);
 for(const mesh of handles){const b=bounds(mesh);assert(b.min.y>slab.min.y&&b.max.y<slab.max.y,'Handle must sit on its leaf');near(b.getCenter(new T.Vector3()).y,fy-Math.min(103,h*.55))}
 for(const angle of [0,35,100]){leaf.rotation.y=angle*Math.PI/180;leaf.updateMatrixWorld(true);assert(handles.every(m=>m.parent===leaf))}
}
// Cushion joins have a narrow seam and solid support; the floral repeat stays
// the same physical size on the plinth and every cushion/arm face.
for(const w of [200,90]){
 records.length=0;const batch=K.batch(),m=K.mat({c:'#fff',map:K.tex('model-check-fabric',8,8,noop)});F.sofa(K.into(batch),0,0,0,w,m);
 const upholstered=records.filter(p=>p.material===m);assert(upholstered.every(p=>p.options.uv===60));
 const seats=upholstered.filter(p=>p.args[1]===-37).sort((a,b)=>a.box.min.x-b.box.min.x),backs=upholstered.filter(p=>p.args[1]===-64),deck=upholstered.find(p=>p.args[1]===-18);
 assert.equal(seats.length,w===200?3:1);assert.equal(backs.length,seats.length);
 for(let i=0;i<seats.length;i++){assert(overlap(seats[i].box,deck.box));assert(overlap(seats[i].box,backs[i].box));if(i)near(seats[i].box.min.x-seats[i-1].box.max.x,1.2)}
 const group=new T.Group();batch.build(group);for(const mesh of group.children)assert([...mesh.geometry.attributes.uv.array].every(Number.isFinite));
}
const landing=build('Landing');
const crossRail=landing.parts.find(p=>p.kind==='box'&&p.args[0]===370&&p.args[1]===-17&&p.args[2]===600);assert(crossRail,'Keep the stairwell guard beside the parents\' door');near(crossRail.box.min.x,334.5);near(crossRail.box.max.x,405.5);
assert(!landing.parts.some(p=>p.kind==='box'&&p.args[0]===332.2),'No duplicate white nosing through the oak base rail');
const bedroomCasings=landing.parts.filter(p=>p.kind==='box'&&p.args[1]===-29.5&&[146.7,233.3].includes(p.args[2]));assert.equal(bedroomCasings.length,2);assert(bedroomCasings.every(p=>p.box.min.x>=249.89),'Landing must not duplicate the bedroom casing');
const hall=build('Hall');
const coats=hall.parts.filter(p=>p.kind==='geo'&&p.args[0].type==='ExtrudeGeometry');assert.equal(coats.length,4);for(const p of coats){const size=p.box.getSize(new T.Vector3());assert(size.x>4&&size.y>50&&size.z>25,'Coats have solid shoulders, sleeves and thickness')}
const kitchen=build('Kitchen');
const cupboard=kitchen.parts.find(p=>p.kind==='box'&&p.args[0]>20&&p.args[1]===175&&p.args[5]===32);assert(cupboard);
const leftCasing=kitchen.parts.find(p=>p.kind==='box'&&p.args[0]===76.7&&p.args[4]===205);assert(leftCasing);assert(!overlap(cupboard.box,leftCasing.box));near(leftCasing.box.min.x-cupboard.box.max.x,2.2);
for(const p of kitchen.parts.filter(p=>p.kind==='box'&&p.box.min.x>=20&&p.box.max.x<=80&&p.box.min.y>=259&&p.box.max.y<=353))assert(!overlap(p.box,leftCasing.box),'Washer carcass/worktop must clear the back-door casing');
const garden=build('Garden'),fence=garden.parts.filter(p=>p.material?.map===K.TEX['hs.fence']),posts=garden.parts.filter(p=>p.kind==='box'&&p.args[4]===188);
assert.equal(posts.length,10);assert.equal(new Set(posts.map(p=>p.args[0]+','+p.args[2])).size,10,'No duplicate corner posts');
for(let i=0;i<fence.length;i++)for(let j=0;j<i;j++)assert(!overlap(fence[i].box,fence[j].box),'Fence panels must not overlap at corners');
for(const panel of fence)for(const post of posts)assert(!overlap(panel.box,post.box),'Panels end at post shoulders');
const edging=garden.parts.filter(p=>p.material?.color?.getHexString()==='725437'),soil=garden.parts.find(p=>p.material?.color?.getHexString()==='3a2a1a'&&p.box.min.x===-283);assert.equal(edging.length,4);assert(soil);
for(let i=0;i<edging.length;i++){near(edging[i].box.max.y,353);assert(!overlap(edging[i].box,soil.box));for(let j=0;j<i;j++)assert(!overlap(edging[i].box,edging[j].box),'Flowerbed boards meet without overlapping caps')}
console.log('HOUSE MODEL GEOMETRY PASS (no browser/server): leaf handles, cushion support/UVs, landing guard/trim, solid coats, cabinet clearance, fence corners and flowerbed joints');
