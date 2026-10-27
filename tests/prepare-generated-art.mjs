// Mechanical resampling/encoding ONLY. All illustrations originate in image_gen.
// Usage: node tests/prepare-generated-art.mjs /absolute/generated-images/session
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url)),source=process.argv[2];
if(!source||!path.isAbsolute(source))throw Error('Pass the built-in generated-images session directory');
const art=path.join(root,'app/public/art'),folders=process.argv.slice(3);
const selected=folders.length?folders:['box-v2','print-v3','posters-v4','magazines-v2'];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
let count=0,bytes=0;
try{const page=await browser.newPage();for(const folder of selected){
 if(!/^[a-z]+-v\d+$/.test(folder))throw Error('Invalid art folder');
 const dir=path.join(art,folder),manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
 for(const entry of manifest.assets){
  const input=entry.source.startsWith('../')?path.resolve(dir,entry.source):path.join(source,entry.source);
  const raw=await fs.readFile(input),mime=input.endsWith('.webp')?'image/webp':'image/png';
  const result=await page.evaluate(async({src,width,quality})=>{
   const im=new Image();im.src=src;await im.decode();
   const c=document.createElement('canvas');c.width=width;c.height=Math.round(width*im.naturalHeight/im.naturalWidth);
   const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,0,0,c.width,c.height);
   return{url:c.toDataURL('image/webp',quality),width:c.width,height:c.height};
  },{src:'data:'+mime+';base64,'+raw.toString('base64'),width:entry.width||320,quality:manifest.quality||.72});
  const encoded=Buffer.from(result.url.split(',')[1],'base64');await fs.writeFile(path.join(dir,entry.file),encoded);count++;bytes+=encoded.length;
  entry.width=result.width;entry.height=result.height;entry.bytes=encoded.length;
 }
 await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(folder,manifest.assets.length,'encoded');
}}finally{await browser.close()}
console.log('PASS',count,'bitmaps;',bytes,'bytes; no artwork drawn by this script');
