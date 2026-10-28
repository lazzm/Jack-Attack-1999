// Batched voice-line generator for Jack Attack 1999.
// Usage: node gen-lines.mjs [--max-requests N=26] [--dry-run] [--only id,batch,character] [--batch-size 13]
//          [--out DIR] [--report FILE] [--raw DIR] [--resplit] [--install DIR]
// Plan: every line not yet verified is grouped by (character, fx) into batches of <= 13 (each line keeps its own
// [tag]), one TTS request per batch, split with the robust splitter (lines-lib.mjs), every clip verified by
// transcription. Lines that failed verification twice (or whose batch failed to split twice) go one request each,
// after all batches. Requests left under --max-requests after pass 1 re-plan the failures (passes 2-3, same rules). Every TTS response is archived (WAV + JSON sidecar) in --raw DIR and never deleted.
// --resplit: re-split every archived raw batch offline (no TTS) and re-verify lines not yet verified.
// --install DIR: copy verified mp3s + manifest.json from --out into DIR (merging DIR's manifest), no API.
// --dry-run: print the plan (no key read, no API call).
import fs from 'node:fs';
import path from 'node:path';
import { VOICES, FX, LOUD, TTS_MODEL, gemini, splitFile, clipOptions, cutClip, archiveRaw, listRaw, pcmToWav, probeDur, ff, verify } from './lines-lib.mjs';
const HERE = new URL('.', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const dirOpt = (n, d) => { const v = opt(n, d); return v.endsWith('/') ? v : v + '/'; };
const MAX = +opt('max-requests', 26), DRY = args.includes('--dry-run'), RESPLIT = args.includes('--resplit'), SIZE = +opt('batch-size', 13);
const OUT = dirOpt('out', HERE + '../../app/public/audio/voice/'), REPORT = opt('report', HERE + 'lines-report.json');
const RAW = dirOpt('raw', (process.env.HOME || '') + '/jack-audio/lines/raw/'), INSTALL = opt('install', '');
const ONLY = opt('only', '') ? opt('only').split(',') : null;
if (!(MAX >= 0) || !(SIZE >= 1)) { console.error('bad --max-requests / --batch-size'); process.exit(2); }
const lines = JSON.parse(fs.readFileSync(HERE + 'voice-lines.json', 'utf8')).lines, byId = new Map(lines.map(l => [l.id, l]));
const report = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
const manifestPath = OUT + 'manifest.json';
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const done = l => report[l.id]?.ok && manifest[l.id] && fs.existsSync(OUT + l.id + '.mp3');
const save = () => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(REPORT, JSON.stringify(report, null, 1)); fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1)); };
// older reports: a transcribed failure counts as one verification failure
for (const r of Object.values(report)) if (r && !r.ok && r.heard !== undefined && r.vfails === undefined) r.vfails = 1;
const vf = l => report[l.id]?.vfails || 0, bf = l => report[l.id]?.bfails || 0;

if (INSTALL) {
  const dst = INSTALL.endsWith('/') ? INSTALL : INSTALL + '/'; fs.mkdirSync(dst, { recursive: true });
  const old = fs.existsSync(dst + 'manifest.json') ? JSON.parse(fs.readFileSync(dst + 'manifest.json', 'utf8')) : {};
  let n = 0; for (const [id, m] of Object.entries(manifest)) if (fs.existsSync(OUT + m.file)) { fs.copyFileSync(OUT + m.file, dst + m.file); old[id] = m; n++; }
  fs.writeFileSync(dst + 'manifest.json', JSON.stringify(old, null, 1));
  console.log(`installed ${n} clips into ${dst} (manifest now ${Object.keys(old).length} entries)`); process.exit(0);
}

const SEP = ' ...  ...  ... ';
// voice-lines.json carries a trailing ' |' (markdown table residue) on most lines: never send it to TTS
const say = l => l.line.replace(/\s*\|\s*$/, '');
const line1 = l => `[${l.tag}] ${say(l)}`;
let G;
// Split a batch wav into clips for ls, verify each clean clip by transcription, then apply fx -> <OUT>/<id>.mp3.
async function processWav(ls, wav, raw, mode) {
  fs.mkdirSync(OUT, { recursive: true });
  const sp = splitFile(wav, ls.map(say));
  if (sp.error) {
    for (const l of ls) if (!done(l)) report[l.id] = { ...report[l.id], ok: false, mode, err: 'split: ' + sp.error, raw, bfails: bf(l) + 1 };
    save(); return 0;
  }
  let ok = 0;
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]; if (done(l)) continue;
    const clean = OUT + '_tmp-' + l.id + '.mp3', final = OUT + l.id + '.mp3'; let last = null, heardAny = false;
    for (const clip of clipOptions(sp, i)) {
      try {
        cutClip(wav, clip, clean);
        const heard = await G.transcribe(clean), v = verify(l.tag, say(l), heard); heardAny = true;
        last = { ok: v.ok, mode, score: v.score, leaked: v.leaked, heard, suspect: clip.suspect || undefined, clip: [+clip.a.toFixed(2), +clip.b.toFixed(2)], raw };
        if (v.ok) {
          ff('-i', clean, '-af', (l.fx ? FX[l.fx] + ',' : '') + LOUD, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '5', final);
          manifest[l.id] = { file: l.id + '.mp3', character: l.character, dur: +probeDur(final).toFixed(2) };
          break;
        }
      } catch (e) { if (e.quota) throw e; last = { ok: false, mode, err: e.message, raw }; }
    }
    if (fs.existsSync(clean)) fs.unlinkSync(clean);
    report[l.id] = { ...last, vfails: vf(l) + (!last?.ok && heardAny ? 1 : 0), bfails: bf(l) || undefined };
    if (last?.ok) ok++;
  }
  save(); return ok;
}
async function runTts(p) {
  const voice = VOICES[p.ls[0].character], prompt = p.ls.map(line1).join(SEP);
  const pcm = await G.tts(voice, prompt);
  const wav = archiveRaw(RAW, { id: p.id, kind: 'lines', mode: p.kind, items: p.ls.map(l => l.id), lines: p.ls.map(l => ({ id: l.id, tag: l.tag, line: say(l), fx: l.fx || null })),
    prompt, voice, character: p.ls[0].character, model: TTS_MODEL, rate: 24000 }, pcmToWav(pcm));
  const ok = await processWav(p.ls, wav, path.basename(wav), p.kind);
  console.log(p.kind, p.id, `${ok}/${p.ls.length} verified`, p.ls.some(l => report[l.id]?.err) ? report[p.ls.find(l => report[l.id]?.err).id].err : '', 'requests', G.used);
}

// ---------------------------------------------------------------- plan
const wanted = l => !ONLY || ONLY.some(o => o === l.id || o === l.batch || o === l.character);
const isSingle = l => vf(l) >= 2 || bf(l) >= 2;
function makePlan(pass = 1) {
  const pending = lines.filter(l => !done(l) && wanted(l)), plan = [];
  const groups = new Map(); for (const l of pending) if (!isSingle(l)) { const k = l.character + '-' + (l.fx || 'plain'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); }
  for (const [k, g] of groups) {
    const nb = Math.ceil(g.length / SIZE), per = Math.ceil(g.length / nb); // balanced chunks, each <= SIZE
    for (let b = 0; b < nb; b++) plan.push({ kind: 'batch', id: `${k}-${pass > 1 ? 'p' + pass : 'r'}${String(b + 1).padStart(2, '0')}`, ls: g.slice(b * per, (b + 1) * per) });
  }
  for (const l of pending) if (isSingle(l)) plan.push({ kind: 'single', id: l.id, ls: [l] });
  return { pending, plan };
}
const { pending, plan } = makePlan();
const todo = RESPLIT ? [] : plan.slice(0, MAX);
console.log(`${new Date().toISOString()} ${lines.filter(done).length}/${lines.length} lines verified; ${pending.length} pending` +
  (RESPLIT ? `; resplit from ${RAW}` : `; planned ${plan.length} requests, running ${todo.length} (max ${MAX}) covering ${todo.reduce((a, p) => a + p.ls.length, 0)} lines`));
if (DRY) {
  if (RESPLIT) for (const r of listRaw(RAW, 'lines')) console.log('raw', r.meta.id, r.meta.items.length, 'lines,', r.meta.items.filter(id => byId.has(id) && !done(byId.get(id))).length, 'unverified', r.wav);
  else {
    for (const p of todo) console.log(p.kind.padEnd(6), p.id.padEnd(22), `${String(p.ls.length).padStart(2)} lines, voice ${VOICES[p.ls[0].character]}`, '  ' + line1(p.ls[0]).slice(0, 70));
    if (MAX > todo.length) console.log(`then up to ${MAX - todo.length} more requests re-batch whatever fails in this pass (passes 2-3)`);
  }
  console.log('dry run: no API calls made'); process.exit(0);
}
G = gemini({ cap: RESPLIT ? 0 : MAX });
if (RESPLIT) {
  let rec = 0;
  for (const r of listRaw(RAW, 'lines')) {
    const ls = r.meta.items.map(id => byId.get(id)); if (ls.some(l => !l)) { console.log('skip', r.meta.wav, '(unknown line ids)'); continue; }
    const want = ls.filter(l => !done(l) && wanted(l)).length; if (!want) continue;
    try { const ok = await processWav(ls, r.wav, r.meta.wav, 'resplit'); rec += ok; console.log('resplit', r.meta.wav, `${ok}/${want} verified`); }
    catch (e) { console.log('resplit error', r.meta.wav, e.message); if (e.quota) break; }
  }
  console.log('resplit recovered', rec);
} else {
  try {
    // pass 1 = the plan above; passes 2-3 re-plan (re-batch failures, singles for twice-failed lines) with what is left
    for (let pass = 1, cur = todo; pass <= 3 && cur.length; pass++, cur = G.used < MAX ? makePlan(pass).plan.slice(0, MAX - G.used) : []) {
      if (pass > 1) console.log(`pass ${pass}: ${cur.length} requests`);
      for (const p of cur) {
        try { await runTts(p); }
        catch (e) { if (e.quota || e.capped) throw e; console.log(p.kind, p.id, 'FAILED', e.message, 'requests', G.used); for (const l of p.ls) if (!done(l)) report[l.id] = { ...report[l.id], ok: false, err: e.message }; save(); }
      }
    }
  }
  catch (e) { console.log(e.quota ? 'DAILY QUOTA HIT, stopping (resume tomorrow).' : e.capped ? `request cap ${MAX} reached, stopping.` : 'error: ' + e.message); }
}
save();
const bad = lines.filter(l => !done(l)); console.log(`TTS requests used: ${G.used}; verified ${lines.length - bad.length}/${lines.length}; remaining ${bad.length}`);
