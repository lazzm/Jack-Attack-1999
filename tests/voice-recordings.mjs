// Play every character through real sound/player modules on a private audio page.
// In-world mouths, positioning and touch are separately exercised by voices.mjs; this isolates media from GPU stalls.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {chromium} from 'playwright';
const audit=JSON.parse(await readFile(new URL('../tools/audio/releases/british-2026-10-29.json',import.meta.url),'utf8'));
await withTestServer(async base=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),p=await browser.newPage(),errors=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text()+' '+JSON.stringify(m.location()))});p.on('response',r=>{if(r.status()>=400)console.log('Audio page resource failure:',r.status(),r.url())});
 const until=async fn=>{await p.waitForFunction(fn,{},{timeout:30000})};
 try{
  await p.route('**/favicon.ico',r=>r.fulfill({status:204,body:''}));
  await p.route(base+'/voice-test.html',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Jack Attack 1999</title><link rel="icon" href="/favicon.svg"><button id="listen">Check voices</button>'}));
  await p.goto(base+'/voice-test.html');
  await p.addScriptTag({url:base+'/js/sound.js?v=voice-audit'});await p.addScriptTag({url:base+'/js/st-voice.js?v=voice-audit'});
  await p.evaluate(()=>document.querySelector('#listen').addEventListener('click',()=>{Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock()?.resume()}));
  await p.locator('#listen').click();await until(()=>Sound.ctx?.state==='running');await p.evaluate(()=>st.loadVoices());
  assert.equal(await p.evaluate(()=>Object.keys(st.voice).length),audit.acceptedCount,'Exact audited manifest loaded');
  assert(await p.evaluate(ids=>ids.every(id=>!st.voiceInfo(id)),audit.excluded.map(v=>v.id)),'A withheld line is listed for playback');
  for(const character of ['announcer','dad','gran','mom','sister']){
   const [id]=Object.entries(audit.accepted).filter(([,m])=>m.character===character).sort((a,b)=>b[1].dur-a[1].dur)[0];
   assert.equal(audit.accepted[id].character,character);
   await p.evaluate(id=>{window.recordingID=id;st.prefetch(id)},id);await until(()=>st.voiceReady(recordingID));
   await p.evaluate(id=>{window.audioProbe=st.play(id,{pos:()=>({x:0,y:0,z:0}),through:()=>false})},id);
   await until(()=>window.audioProbe?.started||window.audioProbe?.ended);
   const result=await p.evaluate(async()=>{const h=audioProbe,levels=[],progress=[];let ducked=false;for(let i=0;i<16;i++){const level=h.level();levels.push(level);progress.push(h.progress());ducked||=Sound.ducked&&level>.08;await new Promise(r=>setTimeout(r,60))}const result={started:h.started,ended:h.ended,panner:!!h.panner,context:h.ctx.state,level:Math.max(...levels),progress:Math.max(...progress),ducked,events:st.voiceLog.filter(v=>v.startsWith(recordingID+' '))};h.stop();return result});
   assert(result.started&&result.panner&&result.context==='running'&&result.level>.08&&result.progress>0&&result.ducked,JSON.stringify({character,id,result}));
   await until(()=>!st.voicesPlaying.length&&!Sound.ducked);results.push({character,id,...result});console.log('REAL VOICE PLAYBACK PASS',character,id,'peak',result.level.toFixed(3));
  }
  assert.deepEqual(errors,[]);const dir=new URL('shots/voices/',import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('audio-recordings.json',dir),JSON.stringify(results,null,2));console.log('VOICE RECORDINGS PASS: all five characters, real decode/source/level/panner/duck, exact manifest and withheld fallbacks');
 }finally{await browser.close()}
});
