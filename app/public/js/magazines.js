/* Read actual paper props. No separate HTML reader or ownership changes. */
(function(){
 'use strict';
 const H=window.House,K=window.HouseKit,C=window.MagazineCat;
 if(!H?.ok||!K||!C||window.Magazines)return;
 const T=H.T,M=K.mat,images={},covers={},backs={},pages=new Map(),bindings=new Map();let reading=null;
 const aliases=Object.fromEntries(Object.entries(C.LEGACY_ALIASES).map(([id,issue])=>[issue,id]));
 const physicalId=id=>aliases[id]||'pmb.'+id;
 const ready=Promise.all(C.ISSUES.map(issue=>new Promise(resolve=>{
  const im=images[issue.id]=new Image();im.onload=()=>{const tx=covers[issue.id];if(tx){tx.userData.g.drawImage(im,0,0,384,512);tx.needsUpdate=true}if(backs[issue.id]){drawBack(backs[issue.id].userData.g,384,512,issue);backs[issue.id].needsUpdate=true}H.dirty();resolve()};im.onerror=resolve;im.src='/art/magazines-v1/'+issue.art+'.webp';
 })));
 function cover(id){return covers[id]||(covers[id]=K.tex('reading:cover:'+id,384,512,(g,w,h)=>{g.fillStyle=C.byId[id].color;g.fillRect(0,0,w,h);if(images[id]?.naturalWidth)g.drawImage(images[id],0,0,w,h)},{clamp:true}))}
 function drawBack(g,w,h,doc){
  g.fillStyle='#efe5c8';g.fillRect(0,0,w,h);g.fillStyle=doc.color;g.fillRect(0,0,w,88);g.fillStyle='#fff4d5';g.font='bold 42px Impact';g.textAlign='center';g.fillText('PIXEL POST',w/2,57);g.font='bold 16px Arial';g.fillText('GAMES BY MAIL • 1999',w/2,78);
  g.fillStyle='#292c27';g.font='bold 24px Georgia';g.fillText('YOUR NEXT BIG GAME',w/2,123);if(images[doc.id]?.naturalWidth)g.drawImage(images[doc.id],106,142,172,229);
  g.font='bold 21px Georgia';let y=400;for(const line of lines(g,doc.headline,w-40).filter(Boolean)){g.fillText(line,w/2,y);y+=25}g.font='17px Arial';g.fillText('Browse the catalogue on JackNet.',w/2,469);g.font='bold 18px Courier New';g.fillText('www.pixelpost.jnet',w/2,497);g.textAlign='left';
 }
 function backCover(doc){return backs[doc.id]||(backs[doc.id]=K.tex('reading:back:'+doc.id,384,512,(g,w,h)=>drawBack(g,w,h,doc),{clamp:true}))}
 function lines(g,text,width){const out=[];for(const para of String(text).split(/\n\s*\n/)){let line='';for(const word of para.split(/\s+/)){const next=line?line+' '+word:word;if(line&&g.measureText(next).width>width){out.push(line);line=word}else line=next}if(line)out.push(line);out.push('')}return out}
 function pageTexture(doc,index){
  const key=doc.id+':'+index;if(pages.has(key))return pages.get(key);
  let layout;
  const tx=K.tex('reading:page:'+key,768,1024,(g,w,h)=>{
   const p=doc.pages[index];g.fillStyle='#f2ead7';g.fillRect(0,0,w,h);g.fillStyle=doc.color;g.fillRect(0,0,w,24);
   g.fillStyle='#33372c';g.font='bold 22px Arial';g.fillText(doc.publication+(doc.publication==='JACK ATTACK!'?' • ISSUE '+doc.issue:''),40,66);
   g.font='bold 38px Georgia';const head=lines(g,p.title,w-80).filter(Boolean);let y=130;for(const line of head){g.fillText(line,40,y);y+=44}y+=24;
   let size=29,body;do{g.font=size+'px Georgia';body=lines(g,p.body,w-80);if(y+body.length*size*1.25<h-100)break;size--}while(size>18);
   g.fillStyle='#272b25';for(const line of body){if(line)g.fillText(line,40,y);y+=size*1.25}
   layout={font:size,bottom:y,footer:h-80};
   g.fillStyle=doc.color;g.fillRect(40,h-72,w-80,2);g.font='20px Arial';g.fillText(String(index+1).padStart(2,'0'),40,h-37);
   let footer=20;do{g.font=footer+'px Arial';if(g.measureText(doc.title).width<w-130)break;footer--}while(footer>12);
   g.textAlign='right';g.fillText(doc.title,w-40,h-37);
  },{clamp:true});tx.userData.layout=layout;pages.set(key,tx);return tx;
 }
 const bookmarks=()=>{try{const v=JSON.parse(localStorage.getItem('jhp_reading_pages')||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return {}}};
 function read(id,docId,resume){
  const t=H.THINGS[id],doc=C.byId[docId]||(window.ReadingBooks||[]).find(b=>b.id===docId);
  if(!t||!doc||reading||H.mode!=='walk'||(H.held()&&H.held()!==id))return false;
  if(C.byId[docId])return readMagazine(t,doc,resume);
  const closed=t.obj.children.slice(),spread=new T.Group(),single=innerWidth<700,count=single?1:2;
  closed.forEach(child=>t.obj.remove(child));t.obj.add(spread);
  const paper=M({c:'#ded5c2',sp:'#000000',sh:1});
  const meshes=Array.from({length:count},(_,i)=>{const group=new T.Group();group.position.set(single?0:(i?10.65:-10.65),-14,0);group.rotation.y=single?0:(i?-.025:.025);spread.add(group);return K.into(group).box(0,0,0,21,28,.4,{f:M({c:'#fff',sh:1}),all:paper})});
  if(!single)K.into(spread).cyl(0,-14,-.16,.18,.18,28,12,paper);
  const savedPage=Number(bookmarks()[doc.id]);
  let page=Math.max(0,Math.min(doc.pages.length-count,Number.isFinite(savedPage)?Math.floor(savedPage):0)),flipping=false,controls;
  page=Math.floor(page/count)*count;
  const old={end:t.onInspectEnd,key:t.onInspectKey,pose:t.inspectPose};
  const state=reading={id,docId,get page(){return page},get flipping(){return flipping}};
  function paint(){meshes.forEach((mesh,i)=>{mesh.material=mesh.material.slice();mesh.material[4]=M({c:'#fff',map:pageTexture(doc,page+i),sp:'#000000',sh:1})});if(controls){controls.querySelector('small').textContent='PAGE '+(page+1)+(count===2?'–'+(page+2):'')+' / '+doc.pages.length;controls.querySelector('[data-turn="-1"]').disabled=page===0||flipping;controls.querySelector('[data-turn="1"]').disabled=page+count>=doc.pages.length||flipping}H.dirty()}
  function remember(){const saved=bookmarks();saved[doc.id]=page;try{localStorage.setItem('jhp_reading_pages',JSON.stringify(saved))}catch(e){}}
  function turn(delta){
   if(flipping)return;const next=Math.max(0,Math.min(doc.pages.length-count,page+delta*count));if(next===page)return;
   flipping=true;const oldPage=page;page=next;remember();paint();
   const pivot=new T.Group();pivot.position.set(single?-10.5:0,-14,.3);spread.add(pivot);
   K.into(pivot).box(10.5,0,0,21,28,.12,{f:M({c:'#fff',map:pageTexture(doc,delta>0?oldPage+count-1:page),sp:'#000000',sh:1}),b:M({c:'#fff',map:pageTexture(doc,page),sp:'#000000',sh:1}),all:paper});
   pivot.traverse(o=>o.layers.set(1));
   const start=performance.now();H.anims.set('reading.page',now=>{if(reading!==state)return false;const k=Math.min(1,(now-start)/340);pivot.rotation.y=-Math.PI*(delta>0?k:1-k);H.dirty();if(k<1)return true;pivot.traverse(o=>o.geometry?.dispose());spread.remove(pivot);flipping=false;paint();return false});
  }
  t.inspectPose={yaw:0,pitch:0,zoom:single?.62:.82};
  t.onInspectKey=ev=>{if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){if(!ev.repeat)turn(ev.key==='ArrowRight'?1:-1);return true}};
  t.onInspectEnd=()=>{H.anims.delete('reading.page');spread.traverse(o=>o.geometry?.dispose());t.obj.remove(spread);closed.forEach(child=>t.obj.add(child));t.front=null;H.layerFor(t);t.onInspectKey=old.key;t.onInspectEnd=old.end;t.inspectPose=old.pose;reading=null;try{localStorage.removeItem('jhp_reading_active')}catch(e){}old.end?.();H.dirty()};
  paint();if(!H.inspect(id)){t.onInspectEnd();return false}
  t.front=null;H.layerFor(t);
  try{localStorage.setItem('jhp_reading_active',JSON.stringify({id,docId}))}catch(e){}
  const panel=document.querySelector('.hs-inspection');if(panel){panel.querySelector('span').innerHTML='Drag to rotate · <kbd>←</kbd> / <kbd>→</kbd> turn pages · <kbd>Wheel</kbd> zoom · <kbd>Q</kbd> close';controls=document.createElement('span');controls.className='magazine-page-controls';for(const [label,n]of [['← Previous',-1],['Next →',1]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.turn=n;b.addEventListener('click',()=>turn(n));controls.appendChild(b)}controls.appendChild(document.createElement('small'));if(/^pmb\.pm\.mag\./.test(id)){const cd=document.createElement('button');cd.type='button';cd.textContent='Take cover CD';cd.addEventListener('click',()=>{H.endInspect();window.PMGL?.takeDisc(doc.id)});controls.appendChild(cd)}panel.appendChild(controls);paint()}
  return true;
 }
 // Cover -> interior spreads -> closed back. All stages belong to this prop.
 function readMagazine(t,doc,resume){
  const original=t.obj.children.slice(),model=new T.Group(),B=K.into(model),narrow=()=>innerWidth<700||innerWidth/innerHeight<1.1,single=narrow(),count=single?1:2,last=Math.ceil(doc.pages.length/count)+1;
  original.forEach(o=>t.obj.remove(o));t.obj.add(model);
  const paper=M({c:'#dfd6c3',sp:'#000000',sh:1}),front=cover(doc.id),rear=backCover(doc);
  const closed=new T.Group();model.add(closed);
  K.into(closed).box(0,-14,0,21,28,.8,{f:M({c:'#fff',map:front,sp:'#000000',sh:2}),b:M({c:'#fff',map:rear,sp:'#000000',sh:2}),all:paper});
  K.into(closed).box(-10.54,-14,0,.08,28,.86,M(doc.color));
  const old={end:t.onInspectEnd,key:t.onInspectKey,pose:t.inspectPose};
  let slot=0,flipping=false,controls,spread,meshes=[];
  if(resume?.view==='back')slot=last;
  else if(resume?.view==='pages'||(resume&&!resume.view)){const p=Number(resume.page??bookmarks()[doc.id]);slot=1+Math.floor(Math.max(0,Math.min(doc.pages.length-1,Number.isFinite(p)?p:0))/count)}
  const phase=()=>slot===0?'front':slot===last?'back':'pages';
  const page=()=>slot===0?-1:slot===last?doc.pages.length:(slot-1)*count;
  const state=reading={id:t.id,docId:doc.id,get phase(){return phase()},get page(){return page()},get flipping(){return flipping}};
  function resize(){if(reading!==state||narrow()===single)return;const saved={view:phase(),page:page()};H.endInspect();read(t.id,doc.id,saved)}
  function save(){try{localStorage.setItem('jhp_reading_active',JSON.stringify({id:t.id,docId:doc.id,view:phase(),page:page()}));if(phase()==='pages'){const saved=bookmarks();saved[doc.id]=page();localStorage.setItem('jhp_reading_pages',JSON.stringify(saved))}}catch(e){}}
  function layers(){t.front=null;H.layerFor(t)}
  function paint(){
   closed.visible=phase()!=='pages';closed.rotation.y=phase()==='back'?Math.PI:0;
   if(spread){spread.position.x=0;meshes.forEach(mesh=>mesh.parent.visible=true);spread.visible=phase()==='pages';if(spread.visible)meshes.forEach((mesh,i)=>{mesh.material=mesh.material.slice();mesh.material[4]=M({c:'#fff',map:pageTexture(doc,Math.min(doc.pages.length-1,page()+i)),sp:'#000000',sh:1})})}
   if(controls){const prev=controls.querySelector('[data-turn="-1"]'),next=controls.querySelector('[data-turn="1"]');controls.querySelector('small').textContent=phase()==='front'?'FRONT COVER':phase()==='back'?'BACK COVER — CLOSED':'PAGES '+(page()+1)+(count===2?'–'+Math.min(page()+count,doc.pages.length):'')+' / '+doc.pages.length;prev.disabled=flipping||slot===0;next.disabled=flipping||slot===last;prev.textContent=slot===1?'← Front cover':'← Previous';next.textContent=slot===0?'Open →':slot===last-1?'Back cover →':'Next →'}
   layers();H.dirty();
  }
  function turn(delta){
   if(flipping)return;const next=Math.max(0,Math.min(last,slot+delta));if(next===slot)return;
   const before={slot,phase:phase(),page:page()};slot=next;flipping=true;save();paint();
   const from=before.phase==='front'?front:before.phase==='back'?rear:pageTexture(doc,Math.min(doc.pages.length-1,before.page+(delta>0?count-1:0)));
   const to=phase()==='back'?rear:phase()==='front'?front:pageTexture(doc,page());
   const pivot=new T.Group();model.add(pivot);const leaf=K.into(pivot).box(10.5,-14,.55,21,28,.12,{f:M({c:'#fff',map:delta>0?from:to,sp:'#000000',sh:1}),b:M({c:'#fff',map:delta>0?to:from,sp:'#000000',sh:1}),all:paper});
   const start=performance.now();pivot.traverse(o=>o.layers.set(1));
   H.anims.set('reading.page',now=>{
    if(reading!==state)return false;const k=Math.min(1,(now-start)/440),e=k*k*(3-2*k);
    pivot.position.x=single?-10.5:before.phase==='front'?-10.5*(1-e):before.phase==='back'?10.5*(1-e):phase()==='back'?10.5*e:0;
    if(!single&&before.phase==='front'){spread.position.x=-10.65*(1-e);meshes[0].parent.visible=e>.5}
    if(!single&&before.phase==='back'){spread.position.x=10.65*(1-e);meshes[1].parent.visible=e>.5}
    if(phase()==='back'){closed.visible=false;spread.visible=true;if(!single)spread.position.x=10.65*e}
    pivot.rotation.y=-Math.PI*(delta>0?e:1-e);H.dirty();
    if(k<1)return true;leaf.geometry.dispose();model.remove(pivot);flipping=false;paint();return false;
   });
  }
  t.inspectPose={yaw:0,pitch:0,zoom:single?.62:1.18};
  t.onInspectKey=ev=>{if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'||ev.key.toLowerCase()==='f'){if(!ev.repeat)turn(ev.key==='ArrowLeft'?-1:1);return true}};
  t.onInspectEnd=()=>{removeEventListener('resize',resize);H.anims.delete('reading.page');model.traverse(o=>o.geometry?.dispose());t.obj.remove(model);original.forEach(o=>t.obj.add(o));layers();t.onInspectKey=old.key;t.onInspectEnd=old.end;t.inspectPose=old.pose;reading=null;try{localStorage.removeItem('jhp_reading_active')}catch(e){}old.end?.();H.dirty()};
  // Frame the closed cover first. Opening adds width, not height, so the
  // camera stays still instead of lurching between cover and spread bounds.
  if(!H.inspect(t.id)){t.onInspectEnd();return false}
  spread=new T.Group();model.add(spread);
  meshes=Array.from({length:count},(_,i)=>{const group=new T.Group();group.position.set(single?0:(i?10.65:-10.65),-14,0);group.rotation.y=single?0:(i?-.025:.025);spread.add(group);return K.into(group).box(0,0,0,21,28,.4,{f:M('#fff'),b:M({c:'#fff',map:i?rear:front,sp:'#000000',sh:1}),all:paper})});
  if(!single)K.into(spread).cyl(0,-14,-.2,.17,.17,28,12,paper);
  const panel=document.querySelector('.hs-inspection');if(panel){panel.querySelector('b').textContent='JACK ATTACK! — '+doc.title;panel.querySelector('span').innerHTML='Drag to inspect · <kbd>F</kbd> / <kbd>→</kbd> open / next · <kbd>←</kbd> previous · <kbd>Wheel</kbd> zoom · <kbd>Q</kbd> back';controls=document.createElement('span');controls.className='magazine-page-controls';for(const n of [-1,1]){const b=document.createElement('button');b.type='button';b.dataset.turn=n;b.addEventListener('click',()=>turn(n));controls.appendChild(b)}controls.appendChild(document.createElement('small'));if(/^pmb\.pm\.mag\./.test(t.id)){const cd=document.createElement('button');cd.type='button';cd.textContent='Take cover CD';cd.addEventListener('click',()=>{H.endInspect();window.PMGL?.takeDisc(doc.id)});controls.appendChild(cd)}panel.appendChild(controls)}
  paint();save();addEventListener('resize',resize);return true;
 }
 function bind(t,doc){
  if(bindings.has(t.id))return;
  bindings.set(t.id,doc.id);t.use=()=>read(t.id,doc.id);t.useLabel='Read / turn pages';t.issueId=doc.id;
  if(C.byId[doc.id]){
   t.label='JACK ATTACK! — '+doc.title;
   const tx=cover(doc.id);
   if(['reading.mag','mess.mag'].includes(t.kind))t.obj.traverse(o=>{if(Array.isArray(o.material)&&o.material[3]?.map){o.material=o.material.slice();for(const i of [2,3])o.material[i]=M({c:'#fff',map:tx,sp:'#000000',sh:1});if(t.kind==='mess.mag'&&!o.userData.readingBackUv){const geo=o.geometry,uv=geo.attributes.uv,back=geo.groups.find(g=>g.materialIndex===2),vertices=new Set();for(let i=back.start;i<back.start+back.count;i++)vertices.add(geo.index.getX(i));for(const i of vertices)uv.setXY(i,1-uv.getX(i),1-uv.getY(i));uv.needsUpdate=true;o.userData.readingBackUv=true}}});
   else{const repaint=()=>{t.obj.traverse(o=>{if(!Array.isArray(o.material))return;o.material=o.material.slice();for(const i of [4,5])if(o.material[i]?.map)o.material[i]=M({c:'#fff',map:tx,sp:'#000000',sh:1})});H.dirty()};t.obj.userData.cover=repaint;repaint();}
  }
 }
 function sync(){
  if(!H.ROOMS.bedroom?.built)return;
  for(const issue of C.ISSUES)for(const id of new Set([physicalId(issue.id),'pmb.'+issue.id]))if(H.THINGS[id])bind(H.THINGS[id],issue);
  for(const book of window.ReadingBooks||[])if(H.THINGS[book.id])bind(H.THINGS[book.id],book);
  for(const [id,issue]of [['ch.m.mag1','pm.mag.08'],['ch.m.mag2','pm.mag.09']])if(H.THINGS[id])bind(H.THINGS[id],C.byId[issue]);
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
