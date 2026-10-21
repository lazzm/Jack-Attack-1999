import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const errs = [];
for (const [vp, tag] of [[{ width: 1366, height: 860 }, 'd'], [{ width: 390, height: 844 }, 'm']]) {
const p = await (await browser.newContext(tag==='m'?{ viewport: vp, isMobile:true, hasTouch:true }:{ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(tag + ' ' + e.message));
await p.goto(process.argv[2] + '/?noboot&allsoft'); await p.waitForTimeout(4000);
const steps = [['phone', () => Apps.run('mobile')], ['print', () => Family.printPage()], ['dazzle', () => IE.navigate('http://www.desktopdazzle.webcom/')], ['ring', () => IE.navigate('http://www.freepagez.w3b/')], ['toonz', () => IE.navigate('http://www.squigtoonz.toonz/')], ['nethood', () => Apps.open('nethood')], ['covercd', () => Apps.run('covercd')], ['squigshield', () => IE.navigate('http://www.squigshield.netz/')], ['graveyard', () => IE.navigate('http://www.grotchigraveyard.kidz/')]];
for (const [n, fn] of steps) { await p.evaluate(fn).catch(e => errs.push(tag + ' ' + n + ': ' + e.message)); await p.waitForTimeout(2200); await p.screenshot({ path: `shots/s3-${n}-${tag}.png` }); }
}
console.log(errs.join('\n') || 'no errors');
await browser.close();
