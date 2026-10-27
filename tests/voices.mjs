// The family's voices and speech bubbles (js/st-voice.js, js/np-bubble.js, js/np-life.js, js/np-rig.js):
// a recorded line really plays (WebAudio buffer started on the voice bus, positional, music/effects ducked), the painted
// mouth follows the recording's loudness, the bubble hangs over the speaker's head with its tail at the mouth and types
// the words on with the audio, an off-screen or downstairs speaker gets an edge balloon pointing their way, two speakers
// never overlap, the bubble keeps clear of the crosshair, the prompt over a person reads "F Talk" once (no "F Use"),
// and with sound off nothing is fetched or played (bubble + timed mouth only), with no errors.
// Screenshots (desktop 1366x860 and phone portrait 390x844): tests/shots/voices/.
//   node voices.mjs http://localhost:PORT [--only=layout|speak|muted|edge|two|prompt|phone]
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';

const base = process.argv[2] && /^https?:/.test(process.argv[2]) ? process.argv[2] : 'http://localhost:18080';
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
const shots = fileURLToPath(new URL('shots/voices/', import.meta.url));
const SCALE = +process.env.SMOKE_SCALE || Math.max(1, Math.min(4, Math.round(os.loadavg()[0] / os.cpus().length * 13) / 10));
const pass = 'Throwaway-1999', results = [];
const G = 353;
async function register(name) { const r = await fetch(base + '/admin/register', { method: 'POST', headers: { 'x-admin-token': 'testtoken', 'content-type': 'application/json' }, body: JSON.stringify({ name, pass }) }); assert.equal(r.status, 200, 'register ' + name); }
async function check(name, fn) {
  if (only && only !== name) return;
  const t0 = Date.now();
  try { await fn(); results.push([name, true]); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  catch (e) { results.push([name, false]); console.log(`FAIL ${name}: ${String(e.stack || e).split('\n').slice(0, 5).join(' | ')}`); }
}
async function house(opts = {}) {
  const name = 'Voi' + Date.now().toString(36); await register(name);
  const f = await roomFixture(base, Object.assign({ hour: 18, account: name, password: pass, signup: false, timeoutScale: SCALE, storage: { jhp_audio_effects: 1, jhp_audio_music: 0, jhp_audio_volume: 1 } }, opts));
  for (let i = 0; i < 120 * SCALE && !(await f.page.evaluate(() => !!window.HouseFamily?.ready)); i++) await f.page.waitForTimeout(500);
  assert(await f.page.evaluate(() => !!window.HouseFamily?.ready), 'The family never arrived');
  await f.page.evaluate(() => window.st.loadVoices());
  return f;
}
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
    assert(r.e2.x <= 24, 'Left edge: ' + JSON.stringify(r.e2));
    assert(r.e3.x + 220 > 1300 && r.e3.y < 100, 'Up-right corner: ' + JSON.stringify(r.e3));
    assert(r.t.side === 'b' && r.t.ty > 160 && r.t.ty <= 160 + 46.1, 'Tail from the bottom towards the mouth: ' + JSON.stringify(r.t));
    assert(r.s[1].y + 60 <= r.s[0].y - 6 || r.s[1].y >= r.s[0].y + 60, 'Stacked, not overlapping: ' + JSON.stringify(r.s));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- a recorded line: heard, positional, mouth from the audio
await check('speak', async () => {
  const { browser, page, errors } = await house({ tier: 'high' });
  try {
    await stage(page, { dad: 'carStory', mom: 'sink' });
    await look(page, [318, G - 128, 735], [318, G - 152, 800], 'G');
    await page.keyboard.press('Shift'); // (a user gesture: the browser allows sound)
    const ok = await page.evaluate(() => { Sound.effectsOn = true; return !!Sound.unlock() && Sound.voicesOn && !!st.voiceInfo('c2.pocket.dad'); });
    assert(ok, 'Sound on, the manifest lists c2.pocket.dad');
    assert(await say(page, 'dad', 'c2.pocket.dad'), 'Dad says it');
    await page.waitForFunction(() => st.voicesPlaying.includes('c2.pocket.dad'), null, { timeout: 15000 * SCALE });
    const s = await page.evaluate(async () => {
      const r = HouseFamily.chars.dad.rig, out = { mouth: [], frames: new Set(), said: [], level: [] };
      for (let i = 0; i < 16; i++) { out.mouth.push(r.st.mouth); out.frames.add(r.face.mouth); out.level.push(r.st.talkVoice?.level() || 0); out.said.push(NPCBubble.live[0]?.said.length || 0); await new Promise(q => setTimeout(q, 110)); }
      const v = r.st.talkVoice;
      return { mouth: out.mouth, frames: [...out.frames], said: out.said, level: out.level, started: !!v?.started, panner: !!v?.panner, ducked: Sound.ducked, b: NPCBubble.live[0] };
    });
    assert(s.started && s.panner, 'The recording started, positional (panner from the head)');
    assert(s.ducked || s.said.at(-1) >= s.b.text.length, 'Music and effects dip under the voice');
    assert(Math.max(...s.level) > 0.3, 'The voice has level: ' + s.level.map(v => v.toFixed(2)));
    assert(Math.max(...s.mouth) - Math.min(...s.mouth) > 0.2 && s.frames.length > 1, 'Mouth follows the audio: ' + s.mouth.map(v => v.toFixed(2)).join(','));
    assert(s.b && s.b.key === 'dad' && s.b.mode === 'head', 'Bubble over Dad\'s head: ' + JSON.stringify(s.b));
    assert(s.said[0] < s.said.at(-1), 'Words typed on with the voice: ' + s.said.join(','));
    const vw = 1366, vh = 860; assert(crossClear(s.b, vw, vh), 'Bubble clear of the crosshair: ' + JSON.stringify(s.b));
    const tail = s.b.tail; assert(tail && tail.ty > s.b.y + s.b.h - 2, 'Tail points down at the mouth: ' + JSON.stringify(tail));
    assert(!(await page.evaluate(() => document.querySelector('.hs-note.on')?.textContent || '')).includes('pocket'), 'No subtitle box by default');
    await shot(page, 'dad-near');
    await page.waitForFunction(() => !st.voicesPlaying.length, null, { timeout: 15000 * SCALE });
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => Sound.ducked), false, 'Ducking released');
    // far: across the drive
    await look(page, [150, G - 128, 1150], [318, G - 152, 800], 'G');
    await say(page, 'dad', 'c2.pocket.dad2');
    await page.waitForFunction(() => st.voicesPlaying.includes('c2.pocket.dad2'), null, { timeout: 15000 * SCALE });
    await page.waitForTimeout(1300); await shot(page, 'dad-far');
    const far = (await live(page))[0]; assert(far && far.mode === 'head', 'Far: still over his head ' + JSON.stringify(far));
    // subtitles option: the box too
    await page.evaluate(() => { st.subtitles = true; HouseFamily.debug.speech.until = 0; HouseFamily.debug.speech.hard = 0; });
    await say(page, 'dad', 'c2.pocket.dad3');
    await page.waitForFunction(() => (document.querySelector('.hs-note.on')?.textContent || '').length > 10, null, { timeout: 15000 * SCALE });
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
    await look(page, [318, G - 128, 735], [318, G - 152, 800], 'G');
    await page.keyboard.press('Shift');
    await say(page, 'dad', 'c2.pocket.dad');
    await page.waitForFunction(() => HouseFamily.debug.speech.cur?.lineId === 'c2.pocket.dad', null, { timeout: 15000 * SCALE });
    const m = await page.evaluate(async () => { const r = HouseFamily.chars.dad.rig, s = []; for (let i = 0; i < 12; i++) { s.push(r.st.mouth); await new Promise(q => setTimeout(q, 90)); } return { s, playing: st.voicesPlaying, b: NPCBubble.live[0] }; });
    assert(Math.max(...m.s) - Math.min(...m.s) > 0.2, 'Timed mouth still moves: ' + m.s.map(v => v.toFixed(2)));
    assert.deepEqual(m.playing, []); assert(m.b && m.b.mode === 'head', 'Bubble still shows');
    assert.deepEqual(fetched, [], 'No voice files fetched with sound off');
    // turning sound on and off mid-line never throws
    await page.evaluate(() => { Sound.effectsOn = true; Sound.setVolume(0); Sound.effectsOn = false; Sound.setVolume(1); });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
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
    assert(await say(page, 'mom', 'c1.wake.mom.shout', { force: false, call: true }), 'Mom shouts up the stairs');
    await page.waitForFunction(() => NPCBubble.live.some(b => b.key === 'mom' && b.mode), null, { timeout: 15000 * SCALE });
    await page.waitForTimeout(700);
    const b = (await live(page)).find(b => b.key === 'mom');
    assert(b && b.mode === 'edge', 'Edge balloon for Mom downstairs: ' + JSON.stringify(b));
    const name = await page.evaluate(() => document.querySelector('.np-bub .np-bub-name')?.textContent);
    assert(/Mom/.test(name) && /downstairs/.test(name), 'Name tab says where: ' + name);
    await shot(page, 'mom-downstairs-edge');
    // behind you: Dad at the car while you face the house
    await page.evaluate(() => { HouseFamily.debug.speech.until = 0; HouseFamily.debug.speech.hard = 0; HouseFamily.debug.speech.q.length = 0; });
    await look(page, [318, G - 128, 960], [318, G - 140, 1300], 'G');
    await say(page, 'dad', 'c2.pocket.dad');
    await page.waitForFunction(() => NPCBubble.live.some(b => b.key === 'dad' && b.mode && !b.out), null, { timeout: 15000 * SCALE });
    await page.waitForTimeout(700);
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
    await stage(page, { mom: 'hallStairs', sister: 'hallYoyo' });
    await look(page, [262, G - 128, 330], [256, G - 130, 500], 'G');
    await page.keyboard.press('Shift');
    await say(page, 'sister', 'c1.sis.stairs'); await say(page, 'mom', 'c1.mom.carry');
    await page.waitForFunction(() => HouseFamily.debug.speech.cur?.c.id === 'mom', null, { timeout: 30000 * SCALE });
    await page.waitForTimeout(250);
    const bs = await live(page);
    await shot(page, 'two-speakers');
    if (bs.length >= 2) { const [a, b] = bs; assert(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'Two balloons never overlap: ' + JSON.stringify(bs)); }
    assert(bs.some(b => b.key === 'mom'), 'Mom\'s balloon is up');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

await check('prompt', async () => {
  const { browser, page, errors } = await house();
  try {
    await stage(page, { dad: 'carStory' });
    await look(page, [318, G - 128, 735], [318, G - 150, 800], 'G');
    await page.mouse.move(683, 430); await page.waitForTimeout(900);
    const tip = await page.evaluate(() => { const t = document.querySelector('.hs-tip'); return { on: t.classList.contains('on'), text: t.textContent }; });
    assert(tip.on && /Talk/.test(tip.text) && !/Use/.test(tip.text), 'One clear action over Dad: ' + JSON.stringify(tip));
    assert.equal((tip.text.match(/\bF\b/g) || []).length, 1, 'F shown once: ' + tip.text);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

// ---------------------------------------------------------------- phone portrait
await check('phone', async () => {
  const { browser, page, errors } = await house({ tier: 'low', width: 390, height: 844, touch: true });
  try {
    await stage(page, { dad: 'carStory', mom: 'sink' });
    await look(page, [318, G - 128, 700], [318, G - 150, 800], 'G');
    await page.mouse.click(5, 5);
    await say(page, 'dad', 'c2.pocket.dad');
    await page.waitForFunction(() => NPCBubble.live.some(b => b.key === 'dad' && b.mode === 'head' && b.said.length > 20), null, { timeout: 15000 * SCALE });
    const b = (await live(page))[0];
    assert(b.x >= 8 && b.x + b.w <= 390 - 8, 'Inside the phone screen: ' + JSON.stringify(b));
    assert(crossClear(b, 390, 844), 'Clear of the crosshair');
    const keep = await page.evaluate(() => [...document.querySelectorAll('.ht-acts .ht-b, .ht-stick, .st-objective:not([hidden])')].map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => ({ x: r.left, y: r.top, w: r.width, h: r.height })));
    for (const k of keep) assert(!(b.x < k.x + k.w && b.x + b.w > k.x && b.y < k.y + k.h && b.y + b.h > k.y), 'Bubble clear of touch control ' + JSON.stringify(k) + ' ' + JSON.stringify(b));
    await shot(page, 'phone-dad-near');
    await page.evaluate(() => { House.setWalkFrom({ x: 300, y: -20, z: 400, lvl: 'U', seat: 0 }); House._.setMode('walk'); House.dirty(); HouseFamily.debug.speech.until = 0; HouseFamily.debug.speech.hard = 0; });
    await page.waitForTimeout(800 * SCALE);
    await say(page, 'mom', 'c1.wake.mom.shout', { force: false, call: true });
    await page.waitForFunction(() => NPCBubble.live.some(b => b.key === 'mom' && b.mode === 'edge'), null, { timeout: 15000 * SCALE });
    await page.waitForTimeout(800); await shot(page, 'phone-mom-edge');
    const caption = await page.evaluate(() => [...document.querySelectorAll('.ht-acts .ht-b span')].map(s => s.textContent));
    assert(!caption.some(t => /<|kbd/.test(t)), 'No markup in touch buttons: ' + caption);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

clearTimeout(watchdog);
const bad = results.filter(r => !r[1]);
console.log(`SUMMARY ${results.length - bad.length}/${results.length} passed; shots in tests/shots/voices/`);
process.exit(bad.length ? 1 : 0);
