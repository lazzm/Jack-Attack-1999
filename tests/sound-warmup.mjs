// Fresh Chromium processes: compare the dry recording against the first HRTF utterance.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {withTestServer} from './perf/server.mjs';
await mkdir('/tmp/sound-round2-tests',{recursive:true});
await withTestServer(async base=>{
 const results=[];
 for(const warm of [false,true,false,true]){
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
  try{const p=await browser.newPage();
   await p.route('**/__warmup',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="icon" href="data:,"><button>Start</button>'+['/vendor/three.min.js','/js/sound.js','/js/cast.js','/js/np-lines.js','/js/st-voice.js'].map(src=>'<script src="'+src+'"></script>').join('')}));
   if(!warm)await p.route('**/js/sound.js',async r=>{let s=await readFile(new URL('../app/public/js/sound.js',import.meta.url),'utf8');s=s.replace('bus.warmHrtf = c.createPanner(); bus.warmHrtf.panningModel = \'HRTF\';','/* cold comparison: no warm-up */');await r.fulfill({contentType:'text/javascript',body:s})});
   await p.goto(base+'/__warmup');await p.locator('button').click();
   const result=await p.evaluate(async()=>{
    const c=Sound.unlock();await st.loadVoices();Cast.bind('Jack');House={camera:new THREE.PerspectiveCamera(),graphicsGet:()=>({adapt:0})};await c.audioWorklet.addModule('/js/sound-test-meter.js');
    st.prefetch('bark.dad.bed2');while(!st.voiceReady('bark.dad.bed2'))await new Promise(r=>setTimeout(r,10));
    const capture=node=>new Promise(resolve=>{const m=new AudioWorkletNode(c,'sound-meter'),z=c.createGain();z.gain.value=0;node.connect(m);m.connect(z);z.connect(c.destination);m.port.onmessage=e=>{node.disconnect(m);m.disconnect();z.disconnect();resolve(e.data.flatMap(b=>b[0]))};m.port.postMessage({frames:Math.round(c.sampleRate*1.5)})});
    const h=st.play('bark.dad.bed2',{pos:()=>({x:0,y:0,z:-100})});while(!h.started&&!h.ended)await new Promise(r=>setTimeout(r,1));
    const [dry,wet]=await Promise.all([capture(h.src),capture(h.an)]);h.stop();
    const onset=a=>a.findIndex(x=>Math.abs(x)>1e-4)/c.sampleRate;
    const rms=(a,start,end)=>Math.sqrt(a.slice(Math.round(start*c.sampleRate),Math.round(end*c.sampleRate)).reduce((s,x)=>s+x*x,0)/((end-start)*c.sampleRate));
    return{model:h.panner.panningModel,name:h.nameId,dryOnset:onset(dry),wetOnset:onset(wet),dryEarlyRms:rms(dry,0,.3),wetEarlyRms:rms(wet,0,.3),wetRms:rms(wet,0,1.5),sampleRate:c.sampleRate};
   });results.push({warm,...result});console.log('FIRST LINE',JSON.stringify(results.at(-1)));
   assert(result.model==='HRTF'&&result.name==='dad-shout/jack');
   if(warm)assert(result.wetRms>.001&&result.wetOnset-result.dryOnset<.04,'Warm first name reaches output promptly');
  }finally{await browser.close()}
 }
 await writeFile('/tmp/sound-round2-tests/warmup.json',JSON.stringify(results,null,2));
});
