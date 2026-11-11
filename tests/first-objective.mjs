// R242/R243: a brand-new player sees their first objective within a couple of seconds of arriving,
// on desktop and phone, even while Mom's arrival shout is on screen; before dawn Mom's arrival lines agree.
// Run from any folder: node /path/to/tests/first-objective.mjs [--before]
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const before=process.argv.includes('--before'),phase=before?'before':'after';
const out=path.join(here,'shots','first-objective',phase);await mkdir(out,{recursive:true});
const assets=['js/st-engine.js','css/st.css','js/hs-life.js','js/np-life.js'],findings=[],evidence=[];
const check=(ok,why)=>{if(!ok){findings.push(why);console.log('FINDING',why);if(!before)throw Error(why)}};
await withTestServer(async base=>{
 for(const [kind,hour] of [['desktop',5],['phone',5]]){
  const phone=kind==='phone';
  const f=await roomFixture(base,{account:'First'+kind+Date.now().toString(36),opening:true,hour,seed:3,touch:phone,width:phone?390:1366,height:phone?844:860,contextOptions:phone?{isMobile:true,deviceScaleFactor:1}:{},
   onPage:async p=>{await p.addInitScript(()=>{localStorage.setItem('jhp_touch_slow_asked','true');window.__lines=[];const seen=new Set();setInterval(()=>{for(const e of document.querySelectorAll('.np-bub p,.hs-voice p,.hs-call.on')){const t=e.textContent.trim();if(t&&!seen.has(t)){seen.add(t);window.__lines.push(t)}}},100)});if(before)for(const file of assets)await p.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.js')?'application/javascript':'text/css',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:path.join(here,'..'),encoding:'utf8'})}));}});
  const {page:p}=f;
  try{
   // Arrival: the house is on show and the player can act.
   const t0=Date.now();let seenAt=null,shot=false;
   for(let i=0;i<120;i++){
    const s=await p.evaluate(()=>{const o=document.querySelector('.st-objective');const r=o?.getBoundingClientRect();return{visible:!!o&&!o.hidden&&getComputedStyle(o).visibility!=='hidden'&&r.width>0,text:o?.textContent,shout:!!document.querySelector('.np-bub:not(.np-out),.hs-call.on,.hs-voice.on')}});
    if(s.visible&&seenAt===null){seenAt=(Date.now()-t0)/1000;evidence.push({kind,seenAt,text:s.text,shoutOnScreen:s.shout});}
    if(s.visible&&s.shout&&!shot){shot=true;await p.screenshot({path:path.join(out,kind+'-objective-with-shout.png')})}
    if(seenAt!==null&&(shot||i>40))break;await p.waitForTimeout(250);
   }
   // Keep watching through Mom's first call (about 7 s in): the objective stays up beside her shout.
   let hidden=0;for(let i=0;i<64;i++){const s=await p.evaluate(()=>{const o=document.querySelector('.st-objective');return{visible:!!o&&!o.hidden&&getComputedStyle(o).visibility!=='hidden',shout:!!document.querySelector('.np-bub.np-edge:not(.np-out),.hs-call.on')}});
    if(s.shout&&!s.visible)hidden++;if(s.shout&&s.visible&&!shot){shot=true;await p.screenshot({path:path.join(out,kind+'-objective-with-shout.png')})}await p.waitForTimeout(250)}
   await p.screenshot({path:path.join(out,kind+'-settled.png')});evidence.push({kind,hiddenDuringShout:hidden});
   check(hidden===0,kind+': the objective hid behind an off-screen shout ('+hidden+' samples)');
   const lines=await p.evaluate(()=>window.__lines);evidence.push({kind,lines});
   console.log('MEASURE',kind,'objective after',seenAt,'s; lines',JSON.stringify(lines));
   check(seenAt!==null&&seenAt<=3,kind+': first objective took '+seenAt+' s');
   check(!(lines.some(l=>/kettle|coming down/i.test(l))&&lines.some(l=>/Still awake|late/i.test(l))),kind+': contradicting arrival lines before dawn '+JSON.stringify(lines));
  }finally{await f.browser.close()}
 }
});
await writeFile(path.join(out,'evidence.json'),JSON.stringify({phase,findings,evidence},null,1));
console.log(before?'SUMMARY first-objective before: '+findings.length+' findings':'PASS first-objective');
