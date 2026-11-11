'use strict';
// R253: touch players read taps and their on-screen button names; keyboard players keep key names.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','app/public/js/hs-world.js'),'utf8');
const code=src.slice(src.indexOf('  function touchWords('),src.indexOf('  const fwd = ()'));
const run=(touch,text)=>{const ctx={window:{GameInput:{touch}}};vm.runInNewContext(code+';this.out=touchWords('+JSON.stringify(text)+')',ctx);return ctx.out};
const cases=[
 ['Move closer, then press F or click.','Move closer, then tap Use.'],
 ['Pick up a filled game case from beside the console, then E at its highlighted slot.','Pick up a filled game case from beside the console, then tap Put in at its highlighted slot.'],
 ['Pick up a filled game case and put it into the highlighted slot.','Pick up a filled game case and tap Put in at the highlighted slot.'],
 ['Press J to choose. Click it to open.','Press J to choose. Tap it to open.'],
];
for(const [k,t] of cases){assert.equal(run(true,k),t);assert.equal(run(false,k),k,'keyboard wording changed')}
assert.doesNotMatch(run(true,'Hold it, then press E to put it in, or press Q.'),/\bpress [A-Z]\b/);
assert.equal(run(true,'The radiator clicks. <kbd class="click">F</kbd>'),'The radiator clicks. <kbd class="click">F</kbd>','flavour text and markup untouched');
// The reported messages are still the ones the game shows (so the rewrite keeps covering them).
const room=fs.readFileSync(path.join(__dirname,'..','app/public/js/rm-room.js'),'utf8');
assert(src.includes("'Move closer, then press F or click.'")&&room.includes('then E at its highlighted slot')&&room.includes('put it into the highlighted slot'));
assert(src.includes('toast(title, text) { text = touchWords(text);')&&src.includes('say(title,text,ms,onShow){text=touchWords(text);'),'house toasts and notes use touch wording');
console.log('TOUCH WORDS UNIT PASS');
