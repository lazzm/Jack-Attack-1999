// Night readability review: native captures plus global and LOCAL luminance numbers around doors, handles,
// usable objects and floor clutter, on a pinned adaptation rung. Disposable data only.
// node night-separation.mjs <tag> [--phone] [--adapt=0|4|5] [--views=a,b] [--base=<git ref>] [--files=a.js,b.js]
// --base serves the named app/public/js files from a git ref (a paired "before" in the same session/host).
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {withTestServer} from './perf/server.mjs';
import {bonfireLogin} from './bonfire-login.mjs';
import {roomFixture} from './room-fixture.mjs';
const arg=(k,d)=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const tag=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'night',phone=process.argv.includes('--phone'),adapt=Number(arg('adapt','0'));
const dir=new URL(`./shots/night-separation/${tag}/`,import.meta.url).pathname;await mkdir(dir,{recursive:true});
const views=[
 ['bedroom',[-90,-70,175],[50,-20,-40],'U'],
 ['landing',[300,-70,200],[380,-25,480],'U'],
 ['hall',[265,210,640],[335,255,310],'G'],
 ['lounge',[100,210,520],[-210,260,500],'G'],
 ['kitchen',[100,210,240],[-100,265,-145],'G'],
 ['garden',[120,210,-260],[-40,280,-1000],'G'],
 // round 2: the patio and near lawn looking back at the kitchen, and the bed under the window
 ['patio',[60,195,-780],[-30,300,-176],'G'],
 ['bed',[-40,-60,215],[200,5,-20],'U'],
].filter(v=>!arg('views')||arg('views').split(',').includes(v[0]));
await withTestServer(async base=>{
 const account='Night'+Date.now().toString(36),password='Throwaway-1999';
 await fetch(base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});
 const ref=arg('base'),files=(arg('files','hs-kit.js,hs-world.js,hs-house.js,rm-room.js,hs-static.js')).split(',');
 const f=await roomFixture(base,{...(phone?{width:390,height:844,touch:true,contextOptions:{isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36',deviceScaleFactor:1}}:{}),account,password,signup:false,resume:true,opening:true,
  storageState:await bonfireLogin(base,password,account,{x:-90,y:-85,z:175,rx:0,ry:0,lvl:'U',seat:0}),hour:22,seed:1999,timeoutScale:2,
  onPage:async p=>{if(ref)for(const file of files)await p.route('**/js/'+file+'*',r=>r.fulfill({body:execFileSync('git',['show',ref+':app/public/js/'+file],{encoding:'utf8'}),contentType:'application/javascript'}))}});
 const {page:p}=f,rows=[];
 try{
  await p.evaluate(adapt=>{House.adapt(adapt,{pin:true,force:true});HouseFamily.debug.hide(true);House.hush();for(const r of Object.values(House.ROOMS))House.buildRoom(r);StoryGuide.setting('off');House.ambient.clear();House.anims.clear();House.relight();House.dirty()},adapt);
  await f.until(()=>Object.values(House.ROOMS).every(r=>!r.lightBake||r.lightBake.stats.ready!==false));
  await p.waitForTimeout(1500);
  for(const [name,eye,target,level] of views){
   await f.view(eye,target,{level});await p.waitForTimeout(700);
   const row=await p.evaluate(()=>{
    const H=House,T=H.T,r=H.ren,gl=r.getContext(),cam=H.camera;
    H._.renderForBenchmark();
    const W=gl.drawingBufferWidth,Hh=gl.drawingBufferHeight,px=new Uint8Array(W*Hh*4);gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,px);
    const L=new Float32Array(W*Hh);for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const i=((Hh-1-y)*W+x)*4;L[y*W+x]=.2126*px[i]+.7152*px[i+1]+.0722*px[i+2]}
    const pct=(a,q)=>a[Math.min(a.length-1,Math.floor(a.length*q))];
    const stats=(x0,y0,x1,y1,step=1)=>{const a=[];for(let y=Math.max(0,y0|0);y<Math.min(Hh,y1|0);y+=step)for(let x=Math.max(0,x0|0);x<Math.min(W,x1|0);x+=step)a.push(L[y*W+x]);if(a.length<16)return null;a.sort((p,q)=>p-q);let s=0;for(const v of a)s+=v;return{n:a.length,mean:s/a.length,p5:pct(a,.05),p95:pct(a,.95),contrast:pct(a,.95)-pct(a,.05)}};
    // Global: the skill inspector's coarse grid (160x90 samples), 8-bit Rec.709 luma, P95-P5.
    const sx=Math.max(1,Math.floor(W/160)),sy=Math.max(1,Math.floor(Hh/90)),g=[];let edges=0,checked=0;
    for(let y=0;y<Hh;y+=sy)for(let x=0;x<W;x+=sx)g.push(L[y*W+x]);
    const cols=Math.floor(W/sx);for(let i=0;i+cols+1<g.length;i++){if((i+1)%cols===0)continue;if(Math.max(Math.abs(g[i]-g[i+1]),Math.abs(g[i]-g[i+cols]))>12)edges++;checked++}
    const gs=g.slice().sort((a,b)=>a-b);const global={mean:gs.reduce((a,b)=>a+b,0)/gs.length,p5:pct(gs,.05),p95:pct(gs,.95),contrast:pct(gs,.95)-pct(gs,.05),edgeDensity:edges/checked};
    // Local: 32-pixel tiles, P90-P10 inside each; median and lower quartile over the frame and over its lower half (floor clutter).
    const tiles=[],lower=[];for(let y=0;y+32<=Hh;y+=32)for(let x=0;x+32<=W;x+=32){const a=[];for(let j=0;j<32;j+=2)for(let i=0;i<32;i+=2)a.push(L[(y+j)*W+x+i]);a.sort((p,q)=>p-q);const c=pct(a,.9)-pct(a,.1);tiles.push(c);if(y>=Hh/2)lower.push(c)}
    tiles.sort((a,b)=>a-b);lower.sort((a,b)=>a-b);
    const local={tileMedian:pct(tiles,.5),tileQ1:pct(tiles,.25),lowerMedian:pct(lower,.5),lowerQ1:pct(lower,.25)};
    // Named surfaces: door leaves, their levers, and every usable spot nearby, as projected boxes.
    const v=new T.Vector3(),box=new T.Box3(),camPos=cam.getWorldPosition(new T.Vector3()),frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
    const rect=b=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<8;i++){v.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).project(cam);if(v.z>1)return null;const X=(v.x+1)/2*W,Y=(1-v.y)/2*Hh;x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y)}x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(W,x1);y1=Math.min(Hh,y1);return x1-x0>=6&&y1-y0>=6?[x0,y0,x1,y1]:null};
    const region=(kind,id,b)=>{if(b.isEmpty()||!frustum.intersectsBox(b))return null;const d=b.getCenter(new T.Vector3()).distanceTo(camPos);if(d>700)return null;const rc=rect(b);if(!rc)return null;const area=(rc[2]-rc[0])*(rc[3]-rc[1]);if(area>W*Hh*.45)return null;
     // the object's own box, and a ring around it (box grown by 35%) for figure/ground separation
     const s=stats(...rc,area>40000?2:1);if(!s)return null;const gx=(rc[2]-rc[0])*.35,gy=(rc[3]-rc[1])*.35,o=stats(rc[0]-gx,rc[1]-gy,rc[2]+gx,rc[3]+gy,2);
     return{kind,id,dist:Math.round(d),rect:rc.map(Math.round),mean:+s.mean.toFixed(1),contrast:+s.contrast.toFixed(1),ring:o?+Math.abs(o.mean-s.mean).toFixed(1):null}};
    const regions=[];
    const visible=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};
    for(const id in H.DOORS){const d=H.DOORS[id];if(!d.pivot||!visible(d.pivot))continue;d.pivot.updateMatrixWorld(true);box.setFromObject(d.pivot);const a=region('door',id,box);if(a)regions.push(a);
     for(const [i,h] of (d.pivot.userData.handles||[]).entries()){v.set(h[0],h[1],h[2]);d.pivot.localToWorld(v);const hb=new T.Box3(v.clone().addScalar(-7),v.clone().addScalar(7));const b2=region('handle',id+':'+i,hb);if(b2)regions.push(b2)}}
    const bySpot=new Map();for(const id of Object.keys(H.ROOMS))if(H.ROOMS[id].built&&H.ROOMS[id].group.visible)H.ROOMS[id].group.traverse(m=>{const s=m.userData?.spot;if(!m.isMesh||!s||!visible(m))return;m.geometry.boundingBox||m.geometry.computeBoundingBox();const b=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);bySpot.has(s)?bySpot.get(s).union(b):bySpot.set(s,b)});
    for(const [s,b] of bySpot){const a=region(/floor|bin|bowl|cushion|bag|rug|mat|shoe|box|toy|basket|beanbag/i.test(s)?'clutter':'usable',s,b);if(a)regions.push(a)}
    regions.sort((a,b)=>a.dist-b.dist);
    const pick=regions.slice(0,30),med=(k,a)=>{const s=a.map(r=>r[k]).filter(Number.isFinite).sort((p,q)=>p-q);return s.length?+s[Math.floor(s.length/2)].toFixed(1):null};
    const kinds={};for(const k of ['door','handle','usable','clutter']){const a=pick.filter(r=>r.kind===k);if(a.length)kinds[k]={n:a.length,contrast:med('contrast',a),mean:med('mean',a),ring:med('ring',a)}}
    return{rig:H._.lightingSnapshot(H.here)?.rim||null,room:H.here,raster:[W,Hh],adapt:H.Q.adapt,lighting:H.graphicsGet().lighting,calls:r.info.render.calls,triangles:r.info.render.triangles,global,local,kinds,regions:pick};
   });
   await p.screenshot({path:dir+name+'.png',timeout:90000});
   rows.push({name,eye,target,...row});
   const k=row.kinds,fmt=o=>o?`${o.contrast}/${o.ring}`:'-';
   console.log('NIGHT',tag,name,`rim=${JSON.stringify(row.rig)} adapt=${row.adapt}(${row.lighting}) calls=${row.calls} tris=${row.triangles} global=${row.global.contrast.toFixed(1)} mean=${row.global.mean.toFixed(1)} tile=${row.local.tileMedian.toFixed(1)} lower=${row.local.lowerMedian.toFixed(1)} door=${fmt(k.door)} handle=${fmt(k.handle)} usable=${fmt(k.usable)} clutter=${fmt(k.clutter)}`);
  }
  await writeFile(dir+'metrics.json',JSON.stringify({tag,phone,adapt,ref:ref||null,rows,errors:f.errors},null,1));
  assert.deepEqual(f.errors,[]);
  console.log('PASS night-separation',tag);
 }finally{await f.browser.close()}
});
