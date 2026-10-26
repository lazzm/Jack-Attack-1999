// Disposable world geometry audit. Run from any cwd: node tests/world-audit.mjs before|after.
// Candidate contacts include buried joins: this reports evidence, never silently calls them clean.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),tag=process.argv[2]||'after';
assert(/^[a-z0-9-]+$/i.test(tag),'Use a simple capture tag');
const viewsOnly=process.argv.includes('--views-only'),walkOnly=process.argv.includes('--walk-only');
const dir=root+'tests/shots/world-audit/'+tag;
let server,fixture,data,log='';
const baseline=new Map();
if(process.env.WORLD_AUDIT_SOURCE_DIR)for(const file of ['hs-world.js','hs-house.js','rm-room.js','ch-out.js'])baseline.set(file,await readFile(process.env.WORLD_AUDIT_SOURCE_DIR+'/'+file,'utf8'));
const watchdog=setTimeout(()=>{console.error('Audit timed out');void cleanup().finally(()=>process.exit(1))},600000);
async function cleanup(){if(fixture)await fixture.browser.close().catch(()=>{});fixture=null;if(server&&server.exitCode===null){const done=once(server,'exit');server.kill('SIGTERM');await done}if(data)await rm(data,{recursive:true,force:true})}
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,()=>void cleanup().finally(()=>process.exit(1)));
const views=[['bedroom',[180,-55,200],[-70,30,30],'U'],['landing',[300,-55,180],[370,160,480],'U'],['hall',[270,225,650],[350,195,400],'G'],['cupboard',[370,265,405],[370,290,280],'G'],['kitchen',[120,225,260],[-60,290,100],'G'],['lounge',[120,225,650],[-120,300,430],'G'],['garden',[20,225,-150],[-40,260,-400],'G'],['drive',[300,225,1000],[200,250,800],'G'],['tree-clearance',[92.5,225,-477.5],[145,168,-500],'G'],['stair-edge',[300,55,400],[329,73,425],'U'],['door-jamb',[205,-25,205],[240,-20,150],'U'],['plate-floor',[90,22,195],[70,72,198],'U'],['plate-edge',[90,60,210],[70,72,198],'U']];
try{
 data=await mkdtemp('/tmp/jhp-world-audit-');await mkdir(dir,{recursive:true});
 let port;
 for(let p=18080;p<=18099;p++){const probe=net.createServer();const free=await new Promise(r=>{probe.once('error',()=>r(false));probe.listen(p,'127.0.0.1',()=>probe.close(()=>r(true)))});if(free){port=p;break}}
 assert(port,'No free disposable port');
 server=spawn(process.execPath,['server.js'],{cwd:root+'app',env:{...process.env,PORT:String(port),DATA_DIR:data,ADMIN_TOKEN:'testtoken'},stdio:['ignore','pipe','pipe']});
 for(const s of [server.stdout,server.stderr])s.on('data',c=>{log+=c});
 for(let i=0;i<150&&!log.includes(`online at :${port}`);i++){assert(server.exitCode===null,'Test server exited');await new Promise(r=>setTimeout(r,100))}
 assert(log.includes(`online at :${port}`),'Test server did not start');const base=`http://127.0.0.1:${port}`;
 const account='Audit'+Date.now().toString(36),password='Throwaway-1999';
 assert((await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
 const selectedAccount=process.argv.find(a=>a.startsWith('--account='))?.slice(10);assert(!selectedAccount||['full','sparse'].includes(selectedAccount),'Unknown audit account');
 for(const kind of (selectedAccount?[selectedAccount]:['full','sparse'])){
  console.log('AUDIT loading '+kind);
  fixture=await roomFixture(base,{...(kind==='full'?{account,password,signup:false}:{}),storage:{jhp_world_audit:1},onPage:page=>{if(baseline.size)page.route('**/js/*.js*',route=>{const body=baseline.get(new URL(route.request().url()).pathname.split('/').pop());return body?route.fulfill({body,contentType:'application/javascript'}):route.continue()})}});
  const {page:p,view}=fixture;p.on('console',m=>{if(m.text().startsWith('audit '))console.log(m.text())});
  await p.evaluate(()=>{Object.values(House.ROOMS).forEach(r=>House.buildRoom(r));House.scene.updateMatrixWorld(true);House._.rebuildGrids()});
  const report=viewsOnly||walkOnly?{faces:0,contacts:[],overlaps:[],camera:{findings:[]}}:await p.evaluate(scanWorld,process.argv.includes('--camera-only'));
  if(!viewsOnly&&!walkOnly){
   await p.evaluate(()=>{for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,true,true)});await p.waitForTimeout(150);
   report.openDoors=await p.evaluate(scanWorld,true);
   await p.evaluate(()=>{for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)});await p.waitForTimeout(150);
  }
  if(tag.startsWith('after')&&!viewsOnly){
   await view([290,225,392],[327.5,300,392],{level:'G'});await p.evaluate(()=>House._.setMode('walk'));
   await p.keyboard.press('f');await fixture.until(()=>House.DOORS.cupboard.open&&House.DOORS.cupboard.ang>.99);
   await view([290,225,392],[380,225,392],{level:'G'});await p.evaluate(()=>House._.setMode('walk'));
   await p.keyboard.down('w');await p.keyboard.press('Space');await p.waitForTimeout(800);await p.keyboard.up('w');assert.equal(await p.evaluate(()=>House.here),'hall','Standing player crossed a low lintel');
   await p.keyboard.down('c');await p.waitForTimeout(800);await p.keyboard.down('w');
   for(let i=0;i<16;i++){await p.waitForTimeout(100);assert(await p.evaluate(()=>Math.abs(House.P.x-330)>4||House.P.y>262),'Camera crossed the low lintel');}
   await p.keyboard.up('w');await p.keyboard.up('c');await p.waitForTimeout(350);
   report.cupboardWalk=await p.evaluate(()=>({room:House.here,x:House.W.x,z:House.W.z,ceilingGap:House.P.y-House.ROOMS.cupboard.ceilingAt(House.W.x,House.W.z)}));assert(report.cupboardWalk.ceilingGap>=3,'Camera crossed the cupboard soffit');assert.equal(report.cupboardWalk.room,'cupboard','Could not walk through the cupboard entrance');
   await writeFile(`${dir}/${kind}-walk-diagnostic.json`,JSON.stringify(report.cupboardWalk,null,2));
   await p.screenshot({path:`${dir}/${kind}-cupboard-walk.png`});await p.evaluate(()=>House.saveWalkState());await p.waitForTimeout(600);
   // Reproduce the legacy 0.1 cm save rounding after pagehide has saved the raw pose.
   await p.evaluate(()=>sessionStorage.setItem('worldAuditRoundNext','1'));
   await p.addInitScript(()=>{if(sessionStorage.getItem('worldAuditRoundNext')==='1'){for(const key of ['jhp_hs_stand','jhp_hs_pose']){const value=JSON.parse(localStorage.getItem(key)||'null'),pose=key==='jhp_hs_stand'?value?.p:value;if(pose){pose.x=+pose.x.toFixed(1);pose.z=+pose.z.toFixed(1);localStorage.setItem(key,JSON.stringify(value));}}sessionStorage.removeItem('worldAuditRoundNext');}});
   await p.reload({waitUntil:'domcontentloaded'});await fixture.until(()=>window.AccountGate?.allowed&&window.House?.live&&House.mode==='walk'&&window.HouseRooms?.ready&&!document.querySelector('.hs-loading,#houseEntry'));
   const restored=await p.evaluate(()=>({room:House.here,x:House.W.x,z:House.W.z}));report.cupboardWalk.restored=restored;assert.equal(restored.room,'cupboard');assert(Math.hypot(restored.x-report.cupboardWalk.x,restored.z-report.cupboardWalk.z)<1,'Cupboard refresh moved the player');
   await p.screenshot({path:`${dir}/${kind}-cupboard-refresh.png`});
   if(walkOnly){assert.deepEqual(fixture.errors,[]);await fixture.browser.close();fixture=null;console.log('CUPBOARD WALK/REFRESH PASS '+kind);continue;}
  }
  await p.evaluate(()=>{for(const d of Object.values(House.DOORS))if(!d.always)House.setDoor(d.id,false,true)});await p.waitForTimeout(150);
  // Each finding links to its room overview. The highest ranked source clusters also get close-ups.
  for(const [room,eye,target,level]of views){await view(eye,target,{level});await p.screenshot({path:`${dir}/${kind}-${room}.png`,style:'.hs-toast,.balloon{visibility:hidden!important}'});}
  const ranked=[...report.camera.findings,...(report.openDoors?.camera.findings||[]),...(report.coverage?.findings||[]),...report.overlaps,...(report.staticContacts||[])].sort((a,b)=>(b.rank||b.area||0)-(a.rank||a.area||0));
  const clusters=new Map();for(const f of ranked){f.screenshot=`${kind}-${views.some(v=>v[0]===f.room)?f.room:'hall'}.png`;const k=f.kind+'|'+f.room+'|'+f.source;if(!clusters.has(k))clusters.set(k,f)}
  let n=0;for(const f of [...clusters.values()].slice(0,24)){
   if(!f.point)continue;const level=HouseLevel(f.room),eye=f.eye||[f.point[0]+35,f.point[1]-38,f.point[2]+65];
   await view(eye,f.point,{level});const shot=`${kind}-finding-${String(++n).padStart(2,'0')}.png`;await p.screenshot({path:dir+'/'+shot,style:'.hs-toast,.balloon{visibility:hidden!important}'});
   for(const g of ranked)if(g.kind===f.kind&&g.room===f.room&&g.source===f.source)g.screenshot=shot;
  }
  await p.setViewportSize({width:1920,height:1080});
  for(const [name,eye,target,level]of [
   ['plate', [54,38,190],[70,72,198],'U'],['jamb',[280,-40,215],[245,-30,150],'U'],
   ['stairs',[300,55,565],[329,73,475],'U'],['tree',[75,225,-440],[145,140,-500],'G'],
   ['mower',[255,263,785],[196,285,748],'G']]){
   await view(eye,target,{level});await p.screenshot({path:`${dir}/${kind}-wide-${name}.png`,style:'.hs-toast,.balloon{visibility:hidden!important}'});
  }
  await p.setViewportSize({width:1366,height:860});
  report.carry={note:'Disposable 50 cm console carton and 48 cm CRT geometry exercise the real grab API. The installed PC monitor itself is fixed, not grabbable.',samples:0,inside:[],shots:[]};
  for(const prop of (process.argv.includes('--no-carry')?[]:['carton','crt'])){
   await p.evaluate(prop=>{const g=new THREE.Group(),B=HouseKit.into(g);if(prop==='carton')B.box(0,-16,0,50,32,40,HouseKit.mat('#ba9560'));else{B.rbox(0,-27,-3,48,38,48,2,HouseKit.mat('#d7cfb7'));B.box(0,-3,0,26,6,30,HouseKit.mat('#c5bda7'));}House.thing('audit.'+prop,{obj:g,home:{room:'bedroom',x:0,y:73,z:180},label:'Audit '+prop,holdD:65})},prop);
   for(const [name,eye,level,yaw]of [['east',[212.5,-55,182.5],'U',90],['west',[-247.5,-55,172.5],'U',-90],['stairs',[370,25,350],'U',90],['backdoor',[120,225,-90],'G',180]]){
    await view(eye,[eye[0]+Math.sin(yaw*Math.PI/180)*40,eye[1],eye[2]-Math.cos(yaw*Math.PI/180)*40],{level});
    await p.evaluate(prop=>{if(!House.held())House.grab('audit.'+prop)},prop);await p.waitForTimeout(350);
    for(let turn=0;turn<16;turn++){
     await p.evaluate(yaw=>{House.P.ry=yaw;House.dirty()},yaw+turn*22.5);await p.waitForTimeout(100);
     const clearance=await p.evaluate(prop=>{House.scene.updateMatrixWorld(true);const t=House.THINGS['audit.'+prop],b=new THREE.Box3().setFromObject(t.obj),eye=new THREE.Vector3(House.P.x,-House.P.y,House.P.z);return{inside:b.containsPoint(eye),distance:b.distanceToPoint(eye)}},prop);
     report.carry.samples++;if(clearance.inside)report.carry.inside.push({prop,name,turn,...clearance});
     if(turn===0||turn===8){const shot=`${kind}-carry-${prop}-${name}-${turn}.png`;await p.screenshot({path:dir+'/'+shot});report.carry.shots.push(shot);}
    }
   }
   await p.evaluate(prop=>{House.putBack();const t=House.THINGS['audit.'+prop];House.unspot(t.id);t.obj.parent?.remove(t.obj);delete House.THINGS[t.id]},prop);
  }
  report.captureCoverage={overviews:views.length,closeups:n,sourceClusters:clusters.size,remaining:'All findings link to a room overview; only the top 24 source clusters have close-ups.'};
  await writeFile(`${dir}/${kind}${viewsOnly?'-views':''}.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({account:kind,faces:report.faces,contacts:report.contacts.length,overlapCandidates:report.overlaps.length,staticContacts:report.staticContacts?.length,camera:report.camera,openDoors:report.openDoors?.camera,coverage:report.coverage,carry:report.carry,ranked:report.overlaps.slice(0,15)},null,2).slice(0,14000));
  if(tag.startsWith('after')){
   assert.deepEqual(report.camera.findings,[],'Camera clearance/back-face findings remain');
   assert.deepEqual(report.openDoors?.camera.findings||[],[],'Open-door camera findings remain');
   assert.deepEqual(report.coverage?.findings||[],[],'Shell coverage holes remain');
   assert.deepEqual(report.openDoors?.coverage?.findings||[],[],'Open-door shell holes remain');
   assert.deepEqual(report.contacts,[],'Exact prop support contacts remain');
   assert.deepEqual(report.carry.inside,[],'Camera entered a carried item');
  }
  assert.deepEqual(fixture.errors,[],'Audit browser errors');
  await fixture.browser.close();fixture=null;
 }
 assert(!/mod failed to load|SyntaxError|ReferenceError/.test(log),'Server module errors');
 await writeFile(dir+'/server.log',log);console.log('WORLD AUDIT completed; candidates require review: '+dir);
}catch(e){console.error(e);process.exitCode=1}finally{clearTimeout(watchdog);await cleanup()}
function HouseLevel(room){return ['bedroom','landing'].includes(room)?'U':'G'}
function scanWorld(cameraOnly=false){
 const T=THREE,H=House,rooms=Object.values(H.ROOMS),roomGroups=new Set([...rooms.map(r=>r.group),...Object.values(H.DOORS).flatMap(d=>[d.pivot,d.frame]).filter(Boolean)]);
 const triangles=[],planes=new Map(),textures=new Map(Object.entries(HouseKit.TEX).map(([k,t])=>[t,k]));
 const v=new T.Vector3(),nm=new T.Matrix3(),normal=new T.Vector3();let meshes=0;
 const sourceOf=o=>{for(let p=o;p;p=p.parent){if(p.userData.auditSource)return p.userData.auditSource;const s=p.userData.edSrc;if(s)return s.file+':'+s.line}return 'unmapped'};
 const roomOf=o=>{for(let p=o;p;p=p.parent){const r=rooms.find(r=>r.group===p);if(r)return r.id;const d=Object.values(H.DOORS).find(d=>d.pivot===p||d.frame===p);if(d)return d.rooms[0]||'world'}return 'world'};
 H.scene.traverse(o=>{
  if(!o.isMesh||!o.geometry||o.userData.contactShadow||o.userData.noPick)return;
  for(let p=o;p;p=p.parent)if(!p.visible&&!roomGroups.has(p))return;
  const g=o.geometry,a=g.attributes.position,N=g.attributes.normal;if(!a||!N)return;meshes++;nm.getNormalMatrix(o.matrixWorld);const winding=Math.sign(o.matrixWorld.determinant());
  const ix=g.index,count=ix?ix.count:a.count,groups=g.groups.length?g.groups:[{start:0,count,materialIndex:0}];
  for(const group of groups){const m=Array.isArray(o.material)?o.material[group.materialIndex]:o.material;if(!m||!m.visible||m.transparent||m.depthWrite===false)continue;
   for(let i=group.start;i+2<Math.min(count,group.start+group.count);i+=3){
    const ids=[0,1,2].map(j=>ix?ix.getX(i+j):i+j),pts=ids.map(j=>v.fromBufferAttribute(a,j).applyMatrix4(o.matrixWorld).clone());
    normal.subVectors(pts[1],pts[0]).cross(new T.Vector3().subVectors(pts[2],pts[0])).normalize().multiplyScalar(winding);
    const lo=[0,1,2].map(k=>Math.min(...pts.map(p=>p.getComponent(k)))),hi=[0,1,2].map(k=>Math.max(...pts.map(p=>p.getComponent(k))));
    const source=o.userData.auditSources?.find(s=>i>=s.start&&i<s.start+s.count)?.source||sourceOf(o),axis=lo.findIndex((n,k)=>hi[k]-n<.001);
    const tr={a:pts[0],b:pts[1],c:pts[2],normal:normal.clone(),lo,hi,axis,source,room:roomOf(o),mesh:o.id,texture:textures.get(m.map)||m.color?.getStyle(),side:m.side,bias:m.polygonOffset};
    const area=new T.Triangle(...pts).getArea();if(area<.001)continue;
    triangles.push(tr);
    if(!cameraOnly&&axis>=0&&!m.polygonOffset){const k=axis+':'+Math.round(lo[axis]/.02);if(!planes.has(k))planes.set(k,[]);planes.get(k).push(tr)}
   }
  }
 });
 console.log("audit faces",triangles.length);
 const overlaps=new Map(),staticContacts=new Map();
 function clip(poly,b){let result=poly;const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),sign=Math.sign(cross(b[0],b[1],b[2]));for(let k=0;k<3;k++){const a=b[k],c=b[(k+1)%3],input=result;result=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],cp=cross(a,c,p)*sign,cq=cross(a,c,q)*sign;if(cp>=0)result.push(p);if((cp>=0)!==(cq>=0)){const t=cp/(cp-cq);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}}return {center:result.length?[0,1].map(k=>result.reduce((s,p)=>s+p[k],0)/result.length):[0,0],area:Math.abs(result.reduce((sum,p,i)=>{const q=result[(i+1)%result.length];return sum+p[0]*q[1]-q[0]*p[1]},0))/2}}
 for(const [key,list]of planes){const [axis,bucket]=key.split(':').map(Number),axes=[0,1,2].filter(k=>k!==axis),other=[...list,...(planes.get(axis+':'+(bucket+1))||[])];other.sort((a,b)=>a.lo[axes[0]]-b.lo[axes[0]]);
  for(let i=0;i<other.length;i++)for(let j=i+1;j<other.length&&other[j].lo[axes[0]]<other[i].hi[axes[0]]-.001;j++){
   const a=other[i],b=other[j];if(Math.round(a.lo[axis]/.02)!==bucket&&Math.round(b.lo[axis]/.02)!==bucket||Math.abs(a.lo[axis]-b.lo[axis])>.0201)continue;const facing=a.normal.dot(b.normal),support=axis===1&&facing<-.99;if(facing<.99&&!support)continue;
   if(Math.min(a.hi[axes[1]],b.hi[axes[1]])-Math.max(a.lo[axes[1]],b.lo[axes[1]])<.001)continue;
   const proj=t=>[t.a,t.b,t.c].map(p=>axes.map(k=>p.getComponent(k))),overlap=clip(proj(a),proj(b)),area=overlap.area;if(area<.05)continue;
   const k=[a.room,b.room,a.source,b.source,axis,a.lo[axis].toFixed(2),a.texture,b.texture].join('|');
   const candidates=support?staticContacts:overlaps;
   if(!candidates.has(k)){const p=new T.Vector3();p.setComponent(axis,(a.lo[axis]+b.lo[axis])/2);axes.forEach((axis,k)=>p.setComponent(axis,overlap.center[k]));candidates.set(k,{kind:support?'support-contact':'coplanar',room:a.room,source:a.source,otherSource:b.source,area:0,separation:Math.abs(a.lo[axis]-b.lo[axis]),axis,textures:[a.texture,b.texture],point:[p.x,-p.y,p.z],classification:support?'opposing support faces; normally hidden, not flicker by themselves':'candidate: may be buried model join'})}
   candidates.get(k).area+=area;
  }
 }
 const contacts=[];for(const t of Object.values(H.THINGS)){if(!t.obj.visible||!['rest','snap'].includes(t.st))continue;const r=H.ROOMS[t.at.room];if(!r)continue;const box=new T.Box3();t.obj.traverse(o=>{if(o.isMesh&&!o.userData.contactShadow&&o.visible)box.expandByObject(o)});const bottom=-box.min.y;for(const y of [r.lvl==='U'?73:353,...r.supports.filter(s=>t.at.x>=s.x0&&t.at.x<=s.x1&&t.at.z>=s.z0&&t.at.z<=s.z1).map(s=>s.y)])if(Math.abs(bottom-y)<.02)contacts.push({id:t.id,room:r.id,source:sourceOf(t.obj),bottom,surface:y,classification:'exact support contact; opposing hidden faces alone are not flicker',point:[t.at.x,y,t.at.z]})}
 // Median BVH, local to this diagnostic. Raycasting the entire raw scene per cell is prohibitive.
 function tree(ids){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const id of ids)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],triangles[id].lo[k]);hi[k]=Math.max(hi[k],triangles[id].hi[k])}const box=new T.Box3(new T.Vector3(...lo),new T.Vector3(...hi));if(ids.length<=16)return{box,ids};const axis=[0,1,2].sort((a,b)=>(hi[b]-lo[b])-(hi[a]-lo[a]))[0];ids.sort((a,b)=>(triangles[a].lo[axis]+triangles[a].hi[axis])-(triangles[b].lo[axis]+triangles[b].hi[axis]));const mid=ids.length>>1;return{box,left:tree(ids.slice(0,mid)),right:tree(ids.slice(mid))}}
 const bvh=tree(triangles.map((_,i)=>i));
 const ray=new T.Ray(),hit=new T.Vector3(),boxHit=new T.Vector3(),directions=Array.from({length:16},(_,i)=>new T.Vector3(Math.sin(i*Math.PI/8),0,Math.cos(i*Math.PI/8))),issues=new Map();directions.push(new T.Vector3(0,1,0),new T.Vector3(0,-1,0));
 let edgeHits=0,coverageRays=0;const coverage=[];
 const near=H.camera.near*Math.sqrt(1+Math.tan(H.camera.fov*Math.PI/360)**2*(1+H.camera.aspect**2));let cells=0,rays=0;const byRoom={},visitedCells=new Set();
 function nearestHit(limit=81){let nearest=null,dist=limit;const stack=[bvh];while(stack.length){const n=stack.pop();if(!n.box.containsPoint(ray.origin)&&(!ray.intersectBox(n.box,boxHit)||boxHit.distanceToSquared(ray.origin)>dist*dist))continue;if(n.ids){for(const id of n.ids){const t=triangles[id];if(ray.intersectTriangle(t.a,t.b,t.c,false,hit)){const distance=hit.distanceTo(ray.origin);if(distance<dist){dist=distance;nearest=t}}}}else stack.push(n.left,n.right)}return{nearest,dist}}
 const record=(kind,tr,eye,distance,room)=>{const k=kind+'|'+room+'|'+tr.source+'|'+tr.axis;if(!issues.has(k))issues.set(k,{kind,room,source:tr.source,count:0,distance,rank:kind==='near-plane'?100000:50000,eye,point:[hit.x,-hit.y,hit.z]});const f=issues.get(k);f.count++;if(distance<f.distance){f.distance=distance;f.eye=eye;f.point=[hit.x,-hit.y,hit.z]}};
 for(const r of rooms){byRoom[r.id]=0;for(const area of r.area)for(let x=Math.ceil(area[0]/10)*10+2.5;x<area[2];x+=10)for(let z=Math.ceil(area[1]/10)*10+2.5;z<area[3];z+=10){
  const stair=r.id!=='cupboard'&&H._.grids.stairs.find(s=>x>=s.x0+10&&x<=s.x1-6&&z>=s.z0&&z<=s.z1),fy=stair?stair.y(x,z):r.lvl==='U'?73:353;
  const normalHeight=r.eye||128,lowHeight=H._.doorHeadroom?.(x,z,r.lvl,fy),heights=[normalHeight,Math.min(normalHeight-38,lowHeight?lowHeight-10:Infinity)];
  const floor=H._.floorAt(x,z,r.lvl,fy,heights[0])||H._.floorAt(x,z,r.lvl,fy,heights[1]);if(!floor||floor.lvl!==r.lvl&&!(r.id==='landing'&&stair)||r.id==='cupboard'&&Math.abs(floor.y-353)>1)continue;const cellKey=x+','+z+','+floor.y;if(visitedCells.has(cellKey))continue;visitedCells.add(cellKey);cells++;byRoom[r.id]++;
  for(const height of heights){if(!H._.floorAt(x,z,r.lvl,fy,height))continue;const eye=[x,floor.y-height,z];ray.origin.set(x,-eye[1],z);
   for(const d of directions){ray.direction.copy(d);rays++;const {nearest,dist}=nearestHit();if(!nearest)continue;ray.at(dist,hit);if(dist<near+.5)record('near-plane',nearest,eye,dist,r.id);else if(nearest.side===T.FrontSide&&nearest.normal.dot(d)>.01){const bary=T.Triangle.getBarycoord(hit,nearest.a,nearest.b,nearest.c,new T.Vector3());if(Math.min(bary.x,bary.y,bary.z)<.00001)edgeHits++;else record('back-face',nearest,eye,dist,r.id);}}
   if(!r.outside){
    for(const up of [true,false]){ray.direction.set(0,up?1:-1,0);const {nearest,dist}=nearestHit(600);coverageRays++;const ceiling=stair?-185:r.lvl==='U'?-185:95,expected=up?eye[1]-ceiling:height;
     if(!nearest||(!up&&dist>expected+8))coverage.push({kind:up?'ceiling-hole':'floor-hole',room:r.id,source:nearest?.source||'no opaque surface within 600 cm',eye,distance:nearest?dist:null,point:[x,up?ceiling:floor.y,z]});
    }
   }
  }
 }}
 return{units:'centimetres; world y-down',method:{overlapScan:!cameraOnly,grid:10,eyeHeights:'standing and crouch (-38 cm, lower near low lintels)',yawDirections:16,verticalDirections:2,rayRange:81,nearCornerRadius:near,notes:'All rooms built; hidden inventories, transparent glazing and contact shadows excluded. Back-face and coplanar results are candidates, not pixel proof. Axis-aligned triangle overlaps use exact polygon clipping; curved/non-axis coplanar faces and distant holes need manual review. Door states use the current closed scene. Vertical shell coverage also probes 600 cm, with stairwell ceiling height; no hit and excessive floor distance are reported separately. Carry tests use the real grab API with temporary diagnostic props.'},meshes,faces:triangles.length,bottomOffsets:Object.values(H.THINGS).filter(t=>(t.bottomOffset||0)>.02).map(t=>({id:t.id,offset:t.bottomOffset})),overlaps:[...overlaps.values()].sort((a,b)=>b.area-a.area),staticContacts:[...staticContacts.values()].sort((a,b)=>b.area-a.area),contacts,coverage:{rays:coverageRays,findings:coverage},camera:{cells,rays,byRoom,edgeHits,findings:[...issues.values()].sort((a,b)=>b.count-a.count)}};
}
