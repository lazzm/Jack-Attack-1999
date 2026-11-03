import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('shots/onboard/',import.meta.url);await mkdir(dir,{recursive:true});
const name='Popup'+Date.now().toString(36),pass='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name,pass})})).ok);
const f=await roomFixture(base,{account:name,password:pass,signup:false,debug:true,onPage:async p=>{
 await p.addInitScript(()=>{window.addEventListener('load',()=>{const t=setInterval(()=>{const tip=document.querySelector('.hs-standtip');if(tip){window.__tipSeen=tip.isConnected;clearInterval(t);}},100);});});
}});
const {page:p,browser,until}=f;
const shot=async n=>p.screenshot({path:new URL(`${tag}-desktop-${n}.png`,dir).pathname});
try{
 await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor'&&!House.gliding);
 await p.keyboard.press('t');await p.waitForTimeout(500);
 await p.evaluate(()=>{
  window.__onboardNotes=[];window.__onboardPeak=0;
  new MutationObserver(records=>{window.__onboardPeak=Math.max(window.__onboardPeak,document.querySelector('#toastWrap').children.length);for(const r of records)for(const b of r.addedNodes)if(b.textContent?.startsWith('Onboard note'))window.__onboardNotes.push(b.textContent);}).observe(document.querySelector('#toastWrap'),{childList:true});
  Apps.open('notepad');Desk.msgbox('Set Home Page','Would you like this as your home page?','q');Desk.msgbox('Registry Editor','Read the pinkster swear first.');Desk.msgbox('Problem with Shortcut','This file has moved.');Desk.msgbox('Set Home Page','Would you like this as your home page?','q');
  for(let i=1;i<=3;i++)Desk.toast('Onboard note','Discovery '+i,1800);Desk.toast('Onboard note','Discovery 3',1800);
 });
 await shot('popups');
 console.log('Popup baseline',await p.evaluate(()=>({dialogs:[...document.querySelectorAll('.float')].filter(e=>e.querySelector('.msgbox')).length,toasts:document.querySelector('#toastWrap')?.children.length,tip:!!document.querySelector('.hs-standtip'),coach:!!document.querySelector('.ht-coach')})));
 if(tag!=='before'){
  assert.equal(await p.locator('.hs-standtip').count(),0,'A window focus should dismiss the first desktop tip');
  assert.equal(await p.locator('.float:has(.msgbox)').count(),2,'Only two message boxes may show');
  await p.locator('.float:has(.msgbox) .ctl button').last().click();await p.waitForTimeout(500);
  assert.equal(await p.locator('.float:has(.msgbox)').count(),2,'Next queued dialog should now show');
  await p.locator('.float:has(.msgbox) .ctl button').last().click();await p.waitForTimeout(500);
  assert.equal(await p.locator('.float:has(.msgbox)').count(),1,'Duplicate queued dialog should not reappear');
  await until(()=>window.__onboardNotes.length===3);
  assert.equal(await p.evaluate(()=>window.__onboardPeak),1,'Balloons must be read one at a time');
  assert.deepEqual(await p.evaluate(()=>window.__onboardNotes),[1,2,3].map(n=>'Onboard noteDiscovery '+n));
 }
 await shot('queue-advanced');assert.deepEqual(f.errors,[]);
}finally{await browser.close();}
