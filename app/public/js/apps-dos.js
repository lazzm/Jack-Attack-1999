/* apps-dos: the MS-DOS Prompt for JackOS 98. Registers the DOS box window, the Start menu / Run entries, the DOS
 * files on C: (JBASIC samples, batch files, ANSI art, JACKQUEST, Jack Commander) and the persistence layer for files
 * made at the prompt. The heavy parts load lazily: dos-core.js (text screen), dos-shell.js (COMMAND.COM),
 * dos-progs.js (EDIT, GC, ANSI viewer, DEFRAG...), dos-basic.js (JBASIC) and dos-quest.js (the text adventure). */
(function () {
  'use strict';
  if (!window.Apps || !window.Desk) return;
  const A = Apps, esc = A.esc, store = A.store;
  const S = id => A.secret('dos.' + id);
  const DOS = window.DOS = window.DOS || {};
  const touch = () => matchMedia('(hover:none)').matches;
  const p2 = n => String(n).padStart(2, '0');
  const TEACHER = window.Cast ? Cast.n('teacher') : 'Mr Ali'; // the Computer Club teacher (js/cast.js: a different one for every visitor)
  const todayStr = () => { const t = Desk.today99(); return `${p2(t.d)}/${p2(t.m)}/99`; };
  const nowTime = () => { const d = new Date(); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };

  // ================================================================ icons
  const I = {
    dos: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="18" fill="#000"/><path d="M6 9h4M6 12h7M6 15h5" stroke="#c0c0c0" stroke-width="1.5"/><rect x="12" y="15" width="2" height="2" fill="#c0c0c0"/><rect x="11" y="27" width="10" height="2" fill="#808080"/></svg>',
    basic: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="18" fill="#0000aa"/><rect x="4" y="6" width="24" height="2" fill="#aaaaaa"/><path d="M7 11h8M7 14h12M7 17h6M7 20h10" stroke="#ffff55" stroke-width="1.5"/><rect x="11" y="27" width="10" height="2" fill="#808080"/></svg>',
    edit: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="18" fill="#0000aa"/><rect x="4" y="6" width="24" height="2" fill="#aaaaaa"/><rect x="6" y="10" width="20" height="12" fill="none" stroke="#fff"/><path d="M9 14h8M9 17h12" stroke="#fff"/><rect x="11" y="27" width="10" height="2" fill="#808080"/></svg>',
    quest: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="18" fill="#000"/><path d="M6 9h14M6 12h10M6 15h16M6 18h8" stroke="#aaaaaa" stroke-width="1.5"/><path d="M6 21h2" stroke="#ffff55" stroke-width="2"/><circle cx="24" cy="20" r="3" fill="#3a9a2a" stroke="#000" stroke-width=".6"/><rect x="11" y="27" width="10" height="2" fill="#808080"/></svg>',
    gc: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="18" fill="#0000aa"/><rect x="5" y="7" width="10" height="16" fill="none" stroke="#55ffff"/><rect x="17" y="7" width="10" height="16" fill="none" stroke="#55ffff"/><path d="M7 10h6M7 13h6M19 10h6M19 13h6M19 16h6" stroke="#fff"/><rect x="11" y="27" width="10" height="2" fill="#808080"/></svg>',
    ans: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#000" stroke="#000"/><path d="M21 2v6h6" fill="#555" stroke="#000"/><rect x="9" y="11" width="4" height="4" fill="#ff5555"/><rect x="13" y="11" width="4" height="4" fill="#ffff55"/><rect x="17" y="11" width="4" height="4" fill="#55ff55"/><rect x="9" y="15" width="4" height="4" fill="#5555ff"/><rect x="13" y="15" width="4" height="4" fill="#ff55ff"/><rect x="17" y="15" width="4" height="4" fill="#55ffff"/><rect x="9" y="19" width="12" height="6" fill="#aaaaaa"/></svg>',
    bas: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><rect x="9" y="11" width="14" height="13" fill="#0000aa"/><path d="M11 14h8M11 17h10M11 20h6" stroke="#ffff55"/></svg>',
    bat: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><rect x="9" y="11" width="14" height="13" fill="#c0c0c0" stroke="#000"/><rect x="10" y="12" width="12" height="11" fill="#000"/><path d="M12 15h5M12 18h3" stroke="#c0c0c0"/></svg>',
    full: '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="11" fill="#000" stroke="#808080"/><path d="M4 5h5M4 7h7M4 9h3" stroke="#c0c0c0"/></svg>',
    mark: '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" fill="#fff" stroke="#000" stroke-dasharray="2 1"/><rect x="4" y="5" width="6" height="3" fill="#000080"/></svg>',
    copy: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="8" height="10" fill="#fff" stroke="#000"/><rect x="6" y="5" width="8" height="10" fill="#fff" stroke="#000"/><path d="M8 8h4M8 10h4M8 12h3" stroke="#000"/></svg>',
    paste: '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="12" fill="#c8a040" stroke="#000"/><rect x="6" y="1" width="4" height="3" fill="#808080" stroke="#000"/><rect x="6" y="6" width="8" height="9" fill="#fff" stroke="#000"/><path d="M8 9h4M8 11h4" stroke="#000"/></svg>',
    props: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#c0c0c0" stroke="#000"/><rect x="2" y="2" width="12" height="3" fill="#000080"/><path d="M4 8h8M4 10h6M4 12h4" stroke="#000"/></svg>',
    bg: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#c0c0c0" stroke="#000"/><rect x="2" y="2" width="12" height="3" fill="#000080"/><rect x="5" y="5" width="9" height="9" fill="#c0c0c0" stroke="#000"/><rect x="5" y="5" width="9" height="3" fill="#808080"/></svg>',
    font: '<svg viewBox="0 0 16 16"><text x="3" y="13" font-family="Arial" font-weight="bold" font-size="13">A</text></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(I, { dos: JICON.icon('dos'), basic: JICON.icon('jbasic'), quest: JICON.icon('adventure'), bat: JICON.icon('bat'), edit: JICON.icon('edit') });

  // ================================================================ persistence: files and folders made at the prompt
  // store: { dirs: ['C:/BATCH/MINE'], files: { 'C:/BATCH/MINE/X.BAT': { text, date, time, ro, hidden } } }
  const FSKEY = 'jhp_dos_fs';
  const st = store.get(FSKEY, { dirs: [], files: {} });
  if (!Array.isArray(st.dirs)) st.dirs = []; if (!st.files || typeof st.files !== 'object') st.files = {};
  const save = () => store.set(FSKEY, st);
  const MD = 'C:/My Documents';
  const norm = p => p.replace(/\\/g, '/').replace(/\/+$/, '');
  const inMD = p => norm(p).toLowerCase() === MD.toLowerCase();
  const typeFor = name => /\.bas$/i.test(name) ? 'bas' : /\.ans$/i.test(name) ? 'ans' : /\.(exe|com)$/i.test(name) ? 'exe' : 'txt';
  function mkNode(path, name) {
    const key = norm(path) + '/' + name;
    const n = { name, type: typeFor(name), dos: true, get text() { return (st.files[key] || {}).text || ''; }, set text(v) { if (st.files[key]) { st.files[key].text = String(v); save(); } }, get date() { return (st.files[key] || {}).date || todayStr(); }, get time() { return (st.files[key] || {}).time; }, get hidden() { return !!(st.files[key] || {}).hidden; }, get ro() { return !!(st.files[key] || {}).ro; } };
    if (n.type === 'exe') { n.app = 'dos.run'; n.arg = 'type:' + key; }
    return n;
  }
  // a file in My Documents belongs to Notepad's store (jhp_files_docs) so both programs see the same thing
  function mdNode(name) {
    const get = () => (store.get('jhp_files_docs', {}) || {})[name] || {};
    return { name, type: typeFor(name), user: true, dos: true, get text() { return get().text || ''; }, get date() { return get().date || todayStr(); } };
  }
  const ORIG = {};
  const isCfg = (dirPath, name) => norm(dirPath).toUpperCase() === 'C:' && /^(AUTOEXEC\.BAT|CONFIG\.SYS)$/i.test(name);
  const fsx = {
    used() { let n = 0; for (const k in st.files) n += (st.files[k].text || '').length; return n; },
    write(dirPath, name, text) {
      dirPath = norm(dirPath);
      if (inMD(dirPath)) {
        const docs = store.get('jhp_files_docs', {}) || {};
        const ex = A.fs.get(MD + '/' + name);
        if (ex && !ex.user) return { err: 'Access denied' };
        docs[name] = { text: String(text), date: todayStr() }; store.set('jhp_files_docs', docs);
        if (!ex) A.fs.add(MD, mdNode(name));
        return { ok: true, node: A.fs.get(MD + '/' + name) };
      }
      const key = dirPath + '/' + name;
      const dir = A.fs.get(dirPath); if (!dir || dir.type !== 'dir') return { err: 'Path not found' };
      const ex = dir.kids.find(k => k.name.toLowerCase() === name.toLowerCase());
      if (ex && !ex.dos && isCfg(dirPath, name)) { ORIG[name.toUpperCase()] = ORIG[name.toUpperCase()] || ex; dir.kids = dir.kids.filter(k => k !== ex); return fsx.write(dirPath, ex.name, text); }
      if (ex && !ex.dos) return { err: 'Access denied' };
      if (ex && ex.ro) return { err: 'Access denied - file is read-only (ATTRIB -R to fix)' };
      if (!st.files[key]) { if (Object.keys(st.files).length >= 300) return { err: 'Insufficient disk space' }; st.files[key] = { text: '', date: todayStr(), time: nowTime() }; }
      if (String(text).length > 65535) return { err: 'Insufficient disk space (65,535 bytes max per file. It\'s DOS.)' };
      st.files[key].text = String(text); st.files[key].date = todayStr(); st.files[key].time = nowTime(); save();
      if (!ex) A.fs.add(dirPath, mkNode(dirPath, name));
      return { ok: true, node: A.fs.get(dirPath + '/' + name) };
    },
    mkdir(dirPath, name) {
      dirPath = norm(dirPath); const full = dirPath + '/' + name;
      if (A.fs.get(full)) return 'Directory already exists';
      if (st.dirs.length >= 100) return 'Unable to create directory (too many)';
      const d = A.fs.dir(full); d.dos = true; d.date = todayStr(); st.dirs.push(full); save(); return '';
    },
    remove(dirPath, node) {
      dirPath = norm(dirPath);
      const dir = A.fs.get(dirPath); if (!dir) return 'Path not found';
      if (node.type === 'dir') { const i = st.dirs.findIndex(d => d.toLowerCase() === (dirPath + '/' + node.name).toLowerCase()); if (i >= 0) st.dirs.splice(i, 1); }
      else if (inMD(dirPath) || node.user && !st.files[dirPath + '/' + node.name]) { const docs = store.get('jhp_files_docs', {}) || {}; delete docs[node.name]; store.set('jhp_files_docs', docs); }
      else delete st.files[dirPath + '/' + node.name];
      dir.kids = dir.kids.filter(k => k !== node); save();
      if (isCfg(dirPath, node.name) && ORIG[node.name.toUpperCase()]) { dir.kids.push(ORIG[node.name.toUpperCase()]); Desk.toast('COMMAND.COM', `${node.name.toUpperCase()} deleted. The original is back. (Dad keeps a copy. Dad keeps a copy of everything.)`, 4000); }
      return '';
    },
    removeTree(dirPath, node) {
      const full = norm(dirPath) + '/' + node.name;
      (function walk(n, p) { for (const k of n.kids.slice()) { if (k.type === 'dir') walk(k, p + '/' + k.name); fsx.remove(p, k); } })(node, full);
      fsx.remove(dirPath, node);
    },
    rename(dirPath, node, newName) {
      dirPath = norm(dirPath);
      if (node.type === 'dir') { const old = dirPath + '/' + node.name, nu = dirPath + '/' + newName; node.name = newName; st.dirs = st.dirs.map(d => d.toLowerCase().startsWith(old.toLowerCase()) ? nu + d.slice(old.length) : d); for (const k of Object.keys(st.files)) if (k.toLowerCase().startsWith(old.toLowerCase() + '/')) { st.files[nu + k.slice(old.length)] = st.files[k]; delete st.files[k]; } save(); return ''; }
      const text = node.text; const e = fsx.remove(dirPath, node); if (e) return e;
      const r = fsx.write(dirPath, newName, text); return r.err || '';
    },
    attr(dirPath, node, at) { const key = norm(dirPath) + '/' + node.name; if (st.files[key]) { st.files[key].ro = !!at.r; st.files[key].hidden = !!at.h; save(); } },
  };
  DOS.fsx = fsx;
  // restore everything from the last visit
  for (const d of st.dirs) { if (typeof d !== 'string' || !/^C:\//.test(d)) continue; const existed = !!A.fs.get(d); const n = A.fs.dir(d); if (!existed) { n.dos = true; n.date = todayStr(); } }
  for (const k of Object.keys(st.files)) { const i = k.lastIndexOf('/'); const dir = k.slice(0, i), name = k.slice(i + 1); if (!/^C:\//.test(dir)) { delete st.files[k]; continue; } if (!A.fs.get(dir)) A.fs.dir(dir).dos = true; const ex = A.fs.get(k); if (ex && !ex.dos) { if (!isCfg(dir, name)) continue; ORIG[name.toUpperCase()] = ex; } A.fs.add(dir, mkNode(dir, name)); }

  // ================================================================ lazy loading + the DOS program registry
  DOS.progs = DOS.progs || {};
  DOS.PROGPACK = { edit: 'progs', gc: 'progs', ansi: 'progs', defrag: 'progs', scandisk: 'progs', fdisk: 'progs', msd: 'progs', matrix: 'progs', saver: 'progs', virus: 'progs', debug: 'progs', pkunzip: 'progs', edlin: 'progs', dosshell: 'progs', squash: 'progs', unsquash: 'progs', grotscan: 'progs', calc: 'progs', hexed: 'progs', jbasic: 'basic', grotquest: 'quest', grotcrawl: 'games', dakka: 'games', squigpie: 'games', squighunt: 'games', trukkrace: 'games', intro: 'games', tpaint: 'games', grottrak: 'games', teefwars: 'games' };
  DOS.PROGALIAS = { jackquest: 'grotquest', jackcrawl: 'grotcrawl', jacktrak: 'grottrak', jackscan: 'grotscan', gemwars: 'teefwars', flakattack: 'dakka', chipvan: 'squigpie', alienhunt: 'squighunt', turboracer: 'trukkrace' }; // the Grot programs were renamed Jack; their insides kept the old ids
  DOS.need = pack => A.load('js/dos-' + pack + '.js');
  let coreP = null;
  DOS.ready = () => coreP = coreP || A.load('js/dos-core.js').then(() => A.load('js/dos-shell.js')).catch(e => { coreP = null; throw e; });
  DOS.progs.command = async (sh, args) => {
    const Shell = DOS.Shell; const sub = new Shell(sh.host, { mode: sh.mode, depth: sh.depth + 1 });
    sub.drive = sh.drive; sub.cwd = { C: sh.cwd.C.slice(), D: sh.cwd.D.slice(), A: sh.cwd.A.slice() }; sub.env = Object.assign({}, sh.env); sub.floppy = sh.floppy;
    if (sh.depth >= 4) { sh.println('Out of environment space. (How many COMMAND.COMs do you need?)'); S('nested'); return; }
    if (/\/c\s+/i.test(args)) { await sub.exec(args.replace(/^.*?\/c\s+/i, '')); return; }
    await sub.loop(true);
    sh.cwd = sub.cwd; sh.drive = sub.drive;
  };
  DOS.progs.mouse = async sh => { sh.mouse = true; sh.host.noMouse = false; sh.println('JackMouse Driver 8.20 installed. (The ball is a bit fluffy.)'); };
  DOS.progs.mscdex = async sh => { sh.cd = true; sh.println('MSCDEX Version 2.25\n        Drive D: = Driver JACKCD01 unit 0'); };
  DOS.progs.feed = async sh => { sh.println('Feeding Gubbinz... he ate the biscuits AND the bowl.'); S('feed'); };
  DOS.progs.dir_type = async (sh, args, node) => { sh.println('This program cannot be run in DOS mode.'); void node; };

  // ================================================================ the MS-DOS Prompt window
  let fullWin = null; // the window currently in full screen (only one at a time)
  function openDos(arg) {
    const b = document.createElement('div'); b.className = 'dosbox';
    b.innerHTML = `<div class="dos-tool"><select class="dos-size" aria-label="Font size"><option value="auto">Auto</option><option value="1">9 x 16</option><option value="0.75">7 x 12</option><option value="0.5">4 x 8</option><option value="1.5">13 x 24</option><option value="2">18 x 32</option></select><span class="dos-tsep"></span>${['mark', 'copy', 'paste'].map(k => `<button type="button" class="dos-tb" data-t="${k}" title="${k[0].toUpperCase() + k.slice(1)}">${I[k]}</button>`).join('')}<span class="dos-tsep"></span><button type="button" class="dos-tb" data-t="full" title="Full screen (Alt+Enter)">${I.full}</button><span class="dos-tsep"></span><button type="button" class="dos-tb" data-t="props" title="Properties">${I.props}</button><button type="button" class="dos-tb" data-t="bg" title="Background">${I.bg}</button><button type="button" class="dos-tb" data-t="font" title="Font">${I.font}</button></div><div class="dos-load">Loading COMMAND.COM...</div>`;
    const w = A.win('MS-DOS Prompt', b, { w: Math.min(innerWidth - 8, 80 * 9 + 14), h: Math.min(innerHeight - 60, 25 * 16 + 24 + 62 + (touch() ? 130 : 0)), icon: I.dos, cls: 'doswin', minW: 260, minH: 160, onClose: () => { if (host) host.destroy(); if (fullWin === w) unfull(); } });
    let host = null, shell = null;
    const title = t => w.setTitle(t);
    const full = () => { if (fullWin && fullWin !== w) unfull(); fullWin = w; w.el.classList.add('dosfull'); document.body.classList.add('dos-fs'); S('fullscreen'); if (host) { host.full = true; host.fit(); host.focus(); } };
    const unfull = () => { if (fullWin) { fullWin.el.classList.remove('dosfull'); fullWin = null; } document.body.classList.remove('dos-fs'); if (host) { host.full = false; host.fit(); host.focus(); } };
    const toggle = () => fullWin === w ? unfull() : full();
    b.querySelector('.dos-size').addEventListener('change', ev => { if (!host) return; host.scale = ev.target.value === 'auto' ? 'auto' : +ev.target.value; host.fit(); host.focus(); });
    b.querySelectorAll('.dos-tb').forEach(btn => btn.addEventListener('click', () => {
      const t = btn.dataset.t;
      if (t === 'full') toggle();
      else if (t === 'copy') { if (!host) return; const txt = host.screen.all(); try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (e) {} Desk.toast('MS-DOS Prompt', 'The screen text has been copied to the Clipboard.', 2500); host.focus(); }
      else if (t === 'paste') { if (!host) return; try { navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText().then(tx => { host.typeText(tx); host.focus(); }).catch(() => Desk.toast('MS-DOS Prompt', 'Use Ctrl+V in the DOS window to paste.', 3000)) : Desk.toast('MS-DOS Prompt', 'Use Ctrl+V in the DOS window to paste.', 3000); } catch (e) {} }
      else if (t === 'mark') { Desk.toast('Mark', 'Drag with the mouse... actually, the Copy button grabs the whole screen. It\'s 1999, we take shortcuts.', 3500); if (host) host.focus(); }
      else if (t === 'props') props();
      else if (t === 'bg') { Desk.msgbox('MS-DOS Prompt', 'Background: this program runs in the foreground AND the background. It is very busy.\n\n(Always suspend: off. Idle sensitivity: low. Gubbinz sensitivity: high.)', 'info'); }
      else if (t === 'font') { const sel = b.querySelector('.dos-size'); sel.selectedIndex = (sel.selectedIndex + 1) % sel.options.length; sel.dispatchEvent(new Event('change')); }
    }));
    function props() {
      const d = document.createElement('div');
      d.innerHTML = `<div class="tabs"><button class="btn on" type="button">Program</button><button class="btn" type="button">Font</button><button class="btn" type="button">Memory</button><button class="btn" type="button">Screen</button><button class="btn" type="button">Misc</button></div><div class="tabpage" style="padding:8px"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center"><span style="width:32px;height:32px;display:inline-flex">${I.dos}</span><input type="text" value="MS-DOS Prompt" style="flex:1"></div><table class="dos-ptab"><tr><td>Cmd line:</td><td><input type="text" value="C:\\COMMAND.COM" readonly></td></tr><tr><td>Working:</td><td><input type="text" value="${esc(shell ? shell.pathStr() : 'C:\\')}" readonly></td></tr><tr><td>Batch file:</td><td><input type="text" value="" readonly></td></tr><tr><td>Shortcut key:</td><td><input type="text" value="None" readonly></td></tr><tr><td>Run:</td><td><select><option>Normal window</option><option>Minimized</option><option>Maximized</option></select></td></tr></table><label><input type="checkbox" checked> Close on exit</label><p class="small" style="margin:8px 0 0;color:#444">Conventional memory: 640K (62K free). Expanded: none. Extended: as much as Gubbinz leaves.<br>Screen: Window / Full-screen (Alt+Enter). Fast ROM emulation: on. Dynamic memory allocation: on. Fast pasting: on.</p></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-x>OK</button><button class="btn" type="button" data-x>Cancel</button><button class="btn" type="button" data-x>Apply</button></div>`;
      const pw = A.win('MS-DOS Prompt Properties', d, { w: 400, noResize: true, noMax: true, noMin: true, escClose: true, icon: I.dos });
      d.querySelectorAll('.tabs .btn').forEach(t => t.addEventListener('click', () => { d.querySelectorAll('.tabs .btn').forEach(x => x.classList.remove('on')); t.classList.add('on'); Desk.toast('Properties', t.textContent + ' tab: all the defaults. Dad set them. Don\'t.', 2000); }));
      d.querySelectorAll('[data-x]').forEach(x => x.addEventListener('click', pw.close));
    }
    DOS.ready().then(() => {
      if (w.closed) return;
      const K = DOS.core;
      host = new K.Host({ cols: innerWidth < 560 ? 40 : 80, rows: 25 });
      b.querySelector('.dos-load').remove(); b.appendChild(host.el);
      if (touch()) b.appendChild(softKeys(host, toggle));
      host.onfull = toggle;
      host.fit();
      shell = new DOS.Shell(host, { mode: 'win' });
      shell.title = t => title(t ? t + ' - MS-DOS Prompt' : 'MS-DOS Prompt');
      S('first');
      setTimeout(() => host.focus(), 50);
      w.el.addEventListener('pointerdown', () => setTimeout(() => { if (!w.closed && host && !document.activeElement.closest('.dos-tool')) host.focus(); }, 0));
      (async () => {
        try {
          const t = host.term; t.attr = 7;
          let cmd = null;
          if (typeof arg === 'string' && arg.startsWith('type:')) { const node = A.fs.get(arg.slice(5)); if (node) cmd = `TYPE "${arg.slice(5).replace(/\//g, '\\')}"`; }
          else if (typeof arg === 'string' && arg) cmd = arg;
          else if (arg && typeof arg === 'object' && arg.run) cmd = arg.run;
          await shell.boot(false);
          if (cmd) { if (arg && arg.cwd) { const r = shell.resolve(arg.cwd, { dirOnly: true }); if (r && !r.err) { shell.cwd[r.dr] = r.dirs; shell.drive = r.dr; } } await shell.exec(cmd); if (shell.term.x) shell.println(); shell.println(); if (arg && arg.close) { w.close(); return; } }
          await shell.loop(!cmd);
          if (!w.closed) w.close();
        } catch (e) { if (e !== K.KILL && !host.dead) { console.error(e); try { host.term.attr = 7; host.term.line('\nGeneral failure reading drive C\nAbort, Retry, Fail? (Press Alt+Enter and tell Jack: ' + (e && e.message || e) + ')'); } catch (e2) {} } }
      })();
    }).catch(e => { console.error(e); b.querySelector('.dos-load').textContent = 'Not enough memory to load COMMAND.COM. (The modem probably hung up. Try again.)'; });
    return w;
  }
  // on-screen keys for phones (Esc, Tab, arrows, F-keys, Ctrl combos) and a way out of full screen
  function softKeys(host, toggleFull) {
    const k = document.createElement('div'); k.className = 'dos-keys';
    const KEYS = [['Esc', 'Escape'], ['Tab', 'Tab'], ['F1', 'F1'], ['F2', 'F2'], ['F3', 'F3'], ['F5', 'F5'], ['F10', 'F10'], ['\u2190', 'ArrowLeft'], ['\u2191', 'ArrowUp'], ['\u2193', 'ArrowDown'], ['\u2192', 'ArrowRight'], ['PgUp', 'PageUp'], ['PgDn', 'PageDown'], ['Home', 'Home'], ['End', 'End'], ['Ins', 'Insert'], ['Del', 'Delete'], ['^C', 'c', 'ctrl'], ['^Z', 'z', 'ctrl'], ['Alt', 'AltUp'], ['\u2588', 'full']];
    k.innerHTML = KEYS.map(([l, v, m]) => `<button type="button" data-k="${v}" data-m="${m || ''}">${l}</button>`).join('');
    k.addEventListener('pointerdown', ev => { const btn = ev.target.closest('button'); if (!btn) return; ev.preventDefault(); const v = btn.dataset.k; if (v === 'full') return; host.push({ type: 'key', key: v, ch: '', ctrl: btn.dataset.m === 'ctrl' }); host.focus(); });
    k.addEventListener('click', ev => { const btn = ev.target.closest('button'); ev.preventDefault(); ev.stopPropagation(); if (btn && btn.dataset.k === 'full') { toggleFull(); setTimeout(() => host.focus(), 50); } });
    return k;
  }
  A.register('dos.run', { cmd: ['command', 'command.com', 'cmd', 'dos', 'msdos', 'ms-dos', 'dosprmpt', 'dos prompt', 'ms-dos prompt', 'conagent'], open: openDos });
  A.cmd(['jbasic', 'jbasic.exe', 'qbasic', 'qb', 'basic', 'gwbasic'], raw => A.open('dos.run', /^qb/i.test(raw || '') ? 'QBASIC' : 'JBASIC'));
  A.cmd(['jackquest', 'jack quest', 'jackquest.exe', 'grotquest', 'grot quest', 'gq', 'grotquest.exe', 'zork', 'adventure', 'advent'], () => A.open('dos.run', 'JACKQUEST'));
  A.cmd(['gc', 'jackcmd', 'jack commander', 'grotcmd', 'grot commander', 'nc', 'norton'], () => A.open('dos.run', 'GC'));
  A.cmd(['dosedit', 'edit.com', 'ms-dos editor'], () => A.open('dos.run', 'EDIT'));
  A.cmd(['ansi', 'ansiview', 'ansi.sys'], () => A.open('dos.run', 'ANSI C:\\ANSI\\LOGO.ANS'));
  A.cmd(['autoexec', 'autoexec.bat'], () => A.open('dos.run', 'C:\\AUTOEXEC.BAT'));
  A.cmd(['deltree', 'format c:', 'format', 'fdisk', 'mem', 'mem /c', 'msd', 'chkdsk /f', 'debug', 'tree', 'matrix', 'xyzzy'], raw => A.open('dos.run', String(raw).toUpperCase().replace(/\.EXE$/, '')));
  A.cmd(['mode 40', 'mode con cols=40'], () => A.open('dos.run', 'MODE CON COLS=40'));
  A.cmd(['jackcrawl', 'jacktrak', 'jackscan', 'grotcrawl', 'rogue', 'roguelike', 'dakka', 'squigpie', 'lemonade', 'squighunt', 'wumpus', 'trukkrace', 'flakattack', 'flak attack', 'chipvan', 'chip van tycoon', 'alienhunt', 'alien hunt', 'turboracer', 'turbo racer', 'intro', 'demo', 'tpaint', 'grottrak', 'tracker', 'gemwars', 'teefwars', 'edlin', 'dosshell', 'grotscan', 'hexed', 'squash', 'unsquash'], raw => A.open('dos.run', { 'rogue': 'JACKCRAWL', 'roguelike': 'JACKCRAWL', 'lemonade': 'SQUIGPIE', 'wumpus': 'SQUIGHUNT', 'demo': 'INTRO', 'tracker': 'JACKTRAK', 'flakattack': 'DAKKA', 'flak attack': 'DAKKA', 'chipvan': 'SQUIGPIE', 'chip van tycoon': 'SQUIGPIE', 'alienhunt': 'SQUIGHUNT', 'alien hunt': 'SQUIGHUNT', 'turboracer': 'TRUKKRACE', 'turbo racer': 'TRUKKRACE' }[String(raw).toLowerCase()] || String(raw).toUpperCase()));
  A.addProgram(['Games', 'DOS Shareware', 'Jack Crawl'], () => A.open('dos.run', 'JACKCRAWL'), I.quest);
  A.addProgram(['Games', 'DOS Shareware', 'Flak Attack!'], () => A.open('dos.run', 'DAKKA'), I.quest);
  A.addProgram(['Games', 'DOS Shareware', 'Chip Van Tycoon'], () => A.open('dos.run', 'SQUIGPIE'), I.quest);
  A.addProgram(['Games', 'DOS Shareware', 'Alien Hunt'], () => A.open('dos.run', 'SQUIGHUNT'), I.quest);
  A.addProgram(['Games', 'DOS Shareware', 'Turbo Racer'], () => A.open('dos.run', 'TRUKKRACE'), I.quest);
  A.addProgram(['Games', 'DOS Shareware', 'Gem Wars (BBS door)'], () => A.open('dos.run', 'GEMWARS'), I.quest);
  A.addProgram(['Accessories', 'Entertainment', 'JACK INTRO (demo)'], () => A.open('dos.run', 'INTRO'), I.dos);
  A.addProgram(['MS-DOS Prompt'], 'dos.run', I.dos);
  A.addProgram(['Accessories', 'JBASIC'], () => A.open('dos.run', 'JBASIC'), I.basic);
  A.addProgram(['Accessories', 'MS-DOS Editor'], () => A.open('dos.run', 'EDIT'), I.edit);
  A.addProgram(['Accessories', 'System Tools', 'Jack Commander'], () => A.open('dos.run', 'GC'), I.gc);
  A.addProgram(['Games', 'Jack Quest'], () => A.open('dos.run', 'JACKQUEST'), I.quest);
  A.desktopIcon('MS-DOS Prompt', I.dos, () => A.open('dos.run'), 'iconDos');
  A.OPENERS.bas = node => A.open('dos.run', { run: `JBASIC "${A.fs.pathOf(node) || node.name}"` });
  A.OPENERS.ans = node => A.open('dos.run', { run: `ANSI "${A.fs.pathOf(node) || node.name}"` });

  // ---- what desk.js calls for Shut Down > Restart in MS-DOS mode (see the report for the hook)
  DOS.fullscreen = function (container, onExit) {
    container.innerHTML = '';
    const stub = document.createElement('div'); stub.className = 'dos-host'; stub.style.cssText = 'color:#aaa;font:16px monospace;padding:12px'; stub.textContent = 'Starting MS-DOS mode...'; container.appendChild(stub);
    let host = null, done = false;
    const finish = () => { if (done) return; done = true; if (host) host.destroy(); container.innerHTML = ''; document.body.classList.remove('dos-fs'); if (onExit) onExit(); };
    DOS.ready().then(() => {
      const K = DOS.core; stub.remove();
      host = new K.Host({ cols: innerWidth < 560 ? 40 : 80, rows: 25 }); host.full = true;
      container.appendChild(host.el); if (touch()) container.appendChild(softKeys(host, () => {}));
      host.fit(); setTimeout(() => host.focus(), 50);
      const shell = new DOS.Shell(host, { mode: 'dos', noExit: true });
      S('dosmode');
      (async () => {
        try {
          const t = host.term; t.cls();
          await shell.boot(true); t.line();
          t.line('JackOS(R) 98 MS-DOS Mode'); t.line('   (C)Copyright Jack 1999. All rights reserved (by Jack).'); t.line(); t.line('Type HELP for a list of commands. Type WIN to go back to JackOS.'); t.line();
          await shell.loop(false);
        } catch (e) { if (e !== K.KILL) console.error(e); }
        finish();
      })();
    }).catch(e => { console.error(e); stub.textContent = 'MS-DOS mode failed to load. Press any key to start JackOS.'; const h = () => { document.removeEventListener('keydown', h); finish(); }; document.addEventListener('keydown', h); });
    return { exit: finish };
  };

  // ================================================================ files on C:
  const put = (path, node) => A.fs.add(path, node);
  const txt = (path, name, date, text, extra) => put(path, Object.assign({ name, type: 'txt', date, text }, extra || {}));
  const bas = (path, name, date, text, extra) => put(path, Object.assign({ name, type: 'bas', date, text }, extra || {}));
  const ans = (path, name, date, text, extra) => put(path, Object.assign({ name, type: 'ans', date, text }, extra || {}));
  const dosexe = (path, name, date, size, prog, extra) => put(path, Object.assign({ name, type: 'exe', date, size, app: 'dos.run', arg: prog.toUpperCase(), dosprog: prog }, extra || {}));
  // ---- C:\JACKOS\COMMAND: the DOS tools (double-click one in Explorer and it runs in a DOS box)
  const WC = 'C:/JACKOS/COMMAND'; A.fs.dir(WC).date = '10/12/98';
  [['EDIT.COM', '69 KB', 'edit'], ['DELTREE.EXE', '19 KB', 'deltree'], ['FORMAT.COM', '49 KB', 'format'], ['MEM.EXE', '32 KB', 'mem'], ['DOSKEY.COM', '15 KB', 'doskey'], ['XCOPY.EXE', '3 KB', 'xcopy'], ['MORE.COM', '10 KB', 'more'], ['FIND.EXE', '6 KB', 'find'], ['SORT.EXE', '6 KB', 'sort'], ['ATTRIB.EXE', '15 KB', 'attrib'], ['CHKDSK.EXE', '28 KB', 'chkdsk'], ['TREE.COM', '6 KB', 'tree'], ['MSCDEX.EXE', '25 KB', 'mscdex'], ['DEBUG.EXE', '20 KB', 'debug'], ['FDISK.EXE', '63 KB', 'fdisk'], ['SCANDISK.EXE', '140 KB', 'scandisk'], ['DEFRAG.EXE', '58 KB', 'defrag'], ['MSD.EXE', '158 KB', 'msd'], ['ANSI.COM', '8 KB', 'ansi'], ['CHOICE.COM', '5 KB', 'choice'], ['LABEL.EXE', '9 KB', 'label'], ['MODE.COM', '23 KB', 'mode'], ['SYS.COM', '18 KB', 'sys'], ['KEYB.COM', '19 KB', 'keyb'], ['SMARTDRV.EXE', '45 KB', 'smartdrv'], ['UNDELETE.EXE', '26 KB', 'undelete'], ['PKUNZIP.EXE', '29 KB', 'pkunzip']].forEach(([n, s, p]) => dosexe(WC, n, '10/12/98', s, p));
  put(WC, { name: 'ANSI.SYS', type: 'txt', date: '10/12/98', size: '9 KB', text: 'DEVICE DRIVER - ANSI.SYS\n(binary. It makes the colours work. Dad put it in CONFIG.SYS in 1995 and nobody has dared take it out.)\n' });
  txt(WC, 'EDIT.HLP', '10/12/98', `MS-DOS EDITOR HELP (JackOS edition)\n===================================\n\nThe editor has menus! Press Alt, or click them with the mouse.\n\nFILE    New, Open, Save, Save As, Print (don't), Exit\nEDIT    Cut (Shift+Del), Copy (Ctrl+Ins), Paste (Shift+Ins), Clear\nSEARCH  Find (Ctrl+F in JackOS), Repeat Last Find (F3), Change\nOPTIONS Display (the colours), Help Path\nHELP    This.\n\nKEYS\n  Arrows, Home, End, PgUp, PgDn      move about\n  Shift + arrows                      select text\n  Ctrl+Y                              delete a whole line (Dave's favourite)\n  Ctrl+Left / Ctrl+Right              a word at a time\n  Insert                              overtype mode (watch the cursor go square)\n  F3                                  find the next one\n  Esc                                 closes a menu or a dialog\n\nSAVING\n  Your files are saved on C: and stay there. Jack's own files are read-only\n  (he's touchy about his diary) so Save As them with a new name.\n`);
  txt(WC, 'README.TXT', '10/12/98', `C:\\JACKOS\\COMMAND\n\nThese are the DOS programs. They work from the MS-DOS Prompt (Start > Programs > MS-DOS Prompt)\nor from MS-DOS mode (Start > Shut Down > Restart in MS-DOS mode).\n\nTYPE HELP at the prompt for the list. Try MEM /C. Try TREE. Try not to FORMAT anything.\n`);
  dosexe('C:/JACKOS', 'MOUSE.COM', '10/12/98', '56 KB', 'mouse');
  dosexe('C:/JACKOS', 'JACK.COM', '10/12/98', '24 KB', 'win_com', { hidden: false });
  DOS.progs.win_com = async sh => { if (sh.mode === 'dos') return DOS.Shell.prototype.exec.call(sh, 'WIN'); sh.println('JackOS is already running. Look behind you.'); };
  A.fs.dir('C:/JACKOS/TEMP').date = '10/12/98';
  put('C:/JACKOS/TEMP', { name: '~FUNNY.COM', type: 'exe', date: '01/04/99', size: '2 KB', hidden: true, app: 'dos.run', arg: 'VIRUS', dosprog: 'virus' });
  txt('C:/JACKOS/TEMP', '~DF3A1.TMP', '14/10/99', 'temporary file. contents: temporary. (it has been here since February.)\n', { hidden: true });
  txt('C:/JACKOS/TEMP', 'SCANDISK.LOG', '12/10/99', 'ScanDisk log (DOS)\nSurface scan: 0 bad clusters. 1 grumpy cluster. Cluster 4,096 "would rather not".\n', {});

  // ---- C:\JBASIC: Jack's BASIC and the sample programs
  const JB = 'C:/JBASIC'; A.fs.dir(JB).date = '14/02/99';
  dosexe(JB, 'JBASIC.EXE', '14/02/99', '194 KB', 'jbasic');
  txt(JB, 'README.TXT', '14/02/99', `JBASIC 1.1 - JACK'S BASIC\n=========================\nIt's like QBasic (the blue one on Dad's old PC) but it's MINE. ${TEACHER} at computer\nclub says it's "very nearly a real programming language". Thanks ${TEACHER}.\n\nHOW TO USE IT\n  JBASIC              starts the editor (blue screen, you'll know it)\n  JBASIC WORM.BAS     opens a program\n  JBASIC /RUN X.BAS   runs it straight away\n  F5                  RUN!      Esc / any key when it says to = back\n  F1                  help      Alt = the menus (or click them)\n  Ctrl+Break / Ctrl+C stops a program that's gone loopy (it happens. a lot.)\n\nPROGRAMS IN THIS FOLDER\n  MYFIRST.BAS   my first one ever (don't laugh)\n  GUESS.BAS     guess the number (the classic)\n  ORKWAR.BAS    two robots on a skyline lob spanners at each other. ANGLE + POWER. Like\n                the banana one on Dad's PC but with ROBOTS, so better. (It was going to\n                be Orks. Dave voted robots. The file name stayed.)\n  WORM.BAS      snake game. arrows. don't eat yourself.\n  STARS.BAS     starfield. Looks like going to lightspeed. That's it, that's the program.\n  FRACTAL.BAS   a Mandelbrot. Takes a bit. ${TEACHER} showed us. It's maths but good maths.\n  BLOCKS.BAS    falling blocks (NOT Tetris. Legally.) (it is Tetris)\n  CUBESCRM.BAS  Rubik's scramble generator with a timer\n  PODRACE.BAS   dodge the rocks in your pod. Very fast. Dave crashed in 4 seconds.\n  DOGFIGHT.BAS  starfighters in a starfield, shoot with space. Pew pew.\n  SABER.BAS     lightsaber duel, two players, one keyboard. A and L to swing.\n  MUSIC.BAS     PLAY tunes on the PC speaker (turn SFX on in the tray!)\n  CLOCK.BAS     a big clock. Useful if you can't see the small clock.\n\nThings it can do: PRINT INPUT IF FOR WHILE DO GOTO GOSUB SUB FUNCTION DIM SELECT CASE\nDATA READ string functions maths RND COLOR LOCATE INKEY$ SLEEP BEEP SOUND PLAY\nSCREEN 13 (320x200, 256 colours!!) PSET LINE CIRCLE PAINT POINT\n\nIf you write one, SAVE it in here. It stays. Send it to me and I'll put it on the site.\n`);
  txt(JB, 'JBASIC.HLP', '14/02/99', `JBASIC QUICK REFERENCE\n======================\nPRINT "hi"; x, y       ; = next to, , = next column\nINPUT "Name"; n$       LINE INPUT "> ", s$\nLET a = 1 (LET optional)   a$ = "string"   DIM grid(10, 10)   DIM SHARED hi\nIF a > 1 THEN PRINT "big" ELSE PRINT "small"\nIF a > 1 THEN ... ELSEIF ... ELSE ... END IF\nFOR i = 1 TO 10 STEP 2 ... NEXT i     EXIT FOR\nWHILE k$ = "" ... WEND      DO ... LOOP UNTIL done    DO WHILE x < 5 ... LOOP   EXIT DO\nSELECT CASE n: CASE 1: CASE 2 TO 5: CASE IS > 9: CASE ELSE: END SELECT\nGOTO label / 10 GOTO 10   GOSUB sub1 ... RETURN     labels end with a colon\nSUB Name (a, b$) ... END SUB    FUNCTION F (x) ... F = x * 2 ... END FUNCTION\nDATA 1, 2, "three"   READ a, b, c$   RESTORE     SWAP a, b   CONST PI = 3.14159\n\nSTRINGS  LEFT$ RIGHT$ MID$ LEN CHR$ ASC STR$ VAL UCASE$ LCASE$ LTRIM$ RTRIM$ INSTR SPACE$ STRING$ HEX$\nMATHS    RND INT FIX ABS SQR SIN COS TAN ATN EXP LOG SGN CINT   RANDOMIZE TIMER   TIMER\nSCREEN   CLS  COLOR fg, bg  LOCATE row, col  SCREEN 0 (text) 13 (320x200x256) 12 (640x480x16) 7 (320x200x16)\nGRAPHICS PSET (x, y), c   LINE (x1, y1)-(x2, y2), c [, B or BF]   CIRCLE (x, y), r, c   PAINT (x, y), c, border   POINT(x, y)\nKEYS     k$ = INKEY$  (arrows = CHR$(0) + "H" "P" "K" "M")   SLEEP n   SLEEP (waits for a key)\nSOUND    BEEP   SOUND freq, ticks (18 ticks = 1 s)   PLAY "T120 O4 L8 CDEFGAB>C"\nEND  STOP  SYSTEM   REM or ' for comments\n\nERRORS   "Syntax error", "Subscript out of range", "Division by zero", "NEXT without FOR",\n         "RETURN without GOSUB", "Type mismatch", "Illegal function call", "Out of DATA"... you'll see them all. I have.\n`);
  const SAMPLES = DOS.SAMPLES = {};
  SAMPLES['MYFIRST.BAS'] = `' MYFIRST.BAS  by Jack  (my first ever program!!!)
' ${TEACHER} said start with PRINT so here is PRINT
CLS
PRINT "HELLO I AM JACK"
PRINT "THIS IS MY FIRST PROGRAM"
PRINT
' this bit asks your name. the $ means it is words not a number (took me AGES)
INPUT "what is your name"; n$
PRINT "hello "; n$; " you are ace"
' this bit is maths. computers are good at maths. i am not.
INPUT "how old are you"; a
PRINT "in the year 2000 you will be"; a + 1
PRINT "(if the computers still work)"
PRINT
' this is a loop. it goes round 5 times. i wanted 1000 but ${TEACHER} said no
FOR i = 1 TO 5
  PRINT i; "WICKED!"
NEXT i
' if you type the magic word something happens
INPUT "do you like star wars (yes/no)"; o$
IF UCASE$(o$) = "YES" THEN
  PRINT "CORRECT. you can be in my gang"
  BEEP
ELSE
  PRINT "wrong but i will let you off"
END IF
PRINT
PRINT "THE END (press any key)"
SLEEP
`;
  SAMPLES['GUESS.BAS'] = `' GUESS.BAS - guess the number. the classic. Dave's record is 11 goes (bad)
RANDOMIZE TIMER
CLS
COLOR 14: PRINT "GUESS THE NUMBER": COLOR 7
PRINT "I'm thinking of a number between 1 and 100."
PRINT "(It's not 7. Everyone says 7.)"
PRINT
secret = INT(RND * 100) + 1
goes = 0
DO
  INPUT "Your guess"; g
  goes = goes + 1
  IF g < 1 OR g > 100 THEN
    PRINT "Between ONE and A HUNDRED, I said."
  ELSEIF g < secret THEN
    PRINT "Higher!"
  ELSEIF g > secret THEN
    PRINT "Lower!"
  END IF
LOOP UNTIL g = secret
PRINT
COLOR 10: PRINT "YES! It was"; secret; "- you took"; goes; "goes."
COLOR 7
IF goes <= 7 THEN PRINT "That's better than Dave. (Dave: 11.)"
IF goes > 11 THEN PRINT "That's worse than Dave. Dave will be told."
PLAY "T180 L16 CEG>C"
PRINT "Press any key..."
SLEEP
`;
  SAMPLES['STARS.BAS'] = `' STARS.BAS - a starfield. Like the bit where the ship goes fast.
SCREEN 13
RANDOMIZE TIMER
DIM x(120), y(120), z(120)
FOR i = 1 TO 120: GOSUB newstar: NEXT i
DO
  FOR i = 1 TO 120
    ox = 160 + x(i) / z(i): oy = 100 + y(i) / z(i)
    IF ox >= 0 AND ox < 320 AND oy >= 0 AND oy < 200 THEN PSET (ox, oy), 0
    z(i) = z(i) - 1.5
    IF z(i) < 1 THEN GOSUB newstar
    sx = 160 + x(i) / z(i): sy = 100 + y(i) / z(i)
    IF sx >= 0 AND sx < 320 AND sy >= 0 AND sy < 200 THEN
      c = 31 - INT(z(i) / 4): IF c < 17 THEN c = 17
      PSET (sx, sy), c
    ELSE
      GOSUB newstar
    END IF
  NEXT i
  SLEEP 0.02
  k$ = INKEY$
LOOP UNTIL k$ <> ""
SCREEN 0
END
newstar:
x(i) = RND * 320 - 160: y(i) = RND * 200 - 100: z(i) = RND * 60 + 5
RETURN
`;
  SAMPLES['FRACTAL.BAS'] = `' FRACTAL.BAS - the Mandelbrot set. ${TEACHER} showed us this. It's infinite. INFINITE.
' (It takes about 20 seconds. Make a cup of tea. Or don't, you're a kid.)
SCREEN 13
FOR py = 0 TO 199
  FOR px = 0 TO 319
    ca = (px - 220) / 110
    cb = (py - 100) / 90
    za = 0: zb = 0: n = 0
    DO WHILE n < 60 AND za * za + zb * zb < 4
      t = za * za - zb * zb + ca
      zb = 2 * za * zb + cb
      za = t
      n = n + 1
    LOOP
    IF n = 60 THEN c = 0 ELSE c = 32 + (n * 3) MOD 160
    PSET (px, py), c
  NEXT px
  IF INKEY$ <> "" THEN EXIT FOR
NEXT py
LOCATE 25, 1: PRINT "Infinite! (press a key)";
SLEEP
SCREEN 0
`;
  SAMPLES['CUBESCRM.BAS'] = `' CUBESCRM.BAS - Rubik's cube scramble generator + timer
' (my best is 58.32 seconds. Under a minute. I would like that on the record.)
RANDOMIZE TIMER
f$ = "UDLRFB"
m$ = " '2"
DO
  CLS
  COLOR 14: PRINT "RUBIK'S SCRAMBLER 2000": COLOR 7
  PRINT
  PRINT "Scramble (20 moves):"
  PRINT
  last = 0: s$ = ""
  FOR i = 1 TO 20
    DO
      face = INT(RND * 6) + 1
    LOOP WHILE face = last
    last = face
    s$ = s$ + MID$(f$, face, 1) + LTRIM$(MID$(m$, INT(RND * 3) + 1, 1)) + " "
  NEXT i
  COLOR 11: PRINT "  "; s$: COLOR 7
  PRINT
  PRINT "Do the scramble, then press SPACE to start the timer."
  PRINT "Press SPACE again when you're done. Press Q to quit."
  DO: k$ = INKEY$: LOOP UNTIL k$ = " " OR UCASE$(k$) = "Q"
  IF UCASE$(k$) = "Q" THEN END
  t0 = TIMER
  DO
    LOCATE 12, 1: PRINT "Time:"; INT((TIMER - t0) * 100) / 100; "   ";
    k$ = INKEY$
    SLEEP 0.03
  LOOP UNTIL k$ = " "
  t = INT((TIMER - t0) * 100) / 100
  LOCATE 12, 1: COLOR 10: PRINT "Time:"; t; "seconds   ": COLOR 7
  IF t < 58.32 THEN PRINT "YOU BEAT JACK'S RECORD. (He will want to see proof.)"
  IF t >= 58.32 AND t < 120 THEN PRINT "Under 2 minutes! Dave can't do that."
  IF t >= 120 THEN PRINT "Did you fall asleep?"
  PRINT: PRINT "Press any key for another scramble..."
  SLEEP
LOOP
`;
  SAMPLES['WORM.BAS'] = `' WORM.BAS - snake game. Arrows to steer. Eat the apples (*). Don't eat yourself.
RANDOMIZE TIMER
DIM wx(400), wy(400)
restart:
CLS
COLOR 14: LOCATE 1, 1: PRINT "WORM!  score: 0"; : COLOR 7
LINE1$ = STRING$(40, 205)
LOCATE 2, 1: PRINT LINE1$;
LOCATE 24, 1: PRINT LINE1$;
n = 3: dx = 1: dy = 0: score = 0
FOR i = 1 TO n: wx(i) = 20 - i: wy(i) = 12: NEXT i
GOSUB apple
DO
  k$ = INKEY$
  IF k$ = CHR$(0) + "H" AND dy = 0 THEN dx = 0: dy = -1
  IF k$ = CHR$(0) + "P" AND dy = 0 THEN dx = 0: dy = 1
  IF k$ = CHR$(0) + "K" AND dx = 0 THEN dx = -1: dy = 0
  IF k$ = CHR$(0) + "M" AND dx = 0 THEN dx = 1: dy = 0
  IF k$ = CHR$(27) THEN END
  nx = wx(1) + dx: ny = wy(1) + dy
  IF nx < 1 OR nx > 40 OR ny < 3 OR ny > 23 THEN GOTO dead
  FOR i = 1 TO n: IF wx(i) = nx AND wy(i) = ny THEN GOTO dead
  NEXT i
  IF nx = fx AND ny = fy THEN
    n = n + 2: score = score + 10
    LOCATE 1, 15: COLOR 14: PRINT score; : COLOR 7
    SOUND 880, 1
    GOSUB apple
  ELSE
    LOCATE wy(n), wx(n): PRINT " ";
  END IF
  FOR i = n TO 2 STEP -1: wx(i) = wx(i - 1): wy(i) = wy(i - 1): NEXT i
  wx(1) = nx: wy(1) = ny
  COLOR 10: LOCATE ny, nx: PRINT CHR$(219); : COLOR 7
  SLEEP 0.09
LOOP
dead:
SOUND 200, 4
LOCATE 12, 12: COLOR 12: PRINT " GAME OVER - score"; score; " "; : COLOR 7
LOCATE 14, 10: PRINT " SPACE to play again, Esc to quit ";
DO: k$ = INKEY$: LOOP UNTIL k$ = " " OR k$ = CHR$(27)
IF k$ = " " THEN GOTO restart
END
apple:
DO
  fx = INT(RND * 40) + 1: fy = INT(RND * 21) + 3
  ok = 1
  FOR i = 1 TO n: IF wx(i) = fx AND wy(i) = fy THEN ok = 0
  NEXT i
LOOP UNTIL ok = 1
COLOR 12: LOCATE fy, fx: PRINT "*"; : COLOR 7
RETURN
`;
  SAMPLES['ORKWAR.BAS'] = `' ORKWAR.BAS - two robots on a skyline lob spanners at each other.
' Type an ANGLE (0-90) and a POWER (1-100). First to bonk the other one wins.
' (Like the banana game on Dad's PC, but with robots. So, better.)
' (It was Orks first. Dave said robots. Robots won 2-1, Gubbinz voted.)
DECLARE SUB drawbot (x, y, c)
RANDOMIZE TIMER
SCREEN 13
DIM bh(10)
again:
CLS
' skyline
FOR i = 0 TO 9: bh(i) = INT(RND * 90) + 50: NEXT i
FOR i = 0 TO 9
  LINE (i * 32, 200 - bh(i))-(i * 32 + 31, 199), 8 + (i MOD 3) * 0, BF
  LINE (i * 32, 200 - bh(i))-(i * 32 + 31, 199), 8, B
  FOR wy = 200 - bh(i) + 4 TO 192 STEP 8
    FOR wx = i * 32 + 4 TO i * 32 + 24 STEP 8
      IF RND < .7 THEN c = 14 ELSE c = 0
      LINE (wx, wy)-(wx + 3, wy + 4), c, BF
    NEXT wx
  NEXT wy
NEXT i
wind = INT(RND * 9) - 4
x1 = 20: y1 = 200 - bh(0) - 1
x2 = 300: y2 = 200 - bh(9) - 1
drawbot x1, y1, 10
drawbot x2, y2, 2
turn = 1
DO
  LOCATE 1, 1: PRINT "ROBO 1         wind"; wind; "       ROBO 2";
  LOCATE 2, 1: IF turn = 1 THEN PRINT "ROBO 1's go:       "; ELSE PRINT "ROBO 2's go:       ";
  LOCATE 3, 1: INPUT "angle"; a
  LOCATE 4, 1: INPUT "power"; p
  LOCATE 3, 1: PRINT SPACE$(30); : LOCATE 4, 1: PRINT SPACE$(30);
  IF turn = 1 THEN sx = x1 + 6: sy = y1 - 12: dir = 1 ELSE sx = x2 - 6: sy = y2 - 12: dir = -1
  vx = COS(a * 3.14159 / 180) * p / 8 * dir + wind / 10
  vy = -SIN(a * 3.14159 / 180) * p / 8
  bx = sx: by = sy: hit = 0
  DO
    ox = bx: oy = by
    bx = bx + vx: by = by + vy: vy = vy + .25
    IF bx < 0 OR bx > 319 OR by > 199 THEN EXIT DO
    IF by >= 0 THEN
      c = POINT(bx, by)
      IF c = 8 OR c = 14 THEN hit = 1: EXIT DO
      IF c = 10 THEN hit = 2: EXIT DO
      IF c = 2 THEN hit = 3: EXIT DO
      PSET (ox, oy), 0
      PSET (bx, by), 12
    END IF
    SLEEP 0.015
  LOOP
  IF hit = 1 THEN
    CIRCLE (bx, by), 8, 0: PAINT (bx, by), 0, 0
    SOUND 150, 2
  END IF
  IF hit = 2 OR hit = 3 THEN
    FOR r = 2 TO 20 STEP 2: CIRCLE (bx, by), r, 12 + (r MOD 3): SOUND 100 + r * 20, 1: NEXT r
    LOCATE 12, 10
    IF hit = 2 AND turn = 1 THEN PRINT "ROBO 1 bonked HIMSELF. Classic."
    IF hit = 2 AND turn = 2 THEN PRINT "ROBO 2 WINS! BOOYAH!"
    IF hit = 3 AND turn = 1 THEN PRINT "ROBO 1 WINS! BOOYAH!"
    IF hit = 3 AND turn = 2 THEN PRINT "ROBO 2 bonked HIMSELF. Classic."
    LOCATE 14, 8: PRINT "Play again? (Y/N)";
    DO: k$ = UCASE$(INKEY$): LOOP UNTIL k$ = "Y" OR k$ = "N"
    IF k$ = "Y" THEN GOTO again
    SCREEN 0: END
  END IF
  turn = 3 - turn
LOOP
SUB drawbot (x, y, c)
  ' a chunky robot: body, head, eyes, mouth grille, antenna arm
  LINE (x - 6, y - 10)-(x + 6, y), c, BF
  LINE (x - 4, y - 16)-(x + 4, y - 10), c, BF
  PSET (x - 2, y - 14), 12: PSET (x + 2, y - 14), 12
  LINE (x - 3, y - 11)-(x + 3, y - 11), 15
  LINE (x + 6, y - 8)-(x + 12, y - 18), 7
  LINE (x - 6, y)-(x - 6, y + 1), c: LINE (x + 6, y)-(x + 6, y + 1), c
END SUB
`;
  SAMPLES['BLOCKS.BAS'] = `' BLOCKS.BAS - falling blocks. NOT Tetris. (It's Tetris.) Arrows move, up turns, space drops.
RANDOMIZE TIMER
DIM board(10, 20), p(4, 4), q(4, 4)
DATA 0,1,0,0, 0,1,0,0, 0,1,0,0, 0,1,0,0
DATA 0,0,0,0, 0,1,1,0, 0,1,1,0, 0,0,0,0
DATA 0,0,0,0, 0,1,1,1, 0,0,1,0, 0,0,0,0
DATA 0,0,0,0, 0,1,1,0, 0,0,1,1, 0,0,0,0
DATA 0,0,0,0, 0,0,1,1, 0,1,1,0, 0,0,0,0
DATA 0,0,0,0, 0,1,1,1, 0,1,0,0, 0,0,0,0
DATA 0,0,0,0, 0,1,1,1, 0,0,0,1, 0,0,0,0
DIM shapes(7, 4, 4)
FOR s = 1 TO 7: FOR y = 1 TO 4: FOR x = 1 TO 4: READ shapes(s, y, x): NEXT x, y, s
CLS
score = 0: lines = 0
FOR y = 1 TO 20: LOCATE y + 2, 10: PRINT CHR$(186); SPACE$(20); CHR$(186); : NEXT y
LOCATE 23, 10: PRINT CHR$(200); STRING$(20, 205); CHR$(188);
GOSUB newpiece
tick = TIMER
DO
  k$ = INKEY$
  IF k$ = CHR$(27) THEN END
  IF k$ = CHR$(0) + "K" THEN GOSUB tryleft
  IF k$ = CHR$(0) + "M" THEN GOSUB tryright
  IF k$ = CHR$(0) + "H" THEN GOSUB tryrot
  IF k$ = " " THEN
    DO: py = py + 1: GOSUB fits: IF ok = 0 THEN py = py - 1: EXIT DO
    LOOP
    GOSUB land
  END IF
  IF TIMER - tick > .5 - lines / 60 THEN
    tick = TIMER
    py = py + 1: GOSUB fits
    IF ok = 0 THEN py = py - 1: GOSUB land
  END IF
  GOSUB drawall
  SLEEP 0.03
LOOP
newpiece:
s = INT(RND * 7) + 1: col = s + 8
FOR y = 1 TO 4: FOR x = 1 TO 4: p(y, x) = shapes(s, y, x): NEXT x, y
px = 4: py = 0
GOSUB fits
IF ok = 0 THEN
  LOCATE 12, 12: COLOR 12: PRINT " GAME OVER "; : COLOR 7
  LOCATE 14, 12: PRINT "score"; score;
  SLEEP: END
END IF
RETURN
fits:
ok = 1
FOR y = 1 TO 4: FOR x = 1 TO 4
  IF p(y, x) = 1 THEN
    bx = px + x: by = py + y
    IF bx < 1 OR bx > 10 OR by > 20 THEN ok = 0
    IF ok = 1 AND by >= 1 THEN IF board(bx, by) > 0 THEN ok = 0
  END IF
NEXT x, y
RETURN
tryleft: px = px - 1: GOSUB fits: IF ok = 0 THEN px = px + 1
RETURN
tryright: px = px + 1: GOSUB fits: IF ok = 0 THEN px = px - 1
RETURN
tryrot:
FOR y = 1 TO 4: FOR x = 1 TO 4: q(y, x) = p(y, x): NEXT x, y
FOR y = 1 TO 4: FOR x = 1 TO 4: p(y, x) = q(5 - x, y): NEXT x, y
GOSUB fits
IF ok = 0 THEN FOR y = 1 TO 4: FOR x = 1 TO 4: p(y, x) = q(y, x): NEXT x, y
RETURN
land:
FOR y = 1 TO 4: FOR x = 1 TO 4
  IF p(y, x) = 1 AND py + y >= 1 THEN board(px + x, py + y) = col
NEXT x, y
SOUND 300, 1
' clear lines
FOR y = 20 TO 1 STEP -1
  full = 1
  FOR x = 1 TO 10: IF board(x, y) = 0 THEN full = 0
  NEXT x
  IF full = 1 THEN
    lines = lines + 1: score = score + 100
    FOR yy = y TO 2 STEP -1: FOR x = 1 TO 10: board(x, yy) = board(x, yy - 1): NEXT x, yy
    FOR x = 1 TO 10: board(x, 1) = 0: NEXT x
    SOUND 600, 2
    y = y + 1
  END IF
NEXT y
GOSUB newpiece
RETURN
drawall:
FOR y = 1 TO 20
  LOCATE y + 2, 11
  FOR x = 1 TO 10
    c = board(x, y)
    FOR yy = 1 TO 4: FOR xx = 1 TO 4
      IF p(yy, xx) = 1 AND px + xx = x AND py + yy = y THEN c = col
    NEXT xx, yy
    IF c = 0 THEN PRINT " ."; ELSE COLOR c: PRINT CHR$(219); CHR$(219); : COLOR 7
  NEXT x
NEXT y
LOCATE 2, 35: PRINT "SCORE"; score
LOCATE 3, 35: PRINT "LINES"; lines
LOCATE 5, 35: PRINT "arrows + space"
LOCATE 6, 35: PRINT "esc = quit"
RETURN
`;
  SAMPLES['PODRACE.BAS'] = `' PODRACE.BAS - you're in a pod. It is very fast. Rocks. Left/right. Don't hit the rocks.
' (Inspired by the best bit of the film. Dave crashed in 4 seconds and said the keyboard was broken.)
RANDOMIZE TIMER
DIM rx(8), ry(8)
CLS
COLOR 14: LOCATE 1, 1: PRINT "POD RACE  -  distance: 0"; : COLOR 7
px = 20: dist = 0: speed = .12
FOR i = 1 TO 8: rx(i) = INT(RND * 36) + 3: ry(i) = INT(RND * 20) + 2: NEXT i
DO
  k$ = INKEY$
  IF k$ = CHR$(0) + "K" AND px > 2 THEN px = px - 1
  IF k$ = CHR$(0) + "M" AND px < 39 THEN px = px + 1
  IF k$ = CHR$(27) THEN END
  FOR i = 1 TO 8
    IF ry(i) >= 2 AND ry(i) <= 24 THEN LOCATE ry(i), rx(i): PRINT " ";
    ry(i) = ry(i) + 1
    IF ry(i) > 24 THEN ry(i) = 2: rx(i) = INT(RND * 36) + 3
    IF ry(i) >= 2 AND ry(i) <= 24 THEN COLOR 6: LOCATE ry(i), rx(i): PRINT "O"; : COLOR 7
    IF ry(i) = 22 AND ABS(rx(i) - px) <= 1 THEN GOTO crash
  NEXT i
  LOCATE 22, 1: PRINT SPACE$(40);
  COLOR 11: LOCATE 22, px - 1: PRINT "<" + CHR$(219) + ">"; : COLOR 7
  dist = dist + 1
  LOCATE 1, 26: PRINT dist;
  IF dist MOD 50 = 0 AND speed > .04 THEN speed = speed - .01: SOUND 1200, 1
  SLEEP speed
LOOP
crash:
FOR i = 1 TO 6: SOUND 100 + i * 50, 1: NEXT i
LOCATE 12, 8: COLOR 12: PRINT " CRASH! you went"; dist; "units "; : COLOR 7
LOCATE 13, 8: PRINT " (Dave: 4. You beat Dave.) ";
SLEEP
`;
  SAMPLES['DOGFIGHT.BAS'] = `' DOGFIGHT.BAS - starfighters in a starfield. Arrows aim, SPACE fires. 30 seconds. Pew pew.
RANDOMIZE TIMER
SCREEN 13
DIM sx(60), sy(60)
FOR i = 1 TO 60: sx(i) = RND * 320: sy(i) = RND * 200: NEXT i
ex = 160: ey = 100: edx = 2: edy = 1: hits = 0
cx = 160: cy = 100
t0 = TIMER
DO
  CLS
  FOR i = 1 TO 60
    sx(i) = sx(i) + 1: IF sx(i) > 319 THEN sx(i) = 0: sy(i) = RND * 200
    PSET (sx(i), sy(i)), 15 + (i MOD 2) * 7
  NEXT i
  ' the enemy fighter: a ball with two wing panels (it's a generic one, honest)
  ex = ex + edx: ey = ey + edy
  IF ex < 20 OR ex > 300 THEN edx = -edx + (RND - .5)
  IF ey < 20 OR ey > 180 THEN edy = -edy + (RND - .5)
  IF RND < .05 THEN edx = (RND - .5) * 6: edy = (RND - .5) * 4
  CIRCLE (ex, ey), 5, 8: PAINT (ex, ey), 7, 8
  LINE (ex - 12, ey - 9)-(ex - 9, ey + 9), 8, BF
  LINE (ex + 9, ey - 9)-(ex + 12, ey + 9), 8, BF
  LINE (ex - 9, ey)-(ex + 9, ey), 8
  ' crosshair
  k$ = INKEY$
  IF k$ = CHR$(0) + "K" THEN cx = cx - 6
  IF k$ = CHR$(0) + "M" THEN cx = cx + 6
  IF k$ = CHR$(0) + "H" THEN cy = cy - 6
  IF k$ = CHR$(0) + "P" THEN cy = cy + 6
  IF k$ = CHR$(27) THEN EXIT DO
  CIRCLE (cx, cy), 10, 10
  LINE (cx - 14, cy)-(cx + 14, cy), 10: LINE (cx, cy - 14)-(cx, cy + 14), 10
  IF k$ = " " THEN
    LINE (40, 199)-(cx, cy), 12: LINE (280, 199)-(cx, cy), 12
    SOUND 900, 1
    IF ABS(cx - ex) < 12 AND ABS(cy - ey) < 10 THEN
      hits = hits + 1
      FOR r = 2 TO 24 STEP 3: CIRCLE (ex, ey), r, 14 - (r MOD 3): NEXT r
      SOUND 150, 2
      ex = RND * 280 + 20: ey = RND * 160 + 20
    END IF
  END IF
  LOCATE 1, 1: PRINT "HITS:"; hits; "  TIME:"; INT(30 - (TIMER - t0));
  SLEEP 0.04
LOOP UNTIL TIMER - t0 > 30
SCREEN 0
PRINT "Time's up! You got"; hits; "hits."
IF hits > 8 THEN PRINT "Great shot, kid!" ELSE PRINT "Stay on target. Stay on target."
SLEEP
`;
  SAMPLES['SABER.BAS'] = `' SABER.BAS - lightsaber duel! Two players, one keyboard.
' Player 1 (green): A = swing.  Player 2 (red): L = swing.  Hit when the other one isn't swinging. First to 5.
RANDOMIZE TIMER
s1 = 0: s2 = 0
CLS
DO
  LOCATE 1, 1: COLOR 10: PRINT "GREEN:"; s1; : COLOR 12: LOCATE 1, 30: PRINT "RED:"; s2; : COLOR 7
  LOCATE 3, 5: PRINT "A = swing (green)      L = swing (red)"
  ' idle pose
  GOSUB drawleft: GOSUB drawright
  k$ = ""
  DO: k$ = UCASE$(INKEY$): LOOP UNTIL k$ = "A" OR k$ = "L" OR k$ = CHR$(27)
  IF k$ = CHR$(27) THEN END
  SOUND 180, 1: SOUND 240, 1
  ' the other one has a tiny moment to block
  t0 = TIMER: b$ = ""
  DO: b$ = UCASE$(INKEY$): LOOP UNTIL TIMER - t0 > .35 OR b$ = "A" OR b$ = "L"
  IF k$ = "A" THEN
    LOCATE 12, 14: COLOR 10: PRINT STRING$(8, 205); : COLOR 7
    IF b$ = "L" THEN LOCATE 14, 16: PRINT "CLASH! blocked"; : SOUND 600, 2 ELSE s1 = s1 + 1: LOCATE 14, 16: PRINT "HIT on red!     "; : SOUND 120, 3
  ELSE
    LOCATE 12, 14: COLOR 12: PRINT STRING$(8, 205); : COLOR 7
    IF b$ = "A" THEN LOCATE 14, 16: PRINT "CLASH! blocked"; : SOUND 600, 2 ELSE s2 = s2 + 1: LOCATE 14, 16: PRINT "HIT on green!   "; : SOUND 120, 3
  END IF
  SLEEP 0.8
  LOCATE 12, 14: PRINT SPACE$(8); : LOCATE 14, 16: PRINT SPACE$(16);
LOOP UNTIL s1 = 5 OR s2 = 5
LOCATE 18, 10
IF s1 = 5 THEN COLOR 10: PRINT "GREEN WINS. The tube is strong with this one." ELSE COLOR 12: PRINT "RED WINS. (It's a red felt tip, so it goes faster.)"
COLOR 7: SLEEP: END
drawleft:
COLOR 10
LOCATE 9, 8: PRINT " O "; : LOCATE 10, 8: PRINT "/|\\"; : LOCATE 11, 8: PRINT "/ \\"; : LOCATE 10, 11: PRINT CHR$(179); : LOCATE 9, 11: PRINT CHR$(179); : LOCATE 8, 11: PRINT CHR$(179);
COLOR 7: RETURN
drawright:
COLOR 12
LOCATE 9, 26: PRINT " O "; : LOCATE 10, 26: PRINT "/|\\"; : LOCATE 11, 26: PRINT "/ \\"; : LOCATE 10, 25: PRINT CHR$(179); : LOCATE 9, 25: PRINT CHR$(179); : LOCATE 8, 25: PRINT CHR$(179);
COLOR 7: RETURN
`;
  SAMPLES['MUSIC.BAS'] = `' MUSIC.BAS - PC speaker tunes with PLAY. (Turn SFX on: the speaker icon in the tray.)
CLS
PRINT "JACK'S JUKEBOX"
PRINT "1. Robot Marching Song (original, by me)"
PRINT "2. Scale of Doom"
PRINT "3. Modem Impression"
PRINT "4. Random noise (Dave's favourite)"
PRINT "Q. Quit"
DO
  k$ = UCASE$(INKEY$)
  IF k$ = "1" THEN PLAY "T140 O3 L8 C C G G A A G4 F F E E D D C4 O2 G G A A O3 C C O2 G4"
  IF k$ = "2" THEN PLAY "T200 O2 L16 C D E F G A B > C D E F G A B > C < B A G F E D C < B A G F E D C"
  IF k$ = "3" THEN PLAY "T255 O6 L32 C E G C E G < A > C A C < G > G L64 C E G B A F C E G B A F C E G B"
  IF k$ = "4" THEN FOR i = 1 TO 20: SOUND 100 + RND * 2000, 1: NEXT i
LOOP UNTIL k$ = "Q"
`;
  SAMPLES['CLOCK.BAS'] = `' CLOCK.BAS - a big clock. Big numbers made of blocks. Esc to quit.
DIM d$(9, 5)
DATA "###","# #","# #","# #","###"
DATA "  #","  #","  #","  #","  #"
DATA "###","  #","###","#  ","###"
DATA "###","  #","###","  #","###"
DATA "# #","# #","###","  #","  #"
DATA "###","#  ","###","  #","###"
DATA "###","#  ","###","# #","###"
DATA "###","  #","  #","  #","  #"
DATA "###","# #","###","# #","###"
DATA "###","# #","###","  #","###"
FOR n = 0 TO 9: FOR r = 1 TO 5: READ d$(n, r): NEXT r, n
CLS
DO
  t$ = TIME$
  FOR r = 1 TO 5
    LOCATE 8 + r, 10
    FOR i = 1 TO 8
      c$ = MID$(t$, i, 1)
      IF c$ = ":" THEN
        IF r = 2 OR r = 4 THEN PRINT " " + CHR$(219) + " "; ELSE PRINT "   ";
      ELSE
        row$ = d$(VAL(c$), r)
        FOR j = 1 TO 3
          IF MID$(row$, j, 1) = "#" THEN COLOR 11: PRINT CHR$(219); ELSE PRINT " ";
        NEXT j
        COLOR 7
      END IF
      PRINT " ";
    NEXT i
  NEXT r
  LOCATE 16, 10: PRINT DATE$; "   (it is 1999. it is always 1999.)"
  SLEEP 0.5
LOOP UNTIL INKEY$ = CHR$(27)
`;
  SAMPLES['TUTORIAL.BAS'] = `' TUTORIAL.BAS - learn JBASIC in 8 lessons. By Jack. (${TEACHER} checked lesson 3.)
CLS
COLOR 14: PRINT "JBASIC TUTORIAL": COLOR 7
PRINT "8 tiny lessons. Press a key after each one. Esc quits."
PRINT
lesson = 1
DO
  SELECT CASE lesson
    CASE 1
      PRINT "LESSON 1: PRINT puts words on the screen."
      PRINT "  PRINT " + CHR$(34) + "hello" + CHR$(34) + "   shows:  hello"
      PRINT "  PRINT 2 + 2            shows:   4   (with a space, numbers get a space)"
      PRINT "  Try it: in the editor, type PRINT " + CHR$(34) + "COWABUNGA" + CHR$(34) + " and press F5."
    CASE 2
      PRINT "LESSON 2: variables remember things."
      PRINT "  score = 10        a number. Plain name."
      PRINT "  name$ = " + CHR$(34) + "Jack" + CHR$(34) + "    words. The $ means WORDS. Took me ages."
      PRINT "  score = score + 1 adds one. Computers love this."
      score = 10: score = score + 1
      PRINT "  (score is now"; score; ")"
    CASE 3
      PRINT "LESSON 3: INPUT asks you a question."
      INPUT "  What's your favourite go-kart colour"; c$
      IF UCASE$(c$) = "RED" THEN PRINT "  Correct. Red ones go faster." ELSE PRINT "  "; c$; " is fine but red goes faster."
    CASE 4
      PRINT "LESSON 4: IF decides things."
      PRINT "  IF a > 10 THEN PRINT " + CHR$(34) + "big" + CHR$(34) + " ELSE PRINT " + CHR$(34) + "small" + CHR$(34)
      PRINT "  You can do blocks too: IF ... THEN (new line) ... ELSE ... END IF"
    CASE 5
      PRINT "LESSON 5: FOR loops go round and round."
      PRINT "  FOR i = 1 TO 5: PRINT i;: NEXT i     shows:";
      FOR i = 1 TO 5: PRINT i;: NEXT i
      PRINT
      PRINT "  (i wanted 1000. ${TEACHER} said no.)"
    CASE 6
      PRINT "LESSON 6: strings (words) have tools."
      PRINT "  LEFT$(" + CHR$(34) + "GUBBINZ" + CHR$(34) + ", 3) = "; LEFT$("GUBBINZ", 3)
      PRINT "  LEN(" + CHR$(34) + "TETRIS" + CHR$(34) + ") ="; LEN("TETRIS")
      PRINT "  UCASE$(" + CHR$(34) + "dave" + CHR$(34) + ") = "; UCASE$("dave"); "   (shouting)"
    CASE 7
      PRINT "LESSON 7: RND makes random numbers. INT chops off the bits after the dot."
      PRINT "  dice = INT(RND * 6) + 1    a number from 1 to 6. Like this:";
      RANDOMIZE TIMER
      FOR i = 1 TO 5: PRINT INT(RND * 6) + 1;: NEXT i
      PRINT
    CASE 8
      PRINT "LESSON 8: SCREEN 13 is 320 by 200 dots and 256 colours. Watch."
      SLEEP 1
      SCREEN 13
      FOR i = 0 TO 255: LINE (i, 0)-(i, 100), i: NEXT i
      CIRCLE (160, 150), 40, 15: PAINT (160, 150), 4, 15
      LOCATE 24, 1: PRINT "PSET, LINE, CIRCLE, PAINT. That's it. Go!";
      SLEEP
      SCREEN 0
      PRINT "THE END. Now open MYFIRST.BAS and change things until it breaks. That's how you learn."
      END
  END SELECT
  PRINT: PRINT "(press a key)": SLEEP: k$ = INKEY$: IF k$ = CHR$(27) THEN END
  CLS
  lesson = lesson + 1
LOOP
`;
  SAMPLES['ORKNAME.BAS'] = `' ORKNAME.BAS - Ork name generator. For naming Orks. (Mine are all called Gitface. This fixes that.)
RANDOMIZE TIMER
DIM a$(10), b$(10), t$(8)
DATA Gor, Naz, Grim, Skar, Zog, Mog, Ug, Drak, Wurr, Bad
DATA zag, gob, snik, drek, skul, fang, nob, git, tusk, rip
DATA "da Loud", "Big Teef", "Wot Bites", "da Red", "Two Choppas", "da Fasta", "Gob-Breff", "No-Ears"
FOR i = 1 TO 10: READ a$(i): NEXT i
FOR i = 1 TO 10: READ b$(i): NEXT i
FOR i = 1 TO 8: READ t$(i): NEXT i
CLS
COLOR 10: PRINT "ORK NAME GENERATOR": COLOR 7
PRINT
DO
  n$ = a$(INT(RND * 10) + 1) + b$(INT(RND * 10) + 1)
  IF RND < .5 THEN n$ = n$ + " " + t$(INT(RND * 8) + 1)
  PRINT "  "; n$
  PRINT "  (space = another, Esc = done)"
  DO: k$ = INKEY$: LOOP UNTIL k$ <> ""
LOOP UNTIL k$ = CHR$(27)
`;
  SAMPLES['MAZE.BAS'] = `' MAZE.BAS - makes a maze, then you walk it. Arrows. Get to the X. It's never the same twice.
RANDOMIZE TIMER
W = 19: H = 11
DIM m(W, H), sx(300), sy(300)
FOR y = 0 TO H: FOR x = 0 TO W: m(x, y) = 1: NEXT x, y
' carve with a stack (${TEACHER} called it "depth first". I call it "digging")
cx = 1: cy = 1: m(1, 1) = 0: sp = 1: sx(1) = 1: sy(1) = 1
DO
  tries = 0
  DO
    d = INT(RND * 4): dx = 0: dy = 0
    IF d = 0 THEN dx = 2
    IF d = 1 THEN dx = -2
    IF d = 2 THEN dy = 2
    IF d = 3 THEN dy = -2
    nx = cx + dx: ny = cy + dy
    ok = 0
    IF nx > 0 AND nx < W AND ny > 0 AND ny < H THEN IF m(nx, ny) = 1 THEN ok = 1
    tries = tries + 1
  LOOP UNTIL ok = 1 OR tries > 30
  IF ok = 1 THEN
    m(nx, ny) = 0: m(cx + dx / 2, cy + dy / 2) = 0
    cx = nx: cy = ny: sp = sp + 1: sx(sp) = cx: sy(sp) = cy
  ELSE
    sp = sp - 1: IF sp < 1 THEN EXIT DO
    cx = sx(sp): cy = sy(sp)
  END IF
LOOP
CLS
FOR y = 0 TO H: FOR x = 0 TO W
  LOCATE y + 2, x * 2 + 1
  IF m(x, y) = 1 THEN COLOR 8: PRINT CHR$(219); CHR$(219); ELSE PRINT "  ";
NEXT x, y
COLOR 14: LOCATE H + 1, (W - 1) * 2 + 1: PRINT "X"; : COLOR 7
px = 1: py = 1: moves = 0
DO
  COLOR 10: LOCATE py + 2, px * 2 + 1: PRINT "@"; : COLOR 7
  DO: k$ = INKEY$: LOOP UNTIL k$ <> ""
  IF k$ = CHR$(27) THEN END
  nx = px: ny = py
  IF k$ = CHR$(0) + "H" THEN ny = py - 1
  IF k$ = CHR$(0) + "P" THEN ny = py + 1
  IF k$ = CHR$(0) + "K" THEN nx = px - 1
  IF k$ = CHR$(0) + "M" THEN nx = px + 1
  IF m(nx, ny) = 0 THEN LOCATE py + 2, px * 2 + 1: PRINT " "; : px = nx: py = ny: moves = moves + 1
LOOP UNTIL px = W - 1 AND py = H - 1
LOCATE H + 4, 1: PRINT "OUT! in"; moves; "moves. (Gubbinz would have eaten the walls.)"
SLEEP
`;
  const SDATES = { 'MYFIRST.BAS': '20/01/99', 'GUESS.BAS': '02/02/99', 'STARS.BAS': '14/02/99', 'FRACTAL.BAS': '05/03/99', 'CUBESCRM.BAS': '20/04/99', 'WORM.BAS': '11/05/99', 'ORKWAR.BAS': '28/06/99', 'BLOCKS.BAS': '17/04/99', 'PODRACE.BAS': '24/07/99', 'DOGFIGHT.BAS': '31/07/99', 'SABER.BAS': '02/08/99', 'MUSIC.BAS': '09/09/99', 'CLOCK.BAS': '03/10/99', 'TUTORIAL.BAS': '10/10/99', 'ORKNAME.BAS': '12/09/99', 'MAZE.BAS': '27/08/99' };
  Object.keys(SAMPLES).forEach(n => bas(JB, n, SDATES[n] || '14/02/99', SAMPLES[n], n === 'MYFIRST.BAS' ? { secret: 'dos.myfirst' } : {}));
  txt(JB, 'IDEAS.TXT', '12/10/99', `PROGRAM IDEAS\n\n- a Gubbinz tamagotchi (DONE, it's on the website, Jackotchi)\n- Ork name generator (Grotsnik? Nazdreg? Gitface? needs work)\n- a thing that does my maths homework (Mr Bell says this is "cheating". ${TEACHER} says it's "automation")\n- JackOS 2000 (a whole operating system in JBASIC. ${TEACHER} did a face.)\n- a program that prints DAVE IS NOT ACE 1 million times (done. took 9 minutes. Mom came in.)\n- pod race but 3D (how do you do 3D)\n- a text adventure. a BIG one. (see C:\\GAMES\\JACKQUEST.EXE. I did it. 2 months. 44 rooms.)\n`);

  // ---- C:\GAMES: the adventure, the DOS screensaver
  const GA = 'C:/GAMES';
  dosexe(GA, 'JACKQUEST.EXE', '30/09/99', '248 KB', 'grotquest');
  txt(GA, 'JACKQUEST.TXT', '30/09/99', `JACK QUEST                                                     by Jack, 1999\n==========\nA TEXT ADVENTURE. Like the old ones on Dad's PC where you type GO NORTH and it\nsays "You can't go that way" about 400 times. Except mine is good.\n\nYou are Jack. It's a Saturday. Gubbinz has gone missing. Something is going on\nunder the bed. There are 44 rooms, a school, Dave, a shed, a whole Toy Kingdom, and\na Rubik's cube that might be the most important object in the universe.\n\nHOW TO PLAY\n  Type what you want to do. Short sentences. The game understands things like:\n  LOOK, GO NORTH (or just N, S, E, W, UP, DOWN, IN, OUT), TAKE thing, DROP thing,\n  EXAMINE thing (X thing), OPEN, CLOSE, USE thing ON thing, GIVE thing TO person,\n  TALK TO person, ASK person ABOUT thing, INVENTORY (I), WAIT (Z), SCORE,\n  SAVE, RESTORE, HINT (costs points!), HELP, QUIT.\n\nSCORE: 350 points. Nobody has got 350. Dave got 40 and typed rude words.\n\nTIPS\n  - EXAMINE everything. Twice.\n  - Things from the real world work in the Toy Kingdom. Especially snacks.\n  - Mom is not a puzzle. Mom is a FORCE OF NATURE.\n  - If you're stuck, HINT. Lose 5 points. Keep your dignity.\n`);
  dosexe(GA, 'SAVER.COM', '03/05/99', '4 KB', 'saver');
  dosexe(GA, 'MATRIX.COM', '02/07/99', '3 KB', 'matrix');
  txt(GA, 'HISCORES.TXT', '11/10/99', `DOS GAME HIGH SCORES (the honest list)\n\nWORM.BAS      JACK   340     DAVE   20 ("the arrows are backwards")\nBLOCKS.BAS    JACK  2100     DAVE  300\nPODRACE.BAS   JACK   612     DAVE    4\nDOGFIGHT.BAS  JACK    14     DAVE    0 (he fired at the stars)\nORKWAR.BAS    JACK 9 wins    DAVE 2 wins (he bonked himself 4 times)\nJACK QUEST    JACK 350/350   DAVE 40/350 (typed rude words, got told off BY THE GAME)\n`);
  txt(GA, 'NOTES.TXT', '04/10/99', `JACKQUEST - MY OWN NOTES (don't read these if you're playing it)\n\nthe maze is not a real maze, the TOY TUNNELS go in a circle, follow the smell\nthe cube needs the paper from the library\nthe big blobbit likes crisps (alien flavour. blobbits eat anything.)\nthe password is on the gate. (it used to be WAAAGH. that still works. I am not a monster.)\nthe toy shop queue: you just WAIT. that's the puzzle. that's what queueing IS.\nthe lightsaber is a wrapping paper tube. it was always going to be a wrapping paper tube.\nDave's password is in Dave's floppy (A:) obviously\n`, { hidden: true });

  // ---- C:\GAMES\SHAREWAR: the DOS shareware folder (Dad's friend Kevin brought these on floppies)
  const SW = GA + '/SHAREWAR'; A.fs.dir(SW).date = '06/06/99';
  [['JACKCRAWL.EXE', '88 KB', 'grotcrawl'], ['DAKKA.EXE', '41 KB', 'dakka'], ['SQUIGPIE.EXE', '29 KB', 'squigpie'], ['SQUIGHUNT.EXE', '22 KB', 'squighunt'], ['TRUKKRACE.EXE', '35 KB', 'trukkrace'], ['GEMWARS.EXE', '47 KB', 'teefwars'], ['INTRO.EXE', '64 KB', 'intro'], ['TPAINT.EXE', '52 KB', 'tpaint'], ['JACKTRAK.EXE', '73 KB', 'grottrak'], ['HEXED.EXE', '18 KB', 'hexed'], ['CALC.EXE', '12 KB', 'calc'], ['JACKSCAN.EXE', '96 KB', 'grotscan'], ['SQUASH.EXE', '31 KB', 'squash'], ['UNSQUASH.EXE', '27 KB', 'unsquash'], ['EDLIN.EXE', '14 KB', 'edlin'], ['DOSSHELL.EXE', '44 KB', 'dosshell']].forEach(([n, sz, p]) => dosexe(SW, n, '06/06/99', sz, p));
  txt(SW, 'README.TXT', '06/06/99', `DOS SHAREWARE - from Kevin's floppies (Dad's friend Kevin, the one with the beard)\n=================================================================================\nAll of these run from the MS-DOS Prompt. Type the name. Or double-click them.\n\nGAMES\n  JACKCRAWL  a dungeon game made of letters. You are @. Goblins are g. Slimes are s. Get to > five times.\n  DAKKA      FLAK ATTACK! Flying saucers drop little green men on parachutes. Shoot them before four\n             land on one side. Left/right/space. (The file is still called DAKKA. Kevin named it.)\n  SQUIGPIE   CHIP VAN TYCOON. Run a chip van for a week. Buy chips and signs, set a price, watch the\n             weather. Dave went bust on day 2.\n  SQUIGHUNT  ALIEN HUNT. The Big Alien is in one of 20 caves. So are two bottomless pits and two\n             space bats. You have 5 stun darts.\n  TRUKKRACE  TURBO RACER. Drive down a road that bends. It gets faster. Your car is red. Left/right.\n  GEMWARS    a BBS door game. 10 turns. Buy miners, robots and lasers. Raid Dave's asteroid. Don't get raided.\n\nTOOLS\n  INTRO      a demo. Plasma, a scroller, copper bars, a tune. Made at ${Cast.n('cousin2')}'s. ${Cast.n('cousin2')} did the maths.\n  TPAINT     paint with letters and colours. Saves .ANS files into C:\\ANSI. F1 for help.\n  JACKTRAK   a music tracker. Type notes on the keyboard, press space, it plays. Saves .TRK files.\n  HEXED      a hex editor. Look at files as numbers. Change the numbers. Feel like a hacker.\n  CALC       a calculator. Type sums. It does them. (Mr Bell says this is "cheating". ${TEACHER} says "automation".)\n  JACKSCAN   a DOS virus scanner. Finds Gubbinz. Can't remove him. Nobody can.\n  SQUASH     makes .SQZ archives, like WinJack but it works. UNSQUASH gets them back.\n  EDLIN      the line editor from 1981. For when EDIT is too easy.\n  DOSSHELL   a menu. For people who don't like typing. (Why are you in DOS then?)\n\nSHAREWARE: if you like them, send Kevin 5 quid. Nobody has ever sent Kevin 5 quid.\n`);
  txt(SW, 'HISCORE.DAT', '11/10/99', `JACKCRAWL   JACK  level 5  2140\nDAKKA       JACK  41 aliens\nTRUKKRACE   JACK  1870m   DAVE  40m (into a gnome)\nSQUIGPIE    JACK  12 Rupees profit   DAVE  -9 (bust, day 2)\nSQUIGHUNT   JACK  got it in 9 goes\nGEMWARS     JACK  beat Dave 10-0   DAVE  "the game is rigged"\n`);
  // ---- C:\GC: Jack Commander (the two-pane file manager)
  const GC = 'C:/GC'; A.fs.dir(GC).date = '08/03/99';
  dosexe(GC, 'GC.EXE', '08/03/99', '112 KB', 'gc');
  txt(GC, 'GC.INI', '08/03/99', `[Jack Commander]\nLeftPanel=C:\\\nRightPanel=C:\\GAMES\nShowHidden=0\nConfirmDelete=1\nColourScheme=Blue (there is only blue)\nGubbinzInPanels=1\n`);
  txt(GC, 'README.TXT', '08/03/99', `JACK COMMANDER 2.0\n==================\nTwo panels. Tab swaps. Enter opens. The function keys at the bottom do things.\n\n F1 Help  F2 Menu  F3 View  F4 Edit  F5 Copy  F6 RenMov  F7 MkDir  F8 Delete  F9 Menu  F10 Quit\n\nIt's like the one Dad's friend Kevin uses. Kevin says you "never need JackOS".\nKevin also says the year 2000 will "sort the wheat from the chaff". Nobody knows what that means.\n`);

  // ---- C:\BATCH: batch files
  const BT = 'C:/BATCH'; A.fs.dir(BT).date = '21/03/99';
  const batfile = (name, date, text, extra) => put(BT, Object.assign({ name, type: 'txt', date, text }, extra || {}));
  batfile('HELLO.BAT', '21/03/99', `@ECHO OFF\nREM my first batch file. Dad showed me. It took 2 minutes. I was bored.\nECHO Hello from a batch file!\nECHO.\nECHO Your name is %1 (if you typed one after HELLO)\nECHO.\nPAUSE\n`);
  batfile('MENU.BAT', '22/03/99', `@ECHO OFF\n:TOP\nCLS\nECHO ======================================\nECHO   JACK'S DOS MENU (press a number)\nECHO ======================================\nECHO   1. JBASIC\nECHO   2. Jack Quest\nECHO   3. Jack Commander\nECHO   4. Show the memory (MEM /C)\nECHO   5. Feed Gubbinz\nECHO   Q. Quit\nECHO.\nCHOICE /C:12345Q /N Pick one:\nIF ERRORLEVEL 6 GOTO END\nIF ERRORLEVEL 5 GOTO FEED\nIF ERRORLEVEL 4 GOTO MEM\nIF ERRORLEVEL 3 GOTO GC\nIF ERRORLEVEL 2 GOTO GQ\nIF ERRORLEVEL 1 GOTO JB\n:JB\nC:\\JBASIC\\JBASIC.EXE\nGOTO TOP\n:GQ\nC:\\GAMES\\JACKQUEST.EXE\nGOTO TOP\n:GC\nC:\\GC\\GC.EXE\nGOTO TOP\n:MEM\nMEM /C\nPAUSE\nGOTO TOP\n:FEED\nECHO Feeding Gubbinz...\nECHO Gubbinz ate it. And the plate.\nPAUSE\nGOTO TOP\n:END\nECHO Bye!\n`);
  batfile('ORK.BAT', '03/04/99', `@ECHO OFF\nECHO                  ,      ,\nECHO                 /(.-""-.)\\\nECHO             ^|\\  \\/      \\/  /^|\nECHO             ^| \\ / =.  .= \\ / ^|\nECHO             \\( \\   o\\/o   / )/\nECHO              \\_, '-/  \\-' ,_/\nECHO                /   \\__/   \\\nECHO                \\ \\__/\\__/ /\nECHO              ___\\ \\^|--^|/ /___\nECHO            /\`    \\      /    \`\\\nECHO           /       '----'       \\\nECHO.\nECHO                 WAAAGH!\n`);
  batfile('COUNT.BAT', '10/04/99', `@ECHO OFF\nREM counts to 10 using GOTO because batch files can't add up (neither can Dave)\nSET N=\n:LOOP\nIF "%N%"=="" SET N=1\nIF "%N%"=="1" ECHO 1 && SET N=2\nECHO (batch files cannot actually count. this file is a lie. sorry.)\nECHO 1 2 3 4 5 6 7 8 9 10\nECHO there. counted.\nSET N=\n`);
  batfile('Y2K.BAT', '01/09/99', `@ECHO OFF\nECHO Y2K READINESS CHECK\nECHO -------------------\nDATE /T\nECHO Checking BIOS clock...     1999 OK\nECHO Checking video recorder... 12:00 (flashing) (always)\nECHO Checking Mom's tins...     52 tins of beans\nECHO Checking Dad...            "it'll be fine"\nECHO.\nECHO RESULT: PROBABLY FINE\nECHO (Jack's note: if you are reading this after 1 Jan 2000 and the computer works, I TOLD you)\n`);
  batfile('DAVE.BAT', '18/03/99', `@ECHO OFF\nREM Dave wrote this one at mine. He typed with two fingers.\nECHO DAVE IS ACE\nECHO DAVE IS ACE\nECHO DAVE IS ACE\nECHO (jack says i am "not ace" so i put it 3 times)\nECHO DAVE IS ACE\n`);
  batfile('BACKUP.BAT', '14/09/99', `@ECHO OFF\nREM backs up my documents to the floppy. In theory.\nECHO Backing up C:\\MY DOCUMENTS to A:\\\nCOPY "C:\\MY DOCUMENTS\\*.TXT" A:\\\nECHO (if that said "not ready", put a disk in. If it said "write protect", it's Dave's disk. Again.)\n`);
  batfile('README.TXT', '21/03/99', `BATCH FILES\n\nA batch file is a list of DOS commands in a .BAT file. Type the name and it does them all.\nTry: HELLO Jack  /  MENU  /  DAVE  /  Y2K\n\nMake your own: COPY CON MINE.BAT, type the commands, F6, Enter. Or EDIT MINE.BAT.\nThe C:\\AUTOEXEC.BAT runs every time the PC starts. Dad says don't touch it. (TYPE it though.)\n`);

  // ---- C:\ANSI: ANSI art (view with TYPE or ANSI, or double-click)
  const AN = 'C:/ANSI'; A.fs.dir(AN).date = '19/06/99';
  const E = '\x1b[';
  ans(AN, 'LOGO.ANS', '19/06/99', `${E}0m${E}1;33m   ___  ___   ____ _  __      ___  ______ ______ ___   ____ _  __ __\n${E}1;33m  / _ |/ _ \\ / __// |/ /     / _ |/_  __//_  __// _ | / __// |/ // /\n${E}1;33m / __ // // // /_ /    /    / __ |  / /    / /  / __ |/ /_ /    //_/ \n${E}1;33m/_/ |_/____//___//_/|_/    /_/ |_| /_/    /_/  /_/ |_/\\___//_/|_/(_)  \n${E}0;36m${'\u2550'.repeat(70)}\n${E}1;32m   JACK ATTACK! ONLINE ${E}0;37m- the games mag wot Jack made - ${E}1;35mDOS EDITION\n${E}0;36m${'\u2550'.repeat(70)}\n${E}0m`);
  ans(AN, 'ORK.ANS', '19/06/99', `${E}0m${E}1;32m            ${E}42m     ${E}40m\n${E}1;32m         ${E}42m           ${E}40m        ${E}1;33mWAAAGH!\n${E}1;32m       ${E}42m   ${E}1;37;42m@${E}1;32;42m       ${E}1;37;42m@${E}1;32;42m   ${E}40m\n${E}1;32m       ${E}42m    ${E}0;30;42m\u2588\u2588\u2588\u2588\u2588${E}1;32;42m     ${E}40m   ${E}0;37m<- dis is me nose\n${E}1;32m       ${E}42m  ${E}1;37;42m\u2580${E}1;32;42m \u2580 ${E}1;37;42m\u2580${E}1;32;42m \u2580 ${E}1;37;42m\u2580${E}1;32;42m  ${E}40m   ${E}0;37m<- teef (8 of 'em)\n${E}1;32m         ${E}42m           ${E}40m\n${E}0;31m    ${E}41m                   ${E}40m   ${E}0;37m<- red. goes fasta.\n${E}0;31m    ${E}41m   ${E}1;33;41m  ORK  ${E}0;31;41m        ${E}40m\n${E}0;31m    ${E}41m                   ${E}40m\n${E}0;33m      ${E}43m   ${E}40m         ${E}43m   ${E}40m\n${E}0;33m      ${E}43m   ${E}40m         ${E}43m   ${E}40m\n${E}0;37m    ${E}1;30m\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580${E}0m\n${E}0;37m    ORK.ANS - drawn in TheDraw at ${Cast.n('cousin2')}'s. 40 minutes. Worth it.\n${E}0m`);
  ans(AN, 'GUBBINZ.ANS', '20/06/99', `${E}0m${E}1;32m        \u2584\u2584      \u2584\u2584\n${E}1;32m       \u2588${E}1;37m\u2588${E}1;32m\u2588\u2584\u2584\u2584\u2584\u2588${E}1;37m\u2588${E}1;32m\u2588        ${E}1;33mGUBBINZ\n${E}1;32m     \u2584\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2584      ${E}0;37m(desktop pal)\n${E}1;32m    \u2588\u2588${E}0;30;42m o ${E}1;32;40m\u2588\u2588\u2588${E}0;30;42m o ${E}1;32;40m\u2588\u2588\n${E}1;32m    \u2588\u2588\u2588\u2588\u2588${E}1;37m\u2580\u2580\u2580${E}1;32m\u2588\u2588\u2588\u2588\u2588     ${E}0;37m<- he's smiling\n${E}1;32m     \u2580\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2580\n${E}0;31m       \u2584\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2584      ${E}0;37m<- his red coat (borrowed)\n${E}0;31m       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\n${E}0;33m        \u2588\u2588    \u2588\u2588\n${E}0;37m  "It looks like you're reading a file! Would you like help? No? Fair."\n${E}0m`);
  ans(AN, 'STARFTR.ANS', '24/07/99', `${E}0m${E}0;37m                    ${E}1;37m\u2584\n${E}0;37m                   ${E}1;37m\u2588\u2588\u2588                       ${E}1;33mSTARFIGHTER\n${E}0;37m          ${E}1;31m\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${E}1;37m\u2588\u2588\u2588${E}1;31m\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550              ${E}0;37m(generic. not any specific one. honest.)\n${E}0;37m         ${E}1;31m\u2588${E}0;37m        ${E}1;37m\u2588\u2588\u2588${E}0;37m        ${E}1;31m\u2588\n${E}0;37m         ${E}1;31m\u2588${E}0;37m     ${E}1;36m\u2584\u2584${E}1;37m\u2588\u2588\u2588\u2588\u2588${E}1;36m\u2584\u2584${E}0;37m     ${E}1;31m\u2588        ${E}0;37m<- four wings. S-shaped. well, X-shaped.\n${E}0;37m         ${E}1;31m\u2588${E}0;37m    ${E}1;36m\u2588\u2588\u2588${E}1;37m\u2588\u2588\u2588\u2588\u2588${E}1;36m\u2588\u2588\u2588${E}0;37m    ${E}1;31m\u2588\n${E}0;37m         ${E}1;31m\u2588${E}0;37m     ${E}1;36m\u2580\u2580${E}1;37m\u2588\u2588\u2588\u2588\u2588${E}1;36m\u2580\u2580${E}0;37m     ${E}1;31m\u2588        ${E}0;37m<- engines (4) (they glow pink)\n${E}0;37m          ${E}1;31m\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${E}1;37m\u2588\u2588\u2588${E}1;31m\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n${E}0;37m                   ${E}1;37m\u2580\u2588\u2580\n${E}0;37m                    ${E}1;35m\u2591                                 ${E}0;37m<- the laser (goes "pew")\n${E}0;37m                    ${E}1;35m\u2591\n${E}0;37m   ${E}0;36m${'\u2500'.repeat(60)}\n${E}0;37m   Drawn after seeing the film for the 3rd time (16 July 1999, queue: 3 hours).\n${E}0;37m   The pilot has a little droid in the back. The droid does all the work.\n${E}0m`, { secret: 'dos.starfighter' });
  const bbsRow = (inner) => { const vis = inner.replace(/\x1b\[[0-9;]*m/g, '').length; return `${E}0;34m\u2551${inner}${' '.repeat(Math.max(0, 58 - vis))}${E}0;34m\u2551\n`; };
  ans(AN, 'BBS.ANS', '21/06/99', `${E}0m${E}0;34m\u2554${'\u2550'.repeat(58)}\u2557\n` + bbsRow(` ${E}1;36m   JACK'S BBS   ${E}0;37m-  "The Board Wot Jack Made"  ${E}1;33m[ 1 node ]`) + `${E}0;34m\u2560${'\u2550'.repeat(58)}\u2563\n` + bbsRow(` ${E}0;37m [${E}1;37mM${E}0;37m]essages      [${E}1;37mF${E}0;37m]iles        [${E}1;37mD${E}0;37m]oors (games)`) + bbsRow(` ${E}0;37m [${E}1;37mC${E}0;37m]hat w/ SysOp [${E}1;37mU${E}0;37m]ser list    [${E}1;37mG${E}0;37m]oodbye`) + `${E}0;34m\u2560${'\u2550'.repeat(58)}\u2563\n` + bbsRow(` ${E}0;32m SysOp: Jack    Co-SysOp: Gubbinz (asleep)   Users: 2`) + bbsRow(` ${E}0;32m Hours: 4pm-8pm (Mom needs the phone)   Speed: 14.4 (sorry)`) + `${E}0;34m\u255a${'\u2550'.repeat(58)}\u255d\n${E}0;37m   (This was going to be a real BBS in 1998. Then we got the Internet. Then the\n${E}0;37m    website. This screen is all that's left. It's a nice screen though.)\n${E}0m`);
  ans(AN, 'SQUIG.ANS', '22/06/99', `${E}0m${E}1;31m        \u2584\u2588\u2588\u2584        \u2584\u2588\u2588\u2584\n${E}1;31m       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588         ${E}1;33mBLOBBIT\n${E}1;31m      \u2588\u2588\u2588\u2588${E}1;37m\u2588\u2588${E}0;30m\u2588${E}1;31m\u2588\u2588\u2588\u2588\u2588\u2588${E}1;37m\u2588\u2588${E}0;30m\u2588${E}1;31m\u2588\u2588\u2588\u2588       ${E}0;37m(my own critter. NOT a Pokemon.)\n${E}1;31m      \u2588\u2588\u2588\u2588${E}1;37m\u2580\u2580${E}0;30m\u2580${E}1;31m\u2588\u2588\u2588\u2588\u2588\u2588${E}1;37m\u2580\u2580${E}0;30m\u2580${E}1;31m\u2588\u2588\u2588\u2588\n${E}1;31m      \u2588\u2588${E}1;35m\u2584\u2584${E}1;31m\u2588\u2588${E}0;31m\u2580\u2584\u2584\u2584\u2584\u2584\u2584\u2580${E}1;31m\u2588\u2588${E}1;35m\u2584\u2584${E}1;31m\u2588\u2588      ${E}0;37m<- grin (massive)\n${E}1;31m       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\n${E}1;31m        \u2580\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2580\n${E}1;31m           \u2588\u2588      \u2588\u2588          ${E}0;37m<- legs (2) (it bounces)\n${E}0;37m   ${E}5;1;33mBOING${E}0;37m  (that bit is blinking. ANSI can BLINK. ${Cast.n('cousin2')} showed me.)\n${E}0m`);
  ans(AN, 'CUBE.ANS', '23/06/99', `${E}0m${E}0;37m          ${E}1;37;47m   ${E}1;31;41m   ${E}1;34;44m   ${E}0;37;40m\n${E}0;37m         ${E}1;33;43m   ${E}1;32;42m   ${E}1;37;47m   ${E}0;37;40m ${E}1;31;41m \n${E}0;37m        ${E}1;31;41m   ${E}1;34;44m   ${E}1;33;43m   ${E}0;37;40m ${E}1;32;42m  ${E}0;37;40m\n${E}0;37m       ${E}1;32;42m   ${E}1;37;47m   ${E}1;31;41m   ${E}0;37;40m ${E}1;34;44m   ${E}0;37;40m        ${E}1;33mRUBIK'S CUBE\n${E}0;37m       ${E}1;34;44m   ${E}1;33;43m   ${E}1;32;42m   ${E}0;37;40m ${E}1;37;47m   ${E}0;37;40m        ${E}0;37m(scrambled. as usual.)\n${E}0;37m       ${E}1;37;47m   ${E}1;31;41m   ${E}1;34;44m   ${E}0;37;40m ${E}1;33;43m  ${E}0;37;40m\n${E}0;37m                           ${E}1;31;41m \n${E}0;37m   Jack's best: 58.32s. Under a minute. (Say it with me.)\n${E}0m`);
  txt(AN, 'README.TXT', '19/06/99', `ANSI ART\n\nThese are .ANS files: text with colour codes in. In DOS they work because of ANSI.SYS\n(it's in CONFIG.SYS, Dad put it there, it stays).\n\nTo see one:   TYPE STARFTR.ANS    or   ANSI STARFTR.ANS   (the viewer, with page up/down)\nTo make one:  EDIT, then put the codes in by hand like a maniac (${Cast.n('cousin2')} has TheDraw. ${Cast.n('cousin2')} has everything.)\n\nCodes: ESC [ 1;32 m = bright green. ESC [ 0 m = normal. 5 = BLINK (!!). 41 = red background.\n`);

  // ---- C:\JACKOS\DESKTOP? no, Jack keeps the desktop tidy. A DOS-mode note at root instead:
  txt('C:', 'DOSNOTES.TXT', '13/10/99', `DOS NOTES (things Dad told me, written down so I stop asking)\n\n- DIR /P so it doesn't scroll off.  DIR /W for lots at once.  DIR /A to see hidden ones.\n- "Bad command or file name" means I typed it wrong. Usually.\n- "Abort, Retry, Fail?" means there's no disk in. (Retry doesn't help. Dad still presses it 3 times.)\n- Alt+Enter makes it full screen. Alt+Enter again brings it back. DON'T PANIC.\n- Never type FORMAT C:. Never type DELTREE C:\\JACKOS. (Dave did. The whole thing.)\n- MEM /C shows what's eating the memory. (It's Gubbinz.)\n- 8.3 names: "My Documents" is MYDOCU~1. The ~1 means "there's more but DOS gave up".\n- JBASIC is in C:\\JBASIC. The games are in C:\\GAMES. The batch files are in C:\\BATCH.\n- If the prompt looks weird I typed PROMPT something. Type PROMPT on its own to fix it.\n- There are secret commands. Dad knows some. Dad won't say. XYZZY is one.\n- CONFIG.SYS and AUTOEXEC.BAT are REAL here. EDIT them (at the DOS prompt), open a new DOS box, and\n  things change: take out MOUSE.COM and EDIT has no mouse. Take out MSCDEX and D: goes "not ready".\n  Add DEVICE=C:\\JACKOS\\RAMDRIVE.SYS and you get a RAM drive E:. REM out MOM.SYS and... no. Don't.\n  DEL CONFIG.SYS puts Dad's original back. (He keeps a copy. He keeps a copy of everything.)\n- The shareware games are in C:\\GAMES\\SHAREWAR. Type the name from anywhere. DOSSHELL lists them.\n`);

  // ================================================================ secrets
  [
    ['first', 'C:\\>', 'Open the thing with the black screen and the blinking line'],
    ['fullscreen', 'Full screen, like 1995', 'A DOS box can fill the whole screen with one key combination'],
    ['dosmode', 'Restart in MS-DOS mode', 'Shut down the computer the OTHER way'],
    ['help', 'DOS, help me', 'Ask the prompt what it can do'],
    ['xyzzy', 'Nothing happens', 'An old magic word from an even older game'],
    ['waaagh', 'Battle cry at the prompt', 'Shout a battle cry at a black screen (an Ork one, or a turtle one)'],
    ['format', 'FORMAT C:', 'Try to wipe the whole computer (Mom is watching)'],
    ['formata', 'Dave\'s disk, write-protected', 'Try to format a floppy that has a sticker over the hole'],
    ['deltree', 'DELTREE C:\\JACKOS', 'Try to delete the one folder that can\'t be deleted'],
    ['fail', 'Abort, Retry, Fail?', 'Choose the saddest option when a drive isn\'t ready'],
    ['autoexec', 'AUTOEXEC.BAT', 'Run the batch file that runs when the PC starts'],
    ['batch', 'Batch of your own', 'Write and run your own .BAT file'],
    ['copycon', 'COPY CON', 'Make a file the old-fashioned way, straight from the keyboard'],
    ['hidden', 'DIR /A', 'List the files that don\'t want to be listed'],
    ['dirwp', 'DIR /W /P', 'List the root directory wide, and a page at a time'],
    ['cdtrick', 'CD...', 'Three dots go up two levels. Four go up three'],
    ['system', 'Into the SYSTEM', 'Change directory somewhere Dad said not to'],
    ['y2k', 'DATE 01-01-2000', 'Try to make it the year 2000 from the prompt'],
    ['prompt', 'Fancy prompt', 'Make the prompt show the time, or the version, or a colour'],
    ['mem', 'MEM /C', 'Find out exactly what\'s eating the memory'],
    ['mode50', '50 lines!', 'Make the DOS screen show twice as many lines'],
    ['doskey', 'F7 history', 'DOSKEY has a popup list of everything you typed'],
    ['attrib', 'Hidden by you', 'Hide one of your own files with ATTRIB'],
    ['win', 'WIN inside JackOS', 'Try to start JackOS from a DOS box that\'s already in JackOS'],
    ['ans', 'ANSI colours', 'TYPE an .ANS file and watch the colours come out'],
    ['starfighter', 'Four wings, S-shaped', 'An ANSI drawing of a starfighter is in C:\\ANSI'],
    ['qbasic', 'QBASIC.EXE', 'Type the name of the OTHER BASIC'],
    ['orksay', 'ORKSAY', 'Dad\'s cow program has a cousin with tusks'],
    ['nested', 'COMMAND in COMMAND in COMMAND', 'Run the command interpreter inside itself too many times'],
    ['feed', 'FEED.EXE', 'The commented-out line in AUTOEXEC.BAT is a real program'],
    ['force', 'The Force at the prompt', 'A DOS command for Jedi'],
    ['saber', 'Wrapping-paper lightsaber', 'Ignite one at the prompt'],
    ['droid', 'Bweep boo-dee-doo', 'Ask the little droid something at the prompt'],
    ['myfirst', 'MYFIRST.BAS', 'Open Jack\'s first ever program'],
    ['basic.run', 'F5', 'Run a JBASIC program'],
    ['basic.error', 'Syntax error', 'Make JBASIC complain about your code'],
    ['basic.graphics', 'SCREEN 13', 'Run a JBASIC program with pixels in it'],
    ['basic.save', 'SAVE in JBASIC', 'Write your own program and save it in C:\\JBASIC'],
    ['basic.break', 'Ctrl+Break', 'Stop a program that\'s gone loopy'],
    ['basic.loop', '20 GOTO 10', 'Run Dave\'s program from his floppy (it runs forever. that\'s how good it is)'],
    ['edit.save', 'MS-DOS Editor', 'Save a file from the blue editor'],
    ['gc', 'Jack Commander', 'Open the two-pane file manager'],
    ['gc.view', 'F3 View', 'View a file in Jack Commander'],
    ['defrag', 'DEFRAG (DOS)', 'Watch the little blocks move about from DOS'],
    ['scandisk', 'SCANDISK (DOS)', 'Check the surface of the disk from DOS, find the grumpy cluster'],
    ['fdisk', 'FDISK', 'Open the scariest program on the computer and then close it'],
    ['msd', 'MSD', 'Microsoft-style Diagnostics: find out what the computer thinks it is'],
    ['matrix', 'Green rain', 'Make the DOS screen do the thing from the film'],
    ['saver', 'DOS screensaver', 'There\'s a screensaver in C:\\GAMES that isn\'t a JackOS one'],
    ['virus', 'TOTALLY A VIRUS', 'A hidden .COM in C:\\JACKOS\\TEMP that\'s definitely a virus (it\'s not)'],
    ['debug', 'DEBUG', 'The program Dad used to "fix" things. Poke about'],
    ['pipe', 'Pipes!', 'Send the output of one command into another with |'],
    ['quest.start', 'Jack Quest begins', 'Start the big text adventure in C:\\GAMES'],
    ['quest.saber', 'Tube of destiny', 'Make a lightsaber in Jack Quest'],
    ['quest.queue', 'Queue for the toys', 'Wait in the toy shop queue in Jack Quest, like everyone did'],
    ['quest.portal', 'Under the bed', 'Find the way into the Toy Kingdom in Jack Quest'],
    ['quest.gubbinz', 'Found him', 'Find Gubbinz in Jack Quest'],
    ['quest.half', 'Halfway to King', 'Score 175 in Jack Quest'],
    ['quest.win', 'TOY KING', 'Finish Jack Quest with the full 350 points'],
    ['quest.rude', 'Told off by a game', 'Type something rude in Jack Quest (Dave did)'],
    ['config', 'Dad said don\'t touch it', 'Edit AUTOEXEC.BAT or CONFIG.SYS at the prompt and start a new DOS box'],
    ['ramdrive', 'RAM drive E:', 'Add a RAMDRIVE.SYS line to CONFIG.SYS'],
    ['noansi', 'Escape codes everywhere', 'Put a REM in front of an ANSI.SYS line in CONFIG.SYS, then TYPE an .ANS file'],
    ['bedtime', 'No MOM.SYS', 'Disable the bedtime driver and set the clock past 8pm'],
    ['blaster', 'JackBlaster 16', 'Add a sound card driver line to CONFIG.SYS'],
    ['print', 'Out of cyan', 'Try to PRINT a text file from DOS'],
    ['crawl.win', 'Jack Crawl, level 5', 'Get down the stairs five times in JACKCRAWL'],
    ['crawl.die', 'Eaten by a slime', 'Lose in JACKCRAWL (it happens)'],
    ['dakka', 'Flak happy', 'Shoot 20 aliens in Flak Attack! (DAKKA)'],
    ['squigpie', 'Chip tycoon', 'Make a profit over a week in Chip Van Tycoon (SQUIGPIE)'],
    ['squighunt', 'Got the Big Alien', 'Win Alien Hunt (SQUIGHUNT)'],
    ['trukkrace', 'Turbo!', 'Drive 1000 metres in Turbo Racer (TRUKKRACE)'],
    ['teefwars', 'Raided Dave', 'Beat Dave in GEM WARS'],
    ['intro', 'Demoscene', 'Watch INTRO.EXE to the end of the scroller'],
    ['tpaint', 'TPAINT artist', 'Save a picture from TPAINT'],
    ['grottrak', 'Tracker', 'Play a tune in JACKTRAK'],
    ['hexed', 'Hex hacker', 'Save a file from the hex editor'],
    ['grotscan', 'Virus found', 'Run JACKSCAN and let it find Gubbinz'],
    ['squash', 'Squashed', 'Make a .SQZ archive with SQUASH'],
    ['edlin', 'EDLIN survivor', 'Save a file from EDLIN. Dad is proud'],
    ['calc', 'DOS calculator', 'Work out 6 times 9 in CALC'],
  ].forEach(([id, n, h]) => A.defineSecret('dos.' + id, n, h));

  window.JackDOS = { open: openDos, fsx, samples: SAMPLES };
})();
