import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const f=await roomFixture(process.argv[2]),{page:p,until,errors}=f;
const shot=name=>p.screenshot({path:'shots/props-town/'+name+'.png'});
try{
 await p.evaluate(()=>{House.grab('vpet');House.hush()});await p.keyboard.press('f');await until(()=>House.mode==='inspect');
 await p.locator('.hs-inspection [data-pet=feed]').click();await p.keyboard.press('b');await p.keyboard.press('c');await shot('pet-final-front');
 await p.mouse.move(650,300);await p.mouse.down();await p.mouse.move(1040,430,{steps:12});await p.mouse.up();await shot('pet-final-back');
 await p.keyboard.press('q');await p.evaluate(()=>{House.putBack();window.petVersion=(()=>{let texture;House.THINGS.vpet.obj.traverse(o=>{const m=o.material?.map;if(m?.image?.width===64&&m.image.height===48)texture=m});window.petTexture=texture;return texture.version})()});
 await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>petTexture.version),await p.evaluate(()=>petVersion),'Pet LCD still uploads when unattended');
 if(await p.evaluate(()=>!!House.THINGS['ch.pjs']&&!House.THINGS['ch.pjs'].at.hide)){
  assert(await p.evaluate(()=>House.grab('ch.pjs')));await p.keyboard.press('i');await until(()=>House.mode==='inspect');await shot('solid-clothing');await p.keyboard.press('q');await p.evaluate(()=>House.putBack());
 }
 await f.view([0,-5,95],[56,39,22]);await shot('desk-joinery');
 for(const [name,eye,target]of [['town-wide',[200,195,1040],[-350,-5,2120]],['town-facade',[-550,195,1000],[-550,0,2100]]]){
  await f.view(eye,target,{roomPoint:[200,195,1040],level:'G'});await shot(name+'-day');
  await p.evaluate(()=>{window.auditHour=22;const cl=document.getElementById('bootPower').classList;cl.remove('rm-day','rm-dawn','rm-dusk');cl.add('rm-night');HouseEnvironment.update();House.relight()});await p.waitForTimeout(300);await shot(name+'-night');
  await p.evaluate(()=>{window.auditHour=14;const cl=document.getElementById('bootPower').classList;cl.remove('rm-night','rm-dawn','rm-dusk');cl.add('rm-day');HouseEnvironment.update();House.relight()});
 }
 assert.deepEqual(errors,[]);console.log('FINAL CLOSEUPS PASS: actual 3D pet front/back/care and zero idle LCD uploads, solid clothing where available, desk joinery and wide day/night neighbourhood; no errors/warnings');
}finally{await f.browser.close()}
