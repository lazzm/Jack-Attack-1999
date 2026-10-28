// Unit tests (no browser): js/st-voice.js plays a recorded line through Sound's voice bus (buffer source started,
// positional panner, ducking on/off, level from the analyser), stays silent and fetches nothing with sound off or muted,
// falls back (null) for lines with no recording; js/sound.js gives voices their own bus; js/np-bubble.js layout maths.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const js = f => fs.readFileSync(path.join(__dirname, '../app/public/js', f), 'utf8');
// (the clips are generated outside git by tools/audio/gen-lines.mjs; without them, a stand-in manifest tests the player)
const mPath = path.join(__dirname, '../app/public/audio/voice/manifest.json'), real = fs.existsSync(mPath);
const manifest = real ? JSON.parse(fs.readFileSync(mPath, 'utf8')) : Object.fromEntries(['c2.pocket.dad', 'c2.pocket.dad2', 'c2.pocket.dad3'].map(id => [id, { file: id + '.mp3', character: 'dad', dur: 4 }]));
// every manifest entry has its file
if (real) for (const [id, m] of Object.entries(manifest)) assert(fs.existsSync(path.join(__dirname, '../app/public/audio/voice', m.file)), 'missing ' + m.file);
// and every recorded family line is one the people can say (np-lines.js), with the same speaker
{ const w = {}; vm.runInNewContext(js('np-lines.js'), { window: w }); for (const [id, m] of Object.entries(manifest)) if (['mom', 'dad', 'sister', 'gran'].includes(m.character)) { assert(w.NPCLines[id], 'recorded line not in np-lines: ' + id); assert.equal(w.NPCLines[id][0], m.character, id); } }

class Param { constructor(v = 1) { this.value = v; } setValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } cancelScheduledValues() {} linearRampToValueAtTime(v) { this.value = v; } exponentialRampToValueAtTime(v) { this.value = v; } }
class Node { constructor(kind) { this.kind = kind; this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); this.connections = []; } connect(n) { this.connections.push(n); return n; } disconnect() {} start(t) { this.startedAt = t; } stop() { if (this.onended) this.onended(); } }
let ctxs = [];
class Ctx {
  constructor() { this.destination = { kind: 'dest' }; this.state = 'running'; this.currentTime = 0; this.sampleRate = 24000; this.listener = { setPosition() {}, setOrientation() {} }; ctxs.push(this); this.sources = []; }
  createGain() { return new Node('gain'); } createOscillator() { return new Node('osc'); } createBiquadFilter() { return new Node('filter'); }
  createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
  createBufferSource() { const n = new Node('source'); this.sources.push(n); return n; }
  createPanner() { const n = new Node('panner'); n.setPosition = (x, y, z) => { n.pos = [x, y, z]; }; return n; }
  createAnalyser() { const n = new Node('analyser'); n.fftSize = 512; n.getFloatTimeDomainData = d => { for (let i = 0; i < d.length; i++) d[i] = Math.sin(i / 3) * 0.3; }; return n; }
  decodeAudioData(b, ok) { const buf = { duration: 2.5, bytes: b.byteLength }; ok(buf); return Promise.resolve(buf); }
  resume() {}
}
function world(storage) {
  const store = new Map(Object.entries(storage)), fetched = [], events = {};
  const w = {
    localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)) },
    document: { dispatchEvent: e => (events[e.type] || []).forEach(f => f(e)), addEventListener: (t, f) => (events[t] = events[t] || []).push(f), removeEventListener() {} },
    Event: class { constructor(type) { this.type = type; } }, setInterval: () => 1, clearInterval() {}, setTimeout: f => { f(); return 1; },
    navigator: { userActivation: { hasBeenActive: true } }, AudioContext: Ctx, performance: { now: () => 0 },
    requestAnimationFrame: () => 1, requestIdleCallback: f => f(),
    fetch: async url => { fetched.push(url); if (/manifest\.json$/.test(url)) return { ok: true, json: async () => manifest }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(16) }; },
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
    const id = 'c2.pocket.dad'; assert(w.st.voiceInfo(id), 'manifest lists ' + id);
    assert.equal(w.st.voiceInfo('c1.wake.mom.shout'), null, 'no recording: no info');
    assert.equal(w.st.play('c1.wake.mom.shout', {}), null, 'no recording: no handle (bubble + timed mouth)');
    const h = w.st.say(id, 'Dad', 'Saving up', 3000, { bubble: true, pos: () => ({ x: 1, y: 2, z: 3 }), through: () => true });
    assert(h, 'handle'); for (let i = 0; i < 5; i++) await tick();
    assert(fetched.some(u => u.endsWith(id + '.mp3')), 'fetched the clip lazily');
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
    w.st.subtitles = true; assert.equal(w.localStorage.getItem('jhp_subtitles'), '1'); }
  // ---- sound off from the start: nothing fetched but the manifest
  { const { w, fetched } = world({ jhp_audio_effects: '0', jhp_audio_volume: '1' });
    await w.st.loadVoices(); await tick();
    assert.equal(w.st.say('c2.pocket.dad', 'Dad', 'x', 2000, { bubble: true }), null); assert.equal(w.st.prefetch('c2.pocket.dad'), undefined);
    for (let i = 0; i < 3; i++) await tick();
    assert(!fetched.some(u => /\.mp3$/.test(u)), 'no clip fetched with sound off: ' + fetched); }
  // ---- volume 0 counts as muted
  { const { w } = world({ jhp_audio_effects: '1', jhp_audio_volume: '0' }); await w.st.loadVoices(); assert.equal(w.st.play('c2.pocket.dad', {}), null, 'volume 0: silent'); }
  // ---- bubble layout maths
  { const w = { window: null, House: null }; w.window = w; vm.createContext(w); vm.runInContext(js('np-bubble.js'), w);
    const L = w.NPCBubble.layout, view = { w: 390, h: 844, m: 10, top: 8 }, cross = { x: 161, y: 388, w: 68, h: 68 };
    const a = L.place({ x: 195, y: 470 }, 250, 80, view, [cross], 18);
    assert(a.y + 80 <= 388 - 6 || a.y >= 456, 'lifted clear of the crosshair ' + JSON.stringify(a));
    const e = L.edge({ x: 0, y: 1 }, 220, 60, view, []); assert(e.y + 60 >= 844 - 44 && e.x >= 10, 'bottom edge ' + JSON.stringify(e));
    const e2 = L.edge({ x: 1, y: 0 }, 220, 60, view, []); assert(e2.x + 220 <= 390 - 10 && e2.x + 220 >= 390 - 44, 'right edge ' + JSON.stringify(e2));
    const t = L.tail({ x: 10, y: 10, w: 200, h: 50 }, { x: 400, y: 30 }, 22, 14); assert(t.side === 'r' && t.tx - t.bx <= 22.01, 'edge arrow points right ' + JSON.stringify(t)); }
  console.log('VOICES UNIT PASS: manifest files + speakers, lazy fetch, voice bus routing, positional, ducking, analyser level, mute/volume 0 silence, no-recording fallback, subtitles setting, bubble layout');
})().catch(e => { console.error(e); process.exit(1); });
