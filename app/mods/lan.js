/* THE LAN: everybody's PC on one network (client: public/js/lan*.js).
 *   Network Neighborhood shares (memory only, gone when you log off):
 *     { t:'lanShare', f } { t:'lanUnshare', n } -> { t:'lanShares', list }     (everyone else gets { t:'lanShareCh', id })
 *     { t:'lanList', id } -> { t:'lanList', id, pc, list }    { t:'lanGet', id, n } -> { t:'lanFile', id, from, f } | { t:'lanErr' }
 *   WinPopup:  { t:'lanPop', to, text } -> { t:'lanPopOk', ok, err? }   (target gets { t:'lanPopIn', fromId, from, pc, text, ts })
 *              { t:'lanBlock', id } { t:'lanUnblock', i | all } { t:'lanBlocks' } -> { t:'lanBlocks', list:[names] }
 *   Floppies (persisted, a disk box of up to 4 disks per browser/member, one in the drive):
 *     lanFlBox | lanFlNew | lanFlIns {id} | lanFlGet {id} | lanFlAdd {f} | lanFlDel {n} | lanFlLabel {l} | lanFlFormat | lanFlGive {to, note}
 *     -> { t:'lanFlBox', disks, cur } / { t:'lanFl', id, l, f, h } / { t:'lanFlErr', op, err }; the receiver of a disk gets { t:'lanFlGot', ... }
 *   SQUIG99 (a harmless pretend e-mail worm): lanWormRun {from} | lanCure | lanOutbreak -> { t:'lanMe' } / { t:'lanOutbreak', ... };
 *     infected visitors "send" it to everyone they've swapped popups/files/floppies with: { t:'lanWormMail', from, g }
 *   Counter Wars (weekly top 10 of the Homepagez hit counters): lanCw -> { t:'lanCw', ... }
 *   Quiz Night with QuizJack in JackIRC #quiznight: lanQuizHere {on} | lanQuizAns {a} | lanQuizTop -> { t:'lanQuiz', text, cls }
 * Files are plain data: text (cleaned line by line, no links), a 64x48 16-colour picture (base64, exactly 2048 chars) or the id
 * of one of the PC's built-in pictures. The 4 KB socket limit keeps every message small anyway. */
'use strict';
const crypto = require('crypto');

const MAX_SHARES = 8, TXT_MAX = 3000, PIC_LEN = 2048, DISK_BYTES = 1457664, DISK_FILES = 16, DISK_REAL = 26000, BOX_MAX = 4, DISKS_MAX = 800;
const DAY = 86400000;
let ctx;

// ---------------------------------------------------------------- helpers
const pad = n => String(n).padStart(2, '0');
const today99 = () => { const d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/99'; };
const int = (v, lo, hi, d) => { const n = Math.floor(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const keyOf = c => c.member ? 'm:' + c.member.toLowerCase() : c.cid ? 'c:' + c.cid : '';
const ready = () => [...ctx.clients].filter(([, c]) => c.ready);
const byId = id => { id = id | 0; for (const [ws, c] of ctx.clients) if (c.ready && c.id === id) return [ws, c]; return null; };
const byKey = k => ready().filter(([, c]) => keyOf(c) === k);
const pcName = c => c.member ? c.member.toUpperCase().slice(0, 12) + '-PC' : String(c.nick || 'GUEST').toUpperCase();
const D = () => ctx.data;
const rl = (c, name, rate, burst) => { c.lanRl = c.lanRl || {}; if (!c.lanRl[name]) c.lanRl[name] = new ctx.Bucket(rate, burst); return c.lanRl[name].take(); };
function cleanText(s, max) {
  return String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').slice(0, max).split('\n').slice(0, 150)
    .map(l => { const lead = (/^ */.exec(l) || [''])[0].slice(0, 40); return lead + ctx.delink(ctx.clean(l, max)); }).join('\n').replace(/\n{4,}/g, '\n\n\n');
}
function cleanName(s) {
  let n = ctx.clean(String(s == null ? '' : s), 40).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  if (/^\.+$/.test(n)) n = '';
  return n.slice(0, 40);
}
function fileIn(f) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
  const n = cleanName(f.n); if (!n) return null;
  const o = { n, ty: f.ty, d: typeof f.d === 'string' && /^\d\d\/\d\d\/99$/.test(f.d) ? f.d : today99() };
  if (f.ty === 'txt') { o.tx = cleanText(f.tx, TXT_MAX); o.sz = int(f.sz, 1, DISK_BYTES, Math.max(1, o.tx.length)); }
  else if (f.ty === 'pic') { if (typeof f.pc !== 'string' || f.pc.length !== PIC_LEN || !/^[A-Za-z0-9+/]+$/.test(f.pc)) return null; o.pc = f.pc; o.sz = int(f.sz, 1, DISK_BYTES, 461878); }
  else if (f.ty === 'art') { if (typeof f.art !== 'string' || !/^[a-z0-9_]{1,30}$/.test(f.art)) return null; o.art = f.art; o.sz = int(f.sz, 1, DISK_BYTES, 230454); }
  else return null;
  return o;
}
const meta = f => ({ n: f.n, ty: f.ty, sz: f.sz, d: f.d });
const real = f => f.n.length + (f.tx || f.pc || f.art || '').length;

// ---------------------------------------------------------------- who has talked to whom (for the worm)
const links = () => (D().links = D().links || {});
function link(a, b) {
  const ka = keyOf(a), kb = keyOf(b); if (!ka || !kb || ka === kb) return;
  const now = Date.now(), L = links(), NK = D().nk = D().nk || {};
  NK[ka] = String(a.nick).slice(0, 20); NK[kb] = String(b.nick).slice(0, 20);
  for (const [x, y] of [[ka, kb], [kb, ka]]) {
    const m = L[x] = L[x] || {}; const fresh = !m[y]; m[y] = now;
    const ks = Object.keys(m); if (ks.length > 30) { ks.sort((p, q) => m[p] - m[q]); delete m[ks[0]]; }
    if (fresh && worm().inf[x] && !worm().inf[y]) spreadTo(x, y);
  }
  ctx.markDirty();
}
// ---------------------------------------------------------------- blocks
const blocks = () => (D().blocks = D().blocks || {});
const blocked = (target, sender) => (blocks()[target] || []).some(b => b.k === sender);
const blockList = k => (blocks()[k] || []).map(b => b.n);

// ---------------------------------------------------------------- floppies
const disks = () => (D().disks = D().disks || {});
const boxes = () => (D().box = D().box || {});
function box(c) { const k = keyOf(c); if (!k) return null; const B = boxes(); if (!B[k]) B[k] = { d: [], cur: null, ts: Date.now() }; return B[k]; }
const used = d => d.f.reduce((t, f) => t + f.sz, 0);
function boxView(c) {
  const b = box(c); if (!b) return { t: 'lanFlBox', disks: [], cur: null };
  b.d = b.d.filter(id => disks()[id]); if (b.cur && !b.d.includes(b.cur)) b.cur = null;
  return { t: 'lanFlBox', cur: b.cur, disks: b.d.map(id => { const d = disks()[id]; return { id, l: d.l, nf: d.f.length, used: used(d), h: d.h.slice(-1)[0] || '' }; }) };
}
const diskView = (id) => { const d = disks()[id]; return d ? { t: 'lanFl', id, l: d.l, f: d.f, h: d.h, used: used(d) } : { t: 'lanFl', id: null, l: '', f: [], h: [], used: 0 }; };
const flErr = (ws, op, err) => ctx.send(ws, { t: 'lanFlErr', op, err });
function newDiskId() { let id; do id = crypto.randomBytes(5).toString('hex'); while (disks()[id]); return id; }

// ---------------------------------------------------------------- SQUIG99
const worm = () => { const w = D().worm = D().worm || {}; w.inf = w.inf || {}; w.mailed = w.mailed || {}; w.pend = w.pend || {}; w.log = w.log || []; w.ever = w.ever | 0; w.cures = w.cures | 0; w.spreads = w.spreads | 0; return w; };
const level = n => n >= 8 ? 'SQUIGTASTROPHIC' : n >= 2 ? 'HIGH' : n === 1 ? 'MEDIUM' : 'LOW';
function meView(c) {
  const k = keyOf(c), i = k && worm().inf[k];
  return { t: 'lanMe', inf: i ? { ts: i.ts, by: i.by, g: i.g } : null, blocks: blockList(k), pc: pcName(c) };
}
function mailTo(k, from, g) {
  const W = worm(), now = Date.now(); W.mailed[k] = now;
  const on = byKey(k);
  if (on.length) on.forEach(([ws]) => ctx.send(ws, { t: 'lanWormMail', from, g }));
  else { const p = W.pend[k] = W.pend[k] || []; p.push({ from, g, ts: now }); if (p.length > 3) p.shift(); }
  ctx.markDirty();
}
function spreadTo(from, to) {
  const W = worm(), now = Date.now(), src = W.inf[from];
  if (!src || W.inf[to] || (W.mailed[to] && now - W.mailed[to] < 2 * DAY) || blocked(to, from)) return false;
  mailTo(to, src.n || 'A friend', (src.g | 0) + 1);
  const nameOf = k => (W.inf[k] && W.inf[k].n) || (k.startsWith('m:') ? (ctx.state.members[k.slice(2)] || {}).name : '') || ((byKey(k)[0] || [])[1] || {}).nick || (D().nk || {})[k] || 'someone';
  W.log.push({ a: src.n || 'someone', b: nameOf(to), ts: now }); if (W.log.length > 30) W.log.shift();
  W.spreads++; bump(); return true;
}
let bumpT = null;
function bump() { if (bumpT) return; bumpT = setTimeout(() => { bumpT = null; ctx.broadcast({ t: 'lanOutbreakCh' }); }, 1500); }
function outbreak() {
  const W = worm(), inf = Object.values(W.inf);
  return { t: 'lanOutbreak', n: inf.length, level: level(inf.length), ever: W.ever, cures: W.cures, spreads: W.spreads,
    nodes: inf.sort((a, b) => b.ts - a.ts).slice(0, 24).map(i => ({ n: i.n, g: i.g | 0, by: i.by, ts: i.ts })), log: W.log.slice(-15) };
}

// ---------------------------------------------------------------- Counter Wars
const weekKey = ts => { const d = new Date(ts); const day = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10); };
const weekEnds = wk => Date.parse(wk + 'T00:00:00Z') + 7 * DAY;
const hpIdx = () => { const m = ctx.state.mods && ctx.state.mods.homepages; const idx = (m && m.idx) || {}; const out = {}; for (const [k, e] of Object.entries(idx)) if (e && ctx.state.members[k]) out[k] = e; return out; };
function cw() {
  const C = D().cw = D().cw || {}, now = Date.now(), wk = weekKey(now), idx = hpIdx();
  if (!C.week) { C.week = wk; C.base = {}; for (const [k, e] of Object.entries(idx)) C.base[k] = e.h | 0; ctx.markDirty(); }
  if (C.week !== wk) {
    C.last = { week: C.week, top: ranking(C, idx).slice(0, 10) };
    C.week = wk; C.base = {}; for (const [k, e] of Object.entries(idx)) C.base[k] = e.h | 0; ctx.markDirty();
  }
  return C;
}
function ranking(C, idx) {
  return Object.entries(idx).map(([k, e]) => ({ k, n: e.n, t: e.t, a: e.a, hood: e.hood, h: e.h | 0, w: Math.max(0, (e.h | 0) - (C.base[k] | 0)) }))
    .filter(x => x.w > 0).sort((a, b) => b.w - a.w || b.h - a.h || a.n.localeCompare(b.n));
}
function cwView() {
  const C = cw(), idx = hpIdx(), all = Object.entries(idx).map(([k, e]) => ({ k, n: e.n, t: e.t, a: e.a, hood: e.hood, h: e.h | 0 }));
  return { t: 'lanCw', week: C.week, ends: weekEnds(C.week), top: ranking(C, idx).slice(0, 10), all: all.sort((a, b) => b.h - a.h).slice(0, 10), pages: all.length, last: C.last || null, total: all.reduce((t, x) => t + x.h, 0) };
}

// ---------------------------------------------------------------- Quiz Night
// [question, [accepted answers (lower case, letters/numbers/spaces)], the answer as QuizJack says it]
const Q = [
  ['POCKET CRITTERS: What colour is Zapachu?', ['yellow'], 'Yellow'],
  ['POCKET CRITTERS: Which Pocket Critters is number 001 in the Critterdex in Moss and Puddle?', ['bulbasaur'], 'Bulbabeast'],
  ['POCKET CRITTERS: Which Pocket Critters evolves into Charmeleoff?', ['charmander'], 'Charbroiler'],
  ['POCKET CRITTERS: What is the name of Ash\'s home town in the Pocket Critters cartoon?', ['pallet', 'moss town'], 'Moss Town'],
  ['POCKET CRITTERS: Which professor gives you your first Pocket Critters in Moss and Puddle?', ['acorn', 'professor acorn', 'prof-acorn', 'oak'], 'Professor Acorn'],
  ['POCKET CRITTERS: How many Pocket Critters are there in Moss and Puddle, counting MewOne?', ['151', 'one hundred and fifty one', 'a hundred and fifty one'], '151'],
  ['POCKET CRITTERS: Which Pocket Critters, number 150, was made in a laboratory?', ['mewtoo', 'mew-too', 'mewtwo', 'mew-two', 'mew2'], 'MewToo'],
  ['POCKET CRITTERS: What type of Pocket Critters is Squirturtle?', ['water'], 'Water'],
  ['POCKET CRITTERS: What is the word Pocket Critters short for?', ['pocket critters', 'pocket monster'], 'Pocket Critters'],
  ['POCKET CRITTERS: What does Zapachu evolve into with a Thunder Rock?', ['raichu'], 'Zapachoo'],
  ['POCKET CRITTERS: Which talking cat critter works for Team Pocket?', ['meowf', 'meowth'], 'Meowf'],
  ['POCKET CRITTERS: Which pink balloon Pocket Critters sings people to sleep?', ['jigglypuff'], 'Jelly Puff'],
  ['POCKET CRITTERS: In the games, what do you call the trainers you beat to win badges?', ['gym leader', 'gym leaders'], 'Gym Leaders'],
  ['GAMES: What is the name of Marlo\'s brother?', ['luigi'], 'Louie G'],
  ['GAMES: What is the name of the hero in The Legend of Zeldo: Kazoo of Time?', ['link'], 'Link'],
  ['GAMES: Which purple badger is Segue\'s mascot?', ['zip', 'zip the badger', 'sonic'], 'Zip'],
  ['GAMES: In Metal Gear Wobbly, what is the hero\'s codename?', ['snake', 'soggy snake'], 'Soggy Snake'],
  ['GAMES: Which company makes the PlaySpace?', ['sony'], 'Somy'],
  ['GAMES: Clara Loft is the star of which series of games?', ['crypt raider'], 'Crypt Raider'],
  ['GAMES: In Goldenballs 007 on the ULTRA 64, which actor\'s James Bland do you play as?', ['pierce brosnut', 'brosnan'], 'Pierce Brosnut'],
  ['GAMES: How many squares make up each piece in Blockology?', ['4', 'four'], 'Four'],
  ['GAMES: What does the N in ULTRA 64 stand for?', ['nintendo'], 'Ultra Entertainment'],
  ['GAMES: Which yellow dot-eating hero first chomped through a maze in the arcades in 1980?', ['chomp man', 'chompman', 'chomp-man', 'pac man', 'pacman'], 'Chomp-Man'],
  ['GAMES: What colour is Spike the Stegosaur the Dragon?', ['purple'], 'Purple'],
  ['GAMES: What kind of animal is Crash, of Warp Wombat? (clue: it\'s in the name)', ['bandicoot', 'a bandicoot'], 'A bandicoot'],
  ['GAMES: Segue\'s newest console came out in Japan in November 1998. What is it called?', ['dreamcast'], 'The Daydream'],
  ['GAMES: Which Ultra Entertainment handheld got a colour version in 1998?', ['game lad', 'gameboy', 'game lad color', 'gameboy color', 'game lad colour', 'gameboy colour'], 'The Game Lad (the Game Lad Color)'],
  ['INTERGALACTIC BATTLES: Which boy from Tattyween wins a peapod race in The Phantom Nuisance?', ['anakin', 'anklekin skywobbler'], 'Anklekin Skywobbler'],
  ['INTERGALACTIC BATTLES: What is the name of the clumsy Gungoo in The Phantom Nuisance?', ['jar jar jams', 'jar jar jams', 'jarjar'], 'Jar Jar Jams'],
  ['INTERGALACTIC BATTLES: Which Sulk Lord with a double-bladed lightspatula fights Qui-Gym and Obi-Wan Cannoli in Episode I?', ['dark mole', 'maul'], 'Dark Mole'],
  ['INTERGALACTIC BATTLES: Who is Qui-Gon Gym\'s apprentice in The Phantom Nuisance?', ['obi wan', 'obi wan cannoli', 'obiwan', 'kenobi'], 'Obi-Wan Cannoli'],
  ['INTERGALACTIC BATTLES: What is the name of Ham Solo\'s ship?', ['millennium pigeon', 'millenium falcon', 'the falcon', 'falcon'], 'The Millennium Pigeon'],
  ['INTERGALACTIC BATTLES: Which small green Space Cadet Master trains Luke in The Empire Strikes Out?', ['yoda'], 'Yoga'],
  ['INTERGALACTIC BATTLES: Which desert planet is Luke Skywobbler\'s home?', ['tatooine'], 'Tattyween'],
  ['INTERGALACTIC BATTLES: Who created Intergalactic Battles and directed the first film?', ['gordon lukewarm', 'lucas'], 'Gordon Lukewarm'],
  ['INTERGALACTIC BATTLES: Which golden droid is fluent in over six million forms of communication?', ['c3po', 'c 3po', 'c3 po', 'c 3 po', 'threepio'], 'C-4PO'],
  ['INTERGALACTIC BATTLES: What is Dark Vapour\'s real name?', ['anakin', 'anklekin skywobbler'], 'Anklekin Skywobbler'],
  ['FILMS: In The Modemtrix, what colour is the pill that Neon takes?', ['red'], 'Red'],
  ['FILMS: Which actor plays Neon in The Modemtrix?', ['keanu leaves', 'keanu'], 'Keanu Leaves'],
  ['FILMS: In Toy Storey, finish Buzz Lightbulb\'s catchphrase: "To infinity and..."', ['beyond'], 'Beyond!'],
  ['FILMS: What is the name of the cowboy doll in Toy Storey?', ['woodsy', 'sheriff woodsy', 'woody', 'sheriff woody'], 'Woodsy'],
  ['FILMS: Which 1999 Dizzney cartoon is about a boy raised by gorillas?', ['tarzan'], 'Tarzon'],
  ['FILMS: Which 1998 Pixer film is about an ant called Flick?', ['a bugs life', 'bugs life'], 'A Bug\'s Strife'],
  ['FILMS: In The Mommy (1999), the lost city of Hamunaptrap is in which country?', ['egypt'], 'Egypt'],
  ['FILMS: Which 1999 film stars Hugh Grunt as a London bookshop owner who meets a film star?', ['knotting hill'], 'Knotting Hill'],
  ['FILMS: What is the name of Wallis\'s clever dog?', ['grommet', 'gromit'], 'Grommet'],
  ['TELLY: Name the purple Telly Tumbler with a triangle on his head.', ['twinky tinky', 'tinkywinky'], 'Twinky Tinky'],
  ['TELLY: In The Simpsocks, what is the name of Bort\'s dad?', ['hormer', 'hormer simpsock', 'homer', 'homer simpson'], 'Hormer'],
  ['TELLY: What is the name of the Doctor\'s robot dog in Doctor Whoops?', ['k8', 'k 8', 'k eight', 'k9', 'k 9', 'k nine'], 'K-8'],
  ['TELLY: Who asks the questions on Who Wants to Be a Squillionaire?', ['chris tarrot', 'tarrant'], 'Chris Tarrot'],
  ['TELLY: How many questions do you have to get right to win the million on Who Wants to Be a Squillionaire?', ['15', 'fifteen'], '15'],
  ['TELLY: Which Thunderbudgie is the big green one?', ['2', 'two', 'thunderbudgie 2', 'thunderbudgie two', 'thunderbudgie 2', 'thunderbudgie two'], 'Thunderbudgie 2'],
  ['TELLY: Which Saturday morning show do Ant and Deck present with Cat Deeply? (four letters, then Live)', ['smtv', 'smtw live', 'sm tv', 'sm tv live'], 'SM:TW Live'],
  ['MUSIC: Which girl group sang "Wannabee"?', ['slice girls', 'the slice girls'], 'The Slice Girls'],
  ['MUSIC: Who had a UK number one in February 1999 with "...Baby Two More Times"?', ['britney', 'brittany spheres'], 'Brittany Spheres'],
  ['MUSIC: Which pop group had a 1999 number one with "Bring Them All Back"?', ['z club 7', 'z club', 'z club seven', 'sclub7', 'sclub 7'], 'Z Club 7'],
  ['MUSIC: Who sings "Livin\' la Vida Cocoa"?', ['rickie martini'], 'Rickie Martini'],
  ['MUSIC: Ronan Keeping is the lead singer of which Irish boy band?', ['boyzone'], 'Boyzown'],
  ['MUSIC: Which Liverpool band sang "Yellow Submersible"?', ['beatles', 'the beetles'], 'The Beetles'],
  ['SPACE: On 11 August 1999 there was a total eclipse of the Sun. Which English county had the best view? (starts with C)', ['cornwall'], 'Cornwall'],
  ['SPACE: Which planet is closest to the Sun?', ['mercury'], 'Mercury'],
  ['SPACE: Which is the biggest planet in the Solar System?', ['jupiter'], 'Jupiter'],
  ['SPACE: Who was the first person to walk on the Moon, in 1969?', ['neil armweak', 'armstrong'], 'Neil Armweak'],
  ['SPACE: What is the name of the Russian space station that has been in orbit since 1986?', ['mir'], 'Mir'],
  ['SPACE: How many planets are there in the Solar System?', ['9', 'nine'], 'Nine'],
  ['SPACE: Which American astronaut went back into space in 1998, aged 77?', ['john glimm', 'glenn'], 'John Glimm'],
  ['SPACE: What was the name of the little rover that drove around on Mars in 1997?', ['sojourner'], 'Sojourner'],
  ['SPACE: Which very bright comet could be seen without a telescope in 1997?', ['hale bopp', 'halebopp'], 'Hail-Bop'],
  ['SPACE: Which planet is famous for its rings?', ['saturn'], 'Saturn'],
  ['SPACE: What is the name of our galaxy?', ['milky way', 'the milky way'], 'The Milky Way'],
  ['BONUS: How many little squares are on each face of a normal Rubrick\'s Cube?', ['9', 'nine'], 'Nine'],
];
const norm = s => ' ' + String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const QUIZ_LEN = 10, ANSWER_MS = 45000, HINT_MS = 22000, GAP_MS = 9000;
const here = new Map(); // client id -> ws
let sess = null, forcedUntil = 0, lastAdvert = 0;
const qsTop = () => { const Qs = D().qs = D().qs || { week: weekKey(Date.now()), s: {} }; const wk = weekKey(Date.now()); if (Qs.week !== wk) { Qs.last = { week: Qs.week, top: topOf(Qs.s, 10) }; Qs.week = wk; Qs.s = {}; ctx.markDirty(); } return Qs; };
const topOf = (s, n) => Object.entries(s).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
function say(text, cls, only) { const m = { t: 'lanQuiz', text: String(text).slice(0, 400), cls: cls || '' }; if (only) return ctx.send(only, m); for (const ws of here.values()) ctx.send(ws, m); }
function nextQ() {
  const deck = D().qdeck = D().qdeck || { o: [], p: 0 };
  if (!Array.isArray(deck.o) || deck.o.length !== Q.length || deck.p >= deck.o.length) { deck.o = Q.map((_, i) => i); for (let i = deck.o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck.o[i], deck.o[j]] = [deck.o[j], deck.o[i]]; } deck.p = 0; }
  ctx.markDirty();
  return deck.o[deck.p++];
}
const minsToNext = () => { const d = new Date(); return 60 - d.getMinutes(); };
const quizLive = now => forcedUntil > now || new Date(now).getMinutes() < 10;
function hint(a) { return a.replace(/[A-Za-z0-9]/g, (ch, i) => (i === 0 || a[i - 1] === ' ' || a[i - 1] === '-') ? ch : '_'); }
function quizTick() {
  const now = Date.now();
  if (!quizLive(now)) { if (sess && !sess.over && sess.started) { say('*** TIME\'S UP! Quiz Night is over for this hour. ' + sessScores()); } sess = null; return; }
  const hour = Math.floor(now / 3600000);
  if (!sess || (sess.hour !== hour && forcedUntil <= now)) sess = { hour, started: false, over: false, n: 0, cur: null, next: 0, sc: {} };
  if (sess.over) return;
  if (!here.size) { if (sess.cur) sess.cur.at += 1000; if (sess.next) sess.next += 1000; return; } // nobody in: QuizJack waits
  if (!sess.started) {
    sess.started = true; sess.next = now + 7000;
    say('*** OI OI! IT\'S QUIZ NIGHT!!! I\'m QuizJack. 10 questions about 1999: games, films, telly, music, space, Intergalactic Battles and Pocket Critters. First right answer gets a point. Just type your answer. No cheating (I can see you).', 'big');
    if (now - lastAdvert > 3 * 3600000 && ready().length >= 2) { lastAdvert = now; ctx.pushChat({ sys: true, text: '*** QuizJack: QUIZ NIGHT is on NOW in JackIRC! Type /join #quiznight', ts: now }); }
    return;
  }
  const c = sess.cur;
  if (c && !c.done) {
    const el = now - c.at, q = Q[c.i];
    if (el > HINT_MS && !c.hinted) { c.hinted = true; say(`HINT: ${hint(q[2])}`, 'hint'); }
    if (el > ANSWER_MS) { c.done = true; sess.next = now + GAP_MS; say(`Nobody got it! The answer was: ${q[2]}. Too hard? Ask Gubbinz. Actually, don\'t.`, 'reveal'); }
    return;
  }
  if (now < sess.next) return;
  const left = (forcedUntil > now ? forcedUntil : (hour * 3600000 + 10 * 60000)) - now;
  if (sess.n >= QUIZ_LEN || left < ANSWER_MS + 5000) { sess.over = true; say('*** THAT\'S DA LOT! Quiz Night is over. ' + sessScores() + ' Back on the hour, every hour. !scores for this week\'s leaderboard.', 'big'); return; }
  sess.n++; sess.cur = { i: nextQ(), at: now, done: false, hinted: false, tries: {} };
  say(`QUESTION ${sess.n} of ${QUIZ_LEN}: ${Q[sess.cur.i][0]}`, 'q');
}
function sessScores() {
  const t = topOf(sess ? sess.sc : {}, 3);
  return t.length ? 'Tonight\'s winner' + (t.length > 1 ? 's' : '') + ': ' + t.map(([n, p]) => `${n} (${p})`).join(', ') + '.' : 'Nobody scored. Not one point. I\'m telling Gubbinz.';
}
function weekLine() { const Qs = qsTop(), t = topOf(Qs.s, 5); return t.length ? 'THIS WEEK\'S LEADERBOARD: ' + t.map(([n, p], i) => `${i + 1}. ${n} ${p}`).join('  ') : 'Nobody has scored this week yet. Could be YOU.'; }
function quizAnswer(ws, c, raw) {
  const text = ctx.clean(String(raw || ''), 120); if (!text) return;
  const cmd = text.toLowerCase();
  if (cmd === '!scores' || cmd === '!top' || cmd === '!leaderboard') return say(weekLine(), 'info', ws);
  if (cmd === '!next' || cmd === '!quiz' || cmd === '!help') return say(quizLive(Date.now()) && sess && !sess.over ? `Quiz Night is ON right now! Question ${sess.n || 1} of ${QUIZ_LEN}. Just type your answer.` : `Next Quiz Night starts in ${minsToNext()} minute(s), on the hour. Stay here, I'll start when it's time. !scores for the leaderboard.`, 'info', ws);
  const cur = sess && sess.cur;
  if (!cur || cur.done || text.length > 60 || cmd.startsWith('/')) return;
  cur.tries[c.id] = (cur.tries[c.id] | 0) + 1;
  if (cur.tries[c.id] > 3) { if (cur.tries[c.id] === 4) say(`${c.nick}: that's 3 guesses for this one. Let someone else have a go!`, 'info', ws); return; }
  const q = Q[cur.i], t = norm(text);
  if (!q[1].some(a => t.includes(' ' + a + ' ')) && !t.includes(norm(q[2]))) return; // the answer as shown (the parody name) is always accepted too
  cur.done = true; sess.next = Date.now() + GAP_MS;
  const Qs = qsTop(), nick = String(c.nick).slice(0, 20);
  Qs.s[nick] = (Qs.s[nick] | 0) + 1; sess.sc[nick] = (sess.sc[nick] | 0) + 1; ctx.markDirty();
  const ks = Object.keys(Qs.s); if (ks.length > 300) { ks.sort((a, b) => Qs.s[a] - Qs.s[b]); delete Qs.s[ks[0]]; }
  say(`YESSS!!! ${nick} got it! The answer was: ${q[2]}. ${nick} has ${Qs.s[nick]} point${Qs.s[nick] === 1 ? '' : 's'} this week.`, 'win');
  if (ctx.emit) ctx.emit('quiz', c); // Rupees + a chance of loot (mods/econ.js, mods/loot.js)
}

// ---------------------------------------------------------------- moving a guest's stuff to their new member name
function migrate(from, to) {
  if (!from || !to || from === to) return;
  const B = boxes();
  if (B[from] && !B[to]) { B[to] = B[from]; delete B[from]; }
  const W = worm(); if (W.inf[from] && !W.inf[to]) { W.inf[to] = W.inf[from]; delete W.inf[from]; }
  if (W.pend[from]) { W.pend[to] = (W.pend[to] || []).concat(W.pend[from]).slice(-3); delete W.pend[from]; }
  ctx.markDirty();
}
const recentGone = new Map(), pendPop = new Map(); // visitor id -> { at, pc } / [lanPopIn...] for connections that just dropped
setInterval(() => { const t = Date.now(); for (const [id, r] of recentGone) if (t - r.at > 120000) { recentGone.delete(id); pendPop.delete(id); } }, 60000).unref();
function greet(ws, c) {
  const k = keyOf(c); if (!k) return;
  const W = worm(), now = Date.now();
  const b = boxes()[k]; if (b) b.ts = now;
  if (W.inf[k]) W.inf[k].n = c.nick;
  ctx.send(ws, meView(c));
  const p = W.pend[k];
  if (p && p.length) { delete W.pend[k]; p.forEach((m, i) => setTimeout(() => ctx.send(ws, { t: 'lanWormMail', from: m.from, g: m.g }), 4000 + i * 1500)); ctx.markDirty(); return; }
  // patient zero: now and then a mystery "Happy New Year" e-mail turns up all by itself
  const infected = Object.keys(W.inf).length;
  if (!W.inf[k] && (!W.mailed[k] || now - W.mailed[k] > 5 * DAY) && now - (W.zero || 0) > 20 * 60000 && Math.random() < (infected ? 0.04 : 0.15)) {
    W.zero = now; W.mailed[k] = now; ctx.markDirty();
    setTimeout(() => ctx.send(ws, { t: 'lanWormMail', from: '', g: 0 }), 25000 + Math.random() * 60000);
  }
}

function prune() {
  const now = Date.now(), W = worm(), B = boxes(), DK = disks(), L = links();
  for (const [k, i] of Object.entries(W.inf)) if (now - i.ts > 7 * DAY) delete W.inf[k];
  for (const [k, t] of Object.entries(W.mailed)) if (now - t > 14 * DAY) delete W.mailed[k];
  for (const [k, p] of Object.entries(W.pend)) if (!p.length || now - p[p.length - 1].ts > 14 * DAY) delete W.pend[k];
  for (const [k, m] of Object.entries(L)) { for (const [o, t] of Object.entries(m)) if (now - t > 30 * DAY) delete m[o]; if (!Object.keys(m).length) delete L[k]; }
  const NK = D().nk || {}; for (const k of Object.keys(NK)) if (!L[k]) delete NK[k];
  for (const [k, b] of Object.entries(B)) if (now - (b.ts || 0) > 45 * DAY || !b.d.length && now - (b.ts || 0) > DAY) { b.d.forEach(id => delete DK[id]); delete B[k]; }
  const owned = new Set(); for (const b of Object.values(B)) b.d.forEach(id => owned.add(id));
  for (const id of Object.keys(DK)) if (!owned.has(id)) delete DK[id];
  if (Object.keys(DK).length > DISKS_MAX) { const old = Object.entries(B).sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0)); while (Object.keys(DK).length > DISKS_MAX * 0.9 && old.length) { const [k, b] = old.shift(); b.d.forEach(id => delete DK[id]); delete B[k]; } }
  cw(); qsTop();
  ctx.markDirty();
}

// ---------------------------------------------------------------- messages
function handle(ws, c, m) {
  const k = keyOf(c);
  switch (m.t) {
    // ---- Network Neighborhood shares
    case 'lanShare': {
      if (!rl(c, 'share', 1, 12)) return ctx.send(ws, { t: 'lanErr', op: 'share', err: 'Slow down! (The network cable is only so long.)' });
      const f = fileIn(m.f); if (!f) return ctx.send(ws, { t: 'lanErr', op: 'share', err: 'That file can\'t be shared. Only text files and pictures fit down the cable.' });
      const list = c.lanShares = (c.lanShares || []).filter(x => x.n.toLowerCase() !== f.n.toLowerCase());
      if (list.length >= MAX_SHARES) return ctx.send(ws, { t: 'lanErr', op: 'share', err: `You can only share ${MAX_SHARES} files at once. Stop sharing one first.` });
      list.push(f);
      ctx.send(ws, { t: 'lanShares', list: list.map(meta) });
      return ctx.broadcast({ t: 'lanShareCh', id: c.id }, ws);
    }
    case 'lanUnshare': {
      const n = String(m.n || '').toLowerCase(); c.lanShares = (c.lanShares || []).filter(x => m.all ? false : x.n.toLowerCase() !== n);
      ctx.send(ws, { t: 'lanShares', list: c.lanShares.map(meta) });
      return ctx.broadcast({ t: 'lanShareCh', id: c.id }, ws);
    }
    case 'lanList': {
      const t = byId(m.id); if (!t) return ctx.send(ws, { t: 'lanList', id: m.id | 0, gone: true, list: [] });
      return ctx.send(ws, { t: 'lanList', id: t[1].id, pc: pcName(t[1]), nick: t[1].nick, list: (t[1].lanShares || []).map(meta) });
    }
    case 'lanGet': {
      if (!rl(c, 'get', 0.5, 6)) return ctx.send(ws, { t: 'lanErr', op: 'get', err: 'The network is busy. (Someone else is downloading.) Try again in a few seconds.' });
      const t = byId(m.id); const f = t && (t[1].lanShares || []).find(x => x.n.toLowerCase() === String(m.n || '').toLowerCase());
      if (!f) return ctx.send(ws, { t: 'lanErr', op: 'get', err: 'The network path was not found. (They stopped sharing it, or logged off.)' });
      if (t[1] !== c) link(c, t[1]);
      return ctx.send(ws, { t: 'lanFile', id: t[1].id, from: t[1].nick, pc: pcName(t[1]), f });
    }
    // ---- WinPopup
    case 'lanPop': {
      if (!c.member) return ctx.send(ws, { t: 'lanPopOk', ok: false, err: 'JackPopup messages are for JackNet members. Joining is FREE!' });
      const text = ctx.delink(ctx.clean(m.text, 200)); if (!text) return;
      const t = byId(m.to);
      // their connection only just dropped: hold the message and pop it up when they're back (same id, see server.js)
      const r = !t && recentGone.get(m.to | 0);
      if (r && Date.now() - r.at < 90000 && rl(c, 'pop', 0.25, 3)) {
        const q = pendPop.get(m.to | 0) || []; if (q.length < 5) q.push({ t: 'lanPopIn', fromId: c.id, from: c.nick, pc: pcName(c), text, ts: Date.now() }); pendPop.set(m.to | 0, q);
        return ctx.send(ws, { t: 'lanPopOk', ok: true, to: r.pc + ' (their connection dropped: it will pop up when they\'re back)' });
      }
      if (!t || t[1] === c) return ctx.send(ws, { t: 'lanPopOk', ok: false, err: 'The message could not be delivered. That computer has logged off. (Probably called down for tea.)' });
      if (!rl(c, 'pop', 0.25, 3)) return ctx.send(ws, { t: 'lanPopOk', ok: false, err: 'Slow down! You can send a message every few seconds.' });
      if (blocked(keyOf(t[1]), k)) return ctx.send(ws, { t: 'lanPopOk', ok: false, err: `The message could not be delivered to \\\\${pcName(t[1])}. (They might be busy, or have JackPopup switched off.)` });
      ctx.send(t[0], { t: 'lanPopIn', fromId: c.id, from: c.nick, pc: pcName(c), text, ts: Date.now() });
      link(c, t[1]);
      return ctx.send(ws, { t: 'lanPopOk', ok: true, to: pcName(t[1]) });
    }
    case 'lanBlock': {
      const t = byId(m.id); if (!t || !k || t[1] === c) return;
      const tk = keyOf(t[1]); if (!tk) return;
      const list = blocks()[k] = (blocks()[k] || []).filter(b => b.k !== tk); list.push({ k: tk, n: t[1].nick }); if (list.length > 50) list.shift();
      ctx.markDirty(); return ctx.send(ws, { t: 'lanBlocks', list: blockList(k) });
    }
    case 'lanUnblock': {
      if (!k) return;
      if (m.all) delete blocks()[k]; else { const list = blocks()[k] || []; const i = int(m.i, 0, list.length - 1, -1); if (i >= 0) list.splice(i, 1); }
      ctx.markDirty(); return ctx.send(ws, { t: 'lanBlocks', list: blockList(k) });
    }
    case 'lanBlocks': return ctx.send(ws, { t: 'lanBlocks', list: blockList(k) });
    // ---- floppies
    case 'lanFlBox': return ctx.send(ws, boxView(c));
    case 'lanFlNew': {
      const b = box(c); if (!b) return;
      if (!rl(c, 'fl', 2, 12)) return flErr(ws, 'new', 'The drive is still grinding. Wait a moment.');
      if (b.d.length >= BOX_MAX) return flErr(ws, 'new', `Your disk box is full (${BOX_MAX} disks). Give one to someone, or format one.`);
      const id = newDiskId(); disks()[id] = { l: '', f: [], h: [c.nick], ts: Date.now() }; b.d.push(id); b.cur = id; b.ts = Date.now();
      ctx.markDirty(); ctx.send(ws, boxView(c)); return ctx.send(ws, diskView(id));
    }
    case 'lanFlIns': {
      const b = box(c); if (!b) return;
      const id = m.id == null ? null : String(m.id); if (id && !b.d.includes(id)) return flErr(ws, 'ins', 'That disk is not in your disk box.');
      b.cur = id; ctx.markDirty(); ctx.send(ws, boxView(c)); return id ? ctx.send(ws, diskView(id)) : null;
    }
    case 'lanFlGet': { const b = box(c); const id = String(m.id || (b && b.cur) || ''); if (!b || !b.d.includes(id)) return ctx.send(ws, diskView(null)); return ctx.send(ws, diskView(id)); }
    case 'lanFlAdd': {
      const b = box(c); if (!b) return;
      if (!rl(c, 'fl', 2, 12)) return flErr(ws, 'add', 'The drive is still grinding. Wait a moment.');
      const d = b.cur && disks()[b.cur]; if (!d) return flErr(ws, 'nodisk', 'Please insert a disk into drive A:');
      const f = fileIn(m.f); if (!f) return flErr(ws, 'add', 'Cannot copy that file. Only text files and pictures fit on a floppy. (The rest is too big. Or too weird.)');
      const rest = d.f.filter(x => x.n.toLowerCase() !== f.n.toLowerCase());
      if (rest.length >= DISK_FILES) return flErr(ws, 'full', `The disk is full. (A floppy's root folder can hold loads of files, but this one is jammed with ${DISK_FILES}.)`);
      if (rest.reduce((t, x) => t + x.sz, 0) + f.sz > DISK_BYTES || rest.reduce((t, x) => t + real(x), 0) + real(f) > DISK_REAL) return flErr(ws, 'full', 'full');
      rest.push(f); d.f = rest; d.ts = Date.now(); b.ts = Date.now();
      ctx.markDirty(); ctx.send(ws, diskView(b.cur)); return ctx.send(ws, boxView(c));
    }
    case 'lanFlDel': {
      const b = box(c); const d = b && b.cur && disks()[b.cur]; if (!d) return flErr(ws, 'nodisk', 'Please insert a disk into drive A:');
      const n = String(m.n || '').toLowerCase(); d.f = d.f.filter(x => x.n.toLowerCase() !== n);
      ctx.markDirty(); ctx.send(ws, diskView(b.cur)); return ctx.send(ws, boxView(c));
    }
    case 'lanFlFormat': {
      const b = box(c); const d = b && b.cur && disks()[b.cur]; if (!d) return flErr(ws, 'nodisk', 'Please insert a disk into drive A:');
      d.f = []; if (m.l != null) d.l = ctx.delink(ctx.clean(m.l, 30)); ctx.markDirty(); ctx.send(ws, diskView(b.cur)); return ctx.send(ws, boxView(c));
    }
    case 'lanFlLabel': {
      const b = box(c); const d = b && b.cur && disks()[b.cur]; if (!d) return flErr(ws, 'nodisk', 'Please insert a disk into drive A:');
      d.l = ctx.delink(ctx.clean(m.l, 30)); ctx.markDirty(); ctx.send(ws, diskView(b.cur)); return ctx.send(ws, boxView(c));
    }
    case 'lanFlGive': {
      if (!c.member) return flErr(ws, 'give', 'Giving disks away is for JackNet members. Joining is FREE!');
      const b = box(c); const id = b && b.cur; const d = id && disks()[id]; if (!d) return flErr(ws, 'give', 'There is no disk in drive A: to give away.');
      if (!rl(c, 'give', 0.1, 3)) return flErr(ws, 'give', 'Slow down! Hand out disks one at a time.');
      const t = byId(m.to); if (!t || t[1] === c) return flErr(ws, 'give', 'They\'ve gone! (Logged off before you could hand it over.)');
      const tb = box(t[1]); if (!tb) return flErr(ws, 'give', 'Their computer has no floppy drive. (Weird.)');
      if (blocked(keyOf(t[1]), k)) return flErr(ws, 'give', `\\\\${pcName(t[1])} can't take a disk right now. (Their hands are full.)`);
      tb.d = tb.d.filter(x => disks()[x]);
      if (tb.d.length >= BOX_MAX) return flErr(ws, 'give', `\\\\${pcName(t[1])}'s disk box is full. They need to give one away first.`);
      b.d = b.d.filter(x => x !== id); b.cur = null;
      tb.d.push(id); if (!tb.cur) tb.cur = id; tb.ts = Date.now();
      d.h.push(t[1].nick); if (d.h.length > 8) d.h.splice(0, d.h.length - 8); d.ts = Date.now();
      const note = ctx.delink(ctx.clean(m.note, 80));
      ctx.markDirty();
      ctx.send(t[0], { t: 'lanFlGot', from: c.nick, pc: pcName(c), id, l: d.l, nf: d.f.length, note, inDrive: tb.cur === id });
      ctx.send(t[0], boxView(t[1]));
      link(c, t[1]);
      ctx.send(ws, { t: 'lanFlGave', to: t[1].nick, pc: pcName(t[1]) });
      return ctx.send(ws, boxView(c));
    }
    // ---- SQUIG99
    case 'lanWormRun': {
      if (!k) return;
      const W = worm();
      if (!W.inf[k]) {
        if (!rl(c, 'worm', 0.05, 2)) return;
        const by = ctx.clean(m.from, 20) || '';
        const g = int(m.g, 0, 999, 0);
        W.inf[k] = { ts: Date.now(), by, g, n: c.nick }; W.ever++;
        ctx.markDirty(); bump();
        ctx.send(ws, meView(c));
        // it "e-mails itself" to everyone you've swapped messages, files or floppies with lately
        const mine = links()[k] || {}; let sent = 0;
        for (const o of Object.keys(mine).sort((a, b) => mine[b] - mine[a])) { if (sent >= 6) break; if (spreadTo(k, o)) sent++; }
      } else ctx.send(ws, meView(c));
      return;
    }
    case 'lanCure': {
      const W = worm(); if (k && W.inf[k]) { delete W.inf[k]; W.cures++; ctx.markDirty(); bump(); }
      return ctx.send(ws, meView(c));
    }
    case 'lanOutbreak': return ctx.send(ws, outbreak());
    case 'lanCw': return ctx.send(ws, cwView());
    // ---- Quiz Night
    case 'lanQuizHere': {
      if (m.on) {
        if (here.has(c.id)) return; here.set(c.id, ws);
        const now = Date.now();
        if (quizLive(now) && sess && sess.started && !sess.over) {
          say(`Welcome to #quiznight, ${c.nick}! Quiz Night is ON. Just type your answers.`, 'info', ws);
          if (sess.cur && !sess.cur.done) say(`QUESTION ${sess.n} of ${QUIZ_LEN}: ${Q[sess.cur.i][0]}`, 'q', ws);
        } else if (!quizLive(now) || (sess && sess.over)) say(`Welcome to #quiznight, ${c.nick}! I'm QuizJack. Quiz Night starts on the hour, every hour, for 10 minutes. Next one in ${minsToNext()} minute(s). Type !scores for this week's leaderboard.`, 'info', ws);
      } else here.delete(c.id);
      return;
    }
    case 'lanQuizAns': if (here.has(c.id)) return quizAnswer(ws, c, m.a); return;
    case 'lanQuizTop': { const Qs = qsTop(); return ctx.send(ws, { t: 'lanQuizTop', week: Qs.week, top: topOf(Qs.s, 10), last: Qs.last || null }); }
    // ---- testing / moderation (ADMIN_TOKEN only)
    case 'lanAdmin': {
      const tok = String(m.token || ''), want = process.env.ADMIN_TOKEN || '';
      if (!want || tok.length !== want.length || !crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(want))) return;
      if (m.act === 'quiz') { forcedUntil = Date.now() + 10 * 60000; sess = null; quizTick(); }
      else if (m.act === 'quizfast') { if (sess && sess.cur && !sess.cur.done) sess.cur.at -= ANSWER_MS - 1000; else if (sess) sess.next = 0; }
      else if (m.act === 'worm' && k) { worm().mailed[k] = 0; mailTo(k, '', 0); }
      else if (m.act === 'cwroll') { const C = D().cw; if (C) { C.week = '1999-01-01'; cw(); } }
      return ctx.send(ws, { t: 'lanAdminOk', act: m.act });
    }
  }
}

module.exports = {
  name: 'lan',
  types: ['lanShare', 'lanUnshare', 'lanList', 'lanGet', 'lanPop', 'lanBlock', 'lanUnblock', 'lanBlocks', 'lanFlBox', 'lanFlNew', 'lanFlIns', 'lanFlGet', 'lanFlAdd', 'lanFlDel', 'lanFlFormat', 'lanFlLabel', 'lanFlGive',
    'lanWormRun', 'lanCure', 'lanOutbreak', 'lanCw', 'lanQuizHere', 'lanQuizAns', 'lanQuizTop', 'lanAdmin'],
  init(c) {
    ctx = c;
    ctx.on('hello', (ws, cl) => { greet(ws, cl); const q = pendPop.get(cl.id); if (q) { pendPop.delete(cl.id); recentGone.delete(cl.id); setTimeout(() => q.forEach(x => ctx.send(ws, x)), 1500); } });
    ctx.on('login', cl => { if (cl.cid) migrate('c:' + cl.cid, keyOf(cl)); for (const [ws, x] of ctx.clients) if (x === cl) { ctx.send(ws, meView(cl)); ctx.send(ws, boxView(cl)); } });
    ctx.on('close', cl => { recentGone.set(cl.id, { at: Date.now(), pc: pcName(cl) }); if (recentGone.size > 2000) recentGone.delete(recentGone.keys().next().value); here.delete(cl.id); if (cl.lanShares && cl.lanShares.length) ctx.broadcast({ t: 'lanShareCh', id: cl.id }); });
    setInterval(() => { try { quizTick(); } catch (e) { console.error('lan quiz', e); } }, 1000);
    setInterval(() => { try { prune(); } catch (e) { console.error('lan prune', e); } }, 10 * 60000);
    setTimeout(() => { try { prune(); } catch (e) { console.error('lan prune', e); } }, 3000);
  },
  handle,
};
