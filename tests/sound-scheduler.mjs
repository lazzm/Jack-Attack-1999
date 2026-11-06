// Audio-thread measurements under delayed main-thread music timers.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {withTestServer} from './perf/server.mjs';
const before=process.argv.includes('before');
await mkdir('/tmp/sound-round2-tests',{recursive:true});
await withTestServer(async base=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__scheduler',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="icon" href="data:,"><button>Start</button><script src="/js/sound.js"></script>'}));
 if(before)await p.route('**/js/sound.js',async r=>r.fulfill({contentType:'text/javascript',body:await readFile('/tmp/sound-round2-baseline/sound.js','utf8')}));
 await p.addInitScript(()=>{const original=setInterval;window.setInterval=(f,ms,...args)=>original(f,ms===60?650:ms,...args);window.starts=[];const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(at){starts.push({at,now:this.context.currentTime});return start.call(this,at)}});
 await p.goto(base+'/__scheduler');await p.locator('button').click();
 const proof=await p.evaluate(async()=>{
  Sound.musicOn=true;Sound.effectsOn=false;Sound.setVolume(1);const c=Sound.unlock();await c.audioWorklet.addModule('/js/sound-test-meter.js');
  const m=new AudioWorkletNode(c,'sound-meter'),silent=c.createGain();silent.gain.value=0;Sound.output(c,'music').connect(m);m.connect(silent);silent.connect(c.destination);
  const data=new Promise(resolve=>m.port.onmessage=e=>resolve(e.data));m.port.postMessage({frames:c.sampleRate*5});Sound.music.play('theme');
  const chunks=await data;Sound.music.stop();let peak=0,total=0,n=0,active=0;
  for(const [a]of chunks){let sum=0;for(const x of a){sum+=x*x;peak=Math.max(peak,Math.abs(x));total+=x*x;n++}if(Math.sqrt(sum/a.length)>.001)active++}
  return{peak,rms:Math.sqrt(total/n),activeFraction:active/chunks.length,expired:starts.filter(n=>n.at<n.now-.005).length,notes:starts.length,starts};
 });
 console.log('SCHEDULER',JSON.stringify(proof));await writeFile('/tmp/sound-round2-tests/scheduler-'+(before?'before':'after')+'.json',JSON.stringify(proof,null,2));
 if(!before){assert.equal(proof.expired,0,'No expired notes scheduled');assert(proof.peak>.01&&proof.activeFraction>.7,'Sustained audible music despite 650 ms timer cadence')}
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
