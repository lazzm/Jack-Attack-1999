'use strict';
// Real skinned triangles and current-frame contact; no browser or saved users.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
const baseline=process.argv.includes('--baseline'),check=!baseline&&!process.argv.includes('--measure'),{execFileSync}=require('node:child_process');let clock=0,seed=1999;
const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),w={THREE:T,document:{createElement:()=>({getContext:()=>paint})},performance:{now:()=>clock},Math:math,console};w.window=w;vm.createContext(w);
vm.runInContext(baseline?execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{encoding:'utf8'}):fs.readFileSync(__dirname+'/../app/public/js/np-rig.js','utf8'),w);
const step=(r,n=1,near=true)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,near)}};
const frame=r=>{r.group.updateMatrixWorld(true);r.mesh.skeleton.update()};const point=(r,b,v=new T.Vector3())=>r.bones[b].localToWorld(v),local=(r,b)=>r.group.worldToLocal(point(r,b));
function grip(r,prop,side){frame(r);const g=r.mesh.geometry,idx=g.index.array,propBones=[w.NPCRig.BONES.indexOf('p_'+prop),...(prop==='paper'?[w.NPCRig.BONES.indexOf('jaw')]:[])],verts=new Map();const skin=n=>{if(!verts.has(n)){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);verts.set(n,v)}return verts.get(n)};const tris=[];for(let n=0;n<idx.length;n+=3)if(propBones.includes(g.attributes.skinIndex.getX(idx[n])))tris.push(new T.Triangle(skin(idx[n]),skin(idx[n+1]),skin(idx[n+2])));const finger=w.NPCRig.BONES.indexOf('lid'+side),near=new T.Vector3();let gap=Infinity;for(let n=0;n<g.attributes.position.count;n++)if(g.attributes.skinIndex.getX(n)===finger)for(const t of tris)gap=Math.min(gap,skin(n).distanceTo(t.closestPointToPoint(skin(n),near)));return gap;}
const report={baseline,sips:[],phones:[],reading:[]};
for(const id of ['mom','dad','sister'])for(const angle of [0,45,80,-80]){
 const r=w.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'tea',engage:true,look:{x:Math.sin(angle*Math.PI/180)*170,y:-120,z:Math.cos(angle*Math.PI/180)*170}});step(r,180);r.st.sipAt=-1;r.st.sipRest=0;r.st.sipQuiet=0;let low=Infinity,out=0,gap=0,samples=0,fingerGap=null;
 for(let i=0;i<180;i++){step(r);if(r.st.sipK>.97){frame(r);if(fingerGap===null)fingerGap=grip(r,'mug','R');const a=local(r,'armR'),e=local(r,'foreR');low=Math.min(low,a.y-e.y);out=Math.max(out,Math.abs(e.x)-Math.abs(a.x));gap=Math.max(gap,point(r,'p_mug',new T.Vector3(3.2,4.5,-3.5)).distanceTo(point(r,'mouth')));samples++;}}
 report.sips.push({id,angle,low,out,gap,samples,fingerGap});if(check){assert(samples);assert(fingerGap<1.7,id+' fingers miss mug handle: '+fingerGap);assert(low>7,id+' elbow rises into wing: '+low);assert(out<8,id+' elbow sticks sideways: '+out);assert(gap<2.5,id+' cup leaves mouth: '+gap)}r.dispose();
}
{
 const r=w.NPCRig.create('mom',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({action:'phone'});step(r,120);
 for(const angle of [0,45,80,-80,0]){r.set({engage:true,look:{x:Math.sin(angle*Math.PI/180)*170,y:-145,z:Math.cos(angle*Math.PI/180)*170}});let gap=0,low=Infinity;for(let i=0;i<80;i++){step(r,1,i%5!==0);frame(r);const ear=point(r,'head',new T.Vector3(-r.S.head.r[0]-.7,r.S.head.c[1]-r.J.head[1]-.8,1.5-r.J.head[2]));gap=Math.max(gap,Math.min(ear.distanceTo(point(r,'p_phone',new T.Vector3(1.2,-7,1.8))),ear.distanceTo(point(r,'p_phone',new T.Vector3(1.2,8,1.8)))));const a=local(r,'armR'),e=local(r,'foreR');low=Math.min(low,a.y-e.y)}const fingerGap=grip(r,'phone','R');report.phones.push({angle,gap,low,fingerGap});if(check){assert(fingerGap<1.7,'phone grip misses the handset: '+fingerGap);assert(gap<.25,'phone misses actual ear: '+gap);assert(low> -4,'phone elbow is high: '+low)}}r.dispose();
}
for(const [id,action,prop]of [['dad','paper','paper'],['mom','magazine','mag']]){
 const r=w.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action});step(r,180);r.prepareReading?.();let worst=0;const samples=[];
 for(let i=0;i<100;i++){step(r);if(i%5===0){const gaps=['L','R'].map(s=>grip(r,prop,s));worst=Math.max(worst,...gaps);samples.push({i,phase:r.st.readingTransfer,gaps,hands:['L','R'].map(s=>local(r,'hand'+s).toArray()),shoulders:['L','R'].map(s=>local(r,'arm'+s).toArray()),paper:r.bones['p_'+prop].position.toArray()})}}
 frame(r);const rest=point(r,'p_'+prop).clone();r.set({seat:null,action:null});r.root(35,0,20,.4,55);step(r,90);frame(r);const drift=rest.distanceTo(point(r,'p_'+prop));const scale=r.bones['p_'+prop].scale.x;
 const hiddenTime=r.st.t,hiddenSeed=seed;r.root(170,0,90,1.2,0);r.syncReading?.();frame(r);const syncDrift=rest.distanceTo(point(r,'p_'+prop));report.reading.push({id,worst,drift,scale,syncDrift,hiddenClockDrift:r.st.t-hiddenTime,hiddenRandomUnchanged:seed===hiddenSeed,samples});if(check){assert(syncDrift<.001,id+' off-screen page drags with its owner');assert.equal(r.st.t,hiddenTime);assert.equal(seed,hiddenSeed,'parked page consumes cosmetic random draws');assert(worst<1.7,id+' two-handed transfer loses solid grip: '+worst);assert(drift<.001,id+' resting page follows the walker');assert(scale>.999999,id+' page uses scale fade');}r.dispose();
}
// Serialize the real transfer and parked frames, then reconstruct a fresh
// skeleton at zero dt. Reading survives a reload without a scale fade.
report.restore=[];
if(!baseline)for(const [id,action,prop]of [['dad','paper','paper'],['mom','magazine','mag']]){
 const r=w.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action,engage:true});step(r,180);r.prepareReading('lounge');
 for(const [phase,n]of [['fold',25],['lower',30],['rest',45]]){
  step(r,n);frame(r);const state=JSON.parse(JSON.stringify(r.readingState)),at=point(r,'p_'+prop).clone();
  const fresh=w.NPCRig.create(id,{tier:'low'});fresh.floor=()=>0;fresh.teleport(0,0,0,0);fresh.set({seat:{h:45,back:true},action,engage:true});fresh.st.sitK=r.st.sitK;fresh.restoreReading(state);fresh.update(0,true);frame(fresh);const gap=at.distanceTo(point(fresh,'p_'+prop));report.restore.push({id,phase,gap});if(check)assert(gap<.1,id+' '+phase+' reload moves the page: '+gap);fresh.dispose();
 }
 r.set({seat:null,action:null});r.root(35,0,20,.4,0);step(r,120);frame(r);const state=JSON.parse(JSON.stringify(r.readingState)),at=point(r,'p_'+prop).clone();
 const fresh=w.NPCRig.create(id,{tier:'low'});fresh.floor=()=>0;fresh.teleport(35,0,20,.4);fresh.restoreReading(state);fresh.update(0,false);frame(fresh);const gap=at.distanceTo(point(fresh,'p_'+prop));report.restore.push({id,phase:'parked-away',gap});if(check){assert(gap<.001);assert(fresh.bones['p_'+prop].scale.x>.999)}fresh.dispose();
 r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action,engage:false});let gapPeak=0;for(let i=0;i<360;i++){step(r);if(!r.st.readingParked&&r.st.readingTransfer>0&&i%8===0)for(const sd of ['L','R'])gapPeak=Math.max(gapPeak,grip(r,prop,sd));}
 report.restore.push({id,phase:'retrieve',gapPeak,end:r.st.readingTransfer,parked:r.st.readingParked});if(check){assert(gapPeak<1.7,id+' loses a retrieval grip: '+gapPeak);assert.equal(r.st.readingTransfer,0);assert.equal(r.st.readingParked,false)}r.dispose();
}
// Work acknowledges the listener through the chest and shoulders; tool wrists
// remain in the paused task frame, including their world orientation.
report.work=[];
for(const action of ['washup','cook','water']){
 const r=w.NPCRig.create('mom',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({action});step(r,120);r.set({engage:true,look:{x:100,y:-140,z:150}});step(r,20);frame(r);
 const sides=action==='water'?['R']:['L','R'],start=sides.map(sd=>point(r,'hand'+sd).clone()),rot=sides.map(sd=>r.bones['hand'+sd].getWorldQuaternion(new T.Quaternion()));let peak=0,drift=0,turn=0;
 for(let i=0;i<90;i++){step(r);frame(r);peak=Math.max(peak,r.st.workAck||0);for(const [j,sd]of sides.entries()){drift=Math.max(drift,start[j].distanceTo(point(r,'hand'+sd)));turn=Math.max(turn,rot[j].angleTo(r.bones['hand'+sd].getWorldQuaternion(new T.Quaternion())))}}
 report.work.push({action,peak,drift,turn});if(check){assert(peak>.4,action+' has no shoulder acknowledgement');assert(drift<.5,action+' hands leave paused work: '+drift);assert(turn<.001,action+' wrist rotates away from work: '+turn)}r.dispose();
}
// A delayed recording cannot perform its reply before the real source starts.
{
 const r=w.NPCRig.create('dad',{tier:'low'}),other=w.NPCRig.create('mom',{tier:'low'}),voice={started:false,ended:false,level:()=>.6,progress:()=>.05};r.replyTo?.(other);r.talk(9000,'That sounds like an excellent plan.',voice);step(r,60);const pending=r.st.returnK||0;voice.started=true;let peak=0;for(let i=0;i<100;i++){step(r);peak=Math.max(peak,r.st.returnK||0)}step(r,60);report.reply={pending,peak,end:r.st.returnK};if(check){assert.equal(pending,0);assert(peak>.9,'reply has no returning gesture');assert.equal(r.st.returnK,0,'reply becomes a repeated hand wave')}r.dispose();other.dispose();
}
if(!baseline){
 const r=w.NPCRig.create('dad',{tier:'low'}),other=w.NPCRig.create('mom',{tier:'low'});let source=0;const voice={started:true,ended:false,dur:8,ctx:{state:'running'},progress:()=>source/8,level:()=>.6};r.replyTo(other);r.talk(8000,'I will keep listening.',voice);step(r);for(let i=0;i<24;i++){source+=1/60;step(r)}const held=r.st.returnK;voice.ctx.state='suspended';step(r,30);step(r,30,false);const paused=r.st.returnK;voice.ctx.state='running';source+=.05;step(r);const resumed=r.st.returnK;report.reply.sourceClock={held,paused,resumed};if(check){assert(held>.9);assert.equal(paused,held,'paused audio advances the reply');assert(resumed>.9,'resuming audio skips the held reply')}
 voice.cancelled=true;r.hush();r.replyTo(other);const pending={started:false,ended:false,level:()=>0,progress:()=>0};r.talk(8000,'An interrupted reply.',pending);step(r,30);pending.cancelled=true;r.hush();r.talk(8000,'A separate conversation.');step(r,30);if(check)assert.equal(r.st.returnK,0,'cancelled reply leaks into a later line');r.dispose();other.dispose();
}
fs.mkdirSync(__dirname+'/shots/models/r9',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/r9/'+(baseline?'before':'after')+'-contact.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log(check?'PASS round 9 current-head contact, low elbows and both transfer grips':'MEASURE ONLY: '+(baseline?'main':'working tree'));
