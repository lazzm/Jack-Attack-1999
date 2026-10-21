import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:18340';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1366,height:860}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
await p.addInitScript(()=>{localStorage.setItem('jhp_everbooted','1');localStorage.setItem('jhp_last',String(Date.now()))});
async function until(fn){for(let i=0;i<200;i++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('timeout '+fn)}
try{
await p.goto(base,{waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='monitor'&&window.PMGL?.built);await until(()=>!document.querySelector('.hs-loading'));
await p.keyboard.press('F2');await until(()=>House.mode==='walk');
await p.evaluate(()=>{House.hush();House.grab('cube')});await p.keyboard.press('f');await until(()=>House.mode==='inspect');
await p.screenshot({path:'shots/inspect-cube-front.png'});
const state=await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state));
// Drag an actual visible sticker; not a synthetic replacement view.
const point=await p.evaluate(()=>{const t=House.THINGS.cube;const ray=new THREE.Raycaster();ray.layers.enableAll();for(let y=250;y<600;y+=30)for(let x=450;x<900;x+=30){ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),House.camera);const hit=ray.intersectObject(t.obj,true).find(h=>h.object.userData.cubie);if(hit)return{x,y}}});
assert(point);await p.mouse.move(point.x,point.y);await p.mouse.down();await p.mouse.move(point.x+100,point.y+30,{steps:10});await p.mouse.up();await p.waitForTimeout(400);
assert.notEqual(await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state)),state);
await p.mouse.move(680,420);await p.mouse.down({button:'right'});await p.mouse.move(950,570,{steps:15});await p.mouse.up({button:'right'});await p.screenshot({path:'shots/inspect-cube-rear.png'});
await p.evaluate(async()=>{const c=House.THINGS.cube.obj.userData.cube,s=JSON.stringify(c.state);for(let i=0;i<4;i++){c.twist({a:1,l:1,d:1});c.finish()}if(JSON.stringify(c.state)!==s)throw Error('Four turns did not restore cube')});
await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>House.held()),'cube');await p.keyboard.press('Escape');await p.waitForTimeout(700);
await p.evaluate(()=>House.inspect('gb'));await p.waitForTimeout(300);await p.screenshot({path:'shots/inspect-handheld-front.png'});
await p.mouse.move(680,400);await p.mouse.down();await p.mouse.move(1080,400,{steps:20});await p.mouse.up();await p.screenshot({path:'shots/inspect-handheld-rear.png'});
const savedCube=await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state));
await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='walk'&&!document.querySelector('.hs-loading'));assert.equal(await p.evaluate(()=>House.THINGS.gb.st),'rest');assert.equal(await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state)),savedCube);
assert.deepEqual(errors,[]);console.log('INSPECT PASS');
}finally{await b.close()}
