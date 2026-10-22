// Explicitly approved account creation, NOT a smoke test. Never replaces an existing user.
import{createRequire}from'node:module';import assert from'node:assert/strict';
const WebSocket=createRequire(import.meta.url)('../app/node_modules/ws');
const base=process.argv[2],live=base==='https://jacklm.com';
assert(base&&(live||['localhost','127.0.0.1'].includes(new URL(base).hostname)));
assert(!live||process.argv.includes('--approved-live'),'Explicit live approval flag required');
const ws=new WebSocket(base.replace(/^http/,'ws')+'/ws',{origin:base}),messages=[];
ws.on('message',d=>messages.push(JSON.parse(d)));
async function get(type){for(let n=0;n<500;n++){const i=messages.findIndex(m=>m.t===type||m.t==='loginErr');if(i>=0){const m=messages.splice(i,1)[0];if(m.t==='loginErr')throw Error(m.msg+' Existing accounts are NEVER replaced.');return m}await new Promise(r=>setTimeout(r,20))}throw Error('Timed out: '+type)}
try{
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});ws.send(JSON.stringify({t:'hello',cid:'approved-test-creation'}));await get('welcome');
 ws.send(JSON.stringify({t:'login',name:'test',pass:'testing123',signup:true}));const result=await get('loginOk');assert(result.isNew,'Existing account was not newly created');
 messages.length=0;ws.send(JSON.stringify({t:'rmGet',since:0}));const profile=await get('rmData');assert.equal(profile.enc,'raw');const seed=JSON.parse(Buffer.from(profile.data,'base64'));assert.equal(seed.jhp_starter,'1');assert.deepEqual(JSON.parse(seed.jhp_pm).own,{});
 messages.length=0;ws.send(JSON.stringify({t:'ecMe'}));const economy=await get('ecMe');assert.equal(economy.bal,0);assert.equal(economy.wallet.pence,0);
 console.log('Approved test account created with sparse starter profile and zero balances. No existing account was replaced.');
}finally{ws.close()}
