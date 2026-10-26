// Offline tests (ffmpeg only): silence splitting + transcript matching.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import os from 'node:os'; import fs from 'node:fs'; import path from 'node:path';
import { detectSegments, parseSilences, segmentsFrom, similarity, verify, FX } from './lines-lib.mjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'splt-')); const wav = dir + '/t.wav';
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
// tones (0.8s, 1.2s, 0.5s, 1.0s) separated by silences 1.2s, 1.5s, 0.4s(short: must NOT split... but is below gap)
const spec = [['t', 0.8], ['s', 1.2], ['t', 1.2], ['s', 1.5], ['t', 0.5], ['s', 0.4], ['t', 1.0], ['s', 1.3], ['t', 0.6], ['s', 1.0]];
const inputs = [], labels = []; spec.forEach(([k, d], i) => {
  inputs.push('-f', 'lavfi', '-i', k === 't' ? `sine=frequency=${300 + 100 * i}:duration=${d}:sample_rate=24000` : `anullsrc=r=24000:cl=mono:d=${d}`); labels.push(`[${i}:a]`); });
ff(...inputs, '-filter_complex', labels.join('') + `concat=n=${spec.length}:v=0:a=1[o]`, '-map', '[o]', '-ac', '1', wav);
const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString();
const segs = detectSegments(wav, dur), sil = [];
console.log('silences', sil.map(x => x.map(v => +v.toFixed(2))), 'segments', segs.map(x => x.map(v => +v.toFixed(2))));
// 0.4s gap is below 0.9 so tones 3+4 merge: expect 4 segments (trailing silence handled)
assert.equal(segs.length, 4);
assert.ok(Math.abs(segs[0][1] - 0.8) < 0.1 && Math.abs(segs[1][0] - 2.0) < 0.1);
assert.ok(Math.abs(segs[2][1] - segs[2][0] - 1.9) < 0.15, 'merged tones ~1.9s');
// pure unit cases
assert.deepEqual(parseSilences('silence_start: 1\nsilence_end: 2 | x\nsilence_start: 5', 6), [[1, 2], [5, 6]]);
assert.deepEqual(segmentsFrom([[0, 0.5], [2, 3]], 5), [[0.5, 2], [3, 5]]);
// matcher
assert.equal(similarity("Tea's ready! Down you come!", "teas ready, down you come"), 1);
assert.ok(similarity('Mom, where are my socks?', 'Mum where are my socks') === 1);
assert.ok(similarity('Welcome to the next level. Press start.', 'Welcome to the next level press') >= 0.8);
assert.ok(similarity('Welcome to the next level. Press start.', 'Something else entirely') < 0.3);
assert.equal(verify('warmly', 'Come and sit down.', 'Come and sit down.').ok, true);
assert.equal(verify('warmly', 'Come and sit down.', 'Warmly. Come and sit down.').ok, false, 'leaked tag word');
assert.equal(verify('firm', 'Be firm with it.', 'Be firm with it.').ok, true, 'tag word that is in the line is fine');
assert.equal(verify('wry', 'Come and sit down.', 'Come and').ok, false);
// fx chains are valid ffmpeg filters
for (const [k, f] of Object.entries(FX)) { ff('-i', wav, '-af', f, '-t', '1', dir + `/${k}.wav`); assert.ok(fs.statSync(dir + `/${k}.wav`).size > 1000, k); }
fs.rmSync(dir, { recursive: true }); console.log('all tests passed');
