// Production graph, real Chromium audio thread. No generated speech or clip writes.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {withTestServer} from './perf/server.mjs';
const tag=process.argv[2]||'after',baseline=tag==='before',dir='/tmp/sound-'+tag;
await mkdir(dir,{recursive:true});
function wav(ch,sr){const n=ch[0].length,b=Buffer.alloc(44+n*8);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(3,20);b.writeUInt16LE(2,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*8,28);b.writeUInt16LE(8,32);b.writeUInt16LE(32,34);b.write('data',36);b.writeUInt32LE(n*8,40);for(let j=0;j<n;j++)for(let i=0;i<2;i++)b.writeFloatLE(ch[i][j],44+(j*2+i)*4);return b}
function stats(ch,sampleRate){
 const db=x=>20*Math.log10(Math.max(1e-9,x));
 const rms=ch.map(a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length));
 // A real 2.5 kHz high-pass measurement, rather than just overall RMS:
 // the consonant band changes when the head faces away even for a bass voice.
 const w=2*Math.PI*2500/sampleRate,cs=Math.cos(w),alpha=Math.sin(w)/Math.SQRT2,a0=1+alpha;
 const b0=(1+cs)/2/a0,b1=-(1+cs)/a0,b2=b0,a1=-2*cs/a0,a2=(1-alpha)/a0;
 let peak=0,clip=0,high=0,energy=0,mono=0,band=0;
 for(let i=0;i<ch[0].length;i++)mono+=((ch[0][i]+ch[1][i])/2)**2;
 for(const a of ch){let x1=0,x2=0,y1=0,y2=0;for(let i=0;i<a.length;i++){
  const x=a[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;
  peak=Math.max(peak,Math.abs(x));clip+=Math.abs(x)>=1;band+=y*y;energy+=x*x;if(i)high+=(x-a[i-1])**2;
 }}
 return{left:db(rms[0]),right:db(rms[1]),rms:db(Math.hypot(...rms)/Math.SQRT2),mono:db(Math.sqrt(mono/ch[0].length)),peak:db(peak),clip,brightness:10*Math.log10(high/energy),consonants:10*Math.log10(band/energy)};
}
await withTestServer(async base=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__sound.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Sound measurement</title><link rel="icon" href="data:,"><button>Start</button><script src="/vendor/three.min.js"></script><script src="/js/sound.js"></script><script src="/js/cast.js"></script><script src="/js/np-lines.js"></script><script src="/js/st-voice.js"></script>'}));
 if(baseline)for(const file of ['sound.js','st-voice.js'])await p.route('**/js/'+file,async r=>r.fulfill({contentType:'text/javascript',body:await readFile('/tmp/sound-baseline/'+file,'utf8')}));
 // Observe the true last node, without altering production routing or gain.
 await p.addInitScript(()=>{window.audioEdges=[];window.followCosts=[];const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>raf.call(window,t=>{const start=performance.now();fn(t);if(fn.name==='follow')followCosts.push(performance.now()-start)});const old=AudioNode.prototype.connect;AudioNode.prototype.connect=function(...args){audioEdges.push([this,args[0]]);return old.apply(this,args)}});
 await p.goto(base+'/__sound.html');await p.locator('button').click();
 await p.evaluate(async()=>{Sound.unlock();await st.loadVoices();Cast.bind('measure',{first:'Jack',g:'m'});window.House={camera:new THREE.PerspectiveCamera(),graphicsGet:()=>({adapt:0})};window.speaker={x:0,y:0,z:-100};window.facing={x:0,y:0,z:1};window.id='c2.pocket.dad';st.prefetch(id);st.prefetch('bf.display.start.f55ktr');await Sound.ctx.audioWorklet.addModule('/js/sound-test-meter.js');window.meters=[];
 window.capture=(nodes,frames)=>new Promise(resolve=>{const m=new AudioWorkletNode(Sound.ctx,'sound-meter'),z=Sound.ctx.createGain();z.gain.value=0;for(const n of nodes)n.connect(m);m.connect(z);z.connect(Sound.ctx.destination);m.port.onmessage=e=>{for(const n of nodes)n.disconnect(m);m.disconnect();z.disconnect();resolve(e.data)};m.port.postMessage({frames});});});
 await p.waitForFunction(()=>st.voiceReady(id)&&st.voiceReady('bf.display.start.f55ktr'));
 const cases={left:[-100,0,0],right:[100,0,0],front:[0,0,-100],behind:[0,0,100],near:[0,0,-30],twoMetres:[0,0,-200],far:[0,0,-600],away:[0,0,-100],otherRoom:[0,0,-400],remote:null,telephone:null,tv:null,quiet:null,bonfire:[0,0,-200],bonfireAway:[0,0,-200],fallback:[0,0,-100],stopped:[0,0,-100],overload:null};
 const results={};
 for(const [name,pos]of Object.entries(cases)){
  const chunks=await p.evaluate(async({name,pos})=>{st.stopVoice();Sound.music.stop();Sound.setVolume(name==='quiet'?.5:1);House.graphicsGet=()=>({adapt:name==='fallback'?5:0});speaker=pos?{x:pos[0],y:pos[1],z:pos[2]}:null;facing=speaker?new THREE.Vector3(-speaker.x,-speaker.y,-speaker.z).normalize():null;if(name==='away'||name==='bonfireAway')facing.negate();
   const h=st.play(name.startsWith('bonfire')?'bf.display.start.f55ktr':id,{pos:speaker?()=>speaker:null,dir:speaker?()=>facing:null,through:()=>name==='otherRoom'||name==='telephone'});while(!h.started&&!h.ended)await new Promise(r=>setTimeout(r,10));
   const c=Sound.ctx,last=[...new Set(audioEdges.filter(([a,b])=>b===c.destination&&a.gain?.value!==0).map(([a])=>a))];
   const promise=capture(last,Math.round(c.sampleRate*2.6));
   if(name==='stopped')setTimeout(()=>h.stop(),1000);
   let voiceMeter,backgroundMeter;if(name.startsWith('bonfire')){voiceMeter=capture([Sound.output(c,'voice')],Math.round(c.sampleRate*2.6));backgroundMeter=capture([Sound.output(c),Sound.output(c,'music')],Math.round(c.sampleRate*2.6));Sound.music.play('theme');for(let i=0;i<5;i++){const t=c.currentTime+i*.45,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(58,t);o.frequency.exponentialRampToValueAtTime(24,t+.65);g.gain.setValueAtTime(.065*.5,t);g.gain.exponentialRampToValueAtTime(.0008,t+.65);o.connect(g);g.connect(Sound.output(c));o.start(t);o.stop(t+.68);const b=c.createBuffer(1,c.sampleRate*1.1,c.sampleRate);for(let j=0;j<b.length;j++)b.getChannelData(0)[j]=Math.random()*2-1;const n=c.createBufferSource(),f=c.createBiquadFilter(),ng=c.createGain();n.buffer=b;f.type='lowpass';f.frequency.setValueAtTime(170,t);f.frequency.exponentialRampToValueAtTime(650,t+1.1);ng.gain.setValueAtTime(.065*.5,t);ng.gain.exponentialRampToValueAtTime(.0008*.5,t+1.1);n.connect(f);f.connect(ng);ng.connect(Sound.output(c));n.start(t);n.stop(t+1.13)}}
   if(name==='overload'){const o=c.createOscillator(),g=c.createGain();g.gain.value=8;o.connect(g);g.connect(Sound.output(c));o.start();o.stop(c.currentTime+2.7)}
   const data=await promise,voiceData=voiceMeter?await voiceMeter:null,backgroundData=backgroundMeter?await backgroundMeter:null;st.stopVoice();Sound.music.stop();return{data,voiceData,backgroundData,sampleRate:c.sampleRate,model:h.panner?.panningModel,cone:h.panner?.coneOuterGain,rolloff:h.panner?.rolloffFactor};
  },{name,pos});
  const ch=[[],[]];for(const x of chunks.data){ch[0].push(...x[0]);ch[1].push(...x[1])}results[name]={...stats(ch,chunks.sampleRate),model:chunks.model,cone:chunks.cone,rolloff:chunks.rolloff};
  if(chunks.voiceData){const unpack=data=>{const a=[[],[]];for(const b of data){a[0].push(...b[0]);a[1].push(...b[1])}return a};results[name].voiceRms=stats(unpack(chunks.voiceData),chunks.sampleRate).rms;results[name].backgroundRms=stats(unpack(chunks.backgroundData),chunks.sampleRate).rms;assert(results[name].voiceRms-results[name].backgroundRms>10,'Real Bonfire line dominates simultaneous bangs and music');}
  if(name==='stopped'){const tail=ch.map(a=>a.slice(Math.round(chunks.sampleRate*1.5)));results[name].tailPeak=Math.max(...tail.flat().map(Math.abs));assert(results[name].tailPeak<1e-6,'Stop fade leaves silence');}
  await writeFile(dir+'/'+name+'.wav',wav(ch,chunks.sampleRate));console.log(name,JSON.stringify(results[name]));await p.waitForTimeout(250);
 }
 if(!baseline){assert(results.left.left-results.left.right>1,'Left speaker (HRTF also supplies interaural delay)');assert(results.right.right-results.right.left>1,'Right speaker');assert(results.twoMetres.rms-results.far.rms>8.5,'2 m versus 6 m, after master dynamics');assert(results.front.rms-results.away.rms>3,'Head cone');assert(results.front.consonants-results.away.consonants>1,'Facing away loses consonant energy relative to total loudness');assert(Math.abs(results.front.consonants-results.behind.consonants)>.8,'HRTF front/back consonant spectrum differs');assert(results.overload.peak<-.4&&!results.overload.clip,'Master ceiling');assert(Math.abs(results.remote.rms-results.quiet.rms-6.0206)<.2,'Saved volume remains linear');assert(Math.abs(results.front.rms-results.near.rms)<.2,'Close-up is no louder');assert(results.fallback.model==='equalpower','Automatic weak-device fallback');assert(Math.abs(results.tv.rms-results.remote.rms)<.2,'Non-positional TV unchanged');assert(results.telephone.consonants<results.remote.consonants-3,'Telephone keeps its narrow filter');assert(Math.abs(results.telephone.left-results.telephone.right)<.1,'Telephone stays centred');for(const n of ['left','right'])assert(results[n].mono>results[n].rms-6,'Mono phone downmix survives HRTF: '+n);}
 // Native audio-thread cost: alternate models to avoid warm-up/order bias.
 const performance=await p.evaluate(async()=>{const samples={equalpower:[],HRTF:[],protectedEqualpower:[],protectedHRTF:[]};for(let i=0;i<8;i++)for(const model of i%2?Object.keys(samples).reverse():Object.keys(samples)){const c=new OfflineAudioContext(2,48000*12,48000),s=c.createBufferSource(),b=c.createBuffer(1,48000,48000);for(let j=0;j<48000;j++)b.getChannelData(0)[j]=Math.sin(j*.11)*.4;s.buffer=b;s.loop=true;const n=c.createPanner();n.panningModel=model.endsWith('HRTF')?'HRTF':'equalpower';n.positionX.value=100;n.positionZ.value=-100;n.refDistance=200;s.connect(n);n.connect(model.startsWith('protected')?Sound.output(c,'voice'):c.destination);s.start();const t=performance.now();await c.startRendering();samples[model].push(performance.now()-t)}return samples});
 results.performance=performance;results.followCosts=await p.evaluate(()=>{const a=followCosts.sort((a,b)=>a-b);return{samples:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}});console.log('PERFORMANCE',JSON.stringify(performance),'FOLLOW',JSON.stringify(results.followCosts));
 assert.deepEqual(errors,[]);await writeFile(dir+'/measurements.json',JSON.stringify(results,null,2));
 }finally{await browser.close()}
});
