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
 const brick=K.tex('env.brick',256,128,(g,w,h)=>{g.fillStyle='#bcae98';g.fillRect(0,0,w,h);const r=K.rnd(812);for(let y=0;y<8;y++)for(let x=-1;x<9;x++){g.fillStyle=['#a66e52','#b97e5e','#9c6249','#bb8564'][(r()*4)|0];g.fillRect(x*32+(y%2)*16+1,y*16+1,30,14)}},{clamp:false});
 const masonry=paint('#ffffff');masonry.map=brick;
 const paleBrick=paint('#d7c3a4');paleBrick.map=brick;
 const occupied=paint('#718b96'),lampGlass=paint('#d6cdb2');
 const roof=paint('#554b48'),slate=paint('#495358'),trim=paint('#e6dfcc'),glass=paint('#718b96'),glassShade=paint('#3e5763'),door=paint('#334747'),road=paint('#4c4d4e'),grass=paint('#547044'),hedge=paint('#405f38'),leaf=paint('#657645'),paving=paint('#aaa79d'),earth=paint('#655543'),metal=paint('#383e3d');
 function zone(name,build){const batch=K.batch(),b=K.into(batch),g=new T.Group();g.name=name;build(b);batch.build(g);group.add(g)}
 // Closed foundations; the drive owns x=-600..1200, z=1100..1700.
 // Split the continuation at that seam rather than laying coplanar slabs over it.
 zone('street',b=>{
  b.box(0,GY+3,400,11000,4,11000,grass);
  const slab=(x0,x1,z,d,m,top,h)=>b.box((x0+x1)/2,GY+top+h/2,z,x1-x0,h,d,m);
  for(const [x0,x1] of [[-3250,-600],[1200,3250]]){
   slab(x0,x1,1450,500,road,0,3);slab(x0,x1,1150,100,paving,-.2,3);
   slab(x0,x1,1200,10,paving,-12,12);
   // Dashed centre line continues the drive's existing road marking.
   for(let x=Math.ceil((x0+35)/180)*180;x<x1-35;x+=180)b.box(x,GY-.3,1440,70,.3,3,trim);
  }
  slab(-3250,3250,1750,100,paving,-.2,3);slab(-3250,3250,1700,10,paving,-12,12);
  // A parallel street behind the gardens, wholly beyond the playable boundary.
  slab(-3250,3250,-940,500,road,0,3);
  for(const z of [-1240,-640])slab(-3250,3250,z,100,paving,-.2,3);
  for(const z of [-1190,-690])slab(-3250,3250,z,10,paving,-12,12);
  for(let x=-3150;x<3250;x+=180)b.box(x,GY-.3,-940,70,.3,3,trim);
  // Sparse drains, paving joints and period sodium lamp silhouettes.
  for(const z of [1150,1750,-1240,-640])for(let x=-3200;x<3250;x+=100){
   if(z===1150&&x>=-600&&x<=1200)continue;
   b.box(x,GY-.45,z,.65,.25,88,earth);
  }
  for(const x of [-2200,-1100,1500,2600]){
   b.box(x,GY-.5,1687,32,1,18,metal);
   for(let i=-2;i<=2;i++)b.box(x+i*5,GY-1.1,1687,2,.4,14,paving);
   const l=b.at(x,GY,1770);l.cyl(0,-230,0,4,7,460,8,metal);
   l.box(0,-458,-26,8,8,56,metal);l.box(0,-461,-52,20,12,42,metal);l.box(0,-454,-52,16,2,34,lampGlass);
  }
 });
 // Both extrusions are watertight volumes, including the underside and gable
 // ends. The eaves have real thickness; no double-sided roof cards.
 const roofShape=new T.Shape();roofShape.moveTo(-258,-511);roofShape.lineTo(0,-694);roofShape.lineTo(258,-511);roofShape.lineTo(258,-497);roofShape.lineTo(0,-680);roofShape.lineTo(-258,-497);roofShape.closePath();
 const roofGeo=new T.ExtrudeGeometry(roofShape,{depth:500,bevelEnabled:false});
 const gable=new T.Shape();gable.moveTo(-240,-510);gable.lineTo(0,-680);gable.lineTo(240,-510);gable.closePath();
 const gableGeo=new T.ExtrudeGeometry(gable,{depth:460,bevelEnabled:false});
 const homes=[];
 function windowBay(b,x,y,z,ry,w,h,n){
  const f=b.at(x,y,z,ry),lit=y>-200&&n%3===1;
  f.box(0,0,1,w,h,2,metal);
  f.box(0,-h*.23,2.7,w-10,h*.46-5,1.4,lit?occupied:glass);
  f.box(0,h*.23,2.7,w-10,h*.46-5,1.4,lit?occupied:glassShade);
  for(const side of [-1,1]){
   f.box(side*(w/2-2.5),0,5,5,h,6,trim);
   f.box(0,side*(h/2-2.5),5,w-10,5,6,trim);
   // Solid curtain folds sit behind the raised frame, inside the reveal.
   f.box(side*(w/2-12),0,3.9,12,h-10,1, n%3?trim:leaf);
  }
  f.box(0,0,5,4,h-10,6,trim);f.box(0,-h*.04,5,w-10,4,6,trim);
  f.box(0,h/2+3,5,w+12,6,18,paving);
 }
 function home(B,x,z,ry,n){
  const b=B.at(x,GY,z,ry),wall=n%3===1?paleBrick:masonry,tile=n%3===2?slate:roof;homes.push({x,z,ry});
  b.box(0,-255,0,480,510,460,wall,{uv:140});b.geo(gableGeo,0,0,-230,wall,{uv:140});b.geo(roofGeo,0,0,-250,tile);
  b.box(0,-12,0,484,24,464,earth); // grounded plinth, not a floating wall
  for(const side of [-1,1]){
   b.box(side*251,-503,0,14,18,500,trim);
   b.cyl(side*261,-503,0,4,4,510,8,metal,{rx:90});
   b.cyl(side*244,-250,side*214,3,3,500,7,metal);
   for(const zz of [-250,250]){
    // Bargeboards follow the two roof slopes, retaining capped box ends.
    b.box(side*128,-601.5,zz,314,7,8,trim,{rz:side*35.35});
   }
  }
  b.cyl(0,-693,0,7,7,510,8,tile,{rx:90});
  b.box(150,-642,-80,38,126,44,wall,{uv:90});b.box(150,-707,-80,46,8,52,paving);
  for(const xx of [140,160]){b.cyl(xx,-725,-80,6,8,28,8,earth);b.cyl(xx,-740,-80,8,8,4,8,metal)}
  for(const zz of [-230,230])for(const y of [-130,-372])for(const xx of [-128,110])windowBay(b,xx,y,zz,zz<0?180:0,92,112,n);
  for(const side of [-1,1])windowBay(b,side*240,-372,0,side*90,74,104,n+1);
  b.box(0,-100,232,76,200,4,trim);b.box(0,-98,236,64,192,4,n%2?door:metal);
  b.box(0,-150,238.8,44,60,1.6,glassShade);b.box(0,-61,239,45,50,2,door);
  b.box(0,-105,239.5,22,4,3,trim);b.cyl(23,-95,241,2,2,3,8,trim,{rx:90});
  b.box(0,-207,253,96,12,70,tile);b.box(0,-199,253,90,4,64,trim);
  b.box(0,-3,263,94,6,64,paving);
  // Open front gate and an uninterrupted path, with joints above the slab.
  b.box(0,-1,366,80,2,144,paving);
  for(const zz of [320,360,400])b.box(0,-2.15,zz,78,.3,.8,earth);
  for(const side of [-1,1]){
   b.box(side*142,-26,440,186,52,18,wall,{uv:140});b.box(side*142,-54,440,192,4,24,paving);
   b.box(side*51,-37,440,14,74,22,wall,{uv:140});b.box(side*51,-76,440,18,4,26,paving);
   b.box(side*229,-24,350,22,48,162,hedge);
   b.box(side*143,-2,350,166,4,150,n%3===0?paving:grass);
  }
  b.box(-140,-3,286,124,6,58,earth);
  for(let i=0;i<3;i++)b.ball(-180+i*38,-25,286,25,24+(i%2)*7,25,i%2?leaf:hedge,7);
  if(n%2){ // a recognisable closed wheelie bin with lid, handle and wheels
   b.box(158,-34,286,34,64,38,door);b.box(158,-68,286,38,5,42,metal);
   b.box(158,-64,264,24,5,5,metal);
   for(const xx of [143,173])b.cyl(xx,-6,272,6,6,5,8,metal,{rz:90});
  }else{
   b.cyl(158,-11,310,19,14,22,8,earth);b.ball(158,-36,310,28,27,28,leaf,7);
  }
 }
 zone('opposite houses',b=>{for(let i=0;i<7;i++)home(b,-1750+i*600,2240,180,i)});
 zone('rear houses',b=>{for(let i=0;i<6;i++)home(b,-1700+i*650,-1740,0,i+7)});
 zone('side houses',b=>{
  // The west gardens now stop at x=-410, clear of the drive's x=-340 edge.
  home(b,-850,180,90,14);home(b,1050,180,-90,15);home(b,-850,800,90,16);home(b,1050,800,-90,17);
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const x=side*(2450+(i%2)*390),z=[-2200,-1460,-40,1040,2120][i],h=450+(i%3)*75;
   b.cyl(x,GY-h*.41,z,10,16,h*.82,8,earth);
   for(let j=0;j<3;j++)b.ball(x+(j-1)*65,GY-h+Math.abs(j-1)*52,z+(j%2)*50,110,140,110,j%2?leaf:hedge,7);
  }
 });
 roofGeo.dispose();gableGeo.dispose();
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
