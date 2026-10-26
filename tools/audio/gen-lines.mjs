// Batched voice-line generator for Jack Attack 1999.
// Usage: node gen-lines.mjs [--max-requests N=26] [--dry-run] [--only batch-id,batch-id] [--gap 0.9]
// One TTS request per batch (lines joined with long pauses, split at silences), verified by transcription.
// Lines that fail are retried individually (one request each) on a later run, after batches, if quota allows.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { VOICES, FX, detectSegments, verify } from './lines-lib.mjs';
const HERE = new URL('.', import.meta.url).pathname;
const OUT = HERE + '../../app/public/audio/voice/';
const REPORT = HERE + 'lines-report.json';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const MAX = +opt('max-requests', 26), DRY = args.includes('--dry-run'), GAP = +opt('gap', 0.9);
const ONLY = opt('only', '') ? opt('only').split(',') : null;
const lines = JSON.parse(fs.readFileSync(HERE + 'voice-lines.json', 'utf8')).lines;
const report = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
const manifestPath = OUT + 'manifest.json';
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const done = l => report[l.id]?.ok && manifest[l.id] && fs.existsSync(OUT + l.id + '.mp3');
const SEP = ' ...  ...  ... ';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let used = 0;
const save = () => { fs.writeFileSync(REPORT, JSON.stringify(report, null, 1)); fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); };
const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);

let KEY; const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
async function call(model, body) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(API + model + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    const t = await r.clone().text();
    if (r.status === 429 && /per_day|PerDay/.test(t)) { const e = Error('429 daily quota'); e.quota = true; throw e; }
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * 2 ** i); continue; }
    throw Error(r.status + ' ' + t.slice(0, 200));
  }
  throw Error('retries exhausted');
}
async function tts(voice, text) {
  used++;
  const res = await call('gemini-3.8-flash-tts', { contents: [{ parts: [{ text }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
  const data = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data; if (!data) throw Error('no audio');
  return Buffer.from(data, 'base64');
}
async function transcribe(mp3) {
  const t = await call('gemini-3.8-flash', { contents: [{ parts: [{ inlineData: { mimeType: 'audio/mpeg', data: fs.readFileSync(mp3).toString('base64') } }, { text: 'Transcribe exactly the words spoken. Output only the words.' }] }] });
  return (t.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}
const toWav = (pcm, wav) => { fs.writeFileSync(wav + '.pcm', pcm); ff('-f', 's16le', '-ar', '24000', '-ac', '1', '-i', wav + '.pcm', wav); fs.unlinkSync(wav + '.pcm'); };
const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse';

// Cut [a,b] of wav into trimmed/normalised clip, verify on the clean clip, then apply fx and write the final mp3.
async function finish(l, wav, seg, mode) {
  fs.mkdirSync(OUT, { recursive: true });
  const clean = OUT + '_tmp-' + l.id + '.mp3', final = OUT + l.id + '.mp3', range = seg ? ['-ss', String(Math.max(0, seg[0] - 0.05)), '-to', String(seg[1] + 0.08)] : [];
  ff('-i', wav, ...range, '-af', TRIM + ',loudnorm=I=-18:TP=-1.5:LRA=9', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', clean);
  const heard = await transcribe(clean), v = verify(l.tag, l.line, heard);
  report[l.id] = { ok: v.ok, mode, score: v.score, leaked: v.leaked, heard };
  if (v.ok) {
    const af = (l.fx ? FX[l.fx] + ',' : '') + 'loudnorm=I=-18:TP=-1.5:LRA=9';
    ff('-i', clean, '-af', af, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', final);
    manifest[l.id] = { file: l.id + '.mp3', character: l.character, dur: +dur(final).toFixed(2) };
  }
  fs.unlinkSync(clean);
}
const line1 = l => `[${l.tag}] ${l.line}`;
async function runBatch(id, ls) {
  const voice = VOICES[ls[0].character], wav = OUT + '_batch-' + id + '.wav'; fs.mkdirSync(OUT, { recursive: true });
  try {
    toWav(await tts(voice, ls.map(line1).join(SEP)), wav);
    const d = dur(wav), segs = detectSegments(wav, d, GAP);
    if (segs.length !== ls.length) { for (const l of ls) report[l.id] = { ok: false, mode: 'batch', err: `segments ${segs.length} != lines ${ls.length}` }; console.log(id, 'FAILED segments', segs.length, '!=', ls.length); return; }
    for (let i = 0; i < ls.length; i++) await finish(ls[i], wav, segs[i], 'batch');
    console.log(id, 'ok', ls.filter(l => report[l.id].ok).length + '/' + ls.length);
  } finally { if (fs.existsSync(wav)) fs.unlinkSync(wav); save(); }
}
async function runSingle(l) {
  const wav = OUT + '_single-' + l.id + '.wav'; fs.mkdirSync(OUT, { recursive: true });
  try { toWav(await tts(VOICES[l.character], line1(l)), wav); await finish(l, wav, null, 'single'); console.log(l.id, report[l.id].ok ? 'ok' : 'FAILED ' + report[l.id].heard); }
  finally { if (fs.existsSync(wav)) fs.unlinkSync(wav); save(); }
}

// Plan: batches with untried pending lines first (one request each), then individual retries of failed lines.
const byBatch = {}; for (const l of lines) (byBatch[l.batch] ||= []).push(l);
const ids = Object.keys(byBatch).filter(b => !ONLY || ONLY.includes(b));
const plan = [];
for (const b of ids) { const p = byBatch[b].filter(l => !done(l)); if (p.length && p.every(l => !report[l.id])) plan.push({ kind: 'batch', id: b, ls: p.length === byBatch[b].length ? byBatch[b] : p }); }
for (const b of ids) for (const l of byBatch[b]) if (!done(l) && report[l.id]) plan.push({ kind: 'single', id: l.id, ls: [l] });
const todo = plan.slice(0, MAX);
console.log(`${lines.filter(done).length}/${lines.length} lines done; planned ${plan.length} requests, running ${todo.length} (max ${MAX})`);
if (DRY) { for (const p of todo) console.log(p.kind.padEnd(6), p.id, `(${p.ls.length} lines, voice ${VOICES[p.ls[0].character]})`, p.kind === 'batch' ? '\n   ' + p.ls.map(line1).join(SEP).slice(0, 140) + '...' : '  ' + line1(p.ls[0])); process.exit(0); }
KEY = fs.readFileSync(process.env.HOME + '/.secrets/gemini.env', 'utf8').match(/GEMINI_API_KEY=(\S+)/)[1];
try { for (const p of todo) { if (p.kind === 'batch') await runBatch(p.id, p.ls); else await runSingle(p.ls[0]); } }
catch (e) { console.log(e.quota ? 'DAILY QUOTA HIT, stopping (resume tomorrow).' : 'error: ' + e.message); }
save();
const bad = lines.filter(l => !done(l)); console.log(`TTS requests used: ${used}; verified ${lines.length - bad.length}/${lines.length}; remaining ${bad.length}`);
