'use strict';
const assert=require('node:assert/strict');
const econ=require('../app/mods/econ.js'),hs=require('../app/mods/hs.js'),grind=require('../app/mods/grind.js'),ch=require('../app/mods/ch.js');
const realNow=Date.now,realInterval=global.setInterval,realTimeout=global.setTimeout;
let now=Date.UTC(2026,9,23,12);Date.now=()=>now;global.setInterval=global.setTimeout=()=>0;
const messages=[],ws={},c={member:'WalletKid'},state={members:{walletkid:{name:'WalletKid'}},scores:{}},clients=new Map([[ws,c]]);
const ctx=data=>({data,state,clients,markDirty(){},on(){},emit(){},broadcast(){},send(_ws,m){messages.push(typeof m==='string'?JSON.parse(m):JSON.parse(JSON.stringify(m)))},Bucket:class{take(){return true}}});
try{
 econ.init(ctx({}));grind.init(ctx({}));ch.init(ctx({}));hs.init(ctx({}));
 const E=econ.api,a=E.acct(c);a.bal=321;a.inv.kept=1;
 // Exercise finance in isolation from optional XP/loot rewards.
 E.HOOKS.earn.length=0;
 const view=()=>{econ.handle(ws,c,{t:'ecMe'});return messages.at(-1)};
 assert.equal(view().wallet.pence,0);assert.equal(a.bal,321);assert.equal(a.inv.kept,1);
 const job=E.earnA(a,'job','Validated test job',20);assert.equal(job,20);assert.equal(view().wallet.pence,100);assert.equal(a.bal,321);
 hs.handle(ws,c,{t:'hsPocket'});assert.equal(view().wallet.pence,600);assert.equal(a.bal,321);
 hs.handle(ws,c,{t:'hsPocket'});assert.equal(view().wallet.pence,600,'Saturday money cannot be claimed twice');
 const nonce=view().wallet.nonce;
 econ.handle(ws,c,{t:'ecExchange',pence:100,nonce});assert.equal(a.bal,341);assert.equal(view().wallet.pence,500);
 econ.handle(ws,c,{t:'ecExchange',pence:100,nonce});assert.equal(a.bal,341);assert.equal(view().wallet.pence,500,'Replay must not debit twice');
 for(const pence of [-5,0,1,4,6,1.5,'100',2005,NaN,Infinity]){const before=JSON.stringify(a);econ.handle(ws,c,{t:'ecExchange',pence,nonce:view().wallet.nonce});assert.equal(JSON.stringify(a),before,'Invalid amount changed the account');}
 const current=view().wallet.nonce;econ.handle(ws,c,{t:'ecExchange',pence:1000,nonce:current});assert.equal(view().wallet.pence,500,'Overdraw must not take cash');
 // Retained slip survives serialization, as it does in the state file.
 a.wallet=JSON.parse(JSON.stringify(a.wallet));econ.handle(ws,c,{t:'ecExchange',pence:100,nonce});assert.equal(a.bal,341);
 // Cash comes only from capped earn paths. Bank daily amount cap also applies.
 for(let n=0;n<40;n++)E.earnA(a,'job','Capped job',100);assert.equal(a.caps.job,30);
 const cash=view().wallet.pence;econ.handle(ws,c,{t:'ecExchange',pence:1900,nonce:view().wallet.nonce});assert.equal(view().wallet.pence,cash-1900);
 const before=JSON.stringify(a);econ.handle(ws,c,{t:'ecExchange',pence:5,nonce:view().wallet.nonce});assert.equal(JSON.stringify(a),before,'Daily exchange cap changed money');
 now+=86400000;econ.handle(ws,c,{t:'ecExchange',pence:5,nonce:view().wallet.nonce});assert.equal(view().wallet.remaining,1995);
 const capState=JSON.stringify(a);a.bal=require('../app/public/js/econ-cat.js').MAX;const fullCash=view().wallet.pence;econ.handle(ws,c,{t:'ecExchange',pence:5,nonce:view().wallet.nonce});assert.equal(view().wallet.pence,fullCash,'Full Rupee account must not consume cash');
 assert.equal(a.inv.kept,1);console.log('WALLET UNIT PASS: additive balances, cash wages, £5 Saturday money, replay/reload, invalid amounts, overdraw, caps, day rollover and full accounts');
}finally{Date.now=realNow;global.setInterval=realInterval;global.setTimeout=realTimeout}
