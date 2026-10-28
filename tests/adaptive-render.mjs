import assert from'node:assert/strict';import{writeFile}from'node:fs/promises';import{provisionedRoom as roomFixture}from'./provisioned-room.mjs';
const{browser,page:p,errors,until,view}=await roomFixture(process.argv[2]);const samples=[];
try{
 await p.evaluate(()=>House.ambient.clear());await view([-15,-55,105],[0,-17,-12]);await p.evaluate(()=>{House._.setMode('walk');House.anims.set('budget-test',()=>true)});
 for(let n=0;n<9;n++){await p.waitForTimeout(1000);samples.push(await p.evaluate(()=>({fps:House.Q.fps,adapt:House.Q.adapt,scale:House.Q.renderScale,pixelRatio:House.Q.pixelRatio,pixels:House.ren.domElement.width*House.ren.domElement.height})));}
 console.log('ADAPTIVE',JSON.stringify(samples));assert(samples.some(s=>s.adapt>3),'A struggling software GPU did not step down the invisible ladder');assert(samples.every(s=>s.scale>=.85&&s.scale<=1&&s.pixelRatio>=.85),'Never the blurry look');
 await p.evaluate(()=>House.anims.delete('budget-test'));await p.screenshot({path:'shots/adaptive-room.png'});
 const rung=await p.evaluate(()=>House.Q.adapt);await p.waitForTimeout(1700);assert.equal(await p.evaluate(()=>House.Q.adapt),rung,'Idle time changed the adaptation');
 await p.evaluate(()=>{House.hush();House.sitDown()});await until(()=>House.mode==='monitor');await p.evaluate(()=>House.desktopDisplay(true));await p.waitForTimeout(500);
 assert.equal(await p.locator('.hs-gl').isVisible(),false);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'visible');
 await p.evaluate(()=>{window.budgetRender=House.ren.render;window.hiddenRoomDraws=0;House.ren.render=function(...a){window.hiddenRoomDraws++;return window.budgetRender.apply(this,a)}});await p.waitForTimeout(2200);assert.equal(await p.evaluate(()=>window.hiddenRoomDraws),0,'LOCK IN drew the covered room');
 await p.screenshot({path:'shots/adaptive-pc-lock.png'});await p.evaluate(()=>{House.ren.render=window.budgetRender;House.desktopDisplay(false)});await p.waitForTimeout(500);assert(await p.locator('.hs-gl').isVisible());
 await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/adaptive-room-narrow.png'});
 assert.deepEqual(await p.evaluate(()=>({soft:House.Q.soft,aa:House.ren.getContext().getContextAttributes().antialias,tier:House.Q.tier})),{soft:true,aa:false,tier:'high'},'Software renderer: one look, no MSAA');
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&House.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
 await p.screenshot({path:'shots/adaptive-refreshed-narrow.png'});assert.deepEqual(errors,[]);await writeFile('shots/adaptive-samples.json',JSON.stringify(samples,null,2));console.log('ADAPTIVE PASS: resolution reacts to load, stays bounded/idle-stable, native desktop/fullscreen skip, software classification and refresh');
}finally{await browser.close()}
