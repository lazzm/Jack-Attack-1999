// Both original games, real keyboard/gamepad input, bounded progression and review captures.
// node tests/games/zip.mjs [--baseline] [--quick]
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {loadavg,availableParallelism} from 'node:os';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from '../room-fixture.mjs';
import {playCase} from '../case-actions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),baseline=process.argv.includes('--baseline'),quick=process.argv.includes('--quick'),flows=process.argv.includes('--flows'),shared=process.argv.includes('--shared'),gallery=process.argv.includes('--gallery');
const shots=root+'tests/shots/games/zip/'+(baseline?'before':'after')+'/',port=+(process.env.ZIP_PORT||18088);
assert(port>=18080&&port<=18099);let server,browser,data,log='';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function cleanup(){if(browser)await browser.close().catch(()=>{});if(server?.exitCode===null){const gone=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');await gone}if(data)await rm(data,{recursive:true,force:true})}
const timer=setTimeout(()=>{console.error('ZIP timeout');void cleanup().finally(()=>process.exit(1))},1500000);
for(const s of ['SIGTERM','SIGINT'])process.once(s,()=>void cleanup().finally(()=>process.exit(1)));
try{
 if(!baseline&&!quick&&!shared&&!gallery)await import('./zip-logic.mjs');
 data=await mkdtemp('/tmp/jhp-zip-');await mkdir(shots,{recursive:true});
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',b=>log+=b);
 for(let i=0;!log.includes('online at :'+port);i++){assert(i<100&&server.exitCode===null,log);await delay(100)}
 const base='http://127.0.0.1:'+port,account='Zip'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 console.log('ZIP server ready');
 const f=await roomFixture(base,{account,password,signup:false,timeoutScale:3,onPage:p=>browser=p.context().browser()}),p=f.page;browser=f.browser;
 if(baseline)for(const name of ['rm-g-zip.js','rm-g-dash.js'])await p.route('**/js/'+name+'*',async r=>r.fulfill({contentType:'application/javascript',body:await readFile('/tmp/zip-before/'+name,'utf8')}));
 await p.evaluate(()=>{if(!Room.owned('dc.dash'))Room._.search('dcbox')});
 const until=async fn=>{for(let i=0;i<600;i++){assert.deepEqual(f.errors,[]);if(await p.evaluate(fn))return;await delay(100)}throw Error('Timeout '+fn)};
 async function frames(n){await p.evaluate(n=>window.zipFrame=RoomTV.dbg().frame+n,n);await until(()=>RoomTV.dbg().frame>=zipFrame)}
 async function press(key){await p.keyboard.press(key);await frames(4)}
 async function shot(name){console.log('SHOT '+name);await p.screenshot({path:shots+name+'.png'});const png=await p.evaluate(()=>{const k=RoomTV.dbg();k._three?.render();const c=document.createElement('canvas');c.width=k.W;c.height=k.H;const g=c.getContext('2d');g.drawImage(k.cv,0,0,c.width,c.height);g.drawImage(k.hud.canvas,0,0,c.width,c.height);return c.toDataURL().split(',')[1]});await writeFile(shots+name+'-native.png',Buffer.from(png,'base64'))}
 async function boot(id){if(await p.evaluate(()=>!!window.RoomTV?.open_)){await p.keyboard.press('q');await f.until(()=>!House.focused&&!House.gliding)}await p.evaluate(()=>{HousePause.close();House.pauseControls(false)});await playCase(f,id);await frames(40);await p.evaluate(()=>RoomTV.lockIn(true))}
 async function perf(name){const result=await p.evaluate(async()=>{const k=RoomTV.dbg(),t=k._three,draw=[];if(t){const gl=t.ren.getContext(),pixel=new Uint8Array(4);for(let i=0;i<35;i++){const s=performance.now();t.render();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);if(i>9)draw.push(performance.now()-s)}}let prev;const raf=[];await new Promise(r=>{function tick(t){if(prev)raf.push(t-prev);prev=t;if(raf.length===90)r();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});const stats=a=>{a.sort((a,b)=>a-b);return a.length?{mean:a.reduce((s,v)=>s+v,0)/a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]}:null};const gl=t?.ren.getContext(),ext=gl?.getExtension('WEBGL_debug_renderer_info');return{camera:t?{p:t.cam.position.toArray(),q:t.cam.quaternion.toArray(),fov:t.cam.fov}:null,calls:t?.ren.info.render.calls,triangles:t?.ren.info.render.triangles,native:[k.cv.width,k.cv.height],hud:[k.W,k.H],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'Canvas 2D',draw:stats(draw),raf:stats(raf)}});result.host={loadavg:loadavg(),cpus:availableParallelism()};console.log('PERF '+name+' '+JSON.stringify(result));await writeFile(shots+name+'-performance.json',JSON.stringify(result,null,2))}
 if(gallery){
  await boot('md.zip');await frames(1000);await shot('zip-attract');await press('Enter');
  const sheet=await p.evaluate(()=>{const all=Object.entries(__zipDo.frames).flatMap(([name,list])=>list.map((cv,i)=>({name:name+i,cv}))),c=document.createElement('canvas');c.width=448;c.height=Math.ceil(all.length/8)*64;const g=c.getContext('2d');g.fillStyle='#181028';g.fillRect(0,0,c.width,c.height);g.font='9px monospace';g.fillStyle='#fff';for(let i=0;i<all.length;i++){const x=i%8*56,y=Math.floor(i/8)*64;g.drawImage(all[i].cv,x+4,y+4);g.fillText(all[i].name,x+2,y+60)}return c.toDataURL().split(',')[1]});await writeFile(shots+'zip-animation-sheet.png',Buffer.from(sheet,'base64'));
  for(const act of [6,8,10]){await p.evaluate(act=>{__zipDo.go(act);const l=__zipDo.level;let x=Math.floor(l.len*.45);while(!Number.isFinite(l.hm[x])&&x<l.len-100)x++;__zipDo.warp(x)},act);await p.keyboard.down('ArrowRight');await press('z');await frames(45);await p.keyboard.up('ArrowRight');await shot('zip-act-'+act+'-mid')}
  await p.evaluate(()=>{__zipDo.go(11);__zipDo.boss()});await frames(210);await p.evaluate(()=>__zipDo.cap());await until(()=>__zipDo.mode()==='won');await frames(40);await shot('zip-ending');await frames(800);await shot('zip-credits');
  await boot('dc.dash');await frames(800);await shot('dash-attract');await press('Enter');await p.evaluate(()=>{__dashDbg.go(4);__dashDbg.BOSS.hp=0;__dashDbg.BOSS.st='dead';__dashDbg.BOSS.t=0});await until(()=>__dashDbg.mode==='ending');await frames(60);await shot('dash-ending');await frames(430);await shot('dash-credits');
  for(const stage of [0,2]){await p.evaluate(stage=>{__dashDbg.go(stage);__dashDbg.tp(__dashDbg.LEN*.5);Object.assign(__dashDbg.P,{v:32,u:0,h:0,vh:0,air:false})},stage);await frames(50);await until(()=>__dashDbg.P.inv<=0||Math.floor(__dashDbg.P.inv*14)%2===0);await shot(stage===0?'dash-whale-chase-reviewed':'dash-avalanche-reviewed');const bounds=await p.evaluate(()=>{const k=RoomTV.dbg(),t=k._three,T=t.T,root=t.scene.children.find(o=>o.isGroup&&o.children.length===1),box=new T.Box3().setFromObject(root),pts=[];for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])pts.push(new T.Vector3(x,y,z).project(t.cam).toArray());return pts});assert(bounds.every(p=>Math.abs(p[0])<1&&Math.abs(p[1])<1),'Chase camera cropped Zip '+stage)}
  for(const [kind,angle,dist,height,look,tag]of [['whale',2.5,40,14,6,'whale-front'],['whale',.5,40,18,6,'whale-rear'],['mon_life',2.5,4,2,1,'life-monitor']]){await p.evaluate(()=>__dashDbg.go(0));await p.evaluate(v=>__dashDbg.view(v.kind,v.angle,v.dist,v.height,v.look),{kind,angle,dist,height,look});await frames(3);await shot('dash-model-'+tag)}
  await p.evaluate(()=>__dashDbg.go(4));await frames(5);await p.evaluate(()=>{__dashDbg.setMode('view');const k=RoomTV.dbg(),v=__dashDbg.BOSS.m.position;__dashDbg.BOSS.m.visible=true;k._three.cam.up.set(0,1,0);k._three.cam.position.set(v.x+8,v.y+6,v.z-14);k._three.cam.lookAt(v.x,v.y+1,v.z)});await frames(3);await shot('dash-model-doctor');
  for(const id of ['md.zip','dc.dash']){const png=await p.evaluate(id=>{let out;House.THINGS['media.'+id]?.obj.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material])){const c=m?.map?.image;if(c?.width===512&&c?.height===320&&c.toDataURL)out=c.toDataURL().split(',')[1]}});return out},id);assert(png,'Missing medium art '+id);await writeFile(shots+id+'-medium.png',Buffer.from(png,'base64'))}
  await p.addStyleTag({url:base+'/css/cx.css'});await p.addScriptTag({url:base+'/js/cx-mag.js'});
  await p.evaluate(()=>{const el=document.createElement('div');el.id='zipPrintReview';el.className='cxd';el.style.cssText='position:fixed;left:0;top:0;width:400px;z-index:999999;background:#fff';el.innerHTML=CXMag.cover(10);document.body.appendChild(el)});await p.evaluate(()=>document.fonts.ready);await p.locator('#zipPrintReview').screenshot({path:shots+'october-cover.png'});await p.evaluate(()=>document.querySelector('#zipPrintReview').remove());
  await p.addScriptTag({url:base+'/js/carta-art.js'});await p.addScriptTag({url:base+'/js/carta-art-games.js'});
  const art=await p.evaluate(()=>{const c=document.createElement('canvas');if(!Carta.art.drawArticle('sonic',c))throw Error('Missing Zip article art');return c.toDataURL().split(',')[1]});await writeFile(shots+'zip-encyclopedia.png',Buffer.from(art,'base64'));
 }else if(shared){
  for(const id of ['n64.kart','dc.taxi','dc.duel']){await boot(id);await frames(id==='dc.duel'?180:8);await shot('shared-'+id);const state=await p.evaluate(()=>{const k=RoomTV.dbg();return{id:k.id,native:[k.cv.width,k.cv.height],aa:k._three?.ren.getContext().getContextAttributes().antialias,calls:k._three?.ren.info.render.calls}});assert.equal(state.id,id);assert(state.calls>0);assert.equal(state.aa,id.startsWith('dc.'));if(id.startsWith('dc.'))assert.deepEqual(state.native,[640,480]);await press('Enter');await frames(8);console.log('SHARED PASS '+JSON.stringify(state))}
 }else{
 await boot('md.zip');await shot('zip-title');await p.evaluate(()=>RoomTV.lockIn(false));await f.view([-120,-55,160],[-178,-5,-16]);await shot('zip-title-room');await p.evaluate(()=>RoomTV.lockIn(true));if(!quick&&!flows){await frames(1000);await shot('zip-attract');await press('Enter');await frames(30)}await press('Enter');await shot('zip-menu');await press('z');await frames(80);assert.equal(await p.evaluate(()=>__zipDo.mode()),'play');await shot('zip-act-0-start');
 await p.keyboard.down('ArrowRight');await frames(180);await p.keyboard.up('ArrowRight');assert((await p.evaluate(()=>__zipDbg().x))>100);await shot('zip-run');await press('z');await shot('zip-jump');for(let n=0;n<3;n++){await frames(7);await shot('zip-sequence-'+n)}await frames(50);
 await press('Enter');await shot('zip-pause');const frozen=await p.evaluate(()=>__zipDbg().x);await frames(30);assert.equal(await p.evaluate(()=>__zipDbg().x),frozen);await press('Enter');await p.evaluate(()=>__zipDo.go(0,300));await press('Enter');await perf('zip');await press('Enter');
 if(!quick&&!flows){for(let n=0;n<(baseline?6:12);n++){await p.evaluate(n=>__zipDo.go(n),n);await frames(75);await shot('zip-act-'+n+'-start');await p.keyboard.down('ArrowRight');await frames(150);await p.keyboard.up('ArrowRight');await p.evaluate(()=>{const l=__zipDo.level;let x=Math.floor(l.len*.45);while(!Number.isFinite(l.hm[x])&&x<l.len-100)x++;__zipDo.warp(x)});await p.keyboard.down('ArrowRight');await press('z');await frames(45);await p.keyboard.up('ArrowRight');await shot('zip-act-'+n+'-mid')}
 await p.evaluate(()=>__zipDo.bonus());await frames(30);await shot('zip-bonus');}
 await boot('dc.dash');await shot('dash-title');await p.evaluate(()=>RoomTV.lockIn(false));await f.view([-120,-55,160],[-178,-5,-16]);await shot('dash-title-room');await p.evaluate(()=>RoomTV.lockIn(true));if(!quick&&!flows){await frames(800);await shot('dash-attract');await press('Enter');await frames(30)}await press('Enter');await shot('dash-menu');await press('z');await frames(50);await press('z');await until(()=>__dashDbg.mode==='play');await shot('dash-stage-0-start');
 await p.keyboard.down('ArrowUp');await frames(160);await p.keyboard.up('ArrowUp');assert((await p.evaluate(()=>__dashDbg.P.s))>20);await shot('dash-run');await press('z');await frames(5);await press('z');await shot('dash-homing');for(let n=0;n<3;n++){await frames(7);await shot('dash-sequence-'+n)}await frames(60);await press('Enter');await shot('dash-pause');const s=await p.evaluate(()=>__dashDbg.P.s);await frames(30);assert.equal(await p.evaluate(()=>__dashDbg.P.s),s);await press('Enter');
 await p.evaluate(()=>{__dashDbg.go(0);__dashDbg.tp(100);__dashDbg.P.v=0});await frames(4);await press('Enter');await p.evaluate(()=>{const c=RoomTV.dbg()._three.cam;c.fov=66;c.updateProjectionMatrix()});await perf('dash');if(!baseline){await p.evaluate(()=>{const k=RoomTV.dbg();k._three.ren.setPixelRatio(1);k._three.ren.setSize(k.W,k.H,false)});await perf('dash-full640');await p.evaluate(()=>{const k=RoomTV.dbg();k._three.ren.setPixelRatio(.5);k._three.ren.setSize(k.W,k.H,false)})}await shot('dash-benchmark');await press('Enter');
 if(!quick&&!flows){for(let n=0;n<5;n++){await p.evaluate(n=>__dashDbg.go(n),n);await frames(25);await shot('dash-stage-'+n+'-start');await p.evaluate(()=>{__dashDbg.tp(__dashDbg.LEN*.5);Object.assign(__dashDbg.P,{v:32,u:0,h:0,vh:0,air:false,homing:null,grind:null})});await frames(50);await until(()=>__dashDbg.P.inv<=0||(Math.floor(__dashDbg.P.inv*14)%2===0));await shot('dash-stage-'+n+'-mid')}
 for(const [ang,tag]of [[.5,'front'],[2.5,'rear'],[-1.4,'side']]){await p.evaluate(ang=>__dashDbg.view('zip',ang,4,2.2,1.15),ang);await frames(2);await shot('dash-model-'+tag)}
 await p.evaluate(()=>__dashDbg.garden());await frames(20);await shot('dash-garden');}
 if(!baseline&&!quick){
  // Real gamepad polling, analogue steering, jump, Start and disconnect.
  await p.evaluate(()=>{__dashDbg.go(0);window.zipPad={id:'Standard test pad',index:0,connected:true,mapping:'standard',axes:[.6,-.5,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[zipPad]});window.dispatchEvent(new Event('gamepadconnected'))});
  await frames(20);assert((await p.evaluate(()=>__dashDbg.P.u))>0);
  await p.evaluate(()=>zipPad.buttons[0]={pressed:true,value:1});await frames(4);assert(await p.evaluate(()=>__dashDbg.P.air));await shot('dash-gamepad-jump');
  await p.evaluate(()=>{zipPad.buttons[0]={pressed:false,value:0};zipPad.buttons[9]={pressed:true,value:1}});await until(()=>__dashDbg.paused);await shot('dash-gamepad-pause');
  await p.evaluate(()=>{delete navigator.getGamepads;window.dispatchEvent(new Event('gamepaddisconnected'))});await frames(4);await press('Enter');
  // A real monitor interaction awards a shield; a real ring collision protects a life.
  await p.evaluate(()=>{__dashDbg.go(0);const m=__dashDbg.MONS.find(m=>m.kind==='shield');window.zipShield=m;Object.assign(__dashDbg.P,{s:m.s-1,u:m.u,h:0,v:0,air:false,inv:0})});
  await press('z');await frames(10);await until(()=>!zipShield.alive);assert(await p.evaluate(()=>__dashDbg.P.shield));await shot('dash-shield');
  await p.evaluate(()=>{__dashDbg.P.inv=0;__dashDbg.hurt()});assert.equal(await p.evaluate(()=>__dashDbg.P.shield),false);
  // Fresh rebuilt stage: cross pickups through gameplay, then prove no recollection after resume.
  await p.evaluate(()=>{__dashDbg.go(0);const r=__dashDbg.RINGS[0];Object.assign(__dashDbg.P,{s:r.s,u:r.u,h:r.h-1.1,v:0,air:false})});await frames(2);
  assert((await p.evaluate(()=>__dashDbg.rings))>0);await press('Enter');await p.evaluate(()=>__dashDbg.save());
  assert(await p.evaluate(()=>GameSave.gameSaves().some(s=>s.key==='rm.dc.dash'&&s.roams)));const dashSave=await p.evaluate(()=>RoomTV.dbg().load().run);assert(await p.evaluate(()=>__dashDbg.resume()));
  assert.equal(await p.evaluate(()=>__dashDbg.P.s),dashSave.player.s);assert.equal(await p.evaluate(()=>__dashDbg.rings),dashSave.rings);assert(await p.evaluate(()=>__dashDbg.RINGS[0].got));await shot('dash-saved-run');
  // Q and T keep house ownership; Esc freezes the game without restarting it.
  await press('Enter');await p.keyboard.press('Escape');await until(()=>House.paused);const escaped=await p.evaluate(()=>__dashDbg.P.s);await delay(500);assert.equal(await p.evaluate(()=>__dashDbg.P.s),escaped);await p.keyboard.press('Escape');await until(()=>!House.paused);
  // Trial objectives are selected by real menu keys, then the real goal collision generates results.
  await p.evaluate(()=>{__dashDbg.setMode('title')});await press('Enter');
  // Saved continue occupies the first entry, Adventure second, Trial third.
  await press('ArrowDown');await press('ArrowDown');await press('z');assert.equal(await p.evaluate(()=>__dashDbg.mode),'trial');await press('ArrowRight');assert.equal(await p.evaluate(()=>__dashDbg.mission),1);await shot('dash-missions');
  await press('z');await frames(45);await press('z');await until(()=>__dashDbg.mode==='play');await p.evaluate(()=>{__dashDbg.tp(__dashDbg.GOAL-1);__dashDbg.P.v=10});await until(()=>__dashDbg.mode==='tally');assert.equal(await p.evaluate(()=>__dashDbg.tally.success),false);await frames(160);await shot('dash-mission-result');
  // Full browser refresh retains the saved paused run and consumed ring; no debug state crosses reload.
  await p.evaluate(()=>__dashDbg.go(0));await frames(30);await press('Enter');await p.evaluate(()=>__dashDbg.save());const beforeReload=await p.evaluate(()=>RoomTV.dbg().load().run);
  await p.reload({waitUntil:'domcontentloaded'});await until(()=>window.AccountGate?.allowed&&window.House?.live&&!document.querySelector('.hs-loading,#houseEntry'));await boot('dc.dash');
  if(await p.evaluate(()=>__dashDbg.mode==='title')){await press('Enter');await press('z')}
  await until(()=>__dashDbg.mode==='play');assert.equal(await p.evaluate(()=>__dashDbg.P.s),beforeReload.player.s);assert(await p.evaluate(()=>__dashDbg.paused));await shot('dash-refresh');
  await p.setViewportSize({width:390,height:844});await shot('dash-portrait');await p.setViewportSize({width:844,height:390});await shot('dash-landscape');await p.setViewportSize({width:1366,height:860});
  await boot('md.zip');await press('Enter');await press('z');await frames(80);
  // Spin dash is charged and released through real input.
  await p.keyboard.down('ArrowDown');await frames(5);for(let n=0;n<3;n++){await press('z');await frames(4)}await shot('zip-spin-charge');await p.keyboard.up('ArrowDown');await frames(3);assert((await p.evaluate(()=>__zipDbg().gsp))>7);await shot('zip-spin-release');
  await p.evaluate(()=>{__zipDo.go(0);__zipDo.rings(10);__zipDo.hit()});await frames(2);assert.equal(await p.evaluate(()=>__zipDbg().rings),0);assert.equal(await p.evaluate(()=>__zipDbg().lives),3);await shot('zip-ring-loss');
  await p.evaluate(()=>__zipDo.go(0));await p.keyboard.down('ArrowRight');await frames(90);await p.keyboard.up('ArrowRight');await press('Enter');await p.evaluate(()=>__zipDo.save());assert(await p.evaluate(()=>GameSave.gameSaves().some(s=>s.key==='rm.md.zip'&&s.roams)));const zipSave=await p.evaluate(()=>RoomTV.dbg().load().run);assert(await p.evaluate(()=>__zipDo.resume()));assert.equal(await p.evaluate(()=>__zipDbg().x),Math.floor(zipSave.player.x));await shot('zip-saved-run');
  // A looping snapshot must reconnect the loop reference to rebuilt level geometry.
  await p.evaluate(()=>{__zipDo.go(0);const l=__zipDo.level.loops[0];Object.assign(__zipDo.P,{x:l.x,y:l.y,gsp:7,loop:{lp:l,th:1.1}});__zipDo.save();__zipDo.resume()});assert(await p.evaluate(()=>__zipDo.P.loop.lp===__zipDo.level.loops[0]));await frames(5);await shot('zip-loop');
  // Goal and bonus tally, then all six release capsules. Hooks only bound the journey to each encounter.
  await p.evaluate(()=>{__zipDo.go(0);__zipDo.sign()});await frames(100);await until(()=>__zipDbg().tally);await frames(200);await shot('zip-results');
  await p.evaluate(()=>{__zipDo.go(0);__zipDo.bonus()});await frames(20);await shot('zip-special-stage');
  for(const act of [1,3,5,7,9,11]){await p.evaluate(act=>{__zipDo.go(act);__zipDo.boss()},act);await frames(210);await shot('zip-boss-'+act+'-capsule');await p.evaluate(()=>__zipDo.cap());await frames(70)}
  // Art stays native; capture the physical case print canvases, not a screenshot of source text.
  for(const id of ['md.zip','dc.dash']){const png=await p.evaluate(id=>{const t=House.THINGS['media.box.'+id];let out,area=0; t?.obj.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material])){const c=m?.map?.image;if(c?.toDataURL&&c.width>=256&&c.width*c.height>area){area=c.width*c.height;out=c.toDataURL().split(',')[1]}}});return out},id);assert(png,'Missing physical cover '+id);await writeFile(shots+id+'-case.png',Buffer.from(png,'base64'))}
 }
 }
 assert.deepEqual(f.errors,[]);assert(!/mod failed to load|uncaught|EADDRINUSE/i.test(log),log);console.log('ZIP PASS');
}finally{clearTimeout(timer);await cleanup()}
