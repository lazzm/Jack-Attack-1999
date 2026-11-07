'use strict';
const round=process.env.MODELS_ROUND||'r4';if(!/^r[0-9]+$/.test(round))throw Error('Invalid model round');
// Actual r128 skeleton + geometry; canvas is stubbed only for atlas painting.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*7})},{get:(o,k)=>k in o?o[k]:()=>{}});
const c={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,performance};c.window=c;vm.createContext(c);
let seed=1999;c.Math=Object.create(Math);c.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8'),c);

const report={baseline,people:{}};
const floor=(x,z)=>z<0?0:-Math.min(280,(Math.floor(z/25)+1)*20),ramp=z=>-Math.max(0,Math.min(280,(z+12.5)*.8));
for(const id of ['mom','dad','sister']){
 const r=c.NPCRig.create(id,{tier:'low'});r.floor=floor;const g=r.mesh.geometry,sole=[];
 for(let n=0;n<g.attributes.position.count;n++)if(g.attributes.position.getY(n)<2&&['footL','footR'].some(k=>g.attributes.skinIndex.getX(n)===c.NPCRig.BONES.indexOf(k)))sole.push(n);
 let worst=0,detail=null,both=0,slide=0,contactGap=0,gapDetail=null;
 for(const factor of [.45,.65,.9])for(const down of [false,true])for(const stop of [5,38,175,338])for(const angle of [0,45,-90]){
  r.teleport(0,ramp(down?390:-40),down?390:-40,down?Math.PI:0);
  const speed=r.S.speed*factor;let z=r.st.z;
  for(let i=0;i<900&&(down?z>stop:z<stop);i++){z=down?Math.max(stop,z-speed/60):Math.min(stop,z+speed/60);r.root(0,ramp(z),z,down?Math.PI:0,speed);r.update(1/60,true);}
  const previous=[null,null];
  for(let i=0;i<150;i++){
   r.root(0,ramp(z),z,(down?Math.PI:0)+angle*Math.PI/180*Math.min(1,(i+1)/40),0);r.update(1/60,true);r.group.updateMatrixWorld(true);r.mesh.skeleton.update();
   if(r.st.feet.every(f=>f.swing))both++;
   const gaps=[Infinity,Infinity];for(const n of sole){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);const depth=v.y-floor(v.x,v.z),side=g.attributes.skinIndex.getX(n)===c.NPCRig.BONES.indexOf('footR')?1:0;gaps[side]=Math.min(gaps[side],-depth);if(depth>worst){worst=depth;detail={factor,down,stop,angle,frame:i,point:v.toArray(),feet:JSON.parse(JSON.stringify(r.st.feet))}}}
   for(let k=0;k<2;k++)if(i>60&&!r.st.feet[k].swing&&gaps[k]>contactGap){contactGap=gaps[k];gapDetail={factor,down,stop,angle,frame:i,side:k,foot:JSON.parse(JSON.stringify(r.st.feet[k]))};}
   for(let k=0;k<2;k++){const b=r.bones[k?'footR':'footL'],v=b.getWorldPosition(new T.Vector3());if(!r.st.feet[k].swing&&previous[k])slide=Math.max(slide,v.distanceTo(previous[k]));previous[k]=!r.st.feet[k].swing?v:null;}
  }
 }
 report.people[id]={penetration:worst,detail,both,slide,contactGap,gapDetail};r.dispose();
}
fs.mkdirSync(__dirname+'/shots/models',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/r4-stair-interrupt-'+(baseline?'before':'after')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(!baseline&&!process.argv.includes('--measure'))for(const [id,v]of Object.entries(report.people)){assert(v.penetration<.25,id+' interrupted stair sole crosses tread '+v.penetration);assert(v.contactGap<2,id+' settled stair foot floats '+v.contactGap);assert.equal(v.both,0,id+' interrupted feet both swing');assert(v.slide<1.5,id+' planted stair support slides '+v.slide)}
console.log(process.argv.includes('--measure')?'MEASURE ONLY (acceptance assertions deferred)':baseline?'BASELINE stair interruptions':'PASS interrupted stair skin contacts and ordered turns');
