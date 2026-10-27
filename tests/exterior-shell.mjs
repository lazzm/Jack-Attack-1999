// Exterior shell regression: no sky or street may show where the family house's walls, gables or roof should be.
// node tests/exterior-shell.mjs http://localhost:PORT [--tier=low] [--profiles=desktop,phone] [--eye=140]
//
// From every reachable spot round the house (front lawn, drive both sides of the car, the pavement, the back garden,
// the road in both directions) it looks at the house left, centre and right, level and looking up. For each view it
// hides the neighbourhood and every room interior, paints the sky pure magenta, renders, and samples a screen grid:
// a sample whose camera ray enters the house's solid volume (walls ground to eaves, plus the roof prism) must not be
// magenta. Rays whose first hit is glass are skipped (the rooms behind windows are hidden on purpose).
// Writes tests/shots/exterior-shell/<profile>-<view>.png (the magenta pass, failing samples ringed) for failures,
// and a normal-render contact image per profile for review. Exit 0 = no holes.
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base=process.argv[2];if(!base)throw Error('usage: node tests/exterior-shell.mjs http://localhost:PORT');
const arg=(k,d)=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)||d;
const tier=arg('tier','low'),eyeH=+arg('eye','140'),profiles=arg('profiles','desktop,phone').split(',');
const dir=fileURLToPath(new URL('./shots/exterior-shell/',import.meta.url));await mkdir(dir,{recursive:true});
const GY=353,EY=GY-eyeH;
// [name, eye x, eye z, walkable room point (x,z) or null for the eye itself]
const SPOTS=[
 ['lawn-west-corner',-335,712],['lawn-west-gate',-335,1360],['lawn-middle',-120,1000],['hardstanding',120,712],
 ['front-path-gate',300,1360],['car-house-gap',470,712],['drive-east-corner',710,712],['drive-east-mid',710,1000],
 ['drive-gateway',700,1365],['car-front',460,1120],
 ['street-east',1150,1650,[700,1365]],['street-west',-700,1650,[-335,1360]],['opposite-pavement',60,1950,[300,1360]],
 ['garden-back-west',-290,-550],['garden-back-east',205,-550],['garden-middle',-50,-300],['garden-by-door',190,-70],['garden-by-house-west',-290,-70],
];
const AIM=[60,100,322]; // the middle of the house
const out={views:0,samples:0,checked:0,failures:[]};
for(const profile of profiles){
 const phone=profile==='phone',fx=await roomFixture(base,{tier,opening:true,width:phone?412:1366,height:phone?915:860,touch:phone,account:'Shell'+Date.now().toString(36)});
 const {page:p,errors}=fx;
 try{
  await p.evaluate(()=>{for(const id of ['drive','garden'])House.buildRoom(House.ROOMS[id]);House.dirty()});
  await p.waitForTimeout(600);
  for(const [name,x,z,room] of SPOTS){
   const yaw0=Math.atan2(AIM[0]-x,-(AIM[2]-z))*180/Math.PI;
   for(const [dyaw,pitch] of [[-40,0],[0,0],[40,0],[0,32]]){
    const level=z<0?'garden':'drive',rp=room||[x,z];
    await p.evaluate(({x,z,rp,EY,yaw,pitch})=>{House.hush();House.setWalkFrom({x:rp[0],y:EY,z:rp[1],lvl:'G',seat:0});Object.assign(House.P,{x,y:EY,z,rx:pitch,ry:yaw,seat:0,lvl:'G'});House._.setMode('focus');House.dirty()},{x,z,rp,EY,yaw:yaw0+dyaw,pitch});
    await p.waitForTimeout(150);
    const r=await p.evaluate(({GY,want})=>{
     const T=House.T,ren=House.ren,cam=House.camera,scene=House.scene;cam.updateMatrixWorld();
     const roof=House.root.children.find(o=>o.name==='family-house-roof');
     const keep=[House.ROOMS.drive.group,House.ROOMS.garden.group,roof].filter(Boolean);
     const saved=[];const hide=o=>{saved.push([o,o.visible]);o.visible=false};
     if(window.HouseEnvironment)hide(HouseEnvironment.group);
     for(const id in House.ROOMS)if(!['drive','garden'].includes(id))hide(House.ROOMS[id].group);
     for(const g of [House.ROOMS.drive.group,House.ROOMS.garden.group]){saved.push([g,g.visible]);g.visible=true}
     const bg=scene.background,fog=scene.fog;scene.background=new T.Color('#ff00ff');scene.fog=null;
     ren.render(scene,cam);
     const gl=ren.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
     scene.background=bg;scene.fog=fog;for(const [o,v] of saved.reverse())o.visible=v;House.dirty();
     // The house's solid volume (y down), shrunk by m cm so silhouette edges never count.
     const m=5,inside=(x,y,z)=>{
      if(x<-300+m||x>420-m||z<-57+m||z>703-m)return false;
      if(y<=GY-m&&y>=-204+m)return true; // the walls, ground to eaves
      return y<-196-m&&y>-363+170*Math.abs(x-60)/386+m; // the roof prism under both slopes
     };
     const ray=new T.Raycaster(),o=cam.getWorldPosition(new T.Vector3()),v=new T.Vector3(),cols=want[0],rows=want[1];
     let samples=0,checked=0;const bad=[];
     for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const nx=(i+.5)/cols*2-1,ny=(j+.5)/rows*2-1;samples++;
      v.set(nx,ny,.5).unproject(cam).sub(o).normalize();
      let enter=-1;for(let t=0;t<4000;t+=2){if(inside(o.x+v.x*t,-(o.y+v.y*t),o.z+v.z*t)){enter=t;break}} // (GL space is y-up; the house is y-down)
      if(enter<0)continue;
      ray.set(o,v);ray.far=enter+40;const hit=ray.intersectObjects(keep,true).find(q=>q.object.visible!==false&&!q.object.userData.spot&&q.object.material&&q.object.material.visible!==false);
      if(hit&&hit.object.material.transparent&&hit.object.material.opacity<.9)continue; // glass: the room behind is hidden on purpose
      checked++;
      const sx=Math.min(w-1,Math.floor((nx+1)/2*w)),sy=Math.min(h-1,Math.floor((ny+1)/2*h)),k=(sy*w+sx)*4;
      if(px[k]>180&&px[k+1]<90&&px[k+2]>180)bad.push({nx:+nx.toFixed(3),ny:+ny.toFixed(3),enter,at:[o.x+v.x*enter,-(o.y+v.y*enter),o.z+v.z*enter].map(n=>Math.round(n))});
     }
     let image=null;
     if(bad.length){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),im=g.createImageData(w,h);
      for(let y=0;y<h;y++)im.data.set(px.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);g.putImageData(im,0,0);g.strokeStyle='#00ff00';g.lineWidth=3;
      for(const b of bad){g.beginPath();g.arc((b.nx+1)/2*w,(1-b.ny)/2*h,8,0,7);g.stroke()}image=c.toDataURL('image/png')}
     return {samples,checked,bad:bad.slice(0,12),nBad:bad.length,image};
    },{GY,want:phone?[24,52]:[56,34]});
    const view=`${name}${dyaw?(dyaw<0?'-l':'-r'):''}${pitch?'-up':''}`;out.views++;out.samples+=r.samples;out.checked+=r.checked;
    if(r.nBad){out.failures.push({profile,view,count:r.nBad,examples:r.bad});await writeFile(dir+profile+'-'+view+'.png',Buffer.from(r.image.split(',')[1],'base64'));console.log('HOLE',profile,view,r.nBad,JSON.stringify(r.bad.slice(0,3)))}
   }
  }
  // One ordinary capture per profile, from where the owner noticed the hole (beside Dad's car, looking along the house).
  await p.evaluate(({EY})=>{House.setWalkFrom({x:470,y:EY,z:712,lvl:'G',seat:0});Object.assign(House.P,{x:470,y:EY,z:712,rx:10,ry:-7,seat:0,lvl:'G'});House._.setMode('focus');House.dirty()},{EY});
  await p.waitForTimeout(700);await p.screenshot({path:dir+profile+'-car-house-gap.png'});
  if(errors.length){out.failures.push({profile,errors});console.log('ERRORS',errors)}
 }finally{await fx.browser.close()}
}
console.log(`exterior-shell: ${out.views} views, ${out.checked}/${out.samples} samples on the shell, ${out.failures.length} failing view(s)`);
await writeFile(dir+'report.json',JSON.stringify(out,null,1));
process.exit(out.failures.length?1:0);
