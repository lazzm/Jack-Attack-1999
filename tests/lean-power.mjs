import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
const base = process.argv[2] || 'http://localhost:18300';
async function until(p, fn) { const end=Date.now()+60000; while(Date.now()<end) { try { if(await p.evaluate(fn)) return; } catch(e) { if(!/context was destroyed/.test(e.message)) throw e; } await p.waitForTimeout(250); } throw new Error('State timeout '+fn.toString()); }
const p=await browser.newPage({viewport:{width:1366,height:860}}), errors=[];
p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try {
 await p.goto(base); await until(p,()=>!!window.House?.live && !!window.Room);
 await p.screenshot({path:'shots/power-off-initial.png'});
 // The solid tower owns picking; its old CSS button is intentionally hidden.
 const powerPoint = await p.evaluate(() => { const s=House.SPOTS['pc.power']; if(!s) return null; const v=new THREE.Vector3(); s.obj.getWorldPosition(v); return House.toScreen(v.x,-v.y,v.z); });
 if(powerPoint) await p.mouse.click(powerPoint.x,powerPoint.y); else await p.evaluate(()=>document.querySelector('#bootPower .powerbtn').click());
 await p.waitForTimeout(2300); await p.screenshot({path:'shots/power-bios.png'});
 await until(p,()=>!!document.querySelector('.logon'));
 await p.screenshot({path:'shots/power-logon.png'});
 await p.locator('.logon [data-g]').click();
 await until(p,()=>House.mode==='monitor');
 await p.screenshot({path:'shots/power-desktop.png'});
 assert.equal(await p.evaluate(()=>!!document.pointerLockElement),false);
 await p.locator('#startBtn').click(); await p.locator('#smShutdown').click();
 await p.locator('form').filter({has:p.locator('input[name=sd]')}).locator('button[type=submit]').click();
 await p.waitForTimeout(3000); await p.screenshot({path:'shots/power-shutdown.png'});
 await until(p,()=>window.JHPBoot==='forced' && document.body.classList.contains('pc-power'));
 await p.screenshot({path:'shots/power-off-after-shutdown.png'});
 await p.reload(); await until(p,()=>window.House?.mode==='walk');
 assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),'1');
 await p.screenshot({path:'shots/power-off-refresh.png'});
 console.log('POWER PASS',errors); assert.deepEqual(errors,[]);
} finally { await browser.close(); }
