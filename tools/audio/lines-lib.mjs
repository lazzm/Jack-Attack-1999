// Pure helpers for gen-lines.mjs (offline-testable).
export const VOICES = { mom: 'Sulafat', dad: 'Algenib', sister: 'Leda', announcer: 'Fenrir', gran: 'Vindemiatrix' };
export const FX = {
  downstairs: 'highpass=f=180,lowpass=f=2200,aecho=0.8:0.6:70:0.3',
  console: 'aresample=22050,acrusher=bits=9:mix=0.5:mode=lin,lowpass=f=7000',
};
// Parse ffmpeg silencedetect stderr into [[start,end]]; a trailing silence_start with no end runs to dur.
export function parseSilences(log, dur) {
  const out = []; let s = null;
  for (const l of log.split('\n')) {
    let m;
    if ((m = l.match(/silence_start: (-?[\d.]+)/))) s = Math.max(0, +m[1]);
    else if ((m = l.match(/silence_end: ([\d.]+)/)) && s !== null) { out.push([s, +m[1]]); s = null; }
  }
  if (s !== null) out.push([s, dur]);
  return out;
}
// Speech segments = gaps between silences (>= minSeg seconds long).
export function segmentsFrom(silences, dur, minSeg = 0.15) {
  const segs = []; let t = 0;
  for (const [a, b] of silences) { if (a - t >= minSeg) segs.push([t, a]); t = Math.max(t, b); }
  if (dur - t >= minSeg) segs.push([t, dur]);
  return segs;
}
export const words = s => String(s).toLowerCase().replace(/mum\b/g, 'mom').replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
// Multiset word overlap, relative to the longer of the two.
export function similarity(want, heard) {
  const w = words(want), h = words(heard); if (!w.length || !h.length) return 0;
  const bag = new Map(); for (const x of h) bag.set(x, (bag.get(x) || 0) + 1);
  let hit = 0; for (const x of w) if (bag.get(x) > 0) { hit++; bag.set(x, bag.get(x) - 1); }
  return hit / Math.max(w.length, h.length);
}
// Tag words that appear in the transcript but are not part of the intended line = leaked direction.
export function leakedTagWords(tag, want, heard) {
  const wl = new Set(words(want)), hl = new Set(words(heard));
  return words(tag).filter(t => hl.has(t) && !wl.has(t));
}
export function verify(tag, want, heard, min = 0.8) {
  const score = similarity(want, heard), leaked = leakedTagWords(tag, want, heard);
  return { ok: score >= min && !leaked.length, score: +score.toFixed(2), leaked };
}
import { spawnSync } from 'node:child_process';
export function detectSegments(file, dur, gap = 0.9, noise = '-38dB') {
  const r = spawnSync('ffmpeg', ['-i', file, '-af', `silencedetect=noise=${noise}:d=${gap}`, '-f', 'null', '-'], { encoding: 'utf8' });
  return segmentsFrom(parseSilences(r.stderr, dur), dur);
}
