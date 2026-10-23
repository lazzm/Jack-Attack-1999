'use strict';
// CPU-only regressions against the production input service and game/window kit.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = name => fs.readFileSync(require.resolve('../app/public/js/' + name), 'utf8');
class Events {
  constructor(tagName = 'DIV') {
    this.handlers = new Map(); this.dataset = {}; this.style = {}; this.tagName = tagName;
    this.children = []; this.classes = new Set();
    this.classList = { contains: n => this.classes.has(n), add: n => this.classes.add(n) };
  }
  addEventListener(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name).add(fn); }
  removeEventListener(name, fn) { this.handlers.get(name)?.delete(fn); }
  dispatchEvent(ev) { ev.target ??= this; for (const fn of this.handlers.get(ev.type) || []) fn(ev); return !ev.defaultPrevented; }
  fire(type, extra = {}) {
    const ev = { type, isTrusted: true, target: this, preventDefault() { this.defaultPrevented = true; }, ...extra };
    this.dispatchEvent(ev); return ev;
  }
  closest() { return null; }
  hasAttribute() { return false; }
  contains(el) { return el === this || this.children.some(c => c.contains(el)); }
  appendChild(el) { this.children.push(el); return el; }
  querySelector() { return null; }
}
function fixture(coarse = true) {
  const document = new Events(), window = new Events(), timers = new Map(), changes = [];
  let seq = 0, pads = [];
  const dispatch = document.dispatchEvent.bind(document);
  document.dispatchEvent = ev => { window.dispatchEvent(ev); return dispatch(ev); };
  document.documentElement = new Events('HTML'); document.body = new Events('BODY');
  document.activeElement = document.body; document.hidden = false;
  const ctx = {
    window, document, navigator: { getGamepads: () => pads },
    setTimeout: fn => { timers.set(++seq, fn); return seq; }, clearTimeout: id => timers.delete(id),
    CustomEvent: class { constructor(type, o) { Object.assign(this, { type, ...o }); } },
  };
  window.matchMedia = () => ({ matches: coarse });
  document.addEventListener('game-input-change', e => changes.push(e.detail));
  vm.createContext(ctx); vm.runInContext(source('hs-input.js'), ctx);
  return { document, window, ctx, changes, timers, get api() { return window.GameInput; }, pads(v) { pads = v; },
    poll() { const [id, fn] = timers.entries().next().value || []; assert(fn, 'No poll scheduled'); timers.delete(id); fn(); } };
}
const key = { key: 'w', code: 'KeyW', keyCode: 87 };
const f = fixture();
assert.equal(f.api.mode, 'mouse'); assert.equal(f.api.touch, false);
assert.equal(f.api.currentInput, 'mouse'); assert.equal(f.api.currentinput, 'mouse');
assert.equal(f.document.documentElement.dataset.gameTouch, 'false');
assert.equal(fixture(false).api.mode, 'mouse');
f.document.fire('keydown', key); assert.equal(f.api.mode, 'keyboard');
for (const event of [
  { pointerType: 'mouse', isTrusted: false, movementX: 1 },
  { pointerType: 'mouse', sourceCapabilities: { firesTouchEvents: true }, movementX: 1 },
  { pointerType: 'touch', movementX: 1 }, { pointerType: 'pen', movementX: 1 },
  { pointerType: 'mouse', movementX: 0, movementY: 0 },
]) f.document.fire('pointermove', event);
f.document.fire('pointerdown', { pointerType: 'touch' });
f.document.fire('pointerdown', { pointerType: 'pen' }); f.document.fire('touchstart');
assert.equal(f.api.mode, 'keyboard', 'Non-mouse input changed PC mode');
f.document.fire('pointermove', { pointerType: 'mouse', movementX: 1 }); assert.equal(f.api.mode, 'mouse');
for (const extra of [{ isTrusted: false }, { target: { closest: () => ({}) } }, { isComposing: true }, { keyCode: 229 }, { code: '' }]) {
  f.document.fire('keydown', { ...key, ...extra }); assert.equal(f.api.mode, 'mouse');
}
f.document.fire('compositionstart'); f.document.fire('keydown', key); assert.equal(f.api.mode, 'mouse');
f.document.fire('compositionend'); f.document.fire('keydown', key); assert.equal(f.api.mode, 'keyboard');
const pad = { index: 0, connected: true, buttons: [{ pressed: true }], axes: [0, 0] };
f.pads([pad]); f.poll(); assert.equal(f.api.mode, 'gamepad');
f.document.fire('pointerdown', { pointerType: 'mouse' }); f.poll();
assert.equal(f.api.mode, 'mouse', 'Held gamepad stole mode back');
pad.buttons[0].pressed = false; f.poll(); pad.axes[0] = .1; f.poll(); assert.equal(f.api.mode, 'mouse');
pad.axes[0] = .7; f.poll(); assert.equal(f.api.mode, 'gamepad');
f.document.fire('keydown', key); f.poll(); assert.equal(f.api.mode, 'keyboard', 'Held axis stole mode back');
pad.buttons[0].pressed = true; f.poll(); assert.equal(f.api.mode, 'gamepad');
f.pads([]); f.poll(); assert.equal(f.api.mode, 'keyboard');
assert.equal(f.changes.at(-1).reason, 'gamepad-disconnected');
f.document.hidden = true; f.document.fire('visibilitychange'); assert.equal(f.timers.size, 0);
f.document.hidden = false; f.document.fire('visibilitychange'); assert.equal(f.timers.size, 1);
assert(f.changes.every(c => c.previous && c.mode && c.touch === false));
assert.equal(f.document.documentElement.dataset.gameInput, 'keyboard');

// Native click(1), click(2), dblclick opens once; nearby click(1)s never emulate it.
const apps = source('apps.js'), appCtx = {window:{PCOnly:{desktopOnly:false}}}; vm.createContext(appCtx);
vm.runInContext(apps.slice(apps.indexOf('  function bindLaunch('), apps.indexOf('  // ================================================================ desktop icons')), appCtx);
let opened = 0, selected = 0;
const icon = new Events('BUTTON'); appCtx.bindLaunch(icon, () => opened++, () => selected++);
for (const detail of [1, 1, 2]) icon.fire('click', { detail, button: 0 });
assert.equal(opened, 0); icon.fire('dblclick', { detail: 2, button: 0 }); assert.equal(opened, 1);
icon.fire('dblclick', { detail: 2, button: 0 }); assert.equal(opened, 2, 'Separate double-click suppressed');
for (const pointerType of ['touch', 'pen']) icon.fire('click', { detail: 1, button: 0, pointerType });
assert.equal(opened, 2, 'Touch/pen single-click launched');
icon.fire('click', { detail: 0, button: 0 }); assert.equal(opened, 3, 'Native Enter click failed');
icon.fire('click', { detail: 0, button: 2 }); icon.fire('dblclick', { button: 2 }); assert.equal(opened, 3);
const row = new Events(); appCtx.bindLaunch(row, () => opened++);
assert.equal(row.tabIndex, 0); assert(row.fire('keydown', { key: 'Enter' }).defaultPrevented);
row.fire('keydown', { key: 'Enter', repeat: true }); row.fire('keyup', { key: 'Enter' });
assert.equal(opened, 4, 'Non-button Enter did not activate exactly once'); assert(selected > 0);

// Handheld JackOS gets direct icon activation, without changing desktop double-clicks.
appCtx.window.PCOnly.desktopOnly=true;
const beforeMobile=opened;
icon.fire('click',{detail:1,button:0,pointerType:'touch'});
assert.equal(opened,beforeMobile+1);
icon.fire('click',{detail:1,button:0,pointerType:'touch',isTrusted:false});
assert.equal(opened,beforeMobile+1);
appCtx.window.PCOnly.desktopOnly=false;

// Execute the complete production game kit, including real routing and cleanup.
const games = source('apps-games.js');
function gameFixture() {
  const f = fixture(), { ctx, document: doc, window: win } = f;
  const host = new Events(), target = new Events('CANVAS'), el = new Events(); host.appendChild(target); el.appendChild(host);
  doc.querySelectorAll = () => [el]; doc.querySelector = () => null;
  doc.createElement = tag => new Events(tag.toUpperCase());
  let next = 0; const scheduled = f.timers;
  Object.assign(ctx, {
    g: { id: 'test' }, w: { el }, host, store: { get() {}, set() {} }, sfx() {}, secret() {}, esc: String,
    JG: { note() {}, fmt() {}, mods: {}, live: {} }, Apps: {},
    about() {}, help() {}, Scores() {}, dialog() {},
    setInterval: () => ++next, clearInterval() {}, performance: { now: () => 100 },
    requestAnimationFrame: () => ++next, cancelAnimationFrame() {},
    MutationObserver: class { observe() {} disconnect() {} },
    PointerEvent: class { constructor(type, init) { Object.assign(this, { type, ...init }); } },
    innerWidth: 390, innerHeight: 400,
  });
  vm.runInContext(games.slice(games.indexOf('  const tops ='), games.indexOf('  JG.launch = launch;')) + '\nG = makeG(g, w, host);', ctx);
  const G = ctx.G, ups = [], downs = [], cancelled = [], released = [];
  G.keys = { down: ev => { downs.push(ev.key); return true; }, up: ev => { ups.push(ev.key); return true; } };
  target.hasPointerCapture = () => true; target.releasePointerCapture = id => released.push(id);
  target.addEventListener('pointercancel', ev => cancelled.push(ev.pointerId));
  return { ...f, G, host, target, el, ups, downs, cancelled, released, scheduled };
}
const t = gameFixture(), { G, document: doc, window: win } = t;
const down = () => doc.fire('keydown', { ...key, target: doc.body });
const pointer = id => t.host.fire('pointerdown', { target: t.target, pointerId: id, pointerType: 'mouse' });
down(); pointer(17);
doc.fire('pointermove', { pointerType: 'mouse', movementX: 1 });
assert.deepEqual(t.ups, [], 'Mouse movement released a held keyboard control');
doc.fire('keydown', { ...key, repeat: true }); assert.deepEqual(t.ups, []);
doc.fire('pointerdown', { pointerType: 'pen' }); assert.deepEqual(t.ups, []);
const pad2 = { index: 0, connected: true, buttons: [{ pressed: true }], axes: [0] };
t.pads([pad2]); t.poll(); assert.deepEqual(t.ups, ['w']); assert.deepEqual(t.cancelled, [17]); assert.deepEqual(t.released, [17]);
t.poll(); assert.equal(t.ups.length, 1, 'Held gamepad cancelled again');
down(); assert.equal(t.api.mode, 'keyboard'); // Returning from gamepad cancels before routing this new key.
doc.fire('pointermove', { pointerType: 'mouse', movementX: 1 }); assert.equal(t.ups.length, 1);
win.fire('blur'); win.fire('blur'); assert.deepEqual(t.ups, ['w', 'w']);
down(); pointer(18); doc.hidden = true; doc.fire('visibilitychange');
assert.deepEqual(t.ups, ['w', 'w', 'w']); assert.deepEqual(t.cancelled, [17, 18]);
doc.hidden = false; doc.fire('visibilitychange');
down(); pointer(19); t.host.fire('lostpointercapture', { pointerId: 19 });
assert.equal(t.ups.length, 4); assert.deepEqual(t.cancelled, [17, 18, 19]);
pointer(20); doc.fire('pointerup', { pointerId: 20 }); win.fire('blur'); assert.equal(t.cancelled.length, 3);
// An owned key must be released even if focus has moved to another window.
down(); doc.activeElement = new Events('INPUT'); doc.fire('keyup', key); assert.equal(t.ups.length, 5);
doc.activeElement = doc.body; down(); pointer(21); G._cleanup();
assert.equal(t.ups.length, 6); assert.deepEqual(t.cancelled, [17, 18, 19, 21]);
win.fire('blur'); assert.equal(t.ups.length, 6); assert.equal(G.closed, true);

// Narrow desktop windows and coarse capabilities never request mobile layout.
const c = gameFixture(), kit = c.G;
assert.equal(kit.phone(), false); kit.fit(); assert.equal(c.el.classList.contains('maxwin'), false);
assert(!/innerWidth|innerHeight|matchMedia/.test(games), 'Viewport/capability mobile fallback returned');
c.ctx.Apps.win = () => c.ctx.w;
c.ctx.Apps.load = () => new Promise(() => {});
c.ctx.played = () => {};
vm.runInContext('launch(g);', c.ctx);
assert.equal(c.el.classList.contains('maxwin'), false, 'Launching at 390px maximised the game');
// Logical canvas geometry stays fixed while background effort changes only DPR.
const parent = new Events(), transforms = [], sizes = [], cv = new Events('CANVAS');
cv.getContext = () => ({ setTransform: (...args) => transforms.push(args) });
c.document.createElement = () => cv;
c.window.devicePixelRatio = 3; c.window.House = { screenEffort: 'direct' };
const surface = { rect: () => ({ width: 320.8, height: 200.9 }), point: (x, y) => ({ x: x / 2, y: y / 2 }), client: (x, y) => ({ x: x * 2, y: y * 2 }) };
c.ctx.DesktopSurface = c.window.DesktopSurface = surface;
const canvas = kit.canvas(parent, (w, h) => sizes.push([w, h]));
assert.deepEqual([canvas.W, canvas.H, cv.width, cv.height], [320, 200, 800, 500]);
assert.equal(JSON.stringify(kit.point({ clientX: 80, clientY: 60 })), '{"x":40,"y":30}');
assert.equal(JSON.stringify(kit.client(40, 30)), '{"x":80,"y":60}');
for (const [id, fn] of [...c.scheduled]) { c.scheduled.delete(id); fn(); }
assert.deepEqual(sizes, [[320, 200]]);
c.document.fire('house-screen-effort');
assert.equal(sizes.length, 1, 'Unchanged canvas geometry reset the game');
c.window.House.screenEffort = 'background'; c.document.fire('house-screen-effort');
assert.deepEqual([canvas.W, canvas.H, cv.width, cv.height], [320, 200, 400, 250]);
c.window.House.screenEffort = 'direct'; c.document.fire('house-screen-effort');
assert.deepEqual([canvas.W, canvas.H, cv.width, cv.height], [320, 200, 800, 500]);
assert.deepEqual(transforms.at(-1), [2.5, 0, 0, 2.5, 0, 0]);
kit._cleanup();
// Gamepad departure/disconnection also cancels outstanding mouse ownership;
// touch and pen are never added to the PC cancellation registry.
const h = gameFixture();
h.pads([{ index: 0, connected: true, buttons: [{ pressed: true }], axes: [] }]); h.poll();
for (const [pointerId, pointerType] of [[31, 'touch'], [32, 'pen'], [33, 'mouse']]) {
  h.host.fire('pointerdown', { target: h.target, pointerId, pointerType });
}
h.pads([]); h.poll(); assert.equal(h.api.mode, 'mouse');
assert.deepEqual(h.cancelled, [33], 'Gamepad disconnect failed to cancel only PC pointers');
h.G._cleanup();
console.log('HS INPUT UNIT PASS: PC modes, hardware/IME filtering, gamepad edges/disconnect, native icon activation, held keys and cancellation, narrow desktop layout, logical coordinates and background DPR');
