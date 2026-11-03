import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base=process.argv[2],tag=process.argv[3]||'after',out=new URL('./shots/fixes3/',import.meta.url).pathname;
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Throwaway localhost only');
await mkdir(out,{recursive:true});
const password='Throwaway-1999';
assert.equal((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})})).status,200);
const storageState=await bonfireLogin(base,password);
const f=await roomFixture(base,{account:'Jack',password,signup:false,opening:true,resume:true,storageState,hour:14,touch:true,seed:1999,onPage:async p=>{
 if(tag==='before')for(const file of ['hs-house.js','hs-environment.js','rm-room.js','ch-out.js']){
  const body=execFileSync('git',['show','HEAD:app/public/js/'+file],{encoding:'utf8'});
  await p.route('**/js/'+file+'*',r=>r.fulfill({body,contentType:'application/javascript'}));
 }
}});
const rows=[],only=process.env.FIXES3_ART_ONLY?.split(','),frames=+process.env.FIXES3_ART_FRAMES||37,compareLight=process.env.FIXES3_COMPARE_LIGHT==='1';
try{
 const {page,view,until}=f;
 await until(()=>!!window.HouseFamily?.ready);
 await page.evaluate(async()=>{await Chores.load();await Chores.part('drive');HouseFamily.debug.clock({md:1103,dow:3,t:14});});
 async function shot(name,eye,target,level='G'){
  if(only&&!only.includes(name))return;
  await view(eye,target,{level});await page.evaluate(()=>{House.hush();House.dirty()});await page.waitForTimeout(400);
  await page.screenshot({path:out+tag+'-'+name+'.png'});
  const perf=await page.evaluate(frames=>new Promise(resolve=>{let n=0,last=0;const times=[];function tick(t){if(last&&n>6)times.push(t-last);last=t;House.dirty();if(++n<frames)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);resolve({medianMs:times[times.length>>1],p90Ms:times[Math.floor(times.length*.9)],draws:House.ren.info.render.calls,triangles:House.ren.info.render.triangles,buffer:[House.ren.domElement.width,House.ren.domElement.height]})}}requestAnimationFrame(tick)}),frames);
  if(compareLight&&name==='phone-night')perf.lightCost=await page.evaluate(()=>{
    const ink=HouseEnvironment.nightInk,gl=House.ren.getContext(),runs=[],old=ink.visible;
    try{for(const on of [false,true,true,false]){
      ink.visible=on;const samples=[];
      for(let i=-3;i<12;i++){const t=performance.now();House._.renderForBenchmark();gl.finish();if(i>=0)samples.push(performance.now()-t);}
      samples.sort((a,b)=>a-b);runs.push({on,medianMs:samples[samples.length>>1],draws:House.ren.info.render.calls});
    }}finally{ink.visible=old;House.dirty()}
    return runs;
  });
  rows.push({name,...perf});console.log('SHOT',tag,name,JSON.stringify(perf));
 }
 await shot('shelf',[-20,-65,115],[-14,-105,-59],'U');
 await shot('door',[-80,-65,105],[240,-30,115],'U');
 await shot('wardrobe',[110,-65,125],[-245,-25,120],'U');
 await shot('gown-close',[130,-42,160],[237,-40,208],'U');
 await shot('shelf-close',[-14,-112,36],[-14,-125,-55],'U');
 if(only?.includes('wardrobe-open')){
  await page.evaluate(()=>{House.toggle('wardrobe0');House.toggle('wardrobe1')});
  await until(()=>House.OPEN.wardrobe0.k>.99&&House.OPEN.wardrobe1.k>.99);
  await shot('wardrobe-open',[-105,-30,110],[-240,-30,120],'U');
  await page.evaluate(()=>{House.toggle('wardrobe0');House.toggle('wardrobe1')});
  await until(()=>House.OPEN.wardrobe0.k<.01&&House.OPEN.wardrobe1.k<.01);
 }
 await shot('porch',[180,210,1220],[270,190,700]);
 await shot('mower',[180,270,850],[210,330,740]);
 await shot('nets',[70,210,521],[-60,205,700]);
 await shot('hedge',[150,210,1200],[-110,260,1340]);
 await shot('garden',[40,210,-90],[-80,230,-420]);
 await shot('tree',[70,210,-320],[145,140,-500]);
 await shot('fence',[-80,210,-280],[180,250,-465]);
 await shot('tree-close',[-5,210,-445],[145,130,-500]);
 await shot('fence-close',[140,280,-395],[210,290,-470]);
 const entry=await page.evaluate(()=>House.ROOMS.garden.stations[0].pose());
 const entryTarget=[entry.x+Math.sin(entry.ry*Math.PI/180)*300,entry.y-Math.tan(entry.rx*Math.PI/180)*300,entry.z-Math.cos(entry.ry*Math.PI/180)*300];
 await shot('garden-entry',[entry.x,entry.y,entry.z],entryTarget);
 await page.evaluate(()=>{window.auditHour=22;const c=document.getElementById('bootPower').classList;c.remove('rm-day','rm-dawn','rm-dusk');c.add('rm-night');HouseFamily.debug.clock({md:1103,dow:3,t:22});HouseEnvironment.update();House.relight()});
 const z=await page.evaluate(()=>House.FRONT.FZ);
 await shot('street-night',[290,210,z-130],[250,170,z+900]);
 await shot('road-pools',[520,210,z-20],[-300,350,z+700]);
 await shot('porch-night',[480,210,z-70],[250,150,700]);
 await page.setViewportSize({width:390,height:844});
 await shot('phone-night',[290,210,z-130],[250,220,z+900]);
 await page.setViewportSize({width:844,height:390});
 await shot('phone-night-landscape',[290,210,z-130],[250,220,z+900]);
 await page.setViewportSize({width:768,height:1024});
 await shot('tablet-night',[290,210,z-130],[250,220,z+900]);
 await writeFile(out+tag+(only?'-'+only.join('_'):'')+'-perf.json',JSON.stringify(rows,null,2));assert.deepEqual(f.errors,[]);
}finally{await f.browser.close()}
