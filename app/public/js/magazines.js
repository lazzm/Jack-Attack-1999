/* Read actual paper props. No separate HTML reader or ownership changes. */
(function(){
 'use strict';
 const H=window.House,K=window.HouseKit,C=window.MagazineCat;
 if(!H?.ok||!K||!C||window.Magazines)return;
 const T=H.T,M=K.mat,images={},covers={},backs={},pages=new Map(),bindings=new Map();let reading=null;
 const aliases=Object.fromEntries(Object.entries(C.LEGACY_ALIASES).map(([id,issue])=>[issue,id]));
 const physicalId=id=>aliases[id]||'pmb.'+id;
 const ready=Promise.resolve(window.PrintArt?.ready).then(()=>{for(const issue of C.ISSUES){images[issue.id]=window.PrintArt?.image(issue.id);const tx=covers[issue.id];if(tx){drawCover(tx.userData.g,384,512,issue);tx.needsUpdate=true}if(backs[issue.id]){drawBack(backs[issue.id].userData.g,384,512,issue);backs[issue.id].needsUpdate=true}}for(const tx of pages.values())tx.userData.repaint?.();H.dirty()});
 function drawCover(g,w,h,issue){if(window.PrintArt?.magazine(g,issue,w,h))return;g.fillStyle=issue.color;g.fillRect(0,0,w,h);g.fillStyle='#fff1cf';let size=48;do{g.font='bold '+size+'px Impact';if(g.measureText('JACK ATTACK!').width<w-32)break;size--}while(size>24);g.textAlign='center';g.fillText('JACK ATTACK!',w/2,64);g.textAlign='left';g.font='bold 29px Arial';K.wrapText(g,issue.headline,22,180,w-44,36)}
 function cover(id){return covers[id]||(covers[id]=K.tex('reading:cover:'+id,384,512,(g,w,h)=>drawCover(g,w,h,C.byId[id]),{clamp:true}))}
 function drawBack(g,w,h,doc){
  g.fillStyle='#efe5c8';g.fillRect(0,0,w,h);g.fillStyle=doc.color;g.fillRect(0,0,w,88);g.fillStyle='#fff4d5';g.font='bold 42px Impact';g.textAlign='center';g.fillText('PIXEL POST',w/2,57);g.font='bold 16px Arial';g.fillText('GAMES BY MAIL • 1999',w/2,78);
  g.fillStyle='#292c27';g.font='bold 24px Georgia';g.fillText('YOUR NEXT BIG GAME',w/2,123);window.PrintArt?.paint(g,doc.id,106,142,172,229);
  g.font='bold 21px Georgia';let y=400;for(const line of lines(g,doc.headline,w-40).filter(Boolean)){g.fillText(line,w/2,y);y+=25}g.font='17px Arial';g.fillText('Browse the catalogue on JackNet.',w/2,469);g.font='bold 18px Courier New';g.fillText('www.pixelpost.jnet',w/2,497);g.textAlign='left';
 }
 function backCover(doc){return backs[doc.id]||(backs[doc.id]=K.tex('reading:back:'+doc.id,384,512,(g,w,h)=>drawBack(g,w,h,doc),{clamp:true}))}
 function lines(g,text,width){const out=[];for(const para of String(text).split(/\n\s*\n/)){let line='';for(const word of para.split(/\s+/)){const next=line?line+' '+word:word;if(line&&g.measureText(next).width>width){out.push(line);line=word}else line=next}if(line)out.push(line);out.push('')}return out}
 function pageTexture(doc,index){
  const compact=innerWidth<700||innerWidth/innerHeight<1.1,key=doc.id+':'+index+(C.byId[doc.id]&&compact?':narrow':'');if(pages.has(key))return pages.get(key);
  let layout;
  const draw=(g,w,h)=>{
   if(C.byId[doc.id]){layout=editorialPage(g,w,h,doc,index,compact);return}
   const p=doc.pages[index];g.fillStyle='#f2ead7';g.fillRect(0,0,w,h);g.fillStyle=doc.color;g.fillRect(0,0,w,24);
   g.fillStyle='#33372c';g.font='bold 22px Arial';g.fillText(doc.publication+(doc.publication==='JACK ATTACK!'?' • ISSUE '+doc.issue:''),40,66);
   g.font='bold 38px Georgia';const head=lines(g,p.title,w-80).filter(Boolean);let y=130;for(const line of head){g.fillText(line,40,y);y+=44}y+=24;
   if(window.PrintArt?.paint(g,doc.id,40,y,w-80,146)){y+=174}
   let size=29,body;do{g.font=size+'px Georgia';body=lines(g,window.Cast?Cast.t(p.body):p.body,w-80);if(y+body.length*size*1.25<h-100)break;size--}while(size>18);
   g.fillStyle='#272b25';for(const line of body){if(line)g.fillText(line,40,y);y+=size*1.25}
   layout={font:size,bottom:y,footer:h-80};
   g.fillStyle=doc.color;g.fillRect(40,h-72,w-80,2);g.font='20px Arial';g.fillText(String(index+1).padStart(2,'0'),40,h-37);
   let footer=20;do{g.font=footer+'px Arial';if(g.measureText(doc.title).width<w-130)break;footer--}while(footer>12);
   g.textAlign='right';g.fillText(doc.title,w-40,h-37);
  };
  const tx=K.tex('reading:page:'+key,768,1024,draw,{clamp:true});
  tx.userData.repaint=()=>{const g=tx.userData.g;g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,768,1024);draw(g,768,1024);g.restore();tx.userData.layout=layout;tx.needsUpdate=true};
  tx.userData.layout=layout;pages.set(key,tx);return tx;
 }
 function editorialPage(g,w,h,doc,index,compact){
  const p=doc.pages[index],sections=['FROM THE EDITOR','UNDER REVIEW','PLAYER’S WORKSHOP','YOUR LETTERS','ADVERTISING FEATURE','THE BACK-PAGE COMIC'],section=sections[index%6];
  const cream=index===4?'#f4dfaf':'#f5edda',ink='#252b29';g.fillStyle=cream;g.fillRect(0,0,w,h);
  g.fillStyle=doc.color;g.fillRect(0,0,w,66);g.fillStyle='#fff5d5';g.font='bold 32px Impact';g.fillText('JACK ATTACK!',36,44);g.font='bold 17px Arial';g.textAlign='right';g.fillText(section,w-36,42);g.textAlign='left';
  g.fillStyle=ink;let titleSize=39,head;do{g.font='bold '+titleSize+'px Georgia';head=lines(g,p.title.replace(/^[^:]+:\s*/,''),w-72).filter(Boolean);if(head.length<=2)break;titleSize--}while(titleSize>30);
  let y=116;for(const line of head){g.fillText(line,36,y);y+=titleSize+3}
  const top=y+6,hero=!compact&&index===4?224:180,art=['space','city','dungeon','space','robots','critters','space','city','robots','dungeon','critters','space'][(doc.month-1)%12];
  g.fillStyle='#242e34';g.fillRect(36,top,w-72,hero);
  const generated=window.PrintArt?.paint(g,index===2?'editorial.guide':index===3?'editorial.letters':index===5?'editorial.comic':doc.id,36,top,300,hero,index===5?'contain':'cover');
  if(generated){/* Original text-free editorial illustration; captions stay outside it. */}
  else if(index===3){
   // The letters desk: actual printed envelopes, stamp blocks and ruled paper.
   g.fillStyle='#e9ddbd';g.fillRect(60,top+22,252,116);g.strokeStyle='#9e8b67';g.lineWidth=2;g.strokeRect(60,top+22,252,116);g.beginPath();g.moveTo(60,top+22);g.lineTo(186,top+82);g.lineTo(312,top+22);g.stroke();g.fillStyle=doc.color;g.fillRect(268,top+34,28,34);
  }else if(index===2){
   g.strokeStyle='#9ab3a0';g.lineWidth=1;for(let x=48;x<326;x+=20){g.beginPath();g.moveTo(x,top+12);g.lineTo(x,top+hero-12);g.stroke()}for(let z=top+12;z<top+hero;z+=20){g.beginPath();g.moveTo(48,z);g.lineTo(326,z);g.stroke()}
   g.strokeStyle='#f2c354';g.lineWidth=7;g.beginPath();g.moveTo(70,top+120);g.lineTo(130,top+120);g.lineTo(130,top+60);g.lineTo(230,top+60);g.lineTo(230,top+114);g.lineTo(300,top+114);g.stroke();g.fillStyle='#fff2bf';for(const [x,z]of [[70,120],[130,60],[230,114],[300,114]])g.fillRect(x-5,top+z-5,10,10);
  }else if(!window.PrintArt?.paint(g,art,36,top,300,hero)){
   // Printed geometric illustration while the original artwork is decoding.
   g.fillStyle=doc.color;g.fillRect(36,top,300,hero);g.strokeStyle='#f0d69c';g.lineWidth=5;for(let n=0;n<4;n++)g.strokeRect(66+n*32,top+24+n*12,110,70);
  }
  g.fillStyle='#f8e9bc';g.font='bold 26px Arial';let yy=top+35;const caption=index===0?doc.headline:index===1?'THE PLAY TEST':index===2?'PENCIL. PAPER. PRACTICE.':index===3?'THE JACK ATTACK! POSTBAG':index===4?'PAPER POWER!':'SPACE KAT’S LUNAR LUNCH';
  for(const line of lines(g,caption,330).filter(Boolean)){g.fillText(line,358,yy);yy+=30}
  g.font='19px Georgia';const sub=index===0?doc.kicker:index===1?'Read the verdict. Try the challenge. Make up your own mind.':index===2?'Keep this guide beside the keyboard.':index===3?'Your questions, our very best excuses.':index===4?'The finest mail-order nonsense of 1999.':'A little illustrated nonsense before this month’s story.';
  for(const line of lines(g,sub,330).filter(Boolean)){g.fillText(line,358,yy+10);yy+=24}
  y=top+hero+34;g.fillStyle=ink;
  const columns=compact?1:2,column=compact?w-72:(w-96)/2,bottom=h-108;let font=compact?30:27,body,rows;
  do{g.font=font+'px Georgia';body=lines(g,p.body,column);while(body[body.length-1]==='')body.pop();rows=Math.floor((bottom-y)/(font*1.24));if(body.length<=rows*columns)break;font--}while(font>19);
  // Balance the columns so a final paragraph never disappears below the footer.
  const split=Math.ceil(body.length/columns);let used=y;
  for(let c=0;c<columns;c++){let cy=y;for(const line of body.slice(c*split,(c+1)*split)){if(line)g.fillText(line,36+c*(column+24),cy);cy+=font*1.24}used=Math.max(used,cy)}
  if(columns===2){g.strokeStyle='#b5a78a';g.lineWidth=1;g.beginPath();g.moveTo(w/2,y-20);g.lineTo(w/2,used-18);g.stroke()}
  g.fillStyle=doc.color;g.fillRect(36,h-75,w-72,4);g.font='bold 19px Arial';g.fillText(String(index+1).padStart(2,'0')+' / '+String(doc.pages.length).padStart(2,'0'),36,h-39);g.textAlign='right';g.fillText('JACK ATTACK! • ISSUE '+doc.issue+' • 1999',w-36,h-39);g.textAlign='left';
  return{font,bottom:used,footer:h-80,columns,section};
 }
 const bookmarks=()=>{try{const v=JSON.parse(localStorage.getItem('jhp_reading_pages')||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return {}}};
 // One physical reader for periodicals, paperbacks and the original mail-order art.
 function read(id,docId,resume){
  const t=H.THINGS[id],doc=C.byId[docId]||(window.ReadingBooks||[]).find(b=>b.id===docId)||(docId==='pm.catalogue'?catalogueDoc():null);
  if(!t||!doc||reading||!(H.mode==='walk'||H.mode==='focus'&&H.seated)||(H.held()&&H.held()!==id))return false;
  return readPaper(t,doc,resume);
 }
 function catalogueDoc(){
  const t=H.THINGS['pm.catalogue'];if(!t?.obj.userData.leaves)return null;
  t.obj.userData.closePages?.();t.obj.userData.ensure?.();
  const sheets=t.obj.userData.leaves.flatMap(l=>[l.front,l.back]);
  // Reuse every original printed face, including the order forms. No regenerated art.
  // The old paired-leaf model pads its back cover with a final order form.
  // Keep that form inside, with the actual red back cover closing the reader.
  return{id:'pm.catalogue',title:'The Pixel Post games catalogue',publication:'PIXEL POST',color:'#bd2724',pages:[...sheets.slice(1,-2),sheets[sheets.length-1]].map(mesh=>({mesh})),frontMesh:sheets[0],backMesh:sheets[sheets.length-2]};
 }
 function originalCover(t){
  let tx;t.obj.traverse(o=>{if(tx||!Array.isArray(o.material))return;tx=o.material[4]?.map||o.material[3]?.map});return tx;
 }
 function readPaper(t,doc,resume){
  const original=t.obj.children.slice(),model=new T.Group(),narrow=()=>innerWidth<700||innerWidth/innerHeight<1.1,single=narrow(),count=single?1:2;
  const discId=/^pmb\.pm\.mag\./.test(t.id)?'pmd.'+doc.id:null,hasPocket=!!discId;
  const first=hasPocket?2:1,last=first+Math.ceil(doc.pages.length/count);
  const front=C.byId[doc.id]?cover(doc.id):originalCover(t),rear=C.byId[doc.id]?backCover(doc):front;
  const ink=map=>M({c:'#fff',map,sp:'#000000',sh:1}),paper=M({c:'#ddd3bc',sp:'#000000',sh:1}),blank=ink(null);
  const texture=i=>i<0||i>=doc.pages.length?blank:doc.pages[i].mesh?.material||ink(pageTexture(doc,i));
  const frontMat=doc.frontMesh?.material||ink(front),backMat=doc.backMesh?.material||ink(rear);
  original.forEach(o=>t.obj.remove(o));t.obj.add(model);
  const closed=new T.Group();model.add(closed);
  K.into(closed).box(0,-14,0,21,28,.65,{f:frontMat,b:backMat,all:paper});
  K.into(closed).box(-10.53,-14,0,.1,28,.7,M(doc.color));
  const spread=new T.Group(),left=new T.Group(),right=new T.Group();
  spread.add(left,right); // Add after inspection measures the closed cover below.
  // Each half is a page block that curves down into the gutter at the spine (open paper never lies flat).
  const base=(parent,x)=>{
   const geo=new T.BoxGeometry(21,28,.4,18,1,1),pp=geo.attributes.position,uv=geo.attributes.uv,spine=x<0?10.5:-10.5;
   for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));
   for(let i=0;i<pp.count;i++){const d=Math.abs(pp.getX(i)-spine);pp.setZ(i,pp.getZ(i)-0.85*Math.exp(-d/2.1)+0.12*Math.min(1,d/21))}
   geo.computeVertexNormals();const mesh=new T.Mesh(geo,[paper,paper,paper,paper,blank,paper]);mesh.position.set(x,-14,0);parent.add(mesh);return mesh;
  };
  const leftMesh=base(left,-10.56),rightMesh=base(right,10.56);
  K.into(spread).cyl(0,-14,-.82,.24,.24,28,12,paper);
  const old={end:t.onInspectEnd,key:t.onInspectKey,pose:t.inspectPose};
  let slot=0,requested=0,flipping=false,controls,leaf=null,pocket=null,disc=null;
  if(resume?.view==='back')slot=last;
  else if(resume?.view==='inside'&&hasPocket)slot=1;
  else if(resume?.view==='pages'||(resume&&!resume.view)){const p=Number(resume.page??bookmarks()[doc.id]);slot=first+Math.floor(Math.max(0,Math.min(doc.pages.length-1,Number.isFinite(p)?p:0))/count)}
  requested=slot;
  const phase=s=>s===0?'front':s===last?'back':s<first?'inside':'pages';
  const page=s=>s===0?-1:s===last?doc.pages.length:s<first?-2:(s-first)*count;
  const state=reading={id:t.id,docId:doc.id,get phase(){return phase(slot)},get page(){return page(slot)},get flipping(){return flipping}};
  function layers(){t.front=null;H.layerFor(t)}
  function save(){try{localStorage.setItem('jhp_reading_active',JSON.stringify({id:t.id,docId:doc.id,view:phase(slot),page:page(slot)}));if(phase(slot)==='pages'){const saved=bookmarks();saved[doc.id]=page(slot);localStorage.setItem('jhp_reading_pages',JSON.stringify(saved))}}catch(e){}}
  function discPresent(){const d=H.THINGS[discId];return !!d&&d.st==='rest'&&!!d.at.hide&&window.PM?.where(doc.id)!=='D'}
  function status(){
   if(!controls)return;
   const ph=phase(slot),p=page(slot),prev=controls.querySelector('[data-turn="-1"]'),next=controls.querySelector('[data-turn="1"]');
   controls.querySelector('small').textContent=ph==='front'?'FRONT COVER':ph==='back'?'BACK COVER — CLOSED':ph==='inside'?'INSIDE COVER · '+(discPresent()?'COVER CD':'EMPTY CD POCKET'):'PAGES '+(p+1)+(count===2&&p+1<doc.pages.length?'–'+Math.min(p+count,doc.pages.length):'')+' / '+doc.pages.length;
   // Inputs can queue at most two leaves; opposite input cancels a queued turn.
   prev.disabled=requested===0;next.disabled=requested===last;
   prev.textContent=slot===1?'← Front cover':'← Previous';next.textContent=slot===0?'Open →':slot===last-1?'Back cover →':'Next →';
   const cd=controls.querySelector('[data-cover-disc]');if(cd){cd.hidden=ph!=='inside';cd.disabled=flipping||!discPresent()}
  }
  function surface(s,side){
   if(phase(s)==='inside')return pocketTexture(doc,side);
   return texture(page(s)+(side==='right'&&count===2?1:0));
  }
  function paint(){
   const ph=phase(slot);closed.visible=ph==='front'||ph==='back';closed.rotation.y=ph==='back'?Math.PI:0;
   spread.visible=!closed.visible;spread.position.x=single?-10.56:0;left.visible=!single;right.visible=true;
   if(spread.visible){leftMesh.material[4]=surface(slot,'left');rightMesh.material[4]=surface(slot,'right')}
   if(pocket)pocket.visible=ph==='inside';if(disc)disc.visible=discPresent();status();H.dirty();
  }
  function removeLeaf(){if(!leaf)return;leaf.geometry.dispose();model.remove(leaf);leaf=null}
  function makeLeaf(a,b){
   // A closed, thin volume with matching front/back and solid cut edges.
   const geo=new T.BoxGeometry(21,28,.1,20,1,1);geo.translate(10.5,-14,0);
   const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));
   const mesh=new T.Mesh(geo,[paper,paper,paper,paper,a,b]);mesh.userData.rest=geo.attributes.position.array.slice();model.add(mesh);layers();return mesh;
  }
  function bend(mesh,angle,progress,x,lift){
   const pos=mesh.geometry.attributes.position,rest=mesh.userData.rest,c=Math.cos(angle),s=Math.sin(angle),curl=Math.sin(Math.PI*progress)*1.1;
   for(let i=0;i<pos.count;i++){const u=rest[i*3],z=rest[i*3+2],arc=Math.sin(Math.PI*u/21)*curl;pos.setXYZ(i,c*u+s*arc+s*z,rest[i*3+1],-s*u+c*arc+c*z)}
   pos.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.position.set(x,0,lift);
  }
  function begin(delta){
   const before=slot,next=slot+delta;if(next<0||next>last)return false;
   const a=phase(before),b=phase(next),opening=a==='front'||b==='front',closing=a==='back'||b==='back';
   slot=next;flipping=true;save();
   closed.visible=false;spread.visible=true;left.visible=!single;right.visible=true;spread.position.x=single?-10.56:0;
   let face,reverse;
   if(opening){
    const interior=before===0?next:before;face=frontMat;reverse=surface(interior,single?'right':'left');
    rightMesh.material[4]=surface(interior,'right');left.visible=false;
   }else if(closing){
    const interior=before===last?next:before;face=surface(interior,'right');reverse=backMat;
    leftMesh.material[4]=surface(interior,'left');right.visible=single;
   }else{
    face=delta>0?surface(before,'right'):surface(next,'right');reverse=delta>0?surface(next,'left'):surface(before,'left');
    leftMesh.material[4]=surface(delta>0?before:next,'left');rightMesh.material[4]=surface(delta>0?next:before,'right');
   }
   leaf=makeLeaf(face,reverse);if(pocket){pocket.visible=opening&&(a==='inside'||b==='inside');if(disc)disc.visible=discPresent()}
   let elapsed=0;const duration=opening||closing?560:500;
   function frame(e){
    const angle=-Math.PI*(delta>0?e:1-e);
    let x=single?-10.5:0;
    if(!single&&opening){const offset=-10.56*(before===0?1-e:e);spread.position.x=offset;x=offset}
    if(!single&&closing){const offset=10.56*(before===last?1-e:e);spread.position.x=offset;x=offset}
    if(single&&closing){rightMesh.material[4]=surface(before===last?next:before,'right');x=-10.5+21*(before===last?1-e:e)}
    const lift=.32+(opening&&hasPocket?.32*(before===0?1-e:e):0);
    bend(leaf,angle,e,x,lift);H.dirty();
   }
   frame(0);status();
   // dt keeps a menu pause from skipping the entire turn on resumption.
   H.anims.set('reading.page',(now,dt)=>{
    if(reading!==state)return false;if(H.paused)return true;
    elapsed+=Math.min(50,Math.max(0,(dt??1/60)*1000));const k=Math.min(1,elapsed/duration),e=k*k*k*(k*(k*6-15)+10);frame(e);
    if(k<1)return true;removeLeaf();flipping=false;paint();
    if(requested!==slot){begin(Math.sign(requested-slot));return true}return false;
   });return true;
  }
  function turn(delta){requested=Math.max(0,Math.min(last,Math.max(slot-2,Math.min(slot+2,requested+delta))));if(!flipping&&requested!==slot)begin(Math.sign(requested-slot));status()}
  function resize(){if(reading!==state||narrow()===single)return;const saved={view:phase(slot),page:page(slot)};H.endInspect();read(t.id,doc.id,saved)}
  t.inspectPose={yaw:0,pitch:0,zoom:single?.72:1.18};
  t.onInspectKey=ev=>{if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'||ev.key.toLowerCase()==='f'){if(!ev.repeat)turn(ev.key==='ArrowLeft'?-1:1);return true}};
  t.onInspectEnd=()=>{
   removeEventListener('resize',resize);H.anims.delete('reading.page');removeLeaf();model.traverse(o=>o.geometry?.dispose());t.obj.remove(model);original.forEach(o=>t.obj.add(o));layers();
   t.onInspectKey=old.key;t.onInspectEnd=old.end;t.inspectPose=old.pose;reading=null;try{localStorage.removeItem('jhp_reading_active')}catch(e){}old.end?.();H.dirty();
  };
  if(!H.inspect(t.id)){t.onInspectEnd();return false}model.add(spread);
  if(hasPocket){
   pocket=new T.Group();right.add(pocket);pocket.position.set(10.56,-15,.26);
   K.into(pocket).box(0,0,0,12,12,.07,{f:M({c:'#eadfc9',sp:'#000000',sh:1}),all:paper});
   // A genuine ring with a centre hole, printed face, inner rim and outer edge.
   const shape=new T.Shape();shape.absarc(0,0,4.8,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,.65,0,Math.PI*2,true);shape.holes.push(hole);
   const geo=new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false,curveSegments:48});
   const physicalDisc=H.THINGS[discId]?.obj;physicalDisc?.userData.ensure?.();let label;
   physicalDisc?.traverse(o=>{if(o.userData.ok&&o.material?.map)label=o.material.map});
   label=label||K.tex('reading:disc:'+doc.id,256,256,(g,w,h)=>{g.fillStyle=doc.color;g.fillRect(0,0,w,h);g.fillStyle='#f8f2db';g.textAlign='center';g.font='bold 24px Arial';g.fillText('JACK ATTACK!',w/2,70);g.font='bold 17px Arial';g.fillText('COVER CD • 1999',w/2,96);g.font='15px Arial';g.fillText('ISSUE '+doc.issue,w/2,191);g.fillText('HOLD BY THE EDGES',w/2,216)},{clamp:true});
   // ExtrudeGeometry uses world XY UVs; remap to the label square.
   const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+4.8)/9.6,1-(pos.getY(i)+4.8)/9.6);
   disc=new T.Mesh(geo,[ink(label),M({c:'#bcc5ce',sh:25,sp:'#777777'})]);disc.position.z=.08;disc.name='reading-cover-disc';pocket.add(disc);
   for(const x of [-5.2,5.2])K.into(pocket).box(x,0,.22,.7,11,.08,M({c:'#dcc49c',sh:2}));
  }
  const panel=document.querySelector('.hs-inspection');if(panel){
   panel.querySelector('b').textContent=(C.byId[doc.id]?'JACK ATTACK! — ':'')+doc.title;
   panel.querySelector('span').innerHTML='Drag to inspect · <kbd>F</kbd> / <kbd>→</kbd> open / next · <kbd>←</kbd> previous · <kbd>Wheel</kbd> zoom · <kbd>Q</kbd> back';
   controls=document.createElement('span');controls.className='magazine-page-controls';for(const n of [-1,1]){const button=document.createElement('button');button.type='button';button.dataset.turn=n;button.addEventListener('click',()=>turn(n));controls.appendChild(button)}controls.appendChild(document.createElement('small'));
   if(hasPocket){const button=document.createElement('button');button.type='button';button.dataset.coverDisc='';button.textContent='Take inside-cover CD';button.addEventListener('click',()=>{if(flipping||phase(slot)!=='inside'||!discPresent())return;H.endInspect();window.PMGL?.takeDisc(doc.id)});controls.appendChild(button)}panel.appendChild(controls);
  }
  paint();layers();save();addEventListener('resize',resize);return true;
 }
 function pocketTexture(doc,side){
  const key='reading:pocket:'+doc.id+':'+side;
  return M({c:'#fff',sp:'#000000',sh:1,map:K.tex(key,768,1024,(g,w,h)=>{
   g.fillStyle='#eae0c7';g.fillRect(0,0,w,h);g.fillStyle=doc.color;g.fillRect(36,42,w-72,18);g.font='bold 34px Arial';g.fillText(side==='right'?'YOUR COVER CD':'JACK ATTACK! • INSIDE COVER',42,116);
   g.fillStyle='#303226';g.font='25px Georgia';let y=178;for(const line of lines(g,side==='right'?'A whole disc of games to explore. Click the button below to lift it from its pocket. Hold it by the edges.':'Open the next page for the editorial, reviews, guides, letters and comic. Keep this issue beside the family PC.',w-84)){g.fillText(line,42,y);y+=34}
   g.font='bold 25px Courier New';g.fillText(side==='right'?'CD POCKET — KEEP THIS ISSUE':'1999 • GAMES, GUIDES & GOOD IDEAS',42,930);
  },{clamp:true})});
 }
 function bind(t,doc){
  if(bindings.has(t.id))return;
  bindings.set(t.id,doc.id);t.use=()=>read(t.id,doc.id);t.useLabel='Read / turn pages';t.issueId=doc.id;
  // CD issues are upright volumes, unlike the flat loose magazines. Adapt the
  // existing reading-slot callbacks with their upright-book pose, without
  // changing their permanent IDs or the PC-media case/disc registry.
  if(/^pmb\.pm\.mag\./.test(t.id)){t.kind='reading.mag';t.obj.userData.readingUpright=true;readingShelf(t)}
  if(C.byId[doc.id]){
   t.label='JACK ATTACK! — '+doc.title;
   const tx=cover(doc.id);
   if(!t.obj.userData.readingUpright&&['reading.mag','mess.mag'].includes(t.kind))t.obj.traverse(o=>{if(Array.isArray(o.material)&&o.material[3]?.map){o.material=o.material.slice();for(const i of [2,3])o.material[i]=M({c:'#fff',map:tx,sp:'#000000',sh:1});if(t.kind==='mess.mag'&&!o.userData.readingBackUv){const geo=o.geometry,uv=geo.attributes.uv,back=geo.groups.find(g=>g.materialIndex===2),vertices=new Set();for(let i=back.start;i<back.start+back.count;i++)vertices.add(geo.index.getX(i));for(const i of vertices)uv.setXY(i,1-uv.getX(i),1-uv.getY(i));uv.needsUpdate=true;o.userData.readingBackUv=true}}});
   else{const repaint=()=>{if(reading?.id===t.id)return;t.obj.traverse(o=>{if(!Array.isArray(o.material))return;o.material=o.material.slice();for(const i of [4,5])if(o.material[i]?.map)o.material[i]=M({c:'#fff',map:tx,sp:'#000000',sh:1})});H.dirty()};t.obj.userData.cover=repaint;repaint();}
  }
 }
 const shelfAdapters=new Set();
 function upright(t){return t?.obj.userData.readingUpright?new Proxy(t,{get:(target,key)=>key==='kind'?'reading.book':Reflect.get(target,key)}):t}
 function readingShelf(t){
  for(let n=0;n<32;n++){
   const sn=H.SNAPS['reading.slot.'+n];if(!sn||shelfAdapters.has(sn))continue;
   const accepts=sn.accepts,begin=sn.onBegin;
   sn.accepts=(kind,item)=>accepts(item?.obj.userData.readingUpright?'reading.book':kind,upright(item));
   sn.onBegin=(item,pose)=>begin?.(upright(item),pose);shelfAdapters.add(sn);
  }
  let n;try{n=JSON.parse(localStorage.getItem('jhp_reading_slots')||'{}')[t.id]}catch(e){}
  const sn=H.SNAPS['reading.slot.'+n];if(!sn||!sn.accepts(t.kind,t))return;
  t.home={...sn.pose,snap:sn.id};
  if(t.st==='snap'&&t.snap===sn.id){for(const key of ['room','x','y','z','ry'])t.at[key]=sn.pose[key];t.rx=sn.pose.rx||0;H.place(t)}
 }
 function sync(){
  if(!H.ROOMS.bedroom?.built)return;
  for(const issue of C.ISSUES)for(const id of new Set([physicalId(issue.id),'pmb.'+issue.id]))if(H.THINGS[id])bind(H.THINGS[id],issue);
  for(const book of window.ReadingBooks||[])if(H.THINGS[book.id])bind(H.THINGS[book.id],book);
  for(const [id,issue]of [['ch.m.mag1','pm.mag.08'],['ch.m.mag2','pm.mag.09']])if(H.THINGS[id])bind(H.THINGS[id],C.byId[issue]);
  for(const t of Object.values(H.THINGS))if(t.obj.userData.readingUpright)readingShelf(t);
  const catalogue=H.THINGS['pm.catalogue'];if(catalogue&&!bindings.has(catalogue.id)){bindings.set(catalogue.id,'pm.catalogue');catalogue.use=()=>read(catalogue.id,'pm.catalogue');catalogue.useLabel='Read / turn pages'}
 }
 function makePaper(id,home,texture,thickness=1){
  if(H.THINGS[id])return H.THINGS[id];const doc=(window.ReadingBooks||[]).find(b=>b.id===id);if(!doc)return null;
  const obj=new T.Group(),B=K.into(obj);B.box(0,-thickness/2,0,21,thickness,28,{t:M({c:'#fff',map:texture,sp:'#000000',sh:2}),all:M('#e8dfc8')});B.shadow(0,0,0,23,30,.3,{sq:true});
  const t=H.thing(id,{obj,home,kind:'reading.mag',label:doc.title,holdD:40,useLabel:'Read / turn pages',use:()=>read(id,id)});H.restoreThing(t);bind(t,doc);return t;
 }
 H.on('built',()=>setTimeout(sync,0));window.PM?.on('change',()=>setTimeout(sync,0));
 window.Magazines={ready,images,cover,pageTexture,read,sync,makePaper,physicalId,bindings,get reading(){return reading}};sync();
 const resumeStarted=performance.now();(function resume(){
  let saved;try{saved=JSON.parse(localStorage.getItem('jhp_reading_active')||'null');if(sessionStorage.getItem('jhp_login_seat')==='1'){localStorage.removeItem('jhp_reading_active');return}}catch(e){return}
  if(!saved||reading)return;
  if(window.AccountGate?.allowed&&H.mode==='walk'&&!H.paused&&!document.querySelector('.hs-loading,#houseEntry')&&H.THINGS[saved.id]){read(saved.id,saved.docId,saved);return}
  if(performance.now()-resumeStarted<60000)setTimeout(resume,150);
 })();
})();
