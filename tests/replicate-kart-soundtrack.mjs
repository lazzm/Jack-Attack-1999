// Explicit owner-requested offline soundtrack generation; never run in site tests.
// Reads the credential from stdin only. At most one prediction runs at a time.
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
const version='671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';
const themes=[
 ['menu','Friendly title and driver-selection theme, 118 BPM, C major, bright sampled brass answering a playful clarinet, bouncy slap bass, small dry drums and a memorable original hook. Confident welcoming arcade mood.'],
 ['beach','Sandcastle beach kart race, 148 BPM, D major, tropical steel pans and marimba, warm sampled brass, buoyant electric bass and syncopated dry drum-machine rhythm. Sunny and energetic.'],
 ['snow','Snowy mountain kart race, 150 BPM, E major, sparkling celesta and pizzicato strings, airy flute hook, fast rounded bass and crisp dry drums. Playful icy adventure.'],
 ['spooky','Comical haunted-manor kart race, 146 BPM, D minor, cheeky harpsichord, toy organ, plucked strings, bouncing tuba bass and light dry drums. Mischievous and kid-friendly rather than frightening.'],
 ['desert','Desert canyon kart race, 150 BPM, A minor, twangy sampled guitar and wooden percussion, whistling synthesizer hook, galloping rounded bass and dry snare. Playful dusty adventure.'],
 ['castle','Lava castle kart race, 154 BPM, G minor, punchy sampled brass and pizzicato strings, dramatic but playful low synth ostinato, bright bells, driving bass and dry drum-machine beats.'],
 ['jungle','Dinosaur jungle kart race, 152 BPM, F major, lively marimba, wooden flutes and playful brass calls, syncopated sampled hand percussion, rubbery bass and dry drums.'],
 ['space','Cosmic rainbow-road kart race, 154 BPM, B flat major, sparkling synth arpeggios and wide warm sampled strings, triumphant original lead, buoyant bass and punchy dry drum-machine rhythm.'],
 ['battle','Toy-box balloon battle arena, 156 BPM, E minor, cheeky brass stabs and plucked synth hook, restless rounded bass, fast dry snares and claps, playful competitive tension.'],
 ['results','Race results and points-table theme, 106 BPM, C major, relaxed electric piano and muted sampled brass, mellow vibraphone answer, gentle shuffle drums and walking rounded bass.'],
 ['podium','Kart championship trophy celebration, 124 BPM, G major, joyful sampled trumpet fanfare and small bright strings, celebratory cymbals, rounded bass and a steady cheerful drum groove.'],
];
const prefix='Original instrumental soundtrack for one cohesive late-1990s 64-bit console kart-racing game. Compact sample-bank instruments, simple clear melodies, modest reverb and punchy MIDI-like arrangement rather than modern orchestral realism. ';
const suffix=' Continuous loop-friendly groove from the first beat, instrumental only, original composition, no borrowed melodies, no vocals, no long intro or fadeout.';
const dir=path.resolve(import.meta.dirname,'../app/public/audio/kart-v1');
console.log('Waiting for the owner-provided token on stdin. No credential will be saved.');
const rl=readline.createInterface({input:process.stdin});let token=String(await new Promise(resolve=>rl.once('line',resolve))).trim();rl.close();if(!token)throw Error('Missing token');
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
async function api(url,options={}){const r=await fetch(url,{...options,headers});const body=await r.json();if(!r.ok)throw Error(('Replicate '+r.status+': '+String(body.detail||body.error||'Request rejected')).replaceAll(token,'[redacted]'));return body}
await fs.mkdir(dir,{recursive:true});let manifest={provider:'Replicate',model:'meta/musicgen',version,license:'https://replicate.com/meta/musicgen/readme',usage:'Owner-approved original non-commercial game soundtrack; weights CC-BY-NC 4.0.',tracks:{}};
try{manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'))}catch{}
let estimated=0;
try{
 for(const[id,description]of themes){
  if(manifest.tracks[id]){await fs.access(path.join(dir,id+'.mp3'));console.log('Keeping existing cue:',id);continue}
  // A conservative estimate, not a provider-side billing cap. Stop rather than
  // retrying failed or unexpectedly long generations. Price checked 2026-10-22.
  if(estimated+110*.0014>1.70){console.log('Stopping at conservative batch-cost allowance.');break}
  const input={prompt:prefix+description+suffix,model_version:'stereo-large',output_format:'mp3',normalization_strategy:'peak',duration:24};
  let prediction=await api('https://api.replicate.com/v1/predictions',{method:'POST',body:JSON.stringify({version,input})});
  console.log('Generating cue:',id);const start=Date.now();
  while(!['succeeded','failed','canceled'].includes(prediction.status)){
   if(Date.now()-start>110000){await api(prediction.urls.cancel,{method:'POST'});throw Error('Slow generation cancelled; no retries submitted.')}
   await new Promise(resolve=>setTimeout(resolve,2500));prediction=await api(prediction.urls.get);
  }
  if(prediction.status!=='succeeded')throw Error('Cue failed: '+id+' ('+prediction.status+'). No retries submitted.');
  const url=Array.isArray(prediction.output)?prediction.output[0]:prediction.output;if(typeof url!=='string'||!url.startsWith('https://'))throw Error('Unexpected audio output');
  const response=await fetch(url);if(!response.ok)throw Error('Audio download failed: '+response.status);const bytes=Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(dir,id+'.mp3'),bytes);
  const seconds=prediction.metrics?.predict_time??((Date.now()-start)/1000);estimated+=seconds*.0014;
  manifest.tracks[id]={input,prediction:prediction.id,bytes:bytes.length,predictSeconds:seconds};
  await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Saved cue:',id,bytes.length+' bytes; batch estimate $'+estimated.toFixed(3));
 }
}finally{delete headers.Authorization;token=''}
console.log('Soundtrack generation finished. No runtime API calls or extra retries.');
