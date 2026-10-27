import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {roomFixture} from './room-fixture.mjs';
import {mkdir} from 'node:fs/promises';
const base=process.argv[2];assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));await mkdir('shots/pc-only',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
try{
 const devices=[
  ['iphone','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1','iPhone',5],
  ['android','Mozilla/5.0 (Linux; Android 14; Test) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36','Linux armv8l',5],
  ['ipad-desktop-mode','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15','MacIntel',5],
  ['android-tablet','Mozilla/5.0 (Linux; Android 14; Tablet) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36','Linux armv8l',5]
 ];
 for(const [name,userAgent,platform,points]of devices){
  const c=await browser.newContext({userAgent,hasTouch:true,viewport:{width:390,height:844}}),p=await c.newPage(),errors=[];let sockets=0;
  p.on('websocket',()=>sockets++);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
  await p.addInitScript(({platform,points})=>{Object.defineProperty(navigator,'platform',{get:()=>platform});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>points})},{platform,points});
  await p.goto(base,{waitUntil:'networkidle'});await p.locator('#accountGate form').waitFor();
  // Device policy (2026-10-26): every handheld (desktop-mode iPad included) is detected and gets the house, not JackOS only.
  assert(await p.evaluate(()=>PCOnly.handheld&&!PCOnly.desktopOnly&&House.ok&&document.documentElement.classList.contains('handheld-house')),name+' must be a handheld with the house');for(let i=0;i<300&&!sockets;i++)await p.waitForTimeout(100);assert(sockets>0,name+': no JackNet socket');assert.deepEqual(errors,[]);
  await p.screenshot({path:`shots/pc-only/${name}.png`});await p.reload({waitUntil:'networkidle'});await p.setViewportSize({width:844,height:390});await p.locator('#accountGate form').waitFor();assert(await p.evaluate(()=>window.House?.ok&&!PCOnly.desktopOnly),name+' lost the house on rotate/refresh');await c.close();console.log('MOBILE HOUSE ACCESS PASS',name);
 }
 // Windows PCs with a touch display remain PCs, even in a narrow window.
 const c=await browser.newContext({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',hasTouch:true,viewport:{width:390,height:844}}),p=await c.newPage();
 await p.goto(base);await p.locator('#accountGate form').waitFor();for(let i=0;i<200;i++){if(await p.evaluate(()=>!!window.GameInput&&!!window.HousePause))break;await p.waitForTimeout(100)}assert(!await p.evaluate(()=>PCOnly.blocked));assert.equal(await p.locator('.hs-joy,.hs-jump,.hs-duck,.hs-use,.pc-touch,[name=pcTrackpad]').count(),0);assert(!await p.evaluate(()=>GameInput.touch));await p.screenshot({path:'shots/pc-only/narrow-windows-pc.png'});await c.close();
}finally{await browser.close()}
// An existing (admin-registered) player has the full room and logs on at the PC; a fresh signup starts the story with no PC.
const account='Layout'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false}),{page:p,until,errors}=f;
try{
 await p.evaluate(async()=>{await Apps.load('js/hs-cat.js');await Apps.load('js/hs-life.js')});
 await p.evaluate(()=>{House.hush();window.roomReturns=0;House.on('room',id=>{if(id==='bedroom')roomReturns++});window.originalRandom=Math.random;Math.random=()=>0;for(const [i,id]of ['mug','cube','mobile'].entries()){const t=House.THINGS[id];t.at={room:'bedroom',x:40+i*20,y:73,z:145,ry:0,hide:false};t.st='rest';t.snap=null;House.ROOMS.bedroom.things.add(t.obj);House.place(t)}House.saveThings(true)});
 const items=()=>p.evaluate(()=>['mug','cube','mobile'].map(id=>({id,at:{...House.THINGS[id].at},home:{...House.THINGS[id].home}})));
 const placed=await items();
 for(let n=0;n<4;n++)for(const [x,z]of [[300,200],[40,145]]){await p.evaluate(({x,z})=>{const pose={x,y:-55,z,rx:-10,ry:0,lvl:'U',seat:0};House.setWalkFrom(pose);Object.assign(House.P,pose);House._.setMode('focus');House.dirty()},{x,z});await p.waitForTimeout(100)}
 await p.waitForTimeout(500);assert(await p.evaluate(()=>roomReturns>=4));assert.deepEqual(await items(),placed);assert(!await p.evaluate(()=>document.body.textContent.includes('Mom tidied your room!')));
 await p.evaluate(()=>{Math.random=originalRandom;House.hush();House._.setMode('walk');House.saveWalkState();House.saveThings(true)});
 for(const [width,height]of [[1366,860],[1920,1080]]){await p.setViewportSize({width,height});await f.view([35,-48,210],[65,66,145]);await p.screenshot({path:`shots/pc-only/layout-${width}.png`})}
 await p.evaluate(()=>{House._.setMode('walk');House.saveWalkState()});await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));assert.deepEqual(await items(),placed);
 await p.evaluate(()=>Room.tidy('bedroom'));assert(await p.evaluate(()=>['mug','cube','mobile'].every(id=>{const t=House.THINGS[id];return t.at.x===t.home.x&&t.at.z===t.home.z})));assert.deepEqual(errors,[]);
 console.log('PC LAYOUT PASS: forced old tidy chance, four actual bedroom return events, arranged props/refresh preserved, manual tidy works; desktop screenshots; no errors/warnings');
}finally{await f.browser.close()}
