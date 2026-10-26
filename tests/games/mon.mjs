// Local cartridge regression. Branch fixtures use the existing debug API; decisions use real browser keys.
// The native runner advances the actual game's fixed steps without waiting on software house rendering.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
const base=process.argv.find(x=>/^http:/.test(x));
assert(base,'Supply the URL of a throwaway localhost server (PORT 18080–18099, DATA_DIR under /tmp).');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const before=process.argv.includes('--before'),tag=before?'before':'after';
const dir=fileURLToPath(new URL('../shots/games/mon/',import.meta.url));await mkdir(dir,{recursive:true});
const original=before?(process.env.MON_BASELINE?await readFile(process.env.MON_BASELINE,'utf8'):execFileSync('git',['show','HEAD:app/public/js/rm-g-mon.js'],{encoding:'utf8'})):null;
const nativeOnly=process.argv.includes('--native');
if(!before){
 const LC=createRequire(import.meta.url)('../../app/public/js/lk-crit.js');
 assert.equal(LC.NSP,60);assert.equal(LC.SP[0].b[0],45);assert.deepEqual(LC.TRADE_EVO,{10:21,11:22});
 for(const s of LC.SP){
   assert.equal(s.i,LC.SP.indexOf(s));
   for(const lv of [2,22,32,50]){
     const c={s:s.i,lv,exp:LC.expAt(lv),id:'rule1999',moves:LC.movesAt(s.i,lv)};
     assert(LC.clean(c,'QA'),'Cable referee accepts '+s.n+' at '+lv);
   }
   if(s.evo){const c={s:s.evo[1],lv:s.evo[0],exp:LC.expAt(s.evo[0]),id:'evo1999',moves:LC.movesAt(s.i,s.evo[0])};assert(LC.clean(c,'QA'),'Inherited moves remain legal for '+s.n);}
 }
 const make=(s,lv=30)=>({s,lv,exp:LC.expAt(lv),id:'link1999',moves:LC.movesAt(s,lv)});
 for(const s of LC.SP){
   const b=LC.battle([make(s.i)],[make((s.i+1)%60)]);
   for(let turn=0;turn<300&&b.over<0;turn++){const acts=[LC.auto(b,0),LC.auto(b,1)];assert(acts.every((a,i)=>LC.okAct(b,i,a)));LC.turn(b,acts,()=>0.5);}
   assert(b.over>=0,'Referee battle resolves for '+s.n);
 }
 assert.equal(LC.clean({...make(59),s:60},'QA'),null);
 console.log('RULES PASS: all 60 species, all evolution inheritances, legacy trade evolutions and 60 refereed link battles');
}
async function nativePage(browser){
 const page=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
 await page.route('**/__mon-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><head><title>Cartridge review</title><link rel="icon" href="data:,"></head><body style="background:#16251b">'}));
 if(before)await page.route('**/js/rm-g-mon.js*',route=>route.fulfill({body:original,contentType:'application/javascript'}));
 await page.goto(base+'/__mon-review');await page.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House});
 for(const src of ['cast','lk-crit','rm-tv','rm-g-mon'])await page.addScriptTag({url:base+'/js/'+src+'.js'});
 return {page,errors};
}
let browser,p,errors=[];
if(nativeOnly){browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});({page:p,errors}=await nativePage(browser));}
else {
 const fixture=await roomFixture(base,{opening:true,onPage:page=>{if(before)page.route('**/js/rm-g-mon.js*',route=>route.fulfill({body:original,contentType:'application/javascript'}))}});
 browser=fixture.browser;const page=fixture.page;
 await page.evaluate(async()=>{await Apps.load('js/rm-tv.js');House.grab('gb')});await page.keyboard.press('f');await fixture.until(()=>RoomTV.open_&&House.mode==='focus'&&!House.gliding);await page.evaluate(()=>RoomTV.test('gb.mon'));await fixture.until(()=>RoomTV._dbg()?.st==='game'&&!!RoomTV.dbg()?.dbg);
 await page.waitForTimeout(300);await page.screenshot({path:`${dir}${tag}-in-room.png`});
 await page.evaluate(()=>window.monInstance=RoomTV.dbg());await page.keyboard.press('t');assert(await page.evaluate(()=>RoomTV.lockIn()&&RoomTV.dbg()===monInstance));await page.waitForTimeout(300);await page.screenshot({path:`${dir}${tag}-lock-in.png`});
 if(!before){await page.evaluate(()=>{const b=Array.from({length:16},()=>({pressed:false,value:0}));b[9]={pressed:true,value:1};window.monPad={id:'Review standard pad',index:0,connected:true,mapping:'standard',buttons:b,axes:[0,0,0,0]};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[monPad]})});await fixture.until(()=>RoomTV.dbg().dbg.mode==='world');await page.evaluate(()=>{monPad.buttons[9]={pressed:false,value:0}});}
 await page.keyboard.press('Escape');await fixture.until(()=>HousePause.open);await page.screenshot({path:`${dir}${tag}-pause.png`});
 const frame=await page.evaluate(()=>RoomTV.dbg().frame);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>RoomTV.dbg().frame),frame,'Pause freezes the cartridge');
 await page.keyboard.press('Escape');await fixture.until(()=>!HousePause.open);await page.keyboard.press('t');assert(await page.evaluate(()=>!RoomTV.lockIn()&&RoomTV.dbg()===monInstance));
 assert.deepEqual(fixture.errors,[]);console.log('ROOM PASS: held Game Lad, same-instance LOCK IN, simulated gamepad, pause freeze');await page.close();({page:p,errors}=await nativePage(browser));
}
const frames=n=>p.evaluate(n=>review.step(n),n);
const key=async k=>{await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)};
const snapshot=()=>p.evaluate(()=>{const d=review.K.dbg,t=d.task;return{fx:!!d.B?.hitFx,cube:!!d.B?.cube,mode:d.mode,task:!!t,kind:t?.kind||(t?.draw&&String(t.draw).includes('drawText(pages')?'text':t?.draw&&String(t.draw).includes('o.under')?'menu':'wait'),items:t?.items,index:t?.index,text:t?.text,party:d.S?.party,battle:d.B&&{fi:d.B.fi,tr:d.B.tr,foe:d.B.foe,mi:d.B.mi},map:d.map.id}});
const shot=async name=>{await frames(1);await p.screenshot({path:`${dir}${tag}-${name}.png`});const data=await p.evaluate(()=>review.K.cv.toDataURL());await writeFile(`${dir}${tag}-${name}-native.png`,Buffer.from(data.split(',')[1],'base64'))};
const captured=new Set(),freshFoes=new Set();let evolutionResumeChecked=false;
async function captureOnce(name){if(!captured.has(name)){captured.add(name);await shot(name)}}
async function dialogue(limit=1000){for(let i=0;i<limit;i++){
 const s=await snapshot();if(s.kind==='menu'||!s.task)return s;
 if(s.kind==='text'){
   await frames(100);
   if(s.mode==='evo'){
     await captureOnce('evolution');
     if(!before&&!evolutionResumeChecked&&await p.evaluate(()=>!!review.K.dbg.S.beaten['qa-evolution'])){
       evolutionResumeChecked=true;assert(await p.evaluate(()=>!review.saved.value.encounter&&review.saved.value.party[0].evoPending===5),'Victory and pending evolution are saved together');await p.evaluate(()=>review.restart(true));await frames(30);continue;
     }
   }
   if(s.text?.includes('got the MOSS BADGE'))await captureOnce('moss-award');
   if(s.text?.includes('got the SPLASH BADGE'))await captureOnce('splash-award');
   if(s.text?.includes('got the SPARK BADGE'))await captureOnce('spark-award');
   if(s.text?.includes('got the KILN BADGE'))await captureOnce('kiln-award');
   if(s.text?.includes('Gotcha!'))await captureOnce('catch-result');
   if(s.text?.includes('beat LUKE'))await captureOnce('victory');
   await key('z');
 }else {await frames(6);const next=await snapshot();if(next.fx)for(let f=0;f<3;f++){await captureOnce('impact-'+f);await frames(3)}if(next.cube)for(let f=0;f<3;f++){await captureOnce('cube-'+f);await frames(3)}if(next.mode==='credits'){await captureOnce('credits');if(!captured.has('credits-middle')){await frames(220);await captureOnce('credits-middle');}}}
}throw Error('Dialogue stalled '+JSON.stringify(await snapshot()))}
async function choose(label){const s=await snapshot();assert(s.items?.includes(label),`Missing ${label}: ${JSON.stringify(s)}`);if(s.items.includes('FIGHT')){const target=s.items.indexOf(label);if(target>=2)await key('ArrowRight');if(target%2)await key('ArrowDown')}else for(let i=0;i<s.items.length&&((await snapshot()).index!==s.items.indexOf(label));i++)await key('ArrowDown');await key('z')}
async function battleWin(limit=100){for(let i=0;i<limit;i++){let s=await dialogue();if(s.mode!=='battle')return;if(s.battle.fi>0&&!freshFoes.has(s.battle.foe.id)){freshFoes.add(s.battle.foe.id);assert(await p.evaluate(()=>{const d=review.K.dbg;return d.B.foe.moves.every(m=>d.B.foe.pp[m]===d.ppMax(m))}),'A replacement foe waits until the next turn');}if(s.items?.includes('FIGHT')){await choose('FIGHT');s=await snapshot();const moves=await p.evaluate(()=>{const d=review.K.dbg;return d.S.party[d.B.mi].moves});let idx=moves.findIndex(m=>['SIZZLE','CINDER SPIT','FLARE UP','SPLOSH','BUBBLE POP','TIDAL BURP','LEAF LICK','TWIG SNAP','MOSS BLAST','ZAP','STATIC POP'].includes(m));if(idx<0)idx=0;for(let j=0;j<idx;j++)await key('ArrowDown');await key('z')}else if(s.kind==='menu')await key('z')}throw Error('Battle did not end')}
async function place(map,x,y,dir='up'){await p.evaluate(({map,x,y,dir})=>review.K.dbg.loadMap(map,x,y,dir),{map,x,y,dir});await frames(1)}
async function interact(){await key('z');return dialogue()}
try{
 // Isolated browser input avoids house hotkeys; use the exact production cartridge and pixel font.
 await p.evaluate(()=>{
   House.paused=true;
   const cv=document.createElement('canvas');cv.width=160;cv.height=144;cv.id='mon-review';
   Object.assign(cv.style,{position:'fixed',zIndex:2147483647,width:'min(90vw,100vh,800px)',height:'auto',maxHeight:'90vh',imageRendering:'pixelated',left:'50%',top:'50%',transform:'translate(-50%,-50%)',boxShadow:'0 0 0 100vmax #16251b'});document.body.append(cv);
   const held={},pressed={},saved={};const native=RoomTV.dbg()||{font:RoomTV.font,W:160,H:144};
   const K={...native,cv,g:cv.getContext('2d'),t:0,frame:0,restoring:false,load:()=>saved.value?structuredClone(saved.value):null,save:s=>{saved.value=structuredClone(s);return true},music:()=>{},over:()=>{},secret:()=>{},held:b=>!!held[b],pressed:b=>!!pressed[b],sfx:{tone(){},seq(){},noise(){}}};K.g.imageSmoothingEnabled=false;
   const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',Enter:'start',Shift:'select'};
   addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);
   addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
   // Deterministic random stream for repeatable catches and AI; no production RNG changes.
   let seed=1999;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
   window.review={K,saved,game:RoomTV.defs['gb.mon'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}this.game.draw()},restart(restoring=false,gid='gb.mon'){K.restoring=restoring;this.game=RoomTV.defs[gid].make(K);this.step(1)}};
 });
 await shot('title');if(!before){assert.equal(await p.evaluate(()=>{const d=review.K.g.getImageData(0,0,160,144).data,cols=new Set();for(let i=0;i<d.length;i+=4)cols.add(`${d[i]},${d[i+1]},${d[i+2]}`);return cols.size}),4,'Exactly four LCD shades');}for(let i=0;i<3;i++){await frames(60);await shot('attract-'+i)}
 await key('Enter');await dialogue();await shot('house');
 await place('house',1,2,'left');await p.keyboard.down('ArrowLeft');await frames(25);await p.keyboard.up('ArrowLeft');assert.equal(await p.evaluate(()=>review.K.dbg.pl.x),1,'Walls block walking');
 await place('lab',3,4);await interact();await shot('starter');await key('z');await dialogue();await shot('rival');
 if(before){await p.evaluate(()=>{const d=review.K.dbg;d.run(d.battle([d.mon(6,3)],{tr:{name:'LUKE'}}))});await dialogue();await shot('trainer');}
 else await playthrough();
 const perf=await p.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=160;cv.height=144;
   const K={...review.K,cv,g:cv.getContext('2d'),pressed:()=>false,held:()=>false,load:()=>null,save:()=>{},frame:0,t:0,restoring:false};K.g.imageSmoothingEnabled=false;
   const game=RoomTV.defs['gb.mon'].make(K);
   const sample=()=>{for(let i=0;i<80;i++){K.frame++;game.update();game.draw()}const a=[];for(let i=0;i<1200;i++){const t=performance.now();game.update();game.draw();K.frame++;a.push(performance.now()-t)}a.sort((a,b)=>a-b);return{median:a[600],p95:a[1140]}};
   const title=sample();
   const seed={v:1,map:'town',x:9,y:7,dir:'up',party:[K.dbg.mon(0,8)],box:[],bag:{CUBE:5,CAKE:1},money:300,f:{intro:1,starter:1,dex:1,rivalGone:1},seen:{0:1},caught:{0:1},beaten:{},taken:{},badges:0,play:0};
   K.load=()=>structuredClone(seed);K.restoring=true;let current=RoomTV.defs['gb.mon'].make(K);for(let i=0;i<30;i++){current.update();K.frame++}
   const take=()=>{for(let i=0;i<80;i++){current.update();current.draw()}const a=[];for(let i=0;i<1200;i++){const t=performance.now();current.update();current.draw();K.frame++;a.push(performance.now()-t)}a.sort((a,b)=>a-b);return{median:a[600],p95:a[1140]}};
   const world=take();K.dbg.run(K.dbg.battle([K.dbg.mon(6,4)],null));
   for(let i=0;i<1000;i++){const task=K.dbg.task;if(task?.kind==='menu'||task?.draw&&String(task.draw).includes('o.under'))break;K.pressed=b=>b==='a'&&i%2===0;current.update();K.frame++}K.pressed=()=>false;
   const battle=take();return {title,world,battle,resolution:[160,144],scope:'native cartridge update/draw CPU; software Chromium; excludes house'};
 });console.log(tag+' performance '+JSON.stringify(perf));await writeFile(`${dir}${tag}-performance.json`,JSON.stringify(perf,null,2));
 assert.deepEqual(errors,[]);console.log('POCKET CRITTERS '+tag+' PASS');
}finally{await browser.close()}
async function playthrough(){
 await battleWin();await dialogue();assert((await snapshot()).party.length===1);assert(await p.evaluate(()=>review.K.dbg.S.f.dex));
 // World collision and trainer sight. Facing the existing route trainer triggers its actual approach script.
 await place('route',6,9,'right');await p.keyboard.down('ArrowUp');await frames(12);await p.keyboard.up('ArrowUp');await frames(10);await shot('route');
 await place('route',6,8,'up');await p.keyboard.down('ArrowUp');await frames(15);await p.keyboard.up('ArrowUp');await frames(30);await shot('trainer-spotted');await dialogue();assert((await snapshot()).battle.tr.name==='LUKE');
 // Advance a legitimate battle with a higher-level branch fixture, exercising PP, AI, EXP and victory.
 await p.evaluate(()=>{const d=review.K.dbg;const c=d.mon(4,18);d.S.party=[c];d.B.mi=0;d.B.meHp=c.hp});await shot('trainer');await battleWin();await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.beaten.luke));const paid=await p.evaluate(()=>review.K.dbg.S.money);await interact();assert.equal(await p.evaluate(()=>review.K.dbg.S.money),paid,'Beaten trainers never pay twice');
 await key('Enter');await shot('menu');await choose('JOURNAL');await shot('journal');await key('x');await choose('CRITTERDEX');await shot('dex');await key('z');await shot('dex-entry');await key('x');await key('x');await key('x');
 // Sleep and exhaustion branch with legal species/moves, using the actual move menu.
 await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(0,8)];d.S.bag.CUBE=20;d.run(d.battle([d.mon(6,4)],null))});await dialogue();await choose('FIGHT');await shot('moves');
 await choose('SNOOZE SPORES');await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.B.foe.status),'sleep');await shot('status');
 await choose('BAG');await choose('CRITTER CUBE x20');await dialogue();
 for(let i=0;i<15&&(await snapshot()).mode==='battle';i++){await choose('BAG');const s=await snapshot();await choose(s.items.find(x=>x.startsWith('CRITTER CUBE')));await dialogue()}
 assert(await p.evaluate(()=>review.K.dbg.S.caught[6]));assert.equal((await snapshot()).party.length,2);await shot('caught');
 assert(await p.evaluate(()=>{const c=review.K.dbg.S.party[1];return !!c.id&&!!c.pp}),'Caught critter has an immediate ID and PP');
 await p.evaluate(()=>{const d=review.K.dbg,c=d.S.party[0];c.status='pong';c.pp[c.moves[0]]=0;d.S.bag.TEA=1;d.S.bag.JUICE=1});
 await key('Enter');await choose('BAG');await choose('THERMOS TEA x1');await key('z');await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.party[0].status),null);
 await choose('SQUASH x1');await key('z');await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.party[0].pp[review.K.dbg.S.party[0].moves[0]]),10);await key('x');await key('x');
 await p.evaluate(()=>{const d=review.K.dbg,c=d.S.party[0];c.hp=LkCrit.maxhp(c);c.status='pong';d.run(d.battle([d.mon(6,2)],null))});await dialogue();await choose('FIGHT');await choose('GRUMBLE');await dialogue();assert(await p.evaluate(()=>{const c=review.K.dbg.S.party[0];return c.hp<=LkCrit.maxhp(c)-Math.max(1,Math.floor(LkCrit.maxhp(c)/8))}),'Pong deals residual damage');await shot('pong');await choose('RUN');await dialogue();await p.evaluate(()=>{const c=review.K.dbg.S.party[0];c.status=null;c.hp=LkCrit.maxhp(c)});
 const kept=await p.evaluate(()=>structuredClone(review.K.dbg.S.party));
 await p.evaluate(()=>{const d=review.K.dbg;while(d.S.party.length<6)d.S.party.push(d.mon(7,5));d.S.bag.CUBE=20;const f=d.mon(7,2);f.hp=1;f.status='sleep';f.sleep=3;d.run(d.battle([f],null))});await dialogue();
 for(let i=0;i<20&&(await snapshot()).mode==='battle';i++){await choose('BAG');await choose((await snapshot()).items.find(x=>x.startsWith('CRITTER CUBE')));await dialogue()}
 assert.equal((await snapshot()).party.length,6);assert.equal(await p.evaluate(()=>review.K.dbg.S.box.length),1,'Seventh capture goes to the PC');await shot('party-overflow');await p.evaluate(kept=>{review.K.dbg.S.party=kept;review.K.dbg.S.box=[]},kept);
 // PP depletion, fallback and save/continue at a live battle command checkpoint.
 await p.evaluate(()=>{const d=review.K.dbg;const c=d.S.party[0];for(const m of c.moves)c.pp[m]=0;d.run(d.battle([d.mon(6,2)],null))});await dialogue();await choose('FIGHT');await dialogue();await shot('exhausted');
 const checkpoint=await p.evaluate(()=>structuredClone(review.saved.value));assert(checkpoint.encounter);await p.evaluate(()=>review.restart(true));await dialogue();assert.equal((await snapshot()).mode,'battle');assert.equal(await p.evaluate(()=>review.K.dbg.B.foe.id),checkpoint.encounter.foes[checkpoint.encounter.fi].id);await shot('continue-battle');
 // Run from wild battle; deliberately faster party fixture guarantees escape.
 await p.evaluate(()=>{review.K.dbg.S.party[0].lv=40});await choose('RUN');await dialogue();
 // Shop, remedies, healing centre, party storage (real object interactions).
 await place('shop',1,4);await key('ArrowUp');await interact();await shot('shop');const money=await p.evaluate(()=>review.K.dbg.S.money);await choose('BERRY CAKE 100P');await dialogue();await key('x');await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.money),money-100);
 await place('centre',3,3);await key('ArrowUp');await interact();await key('z');await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.party.every(c=>!c.status&&c.moves.every(m=>c.pp[m]===review.K.dbg.ppMax(m)))));await shot('healing');
 await place('centre',8,2);await interact();await shot('pc-box');await choose('PUT IN');await key('ArrowDown');await key('z');await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.box.length),1);await choose('TAKE OUT');await key('z');await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.box.length),0);await choose('SWITCH OFF');
 // Each region, badge leaders and evolution. Fixtures skip grinding, never skip victory logic.
 for(const [map,x,y] of [['woods',7,17],['cave',4,14],['route2',6,18],['bay',9,14]]){await place(map,x,y);await shot(map)}
 await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(4,11)];d.S.party[0].exp=LkCrit.expAt(12)-1;window.evolutionMoney=d.S.money;d.run(d.battle([d.mon(6,2)],{name:'DAVE',id:'qa-evolution',money:77}))});await dialogue();await battleWin();await dialogue();assert(evolutionResumeChecked);assert.equal(await p.evaluate(()=>review.K.dbg.S.money),await p.evaluate(()=>evolutionMoney+77));assert.equal(await p.evaluate(()=>review.K.dbg.S.party[0].s),5);await shot('evolved');
 await place('bay',9,10);await p.evaluate(()=>{review.K.dbg.S.party=[review.K.dbg.mon(0,40)];review.K.dbg.S.f.rival=0});await interact();assert.equal((await snapshot()).battle.foe.s,1,'Rival species zero evolves correctly');await shot('rival-rematch');await battleWin();await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.beaten.jackkBay));
 for(const [map,x,y,leader,badge] of [['gym',4,2,'hazel',1],['gym2',4,2,'nora',2]]){
   await place(map,x,y);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(8,45),d.mon(4,45)]});await interact();await shot(map+'-start');await battleWin();await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.badges),badge);await shot(map+'-badge');
 }
 await place('gym',4,3,'left');await interact();await key('z');await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.cleared['gym:3,3']));await shot('field-move');
 await expansion();
 // Save anywhere, additive old-save migration, and the sibling cartridge keep their own keys.
 await key('Enter');await choose('SAVE');await dialogue();const saved=await p.evaluate(()=>structuredClone(review.saved.value));await p.evaluate(()=>review.restart(true));await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.map),saved.map);assert.equal(await p.evaluate(()=>review.K.dbg.S.badges),4);
 await p.evaluate(()=>{for(const c of review.saved.value.party){delete c.pp;delete c.status}review.restart(true)});await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.party.every(c=>c.pp)));
 await key('Enter');await choose('OPTIONS');await choose('COLOUR TINTS');await key('x');await shot('colour');await key('Enter');await choose('OPTIONS');await choose('GREEN SHADES');await key('x');
 await key('Enter');await choose('PARTY');await key('z');await choose('SUMMARY');await shot('new-summary');await key('x');await key('x');await key('x');
 await key('Enter');await choose('CRITTERDEX');for(let i=0;i<59;i++)await key('ArrowDown');await shot('dex-last-page');await key('z');await shot('rare-dex-entry');await key('x');await key('x');await key('x');
 // Resize uses the same running instance and keeps a native 10:9 frame.
 for(const [width,height,name] of [[390,844,'portrait'],[844,390,'landscape'],[1920,1080,'large']]){await p.setViewportSize({width,height});const bounds=await p.locator('#mon-review').boundingBox();assert(Math.abs(bounds.width/bounds.height-10/9)<0.01);await shot(name)}
 for(let page=0;page<20;page++){
   await p.evaluate(page=>{const K=review.K,d=K.dbg,g=K.g;g.fillStyle='#d8e8a8';g.fillRect(0,0,160,144);K.font.draw(g,'CRITTER PORTRAITS '+(page+1),4,2,'#203828');for(let row=0;row<3;row++){const s=page*3+row;if(s>=60)break;g.drawImage(d.sprite(s),2,14+row*42);g.drawImage(d.spriteF(s),40,14+row*42);K.font.draw(g,String(s+1).padStart(3,'0'),78,17+row*42,'#203828');const name=d.SP[s].n;K.font.draw(g,name,78,29+row*42,'#203828');}},page);
   const data=await p.evaluate(()=>review.K.cv.toDataURL());await writeFile(`${dir}after-portraits-${page}.png`,Buffer.from(data.split(',')[1],'base64'));
 }
 const atlas=await p.evaluate(()=>{const d=review.K.dbg,c=document.createElement('canvas');c.width=1344;c.height=704;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#d8e8a8';g.fillRect(0,0,c.width,c.height);['route3','fuse','gym3','route4','tunnel','kiln','gym4','depot'].forEach((id,i)=>{const m=d.MAPS[id],ox=i%4*336+8,oy=Math.floor(i/4)*352+20;review.K.font.draw(g,m.name,ox,oy-14,'#203828');for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)g.drawImage(d.tileArt(m.rows[y][x],0),ox+x*16,oy+y*16);for(const n of d.NPCS[id]||[]){if(n.rare!=null)g.drawImage(d.sprite(n.rare),ox+n.x*16,oy+n.y*16,16,16);else if(n.st)g.drawImage(d.person(n.st,n.dir||'down',0),ox+n.x*16,oy+n.y*16-4);}});return c.toDataURL()});await writeFile(`${dir}after-region-atlas.png`,Buffer.from(atlas.split(',')[1],'base64'));
 const sheet=await p.evaluate(()=>{const d=review.K.dbg,c=document.createElement('canvas');c.width=960;c.height=900;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#d8e8a8';g.fillRect(0,0,960,900);for(let s=0;s<60;s++){const x=s%6*160,y=Math.floor(s/6)*90;review.K.font.draw(g,String(s+1).padStart(3,'0')+' '+d.SP[s].n,x+3,y+2,'#203828');g.drawImage(d.sprite(s),x+3,y+17,64,64);g.drawImage(d.spriteF(s),x+80,y+17,64,64);}return c.toDataURL()});await writeFile(`${dir}after-roster-contact.png`,Buffer.from(sheet.split(',')[1],'base64'));
 await p.evaluate(()=>{review.saved.value=null;review.restart(false,'gb.mon2')});await shot('puddle-title');await key('Enter');await dialogue();assert.equal((await snapshot()).mode,'world');
}

async function expansion(){
 assert.equal(await p.evaluate(()=>LkCrit.NSP),60);
 assert.deepEqual(await p.evaluate(()=>{
   const d=review.K.dbg,front=new Set(),back=new Set(),issues=[],palette=new Set(['216,232,168','168,191,104','96,120,72','32,56,40']);
   for(let s=0;s<60;s++)for(const [kind,cv]of [['front',d.sprite(s)],['rear',d.spriteF(s)]]){
     const set=kind==='front'?front:back,uri=cv.toDataURL();if(set.has(uri))issues.push('duplicate '+kind+' '+s);set.add(uri);
     const data=cv.getContext('2d').getImageData(0,0,32,32).data;
     for(let k=0;k<data.length;k+=4)if(data[k+3]&&!palette.has([data[k],data[k+1],data[k+2]].join(','))){issues.push('non LCD shade '+s);break;}
   }return issues;
 }),[],'All 120 portraits are distinct and four-shade');
 const structure=await p.evaluate(()=>{
   const d=review.K.dbg,issues=[];
   const solid=t=>d.SOLID.has(t);
   for(const [id,m] of Object.entries(d.MAPS).filter(([id])=>['route3','fuse','gym3','route4','tunnel','kiln','gym4','depot','centre3','shop3','centre4','shop4','fusehouse','kilnhouse'].includes(id))){
     for(const row of m.rows)if(row.length!==m.w)issues.push(id+' row width '+row.length+' expected '+m.w);
     for(const n of d.NPCS[id]||[])if(solid(m.rows[n.y]?.[n.x]))issues.push(id+' NPC '+n.id+' on '+m.rows[n.y]?.[n.x]);
     // Every door, warp and NPC must have an approach path from the entrance.
     const entries=d.WARPS.filter(w=>w[3]===id), reached=new Set(),queue=entries.length?[[entries[0][4],entries[0][5]]]:[];
     while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(reached.has(key)||x<0||y<0||x>=m.w||y>=m.h||solid(m.rows[y][x]))continue;reached.add(key);for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]])queue.push([x+dx,y+dy]);}
     for(const n of d.NPCS[id]||[])if(![[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>reached.has((n.x+dx)+','+(n.y+dy))))issues.push(id+' unreachable '+n.id);
     for(const w of d.WARPS.filter(w=>w[0]===id))if(!reached.has(w[1]+','+w[2]))issues.push(id+' unreachable warp '+w.slice(1,4));
   }return issues;
 });assert.deepEqual(structure,[],'New maps are coherent and all services reachable');
 // Enter the expansion using a genuine edge warp, with both old badges retained.
 await place('bay',16,7,'right');await key('ArrowRight');await frames(30);await dialogue();assert.equal((await snapshot()).map,'route3');await shot('peg-path-start');
 // Persistent roadblock: refresh at a trainer command, then win through real commands.
 await place('route3',9,7);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(30,45)]});await interact();assert.equal((await snapshot()).battle.tr.id,'pocketPeg');await shot('team-pocket-intro');
 await p.evaluate(()=>review.restart(true));await dialogue();assert.equal((await snapshot()).battle.tr.id,'pocketPeg');await battleWin();await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.beaten.pocketPeg));assert(!await p.evaluate(()=>review.K.dbg.npcs.some(n=>n.id==='pocketPeg')));await shot('pocket-road-cleared');
 await place('route3',9,5,'down');await key('ArrowDown');await frames(10);assert.equal(await p.evaluate(()=>review.K.dbg.pl.y),6,'Defeated scout no longer blocks the narrow path');await dialogue();
 // Gym 3 route gate, safe gym wiring and late-game services.
 await place('fuse',9,1);await key('ArrowUp');await frames(20);await dialogue();assert.equal((await snapshot()).map,'fuse');await shot('moor-badge-gate');
 for(const [map,x,y]of [['fuse',9,7],['gym3',5,11],['route4',9,13],['tunnel',9,12],['kiln',9,7],['depot',6,13]]){await place(map,x,y);await shot(map+'-overview')}
 await place('route4',9,8,'up');await key('ArrowUp');await frames(12);assert.equal(await p.evaluate(()=>review.K.dbg.pl.y),8,'Bare cable blocks before INSULATE');await interact();await shot('cable-warning');
 await place('gym3',5,2);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(30,45),d.mon(24,45)]});await interact();await shot('gym3-start');await battleWin();await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.badges),3);assert(await p.evaluate(()=>review.saved.value.f.badge3));
 await place('route4',9,8,'up');await key('ArrowUp');await frames(10);assert.equal(await p.evaluate(()=>review.K.dbg.pl.y),7,'INSULATE unlocks the cable shortcut');await shot('insulated-crossing');
 await p.evaluate(()=>review.restart(true));await dialogue();assert.equal((await snapshot()).map,'route4');assert.equal(await p.evaluate(()=>review.K.dbg.pl.y),7,'Refresh retains position on the cable');
 await place('tunnel',9,11);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(24,45)]});await interact();await shot('tunnel-blockade');await battleWin();await dialogue();assert(await p.evaluate(()=>review.K.dbg.S.beaten.pocketTunnel));
 await place('kiln',4,11);await key('ArrowUp');await frames(20);await dialogue();assert.equal((await snapshot()).map,'kiln','Stolen regulator closes gym');await shot('regulator-gate');
 await place('kiln',9,13);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(30,45),d.mon(24,45)]});await interact();await shot('rival-kiln');assert.equal((await snapshot()).battle.foe.lv,28);await battleWin();await dialogue();
 await place('depot',6,3);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(24,45),d.mon(30,45)]});await interact();await shot('pocket-lieutenant');
 await p.evaluate(()=>review.restart(true));await dialogue();await battleWin();await dialogue();assert(await p.evaluate(()=>review.saved.value.beaten.pocketBoss));const paid=await p.evaluate(()=>review.K.dbg.S.money);await interact();assert.equal(await p.evaluate(()=>review.K.dbg.S.money),paid,'Regulator recovery never pays twice');await shot('depot-recovered');
 await place('kiln',4,11);await key('ArrowUp');await frames(25);await dialogue();assert.equal((await snapshot()).map,'gym4','Recovered regulator opens gym');
 await place('gym4',5,2);await p.evaluate(()=>{const d=review.K.dbg;d.S.party=[d.mon(24,45),d.mon(30,45)]});await interact();await shot('gym4-start');await battleWin();await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.badges),4);assert(captured.has('credits'),'Chapter credits occur after fourth badge');await shot('chapter-complete');
 // Clockmaker gift is committed before its dialogue and unique across refresh.
 await place('kilnhouse',6,4);await key('z');assert(await p.evaluate(()=>review.saved.value.f.windingKey));const cubes=await p.evaluate(()=>review.saved.value.bag.CUBE);await p.evaluate(()=>review.restart(true));await dialogue();await interact();assert.equal(await p.evaluate(()=>review.K.dbg.S.bag.CUBE),cubes);await shot('clockmaker-hunt');
 await place('tunnel',16,2);await interact();if((await snapshot()).items?.includes('YES')){await choose('YES');await dialogue();}assert.equal((await snapshot()).battle.foe.s,59);await shot('alarmageddon');
 await p.evaluate(()=>{const d=review.K.dbg;d.B.foe.hp=1;d.B.foe.status='sleep';d.B.foe.sleep=3;d.S.bag.CUBE=99});
 for(let i=0;i<40&&(await snapshot()).mode==='battle';i++){await choose('BAG');await choose((await snapshot()).items.find(x=>x.startsWith('CRITTER CUBE')));await dialogue()}
 assert(await p.evaluate(()=>review.K.dbg.S.caught[59]),'Legend can be captured');await shot('rare-caught');await p.evaluate(()=>review.restart(true));await dialogue();assert(!await p.evaluate(()=>review.K.dbg.npcs.some(n=>n.rare===59)),'Caught rare stays gone after refresh');
 // Full pair evolution and third-stage starter, through actual EXP/evolution tasks.
 for(const [species,level,into]of [[29,21,30],[1,31,23]]){
   await p.evaluate(({species,level})=>{const d=review.K.dbg,c=d.mon(species,level);c.exp=LkCrit.expAt(level+1)-1;d.S.party=[c];d.run(d.battle([d.mon(6,2)],null))},{species,level});await dialogue();await battleWin();await dialogue();assert.equal(await p.evaluate(()=>review.K.dbg.S.party[0].s),into);await shot('new-evolution-'+into);
 }
 // A pre-expansion two-badge save keeps its exact team/IDs, money, map and position.
 const current=await p.evaluate(()=>structuredClone(review.saved.value));
 await p.evaluate(()=>{const s=review.saved.value;s.badges=2;delete s.f.badge3;delete s.f.badge4;delete s.f.badgeAt;s.map='bay';s.x=10;s.y=8;s.dir='left';window.legacyMon=structuredClone(s);review.restart(true)});await dialogue();
 assert.deepEqual(await p.evaluate(()=>{const s=review.K.dbg.S;return{s:s.party,m:s.money,map:s.map,x:s.x,y:s.y,b:s.badges}}),await p.evaluate(()=>{const s=legacyMon;return{s:s.party,m:s.money,map:s.map,x:s.x,y:s.y,b:2}}));await shot('legacy-continued');
 await p.evaluate(current=>{review.saved.value=current;review.restart(true)},current);await dialogue();
 console.log('EXPANSION PASS: 60 species, 4 gyms, map connectivity, gates, Team Pocket, rival, legend, evolution, v1 migration');
}
