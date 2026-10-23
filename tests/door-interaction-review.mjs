import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,view,until}=await roomFixture(process.argv[2]);
async function frame(name,eye,target,level='U'){
 await p.setViewportSize({width:1366,height:860});await view(eye,target,{level});await p.screenshot({path:'shots/house-fix-'+name+'.png'});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/house-fix-'+name+'-narrow.png'});
}
try{
 for(const [name,eye,target,level]of [
 ['parents-guard',[290,-55,540],[340,-10,660],'U'],['parents-reverse',[300,-55,670],[350,-15,530],'U'],
 ['bedroom-reveal',[320,-55,260],[245,-30,190],'U'],
 ['cupboard-closed',[270,230,400],[329,295,400],'G'],['coats',[300,210,570],[215,240,640],'G'],['coats-side',[270,225,685],[212,240,620],'G'],
 ['sofa',[-40,225,440],[-60,305,560],'G'],['sofa-side',[-170,230,485],[-60,305,560],'G'],['armchair',[-25,225,490],[110,300,430],'G'],
 ['kitchen-clearance',[130,215,80],[75,205,-53],'G'],['fence',[110,225,-450],[195,280,-550],'G'],['flowerbed',[-135,260,-200],[-240,340,-270],'G']])await frame(name,eye,target,level);
 await p.setViewportSize({width:1366,height:860});
 // Real hit testing and input must only actuate the leaf. Neither the distant
 // interaction nor repeated local clicks may move the camera to another floor.
 await view([270,225,400],[329,295,400],{level:'G'});await p.evaluate(()=>{House.hush();House._.setMode('walk')});
 assert.equal(await p.evaluate(()=>House.pick(innerWidth/2,innerHeight/2)?.spot),'hs.cupdoor');
 let before=await p.evaluate(()=>[House.P.x,House.P.y,House.P.z,House.W.lvl]);
 await p.keyboard.press('f');await until(()=>House.DOORS.cupboard.ang===1);
 assert.deepEqual(await p.evaluate(()=>[House.P.x,House.P.y,House.P.z,House.W.lvl]),before);
 await frame('cupboard-open',[270,230,400],[329,295,400],'G');
 await p.setViewportSize({width:1366,height:860});await view([270,225,400],[329,295,400],{level:'G'});await p.evaluate(()=>{House.hush();House._.setMode('walk')});
 for(let i=0;i<6;i++){await p.evaluate(()=>House.useAt(innerWidth/2,innerHeight/2,false));await p.waitForTimeout(85)}
 await p.waitForTimeout(700);assert.deepEqual(await p.evaluate(()=>[House.P.x,House.P.y,House.P.z,House.W.lvl]),before);
 await p.keyboard.press('Escape');await until(()=>HousePause.open);await p.keyboard.press('Escape');
 await p.evaluate(()=>{House.saveWalkState();Room._.emit('close')});await p.waitForTimeout(900);
 assert.deepEqual(await p.evaluate(()=>[House.P.x,House.P.y,House.P.z,House.W.lvl]),before);
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.House?.mode==='walk'&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(await p.evaluate(()=>House.W.lvl),'G');
 // Prove the far-distance branch with the actual nearest door's own range.
 await view([270,225,400],[329,295,400],{level:'G'});await p.evaluate(()=>{House.hush();House._.setMode('walk');window.savedDoorRange=House.SPOTS['hs.cupdoor'].range;House.SPOTS['hs.cupdoor'].range=10});
 before=await p.evaluate(()=>[House.P.x,House.P.y,House.P.z,House.W.lvl,House.DOORS.cupboard.open]);
 await p.evaluate(()=>House.useAt(innerWidth/2,innerHeight/2,false));await p.waitForTimeout(900);
 assert.deepEqual(await p.evaluate(()=>[House.P.x,House.P.y,House.P.z,House.W.lvl,House.DOORS.cupboard.open]),before);
 await p.evaluate(()=>House.SPOTS['hs.cupdoor'].range=window.savedDoorRange);
 assert.deepEqual(errors,[]);console.log('HOUSE REVIEW PASS: door F/click, rapid input, pause, downstairs close, refresh and far interaction preserve floor/position; 26 desktop/narrow model views');
}finally{await browser.close()}
