import {chromium} from 'playwright';import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
async function until(fn){for(let n=0;n<200;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('timeout '+fn)}
try{
await p.goto(process.argv[2]||'http://localhost:18340',{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built&&!document.querySelector('.hs-loading'));await p.keyboard.press('F2');await until(()=>House.mode==='walk');await until(()=>window.RoomTV);
await p.evaluate(()=>{const t=House.THINGS['media.gb.blocks'],s=House.SNAPS['console.gb'];t.st='snap';t.snap=s.id;t.at={room:'bedroom',...s.pose};t.rx=s.pose.rx;House.place(t);House.grab('gb');House.inspect('gb')});await p.waitForTimeout(350);
await p.screenshot({path:'shots/handheld-cartridge-front.png'});
await p.mouse.move(650,380);await p.mouse.down({button:'right'});await p.mouse.move(650,780,{steps:20});await p.mouse.up({button:'right'});await p.screenshot({path:'shots/handheld-cartridge-rear.png'});
assert.equal(await p.evaluate(()=>{const t=House.THINGS['media.gb.blocks'],gb=House.THINGS.gb;gb.obj.updateWorldMatrix(true,false);t.obj.updateWorldMatrix(true,false);const p=new THREE.Vector3();t.obj.getWorldPosition(p);gb.obj.worldToLocal(p);return Math.abs(p.y-.28)<.05&&Math.abs(p.z+6.5)<.05}),true);
await p.keyboard.press('Escape');await p.keyboard.press('f');await until(()=>House.mode==='focus'&&RoomTV._dbg()?.st==='game');await p.waitForTimeout(400);await p.screenshot({path:'shots/handheld-playing.png'});
await p.evaluate(()=>window.runningHandheld=RoomTV.dbg());await p.locator('.rm-live3d .rm-back').click();await until(()=>House.mode==='walk');assert.equal(await p.evaluate(()=>RoomTV.dbg()===window.runningHandheld),true);
await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>House.THINGS.gb.st),'rest');assert.equal(await p.evaluate(()=>House.THINGS.gb.at.y),0);
// Esc during the lift must restore the very same object to its physical pose.
await p.evaluate(()=>{House.grab('gb');House.THINGS.gb.use()});await p.waitForTimeout(100);await p.keyboard.press('Escape');await until(()=>House.mode==='walk');await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>House.THINGS.gb.st),'rest');
assert.deepEqual(errors,[]);console.log('HANDHELD PASS');
}finally{await b.close()}
