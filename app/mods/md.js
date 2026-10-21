/* md: JackMUD, a live multiplayer text adventure ("telnet mud.jacknet.jnet 4000"). Everything happens here on the server:
 * the world (mods/md-world.js and its room files), monsters, combat, quests, shops, the bank and every player's character.
 * The browser is only a terminal (the Telnet program, MS-DOS's TELNET and the Java-style client on www.jackmud.jnet,
 * see public/js/md*.js): it sends the lines you type and prints what comes back (ANSI colour and all).
 *   client -> { t:'mdOpen', via:'tel'|'dos'|'web'|'app', cols }   start (or pick up) your session
 *   client -> { t:'mdIn', s }                                     one line of typing
 *   client -> { t:'mdClose' }                                     hang up (your character is saved first)
 *   client -> { t:'mdWho' } / { t:'mdTop' }                       for the web site: who's on, the Hall of Heroes
 *   server -> { t:'mdOut', s, p, st? }   text (with ANSI escapes), the prompt, and a status block for the GUI clients
 *   server -> { t:'mdEnd', why }  { t:'mdSecret', id }  { t:'mdWho', list }  { t:'mdTop', list }
 * Members keep one character (saved in state.mods.md.p[memberKey]); guests get a temporary one that is forgotten when
 * they leave (or adopted by their new membership if they join while playing). Rupees only ever come through econ's earn
 * path (mdquest / mdswap / mdboss, all capped per day); gold is JackMUD's own money and never leaves the game except
 * through the capped Rupee Exchange at the bank. Kid friendly: nobody dies, you faint and wake up at the temple.
 * Data: state.mods.md = { v, p:{ key: character }, hof:{ firsts } } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const W = require('./md-world.js');
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');

const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const rint = (a, b) => a >= b ? a : crypto.randomInt(a, b + 1);
const chance = p => crypto.randomInt(0, 10000) < p * 10000;
const pick = l => l[crypto.randomInt(0, l.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const cap1 = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const plural = (n, w, ws) => n + ' ' + (n === 1 ? w : (ws || w + 's'));
const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
let ctx, D, E;

const EARN_ADD = {
  mdquest: { amt: 5, cap: 3, drop: 0.1, label: 'Finished a quest in JackMUD' },
  mdswap: { amt: 1, cap: 5, label: 'Swapped JackMUD gold for Rupees at the Baudby Bank' },
  mdboss: { amt: 10, cap: 1, drop: 0.25, label: 'Beat a big boss in JackMUD' },
};
const SWAP_GOLD = 50, BUY_GOLD = 40, BUY_MAX_DAY = 20; // 50 gold -> 1 Rupee (5 a day); 1 Rupee -> 40 gold (20 a day)
const MAXLV = 20, MAXINV = 24, MAXGOLD = 9999999, LD_MS = 150000;

// ---------------------------------------------------------------- colour
// {r}ed {g}reen {y}ellow {b}lue {m}agenta {c}yan {w}hite (dim), capitals are bright, {D} dark grey, {x} back to normal
const AN = { k: '0;30', r: '0;31', g: '0;32', y: '0;33', b: '0;34', m: '0;35', c: '0;36', w: '0;37', D: '1;30', R: '1;31', G: '1;32', Y: '1;33', B: '1;34', M: '1;35', C: '1;36', W: '1;37', x: '0' };
const TAG = /\{([krgybmcwDRGYBMCWx])\}/g;
const ansi = (s, on) => String(s).replace(TAG, (m, k) => (on ? '\x1b[' + AN[k] + 'm' : ''));
const plain = s => String(s).replace(TAG, '');
const vis = s => String(s).replace(/\{/g, '(').replace(/\}/g, ')'); // player text can't make colour codes
const pad = (s, n) => { const l = plain(s).length; return l >= n ? s : s + ' '.repeat(n - l); };
const box = (title, lines, wd) => {
  wd = wd || 60;
  const top = '{B}╔' + '═'.repeat(wd - 2) + '╗{x}', bot = '{B}╚' + '═'.repeat(wd - 2) + '╝{x}';
  const row = l => '{B}║{x} ' + pad(l, wd - 4) + ' {B}║{x}';
  const t = title ? [row('{Y}' + title + '{x}'), '{B}╟' + '─'.repeat(wd - 2) + '╢{x}'] : [];
  return [top, ...t, ...lines.map(row), bot].join('\n');
};

const narrow = P => (P.cols || 80) < 64;
function boxP(P, title, lines, wd) {
  if (!narrow(P)) return box(title, lines, wd);
  const w = Math.max(20, (P.cols || 40) - 1), rule = '{B}' + '═'.repeat(w) + '{x}';
  return [rule, title ? '{Y}' + title + '{x}' : null, title ? '{B}' + '─'.repeat(w) + '{x}' : null, ...lines.map(l => l.replace(/^\s{2,}/, ' ')), rule].filter(x => x != null).join('\n');
}
// ---------------------------------------------------------------- the world
const ROOMS = W.ROOMS, MOBS = W.MOBS, ITEMS = W.ITEMS, NPCS = W.NPCS, QUESTS = W.QUESTS, CLASSES = W.CLASSES;
const QUEST = {}; for (const q of QUESTS) QUEST[q.id] = q;
const DIRS = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest', in: 'in', out: 'out' };
const REV = { n: 's', s: 'n', e: 'w', w: 'e', u: 'd', d: 'u', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw', in: 'out', out: 'in' };
const FROM = { n: 'the south', s: 'the north', e: 'the west', w: 'the east', u: 'below', d: 'above', ne: 'the southwest', nw: 'the southeast', se: 'the northwest', sw: 'the northeast', in: 'outside', out: 'inside' };
const DIRWORD = {}; for (const k in DIRS) { DIRWORD[k] = k; DIRWORD[DIRS[k]] = k; }
const RS = new Map(); // room id -> { mobs:[inst], items:[{id, t}], ppl:Set<P> }
const rs = id => { let r = RS.get(id); if (!r) RS.set(id, r = { mobs: [], items: [], ppl: new Set() }); return r; };
let mobSeq = 1;
const SPAWNS = []; // { room, mob, inst, at }

function spawn(sp) {
  const t = MOBS[sp.mob]; if (!t) return;
  const m = { uid: mobSeq++, t, id: sp.mob, hp: t.hp, room: sp.room, sp, stun: 0, fighting: new Set(), aggroAt: 0 };
  sp.inst = m; sp.at = 0;
  rs(sp.room).mobs.push(m);
  return m;
}
function initWorld() {
  for (const id in ROOMS) {
    const R = ROOMS[id];
    for (const mid of R.mobs || []) if (MOBS[mid]) { const sp = { room: id, mob: mid, inst: null, at: 0 }; SPAWNS.push(sp); spawn(sp); }
    for (const iid of R.items || []) if (ITEMS[iid]) rs(id).items.push({ id: iid, t: Date.now(), home: 1 });
  }
}

// ---------------------------------------------------------------- characters
const XPN = lv => 32 * lv * lv + 60 * lv; // xp from level lv to lv+1
const CL = k => CLASSES[k] || CLASSES.knight;
function maxHp(ch) { const C = CL(ch.cls); return C.hp0 + C.hpL * (ch.lv - 1) + eqSum(ch, 'hp'); }
function maxMp(ch) { const C = CL(ch.cls); return C.mp0 + C.mpL * (ch.lv - 1) + eqSum(ch, 'mp'); }
function eqSum(ch, f) { let n = 0; for (const s in ch.eq) { const it = ITEMS[ch.eq[s]]; if (it && it[f]) n += it[f]; } return n; }
const acOf = ch => eqSum(ch, 'ac') + CL(ch.cls).ac;
function weapon(ch) { return ITEMS[ch.eq.weapon] || ITEMS.fists; }
function newChar(name, cls) {
  const ch = { v: 1, n: name, cls, lv: 1, xp: 0, hp: 1, mp: 1, gold: 15, bank: 0, room: W.START, inv: CL(cls).kit.slice(), eq: {}, q: {}, qd: {}, titles: [], title: '', kills: 0, faints: 0, sx: {}, fl: {}, seen: {}, born: Date.now(), last: Date.now(), play: 0, pref: { ansi: 1, brief: 0, tips: 1 }, buy: { day: '', n: 0 }, mk: {} };
  for (const id of CL(cls).wear || []) { const it = ITEMS[id]; if (it) ch.eq[it.type === 'weapon' ? 'weapon' : it.slot] = id; }
  ch.hp = maxHp(ch); ch.mp = maxMp(ch);
  return ch;
}
function fixChar(ch) {
  ch.inv = Array.isArray(ch.inv) ? ch.inv.filter(id => own(ITEMS, id)).slice(0, MAXINV + 10) : [];
  ch.eq = ch.eq && typeof ch.eq === 'object' ? ch.eq : {}; if (ch.eq.undefined) { ch.eq.weapon = ch.eq.undefined; delete ch.eq.undefined; } for (const s in ch.eq) if (!own(ITEMS, ch.eq[s])) delete ch.eq[s];
  for (const k of ['q', 'qd', 'sx', 'fl', 'seen', 'mk']) if (!ch[k] || typeof ch[k] !== 'object' || Array.isArray(ch[k])) ch[k] = {};
  if (!Array.isArray(ch.titles)) ch.titles = [];
  ch.pref = Object.assign({ ansi: 1, brief: 0, tips: 1 }, ch.pref || {});
  ch.buy = ch.buy || { day: '', n: 0 };
  if (!own(CLASSES, ch.cls)) ch.cls = 'knight';
  ch.lv = clamp(ch.lv | 0, 1, MAXLV); ch.xp = Math.max(0, ch.xp | 0); ch.gold = clamp(ch.gold | 0, 0, MAXGOLD); ch.bank = clamp(ch.bank | 0, 0, MAXGOLD);
  if (!own(ROOMS, ch.room)) ch.room = W.TOWN;
  ch.hp = clamp(ch.hp | 0, 1, maxHp(ch)); ch.mp = clamp(ch.mp | 0, 0, maxMp(ch));
  return ch;
}

// ---------------------------------------------------------------- sessions
const S = new Map(); // key -> P
const byName = n => { const l = String(n || '').toLowerCase(); for (const P of S.values()) if (P.name.toLowerCase() === l && P.ch) return P; return null; };
const playing = () => [...S.values()].filter(P => P.state === 'play' && P.ch);
const keyOfC = c => { if (!c) return null; if (c.member) { const k = String(c.member).toLowerCase(); return BADKEY.test(k) ? null : 'm:' + k; } return 'g:' + c.id; };
const memKey = P => P.guest ? null : P.key.slice(2);
function sockOf(c) { for (const [ws, x] of ctx.clients) if (x === c) return ws; return null; }

// output: buffered per player and sent once per command / tick
function out(P, text) { if (!P || P.gone) return; P.buf += (P.buf ? '\n' : '') + text; sched(P); }
function sched(P) { if (P.fl) return; P.fl = true; setImmediate(() => flush(P)); }
function flush(P) {
  P.fl = false;
  if (P.gone || !P.ws || P.ld) { P.buf = ''; return; }
  const on = !P.ch || P.ch.pref.ansi;
  const msg = { t: 'mdOut', s: P.buf ? ansi(P.buf, on) + '\n' : '', p: ansi(prompt(P), on) };
  if (P.state === 'play') msg.st = stat(P);
  P.buf = '';
  ctx.send(P.ws, msg);
}
function prompt(P) {
  if (P.state === 'class') return '{Y}Pick a class (1-4):{x} ';
  if (P.state === 'confirm') return '{Y}Is that right? (yes/no):{x} ';
  if (P.state === 'adopt') return '{Y}Keep this character? (yes/no):{x} ';
  const ch = P.ch; if (!ch) return '> ';
  const mh = maxHp(ch), mm = maxMp(ch), hc = ch.hp * 3 < mh ? 'R' : ch.hp * 3 < mh * 2 ? 'Y' : 'G';
  let s = `{D}[{${hc}}${ch.hp}{D}/{w}${mh}hp {C}${ch.mp}{D}/{w}${mm}mp {M}${Math.floor(ch.xp / XPN(ch.lv) * 100)}%xp{D}]{x}`;
  const m = P.fight; if (m && m.hp > 0) s += ` {R}[${cap1(m.t.short)}: ${Math.max(1, Math.round(m.hp / m.t.hp * 100))}%]{x}`;
  return s + ' {W}>{x} ';
}
function toRoom(room, text, except, except2) { const r = RS.get(room); if (!r) return; for (const P of r.ppl) if (P !== except && P !== except2) out(P, text); }
function toAll(text, except) { for (const P of playing()) if (P !== except) out(P, text); }
function secret(P, id) { if (P.ws && !P.ld) ctx.send(P.ws, { t: 'mdSecret', id }); }
function stat(P) {
  const ch = P.ch, R = ROOMS[P.room], r = rs(P.room);
  const here = [];
  for (const id of R.npcs || []) { const n = NPCS[id]; if (n) here.push({ k: 'npc', n: n.short, kw: n.kw[0] }); }
  for (const m of r.mobs) here.push({ k: 'mob', n: m.t.short, kw: m.t.kw[0], lv: m.t.lv });
  for (const Q of r.ppl) if (Q !== P) here.push({ k: 'pc', n: Q.name, kw: Q.name.toLowerCase() });
  const seenIt = new Set(); for (const it of r.items) if (!seenIt.has(it.id)) { seenIt.add(it.id); here.push({ k: 'item', n: ITEMS[it.id].short, kw: ITEMS[it.id].kw[0] }); }
  const st = { n: ch.n, cls: ch.cls, lv: ch.lv, hp: ch.hp, mhp: maxHp(ch), mp: ch.mp, mmp: maxMp(ch), xp: ch.xp, nx: XPN(ch.lv), g: ch.gold,
    room: { id: P.room, n: R.n, area: (W.AREAS[R.area] || {}).n || '', ex: exitsOf(P, R) }, here, fight: P.fight ? { n: P.fight.t.short, pct: Math.round(P.fight.hp / P.fight.t.hp * 100) } : null };
  if (P.mapRoom !== P.room) { P.mapRoom = P.room; st.map = miniMap(P); }
  return st;
}
function exitsOf(P, R) {
  const L = Object.keys(R.ex || {});
  for (const d in R.hid || {}) if (P.ch.sx[R.id + '.' + d]) L.push(d);
  return L;
}

// ---------------------------------------------------------------- entering, leaving, moving
function place(P, room, how) {
  if (P.room) rs(P.room).ppl.delete(P);
  P.room = room; P.ch.room = room; rs(room).ppl.add(P);
  const first = !P.ch.seen[room]; P.ch.seen[room] = 1;
  if (first) {
    const n = Object.keys(P.ch.seen).length;
    if (n === 50) secret(P, 'md.explore50');
    if (n >= Object.keys(ROOMS).length - 3) secret(P, 'md.explore');
  }
  const R = ROOMS[room];
  if (first && W.ART[room]) P.art = room;
  if (R.secret && first) secret(P, R.secret);
  qEvent(P, 'visit', room);
  return first;
}
function enterWorld(P, back) {
  const ch = P.ch;
  P.state = 'play';
  let room = ch.room; if (!own(ROOMS, room) || ROOMS[room].noSave) room = ROOMS[room] && ROOMS[room].saveTo ? ROOMS[room].saveTo : W.TOWN;
  if (!own(ROOMS, room)) room = W.TOWN;
  place(P, room);
  toRoom(room, `{c}${P.name} ${back ? 'shakes off a funny feeling and looks around again' : 'appears in a shimmer of green text'}.{x}`, P);
  look(P);
  if (!back) {
    for (const Q of playing()) if (Q !== P) out(Q, `{D}[INFO] {c}${P.name}{D} has connected to JackMUD.{x}`);
  }
}
function leaveWorld(P, why) {
  if (P.state === 'play' && P.room) {
    stopFight(P);
    for (const m of rs(P.room).mobs) m.fighting.delete(P);
    toRoom(P.room, `{c}${P.name} ${why === 'ld' ? 'fades away into a cloud of ASCII' : 'waves goodbye and dissolves into a cloud of green letters'}.{x}`, P);
    for (const Q of playing()) if (Q !== P) out(Q, `{D}[INFO] {c}${P.name}{D} has left JackMUD.{x}`);
    partyLeave(P, true);
    for (const Q of playing()) if (Q.follow === P) { Q.follow = null; out(Q, `You stop following ${P.name}.`); }
    rs(P.room).ppl.delete(P);
  }
  saveP(P);
  P.gone = true; S.delete(P.key);
}
function saveP(P) {
  if (!P.ch || P.guest) return;
  const k = memKey(P); if (!k) return;
  P.ch.last = Date.now();
  D.p[k] = P.ch; ctx.markDirty();
}

function move(P, dir, opts) {
  opts = opts || {};
  const R = ROOMS[P.room];
  let to = R.ex && R.ex[dir];
  if (!to && R.hid && R.hid[dir] && P.ch.sx[R.id + '.' + dir]) to = R.hid[dir];
  if (!to) { out(P, pick(["You can't go that way.", 'There is no way to go ' + (DIRS[dir] || dir) + ' from here.', 'You bump into a wall. Ouch. (Type {W}EXITS{x} to see the ways out.)'])); return false; }
  if (P.fight) { out(P, "You're in the middle of a fight! Type {W}FLEE{x} to run away."); return false; }
  if (P.pos === 'rest') { P.pos = 'stand'; out(P, 'You get up.'); }
  const lk = R.lock && R.lock[dir];
  if (lk && !hasItem(P.ch, lk.i)) { out(P, lk.msg || `The way ${DIRS[dir]} is locked.`); return false; }
  const A = W.ACT[P.room];
  if (A && A.gate) { const why = A.gate(api, P, dir); if (why) { out(P, why); return false; } }
  const A2 = W.ACT[to];
  if (A2 && A2.arrive) { const why = A2.arrive(api, P, dir); if (why) { out(P, why); return false; } }
  if (!ROOMS[to]) return false;
  const verb = opts.verb || 'leaves';
  toRoom(P.room, `{c}${P.name}{x} ${verb} ${DIRS[dir] || dir}.`, P);
  const from = P.room;
  place(P, to);
  toRoom(to, `{c}${P.name}{x} arrives from ${FROM[dir] || 'somewhere'}.`, P);
  look(P);
  // followers come too
  for (const Q of [...rs(from).ppl]) if (Q.follow === P && Q.state === 'play' && !Q.fight) { out(Q, `You follow ${P.name} ${DIRS[dir]}.`); move(Q, dir); }
  aggro(P);
  return true;
}
function teleport(P, room, msgOut, msgIn) {
  stopFight(P);
  if (msgOut) toRoom(P.room, msgOut, P);
  place(P, room);
  if (msgIn) toRoom(room, msgIn, P);
  look(P);
}

// ---------------------------------------------------------------- looking
function timeLine(R) {
  if (!R.out) return '';
  const h = E.uk().h;
  const L = W.SKY[h < 5 ? 'night' : h < 8 ? 'dawn' : h < 18 ? 'day' : h < 21 ? 'dusk' : 'night'];
  return L ? ' {D}' + L[(R.id.length + h) % L.length] + '{x}' : '';
}
function look(P, full) {
  const R = ROOMS[P.room], r = rs(P.room), ch = P.ch;
  const A = W.AREAS[R.area] || {};
  const L = [];
  L.push(`{C}${R.n}{x}  {D}[${A.n || 'Somewhere'}]{x}`);
  if (!ch.pref.brief || full) {
    let d = typeof R.d === 'function' ? R.d(api, P) : R.d;
    if (R.night && E.uk().h >= 19 || R.night && E.uk().h < 6) d = R.night;
    L.push('  ' + d + timeLine(R));
  }
  const ex = exitsOf(P, R);
  L.push(`{G}Exits: ${ex.length ? ex.map(d => '{W}' + (DIRS[d] || d) + '{G}').join(', ') : 'none!'}{x}`);
  for (const id of R.npcs || []) { const n = NPCS[id]; if (n) L.push(`{Y}${typeof n.here === 'function' ? n.here(api, P) : n.here}{x}`); }
  const AX = W.ACT[P.room]; if (AX && AX.extra) { const e = AX.extra(api, P); if (e) L.push(e); }
  for (const m of r.mobs) L.push(`{R}${m.fighting.size ? cap1(m.t.short) + ' is here, in the middle of a scrap!' : m.t.here}{x}` + (m.t.lv > ch.lv + 4 ? ' {D}(looks VERY tough){x}' : ''));
  for (const Q of r.ppl) if (Q !== P) L.push(`{c}${Q.name}${Q.ch.title ? ' ' + Q.ch.title : ' the ' + CL(Q.ch.cls).n}{x} is ${Q.fight ? 'here, fighting ' + Q.fight.t.short : Q.pos === 'rest' ? 'resting here' : 'standing here'}.${Q.ld ? ' {D}(asleep at the keyboard){x}' : ''}`);
  const cnt = {}; for (const it of r.items) cnt[it.id] = (cnt[it.id] || 0) + 1;
  for (const id in cnt) { const it = ITEMS[id]; L.push(`{w}${cnt[id] > 1 ? '(' + cnt[id] + ') ' : ''}${cap1(it.ground || it.short + ' is lying here.')}{x}`); }
  if (P.art === P.room) { P.art = null; L.unshift(W.ART[P.room], ''); }
  out(P, L.join('\n'));
  if (R.tip && ch.pref.tips && !ch.mk['tip.' + R.id]) { ch.mk['tip.' + R.id] = 1; out(P, `{M}TIP:{x} ${R.tip}`); }
}
function findIn(list, word, nameOf) { // "sword", "2.rat", "all" handled by callers
  let n = 1; const m = /^(\d+)\.(.+)$/.exec(word); if (m) { n = +m[1]; word = m[2]; }
  word = word.toLowerCase().trim(); if (!word) return null;
  const parts = word.split(/\s+/).filter(w => !/^(a|an|the|some|my)$/.test(w)); if (!parts.length) return null;
  const hit = kws => parts.every(w => kws.some(k => k === w || k.startsWith(w)));
  for (const x of list) { const kws = nameOf(x); if (hit(kws)) { if (--n <= 0) return x; } }
  return null;
}
const itemKws = id => (ITEMS[id] ? ITEMS[id].kw : []);
function findMob(P, w) { return findIn(rs(P.room).mobs, w, m => m.t.kw); }
function findNpc(P, w) { const L = (ROOMS[P.room].npcs || []).map(id => NPCS[id]).filter(Boolean); return findIn(L, w, n => n.kw); }
function findPc(P, w, anywhere) { const L = anywhere ? playing() : [...rs(P.room).ppl]; return findIn(L.filter(Q => Q !== P), w, Q => [Q.name.toLowerCase()]); }
function findInv(ch, w) { return findIn(ch.inv.slice().reverse(), w, itemKws); } // newest first: "wear helmet" means the one you just got
function hasItem(ch, id) { return ch.inv.includes(id) || Object.values(ch.eq).includes(id); }
function countItem(ch, id) { return ch.inv.filter(x => x === id).length; }
function giveItem(P, id, quiet) {
  const ch = P.ch, it = ITEMS[id]; if (!it) return false;
  if (it.unique && hasItem(ch, id)) return false;
  if (ch.inv.length >= MAXINV && !(it.quest && ch.inv.length < MAXINV + 8)) { rs(P.room).items.push({ id, t: Date.now() }); out(P, `Your bag is full, so ${it.short} falls on the floor.`); return true; }
  ch.inv.push(id);
  if (!quiet) out(P, `You get ${it.short}.`);
  qEvent(P, 'have', id);
  return true;
}
function takeItem(ch, id, n) { n = n || 1; let k = 0; for (let i = ch.inv.length - 1; i >= 0 && k < n; i--) if (ch.inv[i] === id) { ch.inv.splice(i, 1); k++; } if (k < n) for (const s in ch.eq) if (ch.eq[s] === id && k < n) { delete ch.eq[s]; k++; } return k; }

function lookAt(P, word) {
  const ch = P.ch, R = ROOMS[P.room];
  word = word.replace(/^(at|the|in|into)\s+/i, '').trim();
  if (!word) return look(P, true);
  const dir = DIRWORD[word.toLowerCase()];
  if (dir) { const to = (R.ex || {})[dir] || ((R.hid || {})[dir] && ch.sx[R.id + '.' + dir] ? R.hid[dir] : null); return out(P, to ? `Looking ${DIRS[dir]}, you can see {C}${ROOMS[to].n}{x}.` : `You see nothing special ${DIRS[dir]}.`); }
  const lw = word.toLowerCase();
  if (/^(me|self|myself)$/.test(lw)) return out(P, `You look down at yourself. ${ch.n} the ${CL(ch.cls).n}, level ${ch.lv}. ${ch.hp < maxHp(ch) / 2 ? 'You look a bit battered.' : 'You look ready for adventure!'}`);
  const n = findNpc(P, lw); if (n) { out(P, `{Y}${cap1(n.short)}{x}\n  ${n.desc}`); if (n.topics || n.quest || n.shop || n.bank) out(P, `{D}(Try {W}TALK ${n.kw[0].toUpperCase()}{D}.)`); return; }
  const m = findMob(P, lw); if (m) { out(P, `{R}${cap1(m.t.short)}{x}\n  ${m.t.desc}\n  ${conLine(ch, m.t)}`); return; }
  const Q = findPc(P, lw); if (Q) { const qc = Q.ch; out(P, `{c}${Q.name}${qc.title ? ' ' + qc.title : ''}{x}, a level ${qc.lv} ${CL(qc.cls).n}.\n  ${CL(qc.cls).look}${qc.eq.weapon ? ' Holding ' + ITEMS[qc.eq.weapon].short + '.' : ''}${qc.eq.head ? ' Wearing ' + ITEMS[qc.eq.head].short + ' on their head.' : ''}`); out(Q, `${P.name} looks you up and down.`); return; }
  const inv = findInv(ch, lw) || findIn(Object.values(ch.eq), lw, itemKws) || (rs(P.room).items.find(x => itemKws(x.id).some(k => k.startsWith(lw))) || {}).id;
  if (inv) { const it = ITEMS[inv]; out(P, `{W}${cap1(it.short)}{x}\n  ${it.desc}${itemStats(it)}`); return; }
  if (R.x) for (const k in R.x) if (k.split(',').some(kk => kk.trim() === lw || kk.trim().startsWith(lw) && lw.length > 2)) { const t = R.x[k]; out(P, typeof t === 'function' ? t(api, P) : t); qEvent(P, 'look', R.id + ':' + k.split(',')[0]); return; }
  out(P, `You don't see any "${vis(word)}" here.`);
}
function itemStats(it) {
  const s = [];
  if (it.type === 'weapon') s.push(`damage ${it.dmg[0]}-${it.dmg[1]}`);
  if (it.ac) s.push(`armour +${it.ac}`); if (it.hp) s.push(`+${it.hp} max HP`); if (it.mp) s.push(`+${it.mp} max MP`);
  if (it.heal) s.push(`heals ${it.heal} HP`); if (it.mana) s.push(`restores ${it.mana} MP`);
  if (it.slot && it.type !== 'weapon') s.push('worn on: ' + it.slot);
  if (it.value) s.push(`worth about ${it.value} gold`);
  if (it.quest) s.push('quest item');
  return s.length ? '\n  {D}(' + s.join(', ') + '){x}' : '';
}
function conLine(ch, t) {
  const d = t.lv - ch.lv;
  if (t.peace) return '{G}It looks perfectly friendly.{x}';
  return d <= -5 ? '{G}You could beat this with one hand tied behind your back.{x}' : d <= -2 ? '{G}This should be easy.{x}' : d <= 1 ? '{Y}A fair fight.{x}' : d <= 3 ? '{R}This looks tricky. Bring friends or potions.{x}' : '{R}RUN AWAY! This would flatten you.{x}';
}

// ---------------------------------------------------------------- combat
function startFight(P, m, quiet) {
  if (m.t.peace) { out(P, m.t.peace); return false; }
  if (ROOMS[P.room].safe) { out(P, 'No fighting here! This is a safe place. (Sister Ping would be ever so cross.)'); return false; }
  if (P.fight === m) return true;
  P.fight = m; m.fighting.add(P); P.pos = 'stand';
  if (!quiet) { out(P, `{R}You leap at ${m.t.short}!{x}`); toRoom(P.room, `{c}${P.name}{x} attacks ${m.t.short}!`, P); }
  return true;
}
function stopFight(P) { if (P.fight) { P.fight.fighting.delete(P); P.fight = null; } }
function dmgLine(n) { return n <= 2 ? 'scratch' : n <= 4 ? 'bonk' : n <= 7 ? 'whack' : n <= 11 ? 'WALLOP' : n <= 16 ? 'SMASH' : 'MEGA-THWACK'; }
function playerHit(P, m, mult, sure, label) {
  const ch = P.ch, w = weapon(ch), C = CL(ch.cls);
  const hitP = clamp(0.72 + (ch.lv - m.t.lv) * 0.05, 0.35, 0.95);
  if (!sure && !chance(hitP)) { out(P, `You swing at ${m.t.short} with ${w.short} and miss!`); return 0; }
  let d = rint(w.dmg[0], w.dmg[1]) + Math.floor(ch.lv / 2) + C.atk;
  d = Math.round(d * (mult || 1)) - Math.floor((m.t.ac || 0) / 3); d = Math.max(1, d);
  m.hp -= d;
  const verbs = w => (/(sh|ch|ss|x)$/i.test(w) ? w + (w === w.toUpperCase() ? 'ES' : 'es') : w + (w === w.toUpperCase() ? 'S' : 's'));
  out(P, `Your ${label || (w.verb || 'hit')} ${d >= 12 ? '{Y}' : '{W}'}${verbs(dmgLine(d))}{x} ${m.t.short}! {D}(${d}){x}`);
  toRoom(P.room, `${P.name} ${verbs(dmgLine(d).toLowerCase())} ${m.t.short}.`, P);
  return d;
}
function mobHit(m, P) {
  const ch = P.ch, ac = acOf(ch);
  if (P.fx.block > 0) { P.fx.block--; out(P, `{C}You catch ${m.t.short}'s attack on your shield! CLANG!{x}`); return; }
  const hitP = clamp(0.62 + (m.t.lv - ch.lv) * 0.05 - ac * 0.012, 0.18, 0.92);
  if (!chance(hitP)) { out(P, `${cap1(m.t.short)} ${pick(m.t.miss || ['misses you', 'swats at you and misses', 'trips over its own feet'])}.`); return; }
  let d = rint(m.t.dmg[0], m.t.dmg[1]) - Math.floor(ac / 4); d = Math.max(1, d);
  ch.hp -= d;
  out(P, `{R}${cap1(m.t.short)} ${pick(m.t.hit || ['hits you'])}!{x} {D}(${d}){x}`);
  toRoom(P.room, `${cap1(m.t.short)} ${pick(m.t.hit || ['hits'])} ${P.name}... well, it ${pick(m.t.hit || ['hits'])} them.`.replace(/ you\b.*\.\.\. well, it /, ' '), P);
  if (ch.hp <= 0) faint(P, m);
}
function faint(P, m) {
  const ch = P.ch;
  stopFight(P);
  for (const x of rs(P.room).mobs) x.fighting.delete(P);
  ch.faints++; ch.hp = Math.max(1, Math.floor(maxHp(ch) / 2)); ch.mp = Math.max(ch.mp, Math.floor(maxMp(ch) / 3));
  const lost = Math.floor(ch.gold * 0.1); ch.gold -= lost;
  out(P, `\n{M}Everything goes wobbly... the room spins... and you {W}FAINT{M}!{x}\n\n{D}...you dream about a giant fizzy drink...{x}\n`);
  toRoom(P.room, `{M}${P.name} goes all wobbly and FAINTS! A passing friendly owl scoops them up and flaps off towards the temple.{x}`, P);
  secret(P, 'md.faint');
  place(P, W.TEMPLE);
  out(P, `{Y}You wake up on a soft bed in the Temple of Saint Reboot. Sister Ping is dabbing your forehead with a cold flannel.{x}\n{W}Sister Ping says, "There, there. Have a sit down. Nobody stays fainted for long in Baudby."{x}${lost ? `\n{D}(${lost} gold coins fell out of your pockets on the way.){x}` : ''}`);
  toRoom(W.TEMPLE, `A friendly owl drops ${P.name} gently onto a bed.`, P);
  look(P);
  if (m && m.hp > 0 && !m.fighting.size) m.hp = m.t.hp; // it has a lie down too
}
function mobDefeated(m, P) {
  const r = rs(m.room), t = m.t;
  r.mobs = r.mobs.filter(x => x !== m);
  const fighters = [...m.fighting].filter(Q => Q.room === m.room && Q.state === 'play');
  for (const Q of fighters) if (Q.fight === m) Q.fight = null;
  m.fighting.clear();
  if (m.sp) { m.sp.inst = null; m.sp.at = Date.now() + (t.re || 45) * 1000; }
  toRoom(m.room, `{G}${cap1(t.short)} ${t.die || 'gives up and scampers off!'}{x}`);
  // xp: everyone who fought it, plus party members in the room
  const crew = new Set(fighters); if (P && P.party) for (const Q of P.party.mem) if (Q.room === m.room && Q.state === 'play') crew.add(Q);
  const share = crew.size > 1 ? 1.25 / crew.size : 1;
  for (const Q of crew) {
    const diff = t.lv - Q.ch.lv, f = diff >= 0 ? 1 + diff * 0.15 : Math.max(0.1, 1 + diff * 0.2);
    const xp = Math.max(1, Math.round(t.xp * f * share));
    Q.ch.kills++;
    out(Q, `{M}You get ${xp} experience.{x}`);
    gainXp(Q, xp);
    qEvent(Q, 'kill', m.id);
  }
  if (P) {
    const g = t.gold ? rint(t.gold[0], t.gold[1]) : 0;
    if (g) { const each = crew.size > 1 ? Math.max(1, Math.floor(g / crew.size)) : g; for (const Q of crew) { Q.ch.gold = Math.min(MAXGOLD, Q.ch.gold + each); out(Q, `{Y}You pick up ${plural(each, 'gold coin')}.{x}`); } }
    for (const [iid, p] of t.drops || []) if (ITEMS[iid] && ITEMS[iid].quest) { // quest things go straight to whoever needs them (nobody can pinch them off the floor)
      for (const Q of crew) { if (hasItem(Q.ch, iid)) continue; const need = Object.keys(Q.ch.q).some(qid => { const q = QUEST[qid], s2 = q && q.steps[Q.ch.q[qid].s]; return s2 && s2.k === 'have' && s2.i === iid; }); if (need) { out(Q, `{W}${cap1(t.short)} dropped ${ITEMS[iid].short}, and you grab it!{x}`); giveItem(Q, iid, true); } }
    } else if (ITEMS[iid] && chance(p)) { r.items.push({ id: iid, t: Date.now() }); toRoom(m.room, `{w}${cap1(t.short)} dropped ${ITEMS[iid].short}.{x} {D}(Type GET ${ITEMS[iid].kw[0].toUpperCase()}){x}`); }
    if (t.boss) for (const Q of crew) bossBeaten(Q, m);
  }
  if (t.onDie) try { t.onDie(api, P, m); } catch (e) { console.error('md onDie', e); }
}
// one JackLoot badge for saving the year 2000 (js/md.js adds it to the browser's catalogue too)
const LOOT_BADGE = { id: 'badge.md_y2k', name: 'Millennium Hero', r: 3, type: 'badge', art: ['#000080', '#ffd400', 'Y2K'], d: 'Beat THE MILLENNIUM BUG deep under the Clock Tower in JackMUD. Every clock in Baudby is safe for the year 2000!', ex: 1 };
function lootAugment() { try { const L = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js')); if (L && L.ITEM && !L.ITEM[LOOT_BADGE.id]) { L.ITEMS.push(LOOT_BADGE); L.ITEM[LOOT_BADGE.id] = LOOT_BADGE; } } catch (e) { console.error('md loot', e.message); } }
function bossBeaten(P, m) {
  const ch = P.ch, k = 'boss.' + m.id;
  if (m.id === 'y2kbug' && !P.guest) { try { const LOOT = require('./loot.js'); if (LOOT.giveOnce && LOOT.giveOnce(memKey(P), LOOT_BADGE.id, 'jackmud')) out(P, '{Y}♦ A shiny MILLENNIUM HERO badge has appeared in your JackLoot Treasure Chest! ♦{x}'); } catch (e) {} }
  if (!ch.mk[k]) { ch.mk[k] = Date.now(); toAll(`{Y}[NEWS] ${P.name} has defeated ${m.t.short}! Hooray!{x}`, null); }
  if (m.t.secret) secret(P, m.t.secret);
  rupees(P, 'mdboss', 'JackMUD: beat ' + m.t.short);
}
function gainXp(P, n) {
  const ch = P.ch;
  if (ch.lv >= MAXLV) { ch.xp = Math.min(ch.xp + n, XPN(ch.lv) - 1); return; }
  ch.xp += n;
  while (ch.lv < MAXLV && ch.xp >= XPN(ch.lv)) {
    ch.xp -= XPN(ch.lv); ch.lv++;
    ch.hp = maxHp(ch); ch.mp = maxMp(ch);
    out(P, `\n{Y}  ★ ★ ★  LEVEL UP!  You are now level ${ch.lv}!  ★ ★ ★{x}\n  {W}Max HP ${maxHp(ch)}, max MP ${maxMp(ch)}. You feel brilliant.{x}`);
    const C = CL(ch.cls);
    for (const sk of C.skills) if (sk.lv === ch.lv) out(P, `  {G}You have learned a new skill: {W}${sk.id.toUpperCase()}{G}! ${sk.d}{x}`);
    if (ch.lv >= 5) for (const Q of playing()) if (Q !== P) out(Q, `{D}[INFO] {c}${P.name}{D} reached level ${ch.lv}!{x}`);
    if (ch.lv === 10) secret(P, 'md.lv10');
    if (ch.lv === MAXLV) { secret(P, 'md.lv20'); addTitle(P, 'the Legend'); }
  }
}
function addTitle(P, t) { if (!P.ch.titles.includes(t)) { P.ch.titles.push(t); out(P, `{Y}You have earned a new title: "${t}"! (Type {W}TITLE{Y} to wear it.){x}`); } }
function rupees(P, src, note, amt) {
  if (P.guest) { if (!P.ch.mk.rupnote) { P.ch.mk.rupnote = 1; out(P, `{D}(JackNet members get Rupees for things like this! Join for free and your character gets saved too.){x}`); } return 0; }
  const a = E.acctByKey(memKey(P)) || null;
  if (!a) return 0;
  const got = Math.max(0, E.earnA(a, src, note, amt));
  if (got > 0) out(P, `{Y}♦ +${plural(got, 'Rupee')} paid into your JackNet Bank account! ♦{x}`);
  else out(P, `{D}(You've had all today's Rupees for that already. Come back tomorrow!){x}`);
  return got;
}
function combatRound() {
  const done = new Set();
  for (const P of playing()) {
    const m = P.fight; if (!m) continue;
    if (m.hp <= 0 || m.room !== P.room || !rs(P.room).mobs.includes(m)) { stopFight(P); continue; }
    if (P.ld) { // asleep at the keyboard: the monster gets bored
      if (chance(0.5)) { stopFight(P); out(P, 'The fight fizzles out.'); }
      continue;
    }
    for (const k in P.cd) if (P.cd[k] > 0) P.cd[k]--;
    playerHit(P, m);
    if (m.hp <= 0 && !done.has(m)) { done.add(m); mobDefeated(m, P); }
  }
  // the monsters hit back (each one picks one of the people fighting it)
  for (const [, r] of RS) for (const m of r.mobs) {
    if (!m.fighting.size || m.hp <= 0) continue;
    const L = [...m.fighting].filter(Q => Q.room === m.room && Q.state === 'play' && !Q.gone);
    if (!L.length) { m.fighting.clear(); continue; }
    if (m.stun > 0) { m.stun--; for (const Q of L) out(Q, `${cap1(m.t.short)} is ${m.stunMsg || 'dazed'} and does nothing.`); continue; }
    const T = pick(L);
    mobHit(m, T);
    if (m.t.special && chance(m.t.special.p)) try { m.t.special.fn(api, m, L); } catch (e) { console.error('md special', e); }
  }
  for (const P of playing()) if (P.fight || P.wasFight) { P.wasFight = !!P.fight; sched(P); }
}
function aggro(P) {
  const r = rs(P.room);
  for (const m of r.mobs) {
    if (!m.t.aggro || m.fighting.size || P.ch.lv > m.t.lv + 4 || ROOMS[P.room].safe) continue;
    setTimeout(() => {
      if (P.gone || P.room !== m.room || m.hp <= 0 || P.fight || !rs(P.room).mobs.includes(m)) return;
      out(P, `{R}${cap1(m.t.short)} ${m.t.aggroMsg || 'spots you and attacks!'}{x}`);
      P.fight = m; m.fighting.add(P); sched(P);
    }, 2500);
  }
}

// ---------------------------------------------------------------- the world ticking
let tickN = 0;
function tick() {
  tickN++;
  const now = Date.now();
  if (tickN % 2 === 0) combatRound();
  if (tickN % 3 === 0) for (const P of playing()) { // getting better
    const ch = P.ch; if (P.fight) continue;
    const mh = maxHp(ch), mm = maxMp(ch); if (ch.hp >= mh && ch.mp >= mm) continue;
    const R = ROOMS[P.room], mul = (P.pos === 'rest' ? 3 : 1) * (R.inn || R.temple ? 2 : 1);
    const was = ch.hp;
    ch.hp = Math.min(mh, ch.hp + Math.max(1, Math.round(mh / 30)) * mul);
    ch.mp = Math.min(mm, ch.mp + Math.max(1, Math.round(mm / 25)) * mul);
    if (was < mh && ch.hp >= mh && P.pos === 'rest') out(P, '{G}You feel completely better.{x}');
    sched(P);
  }
  if (tickN % 5 === 0) for (const sp of SPAWNS) if (!sp.inst && sp.at && now >= sp.at) { const m = spawn(sp); if (m) toRoom(sp.room, `{R}${cap1(m.t.short)} ${m.t.arrive || 'turns up'}.{x}`); }
  if (tickN % 7 === 0) wander();
  if (tickN % 11 === 0) chatter();
  if (tickN % 13 === 0) for (const P of [...S.values()]) { if (P.ld && now - P.ld > LD_MS) leaveWorld(P, 'ld'); else if (P.state !== 'play' && P.ld && now - P.ld > 30000) { S.delete(P.key); P.gone = true; } }
  if (tickN % 2 === 1) for (const P of [...S.values()]) if (!P.guest && !P.gone && P.c && !P.ld && P.c.member !== P.name) { out(P, '{Y}You logged off JackNet, so your character has been saved and the connection closed.{x}'); hangup(P, 'logoff'); }
  if (tickN % 60 === 0) { for (const P of playing()) { P.ch.play = (P.ch.play || 0) + 60; saveP(P); } }
  if (tickN % 30 === 0) for (const id in ROOMS) { const R = ROOMS[id], r = RS.get(id); if (!r) continue; // tidy floors, put home items back
    r.items = r.items.filter(x => x.home || now - x.t < 15 * 60000);
    for (const iid of R.items || []) if (!r.items.some(x => x.id === iid && x.home) && !r.ppl.size && chance(0.2)) r.items.push({ id: iid, t: now, home: 1 });
  }
  if (tickN % 90 === 0) tips();
}
function wander() {
  for (const [, r] of RS) for (const m of [...r.mobs]) {
    if (!m.t.wander || m.fighting.size || !chance(0.25)) continue;
    const R = ROOMS[m.room], L = Object.entries(R.ex || {}).filter(([, to]) => ROOMS[to] && ROOMS[to].area === R.area && !ROOMS[to].safe && !ROOMS[to].nomob);
    if (!L.length) continue;
    const [dir, to] = pick(L);
    toRoom(m.room, `${cap1(m.t.short)} wanders off ${DIRS[dir]}.`);
    r.mobs = r.mobs.filter(x => x !== m); m.room = to; rs(to).mobs.push(m);
    toRoom(to, `${cap1(m.t.short)} wanders in from ${FROM[dir]}.`);
    for (const P of rs(to).ppl) { aggro(P); sched(P); }
  }
}
function chatter() {
  for (const [id, r] of RS) {
    if (!r.ppl.size) continue;
    for (const nid of ROOMS[id].npcs || []) { const n = NPCS[nid]; if (n && n.chat && n.chat.length && chance(0.18)) toRoom(id, `{Y}${n.chat[crypto.randomInt(0, n.chat.length)]}{x}`); }
    if (ROOMS[id].amb && chance(0.12)) toRoom(id, `{D}${pick(ROOMS[id].amb)}{x}`);
  }
}
function tips() {
  for (const P of playing()) {
    const ch = P.ch; if (!ch.pref.tips || ch.lv > 4 || P.fight || P.ld) continue;
    const t = W.TIPS[(ch.mk.tipn = ((ch.mk.tipn | 0) + 1)) % W.TIPS.length];
    out(P, `{M}TIP:{x} ${t} {D}(TIPS OFF to stop these){x}`);
  }
}

// ---------------------------------------------------------------- quests
// steps: kill (m, n) | have (i) | give (i, to) | visit (r) | talk (to) | say (r, w:[...]) | flag (f) | look (r:'room:kw')
function qState(ch, id) { return own(ch.q, id) ? ch.q[id] : null; }
function qStart(P, q) {
  const ch = P.ch; if (qState(ch, q.id) || ch.qd[q.id]) return false;
  ch.q[q.id] = { s: 0, n: 0 };
  out(P, `\n{Y}╔══ NEW QUEST: ${q.n} ══╗{x}\n{W}${q.intro}{x}`);
  for (const i of q.give || []) if (ITEMS[i]) { giveItem(P, i, true); out(P, `{W}You are given ${ITEMS[i].short}.{x}`); }
  if (q.steps[0]) out(P, `{Y}[${q.n}] First:{x} ${q.steps[0].hint}\n{D}(Type {W}QUESTS{D} any time to see your quest journal.){x}`);
  if (!ch.mk.firstq) { ch.mk.firstq = 1; out(P, '{M}TIP:{x} Quests give experience, gold and items. Members get a few Rupees for finishing them too!'); }
  qCheck(P, q);
  return true;
}
function qEvent(P, kind, a, b) {
  const ch = P.ch; if (!ch) return;
  for (const id in ch.q) {
    const q = QUEST[id]; if (!q) { delete ch.q[id]; continue; }
    const st = ch.q[id], step = q.steps[st.s]; if (!step) continue;
    if (step.k !== kind) continue;
    if (kind === 'kill' && step.m === a) { st.n++; const left = step.n - st.n; out(P, left > 0 ? `{Y}[${q.n}] ${left} more to go!{x}` : `{Y}[${q.n}] That's enough of those!{x}`); }
    else if (kind === 'say' && step.r === P.room && step.w.some(w => new RegExp('\\b' + w + '\\b', 'i').test(a))) st.n = 1;
    else if (kind === 'give' && step.to === a && step.i === b) st.n = 1;
    else if (kind === 'talk' && step.to === a) st.n = 1;
    else if (kind === 'visit' && step.r === a) st.n = 1;
    else if (kind === 'look' && step.r === a) st.n = 1;
    else if (kind === 'flag' && step.f === a) st.n = 1;
    qCheck(P, q);
  }
}
function stepDone(ch, step, st) {
  if (step.k === 'kill') return st.n >= step.n;
  if (step.k === 'have') return countItem(ch, step.i) >= (step.n || 1) || (step.n || 1) === 1 && hasItem(ch, step.i);
  if (step.k === 'flag') return !!ch.fl[step.f] || st.n > 0;
  return st.n > 0;
}
function qCheck(P, q) {
  const ch = P.ch, st = ch.q[q.id]; if (!st) return;
  let moved = false;
  while (q.steps[st.s] && stepDone(ch, q.steps[st.s], st)) {
    const step = q.steps[st.s];
    if (step.done) out(P, `{Y}[${q.n}]{x} ${step.done}`);
    if (step.give && ITEMS[step.give]) { giveItem(P, step.give, true); out(P, `{W}You receive ${ITEMS[step.give].short}.{x}`); }
    st.s++; st.n = 0; moved = true;
  }
  if (st.s >= q.steps.length) return qFinish(P, q);
  if (moved) { const nx = q.steps[st.s]; out(P, `{Y}[${q.n}] Next:{x} ${nx.hint}`); }
}
function qFinish(P, q) {
  const ch = P.ch, R = q.reward || {};
  delete ch.q[q.id]; ch.qd[q.id] = Date.now();
  for (const i of R.take || []) takeItem(ch, i, 99);
  out(P, `\n{G}★ QUEST COMPLETE: ${q.n} ★{x}${q.end ? '\n{W}' + q.end + '{x}' : ''}`);
  if (q.art && W.ARTX[q.art]) out(P, W.ARTX[q.art]);
  if (R.gold) { ch.gold = Math.min(MAXGOLD, ch.gold + R.gold); out(P, `{Y}You receive ${plural(R.gold, 'gold coin')}.{x}`); }
  const got = {}; for (const i of R.items || []) if (ITEMS[i]) { giveItem(P, i, true); got[i] = (got[i] || 0) + 1; }
  for (const i in got) out(P, `{W}You receive ${got[i] > 1 ? got[i] + ' x ' : ''}${ITEMS[i].short}!{x}`);
  if (R.title) addTitle(P, R.title);
  if (R.flag) ch.fl[R.flag] = 1;
  if (R.xp) { out(P, `{M}You get ${R.xp} experience!{x}`); gainXp(P, R.xp); }
  if (R.secret) secret(P, R.secret);
  rupees(P, 'mdquest', 'JackMUD quest: ' + q.n, q.rup || 5);
  const done = Object.keys(ch.qd).filter(k => QUEST[k]).length;
  if (done === QUESTS.length) { secret(P, 'md.allquests'); addTitle(P, 'the Questmaster'); toAll(`{Y}[NEWS] ${P.name} has finished EVERY quest in JackMUD! Three cheers!{x}`); }
  toRoom(P.room, `{c}${P.name}{x} looks very pleased with themselves.`, P);
  ctx.markDirty();
}
function qAvailable(P, npcId) {
  const ch = P.ch;
  return QUESTS.filter(q => q.giver === npcId && !ch.qd[q.id] && !qState(ch, q.id) && (q.need || []).every(n => ch.qd[n]) && (!q.lv || ch.lv >= q.lv));
}

// ---------------------------------------------------------------- the api the world files use
const api = {
  out, toRoom, toAll, look, teleport, place, give: giveItem, take: (P, id, n) => takeItem(P.ch, id, n), has: (P, id) => hasItem(P.ch, id), count: (P, id) => countItem(P.ch, id),
  flag: (P, f, v) => { if (v === undefined) return !!P.ch.fl[f]; if (v) P.ch.fl[f] = 1; else delete P.ch.fl[f]; qEvent(P, 'flag', f); return v; },
  mark: (P, k, v) => { if (v === undefined) return P.ch.mk[k]; P.ch.mk[k] = v; return v; },
  secret, qEvent, qStart: (P, id) => QUEST[id] && qStart(P, QUEST[id]), qDone: (P, id) => !!P.ch.qd[id], qOn: (P, id) => !!qState(P.ch, id),
  gold: (P, n) => { if (n) P.ch.gold = clamp(P.ch.gold + n, 0, MAXGOLD); return P.ch.gold; }, xp: (P, n) => gainXp(P, n), title: addTitle,
  heal: (P, n) => { P.ch.hp = Math.min(maxHp(P.ch), P.ch.hp + (n == null ? 9999 : n)); P.ch.mp = Math.min(maxMp(P.ch), P.ch.mp + (n == null ? 9999 : 0)); },
  hurt: (P, n) => { P.ch.hp -= n; if (P.ch.hp <= 0) faint(P, null); },
  spawnMob: (room, id) => { const t = MOBS[id]; if (!t || rs(room).mobs.some(m => m.id === id)) return null; const m = { uid: mobSeq++, t, id, hp: t.hp, room, sp: null, stun: 0, fighting: new Set() }; rs(room).mobs.push(m); return m; },
  mobsIn: room => rs(room).mobs, here: room => [...rs(room).ppl], ITEMS, ROOMS, MOBS, NPCS, cap1, pick, rint, chance, plural, an, vis, lv: P => P.ch.lv, cls: P => P.ch.cls, name: P => P.name,
  sx: (P, k) => { P.ch.sx[k] = 1; P.mapRoom = null; }, sxHas: (P, k) => !!P.ch.sx[k], uk: () => E.uk(), today99,
  stun: (m, n, msg) => { m.stun = n; m.stunMsg = msg || 'dazed'; }, hitAll: (m, L, n, text) => { for (const Q of L) { out(Q, text); Q.ch.hp -= n; if (Q.ch.hp <= 0) faint(Q, m); } },
};
function today99() {
  const d = E.uk().day; let m = +d.slice(5, 7), dd = +d.slice(8, 10); if (m === 2 && dd === 29) dd = 28;
  const dt = new Date(Date.UTC(1999, m - 1, dd));
  return { m, d: dd, dow: dt.getUTCDay(), left: Math.round((Date.UTC(2000, 0, 1) - dt) / 864e5) };
}

// ---------------------------------------------------------------- the map
function coords() { // lay every area out on a grid from its exits (the world files keep directions consistent)
  const V = { n: [0, -1, 0], s: [0, 1, 0], e: [1, 0, 0], w: [-1, 0, 0], ne: [1, -1, 0], nw: [-1, -1, 0], se: [1, 1, 0], sw: [-1, 1, 0], u: [0, 0, 1], d: [0, 0, -1] };
  const done = new Set();
  for (const id in ROOMS) {
    if (done.has(id)) continue;
    const area = ROOMS[id].area, q = [[id, 0, 0, 0]]; done.add(id);
    while (q.length) {
      const [rid, x, y, z] = q.shift(); const R = ROOMS[rid]; R.xy = R.xy || [x, y, z];
      for (const [d, to] of Object.entries(Object.assign({}, R.ex, R.hid))) {
        if (!V[d] || done.has(to) || !ROOMS[to] || ROOMS[to].area !== area) continue;
        done.add(to); q.push([to, R.xy[0] + V[d][0], R.xy[1] + V[d][1], R.xy[2] + V[d][2]]);
      }
    }
  }
}
function miniMap(P) {
  const R = ROOMS[P.room]; if (!R.xy || R.nomap) return null;
  const [cx, cy, cz] = R.xy, list = [];
  for (const id in ROOMS) {
    const Q = ROOMS[id]; if (Q.area !== R.area || !Q.xy || Q.xy[2] !== cz) continue;
    const dx = Q.xy[0] - cx, dy = Q.xy[1] - cy; if (Math.abs(dx) > 4 || Math.abs(dy) > 3) continue;
    if (!P.ch.seen[id] && !(Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && Object.values(R.ex).includes(id))) continue;
    const ex = Object.keys(Q.ex || {}).filter(d => ROOMS[Q.ex[d]] && ROOMS[Q.ex[d]].area === Q.area && /^(n|s|e|w|ne|nw|se|sw)$/.test(d)).concat(Object.keys(Q.hid || {}).filter(d => P.ch.sx[id + '.' + d] && /^(n|s|e|w)$/.test(d)));
    list.push({ x: dx, y: dy, me: id === P.room ? 1 : 0, ex: ex.join(','), ud: (Q.ex.u ? 'u' : '') + (Q.ex.d ? 'd' : ''), n: P.ch.seen[id] ? Q.n : '?', k: Q.safe ? 's' : (Q.npcs || []).length ? 'n' : '' });
  }
  return list;
}
function asciiMap(P) {
  const L = miniMap(P); if (!L) return out(P, "You can't make a map of this place. It's too twisty. (Or you're in a boat.)");
  const W2 = 9, H2 = 7, g = Array.from({ length: H2 * 2 + 1 }, () => Array(W2 * 4 + 1).fill(' '));
  const at = (x, y) => [(y + 3) * 2 + 1 - 1, (x + 4) * 4 + 1];
  for (const r of L) {
    const [yy, xx] = at(r.x, r.y); if (yy < 0 || yy >= g.length - 1 || xx < 1 || xx >= g[0].length - 2) continue;
    g[yy][xx - 1] = '['; g[yy][xx + 1] = ']'; g[yy][xx] = r.me ? '@' : r.ud ? (r.ud === 'ud' ? '%' : r.ud === 'u' ? '^' : 'v') : r.k === 'n' ? '!' : ' ';
    for (const d of r.ex.split(',')) {
      if (d === 'e' && xx + 2 < g[0].length) g[yy][xx + 2] = '-';
      if (d === 'w') g[yy][xx - 2] = '-';
      if (d === 's' && yy + 1 < g.length) g[yy + 1][xx] = '|';
      if (d === 'n' && yy - 1 >= 0) g[yy - 1][xx] = '|';
      if (d === 'ne' && yy - 1 >= 0) g[yy - 1][xx + 2] = '/';
      if (d === 'sw' && yy + 1 < g.length) g[yy + 1][xx - 2] = '/';
      if (d === 'nw' && yy - 1 >= 0) g[yy - 1][xx - 2] = '\\';
      if (d === 'se' && yy + 1 < g.length) g[yy + 1][xx + 2] = '\\';
    }
  }
  let rows = g.map(r => r.join('').replace(/\s+$/, ''));
  while (rows.length && !rows[0].trim()) rows.shift(); while (rows.length && !rows[rows.length - 1].trim()) rows.pop();
  const ind = Math.min(...rows.filter(r => r.trim()).map(r => r.match(/^ */)[0].length));
  rows = rows.map(r => '   ' + r.slice(ind).replace(/\[@\]/g, '{Y}[@]{G}').replace(/!/g, '{Y}!{G}'));
  const R = ROOMS[P.room];
  out(P, `{C}Map of ${(W.AREAS[R.area] || {}).n || 'here'}{x}  {D}(only the bits you've seen){x}\n{G}${rows.join('\n')}{x}\n {Y}@{x} you  {Y}!{x} someone to talk to  {G}^ v %{x} stairs up/down/both  {D}[ ] a room{x}`);
}

// ---------------------------------------------------------------- commands
const CMD = {}; const ORDER = [];
function C(names, fn, o) { names.split(' ').forEach((n, i) => { CMD[n] = { fn, o: o || {} }; if (i === 0) ORDER.push(n); }); }

for (const d in DIRS) C(`${DIRS[d]} ${d}`, (P) => move(P, d));
C('go walk', (P, a) => { const d = DIRWORD[a.toLowerCase()]; if (!d) return out(P, 'Go where? Try {W}GO NORTH{x}, or just {W}N{x}.'); move(P, d); });
C('look l examine x ex read glance', (P, a, verb) => { if (verb === 'read' && !a) return out(P, 'Read what? (Try {W}READ SIGN{x} or {W}READ{x} something you are carrying.)'); if (verb === 'read') { const id = findInv(P.ch, a); if (id && ITEMS[id].text) return out(P, `{W}You read ${ITEMS[id].short}:{x}\n${ITEMS[id].text}`); } a ? lookAt(P, a) : look(P, true); });
C('exits', P => { const R = ROOMS[P.room]; const ex = exitsOf(P, R); out(P, ex.length ? '{G}Ways out:{x}\n' + ex.map(d => { const to = R.ex[d] || R.hid[d]; return `  {W}${pad(DIRS[d] || d, 10)}{x} - ${P.ch.seen[to] ? ROOMS[to].n : '(somewhere you have not been yet)'}`; }).join('\n') : 'There are no ways out! (Try SEARCH, or RECALL to go back to town.)'); });
C('map m', P => asciiMap(P));
C('inventory i inv', P => {
  const ch = P.ch; const cnt = {}; for (const id of ch.inv) cnt[id] = (cnt[id] || 0) + 1;
  const L = Object.keys(cnt).map(id => `  ${cnt[id] > 1 ? '{W}(' + cnt[id] + '){x} ' : ''}${ITEMS[id].short}${ITEMS[id].quest ? ' {Y}(quest){x}' : ''}`);
  out(P, `{C}You are carrying (${ch.inv.length}/${MAXINV}):{x}\n${L.length ? L.join('\n') : '  Nothing at all. Not even fluff.'}\n{Y}Gold: ${fmt(ch.gold)}{x}${ch.bank ? `  {D}(and ${fmt(ch.bank)} in the bank){x}` : ''}\n{D}(Type {W}EQ{D} to see what you're wearing and holding.){x}`);
});
const SLOTS = [['weapon', 'Holding'], ['head', 'On your head'], ['body', 'On your body'], ['hands', 'On your hands'], ['feet', 'On your feet'], ['shield', 'Shield arm'], ['neck', 'Round your neck']];
C('equipment eq worn', P => { const ch = P.ch; out(P, `{C}You are using:{x}\n${SLOTS.map(([s, l]) => `  {D}${pad(l + ':', 17)}{x}${ch.eq[s] ? ITEMS[ch.eq[s]].short : '{D}nothing{x}'}`).join('\n')}\n  {D}Armour total: ${acOf(ch)}{x}`); });
C('wield wear hold equip', (P, a) => {
  const ch = P.ch; if (!a) return out(P, 'Wear or wield what? (Try {W}WEAR ALL{x}.)');
  const all = /^all$/i.test(a), ids = all ? ch.inv.slice() : [findInv(ch, a)];
  if (!ids[0] && !all) return out(P, `You aren't carrying any "${vis(a)}".`);
  let n = 0;
  for (const id of ids) {
    const it = ITEMS[id]; if (!it) continue;
    const slot = it.type === 'weapon' ? 'weapon' : it.slot;
    if (!slot) { if (!all) out(P, `You can't wear ${it.short}. ${it.type === 'food' || it.type === 'drink' ? 'Try eating it!' : ''}`); continue; }
    if (it.lv && ch.lv < it.lv) { if (!all) out(P, `You need to be level ${it.lv} to use ${it.short}.`); continue; }
    if (it.cls && !it.cls.includes(ch.cls)) { if (!all) out(P, `Only ${it.cls.map(c => CL(c).n + 's').join(' and ')} can use ${it.short}.`); continue; }
    if (all && ch.eq[slot]) continue;
    if (ch.eq[slot]) { ch.inv.push(ch.eq[slot]); out(P, `You stop using ${ITEMS[ch.eq[slot]].short}.`); }
    ch.inv.splice(ch.inv.indexOf(id), 1); ch.eq[slot] = id; n++;
    out(P, it.type === 'weapon' ? `You hold ${it.short}. ${it.wieldMsg || 'Feels good!'}` : `You put on ${it.short}.`);
    toRoom(P.room, `${P.name} ${it.type === 'weapon' ? 'holds' : 'puts on'} ${it.short}.`, P);
  }
  if (all && !n) out(P, "You've got nothing else to put on.");
  ch.hp = Math.min(ch.hp, maxHp(ch)); ch.mp = Math.min(ch.mp, maxMp(ch));
});
C('remove rem unwield', (P, a) => {
  const ch = P.ch; if (!a) return out(P, 'Take off what?');
  const s = Object.keys(ch.eq).find(k => itemKws(ch.eq[k]).some(w => w.startsWith(a.toLowerCase())) || k === a.toLowerCase());
  if (!s) return out(P, "You're not wearing that.");
  if (ch.inv.length >= MAXINV) return out(P, 'Your bag is too full to put it away!');
  out(P, `You stop using ${ITEMS[ch.eq[s]].short}.`); ch.inv.push(ch.eq[s]); delete ch.eq[s];
  ch.hp = Math.min(ch.hp, maxHp(ch)); ch.mp = Math.min(ch.mp, maxMp(ch));
});
C('get take pick', (P, a) => {
  const ch = P.ch, r = rs(P.room); a = a.replace(/^up\s+/i, '');
  if (!a) return out(P, 'Get what? (Try {W}GET ALL{x}.)');
  const npcItem = W.ACT[P.room] && W.ACT[P.room].get; if (npcItem) { const res = npcItem(api, P, a); if (res) return; }
  const all = /^all$/i.test(a);
  const pickL = all ? r.items.slice() : [findIn(r.items, a, x => itemKws(x.id))].filter(Boolean);
  if (!pickL.length) { if (/^(gold|coins?|money)$/i.test(a)) return out(P, 'There is no gold here. (Gold goes straight into your pocket when you win a fight.)'); return out(P, all ? 'There is nothing here to pick up.' : `You don't see any "${vis(a)}" here.`); }
  for (const x of pickL) {
    const it = ITEMS[x.id];
    if (it.fixed) { out(P, it.fixed); continue; }
    if (ch.inv.length >= MAXINV) { out(P, 'Your bag is full! Drop something first.'); break; }
    if (it.unique && hasItem(ch, x.id)) { out(P, `You already have ${it.short}.`); continue; }
    r.items.splice(r.items.indexOf(x), 1); ch.inv.push(x.id);
    out(P, `You pick up ${it.short}.`); toRoom(P.room, `${P.name} picks up ${it.short}.`, P);
    qEvent(P, 'have', x.id);
  }
});
C('drop', (P, a) => {
  const ch = P.ch, r = rs(P.room); if (!a) return out(P, 'Drop what?');
  if (/^\d+\s+(gold|coins?)$/i.test(a)) return out(P, 'Keep your gold safe! (You can GIVE gold to people, or put it in the bank.)');
  const all = /^all$/i.test(a), L = all ? ch.inv.slice() : [findInv(ch, a)].filter(Boolean);
  if (!L.length) return out(P, all ? "You aren't carrying anything." : `You aren't carrying any "${vis(a)}".`);
  for (const id of L) {
    const it = ITEMS[id];
    if (it.quest || it.nodrop) { out(P, `You'd better hang on to ${it.short}. Somebody needs it!`); continue; }
    ch.inv.splice(ch.inv.indexOf(id), 1); r.items.push({ id, t: Date.now() }); if (r.items.length > 40) r.items.shift();
    out(P, `You drop ${it.short}.`); toRoom(P.room, `${P.name} drops ${it.short}.`, P);
  }
});
C('give hand offer', (P, a) => {
  const ch = P.ch, m = /^(.+?)\s+(?:to\s+)?(\S+)$/i.exec(a); if (!m) return out(P, 'Give what to who? Like this: {W}GIVE HONEY TED{x} or {W}GIVE 10 GOLD DAVE{x}');
  const [, what, who] = m;
  const gm = /^(\d+)\s*(gold|coins?|gp)?$/i.exec(what);
  const Q = findPc(P, who), n = Q ? null : findNpc(P, who);
  if (!Q && !n) { const mob = findMob(P, who); return out(P, mob ? `${cap1(mob.t.short)} doesn't want presents. It wants to bonk you.` : `There's nobody called "${vis(who)}" here.`); }
  if (gm && (gm[2] || Q)) {
    const g = Math.floor(+gm[1]); if (!(g > 0)) return out(P, 'Give how much?'); if (g > ch.gold) return out(P, `You only have ${fmt(ch.gold)} gold.`);
    if (n) return out(P, `${cap1(n.short)} says, "Keep your money, dear. Spend it in the shops!"`);
    ch.gold -= g; Q.ch.gold = Math.min(MAXGOLD, Q.ch.gold + g); out(P, `You give ${g} gold to ${Q.name}.`); out(Q, `{Y}${P.name} gives you ${g} gold coins!{x}`); toRoom(P.room, `${P.name} gives some gold to ${Q.name}.`, P, Q); saveP(P); saveP(Q); return;
  }
  const id = findInv(ch, what); if (!id) return out(P, `You aren't carrying any "${vis(what)}".`);
  const it = ITEMS[id];
  if (Q) {
    if (it.quest || it.nodrop) return out(P, `You can't give ${it.short} away. It's for a quest!`);
    if (Q.ch.inv.length >= MAXINV) return out(P, `${Q.name}'s bag is full.`);
    ch.inv.splice(ch.inv.indexOf(id), 1); Q.ch.inv.push(id);
    out(P, `You give ${it.short} to ${Q.name}.`); out(Q, `{W}${P.name} gives you ${it.short}.{x}`); toRoom(P.room, `${P.name} gives ${it.short} to ${Q.name}.`, P, Q);
    qEvent(Q, 'have', id); saveP(P); saveP(Q); return;
  }
  // to an NPC: quests first, then the NPC's own idea about presents
  const before = Object.keys(ch.qd).length;
  const wanted = Object.keys(ch.q).some(qid => { const q = QUEST[qid], s = q && q.steps[ch.q[qid].s]; return s && s.k === 'give' && s.to === n.id && s.i === id; });
  if (wanted) {
    takeItem(ch, id, 1); out(P, `You give ${it.short} to ${n.short}.`); toRoom(P.room, `${P.name} gives ${it.short} to ${n.short}.`, P);
    for (const qid of Object.keys(ch.q)) { const q = QUEST[qid], s2 = q && q.steps[ch.q[qid].s]; if (s2 && s2.k === 'give' && s2.to === n.id && s2.i === id && s2.say) out(P, `{Y}${cap1(n.short)} says, "${s2.say}"{x}`); }
    qEvent(P, 'give', n.id, id); return;
  }
  if (n.on && n.on.give) { const r2 = n.on.give(api, P, id); if (r2) return; }
  void before;
  out(P, `${cap1(n.short)} looks at ${it.short} and shakes their head. "That's very kind, but no thank you."`);
});
C('eat drink quaff use', (P, a, verb) => {
  const ch = P.ch; if (!a) return out(P, `${cap1(verb)} what?`);
  const id = findInv(ch, a) || findIn(Object.values(ch.eq), a, itemKws);
  const A = W.ACT[P.room];
  if (verb === 'use' && A && A.use) { const r2 = A.use(api, P, id, a); if (r2) return; }
  if (!id) return out(P, `You aren't carrying any "${vis(a)}".`);
  const it = ITEMS[id];
  if (it.use) { const r2 = it.use(api, P); if (r2 !== false) { if (it.used) takeItem(ch, id, 1); return; } }
  if (!it.heal && !it.mana) return out(P, verb === 'use' ? `You wave ${it.short} about. Nothing happens.` : `You can't ${verb} ${it.short}! (Gubbinz could. Gubbinz eats anything.)`);
  takeItem(ch, id, 1);
  const was = ch.hp, wm = ch.mp;
  ch.hp = Math.min(maxHp(ch), ch.hp + (it.heal || 0)); ch.mp = Math.min(maxMp(ch), ch.mp + (it.mana || 0));
  out(P, `${it.eatMsg || `You ${it.type === 'drink' ? 'drink' : 'eat'} ${it.short}.`} {G}(+${ch.hp - was} HP${it.mana ? `, +${ch.mp - wm} MP` : ''}){x}`);
  toRoom(P.room, `${P.name} ${it.type === 'drink' ? 'drinks' : 'eats'} ${it.short}.`, P);
});
C('score sc stats sheet', P => {
  const ch = P.ch, C2 = CL(ch.cls), qd = Object.keys(ch.qd).filter(k => QUEST[k]).length;
  const art = C2.art || [];
  const L = [
    `{W}${ch.n}{x} ${ch.title || 'the ' + C2.n}`,
    `Level {Y}${ch.lv}{x} ${C2.n}      ${P.guest ? '{D}(guest: not saved){x}' : '{G}(saved){x}'}`,
    `HP {G}${ch.hp}/${maxHp(ch)}{x}   MP {C}${ch.mp}/${maxMp(ch)}{x}   Armour {W}${acOf(ch)}{x}`,
    `XP {M}${fmt(ch.xp)}/${fmt(XPN(ch.lv))}{x}  ${ch.lv >= MAXLV ? '{Y}(top level!){x}' : `(${fmt(XPN(ch.lv) - ch.xp)} to level ${ch.lv + 1})`}`,
    `Gold {Y}${fmt(ch.gold)}{x}   Bank {Y}${fmt(ch.bank)}{x}`,
    `Weapon: ${weapon(ch).short}`,
    `Skills: ${C2.skills.filter(s => s.lv <= ch.lv).map(s => '{W}' + s.id + '{x}').join(', ') || 'none yet'}`,
    `Quests done: {W}${qd}/${QUESTS.length}{x}   Monsters beaten: {W}${ch.kills}{x}`,
    `Fainted: ${ch.faints} time${ch.faints === 1 ? '' : 's'}   Rooms explored: ${Object.keys(ch.seen).length}/${Object.keys(ROOMS).length}`,
  ];
  const rows = narrow(P) ? L : L.map((l, i) => pad(art[i] ? '{' + (C2.col || 'C') + '}' + art[i] + '{x}' : '', 14) + l);
  out(P, boxP(P, 'CHARACTER SHEET', rows, 76));
});
C('skills spells abilities', P => { const ch = P.ch, C2 = CL(ch.cls); out(P, `{C}${C2.n} skills:{x}\n` + C2.skills.map(s => `  ${s.lv <= ch.lv ? '{W}' : '{D}'}${pad(s.id.toUpperCase(), 9)}{x} ${s.lv <= ch.lv ? '' : '{D}(level ' + s.lv + ') {x}'}${s.d}${s.mp ? ` {C}[${s.mp} MP]{x}` : ''}`).join('\n') + '\n  {W}REST{x}     sit down and get better three times faster'); });
C('quests journal q quest', P => {
  const ch = P.ch, L = [];
  for (const id in ch.q) { const q = QUEST[id]; if (!q) continue; const st = ch.q[id], s = q.steps[st.s]; L.push(`{Y}* ${q.n}{x} {D}(from ${NPCS[q.giver] ? NPCS[q.giver].short : 'someone'}){x}\n    ${s ? s.hint : ''}${s && s.k === 'kill' ? ` {D}(${st.n}/${s.n}){x}` : ''}`); }
  const done = QUESTS.filter(q => ch.qd[q.id]);
  out(P, `{C}═══ YOUR QUEST JOURNAL ═══{x}\n${L.length ? L.join('\n') : '  No quests on the go. Talk to people! Anyone with a {Y}!{x} on the MAP might need help.'}\n{D}Finished: ${done.length} of ${QUESTS.length}${done.length ? ': ' + done.map(q => q.n).join(', ') : ''}{x}`);
});
C('help h ? commands', (P, a) => help(P, a));
C('areas zones where', (P, a, verb) => {
  if (verb === 'where' && a) { const Q = findPc(P, a, true); return out(P, Q ? `${Q.name} is somewhere in ${(W.AREAS[ROOMS[Q.room].area] || {}).n}.` : 'Nobody by that name is playing.'); }
  const L = Object.values(W.AREAS).filter(A2 => !A2.hide).map(A2 => narrow(P) ? ` {W}${A2.n}{x} {Y}(lv ${A2.lv}){x}\n    {D}${A2.d}{x}` : `  {W}${pad(A2.n, 26)}{x} {Y}${pad('lv ' + A2.lv, 9)}{x} ${A2.d}`);
  out(P, `{C}The lands of JackMUD{x} {D}(level guide){x}\n${L.join('\n')}\n{D}You are in: ${(W.AREAS[ROOMS[P.room].area] || {}).n}. Players around: ${playing().map(Q => Q.name + ' (' + ((W.AREAS[ROOMS[Q.room].area] || {}).n || '?') + ')').join(', ')}{x}`);
});
C('who online players', P => {
  const L = playing().sort((a, b) => b.ch.lv - a.ch.lv).map(Q => `  {Y}[${String(Q.ch.lv).padStart(2)} ${CL(Q.ch.cls).abbr}]{x} {c}${Q.name}{x} ${Q.ch.title || 'the ' + CL(Q.ch.cls).n}${Q.guest ? ' {D}(guest){x}' : ''}${Q.ld ? ' {D}(snoozing){x}' : ''} {D}via ${{ tel: 'Telnet', dos: 'MS-DOS', web: 'the web', app: 'MUDdy 98' }[Q.via] || 'Telnet'}{x}`);
  out(P, boxP(P, 'WHO IS ON JACKMUD', L.map(l => l.replace(/^ {2}/, '')), 70) + `\n${plural(L.length, 'adventurer')} online. Say hello with {W}SHOUT HELLO!{x}`);
});
C('time date clock', P => {
  const t = today99(), u = E.uk(), DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const h12 = (u.h % 12) || 12;
  out(P, `It is ${h12}:${String(u.mi).padStart(2, '0')}${u.h < 12 ? 'am' : 'pm'} on ${DAYS[t.dow]} ${t.d} ${MON[t.m - 1]} 1999. ${u.h >= 21 || u.h < 6 ? 'The stars are out over Baudby.' : u.h < 9 ? 'The cockerels of Floppy Fields are still at it.' : u.h < 18 ? 'The sun is shining on Baudby (mostly).' : 'The lamplighter is doing his rounds.'}\n{Y}The clock tower says: ${t.left} day${t.left === 1 ? '' : 's'} until the year 2000!{x}`);
});
C('say \' "', (P, a) => {
  if (!a) return out(P, 'Say what? Like this: {W}SAY HELLO{x}');
  const t = vis(ctx.delink(ctx.clean(a, 200))); if (!t) return;
  out(P, `{W}You say, "${t}"{x}`); toRoom(P.room, `{W}${P.name} says, "${t}"{x}`, P);
  if (/\bxyzzy\b/i.test(t)) { out(P, '{G}A hollow voice says, "Nice try. Wrong game." Somewhere, Gubbinz giggles.{x}'); secret(P, 'md.xyzzy'); }
  if (/\bplugh\b/i.test(t)) out(P, '{G}A hollow voice says, "Wrong game AGAIN." You hear a modem screech in the distance.{x}');
  qEvent(P, 'say', t);
  const A = W.ACT[P.room]; if (A && A.say) A.say(api, P, t);
  for (const id of ROOMS[P.room].npcs || []) { const n = NPCS[id]; if (n && n.on && n.on.hear) n.on.hear(api, P, t); }
});
C('shout yell holler', (P, a) => {
  if (!a) return out(P, 'Shout what? Everybody playing will hear it!');
  if (!P.rl.shout.take()) return out(P, 'Your throat is sore from all that shouting. Wait a bit!');
  const t = vis(ctx.delink(ctx.clean(a, 160))); if (!t) return;
  out(P, `{Y}You shout, "${t}"{x}`); for (const Q of playing()) if (Q !== P) out(Q, `{Y}${P.name} shouts, "${t}"{x}`);
});
C('tell whisper t send', (P, a) => {
  const m = /^(\S+)\s+(.+)$/.exec(a); if (!m) return out(P, 'Tell who what? Like this: {W}TELL DAVE HELLO{x}');
  const Q = findPc(P, m[1], true); if (!Q) return out(P, `Nobody called "${vis(m[1])}" is playing right now. (Type WHO.)`);
  if (!P.rl.tell.take()) return out(P, 'Slow down a bit!');
  const t = vis(ctx.delink(ctx.clean(m[2], 200))); if (!t) return;
  out(P, `{M}You tell ${Q.name}, "${t}"{x}`); out(Q, `\x07{M}${P.name} tells you, "${t}"{x} {D}(REPLY to answer){x}`); Q.lastTell = P.name;
  if (Q.ld) out(P, `{D}(${Q.name} is asleep at the keyboard and might not see it.){x}`);
});
C('reply r', (P, a) => { if (!P.lastTell) return out(P, 'Nobody has told you anything yet.'); CMD.tell.fn(P, P.lastTell + ' ' + a, 'tell'); });
C('emote : me pose', (P, a) => { if (!a) return out(P, 'Emote what? Like this: {W}EMOTE does a little dance{x}'); const t = vis(ctx.delink(ctx.clean(a, 160))); if (!t) return; const line = `{c}${P.name} ${t}{x}`; out(P, line); toRoom(P.room, line, P); });
for (const [verb, alone, aloneR, tgt, tgtR, tgtV] of W.SOCIALS) C(verb, (P, a) => {
  if (!a) { out(P, alone); toRoom(P.room, aloneR.replace(/\$n/g, P.name), P); return; }
  const Q = findPc(P, a); const n = Q ? null : findNpc(P, a); const m = Q || n ? null : findMob(P, a);
  const who = Q ? Q.name : n ? n.short : m ? m.t.short : null; if (!who) return out(P, `There's nobody called "${vis(a)}" here.`);
  out(P, tgt.replace(/\$N/g, who)); toRoom(P.room, tgtR.replace(/\$n/g, P.name).replace(/\$N/g, who), P, Q); if (Q) out(Q, tgtV.replace(/\$n/g, P.name));
  if (n && n.on && n.on.social) n.on.social(api, P, verb);
}, { social: 1 });
C('socials emotes', P => out(P, `{C}Things you can do (type one, or add a name):{x}\n  ${W.SOCIALS.map(s => s[0]).join(', ')}\n  {D}...or EMOTE anything you like: EMOTE pulls a funny face{x}`));
C('kill attack k fight hit bonk', (P, a) => {
  if (!a) { if (P.fight) return out(P, `You're already fighting ${P.fight.t.short}!`); const m = rs(P.room).mobs.find(x => !x.t.peace); return out(P, m ? `Attack what? Try {W}KILL ${m.t.kw[0].toUpperCase()}{x}.` : 'There is nothing here to fight. Phew.'); }
  const m = findMob(P, a);
  if (!m) { if (findPc(P, a)) return out(P, 'No fighting other players! This is a friendly MUD. (Try HUG instead.)'); const n = findNpc(P, a); if (n) return out(P, `${cap1(n.short)} looks at you sternly. You decide that would be very rude.`); return out(P, `You don't see any "${vis(a)}" to fight here.`); }
  if (P.fight && P.fight !== m) { stopFight(P); }
  if (startFight(P, m)) playerHitFirst(P, m);
});
function playerHitFirst(P, m) { if (P.cd.first > 0) return; P.cd.first = 1; playerHit(P, m); if (m.hp <= 0) mobDefeated(m, P); }
C('flee run escape', P => {
  if (!P.fight) return out(P, "You're not fighting anything. (You run round in a circle anyway.)");
  const R = ROOMS[P.room], L = exitsOf(P, R).filter(d => !(R.lock && R.lock[d] && !hasItem(P.ch, R.lock[d].i)));
  if (!L.length || !chance(0.75)) return out(P, '{R}You try to run away but trip over your own shoelaces!{x}');
  const m = P.fight; stopFight(P); out(P, `{Y}You run away from ${m.t.short}! Phew!{x}`); move(P, pick(L), { verb: 'runs away' });
});
C('consider con', (P, a) => { const m = a ? findMob(P, a) : rs(P.room).mobs[0]; if (!m) return out(P, 'Consider what?'); out(P, `${cap1(m.t.short)} (level ${m.t.lv}): ${conLine(P.ch, m.t)}`); });
function skill(P, id, a) {
  const ch = P.ch, C2 = CL(ch.cls), sk = C2.skills.find(s => s.id === id);
  if (!sk) { const who = Object.values(CLASSES).find(c => c.skills.some(s => s.id === id)); return out(P, `Only ${who ? who.n + 's' : 'other classes'} know how to ${id.toUpperCase()}.`); }
  if (ch.lv < sk.lv) return out(P, `You'll learn ${id.toUpperCase()} at level ${sk.lv}.`);
  if (P.cd[id] > 0) return out(P, `You need a moment before you can ${id.toUpperCase()} again. (${P.cd[id]} more round${P.cd[id] === 1 ? '' : 's'}.)`);
  if (ch.mp < (sk.mp || 0)) return out(P, `You haven't got enough MP! (${id.toUpperCase()} needs ${sk.mp}. REST to get it back.)`);
  let m = P.fight;
  if (sk.target === 'mob') {
    if (a) m = findMob(P, a); else if (!m) m = rs(P.room).mobs.find(x => !x.t.peace) || null;
    if (!m) return out(P, `${id.toUpperCase()} what? There's nothing here to fight.`);
    if (!startFight(P, m, true)) return;
  }
  ch.mp -= sk.mp || 0; P.cd[id] = sk.cd || 0;
  const r = sk.fn({ P, m, ch, api, out, toRoom, playerHit, party: partyHere(P) });
  if (m && m.hp <= 0) mobDefeated(m, P);
  return r;
}
for (const C2 of Object.values(CLASSES)) for (const sk of C2.skills) if (!CMD[sk.id]) C(sk.id, (P, a) => skill(P, sk.id, a));
C('rest sit sleep', P => { if (P.fight) return out(P, 'Not now! You are fighting!'); if (P.pos === 'rest') return out(P, "You're already resting. Ahhh."); P.pos = 'rest'; out(P, 'You sit down and have a rest. {D}(You get better three times faster. Type STAND to get up.){x}'); toRoom(P.room, `${P.name} sits down for a rest.`, P); });
C('stand wake', P => { if (P.pos !== 'rest') return out(P, "You're already standing up."); P.pos = 'stand'; out(P, 'You stand up and stretch.'); toRoom(P.room, `${P.name} stands up.`, P); });
C('recall home', P => {
  if (P.fight) return out(P, 'You can\'t recall in the middle of a fight! FLEE first.');
  const now = Date.now(); if (now - (P.recallAt || 0) < 10000) return out(P, 'Your recall magic is still recharging. Give it a few seconds.');
  if (ROOMS[P.room].norecall) return out(P, ROOMS[P.room].norecall);
  P.recallAt = now;
  if (ROOMS[P.room].area === 'school' && !P.ch.qd.grad) { out(P, '{M}You click your heels together three times... and end up back in the Entrance Hall. You haven\'t finished school yet!{x} {D}(Once you graduate, RECALL takes you to Market Square in Baudby.){x}'); return teleport(P, W.START, `{M}${P.name} clicks their heels together and vanishes with a pop!{x}`, `{M}${P.name} appears with a pop!{x}`); }
  out(P, '{M}You click your heels together three times and think of home...{x}');
  teleport(P, W.TOWN, `{M}${P.name} clicks their heels together and vanishes with a pop!{x}`, `{M}${P.name} appears with a pop!{x}`);
});
C('talk greet chat speak', (P, a) => {
  const L = (ROOMS[P.room].npcs || []).map(id => NPCS[id]).filter(Boolean);
  const n = a ? findNpc(P, a.replace(/^(to|with)\s+/i, '')) : L.length === 1 ? L[0] : null;
  if (!n) { if (a && findPc(P, a)) return out(P, `Just SAY something and ${a} will hear it! Or TELL ${a} something privately.`); return out(P, L.length ? `Talk to who? Try ${L.map(x => '{W}TALK ' + x.kw[0].toUpperCase() + '{x}').join(' or ')}.` : 'There is nobody here to talk to. You talk to yourself for a bit. It is not a great conversation.'); }
  talk(P, n);
});
function talk(P, n) {
  const ch = P.ch;
  const pend = Object.keys(ch.q).map(id => QUEST[id]).filter(q => { const s2 = q && q.steps[ch.q[q.id].s]; return s2 && s2.k === 'talk' && s2.to === n.id && q.steps.slice(0, ch.q[q.id].s).every(() => true); });
  if (pend.length) {
    for (const q of pend) { const s2 = q.steps[ch.q[q.id].s]; out(P, `{Y}${cap1(n.short)} says, "${s2.say || (ch.mk['met.' + n.id] && n.again) || n.greet}"{x}`); }
    qEvent(P, 'talk', n.id); ch.mk['met.' + n.id] = 1;
    return;
  }
  qEvent(P, 'talk', n.id);
  if (n.on && n.on.talk) { const r = n.on.talk(api, P); if (r) return; }
  // a quest of theirs on the go?
  const mine = Object.keys(ch.q).map(id => QUEST[id]).filter(q => q && q.giver === n.id);
  const avail = qAvailable(P, n.id);
  let said = false;
  if (mine.length) { const q = mine[0], s = q.steps[ch.q[q.id].s]; out(P, `{Y}${cap1(n.short)} says, "${q.nag || 'How are you getting on?'}"{x}\n{D}[${q.n}] ${s ? s.hint : ''}{x}`); said = true; }
  else if (avail.length) { out(P, `{Y}${cap1(n.short)} says, "${n.greet}"{x}`); qStart(P, avail[0]); said = true; }
  else {
    const locked = QUESTS.find(q => q.giver === n.id && !ch.qd[q.id] && q.lv && ch.lv < q.lv);
    out(P, `{Y}${cap1(n.short)} says, "${(ch.mk['met.' + n.id] && n.again) || n.greet}"{x}`);
    if (locked) out(P, `{D}(${cap1(n.short)} might have a job for you when you're level ${locked.lv}.){x}`);
  }
  ch.mk['met.' + n.id] = 1;
  void said;
  const tops = Object.keys(n.topics || {}).map(k => k.split(',')[0]);
  if (tops.length) { P.lastNpc = n.id; out(P, `{D}Ask ${n.kw[0].toUpperCase()} about (type or click a word):{x} {W}${tops.map(t => t.toUpperCase()).join('{D}, {W}')}{x}`); }
  if (n.shop) out(P, `{D}This is a shop! Type {W}LIST{D} to see what's for sale, {W}BUY{D} something, or {W}SELL{D} your junk.{x}`);
  if (n.bank) out(P, '{D}Banking: {W}BALANCE{D}, {W}DEPOSIT 50{D}, {W}WITHDRAW 50{D} (or ALL). Rupees: {W}EXCHANGE{D}.{x}');
  if (n.healer) out(P, '{D}Type {W}HEAL{D} to be made all better.{x}');
}
C('ask', (P, a) => {
  const m = /^(\S+)\s+(?:about\s+)?(.+)$/i.exec(a); if (!m) return out(P, 'Ask who about what? Like this: {W}ASK PING ABOUT TEMPLE{x}');
  const n = findNpc(P, m[1]); if (!n) return out(P, `There's nobody called "${vis(m[1])}" here to ask.`);
  const t = m[2].toLowerCase().trim(); const tp = n.topics || {};
  const k = Object.keys(tp).find(x => x.split(',').some(w => w.trim() === t || (t.length > 2 && w.trim().startsWith(t)) || t.includes(w.trim())));
  qEvent(P, 'ask', n.id + ':' + (k ? k.split(',')[0] : t));
  if (!k) return out(P, `{Y}${cap1(n.short)} says, "${n.dunno || "Hmm, I don't know much about that."}"{x}${Object.keys(tp).length ? `\n{D}(${cap1(n.kw[0])} knows about: ${Object.keys(tp).map(x => x.split(',')[0]).join(', ')}){x}` : ''}`);
  const ans = tp[k]; out(P, `{Y}${cap1(n.short)} says, "${typeof ans === 'function' ? ans(api, P) : ans}"{x}`);
});
// shops
function shopkeeper(P) { const id = (ROOMS[P.room].npcs || []).find(x => NPCS[x] && NPCS[x].shop); return id ? NPCS[id] : null; }
const priceOf = (n, it) => Math.max(1, Math.round(it.value * (n.shop.mark || 1)));
C('list wares shop', P => {
  const n = shopkeeper(P); if (!n) return out(P, "There's no shop here. (Baudby's best shops are on Harbour Road, south of Market Square. The inn and the Academy tuck shop sell things too.)");
  const L = n.shop.sells.map(id => ITEMS[id]).filter(Boolean).map(it => `  {Y}${String(priceOf(n, it)).padStart(5)}g{x}  ${pad(it.short, 34)} {D}${itemStats(it).replace(/\n\s*\{D\}\(|\)\{x\}$/g, '').replace(/, worth about \d+ gold|worth about \d+ gold/, '')}{x}`);
  out(P, `{C}${n.shop.n || cap1(n.short) + "'s shop"}{x}\n${L.join('\n')}\n{D}Type BUY and the name (like {W}BUY ${(ITEMS[n.shop.sells[0]] || { kw: ['it'] }).kw[0].toUpperCase()}{D}), or BUY 3 of something. You have {Y}${fmt(P.ch.gold)}{D} gold.{x}`);
});
C('buy purchase', (P, a) => {
  const n = shopkeeper(P); if (!n) return out(P, 'There is nothing to buy here.');
  const m = /^(\d+)\s+(.+)$/.exec(a); const qty = m ? clamp(+m[1], 1, 10) : 1, w = (m ? m[2] : a).trim();
  if (!w) return out(P, 'Buy what? Type {W}LIST{x} to see.');
  const id = findIn(n.shop.sells, w, itemKws); if (!id) return out(P, `{Y}${cap1(n.short)} says, "Sorry, I don't sell that. Have a look at my LIST."{x}`);
  const it = ITEMS[id], cost = priceOf(n, it) * qty, ch = P.ch;
  if (it.lv && ch.lv < it.lv) return out(P, `{Y}${cap1(n.short)} says, "That's a bit advanced for you. Come back at level ${it.lv}!"{x}`);
  if (ch.gold < cost) return out(P, `{Y}${cap1(n.short)} says, "That's ${cost} gold, and you've only got ${ch.gold}. Go and bonk some monsters!"{x}`);
  if (ch.inv.length + qty > MAXINV) return out(P, "You haven't got room in your bag!");
  ch.gold -= cost; for (let i = 0; i < qty; i++) ch.inv.push(id);
  out(P, `You buy ${qty > 1 ? qty + ' x ' : ''}${it.short} for {Y}${cost} gold{x}.${n.shop.thanks ? ` {Y}${cap1(n.short)} says, "${pick(n.shop.thanks)}"{x}` : ''}`);
  if (it.type === 'weapon' || it.slot) out(P, `{D}(Type {W}${it.type === 'weapon' ? 'WIELD' : 'WEAR'} ${it.kw[0].toUpperCase()}{D} to use it.){x}`);
  qEvent(P, 'have', id); saveP(P);
});
C('sell', (P, a) => {
  const n = shopkeeper(P); if (!n) return out(P, 'There is nobody here to sell to.');
  const ch = P.ch, all = /^all$/i.test(a);
  const L = all ? ch.inv.filter(id => ITEMS[id].type === 'junk' || ITEMS[id].type === 'treasure') : [findInv(ch, a)].filter(Boolean);
  if (!L.length) return out(P, all ? 'You have no junk or treasure to sell. (SELL ALL only sells junk and treasure.)' : a ? `You aren't carrying any "${vis(a)}".` : 'Sell what?');
  let tot = 0;
  for (const id of L) { const it = ITEMS[id]; if (it.quest || it.nodrop || !it.value) { out(P, `${cap1(n.short)} doesn't want ${it.short}.`); continue; } const p = Math.max(1, Math.floor(it.value * 0.4)); takeItem(ch, id, 1); ch.gold = Math.min(MAXGOLD, ch.gold + p); tot += p; out(P, `You sell ${it.short} for ${p} gold.`); }
  if (tot && L.length > 1) out(P, `{Y}That's ${tot} gold altogether.{x}`);
  saveP(P);
});
C('value appraise', (P, a) => { const n = shopkeeper(P); if (!n) return out(P, 'There is nobody here to ask.'); const id = findInv(P.ch, a); if (!id) return out(P, 'Value what?'); const it = ITEMS[id]; out(P, it.value && !it.quest ? `{Y}${cap1(n.short)} says, "I'd give you ${Math.max(1, Math.floor(it.value * 0.4))} gold for ${it.short}."{x}` : `{Y}${cap1(n.short)} says, "I wouldn't know what to do with that."{x}`); });
// the bank
function banker(P) { const id = (ROOMS[P.room].npcs || []).find(x => NPCS[x] && NPCS[x].bank); return id ? NPCS[id] : null; }
C('balance bank', P => { if (!banker(P)) return out(P, 'You need to be at the Baudby Bank (east of Market Square).'); out(P, `{Y}Mr Penny peers over his half-moon specs. "You have ${fmt(P.ch.bank)} gold in your account, and ${fmt(P.ch.gold)} in your pockets."{x}`); });
C('deposit', (P, a) => {
  if (!banker(P)) return out(P, 'You need to be at the bank.'); const ch = P.ch; const g = /^all$/i.test(a) ? ch.gold : Math.floor(+String(a).replace(/\D/g, ''));
  if (!(g > 0)) return out(P, 'Deposit how much? Like this: {W}DEPOSIT 50{x} or {W}DEPOSIT ALL{x}'); if (g > ch.gold) return out(P, `You only have ${ch.gold} gold on you.`);
  ch.gold -= g; ch.bank = Math.min(MAXGOLD, ch.bank + g); out(P, `{Y}You deposit ${fmt(g)} gold. Mr Penny counts it twice and stamps your book. Balance: ${fmt(ch.bank)}.{x}`); saveP(P);
});
C('withdraw', (P, a) => {
  if (!banker(P)) return out(P, 'You need to be at the bank.'); const ch = P.ch; const g = /^all$/i.test(a) ? ch.bank : Math.floor(+String(a).replace(/\D/g, ''));
  if (!(g > 0)) return out(P, 'Withdraw how much? Like this: {W}WITHDRAW 50{x}'); if (g > ch.bank) return out(P, `You only have ${ch.bank} gold in the bank.`);
  ch.bank -= g; ch.gold = Math.min(MAXGOLD, ch.gold + g); out(P, `{Y}Mr Penny slides ${fmt(g)} gold across the counter. "Don't spend it all on Fizz Pop."{x}`); saveP(P);
});
C('exchange swap rupees', (P, a) => {
  if (!banker(P)) return out(P, 'The Rupee Exchange desk is in the Baudby Bank, east of Market Square.');
  const ch = P.ch, arg = a.toLowerCase().trim();
  if (!arg) return out(P, `{C}══ THE RUPEE EXCHANGE ══{x}\n  {W}EXCHANGE GOLD{x}      ${SWAP_GOLD} gold coins -> {Y}1 Rupee{x} (up to ${EARN_ADD.mdswap.cap} times a day)\n  {W}EXCHANGE RUPEES 3{x}  1 Rupee -> {Y}${BUY_GOLD} gold coins{x} each (up to ${BUY_MAX_DAY} Rupees a day)\n{D}Rupees are JackNet's money: they live in your JackNet Bank account, outside the game. Members only.{x}`);
  if (P.guest) return out(P, '{Y}Mr Penny says, "Rupees are for JackNet members only, I\'m afraid. Joining is free!"{x}');
  const a2 = E.acctByKey(memKey(P)); if (!a2) return out(P, '{Y}Mr Penny says, "Hmm, I can\'t find your JackNet Bank account. Try again in a moment."{x}');
  if (/^gold/.test(arg)) {
    const use = ch.gold >= SWAP_GOLD ? 'gold' : ch.bank >= SWAP_GOLD ? 'bank' : null;
    if (!use) return out(P, `{Y}Mr Penny says, "That's ${SWAP_GOLD} gold for a Rupee, and you haven't got ${SWAP_GOLD}."{x}`);
    const got = E.earnA(a2, 'mdswap', `JackMUD Rupee Exchange: ${SWAP_GOLD} gold`, 1);
    if (got === -1) return out(P, 'Mr Penny is still counting the last lot. One moment!');
    if (got <= 0) return out(P, `{Y}Mr Penny says, "That's your ${EARN_ADD.mdswap.cap} for today. The Exchange only takes so much gold a day. Come back tomorrow!"{x}`);
    if (use === 'gold') ch.gold -= SWAP_GOLD; else ch.bank -= SWAP_GOLD;
    out(P, `{Y}Mr Penny weighs your ${SWAP_GOLD} gold coins, nods, and taps it into his big beige computer. Beep boop. {W}+1 Rupee{Y} to your JackNet Bank!{x}`); saveP(P); return;
  }
  const m = /^rupees?\s*(\d+)?$/.exec(arg);
  if (m) {
    const n = Math.floor(+(m[1] || 1)), day = E.uk().day; if (ch.buy.day !== day) ch.buy = { day, n: 0 };
    if (!(n >= 1)) return out(P, 'Type {W}EXCHANGE RUPEES 3{x} to swap 3 Rupees for gold.');
    if (ch.buy.n + n > BUY_MAX_DAY) return out(P, `{Y}Mr Penny says, "That's ${BUY_MAX_DAY} Rupees a day at most. ${BUY_MAX_DAY - ch.buy.n} left today."{x}`);
    if (!E.debit(a2, n, 'mdgold', `JackMUD: bought ${n * BUY_GOLD} gold`)) return out(P, `{Y}Mr Penny says, "You need ${plural(n, 'Rupee')} in your JackNet Bank account for that, and you've got ${a2.bal}."{x}`);
    ch.buy.n += n; ch.gold = Math.min(MAXGOLD, ch.gold + n * BUY_GOLD); E.meToAll(a2);
    out(P, `{Y}Mr Penny takes ${plural(n, 'Rupee')} and counts out ${n * BUY_GOLD} shiny gold coins. "Pleasure doing business!"{x}`); saveP(P); return;
  }
  out(P, 'Type {W}EXCHANGE{x} to see how it works.');
});
C('heal cure', P => {
  const n = (ROOMS[P.room].npcs || []).map(id => NPCS[id]).find(x => x && x.healer);
  if (!n) return out(P, 'You need a healer. Sister Ping at the Temple of Saint Reboot heals people. (Or REST, or eat something.)');
  const ch = P.ch, cost = ch.lv <= 5 ? 0 : ch.lv * 4;
  if (ch.hp >= maxHp(ch) && ch.mp >= maxMp(ch)) return out(P, `{Y}${cap1(n.short)} says, "You look perfectly well to me, dear!"{x}`);
  if (ch.gold < cost) return out(P, `{Y}${cap1(n.short)} says, "A donation of ${cost} gold for the temple roof, please. Oh, you haven't got it? Then sit and REST a while, it's free."{x}`);
  ch.gold -= cost; ch.hp = maxHp(ch); ch.mp = maxMp(ch);
  out(P, `{G}${cap1(n.short)} hums a little tune and waves a glowing hand over you. You feel completely better!{x}${cost ? ` {D}(${cost} gold donation){x}` : ' {D}(Free for adventurers up to level 5!){x}'}`);
});
// groups
function partyHere(P) { return P.party ? [...P.party.mem].filter(Q => Q.room === P.room && Q.state === 'play') : [P]; }
function partyLeave(P, quiet) {
  const pt = P.party; if (!pt) return; pt.mem.delete(P); P.party = null;
  for (const Q of pt.mem) out(Q, `{G}[PARTY] ${P.name} has left the party.{x}`);
  if (pt.mem.size === 1) { const Q = [...pt.mem][0]; Q.party = null; out(Q, '{G}[PARTY] The party is over (it was just you).{x}'); }
  else if (pt.lead === P && pt.mem.size) { pt.lead = [...pt.mem][0]; for (const Q of pt.mem) out(Q, `{G}[PARTY] ${pt.lead.name} is the leader now.{x}`); }
  if (!quiet) out(P, 'You leave the party.');
}
C('party group team', (P, a) => {
  const [sub, ...rest] = a.trim().split(/\s+/); const arg = rest.join(' '); const s = (sub || '').toLowerCase();
  if (!s || s === 'list') { if (!P.party) return out(P, `You're not in a party. {W}PARTY INVITE <name>{x} to start one! Friends in a party share experience and can see each other's health.`); return out(P, `{G}Your party:{x}\n${[...P.party.mem].map(Q => `  ${Q === P.party.lead ? '{Y}*{x}' : ' '} {c}${pad(Q.name, 16)}{x} lv ${Q.ch.lv} ${CL(Q.ch.cls).n}  HP ${Q.ch.hp}/${maxHp(Q.ch)}  {D}${ROOMS[Q.room].n}{x}`).join('\n')}\n{D}PS <message> talks to your party. PARTY LEAVE to leave.{x}`); }
  if (s === 'invite' || s === 'add') {
    const Q = findPc(P, arg, true); if (!Q) return out(P, 'Invite who? They need to be playing. (Type WHO.)');
    if (Q.party) return out(P, `${Q.name} is already in a party.`);
    if (P.party && P.party.mem.size >= 6) return out(P, 'Your party is full (6 is plenty).');
    Q.invite = P; out(P, `You invite ${Q.name} to your party.`); out(Q, `{G}${P.name} invites you to join their party! Type {W}PARTY JOIN{G} to say yes.{x}`); return;
  }
  if (s === 'join' || s === 'accept' || s === 'yes') {
    const L = P.invite; if (!L || L.gone) return out(P, 'Nobody has invited you to a party.');
    if (P.party) partyLeave(P, true);
    if (!L.party) { L.party = { lead: L, mem: new Set([L]) }; }
    if (L.party.mem.size >= 6) return out(P, 'That party is full.');
    L.party.mem.add(P); P.party = L.party; P.invite = null;
    for (const Q of P.party.mem) { out(Q, `{G}[PARTY] ${P.name} has joined the party!{x}`); secret(Q, 'md.party'); }
    return;
  }
  if (s === 'leave' || s === 'quit') { if (!P.party) return out(P, "You're not in a party."); return partyLeave(P); }
  if (s === 'kick') { if (!P.party || P.party.lead !== P) return out(P, 'Only the party leader can do that.'); const Q = [...P.party.mem].find(x => x.name.toLowerCase().startsWith(arg.toLowerCase()) && x !== P); if (!Q) return out(P, 'Kick who?'); out(Q, '{G}You have been removed from the party.{x}'); partyLeave(Q, true); return; }
  out(P, 'Party commands: {W}PARTY{x}, {W}PARTY INVITE name{x}, {W}PARTY JOIN{x}, {W}PARTY LEAVE{x}, {W}PS message{x}');
});
C('ps gtell partysay', (P, a) => { if (!P.party) return out(P, "You're not in a party."); const t = vis(ctx.delink(ctx.clean(a, 200))); if (!t) return; for (const Q of P.party.mem) out(Q, `{G}[PARTY] ${Q === P ? 'You say' : P.name + ' says'}, "${t}"{x}`); });
C('follow', (P, a) => {
  if (!a || /^(me|self|nobody|stop)$/i.test(a)) { if (P.follow) out(P, `You stop following ${P.follow.name}.`); P.follow = null; return; }
  const Q = findPc(P, a); if (!Q) return out(P, 'Follow who? They need to be in the same room.');
  P.follow = Q; out(P, `You start following ${Q.name}. {D}(FOLLOW STOP to stop.){x}`); out(Q, `{c}${P.name} is following you.{x}`);
});
C('unfollow', P => { if (P.follow) out(P, `You stop following ${P.follow.name}.`); P.follow = null; });
// searching and room actions
C('search hunt', P => {
  const R = ROOMS[P.room], ch = P.ch;
  const A = W.ACT[P.room]; if (A && A.search && A.search(api, P)) return;
  const hid = Object.keys(R.hid || {}).find(d => !ch.sx[R.id + '.' + d]);
  if (hid) { ch.sx[R.id + '.' + hid] = 1; P.mapRoom = null; out(P, `{G}${(R.hidMsg && R.hidMsg[hid]) || 'You poke about and find a hidden way ' + DIRS[hid] + '!'}{x}`); toRoom(P.room, `${P.name} finds a secret way ${DIRS[hid]}!`, P); if (R.hidSecret) secret(P, R.hidSecret); return; }
  out(P, pick(['You search everywhere. You find some fluff.', 'You look under everything. Nothing but dust bunnies.', 'You search carefully but find nothing new.']));
});
for (const v of W.VERBS) if (!CMD[v]) C(v, (P, a, verb) => { const A = W.ACT[P.room]; if (A && A[verb]) { const r = A[verb](api, P, a); if (r !== false) return; } out(P, W.VERBMISS[verb] || `You can't ${verb} anything here.`); }, { act: 1 });
// settings
C('colour color ansi', (P, a) => { const ch = P.ch, on = /^(on|yes|1)$/i.test(a) ? 1 : /^(off|no|0)$/i.test(a) ? 0 : ch.pref.ansi ? 0 : 1; ch.pref.ansi = on; out(P, on ? '{G}C{Y}o{R}l{M}o{C}u{B}r{x} is {W}ON{x}. Lovely.' : 'Colour is OFF. Very serious.'); });
C('brief', (P, a) => { const ch = P.ch; ch.pref.brief = /^on$/i.test(a) ? 1 : /^off$/i.test(a) ? 0 : ch.pref.brief ? 0 : 1; out(P, ch.pref.brief ? 'Brief mode ON: you only see room names and exits. (LOOK shows the whole room.)' : 'Brief mode OFF: you see the full room descriptions.'); });
C('tips', (P, a) => { const ch = P.ch; ch.pref.tips = /^on$/i.test(a) ? 1 : /^off$/i.test(a) ? 0 : ch.pref.tips ? 0 : 1; out(P, ch.pref.tips ? 'Tips are ON.' : 'Tips are OFF. You are on your own now. Good luck!'); });
C('title titles', (P, a) => {
  const ch = P.ch; if (!ch.titles.length) return out(P, "You haven't earned any titles yet. Finish quests and beat bosses to get them!");
  if (!a) return out(P, `{C}Your titles:{x} ${ch.titles.map((t, i) => `{W}${i + 1}{x}. ${t}`).join('  ')}\n{D}Type TITLE and a number to wear one, or TITLE NONE.{x} Wearing: ${ch.title || '(nothing)'}`);
  if (/^none$/i.test(a)) { ch.title = ''; return out(P, 'You take off your title.'); }
  const t = ch.titles[+a - 1] || ch.titles.find(x => x.toLowerCase().includes(a.toLowerCase()));
  if (!t) return out(P, "You haven't earned that one."); ch.title = t; out(P, `You are now ${ch.n} ${t}!`);
});
C('save', P => { if (P.guest) return out(P, '{Y}Guests can\'t be saved, sorry! Join JackNet (free) and your character will be kept forever.{x}'); saveP(P); out(P, '{G}Saved! (JackMUD also saves you automatically all the time.){x}'); });
C('quit logout bye exit qui', (P, a, verb) => { if (verb === 'qui') return out(P, 'If you want to QUIT, type the whole word.'); if (P.fight) return out(P, "You can't quit in the middle of a fight! FLEE first."); hangup(P, 'quit'); });
C('news motd', P => out(P, W.NEWS));
C('xyzzy plugh', (P, a, v) => { out(P, v === 'xyzzy' ? '{G}A hollow voice says, "Nice try. Wrong game." Somewhere, Gubbinz giggles.{x}' : '{G}A hollow voice says, "Wrong game AGAIN." You hear a modem screech in the distance.{x}'); if (v === 'xyzzy') secret(P, 'md.xyzzy'); }, { wiz: 0 });
C('commands', P => help(P, 'commands'));
// Jack's own wizard commands (the Implementor)
const WIZ = P => !P.guest && memKey(P) === 'jack';
C('goto', (P, a) => { if (!WIZ(P)) return huh(P, 'goto'); const id = own(ROOMS, a) ? a : Object.keys(ROOMS).find(k => ROOMS[k].n.toLowerCase().includes(a.toLowerCase())); const Q = !id && findPc(P, a, true); const to = id || (Q && Q.room); if (!to) return out(P, 'No such room.'); teleport(P, to, `${P.name} vanishes in a puff of code.`, `${P.name} appears in a puff of code.`); }, { wiz: 1 });
C('wecho', (P, a) => { if (!WIZ(P)) return huh(P, 'wecho'); toAll('{M}' + vis(ctx.clean(a, 200)) + '{x}'); }, { wiz: 1 });
C('restore', (P, a) => { if (!WIZ(P)) return huh(P, 'restore'); const Q = a ? findPc(P, a, true) : P; if (!Q) return out(P, 'Who?'); api.heal(Q); out(Q, '{G}A warm glow from the sky makes you feel completely better.{x}'); }, { wiz: 1 });
C('advance', (P, a) => { if (!WIZ(P)) return huh(P, 'advance'); const n = clamp(+a | 0, 1, MAXLV); P.ch.lv = n; P.ch.xp = 0; api.heal(P); out(P, `You are now level ${n}.`); }, { wiz: 1 });
C('wgive', (P, a) => { if (!WIZ(P)) return huh(P, 'wgive'); if (!ITEMS[a]) return out(P, 'No such item.'); giveItem(P, a); }, { wiz: 1 });
C('wquest', (P, a) => { if (!WIZ(P)) return huh(P, 'wquest'); const [k, id] = a.split(' '); if (!QUEST[id]) return out(P, 'No such quest.'); if (k === 'done') { delete P.ch.q[id]; P.ch.qd[id] = Date.now(); } else if (k === 'reset') { delete P.ch.q[id]; delete P.ch.qd[id]; } else if (k === 'start') qStart(P, QUEST[id]); out(P, 'OK.'); }, { wiz: 1 });
C('wwipe', (P) => { if (!WIZ(P)) return huh(P, 'wwipe'); const ch = P.ch; ch.q = {}; ch.qd = {}; ch.fl = {}; ch.mk = {}; ch.sx = {}; ch.inv = CL(ch.cls).kit.slice(); ch.titles = []; ch.title = ''; out(P, 'Wiped.'); }, { wiz: 1 });
C('wflag', (P, a) => { if (!WIZ(P)) return huh(P, 'wflag'); api.flag(P, a, 1); out(P, 'OK.'); }, { wiz: 1 });
C('wgold', (P, a) => { if (!WIZ(P)) return huh(P, 'wgold'); P.ch.gold = clamp(+a | 0, 0, MAXGOLD); out(P, 'OK.'); }, { wiz: 1 });
C('boot', (P, a) => { if (!WIZ(P)) return huh(P, 'boot'); const Q = findPc(P, a, true); if (!Q || Q === P) return out(P, 'Who?'); out(Q, '{R}The Implementor has disconnected you. Be nice!{x}'); hangup(Q, 'kick'); out(P, 'Done.'); }, { wiz: 1 });

function huh(P, w) {
  const near = [];
  const L = Object.keys(CMD).filter(k => !CMD[k].o.wiz && k.length > 1);
  for (const k of L) { const d = lev(w, k); if (d <= (w.length > 4 ? 2 : 1)) near.push([d, k]); }
  near.sort((a, b) => a[0] - b[0]);
  out(P, `{R}Huh?{x} I don't know how to "${vis(w)}".${near.length ? ` Did you mean {W}${near[0][1].toUpperCase()}{x}?` : ''} {D}(Type {W}HELP{D} for the list of commands.){x}`);
}
function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function help(P, a) {
  a = String(a || '').toLowerCase().trim();
  const H = W.HELP;
  if (!a) return out(P, Array.isArray(H.index) ? boxP(P, 'JACKMUD HELP          {D}type HELP and a word, like {W}HELP FIGHTING{x}', H.index, 74) + '\n' + (H.indexFoot || '') : H.index);
  const k = Object.keys(H).find(x => x.split(',').some(w => w === a)) || Object.keys(H).find(x => x.split(',').some(w => w.startsWith(a)));
  if (k && k !== 'index') return out(P, H[k]);
  if (CMD[a]) return out(P, `{W}${a.toUpperCase()}{x} is a command! Just type it. {D}(HELP on its own shows the full list.){x}`);
  out(P, `There's no help on "${vis(a)}". Try {W}HELP{x} for the list of topics.`);
}
function exec(P, line) {
  line = String(line || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 240);
  if (!line) { if (P.state === 'play') return out(P, ''); return; }
  if (P.state !== 'play') return creation(P, line);
  if (line === '!' && P.last) line = P.last; else P.last = line;
  let verb, rest;
  if (/^['":]/.test(line)) { verb = line[0]; rest = line.slice(1).trim(); } else { const m = /^(\S+)\s*(.*)$/.exec(line); verb = m[1].toLowerCase(); rest = m[2]; }
  let c = CMD[verb], used = verb;
  if (!c && verb.length >= 2) { const k = ORDER.find(x => x.startsWith(verb) && !CMD[x].o.wiz) || Object.keys(CMD).find(x => x.startsWith(verb) && !CMD[x].o.wiz); if (k) { c = CMD[k]; used = k; } }
  if (!c) {
    const A = W.ACT[P.room]; if (A && A[verb]) { const r = A[verb](api, P, rest); if (r !== false) return; }
    // straight after TALKing to someone, a bare word asks them about it ("pixel" = ASK GRANNY ABOUT PIXEL)
    const n = P.lastNpc && (ROOMS[P.room].npcs || []).includes(P.lastNpc) && NPCS[P.lastNpc];
    if (n && n.topics) { const t = line.toLowerCase(); if (Object.keys(n.topics).some(k => k.split(',').some(w => w.trim() === t || (t.length > 2 && w.trim().startsWith(t))))) return CMD.ask.fn(P, n.kw[0] + ' about ' + t, 'ask'); }
    return huh(P, verb);
  }
  const AV = W.ACT[P.room];
  if (AV && typeof AV[verb] === 'function' && !/^(get|use|search|gate|arrive|extra|say)$/.test(verb)) { try { if (AV[verb](api, P, rest)) return; } catch (e) { console.error('md act', verb, e); } }
  try { c.fn(P, rest, used); } catch (e) { console.error('md cmd', verb, e); out(P, '{R}Something went a bit wrong there. (A gremlin got in the works.){x}'); }
  ctx.markDirty();
}

// ---------------------------------------------------------------- connecting and making a character
function banner(P) {
  out(P, narrow(P) ? W.BANNER_SMALL : W.BANNER);
  const n = playing().length;
  out(P, `{D}Connected to mud.jacknet.jnet port 4000. JackMUD v1.99 (DikuJack 2.3), up since the last power cut.{x}\n{W}${n ? plural(n, 'adventurer') + ' playing right now.' : 'Nobody else is playing right now. You can have the place to yourself!'}{x}\n`);
}
function creation(P, line) {
  const t = line.toLowerCase().trim();
  if (P.state === 'class') {
    const keys = Object.keys(CLASSES), i = /^\d$/.test(t) ? +t - 1 : keys.findIndex(k => k.startsWith(t) || CLASSES[k].n.toLowerCase().startsWith(t));
    if (i < 0 || !keys[i]) return out(P, 'Just type a number from 1 to 4, or a class name like {W}WIZARD{x}.');
    P.pick = keys[i]; P.state = 'confirm';
    const C2 = CLASSES[P.pick];
    return out(P, `\n{${C2.col}}${(C2.art || []).join('\n')}{x}\n{W}A ${C2.n}!{x} ${C2.d}\n{D}Type {W}YES{D} to start, or {W}NO{D} to choose again.{x}`);
  }
  if (P.state === 'confirm') {
    if (/^n/.test(t)) { P.state = 'class'; return classMenu(P); }
    if (!/^y/.test(t)) return out(P, 'Type {W}YES{x} or {W}NO{x}.');
    P.ch = newChar(P.name, P.pick); P.ch.room = W.START;
    if (!P.guest) { D.p[memKey(P)] = P.ch; ctx.markDirty(); }
    out(P, `\n{G}Welcome to JackMUD, ${P.name} the ${CL(P.pick).n}!{x}\n{W}You blink, and find yourself somewhere new...{x}\n`);
    secret(P, 'md.born');
    enterWorld(P, false);
    qStart(P, QUEST.grad);
    out(P, `\n{M}TIP:{x} You're in the {W}Adventurers' Academy{x}, where new heroes learn the ropes. Type {W}LOOK{x} to look around, then follow the signs. Type {W}HELP{x} whenever you're stuck!`);
    return;
  }
  if (P.state === 'adopt') {
    if (/^y/.test(t)) { D.p[memKey(P)] = P.ch; P.ch.n = P.name; ctx.markDirty(); out(P, `{G}Done! Your adventure is now saved on your JackNet membership, ${P.name}. Welcome to the club!{x}`); P.state = 'play'; enterWorld(P, true); return; }
    if (/^n/.test(t)) { P.ch = null; P.state = 'class'; out(P, 'OK, a fresh start then!'); return classMenu(P); }
    return out(P, 'Type {W}YES{x} or {W}NO{x}.');
  }
}
function classMenu(P) {
  const L = Object.values(CLASSES).map((C2, i) => narrow(P) ? `  {Y}${i + 1}{x}. {W}${C2.n.toUpperCase()}{x}\n     {${C2.col}}${C2.short}{x}` : `  {Y}${i + 1}{x}. {W}${pad(C2.n.toUpperCase(), 8)}{x} {${C2.col}}${C2.short}{x}`);
  out(P, `\n{C}Every adventurer needs a job! Which will you be?{x}\n${L.join('\n')}\n{D}Type the number or the name (or click one). Don't worry: every class can finish every quest.{x}`);
}
function open(ws, c, m) {
  const key = keyOfC(c); if (!key) return;
  const via = /^(tel|dos|web|app)$/.test(m.via) ? m.via : 'tel', cols = clamp(+m.cols | 0 || 80, 30, 200);
  let P = S.get(key);
  if (P && !P.gone) {
    const old = P.ws;
    P.ws = ws; P.c = c; P.via = via; P.cols = cols;
    if (old && old !== ws && !P.ld) ctx.send(old, { t: 'mdEnd', why: 'Another window took over your character.' });
    const was = P.ld; P.ld = 0;
    out(P, `{G}*** Reconnected. ${was ? 'You wake up with a start. Where was I?' : 'You take over your character.'}{x}`);
    if (P.state === 'play') { if (was) toRoom(P.room, `{c}${P.name} wakes up with a start.{x}`, P); look(P); } else if (P.state === 'class') classMenu(P);
    secret(P, 'md.connect'); if (via === 'dos') secret(P, 'md.dos'); if (via === 'web') secret(P, 'md.web');
    return;
  }
  P = { key, name: c.member || c.nick || 'Guest', guest: !c.member, ws, c, via, cols, room: null, ch: null, state: 'class', buf: '', fl: false, fight: null, pos: 'stand', party: null, follow: null, ld: 0, cd: {}, fx: { block: 0 },
    rl: { cmd: new ctx.Bucket(4, 12), shout: new ctx.Bucket(0.12, 2), tell: new ctx.Bucket(0.6, 4) }, gone: false, lastTell: '', mapRoom: null };
  S.set(key, P);
  banner(P);
  secret(P, 'md.connect'); if (via === 'dos') secret(P, 'md.dos'); if (via === 'web') secret(P, 'md.web');
  if (!P.guest) {
    const saved = D.p[memKey(P)];
    if (saved && typeof saved === 'object') { P.ch = fixChar(saved); P.ch.n = P.name; out(P, `{G}Welcome back, ${P.name}!{x} {D}(Level ${P.ch.lv} ${CL(P.ch.cls).n}. Your character was saved ${ago(P.ch.last)}.){x}\n`); enterWorld(P, false); return; }
    out(P, `{G}Hello, ${P.name}!{x} You're a JackNet member, so your JackMUD character will be {W}saved{x} and waiting for you every time you come back.`);
  } else {
    out(P, `{Y}You're not logged on to JackNet, so you'll play as a visitor: {W}${P.name}{Y}.{x}\n{D}(Your adventure will be forgotten when you leave. Join JackNet for free from the Start menu and it's saved forever, with Rupees for quests!){x}`);
  }
  classMenu(P);
}
const ago = ts => { const s = (Date.now() - (ts || Date.now())) / 1000; return s < 120 ? 'just now' : s < 7200 ? Math.round(s / 60) + ' minutes ago' : s < 172800 ? Math.round(s / 3600) + ' hours ago' : Math.round(s / 86400) + ' days ago'; };
function hangup(P, why) {
  const ws = P.ws;
  if (why === 'quit') out(P, P.guest ? `{G}Thanks for playing JackMUD, ${P.name}! Come back soon.{x}\n{D}(Guest characters aren't saved. Join JackNet for free and your next one will be!){x}` : `{G}Your character has been saved. Thanks for playing JackMUD, ${P.name}! Come back soon.{x}`);
  flush(P);
  leaveWorld(P, why);
  if (ws) ctx.send(ws, { t: 'mdEnd', why: why === 'quit' ? 'Connection closed by foreign host.' : why === 'kick' ? 'Disconnected by the Implementor.' : 'Connection to host lost.' });
}

// ---------------------------------------------------------------- the web site's bits
function whoList() { return playing().map(P => ({ n: P.name, lv: P.ch.lv, c: CL(P.ch.cls).n, t: P.ch.title || '', a: (W.AREAS[ROOMS[P.room].area] || {}).n || '', g: P.guest ? 1 : 0, v: P.via })); }
let topCache = null, topAt = 0;
function topList() {
  if (topCache && Date.now() - topAt < 30000) return topCache;
  topCache = Object.entries(D.p).filter(([k, ch]) => ch && ch.n && ctx.state.members[k]).map(([, ch]) => ({ n: ch.n, lv: ch.lv | 0, c: CL(ch.cls).n, q: Object.keys(ch.qd || {}).filter(k => QUEST[k]).length, k: ch.kills | 0, t: ch.title || '', xp: ch.xp | 0 }))
    .sort((a, b) => b.lv - a.lv || b.xp - a.xp || b.q - a.q).slice(0, 20).map(x => { delete x.xp; return x; });
  topAt = Date.now();
  return topCache;
}

function handle(ws, c, m) {
  if (!c.mdB) c.mdB = new ctx.Bucket(6, 20);
  if (!c.mdB.take()) { if (m.t === 'mdIn') { const P = S.get(keyOfC(c)); if (P && !P.slow) { P.slow = 1; setTimeout(() => { P.slow = 0; }, 3000); out(P, '{R}Whoa, slow down! JackMUD runs on a 486. Type a bit slower.{x}'); } } return; }
  switch (m.t) {
    case 'mdOpen': return open(ws, c, m);
    case 'mdIn': {
      const P = S.get(keyOfC(c)); if (!P || P.gone) return ctx.send(ws, { t: 'mdEnd', why: 'Not connected.' });
      if (P.ws !== ws) { P.ws = ws; P.c = c; }
      if (P.ld) { P.ld = 0; }
      if (!P.rl.cmd.take()) { if (!P.slow) { P.slow = 1; setTimeout(() => { P.slow = 0; }, 2000); out(P, '{R}Slow down! One thing at a time.{x}'); } return; }
      return exec(P, typeof m.s === 'string' ? m.s : '');
    }
    case 'mdCols': { const P = S.get(keyOfC(c)); if (P && P.ws === ws) P.cols = clamp(+m.cols | 0 || 80, 30, 200); return; }
    case 'mdClose': { const P = S.get(keyOfC(c)); if (P && P.ws === ws) hangup(P, 'quit'); return; }
    case 'mdWho': return ctx.send(ws, { t: 'mdWho', list: whoList() });
    case 'mdTop': return ctx.send(ws, { t: 'mdTop', list: topList(), rooms: Object.keys(ROOMS).length, quests: QUESTS.length });
  }
}

module.exports = {
  name: 'md',
  types: ['mdOpen', 'mdIn', 'mdClose', 'mdCols', 'mdWho', 'mdTop'],
  init(x) {
    ctx = x; D = x.data;
    D.v = 1; D.p = D.p && typeof D.p === 'object' ? D.p : {};
    for (const k of Object.keys(D.p)) if (BADKEY.test(k)) delete D.p[k];
    E = ECON.api; if (!E || !E.earnA) { console.error('md: econ is missing'); return; }
    for (const k in EARN_ADD) if (!ECAT.EARN[k]) ECAT.EARN[k] = EARN_ADD[k];
    coords(); initWorld(); lootAugment();
    setInterval(tick, 1000);
    x.on('close', c => { for (const P of S.values()) if (P.c === c) { P.ld = Date.now(); P.ws = null; if (P.state === 'play') toRoom(P.room, `{D}${P.name} has gone very still. (Their connection dropped.){x}`, P); } });
    x.on('login', c => { // a guest who joins JackNet mid-adventure can keep their character
      for (const P of S.values()) {
        if (!P.guest || P.c !== c || P.gone) continue;
        const k = String(c.member).toLowerCase(); if (BADKEY.test(k)) continue;
        if (P.state === 'play') { stopFight(P); rs(P.room).ppl.delete(P); for (const Q of playing()) if (Q.follow === P) Q.follow = null; partyLeave(P, true); }
        S.delete(P.key); P.key = 'm:' + k; P.guest = false; P.name = c.member;
        const old = S.get(P.key); if (old && old !== P) leaveWorld(old, 'quit');
        S.set(P.key, P);
        if (D.p[k]) { P.ch = fixChar(D.p[k]); P.ch.n = P.name; out(P, `{G}You're logged on to JackNet as ${P.name}! Loading your saved character...{x}`); enterWorld(P, true); }
        else if (P.ch) { P.state = 'adopt'; out(P, `{G}You've joined JackNet as ${P.name}! Do you want to keep the character you're playing now (level ${P.ch.lv} ${CL(P.ch.cls).n})?{x}`); }
        else { out(P, `{G}You're logged on as ${P.name}. Your character will be saved!{x}`); P.state = 'class'; classMenu(P); }
      }
    });
  },
  handle,
  _test: { get D() { return D; }, S, RS, ROOMS, exec, W, XPN, maxHp, playing },
};
