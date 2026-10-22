/* dos-progs: the DOS programs that aren't COMMAND.COM: EDIT (the blue MS-DOS Editor), GC (Jack Commander, a
 * two-pane file manager), the ANSI viewer, DEFRAG, SCANDISK, FDISK, MSD, DEBUG, the MATRIX rain, a DOS
 * screensaver and a very fake virus. Loaded lazily by the shell the first time one of them runs. */
(function () {
  'use strict';
  const DOS = window.DOS, K = DOS.core, A = window.Apps, U = DOS.shellUtil;
  const P = DOS.progs;
  const S = id => { try { return A.secret('dos.' + id); } catch (e) { return false; } };
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const lpad = (s, n) => String(s).padStart(n).slice(-n);
  const sleep = (host, ms) => host.sleep(ms);
  const todayStr = () => { const t = Desk.today99(); return `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99`; };
  const screenProg = DOS.screenProg;

  // ================================================================ file helpers (which files does a program see?)
  function listFiles(sh, dirArg, filt) {
    const r = sh.resolve(dirArg || '.', { dirOnly: true });
    if (r.err || !r.node) return null;
    const dir = r.node, sn = U.shortNames(dir);
    const kids = (dir.kids || []).filter(k => !k.hidden || sh.showHidden).sort((a, b) => (b.type === 'dir') - (a.type === 'dir') || sn.get(a).localeCompare(sn.get(b)));
    return { r, dir, items: kids.filter(k => k.type === 'dir' || !filt || filt(k)), sn };
  }
  async function saveText(sh, name, text) {
    const r = sh.resolve(name);
    if (r.err) return r.err === 'notready' ? 'Drive not ready' : r.err;
    if (r.isDir) return 'That is a directory';
    return sh.writeFile(r, text) || '';
  }

  // ================================================================ EDIT: the MS-DOS Editor
  P.edit = (sh, args) => screenProg(sh, async (host, s) => {
    const K2 = K, Ed = new K.Editor('');
    const [sw, rest] = sh.switches(sh.args(args || ''));
    let name = '', node = null, readOnly = !!sw.R, lastFind = '', matchCase = false, dirty = () => Ed.dirty;
    const BG = 0x17, SEL = 0x71, MENU = 0x70, STAT = 0x30, FRAME = 0x17;
    const W = () => s.cols, H = () => s.rows;
    const title = () => (name ? name.toUpperCase() : 'Untitled');
    async function loadFile(n) {
      const r = sh.resolve(n);
      if (r.err || r.isDir) return r.err === 'notready' ? 'Drive not ready' : 'Path not found: ' + n;
      if (!r.node) { // a new file
        if (!/^[^\\/:*?"<>|]{1,60}$/.test(r.name || '')) return 'Invalid file name';
        node = null; name = n; Ed.setText(''); return '';
      }
      if (!U.isText(r.node)) return 'The file ' + r.node.name + ' is not a text file.';
      if (String(r.node.text || '').length > 65535) return 'File too large to fit in memory';
      node = r.node; name = r.node.name; Ed.setText(String(r.node.text || '')); return '';
    }
    if (rest[0]) { const e = await loadFile(rest[0]); if (e) await K.msgBox(host, e, ['OK']); }
    // unsaved text is autosaved (js/gamesave.js, one for the Editor): EDIT on its own (or EDIT that file) brings it back
    const sv = A.gameSaver ? A.gameSaver('dos.edit', () => Ed.dirty && !readOnly ? { text: Ed.text().slice(0, 65535), name, r: Ed.r, c: Ed.c } : null, { v: 1, delay: 500 }) : null;
    let svOn = false;
    const kept = sv && sv.load();
    if (kept && typeof kept.text === 'string' && !readOnly && (!rest[0] || String(kept.name || '').toLowerCase() === name.toLowerCase())) {
      if (kept.name && !rest[0]) { const r0 = sh.resolve(kept.name); node = r0 && !r0.err && r0.node && U.isText(r0.node) ? r0.node : null; }
      name = kept.name || ''; Ed.setText(kept.text); Ed.r = Math.min(Ed.lines.length - 1, +kept.r || 0); Ed.c = Math.min(Ed.lines[Ed.r].length, +kept.c || 0); Ed.dirty = true; svOn = true;
    }
    const menus = () => [
      { label: '&File', items: [{ label: '&New', act: 'new' }, { label: '&Open...', act: 'open' }, { label: '&Save', act: 'save' }, { label: 'Save &As...', act: 'saveas' }, '-', { label: '&Print...', act: 'print' }, '-', { label: 'E&xit', act: 'exit' }] },
      { label: '&Edit', items: [{ label: 'Cu&t', key: 'Shift+Del', act: 'cut', dis: !Ed.selText() }, { label: '&Copy', key: 'Ctrl+Ins', act: 'copy', dis: !Ed.selText() }, { label: '&Paste', key: 'Shift+Ins', act: 'paste', dis: !Ed.clip }, { label: 'Cl&ear', key: 'Del', act: 'clear', dis: !Ed.selText() }, '-', { label: 'Select &All', act: 'all' }] },
      { label: '&Search', items: [{ label: '&Find...', act: 'find' }, { label: '&Repeat Last Find', key: 'F3', act: 'again' }, { label: '&Change...', act: 'change' }] },
      { label: '&Options', items: [{ label: '&Display...', act: 'display' }, { label: '&Help Path...', act: 'helppath' }] },
      { label: '&Help', items: [{ label: '&Commands...', act: 'help' }, { label: '&About...', act: 'about' }] },
    ];
    function draw() {
      if (sv) { if (Ed.dirty) svOn = true; if (svOn) sv.save(); }
      s.fill(0, 0, W(), 1, ' ', MENU);
      let x = 2; for (const m of menus()) { K.drawHot(s, x, 0, m.label, MENU, 0x7f); x += K.plain(m.label).length + 2; }
      s.fill(0, 1, W(), H() - 2, ' ', BG);
      s.box(0, 1, W(), H() - 2, FRAME, false);
      const t = ' ' + title() + (readOnly ? ' (read only)' : '') + ' '; s.print(Math.floor((W() - t.length) / 2), 1, t, 0x71);
      Ed.draw(s, 1, 2, W() - 3, H() - 5, BG, SEL);
      K.vbar(s, W() - 1, 2, H() - 5, Ed.r, Math.max(1, Ed.lines.length - 1), 0x70);
      K.hbar(s, 1, H() - 2, W() - 3, Ed.left, 200, 0x70);
      s.set(0, H() - 2, '\u2514', FRAME); s.set(W() - 1, H() - 2, '\u2518', FRAME);
      s.fill(0, H() - 1, W(), 1, ' ', STAT);
      const st = W() >= 80 ? ' F1=Help  Alt=Menu  F3=Find next  Ctrl+S=Save  Esc=Menu off' : ' F1=Help Alt=Menu F3=Find';
      s.print(0, H() - 1, st, STAT);
      const pos = `${dirty() ? '*' : ' '}  ${lpad(Ed.r + 1, 5)}:${String(Ed.c + 1).padStart(3, '0')} `;
      s.print(W() - pos.length - 1, H() - 1, pos, STAT);
      s.set(W() - pos.length - 3, H() - 1, Ed.ins ? ' ' : 'O', STAT);
      s.cur.on = true;
    }
    async function doSave(as) {
      let target = name;
      if (as || !name || (node && !(node.dos || node.user))) {
        const r = await K.form(host, 'Save As', [{ type: 'text', label: 'File &Name:', value: node && !(node.dos || node.user) ? 'COPY OF ' + name.toUpperCase().slice(0, 50) : name, max: 70, focus: true }, { type: 'label', text: 'Directory: ' + sh.pathStr(), rows: 1 }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 56 });
        if (!r || r.btn !== 'OK' || !r.values[0].trim()) return false;
        target = r.values[0].trim();
        if (node && !(node.dos || node.user) && target.toLowerCase() === name.toLowerCase()) { await K.msgBox(host, 'Access denied. That\'s one of Jack\'s files (he\'s touchy). Pick another name.', ['OK']); return false; }
      }
      const e = await saveText(sh, target, Ed.text());
      if (e) { await K.msgBox(host, e, ['OK']); return false; }
      const r = sh.resolve(target); node = r.node; name = node ? node.name : target; Ed.dirty = false; S('edit.save');
      return true;
    }
    async function confirmLose() {
      if (!dirty()) return true;
      const r = await K.msgBox(host, 'Loaded file is not saved. Save it now?', ['&Yes', '&No', '&Cancel'], { title: '' });
      if (r === 0) return doSave(false); return r === 1;
    }
    async function act(a) {
      if (!a) return true;
      if (a === 'exit') { if (await confirmLose()) return false; return true; }
      if (a === 'new') { if (await confirmLose()) { Ed.setText(''); name = ''; node = null; } return true; }
      if (a === 'open') {
        if (!await confirmLose()) return true;
        let dirArg = '.';
        for (;;) {
          const L = listFiles(sh, dirArg, k => U.isText(k) || /\.(txt|bat|bas|ini|ans|log|htm|doc)$/i.test(k.name));
          if (!L) { await K.msgBox(host, 'Path not found', ['OK']); return true; }
          const items = L.items.map(k => k.type === 'dir' ? '[' + L.sn.get(k) + ']' : L.sn.get(k) + '   ' + k.name.slice(0, 20));
          items.push('[..]');
          const r = await K.form(host, 'Open', [{ type: 'text', label: 'File &Name:', value: '*.*', max: 70, focus: true }, { type: 'label', text: sh.pathStr(L.r.dr, L.r.dirs), rows: 1 }, { type: 'list', label: '&Files', items, h: Math.min(10, Math.max(3, s.rows - 14)) }, { type: 'btns', items: ['OK', 'Cancel', 'Help'] }], { w: Math.min(s.cols - 2, 62), onListEnter: async () => 'ok', onTextEnter: async c => (c.value === '*.*' || /[*?]/.test(c.value)) ? 'list' : 'ok' });
          if (!r || r.btn !== 'OK') return true;
          if (r.btn === 'OK' && r.values[0] && r.values[0] !== '*.*' && !/[*?]/.test(r.values[0]) && (!r.values[2] || r.values[2] !== items[r.values.length ? 0 : 0])) { /* fall through to list unless a real name was typed */ }
          const picked = r.values[2]; const idx = items.indexOf(picked);
          if (r.values[0] && r.values[0] !== '*.*' && !/[*?]/.test(r.values[0])) { const e = await loadFile(sh.pathStr(L.r.dr, L.r.dirs).replace(/\\$/, '') + '\\' + r.values[0]); if (e) await K.msgBox(host, e, ['OK']); return true; }
          if (idx === L.items.length) { const p = sh.pathStr(L.r.dr, L.r.dirs); dirArg = L.r.dirs.length ? sh.pathStr(L.r.dr, L.r.dirs.slice(0, -1)) : p; continue; }
          const it = L.items[idx]; if (!it) return true;
          if (it.type === 'dir') { dirArg = sh.pathStr(L.r.dr, L.r.dirs).replace(/\\$/, '') + '\\' + it.name; continue; }
          const e = await loadFile(sh.pathStr(L.r.dr, L.r.dirs).replace(/\\$/, '') + '\\' + it.name); if (e) await K.msgBox(host, e, ['OK']);
          return true;
        }
      }
      if (a === 'save') { await doSave(false); return true; }
      if (a === 'saveas') { await doSave(true); return true; }
      if (a === 'print') { await K.msgBox(host, 'Printer: Epson Stylus Color 440 on LPT1\n\nStatus: Out of cyan. It is always out of cyan.\n(It\'s a text file. It doesn\'t NEED cyan. Try telling the printer that.)', ['OK']); return true; }
      if (a === 'cut') { Ed.snapUndo(); Ed.clip = Ed.selText(); Ed.delSel(); return true; }
      if (a === 'copy') { Ed.clip = Ed.selText(); return true; }
      if (a === 'paste') { Ed.snapUndo(); Ed.insert(Ed.clip); return true; }
      if (a === 'clear') { Ed.snapUndo(); Ed.delSel(); return true; }
      if (a === 'all') { Ed.sel = { r: 0, c: 0 }; Ed.r = Ed.lines.length - 1; Ed.c = Ed.lines[Ed.r].length; return true; }
      if (a === 'find' || a === 'change') {
        const ctrls = [{ type: 'text', label: '&Find What:', value: lastFind || (Ed.selText().split('\n')[0] || ''), max: 60, focus: true }];
        if (a === 'change') ctrls.push({ type: 'text', label: 'C&hange To:', value: '', max: 60 });
        ctrls.push({ type: 'check', label: '&Match Upper/Lowercase', value: matchCase }, { type: 'btns', items: a === 'change' ? ['Change All', 'Cancel'] : ['OK', 'Cancel'] });
        const r = await K.form(host, a === 'change' ? 'Change' : 'Find', ctrls, { w: 56 });
        if (!r || r.btn === 'Cancel' || !r.values[0]) return true;
        lastFind = r.values[0]; matchCase = r.values[a === 'change' ? 2 : 1];
        if (a === 'change') { Ed.snapUndo(); let n = 0; const q = matchCase ? lastFind : lastFind.toLowerCase(); Ed.lines = Ed.lines.map(l => { let out = '', i = 0; const src = matchCase ? l : l.toLowerCase(); for (;;) { const j = src.indexOf(q, i); if (j < 0) { out += l.slice(i); break; } out += l.slice(i, j) + r.values[1]; i = j + q.length; n++; } return out; }); Ed.dirty = Ed.dirty || n > 0; await K.msgBox(host, n ? `${n} occurrence${n === 1 ? '' : 's'} changed.` : 'Match not found', ['OK']); return true; }
        const hit = Ed.find(lastFind, Ed.c, matchCase); if (!hit) { await K.msgBox(host, 'Match not found', ['OK']); return true; }
        Ed.r = hit.r; Ed.c = hit.c; Ed.sel = { r: hit.r, c: hit.c }; Ed.c += lastFind.length; return true;
      }
      if (a === 'again') { if (!lastFind) return act('find'); const hit = Ed.find(lastFind, Ed.c, matchCase); if (!hit) { await K.msgBox(host, 'Match not found', ['OK']); return true; } Ed.r = hit.r; Ed.c = hit.c; Ed.sel = { r: hit.r, c: hit.c }; Ed.c += lastFind.length; return true; }
      if (a === 'display') { await K.msgBox(host, 'Colours: white on blue.\nScroll bars: yes.\nTab stops: 8.\n\nThese are the correct settings. Every other setting is wrong.', ['OK'], { title: 'Display' }); return true; }
      if (a === 'helppath') { await K.msgBox(host, 'Location of help file: C:\\JACKOS\\COMMAND\\EDIT.HLP\n\n(TYPE it at the prompt. Or press F1 here.)', ['OK']); return true; }
      if (a === 'help') { await K.msgBox(host, 'JACK-DOS EDITOR (JackOS edition)\n\nArrows/Home/End/PgUp/PgDn move. Shift+arrows select.\nCtrl+Y deletes a line. Ctrl+Z undoes. Ctrl+Left/Right jump words.\nShift+Del cut, Ctrl+Ins copy, Shift+Ins paste. Ctrl+F find, F3 again.\nInsert = overtype (square cursor). Alt or F10 = menus. Click them too.\nCtrl+S saves (not in real EDIT. Jack added it. Jack was fed up.)', ['OK'], { title: 'Help', left: true, width: 70 }); return true; }
      if (a === 'about') { await K.msgBox(host, 'JACK-DOS Editor\nJackOS Version 2.0.026\n\nCopyright (C) JackOS Corp. 1991-1999\n(the blue is the same blue as Dad\'s one. I checked.)', ['OK'], { title: 'About' }); return true; }
      return true;
    }
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') {
        if (e.y === 0 && e.act === 'down') { const it = await K.menuBar(host, menus(), Math.max(0, menus().findIndex((m, i, arr) => { let x = 2; for (let j = 0; j < i; j++) x += K.plain(arr[j].label).length + 2; return e.x >= x - 1 && e.x < x + K.plain(m.label).length + 1; })), true); if (it && !await act(it.act)) break; draw(); continue; }
        if (e.act === 'wheel') { Ed.top = Math.max(0, Math.min(Ed.lines.length - 1, Ed.top + e.dy * 3)); Ed.r = Math.max(Ed.top, Math.min(Ed.top + H() - 6, Ed.r)); draw(); continue; }
        if ((e.act === 'down' || e.act === 'drag') && e.y >= 2 && e.y < H() - 3 && e.x >= 1 && e.x < W() - 2) {
          const r = Math.min(Ed.lines.length - 1, Ed.top + e.y - 2), c = Ed.left + e.x - 1;
          if (e.act === 'down') { Ed.sel = null; Ed.r = r; Ed.c = Math.min(c, Ed.lines[r].length); } else { if (!Ed.sel) Ed.sel = { r: Ed.r, c: Ed.c }; Ed.r = r; Ed.c = Math.min(c, Ed.lines[r].length); }
          draw();
        }
        if (e.act === 'down' && e.x === W() - 1 && e.y >= 2 && e.y < H() - 3) { Ed.r = e.y === 2 ? Math.max(0, Ed.r - 1) : e.y === H() - 4 ? Math.min(Ed.lines.length - 1, Ed.r + 1) : Math.round((e.y - 3) / (H() - 8) * (Ed.lines.length - 1)); Ed.sel = null; draw(); }
        continue;
      }
      if (e.key === 'AltUp' || e.key === 'F10') { const it = await K.menuBar(host, menus(), 0, false); if (it && !await act(it.act)) break; draw(); continue; }
      if (e.alt && e.ch === undefined) { draw(); continue; }
      if (e.alt && e.key.length === 1) { const i = menus().findIndex(m => K.hot(m.label) === e.key.toLowerCase()); if (i >= 0) { const it = await K.menuBar(host, menus(), i, false, { open: true }); if (it && !await act(it.act)) break; } draw(); continue; }
      if (e.key === 'F1') { await act('help'); draw(); continue; }
      if (e.key === 'F3') { await act('again'); draw(); continue; }
      if (e.ctrl && /^[fF]$/.test(e.key)) { await act('find'); draw(); continue; }
      if (e.ctrl && /^[sS]$/.test(e.key)) { await act('save'); draw(); continue; }
      if (e.ctrl && /^[qQ]$/.test(e.key) && e.alt) { if (!await act('exit')) break; draw(); continue; }
      if (e.key === 'Escape') { draw(); continue; }
      if (readOnly && (e.ch || ['Enter', 'Backspace', 'Delete', 'Tab'].includes(e.key))) { K.msgBox(host, 'This file was opened read-only (/R).', ['OK']).then(draw); continue; }
      Ed.key(e, { h: H() - 5 });
      draw();
    }
    if (sv) { sv.clear(); sv.stop(); } // (Exit: saved, or they said not to)
    void K2;
  });

  // ================================================================ a text viewer (F3 in GC, and ANSI files)
  async function viewer(host, text, title, isAnsi) {
    const s = host.screen, W = s.cols, H = s.rows;
    // render into a tall buffer first
    const buf = new K.Screen(W, 400); const t = new K.Term(buf); t.attr = isAnsi ? 7 : 0x1b;
    buf.clear(isAnsi ? 7 : 0x1b);
    if (!isAnsi) { for (const l of String(text).replace(/\r/g, '').split('\n')) { for (const c of l.replace(/\t/g, '        ').slice(0, W)) t.putc(c); t.x = 0; t.y++; if (t.y >= 399) break; } }
    else { t.write(String(text)); }
    const used = Math.min(400, Math.max(1, (isAnsi ? t.y + 1 : t.y)));
    let top = 0, left = 0; const body = H - 2;
    const draw = () => {
      s.fill(0, 0, W, 1, ' ', 0x30); s.print(1, 0, pad(title, 40), 0x30);
      const info = ` Line ${top + 1}/${used}  PgUp/PgDn  Esc=Quit `; s.print(W - info.length - 1, 0, info, 0x30);
      for (let y = 0; y < body; y++) { const sy = top + y; for (let x = 0; x < W; x++) { if (sy < used) { const g = buf.get(x, sy); s.set(x, y + 1, g.c, g.a); } else s.set(x, y + 1, ' ', isAnsi ? 7 : 0x1b); } }
      s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, isAnsi ? ' ANSI view: colours by ANSI.SYS, drawn by Jack ' : ' Jack Commander viewer   F3/Esc=back   Home/End ', 0x30);
      s.cur.on = false;
    };
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if (e.act === 'wheel') top = Math.max(0, Math.min(used - 1, top + e.dy * 3)); else if (e.act === 'down' && e.y === 0 && e.x > W - 10) break; else if (e.act === 'down') { top = e.y < H / 2 ? Math.max(0, top - body) : Math.min(Math.max(0, used - body), top + body); } draw(); continue; }
      if (e.key === 'Escape' || e.key === 'F3' || e.key === 'q' || e.key === 'Q' || e.key === 'F10') break;
      if (e.key === 'ArrowDown') top = Math.min(Math.max(0, used - 1), top + 1); else if (e.key === 'ArrowUp') top = Math.max(0, top - 1);
      else if (e.key === 'PageDown' || e.key === ' ') top = Math.min(Math.max(0, used - body), top + body); else if (e.key === 'PageUp') top = Math.max(0, top - body);
      else if (e.key === 'Home') top = 0; else if (e.key === 'End') top = Math.max(0, used - body);
      draw(); void left;
    }
    s.cur.on = true;
  }
  P.ansi = (sh, args) => screenProg(sh, async host => {
    const a = sh.args(args || '')[0];
    if (!a) { await K.msgBox(host, 'ANSI viewer: ANSI filename.ans\n\nThe art lives in C:\\ANSI. Try ANSI C:\\ANSI\\STARFTR.ANS', ['OK']); return; }
    const r = sh.resolve(a); if (r.err || !r.node || r.isDir) { await K.msgBox(host, 'File not found - ' + a.toUpperCase(), ['OK']); return; }
    S('ans'); if (r.node.secret) try { A.secret(r.node.secret); } catch (e) {}
    await viewer(host, r.node.text || '', r.node.name.toUpperCase(), true);
  });

  // ================================================================ GC: Jack Commander (two panels, blue, function keys)
  P.gc = (sh, args) => screenProg(sh, async (host, s) => {
    S('gc');
    const W = () => s.cols, H = () => s.rows;
    const PANEL = 0x1b, SEL = 0x30, DIRC = 0x1f, HDR = 0x1e, FKEY = 0x30, FNUM = 0x07;
    const mkPanel = path => ({ path, idx: 0, top: 0, items: [], r: null, sn: null });
    const panels = [mkPanel(args && args.trim() ? args.trim() : sh.pathStr()), mkPanel('C:\\GAMES')];
    let cur = 0, cmd = '', msg = '';
    function refresh(p) {
      const L = listFiles(sh, p.path); if (!L) { p.path = 'C:\\'; return refresh(p); }
      p.r = L.r; p.dir = L.dir; p.sn = L.sn; p.path = sh.pathStr(L.r.dr, L.r.dirs);
      p.items = (L.r.dirs.length ? [{ name: '..', type: 'dir', up: true }] : []).concat(L.items);
      p.idx = Math.min(p.idx, p.items.length - 1); if (p.idx < 0) p.idx = 0;
    }
    panels.forEach(refresh);
    const narrow = () => W() < 80;
    function drawPanel(p, x, w, active) {
      const h = H() - 4;
      s.fill(x, 0, w, h, ' ', PANEL); s.box(x, 0, w, h, PANEL, true);
      const t = ' ' + p.path + ' '; s.print(x + Math.max(1, Math.floor((w - t.length) / 2)), 0, t.slice(0, w - 2), active ? SEL : PANEL);
      const rows = h - 4, nameW = narrow() ? w - 4 : w - 22;
      s.print(x + 1, 1, pad(' Name', nameW), HDR); if (!narrow()) { s.print(x + 1 + nameW, 1, '\u2502', PANEL); s.print(x + 2 + nameW, 1, '  Size   ', HDR); s.print(x + 10 + nameW, 1, '\u2502', PANEL); s.print(x + 11 + nameW, 1, '  Date  ', HDR); }
      if (p.idx < p.top) p.top = p.idx; if (p.idx >= p.top + rows) p.top = p.idx - rows + 1;
      for (let i = 0; i < rows; i++) {
        const it = p.items[p.top + i], y = 2 + i, sel = active && p.top + i === p.idx;
        const a = sel ? SEL : it && it.type === 'dir' ? DIRC : PANEL;
        s.fill(x + 1, y, w - 2, 1, ' ', a);
        if (!it) continue;
        const nm = it.up ? '..' : p.sn.get(it) || it.name.toUpperCase();
        s.print(x + 1, y, pad((it.type === 'dir' && !it.up ? '\u2584' : ' ') + nm, nameW), a);
        if (!narrow()) { s.print(x + 1 + nameW, y, '\u2502', sel ? SEL : PANEL); s.print(x + 2 + nameW, y, lpad(it.type === 'dir' ? (it.up ? 'UP--DIR' : '>SUB-DIR<') : U.bytesOf(it) > 999999 ? Math.round(U.bytesOf(it) / 1024) + 'K' : U.bytesOf(it), 9), a); s.print(x + 10 + nameW, y, '\u2502', sel ? SEL : PANEL); s.print(x + 12 + nameW, y, it.up ? '' : U.dateOf(it), a); }
      }
      s.set(x, h - 2, '\u255f', PANEL); for (let i = 1; i < w - 1; i++) s.set(x + i, h - 2, '\u2500', PANEL); s.set(x + w - 1, h - 2, '\u2562', PANEL);
      const it = p.items[p.idx]; const info = it ? (it.up ? 'UP--DIR' : it.type === 'dir' ? '>SUB-DIR<' : (it.name.length > 12 ? it.name.slice(0, w - 14) + '  ' : it.name + '  ') + U.commas(U.bytesOf(it)) + ' bytes') : 'empty';
      s.print(x + 1, h - 1, pad(' ' + info, w - 2), PANEL);
    }
    function draw() {
      const half = Math.floor(W() / 2);
      if (narrow()) { drawPanel(panels[cur], 0, W(), true); }
      else { drawPanel(panels[0], 0, half, cur === 0); drawPanel(panels[1], half, W() - half, cur === 1); }
      s.fill(0, H() - 3, W(), 1, ' ', 7);
      const pr = panels[cur].path + '>'; s.print(0, H() - 3, pr + cmd, 7); s.cur.x = Math.min(W() - 1, pr.length + cmd.length); s.cur.y = H() - 3; s.cur.on = true;
      s.fill(0, H() - 2, W(), 1, ' ', 7); if (msg) s.print(0, H() - 2, msg.slice(0, W()), 0x0e);
      s.fill(0, H() - 1, W(), 1, ' ', 0);
      const keys = narrow() ? [['1', 'Help'], ['3', 'View'], ['4', 'Edit'], ['5', 'Copy'], ['7', 'Mkdir'], ['8', 'Del'], ['0', 'Quit']] : [['1', 'Help'], ['2', 'Menu'], ['3', 'View'], ['4', 'Edit'], ['5', 'Copy'], ['6', 'RenMov'], ['7', 'Mkdir'], ['8', 'Delete'], ['9', 'PullDn'], ['10', 'Quit']];
      const kw = Math.floor(W() / keys.length); let x = 0; fkGeo.length = 0;
      keys.forEach(([n, l]) => { s.print(x, H() - 1, lpad(n, 2), FNUM); s.print(x + 2, H() - 1, pad(l, kw - 2), FKEY); fkGeo.push([x, kw, 'F' + n]); x += kw; });
    }
    const fkGeo = [];
    const other = () => panels[1 - cur];
    const curItem = () => panels[cur].items[panels[cur].idx];
    const fullPath = (p, it) => p.path.replace(/\\$/, '') + '\\' + it.name;
    async function openItem() {
      const p = panels[cur], it = curItem(); if (!it) return true;
      if (it.up) { const nm = p.r.dirs[p.r.dirs.length - 1]; p.path = sh.pathStr(p.r.dr, p.r.dirs.slice(0, -1)); p.idx = 0; refresh(p); const j = p.items.findIndex(x => x === nm); if (j >= 0) p.idx = j; return true; }
      if (it.type === 'dir') { if (it.locked && !(A.store.get('jhp_files_unlocked', {})[it.name])) { msg = 'Access denied - locked folder (Explorer knows the password dialog)'; return true; } p.path = fullPath(p, it); p.idx = 0; refresh(p); return true; }
      if (/\.(bat|exe|com)$/i.test(it.name) || it.type === 'exe') {
        const snap = s.snap(); host.setMouse(false); s.clear(7); host.term.x = 0; host.term.y = 0; host.term.attr = 7;
        const saveCwd = sh.cwd[p.r.dr].slice(), saveDr = sh.drive; sh.cwd[p.r.dr] = p.r.dirs; sh.drive = p.r.dr;
        await sh.exec(`"${fullPath(p, it)}"`);
        sh.cwd[saveDr === p.r.dr ? saveDr : p.r.dr] = saveCwd; sh.drive = saveDr;
        host.term.line('\nPress any key to return to Jack Commander...'); await host.readKey();
        host.setMouse(true); s.restore(snap); panels.forEach(refresh); return true;
      }
      if (U.isText(it)) { S('gc.view'); if (it.secret) try { A.secret(it.secret); } catch (e) {} await viewer(host, it.text || '', fullPath(p, it), /\.ans$/i.test(it.name)); return true; }
      msg = 'Jack Commander can only open text files and programs. (It\'s DOS. Pictures are JackOS\' job.)';
      return true;
    }
    async function fkey(k) {
      const p = panels[cur], it = curItem();
      if (k === 'F10' || k === 'Escape') { const r = await K.msgBox(host, 'Do you want to quit Jack Commander?', ['&Yes', '&No'], { title: 'Quit' }); return r !== 0; }
      if (k === 'F1') { await K.msgBox(host, 'JACK COMMANDER 2.0\n\nTab switches panel. Enter opens. Arrows move. Type a command and Enter runs it.\nF3 View  F4 Edit  F5 Copy to other panel  F6 Rename  F7 Make directory\nF8 Delete  F9 Menu  F10 Quit  Ctrl+R refresh  Ctrl+H hidden files\n\nKevin says you never need JackOS. Kevin is wrong, but this is nice.', ['OK'], { title: 'Help', left: true, width: 72 }); return true; }
      if (k === 'F2' || k === 'F9') {
        const r = await K.menuBar(host, [{ label: '&Left', items: [{ label: '&Brief', act: 'brief' }, { label: '&Full', act: 'full' }, '-', { label: '&Drive...', act: 'drive0' }] }, { label: '&Files', items: [{ label: '&View', key: 'F3', act: 'F3' }, { label: '&Edit', key: 'F4', act: 'F4' }, { label: '&Copy', key: 'F5', act: 'F5' }, { label: '&Rename', key: 'F6', act: 'F6' }, { label: '&Make directory', key: 'F7', act: 'F7' }, { label: '&Delete', key: 'F8', act: 'F8' }, '-', { label: '&Quit', key: 'F10', act: 'F10' }] }, { label: '&Commands', items: [{ label: '&Find file...', act: 'find' }, { label: '&Swap panels', key: 'Ctrl+U', act: 'swap' }, { label: '&Refresh', key: 'Ctrl+R', act: 'refresh' }] }, { label: '&Options', items: [{ label: '&Show hidden files', chk: !!sh.showHidden, act: 'hidden' }, { label: '&Colours...', act: 'colours' }] }, { label: '&Right', items: [{ label: '&Brief', act: 'brief' }, { label: '&Full', act: 'full' }, '-', { label: '&Drive...', act: 'drive1' }] }], 0, false, { open: true });
        if (!r) return true;
        if (/^F\d+$/.test(r.act)) return fkey(r.act);
        if (r.act === 'swap') panels.reverse();
        else if (r.act === 'refresh') panels.forEach(refresh);
        else if (r.act === 'hidden') { sh.showHidden = !sh.showHidden; panels.forEach(refresh); }
        else if (r.act === 'colours') await K.msgBox(host, 'Colour scheme: Blue.\nOther schemes: also blue.', ['OK']);
        else if (r.act === 'find') { const f = await K.form(host, 'Find file', [{ type: 'text', label: '&Name:', value: '*.TXT', max: 30, focus: true }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 50 }); if (f && f.btn === 'OK') { const hits = []; const rx = U.wild(f.values[0]) || new RegExp('^' + f.values[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'); (function walk(n, path) { for (const k of n.kids || []) { if (k.type !== 'dir' && (rx.test(k.name) || rx.test(U.short(n, k)))) hits.push(path + '\\' + k.name); if (k.type === 'dir' && hits.length < 200) walk(k, path + '\\' + k.name); } })(A.fs.root, 'C:'); await K.form(host, `Found ${hits.length}`, [{ type: 'list', items: hits.length ? hits : ['(nothing)'], h: 12, focus: true }, { type: 'btns', items: ['OK'] }], { w: Math.min(s.cols - 2, 70) }); } }
        else if (/^drive/.test(r.act)) { const f = await K.form(host, 'Drive', [{ type: 'list', items: ['A:  3\u00bd Floppy', 'C:  JACKS PC', 'D:  CD-ROM'], h: 3, idx: 1, focus: true }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 30 }); if (f && f.btn === 'OK') { const d = f.values[0][0]; const pp = panels[+r.act.slice(5)]; if (d === 'A' && !sh.floppyReady()) { msg = 'Drive A: not ready. (Put a disk in from the prompt: type A: and Retry a few times.)'; } else { pp.path = d + ':\\'; pp.idx = 0; refresh(pp); } } }
        else msg = 'Panel mode: ' + r.act + ' (it looks the same. Everything looks the same. It\'s all blue.)';
        return true;
      }
      if (k === 'F3') { if (it && !it.up) await openItem(); return true; }
      if (k === 'F4') { if (!it || it.type === 'dir') { msg = 'Select a file to edit'; return true; } host.setMouse(true); await P.edit(sh, `"${fullPath(p, it)}"`); host.setMouse(true); panels.forEach(refresh); return true; }
      if (k === 'F5') {
        if (!it || it.type === 'dir') { msg = 'Copying directories: no. (Kevin can. Kevin has the full version.)'; return true; }
        const dest = narrow() ? (await K.form(host, 'Copy', [{ type: 'text', label: 'Copy to:', value: other().path, max: 70, focus: true }, { type: 'btns', items: ['Copy', 'Cancel'] }], { w: 56 })) : await K.form(host, 'Copy', [{ type: 'label', text: `Copy "${it.name}" to`, rows: 1 }, { type: 'text', label: '', value: other().path, max: 70, focus: true }, { type: 'btns', items: ['Copy', 'Cancel'] }], { w: 56 });
        if (!dest || dest.btn !== 'Copy') return true;
        const target = dest.values.find(v => typeof v === 'string');
        const prev = sh.out; sh.out = []; await sh.exec(`COPY "${fullPath(p, it)}" "${target}"`); msg = sh.out.join('').trim().split('\n').pop(); sh.out = prev; panels.forEach(refresh); return true;
      }
      if (k === 'F6') {
        if (!it || it.up) return true;
        const f = await K.form(host, 'Rename/Move', [{ type: 'label', text: `Rename or move "${it.name}" to`, rows: 1 }, { type: 'text', label: '', value: it.name, max: 70, focus: true }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 56 });
        if (!f || f.btn !== 'OK') return true;
        const prev = sh.out; sh.out = []; await sh.exec(`${/[\\:]/.test(f.values[1]) ? 'MOVE' : 'REN'} "${fullPath(p, it)}" "${f.values[1]}"`); msg = sh.out.join('').trim().split('\n').pop(); sh.out = prev; panels.forEach(refresh); return true;
      }
      if (k === 'F7') {
        const f = await K.form(host, 'Make directory', [{ type: 'text', label: 'Create the directory', value: '', max: 60, focus: true }, { type: 'btns', items: ['OK', 'Cancel'] }], { w: 50 });
        if (!f || f.btn !== 'OK' || !f.values[0].trim()) return true;
        const prev = sh.out; sh.out = []; await sh.exec(`MD "${p.path.replace(/\\$/, '')}\\${f.values[0].trim()}"`); msg = sh.out.join('').trim(); sh.out = prev; panels.forEach(refresh); return true;
      }
      if (k === 'F8' || k === 'Delete') {
        if (!it || it.up) return true;
        const r = await K.msgBox(host, `Do you wish to delete\n${it.name}?`, ['&Delete', '&Cancel'], { title: 'Delete' });
        if (r !== 0) return true;
        const prev = sh.out; sh.out = []; await sh.exec(`${it.type === 'dir' ? 'RD' : 'DEL'} "${fullPath(p, it)}"`); msg = sh.out.join('').trim().split('\n').pop() || 'Deleted.'; sh.out = prev; panels.forEach(refresh); return true;
      }
      return true;
    }
    draw();
    for (;;) {
      const e = await host.readEvent();
      msg = '';
      if (e.type === 'mouse') {
        if (e.act === 'down' && e.y === H() - 1) { const g = fkGeo.find(([x, w]) => e.x >= x && e.x < x + w); if (g && !await fkey(g[2])) break; draw(); continue; }
        if (e.act === 'down' || e.act === 'dbl' || e.act === 'wheel') {
          const half = Math.floor(W() / 2); const pi = narrow() ? cur : (e.x < half ? 0 : 1); const p = panels[pi]; const px = narrow() ? 0 : pi * half;
          if (e.y < H() - 4) {
            cur = pi;
            if (e.act === 'wheel') { p.idx = Math.max(0, Math.min(p.items.length - 1, p.idx + e.dy * 3)); }
            else { const i = p.top + e.y - 2; if (i >= 0 && i < p.items.length && e.y >= 2) { const same = p.idx === i; p.idx = i; if (e.act === 'dbl' || (same && e.act === 'down' && K.touchDev())) { if (!await openItem()) break; } } }
          }
          void px;
        }
        draw(); continue;
      }
      const k = e.key, p = panels[cur];
      if (k === 'Tab') { cur = 1 - cur; }
      else if (k === 'ArrowDown') p.idx = Math.min(p.items.length - 1, p.idx + 1);
      else if (k === 'ArrowUp') p.idx = Math.max(0, p.idx - 1);
      else if (k === 'PageDown') p.idx = Math.min(p.items.length - 1, p.idx + (H() - 8));
      else if (k === 'PageUp') p.idx = Math.max(0, p.idx - (H() - 8));
      else if (k === 'Home') p.idx = 0; else if (k === 'End') p.idx = p.items.length - 1;
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { if (narrow()) cur = 1 - cur; else cur = k === 'ArrowLeft' ? 0 : 1; }
      else if (k === 'Enter') {
        if (cmd.trim()) {
          const line = cmd; cmd = '';
          if (/^(exit|quit)$/i.test(line.trim())) break;
          const snap = s.snap(); host.setMouse(false); s.clear(7); host.term.x = 0; host.term.y = 0; host.term.attr = 7;
          const saveCwd = sh.cwd[p.r.dr].slice(), saveDr = sh.drive; sh.cwd[p.r.dr] = p.r.dirs; sh.drive = p.r.dr;
          host.term.line(p.path + '>' + line);
          await sh.exec(line);
          const newPath = sh.pathStr(); sh.cwd[p.r.dr] = saveCwd; sh.drive = saveDr;
          host.term.line('\nPress any key to return to Jack Commander...'); await host.readKey();
          host.setMouse(true); s.restore(snap); if (newPath !== p.path) { p.path = newPath; p.idx = 0; } panels.forEach(refresh);
        } else if (!await openItem()) break;
      }
      else if (k === 'Backspace') cmd = cmd.slice(0, -1);
      else if (k === 'Escape') { if (cmd) cmd = ''; else if (!await fkey('F10')) break; }
      else if (e.ctrl && /^[rR]$/.test(k)) panels.forEach(refresh);
      else if (e.ctrl && /^[uU]$/.test(k)) panels.reverse();
      else if (e.ctrl && /^[hH]$/.test(k)) { sh.showHidden = !sh.showHidden; panels.forEach(refresh); }
      else if (e.ctrl && k === 'Enter') { const it = curItem(); if (it) cmd += (it.up ? '..' : (p.sn.get(it) || it.name)) + ' '; }
      else if (/^F\d+$/.test(k)) { if (!await fkey(k)) break; }
      else if (e.ch && !e.ctrl && !e.alt) { cmd += e.ch; if (cmd.length > 100) cmd = cmd.slice(0, 100); }
      draw();
    }
  });

  // ================================================================ DEFRAG (the DOS one, with the little blocks)
  P.defrag = (sh, args) => screenProg(sh, async (host, s) => {
    S('defrag');
    const W = s.cols, H = s.rows, BG = 0x17;
    s.clear(BG); host.setMouse(false);
    s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, 'Optimize', 0x70); s.print(W - 6, 0, 'Help', 0x70);
    const gw = Math.min(W - 4, 76), gh = H - 11, cells = gw * gh;
    const grid = new Array(cells).fill(0); // 0 empty, 1 used, 2 unmovable, 3 bad(ish)
    let h = 1234; const rnd = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296;
    for (let i = 0; i < cells; i++) grid[i] = rnd() < 0.42 ? 1 : 0;
    for (let i = 0; i < 6; i++) grid[Math.floor(rnd() * cells)] = 2;
    grid[Math.floor(cells * 0.73)] = 3;
    const CH = { 0: ['\u2591', 0x17], 1: ['\u2588', 0x1f], 2: ['X', 0x1e], 3: ['B', 0x1c], 4: ['r', 0x1a], 5: ['W', 0x1d] };
    const drawCell = i => { const [c, a] = CH[grid[i]]; s.set(2 + i % gw, 2 + Math.floor(i / gw), c, a); };
    s.box(1, 1, gw + 2, gh + 2, 0x1f, true, 'Drive C: - 2% fragmented');
    for (let i = 0; i < cells; i++) drawCell(i);
    const leg = H - 8;
    s.box(1, leg, 40, 7, 0x1f, false, 'Legend'); s.print(3, leg + 1, '\u2588 - Used          \u2591 - Unused', 0x1f); s.print(3, leg + 2, 'r - Reading       W - Writing', 0x1f); s.print(3, leg + 3, 'B - Bad (grumpy)  X - Unmovable', 0x1f); s.print(3, leg + 4, '\u2588 Drive C:  5,311 MB   Cluster: 4K', 0x1f); s.print(3, leg + 5, 'Full Optimization  (Dad\'s favourite)', 0x1f);
    s.box(42, leg, W - 44, 7, 0x1f, false, 'Status'); const stat = (l, t) => s.print(44, leg + 1 + l, pad(t, W - 48), 0x1f);
    stat(0, 'Cluster 0 of ' + cells); stat(1, '0% complete'); stat(2, 'Elapsed time: 00:00:00'); stat(4, 'Esc = Stop   (be patient. it\'s 1999.)');
    s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, 'Defragmenting file system... Reading the bits of GLOOM that are everywhere.', 0x30);
    s.cur.on = false;
    const t0 = Date.now(); let write = 0, read = cells - 1, done = 0;
    let stopped = false;
    outer: while (write < cells) {
      while (write < cells && grid[write] !== 0) write++;
      while (read > write && grid[read] !== 1) read--;
      if (read <= write) break;
      grid[write] = 5; grid[read] = 4; drawCell(write); drawCell(read);
      await sleep(host, 28);
      grid[write] = 1; grid[read] = 0; drawCell(write); drawCell(read); done++;
      const el = Math.floor((Date.now() - t0) / 1000);
      stat(0, `Cluster ${write} of ${cells}`); stat(1, `${Math.min(99, Math.floor(write / cells * 100))}% complete`); stat(2, `Elapsed time: 00:${lpad(Math.floor(el / 60), 2).replace(/ /g, '0')}:${lpad(el % 60, 2).replace(/ /g, '0')}`);
      if (done % 7 === 0) { const k = host.pollKey(); if (k && (k.key === 'Escape' || k.ctrl)) { stopped = true; break outer; } }
    }
    if (!stopped) {
      s.box(1, 1, gw + 2, gh + 2, 0x1f, true, 'Drive C: - 0% fragmented');
      const r = await K.msgBox(host, `Finished condensing.\n\nDrive C: is now 0% fragmented.\nIt will be 2% again by Tuesday. (It's the Internet cache. And GLOOM.)`, ['OK'], { attr: 0x70 });
      void r;
    }
  });

  // ================================================================ SCANDISK (DOS)
  P.scandisk = (sh, args) => screenProg(sh, async (host, s) => {
    S('scandisk');
    const W = s.cols, H = s.rows; host.setMouse(false);
    s.clear(0x17); s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, 'JackOS ScanDisk', 0x70);
    s.box(2, 2, W - 4, 10, 0x1f, true, 'Drive C: (JACKS PC)');
    const steps = ['Media descriptor', 'File allocation tables', 'Directory structure', 'File system', 'Lost clusters (one chain, half a spaceship)', 'Surface scan'];
    const draw = n => steps.forEach((st, i) => s.print(5, 4 + i, (i < n ? '\u221a ' : i === n ? '\u25ba ' : '  ') + pad(st, 50), i < n ? 0x1a : i === n ? 0x1e : 0x1f));
    s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, 'ScanDisk is checking drive C: for errors.  Esc = Stop', 0x30);
    s.cur.on = false;
    for (let i = 0; i < 5; i++) { draw(i); await sleep(host, 550); const k = host.pollKey(); if (k && k.key === 'Escape') return; }
    draw(5);
    const gx = 4, gy = 13, gw = Math.min(W - 8, 72), gh = H - 16, cells = gw * gh;
    s.box(gx - 1, gy - 1, gw + 2, gh + 2, 0x1f, false, 'Surface scan');
    for (let i = 0; i < cells; i++) s.set(gx + i % gw, gy + Math.floor(i / gw), '\u2591', 0x17);
    const grumpy = Math.floor(cells * 0.62);
    for (let i = 0; i < cells; i++) {
      s.set(gx + i % gw, gy + Math.floor(i / gw), i === grumpy ? 'G' : '\u2588', i === grumpy ? 0x1e : 0x1b);
      if (i % 9 === 0) { await sleep(host, 12); const k = host.pollKey(); if (k && k.key === 'Escape') return; }
      if (i === grumpy) { s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, `Cluster ${U.commas(i * 4096)}: "would rather not". Marking as grumpy. Moving on.`, 0x30); await sleep(host, 900); }
    }
    await K.msgBox(host, 'ScanDisk did not find any errors on this drive.\n\nChecked: 5,311 MB.  Bad clusters: 0.  Grumpy clusters: 1.\nLost clusters: 1 chain, saved as FILE0000.CHK (half a drawing of a spaceship).', ['OK'], { attr: 0x70, left: true, width: 68 });
  });

  // ================================================================ FDISK (scary)
  P.fdisk = (sh) => screenProg(sh, async (host, s) => {
    const W = s.cols, H = s.rows; host.setMouse(false);
    s.clear(7); s.cur.on = true;
    const t = host.term; t.x = 0; t.y = 0; t.attr = 7;
    t.line('\n' + ' '.repeat(Math.max(0, (W - 36) / 2 | 0)) + 'JackOS 98 Fixed Disk Setup Program'); t.line(' '.repeat(Math.max(0, (W - 42) / 2 | 0)) + '(C)Copyright JackOS Corp. 1983 - 1999'); t.line('\n' + ' '.repeat(Math.max(0, (W - 12) / 2 | 0)) + 'FDISK Options\n'); t.line('Current fixed disk drive: 1\n');
    t.line('Choose one of the following:\n'); t.line('1. Create DOS partition or Logical DOS Drive'); t.line('2. Set active partition'); t.line('3. Delete partition or Logical DOS Drive'); t.line('4. Display partition information\n'); t.print('Enter choice: [1]\n\n\n\nPress Esc to exit FDISK');
    s.cur.x = 15; s.cur.y = t.y - 4; void H;
    for (;;) {
      const e = await host.readKey();
      if (e.key === 'Escape') { S('fdisk'); return; }
      if (e.ch === '4') { s.clear(7); t.x = 0; t.y = 0; t.line('\nDisplay Partition Information\n\nCurrent fixed disk drive: 1\n\nPartition  Status   Type    Volume Label  Mbytes   System   Usage\nC: 1          A      PRI DOS JACKS PC       5312   FAT32     100%\n\nTotal disk space is 5312 Mbytes (1 Mbyte = 1048576 bytes)\n\n\nPress Esc to continue'); continue; }
      if (e.ch === '1' || e.ch === '2' || e.ch === '3') { s.clear(7); t.x = 0; t.y = 0; t.line('\n\n\n   NO.\n\n   This is Dad\'s partition. Dad made it in 1998 with a magazine open on the desk.\n   It took him all of Sunday. Mom brought him sandwiches.\n\n   You are not touching it.\n\n\nPress Esc to continue (quickly)'); continue; }
    }
  });

  // ================================================================ MSD: diagnostics
  P.msd = (sh) => screenProg(sh, async (host, s) => {
    S('msd');
    const W = s.cols, H = s.rows; host.setMouse(true);
    s.clear(0x17); s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, 'File  Utilities  Help', 0x70); s.print(W - 32, 0, 'JackOS Diagnostics 2.11', 0x70);
    const items = [['Computer', 'Pentium-class PC', 'Computer: Jack\'s PC (beige)\nProcessor: Pentium-class, 350 MHz ("Dad says 400")\nBIOS: JackBIOS 4.51, 10/12/98\nBus: PCI, ISA (one card. The sound one. It squeals.)\nKeyboard: 102-key UK (the # is in a silly place)\nTurbo button: YES (it does nothing) (it has always done nothing)'], ['Memory', '640K, 64M Ext', 'Conventional: 640K   Free: 62K\nExtended (XMS): 64,421K\nExpanded (EMS): none (EMM386 NOEMS)\nUpper memory: 91K used by MSCDEX, MOUSE, DOSKEY and Gubbinz\nThe 64 MB cost more than the monitor. Dad still brings it up.'], ['Video', 'VGA, 2 MB', 'Adapter: SuperVGA, 2 MB\nMode: 80 x 25 text (now) / 640 x 480 x 256 (JackOS)\nMonitor: 15" (14" visible) (tested with a ruler)\nRefresh: 60 Hz ("it flickers" - Mom)'], ['Network', 'JackNet 56K', 'Network: none. Dial-Up Networking only.\nModem: 56K (advertised) / 26,400 bps (actual) / 0 bps (when Mom is on the phone)\nISP: JackNet. The only one Dad will pay for.'], ['OS Version', 'JackOS 98 4.10', 'JackOS 98 [Version 4.10.1999]\nDOS version: 7.10 (it\'s in there, under JackOS, like the old carpet)\nBoot drive: C:\nCOMSPEC: C:\\COMMAND.COM\nDays until Y2K: not many'], ['Mouse', 'JackMouse, 2 btn', 'Mouse: serial, 2 buttons, 1 ball (fluffy)\nDriver: MOUSE.COM 8.20\nSensitivity: "too fast" (Gran)\nMouse mat: free one from the computer fair. Has a dolphin on it.'], ['Disk Drives', 'A: C: D:', 'A: 3\u00bd" 1.44 MB floppy. Currently: Dave\'s disk, maybe.\nC: 5,311 MB hard disk, FAT32, "JACKS PC". Free: 1,239 MB (after deleting homework).\nD: 32x CD-ROM. JACK ATTACK! COVER DISC #7. It squeaks at 32x.'], ['LPT Ports', 'LPT1: printer', 'LPT1: Epson Stylus Color 440. Out of cyan. Always out of cyan.'], ['COM Ports', 'COM1: mouse COM2: modem', 'COM1: mouse (fluffy ball)\nCOM2: modem (SCREEEE-BONG-BONG-kssshhhhhh)\nCOM3: nothing (Dad says "for later")\nCOM4: Gubbinz, apparently'], ['IRQ Status', '16 lines, 1 Gubbinz', 'IRQ 0 timer   IRQ 1 keyboard   IRQ 3 COM2 modem   IRQ 4 COM1 mouse\nIRQ 5 sound card (SET BLASTER=A220 I5 D1 H5 P330 T6 - say it with me)\nIRQ 7 LPT1   IRQ 12 nothing   IRQ 14 hard disk   IRQ 15 CD-ROM\nIRQ 16 does not exist. Gubbinz is on it anyway.'], ['TSR Programs', '7 resident', 'MSCDEX, MOUSE, DOSKEY, SMARTDRV, MOM.SYS, GUBBINZ.VXD, BLOCKOLOGY\n(BLOCKOLOGY loaded itself. Nobody put it in AUTOEXEC. It is just there.)'], ['Device Drivers', 'HIMEM EMM386 ANSI', 'HIMEM.SYS  EMM386.EXE  ANSI.SYS  CDROM.SYS  MOM.SYS (/BEDTIME:8PM) (cannot be unloaded)']];
    let sel = 0; const geo = [];
    const draw = () => {
      geo.length = 0;
      const colW = Math.min(36, Math.floor((W - 4) / 2)); let y = 2;
      items.forEach((it, i) => { const col = i % 2, x = 2 + col * (colW + 2); const lab = ' ' + pad(it[0] + '...', 15) + pad(it[1], colW - 18); s.print(x, y, lab, i === sel ? 0x3f : 0x1f); geo.push([x, y, colW]); if (col === 1) y++; });
      s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, W >= 80 ? 'Enter=details  Arrows=move  F3/Esc=exit   (diagnosis: beige)' : 'Enter=details Esc=exit', 0x30);
      s.cur.on = false;
    };
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if (e.act === 'down') { const i = geo.findIndex(([x, y, w]) => e.y === y && e.x >= x && e.x < x + w); if (i >= 0) { sel = i; await K.msgBox(host, items[sel][2], ['OK'], { title: items[sel][0], left: true, width: Math.min(W - 6, 72), attr: 0x70 }); } draw(); } continue; }
      if (e.key === 'Escape' || e.key === 'F3') return;
      if (e.key === 'ArrowDown') sel = Math.min(items.length - 1, sel + 2); else if (e.key === 'ArrowUp') sel = Math.max(0, sel - 2);
      else if (e.key === 'ArrowLeft') sel = Math.max(0, sel - 1); else if (e.key === 'ArrowRight') sel = Math.min(items.length - 1, sel + 1);
      else if (e.key === 'Enter' || e.key === ' ') await K.msgBox(host, items[sel][2], ['OK'], { title: items[sel][0], left: true, width: Math.min(W - 6, 72), attr: 0x70 });
      else if (e.ch) { const i = items.findIndex(it => it[0][0].toLowerCase() === e.ch.toLowerCase()); if (i >= 0) sel = i; }
      draw();
    }
  });

  // ================================================================ DEBUG (Dad's "fixing" tool)
  P.debug = async (sh, args) => {
    const host = sh.host, t = sh.term;
    S('debug');
    const a = sh.args(args || '')[0]; let seg = 0x1999; let off = 0x0100;
    if (a) { const r = sh.resolve(a); if (r.err || !r.node) sh.println('File not found'); else sh.println(`Loaded ${r.node.name.toUpperCase()}: ${U.commas(U.bytesOf(r.node))} bytes at CS:0100`); }
    const hx = (n, w) => n.toString(16).toUpperCase().padStart(w, '0');
    let h = 0xBEEF;
    for (;;) {
      sh.print('-'); const line = await K.readLine(host, {}); if (line == null) return;
      const c = line.trim().toLowerCase(), cmd = c[0], rest = c.slice(1).trim();
      if (!c) continue;
      if (cmd === 'q') return;
      if (cmd === '?') { sh.println('assemble     A [address]\ndump         D [range]\nenter        E address [list]\nfill         F range list\ngo           G [=address]\nhex          H value1 value2\nregisters    R [register]\nsearch       S range list\nunassemble   U [range]\nquit         Q\nwrite        W\n(Dad used this to "fix" a game in 1994. It did not fix the game.)'); continue; }
      if (cmd === 'd') { const m = /^([0-9a-f]+)(?::([0-9a-f]+))?/.exec(rest); if (m) { if (m[2]) { seg = parseInt(m[1], 16); off = parseInt(m[2], 16); } else off = parseInt(m[1], 16); } for (let r = 0; r < 8; r++) { let bytes = '', asc = ''; for (let i = 0; i < 16; i++) { h = (h * 1103515245 + 12345) >>> 0; let b = (h >>> 16) & 255; if (seg === 0 && off + r * 16 + i < 16) b = 'JACK WOZ ERE 99!'.charCodeAt(off + r * 16 + i); bytes += hx(b, 2) + (i === 7 ? '-' : ' '); asc += b >= 32 && b < 127 ? String.fromCharCode(b) : '.'; } sh.println(`${hx(seg, 4)}:${hx(off + r * 16, 4)}  ${bytes} ${asc}`); } off = (off + 128) & 0xffff; continue; }
      if (cmd === 'r') { sh.println(`AX=0000  BX=0000  CX=1999  DX=0000  SP=FFEE  BP=0000  SI=0000  DI=0000\nDS=${hx(seg, 4)}  ES=${hx(seg, 4)}  SS=${hx(seg, 4)}  CS=${hx(seg, 4)}  IP=0100   NV UP EI PL NZ NA PO NC\n${hx(seg, 4)}:0100 CD20          INT     20   ; (that's "exit". Dad's programs all start by exiting.)`); continue; }
      if (cmd === 'g') { sh.println('\nProgram terminated normally'); continue; }
      if (cmd === 'u') { const ops = ['MOV AX,0013', 'INT 10', 'MOV AH,09', 'MOV DX,0199', 'INT 21', 'JMP 0100', 'NOP', 'NOP', 'PUSH CS', 'POP DS', 'CMP AL,4F', 'JNZ 0120', 'INT 20']; for (let i = 0; i < 10; i++) { h = (h * 1103515245 + 12345) >>> 0; const b = hx((h >>> 8) & 0xffff, 4); const [mn, arg] = ops[(i + (h >>> 24) % 3) % ops.length].split(' '); sh.println(`${hx(seg, 4)}:${hx(off + i * 2, 4)} ${b}${' '.repeat(10)}${pad(mn, 8)}${arg || ''}`); } continue; }
      if (cmd === 'h') { const [x, y] = rest.split(/\s+/).map(v => parseInt(v, 16) || 0); sh.println(`${hx((x + y) & 0xffff, 4)}  ${hx((x - y) & 0xffff, 4)}`); continue; }
      if (cmd === 'w') { sh.println(rest ? 'Writing 0199 bytes... Written. Nothing happened. Nothing ever happens.' : 'Write what? (You wrote nothing. Very efficiently.)'); continue; }
      if (cmd === 'a') { sh.println(`${hx(seg, 4)}:${hx(off, 4)} `); const ins = await K.readLine(host, {}); if (ins && /jmp|int|mov|nop|push|pop|xor/i.test(ins)) sh.println('(assembled. probably. Dad never checked either.)'); else if (ins && ins.trim()) sh.println('^ Error'); continue; }
      if (cmd === 'e' || cmd === 'f' || cmd === 's') { sh.println(cmd === 's' ? 'Not found. (Try S 0:0 FFFF "CHEATS". Still not found. Try the magazine.)' : 'Done. Nothing was harmed. DEBUG in JackOS is a kind of pretend.'); continue; }
      sh.println('^ Error');
    }
  };
  P.pkunzip = async (sh, args) => {
    sh.println('PKUNZIP (R)   FAST!   Extract Utility   Version 2.04g   JackOS edition');
    sh.println('Copr. 1989-1999 PKWARE-ish. All Rights Reserved. Shareware. Please register. (Nobody registers.)\n');
    const a = sh.args(args || '')[0];
    if (!a) { sh.println('Usage: PKUNZIP [options] zipfile [d:outpath\\] [file...]\n\nThere are no ZIP files on this PC. Jack uses WinJack. WinJack is "unregistered" (day 412).'); return; }
    await sh.host.sleep(600);
    sh.println(`Searching ZIP: ${a.toUpperCase()}\nPKUNZIP: (W18) Warning! ${a.toUpperCase()} - file not found.\n(Everything on this PC is already as small as it goes. Except Gubbinz.)`);
  };

  // ================================================================ MATRIX rain, DOS screensaver, fake virus
  P.matrix = (sh) => screenProg(sh, async (host, s) => {
    S('matrix');
    host.setMouse(false); s.clear(0); s.cur.on = false;
    const W = s.cols, H = s.rows, drops = [];
    for (let x = 0; x < W; x++) drops.push({ y: -Math.random() * H * 2 | 0, sp: 1 + (Math.random() < .3 ? 1 : 0), len: 4 + Math.random() * 12 | 0 });
    const glyph = () => K.CP437[0x21 + Math.random() * 0x5d | 0].replace(/[\u2500-\u259f]/, '#');
    let frames = 0;
    for (;;) {
      for (let x = 0; x < W; x++) { const d = drops[x]; d.y += d.sp; for (let i = 0; i < d.len + 1; i++) { const y = d.y - i; if (y < 0 || y >= H) continue; if (i === d.len) s.set(x, y, ' ', 0); else s.set(x, y, Math.random() < .15 ? glyph() : s.get(x, y).c === ' ' ? glyph() : s.get(x, y).c, i === 0 ? 0x0f : i < 3 ? 0x0a : 0x02); } if (d.y - d.len > H + 2) { d.y = -Math.random() * 20 | 0; d.len = 4 + Math.random() * 12 | 0; } }
      if (++frames === 60) { const m = ' Wake up, Jack...  the Y2K bug has you. '; s.print((W - m.length) / 2 | 0, H / 2 | 0, m, 0x0f); }
      if (frames === 100) { const m = ' Knock knock. (It\'s Mom. Tea\'s ready.) '; s.print((W - m.length) / 2 | 0, H / 2 | 0, m, 0x0f); }
      await sleep(host, 70);
      const k = host.pollKey(); if (k) break;
    }
  });
  P.saver = (sh) => screenProg(sh, async (host, s) => {
    S('saver');
    host.setMouse(false); s.clear(0); s.cur.on = false;
    const W = s.cols, H = s.rows;
    const msgs = ['JACK ATTACK!', 'INSERT COIN', 'IT IS 1999', 'FEED GUBBINZ', 'RED ONES GO FASTER', 'PRESS A KEY TO STOP THIS'];
    let x = 3, y = 3, dx = 1, dy = 1, mi = 0, col = 0x0a, t = 0;
    const stars = []; for (let i = 0; i < 40; i++) stars.push([Math.random() * W | 0, Math.random() * H | 0]);
    for (;;) {
      s.clear(0);
      stars.forEach(st => { st[0] = (st[0] + 1) % W; s.set(st[0], st[1], '.', 0x08); });
      const m = msgs[mi]; s.print(x, y, m, col);
      s.print(x, y + 1, '\u2580'.repeat(m.length), col & 0x0f);
      x += dx; y += dy;
      if (x <= 0 || x + m.length >= W) { dx = -dx; mi = (mi + 1) % msgs.length; col = 9 + (Math.random() * 6 | 0); DOS.tone(300 + Math.random() * 400, 0.03); }
      if (y <= 0 || y >= H - 2) { dy = -dy; col = 9 + (Math.random() * 6 | 0); }
      if (++t % 150 === 0) { s.print(2, H - 1, 'SAVER.COM 1.0 - a screensaver for DOS, for when Dad is in DOS, which is a lot', 0x08); await sleep(host, 800); }
      await sleep(host, 60);
      const k = host.pollKey(); if (k) break;
    }
  });
  P.virus = (sh) => screenProg(sh, async (host, s) => {
    host.setMouse(false); const t = host.term; s.clear(7); t.x = 0; t.y = 0; t.attr = 7; s.cur.on = true;
    t.line('~FUNNY.COM\n'); await sleep(host, 700);
    t.attr = 0x0c; t.line('!!! WARNING !!! YOUR COMPUTER HAS A VIRUS !!!'); await sleep(host, 900);
    t.attr = 7; t.line('\nThe BUG99.A virus is eating your files.'); await sleep(host, 700);
    const files = ['C:\\JACKOS\\JACK.COM', 'C:\\MY DOCUMENTS\\DIARY\\*.*', 'C:\\MY DOCUMENTS\\HOMEWORK\\*.*', 'C:\\JACKATAK\\INDEX.HTM', 'C:\\GAMES\\DOOM.TXT', 'C:\\ALL THE POKEMON'];
    for (const f of files) { t.write('Eating ' + f + ' '); for (let i = 0; i < 12; i++) { t.write('\u2588'); DOS.tone(200 + i * 30, 0.03); await sleep(host, 60); } t.line(' NOM'); await sleep(host, 150); }
    t.attr = 0x0e; t.line('\nSending your diary to EVERYONE AT SCHOOL in 5...'); for (let i = 4; i >= 1; i--) { await sleep(host, 700); t.line(String(i) + '...'); }
    await sleep(host, 900);
    for (let i = 0; i < 60; i++) { s.set(Math.random() * s.cols | 0, Math.random() * s.rows | 0, K.CP437[176 + (Math.random() * 3 | 0)], Math.random() * 15 | 0); } await sleep(host, 500);
    s.clear(0x1f); t.attr = 0x1f; t.x = 0; t.y = 2;
    t.line('                    APRIL FOOL!\n'); t.line('   Nothing was eaten. Nothing was sent. DIR to check if you don\'t believe me.'); t.line('   ~FUNNY.COM is 2 KB of ECHO statements. Dave made it. Dave is very proud.'); t.line('   (Mom was NOT amused. Dad laughed, then said "that\'s not funny", then laughed again.)\n'); t.line('   Real viruses are not funny. Don\'t open attachments. Dad bought AV99 the day after Melissa.\n\n   Press any key.');
    s.cur.on = false; S('virus'); await host.readKey();
  });

  DOS.viewer = viewer;
})();
/* ---- more DOS tools: EDLIN, DOSSHELL, SQUASH/UNSQUASH, JACKSCAN, CALC, HEXED (appended) */
(function () {
  'use strict';
  const DOS = window.DOS, K = DOS.core, A = window.Apps, U = DOS.shellUtil, P = DOS.progs;
  const S = id => { try { return A.secret('dos.' + id); } catch (e) { return false; } };
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const lpad = (s, n) => String(s).padStart(n).slice(-n);
  const hx = (n, w) => n.toString(16).toUpperCase().padStart(w, '0');

  // ================================================================ EDLIN: the 1981 line editor
  P.edlin = async (sh, args) => {
    const host = sh.host;
    const name = sh.args(args || '')[0];
    if (!name) { sh.println('File name must be specified'); return; }
    const r = sh.resolve(name);
    if (r.err || r.isDir) { sh.println(r.err === 'notready' ? 'Drive not ready' : 'Invalid path'); return; }
    let lines = [];
    if (r.node) { if (!U.isText(r.node)) { sh.println('Not a text file'); return; } lines = String(r.node.text || '').replace(/\n$/, '').split('\n'); sh.println('End of input file'); } else sh.println('New file');
    let cur = 1;
    const show = (a, b) => { for (let i = a; i <= Math.min(b, lines.length); i++) sh.println(`${lpad(i, 8)}:${i === cur ? '*' : ' '}${lines[i - 1]}`); };
    for (;;) {
      sh.print('*');
      const l = await K.readLine(host, {}); if (l == null) return;
      const m = /^\s*(\d+)?\s*,?\s*(\d+)?\s*([A-Za-z?])?\s*(.*)$/.exec(l); if (!m) { sh.println('Entry error'); continue; }
      const n1 = m[1] ? +m[1] : null, n2 = m[2] ? +m[2] : null, c = (m[3] || '').toUpperCase();
      if (!c && n1) { if (n1 < 1 || n1 > lines.length) { sh.println('Entry error'); continue; } cur = n1; sh.println(`${lpad(cur, 8)}:*${lines[cur - 1]}`); sh.print(`${lpad(cur, 8)}:*`); const nl = await K.readLine(host, {}); if (nl != null && nl !== '') lines[cur - 1] = nl; continue; }
      if (c === 'L') { const a = n1 || Math.max(1, cur - 11), b = n2 || a + 22; show(a, b); continue; }
      if (c === 'P') { const a = n1 || cur, b = n2 || a + 22; show(a, b); cur = Math.min(lines.length, b); continue; }
      if (c === 'I') { let at = n1 || cur; if (at < 1) at = 1; if (at > lines.length + 1) at = lines.length + 1; for (;;) { sh.print(`${lpad(at, 8)}:*`); const nl = await K.readLine(host, {}); if (nl == null || nl === '.') break; lines.splice(at - 1, 0, nl); at++; } cur = Math.min(Math.max(1, at), Math.max(1, lines.length)); continue; }
      if (c === 'D') { const a = n1 || cur, b = n2 || a; if (a < 1 || a > lines.length) { sh.println('Entry error'); continue; } lines.splice(a - 1, b - a + 1); cur = Math.min(a, lines.length); continue; }
      if (c === 'S') { const q = m[4]; let hit = -1; for (let i = (n1 || 1) - 1; i < lines.length; i++) if (lines[i].includes(q)) { hit = i; break; } if (hit < 0) sh.println('Not found'); else { cur = hit + 1; sh.println(`${lpad(cur, 8)}: ${lines[hit]}`); } continue; }
      if (c === 'E') { const e = sh.writeFile(sh.resolve(name), lines.join('\n') + (lines.length ? '\n' : '')); if (e) { sh.println(e); continue; } S('edlin'); return; }
      if (c === 'Q') { sh.print('Abort edit (Y/N)? '); const k = await sh.key('YN'); sh.println(k); if (k === 'Y') return; continue; }
      if (c === '?') { sh.println('Edit line                   line#\nAppend                      [#lines]A\nDelete                      [startline][,endline]D\nInsert                      [line]I  (end with a . on its own)\nList                        [startline][,endline]L\nPage                        [startline][,endline]P\nSearch                      [startline]Stext\nEnd (save file)             E\nQuit (throw away changes)   Q\n\n(It was 1981. This was the editor. Dad is sorry.)'); continue; }
      if (c === 'A') { sh.println('(nothing to append. The whole file is loaded. It is 1999 now, we have memory.)'); continue; }
      sh.println('Entry error');
    }
  };

  // ================================================================ DOSSHELL: a menu for people who don't like typing
  P.dosshell = (sh) => DOS.screenProg(sh, async (host, s) => {
    const W = s.cols, H = s.rows;
    const progs = [['Jack Crawl', 'JACKCRAWL'], ['Flak Attack!', 'DAKKA'], ['Chip Van Tycoon', 'SQUIGPIE'], ['Alien Hunt', 'SQUIGHUNT'], ['Turbo Racer', 'TRUKKRACE'], ['Gem Wars', 'GEMWARS'], ['JACK INTRO (demo)', 'INTRO'], ['Jack Quest (adventure)', 'JACKQUEST'], ['JBASIC', 'JBASIC'], ['JACK-DOS Editor', 'EDIT'], ['Jack Commander', 'GC'], ['Text Paint', 'TPAINT'], ['JackTrak (music)', 'JACKTRAK'], ['Hex Editor', 'HEXED'], ['Calculator', 'CALC'], ['Disk Defragmenter', 'DEFRAG'], ['ScanDisk', 'SCANDISK'], ['Diagnostics (MSD)', 'MSD'], ['Command Prompt', 'COMMAND'], ['Exit', null]];
    let sel = 0;
    const draw = () => {
      s.clear(0x17); s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, 'File  Options  View  Tree  Help', 0x70); s.print(W - 16, 0, 'JackOS Shell', 0x70);
      s.fill(0, 1, W, 1, ' ', 0x30); s.print(1, 1, sh.pathStr(), 0x30);
      const bw = Math.min(W - 4, 50), bx = Math.floor((W - bw) / 2);
      s.box(bx, 3, bw, progs.length + 2, 0x1f, true, 'Main');
      progs.forEach(([n], i) => { s.fill(bx + 1, 4 + i, bw - 2, 1, ' ', i === sel ? 0x71 : 0x1f); s.print(bx + 2, 4 + i, n, i === sel ? 0x71 : 0x1f); });
      s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, 'F10=Actions  Shift+F9=Command Prompt  Enter=Run  Esc=Exit   (why are you in DOS if you want menus?)'.slice(0, W - 2), 0x30);
      s.cur.on = false;
    };
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if (e.act === 'down' || e.act === 'dbl') { const bw = Math.min(W - 4, 50), bx = Math.floor((W - bw) / 2); const i = e.y - 4; if (i >= 0 && i < progs.length && e.x > bx && e.x < bx + bw) { const run = sel === i || e.act === 'dbl' || K.touchDev(); sel = i; if (run) { if (!progs[sel][1]) return; await runOne(progs[sel][1]); } } } draw(); continue; }
      if (e.key === 'Escape' || e.key === 'F3') return;
      if (e.key === 'ArrowDown') sel = (sel + 1) % progs.length; else if (e.key === 'ArrowUp') sel = (sel + progs.length - 1) % progs.length;
      else if (e.key === 'Enter') { if (!progs[sel][1]) return; await runOne(progs[sel][1]); }
      else if (e.key === 'F9' && e.shift) await runOne('COMMAND');
      else if (e.key === 'F10') await K.msgBox(host, 'Actions: Run (Enter), Exit (Esc).\nThat\'s it. That\'s the shell. Dad used this in 1992 and said it was "the future".', ['OK'], { attr: 0x70 });
      draw();
    }
    async function runOne(cmd) { const snap = s.snap(); host.setMouse(false); s.clear(7); host.term.x = 0; host.term.y = 0; host.term.attr = 7; await sh.exec(cmd); if (cmd !== 'COMMAND') { host.term.line('\nPress any key to return to the Shell...'); await host.readKey(); } host.setMouse(true); s.restore(snap); }
  });

  // ================================================================ SQUASH / UNSQUASH: a text archiver that works (unlike WinJack)
  P.squash = async (sh, args) => {
    const [sw, a] = sh.switches(sh.args(args || ''));
    sh.println('SQUASH 1.3  (C) 1999 Jack. Squashes files. Registered to: JACK (he wrote it, it counts).');
    if (!a.length) { sh.println('\nUsage: SQUASH archive[.SQZ] file [file ...]\n       SQUASH /L archive      list what\'s in it\n       UNSQUASH archive        get it all back'); return; }
    const arcName = /\./.test(a[0]) ? a[0] : a[0] + '.SQZ';
    if (sw.L) { const r = sh.resolve(arcName); if (r.err || !r.node) { sh.println('Archive not found'); return; } const parts = parseSqz(r.node.text || ''); if (!parts) { sh.println('Not a SQZ archive'); return; } sh.println(`\n  Name          Size   Squashed  Ratio\n  ----------  ------   --------  -----`); parts.forEach(p => sh.println(`  ${pad(p.name, 12)}${lpad(p.text.length, 6)}   ${lpad(Math.ceil(p.text.length * 0.6), 8)}   ${lpad(40, 3)}%`)); sh.println(`  ${parts.length} file(s)`); return; }
    const files = a.slice(1); if (!files.length) { sh.println('Nothing to squash. Name some files.'); return; }
    const parts = [];
    for (const f of files) { const r = sh.resolve(f); if (r.err || !r.node || r.isDir) { sh.println(`  ${f.toUpperCase()}: not found, skipped`); continue; } if (!U.isText(r.node)) { sh.println(`  ${f.toUpperCase()}: not a text file (SQUASH only squashes text. It's 1999.)`); continue; } parts.push({ name: U.short(r.parent, r.node), text: String(r.node.text || '') }); sh.println(`  Squashing ${U.short(r.parent, r.node)}... ${Math.round(40 + Math.random() * 25)}%`); await sh.host.sleep(200); }
    if (!parts.length) { sh.println('Nothing squashed.'); return; }
    const blob = 'SQZ1 ' + parts.length + '\n' + parts.map(p => `::FILE ${p.name} ${p.text.length}\n${p.text}${p.text.endsWith('\n') ? '' : '\n'}::END\n`).join('');
    const e = sh.writeFile(sh.resolve(arcName), blob); if (e) { sh.println(e); return; }
    sh.println(`\n${arcName.toUpperCase()}: ${parts.length} file(s), ${blob.length} bytes. (It's bigger than before. Squashing text with text is hard. The RATIO says 40%. The ratio is lying.)`);
    S('squash');
  };
  function parseSqz(text) { if (!/^SQZ1 /.test(text)) return null; const out = []; const re = /::FILE (\S+) (\d+)\n([\s\S]*?)::END\n/g; let m; while ((m = re.exec(text))) out.push({ name: m[1], text: m[3] }); return out; }
  P.unsquash = async (sh, args) => {
    const a = sh.args(args || ''); sh.println('UNSQUASH 1.3  (C) 1999 Jack.');
    if (!a.length) { sh.println('Usage: UNSQUASH archive[.SQZ]'); return; }
    const arcName = /\./.test(a[0]) ? a[0] : a[0] + '.SQZ';
    const r = sh.resolve(arcName); if (r.err || !r.node) { sh.println('Archive not found'); return; }
    const parts = parseSqz(r.node.text || ''); if (!parts) { sh.println('Not a SQZ archive. (Did WinJack make it? WinJack is unregistered. Day 412.)'); return; }
    for (const p of parts) { const t = sh.resolve(p.name); if (t.node && !(t.node.dos || t.node.user)) { sh.println(`  ${p.name}: exists and is Jack's. Skipped.`); continue; } if (t.node) { sh.print(`  ${p.name} exists. Overwrite (Y/N)? `); const k = await sh.key('YN'); sh.println(k); if (k !== 'Y') continue; } const e = sh.writeFile(sh.resolve(p.name), p.text); sh.println(e ? `  ${p.name}: ${e}` : `  Unsquashing ${p.name}... OK`); }
  };

  // ================================================================ JACKSCAN: DOS anti-virus
  P.grotscan = (sh) => DOS.screenProg(sh, async (host, s) => {
    const W = s.cols, H = s.rows; host.setMouse(false);
    s.clear(0x17); s.fill(0, 0, W, 1, ' ', 0x4f); s.print(1, 0, 'JACKSCAN 99  -  JackNet Anti-Virus for DOS  -  14,203 viruses, 1 Gubbinz', 0x4f);
    s.box(1, 2, W - 2, H - 5, 0x1f, false, 'Scanning drive C:');
    const files = []; (function walk(n, p) { for (const k of n.kids || []) { if (k.type === 'dir') walk(k, p + '\\' + k.name); else files.push(p + '\\' + k.name); } })(A.fs.root, 'C:');
    const rows = H - 9; let line = 0, found = null;
    s.cur.on = false;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (line >= rows) { s.scroll(3, 2 + rows, 1, 0x1f); line = rows - 1; s.fill(2, 3 + line, W - 4, 1, ' ', 0x1f); }
      const bad = /GUBBINZ\.(EXE|VXD)|~FUNNY|TOTALLY_NOT/i.test(f);
      s.print(3, 3 + line, pad(f, W - 24), 0x1f); s.print(W - 20, 3 + line, bad ? ' !! GUBBINZ !!' : 'OK', bad ? 0x1c : 0x1a);
      if (bad && !found) found = f;
      line++;
      s.fill(0, H - 2, W, 1, ' ', 0x30); s.print(1, H - 2, `Scanned ${i + 1} of ${files.length}   Viruses: 0   Gubbinzes: ${found ? 1 : 0}   Esc=Stop`, 0x30);
      await host.sleep(i < 40 ? 35 : 6);
      const k = host.pollKey(); if (k && k.key === 'Escape') return;
    }
    S('grotscan');
    const r = await K.msgBox(host, `Scan complete. ${files.length} files.\n\nViruses found: 0\nDesktop helpers found: 1  (${found || 'C:\\JACKOS\\SYSTEM\\GUBBINZ.VXD'})\n\nGubbinz is not a virus. He is worse. He is PERMANENT.\nRemove Gubbinz?`, ['&Yes', '&No'], { attr: 0x70, left: true, width: 70 });
    if (r === 0) { await K.msgBox(host, 'Removing GUBBINZ...\n\nGUBBINZ: "Nah."\n\nGubbinz not removed. Gubbinz has eaten the quarantine folder.', ['OK'], { attr: 0x70 }); }
  });

  // ================================================================ CALC: a DOS calculator (safe little expression parser)
  function calcEval(src) {
    const t = src.replace(/\s+/g, '').toLowerCase(); let i = 0;
    const peek = () => t[i], next = () => t[i++];
    const num = () => { const m = /^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/.exec(t.slice(i)); if (!m) throw new Error('Syntax error'); i += m[0].length; return parseFloat(m[0]); };
    const FN = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, int: Math.trunc, ln: Math.log, log: Math.log10, exp: Math.exp, round: Math.round };
    const atom = () => { if (peek() === '(') { next(); const v = expr(); if (next() !== ')') throw new Error('Missing )'); return v; } if (peek() === '-') { next(); return -atom(); } if (/[a-z]/.test(peek() || '')) { const m = /^[a-z]+/.exec(t.slice(i)); i += m[0].length; if (m[0] === 'pi') return Math.PI; if (m[0] === 'e') return Math.E; if (m[0] === 'teef' || m[0] === 'rupees') return 10; if (m[0] === 'waaagh') return 1e6; if (!FN[m[0]]) throw new Error('Unknown function ' + m[0].toUpperCase()); if (next() !== '(') throw new Error('Missing ('); const v = expr(); if (next() !== ')') throw new Error('Missing )'); return FN[m[0]](v); } return num(); };
    const pow = () => { let b = atom(); if (peek() === '^') { next(); b = Math.pow(b, pow()); } return b; };
    const term = () => { let v = pow(); for (;;) { if (peek() === '*') { next(); v *= pow(); } else if (peek() === '/') { next(); const d = pow(); if (d === 0) throw new Error('Division by zero'); v /= d; } else if (peek() === '%') { next(); v %= pow(); } else return v; } };
    const expr = () => { let v = term(); for (;;) { if (peek() === '+') { next(); v += term(); } else if (peek() === '-') { next(); v -= term(); } else return v; } };
    const v = expr(); if (i < t.length) throw new Error('Syntax error'); return v;
  }
  P.calc = async (sh, args) => {
    const host = sh.host;
    if (args && args.trim()) { try { sh.println(String(calcEval(args))); } catch (e) { sh.println('Error: ' + e.message); } return; }
    sh.println('CALC 1.0 - type a sum, Enter. Functions: SQRT SIN COS TAN ABS INT LN LOG EXP ROUND. PI, E. Q to quit.');
    sh.println('(Mr Bell: "this is cheating". ' + Cast.n('teacher') + ': "this is automation". Mom: "do it in your head".)');
    let last = 0;
    for (;;) {
      sh.print('calc> '); const l = await K.readLine(host, {}); if (l == null || /^q(uit)?$/i.test(l.trim())) return;
      if (!l.trim()) continue;
      try { const v = calcEval(l.replace(/\bans\b/gi, '(' + last + ')')); last = v; const txt = Number.isInteger(v) ? String(v) : String(parseFloat(v.toPrecision(12))); sh.println('= ' + txt + (txt === '42' ? '   (six by nine. Dad laughed. Jack didn\'t get it.)' : txt === '54' && /6\s*\*\s*9|9\s*\*\s*6/.test(l) ? '   (that\'s the real one. 42 is the joke one.)' : txt === '1999' ? '   (the best year)' : '')); if (/6\s*\*\s*9|9\s*\*\s*6/.test(l)) S('calc'); }
      catch (e) { sh.println('Error: ' + e.message); }
    }
  };

  // ================================================================ HEXED: a hex editor for text files
  P.hexed = (sh, args) => DOS.screenProg(sh, async (host, s) => {
    const W = s.cols, H = s.rows;
    const name = sh.args(args || '')[0];
    if (!name) { await K.msgBox(host, 'HEXED filename\n\nOpens a text file as hex. Edit the numbers. Save with F2.\n(Only text files: DOS can\'t see inside a .EXE here. Dad says that\'s "for the best".)', ['OK']); return; }
    const r = sh.resolve(name); if (r.err || !r.node || r.isDir) { await K.msgBox(host, 'File not found', ['OK']); return; }
    if (!U.isText(r.node)) { await K.msgBox(host, 'HEXED can only open text files on this PC. The binary ones are glued shut.', ['OK']); return; }
    const bytes = [...String(r.node.text || '')].map(c => K.asc(c)); let pos = 0, top = 0, nib = 0, dirty = false, ascii = false;
    const per = W >= 80 ? 16 : 8, rows = H - 4;
    const draw = () => {
      s.clear(0x17); s.fill(0, 0, W, 1, ' ', 0x70); s.print(1, 0, `HEXED 1.0  ${r.node.name.toUpperCase()}  ${bytes.length} bytes${dirty ? '  *' : ''}`, 0x70);
      if (pos < top * per) top = Math.floor(pos / per); if (pos >= (top + rows) * per) top = Math.floor(pos / per) - rows + 1;
      for (let y = 0; y < rows; y++) { const off = (top + y) * per; if (off > bytes.length) break; s.print(1, 2 + y, hx(off, 8) + ':', 0x1b); for (let i = 0; i < per; i++) { const bi = off + i; if (bi >= bytes.length) { if (bi === bytes.length) s.print(11 + i * 3, 2 + y, '..', 0x18); continue; } const sel = bi === pos; s.print(11 + i * 3, 2 + y, hx(bytes[bi], 2), sel && !ascii ? 0x71 : 0x1f); const ch = K.chr(bytes[bi]); s.set(12 + per * 3 + i, 2 + y, bytes[bi] < 32 ? '.' : ch, sel && ascii ? 0x71 : 0x1e); } }
      s.fill(0, H - 1, W, 1, ' ', 0x30); s.print(1, H - 1, `Offset ${hx(pos, 4)}  ${ascii ? 'ASCII' : 'HEX'} mode  Tab=switch  F2=Save  Ins=insert  Del=delete  Esc=Quit`, 0x30);
      if (!ascii) { s.cur.x = 11 + (pos % per) * 3 + nib; s.cur.y = 2 + Math.floor(pos / per) - top; } else { s.cur.x = 12 + per * 3 + pos % per; s.cur.y = 2 + Math.floor(pos / per) - top; }
      s.cur.on = true;
    };
    draw();
    for (;;) {
      const e = await host.readEvent();
      if (e.type === 'mouse') { if (e.act === 'wheel') { top = Math.max(0, Math.min(Math.floor(bytes.length / per), top + e.dy * 2)); pos = Math.max(top * per, Math.min(bytes.length, pos)); } else if (e.act === 'down') { const y = e.y - 2; if (y >= 0 && y < rows) { const off = (top + y) * per; if (e.x >= 11 && e.x < 11 + per * 3) { ascii = false; pos = Math.min(bytes.length, off + Math.floor((e.x - 11) / 3)); } else if (e.x >= 12 + per * 3) { ascii = true; pos = Math.min(bytes.length, off + e.x - 12 - per * 3); } } } draw(); continue; }
      const k = e.key;
      if (k === 'Escape') { if (dirty) { const q = await K.msgBox(host, 'File changed. Save?', ['&Yes', '&No', '&Cancel']); if (q === 2) { draw(); continue; } if (q === 0) await save(); } return; }
      if (k === 'F2') { await save(); draw(); continue; }
      if (k === 'Tab') ascii = !ascii;
      else if (k === 'ArrowRight') { pos = Math.min(bytes.length, pos + 1); nib = 0; }
      else if (k === 'ArrowLeft') { pos = Math.max(0, pos - 1); nib = 0; }
      else if (k === 'ArrowDown') pos = Math.min(bytes.length, pos + per);
      else if (k === 'ArrowUp') pos = Math.max(0, pos - per);
      else if (k === 'PageDown') pos = Math.min(bytes.length, pos + per * rows);
      else if (k === 'PageUp') pos = Math.max(0, pos - per * rows);
      else if (k === 'Home') pos = 0; else if (k === 'End') pos = bytes.length;
      else if (k === 'Delete') { if (pos < bytes.length) { bytes.splice(pos, 1); dirty = true; } }
      else if (k === 'Backspace') { if (pos > 0) { bytes.splice(pos - 1, 1); pos--; dirty = true; } }
      else if (k === 'Insert') { bytes.splice(pos, 0, 32); dirty = true; }
      else if (e.ch) {
        if (ascii) { if (pos === bytes.length) bytes.push(0); bytes[pos] = K.asc(e.ch); pos = Math.min(bytes.length, pos + 1); dirty = true; }
        else if (/^[0-9a-fA-F]$/.test(e.ch)) { if (pos === bytes.length) bytes.push(0); const v = parseInt(e.ch, 16); bytes[pos] = nib === 0 ? (v << 4) | (bytes[pos] & 15) : (bytes[pos] & 0xf0) | v; dirty = true; if (nib === 0) nib = 1; else { nib = 0; pos = Math.min(bytes.length, pos + 1); } }
      }
      draw();
    }
    async function save() { const text = bytes.map(b => K.chr(b)).join(''); const e = sh.writeFile(sh.resolve(name), text); if (e) { await K.msgBox(host, e + (/(denied|Jack)/.test(e) ? '\n(Jack\'s files are read-only. Even in hex. ESPECIALLY in hex.)' : ''), ['OK']); return; } dirty = false; S('hexed'); }
  });
})();
