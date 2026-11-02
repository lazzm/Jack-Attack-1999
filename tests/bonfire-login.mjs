// Actual login/profile protocol for a disposable, already provisioned visual/test account.
import WebSocket from '../app/node_modules/ws/wrapper.mjs';
import {gunzipSync} from 'node:zlib';
export async function bonfireLogin(base,password){
 const session=await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace(/^http/,'ws')+'/ws',{origin:new URL(base).origin});let token;const timer=setTimeout(()=>{ws.close();reject(Error('Visual fixture authentication timed out'))},15000);ws.on('open',()=>ws.send(JSON.stringify({t:'hello',cid:'bonfire-visual-fixture'})));ws.on('error',reject);ws.on('message',data=>{const m=JSON.parse(data);if(m.t==='welcome')ws.send(JSON.stringify({t:'login',name:'Jack',pass:password}));if(m.t==='loginErr')reject(Error(m.msg));if(m.t==='loginOk'){token=m.token;ws.send(JSON.stringify({t:'rmGet',since:0}));}if(m.t==='rmData'||m.t==='rmNone'){clearTimeout(timer);let profile={};if(m.data){const b=Buffer.from(m.data,'base64');profile=JSON.parse((m.enc==='gzip'?gunzipSync(b):b).toString());}ws.close();resolve({token,profile,ts:m.ts||0,rev:m.ownerRev||0});}});});
 const o={...session.profile,jhp_token:session.token,jhp_everbooted:'1',jhp_off:'0',jhp_last:String(Date.now()),jhp_roam_who:'Jack',jhp_roam_ts:String(session.ts),jhp_roam_ownerRev:String(session.rev),jhp_hs_stand:JSON.stringify({t:Date.now(),p:{x:-60,y:210,z:-74,rx:8,ry:0,lvl:'G',seat:0}})};
 return {cookies:[],origins:[{origin:new URL(base).origin,localStorage:Object.entries(o).map(([name,value])=>({name,value:String(value)}))}]};
}
