// Before/after production web pages and Jotpad, using HEAD only for the baseline.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],shots=new URL('shots/games-1102/',import.meta.url).pathname;
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));await mkdir(shots,{recursive:true});
const names=['pm-cat.js','pm-media.js','apps-web.js','web-p3.js','web-p7.js','era-sites-bay.js'];
const original=new Map(names.map(n=>[n,execFileSync('git',['show','HEAD:app/public/js/'+n],{encoding:'utf8'})]));
const account='Copy'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const route='**/js/*.js*';
const f=await roomFixture(base,{account,password,signup:false,onPage:async p=>p.route(route,r=>{const src=original.get(new URL(r.request().url()).pathname.split('/').pop());return src?r.fulfill({contentType:'application/javascript',body:src}):r.continue()})});
const {page:p}=f;
const wait=async fn=>{const end=Date.now()+120000;while(Date.now()<end){if(await p.evaluate(fn))return;await p.waitForTimeout(150)}throw Error('Timeout '+fn)};
try{
 await p.evaluate(()=>House.sitDown());await wait(()=>House.mode==='monitor'&&!House.gliding);await p.evaluate(()=>House.desktopDisplay(true));
 for(const before of [true,false]){
  const tag=before?'before':'after';
  if(!before){await p.unroute(route);await p.reload({waitUntil:'domcontentloaded'});await wait(()=>window.House?.mode==='monitor'&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));}
  await p.evaluate(()=>PM.catalogue());await wait(()=>!!document.querySelector('.ppo-it[data-pp="podracer"]'));
  const card=p.locator('.ppo-it[data-pp="podracer"]');await card.scrollIntoViewIfNeeded();
  assert.match(await card.innerText(),before?/out this summer/:/out now/);
  await p.screenshot({path:shots+tag+'-pixelpost.png'});
  if(!before)assert(!await p.evaluate(()=>!!document.querySelector('.ppo-it[data-pp="podracer"] .ppo-flag')),'May game is not new in November');
  await p.evaluate(()=>IE.navigate('http://www.jarjardebate.kidz/'));await wait(()=>!!document.querySelector('.wp-jarjar h1'));
  assert.match(await p.locator('.wp-jarjar h1').innerText(),before?/JAR JAR JAMS/:/BLAH BLAH BLINKS/);
  await p.screenshot({path:shots+tag+'-debate.png'});
  if(!before){await p.setViewportSize({width:412,height:915});await p.screenshot({path:shots+tag+'-debate-narrow.png'});await p.setViewportSize({width:1366,height:860});}
  await p.evaluate(()=>IE.navigate('http://www.jackbay.webcom/item/gameboy.html'));await wait(()=>document.querySelector('.gb')?.textContent.includes('Grey Brick'));
  assert.match(await p.locator('.gb').innerText(),before?/tetris_tim/:/blockology_tim/);
  await p.screenshot({path:shots+tag+'-jackbay.png'});
  const src=before?execFileSync('git',['show','HEAD:app/public/js/apps-fun.js'],{encoding:'utf8'}):await readFile(new URL('../app/public/js/apps-fun.js',import.meta.url),'utf8');
  const text=JSON.parse(src.match(/\['high scores\.txt', ("[^\n]*")\],/)[1]);
  await p.evaluate(text=>Desk.notepad('high scores.txt',text),text);await p.screenshot({path:shots+tag+'-high-scores.png'});
  assert.match(text,before?/Tetris:/:/Blockology:/);
  await p.evaluate(()=>document.querySelectorAll('#monitorSurface .float .ctl [aria-label="Close"]').forEach(b=>b.click()));
 }
 assert.deepEqual(f.errors,[]);console.log('COPY REVIEW PASS: original defects and updated Pixel Post/debate/seller/high-scores lettering, narrow debate');
}catch(e){await p.screenshot({path:shots+'copy-failure.png'});throw e}finally{await f.browser.close()}
