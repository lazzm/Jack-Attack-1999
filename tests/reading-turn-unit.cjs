'use strict';
// Real three.js geometry and public reader API; no server, GPU or user data.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js'),C=require('../app/public/js/magazine-cat.js'),books=require('../app/public/js/reading-books.js');
for(const width of [1366,390]){
 const store=new Map(),THINGS={},anims=new Map();let panel=null;
 const ctx=new Proxy({measureText:s=>({width:String(s).length*12}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
 const cache=new Map(),K={mat:s=>s?.isMaterial?s:new T.MeshBasicMaterial({color:typeof s==='string'?s:s?.c||'#fff',map:s?.map||null}),tex:(id,w,h,draw)=>{if(cache.has(id))return cache.get(id);const tx=new T.Texture();tx.userData={g:ctx};draw(ctx,w,h);cache.set(id,tx);return tx},into:group=>({box:(x,y,z,w,h,d,mat)=>{const materials=mat?.all?[mat.all,mat.all,mat.all,mat.all,mat.f||mat.all,mat.b||mat.all]:mat;const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),materials);mesh.position.set(x,y,z);group.add(mesh);return mesh},cyl:(x,y,z,a,b,h,n,m)=>{const mesh=new T.Mesh(new T.CylinderGeometry(a,b,h,n),m);mesh.position.set(x,y,z);group.add(mesh);return mesh}})};
 const H={ok:true,T,THINGS,ROOMS:{bedroom:{built:false}},SNAPS:{},anims,mode:'walk',paused:false,held:()=>null,dirty(){},on(){},layerFor:t=>t.obj.traverse(o=>o.layers.set(1)),inspect(){H.mode='inspect';return true},endInspect(){const s=world.Magazines.reading;H.mode='walk';if(s)THINGS[s.id].onInspectEnd()}};
 const world={House:H,HouseKit:K,MagazineCat:C,ReadingBooks:books,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>null},Image:class{},performance:{now:()=>0},innerWidth:width,innerHeight:860,document:{querySelector:()=>panel},addEventListener(){},removeEventListener(){},setTimeout(){},console,Proxy};world.window=world;
 vm.runInNewContext(fs.readFileSync(require.resolve('../app/public/js/magazines.js'),'utf8'),world);
 let geometries=0;
 function frame(){for(const [k,fn]of anims)if(!fn(0,1/60))anims.delete(k)}
 function finish(){for(let n=0;anims.size&&n<300;n++)frame();assert.equal(anims.size,0,'Turn did not finish')}
 function key(k){const r=world.Magazines.reading;THINGS[r.id].onInspectKey({key:k,repeat:false})}
 for(const doc of [...C.ISSUES,...books]){
  const obj=new T.Group(),original=new T.Mesh(new T.BoxGeometry(21,28,.5),K.mat('#eee'));obj.add(original);const id=doc.id;
  THINGS[id]={id,obj};assert(world.Magazines.read(id,id));assert.equal(world.Magazines.reading.phase,'front');
  key('ArrowRight');assert(world.Magazines.reading.flipping);const leaf=obj.children[0].children.find(o=>o.isMesh);
  assert(leaf?.geometry.parameters.widthSegments>=12,'Turning paper has no continuous curvature');assert.equal(leaf.layers.mask,2);
  for(let n=0;n<12;n++)frame();assert(leaf.geometry.attributes.position.array.every(Number.isFinite));
  const before=leaf.geometry.attributes.position.array.slice();H.paused=true;frame();assert.deepEqual(leaf.geometry.attributes.position.array,before,'Menu advanced turn');H.paused=false;finish();
  const count=width===390?1:2;for(let p=0;p<doc.pages.length;p+=count){assert.equal(world.Magazines.reading.page,p);key('ArrowRight');finish()}
  assert.equal(world.Magazines.reading.phase,'back');key('ArrowRight');assert.equal(anims.size,0);
  for(let n=0;n<Math.ceil(doc.pages.length/count)+1;n++){key('ArrowLeft');finish()}assert.equal(world.Magazines.reading.phase,'front');
  key('ArrowRight');frame();H.endInspect();assert.equal(anims.size,0);assert.equal(world.Magazines.reading,null);assert.equal(obj.children[0],original);assert.equal(obj.children.length,1);geometries++;
 }
 const doc=C.ISSUES[0],id='pmb.'+doc.id;THINGS[id]={id,obj:new T.Group()};THINGS['pmd.'+doc.id]={st:'rest',at:{hide:true}};
 assert(world.Magazines.read(id,doc.id));key('ArrowRight');finish();assert.equal(world.Magazines.reading.phase,'inside');assert(THINGS[id].obj.getObjectByName('reading-cover-disc'),'No solid inside-cover CD');key('ArrowRight');finish();assert.equal(world.Magazines.reading.page,0);H.endInspect();
 console.log('PASS',width,'all',geometries,'editions: cover/every page/back/reverse, curved finite solid geometry, foreground layer, menu freeze, interrupted cleanup and CD inside cover');
}
