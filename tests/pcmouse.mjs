import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1366, height: 860 } }); const e = []; p.on('pageerror', x => e.push(x.message));
await p.goto('http://localhost:18095/'); await p.waitForTimeout(6000);
await p.mouse.click(400, 400); await p.keyboard.press('w'); await p.waitForTimeout(500); // walk about in the room first
await p.evaluate(() => document.querySelector('#bootPower .powerbtn').click()); await p.waitForTimeout(16000);
await p.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(b => /guest/i.test(b.textContent) && b.offsetParent); if (bt) bt.click(); }); await p.waitForTimeout(8000);
await p.mouse.click(683, 300); await p.keyboard.press('w'); await p.waitForTimeout(600);
console.log('locked on desktop?', await p.evaluate(() => !!document.pointerLockElement), e); await b.close();
