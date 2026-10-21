import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:18320';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
async function until(fn){for(let n=0;n<160;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('timeout')}
await p.addInitScript(()=>{if(!localStorage.getItem('books-seeded')){localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()));const own={};for(const id of ['park','city','squigs','rts','keepa','carta','pinball','jaquake','jrt','boss','podracer','pm.os98','pm.gub','pm.mix','pm.netplanet',...Array.from({length:10},(_,i)=>'pm.mag.'+String(i+1).padStart(2,'0'))])own[id]=1;localStorage.setItem('jhp_pm',JSON.stringify({v:1,own,fl:{},seen:{},days:[]}));localStorage.setItem('books-seeded','1')}});
async function view(x=-90,y=11,z=10,ry=-90){await p.evaluate(({x,y,z,ry})=>{Object.assign(House.P,{x,y,z,rx:0,ry});House.setWalkFrom({x,y,z,rx:0,ry,lvl:'U',seat:0});House._.setMode('focus');House.hush();House.dirty()},{x,y,z,ry});await p.waitForTimeout(450)}
try{
await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.PMGL?.built);await p.keyboard.press('F2');await until(()=>House.mode==='walk');await view();await until(()=>PMGL._q().n===0&&PMGL._q().busy===0);
await p.screenshot({path:'shots/bookcase-front.png'});
const ids=await p.evaluate(()=>Object.keys(PMGL.homes()));assert(ids.length>=20);
const slots=await p.evaluate(()=>Apps.store.get('jhp_pm_slots',{}));assert.equal(new Set(Object.values(slots).map(s=>s.row)).size,4);
for(const id of ['keepa','pm.os98','pm.mag.01']){
 await p.evaluate(id=>{House._.setMode('walk');const t=House.THINGS['pmb.'+id],pose={x:t.home.x+35,y:t.home.y-t.h/2-6,z:t.home.z,rx:0,ry:-90,lvl:'U',seat:1};Object.assign(House.P,pose);House.setWalkFrom(pose);House.grab(t.id)},id);
 await p.waitForTimeout(650);await p.screenshot({path:`shots/bookcase-highlight-${id}.png`});
 await p.evaluate(()=>House.drop());await p.waitForTimeout(650);
 assert.equal(await p.evaluate(id=>House.THINGS['pmb.'+id].snap,id),'pm.slot.'+id);
}
await p.evaluate(()=>{const t=House.THINGS['pmb.keepa'];House.grab(t.id)});await p.evaluate(()=>PMGL.takeDisc('keepa'));await p.waitForTimeout(1100);assert.equal(await p.evaluate(()=>House.held()),'pmd.keepa');
await p.evaluate(()=>{const t=House.THINGS['pmb.keepa'],pose={x:t.home.x+25,y:t.home.y-11,z:t.home.z,rx:0,ry:-90,lvl:'U',seat:1};Object.assign(House.P,pose);House.setWalkFrom(pose)});await p.waitForTimeout(500);await p.evaluate(()=>House.drop());await p.waitForTimeout(700);
assert.equal(await p.evaluate(()=>House.THINGS['pmd.keepa'].at.hide),true);
await p.evaluate(()=>{const t=House.THINGS['pmb.city'];t.at={room:'bedroom',x:-100,y:70,z:40,ry:43};t.st='rest';House.place(t);House.saveThings()});await p.waitForTimeout(900);await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.PMGL?.built&&House.mode==='walk');assert.equal(await p.evaluate(()=>House.THINGS['pmb.city'].at.x),-100);
await p.evaluate(()=>Room.tidy());await p.waitForTimeout(900);assert(await p.evaluate(()=>Object.keys(PMGL.homes()).every(id=>{const t=House.THINGS['pmb.'+id];return t.at.x===t.home.x&&t.at.y===t.home.y&&t.at.ry===180})));
await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.PMGL?.built&&House.mode==='walk');await view();await until(()=>PMGL._q().n===0&&PMGL._q().busy===0);await p.screenshot({path:'shots/bookcase-tidied-refresh.png'});
await view(-100,11,65,-70);await p.screenshot({path:'shots/bookcase-side.png'});
await p.setViewportSize({width:1920,height:1080});await view(-100,11,-35,-107);await p.screenshot({path:'shots/bookcase-wide.png'});
assert.deepEqual(errors,[]);console.log('BOOKCASE PASS',ids.length,'items');
}finally{await b.close()}
