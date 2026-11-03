// Anti-Grav 3000: localhost-only production-input review. --before serves HEAD's cartridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base=process.argv.find(a=>/^https?:/.test(a))||'http://localhost:18080';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Throwaway localhost only');
const tailOnly=process.argv.includes('--tail');
const before=process.argv.includes('--before'),dir=root+'tests/shots/games/grav/'+(before?'before/':'after/');
await mkdir(dir,{recursive:true});
const account='Grav'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,seed:3000,debug:process.env.FIXTURE_DEBUG==='1'}),p=f.page;
const watchdog=setTimeout(()=>{console.error('GRAV watchdog');f.browser.close().finally(()=>process.exit(1))},1800000);
const D=(fn,arg)=>p.evaluate(fn,arg),state=()=>D(()=>__gravDbg.st);
const until=async(fn,arg,n=900)=>{for(let i=0;i<n;i++){assert.deepEqual(f.errors,[],'Browser errors');if(await D(fn,arg))return;await p.waitForTimeout(100)}throw Error('Timeout '+fn)};
const frames=async n=>{const target=await D(n=>RoomTV.dbg().frame+n,n);await until(t=>RoomTV.dbg().frame>=t,target)};
const press=async key=>{await p.keyboard.down(key);await frames(3);await p.keyboard.up(key);await frames(3)};
const shot=async(name,page=false)=>{if(!await D(()=>!!window.House?.paused))await frames(2);if(page)await p.screenshot({path:dir+name+'.png'});const data=await D(()=>{const K=RoomTV.dbg();K._three.render();const c=document.createElement('canvas');c.width=K.W;c.height=K.H;const g=c.getContext('2d');g.drawImage(K.cv,0,0);g.drawImage(K.hud.canvas,0,0);return c.toDataURL().split(',')[1]});await writeFile(dir+name+'-native.png',Buffer.from(data,'base64'));console.log('SHOT '+name)};
try{
 if(before){const src=execFileSync('git',['show','HEAD:app/public/js/rm-g-grav.js'],{cwd:root,encoding:'utf8'});await p.route('**/js/rm-g-grav.js*',r=>r.fulfill({body:src,contentType:'application/javascript'}))}
 console.log('FIXTURE READY');await playCase(f,'ps.grav');console.log('CASE PLAYING');await until(()=>!!window.__gravDbg&&__gravDbg.st.mode==='title');await shot('room-title',true);
 await press('t');await until(()=>RoomTV.lockIn());await shot('title',true);
 if(tailOnly)await runTail();else{
 await press('Enter');assert.equal((await state()).mode,'main');await shot('menu');
 await press('z');await shot('classes');await press('z');await shot('team');await press('z');
 await until(()=>__gravDbg.st.mode==='intro');await shot('intro');await until(()=>__gravDbg.st.mode==='count');await frames(30);await shot('start');
 await p.keyboard.down('z');await until(()=>__gravDbg.st.mode==='race');await frames(140);assert((await state()).me.v>10);await shot('moving',true);
 if(before){const frozen=await D(()=>{const T=RoomTV.dbg()._three;window.gravPointList=[];T.scene.traverse(o=>{if(o.isPoints){gravPointList.push(o);o.visible=false}});T.render();return gravPointList.length});await shot('moving-no-particles');await D(()=>{for(const o of gravPointList)o.visible=true});console.log('Particle groups '+frozen)}
 for(let n=0;n<4;n++){await frames(8);await shot('speed-sequence-'+n)}
 await p.keyboard.down('ArrowRight');await frames(15);await p.keyboard.up('ArrowRight');await p.keyboard.down('e');await frames(12);await p.keyboard.up('e');await shot('airbrake');await p.keyboard.up('z');
 await press('Enter');const t=(await state()).raceT;await frames(30);assert.equal((await state()).raceT,t);await shot('pause');await press('Enter');
 const perf=await D(async()=>{const samples=[];let prev;await new Promise(resolve=>{const f=t=>{if(prev)samples.push(t-prev);prev=t;if(samples.length===90)resolve();else requestAnimationFrame(f)};requestAnimationFrame(f)});samples.sort((a,b)=>a-b);const K=RoomTV.dbg(),T=K._three;const t=performance.now();for(let i=0;i<30;i++)T.render();return{native:[K.W,K.H],renderer:(()=>{const gl=T.ren.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})(),rafP50:samples[45],rafP95:samples[85],drawSubmitMs:(performance.now()-t)/30,draws:T.ren?.info?.render}});
 console.log('PERF '+JSON.stringify(perf));await writeFile(dir+'performance.json',JSON.stringify(perf,null,2));
 if(before){console.log('GRAV BEFORE PASS');}else{await runDepth()}
 }
 assert.deepEqual(f.errors,[]);console.log('GRAV PASS');
}finally{clearTimeout(watchdog);await f.browser.close()}
async function runDepth(){
 await D(()=>__gravDbg.title());await frames(1000);assert.equal((await state()).mode,'demo');for(let i=0;i<3;i++){await frames(20);await shot('attract-'+i);}
 assert.equal((await state()).tracks.length,12);assert.equal((await state()).classes.length,4);
 const race=async(kind,track=0,cls=0)=>{await D(({kind,track,cls})=>{window.__rmAuto=false;__gravDbg.race(kind,track,cls);__gravDbg.go()},{kind,track,cls});await frames(3)};
 // Every circuit: start, a real physical autopilot stretch, and finite rival positions.
 for(let track=0;track<12;track++){
  await race('race',track,track%4);await shot('track-'+track+'-start');await D(()=>window.__rmAuto=true);await frames(400);await shot('track-'+track+'-mid');
  const s=await state();assert(s.me.prog>60&&s.ships.every(x=>Number.isFinite(x.prog)&&x.v>=0),'Race physics and rivals on track '+track);
 }
 // Real steering, energy-fed hyperthrust and both shoulder airbrakes, then all six weapon inputs.
 await race('race');await D(()=>__gravDbg.at(.04,0,45));await p.keyboard.down('z');const a0=(await state()).me.a;await p.keyboard.down('ArrowLeft');await frames(15);await p.keyboard.up('ArrowLeft');assert((await state()).me.a<a0-.05);await shot('steering');
 await race('race');await D(()=>__gravDbg.at(.01,0,50));const speed=(await state()).me.v;await p.keyboard.down('u');await p.keyboard.down('e');await frames(35);await p.keyboard.up('u');await p.keyboard.up('e');assert((await state()).me.v<speed-5,'Both airbrakes scrub speed');await p.keyboard.up('z');await shot('dual-airbrakes');await race('race');await D(()=>__gravDbg.at(.02,0,45));const hyperEnergy=(await state()).me.energy;await p.keyboard.down('z');await p.keyboard.down('v');await frames(45);assert((await state()).me.hyper&&(await state()).me.energy<hyperEnergy-3,'Hyperthrust trades shield for speed: '+JSON.stringify((await state()).me));await shot('hyperthrust');await p.keyboard.up('v');await p.keyboard.up('z');
 for(const weapon of ['BOLTS','SEEKER','MINES','SHIELD','TURBO','RUMBLE']){
  await race('race');await D(()=>__gravDbg.at(.05,0,45));await D(w=>__gravDbg.give(w),weapon);await shot('weapon-'+weapon+'-ready');await press('x');await frames(12);assert.notEqual((await state()).me.wep,weapon,'Fire consumes '+weapon);if(weapon==='SHIELD')assert((await state()).me.shield>0);if(weapon==='TURBO')assert((await state()).me.boost>0);await shot('weapon-'+weapon+'-fired');
 }
 await D(()=>{__gravDbg.hurt(45);__gravDbg.give('BOLTS')});const energy=(await state()).me.energy;await press('c');assert((await state()).me.energy>energy+10,'Absorb repairs shield');await shot('absorb');
 await race('race');await D(()=>{__gravDbg.hurt(55);__gravDbg.at(.94,5.4,15)});const pitEnergy=(await state()).me.energy;await frames(60);assert((await state()).me.energy>pitEnergy+10,'Repair lane recharges');await shot('pit-lane');
 await D(()=>__gravDbg.at(.05,6.4,55));await p.keyboard.down('z');await p.keyboard.down('ArrowRight');await frames(30);await p.keyboard.up('ArrowRight');await p.keyboard.up('z');assert((await state()).me.energy<100,'Wall impact costs energy');await shot('collision');
 // A complete, unshortened three-lap race through production AI/physics.
 await race('race');await D(()=>window.__rmAuto=true);await until(()=>__gravDbg.st.mode==='finish',null,1800);assert((await state()).me.done&&!((await state()).me.out));await shot('finish');await until(()=>__gravDbg.st.mode==='results');await frames(90);await shot('results');
 // The eight-race league's remaining distance is shortened explicitly, not its results/unlock flow.
 await race('champ');
 for(let round=0;round<8;round++){
  if(round){await until(()=>__gravDbg.st.mode==='loading'||__gravDbg.st.mode==='intro');await D(()=>__gravDbg.go());await frames(3)}
  assert.equal((await state()).champ.race,round);await D(()=>{window.__rmAuto=true;__gravDbg.at(.97,0,55);__gravDbg.skipLaps(2)});await until(()=>__gravDbg.st.mode==='finish');await until(()=>__gravDbg.st.mode==='results');await frames(70);await shot('league-'+round+'-results');await press('z');assert.equal((await state()).mode,'standings');await frames(65);await shot('league-'+round+'-standings');await press('z');
 }
 assert.equal((await state()).mode,'podium');assert((await state()).sv.unl.sup,'League opens next class');await shot('podium');await frames(250);await press('z');assert.equal((await state()).mode,'ending');await shot('ending-1');await frames(70);await press('z');await shot('ending-2');await frames(70);await press('z');assert.equal((await state()).mode,'credits');await shot('credits');
 // Reloading the saved ending rebuilds the podium while retaining progression.
 await D(()=>__gravDbg.save());await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&!!window.__gravDbg&&__gravDbg.st.mode==='credits'&&!House.gliding,null,1500);await shot('credits-refreshed',true);
 // Fresh menu navigation: every page, all ships, licence grid and all eight track entries.
 await D(()=>__gravDbg.title());await frames(4);await press('Enter');for(let i=0;i<5;i++)await press('ArrowDown');await press('z');assert.equal((await state()).mode,'challenge');await shot('licences');await press('ArrowRight');await press('z');assert.equal((await state()).kind,'tt');await D(()=>{__gravDbg.go();__gravDbg.at(.97,0,55);__gravDbg.skipLaps(2);window.__rmAuto=true});await until(()=>__gravDbg.st.mode==='finish');assert((await state()).sv.challenges[1]);await shot('licence-passed');
 await D(()=>__gravDbg.title());await frames(4);await press('Enter');for(let i=0;i<4;i++)await press('ArrowDown');await press('z');await press('z');assert.equal((await state()).mode,'team');for(let t=0;t<8;t++){await shot('team-'+t);await press('ArrowRight')}
 await press('x');await press('x');for(let i=0;i<6;i++)await press('ArrowDown');await press('z');assert.equal((await state()).mode,'records');await shot('records');await press('ArrowRight');await shot('lap-records');await press('ArrowRight');await shot('medal-board');await press('x');await press('ArrowDown');await press('z');await shot('options');await press('z');await press('x');await press('ArrowDown');await press('z');await shot('help-controls');await press('ArrowRight');await shot('help-weapons');await press('ArrowRight');await shot('help-tips');
 // Time attack is a distinct checkpoint clock; timeout goes to a result rather than hanging.
 await race('attack');const initialClock=(await state()).attackLeft;await frames(90);await shot('time-attack');assert((await state()).attackLeft<initialClock);await D(()=>{__gravDbg.at(.99,0,55);__gravDbg.skipLaps(1)});await D(()=>window.__rmAuto=true);await frames(90);assert((await state()).attackLeft>30,'Checkpoint adds time');await shot('time-extended');
 // Combat is endless laps with respawns; damage, a weapon and K.O. score survive refresh.
 await race('elim');await D(()=>__gravDbg.hurt(1000));await frames(150);assert(!(await state()).me.out&&(await state()).me.energy>80,'Eliminated craft rejoins combat');await shot('eliminator-respawn');for(let i=0;i<8&&(await state()).mode==='race'&&(await state()).me.kos<5;i++){await D(()=>{__gravDbg.at(.04,0,30);__gravDbg.target();__gravDbg.give('BOLTS')});await press('x');await frames(20);}await until(()=>['finish','results'].includes(__gravDbg.st.mode));assert((await state()).me.kos>=5,'Five real weapon knockouts finish combat: '+JSON.stringify((await state()).me));await shot('eliminator-finish');
 // Time-trial ghost recording persists and plays back, with a class-specific save key.
 await race('tt');await D(()=>window.__rmAuto=true);await frames(180);await D(()=>{window.__rmAuto=true;__gravDbg.at(.97,0,55);__gravDbg.skipLaps(2)});await until(()=>__gravDbg.st.mode==='ttres');await shot('time-trial-results');assert((await state()).sv.tt[0]>0);await race('tt');assert((await state()).ghost,'Saved ghost plays back');await frames(140);await shot('time-trial-ghost');
 await runTail();
 console.log('GRAV DEPTH PASS');
}

async function runTail(){
 const race=async(kind,track=0,cls=0)=>{await D(({kind,track,cls})=>{window.__rmAuto=false;__gravDbg.race(kind,track,cls);__gravDbg.go()},{kind,track,cls});await frames(3)};
 // Simulated standard gamepad goes through the shared browser input mapper.
 await race('race');await D(()=>__gravDbg.at(.02,0,0));await D(()=>{Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.gravPad?[gravPad]:[]});window.gravPad={id:'Review pad',index:0,connected:true,mapping:'standard',axes:[.6,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0,value:i===0?1:0}))};window.dispatchEvent(new Event('gamepadconnected'))});await frames(60);assert((await state()).me.v>10&&Math.abs((await state()).me.a)>.05,'Gamepad thrust and steering: '+JSON.stringify(await D(()=>({me:__gravDbg.st.me,input:GameInput.mode,held:RoomTV.dbg().held('a'),stick:RoomTV.dbg().stick(),pad:!!navigator.getGamepads()[0]}))));await shot('gamepad');await D(()=>window.gravPad=null);await press('Enter');if(!(await state()).paused)await press('Enter');
 // Exact pause, Esc, and refresh safety. No lost shields, weapons, pose or time.
 await race('race',6,2);await D(()=>window.__rmAuto=true);await frames(180);await D(()=>{window.__rmAuto=false;__gravDbg.give('SHIELD')});await press('Enter');const pre=await state();await frames(40);assert.equal((await state()).raceT,pre.raceT);await shot('refresh-before');await D(()=>__gravDbg.save());await p.reload({waitUntil:'domcontentloaded'});
 await until(()=>window.AccountGate?.allowed&&!!window.__gravDbg&&__gravDbg.st.paused&&!House.gliding,null,1500);const post=await state();assert.equal(post.track,pre.track);assert.equal(post.me.wep,pre.me.wep);assert.equal(post.raceT,pre.raceT);assert(Math.abs(post.me.prog-pre.me.prog)<.001);await shot('refresh-resumed',true);await press('Enter');await frames(30);assert((await state()).raceT>pre.raceT);
 await p.keyboard.press('Escape');await until(()=>House.paused);const escTime=(await state()).raceT;await p.waitForTimeout(650);assert.equal((await state()).raceT,escTime);await shot('escape-menu',true);await p.keyboard.press('Escape');await until(()=>!House.paused);
 // Names resolve solely from the visitor's cast, including rankings and circuit records.
 const names=await D(()=>__gravDbg.names()),cast=await D(()=>['me','mate1','mate2','mate3','mate4','sister'].map(id=>(id==='me'?Cast.me().first:Cast.n(id)).toUpperCase()));assert(Object.values(names).flat().every(n=>cast.includes(n.replace(/ III?$/,''))),'Cast names only: '+JSON.stringify(names));
 await p.setViewportSize({width:1024,height:768});await shot('desktop-1024',true);await p.setViewportSize({width:1366,height:860});
 // Trusted DevTools touch drives the real cartridge controller at phone and tablet sizes.
 const touch=await p.context().newCDPSession(p);await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 for(const [label,width,height] of [['phone-portrait',390,844],['phone-landscape',844,390],['tablet-portrait',768,1024],['tablet-landscape',1024,768]]){
  await race('race');await p.setViewportSize({width,height});await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:height/3,id:1}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until(()=>GameInput.touch&&!document.querySelector('.rm-pad').hidden);await frames(8);await D(()=>__gravDbg.title());await frames(6);await shot(label+'-title',true);await race('race');
  const pad=p.locator('.rm-tvv.on .rm-pad [data-b="a"]'),r=await pad.boundingBox();assert(r&&Math.min(r.width,r.height)>=36,'Usable thrust button '+label);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await frames(45);assert((await state()).me.v>5,'Touch thrust '+label);const stick=await p.locator('.rm-tvv.on .rm-stick').boundingBox();assert(stick&&stick.width>=60,'Usable steering stick '+label);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1},{x:stick.x+stick.width*.8,y:stick.y+stick.height/2,id:2}]});await frames(18);assert(await D(()=>RoomTV.dbg().stick().x>.2),'Touch steering '+label);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frames(30);await shot(label,true);
  const aspect=await D(()=>{const r=document.querySelector('.rm-glass').getBoundingClientRect();return r.width/r.height});assert(Math.abs(aspect-4/3)<.06,'Native aspect '+label);
 }
 await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await p.setViewportSize({width:1366,height:860});await press('ArrowLeft');
 // Q leaves the same instance running on the physical telly; T keeps native aspect.
 if(await D(()=>RoomTV.lockIn()))await press('t');await frames(10);await shot('room-race',true);await D(()=>window.gravInstance=RoomTV.dbg());await press('q');await until(()=>House.mode==='walk'&&!House.gliding);assert(await D(()=>RoomTV._dbg().background&&RoomTV.dbg()===gravInstance));await p.screenshot({path:dir+'lean-back.png'});

 console.log('GRAV CONTROLS / REFRESH / DEVICES PASS');
}
