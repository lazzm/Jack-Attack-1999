// HALLOWEEN 1999 (js/season.js, js/season-halloween.js, mods/season.js) on a throwaway server, driven with the owner's
// 1999 clock. Registers the owner account "Jack" (admin endpoint), so use disposable localhost data only:
//   cd app && PORT=18197 DATA_DIR=/tmp/jhp-hw ADMIN_TOKEN=testtoken node server.js
//   cd tests && node events-halloween.mjs http://localhost:18197
// Checks: off on 10 Oct; decorations on 31 Oct; the porch light; filling the bowl; {sister}'s decorations; the full six-step
// pumpkin carve with real mouse drags; trick-or-treaters answered at the front door (allergy refusal included); rewards paid
// once only (also across the owner's "start again"); a refresh keeps everything; the morning-after wrappers; off again.
// Screenshots: tests/shots/halloween/.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2]||'http://localhost:18197';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Throwaway localhost server only');
const shots=new URL('./shots/halloween/',import.meta.url).pathname;await mkdir(shots,{recursive:true});
const password='Throwaway-1999',GY=353,EID='halloween99';
const t0=Date.now(),log=(...a)=>console.log(((Date.now()-t0)/1000).toFixed(1).padStart(6)+'s',...a);
const reg=await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:'Jack',pass:password})});
assert(reg.ok||reg.status===409||reg.status===400,'admin register '+reg.status);
const f=await roomFixture(base,{account:'Jack',password,signup:false,hour:null});
const {page,until,view,errors}=f;
const EYE=await page.evaluate(()=>House.STAND||128); // (the live standing eye height)
let failed=null;
try{
 await until(()=>window.OwnerTools?.allowed);
 await page.evaluate(()=>{window.__own={};Net.on('ownerResult',m=>window.__own[m.rid]=m);window.__ec=null;Net.on('ecMe',m=>window.__ec=m);});
 let rid=0;
 async function owner(action,args={}){const id='t'+(++rid)+'-'+Date.now();await page.evaluate(([id,action,args])=>Net.send({t:'ownerAction',rid:id,action,...args}),[id,action,args]);await until(`!!window.__own['${id}']`);const r=await page.evaluate(id=>window.__own[id],id);assert(r.ok,'owner '+action+': '+r.msg);await page.waitForTimeout(300);return r;}
 async function clock(date,hour){await owner('clock',{date,hour});await until(`OwnerTools.clock?.date==='${date}'&&OwnerTools.clock.hour===${hour}`);await page.waitForTimeout(600);}
 async function rupees(){await page.evaluate(()=>{window.__ec=null;Net.send({t:'ecMe'})});await until(()=>window.__ec&&Number.isFinite(window.__ec.bal));return page.evaluate(()=>window.__ec.bal);}
 const st=()=>page.evaluate(id=>Season.st(id),EID);
 async function aim(eye,target,level='G'){await view(eye,target,{level});await page.evaluate(t=>{House.hush();House._.setMode('walk');const P=House.P,W=House.W;if(!W.seat){W.eyeNow=W.eye;P.y=W.fy-W.eye;P.rx=Math.atan2(-(t[1]-P.y),Math.hypot(t[0]-P.x,t[2]-P.z))*180/Math.PI;P.ry=Math.atan2(t[0]-P.x,-(t[2]-P.z))*180/Math.PI;House.dirty()}},target);await page.waitForTimeout(250);} // (the eye starts at the standing height: no drift after aiming)
 async function key(k){await page.keyboard.press(k);await page.waitForTimeout(350);}
 const shot=async n=>{await page.evaluate(()=>House.hush());await page.waitForTimeout(500);await page.screenshot({path:shots+n+'.png'});log('shot',n,await page.evaluate(()=>House.ren.info.render.calls)+' draws');};
 async function drag(points,{steps=2,pause=25}={}){await page.mouse.move(points[0][0],points[0][1]);await page.mouse.down();for(const [x,y] of points){await page.mouse.move(x,y,{steps});await page.waitForTimeout(pause);}await page.mouse.up();}

 // ---- 1. before the window: nothing at all
 await clock('1999-10-10',14);
 assert.equal(await page.evaluate(()=>Season.active().length),0,'no event on 10 Oct');
 assert(!await page.evaluate(()=>window.Halloween?.on),'Halloween off on 10 Oct');
 await aim([300,GY-150,560],[300,GY-90,700]);await shot('00-off-10oct-hall');
 log('off on 10 Oct: ok');

 // ---- 2. Halloween afternoon: decorations, objectives, the porch light before five
 await clock('1999-10-31',16);
 await until(()=>window.Halloween?.on&&Halloween.phase==='day'&&Season.st('halloween99')?.open);
 await until(()=>!!House.THINGS['hw.bowl']&&!!House.SPOTS['hw.porch']&&!!House.THINGS['hw.paper']);
 for(const room of ['hall','kitchen','lounge','drive','garden'])await page.evaluate(r=>House.buildRoom(House.ROOMS[r]),room);
 await page.waitForTimeout(500);
 const dec=await page.evaluate(()=>Object.fromEntries(Object.entries(Halloween.DEC).map(([k,d])=>[k,{vis:d.group.visible,meshes:(()=>{let n=0;d.group.traverse(o=>{if(o.isMesh)n++});return n})()}])));
 log('decor',JSON.stringify(dec));
 for(const r of ['hall','kitchen','lounge','drive','garden'])assert(dec[r]?.vis&&dec[r].meshes>0,'decorations in '+r);
 for(const [r,d] of Object.entries(dec))assert(d.meshes<=24,'decor in '+r+' is batched: '+d.meshes+' draws');
 const objs=await page.evaluate(()=>Season.objectives().map(o=>o.o.id));
 assert.deepEqual(objs,['hw-pumpkin','hw-decorate','hw-lights','hw-bowl','hw-treat']);
 const bal0=await rupees();log('Rupees at start',bal0);
 await aim([330,GY-EYE,640],[354,GY-118,697.4]);await key('f');
 await until(()=>Season.st('halloween99').porch===1&&!!Season.st('halloween99').obj['hw-lights']);
 assert.equal((await st()).paid['hw-lights'],5,'porch light paid 5');
 await aim([300,GY-150,560],[300,GY-90,700]);await shot('01-hall-front-door');
 await aim([300,GY-150,640],[215,GY-110,70]);await shot('02-hall-chains');
 log('porch light: ok');

 // ---- 3. fill the bowl from the tin under the stairs
 await page.evaluate(()=>House.setDoor('cupboard',true,true));await page.waitForTimeout(400);
 await aim([300,GY-EYE,421],[348,GY-8,422]);await key('e');
 await until(()=>House.held()==='hw.tin');
 await aim([262,GY-EYE,640],[224,GY-70,663]);await key('e');
 await until(()=>!!Season.st('halloween99').obj['hw-bowl']);
 assert.equal((await st()).bowl.reduce((a,b)=>a+b,0),47,'bowl filled (Dad ate one)');
 await page.waitForTimeout(1500);
 await aim([290,GY-120,610],[224,GY-66,668]);await shot('03-sweets-bowl');
 log('bowl: ok');

 // ---- 4. {sister}'s decorations: five things to five glowing places
 const places={bat:[[268,GY-EYE,470],[268,GY-250,420]],web:[[250,GY-EYE,130],[216,GY-255,71]],spider:[[260,GY-EYE,300],[208.6,GY-182,300]],lantern:[[-180,GY-EYE,442],[-239,GY-116,442]],ghost:[[-60,GY-EYE,640],[-60,180,686]]};
 for(const [id,[eye,target]] of Object.entries(places)){
  await aim([280,GY-EYE,360],[236,GY-12,330]);
  await page.evaluate(id=>{House.grab('hw.decor.'+id)},id);await until(`House.held()==='hw.decor.${id}'`);
  await aim(eye,target);await key('e');
  await until(`!!Season.st('halloween99').decor['${id}']`);
 }
 await until(()=>!!Season.st('halloween99').obj['hw-decorate']);
 await aim([300,GY-EYE,560],[268,GY-250,420]);await shot('04-bat-and-chains');
 await aim([60,GY-150,600],[-60,170,700]);await shot('05-lounge-window-ghost');
 log('decorations: ok');

 // ---- 5. the pumpkin, all six steps, with real mouse movement
 await aim([-110,GY-EYE,250],[-130,GY-47,170]);await key('e'); // (stand clear of the kitchen chairs: a pose the player can really take)await until(()=>House.held()==='hw.paper');
 await aim([-45,GY-EYE,264],[-45,GY-78,174]);await key('e');
 await until(()=>!!Season.st('halloween99').steps['hw-pumpkin']?.paper);
 await page.waitForTimeout(1300);
 await aim([-45,GY-EYE,264],[-45,GY-88,174]);await shot('06-carving-table');
 await key('f');await until(()=>Halloween.carving==='lid');await page.waitForTimeout(500);
 for(let pass=0;pass<3&&await page.evaluate(()=>Halloween.carving==='lid');pass++)await drag(await page.evaluate(()=>Halloween._.screen('lid')),{steps:1,pause:0});
 await shot('07-lid-cut');
 await until(()=>Halloween.carving==='scoop');await page.waitForTimeout(400);
 for(let pass=0;pass<12&&await page.evaluate(()=>Halloween.carving==='scoop');pass++)await drag(await page.evaluate(()=>Halloween._.screen('guts')),{steps:1,pause:0});
 await until(()=>Halloween.carving==='face');await shot('08-scooped');
 await key('1');await until(()=>Halloween.carving==='carve');await page.waitForTimeout(400);await shot('09-stencil');
 const nf=await page.evaluate(()=>Halloween.FACES.grin.length);
 for(let i=0;i<nf;i++)for(let pass=0;pass<3&&await page.evaluate(i=>!Halloween._.pk().cut[i],i);pass++)await drag(await page.evaluate(i=>Halloween._.screen('face',i),i),{steps:1,pause:0});
 await until(()=>Halloween.carving==='candle');await shot('10-carved');
 await key('f');await until(()=>!!Season.st('halloween99').steps['hw-pumpkin']?.candle&&!House.focused&&!!House.THINGS['hw.lantern']);
 await page.waitForTimeout(1200);
 await aim([-20,GY-EYE,265],[-45,GY-88,174]);await key('e');await until(()=>House.held()==='hw.lantern');
 await aim([264,GY-EYE,1252],[236,GY-89,1295]);await key('e'); // the gatepost by the front gate (House.FRONT.FZ 1300)
 await until(()=>!!Season.st('halloween99').obj['hw-pumpkin']);
 assert.equal((await st()).paid['hw-pumpkin'],20,'pumpkin paid 20');
 log('carving: ok');

 // ---- 6. trick-or-treaters (from five o'clock)
 await clock('1999-10-31',18);
 await aim([300,GY-EYE,640],[300,GY-100,700]);
 if(!await page.evaluate(()=>House.DOORS.front.open)){await key('f');await until(()=>House.DOORS.front.open);}
 await aim([262,GY-EYE,640],[224,GY-66,663]);await key('e');await until(()=>House.held()==='hw.bowl');
 let refused=false;
 for(let n=0;n<5;n++){
  await until(()=>Halloween.kids?.state==='wait');
  const kids=await page.evaluate(()=>Halloween.kids);log('group',n+1,JSON.stringify(kids.list));
  await aim([300,GY-EYE,650],[300,GY-100,790]);
  if(n===0)await shot('11-trick-or-treaters');
  await key('f');await until(()=>Halloween.handing);await page.waitForTimeout(800);
  if(n===0)await shot('12-handing-out');
  const before=await page.evaluate(()=>Halloween.kids.list.map(k=>k.got));
  const left=(await st()).bowl.slice();
  for(const k of kids.list){
   if(k.avoid==='nuts'&&!refused){const b=await page.evaluate(()=>Halloween.kids.list.map(k=>k.got));await key('1');assert.deepEqual(await page.evaluate(()=>Halloween.kids.list.map(k=>k.got)),b,'nut allergy refused');refused=true;}
   for(let w=0;w<k.want;w++){const pick=[1,2,3,4,5,0].find(i=>left[i]>0&&!(k.avoid==='nuts'&&i===0)&&!(k.avoid==='choc'&&i===0));left[pick]--;await key(String(pick+1));}
  }
  await until(()=>!Halloween.handing);
  await until(`(Season.st('halloween99').treat.happy|0)>=${n+1}`);
 }
 await until(()=>!!Season.st('halloween99').obj['hw-treat']);
 assert.equal((await st()).paid['hw-treat'],20,'trick-or-treat paid 20');
 await page.waitForTimeout(1500);
 await aim([90,GY-150,1215],[236,GY-95,1295]);await shot('13-lantern-on-gatepost');
 await aim([300,GY-160,1180],[300,GY-80,700]);await shot('14-front-at-night');
 log('trick-or-treat: ok');

 // ---- 7. rewards: once per loop, even after the owner starts the event again
 const bal1=await rupees();log('Rupees after',bal1,'(+'+(bal1-bal0)+')');
 assert.equal(Object.values((await st()).paid).reduce((a,b)=>a+b,0),5+10+10+20+20,'each objective paid exactly once (server record)');assert(bal1-bal0>=65,'Rupees credited');
 await page.evaluate(()=>{for(const s of ['on','on'])Season.step('halloween99','hw-lights',s);Season.step('halloween99','hw-pumpkin','place');});await page.waitForTimeout(1500);
 assert.equal(await rupees(),bal1,'replayed steps pay nothing');
 const snap=await st();

 // ---- 8. refresh: nothing changes
 await page.reload({waitUntil:'domcontentloaded'});
 await until(()=>window.House?.live&&window.Halloween?.on&&!!House.THINGS['hw.lantern']&&!document.querySelector('.hs-loading,#houseEntry'));
 await page.waitForTimeout(1500);
 const after=await st();
 for(const k of ['obj','paid','decor','bowl','porch','tin'])assert.deepEqual(after[k],snap[k],'refresh kept '+k);
 assert(await page.evaluate(()=>['bat','web','spider','lantern','ghost'].every(id=>House.THINGS['hw.decor.'+id]?.snap==='hw.s.'+id)),'decorations still up');
 assert(await page.evaluate(()=>House.THINGS['hw.lantern'].snap==='hw.s.step'&&Halloween._.pk().allCut),'lantern still carved on the gatepost');
 // A refresh hands back what you were carrying (docs/PHYSICS.md): the sweets bowl is still in your hands.
 await until(()=>House.held()==='hw.bowl');
 await page.evaluate(()=>House.putBack());await until(()=>!House.held());
 log('refresh: ok');
 await page.evaluate(()=>{window.__own={};Net.on('ownerResult',m=>window.__own[m.rid]=m);window.__ec=null;Net.on('ecMe',m=>window.__ec=m);});
 await owner('season',{event:EID});await page.waitForTimeout(1200);
 assert.deepEqual((await st()).obj,{},'owner start-again clears progress');
 await clock('1999-10-31',16);
 await aim([330,GY-EYE,640],[354,GY-118,697.4]);await key('f');
 await until(()=>!!Season.st('halloween99').obj['hw-lights']);
 assert.equal(await rupees(),bal1,'no second payment after starting again');
 log('rewards once: ok');

 // ---- 9. the diary page, the morning after, and off again
 await page.evaluate(()=>window.stDiary?.refresh?.());
 const week=await page.evaluate(()=>Season.week());assert(week.some(r=>r.head?.startsWith('Halloween')),'diary This week page');
 await clock('1999-11-01',9);
 await until(()=>Halloween.phase==='tail'&&!!House.THINGS['hw.wrap.1']);
 await aim([300,GY-150,560],[280,GY,640]);await shot('15-morning-after');
 await page.evaluate(()=>House.grab('hw.wrap.1'));await until(()=>House.held()==='hw.wrap.1');
 await aim([170,GY-EYE,90],[170,GY-60,20]);await key('e');
 await until(()=>!!Season.st('halloween99').steps['hw-clean']?.w1);
 log('tail: ok');
 await clock('1999-11-02',14);
 await until(()=>!window.Halloween.on);
 assert(await page.evaluate(()=>!House.THINGS['hw.bowl']&&!House.SPOTS['hw.porch']&&Object.values(Halloween.DEC).every(d=>!d.group.visible)),'all gone on 2 Nov');
 await aim([300,GY-150,560],[300,GY-90,700]);await shot('16-off-2nov');
 log('off again: ok');
 await owner('clock',{clear:true});
 const bad=errors.filter(e=>!/GPU stall|ReadPixels|favicon/.test(e));
 assert.deepEqual(bad,[],'console errors');
}catch(e){failed=e;console.error('FAIL',e.message);try{await page.screenshot({path:shots+'failure.png'})}catch{}}
await f.browser.close();
if(failed){console.log('events-halloween: FAIL');process.exit(1)}
console.log('events-halloween: PASS');
