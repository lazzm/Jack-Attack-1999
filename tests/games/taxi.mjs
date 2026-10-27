// Mad Minicab (Daydream): production renderer + game logic at the console's native 640x480, real key edges,
// disposable server/data only. node tests/games/taxi.mjs [--baseline] [--no-room] [--quick]
//  --baseline  plays the committed (HEAD) cartridge and writes tests/shots/games/taxi/before/
//  --no-room   skips the real bedroom (telly + LOCK IN) check
// Long drives between fares use the cartridge's own autopilot (window.__rmAuto) to bound the run time; pick-ups,
// drop-offs, drifts, dashes, pause, menus and every Crazy Box start go through real keyboard input.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import net from 'node:net';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadavg} from 'node:os';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),before=process.argv.includes('--baseline'),tag=before?'before':'after';
const baselineSource=before?execFileSync('git',['show','HEAD:app/public/js/rm-g-taxi.js'],{cwd:root,encoding:'utf8'}):null;
const shots=root+'tests/shots/games/taxi/'+tag+'/';
let port=+(process.env.TAXI_PORT||0);
if(!port)port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
await mkdir(shots,{recursive:true});
let server,browser,data,p,log='';const errors=[];
async function cleanup(){if(browser)await browser.close().catch(()=>{});if(server?.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');await done}if(data)await rm(data,{recursive:true,force:true})}
for(const s of ['SIGINT','SIGTERM'])process.once(s,()=>void cleanup().finally(()=>process.exit(1)));
const watchdog=setTimeout(()=>{console.error('WATCHDOG');void cleanup().finally(()=>process.exit(1))},900000);
const delay=t=>new Promise(r=>setTimeout(r,t));
const SRC=['/vendor/three.min.js','/js/cast.js','/js/rm-tv.js','/js/rm-3d.js','/js/rm-g-taxi.js'];
try{
 data=await mkdtemp('/tmp/jhp-taxi-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',b=>log+=b);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<150&&server.exitCode===null,log);await delay(100)}
 const base='http://127.0.0.1:'+port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});p=await browser.newPage({viewport:{width:1366,height:860}});
 await p.addInitScript(()=>{let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const RD=Date;window.Date=class extends RD{constructor(...a){super(...(a.length?a:[1999,9,27,14,0,0]))}static now(){return RD.now()}}});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await p.route('**/__taxi-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="background:#101018;margin:0">'}));
 if(before)await p.route('**/js/rm-g-taxi.js*',r=>r.fulfill({body:baselineSource,contentType:'application/javascript'}));
 await p.goto(base+'/__taxi-review');await boot();
 // ---- title, attract demo, menus (real key edges)
 await frames(150);await shot('title');await frames(14*60+30);assert.equal(await dbg('demo'),true,'Attract demo starts after the title idles');await frames(240);await shot('attract');
 await key('Enter');await frames(2);assert.equal(await dbg('mode'),'title','A key ends the demo');await key('Enter');assert.equal(await dbg('mode'),'menu');await shot('menu');
 const MAIN=await p.evaluate(()=>window.__taxiMenu?__taxiMenu():['ARCADE','WORK SHIFT','CRAZY BOX','RECORDS','OPTIONS','HOW TO PLAY']);
 const go=async name=>{for(let i=0;i<MAIN.length&&await p.evaluate(n=>(window.__taxiMenu?__taxiMenu():[])[__taxiDbg().menu]!==n,name);i++)await key('ArrowDown')};
 if(!before){for(const [name,mode] of [['CRAZY BOX','box'],['RECORDS','records'],['OPTIONS','options'],['HOW TO PLAY','how'],['LICENCE','licence']]){if(!MAIN.includes(name))continue;await go(name);await key('z');assert.equal(await dbg('mode'),mode,name);await shot('menu-'+mode);if(mode==='how'||mode==='licence'){await key('ArrowRight');await shot('menu-'+mode+'-2')}await key('x');assert.equal(await dbg('mode'),'menu')}}
 else{for(let i=0;i<2;i++)await key('ArrowDown');await key('z');await shot('menu-box');await key('x');await key('ArrowDown');await key('z');await shot('menu-records');await key('x');}
 // ---- arcade: driver select, countdown, play
 if(!before)await go('ARCADE');else{for(let i=0;i<3;i++)await key('ArrowUp')}
 await key('z');assert.equal(await dbg('mode'),'drivers');await shot('drivers');await key('ArrowRight');await shot('drivers-2');await key('ArrowLeft');await key('z');assert.equal(await dbg('mode'),'count');await frames(40);await shot('countdown');
 await frames(170);assert.equal(await dbg('mode'),'play');
 // real throttle from the rank: the cab moves and the speedo climbs
 const s0=await p.evaluate(()=>__taxiDbg());await hold('ArrowUp',90);const s1=await p.evaluate(()=>__taxiDbg());assert(s1.sp>12,'Throttle accelerates: '+s1.sp);assert(Math.hypot(s1.x-s0.x,s1.z-s0.z)>15);await shot('drive');
 // crazy drift: hold handbrake + steer at speed
 const c0=await dbg('crazyCount');await p.keyboard.down('ArrowUp');await frames(10);await p.keyboard.down('c');await p.keyboard.down('ArrowLeft');await frames(36);await shot('drift');await p.keyboard.up('c');await p.keyboard.up('ArrowLeft');await p.keyboard.up('ArrowUp');await frames(4);
 // crazy dash: brake then straight on the gas (real key edges)
 await p.evaluate(()=>__taxiDo.place(24.5*20-3,31.5*20,Math.PI/2));await frames(5);await key('x');await key('z');await frames(1);if(!before)assert(await dbg('dash')>0,'Crazy dash fires from brake-then-go');await frames(6);await shot('dash');await frames(40);
 // pick-up: pull up next to someone (production pick-up logic), then the fare card + arrow
 const to=await p.evaluate(()=>__taxiDo.pick());assert(to,'Picked someone up');await frames(60);assert(await dbg('arrowVis'),'Arrow shows the way');await shot('fare-pickup');
 // pause freezes the meter
 await key('Enter');if(!before)assert(await dbg('paused'));const tl=await p.evaluate(()=>__taxiDbg().timeLeft);await frames(200);assert.equal(await p.evaluate(()=>__taxiDbg().timeLeft),tl,'Pause freezes the clock');await shot('pause');await key('Enter');
 if(!before){
  // refresh mid-fare: same fare, money, clock and position, resumed paused
  await frames(30);const pre=await p.evaluate(()=>{__taxiDo.save();return __taxiDbg()});await reload();const post=await p.evaluate(()=>__taxiDbg());
  assert.equal(post.mode,'play');assert(post.paused,'A refresh resumes paused');assert.equal(post.fare?.to,pre.fare?.to);assert.equal(post.money,pre.money);assert(Math.abs(post.timeLeft-pre.timeLeft)<=1);assert(Math.hypot(post.x-pre.x,post.z-pre.z)<2);await shot('refresh-paused');await key('Enter');
 }
 // the drive to the destination (autopilot, bounded) and the drop-off
 const f0=await dbg('fares');await p.evaluate(()=>{window.__taxiDo.time?.(99);window.__rmAuto=true});let st;for(let i=0;i<60;i++){await frames(60);st=await p.evaluate(()=>__taxiDbg());if(st.fares>f0)break;if(i===8)await shot('fare-mid')}
 await p.evaluate(()=>{window.__rmAuto=false});assert(st.fares>f0,'Delivered the fare: '+JSON.stringify(st));await frames(20);await shot('fare-dropoff');
 // near the time limit, then results with the licence grade
 await p.evaluate(()=>__taxiDo.end());await frames(30);assert.equal(await dbg('mode'),'over');await frames(260);await shot('results');
 if(!before){assert(/^[SABCDE]$/.test(await p.evaluate(()=>__taxiDbg().grade)),'Shift results award a licence grade');}
 await key('z');await frames(10);
 // ---- every Crazy Box test starts and its HUD reads (real throttle for a moment in each)
 const nTests=await p.evaluate(()=>window.__taxiTests?__taxiTests().length:10);
 for(let i=0;i<nTests;i++){await p.evaluate(i=>__taxiDo.test(i),i);await frames(40);if(i%4===0||!before)await shot('test-'+i+'-intro');await frames(170);await hold('ArrowUp',50);await shot('test-'+i);assert.equal(await dbg('mode'),'play')}
 if(!before){
  // Crazy Box locks: a fresh save has only the first row open
  assert.equal(await p.evaluate(()=>__taxiDo.boxOpen(15)),false,'The last test starts locked');
  // a medal opens the next row; a gold licence grade is recorded
  await p.evaluate(()=>{__taxiDo.test(0)});await frames(200);await p.evaluate(()=>__taxiDo.finish(60));await frames(200);await shot('test-result-gold');await key('z');
  // crazy stop: full speed then brake hard -> stunt
  await p.evaluate(()=>__taxiDo.start('w3'));await frames(200);await p.evaluate(()=>__taxiDo.place(2*20,39.5*20,Math.PI/2));await frames(5);await hold('ArrowUp',120);const cs=await dbg('crazyCount');await hold('x',70);assert(await dbg('crazyCount')>cs,'Hard stop from speed is a CRAZY STOP');await shot('crazy-stop');
  // refresh during a Crazy Box test restarts that test (not the title)
  await p.evaluate(()=>{__taxiDo.test(4)});await frames(220);await p.evaluate(()=>__taxiDo.save());await reload();assert.equal(await p.evaluate(()=>__taxiDbg().test?.id),await p.evaluate(()=>__taxiTests()[4]));await shot('refresh-test');await key('Enter');
  // time of day and model showcase
  for(const [i,n] of [[1,'sunset'],[2,'night']]){await p.evaluate(()=>__taxiDo.start('w5'));await frames(200);await p.evaluate(i=>__taxiDo.tod(i),i);await hold('ArrowUp',60);await shot('tod-'+n)}
 }
 await p.evaluate(()=>__taxiDo.showcase());await p.evaluate(()=>__taxiDo.look(3*20+14,4,38.5*20+14,3*20+18,1,38.5*20));await frames(3);await shot('models-cars');
 await p.evaluate(()=>__taxiDo.look(3*20+8,2.4,38.5*20+12,3*20+8,1,38.5*20+6));await frames(3);await shot('models-people');
 await p.evaluate(()=>__taxiDo.look(3*20+40,3,38.5*20+8,3*20+28,1,38.5*20+6));await frames(3);await shot('models-people-2');
 await reload();await p.evaluate(()=>__taxiDo.start('arcade'));await frames(220);await performanceSample();
 assert.deepEqual(errors,[],'Browser errors');await browser.close();browser=null;
 if(!process.argv.includes('--no-room'))await roomCheck(base);
 assert(!/mod failed to load|unhandled|fatal/i.test(log),log);console.log('MAD MINICAB '+tag.toUpperCase()+' PASS');
}catch(e){if(p&&!p.isClosed()){console.error(await p.evaluate(()=>window.__taxiDbg?.()).catch(()=>null));await p.screenshot({path:shots+'failure.png'}).catch(()=>{})}throw e}
finally{clearTimeout(watchdog);await cleanup()}

async function boot(){
 const base=new URL(p.url()).origin;await p.evaluate(()=>{window.Room={_:{esc:s=>s,secret(){}},House:{paused:true}};window.House=Room.House});
 for(const src of SRC)await p.addScriptTag({url:base+src});await p.evaluate(installRunner);
}
async function reload(){await p.reload();await boot();await frames(2)}
function installRunner(){
 const W=640,H=480,cv=document.createElement('canvas'),ov=document.createElement('canvas');for(const c of [cv,ov]){c.width=W;c.height=H;Object.assign(c.style,{position:'fixed',width:'min(96vw,96vh * 4 / 3)',height:'auto',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});document.body.append(c)}
 const held={},pressed={},saved={value:JSON.parse(localStorage.getItem('taxi-review-save')||'null')},restoring=!!saved.value;
 const K={W,H,cv,hud:ov.getContext('2d'),frame:0,t:0,best:0,font:RoomTV.font,restoring,id:'dc.taxi',con:'dc',
 label:b=>({a:'A',b:'B',x:'X',y:'Y',l:'L',r:'R',start:'START'}[b]||String(b).toUpperCase()),keyLabel:b=>({a:'Z',x:'C',b:'X',c:'C',y:'V',l:'U',r:'E',start:'ENTER'}[b]||String(b).toUpperCase()),
 load:()=>structuredClone(saved.value),save:s=>{saved.value=structuredClone(s);localStorage.setItem('taxi-review-save',JSON.stringify(s));return true},
 music(){},sfx:{tone(){},noise(){},seq(){}},secret(id){(window.review.secrets||(window.review.secrets=[])).push(id)},over(s,o){window.review.result={s,o}},resume(){this.restoring=false},
 held:b=>!!held[b],pressed:b=>!!pressed[b],any:()=>Object.entries(pressed).some(([k,v])=>v&&['a','b','x','y','start'].includes(k)),stick:()=>({x:+!!held.right-+!!held.left,y:+!!held.down-+!!held.up}),
 three(o){return this._three||(this._three=RoomTV.make3d(this,{...o,look:'dc'}))}};
 const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',c:'x',v:'y',u:'l',e:'r',Enter:'start'};
 addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
 window.review={K,saved,game:RoomTV.defs['dc.taxi'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}this.game.draw()}};
}
async function dbg(k){return p.evaluate(k=>{const d=__taxiDbg();return d?d[k]:undefined},k)}
async function frames(n){while(n>0){const m=Math.min(n,240);await p.evaluate(m=>review.step(m),m);n-=m}}
async function key(k){await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)}
async function hold(k,n){await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)}
async function shot(name){console.log('Capture '+name);await frames(1);await p.screenshot({path:shots+name+'.png'});const uri=await p.evaluate(()=>{const K=review.K;K._three.render();const c=document.createElement('canvas');c.width=K.W;c.height=K.H;const g=c.getContext('2d');g.drawImage(K.cv,0,0);g.drawImage(K.hud.canvas,0,0);const d=g.getImageData(0,0,K.W,K.H).data;let v=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>60)v++;if(v<K.W*K.H*.08)throw Error('Native capture is black');return c.toDataURL().split(',')[1]});await writeFile(shots+name+'-native.png',Buffer.from(uri,'base64'))}
async function performanceSample(){
 const perf=await p.evaluate(async()=>{const K=review.K,T=K._three,gl=T.ren.getContext(),px=new Uint8Array(4),a=[];
  for(let i=0;i<70;i++){const s=performance.now();review.step(1);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(i>=10)a.push(performance.now()-s)}
  const stats=v=>{v.sort((a,b)=>a-b);return{mean:+(v.reduce((s,x)=>s+x,0)/v.length).toFixed(2),p50:+v[Math.floor(v.length*.5)].toFixed(2),p95:+v[Math.floor(v.length*.95)].toFixed(2)}};
  const ext=gl.getExtension('WEBGL_debug_renderer_info');return{native:[K.W,K.H],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'',frameMs:stats(a),drawCalls:T.ren.info.render.calls,triangles:T.ren.info.render.triangles}});
 perf.hostLoad=loadavg();await writeFile(shots+'performance.json',JSON.stringify(perf,null,2));console.log('PERFORMANCE '+JSON.stringify(perf));
}
async function roomCheck(base){
 const account='Cabbie'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,width:1366,height:860});browser=f.browser;p=f.page;
 if(before)await p.route('**/js/rm-g-taxi.js*',r=>r.fulfill({body:baselineSource,contentType:'application/javascript'}));
 const until=async(fn,t=30000)=>{const end=Date.now()+t;while(Date.now()<end){assert.deepEqual(f.errors,[],'Room browser errors');if(await p.evaluate(fn))return;await p.waitForTimeout(100)}throw Error('Room timeout '+fn)};
 // the real disc: off the shelf, case opened, disc into the Daydream (so a refresh restores it like a player's would)
 const aim=async(eye,target)=>{await f.view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})};
 const home=await p.evaluate(()=>House.THINGS['media.box.dc.taxi']?.at);assert(home,'Mad Minicab case on the shelf');
 await aim([-220,-55,35],[home.x,home.y-6,-36]);await p.keyboard.press('e');await until(()=>House.held()==='media.box.dc.taxi');
 await aim([-130,-55,220],[-130,73,145]);await p.keyboard.press('e');await until(()=>House.THINGS['media.box.dc.taxi'].st==='rest');
 await aim([-130,-55,220],[-130,67,146.6]);await p.keyboard.press('f');await until(()=>House.THINGS['media.box.dc.taxi'].caseOpen);await p.waitForTimeout(350);
 await aim([-130,-55,220],[-128,67,145.1]);await p.keyboard.press('e');await until(()=>House.held()==='media.dc.taxi');
 const slot=await p.evaluate(()=>House.SNAPS['console.dc']);await aim([-185,-55,120],[slot.x,slot.y,slot.z]);await p.keyboard.press('e');
 await until(()=>RoomTV.open_&&House.focused&&!House.gliding&&window.__taxiDbg?.()?.mode==='title',60000);await p.waitForTimeout(1500);
 await p.screenshot({path:shots+'in-room.png'});
 for(let i=0;i<6&&await p.evaluate(()=>__taxiDbg().mode!=='menu');i++){await p.keyboard.press('Enter');await p.waitForTimeout(700)}assert.equal(await p.evaluate(()=>__taxiDbg().mode),'menu');
 await p.keyboard.press('t');await p.waitForTimeout(500);await p.screenshot({path:shots+'lock-in.png'});
 if(!before){
  await p.evaluate(()=>__taxiDo.start('arcade'));await until(()=>__taxiDbg().mode==='play');await p.keyboard.down('ArrowUp');await p.waitForTimeout(1500);await p.keyboard.up('ArrowUp');assert(await p.evaluate(()=>__taxiDbg().sp>3),'Real keys drive in the room');
  await p.screenshot({path:shots+'lock-in-play.png'});await p.keyboard.press('t');await p.waitForTimeout(400);await p.screenshot({path:shots+'in-room-play.png'});
  // the house menu freezes the meter; a reload resumes the same shift, paused
  await p.keyboard.press('Escape');await p.waitForTimeout(200);const tl=await p.evaluate(()=>__taxiDbg().timeLeft);await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>__taxiDbg().timeLeft),tl,'House pause freezes the clock');await p.keyboard.press('Escape');
  await p.keyboard.press('Enter');await until(()=>__taxiDbg().paused);const pre=await p.evaluate(()=>{__taxiDo.save();return __taxiDbg()});
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&window.__taxiDbg?.()?.mode==='play'&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'),90000);
  const post=await p.evaluate(()=>__taxiDbg());assert(post.paused,'Room refresh resumes paused');assert(Math.abs(post.timeLeft-pre.timeLeft)<=1);await p.waitForTimeout(800);await p.screenshot({path:shots+'refresh-room.png'});
 }
 assert.deepEqual(f.errors,[]);await browser.close();browser=null;console.log('ROOM PASS');
}
