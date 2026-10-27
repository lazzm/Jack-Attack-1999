// Name call-outs: one short clip per (speaker, first name). Verified by transcription.
// Usage: node gen-names.mjs [speaker ...] [--max-requests N] [--dry-run] [--resplit] [--per-name] [--raw DIR]
//   -> out/<speaker>/<name>.mp3 (verified clips only), report.json
// Default = BATCHED: 15 names per TTS request, split with the robust splitter (../lines-lib.mjs), every clip verified.
// The request cap (--max-requests, else env MAX_REQ, else 90) bounds every TTS HTTP attempt, retries included, in
// both modes. --per-name (one request per name, up to 3 tries) is opt-in and capped the same way.
// Every TTS response is archived as WAV + JSON sidecar in --raw DIR (default ~/jack-audio/names/raw/, never deleted).
// --resplit re-splits every archived batch offline (no TTS) and re-verifies names not yet verified.
// --dry-run prints the plan and exits (no key read, no API call).
import fs from 'node:fs';
import { gemini, splitFile, clipOptions, cutClip, archiveRaw, listRaw, pcmToWav, probeDur, TTS_MODEL } from '../lines-lib.mjs';
const HERE = new URL('.', import.meta.url).pathname;
const SPEAKERS = {
  'mom-shout': { voice: 'Sulafat', tag: 'shouting', text: n => `${n.toUpperCase()}!` },
  'mom-call':  { voice: 'Sulafat', tag: 'warmly', text: n => `${n}, love?` },
  'dad-shout': { voice: 'Algenib', tag: 'shouting', text: n => `${n.toUpperCase()}!` },
  'sis-whine': { voice: 'Leda', tag: 'whining', text: n => `${n}!` },
};
const BATCH = 15;
const args = process.argv.slice(2), flag = n => args.includes('--' + n);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const valued = new Set(['--max-requests', '--raw']);
const only = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const spk = only.length ? only : Object.keys(SPEAKERS);
for (const s of spk) if (!SPEAKERS[s]) { console.error('unknown speaker', s); process.exit(2); }
const CAP = +(opt('max-requests', '') || process.env.MAX_REQ || 90);
const DRY = flag('dry-run'), RESPLIT = flag('resplit'), PER_NAME = flag('per-name');
const RAW = opt('raw', (process.env.HOME || '') + '/jack-audio/names/raw/');
if (!(CAP >= 0)) { console.error('bad request cap'); process.exit(2); }

const names = fs.readFileSync(HERE + 'names.txt', 'utf8').split('\n').map(x => x.trim()).filter(Boolean);
const REPORT = HERE + 'report.json';
const report = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
const save = () => fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
const mp3 = (s, n) => HERE + 'out/' + s + '/' + n.toLowerCase() + '.mp3';
const isOk = (s, n) => report[s + '/' + n]?.ok && fs.existsSync(mp3(s, n));
// names that keep failing verification go last, so they never block new names
const todoFor = s => names.filter(n => !isOk(s, n)).map((n, i) => [n, i]).sort((a, b) => (report[s + '/' + a[0]]?.tries || 0) - (report[s + '/' + b[0]]?.tries || 0) || a[1] - b[1]).map(x => x[0]);
const promptFor = (s, list) => list.length === 1 ? `[${SPEAKERS[s].tag}] ${SPEAKERS[s].text(list[0])}`
  : `[${SPEAKERS[s].tag}, one name at a time with a long pause between each] ${list.map(SPEAKERS[s].text).join(' ... ')}`;

function soundex(w) { w = w.toLowerCase().replace(/[^a-z]/g, ''); if (!w) return ''; const c = { b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6 }; let o = w[0], last = c[w[0]] || 0;
  for (const ch of w.slice(1)) { const d = c[ch] || 0; if (d && d !== last) o += d; if (ch !== 'h' && ch !== 'w') last = d; } return (o + '000').slice(0, 4); }
const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== b[j - 1])); return d[a.length][b.length]; }
// sound-alike check: first heard word ~ the name, and no extra words
function nameCheck(s, name, heard) {
  const h = norm(heard.split(/[ ,!?.]/)[0] || heard), want = norm(name);
  const nWords = heard.split(/\s+/).filter(w => /[a-z]/i.test(w)).length, expect = SPEAKERS[s].text(name).split(/\s+/).length;
  const close = h === want || lev(h, want) <= (want.length > 5 ? 2 : 1) || soundex(h) === soundex(want);
  return { ok: nWords <= expect && close, reason: !close ? 'name not heard' : nWords > expect ? `extra words (${nWords} > ${expect})` : '' };
}

let G; // gemini client (created only when the API is really used)
// Split one batch wav into list.length clips, verify each by transcription, keep only verified mp3s.
async function processBatch(s, list, wav, raw, mode) {
  const dir = HERE + 'out/' + s + '/'; fs.mkdirSync(dir, { recursive: true });
  const sp = splitFile(wav, list.map(SPEAKERS[s].text));
  if (sp.error) { for (const n of list) if (!isOk(s, n)) report[s + '/' + n] = { ...report[s + '/' + n], ok: false, mode, err: 'split: ' + sp.error, raw }; return 0; }
  let ok = 0;
  for (let i = 0; i < list.length; i++) {
    const name = list[i], key = s + '/' + name; if (isOk(s, name)) continue;
    const tmp = dir + '_tmp-' + name.toLowerCase() + '.mp3'; let last = null;
    for (const clip of clipOptions(sp, i)) {
      try {
        cutClip(wav, clip, tmp);
        const heard = await G.transcribe(tmp), v = nameCheck(s, name, heard);
        last = { ok: v.ok, mode, heard, reason: v.reason || undefined, suspect: clip.suspect || undefined, clip: [+clip.a.toFixed(2), +clip.b.toFixed(2)], raw };
        if (v.ok) { fs.renameSync(tmp, mp3(s, name)); last.dur = +probeDur(mp3(s, name)).toFixed(2); break; }
      } catch (e) { if (e.quota) throw e; last = { ok: false, mode, err: e.message, raw }; }
    }
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    report[key] = { ...last, tries: (report[key]?.tries || 0) + (last?.ok ? 0 : 1) };
    if (last?.ok) ok++;
  }
  save(); return ok;
}
async function ttsBatch(s, list) {
  const S = SPEAKERS[s], prompt = promptFor(s, list);
  const pcm = await G.tts(S.voice, prompt);
  const id = `${s}-${list.length === 1 ? list[0].toLowerCase() : 'b' + list.length}`;
  const wav = archiveRaw(RAW, { id, kind: 'names', speaker: s, items: list, prompt, voice: S.voice, tag: S.tag, model: TTS_MODEL, rate: 24000 }, pcmToWav(pcm));
  return processBatch(s, list, wav, wav.split('/').pop(), list.length === 1 ? 'single' : 'batch');
}

// ---------------------------------------------------------------- plan
const plan = [];
if (!RESPLIT) {
  if (PER_NAME) { for (const s of spk) for (const n of todoFor(s)) plan.push({ s, list: [n] }); }
  else for (const s of spk) { const t = todoFor(s); for (let i = 0; i < t.length; i += BATCH) plan.push({ s, list: t.slice(i, i + BATCH) }); }
}
// per-name may take up to 3 requests per name; the cap still bounds the total
const run = PER_NAME ? plan : plan.slice(0, CAP);
const pending = spk.reduce((a, s) => a + todoFor(s).length, 0);
console.log(`${new Date().toISOString()} mode ${RESPLIT ? 'resplit' : PER_NAME ? 'per-name' : 'batched'}; ${pending} names pending over ${spk.join(',')}; ` +
  (RESPLIT ? `raw archive ${RAW}` : `planned ${plan.length} requests, running ${PER_NAME ? 'until' : run.length + ' of'} cap ${CAP}; covers ${run.reduce((a, p) => a + p.list.length, 0)} names`));
if (DRY) {
  if (RESPLIT) for (const r of listRaw(RAW, 'names')) console.log('raw', r.meta.speaker, r.meta.items.length, 'names', r.wav, r.meta.items.filter(n => !isOk(r.meta.speaker, n)).length, 'unverified');
  else { const by = {}; for (const p of run) (by[p.s] ||= []).push(p.list.length); for (const [s, l] of Object.entries(by)) console.log(' ', s, l.length, 'requests,', l.reduce((a, b) => a + b, 0), 'names'); }
  console.log('dry run: no API calls made'); process.exit(0);
}
G = gemini({ cap: RESPLIT ? 0 : CAP });

if (RESPLIT) {
  let rec = 0;
  for (const r of listRaw(RAW, 'names')) {
    const { speaker: s, items } = r.meta; if (!SPEAKERS[s] || !spk.includes(s)) continue;
    const want = items.filter(n => !isOk(s, n)); if (!want.length) continue;
    try { const ok = await processBatch(s, items, r.wav, r.meta.wav, 'resplit'); rec += ok; console.log('resplit', r.meta.wav, `${ok}/${want.length} verified`, report[s + '/' + want[0]]?.err || ''); }
    catch (e) { console.log('resplit error', r.meta.wav, e.message); if (e.quota) break; }
  }
  console.log('resplit recovered', rec);
} else {
  try {
    for (const p of run) {
      const tries = PER_NAME ? 3 : 1;
      for (let a = 0; a < tries; a++) {
        try { const ok = await ttsBatch(p.s, p.list); console.log(p.s, p.list.length === 1 ? p.list[0] : p.list.length + ' names', 'verified', ok, 'requests', G.used); if (ok === p.list.length) break; }
        catch (e) {
          if (e.quota || e.capped) throw e;
          for (const n of p.list) if (!isOk(p.s, n)) report[p.s + '/' + n] = { ...report[p.s + '/' + n], ok: false, err: e.message };
          save(); console.log('batch fail', p.s, e.message, 'requests', G.used);
        }
      }
    }
  } catch (e) { console.log(e.quota ? 'DAILY QUOTA HIT, stopping (resume tomorrow).' : e.capped ? `request cap ${CAP} reached, stopping.` : 'error: ' + e.message); }
  save();
}
const all = spk.flatMap(s => names.map(n => s + '/' + n)), okN = all.filter(k => isOk(...k.split('/'))).length;
console.log(`TTS requests used: ${G.used}; verified ${okN}/${all.length}`);
