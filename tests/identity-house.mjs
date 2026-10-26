// House text regression: disposable accounts/data and the existing isolated credit fixture only.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url)), shots=root+'tests/shots/identity-house/';
const selection=process.argv.find(a=>a.startsWith('--case='))?.slice(7)||'all';
assert(['all','sarah','nonowner','owner'].includes(selection));
// Release each software-WebGL renderer completely before building the next house.
if(selection==='all'){
 for(const id of ['sarah','nonowner','owner']){
  const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'--case='+id],{stdio:'inherit'});
  const [code,signal]=await once(child,'exit');assert.equal(code,0,id+' failed'+(signal?' ('+signal+')':''));
 }
 console.log('IDENTITY HOUSE PASS: Sarah, non-owner Jack and owner Jack');process.exit(0);
}
const data=await mkdtemp('/tmp/jhp-identity-house-'), password='Throwaway-1999';
let server,browser,log='';const errors=[];let sarah;
const chosen=id=>selection==='all'||selection===id;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){for(let port=18080;port<=18099;port++){const s=net.createServer();try{await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(port,resolve)});await new Promise(r=>s.close(r));return port}catch{}}throw Error('No free test port')}
const port=await freePort(), base='http://127.0.0.1:'+port;
async function until(page,fn,timeout=90000){const end=Date.now()+timeout;while(Date.now()<end){let timer;try{const value=await Promise.race([page.evaluate('Boolean(('+String(fn)+')())'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Browser stopped responding: '+fn)),30000)})]);if(value)return}catch(e){if(!/context was destroyed/.test(e.message))throw e}finally{clearTimeout(timer)}await delay(150)}console.log('Browser errors',errors);throw Error('Timeout: '+fn+' '+JSON.stringify(await page.evaluate(()=>({mode:window.House?.mode,allowed:window.AccountGate?.allowed,loading:!!document.querySelector('.hs-loading,#houseEntry'),gate:document.querySelector('#accountGate')?.textContent}))))}
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(90000)}
async function credentials(page,account,first,g,signup=true){
 await page.addInitScript(()=>{
  localStorage.setItem('jhp_hs_gfx',JSON.stringify('low'));Date.prototype.getHours=()=>14;Date.prototype.getMinutes=()=>0;
  // Observe the actual canvas ink and SVG raster jobs, rather than duplicating production wording.
  window.identityInk=[];window.identitySVG=[];
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){const s=String(text);if(window.identityInk.length<30000)window.identityInk.push(s);return fill.call(this,text,...args)};
  const url=URL.createObjectURL;
  URL.createObjectURL=function(blob){if(blob.type==='image/svg+xml')void blob.text().then(s=>window.identitySVG.push(s));return url.call(this,blob)};
 });
 await page.goto(base+'/?famdate=12-31',{waitUntil:'domcontentloaded'});await until(page,()=>window.Net?.connected&&Net.me.id);
 if(signup)await page.locator('[data-switch]').click();
 await page.locator('[name=name]').fill(account);await page.locator('[name=password]').fill(password);
 if(signup)await page.locator('[name=confirm]').fill(password);
 await page.locator('#accountGate [type=submit]').click();
 await until(page,()=>window.AccountGate?.allowed||!!document.querySelector('#accountFirst'));
 if(await page.locator('#accountFirst').count()){
  await page.locator('#accountFirst').fill(first);await page.locator(`[name=gender][value=${g}]`).check();await page.locator('#accountGate [type=submit]').click();
 }
 await until(page,()=>window.AccountGate?.allowed);
}
async function house(page){await until(page,()=>window.House?.live&&window.PMGL?.built&&House.mode==='monitor'&&!sessionStorage.getItem('jhp_login_seat')&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));await page.keyboard.press('q');await until(page,()=>House.mode==='walk'&&!House.gliding);await page.evaluate(()=>Room.ensureHouse());await until(page,()=>window.HouseRooms?.ready);await page.evaluate(()=>{House.buildRoom(House.ROOMS.lounge);House.buildRoom(House.ROOMS.kitchen)});await until(page,()=>window.HouseLife&&window.ChoreKit)}
async function view(page,eye,target,level='U'){
 await until(page,()=>!House.gliding);
 await page.evaluate(({eye,target,level})=>{House.hush();House.setWalkFrom({x:eye[0],y:eye[1],z:eye[2],lvl:level,seat:0});const[x,y,z]=eye,[tx,ty,tz]=target;Object.assign(House.P,{x,y,z,rx:Math.atan2(-(ty-y),Math.hypot(tx-x,tz-z))*180/Math.PI,ry:Math.atan2(tx-x,-(tz-z))*180/Math.PI,seat:0,lvl:level});House._.setMode('focus');House.dirty()},{eye,target,level});await page.waitForTimeout(450);assert.deepEqual(await page.evaluate(()=>[House.P.x,House.P.y,House.P.z]),eye,'A camera glide overwrote the screenshot pose');
}
const shot=(page,name)=>page.screenshot({path:shots+name+'.png'});
async function texture(page,key,name){const url=await page.evaluate(key=>House.K.TEX[key]?.image?.toDataURL(),key);assert(url,'Missing texture '+key);await writeFile(shots+name+'.png',Buffer.from(url.split(',')[1],'base64'))}
async function cast(page){return page.evaluate(()=>({first:Cast.me().first,g:Cast.me().g,family:['sister','mate1','mate2','mate3','mate4'].map(Cast.n),online:['jack','dave','luke','callum','jackk','jsister'].map(Cast.n)}))}
async function checkRoom(page,name,owner=false){
 assert.equal(await page.evaluate(()=>House.ROOMS.bedroom.title),name.toUpperCase()+"'S ROOM");
 await view(page,[205,-55,210],[0,-15,10]);await shot(page,(owner?'owner-':name==='Jack'?'nonowner-':'')+name.toLowerCase()+'-bedroom');
 assert.equal(await page.locator('.hs-title').textContent(),name.toUpperCase()+"'S ROOM");
 const c=await cast(page);assert.equal(c.first,name);assert.deepEqual(c.online,['Jack','Dave','Luke','Callum','JackK','Crystal']);
 if(owner)assert.deepEqual(c.family,['Crystal','Dave','Luke','Callum','JackK']);else for(const n of c.family)assert(!['Crystal','Dave','Luke','Callum','JackK'].includes(n));
 const borrowed=await page.evaluate(()=>[RoomCat.GAME['gb.mon2'].owner,Discs.BOX.callumcd.owner,Discs.BOX.n64.owner]);assert.deepEqual(borrowed,[c.family[4],c.family[3],c.family[2]]);
 // Actual outgoing landline reply, including female mate pronouns where seeded.
 await view(page,[140,205,575],[128,310,604],'G');
 await page.evaluate(()=>{House._.setMode('walk');HouseLife.use('pbook')});await until(page,()=>!!document.querySelector('.hs-padgo'));await page.evaluate(()=>{for(const n of '01632960117')document.querySelector('.hs-padk [data-k="'+n+'"]').click();document.querySelector('.hs-padgo').click()});await page.waitForTimeout(1000);
 assert(await page.locator('.hs-call').isVisible(),'Landline dialogue hidden by the dial-pad surface');const land=await page.locator('.hs-call').textContent();assert(land.includes(c.family[1]));assert(!/\{(?:me|mate)/.test(land));await shot(page,(owner?'owner-':name==='Jack'?'nonowner-':'')+name.toLowerCase()+'-landline');
 await page.evaluate(()=>House.unfocus());await until(page,()=>!House.gliding);
 return c;
}
try{
 await mkdir(shots,{recursive:true});
 server=spawn(process.execPath,['tests/shop-sparse-server.cjs'],{cwd:root,env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 let started=false;for(let i=0;i<100;i++){assert.equal(server.exitCode,null,log);if(log.includes('online at :'+port)){started=true;break}await delay(100)}assert(started,log);
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 if(chosen('sarah')){
 const context=await browser.newContext({viewport:{width:1366,height:860}}),page=await context.newPage();observe(page);
 await credentials(page,'Sarah','Sarah','f');console.log('Sarah account ready');await house(page);console.log('Sarah house ready');sarah=await checkRoom(page,'Sarah');
 await until(page,()=>!!House.THINGS['st.diary']);
 assert.equal(await page.evaluate(()=>House.THINGS['st.diary'].label),"Sarah's diary");
 assert(await page.evaluate(()=>identityInk.includes('BEST DAUGHTER')),'Gran’s mug assumed the player was a son');await texture(page,'rm.mugprint','sarah-mug-art');
 await view(page,[80,-20,30],[46,-4,-8]);await shot(page,'sarah-mug');
 // The welcome line is generated by HouseLife from the signed-in identity.
 assert(await page.evaluate(()=>document.querySelector('.hs-voice p').textContent.includes('Sarah')));
 await page.evaluate(()=>ChoreKit.mom(ChoreCat.momSays(90,1)));assert.match(await page.locator('.hs-voice p').textContent(),/Good girl/);await shot(page,'sarah-mom');
 await page.evaluate(()=>House.SPOTS['starter.fund'].act());assert.match(await page.locator('.hs-note').textContent(),/Keep saving, Sarah!/);await shot(page,'sarah-dad-note');
 assert(await page.evaluate(()=>identityInk.includes('Keep saving, Sarah!')));await texture(page,'starter.dad-note','sarah-dad-note-art');
 await page.evaluate(()=>House.hush());await view(page,[-130,-115,185],[-147,-76,236]);await shot(page,'sarah-console-fund');
 await texture(page,'st.cover','sarah-diary-cover');assert(await page.evaluate(()=>identityInk.includes("Sarah's")));
 await view(page,[-25,-40,55],[-61,-1,-12]);assert(await page.evaluate(()=>{House._.setMode('walk');return House.grab('st.diary')}),'Could not pick up the diary');await page.keyboard.press('f');await until(page,()=>window.Magazines?.reading?.id==='st.diary'&&Magazines.reading.phase==='pages');await shot(page,'sarah-diary-physical');await page.keyboard.press('q');await page.evaluate(()=>House.putBack());await page.evaluate(()=>Apps.open('st.diary'));await until(page,()=>!!document.querySelector('.st-copy'));
 assert.match(await page.locator('.appwin').last().textContent(),/Sarah's diary/);await texture(page,'st.page.0','sarah-diary-page');
 await page.evaluate(()=>document.querySelector('.st-copy').closest('.appwin').querySelector('[data-w=close]').click());
 await page.evaluate(()=>Apps.load('js/family-files.js'));const familyText=await page.evaluate(()=>Apps.fs.find("Spag bol (Sarah's favourite).txt")?.text);assert.match(familyText,/Sarah has her with/);assert(!/\{(?:me|mate)/.test(familyText));
 // Read the actual phone title; scripted senders are house mates, real SMS are never rewritten.
 await page.evaluate(()=>Apps.load('js/hs-mobile.js'));await page.evaluate(()=>HouseMobile.use());await until(page,()=>window.FamilyPhone?.isOpen()&&!House.gliding);
 assert.match(await page.locator('.appwin').last().textContent(),/Sarah's Mobile/);await shot(page,'sarah-mobile');await page.keyboard.press('q');await until(page,()=>!FamilyPhone.isOpen());
 // Use the existing test-only server funding helper, then place a genuine order.
 const credit=await fetch(base+'/admin/qa-credit?name=Sarah',{method:'POST',headers:{'x-admin-token':'testtoken'}});assert(credit.ok);
 const ordered=await page.evaluate(()=>PM.order('pm.mag.03'));assert(!ordered.err,JSON.stringify(ordered));await until(page,()=>!!House.SPOTS['pm.parcel.pm.mag.03']);
 await until(page,()=>identitySVG.some(s=>s.includes('Ms Sarah')));const svg=await page.evaluate(()=>identitySVG.find(s=>s.includes('Ms Sarah')));assert(!svg.includes('MR J. JACK'));
 await view(page,[300,225,600],[355,346,650],'G');await shot(page,'sarah-parcel');
 await view(page,[340,300,619],[355,346,650],'G');await shot(page,'sarah-parcel-close');
 const parcelInk=await page.evaluate(()=>{let image;House.SPOTS['pm.parcel.pm.mag.03'].obj.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m?.map?.image?.width===1024&&m.map.image.height===616)image=m.map.image}});return image?.toDataURL()});assert(parcelInk);await writeFile(shots+'sarah-parcel-art.png',Buffer.from(parcelInk.split(',')[1],'base64'));
 await view(page,[-15,205,285],[-40,260,210],'G');await page.evaluate(()=>{House._.setMode('walk');HouseLife.use('fridge')});await until(page,()=>!House.gliding&&!!document.querySelector('.hs-fdoor'));await shot(page,'sarah-fridge');await page.keyboard.press('q');
 await view(page,[205,-55,210],[0,-15,10]);await page.setViewportSize({width:1024,height:768});await shot(page,'sarah-bedroom-1024');
 await page.evaluate(()=>House._.setMode('walk'));await page.waitForTimeout(800);const before=await page.evaluate(()=>({mode:House.mode,power:House.stood,first:Cast.me().first}));await page.reload({waitUntil:'domcontentloaded'});await until(page,()=>window.AccountGate?.allowed&&window.House?.live&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));assert.deepEqual(await page.evaluate(()=>({mode:House.mode,power:House.stood,first:Cast.me().first})),before);assert.deepEqual(await cast(page),sarah);await shot(page,'sarah-refresh');await context.close();
 console.log('PASS Sarah: named HUD, welcome/Mom, her in family files, physical diary/fund/parcel, phone, refresh and two desktop sizes');
 }
 if(chosen('nonowner')){console.log('Starting non-owner Jack');
 const nonowner=await browser.newContext({viewport:{width:1366,height:860}}),np=await nonowner.newPage();observe(np);await credentials(np,'AnotherJack','Jack','m');await house(np);await checkRoom(np,'Jack');assert.equal(await np.evaluate(()=>House.THINGS['st.diary'].label),"Jack's diary");await nonowner.close();console.log('PASS fresh Jack-named non-owner: Jack at home, random family/mates, fixed online cast');
 }
 if(chosen('owner')){console.log('Starting owner Jack');
 const registration=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})});assert(registration.ok);
 const owner=await browser.newContext({viewport:{width:1366,height:860}}),op=await owner.newPage();observe(op);await credentials(op,'Jack','Jack','m',false);await house(op);await checkRoom(op,'Jack',true);await owner.close();console.log('PASS owner Jack: Crystal/Dave/Luke/Callum/JackK');
 }
 if(chosen('sarah')){
 const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}),mp=await mobile.newPage();observe(mp);await credentials(mp,'Sarah','Sarah','f',false);await until(mp,()=>window.MobileDesktop&&window.DesktopSurface?.ready());assert(await mp.evaluate(()=>PCOnly.desktopOnly&&!window.House?.ren));await mp.evaluate(()=>Apps.open('st.diary'));await until(mp,()=>!!document.querySelector('.st-copy'));await shot(mp,'sarah-phone-diary');await mp.setViewportSize({width:844,height:390});await shot(mp,'sarah-phone-landscape');assert.deepEqual(await cast(mp),sarah);await mobile.close();
 }
 assert.deepEqual(errors,[],'Browser errors/warnings');assert(!/mod failed to load/i.test(log),log);console.log('PASS '+selection+': no browser errors/warnings or failed server mods');
}finally{if(browser)await browser.close();if(server?.pid&&server.exitCode===null){const ended=once(server,'exit');server.kill('SIGTERM');await ended}await rm(data,{recursive:true,force:true})}
