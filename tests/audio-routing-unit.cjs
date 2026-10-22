const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/sound.js'),'utf8');
const storage=new Map([['jhp_sfx','1']]),events=[];
class Param{constructor(v=1){this.value=v}setValueAtTime(v){this.value=v}linearRampToValueAtTime(v){this.value=v}exponentialRampToValueAtTime(v){this.value=v}setTargetAtTime(v){this.value=v}cancelScheduledValues(){}}
class Node{constructor(){this.gain=new Param();this.frequency=new Param();this.connections=[]}connect(n){this.connections.push(n)}start(){}stop(){}}
class Context{constructor(){this.destination={};this.state='running';this.currentTime=0;this.sampleRate=1000}createGain(){return new Node()}createOscillator(){return new Node()}createBuffer(){return{getChannelData:()=>new Float32Array(1000)}}createBufferSource(){return new Node()}createBiquadFilter(){return new Node()}resume(){}}
const context={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{dispatchEvent:e=>events.push(e.type),addEventListener(){},removeEventListener(){}},Event:class{constructor(type){this.type=type}},setInterval:()=>1,clearInterval(){}};
context.window=context;context.AudioContext=Context;context.speechSynthesis={cancel(){},speak(){}};
vm.runInNewContext(code,context);const S=context.Sound;
assert.equal(S.effectsOn,true);assert.equal(S.musicOn,true);
const a=new Context(),b=new Context(),am=S.output(a,'music'),ae=S.output(a),bm=S.output(b,'music');
assert.equal(am,S.output(a,'music'));assert.equal(am.connections[0],a.destination);
S.musicOn=false;assert.equal(am.gain.value,0);assert.equal(bm.gain.value,0);assert.equal(ae.gain.value,1);assert(S.on);
S.effectsOn=false;assert.equal(S.on,false);assert.equal(ae.gain.value,0);
S.musicOn=true;assert.equal(am.gain.value,1);assert.equal(ae.gain.value,0);
S.setVolume(.4);assert.equal(am.gain.value,.4);assert.equal(bm.gain.value,.4);assert.equal(ae.gain.value,0);
S.setVolume(NaN);assert.equal(S.volume,.4);S.setVolume(10);assert.equal(S.volume,1);
S.on=false;assert.equal(am.gain.value,0);S.on=true;assert.equal(am.gain.value,1);assert.equal(ae.gain.value,1);
assert(events.includes('audiochange')&&events.includes('sfxchange'));
S.musicOn=false;vm.runInNewContext(code,context);assert.equal(context.Sound.musicOn,false);assert.equal(context.Sound.effectsOn,true);
for(const file of fs.readdirSync(require('node:path').join(__dirname,'../app/public/js'))){
 if(!file.endsWith('.js')||file==='sound.js')continue;
 const source=fs.readFileSync(require('node:path').join(__dirname,'../app/public/js',file),'utf8');
 assert(!/\.connect\((?:c|ac|AC|actx)\.destination\)/.test(source),file+' bypasses global audio routing');
 assert(!/speechSynthesis\.speak\(u\)/.test(source),file+' bypasses global speech settings');
}
console.log('AUDIO ROUTING UNIT PASS: legacy migration, independent/cross-context buses, volume/clamping, legacy master, events, persistence, no known raw destination/speech bypasses');
