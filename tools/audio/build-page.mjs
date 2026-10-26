import fs from 'node:fs';
const O = new URL('./out/', import.meta.url).pathname;
const b64 = id => 'data:audio/mpeg;base64,' + fs.readFileSync(O + id + '.mp3').toString('base64');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lyrics = fs.existsSync(O + 'music-radio-pop.txt') ? fs.readFileSync(O + 'music-radio-pop.txt', 'utf8').replace(/\[[\d.:]+\]\s*/g, '').trim() : '';
const A = [
  ['Side A · Music', [
    ['music-kart-menu', 'Kart Kaos: menu theme', '30-second clip · Lyria 3 Clip · about 3p', 'Cheerful 1998 kart-racer menu: synth brass, slap bass, marimba, 132 BPM.'],
    ['music-kart-race-full', 'Kart Kaos: race theme', '90 seconds · Lyria 3.5 · about 6p', 'Fast and cartoony, rock riffs over breakbeats, with a "final lap" lift at the end.'],
    ['music-radio-pop', 'Class of ’99 (fake radio single)', '30-second clip · Lyria 3 Clip · about 3p', 'Jangly 1999 guitar-pop with original lyrics:\n' + lyrics],
  ]],
  ['Side B · Voices', [
    ['mom-tea-a', 'Mom (chosen \u2714)', 'Gemini TTS · voice “Sulafat” · under 1p', '“JACK! Tea’s ready! And bring your plates down from your room, there’s about six up there!”'],
    ['mom-tea-b', 'Mom, take B', 'Gemini TTS · voice “Kore” · under 1p', 'Same line, different voice: pick the Mom you prefer.'],
    ['mom-tea-a-downstairs', 'Mom, take A, shouting from downstairs', 'Take A + muffled through-the-floor filter', 'How she would sound from the kitchen while you are upstairs.'],
    ['dad-phone', 'Dad', 'Gemini TTS · voice “Algenib”', '“Who’s been on the internet all evening? I’ve been trying to ring your Gran for an hour and it just goes beep-beep-SKREEEE.”'],
    ['gran-vindemiatrix', 'Gran, option 1', 'Gemini TTS · voice \u201cVindemiatrix\u201d · neutral accent', '\u201cOoh, haven\u2019t you grown! Here\u2019s a pound for you, love. Don\u2019t tell your sister.\u201d'],
    ['gran-achernar', 'Gran, option 2', 'Gemini TTS · voice \u201cAchernar\u201d · neutral accent', 'Same line.'],
    ['gran-despina', 'Gran, option 3', 'Gemini TTS · voice \u201cDespina\u201d · neutral accent', 'Same line. (The first Gran sounded Northern, so she is gone.)'],
    ['crystal-phone', 'Crystal (little sister)', 'Gemini TTS · voice “Leda”', '“Mo-om! Jack’s on the computer AGAIN and I need the phone!”'],
    ['announcer-race', 'Race announcer', 'Gemini TTS · voice “Fenrir” + crunchy console filter', '“Get ready… three… two… one… GO!”'],
  ]],
];
const track = ([id, title, meta, note], n) => `<li class="trk"><div class="num">${String(n).padStart(2, '0')}</div><div class="body"><h3>${esc(title)}</h3><p class="meta">${esc(meta)}</p><p class="note">${esc(note).replace(/\n/g, '<br>')}</p><audio controls preload="none" src="${b64(id)}"></audio></div></li>`;
let n = 0;
const html = `<title>Jack Attack Audio Tape</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Courier+Prime:wght@400;700&family=Archivo+Narrow:wght@500;700&display=swap">
<style>
/* Layout: a C90 cassette inlay (J-card): hand-written spine title, two sides, numbered track list. */
:root{--paper:#f3efe4;--ink:#1d1b2a;--muted:#5d5866;--rule:#cfc6b2;--accent:#d2372b;--band:#1d4e89;--card:#fffdf7;
--marker:'Permanent Marker',cursive;--type:'Courier Prime','Courier New',monospace;--label:'Archivo Narrow','Arial Narrow',sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#17161d;--ink:#ece6d6;--muted:#a7a0b0;--rule:#3a3744;--accent:#ff6a5c;--band:#6ea1e6;--card:#201f28;color-scheme:dark}}
:root[data-theme="dark"]{--paper:#17161d;--ink:#ece6d6;--muted:#a7a0b0;--rule:#3a3744;--accent:#ff6a5c;--band:#6ea1e6;--card:#201f28;color-scheme:dark}
body{background:var(--paper);color:var(--ink);font-family:var(--type);font-size:15px;line-height:1.5}
.wrap{max-width:760px;margin:0 auto;padding-block:28px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.spine{border-top:10px solid var(--band);border-bottom:4px solid var(--accent);padding:14px 0 10px;display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline;justify-content:space-between}
h1{font-family:var(--marker);font-weight:400;font-size:clamp(28px,6vw,44px);line-height:1.05;margin:0;text-wrap:balance}
.spine span{font-family:var(--label);text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:var(--muted)}
.intro{margin:18px 0 6px;max-width:62ch}
h2{font-family:var(--label);text-transform:uppercase;letter-spacing:.14em;font-size:14px;color:var(--band);margin:30px 0 4px;border-bottom:1px dashed var(--rule);padding-bottom:6px}
ol{list-style:none;margin:0;padding:0}
.trk{display:grid;grid-template-columns:44px 1fr;gap:12px;padding:16px 0;border-bottom:1px solid var(--rule)}
.num{font-family:var(--marker);font-size:24px;color:var(--accent);line-height:1}
.body{min-width:0}
h3{font-family:var(--label);font-weight:700;font-size:18px;margin:0;text-wrap:balance}
.meta{margin:2px 0 6px;font-size:12px;color:var(--muted);letter-spacing:.02em}
.note{margin:0 0 10px;max-width:62ch}
audio{width:100%;max-width:520px;height:38px}
.pick{margin-top:30px;background:var(--card);border:1px solid var(--rule);padding:16px 18px}
.pick h2{margin-top:0}
.pick li{margin:4px 0}
</style>
<div class="wrap">
<div class="spine"><h1>Jack Attack ’99 Test Tape</h1><span>Side A music · Side B voices · 26 Oct</span></div>
<p class="intro">First test batch for the game, made with Google’s Lyria (music) and Gemini text-to-speech (voices). Every clip is loudness-matched. The whole tape cost roughly 15p. Nothing goes into the game until you pick.</p>
${A.map(([side, list]) => `<h2>${esc(side)}</h2><ol>${list.map(t => track(t, ++n)).join('')}</ol>`).join('')}
<div class="pick"><h2>Tell Claude</h2><ol>
<li>Gran: option 1, 2 or 3?</li>
<li>Music: is the Lyria sound right for the console games, or should console tunes be chiptune made in code (sounds more like a real 1998 cartridge)?</li>
<li>Anything that sounds too modern, too American or just off.</li>
</ol></div>
</div>`;
fs.writeFileSync(new URL('./listen.html', import.meta.url), html);
console.log((html.length / 1e6).toFixed(2) + ' MB');
