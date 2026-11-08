'use strict';
// Real production r128 rig and shader uniforms, deterministic speech clock.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require('../app/public/vendor/three.min.js');
let clock=0,seed=1999;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const gradient={addColorStop(){}},paint=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
const w={THREE:T,document:{createElement:()=>({getContext:()=>paint})},performance:{now:()=>clock},Math:math,console};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8'),w);
const step=(r,n=1,near=true)=>{for(let i=0;i<n;i++){clock+=1000/60;r.update(1/60,near)}};
const report={people:{}};
for(const id of ['mom','dad','sister']){
 const r=w.NPCRig.create(id,{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);step(r,120);const U=r.mesh.material.userData.np,atlas=r.mesh.material.map.image;
 assert.equal(atlas.width,512);assert.equal(atlas.height,512);let draws=0;r.group.traverse(o=>{if(o.isSkinnedMesh)draws++});assert.equal(draws,2);assert(r.tris+6<=3000);
 const voice={started:true,ended:false,level:()=>.8,progress:()=>.5};const shapes={};
 for(const text of ['mmm','aaa','eee','ooo','fff','sss']){r.talk(8000,text,voice);step(r,20);shapes[text]=r.face.mouth;}
 assert.equal(new Set(Object.values(shapes)).size,6,id+' six required mouth classes are not distinct');
 r.talk(8000,'aaa',voice);step(r,12);const high=U.npJaw.value;voice.level=()=>.25;step(r,12);assert.equal(r.face.mouth,shapes.aaa,'aperture changes must not depend on frame swapping');assert(U.npJaw.value<high-.1,'same viseme has no continuous aperture');
 const outgoingJaw=U.npJaw.value;voice.level=()=>0;for(let n=0;n<20&&r.face.mouth!==0;n++)step(r);assert.equal(r.face.mouth,0,'silent clip mouth not relaxed');assert(U.npMouthPrevJaw.value<=outgoingJaw+.001,'outgoing mouth reopens during the rest blend');step(r,20);
 voice.started=false;voice.level=()=>1;r.talk(8000,'aaa',voice);step(r,20);assert.equal(r.face.mouth,0,'pending recording uses fake mouth movement');
 voice.started=true;voice.ended=false;step(r,20);assert.notEqual(r.face.mouth,0);voice.ended=true;step(r,25);assert.equal(r.face.mouth,0,'ended recording mouth remains open');
 let reads=0;voice.ended=false;voice.level=()=>{reads++;return .8};r.talk(8000,'aaa',voice);step(r,30,false);assert.equal(reads,0,'far face samples audio');r.hush();step(r,20);
 // Closed comma in the text-only path, then resumed speech. No phoneme API.
 r.talk(4000,'aaa, aaa');r.st.talkStart=clock-1800;r.st.talkUntil=clock+2200;step(r,4);assert.equal(r.face.mouth,0,'text comma does not close the mouth');r.st.talkStart=clock-3000;step(r,20);assert.notEqual(r.face.mouth,0,'text-only speech does not resume after comma');
 const moods={};for(const [mood,text]of Object.entries({happy:'Thank you, brilliant!',cross:'Stop making that mess.',tired:'I feel tired.',cheeky:'Only joking!',sad:'Oh dear, I am sorry.'})){
  r.talk(8000,text,{started:true,ended:false,level:()=>0,progress:()=>.3});step(r,45);assert.equal(r.st.mood,mood,'text cue '+mood);moods[mood]={act:U.npAct.value.toArray(),eyes:U.npLid.value,brow:U.npBrow.value};
 }
 assert(moods.happy.eyes<moods.cross.eyes,'smile does not reach eyes');assert(moods.sad.act[0]<moods.cross.act[0],'sad/cross brow slopes indistinguishable');assert(moods.tired.eyes<.9,'tired has no softened lids');assert(Math.abs(moods.cheeky.act[2])>.005,'cheeky has no bounded asymmetry');
 r.talk(8000,"Don't worry, we can try again.");assert.equal(r.st.mood,'neutral','reassurance reads as a scolding');r.talk(8000,'Do not touch the hot pan.');assert.equal(r.st.mood,'cross','firm direction loses its cue');
 r.talk(8000,'Thank you!',null,'sad');step(r,20);assert.equal(r.st.mood,'sad','explicit direction loses to inferred cue');r.hush();step(r,120);assert(Math.abs(U.npAct.value.x)<.002,'old expression leaks after hush');
 // Voice pause produces one motivated blink; it must not repeat every frame.
 let energy=.8;const paused={started:true,ended:false,level:()=>energy,progress:()=>.4};r.talk(8000,'Well, let me think.',paused);r.st.blinkAt=Infinity;step(r,40);energy=0;let shuts=0,prior=false;for(let i=0;i<60;i++){step(r);const shut=r.face.eye===2;if(shut&&!prior)shuts++;prior=shut;}assert.equal(shuts,1,'pause blink missing or repeatedly retriggered');
 report.people[id]={shapes,moods,draws,triangles:r.tris+6,atlas:[atlas.width,atlas.height],pauseBlinks:shuts};r.dispose();
}
// Listener smiles after a joke, never opens their mouth, then releases it.
const speaker=w.NPCRig.create('mom',{tier:'low'}),listener=w.NPCRig.create('dad',{tier:'low'});let progress=0;
speaker.talk(8000,'Only joking! That is our little secret.',{started:true,ended:false,level:()=>.7,progress:()=>progress});listener.set({listen:speaker});let smile=0;
for(let n=0;n<360;n++){progress=n/400;step(speaker);step(listener);smile=Math.max(smile,listener.mesh.material.userData.np.npAct.value.y);assert.equal(listener.face.mouth,0,'listener talks over the speaker');}
assert(smile>.04,'listener never smiles at joke');listener.set({listen:null});step(listener,180);assert(Math.abs(listener.mesh.material.userData.np.npAct.value.y)<.002);speaker.dispose();listener.dispose();
// A final punchline must be heard first; the reaction survives the turn ending.
const teller=w.NPCRig.create('mom',{tier:'low'}),audience=w.NPCRig.create('dad',{tier:'low'});let jokeProgress=.7;
teller.talk(12000,'A cup in a minute. I am letting the kettle think it is retired.',{started:true,ended:false,level:()=>.7,progress:()=>jokeProgress});audience.set({listen:teller});step(audience,45);assert(audience.mesh.material.userData.np.npAct.value.y<.005,'listener smiles before the punchline');jokeProgress=.98;step(audience);audience.set({listen:null});step(audience,35);assert(audience.mesh.material.userData.np.npAct.value.y>.04,'listener loses their delayed reaction at the turn boundary');step(audience,120);assert(audience.mesh.material.userData.np.npAct.value.y<.002,'listener smile never releases');teller.dispose();audience.dispose();
fs.mkdirSync(__dirname+'/shots/models',{recursive:true});fs.writeFileSync(__dirname+'/shots/models/r6-faces-unit.json',JSON.stringify(report,null,2));console.log('PASS six visemes, continuous aperture, silence/loading/end, punctuation, mood/lid/brow layers, pause blink, listener and budgets');
// Compare shared-random consumption every frame against the actual base rig.
function randomCadence(source){let t=0,s=1999,calls=0;const m=Object.create(Math);m.random=()=>{calls++;return(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;};const c={THREE:T,document:w.document,performance:{now:()=>t},Math:m,console};c.window=c;vm.createContext(c);vm.runInContext(source,c);const r=c.NPCRig.create('mom',{tier:'low'});r.floor=()=>0;r.teleport(0,0,0,0);r.set({engage:true,look:{x:0,y:-143,z:90}});const v={started:true,ended:false,dur:12,level:()=>t%2000<800?.8:0,progress:()=>t/12000};r.talk(12000,'Hmm, let me think. Only joking! Shall we try again?',v);const trace=[];for(let i=0;i<1000;i++){t+=1000/60;v.ended=t>=12000;r.update(1/60,true);trace.push(calls);}r.dispose();return trace;}
const baseRig=require('node:child_process').execFileSync('git',['show','HEAD:app/public/js/np-rig.js'],{cwd:__dirname,encoding:'utf8'});
assert.deepEqual(randomCadence(fs.readFileSync(require.resolve('../app/public/js/np-rig.js'),'utf8')),randomCadence(baseRig),'facial timing perturbs shared randomness');
console.log('PASS baseline shared-random cadence through thinking, speech pauses and ended voice');
