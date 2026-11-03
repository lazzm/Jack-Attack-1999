// Fast, deterministic native renderer review. The full room/input regression is grav.mjs.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const base=process.argv[2],before=process.argv.includes('--before'),tag=before?'before':'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const dir=new URL('../shots/games/grav/'+tag+'/render/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const p=await browser.newPage({viewport:{width:1366,height:860}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
try{
 await p.route('**/__grav-render',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Jack Attack 1999</title><link rel="icon" href="data:,"><body style="margin:0;background:#101018">'}));
 if(before){const src=execFileSync('git',['show','HEAD:app/public/js/rm-g-grav.js'],{encoding:'utf8'});await p.route('**/js/rm-g-grav.js',r=>r.fulfill({body:src,contentType:'application/javascript'}));}
 await p.goto(base+'/__grav-render');
 await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House;window.Apps={load:()=>Promise.resolve()};let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});
 for(const src of ['vendor/three.min.js','js/cast.js','js/rm-tv.js','js/rm-3d.js','js/rm-g-racekit.js','js/rm-g-grav.js'])await p.addScriptTag({url:base+'/'+src});
 await p.evaluate(()=>{
  const cv=document.createElement('canvas'),ov=document.createElement('canvas');for(const c of [cv,ov]){c.width=320;c.height=240;c.style.cssText='position:fixed;width:min(100vw,100vh * 4 / 3);height:auto;left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated';document.body.append(c)}
  const held={},pressed={};let saved=null;const K={W:320,H:240,cv,hud:ov.getContext('2d',{willReadFrequently:true}),frame:0,t:0,best:0,font:RoomTV.font,restoring:false,label:b=>b.toUpperCase(),keyLabel:b=>({a:'Z',b:'X',x:'C',l:'U',r:'E',start:'ENTER'}[b]||b.toUpperCase()),load:()=>saved,save:s=>{saved=structuredClone(s);return true},music(){},sfx:{tone(){},noise(){},seq(){}},secret(){},over(){},resume(){},held:b=>!!held[b],pressed:b=>!!pressed[b],any:()=>Object.values(pressed).some(Boolean),stick:()=>({x:+!!held.right-+!!held.left,y:+!!held.down-+!!held.up}),three(o){return this._three||(this._three=RoomTV.make3d(this,{...o,look:'ps1'}))}};
  let game=RoomTV.defs['ps.grav'].make(K);window.review={K,held,pressed,step(n){for(let i=0;i<n;i++){game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}game.draw()},key(k){pressed[k]=true;this.step(1)},restart(){game.end();game=RoomTV.defs['ps.grav'].make(K)}};
 });
 const D=(fn,arg)=>p.evaluate(fn,arg),frames=n=>D(n=>review.step(n),n);
 async function shot(name){await D(()=>review.step(0));await p.screenshot({path:dir+name+'.png'});const data=await D(()=>{review.step(0);const K=review.K,c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(K.cv,0,0);g.drawImage(K.hud.canvas,0,0);return c.toDataURL().split(',')[1]});await writeFile(dir+name+'-native.png',Buffer.from(data,'base64'));}
 await frames(180);await shot('title');
 await D(()=>{__gravDbg.race('race',0,0);__gravDbg.go()});await frames(280);await shot('start');
 await D(()=>review.held.a=true);await frames(150);await shot('moving');
 const info=await D(()=>{const T=review.K._three,out=[];T.scene.updateMatrixWorld(true);for(const [x,y]of [[.1,-.6],[.3,-.4],[-.4,-.6],[0,-.9]]){const r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2(x,y),T.cam);const hit=r.intersectObjects(T.scene.children,true).filter(h=>h.object.isMesh)[0];if(hit){const o=hit.object;out.push({x,y,type:o.geometry.type,parent:o.parent.type,dist:hit.distance,tex:!!o.material.map,point:hit.point.toArray(),vertices:o.geometry.attributes.position.count,index:o.parent.children.indexOf(o)})}}return out});console.log('BLOCKER RAYS',JSON.stringify(info));
 const particleReview=await D(()=>{const T=review.K._three,g=document.createElement('canvas').getContext('2d',{willReadFrequently:true});g.canvas.width=320;g.canvas.height=240;const sample=()=>{T.render();g.drawImage(review.K.cv,0,0);return g.getImageData(0,0,320,240).data};const a=sample(),points=[];T.scene.traverse(o=>{if(o.isPoints){points.push([o,o.visible]);o.visible=false}});const b=sample();let changed=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>55)changed++;return{fraction:changed/(320*240),caps:points.map(([o])=>o.material.uniforms?.uMaxSize?.value).filter(Boolean)}});console.log('EXHAUST COVERAGE',JSON.stringify(particleReview));if(!before){assert(particleReview.caps.every(n=>n<=14),'Near-camera particles have a finite screen-space cap');assert(particleReview.fraction<.035,'Exhaust must not obscure the road');}await shot('moving-no-particles');
 await D(()=>review.K._three.scene.traverse(o=>{if(o.isPoints)o.visible=true}));
 const perf=await D(async()=>{const T=review.K._three,gl=T.ren.getContext(),draw=[];for(let i=0;i<5;i++){T.render();gl.finish()}for(let i=0;i<30;i++){const t=performance.now();T.render();gl.finish();draw.push(performance.now()-t)}draw.sort((a,b)=>a-b);const raf=[];let last;await new Promise(resolve=>{function f(t){if(last)raf.push(t-last);last=t;review.step(1);if(raf.length===90)resolve();else requestAnimationFrame(f)}requestAnimationFrame(f)});raf.sort((a,b)=>a-b);return{native:[320,240],renderer:(()=>{const e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})(),gpuFrameP50:draw[15],gpuFrameP95:draw[28],rafP50:raf[45],rafP95:raf[85],calls:T.ren.info.render.calls,triangles:T.ren.info.render.triangles}});console.log('NATIVE PERFORMANCE',JSON.stringify(perf));await writeFile(dir+'performance.json',JSON.stringify(perf,null,2));
 if(!before){
  for(let t=0;t<8;t++){await D(t=>__gravDbg.view(t,.6,.3,10),t);await frames(1);await shot('ship-'+t);await D(t=>__gravDbg.view(t,3.5,.2,10),t);await frames(1);await shot('ship-'+t+'-rear');}
  for(let t=0;t<12;t++){await D(t=>{__gravDbg.race('race',t,t%4);__gravDbg.go();window.__rmAuto=true},t);await frames(360);await shot('track-'+t);}
  await D(()=>{__gravDbg.race('champ',0,0);__gravDbg.go();__gravDbg.lastRace();__gravDbg.st.champ.pts['1:mate3']=1000;__gravDbg.at(.99,0,70);__gravDbg.skipLaps(2)});await frames(600);assert.equal(await D(()=>__gravDbg.st.mode),'results');await D(()=>review.key('a'));await frames(70);await D(()=>review.key('a'));await frames(250);await D(()=>review.key('a'));assert.equal(await D(()=>__gravDbg.st.mode),'ending');assert(await D(()=>__gravDbg.st.sv.live.champ.place>0));await shot('runner-up-ending');
 }
 assert.deepEqual(errors,[]);console.log('GRAV RENDER '+tag+' PASS');
}finally{await browser.close()}
