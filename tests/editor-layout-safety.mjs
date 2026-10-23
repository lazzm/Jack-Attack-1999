import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
const {browser,page,errors,until,view}=await roomFixture(process.argv[2]);
async function reload(){await page.reload({waitUntil:'domcontentloaded'});await until(()=>AccountGate.allowed&&House.live&&!document.querySelector('.hs-loading,#houseEntry'));await until(()=>!!House.SPOTS.lava.obj.userData.ed)}
try{
 await until(()=>!!House.SPOTS.lava.obj.userData.ed);
 const pose=await page.evaluate(()=>{const g=House.SPOTS.lava.obj,e=g.userData.ed;return{key:e.key,original:e.orig,file:g.userData.edSrc.file,room:e.room}});
 assert.equal(pose.key,'target|spot:lava','New edits still use fragile source lines as their identity');
 await page.evaluate(({key,original})=>{localStorage.setItem('jhp_god_edits',JSON.stringify({[key]:{original:{...original,x:original.x+17},now:{...original,x:999}}}));House.saveWalkState()},pose);
 await reload();assert.equal(await page.evaluate(()=>House.SPOTS.lava.obj.position.x),pose.original.x,'Stale source-line edit hit a different original model');
 await view([91,-14,40],[128,2,-36]);await page.screenshot({path:'shots/editor-stale-ignored.png'});
 await page.evaluate(({original,file,room})=>localStorage.setItem('jhp_god_edits',JSON.stringify({[room+'|'+file+':1|999']:{room,file:file+':1',original,now:{...original,x:original.x+1.5}}})),pose);
 await reload();assert.equal(await page.evaluate(()=>House.SPOTS.lava.obj.position.x),pose.original.x+1.5,'Unique legacy edit was lost when source lines moved');
 await view([91,-14,40],[128,2,-36]);await page.screenshot({path:'shots/editor-legacy-recovered.png'});
 await page.evaluate(({original,file,room})=>localStorage.setItem('jhp_god_edits',JSON.stringify({[room+'|'+file+':2|999']:{target:'spot:lava',room,file:file+':2',original:{...original,x:-88},now:{...original,x:original.x+2}}})),pose);
 await reload();assert.equal(await page.evaluate(()=>House.SPOTS.lava.obj.position.x),pose.original.x+2,'Stable target edit was lost');
 await page.evaluate(({original,room})=>localStorage.setItem('jhp_god_edits',JSON.stringify({legacy:{name:'spot:lava',room,original:{...original,x:-88},now:{...original,x:original.x+3}},broken:null})),pose);
 await reload();assert.equal(await page.evaluate(()=>House.SPOTS.lava.obj.position.x),pose.original.x+3,'Named legacy edit was lost after a factory pose changed');
 await page.setViewportSize({width:390,height:844});await view([91,-14,40],[128,2,-36]);await page.screenshot({path:'shots/editor-stable-narrow.png'});
 assert.deepEqual(errors,[]);console.log('EDITOR LAYOUT SAFETY PASS: stale-key rejection, unique legacy recovery, stable target recovery, desktop/narrow, repeated refresh');
}finally{await browser.close()}
