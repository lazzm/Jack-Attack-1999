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
import {analyse} from './transition-kit.mjs';

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
  await page.addInitScript(({ tier, hour }) => {
    if (tier) localStorage.setItem('jhp_hs_gfx', JSON.stringify(tier));
    window.auditHour = hour; Date.prototype.getHours = () => window.auditHour; Date.prototype.getMinutes = () => 0;
  }, { tier, hour });
  const cdp = await ctx.newCDPSession(page);
  const pts = new Map();
  const send = type => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...pts.values()] });
  const fingers = {
    async down(id, x, y) { pts.set(id, { x, y, id, radiusX: 6, radiusY: 6, force: 1 }); await send('touchStart'); },
    async move(id, x, y) { pts.set(id, { ...pts.get(id), x, y }); await send('touchMove'); },
    async up(id) { pts.delete(id); await send('touchEnd'); },
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
  await until(() => window.AccountGate?.allowed && window.House?.live && !document.querySelector('.hs-loading,#houseEntry'), null, 120000);
}
// Point the camera with the scene API (like the smoke fixture); every interaction after that is a real finger.
async function aimAt(p, eye, target, level = 'U') {
  await p.page.evaluate(({ eye, target, level }) => {
    House.hush(); House.setWalkFrom({ x: eye[0], y: eye[1], z: eye[2], lvl: level, seat: 0 });
    const [x, y, z] = eye, [tx, ty, tz] = target;
    Object.assign(House.P, { x, y, z, rx: Math.atan2(-(ty - y), Math.hypot(tx - x, tz - z)) * 180 / Math.PI, ry: Math.atan2(tx - x, -(tz - z)) * 180 / Math.PI });
    House._.setMode('walk'); House.dirty();
  }, { eye, target, level });
  await sleep(700);
}
// A screenshot of a live WebGL page is never black: mean luminance and black-pixel share over the whole frame.
async function notBlack(p, label) {
  const buf = await p.page.screenshot({ type: 'jpeg', quality: 60 });
  const [s] = await analyse(browser, [{ buf }]);
  assert(s.mean > 14 && s.black < .6, `${label}: black frame (mean ${s.mean.toFixed(1)}, black ${(s.black * 100).toFixed(0)}%)`);
  return s;
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
      const info = await page.evaluate(() => ({ tier: House.Q.tier, pr: House.Q.pixelRatio, dpr: devicePixelRatio, touch: GameInput.touch, state: document.documentElement.dataset.touchState, handheld: PCOnly.handheld, jackos: PCOnly.desktopOnly }));
      assert.equal(info.handheld, true); assert.equal(info.jackos, false, 'Phone must get the house'); assert.equal(info.touch, true);
      assert.equal(info.tier, 'high', 'Phones get the one (best) look'); assert(info.pr >= Math.min(info.dpr, 1.75) * .85 - 1e-6, 'Phone drawing buffer stays sharp: ' + JSON.stringify(info));
      await until(() => House.mode === 'walk' && document.documentElement.dataset.touchState === 'walk', null, 60000);
      await page.waitForTimeout(2500); await shot('story-02-opening'); await notBlack(p, 'opening');
      await layoutAudit(p, 'story opening portrait');
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
        await page.evaluate(() => document.querySelector('.st-quests [data-close], .st-picker button, dialog[open] button')?.click());
        await page.waitForTimeout(400);
      }
      // the pause menu: touch settings, no keyboard text
      await p.press('menu'); await until(() => HousePause.open); await page.waitForTimeout(300); await shot('story-07-pause');
      const pauseIssues = await page.evaluate(() => { const d = document.querySelector('dialog.hs-pause'), r = d.getBoundingClientRect(); return [r.left < 0 || r.right > innerWidth + 1 ? 'pause clipped' : '', !d.querySelector('.ht-settings') || getComputedStyle(d.querySelector('.ht-settings')).display === 'none' ? 'no touch settings' : '', getComputedStyle(d.querySelector('.hs-pause-controls:not(.ht-help)')).display !== 'none' ? 'keyboard help shown on touch' : ''].filter(Boolean); });
      assert.deepEqual(pauseIssues, []);
      await page.evaluate(() => document.querySelector('dialog.hs-pause').scrollTop = 9999); await page.waitForTimeout(200); await shot('story-08-pause-bottom');
      await page.evaluate(() => document.querySelector('dialog.hs-pause').scrollTop = 0); await page.waitForTimeout(150);
      await p.press('[data-pause="resume"]'); await until(() => !HousePause.open && !House.paused);
      // refresh mid-walk: the pose is kept
      await fingers.down(1, 90, h - 160); await fingers.move(1, 90, h - 230); await page.waitForTimeout(600);
      const mid = await page.evaluate(() => { House.saveWalkState(); return [House.W.x, House.W.z]; });
      await page.reload({ waitUntil: 'domcontentloaded' }); fingers.up(1).catch(() => {});
      await until(() => window.AccountGate?.allowed && window.House?.live && !document.querySelector('.hs-loading,#houseEntry') && House.mode === 'walk', null, 120000);
      const after = await page.evaluate(() => [House.W.x, House.W.z]);
      assert(Math.hypot(after[0] - mid[0], after[1] - mid[1]) < 40, 'Refresh mid-walk lost the pose: ' + JSON.stringify([mid, after]));
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
      assert.deepEqual(p.errors.filter(e => !/context lost|CONTEXT_LOST/i.test(e)), [], 'story browser errors');
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
      await press('e'); await until(() => House.held() === 'media.box.n64.kart');
      await aimAt(p, [-80, -55, 220], [-130, 73, 145]); await page.waitForTimeout(400); await shot('full-08-carrying');
      await layoutAudit(p, 'carrying');
      const ry0 = await page.evaluate(() => House.grip.ry); await press('r'); await until(r => House.grip && House.grip.ry !== r, ry0);
      await press('e'); await until(() => House.THINGS['media.box.n64.kart'].st === 'rest');
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
      // the Game Lad: its own buttons on the model
      const gb = await page.evaluate(() => { const o = House.THINGS.gb.obj, v = new House.T.Vector3(); o.getWorldPosition(v); return [v.x, -v.y, v.z]; });
      await aimAt(p, [gb[0] + 40, -55, gb[2] + 70], gb); await page.waitForTimeout(300);
      await until(() => !!document.querySelector('.ht-hud [data-k="f"]'), null, 10000); await press('f');
      await until(() => window.RoomTV?._dbg()?.con === 'gb' && !House.gliding, null, 30000); await page.waitForTimeout(1500);
      await shot('full-14-gamelad-empty');
      // a cartridge in (the slot path is covered by the desktop tests), then its own moulded buttons by touch
      await page.evaluate(() => RoomTV.playPhysical(Object.keys(RoomCat.GAME).find(g => RoomCat.GAME[g].con === 'gb')));
      await until(() => RoomTV._dbg()?.st === 'game', null, 30000);
      await until(() => { const b = document.querySelector('.rm-gbtouch'); return b && !b.hidden; }, null, 20000);
      await page.waitForTimeout(2500); await shot('full-15-gamelad-buttons');
      const a = await page.evaluate(() => { const r = document.querySelector('.rm-gbtouch [data-b="a"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; });
      assert(a.w >= 44 && a.y < V(p).height - 10, 'Game Lad A button off screen or tiny: ' + JSON.stringify(a));
      await fingers.down(4, a.x, a.y); const gotA = await page.evaluate(() => RoomTV.dbg()?.held('a')); await fingers.up(4);
      assert(gotA, 'The Game Lad\'s own A button did not reach the game');
      await page.setViewportSize({ width: 915, height: 412 }); await page.waitForTimeout(2000); await shot('full-16-gamelad-landscape');
      assert(await page.evaluate(() => !!document.querySelector('.rm-tvv .rm-pad:not([hidden]) [data-b="a"]')), 'Landscape Game Lad has no pad');
      await page.setViewportSize({ width: 412, height: 915 }); await page.waitForTimeout(1500);
      await press('.rm-tools .rm-lean').catch(() => page.evaluate(() => RoomTV.close())); await until(() => House.mode === 'walk' && !House.gliding, null, 30000);
      // the diary (reading) by touch, Pixel Post, chores at phone size
      await page.evaluate(() => window.stDiary?.picker?.()); await page.waitForTimeout(900); await shot('full-17-diary');
      await press('.st-quests [aria-label="Close diary"]'); await page.waitForTimeout(500);
      await page.evaluate(() => House.say('Pixel Post', 'Your parcel is by the front door. Stand up, go downstairs and press F to unbox it.', 9000)); await page.waitForTimeout(400);
      await shot('full-18-note'); await layoutAudit(p, 'note portrait');
      assert(await page.evaluate(() => GameInput.touch), 'Touch mode lost during the run');
      assert.deepEqual(p.errors, [], 'full browser errors');
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
      assert.equal(await page.evaluate(() => House.Q.tier), 'high', 'Tablets get the one (best) look');
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
      } finally { await p.ctx.close(); }
    }
  },

  // Frame times on phones (one look, invisible adaptation): Pixel profile, emulated CPU throttling (4x by default), software WebGL.
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
