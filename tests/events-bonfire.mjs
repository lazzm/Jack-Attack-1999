// Bonfire Night: every task by real keys, pointer gestures and carry placements, on disposable localhost data.
// Owner actions only move the 1999 clock; diagnostic helpers supply camera poses and projected object coordinates.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture,fixtureScale} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const base = process.argv[2] || 'http://localhost:18089';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots = new URL('./shots/bonfire/', import.meta.url).pathname; await mkdir(shots, {recursive:true});
const password='Throwaway-1999', EID='bonfire99', GY=353;
const r=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})}); assert(r.ok||r.status===409||r.status===400);
const storageState=process.env.BONFIRE_RESUME_LOGIN==='1'?await bonfireLogin(base,password):undefined;
const f=await roomFixture(base,{storageState,resume:!!storageState,opening:!!storageState,account:'Jack',password,signup:false,hour:null,launchOptions:{args:['--enable-unsafe-swiftshader','--remote-debugging-port=19294']},touch:process.env.BONFIRE_PHONE==='1',width:process.env.BONFIRE_PHONE==='1'?390:1366,height:process.env.BONFIRE_PHONE==='1'?844:860,debug:process.env.FIXTURE_DEBUG==='1',onPage: async p => {p.on('pageerror',e=>console.error('PAGE STACK',e.stack));p.on('response',r=>{if(r.status()===404)console.error('404',r.url())});}});
const {page,until,view,errors}=f; const input=await page.context().newCDPSession(page); const eye=await page.evaluate(()=>House.STAND);
const log=(...x)=>console.log(new Date().toISOString().slice(11,19),...x);
let rid=0, failed, testDate='1999-11-02', testHour=17; const perf={};
try {
 await until(()=>window.OwnerTools?.allowed);
 await page.evaluate(()=>{window.__own={};Net.on('ownerResult',m=>window.__own[m.rid]=m);window.__replies=[];Net.on('seStep',m=>window.__replies.push(m));});
 async function clock(date,hour){testDate=date;testHour=hour;await page.evaluate(()=>{if(!window.__own){window.__own={};Net.on('ownerResult',m=>window.__own[m.rid]=m);}});const id='bf-'+(++rid); await page.evaluate(([rid,date,hour])=>Net.send({t:'ownerAction',rid,action:'clock',date,hour}),[id,date,hour]); await until(`!!window.__own['${id}']`); assert((await page.evaluate(id=>window.__own[id],id)).ok);await page.waitForTimeout(900);}
 async function aim(eyeP,target,level='G'){if(await page.evaluate(()=>!!document.querySelector('#bootPower > .rm-view'))){await page.keyboard.press('q');await page.waitForTimeout(300);}await view(eyeP,target,{level});await page.evaluate(t=>{House.hush();window.HousePause?.close();House._.setMode('walk');const P=House.P,W=House.W;W.eyeNow=W.eye;P.y=W.fy-W.eye;P.rx=Math.atan2(-(t[1]-P.y),Math.hypot(t[0]-P.x,t[2]-P.z))*180/Math.PI;P.ry=Math.atan2(t[0]-P.x,-(t[2]-P.z))*180/Math.PI;House.dirty()},target);await page.waitForTimeout(300);await page.evaluate(t=>{const P=House.P;P.rx=Math.atan2(-(t[1]-P.y),Math.hypot(t[0]-P.x,t[2]-P.z))*180/Math.PI;P.ry=Math.atan2(t[0]-P.x,-(t[2]-P.z))*180/Math.PI;House.dirty()},target);}
 async function key(k){await page.keyboard.press(k);await page.waitForTimeout(700);}
 async function shot(n,{pair=true}={}){if(process.env.BONFIRE_NO_SHOTS==='1')return;
  await page.evaluate(()=>House.hush()); const original={date:testDate,hour:testHour}, size=page.viewportSize();
  const hours=pair && !n.includes('display') && !n.includes('sparkler') && !n.includes('morning') && !n.includes('tidy') ? [17,19] : [testHour];
  const phone=process.env.BONFIRE_PHONE==='1',device=phone?'phone':'desktop';
  for(const hour of hours){if(hour!==testHour)await clock(testDate,hour);await page.evaluate(()=>HousePause.close());if(phone){await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:page.viewportSize().width-3,y:6}]});await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await page.keyboard.press('Shift');await page.waitForTimeout(240);assert.equal(await page.evaluate(()=>GameInput.touch),phone,'Input context must match capture');await page.screenshot({path:shots+n+'-'+hour+'-'+device+'.png'});}
  if(testHour!==original.hour)await clock(original.date,original.hour);log('shot',n);
 }
 async function frameTime(label){const values=await page.evaluate(()=>new Promise(resolve=>{const a=[];let last=performance.now(),start=last;function frame(now){a.push(now-last);last=now;if(a.length<45&&now-start<6000)requestAnimationFrame(frame);else resolve(a.slice(5));}requestAnimationFrame(frame);}));values.sort((a,b)=>a-b);perf[label]={...await page.evaluate(()=>({width:innerWidth,cap:Bonfire._.fxLimit,particles:Bonfire._.fxCount,draws:House.ren.info.render.calls})),median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)]};log('FRAME',label,JSON.stringify(perf[label]));} 
 const state=()=>page.evaluate(()=>Season.st('bonfire99'));
 async function got(o,s){if(o==='bf-code'||o==='bf-light'&&s==='start'){for(let n=0;n<3;n++){if(await page.evaluate(([o,s])=>!!Season.st('bonfire99').steps[o]?.[s],[o,s]))break;await page.waitForTimeout(350);await key('f');}}await until(`!!Season.st('bonfire99').steps['${o}']?.['${s}']`);}
 async function draw(){
  const {step,b}=await page.evaluate(()=>({step:Bonfire.step,b:Bonfire._.workBounds()}));let ps;
  if(step==='face'){ps=[];for(const cx of [.3,.7])for(let i=0;i<=8;i++){const a=i/8*Math.PI*2;ps.push([b.x+b.w*(cx+Math.cos(a)*.095),b.y+b.h*(.34+Math.sin(a)*.095)]);}for(let i=0;i<=9;i++){const a=i/9*Math.PI;ps.push([b.x+b.w*(.5+Math.cos(a)*.24),b.y+b.h*(.61+Math.sin(a)*.2)]);}}
  else if(step==='write')ps=[[.18,.25],[.33,.25],[.30,.65],[.25,.72],[.20,.65],[.36,.70],[.43,.26],[.50,.70],[.395,.52],[.465,.52],[.66,.31],[.60,.26],[.53,.36],[.53,.60],[.60,.70],[.66,.65],[.72,.25],[.72,.70],[.72,.48],[.84,.25],[.72,.48],[.84,.70]].map(([x,y])=>[b.x+b.w*x,b.y+b.h*y]);
  else ps=(await page.evaluate(()=>Bonfire._.path())).filter((_,i)=>i%3===0);
  assert(ps.length);await input.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:ps[0][0],y:ps[0][1]});await input.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:ps[0][0],y:ps[0][1]});for(const [x,y]of ps)await input.send('Input.dispatchMouseEvent',{type:'mouseMoved',buttons:1,x,y});await input.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:ps.at(-1)[0],y:ps.at(-1)[1]});await page.waitForTimeout(950);
 }

 if(process.env.BONFIRE_CATCHUP_ONLY==='1'){
  await clock('1999-11-06',17);await until(()=>!!(window.Bonfire?.on&&House.THINGS['bf.torch']));await aim([-53,GY-eye,-424.7],[-53,GY-62,-490.7]);await key('f');assert(!(await state()).steps['bf-light']?.start,'No daylight catch-up');
  await clock('1999-11-06',19);await aim([-53,GY-eye,-424.7],[-53,GY-62,-490.7]);await key('f');await got('bf-light','start');const start=(await state()).steps['bf-light'].start;assert.equal((await state()).display,'leftovers');assert(!(await state()).obj['bf-code']);assert(!(await state()).obj['bf-wood']);assert.equal(await page.evaluate(()=>House.held()),null);
  for(const [stage,ms]of[['fountain',8000],['wheel',25000],['rocket',46000],['gold-willows',65000],['last-volley',81000]]){const delay=ms-(Date.now()-start);if(delay>0)await page.waitForTimeout(delay);await aim([-53,GY-eye,-320.4],[0,175,-1579.2]);await shot('24-catchup-'+stage,{pair:false});}
  await got('bf-light','finale');assert.equal((await state()).paid['bf-light'],15);await shot('24-catchup-finished',{pair:false});await clock('1999-11-06',23);assert(!await page.evaluate(()=>Bonfire.on));assert.deepEqual(errors,[]);log('PASS Saturday catch-up: real rope input, no preparations/torch, 90 seconds, same reward, night and phone captures');await f.browser.close();process.exit(0);
 }
 assert.equal(await page.evaluate(() => SeasonCat.phaseOf(SeasonCat.byId.bonfire99,{mm:11,dd:1,hour:9})),null,'Halloween owns the morning');
 await clock('1999-11-02',17);await until(()=>window.Bonfire?.on&&Bonfire.phase==='lead'&&!!House.THINGS['bf.wood.paper']);
 await aim([-5,GY-eye,-896.5],[-65,GY-50,-1068.5]);await shot('01-lead-stack');
 await aim([-60,GY-eye,-996],[-184,GY-173,-1238]);await shot('02-tin-and-rope');
 // One real carry per piece, with all ten independent server acknowledgements.
 for(const id of await page.evaluate(()=>Bonfire._.WOOD)){
  if(process.env.BONFIRE_RESUME_WOOD==='1' && (await state()).steps['bf-wood']?.[id]){log('resume already placed',id);continue;}
  const p=await page.evaluate(id=>{const t=House.THINGS['bf.wood.'+id];return {...t.at}},id);
  await aim([p.x+43,GY-eye,p.z+60],[p.x,p.y-6,p.z]);log('pick',id);await key('e');await until(`House.held()==='bf.wood.${id}'`);
  await aim([-55,GY-eye,-966.5],[-65,GY-12,-1068.5]);await key('e');await got('bf-wood',id);log('stacked',id);await shot('03-stack-'+id);
 }
 assert((await state()).obj['bf-wood']);await aim([30,GY-eye,-876.5],[-65,GY-70,-1068.5]);await shot('03-finished-stack');await aim([-155,GY-eye,-926.5],[-65,GY-65,-1068.5]);await shot('03-finished-stack-side');
 // Guy: stuff, tie, draw, hat, then E carries him to his actual chair.
 if(!(process.env.BONFIRE_RESUME_PREP==='1' && (await state()).obj['bf-guy'])){
 await aim([-60,GY-eye,200],[-60,GY-88,90]);await key('f');await until(()=>Bonfire.step==='stuff');await page.waitForTimeout(700);
 for(const step of ['stuff','tie','face']){await until(`Bonfire.step==='${step}'||!!Season.st('bonfire99')?.steps?.['bf-guy']?.['${step}']`);for(let i=0;i<3&&await page.evaluate(s=>Bonfire.step===s,step);i++)await draw();await got('bf-guy',step);await shot('04-guy-'+step);}
 await key('f');await got('bf-guy','hat');await until(()=>!House.focused);
 await aim([-15,GY-eye,225],[-60,GY-52-76,141]);await key('e');await until(()=>House.held()==='bf.guy.ready');
 await aim([-112,GY-eye,-485],[-154,GY-64,-550]);await key('e');await got('bf-guy','place');await aim([-55,GY-eye,-439],[-154,GY-100,-550]);await shot('05-guy-chair');
 }
 // Mom's supper: wash, prick all four, foil, oven/timer, oven gloves, carry outside.
 if(!(process.env.BONFIRE_RESUME_PREP==='1' && (await state()).obj['bf-food'])){
 await aim([-174,GY-eye,-38],[-174,GY-99,-138]);await key('f');await until(()=>Bonfire.step==='wash');await page.waitForTimeout(700);await draw();await got('bf-food','wash');await shot('06-potatoes-washed');
 await until(()=>Bonfire.step==='prick');
 const potatoes=await page.evaluate(()=>Bonfire._.potatoPoints());for(const [x,y] of potatoes){await page.mouse.click(x,y);await page.waitForTimeout(100);}
 await got('bf-food','prick');await shot('07-potatoes-pricked');await draw();await got('bf-food','foil');await shot('08-potatoes-foil');
 await key('f');await got('bf-food','oven');await page.waitForTimeout(6200);await shot('09-oven-gloves');await key('f');await got('bf-food','gloves');await until(()=>!House.focused);
 await aim([-174,GY-eye,-38],[-174,GY-99,-138]);await key('e');await until(()=>House.held()==='bf.tray');
 await aim([-45,GY-eye,-304],[-108,GY-66,-305]);await key('e');await got('bf-food','serve');await shot('10-supper');await aim([-165,GY-eye,350],[-246,GY-101,300]);await shot('10-parkin-worktop');
 }
 // Physical safety checks; the taper refuses until the other four have been checked.
 await aim([-70,GY-eye,-1179],[-176,GY-77,-1219]);if(!(await state()).obj['bf-code']){await key('f');assert(!(await state()).steps['bf-code']?.taper);}
 await aim([-105,GY-eye,-1201],[-184,GY-173,-1238]);await key('f');await got('bf-code','tin');await shot('11-code-tin');
 await aim([300,GY-eye,-231],[235,GY-18,-196]);await key('f');await got('bf-code','water');await shot('11-bucket');
 await aim([75,73-eye,170],[122,70,112],'U');await key('f');await got('bf-code','pets');await shot('12-cat-check');await key('q');await until(()=>!House.focused);
 await aim([-53,GY-eye,-424.7],[-53,GY-62,-490.7]);await key('f');await got('bf-code','line');await shot('12-code-line');
 await aim([-70,GY-eye,-1179],[-176,GY-77,-1219]);await key('f');await got('bf-code','taper');await shot('12-code-taper');
 if(process.env.BONFIRE_PREP_ONLY==='1'){const saved=await state();assert(['bf-wood','bf-guy','bf-food','bf-code'].every(id=>!!saved.obj[id]));await page.reload({waitUntil:'domcontentloaded'});await until(()=>!!(window.Bonfire?.on&&House.live&&AccountGate.allowed&&House.THINGS['bf.parkin']));const restored=await state();assert.deepEqual(restored.paid,saved.paid);assert.deepEqual(restored.art.face,saved.art.face);assert.deepEqual(errors,[]);log('PASS bonfire fresh preparations: every carry/gesture, counter clearance, art and refresh');await f.browser.close();process.exit(0);}

 await clock('1999-11-05',17);await aim([75,73-eye,170],[122,70,112],'U');await key('f');await page.waitForTimeout(750);assert(await page.evaluate(()=>Bonfire.catHiding));await shot('13-cat-hiding');await key('q');await until(()=>!House.focused);
 await aim([-20,GY-eye,-357.4],[-60,GY-48,-400.4]);await key('f');assert(!(await state()).steps['bf-light']?.start,'too early');
 await clock('1999-11-05',19);
 await aim([-60,GY-eye,-302.4],[0,-350,-1140.7]);await frameTime('desktop-quiet');
 await aim([-60,GY-eye,-362.4],[-60,GY-48,-400.4]);await key('f');await got('bf-light','start');assert.equal(await page.evaluate(()=>House.held()),'bf.torch');await shot('14-display-fountain');
 const started=(await state()).steps['bf-light'].start;
 // Leave the rope during the show, then return after its clock has elapsed.
 await key('q');await aim([75,GY-eye,-225],[0,-350,-1140.7]);
 for(const [stage,ms]of[['fountain',18000],['wheel',45000],['rocket',85000],['finale',125000],['gold-willows',151000],['last-volley',169000]]){
  const wait=ms-(Date.now()-started);if(wait>0)await page.waitForTimeout(wait);
  await aim([-60,GY-eye,-302.4],[0,175,-1579.2]);
  if(stage==='finale'){await frameTime('desktop-finale');await page.evaluate(()=>House.root.getObjectByName('bonfire-sky').visible=false);await frameTime('desktop-finale-no-fireworks');await page.evaluate(()=>House.root.getObjectByName('bonfire-sky').visible=true);}
  await shot('15-display-'+stage,{pair:false});assert(await page.evaluate(()=>Bonfire._.fxCount<=Bonfire._.fxLimit));
 }
 // The show keeps its epoch across a reload. The held torch is put back by the existing grab refresh rule.
 await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.Bonfire?.on&&AccountGate.allowed&&House.live&&!!House.THINGS['bf.torch']&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal((await state()).steps['bf-light'].start,started,'display epoch survives refresh');assert.equal(await page.evaluate(()=>House.mode),'walk');
 await aim([-60,GY-eye,-362.4],[-60,GY-48,-400.4]);await key('f');await until(()=>House.held()==='bf.torch'||!!Season.st('bonfire99').obj['bf-light']);
 await aim([160,GY-eye,-186.3],[0,-350,-1140.7]);const wait=183000-(Date.now()-started);if(wait>0)await page.waitForTimeout(wait);
 await aim([-60,GY-eye,-302.4],[0,-330,-1218.1]);await got('bf-light','finale');await shot('15-display-finished',{pair:false});
 await key('q');await until(()=>!House.held());
 await aim([120,GY-eye,-65],[174,GY-57,-148]);await key('f');await got('bf-sparkler','gloves');await shot('16-warm-clothes');
 await aim([-20,GY-eye,-347.9],[-23,GY-54,-384.9]);await key('f');await until(()=>Bonfire.step==='write');await page.waitForTimeout(700);await draw();await shot('17-sparkler-writing');await key('f');await got('bf-sparkler','write');await until(()=>!House.focused);
 await aim([-20,GY-eye,-347.9],[-23,GY-65,-384.9]);await key('e');await until(()=>House.held()==='bf.spent');
 await aim([12,GY-eye,-340.9],[12,GY-20,-384.9]);await key('e');await got('bf-bucket','cool');await shot('18-hot-end-water');
 let paid=JSON.stringify((await state()).paid);await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.Bonfire?.on&&AccountGate.allowed&&House.live&&!!House.THINGS['bf.torch']&&!document.querySelector('.hs-loading,#houseEntry'));
 assert.equal(JSON.stringify((await state()).paid),paid);assert((await state()).art.face.length>=12);assert((await state()).art.sparkler.length>=12);
 await clock('1999-11-06',9);await until(()=>Bonfire.phase==='tail');await aim([-20,GY-eye,-908.5],[-65,GY-5,-1068.5]);await shot('19-morning-ashes');
 for(let i=1;i<=6;i++){
  const p=await page.evaluate(i=>House.THINGS['bf.clean.'+i].at,i);await aim([p.x+35,GY-eye,p.z+48],[p.x,p.y-2,p.z]);await key('e');await until(`House.held()==='bf.clean.${i}'`);
  await aim([306,GY-eye,-220],[370,GY-113,-280]);await key('e');await got('bf-clean','c'+i);await shot('20-tidy-'+i,{pair:false});
 }
 await shot('20-garden-tidied');assert.equal(Object.keys((await state()).obj).length,8);
 paid=JSON.stringify((await state()).paid);await clock('1999-11-06',19);assert(await page.evaluate(()=>Bonfire.on));assert(!await page.evaluate(()=>Bonfire.DEC.line.visible),'Finished players see ash after noon');await shot('23-saturday-finished-ashes',{pair:false});
 // Owner restart preserves the paid ledger and models an account which missed Friday. No wood/code jobs.
 await page.evaluate(()=>{window.__reset=null;Net.on('ownerResult',m=>{if(m.rid==='bf-reset')window.__reset=m});Net.send({t:'ownerAction',rid:'bf-reset',action:'season',event:'bonfire99'});});
 await until(()=>!!window.__reset);assert(await page.evaluate(()=>window.__reset.ok));
 await aim([-53,GY-eye,-424.7],[-53,GY-62,-490.7]);await key('f');await got('bf-light','start');const catchStart=(await state()).steps['bf-light'].start;assert.equal((await state()).display,'leftovers');assert(!(await state()).obj['bf-code']);
 for(const [name,ms]of[['fountain',8000],['wheel',25000],['rocket',46000],['gold-finale',66000],['last-bang',81000]]){const wait=ms-(Date.now()-catchStart);if(wait>0)await page.waitForTimeout(wait);await aim([-53,GY-eye,-320.4],[0,175,-1579.2]);await shot('24-catchup-'+name,{pair:false});}
 await got('bf-light','finale');assert.equal(JSON.stringify((await state()).paid),paid,'Catch-up does not pay twice');
 await clock('1999-11-06',23);assert(!await page.evaluate(()=>Bonfire.on));
 // Re-enter at night: phone portrait and landscape, physical touch action and touch drawing in a restart.
 await clock('1999-11-05',19);await page.setViewportSize({width:390,height:844});await aim([-60,GY-eye,-302.4],[0,-350,-1140.7]);await shot('21-phone-night');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
 await page.setViewportSize({width:844,height:390});await aim([-60,GY-eye,-302.4],[0,-350,-1140.7]);await shot('22-phone-landscape');
 await writeFile(shots+'frame-times.json',JSON.stringify(perf,null,2));assert.deepEqual(errors,[]);
 // A second real account gets its own cast. Close the house first to keep one rendered page alive.
 const family='Family'+Date.now().toString(36);await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:family,pass:password})});
 await page.close();const context=await f.browser.newContext({viewport:{width:390,height:844},hasTouch:true});await context.addInitScript(()=>localStorage.setItem('jhp_device_view','jackos'));const normal=await context.newPage();
 // This page bypasses roomFixture; give it the same navigation allowance on software WebGL.
 normal.setDefaultNavigationTimeout(90000*fixtureScale);
 const normalUntil=async fn=>{const end=Date.now()+90000*fixtureScale;while(Date.now()<end){if(await normal.evaluate(fn))return;await normal.waitForTimeout(150)}throw Error('Non-owner state timeout: '+fn)};
 await normal.goto(base+'/?date99=11-02&time=19:00:00',{waitUntil:'domcontentloaded'});await normal.locator('[name=name]').fill(family);await normal.locator('[name=password]').fill(password);await normal.locator('#accountGate [type=submit]').click();
 await normalUntil(()=>!!(window.AccountGate?.allowed||document.querySelector('.account-identity #accountFirst')));if(await normal.locator('.account-identity #accountFirst').count())await normal.locator('#accountGate [type=submit]').click();
 await normalUntil(()=>!!(AccountGate.allowed&&window.Cast&&window.Season));const cast=await normal.evaluate(()=>({sister:Cast.n('sister'),task:Season.cast(SeasonCat.byId.bonfire99.objById['bf-guy'].text)}));assert.notEqual(cast.sister,'Crystal');assert(cast.task.includes(cast.sister));assert(!cast.task.includes('{sister}'));log('non-owner cast',JSON.stringify(cast));await normal.screenshot({path:shots+'25-non-owner-cast.png'});await context.close();log('PASS bonfire: all eight objectives, real inputs, refresh, dates and phone sizes');
} catch(e) { failed=e;console.error(e.stack);await page.screenshot({path:shots+'FAIL.png'}).catch(()=>{});console.error('STATE',JSON.stringify(await page.evaluate(()=>({s:Season.st('bonfire99'),mode:House.mode,held:House.held(),step:Bonfire?.step,hot:House.ui.el.textContent.slice(-1200)})).catch(()=>null))); }
finally {await f.browser.close();}
if(failed)process.exit(1);
