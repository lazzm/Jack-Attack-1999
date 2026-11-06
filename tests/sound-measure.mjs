// Production graph, real Chromium audio thread. No generated speech or clip writes.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {withTestServer} from './perf/server.mjs';
import {wav,stats} from './sound-analysis.mjs';
const tag=process.argv[2]||'after',baseline=tag==='before'||tag==='round2-before',dir='/tmp/sound-'+tag;
await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 try{const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__sound.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Sound measurement</title><link rel="icon" href="data:,"><button>Start</button><script src="/vendor/three.min.js"></script><script src="/js/sound.js"></script><script src="/js/cast.js"></script><script src="/js/np-lines.js"></script><script src="/js/st-voice.js"></script>'}));
 if(baseline)for(const file of ['sound.js','st-voice.js'])await p.route('**/js/'+file,async r=>r.fulfill({contentType:'text/javascript',body:await readFile((tag==='round2-before'?'/tmp/sound-round2-baseline/':'/tmp/sound-baseline/')+file,'utf8')}));
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
 if(!baseline){assert(results.left.left-results.left.right>7,'Left speaker retains the partial stereo widening');assert(results.right.right-results.right.left>7,'Right speaker retains the partial stereo widening');assert(results.twoMetres.rms-results.far.rms>8.5,'2 m versus 6 m, after master dynamics');assert(results.front.rms-results.away.rms>3,'Head cone');assert(results.front.consonants-results.away.consonants>1,'Facing away loses consonant energy relative to total loudness');assert(Math.abs(results.front.consonants-results.behind.consonants)>3,'HRTF front/back consonant spectrum differs');assert(results.overload.peak<-.4&&!results.overload.clip,'Master ceiling');assert(Math.abs(results.remote.rms-results.quiet.rms-6.0206)<.2,'Saved volume remains linear');assert(Math.abs(results.front.rms-results.near.rms)<.2,'Close-up is no louder');assert(results.fallback.model==='equalpower','Automatic weak-device fallback');assert(Math.abs(results.tv.rms-results.remote.rms)<.2,'Non-positional TV unchanged');assert(results.telephone.consonants<results.remote.consonants-3,'Telephone keeps its narrow filter');assert(Math.abs(results.telephone.left-results.telephone.right)<.1,'Telephone stays centred');for(const n of ['left','right'])assert(results[n].mono>results[n].rms-6,'Mono phone downmix survives HRTF: '+n);}
 // Native audio-thread cost: alternate models to avoid warm-up/order bias.
 const performance=await p.evaluate(async()=>{
  const samples={equalpower:[],HRTF:[],protectedEqualpower:[],protectedHRTF:[],completeVoice:[],movingPriorVoice:[],movingVoice:[]};
  for(let i=0;i<8;i++)for(const model of i%2?Object.keys(samples).reverse():Object.keys(samples)){
   const c=new OfflineAudioContext(2,48000*12,48000),s=c.createBufferSource(),b=c.createBuffer(1,48000,48000);
   for(let j=0;j<48000;j++)b.getChannelData(0)[j]=Math.sin(j*.11)*.4;
   s.buffer=b;s.loop=true;
   const full=model==='completeVoice'||model==='movingVoice'||model==='movingPriorVoice',n=c.createPanner();
   n.panningModel=model.endsWith('HRTF')||full?'HRTF':'equalpower';n.positionX.value=100;n.positionZ.value=-100;n.refDistance=200;s.connect(n);
   if(full){
    // Match the family graph: HRTF, retained widening, rear/head filters,
    // room filter/gain, stop-fade gain, mouth analyser, protected voice bus.
    const pan=c.createStereoPanner(),rear=c.createBiquadFilter(),facing=c.createBiquadFilter(),wall=c.createBiquadFilter(),wallGain=c.createGain(),out=c.createGain(),an=c.createAnalyser();
    n.rolloffFactor=1.5;n.maxDistance=6000;n.coneInnerAngle=120;n.coneOuterAngle=300;n.coneOuterGain=.45;n.orientationX.value=-Math.SQRT1_2;n.orientationZ.value=Math.SQRT1_2;
    pan.pan.value=.389;rear.type='highshelf';rear.frequency.value=1800;rear.gain.value=-3;
    facing.type='lowpass';facing.frequency.value=9000;facing.Q.value=.5;wall.type='lowpass';wall.frequency.value=18000;wall.Q.value=.5;an.fftSize=512;
    n.connect(pan);if(model==='movingPriorVoice')pan.connect(facing);else{pan.connect(rear);rear.connect(facing)}facing.connect(wall);wall.connect(wallGain);wallGain.connect(out);out.connect(an);an.connect(Sound.output(c,'voice'));
    if(model==='movingVoice'||model==='movingPriorVoice')for(let t=0;t<12;t+=1/30){
     const x=Math.sin(t),z=Math.cos(t);
     n.positionX.setTargetAtTime(150*x,t,.035);n.positionZ.setTargetAtTime(-150*z,t,.035);
     n.orientationX.setTargetAtTime(-x,t,.035);n.orientationZ.setTargetAtTime(z,t,.035);
     pan.pan.setTargetAtTime(.55*x,t,.035);if(model!=='movingPriorVoice')rear.gain.setTargetAtTime(-6*Math.max(0,-z),t,.035);
     facing.frequency.setTargetAtTime(4200+4800*(1+x)/2,t,.035);wall.frequency.setTargetAtTime(18000*Math.pow(.05,(1+z)/2),t,.035);
    }
   }else n.connect(model.startsWith('protected')?Sound.output(c,'voice'):c.destination);
   s.start();const t=performance.now();await c.startRendering();samples[model].push(performance.now()-t);
  }
  return samples;
 });
 results.performance=performance;results.followCosts=await p.evaluate(()=>{const a=followCosts.sort((a,b)=>a-b);return{samples:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}});console.log('PERFORMANCE',JSON.stringify(performance),'FOLLOW',JSON.stringify(results.followCosts));
 assert.deepEqual(errors,[]);await writeFile(dir+'/measurements.json',JSON.stringify(results,null,2));
 }finally{await browser.close()}
});
