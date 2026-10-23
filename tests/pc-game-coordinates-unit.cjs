'use strict';
// CPU-only: real DesktopSurface homography, makeG, and game pointer handlers.
// The DOM/paint stubs supply geometry only; no browser, server, storage or game timers run.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../app/public/js', name), 'utf8');
const noop = () => {};
let scale = 0.35, perspective = 0;
const project = (x, y) => {
  const w = 1 + perspective * x;
  return { x: (91 + scale * x) / w, y: (47 + scale * y) / w };
};
const paint = new Proxy({ setTransform(...v) { this.transform = v; }, measureText: () => ({ width: 12 }),
  createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) },
{ get: (o, k) => k in o ? o[k] : noop });
class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.style = {}; this.children = []; this.listeners = new Map();
    this.offsetLeft = 0; this.offsetTop = 0; this.offsetWidth = 420; this.offsetHeight = 620;
    this.clientWidth = 1024; this.clientHeight = 768; this.scrollLeft = this.scrollTop = 0;
    this.classes = new Set(); this.classList = { contains: x => this.classes.has(x), add: x => this.classes.add(x),
      toggle: (x, on) => on ? this.classes.add(x) : this.classes.delete(x) };
    this.captures = new Set(); this.queries = new Map();
  }
  appendChild(e) { e.parentElement = this; e.offsetParent = this; this.children.push(e); return e; }
  contains(e) { return e === this || this.children.some(c => c.contains(e)); }
  get isConnected() { return surface.contains(this); }
  getBoundingClientRect() {
    const css = this.style.cssText || '';
    const probe = css.match(/left:(\d+)%;top:(\d+)%/);
    if (probe) { const p = project(+probe[1] * 10.24, +probe[2] * 7.68); return { left: p.x, top: p.y }; }
    const r = ctx.DesktopSurface.rect(this), a = project(r.left, r.top), b = project(r.right, r.bottom);
    return { left: a.x, top: a.y, right: b.x, bottom: b.y, width: b.x - a.x, height: b.y - a.y };
  }
  querySelector(s) { if (!this.queries.has(s)) this.queries.set(s, this.appendChild(new Element())); return this.queries.get(s); }
  querySelectorAll() { return []; }
  setAttribute() {} remove() {} closest() { return null; } focus() {}
  addEventListener(n, f) { if (!this.listeners.has(n)) this.listeners.set(n, new Set()); this.listeners.get(n).add(f); }
  removeEventListener(n, f) { this.listeners.get(n)?.delete(f); }
  setPointerCapture(id) { this.captures.add(id); }
  getContext() { return paint; }
  fire(n, p) { for (const fn of this.listeners.get(n) || []) fn({ target: this, pointerId: 1, pointerType: 'touch', button: 0, preventDefault: noop, ...p }); }
}
const surface = new Element(), doc = new Element(), win = new Element();
doc.body = new Element('body'); doc.documentElement = new Element('html'); doc.hidden = false;
doc.getElementById = id => id === 'monitorSurface' ? surface : null;
doc.createElement = t => new Element(t);
let nextTimer = 0;
const timers = new Map(), saves = new Map();
const JG = { mods: {}, note: noop, fmt: String, css: noop, mod(id, f) { this.mods[id] = f; } };
const ctx = { console, document: doc, JGames: JG, JG, innerWidth: 390, innerHeight: 844,
  Event: class { constructor(type) { this.type = type; } }, dispatchEvent: noop,
  devicePixelRatio: 2, performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame: noop,
  setTimeout: (f, ms = 0) => { timers.set(++nextTimer, { f, ms }); return nextTimer; }, clearTimeout: id => timers.delete(id),
  setInterval: () => ++nextTimer, clearInterval: noop, matchMedia: () => ({ matches: true }),
  MutationObserver: class { observe() {} disconnect() {} },
  addEventListener: win.addEventListener.bind(win), removeEventListener: win.removeEventListener.bind(win),
  store: { get: (k, d) => d, set: noop }, sfx: noop, secret: noop, esc: String, about: noop, help: noop,
  Scores: () => ({ submit: noop, show: noop }), dialog: noop, Cast: { t: String },
  Image: class { set src(v) {} },
  Apps: { menubar: noop, gameSaver: (id, get) => { saves.set(id, get); return { watch() { return this; }, stop: noop, load: () => null, clear: noop, save: noop }; } }
};
ctx.window = ctx; vm.createContext(ctx);
const surfaceCode = read('desktop-surface.js');
vm.runInContext(surfaceCode.slice(0, surfaceCode.indexOf('  // Native browser title')) + '})();', ctx);
const kit = read('apps-games.js');
vm.runInContext(kit.slice(kit.indexOf('  function makeG('), kit.indexOf('\n  function launch(')), ctx);
for (const file of ['games-pinball.js', 'games-puzzle.js', 'games-chess.js']) vm.runInContext(read(file), ctx, { filename: file });
const near = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function game(id, W = 420, H = 620) {
  const el = surface.appendChild(new Element()), host = el.appendChild(new Element());
  host.offsetLeft = 23; host.offsetTop = 39; host.offsetWidth = W; host.offsetHeight = H;
  const G = ctx.makeG({ id }, { el, setTitle: noop }, host);
  const nativeCanvas = G.canvas;
  G.canvas = (...args) => { const C = nativeCanvas(...args); G.C = C; return C; };
  G.loop = fn => { G.testDraw = () => fn(0, true); };
  JG.mods[id](G);
  // Only the deferred initial size callback; never advance physics, RAF or game timers.
  for (const [id, timer] of [...timers]) { if (timer.ms === 0) { timers.delete(id); timer.f(); } }
  return G;
}
const pointer = (G, x, y, n = 'pointerdown', id = 1) => {
  const r = G.rect(G.C.cv), p = G.client(r.left + x, r.top + y);
  // Same physical coordinates used by the PC trackpad's synthetic events.
  G.C.cv.fire(n, { pointerId: id, clientX: p.x, clientY: p.y });
};
for (const view of [{ scale: 1, perspective: 0 }, { scale: 0.35, perspective: 0 }, { scale: 0.6, perspective: 0.00025 }]) {
  ({ scale, perspective } = view);
  const G = game('pinball'), C = G.C;
  assert.equal(C.W, 420); assert.equal(C.H, 620);
  assert.equal(C.cv.width, 840); assert.equal(C.cv.height, 1240);
  assert.equal(C.cv.style.width, '420px'); assert.equal(C.cv.style.height, '620px');
  const r = G.rect(C.cv), p = G.client(r.left + 252, r.top + 300), q = G.point({ clientX: p.x, clientY: p.y });
  near(q.x - r.left, 252); near(q.y - r.top, 300);
  // Lane rotation exposes which flipper was pressed without changing the physics.
  const S = G.dbgS(); S.launched = true; S.lanes = [1, 0, 0, 0];
  pointer(G, C.W * 0.6, 300);
  assert.deepEqual(Array.from(S.lanes), [0, 1, 0, 0], '60% width must press the right flipper');
  assert(G.C.cv.captures.has(1));
  pointer(G, 252, 300, 'pointerup');
  pointer(G, 84, 300); assert.deepEqual(Array.from(S.lanes), [1, 0, 0, 0], '20% width must press left');
  pointer(G, 84, 300, 'pointercancel');
  // Canvas sizing must survive projection changes and retain its last size while hidden.
  scale *= 0.8; C.fit(); assert.equal(C.W, 420); assert.equal(C.cv.width, 840);
  G.host.offsetWidth = 0; C.fit(); assert.equal(C.W, 420); G.host.offsetWidth = 420;
  ctx.House={screenEffort:'background'};doc.fire('house-screen-effort');assert.equal(C.W,420);assert.equal(C.H,620);assert.equal(C.cv.width,420);assert.equal(C.cv.height,620);assert.equal(C.cv.style.width,'420px');assert.equal(G.dbgS(),S,'Resting canvas replaced game state');ctx.House.screenEffort='interactive';doc.fire('house-screen-effort');assert.equal(C.cv.width,840);assert.equal(C.cv.height,1240);delete ctx.House;
  ctx.devicePixelRatio = 3; C.fit(); assert.equal(C.cv.width, 1050); ctx.devicePixelRatio = 2;
  G._cleanup(); assert.equal(C.cv.listeners.get('pointerdown').size, 0);

  const slide = game('slide'); slide.dbg.solveAlmost();
  // The module's real draw callback computes its tray geometry before receiving input.
  // Extract only its loop callback through G.loop, with dt=0 so timing stays unchanged.
  slide.testDraw();
  const W = slide.C.W, H = slide.C.H, side = Math.floor(Math.min(W, H) - 16), cs = (side - 8) / 4;
  const x0 = Math.floor((W - side) / 2), y0 = H > W * 1.25 ? 8 : Math.floor((H - side) / 2);
  pointer(slide, x0 + 4 + 3.5 * cs, y0 + 4 + 3.5 * cs);
  const saved = saves.get('games.slide')();
  assert.equal(saved, null, 'Clicking final tile must solve Slider 15');
  slide._cleanup();

  const chess = game('chess', 420, 620), cw = chess.C.W, ch = chess.C.H;
  const sz = Math.max(8, Math.floor((Math.min(cw, ch) - 32 - 6) / 8));
  const ox = Math.floor((cw - sz * 8) / 2), oy = Math.floor((ch - sz * 8) / 2);
  pointer(chess, ox + 4.5 * sz, oy + 6.5 * sz);
  assert.equal(chess.dbg().sel, 52, 'Physical input must select e2');
  assert(chess.C.cv.captures.has(1));
  pointer(chess, ox + 4.5 * sz, oy + 4.5 * sz, 'pointermove');
  pointer(chess, ox + 4.5 * sz, oy + 4.5 * sz, 'pointerup');
  assert.equal(chess.dbg().moves[0], 'e4', 'Physical drag must move e2 to e4');
  chess._cleanup();
}
console.log('PC game canvas + pointer regression passed: native/scaled/perspective; pinball, Slider 15, chess.');
