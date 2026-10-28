// Offline tests (ffmpeg only, no API): silence splitting, robust batch splitter, transcript matching, fx chains.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import os from 'node:os'; import fs from 'node:fs'; import path from 'node:path';
import { detectSegments, parseSilences, segmentsFrom, internalGaps, expectedDur, plausible, pickLongest, bestSplit,
  splitCandidates, chooseSplit, clipOptions, splitFile, similarity, verify, pcmToWav, archiveRaw, listRaw, FX } from './lines-lib.mjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'splt-'));
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const probe = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
let nwav = 0;
// spec: [['t', secs] | ['s', secs]] -> tones/silences, plus a faint noise floor (~-60 dB) like a real recording.
function makeWav(spec) {
  const wav = dir + `/w${nwav++}.wav`, inputs = [], labels = [];
  spec.forEach(([k, d], i) => {
    inputs.push('-f', 'lavfi', '-i', k === 't' ? `sine=frequency=${300 + 37 * (i % 11)}:duration=${d}:sample_rate=24000` : `anullsrc=r=24000:cl=mono:d=${d}`);
    labels.push(`[${i}:a]`);
  });
  const total = spec.reduce((a, [, d]) => a + d, 0);
  inputs.push('-f', 'lavfi', '-i', `anoisesrc=r=24000:a=0.001:d=${total}`);
  ff(...inputs, '-filter_complex', labels.join('') + `concat=n=${spec.length}:v=0:a=1[c];[c][${spec.length}:a]amix=inputs=2:normalize=0[o]`, '-map', '[o]', '-ac', '1', wav);
  return wav;
}
// Build a batch: texts -> tones of expectedDur (x jitter), separators `seps[i]`; `pauses[i]` = intra-line pause (s) at the middle.
function batch(texts, seps, { pauses = {}, jitter = [], lead = 0.3, tail = 0.5, junk = 0, click = 0 } = {}) {
  const spec = [['s', lead]], truth = []; let t = lead;
  if (junk) { spec.push(['t', junk], ['s', 1.2]); t += junk + 1.2; }
  texts.forEach((x, i) => {
    const d = expectedDur(x) * (jitter[i] || 1), a = t;
    if (pauses[i]) { spec.push(['t', d / 2], ['s', pauses[i]], ['t', d / 2]); t += d + pauses[i]; } else { spec.push(['t', d]); t += d; }
    truth.push([a, t]);
    if (i < texts.length - 1) { spec.push(['s', seps[i]]); t += seps[i]; }
  });
  spec.push(['s', tail]); if (click) spec.push(['t', click], ['s', 0.35]);
  return { wav: makeWav(spec), truth };
}
const near = (clips, truth, tol = 0.12) => clips.length === truth.length && clips.every((c, i) => Math.abs(c.a - truth[i][0]) < tol && Math.abs(c.b - truth[i][1]) < tol);
const show = cl => cl.map(c => `${c.a.toFixed(2)}-${c.b.toFixed(2)}${c.suspect ? '!' : ''}`).join(' ');

// ---- old fixed-gap detector still behaves (0.4 s gap is below 0.9: tones 3+4 merge -> 4 segments)
{
  const wav = makeWav([['t', 0.8], ['s', 1.2], ['t', 1.2], ['s', 1.5], ['t', 0.5], ['s', 0.4], ['t', 1.0], ['s', 1.3], ['t', 0.6], ['s', 1.0]]);
  const segs = detectSegments(wav, probe(wav));
  assert.equal(segs.length, 4);
  assert.ok(Math.abs(segs[0][1] - 0.8) < 0.1 && Math.abs(segs[1][0] - 2.0) < 0.1);
  assert.ok(Math.abs(segs[2][1] - segs[2][0] - 1.9) < 0.15, 'merged tones ~1.9s');
}
// ---- pure unit cases
assert.deepEqual(parseSilences('silence_start: 1\nsilence_end: 2 | x\nsilence_start: 5', 6), [[1, 2], [5, 6]]);
assert.deepEqual(segmentsFrom([[0, 0.5], [2, 3]], 5), [[0.5, 2], [3, 5]]);
{
  const sp = internalGaps([[0, 0.4], [1, 1.5], [2.0, 2.3], [4, 4.6], [4.7, 5]], 5);
  assert.equal(sp.start, 0.4); assert.equal(sp.gaps.length, 2); assert.ok(Math.abs(sp.end - 4) < 1e-9, 'tail click (4.6-4.7) is edge noise');
}
assert.ok(expectedDur('JACK!') < 0.6 && expectedDur("Tea's ready! Down you come!") > 1.2);
assert.ok(expectedDur('[shouting] JACK!') === expectedDur('JACK!'), 'tags do not count');
assert.ok(plausible(0.5, 0.45) && plausible(2.0, 1.6) && !plausible(6, 1.6) && !plausible(0.1, 0.45));
{
  const g = [{ s: 1, e: 1.3, len: 0.3 }, { s: 2, e: 3, len: 1 }, { s: 4, e: 4.2, len: 0.2 }, { s: 5, e: 5.9, len: 0.9 }];
  assert.deepEqual(pickLongest(g, 3).map(x => x.s), [2, 5]);
  assert.equal(pickLongest(g, 6), null, 'too few gaps -> null');
  assert.deepEqual(pickLongest(g, 1), []);
  assert.equal(bestSplit({ start: 0, end: 7, gaps: g }, Array(6).fill('x')), null, 'never guesses with too few gaps');
  const one = bestSplit({ start: 0.2, end: 3, gaps: [] }, ['Hello there, how are you?']);
  assert.equal(one.clips.length, 1); assert.equal(one.clips[0].a, 0.2);
}
// synthetic gap lists (no audio): intra-line pause longer than separators must not win over plausible durations
{
  const texts = ['Tea is ready, come down now please.', 'Wash your hands first.', 'And bring your plate down when you are finished with it.', 'Thank you.'];
  const E = texts.map(expectedDur); let t = 0.3; const gaps = [], truth = [];
  texts.forEach((x, i) => { const a = t; if (i === 2) { gaps.push({ s: t + E[i] / 2, e: t + E[i] / 2 + 1.2, len: 1.2 }); t += 1.2; } t += E[i]; truth.push([a, t]); if (i < 3) { gaps.push({ s: t, e: t + 1.0, len: 1.0 }); t += 1.0; } });
  const span = { start: 0.3, end: t, gaps };
  const naive = pickLongest(gaps, 4); assert.ok(naive.some(g => g.len === 1.2), 'naive longest picks the intra-line pause');
  const r = bestSplit(span, texts); assert.ok(near(r.clips, truth, 0.01), 'DP keeps the real separators: ' + show(r.clips)); assert.equal(r.suspects, 0);
}
// ---- audio: 13 lines with uneven separators 0.45..1.4 s (at 0.9 s silencedetect finds only a few segments)
const L13 = ["Tea's ready! Down you come!", 'Have you done your homework?', 'Not in the house, please.', 'Wash your hands.', 'Where did you put the remote?',
  'Your dinner is going cold.', 'Mind the stairs!', "I'm not telling you again.", 'Who left the milk out?', 'Lovely. Thank you, love.',
  'Shoes off at the door.', 'Bed. Now.', 'Night night, sleep tight.'];
{
  const seps = [1.4, 0.5, 0.6, 1.2, 0.45, 0.7, 1.3, 0.55, 0.5, 0.8, 0.6, 0.5], jitter = [1.1, 0.9, 1, 1.2, 0.85, 1, 1.15, 0.9, 1, 1.1, 0.95, 1.2, 0.9];
  const { wav, truth } = batch(L13, seps, { jitter });
  const old = detectSegments(wav, probe(wav), 0.9); assert.ok(old.length <= 5, 'old splitter: ' + old.length + ' segments');
  const r = splitFile(wav, L13); assert.ok(!r.error, r.error);
  assert.ok(near(r.best.clips, truth), 'uneven gaps: ' + show(r.best.clips)); assert.equal(r.best.suspects, 0);
  console.log('13 lines, uneven gaps (old splitter %d segments): ok via %s', old.length, r.setting);
}
// ---- 13 lines where 8 lines have intra-line pauses ~0.95-1.1 s (old splitter at 0.9 s: 21 segments)
{
  const seps = [1.5, 1.4, 1.6, 1.5, 1.3, 1.45, 1.5, 1.6, 1.35, 1.5, 1.4, 1.55];
  const pauses = { 0: 1.0, 1: 0.95, 3: 1.1, 4: 1.0, 6: 0.95, 8: 1.05, 9: 1.0, 12: 0.95 };
  const { wav, truth } = batch(L13, seps, { pauses });
  const old = detectSegments(wav, probe(wav), 0.9); assert.equal(old.length, 21, 'old splitter: 21 segments');
  const r = splitFile(wav, L13); assert.ok(near(r.best.clips, truth), '21-segment case: ' + show(r.best.clips));
  console.log('13 lines, 8 intra-line pauses (old splitter 21 segments): ok');
}
// ---- a long intra-line pause (1.25 s) longer than every real separator (~1.0 s) must NOT be chosen
{
  const texts = [...L13]; texts[5] = 'Your dinner is going cold, and I am not warming it up again for you, so hurry up.';
  const seps = [1.0, 0.95, 1.05, 1.0, 0.9, 1.0, 1.0, 0.95, 1.0, 1.05, 1.0, 0.95];
  const { wav, truth } = batch(texts, seps, { pauses: { 5: 1.25 } });
  const r = splitFile(wav, texts); assert.ok(near(r.best.clips, truth), 'long intra pause: ' + show(r.best.clips));
  console.log('long intra-line pause > separators: ok');
}
// ---- "segments 13 != 12": 12 lines, one with a 1.0 s intra-line pause, plus a tail click
{
  const texts = L13.slice(0, 12); texts[7] = "I'm not telling you again. Turn that off and go to bed.";
  const seps = [1.2, 1.1, 1.3, 1.2, 1.25, 1.15, 1.2, 1.3, 1.1, 1.2, 1.25];
  const { wav, truth } = batch(texts, seps, { pauses: { 7: 1.0 }, click: 0.08 });
  const old = detectSegments(wav, probe(wav), 0.9); assert.ok(old.length >= 13, 'old splitter: ' + old.length + ' segments');
  const r = splitFile(wav, texts); assert.ok(near(r.best.clips, truth), '13!=12 case: ' + show(r.best.clips)); assert.equal(r.best.suspects, 0);
  console.log('segments 13 != 12 case: ok');
}
// ---- a leaked direction/laugh before the first line (3 s junk) -> dropped, names line up
{
  const names = ['LINDSEY!', 'LORRAINE!', 'TRACEY!', 'DONNA!', 'KAREN!', 'JULIE!', 'NICOLE!', 'MELISSA!', 'KEELEY!'];
  const { wav, truth } = batch(names, Array(8).fill(1.7), { junk: 3.0 });
  const r = splitFile(wav, names); assert.equal(r.best.variant, 'drop-lead'); assert.ok(near(r.best.clips, truth), 'junk lead: ' + show(r.best.clips));
  console.log('leading junk dropped: ok');
}
// ---- impossible: 13 lines but only 4 gaps anywhere -> error, no guessing
{
  const spec = [['s', 0.3]]; for (let i = 0; i < 5; i++) spec.push(['t', 3], ['s', i < 4 ? 1.0 : 0.5]);
  const r = splitFile(makeWav(spec), L13); assert.ok(r.error && !r.best, 'too few gaps fails the batch');
  console.log('too few gaps -> batch fails:', r.error);
}
// ---- ambiguous cut: alternatives give a second boundary option for verification
{
  const texts = ['Michelle!', 'Victoria!', 'Samantha!'];
  const span = { start: 0, end: 5.4, gaps: [{ s: 1.0, e: 1.22, len: 0.22 }, { s: 1.48, e: 1.7, len: 0.22 }, { s: 3.2, e: 3.8, len: 0.6 }] };
  const choice = chooseSplit([{ setting: 't', span }], texts);
  const opts = clipOptions(choice, 0); assert.ok(opts.length >= 2, 'two options for the ambiguous first clip');
}
// ---- raw archive round trip
{
  const pcm = Buffer.alloc(24000 * 2); const w = archiveRaw(dir + '/raw', { id: 'x-01', kind: 'lines', items: ['a'] }, pcmToWav(pcm));
  assert.ok(Math.abs(probe(w) - 1) < 0.01); const ls = listRaw(dir + '/raw', 'lines'); assert.equal(ls.length, 1); assert.equal(ls[0].meta.id, 'x-01');
  assert.equal(listRaw(dir + '/raw', 'names').length, 0);
}
// ---- matcher
assert.equal(similarity("Tea's ready! Down you come!", "teas ready, down you come"), 1);
assert.ok(similarity('Mom, where are my socks?', 'Mum where are my socks') === 1);
assert.ok(similarity('Welcome to the next level. Press start.', 'Welcome to the next level press') >= 0.8);
assert.ok(similarity('Welcome to the next level. Press start.', 'Something else entirely') < 0.3);
assert.equal(verify('warmly', 'Come and sit down.', 'Come and sit down.').ok, true);
assert.equal(verify('warmly', 'Come and sit down.', 'Warmly. Come and sit down.').ok, false, 'leaked tag word');
assert.equal(verify('firm', 'Be firm with it.', 'Be firm with it.').ok, true, 'tag word that is in the line is fine');
assert.equal(verify('wry', 'Come and sit down.', 'Come and').ok, false);
// ---- fx chains are valid ffmpeg filters
{ const wav = makeWav([['t', 1.2]]); for (const [k, f] of Object.entries(FX)) { ff('-i', wav, '-af', f, '-t', '1', dir + `/${k}.wav`); assert.ok(fs.statSync(dir + `/${k}.wav`).size > 1000, k); } }
fs.rmSync(dir, { recursive: true }); console.log('all tests passed');
