// Disposable-server play-through and native-resolution art/performance review.
// node tests/games/kart.mjs [--flows | --benchmark | --art | --pilot | --physics] [--baseline]
// KART_REFERENCE_DIR may point to snapshots of the two scripts for a before build.
// Native render timings include a one-pixel GPU readback; rAF measures the whole displayed view.
// Both timings are diagnostics on the recorded renderer/host load, not hardware FPS claims.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {loadavg,availableParallelism} from 'node:os';
import {fileURLToPath} from 'node:url';
import {roomFixture} from '../room-fixture.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const port=+(process.env.KART_PORT||18089);assert(port>=18080&&port<=18099);
const physicsOnly=process.argv.includes('--physics');
const artOnly=process.argv.includes('--art'),pilotOnly=process.argv.includes('--pilot');
const benchmark=process.argv.includes('--benchmark'),focused=process.argv.includes('--flows')||benchmark||pilotOnly;
const baseline=process.argv.includes('--baseline'), label=baseline?'before':'after';
const shots=root+'tests/shots/games/kart/'+label+'/';
// Race-length AI coverage executes the production logic and solid THREE geometries.
// Only raster, text and audio surfaces are replaced; the browser pass below tests those for real.
async function verifyPhysics(){
 const T=createRequire(import.meta.url)(root+'app/public/vendor/three.min.js'),noop=()=>{},gradient={addColorStop:noop};
 const g=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*5})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
 const canvas=()=>({width:0,height:0,getContext:()=>g}),scene=new T.Scene(),cam=new T.PerspectiveCamera(64,4/3,.3,900);
 scene.fog=new T.Fog(0,70,300);
 const t3={T,scene,cam,keep:x=>x,add:o=>(scene.add(o),o),tex:(w,h,paint)=>{const c=canvas();c.width=w;c.height=h;paint(g,w,h);return new T.CanvasTexture(c)},tile:(t,x,y)=>(t.repeat.set(x,y??x),t),mat:p=>new T.MeshBasicMaterial({color:p.color??0xffffff,vertexColors:!!p.vcol,transparent:!!p.transparent,opacity:p.opacity??1,...(p.map?{map:p.map}:{})}),lights:()=>({hemi:new T.HemisphereLight(),sun:new T.DirectionalLight()}),ren:{info:{render:{},memory:{}}},render:noop};
 let seed=12345,definition;const random=Math.random,math=Object.create(Math),storage=new Map();
 math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const sandbox={console,Math:math,document:{createElement:canvas},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},__rmAuto:true,RoomTV:{game:(id,def)=>definition=def}};
 sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['rm-g-racekit.js','rm-g-kart.js'])vm.runInContext(await readFile(root+'app/public/js/'+file,'utf8'),sandbox,{filename:file});
 const K={W:320,H:240,frame:0,t:0,hud:g,font:{draw:noop,center:noop,width:s=>s.length*4},three:()=>t3,load:()=>null,save:noop,keyLabel:b=>b,label:b=>b,sfx:new Proxy({},{get:()=>noop}),music:noop,secret:noop,over:noop,held:()=>false,pressed:()=>false,stick:()=>({x:0,y:0}),any:()=>false};
 const game=definition.make(K),results=[];
 for(let track=0;track<8;track++){
  sandbox.__kartDbg.race('vs',track,1);sandbox.__kartDbg.go();
  for(let frame=0;frame<60*180;frame++){game.update(1/60);K.frame++;K.t+=1/60;if(['finish','results'].includes(sandbox.__kartDbg.st.mode))break;}
  const st=sandbox.__kartDbg.st,finished=st.karts.filter(k=>k.lap>=3).length;
  assert.equal(st.mode,'finish','AI could not finish course '+track);assert(finished>=6,'AI field fell more than a lap behind on course '+track);
  const summary={track,time:+st.raceT.toFixed(2),onFinalLap:finished,karts:st.karts};results.push(summary);console.log('PHYSICS course '+track+': '+summary.time+'s; '+finished+'/8 on final lap');
 }
 assert.equal(Math.random,random,'Physics context leaked its seeded random source');
 await mkdir(root+'tests/shots/games/kart/',{recursive:true});await writeFile(root+'tests/shots/games/kart/physics.json',JSON.stringify(results,null,2));
}
if(physicsOnly){await verifyPhysics();console.log('KART PHYSICS PASS');process.exit(0)}

let server,browser,data,activePage,log='';
async function cleanup(){if(browser){await browser.close().catch(()=>{});browser=null}if(server?.exitCode===null){const exited=new Promise(resolve=>server.once('exit',resolve));server.kill('SIGTERM');const timer=setTimeout(()=>server.kill('SIGKILL'),1500);await exited;clearTimeout(timer)}if(data)await rm(data,{recursive:true,force:true})}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{console.error('KART interrupted: '+signal);void cleanup().finally(()=>process.exit(1))});
const watchdog=setTimeout(()=>{console.error('KART total timeout');void cleanup().finally(()=>process.exit(1))},720000);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 if(!baseline&&!focused)await verifyPhysics();
 data=await mkdtemp('/tmp/jhp-kart-');
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',b=>log+=b);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<100&&server.exitCode===null,'Server failed: '+log);await delay(100)}
 const base='http://127.0.0.1:'+port,account='Kart'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 await mkdir(shots,{recursive:true});
 console.log('Server and registration ready');
 const f=await roomFixture(base,{account,password,signup:false}),p=f.page;browser=f.browser;activePage=p;
 if(process.env.KART_REFERENCE_DIR)for(const name of ['rm-g-kart.js','rm-g-racekit.js']) {
   const body=await readFile(process.env.KART_REFERENCE_DIR+'/'+name,'utf8');
   await p.route('**/js/'+name+'*',r=>r.fulfill({status:200,contentType:'application/javascript',body}));
 }
 const aim=async(eye,target)=>{await f.view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})};
 p.on('console',m=>{if(m.type()==='error')console.error('Browser:',m.text())});
 const until=async fn=>{for(let i=0;i<300;i++){assert.deepEqual(f.errors,[],'Browser errors');if(await p.evaluate(fn))return;await p.waitForTimeout(100)}throw Error('Timeout '+fn)},state=()=>p.evaluate(()=>__kartDbg.st);
 // Frame-based waits keep the same simulation duration under software WebGL.
 async function frames(n){await p.evaluate(n=>window.kartFrame=RoomTV.dbg().frame+n,n);await until(()=>RoomTV.dbg().frame>=window.kartFrame)}
 async function press(k){await p.keyboard.press(k);await frames(3)}
 async function shot(name){
  console.log('Capture '+name);
  await p.screenshot({path:shots+name+'.png'});
  const uri=await p.evaluate(()=>{const K=RoomTV.dbg();K._three.render();const c=document.createElement('canvas');c.width=K.W;c.height=K.H;const g=c.getContext('2d');g.drawImage(K.cv,0,0);g.drawImage(K.hud.canvas,0,0);return c.toDataURL('image/png').split(',')[1]});
  await writeFile(shots+name+'-native.png',Buffer.from(uri,'base64'));
 }
 async function measurePerf(){
  const perf=await p.evaluate(async()=>{const K=RoomTV.dbg(),T=K._three,gl=T.ren.getContext(),pixel=new Uint8Array(4),draw=[];for(let i=0;i<40;i++){const t=performance.now();T.render();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>=10)draw.push(performance.now()-t)}const times=[];let prev;await new Promise(resolve=>{function tick(t){if(prev)times.push(t-prev);prev=t;if(times.length>=90)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});const stats=a=>{a.sort((a,b)=>a-b);return{mean:a.reduce((s,v)=>s+v,0)/a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]}};const ext=gl.getExtension('WEBGL_debug_renderer_info');return{native:[K.W,K.H],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'',renderMs:stats(draw),rafMs:stats(times),...__kartDbg.perf}});
 perf.host={loadavg:loadavg(),availableCPUs:availableParallelism()};await writeFile(shots+'performance.json',JSON.stringify(perf,null,2));console.log(label+' PERFORMANCE '+JSON.stringify(perf));
 }
 // Real shelf -> open case -> cartridge -> console, as in the smoke fixture.
 console.log('Physical cartridge setup');
 const home=await p.evaluate(()=>House.THINGS['media.box.n64.kart'].at);
 await aim([-220,-55,35],[home.x,home.y-6,-36]);await p.keyboard.press('e');await until(()=>House.held()==='media.box.n64.kart');
 await aim([-80,-55,220],[-130,73,145]);await p.keyboard.press('e');await until(()=>House.THINGS['media.box.n64.kart'].st==='rest');
 await aim([-80,-55,220],[-130,67,146.6]);await p.keyboard.press('f');await until(()=>House.THINGS['media.box.n64.kart'].caseOpen);
 await aim([-80,-55,220],[-130,69,146.3]);await p.keyboard.press('e');await until(()=>House.held()==='media.n64.kart');
 const slot=await p.evaluate(()=>House.SNAPS['console.n64']);await aim([-185,-55,120],[slot.x,slot.y,slot.z]);await p.keyboard.press('e');
 await until(()=>window.__kartDbg?.st.mode==='title');await p.evaluate(()=>House.act('n64'));await until(()=>House.focused&&RoomTV.open_);await frames(5);await shot('title-room');
 await p.keyboard.press('t');await frames(3);await shot('title');if(!focused)for(let n=0;n<3;n++){await frames(18);await shot('sequence-title-'+n)}
 if(benchmark){await p.evaluate(()=>{__kartDbg.race('vs',0,1);__kartDbg.go();window.__rmAuto=true});await frames(240);await measurePerf();await shot('benchmark-race');}else{
 await press('Enter');assert.equal((await state()).mode,'main');await shot('main');
 await press('z');await press('ArrowDown');await press('z');assert.equal((await state()).mode,'cc');await shot('locked-150cc');await press('ArrowUp');await press('z');assert.equal((await state()).mode,'driver');await shot('driver');
 if(!focused)for(let n=0;n<8;n++){await p.evaluate(n=>__kartDbg.view('kart',n,.55,.24,6.3),n);await frames(3);await shot('model-'+n)}
 if(!focused)for(const n of [0,5,6,7])for(const [angle,elevation,tag] of [[2.6,.22,'rear'],[.55,.05,'low']]){await p.evaluate(({n,angle,elevation})=>__kartDbg.view('kart',n,angle,elevation,6.8),{n,angle,elevation});await frames(3);await shot('model-'+n+'-'+tag)}
 await p.evaluate(()=>__kartDbg.title());await press('Enter');await press('z');await press('z');await press('z');assert.equal((await state()).mode,'cup');await shot('cup');await press('ArrowRight');await press('z');assert.equal((await state()).mode,'cup');await shot('locked-star-cup');await press('ArrowLeft');
 await press('z');assert.equal((await state()).mode,'intro');await shot('intro');await p.evaluate(()=>__kartDbg.go());console.log('Countdown skipped');await until(()=>__kartDbg.st.mode==='race');console.log('Race started');
 await p.keyboard.down('z');await frames(180);await p.keyboard.up('z');assert((await state()).me.v>3);await shot('race');
 await press('Enter');assert((await state()).paused);await shot('pause');const frozen=(await state()).raceT;await frames(30);assert.equal((await state()).raceT,frozen);await press('Enter');
 if(!focused){
 await p.evaluate(()=>__kartDbg.demo());await frames(240);await shot('attract');for(let n=0;n<3;n++){await frames(12);await shot('sequence-attract-'+n)}
 // Match course, class and native resolution across before/after measurements.
 await p.evaluate(()=>{__kartDbg.race('vs',0,1);__kartDbg.go();window.__rmAuto=true});await frames(240);
 await measurePerf();
 for(let n=0;n<8;n++){
  console.log('Course '+n);await p.evaluate(n=>__kartDbg.race('vs',n,1),n);await frames(20);await shot('track-'+n+'-intro');
  await p.evaluate(()=>{__kartDbg.go();window.__rmAuto=true});await until(()=>__kartDbg.st.mode==='race');await frames(400);await shot('track-'+n+'-mid');
  if(!baseline){const st=await state();assert(st.karts.every(k=>Number.isFinite(k.v)&&k.prog>4),'AI must leave the grid on course '+n);assert(st.karts.filter(k=>k.rescue>0).length<4,'Mass AI rescue on course '+n);}
  if(n===0)for(let j=0;j<4;j++){await frames(8);await shot('sequence-race-'+j)}
  if(!baseline){
    const feature=[.58,.48,.49,.64,.60,.51,.35,.46][n];
    await p.evaluate(f=>__kartDbg.place(f,0,24),feature);await frames(140);await shot('track-'+n+'-landmark');
    assert(Number.isFinite((await state()).me.y));
  }
 }
 }
 await p.evaluate(()=>{window.__rmAuto=false;__kartDbg.race('battle',0,1);__kartDbg.go()});await until(()=>__kartDbg.st.mode==='race');await p.keyboard.down('z');await frames(90);await p.keyboard.up('z');await shot('battle');
 if(!baseline&&!artOnly){
  const start=async(kind='tt',n=0,cc=1)=>{await p.evaluate(({kind,n,cc})=>{window.__rmAuto=false;__kartDbg.race(kind,n,cc);__kartDbg.go()},{kind,n,cc});await until(()=>__kartDbg.st.mode==='race');if(kind==='tt')assert.equal(await p.evaluate(()=>__kartDbg.circuit.boxes.length),0)};
  // A real held corner in a clear arena section charges the drift, then releases a turbo.
  await start('battle');await p.evaluate(()=>{__kartDbg.place(32,-15,21);__kartDbg.face(0)});
  await p.keyboard.down('z');await p.keyboard.down('ArrowRight');await p.keyboard.down('e');await frames(7);
  assert.equal((await state()).me.drift,1);
  await frames(30);await shot('drift-blue');
  await frames(35);assert.equal((await state()).me.turboLevel,2);await shot('drift-orange');
  await p.keyboard.up('e');await p.keyboard.up('ArrowRight');await frames(3);assert((await state()).me.boost>0);await shot('mini-turbo');await p.keyboard.up('z');
  // A pickup is earned by crossing a real box; roulette must stop before the item is usable.
  await start('vs');await p.evaluate(()=>{const c=__kartDbg.circuit,b=c.boxes[0];__kartDbg.give('');__kartDbg.place((b.i-2)/c.n,b.lat,18)});
  await p.keyboard.down('z');await until(()=>__kartDbg.st.me.roll>0);await shot('item-roulette');
  await until(()=>__kartDbg.st.me.item!==''&&__kartDbg.st.me.roll<=0);await shot('item-ready');await p.keyboard.up('z');
  await press('c');assert.equal((await state()).me.item,'');
  await start();
  for(let n=2;n>=0;n--){await press('c');assert.equal((await state()).me.icount,n);}
  assert.equal((await state()).me.item,'');assert((await state()).me.boost>0);await shot('triple-turbo');
  // Collision with the player's own peel after its grace period: balloon loss, then visible recovery.
  await start('battle');await p.evaluate(()=>{__kartDbg.place(32,0,0);__kartDbg.give('PEEL')});await press('c');
  await p.keyboard.down('x');await until(()=>__kartDbg.st.me.spin>0);await p.keyboard.up('x');await shot('collision');
  assert.equal((await state()).karts[0].b,2);await frames(165);assert((await state()).me.visible,'Blink must restore the player mesh');await shot('collision-recovered');
  for(let n=0;n<2;n++){
    await p.evaluate(()=>{__kartDbg.place(32,0,0);__kartDbg.give('PEEL')});await press('c');await p.keyboard.down('x');
    await until(()=>__kartDbg.st.me.spin>0);await p.keyboard.up('x');await frames(165);
  }
  await until(()=>__kartDbg.st.mode==='bres');assert.equal((await state()).results.rows,4);await shot('battle-results');
  for(const item of ['BOOMER','HOMER','FAKE','STAR','THUNDER','SPLAT','BOMB']){
    await start('vs');await p.evaluate(item=>__kartDbg.give(item),item);await press('c');await frames(8);await shot('item-'+item.toLowerCase());
    assert.equal((await state()).me.item,'');
  }
  // Crossing the hedge gap uses the actual kart and awards the shortcut, including on a slope.
  await start('tt');await p.evaluate(()=>{const c=__kartDbg.circuit,s=c.shortcut;__kartDbg.place(s.a/c.n,0,18)});
  const shortcut=await p.evaluate(()=>__kartDbg.circuit.shortcut);
  // The fixture supplies the entry heading; controls drive the whole corridor.
  await p.evaluate(s=>__kartDbg.face(Math.atan2(s.B[0]-s.A[0],s.B[2]-s.A[2])),shortcut);
  await p.keyboard.down('z');await frames(90);await p.keyboard.up('z');await shot('shortcut');
  assert((await state()).shortcut,'Shortcut corridor must be reachable through the hedge');
  // Standard gamepad polling: A, analogue steering, right shoulder, Start and disconnect.
  await start('battle');await p.evaluate(()=>{__kartDbg.place(32,-15,0);__kartDbg.face(0);
    window.kartPad={id:'Test standard pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[kartPad]});kartPad.buttons[0]={pressed:true,value:1};window.dispatchEvent(new Event('gamepadconnected'));
  });await until(()=>GameInput.mode==='gamepad');await frames(100);assert((await state()).me.v>8);
  await p.evaluate(()=>{__kartDbg.place(32,-15,21);__kartDbg.face(0);kartPad.axes[0]=.7;kartPad.buttons[5]={pressed:true,value:1}});await frames(8);assert.equal((await state()).me.drift,1);
  await frames(60);await p.evaluate(()=>{kartPad.buttons[5]={pressed:false,value:0}});await frames(3);assert((await state()).me.boost>0);
  await p.evaluate(()=>{kartPad.buttons[9]={pressed:true,value:1}});await until(()=>__kartDbg.st.paused);await shot('gamepad-pause');
  await p.evaluate(()=>{kartPad.buttons[9]={pressed:false,value:0}});await frames(4);await p.evaluate(()=>{kartPad.buttons[9]={pressed:true,value:1}});await until(()=>!__kartDbg.st.paused);
  await p.evaluate(()=>{delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});await press('Enter');assert((await state()).paused);await press('Enter');
  // Time-trial recording, three distinct lap crossings, result save and replayed ghost.
  async function crossFinish(){for(const n of [.2,1,1,1]){await p.evaluate(n=>__kartDbg.skipLaps(n),n);await frames(5)}}
  await start();await p.keyboard.down('z');await frames(190);await p.keyboard.up('z');await crossFinish();
  await until(()=>__kartDbg.st.mode==='ttres');assert.equal((await state()).results.laps.length,3);await shot('time-trial-results');
  assert(await p.evaluate(()=>localStorage.getItem('jhp_rmkart_gh0')?.length>100));
  await start();await frames(120);assert((await state()).ghost.samples>20);assert((await state()).ghost.visible);await shot('ghost');
  // Run all four cup result/points flows with genuine menu input; advance laps solely to bound test duration.
  await start('gp');
  for(let n=0;n<4;n++){
    if(n){await p.evaluate(()=>__kartDbg.go());await until(()=>__kartDbg.st.mode==='race')}
    await crossFinish();await until(()=>__kartDbg.st.mode==='results');await frames(70);await shot('cup-race-'+n+'-results');
    assert.equal((await state()).results.rows,8);await press('z');assert.equal((await state()).mode,'standings');await frames(70);await shot('cup-race-'+n+'-points');await press('z');
  }
  assert.equal((await state()).mode,'podium');await frames(180);await shot('podium');assert.equal((await state()).gp.place,0);
  assert.equal((await state()).sv.cups['1:0'],1);assert((await state()).sv.unl.c150);assert((await state()).sv.unl.star);
  if(!focused||pilotOnly){
    // Complete a whole race using the real keyboard. A sampled pursuit driver presses
    // the same left/right/go/item keys a player uses; it does not call the in-game AI.
    await start('vs',0,1);const circuit=await p.evaluate(()=>__kartDbg.circuit);let steering='',lastLap=-1,steps=0,recoveryUntil=0;
    await p.keyboard.down('z');
    while((await state()).mode==='race'){
      const st=await state(),m=st.me;assert(++steps<1200,'Keyboard driver failed to finish');
      assert([m.x,m.z,m.v,m.yaw,m.prog].every(Number.isFinite),'Non-finite player state');
      if(steps%40===0){console.log('Keyboard status '+JSON.stringify({time:st.raceT,lap:m.lap,progress:m.prog,speed:m.v,rescues:m.rescues}));await writeFile(shots+'keyboard-status.json',JSON.stringify(st));}
      if(Math.abs(m.v)<2&&st.raceT>5&&st.raceT>recoveryUntil&&m.spin<=0&&m.rescue<=0){
        await p.keyboard.up('z');if(steering)await p.keyboard.up(steering);
        const reverseTurn=steering==='ArrowLeft'?'ArrowRight':'ArrowLeft';await p.keyboard.down(reverseTurn);await p.keyboard.down('x');await frames(45);
        await p.keyboard.up('x');await p.keyboard.up(reverseTurn);await p.keyboard.down('z');steering='';recoveryUntil=st.raceT+4;continue;
      }
      const i=((Math.round(m.prog)+Math.round(5+Math.max(0,m.v)*.32))%circuit.n+circuit.n)%circuit.n,target=circuit.points[i];
      let angle=Math.atan2(target[0]-m.x,target[2]-m.z)-m.yaw;angle=Math.atan2(Math.sin(angle),Math.cos(angle));
      const wanted=angle>.09?'ArrowLeft':angle<-.09?'ArrowRight':'';
      if(wanted!==steering){if(steering)await p.keyboard.up(steering);if(wanted)await p.keyboard.down(wanted);steering=wanted;}
      if(m.item&&m.roll<=0)await p.keyboard.press('c');
      if(m.lap!==lastLap){lastLap=m.lap;console.log('Keyboard race lap '+lastLap+' at '+st.raceT.toFixed(1)+'s');await shot('keyboard-race-lap-'+lastLap);}
      await frames(8);
    }
    if(steering)await p.keyboard.up(steering);await p.keyboard.up('z');
    assert((await state()).me.done,'Keyboard play must cross the actual finish line');assert.equal((await state()).me.lap,4);
    await until(()=>__kartDbg.st.mode==='results');await frames(80);await shot('keyboard-race-results');
    const field=await state(),rivals=field.karts.filter(k=>k.n!=='JACK');
    console.log('Full-race AI '+JSON.stringify(rivals));
    assert(rivals.filter(k=>k.lap>=3).length>=4,'At least four rivals must reach the final lap alongside the keyboard player');
    assert(rivals.every(k=>k.prog>circuit.n),'No rival may remain stranded on the first lap');
  }
  async function menu(index){await p.evaluate(()=>__kartDbg.title());await press('Enter');for(let n=0;(await state()).selection.main!==index;n++){assert(n<8);await press('ArrowDown')}await press('z')}
  await menu(5);assert.equal((await state()).mode,'options');const music=(await state()).sv.opt.mus;await press('z');assert.equal((await state()).sv.opt.mus,music?0:1);await press('z');await shot('options');await press('x');
  await menu(6);assert.equal((await state()).mode,'how');await shot('controls');await press('ArrowRight');await shot('item-guide');await press('ArrowRight');await shot('tips');await press('x');
  await menu(4);assert.equal((await state()).mode,'records');await shot('records');await press('ArrowRight');await shot('time-records');await press('x');
  for(const [index,mode] of [[1,'track'],[2,'track'],[3,'arena']]){await menu(index);if(index===1)await press('z');assert.equal((await state()).mode,'driver');await press('z');assert.equal((await state()).mode,mode);await shot(['','vs-track-select','time-trial-track-select','arena-select'][index]);}
  // Mode isolation: battle must not carry a cup, a mirror map or a time-trial ghost.
  await start('battle',1);assert.equal((await state()).gp,null);assert.equal((await state()).ghost,null);await shot('battle-block-party');
  await start('vs',4,0);await p.evaluate(()=>{__kartDbg.place(.215,0,22);window.__rmAuto=true});await frames(260);await shot('canyon-jump-50cc');console.log('50CC canyon jump rescues: '+(await state()).me.rescues);
  const normal=await p.evaluate(()=>__kartDbg.circuit.points[1][0]);await start('vs',4,3);const mirrored=await p.evaluate(()=>__kartDbg.circuit.points[1][0]);assert(Math.abs(normal+mirrored)<.00001);await shot('mirror');
  await start('battle',1);
  // Pause restart, rapid input, global Esc, screen resize, Q and T preserve the cartridge instance.
  await press('Enter');await press('ArrowDown');await press('z');assert.equal((await state()).paused,false);assert.equal((await state()).mode,'count');
  await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));const t=(await state()).raceT;await p.waitForTimeout(300);assert.equal((await state()).raceT,t);await p.keyboard.press('Escape');
  await p.evaluate(()=>__kartDbg.go());await until(()=>__kartDbg.st.mode==='race');await p.evaluate(()=>window.kartInstance=RoomTV.dbg());
  for(const [width,height] of [[1024,768],[1920,1080],[1366,860]]){await p.setViewportSize({width,height});await shot('size-'+width);assert(await p.evaluate(()=>RoomTV.dbg()===kartInstance));}
  await p.keyboard.press('t');await shot('battle-room');assert(await p.evaluate(()=>RoomTV.dbg()===kartInstance));await p.keyboard.press('t');
  await p.keyboard.press('q');await until(()=>House.mode==='walk');await shot('room-lean-back');await p.evaluate(()=>House.act('n64'));await until(()=>House.focused&&RoomTV.open_);assert(await p.evaluate(()=>RoomTV.dbg()===kartInstance));
  // Shared kit regression: the other consumer still renders and drives its race.
  await p.evaluate(()=>RoomTV.test('ps.grav'));await until(()=>window.__gravDbg?.st.mode==='card'||window.__gravDbg?.st.mode==='title');
  await p.evaluate(()=>{__gravDbg.race('race',0,0);__gravDbg.go()});await until(()=>__gravDbg.st.mode==='race');await p.keyboard.down('z');await frames(120);await p.keyboard.up('z');
  assert(await p.evaluate(()=>__gravDbg.st.me.v>0));await shot('shared-kit-antigrav');
  // A normal refresh preserves household pose/power and kart records; it never has a black room.
  await p.keyboard.press('q');await until(()=>House.mode==='walk');await p.waitForTimeout(600);
  const gameSave=await p.evaluate(()=>Apps.loadGame('rm.n64.kart',1)),ghostSave=await p.evaluate(()=>localStorage.getItem('jhp_rmkart_gh0'));
  const pose=await p.evaluate(()=>{const p=JSON.parse(localStorage.getItem('jhp_hs_pose'));delete p.t;return p}),power=await p.evaluate(()=>localStorage.getItem('jhp_off'));
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await p.evaluate(()=>House.mode),'walk');
  assert.deepEqual(await p.evaluate(()=>{const p=JSON.parse(localStorage.getItem('jhp_hs_pose'));delete p.t;return p}),pose);assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_off')),power);
  assert.deepEqual(await p.evaluate(()=>Apps.loadGame('rm.n64.kart',1)),gameSave);assert.equal(await p.evaluate(()=>localStorage.getItem('jhp_rmkart_gh0')),ghostSave);
  await p.screenshot({path:shots+'refresh-room.png'});

 }
 }
 assert.deepEqual(f.errors,[]);assert(!/mod failed to load|unhandled|fatal/i.test(log),log);
 console.log('KART '+label.toUpperCase()+' PASS: '+(benchmark?'matched native-resolution benchmark.':artOnly?'final art, all eight tracks/landmarks and native software-render measurements.':focused?'focused item, drift, ghost, cup, gamepad, room and shared-kit flows.':baseline?'baseline art/play captures and software-render measurements.':'full keyboard race, eight tracks/drivers, item/drift/collision/ghost/battle/cup/unlocks, keyboard/gamepad/pause/room/refresh/shared-kit flows and native software-render measurements.'));
}catch(e){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:shots+'failure.png'}).catch(()=>{});console.error(await activePage.evaluate(()=>window.__kartDbg?.st).catch(()=>null))}throw e}
finally{clearTimeout(watchdog);await cleanup()}
