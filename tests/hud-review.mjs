// Native-resolution HUD review on disposable localhost data; a single browser at a time.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {devices} from 'playwright';
import {roomFixture} from './room-fixture.mjs';
import {playCase} from './case-actions.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const out=new URL('shots/hud2/'+tag+'/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--profiles='))?.slice(11).split(',');
const states=process.argv.find(a=>a.startsWith('--states='))?.slice(9).split(',');
let report={tag,states:[],errors:[]};
if(selected&&tag==='after')try{report=JSON.parse(await readFile(out+'report.json','utf8'));report.states=report.states.filter(s=>!selected.some(p=>s.name.startsWith(p+'-')) || states&&!states.some(state=>s.name.endsWith('-'+state)));}catch{}
for(const profile of ['desktop','phone','tablet'].filter(p=>!selected||selected.includes(p))){
 const touch=profile!=='desktop',account='Hud'+profile[0]+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const sizes=profile==='desktop'?[[1366,860],[1920,1080]]:profile==='phone'?[[390,844],[844,390]]:[[768,1024],[1024,768]];
 console.log("PROFILE",profile);
 const f=await roomFixture(base,{debug:true,account,password,signup:false,touch,width:sizes[0][0],height:sizes[0][1],seed:1999,storage:{jhp_touch_slow_asked:true,jhp_touch_learned:true},contextOptions:touch?{isMobile:true,userAgent:devices[profile==='phone'?'iPhone 13':'iPad (gen 7)'].userAgent,deviceScaleFactor:1}:{}});
 const {page:p,until,view}=f;
 const press=sel=>touch?p.locator(sel).tap():p.locator(sel).click();
 // Trusted touch selects the input family; the temporary transparent button
 // consumes it so no object in the room can accidentally be used.
 const touchMode=async()=>{
  await p.evaluate(()=>{const b=document.createElement('button');b.type='button';b.id='hudInputProbe';b.style.cssText='position:fixed;left:0;top:0;width:8px;height:8px;padding:0;border:0;opacity:0;z-index:2147483646';for(const type of ['pointerdown','pointerup','click','touchstart','touchend'])b.addEventListener(type,e=>{e.preventDefault();e.stopPropagation()},{passive:false});document.documentElement.appendChild(b)});
  await p.touchscreen.tap(1,1);await p.evaluate(()=>document.getElementById('hudInputProbe')?.remove());
 };
 const walk=async(eye=[-80,-55,220],target=[-130,73,145])=>{await view(eye,target);await p.evaluate(target=>{House.hush();HousePause.close();House._.setMode('walk');const P=House.P,W=House.W;if(!W.seat){W.eyeNow=W.eye;P.y=W.fy-W.eye;P.rx=Math.atan2(-(target[1]-P.y),Math.hypot(target[0]-P.x,target[2]-P.z))*180/Math.PI;P.ry=Math.atan2(target[0]-P.x,-(target[2]-P.z))*180/Math.PI;}House.dirty()},target);if(touch)await touchMode();else await p.mouse.move((await p.viewportSize()).width/2,(await p.viewportSize()).height/2);await p.waitForTimeout(650)};
 const shot=async(state)=>{
  if(states&&!states.includes(state))return;
  for(const [width,height]of sizes){
  await p.setViewportSize({width,height});
  if(touch){await touchMode();assert(await p.evaluate(()=>GameInput.touch),'Touch input must remain active');}
  await p.waitForTimeout(600);
  if(['walking','object-day','object-night','holding'].includes(state))assert.equal(await p.evaluate(()=>House.mode),'walk',state+' must show real walking mode');
  const size=p.viewportSize(),name=profile+'-'+size.width+'x'+size.height+'-'+state;
  if(tag==='after'){
   const before=new URL('shots/hud2/before/',import.meta.url).pathname;await mkdir(before,{recursive:true});
   await p.evaluate(()=>{for(const s of document.styleSheets)if(s.href?.includes('/hs-captions.css'))s.disabled=true});
   await p.waitForTimeout(200);await p.screenshot({path:before+name+'.png',scale:'css'});
   await p.evaluate(()=>{for(const s of document.styleSheets)if(s.href?.includes('/hs-captions.css'))s.disabled=false});
   await p.waitForTimeout(200);
  }
  await p.screenshot({path:out+name+'.png',scale:'css'});
  const ui=await p.evaluate(()=>{
   const visible=e=>{if(!e.getClientRects().length)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return false;}return true;};
   return [...document.querySelectorAll('.hs-top,.rm-tinbtn,.ch-jobs,.st-objective,.st-marker-label,.hs-tip.on,.ht-target.on,.hs-hold:not([hidden]),.hs-getup:not([hidden]),.ht-top .ht-b')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return{selector:e.className,text:e.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,overflow:e.scrollWidth>e.clientWidth+1||[...e.querySelectorAll('span')].some(s=>s.scrollWidth>s.clientWidth+1),button:e.matches('button')}});
  });
  const issues=ui.flatMap(e=>[...(e.x<-.5||e.y<-.5||e.x+e.w>size.width+.5||e.y+e.h>size.height+.5?[e.selector+' outside viewport']:[]),...(e.overflow?[e.selector+' text overflows']:[]),...(e.button&&(e.w<44||e.h<44)?[e.selector+' target below 44px']:[])]);
  for(const e of ui)if(/st-objective|hs-hold/.test(e.selector)&&Math.min(e.x+e.w,size.width/2+40)>Math.max(e.x,size.width/2-40)&&Math.min(e.y+e.h,size.height/2+24)>Math.max(e.y,size.height/2-24))issues.push(e.selector+' crosses the placement aim');
  report.states.push({name,issues});
  if(tag==='after')assert.deepEqual(issues,[],name+' HUD layout');
  Object.assign(report.states[report.states.length-1],{ui,perf:await p.evaluate(()=>House.perf())});
  await writeFile(out+'report.json',JSON.stringify(report,null,2));
  console.log('CAPTURE',name);
  }
  await p.setViewportSize({width:sizes[0][0],height:sizes[0][1]});
 };
 try{
  await p.evaluate(()=>{House.hush();document.querySelector('.ht-coach')?.remove();document.documentElement.classList.remove('ht-learning');Room.ensureHouse()});
  await p.waitForTimeout(6000);
  {
   await walk();await shot('walking');
   const cube=await p.evaluate(()=>Object.values(House.THINGS).find(t=>/Puzzle cube/i.test(typeof t.label==='function'?t.label():t.label))?.id);
   if(cube){const at=await p.evaluate(id=>{const t=House.THINGS[id],v=t.obj.getWorldPosition(new House.T.Vector3());return{x:v.x,y:-v.y,z:v.z}},cube);await walk([at.x,at.y-135,at.z+105],[at.x,at.y,at.z]);await shot('object-day');if(!states||states.includes('object-night')){await p.evaluate(()=>{auditHour=23;dispatchEvent(new Event('ownerclock'));House.dirty()});await p.waitForTimeout(1000);await shot('object-night');await p.evaluate(()=>{auditHour=14;dispatchEvent(new Event('ownerclock'));House.dirty()});}assert(await p.evaluate(id=>House.grab(id),cube));if(states){await p.evaluate(()=>House.hush());await until(()=>!document.querySelector('.np-bub:not(.np-out),.hs-voice.on,.hs-call.on'));}await shot('holding');await p.evaluate(()=>House.putBack());await until(()=>!House.held());}
   if(states?.every(s=>['walking','object-day','object-night','holding'].includes(s)))continue;
   await p.evaluate(()=>stDiary.picker());await until(()=>stDiary.picking);await shot('diary-menu');await press('[data-quest-close]');
   await p.evaluate(()=>HousePause.show());await until(()=>HousePause.open);await shot('pause');await press('[data-pause=resume]');
   await p.evaluate(()=>House.sitDown());await until(()=>House.mode==='monitor'&&!House.gliding);await p.evaluate(()=>House.desktopDisplay(false));await p.waitForTimeout(900);await shot('pc-focus');await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
   if(states&&!states.includes('telly-focus'))continue;
   await playCase(f,'n64.kart');await p.waitForTimeout(500);await shot('telly-focus');await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);await p.evaluate(()=>RoomTV.close(true));await until(()=>!House.gliding);
  }
  report.errors.push(...f.errors);assert.deepEqual(f.errors,[]);
 }catch(e){console.log('HUD FAILURE',await p.evaluate(()=>({mode:House.mode,paused:House.paused,menu:HousePause.open,diary:stDiary.picking,gliding:House.gliding})));await p.screenshot({path:out+profile+'-failure.png'});throw e;}finally{await f.browser.close();await writeFile(out+'report.json',JSON.stringify(report,null,2));}
}
console.log('HUD REVIEW PASS',report.states.length,'native captures');
