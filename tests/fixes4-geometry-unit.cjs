'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),T=require('../app/public/vendor/three.min.js');
const source=n=>fs.readFileSync(path.join(__dirname,'../app/public/js',n),'utf8');
const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*7}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
const c={THREE:T,T,document:{createElement:()=>({getContext:()=>paint})},console,performance,D2R:Math.PI/180};c.window=c;vm.createContext(c);
vm.runInContext(source('hs-kit.js'),c);c.K=c.HouseKit;c.M=o=>c.K.mat(o);c.mat=(color,o)=>c.K.mat({c:color,...o});c.A={grain(){}};c.rnd=c.K.rnd;
c.grp=fn=>{const g=new T.Group();fn(c.K.into(g),g);return g};c.grpB=fn=>{const g=new T.Group(),b=c.K.batch();fn(c.K.into(b),g);b.build(g);return g};
vm.runInContext(source('np-rig.js'),c);
const life=source('np-life.js'),spots=life.slice(life.indexOf('  const seat ='),life.indexOf('  const MUG ='));
c.CAR={x:500,z:1075};c.H={FRONT:{FZ:1400}};vm.runInContext(spots+';this.spots=SPOT;this.seatFor=seatFor;',c);
for(const id of ['mom','dad'])assert.equal(c.seatFor({id},c.spots.sofaR),c.spots.sofaR.seat);
assert.equal(c.spots.sofaL.seat.z,608);assert.equal(c.spots.sofaR.seat.z,608);
const q=c.seatFor({id:'sister'},c.spots.sofaR),rig=c.NPCRig.create('sister',{tier:'low'});
rig.root(q.x,353,q.z,Math.PI,0);rig.set({seat:{h:q.h,back:q.back,footH:q.footH}});rig.st.sitK=1;
for(let i=0;i<120;i++)rig.update(1/60,true);rig.group.updateMatrixWorld(true,true);
const joints=Object.fromEntries(['hips','shinL','shinR','footL','footR'].map(k=>[k,rig.bones[k].getWorldPosition(new T.Vector3())]));
for(const side of ['L','R']){
 assert(joints['shin'+side].z<568,'Child knee intersects cushion front');assert(joints['foot'+side].z<568,'Child foot is buried in seat');
 assert(joints['foot'+side].y>joints.hips.y+15,'Shin must hang below the hips');assert(joints['foot'+side].y<353-10,'Child feet should dangle');
}
assert(Math.abs(joints.hips.y-(353-q.h-7.5))<.2,'Hips must stay at cushion height');assert(rig.tris+6<=3000);
console.log('PASS R196: production child IK, cushion contact, both knees/feet clear, dangling shins; adult seats unchanged',Object.fromEntries(Object.entries(joints).map(([k,v])=>[k,v.toArray()])));
const bed=source('ch-bed.js');
function model(name,next){const start=bed.indexOf('    '+name+': '),end=bed.indexOf(',\n    '+next+':',start);return vm.runInContext('('+bed.slice(start+name.length+6,end)+')()',c)}
const mug=model('mug','bowl');mug.updateMatrixWorld(true);
const down=new T.Raycaster(new T.Vector3(0,-20,0),new T.Vector3(0,1,0)),tea=down.intersectObject(mug,true).filter(h=>!h.object.userData.contactShadow)[0];
assert(tea&&Math.abs(tea.point.y+7.2)<.01,'Tea must be below the lip, not a lid');
down.ray.origin.x=3.95;const lip=down.intersectObject(mug,true)[0];assert(lip.point.y<-9.5,'Ceramic lip missing');
const wall=new T.Raycaster(new T.Vector3(0,-9,0),new T.Vector3(1,0,0)).intersectObject(mug,true)[0];assert(wall&&wall.distance<3.8&&wall.distance>3.4,'Inner ceramic wall missing');
console.log('PASS R197: production hollow mug, ceramic lip/inner wall, recessed tea');
const wrap=model('wrap','core');wrap.updateMatrixWorld(true);
function nearest(g,point){let d=Infinity;g.traverse(m=>{if(!m.isMesh||m.userData.contactShadow)return;const p=m.geometry.attributes.position,I=m.geometry.index;for(let i=0;i<(I?I.count:p.count);i+=3){const vs=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,I?I.getX(i+k):i+k).applyMatrix4(m.matrixWorld));d=Math.min(d,new T.Triangle(...vs).closestPointToPoint(point,new T.Vector3()).distanceTo(point))}});return d}
assert.equal(wrap.userData.handGrips.length,1);assert(nearest(wrap,new T.Vector3(...wrap.userData.handGrips[0]))<.01,'Wrapper grip floats off foil');
const tied=bed.slice(bed.indexOf('      bagTied = ')+16,bed.indexOf('\n      bagTied.visible'));
c.bm=c.mat('#1c1c20');const bag=vm.runInContext(tied.replace(/;$/,'') ,c);bag.updateMatrixWorld(true);
const grip=JSON.parse(bed.match(/handGrips: (\[\[2\.2,-32,0\]\])/)[1])[0];assert(nearest(bag,new T.Vector3(...grip))<.01,'Bag grip misses tied neck');
console.log('PASS R195: one wrapper grip on actual foil, one bag grip on actual neck');
// Build the real keyboard/mouse/lead section, then apply st-opening's clone
// offset. Grip fit must follow the keyboard body rather than the wire's bounds.
const room=source('rm-room.js');let keys;
c.L={kx:-15,ux:8,uz:9.5};c.BEI=c.mat('#ece5cf');c.BEI2=c.mat('#e0d8be');c.kbTex=c.matTex=null;
c.section=()=>{keys=new T.Group();return c.K.into(keys)};
vm.runInContext(room.slice(room.indexOf("    P = section('keys');"),room.indexOf('    // the power LEDs')),c);
const heldKeys=new T.Group();keys.position.set(15,0,-11.5);heldKeys.add(keys);heldKeys.updateMatrixWorld(true);
const keyGrips=vm.runInContext(source('st-opening.js').match(/handGrips:part==='keys'\?(\[\[[^;]+?\]\]):undefined/)[1],c);
for(const point of keyGrips)assert(nearest(heldKeys,new T.Vector3(...point))<.01,'Keyboard grip floats above its real side');
console.log('PASS R195: both keyboard grips touch production keyboard sides, independent of loose lead');
