import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()));Date.prototype.getHours=()=>14});
async function until(fn){for(let n=0;n<200;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('timeout')}
try{
await p.goto(process.argv[2]||'http://localhost:18340',{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));await p.keyboard.press('F2');await until(()=>House.mode==='walk');await p.evaluate(()=>Room.ensureHouse());await until(()=>window.HouseRooms?.ready);
for(const room of (process.argv[3]==='car'?['drive']:['bedroom','landing','hall','cupboard','lounge','kitchen','garden','drive'])){
 await p.evaluate(room=>{House.goRoom(room,0);House.hush();House.relight()},room);await p.waitForTimeout(700);await p.screenshot({path:`shots/review-${room}.png`});
 if(room==='bedroom'){
 const fixed=await p.evaluate(async()=>{const lights=()=>House.root.children.filter(o=>o.isPointLight&&o.intensity>.02).map(o=>[o.position.x,o.position.y,o.position.z]);await new Promise(r=>setTimeout(r,800));const before=lights();House.P.x+=30;House.relight();await new Promise(r=>setTimeout(r,800));return JSON.stringify(before)===JSON.stringify(lights())});assert(fixed,'Moving inside a room changed its light sources');
 }
}
await until(()=>House.SPOTS['ch.mud0']);
assert(await p.evaluate(()=>{const f=House.ROOMS.drive.carFrame,p=House.SPOTS['ch.mud0'].obj.position;return Math.abs(p.x-(f.x-85.15*f.s-.5))<.01&&Math.abs(p.z-(f.z-155*f.s))<.01}));
const cf=await p.evaluate(()=>House.ROOMS.drive.carFrame);
for(const [name,x,y,z,tx,ty,tz]of[['car-side',cf.x-250,240,cf.z,cf.x,285,cf.z],['car-front',cf.x-240,230,cf.z+260,cf.x,280,cf.z],['car-rear',cf.x-240,230,cf.z-250,cf.x,280,cf.z]]){
 await p.evaluate(({x,y,z,tx,ty,tz})=>{const ry=Math.atan2(tx-x,-(tz-z))*180/Math.PI,rx=Math.atan2(-(ty-y),Math.hypot(tx-x,tz-z))*180/Math.PI;const pose={x,y,z,rx,ry,lvl:'G',seat:0};Object.assign(House.P,pose);House.setWalkFrom(pose);House._.setMode('focus');House.hush();House.dirty()},{x,y,z,tx,ty,tz});await p.waitForTimeout(500);await p.screenshot({path:`shots/review-${name}.png`});
}
await p.evaluate(()=>{House._.setMode('walk');House.act('ch.bucket');for(let i=0;i<3;i++)House.act('ch.mud0')});
assert.equal(await p.evaluate(()=>House.SPOTS['ch.mud0'].off),true,'Mud should scrub off in three passes');
await p.waitForTimeout(400);await p.screenshot({path:'shots/review-car-scrubbed.png'});
assert.deepEqual(errors,[]);console.log('HOUSE REVIEW PASS');
}finally{await b.close()}
