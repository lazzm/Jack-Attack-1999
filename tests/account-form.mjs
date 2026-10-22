// Static assets come only from 18464; every authentication/profile write goes to our own fresh server.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import net from 'node:net';
import {chromium} from 'playwright';

const here=dirname(fileURLToPath(import.meta.url)), app=join(here,'../app');
const WebSocket=createRequire(import.meta.url)('../app/node_modules/ws');
const frontend='http://localhost:18464';
const probe=net.createServer();
await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve)});
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const backend=`http://127.0.0.1:${port}`, wsUrl=backend.replace('http:','ws:')+'/ws';
const data=await mkdtemp(join(tmpdir(),'jack-account-form-'));
const child=spawn(process.execPath,['server.js'],{cwd:app,env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
let log='',browser,ip=10;
child.stdout.on('data',d=>{log+=d});child.stderr.on('data',d=>{log+=d});
const sockets=[];
const errors=[];
const pass='Throwaway-1999',existing='FormExisting';
const shots=join(here,'shots/account-form');
async function until(p,fn,timeout=30000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}
    await p.waitForTimeout(100);
  }
  console.error('TIMEOUT STATE',await p.evaluate(()=>({gate:document.querySelector('#accountGate')?.textContent,mode:window.House?.mode,busy:window.House?.busy,member:window.Net?.me.member,seat:sessionStorage.getItem('jhp_login_seat'),loading:!!document.querySelector('.hs-loading'),requests:window.authRequests?.map(({name,signup})=>({name,signup}))})));
  throw Error('Timeout: '+fn);
}
async function connect(token=''){
  const ws=new WebSocket(wsUrl,{origin:frontend,headers:{'x-forwarded-for':`192.0.2.${ip++}`}}),messages=[];
  sockets.push(ws);ws.on('message',d=>messages.push(JSON.parse(d)));
  await once(ws,'open');
  const get=async t=>{for(let i=0;i<200;i++){const n=messages.findIndex(m=>m.t===t);if(n>=0)return messages.splice(n,1)[0];await new Promise(r=>setTimeout(r,20))}throw Error('Missing '+t)};
  const send=m=>ws.send(JSON.stringify(m));
  send({t:'hello',cid:'account-form-'+ip,token});
  return {send,get,welcome:await get('welcome')};
}
async function newPage(width,height){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width===390});
  // Only redirect the real client's socket; keep its Net, roaming and gate code intact.
  await context.addInitScript(({wsUrl})=>{
    const Native=window.WebSocket;
    window.authRequests=JSON.parse(sessionStorage.getItem('accountFormRequests')||'[]');
    window.WebSocket=class extends Native{
      constructor(url,...args){super(new URL(url,location.href).pathname==='/ws'?wsUrl:url,...args)}
      send(data){try{const m=JSON.parse(data);if(m.t==='login'){window.authRequests.push({name:m.name,signup:m.signup});sessionStorage.setItem('accountFormRequests',JSON.stringify(window.authRequests))}}catch{}return super.send(data)}
    };
    localStorage.setItem('jhp_hs_gfx','"low"');
  },{wsUrl});
  const p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
  await p.goto(frontend,{waitUntil:'domcontentloaded'});
  await until(p,()=>window.Net?.connected&&Net.me.id&&!!document.querySelector('#accountGate form'));
  return {context,p};
}
async function fill(p,name,password=pass){await p.locator('#accountGate [name=name]').fill(name);await p.locator('#accountGate [name=password]').fill(password)}
async function submit(p){await p.locator('#accountGate [type=submit]').click()}
async function error(p,re){await until(p,()=>!document.querySelector('#accountGate [type=submit]')?.disabled);assert.match(await p.locator('.account-error').innerText(),re);assert.equal(await p.evaluate(()=>sessionStorage.getItem('jhp_login_seat')),null)}
async function seated(p){await until(p,()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='monitor'&&!sessionStorage.getItem('jhp_login_seat')&&!document.querySelector('.hs-loading'),90000)}
try{
  for(let i=0;i<150&&!log.includes('online at');i++){assert.equal(child.exitCode,null,'Test server exited: '+log);await new Promise(r=>setTimeout(r,20))}
  assert.match(log,/online at/);
  console.log(`OWN SERVER pid=${child.pid} port=${port} DATA_DIR=${data}`);
  const a=await connect();
  for(const signup of [false,undefined,null,'true',1]){
    a.send({t:'login',name:'NeverCreated',pass,...(signup===undefined?{}:{signup})});
    assert.match((await a.get('loginErr')).msg,/not found/);
  }
  a.send({t:'login',name:existing,pass,signup:true});
  const created=await a.get('loginOk');assert.equal(created.isNew,true);
  const b=await connect();
  b.send({t:'login',name:existing,pass});assert.equal((await b.get('loginOk')).isNew,false);
  const c=await connect(created.token);assert.equal(c.welcome.member,true);
  console.log('SOCKET PASS: false/omitted/null/string/number signup cannot create; explicit signup, legacy existing login and token resume work');

  await mkdir(shots,{recursive:true});
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
  const desktop=await newPage(1366,860),p=desktop.p;
  assert.equal(await p.locator('#accountGate h1').innerText(),'Log On to JackNet');
  assert.equal(await p.locator('[name=confirm]').count(),0);
  await p.keyboard.press('Escape');assert.equal(await p.locator('#accountGate form').count(),1);
  await p.screenshot({path:join(shots,'logon-desktop.png')});
  await fill(p,'NeverCreated');await submit(p);await error(p,/not found/);
  await p.screenshot({path:join(shots,'missing-desktop.png')});
  await fill(p,existing,'Wrong-password');await submit(p);await error(p,/wrong password/);
  assert.doesNotMatch(await p.locator('.account-error').innerText(),/taken|already a member|different name/i);
  await p.screenshot({path:join(shots,'wrong-password-desktop.png')});
  await p.locator('[data-switch]').click();
  assert.equal(await p.locator('[name=password]').getAttribute('autocomplete'),'new-password');
  await fill(p,existing);await p.locator('[name=confirm]').fill(pass);await submit(p);await error(p,/already taken/);
  await p.screenshot({path:join(shots,'duplicate-desktop.png')});
  await p.locator('[data-switch]').click();
  assert.equal(await p.locator('[name=password]').getAttribute('autocomplete'),'current-password');
  await fill(p,existing);await p.locator('[name=password]').press('Enter');await seated(p);
  assert.deepEqual(await p.evaluate(()=>authRequests.map(m=>m.signup)),[false,false,true,false]);
  await p.evaluate(()=>localStorage.setItem('jhp_account_form_probe','"preserved"'));
  assert.equal(await p.evaluate(()=>Roam.syncNow()),true);
  await p.reload({waitUntil:'domcontentloaded'});await seated(p);
  await p.keyboard.press('Backspace');await until(p,()=>House.mode==='walk');
  await p.reload({waitUntil:'domcontentloaded'});
  await until(p,()=>AccountGate.allowed&&House?.live&&!document.querySelector('.hs-loading'));
  assert.equal(await p.evaluate(()=>House.mode),'walk');
  await desktop.context.close();
  console.log('DESKTOP PASS: separate forms, missing/wrong/duplicate errors, Enter logon enters PC, seated/standing token refresh');

  const narrow=await newPage(390,844),n=narrow.p;
  await n.screenshot({path:join(shots,'logon-narrow.png')});
  await n.locator('[data-switch]').tap();await fill(n,'test');
  await n.locator('[name=confirm]').fill('Mismatch');await submit(n);await error(n,/do not match/);
  assert.equal(await n.evaluate(()=>window.authRequests?.length||0),0);
  await n.locator('[name=confirm]').fill(pass);
  await n.screenshot({path:join(shots,'create-narrow.png')});
  assert(await n.locator('.account-box').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
  // Two synchronous submits must produce just one explicit signup request.
  await n.locator('form.account-box').evaluate(f=>{f.requestSubmit();f.requestSubmit()});
  await seated(n);assert.deepEqual(await n.evaluate(()=>authRequests.map(m=>m.signup)),[true]);
  assert.equal(await n.evaluate(()=>localStorage.getItem('jhp_starter')),'1');
  assert.deepEqual(await n.evaluate(()=>PM.items().map(i=>i.id)),[]);
  assert.equal(await n.evaluate(()=>Room.owned('gb.blocks')),true);
  assert.equal(await n.evaluate(()=>Room.owned('n64.kart')),false);
  await narrow.context.close();
  console.log('NARROW PASS: touch mode switch, confirmation, visible form, duplicate-submit guard, explicit test signup enters PC with sparse starter');

  const fresh=await newPage(1366,860);
  await fill(fresh.p,existing);await submit(fresh.p);await seated(fresh.p);
  assert.equal(await fresh.p.evaluate(()=>localStorage.getItem('jhp_account_form_probe')),'"preserved"');
  await fresh.context.close();
  console.log('ROAM PASS: existing password and saved profile survive; logon on a fresh browser enters PC');
  assert.deepEqual(errors,[],'Browser warnings/errors');
}finally{
  if(browser)await browser.close();
  for(const ws of sockets)ws.terminate();
  const exited=child.exitCode!==null?Promise.resolve():once(child,'exit');
  if(child.exitCode===null)child.kill('SIGTERM');
  await exited;
  assert.doesNotMatch(log,/mod failed to load|save failed|FATAL/i);
  console.log('OWN SERVER STOPPED pid='+child.pid+'; no mod-load/save failures');
}
const saved=JSON.parse(await readFile(join(data,'state.json'),'utf8'));
assert.deepEqual(Object.keys(saved.members).sort(),['formexisting','test']);
assert.equal(saved.memberSeq,2);
console.log('PERSISTENCE PASS: exactly two explicitly created accounts; nonexistent-name logins never persisted an account');
console.log('SCREENSHOTS '+shots+'; zero browser warnings/errors');
