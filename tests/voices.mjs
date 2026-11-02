// The family's voices and speech bubbles (js/st-voice.js, js/np-bubble.js, js/np-life.js, js/np-rig.js):
// a recorded line really plays (WebAudio buffer started on the voice bus, positional, music/effects ducked), the painted
// mouth follows the recording's loudness, the bubble hangs over the speaker's head with its tail at the mouth and types
// the words on with the audio, an off-screen or downstairs speaker gets an edge balloon pointing their way, two speakers
// never overlap, the bubble keeps clear of the crosshair, the prompt over a person is one action ("Talk to Dad"),
// and with sound off nothing is fetched or played (bubble + timed mouth only), with no errors.
// Screenshots (desktop 1366x860 and phone portrait 390x844): tests/shots/voices/.
//   node voices.mjs http://localhost:PORT [--only=audio|layout|speak|muted|edge|two|prompt|phone|names]
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {roomFixture} from './room-fixture.mjs';

const base = process.argv[2] && /^https?:/.test(process.argv[2]) ? process.argv[2] : 'http://localhost:18080';
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
const shots = fileURLToPath(new URL('shots/voices/', import.meta.url));
const SCALE = +process.env.SMOKE_SCALE || Math.max(1, Math.min(4, Math.round(os.loadavg()[0] / os.cpus().length * 13) / 10));
const pass = 'Throwaway-1999', results = [];
const G = 353;
async function register(name) { const r = await fetch(base + '/admin/register', { method: 'POST', headers: { 'x-admin-token': 'testtoken', 'content-type': 'application/json' }, body: JSON.stringify({ name, pass }) }); assert.equal(r.status, 200, 'register ' + name); }
async function check(name, fn) {
  if (only && !only.split(',').includes(name)) return;
  const t0 = Date.now();
  try { await fn(); results.push([name, true]); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  catch (e) { results.push([name, false]); console.log(`FAIL ${name}: ${String(e.stack || e).split('\n').slice(0, 30).join(' | ')}`); }
}
async function house(opts = {}) {
  const name = 'Voi' + Date.now().toString(36); await register(name);
  const f = await roomFixture(base, Object.assign({ hour: 18, account: name, password: pass, signup: false, timeoutScale: SCALE, storage: { jhp_audio_effects: 1, jhp_audio_music: 0, jhp_audio_volume: 1 } }, opts));
  for (let i = 0; i < 120 * SCALE && !(await f.page.evaluate(() => !!window.HouseFamily?.ready)); i++) await f.page.waitForTimeout(500);
  assert(await f.page.evaluate(() => !!window.HouseFamily?.ready), 'The family never arrived');
  await f.page.evaluate(() => window.st.loadVoices());
  return f;
}
// (poll with evaluate: waitForFunction's evaluator trips the page's CSP)
async function waitFor(page, fn, ms) { const end = Date.now() + ms; for (;;) { if (await page.evaluate(fn).catch(() => false)) return; if (Date.now() > end) throw new Error('timed out waiting for ' + String(fn).slice(0, 120)); await page.waitForTimeout(120); } }
const shot = (page, name) => page.screenshot({ path: shots + name + '.png' });
async function look(page, eye, target, lvl) {
  await page.evaluate(({ eye, target, lvl }) => {
    House.hush(); House.setWalkFrom({ x: eye[0], y: eye[1], z: eye[2], lvl, seat: 0 });
    const [x, y, z] = eye, [tx, ty, tz] = target;
    Object.assign(House.P, { x, y, z, rx: Math.atan2(-(ty - y), Math.hypot(tx - x, tz - z)) * 180 / Math.PI, ry: Math.atan2(tx - x, -(tz - z)) * 180 / Math.PI, seat: 0, lvl });
    House._.setMode('walk'); House.dirty();
  }, { eye, target, lvl });
  await page.waitForTimeout(400 * SCALE);
}
// Stand dist cm from a person, turned yaw degrees round from straight in front of them, looking at their face
async function face(page, id, dist, yaw = 0, lvl = 'G') {
  const p = await page.evaluate(({ id, dist, yaw }) => { const c = HouseFamily.chars[id], a = c.h + yaw * Math.PI / 180; return { x: c.x + Math.sin(a) * dist, z: c.z + Math.cos(a) * dist, cx: c.x, cz: c.z }; }, { id, dist, yaw });
  await look(page, [p.x, G - 128, p.z], [p.cx, G - 150, p.cz], lvl);
}
// Everyone where we want them (a Tuesday evening, Dad home from work), the queue empty
async function stage(page, where) {
  await page.evaluate(where => {
    const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 18.1 });
    for (const [id, spot] of Object.entries(where)) { F.debug.go(id, spot); F.debug.place(id, spot); }
    F.debug.sim(2, 0.1); F.debug.speech.q.length = 0; F.debug.speech.until = 0; F.debug.speech.hard = 0; NPCBubble.clear();
  }, where);
}
const say = (page, id, line, o) => page.evaluate(({ id, line, o }) => HouseFamily.say(id, line, Object.assign({ force: true, prio: 9 }, o)), { id, line, o: o || {} });
const live = page => page.evaluate(() => NPCBubble.live.filter(b => !b.out));
const crossClear = (b, vw, vh) => b.x > vw / 2 + 30 || b.x + b.w < vw / 2 - 30 || b.y > vh / 2 + 30 || b.y + b.h < vh / 2 - 30;

await mkdir(shots, { recursive: true });
const watchdog = setTimeout(() => { console.log('FAIL runner: total timeout'); process.exit(1); }, 900000 * SCALE);

// Real audio coverage isolated from software WebGL startup; the house cases below cover positioning and balloons.
await check('audio', async () => {
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
  try {
    const page=await browser.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
    await page.route('**/__voice-audit.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Voice test</title>'+['sound','cast','np-lines','st-voice'].map(n=>'<script src="/js/'+n+'.js?v=voice-audit"></script>').join('')}));
    await page.goto(base+'/__voice-audit.html');await page.keyboard.press('Shift');
    await page.evaluate(async()=>{await st.loadVoices();Cast.bind('Jack');Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock();});
    for(const [id,speaker] of [['c1.wake.mom.shout','mom-shout'],['c1.wake.mom.call','mom-call'],['bark.dad.bed2','dad-shout'],['c1.sis.stairs','sis-whine']]) {
      await page.evaluate(id=>{window.__audioId=id;st.prefetch(id);},id);await waitFor(page,()=>st.voiceReady(__audioId),20000*SCALE);
      await page.evaluate(id=>{window.__audioVoice=st.play(id,{pos:()=>({x:50,y:0,z:0}),through:()=>true,fx:NPCLines[id][2]});window.__audioLevels=[];window.__audioSampler=setInterval(()=>__audioLevels.push(__audioVoice.level()),20);},id);
      await waitFor(page,()=>__audioVoice?.started&&__audioLevels.some(n=>n>0.15),15000*SCALE);
      const proof=await page.evaluate(()=>({name:__audioVoice.nameId,pos:!!__audioVoice.panner,duck:Sound.ducked,text:st.voiceText(__audioId,NPCLines[__audioId][1])}));
      assert.equal(proof.name,speaker+'/jack');assert(proof.pos&&proof.duck);assert(proof.text.startsWith(speaker==='mom-call'?'Jack, love?':speaker==='sis-whine'?'Jack!':'JACK!'));
      await page.evaluate(()=>{clearInterval(__audioSampler);st.stopVoice();});
    }
    const fallback=await page.evaluate(()=>{Cast.bind('audio-fixture',{first:'Qzxqzx',g:'m'});return {name:st.voiceName('bark.dad.bed2'),text:st.voiceText('bark.dad.bed2','Generic')};});
    assert.equal(fallback.name,null);assert.equal(fallback.text,'Generic');
    await page.evaluate(()=>{window.__audioVoice=st.play('bark.dad.bed2',{});});
    await waitFor(page,()=>__audioVoice?.started,15000*SCALE);
    assert.equal(await page.evaluate(()=>__audioVoice.nameId),null,'the fallback really plays the generic recording');
    await page.evaluate(()=>st.stopVoice());
    for(const mode of ['off','zero']){const before=requests.filter(u=>u.includes('.mp3')).length;
      const silent=await page.evaluate(mode=>{Cast.bind('Jack');Sound.effectsOn=mode!=='off';Sound.setVolume(mode==='zero'?0:1);st.prefetch('bark.dad.bed2');return st.play('bark.dad.bed2',{});},mode);
      assert.equal(silent,null);assert.equal(requests.filter(u=>u.includes('.mp3')).length,before);
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});

// ---------------------------------------------------------------- pure placement maths
await check('layout', async () => {
  const { browser, page, errors } = await house();
  try {
    const r = await page.evaluate(() => {
      const L = NPCBubble.layout, view = { w: 1366, h: 860, m: 16, top: 12 }, cross = { x: 643, y: 390, w: 80, h: 80 };
      const a = L.place({ x: 683, y: 470 }, 260, 70, view, [cross], 18); // head just under the crosshair: lifted clear
      const b = L.place({ x: 5, y: 30 }, 260, 70, view, [], 18); // top-left corner: clamped inside
      const e1 = L.edge({ x: 0, y: 1 }, 220, 60, view, []), e2 = L.edge({ x: -1, y: 0 }, 220, 60, view, []), e3 = L.edge({ x: 0.7, y: -0.7 }, 220, 60, view, []);
      const t = L.tail({ x: 100, y: 100, w: 200, h: 60 }, { x: 180, y: 260 }, 46, 14);
      const s = L.separate([{ x: 100, y: 300, w: 200, h: 60 }, { x: 150, y: 320, w: 200, h: 60 }], view);
      return { a, b, e1, e2, e3, t, s };
    });
    assert(r.a.y + 70 <= 390 - 6 || r.a.y >= 470 + 6 || r.a.x + 260 <= 643 || r.a.x >= 723, 'Bubble keeps off the crosshair: ' + JSON.stringify(r.a));
    assert(r.b.x >= 16 && r.b.y >= 12, 'Clamped to the screen: ' + JSON.stringify(r.b));
    assert(r.e1.y + 60 > 760 && Math.abs(r.e1.x + 110 - 683) < 2, 'Below: bottom edge, centred: ' + JSON.stringify(r.e1));
    assert(r.e2.x <= 50, 'Left edge: ' + JSON.stringify(r.e2));
    assert(r.e3.x + 110 > 683 + 250 && r.e3.y < 100, 'Up and to the right: ' + JSON.stringify(r.e3));
    assert(r.t.side === 'b' && r.t.ty > 160 && r.t.ty <= 160 + 46.1, 'Tail from the bottom towards the mouth: ' + JSON.stringify(r.t));
    assert(r.s[1].y + 60 <= r.s[0].y - 6 || r.s[1].y >= r.s[0].y + 60, 'Stacked, not overlapping: ' + JSON.stringify(r.s));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- a recorded line: heard, positional, mouth from the audio
await check('speak', async () => {
  const { browser, page, errors } = await house({ tier: process.env.VOICES_TIER || 'low' });
  try {
    const mp3 = []; page.on('requestfinished', r => { if (/\.mp3/.test(r.url())) mp3.push(r.url().split('/').pop()); }); page.on('requestfailed', r => { if (/\.mp3/.test(r.url())) mp3.push('FAILED ' + r.url()); });
    await stage(page, { dad: 'carStory', mom: 'sink' });
    await face(page, 'dad', 260, 70);
    await page.keyboard.press('Shift'); // (a user gesture: the browser allows sound)
    const ok = await page.evaluate(() => { Sound.effectsOn = true; return !!Sound.unlock() && Sound.voicesOn && !!st.voiceInfo('c2.pocket.dad'); });
    assert(ok, 'Sound on, the manifest lists c2.pocket.dad');
    // sample in the page (the host may be busy: round trips are slow, the audio is not)
    await page.evaluate(() => { window.__vs = []; const t0 = performance.now(); window.__vsT = setInterval(() => { const r = HouseFamily.chars.dad.rig, v = r.st.talkVoice, b = NPCBubble.live.find(b => b.key === 'dad'); window.__vn = (window.__vn || 0) + 1; window.__vlast = { has: !!v, st: v && v.started, en: v && v.ended, same: v === HouseFamily.debug.speech.voice }; if (!v || !v.started || v.ended) return; __vs.push({ t: performance.now() - t0, m: r.st.mouth, f: r.face.mouth, l: v.level(), panner: !!v.panner, ducked: Sound.ducked, said: b ? b.said.length : -1, mode: b && b.mode }); }, 40); });
    assert(await say(page, 'dad', 'c2.pocket.dad'), 'Dad says it');
    await waitFor(page, () => __vs.length >= 2, 20000 * SCALE).catch(async e => { console.log('DEBUG', await page.evaluate(() => JSON.stringify({ log: st.voiceLog, cur: HouseFamily.debug.speech.cur?.lineId, q: HouseFamily.debug.speech.q.map(q => q.lineId), ctx: Sound.ctx?.state, tv: !!HouseFamily.chars.dad.rig.st.talkVoice, n: window.__vn, last: window.__vlast, vs: __vs.length }))); throw e; });
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = true; Sound.ctx.suspend(); });
    await page.waitForTimeout(400);
    const frozen = (await live(page)).find(b => b.key === 'dad');
    await shot(page, 'dad-near');
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = false; Sound.ctx.resume(); });
    await waitFor(page, () => !st.voicesPlaying.length, 20000 * SCALE);
    const vs = await page.evaluate(() => { clearInterval(__vsT); return __vs; });
    const s = { started: vs.length >= 2, panner: vs.every(x => x.panner), ducked: vs.some(x => x.ducked), level: vs.map(x => x.l), mouth: vs.map(x => x.m), frames: [...new Set(vs.map(x => x.f))], said: vs.map(x => x.said), b: frozen };
    assert(s.started && s.panner, 'The recording started, positional (panner from the head): ' + JSON.stringify(s));
    assert(s.ducked, 'Music and effects dip under the voice');
    assert(Math.max(...s.level) > 0.3, 'The voice has level: ' + s.level.map(v => v.toFixed(2)));
    assert(Math.max(...s.mouth) - Math.min(...s.mouth) > 0.2 && s.frames.length > 1, 'Mouth follows the audio: ' + s.mouth.map(v => v.toFixed(2)).join(','));
    assert(s.b && s.b.key === 'dad' && s.b.mode === 'head', 'Bubble over Dad\'s head: ' + JSON.stringify(s.b));
    assert(s.said[0] < s.said.at(-1) && s.said[0] < s.b.text.length * 0.6, 'Words typed on with the voice: ' + s.said.join(','));
    const vw = 1366, vh = 860; assert(crossClear(s.b, vw, vh), 'Bubble clear of the crosshair: ' + JSON.stringify(s.b));
    const tail = s.b.tail; assert(tail && tail.ty > s.b.y + s.b.h - 2, 'Tail points down at the mouth: ' + JSON.stringify(tail));
    assert(!(await page.evaluate(() => document.querySelector('.hs-note.on')?.textContent || '')).includes('Saving up'), 'No subtitle box by default');
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => Sound.ducked), false, 'Ducking released');
    // far: across the drive
    await face(page, 'dad', 700, 75);
    await say(page, 'dad', 'c2.pocket.dad2');
    await waitFor(page, () => st.voicesPlaying.includes('c2.pocket.dad2'), 20000 * SCALE);
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = true; }); await page.waitForTimeout(1500); await shot(page, 'dad-far');
    const far = (await live(page))[0]; assert(far && far.mode === 'head', 'Far: still over his head ' + JSON.stringify(far));
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = false; });
    // subtitles option: the box too
    await page.evaluate(() => { st.subtitles = true; HouseFamily.debug.speech.until = 0; HouseFamily.debug.speech.hard = 0; });
    await say(page, 'dad', 'c2.pocket.dad3');
    await waitFor(page, () => (document.querySelector('.hs-note.on')?.textContent || '').length > 10, 15000 * SCALE);
    await page.evaluate(() => { st.subtitles = false; });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- sound off: bubble and timed mouth, nothing fetched
await check('muted', async () => {
  const { browser, page, errors } = await house({ storage: { jhp_audio_effects: 0, jhp_audio_music: 0, jhp_audio_volume: 1 } });
  try {
    const fetched = []; page.on('request', r => { if (/audio\/voice\/.+\.mp3/.test(r.url())) fetched.push(r.url()); });
    await stage(page, { dad: 'carStory' });
    await face(page, 'dad', 260, 70);
    await page.keyboard.press('Shift');
    await waitFor(page, () => HouseFamily.chars.dad.present && NPCBubble.ok(), 15000 * SCALE);
    await say(page, 'dad', 'c2.pocket.dad');
    await waitFor(page, () => HouseFamily.debug.speech.cur?.lineId === 'c2.pocket.dad', 15000 * SCALE);
    await waitFor(page, () => NPCBubble.live.some(b => b.key === 'dad' && b.mode === 'head' && !b.out), 15000 * SCALE);
    const m = await page.evaluate(async () => { const r = HouseFamily.chars.dad.rig, s = [], b = NPCBubble.live.find(b => b.key === 'dad' && !b.out); for (let i = 0; i < 12; i++) { s.push(r.st.mouth); await new Promise(q => setTimeout(q, 90)); } return { s, playing: st.voicesPlaying, b }; });
    assert(Math.max(...m.s) - Math.min(...m.s) > 0.2, 'Timed mouth still moves: ' + m.s.map(v => v.toFixed(2)));
    assert.deepEqual(m.playing, []); assert(m.b && m.b.mode === 'head', 'Bubble still shows: ' + JSON.stringify(m.b));
    assert.deepEqual(fetched, [], 'No voice files fetched with sound off');
    // turning sound on and off mid-line never throws
    await page.evaluate(() => { Sound.effectsOn = true; Sound.setVolume(0); Sound.effectsOn = false; Sound.setVolume(1); });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- real name recordings, owner identity, aliases, generic fallback and silence
await check('names', async () => {
  await register('Jack');
  const {browser,page,errors}=await house({account:'Jack',password:pass,signup:false,tier:'low'});
  try {
    const requests=[];page.on('request',r=>{if(/audio\/voice\/.+\.mp3/.test(r.url()))requests.push(r.url());});
    await stage(page,{mom:'sink',dad:'carStory',sister:'kmug1'});
    await face(page,'dad',260,70);await page.keyboard.press('Shift');
    const owner=await page.evaluate(()=>({first:Cast.me().first,clip:st.voiceName('bark.dad.bed2')}));
    assert.equal(owner.first,'Jack');assert.equal(owner.clip?.id,'dad-shout/jack','owner gets JACK!');
    await page.evaluate(()=>{Sound.effectsOn=true;Sound.setVolume(1);Sound.unlock();window.__nameSamples=[];
      window.__nameTimer=setInterval(()=>{const v=HouseFamily.debug.speech.voice,b=NPCBubble.live.find(b=>!b.out);if(v?.started&&!v.ended)__nameSamples.push({id:v.lineId,name:v.nameId,dur:v.dur,level:v.level(),pos:!!v.panner,text:b?.text,said:b?.said});},30);});
    await say(page,'dad','bark.dad.bed2',{again:true});
    await waitFor(page,()=>__nameSamples.some(s=>s.id==='bark.dad.bed2'&&s.name==='dad-shout/jack'&&s.level>0.2),25000*SCALE);
    await page.evaluate(()=>{HouseFamily.debug.speech.freeze=true;Sound.ctx.suspend();});await page.waitForTimeout(300);
    const b=(await live(page)).find(b=>b.key==='dad');assert(b?.text.startsWith('JACK! I can hear'),JSON.stringify(b));
    assert(crossClear(b,1366,860),'named balloon clear of crosshair');await shot(page,'name-owner-jack');
    await page.evaluate(()=>{HouseFamily.debug.speech.freeze=false;Sound.ctx.resume();});
    await waitFor(page,()=>!st.voicesPlaying.length,25000*SCALE);
    const samples=await page.evaluate(()=>__nameSamples);
    assert(samples.some(s=>s.pos&&s.name==='dad-shout/jack'));assert(samples.some(s=>s.said?.startsWith('JACK!')));
    assert(requests.some(u=>u.includes('/names/dad-shout/jack.mp3')),'real static name asset fetched');
    // Identity changes here are browser-only fixtures; no real or disposable account profile is overwritten.
    const aliases=await page.evaluate(()=>['Jak','Jac','Jakk','Jaque'].map(first=>{Cast.bind('voice-fixture',{first,g:'m'});return st.voiceName('bark.dad.bed2')?.id;}));
    assert.deepEqual(aliases,Array(4).fill('dad-shout/jack'));
    for(const [speaker,id,kind] of [['mom','bark.mom.tea1','mom-shout'],['mom','c1.wake.mom.call','mom-call'],['sister','c1.sis.stairs','sis-whine']]) {
      const selected=await page.evaluate(id=>{Cast.bind('voice-fixture',{first:'Jack',g:'m'});return st.voiceName(id);},id);
      // A speaker without an audited Jack recording must use the generic line, never another accent/name.
      if(!selected){console.log('NAME FALLBACK: no approved '+kind+'/jack');continue;}
      await face(page,speaker,270,60);
      await page.evaluate(()=>{HouseFamily.debug.speech.until=0;HouseFamily.debug.speech.hard=0;HouseFamily.debug.speech.q.length=0;st.stopVoice();__nameSamples.length=0;});
      await say(page,speaker,id,{again:true});
      await page.evaluate(id=>window.__nameWant=id,id);
      await waitFor(page,()=>__nameSamples.some(s=>s.id===__nameWant&&!!s.name&&s.level>0.2),25000*SCALE);
      assert((await live(page)).some(b=>b.text.startsWith(selected.text)),'name in '+speaker+' balloon');
      await page.evaluate(()=>{HouseFamily.debug.speech.freeze=true;Sound.ctx.suspend();});await page.waitForTimeout(300);
      await shot(page,'name-'+kind);await page.evaluate(()=>{HouseFamily.debug.speech.freeze=false;Sound.ctx.resume();});
    }
    await page.evaluate(()=>{st.stopVoice();HouseFamily.debug.speech.until=0;HouseFamily.debug.speech.hard=0;HouseFamily.debug.speech.q.length=0;Cast.bind('voice-fixture',{first:'Qzxqzx',g:'m'});});
    const before=requests.filter(u=>u.includes('/names/')).length;
    assert.equal(await page.evaluate(()=>st.voiceName('bark.dad.bed2')),null);
    await say(page,'dad','bark.dad.bed2',{again:true});
    await waitFor(page,()=>HouseFamily.debug.speech.cur?.lineId==='bark.dad.bed2'&&HouseFamily.debug.speech.voice?.started,25000*SCALE);
    assert.equal(await page.evaluate(()=>HouseFamily.debug.speech.voice.nameId),null);
    assert((await live(page)).some(b=>b.text.startsWith('I can hear')),'generic balloon has no invented name');
    assert.equal(requests.filter(u=>u.includes('/names/')).length,before,'fallback fetches no name');
    for(const mode of ['off','zero']){
      await page.evaluate(mode=>{st.stopVoice();const s=HouseFamily.debug.speech;s.cur=null;s.voice=null;s.bub=null;s.until=0;s.hard=0;s.q.length=0;NPCBubble.clear();Cast.bind('Jack',{first:'Sarah',g:'f'});Sound.effectsOn=mode!=='off';Sound.setVolume(mode==='zero'?0:1);},mode);
      const start=requests.length;
      await say(page,'dad','bark.dad.bed2',{again:true});
      await waitFor(page,()=>NPCBubble.live.some(b=>b.key==='dad'&&!b.out&&b.text.startsWith('JACK!')),15000*SCALE);
      assert.deepEqual(await page.evaluate(()=>st.voicesPlaying),[]);await page.waitForTimeout(500);
      assert.equal(requests.length,start,'muted call-out fetches no audio');
    }
    await shot(page,'name-muted-jack');await page.evaluate(()=>clearInterval(__nameTimer));assert.deepEqual(errors,[]);
  } finally {await browser.close();}
});

// ---------------------------------------------------------------- off-screen / downstairs: an edge balloon pointing their way
await check('edge', async () => {
  const { browser, page, errors } = await house({ tier: 'high' });
  try {
    await stage(page, { mom: 'sink', dad: 'carStory' });
    // upstairs on the landing: Mom shouts from the kitchen
    await page.evaluate(() => { House.setWalkFrom({ x: 300, y: -20, z: 400, lvl: 'U', seat: 0 }); House._.setMode('walk'); House.dirty(); });
    await page.waitForTimeout(800 * SCALE);
    await page.keyboard.press('Shift');
    await page.evaluate(() => { const S = HouseFamily.debug.speech, t = setInterval(() => { if (S.cur?.lineId === 'c1.wake.mom.shout') { S.freeze = true; clearInterval(t); } }, 30); });
    assert(await say(page, 'mom', 'c1.wake.mom.shout', { force: false, call: true }), 'Mom shouts up the stairs');
    await waitFor(page, () => NPCBubble.live.some(b => b.key === 'mom' && b.mode && b.x != null), 15000 * SCALE);
    await page.waitForTimeout(700);
    const b = (await live(page)).find(b => b.key === 'mom');
    assert(b && b.mode === 'edge', 'Edge balloon for Mom downstairs: ' + JSON.stringify(b));
    const name = await page.evaluate(() => document.querySelector('.np-bub .np-bub-name')?.textContent);
    assert(/Mom/.test(name) && /downstairs/.test(name), 'Name tab says where: ' + name);
    await shot(page, 'mom-downstairs-edge');
    console.log('DEBUG mom', JSON.stringify(await page.evaluate(() => { const e = document.querySelector('.np-bub'); const r = e.getBoundingClientRect(), cs = getComputedStyle(e), L = document.querySelector('.np-bubbles'), lc = getComputedStyle(L); return { r: [r.x, r.y, r.width, r.height], op: cs.opacity, vis: cs.visibility, tr: e.style.transform, lv: lc.visibility, ld: lc.display, lo: lc.opacity, ui: getComputedStyle(House.ui.el).opacity, html: document.documentElement.className }; })));
    // behind you: Dad at the car while you face the house
    await page.evaluate(() => { const S = HouseFamily.debug.speech; S.freeze = false; S.until = 0; S.hard = 0; S.q.length = 0; });
    { const p = await page.evaluate(() => { const c = HouseFamily.chars.dad; return { x: c.x + Math.sin(c.h) * 250, z: c.z + Math.cos(c.h) * 250, tx: c.x + Math.sin(c.h) * 900, tz: c.z + Math.cos(c.h) * 900 }; }); await look(page, [p.x, G - 128, p.z], [p.tx, G - 140, p.tz], 'G'); }
    await say(page, 'dad', 'c2.pocket.dad');
    await waitFor(page, () => NPCBubble.live.some(b => b.key === 'dad' && b.mode && !b.out && b.x != null), 15000 * SCALE);
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = true; }); await page.waitForTimeout(700);
    const d = (await live(page)).find(b => b.key === 'dad');
    assert(d && d.mode === 'edge' && d.y > 860 / 2, 'Behind you: an edge balloon low on the screen ' + JSON.stringify(d));
    await shot(page, 'dad-behind-edge');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- two speakers; the prompt over a person
await check('two', async () => {
  const { browser, page, errors } = await house({ tier: 'high' });
  try {
    await stage(page, { mom: 'sink', sister: 'kmug1' });
    { const p = await page.evaluate(() => { const a = HouseFamily.chars.mom, b = HouseFamily.chars.sister; return { mx: (a.x + b.x) / 2, mz: (a.z + b.z) / 2 }; }); await look(page, [40, G - 128, 280], [p.mx, G - 140, p.mz], 'G'); }
    await page.keyboard.press('Shift');
    await page.evaluate(() => { const S = HouseFamily.debug.speech, t = setInterval(() => { if (S.cur?.lineId === 'c1.sis.stairs') { S.freeze = true; clearInterval(t); } }, 30); });
    await say(page, 'sister', 'c1.sis.stairs');
    await waitFor(page, () => NPCBubble.live.some(b => b.key === 'sister' && b.mode), 20000 * SCALE);
    // Mom answers while the sister's balloon is still up (the reply timing of a real exchange)
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = true; NPCBubble.show({ key: 'mom', who: 'Mom', text: NPCLines['c1.mom.carry'][1], ms: 4000, anchor: HouseFamily.debug.anchor('mom') }); });
    await waitFor(page, () => NPCBubble.live.filter(b => b.mode && b.x != null).length >= 2, 20000 * SCALE);
    await page.waitForTimeout(1200 * SCALE);
    const bs = await live(page);
    await shot(page, 'two-speakers');
    assert.equal(bs.length, 2, 'Both balloons up: ' + JSON.stringify(bs));
    const [a, b] = bs; assert(a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1 || a.y + a.h <= b.y + 1 || b.y + b.h <= a.y + 1, 'Two balloons never overlap: ' + JSON.stringify(bs));
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = false; });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

await check('prompt', async () => {
  const { browser, page, errors } = await house();
  try {
    await stage(page, { dad: 'carStory' });
    await face(page, 'dad', 220, 70);
    await page.mouse.move(683, 430); await page.waitForTimeout(900);
    const tip = await page.evaluate(() => { const t = document.querySelector('.hs-tip'); return { on: t.classList.contains('on'), text: t.textContent }; });
    assert(tip.on && /\bDad\b/.test(tip.text) && (tip.text.match(/Talk/g) || []).length === 1, 'One clear action over Dad: ' + JSON.stringify(tip));
    assert.equal((tip.text.match(/\bF\b/g) || []).length, 1, 'F shown once: ' + tip.text);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- phone portrait
await check('phone', async () => {
  const resources=[];
  const { browser, page, errors } = await house({ tier: 'low', width: 390, height: 844, touch: true, onPage:p=>p.on('request',r=>{if(r.url().includes('/audio/voice/'))resources.push(r.url())}) });
  try {
    await page.setViewportSize({width:1366,height:860});
    await stage(page, { dad: 'carStory', mom: 'sink' });
    await face(page, 'dad', 300, 70);
    await page.mouse.move(683,430);await page.waitForTimeout(700);await shot(page,'talk-prompt');
    await page.setViewportSize({width:390,height:844});
    const touch=await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:195,y:2}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await waitFor(page,()=>GameInput.touch,10000*SCALE);
    await face(page,'dad',300,70);
    const urls={manifest:resources.find(u=>u.includes('/audio/voice/manifest.json')),script:await page.evaluate(()=>document.querySelector('script[src*="st-voice.js"]')?.src)};
    assert(urls.manifest&&urls.script,'Voice loader resources recorded');
    const stamp=new URL(urls.script).searchParams.get('v');assert(stamp&&new URL(urls.manifest).searchParams.get('v')===stamp,'Manifest uses current script build');
    await page.evaluate(()=>Cast.bind('voice-phone',{first:'Jaque',g:'m'}));
    await say(page, 'dad', 'bark.dad.bed2');
    await waitFor(page, () => NPCBubble.live.some(b => b.key === 'dad' && b.mode === 'head' && b.said.length > 20), 15000 * SCALE);
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = true; });
    const b = (await live(page))[0];
    assert(b.text.startsWith('JAQUE!'),'Sound-alike name is shown on phone');
    for(const file of ['/bark.dad.bed2.mp3','/names/dad-shout/jack.mp3'])assert(resources.some(u=>new URL(u).pathname.endsWith(file)&&new URL(u).searchParams.get('v')===stamp),'Recording uses current build token: '+file);
    assert(b.x >= 8 && b.x + b.w <= 390 - 8, 'Inside the phone screen: ' + JSON.stringify(b));
    assert(crossClear(b, 390, 844), 'Clear of the crosshair');
    const keep = await page.evaluate(() => [...document.querySelectorAll('.ht-acts .ht-b, .ht-stick, .st-objective:not([hidden])')].map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => ({ x: r.left, y: r.top, w: r.width, h: r.height })));
    for (const k of keep) assert(!(b.x < k.x + k.w && b.x + b.w > k.x && b.y < k.y + k.h && b.y + b.h > k.y), 'Bubble clear of touch control ' + JSON.stringify(k) + ' ' + JSON.stringify(b));
    await shot(page, 'phone-dad-near');
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);await shot(page,'phone-name-landscape');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => { House.setWalkFrom({ x: 300, y: -20, z: 400, lvl: 'U', seat: 0 }); House._.setMode('walk'); House.dirty(); const S = HouseFamily.debug.speech; S.freeze = false; S.until = 0; S.hard = 0; });
    await page.waitForTimeout(800 * SCALE);
    await say(page, 'mom', 'c1.wake.mom.shout', { force: false, call: true });
    await waitFor(page, () => NPCBubble.live.some(b => b.key === 'mom' && b.mode === 'edge' && b.x != null), 15000 * SCALE);
    await page.evaluate(() => { HouseFamily.debug.speech.freeze = true; }); await page.waitForTimeout(800); await shot(page, 'phone-mom-edge');
    const caption = await page.evaluate(() => [...document.querySelectorAll('.ht-acts .ht-b span')].map(s => s.textContent));
    assert(!caption.some(t => /<|kbd/.test(t)), 'No markup in touch buttons: ' + caption);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

clearTimeout(watchdog);
const bad = results.filter(r => !r[1]);
console.log(`SUMMARY ${results.length - bad.length}/${results.length} passed; shots in tests/shots/voices/`);
process.exit(bad.length || !results.length ? 1 : 0);
