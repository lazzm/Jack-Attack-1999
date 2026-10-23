/* Shared, non-walkable neighbourhood and translation-free skybox. Original art only. */
(function(){
 'use strict';
 const H=window.House,K=window.HouseKit,A=window.HouseArt;
 if(!H||!H.ok||!K||!A||window.HouseEnvironment)return;
 const T=H.T,GY=353,group=new T.Group();group.name='neighbourhood';H.root.add(group);
 // Keep distant rows independently frustum-cullable, without per-house meshes
 // or any visibility work in the animation loop. All palettes are shared.
 const materials=[];
 const paint=(c)=>{const m=new T.MeshBasicMaterial({color:c});materials.push({m,c:new T.Color(c)});return m};
 // All texture work happens once. Brick courses and roof tiles use real centimetre
 // UV scales, rather than stretching a few giant bricks across every facade.
 const brick=K.tex('env.brick',256,128,(g,w,h)=>{
  g.fillStyle='#b4a491';g.fillRect(0,0,w,h);const r=K.rnd(812);
  for(let y=0;y<8;y++)for(let x=-1;x<5;x++){
   g.fillStyle=['#a87559','#ae7b60','#a16f55','#b17f62'][(r()*4)|0];
   g.fillRect(x*64+(y%2)*32+1,y*16+1,62,14);
  }
 },{clamp:false});
 const tiles=K.tex('env.tiles',256,128,(g,w,h)=>{
  g.fillStyle='#aaa49c';g.fillRect(0,0,w,h);const r=K.rnd(912);
  for(let y=0;y<8;y++)for(let x=-1;x<9;x++){
   g.fillStyle=['#e5dfd5','#ddd7cf','#d5cec4'][(r()*3)|0];
   g.fillRect(x*32+(y%2)*16,y*16,31,14);
  }
 },{clamp:false});
 const masonry=paint('#ffffff');masonry.map=brick;
 const paleBrick=paint('#d5c9b5');paleBrick.map=brick;
 const render=paint('#d6ceba'),occupied=paint('#718b96'),lampGlass=paint('#d6cdb2');
 const roof=paint('#68544a'),slate=paint('#4d575b'),trim=paint('#ddd8c9'),glass=paint('#718b96'),glassShade=paint('#3e5763'),door=paint('#334747'),road=paint('#4c4d4e'),grass=paint('#547044'),hedge=paint('#405f38'),leaf=paint('#657645'),paving=paint('#aaa79d'),earth=paint('#655543'),metal=paint('#383e3d');
 roof.map=slate.map=tiles;
 const fence=paint('#9b876c');
 fence.map=K.tex('env.fence',128,128,(g,w,h)=>{
  g.fillStyle='#dbd1bc';g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=16){g.fillStyle=x%32?'#aaa08b':'#c2b6a0';g.fillRect(x,0,1,h);g.fillRect(x+6,9,1,88)}
 });
 road.map=K.tex('env.tarmac',128,128,(g,w,h)=>{
  g.fillStyle='#dedede';g.fillRect(0,0,w,h);const r=K.rnd(68);
  for(let i=0;i<2400;i++){g.fillStyle=i%2?'#c4c4c4':'#eeeeee';g.fillRect(r()*w,r()*h,1,1)}
 });
 function zone(name,build){const batch=K.batch(),b=K.into(batch),g=new T.Group();g.name=name;build(b);batch.build(g);group.add(g)}
 const houseDepth=[480,510,470,490];
 const plots={
  opposite:Array.from({length:7},(_,i)=>[-2040+i*680,2360,180,i,540]),
  rear:Array.from({length:6},(_,i)=>[-1700+i*680,-1850,0,i+7,540]),
  side:[[-1700,13],[-1020,14],[1060,15],[1740,16]].map(([x,n])=>[x,550,0,n,530])
 };
 // The playable drive owns x=-600..1200, z=1100..1700. Scenery abuts
 // those exact edges. Slabs and kerbs share edges, never coplanar top faces.
 zone('street',b=>{
  // Global foundation stays below every playable road/turf surface.
  // Distant plots own their bounded lawn bases, so their models still meet grade.
  b.box(0,GY+11,400,11000,10,11000,grass);
  // Keep every lawn in the existing ground batch, rather than adding one
  // material batch to each house row. Plot bases reach the global foundation.
  for(const [x,z,ry,n,front]of [...plots.opposite,...plots.rear,...plots.side]){
   const rear=-houseDepth[n%4]/2-326,end=front+20;
   b.at(x,GY+1,z,ry).box(0,2.5,(rear+end)/2,668,5,end-rear,grass);
  }
  const slab=(x0,x1,z0,z1,m,top,h)=>{
   const depth=Math.max(h,6-top);
   b.box((x0+x1)/2,GY+top+depth/2,(z0+z1)/2,x1-x0,depth,z1-z0,m,{uv:100});
  };
  function pavement(x0,x1,z0,z1,kerb){
   slab(x0,x1,z0,z1,paving,-.2,3);
   // Actual shallow grooves separate slab rows, wholly above the pavement.
   for(let x=Math.ceil(x0/60)*60;x<x1;x+=60)b.box(x,GY-.35,(z0+z1)/2,.55,.3,z1-z0-4,earth);
   b.box((x0+x1)/2,GY-.35,(z0+z1)/2,x1-x0,.3,.55,earth);
   slab(x0,x1,kerb-5,kerb+5,paving,-12,12);
  }
  for(const [x0,x1] of [[-3250,-600],[1200,3250]]){
   slab(x0,x1,1205,1695,road,0,3);pavement(x0,x1,1100,1195,1200);
   for(let x=Math.ceil((x0+35)/180)*180;x<x1-35;x+=180)b.box(x,GY-.3,1440,70,.3,3,trim);
  }
  // Opposite footpath's kerb occupies 1695..1705; road ends at 1695.
  pavement(-3250,3250,1705,1800,1700);
  slab(-3250,3250,-1185,-695,road,0,3);
  pavement(-3250,3250,-1290,-1195,-1190);pavement(-3250,3250,-685,-590,-690);
  for(let x=-3150;x<3250;x+=180)b.box(x,GY-.3,-940,70,.3,3,trim);
  for(const x of [-2480,-1120,1600,2960]){
   b.box(x,GY-.5,1682,32,1,18,metal);
   for(let i=-2;i<=2;i++)b.box(x+i*5,GY-1.1,1682,2,.4,14,paving);
   const l=b.at(x,GY,1762);l.cyl(0,-230,0,4,7,460,8,metal);
   l.box(0,-458,-26,8,8,56,metal);l.box(0,-461,-52,20,12,42,metal);l.box(0,-454,-52,16,2,34,lampGlass);
  }
 });
 // Watertight pitched roof shell: both slopes, underside, fascia thickness and
 // both end caps. Rotate the complete assembly to change ridge direction.
 function pitched(B,w,d,eave,rise,tile,wall,across){
  const b=across?B.at(0,0,0,90):B,span=across?d:w,length=across?w:d;
  const half=span/2+18,peak=-eave-rise;
  const shell=new T.Shape();shell.moveTo(-half,-eave);shell.lineTo(0,peak);shell.lineTo(half,-eave);
  shell.lineTo(half,-eave+12);shell.lineTo(0,peak+12);shell.lineTo(-half,-eave+12);shell.closePath();
  const rg=new T.ExtrudeGeometry(shell,{depth:length+36,bevelEnabled:false});
  b.geo(rg,0,0,-length/2-18,tile,{uv:180});rg.dispose();
  const gable=new T.Shape();gable.moveTo(-span/2,-eave);gable.lineTo(0,peak+12);gable.lineTo(span/2,-eave);gable.closePath();
  const gg=new T.ExtrudeGeometry(gable,{depth:length,bevelEnabled:false});
  b.geo(gg,0,0,-length/2,wall,{uv:100});gg.dispose();
  const slope=Math.atan2(rise,half)*180/Math.PI,len=Math.hypot(half,rise);
  for(const side of [-1,1]){
   b.box(side*half,-eave+8,0,8,16,length+38,trim);
   b.cyl(side*(half+5),-eave+3,0,4,4,length+42,7,metal,{rx:90});
   for(const zz of [-length/2-20,length/2+20])b.box(side*half/2,-eave-rise/2+5,zz,len,7,8,trim,{rz:side*slope});
  }
  b.cyl(0,peak,0,7,7,length+40,8,tile,{rx:90});
 }
 const homes=[];
 function windowBay(b,x,y,z,ry,w,h,n){
  const f=b.at(x,y,z,ry),lit=n%4===1;
  f.box(0,0,1,w,h,2,metal);
  f.box(0,-h*.23,2.7,w-10,h*.46-5,1.4,lit?occupied:glass);
  f.box(0,h*.23,2.7,w-10,h*.46-5,1.4,lit?occupied:glassShade);
  for(const side of [-1,1]){
   f.box(side*(w/2-2.5),0,5,5,h,6,trim);
   f.box(0,side*(h/2-2.5),5,w-10,5,6,trim);
   f.box(side*(w/2-12),0,3.9,12,h-10,1,n%3?trim:leaf);
  }
  f.box(0,0,5,4,h-10,6,trim);f.box(0,-h*.12,5,w-10,4,6,trim);
  f.box(0,h/2+3,5,w+12,6,18,paving);
  f.box(0,-h/2-6,1,w+14,7,10,paving);
 }
 function tree(b,x,z,h,n){
  b.cyl(x,-h*.33,z,7,13,h*.66,7,earth);
  for(const side of [-1,1])b.cyl(x+side*22,-h*.61,z,4,7,h*.26,6,earth,{rz:side*28});
  // Unequal overlapping crowns read as one branching tree, not a stack of balls.
  b.ball(x,-h*.79,z,100,h*.28,94,n%2?leaf:hedge,7);
  b.ball(x-64,-h*.67,z+24,83,h*.22,78,hedge,7);
  b.ball(x+62,-h*.71,z-20,83,h*.24,82,leaf,7);
 }
 // Frontage depth is explicit so every path reaches its own footpath. House
 // footprints and gardens are laid out in centimetres; no arbitrary scaling.
 function home(B,x,z,ry,n,front){
  const type=n%4,w=[540,530,500,560][type],d=houseDepth[type];
  const eave=[492,480,485,490][type],rise=[156,165,175,150][type],across=type!==2;
  const b=B.at(x,GY+1,z,ry),wall=type===1?paleBrick:masonry,tile=type===1||type===3?slate:roof;
  const face=d/2,doorX=type===2?0:w*.27,bayX=-w*.23,wallHalf=w/2;
  homes.push({x,z,ry,width:w,depth:d,eave,rise,type,front});
  b.box(0,-eave/2,0,w,eave,d,wall,{uv:100});
  // Rendered upper storey is a solid coat with a projecting brick sill course.
  if(type===1){b.box(0,-eave+112,0,w+2,224,d+2,render);b.box(0,-eave+227,0,w+7,6,d+7,paving)}
  pitched(b,w,d,eave,rise,tile,type===1?render:wall,across);
  b.box(0,-12,0,w+4,24,d+4,earth);
  // Masonry chimney rises out of the roof slope, including two capped pots.
  const cx=w*.3,cz=-d*.23,chimTop=-eave-rise-35;
  b.box(cx,chimTop+81,cz,40,162,44,wall,{uv:100});b.box(cx,chimTop,cz,48,8,52,paving);
  for(const xx of [cx-10,cx+10]){b.cyl(xx,chimTop-17,cz,6,8,26,8,earth);b.cyl(xx,chimTop-31,cz,8,8,4,8,metal)}
  for(const side of [-1,1]){
   const dx=side*(wallHalf-10),dz=-face-5;
   b.cyl(dx,-eave/2,dz,3,3,eave,7,metal);
   // A wider double casement on the upper floor and two rear sash windows.
   windowBay(b,side*w*.24,-eave+110,face+(type===1?1:0),0,type===3?112:98,104,n+(side===1?1:0));
   for(const yy of [-135,-eave+110])windowBay(b,side*w*.24,yy,-face,180,86,102,n+2);
   windowBay(b,side*wallHalf,-eave+110,-35,side*90,72,96,n+3);
  }
  if(type===0||type===3){
   // Deep rectangular bay with fully modelled returns, a stone base and roof.
   const bay=b.at(bayX,0,face),bw=type===3?178:154;
   bay.box(0,-97,25,bw,194,50,wall,{uv:100});bay.box(0,-10,25,bw+8,20,56,paving);
   windowBay(bay,0,-132,50,0,bw-22,110,n);
   for(const side of [-1,1])windowBay(bay,side*bw/2,-132,25,side*90,32,110,n+1);
   bay.box(0,-200,25,bw+18,12,70,tile);bay.box(0,-192,25,bw+12,4,64,trim);
  }else windowBay(b,bayX,-135,face,0,type===1?142:96,112,n);
  if(type===2)windowBay(b,w*.25,-135,face,0,86,112,n+1);
  const entry=b.at(doorX,0,face);
  entry.box(0,-101,3,82,202,6,trim);entry.box(0,-99,7,70,196,4,n%2?door:metal);
  entry.box(0,-153,10,48,64,2,glassShade);entry.box(0,-59,10,48,50,2,door);
  entry.box(0,-101,12,24,4,3,trim);entry.cyl(25,-91,12,2,2,3,7,trim,{rx:90});
  entry.box(0,-3,24,96,6,62,paving);
  // Small pitched porch, supported on its brick cheeks, on alternate houses.
  if(type===1||type===2){
   const porch=entry.at(0,0,28);porch.box(-49,-100,0,10,200,58,wall,{uv:100});porch.box(49,-100,0,10,200,58,wall,{uv:100});
   pitched(porch,112,86,208,42,tile,wall,false);
  }else{entry.box(0,-210,25,106,12,72,tile);entry.box(0,-202,25,98,4,66,trim)}
  // Tiled path stops at the inner gate line; no overlapping lawn slab under it.
  const pathStart=face+55,pathEnd=front,pathLength=pathEnd-pathStart;
  b.box(doorX,-1,(pathStart+pathEnd)/2,82,2,pathLength,paving);
  for(let zz=pathStart+40;zz<pathEnd;zz+=45)b.box(doorX,-2.15,zz,80,.3,.65,earth);
  const plot=330,gate0=doorX-48,gate1=doorX+48;
  for(const [lo,hi] of [[-plot+12,gate0-10],[gate1+10,plot-12]]){
   b.box((lo+hi)/2,-29,front,hi-lo,58,18,wall,{uv:100});b.box((lo+hi)/2,-60,front,hi-lo+4,4,24,paving);
  }
  for(const xx of [gate0-4,gate1+4]){b.box(xx,-39,front,16,78,24,wall,{uv:100});b.box(xx,-80,front,21,4,29,paving)}
  // Closed garden gate with individually solid bars; it does not imply access.
  b.box(doorX,-54,front,82,4,5,metal);b.box(doorX,-15,front,82,4,5,metal);
  for(let xx=doorX-36;xx<=doorX+36;xx+=12)b.box(xx,-35,front,2.5,50,3,metal);
  // The short threshold bridges the wall to the footpath; same height, disjoint.
  b.box(doorX,-1,front+10,82,2,20,paving);
  for(const side of [-1,1]){
   b.box(side*(plot-9),-36,(face+front)/2,18,72,front-face-12,hedge);
   b.box(side*(plot-9),-2,(face+front)/2,26,4,front-face-12,earth);
  }
  const bedX=-w*.24,bedZ=face+105;
  b.box(bedX,-2,bedZ,160,4,66,earth);
  for(let i=0;i<3;i++)b.ball(bedX-52+i*52,-22,bedZ,29,23+(i%2)*8,27,i%2?leaf:hedge,7);
  if(type===1||type===3){
   b.box(wallHalf-38,-33,face+55,34,62,38,door);b.box(wallHalf-38,-66,face+55,38,5,42,metal);
   for(const xx of [wallHalf-53,wallHalf-23])b.cyl(xx,-6,face+41,6,6,5,7,metal,{rz:90});
  }else{
   b.cyl(wallHalf-42,-12,face+83,19,14,24,8,earth);b.ball(wallHalf-42,-37,face+83,27,27,27,leaf,7);
  }
  // Fenced rear gardens complete the plots from upstairs and oblique views.
  // Panels have thickness and capped posts; no single-sided scenery cards.
  const rear=-face-320;
  b.box(0,-63,rear,648,126,8,fence,{uv:140});
  for(const side of [-1,1]){
   b.box(side*322,-63,(rear+face)/2,8,126,face-rear-8,fence,{uv:140});
   for(const zz of [rear,0,face-8]){
    b.box(side*322,-68,zz,12,136,12,fence);b.box(side*322,-138,zz,15,4,15,fence);
   }
  }
  if(n%3===0)tree(b,-240,-face-105,365+(n%2)*60,n);
 }
 // All front boundary walls sit 20cm inside the footpath edge. The varied roof
 // directions and restrained palette make one estate, rather than clone rows.
 zone('opposite houses',b=>{for(const p of plots.opposite)home(b,...p)});
 zone('rear houses',b=>{for(const p of plots.rear)home(b,...p)});
 zone('side houses',b=>{
  // These are the neighbours on Jack's street, with fronts towards the SAME
  // road. Their backs and hedges stay outside both playable rectangles.
  for(const p of plots.side)home(b,...p);
  const planted=b.at(0,GY+6,0);
  for(const side of [-1,1])for(let i=0;i<4;i++)tree(planted,side*(2790+(i%2)*260),[-2110,-420,560,2320][i],460+(i%3)*55,i);
 });
 const light=new T.Vector3(-.4,-.8,.4).normalize(),normal=new T.Vector3();
 group.traverse(o=>{o.userData.noPick=true;if(!o.geometry)return;const n=o.geometry.attributes.normal,colours=new Float32Array(n.count*3);for(let i=0;i<n.count;i++){const shade=.69+.29*Math.max(0,normal.fromBufferAttribute(n,i).dot(light));colours.fill(shade,i*3,i*3+3)}o.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));o.material.vertexColors=true;});

 const faces=Array.from({length:6},()=>{const c=document.createElement('canvas');c.width=c.height=256;return c});
 const sky=new T.CubeTexture(faces);sky.minFilter=T.LinearFilter;sky.magFilter=T.LinearFilter;sky.generateMipmaps=false;H.scene.background=sky;
 const direction=(face,u,v)=>{const a=2*u-1,b=1-2*v;return new T.Vector3(...[[1,b,-a],[-1,b,a],[a,1,-b],[a,-1,b],[a,b,1],[-a,b,-1]][face]).normalize()};
 const sun=new T.Vector3(-.45,.58,.7).normalize(),moon=new T.Vector3(.6,.5,-.6).normalize();
 let last='',lastMinute=-1;
 function phase(){const cl=document.getElementById('bootPower')?.classList;for(const p of ['night','dusk','dawn','day'])if(cl?.contains('rm-'+p))return p;const h=new Date().getHours();return h<6||h>=20?'night':h<8?'dawn':h>=18?'dusk':'day'}
 function update(){
  const ph=phase(),minute=new Date().getMinutes();if(ph===last&&minute===lastMinute)return;lastMinute=minute;if(ph===last)return;last=ph;
  const colours={day:['#477db1','#cedadf'],dusk:['#363a64','#d89774'],dawn:['#54577d','#ddb69a'],night:['#080f23','#26344b']}[ph],zenith=new T.Color(colours[0]),horizon=new T.Color(colours[1]),night=ph==='night';
  faces.forEach((c,face)=>{const g=c.getContext('2d'),im=g.createImageData(256,256),d=im.data;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const v=direction(face,(x+.5)/256,(y+.5)/256),h=Math.max(0,v.y),col=horizon.clone().lerp(zenith,Math.pow(h,.6));
    if(!night){const cloud=Math.sin(v.x*18+v.z*9)+Math.sin(v.z*24-v.x*11)+Math.sin(v.x*32+v.z*27);const alpha=Math.max(0,Math.min(.54,(cloud-1.2)*.35))*Math.max(0,Math.min(1,(h-.06)*6))*Math.max(0,1-h);col.lerp(new T.Color('#f1e9db'),alpha);const glow=Math.pow(Math.max(0,v.dot(sun)),250);col.lerp(new T.Color('#fff0c7'),glow)}
    else{const dot=v.dot(moon);if(dot>.9993)col.set('#e5e0cc');const seed=Math.sin(Math.floor(v.x*700)*127.1+Math.floor(v.y*700)*311.7+Math.floor(v.z*700)*74.7)*43758.5453;if(h>.08&&seed-Math.floor(seed)>.9993)col.lerp(new T.Color('#d5dded'),.6)}
    const i=(y*256+x)*4;d[i]=col.r*255;d[i+1]=col.g*255;d[i+2]=col.b*255;d[i+3]=255;
   }g.putImageData(im,0,0);
  });sky.needsUpdate=true;
  const tint=new T.Color(night?'#566378':ph==='day'?'#ffffff':'#c3a8a0');for(const{m,c}of materials)m.color.copy(c).multiply(tint);
  occupied.color.set(night?'#c8a36f':'#718b96');lampGlass.color.set(night?'#edc684':'#d6cdb2');
  H.dirty();
 }
 update();H.ambient.add(update);window.HouseEnvironment={group,sky,homes,update,get phase(){return last}};
})();
