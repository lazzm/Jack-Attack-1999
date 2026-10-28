// Real GPU equivalence plus room/time/device lighting review. Disposable localhost only.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2],account='Gi'+Date.now().toString(36),password='Throwaway-1999';
assert((await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})})).ok);
const f=await roomFixture(base,{account,password,signup:false,timeoutScale:4,debug:true}),{page:p,errors}=f;
p.setDefaultTimeout(180000);const dir=new URL('shots/gfx-lighting/',import.meta.url).pathname;await mkdir(dir,{recursive:true});
try{
 const result=await p.evaluate(()=>{
  const T=THREE,S=HouseStatic,r=House.ren,scene=new T.Scene(),g=new T.Group(),cam=new T.OrthographicCamera(-45,45,35,-35,.1,300);cam.position.set(40,40,100);cam.lookAt(0,0,0);scene.add(g,new T.HemisphereLight(0xffffff,0x555555,.8));const lamp=new T.DirectionalLight(0xffffff,.7);lamp.position.set(10,40,60);scene.add(lamp);
  for(let i=0;i<4;i++){const m=new T.Mesh(new T.BoxGeometry(14,20,10),new T.MeshPhongMaterial({color:[0xa36f46,0x4488aa,0x74a452,0xd5b371][i],shininess:22}));m.position.x=(i-1.5)*18;m.rotation.y=i*.23;if(i===2)m.scale.x=-1;g.add(m);}
  const target=new T.WebGLRenderTarget(160,120),prior=r.getRenderTarget(),a=new Uint8Array(160*120*4),b=new Uint8Array(a.length);r.setRenderTarget(target);r.render(scene,cam);r.readRenderTargetPixels(target,0,0,160,120,a);const batches=S.merge(g);r.render(scene,cam);r.readRenderTargetPixels(target,0,0,160,120,b);let changed=0,max=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d>2)changed++;max=Math.max(max,d);}S.unmerge(g);g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});r.setRenderTarget(prior);target.dispose();House.dirty();return{batches,changed,max,channels:a.length};
 });assert(result.batches>0);assert(result.changed/result.channels<.001,JSON.stringify(result));console.log('BATCH IMAGE',JSON.stringify(result));
 await p.evaluate(()=>{House.hush();House.ambient.clear();House.anims.clear();House.adapt(0,{pin:true,force:true})});
 const portals=await p.evaluate(()=>{
  const H=House,T=THREE,r=H.ren,target=new T.WebGLRenderTarget(192,120),prior=r.getRenderTarget(),a=new Uint8Array(192*120*4),b=new Uint8Array(a.length),rows=[],bad=[],frustums=[];
  const png=bytes=>{const c=document.createElement('canvas');c.width=192;c.height=120;const data=new Uint8ClampedArray(bytes.length);for(let y=0;y<120;y++)data.set(bytes.subarray((119-y)*192*4,(120-y)*192*4),y*192*4);c.getContext('2d').putImageData(new ImageData(data,192,120),0,0);return c.toDataURL().split(',')[1];};
  try{
   for(const d of Object.values(H.DOORS))if(!d.always)H.setDoor(d.id,true,true);
   H.scene.traverse(o=>{if(o.isMesh&&o.layers.mask!==HouseStatic.HIDDEN_MASK)frustums.push([o,o.frustumCulled]);});
   for(const d of Object.values(H.DOORS)){
    if(d.always||!d.portal)continue;const box=d.portal,c=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),nx=size.x<size.z?1:0,nz=nx?0:1,lvl=H.ROOMS[d.rooms[0]].lvl;
    for(const open of [true,false])for(const side of [-1,1])for(const yaw of [-40,0,40]){
     H.setDoor(d.id,open,true);const pose={x:c.x+nx*side*70,y:(Number.isFinite(d.floorY)?d.floorY:-box.min.y-15)-143,z:c.z+nz*side*70,rx:0,ry:Math.atan2(-nx*side,nz*side)*180/Math.PI+yaw,lvl,seat:0};H.setWalkFrom(pose);Object.assign(H.P,pose);H._.setMode('focus');r.setRenderTarget(target);
     H._.renderForBenchmark();r.readRenderTargetPixels(target,0,0,192,120,a);const drawn=Object.values(H.ROOMS).filter(r=>r._renderDrawn).map(r=>r.id);
     for(const [o]of frustums)o.frustumCulled=false;H._.renderForBenchmark();r.readRenderTargetPixels(target,0,0,192,120,b);for(const [o,on]of frustums)o.frustumCulled=on;
     let changed=0,total=0;for(let i=0;i<a.length;i++){if(i%4===3)continue;total+=a[i];if(Math.abs(a[i]-b[i])>3)changed++;}
     const row={door:d.id,open,side,yaw,room:H.here,drawn,reference:Object.values(H.ROOMS).filter(r=>r._renderDrawn).map(r=>r.id),changed:changed/(192*120*3),mean:total/(192*120*3)};rows.push(row);if(row.changed>.002&&bad.length<4)bad.push({row,normal:png(a),reference:png(b)});
    }H.setDoor(d.id,true,true);
   }
  }finally{for(const [o,on]of frustums)o.frustumCulled=on;r.setRenderTarget(prior);target.dispose();H.dirty();}
  return {rows,bad};
 });
 for(const {row,normal,reference}of portals.bad){const name=`portal-${row.door}-${row.open}-${row.side}-${row.yaw}`;await writeFile(dir+name+'-normal.png',Buffer.from(normal,'base64'));await writeFile(dir+name+'-reference.png',Buffer.from(reference,'base64'));}console.log('PORTAL DIFFERENCES',JSON.stringify(portals.rows.filter(r=>r.changed>=.002)));
 const rows=portals.rows;assert(rows.length>=24,'Doorway coverage missing');for(const row of rows){assert(row.mean>8,'Empty doorway view: '+JSON.stringify(row));assert(row.changed<.002,'Frustum culling changed visible pixels: '+JSON.stringify(row));}console.log('FRUSTUM IMAGE PASS',rows.length,'open/shut views, both sides and three angles; worst changed ratio',Math.max(...rows.map(r=>r.changed)));
 const rooms=await p.evaluate(()=>Object.keys(House.ROOMS));let count=0;
 async function station(id){await p.evaluate(id=>{House.goRoom(id,0);const t=House._.glide?.to;House.cancelGlide(true);if(t){const pose=typeof t==='function'?t():t;Object.assign(House.P,pose);House.setWalkFrom(pose)}House._.setMode('focus');House.relight();House._.renderForBenchmark()},id);await p.waitForTimeout(450);await p.evaluate(()=>House._.renderForBenchmark());}
 for(const hour of [9,13,19,23]){await p.evaluate(hour=>{window.auditHour=hour;dispatchEvent(new Event('ownerclock'));HouseEnvironment.update(0);House.relight()},hour);for(const id of rooms){await station(id);await p.screenshot({path:dir+`${id}-${hour}.png`});count++;}}
 for(const [w,h]of [[1920,1080],[390,844],[844,390],[768,1024],[1024,768]]){await p.setViewportSize({width:w,height:h});for(const id of ['bedroom','kitchen','hall','drive']){await station(id);await p.screenshot({path:dir+`${id}-${w}x${h}-night.png`});count++;}}
 // A readable poster view at daylight and night, with its full A2 title visible.
 await p.setViewportSize({width:1366,height:860});for(const hour of [13,23]){await p.evaluate(h=>{window.auditHour=h;dispatchEvent(new Event('ownerclock'));House.relight()},hour);await f.view([-80,-70,65],[-52,-82,-56]);await p.screenshot({path:dir+`poster-${hour}.png`});}
 assert.deepEqual(errors,[]);console.log('GFX INTEGRITY PASS:',count+2,'room/device/time captures, merged geometry image equivalence, zero errors');
}finally{await f.browser.close()}
