// World quality pass 2: fixed-camera before/after captures for the visual backlog (docs/BACKLOG.md V01-V30, S01).
// Usage (from any cwd):  node tests/world-quality-2.mjs after [--only=stairs-up,desk-close] [--account=full|sparse] [--tier=low]
//                        node tests/world-quality-2.mjs before ...   (serves app/public/js + css from the branch's merge-base with origin/main instead of the
//                        working tree, so a "before" capture can be repeated at the same camera at any time)
// It owns a disposable server on a free port in 18080-18099 with a new /tmp data directory and never touches real saves.
// Output: tests/shots/world-quality-2/<view>-<tag>.png plus <tag>-draws.json (renderer.calls per view, same tier/viewport).
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),tag=process.argv[2]||'after';
assert(/^[a-z0-9-]+$/i.test(tag),'Use a simple capture tag');
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const only=arg('only')?.split(',')||null,kind=arg('account')||'full',tier=arg('tier')||'low';
// "before" = where this branch left main (stable even when main moves on); --ref=<commit> overrides it
const ref=arg('ref')||execFileSync('git',['merge-base','HEAD','origin/main'],{cwd:root,encoding:'utf8'}).trim();
const dir=root+'tests/shots/world-quality-2';
// [name, eye, target, level, roomPoint?, setup?]  (cm, y down; U = upstairs, G = downstairs; same convention as smoke.mjs)
export const VIEWS=[
 ['bedroom-door',[205,-55,220],[0,-15,10],'U'],
 ['desk-pc',[65,-55,140],[-15,-24,0],'U'],
 ['tv-consoles',[-120,-55,160],[-216,-5,-16],'U'],
 ['landing-stairs',[300,-85,175],[370,220,520],'U'],
 ['kitchen',[120,205,260],[-60,287,170],'G'],
 ['front-garden',[80,95,1950],[60,25,700],'G',[220,195,1040]],
 ['stairs-up',[300,205,660],[372,120,430],'G'],
 ['stairs-side',[290,-40,640],[372,150,420],'U'],
 ['newel-close',[300,245,640],[330,250,600],'G'],
 ['desk-close',[20,-40,70],[10,-5,-25],'U'],
 ['desk-front',[0,-30,110],[0,20,0],'U'],
 ['wardrobe',[0,-45,170],[-230,-40,40],'U'],
 ['bookcase',[-60,-40,140],[-200,-10,30],'U'],
 ['reading-shelf',[-120,-45,120],[-155,-15,245],'U'],
 ['kitchen-units',[-60,215,200],[120,260,-20],'G'],
 ['kitchen-table',[40,215,200],[-60,280,140],'G'],
 ['hall-parcels',[300,225,610],[355,340,650],'G'],
 ['drive-boot',[320,245,715],[430,312,762],'G'],
 ['exterior-corner',[-150,95,1500],[120,0,700],'G',[220,195,1040]],
 ['bedroom-floor',[60,-40,180],[-60,60,140],'U'],
 ['bedside',[60,-45,90],[122,10,-38],'U'],
 ['pc-side',[-80,-38,10],[-15,-22,-12],'U'],
 ['cork-close',[30,-70,45],[42,-84,-55],'U'],
 ['laundry',[40,-30,150],[100,50,222],'U'],
];
let server,fixture,data,log='';
async function cleanup(){if(fixture)await fixture.browser.close().catch(()=>{});fixture=null;if(server&&server.exitCode===null){const done=once(server,'exit');server.kill('SIGTERM');await done}if(data)await rm(data,{recursive:true,force:true})}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>void cleanup().finally(()=>process.exit(1)));
const watchdog=setTimeout(()=>{console.error('Capture timed out');void cleanup().finally(()=>process.exit(1))},1500000);
// "before": every changed front-end file is served from the reference commit (the working tree stays untouched).
const baseline=new Map();
if(tag.startsWith('before')){
 const changed=execFileSync('git',['diff','--name-only',ref,'--','app/public'],{cwd:root,encoding:'utf8'}).split('\n').filter(Boolean);
 for(const f of changed){try{baseline.set('/'+f.replace(/^app\/public\//,''),execFileSync('git',['show',ref+':'+f],{cwd:root,encoding:'utf8',maxBuffer:64<<20}))}catch(e){baseline.set('/'+f.replace(/^app\/public\//,''),null)}}
 console.log('baseline overrides: '+[...baseline.keys()].join(', '));
}
const draws={};
try{
 data=await mkdtemp('/tmp/jhp-wq2-');await mkdir(dir,{recursive:true});
 let port;
 for(let p=18080;p<=18099;p++){const probe=net.createServer();const free=await new Promise(r=>{probe.once('error',()=>r(false));probe.listen(p,'127.0.0.1',()=>probe.close(()=>r(true)))});if(free){port=p;break}}
 assert(port,'No free disposable port');
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',c=>{log+=c});
 for(let i=0;i<600&&!log.includes(`online at :${port}`);i++){assert(server.exitCode===null,'Test server exited');await new Promise(r=>setTimeout(r,100))}
 assert(log.includes(`online at :${port}`),'Test server did not start');const base=`http://127.0.0.1:${port}`;
 const account='Wq'+Date.now().toString(36),password='Throwaway-1999';
 if(kind==='full')assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const t0=Date.now();
 fixture=await roomFixture(base,{tier,...(kind==='full'?{account,password,signup:false}:{opening:true}),onPage:page=>{
  page.setDefaultTimeout(60000);
  page.addInitScript(()=>{const W=window.WebSocket;window.WebSocket=function(...a){const ws=new W(...a);window.__wq2ws=ws;return ws};window.WebSocket.prototype=W.prototype;Object.assign(window.WebSocket,{CONNECTING:0,OPEN:1,CLOSING:2,CLOSED:3})});
  if(baseline.size)page.route(u=>baseline.has(new URL(u).pathname),route=>{const body=baseline.get(new URL(route.request().url()).pathname);return body==null?route.fulfill({status:404,body:''}):route.fulfill({body,contentType:route.request().url().includes('.css')?'text/css':'application/javascript'})});
 }});
 const {page:p,view}=fixture;console.log('room ready after '+((Date.now()-t0)/1000).toFixed(1)+' s; textures '+await p.evaluate(()=>Object.keys(HouseKit.TEX).length+', 2x surface painting '+Math.round(HouseArt.paintMs?.surfaces??-1)+' ms'));
 await p.evaluate(()=>{RoomTV.close?.();Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)});
 if(!only||only.includes('hall-parcels')){
  // Two waiting Pixel Post parcels, delivered as a server status message on this page only (no shop credit or saved order).
  await p.evaluate(()=>window.__wq2ws.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({t:'pmxMe',orders:[{no:990001,id:'hardware.n64',price:0,ts:Date.now()},{no:990002,id:'pm.mag.07',price:0,ts:Date.now()}],today:0,max:3,bal:0})})));
  await fixture.until(()=>!!House.SPOTS['pm.parcel.pm.mag.07']);
 }
 if(arg('eval')){const {readFile}=await import('node:fs/promises');const code=await readFile(arg('eval'),'utf8');console.log('EVAL',JSON.stringify(await p.evaluate(code),null,1))}
 for(const [name,eye,target,level,roomPoint=eye]of VIEWS){
  if(only&&!only.includes(name))continue;
  await view(eye,target,{level,roomPoint});
  if(name==='drive-boot')await p.evaluate(()=>{const b=House.ROOMS.drive?.carBoot;if(b&&!b.open)b.toggle()});
  await p.evaluate(()=>House.dirty());await p.waitForTimeout(900);
  draws[name]=await p.evaluate(()=>__jhpDebug().renderer.calls);
  await p.screenshot({path:`${dir}/${name}-${tag}.png`,timeout:90000,style:'.hs-toast,.balloon{visibility:hidden!important}'});
  if(name==='drive-boot')await p.evaluate(()=>{const b=House.ROOMS.drive?.carBoot;if(b&&b.open)b.toggle()});
  console.log(`shot ${name}-${tag} calls=${draws[name]}`);
 }
 { // --only merges into the tag's existing per-view draw counts instead of replacing them
  let all={};try{all=JSON.parse(await (await import('node:fs/promises')).readFile(`${dir}/${tag}-draws.json`,'utf8'))}catch(e){}
  await writeFile(`${dir}/${tag}-draws.json`,JSON.stringify(Object.assign(all,draws),null,1)); }
 const errs=fixture.errors.filter(e=>!/favicon/.test(e));if(errs.length)console.log('BROWSER ERRORS',errs);
 if(/mod failed to load/.test(log))console.log('SERVER: mod failed to load');
 await cleanup();clearTimeout(watchdog);console.log('DONE '+tag+' '+JSON.stringify(draws));process.exit(errs.length?2:0);
}catch(e){console.error(e);await cleanup();clearTimeout(watchdog);process.exit(1)}
