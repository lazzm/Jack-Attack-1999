import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const errs = [];
for (const [vp, tag] of [[{ width: 1366, height: 860 }, 'd'], [{ width: 390, height: 844 }, 'm']]) {
const p = await (await browser.newContext(tag === 'm' ? { viewport: vp, isMobile: true, hasTouch: true } : { viewport: vp })).newPage(); p.on('pageerror', e => errs.push(tag + e.message));
await p.goto(process.argv[2] + '/?noboot&allsoft'); await p.waitForTimeout(4000);
for (const h of ['www.totality99.cyb', 'www.eurowatch.kidz', 'www.domewatch.jnet', 'www.popgossip.kidz', 'www.crazewatch.kidz', 'www.jackmillionaire.kidz', 'www.jackspacenews.cyb', 'www.sportsdesk.netz', 'www.popcorn99.cyb']) {
  await p.evaluate(u => IE.navigate(u), 'http://' + h + '/'); await p.waitForTimeout(1800); await p.screenshot({ path: `shots/n99-${tag}-${h.split('.')[1]}.png` });
}
await p.evaluate(() => IE.go('links', 'click')); await p.waitForTimeout(1500);
console.log(tag, '1999 links box:', await p.evaluate(() => /1999 LINKS/i.test(document.body.innerText)));
}
console.log(errs.join('\n') || 'no errors'); await browser.close();
