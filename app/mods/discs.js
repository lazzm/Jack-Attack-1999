/* The Games Cupboard online (public/js/discs.js, Discs.net): members show off what they built in the cupboard's games
 * (a RollerJack park, a JackCity, a dungeon...), everybody can visit them, and members rate each other's (1-5 stars).
 * Plus small per-member records (a manager's trophy cabinet, a warlord's wins) for the Hall of Fame boards.
 * The index (titles, little stats, ratings, visits, records) lives in state.mods.discs; the saved games themselves live
 * in DATA_DIR/discs/<kind>/<name>.json so the 5-second state save stays small. The database is sacred: init only ever
 * ADDS missing parts, and nothing here wipes anything except a member deleting their own show.
 *   client -> { t:'dsPut', rid, kind, i, n, d, title, stats }  game JSON, UTF-8, base64, in chunks of <= 3000 chars
 *          <- { t:'dsDone', rid, ok, err? }                     (members only; one show per member per game)
 *   client -> { t:'dsList', rid, kind, sort: top|new|busy }     <- { t:'dsList', rid, kind, items:[{ name, title, ts, stats, avg, votes, visits, mine, my }] }
 *   client -> { t:'dsGet', rid, kind, name, visit }             <- { t:'dsGot', rid, kind, ok, name, title, ts, stats, avg, votes, visits, my, data }
 *   client -> { t:'dsRate', rid, kind, name, score }            <- { t:'dsRated', rid, kind, name, ok, avg, votes, my, err? }   (members, not your own)
 *   client -> { t:'dsDel', rid, kind }                          <- { t:'dsDone', rid, ok }   (your own show)
 *   client -> { t:'dsRes', kind, name, win }                    (anyone, not your own: a raid/visit challenge on that show was won or lost;
 *                                                                the owner sees the tally as res:{ w, l } in lists, e.g. "raided 5 times, held 3")
 *   client -> { t:'dsRec', kind, rec:{ up to 12 small fields } } (members: your record for that game, replaces the last one)
 *   client -> { t:'dsRecs', rid, kind }                         <- { t:'dsRecs', rid, kind, items:[{ name, ts, rec }] }
 * Every string inside an uploaded game loses its < > and control characters here, and the games escape them again. */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'discs');
const KINDS = new Set(['park', 'city', 'keepa', 'boss', 'rts', 'squigs']);
const KEY_RE = /^[a-z0-9_-]{2,16}$/;
const CHUNK = 3000, MAX_B64 = 360000, MAX_JSON = 260000, MAX_SHOWS = 3000;
let ctx;

const cleanStr = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, n);
// a deep copy with every string scrubbed; refuses anything silly (too deep, too many keys)
function scrub(v, depth, budget) {
  if (budget.n-- < 0) throw new Error('too big');
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') return cleanStr(v, 2000);
  if (depth > 14) throw new Error('too deep');
  if (Array.isArray(v)) return v.slice(0, 20000).map(x => scrub(x, depth + 1, budget));
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).slice(0, 4000)) { if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; o[cleanStr(k, 40)] = scrub(v[k], depth + 1, budget); }
    return o;
  }
  return null;
}
// the little stats shown in the lists: up to 12 numbers / short strings
function smallObj(s, max) {
  const o = {};
  if (!s || typeof s !== 'object' || Array.isArray(s)) return o;
  for (const k of Object.keys(s).slice(0, max || 12)) {
    const kk = cleanStr(k, 16); if (!kk || kk === '__proto__') continue;
    const v = s[k];
    if (typeof v === 'number' && Number.isFinite(v)) o[kk] = Math.round(v * 100) / 100;
    else if (typeof v === 'string') o[kk] = ctx.delink(cleanStr(v, 40));
    else if (typeof v === 'boolean') o[kk] = v;
  }
  return o;
}
const fileOf = (kind, key) => path.join(DIR, kind, key + '.json');
const memKey = c => (c && c.member ? String(c.member).toLowerCase() : '');
const avgOf = r => { const v = Object.values(r || {}); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0; };
function view(kind, key, e, me) {
  return { name: e.name, title: e.title, ts: e.ts, stats: e.stats || {}, avg: avgOf(e.r), votes: Object.keys(e.r || {}).length, visits: e.v | 0, res: { w: (e.res && e.res.w) | 0, l: (e.res && e.res.l) | 0 }, mine: key === me, my: me && e.r ? (e.r[me] | 0) : 0 };
}
function countShows() { let n = 0; for (const k of Object.keys(ctx.data.shows)) n += Object.keys(ctx.data.shows[k]).length; return n; }

function put(ws, c, m) {
  const rid = m.rid | 0, kind = String(m.kind || ''), key = memKey(c);
  const fail = err => { c.dsUp = null; ctx.send(ws, { t: 'dsDone', rid, ok: false, err }); };
  if (!key) return fail('Showing off your games is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!');
  if (!KINDS.has(kind)) return fail('Unknown game.');
  const n = m.n | 0, i = m.i | 0, d = typeof m.d === 'string' ? m.d : '';
  if (n < 1 || n > Math.ceil(MAX_B64 / CHUNK) || i < 0 || i >= n || d.length > CHUNK || !/^[A-Za-z0-9+/=]*$/.test(d)) return fail('That save is too big to send down the phone line.');
  if (i === 0) c.dsUp = { rid, kind, n, parts: new Array(n), got: 0, who: key, title: cleanStr(m.title, 40), stats: m.stats };
  const u = c.dsUp;
  if (!u || u.rid !== rid || u.kind !== kind || u.n !== n || u.who !== key || u.parts[i] !== undefined) return;
  u.parts[i] = d; u.got++;
  if (u.got < u.n) return;
  c.dsUp = null;
  let raw, data;
  try { raw = Buffer.from(u.parts.join(''), 'base64').toString('utf8'); } catch { return fail('The save got scrambled in the post. Try again.'); }
  if (raw.length > MAX_JSON) return fail('That save is too big to send down the phone line.');
  try { data = scrub(JSON.parse(raw), 0, { n: 120000 }); } catch { return fail('The save got scrambled in the post. Try again.'); }
  const shows = ctx.data.shows[kind] = ctx.data.shows[kind] || {};
  if (!shows[key] && countShows() >= MAX_SHOWS) return fail('The JackNet server is full up. Try again another day!');
  try {
    fs.mkdirSync(path.join(DIR, kind), { recursive: true });
    const tmp = fileOf(kind, key) + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data)); fs.renameSync(tmp, fileOf(kind, key));
  } catch (e) { console.error('discs: save failed', e.message); return fail('The JackNet server\'s hard disk is full. Sorry!'); }
  const old = shows[key];
  const title = ctx.delink(u.title) || (c.member + '\'s ' + kind);
  // a new version keeps its visits and ratings (it's the same park, just better)
  shows[key] = { name: c.member, title, ts: Date.now(), stats: smallObj(u.stats), v: old ? old.v | 0 : 0, r: old ? old.r || {} : {}, res: old && old.res ? old.res : { w: 0, l: 0 }, size: raw.length };
  ctx.markDirty();
  ctx.send(ws, { t: 'dsDone', rid, ok: true });
  if (!old) ctx.broadcast({ t: 'dsNew', kind, name: c.member, title });
}

module.exports = {
  name: 'discs',
  types: ['dsPut', 'dsList', 'dsGet', 'dsRate', 'dsDel', 'dsRes', 'dsRec', 'dsRecs'],
  init(c) {
    ctx = c;
    // only ever add what's missing
    if (!ctx.data.shows || typeof ctx.data.shows !== 'object') ctx.data.shows = {};
    if (!ctx.data.recs || typeof ctx.data.recs !== 'object') ctx.data.recs = {};
    try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) { console.error('discs: cannot create', DIR, e.message); }
  },
  handle(ws, c, m) {
    if (!c.dsRl) c.dsRl = { put: new ctx.Bucket(30, 130), get: new ctx.Bucket(1, 8), rate: new ctx.Bucket(0.5, 6), rec: new ctx.Bucket(0.3, 4), visit: new Map() };
    const rid = m.rid | 0, kind = String(m.kind || ''), me = memKey(c);
    if (m.t !== 'dsPut' && !KINDS.has(kind)) return;
    const shows = ctx.data.shows[kind] || {};
    switch (m.t) {
      case 'dsPut': if (!c.dsRl.put.take()) return; return put(ws, c, m);
      case 'dsList': {
        if (!c.dsRl.get.take()) return;
        const sort = String(m.sort || 'top');
        let items = Object.entries(shows).map(([k, e]) => view(kind, k, e, me));
        if (sort === 'new') items.sort((a, b) => b.ts - a.ts);
        else if (sort === 'busy') items.sort((a, b) => b.visits - a.visits || b.ts - a.ts);
        else items.sort((a, b) => (b.avg * Math.min(b.votes, 5)) - (a.avg * Math.min(a.votes, 5)) || b.votes - a.votes || b.ts - a.ts);
        return ctx.send(ws, { t: 'dsList', rid, kind, items: items.slice(0, 100), total: items.length });
      }
      case 'dsGet': {
        if (!c.dsRl.get.take()) return;
        const key = String(m.name || '').toLowerCase(), e = KEY_RE.test(key) && shows[key];
        if (!e) return ctx.send(ws, { t: 'dsGot', rid, kind, ok: false });
        let data = null;
        try { data = JSON.parse(fs.readFileSync(fileOf(kind, key), 'utf8')); } catch { data = null; }
        if (!data) return ctx.send(ws, { t: 'dsGot', rid, kind, ok: false });
        // a visit counts once an hour per visitor, and never your own
        if (m.visit && key !== me) {
          const vk = kind + ':' + key, last = c.dsRl.visit.get(vk) || 0;
          if (Date.now() - last > 3600000) { c.dsRl.visit.set(vk, Date.now()); e.v = (e.v | 0) + 1; ctx.markDirty(); }
        }
        return ctx.send(ws, Object.assign({ t: 'dsGot', rid, kind, ok: true, data }, view(kind, key, e, me)));
      }
      case 'dsRate': {
        const key = String(m.name || '').toLowerCase(), e = KEY_RE.test(key) && shows[key], score = m.score | 0;
        const no = err => ctx.send(ws, { t: 'dsRated', rid, kind, name: m.name, ok: false, err });
        if (!me) return no('Rating is for JackNet members. Joining is FREE!');
        if (!e) return no('That one has gone.');
        if (key === me) return no('Nice try! You can\'t rate your own.');
        if (score < 1 || score > 5 || !c.dsRl.rate.take()) return no('Slow down a bit!');
        e.r = e.r || {}; e.r[me] = score; ctx.markDirty();
        return ctx.send(ws, { t: 'dsRated', rid, kind, name: e.name, ok: true, avg: avgOf(e.r), votes: Object.keys(e.r).length, my: score });
      }
      case 'dsDel': {
        if (!me || !shows[me]) return ctx.send(ws, { t: 'dsDone', rid, ok: false, err: 'Nothing to take down.' });
        delete shows[me]; ctx.markDirty();
        try { fs.unlinkSync(fileOf(kind, me)); } catch {}
        return ctx.send(ws, { t: 'dsDone', rid, ok: true });
      }
      case 'dsRes': { // once per visitor per show per 10 minutes
        const key = String(m.name || '').toLowerCase(), e = KEY_RE.test(key) && shows[key];
        if (!e || key === me) return;
        const rk = 'res:' + kind + ':' + key, last = c.dsRl.visit.get(rk) || 0;
        if (Date.now() - last < 600000) return;
        c.dsRl.visit.set(rk, Date.now());
        e.res = e.res && typeof e.res === 'object' ? e.res : { w: 0, l: 0 };
        if (m.win) e.res.w = (e.res.w | 0) + 1; else e.res.l = (e.res.l | 0) + 1;
        ctx.markDirty();
        return;
      }
      case 'dsRec': {
        if (!me || !c.dsRl.rec.take()) return;
        const recs = ctx.data.recs[kind] = ctx.data.recs[kind] || {};
        if (!recs[me] && Object.keys(recs).length >= 5000) return;
        recs[me] = { name: c.member, ts: Date.now(), rec: smallObj(m.rec, 12) };
        ctx.markDirty();
        return;
      }
      case 'dsRecs': {
        if (!c.dsRl.get.take()) return;
        const recs = ctx.data.recs[kind] || {};
        return ctx.send(ws, { t: 'dsRecs', rid, kind, items: Object.values(recs).sort((a, b) => b.ts - a.ts).slice(0, 200) });
      }
    }
  },
};
