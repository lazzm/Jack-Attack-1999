import { chromium } from 'playwright';
const S='/tmp/claude-1000/-home-jackm/acf34d18-dce6-4034-9475-8fd25412d781/scratchpad/shots/';
const B = process.argv[2];
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const errs=[];
for (const [vp, tag] of [[{ width: 1366, height: 860 }, 'd'], [{ width: 390, height: 844 }, 'm']]) {
const p = await (await browser.newContext(tag==='m'?{ viewport: vp, isMobile:true, hasTouch:true }:{ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message));
await p.goto(B + '/?noboot'); await p.waitForTimeout(4000); await p.evaluate(() => document.querySelectorAll('.msgbox .btn').forEach(b=>b.click()));
for (const [what, fn] of [['comics', () => IE.go('comics', 'click')], ['ham', () => WebPack.go('hamstercam')], ['sheldon', () => WebPack.go('hz-sheldon')], ['starwars', () => IE.go('starwars', 'click')]]) {
  await p.evaluate(fn).catch(e => errs.push(what + ' ' + e.message)); await p.waitForTimeout(2500); await p.screenshot({ path: S + `art-${what}-${tag}.png` });
}
}
console.log(errs.join('\n')||'no errors');
await browser.close();
