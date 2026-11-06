// Real browser activation gate, fresh defaults and saved mute choices.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 for(const [name,storage,want] of [['fresh',{},[true,true]],['legacy mute',{jhp_sfx:'0'},[false,false]],['split preferences',{jhp_audio_effects:'0',jhp_audio_music:'1'},[false,true]],['no activation API',{},[true,true]]]){
  const context=await browser.newContext(),p=await context.newPage(),cdp=await context.newCDPSession(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(['warning','error'].includes(m.type()))errors.push(m.text())});
  const passive=async expression=>(await cdp.send('Runtime.evaluate',{expression,returnByValue:true,userGesture:false})).result.value;
  await p.route('**/__audio-start',r=>r.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'self'; script-src 'self'; img-src 'self' data:"},body:'<!doctype html><title>Audio input check</title><link rel="icon" href="data:,"><button>Press to start</button><script src="/js/sound.js"></script><script src="/js/sound-space.js"></script>'}));
  await p.addInitScript(storage=>{if(!localStorage.getItem('audio-start-seeded')){for(const [k,v]of Object.entries(storage))localStorage.setItem(k,v);localStorage.setItem('audio-start-seeded','1')}},storage);
  if(name==='no activation API')await p.addInitScript(()=>Object.defineProperty(navigator,'userActivation',{get:()=>undefined}));
  await p.goto(base+'/__audio-start');
  // Playwright evaluate/addScriptTag grants synthetic user activation. Read and
  // attempt playback through passive CDP so this really is a pre-gesture check.
  assert.deepEqual(await passive('[Sound.effectsOn,Sound.musicOn]'),want,name);
  assert.equal(await passive('typeof Sound.emitter'),'function','Spatial extension loads after the shared bus without creating audio');
  await passive('Sound.play("click");Sound.music.play("theme")');
  assert.deepEqual(await passive('[Sound.ready,Sound.ctx===null]'),[false,true],'No audio context before trusted input');
  await p.locator('button').click();
  if(want.some(Boolean)){
   for(let n=0;n<100&&!(await passive('Sound.ctx?.state==="running"'));n++)await p.waitForTimeout(50);
   assert(await passive('Sound.ctx?.state==="running"'),'First trusted gesture starts the context');
   await p.evaluate(()=>{const c=Sound.ctx;window.meter=c.createAnalyser();meter.fftSize=2048;Sound.output(c,Sound.musicOn?'music':'effects').connect(meter);if(!Sound.musicOn)Sound.note(440,2,'sine')});
   await p.waitForTimeout(250);
   assert(await p.evaluate(()=>{const d=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(d);return d.some(v=>Math.abs(v)>.00001)}),'Audio reaches the enabled bus after the first real input');
  }else assert(await p.evaluate(()=>Sound.ready&&!Sound.on&&(!Sound.ctx||(Sound.output(Sound.ctx,'music').gain.value===0&&Sound.output(Sound.ctx).gain.value===0))),'Saved mute keeps both audio buses silent');
  await p.evaluate(()=>{window.ttsCalls=0;if(window.speechSynthesis)speechSynthesis.speak=()=>ttsCalls++;Sound.speak({volume:1})});
  assert.equal(await p.evaluate(()=>ttsCalls),0,'Starting sound never enables synthesized speech');
  await p.evaluate(()=>Sound.on=false);await p.reload();
  assert.deepEqual(await p.evaluate(()=>[Sound.effectsOn,Sound.musicOn]),[false,false],'Explicit mute survives reload');
  assert.deepEqual(errors,[]);await context.close();console.log('AUDIO START PASS: '+name);
 }
}finally{await browser.close()}
