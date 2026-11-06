// Optional diagnostics for unmodified browser gates, including read-only main.
// NODE_OPTIONS=--require=<absolute path> node <browser test> ...
const artifactPath=p=>process.env.BLOCKER_MAIN_SHOTS==='1'&&typeof p==='string'?p.replace(/^\/opt\/stacks\/landing\/tests\/shots\//,'/opt/stacks/landing-train3/tests/shots/release-blockers/main/'):p;
if(process.env.BLOCKER_MAIN_SHOTS==='1'){
 const fs=require('node:fs');for(const name of ['mkdir','writeFile']){const original=fs.promises[name];fs.promises[name]=function(path,...args){return original.call(this,artifactPath(path),...args)}}
 require('node:module').syncBuiltinESMExports();
}
const {chromium}=require('playwright'),seen=new WeakSet(),launch=chromium.launch.bind(chromium);
async function instrument(p){
 if(seen.has(p))return p;seen.add(p);
 const screenshot=p.screenshot.bind(p);p.screenshot=options=>screenshot(options?.path?{...options,path:artifactPath(options.path)}:options);
 p.on('console',m=>{if(m.text().startsWith('BLOCKER '))console.log(m.text())});
 await p.addInitScript(()=>{for(const event of ['pointerdown','click'])document.addEventListener(event,e=>console.log('BLOCKER POINTER',JSON.stringify({event,target:e.target?.outerHTML?.slice(0,180),x:e.clientX,y:e.clientY,picking:!!window.stDiary?.picking,voice:!!document.querySelector('.hs-voice.on,.np-bub:not(.np-out)')})),true)});
 await p.route(/\/js\/(hs-world|hs-cases|st-diary|st-engine)\.js/,async r=>{
  const res=await r.fetch();let src=await res.text();if(process.env.BLOCKER_BASELINE==='1'&&r.request().url().includes('/hs-world.js'))src=require('node:child_process').execFileSync('git',['show','HEAD:app/public/js/hs-world.js'],{cwd:require('node:path').resolve(__dirname,'..'),encoding:'utf8'});
  if(r.request().url().includes('/hs-world.js')){
   src=src.replace('const g = computeGhost(t, sx, sy, true);',`const before=GP.res;const g=computeGhost(t,sx,sy,true);console.log('BLOCKER DROP',JSON.stringify({id:t.id,how,pose:{...P},drawn:window.__blockerDrawn,before:before&&{snap:before.snap?.id,ok:before.ok,x:before.x,y:before.y,z:before.z,why:before.why},fresh:{snap:g.snap?.id,ok:g.ok,x:g.x,y:g.y,z:g.z,why:g.why},aimPt}));`);
   src=src.replace("const g = how === 'user' ? drawnGhost.t === t && drawnGhost.g : computeGhost(t, sx, sy, true);","const g = how === 'user' ? drawnGhost.t === t && drawnGhost.g : computeGhost(t, sx, sy, true);console.log('BLOCKER COMMIT',JSON.stringify({id:t.id,how,pose:{...P},drawn:g&&{snap:g.snap?.id,ok:g.ok,x:g.x,y:g.y,z:g.z,why:g.why}}));");
   src=src.replace('camera.layers.set(0); renderLit(ren);',`camera.layers.set(0);renderLit(ren);window.__blockerDrawn=GP.res&&{id:held?.id,snap:GP.res.snap?.id,ok:GP.res.ok,x:GP.res.x,y:GP.res.y,z:GP.res.z,why:GP.res.why,pose:{...P}};`);
   src=src.replace('function onKey(ev) {',`function onKey(ev) {if(ev.key.toLowerCase()==='e')console.log('BLOCKER KEY',JSON.stringify({mode,held:held?.id,controlsPaused,worldLoading,view:viewOpen(),modal:ui.modalOpen(),active:document.activeElement?.outerHTML?.slice(0,150)}));`);
  }else if(r.request().url().includes('/hs-cases.js')){
   src=src.replace('function move(e,inserting){',`function move(e,inserting){console.log('BLOCKER CASE',JSON.stringify({id:e?.box.id,inserting,active:[...active],filled:e&&filled(e),enabled:e?.enabled?.(),held:H.held(),entries:[...entries.values()].filter(o=>o.slot===e?.slot).map(o=>({id:o.box.id,inserted:inserted(o),box:{st:o.box.st,snap:o.box.snap},medium:{st:o.medium.st,snap:o.medium.snap}}))}));`);
  }else if(r.request().url().includes('/st-diary.js')){
   src=src.replace('function picker(redraw = false) {',`function picker(redraw=false){if(redraw!==true)console.log('BLOCKER PICKER',JSON.stringify({mode:window.House?.mode,glide:window.House?.gliding,paused:window.House?.paused,focused:window.House?.focused,picking:!!questPage?.open}));`);
  }
  await r.fulfill({response:res,body:src});
 });return p;
}
chromium.launch=async(...args)=>{const b=await launch(...args),newPage=b.newPage.bind(b),newContext=b.newContext.bind(b);b.newPage=async(...args)=>instrument(await newPage(...args));b.newContext=async(...args)=>{const c=await newContext(...args),np=c.newPage.bind(c);c.newPage=async(...args)=>instrument(await np(...args));return c};return b};
