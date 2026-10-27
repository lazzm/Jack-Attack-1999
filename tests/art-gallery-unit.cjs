// Offline safety/provenance/probe checks. No server or browser is started.
const assert = require('node:assert/strict');
const {test, before, after} = require('node:test');
const {mkdtemp, mkdir, writeFile, symlink, rm} = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
let gallery, temporary;
before(async () => {
  gallery = await import('./art-gallery.mjs');
  temporary = await mkdtemp(path.join(os.tmpdir(), 'jhp-art-gallery-unit-'));
});
after(async () => {
  assert(temporary.startsWith(path.join(os.tmpdir(), 'jhp-art-gallery-unit-')));
  await rm(temporary, {recursive:true, force:true});
});

test('CLI requires an explicit disposable localhost port and rejects remote/proxy targets', () => {
  for (const value of ['https://jacklm.com','http://example.com:18080','http://localhost',
    'http://127.0.0.1:80','https://localhost:18080','http://user:pass@localhost:18080',
    'http://localhost:18080/live','http://localhost:18080/?target=live']) {
    assert.throws(() => gallery.localBase(value), value);
  }
  assert.equal(gallery.localBase('http://localhost:18080/'), 'http://localhost:18080');
  assert.equal(gallery.localBase('http://127.0.0.1:18464'), 'http://127.0.0.1:18464');
  assert.throws(() => gallery.parseArgs([]));
  assert.throws(() => gallery.parseArgs(['--deploy']));
  assert.deepEqual(gallery.parseArgs(['--source-only']), {allWorld:false,worldOnly:false,sourceOnly:true,help:false,base:null});
  assert.equal(gallery.parseArgs(['http://localhost:18080','--all-world']).allWorld,true);
  assert.deepEqual(gallery.parseArgs(['http://localhost:18080','--world-only','--items=pmb.city,vhs.dog,pmb.city']).items,['pmb.city','vhs.dog']);
  assert.throws(()=>gallery.parseArgs(['http://localhost:18080','--all-world','--items=pmb.city']));
  assert.throws(()=>gallery.parseArgs(['http://localhost:18080','--items=../escape']));
});

test('manifest maps and legacy arrays resolve stable IDs and local asset URLs', () => {
  const map=gallery.manifestEntries({assets:{band:{file:'band.webp',source:'original.png',width:384,height:538}}},'/art/posters-v4/manifest.json');
  assert.deepEqual(map,[{id:'band',url:'/art/posters-v4/band.webp',manifest:'/art/posters-v4/manifest.json',source:'original.png',prompt:null,width:384,height:538}]);
  const array=gallery.manifestEntries({assets:[{file:'spy.webp',game:'n64.range'},{file:'city.webp'}]},'/art/box-v1/manifest.json');
  assert.deepEqual(array.map(a=>a.id),['n64.range','city']);
  const strings=gallery.manifestEntries({assets:{'reading.book.1':'space.webp'}},'/art/print-v3/manifest.json');
  assert.equal(strings[0].id,'reading.book.1');
  for(const file of ['https://example.com/a.webp','../../../escape.webp','/outside.webp','a.webp?live=1','a.webp#fragment','%2e%2e%2foutside.webp'])
    assert.throws(()=>gallery.manifestEntries({assets:{bad:{file}}},'/art/group/manifest.json'),file);
  assert.throws(()=>gallery.manifestEntries({assets:{bad:{}}},'/art/group/manifest.json'));
});

async function sourceFixture(name, {missing=false, mismatch=false, orphan=false, link=false}={}) {
  const dir=path.join(temporary,name), art=path.join(dir,'art/print-v2');
  await mkdir(art,{recursive:true});await mkdir(path.join(dir,'js'));
  const bitmap=Buffer.from('original-webp-fixture'), embedded=mismatch?Buffer.from('different-art'):bitmap;
  await writeFile(path.join(art,'city.webp'),bitmap);
  await writeFile(path.join(art,'manifest.json'),JSON.stringify({method:'fixture',assets:[{file:'city.webp',source:'original.png'},...(missing?[{file:'missing.webp'}]:[])]}));
  await writeFile(path.join(dir,'js/print-art-data.js'),'window.PrintArtData='+JSON.stringify({city:'data:image/webp;base64,'+embedded.toString('base64')})+';\n');
  await writeFile(path.join(dir,'js/consumer.js'),"PrintArt.paint(ctx,'city',0,0,100,100); const url='/art/print-v2/city.webp';"+(missing?"const missing='/art/print-v2/missing.webp';":''));
  if(orphan)await writeFile(path.join(art,'orphan.webp'),bitmap);
  if(link)await symlink(path.join(art,'city.webp'),path.join(art,'linked.webp'));
  return gallery.auditSources(dir);
}

test('source audit hashes actual bytes, checks embedded copies, and identifies consumers', async () => {
  const audit=await sourceFixture('valid');
  assert.deepEqual(audit.failures,[]);assert.deepEqual(audit.warnings,[]);
  assert.equal(audit.files.length,1);assert.equal(audit.manifests.length,1);
  assert.equal(audit.embedded[0].matchesFile,true);
  assert.equal(audit.files[0].sha256,audit.embedded[0].sha256);
  assert.equal(audit.consumers[0].file,'js/consumer.js');
});

test('source audit fails missing manifests/static references and embedded drift', async () => {
  const missing=await sourceFixture('missing',{missing:true});
  assert(missing.failures.some(f=>f.includes('Manifest references missing bitmap')));
  assert(missing.failures.some(f=>f.includes('consumer.js references missing bitmap')));
  const drift=await sourceFixture('drift',{mismatch:true});
  assert(drift.failures.some(f=>f.includes('differs from standalone')));
});

test('unmanifested bitmaps remain in inventory; symlinks are rejected without following them', async () => {
  const audit=await sourceFixture('orphan',{orphan:true,link:true});
  assert.equal(audit.files.length,2);
  assert(audit.warnings.some(w=>w.includes('orphan.webp')));
  assert(audit.failures.some(f=>f.includes('Symlink in artwork tree')));
});

test('source-only inventory resolves the real dynamic files map without network or timers', async () => {
  await sourceFixture('dynamic');
  const file=path.join(temporary,'dynamic/js/print-art.js');
  await writeFile(file,"const folder='print-v2'; window.PrintArt={files:{city:'/art/'+folder+'/city.webp',missing:'/art/'+folder+'/missing.webp'}}; fetch('/never-requested');");
  const audit=await gallery.auditSources(path.join(temporary,'dynamic'));
  assert.equal(audit.declared.length,2);assert.equal(audit.declared[0].present,true);
  assert(audit.failures.some(f=>f.includes('PrintArt.files references missing bitmap: missing')));
});

test('paint probe preserves compositor calls and records the final fallback/repaint for each canvas', () => {
  const sandbox={window:{},WeakMap,Map,Object};
  vm.runInNewContext('('+gallery.installPrintProbe.toString()+')()',sandbox);
  const context={canvas:{}}, args=[], api={
    paint(...a){assert.equal(this,api);args.push(a);return this.result;},
    magazine(){return true;},svg(id){return '<image id="'+id+'"/>';},result:false
  };
  sandbox.window.PrintArt=api;
  assert.equal(api.paint(context,'n64.kart',1,2,3,4),false);
  let rows=[...sandbox.window.__artPrintProbe.paints.get(context.canvas).values()];
  assert.equal(rows[0].ok,false);assert.deepEqual(Array.from(rows[0].rectangle),[1,2,3,4]);
  api.result=true;
  assert.equal(api.paint(context,'n64.kart',1,2,3,4),true);
  rows=[...sandbox.window.__artPrintProbe.paints.get(context.canvas).values()];
  assert.equal(rows.length,1);assert.equal(rows[0].ok,true);assert.equal(args[0][0],context);
  assert.equal(api.svg('n64.kart'),'<image id="n64.kart"/>');
  assert.equal(sandbox.window.__artPrintProbe.svgCalls.get('n64.kart').ok,true);
  assert.equal(sandbox.window.PrintArt,api);
});
