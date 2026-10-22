import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until}=await roomFixture(process.argv[2]||'http://localhost:18469');
try {
  await p.evaluate(()=>{
    window.recordedSources=[];
    const original=AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource=function(...args){
      const source=original.apply(this,args),entry={source,stopped:false};recordedSources.push(entry);
      const start=source.start.bind(source),stop=source.stop.bind(source);
      source.start=(...a)=>{entry.offset=a[1]||0;entry.started=this.currentTime;return start(...a)};
      source.stop=(...a)=>{entry.stopped=true;return stop(...a)};
      return source;
    };
    Sound.on=true;Sound.unlock();
  });
  const sampleState=()=>p.evaluate(()=>recordedSources.filter(e=>e.source.buffer?.duration>10).map(e=>({stopped:e.stopped,offset:e.offset,duration:e.source.buffer.duration,loop:e.source.loop,rate:e.source.playbackRate.value})));
  const active=async()=> (await sampleState()).filter(e=>!e.stopped);
  await p.evaluate(async()=>{await Apps.load('js/rm-tv.js');RoomTV.test('n64.kart')});
  await until(()=>RoomTV._dbg()?.st==='game'&&window.__kartDbg?.st.mode==='title');
  console.log('Title loaded');
  assert.deepEqual(await active(),[],'Title must keep its existing music');
  await p.evaluate(()=>{__kartDbg.race('tt',0,0);__kartDbg.go()});
  await until(()=>__kartDbg.st.mode==='race');
  // The starting grid is just behind the line (internal lap zero). Cross it
  // before skipping two complete laps so the game's lap-transition guard runs.
  await p.evaluate(()=>__kartDbg.skipLaps(.2));await until(()=>__kartDbg.st.me.lap===1);
  await until(()=>recordedSources.some(e=>!e.stopped&&e.source.buffer?.duration>10));
  let state=await active();assert.equal(state.length,1);assert(state[0].loop);assert(state[0].duration>23&&state[0].duration<25);
  const energy=await p.evaluate(()=>{const s=recordedSources.find(e=>!e.stopped&&e.source.buffer?.duration>10),data=s.source.buffer.getChannelData(0);let sum=0;for(let i=0;i<data.length;i++)sum+=data[i]*data[i];return Math.sqrt(sum/data.length)});
  assert(energy>.001&&Number.isFinite(energy),'Decoded recording contains audible signal');
  await p.waitForTimeout(800);await p.keyboard.press('Enter');await p.waitForTimeout(200);
  assert.equal((await active()).length,0,'Pause stops the recording');
  await p.keyboard.press('Enter');await until(()=>recordedSources.some(e=>!e.stopped&&e.source.buffer?.duration>10));
  assert((await active())[0].offset>.5,'Resume continues rather than restarting');
  await p.evaluate(()=>Sound.on=false);await p.waitForTimeout(250);assert.equal((await active()).length,0,'Global mute');
  await p.evaluate(()=>Sound.on=true);await until(()=>recordedSources.some(e=>!e.stopped&&e.source.buffer?.duration>10));
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
  assert.equal((await active()).length,0,'Hidden tab stops the recording');
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await until(()=>recordedSources.some(e=>!e.stopped&&e.source.buffer?.duration>10));
  const before=await p.evaluate(()=>RoomTV.dbg().t);
  await p.keyboard.press('q');await until(()=>House.mode==='walk');assert.equal((await active()).length,1,'Lean-out preserves TV music');
  await p.waitForTimeout(350);assert(await p.evaluate(t=>RoomTV.dbg().t>t,before));
  await p.evaluate(()=>RoomTV.open('n64'));await until(()=>RoomTV.open_);
  await p.keyboard.press('t');await p.screenshot({path:'shots/kart-recording-desktop.png'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(250);await p.screenshot({path:'shots/kart-recording-narrow.png'});
  await p.setViewportSize({width:1366,height:860});await p.keyboard.press('t');await p.screenshot({path:'shots/kart-recording-room.png'});
  console.log('Pause, mute, lean-out and screenshot checks passed');
  await p.evaluate(()=>__kartDbg.skipLaps(2));await until(()=>recordedSources.some(e=>!e.stopped&&e.source.buffer?.duration>10&&e.source.playbackRate.value>1));
  console.log('Final lap speed-up passed');
  assert.equal((await active()).length,1,'Final lap never layers duplicate recordings');
  // A whole loop elapses while driving; no replacement node or second request is needed.
  await p.waitForTimeout(24000);assert.equal((await active()).length,1);
  await p.evaluate(()=>__kartDbg.title());await p.waitForTimeout(200);assert.equal((await active()).length,0);
  await p.evaluate(()=>{__kartDbg.race('battle',0,0);__kartDbg.go()});await until(()=>__kartDbg.st.mode==='race');
  assert.equal((await active()).length,0,'Battle keeps its original track');
  await p.evaluate(()=>RoomTV.test('gb.blocks'));await until(()=>RoomTV._dbg()?.st==='game');
  assert.equal((await active()).length,0,'Recording cannot leak to another console');
  await p.evaluate(()=>{RoomTV.music({audio:'audio/kart-trial/race.mp3?cancel-check=1'});RoomTV.music(null)});
  await p.waitForTimeout(400);assert.equal((await active()).length,0,'A cancelled decode cannot start late');
  // Exercise the real recorded-music loader's rejected-fetch fallback.
  await p.route('**/not-a-track.mp3',route=>route.fulfill({status:200,contentType:'audio/mpeg',body:'deliberately invalid test audio'}));
  await p.evaluate(()=>RoomTV.music({audio:'audio/kart-trial/not-a-track.mp3',fallback:{lead:[60,0],bpm:120}}));
  await p.waitForTimeout(500);await p.evaluate(()=>RoomTV.music(null));
  assert.deepEqual(errors,[]);
  console.log('KART RECORDING PASS: decoded MP3, title/battle isolation, loop, pause/resume offset, mute, lean-out/re-entry, final lap, console switch, fallback; desktop/narrow/native screenshots');
} catch(e) {console.error('Recording state',await sampleDebug(p));throw e}
finally {await browser.close()}
async function sampleDebug(p){return p.evaluate(()=>({kart:window.__kartDbg?.st,tv:RoomTV._dbg(),sources:recordedSources.filter(e=>e.source.buffer?.duration>10).map(e=>({stopped:e.stopped,offset:e.offset,rate:e.source.playbackRate.value}))}))}
