// Real cartridge/input review. Only disposable localhost accounts and this child server.
// node tests/games/blocks.mjs [--baseline | --logic]
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),baseline=process.argv.includes('--baseline');
const beforeSource=execFileSync('git',['show','HEAD:app/public/js/rm-g-blocks.js'],{cwd:root,encoding:'utf8'});
const shots=root+'tests/shots/games/blocks/'+(baseline?'before':'after')+'/';
// Fast behavior checks complement the rendered play-through, including every flight preset.
function logicReview(){
const source=readFileSync(root+'app/public/js/rm-g-blocks.js','utf8');
let saved=null,def,pressed={},held={},kit,game;
const noop=()=>{};const names={me:'Player',mate1:'Palone',mate2:'Paltwo',mate3:'Palthree',mate4:'Palfour',sister:'Sister'};
let randomSeed=1999;const engineMath=Object.create(Math);engineMath.random=()=>{randomSeed=(Math.imul(randomSeed,1103515245)+12345)>>>0;return randomSeed/4294967296};
const ctx={Math:engineMath,window:{RoomTV:{game:(id,d)=>def=d},Cast:{me:()=>({name:names.me}),n:id=>names[id]}},document:{addEventListener:noop,removeEventListener:noop},addEventListener:noop,removeEventListener:noop};ctx.Cast=ctx.window.Cast;vm.createContext(ctx);vm.runInContext(source,ctx);
function boot(){kit={W:160,H:144,g:{},pal:['#fff','#aaa','#555','#000'],font:{},t:0,frame:0,load:()=>saved,save:o=>{saved=JSON.parse(JSON.stringify(o))},music:noop,secret:noop,over:noop,pressed:b=>!!pressed[b],held:b=>!!held[b],sfx:{tone:noop,seq:noop,noise:noop},stick:()=>({x:0,y:0})};game=def.make(kit)}
function frames(n=1){while(n--){game.update();kit.frame++;kit.t+=1/60}}
function key(b){pressed[b]=true;frames();pressed={};frames()}
function state(){return ctx.window.__blocksDbg()}
function choose(index){key('start');for(let i=0;i<index;i++)key('down');key('a');key('a');key('a')}
boot();choose(0);assert.equal(state().mode,'play');
state().cheat.setRow();state().cheat.iPiece();state().cheat.lines(6);key('up');assert.equal(state().lines,10);assert.equal(state().level,1);key('start');const exact=JSON.stringify(saved.cart.you);boot();assert(state().paused);assert.equal(JSON.stringify(saved.cart.you),exact);assert.equal(state().clearing.length,4);key('start');frames(40);assert.equal(state().clearing,null);
// Each mode and the CPU board can be serialised and resumed without incrementing game count.
for(const [index,type]of [[0,'A'],[1,'U'],[2,'L'],[3,'B'],[4,'V']]){
 saved=null;boot();choose(index);if(type==='B'||type==='V')key('a');frames(130);key('start');assert.equal(state().gtype,type);const before=JSON.stringify(saved.cart);boot();assert.equal(state().gtype,type);assert(state().paused);assert.equal(state().stat.games,1);assert.equal(JSON.stringify(saved.cart),before);
}
// A first round left alone must top out naturally, finish, and accept Retry.
saved=null;boot();choose(0);let idleFrames=0;
while(state().mode==='play'&&idleFrames<36000){frames();idleFrames++;}
assert(idleFrames<36000,'An idle first round never ends');frames(150);
assert.equal(state().mode,'result');assert.equal(state().score,0);assert.equal(state().lines,0);
assert.equal(state().stat.games,1);frames(70);key('a');assert.equal(state().mode,'play');assert.equal(state().stat.games,2);
console.log('IDLE FIRST ROUND PASS: '+idleFrames+' frames, zero score/lines, native Retry');
// Top-out paths retain a native result, never grant a clear stamp or unlock a CPU win.
for(const index of [0,1,2,3]){saved=null;boot();choose(index);if(index===3)key('a');state().cheat.die();frames(145);assert.equal(state().mode,'result');assert.equal(Object.keys(state().flights).length,0);game.end();boot();assert.equal(state().mode,'result');frames(70);key('b');assert.equal(state().mode,'menu')}
saved=null;boot();choose(4);key('a');frames(130);for(let i=0;i<3;i++){state().cheat.die();frames(i<2?280:350)}assert.equal(state().mode,'result');assert.equal(state().vs.them,3);assert.equal(state().un.hard,0);assert.equal(state().stat.wins,0);
// A battery cycle must preserve future bags as well as the current and next shapes.
saved=null;boot();choose(0);game.end();const streamSave=JSON.parse(JSON.stringify(saved));
function future(){const kinds=[];for(let i=0;i<12;i++){state().cheat.setRow();state().cheat.iPiece();key('up');frames(40);kinds.push(state().cur.k+state().next)}return kinds}
const uninterrupted=future();saved=streamSave;boot();key('start');assert.deepEqual(future(),uninterrupted,'Refresh dealt a different piece stream');
// The original flat battery format remains playable without changing scores or held pieces.
saved={well:Array.from({length:18},()=>Array(10).fill(0)),score:1234,lines:5,level:2,sl:1,cur:{k:'T',r:0,x:3,y:0},next:'I',hold:'O',gt:'A'};
boot();choose(0);assert.equal(state().score,1234);assert.equal(state().lines,5);assert.equal(state().hold,'O');
// Play one whole B-Type flight using the cartridge's CPU placement advice.
saved=null;boot();choose(3);key('a');let drops=0;while(state().mode==='play'&&drops<220){if(!state().cur||state().clearing){frames(24);continue}const hint=state().cheat.hint();for(let i=0;i<hint.r;i++)key('a');for(let i=0;i<12;i++){const c=state().cur;if(!c||c.x===hint.x)break;key(c.x<hint.x?'right':'left')}key('up');drops++;frames(9)}
assert(state().flights['0-0'],'B flight did not clear; drops '+drops+' lines '+state().lines);frames(800);if(state().mode==='entry')key('start');frames(65);assert.equal(state().mode,'result');key('a');assert.equal(state().gtype,'B');assert(state().grid.slice(15).some(row=>row.some(Boolean)));console.log('LOGIC PASS, drops='+drops);
// Every authored level/height combination has a reachable 25-line win and launch.
for(let lv=0;lv<10;lv++)for(let bh=0;bh<6;bh++){
 saved={lv,bh};boot();choose(3);key('a');state().cheat.lines(21);state().cheat.setRow();state().cheat.iPiece();key('up');assert(state().flights[lv+'-'+bh]);frames(140);assert.equal(state().mode,'rocket');assert(state().rocket>=1);frames(700);if(lv===9&&bh===5){assert(state().un.rocket,'Shuttle reward must survive a battery cycle');assert.equal(state().mode,'credits');const t=state().creditT;game.end();boot();assert.equal(state().mode,'credits');assert.equal(state().creditT,t)}
}
console.log('ALL 60 FLIGHTS, LAUNCHES AND FINALE PASS');
// Replaying the staff roll from the flight log must preserve a parked run and return to the log after refresh.
saved={un:{ending:1}};boot();choose(0);key('start');const parked=JSON.stringify(state().cur);key('up');key('a');key('start');for(let i=0;i<6;i++)key('down');key('a');assert.equal(state().mode,'flights');key('select');frames(270);key('start');assert.equal(state().mode,'flights');game.end();boot();assert.equal(state().mode,'flights');key('b');for(let i=0;i<6;i++)key('up');key('a');assert.equal(state().mode,'play');assert(state().paused);assert.equal(JSON.stringify(state().cur),parked);
// Preserve user initials even when the score equals an old factory record.
saved={hi:{A:[{n:'XYZ',s:31250,l:9},{n:'CUSTOM',s:98765,l:8}]}};boot();assert.equal(state().hi.A[0].n,'XYZ');assert.equal(state().hi.A[1].n,'CUSTOM');
// Audio toggles are independent and survive parked-run saves.
saved=null;boot();choose(0);key('start');key('down');key('a');key('down');key('a');key('down');key('down');key('a');key('start');for(let i=0;i<8;i++)key('down');key('a');assert.equal(state().mode,'opts');key('a');assert.equal(state().opt.pal,0);boot();assert.equal(state().opt.pal,0);assert.equal(state().opt.music,0);assert.equal(state().opt.sfx,0);console.log('LEGACY AND OPTIONS PASS');

}
if(process.argv.includes('--logic')){logicReview();process.exit(0)}
let server,browser,data,log='';const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
 if(!baseline)logicReview();
 data=await mkdtemp('/tmp/jhp-blocks-');await mkdir(shots,{recursive:true});
 const port=+(process.env.BLOCKS_PORT||18089);assert(port>=18080&&port<=18099);
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const stream of [server.stdout,server.stderr])stream.on('data',s=>log+=s);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<200&&server.exitCode===null,log);await delay(100)}
 const base='http://127.0.0.1:'+port,account='Block'+Date.now().toString(36),password='Throwaway-1999';
 console.log('SERVER READY '+base);
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 console.log('OPENING ROOM');
 const f=await roomFixture(base,{account,password,signup:false,touch:true,seed:1999,timeoutScale:3,onPage:async p=>{browser=p.context().browser();if(baseline)await p.route('**/js/rm-g-blocks.js*',r=>r.fulfill({contentType:'application/javascript',body:beforeSource}))}}),p=f.page;browser=f.browser;
 console.log('ROOM READY');
 const until=async fn=>{for(let i=0;i<800;i++){assert.deepEqual(f.errors,[]);if(await p.evaluate(fn))return;await delay(100)}throw Error('Timeout '+fn)};
 const frames=async n=>{await p.evaluate(n=>window.blocksFrame=RoomTV.dbg().frame+n,n);await until(()=>RoomTV.dbg().frame>=blocksFrame)};
 const key=async k=>{await p.keyboard.press(k);await frames(3)};
 async function shot(name){await p.screenshot({path:shots+name+'.png'});const png=await p.evaluate(()=>{const k=RoomTV.dbg();k._three?.render();return k.cv.toDataURL().split(',')[1]});await writeFile(shots+name+'-native.png',Buffer.from(png,'base64'));console.log('SHOT '+name)}
 const state=()=>p.evaluate(()=>{const d=__blocksDbg();delete d.cheat;return d});
 await playCase(f,'gb.blocks');if(!baseline){const names=await p.evaluate(()=>['mate1','mate2','mate3','mate4','sister'].map(id=>Cast.n(id).toUpperCase().replace(/[^A-Z]/g,'').slice(0,3).padEnd(3,'.')));assert.deepEqual((await state()).hi.A.map(e=>e.n),names)}await frames(90);await shot('01-title-room');await p.evaluate(()=>RoomTV.lockIn(true));await shot('02-title');
 await frames(600);await shot('03-attract');await key('Enter');await key('Enter');await shot('04-menu');
 await key('z');await shot('05-music');await key('z');await shot('06-level');await key('z');
 assert.equal((await state()).mode,'play');await shot('07-start');
 await p.keyboard.down('ArrowLeft');await frames(35);await p.keyboard.up('ArrowLeft');await key('z');await key('ArrowUp');await frames(12);
 await p.keyboard.down('ArrowRight');await frames(29);await p.keyboard.up('ArrowRight');await key('x');await key('ArrowUp');await frames(12);
 await key('Shift');await shot('08-mid');
 for(let i=0;i<3;i++){await frames(5);await shot('09-sequence-'+i)}
 await key('Enter');assert((await state()).paused);await shot('10-pause');
 const perf=await p.evaluate(async()=>{const k=RoomTV.dbg(),def=RoomTV.defs['gb.blocks'],oldDebug=window.__blocksDbg,saved={opt:k.load()?.opt};const noop=()=>{};const copy=document.createElement('canvas');copy.width=k.W;copy.height=k.H;let last;
   const kit={...k,cv:copy,g:copy.getContext('2d'),load:()=>saved,save:noop,music:noop,secret:noop,over:noop,pressed:b=>b===window.blocksBenchButton,held:()=>false,sfx:new Proxy({},{get:()=>noop})};const game=def.make(kit);for(const b of ['start','a','a','a']){window.blocksBenchButton=b;game.update();window.blocksBenchButton=null;game.update()}const samples=[];
   for(let j=0;j<40;j++){const t=performance.now();for(let i=0;i<60;i++){kit.frame++;game.update();game.draw()}if(j>4)samples.push((performance.now()-t)/60)}game.end();window.__blocksDbg=oldDebug;samples.sort((a,b)=>a-b);
   const raf=[];await new Promise(r=>{function tick(t){if(last)raf.push(t-last);last=t;if(raf.length===90)r();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});raf.sort((a,b)=>a-b);
   return{native:[k.W,k.H],updateDrawMs:{mean:samples.reduce((a,b)=>a+b)/samples.length,p95:samples[Math.floor(samples.length*.95)]},rafMs:{median:raf[45],p95:raf[85]}}});
 console.log('PERFORMANCE '+JSON.stringify(perf));await writeFile(shots+'performance.json',JSON.stringify(perf,null,2));
 if(!baseline){
  // Matched before/after batches reduce noise from the shared host.
  await p.evaluate(()=>{window.blocksCurrentDef=RoomTV.defs['gb.blocks']});
  await p.route('**/blocks-before-review.js',r=>r.fulfill({contentType:'application/javascript',body:beforeSource}));await p.addScriptTag({url:base+'/blocks-before-review.js'});
  await p.evaluate(()=>{window.blocksBeforeDef=RoomTV.defs['gb.blocks'];RoomTV.defs['gb.blocks']=blocksCurrentDef});
  const matched=await p.evaluate(()=>{
   const realDebug=window.__blocksDbg,realK=RoomTV.dbg(),noop=()=>{},make=(def)=>{const cv=document.createElement('canvas');cv.width=160;cv.height=144;let button=null;const k={...realK,cv,g:cv.getContext('2d'),frame:0,t:0,load:()=>null,save:noop,music:noop,secret:noop,over:noop,pressed:b=>b===button,held:()=>false,stick:()=>({x:0,y:0}),sfx:new Proxy({},{get:()=>noop})};const game=def.make(k);for(const b of ['start','a','a','a']){button=b;game.update();button=null;game.update()}return{k,game,samples:[]}};
   const cases=[make(blocksBeforeDef),make(blocksCurrentDef)];
   for(let n=0;n<36;n++)for(const i of (n%2?[1,0]:[0,1])){const c=cases[i],t=performance.now();for(let f=0;f<60;f++){c.k.frame++;c.k.t+=1/60;c.game.update();c.game.draw()}if(n>=6)c.samples.push((performance.now()-t)/60)}
   for(const c of cases)c.game.end();window.__blocksDbg=realDebug;
   const stats=a=>{a.sort((a,b)=>a-b);return{mean:a.reduce((s,v)=>s+v,0)/a.length,median:a[Math.floor(a.length/2)],p95:a[Math.floor(a.length*.95)]}};
   return{native:[160,144],before:stats(cases[0].samples),after:stats(cases[1].samples),note:'Alternating 60-frame update/draw batches, default palettes, mean ms per frame'};
  });await p.unroute('**/blocks-before-review.js');await writeFile(shots+'matched-performance.json',JSON.stringify(matched,null,2));console.log('MATCHED PERFORMANCE '+JSON.stringify(matched));
 }
 if(!baseline){
  async function refresh(tag){
   await p.reload({waitUntil:'domcontentloaded'});
   await until(()=>!!window.AccountGate?.allowed&&!!window.House?.live&&!!window.PMGL?.built&&!document.querySelector('.hs-loading,#houseEntry'));
   await until(()=>window.RoomTV?._dbg()?.st==='game'&&typeof window.__blocksDbg==='function'&&!House.gliding);
   await p.evaluate(()=>RoomTV.lockIn(true));await frames(3);if(tag)await shot(tag);
  }
  async function menu(){
   const d=await state();if(d.mode==='play'){
    if(!d.paused)await key('Enter');await key('ArrowUp');await key('z'); // SAVE+QUIT wraps from RESUME
    await key('Enter');
   }else if(d.mode==='result'){await frames(65);await key('x')}
   else if(d.mode==='title')await key('Enter');
   assert.equal((await state()).mode,'menu');
  }
  async function choose(label){
   await menu();
   const labels=['MARATHON','ULTRA','40 LINES','B-TYPE','VS CPU','FLIGHT LOG','HALL OF FAME','OPTIONS','HOW TO PLAY'];
   const d=await state(),target=labels.indexOf(label)+(d.resume?1:0),count=labels.length+(d.resume?1:0);
   for(let i=0;i<(target-d.menuI+count)%count;i++)await key('ArrowDown');
   await key('z');
  }
  async function start(label){await choose(label);assert.equal((await state()).mode,'music');await key('z');assert.equal((await state()).mode,'level');await key('z');if(['B-TYPE','VS CPU'].includes(label))await key('z');assert.equal((await state()).mode,'play')}
  const battery=await p.evaluate(()=>RoomTV.dbg().load().cart);assert(battery&&battery.you);
  await refresh('11-refresh-pause');let d=await state();assert(d.paused);assert.deepEqual(d.cur,battery.you.cur);assert.deepEqual(d.grid,battery.you.grid);assert.equal(d.hold,battery.you.hold);assert.equal(d.canHold,battery.you.canHold);
  const frozen={cur:d.cur,time:d.runT};await frames(40);d=await state();assert.deepEqual(d.cur,frozen.cur);assert.equal(d.runT,frozen.time);await key('Enter');const beforeHold=await state();await key('Shift');assert.equal((await state()).hold,beforeHold.hold);assert.equal((await state()).cur.k,beforeHold.cur.k,'Refresh must not allow a second hold on the same piece');
  // One press, delayed auto shift, release/reset, and soft drop use the actual console keyboard path.
  await p.keyboard.down('ArrowLeft');await frames(30);await p.keyboard.up('ArrowLeft');d=await state();const wallX=d.cur.x;
  await key('ArrowLeft');assert.equal((await state()).cur.x,wallX);await key('ArrowRight');assert.equal((await state()).cur.x,wallX+1);
  const y=(await state()).cur.y;await p.keyboard.down('ArrowDown');await frames(12);await p.keyboard.up('ArrowDown');assert((await state()).cur.y>y);await shot('12-soft-drop');
  await p.evaluate(()=>{__blocksDbg().cheat.setRow();__blocksDbg().cheat.iPiece();__blocksDbg().cheat.lines(6)});await key('ArrowUp');await key('Enter');
  d=await state();assert.equal(d.lines,10);assert.equal(d.level,1);assert(d.un.d);assert.equal(d.clearing.length,4);const score=d.score;
  await shot('13-four-row-pause');await refresh('14-refresh-clear');d=await state();assert.equal(d.lines,10);assert.equal(d.score,score);assert.equal(d.clearing.length,4);
  await key('Enter');for(let i=0;i<3;i++){await frames(3);await shot('15-clear-sequence-'+i)}await frames(40);assert.equal((await state()).clearing,null);await shot('15-four-row-clear');
  await choose('FLIGHT LOG');await shot('16-flight-log');await key('x');
  await choose('OPTIONS');await shot('17-options-classic');await key('z');assert.equal((await state()).opt.pal,0);await shot('18-options-colour');await key('z');
  for(let i=0;i<3;i++)await key('ArrowDown');await key('z');assert.equal((await state()).opt.music,0);await key('ArrowDown');await key('z');assert.equal((await state()).opt.sfx,0);await shot('19-audio-off');await refresh('20-refresh-options');d=await state();assert.equal(d.mode,'opts');assert.equal(d.opt.music,0);assert.equal(d.opt.sfx,0);await key('z');await key('ArrowUp');await key('z');await key('x');
  // All three original tunes, unlocked fourth tune and OFF are selectable.
  await choose('ULTRA');for(let i=1;i<=4;i++){await key('ArrowDown');assert.equal(await p.evaluate(()=>RoomTV.dbg().load().mus),i);await shot('20b-tune-'+i)}await key('ArrowDown');await key('z');await key('z');assert.equal((await state()).mode,'play');await frames(80);await shot('21-ultra');await key('Enter');const timed=(await state()).runT;
  await refresh('22-refresh-ultra');assert.equal((await state()).gtype,'U');assert.equal((await state()).runT,timed);await key('Enter');await p.evaluate(()=>__blocksDbg().cheat.time(179.9));await frames(30);await shot('23-time-up');await frames(150);assert.equal((await state()).mode,'result');await shot('24-ultra-results');
  await start('40 LINES');await shot('25-forty-start');await p.evaluate(()=>{__blocksDbg().cheat.lines(36);__blocksDbg().cheat.time(150);__blocksDbg().cheat.setRow();__blocksDbg().cheat.iPiece()});await key('ArrowUp');await frames(150);assert.equal((await state()).mode,'rocket');assert.equal((await state()).rocket,2);await frames(200);await shot('26-medium-rocket');await refresh('27-refresh-shuttle');assert.equal((await state()).mode,'rocket');await frames(450);
  if((await state()).mode==='entry'){await shot('28-initials');await key('ArrowUp');const initials=(await state()).entry;await refresh('29-refresh-initials');assert.equal((await state()).entry,initials);await key('Enter')}
  await frames(65);assert.equal((await state()).mode,'result');await shot('30-forty-results');
  await start('VS CPU');await frames(135);await shot('31-cpu');await p.evaluate(()=>{__blocksDbg().cheat.setRow();__blocksDbg().cheat.iPiece()});await key('ArrowUp');assert.equal((await state()).cpu.junk,4);await key('Enter');const cpu=await p.evaluate(()=>RoomTV.dbg().load().cart);
  await refresh('32-refresh-cpu');d=await state();assert.equal(d.gtype,'V');assert.equal(d.vs.round,cpu.vs.round);assert.equal(d.cpu.junk,cpu.cpu.junkIn);await key('Enter');
  for(let i=0;i<3;i++){await p.evaluate(()=>__blocksDbg().cheat.cpuDie());await shot('33-cpu-round-'+i);await frames(i<2?280:160)}
  await frames(200);d=await state();assert.equal(d.mode,'result');assert.equal(d.vs.me,3);assert(d.un.hard);await shot('34-cpu-match-won');
  // A complete 25-line flight uses a placement adviser and real rotations, D-pad presses and drops.
  await start('B-TYPE');await shot('35-flight-start');let drops=0;
  while((await state()).mode==='play'&&drops<220){
   d=await state();if(!d.cur||d.clearing){await frames(24);continue}
   const hint=await p.evaluate(()=>__blocksDbg().cheat.hint());
   for(let i=0;i<hint.r;i++)await key('z');
   for(let i=0;i<12;i++){const c=(await state()).cur;if(!c||c.x===hint.x)break;await key(c.x<hint.x?'ArrowRight':'ArrowLeft')}
   await key('ArrowUp');drops++;await frames(9);
   if(drops%25===0){await shot('36-flight-mid-'+drops);console.log('FLIGHT',drops,(await state()).lines)}
  }
  d=await state();assert.equal(d.mode,'over','Flight should clear before the stack reaches the top');assert(d.flights['0-0']);await frames(150);assert.equal((await state()).mode,'rocket');await shot('37-small-rocket');await frames(680);if((await state()).mode==='entry')await key('Enter');await frames(70);await shot('38-flight-stamp');await key('z');d=await state();assert.equal(d.gtype,'B');assert.equal(d.level,0);assert(d.grid.slice(15).some(row=>row.some(Boolean)),'Next flight raises the junk height');
  // Top flight: setup only the last four rows, then win with a real drop, launch and credits.
  await choose('FLIGHT LOG');await key('ArrowLeft');await key('ArrowUp');await key('ArrowUp');await shot('39-finale-select');await key('z');await key('z');await key('z');await key('z');
  d=await state();assert.equal(d.level,9);await p.evaluate(()=>{__blocksDbg().cheat.lines(21);__blocksDbg().cheat.setRow();__blocksDbg().cheat.iPiece()});await key('ArrowUp');await frames(150);assert.equal((await state()).rocket,3);await frames(100);await shot('40a-shuttle-pad');await frames(250);await shot('40-finale-launch');await frames(350);assert.equal((await state()).mode,'credits');await frames(230);await shot('41-credits');await refresh('42-refresh-credits');assert.equal((await state()).mode,'credits');await frames(Math.max(1,Math.floor((40-(await state()).creditT)*60)));await shot('42b-the-end');await key('Enter');if((await state()).mode==='entry')await key('Enter');await frames(70);await shot('43-finale-results');
  // Same game through six screen sizes, real touch controller, gamepad and house pause.
  await key('z');await p.evaluate(()=>{__blocksDbg().cheat.lines(0)});await key('Enter');
  for(const [width,height,name] of [[1366,860,'desktop'],[1920,1080,'wide'],[390,844,'phone'],[844,390,'phone-landscape'],[768,1024,'tablet'],[1024,768,'tablet-landscape']]){
   await p.setViewportSize({width,height});await p.waitForTimeout(400);await shot('44-'+name);const rect=await p.locator('.rm-tvv .rm-glass').boundingBox();assert(Math.abs(rect.width/rect.height-10/9)<.01);assert(rect.width<=width&&rect.height<=height);
  }
  await p.setViewportSize({width:390,height:844});await key('Enter');await p.evaluate(()=>{__blocksDbg().cheat.iPiece()});
  const cdp=await p.context().newCDPSession(p);const touch=async(name,framesHeld=4)=>{const b=await p.locator('.rm-tvv .rm-pad:not([hidden]) [data-b='+name+']').boundingBox();assert(b,'Touch button '+name);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await frames(1);assert(await p.evaluate(name=>RoomTV.dbg().held(name),name),'First touch lost: '+name);await frames(framesHeld);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frames(3)};
  const cx=(await state()).cur.x;await touch('left',22);assert((await state()).cur.x<cx);await touch('a');await shot('45-touch-playing');await touch('start');assert((await state()).paused);await shot('46-touch-pause');await touch('start');await cdp.detach();
  const gx=(await state()).cur.x;await p.evaluate(()=>{window.blocksPad={id:'Review standard pad',index:0,connected:true,mapping:'standard',axes:[1,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[blocksPad]});window.dispatchEvent(new Event('gamepadconnected'))});
  await until(()=>GameInput.mode==='gamepad');await frames(25);assert((await state()).cur.x>gx);await p.evaluate(()=>{blocksPad.axes[0]=0;blocksPad.buttons[9]={pressed:true,value:1}});await until(()=>__blocksDbg().paused);await shot('47-gamepad-pause');await p.evaluate(()=>{blocksPad.buttons[9]={pressed:false,value:0};blocksPad.connected=false;delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});
  await p.setViewportSize({width:1366,height:860});await key('Enter');await p.keyboard.press('Escape');await until(()=>!!HousePause.open);const before=(await state()).runT;await p.waitForTimeout(500);assert.equal((await state()).runT,before);await p.screenshot({path:shots+'48-house-pause.png'});await p.keyboard.press('Escape');await until(()=>!HousePause.open);await key('Enter');
  await p.evaluate(()=>RoomTV.lockIn(false));await p.waitForTimeout(600);await shot('49-in-room-pause');await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);await p.screenshot({path:shots+'50-back-in-room.png'});
  // The controller fix also preserves other cartridges; actual first-contact input is essential on hybrid devices.
  for(const gid of ['gb.mon','n64.kart']){
   await p.setViewportSize({width:390,height:844});await playCase(f,gid);await p.keyboard.press('ArrowLeft');await frames(3);await p.evaluate(()=>RoomTV.lockIn(true));await p.waitForTimeout(500);
   const c=await p.context().newCDPSession(p);
   const finger=async(x,y)=>{await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]})};
   if(gid.startsWith('n64.')){await finger(190,100);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frames(3)}
   const a=await p.locator('.rm-tvv .rm-pad:not([hidden]) [data-b=a]').boundingBox();assert(a);
   await finger(a.x+a.width/2,a.y+a.height/2);await frames(3);assert(await p.evaluate(()=>RoomTV.dbg().held('a')),'First A press lost on '+gid);
   await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frames(3);assert.equal(await p.evaluate(()=>RoomTV.dbg().held('a')),false);await c.detach();
   await shot('51-shared-'+gid);await p.evaluate(()=>RoomTV.lockIn(false));await p.keyboard.press('q');await until(()=>House.mode==='walk'&&!House.gliding);
  }
  console.log('FLOW PASS: exact battery, controls, four-row, all five modes, 25-line flight, next flight, finale, touch/gamepad and six sizes; drops='+drops);
 }
 assert.deepEqual(f.errors,[]);assert(!/mod failed to load/i.test(log),log);console.log('BLOCKOLOGY '+(baseline?'BASELINE':'PASS'));
}catch(error){
 const page=browser?.contexts()[0]?.pages()[0];
 if(page&&!page.isClosed()){
  console.error('FAIL STATE',await page.evaluate(()=>{const d=window.__blocksDbg?.();return d?{mode:d.mode,gtype:d.gtype,paused:d.paused,lines:d.lines,level:d.level,vs:d.vs,cur:d.cur}:null}).catch(()=>null));
  await page.screenshot({path:shots+'failure.png',timeout:20000}).catch(()=>{});
 }
 throw error;
}finally{if(browser)await browser.close();if(server?.exitCode===null){const end=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');await end}if(data)await rm(data,{recursive:true,force:true})}
