// Mechanical asset optimisation only; artwork itself is generated/edited with image_gen.
import{chromium}from'playwright';import fs from'node:fs';import path from'node:path';
const root=path.resolve(import.meta.dirname,'../app/public/art/box-v1');fs.mkdirSync(root,{recursive:true});
const source='/home/jackm/.codex/generated_images/01a15e31-1d27-7042-9cea-2bda1d140045/';
const files=[['kart','exec-f61461e3-edfc-4e7c-a993-9a5eccfce777.png'],['spy','exec-8adde8a9-0fa6-4816-b96d-978529cb1cfc.png'],['wombat','exec-941f0797-260e-4c51-abe2-7362a5183503.png']];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{const p=await browser.newPage();for(const[id,file]of files){const input='data:image/png;base64,'+fs.readFileSync(source+file).toString('base64');const encoded=await p.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=320;c.height=Math.round(320*im.height/im.width);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/webp',.72).split(',')[1]},input);fs.writeFileSync(path.join(root,id+'.webp'),Buffer.from(encoded,'base64'));console.log(id,Buffer.from(encoded,'base64').length+' bytes')}}finally{await browser.close()}
