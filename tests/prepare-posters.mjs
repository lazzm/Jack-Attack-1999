// Mechanical downscaling only; complete artwork and typography come from image_gen.
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
const dir=path.resolve(import.meta.dirname,'../app/public/art/posters-v3');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const source=process.argv[2];if(!source)throw Error('Pass the generated-images directory');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {const page=await browser.newPage();for(const [name,asset] of Object.entries(manifest.assets)){
 const src='data:image/png;base64,'+fs.readFileSync(path.join(source,asset.source)).toString('base64');
 const data=await page.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=384;c.height=538;c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/webp',.84)},src);
 const bytes=Buffer.from(data.split(',')[1],'base64');fs.writeFileSync(path.join(dir,asset.file),bytes);console.log(name,bytes.length);
}}finally{await browser.close()}
