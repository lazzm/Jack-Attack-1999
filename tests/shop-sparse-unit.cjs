'use strict';
const assert=require('node:assert/strict');
const cat=require('../app/public/js/pm-cat.js'),games=require('../app/public/js/rm-cat.js'),chores=require('../app/public/js/ch-cat.js');cat.addCarts(games);
assert.equal(cat.ITEMS.filter(x=>x.kind==='mag').length,12);assert.equal(cat.ITEMS.filter(x=>x.kind==='hardware').length,4);
for(const id of ['n64','ps','md','dc'])assert(cat.ITEMS.some(x=>x.cart&&x.con===id));
assert(!cat.out(cat.byId['hardware.dc'],1013));assert(cat.out(cat.byId['hardware.dc'],1014));
assert(!cat.out(cat.byId['pm.mag.12'],1130));assert(cat.out(cat.byId['pm.mag.12'],1201));
for(let day=1;day<=31;day++){
 const date='1999-10-'+String(day).padStart(2,'0'),old=chores.tidyFor(date),sparse=chores.tidyFor(date,true);
 assert.equal(sparse.length,old.length);assert.equal(new Set(sparse.map(x=>x.id)).size,sparse.length);assert(sparse.every(x=>!['mag','cd'].includes(x.kind)));
 assert.deepEqual(chores.steps('tidy',date,true).map(x=>x.s),sparse.map(x=>x.id));assert.deepEqual(chores.steps('tidy',date).map(x=>x.s),old.map(x=>x.id));
}
console.log('SPARSE CATALOGUE / CHORES PASS: 12 issues, four consoles, compatible games, release dates, deterministic media-free mess and matching chore steps');
