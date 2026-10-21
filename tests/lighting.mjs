import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:18330',tag=process.argv[3]||'after';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()));window.auditHour=14;window.auditMinute=0;Date.prototype.getHours=function(){return window.auditHour};Date.prototype.getMinutes=function(){return window.auditMinute}});
async function until(fn){for(let n=0;n<180;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('timeout')}
try{await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor');await p.keyboard.press('F2');await until(()=>House.mode==='walk');await p.evaluate(()=>Room.ensureHouse());await until(()=>window.HouseRooms?.ready);
for(const [phase,hour]of[['day',14],['dusk',17],['night',22]]){
await p.evaluate(hour=>{window.auditHour=hour;window.auditMinute+=5},hour);await p.waitForTimeout(600);
for(const room of ['bedroom','landing','hall','cupboard','lounge','kitchen','garden','drive']){
await p.evaluate(room=>{House.goRoom(room,0);House.hush();House.relight()},room);await p.waitForTimeout(800);
await p.screenshot({path:`shots/lighting-${tag}-${phase}-${room}.png`});
console.log(tag,phase,room);
}}
await p.evaluate(()=>{House.goRoom('bedroom',0);House.act('switch');House.hush()});await p.waitForTimeout(800);await p.screenshot({path:`shots/lighting-${tag}-night-ceiling-on.png`});
await p.evaluate(()=>House.act('switch'));
// Off lights must not consume all three slots on Low quality.
const offBudget=await p.evaluate(async()=>{const room=House.ROOMS.bedroom,old=room.lights,x=House.P.x,y=House.P.y,z=House.P.z;try{room.lights=()=>[...Array.from({length:5},(_,i)=>({x:x+i,y,z,i:0,d:400})),{x:x+10,y,z,i:.8,d:400}];House.relight();await new Promise(r=>setTimeout(r,1100));return House.root.children.some(l=>l.isPointLight&&Math.abs(l.position.x-x-10)<.1&&l.intensity>.65)}finally{room.lights=old;House.relight()}});
assert.equal(offBudget,true);
assert.deepEqual(errors,[]);console.log('LIGHTING PASS');}finally{await b.close()}
