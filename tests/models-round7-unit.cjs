'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),T=require('../app/public/vendor/three.min.js');
const read=n=>fs.readFileSync(require.resolve('../app/public/js/'+n),'utf8'),pack=require('../app/public/audio/voice-phonemes.json');
const paint=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}}),ctx={THREE:T,document:{createElement:()=>({getContext:()=>paint})},console,performance:{now:()=>0}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('np-rig.js'),ctx);
for(const tier of ['low','std']){
 const r=ctx.NPCRig.create('mom',{tier}),m=r.mesh.material,shader={uniforms:{},vertexShader:T.ShaderLib[tier==='low'?'lambert':'phong'].vertexShader,fragmentShader:T.ShaderLib[tier==='low'?'lambert':'phong'].fragmentShader};m.onBeforeCompile(shader);
 assert(shader.fragmentShader.includes('max(outgoingLight, diffuseColor.rgb * vec3(0.36'),'r128 face fill was not injected');assert(shader.fragmentShader.includes('clamp(vNpFace.z, 0.0, 1.0)'),'fill must use face mask');
 assert(r.tris+6<=3000||tier==='std');assert.equal(r.mesh.material.userData.np.npMouth.value.z,.175);r.dispose();
}
{
 let clock=0;ctx.performance.now=()=>clock;
 const speaker=ctx.NPCRig.create('mom',{tier:'low'}),listener=ctx.NPCRig.create('dad',{tier:'low'}),v={started:true,ended:false,level:()=>.7,progress:()=>.2};
 speaker.talk(5000,'I think the kettle is retired.',v);listener.set({listen:speaker});listener.update(1/60,true);
 clock=7000;v.ended=true;speaker.hush();for(let i=0;i<40;i++){clock+=1000/60;listener.update(1/60,true)}
 assert(listener.mesh.material.userData.np.npAct.value.y>.04,'a slow final frame loses a heard punchline');speaker.dispose();listener.dispose();
 const cancelled=ctx.NPCRig.create('mom',{tier:'low'});cancelled.talk(5000,'Only joking!',{started:true,ended:true,cancelled:true,level:()=>0,progress:()=>1});cancelled.hush();assert.equal(cancelled.st.heardEnd,null,'cancelled speech invents a heard ending');cancelled.dispose();ctx.performance.now=()=>0;
}
assert.equal(Object.keys(pack.lines).length,40);let contacts=0;
for(const [id,t]of Object.entries(pack.lines)){
 assert(t.cues.length>2);let last=-1;for(const [time,shape]of t.cues){assert(time>=last&&time>=0&&time<=t.dur+.01,id+' cue clock');assert(Number.isInteger(shape)&&shape>=-1&&shape<=6,id+' shape');if(shape===5||shape===6)contacts++;last=time;}
 const file=__dirname+'/../app/public/audio/voice/'+t.file;if(fs.existsSync(file))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),t.sha256,id+' recording changed');
 for(const t0 of t.phrases)assert(t0>=0&&t0<=t.dur+.01);if(t.beats?.joke)assert(t.beats.joke<=t.dur+.01);
}
// Real parent function, with nested room footprints. Check both floor tags and
// a cupboard occupant, so fixing the flight cannot lift the room below it.
const life=read('np-life.js'),start=life.indexOf('  function placeRig(c) {'),end=life.indexOf('\n  function spawn(',start),H={LV:{U:73,G:353},ROOMS:{},buildRoom(){}};
for(const id of ['hall','landing','cupboard'])H.ROOMS[id]={id,group:{name:id,add(g){g.parent=this}}};
const n={onFlight:(x,z)=>x>330&&x<410&&z>=250&&z<=600,ramp:z=>73+(z-250)*.8};
const place=new Function('H','NV','roomAt','hideAll',life.slice(start,end)+';return placeRig;')(H,n,(x,z,lvl)=>lvl==='U'?H.ROOMS.landing:H.ROOMS.cupboard,false);
for(const lvl of ['U','G'])for(const z of [420,425,435]){const c={x:371.5,z,lvl,room:null,present:true,h:0,v:0,rig:{group:{},root(x,y){this.y=y}}};place(c);assert.equal(c.rig.group.parent.name,'hall');assert.equal(c.room,lvl==='U'?'landing':'hall','render ancestry changed dialogue room');assert.equal(c.rig.y,n.ramp(z));}
const under={x:371.5,z:350,lvl:'G',room:null,present:true,h:0,v:0,rig:{group:{},root(x,y){this.y=y}}};place(under);assert.equal(under.room,'cupboard');assert.equal(under.rig.y,353);
{
 const declaration=life.match(/  const visible = c =>[^\n]+/)[0];const on=new Function('H',declaration+';return visible;')({ROOMS:{landing:{group:{visible:false}}}}),c={present:true,room:'landing',rig:{group:{parent:{visible:true}}}};assert(on(c),'visible shared flight is advanced on the off-screen timer');c.rig.group.parent.visible=false;assert.equal(on(c),false);c.rig.group.parent=null;assert.equal(on(c),false);
}
{
 const doorway={LV:H.LV,ROOMS:{},buildRoom(){}};for(const [id,area]of [['bedroom',[[0,0,245,220]]],['landing',[[250,130,410,700]]]])doorway.ROOMS[id]={id,lvl:'U',area,group:{name:id,add(g){g.parent=this}}};
 const at=new Function('H','NV','roomAt','hideAll',life.slice(start,end)+';return placeRig;')(doorway,n,()=>null,false),c={x:248.5,z:197,lvl:'U',room:null,present:true,h:0,v:0,rig:{group:{},root(){}}};at(c);assert.equal(c.room,'landing');assert.equal(c.rig.group.parent.name,'landing','door reveal retains an unrelated hidden room');
}
{
 const a=life.indexOf('  function dialogueHeld(c) {'),b=life.indexOf('  function tick(',a),c={goal:null,hold:0,talking:true},speech={cur:{c,lineId:'house.voice.welcome',talk:false}};
 const held=new Function('nowMs','speech',life.slice(a,b)+';return dialogueHeld;')(()=>5000,speech);assert.equal(held(c),false,'a finished avoidance holds an empty goal for the duration of an ambient line');c.hold=99;assert.equal(held(c),true,'explicit conversation must retain its hold');c.hold=0;c.goal={key:'debug.phone'};assert.equal(held(c),true,'ordinary scripted pose hold was lost');
}
// Run actual portal traversal with the short-distance rung. A bedroom door
// reveals the landing; the open flight must still reveal its hall parent.
const world=read('hs-world.js'),va=world.indexOf('  function visCalc() {'),vb=world.indexOf('  // Each room owns',va),vis=world.slice(va,vb);
for(const open of [true,false]){
 const rooms=Object.fromEntries(['bedroom','landing','hall','kitchen'].map(id=>[id,{id,links:[],group:{visible:false}}])),doors={bedroom:{rooms:['bedroom','landing'],open,ang:open?1:0},stairs:{rooms:['landing','hall'],always:true}};
 for(const [id,d]of Object.entries(doors))for(const r of d.rooms)rooms[r].links.push(id);
 const run=new Function('ROOMS','DOORS','cur','rung','buildRoom','lightsFor','dirty','T','let visSet,vegetationRoutes;'+vis+';visCalc();return visSet;');
 const seen=run(rooms,doors,rooms.bedroom,()=>({far:1}),()=>{},()=>{},()=>{},T);
 assert.equal(seen.has('hall'),open,'short-distance stair parent culled through bedroom door');assert.equal(rooms.hall.group.visible,open);assert.equal(rooms.landing.group.visible,open);
}
// A slow visible frame may arrive long after the audio ended. Start the
// listening hold on that observed transition, not on the last spoken frame.
{
 let clock=0;const speaker={id:'mom',present:true,room:'hall',lvl:'G',x:90,z:0,rig:{eyeWorld:v=>v.set(90,200,0)}},listener={id:'dad',present:true,room:'hall',lvl:'G',x:0,z:0,h:0,hold:0,rig:{set(o){this.state=o}}},speech={cur:{c:speaker}},H={P:{x:0,y:210,z:150}};
 const a=life.indexOf('  function looks(c) {'),b=life.indexOf('\n  // ================================================================ the loop',a);
 const context={window:{},T,H,speech,nowMs:()=>clock,player:()=>({...H.P,lvl:'G'}),sameFloor:(x,y)=>x.lvl===y.lvl,dist:(x,y)=>Math.hypot(x.x-y.x,x.z-y.z),angd:(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),eyes:()=>H.P,D2R:Math.PI/180,displaySpeaking:()=>false,Math};
 vm.createContext(context);vm.runInContext(life.slice(a,b)+';this.run=looks;',context);context.run(listener);assert.equal(listener.rig.state.listen,speaker.rig);
 clock=4000;speech.cur=null;context.run(listener);assert.equal(listener.rig.state.listen,speaker.rig,'slow end frame discarded the listening hold');clock=4600;context.run(listener);assert.equal(listener.rig.state.listen,speaker.rig);clock=4900;context.run(listener);assert.equal(listener.rig.state.listen,null,'listening hold never releases');
}
// Actual voice handle, source clock and joined-name offset, without a browser.
class Node {constructor(){this.gain={value:1};}connect(){return this;}start(){}stop(){this.onended?.();}}
async function voiceWorld(named=false,stale=false){
 const id='c1.dad.boot',t=pack.lines[id],node=()=>new Node(),audio={state:'running',sampleRate:16000,currentTime:0,createGain:node,createAnalyser:()=>Object.assign(node(),{fftSize:512}),createBufferSource:node,createBuffer(ch,len,sr){const d=Array.from({length:ch},()=>new Float32Array(len));return{numberOfChannels:ch,length:len,sampleRate:sr,duration:len/sr,getChannelData:i=>d[i]};},decodeAudioData(bytes,ok){const duration=bytes.byteLength===8?.35:t.dur+(stale?.1:0),buf=this.createBuffer(1,Math.round(duration*16000),16000);ok(buf);return Promise.resolve(buf);}};
 const w={console,performance:{now:()=>0},document:{currentScript:{src:''},addEventListener(){}},localStorage:{getItem:()=>null},requestIdleCallback(){},requestAnimationFrame:()=>1,setInterval:()=>1,setTimeout:()=>1,clearTimeout(){},Sound:{voicesOn:true,unlock:()=>audio,output:node,duck(){}},Cast:{me:()=>({first:'Jack'})},NPCLines:{[id]:['dad','Pop the boot, go on.',null,named?'dad-shout':null]},fetch:async url=>({ok:true,json:async()=>url.includes('voice-phonemes')?pack:url.includes('names/')?{'dad-shout':{jack:{file:'dad-shout/jack.mp3',dur:.35}}}:{[id]:{file:t.file,dur:t.dur}},arrayBuffer:async()=>new ArrayBuffer(url.includes('names/')?8:16)})};w.window=w;vm.createContext(w);vm.runInContext(read('st-voice.js'),w);await w.st.loadVoices();const h=w.st.play(id,{});for(let i=0;i<8;i++)await new Promise(setImmediate);assert(h.started);
 assert.equal(h.phoneme(),null,'scheduled audio must remain still');
 const offset=named?.45:0;
 if(named){audio.currentTime=h.t0+.2;assert.equal(h.phoneme(),null,'base markers applied to first name');}
 for(let i=0;i<t.cues.length-1;i++){const [time,shape]=t.cues[i],end=t.cues[i+1][0];if(end-time<.018)continue;audio.currentTime=h.t0+offset+time+.003;assert.equal(h.phoneme(),stale?null:shape<0?null:shape,'source cue '+time);}
 audio.state='suspended';assert.equal(h.phoneme(),null);audio.state='running';h.stop();assert.equal(h.phoneme(),null);
}
(async()=>{await voiceWorld();await voiceWorld(true);await voiceWorld(false,true);console.log('PASS r7: real r128 fill hooks, 40 source-qualified cue tracks, '+contacts+' contact runs, stair/cupboard ancestry, joined-name/source-clock/suspend/stop/stale timing');})().catch(e=>{console.error(e);process.exitCode=1});
