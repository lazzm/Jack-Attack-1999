import assert from'node:assert/strict';import{writeFile}from'node:fs/promises';import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]);const samples=[];
try{
 await p.evaluate(()=>House.ambient.clear());await view([-15,-55,105],[0,-17,-12]);await p.evaluate(()=>{House._.setMode('walk');House.anims.set('budget-test',()=>true)});
 for(let n=0;n<9;n++){await p.waitForTimeout(1000);samples.push(await p.evaluate(()=>({fps:House.Q.fps,scale:House.Q.renderScale,pixelRatio:House.Q.pixelRatio,pixels:House.ren.domElement.width*House.ren.domElement.height})));}
 console.log('ADAPTIVE',JSON.stringify(samples));assert(samples.some(s=>s.scale<1),'Software GPU did not reduce pixel budget');assert(samples.every(s=>s.scale>=.5&&s.scale<=1));
 await p.evaluate(()=>House.anims.delete('budget-test'));await p.screenshot({path:'shots/adaptive-room.png'});
 const scale=await p.evaluate(()=>House.Q.renderScale);await p.waitForTimeout(1700);assert.equal(await p.evaluate(()=>House.Q.renderScale),scale,'Idle time changed the resolution budget');
 await p.evaluate(()=>{House.hush();House.sitDown()});await until(()=>House.mode==='monitor');await p.evaluate(()=>House.desktopDisplay(true));await p.waitForTimeout(500);
 assert.equal(await p.locator('.hs-gl').isVisible(),false);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'visible');
 await p.evaluate(()=>{window.budgetRender=House.ren.render;window.hiddenRoomDraws=0;House.ren.render=function(...a){window.hiddenRoomDraws++;return window.budgetRender.apply(this,a)}});await p.waitForTimeout(2200);assert.equal(await p.evaluate(()=>window.hiddenRoomDraws),0,'LOCK IN drew the covered room');
 await p.screenshot({path:'shots/adaptive-pc-lock.png'});await p.evaluate(()=>{House.ren.render=window.budgetRender;House.desktopDisplay(false)});await p.waitForTimeout(500);assert(await p.locator('.hs-gl').isVisible());
 await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/adaptive-room-narrow.png'});
 await p.evaluate(()=>House.gfx('medium'));await p.waitForTimeout(600);assert(await p.evaluate(()=>House.ren.getContext().getContextAttributes().antialias));await p.evaluate(()=>House.gfx('auto'));await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>House.ren.getContext().getContextAttributes().antialias),false);assert.equal(await p.evaluate(()=>House.Q.tier),'low','Software renderer classification was forgotten');
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.screenshot({path:'shots/adaptive-refreshed-narrow.png'});assert.deepEqual(errors,[]);await writeFile('shots/adaptive-samples.json',JSON.stringify(samples,null,2));console.log('ADAPTIVE PASS: resolution reacts to load, stays bounded/idle-stable, native desktop/fullscreen skip, graphics context switch and refresh');
}finally{await browser.close()}
