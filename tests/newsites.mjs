import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:18080';
const SITES = ['www.rupeehunt.jnet', 'www.oddjobz.jnet', 'www.netizenhof.jnet', 'www.sparklecardz.webcom', 'www.bragbuttons.webcom', 'www.chainwatch.webcom', 'www.coolsite.homepagez', 'www.whatson.jnet', 'www.whatson.jnet/text.html', 'www.millenniumvault.jnet', 'www.listeningparty.wubwub', 'www.bytepet.jnet', 'www.puzzleboard.cyb', 'www.rupeeshop.jnet', 'www.teefemporium.grot', 'www.jacktown.jnet', 'www.mypixelfarm.webcom', 'www.jackexchange.grot', 'www.jacklotto.grot', 'www.jackdownpark.grot', 'www.jacknetbank.webcom', 'www.lootlings.jnet', 'www.waaaghooo.find', 'www.jackgle.find'];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const errs = [], out = [];
for (const [w, h, tag] of [[1366, 860, 'd'], [390, 844, 'm']]) {
  const ctx = await b.newContext(tag === 'm' ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true } : { viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(`[${tag}] ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(`[${tag}] console ${m.text().slice(0, 160)}`); });
  await p.goto(BASE + '/?noboot&allsoft'); await p.waitForTimeout(4500);
  for (const s of SITES) {
    await p.evaluate(u => IE.navigate('http://' + u), s); await p.waitForTimeout(2200);
    const r = await p.evaluate(() => { const pg = document.getElementById('page'); const t = pg ? pg.innerText : ''; return { len: t.length, nf: /cannot find server|cannot be displayed/i.test(t), ov: pg ? pg.scrollWidth - pg.clientWidth : 0, addr: (document.getElementById('addrBar') || {}).value }; });
    out.push(`${tag} ${s.padEnd(28)} len=${r.len} ${r.nf ? 'NOTFOUND' : ''} ${r.ov > 4 ? 'OVERFLOW' + r.ov : ''} -> ${r.addr}`);
  }
  // programs added by the packs
  for (const id of Object.keys(await p.evaluate(() => Apps.apps)).filter(k => /grind|share|ev\.|events|leap|disk|chore|rank/i.test(k))) {
    await p.evaluate(i => { try { Apps.open(i); } catch (e) { console.error('open ' + i + ' ' + e.message); } }, id); await p.waitForTimeout(900);
    out.push(`${tag} app ${id}`);
    await p.evaluate(() => document.querySelectorAll('.appwin [data-w=close], .float .tb .ctl button:last-child').forEach(x => x.click()));
  }
  await ctx.close();
}
console.log(out.join('\n')); console.log('ERRORS', errs.length, errs.slice(0, 20));
await b.close();
