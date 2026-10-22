// One owner-requested audio trial. Token arrives on stdin, never argv or disk.
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
const version='671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';
const prompt='Original instrumental late-1990s 64-bit kart-racing game theme. Bright brassy synthesizer stabs, rubbery electric bass, playful marimba melody and punchy dry drum-machine groove, 150 BPM. Joyful triumphant G major with colourful major ninth chords and a rising energetic chorus. Arcade fun, catchy original composition, no vocals, no recognizable melodies or existing songs, no long intro or cinematic ending, steady loop-friendly groove.';
console.log('Waiting for the owner-supplied Replicate token on stdin; it will not be saved.');
const rl=readline.createInterface({input:process.stdin});let token=await new Promise(resolve=>rl.once('line',resolve));rl.close();token=token.trim();if(!token)throw Error('No token supplied');
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
async function api(url,options={}){const r=await fetch(url,{...options,headers});const body=await r.json();if(!r.ok)throw Error(('Replicate HTTP '+r.status+': '+(body.detail||body.error||'Request rejected')).replaceAll(token,'[redacted]'));return body}
const schema=await api('https://api.replicate.com/v1/models/meta/musicgen/versions/'+version);
const props=schema.openapi_schema?.components?.schemas?.Input?.properties||{};
if(!props.model_version?.enum?.includes('stereo-large'))throw Error('Requested version does not expose stereo-large');
console.log('Authentication and model-version lookup succeeded. Starting ONE 24-second prediction.');
const input={prompt,model_version:'stereo-large',output_format:'mp3',normalization_strategy:'peak',duration:24};
let prediction=await api('https://api.replicate.com/v1/predictions',{method:'POST',body:JSON.stringify({version,input})});
const start=Date.now();let report=0;
while(!['succeeded','failed','canceled'].includes(prediction.status)){
 if(Date.now()-report>20000){console.log('Music generation:',prediction.status,Math.round((Date.now()-start)/1000)+'s');report=Date.now()}
 if(Date.now()-start>900000)throw Error('Prediction is still running. No second prediction was submitted.');
 await new Promise(resolve=>setTimeout(resolve,2500));prediction=await api(prediction.urls.get);
}
if(prediction.status!=='succeeded')throw Error('Music generation '+prediction.status+': '+String(prediction.error||'No output').replaceAll(token,'[redacted]'));
const url=Array.isArray(prediction.output)?prediction.output[0]:prediction.output;if(typeof url!=='string'||!url.startsWith('https://'))throw Error('Unexpected audio output');
const response=await fetch(url);if(!response.ok)throw Error('Audio download failed: '+response.status);const bytes=Buffer.from(await response.arrayBuffer());
const dir=path.resolve(import.meta.dirname,'../app/public/audio/kart-trial');await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'race.mp3'),bytes);
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({provider:'Replicate',model:'meta/musicgen',version,input,prediction:prediction.id,bytes:bytes.length,usage:'Owner-requested non-commercial game audio trial; model weights are CC-BY-NC 4.0. Review licensing before any commercial release.',license:'https://replicate.com/meta/musicgen/readme'},null,2)+'\n');
delete headers.Authorization;token='';console.log('Music trial saved:',path.join(dir,'race.mp3'),bytes.length+' bytes');
