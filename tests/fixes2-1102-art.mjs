// Disposable localhost visual review. Each predicate returns a plain value.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2], tag=process.argv[3]||'after';
const only=process.env.FIXES2_ART_ONLY?.split(',');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const out=new URL('./shots/fixes2-1102/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const name='Jack',password='Throwaway-1999';
assert.equal((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name,pass:password})})).status,200);
const storageState=await bonfireLogin(base,password);
const f=await roomFixture(base,{account:name,password,signup:false,opening:true,resume:true,storageState,hour:9,touch:true,debug:true,onPage:async p=>{
 if(tag==='before')for(const file of ['hs-house.js','hs-environment.js','np-life.js','season-bonfire.js','ch-kitchen.js']){
  const body=execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8'});
  await p.route('**/js/'+file+'*',r=>r.fulfill({body,contentType:'application/javascript'}));
 }
}});
try{
 const {page,view,until}=f;
 const records=[];
 await until(()=>!!window.HouseFamily?.ready);
 await page.evaluate(async()=>{await Chores.load();await Chores.part('kitchen');HouseFamily.debug.clock({md:1102,dow:2,t:9});HouseFamily.debug.go('mom','sink');HouseFamily.debug.place('mom','sink');HouseFamily.debug.sim(3,.1);});
 if(tag!=='before')assert.equal(await page.evaluate(()=>House.SNAPS['ch.s.breadbin']?.x),63,'Shopping target follows the bread bin');
 const shot=async n=>{if(only&&!only.includes(n))return;await page.evaluate(()=>{House.hush();HousePause.close();House.dirty()});await page.waitForTimeout(700);await page.screenshot({path:out+tag+'-'+n+'.png'});records.push({name:n,...await page.evaluate(()=>({family:HouseFamily.debug.dump(),draws:House.ren.info.render.calls,phase:HouseRooms.phase(),viewport:[innerWidth,innerHeight],buffer:[House.ren.domElement.width,House.ren.domElement.height],lighting:House._.lightingSnapshot('drive')}))});console.log('SHOT',tag,n);};
 await view([-10,210,62],[-10,210,-50],{level:'G'});await shot('cooker');
 await view([115,210,150],[-10,185,-26],{level:'G'});await shot('cooker-wide');
 await view([-140,210,85],[-170,255,-26],{level:'G'});await shot('worktop');
 await view([-10,210,62],[-10,210,290],{level:'G'});await shot('table-wall');
 await view([120,220,255],[-230,205,125],{level:'G'});await shot('kitchen-wide');
 await view([-15,210,65],[-80,210,-26],{level:'G'});
 await page.evaluate(()=>{House._.setMode('walk');HouseFamily.debug.sim(6,.1);House.dirty()});await shot('sink-space');
 if(tag!=='before'){const gap=await page.evaluate(()=>{const c=HouseFamily.chars.mom;return Math.hypot(c.x-House.W.x,c.z-House.W.z)});assert(gap>=90,'Mom leaves room at the sink: '+gap);}
 await page.evaluate(()=>{window.auditHour=22;const c=document.getElementById('bootPower').classList;c.remove('rm-day','rm-dawn','rm-dusk');c.add('rm-night');HouseFamily.debug.clock({md:1102,dow:2,t:22});HouseEnvironment.update();House.relight()});
 const z=await page.evaluate(()=>House.FRONT.FZ);
 await view([290,210,z-130],[250,170,z+900],{level:'G'});
 await page.evaluate(()=>HouseFamily.debug.sim(12,.1));
 if(tag!=='before')assert.equal(await page.evaluate(()=>HouseFamily.chars.mom.goal?.key),'debug.sink','Mom returns to her sink routine when the player leaves');
 await shot('street-night');
 await view([480,210,z-70],[250,150,700],{level:'G'});await shot('porch-night');
 await page.setViewportSize({width:390,height:844});
 const input=await page.context().newCDPSession(page);
 await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:2,y:2}]});await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await view([290,210,z-130],[250,170,z+900],{level:'G'});await shot('phone-street-night');
 await page.setViewportSize({width:844,height:390});
 await view([480,210,z-70],[250,150,700],{level:'G'});await shot('phone-porch-night');
 await page.setViewportSize({width:768,height:1024});
 await page.evaluate(()=>{window.auditHour=9;const c=document.getElementById('bootPower').classList;c.remove('rm-night','rm-dawn','rm-dusk');c.add('rm-day');HouseEnvironment.update();House.relight()});
 await view([120,220,255],[-230,205,125],{level:'G'});await shot('tablet-kitchen');
 await page.setViewportSize({width:1024,height:768});await view([-10,210,62],[-10,210,290],{level:'G'});await shot('tablet-table-wall');
 await writeFile(out+tag+'-diagnostics.json',JSON.stringify(records,null,2));
 assert.deepEqual(f.errors,[]);console.log('PASS visual review '+tag);
}finally{await f.browser.close()}
