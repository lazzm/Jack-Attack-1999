// A complete test room for renderer/object audits. Fresh-story/signup coverage uses roomFixture directly.
import assert from 'node:assert/strict';
import {roomFixture} from './room-fixture.mjs';
export async function provisionedRoom(base,options={}){
 assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Disposable local server only');
 const account=options.account||'Qa'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),password=options.password||'Throwaway-1999';
 const r=await fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:account,pass:password})});
 assert(r.ok,'Could not provision a fresh test account: '+r.status);
 return roomFixture(base,{...options,account,password,signup:false});
}
