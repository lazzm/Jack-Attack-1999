// Name call-outs: one short clip per (speaker, first name). Verified by transcription.
// Usage: node gen-names.mjs [speaker ...]   -> out/<speaker>/<name>.mp3, report.json
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
const HERE = new URL('.', import.meta.url).pathname;
const KEY = fs.readFileSync(process.env.HOME + '/.secrets/gemini.env', 'utf8').match(/GEMINI_API_KEY=(\S+)/)[1];
const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
const SPEAKERS = {
  'mom-shout': { voice: 'Sulafat', tag: 'shouting', text: n => `${n.toUpperCase()}!` },
  'mom-call':  { voice: 'Sulafat', tag: 'warmly', text: n => `${n}, love?` },
  'dad-shout': { voice: 'Algenib', tag: 'shouting', text: n => `${n.toUpperCase()}!` },
  'sis-whine': { voice: 'Leda', tag: 'whining', text: n => `${n}!` },
};
const names = fs.readFileSync(HERE + 'names.txt', 'utf8').split('\n').filter(Boolean);
const only = process.argv.slice(2); const spk = only.length ? only : Object.keys(SPEAKERS);
const report = fs.existsSync(HERE + 'report.json') ? JSON.parse(fs.readFileSync(HERE + 'report.json')) : {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function call(model, body) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(API + model + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
    if (r.ok) return r.json();
    if (r.status === 429 && /per_day|PerDay/.test(await r.clone().text())) throw Error('429 daily quota');
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * 2 ** i); continue; }
    throw Error(r.status + ' ' + (await r.text()).slice(0, 200));
  }
  throw Error('retries exhausted');
}
function soundex(w) { w = w.toLowerCase().replace(/[^a-z]/g, ''); if (!w) return ''; const c = { b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6 }; let o = w[0], last = c[w[0]] || 0;
  for (const ch of w.slice(1)) { const d = c[ch] || 0; if (d && d !== last) o += d; if (ch !== 'h' && ch !== 'w') last = d; } return (o + '000').slice(0, 4); }
const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== b[j - 1])); return d[a.length][b.length]; }
async function one(s, name) {
  for (let a = 0; a < 3; a++) { await attempt(s, name); const r = report[s + '/' + name]; if (r.ok) return; }
}
async function attempt(s, name) {
  const S = SPEAKERS[s], dir = HERE + 'out/' + s + '/'; fs.mkdirSync(dir, { recursive: true });
  const base = dir + name.toLowerCase(), key = s + '/' + name;
  if (report[key]?.ok && fs.existsSync(base + '.mp3')) return;
  const res = await call('gemini-3.8-flash-tts', { contents: [{ parts: [{ text: `[${S.tag}] ${S.text(name)}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: S.voice } } } } });
  const data = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data; if (!data) throw Error('no audio');
  fs.writeFileSync(base + '.pcm', Buffer.from(data, 'base64'));
  // trim leading/trailing silence, normalise, small mono mp3
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', base + '.pcm', '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse,loudnorm=I=-18:TP=-1.5:LRA=9',
    '-c:a', 'libmp3lame', '-q:a', '5', base + '.mp3']);
  fs.unlinkSync(base + '.pcm');
  const t = await call('gemini-3.8-flash', { contents: [{ parts: [{ inlineData: { mimeType: 'audio/mpeg', data: fs.readFileSync(base + '.mp3').toString('base64') } },
    { text: 'Transcribe exactly the words spoken. Output only the words.' }] }] });
  const heard = (t.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  const h = norm(heard.split(/[ ,!?.]/)[0] || heard), want = norm(name);
  const nWords = heard.split(/\s+/).filter(w => /[a-z]/i.test(w)).length, expect = S.text(name).split(/\s+/).length;
  const close = h === want || lev(h, want) <= (want.length > 5 ? 2 : 1) || soundex(h) === soundex(want);
  const ok = nWords <= expect && close;
  report[key] = { ok, heard, dur: +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', base + '.mp3']).toString() };
}
const BATCH = 15;
async function batch(s, list) {
  const S = SPEAKERS[s], dir = HERE + 'out/' + s + '/'; fs.mkdirSync(dir, { recursive: true });
  const text = list.map(n => S.text(n)).join(' ... ');
  const res = await call('gemini-3.8-flash-tts', { contents: [{ parts: [{ text: `[${S.tag}, one name at a time with a long pause between each] ${text}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: S.voice } } } } });
  const data = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data; if (!data) throw Error('no audio');
  const stamp = Date.now(), pcm = dir + '_batch-' + stamp + '.pcm', wav = dir + '_batch-' + stamp + '.wav'; fs.writeFileSync(pcm, Buffer.from(data, 'base64'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, wav]); fs.unlinkSync(pcm);
  // find speech segments between silences
  // silencedetect reports on stderr (execFileSync only returns stdout)
  const log = spawnSync('ffmpeg', ['-i', wav, '-af', 'silencedetect=noise=-38dB:d=0.35', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString();
  const sil = [...log.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map(m => [+m[1], +m[2]]);
  const segs = []; let t = 0; for (const [a, b] of sil) { if (a - t > 0.15) segs.push([t, a]); t = b; } if (dur - t > 0.15) segs.push([t, dur]);
  if (segs.length !== list.length) { fs.writeFileSync(wav + '.names', list.join('\n')); throw Error(`segments ${segs.length} != names ${list.length}`); }
  for (let i = 0; i < list.length; i++) {
    const name = list[i], base = dir + name.toLowerCase(), [a, b] = segs[i];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ss', String(Math.max(0, a - 0.05)), '-to', String(b + 0.08), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', base + '.mp3']);
    await check(s, name, base);
  }
  fs.unlinkSync(wav);
}
async function check(s, name, base) {
  const S = SPEAKERS[s];
  const t = await call('gemini-3.8-flash', { contents: [{ parts: [{ inlineData: { mimeType: 'audio/mpeg', data: fs.readFileSync(base + '.mp3').toString('base64') } }, { text: 'Transcribe exactly the words spoken. Output only the words.' }] }] });
  const heard = (t.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  const h = norm(heard.split(/[ ,!?.]/)[0] || heard), want = norm(name);
  const nWords = heard.split(/\s+/).filter(w => /[a-z]/i.test(w)).length, expect = S.text(name).split(/\s+/).length;
  const ok = nWords <= expect && (h === want || lev(h, want) <= (want.length > 5 ? 2 : 1) || soundex(h) === soundex(want));
  report[s + '/' + name] = { ok, heard, dur: +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', base + '.mp3']).toString() };
}
if (process.env.BATCHED) {
  // TTS is capped at 100 requests/day on our tier: voice BATCH names per request, split at silences.
  let used = 0; const cap = +process.env.MAX_REQ || 90;
  for (const s of spk) {
    const todo = names.filter(n => !(report[s + '/' + n]?.ok && fs.existsSync(HERE + 'out/' + s + '/' + n.toLowerCase() + '.mp3')));
    for (let i = 0; i < todo.length && used < cap; i += BATCH) {
      const list = todo.slice(i, i + BATCH); used++;
      try { await batch(s, list); } catch (e) { for (const n of list) if (!report[s + '/' + n]?.ok) report[s + '/' + n] = { ok: false, err: e.message }; console.log('batch fail', s, e.message); if (/429/.test(e.message)) { used = cap; } }
      fs.writeFileSync(HERE + 'report.json', JSON.stringify(report, null, 1)); console.log(s, i + list.length + '/' + todo.length, 'requests', used);
    }
  }
  const bad = Object.entries(report).filter(([, v]) => !v.ok); console.log('flagged', bad.length); process.exit(0);
}
const jobs = spk.flatMap(s => names.map(n => [s, n]));
let i = 0, done = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < jobs.length) { const [s, n] = jobs[i++];
    try { await one(s, n); } catch (e) { report[s + '/' + n] = { ok: false, err: e.message }; }
    if (++done % 50 === 0) { fs.writeFileSync(HERE + 'report.json', JSON.stringify(report, null, 1)); console.log(done + '/' + jobs.length); } }
}));
fs.writeFileSync(HERE + 'report.json', JSON.stringify(report, null, 1));
const bad = Object.entries(report).filter(([, v]) => !v.ok);
console.log('done', jobs.length, 'flagged', bad.length); for (const [k, v] of bad.slice(0, 40)) console.log(' ', k, '->', v.heard || v.err);
