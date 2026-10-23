import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,until,view}=await roomFixture(process.argv[2],{touch:true});
try{
 await until(()=>!!window.HouseMobile?.thing);
 await view([-15,-55,105],[0,-17,-12]);await p.evaluate(()=>{House.ambient.clear();House._.setMode('walk');House.dirty()});await p.waitForTimeout(400);
 const calls=await p.evaluate(()=>House.ren.info.render.calls);assert(calls<280,'PC-facing scene regressed: '+calls+' draws');console.log('DESK DRAWS',calls);
 await p.screenshot({path:'shots/desk-batched.png'});
 await p.evaluate(()=>{House.hush();House.grab('cube');House.inspect('cube')});await until(()=>House.mode==='inspect');
 assert.equal(await p.evaluate(()=>House.THINGS.cube.obj.children[0].children.length),26);
 const state=await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state));
 await p.screenshot({path:'shots/desk-cube-front.png'});
 const point=await p.evaluate(()=>{const t=House.THINGS.cube,ray=new THREE.Raycaster();ray.layers.enableAll();for(let y=250;y<600;y+=30)for(let x=450;x<900;x+=30){ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),House.camera);if(ray.intersectObject(t.obj,true).some(h=>h.object.userData.cubie))return{x,y}}});
 assert(point);await p.mouse.move(point.x,point.y);await p.mouse.down();await p.mouse.move(point.x+100,point.y+30,{steps:10});await p.mouse.up();await p.waitForTimeout(400);
 assert.notEqual(await p.evaluate(()=>JSON.stringify(House.THINGS.cube.obj.userData.cube.state)),state);
 await p.mouse.move(680,420);await p.mouse.down({button:'right'});await p.mouse.move(950,570,{steps:15});await p.mouse.up({button:'right'});await p.screenshot({path:'shots/desk-cube-back.png'});
 await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.evaluate(()=>{House.putBack();House.hush();HouseMobile.use()});
 await until(()=>window.FamilyPhone?.isOpen()&&document.querySelectorAll('.hs-phone-key').length===16);
 await p.screenshot({path:'shots/desk-phone.png'});await p.locator('.hs-phone-key[aria-label="Phone Menu / Select"]').tap();await p.keyboard.press('ArrowDown');
 await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('.hs-jump').isVisible(),false);assert.equal(await p.locator('.hs-duck').isVisible(),false);await p.screenshot({path:'shots/desk-phone-narrow.png'});await p.keyboard.press('q');await until(()=>House.mode==='walk');
 await p.setViewportSize({width:1366,height:860});await p.evaluate(()=>{House.hush();House.sitDown()});await until(()=>House.mode==='monitor');
 for(const [width,height]of [[1366,768],[1920,1080],[2560,1080],[390,844]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'visible');await p.screenshot({path:`shots/desk-monitor-${width}.png`});
 }
 await p.keyboard.press('t');assert(await p.evaluate(()=>House.desktopDisplay()));await p.keyboard.press('t');assert.equal(await p.evaluate(()=>House.desktopDisplay()),false);
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>House?.mode==='monitor'&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'visible');
 await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.screenshot({path:'shots/desk-exit-narrow.png'});
 await p.setViewportSize({width:1366,height:860});await p.evaluate(()=>House.setDoor('bedroom',false,true));
 await view([320,-55,260],[245,-30,190]);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'hidden','Desktop leaked through a closed door during a view');
 await p.screenshot({path:'shots/desk-closed-door-occlusion.png'});await p.evaluate(()=>{House._.setMode('walk');House.dirty()});await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'hidden');
 assert.deepEqual(errors,[]);console.log('DESK CONTROL PASS: reduced drawing, physical cube drag/rotation, live phone/keys, 4 monitor sizes, LOCK IN, seated refresh and Q exit');
}finally{await browser.close()}
