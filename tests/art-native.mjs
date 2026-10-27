// Fast production-compositor regression, NOT proof of physical visibility.
// Uses only the supplied disposable localhost server; does not start a server.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {localBase} from './art-gallery.mjs';
const base=localBase(process.argv[2]),shots=fileURLToPath(new URL('shots/art-gallery/',import.meta.url));
await mkdir(shots,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1366,height:860}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const original=window.fetch;window.__artBeforeParse=[];window.fetch=function(src,...args){if(String(src).includes('/art/')&&document.readyState==='loading')window.__artBeforeParse.push(String(src));return original.call(this,src,...args)}});
 const scripts=['vendor/three.min.js','js/hs-kit.js','js/print-art-data.js','js/print-art.js','js/magazine-cat.js','js/hs-art.js'];
 await page.route(base+'/__art_native_test__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>'+scripts.map(file=>'<script src="'+base+'/'+file+'"></script>').join('')+'</body></html>'}));
 await page.goto(base+'/__art_native_test__');
 const result=await page.evaluate(async()=>{
  await PrintArt.ready;await HouseArt.postersReady;
  document.body.style.cssText='margin:20px;background:#d9cfb8;display:flex;gap:20px;align-items:flex-start';
  const c=document.createElement('canvas');c.width=384;c.height=512;
  const g=c.getContext('2d'),heading=[];const fillText=g.fillText;
  g.fillText=function(text,x,y,...rest){if(text==='JACK ATTACK!')heading.push({text,width:this.measureText(text).width,x});return fillText.call(this,text,x,y,...rest)};
  PrintArt.magazine(g,MagazineCat.ISSUES[0],384,512);document.body.append(c);
  const poster=HouseArt.t('posterFilm').image;poster.style.width='358px';poster.style.height='501px';document.body.append(poster);
  // This is an explicit fit/crop diagnostic, not a fabricated in-game case.
  const zip=document.createElement('canvas');zip.width=512;zip.height=452;
  const z=zip.getContext('2d');z.fillStyle='#255b69';z.fillRect(0,0,512,452);
  PrintArt.paint(z,'dc.dash',12,64,488,260,'contain');zip.style.width='480px';document.body.append(zip);
  return{heading,early:window.__artBeforeParse,missing:Object.entries(PrintArt.status).filter(([,status])=>status!=='generated').map(([key])=>key)};
 });
 assert.deepEqual(result.missing,[]);assert.deepEqual(result.early,[]);assert(result.heading.every(h=>h.width<=352&&h.x===192));
 await page.screenshot({path:shots+'native-fixes-current.png',timeout:30000});
 assert.deepEqual(errors,[]);console.log('PASS native production magazine/poster and full-silhouette fit diagnostic');
}finally{await browser.close()}
