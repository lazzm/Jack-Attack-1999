/**
 * Art inventory + regression gallery. Never starts a server.
 *
 * Main must start app/server.js with disposable /tmp DATA_DIR, then run:
 *   node tests/art-gallery.mjs http://localhost:18080
 *   node tests/art-gallery.mjs http://localhost:18080 --all-world
 *   node tests/art-gallery.mjs http://localhost:18080 --world-only
 *   node tests/art-gallery.mjs --source-only
 *
 * Output (independent of cwd): tests/shots/art-gallery/{report.json,index.html,
 * source,prints,sheets,world}. Existing output is never deleted. index.html lists
 * only this run, so stale PNGs cannot masquerade as newly captured coverage.
 *
 * Default: every on-disk /art bitmap, every PrintArt.files entry, actual material
 * canvases, all reading pages, all shop compositors, and representative physical
 * shelf/hand/inspection views. --all-world also captures each available physical
 * art prop. Posters stay on walls; unavailable/future/away props are reported.
 * Narrow captures resize the same room, not a separate phone/device-policy test.
 * This is an artifact/structural regression, not OCR or a pixel-baseline test.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PUBLIC = path.join(ROOT, 'app/public');
const OUTPUT = path.join(HERE, 'shots/art-gallery');
const BITMAP = /\.(?:webp|png|jpe?g|gif|avif)$/i;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const safeName = value => String(value).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export function localBase(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'http:', 'Use the disposable HTTP localhost server');
  assert(['localhost', '127.0.0.1'].includes(url.hostname), 'Use disposable localhost data only');
  assert(url.port && Number(url.port) >= 1024, 'Supply the disposable server\'s explicit test port');
  assert(!url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'Supply a plain localhost origin');
  return url.origin;
}

export function parseArgs(args) {
  const options = {allWorld:false, worldOnly:false, sourceOnly:false, help:false, base:null};
  for (const arg of args) {
    if (arg === '--all-world') options.allWorld = true;
    else if (arg === '--world-only') options.worldOnly = true;
    else if (arg === '--source-only') options.sourceOnly = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (!arg.startsWith('-') && !options.base) options.base = localBase(arg);
    else throw Error('Unknown argument: ' + arg);
  }
  assert(options.help || options.sourceOnly || options.base, 'Pass http://localhost:PORT (disposable data), or --source-only');
  return options;
}

// Both historical manifests (arrays) and newer maps are in use.
export function manifestEntries(manifest, manifestURL) {
  assert(manifest.assets && typeof manifest.assets === 'object', manifestURL + ': missing assets');
  return Object.entries(manifest.assets).map(([id, raw]) => {
    const asset = typeof raw === 'string' ? {file:raw} : raw;
    assert(asset && typeof asset.file === 'string', manifestURL + ': missing file for ' + id);
    const base = new URL(manifestURL, 'http://localhost');
    const url = new URL(asset.file, base);
    assert(url.origin === base.origin && url.pathname.startsWith('/art/') && !url.search && !url.hash,
      manifestURL + ': asset must stay under /art/: ' + asset.file);
    const decoded = decodeURIComponent(url.pathname);
    assert(!decoded.includes('..') && !decoded.includes('\\'), 'Invalid manifest asset path');
    return {id:asset.key || asset.id || asset.game || (Array.isArray(manifest.assets) ? path.basename(asset.file, path.extname(asset.file)) : id),
      url:url.pathname, manifest:manifestURL, source:asset.source || null, prompt:asset.prompt || null,
      width:asset.width || null, height:asset.height || null,...(asset.bytes!=null?{bytes:asset.bytes}:{})};
  });
}

export async function auditSources(publicDir = PUBLIC) {
  const root = await realpath(publicDir), files = [], manifests = [], failures = [], warnings = [];
  async function walk(dir) {
    for (const entry of (await readdir(dir, {withFileTypes:true})).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) { failures.push('Symlink in artwork tree: ' + path.relative(root, file)); continue; }
      if (entry.isDirectory()) await walk(file);
      else if (BITMAP.test(entry.name) || entry.name === 'manifest.json') {
        const bytes = await readFile(file), url = '/' + path.relative(root, file).split(path.sep).join('/');
        if (entry.name === 'manifest.json') {
          try {
            const doc = JSON.parse(bytes.toString('utf8'));
            manifests.push({url, sha256:hash(bytes), method:doc.method || null, encoding:doc.encoding || null,
              assets:manifestEntries(doc, url)});
          } catch (error) { failures.push(url + ': ' + error.message); }
        } else files.push({url, bytes:bytes.length, sha256:hash(bytes), manifests:[]});
      }
    }
  }
  await walk(path.join(root, 'art'));
  const byURL = new Map(files.map(file => [file.url, file]));
  for (const manifest of manifests) for (const asset of manifest.assets) {
    const file = byURL.get(asset.url);
    if (!file) failures.push('Manifest references missing bitmap: ' + asset.url);
    else {
      file.manifests.push({manifest:manifest.url, id:asset.id, source:asset.source, prompt:asset.prompt,
        width:asset.width, height:asset.height});
      if(asset.bytes!=null&&asset.bytes!==file.bytes)failures.push('Manifest byte count differs: '+asset.url);
      if (!asset.source) warnings.push('Original source filename not recorded: ' + asset.url);
    }
  }
  for (const file of files) if (!file.manifests.length) warnings.push('Bitmap has no manifest entry: ' + file.url);
  // Record static consumers without printing the embedded bitmap data itself.
  const scripts = (await readdir(path.join(root, 'js'))).filter(name => name.endsWith('.js')).sort();
  const consumers = [];
  for (const name of scripts) {
    if (name === 'print-art-data.js') continue;
    const source = await readFile(path.join(root, 'js', name), 'utf8');
    const refs = [...new Set(source.match(/\/art\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|gif|avif)/g) || [])];
    for (const url of refs) if (!byURL.has(url)) failures.push(name + ' references missing bitmap: ' + url);
    if (refs.length || /PrintArt\.(?:paint|svg|key|files)|PrintArt\?\.(?:paint|svg|key|files|has)/.test(source))
      consumers.push({file:'js/' + name, urls:refs, printArt:/PrintArt/.test(source)});
  }
  // Embedded illustrations are meant to be byte-for-byte copies of print-v2.
  const embedded = [];
  try {
    const source = await readFile(path.join(root, 'js/print-art-data.js'), 'utf8');
    const match = /window\.PrintArtData\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(source);
    assert(match, 'Unrecognised PrintArtData assignment');
    for (const [id, uri] of Object.entries(JSON.parse(match[1]))) {
      const data = /^data:image\/([\w+.-]+);base64,([\s\S]+)$/.exec(uri);
      assert(data, 'Invalid embedded bitmap: ' + id);
      const bytes = Buffer.from(data[2], 'base64'), url = '/art/print-v2/' + id + '.' + data[1];
      const record = {id, url, bytes:bytes.length, sha256:hash(bytes), matchesFile:byURL.get(url)?.sha256 === hash(bytes)};
      embedded.push(record);
      if (!record.matchesFile) failures.push('Embedded illustration differs from standalone file: ' + id);
    }
  } catch (error) {
    if (error.code === 'ENOENT') warnings.push('No legacy PrintArtData file');
    else failures.push(error.message);
  }
  // Build the actual runtime files map with all I/O suspended. This catches
  // missing generated files in --source-only too, even when their URLs are
  // assembled dynamically and do not occur as literal strings in the source.
  const declared=[];
  try {
    const source=await readFile(path.join(root,'js/print-art.js'),'utf8');
    const window={PrintArtData:Object.fromEntries(embedded.map(item=>[item.id,'']))};
    runInNewContext(source,{window,AbortController,fetch:()=>new Promise(()=>{}),setTimeout:()=>0,clearTimeout:()=>{}},
      {timeout:1500,filename:'print-art.js (inventory, I/O disabled)'});
    assert(window.PrintArt?.files,'PrintArt.files is missing');
    for(const [key,src]of Object.entries(window.PrintArt.files)){
      assert(typeof src==='string','Non-string PrintArt.files URL: '+key);
      if(src.startsWith('data:')){declared.push({key,url:'[embedded]',present:true});continue;}
      const url=new URL(src,'http://localhost');
      assert(url.origin==='http://localhost'&&url.pathname.startsWith('/art/'),'Non-local PrintArt.files URL: '+key);
      const file=byURL.get(url.pathname);declared.push({key,url:url.pathname,present:!!file,sha256:file?.sha256||null});
      if(!file)failures.push('PrintArt.files references missing bitmap: '+key+' -> '+url.pathname);
    }
  } catch(error) {
    if(error.code!=='ENOENT')failures.push('Runtime files inventory: '+error.message);
  }
  return {files, manifests, embedded, declared, consumers, failures, warnings};
}

// Observe real compositor calls from the first game script onward. This keeps
// evidence of a canvas that was painted with a fallback and never refreshed
// after its bitmap decoded. The wrappers preserve arguments and return values.
export function installPrintProbe() {
  const paints = new WeakMap(), svgCalls = new Map();
  window.__artPrintProbe = {paints, svgCalls};
  const wrap = api => {
    for (const method of ['paint','magazine']) {
      if (typeof api?.[method] !== 'function') continue;
      const original = api[method];
      api[method] = function (context, id, ...args) {
        const result = original.call(this, context, id, ...args);
        if (context?.canvas) {
          let calls = paints.get(context.canvas); if (!calls) paints.set(context.canvas, calls = new Map());
          const key = typeof id === 'string' ? id : id?.id;
          calls.set(method + ':' + key, {method, key, ok:!!result,
            rectangle:method === 'paint'?args.slice(0,4):null});
        }
        return result;
      };
    }
    if (typeof api?.svg === 'function') {
      const original=api.svg;
      api.svg=function (id,...args) { const result=original.call(this,id,...args); svgCalls.set(id,{key:id,ok:!!result}); return result; };
    }
    return api;
  };
  if (window.PrintArt) window.PrintArt = wrap(window.PrintArt);
  else Object.defineProperty(window, 'PrintArt', {configurable:true, set(api) {
    Object.defineProperty(window,'PrintArt',{value:wrap(api),configurable:true,writable:true,enumerable:true});
  }});
}

// Executed inside the authenticated game. Canvas/Image references stay in-page;
// only metadata and one PNG at a time cross the browser boundary.
async function installGallery() {
  const entries = new Map(), failures = [], aliases = [];
  const G = window.__artGallery = {entries, failures, aliases};
  G.add = (group, id, image, metadata = {}) => {
    const key = group + ':' + id;
    if (entries.has(key)) return entries.get(key);
    const width = image?.naturalWidth || image?.width || 0, height = image?.naturalHeight || image?.height || 0;
    if (!width || !height) { failures.push('Empty bitmap ' + key); return null; }
    const entry = {key, group, id, width, height, image, ...metadata};
    entries.set(key, entry); return entry;
  };
  G.load = async src => {
    const url = new URL(src, location.href);
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== location.origin) throw Error('External art URL: ' + url.href);
    for(const [key,file]of Object.entries(window.PrintArt?.files||{}))if(new URL(file,location.href).href===url.href){
      const decoded=PrintArt.image(key);if(decoded?.naturalWidth)return decoded;
    }
    const image = new Image(); image.src = url.href;
    await Promise.race([image.decode(), new Promise((_, reject) => setTimeout(() => reject(Error('Image decode timeout: ' + src.slice(0,180))), 30000))]);
    return image;
  };
  G.texture = (group, id, texture, metadata = {}) => {
    if (!texture?.image) return;
    G.add(group, id, texture.image, {texture:{minFilter:texture.minFilter, magFilter:texture.magFilter,
      anisotropy:texture.anisotropy, generateMipmaps:texture.generateMipmaps}, ...metadata});
  };
  G.metadata = () => [...entries.values()].map(({image, ...entry}) => entry);
  G.png = key => {
    const entry = entries.get(key), canvas = document.createElement('canvas');
    canvas.width = entry.width; canvas.height = entry.height;
    canvas.getContext('2d').drawImage(entry.image, 0, 0);
    const data = canvas.toDataURL('image/png'); canvas.width = canvas.height = 1; return data.split(',')[1];
  };
  // Same native font embedding as pm-gl.js; artwork/layout comes only from the
  // production compositor. This helper rasterises its returned SVG, not a mock.
  const b64 = buffer => { let s=''; const bytes=new Uint8Array(buffer); for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(s); };
  const fonts = await Promise.all(['anton','bangers'].map(async name => {
    const response = await fetch('/fonts/' + name + '.woff2');
    if (!response.ok) throw Error('Missing compositor font: ' + name);
    return '@font-face{font-family:' + (name === 'anton' ? 'Anton' : 'Bangers') + ';src:url(data:font/woff2;base64,' + b64(await response.arrayBuffer()) + ')}';
  }));
  G.svg = async (group, id, svg, metadata = {}) => {
    // PM.shopArt deliberately returns a normal <img> for monthly issues.
    if (/^\s*<img\b/i.test(svg)) {
      const doc = new DOMParser().parseFromString(svg, 'text/html'), image = doc.querySelector('img');
      if (!image?.getAttribute('src')) throw Error('Missing shop image: ' + id);
      return G.add(group, id, await G.load(image.getAttribute('src')), {compositor:true, ...metadata});
    }
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw Error('Invalid compositor SVG: ' + id);
    const root = doc.documentElement;
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const vb = (root.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
    if (vb.length !== 4 || !vb.every(Number.isFinite) || vb[2] <= 0 || vb[3] <= 0) throw Error('Missing SVG dimensions: ' + id);
    const width = Math.min(768, Math.round(vb[2]*2)), height = Math.round(width*vb[3]/vb[2]);
    root.setAttribute('width', width); root.setAttribute('height', height);
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style'); style.textContent = fonts.join(''); root.prepend(style);
    // Images in standalone SVGs cannot fetch other files. Record and embed any
    // local dependencies, as PrintArt.ready/svg does for generated illustrations.
    const dependencies = [];
    for (const image of root.querySelectorAll('image')) {
      const href = image.getAttribute('href') || image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href || href.startsWith('data:')) continue;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) throw Error('External SVG dependency: ' + url.href);
      dependencies.push(url.pathname);
      const response = await fetch(url.href); if (!response.ok) throw Error('Missing SVG dependency: ' + url.pathname);
      const uri = 'data:' + (response.headers.get('content-type') || 'image/webp') + ';base64,' + b64(await response.arrayBuffer());
      image.setAttribute('href', uri); image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)], {type:'image/svg+xml'}));
    try { return G.add(group, id, await G.load(url), {compositor:true, embeddedDependencies:dependencies, ...metadata}); }
    finally { URL.revokeObjectURL(url); }
  };
}

async function captureCatalogue(page, source) {
  console.log('Art gallery: installing compositor capture');
  await page.evaluate(installGallery);
  console.log('Art gallery: compositor capture installed');
  // Every raw file, even when it is currently an unreferenced/stale asset.
  for (const [index,file] of source.files.entries()) { await page.evaluate(async file => {
    try {
      const G=window.__artGallery, image=await G.load(file.url);
      G.add('source',file.url,image,{url:file.url,sha256:file.sha256});
      for(const asset of file.manifests){
        if(asset.width&&image.naturalWidth!==asset.width)G.failures.push('Manifest width differs: '+file.url);
        if(asset.height&&image.naturalHeight!==asset.height)G.failures.push('Manifest height differs: '+file.url);
      }
    }
    catch (error) { window.__artGallery.failures.push(error.message); }
  }, file); if(index%25===24)console.log('Art gallery: source images '+(index+1)+'/'+source.files.length); }
  const declared = await page.evaluate(async () => {
    const G=window.__artGallery, declared=[], files=window.PrintArt?.files || {};
    for (const [key, raw] of Object.entries(files)) {
      const src=typeof raw==='string'?raw:raw?.src || raw?.url || raw?.file;
      const record={key,src:typeof src==='string'&&!src.startsWith('data:')?src:'[embedded]',has:!!window.PrintArt?.has(key),status:PrintArt.status?.[key]||null};
      declared.push(record);
      if(!src){G.failures.push('PrintArt.files has no image URL for '+key);continue;}
      try{G.add('declared',key,await G.load(src),{printKey:key,url:record.src});}
      catch(error){G.failures.push(key+': '+error.message);}
      if(!record.has)G.failures.push('PrintArt.has false after ready: '+key);
      if(record.status!=='generated')G.failures.push('PrintArt.status is '+record.status+' after ready: '+key);
    }
    if(!Object.keys(files).length)G.failures.push('PrintArt.files is missing/empty; generated-art hook required');
    // Older data remains part of the inventory, even if no new consumer uses it.
    for(const [id,src]of Object.entries(window.PrintArtData||{})){
      try{G.add('legacy',id,await G.load(src),{printKey:id});}catch(error){G.failures.push(error.message);}
    }
    const identities=[...RoomCat.GAMES.map(g=>g.id),...Discs.BOXES.map(b=>'pc.'+b.id),
      ...(window.ReadingBooks||[]).filter(b=>/^reading\.book\./.test(b.id)).map(b=>b.id),...MagazineCat.ISSUES.map(i=>i.id)];
    const resolutions=identities.map(id=>{const key=window.PrintArt?.key?.(id);return{id,key:key||null,declared:!!key&&Object.hasOwn(files,key),has:!!key&&!!PrintArt.has(key)};});
    for(const row of resolutions)if(!row.declared||!row.has)G.failures.push('Unresolved generated art: '+row.id+' -> '+row.key);
    return{files:declared,resolutions};
  });
  console.log('Art gallery: decoded '+source.files.length+' source files, '+declared.files.length+' declared prints');
  await page.evaluate(async () => {
    const G=window.__artGallery;
    for(const name of Object.keys(HouseArt.P).sort())G.texture('house-art',name,HouseArt.t(name),{api:'HouseArt.t'});
    for(const issue of MagazineCat.ISSUES)G.texture('issue-covers',issue.id,Magazines.cover(issue.id),{api:'Magazines.cover',title:issue.title});
    for(const doc of [...MagazineCat.ISSUES,...(window.ReadingBooks||[])])for(let n=0;n<doc.pages.length;n++){
      const texture=Magazines.pageTexture(doc,n);
      G.texture('reading-pages',doc.id+'.'+String(n+1).padStart(2,'0'),texture,{api:'Magazines.pageTexture',title:doc.pages[n].title,layout:texture.userData.layout});
      const layout=texture.userData.layout;
      if(layout&&(!Number.isFinite(layout.bottom)||layout.bottom>=layout.footer))G.failures.push('Page crosses footer: '+doc.id+'/'+n);
    }
  });
  // Production shop APIs cover every console ID (including the Super Ultra,
  // which has no bedroom rack model), PC disc, magazine and hardware listing.
  const shopIds = await page.evaluate(() => PM.CAT.ITEMS.map(item=>item.id));
  for (const id of shopIds) await page.evaluate(async id => {
    try {
      const item=PM.CAT.byId[id],svg=PM.shopArt(item);
      if(!svg)throw Error('No shop art for '+id);
      await window.__artGallery.svg('shop',id,svg,{api:'PM.shopArt',title:PM.titleOfShop(id)});
    } catch(error){window.__artGallery.failures.push(error.message);}
  }, id);
  return declared;
}

async function collectMaterials(page) {
  return page.evaluate(() => {
    const G=window.__artGallery, textureKeys=new Map(Object.entries(HouseKit.TEX).map(([key,texture])=>[texture,key])), textures=new Map(), things=[];
    const printCalls=texture=>[...(window.__artPrintProbe?.paints.get(texture?.image)?.values()||[])];
    const remember=(texture,key,use)=>{
      if(!textures.has(texture))textures.set(texture,{key,texture,uses:[]});
      textures.get(texture).uses.push(use);
    };
    for(const t of Object.values(House.THINGS)){
      if(!/^(?:pmb\.|pmd\.|pmf\.|media\.|reading\.|vhs\.|ch\.v\.|ch\.m\.)/.test(t.id)&&!['pm.catalogue','hs.pbook','hs.tvguide','mags'].includes(t.id))continue;
      const materialKeys=new Set();let meshes=0;
      t.obj.traverse(object=>{
        if(!object.isMesh||object.userData.contactShadow)return;
        meshes++;
        if(!Array.from(object.matrixWorld.elements).every(Number.isFinite))G.failures.push('Non-finite art geometry: '+t.id);
        for(const [slot,material]of [].concat(object.material||[]).entries()){
          const texture=material?.map;if(!texture?.image)continue;
          const key=texture.userData?.raster?.key||textureKeys.get(texture)||t.id+'.mesh'+meshes+'.face'+slot;
          materialKeys.add(key);
          remember(texture,key,{thing:t.id,mesh:meshes,material:slot});
        }
      });
      things.push({id:t.id,kind:t.kind,room:t.at.room,hidden:!!t.at.hide,state:t.st,snap:t.snap||null,
        label:typeof t.label==='function'?t.label():t.label,materials:[...materialKeys]});
    }
    // Generated packaging/labels can live on fixed meshes, outside THINGS.
    // Traverse the real room groups and include every canvas that used PrintArt.
    for(const room of Object.values(House.ROOMS))room.group?.traverse(object=>{
      if(!object.isMesh||object.userData.contactShadow)return;
      for(const [slot,material]of [].concat(object.material||[]).entries()){
        const texture=material?.map;
        if(!printCalls(texture).length)continue;
        remember(texture,textureKeys.get(texture)||room.id+'.'+object.name+'.'+slot,{room:room.id,mesh:object.name||null,material:slot});
      }
    });
    // Retain any prepared print whose consumer is currently hidden/unmounted;
    // its lack of mesh uses is explicit, rather than being called world coverage.
    for(const [key,texture]of Object.entries(HouseKit.TEX))if(printCalls(texture).length&&!textures.has(texture))textures.set(texture,{key,texture,uses:[]});
    for(const {key,texture,uses}of textures.values()){
      const paints=printCalls(texture);
      for(const call of paints)if(!call.ok&&Object.hasOwn(PrintArt.files,call.key))G.failures.push('Material retained fallback after artwork ready: '+key+' -> '+call.key);
      G.texture('materials',key,texture,{uses,paintCalls:paints,api:'actual mesh material.map'});
    }
    // All original Pixel Post pages, including lazy order/back faces.
    const leaves=House.THINGS['pm.catalogue']?.obj.userData.leaves||[];
    leaves.forEach((leaf,n)=>{for(const side of ['front','back'])G.texture('pixel-post',String(n+1).padStart(2,'0')+'.'+side,leaf[side].material.map,{api:'physical catalogue leaf'});});
    return things;
  });
}

const POSTERS = [
  {id:'posterfilm',eye:[-236,-96,40],target:[-236,-96,-56]},
  {id:'posterband',eye:[-178,-64,40],target:[-178,-64,-56]},
  {id:'postershuttle',eye:[-52,-82,40],target:[-52,-82,-56]},
  {id:'postergame',eye:[-180,-70,20],target:[-280,-70,20]},
  {id:'posterrobot',eye:[-10,-98,150],target:[-10,-98,250]}
];

async function captureWorld(fixture, options, report) {
  const {page,until,view}=fixture;
  const screenshot = async (name, metadata={}) => {
    const file='world/'+safeName(name)+'.png';
    await page.screenshot({path:path.join(OUTPUT,file),timeout:60000});
    report.world.push({file,...metadata,viewport:page.viewportSize(),...(await page.evaluate(()=>({mode:House.mode,held:House.held(),eye:{...House.P},
      reading:window.Magazines?.reading?{id:Magazines.reading.docId,phase:Magazines.reading.phase,page:Magazines.reading.page}:null})))});
  };
  const cleanup = async () => {
    if(await page.evaluate(()=>!!window.HousePause?.open))await page.keyboard.press('Escape');
    if(await page.evaluate(()=>House.mode==='inspect'||!!House.focused))await page.keyboard.press('q');
    // roomFixture.view uses an unfocused observer pose; it has no Q exit.
    if(await page.evaluate(()=>House.mode==='focus'&&!House.focused))await page.evaluate(()=>House._.setMode('walk'));
    await until(()=>House.mode==='walk'&&!House.focused);
    if(await page.evaluate(()=>!!House.held())){
      const id=await page.evaluate(()=>House.held());await page.evaluate(()=>House.putBack());
      await until(()=>!House.held());
      const deadline=Date.now()+15000;
      while(!await page.evaluate(id=>['rest','snap'].includes(House.THINGS[id].st),id)){
        assert(Date.now()<deadline,'Return animation timed out: '+id);await page.waitForTimeout(100);
      }
    }
    await page.evaluate(()=>House.hush());
  };
  await page.setViewportSize({width:1366,height:860});
  for(const [name,eye,target,level]of [
    ['pc-media-shelf-front',[-160,-45,10],[-265,-5,10],'U'],
    ['pc-media-shelf-oblique',[-170,-70,85],[-265,-8,10],'U'],
    ['reading-shelf-front',[-100,-65,165],[-155,-10,234],'U'],
    ['reading-shelf-oblique',[-210,-70,170],[-155,-10,234],'U'],
    ['console-rack-front',[-180,-10,55],[-234,28,-43],'U'],
    ['console-rack-oblique',[-140,-15,0],[-234,28,-43],'U'],
    ['vhs-stack',[-30,225,410],[-33,320,342],'G']
  ]){await cleanup();await view(eye,target,{level});await screenshot(name,{stage:'overview'});}
  await cleanup();
  for(const poster of POSTERS){
    await view(poster.eye,poster.target);await screenshot(poster.id+'-wall',{id:poster.id,stage:'wall'});
    await view([poster.eye[0],-55,poster.eye[2]],poster.target);
    await page.evaluate(()=>House._.setMode('walk'));
    // Real click enters the in-world paper focus, not a synthetic 2D viewer.
    await page.mouse.click(683,430);await until(()=>House.mode==='focus'&&House.focused);
    await page.waitForTimeout(750);await screenshot(poster.id+'-close',{id:poster.id,stage:'close-up',input:'central click'});
    assert.equal(await page.locator('.rm-view:not(.bye)').count(),0,'Poster opened an alternate HTML viewer');
    await cleanup();
  }
  const physical=await page.evaluate(()=>Object.values(House.THINGS).filter(t=>
    !t.at.hide&&(/^(?:pmb\.|media\.box\.|reading\.(?:book|school|mag)\.|vhs\.)/.test(t.id)||['mags','pm.catalogue','hs.pbook','hs.tvguide','ch.m.comic'].includes(t.id)))
    .map(t=>({id:t.id,kind:t.kind,room:t.at.room,at:{...t.at},h:t.h||20})));
  const representatives=['pmb.city','pmb.keepa','pmb.podracer','pmb.pm.os98','pmb.pm.gub','pmb.pm.mix','pmb.pm.netplanet',
    'media.box.n64.kart','media.box.n64.range','media.box.ps.run','media.box.ps.grav','media.box.gb.mon','media.box.md.zip','media.box.dc.dash',
    'reading.book.0','reading.book.1','reading.book.2','pm.catalogue','hs.tvguide','hs.pbook','vhs.robots','vhs.charts','vhs.dad'];
  const issue=physical.find(t=>/^pmb\.pm\.mag\./.test(t.id))||physical.find(t=>t.id==='reading.mag.bed');
  if(issue)representatives.push(issue.id);
  const chosen=options.allWorld?physical:representatives.map(id=>physical.find(t=>t.id===id)).filter(Boolean);
  report.physicalSelection={mode:options.allWorld?'all available physical art props':'representative',available:physical.map(t=>t.id),
    chosen:chosen.map(t=>t.id),unavailableRepresentatives:representatives.filter(id=>!physical.some(t=>t.id===id))};
  for(const item of chosen){
    console.log('Art gallery: physical '+item.id);
    await cleanup();
    // Keep the shelf context honest: these captures use each prop's real home.
    const {at}=item,level=at.room==='lounge'?'G':'U', target=[at.x,at.y-item.h/2,at.z];
    const eye=at.room==='lounge'?[at.x,225,at.z+100]
      :item.id.startsWith('media.box.')?[at.x,-35,at.z+100]
      :item.id.startsWith('pmb.')&&!item.id.startsWith('pmb.pm.mag.')?[at.x+100,-55,at.z+15]
      :[at.x+45,-55,at.z-100];
    await view(eye,target,{level});await screenshot(item.id+'-home',{id:item.id,stage:'home',placement:at});
    // A level view into open room prevents wall compression in heldPos().
    if(level==='G')await view([-30,225,500],[-30,225,420],{level});
    else await view([-100,-55,150],[-100,-55,40]);
    await page.evaluate(()=>House._.setMode('walk'));
    assert(await page.evaluate(id=>House.grab(id),item.id),'Could not grab '+item.id);
    await until(()=>House.held()!==null);await page.waitForTimeout(450);
    assert.equal(await page.evaluate(()=>House.held()),item.id);
    await screenshot(item.id+'-hand',{id:item.id,stage:'hand',input:'House.grab'});
    const reading=await page.evaluate(id=>Magazines.bindings.has(id),item.id);
    if(reading)await page.keyboard.press('f');
    else assert(await page.evaluate(id=>House.inspect(id),item.id),'Could not inspect '+item.id);
    await until(()=>House.mode==='inspect');await page.waitForTimeout(500);
    await screenshot(item.id+'-inspect-front',{id:item.id,stage:'inspect',input:reading?'F / production reader':'House.inspect'});
    if(reading){
      // CD issues have an inside-cover pocket before the first editorial page.
      for(let n=0;n<3&&await page.evaluate(()=>Magazines.reading.phase!=='pages');n++){
        await page.keyboard.press('f');await until(()=>!!Magazines.reading&&!Magazines.reading.flipping);
      }
      assert.equal(await page.evaluate(()=>Magazines.reading.phase),'pages','Reader did not reach pages');
    }
    else{for(let n=0;n<4;n++)await page.keyboard.press('r');}
    await page.waitForTimeout(350);await screenshot(item.id+(reading?'-open-pages':'-inspect-back'),{id:item.id,stage:reading?'open-pages':'inspect-back'});
    // Narrow/wide sizes are sampled for one object from each physical format.
    if(['media.box.n64.kart','media.box.ps.run','pmb.city','reading.book.1','pm.catalogue','vhs.robots',issue?.id].includes(item.id)){
      for(const size of [{width:390,height:844},{width:844,height:390},{width:1920,height:1080}]){
        await page.setViewportSize(size);await page.waitForTimeout(500);
        await screenshot(item.id+'-'+size.width+'x'+size.height,{id:item.id,stage:'resized-inspection'});
      }
      await page.setViewportSize({width:1366,height:860});await page.waitForTimeout(350);
    }
    await cleanup();
    assert.equal(await page.evaluate(id=>!!House.THINGS[id].at.hide,item.id),!!at.hide,'Return hid '+item.id);
  }
  await cleanup();
}

async function exportGallery(page, report) {
  const entries=await page.evaluate(()=>window.__artGallery.metadata()), groups=new Map();
  for(const [index,entry]of entries.entries()){
    if(index%50===0)console.log('Art gallery: exporting compositor '+index+'/'+entries.length);
    const folder=entry.group==='source'||entry.group==='declared'||entry.group==='legacy'?'source':'prints';
    entry.file=folder+'/'+String(index+1).padStart(4,'0')+'-'+safeName(entry.group+'-'+entry.id)+'.png';
    const base64=await page.evaluate(key=>window.__artGallery.png(key),entry.key);
    const bytes=Buffer.from(base64,'base64');entry.pngSha256=hash(bytes);
    await writeFile(path.join(OUTPUT,entry.file),bytes);
    if(!groups.has(entry.group))groups.set(entry.group,[]);groups.get(entry.group).push(entry);
  }
  report.entries=entries;
  for(const [group,members]of groups)for(let offset=0;offset<members.length;offset+=12){
    const batch=members.slice(offset,offset+12),file='sheets/'+safeName(group)+'-'+String(offset/12+1).padStart(2,'0')+'.png';
    const base64=await page.evaluate(({keys,title})=>{
      const G=window.__artGallery,c=document.createElement('canvas'),columns=4,cellW=384,cellH=440,header=60;
      c.width=columns*cellW;c.height=header+Math.ceil(keys.length/columns)*cellH;
      const g=c.getContext('2d');g.fillStyle='#ddd5c2';g.fillRect(0,0,c.width,c.height);
      g.fillStyle='#1d2c38';g.font='bold 25px Arial';g.fillText(title,20,38);
      keys.forEach((key,i)=>{const e=G.entries.get(key),x=(i%columns)*cellW,y=header+Math.floor(i/columns)*cellH;
        const scale=Math.min((cellW-28)/e.width,(cellH-86)/e.height),w=e.width*scale,h=e.height*scale;
        g.fillStyle='#a89e89';g.fillRect(x+10,y+4,cellW-20,cellH-14);
        g.drawImage(e.image,x+(cellW-w)/2,y+12+(cellH-86-h)/2,w,h);
        g.fillStyle='#172531';g.font='bold 14px Arial';
        const words=e.id.split(/(?<=[./_-])|\s+/);let line='',lines=[];
        for(const word of words){if(line&&g.measureText(line+word).width>cellW-30){lines.push(line);line=word;}else line+=word;}
        if(line)lines.push(line);while(lines.length>3){lines[lines.length-2]+=' '+lines.pop();}
        lines.forEach((line,n)=>g.fillText(line,x+16,y+cellH-63+n*16,cellW-32));
        g.font='12px Arial';g.fillText(e.width+' × '+e.height,x+16,y+cellH-10);
      });
      const data=c.toDataURL('image/png').split(',')[1];c.width=c.height=1;return data;
    },{keys:batch.map(e=>e.key),title:group+' · '+(offset+1)+'–'+(offset+batch.length)+' / '+members.length});
    await writeFile(path.join(OUTPUT,file),Buffer.from(base64,'base64'));
    report.sheets.push({group,file,keys:batch.map(e=>e.key)});
  }
}

async function writeIndex(report) {
  await writeFile(path.join(OUTPUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  const figure=(file,label)=>'<figure><a href="'+escapeHTML(file)+'"><img loading="lazy" src="'+escapeHTML(file)+'" alt="'+escapeHTML(label)+'"></a><figcaption>'+escapeHTML(label)+'</figcaption></figure>';
  const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Art regression gallery</title><style>body{margin:24px;background:#ddd5c2;color:#172531;font:16px Arial}a{color:#163d68}figure{margin:12px 0}img{max-width:100%;height:auto;border:1px solid #716858}figcaption{margin:6px 0 20px}details{margin:12px 0}pre{white-space:pre-wrap} .world{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}</style><h1>Art regression gallery</h1><p>'+escapeHTML(report.started)+' · '+escapeHTML(report.status)+' · <a href="report.json">JSON inventory and coverage</a></p><p>'+escapeHTML(report.scope.join(' '))+'</p>'
    +(report.failures.length?'<h2>Failures</h2><pre>'+escapeHTML(report.failures.join('\n'))+'</pre>':'')
    +'<h2>Contact sheets</h2>'+report.sheets.map(s=>'<details open><summary>'+escapeHTML(s.group+' · '+s.file)+'</summary>'+figure(s.file,s.group)+'</details>').join('')
    +'<h2>Actual in-world captures</h2><div class="world">'+report.world.map(w=>figure(w.file,(w.id||'room')+' · '+w.stage+' · '+w.viewport.width+'×'+w.viewport.height)).join('')+'</div>'
    +'<h2>Individual bitmap and compositor exports</h2><ul>'+report.entries.map(e=>'<li><a href="'+escapeHTML(e.file)+'">'+escapeHTML(e.key)+'</a> · '+e.width+'×'+e.height+'</li>').join('')+'</ul><h2>Limitations / observations</h2><pre>'+escapeHTML(report.notes.join('\n'))+'</pre></html>';
  await writeFile(path.join(OUTPUT,'index.html'),html);
}

export async function main(args=process.argv.slice(2)) {
  const options=parseArgs(args);
  if(options.help){console.log('node tests/art-gallery.mjs http://localhost:PORT [--all-world] [--world-only]\nnode tests/art-gallery.mjs --source-only\nUse disposable server data; script never starts a server.');return;}
  const source=await auditSources();
  if(options.sourceOnly){console.log(JSON.stringify(source,null,2));assert.deepEqual(source.failures,[],'Source manifest audit failed');return;}
  for(const folder of ['source','prints','sheets','world'])await mkdir(path.join(OUTPUT,folder),{recursive:true});
  const report={started:new Date().toISOString(),base:options.base,status:'running',options,source,declared:null,things:[],entries:[],sheets:[],world:[],failures:[...source.failures],
    scope:['Every on-disk /art bitmap and PrintArt.files image is decoded and exported.',
      'Compositor contact sheets use production APIs and actual mesh material canvases.',
      options.allWorld?'Physical captures cover every available selected art prop.':'Physical shelf/hand/inspection captures sample representative formats.'],
    notes:['No server is started. The supplied localhost server must use disposable data; a unique new fixture account receives QA media grants.',
      'No original generated-image directory is read; provenance is audited from repository manifests.',
      'Home views retain real placements; camera placement uses roomFixture and is not a walked-route or pickup-key test.',
      'House.grab/House.inspect are used for repeatable art views. Poster clicks and reader F/Q/rotation use production input paths.',
      'Contact sheets of images or compositors are not proof of per-item in-world visibility, readable typography, or correct UVs.',
      'Narrow/landscape captures resize the existing WebGL room; separate real-device startup, touch/gamepad and performance tests are not covered.',
      'Refresh/resume, Esc timing, full walking routes and case-opening gameplay are covered by separate regressions, not this gallery.',
      'No pixel baselines or OCR: inspect the PNGs for title spelling, cropping, UV orientation, lighting, thickness and contact shadows.',
      'Server logs and production/live behavior are not checked by this script.']};
  let fixture;
  try{
    console.log('Art gallery: starting disposable fixture');
    const {roomFixture}=await import('./room-fixture.mjs');
    const account='Art'+Date.now().toString(36),password='Throwaway-1999';
    // An explicitly provisioned throwaway legacy-room account avoids entering
    // the new sparse story tutorial while auditing the complete art collection.
    const registered=await fetch(options.base+'/admin/register',{method:'POST',headers:{'X-Admin-Token':'testtoken','Content-Type':'application/json'},body:JSON.stringify({name:account,pass:password})});
    assert(registered.ok,'Disposable gallery account registration failed: '+registered.status);
    console.log('Art gallery: disposable account registered');
    // Warm software WebGL at a modest startup size; every world capture below
    // explicitly resizes to its recorded desktop/portrait dimensions.
    fixture=await roomFixture(options.base,{account,password,signup:false,debug:true,width:640,height:480,onPage:page=>{
      // Avoid the legacy CSS boot-camera sway consuming software-renderer time
      // while hundreds of parser-blocking game modules are still loading.
      page.emulateMedia({reducedMotion:'reduce'});
      page.addInitScript(installPrintProbe);
      // Block redirected/external HTTP traffic before fixture writes. The game
      // derives its /ws address from this same explicitly supplied origin.
      page.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(['data:','blob:'].includes(url.protocol)||url.origin===options.base)return route.continue();
        report.notes.push('Blocked non-local resource: '+url.origin+url.pathname);return route.abort();
      });
      page.on('response',response=>{if(response.status()>=400&&/\/(?:art|fonts)\//.test(response.url()))report.failures.push('HTTP '+response.status()+': '+new URL(response.url()).pathname);});
      page.on('requestfailed',request=>{if(/\/art\//.test(request.url()))report.failures.push('Artwork request failed: '+new URL(request.url()).pathname);});
    }});
    const {page,until}=fixture;
    page.setDefaultTimeout(60000);
    console.log('Art gallery: room ready; waiting for decoded artwork');
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([window.PrintArt?.ready,HouseArt.postersReady,Magazines.ready]);});
    const missingArt=await page.evaluate(()=>Object.entries(PrintArt.status).filter(([,status])=>status!=='generated').map(([key])=>key));
    assert.deepEqual(missingArt,[],'Room startup retained fallback artwork; do not count those as generated captures');
    // QA grants are deliberately confined to the unique disposable account.
    // No balances, caps, orders, shared records or existing accounts are edited.
    await page.evaluate(()=>{
      for(const box of Discs.BOXES)PM.grant(box.id);
      for(const id of ['pm.os98','pm.netplanet','pm.gub','pm.mix',...MagazineCat.ISSUES.map(i=>i.id)])PM.grant(id);
      for(const game of RoomCat.GAMES){Room._.S.f['cart.'+game.id]=1;Room._.emit('find','cart.'+game.id);}
      House.buildRoom(House.ROOMS.lounge);PMGL.sync();Magazines.sync();
      House.THINGS['pm.catalogue']?.obj.userData.ensure?.();
      for(const t of Object.values(House.THINGS))if(/^(?:pmd\.|pmf\.)/.test(t.id))t.obj.userData.ensure?.();
    });
    await until(()=>PMGL._q().n===0&&PMGL._q().busy===0);
    await fixture.view([-120,-55,160],[-216,-5,-16]);
    await page.screenshot({path:path.join(OUTPUT,'world/initial-room.png'),timeout:60000});
    console.log('Art gallery: physical media ready; decoding catalogue');
    if(!options.worldOnly){
    report.declared=await captureCatalogue(page,source);
    report.things=await collectMaterials(page);
    report.materialPaintCoverage=await page.evaluate(()=>Object.keys(PrintArt.files).map(key=>({key,
      surfaces:[...window.__artGallery.entries.values()].filter(e=>e.group==='materials'&&e.paintCalls?.some(call=>call.key===key&&call.ok)).map(e=>({key:e.key,uses:e.uses}))})));
    await exportGallery(page,report);
    }else{
      report.scope=['World-only rerun: fresh physical views and changed production compositors, not the complete source export.'];
      report.notes.push('Earlier full exports are not counted in this run.');
      await page.evaluate(installGallery);
      await page.evaluate(async()=>{
        const G=window.__artGallery;
        for(const[key,texture]of Object.entries(HouseKit.TEX))if(/^media\.(?:case\.cover\.|print\.)/.test(key))G.texture('patched-materials',key,texture);
        for(const issue of MagazineCat.ISSUES)G.texture('patched-covers',issue.id,Magazines.cover(issue.id));
        for(const name of ['posterFilm','posterBand','posterGame','posterRobot','posterShuttle'])G.texture('patched-posters',name,HouseArt.t(name));
        for(const id of ['podracer','grotlings','boss'])await G.svg('patched-shop',id,Discs.front(Discs.BOX[id]));
        G.texture('patched-pages','comic',Magazines.pageTexture(MagazineCat.ISSUES[0],5));
      });
      await exportGallery(page,report);
    }
    console.log('Art gallery: contact sheets exported; capturing physical views');
    await captureWorld(fixture,options,report);
    await until(()=>PMGL._q().n===0&&PMGL._q().busy===0);
    report.notes.push('Physical source/manifest provenance is metadata only; original generation files are not validated.');
    const missing=(report.declared?.resolutions||[]).filter(row=>!report.things.some(t=>t.id===row.id||t.id==='media.box.'+row.id||t.id==='pmb.'+row.id.replace(/^pc\./,'')));
    report.notes.push('IDs without a one-to-one physical prop (away console, date gate, legacy alias or compositor-only): '+missing.map(row=>row.id).join(', '));
    report.status=report.failures.length?'failed':'passed';
  }catch(error){
    report.status='failed';report.failures.push(error.stack||error.message);
    if(fixture){try{await fixture.page.screenshot({path:path.join(OUTPUT,'world/failure.png'),timeout:30000});report.notes.push('Failure screenshot: world/failure.png');}catch(captureError){report.notes.push('Failure screenshot unavailable: '+captureError.message);}}
  }finally{
    if(fixture){
      try{report.failures.push(...await fixture.page.evaluate(()=>window.__artGallery?.failures||[]));}catch{}
      report.failures.push(...fixture.errors.map(error=>'Browser: '+error));
    }
    report.failures=[...new Set(report.failures)];
    report.notes.push(...source.warnings);
    if(report.failures.length)report.status='failed';
    report.finished=new Date().toISOString();await writeIndex(report);await fixture?.browser.close();
  }
  console.log('ART GALLERY '+report.status.toUpperCase()+': '+report.entries.length+' bitmap/compositor exports, '+report.sheets.length+' contact sheets, '+report.world.length+' in-world views');
  console.log(path.join(OUTPUT,'index.html'));
  assert.deepEqual(report.failures,[],'Art gallery failed; see report.json');
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
