// Seasonal web themes (js/seasons-web.js, js/seasons-art.js, css/seasons-web.css) on the PC side: JackOS + JACK ATTACK! + a few
// fake sites. For each season it sets the 1999 date with ?date99=MM-DD (the same override the whole PC follows), checks the
// theme classes and markup, readable contrast and console errors, and writes screenshots to tests/shots/seasons-web/.
//   node seasons-web.mjs                       starts its own throwaway server (18080-18099, temp DATA_DIR) and stops it after
//   node seasons-web.mjs http://localhost:18091   uses an already running throwaway server
// The PC is driven in JackOS-only mode (a tablet browser at 1366x860: the desktop fills the viewport, no WebGL room), which
// is the same DOM the house shows on the 3D monitor. Exit code 0 = every check passed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url)), shots = fileURLToPath(new URL('shots/seasons-web/', import.meta.url));
const delay = ms => new Promise(r => setTimeout(r, ms));
let base = process.argv[2], server = null, data = null, log = '';
if (base) assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use a throwaway localhost server');

async function start() {
  data = await mkdtemp('/tmp/jhp-seasons-');
  for (let port = 18080; port <= 18099; port++) {
    const free = await new Promise(res => { const p = net.createServer(); p.once('error', () => res(false)); p.listen(port, '127.0.0.1', () => p.close(() => res(true))); });
    if (!free) continue;
    let out = '';
    server = spawn(process.execPath, ['server.js'], { cwd: root + 'app', env: { ...process.env, PORT: String(port), DATA_DIR: data, ADMIN_TOKEN: 'testtoken' }, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const s of [server.stdout, server.stderr]) s.on('data', c => { out += c; log += c; });
    base = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 150; i++) {
      if (server.exitCode !== null) { if (/EADDRINUSE/.test(out)) break; throw Error('Server startup: ' + out.slice(-400)); }
      if (out.includes(`online at :${port}`)) { const r = await fetch(base).catch(() => null); if (r && r.ok) return; }
      await delay(100);
    }
    if (server.exitCode === null) throw Error('Server readiness timeout');
  }
  throw Error('No free throwaway port in 18080-18099');
}
async function stop() {
  if (server && server.exitCode === null) { const e = once(server, 'exit'); server.kill('SIGTERM'); const t = setTimeout(() => server.kill('SIGKILL'), 1500); await e; clearTimeout(t); }
  if (data) await rm(data, { recursive: true, force: true });
}

// [label, MM-DD, season key or '' for none, phase]
const SEASONS = [
  ['halloween-lead', '10-26', 'halloween', 'lead'], ['halloween', '10-31', 'halloween', 'peak'], ['bonfire', '11-05', 'bonfire', 'peak'],
  ['xmas-lead', '12-15', 'xmas', 'lead'], ['xmas', '12-25', 'xmas', 'peak'], ['millennium', '12-29', 'millennium', 'lead'], ['newyear', '01-01', 'newyear', 'peak'],
  ['valentine', '02-14', 'valentine', 'peak'], ['easter', '04-04', 'easter', 'peak'], ['summer', '08-01', 'summer', 'on'], ['eclipse', '08-11', 'eclipse', 'peak'],
  ['backtoschool', '09-06', 'backtoschool', 'peak'], ['none', '06-15', '', ''],
];
const results = [];
const check = async (name, fn) => { try { await fn(); results.push([name, true]); console.log('PASS', name); } catch (e) { results.push([name, false]); console.log('FAIL', name, '-', String(e.message || e).replace(/\s+/g, ' ').slice(0, 400)); } };

let browser;
try {
  if (!base) await start();
  await mkdir(shots, { recursive: true });
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Tablet Safari/604.1' });
  // A tablet user agent for a light JackOS-only page (no 3D room). Since the 2026-10-26 device policy a tablet gets the
  // house by default, so this context makes the player's own per-device JackOS-only choice (js/pc-only.js).
  await ctx.addInitScript(() => localStorage.setItem('jhp_device_view', 'jackos'));
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/swiftshader|WebGL|GPU stall|ReadPixels/i.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  const ev = async (fn, arg) => { try { return await p.evaluate(fn, arg); } catch (e) { if (/context was destroyed|navigation/i.test(e.message)) return undefined; throw e; } };
  const until = async (fn, ms = 30000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(fn, arg)) return true; await delay(150); } throw Error('Timed out: ' + String(fn).slice(0, 120)); };
  const tidy = () => ev(() => { // close pop-ups so captures show the theme, not today's message boxes
    document.querySelectorAll('.balloon').forEach(b => b.remove());
    document.querySelectorAll('.appwin [data-w=close]').forEach(b => b.click());
    document.querySelectorAll('.msgbox').forEach(m => { const f = m.closest('.float'); const b = f && f.querySelector('.btn'); if (b) b.click(); });
  });
  const hideBalloons = () => p.addStyleTag({ content: '.balloon,#toastWrap{display:none!important}' });

  // ---- sign up once (a fresh throwaway account); every later load resumes it
  await p.goto(base + '/?date99=10-26&time=14:00:00', { waitUntil: 'networkidle' });
  await until(() => !!(window.AccountGate?.allowed || document.querySelector('#accountGate form')));
  if (!await ev(() => !!window.AccountGate?.allowed)) {
    await p.locator('#accountGate [data-switch]').click(); await delay(800);
    await p.locator('[name=name]').fill('Seasons' + Date.now().toString(36)); await p.locator('[name=password]').fill('Throwaway-1999'); await p.locator('[name=confirm]').fill('Throwaway-1999');
    await p.locator('#accountGate [type=submit]').click();
    await until(() => !!(window.AccountGate?.allowed || document.querySelector('#accountFirst')));
    if (await p.locator('#accountFirst').count()) await p.locator('#accountGate [type=submit]').click();
  }
  await until(() => !!(window.AccountGate?.allowed && window.DesktopSurface?.ready()), 60000);

  const contrast = () => ev(() => {
    const rgb = s => (s.match(/rgba?\([^)]*\)/g) || []).map(c => c.match(/[\d.]+/g).map(Number)).filter(c => c.length < 4 || c[3] > 0.5);
    const L = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const bgOf = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e), cols = rgb(cs.backgroundImage).concat(rgb(cs.backgroundColor)); if (cols.length) return cols; } return [[255, 255, 255]]; };
    const out = {};
    for (const [k, sel] of [['news text', '.ssw-nb p'], ['news title', '.ssw-nt'], ['marquee', '.ssw-strip'], ['menu button', '#menu .mbtn:not(.on)'], ['page text', '#s-home .ed .copy p'], ['forum bar', '.ssw-forumbar span']]) {
      const el = document.querySelector(sel); if (!el || !el.getClientRects().length) continue;
      const fg = rgb(getComputedStyle(el).color)[0], bgs = bgOf(el);
      out[k] = Math.min(...bgs.map(b => ratio(fg, b)));
    }
    return out;
  });

  for (const [label, md, key, phase] of SEASONS) {
    await check(`season ${label} (${md})`, async () => {
      errors.length = 0;
      await p.goto(`${base}/?date99=${md}&time=14:00:00`, { waitUntil: 'networkidle' });
      await until(() => !!(window.AccountGate?.allowed && window.DesktopSurface?.ready()), 60000);
      await hideBalloons();
      if (!key) {
        await delay(2500);
        assert.equal(await ev(() => document.documentElement.classList.contains('ssw')), false, 'no season class out of season');
        assert.equal(await ev(() => document.querySelectorAll('.ssw-ban,.ssw-news,.ssw-strip,.ssw-tray').length), 0, 'no seasonal markup out of season');
        await ev(() => { document.querySelector('#browser').classList.remove('min'); IE.go('home'); document.querySelector('#page').scrollTop = 0; });
        await delay(600); await p.screenshot({ path: shots + 'none-mag.png' });
        return;
      }
      await until(k => document.documentElement.classList.contains('ssw-' + k) && !!document.querySelector('.ssw-ban .ssw-scene') && !!window.SeasonsWeb, 20000, key);
      const st = await ev(() => { const s = Seasons.season(); return { main: s.main && s.main.key, phase: s.main && s.main.phase, lvl: s.main && s.main.lvl, cls: document.documentElement.className }; });
      assert.equal(st.main, key, 'main season'); assert.equal(st.phase, phase, 'phase');
      assert(/ssw-l[123]/.test(st.cls), 'intensity class');
      await delay(1500); await tidy(); await delay(300);
      await ev(() => { document.querySelector('#browser').classList.remove('min'); IE.go('home'); document.querySelector('#page').scrollTop = 0; });
      await delay(900);
      const dom = await ev(() => ({
        strip: (document.querySelector('.ssw-strip marquee') || {}).textContent || '',
        news: (document.querySelector('.ssw-news .ssw-nt') || {}).textContent || '',
        badges: document.querySelectorAll('.badges88 .ssw-b88').length, tray: !!document.querySelector('#tray .ssw-tray'),
        sprites: document.querySelectorAll('.ssw-ban .ssw-spr').length, icon: getComputedStyle(document.documentElement).getPropertyValue('--ssw-ico').includes('data:'),
        animations: document.getAnimations().length,
      }));
      assert(dom.strip.length > 20 && !/undefined|NaN/.test(dom.strip), 'seasonal marquee: ' + dom.strip.slice(0, 80));
      if (md !== '12-31') assert(dom.news.length > 4 && !/undefined|NaN/.test(dom.news), 'news box title');
      assert.equal(dom.badges, 2, '88x31 buttons'); assert(dom.tray, 'tray icon'); assert(dom.icon, 'desktop icon decoration');
      assert(dom.animations < 140, 'animation count ' + dom.animations);
      const c = await contrast();
      for (const [k, v] of Object.entries(c)) assert(v >= 4.5, `contrast ${k} ${v.toFixed(2)} < 4.5`);
      await p.screenshot({ path: shots + label + '-mag.png' });
      await ev(() => { const e = document.querySelector('.ssw-news'), pg = document.querySelector('#page'); if (e) pg.scrollTop += e.getBoundingClientRect().top - pg.getBoundingClientRect().top - 40; });
      await delay(500); await p.screenshot({ path: shots + label + '-news.png' });
      await ev(() => document.querySelector('#browser').classList.add('min'));
      await delay(700); await tidy(); await delay(200);
      await p.screenshot({ path: shots + label + '-desk.png' });
      assert.deepEqual(errors, [], 'console errors');
      console.log(`   ${label}: lvl ${st.lvl}, ${dom.sprites} banner sprites, ${dom.animations} animations, contrast ${Object.entries(c).map(([k, v]) => k + ' ' + v.toFixed(1)).join(', ')}`);
    });
  }

  // ---- Halloween extras: other sites, the Plus! theme, the screen saver, sounds, the trail, the owner's clock, resting screens
  await check('halloween extras', async () => {
    errors.length = 0;
    await p.goto(`${base}/?date99=10-30&time=17:30:00`, { waitUntil: 'networkidle' });
    await until(() => !!(window.AccountGate?.allowed && window.DesktopSurface?.ready() && window.SeasonsWeb && document.querySelector('.ssw-ban')), 60000);
    await hideBalloons(); await delay(1500); await tidy();
    await ev(() => document.querySelector('#browser').classList.remove('min'));
    for (const [url, sel, name] of [['http://www.waaaghooo.find/', '.wg-logo .ssw-doodle', 'site-waaaghooo'], ['http://www.jackgle.find/', '.jg-logo .ssw-doodle', 'site-jackgle'], ['http://www.jsn.jnet/', '.ssw-sitebar', 'site-jsn'], ['http://www.pixelpost.jnet/', '.ssw-sitebar.ssw-pp', 'site-pixelpost'], ['http://www.davesplace.jnet/', '.ssw-dave', 'site-dave'], ['http://members.homepagez.webcom/~gubbinz/', '.ssw-hpz', 'site-homepagez']]) {
      await ev(u => IE.navigate(u), url);
      await until(s => !!document.querySelector('#s-secret ' + s), 15000, sel);
      await delay(400); await p.screenshot({ path: shots + 'halloween-' + name + '.png' });
    }
    // calm sites: nothing seasonal moves on the search engines
    await ev(u => IE.navigate(u), 'http://www.waaaghooo.find/'); await until(() => !!document.querySelector('.ssw-doodle'), 15000);
    assert.equal(await ev(() => [...document.querySelectorAll('#s-secret .ssw-spr')].filter(e => getComputedStyle(e).animationName !== 'none').length), 0, 'search engine decorations are still');
    await ev(() => IE.go('forums', 'click')); await until(() => !!document.querySelector('.ssw-forumbar'), 10000); await delay(800);
    await p.screenshot({ path: shots + 'halloween-forums.png' });
    await ev(() => IE.go('letters', 'click')); await delay(900);
    await ev(() => { const e = document.querySelector('.ssw-garland'), pg = document.querySelector('#page'); if (e) pg.scrollTop += e.getBoundingClientRect().top - pg.getBoundingClientRect().top - 200; });
    await delay(400); await p.screenshot({ path: shots + 'halloween-letters.png' });
    // sounds, trail, saver default
    const misc = await ev(() => ({ snd: Sound.variant && Sound.variant('startup'), shut: Sound.variant && Sound.variant('shutdown'), click: Sound.variant && Sound.variant('click'), trail: (SeasonsWeb.trail() || []).length, savers: Savers.list(), def: Savers.defaultName() }));
    assert.equal(misc.snd, 'startup_halloween'); assert.equal(misc.shut, 'shutdown_halloween'); assert.equal(misc.click, null);
    assert(misc.trail >= 2, 'FunCursor seasonal trail'); assert(misc.savers.includes('Haunted Hill (Halloween)'), 'saver listed'); assert.equal(misc.def, 'Haunted Hill (Halloween)', 'seasonal default saver');
    // the Plus! Seasons theme: the Desktop Themes window, then the theme on the desktop
    await ev(() => Apps.load('js/system-themes.js'));
    await until(() => !!window.SysThemes && !!window.SysPack?.P['system.themes']);
    await ev(() => { document.querySelector('#browser').classList.add('min'); SysPack.P['system.themes']('spooky'); });
    await delay(800);
    assert.equal(await ev(() => document.querySelector('.sys-th-sel').value), 'spooky', 'themes window preselects the seasonal theme');
    await p.screenshot({ path: shots + 'halloween-desktop-themes.png' });
    await ev(() => { const f = document.querySelector('.sys-thwin'); f.querySelector('[data-t=ok]').click(); });
    await delay(900); await tidy(); await delay(200);
    assert(await ev(() => document.body.classList.contains('sys-theme-spooky')), 'Spooky Halloween theme applied');
    await p.screenshot({ path: shots + 'halloween-desk-spooky-theme.png' });
    await ev(() => SysThemes.restore({ name: 'JackOS Standard', parts: {} }) || (window.SysThemes && SysThemes.apply && SysThemes.apply({ key: 'std', name: 'JackOS Standard' }, {}, true)));
    // the Halloween screen saver
    await ev(() => Savers.start('Haunted Hill (Halloween)'));
    await delay(2500); await p.screenshot({ path: shots + 'halloween-screensaver.png' });
    assert.equal(await ev(() => Savers.running), 'Haunted Hill (Halloween)');
    await ev(() => Savers.stop()); await delay(500);
    // nobody at the PC: the decorations rest (hs.css pauses everything on #monitorSurface)
    await ev(() => { document.querySelector('#browser').classList.remove('min'); IE.go('home'); });
    await delay(600);
    const paused = await ev(() => { document.documentElement.classList.add('hs-screen-idle'); const s = [...document.querySelectorAll('.ssw-ban .ssw-spr, .ssw-track')].map(e => getComputedStyle(e).animationPlayState); document.documentElement.classList.remove('hs-screen-idle'); return s; });
    assert(paused.length && paused.every(v => v.split(',').every(x => x.trim() === 'paused')), 'animations pause when the screen is unattended: ' + paused.join('|'));
    // the owner's clock / a jump changes the season live, without a reload
    await ev(() => Seasons.jump('xmas'));
    await until(() => document.documentElement.classList.contains('ssw-xmas') && !!document.querySelector('.ssw-ld-santahat'), 8000);
    await ev(() => Seasons.jump('halloween'));
    await until(() => document.documentElement.classList.contains('ssw-halloween') && !!document.querySelector('.ssw-ld-witchhat'), 8000);
    assert.deepEqual(errors, [], 'console errors');
  });

  // ---- a phone (portrait) still reads well
  await check('halloween on a phone', async () => {
    const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, storageState: await ctx.storageState(), userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' });
    const q = await ph.newPage(), errs = [];
    // The magazine at phone width: JackOS on its own (the player's per-device choice, js/pc-only.js) shows it full screen,
    // exactly as LOCK IN does in the phone's house; this keeps the check about the page, not the 3D room.
    await q.addInitScript(() => localStorage.setItem('jhp_device_view', 'jackos'));
    q.on('pageerror', e => errs.push(e.message));
    await q.goto(`${base}/?date99=10-31&time=14:00:00`, { waitUntil: 'networkidle' });
    for (let i = 0; i < 300; i++) { if (await q.evaluate(() => !!(window.AccountGate?.allowed && window.DesktopSurface?.ready() && document.querySelector('.ssw-ban'))).catch(() => false)) break; await delay(150); }
    await q.addStyleTag({ content: '.balloon,#toastWrap{display:none!important}' });
    await delay(2000);
    await q.evaluate(() => { document.querySelectorAll('.appwin [data-w=close]').forEach(b => b.click()); document.querySelector('#browser').classList.remove('min'); IE.go('home'); document.querySelector('#page').scrollTop = 0; });
    await delay(800); await q.screenshot({ path: shots + 'halloween-phone-mag.png' });
    const over = await q.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert(!over, 'no sideways scroll on a phone');
    assert.deepEqual(errs, [], 'phone errors');
    await ph.close();
  });
} catch (e) {
  results.push(['runner', false]); console.log('FAIL runner -', e.message);
} finally {
  if (browser) await browser.close().catch(() => {});
  await stop();
}
if (/mod failed to load|unhandled|fatal/i.test(log)) { results.push(['server log', false]); console.log('FAIL server log'); }
const passed = results.filter(r => r[1]).length;
console.log(`SUMMARY ${passed}/${results.length} passed; screenshots in tests/shots/seasons-web/`);
process.exit(passed === results.length ? 0 : 1);
