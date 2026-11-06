'use strict';
// Original acceptance measurements on the actual r128 skeleton and skin.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
let clock=0,seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const c={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,Math:math,performance:{now:()=>clock}};c.window=c;vm.createContext(c);
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8'),c);
const step=(r,n)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,true)}};
const point=(r,n,p=new T.Vector3())=>{r.group.updateMatrixWorld(true);return r.bones[n].localToWorld(p)};

const report={baseline,grips:{},expression:{}};
for(const [id,action,prop,sides]of [['mom','magazine','mag',['L','R']],['mom','water','can',['R']],['dad','leave','case',['R']],['sister','draw','crayon',['R']],['sister','draw','pad',['L']]]){
 seed=1999;const r=c.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({action,seat:['magazine','draw'].includes(action)?{h:45,back:true}:null});step(r,240);r.group.updateMatrixWorld(true);r.mesh.skeleton.update();
 const g=r.mesh.geometry,idx=g.index.array,propIndex=c.NPCRig.BONES.indexOf('p_'+prop),vertices=new Map(),triangles=[],closest=new T.Vector3();
 const skin=n=>{if(!vertices.has(n)){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);vertices.set(n,v)}return vertices.get(n)};
 for(let n=0;n<idx.length;n+=3)if(g.attributes.skinIndex.getX(idx[n])===propIndex)triangles.push(new T.Triangle(skin(idx[n]),skin(idx[n+1]),skin(idx[n+2])));
 const out={};for(const sd of sides){const fingers=c.NPCRig.BONES.indexOf('lid'+sd),hand=c.NPCRig.BONES.indexOf('hand'+sd);let gap=Infinity,thumb=Infinity;
  for(let n=0;n<g.attributes.position.count;n++){
   const bone=g.attributes.skinIndex.getX(n),x=g.attributes.position.getX(n)-r.J['hand'+sd][0],y=g.attributes.position.getY(n)-r.J['hand'+sd][1];
   const isThumb=bone===hand&&x*(sd==='L'?1:-1)<-r.S.handLen*.12&&y<-.12*r.S.handLen&&y>-.65*r.S.handLen;
   if(bone!==fingers&&!isThumb)continue;for(const tri of triangles){const d=skin(n).distanceTo(tri.closestPointToPoint(skin(n),closest));if(bone===fingers)gap=Math.min(gap,d);if(isThumb)thumb=Math.min(thumb,d);}
  }
  out[sd]={fingerGap:gap,thumbGap:thumb};
 }
 if(prop==='crayon'){
  const tip=r.bones.p_crayon.localToWorld(new T.Vector3(0,-6,1.5)),local=r.bones.p_pad.worldToLocal(tip.clone());out.tipAbovePad=local.y-.8;
  const palm=point(r,'handL',new T.Vector3(0,-r.S.handLen*.35,r.S.handLen*.1));out.padPalmHeight=r.bones.p_pad.worldToLocal(palm).y;
 }
 report.grips[prop]=out;r.dispose();
}
for(const id of ['mom','dad','sister']){
 const sample=question=>{seed=1999;const r=c.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({engage:true,look:{x:30,y:-r.S.neck,z:180}});let progress=0;const voice={started:true,ended:false,level:()=>.7,progress:()=>progress};r.talk(10000,'Shall we give it another go'+(question?'?':'.'),voice);let brow=0,nod=0,away=0;
  for(let n=0;n<480;n++){progress=n/480;step(r,1);if(progress>.55&&progress<.9)brow=Math.max(brow,r.st.brow);nod=Math.max(nod,r.st.endNod||0);away=Math.max(away,Math.abs(r.st.gaze.x));}
  voice.ended=true;step(r,30);const mouth=r.face.mouth;r.dispose();return {brow,nod,away,mouth};};
 report.expression[id]={question:sample(true),statement:sample(false)};
}
fs.mkdirSync('tests/shots/models',{recursive:true});fs.writeFileSync('tests/shots/models/r4-grips-'+(baseline?'before':'after')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(!baseline&&!process.argv.includes('--measure')){
 for(const [prop,g]of Object.entries(report.grips))for(const sd of ['L','R'])if(g[sd]){assert(g[sd].fingerGap<1.3,prop+' '+sd+' fingers miss solid surface '+g[sd].fingerGap);assert(g[sd].thumbGap<1.6,prop+' '+sd+' thumb misses grip '+g[sd].thumbGap)}
 assert(Math.abs(report.grips.crayon.tipAbovePad)<.4,'crayon tip misses actual pad');assert(Math.abs(report.grips.crayon.padPalmHeight)<.6,'support palm misses pad');
 for(const [id,v]of Object.entries(report.expression)){assert(v.question.brow>v.statement.brow+.004,id+' question has no distinct brow');assert(v.question.nod>.04,id+' sentence end has no nod');assert(v.question.away<.025,id+' addressed gaze breaks away');assert.equal(v.question.mouth,0,id+' ended voice stays open')}
}
console.log(process.argv.includes('--measure')?'MEASURE ONLY (acceptance assertions deferred)':baseline?'BASELINE solid grip and phrase measures':'PASS original solid grip and phrase measures');
