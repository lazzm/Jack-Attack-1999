// Disposable local server only. Exercises the real account gate and roaming lifecycle.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url)), shots=root+'tests/shots/identity/';
const data=await mkdtemp('/tmp/jhp-identity-'), pass='Throwaway-1999';
let server,browser,log='';const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){for(let port=18080;port<=18099;port++){const s=net.createServer();try{await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(port,resolve)});await new Promise(r=>s.close(r));return port}catch{}}throw Error('No test port')}
const port=await freePort(), base='http://127.0.0.1:'+port;
async function until(page,fn){
  const end=Date.now()+45000;
  while(Date.now()<end){try{if(await page.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await delay(100)}
  throw Error('Timed out: '+String(fn)+' '+JSON.stringify(await page.evaluate(()=>({gate:document.querySelector('#accountGate')?.textContent,identity:Net.me.identity,who:localStorage.getItem('jhp_roam_who')}))));
}
async function ready(page){await until(page,()=>window.Net?.connected&&Net.me.id)}
async function allowed(page){await until(page,()=>window.AccountGate?.allowed)}
async function register(name){const r=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass})});assert(r.ok)}
async function credentials(page,name,signup){
  await page.addInitScript(()=>localStorage.setItem('jhp_hs_gfx',JSON.stringify('low')));
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  if(signup)await page.locator('[data-switch]').click();
  await page.locator('[name=name]').fill(name);await page.locator('[name=password]').fill(pass);
  if(signup)await page.locator('[name=confirm]').fill(pass);
  await page.locator('#accountGate [type=submit]').click();
}
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000)}
async function reply(page,packet,type){return page.evaluate(({packet,type})=>new Promise(resolve=>{Net.on(type,resolve);Net.send(packet)}),{packet,type})}
async function identity(page){return page.evaluate(()=>({first:Cast.me().first,g:Cast.me().g,family:['sister','mate1','mate2','mate3','mate4'].map(Cast.n),online:['jack','dave','luke','callum','jackk','jsister'].map(Cast.n)}))}
try{
  await mkdir(shots,{recursive:true});
  server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
  let started=false;for(let i=0;i<100;i++){assert(server.exitCode===null,'Server exited: '+log);if(log.includes('online at :'+port)){assert((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok);started=true;break}await delay(100)}assert(started,'Server failed: '+log);
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
  const desktop=await browser.newContext({viewport:{width:1366,height:860}}), page=await desktop.newPage();observe(page);
  await credentials(page,'IdentityGirl',true);
  await page.locator('#accountFirst').waitFor();
  assert.match(await page.locator('#accountFirst').inputValue(),/^[A-Z][a-z]+$/);
  await page.locator('[name=gender][value=f]').check();await page.locator('[data-roll]').click();
  await page.locator('#accountFirst').fill('sarah');
  await page.locator('[data-back]').click();assert.equal(await page.locator('[name=name]').inputValue(),'IdentityGirl');
  assert.equal(await page.locator('[name=confirm]').inputValue(),pass);
  await page.locator('#accountGate [type=submit]').click();assert.equal(await page.locator('#accountFirst').inputValue(),'sarah');
  assert(await page.locator('[name=gender][value=f]').isChecked());assert.equal(await page.evaluate(()=>!!Net.me.member),false);
  await page.keyboard.press('Tab');
  await page.screenshot({path:shots+'desktop-signup.png'});
  await page.setViewportSize({width:1024,height:768});await page.screenshot({path:shots+'desktop-small-signup.png'});
  await page.setViewportSize({width:1366,height:860});
  await page.keyboard.press('Escape');assert(await page.locator('#accountFirst').isVisible());
  await page.locator('#accountGate [type=submit]').dblclick();await allowed(page);
  const fresh=await identity(page);assert.equal(fresh.first,'Sarah');assert.equal(fresh.g,'f');assert.notEqual(fresh.family[0],'Crystal');
  assert.deepEqual(fresh.online,['Jack','Dave','Luke','Callum','JackK','Crystal']);
  await page.reload({waitUntil:'domcontentloaded'});await allowed(page);assert.deepEqual(await identity(page),fresh);
  assert.equal(await page.locator('#accountFirst').count(),0);
  const invalid=await reply(page,{t:'meSet',me:{first:'Cunts',g:'f'}},'meErr');assert.match(invalid.msg,/clean/);
  const valid=await reply(page,{t:'meSet',me:{first:'sarah',g:'f'}},'meOk');assert.deepEqual(valid.me,{first:'Sarah',g:'f',v:1});
  for(let i=0;i<2;i++)await reply(page,{t:'meSet',me:{first:'Sarah',g:'f'}},'meOk');
  const limited=await reply(page,{t:'meSet',me:{first:'Sarah',g:'f'}},'meErr');assert.match(limited.msg,/wait/);
  console.log('PASS signup, girl pronouns, refresh, validation and packet rate limit');await desktop.close();
  // A second browser has no shared local storage: the house cast still matches.
  const elsewhere=await browser.newContext({viewport:{width:1024,height:768}}), other=await elsewhere.newPage();observe(other);
  await credentials(other,'IdentityGirl',false);await allowed(other);assert.deepEqual(await identity(other),fresh);await elsewhere.close();
  await register('IdentityOld');
  const legacy=await browser.newContext({viewport:{width:1366,height:860}}), old=await legacy.newPage();observe(old);
  await credentials(old,'IdentityOld',false);await old.locator('#accountFirst').waitFor();
  assert.equal(await old.evaluate(()=>AccountGate.allowed),false);
  await old.locator('#accountFirst').fill('Anne-Marie');await old.locator('[name=gender][value=f]').check();
  await old.locator('#accountFirst').focus();await old.keyboard.press('Enter');await allowed(old);
  for(let i=0;i<2;i++){await old.reload({waitUntil:'domcontentloaded'});await allowed(old);assert.equal(await old.locator('#accountFirst').count(),0);assert.equal((await identity(old)).first,'Anne-Marie')}
  console.log('PASS existing account asked once, keyboard submit and repeated refresh');await legacy.close();
  await register('Jack');
  const owned=await browser.newContext({viewport:{width:1366,height:860}}), jack=await owned.newPage();observe(jack);
  await jack.addInitScript(()=>{window.identityPrompts=0;new MutationObserver(()=>{if(document.querySelector('#accountFirst'))window.identityPrompts++}).observe(document,{childList:true,subtree:true})});
  await credentials(jack,'Jack',false);await allowed(jack);
  assert.deepEqual((await identity(jack)).family,['Crystal','Dave','Luke','Callum','JackK']);
  assert.equal((await identity(jack)).first,'Jack');assert.equal(await jack.evaluate(()=>identityPrompts),0);
  assert.match((await reply(jack,{t:'meSet',me:{first:'Alice',g:'f'}},'meErr')).msg,/fixed/);
  await jack.reload({waitUntil:'domcontentloaded'});await allowed(jack);assert.equal((await identity(jack)).first,'Jack');
  console.log('PASS owner never asked, real cast and immutable identity');await owned.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}), phone=await mobile.newPage();observe(phone);/* JackOS on a phone: the player's per-device JackOS-only choice (js/pc-only.js; the house is the default since 2026-10-26) */await mobile.addInitScript(()=>localStorage.setItem('jhp_device_view','jackos'));
  await credentials(phone,'IdentityMobile',true);await phone.locator('#accountFirst').waitFor();
  await phone.locator('[name=gender][value=f]').tap();await phone.locator('#accountFirst').fill('Laura');await phone.locator('h1').tap();
  await phone.screenshot({path:shots+'mobile-signup.png'});
  assert(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(await phone.locator('[name=gender]').first().evaluate(el=>[el.offsetWidth,el.offsetHeight]),[16,16]);
  await phone.setViewportSize({width:844,height:390});
  assert(await phone.locator('.account-box').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'Landscape crops the identity dialog');
  await phone.screenshot({path:shots+'mobile-landscape-signup.png'});
  await phone.setViewportSize({width:390,height:460});await phone.locator('#accountGate [type=submit]').scrollIntoViewIfNeeded();
  assert(await phone.locator('#accountGate [type=submit]').isVisible());
  await phone.setViewportSize({width:390,height:844});
  await phone.locator('#accountGate [type=submit]').tap();await allowed(phone);
  assert.equal((await identity(phone)).first,'Laura');assert.equal((await identity(phone)).g,'f');
  assert(await phone.evaluate(()=>PCOnly.desktopOnly&&!window.House?.ren));
  await until(phone,()=>window.MobileDesktop&&window.DesktopSurface?.ready()&&!document.querySelector('#throbber.busy'));
  await phone.screenshot({path:shots+'mobile-jackos.png'});
  await phone.setViewportSize({width:844,height:390});await phone.reload({waitUntil:'domcontentloaded'});await allowed(phone);
  assert.equal((await identity(phone)).first,'Laura');assert(await phone.evaluate(()=>PCOnly.desktopOnly&&!window.House?.ren));
  await until(phone,()=>window.MobileDesktop&&window.DesktopSurface?.ready()&&!document.querySelector('#throbber.busy'));
  await phone.screenshot({path:shots+'mobile-landscape.png'});
  console.log('PASS mobile touch signup, JackOS only, landscape and refresh');
  assert.deepEqual(errors,[],'Browser errors/warnings');assert(!/mod failed to load/i.test(log),log);
  console.log('PASS no browser errors or warnings; no failed server mods');
}finally{
  if(browser)await browser.close();
  if(server?.pid&&server.exitCode===null){const ended=once(server,'exit');server.kill('SIGTERM');await ended}
  await rm(data,{recursive:true,force:true});
}
