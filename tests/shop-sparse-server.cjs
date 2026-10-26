// Disposable QA server only: authenticated credit fixture, never loaded by the app.
const path=require('node:path');
if(!/^\/tmp\//.test(process.env.DATA_DIR||'')||!/^180(?:8[0-9]|9[0-9])$/.test(process.env.PORT||'')||process.env.ADMIN_TOKEN!=='testtoken')throw Error('Use PORT 18080-18099, DATA_DIR under /tmp and ADMIN_TOKEN=testtoken');
const http=require('http');const create=http.createServer;
http.createServer=function(handler){return create.call(this,(req,res)=>{
 if(req.url.startsWith('/admin/qa-credit')&&req.method==='POST'){
  if(req.headers['x-admin-token']!=='testtoken'){res.writeHead(403);return res.end()}
  const econ=require('../app/mods/econ.js').api;
  const name=new URL(req.url,'http://localhost').searchParams.get('name');const a=econ.acctByKey(name.toLowerCase());
  if(!a){res.writeHead(404);return res.end('No account')}
  econ.credit(a,5000,'qa','Throwaway test funding');econ.meToAll(a);res.end('credited');return;
 }
 handler(req,res);
})};

process.chdir(path.resolve(__dirname,'../app'));require('../app/server.js');
