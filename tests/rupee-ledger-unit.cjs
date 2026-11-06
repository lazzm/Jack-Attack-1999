'use strict';
const assert=require('node:assert/strict');
(async()=>{
 const {reconcileRupees}=await import('./rupee-ledger.mjs');
 const before={t:'ecMe',bal:97,earned:97,spent:0,log:[]};
 const paid={t:'ecMe',bal:165,earned:165,spent:0,log:[[1,65,'season','Halloween',162],[2,3,'secret','New discovery',165]]};
 assert.equal(reconcileRupees(before,paid,65,'paid').length,2);
 const replay={...paid,bal:168,earned:168,log:[...paid.log,[3,3,'secret','Another discovery',168]]};
 assert.equal(reconcileRupees(paid,replay,0,'replay').length,1);
 for(const [after,expected]of [[{...replay,bal:171},0],[{...replay,log:[...paid.log,[3,3,'season','Duplicate payment',168]]},0],[{...paid,log:[[1,65,'season','Halloween',165]]},65],[{...paid,earned:168},65]])assert.throws(()=>reconcileRupees(expected===65?before:paid,after,expected,'corruption'));
 // Exercise the real browser-test observer across document replacement.
 const fs=require('node:fs'),vm=require('node:vm'),src=fs.readFileSync(require.resolve('./events-halloween.mjs'),'utf8');
 const code=src.slice(src.indexOf(' async function economy()'),src.indexOf(' let moneyCheckpoint;'));
 let doc;const fresh=()=>{const listeners=[];doc={window:{},Net:{on:(_t,fn)=>listeners.push(fn),send:()=>listeners.forEach(fn=>fn({t:'ecMe',bal:174}))},listeners};vm.createContext(doc)};
 const evaluate=fn=>vm.runInContext('('+fn.toString()+')()',doc),c={page:{evaluate},until:async fn=>assert(evaluate(fn),'Observer did not receive the snapshot')};vm.createContext(c);vm.runInContext(code,c);
 fresh();assert.equal((await c.economy()).bal,174);assert.equal(doc.listeners.length,1);
 fresh();assert.equal((await c.economy()).bal,174,'Reload lost the money observer');await c.economy();assert.equal(doc.listeners.length,1,'Repeated reads duplicated observers');
 console.log('RUPEE LEDGER PASS: incidental credits identified; duplicate seasonal payments, missing rows, wrong balances and earned counters rejected');
})().catch(e=>{console.error(e);process.exitCode=1});
