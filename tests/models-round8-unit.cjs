'use strict';
// Production r128 rigs: explicit source-clock performances, held props and
// planted group turns. Only the canvas paint API is stubbed, never geometry.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
let clock=0,seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
const w={THREE:T,document:{createElement:()=>({getContext:()=>paint})},performance:{now:()=>clock},Math:math,console};w.window=w;vm.createContext(w);
for(const name of ['np-lines','np-beats','np-rig'])vm.runInContext(fs.readFileSync(__dirname+'/../app/public/js/'+name+'.js','utf8'),w);
const step=(r,n=1)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,true)}};
const frame=r=>{r.group.updateMatrixWorld(true);r.mesh.skeleton.update()};
const point=(r,k,p=new T.Vector3())=>r.bones[k].localToWorld(p);
const report={beats:[],props:[],pivots:[]};
assert.equal(Object.keys(w.NPCBeats).length,133);
for(const [id,direction]of Object.entries(w.NPCBeats)){
 const text=w.VoiceLines[id][1],r=w.NPCRig.create(w.VoiceLines[id][0],{tier:'low'});let source=-.3, textProgress=0;
 const v={lineId:id,dur:direction.dur+.83,nameId:'fixture',nameDur:.73,started:true,ended:false,level:()=>.65,progress:()=>direction.file?Math.max(0,(source+.83)/v.dur):textProgress,sourceTime:()=>source};
 r.talk(v.dur*1000,text,v,w.VoiceDirections[id]);step(r,30);assert.equal(r.st.directed,direction);assert.equal(r.st.beatSmile,0,id+' acts over the joined name');
 for(const [kind,a,b,fraction,anchor]of direction.beats){
  assert(a>=0&&a<=direction.dur&&b>a&&fraction>=0&&fraction<=1,id+' invalid authored window');assert(text.toLowerCase().includes(anchor.toLowerCase()),id+' missing anchor');
  source=a-.01;textProgress=Math.max(0,fraction-.01/v.dur);step(r,1);const before=kind==='joke'||kind==='warm'?r.st.beatSmile:kind==='question'?r.st.beatBrow:r.st.beatNod;
  source=Math.min(a+.16,(a+b)*.5);textProgress=fraction+.16/v.dur;step(r,30);const value=kind==='joke'||kind==='warm'?r.st.beatSmile:kind==='question'?r.st.beatBrow:kind==='thought'?r.st.beatThought:kind==='firm'?r.st.beatFirm:r.st.beatNod;
  assert(value>.2,id+' '+kind+' has no directed peak');report.beats.push({id,kind,anchor,a,b,peak:value,before});
 }
 source=direction.dur+2;textProgress=1.2;if(!direction.file)v.ended=true;step(r,60);assert.equal(r.st.beatSmile,0,id+' beat never releases');
 r.talk(8000,text,null,w.VoiceDirections[id],id);assert.equal(r.st.directed,direction,'sound-off loses line identity');r.talk(8000,'First! '+text,null,w.VoiceDirections[id],id);assert(r.st.beatOffset>0&&r.st.beatScale<1,'silent name prefix is not accounted for');r.hush();step(r,90);assert(r.mesh.material.userData.np.npAct.value.y<.002,'hush leaks authored smile');r.dispose();
}
// A replaced clip must not make the audience react at stale source times.
{
 const id='talk.mom.evening.02',r=w.NPCRig.create('mom',{tier:'low'}),audience=w.NPCRig.create('dad',{tier:'low'}),voice={lineId:id,dur:100,started:true,ended:false,level:()=>.7,progress:()=>.1,sourceTime:()=>1000};
 r.talk(100000,w.VoiceLines[id][1],voice,'happy',id);audience.set({listen:r});for(let n=0;n<60;n++){step(r);step(audience)}assert.equal(r.st.beatSmile,0,'stale source moves an authored actor beat');assert(audience.mesh.material.userData.np.npAct.value.y<.005,'stale source makes the audience laugh early');r.dispose();audience.dispose();
}
function gripGap(r,prop,sd){
 frame(r);const g=r.mesh.geometry,bi=w.NPCRig.BONES.indexOf('p_'+prop),leaf=prop==='paper'?w.NPCRig.BONES.indexOf('jaw'):-1,skin=new Map(),verts=n=>{if(!skin.has(n)){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,n);r.mesh.boneTransform(n,v);r.mesh.localToWorld(v);skin.set(n,v)}return skin.get(n)};
 const triangles=[],idx=g.index.array;for(let n=0;n<idx.length;n+=3)if([bi,leaf].includes(g.attributes.skinIndex.getX(idx[n])))triangles.push(new T.Triangle(verts(idx[n]),verts(idx[n+1]),verts(idx[n+2])));
 let gap=Infinity;const fingers=w.NPCRig.BONES.indexOf('lid'+sd),closest=new T.Vector3();for(let n=0;n<g.attributes.position.count;n++)if(g.attributes.skinIndex.getX(n)===fingers)for(const t of triangles)gap=Math.min(gap,verts(n).distanceTo(t.closestPointToPoint(verts(n),closest)));return gap;
}
for(const [id,action,prop]of [['dad','paper','paper'],['mom','magazine','mag']]){
 const r=w.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action});step(r,240);frame(r);const high=point(r,'p_'+prop).y;
 r.set({engage:true,look:{x:70,y:-130,z:160}});r.talk(6000,'Tell me how your day has been.');let worst=0,low;
 for(let n=0;n<300;n++){step(r);if([0,6,24,60,150,299].includes(n)){for(const sd of ['L','R'])worst=Math.max(worst,gripGap(r,prop,sd));frame(r);low=point(r,'p_'+prop).y;assert(r.bones['p_'+prop].scale.x>.99,'held page disappears')}}
 assert(worst<1.6,id+' fingers leave lowered page '+worst);assert(low-high>4,id+' page never lowers: '+(low-high));r.hush();r.set({engage:false,look:null});step(r,180);frame(r);assert(Math.abs(point(r,'p_'+prop).y-high)<1.2,id+' reading does not resume');report.props.push({id,action,worstFingerGap:worst,lowering:low-high});r.dispose();
}
for(const id of ['mom','dad','sister'])for(const angle of [0,45,80,-80]){
 const a=angle*Math.PI/180,r=w.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'tea',engage:true,look:{x:Math.sin(a)*170,y:-120,z:Math.cos(a)*170}});step(r,240);r.st.sipRest=r.st.t;r.st.sipQuiet=0;r.st.sipAt=-1;
 let peak=0,minMouth=Infinity;for(let n=0;n<240;n++){step(r);peak=Math.max(peak,r.st.sipK);if(r.st.sipK>.94){frame(r);const rim=point(r,'p_mug',new T.Vector3(3.2,4.5,-3.5)),mouth=point(r,'mouth');minMouth=Math.min(minMouth,rim.distanceTo(mouth))}}
 assert(peak>.94,id+' engaged listener never drinks');assert(minMouth<2.5,id+' mug rim misses turned mouth: '+minMouth);r.talk(8000,'I can put my cup down to speak.');step(r,24);assert(r.st.sipK<.02,id+' drinks through own sentence');report.props.push({id,action:'tea',angle,sipPeak:peak,rimToMouth:minMouth});r.dispose();
}
// A capped locomotion dt must not stretch drinking across several real
// recorded sentences. The source clock advances at four rendered frames/s.
{
 const r=w.NPCRig.create('mom',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'tea',engage:true});step(r,180);r.st.sipAt=-1;r.st.sipRest=0;r.st.sipQuiet=0;r.talk(1000,'I will listen in a moment.');
 for(let i=0;i<4;i++){clock+=250;r.update(1/60,true)}r.hush();let peak=0;
 for(let i=0;i<16;i++){clock+=250;r.update(1/60,true);peak=Math.max(peak,r.st.sipK)}assert(peak>.8,'capped frame dt prevents a between-line sip');report.props.push({id:'mom',action:'slow-render-sip',peak});r.dispose();
}
// The production maintenance loop can run near=false between visible frames.
// It must not cancel a live sip: near controls detail, not the held action.
{
 const r=w.NPCRig.create('mom',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'tea'});step(r,180);r.st.sipAt=-1;r.st.sipRest=0;r.st.sipQuiet=0;
 r.talk(1000,'I will listen to your answer.');for(let i=0;i<4;i++){clock+=250;r.update(.1,true)}r.hush();let peak=0,resets=0;
 for(let i=0;i<24;i++){
  clock+=100;r.update(.1,true);peak=Math.max(peak,r.st.sipK);
  const at=r.st.sipAt;clock+=210;r.update(.21,false);peak=Math.max(peak,r.st.sipK);
  if(at>=0&&r.st.sipAt<0&&r.st.sipClock-at<2.25)resets++;
  if(r.st.sipK>.97)break;
 }
 assert(peak>.94,'maintenance updates repeatedly cancel the listener sip: peak '+peak);assert.equal(resets,0,'detail-only update cancels an unfinished sip');
 const interruptedAt=r.st.sipK;assert(interruptedAt>.97,'speech interruption fixture did not begin with a raised mug');r.talk(6000,'My cup comes down while I speak.');for(let i=0;i<4;i++){clock+=250;r.update(.1,i%2===0)}assert(r.st.sipK<.02,'own recorded turn does not lower the mug across mixed-detail updates');
 report.props.push({id:'mom',action:'mixed-detail-sip',peak,resets,interruptedAt,ownSpeechSip:r.st.sipK});r.dispose();
}
// A sip follows the current solved head when a live listener changes addressee.
// Static-facing fixtures alone cannot catch a one-frame head/arm solve lag.
{
 const r=w.NPCRig.create('mom',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true},action:'tea',look:{x:0,y:-120,z:170}});step(r,180);r.st.sipAt=-1;r.st.sipRest=0;r.st.sipQuiet=0;
 let worst=0,count=0;
 for(let i=0;i<80;i++){
  const angle=(Math.floor(i/4)%2?80:-80)*Math.PI/180;r.set({look:{x:Math.sin(angle)*170,y:-120,z:Math.cos(angle)*170}});clock+=100;r.update(.1,i%3!==0);
  if(i%3!==0&&r.st.sipK>.97){frame(r);worst=Math.max(worst,point(r,'p_mug',new T.Vector3(3.2,4.5,-3.5)).distanceTo(point(r,'mouth')));count++;}
 }
 assert(count>0,'no live head-turn sip contact samples');assert(worst<2.5,'mug follows the previous head pose instead of the drinking mouth: '+worst);report.props.push({id:'mom',action:'turning-listener-sip',worstRimGap:worst,count});r.dispose();
}
// A seated child keeps the crayon and pad while talking. The nib stays
// on the same pad, and the drawing clock resumes from the paused phase.
{
 const r=w.NPCRig.create('sister',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({seat:{h:45,back:true,table:74},action:'draw'});step(r,240);r.set({engage:true,look:{x:50,y:-125,z:160}});r.talk(8000,'I can tell you what my picture is.');let tipError=0,paused;
 for(let n=0;n<300;n++){step(r);if(n===0)paused=r.st.jobPause;if(n%24===0){frame(r);const tip=point(r,'p_crayon',new T.Vector3(0,-6,1.5)),local=r.bones.p_pad.worldToLocal(tip.clone());tipError=Math.max(tipError,Math.abs(local.y-.8));assert(r.bones.p_crayon.scale.x>.99&&r.bones.p_pad.scale.x>.99,'seated job prop disappears')}}
 assert.equal(r.st.jobPause,paused,'engaged drawing clock keeps advancing');assert(tipError<.2,'paused nib leaves the paper: '+tipError);const phase=r.st.jobPause-(r.st.jobOffset||0);r.hush();r.set({engage:false});step(r);assert(Math.abs(r.st.t-r.st.jobOffset-phase)<.04,'drawing resumes at a new phase');report.props.push({id:'sister',action:'draw',tipError});r.dispose();
}
// Exercise the real controller helper and the real rig foot solver together.
const life=fs.readFileSync(__dirname+'/../app/public/js/np-life.js','utf8'),a=life.indexOf('  function listenerTurn('),b=life.indexOf('\n  function ',a+5);
const wrap=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const turn=new Function('nowMs','NV','sameFloor','dist','angd','clamp',life.slice(a,b)+';return listenerTurn;')(()=>clock,{onFlight:()=>false},(a,b)=>a.lvl===b.lvl,(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),wrap,T.MathUtils.clamp);
for(const angle of [65,100,-100,160]){
 const r=w.NPCRig.create('dad',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);step(r,120);const other={present:true,x:Math.sin(angle*Math.PI/180)*180,z:Math.cos(angle*Math.PI/180)*180,room:'lounge',lvl:'G'},c={x:0,z:0,h:0,room:'lounge',lvl:'G',listenTo:other,listenUntil:clock+10000};let maxStep=0,double=0,plantDrift=0;
 for(let n=0;n<300;n++){const before=r.st.feet.map(f=>({...f})),h=c.h;turn(c,1/60);maxStep=Math.max(maxStep,Math.abs(wrap(h,c.h)));r.root(c.x,0,c.z,c.h,0);step(r);if(r.st.feet.every(f=>f.swing))double++;for(let i=0;i<2;i++){const f=r.st.feet[i],p=before[i];if(!f.swing&&!p.swing)plantDrift=Math.max(plantDrift,Math.hypot(f.x-p.x,f.z-p.z))}}
 assert(Math.abs(wrap(c.h,angle*Math.PI/180))<.61,'wide group remains head-only');assert(maxStep<=.8/60+.00001);assert.equal(double,0,'both feet unplanted');assert(plantDrift<1e-8);c.seated={};const heading=c.h;turn(c,1);assert.equal(c.h,heading,'listener pivots a seat');report.pivots.push({angle,bodyDegrees:c.h*180/Math.PI,maxStep,plantDrift,double});r.dispose();
}
// Profile paint uses the actual render camera in the solved head frame,
// including a parent with the house's reflected Y axis.
{
 const r=w.NPCRig.create('dad',{tier:'low'}),scene=new T.Scene();scene.add(r.group);r.teleport(0,353,0,0);step(r,180);scene.updateMatrixWorld(true);const head=r.bones.head.getWorldPosition(new T.Vector3()),camera=new T.PerspectiveCamera();
 for(const angle of [0,80,-80]){const a=angle*Math.PI/180;camera.position.set(Math.sin(a)*100,0,Math.cos(a)*100).applyMatrix4(r.bones.head.matrixWorld);camera.updateMatrixWorld(true);r.mesh.onBeforeRender(null,scene,camera);const value=r.mesh.material.userData.np.npView.value;assert(Math.abs(value-a)<.1,'profile paint misses render camera: '+angle);}
 r.dispose();
}
// Cast actual triangles from front and grazing views at each raised brow.
// A skull hit is allowed; a fringe/hair hit before it hides the expression.
report.brows=[];
for(const tier of ['low','potato'])for(const id of ['mom','dad','sister']){
 const r=w.NPCRig.create(id,{tier}),g=r.mesh.geometry,idx=g.index.array,pos=g.attributes.position,face=g.attributes.npFace,weights=g.attributes.skinIndex;
 const headBones=['head','hairL','hairR'].map(n=>w.NPCRig.BONES.indexOf(n));
 for(const angle of [0,45,-45,80,-80])for(const side of (angle?[Math.sign(angle)]:[-1,1])){
  const x=side*r.S.face.ex*r.S.head.r[0]*1.07,y=r.S.eyeY+(r.S.face.browY+.08)*r.S.head.r[1];
  const target=new T.Vector3(x,y,r.S.shape.front(x,y)),direction=new T.Vector3(Math.sin(angle*Math.PI/180),0,Math.cos(angle*Math.PI/180)),ray=new T.Ray(target.clone().addScaledVector(direction,100),direction.negate());
  let nearest=Infinity,mask=null;const hit=new T.Vector3();
  for(let n=0;n<idx.length;n+=3){const a=idx[n],b=idx[n+1],c=idx[n+2];if(!headBones.includes(weights.getX(a)))continue;const pa=new T.Vector3().fromBufferAttribute(pos,a),pb=new T.Vector3().fromBufferAttribute(pos,b),pc=new T.Vector3().fromBufferAttribute(pos,c);if(ray.intersectTriangle(pa,pb,pc,false,hit)){const distance=ray.origin.distanceTo(hit);if(distance<nearest){nearest=distance;mask=Math.max(face.getZ(a),face.getZ(b),face.getZ(c))}}}
  assert(mask!==null,id+' missing raised-brow surface');assert(mask>.002,id+'/'+tier+'/'+angle+' fringe covers near raised brow');report.brows.push({id,tier,angle,side,mask});
 }
 r.dispose();
}
fs.mkdirSync(__dirname+'/shots/models',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/r8-acting-unit.json',JSON.stringify(report,null,2));console.log('PASS 133 lines / '+report.beats.length+' source beats, joined-prefix hold, release, sound-off identity, held reading contacts, drinking, four planted wide-group pivots');
