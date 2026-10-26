/* Roaming profiles: a JackNet member's desktop (files, settings, secrets, saves... everything the PC keeps in
 * localStorage) is stored on the server, so it follows them to any computer they log on from.
 * Profiles live in DATA_DIR/profiles/<sha256(name)>.json, not in state.json, so the 5-second state save stays small.
 *   client -> { t:'rmGet', since }                    -> { t:'rmData', ts, enc, data } | { t:'rmSame', ts } | { t:'rmNone' }
 *   client -> { t:'rmPut', id, i, n, d, ts, enc }      (base64 chunks, d <= 3000 chars) -> { t:'rmSaved', ts } when complete
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), 'profiles');
const MAX = 1200000; // base64 chars per profile (~900 KB, gzip-compressed on the client so usually far less)
const CHUNK = 3000;
let ctx;

const fileOf = name => path.join(DIR, crypto.createHash('sha256').update(String(name).toLowerCase()).digest('hex') + '.json');
function read(name) { try { return JSON.parse(fs.readFileSync(fileOf(name), 'utf8')); } catch { return null; } }
function write(name, obj) {
  fs.mkdirSync(DIR, { recursive: true });
  const f = fileOf(name), tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, f);
}

// New registrations use this sparse profile. Existing profiles are never replaced.
function starterProfile() {
  const values = {
    jhp_starter: 1,
    jhp_story_pc: "missing",
    jhp_off: 1,
    jhp_setup: { v: 2, rm: {}, add: {}, noicon: {}, when: {}, dl: [] },
    jhp_pm: { v: 1, own: {'pm.mag.01':1,'pm.mag.02':1}, fl: {}, gift: 99, days: [], seen: {}, opened: {}, n: 0, magazines:1 },
    jhp_discs: { cd: '', scr: {}, d2: {}, n: {}, dx: 0, gave: {}, ej: [] },
    jhp_rm: { f: {}, seen: {} }
  };
  return Object.fromEntries(Object.entries(values).map(([k,v]) => [k,JSON.stringify(v)]));
}
function seedStarter(name, reset = false) {
  if (String(name).toLowerCase() !== 'test') throw Error('Starter is restricted to test');
  const f = fileOf(name), cur = read(name);
  if (cur && !reset) return false;
  const now = Math.max(Date.now(), (cur?.ts || 0) + 1);
  fs.mkdirSync(DIR, { recursive: true });
  if (cur) fs.copyFileSync(f, f + '.bak-' + now);
  const prof = { ts: now, reset: now, starterClean: 2, enc: 'raw', data: Buffer.from(JSON.stringify(starterProfile())).toString('base64') };
  write(name, prof);
  if (reset && ctx) for (const [ws,c] of ctx.clients) if (c.member?.toLowerCase() === 'test') ctx.send(ws, { t:'rmData', ...prof });
  return true;
}
// Only called for a newly registered member. Never replace an existing profile.
function seedNewPlayer(name) {
  if (read(name)) return false;
  const now=Date.now();write(name,{ts:now,enc:'raw',data:Buffer.from(JSON.stringify(starterProfile())).toString('base64')});return true;
}
function upgradeStarter(name,orders=[]) {
  if(String(name).toLowerCase()!=='test')throw Error('Starter is restricted to test');
  const cur=read(name);if(!cur)return seedStarter(name);
  if(cur.starterClean>=2)return false;
  const raw=Buffer.from(cur.data,'base64'),obj=JSON.parse((cur.enc==='gzip'?zlib.gunzipSync(raw,{maxOutputLength:3000000}):raw).toString());
  const get=k=>{try{return JSON.parse(obj[k]||'{}')}catch{return{}}};
  const pm=get('jhp_pm'),rm=get('jhp_rm'),disc=get('jhp_discs');
  pm.own={};pm.fl={};pm.gift=99;pm.n=0;
  for(const id of Object.keys(rm.f||{}))if(id.startsWith('cart.'))delete rm.f[id];
  if(!orders.some(o=>o.id===disc.cd&&pm.opened?.[o.no]))disc.cd='';
  obj.jhp_starter='1';obj.jhp_pm=JSON.stringify(pm);obj.jhp_rm=JSON.stringify(rm);obj.jhp_discs=JSON.stringify(disc);
  const now=Math.max(Date.now(),cur.ts+1);fs.copyFileSync(fileOf(name),fileOf(name)+'.bak-'+now);
  write(name,{ts:now,reset:now,starterClean:2,enc:'raw',data:Buffer.from(JSON.stringify(obj)).toString('base64')});return true;
}

// admin: give a member a brand-new PC (what a new visitor gets). The old profile is kept as a backup file, never deleted.
function resetProfile(name) {
  const f = fileOf(name), now = Date.now();
  fs.mkdirSync(DIR, { recursive: true });
  if (fs.existsSync(f)) fs.copyFileSync(f, f + '.bak-' + now);
  const blank = { jhp_setup: JSON.stringify({ v: 2, rm: {}, add: {}, noicon: {}, when: {}, dl: [] }) };
  const prof = { ts: now, enc: 'raw', data: Buffer.from(JSON.stringify(blank)).toString('base64'), reset: now };
  write(name, prof);
  let n = 0;
  if (ctx) for (const [ws, c] of ctx.clients) if (c.member && c.member.toLowerCase() === String(name).toLowerCase()) { ctx.send(ws, { t: 'rmData', ts: prof.ts, enc: prof.enc, data: prof.data }); n++; }
  return n;
}

// a brand-new PC's SOFTWARE only: installed programs, toolbars, discs and the open windows go back to what a fresh PC has;
// progress stays (secrets, saved games, settings, mail, history, wallpaper...). Old profile kept as a .bak file.
function resetInstalls(name) {
  const f = fileOf(name), now = Date.now(), cur = read(name);
  let data = {};
  if (cur && cur.data) {
    const buf = Buffer.from(cur.data, 'base64');
    data = JSON.parse((cur.enc === 'gzip' ? zlib.gunzipSync(buf) : buf).toString('utf8'));
    fs.copyFileSync(f, f + '.bak-' + now);
  }
  data.jhp_setup = JSON.stringify({ v: 2, rm: {}, add: {}, noicon: {}, when: {}, dl: [] });
  data.jhp_toolbars = '[]';
  for (const k of ['jhp_setup_log', 'jhp_setup_dln', 'jhp_tbever', 'jhp_tbstate', 'jhp_irc_inst', 'jhp_resume']) delete data[k];
  try { const d = JSON.parse(data.jhp_discs || '{}'); d.cd = 'cover7'; d.d2 = {}; data.jhp_discs = JSON.stringify(d); } catch (e) { delete data.jhp_discs; }
  const prof = { ts: now, enc: 'raw', data: Buffer.from(JSON.stringify(data)).toString('base64'), reset: now };
  write(name, prof);
  let n = 0;
  if (ctx) for (const [ws, c] of ctx.clients) if (c.member && c.member.toLowerCase() === String(name).toLowerCase()) { ctx.send(ws, { t: 'rmData', ts: prof.ts, enc: prof.enc, data: prof.data }); n++; }
  return n;
}

module.exports = {
  // Fixed owner key only. The caller snapshots before replacing; preserve exact
  // file bytes (including timestamp/encoding) for a lossless restore.
  ownerRead() { try { return fs.readFileSync(fileOf('jack')).toString('base64'); } catch (e) { if(e.code==='ENOENT')return null; throw e; } },
  ownerWrite(raw) {
    const f=fileOf('jack'); fs.mkdirSync(DIR,{recursive:true});
    if(raw===null){if(fs.existsSync(f))fs.unlinkSync(f);return;}
    const bytes=Buffer.from(raw,'base64'); JSON.parse(bytes.toString());
    fs.writeFileSync(f+'.owner-tmp',bytes,{mode:0o600});fs.renameSync(f+'.owner-tmp',f);
  },
  ownerFresh() { return {ts:Date.now(),enc:'raw',data:Buffer.from(JSON.stringify(starterProfile())).toString('base64')}; },
  seedStarter,
  seedNewPlayer,
  upgradeStarter,
  resetProfile,
  resetInstalls,
  name: 'roam',
  types: ['rmGet', 'rmPut'],
  init(c) { ctx = c; try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) { console.error('roam: cannot create', DIR, e.message); } },
  handle(ws, c, m) {
    if (!c.member) return ctx.send(ws, { t: 'rmNone', guest: true });
    const owner=c.member.toLowerCase()==='jack',revision=owner?(ctx.state.mods.owner?.revision||0):0;
    if(owner&&m.t==='rmPut'&&(+m.ownerRev||0)!==revision){
      c.roamUp=null;c.ownerReload=true;return ctx.send(ws,{t:'ownerReload',profile:read('jack')||{ts:0,enc:'raw',data:'e30='},ownerRev:revision});
    }
    if (!c.roamRl) c.roamRl = { get: new ctx.Bucket(0.2, 3), put: new ctx.Bucket(0.05, 2) };
    if (m.t === 'rmGet') {
      if (!c.roamRl.get.take()) return;
      const p = read(c.member);
      if (!p) return ctx.send(ws, owner&&revision ? {t:'rmData',ts:0,enc:'raw',data:'e30=',ownerRev:revision} : { t: 'rmNone' });
      if ((!owner||(+m.ownerRev||0)===revision) && +m.since && +m.since >= p.ts) return ctx.send(ws, { t: 'rmSame', ts: p.ts });
      return ctx.send(ws, { t: 'rmData', ts: p.ts, enc: p.enc, data: p.data, ...(owner?{ownerRev:revision}:{}) });
    }
    if (m.t === 'rmPut') {
      const id = String(m.id || '').slice(0, 20), i = m.i | 0, n = m.n | 0, d = typeof m.d === 'string' ? m.d : '';
      if (!id || n < 1 || n > Math.ceil(MAX / CHUNK) || i < 0 || i >= n || d.length > CHUNK || !/^[A-Za-z0-9+/=]*$/.test(d)) return;
      if (i === 0) {
        if (!c.roamRl.put.take()) return ctx.send(ws, { t: 'rmBusy' });
        c.roamUp = { id, n, parts: new Array(n), got: 0, ts: Math.min(Date.now(), +m.ts || Date.now()), enc: m.enc === 'gzip' ? 'gzip' : 'raw', who: c.member };
      }
      const up = c.roamUp;
      if (!up || up.id !== id || up.n !== n || up.who !== c.member || up.parts[i] !== undefined) return;
      up.parts[i] = d; up.got++;
      if (up.got < n) return;
      c.roamUp = null;
      const data = up.parts.join('');
      if (data.length > MAX) return ctx.send(ws, { t: 'rmErr', msg: 'Your profile is too big to roam (over 900 KB).' });
      const ts = Date.now();
      const cur = read(up.who);
      if (cur && cur.reset && !(+m.base >= cur.reset)) return ctx.send(ws, { t: 'rmData', ts: cur.ts, enc: cur.enc, data: cur.data }); // an upload from before a reset: the reset wins (the client applies it and reloads)
      try { write(up.who, { ts, enc: up.enc, data, starterClean:cur?.starterClean, reset: cur && cur.reset || undefined }); } catch (e) { console.error('roam: save failed', e.message); return ctx.send(ws, { t: 'rmErr', msg: 'JackNet could not save your profile.' }); }
      return ctx.send(ws, { t: 'rmSaved', ts });
    }
  },
};
