// Server-owned ordering, safety, timing, ink persistence, reward idempotency and event boundaries.
'use strict';
const assert=require('node:assert/strict'),S=require('../app/mods/season.js'),E=require('../app/mods/econ.js'),C=require('../app/public/js/season-cat.js');
const prev={};for(const k of ['uk','acct','acctByKey','earnA'])prev[k]=E.api[k];
let now=1000000;const oldNow=Date.now;Date.now=()=>now;
const a={bal:0,wallet:{pence:987},caps:{cashExchange:17}},out=[],jack={member:'Jack'},ws={};
const state={members:{jack:{name:'Jack'},normal:{name:'Normal'}},mods:{owner:{clock:{date:'1999-11-05',hour:19}},story:{p:{jack:{ch:6,trust:0}}},season:{},untouched:{save:['keep']}}};
E.api.uk=()=>({day:'2026-11-05',h:19});E.api.acct=()=>a;E.api.acctByKey=()=>a;E.api.earnA=(_a,_source,_note,amt)=>(a.bal+=amt,amt);
S.init({state,data:state.mods.season,clients:new Map([[ws,jack]]),Bucket:class{take(){return true}},send:(_ws,m)=>out.push(m),markDirty(){},on(){}});
const send=(o,s,x)=>{out.length=0;S.handle(ws,jack,{t:'seStep',e:'bonfire99',o,s,x});return out.find(m=>m.t==='seStep')};
const wait=()=>{now+=1500};
const ink=Array.from({length:20},(_,i)=>[i/20,.5]);
try{
 assert.equal(send('bf-light','start',{hour:19}).ok,false,'Code and stack gate lighting');
 assert.equal(send('bf-wood','box1').ok,false,'Tinder first');
 for(const s of C.byId.bonfire99.objById['bf-wood'].steps){wait();assert(send('bf-wood',s).ok,s)}
 assert.equal(send('bf-code','taper').ok,false);
 for(const s of ['tin','water','pets','line','taper']){wait();assert(send('bf-code',s).ok,s)}
 assert.equal(send('bf-bucket','cool').ok,false);
 assert.equal(send('bf-sparkler','light').ok,false,'Display before sparkler');
 for(const s of ['stuff','tie']){wait();assert(send('bf-guy',s).ok)}
 assert.equal(send('bf-guy','face',[[Infinity,0]]).ok,false);wait();assert(send('bf-guy','face',ink).ok);
 for(const s of ['hat','place']){wait();assert(send('bf-guy',s).ok)}
 for(const s of ['wash','prick','foil','oven']){wait();assert(send('bf-food',s).ok)}
 assert.equal(send('bf-food','gloves').ok,false);now+=6500;assert(send('bf-food','gloves').ok);wait();assert(send('bf-food','serve').ok);
 state.mods.owner.clock.hour=17;assert.equal(send('bf-light','start',{hour:19}).ok,false,'Owner clock is authoritative');
 state.mods.owner.clock.hour=19;wait();assert(send('bf-light','start',{hour:19}).ok);const start=now;
 assert.equal(send('bf-light','finale',{hour:19}).ok,false);
 for(const [s,ms] of [['fountain',35000],['wheel',70000],['rocket',110000],['finale',180000]]){assert.equal(send('bf-light',s,{hour:19}).ok,false,'No early '+s);now=start+ms;assert(send('bf-light',s,{hour:19}).ok,s)}
 for(const s of ['gloves','light','write']){wait();assert(send('bf-sparkler',s,s==='write'?ink:undefined).ok,s)}
 wait();assert(send('bf-bucket','cool').ok);const saved=S._test.view('jack');assert.deepEqual(saved.ev.bonfire99.art.face,ink);assert.deepEqual(saved.ev.bonfire99.art.sparkler,ink);
 const bal=a.bal;wait();assert(send('bf-bucket','cool').again);assert.equal(a.bal,bal);
 state.mods.owner.clock.date='1999-11-06';state.mods.owner.clock.hour=9;
 assert.equal(send('bf-light','start',{hour:19}).ok,false);
 for(let i=1;i<=6;i++){wait();assert(send('bf-clean','c'+i).ok)}assert.equal(a.bal,95);assert.equal(a.wallet.pence,987);assert.equal(a.caps.cashExchange,17);
 S.ownerReset('bonfire99');const paid=S._test.view('jack').ev.bonfire99.paid;assert.equal(Object.keys(paid).length,8,'Reset keeps paid records');assert.equal(a.bal,95);assert.deepEqual(state.mods.untouched,{save:['keep']});
 state.mods.owner.clock.hour=12;assert.equal(send('bf-light','start',{hour:19}).ok,false,'No daylight leftovers');
 state.mods.owner.clock.hour=19;wait();assert(send('bf-light','start',{hour:19}).ok,'Catch-up needs no preparation');const catchStart=now;
 for(const [id,ms] of [['fountain',15000],['wheel',30000],['rocket',50000],['finale',90000]]){now=catchStart+ms;assert(send('bf-light',id,{hour:19}).ok,id)}
 assert.equal(a.bal,95,'Same paid ledger for catch-up');assert.equal(S._test.view('jack').ev.bonfire99.display,'leftovers');
 wait();assert.equal(send('bf-light','start',{hour:19}).ok,false,'Finished players cannot repeat');
 state.mods.owner.clock.hour=23;assert.equal(send('bf-clean','c1').ok,false,'Tail closes at 23:00');
 E.api.uk=()=>({day:'2026-11-06',h:19});out.length=0;const normal={member:'Normal'};
 S.handle(ws,normal,{t:'seStep',e:'bonfire99',o:'bf-light',s:'start',x:{hour:19}});assert(out.find(m=>m.t==='seStep')?.ok,'Non-owner may watch leftovers without jobs');
 const ns=now;for(const [id,ms] of [['fountain',15000],['wheel',30000],['rocket',50000],['finale',90000]]){now=ns+ms;out.length=0;S.handle(ws,normal,{t:'seStep',e:'bonfire99',o:'bf-light',s:id,x:{hour:19}});assert(out.find(m=>m.t==='seStep')?.ok,id)}
 assert.equal(a.bal,110,'Non-owner gets ordinary once-only 15 Rupee objective');
 console.log('bonfire-unit: PASS — eight objectives, safety gates, timing, ink, once-only rewards, clock boundaries');
}finally{Date.now=oldNow;Object.assign(E.api,prev)}
