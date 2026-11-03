// Matched hall/landing art and software-renderer evidence; disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import WebSocket from '../app/node_modules/ws/wrapper.mjs';
import {devices} from 'playwright';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],tag=process.argv[3]||'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('shots/polish-1102/',import.meta.url).pathname;
await mkdir(dir,{recursive:true});
const views=[
 ['landing-north',[290,-55,510],[320,-50,130],'U'],
 ['landing-south',[290,-55,270],[302,-30,700],'U'],
 ['landing-stairs',[385,-55,198],[330,110,470],'U'],
 ['hall-north',[277,225,460],[280,212,65],'G'],
 ['hall-south',[277,225,415],[295,211,700],'G'],
 ['hall-coats',[365,225,647],[210,230,630],'G'],
];
const report=await readFile(dir+tag+'-metrics.json','utf8').then(JSON.parse).catch(()=>({tag,load:os.loadavg(),views:[],errors:[]}));
const checks=process.env.POLISH_CHECKS==='1';
const originals=new Map(tag.startsWith('before')?['js/hs-house.js','js/hs-kit.js','js/hs-art.js','js/hs-world.js','js/st-guide.js','css/hs.css','css/st.css'].map(path=>['/'+path,execFileSync('git',['show','HEAD:app/public/'+path],{encoding:'utf8',maxBuffer:4e6})]):[]);
async function authenticatedStanding(){
 const name='Pol'+Date.now().toString(36);
 const session=await new Promise((resolve,reject)=>{
  const ws=new WebSocket(base.replace(/^http/,'ws')+'/ws',{origin:new URL(base).origin});let token;
  const timer=setTimeout(()=>{ws.close();reject(Error('Fixture authentication timed out'))},15000);
  ws.on('open',()=>ws.send(JSON.stringify({t:'hello',cid:'polish-fixture'})));ws.on('error',reject);
  ws.on('message',data=>{const m=JSON.parse(data);if(m.t==='welcome')ws.send(JSON.stringify({t:'login',name,pass:'Throwaway-1999',signup:true,me:{first:'Jack',g:'m'}}));if(m.t==='loginErr'){clearTimeout(timer);ws.close();reject(Error(m.msg));}if(m.t==='loginOk'){token=m.token;ws.send(JSON.stringify({t:'rmGet',since:0}));}if(m.t==='rmData'||m.t==='rmNone'){clearTimeout(timer);let profile={};if(m.data){const b=Buffer.from(m.data,'base64');profile=JSON.parse((m.enc==='gzip'?gunzipSync(b):b).toString());}ws.close();resolve({token,profile,ts:m.ts||0,rev:m.ownerRev||0});}});
 });
 const storage={...session.profile,jhp_token:session.token,jhp_everbooted:'1',jhp_off:'1',jhp_last:String(Date.now()),jhp_roam_who:name,jhp_roam_ts:String(session.ts),jhp_roam_ownerRev:String(session.rev),jhp_hs_stand:JSON.stringify({t:Date.now(),p:{x:290,y:-70,z:510,rx:0,ry:0,lvl:'U',seat:0}})};
 return {cookies:[],origins:[{origin:new URL(base).origin,localStorage:Object.entries(storage).map(([name,value])=>({name,value:String(value)}))}]};
}
for(const size of ['desktop','phone'])for(const hour of [9,23]){
 const reviewViews=views.filter(([name])=>size==='desktop'&&hour===9||!['landing-stairs','hall-coats'].includes(name));
 if(process.env.POLISH_ONLY&&process.env.POLISH_ONLY!==size+'-'+hour)continue;
 if(!checks&&process.env.POLISH_RESUME&&reviewViews.every(([name])=>report.views.some(r=>r.size===size&&r.hour===hour&&r.name===name))&&(tag!=='after'||size!=='desktop'||hour!==9||report.hudPassed))continue;
 // Load in a small buffer, then resize to native evidence pixels before any
 // measurement or photograph. This avoids wasting the shared host on loading.
 const f=await roomFixture(base,{opening:true,resume:true,storageState:await authenticatedStanding(),hour,width:320,height:240,touch:size==='phone',contextOptions:size==='phone'?{userAgent:devices['iPhone 13'].userAgent,isMobile:true,deviceScaleFactor:1}:{},seed:1999,timeoutScale:3,storage:{jhp_touch_slow_asked:true},onPage:async page=>{
  if(process.env.FIXTURE_DEBUG==='1'){const timer=setInterval(()=>void page.evaluate(()=>({ready:document.readyState,net:!!window.Net?.connected,member:!!window.Net?.me?.member,house:window.House?.mode,gate:!!document.querySelector('#accountGate'),loading:!!document.querySelector('.hs-loading,#houseEntry')})).then(s=>console.log('LOAD',s)).catch(()=>{}),15000);page.on('close',()=>clearInterval(timer));}
  if(originals.size)await page.route(/\/(?:js|css)\/(?:hs-(?:house|kit|art|world)|st-guide|hs|st)\.(?:js|css)(?:\?|$)/,route=>{const path=new URL(route.request().url()).pathname;return originals.has(path)?route.fulfill({body:originals.get(path),contentType:path.endsWith('.js')?'application/javascript':'text/css'}):route.continue()});
 }});
 try{
  const p=f.page;p.setDefaultTimeout(120000);
  await p.setViewportSize({width:size==='desktop'?1366:390,height:size==='desktop'?860:844});
  assert.equal(await p.evaluate(()=>document.getElementById('bootPower').classList.contains('rm-night')),hour===23,'fixture time did not relight the house');
  if(size==='phone')assert.equal(await p.evaluate(()=>GameInput.touch),true,'phone fixture needs real touch mode');
  await p.evaluate(()=>{House.adapt(3,{pin:true,force:true});House.ambient.clear();House.hush();for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)});
  report.renderer=await p.evaluate(()=>{const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)});
  for(const[name,eye,target,level]of reviewViews){
   if(checks)continue;
   if(process.env.POLISH_VIEWS&&!process.env.POLISH_VIEWS.split(',').includes(name))continue;
   if(process.env.POLISH_RESUME&&report.views.some(r=>r.size===size&&r.hour===hour&&r.name===name))continue;
   await f.view(eye,target,{level});
   await p.evaluate(()=>{
    House._.setMode('walk');House.visCalc();
    // Matched art photographs keep incidental speech clear of the models.
    // The story/mobile suites exercise the ordinary dialogue and movement.
    if(window.HouseFamily?.debug?.speech)HouseFamily.debug.speech.freeze=true;
    window.NPCBubble?.clear();House.hush();House.dirty();
   });
   await p.waitForTimeout(500);
   const samples=size==='desktop'&&hour===9?5:1;
   const metrics=await p.evaluate(samples=>{
    const r=House.ren,gl=r.getContext(),px=new Uint8Array(4),times=[];
    for(let i=-1;i<samples;i++){const t=performance.now();House._.renderForBenchmark();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(i>=0)times.push(performance.now()-t)}
    times.sort((a,b)=>a-b);
    return {calls:r.info.render.calls,triangles:r.info.render.triangles,p50:+times[Math.floor(samples/2)].toFixed(2),p95:+times[samples-1].toFixed(2),pixels:gl.drawingBufferWidth*gl.drawingBufferHeight};
   },samples);
   const path=dir+`${tag}-${size}-${hour}-${name}.png`;
   await p.screenshot({path,timeout:120000});
   assert.deepEqual(f.errors,[],'capture errors');
   const row={size,hour,name,...metrics,samples,adapt:3,hostLoad:os.loadavg()[0]};report.views=report.views.filter(r=>r.size!==size||r.hour!==hour||r.name!==name);report.views.push(row);await writeFile(dir+tag+'-metrics.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(row));
  }
  if(size==='desktop'&&!checks){
   for(const[name,eye,point]of [
    ['mirror-close',[289,210,332],[208,203,300]],
    ['coats-oblique',[273,210,682],[216,231,631]],
    ['front-glass-outside',[300,210,864],[300,206,700]],
    ['back-glass-outside',[120,210,-218],[120,206,-56]],
    ['back-glass-inside',[120,210,125],[120,206,-56]],
   ]){
    if(hour===23&&!name.includes('glass'))continue;
    await f.view(eye,point,{level:'G'});await p.evaluate(()=>{House._.setMode('walk');House.hush();window.NPCBubble?.clear();House.visCalc();House.dirty()});await p.waitForTimeout(350);
    await p.screenshot({path:dir+`${tag}-${size}-${hour}-${name}.png`,timeout:120000});assert.deepEqual(f.errors,[]);
   }
  }
  if(tag==='after'&&hour===9&&!checks){
   const sizes=size==='desktop'?[[1920,1080]]:[[844,390],[768,1024],[1024,768]];
   for(const[width,height]of sizes){
    await p.setViewportSize({width,height});
    for(const i of [0,4]){const[name,eye,point,level]=views[i];await f.view(eye,point,{level});await p.evaluate(()=>{House._.setMode('walk');window.NPCBubble?.clear();House.hush();House.dirty()});await p.waitForTimeout(350);await p.screenshot({path:dir+`${tag}-${width}x${height}-${name}.png`,timeout:120000});assert.deepEqual(f.errors,[]);}
   }
   await p.setViewportSize({width:size==='desktop'?1366:390,height:size==='desktop'?860:844});
  }
  if(checks||tag==='after'&&size==='desktop'&&hour===9){
   await p.evaluate(()=>{HouseFamily.debug.speech.freeze=true;NPCBubble.clear();House.hush();StoryGuide.setting('full')});
   const target=await p.evaluate(()=>{
    const id=StoryGuide.targets()[0],thing=House.THINGS[id],obj=thing?.obj||House.SPOTS[id]?.obj;if(!obj)throw Error('Missing story target '+id);
    const c=new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()),room=House.ROOMS[thing?.at.room||'bedroom'];
    for(const d of [90,115,140])for(let i=0;i<8;i++){const a=i*Math.PI/4,x=c.x+Math.sin(a)*d,z=c.z+Math.cos(a)*d;if(House._.cellOk(room.lvl,x,z))return {id,eye:[x,House.LV[room.lvl]-House.STAND,z],point:[c.x,-c.y,c.z],level:room.lvl};}
    throw Error('No clear target view');
   });
   await f.view(target.eye,target.point,{level:target.level});await p.evaluate(()=>{House._.setMode('walk');House.hush();NPCBubble.clear();House.dirty()});
   await p.locator('.hs-ui').waitFor({state:'visible'}); // focus release has a CSS visibility transition
   await f.until(()=>document.querySelector('.st-marker').hidden===true);
   const projected=await p.evaluate(point=>{const n=new THREE.Vector3(point[0],-point[1],point[2]).project(House.camera);return Math.abs(n.x)<1&&Math.abs(n.y)<1},target.point);assert(projected,'fixture target must actually be in view');
   await p.screenshot({path:dir+`${tag}-${size}-guidance-seen.png`});
   await p.evaluate(()=>{House.P.ry+=180;House.P.rx=0;House.dirty()});await f.until(()=>!document.querySelector('.st-marker').hidden);
   await p.locator('.st-marker').waitFor({state:'visible'});
   const edge=await p.locator('.st-marker').boundingBox();assert(edge.x<10||edge.x+edge.width>await p.evaluate(()=>innerWidth-10)||edge.y<10||edge.y+edge.height>await p.evaluate(()=>innerHeight-10),'compass left the screen border');
   assert(edge.width>=34,'compass is too small');await p.screenshot({path:dir+`${tag}-${size}-guidance-edge.png`});
   await p.evaluate(()=>{House.ui.tip('A game box',50,100,false,false)});
   const tip=await p.locator('.hs-tip').boundingBox(),vp=p.viewportSize();assert(Math.abs(tip.x+tip.width/2-vp.width/2)<2&&tip.y>=vp.height/2+26,'pick label left its fixed slot');
   await p.evaluate(()=>{House.ui.tip('A game box',1000,700,false,false)});const moved=await p.locator('.hs-tip').boundingBox();assert.equal(moved.x,tip.x);assert.equal(moved.y,tip.y);
   await p.screenshot({path:dir+`${tag}-${size}-pick-slot.png`});
   await p.evaluate(()=>House.ui.tip(null));
   report.hudPassed=true;await writeFile(dir+tag+'-metrics.json',JSON.stringify(report,null,2)+'\n');
   console.log('POLISH HUD PASS: target seen/behind, edge pin and fixed pick slot; refresh is covered by story-ch1/mobile.');
  }
  report.errors.push(...f.errors);assert.deepEqual(f.errors,[]);
 }finally{await f.browser.close()}
}
await writeFile(dir+tag+'-metrics.json',JSON.stringify(report,null,2)+'\n');
if(tag==='after'&&!process.env.POLISH_ONLY)assert(report.hudPassed,'missing HUD checks');
console.log('POLISH CAPTURES PASS',report.views.length);
