'use strict';
// R252: the Cold Pantry's front and sign are solid; its double door is the only way in; the area banner sits below the sign.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','app/public/js/rm-g-zeldo.js'),'utf8');
const m=/k_shelves:\{[^]*?map:\[([^\]]*)\],warps:\{'7,2':\['f1',7,10,1\],'8,2':\['f1',8,10,1\]\}/.exec(src);assert(m,'Cold Pantry screen found');
const rows=[...m[1].matchAll(/'([^']*)'/g)].map(x=>x[1]);assert.equal(rows.length,12);assert(rows.every(r=>r.length===16));
// The facade art is drawn over x 78-178, y 0-46: columns 5-10, rows 0-2.
for(let y=0;y<=2;y++)for(let x=5;x<=10;x++){const t=rows[y][x];if(y===2&&(x===7||x===8))assert.equal(t,'@','door tile '+x+','+y);else assert.equal(t,'C','walkable facade tile '+x+','+y+' ('+t+')')}
for(let x=5;x<=10;x++)assert.equal(rows[3][x],'.','the step in front of the pantry stays open');
assert(/\['k_shelves', 'q_tower'\]\.includes\(room\?\.id\) \? 52 : 10/.test(src),'banner moved below the painted sign');
console.log('ZELDO PANTRY UNIT PASS');
