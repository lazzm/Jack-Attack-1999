import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {withTestServer} from './perf/server.mjs';
import {wav,stats} from './sound-analysis.mjs';
const dir='/tmp/sound-round2-space';await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__space',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="icon" href="data:,"><button>Start</button>'+['/vendor/three.min.js','/js/sound.js','/js/sound-space.js'].map(src=>'<script src="'+src+'"></script>').join('')}));
 await p.addInitScript(()=>{window.spaceCosts=[];const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>raf.call(window,t=>{const start=performance.now();fn(t);if(fn.name==='soundFollow')spaceCosts.push(performance.now()-start)})});
 await p.goto(base+'/__space');await p.locator('button').click();
 await p.evaluate(async()=>{const c=Sound.unlock();await c.audioWorklet.addModule('/js/sound-test-meter.js');
  window.House={live:true,here:'a',camera:new THREE.PerspectiveCamera(),ROOMS:{a:{},b:{}},DOORS:{ab:{rooms:['a','b'],ang:0}}};window.point={x:0,y:0,z:-150};window.centered=false;window.sourceRoom='a';
  const b=c.createBuffer(2,c.sampleRate,c.sampleRate);for(let ch=0;ch<2;ch++)for(let i=0;i<b.length;i++)b.getChannelData(ch)[i]=.03*(Math.sin(2*Math.PI*(ch?330:220)*i/c.sampleRate)+Math.sin(2*Math.PI*(ch?1400:1000)*i/c.sampleRate)+Math.sin(2*Math.PI*(ch?5200:4000)*i/c.sampleRate));
  window.emitter=Sound.emitter(c,{position:()=>point,room:()=>sourceRoom,centered:()=>centered,stereo:true});window.source=c.createBufferSource();source.buffer=b;source.loop=true;source.connect(emitter.input);source.start();
  window.capture=()=>new Promise(resolve=>{const m=new AudioWorkletNode(c,'sound-meter'),z=c.createGain();z.gain.value=0;Sound.masterOutput(c).connect(m);m.connect(z);z.connect(c.destination);m.port.onmessage=e=>{Sound.masterOutput(c).disconnect(m);m.disconnect();z.disconnect();resolve({chunks:e.data,sampleRate:c.sampleRate})};m.port.postMessage({frames:Math.round(c.sampleRate*.7)})});
 });
 const results={};
 for(const name of ['same','closed','open','left','right','locked','stopped']){
  await p.evaluate(name=>{sourceRoom=['closed','open'].includes(name)?'b':'a';House.DOORS.ab.ang=name==='open'?1:0;point.x=name==='left'?-150:name==='right'?150:0;point.z=name==='left'||name==='right'?0:-150;centered=name==='locked';if(name==='stopped')emitter.stop()},name);
  await p.waitForTimeout(250);const {chunks,sampleRate}=await p.evaluate(()=>capture());const ch=[[],[]];for(const b of chunks){ch[0].push(...b[0]);ch[1].push(...b[1])}
  const cross=ch[0].reduce((s,v,i)=>s+v*ch[1][i],0),energy=ch.map(a=>a.reduce((s,v)=>s+v*v,0));results[name]={...stats(ch,sampleRate),correlation:cross/Math.sqrt(energy[0]*energy[1])};await writeFile(dir+'/'+name+'.wav',wav(ch,sampleRate));console.log('SPACE',name,JSON.stringify(results[name]));
 }
 assert(results.same.rms-results.closed.rms>2,'Shut door quieter');assert(results.open.consonants-results.closed.consonants>5,'Open aperture restores upper speech band');assert(results.open.rms>results.closed.rms+2,'Open door transmits more sound');assert(results.left.left>results.left.right+10&&results.right.right>results.right.left+10,'Device sounds have a source');assert(Math.abs(results.locked.correlation)<.1,'LOCK IN preserves native stereo');assert(Math.abs(results.same.rms-results.locked.rms)<.2,'Stereo level stays stable through LOCK IN');assert(results.stopped.peak< -100,'Stop fade reaches silence');assert.deepEqual(errors,[]);
 results.cost=await p.evaluate(()=>{const a=spaceCosts.sort((a,b)=>a-b);return{p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1),samples:a.length}});console.log('SPACE COST',JSON.stringify(results.cost));await writeFile(dir+'/measurements.json',JSON.stringify(results,null,2));
 }finally{await browser.close()}
});
