// The physical-world bus must pause without muting PC/menu music or UI effects.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const storage=new Map([['jhp_audio_effects','1'],['jhp_audio_music','1']]),nodes=[];
class Param{constructor(v=1){this.value=v}setValueAtTime(v){this.value=v}exponentialRampToValueAtTime(v){this.value=v}setTargetAtTime(v){this.value=v}cancelScheduledValues(){}}
class Node{constructor(kind){this.kind=kind;this.gain=new Param();this.frequency=new Param();this.Q=new Param();this.connections=[];nodes.push(this)}connect(n){assert(n,'Missing audio bus');this.connections.push(n)}start(){this.started=true}stop(){this.stopped=true}}
class Context{constructor(){this.destination={};this.state='running';this.currentTime=20;this.sampleRate=1000}createGain(){return new Node('gain')}createOscillator(){return new Node('oscillator')}createBuffer(){return{getChannelData:()=>new Float32Array(1000)}}createBufferSource(){return new Node('noise')}createBiquadFilter(){return new Node('filter')}resume(){}}
const c={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{hidden:false,dispatchEvent(){},addEventListener(){},removeEventListener(){}},Event:class{},setInterval:()=>1,clearInterval(){},AudioContext:Context};c.window=c;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/public/js/sound.js'),'utf8'),c);const S=c.Sound;
const started=()=>nodes.filter(n=>n.started).length;
for(const surface of ['carpet','lino','tile','stairs','paving','grass']){const old=started();S.world('step',{surface});assert(started()>old,surface+' silent')}
for(const weight of ['light','medium','heavy'])for(const put of [false,true]){const old=started();S.world('handle',{weight,put});assert(started()>old,weight+' handling silent')}
for(const kind of ['door','drawer','switch','kettle','clock','road','bird']){const old=started();S.world(kind,{open:false});assert(started()>old,kind+' silent')}
const worldBus=nodes.find(n=>n.kind==='oscillator').connections[0].connections[0];assert.equal(worldBus.gain.value,.25);
S.worldPause(true);assert.equal(worldBus.gain.value,0);let n=started();S.world('door');assert.equal(started(),n);S.play('click');assert(started()>n,'UI muted by world pause');
S.worldPause(false);assert.equal(worldBus.gain.value,.25);n=started();S.world('step');assert(started()>n);
for(const gate of ['effects','volume','hidden']){if(gate==='effects')S.effectsOn=false;if(gate==='volume')S.setVolume(0);if(gate==='hidden')c.document.hidden=true;n=started();S.world('bird');assert.equal(started(),n,gate+' did not gate world audio');S.effectsOn=true;S.setVolume(1);c.document.hidden=false}
const bus=S.output(S.unlock());S.setVolume(.3);assert.equal(bus.gain.value,.3);S.effectsOn=false;assert.equal(bus.gain.value,0);assert(S.musicOn,'Effects changed music');
console.log('WORLD SOUND PASS: six surfaces, three weights, physical actions, independent pause bus, UI during pause, settings and hidden-tab gates');
