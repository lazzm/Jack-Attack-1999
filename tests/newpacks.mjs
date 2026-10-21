import { chromium } from 'playwright';
const U = process.argv[2] || 'http://localhost:18082';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w, h] of [[1366, 860], [390, 844]]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
  pg.on('pageerror', e => errs.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('CON ' + m.text().slice(0, 160)); });
  await pg.goto(U + '/?noboot'); await pg.waitForTimeout(4000);
  await pg.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(b => /guest/i.test(b.textContent) && b.offsetParent); if (bt) bt.click(); }); await pg.waitForTimeout(5000);
  const out = {};
  out.cast = await pg.evaluate(() => window.Cast ? [Cast.n('sister'), Cast.n('cousin'), Cast.n('cat'), Cast.n('teacher')] : null);
  for (const u of ['http://www.jackmud.jnet/', 'http://www.jackmud.jnet/play.html', 'http://www.jackworld.jnet/', 'http://www.jackworld.jnet/catalogue.html', 'http://www.greathunt.jnet/', 'http://www.cardkorner.kidz/', 'http://www.jackattack.jnet/backissues']) {
    await pg.evaluate(u => IE.navigate(u), u); await pg.waitForTimeout(2500);
    out[u.replace('http://www.', '').slice(0, 28)] = await pg.evaluate(() => (document.querySelector('#page') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 70));
  }
  out.telnet = await pg.evaluate(() => { try { return String(Apps.run('telnet')); } catch (e) { return 'ERR ' + e.message; } }); await pg.waitForTimeout(2500);
  out.wins = await pg.evaluate(() => [...document.querySelectorAll('.appwin')].map(e => e.getAttribute('aria-label')));
  out.secretsWin = await pg.evaluate(() => { try { return String(Apps.run('secrets')); } catch (e) { return 'ERR ' + e.message; } }); await pg.waitForTimeout(1500);
  console.log(w, JSON.stringify(out, null, 1)); console.log(w, 'errors', errs.length ? errs : 'none');
  await pg.close();
}
await b.close();
