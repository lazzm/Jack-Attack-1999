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
 // The street (js/hs-world.js House.FRONT.STREET): our pavement from FZ, its kerb, a 5.6 m road, the far kerb and
 // pavement. The opposite houses' front walls stand on the far pavement's back edge, about 17.8 m from our front wall.
 const ST=(H.FRONT&&H.FRONT.STREET)||{pave:[1400,1545],kerb:1550,road:[1555,2115],farKerb:2120,farPave:[2125,2270]};
 const OPP=ST.farPave[1]+560; // opposite plots: z of the house centre (front boundary 540 + 20 in front of it)
 // The village goes on past the end of our row: a crossroads to the east (the side road joins the back road), the
 // corner shop and a little green with the phone box on its corners, and more semis both ways. Past about 36 m from
 // wherever you stand, a painted backdrop ring (hills, rooftops, trees, the church) carries on to the horizon.
 const X=[2370,2460,2470,2950,2960,3050]; // the side road: west pavement, kerb, carriageway, kerb, east pavement
 const crosses=(x0,x1)=>x1>X[0]&&x0<X[5];
 const plots={
  opposite:Array.from({length:7},(_,i)=>[-2040+i*680,OPP,180,i,540]),
  rear:Array.from({length:6},(_,i)=>[-1700+i*680,-1850,0,i+7,540]),
  side:[[-1700,13],[-1020,14],[1060,15],[1740,16]].map(([x,n])=>[x,550,0,n,ST.pave[0]-570])
 };
 // Further along: simpler (but still solid and closed) houses, out to where the backdrop takes over.
 const farPlots=[
  ...[-4760,-4080,-3400,-2720,3400,4080,4760].map((x,i)=>[x,OPP,180,i+17,540]),
  ...[-4420,-3740,-3060,-2380,3780,4460].map((x,i)=>[x,550,0,i+24,ST.pave[0]-570]),
  ...[-4420,-3740,-3060,-2380,2380,3060,3740,4420].map((x,i)=>[x,-1850,0,i+30,540])
 ].filter(([x,z])=>z!==OPP&&z!==550||!crosses(x-330,x+330));
 zone('street',b=>{
  // Global foundation stays below every playable road/turf surface.
  // Distant plots own their bounded lawn bases, so their models still meet grade.
  b.box(0,GY+11,400,16000,10,16000,grass);
  // Keep every lawn in the existing ground batch, rather than adding one
  // material batch to each house row. Plot bases reach the global foundation.
  for(const [x,z,ry,n,front]of [...plots.opposite,...plots.rear,...plots.side,...farPlots]){
   const rear=-houseDepth[n%4]/2-326,end=front+20;
   b.at(x,GY+1,z,ry).box(0,2.5,(rear+end)/2,668,5,end-rear,grass);
  }
  // The corner plots either side of the side road: the green (west) and the shop's yard (east).
  for(const [x0,x1] of [[2074,X[0]],[X[5],3446]])b.box((x0+x1)/2,GY+3.5,(-21+ST.pave[0])/2,x1-x0,5,ST.pave[0]+21,grass);
  const slab=(x0,x1,z0,z1,m,top,h)=>{
   const depth=Math.max(h,6-top);
   b.box((x0+x1)/2,GY+top+depth/2,(z0+z1)/2,x1-x0,depth,z1-z0,m,{uv:100});
  };
  function pavement(x0,x1,z0,z1,kerb){
   slab(x0,x1,z0,z1,paving,-.2,3);
   // Actual shallow grooves separate slab rows, wholly above the pavement.
   for(let x=Math.ceil(x0/60)*60;x<x1;x+=60)b.box(x,GY-.35,(z0+z1)/2,.55,.3,z1-z0-4,earth);
   b.box((x0+x1)/2,GY-.35,(z0+z1)/2,x1-x0,.3,.55,earth);
   if(kerb!=null)slab(x0,x1,kerb-5,kerb+5,paving,-12,12);
  }
  function pavementZ(x0,x1,z0,z1,kerb){ // the same, running along z (the side road's footpaths)
   slab(x0,x1,z0,z1,paving,-.2,3);
   for(let z=Math.ceil(z0/60)*60;z<z1;z+=60)b.box((x0+x1)/2,GY-.35,z,x1-x0-4,.3,.55,earth);
   b.box((x0+x1)/2,GY-.35,(z0+z1)/2,.55,.3,z1-z0,earth);
   slab(kerb-5,kerb+5,z0,z1,paving,-12,12);
  }
  // Main road: both sides of the playable drive's own stretch (x -600..1200, js/hs-house.js), through the crossroads.
  const [p0,p1]=ST.pave,[r0,r1]=ST.road,[f0,f1]=ST.farPave,mid=(r0+r1)/2;
  for(const [x0,x1] of [[-5600,-600],[1200,5600]]){
   slab(x0,x1,r0,r1,road,0,3);
   for(let x=Math.ceil((x0+35)/180)*180;x<x1-35;x+=180)if(!crosses(x-35,x+35))b.box(x,GY-.3,mid,70,.3,3,trim);
  }
  for(const [x0,x1] of [[-5600,-600],[1200,X[1]],[X[4],5600]]){pavement(x0,x1,p0,p1,null);slab(x0,x1,ST.kerb-5,ST.kerb+5,paving,-12,12)}
  for(const [x0,x1] of [[-5600,X[1]],[X[4],5600]]){pavement(x0,x1,f0,f1,null);slab(x0,x1,ST.farKerb-5,ST.farKerb+5,paving,-12,12)}
  // The back road, its footpaths (the north one stops at the side road's mouth: a T-junction).
  slab(-5600,5600,-1185,-695,road,0,3);
  pavement(-5600,5600,-1290,-1195,-1190);
  for(const [x0,x1] of [[-5600,X[1]],[X[4],5600]])pavement(x0,x1,-685,-590,-690);
  for(let x=-5490;x<5600;x+=180)b.box(x,GY-.3,-940,70,.3,3,trim);
  // The side road: from the back road, across our street, on north past the opposite row.
  for(const [z0,z1] of [[-695,r0],[r1,4400]]){
   slab(X[2],X[3],z0,z1,road,0,3);
   for(let z=Math.ceil((z0+80)/180)*180;z<z1-80;z+=180)b.box((X[2]+X[3])/2,GY-.3,z,3,.3,70,trim);
  }
  for(const [z0,z1,k0,k1] of [[-590,p0,-695,ST.kerb+5],[f1,4400,ST.farKerb-5,4400]]){
   pavementZ(X[0],X[1],z0,z1,(X[1]+X[2])/2);pavementZ(X[4],X[5],z0,z1,(X[3]+X[4])/2);
   for(const kx of [(X[1]+X[2])/2,(X[3]+X[4])/2]){slab(kx-5,kx+5,k0,z0,paving,-12,12);if(k1>z1)slab(kx-5,kx+5,z1,k1,paving,-12,12)} // (the kerb turns the corner)
  }
  // Give way: double broken white lines across the side road where it meets our street and the back road.
  for(const z of [r0-14,r0-28,r1+14,r1+28,-680,-666])for(let x=X[2]+20;x<X[3]-30;x+=60)b.box(x+15,GY-.3,z,30,.3,6,trim);
  for(const x of [-4300,-2480,-1120,1600,3300,4700]){
   b.box(x,GY-.5,ST.farKerb-18,32,1,18,metal);
   for(let i=-2;i<=2;i++)b.box(x+i*5,GY-1.1,ST.farKerb-18,2,.4,14,paving);
   const l=b.at(x,GY,ST.farKerb+62);l.cyl(0,-230,0,4,7,460,8,metal);
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
 // Far houses: one closed body with painted elevations (two storeys of windows, the door, the bay), the same solid
 // roof shell, chimney, boundary walls, hedges and fences as the near ones, at a fraction of the triangles.
 const facadeTex=(type,rear)=>K.tex('env.facade.'+type+(rear?'.rear':''),256,256,(g,w,h)=>{
  const brickBase=type===1?'#cfc3ad':'#b4a491',course=type===1?['#c9bba3','#d2c6b0']:['#a87559','#ae7b60','#a16f55','#b17f62'];
  g.fillStyle=brickBase;g.fillRect(0,0,w,h);const r=K.rnd(560+type+(rear?9:0));
  for(let y=0;y<h;y+=4)for(let x=-(y/4%2)*5;x<w;x+=10){g.fillStyle=course[(r()*course.length)|0];g.fillRect(x+.5,y+.5,9,3)}
  if(type===1&&!rear){g.fillStyle='#d6ceba';g.fillRect(0,0,w,h*.47);g.fillStyle='#aaa79d';g.fillRect(0,h*.47,w,3)}
  const win=(cx,cy,ww,hh,lit)=>{g.fillStyle='#ddd8c9';g.fillRect(cx-ww/2-3,cy-hh/2-3,ww+6,hh+6);g.fillStyle=lit?'#8a9aa0':'#3e5763';g.fillRect(cx-ww/2,cy-hh/2,ww,hh);
   g.fillStyle='#718b96';g.fillRect(cx-ww/2,cy-hh/2,ww*.45,hh*.42);g.fillStyle='#ddd8c9';g.fillRect(cx-1.5,cy-hh/2,3,hh);g.fillRect(cx-ww/2,cy-hh*.12-1.5,ww,3);
   g.fillStyle='#aaa79d';g.fillRect(cx-ww/2-6,cy+hh/2+3,ww+12,4)};
  const up=h*.22,down=h*.72,lx=w*.26,rx=w*.74;
  win(lx,up,44,52,type===3);win(rx,up,44,52,false);
  if(rear){win(lx,down,40,50,false);win(rx,down,40,50,type===0)}
  else{
   const doorRight=type!==2,dx=type===2?w/2:w*.77,bayX=type===2?w*.24:w*.27;
   win(bayX,down,type===1?64:48,54,type===0);if(type===2)win(w*.76,down,40,54,false);
   g.fillStyle='#ddd8c9';g.fillRect(dx-21,h*.585,42,h*.415);g.fillStyle=['#334747','#5a2a2a','#2d3b52','#3b4a33'][type];g.fillRect(dx-17,h*.6,34,h*.4);
   g.fillStyle='#3e5763';g.fillRect(dx-11,h*.625,22,h*.1);g.fillStyle='#c8a850';g.fillRect(dx+9,h*.79,4,3);
   if(doorRight){g.fillStyle='#68544a';g.fillRect(dx-30,h*.555,60,7)}
  }
 });
 const facades=[0,1,2].map(t=>{const m=paint('#ffffff');m.map=facadeTex(t,false);return m}),rearFacade=paint('#ffffff');rearFacade.map=facadeTex(0,true);
 const farHomes=[];
 function farHome(B,x,z,ry,n,front){
  const type=n%4,w=[540,530,500,560][type],d=houseDepth[type],eave=[492,480,485,490][type],rise=[156,165,175,150][type],across=type!==2;
  const b=B.at(x,GY+1,z,ry),wall=type===1?paleBrick:masonry,tile=type===1||type===3?slate:roof,face=d/2,doorX=type===2?0:w*.27;
  farHomes.push({x,z,ry,width:w,depth:d,eave,rise,type,front});
  b.box(0,-eave/2,0,w,eave,d,wall,{uv:100});
  // Painted elevations stand 1.2 cm proud of the body (no shared faces), front and back.
  b.box(0,-eave/2,face+.6,w-.4,eave-.4,1.2,facades[type%3]);b.box(0,-eave/2,-face-.6,w-.4,eave-.4,1.2,rearFacade);
  pitched(b,w,d,eave,rise,tile,type===1?render:wall,across);
  b.box(0,-12,0,w+4,24,d+4,earth);
  const cx=w*.3,cz=-d*.23,chimTop=-eave-rise-35;
  b.box(cx,chimTop+81,cz,40,162,44,wall,{uv:100});b.box(cx,chimTop,cz,48,8,52,paving);
  b.box(doorX,-1,(face+12+front)/2,82,2,front-face-12,paving);b.box(doorX,-1,front+10,82,2,20,paving);
  b.box(doorX,-3,face+26,96,6,28,paving);
  for(const [lo,hi] of [[-318,doorX-58],[doorX+58,318]]){b.box((lo+hi)/2,-29,front,hi-lo,58,18,wall,{uv:100});b.box((lo+hi)/2,-60,front,hi-lo+4,4,24,paving)}
  for(const side of [-1,1]){b.box(side*321,-36,(face+front)/2,18,72,front-face-12,hedge);b.box(side*321,-2,(face+front)/2,26,4,front-face-12,earth)}
  const rear=-face-320;b.box(0,-63,rear,648,126,8,fence,{uv:140});
  for(const side of [-1,1])b.box(side*322,-63,(rear+face)/2,8,126,face-rear-8,fence,{uv:140});
  if(n%3===0)tree(b,-240,-face-105,365+(n%2)*60,n);
 }
 // The corner shop on our side of the crossroads: a two-storey corner building, the shop below with its fascia, big
 // windows on both streets and the door across the corner, the flat above. Newsagent, sweets, groceries.
 const shopSign=paint('#ffffff');shopSign.map=K.tex('env.shop.fascia',512,64,(g,w,h)=>{
  g.fillStyle='#24452f';g.fillRect(0,0,w,h);g.fillStyle='#c9a640';g.fillRect(0,3,w,3);g.fillRect(0,h-6,w,3);
  // Block capitals from rectangles only (the unit test's canvas has no text): V I L L A G E   S T O R E S
  const L={V:['1000001','1000001','0100010','0100010','0010100','0001000'],I:['111','010','010','010','010','111'],L:['100','100','100','100','100','111'],A:['01110','10001','10001','11111','10001','10001'],G:['01111','10000','10000','10011','10001','01111'],E:['1111','1000','1110','1000','1000','1111'],S:['0111','1000','0110','0001','0001','1110'],T:['11111','00100','00100','00100','00100','00100'],O:['01110','10001','10001','10001','10001','01110'],R:['1110','1001','1110','1010','1001','1001'],' ':['00','00','00','00','00','00']};
  const text='VILLAGE STORES',px=5,widths=[...text].map(c=>L[c][0].length*px+px),total=widths.reduce((a,b)=>a+b,0);let x0=(w-total)/2;
  g.fillStyle='#f1e7c8';for(const c of text){const rows=L[c];rows.forEach((row,yy)=>[...row].forEach((on,xx)=>{if(on==='1')g.fillRect(x0+xx*px,17+yy*px,px-.5,px-.5)}));x0+=rows[0].length*px+px}
 });
 const shopGlass=paint('#4f6670'),shopFrame=paint('#24452f'),poster=paint('#ffffff');
 poster.map=K.tex('env.shop.posters',128,64,(g,w,h)=>{g.fillStyle='#4f6670';g.fillRect(0,0,w,h);for(const [x,c] of [[6,'#d9473b'],[46,'#f0d040'],[86,'#3f8ad0']]){g.fillStyle=c;g.fillRect(x,8,34,44);g.fillStyle='#fff';g.fillRect(x+4,14,26,6);g.fillRect(x+4,26,18,4);g.fillRect(x+4,36,22,4)}});
 function cornerShop(b){
  const x0=X[5]+6,x1=3440,z1=ST.pave[0]-4,z0=z1-760,w=x1-x0,cx=(x0+x1)/2,cz=(z0+z1)/2,eave=560,s=b.at(0,GY+1,0);
  s.box(cx,-eave/2,cz,w,eave,z1-z0,masonry,{uv:100});s.box(cx,-12,cz,w+4,24,z1-z0+4,earth);
  pitched(s.at(cx,0,cz),w,z1-z0,eave,170,slate,masonry,true);
  s.box(cx+w*.28,-eave-150,cz-140,42,180,46,masonry,{uv:100});s.box(cx+w*.28,-eave-243,cz-140,50,8,54,paving);
  // The shop front along our street (+z) and along the side road (-x): fascia, stall riser, windows, mullions.
  const front=(f,len)=>{
   f.box(0,-286,2,len,40,4,shopFrame);f.box(0,-286,4.2,len-20,30,.4,shopSign);f.box(0,-264,6,len+8,4,12,shopFrame);
   f.box(0,-28,2.5,len-8,56,5,shopFrame);f.box(0,-150,1,len-8,180,2,shopGlass);f.box(0,-150,2.4,len-30,120,.4,poster);
   for(let k=0;k<=4;k++)f.box(-len/2+4+k*(len-8)/4,-150,3.5,6,184,5,shopFrame);
   f.box(0,-62,3.5,len-8,6,5,shopFrame);f.box(0,-240,3.5,len-8,6,5,shopFrame);
  };
  front(s.at((x0+x1-110)/2,0,z1),x1-x0-118);front(s.at(x0,0,cz+60,-90),z1-z0-200);
  // The shop door at the end of the front, with its step.
  const d=s.at(x1-58,0,z1);d.box(0,-104,1,74,208,4,shopFrame);d.box(0,-100,3,62,196,2,shopGlass);d.box(0,-3,14,90,6,20,paving);
  for(const [wx,wz,ry] of [[cx-120,z1,0],[cx+120,z1,0],[x0,cz-120,-90],[x0,cz+200,-90]])windowBay(s,wx,-eave+120,wz,ry,96,104,7);
  // A newspaper board on the pavement, the bins at the side.
  const bd=b.at(cx+40,GY-.2,ST.pave[0]+45,8);bd.box(0,-46,-6,52,86,2,metal,{rx:-8});bd.box(0,-46,6,52,86,2,metal,{rx:8});bd.box(0,-50,-7.4,44,70,.4,poster,{rx:-8});
  s.box(cx+100,-55,z0-50,56,110,60,door);s.box(cx+100,-112,z0-50,60,5,64,metal);
 }
 // The green on the other corner: grass, a bench, the red phone box and the pillar box by the kerb.
 const red=paint('#b3261e'),redDark=paint('#7d1a15'),black=paint('#202322');
 function green(b){
  const g=b.at(0,GY+1,0);
  tree(g,2230,560,430,2);
  const kz=ST.pave[0]-60,k=g.at(2310,0,kz,0);
  k.box(0,-6,0,98,12,98,paving);k.box(0,-130,0,90,236,90,red);k.box(0,-250,0,96,8,96,redDark);k.box(0,-262,0,72,16,72,red);
  for(const [x,z,ry] of [[0,46,0],[0,-46,180],[46,0,90],[-46,0,-90]]){const f=k.at(x,0,z,ry);f.box(0,-120,0,70,180,1.6,shopGlass);for(let i=1;i<3;i++)f.box(-35+i*23.3,-120,.8,3,180,1.6,red);for(let j=1;j<8;j++)f.box(0,-210+j*22.5,.8,70,3,1.6,red);f.box(0,-224,.8,60,10,1.6,paving)}
  const bench=g.at(2160,0,kz+10,0);for(const x of [-70,70])bench.box(x,-22,0,6,44,40,black);bench.box(0,-44,0,160,4,42,fence);bench.box(0,-70,-19,160,22,4,fence);
  const pb=b.at(X[0]-40,GY,ST.pave[0]+70,0);pb.cyl(0,-70,0,22,22,140,16,red);pb.cyl(0,-146,0,25,25,12,16,redDark);pb.ball(0,-152,0,22,8,22,red,10);pb.box(0,-112,22,18,3,2,black);
 }
 zone('opposite houses',b=>{for(const p of plots.opposite)home(b,...p)});
 zone('rear houses',b=>{for(const p of plots.rear)home(b,...p)});
 zone('side houses',b=>{
  // These are the neighbours on Jack's street, with fronts towards the SAME
  // road. Their backs and hedges stay outside both playable rectangles.
  for(const p of plots.side)home(b,...p);
  const planted=b.at(0,GY+6,0);
  for(const [x,z,i] of [[-3400,-300,0],[-1900,-330,1],[1300,-320,2],[3700,-300,3],[-3000,3550,4],[-1400,3600,5],[200,3520,6],[1700,3580,7],[3800,3540,8]])tree(planted,x,z,460+(i%3)*55,i);
 });
 // (one batch for the far rows and the crossroads, so the extra village costs as few draw calls as possible)
 zone('far houses',b=>{for(const p of farPlots)farHome(b,...p);cornerShop(b);green(b)});
 const light=new T.Vector3(-.4,-.8,.4).normalize(),normal=new T.Vector3();
 group.traverse(o=>{o.userData.noPick=true;if(!o.geometry)return;const n=o.geometry.attributes.normal,colours=new Float32Array(n.count*3);for(let i=0;i<n.count;i++){const shade=.69+.29*Math.max(0,normal.fromBufferAttribute(n,i).dot(light));colours.fill(shade,i*3,i*3+3)}o.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));o.material.vertexColors=true;});

 // The horizon: a painted ring 36 m out that travels with the camera (like the sky), so whichever way you look past the
 // last houses there are fields, hedgerows, more rooftops, the church spire and low hills fading into the haze, never
 // the edge of the world. Depth-tested, so everything nearer stands in front of it; drawn once per phase change.
 const RING={r:3600,below:60,above:640,w:2048,h:256};
 const ringCanvas=document.createElement('canvas');ringCanvas.width=RING.w;ringCanvas.height=RING.h;
 const ringTex=new T.CanvasTexture(ringCanvas);ringTex.wrapS=T.RepeatWrapping;
 const backdrop=new T.Mesh(new T.CylinderGeometry(RING.r,RING.r,RING.below+RING.above,96,1,true),new T.MeshBasicMaterial({map:ringTex,side:T.BackSide,alphaTest:.5}));
 backdrop.name='backdrop';backdrop.rotation.x=Math.PI;backdrop.position.y=GY-(RING.above-RING.below)/2;backdrop.frustumCulled=false;backdrop.userData.noPick=true;
 backdrop.onBeforeRender=(r,s,camera)=>{const e=camera.matrixWorld.elements;backdrop.position.x=e[12];backdrop.position.z=e[14];backdrop.updateMatrixWorld(true)};
 H.root.add(backdrop);
 function paintBackdrop(ph,horizon){
  const g=ringCanvas.getContext('2d'),im=g.createImageData(RING.w,RING.h),d=im.data,night=ph==='night',TAU=Math.PI*2;
  const mix=(hex,k)=>{const c=new T.Color(hex);return c.lerp(horizon,k)};
  const P=night?{field:mix('#141a26',.35),hill:mix('#1b2232',.45),tree:mix('#10151f',.2),roof:mix('#151a24',.2),wall:mix('#1d2330',.2),spire:mix('#1a1f2b',.25)}
   :ph==='day'?{field:mix('#6f8a5c',.45),hill:mix('#7f9a86',.62),tree:mix('#4f6a45',.38),roof:mix('#5e534f',.38),wall:mix('#9c7b66',.42),spire:mix('#8d8a84',.45)}
   :{field:mix('#5e6650',.5),hill:mix('#6c6f78',.62),tree:mix('#3f4a3c',.4),roof:mix('#4c4446',.4),wall:mix('#7d6458',.45),spire:mix('#6f6a6a',.45)};
  const lit=new T.Color('#e7b866'),glow=new T.Color('#c98a4a'),rnd=K.rnd(4242);
  const set=(i,c,a)=>{d[i]=c.r*255;d[i+1]=c.g*255;d[i+2]=c.b*255;d[i+3]=a};
  for(let x=0;x<RING.w;x++){
   const u=x/RING.w,a=u*TAU;
   const hill=Math.max(40,150+70*Math.sin(a*3+1.3)+45*Math.sin(a*7+.4)+22*Math.sin(a*13+2.1));
   const trees=Math.max(18,62+24*Math.sin(a*41)+17*Math.sin(a*67+1)+11*Math.sin(a*113+2)+8*Math.sin(a*197+.5));
   // Villages in three directions: little gabled houses with chimneys, then hedgerows and trees between them.
   const town=Math.sin(a*3+.7)>-.15,p=(x%23)/23,body=town?92:0,gable=town?body+44*(1-Math.abs(p-.5)*2):0,chim=town&&p>.68&&p<.76?body+60:0;
   // The church: a square tower and its spire, off to one side.
   const ch=Math.abs(u-.615)*RING.w,tower=ch<7?235:0,spire=ch<7?235+190*(1-ch/7):0;
   const roofTop=Math.max(gable,chim),near=Math.max(trees,roofTop,spire,tower);
   for(let y=0;y<RING.h;y++){
    const i=(y*RING.w+x)*4,cm=RING.above-y/(RING.h-1)*(RING.above+RING.below);
    if(cm<0){set(i,night?P.field.clone().lerp(glow,.12):P.field,255);continue}
    if(cm<=near){
     let c=cm<=tower||cm<=spire&&ch<7?P.spire:town&&cm<=roofTop&&cm>body?P.roof:town&&cm<=body&&p>.08&&p<.92?P.wall:P.tree;
     if(night&&c===P.wall&&cm>24&&cm<80&&(x*7+((cm/16)|0)*13)%11===0&&rnd()<.5)c=lit;
     set(i,c,255);continue;
    }
    if(cm<=hill){set(i,P.hill,255);continue}
    d[i+3]=0;
   }
  }
  g.putImageData(im,0,0);ringTex.needsUpdate=true;
 }
 const faces=Array.from({length:6},()=>{const c=document.createElement('canvas');c.width=c.height=256;return c});
 const sky=new T.CubeTexture(faces);sky.minFilter=T.LinearFilter;sky.magFilter=T.LinearFilter;sky.generateMipmaps=false;H.scene.background=sky;
 const direction=(face,u,v)=>{const a=2*u-1,b=1-2*v;return new T.Vector3(...[[1,b,-a],[-1,b,a],[a,1,-b],[a,-1,b],[a,b,1],[-a,b,-1]][face]).normalize()};
 const sun=new T.Vector3(-.45,.58,.7).normalize(),moon=new T.Vector3(.6,.5,-.6).normalize();
 let last='',lastMinute=-1,nextUpdate=0;const phases=['night','dusk','dawn','day'];
 function phase(){const cl=document.getElementById('bootPower')?.classList;for(const p of phases)if(cl?.contains('rm-'+p))return p;const h=(window.OwnerTools?.now()||new Date()).getHours();return h<6||h>=20?'night':h<8?'dawn':h>=18?'dusk':'day'}
 function update(now=0){
  if(now&&now<nextUpdate)return false;nextUpdate=now+1000;
  const ph=phase(),minute=(window.OwnerTools?.now()||new Date()).getMinutes();if(ph===last&&minute===lastMinute)return false;lastMinute=minute;if(ph===last)return false;last=ph;
  const colours={day:['#477db1','#cedadf'],dusk:['#363a64','#d89774'],dawn:['#54577d','#ddb69a'],night:['#080f23','#26344b']}[ph],zenith=new T.Color(colours[0]),horizon=new T.Color(colours[1]),night=ph==='night';
  faces.forEach((c,face)=>{const g=c.getContext('2d'),im=g.createImageData(256,256),d=im.data;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const v=direction(face,(x+.5)/256,(y+.5)/256),h=Math.max(0,v.y),col=horizon.clone().lerp(zenith,Math.pow(h,.6));
    if(!night){const cloud=Math.sin(v.x*18+v.z*9)+Math.sin(v.z*24-v.x*11)+Math.sin(v.x*32+v.z*27);const alpha=Math.max(0,Math.min(.54,(cloud-1.2)*.35))*Math.max(0,Math.min(1,(h-.06)*6))*Math.max(0,1-h);col.lerp(new T.Color('#f1e9db'),alpha);const glow=Math.pow(Math.max(0,v.dot(sun)),250);col.lerp(new T.Color('#fff0c7'),glow)}
    else{const dot=v.dot(moon);if(dot>.9993)col.set('#e5e0cc');const seed=Math.sin(Math.floor(v.x*700)*127.1+Math.floor(v.y*700)*311.7+Math.floor(v.z*700)*74.7)*43758.5453;if(h>.08&&seed-Math.floor(seed)>.9993)col.lerp(new T.Color('#d5dded'),.6)}
    const i=(y*256+x)*4;d[i]=col.r*255;d[i+1]=col.g*255;d[i+2]=col.b*255;d[i+3]=255;
   }g.putImageData(im,0,0);
  });sky.needsUpdate=true;
  paintBackdrop(ph,horizon);
  const tint=new T.Color(night?'#566378':ph==='day'?'#ffffff':'#c3a8a0');for(const{m,c}of materials)m.color.copy(c).multiply(tint);
  occupied.color.set(night?'#c8a36f':'#718b96');lampGlass.color.set(night?'#edc684':'#d6cdb2');
  H.dirty();return true;
 }
 update();H.ambient.add(update);window.HouseEnvironment={group,sky,homes,farHomes,backdrop,street:ST,update,get phase(){return last}};
})();
