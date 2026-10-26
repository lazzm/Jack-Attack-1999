import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,devices} from 'playwright';
const base=process.argv[2]||'http://localhost:18081';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const name='Legacy'+Date.now().toString(36),pass='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name,pass})})).ok);
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']}),errors=[];
fs.mkdirSync('shots/shop-sparse',{recursive:true});
async function wait(p,fn){for(let i=0;i<450;i++){try{if(await p.evaluate(fn))return}catch(e){if(!/context was destroyed/.test(e.message))throw e}await p.waitForTimeout(200)}throw Error('Timed out: '+fn)}
async function login(p){p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('[name=name]').fill(name);await p.locator('[name=password]').fill(pass);await p.locator('#accountGate [type=submit]').click();await wait(p,()=>window.AccountGate?.allowed&&window.PM&&(!window.House?.ok||window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry')))}
try{
 const p=await b.newPage({viewport:{width:1366,height:860}});await login(p);console.log('Legacy room ready');
 assert.notEqual(await p.evaluate(()=>localStorage.getItem('jhp_starter')),'1');
 const original=await p.evaluate(()=>({consoles:['n64','ps','md','dc'].map(id=>!!House.SPOTS[id]),mag:{hide:false,...House.THINGS['reading.mag.bed'].at},thingIds:Object.keys(House.THINGS).sort()}));assert.deepEqual(original.consoles,[true,true,true,true]);
 assert.equal(await p.evaluate(()=>!!House.THINGS['pmb.pm.mag.01']),false);
 assert.equal(await p.evaluate(()=>!!House.THINGS['pmb.pm.mag.08']),false);
 assert.equal(await p.evaluate(()=>['n64','ps','md','dc'].some(id=>!!House.THINGS[id])),false,'Migration made duplicate portable consoles');
 const refused=await p.evaluate(async()=>[await PM.order('hardware.n64'),await PM.order('pm.mag.01'),await PM.order('pm.mag.08')]);assert(refused.every(x=>x.err));
 await p.evaluate(()=>{for(let i=0;i<4;i++)PMGL.sync()});assert.deepEqual(await p.evaluate(()=>Object.keys(House.THINGS).sort()),original.thingIds);
 await wait(p,()=>House.mode==='monitor'||House.mode==='walk');if(await p.evaluate(()=>House.mode==='monitor'))await p.keyboard.press('q');await wait(p,()=>House.mode==='walk');console.log('Legacy inventory retained');
 await p.evaluate(()=>{House.hush();House.setWalkFrom({x:-80,y:-55,z:150,lvl:'U',seat:0});Object.assign(House.P,{x:-80,y:-55,z:150,rx:-30,ry:-150});House._.setMode('focus');House.dirty()});await p.screenshot({path:'shots/shop-sparse/09-existing-full-room.png'});
 await p.evaluate(()=>{House._.setMode('walk');House.saveThings(true)});await p.reload({waitUntil:'domcontentloaded'});await wait(p,()=>window.House?.live&&window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.deepEqual(await p.evaluate(()=>House.THINGS['reading.mag.bed'].at),original.mag);assert.deepEqual(await p.evaluate(()=>['n64','ps','md','dc'].map(id=>!!House.SPOTS[id])),original.consoles);
 console.log('Legacy refresh retained');const before=await p.evaluate(()=>({pose:(()=>{const pose=JSON.parse(localStorage.getItem('jhp_hs_pose')||'null');if(pose)delete pose.t;return pose})(),stand:JSON.parse(localStorage.getItem('jhp_hs_stand')||'null')?.p,power:localStorage.getItem('jhp_off')}));await p.evaluate(()=>Roam.syncNow());await p.close();
 const context=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844}}),mobile=await context.newPage();await login(mobile);console.log('Phone ready');
 assert.equal(await mobile.evaluate(()=>!!window.House?.ok),false,'Phone created the house renderer');
 await mobile.screenshot({path:'shots/shop-sparse/10-phone-portrait.png'});await mobile.evaluate(()=>PM.catalogue('hardware.n64'));await wait(mobile,()=>!!document.querySelector('[data-pp=\"hardware.n64\"]'));await mobile.locator('[data-pp=\"hardware.n64\"]').scrollIntoViewIfNeeded();await mobile.screenshot({path:'shots/shop-sparse/10b-phone-catalogue.png'});await mobile.setViewportSize({width:844,height:390});await mobile.screenshot({path:'shots/shop-sparse/11-phone-landscape.png'});
 assert.deepEqual(await mobile.evaluate(()=>({pose:(()=>{const pose=JSON.parse(localStorage.getItem('jhp_hs_pose')||'null');if(pose)delete pose.t;return pose})(),stand:JSON.parse(localStorage.getItem('jhp_hs_stand')||'null')?.p,power:localStorage.getItem('jhp_off')})),before);
 const tabletContext=await b.newContext({...devices['iPad Mini'],viewport:{width:1024,height:768}}),tablet=await tabletContext.newPage();await login(tablet);console.log('Tablet ready');assert.equal(await tablet.evaluate(()=>!!window.House?.ren),false);await tablet.screenshot({path:'shots/shop-sparse/12-tablet-landscape.png'});
 assert.deepEqual(errors,[]);console.log('LEGACY + PHONE PASS: full room, no duplicate models/magazines, repeated sync, refresh, phone-only JackOS, unchanged house save');
}finally{await b.close()}
