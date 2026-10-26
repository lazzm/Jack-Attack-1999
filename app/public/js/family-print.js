/* The family's dot-matrix printer (a RattleTek DM-9, 9 pins, bought in 1991, LOUD). Takes the text of a web page or a
 * document, renders it onto a canvas as a real 1999 continuous-stationery printout (tractor-feed holes, perforations, faint
 * green-bar stripes, wonky lines, a worn ribbon) and lets the visitor save it as a PNG. Loaded by js/family.js. */
(function () {
  const F = window.Family, A = window.Apps; if (!F || !A) return;
  const esc = A.esc, pad2 = n => String(n).padStart(2, '0');
  const COLS = 80, PER_PAGE = 60, MAX_PAGES = 4;
  const S = 1.5; // dot spacing (px per low-res pixel)
  const CW = 7, CH = 14; // low-res character cell
  const TEXT_W = COLS * CW * S, STRIP = 46, MARGIN = 34, PW = Math.round(TEXT_W + 2 * (STRIP + MARGIN)), LH = CH * S, PAGE_H = Math.round(66 * LH);

  // ================================================================ text in
  function wrapLine(l) { const out = []; l = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\t/g, '    ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/[^\x20-\x7e£]/g, ' ').replace(/\s+$/, ''); if (!l) return ['']; while (l.length > COLS) { let cut = l.lastIndexOf(' ', COLS); if (cut < 20) cut = COLS; out.push(l.slice(0, cut)); l = l.slice(cut).replace(/^ /, ''); } out.push(l); return out; }
  function linesOf(o) {
    let raw = '';
    const heads = new Set();
    if (o.el) {
      try { o.el.querySelectorAll('h1,h2,h3,.tagline,.ptitle,th,b.big').forEach(h => { const t = (h.innerText || '').trim(); if (t && t.length < 70) heads.add(t.toUpperCase()); }); } catch (e) {}
      raw = (o.el.innerText || o.el.textContent || '').trim();
      if (!raw) raw = '(This page is blank. Or it is a picture. The DM-9 cannot print pictures. It is a 9-pin printer from 1991.)';
    } else raw = String(o.text || '').replace(/\{[^|{}]*\|([^{}]*)\}/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\/\/(.+?)\/\//g, '$1');
    let out = [];
    raw.split(/\r?\n/).forEach(l => { const w = wrapLine(l); out.push(...w.map(x => ({ t: x, b: heads.has(x.trim().toUpperCase()) }))); });
    // no more than one blank line in a row
    out = out.filter((l, i) => l.t.trim() || (i > 0 && out[i - 1].t.trim()));
    return out;
  }

  // ================================================================ the printout (canvas)
  let glyphCanvas = null;
  function rasterLine(s) { // text -> on/off bitmap, thresholded like a 9-pin head would print it
    const w = Math.max(1, s.length * CW), cv = glyphCanvas || (glyphCanvas = document.createElement('canvas'));
    cv.width = COLS * CW + 8; cv.height = CH;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#000'; g.textBaseline = 'top';
    g.font = '11.5px "Courier New",Courier,"Liberation Mono","DejaVu Sans Mono",monospace';
    for (let i = 0; i < s.length; i++) g.fillText(s[i], i * CW, 1);
    const d = g.getImageData(0, 0, w, CH).data, bits = [];
    for (let y = 0; y < CH; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 80) bits.push(x, y);
    return bits;
  }
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function render(job) {
    const lines = job.lines, chunks = [];
    for (let i = 0, p = 0; i < lines.length || p === 0; p++) { const cap = p === 0 ? PER_PAGE - 4 : PER_PAGE - 1; chunks.push(lines.slice(i, i + cap)); i += cap; }
    const pages = chunks.length, H = pages * PAGE_H;
    const cv = document.createElement('canvas'); cv.width = PW; cv.height = H;
    const g = cv.getContext('2d'), R = rng(job.seed);
    // paper, with faint green-bar stripes
    g.fillStyle = '#fdfdf8'; g.fillRect(0, 0, PW, H);
    const top0 = 3 * LH;
    for (let p = 0; p < pages; p++) for (let i = 0; i < 66; i += 6) { g.fillStyle = 'rgba(160,210,160,.16)'; g.fillRect(STRIP, p * PAGE_H + i * LH, PW - 2 * STRIP, 3 * LH); }
    // the tractor strips: holes + perforations down both sides
    const holeGap = PAGE_H / 22;
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.setLineDash([3, 3]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(STRIP + 0.5, 0); g.lineTo(STRIP + 0.5, H); g.moveTo(PW - STRIP - 0.5, 0); g.lineTo(PW - STRIP - 0.5, H); g.stroke();
    g.setLineDash([]);
    for (let y = holeGap / 2; y < H; y += holeGap) for (const x of [STRIP / 2, PW - STRIP / 2]) {
      g.fillStyle = '#5a5a5a'; g.beginPath(); g.arc(x, y, 6.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x, y, 6.5, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 3, 0, Math.PI * 2); g.fill();
    }
    // perforations between pages
    for (let p = 1; p < pages; p++) { const y = p * PAGE_H; g.strokeStyle = 'rgba(0,0,0,.3)'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(PW, y + 0.5); g.stroke(); g.setLineDash([]); }
    // ink: one line at a time, each a bit wonky
    const head = [
      { t: '** PRINTED ON THE FAMILY PC **'.padEnd(COLS - 16) + job.when, b: true },
      { t: (job.doc.length > COLS - 22 ? job.doc.slice(0, COLS - 25) + '...' : job.doc).padEnd(COLS - 22) + ('Printed by: ' + job.owner).slice(0, 22).padStart(22), b: false },
      { t: '='.repeat(COLS), b: false },
    ];
    job.rowY = [];
    let idx = 0;
    for (let p = 0; p < pages; p++) {
      const body = chunks[p];
      const rows = (p === 0 ? head.concat([{ t: '' }]) : [{ t: `${job.doc.slice(0, 50)} (continued)`.padEnd(COLS - 8) + `page ${p + 1}`, b: false }]).concat(body);
      rows.forEach((row, r) => {
        const y = p * PAGE_H + top0 + r * LH + (R() < 0.08 ? (R() - 0.5) * 2.4 : 0);
        const x0 = STRIP + MARGIN + (R() - 0.5) * 3.2 + (R() < 0.05 ? 3 : 0);
        const fade = 0.62 + 0.3 * Math.sin((idx + job.seed % 50) / 9) + (R() - 0.5) * 0.1;
        drawRow(g, row.t, x0, y, Math.max(0.35, Math.min(0.95, fade)), row.b, R);
        job.rowY.push(y + LH);
        idx++;
      });
      // page number in the footer
      drawRow(g, `- ${p + 1} -`.padStart(COLS / 2 + 3), STRIP + MARGIN, p * PAGE_H + top0 + 62 * LH, 0.55, false, R);
    }
    job.pagesUsed = pages;
    // the jam: a crumpled, smudged bit where the paper bunched up
    if (job.jamAt != null && job.rowY[job.jamAt]) {
      const y = job.rowY[job.jamAt] - LH;
      g.save(); g.globalAlpha = 0.55; g.strokeStyle = '#333'; g.lineWidth = 1;
      for (let i = 0; i < 14; i++) { g.beginPath(); let x = STRIP + 10; g.moveTo(x, y + R() * 26); while (x < PW - STRIP - 10) { x += 18 + R() * 30; g.lineTo(x, y + R() * 26); } g.stroke(); }
      g.fillStyle = 'rgba(20,20,30,.18)'; g.fillRect(STRIP + MARGIN, y + 2, TEXT_W, 20);
      g.restore();
      g.save(); g.fillStyle = '#c00000'; g.font = 'bold 15px "Comic Sans MS","Comic Neue",cursive'; g.translate(PW - STRIP - 230, y + 14); g.rotate(-0.06); g.fillText('(paper jam! sorry - J)', 0, 0); g.restore();
    }
    // torn off along the perforations, top and bottom (a bit ragged)
    g.save(); g.globalCompositeOperation = 'destination-out';
    for (const [y0, dir] of [[0, 1], [H, -1]]) { g.beginPath(); g.moveTo(0, y0); for (let x = 0; x <= PW; x += 6) g.lineTo(x, y0 + dir * (1 + R() * 3.5)); g.lineTo(PW, y0); g.closePath(); g.fill(); }
    g.restore();
    return cv;
  }
  function drawRow(g, s, x0, y, alpha, bold, R) {
    if (!s || !s.trim()) return;
    const bits = rasterLine(s);
    g.fillStyle = `rgba(28,28,40,${alpha.toFixed(3)})`;
    const dot = (x, y2) => { g.beginPath(); g.arc(x, y2, 0.82, 0, 6.2832); g.fill(); };
    for (let i = 0; i < bits.length; i += 2) {
      const bx = bits[i], by = bits[i + 1];
      if (R() < 0.035) continue; // a sticky pin
      const x = x0 + bx * S, yy = y + by * S;
      dot(x, yy);
      if (bold) dot(x + 0.6, yy);
    }
  }

  // ================================================================ sound: zzzzt-zzzzt
  let actx = null, master = null;
  function ac() {
    if (!window.Sound || !Sound.on || !Sound.ready) return null;
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); master = actx.createGain(); master.gain.value = 0.22; master.connect(Sound.output(actx)); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  let noiseBuf = null;
  function zzzt(chars) {
    const c = ac(); if (!c) return;
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = c.currentTime, dur = Math.max(0.05, Math.min(0.42, chars * 0.0055));
    const src = c.createBufferSource(); src.buffer = noiseBuf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.4;
    const am = c.createGain(); am.gain.value = 0;
    const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 110 + Math.random() * 30;
    const lfoG = c.createGain(); lfoG.gain.value = 0.5; lfo.connect(lfoG); lfoG.connect(am.gain);
    const env = c.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(0.9, t + 0.01); env.gain.setValueAtTime(0.9, t + dur - 0.02); env.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(am); am.connect(env); env.connect(master);
    src.start(t, Math.random() * 0.5, dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    // carriage return clunk + line feed tick
    const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(140, t + dur); o.frequency.exponentialRampToValueAtTime(60, t + dur + 0.06);
    og.gain.setValueAtTime(0.5, t + dur); og.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.08); o.connect(og); og.connect(master); o.start(t + dur); o.stop(t + dur + 0.1);
  }
  function feed(sec) { // paper feeding: a grinding whirr
    const c = ac(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + sec);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.05); g.gain.setValueAtTime(0.18, t + sec - 0.05); g.gain.linearRampToValueAtTime(0.0001, t + sec);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + sec + 0.02);
  }

  // ================================================================ the print queue window (Printers folder style)
  const JOBS = [];
  let Q = null, seq = 1, paper = 40, force = null;
  const css = document.createElement('style');
  css.textContent = `.dm-q{display:flex;flex-direction:column;gap:6px;height:100%}
.dm-top{display:flex;gap:8px;align-items:stretch}
.dm-prev{flex:none;width:150px;height:118px;background:#808080;border:2px inset #fff;display:block;image-rendering:auto}
.dm-info{flex:1;min-width:0;font:11px Tahoma,sans-serif;display:flex;flex-direction:column;gap:3px}
.dm-lcd{font:bold 12px "Courier New",monospace;background:#2a3a1a;color:#9fe060;padding:3px 6px;border:2px inset #fff;white-space:pre}
.dm-list{flex:1;min-height:86px;overflow:auto;background:#fff;border:2px inset #fff;font:11px Tahoma,sans-serif}
.dm-list table{border-collapse:collapse;width:100%;min-width:430px}.dm-list th{background:#c0c0c0;border:1px outset #fff;font-weight:normal;text-align:left;padding:1px 4px;white-space:nowrap}
.dm-list td{padding:1px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}.dm-list tr.sel td{background:#000080;color:#fff}
.dm-done{display:none;align-items:center;gap:6px;flex-wrap:wrap;padding:4px;border:1px solid #808080;background:#ffffe1;font:11px Tahoma,sans-serif}.dm-done.on{display:flex}
.dm-view{overflow:auto;background:#808080;height:100%;text-align:center;padding:8px}.dm-view img{max-width:100%;box-shadow:3px 3px 6px rgba(0,0,0,.5)}`;
  document.head.appendChild(css);

  function queue() {
    if (Q && !Q.w.closed) { Q.w.restore(); return Q.w; }
    const b = document.createElement('div'); b.className = 'dm-q';
    b.innerHTML = `<div class="dm-top"><canvas class="dm-prev" width="300" height="236"></canvas><div class="dm-info"><b>RattleTek DM-9 (9-pin dot matrix)</b><span>Port: LPT1: (the big plug)</span><span>Paper: continuous, <span class="dm-paper"></span> sheets left</span><div class="dm-lcd">READY</div><span class="small">Bought in 1991. Louder than the vacuum.</span></div></div>
      <div class="dm-list"><table><thead><tr><th>Document Name</th><th>Status</th><th>Owner</th><th>Progress</th><th>Started At</th></tr></thead><tbody></tbody></table></div>
      <div class="dm-done"><span class="dm-dtxt"></span><button type="button" class="btn dm-save">Save printout...</button><button type="button" class="btn dm-show">View</button></div>`;
    const w = A.win('Family Dot Matrix (RattleTek DM-9)', b, { w: 520, h: 380, menubar: true, status: true, icon: F.icons.PRN32, minW: 300, minH: 300 });
    Q = { w, b, prev: b.querySelector('.dm-prev'), lcd: b.querySelector('.dm-lcd'), tbody: b.querySelector('tbody'), done: b.querySelector('.dm-done') };
    A.menubar(w, [
      ['Printer', () => [{ label: 'Pause Printing', chk: !!Q.paused, act: () => { Q.paused = !Q.paused; refresh(); if (!Q.paused) run(); } }, { label: 'Purge Print Documents', act: () => { JOBS.splice(0).forEach(j => { j.cancelled = true; }); refresh(); } }, '-', { label: 'Load Paper', act: () => loadPaper() }, { label: 'Print Test Page', act: () => print('Test Page', { text: testPage(), owner: 'JackOS' }) }, '-', { label: 'Close', act: w.close }]],
      ['Document', () => [{ label: 'Cancel Printing', dis: !JOBS.length, act: () => { const j = JOBS[0]; if (j) { j.cancelled = true; } } }]],
      ['Help', [{ label: 'About the DM-9', act: () => Desk.msgbox('RattleTek DM-9', 'RattleTek DM-9, 9-pin dot matrix.\nSpeed: 180 characters per second (on a good day).\nNoise: yes.\n\nDad bought it in 1991 for "the accounts". It has printed: 4 years of accounts, 1 CV, 300 Gork pictures (in grey dots), every one of ' + Cast.n('sister') + '\'s school projects, and a banner that said HAPPY BIRTHDAY that went all the way down the stairs.', 'info') }]],
    ]);
    b.querySelector('.dm-save').addEventListener('click', () => { const j = Q.last; if (j) download(j); });
    b.querySelector('.dm-show').addEventListener('click', () => { const j = Q.last; if (j) viewer(j); });
    refresh(); drawPrev(null);
    return w;
  }
  function refresh() {
    if (!Q || Q.w.closed) return;
    b$('.dm-paper').textContent = paper;
    Q.tbody.innerHTML = JOBS.map((j, i) => `<tr class="${i === 0 ? 'sel' : ''}"><td>${esc(j.doc)}</td><td>${esc(Q.paused ? 'Paused' : j.status)}</td><td>${esc(j.owner)}</td><td>${j.done} of ${j.rowY ? j.rowY.length : j.lines.length + 4} lines</td><td>${esc(j.started)}</td></tr>`).join('');
    Q.w.status.textContent = `${JOBS.length} document(s) in queue`;
  }
  const b$ = s => Q.b.querySelector(s);
  function lcd(s) { if (Q && !Q.w.closed) Q.lcd.textContent = s; }
  function drawPrev(j) {
    if (!Q || Q.w.closed) return;
    const g = Q.prev.getContext('2d'), W = Q.prev.width, H = Q.prev.height;
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, W, H);
    // the paper coming out of the top of the printer
    if (j && j.canvas) {
      const yEnd = j.done ? j.rowY[Math.min(j.done, j.rowY.length) - 1] + 6 : 40;
      const sc = (W - 40) / j.canvas.width, showH = (H - 90) / sc, y0 = Math.max(0, yEnd - showH);
      g.drawImage(j.canvas, 0, y0, j.canvas.width, yEnd - y0, 20, H - 90 - (yEnd - y0) * sc, W - 40, (yEnd - y0) * sc);
    }
    // printer body
    g.fillStyle = '#e8dcc0'; g.fillRect(8, H - 92, W - 16, 84); g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(8, H - 92, W - 16, 84);
    g.fillStyle = '#333'; g.fillRect(24, H - 92, W - 48, 10);
    const hx = j && JOBS[0] === j && !Q.paused ? 30 + (Math.sin(Date.now() / 90) * 0.5 + 0.5) * (W - 90) : 30;
    g.fillStyle = '#555'; g.fillRect(hx, H - 96, 30, 16);
    g.fillStyle = '#5a5242'; g.font = 'bold 15px Arial,sans-serif'; g.fillText('RattleTek DM-9', 20, H - 40);
    g.fillStyle = JOBS.length ? '#2a9a2a' : '#555'; g.beginPath(); g.arc(W - 32, H - 46, 6, 0, 7); g.fill();
    g.fillStyle = paper > 0 ? '#555' : '#e10600'; g.beginPath(); g.arc(W - 52, H - 46, 6, 0, 7); g.fill();
  }

  // ================================================================ printing
  function testPage() {
    let s = 'JACKOS 98 PRINTER TEST PAGE\n\nCongratulations! If you can read this, your RattleTek DM-9 is installed correctly on LPT1:.\n\n';
    for (let i = 0; i < 6; i++) s += ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ '.slice(i * 3, i * 3 + 78) + '\n';
    return s + '\nDriver: DM9.DRV (16-bit, from a floppy in the loft)\nThe quick brown fox jumps over the lazy dog.\n';
  }
  function print(doc, o) {
    o = o || {};
    const now = new Date(), t = F.today();
    let lines = linesOf(o);
    const max = MAX_PAGES * PER_PAGE - 6;
    if (lines.length > max) { lines = lines.slice(0, max - 2).concat([{ t: '' }, { t: '-- the rest of this got eaten by the printer (it does that) --', b: true }]); }
    if (o.url) lines.unshift({ t: o.url.slice(0, COLS) }, { t: '' });
    const r = Math.random();
    const j = { id: seq++, doc: String(doc || 'Untitled'), owner: String(o.owner || Cast.me().first).slice(0, 20), lines, done: 0, status: 'Spooling', started: `${now.getHours()}:${pad2(now.getMinutes())} ${pad2(t.d)}/${pad2(t.m)}/1999`, when: `${pad2(t.d)}/${pad2(t.m)}/99 ${pad2(now.getHours())}:${pad2(now.getMinutes())}`, seed: (Math.random() * 1e9) | 0 };
    // now and then: a paper jam part-way down, or the paper runs out at a page break
    const ev = force || (r < 0.16 ? 'jam' : r < 0.28 ? 'paper' : null); force = null;
    if (ev === 'jam') j.jamAt = 5 + Math.floor(Math.random() * Math.max(1, Math.min(lines.length, 50) - 5));
    if (ev === 'paper') j.paperOut = true;
    JOBS.push(j);
    queue(); refresh();
    Desk.toast('Family Dot Matrix', `Printing "${j.doc}"... (cover your ears)`, 3000);
    setTimeout(() => { j.canvas = render(j); j.status = 'Printing'; refresh(); feed(0.4); run(); }, 700);
    return j;
  }
  let busy = false;
  function run() {
    if (busy || !Q || Q.w.closed) { busy = false; return; }
    const j = JOBS[0]; if (!j) { lcd('READY'); drawPrev(Q.last || null); return; }
    if (j.cancelled) { JOBS.shift(); refresh(); return run(); }
    if (Q.paused || !j.canvas) return;
    if (paper <= 0 || (j.paperOut && j.done >= Math.min(30, j.rowY.length - 2))) { if (j.paperOut) { j.paperOut = false; paper = 0; } return outOfPaper(j); }
    busy = true; j.status = 'Printing'; lcd('PRINTING\nLINE ' + (j.done + 1));
    const row = j.lines[Math.max(0, j.done - 4)] || { t: '' };
    zzzt(Math.max(6, row.t.length));
    const step = 30 + Math.min(140, row.t.length * 1.6);
    setTimeout(() => {
      busy = false;
      if (!JOBS.includes(j) || j.cancelled) { JOBS.splice(JOBS.indexOf(j), 1); refresh(); return run(); }
      j.done++;
      if (j.jamAt != null && j.done === j.jamAt + 1 && !j.jammed) { j.jammed = true; drawPrev(j); refresh(); return jam(j); }
      if (j.done % PER_PAGE === 0) { paper = Math.max(0, paper - 1); feed(0.3); }
      drawPrev(j); refresh();
      if (j.done >= j.rowY.length) return finish(j);
      run();
    }, step);
  }
  function jam(j) {
    j.status = 'Error - Paper jam'; refresh(); lcd('PAPER JAM\nOPEN COVER');
    Sound.play('uhoh');
    Desk.msgbox('Family Dot Matrix - Paper Jam', 'There was an error writing to LPT1: for the printer (RattleTek DM-9):\n\nPAPER JAM.\n\nThe paper has bunched up round the roller and is making a noise like an angry wasp. Gently pull it straight, then click Retry.\n\n(Don\'t let Dad see. He\'ll say "what have you done to it".)', 'warn', [['Retry', () => { A.secret('fam.jam'); Sound.play('boing'); j.status = 'Printing'; refresh(); run(); }], ['Cancel', () => { j.cancelled = true; JOBS.splice(JOBS.indexOf(j), 1); refresh(); lcd('READY'); run(); }]]);
  }
  function outOfPaper(j) {
    j.status = 'Error - Out of paper'; refresh(); lcd('PAPER OUT'); drawPrev(j);
    Desk.msgbox('Family Dot Matrix - Out of Paper', 'The printer is out of paper.\n\nFeed a new box of continuous paper into the tractor at the back (line the holes up with the little pins). Mom keeps the paper in the drawer under the phone.', 'warn', [['Load paper', () => { loadPaper(); run(); }], ['Cancel', () => { j.cancelled = true; JOBS.splice(JOBS.indexOf(j), 1); refresh(); lcd('READY'); }]]);
  }
  function loadPaper() { paper = 40; feed(0.8); Sound.play('turn'); Desk.toast('Family Dot Matrix', 'Loaded a fresh box of continuous paper. The holes are lined up. Mostly.', 3500); if (Q) refresh(); drawPrev(JOBS[0] || null); }
  function finish(j) {
    JOBS.splice(JOBS.indexOf(j), 1); j.status = 'Printed'; Q.last = j; feed(0.6); Sound.play('thud');
    lcd('READY'); refresh(); drawPrev(j);
    Q.done.classList.add('on'); Q.done.querySelector('.dm-dtxt').textContent = `"${j.doc}" printed (${j.pagesUsed} page${j.pagesUsed > 1 ? 's' : ''}). Tear it off along the perforations:`;
    Desk.toast('Family Dot Matrix', `"${j.doc}" has finished printing. Save the printout from the printer window!`, 5000);
    if (JOBS.length) setTimeout(run, 600);
  }
  const fileName = j => 'printout - ' + j.doc.replace(/\.[a-z0-9]+$/i, '').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 40) + '.png';
  function download(j) {
    A.secret('fam.printout');
    const go = url => { const a = document.createElement('a'); a.href = url; a.download = fileName(j); document.body.appendChild(a); a.click(); a.remove(); };
    if (j.canvas.toBlob) j.canvas.toBlob(bl => { if (!bl) return go(j.canvas.toDataURL('image/png')); const u = URL.createObjectURL(bl); go(u); setTimeout(() => URL.revokeObjectURL(u), 30000); }, 'image/png');
    else go(j.canvas.toDataURL('image/png'));
  }
  function viewer(j) {
    const b = document.createElement('div'); b.className = 'dm-view';
    const img = new Image(); img.alt = 'Dot-matrix printout of ' + j.doc; img.src = j.canvas.toDataURL('image/png'); b.appendChild(img);
    const w = A.win(fileName(j) + ' - Printout', b, { w: 640, h: 520, menubar: true, icon: F.icons.PRN32 });
    A.menubar(w, [['File', [{ label: 'Save As...', act: () => download(j) }, '-', { label: 'Close', act: w.close }]]]);
    return w;
  }
  setInterval(() => { if (Q && !Q.w.closed && JOBS.length && !Q.paused) drawPrev(JOBS[0]); }, 120);

  window.FamilyPrint = { print, queue, render, linesOf, download, viewer, set force(v) { force = v; }, get jobs() { return JOBS; }, get last() { return Q && Q.last; } };
})();
