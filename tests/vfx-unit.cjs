/* Effects must stay cosmetic, bounded and reversible under interrupted input. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../app/public/vendor/three.min.js');
let now=1000,rung=0,saved=0;const events=new Map(),root=new T.Group(),scene=new T.Scene();root.scale.y=-1;scene.add(root);
const rooms={};for(const id of ['bedroom','kitchen','lounge','garden']){rooms[id]={group:new T.Group(),outside:id==='garden'};root.add(rooms[id].group)}
const mug=new T.Group();mug.add(new T.Mesh(new T.BoxGeometry(8,9,8),new T.MeshBasicMaterial()));rooms.bedroom.group.add(mug);mug.position.set(46,0,-8);mug.scale.setScalar(.8);
const rocker=new T.Mesh(new T.BoxGeometry(2,3,1),new T.MeshBasicMaterial());rocker.name='switch-rocker';const sw=new T.Group();sw.add(rocker);
const H={ok:true,K:{rnd:()=>()=>.4},T,root,scene,ROOMS:rooms,P:{x:0,y:-55,z:50,ry:0},camera:new T.PerspectiveCamera(50,1,1,2000),ren:{domElement:{height:860}},THINGS:{mug:{obj:mug,st:'held',at:{room:'bedroom',x:46,y:0,z:-8},hx:4,hz:4}},SPOTS:{'hs.switch.kitchen':{obj:sw}},DOORS:{},
 REAR:{z1:-176,extension:120,bedroomWindows:[{x0:148,x1:232,y0:-137,y1:-14}]},motion:{reduce:false},anims:new Map(),ambient:new Set(),stood:true,paused:false,mode:'walk',here:'bedroom',graphicsGet:()=>({adapt:rung}),on:(ev,fn)=>{const a=events.get(ev)||[];a.push(fn);events.set(ev,a)},saveThings:()=>saved++};
const fire=(ev,...a)=>{for(const fn of events.get(ev)||[])fn(...a)};
let picture=128;const sg={drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(64).fill(picture)})};
const window={House:H,THREE:T,HouseEnvironment:{phase:'day'},HouseFamily:{chars:{}},OwnerTools:{now:()=>new Date(1999,10,6,21)}};
vm.runInNewContext(fs.readFileSync('app/public/js/hs-vfx.js','utf8'),{window,document:{createElement:()=>({getContext:()=>sg})},performance:{now:()=>now},Float32Array,Math,Date,Set,Map,Array,console});
const kitWindow={THREE:T};vm.runInNewContext(fs.readFileSync('app/public/js/hs-kit.js','utf8'),{window:kitWindow,document:{createElement:()=>({getContext:()=>sg})},console});
const kit=kitWindow.HouseKit,pivot=new T.Group(),brass=kit.mat('#aa8844'),paint=kit.mat('#eeeecc');root.add(pivot);kit.doorLeaf(pivot,{cx:-40,cy:200,cz:0,w:80,h:200,t:4,along:true,leaf:paint,mould:paint,brass,handleA:-73,handleY:250,leverDir:1});H.DOORS.kitchen={pivot};
const fx=window.HouseVFX,tick=[...H.ambient][0];assert(fx);assert.equal(root.children.filter(o=>/house-/.test(o.name)).length,2);assert.equal(root.children.filter(o=>o.isLight).length,0);
const before={pos:mug.position.clone(),scale:mug.scale.clone(),at:JSON.stringify(H.THINGS.mug.at)};
fire('grab','mug');now+=65;fx.beforeRender();assert.notEqual(mug.scale.y,.8);fx.afterRender();assert(mug.scale.equals(before.scale));assert(mug.position.equals(before.pos));assert.equal(JSON.stringify(H.THINGS.mug.at),before.at);assert.equal(saved,0);
for(let i=0;i<20;i++){fire('grab','mug');now+=20;fx.beforeRender();fx.afterRender();assert(mug.scale.equals(before.scale));}
H.THINGS.mug.st='rest';fire('place','mug');fire('rest','mug');assert.equal(fx.stats().events.contact,1);fire('rest','mug');assert.equal(fx.stats().events.contact,1,'No dust from load/rescue without placement');
for(let i=0;i<100;i++){now+=50;tick(now)}assert(fx.stats().active<=128);window.HouseEnvironment.phase='night';now+=50;tick(now);assert.equal(fx.stats().sources.motes||0,0,'Daylight motes never linger at night');rung=5;fire('gfx');for(let i=0;i<100;i++){now+=50;tick(now)}assert.equal(fx.stats().capacity,0);assert.equal(fx.stats().active,0);assert(fx.stats().draws<=2);
rung=4;fire('gfx');assert.equal(fx.stats().capacity,16);
fire('click','hs.switch.kitchen');now+=60;const rot=rocker.rotation.x;fx.beforeRender();assert.notEqual(rocker.rotation.x,rot);fx.afterRender();assert.equal(rocker.rotation.x,rot);
const lever=pivot.userData.vfxLevers,original=lever.geometry.attributes.position.array.slice();fire('door','kitchen');now+=90;fx.beforeRender();assert.notDeepEqual(lever.geometry.attributes.position.array,original);fx.afterRender();assert.deepEqual(lever.geometry.attributes.position.array,original);
window.HouseTelly={on:true};rung=0;fire('gfx');picture=0;fx.tvFrame({});for(let i=0;i<20;i++){now+=50;tick(now)}const darkGain=fx.stats().tvGain;picture=255;fx.tvFrame({});for(let i=0;i<20;i++){now+=50;tick(now)}assert(fx.stats().tvGain>darkGain,'Actual picture brightness drives plaster spill');window.HouseTelly.on=false;for(let i=0;i<40;i++){now+=50;tick(now)}assert(fx.stats().tvGain<.001);
H.motion.reduce=true;fire('grab','mug');now+=50;fx.beforeRender();assert(mug.scale.equals(before.scale));fx.afterRender();
H.paused=true;tick(now+100);assert.equal(fx.stats().draws,0);H.paused=false;H.stood=false;tick(now+200);assert.equal(fx.stats().draws,0);assert.equal(saved,0);
console.log('VFX PASS: render-only transforms restored, 2 shared draws, bounded pool/adaptation, contact events deduplicated, reduce motion, pause and desktop idle.');
