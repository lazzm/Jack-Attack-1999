import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2] || 'http://localhost:18360';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Throwaway localhost server only');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
async function until(fn){for(let n=0;n<300;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('State timeout: '+fn)}
await p.addInitScript(()=>{if(!localStorage.getItem('jhp_everbooted')){localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))}Date.prototype.getHours=()=>14});
try {
 await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 await p.keyboard.press('F2');await until(()=>House.mode==='walk');
 await p.evaluate(()=>House.grab('cube'));assert.equal(await p.evaluate(()=>House.held()),'cube');
 await p.keyboard.press('Space');await p.waitForTimeout(80);
 assert.equal(await p.evaluate(()=>House.held()),'cube','Space must not drop carried items');
 assert(await p.evaluate(()=>House.W.jh>0),'Space jumps while carrying');
 await p.keyboard.press('i');await until(()=>House.mode==='inspect');await p.keyboard.press('Escape');
 assert.equal(await p.evaluate(()=>House.held()),'cube','Escape leaves inspection carrying the same item');
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>House.held()),null);
 await p.evaluate(()=>Room.ensureHouse());
 for(const room of (process.argv[3]||'bedroom,landing,hall,cupboard,lounge,kitchen,garden,drive').split(',')){
  const before=await p.evaluate(room=>{
   House.goRoom(room,0);const view=House._.glide.to;House.cancelGlide(true);Object.assign(House.P,view);House.hush();House.setDoor('bedroom',true,true);House.setDoor('kitchen',true,true);House.setDoor('cupboard',true,true);
   // Stations are authored viewpoints; choose a nearby collision-valid standing cell.
   const H=House,r=H.ROOMS[room];let best=null;
   for(const a of r.area)for(let x=a[0]+5;x<a[2]-5;x+=5)for(let z=a[1]+5;z<a[3]-5;z+=5){
    if(!H._.cellOk(r.lvl,x,z))continue;
    const floor=H._.floorAt(x,z,r.lvl,H.LV[r.lvl]);if(!floor)continue;
    const d=Math.hypot(x-H.P.x,z-H.P.z);if(!best||d<best.d)best={x,z,d};
   }
   if(!best)throw Error('No standing cell in '+room);
   const pose={x:best.x,z:best.z,y:H.LV[r.lvl]-(r.eye||128),rx:H.P.rx,ry:H.P.ry,lvl:r.lvl,seat:0};
   Object.assign(H.P,pose);H.setWalkFrom(pose);H.dirty();return pose;
  },room);
  // pagehide must save immediately, without waiting for the periodic autosave.
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='walk'&&window.PMGL?.built&&!document.documentElement.classList.contains('pc-standwake')&&!document.querySelector('.hs-loading'));
  const after=await p.evaluate(()=>({x:House.W.x,z:House.W.z,lvl:House.W.lvl,room:House.here,bedroom:House.DOORS.bedroom.open,kitchen:House.DOORS.kitchen.open}));
  assert.equal(after.room,room);assert.equal(after.lvl,before.lvl);assert(Math.abs(after.x-before.x)<.2&&Math.abs(after.z-before.z)<.2,JSON.stringify({room,before,after}));
  assert(after.bedroom&&after.kitchen,'Open doors must survive refresh');
  await p.waitForTimeout(600);await p.screenshot({path:`shots/resume-${room}.png`});
  console.log('RESUMED',room);
 }
 if((process.argv[3]||'drive').includes('drive')){
 // Old saves no longer expire after thirty/forty-five minutes.
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('jhp_hs_stand'));s.t=Date.now()-12*3600000;localStorage.setItem('jhp_hs_stand',JSON.stringify(s))});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='walk'&&House.here==='drive'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(600);await p.screenshot({path:'shots/resume-narrow.png'});
 await p.setViewportSize({width:1366,height:860});
 // Powered-off walking uses the same lazy-load/restore path, not PC wake.
 await p.evaluate(()=>{House.finishShutdown();House.goRoom('garden',0);House.hush();localStorage.setItem('jhp_off','1')});
 await p.waitForTimeout(300);const off=await p.evaluate(()=>({x:House.W.x,z:House.W.z}));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='walk'&&House.here==='garden'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),'1');
 assert(await p.evaluate(({x,z})=>Math.hypot(House.W.x-x,House.W.z-z)<.2,off));
 await p.waitForTimeout(600);await p.screenshot({path:'shots/resume-off-garden.png'});
 }
 assert.deepEqual(errors,[]);console.log('HOUSE RESUME / CONTROLS PASS');
}finally{await browser.close()}
