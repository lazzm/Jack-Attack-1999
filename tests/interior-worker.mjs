// Live-policy worker/fallback, lifecycle, deterministic refresh and camera-race proof.
// Capture the real response before running this live-policy check:
// mkdir -p tests/shots/light/round4
// curl -sS -I https://jacklm.com/ > tests/shots/light/round4/live-headers.txt
// node tests/interior-worker.mjs (owns its disposable server and browser).
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withTestServer} from './perf/server.mjs';
import {roomFixture} from './room-fixture.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
const cspOnly=process.argv.includes('--only=csp');
const dir=new URL('./shots/light/round4/',import.meta.url);await mkdir(dir,{recursive:true});
process.env.LIGHT_WORKER_CSP_TEST='1';process.env.NODE_OPTIONS=[process.env.NODE_OPTIONS,'--require='+fileURLToPath(new URL('./interior-worker-server.cjs',import.meta.url))].filter(Boolean).join(' ');
const live=(await readFile(new URL('live-headers.txt',dir),'utf8')).match(/^content-security-policy:\s*(.+)$/mi)[1].trim(),results=[];
function record(row){results.push(row);console.log('WORKER CASE PASS',row.case)}
await withTestServer(async base=>{
 const account='Worker'+Date.now().toString(36),password='Throwaway-1999';await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});let scenario='normal';const expected=[];
 const f=await roomFixture(base,{account,password,signup:false,resume:true,opening:true,hour:12,storageState:await bonfireLogin(base,password,account,{x:40,y:-70,z:155,rx:0,ry:0,lvl:'U',seat:0}),expectedConsole:[/worker-src 'none'/],onPage:async p=>{
  p.on('console',m=>{if(/worker-src 'none'/.test(m.text()))expected.push(m.text())});
  await p.addInitScript(()=>{window.workerMade=0;window.workerStopped=0;window.workerMaxActive=0;const Real=Worker;if(['silent','suspend'].includes(sessionStorage.workerScenario))window.Worker=class{constructor(){workerMade++}postMessage(){}terminate(){workerStopped++}};else window.Worker=class extends Real{constructor(...args){super(...args);workerMade++;workerMaxActive=Math.max(workerMaxActive,workerMade-workerStopped)}terminate(){workerStopped++;super.terminate()}}});
 }});const p=f.page;
 async function ready(){await f.until(()=>window.House?.live&&window.AccountGate?.allowed&&!document.querySelector('.hs-loading,#houseEntry'));await p.evaluate(()=>Room.ensureHouse());await f.until(()=>window.HouseRooms?.ready);await f.until(()=>Object.values(House.ROOMS).every(r=>!r.lightBake||r.lightBake.stats.ready));}
 async function snapshot(){return p.evaluate(async()=>{const rooms={};for(const r of Object.values(House.ROOMS))if(r.lightBake){const b=r.lightBake,hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('');rooms[r.id]={light:await hash(b.light.image.data),ao:await hash(b.ao.image.data)}}return rooms})}
 async function reload(mode){scenario=mode;await p.evaluate(mode=>{sessionStorage.workerScenario=mode;document.cookie='light_worker_test='+mode+'; path=/'},mode);const response=await p.reload({waitUntil:'domcontentloaded'});assert.equal(response.headers()['content-security-policy'],live+(mode==='blocked'?"; worker-src 'none'":''));}
 try{
  await ready();assert.equal((await (await fetch(base+'/')).headers.get('content-security-policy')),live,'Actual application header must match live HTTPS');const original=await snapshot();assert(await p.evaluate(()=>workerMade>=1));assert.equal(await p.evaluate(()=>workerMaxActive),1);await f.until(()=>workerStopped===workerMade);for(let i=0;i<40&&p.workers().length;i++)await p.waitForTimeout(50);assert.equal(p.workers().length,0);record({case:'real live CSP',policy:live,...await p.evaluate(()=>({workerMade,workerStopped,workerMaxActive})),hashes:original});
  if(!cspOnly){
  // Reproduce the old fixture overwriting an in-flight close-up return.
  await p.evaluate(()=>{House._.setMode('walk');House.focus({...House.P,x:House.P.x-20,z:House.P.z-20},{ms:1,backMs:760})});await f.until(()=>House.focused&&!House.gliding);
  const race=await p.evaluate(()=>{House.unfocus();const result={focused:!!House.focused,gliding:House.gliding,kind:House._.glide.kind};Object.assign(House.P,{x:-90,y:-70,z:175});House.setWalkFrom({...House.P,lvl:'U'});House._.setMode('focus');return result});
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(race.focused,false);assert.equal(race.gliding,true);assert.equal(race.kind,'unfocus');assert.notEqual(await p.evaluate(()=>House.P.x),-90,'Old fixture pose must be overwritten by the pending return');
  await f.view([-90,-70,175],[50,-20,-40]);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.deepEqual(await p.evaluate(()=>[House.P.x,House.P.z]),[-90,175]);record({case:'camera race reproduced and fixed',...race});
  await p.evaluate(()=>{House._.setMode('walk');House.saveWalkState()});const pose=await p.evaluate(()=>({x:House.W.x,z:House.W.z,lvl:House.W.lvl,year:Seasons.today().date.getFullYear(),mode:House.mode,pcOn:House.ROOMS.bedroom.lights().some(l=>l.c==='#b3caec')}));
  assert.equal(pose.year,1999);await reload('normal');await ready();await f.until(()=>House.mode==='walk'&&!House.gliding);assert.deepEqual(await snapshot(),original);assert.deepEqual(await p.evaluate(()=>({x:House.W.x,z:House.W.z,lvl:House.W.lvl,year:Seasons.today().date.getFullYear(),mode:House.mode,pcOn:House.ROOMS.bedroom.lights().some(l=>l.c==='#b3caec')})),pose);record({case:'refresh',pose,identicalAtlases:true});
  }
  await reload('blocked');await ready();assert(expected.length>0,'Browser must actually enforce worker-src none');assert.deepEqual(await snapshot(),original);const blocked=await p.evaluate(()=>Object.fromEntries(Object.values(House.ROOMS).filter(r=>r.lightBake).map(r=>[r.id,{ready:r.lightBake.stats.ready,worker:r.lightBake.stats.worker,reason:r.lightBake.stats.fallback}])));assert(Object.values(blocked).every(r=>r.ready&&!r.worker));record({case:'CSP denied',rooms:blocked});
  if(!cspOnly){
  await reload('silent');await ready();assert.deepEqual(await snapshot(),original);assert.equal(await p.evaluate(()=>workerStopped),1);const silent=await p.evaluate(()=>Object.values(House.ROOMS).filter(r=>r.lightBake).map(r=>r.lightBake.stats.fallback));assert(silent.every(v=>v==='timeout'));record({case:'silent worker timeout',fallback:silent});
  await reload('suspend');await f.until(()=>window.House?.live&&window.HouseRooms?.ready);await p.evaluate(()=>House.warmRooms());await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));assert.equal(await p.evaluate(()=>workerStopped),1);assert(await p.evaluate(()=>Object.values(House.ROOMS).some(r=>r.lightBake&&!r.lightBake.stats.ready)));await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await ready();assert.deepEqual(await snapshot(),original);record({case:'pagehide/pageshow',workerStopped:1,identicalAtlases:true});
  }
  assert.deepEqual(f.errors,[]);console.log('INTERIOR WORKER BROWSER PASS',JSON.stringify(results));
 }finally{await writeFile(new URL(cspOnly?'worker-csp-proof.json':'worker-proof.json',dir),JSON.stringify({results,errors:f.errors,expectedCsp:expected},null,2));await f.browser.close()}
});
