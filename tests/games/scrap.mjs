// Original production cartridge, real keys, bounded fight fixtures; no live data.
// node tests/games/scrap.mjs [--baseline] [--native] [--quick]
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadavg} from 'node:os';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),baseline=process.argv.includes('--baseline'),label=baseline?'before':'after';
const shots=root+'tests/shots/games/scrap/'+label+'/',port=+(process.env.SCRAP_PORT||18091);
assert(port>=18080&&port<=18099);
let server,browser,data,log='',page;const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function cleanup(){if(browser){await browser.close().catch(()=>{});browser=null}if(server?.exitCode===null){const ended=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');const timer=setTimeout(()=>server.kill('SIGKILL'),1500);await ended;clearTimeout(timer)}if(data)await rm(data,{recursive:true,force:true})}
const watchdog=setTimeout(()=>{console.error('SCRAP timeout');void cleanup().finally(()=>process.exit(1))},600000);
for(const sig of ['SIGTERM','SIGINT'])process.once(sig,()=>void cleanup().finally(()=>process.exit(1)));
if(process.argv.includes('--sheets')){
 try{browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});const ids=(await readdir(shots)).map(f=>/^ending-([a-z]+)-0-native\.png$/.exec(f)?.[1]).filter(Boolean).sort();assert.equal(ids.length,12);await endingSheets(ids);console.log('ENDING SHEETS PASS');}finally{clearTimeout(watchdog);await cleanup()}process.exit(0);
}
try{
 data=await mkdtemp('/tmp/jhp-scrap-');await mkdir(shots,{recursive:true});
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<100&&server.exitCode===null,log);await delay(100)}
 const base='http://127.0.0.1:'+port;console.log('Disposable server ready');
 if(!process.argv.includes('--room-only')){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1366,height:860}});observe(page);
 await page.route('**/__scrap-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="margin:0;background:#101018">'}));
 if(baseline)await page.route('**/js/rm-g-scrap.js',async r=>r.fulfill({contentType:'application/javascript',body:await readFile('/tmp/scrap-before.js','utf8')}));
 await page.goto(base+'/__scrap-review');await page.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House;window.Apps={load:()=>Promise.resolve()}});
 for(const file of['js/cast.js','js/rm-tv.js','js/rm-g-scrap.js'])await page.addScriptTag({url:base+'/'+file});
 await page.evaluate(()=>{
  Cast.bind('scrapreview',{first:'Pip',g:'m'});let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const cv=document.createElement('canvas');cv.width=256;cv.height=224;cv.style.cssText='position:fixed;width:min(100vw,100vh * 4 / 3);height:min(75vw,100vh);left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated';document.body.append(cv);
  const held={},pressed={},text=[];const font={...RoomTV.font,draw(g,s,x,y,col,k,shadow){if(!window.review?.benchmark){const tr=g.getTransform(),p=new DOMPoint(x,y).matrixTransform(tr);text.push({s:String(s),x:p.x,y:p.y,k:k||1,w:RoomTV.font.width(String(s),k||1)*tr.a,h:7*(k||1)*tr.d});}return RoomTV.font.draw(g,s,x,y,col,k,shadow)},center(g,s,cx,y,col,k,shadow){return this.draw(g,s,cx-this.width(s,k)/2,y,col,k,shadow)}};
  const K={W:256,H:224,cv,g:cv.getContext('2d',{willReadFrequently:true}),font,frame:0,t:0,best:0,restoring:false,label:b=>b.toUpperCase(),keyLabel:b=>({a:'Z',b:'X',x:'C',y:'V',l:'U',r:'E',start:'ENTER'}[b]||b.toUpperCase()),load:()=>JSON.parse(localStorage.getItem('scrap-review')||'null'),save(s){const json=JSON.stringify(s);localStorage.setItem('scrap-review',json);if(window.review)review.maxCardBytes=Math.max(review.maxCardBytes||0,json.length);return true},resume(){this.restoring=false},music(){},sfx:{tone(){},noise(){},seq(){}},secret(id){review.secrets.push(id)},over(s,o){review.result={s,...o}},held:b=>!!held[b],pressed:b=>!!pressed[b],any:()=>Object.values(pressed).some(Boolean)};
  const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',c:'x',v:'y',u:'l',e:'r',Enter:'start',Shift:'select'};
  addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
  window.review={K,text,held,secrets:[],game:RoomTV.defs['sn.fight'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}text.length=0;this.game.draw()},restart(){this.game.end();K.restoring=true;this.game=RoomTV.defs['sn.fight'].make(K);this.step(0)}};
 });
 const until=async fn=>{for(let i=0;i<300;i++){assert.deepEqual(errors,[]);if(await page.evaluate(fn))return;await frames(15)}throw Error('Timeout '+fn)};
 const scene=()=>page.evaluate(()=>review.K.dbg.scene);
 async function versus(a='kenji',b='barry',stage='pier',mode='training'){
  await page.evaluate(({a,b,stage,mode})=>review.K.dbg.vs(a,b,stage,mode),{a,b,stage,mode});await until(()=>review.K.dbg.scene==='fight');await until(()=>review.K.dbg.fight.state==='fight');
 }
 await frames(65);await shot('title');await key('Enter');await shot('menu');await key('Enter');assert.equal(await scene(),'select');await shot('select');
 await key('v');await until(()=>review.K.dbg.scene==='map');await shot('map');await frames(40);await key('Enter');await until(()=>review.K.dbg.scene==='vs');await shot('versus');await until(()=>review.K.dbg.scene==='fight');await until(()=>review.K.dbg.fight.state==='fight');await shot('fight-start');
 await hold('ArrowRight',25);for(const k of ['v','c','u','x','z','e']){await key(k);await frames(12)}await shot('combat');
 await key('Enter');const frozen=await page.evaluate(()=>review.K.dbg.fight.t);await frames(20);assert.equal(await page.evaluate(()=>review.K.dbg.fight.t),frozen);await shot('pause');await key('ArrowDown');await key('v');await shot('moves');await key('v');await key('Enter');
 await versus();await page.keyboard.down('ArrowDown');await frames(3);await page.keyboard.down('ArrowRight');await frames(3);await page.keyboard.up('ArrowDown');await key('v');await page.keyboard.up('ArrowRight');
 assert.equal(await page.evaluate(()=>review.K.dbg.fight.lastSp),'SPIRIT BALL');await shot('motion-special');for(let i=0;i<4;i++){await frames(6);await shot('sequence-special-'+i)}
 await hold('ArrowRight',50);await key('u');await frames(10);assert(await page.evaluate(()=>review.K.dbg.fight.lastDmg>0),'Real motion and normal attacks must damage the practice opponent');await shot('collision');for(let n=0;n<3;n++){await frames(5);await shot('sequence-collision-'+n)}
 const perf=await page.evaluate(()=>{review.benchmark=true;const samples=[];for(let i=0;i<300;i++){const t=performance.now();review.step(1);review.K.g.getImageData(0,0,1,1);if(i>=60)samples.push(performance.now()-t)}samples.sort((a,b)=>a-b);review.benchmark=false;return{native:[256,224],scope:'Production training update + draw + one-pixel canvas readback, excludes house',mean:samples.reduce((s,v)=>s+v,0)/samples.length,p50:samples[120],p95:samples[228],max:samples[239]}});
 perf.hostLoad=loadavg();await writeFile(shots+'performance.json',JSON.stringify(perf,null,2));console.log('PERFORMANCE '+JSON.stringify(perf));
 if(!process.argv.includes('--quick'))for(const[a,b,stage]of [['kenji','kenji','tokyo'],['barry','barry','pier'],['luana','luana','rio'],['olga','olga','rink'],['kip','kip','safari'],['gaston','gaston','paris'],['hank','hank','rodeo'],['mei','mei','market'],['kenji','baron','airship']]){await versus(a,b,stage);await shot('arena-'+stage);await frames(50);await shot('arena-'+stage+'-mid')}
 await page.evaluate(()=>review.K.dbg.go('demo'));await until(()=>review.K.dbg.scene==='fight');await frames(200);await shot('attract');for(let n=0;n<3;n++){await frames(12);await shot('sequence-ai-'+n)}
 if(!baseline){
  await versus();await page.keyboard.down('ArrowRight');await frames(3);await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowDown');await frames(3);await page.keyboard.down('ArrowRight');await frames(3);await key('v');await page.keyboard.up('ArrowDown');await page.keyboard.up('ArrowRight');assert.equal(await page.evaluate(()=>review.K.dbg.fight.lastSp),'SKY FIST');await frames(8);assert(await page.evaluate(()=>review.K.dbg.fight.P1.y<0),'Documented rising motion must launch the fighter');await shot('motion-rising-special');
  console.log('Real CPU bout, blocking, chip and projectile clashes');
  await versus('kenji','barry','pier','duel');await page.evaluate(()=>review.K.dbg.fight.P2.ai.lvl=.14);await shot('cpu-bout-start');
  for(let i=0;i<180&&await page.evaluate(()=>!review.K.dbg.fight.over);i++){
   await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowRight');
   const dir=await page.evaluate(()=>review.K.dbg.fight.P2.x>review.K.dbg.fight.P1.x?'ArrowRight':'ArrowLeft');await page.keyboard.down(dir);await key('u');await frames(32);
   if(i===12||i===30)await shot('cpu-bout-mid-'+i);
   if(await page.evaluate(()=>review.K.dbg.scene==='fight'&&review.K.dbg.fight.state==='ko'&&review.K.dbg.fight.P1.wins>=2&&review.K.dbg.fight.winPosed&&review.K.dbg.fight.st-review.K.dbg.fight.winPosed>20))await shot('cpu-bout-finish');
  }
  await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowRight');assert(await page.evaluate(()=>review.K.dbg.fight.over),'A real-input CPU bout must conclude');assert(await page.evaluate(()=>review.K.dbg.fight.P1.hitsLanded>0),'Real buttons must land attacks');console.log('REAL CPU BOUT '+JSON.stringify(await page.evaluate(()=>({player:review.K.dbg.fight.P1.wins,cpu:review.K.dbg.fight.P2.wins,hits:review.K.dbg.fight.P1.hitsLanded}))));
  await versus();await page.evaluate(()=>{const m=review.K.dbg.fight;m.P1.x=250;m.P2.x=290;m.dummy='block'});await key('c');await frames(4);assert.equal(await page.evaluate(()=>review.K.dbg.fight.P2.st),'block');assert.equal(await page.evaluate(()=>review.K.dbg.fight.P2.hp),1000);await shot('normal-block');
  await versus();await page.evaluate(()=>review.K.dbg.fight.dummy='block');await page.keyboard.down('ArrowDown');await frames(3);await page.keyboard.down('ArrowRight');await frames(3);await page.keyboard.up('ArrowDown');await key('v');await page.keyboard.up('ArrowRight');for(let i=0;i<15&&await page.evaluate(()=>review.K.dbg.fight.P2.hp===1000);i++)await frames(3);const chip=await page.evaluate(()=>1000-review.K.dbg.fight.P2.hp);assert(chip>0&&chip<=30,'Blocked special should deal small chip damage');await shot('special-chip');
  await versus('kenji','kenji','tokyo');await page.evaluate(()=>{review.K.dbg.sp(0,'ball',0);review.K.dbg.sp(1,'ball',0)});await frames(28);assert(await page.evaluate(()=>review.K.dbg.fight.proj.length===0&&review.K.dbg.fight.fx.some(f=>f.k==='bspark')),'Fireballs must clash');await shot('fireball-clash');
  console.log('Cast, options and saved legacy card');
  assert(await page.evaluate(()=>{const names=['me','mate1','mate2','mate3','mate4','sister'].map(id=>Cast.n(id).toUpperCase());return review.K.dbg.characters.every(c=>names.includes(c.name))}));
  await page.evaluate(()=>review.K.dbg.go('title'));await key('Enter');for(let i=0;i<8&&await page.evaluate(()=>review.K.dbg.state.items[review.K.dbg.state.menu][1]!=='options');i++)await key('ArrowDown');await key('v');assert.equal(await scene(),'options');await shot('options');await key('ArrowRight');assert.equal(await page.evaluate(()=>review.K.dbg.save.options.difficulty),5);await key('ArrowLeft');await key('ArrowDown');await key('ArrowRight');assert.equal(await page.evaluate(()=>review.K.dbg.save.options.time),60);await key('ArrowRight');await key('Shift');
  const originalCard=await page.evaluate(()=>JSON.parse(JSON.stringify(review.K.dbg.save)));
  const legacy={hi:[{n:'OLD SAVE',s:41000,c:'kenji'},...originalCard.hi.slice(1)],champs:['kenji'],run:{c:'kenji',alt:false,ladder:['barry','luana','olga','kip','gaston','hank','mei','baron'],i:2,score:1234,bonus:0,conts:1},extra:{kept:1999}};
  await page.evaluate(s=>{review.game.end();localStorage.setItem('scrap-review',JSON.stringify(s));review.game=RoomTV.defs['sn.fight'].make(review.K);review.step(0)},legacy);
  assert.equal(await page.evaluate(()=>review.K.dbg.save.hi[0].n),'OLD SAVE');assert.equal(await page.evaluate(()=>review.K.dbg.save.run.score),1234);assert.equal(await page.evaluate(()=>review.K.dbg.save.extra.kept),1999);await key('Enter');await key('Enter');await frames(40);await key('Enter');await until(()=>review.K.dbg.scene==='fight'&&review.K.dbg.fight.state==='fight');assert(Math.abs((await page.evaluate(()=>review.K.dbg.fight.P2.ai.lvl))-.34)<.0001,'Legacy ladder keeps its original difficulty curve');assert.equal(await page.evaluate(()=>review.K.dbg.fight.timer),99);await shot('legacy-continue');
  await page.evaluate(()=>{review.game.end();localStorage.setItem('scrap-review',JSON.stringify({}));review.game=RoomTV.defs['sn.fight'].make(review.K);review.step(1)});
  async function refreshExact(name){
   const before=await page.evaluate(()=>{review.K.dbg.checkpoint();return {fight:review.K.dbg.fight.snapshot(),paused:review.K.dbg.paused,run:JSON.parse(JSON.stringify(review.K.dbg.run))}});
   if(name==='projectile'){
    await page.evaluate(()=>review.game.end());await page.addScriptTag({url:base+'/js/rm-g-scrap.js?cold-restore=1'});
    await page.evaluate(()=>{review.K.restoring=true;review.game=RoomTV.defs['sn.fight'].make(review.K);review.step(1)});assert.equal(await scene(),'vs');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('scrap-review')).session.n),'fight','Cold sprite loading must retain the original fight checkpoint');
   }
   await page.evaluate(()=>review.restart());
   await page.evaluate(()=>{for(let i=0;i<1500&&review.K.dbg.scene!=='fight';i++)review.step(1);review.step(0)});
   assert.equal(await scene(),'fight');
   const after=await page.evaluate(()=>({fight:review.K.dbg.fight.snapshot(),paused:review.K.dbg.paused,run:JSON.parse(JSON.stringify(review.K.dbg.run))}));
   assert.deepEqual(after,before,'Exact '+name+' checkpoint');await shot('refresh-'+name);
  }
  await versus();await page.evaluate(()=>review.K.dbg.sp(0,'ball',1));await frames(13);assert(await page.evaluate(()=>review.K.dbg.fight.proj.length>0));await refreshExact('projectile');
  await key('Enter');await refreshExact('paused');await key('Enter');
  await versus('barry','kenji');await page.evaluate(()=>{const m=review.K.dbg.fight;m.P1.x=230;m.P2.x=260;review.K.dbg.sp(0,'pierdriver',1)});await frames(15);assert(await page.evaluate(()=>review.K.dbg.fight.P2.thr?.by===review.K.dbg.fight.P1));await refreshExact('throw');await frames(65);
  await page.evaluate(()=>review.K.dbg.go('select',{mode:'train'}));await key('ArrowRight');await key('z');await frames(12);await page.evaluate(()=>review.restart());assert.equal(await scene(),'select');assert.equal(await page.evaluate(()=>review.K.dbg.state.cur),1);await frames(40);assert(await page.evaluate(()=>review.K.dbg.state.second));await shot('refresh-select');
  // Both player choices and the venue menu use ordinary keys.
  await page.evaluate(()=>review.K.dbg.go('select',{mode:'duel'}));await key('v');await frames(45);await key('ArrowRight');await key('v');await frames(45);assert.equal(await scene(),'venue');await shot('venue');await key('ArrowRight');await key('ArrowDown');await key('Enter');await until(()=>review.K.dbg.scene==='fight'&&review.K.dbg.fight.state==='fight');
  assert(await page.evaluate(()=>review.K.dbg.fight.human2&&!review.K.dbg.fight.P2.ai));const px=await page.evaluate(()=>review.K.dbg.fight.P2.x);await hold('j',10);assert((await page.evaluate(()=>review.K.dbg.fight.P2.x))<px);await key('1');await frames(3);assert(await page.evaluate(()=>review.K.dbg.fight.P2.atk));await shot('local-versus');await refreshExact('versus');
  // Second standard pad, separate from P1. Real polling, disconnect releases.
  await page.evaluate(()=>{window.scrapPads=[0,1].map(index=>({id:'Standard review pad',mapping:'standard',connected:true,index,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))}));Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>scrapPads});scrapPads[1].axes[0]=.8;});
  await frames(35);assert(await page.evaluate(()=>review.K.dbg.fight.P2.st==='walkb'||review.K.dbg.fight.P2.st==='walk'));await page.evaluate(()=>{scrapPads[1].connected=false});await frames(3);assert.equal(await page.evaluate(()=>review.K.dbg.fight.P2.st),'idle');await shot('pad2-disconnect');
  async function winMatch(){for(let round=0;round<3&&await scene()==='fight';round++){await until(()=>review.K.dbg.scene!=='fight'||review.K.dbg.fight.state==='fight');if(await scene()!=='fight')break;await page.evaluate(()=>review.K.dbg.win());await frames(1);await shot('ko-'+round);for(let n=0;n<70&&await scene()==='fight'&&await page.evaluate(()=>review.K.dbg.fight.state!=='fight');n++)await frames(15)}}
  await winMatch();assert.equal(await scene(),'duelres');await shot('duel-results');await frames(35);await key('v');assert.equal(await scene(),'vs');
  // New complete eleven-fight ladder; wins use the real round and match end
  // state machine, with bounded K.O. fixtures rather than an autoplay boast.
  await page.evaluate(()=>review.K.dbg.arcade('kenji'));assert.equal(await page.evaluate(()=>review.K.dbg.run.ladder.length),11);assert.equal(await page.evaluate(()=>review.K.dbg.run.difficultyScale),8);await shot('ladder');
  await frames(40);await key('Enter');await until(()=>review.K.dbg.scene==='fight'&&review.K.dbg.fight.state==='fight');await frames(55);await key('Enter');
  const parked=await page.evaluate(()=>review.K.dbg.fight.snapshot());await key('ArrowDown');await key('ArrowDown');await key('v');assert.equal(await scene(),'title');assert(await page.evaluate(()=>!!review.K.dbg.save.suspended));await key('Enter');await key('Enter');await page.evaluate(()=>{for(let i=0;i<1500&&review.K.dbg.scene!=='fight';i++)review.step(1)});assert(await page.evaluate(()=>review.K.dbg.paused));assert.deepEqual(await page.evaluate(()=>review.K.dbg.fight.snapshot()),parked);await shot('save-and-title');await key('Enter');
  let wins=0,bonuses=0;
  for(let guard=0;guard<150;guard++){
   const n=await scene();
   if(n==='ending')break;
   if(n==='map'||n==='quote'){await frames(55);await key('Enter');}
   else if(n==='vs'){await until(()=>review.K.dbg.scene==='fight');}
   else if(n==='fight'){
    await until(()=>review.K.dbg.fight.state==='fight');
    if(await page.evaluate(()=>!!review.K.dbg.fight.P2.fridge)){
     assert.equal(await page.evaluate(()=>review.K.dbg.fight.timer),30);await shot('bonus-'+bonuses+'-start');await refreshExact('bonus-'+bonuses);await page.evaluate(()=>review.K.dbg.win());await frames(15);await shot('bonus-'+bonuses+'-clear');await until(()=>review.K.dbg.scene==='bonusres');await shot('bonus-'+bonuses+'-results');bonuses++;await frames(50);await key('Enter');
    }else{await winMatch();wins++;assert.equal(await scene(),'quote');await shot('ladder-win-'+wins);}
   }else throw Error('Unexpected arcade scene '+n);
  }
  assert.equal(wins,11);assert.equal(bonuses,2);assert.equal(await scene(),'ending');assert(await page.evaluate(()=>review.K.dbg.save.champs.includes('kenji')));assert(await page.evaluate(()=>review.secrets.includes('lk.scrap.champ')&&review.secrets.includes('lk.scrap.perfect')));await shot('ending-0');
  await page.evaluate(()=>review.restart());assert.equal(await scene(),'ending');for(let i=0;i<3;i++){await frames(40);await key('Enter');await shot('ending-'+(i+1))}assert.equal(await scene(),'staff');await frames(300);await shot('credits');await key('Enter');assert.equal(await scene(),'entry');await shot('score-entry');await key('Enter');assert.equal(await scene(),'hiscores');await shot('highscores');await frames(25);await key('Enter');assert.equal(await page.evaluate(()=>review.result.title),'WORLD SCRAPPER!');const receipt=await page.evaluate(()=>JSON.parse(JSON.stringify(review.result)));await page.evaluate(()=>review.restart());assert.deepEqual(await page.evaluate(()=>review.result),receipt,'Finished score receipt must survive refresh');assert(await page.evaluate(()=>review.K.restoring),'Receipt restore must not start a new scoring window');
  // Champion crew is earned by the completed ladder, and survives a restart.
  await page.evaluate(()=>{review.game.end();review.K.restoring=false;review.game=RoomTV.defs['sn.fight'].make(review.K);review.K.dbg.go('select',{mode:'arcade'});review.step(0)});await key('Shift');assert(await page.evaluate(()=>review.K.dbg.state.bossPage));await shot('promoters-unlocked');
  for(const id of ['biff','velvet','chai','baron']){const c=await page.evaluate(id=>review.K.dbg.characters.find(c=>c.id===id),id);await versus(id,'kenji',c.stage);await frames(60);await shot('promoter-'+id);await page.evaluate(id=>{const names={biff:'parcel',velvet:'mopslide',chai:'teaball',baron:'blaster'};review.K.dbg.sp(0,names[id],1)},id);await frames(12);await shot('promoter-'+id+'-special');}
  // Actual document reload, with local card contents retained.
  // Champion costume completion must also award its own championship when
  // the player's costume is excluded from the final opponent list.
  await page.evaluate(()=>review.K.dbg.arcade('baron',10));await frames(50);await key('Enter');await until(()=>review.K.dbg.scene==='fight'&&review.K.dbg.fight.state==='fight');await winMatch();await frames(55);await key('Enter');assert.equal(await scene(),'ending');assert(await page.evaluate(()=>review.K.dbg.save.champs.includes('baron')));
  if(!process.argv.includes('--quick'))for(const id of await page.evaluate(()=>review.K.dbg.characters.map(c=>c.id))){
   await page.evaluate(id=>{review.K.dbg.arcade(id);review.K.dbg.run.i=review.K.dbg.run.ladder.length;review.K.dbg.go('ending')},id);
   for(let n=0;n<3;n++){await frames(140);await shot('ending-'+id+'-'+n);assert(await page.evaluate(()=>review.text.filter(t=>t.y>=16&&t.y<66).every(t=>t.y+t.h<=66&&t.x>=8&&t.x+t.w<=248&&!/[{}]/.test(t.s))),'Full ending paragraph fits: '+id+' '+n);await key('Enter');}
  }
  if(!process.argv.includes('--quick'))await endingSheets(await page.evaluate(()=>review.K.dbg.characters.map(c=>c.id)));
  await page.evaluate(()=>review.K.dbg.checkpoint());
 }
 assert.deepEqual(errors,[]);if(!baseline){const bytes=await page.evaluate(()=>review.maxCardBytes);assert(bytes<20000,'Cartridge must stay in roaming save budget');console.log('MAX CARD BYTES '+bytes);}await browser.close();browser=null;page=null;
 }
 if(!process.argv.includes('--native')){
  const account='Scrap'+Date.now().toString(36),password='Throwaway-1999';console.log('Register physical room account');
  assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
  const f=await roomFixture(base,{account,password,signup:false,seed:1999,width:800,height:600,debug:true,onPage:baseline?async p=>p.route('**/js/rm-g-scrap.js*',async r=>r.fulfill({contentType:'application/javascript',body:await readFile('/tmp/scrap-before.js','utf8')})):undefined});page=f.page;browser=f.browser;
  console.log('Physical cartridge setup');await page.evaluate(()=>{House.buildRoom(House.ROOMS.cupboard);House.goRoom('cupboard',0)});await f.until(()=>!House.gliding);await playCase(f,'sn.fight');await f.until(()=>!!RoomTV.dbg()?.dbg);await f.until(()=>House.focused&&RoomTV.open_);await page.setViewportSize({width:1366,height:860});await page.waitForTimeout(1200);await page.screenshot({path:shots+'title-room.png'});await page.keyboard.press('t');await page.waitForTimeout(400);await page.screenshot({path:shots+'title-lock-in.png'});
  if(baseline){
   await page.evaluate(()=>RoomTV.dbg().dbg.vs('kenji','barry','pier','training'));await f.until(()=>RoomTV.dbg().dbg.scene==='fight'&&RoomTV.dbg().dbg.fight.state==='fight');await page.waitForTimeout(1200);await page.screenshot({path:shots+'room-combat-lock-in.png'});
   const perf=await page.evaluate(async()=>{const a=[];let previous,warm=30;await new Promise(resolve=>{function tick(t){if(warm>0)warm--;else if(previous)a.push(t-previous);previous=t;if(a.length>=90)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});a.sort((a,b)=>a-b);const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{p50:a[45],p95:a[85],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',scope:'Displayed LOCK IN requestAnimationFrame, all page work included'}});await writeFile(shots+'display-performance.json',JSON.stringify(perf,null,2));console.log('BEFORE DISPLAY PERFORMANCE '+JSON.stringify(perf));
  }
  if(!baseline){
   const until=f.until,realFrames=async n=>{await page.evaluate(n=>window.scrapRoomTarget=RoomTV.dbg().frame+n,n);await until(()=>RoomTV.dbg().frame>=scrapRoomTarget)};
   console.log('Physical keyboard and gamepad');await page.evaluate(()=>RoomTV.dbg().dbg.vs('kenji','barry','pier','training'));await until(()=>RoomTV.dbg().dbg.scene==='fight'&&RoomTV.dbg().dbg.fight.state==='fight');
   await page.keyboard.down('ArrowRight');await realFrames(40);await page.keyboard.up('ArrowRight');await page.keyboard.press('u');await realFrames(10);await page.screenshot({path:shots+'room-combat-lock-in.png'});
   await page.evaluate(()=>{window.scrapPad={id:'Review standard pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[scrapPad]});scrapPad.buttons[4]={pressed:true,value:1};dispatchEvent(new Event('gamepadconnected'));});
   await until(()=>GameInput.mode==='gamepad');await until(()=>RoomTV.dbg().held('l'));await page.evaluate(()=>{scrapPad.buttons[4]={pressed:false,value:0}});await until(()=>!RoomTV.dbg().held('l'));await realFrames(40);
   await page.evaluate(()=>{scrapPad.buttons[9]={pressed:true,value:1}});await until(()=>RoomTV.dbg().dbg.paused);await page.evaluate(()=>{scrapPad.buttons[9]={pressed:false,value:0};scrapPad.connected=false});await realFrames(3);const saved=await page.evaluate(()=>{RoomTV.dbg().dbg.checkpoint();return RoomTV.dbg().dbg.fight.snapshot()});
   assert(await page.evaluate(async()=>{Apps.flushGames();return await Roam.syncNow()}),'Cartridge must sync with the account');
   await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await until(()=>window.RoomTV?.dbg()?.dbg?.scene==='fight');assert(await page.evaluate(()=>RoomTV.dbg().dbg.paused));assert.deepEqual(await page.evaluate(()=>RoomTV.dbg().dbg.fight.snapshot()),saved);assert(await page.evaluate(()=>GameSave.gameSaves().some(s=>s.key==='rm.sn.fight'&&s.roams)));await page.screenshot({path:shots+'room-refresh-paused.png'});
   await page.keyboard.press('Enter');await until(()=>!RoomTV.dbg().dbg.paused);await page.keyboard.press('Escape');await until(()=>HousePause.open);const held=await page.evaluate(()=>RoomTV.dbg().dbg.fight.t);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>RoomTV.dbg().dbg.fight.t),held);await page.screenshot({path:shots+'room-escape.png'});await page.keyboard.press('Escape');await until(()=>!HousePause.open);
   console.log('Phone and tablet touch controls');const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:10});
   console.log('Touch emulation ready');await page.setViewportSize({width:390,height:844});console.log('Phone viewport ready');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:2,y:60,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until(()=>GameInput.touch);
   for(const[name,width,height]of[['phone-small-portrait',320,568],['phone-small-landscape',568,320],['phone-portrait',390,844],['phone-landscape',844,390],['tablet-portrait',768,1024],['tablet-landscape',1024,768]]){
    console.log('Touch size '+name);await page.setViewportSize({width,height});await page.waitForTimeout(350);
    const picture=await page.locator('.rm-tvv.on .rm-c0').boundingBox();assert(picture&&picture.width>=200&&picture.height>=170,name+' keeps a usable native game picture');
    for(const b of ['y','x','l','b','a','r']){
     console.log('Touch button '+name+' '+b);const box=await page.locator('.rm-tvv.on .rm-pad:not([hidden]) [data-b="'+b+'"]').boundingBox();assert(box&&box.width>=43&&box.height>=43,name+' touch target '+b);assert(box.x+box.width/2>width/2,name+' attack '+b+' must be under the right thumb');const dpad=await page.locator('.rm-tvv.on .rm-dpad').boundingBox();
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:dpad.x+dpad.width*.85,y:dpad.y+dpad.height*.5,id:1},{x:box.x+box.width/2,y:box.y+box.height/2,id:2}]});assert(await page.evaluate(b=>RoomTV.dbg().held(b)&&RoomTV.dbg().held('right'),b));await realFrames(8);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(!await page.evaluate(b=>RoomTV.dbg().held(b)||RoomTV.dbg().held('right'),b));await realFrames(15);
    }
    await page.screenshot({path:shots+name+'.png'});
   }
   await page.setViewportSize({width:390,height:844});const touchLock=async()=>{const b=await page.locator('.rm-tvv.on .rm-lock').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};await touchLock();await page.waitForTimeout(500);assert(await page.evaluate(()=>GameInput.touch));await page.screenshot({path:shots+'phone-in-room.png'});await touchLock();await page.setViewportSize({width:1366,height:860});await page.keyboard.press('ArrowLeft');await until(()=>RoomTV.covered()&&!House.gliding);await page.waitForTimeout(1000);
   const frameTimes=await page.evaluate(async()=>{const a=[];let last,warm=30;await new Promise(resolve=>{function tick(t){if(warm>0)warm--;else if(last)a.push(t-last);last=t;if(a.length>=90)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});a.sort((a,b)=>a-b);const gl=House.ren.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{p50:a[45],p95:a[85],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',scope:'Displayed LOCK IN requestAnimationFrame, all page work included'}});await writeFile(shots+'display-performance.json',JSON.stringify(frameTimes,null,2));console.log('DISPLAY PERFORMANCE '+JSON.stringify(frameTimes));
   console.log('Physical completed receipt refresh');await page.evaluate(()=>{RoomTV.dbg().dbg.arcade('kenji',11);RoomTV.dbg().dbg.go('staff');RoomTV.dbg().dbg.state.t=220});await page.keyboard.press('Enter');await until(()=>RoomTV.dbg().dbg.scene==='hiscores');await realFrames(25);await page.keyboard.press('Enter');await until(()=>RoomTV.dbg().done&&!!RoomTV.dbg().load().result);const receipt=await page.evaluate(()=>RoomTV.dbg().load().result);await page.screenshot({path:shots+'room-finished-receipt.png'});assert(await page.evaluate(()=>Roam.syncNow()));await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.RoomTV?.dbg()?.done);assert.deepEqual(await page.evaluate(()=>RoomTV.dbg().load().result),receipt);assert(await page.evaluate(()=>RoomTV.dbg().restoring&&!RoomTV.dbg().tok));await page.screenshot({path:shots+'room-finished-refresh.png'});await page.evaluate(()=>{window.scrapClosedRoot=RoomTV.dbg().cv.closest('.rm-tvv');RoomTV.stopPhysical('sn')});await until(()=>!RoomTV._dbg());assert(await page.evaluate(()=>!scrapClosedRoot.classList.contains('scrap-fight-pad')),'Cartridge pad styling must be removed on ejection');

  }
  assert.deepEqual(f.errors,[]);
 }
 assert(!/mod failed to load/i.test(log),log);console.log('SCRAP '+label+' PASS');
}catch(e){if(page)await page.screenshot({path:shots+'FAIL.png'}).catch(()=>{});console.error(e);process.exitCode=1}
finally{clearTimeout(watchdog);await cleanup()}
function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())})}
async function frames(n){await page.evaluate(n=>review.step(n),n)}
async function key(k){await page.keyboard.down(k);await frames(1);await page.keyboard.up(k);await frames(2)}
async function hold(k,n){await page.keyboard.down(k);await frames(n);await page.keyboard.up(k);await frames(1)}
async function shot(name){await frames(0);console.log('Capture '+name);await page.screenshot({path:shots+name+'.png'});const uri=await page.evaluate(()=>review.K.cv.toDataURL().split(',')[1]);await writeFile(shots+name+'-native.png',Buffer.from(uri,'base64'))}

// Labelled native-resolution review sheets; annotations never cover game lettering.
async function endingSheets(ids){
 const pg=await browser.newPage();try{for(let n=0;n<3;n++){
  const imgs=await Promise.all(ids.map(async id=>'data:image/png;base64,'+(await readFile(shots+'ending-'+id+'-'+n+'-native.png')).toString('base64')));
  const b64=await pg.evaluate(async({imgs,ids,n})=>{const ims=await Promise.all(imgs.map(async src=>{const im=new Image();im.src=src;await im.decode();return im}));const c=document.createElement('canvas');c.width=768;c.height=28+Math.ceil(ims.length/3)*242;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#101018';g.fillRect(0,0,c.width,c.height);g.font='13px monospace';g.fillStyle='#eee';g.fillText('STREET SCRAPPER II / ENDING PAGE '+(n+1),8,18);ims.forEach((im,i)=>{const x=i%3*256,y=28+Math.floor(i/3)*242;g.fillStyle='#c9ac69';g.fillText(ids[i],x+6,y+13);g.drawImage(im,x,y+18)});return c.toDataURL().split(',')[1]},{imgs,ids,n});
  await writeFile(shots+'ending-review-page-'+n+'.png',Buffer.from(b64,'base64'));
 }}finally{await pg.close()}
}
