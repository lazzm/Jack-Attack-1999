/* social-more: the bigger JackNet Hangout programs (whiteboard, fridge, corkboard, radio), loaded the first time one opens. */
window.SocialMore = function (X) {
  'use strict';
  const { WB_HELP, $, h, esc, store, rnd, pick, pad, play, note, got, hash, seeded, hhmm, d99, ago, clean, isObj, int, okCol, gate, room, who, onlineFns, ico, I, txt } = X;
  // ================================================================ 3. JACKNET WHITEBOARD (128x96, stored as 8x8 tiles in Net.kv)
  const WB = (() => {
    const W = 128, H = 96, T = 8, TW = W / T, TH = H / T, NT = TW * TH, B32 = '0123456789abcdefghijklmnopqrstuv', ZERO = '0'.repeat(T * T), KEY = 'social.wb';
    const PAL = ['#ffffff', '#000000', '#808080', '#c0c0c0', '#800000', '#ff0000', '#808000', '#ffff00', '#008000', '#00ff00', '#008080', '#00ffff', '#000080', '#0000ff', '#800080', '#ff00ff',
      '#808040', '#ffff80', '#004040', '#00ff80', '#004080', '#0080ff', '#8000ff', '#ff0080', '#804000', '#ff8040', '#f2c79a', '#3fa52c', '#1f5e14', '#ff8ac0', '#7a4a1a', '#ffd400'];
    const RGB = PAL.map(c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
    const GL = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
      0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
      '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ',': '000000000010100', '-': '000000111000000', "'": '010010000000000', ':': '000010000010000', '+': '000010111010000', '=': '000111000111000', '/': '001001010100100', '(': '010100100100010', ')': '010001001001010', '*': '101010101000000', '@': '101111111010000', ' ': '000000000000000' };
    const okText = s => clean(s, 16).toUpperCase().split('').filter(c => GL[c]).join('');
    const px = new Uint8Array(W * H), pend = new Map(), sent = new Map(), dirty = new Set();
    let seq = 0, loaded = false, unwatch = null, ui = null, dirtyDraw = true;
    const rm = room('social.wb', (d, o, msg) => remote(d, o, msg));
    const tileOf = i => Math.floor((i / W | 0) / T) * TW + Math.floor((i % W) / T);
    function encode(ti) { const tx = ti % TW, ty = ti / TW | 0; let s = ''; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) s += B32[px[(ty * T + y) * W + tx * T + x]]; return s; }
    function decode(ti, v) { if (v === '') v = ZERO; if (typeof v !== 'string' || !/^[0-9a-v]{64}$/.test(v)) return; const tx = ti % TW, ty = ti / TW | 0; for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px[(ty * T + y) * W + tx * T + x] = B32.indexOf(v[y * T + x]); }
    function set(x, y, c, local) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x; if (px[i] === c) return;
      px[i] = c; dirtyDraw = true;
      if (local) { const ti = tileOf(i); let p = pend.get(ti); if (!p) pend.set(ti, p = new Map()); p.set(i, [c, ++seq]); dirty.add(ti); }
    }
    const plot = (x, y, c, s, L) => { const o = s >> 1; for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) set(x - o + a, y - o + b, c, L); };
    function line(x0, y0, x1, y1, c, s, L) { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0; for (;;) { plot(x0, y0, c, s, L); if ((x0 === x1 && y0 === y1) || ++n > 400) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
    function rect(x0, y0, x1, y1, c, s, fill, L) { const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [p, q] = [Math.min(y0, y1), Math.max(y0, y1)]; if (fill) { for (let y = p; y <= q; y++) for (let x = a; x <= b; x++) set(x, y, c, L); } else { line(a, p, b, p, c, s, L); line(b, p, b, q, c, s, L); line(b, q, a, q, c, s, L); line(a, q, a, p, c, s, L); } }
    function flood(x, y, c, L) { if (x < 0 || y < 0 || x >= W || y >= H) return; const from = px[y * W + x]; if (from === c) return; const st = [[x, y]]; let n = 0; while (st.length && n < W * H) { const [a, b] = st.pop(); if (a < 0 || b < 0 || a >= W || b >= H || px[b * W + a] !== from) continue; set(a, b, c, L); n++; st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } }
    function stamp(x, y, str, c, s, L) { let cx = x; for (const ch of str) { const g = GL[ch]; if (g) for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (g[r * 3 + k] === '1') for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) set(cx + k * s + a, y + r * s + b, c, L); cx += 4 * s; } }
    function apply(op, L) {
      const a = op.a, c = op.c, s = op.s || 1;
      if (op.t === 'p') { for (let i = 0; i + 3 < a.length; i += 2) line(a[i], a[i + 1], a[i + 2], a[i + 3], c, s, L); if (a.length === 2) plot(a[0], a[1], c, s, L); }
      else if (op.t === 'l') line(a[0], a[1], a[2], a[3], c, s, L);
      else if (op.t === 'r') rect(a[0], a[1], a[2], a[3], c, s, !!op.f, L);
      else if (op.t === 'f') flood(a[0], a[1], c, L);
      else if (op.t === 'x') stamp(a[0], a[1], op.m, c, s, L);
    }
    function validOp(op) {
      if (!isObj(op) || typeof op.t !== 'string' || !'plrfx'.includes(op.t) || op.t.length !== 1 || !int(op.c, 0, 31) || !(op.s === undefined || int(op.s, 1, 3)) || !Array.isArray(op.a)) return null;
      const n = { p: -1, l: 4, r: 4, f: 2, x: 2 }[op.t];
      if (n > 0 ? op.a.length !== n : (op.a.length < 2 || op.a.length > 120 || op.a.length % 2)) return null;
      if (!op.a.every((v, i) => int(v, -8, (i % 2 ? H : W) + 8))) return null;
      const out = { t: op.t, c: op.c, s: op.s || 1, a: op.a.slice(), f: op.f ? 1 : 0 };
      if (op.t === 'x') { out.m = okText(op.m); if (!out.m) return null; }
      return out;
    }
    function remote(d, o, msg) {
      if (!ui) return;
      if (d.k === 'bye') { const c = ui.curs.get(o.id); if (c) { c.el.remove(); ui.curs.delete(o.id); } status(); return; }
      if (d.k !== 'u') return;
      if (Array.isArray(d.o)) d.o.slice(0, 12).forEach(op => { const v = validOp(op); if (v) apply(v, false); });
      if (int(d.x, 0, W - 1) && int(d.y, 0, H - 1)) {
        let c = ui.curs.get(o.id);
        if (!c) { c = { el: h('div', 'so-wbcur', '<svg viewBox="0 0 14 20"><path d="M1 1v15l4-4 3 7 2-1-3-7h6z" stroke="#000"/></svg><span></span>') }; ui.wrap.appendChild(c.el); ui.curs.set(o.id, c); status(); }
        const col = okCol(msg.col);
        c.el.querySelector('path').setAttribute('fill', col); const sp = c.el.querySelector('span'); sp.textContent = o.nick; sp.style.background = col;
        c.el.style.left = (d.x + 0.5) / W * 100 + '%'; c.el.style.top = (d.y + 0.5) / H * 100 + '%'; c.t = Date.now(); c.el.style.display = '';
        if (ui.drawing) got('wbdraw');
      }
    }
    function onPut(ev) {
      if (ev.type !== 'put') return;
      const m = /^t(\d{1,3})$/.exec(ev.f); if (!m || +m[1] >= NT) return;
      const ti = +m[1]; decode(ti, ev.v);
      const sn = sent.get(ti), p = pend.get(ti);
      if (p && sn && (ev.v || ZERO) === sn.v) for (const [i, [, q]] of [...p]) if (q <= sn.seq) p.delete(i);
      if (p && p.size) { for (const [i, [c]] of p) px[i] = c; dirty.add(ti); } else pend.delete(ti);
      dirtyDraw = true;
    }
    let flushT = 0;
    function flush() {
      if (!dirty.size) { if (!ui) { clearInterval(flushT); flushT = 0; } return; }
      const ti = dirty.values().next().value; dirty.delete(ti);
      const v = encode(ti); sent.set(ti, { v, seq });
      if (!Net.kv.put(KEY, 't' + ti, v === ZERO ? '' : v)) dirty.add(ti);
    }
    function open() {
      if (ui && !ui.w.closed) { ui.w.restore(); return ui.w; }
      const b = h('div', 'so-wb');
      const TOOLS = [['pencil', 'Pencil', '<path d="M3 13l1-3 7-7 2 2-7 7z" fill="#ffd400" stroke="#000"/><path d="M3 13l1-3 2 2z" fill="#000"/>'], ['brush', 'Brush', '<path d="M9 2l5 5-4 2-3-3z" fill="#7a4a1a" stroke="#000"/><path d="M7 7l2 2-3 4q-3 1-4 0 0-2 2-4z" fill="#e10600" stroke="#000"/>'], ['eraser', 'Eraser', '<path d="M2 11l6-7 6 5-5 5H5z" fill="#ff8ac0" stroke="#000"/><path d="M5 14l-3-3 3-3 4 4" fill="#fff" stroke="#000"/>'], ['line', 'Line', '<path d="M2 14L14 2" stroke="#000" stroke-width="1.5"/>'],
        ['rect', 'Rectangle', '<rect x="2.5" y="4.5" width="11" height="8" fill="none" stroke="#000"/>'], ['frect', 'Filled Rectangle', '<rect x="2.5" y="4.5" width="11" height="8" fill="#2a7ad8" stroke="#000"/>'], ['fill', 'Fill With Colour', '<path d="M3 8l5-5 5 5-5 5z" fill="#fff" stroke="#000"/><path d="M13 8q2 3 0 5-2-2 0-5z" fill="#2a7ad8"/><path d="M3 8h10l-5 5z" fill="#2a7ad8" stroke="#000"/>'], ['text', 'Text Stamp', '<path d="M3 3h10v3h-1l-1-1.5H9V12l1.5 1v1h-5v-1L7 12V4.5H5L4 6H3z" fill="#000"/>']];
      b.innerHTML = `<div class="so-wbtools" role="toolbar" aria-label="Tools">${TOOLS.map(([k, n, s]) => `<button type="button" class="so-wbt${k === 'pencil' ? ' on' : ''}" data-t="${k}" title="${n}" aria-label="${n}"><svg viewBox="0 0 16 16">${s}</svg></button>`).join('')}
        <div class="so-wbsizes">${[1, 2, 3].map(s => `<button type="button" data-s="${s}" class="${s === 1 ? 'on' : ''}" title="Size ${s}" aria-label="Size ${s}"><i style="width:${s * 3}px;height:${s * 3}px"></i></button>`).join('')}</div></div>
        <div class="so-wbmain"><div class="so-wbtext" hidden><label>Text: <input type="text" maxlength="16" value="HELLO" aria-label="Text to stamp"></label> <small>Click the board to stamp it.</small></div>
        <div class="so-wbwrap"><canvas width="${W}" height="${H}" class="so-wbc"></canvas><canvas width="${W}" height="${H}" class="so-wbov"></canvas></div>
        <div class="so-wbpal"><span class="so-wbcur2"><i class="fg"></i><i class="bg"></i></span><span class="so-wbsw">${PAL.map((c, i) => `<button type="button" data-c="${i}" style="background:${c}" title="${c}" aria-label="Colour ${i + 1}"></button>`).join('')}</span></div></div>`;
      const w = Apps.win('JackNet Whiteboard', b, { w: 660, icon: I.board, status: true, menubar: true, minW: 300, minH: 260, onClose: close });
      const cv = b.querySelector('.so-wbc'), ov = b.querySelector('.so-wbov'), g = cv.getContext('2d'), og = ov.getContext('2d');
      const img = g.createImageData(W, H);
      ui = { w, wrap: b.querySelector('.so-wbwrap'), curs: new Map(), tool: 'pencil', size: 1, col: 1, drawing: false, ops: [], cur: null, curSent: null, poly: null };
      Apps.menubar(w, [
        ['File', [{ label: 'Save Picture to My Documents', act: savePic }, '-', { label: 'Close', act: () => w.close() }]],
        ['Edit', [{ label: 'Clear Whiteboard...', act: () => Desk.msgbox('Clear Whiteboard', "Only the teacher can clear the whiteboard. And there isn't a teacher. Draw over it like everybody else!", 'info') }]],
        ['Help', [{ label: 'How to Use', act: () => txt('WHITEBOARD HELP.TXT', WB_HELP) }, { label: 'About JackNet Whiteboard', act: () => Desk.msgbox('About', 'JackNet Whiteboard 1.0\nA shared drawing board for everybody on JackNet.\n\n128 x 96 pixels of pure art. 32 colours. No undo. Just like real life.', 'info') }]],
      ]);
      const draw = () => {
        if (!ui || ui.w.closed) return;
        if (dirtyDraw) { dirtyDraw = false; const d = img.data; for (let i = 0; i < W * H; i++) { const c = RGB[px[i]] || RGB[0]; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }
        const now = Date.now(); ui.curs.forEach(c => { if (now - c.t > 6000) c.el.style.display = 'none'; });
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
      const pal = () => { b.querySelector('.so-wbcur2 .fg').style.background = PAL[ui.col]; b.querySelectorAll('.so-wbsw button').forEach(x => x.classList.toggle('on', +x.dataset.c === ui.col)); };
      pal();
      b.querySelector('.so-wbsw').addEventListener('click', ev => { const t = ev.target.closest('[data-c]'); if (t) { ui.col = +t.dataset.c; pal(); } });
      b.querySelector('.so-wbtools').addEventListener('click', ev => {
        const t = ev.target.closest('[data-t]'), s = ev.target.closest('[data-s]');
        if (t) { ui.tool = t.dataset.t; b.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === t)); b.querySelector('.so-wbtext').hidden = ui.tool !== 'text'; }
        if (s) { ui.size = +s.dataset.s; b.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === s)); }
      });
      const pos = ev => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(W - 1, Math.floor((ev.clientX - r.left) / r.width * W))), Math.max(0, Math.min(H - 1, Math.floor((ev.clientY - r.top) / r.height * H)))]; };
      let start = null, last = null;
      const col = () => ui.tool === 'eraser' ? 0 : ui.col, sz = () => ui.tool === 'pencil' ? 1 : ui.tool === 'eraser' ? ui.size + 1 : ui.size;
      const doOp = op => { apply(op, true); ui.ops.push(op); };
      ui.wrap.addEventListener('pointerdown', ev => {
        if (ev.button > 0) return; ev.preventDefault();
        ui.wrap.setPointerCapture(ev.pointerId); const p = pos(ev); start = last = p; ui.drawing = true; ui.cur = p;
        if (ui.tool === 'pencil' || ui.tool === 'brush' || ui.tool === 'eraser') { ui.poly = { t: 'p', c: col(), s: sz(), a: [p[0], p[1]] }; apply({ t: 'p', c: col(), s: sz(), a: [p[0], p[1]] }, true); }
        else if (ui.tool === 'fill') { doOp({ t: 'f', c: col(), a: p }); start = null; }
        else if (ui.tool === 'text') { const m = okText(b.querySelector('.so-wbtext input').value); if (m) { doOp({ t: 'x', c: col(), s: ui.size, a: p, m }); if (/WAA+GH/.test(m)) got('wbtext'); } start = null; }
      });
      ui.wrap.addEventListener('pointermove', ev => {
        const p = pos(ev); ui.cur = p;
        w.status.textContent = `${p[0]}, ${p[1]}`;
        if (!start || !ui.drawing) return;
        if (ui.poly) { if (p[0] !== last[0] || p[1] !== last[1]) { apply({ t: 'p', c: ui.poly.c, s: ui.poly.s, a: [last[0], last[1], p[0], p[1]] }, true); ui.poly.a.push(p[0], p[1]); last = p; } }
        else { og.clearRect(0, 0, W, H); og.fillStyle = PAL[col()]; const tmp = { t: ui.tool === 'line' ? 'l' : 'r', a: [...start, ...p] }; preview(og, tmp, sz(), ui.tool === 'frect'); }
      });
      const end = ev => {
        if (!ui.drawing) return; ui.drawing = false;
        if (ui.poly) { ui.ops.push(ui.poly); ui.poly = null; }
        else if (start && ev) { const p = pos(ev); og.clearRect(0, 0, W, H); doOp(ui.tool === 'line' ? { t: 'l', c: col(), s: sz(), a: [...start, ...p] } : { t: 'r', c: col(), s: sz(), f: ui.tool === 'frect' ? 1 : 0, a: [...start, ...p] }); }
        start = null;
      };
      ui.wrap.addEventListener('pointerup', end); ui.wrap.addEventListener('pointercancel', () => end(null));
      ui.wrap.addEventListener('pointerleave', () => { if (!ui.drawing) ui.cur = null; });
      // live updates for everyone else with the board open
      ui.tick = setInterval(() => {
        if (ui.poly && ui.poly.a.length > 2) { ui.ops.push(ui.poly); const l = ui.poly.a.slice(-2); ui.poly = { t: 'p', c: ui.poly.c, s: ui.poly.s, a: l }; }
        const cur = ui.cur ? ui.cur.join(',') : '';
        if (!rm.count) { ui.ops.length = 0; ui.curSent = cur; return; }
        if (!ui.ops.length && cur === ui.curSent) return;
        const out = []; let len = 30;
        while (ui.ops.length && out.length < 12) { const s = JSON.stringify(ui.ops[0]).length; if (len + s > 1350) { if (!out.length) ui.ops.shift(); break; } len += s; out.push(ui.ops.shift()); }
        const d = { k: 'u', o: out }; if (ui.cur) { d.x = ui.cur[0]; d.y = ui.cur[1]; }
        rm.send(d); ui.curSent = cur;
      }, 140);
      status(); rm.enter();
      if (!unwatch) unwatch = Net.kv.watch(KEY, onPut);
      clearInterval(flushT); flushT = setInterval(flush, 95);
      w.status.textContent = 'Loading the whiteboard...';
      Net.kv.get([KEY]).then(v => {
        const m = v[KEY]; if (isObj(m)) for (const [f, val] of Object.entries(m)) { const mm = /^t(\d{1,3})$/.exec(f); if (mm && +mm[1] < NT) decode(+mm[1], val); }
        for (const [ti, p] of pend) { for (const [i, [c]] of p) px[i] = c; dirty.add(ti); }
        loaded = true; dirtyDraw = true; w.status.textContent = 'Ready. Everyone on JackNet shares this board!';
      });
      return w;
    }
    function preview(og, op, s, fill) {
      const a = op.a, put = (x, y) => og.fillRect(x - (s >> 1), y - (s >> 1), s, s);
      const ln = (x0, y0, x1, y1) => { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0; for (;;) { put(x0, y0); if ((x0 === x1 && y0 === y1) || ++n > 400) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
      if (op.t === 'l') ln(a[0], a[1], a[2], a[3]);
      else if (fill) og.fillRect(Math.min(a[0], a[2]), Math.min(a[1], a[3]), Math.abs(a[2] - a[0]) + 1, Math.abs(a[3] - a[1]) + 1);
      else { ln(a[0], a[1], a[2], a[1]); ln(a[2], a[1], a[2], a[3]); ln(a[2], a[3], a[0], a[3]); ln(a[0], a[3], a[0], a[1]); }
    }
    function status() { if (!ui || ui.w.closed) return; const nm = rm.names(); ui.w.setTitle(nm.length ? `JackNet Whiteboard - you + ${nm.slice(0, 3).join(', ')}${nm.length > 3 ? ' + ' + (nm.length - 3) + ' more' : ''} drawing` : 'JackNet Whiteboard'); }
    rm.onWho(() => status());
    // back after a dropped connection: fetch the board again (strokes made meanwhile never reached us)
    Net.on('welcome', () => setTimeout(() => { if (!ui || ui.w.closed || !loaded) return; Net.kv.get([KEY]).then(v => { const m = v[KEY]; if (!isObj(m)) return; for (const [f, val] of Object.entries(m)) { const mm = /^t(\d{1,3})$/.exec(f); if (mm && +mm[1] < NT) decode(+mm[1], val); } for (const [ti, p] of pend) { for (const [i, [c]] of p) px[i] = c; dirty.add(ti); } dirtyDraw = true; }); }, 900));
    function close() {
      rm.leave(); clearInterval(ui.tick);
      ui = null;
    }
    function savePic() {
      let s = ''; for (let y = 0; y < H; y += 2) { for (let x = 0; x < W; x += 2) s += px[y * W + x] ? (px[y * W + x] === 1 ? '#' : '+') : ' '; s += '\n'; }
      Apps.fs.add('C:/My Documents', { name: 'whiteboard.txt', type: 'txt', date: d99(), size: '7 KB', text: 'JACKNET WHITEBOARD (saved ' + d99() + ' ' + hhmm() + ')\n(Jotpad can only do text, so here it is in ASCII. Squint.)\n\n' + s });
      Desk.toast('Whiteboard', 'Saved as C:\\My Documents\\whiteboard.txt (in glorious ASCII).', 4000);
    }
    return { open };
  })();
  // ================================================================ 4. FRIDGE MAGNET POETRY (positions shared in Net.kv, live drags over relay)
  const FRIDGE = (() => {
    const WORDS = ('the a an and or but of to in on at with from is are was be not no yes my your his her its our their me you we they it this that ' +
      'big small red green fast slow old new hot cold loud quiet shiny rusty secret tiny massive ' +
      'pocket critters ultra 64 blockology space cadet gork gorks boss rupees bits box paint brush green goes faster waaagh ' +
      'mom dave nan cousin dog cat hamster teacher school homework bedtime tea biscuit crisps chips pie sandwich ' +
      'computer modem floppy disk cd-rom monitor mouse keyboard printer cyan internet download upload password ' +
      'game games level boss cheat code lives score high win lose pause save load crash reboot ' +
      'blockology cube puzzle block line spin twist solve ' +
      'space rocket alien robot laser planet star moon future year 2000 bug millennium ' +
      'space cadet force droid peapod race lightsabre saber hype queue cinema trailer episode sequel prequel phantom menace galaxy ' +
      'love hate like want need eat sleep dream play fight run jump hide seek look see feel think know ' +
      'never always sometimes again forever tomorrow today tonight now soon later ' +
      'very really quite totally mega ultra super turbo ' +
      'happy sad angry bored hungry sleepy silly brilliant rubbish ace naff cool ' +
      'up down over under behind inside outside away home back here there ' +
      'why what who how when where because so if then maybe ' +
      'ing s ed ly ! ? ...').split(' ');
    const N = WORDS.length, KEY = 'social.fridge', BW = 860, BH = 760;
    const HOME = (() => { // the jumble at the bottom of the door; the top is left clear for poems
      const r0 = seeded('fridge'), order = WORDS.map((w, i) => i).sort(() => r0() - 0.5), out = [];
      let x = 12, y = 236;
      for (const i of order) { const w = 14 + WORDS[i].length * 7.4; if (x + w > BW - 44) { x = 12 + r0() * 14; y += 28; } out[i] = [Math.round(x), Math.round(y + r0() * 5), Math.round(r0() * 8 - 4)]; x += w + 6 + r0() * 9; }
      return out;
    })();
    let ui = null, unwatch = null;
    const posIn = gate(60, 5000), putOut = gate(12, 1000);
    const rm = room('social.fridge', (d, o, msg) => {
      if (!ui || d.k !== 'mv' || !int(d.i, 0, N - 1) || !int(d.x, -20, BW) || !int(d.y, -20, BH) || !posIn(o.id)) return;
      const m = ui.mags[d.i]; if (ui.drag && ui.drag.i === d.i) return;
      m.classList.add('held'); m.style.left = d.x + 'px'; m.style.top = d.y + 'px'; m.style.zIndex = 50; m.dataset.by = o.nick; m.title = 'being moved by ' + o.nick;
      clearTimeout(m._t); m._t = setTimeout(() => { m.classList.remove('held'); m.title = ''; }, 1500);
      if (ui.drag == null) got('fridgelive');
    });
    const parse = v => { if (typeof v !== 'string') return null; const m = /^(-?\d{1,4}),(-?\d{1,4}),(-?\d{1,2})$/.exec(v); if (!m) return null; const x = +m[1], y = +m[2], r = +m[3]; return x >= -20 && x <= BW && y >= -20 && y <= BH ? [x, y, r] : null; };
    function place(i, x, y, r) { const m = ui.mags[i]; m.style.left = x + 'px'; m.style.top = y + 'px'; m.style.transform = `rotate(${r}deg)`; }
    function open() {
      if (ui && !ui.w.closed) { ui.w.restore(); return ui.w; }
      const b = h('div', 'so-fridge');
      b.innerHTML = `<div class="so-fdoor"><div class="so-fboard" style="width:${BW}px;height:${BH}px"><div class="so-fhandle"></div><div class="so-fnote">Mom says: NO SWEARING ON THE FRIDGE</div><div class="so-fpoem">(write your poem up here)</div></div></div>`;
      const w = Apps.win('Fridge Magnet Poetry', b, { w: 690, h: 520, icon: I.fridge, status: true, menubar: true, minW: 300, minH: 240, onClose: () => { rm.leave(); ui = null; } });
      const board = b.querySelector('.so-fboard');
      ui = { w, board, mags: [], drag: null, moved: store.get('jhp_social_fmoved', 0) };
      Apps.menubar(w, [
        ['Fridge', [{ label: 'Read the Fridge Aloud', act: readAloud }, { label: 'Save Poem to My Documents', act: savePoem }, '-', { label: 'Close', act: () => w.close() }]],
        ['Help', [{ label: 'About Fridge Magnets', act: () => Desk.msgbox('Fridge Magnet Poetry', `${N} word magnets on one fridge door, shared by everybody on JackNet.\n\nDrag words about to make poems. Other people see them move. They will move yours too. That's fridges for you.\n\nThe fridge has been on the blink since Mom's sister leant on it in 1997.`, 'info') }]],
      ]);
      WORDS.forEach((wd, i) => {
        const m = h('div', 'so-mag' + (/^(ing|s|ed|ly)$/.test(wd) ? ' suf' : /^[!?.]+$/.test(wd) ? ' pun' : '')); m.textContent = wd; m.dataset.i = i; m.setAttribute('role', 'button'); m.tabIndex = 0;
        ui.mags.push(m); board.appendChild(m); place(i, HOME[i][0], HOME[i][1], HOME[i][2]);
      });
      let z = 10;
      board.addEventListener('pointerdown', ev => {
        const m = ev.target.closest('.so-mag'); if (!m || ev.button > 0) return;
        ev.preventDefault(); board.setPointerCapture(ev.pointerId);
        const r = m.getBoundingClientRect();
        ui.drag = { i: +m.dataset.i, m, dx: ev.clientX - r.left, dy: ev.clientY - r.top, last: 0, moved: false };
        m.style.zIndex = ++z; m.classList.add('lift');
      });
      const bp = (ev, d) => { const r = board.getBoundingClientRect(); return [Math.round(Math.max(-10, Math.min(BW - 30, ev.clientX - r.left - d.dx))), Math.round(Math.max(-10, Math.min(BH - 16, ev.clientY - r.top - d.dy)))]; };
      board.addEventListener('pointermove', ev => {
        if (!ui.drag) return;
        const [x, y] = bp(ev, ui.drag); ui.drag.m.style.left = x + 'px'; ui.drag.m.style.top = y + 'px'; ui.drag.moved = true;
        const now = Date.now(); if (now - ui.drag.last > 80) { ui.drag.last = now; rm.send({ k: 'mv', i: ui.drag.i, x, y }); }
      });
      const drop = ev => {
        const d = ui.drag; if (!d) return; ui.drag = null; d.m.classList.remove('lift');
        if (!d.moved) return;
        const [x, y] = bp(ev, d); const r = Math.round(rnd(-6, 6)); place(d.i, x, y, r);
        play('click');
        if (!putOut('me')) { w.status.textContent = 'Slow down! Magnets are sliding off the door.'; return; }
        Net.kv.put(KEY, 'm' + d.i, `${x},${y},${r}`); rm.send({ k: 'mv', i: d.i, x, y });
        ui.moved++; store.set('jhp_social_fmoved', ui.moved); if (ui.moved >= 30) got('fridgepoet');
        w.status.textContent = `You moved "${WORDS[d.i]}".`;
      };
      board.addEventListener('pointerup', drop); board.addEventListener('pointercancel', () => { if (ui.drag) { ui.drag.m.classList.remove('lift'); ui.drag = null; } });
      board.addEventListener('keydown', ev => { const m = ev.target.closest('.so-mag'); if (!m) return; const d = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[ev.key]; if (!d) return; ev.preventDefault(); const i = +m.dataset.i, x = Math.max(-10, Math.min(BW - 30, m.offsetLeft + d[0])), y = Math.max(-10, Math.min(BH - 16, m.offsetTop + d[1])); place(i, x, y, 0); if (putOut('me')) Net.kv.put(KEY, 'm' + i, `${x},${y},0`); });
      rm.enter();
      const whoHere = () => { if (!ui || ui.w.closed) return; const nm = rm.names(); w.setTitle(nm.length ? `Fridge Magnet Poetry - ${nm.slice(0, 3).join(', ')}${nm.length > 3 ? ' + ' + (nm.length - 3) : ''} here too` : 'Fridge Magnet Poetry'); };
      if (!rm._who) { rm._who = true; rm.onWho(() => { if (ui) ui.whoHere(); }); Net.on('welcome', () => setTimeout(() => { if (!ui || ui.w.closed) return; Net.kv.get([KEY]).then(v => { const m = v[KEY]; if (!ui || !isObj(m)) return; for (const [f, val] of Object.entries(m)) { const mm = /^m(\d{1,3})$/.exec(f); const p = parse(val); if (mm && +mm[1] < N && p && !(ui.drag && ui.drag.i === +mm[1])) place(+mm[1], p[0], p[1], p[2]); } }); }, 900)); }
      ui.whoHere = whoHere; whoHere();
      if (!unwatch) unwatch = Net.kv.watch(KEY, ev => { if (!ui || ev.type !== 'put') return; const mm = /^m(\d{1,3})$/.exec(ev.f); if (!mm || +mm[1] >= N) return; const i = +mm[1]; if (ui.drag && ui.drag.i === i) return; const p = parse(ev.v) || HOME[i]; place(i, p[0], p[1], p[2]); const m = ui.mags[i]; m.classList.remove('held'); if (ev.by && ev.by !== Net.me.nick) { m.classList.add('held'); clearTimeout(m._t); m._t = setTimeout(() => m.classList.remove('held'), 1200); } });
      w.status.textContent = 'Loading the fridge...';
      Net.kv.get([KEY]).then(v => {
        const m = v[KEY]; let n = 0;
        if (isObj(m)) for (const [f, val] of Object.entries(m)) { const mm = /^m(\d{1,3})$/.exec(f); const p = parse(val); if (mm && +mm[1] < N && p) { place(+mm[1], p[0], p[1], p[2]); n++; } }
        w.status.textContent = `${N} magnets on the door. ${n} have been moved by someone. Drag them!`;
      });
      return w;
    }
    function poem() { // read left to right, top to bottom in rows of ~26px
      if (!ui) return '';
      const rows = {}; ui.mags.forEach(m => { const y = Math.round(m.offsetTop / 26); (rows[y] = rows[y] || []).push(m); });
      return Object.keys(rows).map(Number).sort((a, b) => a - b).map(y => rows[y].sort((a, b) => a.offsetLeft - b.offsetLeft).map(m => m.textContent).join(' ')).join('\n');
    }
    function readAloud() { const p = poem(); got('fridgeread'); Desk.msgbox('The Fridge Says...', p.split('\n').slice(0, 6).join('\n') + '\n\n(That\'s the first six lines. Poetry is hard.)', 'info'); }
    function savePoem() { Apps.fs.add('C:/My Documents', { name: 'fridge poem.txt', type: 'txt', date: d99(), size: '2 KB', text: 'FRIDGE POEM (read left to right, top to bottom)\n' + d99() + ' ' + hhmm() + '\n\n' + poem() + '\n' }); Desk.toast('Fridge', 'Saved to C:\\My Documents\\fridge poem.txt', 3500); }
    return { open };
  })();

  // ================================================================ 5. THE CORKBOARD (Net.kv.push)
  const CORK = (() => {
    const KEY = 'social.cork', COLS = ['#ffef80', '#ff9ac8', '#9fd8ff', '#b8ffb0', '#ffd2a0', '#e8d0ff'], PINS = ['#e10600', '#2a7ad8', '#3a9a2a', '#ffd400', '#8000ff'];
    let ui = null, unwatch = null, notes = [];
    const okNote = e => isObj(e) && typeof e.text === 'string' && typeof e.by === 'string' ? { by: clean(e.by, 20) || 'Somebody', col: okCol(e.col), text: clean(e.text, 300), ts: int(e.ts, 0, 9e15) ? e.ts : Date.now(), member: !!e.member } : null;
    function open() {
      if (ui && !ui.w.closed) { ui.w.restore(); return ui.w; }
      const b = h('div', 'so-cork');
      b.innerHTML = `<div class="so-corkboard"><div class="so-corkempty">Loading the corkboard...</div></div>
        <form class="so-corkform"><div class="so-corknew" style="background:${COLS[0]}"><textarea maxlength="120" rows="3" placeholder="Pin a note! (120 letters max)" aria-label="Your note"></textarea></div>
        <div class="so-corkctl"><span class="so-corkcols">${COLS.map((c, i) => `<button type="button" data-c="${i}" style="background:${c}" class="${i ? '' : 'on'}" aria-label="Colour ${i + 1}"></button>`).join('')}</span><span class="so-left">120</span><button class="btn" type="submit"><b>Pin it</b></button></div></form>`;
      const w = Apps.win('The Corkboard', b, { w: 560, h: 480, icon: I.cork, status: true, minW: 300, minH: 300, onClose: () => { ui = null; } });
      ui = { w, board: b.querySelector('.so-corkboard'), col: 0 };
      const ta = b.querySelector('textarea'), f = b.querySelector('form');
      ta.addEventListener('input', () => { b.querySelector('.so-left').textContent = 120 - ta.value.length; });
      b.querySelector('.so-corkcols').addEventListener('click', ev => { const t = ev.target.closest('[data-c]'); if (!t) return; ui.col = +t.dataset.c; b.querySelectorAll('.so-corkcols button').forEach(x => x.classList.toggle('on', x === t)); b.querySelector('.so-corknew').style.background = COLS[ui.col]; });
      let lastPin = 0;
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        const t = clean(ta.value, 120); if (!t) return;
        if (Date.now() - lastPin < 5000) { w.status.textContent = 'One note every 5 seconds. The pins are only so sharp.'; return; }
        if (!Net.kv.push(KEY, 'c' + ui.col + ':' + t)) { w.status.textContent = 'Not connected to JackNet.'; return; }
        lastPin = Date.now(); ta.value = ''; b.querySelector('.so-left').textContent = '120'; play('click'); got('corkpin');
        w.status.textContent = 'Pinned! Everyone on JackNet can see it now.';
        if (/orks? (rule|are the best)|waaagh/i.test(t)) got('corkork');
      });
      if (!unwatch) unwatch = Net.kv.watch(KEY, ev => { if (ev.type !== 'push') return; const e = okNote(ev.e); if (!e) return; notes.push(e); if (notes.length > 40) notes.shift(); render(); if (ui && e.by !== Net.me.nick) { play('pet'); ui.w.status.textContent = `${e.by} pinned a new note.`; } });
      Net.kv.get([KEY]).then(v => { notes = (Array.isArray(v[KEY]) ? v[KEY] : []).map(okNote).filter(Boolean).slice(-40); render(); w.status.textContent = `${notes.length} note(s) on the board. The oldest fall off when there are 40.`; });
      return w;
    }
    function render() {
      if (!ui || ui.w.closed) return;
      const bd = ui.board; bd.innerHTML = notes.length ? '' : '<div class="so-corkempty">Nothing pinned yet. Be the first!</div>';
      notes.slice().reverse().forEach((e, i) => {
        const r = seeded(e.ts + e.by), m = /^c(\d):([\s\S]*)$/.exec(e.text), ci = m ? +m[1] % COLS.length : 0, text = m ? m[2] : e.text;
        const n = h('div', 'so-note'); n.style.background = COLS[ci]; n.style.transform = `rotate(${(r() * 8 - 4).toFixed(1)}deg)`;
        n.innerHTML = `<i class="so-pin" style="background:${PINS[Math.floor(r() * PINS.length)]}"></i><div class="so-notetext"></div><div class="so-noteby"><b style="color:${okCol(e.col)}"></b> <span></span></div>`;
        n.querySelector('.so-notetext').textContent = text; n.querySelector('b').textContent = (e.member ? '\u2605 ' : '') + e.by; n.querySelector('span').textContent = ago(e.ts);
        n.addEventListener('click', () => { n.classList.toggle('front'); });
        bd.appendChild(n);
      });
    }
    return { open };
  })();

  // ================================================================ 6. JACKNET RADIO 99.9 FM (track = f(Date.now()), so everyone hears the same thing)
  const RADIO = (() => {
    // Original chiptunes. lead/bass are MIDI notes per eighth-note step (0 rest, -1 hold).
    const TUNES = [
      ['social.r1', 'Dial-Up Dreams', 'The Floppy Disks', { step: 0.17, hats: true, lead: [64, -1, 67, 69, 71, -1, 69, 67, 64, -1, 62, -1, 64, -1, 0, 0, 69, -1, 71, 72, 74, -1, 72, 71, 69, -1, 67, -1, 64, -1, 0, 0, 64, 67, 71, 74, 76, -1, 74, 71, 72, -1, 71, 69, 67, -1, 0, 0, 62, 64, 67, 71, 69, -1, 67, 64, 62, -1, -1, -1, 64, -1, 0, 0], bass: [40, 40, 47, 47, 45, 45, 47, 47, 40, 40, 47, 47, 43, 43, 45, 45, 40, 40, 47, 47, 45, 45, 47, 47, 38, 38, 43, 43, 40, 40, 40, 40] }],
      ['social.r2', '56K of Love', 'The Floppy Disks', { step: 0.19, hats: true, lead: [72, 0, 72, 74, 76, 0, 74, 72, 69, -1, 67, -1, 69, -1, -1, 0, 72, 0, 72, 74, 76, 0, 79, 76, 74, -1, -1, -1, 0, 0, 0, 0, 77, 0, 77, 76, 74, 0, 76, 74, 72, -1, 69, -1, 72, -1, -1, 0, 74, 0, 74, 72, 71, 0, 72, 74, 72, -1, -1, -1, 0, 0, 0, 0], bass: [48, 48, 52, 52, 45, 45, 48, 48, 48, 48, 52, 52, 50, 50, 55, 55, 53, 53, 48, 48, 45, 45, 48, 48, 50, 50, 55, 55, 48, 48, 48, 48] }],
      ['social.r3', 'Red Ones Go Faster', 'The Go-Karts', { step: 0.13, hats: true, lead: [52, 52, 0, 52, 55, 0, 57, 0, 52, 52, 0, 52, 58, 57, 55, 0, 52, 52, 0, 52, 55, 0, 57, 0, 60, 0, 58, 0, 57, 55, 52, 0, 59, 59, 0, 59, 62, 0, 64, 0, 59, 59, 0, 59, 65, 64, 62, 0, 52, 52, 0, 52, 55, 0, 57, 0, 55, 0, 52, 0, 50, 0, 52, 0], bass: [40, 40, 40, 40, 40, 40, 43, 43, 40, 40, 40, 40, 46, 46, 45, 45, 40, 40, 40, 40, 40, 40, 43, 43, 48, 48, 46, 46, 45, 45, 40, 40] }],
      ['social.r4', 'Pot Noodlez (Remix)', 'DJ Pixel', { step: 0.15, hats: true, lead: [67, 0, 67, 0, 70, 72, 0, 70, 67, 0, 65, 0, 67, -1, 0, 0, 67, 0, 67, 0, 70, 72, 0, 74, 72, 0, 70, 0, 67, -1, 0, 0, 75, 0, 74, 0, 72, 70, 0, 72, 67, 0, 70, 0, 67, -1, 0, 0, 65, 0, 67, 0, 70, 72, 0, 70, 67, -1, -1, -1, 0, 0, 0, 0], bass: [43, 43, 43, 43, 46, 46, 41, 41, 43, 43, 43, 43, 46, 46, 48, 48, 51, 51, 48, 48, 46, 46, 43, 43, 41, 41, 46, 46, 43, 43, 43, 43] }],
      ['social.r5', 'Turn That Down (live)', 'Mom', { step: 0.21, hats: false, lead: [60, -1, 64, -1, 67, -1, 64, -1, 60, -1, 62, -1, 64, -1, -1, -1, 65, -1, 64, -1, 62, -1, 60, -1, 62, -1, -1, -1, 0, 0, 0, 0, 60, -1, 64, -1, 67, -1, 72, -1, 71, -1, 69, -1, 67, -1, -1, -1, 65, -1, 67, -1, 64, -1, 62, -1, 60, -1, -1, -1, 0, 0, 0, 0], bass: [36, 36, 43, 43, 36, 36, 43, 43, 41, 41, 43, 43, 38, 38, 43, 43, 36, 36, 43, 43, 48, 48, 45, 45, 41, 41, 43, 43, 36, 36, 36, 36] }],
      ['social.r6', 'Fatal Exception 0E', 'The Millennium Bugs', { step: 0.12, hats: true, lead: [69, 0, 69, 0, 72, 0, 74, 0, 76, 0, 74, 0, 72, 0, 69, 0, 67, 0, 67, 0, 71, 0, 74, 0, 76, -1, -1, -1, 0, 0, 0, 0, 69, 0, 69, 0, 72, 0, 74, 0, 77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 72, 0, 74, 0, 71, 0, 69, -1, -1, -1, 0, 0, 0, 0], bass: [45, 45, 45, 45, 41, 41, 41, 41, 43, 43, 43, 43, 40, 40, 40, 40, 45, 45, 45, 45, 41, 41, 41, 41, 43, 43, 47, 47, 45, 45, 45, 45] }],
      ['social.r7', 'Peapod Race Pulse', 'The Floppy Disks', { step: 0.11, hats: true, lead: [57, 57, 60, 57, 64, 57, 60, 57, 59, 59, 62, 59, 65, 59, 62, 59, 57, 57, 60, 57, 64, 57, 60, 57, 55, 55, 59, 55, 62, 55, 59, 55, 69, 0, 67, 0, 64, 0, 60, 0, 62, 0, 64, 0, 65, 0, 67, 0, 69, 0, 67, 0, 64, 0, 62, 0, 57, -1, -1, -1, 0, 0, 0, 0], bass: [45, 45, 45, 45, 47, 47, 47, 47, 45, 45, 45, 45, 43, 43, 43, 43, 45, 45, 41, 41, 43, 43, 45, 45, 47, 47, 43, 43, 45, 45, 45, 45] }],
      ['social.r8', 'Y2K Bunker Boogie', 'The Millennium Bugs', { step: 0.16, hats: true, lead: [62, 0, 65, 0, 69, 0, 65, 0, 62, 0, 65, 0, 70, -1, 69, 0, 62, 0, 65, 0, 69, 0, 72, 0, 74, -1, 72, 0, 69, -1, 0, 0, 67, 0, 70, 0, 74, 0, 70, 0, 67, 0, 70, 0, 75, -1, 74, 0, 62, 0, 65, 0, 69, 0, 72, 0, 70, -1, 69, -1, 62, -1, 0, 0], bass: [38, 38, 41, 41, 38, 38, 45, 45, 38, 38, 41, 41, 45, 45, 41, 41, 43, 43, 46, 46, 43, 43, 50, 50, 38, 38, 41, 41, 45, 45, 38, 38] }],
    ];
    TUNES.forEach(([id, , , t]) => Sound.addTune(id, t));
    const len = t => t.lead.length * t.step * 4; // each tune loops 4 times = one "track"
    const DJ = [
      "You're listening to JackNet Radio, 99.9 FM, broadcasting from a bedroom near you. Sort of.",
      'Coming up: more of the same. Because it is all we have got. All eight tunes!',
      "The big news this summer: Episode One is finally in UK cinemas from the 16th of July! Dave camped outside the cinema for two days. His Mom brought him sandwiches and a jumper. He got the tickets, then he got a cold.",
      'Everybody keeps asking about the Episode One peapod race. Is it the best bit? YES. Can you do it on a bike down the hill by the shops? Also yes. Do NOT tell Mom.',
      'Traffic and travel: the dial-up is busy, someone is downloading a 2 MB picture. Expect delays on all lines.',
      'Weather: it is raining on the keyboard. Please stop eating crisps over it.',
      "Shout-out to everyone who finished Zeldo this week. Green tunics are the new green.",
      "Ask-the-DJ: 'Is Jar-Jar...' NO. Next question.",
      'Request line is open! Pick a tune in the Requests box and it might get played. Might.',
      "Y2K watch: 1999 is going fine so far. Jack has a torch and three tins of beans, just in case.",
      'This station is powered by a 56K modem and the sheer willpower of a little green helper called Gubbinz.',
      "Episode One tip from Dave: the Trade Fedoration is just the Post Office with more spaceships. Dave has not seen it yet. Dave is guessing.",
      "Next, a tune the Floppy Disks wrote in the queue for Episode One. The queue was long enough for an album.",
    ];
    const SLOT = 4, now = () => Date.now();
    function at(t) { // which track plays at time t, and where in it we are
      const L = TUNES.map(x => len(x[3]) + SLOT), total = L.reduce((a, b) => a + b, 0);
      const r = seeded('radio' + Math.floor(t / (total * 1000 * 6)));
      const order = TUNES.map((_, i) => i).sort(() => r() - 0.5);
      let p = (t / 1000) % total;
      for (const i of order) { if (p < L[i]) return { i, pos: p, jingle: p < SLOT, dj: DJ[(Math.floor(t / (total * 1000)) * 7 + i) % DJ.length] }; p -= L[i]; }
      return { i: 0, pos: 0, jingle: true, dj: DJ[0] };
    }
    let ui = null, on = false, cur = -1, timer = 0, lastDJ = -1, listeners = new Map();
    const rm = room('social.radio', (d, o) => { if (d.k === 'bye') listeners.delete(o.id); else if (d.k === 'tune' && int(d.i, 0, TUNES.length - 1)) listeners.set(o.id, d.i); count(); });
    function count() { if (!ui || ui.w.closed) return; const n = 1 + [...listeners.keys()].filter(id => who(id)).length; ui.b.querySelector('.so-rlisten').textContent = n + (n === 1 ? ' listener (you!)' : ' listeners, all hearing the same thing'); if (n >= 3) got('radio3'); }
    function tick() {
      if (!ui || ui.w.closed) return;
      const a = at(now()), t = TUNES[a.i];
      const b = ui.b;
      b.querySelector('.so-rtitle').textContent = a.jingle ? '* JackNet Radio 99.9 FM *' : t[1];
      b.querySelector('.so-rartist').textContent = a.jingle ? 'station ident' : t[2];
      const pos = Math.max(0, a.pos - SLOT), L = len(t[3]);
      b.querySelector('.so-rtime').textContent = `${Math.floor(pos / 60)}:${pad(Math.floor(pos % 60))} / ${Math.floor(L / 60)}:${pad(Math.floor(L % 60))}`;
      b.querySelector('.so-rprog i').style.width = (a.jingle ? 0 : pos / L * 100) + '%';
      if (lastDJ !== a.i) { lastDJ = a.i; b.querySelector('.so-rdj').textContent = 'DJ: ' + a.dj; if (/Episode One/.test(a.dj)) got('radioep1'); }
      if (!on) return;
      if (a.jingle) { if (cur !== -1) { Sound.music.stop(); cur = -1; if (Sound.on) { note(880, 0.1, 'square'); note(1175, 0.1, 'square', 120); note(1319, 0.25, 'square', 240); } } }
      else if (cur !== a.i) { cur = a.i; startAt(t, pos); rm.send({ k: 'tune', i: a.i }); }
      else if (!ui.waiting && Sound.on && Sound.music.playing !== 'social.rot') {
        if (Sound.music.playing) { power(false, true); ui.b.querySelector('.so-rstat').textContent = 'Interference! Another program grabbed the sound card.'; }
        else startAt(t, pos);
      }
    }
    function startAt(t, pos) { // Sound.music always starts at step 0, so play a copy of the tune rotated to the next bar line
      if (!Sound.on) return;
      const T = t[3], st = T.step, n = T.lead.length, into = pos % (n * st);
      let k = Math.ceil(Math.ceil(into / st - 0.001) / 8) * 8; const wait = Math.max(0, k * st - into); k %= n;
      Sound.addTune('social.rot', { step: st, hats: T.hats, lead: T.lead.slice(k).concat(T.lead.slice(0, k)), bass: T.bass.slice(k / 2).concat(T.bass.slice(0, k / 2)) });
      Sound.music.stop(); ui.waiting = true;
      clearTimeout(ui.startT);
      ui.startT = setTimeout(() => { ui.waiting = false; if (on && ui && !ui.w.closed && cur === TUNES.indexOf(t)) { Sound.music.play('social.rot'); ui.b.querySelector('.so-rstat').textContent = 'On air'; } }, wait * 1000);
      ui.b.querySelector('.so-rstat').textContent = 'Tuning in...';
    }
    function power(v, keep) {
      on = v; if (!ui) return;
      ui.b.querySelector('.so-rpower').classList.toggle('on', on); ui.b.querySelector('.so-rled').classList.toggle('on', on);
      if (!on) { if (!keep && Sound.music.playing === 'social.rot') Sound.music.stop(); cur = -1; ui.waiting = false; clearTimeout(ui.startT); ui.b.querySelector('.so-rstat').textContent = 'Radio off'; return; }
      got('radio');
      if (!Sound.on) Desk.toast('JackNet Radio', 'Sound is off. Click the speaker in the system tray to actually hear the radio.', 5000);
      cur = -1; tick();
    }
    function open() {
      if (ui && !ui.w.closed) { ui.w.restore(); return ui.w; }
      const b = h('div', 'so-radio');
      b.innerHTML = `<div class="so-rbox"><div class="so-rdial"><span class="so-rled"></span><div class="so-rscale">${[88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108].map(f => `<i>${f}</i>`).join('')}<b class="so-rneedle"></b></div><span class="so-rfm">99.9 FM</span></div>
        <div class="lcd so-rlcd"><div class="so-rtitle">...</div><div class="so-rartist"></div><div class="so-rtime"></div><div class="so-rprog"><i></i></div></div>
        <div class="so-rbtns"><button class="btn so-rpower" type="button">Power</button><span class="so-rstat">Radio off</span></div>
        <div class="so-rdj"></div><div class="so-rlisten small"></div></div>
        <div class="group so-rreq"><span class="lg">Request a tune</span><div class="row" style="flex-wrap:nowrap"><select aria-label="Tune">${TUNES.map((t, i) => `<option value="${i}">${esc(t[1])} - ${esc(t[2])}</option>`).join('')}</select><button class="btn" type="button">Request</button></div><div class="so-rreqs small">Loading requests...</div></div>`;
      const w = Apps.win('JackNet Radio 99.9 FM', b, { w: 380, icon: I.radio, noResize: true, noMax: true, onClose: () => { clearInterval(timer); rm.leave(); on = false; if (Sound.music.playing === 'social.rot') Sound.music.stop(); clearTimeout(ui.startT); ui = null; cur = -1; } });
      ui = { w, b };
      b.querySelector('.so-rpower').addEventListener('click', () => power(!on));
      let lastReq = 0;
      b.querySelector('.so-rreq button').addEventListener('click', () => {
        if (Date.now() - lastReq < 30000) return Desk.toast('Request line', 'One request every 30 seconds. The DJ only has two hands.', 3000);
        const i = +b.querySelector('select').value; if (!TUNES[i]) return;
        lastReq = Date.now(); Net.kv.put('social.radioreq', 't' + i, String((reqs['t' + i] | 0) + 1)); got('radioreq');
        Net.kv.push('social.radiolog', `requested ${TUNES[i][1]}`);
      });
      const reqs = {};
      const showReqs = () => { const list = TUNES.map((t, i) => [t[1], reqs['t' + i] | 0]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 4); b.querySelector('.so-rreqs').textContent = list.length ? 'Most requested: ' + list.map(x => `${x[0]} (${x[1]})`).join(', ') : 'No requests yet. The DJ is lonely.'; };
      Net.kv.get(['social.radioreq']).then(v => { const m = v['social.radioreq']; if (isObj(m)) for (const [f, val] of Object.entries(m)) if (/^t\d$/.test(f) && /^\d{1,7}$/.test(val)) reqs[f] = +val; showReqs(); });
      const unw = Net.kv.watch('social.radioreq', ev => { if (w.closed) return unw(); if (ev.type === 'put' && /^t\d$/.test(ev.f) && /^\d{1,7}$/.test(ev.v)) { reqs[ev.f] = +ev.v; showReqs(); if (ev.by !== Net.me.nick) w.body.querySelector('.so-rstat').textContent = `${clean(ev.by, 20)} requested a tune!`; } });
      rm.enter(); count(); onlineFns.push(count);
      lastDJ = -1; tick(); timer = setInterval(tick, 500);
      return w;
    }
    return { open, power, TUNES };
  })();

  return { WB, FRIDGE, CORK, RADIO };
};
