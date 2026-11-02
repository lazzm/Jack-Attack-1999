// Unit tests (no browser): js/st-voice.js plays a recorded line through Sound's voice bus (buffer source started,
// positional panner, ducking on/off, level from the analyser), stays silent and fetches nothing with sound off or muted,
// falls back (null) for lines with no recording; js/sound.js gives voices their own bus; js/np-bubble.js layout maths.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), {createHash} = require('node:crypto');
const js = f => fs.readFileSync(path.join(__dirname, '../app/public/js', f), 'utf8');
// (the clips are generated outside git by tools/audio/gen-lines.mjs; without them, a stand-in manifest tests the player)
const mPath = path.join(__dirname, '../app/public/audio/voice/manifest.json'), real = fs.existsSync(mPath) && JSON.parse(fs.readFileSync(mPath, 'utf8'))['c2.pocket.dad'] != null;
const manifest = real ? JSON.parse(fs.readFileSync(mPath, 'utf8')) : Object.fromEntries(['c2.pocket.dad', 'c2.pocket.dad2', 'c2.pocket.dad3'].map(id => [id, { file: id + '.mp3', character: 'dad', dur: 4 }]));
// every manifest entry has its file
if (real) for (const [id, m] of Object.entries(manifest)) assert(fs.existsSync(path.join(__dirname, '../app/public/audio/voice', m.file)), 'missing ' + m.file);
const namePath = path.join(__dirname, '../app/public/audio/voice/names/manifest.json');
if (fs.existsSync(namePath)) for (const pool of Object.values(JSON.parse(fs.readFileSync(namePath)))) for (const m of Object.values(pool)) {
  assert(fs.existsSync(path.join(path.dirname(namePath), m.file)), 'missing name ' + m.file); assert(m.dur > 0 && m.dur < 8);
}
const ledgerPath = path.join(__dirname, '../tools/audio/releases/voices-final-2026-11-01.json');
if (real && fs.existsSync(ledgerPath)) {
  const release=JSON.parse(fs.readFileSync(ledgerPath)), baseline=JSON.parse(fs.readFileSync(path.join(path.dirname(ledgerPath),release.baseline)));
  const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  for(const [id,r] of Object.entries({...baseline.accepted,...release.accepted})) assert.equal(sha(path.join(path.dirname(mPath),manifest[id].file)),r.sha256,'audited line bytes '+id);
  for(const {id} of release.excluded) assert(!manifest[id],'withheld line '+id);
  const names=JSON.parse(fs.readFileSync(namePath));
  for(const [id,r] of Object.entries(release.names.accepted)) { const [speaker,first]=id.toLowerCase().split('/'); assert.equal(names[speaker][first].file,r.file);assert.equal(sha(path.join(path.dirname(namePath),r.file)),r.sha256,'audited name bytes '+id); }
  for(const id of Object.keys(release.names.excluded)){const [speaker,first]=id.toLowerCase().split('/');assert(!names[speaker]?.[first],'withheld name '+id);}
  for(const speaker of ['mom-shout','mom-call','dad-shout','sis-whine']) assert(names[speaker].jack,'owner Jack recording '+speaker);
}
const nameManifest = Object.fromEntries(['mom-shout', 'mom-call', 'dad-shout', 'sis-whine'].map(s => [s,
  Object.fromEntries(['jack', 'jake', 'sarah', 'john', 'jane', 'beth'].map(n => [n, { file: s + '/' + n + '.mp3', dur: 0.7 }]))]));
const nameLines = { 'c1.wake.mom.shout': ['mom', 'Breakfast!', 'downstairs', 'mom-shout'], 'c1.wake.mom.call': ['mom', 'Up!', 'downstairs', 'mom-call'],
  'c3.hangup.dad': ['dad', 'Oi!', 'downstairs', 'dad-shout'], 'c1.sis.stairs': ['sister', 'Mine?', null, 'sis-whine'] };
for (const [id, l] of Object.entries(nameLines)) if (!manifest[id]) manifest[id] = {file: id + '.mp3', character:l[0], dur:2.5};
// and every recorded family line is one the people can say (np-lines.js), with the same speaker
{ const w = {}; vm.runInNewContext(js('np-lines.js'), { window: w }); for (const [id, m] of Object.entries(manifest)) if (['mom', 'dad', 'sister', 'gran'].includes(m.character)) { assert(w.NPCLines[id], 'recorded line not in np-lines: ' + id); assert.equal(w.NPCLines[id][0], m.character, id); } }

class Param { constructor(v = 1) { this.value = v; } setValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } cancelScheduledValues() {} linearRampToValueAtTime(v) { this.value = v; } exponentialRampToValueAtTime(v) { this.value = v; } }
class Node { constructor(kind) { this.kind = kind; this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); this.connections = []; } connect(n) { this.connections.push(n); return n; } disconnect() {} start(t) { this.startedAt = t; } stop() { if (this.onended) this.onended(); } }
let ctxs = [];
class Ctx {
  constructor() { this.destination = { kind: 'dest' }; this.state = 'running'; this.currentTime = 0; this.sampleRate = 24000; this.listener = { setPosition() {}, setOrientation() {} }; ctxs.push(this); this.sources = []; }
  createGain() { return new Node('gain'); } createOscillator() { return new Node('osc'); } createBiquadFilter() { return new Node('filter'); }
  createBuffer(numberOfChannels = 1, length = 100, sampleRate = 24000) { const data = Array.from({length:numberOfChannels}, () => new Float32Array(length)); return { numberOfChannels, length, sampleRate, duration:length/sampleRate, getChannelData: i => data[i] }; }
  createBufferSource() { const n = new Node('source'); this.sources.push(n); return n; }
  createPanner() { const n = new Node('panner'); n.setPosition = (x, y, z) => { n.pos = [x, y, z]; }; return n; }
  createAnalyser() { const n = new Node('analyser'); n.fftSize = 512; n.getFloatTimeDomainData = d => { for (let i = 0; i < d.length; i++) d[i] = Math.sin(i / 3) * 0.3; }; return n; }
  decodeAudioData(b, ok) { const buf = this.createBuffer(1, 60000, this.sampleRate); ok(buf); return Promise.resolve(buf); }
  resume() {}
}
function world(storage) {
  const store = new Map(Object.entries(storage)), fetched = [], events = {};
  const w = {
    localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)) },
    document: { currentScript: { src: 'http://localhost/js/st-voice.js?v=unit-build' }, dispatchEvent: e => (events[e.type] || []).forEach(f => f(e)), addEventListener: (t, f) => (events[t] = events[t] || []).push(f), removeEventListener() {} },
    Event: class { constructor(type) { this.type = type; } }, setInterval: () => 1, clearInterval() {}, setTimeout: f => { f(); return 1; },
    navigator: { userActivation: { hasBeenActive: true } }, AudioContext: Ctx, performance: { now: () => 0 },
    Cast: { me: () => ({first: w.first || 'Jack'}) }, NPCLines: nameLines,
    requestAnimationFrame: () => 1, requestIdleCallback: f => f(),
    fetch: async url => { fetched.push(url); if (/names\/manifest\.json(?:\?|$)/.test(url)) return { ok: true, json: async () => nameManifest }; if (/manifest\.json(?:\?|$)/.test(url)) return { ok: true, json: async () => manifest }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(16) }; },
    speechSynthesis: { cancel() {} }, console,
  };
  w.window = w; vm.createContext(w);
  vm.runInContext(js('sound.js'), w); vm.runInContext(js('st-voice.js'), w);
  return { w, fetched };
}
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  // ---- sound on: the line plays on the voice bus, positional, ducking music/effects while it lasts
  { const { w, fetched } = world({ jhp_audio_effects: '1', jhp_audio_music: '1', jhp_audio_volume: '0.8' });
    await w.st.loadVoices(); await tick();
    const id = 'c2.pocket.dad'; assert(w.st.voiceInfo(id), 'manifest lists ' + id); assert(fetched.includes('audio/voice/manifest.json?v=unit-build'), 'Manifest inherits its script build token');
    assert.equal(w.st.voiceInfo('unit.no-recording'), null, 'no recording: no info');
    assert.equal(w.st.play('unit.no-recording', {}), null, 'no recording: no handle (bubble + timed mouth)');
    const h = w.st.say(id, 'Dad', 'Saving up', 3000, { bubble: true, pos: () => ({ x: 1, y: 2, z: 3 }), through: () => true });
    assert(h, 'handle'); for (let i = 0; i < 5; i++) await tick();
    assert(fetched.some(u => u.endsWith(id + '.mp3?v=unit-build')), 'fetched the clip lazily');
    const c = ctxs.at(-1), src = c.sources.at(-1);
    assert(h.started && src && src.startedAt !== undefined, 'buffer source started');
    assert(h.panner, 'positional panner');
    // the chain ends on Sound's voice bus
    const bus = w.Sound.output(c, 'voice'); let n = src, hops = 0; while (n && n !== bus && hops < 12) { n = n.connections[0]; hops++; }
    assert.equal(n, bus, 'routed to the voice bus');
    assert.equal(bus.gain.value, 0.8, 'voice bus at the volume');
    assert(w.Sound.ducked, 'ducked while talking'); assert(w.Sound.output(c, 'music').gain.value < 0.8, 'music dips');
    assert(h.level() > 0.3, 'level from the analyser: ' + h.level());
    assert.deepEqual([...w.st.voicesPlaying], [id]);
    src.stop(); assert(h.ended && !w.Sound.ducked, 'ended: ducking released'); assert.equal(w.Sound.output(c, 'music').gain.value, 0.8);
    // muting mid-line stops it
    const h2 = w.st.play('c2.pocket.dad2', {}); for (let i = 0; i < 5; i++) await tick(); assert(h2.started);
    w.Sound.effectsOn = false; assert(h2.ended, 'switching effects & voices off stops the voice'); assert.equal(bus.gain.value, 0, 'voice bus silent');
    assert.equal(w.st.play('c2.pocket.dad3', {}), null, 'off: no new voice');
    // the subtitle setting persists
    w.st.subtitles = true; assert.equal(w.localStorage.getItem('jhp_subtitles2'), '1'); }
  // ---- sound off from the start: nothing fetched but the manifest
  { const { w, fetched } = world({ jhp_audio_effects: '0', jhp_audio_volume: '1' });
    await w.st.loadVoices(); await tick();
    assert.equal(w.st.say('c2.pocket.dad', 'Dad', 'x', 2000, { bubble: true }), null); assert.equal(w.st.prefetch('c2.pocket.dad'), undefined);
    for (let i = 0; i < 3; i++) await tick();
    assert(!fetched.some(u => /\.mp3(?:\?|$)/.test(u)), 'no clip fetched with sound off: ' + fetched); }
  // ---- volume 0 counts as muted
  { const { w } = world({ jhp_audio_effects: '1', jhp_audio_volume: '0' }); await w.st.loadVoices(); assert.equal(w.st.play('c2.pocket.dad', {}), null, 'volume 0: silent'); }
  // ---- name call-outs use the chosen first name, never the account handle; exact and sound-alike names
  { const {w, fetched} = world({jhp_audio_effects:'1', jhp_audio_volume:'1'}); await w.st.loadVoices();
    for (const first of ['Jack', 'JACK', 'jAcK', 'Jak', 'Jac', 'Jakk', 'Jaque']) { w.first=first; assert.equal(w.st.voiceName('c1.wake.mom.shout').id, 'mom-shout/jack'); }
    w.first='Sarah'; assert.equal(w.st.voiceName('c1.wake.mom.shout').id, 'mom-shout/sarah');
    w.first='Sara'; assert.equal(w.st.voiceName('c1.wake.mom.shout').id, 'mom-shout/sarah');
    w.first='Jack';
    assert.equal(w.st.voiceText('c1.wake.mom.shout', 'Breakfast!'), 'JACK! Breakfast!');
    assert.equal(w.st.voiceText('c1.wake.mom.shout', 'JACK! Breakfast!'), 'JACK! Breakfast!', 'house text is never prefixed twice');
    w.Room={say:(who,text)=>{w.lastSubtitle=text;}};
    w.st.say('c1.wake.mom.shout','Mom','Breakfast!',2000,{audio:false});
    assert.equal(w.lastSubtitle,'JACK! Breakfast!','direct callers show the same name as their audio');
    assert.equal(w.st.voiceText('c1.wake.mom.call', 'Up!'), 'Jack, love? Up!');
    for (const [id,speaker] of Object.entries({'c1.wake.mom.shout':'mom-shout','c1.wake.mom.call':'mom-call','c3.hangup.dad':'dad-shout','c1.sis.stairs':'sis-whine'})) {
      const h=w.st.play(id,{}); for(let i=0;i<6;i++)await tick();
      assert(h.started, 'name and line decoded'); assert.equal(h.nameId,speaker+'/jack');
      assert.equal(h.dur,5.1,'one source contains name, 100ms gap and complete line');
      assert(fetched.includes('audio/voice/names/'+speaker+'/jack.mp3?v=unit-build')); h.stop();
    }
    const warm=fetched.length, repeated=w.st.play('c1.wake.mom.shout',{});for(let i=0;i<6;i++)await tick();
    assert(repeated.started);assert.equal(fetched.length,warm,'a repeated call-out reuses both decoded clips');repeated.stop();
    const before=fetched.filter(u=>u.includes('/names/')&&u.includes('.mp3')).length;
    w.first='UnknownPerson'; assert.equal(w.st.voiceName('c1.wake.mom.shout'),null); assert.equal(w.st.voiceText('c1.wake.mom.shout','Breakfast!'),'Breakfast!');
    const h=w.st.play('c1.wake.mom.shout',{});for(let i=0;i<6;i++)await tick(); assert(h.started);assert.equal(h.nameId,null);assert.equal(h.dur,2.5);h.stop();
    assert.equal(fetched.filter(u=>u.includes('/names/')&&u.includes('.mp3')).length,before,'fallback fetches no name');
    w.first='Jahck'; assert.equal(w.st.voiceName('c1.wake.mom.shout'),null,'ambiguous phonetics must fall back');
    w.first='Bath'; assert.equal(w.st.voiceName('c1.wake.mom.shout'),null,'different vowel must not select Beth');
    assert.equal(w.st.voiceName('c2.pocket.dad'),null,'ordinary dialogue has no call-out');
    w.first='Jack'; const pending=w.st.play('c1.wake.mom.shout',{});w.st.stopVoice();for(let i=0;i<6;i++)await tick();
    assert(pending.ended&&!pending.started,'cancelling during decode cannot start a late name');
    const playing=w.st.play('c1.wake.mom.shout',{});for(let i=0;i<6;i++)await tick();assert(playing.started);
    w.Sound.effectsOn=false;assert(playing.ended,'muting stops the whole name and line');assert.equal(w.Sound.ducked,false);
  }
  for (const storage of [{jhp_audio_effects:'0',jhp_audio_volume:'1'}, {jhp_audio_effects:'1',jhp_audio_volume:'0'}]) {
    const {w,fetched}=world(storage);await w.st.loadVoices();
    assert.equal(w.st.voiceText('c1.wake.mom.shout','Breakfast!'),'JACK! Breakfast!','muted still displays player name');
    assert.equal(w.st.play('c1.wake.mom.shout',{}),null);w.st.prefetch('c1.wake.mom.shout');await tick();assert(!fetched.some(u=>u.includes('.mp3')),'muted name means no audio fetch');
  }
  { const {w,fetched}=world({jhp_audio_effects:'1',jhp_audio_volume:'1'});w.navigator.userActivation.hasBeenActive=false;await w.st.loadVoices();
    assert.equal(w.st.play('c1.wake.mom.shout',{}),null);w.st.prefetch('c1.wake.mom.shout');await tick();assert(!fetched.some(u=>u.includes('.mp3')),'no user gesture: no name fetched'); }
  // ---- bubble layout maths
  { const w = { window: null, House: null }; w.window = w; vm.createContext(w); vm.runInContext(js('np-bubble.js'), w);
    const L = w.NPCBubble.layout, view = { w: 390, h: 844, m: 10, top: 8 }, cross = { x: 161, y: 388, w: 68, h: 68 };
    const a = L.place({ x: 195, y: 470 }, 250, 80, view, [cross], 18);
    assert(a.y + 80 <= 388 - 6 || a.y >= 456, 'lifted clear of the crosshair ' + JSON.stringify(a));
    const e = L.edge({ x: 0, y: 1 }, 220, 60, view, []); assert(e.y + 60 >= 844 - 44 && e.x >= 10, 'bottom edge ' + JSON.stringify(e));
    const e2 = L.edge({ x: 1, y: 0 }, 220, 60, view, []); assert(e2.x + 220 <= 390 - 10 && e2.x + 220 >= 390 - 44, 'right edge ' + JSON.stringify(e2));
    const t = L.tail({ x: 10, y: 10, w: 200, h: 50 }, { x: 400, y: 30 }, 22, 14); assert(t.side === 'r' && t.tx - t.bx <= 22.01, 'edge arrow points right ' + JSON.stringify(t)); }
  console.log('VOICES UNIT PASS: release hashes + withheld assets, speakers, lazy fetch, positional voice bus, ducking, analyser, name/alias selection, combined playback/cancellation, mute/volume 0/no-gesture silence, generic fallback, subtitles, bubble layout');
})().catch(e => { console.error(e); process.exit(1); });
