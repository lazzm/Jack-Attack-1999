// Read-only deployed-device policy check: no authentication or game actions.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2];assert(base,'Supply the deployed URL');
const b=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const errors=[];let sockets=0;
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
  p.on('websocket',()=>sockets++);
  await p.goto(base,{waitUntil:'networkidle'});
  assert.equal(new URL(p.url()).pathname,'/pc-required.html');
  assert.equal(await p.locator('h1').textContent(),'PC required');
  assert.equal(await p.locator('canvas,form,script').count(),0);
  assert(await p.locator('main').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
  await p.reload({waitUntil:'networkidle'});
  await p.screenshot({path:'shots/live-pc-required.png'});
  assert.equal(sockets,0);assert.deepEqual(errors,[]);
  console.log('LIVE PC-ONLY PASS: phone blocked before networking/logon/gameplay; refresh and 390x844 layout, zero errors/warnings');
} finally {await b.close()}
