// Visual fixture only: browser-local seasonal snapshots, with all step/reward sends disabled.
// It does not prove gameplay. events-bonfire.mjs separately drives every real input.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {bonfireLogin} from './bonfire-login.mjs';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18095',password='Throwaway-1999';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const take=n=>!process.env.BONFIRE_ART_ONLY||process.env.BONFIRE_ART_ONLY.split(',').includes(n);
const modes=(process.env.BONFIRE_ART_MODES||'desktop,phone,potato').split(','),manifest=process.env.BONFIRE_ART_RESUME==='1'?JSON.parse(await readFile(new URL('./shots/bonfire/pinned-review.json',import.meta.url),'utf8').catch(()=> '[]')):[];let savedState=process.env.BONFIRE_ART_RESUME==='1'?JSON.parse(await readFile('/tmp/bf-art-storage.json','utf8')):undefined;
if(!savedState)await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})});
if(!savedState)savedState=await bonfireLogin(base,password);

for(const mode of modes){
 const phone=mode==='phone',tier=mode==='potato'?5:phone?2:0,cap=mode==='potato'?120:phone?430:1000;
 const directory=new URL(`./shots/bonfire/pinned-${mode}-${cap}/`,import.meta.url).pathname;await mkdir(directory,{recursive:true});
 const f=await roomFixture(base,{account:'Jack',password,signup:false,hour:null,resume:!!savedState,storageState:savedState,opening:!!savedState,touch:phone,width:phone?390:1366,height:phone?844:860,debug:process.env.FIXTURE_DEBUG==='1',onPage:async p=>{await p.addInitScript(q=>window.__bfFXQ=q,{adapt:tier,mob:phone,tier:mode==='potato'?'potato':'high'});await p.route('**/js/season-bonfire.js*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replaceAll('H.Q?.','window.__bfFXQ.');body=body.replace('function tick(now, dt) {','function tick(now, dt) { if(window.__bfPhotoFreeze)return true;');body=body.replace('  window.Bonfire =',"  window.__bfPhoto=()=>{window.__bfPhotoFreeze=false;tick(performance.now(),0);window.__bfPhotoFreeze=true;};window.__bfResume=()=>window.__bfPhotoFreeze=false;window.__bfReset=()=>{window.__bfPhotoFreeze=false;nextFire=0;nextSky=performance.now()+60000;tick.lastBang=0;for(const p of particles)p.life=0;for(const key of H.anims.keys())if(key.startsWith('bf.rocket.'))H.anims.delete(key);};\n  window.Bonfire =");await route.fulfill({response,body});});}});
 const {page,until}=f;let rid=0;
 try{
 await until(()=>!!window.OwnerTools?.allowed);
 await page.evaluate(()=>{window.__artReplies={};Net.on('ownerResult',m=>__artReplies[m.rid]=m);window.__realDateNow=Date.now;Date.now=()=>window.__artNow||__realDateNow();Season.step=()=>{};});
 async function clock(date,hour){const id=`art-${mode}-${++rid}`;await page.evaluate(([rid,date,hour])=>Net.send({t:'ownerAction',rid,action:'clock',date,hour}),[id,date,hour]);await until(`!!window.__artReplies['${id}']`);assert(await page.evaluate(id=>__artReplies[id].ok,id));await page.waitForTimeout(600);}
 await clock('1999-11-05',20);await until(()=>!!(window.Bonfire?.on&&House.THINGS['bf.parkin']));
 await page.evaluate(([tier,phone])=>{House.adapt(3,{pin:true,force:true});House.Q.mob=phone;},[tier,phone]);
 const cdp=await page.context().newCDPSession(page);
 async function inputMode(){if(phone){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:387,y:6}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await page.keyboard.press('Shift');await page.evaluate(()=>HousePause.close());}
 async function aim(eye,target){await f.view(eye,target,{level:'G'});await page.evaluate(target=>{House.hush();HousePause.close();House._.setMode('walk');House.W.eyeNow=House.W.eye;House.P.y=House.W.fy-House.W.eye;House.P.rx=Math.atan2(-(target[1]-House.P.y),Math.hypot(target[0]-House.P.x,target[2]-House.P.z))*180/Math.PI;House.P.ry=Math.atan2(target[0]-House.P.x,-(target[2]-House.P.z))*180/Math.PI;House.dirty()},target);await page.waitForTimeout(500);}
 async function scene(ms=null,{morning=false,leftovers=false}={}){
  await page.evaluate(({ms,morning,leftovers})=>{
   const s=Season.server.ev.bonfire99;window.__artNow=__realDateNow();s.open=true;s.obj={};s.steps={};s.art={face:[[.23,.32],[.29,.32],[.29,.39],[.23,.39],[.23,.32],[.64,.32],[.70,.32],[.70,.39],[.64,.39],[.64,.32],[.28,.62],[.36,.72],[.5,.76],[.64,.72],[.72,.62]]};s.display=leftovers?'leftovers':'friday';
   for(const o of SeasonCat.byId.bonfire99.objectives){if(['bf-sparkler','bf-bucket','bf-clean'].includes(o.id))continue;s.steps[o.id]=Object.fromEntries(o.steps.map(k=>[k,1]));s.obj[o.id]={t:1};}
   if(ms===null)delete s.steps['bf-light'];else s.steps['bf-light']={start:__artNow-ms};
   if(leftovers){delete s.obj['bf-light'];delete s.obj['bf-wood'];delete s.obj['bf-code'];}
   if(morning){s.obj['bf-light']={t:1};delete s.steps['bf-light'];}
   Season.emit('state');window.HouseFamily?.debug?.sim(25,.1);window.__bfReset?.();House.dirty();
  },{ms,morning,leftovers});
 }
 async function shot(name){
 let info=await page.evaluate(()=>{HousePause.close();House.hush();window.__bfPhoto?.();return{cap:Bonfire._.fxLimit,particles:Bonfire._.fxCount,houseRung:House.Q.adapt,effectsRung:window.__bfFXQ.adapt,pinned:House.Q.pinned,touch:GameInput.touch,draws:House.ren.info.render.calls,family:HouseFamily.debug.dump()}});
 if(info.touch!==phone){await inputMode();info.touch=await page.evaluate(()=>GameInput.touch);}assert.equal(info.touch,phone);assert.equal(info.cap,cap);await page.screenshot({path:directory+name+'.png'});const old=manifest.findIndex(r=>r.mode===mode&&r.name===name);if(old>=0)manifest.splice(old,1);manifest.push({mode,name,...info});console.log('ART',mode,name,JSON.stringify(info));
 }
 async function measure(name,hidden){await page.evaluate(()=>window.__bfResume?.());await page.evaluate(hidden=>House.root.getObjectByName('bonfire-sky').visible=!hidden,hidden);const samples=await page.evaluate(()=>new Promise(resolve=>{let last=performance.now();const a=[];function step(t){a.push(t-last);last=t;if(a.length<12)requestAnimationFrame(step);else resolve(a.slice(5).sort((a,b)=>a-b))}requestAnimationFrame(step)}));const old=manifest.findIndex(r=>r.mode===mode&&r.name===name);if(old>=0)manifest.splice(old,1);manifest.push({mode,name,median:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)]});await page.evaluate(()=>House.root.getObjectByName('bonfire-sky').visible=true);}
 if(mode!=='potato'&&take('03-finished-stack-side')){await scene();await aim([-145,210,-240],[-65,275,-402]);await shot('03-finished-stack-side');}if(mode!=='potato'&&take('05-guy-chair')){await scene();await aim([-175,210,-60],[-154,280,-201]);await shot('05-guy-chair');}
 for(const [name,ms]of[['14-fountain',18000],['15-wheel',47000],['15-rockets',90000],['15-gold-willows',140000],['15-last-volley',172000]]){
  if(!take(name))continue;if(mode==='potato'&&!['14-fountain','15-gold-willows','15-last-volley'].includes(name))continue;await scene(ms);await aim([-60,210,name==='15-wheel'?-169:-74],[0,130,-650]);await page.waitForTimeout(name==='15-last-volley'?2600:name==='15-gold-willows'?1900:3200);await shot(name);
  if(name==='15-gold-willows'){await measure('finale',false);await measure('same-scene-no-fireworks',true);}
 }
 if(take('16-burning-fire-family')){await scene(25000);await aim([-60,210,-74],phone?[-45,264,-370]:[80,244,-260]);await page.evaluate(()=>HouseFamily.debug.sim(60,.1));await page.waitForTimeout(2500);await shot('16-burning-fire-family');}
 if(mode!=='potato'&&take('18-rope-spacing')){await scene(140000);for(const x of [-126,-60,20]){await aim([x,210,-170],[0,130,-650]);await page.evaluate(()=>HouseFamily.debug.sim(60,.1));await page.waitForTimeout(700);const actors=await page.evaluate(()=>HouseFamily.debug.dump().map(c=>({id:c.id,d:Math.hypot(c.x-House.P.x,c.z-House.P.z)})));assert(actors.every(c=>c.d>=145),JSON.stringify(actors));await shot('18-rope-spacing-'+x);}}
 // These real pointer gestures exercise the same held-tip mapping as the gameplay suite.
 if(take('17-sparkler-writing')){await scene();await page.evaluate(()=>{const s=Season.server.ev.bonfire99;s.steps['bf-sparkler']={gloves:1,light:1};Season.emit('state')});
 await aim([-20,210,-100],[-23,299,-137]);await page.evaluate(()=>House.act('bf.sparklers'));await until(()=>Bonfire.step==='write');await page.waitForTimeout(1000);
 const b=await page.evaluate(()=>Bonfire._.workBounds()),path=[[.18,.25],[.33,.25],[.30,.65],[.25,.72],[.20,.65],[.36,.70],[.43,.26],[.50,.70],[.395,.52],[.465,.52],[.66,.31],[.60,.26],[.53,.36],[.53,.60],[.60,.70],[.66,.65],[.72,.25],[.72,.70],[.72,.48],[.84,.25],[.72,.48],[.84,.70]];
 const pts=path.map(([x,y])=>({x:b.x+b.w*x,y:b.y+b.h*(phone?y*.32+.2:y)}));
 if(phone){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const p of pts)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else {await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...pts[0]});for(const p of pts)await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',buttons:1,...p});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...pts.at(-1)});}
 await shot('17-sparkler-writing');await page.keyboard.press('q');await until(()=>!House.focused);}
 if(mode!=='potato'&&take('19-morning-after')){await clock('1999-11-06',9);await scene(null,{morning:true});await aim([-60,210,-170],[-65,337,-402]);await shot('19-morning-after');}
 if(mode!=='potato'&&take('24-saturday-catchup')){await clock('1999-11-06',20);await scene(65000,{leftovers:true});await aim([-60,210,-74],[0,130,-650]);await page.waitForTimeout(4500);await shot('24-saturday-catchup');}
 await clock('1999-11-05',20);assert.deepEqual(f.errors,[]);console.log('PASS ART',mode);
 }finally{savedState=await page.context().storageState().catch(()=>undefined);if(savedState)await writeFile('/tmp/bf-art-storage.json',JSON.stringify(savedState));await f.browser.close();await writeFile(new URL('./shots/bonfire/pinned-review.json',import.meta.url),JSON.stringify(manifest,null,2));}
}
