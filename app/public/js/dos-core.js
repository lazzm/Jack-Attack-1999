/* dos-core: the JackOS 98 text-mode engine. An 80x25 (or 40x25) VGA-style character screen drawn on a canvas,
 * with a hand-built box-drawing set, a pixel font rasterised from the visitor's own monospace font, the 16 CGA
 * colours, a keyboard/mouse event queue (with a hidden input so phones get a keyboard), a little TUI toolkit
 * (menus, dialogs, list boxes) and the text editor widget used by EDIT and JBASIC. Loaded lazily by apps-dos.js. */
(function () {
  'use strict';
  const DOS = window.DOS = window.DOS || {};
  if (DOS.core) return;

  // ================================================================ code page 437 (so CHR$(219) is a block, as it should be)
  const CP437 = [...'\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ '];
  const CPIDX = new Map(CP437.map((c, i) => [c, i]));
  const chr = n => CP437[n & 255] || ' ';
  const asc = c => { if (!c) return 0; const i = CPIDX.get(c); return i == null ? (c.charCodeAt(0) & 255) : i; };
  const PAL = ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'];
  const PALRGB = PAL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

  // ================================================================ the font: 9x16 cells
  const CW = 9, CH = 16;
  const FONT = '13px "Lucida Console","Consolas","DejaVu Sans Mono","Liberation Mono","Courier New",monospace';
  const BOX = { // [up, right, down, left]: 0 none, 1 single, 2 double
    '─': [0, 1, 0, 1], '│': [1, 0, 1, 0], '┌': [0, 1, 1, 0], '┐': [0, 0, 1, 1], '└': [1, 1, 0, 0], '┘': [1, 0, 0, 1], '├': [1, 1, 1, 0], '┤': [1, 0, 1, 1], '┬': [0, 1, 1, 1], '┴': [1, 1, 0, 1], '┼': [1, 1, 1, 1],
    '═': [0, 2, 0, 2], '║': [2, 0, 2, 0], '╔': [0, 2, 2, 0], '╗': [0, 0, 2, 2], '╚': [2, 2, 0, 0], '╝': [2, 0, 0, 2], '╠': [2, 2, 2, 0], '╣': [2, 0, 2, 2], '╦': [0, 2, 2, 2], '╩': [2, 2, 0, 2], '╬': [2, 2, 2, 2],
    '╡': [1, 0, 1, 2], '╢': [2, 0, 2, 1], '╖': [0, 0, 2, 1], '╕': [0, 0, 1, 2], '╜': [2, 0, 0, 1], '╛': [1, 0, 0, 2], '╞': [1, 2, 1, 0], '╟': [2, 1, 2, 0], '╧': [1, 2, 0, 2], '╨': [2, 1, 0, 1], '╤': [0, 2, 1, 2], '╥': [0, 1, 2, 1], '╙': [2, 1, 0, 0], '╘': [1, 2, 0, 0], '╒': [0, 2, 1, 0], '╓': [0, 1, 2, 0], '╫': [2, 1, 2, 1], '╪': [1, 2, 1, 2],
  };
  const glyphBits = new Map(); // ch -> Uint8Array(CW*CH)
  let rc = null;
  function boxBits(a) {
    const b = new Uint8Array(CW * CH), cx = 4, cy = 8;
    const on = (x, y) => { if (x >= 0 && x < CW && y >= 0 && y < CH) b[y * CW + x] = 1; };
    const off = (x, y) => { if (x >= 0 && x < CW && y >= 0 && y < CH) b[y * CW + x] = 0; };
    const [u, r, d, l] = a;
    // double arms: a 3-wide band from the edge to the centre, then hollowed out down the middle
    if (u === 2) for (let y = 0; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) on(x, y);
    if (d === 2) for (let y = cy - 1; y < CH; y++) for (let x = cx - 1; x <= cx + 1; x++) on(x, y);
    if (l === 2) for (let x = 0; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) on(x, y);
    if (r === 2) for (let x = cx - 1; x < CW; x++) for (let y = cy - 1; y <= cy + 1; y++) on(x, y);
    if (u === 2) for (let y = 0; y <= cy; y++) off(cx, y);
    if (d === 2) for (let y = cy; y < CH; y++) off(cx, y);
    if (l === 2) for (let x = 0; x <= cx; x++) off(x, cy);
    if (r === 2) for (let x = cx; x < CW; x++) off(x, cy);
    const hd = l === 2 || r === 2, vd = u === 2 || d === 2;
    if (u === 1) for (let y = 0; y <= (hd ? cy + 1 : cy); y++) on(cx, y);
    if (d === 1) for (let y = hd ? cy - 1 : cy; y < CH; y++) on(cx, y);
    if (l === 1) for (let x = 0; x <= (vd ? cx + 1 : cx); x++) on(x, cy);
    if (r === 1) for (let x = vd ? cx - 1 : cx; x < CW; x++) on(x, cy);
    return b;
  }
  function blockBits(ch) {
    const b = new Uint8Array(CW * CH);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      let v = 0;
      if (ch === '█') v = 1;
      else if (ch === '▄') v = y >= 8;
      else if (ch === '▀') v = y < 8;
      else if (ch === '▌') v = x < 5;
      else if (ch === '▐') v = x >= 5;
      else if (ch === '░') v = (y % 2 === 0 && x % 4 === 0) || (y % 2 === 1 && x % 4 === 2);
      else if (ch === '▒') v = (x + y) % 2 === 0;
      else if (ch === '▓') v = !((y % 2 === 0 && x % 4 === 1) || (y % 2 === 1 && x % 4 === 3));
      else if (ch === '■') v = x >= 2 && x <= 6 && y >= 5 && y <= 10;
      b[y * CW + x] = v ? 1 : 0;
    }
    return b;
  }
  function rasterBits(ch) {
    if (!rc) { rc = document.createElement('canvas'); rc.width = CW * 2; rc.height = CH; }
    const x = rc.getContext('2d', { willReadFrequently: true });
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, rc.width, rc.height);
    x.font = FONT; x.textBaseline = 'alphabetic'; x.fillStyle = '#fff';
    const w = x.measureText(ch).width || 1, sx = Math.min(1, 7.6 / w);
    x.setTransform(sx, 0, 0, 1, Math.round((8 - w * sx) / 2), 0);
    x.fillText(ch, 0, 12);
    const d = x.getImageData(0, 0, CW, CH).data, b = new Uint8Array(CW * CH);
    for (let i = 0; i < CW * CH; i++) b[i] = d[i * 4 + 3] > 96 ? 1 : 0;
    // VGA fonts have 2-pixel-wide vertical strokes: smear one pixel to the right
    const o = new Uint8Array(CW * CH);
    for (let yy = 0; yy < CH; yy++) for (let xx = 0; xx < CW; xx++) o[yy * CW + xx] = b[yy * CW + xx] | (xx > 0 ? b[yy * CW + xx - 1] : 0);
    return o;
  }
  function bits(ch) {
    let g = glyphBits.get(ch);
    if (g) return g;
    if (ch === ' ' || ch === '\0' || ch === ' ' || !ch) g = new Uint8Array(CW * CH);
    else if (BOX[ch]) g = boxBits(BOX[ch]);
    else if (/[▀-▟■]/.test(ch)) g = blockBits(ch);
    else g = rasterBits(ch);
    glyphBits.set(ch, g);
    return g;
  }
  const glyphCv = new Map(); // ch + fg -> canvas
  function glyph(ch, fg) {
    const k = ch + '\u0001' + fg;
    let c = glyphCv.get(k);
    if (c) return c;
    const b = bits(ch);
    c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const x = c.getContext('2d'), im = x.createImageData(CW, CH), [r, g, bl] = PALRGB[fg & 15];
    for (let i = 0; i < CW * CH; i++) if (b[i]) { im.data[i * 4] = r; im.data[i * 4 + 1] = g; im.data[i * 4 + 2] = bl; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0);
    glyphCv.set(k, c);
    return c;
  }
  // an 8x8 version for graphics modes (SCREEN 13 prints 40x25 with 8x8 characters)
  const g8 = new Map();
  function bits8(ch) {
    let g = g8.get(ch); if (g) return g;
    const b = bits(ch); g = new Uint8Array(64);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g[y * 8 + x] = b[(y * 2) * CW + x] | b[(y * 2 + 1) * CW + x];
    g8.set(ch, g); return g;
  }

  // ================================================================ Screen: a character buffer + attributes, drawn to a canvas
  // attribute = fg (0-15) | bg << 4 (0-15) | blink << 8
  class Screen {
    constructor(cols, rows) {
      this.canvas = document.createElement('canvas'); this.canvas.className = 'dos-cv';
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.cur = { x: 0, y: 0, on: true, block: false };
      this.mouse = { x: -1, y: -1, on: false };
      this.gfx = null;
      this.resize(cols || 80, rows || 25);
    }
    resize(cols, rows) {
      this.cols = cols; this.rows = rows;
      this.ch = new Array(cols * rows).fill(' ');
      this.at = new Uint16Array(cols * rows).fill(7);
      this.dirty = new Uint8Array(cols * rows).fill(1); this.anyDirty = true;
      if (!this.gfx) { this.canvas.width = cols * CW; this.canvas.height = rows * CH; }
      this.cur.x = Math.min(this.cur.x, cols - 1); this.cur.y = Math.min(this.cur.y, rows - 1);
      if (this.onresize) this.onresize();
    }
    mark(i) { this.dirty[i] = 1; this.anyDirty = true; }
    set(x, y, c, a) {
      if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
      const i = y * this.cols + x; c = c || ' ';
      if (this.ch[i] !== c || (a != null && this.at[i] !== a)) { this.ch[i] = c; if (a != null) this.at[i] = a; this.mark(i); }
    }
    print(x, y, s, a) { s = String(s); let i = 0; for (const c of s) { this.set(x + i, y, c, a); i++; } return i; }
    fill(x, y, w, h, c, a) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c, a); }
    paint(x, y, w, h, a) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { if (xx < 0 || yy < 0 || xx >= this.cols || yy >= this.rows) continue; const i = yy * this.cols + xx; if (this.at[i] !== a) { this.at[i] = a; this.mark(i); } } }
    shadow(x, y, w, h) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { if (xx < 0 || yy < 0 || xx >= this.cols || yy >= this.rows) continue; const i = yy * this.cols + xx; this.at[i] = 8; this.mark(i); } }
    get(x, y) { const i = y * this.cols + x; return { c: this.ch[i], a: this.at[i] }; }
    text(y) { return this.ch.slice(y * this.cols, (y + 1) * this.cols).join(''); }
    all() { const out = []; for (let y = 0; y < this.rows; y++) out.push(this.text(y).replace(/\s+$/, '')); return out.join('\n').replace(/\n+$/, ''); }
    clear(a) { this.ch.fill(' '); this.at.fill(a == null ? 7 : a); this.dirty.fill(1); this.anyDirty = true; }
    scroll(top, bot, n, a) { // scroll rows top..bot up by n (negative = down)
      const C = this.cols;
      if (n > 0) { for (let y = top; y <= bot; y++) for (let x = 0; x < C; x++) { const s = y + n; if (s <= bot) { this.ch[y * C + x] = this.ch[s * C + x]; this.at[y * C + x] = this.at[s * C + x]; } else { this.ch[y * C + x] = ' '; this.at[y * C + x] = a == null ? 7 : a; } } }
      else if (n < 0) { for (let y = bot; y >= top; y--) for (let x = 0; x < C; x++) { const s = y + n; if (s >= top) { this.ch[y * C + x] = this.ch[s * C + x]; this.at[y * C + x] = this.at[s * C + x]; } else { this.ch[y * C + x] = ' '; this.at[y * C + x] = a == null ? 7 : a; } } }
      for (let y = top; y <= bot; y++) for (let x = 0; x < C; x++) this.dirty[y * C + x] = 1;
      this.anyDirty = true;
    }
    snap() { return { ch: this.ch.slice(), at: this.at.slice(), cur: Object.assign({}, this.cur), cols: this.cols, rows: this.rows }; }
    restore(s) { if (s.cols !== this.cols || s.rows !== this.rows) this.resize(s.cols, s.rows); this.ch = s.ch.slice(); this.at = s.at.slice(); Object.assign(this.cur, s.cur); this.dirty.fill(1); this.anyDirty = true; }
    box(x, y, w, h, a, dbl, title, ta) {
      const [tl, tr, bl, br, hz, vt] = dbl ? ['╔', '╗', '╚', '╝', '═', '║'] : ['┌', '┐', '└', '┘', '─', '│'];
      this.set(x, y, tl, a); this.set(x + w - 1, y, tr, a); this.set(x, y + h - 1, bl, a); this.set(x + w - 1, y + h - 1, br, a);
      for (let i = 1; i < w - 1; i++) { this.set(x + i, y, hz, a); this.set(x + i, y + h - 1, hz, a); }
      for (let j = 1; j < h - 1; j++) { this.set(x, y + j, vt, a); this.set(x + w - 1, y + j, vt, a); }
      if (title) { const t = ' ' + title + ' '; this.print(x + Math.max(1, ((w - t.length) / 2) | 0), y, t.slice(0, w - 2), ta == null ? a : ta); }
    }
    // ---- graphics modes (JBASIC SCREEN 13 / 12)
    setGfx(g) {
      this.gfx = g;
      if (g) { this.canvas.width = g.w; this.canvas.height = g.h; g.img = this.ctx.createImageData(g.w, g.h); g.dirty = true; }
      else { this.canvas.width = this.cols * CW; this.canvas.height = this.rows * CH; this.dirty.fill(1); this.anyDirty = true; }
      if (this.onresize) this.onresize();
    }
    render(now) {
      const g = this.gfx;
      if (g) {
        if (!g.dirty) return;
        g.dirty = false;
        const d = g.img.data, p = g.pix, pal = g.pal;
        for (let i = 0, n = p.length; i < n; i++) { const c = pal[p[i]]; d[i * 4] = c >> 16 & 255; d[i * 4 + 1] = c >> 8 & 255; d[i * 4 + 2] = c & 255; d[i * 4 + 3] = 255; }
        this.ctx.putImageData(g.img, 0, 0);
        return;
      }
      const C = this.cols, cur = this.cur, ms = this.mouse;
      const cphase = cur.on && ((now / 233 | 0) & 1) === 0, bphase = ((now / 467 | 0) & 1) === 0;
      const ci = cur.y * C + cur.x, mi = ms.on && ms.x >= 0 ? ms.y * C + ms.x : -1;
      if (this._ci !== ci || this._cp !== cphase || this._cb !== cur.block) { if (this._ci != null && this._ci < this.dirty.length) this.dirty[this._ci] = 1; this.dirty[ci] = 1; this._ci = ci; this._cp = cphase; this._cb = cur.block; this.anyDirty = true; }
      if (this._mi !== mi) { if (this._mi >= 0 && this._mi < this.dirty.length) this.dirty[this._mi] = 1; if (mi >= 0) this.dirty[mi] = 1; this._mi = mi; this.anyDirty = true; }
      if (this._bp !== bphase) { this._bp = bphase; for (let i = 0; i < this.at.length; i++) if (this.at[i] & 256) { this.dirty[i] = 1; this.anyDirty = true; } }
      if (!this.anyDirty) return;
      this.anyDirty = false;
      const x = this.ctx;
      for (let i = 0; i < this.dirty.length; i++) {
        if (!this.dirty[i]) continue;
        this.dirty[i] = 0;
        let a = this.at[i];
        if (i === mi) a = (a & 0xff00) | ((a & 0xff) ^ 0x77);
        const cx = (i % C) * CW, cy = (i / C | 0) * CH, fg = a & 15, bg = a >> 4 & 15;
        x.fillStyle = PAL[bg]; x.fillRect(cx, cy, CW, CH);
        const c = this.ch[i];
        if (c !== ' ' && !((a & 256) && !bphase)) x.drawImage(glyph(c, fg), cx, cy);
        if (i === ci && cphase) { x.fillStyle = PAL[fg === bg ? 7 : fg]; if (cur.block) x.fillRect(cx, cy + 8, CW, 8); else x.fillRect(cx, cy + 13, CW, 2); }
      }
    }
  }

  // ================================================================ Term: a teletype on top of a Screen (wrap, scroll, ANSI escapes)
  class Term {
    constructor(scr) { this.s = scr; this.x = 0; this.y = 0; this.attr = 7; this.esc = null; this.top = 0; this.saved = null; }
    get bottom() { return this.s.rows - 1; }
    sync() { this.s.cur.x = Math.min(this.x, this.s.cols - 1); this.s.cur.y = this.y; }
    nl() { this.x = 0; if (++this.y > this.bottom) { this.s.scroll(this.top, this.bottom, 1, this.attr & 0xf0 | 7); this.y = this.bottom; } }
    cls() { this.s.clear(this.attr); this.x = 0; this.y = this.top; this.sync(); }
    putc(c) {
      if (this.esc !== null) return this.ansi(c);
      if (c === '\x1b') { this.esc = ''; return; }
      if (c === '\n') return this.nl();
      if (c === '\r') { this.x = 0; return; }
      if (c === '\b') { if (this.x > 0) this.x--; return; }
      if (c === '\t') { const n = 8 - (this.x % 8); for (let i = 0; i < n; i++) this.putc(' '); return; }
      if (c === '\x07') { DOS.beep(); return; }
      if (this.x >= this.s.cols) this.nl();
      this.s.set(this.x, this.y, c, this.attr); this.x++;
    }
    write(str) { for (const c of String(str)) this.putc(c); this.sync(); }
    line(str) { this.write((str == null ? '' : str) + '\n'); }
    ansi(c) {
      this.esc += c;
      if (this.esc === '[') return;
      if (this.esc[0] !== '[') { this.esc = null; return; }
      if (!/[A-Za-z]/.test(c)) { if (this.esc.length > 20) this.esc = null; return; }
      const args = this.esc.slice(1, -1).split(';').map(n => n === '' ? NaN : +n), cmd = c; this.esc = null;
      const n = isNaN(args[0]) ? 1 : args[0];
      if (cmd === 'm') {
        let fg = this.attr & 15, bg = this.attr >> 4 & 15, bold = fg > 7, blink = this.attr & 256;
        const MAP = [0, 4, 2, 6, 1, 5, 3, 7];
        for (const v of (args.length ? args : [0])) {
          const a = isNaN(v) ? 0 : v;
          if (a === 0) { fg = 7; bg = 0; bold = false; blink = 0; }
          else if (a === 1) bold = true; else if (a === 5) blink = 256; else if (a === 22) bold = false;
          else if (a === 7) { const t = fg; fg = bg; bg = t & 7; }
          else if (a >= 30 && a <= 37) fg = MAP[a - 30]; else if (a >= 40 && a <= 47) bg = MAP[a - 40];
        }
        this.attr = ((fg & 7) | (bold ? 8 : 0)) | bg << 4 | blink;
      } else if (cmd === 'H' || cmd === 'f') { this.y = Math.max(0, Math.min(this.bottom, (isNaN(args[0]) ? 1 : args[0]) - 1)); this.x = Math.max(0, Math.min(this.s.cols - 1, (isNaN(args[1]) ? 1 : args[1]) - 1)); }
      else if (cmd === 'J') { if (args[0] === 2) this.cls(); }
      else if (cmd === 'K') { for (let x = this.x; x < this.s.cols; x++) this.s.set(x, this.y, ' ', this.attr); }
      else if (cmd === 'A') this.y = Math.max(0, this.y - n);
      else if (cmd === 'B') this.y = Math.min(this.bottom, this.y + n);
      else if (cmd === 'C') this.x = Math.min(this.s.cols - 1, this.x + n);
      else if (cmd === 'D') this.x = Math.max(0, this.x - n);
      else if (cmd === 's') this.saved = [this.x, this.y];
      else if (cmd === 'u' && this.saved) [this.x, this.y] = this.saved;
    }
  }

  // ================================================================ sound: a PC speaker (square waves), only when SFX are on
  let actx = null;
  function speaker() { if (!window.Sound || !Sound.on || !Sound.unlock) return null; try { actx = Sound.unlock(); } catch (e) { actx = null; } return actx; }
  DOS.tone = function (freq, dur, when) {
    const c = speaker(); if (!c || !(freq > 30) || !(dur > 0)) return;
    try {
      const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
      o.type = 'square'; o.frequency.value = Math.min(12000, freq);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 0.004); g.gain.setValueAtTime(0.045, t + Math.max(0.005, dur - 0.012)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  };
  DOS.beep = () => DOS.tone(800, 0.22);

  // ================================================================ Host: the console widget (screen + keyboard + mouse)
  const KILL = { kill: true };
  const touchDev = () => matchMedia('(hover:none)').matches;
  class Host {
    constructor(o) {
      o = o || {};
      this.o = o;
      this.el = document.createElement('div'); this.el.className = 'dos-host';
      this.el.innerHTML = '<div class="dos-scr"></div><textarea class="dos-kbd" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="JACK-DOS keyboard input"></textarea>';
      this.scrEl = this.el.querySelector('.dos-scr'); this.kbd = this.el.querySelector('.dos-kbd');
      const narrow = o.cols || (innerWidth < 560 ? 40 : 80);
      this.screen = new Screen(narrow, o.rows || 25);
      this.scrEl.appendChild(this.screen.canvas);
      this.term = new Term(this.screen);
      this.q = []; this.waiter = null; this.dead = false; this.brk = false; this.wantMouse = false; this.scale = 'auto';
      this.screen.onresize = () => this.fit();
      this._wire();
      const loop = now => { if (this.dead) return; if (this.el.isConnected && this.el.offsetParent !== null) this.screen.render(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      this._ro = window.ResizeObserver ? new ResizeObserver(() => this.fit()) : null;
      if (this._ro) this._ro.observe(this.scrEl); else addEventListener('resize', () => this.fit());
    }
    // ---- input
    push(ev) {
      if (this.dead) return;
      if (ev.type === 'key' && ev.ctrl && (ev.key === 'c' || ev.key === 'C' || ev.key === 'Pause' || ev.key === 'Cancel')) this.brk = true;
      if (this.onkey && ev.type === 'key' && this.onkey(ev) === false) return;
      if (this.waiter) { const w = this.waiter; this.waiter = null; w(ev); }
      else { this.q.push(ev); if (this.q.length > 64) this.q.shift(); }
    }
    readEvent() { if (this.dead) return Promise.reject(KILL); if (this.q.length) return Promise.resolve(this.q.shift()); return new Promise((res, rej) => { this.waiter = res; this._rej = rej; }); }
    async readKey() { for (;;) { const e = await this.readEvent(); if (e.type === 'key') return e; } }
    pollKey() { while (this.q.length) { const e = this.q.shift(); if (e.type === 'key') return e; } return null; }
    flush() { this.q.length = 0; this.brk = false; }
    sleep(ms) { return new Promise((res, rej) => { if (this.dead) return rej(KILL); const t = setTimeout(() => this.dead ? rej(KILL) : res(), ms); this._sleeps = (this._sleeps || 0) + 1; void t; }); }
    focus() { try { this.kbd.focus({ preventScroll: true }); } catch (e) { this.kbd.focus(); } }
    cellAt(ev) {
      const r = this.screen.canvas.getBoundingClientRect(), s = this.screen;
      if (s.gfx) return { x: Math.floor((ev.clientX - r.left) / r.width * s.gfx.w), y: Math.floor((ev.clientY - r.top) / r.height * s.gfx.h), px: true };
      return { x: Math.max(0, Math.min(s.cols - 1, Math.floor((ev.clientX - r.left) / r.width * s.cols))), y: Math.max(0, Math.min(s.rows - 1, Math.floor((ev.clientY - r.top) / r.height * s.rows))) };
    }
    _wire() {
      const k = this.kbd, SENT = '    ';
      let last = SENT, composing = false, altAlone = false;
      const reset = () => { k.value = SENT; last = SENT; try { k.setSelectionRange(SENT.length, SENT.length); } catch (e) {} };
      reset();
      k.addEventListener('keydown', e => {
        if (e.isComposing || e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') return;
        if (e.key === 'Alt') { altAlone = true; e.preventDefault(); return; }
        altAlone = false;
        if (e.key === 'Enter' && e.altKey) { e.preventDefault(); if (this.onfull) this.onfull(); return; }
        if ((e.ctrlKey || e.metaKey) && /^[vV]$/.test(e.key) && !e.altKey) return; // let the paste event through
        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta' || e.key === 'CapsLock') return;
        const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey;
        e.preventDefault(); e.stopPropagation();
        this.push({ type: 'key', key: e.key, ch: printable && !e.altKey ? e.key : '', ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey });
      });
      k.addEventListener('keyup', e => { if (e.key === 'Alt') { e.preventDefault(); if (altAlone) this.push({ type: 'key', key: 'AltUp', ch: '' }); altAlone = false; } });
      k.addEventListener('compositionstart', () => { composing = true; });
      k.addEventListener('compositionend', () => { composing = false; setTimeout(() => { if (!composing) reset(); }, 0); });
      k.addEventListener('input', () => {
        const cur = k.value;
        let p = 0; while (p < last.length && p < cur.length && last[p] === cur[p]) p++;
        for (let i = 0; i < last.length - p; i++) this.push({ type: 'key', key: 'Backspace', ch: '' });
        for (const c of cur.slice(p)) {
          if (c === '\n') this.push({ type: 'key', key: 'Enter', ch: '' });
          else if (c !== ' ') this.push({ type: 'key', key: c, ch: c });
        }
        last = cur;
        if (!composing && (cur.length < 2 || cur.length > 40 || /\n/.test(cur) || !cur.startsWith(' '))) reset();
        else if (!composing && cur !== SENT && !/[a-z]$/i.test(cur)) reset();
      });
      k.addEventListener('blur', () => { if (!composing) reset(); });
      k.addEventListener('paste', e => {
        e.preventDefault();
        const t = (e.clipboardData && e.clipboardData.getData('text')) || '';
        this.typeText(t);
      });
      // mouse / touch on the screen
      const cv = this.screen.canvas;
      let down = false, lastClick = 0, lastCell = null;
      this.el.addEventListener('pointerdown', ev => {
        if (ev.target.closest('.dos-keys,.dos-tool')) return;
        if (!touchDev()) ev.preventDefault();
        this.focus();
        if (ev.target !== cv && !ev.target.closest('.dos-scr')) return;
        const c = this.cellAt(ev); down = true;
        const now = Date.now(), dbl = now - lastClick < 400 && lastCell && lastCell.x === c.x && lastCell.y === c.y; lastClick = now; lastCell = c;
        if (this.wantMouse) { this.screen.mouse.on = !touchDev(); this.screen.mouse.x = c.x; this.screen.mouse.y = c.y; this.push({ type: 'mouse', act: 'down', x: c.x, y: c.y, btn: ev.button, px: c.px }); if (dbl) this.push({ type: 'mouse', act: 'dbl', x: c.x, y: c.y, px: c.px }); }
        try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      });
      this.el.addEventListener('click', ev => { if (!ev.target.closest('.dos-keys,.dos-tool')) this.focus(); });
      cv.addEventListener('pointermove', ev => {
        if (!this.wantMouse) return;
        const c = this.cellAt(ev);
        if (!touchDev()) { this.screen.mouse.on = true; }
        if (c.x !== this.screen.mouse.x || c.y !== this.screen.mouse.y) { this.screen.mouse.x = c.x; this.screen.mouse.y = c.y; this.push({ type: 'mouse', act: down ? 'drag' : 'move', x: c.x, y: c.y, px: c.px }); }
      });
      cv.addEventListener('pointerup', ev => { if (!down) return; down = false; if (this.wantMouse) { const c = this.cellAt(ev); this.push({ type: 'mouse', act: 'up', x: c.x, y: c.y, px: c.px }); } });
      cv.addEventListener('pointerleave', () => { if (!down) { this.screen.mouse.x = -1; } });
      cv.addEventListener('wheel', ev => { if (!this.wantMouse) return; ev.preventDefault(); const c = this.cellAt(ev); this.push({ type: 'mouse', act: 'wheel', x: c.x, y: c.y, dy: Math.sign(ev.deltaY) }); }, { passive: false });
    }
    typeText(t) { for (const c of String(t).replace(/\r\n?/g, '\n').slice(0, 2000)) { if (c === '\n') this.push({ type: 'key', key: 'Enter', ch: '' }); else if (c >= ' ') this.push({ type: 'key', key: c, ch: c }); } }
    setMouse(on) { on = !!on && !this.noMouse; this.wantMouse = on; this.screen.mouse.on = on && !touchDev(); if (!on) this.screen.mouse.x = -1; this.screen.anyDirty = true; }
    // ---- layout: scale the canvas into the available space
    fit() {
      const cv = this.screen.canvas, box = this.scrEl, s = this.screen;
      const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
      const iw = cv.width, ih = cv.height;
      let w, h;
      if (this.full || s.gfx) { // full screen: stretch to a 4:3 monitor like a real VGA screen
        const ar = 4 / 3; w = Math.min(W, H * ar); h = w / ar;
        if (!this.full && s.gfx) { const k = Math.max(1, Math.floor(Math.min(W / iw, H / ih))); w = Math.min(W, iw * k); h = w * 0.75; if (h > H) { h = H; w = h * 4 / 3; } }
      } else if (this.scale === 'auto') { const k = Math.min(W / iw, H / ih); const kk = k >= 1 ? Math.floor(k * 4) / 4 : k; w = iw * kk; h = ih * kk; }
      else { w = iw * this.scale; h = ih * this.scale; }
      cv.style.width = Math.max(1, Math.floor(w)) + 'px'; cv.style.height = Math.max(1, Math.floor(h)) + 'px';
    }
    destroy() { this.dead = true; if (this._rej) { const r = this._rej; this._rej = null; this.waiter = null; r(KILL); } if (this._ro) this._ro.disconnect(); }
  }

  // ================================================================ line editor (DOSKEY style), used by COMMAND, INPUT and the adventure
  // opts: { hist: array, complete(text) -> [text, ...] , max, insert, password, upper }
  async function readLine(host, opts) {
    opts = opts || {};
    const t = host.term, s = host.screen;
    const x0 = t.x, y0 = t.y; let buf = opts.init || '', pos = buf.length, ins = opts.insert !== false, hi = opts.hist ? opts.hist.length : 0, comp = null;
    let shownLen = 0, y = y0;
    const draw = () => {
      // re-render the edit buffer from (x0, y0), wrapping and scrolling as needed
      const text = opts.password ? '*'.repeat(buf.length) : buf;
      const total = Math.max(text.length, shownLen);
      const C = s.cols;
      let need = Math.floor((x0 + total) / C);
      while (y + need > s.rows - 1) { s.scroll(t.top, s.rows - 1, 1, t.attr & 0xf0 | 7); y--; }
      for (let i = 0; i < total; i++) { const p = x0 + i; s.set(p % C, y + Math.floor(p / C), i < text.length ? text[i] : ' ', t.attr); }
      shownLen = text.length;
      const p = x0 + pos; s.cur.x = p % C; s.cur.y = y + Math.floor(p / C); s.cur.block = !ins;
      t.x = s.cur.x; t.y = s.cur.y;
    };
    draw();
    for (;;) {
      const e = await host.readKey();
      if (e.key !== 'Tab') comp = null;
      if (e.key === 'Enter') break;
      if (e.ctrl && (e.key === 'c' || e.key === 'C' || e.key === 'Pause')) { pos = buf.length; draw(); t.x = (x0 + buf.length) % s.cols; t.y = y + Math.floor((x0 + buf.length) / s.cols); t.write('^C'); s.cur.block = false; t.line(); host.brk = false; return null; }
      if (e.ctrl && (e.key === 'z' || e.key === 'Z')) { buf = buf.slice(0, pos) + '^Z' + buf.slice(pos); pos += 2; draw(); continue; }
      if (e.key === 'F6') { buf = buf.slice(0, pos) + '^Z' + buf.slice(pos); pos += 2; draw(); continue; }
      if (e.key === 'Backspace') { if (pos > 0) { buf = buf.slice(0, pos - 1) + buf.slice(pos); pos--; } }
      else if (e.key === 'Delete') { buf = buf.slice(0, pos) + buf.slice(pos + 1); }
      else if (e.key === 'ArrowLeft') { if (e.ctrl) { while (pos > 0 && buf[pos - 1] === ' ') pos--; while (pos > 0 && buf[pos - 1] !== ' ') pos--; } else pos = Math.max(0, pos - 1); }
      else if (e.key === 'ArrowRight') { if (e.ctrl) { while (pos < buf.length && buf[pos] !== ' ') pos++; while (pos < buf.length && buf[pos] === ' ') pos++; } else pos = Math.min(buf.length, pos + 1); }
      else if (e.key === 'Home') pos = 0;
      else if (e.key === 'End') pos = buf.length;
      else if (e.key === 'Insert') ins = !ins;
      else if (e.key === 'Escape') { buf = ''; pos = 0; }
      else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && opts.hist && opts.hist.length) { hi = e.key === 'PageUp' ? 0 : Math.max(0, hi - 1); buf = opts.hist[hi] || ''; pos = buf.length; }
      else if ((e.key === 'ArrowDown' || e.key === 'PageDown') && opts.hist && opts.hist.length) { hi = e.key === 'PageDown' ? opts.hist.length - 1 : Math.min(opts.hist.length, hi + 1); buf = opts.hist[hi] || ''; pos = buf.length; }
      else if (e.key === 'F3' && opts.hist && opts.hist.length) { const l = opts.hist[opts.hist.length - 1]; if (l.length > buf.length) buf = buf + l.slice(buf.length); pos = buf.length; }
      else if (e.key === 'F7' && opts.onF7) { await opts.onF7(); t.x = x0; t.y = y; draw(); continue; }
      else if (e.key === 'Tab' && opts.complete) {
        if (!comp) { comp = { list: opts.complete(buf.slice(0, pos)) || [], i: -1, tail: buf.slice(pos) }; }
        if (comp.list.length) { comp.i = (comp.i + (e.shift ? comp.list.length - 1 : 1)) % comp.list.length; buf = comp.list[comp.i] + comp.tail; pos = comp.list[comp.i].length; } else DOS.beep();
      }
      else if (e.ch) {
        if (opts.max && buf.length >= opts.max && (ins || pos >= buf.length)) { DOS.beep(); continue; }
        const c = opts.upper ? e.ch.toUpperCase() : e.ch;
        buf = ins ? buf.slice(0, pos) + c + buf.slice(pos) : buf.slice(0, pos) + c + buf.slice(pos + 1); pos++;
      }
      draw();
    }
    pos = buf.length; draw();
    s.cur.block = false;
    if (!opts.noNewline) t.line(); else { t.x = (x0 + buf.length) % s.cols; t.y = y + Math.floor((x0 + buf.length) / s.cols); t.sync(); }
    if (opts.hist && buf.trim() && opts.hist[opts.hist.length - 1] !== buf) { opts.hist.push(buf); if (opts.hist.length > 50) opts.hist.shift(); }
    return buf;
  }

  // ================================================================ TUI toolkit: menus, dialogs, message boxes (EDIT / JBASIC / Jack Commander)
  // Colours in the classic editor scheme
  const UI = { menu: 0x70, menuHot: 0x7f, menuSel: 0x07, menuSelHot: 0x0f, menuDis: 0x78, dlg: 0x70, dlgHot: 0x7f, field: 0x07, btnFocus: 0x7f, list: 0x70, listSel: 0x07 };
  // label strings use & to mark the hotkey letter: '&File'
  const hot = l => { const i = l.indexOf('&'); return i < 0 ? '' : l[i + 1].toLowerCase(); };
  const plain = l => l.replace('&', '');
  function drawHot(s, x, y, label, a, ah) { let i = 0, h = false; for (let k = 0; k < label.length; k++) { const c = label[k]; if (c === '&' && !h) { h = true; continue; } s.set(x + i, y, c, h === true ? ah : a); if (h === true) h = 1; i++; } return i; }

  // A menu bar on row 0. menus = [{label:'&File', items:[{label:'&New', key:'', act, dis}, '-' ...]}]
  // run() handles keyboard + mouse while the menus are open. Returns the chosen item's act (or null).
  async function menuBar(host, menus, startIdx, viaMouse, opt) {
    const s = host.screen, row = 0; opt = opt || {};
    const snap = s.snap();
    const xs = []; let x = 2;
    for (const m of menus) { xs.push(x); x += plain(m.label).length + 2; }
    if (opt.rightHelp) { /* Help sits on the far right in the classic editors */ const m = menus[menus.length - 1]; xs[menus.length - 1] = s.cols - plain(m.label).length - 3; }
    let mi = startIdx || 0, open = !!viaMouse || opt.open, ii = -1;
    const items = () => menus[mi].items.filter(Boolean);
    const firstOk = (from, dir) => { const l = items(); for (let k = 0; k < l.length; k++) { const j = (from + dir * k + l.length * 4) % l.length; if (l[j] !== '-' && !l[j].dis) return j; } return -1; };
    let geom = null;
    const draw = () => {
      s.restore(snap);
      s.fill(0, row, s.cols, 1, ' ', UI.menu);
      menus.forEach((m, k) => { const sel = k === mi; s.fill(xs[k] - 1, row, plain(m.label).length + 2, 1, ' ', sel ? UI.menuSel : UI.menu); drawHot(s, xs[k], row, m.label, sel ? UI.menuSel : UI.menu, sel ? UI.menuSelHot : UI.menuHot); });
      geom = null;
      if (!open) return;
      const l = items(), w = Math.max(...l.map(it => it === '-' ? 0 : plain(it.label).length + (it.key ? it.key.length + 3 : 0))) + 4, h = l.length + 2;
      let bx = Math.max(0, Math.min(s.cols - w - 2, xs[mi] - 2)), by = row + 1;
      s.fill(bx, by, w, h, ' ', UI.menu); s.box(bx, by, w, h, UI.menu, false);
      l.forEach((it, k) => {
        const yy = by + 1 + k;
        if (it === '-') { s.set(bx, yy, '├', UI.menu); for (let q = 1; q < w - 1; q++) s.set(bx + q, yy, '─', UI.menu); s.set(bx + w - 1, yy, '┤', UI.menu); return; }
        const sel = k === ii, a = it.dis ? UI.menuDis : sel ? UI.menuSel : UI.menu;
        s.fill(bx + 1, yy, w - 2, 1, ' ', a);
        if (it.chk) s.set(bx + 1, yy, '∙', a);
        drawHot(s, bx + 2, yy, it.label, a, it.dis ? a : sel ? UI.menuSelHot : UI.menuHot);
        if (it.key) s.print(bx + w - 2 - it.key.length, yy, it.key, a);
      });
      s.shadow(bx + w, by + 1, 2, h); s.shadow(bx + 2, by + h, w, 1);
      geom = { bx, by, w, h };
      s.cur.on = false;
    };
    const curWas = s.cur.on;
    if (open) ii = firstOk(0, 1);
    draw();
    let result = null;
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') {
        if (e.act === 'move') continue;
        if (e.y === row) { const k = xs.findIndex((xx, j) => e.x >= xx - 1 && e.x < xx + plain(menus[j].label).length + 1); if (k >= 0) { if (e.act === 'down' || e.act === 'drag') { mi = k; open = true; ii = e.act === 'down' ? -1 : ii; draw(); } continue; } if (e.act === 'down') break; continue; }
        if (geom && e.x > geom.bx && e.x < geom.bx + geom.w - 1 && e.y > geom.by && e.y < geom.by + geom.h - 1) {
          const k = e.y - geom.by - 1, it = items()[k];
          if (it && it !== '-' && !it.dis) { ii = k; draw(); if (e.act === 'up' || e.act === 'down' && touchDev()) { result = it; break; } }
          continue;
        }
        if (e.act === 'down') break;
        continue;
      }
      const k = e.key;
      if (k === 'Escape' || k === 'AltUp' && !open) break;
      if (k === 'AltUp' || k === 'F10') { break; }
      if (k === 'ArrowLeft') { mi = (mi + menus.length - 1) % menus.length; ii = open ? firstOk(0, 1) : -1; }
      else if (k === 'ArrowRight') { mi = (mi + 1) % menus.length; ii = open ? firstOk(0, 1) : -1; }
      else if (k === 'ArrowDown') { if (!open) { open = true; ii = firstOk(0, 1); } else ii = firstOk(ii + 1, 1); }
      else if (k === 'ArrowUp') { if (!open) { open = true; ii = firstOk(items().length - 1, -1); } else ii = firstOk(ii - 1 + items().length, -1); }
      else if (k === 'Enter') { if (!open) { open = true; ii = firstOk(0, 1); } else if (ii >= 0) { result = items()[ii]; break; } }
      else if (e.ch || e.alt) {
        const c = (e.key || '').toLowerCase();
        if (!open || e.alt) { const j = menus.findIndex(m => hot(m.label) === c); if (j >= 0) { mi = j; open = true; ii = firstOk(0, 1); } }
        else { const j = items().findIndex(it => it !== '-' && !it.dis && hot(it.label) === c); if (j >= 0) { result = items()[j]; break; } }
      }
      draw();
    }
    s.restore(snap); s.cur.on = curWas;
    return result;
  }

  // Message box: lines of text + buttons. Returns the button index (or -1 on Esc).
  async function msgBox(host, text, buttons, o) {
    o = o || {};
    const s = host.screen, snap = s.snap(), curWas = s.cur.on;
    buttons = buttons || ['OK'];
    const lines = wrap(String(text), Math.min(s.cols - 10, o.width || 52));
    const bw = buttons.reduce((n, b) => n + plain(b).length + 5, 0) + 2;
    const w = Math.min(s.cols - 2, Math.max(bw + 2, ...lines.map(l => l.length + 4), (o.title || '').length + 6)), h = lines.length + 5;
    const x = Math.floor((s.cols - w) / 2), y = Math.max(1, Math.floor((s.rows - h) / 2) - 1);
    let f = o.def || 0;
    const geo = [];
    const draw = () => {
      s.fill(x, y, w, h, ' ', o.attr || UI.dlg); s.box(x, y, w, h, o.attr || UI.dlg, false, o.title);
      lines.forEach((l, i) => s.print(x + (o.left ? 2 : Math.floor((w - l.length) / 2)), y + 1 + i, l, o.attr || UI.dlg));
      s.set(x, y + h - 3, '├', o.attr || UI.dlg); for (let q = 1; q < w - 1; q++) s.set(x + q, y + h - 3, '─', o.attr || UI.dlg); s.set(x + w - 1, y + h - 3, '┤', o.attr || UI.dlg);
      let bx = x + Math.floor((w - bw) / 2) + 1; geo.length = 0;
      buttons.forEach((b, i) => { const lab = '< ' + plain(b) + ' >'; s.print(bx, y + h - 2, lab, i === f ? UI.btnFocus : o.attr || UI.dlg); if (hot(b)) drawHot(s, bx + 2, y + h - 2, b, i === f ? UI.btnFocus : o.attr || UI.dlg, i === f ? UI.btnFocus : 0x7f); geo.push([bx, lab.length]); if (i === f) { s.cur.x = bx + 2; s.cur.y = y + h - 2; } bx += lab.length + 1; });
      s.shadow(x + w, y + 1, 2, h); s.shadow(x + 2, y + h, w, 1);
    };
    s.cur.on = true; draw();
    let r = -1;
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if (e.act === 'down' && e.y === y + h - 2) { const i = geo.findIndex(([bx, l]) => e.x >= bx && e.x < bx + l); if (i >= 0) { r = i; break; } } continue; }
      if (e.key === 'Enter' || e.key === ' ') { r = f; break; }
      if (e.key === 'Escape') { r = o.esc != null ? o.esc : -1; break; }
      if (e.key === 'Tab' || e.key === 'ArrowRight') f = (f + 1) % buttons.length;
      else if (e.key === 'ArrowLeft') f = (f + buttons.length - 1) % buttons.length;
      else if (e.ch) { const i = buttons.findIndex(b => hot(b) === e.ch.toLowerCase() || plain(b)[0].toLowerCase() === e.ch.toLowerCase()); if (i >= 0) { r = i; break; } }
      draw();
    }
    s.restore(snap); s.cur.on = curWas;
    return r;
  }

  // A small form dialog: controls [{type:'text', label, value, w}, {type:'list', items, h, w, value}, {type:'check', label, value}, {type:'btns', items:['OK','Cancel']}]
  async function form(host, title, ctrls, o) {
    o = o || {};
    const s = host.screen, snap = s.snap(), curWas = s.cur.on;
    const w = Math.min(s.cols - 2, o.w || 60);
    let hgt = 2; ctrls.forEach(c => { c.row = hgt - 1; hgt += c.type === 'list' ? c.h + 2 : c.type === 'text' ? 3 : c.type === 'btns' ? 2 : c.type === 'label' ? (c.rows || 1) : 1; });
    const h = Math.min(s.rows - 1, hgt + 1), x = Math.floor((s.cols - w) / 2), y = Math.max(1, Math.floor((s.rows - h) / 2));
    const focusable = ctrls.filter(c => c.type !== 'label');
    let fi = focusable.indexOf(focusable.find(c => c.focus) || focusable[0]);
    ctrls.forEach(c => { if (c.type === 'text') { c.value = c.value || ''; c.pos = c.value.length; c.sel = true; } if (c.type === 'list') { c.idx = Math.max(0, c.idx || 0); c.top = 0; } if (c.type === 'btns') c.f = 0; });
    const A = UI.dlg;
    const draw = () => {
      s.fill(x, y, w, h, ' ', A); s.box(x, y, w, h, A, false, title);
      ctrls.forEach(c => {
        const cy = y + 1 + c.row, foc = focusable[fi] === c;
        if (c.type === 'label') { wrap(c.text, w - 4).slice(0, c.rows || 1).forEach((l, i) => s.print(x + 2, cy + i, l, A)); }
        else if (c.type === 'text') {
          const lab = c.label || ''; drawHot(s, x + 2, cy + 1, lab, A, UI.dlgHot);
          const fx = x + 3 + plain(lab).length, fw = Math.max(4, (c.w || (w - 6 - plain(lab).length)));
          s.box(fx - 1, cy, fw + 2, 3, A, false);
          const v = c.value, off = Math.max(0, c.pos - fw + 1);
          s.fill(fx, cy + 1, fw, 1, ' ', foc && c.sel && v ? 0x70 ^ 0x77 : 0x70 ^ 0x77 & 0 | 0x70);
          s.print(fx, cy + 1, v.slice(off, off + fw), foc && c.sel && v ? 0x07 : 0x70);
          if (foc) { s.cur.x = fx + c.pos - off; s.cur.y = cy + 1; }
          c.geo = [fx, cy + 1, fw];
        } else if (c.type === 'list') {
          const lx = x + 2, lw = c.w || w - 4;
          if (c.label) drawHot(s, lx, cy, c.label, A, UI.dlgHot);
          s.box(lx, cy + 1, lw, c.h + 2, A, false);
          if (c.idx < c.top) c.top = c.idx; if (c.idx >= c.top + c.h) c.top = c.idx - c.h + 1;
          for (let i = 0; i < c.h; i++) { const it = c.items[c.top + i]; const sel = c.top + i === c.idx; s.fill(lx + 1, cy + 2 + i, lw - 2, 1, ' ', sel && foc ? 0x07 : sel ? 0x07 : A); if (it != null) s.print(lx + 2, cy + 2 + i, String(it).slice(0, lw - 4), sel ? (foc ? 0x0f : 0x07) : A); }
          if (c.items.length > c.h) { const sb = lx + lw - 1; s.set(sb, cy + 2, '↑', 0x70); s.set(sb, cy + 1 + c.h, '↓', 0x70); for (let i = 1; i < c.h - 1; i++) s.set(sb, cy + 2 + i, '░', 0x70); s.set(sb, cy + 3 + Math.floor((c.h - 3) * c.idx / Math.max(1, c.items.length - 1)), '■', 0x70); }
          if (foc) { s.cur.x = lx + 2; s.cur.y = cy + 2 + c.idx - c.top; }
          c.geo = [lx + 1, cy + 2, lw - 2, c.h];
        } else if (c.type === 'check') {
          s.print(x + 2, cy, '[' + (c.value ? 'X' : ' ') + '] ', A); drawHot(s, x + 6, cy, c.label, A, UI.dlgHot); if (foc) { s.cur.x = x + 3; s.cur.y = cy; } c.geo = [x + 2, cy, plain(c.label).length + 4];
        } else if (c.type === 'btns') {
          s.set(x, cy, '├', A); for (let q = 1; q < w - 1; q++) s.set(x + q, cy, '─', A); s.set(x + w - 1, cy, '┤', A);
          const bw = c.items.reduce((n, b) => n + plain(b).length + 5, 0); let bx = x + Math.floor((w - bw) / 2); c.geo = [];
          c.items.forEach((b, i) => { const lab = '< ' + plain(b) + ' >', on = foc && c.f === i || !foc && i === 0 && focusable[fi].type !== 'btns'; s.print(bx, cy + 1, lab, on ? UI.btnFocus : A); if (foc && c.f === i) { s.cur.x = bx + 2; s.cur.y = cy + 1; } c.geo.push([bx, cy + 1, lab.length]); bx += lab.length + 1; });
        }
      });
      s.shadow(x + w, y + 1, 2, h); s.shadow(x + 2, y + h, w, 1);
    };
    s.cur.on = true;
    let result = null;
    const finish = (btn) => { result = { btn, values: ctrls.map(c => c.type === 'text' ? c.value : c.type === 'list' ? c.items[c.idx] : c.type === 'check' ? c.value : null) }; };
    const btns = ctrls.find(c => c.type === 'btns');
    for (;;) {
      draw();
      if (o.onChange) o.onChange(ctrls);
      const e = await host.readEvent();
      const c = focusable[fi];
      if (e.type === 'mouse') {
        if (e.act !== 'down' && e.act !== 'dbl' && e.act !== 'wheel') continue;
        let hitAny = false;
        for (const cc of focusable) {
          const g = cc.geo; if (!g) continue;
          if (cc.type === 'btns') { const i = g.findIndex(([bx, by, l]) => e.y === by && e.x >= bx && e.x < bx + l); if (i >= 0 && e.act === 'down') { finish(cc.items[i]); hitAny = true; } }
          else if (cc.type === 'list' && e.x >= g[0] && e.x < g[0] + g[2] && e.y >= g[1] && e.y < g[1] + g[3]) { hitAny = true; fi = focusable.indexOf(cc); if (e.act === 'wheel') { cc.idx = Math.max(0, Math.min(cc.items.length - 1, cc.idx + e.dy * 3)); } else { cc.idx = Math.min(cc.items.length - 1, cc.top + e.y - g[1]); if (cc.onPick) cc.onPick(cc, ctrls); if (e.act === 'dbl' && o.onListEnter) { if (await o.onListEnter(cc, ctrls) === 'ok') finish(btns ? btns.items[0] : 'OK'); } } }
          else if (cc.type === 'list' && e.act === 'down' && e.x === g[0] + g[2] && e.y >= g[1] - 1 && e.y <= g[1] + g[3]) { hitAny = true; cc.idx = Math.max(0, Math.min(cc.items.length - 1, cc.idx + (e.y < g[1] + g[3] / 2 ? -cc.h : cc.h))); }
          else if (cc.type === 'text' && e.y === g[1] && e.x >= g[0] - 1 && e.x <= g[0] + g[2]) { hitAny = true; fi = focusable.indexOf(cc); cc.sel = false; cc.pos = Math.min(cc.value.length, e.x - g[0]); }
          else if (cc.type === 'check' && e.y === g[1] && e.x >= g[0] && e.x < g[0] + g[2]) { hitAny = true; fi = focusable.indexOf(cc); cc.value = !cc.value; }
        }
        if (result) break;
        void hitAny;
        continue;
      }
      const k = e.key;
      if (k === 'Escape') { result = { btn: null }; break; }
      if (k === 'Tab') { fi = (fi + (e.shift ? focusable.length - 1 : 1)) % focusable.length; if (focusable[fi].type === 'text') { focusable[fi].sel = true; focusable[fi].pos = focusable[fi].value.length; } continue; }
      if (k === 'Enter') {
        if (c.type === 'btns') { finish(c.items[c.f]); break; }
        if (c.type === 'list' && o.onListEnter) { const r = await o.onListEnter(c, ctrls); if (r === 'ok') { finish(btns ? btns.items[0] : 'OK'); break; } continue; }
        if (c.type === 'text' && o.onTextEnter) { const r = await o.onTextEnter(c, ctrls); if (r === 'list') { const li = focusable.findIndex(x => x.type === 'list'); if (li >= 0) fi = li; continue; } if (r !== 'ok') continue; }
        finish(btns ? btns.items[0] : 'OK'); break;
      }
      if (c.type === 'text') {
        if (c.sel && (e.ch || k === 'Backspace' || k === 'Delete')) { c.value = ''; c.pos = 0; c.sel = false; if (k === 'Backspace' || k === 'Delete') continue; }
        c.sel = false;
        if (k === 'Backspace') { if (c.pos > 0) { c.value = c.value.slice(0, c.pos - 1) + c.value.slice(c.pos); c.pos--; } }
        else if (k === 'Delete') c.value = c.value.slice(0, c.pos) + c.value.slice(c.pos + 1);
        else if (k === 'ArrowLeft') c.pos = Math.max(0, c.pos - 1);
        else if (k === 'ArrowRight') c.pos = Math.min(c.value.length, c.pos + 1);
        else if (k === 'Home') c.pos = 0; else if (k === 'End') c.pos = c.value.length;
        else if (e.ch && c.value.length < (c.max || 127)) { c.value = c.value.slice(0, c.pos) + e.ch + c.value.slice(c.pos); c.pos++; }
      } else if (c.type === 'list') {
        const n = c.items.length;
        if (k === 'ArrowDown') c.idx = Math.min(n - 1, c.idx + 1); else if (k === 'ArrowUp') c.idx = Math.max(0, c.idx - 1);
        else if (k === 'PageDown') c.idx = Math.min(n - 1, c.idx + c.h); else if (k === 'PageUp') c.idx = Math.max(0, c.idx - c.h);
        else if (k === 'Home') c.idx = 0; else if (k === 'End') c.idx = n - 1;
        else if (e.ch) { const j = c.items.findIndex((it, q) => q > c.idx && String(it).replace(/^\[/, '').toLowerCase().startsWith(e.ch.toLowerCase())); const j2 = j >= 0 ? j : c.items.findIndex(it => String(it).replace(/^\[/, '').toLowerCase().startsWith(e.ch.toLowerCase())); if (j2 >= 0) c.idx = j2; }
        if (c.onPick) c.onPick(c, ctrls);
      } else if (c.type === 'check') { if (k === ' ') c.value = !c.value; }
      else if (c.type === 'btns') { if (k === 'ArrowRight') c.f = (c.f + 1) % c.items.length; else if (k === 'ArrowLeft') c.f = (c.f + c.items.length - 1) % c.items.length; else if (k === ' ') { finish(c.items[c.f]); break; } }
    }
    s.restore(snap); s.cur.on = curWas;
    return result;
  }

  // word wrap that keeps blank lines
  function wrap(text, w) {
    const out = [];
    for (const para of String(text).split('\n')) {
      if (!para) { out.push(''); continue; }
      let line = '';
      for (const word of para.split(/(\s+)/)) {
        if (!word) continue;
        if ((line + word).length > w) { if (line.trim()) out.push(line.replace(/\s+$/, '')); line = word.replace(/^\s+/, ''); while (line.length > w) { out.push(line.slice(0, w)); line = line.slice(w); } }
        else line += word;
      }
      out.push(line.replace(/\s+$/, ''));
    }
    return out;
  }

  // ================================================================ the editor widget: a scrolling text buffer with selection (EDIT + JBASIC)
  class Editor {
    constructor(text) { this.setText(text || ''); this.ins = true; this.clip = ''; this.dirty = false; this.undo = []; }
    setText(t) { this.lines = String(t).replace(/\r\n?/g, '\n').replace(/\t/g, '        ').split('\n'); if (!this.lines.length) this.lines = ['']; this.r = 0; this.c = 0; this.top = 0; this.left = 0; this.sel = null; this.dirty = false; }
    text() { return this.lines.join('\n'); }
    selRange() { if (!this.sel) return null; let a = this.sel, b = { r: this.r, c: this.c }; if (a.r > b.r || a.r === b.r && a.c > b.c) [a, b] = [b, a]; if (a.r === b.r && a.c === b.c) return null; return [a, b]; }
    selText() { const R = this.selRange(); if (!R) return ''; const [a, b] = R; if (a.r === b.r) return this.lines[a.r].slice(a.c, b.c); const out = [this.lines[a.r].slice(a.c)]; for (let r = a.r + 1; r < b.r; r++) out.push(this.lines[r]); out.push(this.lines[b.r].slice(0, b.c)); return out.join('\n'); }
    snapUndo() { this.undo.push({ t: this.text(), r: this.r, c: this.c }); if (this.undo.length > 60) this.undo.shift(); }
    delSel() { const R = this.selRange(); if (!R) { this.sel = null; return false; } const [a, b] = R; const head = (this.lines[a.r] || '').slice(0, a.c), tail = (this.lines[b.r] || '').slice(b.c); this.lines.splice(a.r, b.r - a.r + 1, head + tail); this.r = a.r; this.c = a.c; this.sel = null; this.dirty = true; return true; }
    insert(str) {
      this.delSel();
      const parts = String(str).replace(/\r\n?/g, '\n').replace(/\t/g, '        ').split('\n');
      const line = this.lines[this.r]; const c = Math.min(this.c, line.length); const pad = this.c > line.length ? ' '.repeat(this.c - line.length) : '';
      const head = line.slice(0, c) + pad, tail = line.slice(c);
      if (parts.length === 1) { if (this.ins || str.length !== 1) this.lines[this.r] = head + parts[0] + tail; else this.lines[this.r] = head + parts[0] + tail.slice(1); this.c = head.length + parts[0].length; }
      else { const nl = [head + parts[0], ...parts.slice(1, -1), parts[parts.length - 1] + tail]; this.lines.splice(this.r, 1, ...nl); this.r += parts.length - 1; this.c = parts[parts.length - 1].length; }
      this.dirty = true;
    }
    newline(auto) { this.delSel(); const line = this.lines[this.r], c = Math.min(this.c, line.length); const ind = auto ? (line.match(/^ */)[0].length > c ? c : line.match(/^ */)[0].length) : 0; this.lines.splice(this.r, 1, line.slice(0, c), ' '.repeat(ind) + line.slice(c).replace(auto ? /^ +/ : /^$/, '')); this.r++; this.c = ind; this.dirty = true; }
    backspace() { if (this.delSel()) return; if (this.c > 0) { const l = this.lines[this.r]; if (this.c > l.length) { this.c--; return; } this.lines[this.r] = l.slice(0, this.c - 1) + l.slice(this.c); this.c--; } else if (this.r > 0) { const p = this.lines[this.r - 1]; this.c = p.length; this.lines[this.r - 1] = p + this.lines[this.r]; this.lines.splice(this.r, 1); this.r--; } this.dirty = true; }
    del() { if (this.delSel()) return; const l = this.lines[this.r]; if (this.c < l.length) this.lines[this.r] = l.slice(0, this.c) + l.slice(this.c + 1); else if (this.r < this.lines.length - 1) { this.lines[this.r] = l + ' '.repeat(this.c - l.length) + this.lines[this.r + 1]; this.lines.splice(this.r + 1, 1); } this.dirty = true; }
    move(dr, dc, shift) {
      if (shift && !this.sel) this.sel = { r: this.r, c: this.c }; else if (!shift) this.sel = null;
      this.r = Math.max(0, Math.min(this.lines.length - 1, this.r + dr));
      if (dc) { this.c += dc; if (this.c < 0) { if (this.r > 0 && dr === 0) { this.r--; this.c = this.lines[this.r].length; } else this.c = 0; } }
      this.c = Math.max(0, Math.min(255, this.c));
    }
    wordMove(dir, shift) {
      if (shift && !this.sel) this.sel = { r: this.r, c: this.c }; else if (!shift) this.sel = null;
      let l = this.lines[this.r];
      if (dir > 0) { if (this.c >= l.length && this.r < this.lines.length - 1) { this.r++; this.c = 0; l = this.lines[this.r]; while (this.c < l.length && l[this.c] === ' ') this.c++; return; } while (this.c < l.length && /\w/.test(l[this.c])) this.c++; while (this.c < l.length && !/\w/.test(l[this.c])) this.c++; }
      else { if (this.c === 0 && this.r > 0) { this.r--; this.c = this.lines[this.r].length; return; } this.c = Math.min(this.c, l.length); while (this.c > 0 && !/\w/.test(l[this.c - 1])) this.c--; while (this.c > 0 && /\w/.test(l[this.c - 1])) this.c--; }
    }
    find(q, from, mc) { if (!q) return null; const qq = mc ? q : q.toLowerCase(); for (let k = 0; k <= this.lines.length; k++) { const r = (this.r + k) % this.lines.length; const l = mc ? this.lines[r] : this.lines[r].toLowerCase(); const i = l.indexOf(qq, k === 0 ? (from == null ? this.c + 1 : from) : 0); if (i >= 0) return { r, c: i }; } return null; }
    // draw into a rectangle on the screen; attr = normal colour, selA = selected colour
    draw(s, x, y, w, h, attr, selA, colorize) {
      if (this.r < this.top) this.top = this.r; if (this.r >= this.top + h) this.top = this.r - h + 1;
      if (this.c < this.left) this.left = this.c; if (this.c >= this.left + w) this.left = this.c - w + 1;
      const R = this.selRange();
      for (let i = 0; i < h; i++) {
        const r = this.top + i, l = this.lines[r];
        s.fill(x, y + i, w, 1, ' ', attr);
        if (l == null) continue;
        const seg = l.slice(this.left, this.left + w);
        const cols = colorize ? colorize(l, r) : null;
        for (let k = 0; k < seg.length; k++) s.set(x + k, y + i, seg[k], cols && cols[this.left + k] != null ? cols[this.left + k] : attr);
        if (R && r >= R[0].r && r <= R[1].r) { const a = r === R[0].r ? R[0].c : 0, b = r === R[1].r ? R[1].c : Math.max(l.length, this.left + w); for (let cc = Math.max(a, this.left); cc < Math.min(b, this.left + w); cc++) { const e = s.get(x + cc - this.left, y + i); s.set(x + cc - this.left, y + i, e.c, selA); } }
      }
      s.cur.x = x + this.c - this.left; s.cur.y = y + this.r - this.top; s.cur.block = !this.ins;
    }
    // a normal key. returns true if handled
    key(e, o) {
      o = o || {};
      const k = e.key, sh = e.shift;
      if (k === 'ArrowUp') { if (e.ctrl) { this.top = Math.max(0, this.top - 1); if (this.r > this.top + (o.h || 20) - 1) this.r--; return true; } this.move(-1, 0, sh); return true; }
      if (k === 'ArrowDown') { if (e.ctrl) { this.top++; if (this.r < this.top) this.r = this.top; this.r = Math.min(this.r, this.lines.length - 1); return true; } this.move(1, 0, sh); return true; }
      if (k === 'ArrowLeft') { if (e.ctrl) this.wordMove(-1, sh); else this.move(0, -1, sh); return true; }
      if (k === 'ArrowRight') { if (e.ctrl) this.wordMove(1, sh); else this.move(0, 1, sh); return true; }
      if (k === 'Home') { if (sh && !this.sel) this.sel = { r: this.r, c: this.c }; else if (!sh) this.sel = null; if (e.ctrl) this.r = 0; const ind = this.lines[this.r].match(/^ */)[0].length; this.c = e.ctrl ? 0 : (this.c === ind ? 0 : ind); return true; }
      if (k === 'End') { if (sh && !this.sel) this.sel = { r: this.r, c: this.c }; else if (!sh) this.sel = null; if (e.ctrl) this.r = this.lines.length - 1; this.c = this.lines[this.r].length; return true; }
      if (k === 'PageUp') { this.move(-((o.h || 20) - 1), 0, sh); this.top = Math.max(0, this.top - (o.h || 20) + 1); return true; }
      if (k === 'PageDown') { this.move((o.h || 20) - 1, 0, sh); this.top = Math.min(Math.max(0, this.lines.length - 1), this.top + (o.h || 20) - 1); return true; }
      if (k === 'Insert' && sh) { this.snapUndo(); this.insert(this.clip); return true; }
      if (k === 'Insert' && e.ctrl) { this.clip = this.selText() || this.clip; return true; }
      if (k === 'Insert') { this.ins = !this.ins; return true; }
      if (k === 'Delete' && sh) { const t = this.selText(); if (t) { this.snapUndo(); this.clip = t; this.delSel(); } return true; }
      if (e.ctrl && !e.alt) {
        const c = k.toLowerCase();
        if (c === 'c') { this.clip = this.selText() || this.clip; return true; }
        if (c === 'x') { const t = this.selText(); if (t) { this.snapUndo(); this.clip = t; this.delSel(); } return true; }
        if (c === 'v') { this.snapUndo(); this.insert(this.clip); return true; }
        if (c === 'y') { this.snapUndo(); this.sel = null; if (this.lines.length > 1) { this.clip = this.lines[this.r]; this.lines.splice(this.r, 1); this.r = Math.min(this.r, this.lines.length - 1); } else this.lines[0] = ''; this.c = 0; this.dirty = true; return true; }
        if (c === 'z') { const u = this.undo.pop(); if (u) { this.lines = u.t.split('\n'); this.r = Math.min(u.r, this.lines.length - 1); this.c = u.c; this.sel = null; this.dirty = true; } return true; }
        if (c === 'a') { this.sel = { r: 0, c: 0 }; this.r = this.lines.length - 1; this.c = this.lines[this.r].length; return true; }
        return false;
      }
      if (k === 'Enter') { this.snapUndo(); this.newline(true); return true; }
      if (k === 'Backspace') { if (this.c > 0 || this.r > 0 || this.sel) this.snapUndo(); this.backspace(); return true; }
      if (k === 'Delete') { this.snapUndo(); this.del(); return true; }
      if (k === 'Tab' && !e.ctrl) { this.snapUndo(); if (sh) { const l = this.lines[this.r]; const n = Math.min(8, l.match(/^ */)[0].length); this.lines[this.r] = l.slice(n); this.c = Math.max(0, this.c - n); } else this.insert(' '.repeat(8 - this.c % 8)); return true; }
      if (e.ch && !e.alt) { if (this.undo.length === 0 || this._lastType !== this.r) { this.snapUndo(); this._lastType = this.r; } this.insert(e.ch); return true; }
      return false;
    }
  }

  // a vertical scrollbar column (classic look) and a horizontal one
  function vbar(s, x, y, h, pos, max, a) { a = a == null ? 0x70 : a; s.set(x, y, '↑', a); s.set(x, y + h - 1, '↓', a); for (let i = 1; i < h - 1; i++) s.set(x, y + i, '░', a); if (h > 2) s.set(x, y + 1 + Math.round((h - 3) * Math.min(1, pos / Math.max(1, max))), '■', a); }
  function hbar(s, x, y, w, pos, max, a) { a = a == null ? 0x70 : a; s.set(x, y, '←', a); s.set(x + w - 1, y, '→', a); for (let i = 1; i < w - 1; i++) s.set(x + i, y, '░', a); if (w > 2) s.set(x + 1 + Math.round((w - 3) * Math.min(1, pos / Math.max(1, max))), y, '■', a); }

  // run a full-screen program: snapshot the text screen, run, restore
  async function screenProg(sh, fn) {
    const host = sh.host, s = host.screen, t = host.term;
    const snap = s.snap(), attr = t.attr, cur = Object.assign({}, s.cur), mouse = host.wantMouse;
    host.flush(); host.setMouse(true);
    try { return await fn(host, s, t); }
    finally { if (!host.dead) { host.setMouse(mouse); s.restore(snap); Object.assign(s.cur, cur); s.cur.on = true; s.cur.block = false; t.attr = attr; t.x = cur.x; t.y = cur.y; host.flush(); } }
  }
  DOS.screenProg = screenProg;
  DOS.core = { CP437, chr, asc, PAL, PALRGB, CW, CH, Screen, Term, Host, KILL, readLine, menuBar, msgBox, form, wrap, Editor, UI, drawHot, hot, plain, vbar, hbar, bits8, touchDev };
})();
