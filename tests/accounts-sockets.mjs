import{createRequire}from'node:module';import assert from'node:assert/strict';
const WebSocket=createRequire(import.meta.url)('../app/node_modules/ws');
const base=process.argv[2]||'http://localhost:18390';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const url=base.replace(/^http/,'ws')+'/ws',name='Auth'+Date.now().toString(36),pass='Temporary-1999';
async function connect(token=''){const ws=new WebSocket(url,{origin:base}),messages=[];ws.on('message',d=>messages.push(JSON.parse(d)));await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});ws.send(JSON.stringify({t:'hello',cid:'test-auth-'+Math.random(),token}));async function get(t){for(let i=0;i<150;i++){const j=messages.findIndex(m=>m.t===t);if(j>=0)return messages.splice(j,1)[0];await new Promise(r=>setTimeout(r,20))}throw Error('Missing '+t)}return{ws,messages,get,send:m=>ws.send(JSON.stringify(m))}}
const a=await connect(),welcome=await a.get('welcome');assert(!welcome.member);
try{
 a.send({t:'kvInc',k:'test.auth.blocked'});a.send({t:'ecExchange',pence:100,nonce:'fake'});a.send({t:'grJobGo',j:'paper'});await new Promise(r=>setTimeout(r,250));assert(!a.messages.some(m=>['kvSet','ecExchanged','grJobGo'].includes(m.t)),'Unauthenticated game mutation was accepted');
 a.send({t:'login',name,pass,signup:false});assert.match((await a.get('loginErr')).msg,/not found/);
 a.send({t:'login',name,pass,signup:true});const login=await a.get('loginOk');
 a.send({t:'ecMe'});const me=await a.get('ecMe');assert.equal(me.wallet.pence,0);
 a.send({t:'login',name,pass,signup:true});assert.match((await a.get('loginErr')).msg,/taken/);
 const resumed=await connect(login.token);try{assert((await resumed.get('welcome')).member);resumed.send({t:'ecMe'});assert.equal((await resumed.get('ecMe')).wallet.pence,0)}finally{resumed.ws.close()}
 a.send({t:'logoff',token:login.token});assert.equal((await a.get('you')).member,false);a.send({t:'ecExchange',pence:5,nonce:me.wallet.nonce});await new Promise(r=>setTimeout(r,200));assert(!a.messages.some(m=>m.t==='ecExchanged'));
 console.log('ACCOUNT SOCKET PASS: anonymous writes blocked, explicit signup, existing-name guard, token resume and logged-off exchange blocked');
}finally{a.ws.close()}
