import{chromium}from'playwright';import assert from'node:assert/strict';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
async function until(fn){for(let n=0;n<200;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('timeout')}
try{await p.goto(process.argv[2]||'http://localhost:18330',{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor');await p.keyboard.press('F2');await until(()=>House.mode==='walk');await until(()=>window.RoomTV);
await p.evaluate(()=>RoomTV.test('n64.kart'));await until(()=>RoomTV._dbg()?.st==='game');await p.keyboard.press('Enter');await p.waitForTimeout(1200);await p.evaluate(()=>window.savedK=RoomTV.dbg());
await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>RoomTV.open_),false);assert.equal(await p.evaluate(()=>RoomTV._dbg().background),true);
const t=await p.evaluate(()=>RoomTV.dbg().t);await p.waitForTimeout(1700);assert(await p.evaluate(t=>RoomTV.dbg().t>t+.3,t));
await p.evaluate(()=>{const pose={x:80,y:-20,z:115,rx:-5,ry:10,lvl:'U',seat:0};Object.assign(House.P,pose);House.setWalkFrom(pose);House.dirty()});await p.screenshot({path:'shots/tv-background-walking.png'});
await p.evaluate(()=>House.act('telly'));await until(()=>House.mode==='focus'&&RoomTV.open_);assert.equal(await p.evaluate(()=>RoomTV.dbg()===window.savedK),true);assert.equal(await p.evaluate(()=>RoomTV._dbg().background),false);
await p.keyboard.press('Escape');await until(()=>House.mode==='walk');await p.keyboard.press('w');assert.equal(await p.evaluate(()=>RoomTV._dbg().background),true);
await p.waitForTimeout(800);await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.RoomTV?._dbg()?.st==='game'&&RoomTV._dbg().background);
assert.equal(await p.evaluate(()=>House.stood),true);assert.equal(await p.evaluate(()=>RoomTV._dbg().gid),'n64.kart');
await p.screenshot({path:'shots/tv-background-refresh.png'});
assert.equal(await p.evaluate(()=>House.grab('media.n64.kart')),true);assert.equal(await p.evaluate(()=>RoomTV.dbg()),null);assert.equal(await p.evaluate(()=>RoomTV._dbg()),null);
assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_console_focus')),null);
assert.deepEqual(errors,[]);console.log('TV BACKGROUND PASS');}finally{await b.close()}
