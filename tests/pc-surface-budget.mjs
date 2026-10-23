import assert from'node:assert/strict';import{writeFile}from'node:fs/promises';import{roomFixture}from'./room-fixture.mjs';
const{browser,page:p,errors,view}=await roomFixture(process.argv[2]);const rows=[];
try{
 await p.evaluate(()=>{House.ambient.clear();House.gfx('low')});await view([-15,-55,105],[0,-17,-12]);await p.evaluate(()=>{House._.setMode('walk');House.ren.setPixelRatio(.75);House.ren.setSize(innerWidth,innerHeight,false)});
 for(const variant of ['normal','crt','motion','both','hidden']){
  await p.evaluate(v=>{document.getElementById('surfaceBudget')?.remove();const s=document.createElement('style');s.id='surfaceBudget';s.textContent=v==='hidden'?'#monitorSurface{visibility:hidden!important}':(v==='crt'||v==='both'?'#crtglass,#crt{display:none!important}':'')+(v==='motion'||v==='both'?'#monitorSurface *,#monitorSurface *::before,#monitorSurface *::after{animation-play-state:paused!important;transition:none!important}':'');document.head.appendChild(s);for(const m of document.querySelectorAll('#monitorSurface marquee'))v==='motion'||v==='both'?m.stop():m.start()},variant);
  const r=await p.evaluate(()=>new Promise(resolve=>{let n=0,last=0;const times=[];function tick(t){if(last&&n>6)times.push(t-last);last=t;House.dirty();if(++n<45)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);resolve({frameMs:times[times.length>>1],p90:times[Math.floor(times.length*.9)],animations:document.getElementById('monitorSurface').getAnimations({subtree:true}).length,crt:!!document.getElementById('crtglass'),marquees:document.querySelectorAll('#monitorSurface marquee').length})}}requestAnimationFrame(tick)}));rows.push({variant,...r});console.log('PC SURFACE',variant,JSON.stringify(r));await p.screenshot({path:'shots/pc-surface-'+variant+'.png'});
 }
 assert.deepEqual(errors,[]);await writeFile('shots/pc-surface-budget.json',JSON.stringify(rows,null,2));
}finally{await browser.close()}
