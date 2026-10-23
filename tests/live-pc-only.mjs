// Read-only deployed mobile JackOS entry check: no authentication or game actions.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2];assert(base,'Supply the deployed URL');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
try {
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const errors=[];let sockets=0;
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
  p.on('websocket',()=>sockets++);
  await p.goto(base,{waitUntil:'networkidle'});
  assert.equal(new URL(p.url()).pathname,'/');
  await p.locator('#accountGate form').waitFor();
  assert(await p.evaluate(()=>PCOnly.desktopOnly&&!House.ok));
  assert.equal(await p.locator('#boot,.hs-gl,.hs-gl2,.hs-ui,.pc-touch').count(),0);
  await p.reload({waitUntil:'networkidle'});
  await p.screenshot({path:'shots/live-mobile-jackos.png'});
  await p.setViewportSize({width:844,height:390});await p.screenshot({path:'shots/live-mobile-jackos-landscape.png'});assert(await p.evaluate(()=>PCOnly.desktopOnly&&!House.ok));assert.equal(await p.locator('#boot,.hs-gl,.hs-gl2,.hs-ui,.pc-touch').count(),0);
  assert(sockets>0);assert.deepEqual(errors,[]);
  console.log('LIVE MOBILE JACKOS PASS: mandatory logon/refresh; no room renderer/controls; zero errors/warnings');
} finally {await b.close()}
