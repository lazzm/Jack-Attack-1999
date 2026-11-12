/* Shared, non-walkable neighbourhood and translation-free skybox. Original art only. */
(function(){
 'use strict';
 const H=window.House,K=window.HouseKit,A=window.HouseArt;
 if(!H||!H.ok||!K||!A||window.HouseEnvironment)return;
 const T=H.T,GY=353,group=new T.Group();group.name='neighbourhood';H.root.add(group);
 // Keep distant rows independently frustum-cullable, without per-house meshes
 // or any visibility work in the animation loop. All palettes are shared.
 const materials=[];
 const paint=(c,lit=false)=>{const m=lit?new T.MeshPhongMaterial({color:c,shininess:4,specular:0x161512}):new T.MeshBasicMaterial({color:c});materials.push({m,c:new T.Color(c)});return m};
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
 const roof=paint('#68544a'),slate=paint('#4d575b'),trim=paint('#ddd8c9'),glass=paint('#718b96'),glassShade=paint('#3e5763'),door=paint('#334747'),road=paint('#4c4d4e',true),grass=paint('#547044'),hedge=paint('#64834f'),leaf=paint('#657645'),paving=paint('#aaa79d',true),earth=paint('#655543'),metal=paint('#383e3d');
 roof.map=slate.map=tiles;
 // Pavement joints belong to the solid slab's surface. The former 0.3 cm
 // high, many-metre groove boxes produced raster slivers through indoor walls
 // at grazing angles (their shaded earth colour was visible as dotted lines).
 paving.map=K.tex('env.paving.joints',256,256,(g,w,h)=>{
  g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
  g.fillStyle='#978a6d';g.fillRect(0,0,2,h);g.fillRect(0,0,w,2);
 },{rep:[100/60,100/60]});
 // Fine leaf clusters on a continuous solid, with no cut-out alpha cards.
 hedge.map=leaf.map=K.tex('env.hedge.leaves',128,128,(g,w,h)=>{
  g.fillStyle='#b6c3a6';g.fillRect(0,0,w,h);const r=K.rnd(114);
  for(let i=0;i<2700;i++){g.fillStyle=['#9cae8c','#d2dbc4','#b5c7a3','#8b9f7a'][i%4];g.fillRect(r()*w,r()*h,1+r()*2,1+r()*1.2)}
 });
 // One instance batch (one draw) for every street crown. The near gardens use
 // the same branch/clump kit as Jack's garden; far trees spend just eight
 // scalloped clumps on a broken silhouette instead of three oversized balls.
 const treeLeaf=paint('#6c824e');treeLeaf.vertexColors=true;
 // R248: the crowns are shaded per pixel from the clump's interpolated normal (no new varyings beyond one vec3, no
 // extra draws or triangles). Shading baked into a 20-vertex clump's vertex colours interpolated linearly across each
 // big triangle and read as facets up close; here a wide wrap carries the lit top round the sides, and a soft belly
 // shadow (ambient occlusion under the clump) replaces the per-vertex speckle.
 treeLeaf.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 crownN;').replace('#include <begin_vertex>','#include <begin_vertex>\ncrownN=normal;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 crownN;').replace('#include <color_fragment>',`#include <color_fragment>
   {vec3 n=normalize(crownN);float up=smoothstep(-.45,1.,-n.y),belly=smoothstep(-.1,1.,n.y);
    float shade=(.8+.26*up)*(1.-.16*belly);diffuseColor.rgb*=shade*vec3(1.+.04*up,1.,1.-.07*up+.05*belly);}`);
 };
 treeLeaf.customProgramCacheKey=()=>'street-crown-soft';
 // Leaf clusters painted at street scale: lit sprays, dark gaps between them.
 treeLeaf.map=K.tex('env.tree.leaves',128,128,(g,w,h)=>{
  g.fillStyle='#a9b98f';g.fillRect(0,0,w,h);const r=K.rnd(733);
  for(let i=0;i<900;i++){g.fillStyle=i%5?'rgba(52,66,38,.28)':'rgba(30,40,24,.4)';g.beginPath();g.ellipse(r()*w,r()*h,1.5+r()*2.4,1+r()*1.4,r()*3,0,7);g.fill()}
  for(let i=0;i<1500;i++){g.fillStyle=['#c7d3a6','#dfe6c0','#9fb383','#b9c896'][i%4];g.beginPath();g.ellipse(r()*w,r()*h,1.2+r()*1.8,.6+r()*.7,r()*3,0,7);g.fill()}
 });
 const crownParts=[];
 // A rounded, lumpy clump: a dodecahedron (36 triangles, fewer than the old
 // ball) with shared normals, a flatter underside, a lit crown and a dark,
 // slightly warm belly, kept low in contrast so outlines stay soft. World-ish UVs repeat the leaf paint about every 35 cm.
 function crownClump(){
  const src=new T.DodecahedronGeometry(1,0),p=src.attributes.position,seen=new Map(),pos=[],index=[];
  for(let i=0;i<p.count;i++){const k=Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4);let j=seen.get(k);if(j===undefined){j=pos.length/3;seen.set(k,j);pos.push(p.getX(i),p.getY(i),p.getZ(i))}index.push(j)}
  src.dispose();const r=K.rnd(907),uv=[];
  for(let j=0;j<pos.length;j+=3){const s=.92+r()*.16;pos[j]*=s;pos[j+1]*=s*(pos[j+1]>0?.9:1);pos[j+2]*=s;uv.push((pos[j]*.8+pos[j+2]*.6)*2,(pos[j+1]*.9+pos[j]*.25)*2)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
  const n=geo.attributes.normal,colours=[];
  // (the light and the belly shadow are per pixel, in treeLeaf's shader: the vertices only carry a faint, low-contrast mottle)
  for(let i=0;i<n.count;i++){const v=.985+r()*.03;colours.push(v,v,v)}
  geo.setAttribute('color',new T.Float32BufferAttribute(colours,3));return geo;
 }
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
 // Nearby sodium columns share their emitter positions with the house's fixed
 // light rig. Warm ground ink supplements it without another real light.
 const streetLamps=[-420,960].map(x=>({x,y:GY-454,z:ST.farKerb+10,c:'#ffc078',i:1.7,d:1650}));
 const OPP=ST.farPave[1]+560; // opposite plots: z of the house centre (front boundary 540 + 20 in front of it)
 // The village goes on past the end of our row: a crossroads to the east (the side road joins the back road), the
 // corner shop and a little green with the phone box on its corners, and more semis both ways. Beyond the solid
 // street bends, a low painted silhouette of distant hills and treetops sits 95 m from the camera.
 const X=[2370,2460,2470,2950,2960,3050]; // the side road: west pavement, kerb, carriageway, kerb, east pavement
 const crosses=(x0,x1)=>x1>X[0]&&x0<X[5];
 const plots={
  opposite:Array.from({length:7},(_,i)=>[-2040+i*680,OPP,180,i,540]),
  rear:Array.from({length:6},(_,i)=>[-1700+i*680,-2850,0,i+7,540]),
  side:[[-1700,13],[-1020,14],[1060,15],[1740,16]].map(([x,n])=>[x,550,0,n,ST.pave[0]-570])
 };
 // Further along: simpler (but still solid and closed) houses, out to where the backdrop takes over.
 const farPlots=[
  ...[-4760,-4080,-3400,-2720,3400,4080,4760].map((x,i)=>[x,OPP,180,i+17,540]),
  ...[-4420,-3740,-3060,-2380,3780,4460].map((x,i)=>[x,550,0,i+24,ST.pave[0]-570]),
  ...[-5440,5440].map((x,i)=>[x,OPP,180,60+i,540]),
  ...[-5100,5140].map((x,i)=>[x,550,0,62+i,ST.pave[0]-570]),
  ...[-4420,-3740,-3060,-2380,2380,3060,3740,4420].map((x,i)=>[x,-2850,0,i+30,540])
 ].filter(([x,z])=>z!==OPP&&z!==550||!crosses(x-330,x+330));
 // Continue the cross street in depth, closing the open eastern corner. These
 // closed shells reuse the far-row batch and palettes; no per-house draws.
 const crossPlots=[...[[1810,3670,90,41],[1810,4350,90,42],[3610,5030,-90,43],[3610,3670,-90,44],[3610,4350,-90,45]].map(p=>[...p,540]),
  ...[[-2380,-3740,0,46],[-1020,-3740,0,47],[340,-3740,0,48],[1700,-3740,0,49],[-2720,3850,180,50],[-1360,3850,180,51],[0,3850,180,52]].map(p=>[...p,540])];
 zone('street',b=>{
  // Global foundation stays below every playable road/turf surface.
  // Distant plots own their bounded lawn bases, so their models still meet grade.
  b.box(0,GY+11,400,24000,10,24000,grass);
  // Keep every lawn in the existing ground batch, rather than adding one
  // material batch to each house row. Plot bases reach the global foundation.
  for(const [x,z,ry,n,front]of [...plots.opposite,...plots.rear,...plots.side,...farPlots]){
   const rear=z===550?-1476-z-6:-houseDepth[n%4]/2-326,end=front+20;
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
   // Subtle joint ink on the solid concrete surface.
   // The continuous closed slab carries the joint texture; no thin overlay boxes.
   if(kerb!=null)slab(x0,x1,kerb-5,kerb+5,paving,-12,12);
  }
  function pavementZ(x0,x1,z0,z1,kerb){ // the same, running along z (the side road's footpaths)
   slab(x0,x1,z0,z1,paving,-.2,3);
   // Same jointed solid surface on the side road.
   slab(kerb-5,kerb+5,z0,z1,paving,-12,12);
  }
  // One main carriageway, including the drive's frontage, through the crossroads.
  const [p0,p1]=ST.pave,[r0,r1]=ST.road,[f0,f1]=ST.farPave,mid=(r0+r1)/2;
  for(const [x0,x1] of [[-6630,6630]]){
   slab(x0,x1,r0,r1,road,0,3);
   for(let x=Math.ceil((x0+35)/180)*180;x<x1-35;x+=180)if(!crosses(x-35,x+35))b.box(x,GY-.3,mid,70,.3,3,trim);
  }
  for(const [x0,x1] of [[-6630,-600],[1200,X[1]],[X[4],6630]]){pavement(x0,x1,p0,p1,null);slab(x0,x1,ST.kerb-5,ST.kerb+5,paving,-12,12)}
  for(const [x0,x1] of [[-6070,X[1]],[X[4],6070]]){pavement(x0,x1,f0,f1,null);slab(x0,x1,ST.farKerb-5,ST.farKerb+5,paving,-12,12)}
  // Both ends turn behind the last row. The far carriageway and pavement
  // turn with them; closed houses and trees hide the geometric horizon.
  for(const side of [-1,1]){
   const span=(a,b)=>side<0?[-b,-a]:[a,b];
   slab(...span(6070,6630),r1,5100,road,0,3);
   pavementZ(...span(6640,6785),p0,5100,side*6635);
   pavementZ(...span(5920,6065),f0,5100,side*6065);
  }
  // The back road, its footpaths (the north one stops at the side road's mouth: a T-junction).
  slab(-5600,5600,-2185,-1695,road,0,3);
  pavement(-5600,5600,-2290,-2195,-2190);
  for(const [x0,x1] of [[-5600,X[1]],[X[4],5600]])pavement(x0,x1,-1685,-1590,-1690);
  for(let x=-5490;x<5600;x+=180)b.box(x,GY-.3,-1940,70,.3,3,trim);
  // The side road: from the back road, across our street, on north past the opposite row.
  for(const [z0,z1] of [[-1695,r0],[r1,4400]]){
   slab(X[2],X[3],z0,z1,road,0,3);
   for(let z=Math.ceil((z0+80)/180)*180;z<z1-80;z+=180)b.box((X[2]+X[3])/2,GY-.3,z,3,.3,70,trim);
  }
  for(const [z0,z1,k0,k1] of [[-1590,p0,-1695,ST.kerb+5],[f1,4400,ST.farKerb-5,4400]]){
   pavementZ(X[0],X[1],z0,z1,(X[1]+X[2])/2);pavementZ(X[4],X[5],z0,z1,(X[3]+X[4])/2);
   for(const kx of [(X[1]+X[2])/2,(X[3]+X[4])/2]){slab(kx-5,kx+5,k0,z0,paving,-12,12);if(k1>z1)slab(kx-5,kx+5,z1,k1,paving,-12,12)} // (the kerb turns the corner)
  }
  // Give way: double broken white lines across the side road where it meets our street and the back road.
  for(const z of [r0-14,r0-28,r1+14,r1+28,-1680,-1666])for(let x=X[2]+20;x<X[3]-30;x+=60)b.box(x+15,GY-.3,z,30,.3,6,trim);
  for(const x of [-4300,-2480,-1120,...streetLamps.map(l=>l.x),1600,3300,4700]){
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
 const porchPools=[];
 const homes=[];
 function windowBay(b,x,y,z,ry,w,h,n){
  const f=b.at(x,y,z,ry),lit=n%4===1;
  // The glass sits at the back of a thick reveal. Pale outer joinery, dark
  // inner cheeks and an overhanging sill make the depth readable obliquely.
  f.box(0,0,1,w+3,h+3,2,metal);
  f.box(0,-h*.23,2.7,w-10,h*.46-5,1.4,lit?occupied:glass);
  f.box(0,h*.23,2.7,w-10,h*.46-5,1.4,lit?occupied:glassShade);
  for(const side of [-1,1]){
   f.box(side*(w/2-2.5),0,7,5,h,12,trim);
   f.box(0,side*(h/2-2.5),7,w-10,5,12,trim);
   // Unequal drawn curtains with folds, leaving a generous central opening.
   const cw=side<0?9+n%3*3:14-n%3*2;
   const fold=new T.Shape();fold.moveTo(-cw/2,0);fold.lineTo(cw/2,0);fold.lineTo(0,1.7);fold.closePath();
   const curtain=new T.ExtrudeGeometry(fold,{depth:h-10,bevelEnabled:false});curtain.rotateX(Math.PI/2);curtain.translate(0,(h-10)/2,0);
   f.geo(curtain,side*(w/2-6-cw/2),0,4.1,n%3===0?render:trim);curtain.dispose();
  }
  f.box(0,0,8,4,h-10,12,trim);f.box(0,-h*.12,8,w-10,4,12,trim);
  f.box(0,h/2+3,10,w+16,7,28,paving);
  f.box(0,-h/2-6,4,w+14,7,16,paving);
 }
 function tree(b,x,z,h,n,near=false){
  const local=b.at(x,0,z),parts=crownParts;
  if(near){
   const species=Math.floor(n/3)%3,sp=species===1?81:110,lean=species===1?h*.045:-h*.025,first=parts.length,grow=new T.Vector3(1.18,1.14,1.18);
   K.branchingTree(b,x,0,z,h,sp,species===1?fence:earth,treeLeaf,species,false,parts);
   // Fuller street crowns: the kit's sprays grow to overlap, and a darker
   // inner layer closes the middle so sky only shows towards the edges.
   for(let i=first;i<parts.length;i++)parts[i].matrix.scale(grow);
   for(let k=0;k<8;k++){const a=k*2.4+n,rad=sp*(.22+.2*(k%2));parts.push({matrix:K.xform(local.base,lean+Math.cos(a)*rad,-h*(.66+(k%4)*.055),Math.sin(a)*rad,{sx:sp*.5,sy:h*.105,sz:sp*.45,ry:k*53+n*17}),seed:k+n,shade:.7+(k%2)*.08})}
   return;
  }
  const spread=118+(n%3)*9,lean=n%2?7:-9;
  local.cyl(lean*.45,-h*.36,0,5,12,h*.72,7,earth,{rz:lean/h*55});
  const limb=(a,c)=>{const d=new T.Vector3(...c).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...c)).multiplyScalar(.5),geo=new T.CylinderGeometry(1.1,4,d.length(),5);geo.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())));local.geo(geo,mid.x,mid.y,mid.z,earth);};
  for(let i=0;i<3;i++){
   const a=i*2.399+n*.71,reach=spread*(.68+i*.06),end=[lean+Math.cos(a)*reach,-h*(.67+i*.055),Math.sin(a)*reach];
   limb([lean*.6,-h*(.45+i*.06),0],end);
   for(let j=0;j<2;j++){
    const sx=end[0]+Math.cos(a+(j?-.65:.65))*spread*.18,sz=end[2]+Math.sin(a+(j?-.65:.65))*spread*.18;
    parts.push({matrix:K.xform(local.base,sx,end[1]-j*h*.063,sz,{sx:spread*(j?.58:.63),sy:h*(j?.14:.125),sz:spread*(j?.52:.6),ry:n*37+i*71+j*39}),seed:n+i+j,shade:j?1.08:.82});
   }
  }
  for(let i=0;i<2;i++)parts.push({matrix:K.xform(local.base,lean+(i?26:-22),-h*(.88+i*.055),i?18:-12,{sx:spread*.56,sy:h*.14,sz:spread*.5,ry:n*51+i*77}),seed:n+i,shade:1.04+i*.04});
 }
 function gardenHedge(b,x,z,len,height=78,width=50,distant=false){
  const geo=new T.BoxGeometry(width,height,len,2,distant?2:4,Math.max(2,Math.ceil(len/(distant?150:65)))),p=geo.attributes.position,r=12;
  for(let i=0;i<p.count;i++){
   const xx=p.getX(i),yy=p.getY(i),zz=p.getZ(i),cx=Math.max(-width/2+r,Math.min(width/2-r,xx)),cy=Math.max(-height/2+r,Math.min(height/2-r,yy)),cz=Math.max(-len/2+r,Math.min(len/2-r,zz));
   const dx=xx-cx,dy=yy-cy,dz=zz-cz,d=Math.hypot(dx,dy,dz)||1;
   const wave=(1.3*Math.sin(zz*.093+xx*.24)+.8*Math.sin(zz*.19+yy*.13))*Math.max(0,Math.min(1,(height/2-yy)/12));
   p.setXYZ(i,cx+dx/d*(r+wave),cy+dy/d*(r+wave),cz+dz/d*(r+wave));
  }
  geo.computeVertexNormals();
  const normals=geo.attributes.normal,sums=new Map(),keys=[];
  for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1000)).join(',');keys.push(key);const q=sums.get(key)||new T.Vector3();q.x+=normals.getX(i);q.y+=normals.getY(i);q.z+=normals.getZ(i);sums.set(key,q)}
  for(const q of sums.values())q.normalize();for(let i=0;i<p.count;i++){const q=sums.get(keys[i]);normals.setXYZ(i,q.x,q.y,q.z)}
  b.geo(geo,x,-height/2,z,hedge,{uv:70});geo.dispose();
 }
 // Frontage depth is explicit so every path reaches its own footpath. House
 // footprints and gardens are laid out in centimetres; no arbitrary scaling.
 function home(B,x,z,ry,n,front){
  const type=n%4,w=[540,530,500,560][type],d=houseDepth[type];
  const eave=[492,480,485,490][type],rise=[156,165,175,150][type],across=type!==2;
  const b=B.at(x,GY+1,z,ry),wall=type===1?paleBrick:masonry,tile=type===1||type===3?slate:roof;
  const face=d/2,doorX=type===2?0:w*.27,bayX=-w*.23,wallHalf=w/2;
  homes.push({x,z,ry,width:w,depth:d,eave,rise,type,front});
  // A few vertical rows confine the baked ground occlusion to the foot of
  // the wall. A single tall quad smeared it over the whole two-storey facade.
  b.geo(new T.BoxGeometry(w,eave,d,1,Math.ceil(eave/70),1),0,-eave/2,0,wall,{uv:100});
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
   const pipeZ=side<0?face+7:dz;
   b.cyl(dx,-eave/2,pipeZ,3,3,eave,7,metal);
   b.box(dx,-7,pipeZ+3,7,10,14,metal);
   if(side<0)for(const yy of [-90,-eave+25])b.box(dx,yy,face+3,10,3,9,metal);
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
  entry.box(0,-101,5,88,202,10,metal);
  for(const side of [-1,1])entry.box(side*40,-102,12,8,204,16,trim);
  entry.box(0,-202,12,88,8,16,trim);
  entry.box(0,-99,7,70,196,4,[door,metal,roof,leaf][n%4]);
  entry.box(0,-153,10,48,64,2,glassShade);entry.box(0,-59,10,48,50,2,door);
  for(const xx of [-14,14]){entry.box(xx,-59,11.4,23,52,1.2,metal);entry.box(xx,-59,12.2,19,46,1,door)}
  entry.box(0,-101,12,24,4,3,trim);entry.cyl(25,-91,12,2,2,3,7,trim,{rx:90});
  entry.box(0,-3,24,96,6,62,paving);
  // Solid coach lantern: dark backplate/cap surround a warm glass chamber.
  const lantern=entry.at(58,-162,8);
  lantern.box(0,0,0,7,20,2,metal);lantern.box(0,1,5,8,13,7,lampGlass);
  for(const xx of [-4.5,4.5])lantern.box(xx,1,5,1,15,8,metal);
  lantern.box(0,-7,5,12,3,11,metal);lantern.box(0,9,5,10,2,9,metal);
  if(n<17)porchPools.push({x,z,ry,doorX,face});

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
  for(const [lo,hi] of [[-plot,gate0-10],[gate1+10,plot]]){
   b.box((lo+hi)/2,-29,front,hi-lo,58,18,wall,{uv:100});b.box((lo+hi)/2,-60,front,hi-lo+4,4,24,paving);
  }
  for(const xx of [gate0-4,gate1+4]){b.box(xx,-39,front,16,78,24,wall,{uv:100});b.box(xx,-80,front,21,4,29,paving)}
  // Closed garden gate with individually solid bars; it does not imply access.
  b.box(doorX,-54,front,82,4,5,metal);b.box(doorX,-15,front,82,4,5,metal);
  for(let xx=doorX-36;xx<=doorX+36;xx+=12)b.box(xx,-35,front,2.5,50,3,metal);
  // The short threshold bridges the wall to the footpath; same height, disjoint.
  b.box(doorX,-1,front+10,82,2,20,paving);
  for(const side of [-1,1]){
   // Jack's drive boundary is built/collided in buildDrive, ending at its side gate.
   if(n===15&&side===-1)continue;
   gardenHedge(b,side*(plot-9),(face+front)/2,front-face+18,n%2?84:72);
   b.box(side*(plot-9),-3,(face+front)/2,30,6,front-face+18,earth);
  }
  const bedX=-w*.24,bedZ=face+105;
  b.box(bedX,-2,bedZ,160,4,66,earth);
  for(let i=0;i<3;i++)b.geo(K.canopy(i+n),bedX-52+i*52,-22-(i%2)*6,bedZ+(i-1)*5,i%2?leaf:hedge,{sx:29,sy:23+(i%2)*8,sz:27,ry:i*53+n*31});
  if(type===1||type===3){
   b.box(wallHalf-38,-33,face+55,34,62,38,door);b.box(wallHalf-38,-66,face+55,38,5,42,metal);
   for(const xx of [wallHalf-53,wallHalf-23])b.cyl(xx,-6,face+41,6,6,5,7,metal,{rz:90});
  }else{
   b.cyl(wallHalf-42,-12,face+83,19,14,24,8,earth);b.ball(wallHalf-42,-37,face+83,27,27,27,leaf,7);
  }
  // Fenced rear gardens complete the plots from upstairs and oblique views.
  // Panels have thickness and capped posts; no single-sided scenery cards.
  const rear=z===550?-1476-z:-face-320;
  b.box(0,-63,rear,648,126,8,fence,{uv:140});
  for(const side of [-1,1]){
   b.box(side*322,-63,(rear+face)/2,8,126,face-rear-8,fence,{uv:140});
   for(const zz of [rear,0,face-8]){
    b.box(side*322,-68,zz,12,136,12,fence);b.box(side*322,-138,zz,15,4,15,fence);
   }
  }
  if(n%3===0)tree(b,-240,-face-105,365+(n%2)*60,n,true);
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
 const endHomes=[];
 // At 60–80 m the closed house shell, pitched roof and recessed textured
 // elevations carry the silhouette. No tiny garden fittings or new batches.
 function endHome(B,x,z,ry,n){
  const type=n%3,w=540,d=480,eave=490,rise=160,b=B.at(x,GY+6,z,ry);
  endHomes.push({x,z,ry,width:w,depth:d});
  b.box(0,-eave/2,0,w,eave,d,masonry,{uv:100});
  for(const side of [-1,1])b.box(0,-eave/2,side*(d/2+.6),w-.4,eave-.4,1.2,side>0?facades[type]:rearFacade);
  pitched(b,w,d,eave,rise,n%2?slate:roof,masonry,true);
  b.box(0,-8,0,w+6,16,d+6,earth);
  b.box(140,-620,-70,42,150,42,masonry,{uv:100});b.box(140,-697,-70,50,6,50,paving);
 }
 function farHome(B,x,z,ry,n,front,ground=GY+1){
  const type=n%4,w=[540,530,500,560][type],d=houseDepth[type],eave=[492,480,485,490][type],rise=[156,165,175,150][type],across=type!==2;
  const b=B.at(x,ground,z,ry),wall=type===1?paleBrick:masonry,tile=type===1||type===3?slate:roof,face=d/2,doorX=type===2?0:w*.27;
  farHomes.push({x,z,ry,width:w,depth:d,eave,rise,type,front,continuation:ground!==GY+1});
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
  for(const side of [-1,1]){gardenHedge(b,side*321,(face+front)/2,front-face+18,72,50,true);b.box(side*321,-2,(face+front)/2,50,4,front-face+18,earth)}
  const rear=z===550?-1476-z:-face-320;b.box(0,-63,rear,648,126,8,fence,{uv:140});
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
  // The green's tree stands beside the road: it gets the full branch kit.
  tree(g,2230,560,430,2,true);
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
  for(const [x,z,i] of [[-3400,-300,0],[-1900,-330,1],[1300,-320,2],[3700,-300,3],[-3000,3550,4],[-1400,3600,5],[200,3520,6],[1700,3580,7],[3800,3540,8]]){const onPlot=[...plots.side,...farPlots.filter(p=>p[1]===550)].some(p=>Math.abs(x-p[0])<334&&z>=-1482&&z<=p[1]+p[4]+20);tree(b.at(0,GY+(onPlot?1:6),0),x,z,460+(i%3)*55,i);}
 });
 // (one batch for the far rows and the crossroads, so the extra village costs as few draw calls as possible)
 zone('far houses',b=>{for(const p of farPlots)farHome(b,...p);for(const p of crossPlots)farHome(b,...p,GY+6);
  for(const side of [-1,1]){
   for(const [i,z]of [1000,1680,2360,3040,3720,4400,5080].entries())endHome(b,side*7345,z,-side*90,i);
   // Banks of solid crowns overlap behind the bends and at the rear street
   // ends. They hide ground edges without putting a screen across the road.
   for(const [i,x,z]of [[0,5700,3450],[1,5850,3950],[2,5720,4680],[3,6450,5500],[4,5890,-1940],[5,6200,-2600]])tree(b.at(0,GY+6,0),side*x,z,540+i%3*40,i);
  }
  for(const [x,z,h,grade]of [[2250,3200,510,1],[3200,3500,560,6],[-2260,3190,490,1],[-650,-3410,520,1],[820,-3480,480,6],[2140,-3250,540,1],[-2650,-1450,460,1]])tree(b.at(0,GY+grade,0),x,z,h,2);
  cornerShop(b);green(b)});
 // (R248) a slight per-clump colour drift, yellow-green to blue-green, so neighbouring clumps don't read as one moulded lump
 {const r=K.rnd(4171),tint=new T.Color();for(const part of crownParts){const k=r()*2-1;part.tint=tint.clone().setRGB(1+.045*k,1+.012*(r()-.5),1-.06*k)}}
 if(crownParts.length){const crowns=K.foliageInstances(crownParts,treeLeaf,false,crownClump());crowns.name='street-layered-crowns';group.add(crowns)}
 const light=new T.Vector3(-.4,-.8,.4).normalize(),normal=new T.Vector3();
 group.traverse(o=>{
  o.userData.noPick=true;if(!o.geometry||o.isInstancedMesh)return;
  const n=o.geometry.attributes.normal,p=o.geometry.attributes.position,colours=new Float32Array(n.count*3),wall=[masonry,paleBrick,render].includes(o.material);
  for(let i=0;i<n.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),contact=1-.16*Math.max(0,Math.min(1,(y-(GY-70))/70)),shade=(.69+.29*Math.max(0,normal.fromBufferAttribute(n,i).dot(light)))*contact;
   // Near masonry has modest whole-house colour differences, in the existing
   // vertex bake: no extra materials, maps, lighting or animation work.
   const home=wall?homes.findIndex(h=>Math.abs(x-h.x)<=h.width/2+22&&Math.abs(z-h.z)<=h.depth/2+55):-1;
   const tint=home<0?[1,1,1]:[[1,.98,.95],[.94,.97,1],[1,.96,.91],[.97,1,.96]][home%4];
   for(let c=0;c<3;c++)colours[i*3+c]=shade*tint[c];
  }
  o.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));o.material.vertexColors=true;
 });

 // Painted sodium falloff, clipped to each receiving surface and batched once.
 // No blur, real lights, moving buffers or per-frame work; depth testing stays on.
 const nightInk=new T.Group();nightInk.name='night-light-pools';H.root.add(nightInk);
 const inkBatch=K.batch(),ink=K.into(inkBatch);
 const poolMap=K.tex('env.warm.pool',128,128,(g,w,h)=>{
  const im=g.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const radius=Math.hypot((x+.5-w/2)/(w/2),(y+.5-h/2)/(h/2));
   const t=Math.max(0,1-radius),a=t*t*(3-2*t),i=(y*w+x)*4;
   im.data[i]=255;im.data[i+1]=205;im.data[i+2]=134;im.data[i+3]=Math.round(a*255);
  }g.putImageData(im,0,0);
 },{clamp:true});
 const poolM=new T.MeshBasicMaterial({color:'#ffca88',map:poolMap,transparent:true,opacity:.42,blending:T.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 poolM.userData.lightDecal=true;
 function groundPool(x,z,w,d,z0,z1,top){
  const lo=Math.max(z-d/2,z0),hi=Math.min(z+d/2,z1);if(lo>=hi)return;
  const geo=new T.PlaneGeometry(w,hi-lo),uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setY(i,(lo+(hi-lo)*uv.getY(i)-(z-d/2))/d);
  ink.geo(geo,x,GY+top-.18,(lo+hi)/2,poolM,{rx:90});
 }
 const lampXs=[-4300,-2480,-1120,...streetLamps.map(l=>l.x),1600,3300,4700];
 for(const x of lampXs){
  const z=ST.farKerb-100;
  groundPool(x,z,860,860,...ST.road,0);
  groundPool(x,z,860,860,...ST.farPave,-.2);
  groundPool(x,z,860,860,ST.farKerb-5,ST.farKerb+5,-12);
 }
 // The family's near-side column, anchored to the same FRONT kerb as its solid model.
 for(const [z0,z1,top]of [[...ST.road,0],[...ST.pave,-.2],[ST.kerb-5,ST.kerb+5,-12]])groundPool(700,ST.kerb+110,850,900,z0,z1,top);
 // A porch casts a small wash on its wall and a pool over its actual threshold.
 function porchInk(x,z,ry,doorX,face){
  const b=ink.at(x,GY+1,z,ry);
  b.geo(new T.PlaneGeometry(110,150),doorX+58,-142,face+1.5,poolM);
  b.geo(new T.PlaneGeometry(94,120),doorX,-1.25,face+79,poolM,{rx:90});
 }
 for(const p of porchPools)porchInk(p.x,p.z,p.ry,p.doorX,p.face);
 // Our own lantern uses the same surface wash; keep it clear of the opening.
 const porchWall=new T.PlaneGeometry(46,150),porchUV=porchWall.attributes.uv;
 for(let i=0;i<porchUV.count;i++)porchUV.setX(i,.425+.575*porchUV.getX(i));
 ink.geo(porchWall,371,GY-163,703.18,poolM);
 ink.geo(new T.PlaneGeometry(70,44),300,GY-2.18,730,poolM,{rx:90});
 groundPool(320,755,130,150,752,830,0);
 inkBatch.build(nightInk);
 nightInk.traverse(o=>{o.userData.noPick=true;o.userData.lightDecal=true});

 // The horizon: a painted ring 95 m out that travels with the camera (like the sky), so whichever way you look past the
 // last houses there are low hedgerows, distant roof ridges and hills fading into the haze, never
 // the edge of the world. Depth-tested, so everything nearer stands in front of it; drawn once per phase change.
 const RING={r:9500,below:60,above:640,w:2048,h:256};
 const ringCanvas=document.createElement('canvas');ringCanvas.width=RING.w;ringCanvas.height=RING.h;
 const ringTex=new T.CanvasTexture(ringCanvas);ringTex.wrapS=T.RepeatWrapping;
 const backdrop=new T.Mesh(new T.CylinderGeometry(RING.r,RING.r,RING.below+RING.above,96,1,true),new T.MeshBasicMaterial({map:ringTex,side:T.BackSide,alphaTest:.5,fog:false}));
 backdrop.name='backdrop';backdrop.rotation.x=Math.PI;backdrop.position.y=GY-(RING.above-RING.below)/2;backdrop.frustumCulled=false;backdrop.userData.noPick=true;
 backdrop.onBeforeRender=(r,s,camera)=>{const e=camera.matrixWorld.elements;backdrop.position.x=e[12];backdrop.position.z=e[14];backdrop.updateMatrixWorld(true)};
 H.root.add(backdrop);
 function paintBackdrop(ph,horizon){
  const g=ringCanvas.getContext('2d'),im=g.createImageData(RING.w,RING.h),d=im.data,TAU=Math.PI*2;
  const night=ph==='night';
  const hill=new T.Color(night?'#222d3d':'#89978e').lerp(horizon,night?.45:.72);
  const trees=new T.Color(night?'#16212b':'#63735e').lerp(horizon,night?.35:.59);
  const roofs=new T.Color(night?'#222633':'#746d68').lerp(horizon,.63);
  for(let x=0;x<RING.w;x++){
   const a=x/RING.w*TAU;
   // Low, periodic silhouettes meet at the cylinder seam. No recognisable
   // buildings or flat ground band: every nearby street is real geometry.
   const hillTop=57+19*Math.sin(a*3+1.3)+12*Math.sin(a*7+.4)+5*Math.sin(a*13+2.1);
   const treeTop=26+7*Math.sin(a*41)+5*Math.sin(a*67+1)+3*Math.sin(a*113+2);
   const town=Math.sin(a*5+.7)>.5,p=(x%41)/41;
   const roofTop=town?33+12*(1-Math.abs(p-.5)*2):0;
   for(let y=0;y<RING.h;y++){
    const i=(y*RING.w+x)*4,cm=RING.above-y/(RING.h-1)*(RING.above+RING.below);
    if(cm>hillTop)continue;
    let c=cm<treeTop?trees:cm<roofTop?roofs:hill;
    // Ease the lowest portion into the actual sky horizon, removing the
    // formerly hard horizontal field/teal stripe at eye level.
    const fade=Math.max(0,Math.min(1,(15-cm)/65));
    d[i]=(c.r+(horizon.r-c.r)*fade)*255;d[i+1]=(c.g+(horizon.g-c.g)*fade)*255;d[i+2]=(c.b+(horizon.b-c.b)*fade)*255;d[i+3]=255;
   }
  }
  g.putImageData(im,0,0);ringTex.needsUpdate=true;
 }
 const faces=Array.from({length:6},()=>{const c=document.createElement('canvas');c.width=c.height=256;return c});
 const sky=new T.CubeTexture(faces);sky.minFilter=T.LinearFilter;sky.magFilter=T.LinearFilter;sky.generateMipmaps=false;H.scene.background=sky;
 const direction=(face,u,v)=>{const a=2*u-1,b=1-2*v;return new T.Vector3(...[[1,b,-a],[-1,b,a],[a,1,-b],[a,-1,b],[a,b,1],[-a,b,-1]][face]).normalize()};
 const sun=new T.Vector3(-.45,.58,.7).normalize(),moon=new T.Vector3(.6,.5,-.6).normalize();
 // A continuous volume sampled in direction space: rounded cloud masses,
 // identical across cubemap seams, instead of three conspicuous sine bands.
 const cloudField=Float32Array.from({length:4096},K.rnd(1999));
 function cloudNoise(x,y,z){
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),smooth=t=>t*t*(3-2*t),fx=smooth(x-ix),fy=smooth(y-iy),fz=smooth(z-iz);
  const at=(a,b,c)=>cloudField[((a&15)*16+(b&15))*16+(c&15)];
  let sum=0;for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)sum+=at(ix+a,iy+b,iz+c)*(a?fx:1-fx)*(b?fy:1-fy)*(c?fz:1-fz);
  return sum;
 }
 let last='',lastMinute=-1,nextUpdate=0;const phases=['night','dusk','dawn','day'];
 function phase(){const cl=document.getElementById('bootPower')?.classList;for(const p of phases)if(cl?.contains('rm-'+p))return p;const h=(window.OwnerTools?.now()||new Date()).getHours();return h<6||h>=20?'night':h<8?'dawn':h>=18?'dusk':'day'}
 function update(now=0){
  if(now&&now<nextUpdate)return false;nextUpdate=now+1000;
  const ph=phase(),minute=(window.OwnerTools?.now()||new Date()).getMinutes();if(ph===last&&minute===lastMinute)return false;lastMinute=minute;if(ph===last)return false;last=ph;
  const colours={day:['#477db1','#cedadf'],dusk:['#363a64','#d89774'],dawn:['#54577d','#ddb69a'],night:['#080f23','#26344b']}[ph],zenith=new T.Color(colours[0]),horizon=new T.Color(colours[1]),night=ph==='night';
  faces.forEach((c,face)=>{const g=c.getContext('2d'),im=g.createImageData(256,256),d=im.data;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const v=direction(face,(x+.5)/256,(y+.5)/256),h=Math.max(0,v.y),col=horizon.clone().lerp(zenith,Math.pow(h,.6));
    if(!night){const cloud=cloudNoise(v.x*6+2,v.y*8,v.z*6)+.35*cloudNoise(v.x*17,v.y*22+3,v.z*17);const alpha=Math.max(0,Math.min(.52,(cloud-.67)*2.2))*Math.max(0,Math.min(1,(h-.07)*5))*Math.max(.35,1-h);col.lerp(new T.Color(ph==='dusk'?'#dab6ad':ph==='dawn'?'#eed9c0':'#f1ecdf'),alpha);const glow=Math.pow(Math.max(0,v.dot(sun)),250);col.lerp(new T.Color('#fff0c7'),glow)}
    else{const dot=v.dot(moon),edge=Math.max(0,Math.min(1,(dot-.99914)/.00022));col.lerp(new T.Color('#e5e0cc'),edge*edge*(3-2*edge));const gx=Math.floor(x/8),gy=Math.floor(y/8),seed=Math.sin(gx*127.1+gy*311.7+face*74.7)*43758.5453,hash=seed-Math.floor(seed),dx=x%8-2-hash*3,dy=y%8-2-hash*2;if(h>.08&&hash>.945){const star=Math.exp(-(dx*dx+dy*dy)*1.6);col.lerp(new T.Color('#d5dded'),star*.8)}}
    const i=(y*256+x)*4;d[i]=col.r*255;d[i+1]=col.g*255;d[i+2]=col.b*255;d[i+3]=255;
   }g.putImageData(im,0,0);
  });sky.needsUpdate=true;
  paintBackdrop(ph,horizon);
  const tint=new T.Color(night?'#566378':ph==='day'?'#ffffff':'#c3a8a0');for(const{m,c}of materials)m.color.copy(c).multiply(tint);
  occupied.color.set(night?'#c8a36f':'#718b96');lampGlass.color.set(night?'#ffd093':'#d6cdb2');
  nightInk.visible=ph!=='day';poolM.opacity=night?.42:.18;
  H.dirty();return true;
 }
 update();H.ambient.add(update);window.HouseEnvironment={group,nightInk,sky,homes,farHomes,endHomes,backdrop,street:ST,streetLamps,update,get phase(){return last}};
})();
