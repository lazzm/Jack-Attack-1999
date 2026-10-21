import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:18420',stage=process.argv[3]||'final';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Throwaway server only');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await page.addInitScript(()=>{Date.prototype.getHours=()=>14});
async function until(fn){for(let i=0;i<400;i++){try{if(await page.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await page.waitForTimeout(200)}throw Error('Timeout '+fn)}
async function view(name,eye,target){await page.evaluate(({eye,target})=>{House.hush();const [x,y,z]=eye,[tx,ty,tz]=target;const pose={x,y,z,rx:Math.atan2(-(ty-y),Math.hypot(tx-x,tz-z))*180/Math.PI,ry:Math.atan2(tx-x,-(tz-z))*180/Math.PI,seat:0,lvl:'U'};Object.assign(House.P,pose);House.setWalkFrom(pose);House._.setMode('focus');House.dirty()},{eye,target});await page.waitForTimeout(400);await page.screenshot({path:`shots/models-${stage}-${name}.png`})}
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.Net?.connected&&!!Net.me.id);
 await page.locator('#accountGate [data-switch]').click();await page.locator('[name=name]').fill('Models'+Date.now().toString(36));await page.locator('[name=password]').fill('Throwaway-1999');await page.locator('[name=confirm]').fill('Throwaway-1999');await page.locator('#accountGate [type=submit]').click();
 await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
 await view('corner',[-72,-30,175],[-150,46,24]);
 await view('beanbag-front',[-70,12,122],[-100,54,56]);
 await view('beanbag-back',[-133,14,-4],[-100,54,56]);
 await view('pads',[-175,27,64],[-175,70,27]);
 await view('pads-low',[-143,69,51],[-171,70,28]);
 await view('cables',[-117,32,10],[-178,57,-14]);
 assert(await page.evaluate(()=>{const b=House.ROOMS.bedroom.group.getObjectByName('beanbag');if(!b)return false;let good=true;b.traverse(o=>{if(o.geometry){const p=o.geometry.attributes.position;for(let i=0;i<p.array.length;i++)if(!Number.isFinite(p.array[i]))good=false}});return good}),'Invalid beanbag geometry');
 if(stage!=='beanbag'){
   const hits=await page.evaluate(()=>{
     const tx=-178,boxes=[],add=(x,y,z,w,h,d)=>boxes.push([x-w/2,y-h/2,z-d/2,x+w/2,y+h/2,z+d/2]);
     [28.6,71.6].forEach(y=>add(tx,y,-34,72,2.4,42));add(tx,51,-34,68,1.8,40);
     [-35,35].forEach(x=>add(tx+x,50,-34,2.2,44,42));
     [-32,0,32].forEach(x=>add(tx+x,50,-54.4,4,40,1.2));[30,52.5,70].forEach(y=>add(tx,y,-54.4,68,3,1.2));
     add(-20,68.5,-55.2,520,9,1.6); // bedroom back-wall skirting
     const routes=['console-controllers','console-av-leads'].flatMap(n=>House.ROOMS.bedroom.group.getObjectByName(n).userData.cables),hits=[];
     for(const route of routes)for(const [x,y,z]of route.points){const r=route.radius;if(y+r>72.76||z-r<-56)hits.push(route.id+': floor/wall');for(const b of boxes)if(x+r>b[0]&&x-r<b[3]&&y+r>b[1]&&y-r<b[4]&&z+r>b[2]&&z-r<b[5])hits.push(route.id+': cabinet')}
     return [...new Set(hits)];
   });assert.deepEqual(hits,[],'Cable routes intersect furniture/floor/wall');
 }
 await page.setViewportSize({width:390,height:844});await view('narrow',[-65,-35,181],[-143,45,30]);
 await page.setViewportSize({width:1366,height:860});
 if(stage!=='beanbag'){
   await page.evaluate(()=>{const pose={x:-100,y:-55,z:118,rx:0,ry:0,seat:0,lvl:'U'};Object.assign(House.P,pose);House.setWalkFrom(pose);House._.setMode('walk');House.hush()});
   await page.keyboard.down('w');await page.waitForTimeout(1500);await page.keyboard.up('w');
   assert(await page.evaluate(()=>House.W.z<118&&House.W.z>=86),'Walking passed through the beanbag');
   assert(await page.evaluate(()=>!!House.SPOTS.pads.obj&&!!House.SPOTS.beanbag.obj),'Model interaction targets lost');
 }
 await page.evaluate(()=>{const p={x:40,y:-55,z:155,rx:-8,ry:-40,seat:0,lvl:'U'};House._.setMode('walk');Object.assign(House.P,p);House.setWalkFrom(p);House.dirty()});
 await page.keyboard.press('Escape');await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));
 await view('refresh',[-72,-30,175],[-150,46,24]);
 assert.deepEqual(errors,[]);console.log('ROOM MODELS PASS: multi-angle desktop/narrow, finite geometry, account resume and refresh; no browser errors/warnings');
}finally{await browser.close()}
