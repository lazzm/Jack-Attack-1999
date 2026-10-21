import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18360';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
async function until(fn){for(let n=0;n<300;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('State timeout '+fn)}
await p.addInitScript(()=>{
 if(!localStorage.getItem('jhp_everbooted')){
  localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()));
  localStorage.setItem('jhp_gs_hs.things',JSON.stringify({f:1,v:1,t:Date.now(),s:{t:{cube:['garden',40,353,-180,25,0,0],'unbuilt.test':['lounge',-40,353,450,0,0,0]},o:{'unbuilt.drawer':1}}}));
 }
 const age=sessionStorage.getItem('test.age');if(age){sessionStorage.removeItem('test.age');const s=JSON.parse(localStorage.getItem('jhp_hs_stand'));s.t=Date.now()-12*3600000;localStorage.setItem('jhp_hs_stand',JSON.stringify(s))}
 Date.prototype.getHours=()=>14;
});
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 await p.evaluate(()=>House.saveThings(true));
 let saved=await p.evaluate(()=>Apps.loadGame('hs.things',1));
 assert.equal(saved.t.cube[0],'garden','Saving before the garden loads must keep the deferred cube');
 assert(saved.t['unbuilt.test']&&saved.o['unbuilt.drawer'],'Unbuilt room records survive a partial save');
 await p.keyboard.press('F2');await until(()=>House.mode==='walk');await p.evaluate(()=>Room.ensureHouse());
 assert(await p.evaluate(()=>{const t=House.THINGS.cube;return t.at.room==='garden'&&t.at.x===40&&t.at.z===-180&&t.obj.parent===House.ROOMS.garden.things}),'Deferred cube must restore into the garden group');
 await p.evaluate(()=>{House.goRoom('garden',0);House.cancelGlide(true);const pose={x:40,y:225,z:-100,rx:-57,ry:0,lvl:'G',seat:0};Object.assign(House.P,pose);House.setWalkFrom(pose);House.hush();House.dirty()});await until(()=>House.mode==='walk');
 await p.waitForTimeout(500);
 await p.screenshot({path:'shots/save-garden-prop.png'});
 await p.evaluate(()=>sessionStorage.setItem('test.age','1'));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='walk'&&House.here==='garden'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 assert.equal(await p.evaluate(()=>House.THINGS.cube.at.room),'garden');
 await p.screenshot({path:'shots/save-garden-restored.png'});
 // A malformed persisted camera must safely fall back, not hide the room forever.
 await p.addInitScript(()=>{if(sessionStorage.getItem('test.invalid')){sessionStorage.removeItem('test.invalid');localStorage.setItem('jhp_hs_stand',JSON.stringify({t:Date.now(),p:{x:99999,y:0,z:99999,rx:0,ry:0,lvl:'G'}}))}});
 await p.evaluate(()=>sessionStorage.setItem('test.invalid','1'));await p.reload({waitUntil:'domcontentloaded'});
 await until(()=>window.House?.mode==='walk'&&window.PMGL?.built&&!document.documentElement.classList.contains('pc-standwake')&&!document.querySelector('.hs-loading'));
 assert.equal(await p.evaluate(()=>House.here),'bedroom');await p.screenshot({path:'shots/save-invalid-fallback.png'});
 assert.deepEqual(errors,[]);console.log('HOUSE SAVE PASS: deferred props, unbuilt records, aged pose, invalid fallback');
}finally{await b.close()}
