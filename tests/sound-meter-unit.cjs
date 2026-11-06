const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let Meter;const messages=[];
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/public/js/sound-test-meter.js'),'utf8'),{AudioWorkletProcessor:class{constructor(){this.port={postMessage:x=>messages.push(x)}}},registerProcessor:(name,ctor)=>Meter=ctor});
const meter=new Meter(),output=[[new Float32Array(128),new Float32Array(128)]];
meter.port.onmessage({data:{frames:256}});meter.process([[]],output);meter.process([[]],output);
assert.equal(messages.length,1,'Silent input still completes the fixed audio-clock window');assert.equal(messages[0].flat(2).length,512);assert(messages[0].flat(2).every(x=>x===0));
meter.port.onmessage({data:{frames:130}});const input=[[new Float32Array(128).fill(.25),new Float32Array(128).fill(-.5)]];meter.process(input,output);meter.process(input,output);assert.equal(messages[1][1][0].length,2);assert.equal(messages[1][0][0][0],.25);assert.equal(messages[1][0][1][0],-.5);assert(output[0].every(ch=>ch.every(x=>x===0)),'Observer never adds audible output');
console.log('SOUND METER UNIT PASS: disconnected/muted silence, exact frame count, stereo capture, zero observer output');

meter.port.onmessage({data:{frames:128,ready:true}});assert.equal(messages[2].ready,true,'Audio thread acknowledges armed capture before a short sound starts');meter.process(input,output);assert.equal(messages[3][0][0].length,128);
