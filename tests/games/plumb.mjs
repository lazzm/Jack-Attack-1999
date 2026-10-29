// Throwaway localhost only. Real browser keys drive play; debug placement isolates branches.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const base=process.argv.find(x=>/^http:/.test(x));
assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply a throwaway localhost URL');
const before=process.argv.includes('--before'),tag=before?'before':'after';
const dir=fileURLToPath(new URL('../shots/games/plumb/'+tag+'/',import.meta.url));await mkdir(dir,{recursive:true});
const baseline=before?await readFile(process.env.PLUMB_BASELINE||'/tmp/plumb-before/rm-g-plumb.js','utf8').catch(()=>execFileSync('git',['show','HEAD:app/public/js/rm-g-plumb.js'],{encoding:'utf8'})):null;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
let p;const errors=[];
async function setup(restoring=false){
 await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});
 for(const src of ['cast','rm-tv','rm-g-plumb'])await p.addScriptTag({url:base+'/js/'+src+'.js'});
 await p.evaluate(installRunner,restoring);if(!before)assert(await p.evaluate(()=>review.K.g.getImageData(0,0,1,1).data[3]===255),'Cartridge paints before the first animation callback');
}
function installRunner(restoring){
 const cv=document.createElement('canvas');cv.width=256;cv.height=224;cv.id='game';
 Object.assign(cv.style,{position:'fixed',width:'min(92vw,92vh * 256 / 224)',height:'auto',imageRendering:'pixelated',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});document.body.append(cv);
 const held={},pressed={},saved={value:JSON.parse(localStorage.getItem('plumb-review')||'null')},secrets=[];
 let seed=1999;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const K={cv,g:cv.getContext('2d'),font:RoomTV.font,W:256,H:224,t:0,frame:0,restoring,best:0,label:b=>({a:'A',b:'B',y:'Y',x:'X',start:'START'}[b]||b.toUpperCase()),keyLabel:b=>({a:'Z',b:'X',y:'V',x:'C',start:'ENTER',select:'SHIFT'}[b]||b.toUpperCase()),
 load:()=>structuredClone(saved.value),save:s=>{saved.value=structuredClone(s);localStorage.setItem('plumb-review',JSON.stringify(s));return true},music(s){K.song=s},over(){},resume(){K.restoring=false},secret:id=>secrets.push(id),held:b=>!!held[b],pressed:b=>!!pressed[b],sfx:{tone(){},seq(){},noise(){}}};
 const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',v:'y',c:'x',Enter:'start',Shift:'select'};
 addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
 window.review={K,saved,secrets,game:RoomTV.defs['sn.plumb'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.t+=1/60;K.frame++;for(const k in pressed)delete pressed[k]}this.game.draw()},restart(restoring=true){this.game.end();K.restoring=restoring;this.game=RoomTV.defs['sn.plumb'].make(K);this.step(1)}};
}
const frames=n=>p.evaluate(n=>review.step(n),n);
const key=async k=>{await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)};
const hold=async(k,n)=>{await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)};
const state=()=>p.evaluate(()=>review.K.dbg.st());
const shot=async name=>{await frames(1);await p.screenshot({path:dir+name+'.png'});const data=await p.evaluate(()=>review.K.cv.toDataURL());await writeFile(dir+name+'-native.png',Buffer.from(data.split(',')[1],'base64'))};
const warp=async(n,x,y)=>{await p.evaluate(({n,x,y})=>review.K.dbg.warp(n,x,y),{n,x,y});await frames(2)};
try{
 if(!process.argv.includes('--room-only')){
 p=await browser.newPage({viewport:{width:1366,height:860}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await p.route('**/__plumb-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="background:#101828">'}));
 if(before)await p.route('**/js/rm-g-plumb.js*',r=>r.fulfill({body:baseline,contentType:'application/javascript'}));
 await p.goto(base+'/__plumb-review');await setup();if(process.argv.includes('--perf')){await performanceSample();}else if(process.argv.includes('--routes')){await routeCheck();console.log('ROUTES PASS');process.exitCode=0;}else{await frames(60);await shot('title');await frames(600);await shot('attract');
 await key('Enter');await shot('files');await key('x');await shot('name');await key('x');
 for(let i=0;i<3;i++){await frames(45);await shot('story-'+i);await key('x')}assert.equal((await state()).mode,'map');await shot('map');
 await hold('ArrowRight',60);await frames(40);await key('x');await shot('level-enter');await frames(110);assert.equal((await state()).LN,1);await shot('start-1');
 const x=(await state()).x;await hold('ArrowRight',45);assert((await state()).x>x+30);await hold('x',25);assert((await state()).y<306,'Jump responds');
 for(let i=0;i<4;i++){await frames(7);await shot('jump-'+i)}
 await warp(1,16,19);await hold('ArrowRight',12);await hold('x',15);await frames(35);await shot('blocks');
 await warp(1,22,16);await hold('ArrowRight',20);await frames(60);await shot('collision');
 for(let n=1;n<=6;n++){await warp(n);await shot('start-'+n);const L=await p.evaluate(()=>review.K.dbg.L());await warp(n,Math.floor(L.w*.55),L.h-9);await shot('middle-'+n)}
 await warp(1,8,19);await frames(10);await key('Enter');assert((await state()).paused);const pause=await state();await frames(120);assert.equal((await state()).x,pause.x);assert.equal((await state()).time,pause.time);await shot('pause');await key('Enter');
 if(!before)await expanded();
 await performanceSample();assert.deepEqual(errors,[]);console.log('NATIVE '+tag+' PASS');}
 }
 if(!process.argv.includes('--native'))await roomCheck();
}catch(e){if(p&&!p.isClosed()){console.log('FAIL STATE',await state().catch(()=>null));await shot('failure').catch(()=>{})}throw e}finally{await browser.close()}
async function expanded(){
 await routeCheck();await p.evaluate(()=>review.K.dbg.setLives(5));
 // Every authored course has five biscuits, legal bounds, and a reachable exit object/door/boss.
 const catalogue=[];let largest=null,largestBytes=0;
 for(let n=1;n<=24;n++){
  await warp(n);const l=await p.evaluate(()=>{const L=review.K.dbg.L();return{name:L.name,w:L.w,h:L.h,bs:L.objs.filter(o=>o.k==='gbisc').length,bad:L.objs.filter(o=>o.x<0||o.x>=L.w||o.y<0||o.y>=L.h),exit:!!L.boss||L.doors.some(d=>d.exit)||L.objs.some(o=>['goal','plunger'].includes(o.k))}});
  assert.equal(l.bs,5,'Five biscuits: '+n);assert.deepEqual(l.bad,[],'Objects within bounds: '+n);assert(l.exit,'Exit: '+n);catalogue.push(l);
  if(n>6){await shot('start-'+n);await warp(n,Math.floor(l.w*.53),l.h-9);await shot('middle-'+n)}
  await p.evaluate(()=>review.K.dbg.save());const saved=await p.evaluate(()=>review.saved.value);const bytes=JSON.stringify(saved).length;assert(bytes<20000,'Save fits roaming limit: '+n);l.saveBytes=bytes;if(bytes>largestBytes){largestBytes=bytes;largest=saved.files[0];}
 }
 const triple=JSON.stringify({v:1,active:0,files:[largest,largest,largest],hi:[{n:'JAK',s:99999}]}).length;assert(triple<20000,'Three full suspended files fit roaming: '+triple);console.log('SAVE BYTES single',largestBytes,'three',triple);
 const stranded=await p.evaluate(()=>{
  const {nodes,edges}=review.K.dbg,bad=[];
  for(let i=0;i<nodes.length;i++){
   const outgoing=edges.filter(e=>e.a===i||e.b===i),picked=new Set();
   for(const[dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){let best=null,score=.45;for(const e of outgoing){const f=e.a===i,p=e.pts[f?0:e.pts.length-1],q=e.pts[f?1:e.pts.length-2],vx=q[0]-p[0],vy=q[1]-p[1],dot=(vx*dx+vy*dy)/Math.hypot(vx,vy);if(dot>score){best=e;score=dot}}if(best)picked.add(best)}
   for(const e of outgoing)if(!picked.has(e))bad.push([i,e.a===i?e.b:e.a]);
  }return bad;
 });assert.deepEqual(stranded,[],'Every fully unlocked map route has a selectable direction in both directions');
 await writeFile(dir+'catalogue.json' ,JSON.stringify(catalogue,null,2));
 // Restore a live moving platform, player pose, tile mutation, biscuit and item references.
 await warp(3,17,19);await frames(30);await key('Enter');await p.evaluate(()=>review.K.dbg.save());const suspended=await p.evaluate(()=>review.K.dbg.snapshot());
 await p.evaluate(()=>review.restart(true));assert((await state()).paused);assert.equal(await p.evaluate(()=>review.K.song),null,'Pause restores silent music');const restored=await p.evaluate(()=>review.K.dbg.snapshot());assert.deepEqual(restored.p,suspended.p);assert.deepEqual(restored.pl,suspended.pl);await shot('suspend-restored');await key('Enter');
 await warp(1,14,18);await frames(20);await hold('x',24);await frames(50);assert.equal(await p.evaluate(()=>review.K.dbg.tile(14,16)),4,'Question block consumed');
 await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal(await p.evaluate(()=>review.K.dbg.tile(14,16)),4,'Block remains consumed');
 // The midway actually grows Plumbo and returns him to that gate after a death.
 await warp(1,101,17);await frames(25);assert.equal((await state()).midLv,1);assert.equal((await state()).power,'B');await shot('midway');
 await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal((await state()).midLv,1);await p.evaluate(()=>review.K.dbg.kill());await frames(285);assert.equal((await state()).lives,4);assert((await state()).x>1600);await shot('midway-respawn');
 // Tea cake, reserve item, sherbet, cape flight, companion hatching/mount/gulp.
 await warp(1,19,19);await p.evaluate(()=>review.K.dbg.give('B'));await hold('x',24);await frames(80);await shot('power-sprout');
 await warp(1,50,18);await frames(20);await hold('x',23);await frames(75);await shot('companion-hatched');
 const dino=await p.evaluate(()=>{const e=review.K.dbg.E().find(e=>e.k==='dino'&&!e.rm);return e&&{x:e.x,y:e.y}});
 assert(dino,'Egg hatches');await p.evaluate(d=>Object.assign(review.K.dbg.P,{x:d.x+4,y:d.y-30,vy:1,on:false}),dino);await frames(16);assert((await state()).ride);await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert((await state()).ride,'Ridden companion reference restored');await key('v');await shot('companion-gulp');await key('z');assert(!(await state()).ride,'Spin dismount');
 await warp(22,21,28);await p.evaluate(()=>review.K.dbg.give('C'));await frames(10);await p.keyboard.down('v');await p.keyboard.down('ArrowRight');await frames(85);assert((await state()).pm>=56);await p.keyboard.down('x');await frames(20);assert(await p.evaluate(()=>review.K.dbg.P.fly>0));await shot('cape-flight');await p.keyboard.up('x');await p.keyboard.up('v');await p.keyboard.up('ArrowRight');await frames(1);
 // Collect two real sherbet daisies, preserve the reserve, drop it with Select and fire.
 for(let i=0;i<2;i++){
  await warp(1,21,19);await p.evaluate(()=>{review.K.dbg.god=true;review.K.dbg.give('B')});if(i===1)await p.evaluate(()=>review.K.dbg.give('F'));await frames(15);await hold('x',24);await frames(60);
  const daisy=await p.evaluate(()=>review.K.dbg.E().find(e=>e.k==='daisy'&&!e.rm));assert(daisy,'Daisy sprouts from a big-power block');await p.evaluate(e=>Object.assign(review.K.dbg.P,{x:e.x,y:e.y,vy:0,on:false}),daisy);await frames(2);
 }
 assert.equal((await state()).power,'F');assert.equal((await state()).reserve,'daisy');await shot('reserve-filled');await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal((await state()).reserve,'daisy');await key('Shift');assert.equal((await state()).reserve,'');assert(await p.evaluate(()=>review.K.dbg.E().some(e=>e.k==='daisy'&&e.st==='drop'&&!e.rm)));await shot('reserve-drop');await frames(100);await key('v');assert(await p.evaluate(()=>review.K.dbg.E().some(e=>e.k==='ball'&&!e.rm)));await shot('sherbet-projectile');
 // Repeated draw calls leave the entire simulation snapshot unchanged.
 const pure=await p.evaluate(()=>JSON.stringify(review.K.dbg.snapshot()));await p.evaluate(()=>{for(let i=0;i<20;i++)review.game.draw()});assert.equal(await p.evaluate(()=>JSON.stringify(review.K.dbg.snapshot())),pure,'Draw never advances gameplay');
 // Five large biscuits award one life, stay consumed through refresh, and record a five-biscuit clear.
 await warp(7);await p.evaluate(()=>{review.K.dbg.god=true;review.K.dbg.give('S')});const biscuitLives=(await state()).lives;
 const biscuits=await p.evaluate(()=>review.K.dbg.E().filter(e=>e.k==='gbisc').map(e=>({x:e.x,y:e.y})));
 for(const e of biscuits){await p.evaluate(e=>Object.assign(review.K.dbg.P,{x:e.x,y:e.y,vy:0,on:false}),e);await frames(2)}
 assert.equal((await state()).gb,31);assert.equal((await state()).lives,biscuitLives+1);await shot('all-five-biscuits');await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal((await state()).gb,31);assert.equal(await p.evaluate(()=>review.K.dbg.E().filter(e=>e.k==='gbisc'&&!e.rm).length),0);
 await p.evaluate(()=>Object.assign(review.K.dbg.P,{x:69*16,y:21*16,vy:0,on:false}));await frames(40);assert.equal((await state()).clear,'switch');await frames(400);assert.equal(await p.evaluate(()=>review.K.dbg.SV().files[0].gb[7]),5);
 // Enemy behaviour: sheets freeze when watched, crushers commit to the floor, swimming responds.
 await warp(4,22,17);await p.evaluate(()=>review.K.dbg.god=true);await frames(20);const shy=await p.evaluate(()=>{const e=review.K.dbg.E().find(e=>e.k==='sheet');return{x:e.x,shy:e.shy}});assert(shy.shy);await shot('ghost-watched');await hold('ArrowLeft',4);await frames(60);assert(await p.evaluate(x=>{const e=review.K.dbg.E().find(e=>e.k==='sheet');return !e.shy&&e.x<x-5},shy.x));await shot('ghost-chasing');
 await warp(6,34,17);await p.evaluate(()=>review.K.dbg.god=true);await frames(55);assert(await p.evaluate(()=>{const e=review.K.dbg.E().find(e=>e.k==='crush');return ['land','rise'].includes(e.st)&&Math.abs(e.y+e.h-320)<2}));await shot('crusher-landed');
 await warp(5,84,15);await p.evaluate(()=>review.K.dbg.god=true);await frames(3);assert(await p.evaluate(()=>review.K.dbg.P.swim));await key('x');assert((await state()).vy<0);for(let i=0;i<4;i++){await frames(5);await shot('swim-'+i)}
 // Four actual plunger collisions persist their block colours and survive restart.
 for(let n=7;n<=10;n++){
  await warp(n,69,n===9?9:21);await frames(32);assert.equal((await state()).clear,'switch','Plunger '+n);await shot('switch-'+n);await frames(400);assert.equal((await state()).sw[n-7],1);await shot('switch-map-'+n);await p.evaluate(()=>review.restart(true));assert.equal((await state()).sw[n-7],1);
 }
 await warp(1,35,18);await frames(30);assert((await state()).on,'Custard switch bridge is solid');await shot('switch-bridge');
 // Complete an ordinary course through its physical goal tape, not the debug win command.
 await warp(1,199,19);await hold('ArrowRight',60);assert((await state()).clear);await frames(155);await shot('course-clear');await frames(250);assert((await state()).cl['1']);
 // Carry the cave's original key across its actual roof tunnel. This branch uses damage protection;
 // the inputs, key pickup, carried reference and keyhole collision are all production logic.
 await warp(2,111,4);await p.evaluate(()=>review.K.dbg.god=true);await p.keyboard.down('v');await p.keyboard.down('ArrowRight');await frames(20);assert.equal((await state()).carry,'key');await shot('key-carried');
 await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));await frames(1);assert.equal((await state()).carry,'key','Carried entity reference restored');await p.evaluate(()=>review.K.dbg.god=true);
 for(let i=0;i<13;i++){await frames(22);if((await state()).clear)break;}await p.keyboard.up('ArrowRight');await p.keyboard.up('v');assert.equal((await state()).clear,'secret');await shot('keyhole');await frames(400);assert((await state()).cl['2s']);assert(await p.evaluate(()=>review.secrets.includes('lk.plumb.secret')));await shot('secret-route');
 // Original ghost-house key survives a real room door, including refresh mid-transition.
 await warp(4);const ghostKey=await p.evaluate(()=>review.K.dbg.E().find(e=>e.k==='key'));
 await p.evaluate(e=>Object.assign(review.K.dbg.P,{x:e.x,y:e.y,vy:0,on:false}),ghostKey);await p.keyboard.down('v');await frames(2);assert.equal((await state()).carry,'key');
 await p.evaluate(()=>Object.assign(review.K.dbg.P,{x:63*16,y:320-review.K.dbg.P.h,vy:0,on:true}));await key('ArrowUp');await frames(10);assert(await p.evaluate(()=>review.K.dbg.P.door>0));await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));await frames(45);assert((await state()).x>=72*16&& (await state()).x<74*16);assert.equal((await state()).carry,'key');await shot('ghost-door-restored');
 const ghostHole=await p.evaluate(()=>review.K.dbg.E().find(e=>e.k==='keyhole'));await p.evaluate(e=>Object.assign(review.K.dbg.P,{x:e.x-8,y:e.y,vy:0,on:false}),ghostHole);await frames(3);await p.keyboard.up('v');assert.equal((await state()).clear,'secret');await frames(400);assert((await state()).cl['4s']);
 // Berry blocks make the lagoon's high key route traversable.
 await warp(5,153,1);await p.evaluate(()=>Object.assign(review.K.dbg.P,{y:48-review.K.dbg.P.h,vy:0,on:true}));await p.keyboard.down('v');await frames(2);assert.equal((await state()).carry,'key');await hold('ArrowRight',90);await p.keyboard.up('v');assert.equal((await state()).clear,'secret');await shot('lagoon-roof-keyhole');await frames(400);assert((await state()).cl['5s']);
 // Every remaining normal course exit uses the physical posts or door.
 for(const n of [2,3,5,12,13,14,16]){await normalGoal(n);assert((await state()).cl[n]);}
 for(const n of [4,15]){
  await warp(n);const door=await p.evaluate(()=>review.K.dbg.L().doors.find(d=>d.exit));await p.evaluate(d=>Object.assign(review.K.dbg.P,{x:d.x+2,y:d.y+32-review.K.dbg.P.h,vy:0,on:true}),door);await key('ArrowUp');await frames(55);assert((await state()).clear);await frames(400);assert((await state()).cl[n]);
 }
 // Goal stars trigger a fully saved tea-break bonus; matching eight lines pays once.
 await p.evaluate(()=>review.K.dbg.SV().files[0].stars=99);await warp(1);await p.evaluate(()=>{const d=review.K.dbg,e=d.E().find(e=>e.k==='goal'),ty=e.y+128-e.tape;Object.assign(d.P,{x:e.x+20,y:ty-d.P.h+1,vy:0,on:false})});await frames(1);assert((await state()).clear);await frames(410);assert.equal((await state()).mode,'bonus');await shot('tea-break-start');await frames(35);
 const livesBefore=(await state()).lives;
 for(let i=0;i<8;i++){
  for(let j=0;j<25;j++){if(await p.evaluate(()=>{const b=review.K.dbg.st().bonus,order=[0,1,2,5,8,7,6,3],i=order[b.cursor];return(Math.floor((b.t+1)/8)+i*2)%3===b.cells[4]}))break;await frames(1)}
  await key('x');if(i===3){await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal((await state()).bonus.cursor,4);assert.equal(await p.evaluate(()=>review.K.song.bpm),136,'Bonus restores its own music cue');await shot('tea-break-restored');}
 }
 assert.equal((await state()).bonus.lines.length,8);assert.equal((await state()).lives,Math.min(99,livesBefore+8));await shot('tea-break-eight-lines');await p.evaluate(()=>review.restart(true));assert.equal((await state()).lives,Math.min(99,livesBefore+8),'Bonus never pays twice on refresh');await frames(100);await key('x');assert.equal((await state()).mode,'map');
 // Five independent star keyholes use their own exit keys. Branch placement isolates each challenge.
 for(let n=12;n<=16;n++){
  await warp(n);const items=await p.evaluate(()=>{const e=review.K.dbg.E();return{k:e.find(e=>e.k==='key'),h:e.find(e=>e.k==='keyhole')}});
  await p.evaluate(({k})=>Object.assign(review.K.dbg.P,{x:k.x,y:k.y,vy:0,on:false}),items);await p.keyboard.down('v');await frames(2);assert.equal((await state()).carry,'key','Star key '+n);
  await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal((await state()).carry,'key');
  await p.evaluate(({h})=>Object.assign(review.K.dbg.P,{x:h.x-8,y:h.y,vy:0,on:false}),items);await frames(3);await p.keyboard.up('v');assert.equal((await state()).clear,'secret','Star keyhole '+n);await shot('star-keyhole-'+n);await frames(400);assert((await state()).cl[n+'s']);
 }
 const gate=await p.evaluate(()=>{const d=review.K.dbg;return d.edges.find(e=>e.a===16&&e.b===17).need.every(k=>d.SV().files[0].cl[k])});assert(gate,'All five stars open Oddly Zone');await frames(300);await shot('constellation-map');
 // Actual goal crossings in each Special course; preserve route ordering and the autumn reward.
 for(let n=17;n<=24;n++){
  await warp(n);const goal=await p.evaluate(()=>review.K.dbg.E().find(e=>e.k==='goal'));
  if(goal){await p.evaluate(e=>Object.assign(review.K.dbg.P,{x:e.x+5,y:e.y+130,vy:0,on:false}),goal);await hold('ArrowRight',35);}else{await warp(n,152,22);await frames(20);await key('ArrowUp');await frames(55)}
  assert((await state()).clear,'Special exit '+n);await shot('special-finish-'+n);await frames(450);assert((await state()).cl[n]);
 }
 assert((await state()).special);await shot('oddly-medal');await frames(260);await shot('oddly-map');await p.evaluate(()=>review.restart(true));assert((await state()).special,'Medal survives restart');
 // Every boss hit is a real player/enemy collision; reset only the approach pose between attacks.
 for(const[n,doorX,roomX,hits]of [[11,116,126,4],[6,181,190,3]]){
  await warp(n,doorX,18);await p.evaluate(()=>review.K.dbg.god=true);await frames(20);await key('ArrowUp');await frames(210);assert.equal((await state()).boss,hits);await shot('boss-'+n);
  for(let i=0;i<hits;i++){
   const boss=await p.evaluate(()=>review.K.dbg.boss());await p.evaluate(e=>Object.assign(review.K.dbg.P,{x:e.x+12,y:e.y-review.K.dbg.P.h-2,vy:2,on:false,inv:30}),boss);await frames(12);assert.equal((await state()).boss,hits-i-1,'Stomp boss '+n);await shot('boss-hit-'+n+'-'+i);await frames(90);
  }
  await frames(650);assert((await state()).cl[n]);if(n===6){assert.equal((await state()).mode,'ending');await shot('ending-castle');await frames(500);await shot('credits');await p.evaluate(()=>review.K.dbg.save());await p.evaluate(()=>review.restart(true));assert.equal((await state()).mode,'ending');await frames(950);assert.equal((await state()).mode,'map','Credits return to postgame map');assert(await p.evaluate(()=>review.secrets.includes('lk.plumb.castle')));await shot('postgame-autumn');}
 }
 assert.equal(Object.keys((await state()).cl).length,32,'Every exit flag has been earned through its production collision');
 // A full browser reload rehydrates from saved JSON, not the old closure.
 await warp(22,90,20);await frames(10);await key('Enter');await p.evaluate(()=>review.K.dbg.save());const saved=await p.evaluate(()=>review.K.dbg.snapshot());await p.reload();await setup(true);await frames(1);assert((await state()).paused);assert.deepEqual(await p.evaluate(()=>review.K.dbg.snapshot().p),saved.p);await shot('browser-refresh');
 // Legacy files retain names, flags, best biscuits and high scores, with new fields additive.
 await p.evaluate(()=>{review.game.end();const old={v:1,files:[{name:'JACK',cl:{1:1,2:1,'2s':1},gb:{1:5},node:2},null,null],hi:[{n:'DAVE',s:12345}]};review.saved.value=old;review.K.restoring=false;review.game=RoomTV.defs['sn.plumb'].make(review.K);review.K.dbg.file(0)});
 assert.equal((await state()).node,2);assert((await state()).cl['2s']);assert.equal(await p.evaluate(()=>review.K.dbg.SV().hi[0].s),12345);assert.equal(await p.evaluate(()=>review.K.dbg.SV().files[0].gb[1]),5);
 console.log('DEPTH PASS: 24 courses, 32 exits, four switches, five star keys, Special medal, bosses, credits, additive saves');
}
async function roomCheck(){
 const account='Plumb'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,debug:process.argv.includes('--debug')}),page=f.page;
 try{
 if(before)await page.route('**/js/rm-g-plumb.js*',r=>r.fulfill({body:baseline,contentType:'application/javascript'}));
 await page.evaluate(()=>House.goRoom('cupboard',0));await f.until(()=>!House.gliding);
 await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});await playCase(f,'sn.plumb');
 await page.evaluate(()=>RoomTV.test('sn.plumb'));await f.until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding);await page.screenshot({path:dir+'in-room-title.png'});
 if(!before)assert(await page.evaluate(()=>RoomTV._dbg().surface&&HouseRooms.rooms.cupboard.cupScreen.material.map.userData.jackLive),'Game draws on physical telly');
 await page.evaluate(()=>{RoomTV.dbg().dbg.warp(1,4,19);window.plumbInstance=RoomTV.dbg()});await page.waitForTimeout(800);await page.screenshot({path:dir+'in-room-game.png'});
 await page.keyboard.press('t');assert(await page.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg()===plumbInstance));await page.waitForTimeout(300);await page.screenshot({path:dir+'lock-in.png'});
 await page.keyboard.press('Escape');await f.until(()=>HousePause.open);await page.screenshot({path:dir+'house-pause.png'});const frame=await page.evaluate(()=>RoomTV.dbg().frame);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>RoomTV.dbg().frame),frame);await page.keyboard.press('Escape');await f.until(()=>!HousePause.open);
 for(const[width,height,name]of [[390,844,'portrait'],[844,390,'landscape'],[1024,768,'tablet'],[1366,860,'desktop']]){await page.setViewportSize({width,height});await page.waitForTimeout(200);await page.screenshot({path:dir+name+'.png'})}

 if(!before){
  await page.evaluate(()=>{RoomTV.dbg().dbg.warp(1,4,19);window.plumbX=RoomTV.dbg().dbg.P.x;window.plumbPad={id:'Standard review pad',index:0,connected:true,mapping:'standard',axes:[1,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[plumbPad]});window.dispatchEvent(new Event('gamepadconnected'))});
  await f.until(()=>GameInput.mode==='gamepad'&&RoomTV.dbg().dbg.P.x>plumbX+20);await page.evaluate(()=>{plumbPad.axes[0]=0;plumbPad.buttons[0]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.P.vy<0);await page.screenshot({path:dir+'gamepad-jump.png'});
  await page.evaluate(()=>{plumbPad.buttons[0]={pressed:false,value:0};plumbPad.buttons[9]={pressed:true,value:1}});await f.until(()=>RoomTV.dbg().dbg.st().paused);await page.screenshot({path:dir+'gamepad-pause.png'});await page.evaluate(()=>{plumbPad.buttons[9]={pressed:false,value:0};plumbPad.connected=false;delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});
  await page.evaluate(()=>RoomTV.dbg().dbg.save());const pose=await page.evaluate(()=>RoomTV.dbg().dbg.snapshot().p);
  await page.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.AccountGate?.allowed&&window.RoomTV?._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
  assert(await page.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg().dbg.st().paused));assert.deepEqual(await page.evaluate(()=>RoomTV.dbg().dbg.snapshot().p),pose);await page.screenshot({path:dir+'room-refresh-paused.png'});
  await page.keyboard.press('Enter');await f.until(()=>!RoomTV.dbg().dbg.st().paused);await page.evaluate(()=>window.plumbInstance=RoomTV.dbg());await page.keyboard.press('t');assert(await page.evaluate(()=>!RoomTV.lockIn()&&RoomTV.dbg()===plumbInstance));await page.keyboard.press('q');await f.until(()=>House.mode==='walk'&&!House.gliding);assert(await page.evaluate(()=>RoomTV._dbg().background&&RoomTV.dbg()===plumbInstance));await page.screenshot({path:dir+'lean-back.png'});
  const back=await page.evaluate(()=>({x:House.W.x,z:House.W.z,power:localStorage.getItem('jhp_off')}));await page.reload({waitUntil:'domcontentloaded'});await f.until(()=>window.AccountGate?.allowed&&window.RoomTV?._dbg()?.background&&!!RoomTV.dbg()?.dbg&&!House.gliding&&!document.querySelector('.hs-loading,#houseEntry'));
  assert(await page.evaluate(b=>House.mode==='walk'&&Math.abs(House.W.x-b.x)<1&&Math.abs(House.W.z-b.z)<1&&localStorage.getItem('jhp_off')===b.power,back));await page.screenshot({path:dir+'room-refresh-standing.png'});
  await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk');House.act('snes')});await f.until(()=>RoomTV.open_&&!House.gliding);await page.locator('.rm-eject').click();await f.until(()=>!HouseCases.busy&&!RoomTV.open_);assert.equal(await page.evaluate(()=>House.THINGS['media.sn.plumb'].snap),'media.case.sn.plumb');if(await page.evaluate(()=>!!House.held()))await page.evaluate(()=>House.putBack());await f.until(()=>!House.held());assert.equal(await page.locator('.plumb-controls').count(),0);
  await playCase(f,'sn.fight');await f.until(()=>RoomTV._dbg().st==='game');assert(await page.evaluate(()=>RoomTV._dbg().surface),'Cartridge without a screen hook uses the physical cupboard telly');await page.keyboard.press('Enter');await page.waitForTimeout(250);await page.screenshot({path:dir+'unchanged-cartridge.png'});

 }
 assert.deepEqual(f.errors,[]);console.log('ROOM '+tag+' PASS');
 }finally{await f.browser.close()}
 if(!before)await touchCheck(account,password);
}

async function touchCheck(account,password){
 const f=await roomFixture(base,{account,password,signup:false,width:390,height:844,touch:true}),page=f.page;
 try{
  await page.evaluate(()=>House.goRoom('cupboard',0));await f.until(()=>!House.gliding);await page.evaluate(()=>{House.setWalkFrom({...House.P,lvl:'G',seat:0});House._.setMode('walk')});await playCase(f,'sn.plumb');await page.evaluate(()=>RoomTV.test('sn.plumb'));await f.until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg&&!House.gliding);
  await page.evaluate(()=>RoomTV.dbg().dbg.warp(1,4,19));
  const control=b=>page.locator('[data-plumb="'+b+'"]');
  async function press(b){const r=await control(b).boundingBox();assert(r);await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2)}
  await page.screenshot({path:dir+'touch-in-room.png'});await press('lock');assert(await page.evaluate(()=>RoomTV.lockIn()));await page.waitForTimeout(250);await page.screenshot({path:dir+'touch-portrait.png'});
  for(const[width,height,name]of [[390,844,'portrait'],[844,390,'landscape'],[1024,768,'tablet']]){
   await page.setViewportSize({width,height});await page.waitForTimeout(250);
   const r=await page.locator('.rm-tvv.on .rm-glass').boundingBox();assert(r&&Math.abs(r.width/r.height-256/224)<.01&&r.width<=width+1&&r.height<=height+1,'Native touch picture '+name);
   const b=await control('b').boundingBox();assert(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,'Touch controls fit '+name);
   assert(b.y>=r.y+r.height-1||b.x>=r.x+r.width-1,'Controls stay outside picture '+name);await page.screenshot({path:dir+'touch-'+name+'.png'});
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.evaluate(()=>window.plumbTouchX=RoomTV.dbg().dbg.P.x);const dp=await page.locator('.plumb-dpad').boundingBox();await page.mouse.move(dp.x+dp.width*.85,dp.y+dp.height*.5);await page.mouse.down();await f.until(()=>RoomTV.dbg().dbg.P.x>plumbTouchX+12);await page.mouse.up();
  await press('b');await f.until(()=>RoomTV.dbg().dbg.P.vy<0);await press('start');await f.until(()=>RoomTV.dbg().dbg.st().paused);await page.screenshot({path:dir+'touch-pause.png'});await press('start');await f.until(()=>!RoomTV.dbg().dbg.st().paused);
  await page.evaluate(()=>RoomTV.dbg().dbg.warp(22,21,28));await page.waitForTimeout(250);
  const run=await control('y').boundingBox(),jump=await control('b').boundingBox(),pad=await page.locator('.plumb-dpad').boundingBox();
  const left={id:1,x:pad.x+pad.width*.85,y:pad.y+pad.height*.5},right={id:2,x:run.x+run.width/2,y:run.y+run.height/2},third={id:3,x:jump.x+jump.width/2,y:jump.y+jump.height/2};
  const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});await f.until(()=>RoomTV.dbg().dbg.P.vx>2.2);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right,third]});await f.until(()=>RoomTV.dbg().dbg.P.vy<0);await page.screenshot({path:dir+'touch-run-jump.png'});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  assert.deepEqual(f.errors,[]);console.log('TOUCH PASS: movement, jump, pause, aspect and three layouts');
 }finally{await f.browser.close()}
}

async function routeCheck(){
 for(const n of [1]){
  await warp(n);await frames(15);let jumping=false,lastJump=0,dead=0;
  await p.keyboard.down('v');await p.keyboard.down('ArrowRight');
  for(let i=0;i<2200;i++){
   const s=await p.evaluate(()=>{
    const d=review.K.dbg,P=d.P,E=d.E(),L=d.L(),t=d.tile;
    const solid=(x,y)=>[1,2,3,4,5,8,9,10,11,17,19,21,22,23,24].includes(t(x,y));
    const x=(P.x+P.w+24)>>4,y=(P.y+P.h-2)>>4;
    const obstacle=solid(x,y)||solid(x,(P.y+3)>>4);
    const ahead=P.x+P.w+24,feet=P.y+P.h;
    let floor=false;for(let y=(feet+2)>>4;y<=((feet+38)>>4);y++)if(solid(ahead>>4,y)||t(ahead>>4,y)===6)floor=true;
    const plats=L.plats; // live platforms are represented in the save; no guessed collision boxes.
    const platform=d.snapshot()?.pl?.some(p=>!p.gone&&ahead>=p.x&&ahead<=p.x+p.w&&p.y>=feet-8&&p.y<feet+38);
    const enemy=E.some(e=>!e.rm&&!e.dying&&['conk','crab','prick','tin','cup'].includes(e.k)&&e.x>P.x-4&&e.x<P.x+P.w+38&&Math.abs(e.y+e.h-feet)<30);
    return{...d.st(),coy:P.coy,obstacle,gap:!floor&&!platform,enemy};
   });
   if(s.clear){await shot('walked-course-'+n);await p.keyboard.up('v');await p.keyboard.up('ArrowRight');await p.keyboard.up('x');await frames(450);assert((await state()).cl[n]);console.log('WALKED',n,'frames',i*4,'deaths',dead);break;}
   if(s.dead){dead++;await p.keyboard.up('x');jumping=false;await frames(290);continue;}
   if(i%80===0){console.log('ROUTE',n,i,s.x,s.y,s.on,s.obstacle,s.gap,s.enemy);await shot('walk-sequence-'+n+'-'+i)}
   if(s.mode==='over'||s.mode==='done')throw Error('Route lost all lives');
   if((s.on||s.coy>0)&&i-lastJump>3&&(s.obstacle||s.gap||s.enemy)){if(jumping)await p.keyboard.up('x');await p.keyboard.down('x');jumping=true;lastJump=i;}
   else if(jumping&&s.vy>=0){await p.keyboard.up('x');jumping=false;}
   await frames(4);
   if(i===2199)throw Error('Route stalled '+JSON.stringify(s));
  }
  await p.keyboard.up('v');await p.keyboard.up('ArrowRight');await p.keyboard.up('x');
 }
}

async function performanceSample(){
 const scenes={};
 for(const[n,x,y,name]of [[1,4,19,'meadow'],[5,90,18,'lagoon'],[6,193,18,'castle']]){
  await warp(n,x,y);await p.evaluate(()=>review.K.dbg.god=true);
  scenes[name]=await p.evaluate(()=>{const a=[];for(let i=0;i<100;i++)review.step(1);for(let i=0;i<900;i++){const t=performance.now();review.step(1);a.push(performance.now()-t)}a.sort((a,b)=>a-b);return{median:a[450],p95:a[855],p99:a[891],max:a[899]}});
 }
 await warp(1,4,19);await p.evaluate(()=>review.K.dbg.god=true);
 const raf=await p.evaluate(async()=>{
  const cpu=[],interval=[];let last;
  await new Promise(resolve=>{function frame(t){if(last!==undefined)interval.push(t-last);last=t;const s=performance.now();review.step(1);cpu.push(performance.now()-s);if(cpu.length<240)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});
  const stats=a=>{a.sort((a,b)=>a-b);return{median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],p99:a[Math.floor(a.length*.99)],max:a.at(-1)}};return{cpu:stats(cpu),interval:stats(interval),frames:cpu.length};
 });
 const perf={resolution:[256,224],scenes,raf,scope:'native update/draw CPU and browser frame intervals; software Chromium; excludes house'};
 await writeFile(dir+'performance.json',JSON.stringify(perf,null,2));console.log('PERFORMANCE',JSON.stringify(perf));
}

async function normalGoal(n){
 await warp(n);await p.evaluate(()=>{const d=review.K.dbg,e=d.E().find(e=>e.k==='goal');Object.assign(d.P,{x:e.x-24,y:e.y+144-d.P.h,vy:0,on:true})});await hold('ArrowRight',65);assert((await state()).clear,'Normal goal '+n);await shot('normal-finish-'+n);await frames(430);
}
