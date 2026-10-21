import {chromium} from 'playwright';import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:18430';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{Date.prototype.getHours=()=>14;Date.prototype.getMinutes=()=>1});
async function until(fn){for(let i=0;i<400;i++){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('Timeout '+fn)}
async function view(name,eye,target){await p.evaluate(({eye,target})=>{House.hush();const[x,y,z]=eye,[tx,ty,tz]=target,pose={x,y,z,rx:Math.atan2(-(ty-y),Math.hypot(tx-x,tz-z))*180/Math.PI,ry:Math.atan2(tx-x,-(tz-z))*180/Math.PI,seat:0,lvl:'U'};Object.assign(House.P,pose);House.setWalkFrom(pose);House._.setMode('focus');House.dirty()},{eye,target});await p.waitForTimeout(500);await p.screenshot({path:`shots/lamp-${name}.png`})}
const state=()=>JSON.parse(localStorage.getItem('jhp_hs_lights')||'{}').lamp??true;
async function toggle(){const before=await p.evaluate(state);await p.evaluate(()=>{House.hush();House.act('lamp')});assert.equal(await p.evaluate(state),!before);assert.equal(await p.evaluate(()=>House.SPOTS.lamp.obj.getObjectByName('lamp-shell').material[1].emissive.getHex()!==0),!before);await p.keyboard.press('Escape')}
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.Net?.connected&&!!Net.me.id);
 await p.locator('#accountGate [data-switch]').click();await p.locator('[name=name]').fill('Lamp'+Date.now().toString(36));await p.locator('[name=password]').fill('Throwaway-1999');await p.locator('[name=confirm]').fill('Throwaway-1999');await p.locator('#accountGate [type=submit]').click();
 await until(()=>AccountGate.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.deepEqual(errors,[],'Room construction errors');
 await view('overview',[-109,-33,30],[-59,-20,-35]);await view('front',[-89,-29,1],[-57,-22,-39]);await view('inside',[-73,-17,-15],[-52,-34,-30]);await view('rear',[-88,-41,-51],[-60,-23,-40]);
 const geometry=await p.evaluate(()=>{
   const lamp=House.SPOTS.lamp.obj,bulb=lamp.getObjectByName('lamp-bulb'),v=new THREE.Vector3();bulb.getWorldPosition(v);const source=House.ROOMS.bedroom.lights().find(l=>Math.abs(l.x-v.x)<.01&&Math.abs(l.y+v.y)<.01&&Math.abs(l.z-v.z)<.01);
   const boxes=[[0,1.6,-12,152,3.2,86],[-74,37,-12,4,70,84],[0,36,-53,148,60,2],[-20,68.5,-55.2,520,9,1.6]],hits=[];
   for(const route of lamp.userData.cables)for(const q of route.points){const[x,y,z]=q.map((n,i)=>n+[lamp.position.x,lamp.position.y,lamp.position.z][i]),r=route.radius;if(z-r<-56)hits.push('wall');for(const[cx,cy,cz,w,h,d]of boxes)if(x+r>cx-w/2&&x-r<cx+w/2&&y+r>cy-h/2&&y-r<cy+h/2&&z+r>cz-d/2&&z-r<cz+d/2)hits.push('desk/skirting')}
   return{source:!!source,hits:[...new Set(hits)],switchPosition:lamp.getObjectByName('lamp-switch').position.toArray()};
 });assert(geometry.source,'Light source must align with physical bulb');assert.deepEqual(geometry.hits,[]);assert.equal(geometry.switchPosition[0],2,'Switch moved to the lamp origin');
 await toggle();await view('off',[-89,-29,1],[-57,-22,-39]);
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(state),false);await toggle();
 for(let i=0;i<6;i++)await toggle();assert.equal(await p.evaluate(state),true);
 await view('controls',[-95,-55,30],[-62,-1,-40]);await p.evaluate(()=>{House.hush();House._.setMode('walk')});await p.keyboard.press('e');assert.equal(await p.evaluate(state),false,'E did not use the actual lamp');
 await p.evaluate(()=>House.hush());await p.mouse.click(683,430);assert.equal(await p.evaluate(state),true,'Click did not use the actual lamp');await p.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();House.hush()});
 await p.evaluate(()=>{Date.prototype.getHours=()=>22;Date.prototype.getMinutes=()=>0});await until(()=>House.ROOMS.bedroom.sun().i===0.055);await view('night-on',[-89,-29,1],[-57,-22,-39]);await toggle();await view('night-off',[-89,-29,1],[-57,-22,-39]);await toggle();
 await p.setViewportSize({width:390,height:844});await view('narrow',[-88,-30,24],[-57,-20,-40]);await p.setViewportSize({width:1366,height:860});
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));assert.equal(await p.evaluate(state),true);await view('refresh-on',[-89,-29,1],[-57,-22,-39]);
 assert.deepEqual(errors,[]);console.log('DESK LAMP PASS: bulb alignment, cable clearances, rapid toggles, on/off refresh and multi-angle desktop/narrow screenshots; no errors/warnings');
}finally{await b.close()}
