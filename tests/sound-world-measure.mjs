// Real original house synthesis, native browser audio, fixed-length WAV captures.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {withTestServer} from './perf/server.mjs';
import {wav,stats} from './sound-analysis.mjs';
const dir='/tmp/sound-round2-world';await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium'});
 try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/__world-sound',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>House sound measurement</title><link rel="icon" href="data:,"><button>Start</button><script src="/js/sound.js"></script>'}));
 await p.goto(base+'/__world-sound');await p.locator('button').click();
 await p.evaluate(async()=>{Sound.unlock();await Sound.ctx.audioWorklet.addModule('/js/sound-test-meter.js');window.capture=(kind,o,d)=>new Promise(resolve=>{const c=Sound.ctx,m=new AudioWorkletNode(c,'sound-meter'),tap=Sound.masterOutput(c);tap.connect(m);m.connect(c.destination);m.port.onmessage=e=>{if(e.data.ready){Sound.world(kind,o);return}tap.disconnect(m);m.disconnect();resolve({data:e.data,sr:c.sampleRate})};m.port.postMessage({frames:Math.round(c.sampleRate*d),ready:true})})});
 const cases={};for(const surface of ['carpet','lino','tile','stairs','paving','grass'])cases['step-'+surface]=['step',{surface}];
 for(const weight of ['light','medium','heavy'])for(const put of [false,true])cases[(put?'put-':'pick-')+weight]=['handle',{weight,put}];
 for(const weight of ['light','heavy'])cases['bump-'+weight]=['bump',{weight,speed:500}];
 for(const kind of ['roll','scrape','turn','deny','lift','drawer','switch','clock','road','bird','kettle'])cases[kind]=[kind,{}];
 cases['door-open']=['door',{open:true}];cases['door-shut']=['door',{open:false}];cases['power-crt']=['power',{kind:'crt'}];
 const results={};for(const [name,[kind,o]]of Object.entries(cases)){
  const {data,sr}=await p.evaluate(({kind,o})=>capture(kind,o,kind==='kettle'?2.3:.8),{kind,o});const channels=[[],[]];for(const block of data)for(let i=0;i<2;i++)channels[i].push(...block[i]);
  results[name]=stats(channels,sr);assert.equal(results[name].clip,0,name+' never clips');assert(results[name].peak<-.4,name+' retains master headroom');assert(results[name].peak>-100,name+' is present');await writeFile(dir+'/'+name+'.wav',wav(channels,sr));
 }
 await writeFile(dir+'/measurements.json',JSON.stringify(results,null,2));
 assert(results['step-tile'].rms+results['step-tile'].consonants>results['step-carpet'].rms+results['step-carpet'].consonants+6,'Tile scrape has at least twice the absolute high-band amplitude of soft carpet');
 assert(results['bump-heavy'].rms>results['pick-light'].rms,'Heavy impact is stronger than light handling');assert.deepEqual(errors,[]);
 await writeFile(dir+'/measurements.json',JSON.stringify(results,null,2));console.log('WORLD SOUND PASS',JSON.stringify(results));
 }finally{await b.close()}
});
