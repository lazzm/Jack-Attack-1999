// Stranger journey on disposable localhost data. Never record credentials or token values.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium,devices} from 'playwright';
import {fixtureRaster} from './room-fixture.mjs';
// The game uses late-loaded fonts inside many unrelated programs. Capture the current
// visible frame rather than waiting for every hidden program's document.fonts.ready.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.argv[2],tag=process.argv[3]||'after';
const extrasOnly=process.argv.includes('--extras-only'),journeyOnly=process.argv.includes('--journey-only'),skipExtras=process.argv.includes('--skip-extras'),identityOnly=process.argv.includes('--identity-only'),fallbackOnly=process.argv.includes('--fallback-only');
const selected=process.argv.find(a=>a.startsWith('--devices='))?.slice(10).split(',');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL(`shots/signup/${tag}/`,import.meta.url);await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
// Keep diagnostic raster setup identical for every context, including reopen/fallback checks.
const context=browser.newContext.bind(browser);
browser.newContext=async (...options)=>{const ctx=await context(...options);
 await fixtureRaster(ctx,Number(process.env.SIGNUP_RASTER));
 return ctx;
};
const results=[];
process.on('SIGTERM',()=>void browser.close().finally(()=>process.exit(1)));


async function until(p,fn,ms=90000){const end=Date.now()+ms;while(Date.now()<end){try{if(await p.evaluate(fn))return;}catch(e){if(!/context was destroyed/.test(e.message))throw e;}await p.waitForTimeout(100);}throw Error('Timeout '+fn+' '+JSON.stringify(await p.evaluate(()=>({gate:document.querySelector('#accountGate h1')?.textContent,status:document.querySelector('.account-error')?.textContent,mode:window.House?.mode,member:!!window.Net?.me.member,loading:!!document.querySelector('.hs-loading,#houseEntry')}))));}
try{for(const phone of [false,true]){
 if(extrasOnly||fallbackOnly||selected&&!selected.includes(phone?'phone':'desktop'))continue;
 const mode=phone?'phone':'desktop',ctx=await browser.newContext(phone?{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1366,height:860}}),p=await ctx.newPage();

 await p.addInitScript(()=>{localStorage.setItem('jhp_hs_gfx',JSON.stringify('low'));localStorage.setItem('jhp_touch_slow_asked','true');});
 if(tag==='before')for(const [asset,file,type]of [['js/account-gate.js','account-gate.js','application/javascript'],['css/hs.css','hs.css','text/css'],['js/hs-pause.js','hs-pause.js','application/javascript'],['js/boot-early.js','boot-early.js','application/javascript'],['js/hs-world.js','hs-world.js','application/javascript'],['js/rm-room.js','rm-room.js','application/javascript']])await p.route('**/'+asset+'*',async route=>route.fulfill({body:execFileSync('git',['show','2040234d249f2be56f8a9a4f5bb18f6950a71201:app/public/'+asset],{encoding:'utf8',maxBuffer:2**23}),contentType:type}));
 const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels|GL Driver/.test(m.text()))errors.push(m.text());});
 p.setDefaultTimeout(30000);p.setDefaultNavigationTimeout(90000);
 const r={mode,steps:[],errors,requiredTypedFields:tag==='before'?3:2,optionalCharacterChoices:2,rasterCap:process.env.SIGNUP_RASTER||'native'};results.push(r);let actions=0,captureMs=0;
 const shot=async n=>{console.log('Capture',mode,n);const captureStart=Date.now();await p.screenshot({path:new URL(`${mode}-${n}.png`,dir).pathname,timeout:90000});captureMs+=Date.now()-captureStart;r.steps.push({step:n,playSeconds:+((Date.now()-start-captureMs)/1000).toFixed(2),seconds:+((Date.now()-start)/1000).toFixed(2),actions});await writeFile(new URL('results.json',dir),JSON.stringify(results,null,2));};
 const press=async s=>{actions++;if(phone)await p.locator(s).tap();else await p.locator(s).click();};
 const type=async(s,v)=>{await press(s);await p.locator(s).pressSequentially(v,{delay:45});console.log('Typed',mode,s);};
 const name=(phone?'Phone':'Desk')+Date.now().toString(36),password='Disposable-Only-1999';
 let start=Date.now();await p.goto(base,{waitUntil:'domcontentloaded'});await until(p,()=>!!document.querySelector('#accountGate form')&&!!window.Net?.me.id);assert.equal(await p.title(),'Jack Attack 1999');assert.equal(await p.locator('[name=name]').getAttribute('autocomplete'),'username');assert.equal(await p.locator('[name=password]').getAttribute('autocomplete'),tag==='before'?'current-password':'new-password');if(phone&&tag!=='before')assert(await p.locator('[name=password]').evaluate(el=>el.getBoundingClientRect().height>=44&&parseFloat(getComputedStyle(el).fontSize)>=16));await p.keyboard.press('Escape');assert.equal(await p.locator('#accountGate [data-g],#accountGate [data-c]').count(),0);assert(await p.locator('#accountGate form').isVisible());await shot('01-first');
 if(!await p.locator('.account-character').count())await press('#accountGate [data-switch]');await shot('02-signup');
 await type('#accountGate [name=name]',name);await type('#accountGate [name=password]',password);
 if(await p.locator('#accountGate [name=confirm]').count())await type('#accountGate [name=confirm]',password);
 if(tag==='before'){await press('#accountGate [type=submit]');await until(p,()=>!!document.querySelector('#accountFirst'));await shot('03-about-you');}else{await press('.account-character summary');await shot('03-about-you');await press('.account-character summary');actions-=2;}
 r.fields=r.requiredTypedFields+2;await press('#accountGate [type=submit]');await shot('04-loading');
 await until(p,()=>!!window.AccountGate?.allowed&&!!window.House?.live&&!House.busy&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await p.evaluate(()=>House.mode),'walk');r.secondsToHouse=+((Date.now()-start-captureMs)/1000).toFixed(2);await shot('05-bedroom');r.actionsToHouse=actions;
 const walkedFrom=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));
 if(phone){const cdp=await ctx.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:75,y:684,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:75,y:640,id:1}]});await p.waitForTimeout(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await p.keyboard.down('w');await p.waitForTimeout(700);await p.keyboard.up('w');}
 await until(p,()=>House.mode==='walk');const walkedTo=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));assert(Math.hypot(walkedTo.x-walkedFrom.x,walkedTo.z-walkedFrom.z)>1,'Real movement input must move the player');
 r.secondsToWalking=+((Date.now()-start-captureMs)/1000).toFixed(2);await shot('06-walking');r.captureSeconds=+(captureMs/1000).toFixed(2);r.movementInput=phone?'real touch stick':'W key';
 if(journeyOnly||identityOnly){
  if(identityOnly){if(phone)await press('.ht-menu');else await p.keyboard.press('Escape');await press('[data-pause=identity]');await until(p,()=>!!document.querySelector('.account-identity')&&!document.pointerLockElement);await p.locator('#accountFirst').fill('Sarah');if(phone)await press('[name=gender][value=f]');else await p.locator('[name=gender][value=f]').check();await shot('10b-character-settings');await press('#accountGate [type=submit]');await until(p,()=>!!window.AccountGate?.allowed&&Cast.me().first==='Sarah'&&Cast.me().g==='f');r.characterChange=true;}
  await ctx.close();continue;
 }
 // Real game menu -> Log off; the UI owns flushing and token revocation.
 if(phone)await press('.ht-menu');else await p.keyboard.press('Escape');
 await press('[data-pause=logout]');await Promise.all([p.waitForEvent('domcontentloaded',{timeout:90000}),press('[data-pause=confirmLogout]')]);
 await until(p,()=>!!document.querySelector('#accountGate [name=password]')&&Net.connected&&!!Net.me.id&&!Net.me.member);if(tag!=='before')assert.equal(await p.locator('#accountGate form').getAttribute('data-mode'),'login','Confirmed logout must open Log On');await shot('07-logged-out');
 if(tag!=='before'){
  await type('#accountGate [name=name]','<img>');await type('#accountGate [name=password]',password);await press('#accountGate [type=submit]');await until(p,()=>document.querySelector('[name=name]')?.getAttribute('aria-invalid')==='true');assert.equal(await p.locator('#nameError img').count(),0);await shot('07b-invalid-name');
  await p.locator('#accountGate [name=name]').fill(name);await p.locator('#accountGate [name=password]').fill('');await type('#accountGate [name=password]','abc');await press('#accountGate [type=submit]');await until(p,()=>document.querySelector('[name=password]')?.getAttribute('aria-invalid')==='true');await shot('07c-short-password');
  await press('[data-show]');assert.equal(await p.locator('[name=password]').getAttribute('type'),'text');await press('[data-show]');assert.equal(await p.locator('[name=password]').getAttribute('type'),'password');
  await p.locator('#accountGate [name=name]').fill('');await p.locator('#accountGate [name=password]').fill('');
 }
 
 await type('#accountGate [name=name]',name);await type('#accountGate [name=password]','Wrong-Password');await press('#accountGate [type=submit]');await until(p,()=>/wrong password/i.test(document.querySelector('.account-error')?.textContent||''));assert.equal(await p.locator('#accountGate [name=name]').inputValue(),name);assert.equal(await p.locator('#accountGate [name=password]').inputValue(),'Wrong-Password');await shot('08-wrong-password');
 if(await p.locator('.account-recovery summary').count())await press('.account-recovery summary');await shot('08b-forgotten-password');
 await press('#accountGate [data-switch]');await p.locator('#accountGate [name=name]').fill('');await type('#accountGate [name=name]',name);await type('#accountGate [name=password]',password);
 if(tag==='before'){await type('#accountGate [name=confirm]',password);await press('#accountGate [type=submit]');await until(p,()=>!!document.querySelector('#accountFirst'));}
 await press('#accountGate [type=submit]');await until(p,()=>/already taken/.test(document.querySelector('.account-error')?.textContent||''));await shot('08c-taken-name');
 if(tag!=='before'){assert.equal(await p.locator('#accountGate [name=password]').inputValue(),password);assert(await p.locator('[data-suggestion]').isVisible());await press('[data-suggestion]');assert.notEqual(await p.locator('#accountGate [name=name]').inputValue(),name);}
 if(tag==='before')await press('#accountGate [data-back]');
 await press('#accountGate [data-switch]');await p.locator('#accountGate [name=name]').fill('');await type('#accountGate [name=name]',name);
 
 await p.locator('#accountGate [name=password]').fill('');await type('#accountGate [name=password]',password);if(phone)await press('#accountGate [type=submit]');else{actions++;await p.locator('#accountGate [name=password]').press('Enter');}await until(p,()=>!!window.AccountGate?.allowed&&!document.querySelector('.hs-loading,#houseEntry'));await shot('09-logon');
 const resumeMode=await p.evaluate(()=>House.mode),resumePower=await p.evaluate(()=>localStorage.getItem('jhp_off'));await p.reload({waitUntil:'domcontentloaded'});await until(p,()=>!!window.AccountGate?.allowed&&!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>House.mode),resumeMode);assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),resumePower);await shot('10-refresh');
 if(tag!=='before'){
  if(phone)await press('.ht-menu');else await p.keyboard.press('Escape');await press('[data-pause=identity]');await until(p,()=>!!document.querySelector('.account-identity'));
  await p.locator('#accountFirst').fill('Sarah');await p.locator('[name=gender][value=f]').check();await shot('10b-character-settings');await press('#accountGate [type=submit]');await until(p,()=>!!window.AccountGate?.allowed&&Cast.me().first==='Sarah'&&Cast.me().g==='f');assert.equal(await p.evaluate(()=>House.mode),resumeMode);assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),resumePower);r.characterChange=true;
 }
 
 // Model returning a day later without expiring the server token or changing production clocks.
 await p.evaluate(()=>localStorage.setItem('jhp_last',String(Date.now()-24*3600*1000)));
 const storage=await ctx.storageState();await ctx.close();
 const back=await browser.newContext({...phone?{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1366,height:860}},storageState:storage});const q=await back.newPage();await q.goto(base,{waitUntil:'domcontentloaded'});await until(q,()=>!!window.AccountGate?.allowed&&!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await q.screenshot({path:new URL(`${mode}-11-return.png`,dir).pathname});await back.close();
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',dir),JSON.stringify(results,null,2));console.log(JSON.stringify(r));

 }
 // Deliberately delayed game file: the first paint must explain the wait.
 for(const phone of (skipExtras||journeyOnly||identityOnly||fallbackOnly?[]:[false,true])){
  const mode=phone?'phone':'desktop',ctx=await browser.newContext(phone?{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1366,height:860}}),p=await ctx.newPage();
  if(tag==='before')for(const asset of ['js/account-gate.js','js/hs-world.js','js/hs-pause.js','js/boot-early.js','js/rm-room.js','css/hs.css'])await p.route('**/'+asset+'*',route=>route.fulfill({body:execFileSync('git',['show','2040234d249f2be56f8a9a4f5bb18f6950a71201:app/public/'+asset],{encoding:'utf8',maxBuffer:2**23}),contentType:asset.endsWith('.css')?'text/css':'application/javascript'}));
  await p.route('**/js/cast.js*',async route=>{await new Promise(r=>setTimeout(r,8000));await route.continue();});
  await p.goto(base,{waitUntil:'commit'});await p.locator('#houseEntry').waitFor({state:'visible',timeout:60000});await p.screenshot({path:new URL(`${mode}-12-slow-loading.png`,dir).pathname});await until(p,()=>!!window.Net?.me.id&&!!document.querySelector('#accountGate form'));
  if(!await p.locator('.account-character').count()&&tag!=='before')await p.locator('[data-switch]').click();
  await p.locator('[name=name]').pressSequentially('ConnectionCheck',{delay:45});await p.locator('[name=password]').pressSequentially('Not-Saved-1999',{delay:45});
  await p.evaluate(()=>Net.setOffline(true));await until(p,()=>!Net.connected);await p.waitForTimeout(300);await p.screenshot({path:new URL(`${mode}-13-connection-lost.png`,dir).pathname});
  const retained=await p.locator('[name=name]').inputValue()==='ConnectionCheck'&&await p.locator('[name=password]').inputValue()==='Not-Saved-1999';
  if(tag!=='before')assert(retained,'Reconnect must keep unfinished credentials');
  await p.evaluate(()=>Net.setOffline(false));await until(p,()=>!!window.Net?.connected&&!!Net.me.id);await p.waitForTimeout(400);if(tag!=='before'){assert.equal(await p.locator('[name=name]').inputValue(),'ConnectionCheck');assert.equal(await p.locator('[name=password]').inputValue(),'Not-Saved-1999');}
  if(tag!=='before'){
   await p.locator('[name=password]').focus();await p.setViewportSize(phone?{width:390,height:390}:{width:1366,height:420});await p.screenshot({path:new URL(`${mode}-14-short-viewport.png`,dir).pathname});assert(await p.locator('[name=password]').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=(window.visualViewport?.height||innerHeight);}));
   if(phone){await p.setViewportSize({width:844,height:390});await p.screenshot({path:new URL(`${mode}-15-landscape.png`,dir).pathname});}
  }
  results.push({mode:mode+'-connection',detailsRetained:retained,delaySeconds:8});await ctx.close();
 }
 if(tag!=='before'&&!journeyOnly&&!identityOnly){
  for(const phone of [false,true]){
   const ctx=await browser.newContext(phone?{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1366,height:860}});
   await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
   const p=await ctx.newPage();p.setDefaultTimeout(60000);await p.goto(base,{waitUntil:'domcontentloaded'});await until(p,()=>!!window.Net?.me.id&&!!document.querySelector('#accountGate form'));
   await p.locator('[name=name]').pressSequentially((phone?'Fallback':'NoGL')+Date.now().toString(36),{delay:45});await p.locator('[name=password]').pressSequentially('Graphics-Only-1999',{delay:45});if(phone)await p.locator('#accountGate [type=submit]').tap();else await p.locator('#accountGate [type=submit]').click();await until(p,()=>!!window.AccountGate?.allowed);
   if(!phone){assert.match(await p.locator('#houseEntry').innerText(),/3D GRAPHICS UNAVAILABLE/);assert(await p.locator('#houseEntry button').isVisible());}
   else{assert(await p.evaluate(()=>PCOnly.desktopOnly&&!House.live));await p.evaluate(()=>Community.editProfile());await p.locator('[data-character]').waitFor({state:'visible'});await p.locator('[data-character]').tap();await p.locator('#accountFirst').fill('Sarah');await p.locator('[name=gender][value=f]').tap();await p.locator('#accountGate [type=submit]').tap();await until(p,()=>!!window.AccountGate?.allowed&&Cast.me().first==='Sarah'&&Cast.me().g==='f');}
   await p.screenshot({path:new URL((phone?'phone':'desktop')+'-17-no-webgl.png',dir).pathname,timeout:90000});results.push({case:phone?'phone-fallback-character':'desktop-no-webgl',ok:true});await ctx.close();
  }
 }
 if(tag!=='before'&&process.env.SIGNUP_LEGACY==='1'){
  const ctx=await browser.newContext({viewport:{width:1366,height:860}}),p=await ctx.newPage();await p.goto(base,{waitUntil:'domcontentloaded'});await until(p,()=>!!window.Net?.me.id&&!!document.querySelector('#accountGate form'));
  if(await p.locator('.account-character').count())await p.locator('[data-switch]').click();await p.locator('[name=name]').pressSequentially('OldCodePlayer',{delay:45});await p.locator('[name=password]').pressSequentially('Old-Code-Only-1999',{delay:45});await p.locator('[name=password]').press('Enter');await until(p,()=>!!window.AccountGate?.allowed||!!document.querySelector('.account-identity'));
  if(await p.locator('.account-identity').count())await p.locator('#accountGate [type=submit]').click();await until(p,()=>!!window.AccountGate?.allowed&&!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(()=>Net.me.nick),'OldCodePlayer');await p.screenshot({path:new URL('desktop-16-old-code-account.png',dir).pathname});results.push({case:'old-code-account',login:true});await ctx.close();
 }
}finally{await writeFile(new URL('results.json',dir),JSON.stringify(results,null,2));await browser.close();}
