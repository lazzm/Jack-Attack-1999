'use strict';
const assert = require('node:assert/strict');
const story = require('../app/mods/story.js'), C = require('../app/public/js/st-cat.js');
let now = 1000000;
const realNow = Date.now; Date.now = () => now;
class Bucket {
  constructor(rate, burst) { this.rate = rate; this.burst = burst; this.n = burst; this.last = now; }
  take() { this.n = Math.min(this.burst, this.n + (now - this.last) / 1000 * this.rate); this.last = now; if (this.n < 1) return false; this.n--; return true; }
}
const fresh = { member: 'Fresh' }, old = { member: 'Veteran' }, ws = {}, ws2 = {}, events = {}, messages = [];
const state = { members: { fresh: { starterSparse: 1 }, veteran: { name: 'Veteran' } }, mods: {
  story: {}, ch: { p: {} }, pmx: { p: {} }, sms: { contacts: {} }, econ: { acct: { fresh: { bal: 0, wallet: { pence: 0 }, caps: { job: 7 } }, veteran: { bal: 999 } } }, untouched: { saved: ['keep'] },
} };
const others = () => JSON.stringify({ econ: state.mods.econ, untouched: state.mods.untouched });
const initial = others();
const ctx = { state, data: state.mods.story, clients: new Map([[ws, fresh], [ws2, old]]), Bucket, send(w, m) { messages.push({ w, m }); }, on(e, fn) { events[e] = fn; }, markDirty() {} };
const send = (id, c = fresh) => story.handle(c === old ? ws2 : ws, c, { t: 'stEvent', id });
try {
  story.init(ctx); events.login(fresh); events.hello(ws2, old);
  const p = state.mods.story.p.fresh, veteran = state.mods.story.p.veteran;
  assert.equal(p.ch, 1); assert.equal(C.current(p).id, 'lad');
  assert.equal(veteran.flags.veteran, true); assert.equal(veteran.ch, 6); assert.equal(C.current(veteran), null);
  assert.equal(Object.keys(veteran.done).length, C.steps.length);
  const oldSnapshot = JSON.stringify(veteran);
  send('lad', old); send('tidy', old); assert.equal(JSON.stringify(veteran), oldSnapshot);
  send('play'); send('__proto__'); send('constructor'); send('not-a-step'); send('lad', { member: '__proto__' }); send('lad', {});
  assert.deepEqual(p.done, {});
  send('lad'); assert(p.done.lad); const stamp = p.done.lad;
  now += 2000; send('lad'); assert.equal(p.done.lad, stamp);
  send('tidy'); assert(!p.done.tidy, 'Unverified chore accepted');
  state.mods.ch.p.fresh = { done: { tidy: { sc: 0, bad: 1 } } }; send('sync'); assert(!p.done.tidy);
  now += 10000;
  state.mods.ch.p.fresh = { n: { tidy: 1, bed: 1, bin: 1 }, done: {} };
  send('sync'); assert(p.done.tidy && p.done.bed && p.done.bin); assert.equal(p.trust, 3);
  for (const id of ['downstairs', 'pc', 'pixelpost', 'plan']) { now += 1000; send(id); }
  assert.equal(p.ch, 2); assert.equal(C.current(p).id, 'save');
  const once = JSON.stringify(p.done); now += 10000;
  for (const id of ['lad', 'tidy', 'bed', 'bin']) send(id);
  assert.equal(JSON.stringify(p.done), once); assert.equal(p.trust, 3); assert.equal(others(), initial, 'Story minted money or changed another mod');
  send('unbox'); send('carry'); send('connect'); assert(!p.flags.unbox, 'Parcel accepted without server order');
  state.mods.econ.acct.fresh.wallet.pence = 1800; now += 10000; send('sync'); assert(p.done.save);
  send('order'); assert(!p.done.order, 'Forged purchase accepted');
  state.mods.pmx.p.fresh = { o: [{ id: 'hardware.md', no: 'PP1' }] }; send('order'); assert(p.done.order);
  for (const id of ['unbox', 'carry', 'connect', 'play']) { now += 1000; send(id); }
  assert.equal(C.current(p).id, 'mate'); send('mate'); assert(!p.done.mate);
  state.mods.sms.contacts.fresh = [{ id: 'mate', name: 'Dave', number: '19991234123412341234' }]; now += 1000; send('mate');
  assert.equal(p.ch, 3); assert.equal(C.current(p), null); assert.equal(p.trust, 3);
  state.members.texter = { starterSparse: 1 };
  const textState = state.mods.story.p.texter = JSON.parse(JSON.stringify(p));
  textState.ch = 2; delete textState.done.mate; delete textState.flags.mate;
  events['story-phone']({ member: 'Texter' });
  assert(textState.done.mate, 'Successful send was lost after its delivery receipt disappeared');
  const textStamp = textState.done.mate; now += 1000; events['story-phone']({ member: 'Texter' }); assert.equal(textState.done.mate, textStamp);
  const persisted = JSON.stringify(p); story.init(ctx); events.hello(ws, fresh); assert.equal(JSON.stringify(p), persisted, 'Reconnect lost progress');
  // All tabs and reconnects of the account share the same flood bucket.
  messages.length = 0;
  for (let i = 0; i < 100; i++) send('sync', { member: 'Fresh' });
  assert.equal(messages.filter(x => x.w === ws).length, 12);
  events.hello(ws, fresh); // resuming is read-only and does not reset allowance
  messages.length = 0; send('sync'); assert.equal(messages.length, 0);
  now += 500; send('sync'); assert.equal(messages.filter(x => x.w === ws).length, 1);
  assert.equal(state.mods.econ.acct.fresh.wallet.pence, 1800);
  // Sparse detection is an initial migration decision, never a later reset.
  state.members.veteran.starterSparse = 1; now += 10000; events.login(old); assert.equal(JSON.stringify(veteran), oldSnapshot);
  // A cached document can miss hello before its late-loaded story listener runs.
  const vm = require('node:vm'), fs = require('node:fs'), ticks = [], clientMessages = [], clientEvents = {};
  const client = { StoryCat:C, st:{say(){}}, Date, document:{addEventListener(){},querySelector(){return null},getElementById(){return null}}, setTimeout(){}, setInterval(fn){ticks.push(fn)}, Net:{connected:true,me:{member:true},send(m){clientMessages.push(m);return true},on(e,fn){clientEvents[e]=fn}} };
  client.window = client;
  vm.runInNewContext(fs.readFileSync(require.resolve('../app/public/js/st-engine.js'),'utf8'),client);
  ticks[0](); assert.equal(clientMessages.at(-1).id,'sync','Late listener never requested its missed snapshot');
  clientEvents.stState({ch:1,done:{lad:now},flags:{},trust:0,v:1});
  assert.equal(client.st.current().id,'tidy');
  // Pixel Post briefly constructs hardware at its factory dock before moving it
  // to the parcel. A stale snap ID on that carried object is not a connection.
  let opened=false, held=null, mediaChanged; const later=[];
  client.setTimeout=fn=>later.push(fn);
  client.document.createElement=()=>({setAttribute(){},classList:{toggle(){}},textContent:''});
  client.House={ok:true,live:true,mode:'walk',here:'hall',held:()=>held,THINGS:{md:{st:'rest',snap:'hardware.dock.md',at:{room:'hall'}}},on(){},ui:{el:{appendChild(){}}}};
  client.Room={on(){}};
  client.PM={on(e,fn){mediaChanged=fn},orders:()=>[{id:'hardware.md'}],owns:()=>opened};
  const firstChapter=Object.fromEntries(C.steps.filter(s=>s.ch===1).map(s=>[s.id,now]));
  clientEvents.stState({ch:2,done:{...firstChapter,save:now,order:now},flags:{},trust:3,v:1});
  clientMessages.length=0;opened=true;mediaChanged();
  assert.equal(clientMessages.length,0,'Observed the transient parcel construction pose');
  later.shift()();
  assert.deepEqual(clientMessages.map(m=>m.id),['unbox']);
  clientMessages.length=0;held='md';client.House.here='bedroom';client.st.observe();
  assert.deepEqual(clientMessages.map(m=>m.id),['carry']);
  clientMessages.length=0;held=null;client.House.THINGS.md.st='snap';client.House.THINGS.md.at.room='bedroom';client.st.observe();
  assert.deepEqual(clientMessages.map(m=>m.id),['connect']);
  clientMessages.length=0;client.RoomTV={_dbg:()=>({st:'game',con:'md',background:false})};client.st.observe();
  assert.deepEqual(clientMessages.map(m=>m.id),['play']);
  console.log('STORY UNIT PASS: sparse/veteran, ordered evidence, server checks, idempotent trust/no currency rewards, additive persistence, account-wide flood limit');
} finally { Date.now = realNow; }
