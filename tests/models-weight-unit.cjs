'use strict';
const round=process.env.MODELS_ROUND||'r3';if(!/^r[0-9]+$/.test(round))throw Error('Invalid model round');
// Original mechanics checks on the actual vendored r128 skin, no renderer.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
let clock=0,seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const c={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,Math:math,performance:{now:()=>clock}};c.window=c;vm.createContext(c);
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8'),c);
const report={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline,people:{}};
const point=(r,n,p=new T.Vector3())=>{r.group.updateMatrixWorld(true);return r.bones[n].localToWorld(p)};
const lean=(r,n)=>{r.group.updateMatrixWorld(true);const up=new T.Vector3(0,1,0).transformDirection(r.bones[n].matrixWorld);return Math.atan2(up.z,-up.y)*180/Math.PI};
const step=(r,n,near=true)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,near)}};
for(const id of ['mom','dad','sister']){
 seed=1999; // Independent, repeatable personality sample for each baseline/after pair.
 const r=c.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,57,0);step(r,120);
 const seat={x:0,z:0,face:0,h:45,back:true,hipForward:id==='sister'?0:10,footForward:id==='sister'?32:54,support:{side:'L',x:34,y:-63.3,z:25}};
 r.set({seat,action:null});const sit=[];
 for(let i=0;i<100;i++){const t=(i+1)/60,k=Math.min(1,t/(baseline&&round==='r3'?1.1:.7)),e=k*k*(3-2*k);r.root(0,0,57*(1-e),0,0);step(r,1);if([5,23,47,83].includes(i))sit.push({time:t,chestLean:lean(r,'chest'),hips:point(r,'hips').toArray(),brace:r.st.seatBraceK||0,leftPalm:point(r,'handL',new T.Vector3(0,-r.S.handLen*.35,r.S.handLen*.1)).toArray()});}
 step(r,120);r.set({seat:null});const stand=[];
 for(let i=0;i<80;i++){const t=(i+1)/60,k=Math.max(0,Math.min(1,baseline&&round==='r3'?t/.95:(t-.12)/.83)),e=k*k*(3-2*k);r.root(0,0,57*e,0,0);step(r,1);if([5,23,47].includes(i))stand.push({time:t,chestLean:lean(r,'chest'),hips:point(r,'hips').toArray()});}
 r.set({seat:null,action:null,look:null});r.st.sitK=0;r.teleport(0,0,0,0);r.st.glanceAt=Infinity;r.st.glance=null;step(r,120);const walking=[];
 for(let i=0;i<240;i++){r.root(0,0,(i+1)*r.S.speed/60,0,r.S.speed);step(r,1);walking.push({hips:point(r,'hips').toArray(),headLean:lean(r,'head'),chestLean:lean(r,'chest')});}
 const range=(a,k)=>Math.max(...a.map(k))-Math.min(...a.map(k));
 const out={sit,stand,walk:{pelvisVerticalRange:range(walking,a=>a.hips[1]),pelvisLateralRange:range(walking,a=>a.hips[0]),headPitchRange:range(walking,a=>a.headLean),chestPitchRange:range(walking,a=>a.chestLean)},triangles:r.tris+6};
 r.teleport(0,0,0,0);step(r,180);const idle=[];for(let i=0;i<480;i++){step(r,1);idle.push({hips:point(r,'hips').toArray(),chestLean:lean(r,'chest')});}
 step(r,180,false);const far=[];for(let i=0;i<120;i++){step(r,1,false);far.push({hips:point(r,'hips').toArray(),chestLean:lean(r,'chest')});}
 out.idle={nearPelvisRange:range(idle,a=>a.hips[0]),nearBreathRange:range(idle,a=>a.chestLean),farPelvisRange:range(far,a=>a.hips[0]),farBreathRange:range(far,a=>a.chestLean)};
 if(id==='dad'){
  r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'paper',engage:false});step(r,240);r.group.updateMatrixWorld(true);r.mesh.skeleton.update();
  const g=r.mesh.geometry,indices=g.index.array,paperIndex=c.NPCRig.BONES.indexOf('p_paper'),leafIndex=c.NPCRig.BONES.indexOf('jaw'),paperTriangles=[],vertices=new Map(),closest=new T.Vector3();
  const skinned=n=>{if(!vertices.has(n)){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);vertices.set(n,v);}return vertices.get(n)};
  for(let n=0;n<indices.length;n+=3)if(g.attributes.skinIndex.getX(indices[n])===paperIndex||g.attributes.skinIndex.getX(indices[n])===leafIndex)paperTriangles.push(new T.Triangle(skinned(indices[n]),skinned(indices[n+1]),skinned(indices[n+2])));
  out.paperFingers={};
  for(const side of ['L','R']){
   const halfWidth=Math.max(...paperTriangles.flatMap(tri=>[tri.a,tri.b,tri.c]).map(v=>Math.abs(r.bones.p_paper.worldToLocal(v.clone()).x)));
   const hand=c.NPCRig.BONES.indexOf('hand'+side),finger=c.NPCRig.BONES.indexOf('lid'+side);let min=Infinity,front=0,back=0,count=0,outside=0;
   for(let n=0;n<g.attributes.position.count;n++){
    const b=g.attributes.skinIndex.getX(n);if(b!==finger&&b!==hand||g.attributes.position.getY(n)>r.J['hand'+side][1]-r.S.handLen*.49)continue;
    const v=skinned(n),local=r.bones.p_paper.worldToLocal(v.clone());if(Math.abs(local.x)>27||Math.abs(local.y)>18)continue;
    for(const tri of paperTriangles)min=Math.min(min,v.distanceTo(tri.closestPointToPoint(v,closest)));
    if(Math.abs(local.x)>halfWidth)outside++;const depth=local.z-(-1.6-(Math.abs(local.x)-halfWidth*.5)*Math.tan(9*Math.PI/180));if(depth>0)front++;else back++;count++;
   }
   out.paperFingers[side]={minSurfaceGap:min,frontVertices:front,backVertices:back,outsideLeaf:outside,vertices:count};
  }
 }
 if(!baseline){assert(out.walk.headPitchRange<3,id+' gaze shakes with the walk');assert(out.idle.farPelvisRange<1e-6&&out.idle.farBreathRange<1e-6,id+' cosmetic idle runs at distance');assert(sit[0].chestLean>8,id+' early sit lacks forward counterbalance');assert(sit[0].hips[2]<52,id+' hips do not retreat before lowering');assert(stand[0].chestLean>5,id+' stand begins without forward weight transfer');if(id==='dad')for(const grip of Object.values(out.paperFingers)){assert(grip.minSurfaceGap<.5,'fingers miss actual paper surface');assert(grip.outsideLeaf>15,'grip is buried inside the leaf silhouette');}}
 let level=0;const voice={started:true,ended:false,level:()=>level,progress:()=>.4};r.talk(10000,'A friendly conversation.',voice);step(r,20);const silent=r.face.mouth;level=.85;let browPeak=0;for(let i=0;i<180;i++){step(r,1);browPeak=Math.max(browPeak,r.st.brow||0);}const audible=r.face.mouth;voice.ended=true;step(r,20);const ended=r.face.mouth;
 out.voice={silent,audible,ended,browPeak};if(!baseline){assert.equal(silent,0,id+' silent voice opens mouth');assert.notEqual(audible,0,id+' audible voice stays closed');assert.equal(ended,0,id+' ended voice keeps mouth open');assert(browPeak>.002,id+' audible phrase has no readable brow accent');}
 report.people[id]=out;r.dispose();
}
fs.mkdirSync(__dirname+'/shots/models',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/'+round+'-weight-'+(baseline?'before':'after')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log(baseline?'BASELINE weight recorded':'PASS weight measurements finite');
for(const p of Object.values(report.people))assert(JSON.stringify(p).indexOf('null')<0,'non-finite mechanics measurement');
