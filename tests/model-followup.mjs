import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page:p,errors,view,until}=await roomFixture(process.argv[2],{touch:true});
try{
 for(const[name,eye,target,level]of [
 ['trophy',[25,-159,-5],[16,-140,-47],'U'],['coaster',[-10,-166,15],[-10,-140,-47],'U'],
 ['reveal',[320,-55,260],[245,-30,190],'U'],['fence',[110,225,-450],[195,280,-550],'G']]){
  await p.setViewportSize({width:1366,height:860});await view(eye,target,{level});await p.screenshot({path:'shots/model-final-'+name+'.png'});
  if(name==='reveal'){await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('monitorSurface')).visibility),'hidden','Closed door must hide the desktop in focused views')}
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/model-final-'+name+'-narrow.png'});
 }
 await until(()=>!!window.RoomHiFi?.state);
 await view([-173,-55,185],[-249,-24,212]);await p.evaluate(()=>{House.hush();House._.setMode('walk')});await p.waitForTimeout(300);
 const play=await p.evaluate(()=>House.toScreen(-243,-14.7,217.1));assert(play);
 assert.equal(await p.evaluate(({x,y})=>House.pick(x,y)?.spot,play),'hifi.play');
 await p.touchscreen.tap(play.x,play.y);await until(()=>RoomHiFi.state.open&&House.SNAPS['hifi.cd'].enabled());
 await p.screenshot({path:'shots/model-final-hifi-touch.png'});
 await p.evaluate(()=>{House.hush();House.act('hifi.eject')});await until(()=>!RoomHiFi.state.open);
 assert.deepEqual(errors,[]);console.log('MODEL FOLLOWUP PASS: trophy/coaster/doorway/fence desktop/narrow, physical hi-fi touch use/open/close');
}finally{await browser.close()}
