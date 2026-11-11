// R254: on a short landscape phone, queued achievement/rank/item balloons wait in the JackOS tray instead of
// popping up over the small desktop or an open window; a tap on the tray shows them; quick replies still show.
// Run from any folder: node /path/to/tests/desk-tray.mjs [--before]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const before=process.argv.includes('--before'),phase=before?'before':'after';
const out=path.join(here,'shots','desk-tray',phase);await mkdir(out,{recursive:true});
const assets=['js/desk.js','style.css'],findings=[],evidence={};
const check=(ok,why)=>{if(!ok){findings.push(why);console.log('FINDING',why);if(!before)throw Error(why)}};
await withTestServer(async base=>{
 const name='Tray',password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name,pass:password})})).ok);
 const f=await roomFixture(base,{account:name,password,signup:false,resume:true,opening:true,hour:12,seed:1999,touch:true,width:844,height:390,contextOptions:{isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'},storageState:await bonfireLogin(base,password,name,{pv:12,x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),onPage:async p=>{await p.addInitScript(()=>localStorage.setItem('jhp_touch_slow_asked','true'));if(before)for(const file of assets)await p.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.js')?'application/javascript':'text/css',body:execFileSync('git',['show','HEAD:app/public/'+file],{cwd:path.join(here,'..'),encoding:'utf8'})}));}});
 const {page:p,until}=f;
 const shot=async n=>{await p.screenshot({path:path.join(out,n+'.png')});console.log('CAPTURE',n)};
 try{
  await f.view([40,-55,155],[-15,-24,0],{level:'U'});await p.evaluate(()=>{House._.setMode('walk');House.dirty()});await p.waitForTimeout(500);
  await p.keyboard.press('f');await until(()=>House.mode==='monitor'&&!House.gliding&&window.DesktopSurface?.ready());
  for(let i=0;i<3&&!(await p.evaluate(()=>House.desktopDisplay()));i++){const lock=p.locator('.ht-hud [data-k="lock"]');if(await lock.isVisible())await lock.tap();else await p.keyboard.press('t');await p.waitForTimeout(2500)}
  await until(()=>House.desktopDisplay()&&!House.anims.has('pc-lock'));await p.waitForTimeout(1500);
  // Let the first-minute welcome balloons settle, then queue the kind of notices the tester saw.
  await p.evaluate(()=>{document.querySelectorAll('#toastWrap .balloon').forEach(b=>b._gone?.())});
  await p.waitForTimeout(1000);const waiting=await p.evaluate(()=>+(document.querySelector('#trayNotices:not([hidden]) span')?.textContent||0));evidence.waitingBefore=waiting;
  await p.evaluate(()=>{Desk.toast('UNCOMMON ITEM FOUND!','Rubber Duck (tray test)');Desk.toast('★ ACHIEVEMENT ★','Tray Tester');Desk.toast('JackNet Rank 9: Tray Tester','+10 Rupees (tray test)')});
  await p.waitForTimeout(9000);
  const a=await p.evaluate(()=>({balloons:[...document.querySelectorAll('#toastWrap .balloon')].map(b=>b.textContent),tray:document.querySelector('#trayNotices:not([hidden])')?.textContent||null}));evidence.queued=a;await shot('queued');
  check(a.balloons.length===0,'notices popped up over the desktop: '+a.balloons.join(' | '));check(+a.tray>=waiting+3,'tray shows '+a.tray+' waiting notices (had '+waiting+')');
  // A quick reply to something the player just did still shows.
  await p.evaluate(()=>Desk.toast('Volume','All sound off.',1800));await p.waitForTimeout(700);
  const q=await p.evaluate(()=>[...document.querySelectorAll('#toastWrap .balloon')].map(b=>b.textContent));evidence.quick=q;check(q.some(t=>/Volume/.test(t)),'a quick reply was held back');
  await p.waitForTimeout(2500);
  if(!before){const n0=await p.evaluate(()=>+(document.querySelector('#trayNotices:not([hidden]) span')?.textContent||0));await p.locator('#trayNotices').tap();await p.waitForTimeout(700);const t=await p.evaluate(()=>({balloons:[...document.querySelectorAll('#toastWrap .balloon')].map(b=>b.textContent),tray:document.querySelector('#trayNotices:not([hidden])')?.textContent||null}));evidence.tapped=t;await shot('tray-tapped');
   check(t.balloons.length===1&&+t.tray<=n0-1,'tapping the tray shows one waiting notice '+JSON.stringify(t));}
  // A big screen shows new balloons as usual, and what waits in the tray stays there (no backlog flood).
  await p.evaluate(()=>document.querySelectorAll('#toastWrap .balloon').forEach(b=>b._gone?.()));await p.waitForTimeout(500);
  const held=await p.evaluate(()=>+(document.querySelector('#trayNotices:not([hidden]) span')?.textContent||0));
  await p.setViewportSize({width:1366,height:860});await p.waitForTimeout(3000);
  const flood=await p.evaluate(()=>[...document.querySelectorAll('#toastWrap .balloon')].map(b=>b.textContent));
  await p.evaluate(()=>Desk.toast('Wide screen','A new notice (tray test)',9000));await p.waitForTimeout(2500);
  const big=await p.evaluate(()=>({balloons:[...document.querySelectorAll('#toastWrap .balloon')].map(b=>b.textContent),tray:+(document.querySelector('#trayNotices:not([hidden]) span')?.textContent||0)}));evidence.big={held,flood,...big,gate:await p.evaluate(()=>({blk:document.querySelector('.jlogoff:not(.jlbye), .logon, .dialwin')?.className||null,boot:!!document.querySelector('#boot:not(.gone)'),body:document.body.className,mode:House.mode}))};await shot('wide');
  if(!before){check(flood.length===0,'growing the screen released held balloons: '+flood.join(' | '));check(big.balloons.some(t=>/Wide screen/.test(t)),'a new notice did not show on a big screen');check(big.tray>=held,'tray lost notices on a big screen');}
 }finally{await writeFile(path.join(out,'evidence.json'),JSON.stringify({phase,findings,evidence},null,1));await f.browser.close()}
});
console.log(before?'SUMMARY desk-tray before: '+findings.length+' findings':'PASS desk-tray');
