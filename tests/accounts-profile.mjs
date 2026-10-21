import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18390';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const name='Profile'+Date.now().toString(36),pass='Temporary-1999',errors=[];
async function until(p,fn){for(let i=0;i<350;i++){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('State timeout '+fn)}
async function page(){const p=await b.newPage({viewport:{width:1366,height:860}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});await p.goto(base,{waitUntil:'domcontentloaded'});await until(p,()=>Net.connected&&!!Net.me.id);return p}
try{
 let p=await page();await p.locator('#accountGate [data-switch]').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.name),'name');await p.keyboard.press('Shift+Tab');assert(await p.locator('#accountGate [data-switch]').evaluate(el=>el===document.activeElement));await p.locator('#accountGate [data-switch]').click();await p.locator('[name=name]').fill(name);await p.locator('[name=password]').fill(pass);await p.locator('[name=confirm]').fill(pass);await p.locator('#accountGate [type=submit]').click();await until(p,()=>AccountGate.allowed&&Roam.owner===Net.me.nick);
 await p.evaluate(()=>localStorage.setItem('jhp_test_profile_marker','kept-from-first-browser'));
 let saved=false;for(let i=0;i<12;i++){if(await p.evaluate(()=>Roam.syncNow())){saved=true;break}await p.waitForTimeout(1000)}assert(saved,'Profile upload did not finish');await p.close();
 p=await page();await p.locator('[name=name]').fill(name);await p.locator('[name=password]').fill('wrong-password');await p.locator('#accountGate [type=submit]').click();await until(p,()=>!!document.querySelector('.account-error')?.textContent.includes('wrong password'));assert.equal(await p.evaluate(()=>Net.me.member),false);
 await p.locator('[name=password]').fill(pass);await p.locator('#accountGate [type=submit]').click();
 await until(p,()=>AccountGate.allowed||!!document.querySelector('#accountGate [data-u]'));
 if(await p.locator('#accountGate [data-u]').count()){await p.screenshot({path:'shots/accounts-profile-choice.png'});await p.locator('#accountGate [data-u]').click()}
 await until(p,()=>AccountGate.allowed&&localStorage.getItem('jhp_test_profile_marker')==='kept-from-first-browser');
 await until(p,()=>window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.screenshot({path:'shots/accounts-profile-restored.png'});
 if(await p.evaluate(()=>House.mode!=='monitor')){await p.evaluate(()=>House.act('pc.power'));await until(p,()=>House.mode==='monitor'&&document.body.classList.contains('online')&&!document.querySelector('.logon'))}
 await p.evaluate(()=>JackLogon.logoff());await Promise.all([p.waitForEvent('domcontentloaded'),p.getByRole('button',{name:'Yes',exact:true}).click()]);await until(p,()=>!Net.me.member&&!!document.querySelector('#accountGate form'));
 await p.keyboard.press('Escape');assert(await p.locator('#accountGate').isVisible());await p.screenshot({path:'shots/accounts-logged-off.png'});
 assert.deepEqual(errors,[]);console.log('ACCOUNT PROFILE PASS: wrong password, cross-browser saved profile, profile choice before PC boot, account logoff and no Escape bypass');await p.close();
}finally{await b.close()}
