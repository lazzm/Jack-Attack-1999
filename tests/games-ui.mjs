// Every console game's own UI (HUD, menus, text) on the in-room screen AND in LOCK IN, with a power cycle between games.
// node tests/games-ui.mjs [http://localhost:PORT] [--only=dc.taxi,n64.kart]
// Starts and stops its own throwaway server (free port, /tmp data) unless a localhost URL is given.
// In the room it renders the real scene twice in one task, once as-is and once with the screen's HUD texture swapped
// for a blank one: the HUD must change the pixels on the glass (a stale shader binding leaves them identical).
// Between games the console is switched off and the room draws the dark screen, as when a player swaps discs.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),shots=root+'tests/shots/games-ui/';
const arg=process.argv.slice(2).find(a=>/^https?:/.test(a)),only=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
const delay=t=>new Promise(r=>setTimeout(r,t));
let server,data,f,log='';const fails=[];
async function cleanup(){if(f)await f.browser.close().catch(()=>{});if(server?.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill('SIGTERM');await done}if(data)await rm(data,{recursive:true,force:true})}
for(const s of ['SIGINT','SIGTERM'])process.once(s,()=>void cleanup().finally(()=>process.exit(1)));
const watchdog=setTimeout(()=>{console.error('WATCHDOG: games-ui took over 20 minutes');void cleanup().finally(()=>process.exit(1))},1200000);
try{
 await mkdir(shots,{recursive:true});
 let base=arg;
 if(!base){
  const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
  data=await mkdtemp('/tmp/jhp-games-ui-');server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
  for(const s of [server.stdout,server.stderr])s.on('data',b=>log+=b);
  for(let i=0;!log.includes('online at :'+port);i++){assert(i<600&&server.exitCode===null,log);await delay(100)}
  base='http://127.0.0.1:'+port;
 }
 assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Use throwaway localhost data');
 const account='GamesUi'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok,'Register the throwaway account');
 f=await roomFixture(base,{account,password,signup:false});const p=f.page;
 p.setDefaultTimeout(120000);
 const until=async(fn,arg,ms=90000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await p.evaluate(fn,arg).catch(()=>false))return true;await delay(150)}return false};
 await p.evaluate(()=>Apps.load('js/rm-tv.js'));
 const all=only.length?only:await p.evaluate(()=>RoomCat.GAMES.map(g=>g.id));
 assert(only.length||all.length>=20,'Game list from the cartridge catalogue: '+all.length);
 console.log('Games: '+all.join(' '));
 for(const [i,gid] of all.entries()){
  const t0=Date.now(),errs0=f.errors.length,bad=m=>{fails.push(gid+': '+m);console.log('  FAIL '+m)};
  console.log(`[${i+1}/${all.length}] ${gid}`);
  await p.evaluate(gid=>RoomTV.test(gid),gid);
  if(!await until(g=>RoomTV._dbg()?.st==='game'&&RoomTV._dbg()?.gid===g,gid)){bad('never reached the game: '+JSON.stringify(await p.evaluate(()=>RoomTV._dbg())));continue}
  await until(()=>(RoomTV.dbg()?.frame|0)>=50);
  // ---- a console away from the room's sets (the Super Ultra) without its own screen hook plays in its 2D telly view
  const flat=await p.evaluate(()=>{const V=RoomTV._dbg();return !!RoomCat.CONSOLES[V.con]?.away&&!V.surface});
  if(flat){
   const v=await p.evaluate(()=>{const v=document.querySelector('.rm-tvv.on'),c1=v?.querySelector('.rm-c1'),r=c1?.getBoundingClientRect();return v&&r?{w:Math.round(r.width),h:Math.round(r.height),hud:c1===RoomTV.dbg().hud.canvas}:null});
   await p.screenshot({path:shots+gid.replace('.','-')+'-room.jpg',type:'jpeg',quality:70});
   console.log('  telly view '+JSON.stringify(v));if(!v||v.w<200||!v.hud)bad('the 2D telly view does not show the game canvases');
  }
  // ---- in the room: frame the live screen, then prove the HUD reaches the glass
  else{
  const where=await p.evaluate(screenWhere);
  if(!where){bad('no screen for this console in the house');await p.evaluate(()=>RoomTV.close(true));continue}
  const d=Math.max(where.r*3.2,10),eye=[where.c[0]+where.n[0]*d,-(where.c[1]+where.n[1]*d),where.c[2]+where.n[2]*d],target=[where.c[0],-where.c[1],where.c[2]];
  await f.view(eye,target,{level:where.level});
  if(!await until(()=>{const s=window.__guScreen?.();return !!s?.material?.map?.userData?.jackLive},null,30000)){bad('the framed screen never went live');await p.evaluate(()=>RoomTV.close(true));continue}
  await delay(700);
  const room=await p.evaluate(()=>{
   const mesh=window.__guScreen();if(!mesh?.material?.map?.userData?.jackLive)return{err:'live screen went away'};
   const T=THREE,K=RoomTV.dbg(),m=mesh.material,tx=m.map,hud=tx.userData.hud,u=tx.userData.uniforms,ren=House.ren,gl=ren.getContext(),cam=House.camera;
   const sample=(src,w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0,w,h);return g.getImageData(0,0,w,h).data};
   const hv=sample(K.hud.canvas,160,120);let hudPx=0;for(let i=3;i<hv.length;i+=4)if(hv[i]>16)hudPx++;
   const pv=sample(K.cv,160,120);let s=0,s2=0;for(let i=0;i<pv.length;i+=4){const l=(pv[i]+pv[i+1]+pv[i+2])/3;s+=l;s2+=l*l}const nP=pv.length/4,picSd=Math.sqrt(Math.max(0,s2/nP-(s/nP)**2));
   const compiled=ren.properties.get(m).uniforms;
   // the screen's rectangle in drawing-buffer pixels
   const box=new T.Box3().setFromObject(mesh),pts=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])pts.push(new T.Vector3(x,y,z).project(cam));
   const bw=gl.drawingBufferWidth,bh=gl.drawingBufferHeight,xs=pts.map(v=>(v.x+1)/2*bw),ys=pts.map(v=>(v.y+1)/2*bh);
   const x0=Math.max(0,Math.floor(Math.min(...xs))),x1=Math.min(bw,Math.ceil(Math.max(...xs))),y0=Math.max(0,Math.floor(Math.min(...ys))),y1=Math.min(bh,Math.ceil(Math.max(...ys)));
   const w=x1-x0,h=y1-y0;if(w<40||h<30)return{err:'screen not framed: '+w+'x'+h};
   const mask=cam.layers.mask,auto=ren.autoClear;cam.layers.enableAll();ren.autoClear=true;
   const read=()=>{ren.render(House.scene,cam);const px=new Uint8Array(w*h*4);gl.readPixels(x0,y0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);return px};
   const blank=new T.CanvasTexture(document.createElement('canvas'));let a,b;
   try{a=read();const old=u.rmHUD.value;u.rmHUD.value=blank;try{b=read()}finally{u.rmHUD.value=old}}finally{cam.layers.mask=mask;ren.autoClear=auto;blank.dispose();House.dirty()}
   let diff=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>30)diff++;
   let ls=0,ls2=0;for(let i=0;i<a.length;i+=4){const l=(a[i]+a[i+1]+a[i+2])/3;ls+=l;ls2+=l*l}const nA=a.length/4,glassSd=Math.sqrt(Math.max(0,ls2/nA-(ls/nA)**2));
   return{bound:!!compiled&&compiled.rmHUD===u.rmHUD&&u.rmHUD.value===hud,hudPx,picSd:+picSd.toFixed(1),diff,rect:[w,h],glassSd:+glassSd.toFixed(1),power:u.rmPower?.value,uploadAge:Math.round(performance.now()-(tx.userData.uploadAt||0))};
  });
  await p.screenshot({path:shots+gid.replace('.','-')+'-room.jpg',type:'jpeg',quality:70});
  console.log('  room '+JSON.stringify(room));
  if(room.err)bad(room.err);
  else{
   if(!room.bound)bad('the screen shader is not bound to this game\'s HUD texture');
   if(room.hudPx>=20&&room.diff<12)bad(`HUD missing on the in-room glass (${room.hudPx} HUD samples, ${room.diff} changed pixels)`);
   if(room.glassSd<3)bad('the glass is flat (black or blank) in the room');
  }
  }
  // ---- LOCK IN: the native canvases full screen, HUD on top, nothing covering them, native aspect
  await p.evaluate(()=>RoomTV.lockIn(true));await delay(1300);
  const lock=await p.evaluate(()=>{
   const v=document.querySelector('.rm-tvv.rm-lockin.on');if(!v)return{err:'no LOCK IN view'};
   const glass=v.querySelector('.rm-glass'),c0=v.querySelector('.rm-c0'),c1=v.querySelector('.rm-c1'),r=glass.getBoundingClientRect(),K=RoomTV.dbg();
   const shown=e=>{for(let x=e;x&&x!==document.documentElement;x=x.parentElement){const s=getComputedStyle(x);if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.99)return false}return true};
   const hit=document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2)[0],covered=!(hit&&(hit===c1||hit===c0||glass.contains(hit)||v.querySelector('.rm-pad')?.contains(hit)));
   return{w:Math.round(r.width),h:Math.round(r.height),aspect:+(r.width/r.height).toFixed(3),want:+(K.cv.width/K.cv.height).toFixed(3),c0:shown(c0),c1:shown(c1),hudCanvas:c1===K.hud.canvas,covered,hit:hit?hit.className||hit.tagName:''};
  });
  await p.screenshot({path:shots+gid.replace('.','-')+'-lock.jpg',type:'jpeg',quality:70});
  console.log('  lock '+JSON.stringify(lock));
  if(lock.err)bad(lock.err);
  else{
   if(!lock.c0||!lock.c1)bad('a game canvas is hidden in LOCK IN');
   if(!lock.hudCanvas)bad('LOCK IN shows a different HUD canvas from the one the game draws');
   if(lock.covered)bad('something covers the LOCK IN screen: '+lock.hit);
   if(Math.abs(lock.aspect/lock.want-1)>0.03)bad(`LOCK IN aspect ${lock.aspect}, native ${lock.want}`);
   if(lock.w<300)bad('LOCK IN screen too small: '+lock.w);
  }
  await p.evaluate(()=>RoomTV.lockIn(false));await delay(900);
  // power off and let the room draw the dark screen before the next disc goes in
  await p.evaluate(()=>{RoomTV.close(true);House.dirty()});await delay(900);
  const newErrs=f.errors.slice(errs0);if(newErrs.length)bad('browser errors: '+newErrs.join(' | ').slice(0,400));
  console.log(`  ${((Date.now()-t0)/1000).toFixed(1)}s`);
 }
 assert(!/mod failed to load/i.test(log),'Server: mod failed to load');
 if(fails.length){console.error('GAMES UI FAIL\n'+fails.join('\n'));process.exitCode=1}
 else console.log(`GAMES UI PASS: ${all.length} games, HUD on the in-room glass after a power cycle and in LOCK IN, no browser errors`);
}finally{clearTimeout(watchdog);await cleanup()}

// (in the page) the physical screen this game plays on: a cartridge's own screen, the Game Lad's LCD or the bedroom telly
function screenWhere(){
 window.__guScreen=()=>{
  const V=RoomTV._dbg(),def=V&&RoomTV.defs[V.gid];if(!V)return null;
  if(V.surface&&typeof def?.screen==='function')return def.screen();
  const cup=window.HouseRooms?.rooms?.cupboard?.cupScreen,off=window.HouseArt?.t('screenOff');let live=null,dark=null,lcd=null;
  const root=V.con==='gb'?House.THINGS.gb?.obj:House.scene;if(!root)return null;
  root.traverse(o=>{if(!o.isMesh||o===cup||!o.material||Array.isArray(o.material))return;const m=o.material;
   if(m.map?.userData?.jackLive)live=o;else if(off&&m.map===off&&o.geometry?.type!=='PlaneGeometry')dark=dark||o; /* (the bedroom telly's curved glass; the family TV and cupboard sets are flat) */else if(V.con==='gb'&&m.isMeshBasicMaterial&&m.color?.getHex()===0x83956c)lcd=lcd||o});
  return live||(V.con==='gb'?lcd:dark);
 };
 const mesh=window.__guScreen();if(!mesh)return null;
 const T=THREE,c=new T.Vector3(),n=new T.Vector3(0,0,1);mesh.updateWorldMatrix(true,false);if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
 c.copy(mesh.geometry.boundingSphere.center).applyMatrix4(mesh.matrixWorld);n.transformDirection(mesh.matrixWorld);
 const s=new T.Vector3();mesh.getWorldScale(s);const r=mesh.geometry.boundingSphere.radius*Math.max(s.x,s.y,s.z);
 return{c:[c.x,c.y,c.z],n:[n.x,n.y,n.z],r,level:mesh===window.HouseRooms?.rooms?.cupboard?.cupScreen?'G':'U'};
}
