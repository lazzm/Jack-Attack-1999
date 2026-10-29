// Native cartridge play-through plus physical-room integration. Localhost only.
// Start the disposable server and this script in the same shell. --before / --native / --room-only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {loadavg,availableParallelism} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const base=process.argv.find(x=>/^http:/.test(x));assert(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname),'Supply a disposable localhost server');
assert.equal(await (await fetch(base+'/js/rm-g-party.js')).text(),await readFile(fileURLToPath(new URL('../../app/public/js/rm-g-party.js',import.meta.url)),'utf8'),'Server must serve this worktree');
const before=process.argv.includes('--before'),tag=before?'before':'after',dir=fileURLToPath(new URL('../shots/games/party/',import.meta.url));await mkdir(dir,{recursive:true});
const baseline=before?execFileSync('git',['show','HEAD:app/public/js/rm-g-party.js'],{encoding:'utf8'}):null;
let browser,p;const errors=[];
async function native(){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});p=await browser.newPage({viewport:{width:1366,height:860}});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await p.route('**/__party-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="margin:0;background:#121025">'}));
 if(before)await p.route('**/js/rm-g-party.js*',r=>r.fulfill({contentType:'application/javascript',body:baseline}));
 await p.goto(base+'/__party-review');await boot();
}
async function boot(){
 await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});
 for(const src of ['vendor/three.min','js/cast','js/rm-tv','js/rm-3d','js/rm-g-party'])await p.addScriptTag({url:base+'/'+src+'.js'});
 await p.evaluate(()=>{
  const wrap=document.createElement('div');Object.assign(wrap.style,{position:'fixed',width:'min(96vw, 94vh * 4 / 3)',aspectRatio:'4 / 3',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});document.body.append(wrap);
  const cv=document.createElement('canvas'),hud=document.createElement('canvas');for(const c of [cv,hud]){c.width=320;c.height=240;Object.assign(c.style,{position:'absolute',width:'100%',height:'100%',imageRendering:'pixelated'});wrap.append(c)}
  const held={},pressed={},map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',Enter:'start'};
  addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
  const saved={value:JSON.parse(localStorage.getItem('party-review-save')||'null')};let seed=1999;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const K={cv,hud:hud.getContext('2d'),W:320,H:240,font:RoomTV.font,t:0,frame:0,best:0,restoring:!!saved.value,
   load:()=>structuredClone(saved.value),save:s=>{saved.value=structuredClone(s);localStorage.setItem('party-review-save',JSON.stringify(s));return true},label:b=>({a:'Z',b:'X',start:'ENTER'}[b]||b.toUpperCase()),keyLabel:b=>({a:'Z',b:'X',start:'ENTER'}[b]||b.toUpperCase()),
   held:b=>!!held[b],pressed:b=>!!pressed[b],stick:()=>({x:(held.right?1:0)-(held.left?1:0),y:(held.down?1:0)-(held.up?1:0)}),
   sfx:{tone(){},seq(){},noise(){}},music(){},secret:id=>{review.secrets.add(id)},over:(score,o)=>{review.result={score,...o}},resume(){this.restoring=false},three(o){return this._three ||= RoomTV.make3d(this,o)}};
  window.review={K,saved,secrets:new Set(),game:null,step(n,draw=true){for(let i=0;i<n;i++){this.game.update(1/60);K.t+=1/60;K.frame++;for(const k in pressed)delete pressed[k]}if(draw)this.game.draw()},shot(){this.game.draw();const c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');g.drawImage(cv,0,0);g.drawImage(hud,0,0);return c.toDataURL()}};
  review.game=RoomTV.defs['n64.party'].make(K);
 });
}
const frames=n=>p.evaluate(n=>review.step(n),n);
const key=async k=>{await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)};
const hold=async(k,n)=>{await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)};
const state=()=>p.evaluate(()=>{const d=review.K.dbg;return{mode:d.mode,G:d.G,P:d.P.map(p=>({name:p.name,ci:p.ci,at:p.at,coins:p.coins,stars:p.stars,items:p.items,st:p.st,x:p.a.x,z:p.a.z})),A:d.A&&{id:d.A.id,phase:d.A.phase,t:d.A.t,tl:d.A.tl,sc:d.A.sc,win:d.A.win},ui:d.ui,paused:d.paused,seed:d.seed,camera:d.camera}});
async function shot(n){await frames(1);await p.screenshot({path:dir+tag+'-'+n+'.png'});await writeFile(dir+tag+'-'+n+'-native.png',Buffer.from((await p.evaluate(()=>review.shot())).split(',')[1],'base64'))}
async function advance(test,max=2400){for(let i=0;i<max;i+=30){if(await test())return;await frames(30)}throw Error('Flow timed out '+JSON.stringify(await state()))}
async function perf(){return p.evaluate(()=>{const times=[],gl=review.K._three.ren.getContext(),pixel=new Uint8Array(4);for(let i=0;i<20;i++)review.step(1);for(let i=0;i<180;i++){const t=performance.now();review.step(1);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);times.push(performance.now()-t)}times.sort((a,b)=>a-b);return{median:times[90],p95:times[171],max:times[179],resolution:[320,240],renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),draws:review.K.dbg.info(),scope:'native update + draw + GPU readback; excludes house'}})}
try{
 if(!process.argv.includes('--room-only')){
  await native();await frames(120);await shot('title');await frames(600);await shot('attract');await key('Enter');await shot('menu');await key('z');if(!before){await shot('boards');await key('ArrowRight');await key('z');}await frames(40);await shot('character');await key('ArrowRight');await key('z');await shot('settings');
  if(process.argv.includes('--benchmark')){}else if(before){await key('z');await frames(60);await shot('intro');await p.evaluate(()=>{review.K.dbg.auto(true);review.K.dbg.autoWait(.05)});await frames(1800);await shot('board');
   for(const id of ['balloon','hotfloor','coins','bumper','draw','says','paint','kart']){await p.evaluate(id=>{review.K.dbg.mg(id);review.K.dbg.auto(false)},id);await frames(5);await shot(id+'-rules');await key('z');await frames(260);await shot(id+'-play');}
   await key('Enter');await shot('pause');
  }else if(process.argv.includes('--persistence'))await persistence();else if(process.argv.includes('--progression'))await progression();else if(process.argv.includes('--match'))await match();else if(process.argv.includes('--compatibility'))await compatibility();else if(process.argv.includes('--skills'))await skills();else if(process.argv.includes('--art'))await artReview();else await flows();
  const performance=await benchmark();await writeFile(dir+tag+'-performance.json',JSON.stringify(performance,null,2));console.log('PERFORMANCE '+JSON.stringify(performance));assert.deepEqual(errors,[]);await browser.close();browser=null;
 }
 if(!process.argv.includes('--native'))await room();
 console.log('PARTY '+tag+' PASS');
}catch(e){if(p&&!p.isClosed())await shot('failure').catch(()=>{});throw e}finally{await browser?.close()}
async function benchmark(){
 await p.evaluate(()=>{review.game.end();localStorage.removeItem('party-review-save')});await p.reload();await boot();await frames(120);
 const samples={hostLoad:loadavg(),cpus:availableParallelism(),scenarios:{}};
 samples.scenarios.title=await perf();await shot('benchmark-title');
 await p.evaluate(()=>{const d=review.K.dbg;if(d.save)d.save.diff=1;d.newGame();d.auto(true);d.autoWait(.05)});await frames(1900);await p.evaluate(()=>{const d=review.K.dbg;d.auto(false);d.turn(0)});await frames(120);samples.scenarios.board=await perf();await shot('benchmark-board');
 for(const id of ['kart','hotfloor','balloon']){
  await p.evaluate(({id,before})=>{const d=review.K.dbg;if(before)d.mg(id);else d.single('house',id);d.auto(false);},{id,before});await frames(40);await key('z');await frames(260);samples.scenarios[id]=await perf();await shot('benchmark-'+id);
 }
 return samples;
}
async function flows(){
 await key('z');await frames(50);await shot('intro');
 const drive=async(predicate,max=18000)=>{for(let n=0;n<max;n+=30){if(await predicate())return;const s=await state();if(s.ui?.dialogue||s.ui?.hint||s.ui?.menu)await key('z');await frames(30);}throw Error('Board drive timed out '+JSON.stringify(await state()))};
 await drive(async()=>!!(await state()).ui.menu);await shot('board');
 assert.equal((await state()).G.board,1);assert((await state()).P.every(p=>!['JACK','DAVE','LUKE','CAL','JK'].includes(p.name)),'Personal cast replaces authored names');
 // Select a known branch of the actual turn script; dice and movement use real inputs.
 await p.evaluate(()=>{review.K.dbg.turn(0);review.K.dbg.force(4)});await frames(90);await key('z');await frames(30);await key('z');
 for(let i=0;i<4;i++){await frames(12);await shot('dice-hop-'+i);}await drive(async()=>!(await state()).ui.hint&&!(await state()).ui.dialogue,3000);
 // Separate board fixture branches exercise real transactions without replaying whole parties.
 await p.evaluate(()=>{const d=review.K.dbg;d.P[0].coins=40;d.run(d.FN.shopStop(d.P[0],false));});
 await drive(async()=>!!(await state()).ui.menu,1000);await shot('shop');await key('z');await frames(10);await key('z');await frames(60);
 assert((await state()).P[0].items.length===1,'Item shop purchase');
 await p.evaluate(()=>{const d=review.K.dbg;d.P[0].coins=50;d.setStar(d.P[0].at);d.run(d.FN.starStop(d.P[0]));});
 await drive(async()=>!!(await state()).ui.menu,1000);await shot('star-host');await key('z');await frames(100);assert.equal((await state()).P[0].stars,1);await shot('star-earned');
 // Every attraction gets a rules/practice/countdown/input/gameplay/result route.
 const ids=await p.evaluate(()=>review.K.dbg.order);assert.equal(ids.length,41);const starts=[];
 for(const id of ids){
  await p.evaluate(id=>{review.K.dbg.single('house',id)},id);await frames(40);await shot(id+'-rules');
  await key('x');assert.equal(await p.evaluate(()=>review.K.dbg.A.practice),true);await frames(30);await shot(id+'-practice');await key('x');assert.equal((await state()).A.phase,'card');
  await frames(40);await key('z');await advance(async()=>(await state()).A?.phase==='play',900);await shot(id+'-start');
  for(let n=0;n<6;n++){await hold(['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'][n%4],8);await hold('z',n%2?20:1);}
  for(let n=0;n<3;n++){await frames(20);await shot(id+'-motion-'+n);}
  const st=await state();assert(st.P.every(p=>[p.x,p.z].every(Number.isFinite)),id+' finite actors');
  if(st.A?.phase==='play'){await p.evaluate(()=>review.K.dbg.auto(true));await advance(async()=>{const a=(await state()).A;return !a||['res','over'].includes(a.phase)},5000);await p.evaluate(()=>review.K.dbg.auto(false));}
  await shot(id+'-result');starts.push({id,result:(await state()).A?.win||[]});
 }
 await writeFile(dir+'after-attractions.json',JSON.stringify(starts,null,2));
 console.log('ATTRACTIONS PASS '+ids.length);await progression();await match();await persistence();await skills();await artReview();
}
async function match(){
 // A complete five-turn party. No score/turn/finish mutations and no human autoplay.
 await p.evaluate(()=>{const d=review.K.dbg;d.title();d.save.turns=0;d.save.diff=0;d.newGame();review.result=null;});
 let lastTurn=0,lastPhase='',ticks=0,held='';const seen=new Set();
 while(!await p.evaluate(()=>!!review.result)){
  assert(ticks++<14000,'Full match must terminate');const s=await state();
  if(s.G?.turn!==lastTurn){lastTurn=s.G?.turn;await shot('full-match-turn-'+lastTurn);}
  const phase=s.A?s.A.id+'-'+s.A.phase:s.ui?.result?'results':s.ui?.legends?'legends':s.G?.phase;
  if(phase!==lastPhase){lastPhase=phase;if(!seen.has(phase)){seen.add(phase);await shot('full-match-'+phase);}}
  if(s.A?.phase==='play'){
    const id=s.A.id;const dir=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][(ticks/20|0)%4];
    if(held!==dir){if(held)await p.keyboard.up(held);await p.keyboard.down(dir);held=dir;}
    if(['kart','curling','bowling','golf','fishing','snow','delivery'].includes(id)){if(ticks%20===0)await p.keyboard.up('z');else await p.keyboard.down('z');}
    else await key('z');
  }else{
    if(held){await p.keyboard.up(held);held='';}await p.keyboard.up('z');
    if(s.ui?.dialogue||s.ui?.hint||s.ui?.menu||s.A?.phase==='card'||s.A?.phase==='res'||s.ui?.result||s.ui?.legends)await key('z');
  }
  await frames(15);
 }
 if(held)await p.keyboard.up(held);await p.keyboard.up('z');await shot('full-match-complete');
 const result=await p.evaluate(()=>review.result);assert(result.score>=0);console.log('FULL MATCH PASS '+JSON.stringify({ticks,result}));
}
async function progression(){
 const menu=async name=>{await p.evaluate(()=>review.K.dbg.title());await key('Enter');const choices=await p.evaluate(()=>review.K.dbg.choices);const i=choices.indexOf(name);assert(i>=0);for(let n=0;n<i;n++)await key('ArrowDown');await key('z');};
 await menu('MINIGAME HOUSE');await shot('minigame-house');await key('ArrowRight');await shot('house-page-2');await p.evaluate(()=>review.K.dbg.flush());const h=(await state()).ui.houseI;await p.reload();await boot();assert.equal((await state()).mode,'house');assert.equal((await state()).ui.houseI,h);
 await menu('NEW PARTY');
 for(let i=0;i<3;i++){await p.evaluate(i=>review.K.dbg.board(i),i);await key('ArrowRight');await shot('board-select-'+i);}
 // A fresh full party reaches its first saved turn using original menu and dialogue inputs.
 await key('z');await key('z');await key('z');
 for(let n=0;n<1000;n++){const s=await state();if(s.ui.menu)break;if(s.ui.dialogue||s.ui.hint)await key('z');await frames(20);}
 assert.equal((await state()).G.phase,'turn');
 for(let id=0;id<3;id++){await p.evaluate(id=>{const d=review.K.dbg;d.board(id);d.run(d.FN.mapView(d.P[0]));},id);await frames(120);await shot('board-map-'+id);await key('x');}
 await p.evaluate(()=>{const d=review.K.dbg;d.newGame()});
 for(let n=0;n<1000;n++){const s=await state();if(s.ui.menu)break;if(s.ui.dialogue||s.ui.hint)await key('z');await frames(20);}
 await key('z');await frames(30);await key('z');await frames(15);await p.evaluate(()=>review.K.dbg.flush());const walk=await state();await p.reload();await boot();assert.deepEqual((await state()).P,walk.P,'Board hop restores exact standing state');assert.deepEqual((await state()).G,walk.G,'Board turn does not reroll on refresh');await shot('board-refresh-mid-hop');
 // Endgame fixture supplies accumulated match scores; all bonus and podium scripts run normally.
 await p.evaluate(()=>{const d=review.K.dbg;d.G.kind=undefined;d.G.turns=5;d.G.mgPlayed=5;d.G.phase='final';d.P[0].stars=4;d.P[0].st.mgw=5;d.P[0].st.max=100;d.P[0].st.happen=5;d.finale()});
 let results=false,credits=false;
 for(let n=0;n<2000;n++){const s=await state();if(await p.evaluate(()=>!!review.result))break;if(s.ui.dialogue)await key('z');
  if(n%20===0)await shot('ending-frame-'+n);
  if(await p.evaluate(()=>review.K.dbg.ui.result)){results=true;await shot('final-results');await key('z');}
  else if(await p.evaluate(()=>review.K.dbg.ui.legends)){await shot('party-legends');await key('z');}
  await frames(15);
 }
 assert(results,'Final results shown');assert(await p.evaluate(()=>review.secrets.has('lk.party.star')&&review.secrets.has('lk.party.sweep')),'Existing owner unlocks');assert(await p.evaluate(()=>!!review.result),'Complete party reaches its result/credits endpoint');await shot('party-complete');
 // Solo defeat/life checkpoint and a last-stage ending branch; a win is earned with actual pump inputs.
 await menu('SOLO EXPEDITION');await shot('solo-map');await key('z');await key('z');await key('z');await frames(40);await key('z');await advance(async()=>(await state()).A?.phase==='play',900);
 await frames(1800);await frames(400);assert.equal(await p.evaluate(()=>review.K.dbg.save.expedition.lives),3,'Solo defeat costs exactly one life');await shot('solo-defeat');
 await p.evaluate(()=>{const d=review.K.dbg,e=d.save.expedition;e.node=39;e.lives=3;e.cleared=d.order.filter(id=>id!=='marble').slice(0,39);d.single('solo','balloon');});
 await frames(40);await key('z');await advance(async()=>(await state()).A.phase==='play',900);for(let n=0;n<150&&(await state()).A?.phase==='play';n++){await key('z');await frames(2);}await frames(300);
 for(let n=0;n<120;n++){if((await state()).mode==='expedition')break;const s=await state();if(s.ui.dialogue)await key('z');if(n%20===0)await shot('solo-credits-'+n);await frames(30);}
 assert(await p.evaluate(()=>review.K.dbg.save.expedition.complete),'Solo ending and secret attraction unlock');await shot('solo-complete');
 assert(await p.evaluate(()=>review.K.dbg.save.unlocks.marble));await key('z');assert(await p.evaluate(()=>review.K.dbg.save.unlocks.marble),'Earned secret survives replaying the expedition');await menu('MINIGAME HOUSE');for(let n=0;n<5;n++)await key('ArrowRight');await key('z');assert.equal((await state()).A.id,'marble','Earned secret enters through the real house menu');await shot('secret-unlocked');
 console.log('PROGRESSION PASS boards, shop, star, exact board resume, podium, bonus unlocks, solo life/ending/secret');
}
async function persistence(){
 for(const id of [...(await p.evaluate(()=>review.K.dbg.order))]){
  await p.evaluate(id=>{review.K.dbg.auto(false);review.K.dbg.single('house',id)},id);await frames(40);await key('z');await advance(async()=>(await state()).A.phase==='play',900);
  await hold('ArrowRight',24);await hold('z',12);await frames(5);await p.evaluate(()=>review.K.dbg.flush());
  const first=await state();await p.reload();await boot();const next=await state();
  assert.deepEqual(next.A,first.A,id+' minigame refresh');
  assert.deepEqual(next.P,first.P,id+' exact actors/coins/items refresh');assert.deepEqual(next.camera,first.camera,id+' camera glide refresh');assert.equal(next.seed,first.seed,id+' PRNG refresh');
  assert.equal(await p.evaluate(()=>review.secrets.size),0,'Replay cannot award secrets');await shot(id+'-refresh');
 }
 await key('Enter');assert((await state()).paused);await p.evaluate(()=>review.K.dbg.flush());const paused=await state();await frames(120);assert.equal((await state()).A.t,paused.A.t,'Pause freezes game clock');await shot('pause');
 await p.reload();await boot();assert((await state()).paused,'Pause survives refresh');await key('Enter');assert(!(await state()).paused);
 assert(await p.evaluate(()=>JSON.stringify(review.saved.value).length<20000),'Checkpoint and journal remain eligible for roaming save');
 console.log('PERSISTENCE PASS 41 attractions + pause');await compatibility();
}
async function artReview(){
 await p.evaluate(()=>review.K.dbg.title());await key('Enter');const choices=await p.evaluate(()=>review.K.dbg.choices);for(let n=0;n<choices.indexOf('NEW PARTY');n++)await key('ArrowDown');await key('z');await key('z');assert.equal((await state()).mode,'select');
 for(let i=0;i<6;i++){await frames(90);const id=(await state()).ui.character;await shot('character-'+['bolt','pip','wisp','sprout','comet','chompy'][id]);await key('ArrowRight');}
 await p.evaluate(()=>{const d=review.K.dbg;d.newGame();d.board(2);const a=d.SP[5],p=d.P[0];p.at=5;p.a.x=a.x;p.a.z=a.z;d.turn(0);d.run(d.FN.land(p));});await frames(90);await shot('count-tax');await key('z');await frames(20);await key('z');await frames(100);assert.equal((await state()).P[0].coins,3,'Count tax debits seven coins');
 await p.evaluate(()=>review.K.dbg.single('house','kart'));await frames(40);await shot('kart-final-rules');await key('z');await advance(async()=>(await state()).A?.phase==='play',900);
 for(const [name,dx,dz]of [['front',0,4],['rear',0,-4],['side',4,0]]){
  const data=await p.evaluate(({dx,dz})=>{const a=review.K.dbg.A.acts[0],c=review.K._three.cam;c.position.set(a.x+Math.cos(a.ry)*dx+Math.sin(a.ry)*dz,2.5,a.z-Math.sin(a.ry)*dx+Math.cos(a.ry)*dz);c.lookAt(a.x,1,a.z);return review.shot();},{dx,dz});await writeFile(dir+'after-kart-model-'+name+'-native.png',Buffer.from(data.split(',')[1],'base64'));await p.screenshot({path:dir+'after-kart-model-'+name+'.png'});
 }
 console.log('ART PASS six character close-ups, Count tax and three kart angles');
}
async function skills(){
 // The last expedition attraction must reward readable play, not a lucky guess.
 await p.evaluate(()=>{review.K.dbg.auto(false);review.K.dbg.single('solo','wire')});await frames(40);await shot('wire-final-rules');await key('z');await advance(async()=>(await state()).A?.phase==='play',900);await shot('wire-wind-up');
 for(let n=0;n<1200&&(await state()).A?.phase==='play';n++){
  const target=await p.evaluate(()=>{const a=review.K.dbg.A,p=a.pulses.slice().sort((a,b)=>a.left-b.left)[0];return p?{wire:p.wire,selected:a.wires[0],blocked:a.block}:null;});
  if(target){if(target.selected!==target.wire)await key((target.wire-target.selected+3)%3===1?'ArrowRight':'ArrowLeft');await key('z');}await frames(3);
 }
 assert((await state()).A?.win.includes(0),'The electrician can win with actual direction and block inputs');await shot('wire-skill-victory');console.log('SKILL PASS final expedition attraction won by real timed inputs');
 await p.evaluate(()=>{const d=review.K.dbg;d.title();d.newGame();d.P[0].items=['magnet','warp','twin'];d.P.forEach((p,i)=>{p.coins=10;p.at=[0,2,9,15][i];p.a.x=d.SP[p.at].x;p.a.z=d.SP[p.at].z;});d.turn(0);});await frames(90);
 const inventory=async()=>{assert((await state()).ui.menu,'Turn menu is available');await key('ArrowDown');await key('z');await key('z');};
 await inventory();await frames(90);await shot('coin-magnet');await frames(90);assert.deepEqual((await state()).P.map(p=>p.coins),[19,7,7,7],'Magnet transfers existing coins');
 await inventory();await frames(90);await shot('swap-kazoo');await frames(150);assert.notEqual((await state()).P[0].at,0,'Kazoo exchanges board positions');assert.equal((await state()).P.reduce((s,p)=>s+p.at,0),26,'Kazoo preserves the four board positions');
 await inventory();await frames(110);assert.equal(await p.evaluate(()=>review.K.dbg.dice.length),2,'Twin Dice creates two live blocks');await shot('twin-dice');await key('z');await frames(60);await shot('twin-dice-hop');
 console.log('ITEM PASS inventory input, coin transfer, position swap and twin blocks');
}
async function compatibility(){
 await p.evaluate(()=>{const d=review.K.dbg;d.title();d.newGame();d.G.phase='turn';d.G.cur=0;d.G.starAt=9;d.G.turn=2;d.G.turns=8;d.P[0].coins=73;d.P[0].stars=2;d.P[0].items=['warp','twin'];d.P[0].st.mgw=3;d.flush();const legacy=structuredClone(d.save);legacy.game={G:structuredClone(d.G),P:d.P.map(p=>({name:p.name,ci:p.ci,cpu:p.cpu,mate:p.mate,coins:p.coins,stars:p.stars,at:p.at,items:p.items,st:p.st}))};legacy.front={mode:'title'};review.game.end();review.K.save(legacy);});
 await p.reload();await boot();await key('Enter');await key('z');await frames(1);const s=await state();assert.equal(s.P[0].coins,73);assert.equal(s.P[0].stars,2);assert.deepEqual(s.P[0].items,['warp','twin']);assert.equal(s.P[0].st.mgw,3);assert.equal(s.G.turn,2);assert.equal(s.G.turns,8);
 assert.equal(typeof await p.evaluate(()=>review.K.dbg.save.game.tape),'string','Legacy continue gains a compact journal without resetting progress');await p.evaluate(()=>review.K.dbg.flush());const old=await state();await p.reload();await boot();assert.deepEqual((await state()).P,old.P,'Migrated party resumes without losing old balances');await shot('legacy-continue');
 await p.evaluate(()=>{const name=Cast.n;try{Cast.n=id=>'Fresh '+id;review.K.dbg.single('house','lamp');if(!review.K.dbg.P.slice(1).every(p=>p.name.startsWith('FRESH ')))throw Error('Cast identities were cached across visitors');}finally{Cast.n=name;}review.K.dbg.title();});
 console.log('COMPATIBILITY PASS version-one party coins/stars/items/stats/turns and live cast identity');
}
async function room(){
 const account='Party'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,touch:true});browser=f.browser;p=f.page;
 const aim=async(eye,target)=>{await f.view(eye,target);await p.evaluate(()=>{House.hush();House._.setMode('walk')})};
 // Discover this lost cartridge on the disposable account, then use its real case and slot.
 await playCase(f,'n64.party');
 await p.waitForTimeout(1200);await p.screenshot({path:dir+tag+'-in-room.png'});
 await p.evaluate(()=>window.partyInstance=RoomTV.dbg());await p.keyboard.press('t');await p.waitForTimeout(500);assert(await p.evaluate(()=>RoomTV.dbg()===partyInstance),'LOCK IN keeps cartridge instance');await p.screenshot({path:dir+tag+'-lock-in.png'});assert.equal(await p.evaluate(()=>RoomTV._dbg().gid),'n64.party');
 const rstate=()=>p.evaluate(()=>{const k=RoomTV.dbg(),d=k?.dbg;return{mode:d?.mode,A:d?.A&&{id:d.A.id,phase:d.A.phase,t:d.A.t,sc:d.A.sc},paused:d?.paused,frame:k?.frame,instance:k?.id,background:RoomTV._dbg()?.background}});
 const wait=async fn=>{for(let n=0;n<900;n++){if(await p.evaluate(fn))return;await p.waitForTimeout(100);}console.log('ROOM DIAGNOSTIC',await p.evaluate(()=>({mode:window.House?.mode,glide:window.House?.gliding,game:window.RoomTV?._dbg(),loading:!!document.querySelector('.hs-loading,#houseEntry'),save:localStorage.getItem('jhp_console_focus')})));await p.screenshot({path:dir+'after-room-failure.png'});throw Error('Room state timed out '+fn+' '+JSON.stringify(await rstate()));};
 // Real standard-pad A, analogue stick, B and Start. The shared console polls this pad.
 await p.evaluate(()=>{window.partyPad={id:'Standard test controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[partyPad]});window.dispatchEvent(new Event('gamepadconnected'));partyPad.buttons[9]={pressed:true,value:1};});
 await wait(()=>RoomTV.dbg().dbg.mode==='menu');await p.evaluate(()=>{partyPad.buttons[9]={pressed:false,value:0};partyPad.axes[1]=.8});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>RoomTV.dbg().dbg.ui.selection),1,'Analogue stick chooses a menu entry');await p.evaluate(()=>{partyPad.axes[1]=0;RoomTV.dbg().dbg.single('house','lamp');partyPad.buttons[0]={pressed:true,value:1};});
 await p.waitForTimeout(250);await p.evaluate(()=>partyPad.buttons[0]={pressed:false,value:0});await p.waitForTimeout(700);await p.evaluate(()=>partyPad.buttons[0]={pressed:true,value:1});await p.waitForTimeout(180);await p.evaluate(()=>partyPad.buttons[0]={pressed:false,value:0});
 await wait(()=>RoomTV.dbg().dbg.A.phase==='play');const x=await p.evaluate(()=>RoomTV.dbg().dbg.P[0].a.x);await p.evaluate(()=>partyPad.axes[0]=.8);await p.waitForTimeout(600);assert(await p.evaluate(x=>RoomTV.dbg().dbg.P[0].a.x>x+.3,x),'Analogue pad moves player');await p.evaluate(()=>{partyPad.axes[0]=0;partyPad.buttons[9]={pressed:true,value:1};});await wait(()=>RoomTV.dbg().dbg.paused);await p.screenshot({path:dir+tag+'-gamepad-pause.png'});
 await p.evaluate(()=>partyPad.buttons[9]={pressed:false,value:0});await p.waitForTimeout(150);await p.evaluate(()=>partyPad.buttons[9]={pressed:true,value:1});await wait(()=>!RoomTV.dbg().dbg.paused);await p.evaluate(()=>{delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});
 await p.keyboard.press('Escape');await wait(()=>HousePause.open);const t=(await rstate()).A.t;await p.waitForTimeout(400);assert.equal((await rstate()).A.t,t,'House Esc freezes attraction');await p.screenshot({path:dir+tag+'-escape.png'});await p.keyboard.press('Escape');
 // Foreground and background refresh reconstruct the same cartridge. Pause gives exact comparison.
 await p.keyboard.press('Enter');await wait(()=>RoomTV.dbg().dbg.paused);await p.evaluate(()=>RoomTV.dbg().dbg.flush());const old=await rstate();await p.reload({waitUntil:'domcontentloaded'});
 await wait(()=>window.RoomTV?.dbg()?.dbg?.A&&RoomTV._dbg()?.gid==='n64.party');assert.deepEqual((await rstate()).A,old.A,'Physical foreground refresh');assert((await rstate()).paused);await p.screenshot({path:dir+tag+'-room-refresh.png'});
 await p.keyboard.press('Enter');await p.keyboard.press('t');await p.waitForTimeout(450);await p.screenshot({path:dir+tag+'-room-playing.png'});await p.evaluate(()=>window.partyInstance=RoomTV.dbg());await p.keyboard.press('q');assert(await p.evaluate(()=>RoomTV.dbg()===partyInstance),'Q keeps cartridge instance');await wait(()=>House.mode==='walk'&&RoomTV._dbg().background);await p.screenshot({path:dir+tag+'-lean-back.png'});
 await p.reload({waitUntil:'domcontentloaded'});await wait(()=>window.House?.mode==='walk'&&window.RoomTV?.dbg()?.dbg?.A);assert((await rstate()).background,'Background refresh stays standing');await p.evaluate(()=>House.act('n64'));await wait(()=>RoomTV.open_);await p.keyboard.press('t');
 // Touch-capable room route: actual pointer events and reserved portrait/landscape screen space.
 assert(await p.locator('.party-controls').count());
 await p.evaluate(()=>RoomTV.dbg().dbg.single('house','lamp'));await p.waitForTimeout(700);
 const touch=async selector=>{const b=await p.locator(selector).boundingBox();assert(b);await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
 await touch('[data-party=a]');await wait(()=>RoomTV.dbg().dbg.A.phase==='play');
 for(const [width,height]of [[390,844],[844,390],[768,1024],[1366,860],[1920,1080]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(300);await p.screenshot({path:dir+tag+'-touch-'+width+'x'+height+'.png'});
  const rects=await p.evaluate(()=>{const v=document.querySelector('.rm-tvv'),s=getComputedStyle(v),n=k=>parseFloat(s.getPropertyValue(k))||0;return{width:n('--lock-width'),height:n('--lock-height'),x:n('--lock-x'),y:n('--lock-y'),pad:document.querySelector('.party-pad').getBoundingClientRect().toJSON(),a:document.querySelector('[data-party=a]').getBoundingClientRect().toJSON()};});
  assert(Math.abs(rects.width/rects.height-4/3)<.01,'LOCK IN retains native aspect');assert(rects.pad.x>=0&&rects.a.right<=width+1,'Controller stays within viewport');
 }
 const pad=await p.locator('.party-pad').boundingBox(),beforeX=await p.evaluate(()=>RoomTV.dbg().dbg.P[0].a.x);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x+pad.width-10,y:pad.y+pad.height/2,id:1}]});await p.waitForTimeout(400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await p.evaluate(x=>RoomTV.dbg().dbg.P[0].a.x>x+.2,beforeX),'On-screen direction pad moves player');
 assert.deepEqual(f.errors,[]);console.log('ROOM PASS physical TV, pad, Esc, Q/T, foreground/background refresh, touch and five sizes');await browser.close();browser=null;
}
