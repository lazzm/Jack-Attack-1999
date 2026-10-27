import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [a,b]=await Promise.all(process.argv.slice(2,4).map(p=>readFile(p,'utf8').then(JSON.parse)));
assert(a&&b,'Usage: node tests/perf/compare.mjs before.json after.json');
assert.equal(a.renderer,b.renderer,'Different renderers are not comparable');
assert.deepEqual(a.config,b.config,'Different benchmark settings are not comparable');
const delta=(x,y)=>x?((y/x-1)*100).toFixed(1)+'%':'—';
console.log('tier    view              draws before/after  render p50 Δ   fill p50 Δ');
for(const row of b.rows){const old=a.rows.find(r=>r.tier===row.tier&&r.view===row.view);if(!old||!old.cpu.length||!row.cpu.length)continue;
 console.log(`${row.tier.padEnd(7)} ${row.view.padEnd(17)} ${String(old.calls+'/'+row.calls).padStart(16)} ${delta(old.cpu[0].renderMs.p50,row.cpu[0].renderMs.p50).padStart(13)} ${delta(old.fill[0].frameMs.p50,row.fill[0].frameMs.p50).padStart(12)}`);
}
for(const row of b.walk){const old=a.walk.find(r=>r.tier===row.tier);if(old)console.log(`${row.tier} walk p50/p95/p99: ${old.frameMs.p50}/${old.frameMs.p95}/${old.frameMs.p99} -> ${row.frameMs.p50}/${row.frameMs.p95}/${row.frameMs.p99} ms; p95 ${delta(old.frameMs.p95,row.frameMs.p95)}`)}
