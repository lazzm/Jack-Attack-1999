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
const K=window.HouseKit,records=[],physics=[],H=window.House={K,T,root:new T.Group(),ok:true,SPOTS:{},DOORS:{},ambient:{add:noop},sfx:{},dirty:noop,relight:noop};
H.spot=(id,def)=>(H.SPOTS[id]=def);
H.door=(id,def)=>{H.DOORS[id]=def;physics.push(['door',id,def.rooms,def.swing,def.dir,def.pivot?.position.toArray()])};
for(const name of ['walkRect','block','support','solid'])H[name]=(...args)=>physics.push([name,...args]);
const worldSource=readFileSync(new URL('../app/public/js/hs-world.js',import.meta.url),'utf8'),frontStart=worldSource.indexOf('  const FRONT = Object.freeze('),frontEnd=worldSource.indexOf('  // A placement saved before',frontStart);
H.FRONT=vm.runInNewContext(worldSource.slice(frontStart,frontEnd)+';FRONT');
context.URL=URL;context.location={href:'http://localhost/'};
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
vm.runInContext(source.replace(marker,'  window.modelChecks = { doorway, sofa, banister, buildLanding, buildHall, buildKitchen, buildGarden, tree, rooms:ROOMDEF };\n'+marker),context);
const F=window.modelChecks,room=()=>({group:new T.Group()}),near=(a,b)=>assert(Math.abs(a-b)<1e-4,`${a} != ${b}`);
function bounds(mesh){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix)}
function overlap(a,b){return ['x','y','z'].every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>1e-4)}
function build(name){records.length=0;const r=room();F['build'+name](r);return {r,parts:records.slice()}}
const garden=build('Garden'),fence=garden.parts.filter(p=>p.material?.map===K.TEX['hs.fence.grain']&&p.box.max.z<0),posts=garden.parts.filter(p=>p.kind==='box'&&p.args[4]===188);
assert.equal(fence.length,9,'Every fence panel is checked');assert.equal(posts.length,10);assert.equal(new Set(posts.map(p=>p.args[0]+','+p.args[2])).size,10,'No duplicate corner posts');
for(let i=0;i<fence.length;i++)for(let j=0;j<i;j++)assert(!overlap(fence[i].box,fence[j].box),'Fence panels must not overlap at corners');
for(const panel of fence)for(const post of posts)assert(!overlap(panel.box,post.box),'Panels end at post shoulders');
const edging=garden.parts.filter(p=>p.material?.color?.getHexString()==='725437'),soil=garden.parts.find(p=>p.material?.color?.getHexString()==='3a2a1a'&&p.box.min.x===-283);assert.equal(edging.length,4);assert(soil);
for(let i=0;i<edging.length;i++){near(edging[i].box.max.y,353);assert(!overlap(edging[i].box,soil.box));for(let j=0;j<i;j++)assert(!overlap(edging[i].box,edging[j].box),'Flowerbed boards meet without overlapping caps')}
// The garden station starts clear of trunks/props, looking across the garden.
const entry=F.rooms.garden.stations[0].pose();
assert(entry.x<213&&entry.x>-298&&entry.z>-558&&entry.z<-58);
for(const [kind,lvl,x0,z0,x1,z1]of physics)if(kind==='block'&&lvl==='G'){
 const dx=entry.x-Math.max(x0,Math.min(x1,entry.x)),dz=entry.z-Math.max(z0,Math.min(z1,entry.z));
 assert(Math.hypot(dx,dz)>=22,'Entry clears every garden collision body');
}
// Garden foliage keeps smooth, varied vertex colours after production batching.
const leafMeshes=garden.r.group.children.filter(m=>m.material?.userData.nature==='leaf');
assert(leafMeshes.length>0);for(const m of leafMeshes){const c=m.geometry.attributes.color;assert(c&&c.count===m.geometry.attributes.position.count);assert(Math.max(...c.array)-Math.min(...c.array)>.1);}
// The flared roots are a closed, outward-facing lathe, from every garden angle.
const tb=K.batch();F.tree(K.into(tb),0,0,250,58);const tg=new T.Group();tb.build(tg);
for(const m of tg.children.filter(m=>m.material.map===art.t('oak'))){
 const g=m.geometry,p=g.attributes.position;let volume=0;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);volume+=a.dot(b.cross(c))/6;}assert(volume>1000,'Trunk and branches have outward winding');
}
console.log('PASS garden fence caps/clearances, grounded flowerbed joints, varied leaf vertex colours, outward solid tapered trunks');
// Run the actual dressing-gown and mower builders with the production kit.
Object.assign(context,{T,K,M:K.mat,A:art,D2R:Math.PI/180,dp:new T.Group(),dc:0,mBrass:K.mat('#c8a040'),mat:(c,o)=>K.mat({c,sh:12,sp:'#222',...o})});
const bedroom=readFileSync(new URL('../app/public/js/rm-room.js',import.meta.url),'utf8');
vm.runInContext(bedroom.slice(bedroom.indexOf('    const gown=new T.Group()'),bedroom.indexOf('    DP.box(2.65',bedroom.indexOf('    const gown=new T.Group()'))),context);
const gown=context.dp.children.find(g=>g.name==='door-dressing-gown');assert(gown);assert.equal(gown.children.length,3,'Folded gown costs three material draws');
const gb=new T.Box3().setFromObject(gown);assert(gb.max.x<0,'Entire gown stays on the bedroom side');assert(gb.max.z-gb.min.z>25&&gb.max.y-gb.min.y>70,'Solid sleeves and full draped hem');
const out=readFileSync(new URL('../app/public/js/ch-out.js',import.meta.url),'utf8');
vm.runInContext(out.slice(out.indexOf('  function mowerModel()'),out.indexOf('  CK.add({',out.indexOf('  function mowerModel()')))+';this.mower=mowerModel()',context);
const mower=context.mower,mb=new T.Box3().setFromObject(mower),body=new T.Box3();let draws=0,tris=0;
mower.traverse(o=>{if(!o.isMesh)return;if(!o.userData.contactShadow)body.union(new T.Box3().setFromObject(o));draws++;tris+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));});
assert(draws<=8,'Mower deck and pivoted handle stay batched');assert(tris<7000,'Bounded mower geometry');near(mb.max.y,0);assert(body.max.y-body.min.y>=84&&body.max.x-body.min.x<=43);assert(mower.userData.pivot?.parent===mower,'Floor-tool handle pivot retained');
console.log('PASS solid gown bounds / three draws; grounded mower, finite geometry, pivot and draw/triangle budgets:',draws,tris);
