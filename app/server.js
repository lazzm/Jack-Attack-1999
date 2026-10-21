// Jack's Home Page - the "CGI-BIN" that keeps all the shared stuff in sync.
// Serves the static site and a WebSocket at /ws that every visitor shares.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Cube = require('./public/js/cube-model.js');

const PORT = +process.env.PORT || 8080;
const PUBLIC = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://jacklm.com,https://www.jacklm.com').split(',');
const VERSION = require('./package.json').version;

// ---------------------------------------------------------------- state
const WALL_W = 64, WALL_H = 40;
const POLL_OPTIONS = ['Pokémon Red & Blue', 'Metal Gear Solid', "Tony Hawk's Skateboarding", 'Driver', 'Silent Hill', 'Ape Escape', 'Episode I: Racer', 'Mario Golf'];
// high-score tables: the biggest score we'll believe, and whether lower is better (times)
const GAMES = { squig: 20000, tris: 999999, snake: 99999, sweep: 999, bricks: 999999, invaders: 999999, rocks: 999999, pong: 999, whack: 9999, simon: 999, hangman: 999 };
const ASC = { sweep: true }; // high-score tables and the biggest score we'll believe

function freshPet(gen) {
  return { gen, born: Date.now(), food: 80, fun: 80, clean: 80, dead: false, diedAt: 0, feeds: 0, lastBy: '' };
}

const DEFAULT_STATE = {
  hits: 0, hitsV2: true,
  button: 0, buttonBy: '',
  // a solve only counts once the cube is properly mixed (Scramble button, or 25+ moves since it was last solved)
  cube: Cube.solved(), cubeMoves: 0, cubeSolves: 0, cubeLastSolver: '', cubeScrambled: false, cubeSinceSolved: 0, cubeLastScramble: 0,
  wall: '0'.repeat(WALL_W * WALL_H),
  pet: freshPet(1), petDeaths: 0,
  waaaghs: 0, waaaghLastBy: '',
  poll: POLL_OPTIONS.map(() => 0), pollVoters: {}, pollKey: POLL_OPTIONS.join('|'),
  scores: {}, trisLines: 0, trisWins: {},
  flings: 0,
  chat: [],
  guestbook: [],
  members: {}, memberSeq: 0, // lower-case name -> { name, no, salt, hash, created, tokens: [sha256...], profile, visits, posts, shouts }
  forum: { topics: [], seq: 1 },
  kv: {}, // shared toys: key -> number (counter) | array (list of notes) | object (map of small strings)
};

// ---------------------------------------------------------------- the database is sacred
// state.json is never thrown away: if it can't be read, the newest good backup is used instead, and if there is no good
// backup either the server refuses to start (so nothing can overwrite it). Backups: DATA_DIR/backups, see backupNow().
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
function readStateFile() {
  const tryRead = f => { try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j && typeof j === 'object' && j.members ? j : null; } catch (e) { return null; } };
  if (!fs.existsSync(STATE_FILE)) {
    const any = fs.existsSync(BACKUP_DIR) && fs.readdirSync(BACKUP_DIR).some(f => /^state-.*\.json$/.test(f));
    if (!any) return null; // a brand-new site: start fresh
  }
  const main = fs.existsSync(STATE_FILE) ? tryRead(STATE_FILE) : null;
  if (main) return main;
  const backups = fs.existsSync(BACKUP_DIR) ? fs.readdirSync(BACKUP_DIR).filter(f => /^state-.*\.json$/.test(f)).map(f => path.join(BACKUP_DIR, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs) : [];
  for (const f of backups) { const j = tryRead(f); if (j) { console.error('state.json unreadable: restored from backup', f); try { fs.copyFileSync(STATE_FILE, STATE_FILE + '.broken-' + Date.now()); } catch (e) {} return j; } }
  console.error('FATAL: state.json is unreadable and no good backup exists. Refusing to start so nothing gets overwritten.');
  process.exit(1);
}
let state;
try {
  const saved = readStateFile();
  if (!saved) { const e = new Error('no state yet'); e.code = 'ENOENT'; throw e; }
  if (!saved.hitsV2) saved.hitsV2 = false; // older saves predate the real counter
  if (!saved.pollKey) saved.pollKey = ''; // ...and the poll key
  state = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_STATE)), saved);
  if (state.wall.length !== WALL_W * WALL_H) state.wall = DEFAULT_STATE.wall;
  // new poll question -> fresh votes
  if (state.pollKey !== POLL_OPTIONS.join('|') || state.poll.length !== POLL_OPTIONS.length) { state.poll = POLL_OPTIONS.map(() => 0); state.pollVoters = {}; state.pollKey = POLL_OPTIONS.join('|'); }
  // v1 seeded the counter at 1337 as a joke; keep only the real visits (minus one deploy test)
  if (!state.hitsV2) { state.hits = Math.max(0, state.hits - 1338); state.hitsV2 = true; delete state.hitsReal; }
} catch (e) {
  if (e.code !== 'ENOENT') { console.error('FATAL: state load failed:', e.message, '- refusing to start so state.json is not overwritten'); process.exit(1); }
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
}
for (const g in GAMES) if (!Array.isArray(state.scores[g])) state.scores[g] = [];
if (!state.forum.topics.length && state.forum.seq === 1) { // a welcome post so the boards aren't empty
  const now = Date.now();
  state.forum.topics.push({ id: state.forum.seq++, board: 'general', title: 'WELCOME TO THE JACK ATTACK! FORUMS!!!', by: 'Jack', ts: now, last: now, lastBy: 'Jack', views: 0, posts: [{ id: 1, by: 'Jack', ts: now,
    body: "Alright everyone! Welcome to the forums!!! :D\n\nRules:\n1. Be nice.\n2. No swearing (my mom reads this).\n3. No sharing your address or phone number.\n4. Red ones go faster.\n\nPost about games, films, Orks, cubes, anything. Introduce yourself here!\n\n[b]WAAAGH!!![/b]" }] });
}
let dirty = true; // write any load-time migrations straight away
const markDirty = () => { dirty = true; };
process.nextTick(() => indexTokens());

function save() {
  if (!dirty) return;
  dirty = false;
  const tmp = STATE_FILE + '.tmp';
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) { console.error('save failed', e.message); dirty = true; }
}
setInterval(save, 5000);
// rolling backups of everything in DATA_DIR (state.json + profiles/ + homepages/ + anything mods keep there):
// one at start-up (before anything runs), then hourly; keeps 72 hourly and 60 daily copies
function backupNow(tag) {
  try {
    if (!fs.existsSync(STATE_FILE)) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const d = new Date(), p2 = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;
    const kind = tag || 'hourly';
    fs.copyFileSync(STATE_FILE, path.join(BACKUP_DIR, `state-${kind}-${stamp}.json`));
    const day = stamp.slice(0, 8), dailyDir = path.join(BACKUP_DIR, 'daily-' + day);
    if (!fs.existsSync(dailyDir)) { // once a day: a full copy of the data folder (minus the backups themselves)
      fs.mkdirSync(dailyDir, { recursive: true });
      for (const f of fs.readdirSync(DATA_DIR)) {
        if (f === 'backups' || f.endsWith('.tmp')) continue;
        fs.cpSync(path.join(DATA_DIR, f), path.join(dailyDir, f), { recursive: true });
      }
    }
    const list = re => fs.readdirSync(BACKUP_DIR).filter(f => re.test(f)).sort();
    const prune = (arr, keep) => arr.slice(0, Math.max(0, arr.length - keep)).forEach(f => fs.rmSync(path.join(BACKUP_DIR, f), { recursive: true, force: true }));
    prune(list(/^state-hourly-/), 72); prune(list(/^state-boot-/), 30); prune(list(/^state-predeploy-/), 30); prune(list(/^daily-/), 60);
  } catch (e) { console.error('backup failed', e.message); }
}
backupNow('boot');
setInterval(() => backupNow(), 3600 * 1000);

// ---------------------------------------------------------------- helpers
const BAD = /\b(n[i1!]gg(a|er|uh)s?|f[a@]gg?(ot)?s?|k[i1]kes?|sp[i1]cs?|ch[i1]nks?|tr[a@]nn(y|ies)|retards?|c[u\*]nts?|wh[o0]res?|r[a@]pe[sd]?)\b/gi;
function clean(str, max) {
  str = String(str == null ? '' : str).replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, ' ').trim().slice(0, max);
  return str.replace(BAD, m => '*'.repeat(m.length));
}
// No links please, this is a family homepage
function delink(str) { return str.replace(/\b((https?:\/\/)|(www\.))\S+/gi, '[link removed]'); }

function clientIp(req) {
  return String(req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '').trim();
}

class Bucket { // token bucket rate limiter
  constructor(rate, burst) { this.rate = rate; this.burst = burst; this.t = burst; this.last = Date.now(); }
  take(n = 1) {
    const now = Date.now();
    this.t = Math.min(this.burst, this.t + (now - this.last) / 1000 * this.rate);
    this.last = now;
    if (this.t < n) return false;
    this.t -= n; return true;
  }
}

// ---------------------------------------------------------------- JackNet membership
// Guests get GuestNNNN. Members pick a name + password (scrypt-hashed); the browser keeps a session token.
const RESERVED = /^(jack|jackm|admin(istrator)?|sysop|webmaster|mod(erator)?|system|root|gubbinz|jacknet|ed|editor|guest.*|nobody|everyone)$/i;
function guestNick() {
  for (;;) {
    const n = 'Guest' + (1000 + Math.floor(Math.random() * 9000));
    if (![...clients.values()].some(c => c.nick === n)) return n;
  }
}
function nameProblem(name) {
  if (!/^[A-Za-z0-9_\-]{3,16}$/.test(name)) return 'User names are 3 to 16 letters, numbers, _ or - (no spaces).';
  if (clean(name, 16) !== name) return "That user name isn't allowed. Keep it clean!";
  if (RESERVED.test(name)) return 'Sorry, that user name is reserved.';
  return '';
}
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const tokenIndex = new Map(); // sha256(token) -> lower-case name
function indexTokens() { tokenIndex.clear(); for (const [k, mem] of Object.entries(state.members)) for (const h of mem.tokens) tokenIndex.set(h, k); }
function scryptHash(pass, salt) {
  return new Promise((ok, bad) => crypto.scrypt(pass, salt, 32, { N: 16384, r: 8, p: 1 }, (e, key) => e ? bad(e) : ok(key.toString('hex'))));
}
function newToken(key) {
  const tok = crypto.randomBytes(24).toString('hex'), h = sha(tok), mem = state.members[key];
  mem.tokens.push(h);
  while (mem.tokens.length > 8) tokenIndex.delete(mem.tokens.shift());
  tokenIndex.set(h, key); markDirty();
  return tok;
}
const loginByIp = new Map(); // ip -> Bucket
const failsByName = new Map(); // lower name -> { n, until }
function memberCount() { return Object.keys(state.members).length; }
function isMemberName(name) { return !!state.members[String(name).toLowerCase()]; }
const COLOURS = ['#ff0000', '#00c000', '#0000ff', '#ff00ff', '#ff8000', '#008080', '#8000ff', '#c00060', '#808000', '#0080ff'];

// ---------------------------------------------------------------- static files
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.gif': 'image/gif', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json' };

const HTML_CSP = "default-src 'self'; connect-src 'self' wss: ws:; img-src 'self' data: blob:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'";
// e-card, homepage and brag-badge links (/card/<id>, /~name, /hp/<name>, /badge/<id>): index.html with their own og tags (mods/share.js)
function serveShared(req, res) {
  let html = null;
  try { html = /^\/(card\/|~|hp\/|badge\/)/.test(req.url) ? require('./mods/share.js').page(req.url) : null; } catch (e) { html = null; }
  if (!html) return false;
  const buf = Buffer.from(html);
  res.writeHead(200, { 'Content-Type': MIME['.html'], 'Content-Length': buf.length, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', 'Content-Security-Policy': HTML_CSP, 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  res.end(req.method === 'HEAD' ? undefined : buf);
  return true;
}
function serveStatic(req, res) {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  if (url === '/') url = '/index.html';
  const file = path.normalize(path.join(PUBLIC, url));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<html><body bgcolor="#000080" text="#ffffff"><h1>404 - Page Not Found</h1><p>The page you requested is under construction or has moved to a new neighbourhood on the JackNet.</p><p><a href="/" style="color:yellow">Back to Jack\'s Home Page</a></p></body></html>');
    }
    const ext = path.extname(file);
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    };
    if (ext === '.html') {
      headers['Content-Security-Policy'] = HTML_CSP;
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

// ---------------------------------------------------------------- admin (curl only)
function admin(req, res, action) {
  const tok = req.headers['x-admin-token'] || '';
  const ok = ADMIN_TOKEN && tok.length === ADMIN_TOKEN.length && crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(ADMIN_TOKEN));
  if (!ok || req.method !== 'POST') { res.writeHead(403); return res.end('nope\n'); }
  const q = new URL(req.url, 'http://x').searchParams;
  switch (action) {
    case 'wipe-wall': state.wall = DEFAULT_STATE.wall; broadcast({ t: 'wall', wall: state.wall }); break;
    case 'clear-chat': state.chat = []; broadcast({ t: 'chatClear' }); break;
    case 'delete-gb': { const id = q.get('id'); state.guestbook = state.guestbook.filter(e => e.id !== id); broadcast({ t: 'gbAll', gb: state.guestbook.slice(0, 50) }); break; }
    case 'reset-cube': state.cube = Cube.solved(); state.cubeScrambled = false; state.cubeSinceSolved = 0; broadcast({ t: 'cubeState', cube: state.cube, moves: state.cubeMoves }); break;
    case 'register': { // claim a reserved name (e.g. Jack): POST /admin/register with JSON {"name":"Jack","pass":"...","mustChange":true}
      let body = '';
      req.on('data', d => { body += d; if (body.length > 2000) req.destroy(); });
      req.on('end', async () => {
        let j; try { j = JSON.parse(body); } catch { res.writeHead(400); return res.end('send JSON {"name","pass"}\n'); }
        const name = String(j.name || ''), pass = String(j.pass || ''), key = name.toLowerCase();
        if (!/^[A-Za-z0-9_\-]{2,16}$/.test(name) || pass.length < 6) { res.writeHead(400); return res.end('name 2-16 chars, pass 6+ chars\n'); }
        const salt = crypto.randomBytes(16).toString('hex');
        const old = state.members[key];
        if (old) for (const h of old.tokens) tokenIndex.delete(h);
        state.members[key] = Object.assign({}, old || {}, { name, no: old ? old.no : ++state.memberSeq, salt, hash: await scryptHash(pass, salt), created: old ? old.created : Date.now(), tokens: [] });
        if (j.mustChange) state.members[key].mustChange = true; else delete state.members[key].mustChange; // the member is asked to pick a new password at their next logon
        markDirty(); res.writeHead(200); res.end(`ok, ${name} is member #${state.members[key].no}\n`);
      });
      return;
    }
    case 'delete-member': {
      const key = String(q.get('name') || '').toLowerCase(), mem = state.members[key];
      if (!mem) { res.writeHead(404); return res.end('no such member\n'); }
      for (const h of mem.tokens) tokenIndex.delete(h);
      delete state.members[key];
      for (const [ws2, c2] of clients) if (c2.member && c2.member.toLowerCase() === key) { c2.member = ''; c2.nick = guestNick(); send(ws2, { t: 'you', nick: c2.nick, member: false }); }
      broadcast({ t: 'online', online: presence() });
      break;
    }
    case 'reset-pc': { // give a member a brand-new PC (programs, files, settings, secrets, saves): POST /admin/reset-pc?name=Jack
      const key = String(q.get('name') || '').toLowerCase(), mem = state.members[key];
      if (!mem) { res.writeHead(404); return res.end('no such member\n'); }
      let n = 0; try { n = require(path.join(__dirname, 'mods', 'roam.js')).resetProfile(mem.name); } catch (e) { res.writeHead(500); return res.end('reset failed: ' + e.message + '\n'); }
      res.writeHead(200); return res.end(`ok, ${mem.name} has a fresh PC (old profile backed up; ${n} open window(s) told to reload)\n`);
    }
    case 'reset-installs': { // a fresh PC's software only (programs, toolbars, discs), progress kept: POST /admin/reset-installs?name=Jack
      const key = String(q.get('name') || '').toLowerCase(), mem = state.members[key];
      if (!mem) { res.writeHead(404); return res.end('no such member\n'); }
      let n = 0; try { n = require(path.join(__dirname, 'mods', 'roam.js')).resetInstalls(mem.name); } catch (e) { res.writeHead(500); return res.end('reset failed: ' + e.message + '\n'); }
      res.writeHead(200); return res.end(`ok, ${mem.name}'s PC is back to bare software, progress kept (old profile backed up; ${n} open window(s) told to reload)\n`);
    }
    case 'kv-del': delete state.kv[q.get('k')]; kvFields = null; break; // wipe a shared toy: /admin/kv-del?k=key
    case 'delete-topic': { const id = +q.get('topic'); state.forum.topics = state.forum.topics.filter(t => t.id !== id); break; }
    case 'delete-post': { const t = findTopic(+q.get('topic')); const p = t && t.posts.find(x => x.id === +q.get('post')); if (p) p.body = '[removed by Jack]'; break; }
    case 'members': res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(Object.values(state.members).map(m => ({ name: m.name, no: m.no, created: new Date(m.created).toISOString() })), null, 1));
    case 'state': res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ online: clients.size, hits: state.hits, guestbook: state.guestbook, chat: state.chat }, null, 1));
    default: res.writeHead(404); return res.end('unknown action\n');
  }
  markDirty();
  res.writeHead(200); res.end('ok\n');
}

const diagSeen = new Map();
function diagPost(req, res) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim(), now = Date.now();
  if (now - (diagSeen.get(ip) || 0) < 60000) { res.writeHead(429); return res.end(); }
  diagSeen.set(ip, now); if (diagSeen.size > 500) for (const [k, t] of diagSeen) if (now - t > 60000) diagSeen.delete(k);
  let b = '', big = false;
  req.on('data', c => { if (big) return; b += c; if (b.length > 4096) { big = true; res.writeHead(413); res.end(); } });
  req.on('end', () => {
    if (big) return;
    try {
      const f = path.join(DATA_DIR, 'diag.log'); fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.appendFileSync(f, JSON.stringify({ ip, ua: String(req.headers['user-agent'] || '').slice(0, 200), d: b }) + '\n');
      if (fs.statSync(f).size > 1048576) { const t = fs.readFileSync(f); const k = t.indexOf(10, t.length - 786432); fs.writeFileSync(f, k < 0 ? '' : t.subarray(k + 1)); }
    } catch (e) {}
    res.writeHead(204); res.end();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/diag') return diagPost(req, res);
  const m = req.url.match(/^\/admin\/([a-z-]+)/);
  if (m) return admin(req, res, m[1]);
  if (req.url === '/healthz') { res.writeHead(200); return res.end('ok'); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (serveShared(req, res)) return;
  serveStatic(req, res);
});

// ---------------------------------------------------------------- websocket
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
const clients = new Map(); // ws -> info

// ---------------------------------------------------------------- server mods (mods/*.js)
// Each mod exports { name, types: ['msgType', ...], init(ctx), handle(ws, c, m) } and keeps its own persisted data in
// state.mods[name]. ctx gives it the shared helpers; ctx.on(event, fn) hears site events:
// 'hello' (ws, c), 'score' (c, game, score), 'post' (c, kind), 'chat' (c), 'gb' (c, entry), 'login' (c, isNew), 'close' (c).
// Also 'cube' (c) shared cube solved, 'waaagh' (c) WAAAGH called, 'pet' (c, action, useful); mods can fire their own with ctx.emit(ev, ...).
const MOD_TYPES = {}, MOD_EVENTS = {};
function modEmit(ev, ...args) { for (const fn of MOD_EVENTS[ev] || []) { try { fn(...args); } catch (e) { console.error('mod event', ev, e); } } }
function loadMods() {
  const dir = path.join(__dirname, 'mods');
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort(); } catch { return; }
  for (const f of files) {
    try {
      const mod = require(path.join(dir, f));
      if (!mod || !mod.name || typeof mod.handle !== 'function') continue;
      state.mods = state.mods || {};
      state.mods[mod.name] = state.mods[mod.name] || {};
      const ctx = {
        data: state.mods[mod.name], state, clients, send, broadcast, markDirty, clean, delink, Bucket, pushChat, presence, scrypt: scryptHash, emit: modEmit,
        member: c => (c && c.member ? state.members[c.member.toLowerCase()] : null),
        on: (ev, fn) => { (MOD_EVENTS[ev] = MOD_EVENTS[ev] || []).push(fn); },
      };
      if (mod.init) mod.init(ctx);
      for (const t of mod.types || []) MOD_TYPES[t] = (ws, c, m) => { try { mod.handle(ws, c, m); } catch (e) { console.error('mod', mod.name, m.t, e); } };
      console.log('mod loaded:', mod.name, (mod.types || []).join(','));
    } catch (e) { console.error('mod failed to load:', f, e.message); }
  }
}
const perIp = new Map();
const recentHits = new Map(); // browser id (or ip) -> ts of last counted visit
const newVisitsByIp = new Map(); // ip -> [ts...] so a script can't spin the counter
const gbByIp = new Map();
const lostIds = new Map(); // browser id -> [{ id, nick, col, at }, ...] (one per tab, newest last) for visitors whose connection just dropped
let nextId = 1;

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/ws')) return socket.destroy();
  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.includes(origin) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return socket.destroy();
  const ip = clientIp(req);
  if ((perIp.get(ip) || 0) >= 8) return socket.destroy();
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req, ip));
});

function send(ws, msg) { if (ws.readyState === 1) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)); }
function broadcast(msg, except) {
  const s = JSON.stringify(msg);
  for (const ws of clients.keys()) if (ws !== except) send(ws, s);
}
function presence() {
  return [...clients.values()].filter(c => c.ready).map(c => ({ id: c.id, nick: c.nick, col: c.col, where: c.where, member: !!c.member }));
}
function pushChat(entry) {
  state.chat.push(entry);
  if (state.chat.length > 60) state.chat.splice(0, state.chat.length - 60);
  broadcast({ t: 'chat', m: entry });
  markDirty();
}

function petView() { return Object.assign({}, state.pet, { deaths: state.petDeaths }); }

function snapshot(info) {
  return {
    t: 'welcome', v: VERSION, id: info.id, nick: info.nick, col: info.col, visitorNo: info.visitorNo,
    member: !!info.member, memberNo: info.member ? state.members[info.member.toLowerCase()].no : 0, members: memberCount(),
    hits: state.hits, button: state.button, buttonBy: state.buttonBy,
    cube: state.cube, cubeMoves: state.cubeMoves, cubeSolves: state.cubeSolves, cubeLastSolver: state.cubeLastSolver,
    wall: state.wall, wallW: WALL_W, wallH: WALL_H,
    pet: petView(), waaagh: waaaghLevel, waaaghs: state.waaaghs, waaaghLastBy: state.waaaghLastBy,
    poll: state.poll, pollOptions: POLL_OPTIONS, voted: info.cid && state.pollVoters[info.cid] !== undefined ? state.pollVoters[info.cid] : -1,
    flings: state.flings, scores: state.scores, trisLines: state.trisLines, trisWins: topWins(), battle: battleView(), chat: state.chat, gb: state.guestbook.slice(0, 50), gbTotal: state.guestbook.length,
    online: presence(), resetVotes: cubeResetVotes.size,
  };
}

// cube reset needs several netizens to agree
const cubeResetVotes = new Map(); // client id -> ts
function resetVotesNeeded() { return Math.max(1, Math.min(3, [...clients.values()].filter(c => c.ready).length)); }

// WAAAGH! meter lives in memory, it is supposed to fade
let waaaghLevel = 0, waaaghSent = 0, waaaghLastClicker = '';
setInterval(() => {
  if (waaaghLevel > 0) {
    waaaghLevel = Math.max(0, waaaghLevel - 0.5);
    if (Math.abs(waaaghLevel - waaaghSent) >= 0.5 || waaaghLevel === 0) { waaaghSent = waaaghLevel; broadcast({ t: 'waaaghLvl', v: waaaghLevel }); }
  }
}, 250);

// The grot gets hungry whether anyone is watching or not
setInterval(() => {
  const p = state.pet;
  if (p.dead) return;
  p.food = Math.max(0, p.food - 0.25);
  p.fun = Math.max(0, p.fun - 0.35);
  p.clean = Math.max(0, p.clean - 0.15);
  if (p.food <= 0) {
    p.dead = true; p.diedAt = Date.now(); state.petDeaths++;
    pushChat({ sys: true, text: `*** Gubbinz ${roman(p.gen)} has starved and gone to da Great Green in da sky. RIP.`, ts: Date.now() });
  }
  broadcast({ t: 'pet', pet: petView() });
  markDirty();
}, 60000);

function roman(n) {
  const r = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = ''; for (const [v, l] of r) while (n >= v) { s += l; n -= v; } return s;
}

// forget old IPs so the rate-limit maps don't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [k, ts] of recentHits) if (now - ts > 30 * 60000) recentHits.delete(k);
  for (const [ip, list] of newVisitsByIp) if (!list.some(t => now - t < 30 * 60000)) newVisitsByIp.delete(ip);
  for (const [ip, ts] of gbByIp) if (now - ts > 60000) gbByIp.delete(ip);
}, 10 * 60000);

// heartbeat so dead dial-up connections get dropped
setInterval(() => {
  for (const [ws, c] of clients) {
    if (!c.alive) { ws.terminate(); continue; }
    c.alive = false; ws.ping();
  }
}, 30000);

wss.on('connection', (ws, req, ip) => {
  perIp.set(ip, (perIp.get(ip) || 0) + 1);
  const info = {
    id: nextId++, ip, nick: '', member: '', col: COLOURS[Math.floor(Math.random() * COLOURS.length)], ready: false, alive: true, cid: '', where: '',
    rl: { score: new Bucket(0.4, 2), where: new Bucket(5, 20), msg: new Bucket(40, 80), btn: new Bucket(12, 20), cube: new Bucket(5, 8), px: new Bucket(15, 40), chat: new Bucket(0.5, 3), cur: new Bucket(20, 40), pet: new Bucket(0.4, 3), wa: new Bucket(7, 10), fling: new Bucket(2, 4), lines: new Bucket(2, 6), board: new Bucket(8, 12), bt: new Bucket(3, 8), sq: new Bucket(0.5, 3), post: new Bucket(0.1, 2), shout: new Bucket(0.1, 2), kv: new Bucket(15, 60), kvl: new Bucket(0.2, 3), relay: new Bucket(12, 40) },
  };
  clients.set(ws, info);
  ws.on('pong', () => { info.alive = true; });

  ws.on('message', raw => {
    if (!info.rl.msg.take()) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    handle(ws, info, m);
  });

  ws.on('close', () => onGone(ws, info, false));
});
// a visitor's socket closed (or, with replaced=true, the same browser tab has just reconnected on a new socket while the
// server still thought the old one was alive: a half-open phone or laptop connection). Their id waits in lostIds.
function onGone(ws, info, replaced) {
  if (info.dropped) return; info.dropped = true;
  clients.delete(ws);
  if (info.ready && info.cid) {
    const l = (lostIds.get(info.cid) || []).filter(x => x.id !== info.id && Date.now() - x.at < 180000);
    l.push({ id: info.id, nick: info.member ? '' : info.nick, col: info.col, at: Date.now() }); if (l.length > 4) l.shift();
    lostIds.delete(info.cid); lostIds.set(info.cid, l); if (lostIds.size > 5000) lostIds.delete(lostIds.keys().next().value);
  }
  modEmit('close', info);
  const n = (perIp.get(info.ip) || 1) - 1;
  if (n <= 0) perIp.delete(info.ip); else perIp.set(info.ip, n);
  cubeResetVotes.delete(info.id);
  if (!info.ready) return;
  battleDrop(info);
  if (replaced) return; // the same id is back this instant, so nobody needs to hear they went
  broadcast({ t: 'trisGone', id: info.id });
  broadcast({ t: 'online', online: presence() });
  broadcast({ t: 'gone', id: info.id });
}

// ---------------------------------------------------------------- JACKTRIS KNOCKOUT
// lobby -> countdown -> playing -> (last one standing) -> lobby. Pieces come from a shared seed.
const battle = { state: 'lobby', players: new Map(), seed: 0, goAt: 0, timer: null }; // players: id -> { nick, alive }
function battleView() {
  return { state: battle.state, goAt: battle.goAt, players: [...battle.players].map(([id, p]) => ({ id, nick: p.nick, alive: p.alive })) };
}
function topWins() { return Object.entries(state.trisWins).sort((a, b) => b[1] - a[1]).slice(0, 10); }
function battleBroadcast() { broadcast({ t: 'bt', b: battleView() }); }
function battleCheckEnd() {
  if (battle.state !== 'playing') return;
  const alive = [...battle.players].filter(([, p]) => p.alive);
  if (alive.length > 1) return;
  const winner = alive[0] ? alive[0][1].nick : null;
  if (winner) {
    if (alive[0][1].member) { state.trisWins[winner] = (state.trisWins[winner] || 0) + 1; markDirty(); } // only members go on the wins table (a guest's name is gone tomorrow)
    pushChat({ sys: true, text: `*** ${winner} WON THE JACKTRIS KNOCKOUT!!! (${battle.players.size} players)`, ts: Date.now() });
  }
  broadcast({ t: 'btEnd', winner, wins: topWins() });
  for (const p of battle.players.values()) clearTimeout(p.drop);
  battle.state = 'lobby'; battle.players.clear(); battle.goAt = 0;
  battleBroadcast();
}
// a connection blip isn't a knock-out: hold their place (20 s mid-battle, a minute in the lobby) in case they come straight back
function battleDrop(c) {
  const p = battle.players.get(c.id); if (!p || p.drop) return;
  p.drop = setTimeout(() => { p.drop = null; if (battle.players.get(c.id) === p && ![...clients.values()].some(x => x.ready && x.id === c.id)) battleLeave(c); }, battle.state === 'playing' ? 20000 : 60000);
}
function battleLeave(c) {
  if (!battle.players.has(c.id)) return;
  if (battle.state === 'playing') { battle.players.get(c.id).alive = false; broadcast({ t: 'btKO', id: c.id, nick: c.nick }); battleCheckEnd(); }
  else { battle.players.delete(c.id); if (battle.state === 'countdown' && battle.players.size < 2) { clearTimeout(battle.timer); battle.state = 'lobby'; battle.goAt = 0; } }
  battleBroadcast();
}

// ---------------------------------------------------------------- JackNet community: profiles + forums
const BOARDS = [
  ['general', 'General Natter', 'Chat about anything and everything!'],
  ['games', 'Video Games', 'N64, PlayStation, Game Boy, PC, Dreamcast...'],
  ['scifi', 'Sci-Fi & Films', 'Star Wars, The Matrix, Red Dwarf, Doctor Who...'],
  ['orks', 'Orks & Warhammer', 'WAAAGH! Painting, building and da best army'],
  ['puzzles', "Rubik's & Puzzles", 'Cubes, Tetris, brain teasers'],
  ['tech', 'Tech Talk', 'Megahertz, megabytes and modems'],
  ['offtopic', 'Off Topic', 'Anything else. Keep it nice!'],
];
const BOARD_IDS = BOARDS.map(b => b[0]);
const THEMES = ['stars', 'flames', 'matrix', 'clouds', 'hearts', 'grass', 'space', 'plain'];
const MOODS = ['Happy', 'Hyper', 'Bored', 'WAAAGH!', 'Hungry', 'Sleepy', 'Grumpy', 'Gaming', 'Painting', 'Cubing', 'On the phone', 'Y2K panic'];
const PCOLS = ['#e10600', '#ff8000', '#c9a000', '#2a9a2a', '#008080', '#0028c8', '#8000ff', '#d1007a', '#000000', '#808080'];
function memberOf(c) { return c.member ? state.members[c.member.toLowerCase()] : null; }
function profileOf(mem) {
  const p = mem.profile || {};
  return { avatar: p.avatar | 0, col: p.col || '#0028c8', mood: p.mood | 0, theme: p.theme || 'stars', bio: p.bio || '', game: p.game || '', film: p.film || '', playing: p.playing || '', poke: p.poke || '', sig: p.sig || '' };
}
function memberCard(mem) {
  const p = profileOf(mem);
  return { name: mem.name, no: mem.no, avatar: p.avatar, col: p.col, mood: p.mood, posts: mem.posts | 0, online: [...clients.values()].some(c => c.member === mem.name) };
}
function topicMeta(t) { return { id: t.id, board: t.board, title: t.title, by: t.by, ts: t.ts, last: t.last, lastBy: t.lastBy, replies: t.posts.length - 1, views: t.views | 0 }; }
function findTopic(id) { return state.forum.topics.find(t => t.id === id); }
function fmtPost(text) { return delink(clean(text, 2000)); }

function community(ws, c, m) {
  const mem = memberOf(c), now = Date.now();
  const need = () => { send(ws, { t: 'err', msg: 'You need to be a JackNet member for that. Joining is FREE: Start > Log Off, then pick a name and a password!' }); };
  switch (m.t) {
    case 'members': {
      const list = Object.values(state.members).sort((a, b) => a.no - b.no).map(memberCard);
      return send(ws, { t: 'members', list, moods: MOODS });
    }
    case 'profile': {
      const tm = state.members[String(m.name || '').toLowerCase()];
      if (!tm) return send(ws, { t: 'profile', missing: String(m.name || '').slice(0, 20) });
      if (!c.seenProfiles) c.seenProfiles = new Set();
      if (tm !== mem && !c.seenProfiles.has(tm.name)) { c.seenProfiles.add(tm.name); tm.visits = (tm.visits | 0) + 1; markDirty(); }
      return send(ws, { t: 'profile', p: Object.assign(memberCard(tm), profileOf(tm), { created: tm.created, visits: tm.visits | 0, shouts: (tm.shouts || []).slice(-30), moods: MOODS, me: tm === mem }) });
    }
    case 'saveProfile': {
      if (!mem) return need();
      const q = m.p || {}, P = {};
      P.avatar = Math.max(0, Math.min(15, q.avatar | 0));
      P.col = PCOLS.includes(q.col) ? q.col : '#0028c8';
      P.mood = Math.max(0, Math.min(MOODS.length - 1, q.mood | 0));
      P.theme = THEMES.includes(q.theme) ? q.theme : 'stars';
      P.bio = delink(clean(q.bio, 600)); P.game = clean(q.game, 40); P.film = clean(q.film, 40); P.playing = clean(q.playing, 40); P.poke = clean(q.poke, 20); P.sig = delink(clean(q.sig, 100));
      mem.profile = P; markDirty();
      c.col = P.col;
      send(ws, { t: 'profileSaved', name: mem.name });
      return broadcast({ t: 'online', online: presence() });
    }
    case 'shout': {
      if (!mem) return need();
      const tm = state.members[String(m.name || '').toLowerCase()], text = delink(clean(m.text, 200));
      if (!tm || !text) return;
      if (!c.rl.shout.take()) return send(ws, { t: 'err', msg: 'Slow down! One shout-out every 10 seconds.' });
      tm.shouts = (tm.shouts || []).concat({ by: mem.name, text, ts: now }).slice(-30); markDirty();
      for (const [ws2, c2] of clients) if (c2.member === tm.name && ws2 !== ws) send(ws2, { t: 'shouted', by: mem.name });
      return community(ws, c, { t: 'profile', name: tm.name });
    }
    case 'fBoards': {
      const boards = BOARDS.map(([id, name, desc]) => {
        const ts = state.forum.topics.filter(t => t.board === id);
        const last = ts.reduce((a, t) => (!a || t.last > a.last ? t : a), null);
        return { id, name, desc, topics: ts.length, posts: ts.reduce((n, t) => n + t.posts.length, 0), last: last && { id: last.id, title: last.title, by: last.lastBy, ts: last.last } };
      });
      return send(ws, { t: 'fBoards', boards, members: memberCount(), online: [...clients.values()].filter(x => x.ready).length });
    }
    case 'fTopics': {
      if (!BOARD_IDS.includes(m.board)) return;
      const all = state.forum.topics.filter(t => t.board === m.board).sort((a, b) => b.last - a.last);
      const pages = Math.max(1, Math.ceil(all.length / 15)), page = Math.max(1, Math.min(pages, m.page | 0 || 1));
      return send(ws, { t: 'fTopics', board: m.board, boardName: BOARDS.find(b => b[0] === m.board)[1], page, pages, list: all.slice((page - 1) * 15, page * 15).map(topicMeta) });
    }
    case 'fTopic': {
      const t = findTopic(m.id | 0); if (!t) return send(ws, { t: 'err', msg: 'That topic has been deleted.' });
      if (!c.seenTopics) c.seenTopics = new Set();
      if (!c.seenTopics.has(t.id)) { c.seenTopics.add(t.id); t.views = (t.views | 0) + 1; markDirty(); }
      const pages = Math.max(1, Math.ceil(t.posts.length / 20)), page = m.page === 'last' ? pages : Math.max(1, Math.min(pages, m.page | 0 || 1));
      const posts = t.posts.slice((page - 1) * 20, page * 20).map(p => {
        const am = state.members[p.by.toLowerCase()];
        return Object.assign({}, p, { author: am ? Object.assign(memberCard(am), { sig: profileOf(am).sig }) : null });
      });
      return send(ws, { t: 'fTopic', topic: topicMeta(t), boardName: BOARDS.find(b => b[0] === t.board)[1], page, pages, posts, moods: MOODS });
    }
    case 'fNew': case 'fReply': {
      if (!mem) return need();
      if (!c.rl.post.take()) return send(ws, { t: 'err', msg: 'Slow down! One post every 10 seconds.' });
      const body = fmtPost(m.body);
      if (!body) return send(ws, { t: 'err', msg: "You haven't written anything!" });
      let t;
      if (m.t === 'fNew') {
        const title = clean(m.title, 80);
        if (!title || !BOARD_IDS.includes(m.board)) return send(ws, { t: 'err', msg: 'Your topic needs a title!' });
        t = { id: state.forum.seq++, board: m.board, title, by: mem.name, ts: now, last: now, lastBy: mem.name, views: 0, posts: [] };
        state.forum.topics.push(t);
        if (state.forum.topics.length > 2000) state.forum.topics.sort((a, b) => b.last - a.last).length = 2000;
      } else {
        t = findTopic(m.topic | 0); if (!t) return send(ws, { t: 'err', msg: 'That topic has been deleted.' });
        if (t.posts.length >= 1000) return send(ws, { t: 'err', msg: 'This topic is full! Start a new one.' });
      }
      t.posts.push({ id: (t.posts.length ? t.posts[t.posts.length - 1].id : 0) + 1, by: mem.name, ts: now, body });
      t.last = now; t.lastBy = mem.name; mem.posts = (mem.posts | 0) + 1; markDirty();
      send(ws, { t: 'fPosted', topic: t.id });
      modEmit('post', c, m.t);
      broadcast({ t: 'fActivity', kind: m.t === 'fNew' ? 'topic' : 'reply', board: t.board, topic: t.id, title: t.title, by: mem.name });
      if (m.t === 'fNew') pushChat({ sys: true, text: `*** ${mem.name} started a new topic in ${BOARDS.find(b => b[0] === t.board)[1]}: "${t.title}"`, ts: now });
      return;
    }
    case 'fDel': {
      if (!mem) return need();
      const t = findTopic(m.topic | 0); if (!t) return;
      const i = t.posts.findIndex(p => p.id === (m.post | 0));
      if (i < 0 || t.posts[i].by !== mem.name) return;
      if (i === 0 && t.posts.length === 1) state.forum.topics = state.forum.topics.filter(x => x !== t);
      else t.posts[i].body = '[deleted by ' + mem.name + ']';
      markDirty();
      return send(ws, { t: 'fPosted', topic: i === 0 && t.posts.length <= 1 ? 0 : t.id, board: t.board });
    }
  }
}

// ---------------------------------------------------------------- shared toys
// A tiny generic store so desktop programs can share things between visitors without a server change each time:
// counters (kvInc), notes lists (kvPush) and maps of small strings (kvPut, e.g. pixel grids or fridge magnets).
// Plus "relay": pass a small JSON message to one visitor (to=id) or everyone (to=0), for two-player games.
const KEY_RE = /^[a-z0-9_.-]{1,40}$/, FIELD_RE = /^[a-z0-9_.-]{1,24}$/;
const KV_MAX_KEYS = 3000, KV_MAX_FIELDS = 60000, KV_LIST_LEN = 40;
function kvFieldCount() { let n = 0; for (const v of Object.values(state.kv)) if (v && typeof v === 'object' && !Array.isArray(v)) n += Object.keys(v).length; return n; }
let kvFields = null;
// JackNet members-only shared things (the same list is in public/js/guest.js, which explains it to guests first):
// pen pals, quiz hall of fame, the compo, IRC topics, bottles, Shareware Shack ratings + reviews, JackBay bids + selling
const MEMBER_KV = /^(site\.penpals|site\.quiz\.hof|site\.compo|social\.irctopic|social\.bottles|ss\.rt\.[a-z0-9._-]+|ss\.rv\.[a-z0-9._-]+|eras\.bay\.(?!fb$)[a-z0-9_-]+)$/;
const memberRelay = (ch, d) => { const k = d && typeof d === 'object' ? d.k : ''; return (ch === 'social.im' && (k === 'm' || k === 'nudge' || k === 'file')) || ch === 'social.bottle' || (ch === 'social.irc' && k === 'm') || (ch === 'social.throw' && !!(d && d.m)); };
const MEMBERS_ONLY = 'That\'s for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!';
function shared(ws, c, m) {
  const kv = state.kv, k = String(m.k || '');
  if (!c.member && (m.t === 'kvPush' || m.t === 'kvPut' || m.t === 'kvInc') && MEMBER_KV.test(k)) return send(ws, { t: 'err', msg: MEMBERS_ONLY });
  if (!c.member && m.t === 'relay' && memberRelay(String(m.ch || ''), m.d)) return send(ws, { t: 'err', msg: MEMBERS_ONLY });
  switch (m.t) {
    case 'kvGet': {
      const keys = (Array.isArray(m.k) ? m.k : [m.k]).slice(0, 30).map(String).filter(x => KEY_RE.test(x));
      const vals = {}; for (const x of keys) vals[x] = kv[x] === undefined ? null : kv[x];
      return send(ws, { t: 'kv', vals, rid: m.rid | 0 });
    }
    case 'kvInc': {
      if (!KEY_RE.test(k) || !c.rl.kv.take()) return;
      if (kv[k] === undefined) { if (Object.keys(kv).length >= KV_MAX_KEYS) return; kv[k] = 0; }
      if (typeof kv[k] !== 'number') return;
      kv[k] = Math.min(Number.MAX_SAFE_INTEGER, kv[k] + 1); markDirty();
      return broadcast({ t: 'kvSet', k, v: kv[k], by: c.nick });
    }
    case 'kvPush': {
      const text = delink(clean(m.text, 300));
      if (!KEY_RE.test(k) || !text || !c.rl.kvl.take()) return;
      if (kv[k] === undefined) { if (Object.keys(kv).length >= KV_MAX_KEYS) return; kv[k] = []; }
      if (!Array.isArray(kv[k])) return;
      const e = { by: c.nick, col: c.col, member: !!c.member, text, ts: Date.now() };
      kv[k].push(e); if (kv[k].length > KV_LIST_LEN) kv[k].splice(0, kv[k].length - KV_LIST_LEN);
      markDirty();
      return broadcast({ t: 'kvPush', k, e });
    }
    case 'kvPut': {
      const f = String(m.f || ''), v = m.v == null ? '' : clean(String(m.v), 120);
      if (!KEY_RE.test(k) || !FIELD_RE.test(f) || !c.rl.kv.take()) return;
      if (kv[k] === undefined) { if (Object.keys(kv).length >= KV_MAX_KEYS) return; kv[k] = {}; }
      const o = kv[k]; if (!o || typeof o !== 'object' || Array.isArray(o)) return;
      if (kvFields === null) kvFields = kvFieldCount();
      if (v === '') { if (f in o) { delete o[f]; kvFields--; } }
      else { if (!(f in o)) { if (kvFields >= KV_MAX_FIELDS || Object.keys(o).length >= 4096) return; kvFields++; } o[f] = v; }
      markDirty();
      return broadcast({ t: 'kvPut', k, f, v, by: c.nick });
    }
    case 'relay': {
      const ch = String(m.ch || ''); let d;
      try { d = JSON.stringify(m.d === undefined ? null : m.d); } catch { return; }
      if (!FIELD_RE.test(ch) || d.length > 1500 || !c.rl.relay.take()) return;
      const out = JSON.stringify({ t: 'relay', ch, d: JSON.parse(d), from: c.nick, fromId: c.id, col: c.col, member: !!c.member });
      const to = m.to | 0;
      for (const [ws2, c2] of clients) if (ws2 !== ws && c2.ready && (to === 0 || c2.id === to)) send(ws2, out);
      return;
    }
  }
}

function logIn(ws, c, key, isNew) {
  const mem = state.members[key], old = c.nick;
  c.member = mem.name; c.nick = mem.name; if (mem.profile && mem.profile.col) c.col = mem.profile.col;
  send(ws, { t: 'loginOk', nick: mem.name, token: newToken(key), no: mem.no, isNew, members: memberCount() });
  broadcast({ t: 'online', online: presence() });
  modEmit('login', c, isNew);
  pushChat({ sys: true, text: isNew ? `*** ${mem.name} just joined JackNet! Member #${mem.no}` : `*** ${old} logged on as ${mem.name}`, ts: Date.now() });
  markDirty();
}

function handle(ws, c, m) {
  if (m.t === 'hello') {
    if (c.ready) return;
    c.ready = true;
    c.cid = typeof m.cid === 'string' ? m.cid.slice(0, 40) : '';
    // coming back after a dropped connection (a tab that was asleep, a wobbly phone signal): get the same id back, so games,
    // chats and anything else that was talking to this visitor carry on as if nothing happened
    // the tab's previous socket may be half-open (the server hasn't noticed it's dead yet): the tab says which id it had, so
    // retire that socket now and hand the id straight over (another tab of the same browser shares the cid but not the id)
    const prev = m.prev | 0;
    if (c.cid && prev > 0) for (const [ws2, x] of clients) if (x !== c && x.ready && x.cid === c.cid && x.id === prev) { onGone(ws2, x, true); try { ws2.terminate(); } catch (e) {} }
    // the tab that had id `prev` gets exactly that one back; a reloaded page (no prev) gets this browser's newest lost id.
    // A guest keeps their GuestNNNN name and colour too, so scores, chats and games still know who they are.
    let back = null;
    if (c.cid && lostIds.has(c.cid)) {
      const l = lostIds.get(c.cid), i = prev > 0 && l.some(x => x.id === prev) ? l.findIndex(x => x.id === prev) : l.length - 1;
      if (i >= 0) { back = l[i]; l.splice(i, 1); if (!l.length) lostIds.delete(c.cid); }
      if (back && !(Date.now() - back.at < 180000 && ![...clients.values()].some(x => x !== c && x.id === back.id))) back = null;
      if (back) { c.id = back.id; if (back.col) c.col = back.col; }
    }
    const mkey = typeof m.token === 'string' && m.token.length < 100 ? tokenIndex.get(sha(m.token)) : null;
    if (mkey && state.members[mkey]) { c.member = state.members[mkey].name; c.nick = c.member; if (state.members[mkey].profile && state.members[mkey].profile.col) c.col = state.members[mkey].profile.col; }
    else c.nick = back && back.nick && ![...clients.values()].some(x => x !== c && x.nick === back.nick) ? back.nick : guestNick();
    { const bp = battle.players.get(c.id); if (bp && bp.drop) { clearTimeout(bp.drop); bp.drop = null; bp.nick = c.nick || bp.nick; } } // back in time for the knockout
    // a "visit" = this browser not seen for 30 minutes; at most 5 new visits per IP per 30 minutes
    const now = Date.now(), key = c.cid || 'ip:' + c.ip;
    if (now - (recentHits.get(key) || 0) > 30 * 60000) {
      const recent = (newVisitsByIp.get(c.ip) || []).filter(t => now - t < 30 * 60000);
      if (recent.length < 5) { state.hits++; markDirty(); recent.push(now); }
      newVisitsByIp.set(c.ip, recent);
    }
    recentHits.set(key, now);
    c.visitorNo = state.hits;
    send(ws, snapshot(c));
    modEmit('hello', ws, c);
    broadcast({ t: 'hits', hits: state.hits }, ws);
    broadcast({ t: 'online', online: presence() });
    return;
  }
  if (!c.ready) return;

  if (/^(members|profile|saveProfile|shout|fBoards|fTopics|fTopic|fNew|fReply|fDel)$/.test(m.t)) return community(ws, c, m);
  if (/^(kvGet|kvInc|kvPush|kvPut|relay)$/.test(m.t)) return shared(ws, c, m);
  if (MOD_TYPES[m.t]) { if (!c.rl.mod) c.rl.mod = new Bucket(20, 60); if (!c.rl.mod.take()) return; return MOD_TYPES[m.t](ws, c, m); }
  switch (m.t) {
    case 'login': {
      if (!loginByIp.has(c.ip)) loginByIp.set(c.ip, new Bucket(0.1, 6));
      if (!loginByIp.get(c.ip).take()) return send(ws, { t: 'loginErr', msg: 'Too many tries. Have a biscuit and try again in a minute.' });
      const name = String(m.name || '').trim(), pass = String(m.pass || ''), key = name.toLowerCase();
      const mem = state.members[key];
      if (!mem) {
        const why = nameProblem(name);
        if (why) return send(ws, { t: 'loginErr', msg: why });
        if (pass.length < 4 || pass.length > 64) return send(ws, { t: 'loginErr', msg: 'Pick a password of at least 4 characters.' });
        const salt = crypto.randomBytes(16).toString('hex');
        scryptHash(pass, salt).then(hash => {
          if (state.members[key]) return send(ws, { t: 'loginErr', msg: 'Somebody just took that name! Try another.' });
          state.members[key] = { name, no: ++state.memberSeq, salt, hash, created: Date.now(), tokens: [] };
          logIn(ws, c, key, true);
        }).catch(() => send(ws, { t: 'loginErr', msg: 'JackNet had a wobble. Try again.' }));
        return;
      }
      const f = failsByName.get(key);
      if (f && f.until > Date.now()) return send(ws, { t: 'loginErr', msg: 'That account is locked for a few minutes (too many wrong passwords).' });
      scryptHash(pass, mem.salt).then(hash => {
        if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(mem.hash, 'hex'))) {
          const ff = failsByName.get(key) || { n: 0, until: 0 };
          ff.n++; if (ff.n >= 8) { ff.until = Date.now() + 10 * 60000; ff.n = 0; }
          failsByName.set(key, ff);
          return send(ws, { t: 'loginErr', msg: `"${mem.name}" is already a member, and that's the wrong password. If it's not you, pick a different name!` });
        }
        failsByName.delete(key);
        logIn(ws, c, key, false);
      }).catch(() => send(ws, { t: 'loginErr', msg: 'JackNet had a wobble. Try again.' }));
      return;
    }
    case 'logoff': {
      if (!c.member) return;
      const key = c.member.toLowerCase(), mem = state.members[key];
      if (mem && typeof m.token === 'string') { const h = sha(m.token); mem.tokens = mem.tokens.filter(x => x !== h); tokenIndex.delete(h); markDirty(); }
      const old = c.nick;
      c.member = ''; c.nick = guestNick();
      send(ws, { t: 'you', nick: c.nick, member: false });
      broadcast({ t: 'online', online: presence() });
      pushChat({ sys: true, text: `*** ${old} logged off`, ts: Date.now() });
      return;
    }
    case 'btn':
      if (!c.rl.btn.take()) return;
      state.button++; state.buttonBy = c.nick; markDirty();
      broadcast({ t: 'btn', n: state.button, by: c.nick });
      break;
    case 'cube': {
      const mv = m.m && { a: m.m.a, l: m.m.l, d: m.m.d };
      if (!Cube.validMove(mv) || !c.rl.cube.take()) return;
      Cube.apply(state.cube, mv);
      state.cubeMoves++;
      const solved = Cube.isSolved(state.cube);
      broadcast({ t: 'cubeMv', m: mv, by: c.nick, moves: state.cubeMoves });
      if (!solved) { if (++state.cubeSinceSolved >= 25) state.cubeScrambled = true; }
      else if (!state.cubeScrambled) state.cubeSinceSolved = 0;
      else {
        state.cubeSinceSolved = 0;
        state.cubeScrambled = false; state.cubeSolves++; state.cubeLastSolver = c.nick;
        broadcast({ t: 'cubeSolved', by: c.nick, solves: state.cubeSolves });
        modEmit('cube', c);
        pushChat({ sys: true, text: `*** ${c.nick} SOLVED THE CUBE!!! That's solve #${state.cubeSolves}`, ts: Date.now() });
      }
      markDirty();
      break;
    }
    case 'cubeScramble': {
      const now = Date.now();
      if (now - state.cubeLastScramble < 60000) return send(ws, { t: 'err', msg: 'The cube was only just scrambled! Wait a minute.' });
      state.cubeLastScramble = now;
      const moves = [];
      for (let i = 0; i < 25; i++) { const mv = Cube.randomMove(); Cube.apply(state.cube, mv); moves.push(mv); }
      state.cubeMoves += 25; state.cubeScrambled = !Cube.isSolved(state.cube);
      broadcast({ t: 'cubeScrambled', moves, by: c.nick, total: state.cubeMoves });
      markDirty();
      break;
    }
    case 'cubeReset': {
      const now = Date.now();
      for (const [id, ts] of cubeResetVotes) if (now - ts > 120000) cubeResetVotes.delete(id);
      cubeResetVotes.set(c.id, now);
      const need = resetVotesNeeded();
      if (cubeResetVotes.size >= need) {
        cubeResetVotes.clear();
        state.cube = Cube.solved(); state.cubeScrambled = false; state.cubeSinceSolved = 0; markDirty();
        broadcast({ t: 'cubeState', cube: state.cube, moves: state.cubeMoves, reset: c.nick });
      }
      broadcast({ t: 'resetVotes', n: cubeResetVotes.size, need });
      break;
    }
    case 'px': {
      const i = m.i | 0, col = m.c | 0;
      if (i < 0 || i >= WALL_W * WALL_H || col < 0 || col > 15 || !c.rl.px.take()) return;
      const ch = col.toString(16);
      if (state.wall[i] === ch) return;
      state.wall = state.wall.slice(0, i) + ch + state.wall.slice(i + 1); markDirty();
      broadcast({ t: 'px', i, c: col });
      break;
    }
    case 'chat': {
      let text = delink(clean(m.text, 200));
      if (!text) return;
      if (!c.rl.chat.take()) return send(ws, { t: 'err', msg: 'Whoa, flood control! Slow down, cowboy.' });
      pushChat({ nick: c.nick, col: c.col, text, ts: Date.now(), me: !!m.me, mem: !!c.member });
      modEmit('chat', c);
      break;
    }
    case 'gb': {
      const now = Date.now();
      if (now - (gbByIp.get(c.ip) || 0) < 10000) return send(ws, { t: 'err', msg: 'Hold your horses! One letter every 10 seconds.' });
      const name = c.member || clean(m.name, 30), msg = delink(clean(m.msg, 500));
      if (!name || !msg) return send(ws, { t: 'err', msg: 'Please fill in your name AND a message!' });
      if (!c.member && (isMemberName(name) || RESERVED.test(name))) return send(ws, { t: 'err', msg: `"${name}" belongs to a JackNet member. Log on as them, or use a different name.` });
      gbByIp.set(c.ip, now);
      const e = { id: crypto.randomBytes(4).toString('hex'), name, from: clean(m.from, 40), home: delink(clean(m.home, 60)), found: clean(m.found, 30), msg, ts: now };
      state.guestbook.unshift(e);
      if (state.guestbook.length > 500) state.guestbook.length = 500;
      markDirty();
      broadcast({ t: 'gb', e, total: state.guestbook.length });
      send(ws, { t: 'gbOk' });
      modEmit('gb', c, e);
      pushChat({ sys: true, text: `*** ${name} just signed the guestbook!`, ts: now });
      break;
    }
    case 'pet': {
      const p = state.pet;
      if (!c.rl.pet.take()) return send(ws, { t: 'petSay', text: "'Oi! Give us a sec!'" });
      if (p.dead) {
        if (m.a !== 'hatch') return;
        if (Date.now() - p.diedAt < 60000) return send(ws, { t: 'err', msg: 'Show some respect, Gubbinz only just died. (Give it a minute.)' });
        state.pet = freshPet(p.gen + 1); markDirty();
        broadcast({ t: 'pet', pet: petView(), by: c.nick, did: 'hatch' });
        pushChat({ sys: true, text: `*** ${c.nick} hatched Gubbinz ${roman(p.gen + 1)} from a spore!`, ts: Date.now() });
        return;
      }
      const was = m.a === 'feed' ? p.food : m.a === 'play' ? p.fun : p.clean; // looking after him only counts (for Rupees) when he needed it
      if (m.a === 'feed') { p.food = Math.min(100, p.food + 12); p.feeds++; }
      else if (m.a === 'play') { p.fun = Math.min(100, p.fun + 15); p.food = Math.max(1, p.food - 2); p.clean = Math.max(0, p.clean - 4); }
      else if (m.a === 'clean') { p.clean = Math.min(100, p.clean + 20); p.fun = Math.max(0, p.fun - 3); }
      else return;
      p.lastBy = c.nick; markDirty();
      broadcast({ t: 'pet', pet: petView(), by: c.nick, did: m.a });
      modEmit('pet', c, m.a, was < 90);
      break;
    }
    case 'waaagh':
      if (!c.rl.wa.take()) return;
      waaaghLevel = Math.min(100, waaaghLevel + 1);
      waaaghLastClicker = c.nick;
      if (waaaghLevel >= 100) {
        waaaghLevel = 0; waaaghSent = 0; state.waaaghs++; state.waaaghLastBy = c.nick; markDirty();
        broadcast({ t: 'WAAAGH', n: state.waaaghs, by: c.nick });
        modEmit('waaagh', c);
        pushChat({ sys: true, text: `*** WAAAGH!!! #${state.waaaghs} called by ${c.nick}!`, ts: Date.now() });
      } else if (Math.abs(waaaghLevel - waaaghSent) >= 1) { waaaghSent = waaaghLevel; broadcast({ t: 'waaaghLvl', v: waaaghLevel }); }
      break;
    case 'vote': {
      const o = m.o | 0;
      if (!c.cid || o < 0 || o >= POLL_OPTIONS.length || state.pollVoters[c.cid] !== undefined) return;
      state.pollVoters[c.cid] = o; state.poll[o]++; markDirty();
      broadcast({ t: 'poll', poll: state.poll });
      send(ws, { t: 'voted', o });
      break;
    }
    case 'lines': { // JACKTRIS lines cleared
      const n = m.n | 0;
      if (n < 1 || n > 4 || !c.rl.lines.take()) return;
      state.trisLines += n; markDirty();
      broadcast({ t: 'lines', total: state.trisLines, n, by: c.nick });
      break;
    }
    case 'board': { // live JACKTRIS board for spectators: 200 chars of 0-3 plus a few numbers
      if (!c.rl.board.take() || typeof m.b !== 'string' || !/^[0-4]{200}$/.test(m.b)) return;
      broadcast({ t: 'board', id: c.id, nick: c.nick, b: m.b, s: Math.max(0, m.s | 0), l: Math.max(0, m.l | 0), on: !!m.on, bt: battle.players.has(c.id) }, ws);
      break;
    }
    case 'btJoin':
      if (!c.rl.bt.take() || battle.state === 'playing' || battle.players.has(c.id) || battle.players.size >= 8) return;
      battle.players.set(c.id, { nick: c.nick, alive: true, member: !!c.member }); battleBroadcast();
      if (battle.players.size === 2) pushChat({ sys: true, text: `*** A JACKTRIS KNOCKOUT is filling up! Games > JACKTRIS to join.`, ts: Date.now() });
      break;
    case 'btLeave': if (c.rl.bt.take()) battleLeave(c); break;
    case 'btStart':
      if (!c.rl.bt.take() || battle.state !== 'lobby' || !battle.players.has(c.id) || battle.players.size < 2) return;
      battle.state = 'countdown'; battle.seed = crypto.randomBytes(4).readUInt32LE(0); battle.goAt = Date.now() + 5000;
      battleBroadcast();
      battle.timer = setTimeout(() => {
        if (battle.state !== 'countdown') return;
        battle.state = 'playing';
        for (const p of battle.players.values()) p.alive = true;
        broadcast({ t: 'btGo', seed: battle.seed, ids: [...battle.players.keys()] });
        battleBroadcast();
      }, 5000);
      break;
    case 'btAttack': { // cleared lines -> junk for a random opponent who's still in
      const n = m.n | 0, me = battle.players.get(c.id);
      if (battle.state !== 'playing' || !me || !me.alive || n < 1 || n > 4 || !c.rl.bt.take()) return;
      const targets = [...battle.players].filter(([id, p]) => p.alive && id !== c.id);
      if (!targets.length) return;
      const [tid] = targets[Math.floor(Math.random() * targets.length)];
      for (const [ws2, c2] of clients) if (c2.id === tid) send(ws2, { t: 'btJunk', n, from: c.nick });
      broadcast({ t: 'btHit', from: c.nick, to: battle.players.get(tid).nick, n });
      break;
    }
    case 'btKO': {
      const me = battle.players.get(c.id);
      if (battle.state !== 'playing' || !me || !me.alive) return;
      me.alive = false; broadcast({ t: 'btKO', id: c.id, nick: c.nick });
      battleCheckEnd(); battleBroadcast();
      break;
    }
    case 'sqThrow': { // someone lobbed a squig: everyone else sees a ghost of it
      if (!c.rl.sq.take()) return;
      const f = k => Math.max(-50, Math.min(50, +m[k] || 0));
      broadcast({ t: 'sqThrow', nick: c.nick, col: c.col, vx: f('vx'), vy: f('vy'), w: Math.max(-0.05, Math.min(0.05, +m.w || 0)), seed: (m.seed >>> 0) }, ws);
      break;
    }
    case 'popup': { // WinPopup / "net send": a little message box on someone else's screen
      const text = delink(clean(m.text, 200));
      if (!text || !c.rl.shout.take()) return;
      for (const [ws2, c2] of clients) if (c2.id === (m.to | 0) && ws2 !== ws) send(ws2, { t: 'popup', from: c.nick, fromId: c.id, text });
      break;
    }
    case 'fling':
      if (!c.rl.fling.take()) return;
      state.flings++; markDirty();
      broadcast({ t: 'flings', n: state.flings });
      break;
    case 'c': // cursor, relative to the section the visitor is looking at
      if (!c.rl.cur.take()) return;
      broadcast({ t: 'c', id: c.id, nick: c.nick, col: c.col, s: String(m.s || c.where).replace(/[^a-z0-9-]/g, '').slice(0, 16), x: +m.x || 0, y: +m.y || 0 }, ws);
      break;
    case 'where': { // which bit of the disc they're on
      const w = String(m.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 16);
      if (w === c.where || !c.rl.where.take()) return;
      c.where = w;
      broadcast({ t: 'online', online: presence() });
      break;
    }
    case 'score': {
      const max = GAMES[m.g], sc = Math.floor(+m.s);
      const name = String(m.n || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 3).trim();
      if (!max || !name || !(sc > 0 && sc <= max) || !c.rl.score.take()) return;
      if (!c.member) return send(ws, { t: 'err', msg: 'Join JackNet (free!) to get on the High Score tables.' });
      const list = state.scores[m.g];
      list.push({ n: clean(name, 3), s: sc, ts: Date.now() });
      list.sort((a, b) => (ASC[m.g] ? a.s - b.s : b.s - a.s) || a.ts - b.ts);
      list.length = Math.min(list.length, 10);
      markDirty();
      modEmit('score', c, m.g, sc);
      broadcast({ t: 'scores', g: m.g, list });
      const TITLES = { tris: 'JACKTRIS', squig: 'BLOBBIT LOB', snake: 'SNAKE', sweep: 'JACK SWEEPER', bricks: 'BRICK BASH', invaders: 'SAUCER INVADERS', rocks: 'SPACE ROCKS', pong: 'JACK PONG', whack: 'WHACK-A-ROBOT', simon: 'SIMON SAYS', hangman: 'HANGMAN' };
      if (list[0].s === sc && list[0].n === name) pushChat({ sys: true, text: `*** NEW ${TITLES[m.g] || m.g.toUpperCase()} RECORD by ${name}: ${m.g === 'squig' ? sc / 10 + 'm' : m.g === 'sweep' ? sc + ' seconds' : sc}!`, ts: Date.now() });
      break;
    }
    case 'z': // touching the plasma globe
      if (!c.rl.cur.take()) return;
      broadcast({ t: 'z', id: c.id, col: c.col, x: Math.max(-1, Math.min(1, +m.x || 0)), y: Math.max(-1, Math.min(1, +m.y || 0)) }, ws);
      break;
  }
}

loadMods();
server.listen(PORT, () => console.log(`Jack's Home Page v${VERSION} online at :${PORT}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { save(); process.exit(0); });
