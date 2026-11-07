// Throwaway-server-only CSP denial fixture. Normal responses keep the actual
// application's policy; one test cookie adds a worker restriction.
if(process.env.LIGHT_WORKER_CSP_TEST==='1'){
 const http=require('node:http'),writeHead=http.ServerResponse.prototype.writeHead;
 http.ServerResponse.prototype.writeHead=function(...args){
  if(/(?:^|;\s*)light_worker_test=blocked(?:;|$)/.test(this.req?.headers.cookie||'')){
   const index=typeof args[1]==='string'?2:1,headers=args[index],key=headers&&Object.keys(headers).find(k=>k.toLowerCase()==='content-security-policy');
   if(key)args[index]={...headers,[key]:headers[key]+"; worker-src 'none'"};
  }
  return writeHead.apply(this,args);
 };
}
