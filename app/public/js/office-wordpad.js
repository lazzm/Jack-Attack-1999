/* office-wordpad: WordPad (and Write, its JackOS 3.1 grandad). Rich text with execCommand, a ruler with tab stops,
 * format bar, Find/Replace, Page Setup, Print Preview, Insert Date and Time, and .doc/.rtf/.wri files on C:. */
(function () {
  'use strict';
  const K = window.OfficeKit; if (!K) return;
  const { A, esc, h, qs, qsa, on, tap, touchy, msg, toast, today, d99, nowTime, DAYS, MONTHS, ext, sfx, store } = K;
  const I = K.I;
  const FONTS = Object.keys(K.FONTSTACK);
  const syncFonts = () => { Object.keys(K.FONTSTACK).forEach(f => { if (!FONTS.includes(f)) FONTS.push(f); }); }; // fonts installed later (bridge-dl.js) join the list
  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  const COLNAMES = Object.keys(K.COLS);
  const TI = { // 16x16 toolbar icons
    new: '<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#000"/><path d="M9.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/></svg>',
    open: '<svg viewBox="0 0 16 16"><path d="M1.5 3.5h5l1.5 1.5h7v9h-13.5z" fill="#f2d16b" stroke="#7a5a00"/><path d="M1.5 7.5h13.5" stroke="#7a5a00"/></svg>',
    save: '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#000080" stroke="#000"/><rect x="4" y="2" width="8" height="5" fill="#fff"/><rect x="4" y="9" width="8" height="5" fill="#c0c0c0"/><rect x="9" y="3" width="2" height="3" fill="#000080"/></svg>',
    print: '<svg viewBox="0 0 16 16"><rect x="4" y="1.5" width="8" height="5" fill="#fff" stroke="#000"/><rect x="1.5" y="6.5" width="13" height="6" fill="#c0c0c0" stroke="#000"/><rect x="4" y="10.5" width="8" height="4" fill="#fff" stroke="#000"/><circle cx="12.5" cy="8.5" r=".8" fill="#0a0"/></svg>',
    preview: '<svg viewBox="0 0 16 16"><path d="M2.5 1.5h7l3 3v9h-10z" fill="#fff" stroke="#000"/><path d="M4 6h5M4 8h6M4 10h4" stroke="#808080"/><circle cx="11" cy="11" r="3" fill="#cfe8ff" stroke="#000"/><path d="M13 13l2 2" stroke="#000" stroke-width="1.5"/></svg>',
    find: '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="#cfe8ff" stroke="#000" stroke-width="1.3"/><path d="M10 10l4.5 4.5" stroke="#000" stroke-width="2"/></svg>',
    cut: '<svg viewBox="0 0 16 16"><path d="M10 2L5.5 10M6 2l4.5 8" stroke="#000" stroke-width="1.2"/><circle cx="4.5" cy="12" r="2" fill="none" stroke="#000"/><circle cx="11.5" cy="12" r="2" fill="none" stroke="#000"/></svg>',
    copy: '<svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="7" height="9" fill="#fff" stroke="#000"/><rect x="6.5" y="5.5" width="7" height="9" fill="#fff" stroke="#000"/><path d="M8 8h4M8 10h4M8 12h3" stroke="#808080"/></svg>',
    paste: '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="9" height="11" fill="#a0702a" stroke="#000"/><rect x="5" y="1.5" width="4" height="2" fill="#c0c0c0" stroke="#000"/><rect x="6.5" y="6.5" width="7" height="8" fill="#fff" stroke="#000"/><path d="M8 9h4M8 11h4" stroke="#808080"/></svg>',
    undo: '<svg viewBox="0 0 16 16"><path d="M4 6h6a3 3 0 0 1 0 6H6" fill="none" stroke="#000080" stroke-width="1.5"/><path d="M6 3L3 6l3 3" fill="none" stroke="#000080" stroke-width="1.5"/></svg>',
    date: '<svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="12" fill="#fff" stroke="#000"/><rect x="2" y="3" width="12" height="3" fill="#000080"/><path d="M4 9h2M7 9h2M10 9h2M4 12h2M7 12h2" stroke="#000"/></svg>',
    bold: '<svg viewBox="0 0 16 16"><text x="3" y="13" font-family="Times New Roman,serif" font-weight="bold" font-size="14">B</text></svg>',
    italic: '<svg viewBox="0 0 16 16"><text x="5" y="13" font-family="Times New Roman,serif" font-style="italic" font-size="14">I</text></svg>',
    under: '<svg viewBox="0 0 16 16"><text x="3.5" y="12" font-family="Times New Roman,serif" font-size="13">U</text><path d="M3 14h10" stroke="#000"/></svg>',
    colour: '<svg viewBox="0 0 16 16"><path d="M5 3l3 8M4 8h6M8 3l3 8" stroke="#000" stroke-width="1.3" fill="none"/></svg>',
    left: '<svg viewBox="0 0 16 16"><path d="M2 3h12M2 6h8M2 9h12M2 12h8" stroke="#000"/></svg>',
    center: '<svg viewBox="0 0 16 16"><path d="M2 3h12M4 6h8M2 9h12M4 12h8" stroke="#000"/></svg>',
    right: '<svg viewBox="0 0 16 16"><path d="M2 3h12M6 6h8M2 9h12M6 12h8" stroke="#000"/></svg>',
    bullets: '<svg viewBox="0 0 16 16"><circle cx="3" cy="4" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="3" cy="12" r="1.5"/><path d="M6 4h8M6 8h8M6 12h8" stroke="#000"/></svg>',
  };
  const DATEFMTS = () => { const t = today(), d = t.date, dd = DAYS[d.getDay()], mm = MONTHS[t.m - 1]; return [`${K.pad2(t.d)}/${K.pad2(t.m)}/99`, `${K.pad2(t.d)}/${K.pad2(t.m)}/1999`, `${t.d} ${mm} 1999`, `${dd}, ${t.d} ${mm} 1999`, `${dd} ${t.d} ${mm}, 1999`, `${mm} ${t.d}, 1999 (the American way)`, nowTime(), nowTime(true), `${K.pad2(t.d)}/${K.pad2(t.m)}/99 ${nowTime()}`, '1999 (it\'s always 1999)']; };
  const WRITE_HELP = `WRITE HELP\n==========\n\nWrite is the word processor that came with JackOS 3.1. It's like WordPod's grandad.\nIt can do bold, italic, underline, fonts, sizes and paragraphs. That's it. That was plenty in 1992.\n\nFiles are saved as .WRI (Write documents). WordPod can open them too, if you ask nicely.\n\n- Dad`;
  const HELP = `WORDPOD HELP
============

WordPod is for writing things that need to look nice. (Jotpad is for things that just need to exist.)

FORMATTING
  Select some words, then press Bold (Ctrl+B), Italic (Ctrl+I) or Underline (Ctrl+U), or pick a
  font, a size or a colour from the Format Bar. Alignment buttons line things up. The bullets
  button makes a list. (Lists make you look organised. Jack uses them for Christmas.)

THE RULER
  Click on the ruler to add a tab stop. Click a tab stop to remove it. Press Tab in the document to
  jump to the next one. The grey bits at the ends are the page margins.

FILES
  File > Save saves to C:\\My Documents as a Word document (.doc) or Rich Text (.rtf).
  Jack's own files are read-only, so you'll be asked for a new name. (He's protective.)

FINDING THINGS
  Edit > Find (Ctrl+F) looks for words. Replace (Ctrl+H) swaps them for other words.
  F3 finds the next one.

INSERT > DATE AND TIME
  Puts the date in. It is always 1999. (If it says otherwise, call the Year 2000 helpline.)

PRINTING
  File > Print Preview shows what the page would look like. File > Print tries the printer. The
  printer is out of cyan. It has been out of cyan since 1998.
`;

  function openWordPad(arg, mode) {
    arg = arg || {};
    const isWrite = mode === 'write';
    const appName = isWrite ? 'Write' : 'WordPod';
    const def = { font: isWrite ? 'Times New Roman' : 'Times New Roman', size: isWrite ? 12 : 10 };
    let node = arg.node || null, name = node ? node.name : (isWrite ? '(Untitled)' : 'Document'), kind = node ? (ext(node.name) || 'doc') : (isWrite ? 'wri' : 'doc');
    let savedHtml = '', tabs = [1, 2, 3, 4, 5, 6].map(i => i * 48), view = store.get('jhp_office_wpview', 'normal'), wrapWin = store.get('jhp_office_wpwrap', true);
    let pageSetup = store.get('jhp_office_wppage', { paper: 'A4', orient: 'Portrait', margins: 25 });
    let findQ = '', findCase = false, findWord = false;
    const b = h('', 'wp');
    b.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const w = K.win(name + ' - ' + appName, b, { w: 640, h: 480, menubar: true, status: true, icon: isWrite ? I.write : I.wordpad, minW: 280, minH: 200, cls: isWrite ? 'w31' : '' });
    // ---- toolbars
    const exec = (c, v) => { doc.focus(); document.execCommand(c, false, v); refresh(); };
    const tb = K.toolbar(isWrite ? [] : [
      { t: 'New', i: TI.new, a: () => newDoc() }, { t: 'Open', i: TI.open, a: () => openDlg() }, { t: 'Save', i: TI.save, a: () => save() }, '|',
      { t: 'Print', i: TI.print, a: () => print() }, { t: 'Print Preview', i: TI.preview, a: () => preview() }, { t: 'Find', i: TI.find, a: () => findDlg(false) }, '|',
      { t: 'Cut', i: TI.cut, a: () => exec('cut'), id: 'cut' }, { t: 'Copy', i: TI.copy, a: () => exec('copy'), id: 'copy' }, { t: 'Paste', i: TI.paste, a: () => paste() }, { t: 'Undo', i: TI.undo, a: () => exec('undo') }, '|',
      { t: 'Date/Time', i: TI.date, a: () => dateDlg() },
    ]);
    syncFonts();
    const fontSel = h(FONTS.map(f => `<option value="${esc(f)}" style="font-family:${K.FONTSTACK[f]}">${esc(f)}</option>`).join(''), 'wp-font', 'select'); fontSel.title = 'Font';
    const sizeSel = h(SIZES.map(s => `<option>${s}</option>`).join(''), 'wp-size', 'select'); sizeSel.title = 'Font Size';
    fontSel.value = def.font; sizeSel.value = String(def.size);
    on(fontSel, 'mousedown', ev => ev.stopPropagation());
    on(fontSel, 'change', () => { applyStyle('fontFamily', K.FONTSTACK[fontSel.value] || fontSel.value); });
    on(sizeSel, 'change', () => { applyStyle('fontSize', sizeSel.value + 'pt'); if (+sizeSel.value >= 72) K.secret('wpbig'); });
    const fmt = K.toolbar([
      { el: fontSel }, { el: sizeSel }, '|',
      { t: 'Bold (Ctrl+B)', i: TI.bold, a: () => exec('bold'), id: 'bold' }, { t: 'Italic (Ctrl+I)', i: TI.italic, a: () => exec('italic'), id: 'italic' }, { t: 'Underline (Ctrl+U)', i: TI.under, a: () => exec('underline'), id: 'underline' },
      { t: 'Colour', i: TI.colour + '<i></i>', a: bt => colourMenu(bt), id: 'colour' }, '|',
      { t: 'Align Left', i: TI.left, a: () => exec('justifyLeft'), id: 'justifyLeft' }, { t: 'Center', i: TI.center, a: () => exec('justifyCenter'), id: 'justifyCenter' }, { t: 'Align Right', i: TI.right, a: () => exec('justifyRight'), id: 'justifyRight' }, '|',
      { t: 'Bullets', i: TI.bullets, a: () => exec('insertUnorderedList'), id: 'insertUnorderedList' },
    ], 'wp-fmt');
    fmt.btns.colour.classList.add('wp-col'); qs(fmt.btns.colour, 'i').style.color = '#000';
    const ruler = h('', 'wp-ruler');
    const page = h('<div class="wp-doc" contenteditable="true" spellcheck="false" aria-label="Document"></div>', 'wp-page');
    const doc = qs(page, '.wp-doc');
    b.append(tb, fmt, ruler, page);
    const [stPos] = K.statusParts(w, ['']);
    if (isWrite) { tb.remove(); fmt.style.display = 'none'; b.classList.add('wp-write'); }
    // ---- ruler
    function drawRuler() {
      const W = Math.max(200, doc.clientWidth), m = view === 'page' ? 48 : 20, inner = W - m * 2;
      let s = `<div class="wp-rm" style="left:0;width:${m}px"></div><div class="wp-rm" style="left:${m + inner}px;right:0"></div>`;
      const cm = 37.8; // px per cm
      for (let x = 0, i = 0; x <= inner + 1; x += cm / 4, i++) { const big = i % 4 === 0; s += `<div class="wp-rt${big ? ' big' : ''}" style="left:${(m + x).toFixed(1)}px"></div>`; if (big && i) s += `<div class="wp-rn" style="left:${(m + x).toFixed(1)}px">${i / 4}</div>`; }
      tabs.forEach(t => { if (t < inner) s += `<div class="wp-tab" data-t="${t}" style="left:${m + t - 3}px" title="Tab stop (click to remove)"></div>`; });
      s += `<div class="wp-ind l" style="left:${m - 5}px" title="Left indent"></div><div class="wp-ind r" style="left:${m + inner - 5}px" title="Right indent"></div>`;
      ruler.innerHTML = s;
      doc.style.setProperty('--wp-tab', (tabs[0] || 48) + 'px');
    }
    on(ruler, 'click', ev => {
      const t = ev.target.closest('.wp-tab');
      const m = view === 'page' ? 48 : 20;
      if (t) { tabs = tabs.filter(x => x !== +t.dataset.t); }
      else if (!ev.target.closest('.wp-ind')) { const x = Math.round((ev.clientX - ruler.getBoundingClientRect().left - m) / 4) * 4; if (x > 4 && !tabs.includes(x)) tabs.push(x); tabs.sort((a, c) => a - c); }
      else return;
      drawRuler(); applyTabs(); stPos.textContent = `Tab stops: ${tabs.map(t => (t / 37.8).toFixed(1) + 'cm').join(', ') || 'none'}`;
    });
    function applyTabs() { qsa(doc, '.of-tab').forEach(t => { const x = t.offsetLeft - doc.offsetLeft - (view === 'page' ? 48 : 20); const next = tabs.find(s => s > x + 2); t.style.width = Math.max(6, next ? next - x : 48) + 'px'; }); }
    const RO = new ResizeObserver(() => { drawRuler(); applyTabs(); }); RO.observe(doc);
    // ---- content
    const setDoc = (html, font, size) => { doc.innerHTML = K.clean(html) || '<div><br></div>'; doc.style.fontFamily = K.FONTSTACK[font] || font || K.FONTSTACK['Times New Roman']; doc.style.fontSize = (size || def.size) + 'pt'; fontSel.value = FONTS.includes(font) ? font : def.font; sizeSel.value = String(size || def.size); savedHtml = doc.innerHTML; applyTabs(); changed = false; };
    const textToHtml = t => String(t || '').split('\n').map(l => `<div>${esc(l).replace(/\t/g, '<span class="of-tab" contenteditable="false"></span>') || '<br>'}</div>`).join('');
    function loadNode(n) {
      node = n; name = n.name; kind = ext(n.name) || 'doc';
      K.readDoc(n).then(d => {
        if (d && typeof d === 'object' && d.md) setDoc(K.md(d.md), d.font, d.size);
        else if (d && typeof d === 'object' && d.html) setDoc(d.html, d.font, d.size);
        else setDoc(textToHtml(typeof d === 'string' ? d : (n.text || '')), isWrite ? 'Times New Roman' : 'Courier New', 10);
        if (n.ofk === 'plans') plansWatch();
        if (n.secret) A.secret(n.secret);
        w.setTitle(name + ' - ' + appName);
        doc.scrollTop = 0; page.scrollTop = 0;
      });
    }
    let changed = false, wpSv = null;
    const wpSave = () => { if (wpSv) wpSv.save(); };
    const dirty = () => changed;
    const current = () => ({ html: doc.innerHTML, font: fontSel.value, size: +sizeSel.value });
    function newDoc() { confirmLeave(() => { node = null; name = isWrite ? '(Untitled)' : 'Document'; kind = isWrite ? 'wri' : 'doc'; setDoc('<div><br></div>', def.font, def.size); wpSave(); w.setTitle(name + ' - ' + appName); }); }
    function confirmLeave(next) { if (!dirty()) return next(); K.askSave(appName, name, save, next); }
    K.guardClose(w, appName, () => name, dirty, save);
    // ---- open / save
    const TYPES = isWrite ? [['Write Documents (*.wri)', ['wri']], ['Word Documents (*.doc)', ['doc']], ['Text Documents (*.txt)', ['txt']], ['All Documents (*.*)', ['*']]]
      : [['Word for JackOS 6.0 (*.doc)', ['doc']], ['Rich Text Format (*.rtf)', ['rtf']], ['Text Documents (*.txt)', ['txt']], ['Write Documents (*.wri)', ['wri']], ['All Documents (*.*)', ['*']]];
    function openDlg() { K.fileDlg({ mode: 'open', title: 'Open', types: TYPES, dir: node ? K.pathOf(node) : K.MD, icon: isWrite ? I.write : I.wordpad }, n => confirmLeave(() => { if (n.type === 'dir' || (n.type !== 'txt' && n.type !== 'doc' && n.type !== 'rtf' && n.type !== 'wri' && !n.ofk)) return msg(appName, `${n.name}\n\n${appName} can't open this kind of file. It's not words.`, 'warn'); loadNode(n); })); }
    function save(then) {
      if (node && node.user) return write(K.pathOf(node), node.name, then);
      if (node && !node.user) return msg(appName, `${name}\n\nThis file is read-only. (It's one of Jack's.)\n\nSave a copy with a different name?`, 'warn', [['Save As...', () => saveAs(then)], ['Cancel']]);
      saveAs(then);
    }
    function saveAs(then) {
      const base = node ? node.name.replace(/\.[a-z0-9]+$/i, '') : name === 'Document' || name === '(Untitled)' ? '' : name;
      K.fileDlg({ mode: 'save', title: 'Save As', types: TYPES.filter(t => t[1][0] !== '*'), name: base ? base + '.' + (kind === 'txt' ? 'doc' : kind) : '', dir: node ? K.pathOf(node) : K.MD, typeIndex: Math.max(0, TYPES.findIndex(t => t[1][0] === kind)), icon: isWrite ? I.write : I.wordpad }, t => write(t.dir, t.name, then));
    }
    function write(dir, fname, then) {
      const k = ext(fname);
      const n = k === 'txt' ? K.saveUser(dir, fname, 'txt', doc.innerText.replace(/\u00a0/g, ' ')) : K.saveUser(dir, fname, k, current());
      if (!n) return;
      node = n; name = fname; kind = k; savedHtml = doc.innerHTML; changed = false; wpSave(); w.setTitle(name + ' - ' + appName);
      if (k === 'txt') toast(appName, `Saved as plain text. All your lovely fonts went in the bin.`, 3000); else toast(appName, `Saved to ${dir.replace(/\//g, '\\')}\\${fname}`, 2500);
      K.secret('wpsave'); if (then) then();
    }
    // ---- formatting state
    function applyStyle(prop, val) {
      doc.focus();
      const sel = getSelection();
      if (!sel.rangeCount || sel.isCollapsed) { doc.style[prop] = val; return; }
      document.execCommand('styleWithCSS', false, true);
      if (prop === 'fontFamily') document.execCommand('fontName', false, val);
      else if (prop === 'fontSize') { document.execCommand('fontSize', false, 7); qsa(doc, 'font[size="7"]').forEach(f => { const s = h('', null, 'span'); s.style.fontSize = val; s.innerHTML = f.innerHTML; f.replaceWith(s); }); }
      else if (prop === 'color') document.execCommand('foreColor', false, val);
      refresh();
    }
    function colourMenu(bt) {
      const r = bt.getBoundingClientRect();
      const m = IE.menu([{ label: 'Automatic', act: () => applyStyle('color', '#000000') }, '-', ...COLNAMES.map(c => ({ label: c[0].toUpperCase() + c.slice(1), icon: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="${K.COLS[c]}" stroke="#000"/></svg>`, act: () => { applyStyle('color', K.COLS[c]); qs(bt, 'i').style.color = K.COLS[c]; } }))], r.left, r.bottom);
      m.style.columns = '2';
    }
    function refresh() {
      ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertUnorderedList'].forEach(c => { let st = false; try { st = document.queryCommandState(c); } catch (e) {} fmt.btns[c].classList.toggle('on', st); });
      try { const f = document.queryCommandValue('fontName').replace(/["']/g, '').split(',')[0]; const hit = FONTS.find(x => x.toLowerCase() === f.toLowerCase()); if (hit) fontSel.value = hit; } catch (e) {}
      const sel = getSelection(); const n = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
      if (n && doc.contains(n)) { const cs = getComputedStyle(n), pt = Math.round(parseFloat(cs.fontSize) * 72 / 96); if (SIZES.includes(pt)) sizeSel.value = String(pt); qs(fmt.btns.colour, 'i').style.color = cs.color; }
      const words = doc.innerText.trim().split(/\s+/).filter(Boolean).length;
      stPos.textContent = `${words} word${words === 1 ? '' : 's'}${sel && !sel.isCollapsed ? ' (' + String(sel).trim().split(/\s+/).filter(Boolean).length + ' selected)' : ''}`;
    }
    on(document, 'selectionchange', () => { if (!w.closed && doc.contains(document.activeElement)) refresh(); });
    on(doc, 'input', () => { changed = true; wpSave(); applyTabs(); refresh(); });
    on(doc, 'keydown', ev => {
      const k = ev.key.toLowerCase(), c = ev.ctrlKey || ev.metaKey;
      if (ev.key === 'Tab') { ev.preventDefault(); document.execCommand('insertHTML', false, '<span class="of-tab" contenteditable="false"></span>'); applyTabs(); }
      else if (c && k === 's') { ev.preventDefault(); save(); }
      else if (c && k === 'o') { ev.preventDefault(); openDlg(); }
      else if (c && k === 'n') { ev.preventDefault(); newDoc(); }
      else if (c && k === 'f') { ev.preventDefault(); findDlg(false); }
      else if (c && k === 'h') { ev.preventDefault(); findDlg(true); }
      else if (c && k === 'p') { ev.preventDefault(); print(); }
      else if (c && k === 'l') { ev.preventDefault(); exec('justifyLeft'); }
      else if (c && k === 'e') { ev.preventDefault(); exec('justifyCenter'); }
      else if (c && k === 'r') { ev.preventDefault(); exec('justifyRight'); }
      else if (ev.key === 'F3') { ev.preventDefault(); findNext(); }
      else if (ev.key === 'F5') { ev.preventDefault(); if (isWrite) exec('removeFormat'); else dateDlg(); }
      else if (c && k === 'a') setTimeout(() => plansCheck(), 50);
    });
    on(doc, 'paste', ev => { ev.preventDefault(); const t = (ev.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
    const paste = () => { doc.focus(); const p = navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject(); p.then(t => { if (t) document.execCommand('insertText', false, t); }, () => document.execCommand('paste')); };
    // the invisible-ink secret in Top Secret Plans.doc
    let plansOn = false;
    const plansWatch = () => { plansOn = true; };
    const plansCheck = () => { if (!plansOn) return; const sel = getSelection(); if (!sel.rangeCount) return; const hid = qs(doc, '.of-hidden'); if (hid && sel.containsNode(hid, true)) { K.secret('wpplans'); qsa(doc, '.of-hidden').forEach(e => e.classList.add('wp-found')); } };
    on(doc, 'mouseup', () => setTimeout(plansCheck, 30)); on(doc, 'touchend', () => setTimeout(plansCheck, 30));
    // ---- find / replace
    function findNext(fromStart) {
      if (!findQ) return findDlg(false);
      doc.focus();
      let ok = false;
      try { ok = window.find(findQ, findCase, false, false, findWord, false, false); } catch (e) {}
      if (!ok || !doc.contains(getSelection().anchorNode)) { if (!fromStart) { getSelection().collapse(doc, 0); return findNext(true); } msg(appName, `${appName} has finished searching the document.\n\n"${findQ}" was not found${fromStart ? ' anywhere' : ''}.`, 'info'); return false; }
      return true;
    }
    function findDlg(replace) {
      const d = K.dialog(replace ? 'Replace' : 'Find', `<div class="of-grid2"><label>Find what:</label><input type="text" class="fq" autocomplete="off">${replace ? '<label>Replace with:</label><input type="text" class="fr" autocomplete="off">' : ''}</div>
        <div class="row" style="margin-top:8px"><label><input type="checkbox" class="fw"> Match whole word only</label><label><input type="checkbox" class="fc"> Match case</label></div>`,
        replace ? [['Find Next', () => { grab(); return findNext() === true ? false : false; }], ['Replace', () => { grab(); const s = getSelection(); if (!s.isCollapsed && String(s).toLowerCase() === findQ.toLowerCase()) { document.execCommand('insertText', false, qs(d.b, '.fr').value); } findNext(); return false; }], ['Replace All', () => { grab(); let n = 0; getSelection().collapse(doc, 0); while (n < 500 && findNext(true) === true) { document.execCommand('insertText', false, qs(d.b, '.fr').value); n++; if (!qs(d.b, '.fr').value && !findQ) break; } msg(appName, `${n} occurrence${n === 1 ? '' : 's'} replaced.`, 'info'); return false; }], ['Cancel']]
          : [['Find Next', () => { grab(); findNext(); return false; }], ['Cancel']], { w: 380, side: true, icon: I.wordpad });
      const grab = () => { findQ = qs(d.b, '.fq').value; findCase = qs(d.b, '.fc').checked; findWord = qs(d.b, '.fw').checked; };
      qs(d.b, '.fq').value = findQ || String(getSelection()).trim().slice(0, 40);
    }
    // ---- insert date/time
    function dateDlg() {
      const fmts = DATEFMTS();
      const d = K.dialog('Date and Time', `<p>Available formats:</p><div class="field of-list" style="height:150px">${fmts.map((f, i) => `<div class="it${i === 3 ? ' sel' : ''}" data-i="${i}">${esc(f)}</div>`).join('')}</div>`,
        [['OK', bb => { const s = qs(bb, '.it.sel'); const i = s ? +s.dataset.i : 0; doc.focus(); document.execCommand('insertText', false, fmts[i]); if (i === 3 || i === 4) K.secret('wpstamp'); }], ['Cancel']], { w: 340, side: true, icon: I.wordpad });
      on(qs(d.b, '.of-list'), 'click', ev => { const it = ev.target.closest('.it'); if (!it) return; qsa(d.b, '.it').forEach(x => x.classList.toggle('sel', x === it)); });
      on(qs(d.b, '.of-list'), 'dblclick', () => qs(d.form, 'button').click());
    }
    // ---- page setup / print / preview
    function pageDlg() {
      const d = K.dialog('Page Setup', `<div class="of-grid2"><label>Paper size:</label><select class="ps"><option>A4 (210 x 297 mm)</option><option>Letter (8.5 x 11 in)</option><option>A5 (148 x 210 mm)</option><option>Legal (8.5 x 14 in)</option><option>Envelope DL (110 x 220 mm)</option><option>Napkin (Dad's idea)</option></select>
        <label>Source:</label><select><option>Automatically Select</option><option>Upper Tray (the only tray)</option><option>Manual Feed (shout at it)</option></select></div>
        <fieldset class="group" style="margin-top:10px"><span class="lg">Orientation</span><label><input type="radio" name="or" value="Portrait" checked> Portrait</label> &nbsp; <label><input type="radio" name="or" value="Landscape"> Landscape</label></fieldset>
        <fieldset class="group"><span class="lg">Margins (millimetres)</span><div class="of-grid2"><label>Left:</label><input type="number" class="ml" min="0" max="80" value="25"><label>Right:</label><input type="number" class="mr" min="0" max="80" value="25"><label>Top:</label><input type="number" class="mt" min="0" max="80" value="25"><label>Bottom:</label><input type="number" class="mb" min="0" max="80" value="25"></div></fieldset>`,
        [['OK', bb => { pageSetup = { paper: qs(bb, '.ps').value.split(' ')[0], orient: qs(bb, 'input[name=or]:checked').value, margins: +qs(bb, '.ml').value || 0 }; store.set('jhp_office_wppage', pageSetup); if (pageSetup.paper === 'Napkin') toast('Page Setup', 'Paper: napkin. The printer has refused. It has standards.', 3500); }], ['Cancel'], ['Printer...', () => { msg('Printer', 'Epsom Stylus Color 440 on LPT1\n\nStatus: Out of cyan.\nPaper: 3 sheets (one is slightly wrinkled).\nInk: magenta, yellow, black, and a memory of cyan.', 'info'); return false; }]], { w: 380, icon: I.wordpad });
      const o = qs(d.b, `input[value="${pageSetup.orient}"]`); if (o) o.checked = true;
      qsa(d.b, 'input[type=number]').forEach(i => { i.value = pageSetup.margins; });
      qs(d.b, '.ps').selectedIndex = Math.max(0, ['A4', 'Letter', 'A5', 'Legal', 'Envelope', 'Napkin'].indexOf(pageSetup.paper));
    }
    function print() {
      const d = K.dialog('Print', `<div class="of-grid2"><label>Name:</label><select><option>Epsom Stylus Color 440</option><option>JackNet Fax</option><option>Print to File (a .PRN, whatever that is)</option></select><label>Status:</label><span class="of-small">Out of cyan (ready-ish)</span><label>Where:</label><span class="of-small">LPT1: (the big plug)</span></div>
        <fieldset class="group" style="margin-top:10px"><span class="lg">Print range</span><label><input type="radio" name="pr" checked> All</label> &nbsp; <label><input type="radio" name="pr"> Pages</label> &nbsp; <label><input type="radio" name="pr"> Selection</label></fieldset>
        <div class="of-grid2" style="margin-top:6px"><label>Number of copies:</label><input type="number" class="cp" min="1" max="99" value="1" style="width:60px"></div>`,
        [['OK', bb => { const n = +qs(bb, '.cp').value || 1; const pages = Math.max(1, Math.ceil(doc.innerText.length / 2800)); const pr = h(`<div class="of-small">Printing ${esc(name)} on Epsom Stylus Color 440<br>Page 1 of ${pages}, copy 1 of ${n}</div><div class="prog" style="margin:8px 0"><span style="display:flex;gap:2px"></span></div>`); const pw = A.win('Printing', pr, { w: 320, noResize: true, noMax: true, noMin: true, icon: I.wordpad }); const bar = qs(pr, '.prog span'); let i = 0; const t = setInterval(() => { if (pw.closed) return clearInterval(t); if (++i <= 11) bar.appendChild(document.createElement('i')); if (i === 12) { clearInterval(t); pw.close(); sfx('uhoh'); msg('Epsom Stylus Color 440', `Printing stopped.\n\nThe printer is out of cyan. ${n > 1 ? 'All ' + n + ' copies' : 'Your document'} came out in a lovely shade of "sunset". The paper also jammed.\n\nMom says to stop pressing Print.`, 'warn'); } }, 180); }], ['Cancel']], { w: 380, icon: I.wordpad });
    }
    function preview() {
      K.secret('wppreview');
      const txt = doc.innerText, perPage = 2600, pages = Math.max(1, Math.ceil(txt.length / perPage));
      const pb = h('', 'wp');
      pb.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
      let zoom = 1, pg = 1, two = false;
      pb.innerHTML = `<div class="wp-prevbar"><button class="btn" data-a="print">Print...</button><button class="btn" data-a="next">Next Page</button><button class="btn" data-a="prev">Prev Page</button><button class="btn" data-a="two">Two Page</button><button class="btn" data-a="zi">Zoom In</button><button class="btn" data-a="zo">Zoom Out</button><button class="btn" data-a="x">Close</button></div><div class="wp-prev"></div>`;
      const pw = K.win(name + ' - ' + appName + ' (Print Preview)', pb, { w: 560, h: 520, status: true, icon: I.wordpad, minW: 260, minH: 200 });
      const stage = qs(pb, '.wp-prev');
      function draw() {
        stage.innerHTML = '';
        const show = two ? [pg, pg + 1].filter(p => p <= pages) : [pg];
        show.forEach(p => { const el = h('', 'wp-prevpg' + (zoom === 2 ? ' z2' : '')); const inner = h(doc.innerHTML); inner.style.fontFamily = doc.style.fontFamily; inner.style.transform = `scale(${zoom === 2 ? 1 : 0.5})`; inner.style.width = (zoom === 2 ? 100 : 200) + '%'; inner.style.marginTop = `-${(p - 1) * (zoom === 2 ? 744 : 1488)}px`; el.appendChild(inner); el.appendChild(h(`Page ${p}`, 'wp-pgn')); stage.appendChild(el); });
        pw.status.textContent = `Page ${pg}${two && pg < pages ? '-' + (pg + 1) : ''} of ${pages}   ${pageSetup.paper} ${pageSetup.orient}   Zoom ${zoom === 2 ? '100' : '50'}%`;
        qs(pb, '[data-a=next]').disabled = pg >= pages; qs(pb, '[data-a=prev]').disabled = pg <= 1;
      }
      on(qs(pb, '.wp-prevbar'), 'click', ev => { const a = ev.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'x') pw.close(); else if (k === 'print') print(); else if (k === 'next') pg = Math.min(pages, pg + 1); else if (k === 'prev') pg = Math.max(1, pg - 1); else if (k === 'two') { two = !two; a.textContent = two ? 'One Page' : 'Two Page'; } else if (k === 'zi') zoom = 2; else if (k === 'zo') zoom = 1; draw(); });
      draw();
    }
    // ---- menus
    const viewMenu = () => [
      { label: 'Toolbar', chk: tb.style.display !== 'none', dis: isWrite, act: () => { tb.style.display = tb.style.display === 'none' ? '' : 'none'; } },
      { label: 'Format Bar', chk: fmt.style.display !== 'none', act: () => { fmt.style.display = fmt.style.display === 'none' ? '' : 'none'; } },
      { label: 'Ruler', chk: ruler.style.display !== 'none', act: () => { ruler.style.display = ruler.style.display === 'none' ? '' : 'none'; } },
      { label: 'Status Bar', chk: w.status.parentNode.style.display !== 'none', act: () => { const s = w.status.parentNode; s.style.display = s.style.display === 'none' ? '' : 'none'; } },
      '-',
      { label: 'Normal', rad: view === 'normal', act: () => setView('normal') }, { label: 'Page Layout', rad: view === 'page', act: () => setView('page') },
      '-',
      { label: 'Options...', act: () => { const d = K.dialog('Options', `<div class="tabs"><span class="on">Options</span><span>Text</span><span>Rich Text</span><span>Word</span><span>Write</span></div><div class="tabpage"><fieldset class="group" style="margin-top:4px"><span class="lg">Word wrap</span><label><input type="radio" name="ww" value="win" ${wrapWin ? 'checked' : ''}> Wrap to window</label><br><label><input type="radio" name="ww" value="ruler" ${!wrapWin ? 'checked' : ''}> Wrap to ruler</label><br><label><input type="radio" name="ww" value="no"> No wrap (go on, try it)</label></fieldset><fieldset class="group"><span class="lg">Measurement units</span><label><input type="radio" name="mu" checked> Centimetres</label> <label><input type="radio" name="mu"> Inches</label> <label><input type="radio" name="mu"> BLOCKO bricks (1 brick = 9.6mm)</label></fieldset><label><input type="checkbox" checked> Automatic word selection</label></div>`, [['OK', bb => { const v = qs(bb, 'input[name=ww]:checked').value; if (v === 'no') { toast('Options', 'No wrap selected. Your sentences now go on forever, to the right. Like Dad\'s stories.', 4000); doc.style.whiteSpace = 'nowrap'; } else { doc.style.whiteSpace = ''; wrapWin = v === 'win'; store.set('jhp_office_wpwrap', wrapWin); setView(view); } }], ['Cancel']], { w: 380, icon: I.wordpad }); qsa(d.b, '.tabs span').forEach((t, i) => tap(t, () => { qsa(d.b, '.tabs span').forEach(x => x.classList.toggle('on', x === t)); if (i) toast('Options', ['', 'Text: for .txt files. There are no options. It\'s text.', 'Rich Text: the same options, but richer.', 'Word: these options are also the same. Jacksoft would like you to think otherwise.', 'Write: Dad used Write on his old computer. It had ONE option. It was "wrap".'][i], 3500); })); } },
    ];
    function setView(v) { view = v; store.set('jhp_office_wpview', v); doc.dataset.view = v; page.classList.toggle('plainbg', v === 'normal'); doc.style.maxWidth = v === 'normal' && !wrapWin ? '700px' : ''; drawRuler(); applyTabs(); }
    const fontDlg = () => {
      const d = K.dialog('Font', `<div class="of-grid2"><label>Font:</label><select class="ff">${FONTS.map(f => `<option${f === fontSel.value ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select><label>Font style:</label><select class="fs"><option>Regular</option><option>Italic</option><option>Bold</option><option>Bold Italic</option></select><label>Size:</label><select class="fz">${SIZES.map(s => `<option${String(s) === sizeSel.value ? ' selected' : ''}>${s}</option>`).join('')}</select><label>Colour:</label><select class="fc">${COLNAMES.map(c => `<option value="${K.COLS[c]}">${c[0].toUpperCase() + c.slice(1)}</option>`).join('')}</select></div><fieldset class="group"><span class="lg">Effects</span><label><input type="checkbox" class="fk"> Strikeout</label> &nbsp; <label><input type="checkbox" class="fu"> Underline</label></fieldset><fieldset class="group"><span class="lg">Sample</span><div class="field" style="padding:6px;text-align:center;height:46px;overflow:hidden;display:flex;align-items:center;justify-content:center"><span class="fsamp">AaBbYyZz</span></div></fieldset>`,
        [['OK', bb => { applyStyle('fontFamily', K.FONTSTACK[qs(bb, '.ff').value]); applyStyle('fontSize', qs(bb, '.fz').value + 'pt'); applyStyle('color', qs(bb, '.fc').value); const st = qs(bb, '.fs').value; if (/Bold/.test(st) !== (document.queryCommandState('bold'))) exec('bold'); if (/Italic/.test(st) !== (document.queryCommandState('italic'))) exec('italic'); if (qs(bb, '.fk').checked) exec('strikeThrough'); if (qs(bb, '.fu').checked) exec('underline'); if (+qs(bb, '.fz').value >= 72) K.secret('wpbig'); }], ['Cancel']], { w: 400, icon: I.wordpad });
      const samp = qs(d.b, '.fsamp'), upd = () => { samp.style.fontFamily = K.FONTSTACK[qs(d.b, '.ff').value]; samp.style.fontSize = Math.min(28, +qs(d.b, '.fz').value) + 'pt'; samp.style.color = qs(d.b, '.fc').value; const st = qs(d.b, '.fs').value; samp.style.fontWeight = /Bold/.test(st) ? 'bold' : 'normal'; samp.style.fontStyle = /Italic/.test(st) ? 'italic' : 'normal'; samp.style.textDecoration = (qs(d.b, '.fk').checked ? 'line-through ' : '') + (qs(d.b, '.fu').checked ? 'underline' : ''); };
      qsa(d.b, 'select,input').forEach(e => on(e, 'change', upd)); upd();
    };
    const paraDlg = () => K.dialog('Paragraph', `<fieldset class="group" style="margin-top:4px"><span class="lg">Indentation</span><div class="of-grid2"><label>Left:</label><input type="number" class="pl" min="0" max="10" step="0.5" value="0"><label>Right:</label><input type="number" min="0" max="10" step="0.5" value="0"><label>First line:</label><input type="number" class="pf" min="0" max="10" step="0.5" value="0"></div></fieldset><div class="of-grid2"><label>Alignment:</label><select class="pa"><option>Left</option><option>Center</option><option>Right</option></select></div>`,
      [['OK', bb => { exec('justify' + qs(bb, '.pa').value); const n = getSelection().anchorNode; const blk = n && (n.nodeType === 1 ? n : n.parentElement).closest('.wp-doc > *'); if (blk) { blk.style.marginLeft = (+qs(bb, '.pl').value || 0) + 'cm'; blk.style.textIndent = (+qs(bb, '.pf').value || 0) + 'cm'; } }], ['Cancel']], { w: 340, icon: I.wordpad });
    const insertObj = () => K.dialog('Insert Object', `<p>Object type:</p><div class="field of-list"><div class="it sel">Bitmap Image</div><div class="it">JackCalc Chart</div><div class="it">Package</div><div class="it">Wave Sound</div><div class="it">Gubbinz (Helper)</div><div class="it">Video Clip</div></div><p class="of-small" style="margin-top:6px">Result: inserts a new object into your document. Probably.</p>`,
      [['OK', bb => { const t = qs(bb, '.it.sel').textContent; doc.focus(); if (t === 'Bitmap Image') { const pics = (A.fs.get('C:/My Documents/My Pictures') || { kids: [] }).kids.filter(k => k.type === 'img' || k.dataURL); const p = pics.length ? K.pick(pics) : null; let url = ''; if (p && p.dataURL) url = p.dataURL; else if (p && window.JackFiles && JackFiles.art) { try { url = JackFiles.art(p.art).toDataURL(); } catch (e) {} } if (url) { document.execCommand('insertHTML', false, `<img src="${url}" width="120" alt="${esc(p.name)}" style="image-rendering:pixelated">`); toast('Insert Object', `Inserted ${p.name}. (Picked at random. Objects are mysterious.)`, 3000); } else msg('Insert Object', 'No pictures found in My Pictures. Draw one in Paint first!', 'warn'); } else if (t === 'Gubbinz (Helper)') { document.execCommand('insertText', false, ' [OBJECT: Gubbinz. He has already eaten the object. Sorry.] '); K.secret('packager'); } else if (t === 'JackCalc Chart') { document.execCommand('insertText', false, ' [JackCalc Chart: bar chart of Pocket Money. The bars are small.] '); } else msg('Insert Object', `${t}: The server application could not be started. (It's 1999. Everything is a server application.)`, 'warn'); }], ['Cancel']], { w: 340, side: true, icon: I.wordpad }).b.addEventListener('click', ev => { const it = ev.target.closest('.it'); if (it) qsa(it.parentNode, '.it').forEach(x => x.classList.toggle('sel', x === it)); });
    function about() {
      const d = K.dialog('About ' + appName, `<div class="wp-about"><span class="wp-face" title="Click me">${I.wordpad.replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16" width="48" height="48"')}</span><div><p><b>JackOS ${appName}</b><br>Version ${isWrite ? '3.1 (1992)' : '4.10.1999'}</p><p>${isWrite ? 'From Dad\'s old computer. Still works. Still beige.' : 'A word processor with fonts, colours, a ruler and no spell checker. (Mrs Hargreaves is the spell checker.)'}</p><p>This product is licensed to:<br>Jack (and his Mom)</p><p class="of-small">Physical memory available to JackOS: 65,024 KB</p></div></div>`, [['OK']], { w: 360, icon: isWrite ? I.write : I.wordpad });
      let n = 0; tap(qs(d.b, '.wp-face'), () => { if (++n === 7) { K.secret('wpabout'); qs(d.b, 'div > div').innerHTML = `<p><b>WORDPOD CREDITS</b></p><p>Programming: Jack<br>Fonts: whoever made fonts<br>Ruler: the one from Jack's pencil case<br>Testing: Dave (found 1 bug, caused 3)<br>Catering: Mom<br>Helper: Gubbinz</p><p class="of-small">Thanks for clicking seven times. Nobody clicks seven times.</p>`; } });
    }
    const tabsDlg = () => K.dialog('Tabs', `<div class="of-grid2"><label>Tab stop position (cm):</label><input type="number" class="tp" min="0.5" max="16" step="0.5" value="1"></div><p class="of-small" style="margin-top:6px">Current: ${tabs.map(t => (t / 37.8).toFixed(1)).join(', ') || 'none'}</p>`, [['Set', bb => { const px = Math.round(+qs(bb, '.tp').value * 37.8); if (px && !tabs.includes(px)) tabs.push(px); tabs.sort((a, c) => a - c); drawRuler(); applyTabs(); }], ['Clear All', () => { tabs = []; drawRuler(); applyTabs(); }], ['Cancel']], { w: 320, icon: I.wordpad });
    const spacing = v => { doc.style.lineHeight = v; };
    const bump = d => { const n = SIZES.indexOf(+sizeSel.value); const v = SIZES[Math.max(0, Math.min(SIZES.length - 1, n + d))]; sizeSel.value = String(v); applyStyle('fontSize', v + 'pt'); };
    const writeMenus = [
      ['File', () => [{ label: 'New', act: newDoc }, { label: 'Open...', act: openDlg }, { label: 'Save', act: () => save() }, { label: 'Save As...', act: () => saveAs() }, '-', { label: 'Print...', act: print }, { label: 'Print Setup...', act: pageDlg }, { label: 'Repaginate...', act: () => msg('Repaginate', 'Repaginating... Page 1. Page 2. Done. (It was always going to be page 1 and page 2.)', 'info') }, '-', { label: 'Exit', act: () => confirmLeave(() => { changed = false; w.close(); }) }]],
      ['Edit', [{ label: 'Undo', key: 'Ctrl+Z', act: () => exec('undo') }, '-', { label: 'Cut', key: 'Ctrl+X', act: () => exec('cut') }, { label: 'Copy', key: 'Ctrl+C', act: () => exec('copy') }, { label: 'Paste', key: 'Ctrl+V', act: paste }, { label: 'Paste Special...', act: () => msg('Paste Special', 'As: Text. (That\'s the only special Write knows.)', 'info') }, '-', { label: 'Move Picture', dis: true }, { label: 'Size Picture', dis: true }, { label: 'Insert Object...', act: insertObj }]],
      ['Find', [{ label: 'Find...', act: () => findDlg(false) }, { label: 'Repeat Last Find', key: 'F3', act: () => findNext() }, { label: 'Replace...', act: () => findDlg(true) }, { label: 'Go To Page...', key: 'F4', act: () => msg('Go To Page', 'There is only one page. You\'re on it. Well done.', 'info') }]],
      ['Character', () => [{ label: 'Regular', key: 'F5', act: () => exec('removeFormat') }, '-', { label: 'Bold', key: 'Ctrl+B', chk: document.queryCommandState('bold'), act: () => exec('bold') }, { label: 'Italic', key: 'Ctrl+I', chk: document.queryCommandState('italic'), act: () => exec('italic') }, { label: 'Underline', key: 'Ctrl+U', chk: document.queryCommandState('underline'), act: () => exec('underline') }, '-', { label: 'Superscript', act: () => exec('superscript') }, { label: 'Subscript', act: () => exec('subscript') }, '-', { label: 'Reduce Font', act: () => bump(-1) }, { label: 'Enlarge Font', act: () => bump(1) }, '-', { label: 'Fonts...', act: fontDlg }]],
      ['Paragraph', [{ label: 'Normal', act: () => { exec('justifyLeft'); spacing(''); } }, '-', { label: 'Left', act: () => exec('justifyLeft') }, { label: 'Centered', act: () => exec('justifyCenter') }, { label: 'Right', act: () => exec('justifyRight') }, { label: 'Justified', act: () => exec('justifyFull') }, '-', { label: 'Single Space', act: () => spacing('') }, { label: '1 1/2 Space', act: () => spacing('1.9') }, { label: 'Double Space', act: () => spacing('2.5') }, '-', { label: 'Indents...', act: paraDlg }]],
      ['Document', () => [{ label: 'Header...', act: () => msg('Header', 'Header: "DAD\'S COMPUTER - DO NOT TOUCH" (on every page, since 1994)', 'info') }, { label: 'Footer...', act: () => msg('Footer', 'Footer: "Page 1". Always page 1.', 'info') }, { label: 'Ruler On', chk: ruler.style.display !== 'none', act: () => { ruler.style.display = ruler.style.display === 'none' ? '' : 'none'; } }, { label: 'Tabs...', act: tabsDlg }, { label: 'Page Layout...', act: pageDlg }]],
      ['Help', [{ label: 'Contents', act: () => A.openFile({ name: 'Write Help.txt', type: 'txt', text: WRITE_HELP }) }, { label: 'How to Use Help', act: () => msg('Help', 'Press F1 to get help. Then read it. That\'s how help works.', 'info') }, '-', { label: 'About Write...', act: about }]],
    ];
    A.menubar(w, isWrite ? writeMenus : [
      ['File', () => [
        { label: 'New...', key: 'Ctrl+N', act: newDoc }, { label: 'Open...', key: 'Ctrl+O', act: openDlg }, { label: 'Save', key: 'Ctrl+S', act: () => save() }, { label: 'Save As...', act: () => saveAs() }, '-',
        { label: 'Print...', key: 'Ctrl+P', act: print }, { label: 'Print Preview', act: preview }, { label: 'Page Setup...', act: pageDlg }, '-',
        { label: 'Send...', act: () => msg(appName, 'Send this document by e-mail?\n\nOutlook Express says: "Sending... The server is not responding. It\'s 1999, give it a minute."', 'info') }, '-',
        ...recent(), { label: 'Exit', act: () => confirmLeave(() => { changed = false; w.close(); }) },
      ]],
      ['Edit', () => { const sel = getSelection(), has = sel && !sel.isCollapsed && doc.contains(sel.anchorNode); return [
        { label: 'Undo', key: 'Ctrl+Z', act: () => exec('undo') }, { label: 'Redo', key: 'Ctrl+Y', act: () => exec('redo') }, '-',
        { label: 'Cut', key: 'Ctrl+X', dis: !has, act: () => exec('cut') }, { label: 'Copy', key: 'Ctrl+C', dis: !has, act: () => exec('copy') }, { label: 'Paste', key: 'Ctrl+V', act: paste }, { label: 'Paste Special...', act: () => msg('Paste Special', 'As: Unformatted Text\n\n(There is nothing special about it. It\'s just paste.)', 'info') }, { label: 'Clear', key: 'Del', dis: !has, act: () => exec('delete') }, { label: 'Select All', key: 'Ctrl+A', act: () => { doc.focus(); document.execCommand('selectAll'); setTimeout(plansCheck, 30); } }, '-',
        { label: 'Find...', key: 'Ctrl+F', act: () => findDlg(false) }, { label: 'Find Next', key: 'F3', act: () => findNext() }, { label: 'Replace...', key: 'Ctrl+H', act: () => findDlg(true) }, '-',
        { label: 'Links...', dis: true }, { label: 'Object Properties', dis: true }, { label: 'Object', dis: true },
      ]; }],
      ['View', viewMenu],
      ['Insert', () => [{ label: 'Date and Time...', key: 'F5', act: dateDlg }, { label: 'Object...', act: insertObj }, '-', { label: 'Page Break', act: () => { doc.focus(); document.execCommand('insertHTML', false, '<div style="border-top:1px dashed #808080;margin:6px 0;font-size:8pt;color:#808080;text-align:center">- - - page break - - -</div><div><br></div>'); } }]],
      ['Format', () => [{ label: 'Font...', act: fontDlg }, { label: 'Bullet Style', chk: document.queryCommandState('insertUnorderedList'), act: () => exec('insertUnorderedList') }, { label: 'Paragraph...', act: paraDlg }, { label: 'Tabs...', act: tabsDlg }, '-', { label: 'Colour', sub: () => COLNAMES.map(c => ({ label: c[0].toUpperCase() + c.slice(1), icon: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="${K.COLS[c]}" stroke="#000"/></svg>`, act: () => applyStyle('color', K.COLS[c]) })) }]],
      ['Help', () => [{ label: 'Help Topics', act: () => A.openFile({ name: appName + ' Help.txt', type: 'txt', text: isWrite ? WRITE_HELP : HELP }) }, '-', { label: 'About ' + appName, act: about }]],
    ]);
    function recent() { const r = store.get('jhp_office_wprecent', []); return r.length ? r.slice(0, 4).map((p, i) => ({ label: `${i + 1} ${p.split('/').pop()}`, act: () => { const n = A.fs.get(p); if (n) confirmLeave(() => loadNode(n)); else msg(appName, 'That file has gone. Dave probably borrowed it.', 'warn'); } })).concat('-') : []; }
    const remember = () => { if (!node) return; const p = A.fs.pathOf(node).replace(/\\/g, '/'); store.set('jhp_office_wprecent', [p, ...store.get('jhp_office_wprecent', []).filter(x => x !== p)].slice(0, 6)); };
    const _load = loadNode;
    // ---- start
    setView(view);
    if (node) { _load(node); setTimeout(remember, 500); }
    else if (arg.text != null) setDoc(textToHtml(arg.text), def.font, def.size);
    else setDoc('<div><br></div>', def.font, def.size);
    // unsaved changes are autosaved (js/gamesave.js, one each for WordPad and Write): they come back in the next blank window.
    // Saving forgets it; so does closing the window and saying No. (A window that never had changes leaves it alone.)
    let owned = false;
    if (A.gameSaver) {
      wpSv = A.gameSaver(isWrite ? 'write' : 'wordpad', () => { if (changed) owned = true; return !owned ? undefined : changed ? Object.assign(current(), { name, kind, path: node ? A.fs.pathOf(node) : '' }) : null; }, { v: 1, delay: 800 });
      const close0 = w.close; w.close = function () { if (!w.closed && wpSv) { if (owned) wpSv.clear(); wpSv.stop(); } return close0.apply(this, arguments); };
      const kept = !node && arg.text == null ? wpSv.load() : null;
      if (kept && typeof kept.html === 'string') {
        const nd = kept.path ? A.fs.get(kept.path) : null;
        if (nd) { node = nd; } name = String(kept.name || name); kind = kept.kind || kind;
        setDoc(kept.html, kept.font, kept.size); changed = true; owned = true; w.setTitle(name + ' - ' + appName);
      }
    }
    if (!touchy()) setTimeout(() => { doc.focus(); getSelection().collapse(doc, 0); }, 60);
    w.el.addEventListener('pointerdown', () => {}, true);
    refresh();
    return w;
  }
  K.apps.wordpad = arg => openWordPad(arg, 'wordpad');
  K.apps.write = arg => openWordPad(arg, 'write');
})();
