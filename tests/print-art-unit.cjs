const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/print-art.js'),'utf8');
async function fixture(fail=false,delayDOM=false){
 const fetched=[];
 let startDOM;const document={readyState:delayDOM?'loading':'complete',addEventListener(event,fn){assert.equal(event,'DOMContentLoaded');startDOM=fn}};
 class Image{constructor(){this.naturalWidth=400;this.naturalHeight=200}async decode(){}}
 class FileReader{readAsDataURL(){this.result='data:image/webp;base64,QUJD';queueMicrotask(()=>this.onload())}}
 const window={PrintArtData:{city:'data:image/webp;base64,QUJD',dungeon:'data:image/webp;base64,QUJD',robots:'data:image/webp;base64,QUJD',space:'data:image/webp;base64,QUJD',hover:'data:image/webp;base64,QUJD',critters:'data:image/webp;base64,QUJD',band:'data:image/webp;base64,QUJD',shuttle:'data:image/webp;base64,QUJD',snooker:'data:image/webp;base64,QUJD'}};
 vm.runInNewContext(source,{window,document,Image,FileReader,AbortController,Promise,setTimeout:()=>0,clearTimeout(){},fetch:async src=>{fetched.push(src);if(fail)throw Error('offline');return{ok:true,blob:async()=>({})}}});
 if(delayDOM){await Promise.resolve();assert.equal(fetched.length,0,'Art must not compete with parser-blocking room scripts');startDOM()}
 await window.PrintArt.ready;return{art:window.PrintArt,fetched};
}
test('all catalogue IDs resolve; URLs decode once even when art is shared',async()=>{
 const{art,fetched}=await fixture();const games=require('../app/public/js/rm-cat.js').GAMES;
 assert.equal(fetched.length,new Set(Object.values(art.files)).size);
 for(const g of games){assert.equal(art.key('cart.'+g.id),g.id);assert(art.has(g.id),g.id)}
 for(const id of ['park','city','keepa','podracer','grotlings','cover7','dx61','callumcd','gquest','n64'])assert(art.has(art.key('pc.'+id)),id);
 assert(Object.values(art.status).every(s=>s==='generated'));
});
test('generated loading waits for parsing, then decodes every registered image',async()=>{
 const {art,fetched}=await fixture(false,true);assert.equal(fetched.length,new Set(Object.values(art.files)).size);assert(Object.values(art.status).every(s=>s==='generated'));
});
test('cover/contain preserve image aspect and clip only the intended print rectangle',async()=>{
 const{art}=await fixture(),calls=[],ctx={save(){},restore(){},beginPath(){},rect(...a){calls.push(['clipRect',...a])},clip(){},drawImage(...a){calls.push(['image',...a.slice(1)])}};
 assert(art.paint(ctx,'n64.kart',10,20,100,100));assert.deepEqual(calls[1],['image',-40,20,200,100]);
 calls.length=0;assert(art.paint(ctx,'n64.kart',10,20,100,100,'contain'));assert.deepEqual(calls[1],['image',10,45,100,50]);
 assert.equal(art.paint(ctx,'unknown',0,0,10,10),false);
 assert(art.svg('n64.kart',0,0,100,100).includes('data:image/webp;base64,'));assert.equal(art.svg('unknown',0,0,100,100),'');
});
test('offline readiness settles and missing generated art leaves callers their fallback',async()=>{
 const{art}=await fixture(true);assert.equal(art.has('n64.kart'),false);assert.equal(art.status['n64.kart'],'fallback');assert.equal(art.svg('n64.kart',0,0,1,1),'');assert(art.has('city'),'existing embedded generated illustration survives offline');
});
test('back-panel crops are clipped, aspect-preserving and distinct, with an empty offline fallback',async()=>{
 const {art}=await fixture(),panels=[0,1,2].map(i=>art.vignette('n64.kart',i));
 assert.equal(new Set(panels).size,3);assert(panels.every(s=>s.includes('overflow="hidden"')&&s.includes('preserveAspectRatio="xMidYMid slice"')));
 assert.equal(art.vignette('not-present',0),'');assert.equal(art.vignette('n64.kart',3),panels[0]);
 const offline=await fixture(true);assert.equal(offline.art.vignette('n64.kart',0),'');
});
test('monthly mastheads fit without clipping even with a wider fallback font',async()=>{
 const {art}=await fixture(),titles=[];
 const ctx={save(){},restore(){},scale(){},fillRect(){},beginPath(){},rect(){},clip(){},drawImage(){},font:'12px Arial',measureText(s){return{width:s.length*Number(/([\d.]+)px/.exec(this.font)?.[1]||12)*.72}},fillText(s,x,y){if(s==='JACK ATTACK!')titles.push({width:this.measureText(s).width,x,y})}};
 assert(art.magazine(ctx,{id:'pm.mag.01',month:1,issue:1,headline:'SPACE JACK PINBALL'},384,512));
 assert.equal(titles.length,1);assert(titles[0].width<=352);assert.equal(titles[0].x,192);
});
test('already-open reading pages repaint in place when generated illustrations finish loading',async()=>{
 let resolveArt,decoded=false;const artReady=new Promise(resolve=>{resolveArt=resolve});
 const issue={id:'pm.mag.01',month:1,issue:1,title:'January',publication:'JACK ATTACK!',color:'#123',headline:'PINBALL',kicker:'Silver balls',pages:Array.from({length:6},()=>({title:'A story',body:'An original printed story.'}))};
 const window={House:{ok:true,T:{},on(){},dirty(){},ROOMS:{},THINGS:{}},MagazineCat:{ISSUES:[issue],byId:{[issue.id]:issue},LEGACY_ALIASES:{}},ReadingBooks:[],PrintArt:{ready:artReady,image:()=>null,paint(g){if(decoded)g.generated=(g.generated||0)+1;return decoded}}};
 window.HouseKit={mat(){},tex(key,w,h,draw){const g=new Proxy({generated:0,measureText:s=>({width:s.length*12})},{get:(o,k)=>k in o?o[k]:()=>{}});draw(g,w,h);return{userData:{g}}}};
 const sandbox={window,innerWidth:1366,innerHeight:860,performance,localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null},setTimeout:()=>0,Promise,Map,Set};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/magazines.js'),'utf8'),sandbox);
 const book={id:'reading.book.0',title:'Mystery',publication:'PAPERBACK',color:'#234',pages:[{title:'Chapter one',body:'The modem rang.'}]};
 const pages=[window.Magazines.pageTexture(book,0),window.Magazines.pageTexture(issue,5)];
 assert(pages.every(t=>!t.userData.g.generated));decoded=true;resolveArt();await window.Magazines.ready;
 assert(pages.every(t=>t.userData.g.generated>0&&t.needsUpdate));
 assert.equal(window.Magazines.pageTexture(book,0),pages[0],'Repaint must retain the texture used by the open reader');
 assert(pages.every(t=>t.userData.layout.bottom<t.userData.layout.footer));
});
function packaging(){
 const window={Discs:{BOX:{},GAMES:{},byOf:()=> 'Jacksoft',demoBox:()=>false},PM:{}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app/public/js/pm-art.js'),'utf8'),{window});return window.PMArt;
}
test('PC back panels retain complete blurbs and every feature without ellipses or footer overlap',()=>{
 const art=packaging(),blurb=Array.from({length:45},(_,i)=>'word'+i).join(' '),feats=Array.from({length:5},(_,i)=>'Feature '+i+' includes a long explanatory line without losing its final endmarker'+i);
 const text=art.backBig({title:'A readable fictional game',c1:'#123456',box:{blurb,feats}});
 const nodes=[...text.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)],copy=nodes.map(m=>m[2]).join(' ');
 assert(copy.includes(blurb));for(const f of feats)assert(copy.includes(f),f);assert(!copy.includes('...'));
 for(const node of nodes.filter(m=>/Feature|endmarker/.test(m[2]))){const y=Number(/y="([\d.]+)"/.exec(node[1])[1]);assert(y>=123&&y<168,'Feature overlaps requirements box')}
});
test('Pixel Post masthead and full catalogue straplines have explicit print bounds',()=>{
 const text=packaging().catCover();
 assert.match(text,/<text[^>]*textLength="174"[^>]*>THE GAMES CATALOGUE · AUTUMN \/ WINTER 1999<\/text>/);
 assert.match(text,/<text[^>]*textLength="182"[^>]*>EVERY GAME BOXED, WITH THE MANUAL!<\/text>/);
 assert(text.includes('height="67" fill="#fff0cf"'),'Masthead needs a readable ink/paper backing');
});
