'use strict';
// Actual r128 skeleton + geometry; canvas is stubbed only for atlas painting.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*7})},{get:(o,k)=>k in o?o[k]:()=>{}});
const c={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,performance};c.window=c;vm.createContext(c);
let seed=1999;c.Math=Object.create(Math);c.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8'),c);
if(!baseline){
 const src=fs.readFileSync(require.resolve('../app/public/js/np-life.js'),'utf8'),body=src.match(/c\.rig\.floor = \(x, z\) => \{([\s\S]*?)\n    \};/);assert(body,'production contact-floor callback');
 const person={x:371.5,z:430,lvl:'G'},H={LV:{U:73,G:353}},NV={STAIR:{z0:250},onFlight:(x,z)=>x>=333&&x<=410&&z>=200&&z<=650,floor:lvl=>H.LV[lvl]};
 const floor=new Function('NV','H','c','clamp','return (x,z)=>{'+body[1]+'}')(NV,H,person,(x,a,b)=>Math.max(a,Math.min(b,x)));
 for(const lvl of ['G','U']){person.lvl=lvl;person.z=425;for(const z of [240,250,274.9,275,400,425,440,574.9,575,630])assert.equal(floor(371.5,z),73+Math.max(0,Math.min(14,Math.floor((z-250)/25)+1))*20,'real treads across level seam');}
 person.lvl='G';person.z=350;assert.equal(floor(371.5,350),353,'space below the flight remains downstairs');person.z=600;assert.equal(floor(100,350),353,'off-flight floor unchanged');
}
const results={baseline,people:{},triangles:{}};
const bone=(r,n)=>{r.group.updateMatrixWorld(true,true);return r.bones[n].getWorldPosition(new T.Vector3())};
for(const id of ['mom','dad','sister']){
 const r=c.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);for(let i=0;i<60;i++)r.update(1/60,true);
 const standing=-bone(r,'hips').y;r.set({seat:{h:45,back:true,footH:id==='sister'?24:undefined}});for(let i=0;i<180;i++)r.update(1/60,true);
 const sat=bone(r,'hips').y;r.set({seat:null});r.update(1/60,true);const standJump=Math.abs(bone(r,'hips').y-sat);
 for(let i=0;i<80;i++)r.update(1/60,true);const standEnd=Math.abs(-bone(r,'hips').y-standing);
 r.teleport(0,0,0,0);let worstSlide=0,minHip=999,plants=0;const plant=[null,null];
 for(let i=0;i<240;i++){r.root(0,0,(i+1)*r.S.speed/60,0,r.S.speed);r.update(1/60,true);minHip=Math.min(minHip,-bone(r,'hips').y);for(let k=0;k<2;k++){const f=r.st.feet[k],v=bone(r,k?'footR':'footL');if(f.stance>.15&&f.stance<.65){if(plant[k]){worstSlide=Math.max(worstSlide,v.distanceTo(plant[k]));plants++}else plant[k]=v}else plant[k]=null;}}
 r.teleport(0,0,0,0);let doubleSwing=0,lateralSteps=0,lateralSlide=0;const last=[null,null];
 for(let i=0;i<150;i++){r.root((i+1)*42/60,0,0,0,0);r.update(1/60,true);if(r.st.feet.every(f=>!!f.swing))doubleSwing++;for(let k=0;k<2;k++){const f=r.st.feet[k],v=bone(r,k?'footR':'footL');if(f.lift>.1)lateralSteps++;if(!f.swing&&last[k])lateralSlide=Math.max(lateralSlide,v.distanceTo(last[k]));last[k]=!f.swing?v:null;}}
 let rise=17.5,cap=157.5;
 const floor=(x,z)=>z<0?0:-Math.min(cap,(Math.floor(z/25)+1)*rise);
 r.floor=floor;
 const geo=r.mesh.geometry,sole=[];for(let i=0;i<geo.attributes.position.count;i++)if(geo.attributes.position.getY(i)<2&&['footL','footR'].some(n=>geo.attributes.skinIndex.getX(i)===c.NPCRig.BONES.indexOf(n)))sole.push(i);
 function stairs(down){
  r.teleport(0,down?floor(0,200):0,down?200:-40,down?Math.PI:0);let penetration=0,worst=null,contactGap=0,contacts=0;
  for(let i=0;i<240;i++){
   const z=(down?200:-40)+(down?-1:1)*(i+1)*r.S.speed*.65/60;r.root(0,-Math.max(0,Math.min(cap,(z+12.5)/25*rise)),z,down?Math.PI:0,r.S.speed*.65);r.update(1/60,true);r.group.updateMatrixWorld(true,true);r.mesh.skeleton.update();
   const gaps=[Infinity,Infinity];
   for(const n of sole){const v=new T.Vector3().fromBufferAttribute(geo.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);const depth=v.y-floor(v.x,v.z),bone=c.NPCRig.BONES[geo.attributes.skinIndex.getX(n)],side=bone==='footR'?1:0;gaps[side]=Math.min(gaps[side],-depth);if(depth>penetration){penetration=depth;worst={frame:i,z,point:v.toArray(),bone,feet:JSON.parse(JSON.stringify(r.st.feet))};}}
   for(let k=0;k<2;k++)if(r.st.feet[k].stair&&r.st.feet[k].stance>.15&&r.st.feet[k].stance<.8){contactGap=Math.max(contactGap,gaps[k]);contacts++;}
  }
  return {penetration,worst,contactGap,contacts};
 }
 const ascent=stairs(false),descent=stairs(true);
 rise=20;cap=280;const houseAscent=stairs(false),houseDescent=stairs(true);
 if(!baseline)for(const [name,result]of Object.entries({ascent,descent,houseAscent,houseDescent})){assert(result.penetration<0.2,id+' '+name+' sole penetrates a riser by '+result.penetration);assert(result.contacts>100,id+' '+name+' has too few stance contacts');assert(result.contactGap<1.5,id+' '+name+' support foot floats '+result.contactGap);}
 results.people[id]={standJump,standEnd,worstSlide,plants,startHipDrop:standing-minHip,doubleSwing,lateralSteps,lateralSlide,ascent,descent,houseAscent,houseDescent};r.dispose();
 if(!baseline){assert(standJump<3,id+' pops '+standJump+' cm on first standing frame');assert(standEnd<1.5,id+' fails to finish standing');assert(worstSlide<1.5,id+' foot slides '+worstSlide);assert(plants>50);assert(standing-minHip<9,id+' crouches too far on a flat start');assert.equal(doubleSwing,0,id+' lifts both adjustment feet together');assert(lateralSteps>30,id+' has no visible lateral steps');assert(lateralSlide<1.5,id+' lateral support foot slides '+lateralSlide);}
}
for(const tier of ['low','high'])for(const id of Object.keys(c.NPCRig.OUTFITS))for(const outfit of c.NPCRig.OUTFITS[id]){
 const r=c.NPCRig.create(id,{tier,outfit});for(const near of [true,false]){r.update(.016,near);const key=[tier,id,outfit,near?'near':'far'].join('.');results.triangles[key]=r.tris+6;const g=r.mesh.geometry;for(const name of ['position','normal','skinWeight'])assert(g.attributes[name].array.every(Number.isFinite),key+' invalid '+name);if(tier==='low')assert(r.tris+6<=3000,key+' exceeds 3k');assert.equal(r.group.children.filter(m=>m.isSkinnedMesh).length,2);}
 r.dispose();
}
fs.mkdirSync('tests/shots/models',{recursive:true});fs.writeFileSync('tests/shots/models/kinematics-'+(baseline?'before':'after')+'.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.people,null,2));console.log(baseline?'BASELINE recorded (acceptance assertions intentionally deferred until the fix)':'PASS production rig contacts, stand continuity, finite geometry, every outfit/LOD budget and two skinned draws');
