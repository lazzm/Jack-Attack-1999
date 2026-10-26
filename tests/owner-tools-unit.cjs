/* Pure owner-store tests: every byte belongs to disposable /tmp state. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jhp-owner-unit-'));process.env.DATA_DIR=dir;
const O=require('../app/mods/owner.js'),R=require('../app/mods/roam.js'),E=require('../app/mods/econ.js');
const test=O._test,events={},out=[];
class Bucket{constructor(){this.n=12;}take(){return this.n-->0;}}
const jack={ready:true,member:'Jack',nick:'Anything',ip:'owner',id:1},other={ready:true,member:'Normal',nick:'Jack',ip:'other',id:2};
const state={members:{jack:{name:'Jack',me:{first:'Jack',g:'m',v:1},tokens:['secret-hash'],salt:'kept',hash:'kept',profile:{bio:'Before'},no:1},normal:{name:'Normal',tokens:['other']}},mods:{owner:{}}};
for(const[mod,maps]of Object.entries(test.STORES)){state.mods[mod]||={};for(const map of maps){state.mods[mod][map]={[mod==='lan'?'m:jack':'jack']:{arbitrary:[1,'old',null]},normal:{unchanged:true}};}}
state.mods.econ.acct.jack={name:'Jack',bal:700,earned:20,day:'2026-10-26',caps:{cashExchange:17},wallet:{pence:1234,log:[],nonce:'nonce',day:'2026-10-26',exchanged:15,last:{nonce:'old',pence:5}},plot:1,st:{AAA:2},cost:{AAA:10},tix:[9]};
state.mods.pmx.p.jack={o:[{id:'hardware.n64',no:'PP00001'}],day:'2026-10-26',n:2};
state.mods.rm.p.jack={f:{a:2},best:{x:100},coin:{day:'today',got:1},n:{x:2}};
state.mods.econ.town={plots:[{o:'Normal'},{o:'Jack'}]};state.mods.ex.bay={lots:{1:{k:'jack',buyer:'normal'}}};state.mods.rm.hi={x:[{n:'Jack',s:99}]};state.mods.jw.rooms={R1:{o:'jack',gb:['Normal post']}};state.mods.events={cap:{list:{jack:{public:true}}}};
const shared=()=>JSON.stringify([state.mods.econ.town,state.mods.ex.bay,state.mods.rm.hi,state.mods.jw.rooms,state.mods.events]);
const ctx={state,data:state.mods.owner,clients:new Map([['j',jack],['o',other]]),Bucket,send:(ws,m)=>out.push({ws,m}),markDirty(){},flush(){},indexTokens(){},emit:(ev,...args)=>(events[ev]||[]).forEach(f=>f(...args)),on:(ev,f)=>(events[ev]||=[]).push(f)};
const init=()=>O.init(ctx);init();
// Use the real sparse factory and profile IO; the account factory is the only
// dependency stubbed (econ's production init also starts global simulations).
const acct0=E.api.acct,me0=E.api.meToAll;E.api.acct=c=>(state.mods.econ.acct[c.member.toLowerCase()]||={name:c.member,bal:0,log:[],st:{},cost:{},wallet:{pence:0}});E.api.meToAll=()=>{};
let rid=0;function action(c,action,args={}){out.length=0;O.handle(c===jack?'j':'o',c,{t:'ownerAction',rid:String(++rid),action,...args});return out.find(x=>x.m.t==='ownerResult')?.m;}
try{
 const prof={ts:123,enc:'raw',data:Buffer.from(JSON.stringify({jhp_starter:'0',jhp_rm:JSON.stringify({f:{'cart.n64.kart':9}}),jhp_hs_stand:'{"p":{"x":5}}'})).toString('base64')};
 const bytes=JSON.stringify(prof,null,2)+'\n';R.ownerWrite(Buffer.from(bytes).toString('base64'));
 const before=JSON.stringify(test.capture()),untouched=JSON.stringify(state.members.normal),world=shared();
 assert.equal(test.owner(other),false);assert.equal(test.owner({...other,member:''}),false);assert.equal(test.owner(jack),true);
 for(const act of ['open','snapshot','reset','restore','unlock','money','noclip','teleport','clock','parcel','chore','event'])assert.equal(action(other,act,{member:'jack',nick:'Jack',key:'jack',confirm:'RESET JACK',kind:'all',currency:'cash',amount:500,on:true}).ok,false,act);
 assert.equal(action(other,'snapshot'),undefined,'Forged packet flood must be rate limited');
 assert.equal(JSON.stringify(test.capture()),before);assert.equal(fs.existsSync(path.join(dir,'owner-snapshots')),false);
 assert.equal(action({...other,ready:false,member:'Jack',ip:'unready'},'snapshot').ok,false);
 init();const snap=action(jack,'snapshot');assert(snap.ok);const id=snap.snapshot;
 const file=path.join(dir,'owner-snapshots',id+'.json');assert.equal(fs.statSync(file).mode&0o777,0o600);assert.equal(fs.statSync(path.join(dir,'owner-actions.log')).mode&0o777,0o600);
 assert.equal(action(jack,'reset').ok,false,'Reset requires explicit confirmation');
 assert(action(jack,'reset',{confirm:'RESET JACK'}).ok);
 assert.equal(state.mods.story.p.jack.ch,1);assert.deepEqual(state.mods.story.p.jack.done,{});assert.equal(state.members.jack.name,'Jack');assert.equal(state.members.jack.starterSparse,1);
 assert.equal(state.mods.econ.acct.jack.bal,0);assert.equal(state.mods.econ.acct.jack.wallet.pence,0);assert.equal(state.mods.econ.acct.jack.wallet.nonce,'nonce');assert.equal(state.mods.econ.acct.jack.caps.cashExchange,17);assert.deepEqual(state.mods.econ.acct.jack.st,{});assert.equal(state.mods.pmx.p.jack.n,2);
 const fresh=JSON.parse(Buffer.from(JSON.parse(Buffer.from(R.ownerRead(),'base64').toString()).data,'base64').toString());assert.equal(fresh.jhp_starter,'1');assert.deepEqual(JSON.parse(fresh.jhp_rm).f,{});
 jack.ownerReload=false;assert(action(jack,'restore',{confirm:'RESTORE JACK',snapshot:id}).ok);
 assert.equal(JSON.stringify(test.capture()),before,'All account records and profile bytes must restore exactly');assert.equal(Buffer.from(R.ownerRead(),'base64').toString(),bytes);
 assert.equal(JSON.stringify(state.members.normal),untouched);assert.equal(shared(),world);
 for(const[mod,maps]of Object.entries(test.STORES))for(const map of maps)assert.deepEqual(state.mods[mod][map].normal,{unchanged:true});
 init();jack.ownerReload=false;
 assert.equal(action(jack,'restore',{confirm:'RESTORE JACK',snapshot:'../../state'}).ok,false);
 assert.equal(action(jack,'clock',{date:'1999-02-29',hour:0}).ok,false);assert.equal(action(jack,'clock',{date:'2000-01-01',hour:0}).ok,false);assert.equal(action(jack,'clock',{date:'1999-12-31',hour:23}).ok,true);assert.equal(action(jack,'clock',{clear:true}).ok,true);
 assert.equal(action(jack,'money',{currency:'cash',amount:1.5}).ok,false);assert.equal(action(jack,'money',{currency:'cash',amount:-999999}).ok,false);assert.equal(action(jack,'money',{currency:'cash',amount:100}).ok,true);assert.equal(state.mods.econ.acct.jack.wallet.pence,1334);assert.equal(state.mods.econ.acct.jack.caps.cashExchange,17);
 assert.equal(action(jack,'teleport',{room:'__proto__',station:0}).ok,false);
 init();assert.equal(action(jack,'parcel',{item:'made-up'}).ok,false);
 const releaseMd=require('../app/mods/account-clock.js');state.mods.owner.clock={date:'1999-12-31',hour:23};
 assert.equal(releaseMd(state,jack,'2026-01-01'),1231);assert.equal(releaseMd(state,other,'2026-01-01'),101);assert.equal(releaseMd(state,{ready:false,member:'Jack'},'2026-01-01'),101);delete state.mods.owner.clock;
 // Snapshot/log storage errors fail closed before any destructive mutation.
 init();jack.ownerReload=false;const unchanged=JSON.stringify(test.capture()),open=fs.openSync;
 fs.openSync=(file,...args)=>{if(String(file).includes('owner-snapshots'))throw Error('Simulated disk full');return open(file,...args);};
 try{assert.equal(action(jack,'reset',{confirm:'RESET JACK'}).ok,false);assert.equal(JSON.stringify(test.capture()),unchanged);assert.equal(jack.ownerReload,false);}finally{fs.openSync=open;}
 // An offline tab's timestamp cannot hide a restored profile or overwrite it.
 R.init(ctx);const offline={ready:true,member:'Jack',ip:'offline',id:50};state.mods.owner.revision=17;out.length=0;
 R.handle('offline',offline,{t:'rmGet',since:9999999999999,ownerRev:16});assert.equal(out.at(-1).m.t,'rmData');assert.equal(out.at(-1).m.ownerRev,17);
 const profileBefore=R.ownerRead();R.handle('offline',offline,{t:'rmPut',ownerRev:16,id:'stale',i:0,n:1,d:'e30='});assert.equal(R.ownerRead(),profileBefore);assert.equal(out.at(-1).m.t,'ownerReload');assert.equal(offline.ownerReload,true);
 // Keep the owner's all-discs grant aligned with the existing physical catalogue.
 const discSource=fs.readFileSync(path.join(__dirname,'../app/public/js/discs.js'),'utf8').split('const BOXES = [')[1].split('  ];')[0];
 const ids=[...discSource.matchAll(/^    \{ id: '([^']+)'/gm)].map(m=>m[1]);assert.deepEqual(test.DISC_IDS,ids);
 assert(!fs.readFileSync(path.join(dir,'owner-actions.log'),'utf8').includes('secret-hash')); // audit stores backup IDs, never profile/password contents
 console.log('PASS owner authorization, forged packets + rate limit, private snapshots, exact reset/restore, shared isolation, clock/money validation and stale-tab revision fence');
}finally{E.api.acct=acct0;E.api.meToAll=me0;fs.rmSync(dir,{recursive:true,force:true});}
