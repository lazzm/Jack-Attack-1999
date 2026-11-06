/* Static interior atlas weights. One worker for the house; no WebGL or game state. */
(function(){
 'use strict';
 const jobs=[];let timer=0;
 const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
 function* bake(d){
  const {id,charts,w,h,bounds,windows,main,bluePoints,alphaPoints,accent,footprints,ceiling}=d;
  const [x0,x1,z0,z1,cy,fy]=bounds,light=new Uint8Array(w*h*4),ao=new Uint8Array(w*h*4),pad=2;ao.fill(255);let pixels=0;
  const lamp=(points,px,py,pz,n)=>{let a=0;for(const p of points){const dx=p[0]-px,dy=p[1]-py,dz=p[2]-pz,d2=dx*dx+dy*dy+dz*dz;if(d2>=220900)continue;const dist=Math.sqrt(d2),cos=Math.max(0,(dx*n[0]+dy*n[1]+dz*n[2])/Math.max(1,dist));a+=1/(1+d2/12100)*(.12+.88*cos)*(1-smooth(270,470,dist))}return Math.min(1,a)};
  for(const c of charts)for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++){
   const n=c.n,u=c.u0+(c.u1-c.u0)*Math.max(0,Math.min(1,(x-pad)/(c.w-pad*2-1))),v=c.v0+(c.v1-c.v0)*Math.max(0,Math.min(1,(y-pad)/(c.h-pad*2-1)));
   const px=c.axis===0?(c.dist-n[1]*v-n[2]*u)/n[0]:u,py=c.axis===1?(c.dist-n[0]*u-n[2]*v)/n[1]:v,pz=c.axis===0?u:c.axis===1?v:(c.dist-n[0]*u-n[1]*v)/n[2];
   const stairFloor=id==='landing'&&px>=328&&pz>=250&&pz<=600?fy+(pz-250)*.8:fy,dx=Math.max(0,Math.min(px-x0,x1-px)),dz=Math.max(0,Math.min(pz-z0,z1-pz)),dy=Math.max(0,Math.min(py-(ceiling?ceiling[0]+ceiling[1]*px+ceiling[2]*pz:cy),stairFloor-py)),edge=c.axis===1?Math.min(dx,dz):Math.min(c.axis===0?dz:dx,dy);
   let shade=(.58+.42*smooth(0,72,edge))*(.72+.28*smooth(0,12,edge));
   if(id==='landing'&&py>fy+4&&c.axis===1&&c.v1-c.v0<45)shade*=.72+.28*smooth(0,16,pz-c.v0);
   const contact=1-smooth(0,c.axis===1?8:95,Math.abs(fy-py));if(contact>0)for(const b of footprints){const fx=Math.max(b[0]-px,0,px-b[1]),fz=Math.max(b[2]-pz,0,pz-b[3]),d2=fx*fx+fz*fz;if(d2<484)shade*=1-.58*(1-smooth(0,22,Math.sqrt(d2)))*contact}
   const i=((c.y+y)*w+c.x+x)*4,dither=(((i/4*13)%17)/16-.5)*.8;ao[i]=ao[i+1]=ao[i+2]=Math.round(Math.max(.14,shade)*255);ao[i+3]=255;
   let sky=0;for(const a of windows){const lx=(a.axis===0?a.at:(a.u0+a.u1)/2)-px,lz=(a.axis===2?a.at:(a.u0+a.u1)/2)-pz,ly=(a.y0+a.y1)/2-py,d2=lx*lx+ly*ly+lz*lz,dist=Math.sqrt(d2),cos=Math.max(0,(lx*n[0]+ly*n[1]+lz*n[2])/Math.max(1,dist));sky+=1/(1+d2/24025)*(.23+.77*cos)}
   light[i]=Math.min(255,Math.round(sky*255+dither));light[i+1]=Math.round(lamp(main,px,py,pz,n)*255);light[i+2]=Math.round(lamp(bluePoints,px,py,pz,n)*(accent?1:.8)*255);light[i+3]=Math.round(lamp(alphaPoints,px,py,pz,n)*.8*255);
   if(++pixels%32===0)yield;
  }
  return {light,ao};
 }
 function run(){timer=0;const start=performance.now(),job=jobs[0];let result;do{result=job.work.next()}while(!result.done&&performance.now()-start<3);const ms=performance.now()-start;job.cpu+=ms;job.max=Math.max(job.max,ms);if(result.done){jobs.shift();const {light,ao}=result.value;postMessage({id:job.id,light,ao,weightsMs:job.cpu,maxSliceMs:job.max},[light.buffer,ao.buffer])}if(jobs.length)timer=setTimeout(run,0)}
 self.onmessage=({data})=>{jobs.push({id:data.id,work:bake(data),cpu:0,max:0});if(!timer)timer=setTimeout(run,0)};
})();
