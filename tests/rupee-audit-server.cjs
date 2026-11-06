// Disposable-server instrumentation: record every Rupee balance write and its
// call stack, followed by the production ledger source. Never load on real data.
const assert=require('node:assert/strict'),Module=require('node:module');
if(!/\/server\.js$/.test(process.argv[1]||''))return;
assert(/^\/tmp\//.test(process.env.DATA_DIR||''),'Rupee audit needs disposable /tmp data');
const compile=Module.prototype._compile;
Module.prototype._compile=function(source,file){
 if(/\/app\/mods\/econ\.js$/.test(file)){
  source=source.replace('a.name = c.member;',`if(!Object.getOwnPropertyDescriptor(a,'bal').get){let bal=a.bal;console.log('MONEY INIT',JSON.stringify({at:Date.now(),name:a.name,bal}));Object.defineProperty(a,'bal',{enumerable:true,configurable:true,get(){return bal},set(next){console.log('MONEY CHANGE',JSON.stringify({at:Date.now(),name:a.name,before:bal,after:next,delta:next-bal,stack:new Error().stack}));bal=next}});}a.name = c.member;`);
  source=source.replace('const k = a.name.toLowerCase(), now = Date.now();',"const k = a.name.toLowerCase(), now = Date.now();if(src==='play')console.log('MONEY PLAY ATTEMPT',JSON.stringify({at:now,name:a.name,rule,last:lastEv.get(k)?.[src],count:a.caps[src]||0}));");
  source=source.replace('a.log.push([Date.now(), amt, code,',"console.log('MONEY SOURCE',JSON.stringify({at:Date.now(),name:a.name,amt,code,note,bal:a.bal,secrets:a.sec}));a.log.push([Date.now(), amt, code,");
 }
 return compile.call(this,source,file);
};
