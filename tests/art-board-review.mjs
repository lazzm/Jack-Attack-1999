// Focused final UV/ink review; supplied localhost server must use disposable data.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
import {localBase} from './art-gallery.mjs';
const base=localBase(process.argv[2]),run=new Date().toISOString().replace(/[:.]/g,'-');
const shots=fileURLToPath(new URL('shots/art-gallery/board-final-'+run+'/',import.meta.url));
const account='BoardArt'+Date.now().toString(36),password='Throwaway-1999';
await mkdir(shots,{recursive:true});
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
let fixture;
try{
 fixture=await roomFixture(base,{account,password,signup:false,width:640,height:480,onPage:async p=>{await p.emulateMedia({reducedMotion:'reduce'})}});
 const {page,view,until}=fixture;
 async function decoded(){
  await until(()=>window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
  await page.evaluate(async()=>{await PrintArt.ready;await HouseArt.postersReady;await document.fonts.ready});
  assert.deepEqual(await page.evaluate(()=>Object.entries(PrintArt.status).filter(([,s])=>s!=='generated').map(([k])=>k)),[]);
  assert.deepEqual(await page.evaluate(()=>['board.property','board.cat','board.doctor'].map(k=>PrintArt.has(k))),[true,true,true]);
 }
 await decoded();await page.setViewportSize({width:1366,height:860});
 for(const [name,eye,target]of [
  ['front',[-140,-150,145],[-158,-90,233]],
  ['left',[-200,-125,185],[-158,-91,233]],
  ['close',[-155,-130,187],[-155,-90,234]],
  ['right',[-95,-125,190],[-158,-91,233]]
 ]){await view(eye,target);await page.screenshot({path:shots+name+'.png',timeout:60000})}
 await page.reload({waitUntil:'domcontentloaded',timeout:90000});
 await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.PMGL?.built&&!House.gliding);
 await decoded();
 await view([-155,-130,187],[-155,-90,234]);await page.screenshot({path:shots+'close-after-refresh.png',timeout:60000});
 assert.deepEqual(fixture.errors,[]);
 console.log('PASS final board artwork: four real-room angles plus reload, no missing generated keys or browser errors');
 console.log(shots);
}finally{await fixture?.browser.close()}
