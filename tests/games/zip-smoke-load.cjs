// Diagnostic companion to smoke's SMOKE_SCALE for oversubscribed software-WebGL hosts.
// The default gate is still: node tests/smoke.mjs
// This preserves every assertion and input, extending only Playwright action/navigation waits.
// The smoke server runs from app/, so retain an absolute preload path in children.
process.env.NODE_OPTIONS=(process.env.NODE_OPTIONS||'').replace('--require=./tests/games/zip-smoke-load.cjs','--require='+__filename);
const {chromium}=require('playwright');
const scale=Math.max(1,Math.min(4,Number(process.env.SMOKE_SCALE)||1)),seen=new WeakSet();
function page(p){if(seen.has(p))return p;seen.add(p);for(const method of ['setDefaultTimeout','setDefaultNavigationTimeout']){const original=p[method].bind(p);p[method]=ms=>original(ms*scale)}return p}
function context(c){const original=c.newPage.bind(c);c.newPage=async(...args)=>page(await original(...args));return c}
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{const b=await launch(...args),newPage=b.newPage.bind(b),newContext=b.newContext.bind(b);b.newPage=async(...args)=>page(await newPage(...args));b.newContext=async(...args)=>context(await newContext(...args));return b};
console.log('SMOKE diagnostic: browser waits x'+scale+'; all gameplay assertions unchanged.');
