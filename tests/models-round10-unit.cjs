'use strict';
// Real skinned triangles and current-frame contact; no browser or saved users.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),check=!baseline&&!process.argv.includes('--measure'),{execFileSync}=require('node:child_process');let clock=0,seed=1999;
const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),w={THREE:T,document:{createElement:()=>({getContext:()=>paint})},performance:{now:()=>clock},Math:math,console};w.window=w;vm.createContext(w);
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(__dirname+'/../app/public/js/np-rig.js','utf8'),w);
const step=(r,n=1,near=true)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,near)}};
const frame=r=>{r.group.updateMatrixWorld(true);r.mesh.skeleton.update()};const point=(r,b,v=new T.Vector3())=>r.bones[b].localToWorld(v),local=(r,b)=>r.group.worldToLocal(point(r,b));
function counterClearance(r){
 let gap=Infinity;const g=r.mesh.geometry;
 for(let j=0;j<g.attributes.position.count;j++){
  const bone=w.NPCRig.BONES[g.attributes.skinIndex.getX(j)];if(!/^(hips|spine|chest|thigh[LR]|shin[LR]|foot[LR])$/.test(bone))continue;
  const v=new T.Vector3().fromBufferAttribute(g.attributes.position,j);r.mesh.boneTransform(j,v);r.mesh.localToWorld(v);
  if(v.y>=263&&v.x>=-160&&v.x<=-40)gap=Math.min(gap,v.z-(v.y<349?-114:-122));
 }return gap;
}
function grip(r,prop,side){frame(r);const g=r.mesh.geometry,idx=g.index.array,propBones=[w.NPCRig.BONES.indexOf('p_'+prop),...(prop==='paper'?[w.NPCRig.BONES.indexOf('jaw')]:[])],verts=new Map();const skin=n=>{if(!verts.has(n)){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);verts.set(n,v)}return verts.get(n)};const tris=[];for(let n=0;n<idx.length;n+=3)if(propBones.includes(g.attributes.skinIndex.getX(idx[n])))tris.push(new T.Triangle(skin(idx[n]),skin(idx[n+1]),skin(idx[n+2])));const finger=w.NPCRig.BONES.indexOf('lid'+side),near=new T.Vector3();let gap=Infinity;for(let n=0;n<g.attributes.position.count;n++)if(g.attributes.skinIndex.getX(n)===finger)for(const t of tris)gap=Math.min(gap,skin(n).distanceTo(t.closestPointToPoint(skin(n),near)));return gap;}
const report={baseline,work:[],pages:[],budgets:{}};
// Follow the production sink stance: the hands cannot reach the bowl from
// the old, distant foot position without folding the torso over the counter.
const stanceSource=baseline?execFileSync('git',['show','HEAD:app/public/js/np-life.js'],{cwd:__dirname,encoding:'utf8'}):fs.readFileSync(__dirname+'/../app/public/js/np-life.js','utf8');
const sinkZ=Number(stanceSource.match(/sink: \{[^\n]*?z: (-?[\d.]+)/)[1]);
for(const [action,x,z,h,surface]of [
 ['washup',-80,sinkZ,Math.PI,{x:-81,y:263,z:-142,rx:1.5,rz:1}],
 ['washup',-80,sinkZ,Math.PI,{x:-81,y:267,z:-142,rx:1.5,rz:1}],
 ['cook',-10,-84,Math.PI,{x:-24,y:253.3,z:-134,rx:3.1,rz:3.1}],
 ['water',-80,-700,-Math.PI/2,{x:-127,y:345,z:-706,rx:5,rz:6}]]){
 const r=w.NPCRig.create('mom',{tier:'low'});r.floor=()=>353;r.teleport(x,353,z,h);r.workSurface=()=>surface;r.set({action});step(r,180);
 let height=0,outside=0,fingerGap=0,solidRadius=0,panBottom=0,bodyClearance=Infinity;const samples=[];const geom=r.mesh.geometry,vertices=[];for(let j=0;j<geom.attributes.position.count;j++)if(geom.attributes.skinIndex.getX(j)===w.NPCRig.BONES.indexOf(action==='washup'?'p_sponge':action==='cook'?'p_spoon':'p_can'))vertices.push(j);
 for(let i=0;i<240;i++){
  step(r);frame(r);const b=action==='washup'?'p_sponge':action==='cook'?'p_spoon':'p_can',v=action==='washup'?[0,-1,1.5]:action==='cook'?[0,-24,3.2]:[0,-6,30.5],p=point(r,b,new T.Vector3(...v)),goalY=surface.y-(action==='water'?65:0);
  if(action==='washup'&&i%30===0)bodyClearance=Math.min(bodyClearance,counterClearance(r));
  height=Math.max(height,Math.abs(p.y-goalY));
  if(action!=='water')for(const j of vertices){const v=new T.Vector3().fromBufferAttribute(geom.attributes.position,j);r.mesh.boneTransform(j,v);r.mesh.localToWorld(v);if(action==='cook')panBottom=Math.max(panBottom,v.y);else if(v.y>=258.6){const rad=11.5+Math.min(1,(272-v.y)/12.8)*2.7-.5;solidRadius=Math.max(solidRadius,Math.hypot((v.x+84)/rad,(v.z+146)/(rad*.74)));}}
const radial=Math.hypot((p.x-surface.x)/surface.rx,(p.z-surface.z)/surface.rz);outside=Math.max(outside,radial);if(i%30===0){fingerGap=Math.max(fingerGap,grip(r,action==='washup'?'sponge':action==='cook'?'spoon':'can','R'));}if(i%30===0)samples.push({i,point:p.toArray(),radial,height:p.y-goalY});
 }
 if(check&&action==='washup'){
  assert(Math.abs(r.bones.spine.rotation.x+r.bones.chest.rotation.x)<35*Math.PI/180,'washing folds the torso over the sink');
  assert(r.eyeWorld(new T.Vector3()).y<225,'washing head is too low to see the window');
 }
 if(check&&action==='washup')assert(bodyClearance>.2,'Working body intersects the cabinet or recessed kickboard: '+bodyClearance);
 const before=point(r,'handR').clone();r.set({engage:true,look:{x:x+100,y:205,z:z+40}});step(r,40);frame(r);const held=point(r,'handR').clone();step(r,60);frame(r);const drift=held.distanceTo(point(r,'handR'));
 report.work.push({action,waterHeight:action==='washup'?surface.y:null,height,outside,fingerGap,solidRadius,panBottom,bodyClearance,drift,entry:before.distanceTo(held),samples});if(check){if(action==='washup')assert(solidRadius<1.01,'solid sponge crosses bowl wall: '+solidRadius);if(action==='cook')assert(panBottom<256.95,'spoon bowl passes through pan bottom: '+panBottom);assert(height<.5,action+' tool height misses real surface: '+height);assert(outside<1.15,action+' tool leaves work footprint: '+outside);assert(drift<.05,action+' paused grip drifts');}r.dispose();
}
const r=w.NPCRig.create('dad',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'paper'});step(r,180);r.st.t=r.st.pageTime=r.st.pageLast=4;
let maxGrip=0,peak=0;
for(let i=0;i<1500;i++){
 step(r);frame(r);peak=Math.max(peak,r.bones.jaw.rotation.y);if(check){assert(local(r,'handL').x>=-.5,'turn crosses the left wrist over the body');assert(local(r,'handR').x<=.5,'turn crosses the right wrist over the body');}if(i%8===0){const gaps=['L','R'].map(sd=>grip(r,'paper',sd));maxGrip=Math.max(maxGrip,...gaps);report.pages.push({time:r.st.t,leaf:r.bones.jaw.rotation.y,gaps});}
 if(i===170){r.set({engage:true});const leaf=r.bones.jaw.rotation.y;step(r,90);if(check)assert.equal(r.bones.jaw.rotation.y,leaf,'interruption moves turning leaf');r.set({engage:false});}
}
if(check){assert(peak>2.8,'page never completes turn');assert(maxGrip<1.7,'page loses grip: '+maxGrip);}
// Put away an already turned spread without reopening or jumping it.
r.set({engage:false});r.st.pageTime=r.st.pageLast=r.st.t=10;r.update(0,true);frame(r);const beforePage=point(r,'p_paper').clone(),beforeLeaf=r.bones.jaw.rotation.y;r.prepareReading();step(r);frame(r);
report.stowEntry={jump:beforePage.distanceTo(point(r,'p_paper')),leafJump:Math.abs(beforeLeaf-r.bones.jaw.rotation.y)};if(check){assert(report.stowEntry.jump<1,'turned page jumps on put-away');assert(report.stowEntry.leafJump<.01,'turned page reopens on put-away');}
let stowGrip=0;for(let n=0;n<100;n++){step(r);if(n%8===0)for(const sd of ['L','R'])stowGrip=Math.max(stowGrip,grip(r,'paper',sd));}report.turnedStowGrip=stowGrip;if(check)assert(stowGrip<1.7,'turned-page put-away loses contact: '+stowGrip);
const state=JSON.parse(JSON.stringify(r.readingState));r.dispose();
const fresh=w.NPCRig.create('dad',{tier:'low'});fresh.floor=()=>0;fresh.teleport(0,0,0,0);fresh.set({seat:{h:45,back:true},action:'paper'});fresh.st.sitK=1;fresh.restoreReading(state);fresh.update(0,true);if(check)assert(Math.abs(fresh.bones.jaw.rotation.y-state.leaf)<1e-8,'zero-time restore moves leaf');fresh.dispose();
if(!baseline){
const child=w.NPCRig.create('sister',{tier:'low'});child.floor=()=>0;child.teleport(0,0,0,0);child.set({seat:{h:45,table:67,back:true},action:'draw'});step(child,180);child.st.drawElapsed=0;child.st.drawLast=child.st.t;
let nibGap=0,inkGap=0,nibWorst=null;for(let n=0;n<1320;n++){step(child);frame(child);const tip=child.bones.p_pad.worldToLocal(point(child,'p_crayon',new T.Vector3(0,-6,1.5)));const gap=tip.distanceTo(new T.Vector3(child.st.drawX,.85+child.st.drawLift,child.st.drawZ));if(gap>nibGap){nibGap=gap;nibWorst={time:child.st.drawElapsed,expected:[child.st.drawX,.85+child.st.drawLift,child.st.drawZ],actual:tip.toArray()};}if(!child.st.drawLift)inkGap=Math.max(inkGap,gap);}
const drawing=JSON.parse(JSON.stringify(child.drawingState)),ink=child.mesh.material.userData.np.npDrawing.value;child.set({engage:true});step(child);const paused=child.st.drawElapsed;step(child,90);if(check)assert.equal(child.st.drawElapsed,paused,'paused drawing advances ink');
const restored=w.NPCRig.create('sister',{tier:'low'});restored.floor=()=>0;restored.teleport(0,0,0,0);restored.set({seat:{h:45,table:67,back:true},action:'draw'});restored.st.sitK=1;restored.restoreDrawing(drawing);restored.update(0,true);const restoredInk=restored.mesh.material.userData.np.npDrawing.value;
report.drawing={nibGap,inkGap,nibWorst,ink,restoredInk,elapsed:drawing.elapsed};if(check){assert(nibGap<.08,'nib leaves original stroke: '+nibGap);assert(inkGap<.08,'ink leads nib: '+inkGap);assert.equal(restoredInk,ink,'drawing changes on zero-time restore');assert(ink>=35,'picture never finishes');}report.drawing.restores=[];
for(const elapsed of [.075,.3,1.15,5.77,12.9,20.3]){
 const a=w.NPCRig.create('sister',{tier:'low'}),b=w.NPCRig.create('sister',{tier:'low'});
 for(const rig of [a,b]){rig.floor=()=>0;rig.teleport(0,0,0,0);rig.set({seat:{h:45,table:67,back:true},action:'draw'});rig.st.sitK=1;}
 a.restoreDrawing({elapsed});a.update(0,true);frame(a);const saved=JSON.parse(JSON.stringify(a.drawingState)),position=point(a,'p_crayon',new T.Vector3(0,-6,1.5));
 b.restoreDrawing(saved);b.update(0,true);frame(b);const gap=position.distanceTo(point(b,'p_crayon',new T.Vector3(0,-6,1.5))),inkDrift=Math.abs(a.mesh.material.userData.np.npDrawing.value-b.mesh.material.userData.np.npDrawing.value);
 report.drawing.restores.push({elapsed,gap,inkDrift});if(check){assert(gap<1e-8,'drawing restore moves nib');assert.equal(inkDrift,0,'drawing restore changes ink');assert(Math.abs(b.st.drawElapsed-elapsed)<1e-10,'zero-time restore advances drawing');}a.dispose();b.dispose();
}
child.dispose();restored.dispose();
}
for(const tier of ['low','potato'])for(const id of Object.keys(w.NPCRig.OUTFITS))for(const outfit of w.NPCRig.OUTFITS[id]){const r=w.NPCRig.create(id,{tier,outfit});for(const near of [true,false]){r.update(.016,near);report.budgets[[tier,id,outfit,near?'near':'far'].join('.')]=r.tris+6;if(check){assert(r.tris+6<=3000);assert.equal(r.group.children.filter(o=>o.isSkinnedMesh).length,2);}}r.dispose();}
report.maxGrip=maxGrip;report.turnDegrees=peak*180/Math.PI;
fs.mkdirSync(__dirname+'/shots/models/r10',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/r10/'+(baseline?'before':'after')+'-contact.json',JSON.stringify(report,null,2));console.log(JSON.stringify({work:report.work.map(({samples,...r})=>r),maxGrip,turnDegrees:report.turnDegrees,drawing:report.drawing,maxTriangles:Math.max(...Object.values(report.budgets))},null,2));console.log(check?'PASS surface tools, complete turn, paused grips, restore, two draws and all Low/Potato budgets':'MEASURE ONLY');
