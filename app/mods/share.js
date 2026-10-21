/* share: SHARE & SOCIAL. E-cards (SparkleCardz!), shareable member homepage links, brag badges, chain letters between
 * real members, floppy disk swaps and the monthly Homepagez "Cool Site of the Month" vote. The fixed lists are in
 * public/js/share-cat.js (shared with the browser). Every bit of text from a visitor goes through clean() + delink(),
 * every id is random and unguessable, every number on a brag badge is worked out here (never taken from the browser).
 * Members create and send; guests can look (and pick up e-cards sent to them by a link).
 *   client -> { t:'shBox' }                              <- { t:'shBox', items, opt }   (also pushed on hello / login)
 *          server -> { t:'shBoxNew', item }              an e-card, a chain letter, a floppy disk... arriving live
 *   client -> { t:'shMembers', rid }                     <- { t:'shMembers', rid, list: [[name, online, noChains]] }
 *   client -> { t:'shCardSend', rid, c, msg, sig, to? }  <- { t:'shCardSent', rid, ok, id, to, err }   (no `to`: a link)
 *   client -> { t:'shCardGet', rid, id }                 <- { t:'shCardGot', rid, card | null }
 *   client -> { t:'shChainFwd', rid, ch, ni, to:[], ps } <- { t:'shChainDone', rid, ok, sent, skipped, err }
 *   client -> { t:'shChainStart', rid, tpl }             <- { t:'shChainDone', rid, ok, ch, ni }
 *   client -> { t:'shChains', rid } | { t:'shChain', rid, id }    <- { t:'shChains', rid, list, total } | { t:'shChain', rid, chain }
 *   client -> { t:'shOpt', rid, chains: bool }           <- { t:'shOpt', rid, chains }
 *   client -> { t:'shDiskPut', rid, up, i, n, d }        <- { t:'shDiskDone', rid, ok, id, err }   (JSON, base64, chunks <= 3000)
 *   client -> { t:'shDiskGet', rid, id }                 <- { t:'shDisk', rid, disk | null }
 *   client -> { t:'shCotm', rid } | { t:'shVote', rid, name }     <- { t:'shCotm', rid, ... }
 *   client -> { t:'shBrag', rid }                        <- { t:'shBrag', rid, stats }
 *   client -> { t:'shBadge', rid, k, g }                 <- { t:'shBadge', rid, ok, id, k, g, v, n }
 *   client -> { t:'shBadgeGet', rid, id }                <- { t:'shBadgeGot', rid, badge | null }
 *   client -> { t:'shStats', rid }                       <- { t:'shStats', rid, cards, chains, disks, votes }
 * HTTP (server.js asks share.page(url)): /card/<id>, /~name, /hp/<name> and /badge/<id> serve index.html with their
 * own og:title / og:description (escaped), so a link pasted into a chat app says who sent it.
 * Data: state.mods.share = { box, noch, seed, stat, best, gb, cotm, cotmWin, owed, day } (small);
 *       DATA_DIR/share/{cards,chains,badges}.json and DATA_DIR/share/disks/<id>.json (big). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CAT = require(path.join(__dirname, '..', 'public', 'js', 'share-cat.js'));
const ECAT = require(path.join(__dirname, '..', 'public', 'js', 'econ-cat.js'));
const HPZ = require(path.join(__dirname, '..', 'public', 'js', 'homepages.js'));
let GCAT = null; try { GCAT = require(path.join(__dirname, '..', 'public', 'js', 'grind-cat.js')); } catch (e) {}
let ECON = null; // mods/econ.js (the same instance the server loaded): one bank, one earn path

const DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'share');
const DISK_DIR = path.join(DIR, 'disks');
const PUBLIC = path.join(__dirname, '..', 'public');
const L = CAT.LIMITS;
const DAY = 864e5;
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const BADKEY = /^(__proto__|constructor|prototype|hasownproperty|tostring|valueof)$/;
const ID_RE = /^[A-Za-z0-9_-]{10,24}$/;
const NAME_RE = /^[a-z0-9_-]{2,16}$/;
const NEED = 'That\'s for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!';
let ctx = null, D = null;

// our earn sources (prizes for Cool Site of the Month), added to econ's table like mods/grind.js does
const EARN_ADD = {
  cotm1: { amt: 250, cap: 1, drop: 1, label: 'Cool Site of the Month: WINNER!' },
  cotm2: { amt: 100, cap: 1, drop: 0.5, label: 'Cool Site of the Month: runner-up' },
  cotm3: { amt: 50, cap: 1, drop: 0.3, label: 'Cool Site of the Month: third place' },
};

// ---------------------------------------------------------------- the big stores (JSON files, saved a few seconds after a change)
function jsonStore(name) {
  const file = path.join(DIR, name + '.json');
  let data = {};
  if (fs.existsSync(file)) {
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; }
    catch (e) { // never write over a file we couldn't read: keep it to one side (and the daily backups have it too)
      console.error('share: could not read', file, e.message);
      try { fs.copyFileSync(file, file + '.broken-' + Date.now()); } catch (e2) {}
      data = {};
    }
  }
  const st = { data, dirty: false, file };
  st.save = () => {
    if (!st.dirty) return; st.dirty = false;
    try { fs.mkdirSync(DIR, { recursive: true }); const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(st.data)); fs.renameSync(tmp, file); }
    catch (e) { console.error('share: save failed', name, e.message); st.dirty = true; }
  };
  st.mark = () => { st.dirty = true; };
  return st;
}
let CARDS = null, CHAINS = null, BADGES = null;

// ---------------------------------------------------------------- helpers
const str = v => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const unZalgo = s => s.replace(/(\p{M}{3})\p{M}+/gu, '$1');
const line = (v, max) => ctx.delink(ctx.clean(unZalgo(str(v)), max)).slice(0, max + 16);
function para(v, max, lines) {
  const ls = unZalgo(str(v)).slice(0, max * 2).split(/\r?\n/).slice(0, lines || 12).map(l => ctx.clean(l, max));
  return ctx.delink(ls.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)).slice(0, max + 16);
}
const ridOf = m => (Number.isInteger(m.rid) && m.rid > 0 && m.rid < 1e9 ? m.rid : 0);
const keyOfName = n => { const k = str(n).toLowerCase().replace(/^~/, '').trim().slice(0, 20); return NAME_RE.test(k) && !BADKEY.test(k) ? k : null; };
const memberKey = c => (c && c.member ? keyOfName(c.member) : null);
const memberName = k => (k && own(ctx.state.members, k) ? ctx.state.members[k].name : null);
// ids are 16 lower-case letters and digits (~82 random bits): JackNet Explorer lower-cases addresses, and nobody can guess one
const newId = () => { const b = crypto.randomBytes(16); let o = ''; for (let i = 0; i < 16; i++) o += 'abcdefghijklmnopqrstuvwxyz0123456789'[b[i] % 36]; return o; };
function rl(c, name, rate, burst) { c.shRl = c.shRl || {}; if (!c.shRl[name]) c.shRl[name] = new ctx.Bucket(rate, burst); return c.shRl[name].take(); }
function ukDay() {
  try { if (ECON && ECON.api && ECON.api.uk) return ECON.api.uk().day; } catch (e) {}
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); }
}
const ukMonth = () => ukDay().slice(0, 7);
// per member per day counters (cards sent, forwards, disks given, badges made, chain letters received)
function today(key) {
  const d = ukDay();
  if (!D.day || D.day.d !== d) D.day = { d, c: {} };
  return D.day.c[key] = D.day.c[key] || {};
}
function stat(key) { return D.stat[key] = D.stat[key] || {}; }
function socketsOf(key) { const out = []; for (const [ws, c] of ctx.clients) if (c.member && c.member.toLowerCase() === key) out.push(ws); return out; }

// ---------------------------------------------------------------- the mailbox (every computer the member logs on to gets it)
const BOX_MAX = 60;
function boxPush(key, item) {
  item.id = item.id || newId(); item.ts = item.ts || Date.now();
  const b = D.box[key] = Array.isArray(D.box[key]) ? D.box[key] : [];
  b.push(item); if (b.length > BOX_MAX) b.splice(0, b.length - BOX_MAX);
  ctx.markDirty();
  for (const ws of socketsOf(key)) ctx.send(ws, { t: 'shBoxNew', item });
}
function sendBox(ws, c) {
  const key = memberKey(c); if (!key) return;
  const b = Array.isArray(D.box[key]) ? D.box[key] : [];
  ctx.send(ws, { t: 'shBox', items: b, opt: { chains: !D.noch[key] } });
}

// ---------------------------------------------------------------- e-cards
function cardSend(ws, c, m) {
  const rid = ridOf(m), fail = err => ctx.send(ws, { t: 'shCardSent', rid, ok: false, err });
  const key = memberKey(c); if (!key) return fail(NEED);
  if (!rl(c, 'card', 1 / 8, 3)) return fail('Whoa! The SparkleCardz postie is out of breath. Wait a few seconds and try again.');
  const design = str(m.c); if (!CAT.CARD[design]) return fail('That card has fallen off the shelf. Pick another one!');
  const msg = para(m.msg, L.msg, 8), sig = line(m.sig, L.sig) || memberName(key);
  const td = today(key); if ((td.cards | 0) >= L.cardDay) return fail(`You've sent ${L.cardDay} e-cards today! The SparkleCardz postie needs a cup of tea. Send some more tomorrow.`);
  let to = '';
  if (m.to != null && m.to !== '') {
    to = keyOfName(m.to);
    if (!to || !memberName(to)) return fail(`There's no JackNet member called "${str(m.to).slice(0, 20)}". Check the spelling, or pick them from the list.`);
  }
  if (Object.keys(CARDS.data).length >= 40000) pruneCards();
  if (Object.keys(CARDS.data).length >= 40000) return fail('The SparkleCardz sorting office is completely full! Try again tomorrow.');
  const id = newId(), now = Date.now(), by = memberName(key);
  CARDS.data[id] = { c: design, by, k: key, sig, msg, to, ts: now, n: 0 };
  CARDS.mark();
  td.cards = (td.cards | 0) + 1; const s = stat(key); s.cards = (s.cards | 0) + 1; ctx.markDirty();
  if (to) boxPush(to, { k: 'card', card: id, from: by, c: design });
  ctx.send(ws, { t: 'shCardSent', rid, ok: true, id, to: to ? memberName(to) : '', self: to === key });
}
function cardView(id, card, c) {
  return { id, c: card.c, title: (CAT.CARD[card.c] || [])[2] || 'An e-card', by: card.by, sig: card.sig, msg: card.msg, ts: card.ts, to: card.to ? (memberName(card.to) || '') : '', mine: !!(c.member && c.member.toLowerCase() === card.k), n: card.n | 0, exp: card.ts + L.cardDays * DAY };
}
function cardGet(ws, c, m) {
  const rid = ridOf(m);
  if (!rl(c, 'cardget', 2, 12)) return ctx.send(ws, { t: 'shCardGot', rid, card: null, err: 'Slow down!' });
  const id = str(m.id); const card = ID_RE.test(id) && own(CARDS.data, id) ? CARDS.data[id] : null;
  if (!card || Date.now() - card.ts > L.cardDays * DAY) return ctx.send(ws, { t: 'shCardGot', rid, card: null });
  const mine = c.member && c.member.toLowerCase() === card.k;
  if (!mine) {
    const who = c.cid ? 'c:' + c.cid : 'ip:' + c.ip;
    card.w = Array.isArray(card.w) ? card.w : [];
    if (!card.w.includes(who) && card.w.length < 50) {
      card.w.push(who); card.n = (card.n | 0) + 1; CARDS.mark();
      if (card.n === 1 && memberName(card.k)) boxPush(card.k, { k: 'pick', card: id, c: card.c, who: c.member || '', to: card.to ? memberName(card.to) || '' : '' }); // 1999 e-card sites e-mailed you when it was picked up
    }
  }
  ctx.send(ws, { t: 'shCardGot', rid, card: cardView(id, card, c) });
}
// e-cards are kept for 60 days (SparkleCardz says so on every card), then they go stale and are cleared away
function pruneCards() {
  const cut = Date.now() - L.cardDays * DAY; let n = 0;
  for (const [id, cd] of Object.entries(CARDS.data)) if (cd && typeof cd.ts === 'number' && cd.ts < cut) { delete CARDS.data[id]; n++; }
  if (n) CARDS.mark();
}

// ---------------------------------------------------------------- chain letters
// chain = { t: template, ts, root: name ('' = nobody knows), n: [[parent, name, gen, ts, ps, fwd]], last }
const NODE_MAX = 2000;
function chainPath(ch, ni) { // [[name, ps], ...] from the start of the chain to node ni (the newest 12)
  const out = []; let i = ni, guard = 0;
  while (i >= 0 && ch.n[i] && guard++ < NODE_MAX) { out.unshift([ch.n[i][1], ch.n[i][4] || '']); i = ch.n[i][0]; }
  return out.slice(-12);
}
const inChain = (ch, key) => ch.n.some(x => x[1] && x[1].toLowerCase() === key);
function deliverChain(ch, id, ni, fromName) {
  const node = ch.n[ni], key = keyOfName(node[1]); if (!key) return;
  const path = chainPath(ch, node[0]);
  boxPush(key, { k: 'chain', ch: id, ni, t: ch.t, from: fromName || '', gen: node[2], path, count: ch.n.length - 1 });
  const td = today(key); td.chIn = (td.chIn | 0) + 1;
}
function chainNew(tpl, rootName) {
  if (Object.keys(CHAINS.data).length >= 5000) return null; // (chains are never thrown away: past this, no new ones start)
  const id = newId(), now = Date.now();
  CHAINS.data[id] = { t: tpl, ts: now, last: now, root: rootName || '', n: [[-1, rootName || '', 0, now, '', 0]] };
  CHAINS.mark();
  return id;
}
function chainFwd(ws, c, m) {
  const rid = ridOf(m), fail = err => ctx.send(ws, { t: 'shChainDone', rid, ok: false, err });
  const key = memberKey(c); if (!key) return fail(NEED);
  if (!rl(c, 'fwd', 1 / 5, 3)) return fail('Slow down! The chain letter is still warm from the last time.');
  const id = str(m.ch), ch = ID_RE.test(id) && own(CHAINS.data, id) ? CHAINS.data[id] : null;
  if (!ch) return fail('That chain letter has gone. (Somebody broke the chain!)');
  const ni = Math.floor(+m.ni), node = Number.isInteger(ni) && ni >= 0 ? ch.n[ni] : null;
  if (!node || !node[1] || node[1].toLowerCase() !== key) return fail('That copy of the letter isn\'t yours to forward.');
  if (node[5]) return fail('You have already forwarded this one! (Once is enough. Probably.)');
  const td = today(key); if ((td.fwd | 0) >= L.fwdDay) return fail(`You've forwarded ${L.fwdDay} chain letters today. Your fingers need a rest!`);
  const raw = Array.isArray(m.to) ? m.to.slice(0, 12) : [];
  const ps = line(m.ps, L.ps);
  if (!Array.isArray(ch.n)) return fail('That chain letter has got tangled up.');
  const sent = [], skipped = [], seen = new Set();
  for (const n of raw) {
    const k = keyOfName(n); if (!k || seen.has(k)) continue; seen.add(k);
    const nm = memberName(k);
    if (!nm) { skipped.push([str(n).slice(0, 16), 'no such member']); continue; }
    if (k === key) { skipped.push([nm, "that's you!"]); continue; }
    if (sent.length >= L.fwdMax) { skipped.push([nm, 'five is the limit']); continue; }
    if (D.noch[k]) { skipped.push([nm, 'doesn\'t want chain letters']); continue; }
    if (inChain(ch, k)) { skipped.push([nm, 'already got this one']); continue; }
    if ((today(k).chIn | 0) >= L.chainInDay) { skipped.push([nm, 'inbox full of chain letters today']); continue; }
    if (ch.n.length >= NODE_MAX) { skipped.push([nm, 'this letter has filled up the JackNet']); continue; }
    sent.push([k, nm]);
  }
  if (!sent.length) return ctx.send(ws, { t: 'shChainDone', rid, ok: false, sent: [], skipped, err: 'Nobody to send it to! ' + (skipped.length ? 'Everybody you picked was skipped.' : 'Pick some people first.') });
  const now = Date.now(), me = memberName(key);
  if (ps) node[4] = ps;
  node[5] = 1;
  for (const [, nm] of sent) { ch.n.push([ni, nm, node[2] + 1, now, '', 0]); deliverChain(ch, id, ch.n.length - 1, me); }
  ch.last = now; CHAINS.mark();
  td.fwd = (td.fwd | 0) + 1;
  const s = stat(key); s.fwd = (s.fwd | 0) + sent.length; ctx.markDirty();
  // the person who started it gets the bragging rights
  const rk = keyOfName(ch.root); if (rk) { const rs = stat(rk); rs.chainRound = (rs.chainRound | 0) + sent.length; }
  ctx.send(ws, { t: 'shChainDone', rid, ok: true, sent: sent.map(x => x[1]), skipped, count: ch.n.length - 1, ch: id });
}
function chainStart(ws, c, m) {
  const rid = ridOf(m), fail = err => ctx.send(ws, { t: 'shChainDone', rid, ok: false, err });
  const key = memberKey(c); if (!key) return fail(NEED);
  const tpl = str(m.tpl); if (!CAT.CHAIN[tpl]) return fail('Pick a chain letter first.');
  const td = today(key); if (td.start) return fail('You can only start one new chain letter a day. (That is the law of chain letters.)');
  if (!rl(c, 'start', 1 / 10, 2)) return fail('Slow down!');
  td.start = 1; ctx.markDirty();
  const id = chainNew(tpl, memberName(key));
  if (!id) return fail('The Chain Letter Tracker is full to bursting! Keep an old chain going instead.');
  ctx.send(ws, { t: 'shChainDone', rid, ok: true, ch: id, ni: 0, started: true });
}
// now and then a member who hasn't said no gets a brand-new chain letter from "a friend of a friend"
function maybeSeed(c) {
  const key = memberKey(c); if (!key || D.noch[key]) return;
  const now = Date.now();
  if (now - (D.seed[key] || 0) < 3 * DAY) return;
  D.seed[key] = now; ctx.markDirty();
  if (Math.random() > 0.4) return;
  const tpl = CAT.CHAINS[Math.floor(Math.random() * CAT.CHAINS.length)][0];
  const id = chainNew(tpl, '');
  if (!id) return;
  const ch = CHAINS.data[id];
  ch.n.push([0, memberName(key), 1, now, '', 0]); CHAINS.mark();
  setTimeout(() => { if (CHAINS.data[id]) deliverChain(ch, id, 1, ''); }, 20000 + Math.random() * 60000);
}
function chainSummary(id, ch) {
  let g = 0; for (const x of ch.n) if (x[2] > g) g = x[2];
  return { id, t: ch.t, ts: ch.ts, last: ch.last, root: ch.root, count: ch.n.length - 1, gens: g, people: new Set(ch.n.map(x => x[1]).filter(Boolean)).size };
}
function chains(ws, c, m) {
  const rid = ridOf(m);
  if (!rl(c, 'look', 2, 12)) return;
  const all = Object.entries(CHAINS.data).filter(([, ch]) => ch.n.length > 1).map(([id, ch]) => chainSummary(id, ch));
  const top = all.slice().sort((a, b) => b.count - a.count || b.last - a.last).slice(0, 25);
  const fresh = all.slice().sort((a, b) => b.last - a.last).slice(0, 10);
  const total = all.reduce((n, x) => n + x.count, 0);
  ctx.send(ws, { t: 'shChains', rid, top, fresh, total, chains: all.length });
}
function chainOne(ws, c, m) {
  const rid = ridOf(m);
  if (!rl(c, 'look', 2, 12)) return;
  const id = str(m.id), ch = ID_RE.test(id) && own(CHAINS.data, id) ? CHAINS.data[id] : null;
  if (!ch) return ctx.send(ws, { t: 'shChain', rid, chain: null });
  const key = memberKey(c);
  const mine = key ? ch.n.map((x, i) => (x[1] && x[1].toLowerCase() === key ? i : -1)).filter(i => i >= 0) : [];
  ctx.send(ws, { t: 'shChain', rid, chain: Object.assign(chainSummary(id, ch), { nodes: ch.n.slice(0, 800).map(x => [x[0], x[1], x[2], x[3], x[4] || '', x[5] ? 1 : 0]), mine, path: mine.length ? chainPath(ch, mine[0]) : [] }) });
}

// ---------------------------------------------------------------- floppy disks
const CHUNK = 3000, MAX_B64 = Math.ceil(CAT.DISK.json * 4 / 3) + 4;
const COLS = new Set(CAT.DISK_COLS.map(x => x[0])), STK = new Set(CAT.DISK_STK), HANDS = new Set(CAT.DISK_HANDS.map(x => x[0]));
function fileName(v) {
  let n = ctx.clean(str(v), 40).replace(/[\\/:*?"<>|]/g, '').replace(/^\.+/, '').trim();
  return n.slice(0, 40);
}
function textFile(v) {
  const ls = unZalgo(str(v)).slice(0, CAT.DISK.txt * 2).split(/\r?\n/).slice(0, 600).map(l => ctx.clean(l, 400));
  return ctx.delink(ls.join('\n')).slice(0, CAT.DISK.txt);
}
function imgOk(d) {
  const mm = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(d);
  if (!mm || d.length > CAT.DISK.img) return false;
  let b; try { b = Buffer.from(mm[2].slice(0, 16), 'base64'); } catch (e) { return false; }
  if (mm[1] === 'png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}
function diskSanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { err: 'The disk got scrambled. Try again!' };
  const o = { label: line(raw.label, CAT.DISK.label) || 'MY DISK', col: COLS.has(raw.col) ? raw.col : CAT.DISK_COLS[0][0], hand: HANDS.has(raw.hand) ? raw.hand : 'marker' };
  o.stk = [...new Set((Array.isArray(raw.stk) ? raw.stk : []).filter(x => typeof x === 'string' && STK.has(x)))].slice(0, 4);
  o.note = para(raw.note, CAT.DISK.note, 10);
  o.files = []; let bytes = 0, dropped = 0; const names = new Set();
  for (const f of (Array.isArray(raw.files) ? raw.files : []).slice(0, CAT.DISK.files)) {
    if (!f || typeof f !== 'object') { dropped++; continue; }
    let n = fileName(f.n); if (!n) { dropped++; continue; }
    const k = f.k;
    let x = null;
    if (k === 'txt') { if (!/\.(txt|doc|ini|log|bat)$/i.test(n)) n += '.txt'; const t = textFile(f.t); x = { n, k, t }; }
    else if (k === 'img') { const d = str(f.d); if (!imgOk(d)) { dropped++; continue; } if (!/\.(bmp|png|jpg|gif|pcx)$/i.test(n)) n += '.bmp'; x = { n, k, d }; }
    else if (k === 'url') { const u = HPZ.normUrl(f.u); if (!u) { dropped++; continue; } if (!/\.url$/i.test(n)) n += '.url'; x = { n, k, u, ti: line(f.ti, 60) }; }
    else { dropped++; continue; }
    const low = n.toLowerCase(); if (names.has(low)) { dropped++; continue; } names.add(low);
    bytes += CAT.diskSize(x);
    o.files.push(x);
  }
  if (bytes > CAT.DISK.bytes) return { err: `Disk full! That's ${CAT.num(bytes)} bytes, and a 3½" floppy only holds ${CAT.num(CAT.DISK.bytes)}. Take something off.` };
  if (!o.files.length && !o.note) return { err: 'The disk is empty! Put something on it first.' };
  o.size = bytes;
  return { disk: o, dropped };
}
function diskPut(ws, c, m) {
  const rid = ridOf(m), fail = err => ctx.send(ws, { t: 'shDiskDone', rid, ok: false, err });
  const key = memberKey(c); if (!key) return fail(NEED);
  const up = str(m.up).slice(0, 20), i = m.i | 0, n = m.n | 0, d = typeof m.d === 'string' ? m.d : '';
  if (n > Math.ceil(MAX_B64 / CHUNK)) return i === 0 ? fail('That disk is far too full to post! (Over 1.44 MB.)') : undefined;
  if (!up || n < 1 || i < 0 || i >= n || d.length > CHUNK || !/^[A-Za-z0-9+/=]*$/.test(d)) return fail('The disk got scrambled in the post. Try again.');
  if (i === 0) {
    if (!rl(c, 'disk', 1 / 15, 3)) return fail('Slow down! Wait a few seconds before you give away another disk.');
    if ((today(key).disks | 0) >= L.diskDay) return fail(`You've given away ${L.diskDay} disks today. Mom says floppies cost money (they do: 10 for a fiver).`);
    c.shUp = { up, n, parts: new Array(n), got: 0, who: key };
  }
  const u = c.shUp;
  if (!u || u.up !== up || u.n !== n || u.who !== key || u.parts[i] !== undefined) return;
  u.parts[i] = d; u.got++;
  if (u.got < n) return;
  c.shUp = null;
  let raw; try { raw = JSON.parse(Buffer.from(u.parts.join(''), 'base64').toString('utf8')); } catch (e) { return fail('The disk got scrambled in the post. Try again.'); }
  const to = keyOfName(raw && raw.to);
  if (!to || !memberName(to)) return fail('Who is it for? Pick a JackNet member to give the disk to.');
  if (to === key) return fail('You can\'t give a disk to yourself. (You already have it.)');
  const r = diskSanitize(raw); if (r.err) return fail(r.err);
  const id = newId(), now = Date.now(), by = memberName(key);
  const disk = Object.assign({ id, by, k: key, to, ts: now }, r.disk);
  try { fs.mkdirSync(DISK_DIR, { recursive: true }); const f = path.join(DISK_DIR, id + '.json'); fs.writeFileSync(f + '.tmp', JSON.stringify(disk)); fs.renameSync(f + '.tmp', f); }
  catch (e) { console.error('share: disk save failed', e.message); return fail('The disk drive at the JackNet post office is jammed. Try again later.'); }
  D.disks[id] = { by, k: key, to, ts: now, label: disk.label, size: disk.size, files: disk.files.length };
  today(key).disks = (today(key).disks | 0) + 1; const s = stat(key); s.disks = (s.disks | 0) + 1; ctx.markDirty();
  boxPush(to, { k: 'disk', disk: id, from: by, label: disk.label, col: disk.col, files: disk.files.length });
  ctx.send(ws, { t: 'shDiskDone', rid, ok: true, id, to: memberName(to), dropped: r.dropped, size: disk.size });
}
function diskGet(ws, c, m) {
  const rid = ridOf(m), key = memberKey(c);
  if (!rl(c, 'diskget', 1, 6)) return ctx.send(ws, { t: 'shDisk', rid, disk: null, err: 'Slow down!' });
  const id = str(m.id), ix = ID_RE.test(id) && own(D.disks, id) ? D.disks[id] : null;
  if (!ix || !key || (ix.to !== key && ix.k !== key)) return ctx.send(ws, { t: 'shDisk', rid, disk: null });
  let disk = null; try { disk = JSON.parse(fs.readFileSync(path.join(DISK_DIR, id + '.json'), 'utf8')); } catch (e) { disk = null; }
  if (disk) { delete disk.k; disk.to = memberName(disk.to) || ''; }
  ctx.send(ws, { t: 'shDisk', rid, disk });
}

// ---------------------------------------------------------------- Cool Site of the Month
const hpIdx = () => (ctx.state.mods && ctx.state.mods.homepages && ctx.state.mods.homepages.idx) || {};
const hasPage = k => !!(own(hpIdx(), k) && hpIdx()[k] && memberName(k));
function cotmRoll() {
  const m = ukMonth();
  if (!D.cotm || !D.cotm.m) { D.cotm = { m, v: {} }; ctx.markDirty(); return; }
  if (D.cotm.m === m) return;
  // a new month: count the old one's votes and hand out the prizes
  const tally = {};
  for (const [voter, k] of Object.entries(D.cotm.v || {})) if (memberName(voter) && hasPage(k)) tally[k] = (tally[k] | 0) + 1;
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1] || ((hpIdx()[b[0]] || {}).h | 0) - ((hpIdx()[a[0]] || {}).h | 0));
  const old = D.cotm.m;
  ranked.slice(0, 3).forEach(([k, votes], i) => {
    const e = hpIdx()[k] || {};
    D.cotmWin.push({ m: old, k, n: memberName(k), votes, place: i + 1, t: e.t || '', a: e.a || '' });
    const src = 'cotm' + (i + 1), note = `Cool Site of the Month (${CAT.monthLabel(old)}): ${['1st', '2nd', '3rd'][i]} place!`;
    pay(k, src, note);
    if (i === 0) { const s = stat(k); s.cotm = (s.cotm | 0) + 1; s.cotmLast = old; }
    boxPush(k, { k: 'cotm', m: old, place: i + 1, votes, t: e.t || '' });
  });
  if (ranked.length) ctx.pushChat({ sys: true, text: `*** COOL SITE OF THE MONTH (${CAT.monthLabel(old)}): ${memberName(ranked[0][0])}'s home page, with ${ranked[0][1]} vote${ranked[0][1] === 1 ? '' : 's'}! Congratulations!`, ts: Date.now() });
  if (D.cotmWin.length > 60) D.cotmWin.splice(0, D.cotmWin.length - 60);
  D.cotm = { m, v: {} }; ctx.markDirty();
}
function pay(k, src, note) {
  const a = ECON && ECON.api && ECON.api.acctByKey ? ECON.api.acctByKey(k) : null;
  if (a) { try { ECON.api.earnA(a, src, note); ECON.api.meToAll(a); } catch (e) { console.error('share: pay', e.message); } return; }
  (D.owed[k] = D.owed[k] || []).push([src, note]); ctx.markDirty(); // no bank account yet: paid when they next log on
}
function payOwed(c) {
  const k = memberKey(c); if (!k || !D.owed[k] || !ECON || !ECON.api) return;
  const a = ECON.api.acct(c); if (!a) return;
  for (const [src, note] of D.owed[k]) { try { ECON.api.earnA(a, src, note); } catch (e) {} }
  delete D.owed[k]; ctx.markDirty();
  try { ECON.api.meToAll(a); } catch (e) {}
}
function isoWeek() {
  const d = ukDay(), t = Date.UTC(1999, +d.slice(5, 7) - 1, Math.min(+d.slice(8, 10), +d.slice(5, 7) === 2 ? 28 : 31));
  const dow = (new Date(t).getUTCDay() + 6) % 7, thu = t - dow * DAY + 3 * DAY;
  return Math.floor((thu - Date.UTC(1999, 0, 1)) / (7 * DAY)) + 1;
}
const RING_A = ['Super', 'Mega', 'Cosmic', 'Turbo', 'Groovy', 'Radical', 'Fuzzy', 'Funky', 'Atomic', 'Hyper', 'Electric', 'Sparkly'];
const RING_B = ['Biscuit', 'Squig', 'Modem', 'Floppy', 'Pixel', 'Hamster', 'Rocket', 'Custard', 'Teapot', 'Joystick', 'Comet', 'Jelly'];
function ringOfWeek() {
  const wk = isoWeek();
  const all = Object.keys(hpIdx()).filter(hasPage).sort();
  // a shuffle seeded by the week, so everyone sees the same ring all week
  let s = (wk * 2654435761) >>> 0; const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const sites = all.slice(0, 6).map(k => [k, memberName(k), (hpIdx()[k] || {}).t || '', (hpIdx()[k] || {}).a || '']);
  return { wk, name: `The ${RING_A[wk % RING_A.length]} ${RING_B[(wk * 7) % RING_B.length]} Ring`, sites };
}
function cotmView(c) {
  cotmRoll();
  const tally = {};
  for (const [voter, k] of Object.entries(D.cotm.v)) if (memberName(voter) && hasPage(k)) tally[k] = (tally[k] | 0) + 1;
  const standings = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => { const e = hpIdx()[k] || {}; return [k, memberName(k), e.t || '', v, e.a || '']; });
  const league = Object.keys(hpIdx()).filter(hasPage).map(k => { const e = hpIdx()[k]; return [k, memberName(k), e.t || '', e.h | 0, e.a || '']; }).sort((a, b) => b[3] - a[3]).slice(0, 15);
  const key = memberKey(c);
  return { m: D.cotm.m, label: CAT.monthLabel(D.cotm.m), votes: Object.keys(D.cotm.v).length, standings, league, mine: key ? D.cotm.v[key] || '' : '', winners: D.cotmWin.slice(-24).reverse(), ring: ringOfWeek(), pages: Object.keys(hpIdx()).filter(hasPage).length };
}
function vote(ws, c, m) {
  const rid = ridOf(m), key = memberKey(c);
  const fail = err => ctx.send(ws, Object.assign({ t: 'shCotm', rid, ok: false, err }, cotmView(c)));
  if (!key) return fail(NEED);
  if (!rl(c, 'vote', 1 / 3, 3)) return fail('Slow down!');
  cotmRoll();
  const k = keyOfName(m.name);
  if (!k || !hasPage(k)) return fail('That home page has moved out of Homepagez!');
  if (k === key) return fail('No voting for your own page! (Nice try.)');
  if (D.cotm.v[key]) return fail(`You've already voted this month, for ${memberName(D.cotm.v[key]) || 'somebody'}'s page. Come back next month!`);
  D.cotm.v[key] = k; ctx.markDirty();
  ctx.send(ws, Object.assign({ t: 'shCotm', rid, ok: true, voted: memberName(k) }, cotmView(c)));
}

// ---------------------------------------------------------------- brag badges
function brag(key) {
  const mem = ctx.state.members[key] || {};
  const s = stat(key);
  let rank = null;
  try { const g = ctx.state.mods.grind && ctx.state.mods.grind.p && ctx.state.mods.grind.p[key]; if (g && GCAT) rank = { lv: g.lv | 0, title: GCAT.TITLES[g.lv | 0] || '' }; } catch (e) {}
  let secrets = 0; try { const a = ECON && ECON.api.acctByKey(key); if (a && Array.isArray(a.sec)) secrets = a.sec.length; } catch (e) {}
  const gb = !!D.gb[key] || (ctx.state.guestbook || []).some(e => e && typeof e.name === 'string' && e.name.toLowerCase() === key);
  const hp = hpIdx()[key];
  const best = {}; for (const [g, v] of Object.entries(D.best[key] || {})) if (CAT.GAMES[g]) best[g] = v;
  return { name: mem.name || key, no: mem.no | 0, gb, best, rank, secrets, cards: s.cards | 0, chain: s.chainRound | 0, cotm: s.cotmLast || '', hp: hp && hasPage(key) ? hp.h | 0 : -1 };
}
function badgeValue(b, k, g) { // the true value for a badge, or null if they haven't earned it
  switch (k) {
    case 'gb': return b.gb ? 1 : null;
    case 'score': return CAT.GAMES[g] && b.best[g] > 0 ? b.best[g] : null;
    case 'rank': return b.rank && b.rank.title ? b.rank.title : null;
    case 'secrets': return b.secrets > 0 ? b.secrets : null;
    case 'member': return b.no > 0 ? b.no : null;
    case 'cards': return b.cards > 0 ? b.cards : null;
    case 'chain': return b.chain > 0 ? b.chain : null;
    case 'cotm': return b.cotm || null;
    case 'hp': return b.hp >= 0 ? b.hp : null;
  }
  return null;
}
function badgeMake(ws, c, m) {
  const rid = ridOf(m), key = memberKey(c), fail = err => ctx.send(ws, { t: 'shBadge', rid, ok: false, err });
  if (!key) return fail(NEED);
  if (!rl(c, 'badge', 1 / 3, 4)) return fail('Slow down!');
  const k = str(m.k), g = k === 'score' ? str(m.g) : '';
  if (!CAT.BADGES[k]) return fail('No such badge.');
  const b = brag(key), v = badgeValue(b, k, g);
  if (v == null) return fail('You haven\'t earned that one yet!');
  const td = today(key); if ((td.badges | 0) >= L.badgeDay) return fail('That\'s enough badges for one day! (The button machine is overheating.)');
  // the same badge again (same value) gets the same link
  for (const [id, x] of Object.entries(BADGES.data)) if (x.key === key && x.k === k && x.g === g && x.v === v) return ctx.send(ws, { t: 'shBadge', rid, ok: true, id, k, g, v, n: b.name });
  if (Object.keys(BADGES.data).length >= 50000) return fail('The button machine has run out of buttons! Try again another day.');
  const id = newId();
  BADGES.data[id] = { key, n: b.name, k, g, v, ts: Date.now() }; BADGES.mark();
  td.badges = (td.badges | 0) + 1; ctx.markDirty();
  ctx.send(ws, { t: 'shBadge', rid, ok: true, id, k, g, v, n: b.name });
}

// ---------------------------------------------------------------- the real web: /card/<id>, /~name, /hp/<name>, /badge/<id>
let pageCache = { mt: 0, html: '' };
function indexHtml() {
  const f = path.join(PUBLIC, 'index.html');
  try { const st = fs.statSync(f); if (st.mtimeMs !== pageCache.mt) pageCache = { mt: st.mtimeMs, html: fs.readFileSync(f, 'utf8') }; } catch (e) { return ''; }
  return pageCache.html;
}
const attr = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])).replace(/[\u0000-\u001f\u007f]/g, ' ');
function metaFor(url) {
  let p; try { p = decodeURIComponent(new URL(url, 'http://x').pathname); } catch (e) { return null; }
  let mm;
  if ((mm = /^\/card\/([A-Za-z0-9_-]{10,24})\/?$/.exec(p))) {
    const card = CARDS && own(CARDS.data, mm[1]) ? CARDS.data[mm[1]] : null;
    if (!card || Date.now() - card.ts > L.cardDays * DAY) return { path: p, title: 'An e-card for you! - JACK ATTACK! Online', desc: 'Somebody sent you an e-card on SparkleCardz! Boot up the family PC at JACK ATTACK! Online (a home page stuck in 1999) to pick it up.', share: ['card', mm[1], '', ''], noindex: true };
    const t = (CAT.CARD[card.c] || [])[2] || 'An e-card';
    return { path: p, title: `${card.by} sent you an e-card!`, desc: `"${t}" is waiting for you on SparkleCardz! Press the power button on the family PC at JACK ATTACK! Online (a home page stuck in 1999) to pick it up.`, share: ['card', mm[1], card.by, t], noindex: true };
  }
  if ((mm = /^\/(?:~|hp\/)([A-Za-z0-9_-]{2,16})\/?$/.exec(p))) {
    const k = keyOfName(mm[1]), nm = k && memberName(k);
    if (!nm) return { path: p, title: 'A home page on JACK ATTACK! Online', desc: 'A member\'s home page on Homepagez, on the 1999 web inside JACK ATTACK! Online. Boot up the family PC to visit it.', share: ['hp', k || '', '', ''] };
    const e = hasPage(k) ? hpIdx()[k] : null;
    return { path: '/~' + k, title: `${nm}'s Home Page on JACK ATTACK! Online`, desc: e && e.t ? `"${e.t}" - ${nm}'s home page on Homepagez (${e.h | 0} visitors so far). Boot up the family PC at JACK ATTACK! Online, a home page stuck in 1999, to visit it and sign the guestbook!` : `${nm} is a JackNet member on JACK ATTACK! Online, a home page stuck in 1999. Boot up the family PC to visit.`, share: ['hp', k, nm, e ? e.t || '' : ''] };
  }
  if ((mm = /^\/badge\/([A-Za-z0-9_-]{10,24})\/?$/.exec(p))) {
    const b = BADGES && own(BADGES.data, mm[1]) ? BADGES.data[mm[1]] : null;
    if (!b) return { path: p, title: 'JACK ATTACK! Online - a home page stuck in 1999', desc: 'A brag badge from JACK ATTACK! Online. Boot up the family PC and earn your own!', share: ['badge', mm[1], '', ''], noindex: true };
    const tx = CAT.badgeText(b.k, b.g, b.v, b.n);
    return { path: p, title: tx.og, desc: `${b.n} is bragging on JACK ATTACK! Online, a home page stuck in 1999. Boot up the family PC, play the games, sign the guestbook and make your own brag badges!`, share: ['badge', mm[1], b.n, tx.big], noindex: true };
  }
  return null;
}
function page(url) {
  if (!ctx || !CARDS) return null;
  const meta = metaFor(url); if (!meta) return null;
  let html = indexHtml(); if (!html) return null;
  const T = attr(meta.title), Ds = attr(meta.desc), U = attr('https://jacklm.com' + meta.path);
  const sub = (re, val) => { html = html.replace(re, (all, a, b) => a + val + b); };
  sub(/(<title>)[^<]*(<\/title>)/, T);
  sub(/(<meta name="description" content=")[^"]*(")/, Ds);
  sub(/(<meta property="og:title" content=")[^"]*(")/, T);
  sub(/(<meta property="og:description" content=")[^"]*(")/, Ds);
  sub(/(<meta property="og:url" content=")[^"]*(")/, U);
  sub(/(<meta name="twitter:title" content=")[^"]*(")/, T);
  sub(/(<meta name="twitter:description" content=")[^"]*(")/, Ds);
  sub(/(<link rel="canonical" href=")[^"]*(")/, meta.noindex ? 'https://jacklm.com/' : U);
  // the page lives at /card/..., so every relative script, style and image needs to come from the top of the site
  const extra = `<base href="/"><meta name="jhp-share" content="${attr(meta.share.map(x => String(x).replace(/\|/g, '/')).join('|'))}">${meta.noindex ? '<meta name="robots" content="noindex">' : ''}`;
  html = html.replace(/<head>/i, '<head>' + extra);
  return html;
}

// ---------------------------------------------------------------- module
module.exports = {
  name: 'share',
  types: ['shBox', 'shMembers', 'shCardSend', 'shCardGet', 'shChainFwd', 'shChainStart', 'shChains', 'shChain', 'shOpt', 'shDiskPut', 'shDiskGet', 'shCotm', 'shVote', 'shBrag', 'shBadge', 'shBadgeGet', 'shStats'],
  page,
  init(x) {
    ctx = x; D = ctx.data;
    // the database is sacred: only ever ADD missing parts, never reset what's there
    for (const k of ['box', 'noch', 'seed', 'stat', 'best', 'gb', 'owed', 'disks']) if (D[k] === undefined || D[k] === null) D[k] = {};
    if (D.cotmWin === undefined || D.cotmWin === null) D.cotmWin = [];
    try { fs.mkdirSync(DISK_DIR, { recursive: true }); } catch (e) { console.error('share: cannot create', DISK_DIR, e.message); }
    CARDS = jsonStore('cards'); CHAINS = jsonStore('chains'); BADGES = jsonStore('badges');
    try { ECON = require('./econ.js'); } catch (e) { ECON = null; }
    for (const k in EARN_ADD) if (!own(ECAT.EARN, k)) ECAT.EARN[k] = EARN_ADD[k];
    cotmRoll();
    ctx.on('hello', (ws, c) => { if (!c.member) return; sendBox(ws, c); payOwed(c); maybeSeed(c); });
    ctx.on('login', c => { for (const [ws, x] of ctx.clients) if (x === c) sendBox(ws, c); payOwed(c); maybeSeed(c); });
    ctx.on('gb', c => { const k = memberKey(c); if (k && !D.gb[k]) { D.gb[k] = 1; ctx.markDirty(); } });
    ctx.on('score', (c, g, sc) => {
      const k = memberKey(c); if (!k || !CAT.GAMES[g] || !(sc > 0)) return;
      const b = D.best[k] = D.best[k] || {}, low = CAT.GAMES[g][2];
      if (!b[g] || (low ? sc < b[g] : sc > b[g])) { b[g] = sc; ctx.markDirty(); }
    });
    const flush = setInterval(() => { CARDS.save(); CHAINS.save(); BADGES.save(); }, 4000);
    const tidy = setInterval(() => {
      try {
        pruneCards(); cotmRoll();
      } catch (e) { console.error('share: tidy', e); }
    }, 30 * 60000);
    if (flush.unref) flush.unref(); if (tidy.unref) tidy.unref();
    process.on('exit', () => { try { CARDS.save(); CHAINS.save(); BADGES.save(); } catch (e) {} });
  },
  handle(ws, c, m) {
    switch (m.t) {
      case 'shBox': if (!rl(c, 'box', 0.5, 4)) return; return sendBox(ws, c);
      case 'shMembers': {
        if (!rl(c, 'mem', 0.5, 4)) return;
        const on = new Set([...ctx.clients.values()].filter(x => x.member).map(x => x.member.toLowerCase()));
        const list = Object.keys(ctx.state.members).sort().slice(0, 3000).map(k => [ctx.state.members[k].name, on.has(k) ? 1 : 0, D.noch[k] ? 1 : 0, hasPage(k) ? 1 : 0]);
        return ctx.send(ws, { t: 'shMembers', rid: ridOf(m), list });
      }
      case 'shCardSend': return cardSend(ws, c, m);
      case 'shCardGet': return cardGet(ws, c, m);
      case 'shChainFwd': return chainFwd(ws, c, m);
      case 'shChainStart': return chainStart(ws, c, m);
      case 'shChains': return chains(ws, c, m);
      case 'shChain': return chainOne(ws, c, m);
      case 'shOpt': {
        const k = memberKey(c); if (!k) return ctx.send(ws, { t: 'shOpt', rid: ridOf(m), err: NEED });
        if (!rl(c, 'opt', 0.5, 4)) return;
        if (m.chains === false) D.noch[k] = 1; else if (m.chains === true) delete D.noch[k];
        ctx.markDirty();
        return ctx.send(ws, { t: 'shOpt', rid: ridOf(m), chains: !D.noch[k] });
      }
      case 'shDiskPut': return diskPut(ws, c, m);
      case 'shDiskGet': return diskGet(ws, c, m);
      case 'shCotm': if (!rl(c, 'look', 2, 12)) return; return ctx.send(ws, Object.assign({ t: 'shCotm', rid: ridOf(m), ok: true }, cotmView(c)));
      case 'shVote': return vote(ws, c, m);
      case 'shBrag': {
        const k = memberKey(c); if (!k) return ctx.send(ws, { t: 'shBrag', rid: ridOf(m), stats: null });
        if (!rl(c, 'look', 2, 12)) return;
        return ctx.send(ws, { t: 'shBrag', rid: ridOf(m), stats: brag(k) });
      }
      case 'shBadge': return badgeMake(ws, c, m);
      case 'shBadgeGet': {
        if (!rl(c, 'look', 2, 12)) return;
        const id = str(m.id), b = ID_RE.test(id) && own(BADGES.data, id) ? BADGES.data[id] : null;
        return ctx.send(ws, { t: 'shBadgeGot', rid: ridOf(m), badge: b ? { id, k: b.k, g: b.g, v: b.v, n: b.n, ts: b.ts } : null });
      }
      case 'shStats': {
        if (!rl(c, 'look', 2, 12)) return;
        let fw = 0; for (const ch of Object.values(CHAINS.data)) fw += ch.n.length - 1;
        return ctx.send(ws, { t: 'shStats', rid: ridOf(m), cards: Object.keys(CARDS.data).length, chains: fw, disks: Object.keys(D.disks).length, votes: D.cotm ? Object.keys(D.cotm.v).length : 0 });
      }
    }
  },
  _test: { get D() { return D; }, cotmRoll, metaFor, diskSanitize, get CARDS() { return CARDS; }, get CHAINS() { return CHAINS; } },
};
