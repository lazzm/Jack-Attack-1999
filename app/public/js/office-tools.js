/* office-tools: Clock, Magnifier, Imaging, Object Packager, Program Manager, File Manager, Reversi (the JackOS 3.1
 * corner: "Dad's old computer"), the Fax Cover Page Editor and JackMeeting (a NetMeeting-ish call between two visitors). */
(function () {
  'use strict';
  const K = window.OfficeKit; if (!K) return;
  const { A, esc, h, qs, qsa, on, tap, touchy, msg, toast, today, ext, sfx, store, pad2, pick, rnd, clamp, MONTHS, DAYS } = K;
  const I = K.I;
  const big32 = svg => svg.replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16" width="32" height="32"');

  // ================================================================ CLOCK (JackOS 3.1 style)
  function openClock() {
    let o = Object.assign({ mode: 'analog', secs: true, date: true, font: 0 }, store.get('jhp_office_clock', {}));
    const save = () => store.set('jhp_office_clock', o);
    const b = h('<div class="ck"><canvas width="200" height="200" aria-label="Analog clock"></canvas><div class="ck-dig" hidden></div></div>');
    b.style.cssText = 'display:flex;flex:1;min-height:0';
    const w = K.win('Clock', b, { w: 220, h: 250, menubar: true, icon: I.clock, minW: 120, minH: 120, cls: 'ck-win', onClose: () => clearInterval(t) });
    const cv = qs(b, 'canvas'), dig = qs(b, '.ck-dig'), ck = qs(b, '.ck');
    const FONTS = ['bold 36px "Courier New",monospace', 'bold 34px Arial,sans-serif', 'bold 38px "Times New Roman",serif', '36px Impact,"Anton",sans-serif'];
    const title = () => { const t = today(); w.setTitle(`Clock - ${pad2(t.d)}/${pad2(t.m)}/99`); };
    function draw() {
      const now = new Date(), t = today();
      if (o.mode === 'digital') {
        const hh = now.getHours(), mm = pad2(now.getMinutes()), ss = pad2(now.getSeconds());
        dig.hidden = false; cv.hidden = true; dig.style.font = FONTS[o.font % FONTS.length];
        const size = Math.max(14, Math.min(ck.clientWidth / (o.secs ? 6.5 : 4.2), ck.clientHeight / 2.2));
        dig.style.fontSize = size + 'px';
        dig.innerHTML = `${hh}:${mm}${o.secs ? ':' + ss : ''}${o.date ? `<small>${DAYS[t.date.getDay()]} ${t.d} ${MONTHS[t.m - 1]} 1999</small>` : ''}`;
        return;
      }
      dig.hidden = true; cv.hidden = false;
      const S = Math.max(60, Math.min(ck.clientWidth, ck.clientHeight) - 8), dpr = devicePixelRatio || 1;
      if (cv.width !== Math.round(S * dpr)) { cv.width = cv.height = Math.round(S * dpr); cv.style.width = cv.style.height = S + 'px'; }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S, S);
      const c = S / 2, R = S / 2 - 4;
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, x = c + Math.sin(a) * R * 0.92, y = c - Math.cos(a) * R * 0.92, big = i % 5 === 0, z = big ? Math.max(3, S / 32) : Math.max(1.5, S / 90);
        g.fillStyle = big ? '#008080' : '#000'; g.fillRect(x - z / 2, y - z / 2, z, z); if (big) { g.strokeStyle = '#000'; g.lineWidth = 1; g.strokeRect(x - z / 2, y - z / 2, z, z); } }
      const hand = (frac, len, wid, col) => { const a = frac * Math.PI * 2, s = Math.sin(a), co = Math.cos(a); g.beginPath(); g.moveTo(c + s * R * len, c - co * R * len); g.lineTo(c + co * wid, c + s * wid); g.lineTo(c - s * R * 0.08, c + co * R * 0.08); g.lineTo(c - co * wid, c - s * wid); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); };
      const hr = now.getHours() % 12, mi = now.getMinutes(), se = now.getSeconds();
      hand((hr + mi / 60) / 12, 0.5, Math.max(3, S / 28), '#008080');
      hand((mi + se / 60) / 60, 0.78, Math.max(2.5, S / 36), '#008080');
      if (o.secs) { const a = se / 60 * Math.PI * 2; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * R * 0.84, c - Math.cos(a) * R * 0.84); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); }
    }
    const t = setInterval(() => { if (!w.closed && w.el.style.display !== 'none') draw(); }, 500);
    new ResizeObserver(() => { if (!w.closed) draw(); }).observe(ck);
    function noTitle(v) {
      w.el.classList.toggle('ck-notitle', v); w.menubar.style.display = v ? 'none' : '';
      if (v) K.secret('clocktitle');
    }
    on(b, 'dblclick', () => noTitle(!w.el.classList.contains('ck-notitle')));
    // with no title bar, drag the clock face to move it
    let drag = null;
    on(b, 'pointerdown', ev => { if (!w.el.classList.contains('ck-notitle')) return; drag = { dx: ev.clientX - w.el.offsetLeft, dy: ev.clientY - w.el.offsetTop }; b.setPointerCapture(ev.pointerId); });
    on(b, 'pointermove', ev => { if (drag) { w.el.style.left = (ev.clientX - drag.dx) + 'px'; w.el.style.top = Math.max(0, ev.clientY - drag.dy) + 'px'; } });
    on(b, 'pointerup', () => { drag = null; });
    if (touchy()) K.dbl(b, () => noTitle(!w.el.classList.contains('ck-notitle')));
    let onTop = 0;
    A.menubar(w, [
      ['Settings', () => [{ label: 'Analog', rad: o.mode === 'analog', act: () => { o.mode = 'analog'; save(); draw(); } }, { label: 'Digital', rad: o.mode === 'digital', act: () => { o.mode = 'digital'; save(); draw(); } }, '-', { label: 'Set Font...', dis: o.mode !== 'digital', act: () => { o.font++; save(); draw(); toast('Clock', ['Courier New. Very computery.', 'Arial. Very sensible.', 'Times New Roman. Very posh.', 'Impact. VERY LOUD.'][o.font % 4], 2000); } }, '-', { label: 'No Title', act: () => noTitle(true) }, { label: 'Seconds', chk: o.secs, act: () => { o.secs = !o.secs; save(); draw(); } }, { label: 'Date', chk: o.date, act: () => { o.date = !o.date; save(); draw(); } }, '-', { label: 'Always on Top', chk: !!onTop, act: () => { if (onTop) { clearInterval(onTop); onTop = 0; } else onTop = setInterval(() => { if (w.closed) return clearInterval(onTop); w.el.style.zIndex = 4100; }, 400); } }, '-', { label: 'About Clock...', act: () => msg('About Clock', 'Clock\nVersion 3.1\n\nTells the time. It\'s the only program on Dad\'s old computer that never crashed.\n\nTip: double-click the clock to hide the title bar.', 'info') }]],
    ]);
    title(); draw();
    return w;
  }

  // ================================================================ MAGNIFIER (a live, zoomed copy of the screen in a shadow DOM)
  function openMagnifier() {
    let z = store.get('jhp_office_mag', 3), follow = true, invert = false, mx = DesktopSurface.width() / 2, my = DesktopSurface.height() / 2;
    const b = h('<div class="mg"></div><div class="mg-bar"><label>Magnification: <select class="mz">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option value="${n}">${n}x</option>`).join('') + '</select></label><label><input type="checkbox" class="mf" checked> Follow mouse</label><label><input type="checkbox" class="mi"> Invert colours</label><button class="btn mx" type="button">Exit</button></div>');
    b.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const w = K.win('Magnifier', b, { w: DesktopSurface.width(), h: Math.min(230, Math.round(DesktopSurface.height() * 0.32)), x: 0, y: 0, icon: I.magnify, minW: 200, minH: 120, cls: 'mg-win', onClose: () => { clearInterval(t); removeEventListener('pointermove', pm, true); removeEventListener('pointerdown', pm, true); } });
    const view = qs(b, '.mg'), shadow = view.attachShadow({ mode: 'open' });
    const links = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => `<link rel="stylesheet" href="${esc(l.href)}">`).join('');
    shadow.innerHTML = `${links}<style>:host{display:block;position:absolute;inset:0;overflow:hidden;contain:strict} .mg-world{position:absolute;left:0;top:0;transform-origin:0 0;font:12px/1.35 var(--ui);color:#000;background:#008080;overflow:hidden;pointer-events:none} .mg-world.inv{filter:invert(1)} .mg-x{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,0,0,.45)} .mg-y{position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,0,0,.45)}</style><div class="mg-world"></div><i class="mg-x"></i><i class="mg-y"></i>`;
    const world = qs(shadow, '.mg-world');
    qs(b, '.mz').value = String(z);
    function reclone() {
      if (w.closed || w.el.style.display === 'none') return;
      world.style.width = DesktopSurface.width() + 'px'; world.style.height = DesktopSurface.height() + 'px';
      const frag = document.createDocumentFragment();
      [...DesktopSurface.root().children].forEach(el => {
        if (el === w.el || /^(SCRIPT|LINK|STYLE|TEMPLATE|NOSCRIPT)$/.test(el.tagName)) return;
        const c = el.cloneNode(true);
        c.querySelectorAll('iframe,video,audio,script').forEach(x => x.remove());
        const src = el.querySelectorAll('canvas'), dst = c.querySelectorAll('canvas');
        src.forEach((s, i) => { try { if (dst[i] && s.width && s.height) dst[i].getContext('2d').drawImage(s, 0, 0); } catch (e) {} });
        frag.appendChild(c);
      });
      world.replaceChildren(frag);
      place();
    }
    function place() {
      const r = DesktopSurface.rect(view);
      const tx = clamp(r.width / 2 - mx * z, Math.min(0, r.width - DesktopSurface.width() * z), 0), ty = clamp(r.height / 2 - my * z, Math.min(0, r.height - DesktopSurface.height() * z), 0);
      world.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${z})`;
      world.classList.toggle('inv', invert);
    }
    const pm = ev => { if (!follow || w.closed) return; if (w.el.contains(ev.target)) return; const p = DesktopSurface.point(ev.clientX, ev.clientY); mx = p.x; my = p.y; requestAnimationFrame(place); };
    addEventListener('pointermove', pm, true); addEventListener('pointerdown', pm, true);
    on(qs(b, '.mz'), 'change', ev => { z = +ev.target.value; store.set('jhp_office_mag', z); if (z >= 9) K.secret('magnify'); place(); });
    on(qs(b, '.mf'), 'change', ev => { follow = ev.target.checked; });
    on(qs(b, '.mi'), 'change', ev => { invert = ev.target.checked; place(); });
    tap(qs(b, '.mx'), w.close);
    const t = setInterval(reclone, 1200);
    setTimeout(reclone, 60);
    if (z >= 9) K.secret('magnify');
    toast('Magnifier', touchy() ? 'Click anywhere on the screen to magnify that spot.' : 'Move the mouse around. The magnifier follows it.', 3000);
    return w;
  }

  // ================================================================ IMAGING (view + annotate the pictures on C:)
  const STAMPS = ['APPROVED', 'RECEIVED', 'DRAFT', 'FAXED', 'TOP SECRET', 'GAME OVER', 'NOT DAVE', 'RED = FASTER'];
  function picCanvas(node) {
    return new Promise(res => {
      if (!node) return res(null);
      if (node.type === 'img' && window.JackFiles && JackFiles.art) { try { return res(JackFiles.art(node.art)); } catch (e) { return res(null); } }
      const url = node.dataURL || (node.urec && node.urec.data && node.urec.data.png);
      if (!url) return res(null);
      const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); res(c); }; im.onerror = () => res(null); im.src = url;
    });
  }
  const isPic = k => k.type === 'img' || k.type === 'png' || k.type === 'tif';
  function openImaging(arg) {
    arg = arg || {};
    let node = arg.node || null, base = null, anns = [], tool = 'select', zoom = 1, fit = true, col = '#ff0000', stamp = 0, dirty = false;
    const TL = [
      ['select', 'Annotation Selection', '<svg viewBox="0 0 16 16"><path d="M3 1v12l3-3 2 5 2-1-2-5h4z" fill="#fff" stroke="#000"/></svg>'],
      ['free', 'Freehand Line', '<svg viewBox="0 0 16 16"><path d="M2 12c2-6 4 2 6-3s3-5 6-6" fill="none" stroke="#e10600" stroke-width="1.6"/></svg>'],
      ['hl', 'Highlighter', '<svg viewBox="0 0 16 16"><rect x="1" y="6" width="14" height="5" fill="#ffff00"/><path d="M3 8.5h10" stroke="#000"/></svg>'],
      ['line', 'Straight Line', '<svg viewBox="0 0 16 16"><path d="M2 14L14 2" stroke="#0000ff" stroke-width="1.6"/></svg>'],
      ['rect', 'Hollow Rectangle', '<svg viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="8" fill="none" stroke="#e10600" stroke-width="1.4"/></svg>'],
      ['frect', 'Filled Rectangle', '<svg viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="8" fill="#0000ff" stroke="#000"/></svg>'],
      ['text', 'Typed Text', '<svg viewBox="0 0 16 16"><text x="3" y="13" font-family="Times New Roman" font-weight="bold" font-size="13">A</text></svg>'],
      ['note', 'Attach-a-Note', '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#ffff80" stroke="#000"/><path d="M4 6h8M4 9h6" stroke="#808080"/></svg>'],
      ['stamp', 'Rubber Stamp', '<svg viewBox="0 0 16 16"><rect x="5" y="1" width="6" height="6" fill="#a0702a" stroke="#000"/><rect x="2" y="7" width="12" height="4" fill="#808080" stroke="#000"/><rect x="2" y="12" width="12" height="2" fill="#e10600"/></svg>'],
    ];
    const ZI = '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="#cfe8ff" stroke="#000" stroke-width="1.3"/><path d="M10 10l4.5 4.5" stroke="#000" stroke-width="2"/><path d="M4.5 6.5h4M6.5 4.5v4" stroke="#000"/></svg>', ZO = '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="#cfe8ff" stroke="#000" stroke-width="1.3"/><path d="M10 10l4.5 4.5" stroke="#000" stroke-width="2"/><path d="M4.5 6.5h4" stroke="#000"/></svg>';
    const RL = '<svg viewBox="0 0 16 16"><path d="M12 9a4.5 4.5 0 1 1-2-4" fill="none" stroke="#000080" stroke-width="1.6"/><path d="M8 2l3 3-4 1z" fill="#000080"/></svg>', RR = '<svg viewBox="0 0 16 16"><path d="M4 9a4.5 4.5 0 1 0 2-4" fill="none" stroke="#000080" stroke-width="1.6"/><path d="M8 2L5 5l4 1z" fill="#000080"/></svg>';
    const OPEN = '<svg viewBox="0 0 16 16"><path d="M1.5 3.5h5l1.5 1.5h7v9h-13.5z" fill="#f2d16b" stroke="#7a5a00"/></svg>', SAVE = '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#000080" stroke="#000"/><rect x="4" y="2" width="8" height="5" fill="#fff"/><rect x="4" y="9" width="8" height="5" fill="#c0c0c0"/></svg>', FIT = '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" fill="#fff" stroke="#000"/><path d="M4 4l3 3M12 4L9 7M4 12l3-3M12 12l-3-3" stroke="#000080"/></svg>', COL = '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="currentColor" stroke="#000"/></svg>';
    const tb = K.toolbar([{ t: 'Open', i: OPEN, a: () => openDlg() }, { t: 'Save As', i: SAVE, a: () => saveAs() }, '|', { t: 'Zoom In', i: ZI, a: () => { fit = false; zoom = Math.min(32, zoom + (zoom < 4 ? 1 : 2)); draw(); } }, { t: 'Zoom Out', i: ZO, a: () => { fit = false; zoom = Math.max(1, zoom - (zoom <= 4 ? 1 : 2)); draw(); } }, { t: 'Best Fit', i: FIT, a: () => { fit = true; draw(); } }, '|', { t: 'Rotate Left', i: RL, a: () => rotate(-1) }, { t: 'Rotate Right', i: RR, a: () => rotate(1) }, '|', { t: 'Annotation Colour', i: COL, a: bt => colMenu(bt), id: 'col' }]);
    const b = h(`<div class="im"><div class="im-tools">${TL.map(([id, t, svg]) => `<button class="of-tb${id === 'select' ? ' on' : ''}" type="button" data-t="${id}" title="${t}" aria-label="${t}">${svg}</button>`).join('')}</div><div class="im-stage"><div class="im-wrap"><canvas class="im-base"></canvas></div></div></div><div class="im-thumbs"></div>`);
    b.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const outer = h(''); outer.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0'; outer.append(tb, b);
    const w = K.win('Imaging', outer, { w: 640, h: 500, menubar: true, status: true, icon: I.imaging, minW: 260, minH: 260 });
    const [stZoom] = K.statusParts(w, ['']);
    tb.btns.col.style.color = col;
    const stage = qs(b, '.im-stage'), cv = qs(b, '.im-base'), g = cv.getContext('2d');
    const iw = () => base ? base.width : 1, ih = () => base ? base.height : 1;
    function draw() {
      if (!base) { cv.width = 200; cv.height = 120; g.fillStyle = '#fff'; g.fillRect(0, 0, 200, 120); g.fillStyle = '#808080'; g.font = '12px Tahoma,sans-serif'; g.fillText('File > Open a picture', 40, 64); return; }
      if (fit) zoom = Math.max(1, Math.floor(Math.min((stage.clientWidth - 30) / iw(), (stage.clientHeight - 30) / ih())));
      cv.width = iw() * zoom; cv.height = ih() * zoom;
      g.imageSmoothingEnabled = false; g.drawImage(base, 0, 0, cv.width, cv.height);
      anns.forEach(a => drawAnn(g, a, zoom));
      stZoom.textContent = `Zoom ${zoom * 100}%`;
      w.status.textContent = `${iw()} x ${ih()} pixels   ${anns.length} annotation${anns.length === 1 ? '' : 's'}   Page 1 of 1`;
    }
    function drawAnn(c, a, s) {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      if (a.t === 'free' || a.t === 'hl') { c.globalAlpha = a.t === 'hl' ? 0.4 : 1; c.strokeStyle = a.t === 'hl' ? '#ffff00' : a.c; c.lineWidth = (a.t === 'hl' ? 3 : 0.6) * s; c.beginPath(); a.p.forEach(([x, y], i) => i ? c.lineTo(x * s, y * s) : c.moveTo(x * s, y * s)); c.stroke(); }
      else if (a.t === 'line') { c.strokeStyle = a.c; c.lineWidth = 0.6 * s; c.beginPath(); c.moveTo(a.x * s, a.y * s); c.lineTo(a.x2 * s, a.y2 * s); c.stroke(); }
      else if (a.t === 'rect' || a.t === 'frect') { const x = Math.min(a.x, a.x2) * s, y = Math.min(a.y, a.y2) * s, ww = Math.abs(a.x2 - a.x) * s, hh = Math.abs(a.y2 - a.y) * s; if (a.t === 'frect') { c.fillStyle = a.c; c.fillRect(x, y, ww, hh); } else { c.strokeStyle = a.c; c.lineWidth = 0.6 * s; c.strokeRect(x, y, ww, hh); } }
      else if (a.t === 'text') { c.fillStyle = a.c; c.font = `bold ${Math.max(8, 3 * s)}px Arial,sans-serif`; c.textBaseline = 'top'; c.fillText(a.s, a.x * s, a.y * s); }
      else if (a.t === 'note') { const fs = Math.max(8, 2.4 * s); c.font = `${fs}px Tahoma,sans-serif`; const lw = Math.min(c.measureText(a.s).width + fs, 160 * Math.max(1, s / 4)); c.fillStyle = '#ffff80'; c.strokeStyle = '#000'; c.lineWidth = 1; c.fillRect(a.x * s, a.y * s, lw, fs * 1.8); c.strokeRect(a.x * s, a.y * s, lw, fs * 1.8); c.fillStyle = '#000'; c.textBaseline = 'middle'; c.fillText(a.s, a.x * s + fs / 2, a.y * s + fs * 0.9, lw - fs); }
      else if (a.t === 'stamp') { const fs = Math.max(10, 4 * s); c.translate(a.x * s, a.y * s); c.rotate(-0.2); c.font = `bold ${fs}px Impact,"Arial Narrow",sans-serif`; const tw = c.measureText(a.s).width; c.globalAlpha = 0.85; c.strokeStyle = '#e10600'; c.lineWidth = Math.max(2, s / 2); c.strokeRect(-fs * 0.3, -fs * 0.15, tw + fs * 0.6, fs * 1.3); c.fillStyle = '#e10600'; c.textBaseline = 'top'; c.fillText(a.s, 0, 0); }
      c.restore();
    }
    const at = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / zoom, (ev.clientY - r.top) / zoom]; };
    let cur = null;
    on(cv, 'pointerdown', ev => {
      if (!base || tool === 'select') return;
      ev.preventDefault(); cv.setPointerCapture(ev.pointerId);
      const [x, y] = at(ev);
      if (tool === 'text' || tool === 'note') return askText(tool === 'text' ? 'Typed Text' : 'Attach-a-Note', s => { anns.push({ t: tool, x, y, s, c: col }); dirty = true; draw(); });
      if (tool === 'stamp') { anns.push({ t: 'stamp', x, y, s: STAMPS[stamp], c: '#e10600' }); dirty = true; K.secret('imaging'); sfx('thud'); draw(); return; }
      cur = tool === 'free' || tool === 'hl' ? { t: tool, p: [[x, y]], c: col } : { t: tool, x, y, x2: x, y2: y, c: col };
      anns.push(cur); draw();
    });
    on(cv, 'pointermove', ev => { if (!cur) return; const [x, y] = at(ev); if (cur.p) cur.p.push([x, y]); else { cur.x2 = x; cur.y2 = y; } draw(); });
    on(cv, 'pointerup', () => { if (cur) { dirty = true; cur = null; } });
    cv.style.touchAction = 'none';
    function askText(title, cb) { K.dialog(title, `<div class="of-grid2"><label>Text:</label><input type="text" class="tt" maxlength="60"></div>`, [['OK', bb => { const v = qs(bb, '.tt').value.trim(); if (v) cb(v); }], ['Cancel']], { w: 300, icon: I.imaging }); }
    on(qs(b, '.im-tools'), 'click', ev => { const t = ev.target.closest('[data-t]'); if (!t) return; tool = t.dataset.t; qsa(b, '.im-tools .of-tb').forEach(x => x.classList.toggle('on', x === t)); if (tool === 'stamp') { const r = t.getBoundingClientRect(); IE.menu(STAMPS.map((s, i) => ({ label: s, rad: i === stamp, act: () => { stamp = i; } })), r.right, r.top); } });
    function colMenu(bt) { const r = bt.getBoundingClientRect(); IE.menu(Object.entries(K.COLS).map(([n, c]) => ({ label: n[0].toUpperCase() + n.slice(1), icon: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="${c}" stroke="#000"/></svg>`, act: () => { col = c; bt.style.color = c; } })), r.left, r.bottom); }
    function rotate(d) { if (!base) return; const c = document.createElement('canvas'); c.width = base.height; c.height = base.width; const x = c.getContext('2d'); x.translate(c.width / 2, c.height / 2); x.rotate(d * Math.PI / 2); x.drawImage(base, -base.width / 2, -base.height / 2); base = c; anns = []; dirty = true; draw(); toast('Imaging', 'Rotated. (Annotations fell off. They were stuck on with Blu-Tack.)', 2500); }
    function load(n) {
      picCanvas(n).then(c => {
        if (!c) return msg('Imaging', `${n ? n.name : 'That file'}\n\nImaging can't open this file. It might not be a picture. (Or it's a picture of nothing.)`, 'warn');
        node = n; base = c; anns = (n.urec && n.urec.data && n.urec.data.anns) || []; dirty = false; fit = true; w.setTitle(`Imaging - ${n.name}`); draw(); thumbs();
      });
    }
    function thumbs() {
      const dir = node ? (A.fs.get(K.pathOf(node)) || A.fs.get(K.MD + '/My Pictures')) : A.fs.get(K.MD + '/My Pictures');
      const pics = ((dir && dir.kids) || []).filter(k => isPic(k) && !k.hidden).slice(0, 40), el = qs(b, '.im-thumbs');
      el.innerHTML = ''; el.hidden = !pics.length;
      pics.forEach(p => { const bt = h('', p === node ? 'on' : '', 'button'); bt.type = 'button'; bt.title = p.name; bt.setAttribute('aria-label', p.name); picCanvas(p).then(c => { if (c) bt.appendChild(c); }); tap(bt, () => confirm(() => load(p))); el.appendChild(bt); });
    }
    const confirm = next => dirty && anns.length ? K.askSave('Imaging', node ? node.name : 'Untitled', saveAs, next) : next();
    const TYPES = [['All Image Files', ['bmp', 'gif', 'jpg', 'png', 'tif', 'type:img', 'type:png']], ['TIFF Document (*.tif)', ['tif']]];
    function openDlg() { K.fileDlg({ mode: 'open', title: 'Open', types: TYPES, dir: node ? K.pathOf(node) : K.MD + '/My Pictures', icon: I.imaging }, n => confirm(() => load(n))); }
    function saveAs(then) {
      if (!base) return;
      K.fileDlg({ mode: 'save', title: 'Save As', types: [['TIFF Document (*.tif)', ['tif']]], name: node ? node.name.replace(/\.[a-z]+$/i, '') + ' (annotated).tif' : '', dir: K.MD + '/My Pictures', icon: I.imaging }, t => {
        const s = Math.max(1, Math.floor(320 / Math.max(iw(), ih()))), c = document.createElement('canvas'); c.width = iw() * s; c.height = ih() * s; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(base, 0, 0, c.width, c.height); anns.forEach(a => drawAnn(x, a, s));
        const n = K.saveUser(t.dir, t.name, 'tif', { png: c.toDataURL('image/png') }); if (!n) return;
        dirty = false; toast('Imaging', `Saved ${t.name} (annotations burnt in, like a real fax).`, 3000); if (then) then();
      });
    }
    A.menubar(w, [
      ['File', () => [{ label: 'Open...', key: 'Ctrl+O', act: openDlg }, { label: 'Save As...', act: () => saveAs() }, '-', { label: 'Print...', act: () => msg('Print', 'Printing... Out of cyan. Your picture is now mostly orange. The annotations look great though.', 'warn') }, { label: 'Send...', act: () => A.open('office.fax', { send: true }) }, '-', { label: 'Exit', act: () => confirm(() => { dirty = false; w.close(); }) }]],
      ['Edit', () => [{ label: 'Undo', key: 'Ctrl+Z', dis: !anns.length, act: () => { anns.pop(); draw(); } }, { label: 'Clear All Annotations', dis: !anns.length, act: () => { anns = []; draw(); } }]],
      ['View', () => [{ label: 'Zoom In', act: () => tb.querySelector('[title="Zoom In"]').click() }, { label: 'Zoom Out', act: () => tb.querySelector('[title="Zoom Out"]').click() }, { label: 'Best Fit', chk: fit, act: () => { fit = true; draw(); } }, '-', { label: 'Thumbnails', chk: !qs(b, '.im-thumbs').hidden, act: () => { const t = qs(b, '.im-thumbs'); t.hidden = !t.hidden; } }]],
      ['Annotation', () => TL.slice(1).map(([id, t]) => ({ label: t, rad: tool === id, act: () => qs(b, `[data-t="${id}"]`).click() })).concat(['-', { label: 'Rubber Stamps', sub: STAMPS.map((s, i) => ({ label: s, rad: i === stamp, act: () => { stamp = i; tool = 'stamp'; qsa(b, '.im-tools .of-tb').forEach(x => x.classList.toggle('on', x.dataset.t === 'stamp')); } })) }])],
      ['Page', () => [{ label: 'Rotate Left', act: () => rotate(-1) }, { label: 'Rotate Right', act: () => rotate(1) }, { label: 'Flip', act: () => { rotate(1); rotate(1); } }]],
      ['Help', [{ label: 'About Imaging', act: () => msg('About Imaging', 'Imaging for JackOS 98\nVersion 1.0\n\nView pictures. Scribble on them. Stamp "APPROVED" on Dave\'s drawings.\n\nAnnotations are saved when you Save As a .tif file.', 'info') }]],
    ]);
    w.el.addEventListener('keydown', ev => { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); anns.pop(); draw(); } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'o') { ev.preventDefault(); openDlg(); } });
    new ResizeObserver(() => { if (fit && !w.closed) draw(); }).observe(stage);
    if (node) load(node); else { const first = ((A.fs.get(K.MD + '/My Pictures') || {}).kids || []).find(k => isPic(k) && !k.hidden); if (first) load(first); else { draw(); thumbs(); } }
    return w;
  }

  // ================================================================ OBJECT PACKAGER
  function openPackager(arg) {
    const ICONS = [['Package', I.pkg], ['Gubbinz', null], ['Document', I.doc], ['Program', A.ICON.exe], ['Floppy', '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#202060" stroke="#000"/><rect x="4" y="2" width="8" height="5" fill="#c0c0c0"/><rect x="3.5" y="9" width="9" height="5" fill="#fff"/></svg>'], ['Blobbit', '<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="6.5" ry="5.5" fill="#e10600" stroke="#000"/><circle cx="6" cy="7.5" r="1.5" fill="#ff0"/><circle cx="10" cy="7.5" r="1.5" fill="#ff0"/><path d="M4.5 11.5h7" stroke="#fff"/></svg>']];
    let icon = 0, label = 'Package', content = null, cmd = '';
    const b = h(`<div class="pk"><div class="pk-pane"><h4>Appearance</h4><div class="body pk-app"></div><div class="row" style="padding:4px;justify-content:center"><button class="btn pk-ic" type="button">Insert Icon...</button></div></div><div class="pk-pane"><h4>Content</h4><div class="body pk-con"></div><div class="row" style="padding:4px;justify-content:center"><label class="of-small"><input type="radio" name="pkv" checked> Description</label><label class="of-small"><input type="radio" name="pkv" class="pk-pic"> Picture</label></div></div></div>`);
    b.style.cssText = 'display:flex;flex:1;min-height:0';
    const w = K.win('Object Packager - Package', b, { w: 520, h: 300, menubar: true, icon: I.packager, minW: 300, minH: 220, cls: 'w31' });
    function draw() {
      const ic = ICONS[icon];
      qs(b, '.pk-app').innerHTML = '';
      if (ic[1]) qs(b, '.pk-app').innerHTML = ic[1].replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16" width="48" height="48"');
      else if (window.JackFiles && JackFiles.art) { const c = JackFiles.art('gubbinz'); c.style.width = c.style.height = '48px'; qs(b, '.pk-app').appendChild(c); }
      qs(b, '.pk-app').appendChild(h(esc(label), null, 'span'));
      const pic = qs(b, '.pk-pic').checked;
      qs(b, '.pk-con').innerHTML = content ? (pic && content.art && window.JackFiles ? '' : `<span>${content.gub ? '<b>GUBBINZ</b><br>(packaged)<br><br>He is not happy about it.<br>He is chewing the box.' : `<b>${esc(content.name)}</b><br>${esc(content.path)}<br><br>${esc(content.size || '')}`}</span>`) : (cmd ? `<span>Command line:<br><b>${esc(cmd)}</b></span>` : '<span style="color:#808080">Empty. Use File &gt; Import, or Edit &gt; Command Line.</span>');
      if (pic && content && content.art && window.JackFiles) { const c = JackFiles.art(content.art); c.style.width = c.style.height = '64px'; qs(b, '.pk-con').appendChild(c); }
    }
    const gubbinzify = () => { content = { gub: true, art: 'gubbinz', name: 'GUBBINZ.EXE', path: 'C:\\Program Files\\Gubbinz' }; label = 'Gubbinz'; icon = 1; K.secret('packager'); sfx('waaagh'); draw(); };
    tap(qs(b, '.pk-ic'), () => { const d = K.dialog('Insert Icon', `<p>Current icon:</p><div class="field of-list" style="height:110px">${ICONS.map((ic, i) => `<div class="it${i === icon ? ' sel' : ''}" data-i="${i}">${ic[0]}</div>`).join('')}</div>`, [['OK', bb => { icon = +qs(bb, '.it.sel').dataset.i; if (icon === 1) gubbinzify(); draw(); }], ['Cancel']], { w: 300, icon: I.packager }); on(qs(d.b, '.of-list'), 'click', ev => { const it = ev.target.closest('.it'); if (it) qsa(d.b, '.it').forEach(x => x.classList.toggle('sel', x === it)); }); });
    qsa(b, 'input[name=pkv]').forEach(r => on(r, 'change', draw));
    K.dbl(qs(b, '.pk-app'), () => { if (content && content.gub) return msg('Gubbinz', 'You open the package. Gubbinz jumps out, bites you, and runs off with the bubble wrap.', 'warn'); if (content && content.node) A.openFile(content.node); else if (cmd) { if (!A.run(cmd)) msg('Object Packager', `Cannot run "${cmd}".`, 'warn'); } else msg('Object Packager', 'There\'s nothing in the package. Like a box from ' + Cast.n('uncle') + '.', 'info'); });
    function importDlg() { K.fileDlg({ mode: 'open', title: 'Import', types: [['All Files (*.*)', ['*']]], dir: K.MD, icon: I.packager }, n => { if (/gubbinz/i.test(n.name)) return gubbinzify(); content = { node: n, name: n.name, path: A.fs.pathOf(n), size: n.size || '', art: n.type === 'img' ? n.art : null }; label = n.name; icon = n.type === 'exe' ? 3 : 2; draw(); }); }
    A.menubar(w, [
      ['File', [{ label: 'Update', dis: true }, { label: 'Import...', act: importDlg }, { label: 'Save Contents...', act: () => msg('Save Contents', 'The contents are already saved. They\'re in the package. That\'s the whole point of a package.', 'info') }, '-', { label: 'Exit', act: w.close }]],
      ['Edit', [{ label: 'Undo', dis: true }, '-', { label: 'Copy Package', act: () => { K.pkgClip = { label, content }; toast('Object Packager', 'Package copied. Paste it into... well, nothing accepts packages any more. It was a 1992 thing.', 3500); } }, { label: 'Delete', act: () => { content = null; cmd = ''; label = 'Package'; icon = 0; draw(); } }, '-', { label: 'Label...', act: () => K.dialog('Label', `<div class="of-grid2"><label>Label:</label><input type="text" class="lb" maxlength="30" value="${esc(label)}"></div>`, [['OK', bb => { label = qs(bb, '.lb').value || 'Package'; if (/gubbinz/i.test(label)) gubbinzify(); draw(); }], ['Cancel']], { w: 300, icon: I.packager }) }, { label: 'Command Line...', act: () => K.dialog('Command Line', `<div class="of-grid2"><label>Command:</label><input type="text" class="cl" maxlength="60" value="${esc(cmd)}"></div>`, [['OK', bb => { cmd = qs(bb, '.cl').value.trim(); content = null; if (/gubbinz/i.test(cmd)) gubbinzify(); else { label = cmd || 'Package'; draw(); } }], ['Cancel']], { w: 320, icon: I.packager }) }]],
      ['Help', [{ label: 'About Object Packager...', act: () => msg('About Object Packager', 'Object Packager\nVersion 3.1\n\nPuts things in little boxes so you can put the boxes in documents.\nNobody has ever known why.\n\nDo NOT package Gubbinz.', 'info') }]],
    ]);
    if (arg && arg.node) { content = { name: arg.node.name, path: A.fs.pathOf(arg.node), size: arg.node.size, dad: true }; label = 'Dad\'s Package'; cmd = ''; toast('PACKAGE.PKG', 'Dad packaged something in 1994. It\'s a note that says "test". Thanks, Dad.', 4000); }
    draw();
    return w;
  }

  // ================================================================ PROGRAM MANAGER (Dad's old JackOS 3.1 computer)
  const PI = {
    exe: '<svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#000"/><rect x="2" y="3" width="12" height="2" fill="#000080"/></svg>',
    dos: '<svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" fill="#000" stroke="#808080"/><text x="2.5" y="11" font-family="Courier New" font-size="6" fill="#fff">C:\\&gt;</text></svg>',
    paint: '<svg viewBox="0 0 16 16"><path d="M7 2C3 2 1 5 1 8s2 6 6 6c1 0 1-1 .5-1.5S7 11 8 11h2c3 0 5-2 5-4 0-3-3-5-8-5z" fill="#f4e2b8" stroke="#000" stroke-width=".7"/><circle cx="4" cy="7" r="1.2" fill="#e10600"/><circle cx="6.5" cy="4.5" r="1.2" fill="#ffd400"/><circle cx="10" cy="4.5" r="1.2" fill="#0028c8"/></svg>',
    notepad: '<svg viewBox="0 0 16 16"><rect x="3" y="2" width="10" height="13" fill="#fff" stroke="#000"/><rect x="3" y="2" width="10" height="3" fill="#2a9ac8" stroke="#000"/><path d="M5 8h6M5 10h6M5 12h4" stroke="#808080"/></svg>',
    calc: '<svg viewBox="0 0 16 16"><rect x="3" y="1" width="10" height="14" fill="#c0c0c0" stroke="#000"/><rect x="4.5" y="2.5" width="7" height="3" fill="#cfe8cf" stroke="#000"/><g fill="#000080"><rect x="4.5" y="7" width="2" height="1.5"/><rect x="7.5" y="7" width="2" height="1.5"/><rect x="4.5" y="10" width="2" height="1.5"/><rect x="7.5" y="10" width="2" height="1.5"/></g><rect x="10" y="7" width="1.5" height="4.5" fill="#e10600"/></svg>',
    cards: '<svg viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="8" height="11" rx="1" fill="#fff" stroke="#000"/><rect x="6.5" y="1.5" width="8" height="11" rx="1" fill="#fff" stroke="#000"/><path d="M10.5 4l2 3-2 3-2-3z" fill="#e10600"/></svg>',
    mine: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4.5" fill="#000"/><path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13" stroke="#000" stroke-width="1.2"/><rect x="6" y="6" width="2" height="2" fill="#fff"/></svg>',
    cpl: '<svg viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="9" fill="#c0c0c0" stroke="#000"/><circle cx="5" cy="8" r="2" fill="#e10600" stroke="#000"/><rect x="9" y="5.5" width="2" height="5" fill="#2a7ad8" stroke="#000"/></svg>',
    clip: '<svg viewBox="0 0 16 16"><rect x="3" y="2.5" width="10" height="13" fill="#a0702a" stroke="#000"/><rect x="5" y="4.5" width="6" height="9" fill="#fff"/><rect x="6" y="1.5" width="4" height="2" fill="#c0c0c0" stroke="#000"/></svg>',
    print: '<svg viewBox="0 0 16 16"><rect x="4" y="1.5" width="8" height="5" fill="#fff" stroke="#000"/><rect x="1.5" y="6.5" width="13" height="6" fill="#c0c0c0" stroke="#000"/><rect x="4" y="10.5" width="8" height="4" fill="#fff" stroke="#000"/></svg>',
    setup: '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#202060" stroke="#000"/><rect x="4" y="2" width="8" height="5" fill="#c0c0c0"/><path d="M5 11h6" stroke="#ffd400" stroke-width="2"/></svg>',
    charmap: '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#000"/><path d="M1.5 6h13M1.5 10.5h13M6 1.5v13M10.5 1.5v13" stroke="#808080"/><text x="2.5" y="5.5" font-size="4.5" font-family="Times New Roman">A</text><text x="7" y="10" font-size="4.5" font-family="Times New Roman" fill="#000080">&#223;</text></svg>',
    media: '<svg viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="9" fill="#c0c0c0" stroke="#000"/><path d="M6 5.5v5l4-2.5z" fill="#000"/></svg>',
    sound: '<svg viewBox="0 0 16 16"><circle cx="8" cy="7" r="4" fill="#808080" stroke="#000"/><path d="M8 11v4M5 15h6" stroke="#000"/></svg>',
    tutor: '<svg viewBox="0 0 16 16"><rect x="1.5" y="5.5" width="13" height="7" fill="#e8e0c8" stroke="#000"/><path d="M3 8h1M5 8h1M7 8h1M9 8h1M11 8h1M4 10h8" stroke="#000"/></svg>',
    golf: '<svg viewBox="0 0 16 16"><path d="M1 13c4-2 10-2 14 0v2H1z" fill="#3a9a2a"/><path d="M9 3v9" stroke="#000"/><path d="M9 3l5 2-5 2z" fill="#e10600"/><circle cx="5" cy="12" r="1" fill="#fff" stroke="#000" stroke-width=".4"/></svg>',
  };
  const GROUPS = [
    { n: 'Main', x: 6, y: 6, w: 300, h: 154, items: [['File Manager', I.winfile, 'office.winfile'], ['Control Panel', PI.cpl, 'run:control'], ['Print Manager', PI.print, 'msg:Print Manager|The printer is out of cyan. It has been out of cyan since this computer was new.'], ['Clipboard Viewer', PI.clip, 'run:clipbrd'], ['MS-DOS Prompt', PI.dos, 'run:command'], ['JackOS Setup', PI.setup, 'msg:JackOS Setup|Display: VGA (640x480, 16 colours)\nKeyboard: UK (sticky J key)\nMouse: Microsoft-ish (ball needs cleaning)\nNetwork: No network installed'], ['PIF Editor', PI.exe, 'msg:PIF Editor|Program Information Files. Dad says "never touch these". Dad doesn\'t know what they do either.'], ['Read Me', I.wri, 'file:C:/WIN31/README.WRI']] },
    { n: 'Accessories', x: 312, y: 6, w: 300, h: 262, items: [['Write', I.write, 'office.write'], ['Paintbrush', PI.paint, 'run:mspaint'], ['Terminal', I.hyper, 'office.hyper'], ['Notepad', PI.notepad, 'run:notepad'], ['Recorder', PI.exe, 'msg:Recorder|Records your mouse clicks so you can play them back. Dad recorded himself opening Reversi. It\'s 4 seconds long.'], ['Cardfile', I.cardfile, 'office.cardfile'], ['Calendar', I.cal, 'office.calendar'], ['Calculator', PI.calc, 'run:calc'], ['Clock', I.clock, 'office.clock'], ['Object Packager', I.packager, 'office.packager'], ['Character Map', PI.charmap, 'run:charmap'], ['Media Player', PI.media, 'run:mplayer'], ['Sound Recorder', PI.sound, 'msg:Sound Recorder|No sound card detected. (Dad\'s old computer only beeps.)']] },
    { n: 'Games', x: 6, y: 166, w: 300, h: 102, items: [['Solitaire', PI.cards, 'run:sol'], ['Minesweeper', PI.mine, 'run:winmine'], ['Reversi', I.reversi, 'app:games.reversi']] },
    { n: 'Dad\'s Work', min: true, x: 40, y: 40, w: 300, h: 130, items: [['Accounts 94', I.calc, 'file:C:/WIN31/ACCOUNTS.WKS'], ['My CV', I.write, 'file:C:/WIN31/DADSCV93.WRI'], ['Recipes', I.cardfile, 'file:C:/WIN31/RECIPES.CRD'], ['Typing Tutor', PI.tutor, 'msg:Typing Tutor|Lesson 1: asdf jkl;\nLesson 2: asdf jkl;\n(Dad did lesson 1 forty times and then gave up and used two fingers forever.)']] },
    { n: 'StartUp', min: true, items: [['Clock', I.clock, 'office.clock']] },
    { n: 'Dad\'s Private Stuff', min: true, secret: true, items: [['Xmas List 1993', I.write, 'file:C:/WIN31/XMASLIST.WRI'], ['PACKAGE.PKG', I.packager, 'file:C:/WIN31/PACKAGE.PKG'], ['Golf 2.0', PI.golf, 'msg:Golf 2.0|GOLF.EXE needs a maths co-processor.\n\n(Dad bought it anyway. He has played it zero times. He says it\'s "an investment".)']] },
  ];
  function launch(spec, mini) {
    const [kind, rest] = [spec.split(':')[0], spec.slice(spec.indexOf(':') + 1)];
    if (spec.startsWith('office.')) A.open(spec);
    else if (kind === 'app') A.open(rest);
    else if (kind === 'run') { if (!A.run(rest)) msg('Program Manager', `Cannot find file ${rest.toUpperCase()}.EXE (or one of its components).\n\nCheck to ensure the path and filename are correct and that all required libraries are available.`, 'warn'); }
    else if (kind === 'file') K.openPath(rest);
    else if (kind === 'msg') { const [t, x] = rest.split('|'); msg(t, x, 'info'); }
    if (mini) mini();
  }
  function openProgman() {
    let state = store.get('jhp_office_progman', null), minUse = false;
    const b = h('<div class="pm-desk"></div>');
    b.style.cssText = 'display:flex;flex:1;min-height:0';
    const w = K.win('Program Manager', b, { w: Math.min(640, DesktopSurface.width()), h: 460, menubar: true, icon: I.progman, minW: 260, minH: 240, cls: 'pm-win' });
    const desk = qs(b, '.pm-desk');
    const G = GROUPS.map((g, i) => Object.assign({ i, minimized: !!g.min, max: false }, g, state && state[i] ? state[i] : {}));
    let active = G.find(g => !g.minimized) || G[0];
    function draw() {
      desk.innerHTML = '';
      const W = desk.clientWidth || 600, H = desk.clientHeight || 380;
      G.filter(g => !g.minimized).sort((a, c) => (a === active) - (c === active)).forEach(g => {
        const el = h(`<div class="gh"><button type="button" class="pm-sys" aria-label="Control menu">&#8211;</button><span>${esc(g.n)}</span><button type="button" class="pm-min" aria-label="Minimise">&#9660;</button><button type="button" class="pm-max" aria-label="Maximise">${g.max ? '&#9670;' : '&#9650;'}</button></div><div class="gb">${g.items.map((it, j) => `<button class="pm-ico" type="button" data-j="${j}">${big32(it[1])}<span>${esc(it[0])}</span></button>`).join('')}</div>`, 'pm-grp' + (g === active ? '' : ' inact'));
        if (g.max) Object.assign(el.style, { left: '0px', top: '0px', width: W + 'px', height: H + 'px' });
        else Object.assign(el.style, { left: clamp(g.x, 0, Math.max(0, W - 120)) + 'px', top: clamp(g.y, 0, Math.max(0, H - 60)) + 'px', width: Math.min(g.w, W - 4) + 'px', height: Math.min(g.h, H - 4) + 'px' });
        el.style.zIndex = g === active ? 5 : 1;
        on(el, 'pointerdown', () => { if (active !== g) { active = g; draw(); } });
        tap(qs(el, '.pm-min'), ev => { ev.stopPropagation(); g.minimized = true; g.max = false; active = G.find(x => !x.minimized) || null; draw(); });
        tap(qs(el, '.pm-max'), ev => { ev.stopPropagation(); g.max = !g.max; draw(); });
        tap(qs(el, '.pm-sys'), ev => { const r = ev.target.getBoundingClientRect(); IE.menu([{ label: 'Restore', dis: !g.max, act: () => { g.max = false; draw(); } }, { label: 'Minimize', act: () => { g.minimized = true; draw(); } }, { label: 'Maximize', dis: g.max, act: () => { g.max = true; draw(); } }, '-', { label: 'Close', key: 'Ctrl+F4', act: () => { g.minimized = true; draw(); } }, '-', { label: 'Next', key: 'Ctrl+F6', act: () => { const vis = G.filter(x => !x.minimized); active = vis[(vis.indexOf(g) + 1) % vis.length]; draw(); } }], r.left, r.bottom); });
        // drag by title
        const gh = qs(el, '.gh'); let d = null;
        on(gh, 'pointerdown', ev => { if (ev.target.closest('button') || g.max) return; d = { x: ev.clientX - g.x, y: ev.clientY - g.y }; gh.setPointerCapture(ev.pointerId); });
        on(gh, 'pointermove', ev => { if (!d) return; g.x = Math.max(0, ev.clientX - d.x); g.y = Math.max(0, ev.clientY - d.y); el.style.left = g.x + 'px'; el.style.top = g.y + 'px'; });
        on(gh, 'pointerup', () => { d = null; });
        on(gh, 'dblclick', ev => { if (!ev.target.closest('button')) { g.max = !g.max; draw(); } });
        const gb = qs(el, '.gb');
        on(gb, 'click', ev => { const ic = ev.target.closest('.pm-ico'); if (!ic) return; qsa(desk, '.pm-ico.sel').forEach(x => x.classList.remove('sel')); ic.classList.add('sel'); });
        K.dbl(gb, ev => { const ic = ev.target.closest('.pm-ico'); if (ic) { sfx('click'); launch(g.items[+ic.dataset.j][2], minUse ? () => w.min() : null); } });
        on(gb, 'keydown', ev => { const ic = ev.target.closest('.pm-ico'); if (ic && ev.key === 'Enter') launch(g.items[+ic.dataset.j][2]); });
        desk.appendChild(el);
      });
      // minimised groups sit along the bottom as group icons
      G.filter(g => g.minimized).forEach((g, i) => {
        const ic = h(`${big32(I.progman)}<span>${esc(g.n)}</span>`, 'pm-icon', 'button'); ic.type = 'button';
        ic.style.left = (6 + i * 82) + 'px';
        K.dbl(ic, () => { g.minimized = false; active = g; if (g.secret) K.secret('progdad'); draw(); });
        desk.appendChild(ic);
      });
    }
    let laid = !!state;
    new ResizeObserver(() => { if (w.closed) return; if (!laid && desk.clientWidth) { laid = true; if (desk.clientWidth < 600) cascade(); } draw(); }).observe(desk);
    function cascade() { G.forEach(g => { g.max = false; }); G.filter(g => !g.minimized).forEach((g, i) => { g.x = 4 + i * 22; g.y = 4 + i * 22; g.w = Math.min(330, (desk.clientWidth || 330) - 12 - i * 22); g.h = Math.min(190, Math.max(120, (desk.clientHeight || 300) - 90 - i * 22)); }); draw(); }
    function tile() { const vis = G.filter(g => !g.minimized), W = desk.clientWidth, H = desk.clientHeight - 70, n = vis.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols); vis.forEach((g, i) => { g.max = false; g.x = (i % cols) * W / cols; g.y = Math.floor(i / cols) * H / rows; g.w = W / cols - 2; g.h = H / rows - 2; }); draw(); }
    const sel = () => { const ic = qs(desk, '.pm-ico.sel'); if (!ic) return null; const gEl = ic.closest('.pm-grp'); const g = G.find(x => x.n === qs(gEl, '.gh span').textContent); return g && g.items[+ic.dataset.j]; };
    A.menubar(w, [
      ['File', () => [{ label: 'New...', act: () => msg('New Program Object', 'Dad has disabled making new groups. ("There are enough groups.")', 'info') }, { label: 'Open', key: 'Enter', act: () => { const it = sel(); if (it) launch(it[2]); } }, { label: 'Move...', key: 'F7', dis: !sel(), act: () => msg('Move Program Item', 'You can\'t move that. Dad arranged them in 1994 with a ruler.', 'info') }, { label: 'Copy...', key: 'F8', dis: !sel(), act: () => msg('Copy Program Item', 'Copied to the same group. Now there are two. Dad will notice.', 'info') }, { label: 'Delete', key: 'Del', dis: !sel(), act: () => msg('Delete', 'Are you sure you want to delete the item?\n\n(No you\'re not. This is Dad\'s computer.)', 'warn') }, { label: 'Properties...', key: 'Alt+Enter', dis: !sel(), act: () => { const it = sel(); K.dialog('Program Item Properties', `<div class="of-grid2"><label>Description:</label><input type="text" value="${esc(it[0])}" readonly><label>Command Line:</label><input type="text" value="${esc(it[2].startsWith('file:') ? it[2].slice(5).replace(/\//g, '\\') : it[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) + '.EXE')}" readonly><label>Working Directory:</label><input type="text" value="C:\\JACKOS" readonly><label>Shortcut Key:</label><input type="text" value="None" readonly></div><label style="display:block;margin-top:6px"><input type="checkbox"> Run Minimized</label>`, [['OK'], ['Cancel'], ['Change Icon...', () => { toast('Change Icon', 'There is only one other icon. It is a picture of a filing cabinet.', 2500); return false; }]], { w: 380, icon: I.progman }); } }, '-', { label: 'Run...', act: () => A.runDialog() }, '-', { label: 'Exit JackOS...', act: () => msg('Exit JackOS', 'This will end your JackOS session.', 'warn', [['OK', () => { K.secret('progexit'); w.close(); sfx('shutdown'); setTimeout(() => msg('MS-DOS', 'C:\\JACKOS>_\n\n...just kidding. You\'re still in JackOS 98. Dad\'s old JackOS is just a program now. Like a ship in a bottle.', 'info'), 500); }], ['Cancel']]) }]],
      ['Options', () => [{ label: 'Auto Arrange', chk: true, act: () => cascade() }, { label: 'Minimize on Use', chk: minUse, act: () => { minUse = !minUse; } }, { label: 'Save Settings on Exit', chk: !!state, act: () => { if (state) { state = null; store.set('jhp_office_progman', null); } else { state = G.map(g => ({ x: g.x, y: g.y, w: g.w, h: g.h, minimized: g.minimized })); store.set('jhp_office_progman', state); } } }]],
      ['Window', () => [{ label: 'Cascade', key: 'Shift+F5', act: cascade }, { label: 'Tile', key: 'Shift+F4', act: tile }, { label: 'Arrange Icons', act: draw }, '-', ...G.map((g, i) => ({ label: `${i + 1} ${g.n}`, chk: g === active && !g.minimized, act: () => { g.minimized = false; active = g; if (g.secret) K.secret('progdad'); draw(); } }))]],
      ['Help', [{ label: 'Contents', act: () => K.openPath('C:/WIN31/README.WRI') }, { label: 'JackOS Tutorial', act: () => msg('JackOS Tutorial', 'Lesson 1: The Mouse.\n\nThis is a mouse. Move it around on the desk. See the arrow move? That\'s you. You\'re the arrow now.\n\nLesson 2: Clicking.\n\nDad never got to lesson 2.', 'info') }, '-', { label: 'About Program Manager...', act: () => msg('About Program Manager', 'Program Manager\nVersion 3.1\n\nThis product is licensed to:\nDad\nDad\'s Company Ltd (it was just Dad)\n\n386 Enhanced Mode\nMemory: 4,096 KB Free\nSystem Resources: 64% Free', 'info') }]],
    ]);
    w.el.addEventListener('keydown', ev => { if (ev.shiftKey && ev.key === 'F5') { ev.preventDefault(); cascade(); } else if (ev.shiftKey && ev.key === 'F4') { ev.preventDefault(); tile(); } });
    on(w.el.querySelector('[data-w=close]'), 'click', () => { if (state) store.set('jhp_office_progman', G.map(g => ({ x: g.x, y: g.y, w: g.w, h: g.h, minimized: g.minimized }))); }, true);
    requestAnimationFrame(draw);
    return w;
  }

  // ================================================================ FILE MANAGER (JackOS 3.1)
  const dos83 = n => { const m = /^(.*?)(?:\.([^.]*))?$/.exec(n.name); const base = (m[1] || '').toLowerCase().replace(/[^a-z0-9_~!-]/g, ''), e = (m[2] || '').toLowerCase().slice(0, 3); return (base.length > 8 || /[ .]/.test(m[1] || '') ? base.slice(0, 6) + '~1' : base) + (e && n.type !== 'dir' ? '.' + e : ''); };
  const sizeOf = n => { if (n.type === 'dir') return 0; const m = /([\d.,]+)\s*(KB|MB|bytes)?/i.exec(n.size || ''); if (m) { const v = parseFloat(m[1].replace(/,/g, '')); return Math.round(v * (/MB/i.test(m[2]) ? 1048576 : /KB/i.test(m[2]) ? 1024 : 1)); } return (n.text || '').length || 1024; };
  function openWinfile() {
    let cur = 'C:', open = new Set(['C:']), details = false, selName = null;
    const DRV = '<svg viewBox="0 0 20 14"><rect x="1" y="3" width="18" height="8" fill="#c0c0c0" stroke="#000"/><rect x="3" y="7" width="7" height="1.5" fill="#000"/><rect x="14" y="7" width="2" height="1.5" fill="#0c0"/></svg>', FLP = '<svg viewBox="0 0 20 14"><rect x="1" y="3" width="18" height="8" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="12" height="1.5" fill="#000"/></svg>', CDR = '<svg viewBox="0 0 20 14"><rect x="1" y="3" width="18" height="8" fill="#c0c0c0" stroke="#000"/><circle cx="10" cy="7" r="2.5" fill="#e4e8ff" stroke="#555"/></svg>';
    const FILE = '<svg viewBox="0 0 16 14"><path d="M3 1h7l3 3v9H3z" fill="#fff" stroke="#000"/></svg>', PROG = '<svg viewBox="0 0 16 14"><rect x="1.5" y="1.5" width="13" height="11" fill="#fff" stroke="#000"/><rect x="2" y="2" width="12" height="2" fill="#000080"/></svg>', DOCI = '<svg viewBox="0 0 16 14"><path d="M3 1h7l3 3v9H3z" fill="#fff" stroke="#000"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#000"/></svg>';
    const b = h(`<div class="fm"><div class="fm-drives"><button class="fm-drv" type="button" data-d="A">${FLP} a</button><button class="fm-drv on" type="button" data-d="C">${DRV} c</button><button class="fm-drv" type="button" data-d="D">${CDR} d</button><span style="margin-left:auto">C: [JACKS_PC]</span></div><div class="fm-path"></div><div class="fm-main"><div class="fm-tree" role="tree"></div><div class="fm-list" role="listbox"></div></div></div>`);
    b.style.cssText = 'display:flex;flex:1;min-height:0';
    const w = K.win('File Manager', b, { w: Math.min(640, DesktopSurface.width()), h: 440, menubar: true, status: true, icon: I.winfile, minW: 280, minH: 220, cls: 'fm-win' });
    const [st2] = K.statusParts(w, ['']);
    const tree = qs(b, '.fm-tree'), list = qs(b, '.fm-list');
    const hasSub = n => (n.kids || []).some(k => k.type === 'dir' && !k.hidden);
    function drawTree() {
      let s = '';
      const walk = (n, path, d) => {
        const kids = (n.kids || []).filter(k => k.type === 'dir' && !k.hidden).sort((a, c) => a.name.localeCompare(c.name));
        const isOpen = open.has(path);
        s += `<button type="button" class="fm-row${path === cur ? ' sel' : ''}" data-p="${esc(path)}" style="--d:${d}" role="treeitem"><i>${kids.length ? (isOpen ? '&minus;' : '+') : ''}</i><span class="fm-fold${path === cur ? ' open' : ''}"></span><span>${esc(d ? dos83(n) : 'c:\\')}</span></button>`;
        if (isOpen) kids.forEach(k => walk(k, path + '/' + k.name, d + 1));
      };
      walk(A.fs.root, 'C:', 0);
      tree.innerHTML = s;
    }
    function drawList() {
      const dir = A.fs.get(cur) || A.fs.root;
      const kids = (dir.kids || []).filter(k => !k.hidden).sort((a, c) => (a.type === 'dir') === (c.type === 'dir') ? a.name.localeCompare(c.name) : a.type === 'dir' ? -1 : 1);
      list.style.flexWrap = details ? 'nowrap' : '';
      list.innerHTML = `<button type="button" class="fm-row" data-up="1"><span class="fm-fold"></span><span>..</span></button>` + kids.map(k => `<button type="button" class="fm-row${k.name === selName ? ' sel' : ''}" data-n="${esc(k.name)}" title="${esc(k.name)}">${k.type === 'dir' ? '<span class="fm-fold"></span>' : (k.type === 'exe' ? PROG : /^(doc|wri|rtf|txt|wks|xls|crd)$/.test(ext(k.name)) || k.type === 'txt' ? DOCI : FILE)}<span>${esc(dos83(k))}</span>${details ? `<span class="fm-sz">${k.type === 'dir' ? '' : sizeOf(k).toLocaleString('en-GB')}</span><span class="fm-sz">${esc(k.date || '10/12/98')}</span>` : ''}</button>`).join('');
      qs(b, '.fm-path').textContent = cur.replace(/\//g, '\\').toUpperCase().replace(/^C:$/, 'C:\\') + '\\*.*';
      const files = kids.filter(k => k.type !== 'dir');
      w.status.textContent = `C: 1,204,032KB free,  6,400,000KB total`;
      st2.textContent = `Total ${files.length} file(s) (${files.reduce((a, k) => a + sizeOf(k), 0).toLocaleString('en-GB')} bytes)`;
    }
    const draw = () => { drawTree(); drawList(); };
    on(tree, 'click', ev => { const r = ev.target.closest('.fm-row'); if (!r) return; const p = r.dataset.p; if (ev.target.closest('i') || p === cur) { if (open.has(p) && p !== 'C:') open.delete(p); else open.add(p); } cur = p; open.add(p); selName = null; draw(); });
    on(list, 'click', ev => { const r = ev.target.closest('.fm-row'); if (!r) return; qsa(list, '.fm-row.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel'); selName = r.dataset.n || null; });
    K.dbl(list, ev => {
      const r = ev.target.closest('.fm-row'); if (!r) return;
      if (r.dataset.up) { if (cur !== 'C:') { cur = cur.replace(/\/[^/]+$/, ''); draw(); } return; }
      const n = A.fs.get(cur + '/' + r.dataset.n); if (!n) return;
      if (n.type === 'dir') { if (n.locked && !store.get('jhp_files_unlocked', {})[n.name]) return msg('File Manager', `Cannot read from ${dos83(n)}.\n\nAccess denied. (It's locked. Jack's orders.)`, 'warn'); cur += '/' + n.name; open.add(cur); selName = null; draw(); }
      else A.openFile(n);
    });
    qsa(b, '.fm-drv').forEach(d => tap(d, () => { if (d.dataset.d === 'A') msg('File Manager', 'There is no disk in drive A.\n\nInsert a disk, and then try again. (Retry / Cancel / Shout at it)', 'warn'); else if (d.dataset.d === 'D') msg('File Manager', 'Drive D: is a CD-ROM drive. File Manager is from 1992 and is slightly scared of it. Use My Computer instead.', 'info'); }));
    function expandAll() { (function walk(n, p) { open.add(p); (n.kids || []).filter(k => k.type === 'dir' && !k.hidden).forEach(k => walk(k, p + '/' + k.name)); })(A.fs.root, 'C:'); draw(); K.secret('winfile'); }
    const selNode = () => selName ? A.fs.get(cur + '/' + selName) : null;
    A.menubar(w, [
      ['File', () => [{ label: 'Open', key: 'Enter', dis: !selNode(), act: () => { const n = selNode(); if (n) n.type === 'dir' ? (cur += '/' + n.name, draw()) : A.openFile(n); } }, { label: 'Move...', key: 'F7', act: () => msg('Move', 'Moving files on Dad\'s old computer is not allowed. Last time, the computer didn\'t start for a week.', 'warn') }, { label: 'Copy...', key: 'F8', act: () => msg('Copy', 'Copy to where? The floppy drive is empty. (And the floppy is in Dave\'s bag.)', 'info') }, { label: 'Delete...', key: 'Del', act: () => msg('Confirm File Delete', 'Delete file?\n\nNO. This is Dad\'s computer. Nothing gets deleted.', 'warn') }, { label: 'Rename...', act: () => msg('Rename', 'Filenames can only be 8 letters long (plus 3 more after a dot). "GUBBINZ_WAS_HERE.TXT" won\'t fit. Sorry.', 'info') }, { label: 'Properties...', key: 'Alt+Enter', dis: !selNode(), act: () => { const n = selNode(); msg('Properties', `File Name: ${dos83(n).toUpperCase()}\nSize: ${sizeOf(n).toLocaleString('en-GB')} bytes\nLast Change: ${n.date || '10/12/98'}\nPath: ${cur.replace(/\//g, '\\').toUpperCase()}\n\nAttributes: [ ] Read Only  [x] Archive  [ ] Hidden  [ ] System`, 'info'); } }, '-', { label: 'Run...', act: () => A.runDialog() }, { label: 'Print...', act: () => msg('Print', 'Out of cyan.', 'warn') }, { label: 'Associate...', act: () => msg('Associate', 'Files with extension WRI are associated with WRITE.EXE.\n(They always have been. They always will be.)', 'info') }, { label: 'Create Directory...', act: () => msg('Create Directory', 'Dad: "There are enough directories."', 'info') }, { label: 'Search...', act: () => A.open('find') }, '-', { label: 'Exit', act: w.close }]],
      ['Disk', [{ label: 'Copy Disk...', act: () => msg('Copy Disk', 'Insert source disk in drive A:. Then insert destination disk. Then source. Then destination. Then source... (it\'s 14 swaps for one disk.)', 'info') }, { label: 'Label Disk...', act: () => msg('Label Disk', 'Volume label for C: is JACKS_PC. (It used to be DADS_PC. There was a discussion.)', 'info') }, { label: 'Format Disk...', act: () => msg('Format Disk', 'Format drive C:?\n\nAbsolutely not. There is a sticky note on the screen that says "DO NOT FORMAT - DAD".', 'warn') }, { label: 'Make System Disk...', act: () => msg('Make System Disk', 'Insert a blank floppy. (Any floppy that isn\'t Doom.)', 'info') }, '-', { label: 'Select Drive...', act: () => toast('File Manager', 'Drive C: selected. It\'s the only one that works.', 2500) }]],
      ['Tree', [{ label: 'Expand One Level', key: '+', act: () => { open.add(cur); draw(); } }, { label: 'Expand Branch', key: '*', act: () => { const n = A.fs.get(cur); (function walk(x, p) { open.add(p); (x.kids || []).filter(k => k.type === 'dir').forEach(k => walk(k, p + '/' + k.name)); })(n, cur); draw(); } }, { label: 'Expand All', key: 'Ctrl+*', act: expandAll }, { label: 'Collapse Branch', key: '-', act: () => { [...open].forEach(p => { if (p.startsWith(cur + '/')) open.delete(p); }); if (cur !== 'C:') open.delete(cur); draw(); } }, '-', { label: 'Indicate Expandable Branches', chk: true }]],
      ['View', () => [{ label: 'Tree and Directory', chk: true }, '-', { label: 'Name', rad: !details, act: () => { details = false; drawList(); } }, { label: 'All File Details', rad: details, act: () => { details = true; drawList(); } }, '-', { label: 'Sort by Name', rad: true }]],
      ['Options', [{ label: 'Confirmation...', act: () => msg('Confirmation', 'Confirm on: File Delete, Directory Delete, File Replace, Mouse Action, Disk Commands, Dad.', 'info') }, { label: 'Font...', act: () => msg('Font', 'Font: MS Sans Serif, 8. The only font Dad trusts.', 'info') }, { label: 'Status Bar', chk: true }]],
      ['Window', [{ label: 'New Window', act: () => A.open('office.winfile') }, { label: 'Refresh', key: 'F5', act: draw }]],
      ['Help', [{ label: 'About File Manager...', act: () => msg('About File Manager', 'File Manager\nVersion 3.1\n\n386 Enhanced Mode\nMemory: 4,096 KB Free\n\n"Where did I save it?" - everyone, since 1992', 'info') }]],
    ]);
    w.el.addEventListener('keydown', ev => { if (ev.ctrlKey && ev.key === '*') { ev.preventDefault(); expandAll(); } else if (ev.key === 'F5') { ev.preventDefault(); draw(); } });
    draw();
    return w;
  }

  // ================================================================ FAX COVER PAGE EDITOR
  const TPL = { generic: { title: 'FAX', note: '' }, urgent: { title: 'URGENT FAX!!!', note: 'PLEASE READ THIS STRAIGHT AWAY.' }, jack: { title: 'FAX FROM JACK HQ', note: 'This fax came from a computer. In a bedroom. In 1999. The future is now.' } };
  function openFax(arg) {
    arg = arg || {};
    let f = Object.assign({ tpl: 'jack', to: 'Dave', num: '01632 960123', from: 'Jack', pages: '1', subj: 'Saturday', note: 'Bring the good controller. And the floppy you owe me.', urgent: false, reply: true }, (arg.node && arg.node.urec && arg.node.urec.data) || {});
    const b = h(`<div class="fx-page"><div class="fx-sheet"></div></div><div class="fx-form"><div class="row"><label>To:</label><input class="ft" maxlength="40"><label>Fax:</label><input class="fn" maxlength="20" inputmode="tel"></div><div class="row"><label>From:</label><input class="ff" maxlength="40"><label>Pages:</label><input class="fp" maxlength="3" style="max-width:50px"></div><div class="row"><label>Re:</label><input class="fs" maxlength="50"></div><div class="row"><label>Note:</label><textarea class="fo" rows="2" maxlength="400"></textarea></div><div class="row"><label>Style:</label><select class="fl"><option value="generic">Generic</option><option value="urgent">Urgent!!!</option><option value="jack">Jack HQ</option></select><label style="width:auto"><input type="checkbox" class="fu"> Urgent</label><label style="width:auto"><input type="checkbox" class="fr"> Please reply</label><button class="btn fx-send" type="button" style="margin-left:auto">Send Fax...</button></div></div>`);
    b.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const w = K.win('Fax Cover Page Editor - ' + (arg.node ? arg.node.name : 'Untitled.cpe'), b, { w: 520, h: 620, menubar: true, icon: I.fax, minW: 280, minH: 300 });
    const F = { to: '.ft', num: '.fn', from: '.ff', pages: '.fp', subj: '.fs', note: '.fo', tpl: '.fl' };
    Object.entries(F).forEach(([k, s]) => { qs(b, s).value = f[k]; on(qs(b, s), 'input', () => { f[k] = qs(b, s).value; draw(); }); on(qs(b, s), 'change', () => { f[k] = qs(b, s).value; draw(); }); });
    qs(b, '.fu').checked = f.urgent; qs(b, '.fr').checked = f.reply;
    on(qs(b, '.fu'), 'change', ev => { f.urgent = ev.target.checked; draw(); }); on(qs(b, '.fr'), 'change', ev => { f.reply = ev.target.checked; draw(); });
    function draw() {
      const t = TPL[f.tpl] || TPL.generic, d = today();
      qs(b, '.fx-sheet').innerHTML = `<h2>${esc(t.title)}</h2><div class="fx-rule"></div>${f.urgent ? '<div class="fx-stamp">URGENT</div>' : ''}<div class="fx-ln"><b>Date:</b><span>${pad2(d.d)}/${pad2(d.m)}/1999</span></div><div class="fx-ln"><b>To:</b><span>${esc(f.to)}</span></div><div class="fx-ln"><b>Fax no:</b><span>${esc(f.num)}</span></div><div class="fx-ln"><b>From:</b><span>${esc(f.from)}</span></div><div class="fx-ln"><b>Pages:</b><span>${esc(f.pages)} (including this one)</span></div><div class="fx-ln"><b>Re:</b><span>${esc(f.subj)}</span></div><div class="fx-ck"><span>[${f.urgent ? 'X' : ' '}] Urgent</span><span>[ ] For review</span><span>[${f.reply ? 'X' : ' '}] Please reply</span><span>[ ] Please comment</span></div><div class="fx-note">${esc([t.note, f.note].filter(Boolean).join('\n\n'))}</div><div class="fx-foot">If you did not receive all the pages, please ring ${esc(f.num.replace(/\d{3}$/, 'xxx'))}... actually, ring the sender.<br>Sent by JackOS Fax 98 - the paper is curly because that's how faxes work</div>`;
    }
    function send() {
      const d = K.dialog('Send Fax', `<div class="of-grid2"><label>Send to:</label><input type="text" class="sn" value="${esc(f.num)}" inputmode="tel"><label>Modem:</label><span class="of-small">33.6K (fax class 2)</span><label>Pages:</label><span class="of-small">cover page + ${Math.max(0, (+f.pages || 1) - 1)}</span></div>`, [['Send', bb => {
        const num = qs(bb, '.sn').value.trim(); if (!num) return false;
        const pw = h('<div class="of-small fxs">Dialling...</div><div class="prog" style="margin:8px 0"><span style="display:flex;gap:2px"></span></div>');
        const ww = A.win('Sending Fax', pw, { w: 300, noResize: true, noMax: true, noMin: true, icon: I.fax });
        sfx('modem'); const steps = ['Dialling ' + num + '...', 'Ringing...', 'Handshake (BEEEEE-KRRRRSHHHH)...', 'Sending page 1 of ' + (+f.pages || 1) + '...', 'Sending page 1 of ' + (+f.pages || 1) + '... (slowly)', 'Hanging up...'];
        let i = 0; const bar = qs(pw, '.prog span');
        const t = setInterval(() => { if (ww.closed) return clearInterval(t); qs(pw, '.fxs').textContent = steps[Math.min(steps.length - 1, Math.floor(i / 3))]; if (i < 18) bar.appendChild(document.createElement('i')); if (++i > 18) { clearInterval(t); ww.close(); K.secret('fax'); const dave = /960123$/.test(num.replace(/\D/g, '')); msg('Fax Sent', dave ? 'Fax sent to Dave\'s house!\n\nDave\'s dad\'s fax machine printed one page of very curly paper. Dave\'s dad has rung to ask who "Jack HQ" is and why it is faxing him about controllers.' : `Fax sent to ${num}!\n\n(Whoever is there is now holding a warm, curly piece of paper with your note on it. Welcome to the future.)`, 'info'); } }, 260);
      }], ['Cancel']], { w: 320, icon: I.fax });
      return d;
    }
    tap(qs(b, '.fx-send'), send);
    const save = () => K.fileDlg({ mode: 'save', title: 'Save As', types: [['Cover Pages (*.cpe)', ['cpe']]], name: arg.node && arg.node.user ? arg.node.name : 'My Cover Page.cpe', dir: K.MD, icon: I.fax }, t => { if (K.saveUser(t.dir, t.name, 'cpe', f)) { w.setTitle('Fax Cover Page Editor - ' + t.name); toast('Fax Cover Page Editor', 'Saved ' + t.name, 2000); } });
    A.menubar(w, [
      ['File', [{ label: 'New', act: () => { f = { tpl: 'generic', to: '', num: '', from: K.nick(), pages: '1', subj: '', note: '', urgent: false, reply: false }; Object.entries(F).forEach(([k, s]) => { qs(b, s).value = f[k]; }); draw(); } }, { label: 'Open...', act: () => K.fileDlg({ mode: 'open', title: 'Open', types: [['Cover Pages (*.cpe)', ['cpe']]], dir: K.MD, icon: I.fax }, n => { w.close(); A.openFile(n); }) }, { label: 'Save As...', act: save }, '-', { label: 'Print', act: () => msg('Print', 'Printing the cover page... out of cyan. It came out pink. Faxes are black and white anyway.', 'warn') }, { label: 'Send Fax...', act: send }, '-', { label: 'Exit', act: w.close }]],
      ['Insert', [{ label: 'Today\'s Date', act: () => { const d = today(); f.note += ` ${pad2(d.d)}/${pad2(d.m)}/1999`; qs(b, '.fo').value = f.note; draw(); } }, { label: 'Smiley :-)', act: () => { f.note += ' :-)'; qs(b, '.fo').value = f.note; draw(); } }, { label: 'Cheer', act: () => { f.note += ' COWABUNGA!'; qs(b, '.fo').value = f.note; draw(); } }]],
      ['Help', [{ label: 'About Cover Page Editor', act: () => msg('About', 'Fax Cover Page Editor\nVersion 4.0\n\nThe first page of every fax. The one that says FAX in big letters so the fax machine knows it\'s a fax.', 'info') }]],
    ]);
    draw();
    if (arg.send) setTimeout(send, 200);
    return w;
  }

  // ================================================================ JACKMEETING (call another visitor: chat + "video")
  const CH = 'office.meet';
  let meetApi = null;
  if (window.Net && Net.onRelay) Net.onRelay(CH, (d, m) => { if (!d || typeof d !== 'object' || typeof d.t !== 'string' || !m || !m.fromId) return; if (meetApi) meetApi(d, m); else if (d.t === 'ring') Net.relay(m.fromId, CH, { t: 'no', why: 'off' }); });
  function openMeeting() {
    let call = null, people = [], selId = null;
    const b = h(`<div class="jm-top"><div class="jm-vid"><canvas width="64" height="48"></canvas><span class="lab">Remote video</span><span class="fps"></span></div><div class="jm-vid jm-me" style="flex:.55"><canvas width="64" height="48"></canvas><span class="lab">My video</span></div><div class="jm-people" role="listbox" aria-label="Directory"></div></div><div class="jm-chat"><div class="jm-log" role="log"></div><form class="jm-send"><input type="text" maxlength="200" placeholder="Type a message" autocomplete="off" aria-label="Chat message"><button class="btn" type="submit">Send</button></form></div>`);
    b.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const outer = h(''); outer.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const CALLI = '<svg viewBox="0 0 16 16"><path d="M1 9c0-3 3-4 7-4s7 1 7 4v1h-3V8H4v2H1z" fill="#008000" stroke="#000"/><path d="M4 11h8l1.5 3.5h-11z" fill="#e8e0c8" stroke="#000"/></svg>', HANGI = '<svg viewBox="0 0 16 16"><path d="M1 7c0-3 3-4 7-4s7 1 7 4v1h-3V6H4v2H1z" fill="#e10600" stroke="#000"/><path d="M4 11h8l1.5 3.5h-11z" fill="#e8e0c8" stroke="#000"/></svg>';
    const tb = K.toolbar([{ t: 'Place Call', i: CALLI, label: 'Call', a: () => place(), id: 'call' }, { t: 'Hang Up', i: HANGI, label: 'Hang Up', a: () => hang(true), id: 'hang' }, '|', { t: 'Directory: ils.jacknet.jnet', i: K.I.abook, label: 'Directory', a: () => refresh() }]);
    outer.append(tb, b);
    const w = K.win('JackMeeting', outer, { w: 600, h: 420, menubar: true, status: true, icon: I.meeting, minW: 280, minH: 300, onClose: () => { hang(true); meetApi = null; cancelAnimationFrame(raf); } });
    const log = qs(b, '.jm-log'), peopleEl = qs(b, '.jm-people');
    const say = (who, text, col) => { const d = h('', null, 'div'); if (who) { const bb = h('', null, 'b'); bb.textContent = who + ': '; if (col) bb.style.color = col; d.appendChild(bb); d.appendChild(document.createTextNode(text)); } else { d.className = 'sys'; d.textContent = text; } log.appendChild(d); log.scrollTop = log.scrollHeight; };
    function refresh() {
      people = [{ id: -1, nick: 'Gubbinz (always in)', col: '#3a9a2a' }].concat((K.online || []).filter(p => !(window.Net && Net.me && p.id === Net.me.id)).map(p => ({ id: p.id, nick: String(p.nick || 'Guest').slice(0, 24), col: /^#[0-9a-f]{3,6}$/i.test(p.col || '') ? p.col : '#000080' })));
      peopleEl.innerHTML = people.map(p => `<div data-id="${p.id}" class="${p.id === selId ? 'sel' : ''}"><i style="background:${p.col}"></i>${esc(p.nick)}</div>`).join('');
      w.status.textContent = call ? `In a call with ${call.nick}` : `Logged on to ils.jacknet.jnet - ${people.length} in the directory`;
      tb.btns.call.disabled = !!call; tb.btns.hang.disabled = !call;
    }
    if (window.Net && Net.on) Net.on('online', m => {
      if (w.closed) return; setTimeout(refresh, 50);
      // the other end's connection dropped: hold the line for a minute before giving up on them
      if (!call || call.id <= 0 || call.pending) return;
      const here = (m.online || []).some(o => o.id === call.id);
      if (!here && !call.lostT) { say(null, `${call.nick}'s line went dead. Holding the call for a minute...`); const c0 = call; call.lostT = setTimeout(() => { if (call === c0) { say(null, `${c0.nick} lost the connection. Call ended.`); call = null; refresh(); } }, 60000); }
      else if (here && call.lostT) { clearTimeout(call.lostT); call.lostT = 0; say(null, `${call.nick} is back on the line.`); }
    });
    on(peopleEl, 'click', ev => { const r = ev.target.closest('[data-id]'); if (!r) return; selId = +r.dataset.id; refresh(); });
    K.dbl(peopleEl, ev => { const r = ev.target.closest('[data-id]'); if (r) { selId = +r.dataset.id; place(); } });
    function place() {
      if (call) return;
      const p = people.find(x => x.id === selId);
      if (!p) return msg('JackMeeting', 'Pick someone from the directory on the right, then press Call.', 'info');
      if (p.id === -1) { call = { id: -1, nick: 'Gubbinz', col: '#3a9a2a', gub: 0 }; say(null, 'Calling Gubbinz...'); setTimeout(() => { say(null, 'Gubbinz accepted the call.'); say('Gubbinz', 'OI. who is dis. how did you get dis number.', '#3a9a2a'); refresh(); }, 1200); return refresh(); }
      if (!window.Net || !Net.connected) return msg('JackMeeting', 'Could not log on to the directory server (ils.jacknet.jnet).\n\nIs the modem connected? Is somebody on the phone?', 'warn');
      call = { id: p.id, nick: p.nick, col: p.col, pending: true };
      Net.relay(p.id, CH, { t: 'ring', nick: String(K.nick()).slice(0, 24) });
      say(null, `Calling ${p.nick}... (they have 30 seconds to answer)`); sfx('join'); refresh();
      call.timer = setTimeout(() => { if (call && call.pending) { say(null, `${p.nick} did not answer. (Maybe they don't have JackMeeting open. Or they're playing Solitaire.)`); call = null; refresh(); } }, 30000);
    }
    function hang(notify) { if (!call) return; if (notify && call.id > 0) Net.relay(call.id, CH, { t: 'bye' }); clearTimeout(call.timer); say(null, `Call with ${call.nick} ended.`); call = null; refresh(); }
    meetApi = (d, m) => {
      if (w.closed) return;
      const nickIn = String(d.nick || m.from || 'Someone').slice(0, 24);
      if (d.t === 'ring') {
        if (call) return Net.relay(m.fromId, CH, { t: 'no', why: 'busy' });
        sfx('join');
        msg('JackMeeting', `Incoming call from ${nickIn}.\n\nAccept the call?`, 'q', [['Accept', () => { call = { id: m.fromId, nick: nickIn, col: m.col || '#000080' }; Net.relay(m.fromId, CH, { t: 'acc', nick: String(K.nick()).slice(0, 24) }); say(null, `You are in a call with ${nickIn}.`); K.secret('meeting'); refresh(); }], ['Ignore', () => Net.relay(m.fromId, CH, { t: 'no', why: 'ignored' })]]);
        return;
      }
      if (!call || m.fromId !== call.id) return;
      if (d.t === 'acc') { call.pending = false; clearTimeout(call.timer); say(null, `${call.nick} accepted the call! Say hello.`); K.secret('meeting'); refresh(); }
      else if (d.t === 'no') { clearTimeout(call.timer); say(null, `${call.nick} ${d.why === 'busy' ? 'is already in a call' : d.why === 'off' ? 'doesn\'t have JackMeeting open' : 'didn\'t accept the call'}.`); call = null; refresh(); }
      else if (d.t === 'chat' && typeof d.text === 'string') say(call.nick, d.text.slice(0, 200), call.col);
      else if (d.t === 'bye') { say(null, `${call.nick} hung up.`); call = null; refresh(); }
    };
    const GUB = ['hello! sorry. i was eating.', 'this video thing is weird. why are you so small?', 'can you see me? i am waving. with my ear.', 'it looks like you are having a video call! would you like help?', 'jack says i can only use this for "emergencies". this is an emergency. i am bored.', 'ok bye. *eats the camera*'];
    on(qs(b, '.jm-send'), 'submit', ev => {
      ev.preventDefault(); const inp = qs(b, '.jm-send input'), t = inp.value.trim(); if (!t) return;
      if (!call || call.pending) { say(null, 'You are not in a call. Pick someone and press Call.'); return; }
      inp.value = ''; say(K.nick(), t);
      if (call.id === -1) { setTimeout(() => { if (!call || call.id !== -1) return; say('Gubbinz', GUB[Math.min(call.gub++, GUB.length - 1)], '#3a9a2a'); if (call.gub >= 2) K.secret('meeting'); if (call.gub >= GUB.length) setTimeout(() => hang(false), 800); }, rnd(600, 1400)); }
      else Net.relay(call.id, CH, { t: 'chat', text: t.slice(0, 200) });
    });
    // fake video: a chunky, noisy 64x48 "webcam" picture of whoever's on the call
    const rv = qs(b, '.jm-vid canvas'), mv = qs(b, '.jm-me canvas'); let raf = 0, fr = 0;
    // a little webcam portrait: bedroom wall, poster, window, the caller (head + shoulders in their colour), blinking + talking
    function face(cv, col, on2, gub) {
      const g = cv.getContext('2d');
      if (!on2) { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 48); }
      else {
        const bob = Math.round(Math.sin(fr / 9) * 1.2), sway = Math.round(Math.sin(fr / 23) * 1.5), hx = 32 + sway, hy = 19 + bob;
        const wall = g.createLinearGradient(0, 0, 0, 48); wall.addColorStop(0, '#6a7aa0'); wall.addColorStop(1, '#2a3450'); g.fillStyle = wall; g.fillRect(0, 0, 64, 48);
        g.fillStyle = '#a8d8ff'; g.fillRect(46, 3, 15, 13); g.fillStyle = '#e8f4ff'; g.fillRect(47, 4, 6, 5); g.fillStyle = '#d8d0c0'; g.fillRect(45, 2, 17, 1); g.fillRect(45, 16, 17, 1); g.fillRect(53, 3, 1, 13); g.fillRect(45, 9, 17, 1);
        g.fillStyle = '#101830'; g.fillRect(3, 4, 12, 16); g.fillStyle = '#ffd400'; g.fillRect(4, 5, 10, 3); g.fillStyle = '#e83a2a'; g.fillRect(6, 10, 6, 6); g.fillStyle = '#fff'; g.fillRect(8, 12, 2, 2);
        g.fillStyle = '#5a3a1a'; g.fillRect(0, 44, 64, 4);
        const skin = gub ? '#5ab84a' : '#f2c79a', shade = gub ? '#2e7a22' : '#d0966a', hair = ['#3a2410', '#7a4a1a', '#e0b050', '#1a1a1a', '#a03a10'][(String(col).charCodeAt(2) || 0) % 5];
        // shoulders + neck
        g.fillStyle = col; g.beginPath(); g.ellipse(hx, 48, 21, 13 - bob, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(hx + 4, 37, 17, 11);
        g.fillStyle = shade; g.fillRect(hx - 3, hy + 10, 7, 7);
        if (gub) { g.fillStyle = skin; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(hx + d * 7, hy - 3); g.lineTo(hx + d * 20, hy - 7); g.lineTo(hx + d * 8, hy + 3); g.fill(); } }
        g.fillStyle = skin; g.beginPath(); g.ellipse(hx, hy, 9, 10.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = shade; g.beginPath(); g.ellipse(hx + 3, hy + 1, 6, 9, 0, -1.2, 1.4); g.fill();
        if (!gub) { g.fillStyle = hair; g.beginPath(); g.ellipse(hx, hy - 6, 10, 6, 0, Math.PI, 0); g.fill(); g.fillRect(hx - 10, hy - 6, 3, 6); g.fillRect(hx + 7, hy - 6, 3, 4); g.fillRect(hx - 7, hy - 7, 12, 3); }
        const blink = fr % 70 < 3;
        g.fillStyle = gub ? '#fff8c0' : '#fff'; if (!blink) { g.fillRect(hx - 6, hy - 1, 4, 3); g.fillRect(hx + 2, hy - 1, 4, 3); }
        g.fillStyle = '#101010'; if (blink) { g.fillRect(hx - 6, hy + 1, 4, 1); g.fillRect(hx + 2, hy + 1, 4, 1); } else { g.fillRect(hx - 4, hy, 2, 2); g.fillRect(hx + 3, hy, 2, 2); }
        g.fillRect(hx - 6, hy - 3, 4, 1); g.fillRect(hx + 2, hy - 3, 4, 1);
        g.fillStyle = shade; g.fillRect(hx, hy + 3, 2, 2);
        const talk = (fr >> 3) % 3; g.fillStyle = '#6a1a10'; g.fillRect(hx - 3, hy + 6, 7, talk === 0 ? 3 : 1); if (gub && talk === 0) { g.fillStyle = '#fff'; g.fillRect(hx - 2, hy + 6, 1, 1); g.fillRect(hx + 2, hy + 6, 1, 1); }
        const vg = g.createRadialGradient(32, 24, 14, 32, 24, 40); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, 64, 48);
      }
      const id = g.getImageData(0, 0, 64, 48); for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - 0.5) * (on2 ? 34 : 90); id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } g.putImageData(id, 0, 0);
    }
    function loop() { if (w.closed) return; fr++; if (fr % 4 === 0) { face(rv, call ? call.col : '#000', call && !call.pending, call && call.id === -1); face(mv, (window.Net && Net.me && Net.me.col) || '#000080', true, false); qs(b, '.fps').textContent = call && !call.pending ? `${rnd(3, 7)} fps` : ''; } raf = requestAnimationFrame(loop); }
    loop();
    A.menubar(w, [
      ['Call', () => [{ label: 'New Call...', dis: !!call, act: place }, { label: 'Hang Up', dis: !call, act: () => hang(true) }, '-', { label: 'Log On to ils.jacknet.jnet', act: refresh }, '-', { label: 'Exit', act: w.close }]],
      ['View', [{ label: 'Directory', act: refresh }]],
      ['Tools', [{ label: 'Video', sub: [{ label: 'Send', chk: true }, { label: 'Receive', chk: true }, { label: 'Detect camera', act: () => msg('Video', 'No video capture device found.\n\nJackMeeting will draw you instead. (It has done its best.)', 'info') }] }, { label: 'Whiteboard', act: () => msg('Whiteboard', 'The whiteboard is in the other building. (Try the messenger programs.)', 'info') }, { label: 'File Transfer...', act: () => msg('File Transfer', 'Sending files over a 56K modem while on a video call? Bold. Very bold. No.', 'info') }]],
      ['Help', [{ label: 'About JackMeeting', act: () => msg('About JackMeeting', 'JackMeeting 2.1\n\nTalk to other people on JackOS. With (sort of) video. Over a (sort of) phone line.\n\nOpen JackMeeting, pick someone from the directory and press Call. They need JackMeeting open too.', 'info') }]],
    ]);
    say(null, 'Welcome to JackMeeting. Pick someone from the directory and press Call. (Gubbinz always picks up.)');
    refresh();
    return w;
  }

  K.apps.clock = () => openClock();
  K.apps.magnify = () => openMagnifier();
  K.apps.imaging = arg => openImaging(arg);
  K.apps.packager = arg => openPackager(arg);
  K.apps.progman = () => openProgman();
  K.apps.winfile = () => openWinfile();
  K.apps.fax = arg => openFax(arg);
  K.apps.meeting = () => openMeeting();
})();
