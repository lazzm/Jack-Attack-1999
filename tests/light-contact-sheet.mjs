// Comparison artifact only. Source captures remain at their native 1366 x 860 raster.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const after=process.argv[2]||'after',root=new URL('./shots/light/round2/',import.meta.url),rooms=['bedroom','landing','hall','cupboard','lounge','kitchen'];
await mkdir(root,{recursive:true});
const html=`<!doctype html><meta charset="utf-8"><title>Indoor lighting comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#202026;color:#eee;font:14px monospace;width:1368px}.head,.row{display:grid;grid-template-columns:repeat(4,342px)}.head div{padding:12px;text-align:center;font-weight:bold}figure{margin:0;position:relative;height:239px}figcaption{height:24px;padding:4px 8px;background:#33333b}img{display:block;width:342px;height:215px;object-fit:contain}</style><div class="head"><div>MIDDAY · HEAD 056f5f5</div><div>MIDDAY · ${after}</div><div>NIGHT · HEAD 056f5f5</div><div>NIGHT · ${after}</div></div>${rooms.map(room=>`<div class="row">${['midday','night'].flatMap(phase=>['before',after].map(tag=>`<figure><figcaption>${room} · ${phase} · ${tag==='before'?'before':'after'}</figcaption><img src="${tag}/${phase}-${room}.jpg"></figure>`)).join('')}</div>`).join('')}`;
const path=new URL(`contact-${after}.html`,root);await writeFile(path,html);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{const page=await browser.newPage({viewport:{width:1368,height:1476},deviceScaleFactor:1});await page.goto(path.href);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth===1366));await page.screenshot({path:fileURLToPath(new URL(`contact-${after}.png`,root)),fullPage:true});console.log(fileURLToPath(new URL(`contact-${after}.png`,root)))}finally{await browser.close()}
