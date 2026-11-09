'use strict';
// Original acceptance measurements on the actual r128 skeleton and skin.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
let clock=0,seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const c={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,Math:math,performance:{now:()=>clock}};c.window=c;vm.createContext(c);
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8'),c);
const step=(r,n)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,true)}};
const point=(r,n,p=new T.Vector3())=>{r.group.updateMatrixWorld(true);return r.bones[n].localToWorld(p)};
const report={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline,people:{}};
for(const id of ['mom','dad','sister']){
 seed=1999;const r=c.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.st.glanceAt=Infinity;r.st.glance=null;step(r,120);
 let elbowMax=0,wristRise=0,minSide=Infinity;
 for(let i=0;i<300;i++){
  r.root(0,0,(i+1)*r.S.speed/60,0,r.S.speed);step(r,1);if(i<90)continue;
  const hips=point(r,'hips');for(const sd of ['L','R']){const shoulder=point(r,'arm'+sd),elbow=point(r,'fore'+sd),wrist=point(r,'hand'+sd),upper=elbow.clone().sub(shoulder).normalize(),lower=wrist.clone().sub(elbow).normalize();elbowMax=Math.max(elbowMax,Math.acos(T.MathUtils.clamp(upper.dot(lower),-1,1))*180/Math.PI);wristRise=Math.max(wristRise,hips.y-wrist.y);minSide=Math.min(minSide,Math.abs(wrist.x-hips.x));}
 }
 const neck={};for(const tier of ['low','high']){const n=c.NPCRig.create(id,{tier}),g=n.mesh.geometry,L=n.S.L,first=(L.head[0]-1)*L.head[1]+2,count=L.limb+1;const ring=[];for(let j=0;j<3;j++){const p=[];for(let k=0;k<count;k++){const i=first+j*count+k;p.push([g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i)])}ring.push({width:Math.max(...p.map(v=>v[0]))-Math.min(...p.map(v=>v[0])),centreZ:(Math.max(...p.map(v=>v[2]))+Math.min(...p.map(v=>v[2])))/2});}neck[tier]={rings:ring,triangles:n.tris+6};n.dispose();}
 r.set({seat:null,action:null,engage:false});r.st.sitK=0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:false,hipForward:0,footForward:42,footH:id==='sister'?20:undefined},action:'sit'});step(r,240);
 r.group.updateMatrixWorld(true);const palms={};for(const sd of ['L','R']){const b=r.bones['hand'+sd],normal=new T.Vector3(0,0,1).transformDirection(b.matrixWorld);palms[sd]={downwardNormal:normal.y,point:point(r,'hand'+sd,new T.Vector3(0,-r.S.handLen*.35,r.S.handLen*.1)).toArray()};}
 let paper=null;if(id==='dad'){
  r.set({action:'paper',engage:false});step(r,240);const p=r.bones.p_paper.position.clone(),q=r.bones.p_paper.quaternion.clone();r.set({engage:true});step(r,1);paper={firstFrameJump:r.bones.p_paper.position.distanceTo(p),firstFrameAngle:q.angleTo(r.bones.p_paper.quaternion)*180/Math.PI};
  r.set({engage:false});step(r,120);r.st.t=4.9;step(r,60);let leafPeak=0,pageGripGap=0;
  for(let n=0;n<100;n++){step(r,1);r.group.updateMatrixWorld(true);leafPeak=Math.max(leafPeak,Math.abs(r.bones.jaw.rotation.y));const palm=point(r,'handL',new T.Vector3(0,-r.S.handLen*.55,r.S.handLen*.12));const anchor=(baseline?r.bones.p_paper:r.bones.jaw).localToWorld(new T.Vector3(22,-13,baseline?-2.8:-2.8-(r.J.jaw[2]-r.J.p_paper[2])));if(palm.distanceTo(anchor)>pageGripGap){pageGripGap=palm.distanceTo(anchor);paper.gripWorst={time:r.st.t,palm:palm.toArray(),anchor:anchor.toArray(),wrist:point(r,'handL').toArray()};}}
  r.set({seat:null});step(r,240); // Standing readers still put it down before turning away.
  r.group.updateMatrixWorld(true);const world=r.bones.p_paper.getWorldPosition(new T.Vector3());r.set({engage:true});r.root(20,0,25,.4,0);step(r,1);r.group.updateMatrixWorld(true);paper.worldReleaseDrift=world.distanceTo(r.bones.p_paper.getWorldPosition(new T.Vector3()));paper.leafPeakDegrees=leafPeak*180/Math.PI;paper.pageGripGap=pageGripGap;

 }
 const fresh=c.NPCRig.create(id,{tier:'low'});fresh.floor=()=>0;fresh.teleport(0,0,0,0);fresh.set({seat:{h:45,back:false},action:'sit'});fresh.st.sitK=.55;const before={x:fresh.st.x,z:fresh.st.z,k:fresh.st.sitK,t:fresh.st.t};fresh.update(0,true);fresh.group.updateMatrixWorld(true);const up=new T.Vector3(0,1,0).transformDirection(fresh.bones.chest.matrixWorld),restoredLean=Math.atan2(up.z,-up.y)*180/Math.PI;assert.equal(fresh.st.sitK,before.k,'zero-time posing advances a restored blend');assert.equal(fresh.st.t,before.t,'zero-time posing advances the clock');fresh.dispose();
 report.people[id]={walk:{elbowMax,wristRise,minSide},neck,palms,paper,restoredLean};
 if(!baseline&&!process.argv.includes('--measure')){assert(elbowMax<22,id+' free walk folds the forearm like carrying');assert(wristRise<13,id+' free wrist rises far above the hip');assert(minSide>r.S.hipX+2,id+' free hand crosses the torso');for(const p of Object.values(palms))assert(p.downwardNormal>.6,id+' resting palm does not face the thigh');assert(restoredLean>5,id+' first restored seated frame has a bind-pose chest');if(paper){assert(paper.firstFrameAngle<2,'paper rotates towards released hands');assert(paper.firstFrameJump<2,'paper jumps on release');assert(paper.worldReleaseDrift<.001,'released paper follows the moving root');assert(paper.leafPeakDegrees>6,'newspaper leaf never turns');assert(paper.pageGripGap<1.4,'page grip leaves the moving leaf '+paper.pageGripGap);}}
 r.dispose();
}
fs.mkdirSync(__dirname+'/shots/models',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/r4-appeal-'+(baseline?'before':'after')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log(process.argv.includes('--measure')?'MEASURE ONLY (acceptance assertions deferred)':baseline?'BASELINE APPEAL':'PASS original arm, neck, supported-palm and release measurements');
