/* Read actual paper props. No separate HTML reader or ownership changes. */
(function(){
 'use strict';
 const H=window.House,K=window.HouseKit,C=window.MagazineCat;
 if(!H?.ok||!K||!C||window.Magazines)return;
 const T=H.T,M=K.mat,images={},covers={},pages=new Map(),bindings=new Map();let reading=null;
 const aliases=Object.fromEntries(Object.entries(C.LEGACY_ALIASES).map(([id,issue])=>[issue,id]));
 const physicalId=id=>aliases[id]||'pmb.'+id;
 const ready=Promise.all(C.ISSUES.map(issue=>new Promise(resolve=>{
  const im=images[issue.id]=new Image();im.onload=()=>{const tx=covers[issue.id];if(tx){tx.userData.g.drawImage(im,0,0,384,512);tx.needsUpdate=true}H.dirty();resolve()};im.onerror=resolve;im.src='/art/magazines-v1/'+issue.art+'.webp';
 })));
 function cover(id){return covers[id]||(covers[id]=K.tex('reading:cover:'+id,384,512,(g,w,h)=>{g.fillStyle=C.byId[id].color;g.fillRect(0,0,w,h);if(images[id]?.naturalWidth)g.drawImage(images[id],0,0,w,h)},{clamp:true}))}
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
 function read(id,docId){
  const t=H.THINGS[id],doc=C.byId[docId]||(window.ReadingBooks||[]).find(b=>b.id===docId);
  if(!t||!doc||reading||H.mode!=='walk'||(H.held()&&H.held()!==id))return false;
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
  if(window.AccountGate?.allowed&&H.mode==='walk'&&!H.paused&&!document.querySelector('.hs-loading,#houseEntry')&&H.THINGS[saved.id]){read(saved.id,saved.docId);return}
  if(performance.now()-resumeStarted<60000)setTimeout(resume,150);
 })();
})();
