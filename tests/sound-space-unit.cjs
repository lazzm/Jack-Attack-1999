const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const T=require('../app/public/vendor/three.min.js');
let now=0,id=0,frames=new Map(),timers=[];
class Param{constructor(v=1){this.value=v;this.events=[]}setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t])}setTargetAtTime(v,t,k){this.value=v;this.events.push(['target',v,t,k])}cancelScheduledValues(){}}
class Node{constructor(){for(const k of ['gain','frequency','Q','positionX','positionY','positionZ'])this[k]=new Param();this.connections=[]}connect(n){this.connections.push(n)}disconnect(){this.connections=[]}}
const ctx={state:'running',currentTime:2,listener:{},createGain:()=>new Node(),createPanner:()=>new Node(),createBiquadFilter:()=>new Node()};
for(const k of ['position','forward','up'])for(const a of ['X','Y','Z'])ctx.listener[k+a]=new Param(0);
const bus=new Node(),camera=new T.PerspectiveCamera();
const H={live:true,here:'a',camera,DOORS:{ab:{rooms:['a','b'],ang:0},bc:{rooms:['b','c'],ang:0},ac:{rooms:['a','c'],ang:0}},ROOMS:{a:{},b:{},c:{}}};
const w={THREE:T,Sound:{output:()=>bus},House:H,performance:{now:()=>now},requestAnimationFrame:f=>{frames.set(++id,f);return id},setTimeout:f=>timers.push(f),localStorage:{setItem(){throw Error('Audio must not write saves')}}};w.window=w;
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/sound-space.js'),'utf8'),w);
const S=w.Sound,check=()=>{now+=200;const pending=[...frames.values()];frames.clear();for(const f of pending)f(now)};
assert.equal(S.occlusion('a','a'),0);assert(Math.abs(S.occlusion('a','b')-.9)<1e-9);
H.DOORS.ab.ang=1;now+=200;assert.equal(S.occlusion('a','b'),.18);
H.DOORS.bc.ang=1;now+=200;assert.equal(S.occlusion('a','c'),.36,'Use the open two-door path rather than the shut shortcut');
H.DOORS.ab.ang=.5;now+=200;assert(Math.abs(S.occlusion('a','b')-.54)<1e-9,'Partially open leaf');
H.DOORS.ab.always=true;now+=200;assert.equal(S.occlusion('a','b'),.08,'Stair connection');
let pos={x:100,y:20,z:-100},centered=false,level=1;
const h=S.emitter(ctx,{position:()=>pos,room:'a',centered:()=>centered,level:()=>level});
assert.equal(h.panner.panningModel,'equalpower');assert.equal(h.panner.positionX.value,100);assert.equal(h.direct.gain.value,0);assert.equal(h.spatial.gain.value,Math.SQRT2);assert.equal(h.wall.frequency.value,18000);
pos.x=-100;camera.rotation.y=Math.PI/2;check();assert.equal(h.panner.positionX.value,-100);assert(ctx.listener.forwardX.value<-.99,'Listener turns with the player');
centered=true;check();assert.equal(h.direct.gain.value,1);assert.equal(h.spatial.gain.value,0,'LOCK IN keeps native stereo');
level=0;check();assert.equal(h.input.gain.value,0,'Existing device mute');
h.stop();assert(h.input.gain.events.some(e=>e[0]==='target'&&e[1]===0&&e[3]===.012),'Fade before disconnect');check();assert.equal(frames.size,0,'No idle animation loop');for(const f of timers)f();assert.equal(h.input.connections.length,0);
const stereo=S.emitter(ctx,{position:()=>pos,room:'a',stereo:true});assert.equal(stereo.spatial.gain.value,1,'Stereo centre needs no mono compensation');stereo.stop();check();
console.log('SPATIAL SOUND UNIT PASS: real door graph, partial/open/shut/stairs/alternative path, source and listener tracking, LOCK IN direct stereo, mute, stop fade, cleanup, no save writes');
