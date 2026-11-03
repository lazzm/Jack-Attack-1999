// Tekno Fist: production cartridge, real browser keys, bounded encounter fixtures.
// Own disposable server by default. --before uses /tmp/fight-before; --native skips house.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),before=process.argv.includes('--before'),native=process.argv.includes('--native'),roomOnly=process.argv.includes('--room-only');
const dir=root+'tests/shots/games/fight/'+(before?'before':'after')+'/';
let browser,server,data,log='',p;const errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function stop(){if(browser)await browser.close().catch(()=>{});if(server?.exitCode===null){const done=once(server,'exit');server.kill('SIGTERM');await done}if(data)await rm(data,{recursive:true,force:true})}
const timer=setTimeout(()=>{console.error('FIGHT TIMEOUT');void stop().finally(()=>process.exit(1))},1200000);
for(const s of ['SIGINT','SIGTERM'])process.once(s,()=>void stop().finally(()=>process.exit(1)));
let base=process.argv.find(x=>/^http:/.test(x));
try{
 await mkdir(dir,{recursive:true});
 if(!base){let port;for(let i=18080;i<=18099;i++){if(await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(i,'127.0.0.1',()=>s.close(()=>r(true)))})){port=i;break}}assert(port,'No free test port');
 data=await mkdtemp('/tmp/jhp-fight-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});for(const s of[server.stdout,server.stderr])s.on('data',b=>log+=b);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<150&&server.exitCode===null,log);await delay(100)}base='http://127.0.0.1:'+port;
 }
 assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 if(!roomOnly){
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});p=await browser.newPage({viewport:{width:1366,height:860}});observe(p);
 await p.route('**/__fight-review',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="margin:0;background:#101018">'}));
 if(before)for(const file of['rm-g-fight.js','rm-g-fightkit.js'])await p.route('**/js/'+file,r=>readFile('/tmp/fight-before/'+file,'utf8').then(body=>r.fulfill({contentType:'application/javascript',body})));
 await install();await frames(60);await shot('boot');
 const boot=await p.evaluate(()=>review.text.filter(t=>/MEMORY CARD/.test(t.s)));await writeFile(dir+'boot-text.json',JSON.stringify(boot,null,2));
 if(!before){const h=boot.find(x=>x.s==='MEMORY CARD CHECK'),s=boot.find(x=>x.s==='MEMORY CARD (SLOT 1)');assert(h&&s);assert(h.y+8*h.k+3<=s.y);assert(h.x>=8&&h.x+h.w<=312)}
 await frames(110);await shot('title');await frames(1200);await shot('attract');await key('Enter');await frames(60);await key('Enter');await shot('menu');
 if(!before){await choose('ball');assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'menu');assert(await p.evaluate(()=>__teknoDbg.G.menuNotice?.t>0));await shot('ball-locked')}
 await choose('train');await shot('select');await key('z');await frames(50);await key('ArrowRight');await key('z');await frames(50);await shot('stage');await key('z');await live();await shot('training-start');
 await p.evaluate(()=>{const g=__teknoDbg.G;g.c.dummy='stand'});await hold('ArrowRight',20);await key('z');await frames(10);await shot('jab');await frames(25);await hold('ArrowDown',8);await p.keyboard.down('ArrowDown');await key('c');await frames(14);await p.keyboard.up('ArrowDown');await shot('launcher');await frames(50);
 for(let i=0;i<3;i++){await key('v');await frames(8);await shot('sequence-'+i);await frames(40)}
 assert(await p.evaluate(()=>(__teknoDbg.G.trainLast?.dmg||0)>0),'Real attacks deal damage');
 await key('Enter');await shot('pause');const frozen=await p.evaluate(()=>[__teknoDbg.G.p.x,__teknoDbg.G.c.hp,__teknoDbg.G.timer]);await frames(60);assert.deepEqual(await p.evaluate(()=>[__teknoDbg.G.p.x,__teknoDbg.G.c.hp,__teknoDbg.G.timer]),frozen);await key('ArrowDown');await key('z');await shot('moves');await key('x');await key('Enter');
 await perf();
 if(!process.argv.includes('--flows')&&!process.argv.includes('--ball')){const stages=await p.evaluate(()=>__teknoDbg.STAGES.map(s=>s.id));for(let i=0;i<stages.length;i++){await p.evaluate(i=>__teknoDbg.cheat({view:{id:'rico',vs:'barry',stage:i,dist:5.4,h:1.8,ly:.9,ang:.25}}),i);await frames(3);await shot('arena-'+stages[i])}
 for(const id of await p.evaluate(()=>__teknoDbg.ROST.map(f=>f.id))){await p.evaluate(id=>__teknoDbg.cheat({view:{id,dist:3.8,h:1.2,ly:.95,sheet:true}}),id);await frames(2);await shot('model-'+id)}}
 if(!before&&!process.argv.includes('--ball'))for(const id of['stone','doc']){await choose('arcade');for(let i=0;i<12&&await p.evaluate(id=>__teknoDbg.G.sl[__teknoDbg.G.sp].id!==id,id);i++)await key('ArrowRight');await key('z');await frames(600);await shot('prologue-'+id);assert(await p.evaluate(()=>review.text.filter(t=>t.y>=145&&!t.s.includes(': FIGHT')).every(t=>t.y+7<=228)),'Full prologue fits its panel '+id)}
 if(!before){if(process.argv.includes('--ball')){await p.evaluate(()=>__teknoDbg.SV.end.rico=1);await ballFlow()}else await flows()}
 assert.deepEqual(errors,[]);await browser.close();browser=null;console.log('PASS native combat, models, stages, menus, pause and performance');
 }
 if(!native&&!before)await room();
 assert(!/mod failed to load|uncaught|EADDRINUSE/i.test(log),log);console.log('FIGHT '+(before?'BEFORE':'AFTER')+' PASS');
}catch(e){if(p&&!p.isClosed())await shot('failure').catch(()=>{});throw e}finally{clearTimeout(timer);await stop()}
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())})}
async function install(){
 await p.goto(base+'/__fight-review');await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House;window.Apps={load:()=>Promise.resolve()}});
 for(const file of['vendor/three.min.js','js/cast.js','js/rm-tv.js','js/rm-3d.js','js/rm-g-fightkit.js','js/rm-g-fight.js'])await p.addScriptTag({url:base+'/'+file});
 await p.evaluate(()=>{
 Cast.bind('fightreview',{first:'Pip',g:'m'});let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const cv=document.createElement('canvas'),ov=document.createElement('canvas');for(const c of[cv,ov]){c.width=320;c.height=240;c.style.cssText='position:fixed;width:min(100vw,100vh * 4 / 3);height:auto;left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated';document.body.append(c)}
 const held={},pressed={},text=[];const font={...RoomTV.font,draw(g,s,x,y,col,k,shadow){text.push({s:String(s),x,y,k:k||1,w:RoomTV.font.width(String(s),k||1)});return RoomTV.font.draw(g,s,x,y,col,k,shadow)}};
 const K={W:320,H:240,cv,hud:ov.getContext('2d'),font,frame:0,t:0,best:0,restoring:false,label:b=>({a:'★',b:'@',x:'#',y:'~'}[b]||b.toUpperCase()),keyLabel:b=>b.toUpperCase(),load:()=>JSON.parse(localStorage.getItem('fight-review')||'null'),save(s){localStorage.setItem('fight-review',JSON.stringify(s));return true},resume(){this.restoring=false},music(){},sfx:{tone(){},noise(){},seq(){}},secret(){},over(s,o){window.review.result={s,...o}},held:b=>!!held[b],pressed:b=>!!pressed[b],any:()=>Object.values(pressed).some(Boolean),stick:()=>({x:+!!held.right-+!!held.left,y:+!!held.down-+!!held.up}),three(o){return this._three||(this._three=RoomTV.make3d(this,{...o,look:'ps1'}))}};
 const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'a',x:'b',c:'x',v:'y',Enter:'start'};addEventListener('keydown',e=>{const b=map[e.key];if(b){if(!held[b])pressed[b]=true;held[b]=true;e.preventDefault()}},true);addEventListener('keyup',e=>{if(map[e.key])held[map[e.key]]=false},true);
 window.review={K,text,held,game:RoomTV.defs['ps.fight'].make(K),step(n){for(let i=0;i<n;i++){this.game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}text.length=0;this.game.draw()},restart(){this.game.end();K._three.scene.clear();K.restoring=true;this.game=RoomTV.defs['ps.fight'].make(K);this.step(1)}};
 });
}
async function frames(n){return p.evaluate(n=>review.step(n),n)}
async function key(k){await p.keyboard.down(k);await frames(1);await p.keyboard.up(k);await frames(1)}
async function hold(k,n){await p.keyboard.down(k);await frames(n);await p.keyboard.up(k);await frames(1)}
async function shot(name){await frames(0);await p.screenshot({path:dir+name+'.png'});const png=await p.evaluate(()=>{const k=review.K,c=document.createElement('canvas');c.width=k.W;c.height=k.H;const g=c.getContext('2d');review.game.draw();g.drawImage(k.cv,0,0);g.drawImage(k.hud.canvas,0,0);return c.toDataURL().split(',')[1]});await writeFile(dir+name+'-native.png',Buffer.from(png,'base64'));console.log('SHOT '+name)}
async function choose(mode){await p.evaluate(()=>__teknoDbg.cheat({go:'title'}));await key('Enter');const count={arcade:0,vs:1,surv:2,ta:3,train:4,team:5,theatre:6,ball:7}[mode];await p.evaluate(()=>__teknoDbg.G.pm=0);for(let i=0;i<count;i++)await key('ArrowDown');await key('z');await frames(50)}
async function live(){for(let i=0;i<30;i++){if(await p.evaluate(()=>__teknoDbg.G.scr==='fight'&&__teknoDbg.G.fs==='fight'))return;await frames(30)}throw Error('Fight never started')}
async function perf(){
 const combat=await p.evaluate(()=>{const gl=review.K._three.ren.getContext(),samples=[];for(let i=0;i<280;i++){const t=performance.now();review.step(1);gl.finish();if(i>=40)samples.push(performance.now()-t)}samples.sort((a,b)=>a-b);return{median:samples[120],p95:samples[228],max:samples[239],cardBytes:JSON.stringify(__teknoDbg.SV).length,resolution:[320,240],scope:'Active practice update + draw + GPU finish, includes autosave, excludes house'}});
 console.log('COMBAT PERFORMANCE '+JSON.stringify(combat));await writeFile(dir+'combat-performance.json',JSON.stringify(combat,null,2));
 await p.evaluate(()=>__teknoDbg.cheat({view:{id:'rico',vs:'barry',stage:0,dist:5.4,h:1.8,ly:.9,ang:.25}}));await frames(3);
 const result=await p.evaluate(()=>{const k=review.K,t=k._three,gl=t.ren.getContext(),a=[];for(let i=0;i<70;i++){const s=performance.now();review.step(1);gl.finish();if(i>=20)a.push(performance.now()-s)}a.sort((a,b)=>a-b);const ext=gl.getExtension('WEBGL_debug_renderer_info');return{median:a[25],p95:a[47],max:a[49],resolution:[k.W,k.H],calls:t.ren.info.render.calls,triangles:t.ren.info.render.triangles,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',scope:'Native update + draw + GPU finish; software Chromium, excludes house'}});
 console.log('PERFORMANCE '+JSON.stringify(result));await writeFile(dir+'performance.json',JSON.stringify(result,null,2));
}
async function flows(){
 // Existing v1 cards migrate additively; never rewrite initials or earned content.
 const legacy={opt:{diff:2,rounds:2,time:45,music:0,shake:0,keep:1999},unl:{gubbinz:1},cos:{rico:2},st:{bedroom:1},end:{volt:1},hi:[{n:'OLD SAVE',s:12345,c:'rico'}],ta:44,sv:7,wins:12,custom:{keep:1999}};
 await p.evaluate(s=>{review.game.end();review.K._three.scene.clear();localStorage.setItem('fight-review',JSON.stringify(s));review.K.restoring=false;delete RmFight.booted['TEKNO FIST'];review.game=RoomTV.defs['ps.fight'].make(review.K);review.step(60)},legacy);await shot('boot-existing-card');assert(await p.evaluate(()=>review.text.some(t=>t.s==='LOADING TEKNO FIST DATA (1 BLOCK)')),'Existing n=0 card is recognised');await frames(110);
 const migrated=await p.evaluate(()=>__teknoDbg.SV);for(const k of Object.keys(legacy))assert.deepEqual(migrated[k],legacy[k],'Preserve '+k);
 await choose('theatre');await shot('theatre');await key('z');await frames(80);await shot('theatre-ending');
 const earned=await p.evaluate(()=>({wins:__teknoDbg.SV.wins,hi:__teknoDbg.SV.hi,unl:__teknoDbg.SV.unl,cos:__teknoDbg.SV.cos}));await frames(1800);
 assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'theatre');assert.deepEqual(await p.evaluate(()=>({wins:__teknoDbg.SV.wins,hi:__teknoDbg.SV.hi,unl:__teknoDbg.SV.unl,cos:__teknoDbg.SV.cos})),earned,'Theatre has no rewards');
 // Every screen and an active attack resumes on the same card.
 await choose('train');await refreshCheck('select');await key('z');await frames(50);await key('z');await frames(50);await refreshCheck('stage');await key('z');await live();
 await p.evaluate(()=>__teknoDbg.G.c.dummy='stand');await hold('ArrowRight',20);await key('c');await frames(7);await refreshCheck('fight');await shot('refresh-attack');
 assert(await p.evaluate(()=>__teknoDbg.G.paused),'Recovered fight waits for player');await key('Enter');await frames(60);
 // Throw animation saves its cross-fighter reference, not a circular model object.
 await hold('ArrowRight',20);await p.keyboard.down('z');await p.keyboard.down('x');await frames(10);await p.keyboard.up('z');await p.keyboard.up('x');
 assert(await p.evaluate(()=>__teknoDbg.G.p.st==='throwing'),'Two face buttons throw');await refreshCheck('fight');assert(await p.evaluate(()=>__teknoDbg.G.c.by===__teknoDbg.G.p));await shot('refresh-throw');await key('Enter');await frames(90);
 // A fair guard/low/jump/step laboratory using real keys and unchanged collision rules.
 await p.evaluate(()=>{const g=__teknoDbg.G;g.c.dummy='guard';g.p.x=-.6;g.c.x=.6;g.p.z=g.c.z=0;g.p.st=g.c.st='idle';g.p.vx=g.c.vx=0});await key('z');await frames(12);await shot('guard');await frames(40);
 await hold('ArrowUp',2);await frames(8);assert(await p.evaluate(()=>__teknoDbg.G.p.st==='side'));await shot('sidestep');await frames(30);
 await hold('ArrowUp',10);assert(await p.evaluate(()=>__teknoDbg.G.p.y>0));await shot('jump');await frames(70);
 // Full Arcade: first actual low-kick victory, then bounded KOs for every remaining match.
 await choose('arcade');await key('z');await frames(570);await shot('arcade-story');await refreshCheck('story');await key('z');await frames(60);assert(await p.evaluate(()=>Math.abs(__teknoDbg.G.p.x-__teknoDbg.G.c.x)>2),'Versus actors start separated through disc loading');await refreshCheck('vs');await live();
 await p.evaluate(()=>{__teknoDbg.SV.opt.rounds=1;__teknoDbg.G.match.need=1;__teknoDbg.G.c.dummy='stand'});
 for(let i=0;i<30&&await p.evaluate(()=>__teknoDbg.G.fs==='fight');i++){
  await hold('ArrowRight',18);await p.keyboard.down('ArrowDown');await key('x');await frames(25);await p.keyboard.up('ArrowDown');await frames(4);
 }
 assert(await p.evaluate(()=>__teknoDbg.G.c.hp===0),'Win first Arcade round through real attacks');await shot('arcade-ko');await refreshCheck('fight');await key('Enter');
 for(let i=0;i<30&&await p.evaluate(()=>__teknoDbg.G.fs!=='replay');i++)await frames(10);
 assert.equal(await p.evaluate(()=>__teknoDbg.G.fs),'replay');const replay=await p.evaluate(()=>__teknoDbg.G.replay.i);await refreshCheck('fight');assert.equal(await p.evaluate(()=>__teknoDbg.G.replay.i),Math.round(replay*10000)/10000);await shot('refresh-replay');assert(await p.evaluate(()=>JSON.stringify(__teknoDbg.SV).length<20000),'Full replay remains profile-sized');await key('Enter');
 let matches=1,sawChallenger=false;
 for(let i=0;i<180;i++){
  const st=await p.evaluate(()=>({scr:__teknoDbg.G.scr,fs:__teknoDbg.G.fs,t:__teknoDbg.G.t,chal:__teknoDbg.G.match?.chal}));
  if(st.scr==='ending')break;
  if(st.chal)sawChallenger=true;
  if(st.scr==='fight'&&st.fs==='fight'){await p.evaluate(()=>{__teknoDbg.G.match.need=1;__teknoDbg.cheat({ko:true})});matches++;}
  if(st.scr==='unlock'){await frames(45);await key('z')}else if(st.scr==='next'){await frames(55);await key('z')}else await frames(90);
 }
 assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'ending');assert(matches>=10,'Complete ten-stage ladder');await frames(100);await shot('arcade-ending');await refreshCheck('ending');
 assert(await p.evaluate(()=>__teknoDbg.SV.end.rico&&__teknoDbg.SV.unl.king&&__teknoDbg.SV.cos.rico>=2));
 await frames(1700);for(let i=0;i<8&&await p.evaluate(()=>__teknoDbg.G.scr==='unlock');i++){await frames(45);await key('z')}
 assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'credits');await frames(240);await shot('credits');await refreshCheck('credits');await key('Enter');await frames(2);if(await p.evaluate(()=>__teknoDbg.G.scr==='name')){assert.equal(await p.evaluate(()=>__teknoDbg.G.nm.join('').trim()),'PIP');await key('Enter')}
 assert(await p.evaluate(()=>!!review.result));await shot('completed');await p.evaluate(()=>{review.game.end();review.K._three.scene.clear();review.K.restoring=false;review.game=RoomTV.defs['ps.fight'].make(review.K);review.step(2)});assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'title','Explicit Play again starts a fresh go');assert(await p.evaluate(()=>__teknoDbg.SV.end.rico&&__teknoDbg.SV.unl.king),'Replay keeps earned content');
 // A fresh challenger branch and saved continue preserve the current opponent.
 await p.evaluate(()=>delete __teknoDbg.SV.unl.gubbinz);await choose('arcade');await key('z');await frames(50);await key('z');await live();
 await p.evaluate(()=>{__teknoDbg.G.match.need=1;__teknoDbg.cheat({die:true})});await scene('continue');assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'continue');await refreshCheck('continue');await shot('continue');await key('Enter');await live();
 await p.evaluate(()=>{const g=__teknoDbg.G;g.run.step=2;g.cont=0;g.match.need=1;g.c.hp=1;__teknoDbg.cheat({ko:true})});
 await scene('next');await frames(210);await live();assert(await p.evaluate(()=>__teknoDbg.G.match.chal),'Hidden challenger branch');await shot('challenger');
 // Team battle supports the full 1..8 range, rejects duplicates, and keeps winners' health.
 await choose('team');for(let i=0;i<5;i++)await key('ArrowRight');assert.equal(await p.evaluate(()=>__teknoDbg.G.teamSize),8);await shot('team-size-eight');for(let i=0;i<6;i++)await key('ArrowLeft');await key('z');await key('z');await key('z');assert.equal(await p.evaluate(()=>__teknoDbg.G.teamPick.length),1,'Duplicate refused');await key('ArrowRight');await key('z');await live();await shot('team-start');
 await p.evaluate(()=>{__teknoDbg.G.p.hp=43;__teknoDbg.cheat({ko:true})});await scene('teamNext');assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'teamNext');assert.equal(await p.evaluate(()=>__teknoDbg.G.team.ahp),55);await refreshCheck('teamNext');await shot('team-next');await key('Enter');await live();assert.equal(await p.evaluate(()=>__teknoDbg.G.p.hp),55);
 await p.evaluate(()=>__teknoDbg.cheat({ko:true}));await scene('teamDone');assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'teamDone');await shot('team-victory');await refreshCheck('teamDone');
 // CPU survivors retain health too; tied teams replace both fighters fairly.
 await choose('team');await key('ArrowLeft');await key('z');await key('z');await key('ArrowRight');await key('z');await live();await p.evaluate(()=>{__teknoDbg.G.c.hp=52;__teknoDbg.cheat({die:true})});await scene('teamNext');assert.equal(await p.evaluate(()=>__teknoDbg.G.team.bhp),64);await key('Enter');await live();assert.equal(await p.evaluate(()=>__teknoDbg.G.c.hp),64);await p.evaluate(()=>__teknoDbg.cheat({die:true}));await scene('teamDone');assert.equal(await p.evaluate(()=>__teknoDbg.G.team.won),false);await shot('team-defeat');
 await choose('team');await key('ArrowLeft');await key('ArrowLeft');await key('z');await key('z');await live();await p.evaluate(()=>{const g=__teknoDbg.G;g.p.x=-4;g.c.x=4;g.p.hp=g.c.hp=100;g.p.st=g.c.st='idle';g.c.dummy='stand';g.timer=1/120});await scene('teamDone');assert.equal(await p.evaluate(()=>__teknoDbg.G.team.tie),true);await shot('team-draw');
 // Survival recovery, record and stage reward; Time Attack pause never adds elapsed time.
 await choose('surv');await key('z');await live();await p.evaluate(()=>{const g=__teknoDbg.G;g.run.wins=4;g.p.hp=40;__teknoDbg.cheat({ko:true})});await scene('next');assert(await p.evaluate(()=>__teknoDbg.SV.st.bedroom));assert.equal(await p.evaluate(()=>__teknoDbg.G.run.hp),70);await shot('survival');
 await choose('ta');await key('z');await live();assert.equal(await p.evaluate(()=>__teknoDbg.G.ladder.length),10);await key('Enter');const elapsed=await p.evaluate(()=>__teknoDbg.G.run.elapsed);await frames(300);assert.equal(await p.evaluate(()=>__teknoDbg.G.run.elapsed),elapsed);await key('Enter');
 for(let i=0;i<180;i++){const st=await p.evaluate(()=>__teknoDbg.G.scr);if(st==='taDone')break;if(st==='fight'&&await p.evaluate(()=>__teknoDbg.G.fs==='fight'))await p.evaluate(()=>__teknoDbg.cheat({ko:true}));if(st==='next'){await frames(55);await key('z')}else await frames(120)}assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'taDone');assert.equal(await p.evaluate(()=>__teknoDbg.SV.ta),44,'Old six-fight record retained');assert.equal(await p.evaluate(()=>typeof __teknoDbg.SV.ta10),'number');await shot('time-attack-clear');
 // A real document reload rebuilds the saved scene; no JavaScript object survives.
 await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));const card=await p.evaluate(()=>JSON.parse(localStorage.getItem('fight-review')));assert(JSON.stringify(card).length<20000,'Checkpoint roams with profile');await install();await frames(0);assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'taDone');await shot('document-reload');
 await ballFlow();
 await choose('arcade');for(let i=0;i<12&&await p.evaluate(()=>__teknoDbg.G.sl[__teknoDbg.G.sp].id!=='king');i++)await key('ArrowRight');await key('z');await frames(55);assert.equal(await p.evaluate(()=>__teknoDbg.G.ladder.at(-1).cfg.id),'king','King ending has its promised mirror final');await p.evaluate(()=>__teknoDbg.G.run.step=__teknoDbg.G.ladder.length-1);await key('z');await live();assert(await p.evaluate(()=>__teknoDbg.G.p.m!==__teknoDbg.G.c.m&&__teknoDbg.G.p.cos!==__teknoDbg.G.c.cos),'Mirror actors and costumes stay distinct');await shot('king-mirror');await refreshCheck('fight');
 console.log('PASS legacy migration, exact attack/throw/replay restore, Arcade ending/credits/unlocks, theatre, 1..8 team battle, Survival, Time Attack, Fist Ball and document reload');
}
async function ballFlow(){
 await choose('ball');await key('z');await frames(50);await key('ArrowRight');await key('z');await frames(50);assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'ballRules');
 for(let i=0;i<3;i++){await shot('ball-rules-'+i);await key('ArrowRight')}
 await key('z');await live();await shot('ball-serve');
 // Meet the unmodified first serve using actual movement and an actual punch.
 await hold('ArrowRight',27);let hit=false;
 for(let i=0;i<80;i++){const b=await p.evaluate(()=>({x:__teknoDbg.G.ball.x,y:__teknoDbg.G.ball.y,hits:__teknoDbg.G.ball.hits,p:__teknoDbg.G.p.x,dead:__teknoDbg.G.ball.dead}));if(b.hits){hit=true;break}if(b.x-b.p<1.2&&b.x>b.p&&b.y<2.15)await key('z');await frames(2)}
 assert(hit,'Keyboard punch sends the real serve back');await shot('ball-return');const ball=await p.evaluate(()=>({...__teknoDbg.G.ball}));await refreshCheck('fight');assert(Math.abs((await p.evaluate(()=>__teknoDbg.G.ball.x))-ball.x)<.001);await shot('ball-refresh');await key('Enter');
 for(let i=0;i<3;i++){await frames(8);await shot('ball-sequence-'+i)}
 // CPU rallies on the same rules; both sides can lose health by missing.
 await p.evaluate(()=>{__teknoDbg.G.p.cpu=true;__teknoDbg.G.p.lvl=2;__teknoDbg.G.c.lvl=2});await frames(1500);assert((await p.evaluate(()=>__teknoDbg.SV.ballRally))>=1);await shot('ball-cpu-rally');
 // Bound only the final health bar, retaining the normal round and result path.
 await p.evaluate(()=>{const g=__teknoDbg.G;g.match.need=1;g.p.cpu=false;g.paused=false;if(g.fs==='fight')__teknoDbg.cheat({ko:true})});
 for(let i=0;i<80;i++){if(await p.evaluate(()=>__teknoDbg.G.scr==='vsres'))break;if(await p.evaluate(()=>__teknoDbg.G.fs==='fight'))await p.evaluate(()=>__teknoDbg.cheat({ko:true}));await frames(30)}assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),'vsres');await shot('ball-result');
 await key('z');await live();assert.equal(await p.evaluate(()=>__teknoDbg.G.mode),'ball');await shot('ball-rematch');
 const maps=[];for(let type=0;type<3;type++){await p.evaluate(type=>{__teknoDbg.G.paused=false;__teknoDbg.G.ballType=type;__teknoDbg.cheat({go:'ballRules',goO:{mode:'ball'}})},type);await key('z');await live();await frames(16);await shot('ball-type-'+type);const model=await p.evaluate(()=>{const m=review.K._three.scene.getObjectByName('fist-ball');return{type:m.geometry.type,map:m.material.map.uuid}});assert.equal(model.type,type===2?'CylinderGeometry':'SphereGeometry');maps.push(model.map)}assert.equal(new Set(maps).size,3,'Three original ball materials');await p.evaluate(()=>__teknoDbg.cheat({go:'title'}));console.log('PASS Fist Ball: three balls, real serve/return, airborne refresh, AI rallies, result and rematch');
}
async function refreshCheck(scr){
 const state=await p.evaluate(()=>{const g=__teknoDbg.G;return{scr:g.scr,fs:g.fs,score:g.score,round:g.round,timer:g.timer===Infinity?'infinity':g.timer,p:g.p&&{x:g.p.x,hp:g.p.hp,st:g.p.st,t:g.p.t},c:g.c&&{x:g.c.x,hp:g.c.hp,st:g.c.st,t:g.c.t}}});
 await p.evaluate(()=>review.restart());assert.equal(await p.evaluate(()=>__teknoDbg.G.scr),scr,await p.evaluate(()=>__teknoDbg.G.restoreError||'Restore '+__teknoDbg.G.scr));
 const restored=await p.evaluate(()=>{const g=__teknoDbg.G;return{scr:g.scr,fs:g.fs,score:g.score,round:g.round,timer:g.timer===Infinity?'infinity':g.timer,p:g.p&&{x:g.p.x,hp:g.p.hp,st:g.p.st,t:g.p.t},c:g.c&&{x:g.c.x,hp:g.c.hp,st:g.c.st,t:g.c.t}}});
 for(const side of['p','c'])if(state[side]){assert(Math.abs(state[side].x-restored[side].x)<.001);for(const k of['hp','st'])assert.equal(restored[side][k],state[side][k],scr+' '+side+' '+k)}assert.equal(restored.score,state.score);assert.equal(restored.round,state.round);assert.equal(restored.fs,state.fs);
}
async function room(){
 const account='Fight'+Date.now().toString(36),password='Throwaway-1999';assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const f=await roomFixture(base,{account,password,signup:false,timeoutScale:3,onPage:page=>browser=page.context().browser()}),page=f.page;browser=f.browser;p=null;
 const until=async fn=>{for(let i=0;i<900;i++){assert.deepEqual(f.errors,[]);if(await page.evaluate(fn))return;await delay(100)}throw Error('Room timeout '+fn)};
 async function step(n){const start=await page.evaluate(()=>RoomTV.dbg().frame);for(let i=0;i<900;i++){if(await page.evaluate(start=>RoomTV.dbg().frame>=start, start+n))return;await delay(100)}throw Error('Room game stalled')}
 console.log('ROOM fixture ready');await playCase(f,'ps.fight');console.log('ROOM Tekno disc inserted');await until(()=>!!window.__teknoDbg);await step(170);await page.screenshot({path:dir+'in-room.png'});assert(await page.evaluate(()=>{let live=false;House.scene.traverse(o=>{if(o.material?.map?.userData?.jackLive&&o.material.map.userData.hud)live=true});return live}),'Physical telly picture and HUD textures');
 await page.evaluate(()=>RoomTV.lockIn(true));await page.keyboard.press('Enter');await step(4);await page.evaluate(()=>__teknoDbg.G.pm=4);await page.keyboard.press('z');await step(60);await page.keyboard.press('z');await step(60);await page.keyboard.press('z');await step(60);await page.keyboard.press('z');await until(()=>__teknoDbg.G.scr==='fight'&&__teknoDbg.G.fs==='fight');
 console.log('ROOM training started');
 // Gamepad polling stays with the real console wrapper.
 await page.evaluate(()=>{window.fightPad={id:'Standard review controller',index:0,connected:true,mapping:'standard',axes:[.8,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[fightPad]});window.dispatchEvent(new Event('gamepadconnected'));window.fightX=__teknoDbg.G.p.x});await until(()=>__teknoDbg.G.p.x>fightX+.1);
 await page.evaluate(()=>{fightPad.axes[0]=0;fightPad.buttons[9]={pressed:true,value:1}});await until(()=>__teknoDbg.G.paused);await page.evaluate(()=>{fightPad.buttons[9]={pressed:false,value:0};fightPad.axes[1]=.8});await until(()=>__teknoDbg.G.pm>0);await page.evaluate(()=>fightPad.axes[1]=0);await page.screenshot({path:dir+'gamepad-pause.png'});await page.evaluate(()=>{delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});await step(4);await page.keyboard.press('Enter');await until(()=>!__teknoDbg.G.paused);
 console.log('ROOM gamepad passed');await page.keyboard.press('Escape');await until(()=>House.paused);const frozen=await page.evaluate(()=>__teknoDbg.G.timer);await delay(500);assert.equal(await page.evaluate(()=>__teknoDbg.G.timer),frozen);await page.screenshot({path:dir+'house-pause.png'});await page.keyboard.press('Escape');await until(()=>!House.paused);
 await page.evaluate(()=>window.fightInstance=RoomTV.dbg());await page.keyboard.press('t');await until(()=>!RoomTV.lockIn());assert(await page.evaluate(()=>RoomTV.dbg()===fightInstance),'T keeps the running cartridge');await page.screenshot({path:dir+'in-room-fight.png'});await page.keyboard.press('t');await until(()=>RoomTV.lockIn());assert(await page.evaluate(()=>RoomTV.dbg()===fightInstance),'LOCK IN keeps the same run');await page.keyboard.press('Enter');await until(()=>__teknoDbg.G.paused);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 for(const [name,width,height]of[['desktop-small',1024,768],['phone-portrait',390,844],['phone-landscape',844,390],['tablet-portrait',768,1024],['tablet-landscape',1024,768]]){await page.setViewportSize({width,height});await delay(350);
  if(name==='phone-portrait'){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:2,y:2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until(()=>GameInput.mode==='touch');
   for(const b of['a','b','x','y']){const box=await page.locator('.rm-tvv.on .rm-pad:not([hidden]) [data-b="'+b+'"]').boundingBox();assert(box&&box.width>=44&&box.height>=44,'Phone target '+b);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});assert(await page.evaluate(b=>RoomTV.dbg().held(b),b),'Touch reaches '+b);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(!await page.evaluate(b=>RoomTV.dbg().held(b),b),'Release clears '+b)}
   const dpad=await page.locator('.rm-tvv.on .rm-dpad').boundingBox();assert(dpad&&dpad.width>=88&&dpad.height>=88,'Whole direction-pad thumb area');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:dpad.x+dpad.width*.85,y:dpad.y+dpad.height*.5,id:1}]});assert(await page.evaluate(()=>RoomTV.dbg().held('right')),'D-pad thumb zone moves right');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(!await page.evaluate(()=>RoomTV.dbg().held('right')));
  }
  await page.screenshot({path:dir+name+'.png'})}await page.setViewportSize({width:1366,height:860});
 console.log('ROOM sizes captured');assert(await page.evaluate(async()=>{Apps.flushGames();return await Roam.syncNow()}),'Current game card acknowledged by JackNet');const expected=await page.evaluate(()=>({hp:__teknoDbg.G.p.hp,x:__teknoDbg.G.p.x}));
 await page.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await until(()=>window.__teknoDbg?.G.scr==='fight');assert(await page.evaluate(()=>__teknoDbg.G.paused));assert.equal(await page.evaluate(()=>__teknoDbg.G.p.hp),expected.hp);assert(Math.abs((await page.evaluate(()=>__teknoDbg.G.p.x))-expected.x)<.001);assert(await page.evaluate(()=>JSON.stringify(RoomTV.dbg().load()).length<20000));assert(await page.evaluate(()=>GameSave.gameSaves().some(s=>s.key==='rm.ps.fight'&&s.roams)),'Card roams with the profile');await page.screenshot({path:dir+'room-reload.png'});
 console.log('ROOM refresh passed');
 // Street Scrapper II keeps its separate card and its existing physical-screen path.
 await page.keyboard.press('q');await until(()=>!House.focused&&!House.gliding);await playCase(f,'sn.fight');await until(()=>!!RoomTV.dbg()?.dbg);await page.keyboard.press('Enter');await step(10);await page.screenshot({path:dir+'street-scrapper.png'});assert.equal(await page.evaluate(()=>RoomTV.dbg().id),'sn.fight');assert(await page.evaluate(()=>RoomTV._dbg().surface));
 await page.keyboard.press('q');await until(()=>!House.focused&&!House.gliding);await page.evaluate(()=>{if(!Room.owned('dc.duel'))Room._.search('dcbox')});await playCase(f,'dc.duel');await until(()=>!!window.__sabreDbg);await step(180);await page.screenshot({path:dir+'soul-sabre-shared.png'});assert.equal(await page.evaluate(()=>RoomTV.dbg().cv.width),640);
 await page.evaluate(()=>__sabreDbg.cheat({go:'title'}));await page.keyboard.press('Enter');await step(4);await page.evaluate(()=>__sabreDbg.G.pm=4);await page.keyboard.press('z');await step(60);await page.keyboard.press('z');await step(60);await page.keyboard.press('z');await step(60);await page.keyboard.press('z');await until(()=>__sabreDbg.G.scr==='fight'&&__sabreDbg.G.fs==='fight');
 const sharedCard=await page.evaluate(()=>JSON.stringify({unl:__sabreDbg.SV.unl,end:__sabreDbg.SV.end,hi:__sabreDbg.SV.hi}));await page.evaluate(()=>__sabreDbg.G.c.dummy='stand');await page.keyboard.down('ArrowRight');await step(15);await page.keyboard.up('ArrowRight');await page.keyboard.press('z');await step(24);assert(await page.evaluate(()=>(__sabreDbg.G.trainLast?.dmg||0)>0),'Shared engine weapon combat');await page.keyboard.press('Enter');await until(()=>__sabreDbg.G.paused);await page.screenshot({path:dir+'soul-sabre-shared-pause.png'});const sharedFrame=await page.evaluate(()=>__sabreDbg.G.frame);await delay(500);assert.equal(await page.evaluate(()=>__sabreDbg.G.frame),sharedFrame);assert.equal(await page.evaluate(()=>JSON.stringify({unl:__sabreDbg.SV.unl,end:__sabreDbg.SV.end,hi:__sabreDbg.SV.hi})),sharedCard,'Shared card fields preserved');

 assert.deepEqual(f.errors,[]);await browser.close();browser=null;console.log('PASS real room telly, LOCK IN, keyboard/gamepad, house pause, five sizes, refresh, Street Scrapper and shared Soul Sabre');
}

async function scene(name){for(let i=0;i<80;i++){if(await p.evaluate(n=>__teknoDbg.G.scr===n,name))return;await frames(30)}throw Error('Missing scene '+name+' '+await p.evaluate(()=>__teknoDbg.G.scr+'/'+__teknoDbg.G.fs))}
