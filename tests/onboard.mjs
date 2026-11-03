// Disposable first-session review. Camera positioning is explicit; inputs and saves use production paths.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
import {insertCase} from './case-actions.mjs';
const base=process.argv[2],tag=process.argv[3]||'after',profile=process.argv[4]||'phone';
const guidanceOnly=process.argv.includes('--only=guidance'),idleRound=process.argv.includes('--idle'),roundOnly=process.argv.includes('--only=round');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('shots/onboard/',import.meta.url);await mkdir(dir,{recursive:true});
const phone=profile.startsWith('phone'),landscape=profile==='phone-landscape';
const size={width:phone?(landscape?915:412):1366,height:phone?(landscape?412:915):860};
const f=await roomFixture(base,{opening:true,...size,touch:phone,contextOptions:phone?{isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'}:{},storage:{jhp_touch_slow_asked:true}});
const {page:p,until,view,browser,errors}=f,results={};
const shot=async n=>{await p.screenshot({path:new URL(`${tag}-${profile}-${n}.png`,dir).pathname});console.log('Captured',profile,n);};
async function aim(eye,target){
 await view(eye,target);await p.evaluate(()=>{House._.setMode('walk');House.dirty()});await p.waitForTimeout(500);
 // Walking restores the actual standing eye. Aim from that eye after it settles, just as a player looks at the prop.
 await p.evaluate(([x,y,z])=>{const P=House.P;P.rx=Math.atan2(-(y-P.y),Math.hypot(x-P.x,z-P.z))*180/Math.PI;P.ry=Math.atan2(x-P.x,-(z-P.z))*180/Math.PI;House.dirty();},target);
 await p.waitForTimeout(250);
}
async function press(k){if(phone)await p.locator(`.ht-acts [data-k="${k}"]`).tap();else await p.keyboard.press(k);}
async function gb(k){
 if(!phone){await p.keyboard.press(({a:'z',start:'Enter',up:'ArrowUp'})[k]);await p.waitForTimeout(300);return;}
 const q=await p.evaluate(k=>{if(k!=='up')return RoomTV._dbg().gbScreen(k);const H=House,v=new H.T.Vector3(-2.2,-2.9,1.2);H.THINGS.gb.obj.localToWorld(v);v.project(H.camera);const r=H.ren.domElement.getBoundingClientRect();return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2}},k);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:q.x,y:q.y,id:7}]});await p.waitForTimeout(140);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await p.waitForTimeout(300);
}
try{
 await shot('01-arrival');await p.waitForTimeout(500);await shot('02-help');
 results.arrival=await p.evaluate(()=>({note:document.querySelector('.rm-note.on')?.textContent,coach:document.querySelector('.ht-coach')?.textContent,deadUse:!!document.querySelector('.ht-acts [data-k=f][disabled]'),targets:StoryGuide.targets()}));
 // Real stick movement, including lift. CDP sends the end with no active fingers.
 if(phone){const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:75,y:size.height-160,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:75,y:size.height-205,id:1}]});await p.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else {await p.keyboard.down('w');await p.waitForTimeout(650);await p.keyboard.up('w');}
 await p.waitForTimeout(600);await shot('03-walk-lift');
 if(phone){const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:size.width-75,y:size.height*.4,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:size.width-125,y:size.height*.42,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await shot('03b-look');}
 results.stick=await p.evaluate(()=>({fingers:window.HouseTouch?._fingers(),opacity:getComputedStyle(document.querySelector('.ht-stick')||document.body).opacity}));
 // Empty desk outlines and physical pickup, then the direction to the receiving slot.
 await aim([60,-55,130],[-61,-1,-12]);await shot('04-empty-desk');
 const pos=await p.evaluate(()=>{const t=House.THINGS['media.box.gb.blocks'];const v=new House.T.Box3().setFromObject(t.obj).getCenter(new House.T.Vector3());return[v.x,-v.y,v.z]});
 await aim([pos[0],-55,pos[2]+80],pos);await p.waitForTimeout(1600);
 let boxPoint=await p.evaluate(()=>{const H=House,v=new H.T.Box3().setFromObject(H.THINGS['media.box.gb.blocks'].obj).getCenter(new H.T.Vector3());v.project(H.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}});
 // A scripted point click uses the free cursor; pointer lock always selects the centre ray instead.
 if(!phone){await p.evaluate(()=>document.exitPointerLock?.());await p.waitForTimeout(250);}
 // Same visible-pixel search as mobile.mjs: the shelf edge can hide a case's geometric centre.
 boxPoint=await p.evaluate(at=>{for(let r=0;r<=120;r+=4)for(let i=0;i<(r?24:1);i++){const x=at.x+Math.cos(i*Math.PI/12)*r,y=at.y+Math.sin(i*Math.PI/12)*r,h=House.pick(x,y);if(h?.spot==='media.box.gb.blocks')return{x,y,point:[h.p.x,h.p.y,h.p.z]};}return null;},boxPoint);
 assert(boxPoint,'The first case has no visible pick surface from the fixture pose');
 if(phone){
  await p.evaluate(([x,y,z])=>{const P=House.P;P.rx=Math.atan2(-(y-P.y),Math.hypot(x-P.x,z-P.z))*180/Math.PI;P.ry=Math.atan2(x-P.x,-(z-P.z))*180/Math.PI;House.dirty();},boxPoint.point);
  await p.waitForTimeout(600);await p.evaluate(()=>HouseTouch.render());await shot('04b-case-actions');
  assert(await p.locator('.ht-acts [data-k=e].ht-main').isVisible(),'The first objective must make Pick up the primary action');await press('e');
 }else {
  // Use the same public grab API as case-actions.mjs to stage the cartridge.
  // Pointer picking is covered separately; this flow verifies native game keys
  // and refresh after the complete first round, independent of a moving camera.
  assert(await p.evaluate(()=>House.grab('media.box.gb.blocks')),'Could not take the visible first case');
 }
 for(let n=0;n<30&&!await p.evaluate(()=>House.held()==='media.box.gb.blocks');n++)await p.waitForTimeout(250);
 assert.equal(await p.evaluate(()=>House.held()),'media.box.gb.blocks','Native case pickup failed');await shot('05-carry');
 results.carry=await p.evaluate(()=>({targets:StoryGuide.targets(),buttons:[...document.querySelectorAll('.ht-acts [data-k]')].map(b=>b.dataset.k),glows:House.scene.getObjectByName('accepting-slot-glows')?.count}));
 if(phone){await press('more');assert(await p.locator('.ht-acts [data-k=f]').isVisible());assert(await p.locator('.ht-acts [data-k=x]').isVisible());await shot('05c-more-actions');await press('more');assert.equal(await p.locator('.ht-acts [data-k=x]').count(),0);}
 // A genuine family line while the first case is held must clear the carry caption.
 await p.evaluate(()=>HouseFamily.say('mom','c1.mom.give',{call:true,again:true}));
 await until(()=>HouseFamily.debug.speech.cur?.lineId==='c1.mom.give'&&!!document.querySelector('.np-bub:not(.np-out)'));await p.evaluate(()=>{HouseFamily.debug.speech.freeze=true});await p.waitForTimeout(750);await shot('05b-carry-speech');
 const speechLayout=await p.evaluate(()=>{const a=document.querySelector('.np-bub:not(.np-out)').getBoundingClientRect(),b=document.querySelector('.hs-hold').getBoundingClientRect();return{overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,bottom:a.bottom,height:innerHeight};});
 assert(!speechLayout.overlap&&speechLayout.bottom<speechLayout.height,'Speech covers the carried item caption');await p.evaluate(()=>{HouseFamily.debug.speech.freeze=false});
 await until(()=>!document.querySelector('.np-bub:not(.np-out)'));
 await aim([80,-55,220],[200,-30,240]);await p.waitForTimeout(600);await shot('06-slot-behind');
 for(const [name,y]of [['above',5000],['below',-5000]]){
  await aim([80,-55,220],[-84,y,-12]);await p.waitForTimeout(350);await shot('06-slot-'+name);
  const label=await p.evaluate(()=>{const el=document.querySelector('.st-marker-label'),r=el.getBoundingClientRect();return{visible:!el.closest('[hidden]'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight};});
  if(label.visible)assert(label.x>=0&&label.y>=0&&label.right<=label.w&&label.bottom<=label.h,'Target direction label is clipped: '+JSON.stringify(label));
  else assert(await p.evaluate(()=>{const s=House.SNAPS['console.gb'],v=new House.T.Vector3(s.x,-s.y,s.z).project(House.camera);return Math.abs(v.x)<=1&&Math.abs(v.y)<=1&&v.z<1||!!document.querySelector('.np-bub:not(.np-out)');}),'Hidden direction label has neither a visible target nor speech');
 }
 await insertCase(f,'media.box.gb.blocks','console.gb',{press:async()=>{await p.waitForTimeout(300);await shot('06b-slot-ready');await press('e');}});
 await until(()=>window.RoomTV?._dbg()?.st==='game'&&!House.gliding&&!HouseCases.busy);
 if(!guidanceOnly){
 await shot('07-game-title');
 results.menu=[];
 for(let n=0;n<9;n++){
  const mode=await p.evaluate(()=>window.__blocksDbg?.().mode);results.menu.push(mode);
  if(mode==='play')break;
  assert(['title','demo','hiscores','menu','music','level'].includes(mode),'Unexpected first-round screen: '+mode);
  await gb(['title','demo','hiscores'].includes(mode)?'start':'a');
  for(let j=0;j<60&&await p.evaluate(()=>window.__blocksDbg?.().mode)===mode;j++)await p.waitForTimeout(100);
 }
 await until(()=>window.__blocksDbg?.().mode==='play'&&!!__blocksDbg().cur);console.log('Blockology menu flow',JSON.stringify(results.menu));
 assert.equal(await p.evaluate(()=>__blocksDbg().stat.games),1,'A real first round must start');
 // Prove desktop input reaches the falling piece, independently of battery checkpoints.
 if(!phone&&!idleRound){const x=await p.evaluate(()=>__blocksDbg().cur.x);await p.keyboard.press('ArrowLeft');let moved=false;for(let n=0;n<60;n++){moved=await p.evaluate(x=>__blocksDbg().cur?.x<x,x);if(moved)break;await p.waitForTimeout(100);}assert(moved,'ArrowLeft did not move the falling piece');results.input={key:'ArrowLeft',from:x,to:await p.evaluate(()=>__blocksDbg().cur.x)};}
 await shot('08-game-play');
 // Play a complete first round through the game's own input (hard drops, no story packets).
 if(idleRound){
  console.log('Leaving the first round idle: no directions, rotations or drops');const deadline=Date.now()+360000;
  while(Date.now()<deadline&&await p.evaluate(()=>__blocksDbg().mode==='play'))await p.waitForTimeout(250);
 }else for(let i=0;i<28;i++)await gb('up');
 await p.waitForTimeout(4500);await shot('09-game-finished');
 assert(await p.evaluate(()=>['over','result','entry','rocket','afterRocket'].includes(__blocksDbg().mode)),'First round did not finish');
 assert.equal(await p.evaluate(()=>__blocksDbg().lines),0,'The first-round test must cover a zero-line finish');
 await until(()=>!!st.getState()?.done.lad);assert.equal(await p.evaluate(()=>st.current()?.id),'meetmom','A zero-line round must lead to Mom');
 results.firstRound=await p.evaluate(()=>({mode:__blocksDbg().mode,score:__blocksDbg().score,lines:__blocksDbg().lines,games:__blocksDbg().stat.games,objective:st.current()?.id}));
 if(idleRound){
  assert.equal(results.firstRound.score,0,'An idle first round must earn no score');
  await until(()=>__blocksDbg().mode==='result');for(let n=0;n<4&&await p.evaluate(()=>__blocksDbg().mode==='result');n++){await p.waitForTimeout(1100);await gb('a');}await until(()=>__blocksDbg().mode==='play'&&__blocksDbg().stat.games===2);await shot('09b-play-again');
 }
 if(phone){await p.setViewportSize({width:size.height,height:size.width});await p.waitForTimeout(700);await shot('10-game-landscape');await p.setViewportSize(size);}
 if(phone)await p.locator('.rm-tools .rm-lean').tap();else await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);await p.waitForTimeout(600);await shot('11-back-in-room');
 if(!roundOnly){
 // insertCase positions the camera beside the tiny slot. Validate the entire
 // walking route against real physics bodies: cellOk alone ignores loose furniture.
 const route=await p.evaluate(()=>{for(const [x,z] of [[40,155],[0,155],[0,200],[-20,300]]){let fits=true;for(let dx=0;dx>=-60;dx-=5)if(!House._.floorAt(x+dx,z,'U',House.LV.U,House.STAND)){fits=false;break;}if(fits)return[x,House.LV.U-House.STAND,z];}return null;});
 assert(route,'No clear first-session walking route');await aim(route,[route[0],route[1],route[2]-100]);
 assert(await p.evaluate(()=>!!House._.floorAt(House.W.x,House.W.z,'U',House.LV.U,House.STAND)),'Refresh walking route is obstructed');
 await until(()=>!!window.HouseFamily?.chars.mom?.present);
 await p.evaluate(()=>HouseFamily.talk('mom'));await until(()=>!!HouseFamily.debug.speech.cur?.talk);await p.waitForTimeout(700);await shot('12-talking');
 // Use actual walking before refresh; setWalkFrom alone is not evidence of saving.
 if(phone){const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:85,y:size.height-160,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:45,y:size.height-160,id:1}]});await p.waitForTimeout(500);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await p.keyboard.down('a');await p.waitForTimeout(500);await p.keyboard.up('a');}await p.waitForTimeout(900);
 // The room keeps running while Playwright sends the reload command. Record
 // at pagehide, alongside production's save, rather than several frames earlier.
 await p.evaluate(()=>addEventListener('pagehide',()=>sessionStorage.setItem('__onboardRefresh',JSON.stringify({x:House.W.x,z:House.W.z,lvl:House.W.lvl,off:localStorage.getItem('jhp_off'),step:st.current()?.id,line:HouseFamily.debug.speech.cur?.lineId,saved:JSON.parse(localStorage.getItem('jhp_hs_pose')||'null')})),{once:true}));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>!!window.House?.live&&!!window.st?.getState()&&!document.querySelector('.hs-loading,#houseEntry')&&!House.gliding);
 await until(()=>!!window.HouseFamily?.debug.speech.cur?.talk);
 const pose=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('__onboardRefresh')));assert(pose,'No unload-boundary pose was recorded');
 results.talkRefresh={before:pose,after:await p.evaluate(()=>({mode:House.mode,x:House.W.x,z:House.W.z,lvl:House.W.lvl,off:localStorage.getItem('jhp_off'),step:st.current()?.id,line:HouseFamily.debug.speech.cur?.lineId}))};await shot('13-talk-refresh');
 const resumed=results.talkRefresh.after;assert.equal(resumed.mode,'walk');for(const k of ['x','z'])assert(Math.abs(resumed[k]-pose[k])<1,'Conversation refresh moved the player: '+k);for(const k of ['lvl','off','step','line'])assert.equal(resumed[k],pose[k],'Conversation refresh changed '+k);
 await p.evaluate(()=>House.sitOn('beanbag'));await until(()=>House.mode==='focus'&&House.seated==='beanbag'&&!House.gliding);await shot('14-seated');
 const seat=await p.evaluate(()=>({seat:House.seated,x:House.P.x,z:House.P.z,off:localStorage.getItem('jhp_off')}));
 await p.reload({waitUntil:'domcontentloaded'});await until(()=>!!window.House?.live&&!document.querySelector('.hs-loading,#houseEntry')&&!House.gliding);
 results.seatRefresh={before:seat,after:await p.evaluate(()=>({seat:House.seated,mode:House.mode,x:House.P.x,z:House.P.z,off:localStorage.getItem('jhp_off')}))};await shot('15-seat-refresh');
 assert.equal(results.seatRefresh.after.mode,'focus');for(const k of ['seat','x','z','off'])assert.equal(results.seatRefresh.after[k],seat[k],'Seated refresh changed '+k);
 await until(()=>!!st.getState().done.meetmom);
 }
 }
 if(phone&&tag!=='before'){assert.equal(results.arrival.deadUse,false);assert.equal(results.stick.opacity,'0');assert(!results.carry.buttons.includes('x'),'Drop should wait under More');}
 assert.deepEqual(errors,[]);console.log(JSON.stringify(results,null,2));
}catch(e){await shot('failure').catch(()=>{});console.log('State',await p.evaluate(()=>({mode:window.House?.mode,held:window.House?.held(),speech:!!window.HouseFamily?.debug,blocks:window.__blocksDbg?{mode:__blocksDbg().mode,paused:__blocksDbg().paused,score:__blocksDbg().score,lines:__blocksDbg().lines,pieces:__blocksDbg().pieces}:null,story:window.st?.getState()})).catch(()=>null));throw e;}
finally{await writeFile(new URL(`${tag}-${profile}-report.json`,dir),JSON.stringify({results,errors},null,2));await browser.close();}
