/* Original painted print illustrations, kept small; typography stays native. */
(function(){
 'use strict';const data=window.PrintArtData||{},images={};
 const ready=Promise.all(Object.entries(data).map(([id,src])=>new Promise(resolve=>{const im=images[id]=new Image();im.onload=()=>resolve();im.onerror=()=>resolve();im.src=src})));
 function paint(c,id,x,y,w,h){const im=images[id];if(!im?.complete||!im.naturalWidth)return false;const s=Math.max(w/im.width,h/im.height),sw=w/s,sh=h/s;c.save();c.imageSmoothingEnabled=false;c.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,x,y,w,h);c.restore();return true}
 window.PrintArt={ready,paint,has:id=>!!images[id]?.naturalWidth,svg:(id,x,y,w,h)=>data[id]?`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" href="${data[id]}"/>`:''};
})();
