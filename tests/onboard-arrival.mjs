// Arrival uses the real calendar override, signup, seasonal pack and family welcome.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],date=process.argv[3];
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));assert(['11-03','06-14'].includes(date));
const dir=new URL('shots/onboard/',import.meta.url);await mkdir(dir,{recursive:true});
const f=await roomFixture(base+'/?date99='+date,{opening:true,width:412,height:915,touch:true,contextOptions:{isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'},storage:{jhp_touch_slow_asked:true},onPage:async p=>{
 await p.addInitScript(()=>{
  window.__arrival={peak:0,lines:[],profile:[],pollReady:false};
  // Preserve the old mobile polling observer alongside script-load binding, so
  // a missed early reply can be distinguished from a blocked profile import.
  (function poll(){if(!window.Net?.on){setTimeout(poll,0);return;}for(const t of ['rmSame','rmNone'])Net.on(t,()=>window.__arrival.pollReady=true);Net.on('rmData',()=>window.__arrival.pollReady=false);})();
  let bound=false,last='';
  const bind=()=>{if(bound||!window.Net?.on)return;bound=true;for(const t of ['rmSame','rmNone','rmData','rmSaved'])Net.on(t,()=>window.__arrival.profile.push(t));};
  document.addEventListener('load',bind,true);const timer=setInterval(()=>{bind();if(bound)clearInterval(timer);},10);
  const scan=()=>{
   if(!window.AccountGate?.allowed||!window.House?.live)return;
   const lines=[...document.querySelectorAll('.hs-note.on,.hs-voice.on,.hs-call.on,.np-bub:not(.np-out)')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!el.hidden;}).map(el=>el.textContent.replace(/×$/,'').trim());
   window.__arrival.peak=Math.max(window.__arrival.peak,lines.length);
   const key=lines.join('\n');if(key&&key!==last)window.__arrival.lines.push(...lines);last=key;
  };
  new MutationObserver(scan).observe(document,{subtree:true,attributes:true,childList:true,characterData:true});
 });
}});
const {page:p,until,browser}=f,shot=async n=>p.screenshot({path:new URL(`round2-${date}-${n}.png`,dir).pathname});
try{
 await until(()=>!!window.HouseLife&&!!window.Season);await shot('arrival');
 assert.equal(await p.evaluate(()=>Desk.today99().m*100+Desk.today99().d),date==='11-03'?1103:614);
 // Let both automatic welcomes play for their original reading time, without hushing or clicking them away.
 await until(()=>window.__arrival.lines.some(s=>/kettle on|Tea.s nearly ready/.test(s)));
 await shot('mom');
 if(date==='11-03')await until(()=>window.__arrival.lines.some(s=>s.includes('Bonfire Night on Friday')));
 await until(()=>!document.querySelector('.hs-note.on,.hs-voice.on,.np-bub:not(.np-out)'));
 assert.equal(await p.evaluate(()=>window.__arrival.peak),1,'Arrival messages overlap');
 const arrival=await p.evaluate(()=>window.__arrival);
 assert.equal(arrival.lines.filter(s=>/kettle on|Tea.s nearly ready/.test(s)).length,1,'Welcome must appear once');
 if(date==='11-03')assert.equal(arrival.lines.filter(s=>s.includes('Bonfire Night on Friday')).length,1,'Seasonal note must appear once');
 await shot('clear');
 // Both arrival orders use the same queue; a fresh line keeps its complete lifetime.
 await p.evaluate(()=>{House.say('Dad','The tools are back in the shed.',30000);HouseLife.voice('MOM','Come down when you are ready.',30000);});
 await until(()=>document.querySelector('.hs-note.on p')?.textContent==='The tools are back in the shed.');await shot('dad-first');await p.locator('.hs-note.on .rm-x').tap();await until(()=>document.querySelector('.hs-note.on p')?.textContent==='Come down when you are ready.');await shot('mom-next');await p.locator('.hs-note.on .rm-x').tap();
 assert.equal(await p.evaluate(()=>window.__arrival.peak),1);assert.deepEqual(f.errors,[]);
 const before=await p.evaluate(()=>window.__arrival);
 if(date==='06-14'){
  assert(await p.evaluate(()=>Roam.syncNow()),'The real profile upload was not acknowledged');
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>!!window.AccountGate?.allowed&&!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));
  await until(()=>window.__arrival.profile.includes('rmSame'));
  console.log('PROFILE RESUME',JSON.stringify(await p.evaluate(()=>({events:window.__arrival.profile,pollReady:window.__arrival.pollReady,mode:House.mode,member:!!Net.me.member}))));
  await shot('profile-resume');
 }
 await writeFile(new URL(`round2-${date}-report.json`,dir),JSON.stringify({arrival:before,resume:await p.evaluate(()=>window.__arrival)},null,2));
 console.log('ARRIVAL PASS',date,JSON.stringify(arrival));
}finally{await browser.close();}
