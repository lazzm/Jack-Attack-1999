// Round 2: matched HEAD/working-tree photographs at native device resolution.
// Only this test's routed VFX source exposes a cosmetic clock/tick. Each still
// holds a real production effect at mid-life; no production capture switch exists.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
const baseline=process.argv.includes('--baseline'),phone=process.argv.includes('--phone'),motion=process.argv.includes('--motion');
const selected=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const tag=baseline?'before':'after',device=phone?'phone':'desktop';
const dir=new URL(`./shots/vfx-round2/${tag}/${device}/`,import.meta.url).pathname;await mkdir(dir,{recursive:true});
await withTestServer(async base=>{
 const account='V2'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,hour:14,seed:1999,debug:true,touch:phone,width:phone?390:1366,height:phone?844:860,contextOptions:phone?{isMobile:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'}:{deviceScaleFactor:1},onPage:async p=>{
  for(const name of ['hs-vfx.js','hs-world.js','hs-house.js','hs-telly.js','sound.js'])await p.route('**/js/'+name+'*',async route=>{
   const response=await route.fetch();let body=baseline?execFileSync('git',['show','62928a5:app/public/js/'+name],{encoding:'utf8'}):await response.text();
   const sourceHash=createHash('sha256').update(body).digest('hex');
   if(name==='hs-vfx.js'&&!motion)body=body.replaceAll('performance.now()','(window.__fxPhotoNow??performance.now())').replace('function tick(now){','function tick(now){now=window.__fxPhotoNow??now;').replace('  H.ambient.add(tick);','  window.__fxPhotoTick=tick;H.ambient.add(tick);');
   if(name==='hs-telly.js'&&!motion)body=body.replace('const t = (now - showT0) / 1000 + (Date.now() / 1000 % 600);','const t = 120; // A real mid-programme frame, matched between photographs.');
   body+='\nwindow.__vfxSources??={};window.__vfxSources['+JSON.stringify(name)+']='+JSON.stringify(sourceHash)+';';
   await route.fulfill({response,body});
  });
 }});
 const {page:p,view,until,errors}=f,rows=[];
 async function phase(hour){await p.evaluate(hour=>{window.auditHour=hour;dispatchEvent(new Event('ownerclock'));House.hush();HousePause.close();House.adapt(0,{pin:true,force:true});},hour);await until(hour=>{HouseEnvironment.update();return HouseEnvironment.phase===(hour>=20||hour<6?'night':hour>=18?'dusk':'day')},hour);}
 async function warm(ms=2600){await p.evaluate(ms=>{window.__fxPhotoNow??=performance.now();for(let n=0;n<ms;n+=50){window.__fxPhotoNow+=50;const picture=House.ROOMS.lounge?.tvScreen?.material.map?.image;if(window.HouseTelly?.on&&picture)HouseVFX.tvFrame(picture);window.__fxPhotoTick(window.__fxPhotoNow)}House.dirty();},ms);}
 async function shot(name){
  if(phone)await p.touchscreen.tap(387,8);
  await p.evaluate(()=>{House.hush();House._.renderForBenchmark()});
  const info=await p.evaluate(()=>{
   const effects=['house-pooled-atmosphere','house-plaster-and-glass-effects'].map(n=>House.root.getObjectByName(n)),visibility=effects.map(o=>o.visible);
   House._.renderForBenchmark();const on={...House.ren.info.render};effects.forEach(o=>o.visible=false);House._.renderForBenchmark();const off={...House.ren.info.render};effects.forEach((o,i)=>o.visible=visibility[i]);House._.renderForBenchmark();
   let lights=0,shadowLights=0;const materials=new Set();House.scene.traverse(o=>{if(o.isLight){lights++;if(o.castShadow)shadowLights++}for(const m of [].concat(o.material||[]))materials.add(m)});
   return {sources:window.__vfxSources,fx:HouseVFX.stats(),on,off,extraCalls:on.calls-off.calls,lights,shadowLights,materials:materials.size,gpu:House.graphicsGet().gpu,shadowMap:House.ren.shadowMap.enabled,postPasses:0,memory:{...House.ren.info.memory},programs:House.ren.info.programs.length,buffer:[House.ren.domElement.width,House.ren.domElement.height],dpr:devicePixelRatio,adapt:House.graphicsGet().adapt};
  });assert(info.extraCalls<=2,JSON.stringify(info));
  await p.screenshot({path:dir+name+'.png'});rows.push({name,...info});console.log('READABLE STILL',tag,device,name,JSON.stringify(info));
 }
 const take=n=>!selected||selected.includes(n);
 try{
  await p.evaluate(()=>{for(const id of ['kitchen','lounge','garden'])House.buildRoom(House.ROOMS[id]);StoryGuide.setting('off');House.hush();});await until(()=>!!window.HouseTelly);
  if(motion){
   await phase(14);await view([25,-55,90],[46,-7,-8],{level:'U'});
   await p.evaluate(()=>{window.__motion={samples:[],sounds:[],rests:[],restoreErrors:0};const before=HouseVFX.beforeRender,after=HouseVFX.afterRender;let saved=[];
    HouseVFX.beforeRender=()=>{saved=['mug','ch.pillow'].map(id=>{const o=House.THINGS[id].obj;return{id,o,s:o.scale.clone(),p:o.position.clone(),r:o.rotation.clone()}});before();for(const a of saved)__motion.samples.push({id:a.id,st:House.THINGS[a.id].st,t:performance.now(),sy:a.o.scale.y/a.s.y,rz:a.o.rotation.z-a.r.z,dy:a.o.position.y-a.p.y,particles:HouseVFX.stats().sources.contact||0});};
    HouseVFX.afterRender=()=>{after();for(const a of saved)if(!a.o.scale.equals(a.s)||!a.o.position.equals(a.p)||!a.o.rotation.equals(a.r))__motion.restoreErrors++;};
    const sound=Sound.world;Sound.world=(kind,o)=>{__motion.sounds.push({kind,put:o?.put,soft:o?.soft,t:performance.now()});return sound(kind,o)};House.on('rest',id=>{if(['mug','ch.pillow'].includes(id))__motion.rests.push({id,t:performance.now()})});
   });
   for(const id of ['mug','ch.pillow']){if(id==='ch.pillow')await view([50,-55,150],[40,65,72],{level:'U'});await p.evaluate(id=>House.grab(id),id);await p.waitForTimeout(140);await p.evaluate(()=>House.putBack());await until(id=>House.THINGS[id].st==='rest',id);await p.waitForTimeout(700);}
   const data=await p.evaluate(()=>__motion);await writeFile(dir+'motion.json',JSON.stringify(data,null,2));assert.equal(data.restoreErrors,0);assert(data.samples.some(s=>s.id==='ch.pillow'&&s.st==='rest'&&s.sy<.98),'Soft contact was rendered');assert(data.samples.some(s=>s.id==='mug'&&Math.abs(s.rz)>.005),'Hard contact was rendered');
   for(const rest of data.rests)assert(data.sounds.some(s=>s.put&&Math.abs(s.t-rest.t)<30),'Contact and sound share the same frame');
   await writeFile(dir+'motion.json',JSON.stringify(data,null,2));console.log('UNPAUSED MOTION PASS',JSON.stringify({samples:data.samples.length,restores:data.restoreErrors,restEvents:data.rests.length,maxSoftSquash:1-Math.min(...data.samples.filter(s=>s.id==='ch.pillow').map(s=>s.sy)),maxHardRock:Math.max(...data.samples.filter(s=>s.id==='mug').map(s=>Math.abs(s.rz)))}));return;
  }
  await p.evaluate(()=>{window.__fxPhotoNow=performance.now()});
  if(take('01-kettle')){await phase(14);await view([50,210,110],[-190,210,-156],{level:'G'});await p.evaluate(()=>{HouseFamily.debug.hide(true);House.act('hs.kettle');House.hush()});await warm();await shot('01-kettle');}
  if(take('02-hot-mug')){await phase(14);await p.evaluate(()=>{HouseFamily.debug.hide(false);HouseFamily.debug.place('mom','kmug1');HouseFamily.debug.go('mom','kmug1','mug');HouseFamily.debug.sim(15,.1);const rig=HouseFamily.chars.mom.rig;rig.set({action:'mug'});for(let i=0;i<20;i++)rig.update(.1,true)});await view([-130,205,170],[-190,230,100],{level:'G'});await warm();await shot('02-hot-mug');}
  if(take('03-telly')||take('04-telly-day')){
   await phase(21);await view([-170,210,545],[-60,210,340],{level:'G'});
   await p.evaluate(()=>{HouseFamily.debug.hide(false);HouseFamily.debug.place('dad','sofaL');HouseFamily.debug.go('dad','sofaL','telly');HouseFamily.debug.sim(20,.1);for(let i=0;i<20;i++)HouseFamily.chars.dad.rig.update(.1,true);HouseRooms.lightsOn.lounge=false;HouseRooms.lightsOn.loungeLamp=false;HouseRooms.lightsOn.loungeFire=false;HouseRooms.rooms.lounge.fireOn=false;House.relight();if(!HouseTelly.on)HouseTelly.press('power');HouseTelly.press('4')});
   await p.waitForTimeout(1500);await warm();if(take('03-telly')){await shot('03-telly');await view([-210,205,380],[-110,220,608],{level:'G'});await warm();await shot('03b-telly-person');await view([-170,210,545],[-60,210,340],{level:'G'});}
   if(take('04-telly-day')){await phase(14);await warm();await shot('04-telly-day');}
  }
  if(take('05-sun-motes')){await phase(14);await view([115,-65,85],[190,-75,-56],{level:'U'});await warm(4500);await shot('05-sun-motes');}
  if(take('06-cold-window')){await phase(21);await view([-110,205,-10],[-100,205,-176],{level:'G'});await warm();await shot('06-cold-window');}
  if(take('07-breath-leaves')){await phase(21);await view([30,210,-370],[-80,250,-650],{level:'G'});await warm(4500);await p.evaluate(()=>{for(let i=0;i<80&&!HouseVFX.stats().sources.breath;i++){window.__fxPhotoNow+=50;window.__fxPhotoTick(window.__fxPhotoNow)}for(let i=0;i<8;i++){window.__fxPhotoNow+=50;window.__fxPhotoTick(window.__fxPhotoNow)}House.dirty()});await shot('07-breath-leaves');}
  for(const [name,id,eye,target]of [['08-soft-putdown','ch.pillow',[50,-55,150],[40,65,72]],['09-hard-putdown','mug',[25,-55,90],[46,-7,-8]]])if(take(name)){
   await phase(14);await view(eye,target,{level:'U'});await p.evaluate(id=>{House.grab(id);House.putBack()},id);await until(id=>['rest','snap'].includes(House.THINGS[id].st),id);await warm(40);await shot(name);if(id==='ch.pillow'){await warm(150);await shot('08b-soft-dust')}await warm(500);
  }
  if(take('10-pickup')){await phase(14);await view([25,-55,90],[46,-7,-8],{level:'U'});await p.evaluate(()=>House.grab('mug'));await warm(50);await shot('10-pickup');await p.evaluate(()=>House.putBack());await until(()=>House.THINGS.mug.st==='rest');await warm(500);}
  if(take('11-switch')){await phase(14);await view([150,220,250],[194.4,235,246],{level:'G'});await p.evaluate(()=>{House.act('hs.switch.kitchen');House.hush()});await warm(50);await shot('11-switch');await warm(500);}
  if(take('12-door')){await p.evaluate(()=>House.setDoor('kitchen',false,true));await view([255,235,167],[196,250,157],{level:'G'});await p.evaluate(()=>{House.setDoor('kitchen',true);const move=House.anims.get('door:kitchen');move?.(performance.now()+55);House.anims.delete('door:kitchen')});await warm(100);await shot('12-door');await p.evaluate(()=>House.setDoor('kitchen',false,true));}
  await p.evaluate(()=>House.adapt(5,{pin:true,force:true}));await until(()=>HouseVFX.stats().draws===0);const floor=await p.evaluate(()=>HouseVFX.stats());assert.equal(floor.capacity,0);assert.equal(floor.draws,0);await writeFile(dir+'floor.json',JSON.stringify(floor,null,2));
  assert.deepEqual(errors,[]);const previous=JSON.parse(await readFile(dir+'metrics.json','utf8').catch(()=>'[]')),merged=new Map(previous.map(r=>[r.name,r]));for(const row of rows)merged.set(row.name,row);await writeFile(dir+'metrics.json',JSON.stringify([...merged.values()].sort((a,b)=>a.name.localeCompare(b.name)),null,2));console.log('READABILITY REVIEW PASS',tag,device);
 }finally{await f.browser.close()}
});
