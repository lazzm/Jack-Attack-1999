'use strict';
// Production skinning, sampled moving surfaces, both maintenance detail paths.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js'),{execFileSync}=require('node:child_process');
const baseline=process.argv.includes('--baseline'),check=!baseline&&!process.argv.includes('--measure');let clock=0;
const paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
let seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const w={Math:math,THREE:T,document:{createElement:()=>({getContext:()=>paint})},performance:{now:()=>clock},console};w.window=w;vm.createContext(w);
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{cwd:__dirname,encoding:'utf8'}):fs.readFileSync(__dirname+'/../app/public/js/np-rig.js','utf8'),w);
const step=(r,n=1,near=true)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,near)}r.group.updateMatrixWorld(true);r.mesh.skeleton.update()};
const pt=(r,b,v=[0,0,0])=>r.bones[b].localToWorld(new T.Vector3(...v));
const life=baseline?execFileSync('git',['show','HEAD:app/public/js/np-life.js'],{cwd:__dirname,encoding:'utf8'}):fs.readFileSync(__dirname+'/../app/public/js/np-life.js','utf8'),hobX=Number(life.match(/hob: \{[^\n]*?x: (-?[\d.]+)/)[1]);
const waterX=Number(life.match(/gardenWater: \{[^\n]*?x: (-?[\d.]+)/)[1]),house=baseline?execFileSync('git',['show','HEAD:app/public/js/hs-house.js'],{cwd:__dirname,encoding:'utf8'}):fs.readFileSync(__dirname+'/../app/public/js/hs-house.js','utf8'),[,bedX,bedR]=house.match(/water:\{x:REAR\.flowers\.x\+(\d+),y:GY-8,z:REAR\.flowers\.z-6,rx:(\d+)/).map(Number);
const report={baseline,work:[],stream:[],missing:[],budgets:{}};
for(const near of [true,false])for(const action of ['cook','washup','water','wipe','carwash']){
 const car=action==='carwash',r=w.NPCRig.create(car?'dad':'mom',{tier:'low'}),S=r.S;
 const surfaces={cook:{x:-24,y:253.3,z:-134,rx:3.1,rz:3.1,support:{x:-48,y:260,z:-112}},washup:{x:-81,y:263,z:-142,rx:1.5,rz:1},water:{x:-170+bedX,y:345,z:-706,rx:bedR,rz:6},wipe:{x:-174,y:260,z:-130,rx:4.5,rz:4,support:{x:-185,y:260,z:-117}},carwash:{x:44.83,y:258,z:30,rx:8,rz:5,slope:9/47,support:{x:46.55,y:249,z:-24}}};
 let surface=surfaces[action];const x=action==='water'?waterX:action==='wipe'?-184:action==='washup'?-80:car?0:hobX,z=action==='water'?-700:action==='wipe'?-86:action==='washup'?-97:car?0:-84,h=action==='water'?-Math.PI/2:car?Math.PI/2:Math.PI;
 r.floor=()=>353;r.teleport(x,353,z,h);r.workSurface=()=>surface;r.set({action});step(r,180,near);
 const row={action,near,heightError:0,supportError:0,upperArmDown:0,torso:0,neck:0,movedError:0,pausedDrift:0};
 for(let i=0;i<180;i++){
  step(r,1,near);const shoulder=pt(r,'armR'),elbow=pt(r,'foreR');row.upperArmDown+=elbow.y-shoulder.y;row.torso+=Math.abs(r.bones.spine.rotation.x+r.bones.chest.rotation.x)*180/Math.PI;row.neck+=Math.abs(r.bones.neck.rotation.x+r.bones.head.rotation.x)*180/Math.PI;
  let p;if(action==='cook')p=pt(r,'p_spoon',[0,-24,3.2]);if(action==='washup')p=pt(r,'p_sponge',[0,-1,1.5]);if(action==='water')p=pt(r,'p_can',[0,-6,30.5]);if(action==='wipe')p=pt(r,'p_sponge',[0,-2.6,1.5]);if(car)p=pt(r,'p_sponge',[0,-2.6,1.5]);
  const err=car?Math.abs(p.x-surface.x-(surface.y-p.y)*surface.slope):Math.abs(p.y-(surface.y-(action==='water'?65:0)));row.heightError=Math.max(row.heightError,err);
  if(car&&check&&i%30===0){const g=r.mesh.geometry;let penetration=-Infinity,worst=null;for(let n=0;n<g.attributes.position.count;n++)if(['handL','lidL','p_sponge'].includes(w.NPCRig.BONES[g.attributes.skinIndex.getX(n)])){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);const gap=v.x-surface.x-(surface.y-v.y)*surface.slope;if(gap>penetration){penetration=gap;worst={bone:w.NPCRig.BONES[g.attributes.skinIndex.getX(n)],v:v.toArray()}};}row.penetration=Math.max(row.penetration||0,penetration);assert(penetration<.2,'hand/sponge passes through car window: '+penetration+' '+JSON.stringify(worst));}

  if(surface.support){const palm=pt(r,'handL',[0,-S.handLen*(car?.28:.35),S.handLen*(car?.225:.12)]);row.supportError=Math.max(row.supportError,palm.distanceTo(new T.Vector3(surface.support.x,surface.support.y,surface.support.z)));}
  if(action==='water'&&check){const rose=pt(r,'p_can',[0,-6,30.5]),top=pt(r,'p_raygun'),end=pt(r,'p_raygun',[0,-1,0]);if(i%30===0){const g=r.mesh.geometry;for(let n=0;n<g.attributes.position.count;n++)if(g.attributes.skinIndex.getX(n)===w.NPCRig.BONES.indexOf('p_raygun')){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);assert(v.y>=rose.y-.01&&v.y<=surface.y+.01,'solid stream spikes beyond rose/soil: '+v.y);}}
  report.stream.push({near,topError:top.distanceTo(rose),soilError:Math.abs(end.y-surface.y),length:top.distanceTo(end)});assert(top.distanceTo(rose)<1e-8,'stream misses actual rose');assert(Math.abs(end.y-surface.y)<1e-8,'stream misses soil');}
 }
 for(const key of ['upperArmDown','torso','neck'])row[key]/=180;
 r.set({engage:true,look:{x:x+100,y:205,z:z+20}});step(r,90,near);const paused=pt(r,'handR');step(r,60,near);row.pausedDrift=paused.distanceTo(pt(r,'handR'));
 if(action==='water'&&check){assert.equal(r.bones.p_raygun.scale.y,0,'interrupted pour remains');r.set({engage:false,look:null});step(r,30,near);assert(r.bones.p_raygun.scale.y>60,'pour does not resume');}
 // A moved surface during conversation is still a contact, never a wrist snapshot.
 if(action==='wipe'&&check){surface={...surface,y:surface.y-2,support:{...surface.support,y:surface.support.y-2}};step(r,60,near);row.movedError=Math.abs(pt(r,'p_sponge',[0,-2.6,1.5]).y-surface.y);assert(row.movedError<.05);}
 surface=null;step(r,90,near);const tool=r.bones['p_'+(action==='cook'?'spoon':action==='water'?'can':'sponge')];report.missing.push({action,near,scale:tool.scale.x});if(check)assert.equal(tool.scale.x,0,'absent '+action+' surface leaves tool active');
 if(check){assert(row.heightError<.1,action+' surface error '+row.heightError);assert(row.supportError<.1,action+' support error '+row.supportError);assert(row.pausedDrift<.05,action+' paused contact drifts');if(action==='cook'){assert(row.upperArmDown>5,'cooking elbow hikes above shoulder');assert(row.torso<15,'cooking torso folds');assert(row.neck<22,'cooking head dips');}}
 report.work.push(row);r.dispose();
}
for(const tier of ['low','potato'])for(const id of Object.keys(w.NPCRig.OUTFITS))for(const outfit of w.NPCRig.OUTFITS[id]){const r=w.NPCRig.create(id,{tier,outfit});for(const near of [true,false]){step(r,1,near);report.budgets[[tier,id,outfit,near?'near':'far'].join('.')]=r.tris+6;if(check){assert(r.tris+6<=3000);assert.equal(r.group.children.filter(m=>m.isSkinnedMesh).length,2);}}r.dispose();}
const out=__dirname+'/shots/models/r11';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/'+(baseline?'before':'after')+'-contacts.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,stream:report.stream.slice(0,1),budgets:Math.max(...Object.values(report.budgets))},null,2));console.log(check?'PASS round 11 moving contacts, interruptions, stream and budgets':'BASELINE measured');
