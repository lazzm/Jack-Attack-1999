/* Original generated illustrations. Titles and personal labels stay native.
 * One decoded bitmap per URL; SVG consumers embed it (nested external images
 * cannot load in SVG image documents). Failed files keep procedural fallbacks. */
(function(){
 'use strict';
 const legacy=window.PrintArtData||{},files={};
 const add=(folder,entries)=>{for(const[id,file]of Object.entries(entries))files[id]='/art/'+folder+'/'+file+'.webp'};
 add('print-v2',Object.fromEntries(Object.keys(legacy).map(id=>[id,id])));
 add('box-v1',{'n64.kart':'kart','n64.range':'spy','ps.run':'wombat'});
 add('box-v2',{'n64.hop':'hop','ps.fight':'tekno','gb.blocks':'blocks','md.zip':'zip','md.rage':'rage','dc.taxi':'taxi','dc.dash':'zip-adventure','dc.duel':'soul','gb.grab':'grab','n64.party':'party','ps.sneak':'gerbil','md.teeny':'teeny','sn.zero':'formula','sn.zeldo':'zeldo','sn.plumb':'plumbo','dc.toy':'toy','sn.fight':'scrapper'});
 Object.assign(files,{'ps.grav':files.hover,'gb.mon':files.critters,'gb.mon2':files.critters});
 add('print-v3',{'pc.park':'coaster','pc.squigs':'jacks','pc.rts':'kingdom','pc.carta':'encyclopedia','pc.pinball':'pinball','pc.jaquake':'explorer','pc.jrt':'arena','pc.boss':'office','pm.os98':'desktop','pm.netplanet':'internet','pm.gub':'robot-band','pm.catalogue':'mail-order','reading.book.0':'modem-mystery','reading.book.3':'radio','reading.book.4':'space-kat','hs.pbook':'directory','hs.tvguide':'telly','ch.m.comic':'space-kat','pack.cereal':'cereal','pack.cat':'kitty','pack.crisps':'crisps','pack.fizz':'orange','pack.spike':'stegosaur','pack.board':'board-game','pack.toy':'construction','editorial.guide':'workshop','editorial.letters':'postbag','editorial.comic':'comic','winter':'winter','pod':'pod'});
 Object.assign(files,{'pc.city':files.city,'pc.keepa':files.dungeon,'reading.book.1':files.space,'reading.book.2':files.critters,'reading.book.5':files.robots});
 add('print-v3',Object.fromEntries(['milk','eggs','cheese','peas','fish','beans','soup','bread'].map(id=>['pack.'+id,id])));
 add('print-v3',{'hardware.n64':'hardware-ultra','hardware.ps':'hardware-play','hardware.md':'hardware-segue','hardware.dc':'hardware-daydream'});
 for(let i=1;i<=12;i++)files['pm.mag.'+String(i).padStart(2,'0')]='/art/magazines-v2/'+String(i).padStart(2,'0')+'.webp';
 Object.assign(files,{'pc.podracer':files.pod,'pc.grotlings':'/art/print-v3/grotlings.webp','pc.cover7':files['pm.mag.07'],'pc.dx61':files['pm.os98']});
 add('posters-v4',{'posterBand':'band','posterFilm':'film','posterGame':'game','posterRobot':'robot','posterShuttle':'shuttle'});
 add('print-v4',{'board.property':'board-property','board.cat':'board-cat','board.doctor':'board-doctor'});
 add('print-v4',Object.fromEntries(['park','city','squigs','rts','keepa','carta','pinball','quake','jrt','boss'].map(id=>['back.'+id,'back-'+id])));
 add('print-v4',{'pc.boss':'football','vhs.dog':'vhs-dog','vhs.galaxy':'vhs-galaxy','vhs.bash':'vhs-bash'});
 const aliases={park:'pc.park',city:'pc.city',squigs:'pc.squigs',rts:'pc.rts',keepa:'pc.keepa',carta:'pc.carta',pinball:'pc.pinball',jaquake:'pc.jaquake',jrt:'pc.jrt',boss:'pc.boss',cover7:'pm.mag.07',n64:'pc.jrt',callumcd:'pm.gub','pm.mix':'pm.gub','vhs.robots':'robots','vhs.charts':'band','vhs.dog':'vhs.dog','vhs.mom':'city','vhs.dad':'snooker','vhs.blank':'space'};
 // Base illustration names (city, etc.) retain their original paint() meaning.
 function key(item){let id=typeof item==='string'?item:item?.id;if(id?.startsWith('cart.'))id=id.slice(5);if(id==='pc.callumcd')return 'pm.gub';if(id==='pc.gquest')return 'reading.book.0';if(id==='pc.n64')return 'n64.kart';return aliases[id]||((item?.box?.id&&files['pc.'+item.box.id])?'pc.'+item.box.id:id)}
 const images={},embedded={},pending=new Map(),status={};
 const asData=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
 const load=src=>{
  if(pending.has(src))return pending.get(src);
  const promise=(async()=>{const control=new AbortController(),timeout=setTimeout(()=>control.abort(),60000);try{
   const response=await fetch(src,{signal:control.signal});if(!response.ok)throw Error('Artwork unavailable');
   const data=await asData(await response.blob()),im=new Image();im.src=data;await im.decode();return{im,data};
  }catch(e){return null}finally{clearTimeout(timeout)}})();pending.set(src,promise);return promise;
 };
 // Room construction can block parsing/decoding on software WebGL. Do not
 // compete with parser-blocking modules or abort queued art after eight seconds.
 const parsed=typeof document!=='undefined'&&document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();
 const ready=parsed.then(()=>Promise.all(Object.entries(files).map(async([id,src])=>{
  let result=await load(src);
  if(!result&&legacy[id]){const im=new Image();im.src=legacy[id];try{await im.decode();result={im,data:legacy[id]}}catch(e){}}
  if(result){images[id]=result.im;embedded[id]=result.data;status[id]='generated'}else status[id]='fallback';
 })));
 function paint(c,id,x,y,w,h,fit='cover'){
  const im=images[id];if(!im?.naturalWidth||!(w>0&&h>0))return false;
  const s=(fit==='contain'?Math.min:Math.max)(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);c.restore();return true;
 }
 function svg(id,x,y,w,h,fit='cover'){return embedded[id]?`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${fit==='contain'?'meet':'slice'}" href="${embedded[id]}"/>`:''}
 // Three editorial crops from one coherent illustration; these are printed
 // scenes, not fabricated claims of actual gameplay screenshots.
 function vignette(id,index=0){
  if(!embedded[id])return '';
  const n=((index%3)+3)%3,zoom=n?1.38:1,w=160*zoom,h=100*zoom;
  return `<svg width="160" height="100" viewBox="0 0 160 100" overflow="hidden">${svg(id,n===2?160-w:0,(100-h)/2,w,h)}</svg>`;
 }
 // Shelf, hand and reader use one cover layout: identical art, native crisp type.
 function magazine(c,issue,w,h){
  const id=issue.id||'pm.mag.'+String(issue.month||issue.issue).padStart(2,'0');if(!images[id])return false;
  c.save();c.scale(w/384,h/512);c.fillStyle=issue.color||'#235e82';c.fillRect(0,0,384,512);
  paint(c,id,0,83,384,337);c.fillStyle='rgba(13,22,32,.9)';c.fillRect(0,0,384,83);c.fillRect(0,416,384,96);
  c.textAlign='center';c.fillStyle='#fff1cf';let masthead=55;do{c.font='900 '+masthead+'px Impact,"Arial Narrow",sans-serif';if(c.measureText('JACK ATTACK!').width<=352)break;masthead--}while(masthead>24);c.fillText('JACK ATTACK!',192,57);
  const months=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  c.font='bold 13px Arial';c.fillText(months[(issue.month||issue.issue||1)-1]+' 1999  •  ISSUE '+(issue.issue||issue.month||1)+'  •  20p',192,75);
  const title=issue.headline||issue.title||'THE GAMES SPECIAL',words=title.split(/\s+/);let size=34,rows=[];
  do{rows=[];let line='';c.font='900 '+size+'px Impact,Arial';for(const word of words){const next=(line+' '+word).trim();if(line&&c.measureText(next).width>352){rows.push(line);line=word}else line=next}if(line)rows.push(line);if(rows.length<=2)break;size--}while(size>17);
  rows.forEach((line,i)=>c.fillText(line,192,450+i*(size+2)));c.font='bold 12px Arial';c.fillStyle='#f2d572';c.fillText('REVIEWS  •  CHEATS  •  LETTERS  •  COMIC',192,503);c.restore();return true;
 }
 window.PrintArt={ready,files,status,key,paint,svg,vignette,magazine,image:id=>images[id]||null,has:id=>!!images[id]?.naturalWidth};
})();
