// Production cartridge renderers at deterministic frames; no synthetic scene replacements.
// node tests/games/qa-render.mjs http://localhost:18086 [--before]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.argv[2],before=process.argv.includes('--before'),tag=before?'before':'after';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const shots=new URL('../shots/games-1102/',import.meta.url).pathname;await mkdir(shots,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
const watchdog=setTimeout(()=>void browser.close().finally(()=>process.exit(1)),360000);
const errors=[];
try{
 for(const gid of ['ps.grav','n64.range','ps.fight']){
  const p=await browser.newPage({viewport:{width:1366,height:860}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type())&&!/GPU stall|ReadPixels/.test(m.text()))errors.push(m.text())});
  await p.route('**/__qa-render',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cartridge review</title><link rel="icon" href="data:,"><body style="margin:0;background:#101018">'}));
  await p.goto(base+'/__qa-render');
  await p.evaluate(()=>{window.Room={_:{esc:s=>s},House:{paused:true}};window.House=Room.House;window.Apps={load:()=>Promise.resolve()};let seed=1999;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});
  for(const src of ['vendor/three.min.js','js/cast.js','js/rm-tv.js','js/rm-3d.js','js/rm-g-racekit.js','js/rm-g-fightkit.js','js/rm-g-'+gid.split('.')[1]+'.js'])await p.addScriptTag({url:base+'/'+src});
  await p.evaluate(gid=>{
   const cv=document.createElement('canvas'),ov=document.createElement('canvas');
   for(const c of [cv,ov]){c.width=320;c.height=240;c.style.cssText='position:fixed;width:min(100vw,100vh * 4 / 3);height:auto;left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated';document.body.append(c)}
   const held={},pressed={},text=[];let saved=null;
   const font={...RoomTV.font,draw(g,s,x,y,col,k,shadow){text.push({s:String(s),x,y,k:k||1});return RoomTV.font.draw(g,s,x,y,col,k,shadow)}};
   const K={W:320,H:240,cv,hud:ov.getContext('2d'),frame:0,t:0,best:0,font,restoring:false,
    label:b=>b.toUpperCase(),keyLabel:b=>b.toUpperCase(),load:()=>saved,save:s=>{saved=structuredClone(s);return true},clear(){saved=null},music(){},sfx:{tone(){},noise(){},seq(){}},secret(){},over(){},resume(){this.restoring=false},
    held:b=>!!held[b],pressed:b=>!!pressed[b],any:()=>Object.values(pressed).some(Boolean),stick:()=>({x:+!!held.right-+!!held.left,y:+!!held.down-+!!held.up}),
    three(o){return this._three||(this._three=RoomTV.make3d(this,{...o,look:gid.startsWith('ps.')?'ps1':'n64'}))}};
   const game=RoomTV.defs[gid].make(K);
   window.review={K,game,text,held,step(n){for(let i=0;i<n;i++){game.update(1/60);K.frame++;K.t+=1/60;for(const k in pressed)delete pressed[k]}text.length=0;game.draw()}};
  },gid);
  const frames=n=>p.evaluate(n=>review.step(n),n);
  const capture=async(name,step=true)=>{
   const r=await p.evaluate(step=>{if(step)review.step(1);else review.game.draw();const K=review.K,c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');g.drawImage(K.cv,0,0);g.drawImage(K.hud.canvas,0,0);const d=g.getImageData(0,0,320,240).data;let green=0;for(let i=0;i<d.length;i+=4)if(d[i+1]>100&&d[i+1]>d[i]*1.7&&d[i+1]>d[i+2]*1.4)green++;return{uri:c.toDataURL().split(',')[1],green:green/(320*240),text:review.text}},step);
   await writeFile(shots+tag+'-'+name+'-native.png',Buffer.from(r.uri,'base64'));await p.screenshot({path:shots+tag+'-'+name+'.png'});return r;
  };
  if(gid==='ps.grav'){
   await frames(1);await p.evaluate(()=>{__gravDbg.race('race',0,0);__gravDbg.go()});await frames(280);
   const r=await capture('grav-start');console.log(tag,'Anti-Grav green fraction',r.green);
   if(!before)assert(r.green<.025,'Repair lane must not fill the frame with neon green');
   await p.evaluate(()=>review.held.a=true);await frames(150);await capture('grav-moving');
  }else if(gid==='n64.range'){
   await p.evaluate(()=>__rangeDbg.start(0,0));await frames(190);await capture('range-start');
   const roof=await p.evaluate(()=>{const d=__rangeDbg,r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2(0,.8),d.camera);const hit=r.intersectObjects(d.SC.root.children,true)[0];return hit?{point:hit.point.toArray(),distance:hit.distance}:null});console.log(tag,'upper view obstruction',roof);
   if(!before)assert(!roof||roof.distance>30,'Booth roof must stay above the default view');
   await p.evaluate(()=>__rangeDbg.G.pitch=.32);await frames(1);await capture('range-look-up');
   const upRoof=await p.evaluate(()=>{const d=__rangeDbg,r=new THREE.Raycaster();r.setFromCamera(new THREE.Vector2(0,.8),d.camera);const hit=r.intersectObjects(d.SC.root.children,true)[0];return hit?{point:hit.point.toArray(),distance:hit.distance}:null});console.log(tag,'upper aim obstruction',upRoof);
   if(!before)assert(!upRoof||upRoof.distance>30,'Canopy must stay above the upper aiming limit');
   if(!before){
    await p.evaluate(()=>__rangeDbg.view('soldier',0,3,1.2));
    for(const [name,eye]of [['front',[7,4.8,6]],['back',[-7,4.8,-6]]]){
     await p.evaluate(eye=>{__rangeDbg.camera.position.set(...eye);__rangeDbg.camera.lookAt(0,2,.05)},eye);await capture('range-booth-'+name,false);
    }
   }
  }else{
   await frames(60);const r=await capture('fight-boot'),head=r.text.find(t=>t.s==='MEMORY CARD CHECK'),sub=r.text.find(t=>t.s==='MEMORY CARD (SLOT 1)');
   assert(head&&sub);console.log(tag,'memory check',head,sub);
   if(!before){assert(head.y+8*head.k+3<=sub.y);assert(head.x>=8);assert(head.x+head.s.length*6*head.k<=312)}
  }
  await p.close();
 }
 assert.deepEqual(errors,[]);console.log('QA RENDER '+tag.toUpperCase()+' PASS');
}finally{clearTimeout(watchdog);await browser.close()}
