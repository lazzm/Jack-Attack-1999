/* Sparse registration profiles; backed-up resets remain restricted to test. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const roam=require('./roam.js');
let ctx;
const eligible=c=>c?.member?.toLowerCase()==='test'&&ctx.member(c)?.starterTest===1;
function upgrade(c){
  if(!eligible(c))return;
  const mods=ctx.state.mods,p=mods.rm?.p?.test;
  if(p?.f&&Object.keys(p.f).some(k=>k.startsWith('cart.'))){
    const dir=path.join(process.env.DATA_DIR||path.join(__dirname,'..','data'),'test-backups');fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'inherited-finds-'+Date.now()+'-'+crypto.randomBytes(6).toString('hex')+'.json'),JSON.stringify(p.f),{flag:'wx',mode:0o600});
    for(const id of Object.keys(p.f))if(id.startsWith('cart.'))delete p.f[id];ctx.markDirty();
  }
  roam.upgradeStarter(c.member,mods.pmx?.p?.test?.o||[]);
}
function clearProgress(c){
  const mods=ctx.state.mods,a=mods.econ?.acct?.test;
  // Preserve daily caps, exchange slips, chores and shared-world obligations.
  if(a){a.bal=0;if(a.wallet)a.wallet.pence=0;}
  if(mods.rm?.p)mods.rm.p.test={f:{},best:{},n:{},coin:mods.rm.p.test?.coin||{day:'',got:0}};
  if(mods.pmx?.p)mods.pmx.p.test={o:[],day:mods.pmx.p.test?.day||'',n:mods.pmx.p.test?.n||0};
  for(const[,cc]of ctx.clients)if(cc.member?.toLowerCase()==='test'){cc.rmRun=null;cc.roamUp=null;}
  ctx.markDirty();
}
module.exports={
 name:'starter',types:['testReset'],
 init(x){ctx=x;x.on('hello',(_ws,c)=>upgrade(c));x.on('login',(c,isNew)=>{
   if(!isNew){upgrade(c);return}if(c.member?.toLowerCase()!=='test'){ctx.member(c).starterSparse=1;ctx.markDirty();roam.seedNewPlayer(c.member);return;}
   ctx.member(c).starterTest=1;roam.seedStarter(c.member);clearProgress(c);
 });},
 handle(ws,c,m){
   if(!eligible(c)||m.confirm!=='RESET TEST')return ctx.send(ws,{t:'testResetResult',ok:false,msg:'Only the designated test account can reset its test save.'});
   if(c.testResetAt&&Date.now()-c.testResetAt<10000)return ctx.send(ws,{t:'testResetResult',ok:false,msg:'Please wait ten seconds before resetting again.'});
   const mods=ctx.state.mods;
   // Back up only this account's affected records, never another player's data.
   const dir=path.join(process.env.DATA_DIR||path.join(__dirname,'..','data'),'test-backups');
   fs.mkdirSync(dir,{recursive:true});
   fs.writeFileSync(path.join(dir,'test-'+Date.now()+'-'+crypto.randomBytes(6).toString('hex')+'.json'),JSON.stringify({econ:mods.econ?.acct?.test,rm:mods.rm?.p?.test,pmx:mods.pmx?.p?.test}),{flag:'wx',mode:0o600});
   roam.seedStarter(c.member,true);clearProgress(c);c.testResetAt=Date.now();
   ctx.send(ws,{t:'testResetResult',ok:true,msg:'Test room, media, local game saves and balances reset. Daily limits and shared-world records are kept.'});
 }
};
