'use strict';
// Browser-only main comparison for self-starting suites. Serve all changed
// model/voice scripts from one pinned git ref; the test's /tmp server/state and
// ignored original voice pack remain its own normal fixture. The document
// remains a real localhost response for Chromium local-network classification.
// Its extra acting-data script is unused by the main rig. No git writes.
const {execFileSync}=require('node:child_process'),path=require('node:path'),{chromium}=require('./node_modules/playwright');
const root=path.resolve(__dirname,'..'),ref=process.env.MODELS_BASELINE_REF||'HEAD';
if(!/^[a-zA-Z0-9_.\/-]+$/.test(ref))throw Error('Invalid baseline ref');
const assets=new Map(['js/np-rig.js','js/np-life.js','js/st-voice.js'].map(file=>[file,execFileSync('git',['show',ref+':app/public/'+file],{cwd:root})]));
const launch=chromium.launch.bind(chromium);
chromium.launch=async function(options){
 const browser=await launch(options),context=browser.newContext.bind(browser);
 browser.newContext=async function(options){
  const ctx=await context(options);
  await ctx.addInitScript(()=>addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='t')return;setTimeout(()=>console.info('R8 MAIN T '+JSON.stringify({active:document.activeElement?.tagName,id:document.activeElement?.id,mode:window.House?.mode,locked:window.House?.desktopDisplay?.(),queued:window.House?.motion?.lockQueued})),0)}));
  ctx.on('page',page=>page.on('console',message=>{if(message.text().startsWith('R8 MAIN T '))console.log(message.text())}));
  await ctx.route('**/js/*',route=>{const url=new URL(route.request().url()),file=url.pathname==='/'?'index.html':url.pathname.slice(1),body=assets.get(file);return body?route.fulfill({body,contentType:file.endsWith('.html')?'text/html':'application/javascript'}):route.continue()});return ctx;
 };return browser;
};
