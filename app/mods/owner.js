/* Owner laboratory. No caller-supplied account keys or state paths are accepted.
 * Public standings, homepages, trades, town, forums and event records are deliberately
 * outside this manifest. Only account-owned save slots can be reset/restored. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const roam=require('./roam.js'),EC=require('./econ.js'),RC=require('../public/js/rm-cat.js');
const PC=require('../public/js/pm-cat.js'),SC=require('../public/js/st-cat.js'),CC=require('../public/js/ch-cat.js');
PC.addCarts(RC);
const DIR=process.env.DATA_DIR||path.join(__dirname,'..','data'),SNAPS=path.join(DIR,'owner-snapshots');
// Add new account-owned mod stores here. Never discover keys recursively: a
// matching name inside a shared town/trade/high-score record is not ownership.
const STORES={ch:['p'],cx:['p'],econ:['acct'],ex:['p'],grind:['p','mps'],hs:['p'],jsn:['u'],jw:['p'],lk:['p','inbox'],loot:['p'],md:['p'],pm:['box'],pmx:['p'],rm:['p'],share:['box','noch','stat','seed','owed'],sms:['numbers','contacts','replies','box'],story:['p'],sx:['p'],lan:['box','blocks']};
const DISC_IDS=['park','city','squigs','rts','keepa','carta','pinball','jaquake','jrt','boss','podracer','grotlings','cover7','callumcd','dx61','gquest','n64'];
const clone=v=>JSON.parse(JSON.stringify(v)),own=(o,k)=>!!o&&Object.hasOwn(o,k);
let ctx;const limits=new Map();
const owner=c=>!!(c?.ready&&typeof c.member==='string'&&c.member.toLowerCase()==='jack'&&own(ctx.state.members,'jack'));
const slotKey=mod=>mod==='lan'?'m:jack':'jack';
function slots(){return Object.entries(STORES).flatMap(([mod,maps])=>maps.map(map=>({mod,map,key:slotKey(mod)})));}
function capture(){return {v:1,member:clone(ctx.state.members.jack),records:slots().map(({mod,map,key})=>({mod,map,present:own(ctx.state.mods[mod]?.[map],key),value:own(ctx.state.mods[mod]?.[map],key)?clone(ctx.state.mods[mod][map][key]):null})),profile:roam.ownerRead(),settings:{clock:{present:own(ctx.data,'clock'),value:ctx.data.clock||null}}};}
function validate(s){
  if(s?.v!==1||s.member?.name?.toLowerCase()!=='jack'||!Array.isArray(s.records)||s.records.length!==slots().length)throw Error('Invalid owner snapshot.');
  slots().forEach(({mod,map},i)=>{if(s.records[i].mod!==mod||s.records[i].map!==map||typeof s.records[i].present!=='boolean')throw Error('Snapshot save manifest differs.');});
  if(s.profile!==null){const p=JSON.parse(Buffer.from(s.profile,'base64').toString());decode(p);}
}
function apply(s){
  validate(s);roam.ownerWrite(s.profile);
  const mem=ctx.state.members.jack;for(const k of Object.keys(mem))delete mem[k];Object.assign(mem,clone(s.member));
  slots().forEach(({mod,map,key},i)=>{const r=s.records[i];if(!ctx.state.mods[mod]){if(!r.present)return;ctx.state.mods[mod]={};}const d=ctx.state.mods[mod];if(!d[map]){if(!r.present)return;d[map]={};}if(r.present)d[map][key]=clone(r.value);else delete d[map][key];});
  if(s.settings?.clock?.present)ctx.data.clock=clone(s.settings.clock.value);else delete ctx.data.clock;
  ctx.indexTokens?.();ctx.markDirty();
}
function snapshot(reason){
  const stamp=new Date().toISOString(),id=stamp.replace(/[:.]/g,'-')+'-'+crypto.randomBytes(5).toString('hex');
  fs.mkdirSync(SNAPS,{recursive:true,mode:0o700});
  const fd=fs.openSync(path.join(SNAPS,id+'.json'),'wx',0o600);
  try{fs.writeFileSync(fd,JSON.stringify({id,at:stamp,reason,state:capture()}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  return id;
}
function list(){try{return fs.readdirSync(SNAPS).filter(f=>/^[\dTZ-]+-[a-f0-9]{10}\.json$/.test(f)).sort().reverse().map(f=>{const s=JSON.parse(fs.readFileSync(path.join(SNAPS,f),'utf8'));return{id:s.id,at:s.at,reason:s.reason};});}catch(e){if(e.code==='ENOENT')return[];throw e;}}
function load(id){if(typeof id!=='string'||!list().some(s=>s.id===id))throw Error('Choose a saved snapshot.');const s=JSON.parse(fs.readFileSync(path.join(SNAPS,id+'.json'),'utf8'));validate(s.state);return s.state;}
function audit(c,action,detail){fs.mkdirSync(DIR,{recursive:true});fs.appendFileSync(path.join(DIR,'owner-actions.log'),JSON.stringify({at:new Date().toISOString(),member:'jack',session:c.id,action,detail})+'\n',{mode:0o600});}
function decode(p){if(!p)return {};const b=Buffer.from(p.data,'base64');return JSON.parse((p.enc==='gzip'?zlib.gunzipSync(b,{maxOutputLength:3000000}):b).toString());}
function profile(){const raw=roam.ownerRead();return raw?JSON.parse(Buffer.from(raw,'base64').toString()):{ts:0,enc:'raw',data:'e30='};}
function saveProfile(obj){const p={ts:Date.now(),enc:'raw',data:Buffer.from(JSON.stringify(obj)).toString('base64')};roam.ownerWrite(Buffer.from(JSON.stringify(p)).toString('base64'));}
function fresh(){
  const econ=ctx.state.mods.econ?.acct?.jack,orders=ctx.state.mods.pmx?.p?.jack,number=ctx.state.mods.sms?.numbers?.jack;
  for(const {mod,map,key}of slots())if(ctx.state.mods[mod]?.[map])delete ctx.state.mods[mod][map][key];
  const mem=ctx.state.members.jack;mem.starterSparse=1;delete mem.starterTest;mem.me={first:'Jack',g:'m',v:1};
  ctx.state.mods.story.p.jack={ch:1,done:{},flags:{},trust:0,v:SC.version};
  // Keep actual earning/exchange caps and nonces; the explicit money tool is
  // the only owner path which bypasses caps. Shared obligations remain linked.
  if(econ){const a=EC.api.acct({member:mem.name});for(const k of ['day','caps','lastDay','plot','tix','lt','rentAcc'])if(own(econ,k))a[k]=clone(econ[k]);if(econ.wallet)a.wallet={...clone(econ.wallet),pence:0};}
  if(orders)ctx.state.mods.pmx.p.jack={o:[],day:orders.day,n:orders.n};
  if(number!==undefined)ctx.state.mods.sms.numbers.jack=clone(number);
  const p=roam.ownerFresh();roam.ownerWrite(Buffer.from(JSON.stringify(p)).toString('base64'));
}

function fence(){
  ctx.data.revision=(ctx.data.revision||0)+1;ctx.markDirty();
  // Retire cached single-player MUD characters before swapping their save.
  ctx.emit('owner-replace','jack');
  for(const[,c]of ctx.clients)if(owner(c)){c.ownerReload=true;c.roamUp=null;c.rmRun=null;}
}
function reload(){ctx.flush?.();const p=profile();for(const[ws,c]of ctx.clients)if(owner(c))ctx.send(ws,{t:'ownerReload',profile:p,ownerRev:ctx.data.revision||0});}
function state(ws){ctx.send(ws,{t:'ownerState',allowed:true,snapshots:list(),clock:ctx.data.clock||null,chapters:SC.chapters,steps:SC.steps,parcels:PC.ITEMS.map(x=>({id:x.id,title:x.title})),chores:CC.CHORES.map(x=>({id:x.id,title:x.n})),events:['phone','tea','bedtime','school','pocket'],story:ctx.state.mods.story?.p?.jack||null});}
function unlock(kind){
  const obj=decode(profile());const get=k=>{try{return JSON.parse(obj[k]||'{}');}catch{return {};}};
  const pm=get('jhp_pm');pm.own=pm.own||{};pm.opened=pm.opened||{};
  const stamp=Date.now();let ids=[];
  if(kind==='all'||kind==='hardware'){
    // The normal veteran room already models every console, including the
    // Game Lad and Super Ultra. Orders cover the four parcel-based consoles.
    obj.jhp_starter='0';ctx.state.members.jack.starterSparse=0;ids.push(...PC.ITEMS.filter(x=>x.kind==='hardware').map(x=>x.id));
  }
  if(kind==='all'||kind==='games'){ids.push(...PC.ITEMS.filter(x=>x.kind!=='hardware'&&x.kind!=='mag').map(x=>x.id),...DISC_IDS,...Object.keys(RC.GAME).map(id=>'cart.'+id),'pm.os','pm.net','pm.gub','pm.mix');const rm=get('jhp_rm');rm.f=rm.f||{};for(const id of Object.keys(RC.GAME))rm.f['cart.'+id]=stamp;obj.jhp_rm=JSON.stringify(rm);const r=ctx.state.mods.rm.p.jack||={f:{},best:{},n:{},coin:{day:'',got:0}};Object.assign(r.f,rm.f);}
  if(kind==='all'||kind==='magazines')for(let i=1;i<=12;i++){ids.push('pm.mag.'+String(i).padStart(2,'0'));ids.push('pm.cv.'+String(i).padStart(2,'0'));}
  for(const id of ids)pm.own[id]=stamp;
  obj.jhp_pm=JSON.stringify(pm);saveProfile(obj);
}
function money(c,m){
  if(!['cash','rupees'].includes(m.currency)||!Number.isSafeInteger(m.amount)||Math.abs(m.amount)>5000000)throw Error('Use a whole number from -5000000 to 5000000. Cash is in pence.');
  const a=EC.api.acct(c),cash=m.currency==='cash',old=cash?(a.wallet?.pence||0):a.bal,n=old+m.amount;
  if(n<0||n>(cash?5000000:require('../public/js/econ-cat.js').MAX))throw Error('Adjustment would be outside the account limit.');
  const backup=m.amount<0?snapshot('before-money'):null;
  if(cash){
    if(!a.wallet)a.wallet={pence:0,log:[],nonce:crypto.randomBytes(16).toString('hex'),day:'',exchanged:0,last:null};
    a.wallet.pence=n;a.wallet.log.push([Date.now(),m.amount,'owner','Owner tools',n]);a.wallet.log=a.wallet.log.slice(-50);
  }else{a.bal=n;a.log.push([Date.now(),m.amount,'owner','Owner tools',n]);a.log=a.log.slice(-50);}
  ctx.markDirty();EC.api.meToAll(a);return backup;
}
function handle(ws,c,m){
  const id=String(m.rid||'').slice(0,40),reply=(ok,msg,extra={})=>ctx.send(ws,{t:'ownerResult',rid:id,ok,msg,...extra});
  const key='ip:'+c.ip;let b=limits.get(key);if(!b){if(limits.size>2000)limits.delete(limits.keys().next().value);limits.set(key,b=new ctx.Bucket(2,12));}if(!b.take())return;
  if(!owner(c))return reply(false,'Owner access denied.');
  let accountBucket=limits.get('jack');if(!accountBucket)limits.set('jack',accountBucket=new ctx.Bucket(2,12));if(!accountBucket.take())return reply(false,'Please wait a moment.');
  const action=String(m.action||'');let backup=null;
  try{
    audit(c,action,{phase:'requested',rid:id});
    let effect=null;
    if(action==='open'||action==='list'){state(ws);if(action==='open')effect={kind:'open',god:!!m.god};}
    else if(action==='snapshot'){const saved=snapshot('manual');audit(c,action,{snapshot:saved});state(ws);return reply(true,'Snapshot saved.',{snapshot:saved});}
    else if(action==='reset'||action==='restore'){
      if(m.confirm!==(action==='reset'?'RESET JACK':'RESTORE JACK'))throw Error('Confirm this replacement in Owner tools.');
      const saved=action==='restore'?load(m.snapshot):null;backup=snapshot('before-'+action);fence();if(saved)apply(saved);else fresh();ctx.markDirty();audit(c,action,{phase:'complete',backup,snapshot:m.snapshot||null});reply(true,'Account replaced. Loading your room...');reload();return;
    }else if(action==='unlock'){
      if(!['all','hardware','games','magazines'].includes(m.kind))throw Error('Choose an unlock group.');backup=snapshot('before-unlock');fence();unlock(m.kind);ctx.markDirty();audit(c,action,{phase:'complete',kind:m.kind,backup});reply(true,'Collection unlocked. Loading your room...');reload();return;
    }else if(action==='money'){backup=money(c,m);effect={kind:'money'};}
    else if(action==='story'){
      const chapter=SC.chapters.find(ch=>ch.id===m.chapter),step=SC.byId[m.step];if(!chapter||m.step&&(!step||step.ch!==chapter.id))throw Error('Choose a chapter and its step.');
      backup=snapshot('before-story');const p={ch:chapter.id,done:{},flags:{},trust:0,v:SC.version};for(const s of SC.steps)if(s.ch<chapter.id||m.complete&&s.ch===chapter.id||step&&s.ch===chapter.id&&SC.steps.indexOf(s)<SC.steps.indexOf(step))p.done[s.id]=Date.now();
      if(m.complete){p.ch=Math.min(6,chapter.id+1);if(chapter.id===5)p.flags.veteran=true;}if(p.ch>3&&!p.flags.veteran)p.flags.ownerChapter=p.ch;
      ctx.state.mods.story.p.jack=p;for(const[w,cl]of ctx.clients)if(owner(cl))ctx.send(w,{t:'stState',...p});effect={kind:'story'};
    }else if(action==='clock'){
      if(m.clear)ctx.data.clock=null;else{if(typeof m.date!=='string'||!/^1999-\d{2}-\d{2}$/.test(m.date)||!Number.isInteger(m.hour)||m.hour<0||m.hour>23)throw Error('Choose a valid 1999 date and hour.');const d=new Date(m.date+'T12:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==m.date)throw Error('That date does not exist in 1999.');ctx.data.clock={date:m.date,hour:m.hour};}
      for(const[w,cl]of ctx.clients)if(owner(cl))ctx.send(w,{t:'ownerClock',clock:ctx.data.clock});effect={kind:'clock'};
    }else if(action==='parcel'){
      if(!own(PC.byId,m.item))throw Error('Choose a Pixel Post item.');const p=ctx.state.mods.pmx.p.jack||={o:[],day:'',n:0};const order={no:'OWN-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex'),id:m.item,price:0,ts:Date.now()};p.o.push(order);for(const[w,cl]of ctx.clients)if(owner(cl))ctx.send(w,{t:'pmxOrdered',order,bal:EC.api.acct(c).bal,today:p.n,max:PC.DAYMAX});effect={kind:'parcel'};
    }else if(action==='noclip'){if(typeof m.on!=='boolean')throw Error('Choose noclip on or off.');effect={kind:'noclip',on:m.on,menu:!!m.menu};}
    else if(action==='teleport'){if(typeof m.room!=='string'||!['bedroom','landing','hall','cupboard','lounge','garden','drive','kitchen'].includes(m.room)||!Number.isInteger(m.station)||m.station<0||m.station>100)throw Error('Choose a room and station.');effect={kind:'teleport',room:m.room,station:m.station};}
    else if(action==='overlay'){if(typeof m.on!=='boolean')throw Error('Choose overlay on or off.');effect={kind:'overlay',on:m.on};}
    else if(action==='chore'){if(!own(CC.CHORE,m.chore))throw Error('Choose a household chore.');backup=snapshot('before-chore');const p=ctx.state.mods.ch.p.jack;if(p){delete p.done[m.chore];delete p.run[m.chore];}effect={kind:'chore',id:m.chore,room:CC.CHORE[m.chore].room};}
    else if(action==='event'){if(!['phone','tea','bedtime','school','pocket'].includes(m.event))throw Error('Choose a household event.');effect={kind:'event',id:m.event};}
    else if(action==='rebuild')effect={kind:'rebuild'};
    else throw Error('Unknown owner tool.');
    ctx.markDirty();ctx.flush?.();audit(c,action,{phase:'complete',effect,amount:m.amount,currency:m.currency,chapter:m.chapter,step:m.step,complete:m.complete,item:m.item,clock:action==='clock'?ctx.data.clock:undefined,backup});reply(true,'Done.',{effect});
  }catch(e){if(backup){try{fence();apply(load(backup));reload();}catch(err){console.error('owner rollback failed',err.message);}}try{audit(c,action,{phase:'failed',msg:e.message,backup});}catch{}reply(false,e.message);}
}
module.exports={name:'owner',types:['ownerAction'],init(x){ctx=x;limits.clear();const greet=(ws,c)=>{if(owner(c))ctx.send(ws,{t:'ownerAccess',allowed:true,clock:ctx.data.clock||null});};x.on('hello',greet);x.on('login',c=>{for(const[ws,cl]of x.clients)if(cl===c)greet(ws,c);});},handle,_test:{capture,apply,fresh,snapshot,load,list,STORES,DISC_IDS,owner}};
