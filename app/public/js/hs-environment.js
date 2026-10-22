/* Shared, non-walkable neighbourhood and translation-free skybox. Original art only. */
(function(){
 'use strict';
 const H=window.House,K=window.HouseKit,A=window.HouseArt;
 if(!H||!H.ok||!K||!A||window.HouseEnvironment)return;
 const T=H.T,GY=353,group=new T.Group();group.name='neighbourhood';H.root.add(group);
 const batch=K.batch(),B=K.into(batch),materials=[];
 const paint=(c)=>{const m=new T.MeshBasicMaterial({color:c});materials.push({m,c:new T.Color(c)});return m};
 const brick=K.tex('env.brick',256,128,(g,w,h)=>{g.fillStyle='#bcae98';g.fillRect(0,0,w,h);const r=K.rnd(812);for(let y=0;y<8;y++)for(let x=-1;x<9;x++){g.fillStyle=['#a66e52','#b97e5e','#9c6249','#bb8564'][(r()*4)|0];g.fillRect(x*32+(y%2)*16+1,y*16+1,30,14)}},{clamp:false});
 const masonry=paint('#ffffff');masonry.map=brick;
 const roof=paint('#554b48'),trim=paint('#e6dfcc'),glass=paint('#718b96'),door=paint('#334747'),road=paint('#4c4d4e'),grass=paint('#547044'),hedge=paint('#405f38'),paving=paint('#aaa79d');
 // One ground foundation for both outdoor rooms; their finished surfaces sit
 // above this. Nothing duplicates at the garden/drive ownership boundary.
 B.box(0,GY+3,400,11000,4,11000,grass);
 B.box(0,GY+1.5,1450,6500,2,500,road);
 for(const z of [1160,1740])B.box(0,GY+.4,z,6500,1.2,80,paving);
 const roofShape=new T.Shape();roofShape.moveTo(-252,-510);roofShape.lineTo(0,-690);roofShape.lineTo(252,-510);roofShape.lineTo(252,-501);roofShape.lineTo(0,-680);roofShape.lineTo(-252,-501);roofShape.closePath();
 const roofGeo=new T.ExtrudeGeometry(roofShape,{depth:490,bevelEnabled:false});
 const gable=new T.Shape();gable.moveTo(-240,-510);gable.lineTo(0,-681);gable.lineTo(240,-510);gable.closePath();
 const gableGeo=new T.ExtrudeGeometry(gable,{depth:460,bevelEnabled:false});
 const homes=[];
 function home(x,z,ry,n){
  const b=B.at(x,GY,z,ry);homes.push({x,z,ry});
  b.box(0,-255,0,480,510,460,masonry,{uv:140});b.geo(gableGeo,0,0,-230,masonry,{uv:140});b.geo(roofGeo,0,0,-245,roof);
  b.box(150,-642,-80,38,126,44,masonry,{uv:90});b.box(150,-707,-80,44,8,50,trim);
  for(const y of [-130,-372])for(const xx of [-128,110]){
   b.box(xx,y,231.5,92,112,3,trim);b.box(xx,y,233.5,80,100,1,glass);
   b.box(xx,y,234.5,3,100,1.2,trim);b.box(xx,y-16,234.5,80,3,1.2,trim);b.box(xx,y+58,234,100,5,12,trim);
  }
  for(const side of [-1,1]){b.box(side*241.5,-372,0,3,104,74,trim);b.box(side*243.5,-372,0,1,92,62,glass)}
  b.box(0,-100,232,70,200,4,trim);b.box(0,-98,235,60,190,2,door);b.box(0,-150,236.5,44,60,1,glass);b.cyl(21,-95,237.5,2,2,2,8,trim,{rx:90});
  b.box(0,-206,250,90,8,64,roof);b.box(0,-1,330,86,2,160,paving);
  b.box(0,-3,440,470,6,34,trim);for(const side of [-1,1])b.box(side*220,-28,350,30,50,160,hedge);
  // Small differences in front gardens, without brands or a repeated flat card.
  b.cyl(-160,-45,320,3,5,90,8,roof);for(let i=0;i<3;i++)b.ball(-160+(i-1)*15,-98-i%2*12,320,32,39,28,hedge,9);
  if(n%2)b.box(155,-36,280,28,72,30,door);
 }
 for(let i=0;i<7;i++)home(-1750+i*600,2100,180,i);
 for(let i=0;i<6;i++)home(-1700+i*650,-1300,0,i+7);
 home(-760,180,90,14);home(1050,180,-90,15);home(-760,800,90,16);home(1050,800,-90,17);
 batch.build(group);roofGeo.dispose();gableGeo.dispose();
 const light=new T.Vector3(-.4,-.8,.4).normalize();
 group.traverse(o=>{o.userData.noPick=true;if(!o.geometry)return;const n=o.geometry.attributes.normal,colours=[];for(let i=0;i<n.count;i++){const shade=.69+.29*Math.max(0,new T.Vector3().fromBufferAttribute(n,i).dot(light));colours.push(shade,shade,shade)}o.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));o.material.vertexColors=true;});

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
  H.dirty();
 }
 update();H.ambient.add(update);window.HouseEnvironment={group,sky,homes,update,get phase(){return last}};
})();
