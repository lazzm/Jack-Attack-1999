/* sx: THE GREAT JACKNET HUNT (server side). Ten chapters, each ending in a KEY (a word), ten Golden Bytes, the Hunt
 * Hint Line and the Hall of Champions. The keys, the byte codes and the hints live ONLY here: the browser sends what
 * the visitor typed (or which byte they clicked, with the code printed on it) and we decide. Members keep their
 * progress here (and get paid through econ's earn path, with daily caps); guests are checked but nothing is kept.
 * 100% (all ten keys, in order, plus every Golden Byte) is checked here before the Millennium Disk is handed over.
 *   client -> { t:'sxMe' }                          <- { t:'sxMe', mem, ch:{n:[letter, ts]}, by:{id:ts}, un:{n:ts}, hs:{'n.i':text}, done, full, pos, now }
 *   client -> { t:'sxTry', ch, a }                  <- { t:'sxRes', ch, ok, lt, at, near, locked, slow, done, full, pos }
 *   client -> { t:'sxSync', ch:{n:a}, by:{id:code} } a guest's finds, replayed once they log on  <- sxMe
 *   client -> { t:'sxByte', id, c }                 <- { t:'sxByteRes', id, ok, n, full }
 *   client -> { t:'sxHint', ch, i, buy }            <- { t:'sxHint', ch, i, text } | { t:'sxHint', ch, i, wait, cost, guest }
 *   client -> { t:'sxHall' }                        <- { t:'sxHall', list:[[pos, name, at, dur, full]], n, champs }
 * Data: state.mods.sx = { v, p:{memberKey:{ch:{n:ts}, by:{id:ts}, un:{n:ts}, hs:{'n.i':ts}, t0, done, full}}, hall:[{n, at, t0, dur, full}], g:{tries, ok} } */
'use strict';
const path = require('path');
const SX = require(path.join(__dirname, '..', 'public', 'js', 'sx-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const LCAT = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const keyOf = name => { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; };
const NEED = 'The Hint Line is for JackNet members (hint 1 is free for everyone). Joining is FREE: Start > Log Off, then pick a name and a password!';
let ctx, D, E;

// ---------------------------------------------------------------- the answers (normalised: lower case letters and digits only)
const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);
const KEYS = {
  1: ['source', 'thesource', 'sourcecode', 'viewsource', 'pagesource'],
  2: ['ghost', 'aghost', 'ghosts', 'theghost'],
  3: ['turbo', 'turbobutton', 'theturbobutton'],
  4: ['honey', 'thehoney'],
  5: ['chest', 'treasurechest', 'achest'],
  6: ['commander', 'thecommander', 'shuttlecommander', 'missioncommander', 'acommander', 'spaceshuttlecommander'],
  7: ['konami'],
  8: ['webring', 'awebring', 'webrings', 'thewebring'],
  9: ['engaged', 'engagedtone', 'theengagedtone'],
  10: ['countdown', 'thecountdown', 'countingdown', 'thefinalcountdown'],
};
const LUCKY = { 1: 5, 2: 3, 3: 2, 4: 3, 5: 5, 6: 7, 7: 2, 8: 1, 9: 2 }; // which letter of each key goes towards the last one
const letterOf = n => (LUCKY[n] ? KEYS[n][0][LUCKY[n] - 1].toUpperCase() : '');
const BYTECODE = { glint: 'aurum', dos: 'hidn8', robots: 'nobot', reg: 'draw3', phone: 'ring5', ring: 'tiny1', note: 'dotlog', clock: 'tickt', room: 'bedby', mag: 'back1' };
const NCH = SX.NCH, NBYTE = SX.NBYTE;
function lev1(a, b) { // true when a and b are one typo apart (a letter wrong, missing or extra)
  if (a === b || Math.abs(a.length - b.length) > 1 || a.length < 3) return false;
  let i = 0, j = 0, d = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return d + (a.length - i) + (b.length - j) <= 1;
}
function check(n, a) {
  const g = norm(a), keys = KEYS[n]; if (!keys || !g) return { ok: false };
  if (keys.includes(g)) return { ok: true };
  for (const k in KEYS) if (+k !== n && KEYS[k].includes(g)) return { ok: false, near: 'other' };
  if (keys[0] === g.split('').reverse().join('')) return { ok: false, near: 'rev' };
  if (keys.some(k => lev1(g, k))) return { ok: false, near: 'close' };
  return { ok: false };
}

// ---------------------------------------------------------------- the Hint Line (three per chapter: gentle, clearer, nearly there)
const HINTS = {
  1: ['The Hunt Master signed the Hunters\' Guestbook on Hunt HQ. Start there, and read every message.',
    '"Look under the bonnet" means look underneath the page. In JackNet Explorer, try View > Source.',
    'In the guestbook\'s source there is a comment, between <!-- and -->. The key is the name for the hidden page underneath every web page. Six letters, starting with S.'],
  2: ['Open My Computer and go to C:\\My Documents\\Hunt Stuff. The README is a decoy.',
    'Shy files are HIDDEN files. In My Computer, the View menu has an option that shows them.',
    'The hidden file is a poem. Read the first letter of every line, from top to bottom. It\'s something spooky that nobody can see.'],
  3: ['Open the JACK-DOS Prompt (Start > Programs). Type CD \\HUNT and then DIR. TYPE README.1ST shows you the instructions.',
    'DOS programs explain themselves if you ask with /? on the end. Try DECODE /? and look for a switch that shows a key.',
    'DECODE /K shows the key, but back to front. Reverse it (DECODE /R can do that for you). It\'s the button on the front of a 1999 PC that never does anything.'],
  4: ['Start > Run, type regedit and press OK. Open HKEY_CURRENT_USER, then Software.',
    'Find the Great JackNet Hunt key, and inside it the Vault. It is locked: Locked is set to 1. Double-click Locked to change it.',
    'Set Locked to 0 and read the note that falls out. The registry is kept in files called hives. What do bees keep in theirs?'],
  5: ['Open Jack\'s diary: Start > Programs > Accessories > Office Tools > Calendar. The arrows flick through the months of 1999.',
    'The five days are: the clocks going forward (March), the Romans homework (May), Easter Sunday (April), the first day of the summer holidays (July) and the eclipse (August).',
    'Take the FIRST letter of each of those five diary entries, in the order the riddle lists them. Pirates bury their treasure in one.'],
  6: ['Your bedroom is all around the PC. Shut the computer down (Start > Shut Down) and it switches off: then you can see the room. Look round with the arrows, or by dragging.',
    'You have a poster of a space shuttle on your wall. Click it and read the note stuck to it.',
    'Eileen Collins was the pilot on two shuttle flights before. On this mission she is in charge of the whole thing. What do you call the person in charge of a space mission? (Captain is close, but NASA says something else.)'],
  7: ['The magazine is JACK ATTACK!, the site the PC opens on. Read its Cheats page and look for the playground rumour about the Hunt.',
    'The rumour says to put the most famous cheat code ever into the Hunt HQ front page: up, up, down, down, left, right, left, right, B, A. Use the keyboard, or the little pad of buttons at the bottom of the page.',
    'When the cheat works, it says the code first appeared in a game on the NES in 1986. The key is the name of the Japanese company that made that game.'],
  8: ['Search for "Hunters Ring" on any search engine, or go straight to the ring\'s hub: www.huntersring.jnet.',
    'There are four member sites. Each hides a piece: one is white writing on a white background (try Edit > Select All), one is in a hit counter, one is in a guestbook and one is in the page source.',
    'Put the four pieces together in ring order, site 1 to site 4. What do you call a circle of web sites that link to each other?'],
  9: ['Open the Phone Dialer: Start > Programs > Accessories > Communications > Phone Dialer.',
    'Every number key on a phone has letters on it. H is on the 4, U is on the 8, N is on the 6... Spell HUNTERS in numbers and ring it.',
    'The message is in the pilots\' alphabet: Echo is E, November is N, Golf is G, Alpha is A, Delta is D. It\'s also the beeping you hear when someone else is already on the phone.'],
  10: ['Every key you found gave you a lucky letter. They are on the Hunt HQ board, in order, from key 1 to key 9.',
    'Nine letters, read in order. Then think about New Year\'s Eve 1999: what will everybody be doing in the very last seconds before midnight?',
    'Ten... nine... eight... seven... It\'s the word for counting backwards to zero. (It\'s also a programme on Channel 4 with letters and numbers.)'],
};

// our earn sources, added to econ's table (one bank, one set of daily caps; "drop" = the chance of a Lootling with it)
const EARN_ADD = {
  sxkey: { amt: SX.PAY.key, cap: 10, drop: 0.25, label: 'Great JackNet Hunt: found a key' },
  sxbyte: { amt: SX.PAY.byte, cap: 10, drop: 0.12, label: 'Great JackNet Hunt: found a Golden Byte' },
  sxdone: { amt: SX.PAY.done, cap: 1, drop: 1, label: 'Great JackNet Hunt: all ten keys!' },
  sxfull: { amt: SX.PAY.full, cap: 1, drop: 1, label: 'Great JackNet Hunt: 100%!' },
};

// ---------------------------------------------------------------- helpers
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') p = D.p[key] = { ch: {}, by: {}, un: {}, hs: {}, t0: 0, done: 0, full: 0 };
  for (const k of ['ch', 'by', 'un', 'hs']) if (!p[k] || typeof p[k] !== 'object') p[k] = {};
  return p;
}
const rl = (c, n, rate, burst) => { c.sxRl = c.sxRl || {}; if (!c.sxRl[n]) c.sxRl[n] = new ctx.Bucket(rate, burst); return c.sxRl[n].take(); };
const keyOfC = c => (c && c.member ? keyOf(c.member) : null);
const nCh = p => { let n = 0; for (let i = 1; i <= NCH; i++) if (p.ch[i]) n++; return n; };
const nBy = p => Object.keys(BYTECODE).filter(id => p.by[id]).length;
const nextCh = p => { for (let i = 1; i <= NCH; i++) if (!p.ch[i]) return i; return 0; };
const sys = text => ctx.pushChat({ sys: true, text: String(text).slice(0, 300), ts: Date.now() });
function acctC(c) { try { return E.acct(c); } catch (e) { return null; } }
function pay(c, src, note) { const a = acctC(c); return a ? E.earnA(a, src, note) : -1; }
function lootOnce(key, id) { try { const L = require('./loot.js'); return !!(L && L.giveOnce && L.giveOnce(key, id, 'hunt')); } catch (e) { console.error('sx loot', e.message); return false; } }
function toKey(key, msg) { const s = JSON.stringify(msg); for (const [ws, c] of ctx.clients) if (c.member && keyOf(c.member) === key) ctx.send(ws, s); }
const hallPos = key => D.hall.findIndex(h => keyOf(h.n) === key) + 1;

function touch(key) { // a member's hunt record is only made once they actually start hunting
  const p = P(key);
  if (!p.t0) { p.t0 = Date.now(); p.un[1] = p.t0; ctx.markDirty(); }
  return p;
}
function meView(c) {
  const key = keyOfC(c);
  if (!key) return { t: 'sxMe', mem: 0, now: Date.now() };
  if (!own(D.p, key)) return { t: 'sxMe', mem: 1, ch: {}, by: {}, un: {}, hs: {}, done: 0, full: 0, pos: 0, now: Date.now() };
  const p = P(key);
  const ch = {}; for (let i = 1; i <= NCH; i++) if (p.ch[i]) ch[i] = [letterOf(i), p.ch[i]];
  const hs = {}; for (const k in p.hs) { const [n, i] = k.split('.').map(Number); if (HINTS[n] && HINTS[n][i]) hs[k] = HINTS[n][i]; }
  return { t: 'sxMe', mem: 1, ch, by: Object.assign({}, p.by), un: Object.assign({}, p.un), hs, done: p.done || 0, full: p.full || 0, pos: hallPos(key), now: Date.now() };
}

// ---------------------------------------------------------------- solving a chapter (members: in order, paid once)
function solve(c, key, n, quiet) {
  const p = P(key);
  if (p.ch[n]) return { fresh: false };
  p.ch[n] = Date.now(); if (n < NCH) p.un[n + 1] = Date.now();
  ctx.markDirty();
  pay(c, 'sxkey', `Great JackNet Hunt: key ${n} of ${NCH}`);
  if (n === NCH && !p.done) {
    p.done = Date.now();
    if (!D.hall.some(h => keyOf(h.n) === key)) { D.hall.push({ n: c.member, at: p.done, t0: p.t0 || p.done, dur: Math.max(0, p.done - (p.t0 || p.done)), full: 0 }); }
    pay(c, 'sxdone', 'Great JackNet Hunt: COUNTDOWN! All ten keys found');
    lootOnce(key, 'badge.sx_hunter');
    if (!quiet) sys(`*** TEN... NINE... EIGHT... ${c.member} has found all ten keys of the Great JackNet Hunt! (Hunter #${hallPos(key)}, www.greathunt.jnet)`);
  }
  checkFull(c, key, quiet);
  return { fresh: true };
}
function checkFull(c, key, quiet) {
  const p = P(key);
  if (p.full || !p.done || nBy(p) < NBYTE) return false;
  p.full = Date.now(); ctx.markDirty();
  const h = D.hall.find(x => keyOf(x.n) === key); if (h) h.full = p.full;
  pay(c, 'sxfull', 'Great JackNet Hunt: 100%! The Millennium Disk');
  lootOnce(key, 'trinket.sx_mdisk'); lootOnce(key, 'badge.sx_champ');
  const champs = D.hall.filter(x => x.full).length;
  if (!quiet) sys(`*** 100%!!! ${c.member} found every key AND every Golden Byte, and dug up THE MILLENNIUM DISK! Great Hunt Champion #${champs}.`);
  return true;
}
function tryKey(ws, c, m) {
  const n = m.ch | 0;
  if (!rl(c, 'try', 0.5, 6)) return ctx.send(ws, { t: 'sxRes', ch: n, ok: 0, slow: 1 });
  if (!(n >= 1 && n <= NCH)) return;
  D.g.tries = (D.g.tries | 0) + 1;
  const r = check(n, m.a), key = keyOfC(c);
  if (key) {
    const p = touch(key);
    if (!p.ch[n] && nextCh(p) !== n) return ctx.send(ws, { t: 'sxRes', ch: n, ok: 0, locked: 1 });
  }
  if (!r.ok) return ctx.send(ws, { t: 'sxRes', ch: n, ok: 0, near: r.near || '' });
  D.g.ok = (D.g.ok | 0) + 1; ctx.markDirty();
  const out = { t: 'sxRes', ch: n, ok: 1, lt: letterOf(n), at: LUCKY[n] || 0 };
  if (key) {
    solve(c, key, n);
    const p = P(key); out.done = p.done ? 1 : 0; out.full = p.full ? 1 : 0; out.pos = hallPos(key); out.mem = 1;
    ctx.send(ws, out);
    return toKey(key, meView(c));
  }
  ctx.send(ws, out);
}
function sync(ws, c, m) {
  const key = keyOfC(c); if (!key || !rl(c, 'sync', 0.1, 2)) return;
  const p = touch(key), ch = m.ch && typeof m.ch === 'object' ? m.ch : {}, by = m.by && typeof m.by === 'object' ? m.by : {};
  for (let n = 1; n <= NCH; n++) { // strictly in order: the first wrong or missing key stops the replay
    if (p.ch[n]) continue;
    if (!own(ch, n) || !check(n, ch[n]).ok) break;
    solve(c, key, n, true);
  }
  for (const id of Object.keys(by).slice(0, 20)) if (own(BYTECODE, id) && !p.by[id] && norm(by[id]) === BYTECODE[id]) { p.by[id] = Date.now(); pay(c, 'sxbyte', `Golden Byte: ${(SX.BYTE[id] || {}).n || id}`); }
  checkFull(c, key, true);
  ctx.markDirty();
  toKey(key, meView(c));
}
function byte(ws, c, m) {
  if (!rl(c, 'byte', 0.5, 6)) return;
  const id = String(m.id || ''), ok = own(BYTECODE, id) && norm(m.c) === BYTECODE[id];
  const key = keyOfC(c);
  if (!ok) return ctx.send(ws, { t: 'sxByteRes', id, ok: 0 });
  if (!key) return ctx.send(ws, { t: 'sxByteRes', id, ok: 1, mem: 0 });
  const p = touch(key), fresh = !p.by[id];
  if (fresh) { p.by[id] = Date.now(); ctx.markDirty(); pay(c, 'sxbyte', `Golden Byte: ${(SX.BYTE[id] || {}).n || id}`); }
  const full = checkFull(c, key);
  ctx.send(ws, { t: 'sxByteRes', id, ok: 1, mem: 1, fresh: fresh ? 1 : 0, n: nBy(p), full: p.full ? 1 : 0, newFull: full ? 1 : 0 });
  toKey(key, meView(c));
}
function hint(ws, c, m) {
  if (!rl(c, 'hint', 0.5, 5)) return;
  const n = m.ch | 0, i = m.i | 0; if (!HINTS[n] || !(i >= 0 && i < SX.HINT.n)) return;
  const key = keyOfC(c);
  if (!key) return ctx.send(ws, i === 0 ? { t: 'sxHint', ch: n, i, text: HINTS[n][0] } : { t: 'sxHint', ch: n, i, guest: 1, msg: NEED });
  const p = touch(key), hk = n + '.' + i;
  if (p.hs[hk] || i === 0) { if (!p.hs[hk]) { p.hs[hk] = Date.now(); ctx.markDirty(); } return ctx.send(ws, { t: 'sxHint', ch: n, i, text: HINTS[n][i] }); }
  if (!p.hs[n + '.' + (i - 1)]) return ctx.send(ws, { t: 'sxHint', ch: n, i, order: 1 });
  const since = p.un[n] || (n === 1 ? p.t0 : 0);
  const waitMs = since ? Math.max(0, since + SX.HINT.wait[i] * 1000 - Date.now()) : SX.HINT.wait[i] * 1000;
  if (since && !waitMs) { p.hs[hk] = Date.now(); ctx.markDirty(); return ctx.send(ws, { t: 'sxHint', ch: n, i, text: HINTS[n][i] }); }
  const cost = SX.HINT.cost[i];
  if (m.buy) {
    const a = acctC(c);
    if (!a || !E.debit(a, cost, 'sxhint', `Hunt Hint Line: chapter ${n}, hint ${i + 1}`)) return ctx.send(ws, { t: 'sxHint', ch: n, i, wait: waitMs, cost, poor: 1 });
    try { E.meToAll ? E.meToAll(a) : E.sendMe(ws, c); } catch (e) {}
    p.hs[hk] = Date.now(); ctx.markDirty();
    return ctx.send(ws, { t: 'sxHint', ch: n, i, text: HINTS[n][i], paid: cost });
  }
  ctx.send(ws, { t: 'sxHint', ch: n, i, wait: since ? waitMs : -1, cost });
}
const hallView = () => D.hall.slice(0, 200).map((h, i) => [i + 1, h.n, h.at, h.dur, h.full || 0]);

function handle(ws, c, m) {
  if (!rl(c, 'all', 6, 24)) return;
  switch (m.t) {
    case 'sxMe': if (rl(c, 'me', 1, 4)) ctx.send(ws, meView(c)); return;
    case 'sxTry': return tryKey(ws, c, m);
    case 'sxSync': return sync(ws, c, m);
    case 'sxByte': return byte(ws, c, m);
    case 'sxHint': return hint(ws, c, m);
    case 'sxHall': if (rl(c, 'hall', 0.5, 4)) ctx.send(ws, { t: 'sxHall', list: hallView(), n: D.hall.length, champs: D.hall.filter(h => h.full).length }); return;
  }
}

module.exports = {
  name: 'sx',
  types: ['sxMe', 'sxTry', 'sxSync', 'sxByte', 'sxHint', 'sxHall'],
  init(x) {
    ctx = x; D = x.data;
    // never reset: only fill in what's missing
    D.v = D.v || 1; if (!D.p || typeof D.p !== 'object') D.p = {}; if (!Array.isArray(D.hall)) D.hall = []; if (!D.g || typeof D.g !== 'object') D.g = { tries: 0, ok: 0 };
    E = ECON.api; if (!E || !E.HOOKS) { console.error('sx: econ is missing'); return; }
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    // the Hunt's rewards are JackLoot exclusives (never random): add them to the shared catalogue object
    for (const [id, name, r, type, art, d, xx] of SX.LOOT) if (!LCAT.ITEM[id]) { const it = Object.assign({ id, name, r, type, art, d, ex: 1 }, xx || {}); LCAT.ITEMS.push(it); LCAT.ITEM[id] = it; }
    x.on('hello', (ws, c) => { if (c && c.member) ctx.send(ws, meView(c)); });
    x.on('login', c => { const key = keyOfC(c); if (key) toKey(key, meView(c)); });
  },
  handle,
  _test: { get D() { return D; }, check, norm, letterOf, KEYS, BYTECODE, HINTS, P },
};
