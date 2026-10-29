// Warp Wombat: production renderer/physics, real key edges, disposable data only.
// node tests/games/run.mjs [--baseline] [--native] [--room-only]
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import net from 'node:net';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadavg} from 'node:os';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),before=process.argv.includes('--baseline'),tag=before?'before':'after';
const baselineSource=before?await readFile(process.env.RUN_BASELINE||'/tmp/warp-wombat-before/rm-g-run.js','utf8').catch(e=>{if(process.env.RUN_BASELINE)throw e;return execFileSync('git',['show','HEAD:app/public/js/rm-g-run.js'],{cwd:root,encoding:'utf8'})}):null;
const shots=root+'tests/shots/games/run/'+tag+'/';
let port=+(process.env.RUN_PORT||0);
if(!port)for(const n of [...Array.from({length:12},(_,i)=>18088+i),...Array.from({length:8},(_,i)=>18080+i)]){const free=await new Promise(resolve=>{const probe=net.createServer();probe.once('error',()=>resolve(false));probe.listen(n,'127.0.0.1',()=>probe.close(()=>resolve(true)))});if(free){port=n;break}}
assert(port>=18080&&port<=18099);await mkdir(shots,{recursive:true});
let server,browser,data,p,log='';const errors=[];
async function cleanup(){if(browser)await browser.close().catch(()=>{});if(server?.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');await done}if(data)await rm(data,{recursive:true,force:true})}
for(const s of ['SIGINT','SIGTERM'])process.once(s,()=>void cleanup().finally(()=>process.exit(1)));
const watchdog=setTimeout(()=>void cleanup().finally(()=>process.exit(1)),600000);
const delay=t=>new Promise(r=>setTimeout(r,t));
try{
 data=await mkdtemp('/tmp/jhp-run-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',b=>log+=b);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<100&&server.exitCode===null,log);await delay(100)}
 const base='http://127.0.0.1:'+port;
 if(!process.argv.includes('--room-only')){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});p=await browser.newPage({viewport:{width:1366,height:860}});await p.addInitScript(()=>{let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await p.route('**/__run-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="background:#101018">'}));
 if(before)await p.route('**/js/rm-g-run.js*',async r=>r.fulfill({body:baselineSource,contentType:'application/javascript'}));
 await p.goto(base+'/__run-review');
 await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});
 for(const src of ['/vendor/three.min.js','/js/cast.js','/js/rm-tv.js','/js/rm-3d.js','/js/rm-g-run.js'])await p.addScriptTag({url:base+src});
 await p.evaluate(installRunner);
 if(process.argv.includes('--benchmark')){await p.evaluate(()=>__runDbg.level(0));await frames(90);await performanceSample();await shot('benchmark');}else if(process.argv.includes('--legacy')){await legacySave();}else if(process.argv.includes('--flows')){await p.evaluate(()=>__runDbg.level(0));await campaignChecks();await keyboardPilot();await bossCombat();await legacySave();}else if(process.argv.includes('--bosses')){await bossCombat();}else if(process.argv.includes('--pilot')){await keyboardPilot();}else {
 await frames(60);await shot('title');for(let n=0;n<3;n++){await frames(10);await shot('title-sequence-'+n)}await frames(960);await shot('attract');for(let n=0;n<3;n++){await frames(8);await shot('attract-sequence-'+n)}
 await key('Enter');await frames(3);await key('Enter');await shot('menu');
 // Baseline title/menu cycling differs after a refresh; debug places branches only.
 await p.evaluate(()=>__runDbg.hub());await frames(1);await shot('hub');
 for(let i=0;i<(before?5:await p.evaluate(()=>__runDbg.levels.length));i++){
   await p.evaluate(i=>__runDbg.level(i),i);await frames(1);await shot('level-'+i+'-start');
   const direction=await p.evaluate(()=>__runDbg.LV.L.side?'ArrowRight':__runDbg.LV.L.chase?'ArrowDown':'ArrowUp');await hold(direction,70);await frames(80);await p.evaluate(()=>{const w=__runDbg.WD,mid=Math.floor(w.goal*.45),safe=w.rows.map((row,i)=>({row,i})).filter(q=>q.row==='.....').sort((a,b)=>Math.abs(a.i-mid)-Math.abs(b.i-mid))[0];__runDbg.warp(safe?safe.i:mid);if(w.boulder)w.boulder.z=__runDbg.P.z+10});await hold(direction,18);await shot('level-'+i+'-mid');
 }
 for(let i=0;i<(before?2:await p.evaluate(()=>__runDbg.bosses.length));i++){await p.evaluate(i=>__runDbg.boss(i),i);await frames(90);await shot('boss-'+i)}
 await p.evaluate(()=>__runDbg.level(0));await hold('ArrowUp',42);await hold('z',20);for(let i=0;i<3;i++){await frames(5);await shot('jump-sequence-'+i)}
 await key('x');await shot('spin');await key('Enter');await shot('pause');
 const t=await p.evaluate(()=>__runDbg.LV.t);await frames(120);assert.equal(await p.evaluate(()=>__runDbg.LV.t),t,'Pause freezes simulation');await key('Enter');
 for(const [a,d,h]of [[0,3,1.4],[140,3,1.4],[-70,3,0.7]]){await p.evaluate(({a,d,h})=>__runDbg.view('wally',a,d,h),{a,d,h});await frames(2);await shot('model-'+a)}
 if(!before)for(const what of ['crab','hog','peng','turtle','mask','tusk','pod','boulder','admiral','rat','scone','mech'])for(const angle of [25,150]){await p.evaluate(({what,angle})=>__runDbg.view(what,angle,what==='boulder'||what==='scone'?7:what==='admiral'||what==='mech'?(what==='mech'?8:5):what==='tusk'?5:3.5,what==='boulder'||what==='scone'||what==='mech'?3:1.6),{what,angle});await frames(2);await shot('model-'+what+'-'+angle)}
 await p.evaluate(()=>__runDbg.level(0));await frames(5);await performanceSample();
 if(!before&&!process.argv.includes('--art')){await campaignChecks();await keyboardPilot();await bossCombat();await legacySave();}
 }
 assert.deepEqual(errors,[],'Browser errors');await browser.close();browser=null;
 }
 if(!process.argv.includes('--native')){await roomCheck(base,process.argv.includes('--touch'));if(!before&&!process.argv.includes('--room-only')&&!process.argv.includes('--touch'))await roomCheck(base,true);}
 assert(!/mod failed to load|unhandled|fatal/i.test(log),log);console.log('WARP WOMBAT '+tag.toUpperCase()+' PASS');
}catch(e){if(p&&!p.isClosed()){console.error(await p.evaluate(()=>({mode:window.__runDbg?.mode,LV:window.__runDbg?.LV,P:window.__runDbg?.P})).catch(()=>null));await p.screenshot({path:shots+'failure.png'}).catch(()=>{})}throw e}
finally{clearTimeout(watchdog);await cleanup()}
function installRunner(){
 const cv=document.createElement('canvas'),ov=document.createElement('canvas');for(const c of [cv,ov]){c.width=320;c.height=240;Object.assign(c.style,{position:'fixed',width:'min(92vw,92vh * 4 / 3)',height:'auto',imageRendering:'pixelated',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});document.body.append(c)}
 const held={},pressed={},saved={value:JSON.parse(localStorage.getItem('run-review-save')||'null')};
 const K={W:320,H:240,cv,hud:ov.getContext('2d'),frame:0,t:0,best:0,font:RoomTV.font,restoring:false,
 label:b=>({a:'X',x:'SQUARE',b:'CIRCLE',y:'TRIANGLE',start:'START'}[b]||b),keyLabel:b=>({a:'Z',x:'C',b:'X',y:'V',l:'U',r:'E',start:'ENTER'}[b]||b),
 load:()=>structuredClone(saved.value),save:s=>{saved.value=structuredClone(s);localStorage.setItem('run-review-save',JSON.stringify(s));return true},
 music(){},sfx:{tone(){},noise(){},seq(){}},secret(){},over(s,o){window.review.result={s,o}},resume(){this.restoring=false},
 held:b=>!!held[b],pressed:b=>!!pressed[b],any:()=>Object.values(pressed).some(Boolean),stick:()=>({x:+!!held.right-+!!held.left,y:+!!held.down-+!!held.up}),
 three(o){return this._three||(this._three=RoomTV.make3d(this,{...o,look:'ps1'}))}};
 const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',c:'x',v:'y',u:'l',e:'r',Enter:'start',Shift:'select'};
 addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
 window.review={K,saved,game:RoomTV.defs['ps.run'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}this.game.draw()}};
}
async function frames(n){await p.evaluate(n=>review.step(n),n)}
async function key(k){await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)}
async function hold(k,n){await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)}
async function shot(name){console.log('Capture '+name);await frames(1);await p.screenshot({path:shots+name+'.png'});const uri=await p.evaluate(()=>{const K=review.K;K._three.render();const c=document.createElement('canvas');c.width=K.W;c.height=K.H;const g=c.getContext('2d');g.drawImage(K.cv,0,0);g.drawImage(K.hud.canvas,0,0);const data=g.getImageData(0,0,K.W,K.H).data;let visible=0;for(let i=0;i<data.length;i+=4)if(data[i]+data[i+1]+data[i+2]>60)visible++;if(visible<K.W*K.H*.12)throw Error('Native capture has no rendered world');return c.toDataURL().split(',')[1]});await writeFile(shots+name+'-native.png',Buffer.from(uri,'base64'))}
async function performanceSample(){
 const perf=await p.evaluate(async()=>{const K=review.K,T=K._three,gl=T.ren.getContext(),px=new Uint8Array(4),a=[];
  for(let i=0;i<60;i++){const start=performance.now();review.step(1);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(i>=10)a.push(performance.now()-start)}
  const raf=[];let prev,warm=0;await new Promise(resolve=>{function tick(t){review.step(1);if(++warm>20){if(prev!=null)raf.push(t-prev);prev=t;}if(raf.length>=90)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});
  const stats=v=>{v.sort((a,b)=>a-b);return{mean:v.reduce((s,x)=>s+x,0)/v.length,p50:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)]}};
  const ext=gl.getExtension('WEBGL_debug_renderer_info');return{native:[320,240],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'',displayWarmupFrames:20,renderMs:stats(a),rafMs:stats(raf),drawCalls:T.ren.info.render.calls,triangles:T.ren.info.render.triangles};
 });perf.hostLoad=loadavg();await writeFile(shots+'performance.json',JSON.stringify(perf,null,2));console.log('PERFORMANCE '+JSON.stringify(perf));
}

// Bounded arena placements dodge attacks and approach actual vulnerability windows;
// damage always comes from real jump/spin inputs and production collision code.
async function bossCombat(){
 for(const bi of [0,2,1,3]){
 await p.evaluate(bi=>__runDbg.boss(bi),bi);let jump=false,lastHP=await p.evaluate(()=>__runDbg.WD.hp),hits=0;
 for(let step=0;;step++){
  const d=await p.evaluate(()=>({mode:__runDbg.mode,msg:__runDbg.msg,P:__runDbg.P,LV:{deadT:__runDbg.LV.deadT,deaths:__runDbg.LV.deaths},b:{st:__runDbg.WD.boss.st,x:__runDbg.WD.boss.x,z:__runDbg.WD.boss.z,t:__runDbg.WD.boss.t},hp:__runDbg.WD.hp}));
  if(d.mode==='tally'){assert.equal(d.hp,0);assert(hits>0);await frames(120);await shot('boss-'+bi+'-combat-clear');console.log('BOSS COMBAT '+bi+' PASS ('+hits+' earned hits)');break}
  assert(step<3000,'Boss fight did not reach its ending '+bi);assert.equal(d.LV.deaths,0,'Arena dodges must avoid damage '+bi+' '+JSON.stringify(d));
  if(d.hp<lastHP){assert.equal(lastHP-d.hp,1);lastHP=d.hp;hits++;await shot('boss-'+bi+'-hit-'+hits)}
  const vulnerable=bi===0?d.b.st==='stun':bi===1?d.b.st==='dizzy':bi===3?d.b.st==='kneel':d.b.st==='dizzy';
  if(bi===3&&!vulnerable&&await mechDodge(d))continue;
  if(vulnerable){
   if(bi===2){await p.evaluate(()=>{const d=__runDbg;d.P.x=d.WD.boss.x+.8;d.P.z=d.WD.boss.z});await key('x')}
   else{
    if(!jump&&d.P.ground){await p.keyboard.down('z');jump=true;}
    if(d.P.y>1.5){await p.evaluate(()=>{const d=__runDbg;d.P.x=d.WD.boss.x;d.P.z=d.WD.boss.z});}
   }
  }else{
   if(bi===2){if(d.P.ground){if(jump)await p.keyboard.up('z');await p.keyboard.down('z');jump=true;}}else if(jump){await p.keyboard.up('z');jump=false;}
   if(d.b.st!=='down')await p.evaluate(({bi,step,st})=>{const p=__runDbg.P;if(bi===0){p.x=st==='charge'?0:(__runDbg.WD.hp%2?8:-8);p.z=st==='charge'?7:0;}else if(bi===2){const w=__runDbg.WD,b=w.boss,points=[[-7,-5],[7,-5],[-7,5],[7,5],[-7,0],[7,0],[0,-7],[0,7],[0,0]],quality=a=>Math.min(Math.hypot(a[0]-b.x,a[1]-b.z)-2,...w.waves.map(q=>Math.abs(Math.hypot(a[0]-q.x,a[1]-q.z)-q.r)-.7));points.sort((a,b)=>quality(b)-quality(a));[p.x,p.z]=points[0];}else{const w=__runDbg.WD,hazards=[...w.balls.map(q=>[q.tx,q.tz]),...w.zaps.map(q=>[q.x,q.z])],corners=[[-7,-5],[7,-5],[-7,5],[7,5]];corners.sort((a,b)=>Math.min(20,...hazards.map(q=>Math.hypot(b[0]-q[0],b[1]-q[1])))-Math.min(20,...hazards.map(q=>Math.hypot(a[0]-q[0],a[1]-q[1]))));[p.x,p.z]=corners[0]}}, {bi,step,st:d.b.st});
  }
  await frames(6);
 }
 if(jump)await p.keyboard.up('z');
 }
}
// Dingotron dodges use real jump inputs: the laser sweep and the shock rings must be jumped, never skipped.
async function mechDodge(d){
 const q=await p.evaluate(()=>{const w=__runDbg.WD,b=w.boss,P=__runDbg.P;const dx=P.x-b.x,dz=P.z-b.z,pa=Math.atan2(-dz,dx);let ahead=((pa-b.ba)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);const ring=Math.min(9,...w.waves.map(q=>{const d=Math.hypot(P.x-q.x,P.z-q.z)-q.r;return d>-0.45?d:9}));return{st:b.st,ahead,ring,ground:P.ground,dist:Math.hypot(dx,dz)}});
 if(process.env.MECH_DEBUG&&q.ring<2)console.log('mech',JSON.stringify(q));
 const jumpNow=async()=>{await p.keyboard.down('z');await frames(6);await p.keyboard.up('z');return true};
 // A safe standing spot: away from the walker, clear of rings and not just ahead of the laser.
 const place=()=>p.evaluate(()=>{const P=__runDbg.P,w=__runDbg.WD,b=w.boss,pts=[[-7,-5],[7,-5],[-7,5],[7,5],[-7,0],[7,0],[0,-7],[0,7]],score=a=>{let s=Math.min(Math.hypot(a[0]-b.x,a[1]-b.z)-4,...w.waves.map(q=>{const d=Math.hypot(a[0]-q.x,a[1]-q.z)-q.r;return d<-0.6?20:d>0?d-3:-5}));if(b.st==='beam'){const ah=((Math.atan2(-(a[1]-b.z),a[0]-b.x)-b.ba)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);s=Math.min(s,ah*4-2)}return s};pts.sort((x,y)=>score(y)-score(x));[P.x,P.z]=pts[0];});
 if(!['beam','aim','stomp','intro'].includes(q.st))return q.ground&&q.ring>0.8&&q.ring<1.4?jumpNow():false;
 if(!q.ground){await frames(2);return true;}
 if((q.st==='beam'&&q.ahead<0.42)||(q.ring>0.8&&q.ring<1.4))return jumpNow();
 if(q.ring<0.85||(q.st==='stomp'&&q.dist<4.5))await place();
 await frames(2);return true;
}
async function keyboardPilot(){
 for(const li of (process.env.RUN_PILOT_LEVELS?process.env.RUN_PILOT_LEVELS.split(',').map(Number):[0,5])){
 await p.evaluate(li=>__runDbg.level(li),li);let previous=new Set(),steps=0;
 for(;;){
  const d=await p.evaluate(()=>{const d=__runDbg,p=d.P,w=d.WD,l=d.LV;if(d.mode!=='level')return{mode:d.mode,LV:{crates:l.crates,deaths:l.deaths,t:l.t,done:l.done},P:p};
   const r=Math.round(-p.z/2),ch=(rr,c)=>w.rows[rr]?.[c]??'.';let best=2,score=-1e9;
   for(let c=0;c<5;c++){let n=-Math.abs(w.cx(r+2)+(c-2)*2-p.x)*.8;for(let j=1;j<=3;j++){const k=ch(r+j,c);n-=(' w'.includes(k)?7:'rztj'.includes(k)?9:0)/(j*.7)}if(n>score){score=n;best=c}}
   let tx=w.cx(r+2)+(best-2)*2;if(r>w.goal-5)tx=w.cx(w.goal);const platform=w.plats.find(q=>q.z<p.z&&p.z-q.z<6);if(platform&&r>0)tx=platform.x;const near=w.crates.filter(c=>c.alive&&Math.abs(c.x-p.x)<1.1&&c.z<p.z+.3&&p.z-c.z<2),rocks=w.rocks.some(k=>Math.abs(k.x-p.x)<1.3&&k.z<p.z+.2&&p.z-k.z<2.6);
   const tile=z=>{const rr=Math.round(-z/2),c=Math.round((p.x-w.cx(rr))/2+2);return w.rows[rr]?.[c]??'.'};
   const gap=[1.25,2].some(q=>' wmL'.includes(tile(p.z-q)));
   return{mode:d.mode,P:p,li:l.li,side:!!l.L.side,chase:!!l.L.chase,target:tx,dead:l.deadT,jump:gap||rocks||near.some(c=>['n','s','t','z'].includes(c.k)),spin:near.some(c=>!['n','s','t','z'].includes(c.k))||w.foes.some(f=>f.alive&&Math.abs(f.x-p.x)<1.7&&Math.abs(f.z-p.z)<2.1),LV:{crates:l.crates,deaths:l.deaths,t:l.t,done:l.done}};
  });
  if(d.mode==='tally'){assert.equal(d.LV.done,'win','A game over is not a completed keyboard run');assert(d.LV.t<180,'Keyboard run timed out');console.log('KEYBOARD level '+li+' '+JSON.stringify(d.LV));await shot('keyboard-'+li+'-finish');break}
  assert.equal(d.mode,'level');assert(++steps<2400,'Keyboard pilot cannot finish '+li+': '+JSON.stringify(d));
  const next=new Set(),delta=d.target-d.P.x;
  if(d.dead<=0){next.add(d.side?'ArrowRight':d.chase?'ArrowDown':'ArrowUp');if(Math.abs(delta)>.24)next.add(d.side?(delta>0?'ArrowDown':'ArrowUp'):d.chase?(delta>0?'ArrowLeft':'ArrowRight'):(delta>0?'ArrowRight':'ArrowLeft'));
   if((d.P.ground&&d.jump)||(!d.P.ground&&d.P.vy>0))next.add('z');
  }
  for(const k of previous)if(!next.has(k))await p.keyboard.up(k);for(const k of next)if(!previous.has(k))await p.keyboard.down(k);previous=next;
  if(d.spin&&steps%4===0)await p.keyboard.press('x');
  await frames(6);if(steps%120===0){console.log('PILOT '+li+' '+JSON.stringify({z:d.P.z,y:d.P.y,t:d.LV.t,deaths:d.LV.deaths}));await shot('keyboard-'+li+'-'+steps)}
 }
 for(const k of previous)await p.keyboard.up(k);
 }
}
async function campaignChecks(){
 const st=()=>p.evaluate(()=>({mode:__runDbg.mode,paused:__runDbg.paused,P:__runDbg.P,LV:{...__runDbg.LV,L:undefined},SV:__runDbg.SV}));
 assert(await p.evaluate(()=>__runDbg.levels.every(l=>l.rows.every(r=>r.length===5))),'Every authored stage row has five complete lanes');
 assert.equal(await p.evaluate(()=>__runDbg.levels.length),20);
 assert.equal(await p.evaluate(()=>__runDbg.rooms.length),4);
 // Menu paths with real edge-triggered inputs, including a non-destructive new-game cancel.
 async function menu(i,dest){await p.evaluate(()=>__runDbg.title());await key('Enter');for(let n=0;n<i;n++)await key('ArrowDown');await key('z');assert.equal((await st()).mode,dest)}
 await menu(2,'scores');await shot('scores-cast');await key('x');await menu(3,'options');await shot('options');await key('z');await key('z');await key('x');
 await menu(4,'howto');for(let i=0;i<4;i++){await shot('controls-'+i);await key('ArrowRight')}await key('x');
 await menu(5,'book');for(let i=0;i<5;i++){await shot('adventure-book-'+i);await key('ArrowRight')}await p.evaluate(()=>__runDbg.save());await reloadNative();assert.equal((await st()).mode,'book');await shot('refresh-book');await key('x');
 // Three actually supplied masks produce invincibility, rather than an unreachable HUD feature.
 await p.evaluate(()=>__runDbg.level(0));
 for(let i=0;i<3;i++){await p.evaluate(i=>{const c=__runDbg.WD.crates.filter(c=>c.k==='a')[i];__runDbg.warp(c.r);__runDbg.P.x=c.x},i);await key('x');await frames(40)}
 assert.equal((await st()).LV.mask,3);assert((await st()).LV.invT>5);await shot('three-mask-invincible');
 // Representative maximum parent/route saves remain below the 20 KB roaming boundary.
 const sizes=await p.evaluate(()=>__runDbg.levels.map((_,i)=>{__runDbg.level(i);return JSON.stringify({...__runDbg.SV,run:__runDbg.capture()}).length}));assert(Math.max(...sizes)<20000,'Main saves must fit roaming storage: '+sizes);
 await writeFile(shots+'save-sizes.json',JSON.stringify(sizes));
 // Start on a reachable crate, use the real spin, then keep its broken state over a reload.
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.warp(4)});await key('x');assert.equal((await st()).LV.mask,1);await shot('mask');
 await p.evaluate(()=>__runDbg.warp(11));await key('x');assert((await st()).LV.crates>=2);await shot('question-crate');
 await p.evaluate(()=>__runDbg.warp(24));await key('x');assert.equal((await st()).LV.cp,24);await shot('checkpoint');
 await key('Enter');const before=await st();await p.evaluate(()=>{__runDbg.save();window.savedRun=__runDbg.capture()});await frames(120);assert.equal((await st()).LV.t,before.LV.t);
 await reloadNative();assert.equal((await st()).paused,true);assert.equal((await st()).LV.cp,24);assert.equal((await st()).LV.crates,before.LV.crates);await shot('refresh-paused');await key('Enter');
 // Jump buffering/variable height and a belly flop land through a stack using actual buttons.
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.warp(13)});await p.keyboard.down('z');await frames(18);await p.keyboard.up('z');const apex=(await st()).P.y;assert(apex>1.1);await key('v');await frames(28);assert.equal((await st()).P.slam,0);assert((await st()).LV.crates>=2);await shot('belly-flop-stack');
 // Bounce and iron springs use the actual landing response and held jump height.
 await p.evaluate(()=>{__runDbg.level(0);const c=__runDbg.WD.crates.find(c=>c.k==='b');__runDbg.warp(c.r);Object.assign(__runDbg.P,{x:c.x,y:2.1,vy:-1,ground:false})});await p.keyboard.down('z');await frames(90);await shot('bounce-crate');await frames(360);await p.keyboard.up('z');assert(await p.evaluate(()=>__runDbg.WD.crates.filter(c=>c.k==='b').every(c=>!c.alive)),'Five bounces empty the wooden spring crate');
 await p.evaluate(()=>{__runDbg.level(0);const c=__runDbg.WD.crates.find(c=>c.k==='s');__runDbg.warp(c.r);Object.assign(__runDbg.P,{x:c.x,y:2.1,vy:-1,ground:false})});await p.keyboard.down('z');await frames(35);await p.keyboard.up('z');assert((await st()).P.y>3.2);await shot('iron-spring');
 // An immediate spin wins an exact-frame contact, instead of reading yesterday's attack state.
 await p.evaluate(()=>{__runDbg.level(0);const f=__runDbg.WD.foes.find(f=>f.k==='h');__runDbg.warp(f.r);__runDbg.P.x=f.x});await key('x');assert(await p.evaluate(()=>__runDbg.WD.foes.find(f=>f.k==='h').alive===false));assert.equal((await st()).LV.deaths,0);await shot('spin-enemy');
 // A fuse pauses and restores exactly; its explosion clock is simulation time.
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.warp(39);__runDbg.P.y=2.1;__runDbg.P.vy=-1;__runDbg.P.ground=false});await frames(20);
 assert(await p.evaluate(()=>__runDbg.WD.crates.some(c=>c.k==='t'&&c.fuse>0)),'Jump arms the BOOM fuse');await shot('boom-countdown');await key('Enter');
 const fuse=await p.evaluate(()=>__runDbg.WD.crates.find(c=>c.k==='t'&&c.fuse>0).fuse);await frames(180);assert.equal(await p.evaluate(()=>__runDbg.WD.crates.find(c=>c.k==='t'&&c.fuse>0).fuse),fuse);
 await p.evaluate(()=>__runDbg.save());await reloadNative();assert.equal(await p.evaluate(()=>__runDbg.WD.crates.find(c=>c.k==='t'&&c.fuse>0).fuse),fuse);await key('Enter');await frames(190);await shot('boom-explosion');
 // The end switch disarms every green crate, so every crate gem is attainable.
 await p.evaluate(()=>{__runDbg.level(2);const c=__runDbg.WD.crates.find(c=>c.k==='switch');__runDbg.warp(c.r)});assert(await p.evaluate(()=>__runDbg.WD.crates.filter(c=>c.k==='z'&&c.alive).length>0));await key('x');assert(await p.evaluate(()=>__runDbg.WD.crates.filter(c=>c.k==='z').every(c=>!c.alive)));await shot('zap-switch');
 // Bonus: no wallet inflation on an abandoned attempt. V is contextual at a real pad.
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.warp(19,-1.65)});const wallet=(await st()).SV.mangoes;await key('v');assert((await st()).LV.parent);await shot('bonus-start');
 await key('Enter');await key('ArrowDown');await key('z');assert((await st()).LV.parent,'Retry challenge must retain parent state');assert.equal((await st()).LV.li,20);await shot('bonus-retry');
 await hold('ArrowRight',36);await key('x');await p.evaluate(()=>{__runDbg.P.ground=true});await key('v');assert.equal((await st()).LV.li,0);assert.equal((await st()).SV.mangoes,wallet);
 // Death route blocks a used attempt; a clean attempt earns the red gem through its exit.
 await p.evaluate(()=>{__runDbg.level(2);__runDbg.LV.deaths=1;__runDbg.warp(28,-1.65)});await key('v');assert(!(await st()).LV.parent);await shot('death-route-locked');
 await p.evaluate(()=>{__runDbg.LV.deaths=0});await key('v');assert((await st()).LV.parent);await shot('death-route');
 await p.evaluate(()=>__runDbg.warp(__runDbg.WD.goal));await frames(2);assert((await st()).SV.colours.red);assert.equal((await st()).LV.li,2);await shot('red-gem');
 await p.evaluate(()=>{__runDbg.level(5);__runDbg.warp(38,1.65)});await key('v');assert((await st()).LV.parent);await shot('red-gem-path');
 await p.evaluate(()=>__runDbg.warp(__runDbg.WD.goal));await frames(2);assert((await st()).SV.colours.blue);await shot('blue-gem');
 for(const ri of [3,4,5,6,7,8]){const rt=await p.evaluate(ri=>__runDbg.routes[ri],ri);await p.evaluate(rt=>{__runDbg.level(rt.parent);__runDbg.warp(rt.row,rt.lane*1.65)},rt);await key('v');assert((await st()).LV.parent,'Route '+ri+' opens after its prerequisite');await shot('route-'+ri+'-start');let reward;if(ri===6){reward=await p.evaluate(()=>__runDbg.SV.lives*100+__runDbg.SV.mangoes);for(const [r,lane]of [[1,0],[9,-1],[11,0]]){await p.evaluate(({r,lane})=>__runDbg.warp(r,lane),{r,lane});await key('x');await frames(40);}reward={before:reward,fruit:await p.evaluate(()=>__runDbg.LV.fruit)};}assert(await p.evaluate(()=>JSON.stringify({...__runDbg.SV,run:__runDbg.capture()}).length<20000),'Nested branch save must roam');await p.evaluate(()=>__runDbg.warp(__runDbg.WD.goal));await frames(2);assert.equal((await st()).LV.li,rt.parent);if(rt.colour)assert((await st()).SV.colours[rt.colour]);if(reward){const s=(await st()).SV;assert.equal(s.lives*100+s.mangoes-reward.before,100+reward.fruit,'Completed colour paths keep their fruit and extra life');assert((await st()).LV.mask>=1,'Completed route keeps its earned mask');}}
 await allCrateGem();
 // Foreground culling is reversible and never removes a missed pickup from gameplay.
 await p.evaluate(()=>{__runDbg.level(4);const f=__runDbg.WD.fruit.find(f=>f.y>3);__runDbg.warp(Math.round(-f.z/2)+3)});await frames(1);assert(await p.evaluate(()=>__runDbg.WD.fruit.find(f=>f.y>3).nearHidden));await shot('camera-passed-fruit');
 await p.evaluate(()=>{const f=__runDbg.WD.fruit.find(f=>f.y>3);__runDbg.warp(Math.round(-f.z/2)-1)});await frames(1);assert(await p.evaluate(()=>!__runDbg.WD.fruit.find(f=>f.y>3).nearHidden));await shot('camera-backtracked-fruit');
 // Secret entrances sit on clear shore tiles, with a solid top matching the visible pad.
 assert(await p.evaluate(()=>__runDbg.routes.every(r=>__runDbg.levels[r.parent].rows[r.row][r.lane<0?0:4]==='.')),'Every entrance needs a clear standing surface');
 for(const ri of [3,5]){await p.evaluate(ri=>{const r=__runDbg.routes[ri];__runDbg.level(r.parent);__runDbg.warp(r.row,r.lane*1.65);__runDbg.P.x+=2},ri);await hold('ArrowLeft',28);assert(await p.evaluate(()=>__runDbg.P.ground&&Math.abs(__runDbg.P.y-.24)<.01),'Walk onto the solid route pad');await key('v');assert(await p.evaluate(()=>!!__runDbg.LV.parent));await shot('route-'+ri+'-walk-entry');await p.evaluate(()=>__runDbg.warp(__runDbg.WD.goal));await frames(2);}
 // Clock crates are real pickups; trial timer freezes, no lives are spent.
 await p.evaluate(()=>{__runDbg.level(0,true);__runDbg.warp(11)});await key('x');assert((await st()).LV.freeze>1.8);await shot('time-freeze');
 const lives=(await st()).SV.lives;await p.evaluate(()=>{__runDbg.warp(55);__runDbg.P.y=-7});await frames(120);assert.equal((await st()).SV.lives,lives);
 await p.evaluate(()=>{__runDbg.warp(__runDbg.WD.goal)});await frames(2);assert.equal((await st()).mode,'tally');assert((await st()).SV.relic.L0);await frames(120);await shot('relic-results');await key('Enter');assert.equal((await st()).mode,'hub');
 // Chapter and boss gates: fresh stages start open together; a room lift requires its boss.
 await p.evaluate(()=>__runDbg.hub(0));await key('e');assert.equal((await st()).SV.room,0);await shot('lift-locked');
 // Bounded progression checks place at exits; no content or wallet is overwritten.
 for(const room of await p.evaluate(()=>__runDbg.rooms)){
   for(const i of room.levels){await p.evaluate(i=>{__runDbg.level(i);__runDbg.warp(__runDbg.WD.goal)},i);await frames(2);assert((await st()).SV.done['L'+i]);await frames(120);await shot('level-'+i+'-results');await key('Enter');assert.equal((await st()).mode,'hub');}
   await p.evaluate(bi=>__runDbg.boss(bi),room.boss);await frames(60);await shot('boss-'+room.boss+'-action');
   if(room.boss===3){for(const st of ['aim','beam','kneel']){await p.evaluate(st=>{const b=__runDbg.WD.boss;b.st=st;b.t=0;b.bt=st==='beam'?1:0;},st);await frames(st==='beam'?20:40);await shot('boss-3-'+st)}await p.evaluate(()=>{const b=__runDbg.WD.boss;b.st='beam';b.t=0;b.bt=2;});await frames(10);await p.evaluate(()=>__runDbg.save());const ba=await p.evaluate(()=>__runDbg.WD.boss.ba);await reloadNative();assert.equal(await p.evaluate(()=>__runDbg.WD.boss.st),'beam');assert(Math.abs(await p.evaluate(()=>__runDbg.WD.boss.ba)-ba)<.2,'Laser sweep angle survives a refresh');await shot('refresh-boss-3-beam');await key('Enter');await key('Enter');}
   if(room.boss===2){await frames(120);assert(await p.evaluate(()=>__runDbg.WD.waves.length>0));await shot('boss-wave');await key('Enter');await p.evaluate(()=>__runDbg.save());const hp=await p.evaluate(()=>__runDbg.WD.hp);await reloadNative();assert.equal(await p.evaluate(()=>__runDbg.WD.hp),hp);assert(await p.evaluate(()=>__runDbg.WD.waves.length>0));await shot('refresh-boss-wave');await key('Enter');}
   await p.evaluate(()=>__runDbg.win());await frames(120);await shot('boss-'+room.boss+'-results');await key('Enter');
   if(room.boss===3){assert.equal((await st()).mode,'credits');await frames(240);await shot('credits');await key('Enter');assert.equal((await st()).mode,'hub','Credits allow post-ending collection');}else{assert.equal((await st()).mode,'hub');const from=(await st()).SV.room;await key('e');assert.equal((await st()).SV.room,from+1);await shot('room-'+(await st()).SV.room);}
 }
 // Exact restore while airborne: finite pose and velocity, no reset to the hub.
 await p.evaluate(()=>{__runDbg.level(5);__runDbg.warp(10)});await p.keyboard.down('z');await frames(12);await p.keyboard.up('z');await p.evaluate(()=>__runDbg.save());const jump=await st();await reloadNative();const resumed=await st();assert.equal(resumed.mode,'level');assert.equal(resumed.LV.li,5);assert(Math.abs(resumed.P.y-jump.P.y)<.2);await shot('refresh-airborne');
 // Native aspect survives portrait/landscape resize; there are no hidden controls to trap the player.
 for(const [width,height]of [[1024,768],[1920,1080],[390,844],[844,390],[1366,860]]){await p.setViewportSize({width,height});await shot('size-'+width+'x'+height);assert.equal(await p.evaluate(()=>review.K.cv.width),320)}
 console.log('CAMPAIGN FLOWS PASS: menus, masks, crates, checkpoints, slam, fuses, branch gating/rewards, relics, all chapter results, refresh and resize');
}
async function allCrateGem(){
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.warp(19,-1.65)});await key('v');assert(await p.evaluate(()=>!!__runDbg.LV.parent));
 async function clearSafeCrates(){
  const crates=await p.evaluate(()=>__runDbg.WD.crates.map((c,i)=>({i,k:c.k})).filter(c=>!['n','s','z','t'].includes(c.k)));
  for(const {i}of crates){await p.evaluate(i=>{const d=__runDbg,c=d.WD.crates[i];d.warp(c.r);Object.assign(d.P,{x:c.x,y:c.y,z:c.z+.4,ground:c.y===0})},i);await key('x');await frames(40);}
 }
 await clearSafeCrates();assert(await p.evaluate(()=>__runDbg.LV.crates===__runDbg.WD.total),'Bonus crates all smashed with real spin inputs');await p.evaluate(()=>__runDbg.warp(__runDbg.WD.goal));await frames(2);assert.equal(await p.evaluate(()=>__runDbg.LV.bonus),1);
 await clearSafeCrates();
 const explosives=await p.evaluate(()=>__runDbg.WD.crates.map((c,i)=>({i,k:c.k})).filter(c=>c.k==='t'));
 for(const {i}of explosives){if(!await p.evaluate(i=>__runDbg.WD.crates[i].alive,i))continue;await p.evaluate(i=>{const d=__runDbg,c=d.WD.crates[i];d.warp(c.r);Object.assign(d.P,{x:c.x,y:c.y+1.8,z:c.z,vy:-2,ground:false})},i);await frames(16);await p.evaluate(()=>__runDbg.warp(0));await frames(190);}
 assert(await p.evaluate(()=>__runDbg.LV.crates===__runDbg.WD.total),'All-crate count includes bonus, countdown and remote green-crate destruction');await p.evaluate(()=>__runDbg.warp(__runDbg.WD.goal));await frames(2);assert(await p.evaluate(()=>__runDbg.SV.gems.L0));await frames(120);await shot('all-crates-gem');
}
async function reloadNative(){
 const base=new URL(p.url()).origin;await p.reload();await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});
 for(const src of ['/vendor/three.min.js','/js/cast.js','/js/rm-tv.js','/js/rm-3d.js','/js/rm-g-run.js'])await p.addScriptTag({url:base+src});await p.evaluate(installRunner);await frames(1);
}

async function touchPlay(){
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{__runDbg.level(0);RoomTV.lockIn(true)});await waitGame(()=>!document.querySelector('.ww-controller').hidden);
 const cdp=await p.context().newCDPSession(p),pos=async selector=>{const b=await p.locator(selector).boundingBox();assert(b,'Missing touch control '+selector);return{x:b.x+b.width/2,y:b.y+b.height/2}};
 let points=[];const send=async(type,pts)=>{points=pts;await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(({id,x,y})=>({id,x,y,radiusX:5,radiusY:5,force:1}))})};
 const stick=await pos('.ww-stick'),jump=await pos('.ww-jump'),spin=await pos('.ww-spin'),flop=await pos('.ww-flop'),start=await pos('.ww-start');
 // Two fingers: left thumb walks while the right thumb performs a held jump.
 const left={id:1,x:stick.x,y:stick.y-33};await send('touchStart',[left]);await waitGame(()=>__runDbg.P.z < -1);
 await send('touchStart',[left,{id:2,...jump}]);await waitGame(()=>__runDbg.P.y>.6);await p.screenshot({path:shots+'touch-walk-jump.png'});await send('touchEnd',[left]);await send('touchEnd',[]);
 await waitGame(()=>__runDbg.P.ground);await send('touchStart',[{id:2,...spin}]);await waitGame(()=>__runDbg.P.spin>0);await send('touchEnd',[]);
 await send('touchStart',[{id:2,...jump}]);await waitGame(()=>__runDbg.P.y>1);await send('touchStart',[{id:2,...jump},{id:3,...flop}]);await waitGame(()=>__runDbg.P.slam>0);await p.screenshot({path:shots+'touch-belly-flop.png'});await send('touchEnd',[]);await waitGame(()=>__runDbg.P.ground);
 await send('touchStart',[{id:4,...start}]);await waitGame(()=>__runDbg.paused);await send('touchEnd',[]);assert.equal(await p.locator('.ww-jump').textContent(),'SELECT');await p.screenshot({path:shots+'touch-portrait-paused.png'});
 await send('touchStart',[{id:4,...start}]);await waitGame(()=>!__runDbg.paused);await send('touchEnd',[]);
 await send('touchStart',[left]);await send('touchCancel',[]);assert.deepEqual(await p.evaluate(()=>RoomTV.dbg().stick()),{x:0,y:0},'Cancelled touch must release the stick');
 await p.setViewportSize({width:844,height:390});await p.screenshot({path:shots+'touch-landscape.png'});const media=await p.locator('.rm-tvwrap').boundingBox();assert(media.width/media.height>1.32&&media.width/media.height<1.34,'Native 4:3 touch screen');
 await p.locator('.rm-tools .rm-lean').click();await waitGame(()=>House.mode==='walk');await waitGame(()=>document.querySelector('.ww-controller').hidden);await p.screenshot({path:shots+'touch-lean-back.png'});
 await cdp.detach();console.log('TOUCH PASS: multi-finger movement/jump, spin, flop, Start, cancellation, portrait/landscape and lean-back visibility');
}
async function legacySave(){
 await p.evaluate(()=>{const s=__runDbg.SV;for(const k of Object.keys(s))delete s[k];Object.assign(s,{lives:0,mangoes:77,started:1,lastPad:5,back:Date.now(),opt:{music:1,shake:1},room:0,colours:{},routes:{},done:{L0:1,B0:1},gems:{L1:1},relic:{L2:2},best:{L0:8123},bestT:{L0:42.5},top:[{s:8123,m:'PERSONAL RECORD'}]});__runDbg.view('wally',0,3,1.2);__runDbg.save()});
 await reloadNative();assert(await p.evaluate(()=>{const s=__runDbg.SV;return s.lives===0&&s.mangoes===77&&s.done.B0===1&&s.gems.L1===1&&s.relic.L2===2&&s.best.L0===8123&&s.bestT.L0===42.5&&s.lastPad===7&&s.room===1}),'Legacy save fields and a zero-life last attempt must survive');await shot('legacy-save');
 // A refresh during the final death cannot reset the pending game over into four free lives.
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.P.y=-7});await frames(2);assert.equal(await p.evaluate(()=>__runDbg.SV.lives),-1);await p.evaluate(()=>__runDbg.save());await reloadNative();assert.equal(await p.evaluate(()=>__runDbg.SV.lives),-1);await frames(120);assert.equal(await p.evaluate(()=>__runDbg.mode),'tally');assert.equal(await p.evaluate(()=>__runDbg.LV.done),'over');await shot('refresh-final-death');
 await p.evaluate(()=>{const s=__runDbg.SV;for(const k of Object.keys(s))delete s[k];Object.assign(s,{lives:4,mangoes:12,started:1,lastPad:6,back:Date.now(),opt:{music:1,shake:1},done:{B0:1,B1:1},gems:{L4:1},relic:{L3:3},best:{B1:7000},bestT:{},top:[]});__runDbg.view('wally',0,3,1.2);__runDbg.save()});
 await reloadNative();assert(await p.evaluate(()=>{const s=__runDbg.SV;return s.done.B1===1&&s.gems.L4===1&&s.relic.L3===3&&s.best.B1===7000&&s.room===1&&s.lastPad===6&&s.discVersion===3}),'An old ending keeps rewards and resumes at the next playable chapter');await shot('legacy-ending-new-chapter');
 // Disc version 2 saves move challenge-route keys behind the five new castle stages.
 await p.evaluate(()=>{const s=__runDbg.SV;for(const k of Object.keys(s))delete s[k];Object.assign(s,{discVersion:2,lives:4,mangoes:3,started:1,lastPad:2,back:Date.now(),opt:{music:1,shake:1},room:0,colours:{red:1},routes:{15:1,16:1,21:1},done:{L0:1},gems:{},relic:{},best:{},bestT:{},top:[]});__runDbg.view('wally',0,3,1.2);__runDbg.save()});
 await reloadNative();assert(await p.evaluate(()=>{const s=__runDbg.SV;return s.discVersion===3&&s.routes[20]===1&&s.routes[21]===1&&s.routes[26]===1&&!s.routes[15]&&s.colours.red===1}),'Version 2 route keys shift to the new route indices');

}
async function waitGame(fn){for(let i=0;i<300;i++){if(await p.evaluate(fn))return;await p.waitForTimeout(20)}throw Error('Game state timeout '+fn)}
async function roomCheck(base,touch=false){
 const account='Wombat'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 console.log('Room fixture: '+account);const f=await roomFixture(base,{account,password,signup:false,touch,width:touch?390:1366,height:touch?844:860,debug:!!process.env.RUN_DEBUG});browser=f.browser;p=f.page;
 const roomUntil=async(fn,timeout=20000)=>{const end=Date.now()+timeout;while(Date.now()<end){assert.deepEqual(f.errors,[],'Room browser errors');if(await p.evaluate(fn))return;await p.waitForTimeout(80)}throw Error('Room timeout '+fn)};console.log('Room standing');
 if(before)await p.route('**/js/rm-g-run.js*',async r=>r.fulfill({body:baselineSource,contentType:'application/javascript'}));
 const aim=async(eye,target)=>{await f.view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})};
 await playCase(f,'ps.run');
 await roomUntil(()=>RoomTV.open_&&House.focused&&!House.gliding&&window.__runDbg?.mode==='title');assert.equal(await p.evaluate(()=>House.THINGS['media.ps.run'].snap),'console.ps');
 await p.waitForTimeout(300);await p.screenshot({path:shots+(touch?'touch-room-':'')+'in-room.png'});

 console.log('Room title rendered');await p.keyboard.press('t');await p.waitForTimeout(300);await p.screenshot({path:shots+(touch?'touch-room-':'')+'lock-in.png'});
 if(!before){
 await p.evaluate(()=>{__runDbg.level(0);window.runInstance=RoomTV.dbg()});
 await p.keyboard.down('ArrowUp');await roomUntil(()=>RoomTV.dbg().frame>runInstance.frame||__runDbg.P.z < -2);await p.keyboard.up('ArrowUp');assert(await p.evaluate(()=>__runDbg.P.z<-.5));
 await p.keyboard.press('Enter');await roomUntil(()=>__runDbg.paused);const timer=await p.evaluate(()=>__runDbg.LV.t);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>__runDbg.LV.t),timer);await p.screenshot({path:shots+(touch?'touch-room-':'')+'in-room-game-pause.png'});await p.keyboard.press('Enter');
 console.log('Room keyboard/pause passed');
 // Standard gamepad: analogue move, A jump, square spin, triangle flop and Start pause.
 await p.evaluate(()=>{__runDbg.level(0);window.runPad={id:'Standard test controller',index:0,connected:true,mapping:'standard',axes:[0,-.8,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[runPad]});window.dispatchEvent(new Event('gamepadconnected'))});
 await roomUntil(()=>GameInput.mode==='gamepad'&&__runDbg.P.z<-.5);
 await p.evaluate(()=>{runPad.axes[1]=0;runPad.buttons[0]={pressed:true,value:1}});await waitGame(()=>__runDbg.P.y>1);
 await p.evaluate(()=>{runPad.buttons[2]={pressed:true,value:1};runPad.buttons[3]={pressed:true,value:1}});await waitGame(()=>__runDbg.P.spin>0&&__runDbg.P.slam>0);
 await p.evaluate(()=>{runPad.buttons[9]={pressed:true,value:1}});await roomUntil(()=>__runDbg.paused);await p.screenshot({path:shots+(touch?'touch-room-':'')+'gamepad-pause.png'});
 await p.evaluate(()=>{window.runDisconnectFrame=RoomTV.dbg().frame;delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});await waitGame(()=>RoomTV.dbg().frame>runDisconnectFrame+2);await p.keyboard.press('Enter');await roomUntil(()=>!__runDbg.paused);
 console.log('Room gamepad passed');
 // Q and T preserve the running cartridge; the global menu freezes it too.
 await p.keyboard.press('Escape');assert(await p.evaluate(()=>HousePause.open));const t=await p.evaluate(()=>__runDbg.LV.t);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>__runDbg.LV.t),t);await p.screenshot({path:shots+(touch?'touch-room-':'')+'house-pause.png'});await p.keyboard.press('Escape');
 for(const [width,height]of [[1024,768],[1920,1080],[390,844],[844,390],[1366,860]]){await p.setViewportSize({width,height});await p.screenshot({path:shots+(touch?'touch-room-':'')+'room-size-'+width+'x'+height+'.png'});assert(await p.evaluate(()=>RoomTV.dbg()===runInstance));}
 await p.keyboard.press('t');await p.screenshot({path:shots+(touch?'touch-room-':'')+'playing-in-room.png'});assert(await p.evaluate(()=>RoomTV.dbg()===runInstance));
 await p.keyboard.press('q');await roomUntil(()=>House.mode==='walk'&&!House.gliding);await p.screenshot({path:shots+(touch?'touch-room-':'')+'lean-back.png'});await p.evaluate(()=>House.act('ps'));await roomUntil(()=>RoomTV.open_&&House.focused&&!House.gliding);assert(await p.evaluate(()=>RoomTV.dbg()===runInstance));
 await p.evaluate(()=>{__runDbg.level(0);__runDbg.warp(24)});await p.keyboard.press('x');await roomUntil(()=>__runDbg.LV.cp===24);await p.keyboard.press('Enter');await roomUntil(()=>__runDbg.paused);
 const progress=await p.evaluate(()=>{__runDbg.save();return{crates:__runDbg.LV.crates,cp:__runDbg.LV.cp,x:__runDbg.P.x,z:__runDbg.P.z}});
 console.log('Room size/Q/T/checkpoint passed; reloading');await p.reload({waitUntil:'domcontentloaded'});await roomUntil(()=>window.AccountGate?.allowed&&window.House?.live&&window.__runDbg?.paused&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'),60000);
 assert.equal(await p.evaluate(()=>__runDbg.LV.cp),progress.cp);assert.equal(await p.evaluate(()=>__runDbg.LV.crates),progress.crates);assert.equal(await p.evaluate(()=>__runDbg.P.z),progress.z);await p.screenshot({path:shots+(touch?'touch-room-':'')+'refresh-room-paused.png'});
 if(touch)await touchPlay();
 console.log('ROOM FLOWS PASS: native telly/LOCK IN, real keyboard/gamepad, global pause, Q/T, five sizes and paused checkpoint reload');
 }

 assert.deepEqual(f.errors,[]);await browser.close();browser=null;
}
