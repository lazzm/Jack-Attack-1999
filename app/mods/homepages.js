/* Homepagez: JackNet members' own homepages (built with Homepagez PageBuilder, see public/js/homepages*.js).
 * One page per member, keyed by lower-case member name. A page is structured data (blocks), never HTML: every field is
 * validated here (types, lengths, enums from fixed lists, colours from a palette, links matched against the fake TLDs)
 * and everything else is thrown away. Text goes through clean() + delink() like the rest of the site.
 * The index (titles, addresses, hit counters) lives in state.mods.homepages; page bodies + guestbooks + polls live in
 * DATA_DIR/homepages/<name>.json so the 5-second state save stays small.
 *   client -> { t:'hpzPut', id, i, n, d, rid }        page JSON, UTF-8, base64, in chunks of <= 3000 chars (4 KB socket limit)
 *          <- { t:'hpzPublished', rid, ok, err?, page, addr, url, stripped, created, size }
 *   client -> { t:'hpzGet', rid, name | addr, visit } <- { t:'hpzPage', rid, page|null, n, a, hits, gb, poll, mine, c, u }
 *   client -> { t:'hpzList', rid, what: hood|new|top|upd|all|ring, hood } <- { t:'hpzList', rid, what, items, total, hoods }
 *   client -> { t:'hpzSign', rid, name, text, from, how } <- { t:'hpzGb', rid, ok, n, gb, err? }  (others get hpzGbNew)
 *   client -> { t:'hpzVote', rid, name, i }            <- { t:'hpzPoll', rid, n, v, mine }       (others get hpzPollNew)
 *   client -> { t:'hpzDel', rid }  (your own page)  |  { t:'hpzGbDel', rid, name, id } (an entry on your own page)
 *   moderation: member "Jack" (a reserved name only the admin can claim) may delete any page or entry, and so may anyone
 *   holding ADMIN_TOKEN:  { t:'hpzAdmin', token, act: 'del'|'gbdel'|'list', name, id }  <- { t:'hpzOk', ... } */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const H = require('../public/js/homepages.js');

const DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'homepages');
const L = H.LIMITS;
const CHUNK = 3000, MAX_B64 = 48000;
const KEY_RE = /^[a-z0-9_-]{2,16}$/;
const HOODS = Object.keys(H.HOODS);
const set = list => new Set(H.ids(list));
const PAL = set(H.PALETTE), FONTS = set(H.FONTS), BGS = set(H.BGS), TUNES = set(H.TUNES), HRS = set(H.HRS), UCS = set(H.UCS),
  STICK = new Set(H.STICKERS), CTRS = set(H.COUNTERS), BADGES = set(H.BADGES), RINGS = set(H.RINGS), HOWS = set(H.HOWS), BULL = set(H.BULLETS), ALIGN = new Set(H.ALIGNS);
const TAKEN = new Set(H.TAKEN);
let ctx;

// ---------------------------------------------------------------- storage
const cache = new Map(); // key -> body { page, gb, poll }
const dirtyBodies = new Set();
const fileOf = key => path.join(DIR, key + '.json');
function readBody(key) {
  if (!KEY_RE.test(key)) return null;
  if (cache.has(key)) return cache.get(key);
  let b = null;
  try { b = JSON.parse(fs.readFileSync(fileOf(key), 'utf8')); } catch { b = null; }
  if (b) cache.set(key, b);
  return b;
}
function writeBody(key, body) {
  if (!KEY_RE.test(key)) return;
  cache.set(key, body); dirtyBodies.delete(key);
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const f = fileOf(key), tmp = f + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(body));
    fs.renameSync(tmp, f);
  } catch (e) { console.error('homepages: save failed', key, e.message); dirtyBodies.add(key); }
}
function dropBody(key) { cache.delete(key); dirtyBodies.delete(key); try { fs.unlinkSync(fileOf(key)); } catch {} }
const idx = () => (ctx.data.idx = ctx.data.idx || {}); // key -> { n, t, a, hood, h, c, u, g }
const addrMap = new Map(); // 'spacecity/launchpad/4023' -> key
function reindex() { addrMap.clear(); for (const [k, e] of Object.entries(idx())) if (e && e.a) addrMap.set(e.a.toLowerCase(), k); }
const alive = key => !!(ctx.state.members[key]); // pages of deleted members quietly disappear

// ---------------------------------------------------------------- sanitising
const str = v => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const unZalgo = s => s.replace(/(\p{M}{3})\p{M}+/gu, '$1');
const line = (v, max) => ctx.delink(ctx.clean(unZalgo(str(v)), max)).slice(0, max + 16);
function para(v, max) {
  const lines = unZalgo(str(v)).slice(0, max * 2).split(/\r?\n/).slice(0, 15).map(l => ctx.clean(l, max));
  return ctx.delink(lines.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)).slice(0, max + 16);
}
const en = (v, s, d) => (typeof v === 'string' && s.has(v) ? v : d);
const col = (v, d) => { const c = str(v).toLowerCase(); return PAL.has(c) ? c : d; };
const int = (v, lo, hi, d) => { const n = Math.floor(+v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const arr = v => (Array.isArray(v) ? v : []);

function block(b, out) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  const k = b.k, a = en(b.a, ALIGN, undefined), c = col(b.c, undefined), f = en(b.f, FONTS, undefined);
  const o = { k };
  const opt = (key, v) => { if (v !== undefined && v !== '') o[key] = v; };
  switch (k) {
    case 'h': o.t = line(b.t, 80); if (!o.t) return null; o.s = int(b.s, 1, 4, 2); opt('a', a || 'c'); opt('c', c); opt('f', f); break;
    case 'p': o.t = para(b.t, L.text); if (!o.t) return null; opt('a', a); opt('c', c); opt('f', f); break;
    case 'mq': o.t = line(b.t, 150); if (!o.t) return null; o.d = en(b.d, new Set(['l', 'r', 'b']), 'l'); o.sp = en(b.sp, new Set(['s', 'm', 'f']), 'm'); opt('c', c); opt('bc', col(b.bc, undefined)); opt('f', f); break;
    case 'bl': o.t = line(b.t, 100); if (!o.t) return null; opt('a', a || 'c'); opt('c', c); opt('f', f); break;
    case 'hr': o.st = en(b.st, HRS, 'groove'); break;
    case 'uc': o.st = en(b.st, UCS, 'sign'); opt('t', line(b.t, 80)); break;
    case 'st': o.s = [...new Set(arr(b.s).filter(x => typeof x === 'string' && STICK.has(x)))].slice(0, L.stickers); if (!o.s.length) return null; o.z = int(b.z, 1, 4, 3); if (b.sp === true) o.sp = true; opt('a', a || 'c'); break;
    case 'ct': o.st = en(b.st, CTRS, 'odo'); o.l = int(b.l, 0, H.CLABELS.length - 1, 0); opt('a', a || 'c'); break;
    case 'gb': if (out.gb) return null; out.gb = true; opt('t', line(b.t, 60)); break;
    case 'ln': {
      opt('h', line(b.h, 60));
      const raw = arr(b.l); o.l = [];
      for (const x of raw.slice(0, L.links)) { const u = x && typeof x === 'object' ? H.normUrl(x.u) : ''; if (!u) { out.stripped++; continue; } const t = line(x.t, 60); o.l.push(t ? { u, t } : { u }); }
      if (raw.length > L.links) out.stripped += raw.length - L.links;
      if (!o.l.length) return null;
      break;
    }
    case 'ul': opt('h', line(b.h, 60)); o.it = arr(b.it).slice(0, L.items).map(x => line(x, 80)).filter(Boolean); if (!o.it.length) return null; o.bu = en(b.bu, BULL, 'dot'); opt('c', c); break;
    case 'ring': o.r = en(b.r, RINGS, 'hpz'); break;
    case 'bdg': o.b = [...new Set(arr(b.b).filter(x => typeof x === 'string' && BADGES.has(x)))].slice(0, L.badges); if (!o.b.length) return null; opt('a', a || 'c'); break;
    case 'poll': if (out.poll) return null; o.q = line(b.q, 100); o.o = arr(b.o).slice(0, L.opts).map(x => line(x, 40)).filter(Boolean); if (!o.q || o.o.length < 2) return null; out.poll = true; break;
    case 'mail': opt('t', line(b.t, 60)); opt('a', a || 'c'); break;
    default: return null;
  }
  return o;
}

function sanitize(raw, name) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { err: 'That page is all scrambled. Try again!' };
  const out = { stripped: 0, gb: false, poll: false };
  const p = {};
  p.title = line(raw.title, 60) || `${name}'s Homepage`;
  p.hood = HOODS.includes(raw.hood) ? raw.hood : null;
  if (!p.hood) return { err: 'Pick a neighbourhood for your page first (Page tab).' };
  p.street = H.HOODS[p.hood].streets.includes(raw.street) ? raw.street : null;
  if (!p.street) return { err: 'Pick a street in ' + p.hood + ' (Page tab).' };
  p.num = int(raw.num, 1, 9999, 0);
  if (!p.num) return { err: 'Your house number must be between 1 and 9999.' };
  p.bg = en(raw.bg, BGS, 'none'); p.bgc = col(raw.bgc, '#ffffff'); p.tc = col(raw.tc, '#000000'); p.lc = col(raw.lc, '#0000ff');
  p.font = en(raw.font, FONTS, 'times'); p.midi = en(raw.midi, TUNES, 'none');
  p.blocks = [];
  const list = arr(raw.blocks);
  for (const b of list.slice(0, L.blocks)) { const s = block(b, out); if (s) p.blocks.push(s); else out.stripped++; }
  if (list.length > L.blocks) out.stripped += list.length - L.blocks;
  const size = JSON.stringify(p).length;
  if (size > L.json) return { err: `Your page is too big! It is ${Math.ceil(size / 1024)} KB and Homepagez only lets each page have ${Math.floor(L.json / 1024)} KB. (The other 1.98 MB is for the adverts.) Take some bits out and try again.` };
  return { page: p, stripped: out.stripped, size };
}

// ---------------------------------------------------------------- helpers
const pubRl = new Map(), signIp = new Map(), seen = new Map(), visitIp = new Map(); // module-level, so reconnecting doesn't reset them
const voterOf = c => c.cid ? 'c:' + c.cid : 'ip:' + c.ip;
const isMod = c => !!(c.member && c.member.toLowerCase() === 'jack');
const pollKey = b => crypto.createHash('sha1').update(JSON.stringify([b.q, b.o])).digest('hex').slice(0, 12);
const summary = (k, e) => ({ n: e.n, k, t: e.t, a: e.a, hood: e.hood, h: e.h, c: e.c, u: e.u, g: e.g });
function rl(c, name, rate, burst) { c.hpzRl = c.hpzRl || {}; if (!c.hpzRl[name]) c.hpzRl[name] = new ctx.Bucket(rate, burst); return c.hpzRl[name].take(); }
function keyOf(m) {
  if (typeof m.name === 'string') { const k = m.name.toLowerCase().replace(/^~/, '').slice(0, 16); return KEY_RE.test(k) ? k : null; }
  if (typeof m.addr === 'string') return addrMap.get(m.addr.toLowerCase().replace(/^\/+|\/+$/g, '').slice(0, 60)) || null;
  return null;
}
const ridOf = m => (Number.isInteger(m.rid) && m.rid > 0 && m.rid < 1e9 ? m.rid : 0);
function countVisit(c, key, e) {
  const now = Date.now(), vk = voterOf(c) + '|' + key;
  if (now - (seen.get(vk) || 0) < 30 * 60000) return;
  const recent = (visitIp.get(c.ip) || []).filter(t => now - t < 10 * 60000);
  if (recent.length >= 40) return;
  recent.push(now); visitIp.set(c.ip, recent); seen.set(vk, now);
  e.h = (e.h || 0) + 1; ctx.markDirty();
  if (ctx.emit) ctx.emit('hpVisit', c, key); // the owner earns a few Rupees (mods/econ.js)
}
function pollView(body, c) { if (!body.poll) return null; const mine = body.poll.who[voterOf(c)]; return { v: body.poll.v, mine: mine === undefined ? -1 : mine }; }
function removePage(key) {
  const e = idx()[key]; if (!e) return false;
  if (e.a) addrMap.delete(e.a.toLowerCase());
  delete idx()[key]; dropBody(key); ctx.markDirty();
  return true;
}
function delEntry(key, id) {
  const body = readBody(key); if (!body) return false;
  const n = body.gb.length; body.gb = body.gb.filter(x => x.id !== id);
  if (body.gb.length === n) return false;
  writeBody(key, body); const e = idx()[key]; if (e) { e.g = body.gb.length; ctx.markDirty(); }
  return true;
}

// ---------------------------------------------------------------- handlers
function publish(ws, c, m) {
  const rid = ridOf(m);
  const fail = err => ctx.send(ws, { t: 'hpzPublished', rid, ok: false, err });
  if (!c.member) return fail('You need to log on to JackNet to publish a homepage. (Membership is FREE!)');
  const id = String(m.id || '').slice(0, 20), i = m.i | 0, n = m.n | 0, d = typeof m.d === 'string' ? m.d : '';
  if (n > Math.ceil(MAX_B64 / CHUNK)) return i === 0 ? fail(`Your page is too big! Homepagez only lets each page have ${Math.floor(L.json / 1024)} KB. Take some bits out and try again.`) : undefined;
  if (!id || n < 1 || i < 0 || i >= n || d.length > CHUNK || !/^[A-Za-z0-9+/=]*$/.test(d)) return fail('The upload got scrambled. Try again.');
  const key = c.member.toLowerCase();
  if (i === 0) {
    if (!rl(c, 'put', 0.5, 6)) return fail('421 Too many uploads! Wait a few seconds and try again.');
    if (!pubRl.has(key)) pubRl.set(key, new ctx.Bucket(1 / 20, 3));
    if (!pubRl.get(key).take()) return fail('421 Too many uploads! The Homepagez server needs a rest. Wait 20 seconds and try again.');
    pubRl.get(key).take(-1); // only a page that really gets published uses up a publish (see below)
    c.hpzUp = { id, n, parts: new Array(n), got: 0, who: key };
  }
  const up = c.hpzUp;
  if (!up || up.id !== id || up.n !== n || up.who !== key || up.parts[i] !== undefined) return;
  up.parts[i] = d; up.got++;
  if (up.got < n) return;
  c.hpzUp = null;
  let raw;
  try { raw = JSON.parse(Buffer.from(up.parts.join(''), 'base64').toString('utf8')); } catch { return fail('The upload got scrambled. Try again.'); }
  const mem = ctx.state.members[key]; if (!mem) return fail('Who are you? (Log on again.)');
  const r = sanitize(raw, mem.name);
  if (r.err) return fail(r.err);
  const p = r.page, ak = H.addrKey(p.hood, p.street, p.num), a = H.addrText(p.hood, p.street, p.num);
  if (TAKEN.has(ak)) return fail(`Somebody already lives at ${a}! Pick a different house number. (Houses marked FOR RENT are free.)`);
  const other = addrMap.get(ak);
  if (other && other !== key && alive(other)) return fail(`~${idx()[other].n} already lives at ${a}! Pick a different house number.`);
  if (!pubRl.get(key).take()) return fail('421 Too many uploads! The Homepagez server needs a rest. Wait 20 seconds and try again.');
  const now = Date.now(), old = idx()[key], isNew = !old;
  const body = readBody(key) || { gb: [], poll: null };
  body.page = p; body.gb = Array.isArray(body.gb) ? body.gb : [];
  const pb = p.blocks.find(b => b.k === 'poll');
  if (!pb) body.poll = null;
  else { const pk = pollKey(pb); if (!body.poll || body.poll.k !== pk) body.poll = { k: pk, v: pb.o.map(() => 0), who: {} }; }
  if (old && old.a) addrMap.delete(old.a.toLowerCase());
  if (other && other !== key) removePage(other); // a deleted member's page was squatting there
  idx()[key] = { n: mem.name, t: p.title, a, hood: p.hood, h: old ? old.h || 0 : 0, c: old ? old.c : now, u: now, g: body.gb.length };
  addrMap.set(ak, key);
  writeBody(key, body); ctx.markDirty();
  ctx.send(ws, { t: 'hpzPublished', rid, ok: true, page: p, addr: a, url: 'http://www.homepagez.webcom/' + a + '/', stripped: r.stripped, created: isNew, size: r.size, hits: idx()[key].h });
  if (isNew) {
    ctx.pushChat({ sys: true, text: `*** ${mem.name} just moved into ${a} on Homepagez! Go and sign their guestbook!`, ts: now });
    ctx.broadcast({ t: 'hpzNew', n: mem.name, a, title: p.title });
  }
}

function get(ws, c, m) {
  const rid = ridOf(m);
  if (!rl(c, 'get', 3, 20)) return ctx.send(ws, { t: 'hpzErr', rid, err: 'Slow down! (Too many pages too fast.)' });
  const key = keyOf(m), e = key && idx()[key];
  if (!e || !alive(key)) return ctx.send(ws, { t: 'hpzPage', rid, page: null, q: typeof m.name === 'string' ? m.name.slice(0, 16) : typeof m.addr === 'string' ? m.addr.slice(0, 60) : '' });
  const body = readBody(key);
  if (!body || !body.page) return ctx.send(ws, { t: 'hpzPage', rid, page: null });
  const mine = !!(c.member && c.member.toLowerCase() === key);
  if (m.visit && !mine) countVisit(c, key, e);
  ctx.send(ws, { t: 'hpzPage', rid, n: e.n, k: key, a: e.a, page: body.page, hits: e.h || 0, gb: body.gb.slice(-L.gb), poll: pollView(body, c), mine, mod: isMod(c), c: e.c, u: e.u, no: (ctx.state.members[key] || {}).no || 0 });
}

function list(ws, c, m) {
  const rid = ridOf(m);
  if (!rl(c, 'get', 3, 20)) return ctx.send(ws, { t: 'hpzErr', rid, err: 'Slow down! (Too many pages too fast.)' });
  const all = Object.entries(idx()).filter(([k, e]) => e && alive(k)).map(([k, e]) => summary(k, e));
  const hoods = {}; for (const h of HOODS) hoods[h] = 0; for (const x of all) hoods[x.hood] = (hoods[x.hood] || 0) + 1;
  const what = ['hood', 'new', 'top', 'upd', 'all', 'ring'].includes(m.what) ? m.what : 'new';
  let items;
  if (what === 'hood') { const hood = HOODS.includes(m.hood) ? m.hood : HOODS[0]; items = all.filter(x => x.hood === hood).sort((a, b) => a.a.localeCompare(b.a, 'en', { numeric: true })); }
  else if (what === 'new') items = all.sort((a, b) => b.c - a.c).slice(0, 30);
  else if (what === 'top') items = all.sort((a, b) => b.h - a.h || a.c - b.c).slice(0, 30);
  else if (what === 'upd') items = all.sort((a, b) => b.u - a.u).slice(0, 30);
  else if (what === 'ring') items = all.sort((a, b) => a.c - b.c).slice(0, 500).map(x => ({ n: x.n, k: x.k, t: x.t, a: x.a }));
  else items = all.sort((a, b) => a.k.localeCompare(b.k)).slice(0, 500);
  ctx.send(ws, { t: 'hpzList', rid, what, hood: what === 'hood' ? (HOODS.includes(m.hood) ? m.hood : HOODS[0]) : undefined, items, total: all.length, hoods });
}

function sign(ws, c, m) {
  const rid = ridOf(m);
  const fail = err => ctx.send(ws, { t: 'hpzGb', rid, ok: false, err });
  const key = keyOf(m), e = key && idx()[key], body = e && alive(key) && readBody(key);
  if (!body || !body.page) return fail('That homepage has gone! (Maybe it moved?)');
  if (!body.page.blocks.some(b => b.k === 'gb')) return fail('This page does not have a guestbook.');
  const text = line(m.text, L.gbText);
  if (!text) return fail('Write something in the guestbook first!');
  const now = Date.now();
  if (now - (signIp.get(c.ip) || 0) < 15000 || !rl(c, 'sign', 1 / 30, 2)) return fail('Whoa, slow down! You can sign a guestbook every 30 seconds or so.');
  signIp.set(c.ip, now);
  const ent = { id: now.toString(36) + crypto.randomBytes(3).toString('hex'), by: String(c.nick || 'Guest').slice(0, 20), m: !!c.member, text, ts: now };
  const from = line(m.from, 30); if (from) ent.from = from;
  const how = en(m.how, HOWS, ''); if (how) ent.how = how;
  body.gb.push(ent); if (body.gb.length > L.gb) body.gb.splice(0, body.gb.length - L.gb);
  e.g = body.gb.length; ctx.markDirty(); writeBody(key, body);
  ctx.send(ws, { t: 'hpzGb', rid, ok: true, n: key, gb: body.gb, e: ent });
  ctx.broadcast({ t: 'hpzGbNew', n: key, e: ent }, ws);
}

function vote(ws, c, m) {
  const rid = ridOf(m);
  if (!rl(c, 'vote', 1, 5)) return;
  const key = keyOf(m), e = key && idx()[key], body = e && alive(key) && readBody(key);
  if (!body || !body.poll) return ctx.send(ws, { t: 'hpzPoll', rid, n: key, v: null });
  const p = body.poll, who = voterOf(c), i = int(m.i, 0, p.v.length - 1, -1);
  if (i >= 0 && p.who[who] === undefined && Object.keys(p.who).length < 5000) { p.v[i]++; p.who[who] = i; dirtyBodies.add(key); ctx.broadcast({ t: 'hpzPollNew', n: key, v: p.v }, ws); }
  ctx.send(ws, { t: 'hpzPoll', rid, n: key, v: p.v, mine: p.who[who] === undefined ? -1 : p.who[who] });
}

function adminOk(c, m) {
  if (isMod(c)) return true;
  const tok = String(m.token || ''), want = process.env.ADMIN_TOKEN || '';
  if (!want || !rl(c, 'admin', 0.2, 3)) return false;
  return tok.length === want.length && crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(want));
}

module.exports = {
  name: 'homepages',
  types: ['hpzPut', 'hpzGet', 'hpzList', 'hpzSign', 'hpzVote', 'hpzDel', 'hpzGbDel', 'hpzAdmin'],
  init(c) {
    ctx = c;
    try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) { console.error('homepages: cannot create', DIR, e.message); }
    idx(); reindex();
    const flush = setInterval(() => { for (const k of [...dirtyBodies]) { const b = cache.get(k); if (b) writeBody(k, b); else dirtyBodies.delete(k); } }, 3000);
    const prune = setInterval(() => {
      const now = Date.now();
      for (const [k, t] of seen) if (now - t > 30 * 60000) seen.delete(k);
      for (const [ip, l] of visitIp) if (!l.some(t => now - t < 10 * 60000)) visitIp.delete(ip);
      for (const [ip, t] of signIp) if (now - t > 60000) signIp.delete(ip);
      if (cache.size > 300) for (const k of [...cache.keys()].slice(0, cache.size - 200)) if (!dirtyBodies.has(k)) cache.delete(k);
    }, 10 * 60000);
    if (flush.unref) flush.unref(); if (prune.unref) prune.unref();
    process.on('exit', () => { for (const k of dirtyBodies) { const b = cache.get(k); if (b) try { fs.writeFileSync(fileOf(k), JSON.stringify(b)); } catch {} } });
  },
  handle(ws, c, m) {
    switch (m.t) {
      case 'hpzPut': return publish(ws, c, m);
      case 'hpzGet': return get(ws, c, m);
      case 'hpzList': return list(ws, c, m);
      case 'hpzSign': return sign(ws, c, m);
      case 'hpzVote': return vote(ws, c, m);
      case 'hpzDel': {
        if (!c.member) return;
        const ok = removePage(c.member.toLowerCase());
        return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'del', ok });
      }
      case 'hpzGbDel': {
        const key = keyOf(m); if (!key) return;
        if (!(c.member && c.member.toLowerCase() === key) && !isMod(c)) return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'gbdel', ok: false });
        const ok = delEntry(key, String(m.id || '').slice(0, 30));
        return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'gbdel', ok });
      }
      case 'hpzAdmin': {
        if (!adminOk(c, m)) return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'admin', ok: false });
        const key = keyOf(m);
        if (m.act === 'del') return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'del', ok: !!key && removePage(key) });
        if (m.act === 'gbdel') return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'gbdel', ok: !!key && delEntry(key, String(m.id || '').slice(0, 30)) });
        if (m.act === 'list') return ctx.send(ws, { t: 'hpzOk', rid: ridOf(m), what: 'list', ok: true, idx: idx() });
        return;
      }
    }
  },
};
