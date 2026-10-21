import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const p = await (await browser.newContext({ viewport: { width: 1366, height: 860 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.argv[2] + '/?noboot'); await p.waitForTimeout(6000);
await p.screenshot({ path: 'shots/fresh-1.png' });
await p.evaluate(() => Apps.run('software')); await p.waitForTimeout(2500); await p.screenshot({ path: 'shots/fresh-2.png' });
console.log(errs.join('\n') || 'no errors'); await browser.close();
