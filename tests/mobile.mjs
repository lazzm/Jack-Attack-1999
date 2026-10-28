// Phones and tablets play the whole game (AGENTS.md "Device policy"). Real touch input through the DevTools protocol on
// Playwright device profiles (isMobile, hasTouch, mobile user agents): logon -> walk a route with the stick -> look ->
// pick up / put down -> sit at the PC -> use JackOS -> play a console game with the touch pad -> read the diary ->
// refresh mid-walk (pose kept) -> rotate. Every state is screenshotted into tests/shots/mobile/ for review.
//   node tests/mobile.mjs [http://localhost:PORT] [--only=gate,story,full,tablet,perf,owner] [--throttle=4]
// Without a URL it starts and stops its own throwaway server (fresh DATA_DIR under /tmp, ADMIN_TOKEN=testtoken).
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium, devices} from 'playwright';
import {analyse, contactSheet} from './transition-kit.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), shots = fileURLToPath(new URL('shots/mobile/', import.meta.url));
const args = process.argv.slice(2), given = args.find(a => /^https?:/.test(a));
const only = args.find(a => a.startsWith('--only='))?.slice(7).split(',');
const throttle = +(args.find(a => a.startsWith('--throttle='))?.slice(11) || 4);
const SCALE = Math.max(1, Math.min(4, os.loadavg()[0] / os.cpus().length * 1.3));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let base = given, server, data, log = '';
const results = [], report = { sizes: {}, perf: {}, checks: [] };

// ---------------------------------------------------------------- device profiles (the brief's sizes)
const UA = {
  iphone: devices['iPhone 13'].userAgent, pixel: devices['Pixel 7'].userAgent, ipad: devices['iPad (gen 7)'].userAgent,
  galaxy: devices['Galaxy S9+'].userAgent,
};
const PROFILES = {
  'galaxy-360x740': { userAgent: UA.galaxy, viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'iphone-390x844': { userAgent: UA.iphone, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'pixel-412x915': { userAgent: UA.pixel, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'ipad-768x1024': { userAgent: UA.ipad, viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  'iphone-844x390': { userAgent: UA.iphone, viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// ---------------------------------------------------------------- server
async function start() {
  data = await mkdtemp('/tmp/jhp-mobile-');
  for (let port = 18100; port <= 18160; port++) {
    const free = await new Promise(resolve => { const p = net.createServer(); p.once('error', () => resolve(false)); p.listen(port, '127.0.0.1', () => p.close(() => resolve(true))); });
    if (!free) continue;
    let out = '';
    server = spawn(process.execPath, ['server.js'], { cwd: root + 'app', env: { ...process.env, PORT: String(port), DATA_DIR: data, ADMIN_TOKEN: 'testtoken' }, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const s of [server.stdout, server.stderr]) s.on('data', c => { out += c; log += c; });
    base = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 150; i++) {
      if (server.exitCode !== null) { if (/EADDRINUSE/.test(out)) break; throw Error('server: ' + out.slice(-400)); }
      if (out.includes(`online at :${port}`)) { const r = await fetch(base).catch(() => null); if (r?.ok) return; }
      await sleep(100);
    }
    if (server.exitCode === null) throw Error('server readiness timeout');
  }
  throw Error('no free port');
}
async function stop() {
  if (server?.pid && server.exitCode === null) { const ended = once(server, 'exit'); server.kill('SIGTERM'); const t = setTimeout(() => server.kill('SIGKILL'), 1500); await ended; clearTimeout(t); }
  if (data) await rm(data, { recursive: true, force: true });
}
async function register(name, pass = 'Throwaway-1999') {
  const r = await fetch(base + '/admin/register', { method: 'POST', headers: { 'X-Admin-Token': 'testtoken', 'Content-Type': 'application/json' }, body: JSON.stringify({ name, pass }) });
  assert(r.ok, 'admin register ' + r.status); return { name, pass };
}

// ---------------------------------------------------------------- browser, fingers, waiting
let browser;
async function phone(profile, { tier = null, hour = 14 } = {}) {
  const ctx = await browser.newContext({ ...PROFILES[profile] });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/GPU stall|ReadPixels|GL Driver/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.setDefaultTimeout(30000 * SCALE);
  await page.addInitScript(() => {
    const bind = () => {
      if (!window.Net?.on) { setTimeout(bind, 0); return; }
      Net.on('rmSame', () => { window.__testProfileReady = true; });
      Net.on('rmNone', () => { window.__testProfileReady = true; });
      Net.on('rmData', () => { window.__testProfileReady = false; });
    };
    bind();
  });
  await page.addInitScript(({ tier, hour }) => {
    if (tier) localStorage.setItem('jhp_hs_gfx', JSON.stringify(tier));
    // The software host can offer its slow-device choice during a long fixture. Use the retained-house preference;
    // small() explicitly exercises that real choice so an unrelated action is never covered by a surprise dialog.
    localStorage.setItem('jhp_touch_slow_asked', 'true');
    window.auditHour = hour; Date.prototype.getHours = () => window.auditHour; Date.prototype.getMinutes = () => 0;
  }, { tier, hour });
  const cdp = await ctx.newCDPSession(page);
  const pts = new Map();
  const send = type => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...pts.values()] });
  const fingers = {
    async down(id, x, y) { pts.set(id, { x, y, id, radiusX: 6, radiusY: 6, force: 1 }); await send('touchStart'); },
    async move(id, x, y) { pts.set(id, { ...pts.get(id), x, y }); await send('touchMove'); },
    // CDP (Chromium): a touchEnd releases the points it lists, so lifting one finger of several lists just that one
    // (measured: listing the others released them instead and the lifted finger stayed down).
    async up(id) { const q = pts.get(id); pts.delete(id); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: q ? [q] : [] }); },
    async drag(id, x0, y0, x1, y1, ms = 400, hold = 0) {
      await this.down(id, x0, y0); const n = Math.max(4, Math.round(ms / 40));
      for (let i = 1; i <= n; i++) { await this.move(id, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); await sleep(ms / n); }
      if (hold) await sleep(hold); await this.up(id);
    },
    async tap(x, y) { await this.down(30, x, y); await sleep(60); await this.up(30); },
  };
  async function until(fn, arg, ms = 30000) {
    const end = Date.now() + ms * SCALE; let last;
    while (Date.now() < end) {
      try { last = await page.evaluate(fn, arg); if (last) return last; } catch (e) { if (!/context was destroyed|navigation/i.test(e.message)) throw e; }
      await sleep(150);
    }
    const s = await page.evaluate(() => ({ mode: window.House?.mode, held: window.House?.held?.(), touch: document.documentElement.dataset.touchState, gate: !!document.querySelector('#accountGate') })).catch(() => ({}));
    throw Error('Timeout: ' + String(fn).slice(0, 160) + ' ' + JSON.stringify(s));
  }
  async function shot(name, opt = {}) { const path = shots + name + '.png'; await page.screenshot({ path, timeout: 60000 * SCALE, ...opt }); return path; }
  // Taps a touch-HUD button by its key (ht-hud data-k) or a selector, with a real finger on its centre.
  async function press(sel) {
    const s = sel.startsWith('[') || sel.startsWith('.') || sel.startsWith('#') ? sel : `.ht-hud [data-k="${sel}"]`;
    await until(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; const r = b.getBoundingClientRect(); return r.width > 0 && getComputedStyle(b).visibility !== 'hidden'; }, s, 15000);
    const r = await page.evaluate(s => { const el = document.querySelector(s); el.scrollIntoView({ block: 'nearest' }); const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, s);
    await fingers.tap(r.x, r.y);
  }
  return { ctx, page, errors, fingers, until, shot, press, cdp };
}
const V = p => p.page.viewportSize();

// Logon (or sign up) with the on-screen keyboard and real taps; returns once the house is live.
async function logon(p, acct, { signup = false, first = '' } = {}) {
  const { page, until, shot } = p;
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 * SCALE });
  await until(() => window.Net?.connected && !!document.querySelector('#accountGate form'), null, 60000);
  if (signup) await page.locator('#accountGate [data-switch]').tap();
  await page.locator('[name=name]').tap(); await page.keyboard.type(acct.name);
  await page.locator('[name=password]').tap(); await page.keyboard.type(acct.pass);
  if (signup) { await page.locator('[name=confirm]').tap(); await page.keyboard.type(acct.pass); }
  if (first) await shot(first);
  await page.locator('#accountGate [type=submit]').tap();
  await until(() => window.AccountGate?.allowed || !!document.querySelector('#accountFirst'), null, 60000);
  if (await page.locator('#accountFirst').count()) { if (first) await shot(first + '-identity'); await page.locator('#accountGate [type=submit]').tap(); }
  await until(() => window.__testProfileReady && window.AccountGate?.allowed && window.House?.live && !document.querySelector('.hs-loading,#houseEntry'), null, 120000);
}
// Point the camera with the scene API (like the smoke fixture); every interaction after that is a real finger.
async function aimAt(p, eye, target, level = 'U') {
  await p.page.evaluate(({ eye, target, level }) => {
    // Capture the shipped standing eye, rather than easing up from the old 128 cm fixture height.
    eye = [eye[0], House.LV[level] - House.STAND, eye[2]];
    House.hush(); House.setWalkFrom({ x: eye[0], y: eye[1], z: eye[2], lvl: level, seat: 0 });
    const [x, y, z] = eye, [tx, ty, tz] = target;
    Object.assign(House.P, { x, y, z, rx: Math.atan2(-(ty - y), Math.hypot(tx - x, tz - z)) * 180 / Math.PI, ry: Math.atan2(tx - x, -(tz - z)) * 180 / Math.PI, lvl: level, seat: 0 });
    House._.setMode('walk'); House.dirty();
  }, { eye, target, level });
  await sleep(400);
  // the walking body may settle a few cm (furniture, walls): aim again from where the eye really ended up
  await p.page.evaluate(target => { const P = House.P, [tx, ty, tz] = target; P.rx = Math.atan2(-(ty - P.y), Math.hypot(tx - P.x, tz - P.z)) * 180 / Math.PI; P.ry = Math.atan2(tx - P.x, -(tz - P.z)) * 180 / Math.PI; House.dirty(); }, target);
  await sleep(400);
}
// Where a thing is on screen: its world centre through the live camera into the WebGL canvas rectangle.
async function screenOf(p, id) {
  return p.page.evaluate(id => {
    const H = House, s = H.SPOTS[id], o = (s && (s.obj || H.THINGS[id]?.obj)) || H.THINGS[id]?.obj; if (!o) return null;
    const b = new H.T.Box3().setFromObject(o), v = b.getCenter(new H.T.Vector3()); v.project(H.camera);
    const r = H.ren.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, z: v.z };
  }, id);
}
// A touch-path recording: left thumb walks forward, right thumb pans right, frames every ~120 ms into a contact sheet,
// with the pose and the finger positions logged (report.paths[name]).
async function recordPath(p, name) {
  const { page, fingers } = p, { width: w, height: h } = V(p), R = Math.max(46, Math.min(70, Math.min(w, h) * .15));
  const frames = [], log = [], t0 = Date.now(), sx = Math.min(100, w * .22), sy = h - Math.min(170, h * .3);
  await fingers.down(1, sx, sy); await fingers.move(1, sx, sy - 14); await fingers.move(1, sx, sy - R);
  await fingers.down(2, w - 80, h * .45);
  for (let i = 0; i < 10; i++) {
    await fingers.move(2, w - 80 - i * 9, h * .45);
    frames.push({ buf: await page.screenshot({ type: 'jpeg', quality: 55 }), t: Date.now() - t0 });
    log.push(await page.evaluate(() => ({ x: +House.W.x.toFixed(1), z: +House.W.z.toFixed(1), ry: +House.P.ry.toFixed(1), touch: House.touch.state })));
  }
  await fingers.up(2); await fingers.up(1);
  await contactSheet(browser, frames, shots + name + '-path-sheet.jpg', { cols: 5, width: Math.round(1200 / 5), label: name + ': stick forward + drag right, ' + w + 'x' + h });
  (report.paths = report.paths || {})[name] = log;
  return log;
}
// The world centre of a thing (house coordinates, y down), for pointing the camera at it.
async function centreOf(p, id) { return p.page.evaluate(id => { const H = House, o = H.THINGS[id]?.obj || H.SPOTS[id]?.obj; const v = new H.T.Box3().setFromObject(o).getCenter(new H.T.Vector3()); return [v.x, -v.y, v.z]; }, id); }
// Point the crosshair squarely onto a thing: aim at its centre, find where the room's own picking sees it, aim there.
async function aimOnto(p, eye, id, level = 'U') {
  await aimAt(p, eye, await centreOf(p, id), level);
  const hit = await p.page.evaluate(id => { const cx = innerWidth / 2, cy = innerHeight / 2; for (let r = 0; r <= 160; r += 4) for (let i = 0; i < (r ? 24 : 1); i++) { const h = House.pick(cx + Math.cos(i * Math.PI / 12) * r, cy + Math.sin(i * Math.PI / 12) * r); if (h?.spot === id) return [h.p.x, h.p.y, h.p.z]; } return null; }, id);
  if (process.env.MOB_DEBUG) console.log('aimOnto', id, JSON.stringify({ eye, c: await centreOf(p, id), hit, P: await p.page.evaluate(() => ({ ...House.P, mode: House.mode })) }));
  if (hit) await aimAt(p, eye, hit, level);
  else console.log('aimOnto miss', id, JSON.stringify(await p.page.evaluate(id => { const at = (() => { const H = House, o = H.THINGS[id]?.obj; const v = new H.T.Box3().setFromObject(o).getCenter(new H.T.Vector3()); v.project(H.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; })(); const h = House.pick(at.x, at.y); return { at, spot: h?.spot, st: House.THINGS[id].st, busy: House.busy, mode: House.mode }; }, id)));
  return !!hit;
}
// Stand somewhere walkable about 60-110 cm from a thing and put the crosshair on it (the room's own picking agrees).
async function standAndAim(p, id) {
  const c = await centreOf(p, id);
  const spots = await p.page.evaluate(c => { const out = []; for (const d of [75, 95, 60, 115]) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = c[0] + Math.cos(a) * d, z = c[2] + Math.sin(a) * d; if (House._.cellOk('U', x, z)) out.push([x, -55, z]); } return out; }, c);
  for (const e of spots) if (await aimOnto(p, e, id) && await p.page.evaluate(id => House.pick(innerWidth / 2, innerHeight / 2)?.spot === id, id)) return true;
  return false;
}
// A real finger press on a thing in the room: the label above the thumb names the action before letting go.
async function clickThing(p, id, shotName) {
  let at = await screenOf(p, id); assert(at && at.z < 1, 'Not on screen: ' + id);
  // the nearest screen point where the room's own picking finds this thing (it may be half behind a shelf edge)
  at = await p.page.evaluate(({ id, at }) => { for (let r = 0; r <= 120; r += 4) for (let i = 0; i < (r ? 24 : 1); i++) { const x = at.x + Math.cos(i * Math.PI / 12) * r, y = at.y + Math.sin(i * Math.PI / 12) * r; if (House.pick(x, y)?.spot === id && document.elementFromPoint(x, y)?.classList.contains('ht-surface')) return { x, y }; } return at; }, { id, at }); // (and not under a HUD button)
  await p.fingers.down(7, at.x, at.y); await sleep(250);
  const label = await p.page.evaluate(() => { const m = document.querySelector('.ht-tapmark.on'); return m ? m.textContent : ''; });
  if (shotName) await p.shot(shotName);
  await p.fingers.up(7); return label;
}
// A screenshot of a live WebGL page is never black: mean luminance and black-pixel share over the whole frame.
async function notBlack(p, label) {
  const buf = await p.page.screenshot({ type: 'jpeg', quality: 60 });
  const [s] = await analyse(browser, [{ buf }]);
  assert(s.mean > 14 && s.black < .6, `${label}: black frame (mean ${s.mean.toFixed(1)}, black ${(s.black * 100).toFixed(0)}%)`);
  return s;
}
async function analyseRGB(buf) {
  const pg = await browser.newPage();
  try { return [await pg.evaluate(async src => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let r = 0, gg = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } return [r / n, gg / n, b / n].map(Math.round); }, 'data:image/png;base64,' + buf.toString('base64'))]; }
  finally { await pg.close(); }
}
// Nothing clipped, tiny or overlapping: every visible HUD control inside the viewport, at least 40px, not covering
// the subtitle/quest/banner boxes that are on screen.
async function layoutAudit(p, label) {
  const issues = await p.page.evaluate(() => {
    const out = [], vw = innerWidth, vh = innerHeight;
    const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return null; } return r; };
    const buttons = [...document.querySelectorAll('.ht-hud .ht-b, .rm-pad:not([hidden]) [data-b], .rm-tools .rm-b')].map(el => [el, vis(el)]).filter(([, r]) => r);
    for (const [el, r] of buttons) {
      const name = (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 30);
      if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) out.push(`clipped: ${name} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
      if (Math.min(r.width, r.height) < 36) out.push(`tiny: ${name} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    const boxes = [...document.querySelectorAll('.hs-note.on, .st-objective:not([hidden]), .hs-voice.on, .hs-call.on, .ht-target.on, .hs-hold:not([hidden]), .ch-chip:not([hidden])')].map(el => [el, vis(el)]).filter(([, r]) => r);
    for (const [el, r] of boxes) for (const [b, q] of buttons) {
      const ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      if (ix > 6 && iy > 6) out.push(`overlap: ${el.className.split(' ')[0]} under ${(b.getAttribute('aria-label') || b.textContent).trim().slice(0, 20)}`);
    }
    for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
      const a = buttons[i][1], b = buttons[j][1], ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 4 && iy > 4 && !buttons[i][0].contains(buttons[j][0]) && !buttons[j][0].contains(buttons[i][0])) out.push(`buttons overlap: ${(buttons[i][0].getAttribute('aria-label') || '').slice(0, 16)} / ${(buttons[j][0].getAttribute('aria-label') || '').slice(0, 16)}`);
    }
    return out;
  });
  report.checks.push({ label, issues });
  assert.deepEqual(issues, [], label + ' layout');
}

// The Game Lad for real (shared by the phone sizes): a cartridge out of its case and into the slot by touch, raised by
// putting it in, then played with the handheld's own moulded buttons through real (multi-)touch; LOCK IN; landscape.
async function gameLad(p, pre) {
  const { page, until, fingers, shot, press } = p, size = V(p);
      // The Game Lad for real: Pocket Critters out of its case and into the slot by touch, raised by putting it in, then
  // played with the handheld's own moulded buttons through real (multi-)touch, in portrait; pad wings in landscape.
  const gid = await page.evaluate(() => { const ids = Object.keys(House.THINGS).filter(k => /^media\.box\.gb\./.test(k)).map(k => k.slice(10)); return ids.includes('gb.mon') ? 'gb.mon' : ids[0]; });
  assert(gid, 'No Game Lad cartridge in the full room'); const gbox = 'media.box.' + gid, gcart = 'media.' + gid;
  const gh = await page.evaluate(id => House.THINGS[id].at, gbox);
  await aimAt(p, [gh.x + 60, -55, gh.z + 75], [gh.x, gh.y - 6, gh.z]);
  assert.match(await clickThing(p, gbox), /pick up/i); await until(id => House.held() === id, gbox);
  // somewhere it fits (green ghost), then a click puts it down there
  for (const t of [[-60, 73, 160], [-40, 73, 185], [-90, 73, 175], [0, 73, 170]]) { await aimAt(p, [-60, -55, 250], t); await sleep(400); if (await page.evaluate(() => { const h = document.querySelector('.hs-ui .hs-hold'); return h && !h.classList.contains('blocked'); })) break; }
  await shot(pre + '-13b-gamelad-box-ghost'); await fingers.tap(V(p).width * .72, V(p).height * .4);
  await until(id => House.THINGS[id].st === 'rest', gbox);
  const gat = await page.evaluate(id => House.THINGS[id].at, gbox);
  assert(await standAndAim(p, gbox), 'Cannot get the Game Lad case under the crosshair'); await shot(pre + '-13c-aim-case'); await press('f'); await until(id => House.THINGS[id].caseOpen, gbox);
  await page.waitForTimeout(600); assert(await standAndAim(p, gbox), 'Cannot get the open case under the crosshair');
  // a click on the cartridge in its open case takes it (only when it can be seen from where the test stands)
  const seen = await page.evaluate(id => { for (let y = 0; y < innerHeight; y += 6) for (let x = 0; x < innerWidth; x += 6) if (House.pick(x, y)?.spot === id) return true; return false; }, gcart);
  if (seen) { assert.match(await clickThing(p, gcart, pre + '-13d-finger-on-cart'), /pick up|take/i, 'Finger label on the cartridge'); }
  else { report.checks.push({ label: pre + ': cartridge hidden by its open case from the test camera; taken with House.grab' }); await page.evaluate(id => House.grab(id), gcart); }
  await until(id => House.held() === id, gcart);
  const gslot = await page.evaluate(() => { const s = House.SNAPS['console.gb'], o = House.THINGS.gb.obj, v = new House.T.Vector3(); o.getWorldPosition(v); return { s: [s.x, s.y, s.z], g: [v.x, -v.y, v.z] }; });
  if (process.env.MOB_DEBUG) console.log('before slot', JSON.stringify(await page.evaluate(ids => ({ held: House.held(), box: House.THINGS[ids[0]].st, cart: House.THINGS[ids[1]].st, open: House.THINGS[ids[0]].caseOpen }), [gbox, gcart])));
  await aimAt(p, [gslot.g[0] + 35, -55, gslot.g[2] + 60], gslot.s);
  if (process.env.MOB_DEBUG) console.log('at slot', JSON.stringify(await page.evaluate(() => ({ held: House.held(), hold: document.querySelector('.hs-hold')?.className, name: document.querySelector('.hs-hname')?.textContent })))); await page.waitForTimeout(500); await shot(pre + '-14-cart-to-gamelad');
  await fingers.tap(V(p).width * .72, V(p).height * .4); // (a click puts it in at the gold ghost: the Game Lad comes up and boots)
  await until(g => RoomTV._dbg()?.gid === g && RoomTV._dbg().st === 'game' && !House.gliding, gid, 40000);
  await page.waitForTimeout(3000); await shot(pre + '-15-gamelad-title');
  // what you see is what you press: the projected buttons sit on the rendered moulding (magenta A/B, black D-pad)
  const colourAt = async (k) => { const q = await page.evaluate(k => RoomTV._dbg().gbScreen(k), k); const buf = await page.screenshot({ clip: { x: Math.max(0, q.x - 3), y: Math.max(0, q.y - 3), width: 6, height: 6 } }); const [c] = await analyseRGB(buf); return { ...q, c }; };
  const pa = await colourAt('a'), pb2 = await colourAt('b'), pd = await colourAt('pad');
  report.checks.push({ label: 'Game Lad button pixels', a: pa, b: pb2, pad: pd });
  assert(pa.c[0] > 110 && pa.c[0] > pa.c[1] * 2, 'A is not under its projected point: ' + JSON.stringify(pa));
  assert(pd.c[0] < 70 && pd.c[1] < 70, 'D-pad is not under its projected point: ' + JSON.stringify(pd));
  // START, then A, by real fingers
  const gp = async k => page.evaluate(k => RoomTV._dbg().gbScreen(k), k);
  const st0 = await gp('start'); await fingers.down(5, st0.x, st0.y); await sleep(120);
  assert(await page.evaluate(() => RoomTV.dbg().held('start')), 'START on the model did nothing'); await fingers.up(5); await sleep(400);
  for (let i = 0; i < 3; i++) { const q = await gp('a'); await fingers.down(5, q.x, q.y); await sleep(140); await fingers.up(5); await sleep(500); }
  await shot(pre + '-16-gamelad-after-a');
  // multi-touch: D-pad right held with one thumb while the other presses A; a held direction repeats
  const pd2 = await gp('pad'), right = await page.evaluate(() => { const c = RoomTV._dbg().gbScreen('pad'); const H = House, o = H.THINGS.gb.obj, v = new H.T.Vector3(-1.2, -2.9, 2.4); o.localToWorld(v); v.project(H.camera); const r = H.ren.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
  await fingers.down(1, right.x, right.y); await sleep(150); const qa = await gp('a'); await fingers.down(2, qa.x, qa.y); await sleep(150);
  const both = await page.evaluate(() => ({ right: RoomTV.dbg().held('right'), a: RoomTV.dbg().held('a'), sunk: RoomTV._dbg().gbMeshes() }));
  await shot(pre + '-17-gamelad-multitouch'); await fingers.up(2); await sleep(600); await fingers.up(1);
  assert(both.right && both.a, 'D-pad + A together failed: ' + JSON.stringify(both));
  // slide the D-pad thumb from right to down without lifting
  await fingers.down(1, pd2.x, pd2.y + 2); await fingers.move(1, right.x, right.y); await sleep(100);
  const down = await page.evaluate(() => { const c = RoomTV._dbg().gbScreen('pad'); const H = House, o = H.THINGS.gb.obj, v = new H.T.Vector3(-2.2, -2.9, 3.6); o.localToWorld(v); v.project(H.camera); const r = H.ren.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
  await fingers.move(1, down.x, down.y); await sleep(120);
  const slid = await page.evaluate(() => ({ down: RoomTV.dbg().held('down'), right: RoomTV.dbg().held('right') })); await fingers.up(1);
  assert(slid.down && !slid.right, 'Sliding the D-pad thumb did not change direction: ' + JSON.stringify(slid));
  // a phone browser's bars: the room's canvas not filling the window (56 px short) must not shift the buttons
  await page.evaluate(() => { const pb = document.getElementById('bootPower'); pb.dataset.oldStyle = pb.getAttribute('style') || ''; pb.style.setProperty('top', '56px', 'important'); pb.style.setProperty('height', (innerHeight - 56) + 'px', 'important'); pb.style.setProperty('bottom', 'auto', 'important'); dispatchEvent(new Event('resize')); });
  await page.waitForTimeout(1500);
  const pa2 = await colourAt('a'); pa2.dbg = await page.evaluate(() => { const c = House.ren.domElement.getBoundingClientRect(), b = document.getElementById('bootPower').getBoundingClientRect(); return { canvas: [c.top, c.height, House.ren.domElement.height], pb: [b.top, b.height], ih: innerHeight, aspect: House.camera.aspect, wh: innerWidth / innerHeight }; }); await page.screenshot({ path: shots + 'full-17b-taller-canvas.png' }); await page.evaluate(() => { const pb = document.getElementById('bootPower'); pb.setAttribute('style', pb.dataset.oldStyle); dispatchEvent(new Event('resize')); });
  assert(pa2.c[0] > 110 && pa2.c[0] > pa2.c[1] * 2, 'A misplaced when the canvas does not fill the window: ' + JSON.stringify(pa2));
  await page.waitForTimeout(800);
  // LOCK IN and back (the pad stands in for the hidden moulding), then landscape wings
  await press('.rm-tools .rm-lock'); await until(() => !!document.querySelector('.rm-tvv .rm-pad:not([hidden]) [data-b="a"]'), null, 10000); await page.waitForTimeout(900); await shot(pre + '-18-gamelad-lockin');
  await press('.rm-pad [data-b="a"]');
  await press('.rm-tools .rm-lock'); await page.waitForTimeout(1500);
  assert(await page.evaluate(() => !!document.querySelector('.rm-tvv .rm-pad[hidden]')), 'Pad left over after LOCK IN back');
  await page.setViewportSize({ width: size.height, height: size.width }); await page.waitForTimeout(2000); await shot(pre + '-19-gamelad-landscape');
  assert(await page.evaluate(() => !!document.querySelector('.rm-tvv .rm-pad:not([hidden]) [data-b="a"]')), 'Landscape Game Lad has no pad');
  { const r = await page.evaluate(() => { const b = document.querySelector('.rm-pad [data-b="a"]').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await fingers.down(6, r.x, r.y); await sleep(100); assert(await page.evaluate(() => RoomTV.dbg().held('a')), 'Landscape pad A did nothing'); await fingers.up(6); }
  await page.setViewportSize(size); await page.waitForTimeout(1500);
  await press('.rm-tools .rm-lean'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
}

// ---------------------------------------------------------------- phases
const phases = {
  // The account gate at every size: logon and the signup form; nothing clipped, inputs at least 16px (no iOS zoom).
  async gate() {
    for (const prof of Object.keys(PROFILES)) {
      const p = await phone(prof);
      try {
        await p.page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 * SCALE });
        await p.until(() => window.Net?.connected && !!document.querySelector('#accountGate form'), null, 60000);
        await p.shot(`gate-logon-${prof}`);
        await p.page.locator('#accountGate [data-switch]').tap(); await p.page.waitForTimeout(300);
        await p.shot(`gate-signup-${prof}`);
        const bad = await p.page.evaluate(() => [...document.querySelectorAll('#accountGate input, #accountGate button')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(), f = parseFloat(getComputedStyle(e).fontSize); return (r.right > innerWidth + 1 || r.left < -1 ? 'clipped ' : '') + (e.tagName === 'INPUT' && f < 16 ? 'font<16 ' : '') + (r.height < 32 ? 'short ' : '') + (e.name || e.textContent.trim().slice(0, 16)); }).filter(s => /^(clipped|font|short)/.test(s)));
        report.sizes[prof] = { gate: bad };
        assert.deepEqual(bad, [], prof + ' account gate');
        assert.deepEqual(p.errors, [], prof + ' gate errors');
      } finally { await p.ctx.close(); }
    }
  },

  // A new player on an iPhone: sign up by touch, the story opening in the house, walk, look, the quest line and diary,
  // refresh mid-walk, rotate.
  async story() {
    const p = await phone('iphone-390x844'), { page, until, fingers, shot } = p;
    try {
      const acct = { name: 'Mob' + Date.now().toString(36).slice(-6), pass: 'Throwaway-1999' };
      await logon(p, acct, { signup: true, first: 'story-01-signup' });
      const info = await page.evaluate(() => ({ tier: House.Q.guess, touch: GameInput.touch, state: document.documentElement.dataset.touchState, handheld: PCOnly.handheld, jackos: PCOnly.desktopOnly }));
      assert.equal(info.handheld, true); assert.equal(info.jackos, false, 'Phone must get the house'); assert.equal(info.touch, true);
      assert.equal(info.tier, 'potato', 'Phones start on the Potato tier');
      await until(() => House.mode === 'walk' && document.documentElement.dataset.touchState === 'walk', null, 60000);
      await page.waitForTimeout(2500); await shot('story-02-opening'); await notBlack(p, 'opening');
      await layoutAudit(p, 'story opening portrait');
      assert(await page.evaluate(() => !!document.querySelector('.ht-coach')), 'First-time coach marks missing');
      // Click things in the room with a real finger: Mom (talk), a magazine (pick up, then put it down at its ghost), the door.
      // stand on a walkable spot about 1.3 m from a thing (on its floor) and look at it; returns false if nowhere fits
      const look = async id => { const r = await page.evaluate(id => { const H = House, o = H.SPOTS[id]?.obj || H.THINGS[id]?.obj; if (!o) return null; o.updateWorldMatrix(true, true); const v = new H.T.Vector3(); o.getWorldPosition(v); let c = [v.x, -v.y, v.z], lvl = c[1] > 100 ? 'G' : 'U';
          const fam = /^np\./.test(id) && window.HouseFamily?.debug?.dump().find(f => 'np.' + f.id === id); if (fam) { lvl = fam.lvl; c = [fam.x, lvl === 'G' ? 230 : -30, fam.z]; }
          const ey = lvl === 'G' ? 205 : -55;
        const room = fam ? H.ROOMS[fam.room] : null, inRoom = (x, z) => !room || room.area.some(q => x >= q[0] + 20 && x <= q[2] - 20 && z >= q[1] + 20 && z <= q[3] - 20);
          const out = []; for (const d of [150, 190, 110]) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = c[0] + Math.cos(a) * d, z = c[2] + Math.sin(a) * d; if (H._.cellOk(lvl, x, z) && inRoom(x, z)) out.push({ e: [x, ey, z], c: [c[0], Math.min(c[1], ey + 40), c[2]], lvl }); } return out; }, id);
        for (const q of r || []) {
          await aimAt(p, q.e, q.c, q.lvl);
          // a step with the stick lets the house notice which room you are in (and draw it), then look again
          const { height: hh } = V(p); await fingers.down(1, 90, hh - 160); await fingers.move(1, 90, hh - 200); await sleep(150); await fingers.up(1); await sleep(150);
          await aimAt(p, q.e, q.c, q.lvl);
          // people keep their personal space (~82 cm, js/np-life.js): give her a moment to settle, then look where she is now
          if (/^np\./.test(id)) { await sleep(1200); const now = await page.evaluate(id => { const f = window.HouseFamily?.debug?.dump().find(f => 'np.' + f.id === id); return f ? [f.x, f.lvl === 'G' ? 230 : -30, f.z] : null; }, id); if (now) await aimAt(p, q.e, now, q.lvl); }
          if (await page.evaluate(id => { for (let dy = -60; dy <= 60; dy += 20) if (House.pick(innerWidth / 2, innerHeight / 2 + dy)?.spot === id) return true; return false; }, id)) return true;
        }
        return false; };
      await page.evaluate(() => Room.ensureHouse()); await until(() => window.HouseRooms?.ready, null, 60000);
      const door = await page.evaluate(() => { const d = Object.values(House.DOORS).find(d => /bed/i.test(d.id) && d.pivot); if (!d) return null; const b = new House.T.Box3().setFromObject(d.pivot), v = b.getCenter(new House.T.Vector3()); return { id: d.id, open: !!d.open, c: [v.x, -v.y, v.z] }; });
      if (door) {
        const stand = await page.evaluate(c => { for (const d of [120, 160, 90]) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, x = c[0] + Math.cos(a) * d, z = c[2] + Math.sin(a) * d; if (House._.cellOk('U', x, z)) return [x, -55, z]; } return null; }, door.c);
        await aimAt(p, stand, door.c);
        const at = await page.evaluate(c => { const H = House, v = new H.T.Vector3(c[0], -c[1], c[2]); v.project(H.camera); const r = H.ren.domElement.getBoundingClientRect(), x0 = r.left + (v.x + 1) / 2 * r.width, y0 = r.top + (1 - v.y) / 2 * r.height;
          for (let rr = 0; rr <= 120; rr += 8) for (let i = 0; i < (rr ? 16 : 1); i++) { const x = x0 + Math.cos(i * Math.PI / 8) * rr, y = y0 + Math.sin(i * Math.PI / 8) * rr, h = H.pick(x, y), s = h?.spot && H.SPOTS[h.spot]; if (s && /door/i.test(String(typeof s.label === 'function' ? s.label() : s.label))) return { x, y }; } return null; }, door.c);
        assert(at, 'No door under the finger');
        await fingers.down(7, at.x, at.y); await sleep(250); const said = await page.evaluate(() => document.querySelector('.ht-tapmark.on')?.textContent || ''); await shot('story-02f-finger-on-door'); await fingers.up(7);
        assert.match(said, /open|shut/i, 'Finger label on the door: ' + said);
        await until(d => !!House.DOORS[d.id].open !== d.open, door, 10000); await page.waitForTimeout(900); await shot('story-02g-door-toggled');
      }
      if (await page.evaluate(() => !!House.SPOTS['np.mom'] && !!window.HouseFamily?.debug?.dump().find(f => f.id === 'mom' && f.present))) {
        // Keep the touch target at a known, reachable daily job rather than chasing her phone routine.
        await page.evaluate(() => { const F = HouseFamily; F.debug.go('mom', 'hob'); F.debug.place('mom', 'hob'); F.debug.sim(5, 0.1); });
        assert(await look('np.mom'), 'Nowhere to stand in sight of Mom: ' + JSON.stringify(await page.evaluate(() => HouseFamily.debug.dump().find(f => f.id === 'mom')))); const said = await clickThing(p, 'np.mom', 'story-02c-finger-on-mom');
        assert.match(said, /talk/i, 'Finger label on Mom: ' + said + ' ' + JSON.stringify(await page.evaluate(() => { const o = House.SPOTS['np.mom'].obj, v = new House.T.Vector3(); o.getWorldPosition(v); return { dump: HouseFamily.debug.dump().find(f => f.id === 'mom'), proxy: [v.x, v.y, v.z], P: House.P, vis: o.visible, parentVis: o.parent?.visible }; })));
        await until(() => !!document.querySelector('.hs-voice.on,.hs-call.on,.hs-note.on,.np-bub:not(.np-out)'), null, 15000); await page.waitForTimeout(500); await shot('story-02d-talking-to-mom');
        await page.evaluate(() => HouseFamily.debug.go('mom', null));
      } else report.checks.push({ label: 'Mom not in the bedroom at the opening', skipped: true });
      const mag = await page.evaluate(() => ['pmb.pm.mag.01', 'pmb.pm.mag.02'].find(id => House.THINGS[id]?.obj.visible && House.THINGS[id].st === 'rest'));
      if (mag) {
        await look(mag); const said = await clickThing(p, mag); assert.match(said, /pick up/i, 'Finger label on the magazine: ' + said);
        await until(id => House.held() === id, mag); await page.waitForTimeout(400); await shot('story-02e-carrying-mag');
        await fingers.tap(V(p).width * .72, V(p).height * .42); await until(id => !House.held() && House.THINGS[id].st !== 'held', mag, 15000);
      }
      // walk: the left thumb, forward then a curve
      const { width: w, height: h } = V(p);
      const before = await page.evaluate(() => [House.W.x, House.W.z, House.P.ry]);
      await fingers.down(1, 90, h - 160); await fingers.move(1, 92, h - 210); await fingers.move(1, 94, h - 230);
      await page.waitForTimeout(400); await shot('story-03-stick-walk');
      await fingers.move(1, 140, h - 220); await page.waitForTimeout(700); await fingers.up(1);
      await until(() => Math.hypot(House.W.vx, House.W.vz) < 1);
      const walked = await page.evaluate(() => [House.W.x, House.W.z]);
      assert(Math.hypot(walked[0] - before[0], walked[1] - before[1]) > 20, 'Stick did not walk: ' + JSON.stringify([before, walked]));
      // jog: past the rim
      await fingers.down(1, 90, h - 160); await fingers.move(1, 90, h - 260); await page.waitForTimeout(200);
      assert(await page.evaluate(() => document.querySelector('.ht-stick').classList.contains('run')), 'Pushing past the rim jogs');
      await shot('story-04-stick-jog'); await fingers.up(1);
      // look: the right thumb
      const ry0 = await page.evaluate(() => House.P.ry);
      await fingers.drag(2, w - 120, h * .45, w - 260, h * .42, 500);
      const ry1 = await page.evaluate(() => House.P.ry);
      assert(Math.abs(ry1 - ry0) > 15, 'Drag did not look round: ' + ry0 + ' -> ' + ry1);
      await shot('story-05-looked');
      // the quest line (no keyboard hint on touch) and the diary's objective picker
      const line = await page.evaluate(() => { const l = document.querySelector('.st-objective'); return l && !l.hidden ? l.textContent : ''; });
      assert(!/\[J\]/.test(line), 'Quest line shows a keyboard key on touch: ' + line);
      if (line) {
        await p.press('.st-objective'); await page.waitForTimeout(800); await shot('story-06-diary-picker');
        await p.press('[data-quest-close]');
        await until(() => !window.stDiary?.picking);
        await page.waitForTimeout(400);
      }
      // the pause menu: touch settings, no keyboard text
      await p.press('menu'); await until(() => HousePause.open); await page.waitForTimeout(300); await shot('story-07-pause');
      const pauseIssues = await page.evaluate(() => { const d = document.querySelector('dialog.hs-pause'), r = d.getBoundingClientRect(); return [r.left < 0 || r.right > innerWidth + 1 ? 'pause clipped' : '', !d.querySelector('.ht-settings') || getComputedStyle(d.querySelector('.ht-settings')).display === 'none' ? 'no touch settings' : '', getComputedStyle(d.querySelector('.hs-pause-controls:not(.ht-help)')).display !== 'none' ? 'keyboard help shown on touch' : ''].filter(Boolean); });
      assert.deepEqual(pauseIssues, []);
      await page.evaluate(() => document.querySelector('dialog.hs-pause').scrollTop = 9999); await page.waitForTimeout(200); await shot('story-08-pause-bottom');
      await page.evaluate(() => document.querySelector('dialog.hs-pause').scrollTop = 0); await page.waitForTimeout(150);
      await p.press('[data-pause="resume"]'); await until(() => !HousePause.open && !House.paused);
      // Keep moving until navigation: compare with the final departing pose, not an earlier
      // sample taken while the finger is still held (busy renderers can move between those calls).
      await page.evaluate(() => addEventListener('pagehide', () => sessionStorage.setItem('jhp_mobile_test_departing', JSON.stringify([House.W.x, House.W.z])), {once:true}));
      await fingers.down(1, 90, h - 160); await fingers.move(1, 90, h - 230); await page.waitForTimeout(600);
      const mid = await page.evaluate(() => { House.saveWalkState(); return [House.W.x, House.W.z]; });
      await page.reload({ waitUntil: 'domcontentloaded' }); fingers.up(1).catch(() => {});
      await until(() => window.AccountGate?.allowed && window.House?.live && !document.querySelector('.hs-loading,#houseEntry') && House.mode === 'walk', null, 120000);
      const {after,departing} = await page.evaluate(() => ({after:[House.W.x,House.W.z],departing:JSON.parse(sessionStorage.getItem('jhp_mobile_test_departing')||'null')}));
      assert(departing, 'No pagehide pose was recorded');
      assert(Math.hypot(after[0] - departing[0], after[1] - departing[1]) < 2, 'Refresh mid-walk lost the final pose: ' + JSON.stringify({mid,departing,after}));
      await page.waitForTimeout(1200); await shot('story-09-after-refresh'); await notBlack(p, 'after refresh');
      // rotate: landscape and back, never black
      await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(1200);
      await shot('story-10-landscape'); await notBlack(p, 'landscape'); await layoutAudit(p, 'story landscape');
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(1200);
      await notBlack(p, 'portrait again');
      // the app switch: hidden and back (and a lost WebGL context recovers)
      await page.evaluate(() => { const gl = House.ren.getContext(); window.__lose = gl.getExtension('WEBGL_lose_context'); __lose.loseContext(); });
      await page.waitForTimeout(600); await page.evaluate(() => window.__lose.restoreContext()); await page.waitForTimeout(1500);
      await page.evaluate(() => House.dirty()); await page.waitForTimeout(800);
      await shot('story-11-context-restored'); await notBlack(p, 'context restored');
      assert.deepEqual(p.errors.filter(e => !/context[ _-]lost/i.test(e)), [], 'story browser errors');
    } finally { await p.ctx.close(); }
  },

  // An existing player with the full room on a Pixel: PC (JackOS by touch), carrying, a console with the touch pad,
  // the Game Lad's own buttons, the diary, Pixel Post and chores at phone size.
  async full() {
    const acct = await register('Pix' + Date.now().toString(36).slice(-6));
    const p = await phone('pixel-412x915'), { page, until, fingers, shot, press } = p;
    try {
      await logon(p, acct, { first: 'full-01-logon' });
      // Logon sits you at the PC; a phone LOCKs IN so JackOS is finger-sized
      await until(() => House.mode === 'monitor' && !House.gliding && window.DesktopSurface?.ready(), null, 60000);
      await until(() => House.desktopDisplay() && !document.documentElement.classList.contains('pc-lock-anim'), null, 20000);
      await page.waitForTimeout(800); await shot('full-02-jackos-locked');
      await layoutAudit(p, 'JackOS locked in');
      // JackOS by touch: Start menu, then Notepad, typing with the phone keyboard
      await press('#startBtn'); await page.waitForTimeout(500); await shot('full-03-start-menu');
      await press('#startBtn'); await page.waitForTimeout(300);
      await page.evaluate(() => Apps.open('notepad')); await until(() => document.querySelector('.appwin textarea'));
      await page.locator('.appwin textarea').first().tap(); await page.keyboard.type('Typed on a phone in 1999');
      assert.equal(await page.evaluate(() => document.querySelector('.appwin textarea').value), 'Typed on a phone in 1999');
      await shot('full-04-notepad-typing');
      await page.evaluate(() => document.querySelector('.appwin [data-w=close]')?.click()); await page.waitForTimeout(300);
      // In room: the monitor in its bezel, then stand up by touch
      await press('lock'); await until(() => !House.desktopDisplay()); await page.waitForTimeout(900); await shot('full-05-pc-in-room');
      await press('stand'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      await page.waitForTimeout(800); await shot('full-06-stood-up'); await layoutAudit(p, 'stood up portrait');
      // Carry: the beanbag (dragged) and the kart box (lifted), with the touch buttons
      const home = await page.evaluate(() => House.THINGS['media.box.n64.kart'].at);
      await aimAt(p, [-220, -55, 35], [home.x, home.y - 6, -36]);
      await until(() => !!document.querySelector('.ht-hud [data-k="e"]'), null, 10000); await shot('full-07-aim-box');
      await layoutAudit(p, 'aiming');
      const pickLabel = await clickThing(p, 'media.box.n64.kart', 'full-07b-finger-label');
      assert.match(pickLabel, /pick up/i, 'Finger label before picking up: ' + pickLabel);
      await until(() => House.held() === 'media.box.n64.kart');
      await aimAt(p, [-80, -55, 220], [-130, 73, 145]); await page.waitForTimeout(400); await shot('full-08-carrying');
      await layoutAudit(p, 'carrying');
      const ry0 = await page.evaluate(() => House.grip.ry); await press('r'); await until(r => House.grip && House.grip.ry !== r, ry0);
      await fingers.tap(V(p).width * .72, V(p).height * .4); await until(() => House.THINGS['media.box.n64.kart'].st === 'rest'); // (a click puts it down at its ghost)
      // open the case (F), take the cartridge (E), put it in the console (E)
      await aimAt(p, [-80, -55, 220], [-130, 67, 146.6]); await press('f'); await until(() => House.THINGS['media.box.n64.kart'].caseOpen);
      await aimAt(p, [-80, -55, 220], [-130, 69, 146.3]); await press('e'); await until(() => House.held() === 'media.n64.kart');
      const slot = await page.evaluate(() => House.SNAPS['console.n64']); await aimAt(p, [-185, -55, 120], [slot.x, slot.y, slot.z]);
      await page.waitForTimeout(400); await shot('full-09-insert-cart');
      await press('e'); await until(() => window.RoomTV?._dbg()?.st === 'game', null, 30000);
      await until(() => !!document.querySelector('.rm-tvv .rm-pad:not([hidden]) [data-b="start"]'), null, 15000);
      await page.waitForTimeout(1500); await shot('full-10-console-pad'); await layoutAudit(p, 'console pad portrait');
      await press('.rm-pad [data-b="start"]'); await page.waitForTimeout(500);
      // hold the stick / d-pad up, and A
      const st = await page.evaluate(() => { const r = document.querySelector('.rm-pad .rm-stick, .rm-pad .rm-dpad').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, h: r.height }; });
      await fingers.down(3, st.x, st.y); await fingers.move(3, st.x, st.y - st.h * .45);
      const held = await page.evaluate(() => { const k = RoomTV.dbg(); return k && (k.held('up') || k.stick().y < -.3); }); await fingers.up(3);
      assert(held, 'Touch pad did not reach the game');
      await page.setViewportSize({ width: 915, height: 412 }); await page.waitForTimeout(1500); await shot('full-11-console-pad-landscape'); await layoutAudit(p, 'console pad landscape');
      await press('.rm-tools .rm-lock'); await page.waitForTimeout(1200); await shot('full-12-console-lockin-landscape');
      await page.setViewportSize({ width: 412, height: 915 }); await page.waitForTimeout(1200); await shot('full-13-console-lockin-portrait');
      await press('.rm-tools .rm-lock'); await page.waitForTimeout(800);
      await press('.rm-tools .rm-lean'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      await gameLad(p, 'full');
      // the in-world mobile phone: its own keys, pressed by finger (projected onto the model like the PC screen)
      await page.evaluate(() => HouseMobile.use()); await until(() => window.FamilyPhone?.isOpen() && House.focused && !House.gliding, null, 30000); await page.waitForTimeout(800);
      const keys = await page.evaluate(() => [...document.querySelectorAll('.hs-phone-key')].map(b => { const r = b.getBoundingClientRect(); return { l: b.getAttribute('aria-label'), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }).filter(k => k.w > 0));
      assert(keys.length >= 10, 'Phone keys missing: ' + keys.length);
      const before = await page.evaluate(() => JSON.stringify(FamilyPhone.state()));
      for (const k of [keys.find(k => /ok|menu|select|enter/i.test(k.l)) || keys[0]]) { await fingers.tap(k.x, k.y); await sleep(400); }
      const after = await page.evaluate(() => JSON.stringify(FamilyPhone.state()));
      await shot('full-21-phone-keys'); report.checks.push({ label: 'phone keys', smallest: Math.min(...keys.map(k => Math.min(k.w, k.h))), keys: keys.length, changed: before !== after });
      assert.notEqual(after, before, 'A finger on the phone key did nothing');
      await press('.hs-getup'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      // the diary (reading) by touch, Pixel Post, chores at phone size
      await page.evaluate(() => window.stDiary?.picker?.()); await page.waitForTimeout(900); await shot('full-17-diary');
      await press('.st-quests [aria-label="Close diary"]'); await page.waitForTimeout(500);
      await page.evaluate(() => House.say('Pixel Post', 'Your parcel is by the front door. Stand up, go downstairs and press F to unbox it.', 9000)); await page.waitForTimeout(400);
      await shot('full-18-note'); await layoutAudit(p, 'note portrait');
      assert(await page.evaluate(() => GameInput.touch), 'Touch mode lost during the run');
      assert.deepEqual(p.errors, [], 'full browser errors');
    } finally { await p.ctx.close(); }
  },

  // The smallest phone (360x740): PC LOCK IN, the room by thumb (walk, look, pick up and put down by clicking), the Game
  // Lad with its own buttons, LOCK IN, landscape.
  async small() {
    const acct = await register('Sml' + Date.now().toString(36).slice(-6));
    const p = await phone('galaxy-360x740'), { page, until, fingers, shot, press } = p;
    try {
      await logon(p, acct);
      await until(() => House.mode === 'monitor' && !House.gliding && window.DesktopSurface?.ready(), null, 60000);
      await until(() => House.desktopDisplay(), null, 30000); await page.waitForTimeout(800); await shot('small-01-jackos'); await layoutAudit(p, 'small jackos');
      await press('stand'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000); await page.waitForTimeout(1500);
      await shot('small-02-house-coach'); await layoutAudit(p, 'small house');
      // R107: a discovery during first-time instruction yields the coach and stays below the live objective.
      await page.evaluate(() => House.toast('SECRET FOUND', 'A little discovery')); await sleep(400);
      const banners = await page.evaluate(() => {
        const visible = e => { for (let p = e; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return !!e.getBoundingClientRect().width; };
        const box = e => { const r = e.getBoundingClientRect(); return { x:r.x,y:r.y,right:r.right,bottom:r.bottom }; };
        const toast = document.querySelector('.hs-ui .rm-toast.on');
        return { toast: toast && box(toast), coach: [...document.querySelectorAll('.ht-coach-card')].some(visible), objectives: [...document.querySelectorAll('.st-objective,.se-objective')].filter(visible).map(box) };
      });
      assert(banners.toast, 'Discovery toast missing'); assert(!banners.coach, 'Coach competes with discovery');
      for (const r of banners.objectives) assert(banners.toast.y >= r.bottom + 4, 'Discovery overlaps objective: ' + JSON.stringify(banners));
      report.checks.push({label:'small discovery stacking',...banners}); await shot('small-02-discovery');

      const beforeChoice = await page.evaluate(() => { const p = [House.W.x,House.W.z]; HouseTouch._slowOffer(150); return p; });
      await until(() => !!document.querySelector('.ht-slow')); await shot('small-02-slow-choice');
      await press('.ht-slow [data-v="house"]'); await until(() => !document.querySelector('.ht-slow'));
      assert(await page.evaluate(p => House.mode === 'walk' && !PCOnly.desktopOnly && Math.hypot(House.W.x-p[0],House.W.z-p[1]) < 1, beforeChoice), 'Keep-house choice changed pose or mode');
      const { width: w, height: h } = V(p), x0 = await page.evaluate(() => [House.W.x, House.W.z]);
      await fingers.down(1, 80, h - 150); await fingers.move(1, 80, h - 215); await sleep(800); await fingers.up(1);
      await fingers.drag(2, w - 90, h * .45, w - 200, h * .45, 500);
      assert(await page.evaluate(x0 => Math.hypot(House.W.x - x0[0], House.W.z - x0[1]) > 15, x0), 'Did not walk at 360x740');
      await aimAt(p, [40, -55, 185], [40, -55, -20]); await recordPath(p, 'small-360x740');
      await shot('small-03-walked');
      const home = await page.evaluate(() => House.THINGS['media.box.n64.kart'].at);
      await aimAt(p, [-220, -55, 35], [home.x, home.y - 6, -36]);
      assert.match(await clickThing(p, 'media.box.n64.kart', 'small-04-finger-label'), /pick up/i); await until(() => House.held() === 'media.box.n64.kart');
      // (away from where the Game Lad case goes next)
      for (const t of [[-110, 73, 190], [0, 73, 200], [-90, 73, 175]]) { await aimAt(p, [-60, -55, 250], t); await sleep(400); if (await page.evaluate(() => !document.querySelector('.hs-ui .hs-hold')?.classList.contains('blocked'))) break; }
      await shot('small-05-carrying'); await layoutAudit(p, 'small carrying');
      await fingers.tap(w * .72, h * .4); await until(() => House.THINGS['media.box.n64.kart'].st === 'rest');
      await gameLad(p, 'small');
      await page.setViewportSize({ width: 740, height: 360 }); await page.waitForTimeout(1500); await shot('small-20-house-landscape');
      await aimAt(p, [40, -55, 185], [40, -55, -20]); await recordPath(p, 'small-740x360'); await layoutAudit(p, 'small landscape'); await notBlack(p, 'small landscape');
      assert.deepEqual(p.errors, [], 'small browser errors');
    } finally { await p.ctx.close(); }
  },

  // Feel metrics (round 3, docs/MOBILE-CONTROLS.md), measured with real touches on a 412x915 phone: the stick's dead
  // zone and response curve, the look curve (slow vs quick drags), aim-assist hit rates round a thing, a second finger
  // taking over the look, a rolling thumb on a button, the frame cap, and a recorded walk-and-look touch path.
  async feel() {
    const acct = await register('Fel' + Date.now().toString(36).slice(-6));
    const p = await phone('pixel-412x915'), { page, until, fingers, shot, press } = p;
    const feel = report.feel = {};
    try {
      await logon(p, acct);
      await until(() => House.mode === 'monitor' && !House.gliding, null, 60000);
      await press('stand'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      await page.evaluate(() => Room.ensureHouse()); await until(() => window.HouseRooms?.ready, null, 60000);
      const { width: w, height: h } = V(p);
      // the stick: speed (cm/s) at each deflection, from the landing in the open hall
      const R = await page.evaluate(() => Math.max(46, Math.min(70, Math.min(innerWidth, innerHeight) * .15)));
      const stickRow = [];
      for (const f of [.1, .2, .35, .5, .75, 1, 1.4]) {
        await aimAt(p, [40, -55, 185], [40, -55, -20]); await sleep(300); // (the bedroom, facing its far wall ~1.8 m away)
        const x0 = 90, y0 = h - 170; await fingers.down(1, x0, y0); await fingers.move(1, x0, y0 - 14); await fingers.move(1, x0, y0 - R * f); await sleep(330); // (settled: the walk eases in with a ~0.11 s time constant)
        // (the walking velocity itself, settled after ~0.35 s, well before the far wall at any speed)
        const v = [], dbg = []; for (let i = 0; i < 3; i++) { const q = await page.evaluate(() => ({ v: Math.hypot(House.W.vx, House.W.vz), run: House.touch.state.run, z: House.W.z, m: House._.movementState().keys })); v.push(q.v); dbg.push(q); await sleep(40); }
        if (f > 1.2) feel.jogSamples = dbg;
        if (f > 1.2) feel.jog = await page.evaluate(() => ({ cls: document.querySelector('.ht-stick').className, touch: House.touch.state, fingers: HouseTouch._fingers() }));
        await fingers.up(1); await sleep(350);
        stickRow.push({ deflection: f, cmPerS: Math.round(v.reduce((a, b) => a + b) / v.length) });
      }
      feel.stick = stickRow;
      assert.equal(stickRow[0].cmPerS, 0, 'Dead zone: a 10% nudge must not walk');
      assert(stickRow[3].cmPerS > 15 && stickRow[3].cmPerS < stickRow[5].cmPerS, 'Stick curve not rising: ' + JSON.stringify(stickRow));
      assert(stickRow[6].cmPerS > stickRow[5].cmPerS * 1.2, 'Past the rim should jog: ' + JSON.stringify(stickRow));
      // look: the same 200 px drag, slow and quick
      const turn = async ms => { const r0 = await page.evaluate(() => House.P.ry); await fingers.drag(2, w - 60, h * .45, w - 260, h * .45, ms); await sleep(200); return Math.round((await page.evaluate(() => House.P.ry) - r0) * 10) / 10; };
      feel.fingersAfterStick = await page.evaluate(() => HouseTouch._fingers());
      const slow = await turn(1200); feel.fingersAfterSlow = await page.evaluate(() => HouseTouch._fingers());
      feel.look = { slow200px: slow, quick200px: await turn(160) };
      assert(Math.abs(feel.look.slow200px) > 50 && Math.abs(feel.look.slow200px) < 110, 'Look speed out of range: ' + JSON.stringify(feel.look));
      assert(Math.abs(feel.look.quick200px) <= Math.abs(feel.look.slow200px) * 1.6, 'Look acceleration too strong: ' + JSON.stringify(feel.look));
      // aim assist: hit rate round the kart box at 0..40 px from where it is on screen
      // (a thing on its own: the puzzle cube on the desk, seen from about a metre)
      const T = 'cube'; assert(await standAndAim(p, T), 'Cannot see the cube'); await sleep(300);
      const c = await screenOf(p, T);
      const hits = await page.evaluate(({ c, T }) => { const out = {}; for (const r of [0, 12, 24, 34, 48]) { let n = 0, k = 0; for (let i = 0; i < 8; i++) { const a = HouseTouch._aimAt(c.x + Math.cos(i * Math.PI / 4) * r, c.y + Math.sin(i * Math.PI / 4) * r); k++; if (a?.id === T) n++; } out[r] = n / k; } return out; }, { c, T });
      feel.cubeOnScreenPx = await page.evaluate(T => { const H = House, b = new H.T.Box3().setFromObject(H.THINGS[T].obj), s = b.getSize(new H.T.Vector3()), c = b.getCenter(new H.T.Vector3()), r = H.ren.domElement.getBoundingClientRect(), p = v => { v.project(H.camera); return [(v.x + 1) / 2 * r.width, (1 - v.y) / 2 * r.height]; }; const a = p(c.clone().addScaledVector(new H.T.Vector3(1, 0, 0), s.x / 2)), d = p(c.clone().addScaledVector(new H.T.Vector3(1, 0, 0), -s.x / 2)); return Math.round(Math.hypot(a[0] - d[0], a[1] - d[1])); }, T);
      feel.aimAssist = hits;
      assert(hits[0] === 1 && hits[24] >= .75, 'Aim assist misses: ' + JSON.stringify(hits));
      // and end to end: a real press 24 px off the box picks it up, then Return puts it back
      await fingers.down(3, c.x + 22, c.y + 8); await sleep(120); const lab = await page.evaluate(() => document.querySelector('.ht-tapmark.on')?.textContent || ''); await fingers.up(3);
      await until(T => House.held() === T, T, 10000); feel.offsetPress = lab;
      await press('q'); await until(() => !House.held(), null, 10000);
      // two fingers on the look side: the second takes over when the first lifts
      await fingers.down(4, w - 80, h * .4); await fingers.move(4, w - 100, h * .4); await fingers.move(4, w - 130, h * .4);
      await fingers.down(5, w - 90, h * .55); feel.fingersBefore = await page.evaluate(() => HouseTouch._fingers()); await fingers.up(4); await sleep(100);
      const r1 = await page.evaluate(() => House.P.ry); await fingers.move(5, w - 140, h * .55); await fingers.move(5, w - 200, h * .55); await sleep(150);
      const r2 = await page.evaluate(() => House.P.ry); const fs = await page.evaluate(() => HouseTouch._fingers()); await fingers.up(5);
      feel.secondFinger = Math.round((r2 - r1) * 10) / 10; assert(Math.abs(r2 - r1) > 8, 'Second finger did not take over the look: ' + JSON.stringify({ fs, r1, r2 }));
      // a close-up: one finger turns it, two fingers zoom it (no browser pan/zoom steals the drag)
      assert(await page.evaluate(() => House.inspect('mug'))); await until(() => House.mode === 'inspect', null, 10000); await sleep(800); // (the mug: the cube's faces turn under a finger instead)
      const insp = () => page.evaluate(() => { const g = House.THINGS.mug.obj; return { q: g.quaternion.toArray().map(v => +v.toFixed(3)), s: +House.camera.position.distanceTo(new House.T.Box3().setFromObject(g).getCenter(new House.T.Vector3())).toFixed(2) }; });
      const i0 = await insp(); await fingers.drag(8, w * .3, h * .5, w * .7, h * .5, 500); await sleep(300); const i1 = await insp();
      feel.inspectTurn = JSON.stringify(i0.q) !== JSON.stringify(i1.q); assert(feel.inspectTurn, 'One finger did not turn the close-up');
      await fingers.down(8, w * .4, h * .5); await fingers.down(9, w * .6, h * .5); for (let i = 1; i <= 6; i++) { await fingers.move(8, w * .4 - i * 12, h * .5); await fingers.move(9, w * .6 + i * 12, h * .5); await sleep(40); }
      await fingers.up(9); await fingers.up(8); await sleep(300); const i2 = await insp(); feel.pinch = { before: i1.s, after: i2.s };
      assert(i2.s !== i1.s, 'Two fingers did not zoom the close-up'); await shot('feel-02-closeup');
      await press('.hs-inspection button:last-of-type'); await until(() => House.mode === 'walk', null, 10000); if (await page.evaluate(() => !!House.held())) { await press('q'); await until(() => !House.held(), null, 10000); }
      // a thumb that rolls 16 px while pressing Crouch still presses it
      const cr0 = await page.evaluate(() => !!House._.movementState().keys.crouch);
      const cb = await page.evaluate(() => { const r = document.querySelector('.ht-hud [data-k="crouch"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await fingers.down(6, cb.x, cb.y); await fingers.move(6, cb.x + 10, cb.y - 8); await fingers.move(6, cb.x + 16, cb.y - 10); await sleep(1000); await fingers.up(6); await sleep(200);
      const cr1 = await page.evaluate(() => !!House._.movementState().keys.crouch); feel.rollingPress = cr0 !== cr1;
      assert(cr0 !== cr1, 'A rolling thumb on Crouch was lost'); await press('crouch');
      // frame cap and a recorded touch path: walk forward while turning right, sampled every 100 ms
      await aimAt(p, [40, -55, 185], [40, -55, -20]); await sleep(300);
      const path = []; await fingers.down(1, 90, h - 170); await fingers.move(1, 90, h - 185); await fingers.move(1, 90, h - 170 - R);
      await fingers.down(2, w - 120, h * .45);
      for (let i = 0; i < 14; i++) { await fingers.move(2, w - 120 - i * 6, h * .45); await sleep(80); path.push(await page.evaluate(() => ({ t: Math.round(performance.now()), x: +House.W.x.toFixed(1), z: +House.W.z.toFixed(1), ry: +House.P.ry.toFixed(1) }))); if (i === 8) await shot('feel-01-walk-look'); }
      await fingers.up(2); await fingers.up(1);
      feel.path = path; feel.perf = await page.evaluate(() => House.perf());
      await aimAt(p, [40, -55, 185], [40, -55, -20]); await recordPath(p, 'feel-412x915');
      await page.setViewportSize({ width: 915, height: 412 }); await sleep(1200); await aimAt(p, [40, -55, 185], [40, -55, -20]);
      const land = await recordPath(p, 'feel-915x412'); assert(land.some(q => q.touch.on), 'Landscape stick did not walk');
      await page.setViewportSize({ width: 412, height: 915 }); await sleep(1000);
      // jitter: the walk speed between samples should be steady once moving (no stutter spikes beyond host noise)
      const sp = path.slice(3).map((q, i, a) => i ? Math.hypot(q.x - a[i - 1].x, q.z - a[i - 1].z) / ((q.t - a[i - 1].t) / 1000) : null).filter(v => v != null);
      feel.walkSpeedSamples = sp.map(Math.round);
      assert.deepEqual(p.errors, [], 'feel browser errors');
      console.log('FEEL', JSON.stringify({ stick: feel.stick, look: feel.look, aimAssist: feel.aimAssist, secondFinger: feel.secondFinger, rollingPress: feel.rollingPress, cap: feel.perf.cap, frameP50: feel.perf.frameP50 }));
    } finally { await p.ctx.close(); }
  },

  // A tablet: portrait and landscape house, JackOS stays in the room's monitor unless LOCKed IN.
  async tablet() {
    const acct = await register('Tab' + Date.now().toString(36).slice(-6));
    const p = await phone('ipad-768x1024'), { page, until, shot, press } = p;
    try {
      await logon(p, acct);
      await until(() => House.mode === 'monitor' && !House.gliding && window.DesktopSurface?.ready(), null, 60000);
      await page.waitForTimeout(1200); await shot('tablet-01-pc'); await layoutAudit(p, 'tablet pc');
      assert.equal(await page.evaluate(() => House.Q.guess), 'low', 'Tablets start on Low');
      await press('stand'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      await page.waitForTimeout(1200); await shot('tablet-02-house'); await layoutAudit(p, 'tablet house');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(1500); await shot('tablet-03-landscape'); await notBlack(p, 'tablet landscape');
      await press('menu'); await until(() => HousePause.open); await page.waitForTimeout(300); await shot('tablet-04-pause');
      assert.deepEqual(p.errors, [], 'tablet browser errors');
    } finally { await p.ctx.close(); }
  },

  // The owner's tools at phone size (owner account on throwaway data only).
  async owner() {
    const acct = await register('Jack', 'Throwaway-1999');
    for (const prof of ['galaxy-360x740', 'iphone-844x390']) {
      const p = await phone(prof), { page, until, shot, press } = p;
      try {
        await logon(p, acct);
        await until(() => ['monitor', 'walk'].includes(House.mode) && !House.gliding, null, 60000);
        if (await page.evaluate(() => House.mode === 'monitor')) { await press('stand'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000); }
        await press('menu'); await until(() => HousePause.open);
        await until(() => !document.querySelector('[data-pause="owner"]').hidden, null, 15000);
        await press('[data-pause="owner"]'); await until(() => !!document.querySelector('dialog.owner-tools[open]'), null, 15000);
        await page.waitForTimeout(800); await shot(`owner-${prof}`);
        const clipped = await page.evaluate(() => [...document.querySelectorAll('dialog.owner-tools[open] button, dialog.owner-tools[open] input, dialog.owner-tools[open] select')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 2 || r.left < -2); }).map(e => (e.textContent || e.name || '').trim().slice(0, 20)));
        report.checks.push({ label: 'owner tools ' + prof, clipped });
        assert.deepEqual(clipped, [], 'Owner tools clipped at ' + prof);
        assert.deepEqual(p.errors, [], 'owner browser errors');
      } catch (e) {
        await shot('owner-failure-' + prof).catch(() => {});
        console.log('Owner menu state', await page.evaluate(() => ({ god: House.god, owner: OwnerTools.active, picking: window.stDiary?.picking, mode: House.mode, glide: House.gliding, touch: document.documentElement.dataset.touchState, dialogs: [...document.querySelectorAll('dialog[open]')].map(d => d.className) })));
        throw e;
      } finally { await p.ctx.close(); }
    }
  },

  // Frame times on the phone tier: Pixel profile, emulated CPU throttling (4x by default), software WebGL.
  async perf() {
    const acct = await register('Perf' + Date.now().toString(36).slice(-6));
    const p = await phone('pixel-412x915'), { page, until, fingers, press } = p;
    try {
      await logon(p, acct);
      await until(() => House.mode === 'monitor' && !House.gliding, null, 60000);
      await press('stand'); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      await page.evaluate(() => Room.ensureHouse()); await page.waitForTimeout(1500);
      await p.cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
      const { height: h, width: w } = V(p);
      const run = async (label, ms) => {
        await page.evaluate(() => { window.__ft = []; let last = 0; (function f(t) { if (last) window.__ft.push(t - last); last = t; if (window.__ft.length < 4000) requestAnimationFrame(f); })(); });
        const t0 = await page.evaluate(() => House.perf().frames);
        await fingers.down(1, 90, h - 160); await fingers.move(1, 90, h - 230);
        await fingers.down(2, w - 140, h * .45);
        for (let i = 0; i < ms / 100; i++) { await fingers.move(2, w - 140 - (i % 20) * 6, h * .45); await sleep(100); }
        await fingers.up(2); await fingers.up(1);
        const perf = await page.evaluate(() => House.perf()), t1 = perf.frames;
        const extra = await page.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 5; i++) House.pick(innerWidth / 2, innerHeight / 2); const pick = (performance.now() - t0) / 5; const ft = (window.__ft || []).slice().sort((a, b) => a - b); return { pickMs: +pick.toFixed(2), physicsMs: +(House.physics.ms || 0).toFixed(2), rafP50: +(ft[ft.length >> 1] || 0).toFixed(1), rafP95: +(ft[Math.floor(ft.length * .95)] || 0).toFixed(1), family: !!window.HouseFamily?.enabled }; });
        report.perf[label] = { tier: perf.tier, pixels: perf.pixels, scale: +perf.scale.toFixed(2), calls: perf.calls, triangles: perf.triangles, frameP50: +perf.frameP50.toFixed(1), frameP95: +perf.frameP95.toFixed(1), renderP50: +perf.renderP50.toFixed(1), drawn: t1 - t0, ...extra, load: +os.loadavg()[0].toFixed(1) };
      };
      await run(`walk-cpu${throttle}x`, 8000);
      await p.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await run('walk-cpu1x', 6000);
      console.log('PERF', JSON.stringify(report.perf));
    } finally { await p.ctx.close(); }
  },
};

// ---------------------------------------------------------------- run
try {
  if (!base) await start();
  await mkdir(shots, { recursive: true });
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--enable-unsafe-swiftshader'] });
  for (const [name, fn] of Object.entries(phases)) {
    if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    try { await fn(); results.push(true); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
    catch (e) { results.push(false); console.log(`FAIL ${name}: ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 600)}`); }
  }
  if (log && /mod failed to load|unhandled|fatal/i.test(log)) { results.push(false); console.log('FAIL server log'); }
} catch (e) { results.push(false); console.log('FAIL runner: ' + (e.stack || e)); }
finally {
  await browser?.close().catch(() => {});
  await writeFile(shots + 'report.json', JSON.stringify(report, null, 1)).catch(() => {});
  await stop();
}
console.log(`SUMMARY ${results.filter(Boolean).length}/${results.length} passed; shots in tests/shots/mobile/`);
process.exitCode = results.length && results.every(Boolean) ? 0 : 1;
