// Shared helpers for gen-lines.mjs and names/gen-names.mjs.
// The splitting/scoring/matching functions are pure and offline-testable (test-split.mjs); the Gemini client reads the
// key file itself (never pass the key on a command line or in env).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';

export const VOICES = { mom: 'Sulafat', dad: 'Algenib', sister: 'Leda', announcer: 'Fenrir', gran: 'Vindemiatrix' };
export const FX = {
  downstairs: 'highpass=f=180,lowpass=f=2200,aecho=0.8:0.6:70:0.3',
  console: 'aresample=22050,acrusher=bits=9:mix=0.5:mode=lin,lowpass=f=7000',
};
export const TTS_MODEL = 'gemini-3.8-flash-tts', STT_MODEL = 'gemini-3.8-flash', RATE = 24000;
export const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse';
export const LOUD = 'loudnorm=I=-18:TP=-1.5:LRA=9';

// ---------------------------------------------------------------- silence parsing (pure)
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
// Speech segments = gaps between silences (>= minSeg seconds long). (Old fixed-gap splitter, kept for diagnostics.)
export function segmentsFrom(silences, dur, minSeg = 0.15) {
  const segs = []; let t = 0;
  for (const [a, b] of silences) { if (a - t >= minSeg) segs.push([t, a]); t = Math.max(t, b); }
  if (dur - t >= minSeg) segs.push([t, dur]);
  return segs;
}
// Leading/trailing silence define the speech span; everything else is an internal gap {s, e, len}.
// Speech blips shorter than minEdge at the very start/end (clicks, breaths) count as edge silence.
export function internalGaps(silences, dur, { edge = 0.05, minEdge = 0.2 } = {}) {
  let start = 0, end = dur; let gaps = [];
  for (const [a, b] of silences) {
    if (a <= edge) start = Math.max(start, b);
    else if (b >= dur - edge) end = Math.min(end, a);
    else gaps.push({ s: a, e: b, len: b - a });
  }
  gaps = gaps.filter(g => g.s > start && g.e < end).sort((x, y) => x.s - y.s);
  while (gaps.length && gaps[0].s - start < minEdge) start = gaps.shift().e;
  while (gaps.length && end - gaps.at(-1).e < minEdge) end = gaps.pop().s;
  return { start, end, gaps };
}

// ---------------------------------------------------------------- duration model (pure)
// Rough spoken length of a text in seconds at a "normal" rate (calibrated per batch below).
export function expectedDur(text) {
  const t = String(text).replace(/\[[^\]]*\]/g, ' ');
  const chars = (t.match(/[a-z0-9]/gi) || []).length;
  const pauses = (t.replace(/[\s.!?…]+$/, '').match(/[,;:.!?—…]+/g) || []).length;
  return 0.15 + 0.07 * chars + 0.12 * pauses;
}
// Generous plausibility band: 0.35x .. 2.6x of the (calibrated) expectation, with absolute slack for very short lines.
export function plausible(d, exp, { lo = 0.35, hi = 2.6, slack = 0.6 } = {}) {
  return d >= Math.max(0.2, lo * exp - slack) && d <= hi * exp + slack;
}
// The n-1 longest internal gaps, in time order (the simple "pick the separators" rule).
export function pickLongest(gaps, n) {
  if (n <= 1) return [];
  if (gaps.length < n - 1) return null;
  return gaps.map((g, i) => [g, i]).sort((a, b) => b[0].len - a[0].len || a[1] - b[1]).slice(0, n - 1).map(x => x[0]).sort((a, b) => a.s - b.s);
}
const clipsFrom = (start, end, cuts) => { const c = []; let t = start; for (const g of cuts) { c.push([t, g.s]); t = g.e; } c.push([t, end]); return c; };

// Choose n-1 cut gaps maximising total cut-gap length while keeping clip durations plausible for their texts.
// score = sum(cut gap len) - W * sum(ln(d/E)^2) - P * (#clips outside the band), E = expectedDur * per-batch rate.
// Dynamic programming over (cuts chosen, last cut gap). Returns null if fewer than n-1 internal gaps exist.
export function bestSplit(span, texts, { W = 0.5, P = 3, band } = {}) {
  const n = texts.length, { start, end, gaps } = span;
  if (n < 1 || end <= start || gaps.length < n - 1) return null;
  const e = texts.map(expectedDur), longest = pickLongest(gaps, n);
  // speaking rate of this batch: speech time without the separator gaps vs the model
  const speech = end - start - longest.reduce((a, g) => a + g.len, 0);
  const rate = Math.min(2.5, Math.max(0.5, speech / e.reduce((a, b) => a + b, 0)));
  const E = e.map(x => x * rate);
  const clipScore = (m, a, b) => { const d = b - a; if (d < 0.08) return -Infinity; const l = Math.log(d / E[m]); return -W * l * l - (plausible(d, E[m], band) ? 0 : P); };
  let cuts;
  if (n === 1) cuts = [];
  else {
    const G = gaps.length, k = n - 1, NEG = -Infinity;
    // dp[c][j]: best score with c+1 cuts chosen, last = gap j (clips 0..c scored)
    const dp = Array.from({ length: k }, () => new Array(G).fill(NEG)), from = Array.from({ length: k }, () => new Array(G).fill(-1));
    for (let j = 0; j < G; j++) dp[0][j] = gaps[j].len + clipScore(0, start, gaps[j].s);
    for (let c = 1; c < k; c++) for (let j = c; j < G; j++) for (let i = c - 1; i < j; i++) {
      if (dp[c - 1][i] === NEG) continue;
      const v = dp[c - 1][i] + gaps[j].len + clipScore(c, gaps[i].e, gaps[j].s);
      if (v > dp[c][j]) { dp[c][j] = v; from[c][j] = i; }
    }
    let best = NEG, bj = -1;
    for (let j = k - 1; j < G; j++) { const v = dp[k - 1][j] + clipScore(k, gaps[j].e, end); if (v > best) { best = v; bj = j; } }
    if (bj < 0) return null;
    cuts = []; for (let c = k - 1, j = bj; c >= 0; j = from[c][j], c--) cuts.unshift(gaps[j]);
  }
  const clips = clipsFrom(start, end, cuts).map(([a, b], i) => ({ a, b, d: b - a, exp: E[i], suspect: !plausible(b - a, E[i], band) }));
  const score = cuts.reduce((s, g) => s + g.len, 0) + clips.reduce((s, c, i) => s + clipScore(i, c.a, c.b), 0);
  return { clips, cuts, rate, score, suspects: clips.filter(c => c.suspect).length };
}

// Candidate splits for one detection result: as-is, and with a leading and/or trailing speech segment dropped
// (Gemini sometimes reads the direction aloud or adds a breath/laugh). Dropping costs DROP so it only wins when it
// removes an implausible clip. Transcription is still the final judge of every clip.
export function splitCandidates(span, texts, { DROP = 1.5, ...o } = {}) {
  const out = [], { start, end, gaps } = span;
  const variants = [['as-is', span, 0]];
  if (gaps.length >= texts.length) {
    variants.push(['drop-lead', { start: gaps[0].e, end, gaps: gaps.slice(1) }, DROP]);
    variants.push(['drop-tail', { start, end: gaps.at(-1).s, gaps: gaps.slice(0, -1) }, DROP]);
  }
  if (gaps.length >= texts.length + 1)
    variants.push(['drop-both', { start: gaps[0].e, end: gaps.at(-1).s, gaps: gaps.slice(1, -1) }, 2 * DROP]);
  for (const [variant, sp, pen] of variants) { const r = bestSplit(sp, texts, o); if (r) out.push({ ...r, variant, score: r.score - pen }); }
  return out.sort((a, b) => b.score - a.score);
}
// Pick the split from several detection settings: fewest suspect clips, then earliest setting, then score.
// Returns { best, alts (other distinct splits, best score first), setting } or { error }.
export function chooseSplit(results, texts, o) {
  const per = [];
  results.forEach((r, si) => { for (const c of splitCandidates(r.span, texts, o)) per.push({ ...c, setting: r.setting, si }); });
  if (!per.length) return { error: `fewer than ${texts.length - 1} gaps at every setting (most ${Math.max(0, ...results.map(r => r.span.gaps.length))})` };
  const bestOf = new Map(); for (const c of per) if (!bestOf.has(c.si) || c.score > bestOf.get(c.si).score) bestOf.set(c.si, c);
  const best = [...bestOf.values()].sort((a, b) => a.suspects - b.suspects || a.si - b.si || b.score - a.score)[0];
  const alts = per.filter(c => c !== best).sort((a, b) => b.score - a.score);
  return { best, alts, setting: best.setting };
}
// Per-line clip boundaries to try, best split first; alternatives must differ by > tol s at either end.
export function clipOptions(choice, i, max = 3, tol = 0.1) {
  const out = [choice.best.clips[i]];
  for (const alt of choice.alts) {
    const c = alt.clips[i]; if (!c || alt.score < choice.best.score - 4) continue;
    if (out.every(o => Math.abs(o.a - c.a) > tol || Math.abs(o.b - c.b) > tol)) out.push(c);
    if (out.length >= max) break;
  }
  return out;
}

// ---------------------------------------------------------------- ffmpeg glue
export const SETTINGS = [{ d: 0.25, noise: '-38dB' }, { d: 0.25, noise: '-42dB' }, { d: 0.25, noise: '-35dB' }, { d: 0.15, noise: '-38dB' }, { d: 0.15, noise: '-32dB' }];
export const probeDur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
export function detectSilences(file, dur, d = 0.25, noise = '-38dB') {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `silencedetect=noise=${noise}:d=${d}`, '-f', 'null', '-'], { encoding: 'utf8' });
  return parseSilences(r.stderr || '', dur);
}
export function detectSegments(file, dur, gap = 0.9, noise = '-38dB') { return segmentsFrom(detectSilences(file, dur, gap, noise), dur); }
// Robust split of a batch wav into texts.length clips. Settings with too few gaps are skipped; if all are, { error }.
export function splitFile(file, texts, o) {
  const dur = probeDur(file);
  // A single utterance has no inter-line boundary. Internal pauses must never cut its ending off.
  if(texts.length===1)return {dur,best:{clips:[{a:0,b:dur}],cuts:[],suspects:0},alts:[],setting:'single-full'};
  const results = SETTINGS.map(s => ({ setting: `d=${s.d} ${s.noise}`, span: internalGaps(detectSilences(file, dur, s.d, s.noise), dur) }));
  const usable = results.filter(r => r.span.gaps.length >= texts.length - 1);
  return { dur, ...chooseSplit(usable.length ? usable : results, texts, o) };
}
export const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
// Cut [a,b] (+small padding) from wav, trim edges, loudness-normalise, mono mp3.
export function cutClip(wav, clip, out, extraAf = '') {
  const range = clip ? ['-ss', String(Math.max(0, clip.a - 0.05)), '-to', String(clip.b + 0.08)] : [];
  ff('-i', wav, ...range, '-af', TRIM + ',' + (extraAf ? extraAf + ',' : '') + LOUD, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', out);
}

// ---------------------------------------------------------------- raw archive (never deleted by the scripts)
export function pcmToWav(pcm, rate = RATE) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
// Save one paid TTS response: <dir>/<stamp>-<id>.wav + .json sidecar (meta: id, kind, items, prompt, voice, model, ...).
export function archiveRaw(dir, meta, wavBuf) {
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-'), base = path.join(dir, `${stamp}-${meta.id}`);
  fs.writeFileSync(base + '.wav', wavBuf);
  fs.writeFileSync(base + '.json', JSON.stringify({ ...meta, wav: path.basename(base + '.wav'), saved: new Date().toISOString() }, null, 1));
  return base + '.wav';
}
export function listRaw(dir, kind) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { meta, wav: path.join(dir, meta.wav || f.replace(/\.json$/, '.wav')) };
  }).filter(r => (!kind || r.meta.kind === kind) && fs.existsSync(r.wav));
}

// ---------------------------------------------------------------- transcript matching (pure)
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
// Transcribers vary contractions, number spelling and harmless opening vocalisations.
// Keep content at both boundaries: a high overlap score alone can accept a neighbour's words.
export function lineEdges(text) {
  let s = String(text).toLowerCase().replace(/’/g, "'");
  const contractions = { "i'm":'i am', "i'll":'i will', "it's":'it is', "that's":'that is', "don't":'do not', "they're":'they are', "aren't":'are not', "what's":'what is', "who's":'who is', "there's":'there is', "he's":'he is', "she's":'she is', "you'll":'you will', "isn't":'is not', "can't":'cannot', "we're":'we are', "wasn't":'was not', "haven't":'have not', "won't":'will not', 'wanna':'want to', 'pleeease':'please', "'em":'them', "country's":'country is' };
  for (const [a,b] of Object.entries(contractions)) s=s.replaceAll(a,b);
  s=s.replace(/\b(\d{1,2}):00\b/g,'$1');
  const numbers=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
  const w=words(s).map(v=>numbers.includes(v)?String(numbers.indexOf(v)):({programme:'program',marvellous:'marvelous',disk:'disc'}[v]||v));
  while(w.length>2&&['oh','ah','ha','hmm','hm','mmm','mm','ooh','oooh','uh','a','the'].includes(w[0]))w.shift();
  return {first:w.slice(0,2).join(' '),last:w.slice(-2).join(' ')};
}
export function verify(tag, want, heard, min = 0.8) {
  const score = similarity(want, heard), leaked = leakedTagWords(tag, want, heard);
  if (/\bbritish\b/i.test(heard) && !/\bbritish\b/i.test(want)) leaked.push('British direction');
  const a=lineEdges(want),b=lineEdges(heard),boundaries=a.first===b.first&&a.last===b.last;
  return { ok: score >= min && !leaked.length && boundaries, score: +score.toFixed(2), leaked, boundaries };
}

// ---------------------------------------------------------------- Gemini client
// cap = hard limit on TTS HTTP attempts (retries count too). Daily-quota 429 -> error.quota; cap reached -> error.capped.
export function gemini({ keyFile = (process.env.HOME || '') + '/.secrets/gemini.env', cap = Infinity } = {}) {
  let key; const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const st = { used: 0, cap };
  const getKey = () => key ||= fs.readFileSync(keyFile, 'utf8').match(/GEMINI_API_KEY=(\S+)/)[1];
  async function call(model, body, counted) {
    for (let i = 0; i < 6; i++) {
      if (counted) { if (st.used >= st.cap) { const e = Error(`request cap ${st.cap} reached`); e.capped = true; throw e; } st.used++; }
      const r = await fetch(API + model + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getKey() }, body: JSON.stringify(body) });
      if (r.ok) return r.json();
      const t = await r.text();
      if (r.status === 429 && /per_day|PerDay/i.test(t)) { const e = Error('429 daily quota'); e.quota = true; throw e; }
      if (r.status === 429 || r.status >= 500) { await sleep(2000 * 2 ** i); continue; }
      throw Error(r.status + ' ' + t.slice(0, 200));
    }
    throw Error('retries exhausted');
  }
  st.tts = async (voice, text) => {
    const res = await call(TTS_MODEL, { contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }, true);
    const data = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data; if (!data) throw Error('no audio');
    return Buffer.from(data, 'base64');
  };
  st.transcribe = async file => {
    const mimeType = file.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    const t = await call(STT_MODEL, { contents: [{ parts: [{ inlineData: { mimeType, data: fs.readFileSync(file).toString('base64') } }, { text: 'Transcribe exactly the words spoken. Output only the words.' }] }] }, false);
    return (t.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  };
  return st;
}
