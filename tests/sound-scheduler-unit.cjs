// A stalled renderer must neither replay expired beats nor shift the tempo grid.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let timer,starts=[],nodes=[];
class Param{constructor(v=1){this.value=v}setValueAtTime(v){this.value=v}setTargetAtTime(v){this.value=v}cancelScheduledValues(){}linearRampToValueAtTime(v){this.value=v}exponentialRampToValueAtTime(v){this.value=v}}
class Node{constructor(c){this.c=c;this.gain=new Param();this.frequency=new Param();this.Q=new Param();nodes.push(this)}connect(){}disconnect(){this.disconnected=true}start(t){starts.push(t)}stop(){}}
class Context{constructor(){this.currentTime=0;this.state='running';this.destination={};this.sampleRate=1000}createGain(){return new Node(this)}createOscillator(){return new Node(this)}createBufferSource(){return new Node(this)}createBiquadFilter(){return new Node(this)}createBuffer(){return{getChannelData:()=>new Float32Array(1000)}}createWaveShaper(){return new Node(this)}createDynamicsCompressor(){const n=new Node(this);for(const k of ['threshold','knee','ratio','attack','release'])n[k]=new Param();return n}}
const w={AudioContext:Context,navigator:{userActivation:{hasBeenActive:true},hardwareConcurrency:4},localStorage:{getItem:()=>null,setItem(){}},document:{addEventListener(){},removeEventListener(){},dispatchEvent(){}},Event:class{},setInterval:f=>(timer=f,1),clearInterval(){},setTimeout:f=>f()};w.window=w;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/public/js/sound.js'),'utf8'),w);
w.Sound.music.play('theme');const c=w.Sound.ctx;
for(const t of [3,600]){c.currentTime=t;starts=[];timer();assert(starts.length>0&&starts.length<50,'Bounded work after a stall');assert(starts.every(at=>at>=t+.019&&at<t+2.001),'Only live/future notes');assert(starts.every(at=>Math.abs((at-.05)/.16-Math.round((at-.05)/.16))<1e-7),'Original tempo phase preserved')}
w.Sound.music.stop();assert(nodes.some(n=>n.disconnected&&n.gain.value===0),'Queued music fades out and disconnects on stop');
console.log('SCHEDULER UNIT PASS: 3 s and 10 min stalls, no dead notes/bursts, original tempo, bounded work, queued-note stop fade');

// Exercise the actual console scheduler callback as well as the shared player.
const consoleCode=fs.readFileSync(path.join(__dirname,'../app/public/js/rm-tv.js'),'utf8');
const begin=consoleCode.indexOf('    mus.timer = setInterval(() => {'),end=consoleCode.indexOf('    }, 50);',begin)+'    }, 50);'.length;
let consoleTimer,consoleStarts=[];const clock={currentTime:0},mus={song:{bpm:120,lead:[60,62,64,65],bass:[48,50,52,53]},next:0,step:0};
vm.runInNewContext(consoleCode.slice(begin,end),{mus,ac:()=>clock,setInterval:f=>(consoleTimer=f,1),mtof:n=>n,sfx:{tone:(f,d,type,vol,when)=>consoleStarts.push(clock.currentTime+when),noise:(d,v,f,when)=>consoleStarts.push(clock.currentTime+when)}});
consoleTimer();for(const t of [3.07,600.031]){clock.currentTime=t;consoleStarts=[];consoleTimer();assert(consoleStarts.length>0&&consoleStarts.length<80);assert(consoleStarts.every(at=>at>=t+.019&&at<t+2.001));assert(consoleStarts.every(at=>Math.abs((at-.05)/.125-Math.round((at-.05)/.125))<1e-7),'Console tempo is anchored, not reset after a stall')}
console.log('CONSOLE SCHEDULER UNIT PASS: late timers preserve tempo and skip expired steps');
