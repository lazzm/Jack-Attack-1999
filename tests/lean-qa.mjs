import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:18300';
const sizes = [[1366,768],[1920,1080],[2560,1080],[390,844],[1366,860]].filter(([w,h])=>!process.argv[3] || process.argv[3]===`${w}x${h}`);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
const failures = [];
async function until(page, fn) {
  const end = Date.now()+40000;
  while(Date.now()<end) { if(await page.evaluate(fn)) return; await page.waitForTimeout(200); }
  throw new Error('State timeout: '+fn.toString());
}
try {
for (const [width,height] of sizes) {
  const mobile = width === 390, tag = `${width}x${height}`;
  const context = await browser.newContext({ viewport: {width,height}, ...(mobile ? { isMobile:true, hasTouch:true } : {}) });
  const page = await context.newPage(); const errors = [];
  page.setDefaultTimeout(90000); page.setDefaultNavigationTimeout(90000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (['error','warning'].includes(m.type()) && !/GPU stall|ReadPixels/.test(m.text())) errors.push(m.type()+': '+m.text()); });
  await page.addInitScript(() => { if (!localStorage.getItem('jhp_everbooted')) { localStorage.setItem('jhp_everbooted','1'); localStorage.setItem('jhp_last',String(Date.now())); localStorage.setItem('jhp_clean','1'); } });
  try {
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await until(page, () => window.House?.mode === 'monitor' && !!House.pcGL && document.querySelector('.hs-gl')?.clientWidth > 0);
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(()=>DesktopSurface.ready()), true);
    assert(await page.evaluate(()=>{const p=DesktopSurface.client(300,200),q=DesktopSurface.point(p.x,p.y);return Math.abs(q.x-300)<.01&&Math.abs(q.y-200)<.01}));
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.hs-ui')).display), 'none');
    const metrics = await page.evaluate(() => { const s=document.getElementById('monitorSurface'),r=s.getBoundingClientRect(); return {w:s.clientWidth,h:s.clientHeight,x:r.x,y:r.y,right:r.right,bottom:r.bottom,lock:!!document.pointerLockElement}; });
    assert.equal(metrics.w / metrics.h,4/3); assert.equal(metrics.lock,false);
    assert(metrics.x>=0 && metrics.y>=0 && metrics.right<=width && metrics.bottom<=height, JSON.stringify(metrics));
    await page.screenshot({path:`shots/lean-${tag}-seated.png`});
    // Exercise actual transformed hit testing and a maximised browser.
    await page.locator('#brMax').click();
    await page.locator('#startBtn').click();
    assert(await page.locator('#startMenu').evaluate(e => document.getElementById('monitorSurface').contains(e)));
    await page.screenshot({path:`shots/lean-${tag}-start.png`});
    await page.locator('#startBtn').click();
    await page.evaluate(() => { Apps.run('pinball'); Desk.toast('Screen check','This notification belongs inside the monitor.'); });
    await page.waitForTimeout(1000);
    await page.screenshot({path:`shots/lean-${tag}-game.png`});
    await page.evaluate(()=>document.querySelectorAll('.appwin [data-w=close]').forEach(b=>b.click()));
    await page.keyboard.press('F2');
    await until(page, ()=>House.stood && House.mode==='walk');
    assert.equal(await page.evaluate(()=>document.querySelector('.hs-gl').clientWidth),width);
    await page.waitForTimeout(300);
    await page.screenshot({path:`shots/lean-${tag}-standing.png`});
    if(width===1920 || width===2560) { assert.deepEqual(errors,[]); console.log('PASS',tag,'screen/menu/game/standing'); await context.close(); continue; }
    await page.reload({waitUntil:'domcontentloaded'});
    await until(page, ()=>window.House?.stood && House.mode==='walk');
    await page.screenshot({path:`shots/lean-${tag}-refresh-standing.png`});
    await page.evaluate(()=>House.sitDown());
    await until(page, ()=>House.mode==='monitor');
    await page.reload({waitUntil:'domcontentloaded'});
    await until(page, ()=>window.House?.mode==='monitor' && !!House.pcGL);
    await page.screenshot({path:`shots/lean-${tag}-refresh-seated.png`});
    if(mobile) { await page.setViewportSize({width:844,height:390}); await page.waitForTimeout(500); await page.screenshot({path:'shots/lean-phone-landscape.png'}); await page.setViewportSize({width,height}); }
    assert.equal(await page.evaluate(()=>!!document.pointerLockElement),false);
    assert.deepEqual(errors,[]);
    console.log('PASS',tag);
  } catch(e) { failures.push(tag+': '+e.stack); console.error('FAIL',tag,e.message); await page.screenshot({path:`shots/lean-${tag}-FAIL.png`}).catch(()=>{}); }
  await context.close();
}
} finally { await browser.close(); }
if(failures.length) { console.error(failures.join('\n')); process.exitCode=1; }
