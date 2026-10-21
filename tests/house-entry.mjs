import{chromium}from'playwright';import assert from'node:assert/strict';
const base=process.argv[2]||'http://localhost:18380';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
async function until(p,fn){for(let n=0;n<300;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(200)}throw Error('State timeout '+fn)}
try{
 for(const [name,width,height]of[['desktop',1366,860],['phone',390,844]]){
  const p=await b.newPage({viewport:{width,height},isMobile:name==='phone',hasTouch:name==='phone'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
  let release;const gate=new Promise(r=>release=r);
  await p.route('**/js/hs-world.js*',async route=>{await gate;await route.continue()});
  const nav=p.goto(base,{waitUntil:'domcontentloaded'});
  await p.locator('#houseEntry').waitFor();
  assert.equal(await p.locator('.pc-stage').evaluate(el=>getComputedStyle(el).visibility),'hidden','Legacy PC intro must not flash while loading');
  await p.screenshot({path:`shots/entry-loading-${name}.png`});release();await nav;await p.unroute('**/js/hs-world.js*');
  await until(p,()=>window.House?.mode==='walk'&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.W.seat),false);assert(await p.evaluate(()=>House._.cellOk(House.W.lvl,House.W.x,House.W.z)),'Entry must be walkable');
  await p.evaluate(()=>House.hush());await p.screenshot({path:`shots/entry-room-${name}.png`});
  const before=await p.evaluate(()=>{House.P.ry+=30;House.dirty();return{x:House.W.x,z:House.W.z,ry:House.P.ry}});
  await p.waitForTimeout(400);await p.screenshot({path:`shots/entry-turned-${name}.png`});
  await p.reload({waitUntil:'domcontentloaded'});await until(p,()=>window.House?.mode==='walk'&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  assert(await p.evaluate(s=>Math.hypot(House.W.x-s.x,House.W.z-s.z)<.2&&Math.abs(House.P.ry-s.ry)<.2,before),'Refresh must retain the room position');
  if(name==='desktop'){
   await p.evaluate(()=>Room.look('desk'));await until(p,()=>House.mode==='walk'&&House.W.seat);
   await p.evaluate(()=>House.act('pc.power'));await until(p,()=>!!document.querySelector('.logon [data-g]'));await p.locator('.logon [data-g]').click();await until(p,()=>House.mode==='monitor'&&!document.querySelector('.logon'));
   await p.screenshot({path:'shots/entry-manual-pc.png'});
  }
  assert.deepEqual(errors,[]);await p.close();console.log('ENTRY PASS',name);
 }
 // Simulate the renderer-unavailable branch without depending on host GPU settings.
 const p=await b.newPage({viewport:{width:390,height:844}});
 await p.route('**/js/hs-world.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.House={ok:false};'}));
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.getByText('3D GRAPHICS UNAVAILABLE',{exact:true}).waitFor();
 assert.equal(await p.locator('.pc-stage').evaluate(el=>getComputedStyle(el).visibility),'hidden');assert(await p.getByRole('button',{name:'Reload',exact:true}).isVisible());
 await p.screenshot({path:'shots/entry-no-webgl.png'});await p.close();console.log('ENTRY FALLBACK PASS');
}finally{await b.close()}
