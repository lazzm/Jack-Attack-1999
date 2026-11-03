// One short veteran PC session: retained Run command, visible utility/help and real disk-check boot.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],out='tests/shots/fixes4/';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));await mkdir(out,{recursive:true});
const name='DiskQA'+Date.now().toString(36),password='Temporary-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name,pass:password})})).ok);
const f=await roomFixture(base,{account:name,password,signup:false,debug:true}),p=f.page;
try{
 await p.evaluate(()=>{House.act('pc');House.desktopDisplay(true)});await f.until(()=>House.mode==='monitor'&&!House.gliding&&!!window.DesktopSurface?.ready());
 await p.evaluate(()=>Apps.run('scandisk'));await p.locator('.pgs').waitFor({state:'visible'});
 assert.match(await p.locator('.pgs').evaluate(el=>el.closest('.appwin').querySelector('.tb .t').textContent),/Disk Snitch/);await p.screenshot({path:out+'r198-system-tools.png'});
 await p.evaluate(()=>Apps.open('system.help','h-scandisk'));await f.until(()=>document.querySelector('.sys-h-hd h2')?.textContent==='Disk Snitch');
 assert(!/ScanDisk/.test(await p.locator('.sys-help').innerText()));await p.screenshot({path:out+'r198-help.png'});
 await p.evaluate(()=>Desk.bsod('Disposable disk-check review'));await p.waitForTimeout(650);await p.keyboard.press('Enter');await f.until(()=>!document.getElementById('bootScan').hidden);
 assert.equal(await p.locator('#bootScan .scantitle').innerText(),'Disk Snitch');assert(!/ScanDisk/.test(await p.locator('#bootScan').innerText()));await p.screenshot({path:out+'r198-boot-check.png'});
 assert.deepEqual(f.errors,[]);console.log('FIXES4 UI PASS: scandisk command, System Tools, help, real boot disk check');
}finally{await f.browser.close();}
