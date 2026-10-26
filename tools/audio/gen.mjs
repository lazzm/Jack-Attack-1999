// Jack Attack audio test batch: Lyria music + Gemini TTS voices -> ~/jack-audio/out
// Usage: node gen.mjs [id ...]   (reads GEMINI_API_KEY from ~/.secrets/gemini.env; never prints it)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const KEY = fs.readFileSync(process.env.HOME + '/.secrets/gemini.env', 'utf8').match(/GEMINI_API_KEY=(\S+)/)[1];
const OUT = new URL('./out/', import.meta.url).pathname;
const API = 'https://generativelanguage.googleapis.com/v1beta';
const jobs = JSON.parse(fs.readFileSync(new URL('./batch.json', import.meta.url)));
const want = process.argv.slice(2);
const log = (o) => fs.appendFileSync(OUT + 'provenance.jsonl', JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n');
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(r.status + ' ' + JSON.stringify(j).slice(0, 400));
  return j;
}
async function music(j) {
  const res = await post(API + '/interactions', { model: j.model, input: j.prompt });
  const blocks = (res.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []);
  const audio = blocks.find(b => b.type === 'audio'); if (!audio) throw Error('no audio: ' + JSON.stringify(res).slice(0, 300));
  const raw = OUT + j.id + '.raw.mp3'; fs.writeFileSync(raw, Buffer.from(audio.data, 'base64'));
  const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n'); if (text) fs.writeFileSync(OUT + j.id + '.txt', text);
  return raw;
}
async function voice(j) {
  const res = await post(`${API}/models/${j.model}:generateContent`, {
    contents: [{ parts: [{ text: (j.tag ? '[' + j.tag + '] ' : '') + j.line }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: j.voice } } } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData); if (!part) throw Error('no audio: ' + JSON.stringify(res).slice(0, 300));
  const pcm = OUT + j.id + '.pcm'; fs.writeFileSync(pcm, Buffer.from(part.inlineData.data, 'base64'));
  const wav = OUT + j.id + '.raw.wav'; ff('-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, wav); fs.unlinkSync(pcm);
  return wav;
}
for (const j of jobs) {
  if (want.length && !want.includes(j.id)) continue;
  try {
    const raw = j.kind === 'music' ? await music(j) : await voice(j);
    // loudness-normalise; optional period filter chain from batch.json ("fx")
    const af = [j.fx, j.kind === 'music' ? 'loudnorm=I=-16:TP=-1.5:LRA=11' : 'loudnorm=I=-18:TP=-1.5:LRA=9'].filter(Boolean).join(',');
    ff('-i', raw, '-af', af, '-ac', j.kind === 'music' ? '2' : '1', '-c:a', 'libmp3lame', '-q:a', '4', OUT + j.id + '.mp3');
    log({ id: j.id, kind: j.kind, model: j.model, voice: j.voice, prompt: j.prompt, style: j.style, line: j.line, fx: j.fx || '' });
    console.log('ok', j.id);
  } catch (e) { console.log('FAIL', j.id, e.message); }
}
