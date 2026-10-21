/* jw: JACKWORLD, the avatar chat world (client: public/js/jw*.js, catalogue: public/js/jw-cat.js). The server decides
 * everything: where people are (it plans every walk and knows where everybody is at any moment), what is in every room,
 * who may come in, what things cost and who wins the games. Browsers only ever say what they would like to do.
 * Money moves only through econ (debit for the Catalogue, earnA for games and visitors, credit for the Room of the Week
 * prize); furni is JackLoot (type 'furni', minted through mods/loot.js), so it trades on the Trading Post and JackBay.
 * Furni standing in a room is locked (lk 'jw') so it can't be traded or recycled until it is picked up again.
 *
 *   client -> { t:'jwMe' }                                  <- { t:'jwMe', member, av, room, st, rb, staff, wk, rare }
 *   client -> { t:'jwGo', r, av? }   (r: public id or a member room id 'm12')  <- jwRoom (everything in it) | jwWait | jwNo
 *   client -> { t:'jwOut' }   { t:'jwWalk', x, y }   { t:'jwSay', s, k:'say'|'shout'|'whisper', to }   { t:'jwEmo', e }
 *   room   <- jwIn { o } / jwOut { id } / jwMv { id, p:[[x,y]..], d } / jwSay { id, s, k } / jwEmo { id, e } / jwTp / jwAv
 *   client -> { t:'jwAv', av }   { t:'jwMake', n }   { t:'jwSet', n, ds, cat, lock }   { t:'jwStyle', k:'fl'|'wl'|'md', id }
 *   client -> { t:'jwBuy', id, n }   <- jwBought      { t:'jwPlace', u, x, y, r } / { t:'jwPlace', u, w:'L'|'R', x, z }   { t:'jwPick', u }
 *   client -> { t:'jwUse', u | i }   { t:'jwNav', tab, q } <- jwNav     { t:'jwLike', r }   { t:'jwGb', r } { t:'jwSign', r, s } { t:'jwGbDel', r, ts }
 *   client -> { t:'jwAnswer', id, ok }   { t:'jwKick', id }   { t:'jwKey', name, on }   { t:'jwReport', id, why }   { t:'jwInfo' }
 *   client -> { t:'jwGame', a:'start'|'join'|'make'|'throw', id, x, y }   room <- jwG { g } (the game's state) / jwBall / jwHit
 *   client -> { t:'jwStaff', a:'auth'|'reports'|'clear'|'mute'|'unmute'|'dismiss'|'unhide', ... }  (member "Jack" or ADMIN_TOKEN)
 * Data: state.mods.jw = { v, seq, rooms:{id: room}, own:{memberKey: roomId}, p:{memberKey: {av, st, rb, liked}}, reports, mutes,
 *   wk:{no, likes, vis}, rotw:[...], st } */
'use strict';
const path = require('path');
const crypto = require('crypto');
const C = require(path.join(__dirname, '..', 'public', 'js', 'jw-cat.js'));
const LCAT = require(path.join(__dirname, '..', 'public', 'js', 'loot-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const ECON = require('./econ.js');
C.augment(LCAT); // furni joins the JackLoot catalogue (the same module object mods/loot.js uses)

const EARN_ADD = {
  jwplay: { amt: 5, cap: 8, half: 4, gap: 45, drop: 0.05, label: 'Played a game in JackWorld' },
  jwwin: { amt: 20, cap: 3, drop: 0.15, label: 'Won a game in JackWorld' },
  jwhost: { amt: 3, cap: 6, gap: 20, drop: 0.03, label: 'Somebody visited your JackWorld room' },
  jwlike: { amt: 5, cap: 5, drop: 0.05, label: 'Somebody liked your JackWorld room' },
};
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const rnd = () => crypto.randomInt(0, 1e9) / 1e9;
const rint = (a, b) => crypto.randomInt(a, b + 1);
const pick = l => l[crypto.randomInt(0, l.length)];
const rp = n => `${Math.floor(n).toLocaleString('en-GB')} ${Math.floor(n) === 1 ? 'Rupee' : 'Rupees'}`;
const NEED = 'That is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!';
const STEP = C.STEP;
const EMOTES = new Set(['wave', 'dance', 'sit', 'jump', 'laugh', 'waaagh', 'cool', 'think', 'sleep', 'bounce', 'cry', 'love', 'stand']);
const LOCKS = ['open', 'bell', 'shut'];
const PADS = { 'furni.pub_pad_a': 0, 'furni.pub_pad_b': 1, 'furni.pub_pad_c': 2, 'furni.pub_pad_d': 3 };
let ctx, D, E;
const LA = () => { try { const L = require('./loot.js'); return L && L.api ? L.api : null; } catch (e) { return null; } };

// ================================================================ data (THE DATABASE IS SACRED: only ever add missing bits)
function initData() {
  D.v = D.v || 1; D.seq = D.seq | 0;
  for (const k of ['rooms', 'own', 'p', 'mutes', 'st']) if (!D[k] || typeof D[k] !== 'object' || Array.isArray(D[k])) D[k] = {};
  for (const k of ['reports', 'rotw']) if (!Array.isArray(D[k])) D[k] = [];
  if (!D.wk || typeof D.wk !== 'object') D.wk = { no: 0, likes: {}, vis: {} };
}
const keyOf = name => { const k = String(name || '').toLowerCase(); return k && !BADKEY.test(k) ? k : null; };
const keyOfC = c => (c && c.member ? keyOf(c.member) : null);
const memberName = key => { const m = ctx.state.members[key]; return m ? m.name : null; };
const today = () => E.uk().day;
const weekNo = () => C.week(today()).no;
const mdNow = () => C.md(today());
function P(key) {
  let p = D.p[key];
  if (!p || typeof p !== 'object') p = D.p[key] = {};
  if (!p.st || typeof p.st !== 'object') p.st = { fl: [], wl: [], md: [] };
  if (!p.rb || typeof p.rb !== 'object') p.rb = {};
  if (!p.liked || typeof p.liked !== 'object') p.liked = {};
  return p;
}
const isStaff = c => !!(c && ((c.member && c.member.toLowerCase() === 'jack') || c.jwStaff));
const err = (ws, msg) => ctx.send(ws, { t: 'jwErr', msg });

// ================================================================ rooms: definitions
const MODEL = {}; for (const [id, n, price, max, map, door] of C.MODELS) MODEL[id] = { id, n, price, max, map, door };
const FLOOR = {}; for (const [id, n, price, art] of C.FLOORS) FLOOR[id] = { id, n, price, art };
const WALL = {}; for (const [id, n, price, art] of C.WALLS) WALL[id] = { id, n, price, art };
const CATS = C.ROOM_CATS.map(x => x[0]);
const isPub = id => own(C.PUB, id);
function roomDef(id) { // { id, pub, map, W, H, spawn, fix (public furni with their places), R (member room data) }
  if (isPub(id)) { const P0 = C.PUB[id]; return { id, pub: true, map: P0.map, W: P0.map[0].length, H: P0.map.length, spawn: P0.spawn, P: P0 }; }
  const R = D.rooms[id]; if (!R) return null;
  const M = MODEL[R.md] || MODEL.box;
  return { id, pub: false, map: M.map, W: M.map[0].length, H: M.map.length, spawn: M.door, R, M };
}
function newRoom(key, name) {
  const id = 'm' + (++D.seq);
  D.rooms[id] = { id, o: key, on: memberName(key) || key, n: name, ds: '', cat: 'chill', md: 'box', fl: 'wood', wl: 'magnolia', lock: 'open', f: [], gb: [], likes: 0, made: Date.now(), vis: 0, keys: [], hid: 0 };
  D.own[key] = id; ctx.markDirty();
  return D.rooms[id];
}
const myRoom = key => (key && D.own[key] && D.rooms[D.own[key]] ? D.rooms[D.own[key]] : null);

// ================================================================ rooms: live (who's in them, the walking grid, games)
const LIVE = new Map(); // room id -> inst
function inst(id) {
  let I = LIVE.get(id); if (I) return I;
  const def = roomDef(id); if (!def) return null;
  I = { id, def, occ: new Map(), log: [], bans: new Map(), ring: new Map(), ps: {}, game: null, grid: null, lastJuke: 0, made: Date.now() };
  LIVE.set(id, I); rebuild(I);
  if (def.pub && def.P.game) I.game = newGame(def.P.game, I);
  return I;
}
// what stands on each tile: furniture with its footprint (public fixtures + member furni)
function placed(I) {
  const out = [];
  if (I.def.pub) I.def.P.fix.forEach((f, i) => { if (typeof f[1] === 'string') return; const F = C.FURNI['furni.' + f[0]]; if (!F) return; const ov = I.ps[i] || {}; out.push({ F, x: ov.x != null ? ov.x : f[1], y: ov.y != null ? ov.y : f[2], r: f[3] | 0, i, s: ov.s | 0 }); });
  else for (const f of I.def.R.f) { if (f.w) continue; const F = C.FURNI[f.id]; if (F) out.push({ F, x: f.x, y: f.y, r: f.r | 0, u: f.u, s: f.s | 0 }); }
  if (I.game && I.game.chairs) for (const ch of I.game.chairs) out.push({ F: C.FURNI['furni.pub_xmchair'], x: ch.x, y: ch.y, r: 0, game: 1 });
  return out;
}
const foot = it => { const w = it.r ? it.F.d : it.F.w, d = it.r ? it.F.w : it.F.d; const t = []; for (let x = it.x; x < it.x + w; x++) for (let y = it.y; y < it.y + d; y++) t.push([x, y]); return t; };
function rebuild(I) {
  const { W, H, map } = I.def, g = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = map[y][x]; if (ch === 'x' || ch === 'w') g[y * W + x] = 1; }
  I.sitAt = new Map(); I.useAt = new Map();
  for (const it of placed(I)) {
    for (const [x, y] of foot(it)) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (it.F.k === 'f' && !it.F.sit) g[y * W + x] = 1;
      if (it.F.sit) I.sitAt.set(x + ',' + y, it);
      if (it.F.use) I.useAt.set(x + ',' + y, it);
    }
  }
  if (I.def.pub) for (const n of I.def.P.npcs) if (!n[5]) g[n[2] * W + n[1]] = 1; // the regulars stand there (not the ones who only come at certain times)
  I.grid = g;
}
// where somebody is at time t: a tile, or between two (fx, fy fractional)
function posAt(O, t) {
  const p = O.path; if (!p || !p.length) return { x: O.x, y: O.y, fx: O.x, fy: O.y, moving: false, i: 0 };
  const k = (t - O.t0) / STEP;
  if (k <= 0) return { x: p[0][0], y: p[0][1], fx: p[0][0], fy: p[0][1], moving: p.length > 1, i: 0 };
  const i = Math.floor(k);
  if (i >= p.length - 1) { const l = p[p.length - 1]; return { x: l[0], y: l[1], fx: l[0], fy: l[1], moving: false, i: p.length - 1 }; }
  const a = p[i], b = p[i + 1], f = k - i;
  return { x: f < 0.5 ? a[0] : b[0], y: f < 0.5 ? a[1] : b[1], fx: a[0] + (b[0] - a[0]) * f, fy: a[1] + (b[1] - a[1]) * f, moving: true, i };
}
function stopAt(O, x, y) { O.path = [[x, y]]; O.t0 = Date.now(); O.x = x; O.y = y; O.arrived = true; }
const occView = (O, now) => ({ id: O.id, nick: O.nick, av: O.av, m: O.member ? 1 : 0, bot: O.bot ? 1 : 0, p: O.path, d: Math.round(O.t0 - now), e: O.emo || '', c: O.carry && O.carry.until > now ? O.carry.k : '', st: isStaff(O.c) ? 1 : 0 });
function roomSend(I, msg, exceptId) { const s = JSON.stringify(msg); for (const O of I.occ.values()) if (O.ws && O.id !== exceptId) ctx.send(O.ws, s); }
function roomView(I, c) {
  const now = Date.now(), d = I.def, base = { t: 'jwRoom', id: I.id, you: c.id, occ: [...I.occ.values()].map(O => occView(O, now)), game: I.game ? gameView(I) : null, ps: I.ps };
  if (d.pub) return base;
  const R = d.R;
  return Object.assign(base, { R: { n: R.n, ds: R.ds, on: R.on, o: R.o, cat: R.cat, md: R.md, fl: R.fl, wl: R.wl, lock: R.lock, f: R.f, likes: R.likes | 0, gbn: R.gb.length, keys: R.keys, vis: R.vis | 0 }, mine: keyOfC(c) === R.o, rights: rights(c, R), liked: !!(keyOfC(c) && P(keyOfC(c)).liked[I.id]) });
}
const rights = (c, R) => { const k = keyOfC(c); return !!(k && (k === R.o || isStaff(c))); };
const hasKey = (c, R) => { const k = keyOfC(c); return !!(k && (k === R.o || (R.keys || []).some(n => n.toLowerCase() === k) || isStaff(c))); };
function roomFor(c) { return c.jwRoom ? LIVE.get(c.jwRoom) || null : null; }

// ================================================================ coming and going
function enter(ws, c, I, from) {
  leave(c, true);
  if (LIVE.get(I.id) !== I) { I = inst(I.id); if (!I) return; } // leaving may have closed an empty room: open it again
  const now = Date.now(), d = I.def;
  let sp = d.spawn;
  if (d.pub && from) { const back = d.P.exits.find(e => e[2] === from); if (back) sp = [back[0], back[1]]; }
  const key = keyOfC(c), av = key && C.avOk(P(key).av) ? P(key).av : C.avOk(c.jwAv) ? c.jwAv : C.avOf(c.nick);
  const O = { id: c.id, c, ws, nick: c.nick, key, member: !!c.member, av, x: sp[0], y: sp[1], path: [[sp[0], sp[1]]], t0: now, arrived: true, emo: '', carry: null };
  I.occ.set(c.id, O); c.jwRoom = I.id;
  ctx.send(ws, roomView(I, c));
  roomSend(I, { t: 'jwIn', o: occView(O, now) }, c.id);
  if (!d.pub) { // visitors: the room's counters, and a few Rupees for its owner (once a day per visitor)
    const R = d.R; R.vis = (R.vis | 0) + 1;
    if (key && key !== R.o) {
      const w = D.wk; if (w.no === weekNo()) { const v = w.vis[I.id] = w.vis[I.id] || {}; if (!v[key]) { v[key] = 1; const oa = E.acctByKey(R.o); if (oa) E.earnA(oa, 'jwhost', `${c.member} visited your JackWorld room`); } }
    }
    ctx.markDirty();
  }
  if (I.game) gameJoined(I, O);
  presence();
}
function leave(c, quiet) {
  const I = roomFor(c); c.jwRoom = '';
  if (!I) return;
  const O = I.occ.get(c.id); I.occ.delete(c.id);
  if (O) roomSend(I, { t: 'jwOut', id: c.id });
  for (const [vid, r] of I.ring) if (vid === c.id) I.ring.delete(vid);
  if (I.game) gameLeft(I, c.id);
  if (![...I.occ.values()].some(o => !o.bot) && !(I.game && I.game.busy)) { if (I.game) gameReset(I); if (!I.def.pub) LIVE.delete(I.id); }
  if (!quiet) presence();
}
let presT = 0;
function presence() { // how many are in JackWorld (for the web site and the tray), at most once a second
  if (presT) return; presT = setTimeout(() => { presT = 0; }, 1000);
}
function countIn() { let n = 0; for (const I of LIVE.values()) for (const O of I.occ.values()) if (!O.bot) n++; return n; }
function go(ws, c, m) {
  const id = String(m.r || ''), key = keyOfC(c);
  if (m.av && C.avOk(m.av) && !key) c.jwAv = m.av;
  if (!isPub(id)) {
    if (!key) return ctx.send(ws, { t: 'jwNo', r: id, why: 'guest' });
    const R = D.rooms[id]; if (!R) return ctx.send(ws, { t: 'jwNo', r: id, why: 'gone' });
    const I0 = LIVE.get(id), ban = I0 && I0.bans.get(key);
    if (ban && ban > Date.now() && !isStaff(c)) return ctx.send(ws, { t: 'jwNo', r: id, why: 'kicked' });
    if (R.hid > Date.now() && !isStaff(c) && key !== R.o) return ctx.send(ws, { t: 'jwNo', r: id, why: 'closed' });
    if (R.lock !== 'open' && !hasKey(c, R) && !(m.admit && c.jwAdmit === id)) {
      if (R.lock === 'shut') return ctx.send(ws, { t: 'jwNo', r: id, why: 'shut', n: R.n });
      const I = inst(id), ans = [...I.occ.values()].filter(O => O.ws && hasKey(O.c, R));
      if (!ans.length) return ctx.send(ws, { t: 'jwNo', r: id, why: 'nobody', n: R.n });
      I.ring.set(c.id, { ws, c, at: Date.now() });
      for (const O of ans) ctx.send(O.ws, { t: 'jwRing', id: c.id, nick: c.nick, r: id });
      return ctx.send(ws, { t: 'jwWait', r: id, n: R.n });
    }
    c.jwAdmit = '';
  } else if (C.PUB[id].hidden && c.jwRoom !== 'space' && !c.jwMoon && !isStaff(c)) return ctx.send(ws, { t: 'jwNo', r: id, why: 'gone' }); // found through the airlock first
  const I = inst(id); if (!I) return ctx.send(ws, { t: 'jwNo', r: id, why: 'gone' });
  if (I.occ.size >= 40 && !isStaff(c)) return ctx.send(ws, { t: 'jwNo', r: id, why: 'full' });
  const from = c.jwRoom;
  enter(ws, c, I, from);
}

// ================================================================ walking
function walk(ws, c, m) {
  const I = roomFor(c); if (!I) return; const O = I.occ.get(c.id); if (!O) return;
  const x = m.x | 0, y = m.y | 0, now = Date.now();
  if (!isInt(x, 0, I.def.W - 1) || !isInt(y, 0, I.def.H - 1)) return;
  if (O.dazed > now) return;
  if (I.game && !gameWalkOk(I, O, x, y)) return;
  walkTo(I, O, x, y, now);
}
function walkTo(I, O, x, y, now) {
  const cur = posAt(O, now);
  let sx, sy, st;
  if (cur.moving && O.path.length > 1) { const nx = O.path[Math.min(O.path.length - 1, cur.i + 1)]; sx = nx[0]; sy = nx[1]; st = O.t0 + (cur.i + 1) * STEP; }
  else { sx = cur.x; sy = cur.y; st = now; }
  const g = I.game && I.game.blockGrid ? I.game.blockGrid(O) : I.grid;
  const p = C.path(g, I.def.W, I.def.H, sx, sy, x, y, (tx, ty) => I.sitAt.has(tx + ',' + ty) || (I.game && I.game.okTile && I.game.okTile(O, tx, ty)));
  if (!p) return false;
  O.path = p; O.t0 = st; O.arrived = p.length <= 1; O.emo = '';
  O.x = p[p.length - 1][0]; O.y = p[p.length - 1][1];
  roomSend(I, { t: 'jwMv', id: O.id, p, d: Math.round(st - now) });
  if (I.game && I.game.onWalk) I.game.onWalk(O, p, st);
  return true;
}
// arriving somewhere: doors to other rooms, Tele-Booths, trampolines, beach balls
function arrive(I, O) {
  const now = Date.now(), x = O.x, y = O.y, d = I.def;
  if (O.bot) return;
  if (d.pub) {
    const ex = d.P.exits.find(e => e[0] === x && e[1] === y);
    if (ex && O.path.length > 1 && O.ws) { const dest = inst(ex[2]); if (dest && dest.occ.size < 40) { if (ex[2] === 'moon') O.c.jwMoon = 1; return enter(O.ws, O.c, dest, I.id); } }
  } else if (x === d.spawn[0] && y === d.spawn[1] && O.path.length > 1 && O.ws) { const L = inst('lobby'); if (L) return enter(O.ws, O.c, L, ''); }
  const it = I.useAt.get(x + ',' + y);
  if (!it) return;
  if (it.F.use === 'tele') {
    const others = placed(I).filter(o => o.F.use === 'tele' && !(o.x === it.x && o.y === it.y));
    if (!others.length) return;
    const t = others[(others.findIndex(o => o.x > it.x || (o.x === it.x && o.y > it.y)) + others.length) % others.length] || others[0];
    roomSend(I, { t: 'jwEmo', id: O.id, e: 'tele' });
    setTimeout(() => { if (I.occ.get(O.id) !== O) return; const cur = posAt(O, Date.now()); if (cur.x !== x || cur.y !== y) return; stopAt(O, t.x, t.y); roomSend(I, { t: 'jwTp', id: O.id, x: t.x, y: t.y }); }, 900);
  } else if (it.F.use === 'tramp') roomSend(I, { t: 'jwEmo', id: O.id, e: 'bounce' });
  else if (it.F.use === 'ball') kickBall(I, O, it);
}
function kickBall(I, O, it) {
  const p = O.path, n = p.length; if (n < 2) return;
  const dx = Math.sign(p[n - 1][0] - p[n - 2][0]), dy = Math.sign(p[n - 1][1] - p[n - 2][1]);
  let bx = it.x, by = it.y;
  for (let k = 0; k < 3; k++) { const nx = bx + dx, ny = by + dy; if (nx < 0 || ny < 0 || nx >= I.def.W || ny >= I.def.H || I.grid[ny * I.def.W + nx] || I.useAt.has(nx + ',' + ny)) break; bx = nx; by = ny; }
  if (bx === it.x && by === it.y) return;
  if (it.i != null) I.ps[it.i] = Object.assign({}, I.ps[it.i], { x: bx, y: by });
  else { const f = I.def.R.f.find(q => q.u === it.u); if (!f) return; f.x = bx; f.y = by; ctx.markDirty(); }
  rebuild(I);
  roomSend(I, { t: 'jwBallMv', i: it.i, u: it.u, x: bx, y: by });
}

// ================================================================ talking (word filter, no phone numbers or addresses, flood control)
const PHONE = /(\+?\d[\d\s().-]{6,}\d)/g, EMAIL = /[A-Za-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[A-Za-z0-9.-]+\.[a-z]{2,}/gi;
const ADDR = /\b\d{1,4}\s+[A-Za-z]+\s+(road|rd|street|st|lane|ln|avenue|ave|close|drive|crescent|way|grove|gardens|terrace)\b/gi;
const POST = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;
function filterText(s) {
  let t = ctx.delink(ctx.clean(s, 140));
  t = t.replace(EMAIL, '[secret]').replace(PHONE, m => (m.replace(/\D/g, '').length >= 7 ? '[secret]' : m)).replace(ADDR, '[secret]').replace(POST, '[secret]');
  return t.trim();
}
const muteKey = c => (c.member ? 'm:' + c.member.toLowerCase() : 'cid:' + (c.cid || c.ip));
function muted(c) { const u = D.mutes[muteKey(c)] || (c.jwAutoMute || 0); return u > Date.now() ? u : 0; }
function say(ws, c, m) {
  const I = roomFor(c); if (!I) return; const O = I.occ.get(c.id); if (!O) return;
  const until = muted(c);
  if (until) return err(ws, `You can't talk in JackWorld for another ${Math.ceil((until - Date.now()) / 60000)} minute(s). Be nice when you come back!`);
  if (!c.jwSayB) c.jwSayB = new ctx.Bucket(0.8, 4);
  if (!c.jwSayB.take()) { c.jwFlood = (c.jwFlood | 0) + 1; if (c.jwFlood >= 4) { c.jwAutoMute = Date.now() + 60000; c.jwFlood = 0; return err(ws, 'Woah, slow down! You can talk again in a minute.'); } return; }
  const s = filterText(m.s); if (!s) return;
  if (c.jwLast === s && Date.now() - (c.jwLastT || 0) < 8000) return; c.jwLast = s; c.jwLastT = Date.now();
  const k = m.k === 'shout' ? 'shout' : m.k === 'whisper' ? 'whisper' : 'say';
  O.emo = O.emo === 'sleep' ? '' : O.emo;
  I.log.push({ ts: Date.now(), n: c.nick, s, k }); if (I.log.length > 30) I.log.shift();
  if (k === 'whisper') { const T = I.occ.get(m.to | 0); if (!T || !T.ws) return; const msg = { t: 'jwSay', id: c.id, s, k, to: T.id }; ctx.send(ws, msg); ctx.send(T.ws, msg); return; }
  roomSend(I, { t: 'jwSay', id: c.id, s, k });
  if (I.game && I.game.onSay) I.game.onSay(O, s);
}
function emote(ws, c, m) {
  const I = roomFor(c); if (!I) return; const O = I.occ.get(c.id); if (!O) return;
  const e = String(m.e || ''); if (!EMOTES.has(e)) return;
  O.emo = e === 'stand' ? '' : (e === 'dance' || e === 'sit' || e === 'sleep' || e === 'cool' || e === 'think') ? e : '';
  roomSend(I, { t: 'jwEmo', id: c.id, e });
}

// ================================================================ the Catalogue (Rupees -> JackLoot furni)
function onSale(F, wk, md) {
  if (!F || F.pub || F.prize || !F.p) return false;
  if (F.wk) return F.wk === wk;
  return C.inSea(F, md);
}
function rareLeft(F) { const L = ctx.state.mods && ctx.state.mods.loot; const sold = L && L.ser ? L.ser[F.id] | 0 : 0; return Math.max(0, (F.lim | 0) - sold); }
function buy(ws, c, m) {
  const key = keyOfC(c); if (!key) return err(ws, NEED);
  const F = C.FURNI[String(m.id || '')], n = isInt(m.n, 1, 5) ? m.n : 1, wk = weekNo();
  if (!onSale(F, wk, mdNow())) return err(ws, "That isn't in the Catalogue right now.");
  const L = LA(), a = E.acct(c); if (!L || !a) return;
  const lp = L.P(key);
  if (lp.it.length + n > LCAT.RULES.invMax) return err(ws, 'Your Treasure Chest is full! Recycle or sell some things first.');
  if (F.wk) {
    if (n !== 1) return;
    const p = P(key);
    if (p.rb[F.id]) return err(ws, `You already have a ${F.n} from this week's release. One each, so everybody gets a chance!`);
    if ((a.earned | 0) < 100) return err(ws, 'Rares are for JackNet regulars: earn 100 Rupees around the PC first (games, the forums, secrets...).');
    if (!L.canMint(LCAT.ITEM[F.id])) return err(ws, `Sold out! Every ${F.n} that will ever exist has been sold. Try JackBay or the Trading Post.`);
  }
  const cost = F.p * n;
  if (a.bal < cost) return err(ws, `You need ${rp(cost)} for that (you have ${rp(a.bal)}).`);
  if (!E.debit(a, cost, 'jwbuy', `JackWorld Catalogue: ${F.n}${n > 1 ? ' x' + n : ''}`)) return err(ws, 'Not enough Rupees.');
  const got = [];
  for (let i = 0; i < n; i++) { const x = L.mint(F.id, 'JackWorld'); if (x && L.give(key, x, 'JackWorld')) got.push(x.u); }
  if (F.wk) P(key).rb[F.id] = Date.now();
  D.st.buys = (D.st.buys | 0) + n; D.st.spent = (D.st.spent | 0) + cost;
  ctx.markDirty(); E.meToAll(a);
  const ser = F.wk && got.length ? ((L.findItem(lp, got[0]) || {}).s | 0) : 0;
  ctx.send(ws, { t: 'jwBought', id: F.id, n, us: got, bal: a.bal, rare: F.wk ? 1 : 0, left: F.wk ? rareLeft(F) : null, ser, cost });
  if (F.wk) ctx.pushChat({ sys: true, text: `*** ${a.name} just bought this week's JackWorld rare: ${F.n} (#${ser || '?'} of ${F.lim})!`, ts: Date.now() });
}
function style(ws, c, m) {
  const key = keyOfC(c); if (!key) return err(ws, NEED);
  const R = myRoom(key); if (!R) return err(ws, 'Make your room first (press My Room).');
  const k = String(m.k || ''), id = String(m.id || ''), T = k === 'fl' ? FLOOR : k === 'wl' ? WALL : k === 'md' ? MODEL : null;
  if (!T || !own(T, id)) return;
  const S = T[id], p = P(key), list = p.st[k] = Array.isArray(p.st[k]) ? p.st[k] : [];
  if (S.price > 0 && !list.includes(id)) {
    const a = E.acct(c); if (!a) return;
    if (a.bal < S.price) return err(ws, `${S.n} costs ${rp(S.price)} (you have ${rp(a.bal)}).`);
    if (!E.debit(a, S.price, 'jwbuy', `JackWorld: ${S.n}`)) return;
    list.push(id); E.meToAll(a);
    D.st.spent = (D.st.spent | 0) + S.price;
  }
  if (k === 'md') {
    R.md = id;
    const I = LIVE.get(R.id), M = MODEL[id], back = [];
    // anything that doesn't fit the new shape goes back in the Treasure Chest
    R.f = R.f.filter(f => { if (fits(R, M, f, null)) return true; back.push(f); return false; });
    unlock(R.o, back.map(f => f.u));
    if (I) { I.def = roomDef(R.id); rebuild(I); const now = Date.now(); for (const O of I.occ.values()) { stopAt(O, M.door[0], M.door[1]); O.t0 = now; } for (const O of I.occ.values()) if (O.ws) ctx.send(O.ws, roomView(I, O.c)); }
  } else { R[k] = id; const I = LIVE.get(R.id); if (I) roomSend(I, { t: 'jwStyle', k, id }); }
  ctx.markDirty();
  ctx.send(ws, { t: 'jwMe2', st: p.st });
}

// ================================================================ furni in your room
function fits(R, M, f, ignoreU) { // can f (a placed thing) stand there?
  const F = C.FURNI[f.id]; if (!F) return false;
  const W = M.map[0].length, H = M.map.length;
  if (f.w) { // on a wall: the back wall along y = 0 ('R') or x = 0 ('L')
    if (!(f.w === 'L' || f.w === 'R') || !isInt(f.x, 0, (f.w === 'R' ? W : H) - F.w) || !isInt(f.z | 0, -24, 16)) return false;
    for (let i = 0; i < F.w; i++) { const tx = f.w === 'R' ? f.x + i : 0, ty = f.w === 'R' ? 0 : f.x + i; if (M.map[ty][tx] === 'x') return false; if (f.w === 'L' && f.x + i === M.door[1]) return false; }
    for (const g of R.f) if (g.u !== f.u && g.u !== ignoreU && g.w === f.w) { const G = C.FURNI[g.id]; if (G && f.x < g.x + G.w && g.x < f.x + F.w && Math.abs((f.z | 0) - (g.z | 0)) < 30) return false; }
    return true;
  }
  if (F.k === 'w') return false;
  const w = f.r ? F.d : F.w, d = f.r ? F.w : F.d;
  if (!isInt(f.x, 0, W - w) || !isInt(f.y, 0, H - d)) return false;
  for (let x = f.x; x < f.x + w; x++) for (let y = f.y; y < f.y + d; y++) {
    if (M.map[y][x] === 'x') return false;
    if (x === M.door[0] && y === M.door[1]) return false;
    for (const g of R.f) {
      if (g.u === f.u || g.u === ignoreU || g.w) continue; const G = C.FURNI[g.id]; if (!G) continue;
      const gw = g.r ? G.d : G.w, gd = g.r ? G.w : G.d;
      if (x >= g.x && x < g.x + gw && y >= g.y && y < g.y + gd && (F.k === 'r') === (G.k === 'r')) return false; // rugs go under things, not under rugs
    }
  }
  return true;
}
function unlock(key, us) { const L = LA(); if (!L || !key) return; const lp = L.P(key); for (const u of us) { const x = L.findItem(lp, u); if (x && x.lk === 'jw') delete x.lk; } L.sendMe(key); ctx.markDirty(); }
function place(ws, c, m) {
  const key = keyOfC(c); if (!key) return err(ws, NEED);
  const I = roomFor(c); if (!I || I.def.pub) return err(ws, 'You can only put furni out in your own room.');
  const R = I.def.R; if (!rights(c, R)) return err(ws, "This isn't your room! Only the owner can move the furni.");
  const u = m.u; if (!isInt(u, 1, 1e12)) return;
  const L = LA(); if (!L) return;
  const okey = R.o, lp = L.P(okey), x = L.findItem(lp, u);
  const ex = R.f.find(f => f.u === u);
  if (!x || LCAT.ITEM[x.id] && LCAT.ITEM[x.id].type !== 'furni') { if (ex) { R.f = R.f.filter(f => f !== ex); rebuild(I); roomSend(I, { t: 'jwFx', u }); ctx.markDirty(); } return err(ws, "That isn't in the room owner's Treasure Chest any more."); }
  if (!ex && x.lk) return err(ws, "That's tied up in a trade, the Bazaar or JackBay right now.");
  if (!ex && R.f.length >= I.def.M.max) return err(ws, `This room can hold ${I.def.M.max} pieces of furni. Get a bigger room in the Catalogue (Room Sizes)!`);
  const F = C.FURNI[x.id]; if (!F || F.pub) return;
  const f = F.k === 'w' ? { u, id: F.id, w: m.w === 'L' ? 'L' : 'R', x: m.x | 0, y: 0, z: Math.max(-24, Math.min(16, m.z | 0)), s: ex ? ex.s | 0 : 0 } : { u, id: F.id, x: m.x | 0, y: m.y | 0, r: m.r ? 1 : 0, s: ex ? ex.s | 0 : 0 };
  if (!fits(R, I.def.M, f, u)) return err(ws, "It won't fit there.");
  // nobody gets trapped inside a wardrobe: no solid furni on somebody's feet
  if (F.k === 'f' && !F.sit && !f.w) { const now = Date.now(), wd = f.r ? F.d : F.w, dd = f.r ? F.w : F.d; for (const O of I.occ.values()) { const q = posAt(O, now); if (q.x >= f.x && q.x < f.x + wd && q.y >= f.y && q.y < f.y + dd) return err(ws, "Someone's standing there!"); } }
  if (ex) Object.assign(ex, f); else { R.f.push(f); x.lk = 'jw'; L.sendMe(okey); }
  rebuild(I); ctx.markDirty();
  roomSend(I, { t: 'jwF', f });
}
function pickUp(ws, c, m) {
  const I = roomFor(c); if (!I || I.def.pub) return; const R = I.def.R; if (!rights(c, R)) return;
  const i = R.f.findIndex(f => f.u === m.u); if (i < 0) return;
  const f = R.f.splice(i, 1)[0]; unlock(R.o, [f.u]); rebuild(I); ctx.markDirty();
  roomSend(I, { t: 'jwFx', u: f.u });
}
function use(ws, c, m) {
  const I = roomFor(c); if (!I) return; const O = I.occ.get(c.id); if (!O) return;
  let F, f, set;
  if (I.def.pub) { const i = m.i | 0, fx = I.def.P.fix[i]; if (!fx) return; F = C.FURNI['furni.' + fx[0]]; const ov = I.ps[i] = I.ps[i] || {}; f = ov; set = s => { ov.s = s; roomSend(I, { t: 'jwFs', i, s }); }; }
  else { f = I.def.R.f.find(q => q.u === m.u); if (!f) return; F = C.FURNI[f.id]; set = s => { f.s = s; ctx.markDirty(); roomSend(I, { t: 'jwFs', u: f.u, s }); }; }
  if (!F || !F.use) return;
  const R = I.def.R, mine = !R || hasKey(c, R);
  switch (F.use) {
    case 'lamp': case 'fire': case 'disco': case 'pc': if (!mine && !I.def.pub) return err(ws, 'Only the owner can switch that on and off.'); return set(f.s ? 0 : 1);
    case 'tv': return set(((f.s | 0) + 1) % 5);
    case 'dice': set(0); return setTimeout(() => set(rint(1, 6)), 900);
    case 'juke': { const now = Date.now(); if (now - I.lastJuke < 8000) return; I.lastJuke = now; const tune = rint(0, 5); set(1); roomSend(I, { t: 'jwJuke', tune, by: c.nick }); setTimeout(() => set(0), 15000); return; }
    case 'vend': { const k = F.art[0] === 'icecream' ? 'ice' : 'pop'; O.carry = { k, until: Date.now() + 120000 }; return roomSend(I, { t: 'jwCarry', id: c.id, c: k }); }
    case 'bell': return roomSend(I, { t: 'jwDing', id: c.id });
  }
}

// ================================================================ owning a room
function make(ws, c, m) {
  const key = keyOfC(c); if (!key) return err(ws, NEED);
  if (myRoom(key)) return ctx.send(ws, { t: 'jwMade', r: D.own[key] });
  const n = ctx.clean(String(m.n || ''), 30).replace(/[<>]/g, '') || `${c.member}'s Room`;
  const R = newRoom(key, n);
  ctx.send(ws, { t: 'jwMade', r: R.id, n: R.n });
}
function setRoom(ws, c, m) {
  const key = keyOfC(c); if (!key) return; const R = myRoom(key); if (!R) return;
  if (m.n != null) { const n = ctx.clean(String(m.n), 30).replace(/[<>]/g, ''); if (n) R.n = n; }
  if (m.ds != null) R.ds = ctx.delink(ctx.clean(String(m.ds), 100));
  if (CATS.includes(m.cat)) R.cat = m.cat;
  if (LOCKS.includes(m.lock)) R.lock = m.lock;
  ctx.markDirty();
  const I = LIVE.get(R.id); if (I) roomSend(I, { t: 'jwInfo2', n: R.n, ds: R.ds, cat: R.cat, lock: R.lock });
  else ctx.send(ws, { t: 'jwInfo2', n: R.n, ds: R.ds, cat: R.cat, lock: R.lock });
}
function keys(ws, c, m) {
  const key = keyOfC(c); const R = myRoom(key); if (!R) return;
  const nk = keyOf(m.name); if (!nk || !ctx.state.members[nk] || nk === key) return err(ws, "There's no member called that.");
  const name = memberName(nk);
  R.keys = (R.keys || []).filter(n => n.toLowerCase() !== nk);
  if (m.on) { if (R.keys.length >= 10) return err(ws, 'You can give out 10 spare keys at most.'); R.keys.push(name); }
  ctx.markDirty(); ctx.send(ws, { t: 'jwKeys', keys: R.keys });
}
function answer(ws, c, m) {
  const I = roomFor(c); if (!I || I.def.pub || !hasKey(c, I.def.R)) return;
  const r = I.ring.get(m.id | 0); if (!r) return; I.ring.delete(m.id | 0);
  if (m.ok) { r.c.jwAdmit = I.id; go(r.ws, r.c, { r: I.id, admit: 1 }); }
  else ctx.send(r.ws, { t: 'jwNo', r: I.id, why: 'answer', n: I.def.R.n });
  roomSend(I, { t: 'jwRang', id: m.id | 0 });
}
function kick(ws, c, m) {
  const I = roomFor(c); if (!I) return;
  const T = I.occ.get(m.id | 0); if (!T || !T.ws || T.id === c.id) return;
  const staff = isStaff(c);
  if (!staff && (I.def.pub || !rights(c, I.def.R))) return;
  if (T.key && !I.def.pub) I.bans.set(T.key, Date.now() + 15 * 60000);
  ctx.send(T.ws, { t: 'jwKicked', r: I.id, by: staff ? 'a JackWorld Moderator' : c.nick });
  const L = inst('lobby'); if (L && I.id !== 'lobby') enter(T.ws, T.c, L, ''); else leave(T.c);
}

// ================================================================ the Navigator
function card(R) { const I = LIVE.get(R.id); return { id: R.id, n: R.n, on: R.on, ds: R.ds, cat: R.cat, lock: R.lock, lk: R.likes | 0, u: I ? [...I.occ.values()].filter(o => !o.bot).length : 0, md: R.md }; }
function nav(ws, c, m) {
  const tab = String(m.tab || 'pub'), now = Date.now(), key = keyOfC(c);
  const vis = R => !(R.hid > now) || isStaff(c) || R.o === key;
  let list = [];
  if (tab === 'pub') list = C.PUB_ORDER.filter(id => !C.PUB[id].hidden).map(id => { const I = LIVE.get(id); return { id, n: C.PUB[id].n, ds: C.PUB[id].ds, u: I ? [...I.occ.values()].filter(o => !o.bot).length : 0, pub: 1, g: C.PUB[id].game || '' }; });
  else {
    const all = Object.values(D.rooms).filter(vis);
    if (tab === 'hot') list = all.map(card).filter(r => r.u > 0).sort((a, b) => b.u - a.u || b.lk - a.lk);
    else if (tab === 'top') list = all.map(card).sort((a, b) => b.lk - a.lk || b.u - a.u);
    else if (tab === 'new') list = all.sort((a, b) => b.made - a.made).map(card);
    else if (tab === 'mine') list = all.filter(R => R.o === key || (R.keys || []).some(n => n.toLowerCase() === key)).map(card);
    else if (tab === 'search') { const q = String(m.q || '').toLowerCase().slice(0, 30); list = q ? all.filter(R => R.n.toLowerCase().includes(q) || R.on.toLowerCase().includes(q) || (R.ds || '').toLowerCase().includes(q)).map(card) : []; }
    else if (tab === 'rotw') list = D.rotw.slice(-10).reverse().map(x => Object.assign(D.rooms[x.r] ? card(D.rooms[x.r]) : { id: x.r, n: x.n, on: x.on, lk: 0, u: 0 }, { w: x.w }));
    list = list.slice(0, 40);
  }
  ctx.send(ws, { t: 'jwNav', tab, list, mine: key && D.own[key] ? D.own[key] : '' });
}
function like(ws, c, m) {
  const key = keyOfC(c); if (!key) return err(ws, NEED);
  const R = D.rooms[String(m.r || '')]; if (!R) return;
  if (R.o === key) return err(ws, "You can't like your own room. (We know you do, though.)");
  const p = P(key); if (p.liked[R.id]) return;
  const a = E.acct(c); if (!a || (a.earned | 0) < 50) return err(ws, 'Earn 50 Rupees around JackNet first, then you can like rooms. (It stops people cheating with made-up members!)');
  p.liked[R.id] = Date.now(); R.likes = (R.likes | 0) + 1;
  if (D.wk.no === weekNo()) D.wk.likes[R.id] = (D.wk.likes[R.id] | 0) + 1;
  const oa = E.acctByKey(R.o); if (oa) E.earnA(oa, 'jwlike', `${a.name} liked your JackWorld room`);
  ctx.markDirty();
  const I = LIVE.get(R.id); if (I) roomSend(I, { t: 'jwLikes', r: R.id, n: R.likes, by: a.name }); else ctx.send(ws, { t: 'jwLikes', r: R.id, n: R.likes, by: a.name });
}
function gb(ws, c, m) {
  const R = D.rooms[String(m.r || '')]; if (!R) return;
  const key = keyOfC(c), can = !!key && (key === R.o || isStaff(c));
  if (m.t === 'jwSign') {
    if (!key) return err(ws, NEED);
    if (muted(c)) return err(ws, "You can't sign guestbooks while you're muted.");
    if (!c.jwGbB) c.jwGbB = new ctx.Bucket(1 / 30, 1);
    const s = filterText(String(m.s || '').slice(0, 200)); if (!s) return;
    if (!c.jwGbB.take()) return err(ws, 'One guestbook message every 30 seconds, please!');
    R.gb.push({ by: c.member, s, ts: Date.now() }); if (R.gb.length > 40) R.gb.splice(0, R.gb.length - 40);
    ctx.markDirty();
  } else if (m.t === 'jwGbDel') { if (!can) return; R.gb = R.gb.filter(e => e.ts !== +m.ts); ctx.markDirty(); }
  ctx.send(ws, { t: 'jwGb', r: R.id, n: R.n, list: R.gb.slice().reverse(), can });
}
function report(ws, c, m) {
  const I = roomFor(c); if (!I) return;
  if (!c.jwRepB) c.jwRepB = new ctx.Bucket(1 / 60, 3);
  if (!c.jwRepB.take()) return err(ws, "Thanks, we've got your reports. A Moderator will look soon.");
  const T = I.occ.get(m.id | 0);
  const r = { ts: Date.now(), by: c.nick, who: T ? T.nick : String(m.name || '').slice(0, 20), room: I.id, rn: I.def.pub ? I.def.P.n : I.def.R.n, why: ctx.clean(String(m.why || ''), 200), log: I.log.slice(-12) };
  D.reports.push(r); if (D.reports.length > 200) D.reports.splice(0, D.reports.length - 200);
  ctx.markDirty();
  ctx.send(ws, { t: 'jwReported' });
  for (const [ws2, c2] of ctx.clients) if (isStaff(c2)) ctx.send(ws2, { t: 'jwStaffNote', msg: `New report: ${r.by} reported ${r.who} in ${r.rn}.` });
}
function staff(ws, c, m) {
  const a = String(m.a || '');
  if (a === 'auth') {
    if (!c.jwAuthB) c.jwAuthB = new ctx.Bucket(0.05, 3);
    const tok = String(m.token || ''), want = process.env.ADMIN_TOKEN || '';
    if (!c.jwAuthB.take() || !want || tok.length !== want.length || !crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(want))) return ctx.send(ws, { t: 'jwStaff', ok: false });
    c.jwStaff = true; return ctx.send(ws, { t: 'jwStaff', ok: true });
  }
  if (!isStaff(c)) return;
  const now = Date.now();
  switch (a) {
    case 'reports': return ctx.send(ws, { t: 'jwReports', list: D.reports.slice(-50).reverse(), mutes: Object.entries(D.mutes).filter(([, u]) => u > now) });
    case 'dismiss': D.reports = D.reports.filter(r => r.ts !== +m.ts); ctx.markDirty(); return staff(ws, c, { a: 'reports' });
    case 'mute': case 'unmute': {
      const mins = Math.max(1, Math.min(10080, m.mins | 0 || 60));
      let k = ''; const I = roomFor(c), T = I && I.occ.get(m.id | 0);
      if (T) k = muteKey(T.c); else if (m.name) k = 'm:' + String(m.name).toLowerCase();
      if (!k) return;
      if (a === 'mute') D.mutes[k] = now + mins * 60000; else delete D.mutes[k];
      for (const k2 in D.mutes) if (D.mutes[k2] < now) delete D.mutes[k2];
      ctx.markDirty();
      if (T && T.ws && a === 'mute') ctx.send(T.ws, { t: 'jwErr', msg: `A JackWorld Moderator has muted you for ${mins} minute(s). Please be nice!` });
      return staff(ws, c, { a: 'reports' });
    }
    case 'clear': { // everybody out; optionally all the furni back to its owner; a member room can be closed for a day
      const id = String(m.r || ''), I = LIVE.get(id);
      if (I) for (const O of [...I.occ.values()]) { if (!O.ws || O.id === c.id) continue; ctx.send(O.ws, { t: 'jwKicked', r: id, by: 'a JackWorld Moderator', clear: 1 }); const L = inst('lobby'); if (L && id !== 'lobby') enter(O.ws, O.c, L, ''); else leave(O.c); }
      const R = D.rooms[id];
      if (R) {
        if (m.pick) { unlock(R.o, R.f.map(f => f.u)); R.f = []; if (I) { rebuild(I); for (const O of I.occ.values()) if (O.ws) ctx.send(O.ws, roomView(I, O.c)); } }
        if (m.close) { R.hid = now + 864e5; R.lock = 'shut'; }
        if (m.rename) { R.n = `${R.on}'s Room`; R.ds = ''; }
        ctx.markDirty();
      }
      if (I && I.game) gameReset(I);
      return ctx.send(ws, { t: 'jwErr', msg: 'Room cleared.' });
    }
    case 'unhide': { const R = D.rooms[String(m.r || '')]; if (R) { R.hid = 0; ctx.markDirty(); } return; }
  }
}

// ================================================================ the web site, the rare of the week, the Room of the Week
function info(ws) {
  const wk = C.week(today()), F = C.rareOfWeek(wk.no), top = Object.values(D.rooms).filter(R => !(R.hid > Date.now())).sort((a, b) => (b.likes | 0) - (a.likes | 0)).slice(0, 6).map(card);
  const hot = []; for (const I of LIVE.values()) { const n = [...I.occ.values()].filter(o => !o.bot).length; if (n) hot.push({ id: I.id, n: I.def.pub ? I.def.P.n : I.def.R.n, u: n, pub: I.def.pub ? 1 : 0 }); }
  ctx.send(ws, { t: 'jwInfo', online: countIn(), rooms: Object.keys(D.rooms).length, rare: { id: F.id, left: rareLeft(F), lim: F.lim, wk: wk.no, ends: wk.sun }, rotw: D.rotw.slice(-6).reverse(), top, hot: hot.sort((a, b) => b.u - a.u).slice(0, 8), sold: soldRares() });
}
function soldRares() { const L = ctx.state.mods && ctx.state.mods.loot, out = {}; for (const F of C.RARES) out[F.id] = L && L.ser ? L.ser[F.id] | 0 : 0; return out; }
function meView(c) {
  const key = keyOfC(c), wk = weekNo(), F = C.rareOfWeek(wk);
  const base = { t: 'jwMe', member: !!key, staff: isStaff(c), wk, rare: { id: F.id, left: rareLeft(F) }, md: mdNow() };
  if (!key) return base;
  const p = P(key);
  return Object.assign(base, { av: C.avOk(p.av) ? p.av : null, room: D.own[key] || '', st: p.st, rb: p.rb, liked: Object.keys(p.liked).length });
}
function weekly() {
  const no = weekNo(); if (D.wk.no === no) return;
  if (D.wk.no) { // judge last week's Room of the Week: likes count three, different visitors one each
    let best = null, bs = 0;
    for (const id in D.rooms) { const sc = (D.wk.likes[id] | 0) * 3 + Object.keys(D.wk.vis[id] || {}).length; if (sc > bs) { bs = sc; best = D.rooms[id]; } }
    if (best && bs >= 4) {
      D.rotw.push({ w: D.wk.no, r: best.id, n: best.n, on: best.on, sc: bs, ts: Date.now() }); if (D.rotw.length > 60) D.rotw.shift();
      const oa = E.acctByKey(best.o); if (oa) E.credit(oa, 250, 'jwrotw', 'JackWorld Room of the Week prize!');
      const L = LA(); if (L) { const x = L.mint('furni.rotw', 'RoomOfWeek'); if (x) L.give(best.o, x, 'RoomOfWeek'); }
      ctx.pushChat({ sys: true, text: `*** JACKWORLD ROOM OF THE WEEK: "${best.n}" by ${best.on}! Go and have a look (www.jackworld.jnet).`, ts: Date.now() });
      for (const [ws2, c2] of ctx.clients) if (keyOfC(c2) === best.o) ctx.send(ws2, { t: 'jwRotw', n: best.n });
    }
  }
  D.wk = { no, likes: {}, vis: {} }; ctx.markDirty();
}

// ================================================================ games: Quiz Booth (arcade), Musical Chairs (rooftop), Snowball Fight (peak)
const BOTS = [['Dave', [0, 1, 1, 1, 6, 0, 0, 1, 1]], ['Luke', [0, 0, 3, 2, 0, 1, 1, 7, 0]], ['JackK', [0, 2, 11, 0, 2, 4, 4, 7, 1]], ['Callum', [0, 0, 2, 6, 8, 9, 0, 12, 0]]];
let botSeq = 0;
function addBot(I, i) {
  const [nick, av] = BOTS[i % BOTS.length], sp = I.def.spawn, now = Date.now();
  const O = { id: -(++botSeq), bot: true, nick, av, x: sp[0], y: sp[1], path: [[sp[0], sp[1]]], t0: now, arrived: true, emo: '', member: false, c: null };
  I.occ.set(O.id, O); roomSend(I, { t: 'jwIn', o: occView(O, now) });
  return O;
}
function dropBots(I) { for (const O of [...I.occ.values()]) if (O.bot) { I.occ.delete(O.id); roomSend(I, { t: 'jwOut', id: O.id }); } }
const humans = I => [...I.occ.values()].filter(O => !O.bot && O.ws);
function botWalkRandom(I, O, area) {
  for (let k = 0; k < 10; k++) { const x = area ? rint(area[0], area[2]) : rint(0, I.def.W - 1), y = area ? rint(area[1], area[3]) : rint(0, I.def.H - 1); if (!I.grid[y * I.def.W + x]) { walkTo(I, O, x, y, Date.now()); return; } }
}
function pay(O, src, note) { if (!O.key || !O.c) return 0; const a = E.acct(O.c); return a ? Math.max(0, E.earnA(a, src, note)) : 0; }
function newGame(k, I) {
  if (k === 'quiz') return quizGame(I);
  if (k === 'chairs') return chairsGame(I);
  if (k === 'snow') return snowGame(I);
  return null;
}
function gameView(I) { const g = I.game; return g && g.view ? g.view() : null; }
function gameSend(I) { roomSend(I, { t: 'jwG', g: gameView(I) }); }
function gameJoined(I, O) { if (I.game && I.game.joined) I.game.joined(O); }
function gameLeft(I, id) { if (I.game && I.game.left) I.game.left(id); }
function gameReset(I) { if (I.game && I.game.reset) I.game.reset(); }
function gameWalkOk(I, O, x, y) { return !(I.game && I.game.walkOk) || I.game.walkOk(O, x, y); }

// ---- the Quiz Booth: stand on the pad of your answer
function quizGame(I) {
  const g = { k: 'quiz', ph: 'idle', n: 0, q: null, t: 0, sc: {}, used: [], cool: 0, busy: false, res: null };
  const padOf = (x, y) => { for (const it of placed(I)) if (own(PADS, it.F.id) && x >= it.x && x < it.x + 2 && y >= it.y && y < it.y + 2) return PADS[it.F.id]; return -1; };
  g.view = () => ({ k: 'quiz', ph: g.ph, n: g.n, of: 8, q: g.q ? [g.q[0], g.q[1]] : null, ans: g.ph === 'reveal' || g.ph === 'end' ? g.q && g.q[2] : null, t: g.t, sc: Object.values(g.sc).sort((a, b) => b.p - a.p).slice(0, 8), res: g.res, now: Date.now() });
  g.start = (O) => {
    if (g.ph !== 'idle' || Date.now() < g.cool) return;
    g.ph = 'q'; g.n = 0; g.sc = {}; g.used = []; g.busy = true; g.res = null; g.by = O.nick; next();
  };
  function next() {
    const pool = C.quizNow(mdNow()), left = pool.filter(q => !g.used.includes(q[0]));
    g.q = pick(left.length ? left : pool); g.used.push(g.q[0]);
    g.n++; g.ph = 'q'; g.t = Date.now() + 15000; gameSend(I);
  }
  function reveal() {
    g.ph = 'reveal'; g.t = Date.now() + 5000;
    const now = Date.now();
    for (const O of humans(I)) { const p = posAt(O, now), a = padOf(p.x, p.y); if (a < 0) continue; const s = g.sc[O.id] = g.sc[O.id] || { id: O.id, n: O.nick, p: 0, O }; s.p += a === g.q[2] ? 1 : 0; s.played = 1; }
    gameSend(I);
  }
  function end() {
    g.ph = 'end'; g.t = Date.now() + 9000; g.busy = false;
    const list = Object.values(g.sc).sort((a, b) => b.p - a.p), top = list[0], players = list.filter(s => s.played).length;
    g.res = { win: top && top.p > 0 ? top.n : '', p: top ? top.p : 0, pays: {} };
    for (const s of list) { if (!s.O || !s.O.ws) continue; let amt = 0; if (s.p >= 3) amt += pay(s.O, 'jwplay', `Quiz Booth: ${s.p} out of 8`); if (s === top && s.p >= 4 && players >= 2 && (!list[1] || list[1].p < s.p)) amt += pay(s.O, 'jwwin', 'Won the Quiz Booth!'); g.res.pays[s.id] = amt; }
    gameSend(I); g.cool = Date.now() + 9000;
  }
  g.tick = now => {
    if (g.ph === 'q' && now >= g.t) reveal();
    else if (g.ph === 'reveal' && now >= g.t) { if (g.n >= 8) end(); else next(); }
    else if (g.ph === 'end' && now >= g.t) { g.ph = 'idle'; g.q = null; gameSend(I); }
    if (g.ph !== 'idle' && !humans(I).length) g.reset();
  };
  g.reset = () => { g.ph = 'idle'; g.q = null; g.busy = false; g.sc = {}; };
  g.act = (O, m) => { if (m.a === 'start') g.start(O); };
  g.joined = O => { if (O.ws) ctx.send(O.ws, { t: 'jwG', g: g.view() }); };
  return g;
}
// ---- Musical Chairs: when the music stops, get to a chair!
function chairsGame(I) {
  const RING = [[3, 3], [6, 2], [9, 3], [10, 6], [9, 9], [6, 10], [3, 9], [2, 6]]; // round the disco floor
  const g = { k: 'chairs', ph: 'idle', pl: new Map(), chairs: null, claims: new Map(), t: 0, round: 0, busy: false, res: null, out: [] };
  const AREA = [3, 4, 8, 7];
  g.view = () => ({ k: 'chairs', ph: g.ph, t: g.t, round: g.round, pl: [...g.pl.values()].map(p => ({ id: p.id, n: p.n, out: p.out ? 1 : 0, bot: p.bot ? 1 : 0 })), chairs: g.chairs, claims: [...g.claims].map(([k, v]) => [k, v.id]), res: g.res, now: Date.now() });
  const chairKey = (x, y) => (g.chairs || []).findIndex(c => c.x === x && c.y === y);
  g.blockGrid = O => { // in the game: chairs are solid until the music stops
    if (!g.chairs || !g.pl.has(O.id) || g.ph === 'scram') return I.grid;
    const G = I.grid.slice(); for (const ch of g.chairs) G[ch.y * I.def.W + ch.x] = 1; return G;
  };
  g.okTile = (O, x, y) => g.ph === 'scram' && g.pl.has(O.id) && !g.pl.get(O.id).out && chairKey(x, y) >= 0;
  g.walkOk = (O, x, y) => { if (g.ph === 'music' && g.pl.has(O.id) && chairKey(x, y) >= 0 && O.ws) { ctx.send(O.ws, { t: 'jwErr', msg: 'Not yet! Wait for the music to stop!', soft: 1 }); return false; } return !(g.ph === 'result' && g.pl.has(O.id) && !g.pl.get(O.id).out && chairKey(posAt(O, Date.now()).x, posAt(O, Date.now()).y) >= 0); };
  g.onWalk = (O, p, st) => {
    const P0 = g.pl.get(O.id); if (!P0 || P0.out || g.ph !== 'scram') return;
    const last = p[p.length - 1], ci = chairKey(last[0], last[1]);
    for (const [k, v] of g.claims) if (v.id === O.id && k !== ci) g.claims.delete(k);
    if (ci < 0) return gameSend(I);
    const T = st + STEP * (p.length - 1), cur = g.claims.get(ci);
    if (!cur || T < cur.T) { if (cur && cur.id !== O.id) { const loser = I.occ.get(cur.id); if (loser && loser.ws) ctx.send(loser.ws, { t: 'jwErr', msg: `${O.nick} got there first!`, soft: 1 }); } g.claims.set(ci, { id: O.id, T }); }
    gameSend(I);
  };
  g.start = O => {
    if (g.ph !== 'idle') return g.join(O);
    g.ph = 'lobby'; g.t = Date.now() + 12000; g.pl.clear(); g.claims.clear(); g.round = 0; g.res = null; g.busy = true; g.chairs = null;
    g.join(O); roomSend(I, { t: 'jwSay', id: 0, nick: 'DJ Spinz', s: `${O.nick} wants a game of MUSICAL CHAIRS! Press JOIN in the next 12 seconds!`, k: 'npc' }); gameSend(I);
  };
  g.join = O => { if (g.ph !== 'lobby' || g.pl.has(O.id) || g.pl.size >= 9) return; g.pl.set(O.id, { id: O.id, n: O.nick, out: false, bot: !!O.bot, O }); gameSend(I); };
  function begin() {
    const hum = [...g.pl.values()].filter(p => !p.bot).length;
    for (let i = 0; g.pl.size < 4 && i < 4; i++) { const B = addBot(I, i); g.pl.set(B.id, { id: B.id, n: B.nick, out: false, bot: true, O: B }); }
    g.humans = hum; round();
  }
  function round() {
    const alive = [...g.pl.values()].filter(p => !p.out);
    if (alive.length <= 1) return finish(alive[0]);
    g.round++; g.claims.clear();
    const n = alive.length - 1, start = rint(0, RING.length - 1);
    g.chairs = []; for (let i = 0; i < n; i++) { const r = RING[(start + Math.round(i * RING.length / n)) % RING.length]; if (!g.chairs.some(c => c.x === r[0] && c.y === r[1])) g.chairs.push({ x: r[0], y: r[1] }); }
    while (g.chairs.length < n) { const r = RING.find(q => !g.chairs.some(c => c.x === q[0] && c.y === q[1])); g.chairs.push({ x: r[0], y: r[1] }); }
    rebuild(I);
    // anybody standing on a chair gets nudged onto the dance floor
    const now = Date.now();
    for (const p of alive) { const q = posAt(p.O, now); if (chairKey(q.x, q.y) >= 0) walkTo(I, p.O, rint(AREA[0], AREA[2]), rint(AREA[1], AREA[3]), now); }
    g.ph = 'music'; g.t = now + 7000 + rint(0, 9000); g.music = rint(0, 5);
    roomSend(I, { t: 'jwJuke', tune: g.music, game: 1 });
    gameSend(I);
  }
  function stop() {
    g.ph = 'scram'; g.t = Date.now() + 6000; rebuild(I); gameSend(I); roomSend(I, { t: 'jwJuke', tune: -1 });
    for (const p of g.pl.values()) if (p.bot && !p.out) setTimeout(() => botChair(p), 350 + rint(0, 1300));
  }
  function botChair(p) {
    if (g.ph !== 'scram' || p.out) return;
    const O = p.O, now = Date.now(), at = posAt(O, now);
    const free = g.chairs.map((c, i) => ({ c, i, d: Math.hypot(c.x - at.x, c.y - at.y) })).filter(o => !g.claims.has(o.i)).sort((a, b) => a.d - b.d);
    if (free.length) { walkTo(I, O, free[0].c.x, free[0].c.y, now); setTimeout(() => botChair(p), 1200 + rint(0, 800)); }
  }
  function result() {
    const now = Date.now(), seated = new Set();
    for (const [ci, v] of g.claims) { if (v.T <= now + 50) seated.add(v.id); }
    const outs = [];
    for (const p of g.pl.values()) if (!p.out && !seated.has(p.id)) { p.out = true; outs.push(p.n); }
    g.ph = 'result'; g.t = now + 3500; g.res = { outs }; gameSend(I);
  }
  function finish(w) {
    g.ph = 'end'; g.t = Date.now() + 8000; g.busy = false; g.chairs = null; rebuild(I);
    const pays = {};
    for (const p of g.pl.values()) if (!p.bot && p.O && p.O.ws && I.occ.get(p.id) === p.O) { let amt = pay(p.O, 'jwplay', 'Musical Chairs on the Rooftop'); if (w && w.id === p.id && g.humans >= 2) amt += pay(p.O, 'jwwin', 'Won Musical Chairs!'); pays[p.id] = amt; }
    g.res = { win: w ? w.n : '', winId: w ? w.id : 0, pays };
    gameSend(I);
    if (w) roomSend(I, { t: 'jwSay', id: 0, nick: 'DJ Spinz', s: `${w.n} WINS MUSICAL CHAIRS!!! Give it up for ${w.n}!`, k: 'npc' });
    setTimeout(() => { if (g.ph === 'end') dropBots(I); }, 6000);
  }
  g.tick = now => {
    if (g.ph === 'lobby' && now >= g.t) { if (g.pl.size >= 1) begin(); else g.reset(); }
    else if (g.ph === 'music') { if (now >= g.t) stop(); else for (const p of g.pl.values()) if (p.bot && !p.out && !posAt(p.O, now).moving && rnd() < 0.15) botWalkRandom(I, p.O, AREA); }
    else if (g.ph === 'scram' && now >= g.t) result();
    else if (g.ph === 'result' && now >= g.t) round();
    else if (g.ph === 'end' && now >= g.t) { g.ph = 'idle'; g.pl.clear(); g.res = null; gameSend(I); }
    if (g.ph !== 'idle' && g.ph !== 'end' && ![...g.pl.values()].some(p => !p.bot && I.occ.get(p.id) === p.O)) g.reset();
  };
  g.reset = () => { g.ph = 'idle'; g.pl.clear(); g.claims.clear(); g.chairs = null; g.busy = false; rebuild(I); dropBots(I); gameSend(I); };
  g.left = id => { const p = g.pl.get(id); if (p && g.ph === 'lobby') g.pl.delete(id); else if (p) p.out = true; };
  g.act = (O, m) => { if (m.a === 'start') g.start(O); else if (m.a === 'join') g.join(O); };
  g.joined = O => { if (O.ws) ctx.send(O.ws, { t: 'jwG', g: g.view() }); };
  return g;
}
// ---- Snowball Fight: make snowballs, click on people to throw them
function snowGame(I) {
  const g = { k: 'snow', ph: 'idle', t: 0, sc: new Map(), busy: false, res: null };
  g.view = () => ({ k: 'snow', ph: g.ph, t: g.t, sc: [...g.sc.values()].sort((a, b) => b.p - a.p).map(s => ({ id: s.id, n: s.n, p: s.p, b: s.O && s.O.balls | 0 })), res: g.res, now: Date.now() });
  const S = O => { let s = g.sc.get(O.id); if (!s) { s = { id: O.id, n: O.nick, p: 0, O }; g.sc.set(O.id, s); } s.O = O; return s; };
  function begin() {
    g.ph = 'play'; g.t = Date.now() + 90000; g.sc.clear(); g.res = null; g.busy = true;
    for (const O of I.occ.values()) { O.balls = 0; S(O); }
    const hum = humans(I).length;
    for (let i = 0; humans(I).length && [...I.occ.values()].length < 3 && i < 2; i++) { const B = addBot(I, i); B.balls = 1; S(B); }
    g.humans = hum; gameSend(I);
  }
  function end() {
    g.ph = 'end'; g.t = Date.now() + 10000; g.busy = false;
    const list = [...g.sc.values()].sort((a, b) => b.p - a.p), top = list[0], pays = {};
    for (const s of list) { if (!s.O || !s.O.ws || I.occ.get(s.id) !== s.O) continue; let amt = 0; if (s.p >= 3) amt += pay(s.O, 'jwplay', `Snowball Fight: ${s.p} hits`); if (s === top && s.p >= 5 && g.humans >= 2 && (!list[1] || list[1].p < s.p)) amt += pay(s.O, 'jwwin', 'Won the Snowball Fight!'); pays[s.id] = amt; }
    g.res = { win: top && top.p > 0 ? top.n : '', p: top ? top.p : 0, pays }; gameSend(I);
    setTimeout(() => { if (g.ph === 'end') dropBots(I); }, 7000);
  }
  function make(O) {
    const now = Date.now(); if (O.making || (O.balls | 0) >= 5 || O.dazed > now || posAt(O, now).moving) return;
    O.making = now + 1200; O.emo = ''; roomSend(I, { t: 'jwEmo', id: O.id, e: 'make' });
  }
  function hitTest(from, lx, ly, T) {
    for (const O of I.occ.values()) {
      if (O.id === from.id) continue;
      const q = posAt(O, T); if (Math.hypot(q.fx - lx, q.fy - ly) > 0.7) continue;
      O.dazed = Date.now() + 2200; const at = posAt(O, Date.now()); stopAt(O, at.x, at.y);
      roomSend(I, { t: 'jwMv', id: O.id, p: [[at.x, at.y]], d: 0 });
      if (g.ph === 'play') S(from).p++;
      roomSend(I, { t: 'jwHit', id: O.id, by: from.id, x: lx, y: ly }); gameSend(I);
      return true;
    }
    roomSend(I, { t: 'jwSplat', x: lx, y: ly }); return false;
  }
  function throwAt(O, m) {
    const now = Date.now(); if ((O.balls | 0) < 1 || O.dazed > now) return;
    if (!O.thB) O.thB = new ctx.Bucket(1.5, 2); if (!O.thB.take()) return;
    const me = posAt(O, now); let tx, ty;
    const T = m.id != null ? I.occ.get(m.id | 0) : null;
    if (T && T !== O) { const q = posAt(T, now); tx = q.fx; ty = q.fy; } else if (Number.isFinite(+m.x) && Number.isFinite(+m.y)) { tx = +m.x; ty = +m.y; } else return;
    const dist = Math.hypot(tx - me.fx, ty - me.fy); if (dist > 8 || dist < 0.5) return;
    O.balls--; const fl = 280 + dist * 75;
    roomSend(I, { t: 'jwBall', id: O.id, x0: me.fx, y0: me.fy, x1: tx, y1: ty, T: fl });
    setTimeout(() => { if (LIVE.get(I.id) === I) hitTest(O, tx, ty, Date.now()); }, fl);
    gameSend(I);
  }
  g.tick = now => {
    for (const O of I.occ.values()) if (O.making && now >= O.making) { O.making = 0; O.balls = Math.min(5, (O.balls | 0) + 1); if (O.ws) ctx.send(O.ws, { t: 'jwBalls', n: O.balls }); }
    if (g.ph === 'idle' && humans(I).length) begin();
    else if (g.ph === 'play') {
      if (now >= g.t) end();
      for (const O of I.occ.values()) if (O.bot && !(O.dazed > now)) {
        if ((O.balls | 0) === 0 && !O.making && !posAt(O, now).moving && rnd() < 0.3) make(O);
        else if (O.balls > 0 && rnd() < 0.09) { const hs = humans(I); if (hs.length) { const T = pick(hs), q = posAt(T, now), me = posAt(O, now); if (Math.hypot(q.fx - me.fx, q.fy - me.fy) <= 7) throwAt(O, { x: q.fx + (rnd() - 0.5) * 1.6, y: q.fy + (rnd() - 0.5) * 1.6 }); else botWalkRandom(I, O); } }
        else if (!posAt(O, now).moving && !O.making && rnd() < 0.06) botWalkRandom(I, O);
      }
      if (!humans(I).length) g.reset();
    } else if (g.ph === 'end' && now >= g.t) { g.ph = 'idle'; g.res = null; gameSend(I); }
  };
  g.reset = () => { g.ph = 'idle'; g.sc.clear(); g.busy = false; dropBots(I); };
  g.left = id => { g.sc.delete(id); };
  g.joined = O => { O.balls = 0; if (g.ph === 'play') S(O); if (O.ws) ctx.send(O.ws, { t: 'jwG', g: g.view() }); };
  g.act = (O, m) => { if (m.a === 'make') make(O); else if (m.a === 'throw') throwAt(O, m); };
  return g;
}
function game(ws, c, m) { const I = roomFor(c); if (!I || !I.game) return; const O = I.occ.get(c.id); if (!O) return; I.game.act(O, m); }

// ================================================================ the clock
function tick() {
  const now = Date.now();
  for (const I of LIVE.values()) {
    for (const O of I.occ.values()) { if (!O.arrived && O.path && now >= O.t0 + STEP * (O.path.length - 1)) { O.arrived = true; try { arrive(I, O); } catch (e) { console.error('jw arrive', e); } } }
    if (I.game && I.game.tick) { try { I.game.tick(now); } catch (e) { console.error('jw game', e); } }
    for (const [vid, r] of I.ring) if (now - r.at > 30000) { I.ring.delete(vid); ctx.send(r.ws, { t: 'jwNo', r: I.id, why: 'noanswer', n: I.def.pub ? '' : I.def.R.n }); }
    if (!I.occ.size && !(I.game && I.game.busy) && now - I.made > 60000) { if (I.game) gameReset(I); LIVE.delete(I.id); }
  }
}

// ================================================================ the wire
function handle(ws, c, m) {
  if (!c.jwB) c.jwB = new ctx.Bucket(10, 30);
  if (!c.jwB.take()) return;
  // somebody logged on or off since they came in: keep their name tag (and room rights) honest
  const I = roomFor(c), O = I && I.occ.get(c.id);
  if (O && (O.nick !== c.nick || O.member !== !!c.member)) {
    O.nick = c.nick; O.member = !!c.member; O.key = keyOfC(c); if (O.key && C.avOk(P(O.key).av)) O.av = P(O.key).av;
    if (!I.def.pub && !c.member) { const L = inst('lobby'); if (L) enter(ws, c, L, ''); }
    else roomSend(I, { t: 'jwAv', id: c.id, av: O.av, nick: O.nick, m: O.member ? 1 : 0 });
  }
  switch (m.t) {
    case 'jwMe': return ctx.send(ws, meView(c));
    case 'jwInfo': return info(ws);
    case 'jwGo': return go(ws, c, m);
    case 'jwOut': return leave(c);
    case 'jwWalk': if (!c.jwWB) c.jwWB = new ctx.Bucket(5, 10); if (!c.jwWB.take()) return; return walk(ws, c, m);
    case 'jwSay': return say(ws, c, m);
    case 'jwEmo': if (!c.jwEB) c.jwEB = new ctx.Bucket(1, 4); if (!c.jwEB.take()) return; return emote(ws, c, m);
    case 'jwAv': {
      if (!C.avOk(m.av)) return;
      const key = keyOfC(c); if (key) { P(key).av = m.av.slice(); ctx.markDirty(); } else c.jwAv = m.av.slice();
      if (O) { O.av = m.av.slice(); roomSend(I, { t: 'jwAv', id: c.id, av: O.av, nick: O.nick, m: O.member ? 1 : 0 }); }
      return ctx.send(ws, { t: 'jwAvOk' });
    }
    case 'jwMake': return make(ws, c, m);
    case 'jwSet': return setRoom(ws, c, m);
    case 'jwStyle': return style(ws, c, m);
    case 'jwBuy': if (!c.jwBuyB) c.jwBuyB = new ctx.Bucket(1, 3); if (!c.jwBuyB.take()) return; return buy(ws, c, m);
    case 'jwPlace': if (!c.jwFB) c.jwFB = new ctx.Bucket(4, 10); if (!c.jwFB.take()) return; return place(ws, c, m);
    case 'jwPick': if (!c.jwFB) c.jwFB = new ctx.Bucket(4, 10); if (!c.jwFB.take()) return; return pickUp(ws, c, m);
    case 'jwUse': if (!c.jwUB) c.jwUB = new ctx.Bucket(2, 5); if (!c.jwUB.take()) return; return use(ws, c, m);
    case 'jwNav': return nav(ws, c, m);
    case 'jwLike': return like(ws, c, m);
    case 'jwGb': case 'jwSign': case 'jwGbDel': return gb(ws, c, m);
    case 'jwAnswer': return answer(ws, c, m);
    case 'jwKick': return kick(ws, c, m);
    case 'jwKey': return keys(ws, c, m);
    case 'jwReport': return report(ws, c, m);
    case 'jwStaff': return staff(ws, c, m);
    case 'jwGame': if (!c.jwGB) c.jwGB = new ctx.Bucket(4, 8); if (!c.jwGB.take()) return; return game(ws, c, m);
  }
}

module.exports = {
  name: 'jw',
  types: ['jwMe', 'jwInfo', 'jwGo', 'jwOut', 'jwWalk', 'jwSay', 'jwEmo', 'jwAv', 'jwMake', 'jwSet', 'jwStyle', 'jwBuy', 'jwPlace', 'jwPick', 'jwUse', 'jwNav', 'jwLike', 'jwGb', 'jwSign', 'jwGbDel', 'jwAnswer', 'jwKick', 'jwKey', 'jwReport', 'jwStaff', 'jwGame'],
  init(x) {
    ctx = x; D = x.data; initData();
    E = ECON.api; if (!E || !E.earnA) { console.error('jw: econ is missing'); return; }
    for (const k in EARN_ADD) if (!ECAT.EARN[k]) ECAT.EARN[k] = EARN_ADD[k];
    // furni that went missing from a room owner's chest (traded away, deleted member) leaves their room on start-up
    try { const L = LA(); if (L) for (const R of Object.values(D.rooms)) { if (!ctx.state.members[R.o]) continue; const lp = L.P(R.o); R.f = R.f.filter(f => { const it = L.findItem(lp, f.u); if (it && !it.lk) it.lk = 'jw'; return !!it && it.lk === 'jw'; }); } } catch (e) { console.error('jw: furni check', e); }
    x.on('close', c => { if (c.jwRoom) leave(c); });
    x.on('login', c => { for (const [ws, cc] of ctx.clients) if (cc === c) ctx.send(ws, meView(c)); });
    setInterval(tick, 150);
    setInterval(() => { try { weekly(); } catch (e) { console.error('jw weekly', e); } }, 60000); setTimeout(weekly, 3000);
  },
  handle,
  _test: { get D() { return D; }, LIVE, posAt, inst, weekly, fits },
};
