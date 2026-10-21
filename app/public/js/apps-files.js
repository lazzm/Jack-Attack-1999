/* apps-files: JackOS Explorer, a full Notepad, the Image Viewer, the Recycle Bin, Outlook Express and the whole of
 * Jack's C: drive (diary, homework, lists, stories, cheats, pictures, Program Files, JACKOS and a locked folder). */
(function () {
  if (!window.Apps || !window.Desk) return;
  const A = Apps, esc = A.esc, store = A.store;
  const touch = () => matchMedia('(hover:none)').matches;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = () => Desk.today99();
  const pad2 = n => String(n).padStart(2, '0');
  const CN = id => Cast.n(id), CT = s => Cast.t(s); // the visitor's cast (js/cast.js)
  // dates: 'dd/mm/99' (files), 'MM-DD' (calendar style). 1998 and earlier always "happened".
  const mdOfDate = s => { const m = /^(\d\d)\/(\d\d)\/(\d\d)$/.exec(s || ''); return !m ? 0 : m[3] === '99' ? +m[2] * 100 + +m[1] : 0; };
  const mdOf = s => { const [m, d] = s.split('-').map(Number); return m * 100 + d; };
  const happened = date => mdOfDate(date) <= today().md;
  const todayStr = () => { const t = today(); return `${pad2(t.d)}/${pad2(t.m)}/99`; };
  const nowTime = () => { const d = new Date(); return `${d.getHours()}:${pad2(d.getMinutes())}`; };
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const fakeTime = s => { const h = hash(s); return `${8 + (h % 14)}:${pad2((h >>> 4) % 60)}`; };
  const crlf = t => (t || '').length + ((t || '').match(/\n/g) || []).length;
  const KEY = { docs: 'jhp_files_docs', unlocked: 'jhp_files_unlocked', restored: 'jhp_files_restored', mail: 'jhp_files_mail', diary: 'jhp_files_diary', pics: 'jhp_files_pics', view: 'jhp_files_view', misc: 'jhp_files_misc' };
  const misc = store.get(KEY.misc, {});
  const setMisc = (k, v) => { misc[k] = v; store.set(KEY.misc, misc); };
  const S = id => A.secret('files.' + id);

  // remember which app ids other packs register, so shortcuts to their programs only work when they exist
  const KNOWN = new Set(['find', 'explorer', 'notepad', 'outlook', 'imgview', 'files.run', 'files.bin']);
  const _reg = A.register;
  A.register = function (id, def) { KNOWN.add(id); return _reg.apply(this, arguments); };

  // ================================================================ icons (32x32 viewBox; shown at 16 or 32)
  const FOLDER = '<path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/>';
  const PAGE = '<path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/>';
  const I = {
    mycomp: '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="21" height="16" fill="#e8e0c8" stroke="#000"/><rect x="8" y="6" width="15" height="10" fill="#008080" stroke="#555"/><rect x="9" y="7" width="6" height="4" fill="#c0c0c0"/><rect x="9" y="7" width="6" height="1" fill="#000080"/><rect x="11" y="19" width="9" height="3" fill="#b8ae90" stroke="#000"/><rect x="3" y="22" width="26" height="7" fill="#e8e0c8" stroke="#000"/><rect x="17" y="24.5" width="9" height="1.5" fill="#555"/><circle cx="6.5" cy="25.5" r="1" fill="#0c0"/></svg>',
    mydocs: '<svg viewBox="0 0 32 32"><path d="M2 8h11l3 3h14v17H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M9 3h13l3 3v14H9z" fill="#fff" stroke="#000"/><path d="M12 9h10M12 12h10M12 15h7" stroke="#000080"/><path d="M2 14h28v14H2z" fill="#f7dc80" stroke="#7a5a00"/></svg>',
    binEmpty: '<svg viewBox="0 0 32 32"><path d="M7 9h18l-2 20H9z" fill="#eef4f4" stroke="#000"/><path d="M11.5 11l1 16M16 11v16M20.5 11l-1 16M8 15.5h16M8.6 22h14.8" stroke="#6a8a8a"/><ellipse cx="16" cy="9" rx="10" ry="2.5" fill="#d4e4e4" stroke="#000"/></svg>',
    binFull: '<svg viewBox="0 0 32 32"><path d="M10 9l1-5 4 2 2-4 4 3 3-1-1 6z" fill="#fff" stroke="#000"/><path d="M13 5l3 3M19 4l-1 4" stroke="#999"/><path d="M7 9h18l-2 20H9z" fill="#eef4f4" stroke="#000"/><path d="M11.5 11l1 16M16 11v16M20.5 11l-1 16M8 15.5h16M8.6 22h14.8" stroke="#6a8a8a"/><ellipse cx="16" cy="9" rx="10" ry="2.5" fill="#d4e4e4" stroke="#000"/><path d="M12 13l4 3 3-2 2 4-5 2-4-2z" fill="#ffd" stroke="#555"/></svg>',
    mail: '<svg viewBox="0 0 32 32"><rect x="2" y="10" width="24" height="16" fill="#fff" stroke="#000"/><path d="M2 10l12 9 12-9" fill="#e8e8f8" stroke="#000"/><circle cx="24" cy="10" r="7" fill="#2a7ad8" stroke="#003a80"/><text x="24" y="14" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11" fill="#fff">@</text></svg>',
    floppy: '<svg viewBox="0 0 32 32"><rect x="2" y="13" width="28" height="11" fill="#c0c0c0" stroke="#000"/><rect x="2.5" y="13.5" width="27" height="1.5" fill="#fff"/><rect x="8" y="18" width="16" height="2" fill="#000"/><rect x="25" y="21" width="3" height="1.5" fill="#0a0"/><rect x="11" y="4" width="10" height="10" fill="#333" stroke="#000"/><rect x="13" y="4" width="6" height="3.5" fill="#c0c0c0"/><rect x="12.5" y="9" width="7" height="4" fill="#fff"/></svg>',
    cd: '<svg viewBox="0 0 32 32"><rect x="2" y="17" width="28" height="9" fill="#c0c0c0" stroke="#000"/><rect x="6" y="21" width="20" height="2" fill="#555"/><circle cx="16" cy="11" r="9" fill="#e4e8ff" stroke="#555"/><path d="M9.5 6.5a9 9 0 0 1 5-3" stroke="#f0f" stroke-width="2" fill="none"/><path d="M22.5 15.5a9 9 0 0 1-4.5 4" stroke="#0bf" stroke-width="2" fill="none"/><path d="M8 13a9 9 0 0 0 2 4" stroke="#fc0" stroke-width="2" fill="none"/><circle cx="16" cy="11" r="2.5" fill="#fff" stroke="#555"/></svg>',
    hdd: '<svg viewBox="0 0 32 32"><rect x="2" y="11" width="28" height="13" fill="#c0c0c0" stroke="#000"/><rect x="2.5" y="11.5" width="27" height="1.5" fill="#fff"/><rect x="6" y="18" width="11" height="2" fill="#000"/><rect x="24" y="18" width="3" height="2" fill="#0c0"/><path d="M5 26h22" stroke="#808080"/></svg>',
    cpl: `<svg viewBox="0 0 32 32">${FOLDER}<rect x="9" y="14" width="15" height="10" fill="#c0c0c0" stroke="#000"/><circle cx="13" cy="19" r="2.5" fill="#e10600" stroke="#000"/><rect x="18" y="16" width="3" height="6" fill="#2a7ad8" stroke="#000"/></svg>`,
    printer: `<svg viewBox="0 0 32 32">${FOLDER}<rect x="11" y="12" width="11" height="6" fill="#fff" stroke="#000"/><rect x="8" y="17" width="17" height="7" fill="#c0c0c0" stroke="#000"/><rect x="11" y="22" width="11" height="4" fill="#fff" stroke="#000"/><circle cx="22" cy="19.5" r="1" fill="#0a0"/></svg>`,
    dialup: `<svg viewBox="0 0 32 32">${FOLDER}<rect x="8" y="16" width="16" height="7" fill="#e8e0c8" stroke="#000"/><circle cx="11" cy="21" r="1" fill="#0c0"/><circle cx="14" cy="21" r="1" fill="#fc0"/><path d="M24 19c3 0 3-4 5-4" stroke="#000" fill="none"/></svg>`,
    sched: `<svg viewBox="0 0 32 32">${FOLDER}<circle cx="17" cy="19" r="6" fill="#fff" stroke="#000"/><path d="M17 15v4l3 2" stroke="#000" fill="none"/></svg>`,
    folder: `<svg viewBox="0 0 32 32">${FOLDER}</svg>`,
    folderOpen: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h11v4H8L2 28z" fill="#f2d16b" stroke="#7a5a00"/><path d="M8 14h23l-6 14H2z" fill="#f7dc80" stroke="#7a5a00"/></svg>',
    lock: A.ICON.lock,
    txt: A.ICON.txt,
    img: A.ICON.img,
    exe: A.ICON.exe,
    sys: `<svg viewBox="0 0 32 32">${PAGE}<circle cx="16" cy="19" r="5.5" fill="#c0c0c0" stroke="#555" stroke-width="3" stroke-dasharray="2.6 1.7"/><circle cx="16" cy="19" r="2" fill="#fff" stroke="#000"/></svg>`,
    bat: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" fill="#c0c0c0" stroke="#000"/><rect x="3" y="5" width="26" height="4" fill="#000080"/><rect x="6" y="12" width="20" height="12" fill="#000"/><path d="M8 15l3 2-3 2M12 21h5" stroke="#fff" fill="none"/></svg>',
    url: `<svg viewBox="0 0 32 32">${PAGE}<circle cx="16" cy="18" r="6.5" fill="#2a7ad8" stroke="#003a80"/><path d="M10 16c4-2 8-2 12 0M10 20c4 2 8 2 12 0M16 11.5v13" stroke="#9fd0ff" fill="none"/><path d="M6 23h6v6H6z" fill="#fff" stroke="#000"/><path d="M8 28l3-3m-2 0h2v2" stroke="#000" fill="none"/></svg>`,
    wav: `<svg viewBox="0 0 32 32">${PAGE}<path d="M9 16h4l5-4v14l-5-4H9z" fill="#ffd400" stroke="#000"/><path d="M21 15c2 2 2 5 0 7" stroke="#000" fill="none"/></svg>`,
    doc: `<svg viewBox="0 0 32 32">${PAGE}<path d="M10 12h12M10 15h12M10 18h12M10 21h12M10 24h8" stroke="#2a5ad8"/><rect x="8" y="5" width="9" height="5" fill="#2a5ad8"/></svg>`,
    notepad: '<svg viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="25" fill="#fff" stroke="#000"/><rect x="6" y="4" width="20" height="5" fill="#2a9ac8" stroke="#000"/><path d="M10 13h12M10 17h12M10 21h12M10 25h8" stroke="#888"/><path d="M9 2v4M13 2v4M17 2v4M21 2v4" stroke="#555" stroke-width="1.5"/></svg>',
    viewer: '<svg viewBox="0 0 32 32"><rect x="2" y="5" width="28" height="22" fill="#c0c0c0" stroke="#000"/><rect x="5" y="8" width="22" height="16" fill="#fff" stroke="#555"/><path d="M6 23l6-8 4 5 3-3 7 6z" fill="#2a9a2a"/><circle cx="21" cy="12" r="2.5" fill="#ffd400"/></svg>',
    envClosed: '<svg viewBox="0 0 16 16"><rect x="1" y="3.5" width="14" height="9" fill="#ffffc8" stroke="#000"/><path d="M1 3.5l7 5 7-5" fill="none" stroke="#000"/></svg>',
    envOpen: '<svg viewBox="0 0 16 16"><path d="M1 7l7-5 7 5v7H1z" fill="#fff" stroke="#000"/><path d="M1 7l7 4 7-4" fill="none" stroke="#000"/><rect x="4" y="3.5" width="8" height="5" fill="#fff" stroke="#888"/></svg>',
    clip: '<svg viewBox="0 0 16 16"><path d="M10 4v7a2.5 2.5 0 0 1-5 0V3.5a1.6 1.6 0 0 1 3.2 0V10" fill="none" stroke="#000" stroke-width="1.2"/></svg>',
    inbox: '<svg viewBox="0 0 16 16"><path d="M1 8l2-5h10l2 5v5H1z" fill="#fff" stroke="#000"/><path d="M1 8h4l1 2h4l1-2h4" fill="none" stroke="#000"/><path d="M8 2v5M6 5l2 2 2-2" stroke="#2a7ad8" fill="none"/></svg>',
    outbox: '<svg viewBox="0 0 16 16"><path d="M1 8l2-5h10l2 5v5H1z" fill="#fff" stroke="#000"/><path d="M1 8h4l1 2h4l1-2h4" fill="none" stroke="#000"/><path d="M8 7V2M6 4l2-2 2 2" stroke="#d42020" fill="none"/></svg>',
    sent: '<svg viewBox="0 0 16 16"><path d="M1 8l2-5h10l2 5v5H1z" fill="#fff" stroke="#000"/><path d="M1 8h4l1 2h4l1-2h4" fill="none" stroke="#000"/><path d="M4 5h7M9 3l2 2-2 2" stroke="#1a9a1a" fill="none"/></svg>',
    trash: '<svg viewBox="0 0 16 16"><path d="M3 4h10l-1 11H4z" fill="#eef4f4" stroke="#000"/><path d="M2 4h12M6 2h4" stroke="#000"/><path d="M6 6v7M8 6v7M10 6v7" stroke="#6a8a8a"/></svg>',
    drafts: '<svg viewBox="0 0 16 16"><path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#000"/><path d="M5 7h6M5 9h6M5 11h4" stroke="#888"/><path d="M8 13l1-3 5-5 2 2-5 5z" fill="#f2c94c" stroke="#7a5a00"/></svg>',
    junk: '<svg viewBox="0 0 16 16"><rect x="1" y="3.5" width="14" height="9" fill="#ffd0d0" stroke="#000"/><path d="M1 3.5l7 5 7-5" fill="none" stroke="#000"/><circle cx="12" cy="11" r="3.5" fill="#d42020" stroke="#600"/><path d="M10.5 9.5l3 3M13.5 9.5l-3 3" stroke="#fff"/></svg>',
    oe: '<svg viewBox="0 0 16 16"><rect x="1" y="4" width="11" height="8" fill="#fff" stroke="#000"/><path d="M1 4l5.5 4L12 4" fill="none" stroke="#000"/><circle cx="12" cy="5" r="3.5" fill="#2a7ad8"/></svg>',
  };
  // the official JackOS 98 icon set (icons.js), where it has the specific match
  const JI = n => JICON.icon(n);
  if (window.JICON) Object.assign(I, { mycomp: JI('computer'), mydocs: JI('documents'), binEmpty: JI('recycle'), binFull: JI('recycleFull'), mail: JI('mail'), floppy: JI('floppy'), cd: JI('cdrom'), hdd: JI('hdd'), cpl: JI('control'), printer: JI('printer'), folder: JI('folder'), folderOpen: JI('folderOpen'), lock: JI('lock'), txt: JI('txt'), img: JI('bmp'), exe: JI('exe'), sys: JI('dll'), bat: JI('bat'), url: JI('url'), wav: JI('wav'), doc: JI('doc'), notepad: JI('notepad'), dialup: JI('dialup'), sched: JI('sched'), viewer: JI('picture') });
  const JEXE = { 'CALC.EXE': 'calc', 'CALENDAR.EXE': 'calendar', 'CARDFILE.EXE': 'cardfile', 'CDPLAYER.EXE': 'cdplayer', 'CLOCK.EXE': 'clock', 'COMMAND.COM': 'dos', 'CONTROL.EXE': 'control', 'CUBENET.EXE': 'cube', 'CUBETIME.EXE': 'cube',
    'DEFRAG.EXE': 'defrag', 'EXPLORER.EXE': 'folderOpen', 'FREECELL.EXE': 'freecell', 'JACKCHES.EXE': 'chess', 'JACKQUEST.EXE': 'adventure', 'GUBBINZ.EXE': 'gubbinz', 'HYPERTRM.EXE': 'hyperterm', 'IEXPLORE.EXE': 'jacknet',
    'JACKAMP.EXE': 'jackamp', 'JACKCALC.EXE': 'spreadsheet', 'JACKTRIS.EXE': 'blocks', 'JBASIC.EXE': 'jbasic', 'JCARTA99.EXE': 'carta', 'MAGNIFY.EXE': 'magnifier', 'MPLAYER2.EXE': 'media', 'MSHEARTS.EXE': 'cards', 'MSIMN.EXE': 'mail',
    'MSPAINT.EXE': 'paint', 'NOTEPAD.EXE': 'notepad', 'PINBALL.EXE': 'pinball', 'RADIO.EXE': 'radio', 'REGEDIT.EXE': 'regedit', 'REVERSI.EXE': 'reversi', 'SAVER.COM': 'screensaver', 'SCANDISK.EXE': 'scandisk', 'SCANDSKW.EXE': 'scandisk',
    'SNDVOL32.EXE': 'sound', 'SOL.EXE': 'cards', 'SPIDER.EXE': 'cards', 'SYSMON.EXE': 'sysmon', 'TASKMGR.EXE': 'taskmgr', 'THEMES.EXE': 'themes', 'TYPING.EXE': 'typing', 'UHOH.EXE': 'messenger', 'WAB.EXE': 'addressbook',
    'WELCOME.EXE': 'welcome', 'WHITEBRD.EXE': 'whiteboard', 'WINHLP32.EXE': 'helpbook', 'WINMINE.EXE': 'sweeper', 'WORDPAD.EXE': 'wordpad', 'WUPDMGR.EXE': 'update', 'ZONE.EXE': 'zone', 'MODEMMTR.EXE': 'modem' };
  const JEXT = { wab: 'addressbook', hlp: 'helpbook', chm: 'helpbook', cal: 'calendar', mpg: 'avi', m3u: 'mid', mid: 'mid', midi: 'mid', rmi: 'mid', avi: 'avi', zip: 'zip', ini: 'ini', inf: 'ini', cfg: 'ini', dll: 'dll', vxd: 'dll', drv: 'dll', sys: 'dll', htm: 'webpage', html: 'webpage', doc: 'doc', rtf: 'doc', wri: 'doc', xls: 'spreadsheet', wks: 'spreadsheet', crd: 'cardfile', ht: 'hyperterm' };
  const ICO16 = (svg, cls) => `<span class="fx-i16${cls ? ' ' + cls : ''}">${svg}</span>`;

  // ================================================================ the drive: helpers for adding Jack's files
  const ext = n => (/\.([a-z0-9~]+)$/i.exec(n.name || '') || [])[1] ? (/\.([a-z0-9~]+)$/i.exec(n.name)[1]).toLowerCase() : '';
  const PENDING = []; // files that haven't "happened" yet in the 1999 loop
  function put(path, node) {
    if (node.date && !happened(node.date) && !node.always) { PENDING.push([path, node]); return node; }
    return A.fs.add(path, node);
  }
  setInterval(() => { for (let i = PENDING.length - 1; i >= 0; i--) if (happened(PENDING[i][1].date)) { A.fs.add(PENDING[i][0], PENDING[i][1]); PENDING.splice(i, 1); } }, 600000);
  const mk = (base, extra) => (extra ? Object.defineProperties(base, Object.getOwnPropertyDescriptors(extra)) : base); // keeps getters
  const txt = (path, name, date, text, extra) => put(path, mk({ name, type: 'txt', date, text }, extra));
  const pic = (path, name, date, art, extra) => put(path, mk({ name, type: 'img', date, art }, extra));
  const exe = (path, name, date, size, extra) => put(path, mk({ name, type: 'exe', date, size }, extra));
  const lnk = (path, name, go, date) => put(path, { name, type: 'lnk', go, date: date || '12/01/99', size: '1 KB' });
  const wav = (path, name, sound, date, size) => put(path, { name, type: 'wav', sound, date: date || '11/05/98', size: size || '24 KB' });
  // lines that only show once their date has happened: [['MM-DD', 'line'], ...]
  const gated = (head, lines, foot) => head + lines.filter(l => !l[0] || mdOf(l[0]) <= today().md).map(l => l[1]).join('\n') + (foot || '');

  // ================================================================ sizes, types, names
  function bytesOf(n) {
    if (!n || n.type === 'dir') return 0;
    if (n.size) { const m = /([\d.,]+)\s*(bytes|KB|MB|GB)?/i.exec(n.size); if (m) { const v = parseFloat(m[1].replace(/,/g, '')), u = (m[2] || 'bytes').toUpperCase(); return Math.round(v * (u === 'KB' ? 1024 : u === 'MB' ? 1048576 : u === 'GB' ? 1073741824 : 1)) + (hash(n.name) % 97); } }
    if (n.type === 'txt') return crlf(n.text);
    if (n.type === 'img') { const [w, h] = artSize(n.art), e = ext(n); return e === 'bmp' ? w * h * 3 + 54 : e === 'gif' ? ((w * h / 2) | 0) + 790 : ((w * h * 0.8) | 0) + 620 + (hash(n.name) % 300); }
    if (n.type === 'lnk') return 92 + (hash(n.name) % 60);
    return 1024 + (hash(n.name) % 4096);
  }
  const dirBytes = n => n.type === 'dir' ? (n.kids || []).reduce((s, k) => s + dirBytes(k), 0) : bytesOf(n);
  function fmtSize(b) {
    if (b < 1024) return b + ' bytes';
    if (b < 1048576) return (b / 1024).toFixed(b < 10240 ? 1 : 0).replace(/\.0$/, '') + 'KB';
    return (b / 1048576).toFixed(2).replace(/0$/, '') + 'MB';
  }
  const kbCol = b => Math.max(1, Math.ceil(b / 1024)).toLocaleString('en-GB') + 'KB';
  const longBytes = b => `${fmtSize(b)} (${b.toLocaleString('en-GB')} bytes)`;
  const TYPENAMES = { rtf: 'Rich Text Document', wri: 'Write Document', wks: 'JackCalc Spreadsheet', xls: 'Spreadsheet', crd: 'Card File', ht: 'HyperTerminal Session', tif: 'TIFF Image', cpe: 'Fax Cover Page', pkg: 'Package', txt: 'Text Document', log: 'Text Document', bat: 'MS-DOS Batch File', sys: 'System file', ini: 'Configuration Settings', dll: 'Application Extension', vxd: 'Virtual device driver', drv: 'Device driver', inf: 'Setup Information', doc: 'Document', bmp: 'Bitmap Image', jpg: 'JPEG Image', gif: 'GIF Image', exe: 'Application', com: 'MS-DOS Application', url: 'Internet Shortcut', wav: 'Wave Sound', tmp: 'TMP File', grt: 'Gubbinz (do not delete)', bug: 'BUG File', dat: 'DAT File', sav: 'SAV File', htm: 'HTML Document', bak: 'BAK File', cfg: 'CFG File', mid: 'MIDI Sequence', zip: 'Compressed Folder' };
  function typeName(n) {
    if (n.type === 'dir') return 'File Folder';
    if (n.type === 'lnk') return 'Internet Shortcut';
    const e = ext(n);
    return TYPENAMES[e] || (e ? e.toUpperCase() + ' File' : n.type === 'exe' ? 'Application' : 'File');
  }
  function iconOf(n) {
    if (n.svg) return n.svg;
    if (n.icon && /^<svg/.test(n.icon)) return n.icon;
    if (n.icon && I[n.icon]) return I[n.icon];
    if (n.type !== 'dir' && A.ICON[n.type] && !/^(txt|img|exe|lnk|wav|dir)$/.test(n.type)) return A.ICON[n.type];
    if (n.type === 'dir') return n.locked && !isUnlocked(n) ? I.lock : I.folder;
    if (window.JICON && JEXT[ext(n)] && n.type !== 'exe') return JI(JEXT[ext(n)]);
    if (window.JICON && JEXE[String(n.name).toUpperCase()]) return JI(JEXE[String(n.name).toUpperCase()]);
    if (n.type === 'img' || n.type === 'png' || /^(bmp|jpg|gif|png)$/.test(ext(n))) return I.img;
    if (n.type === 'lnk') return I.url;
    if (n.type === 'wav') return I.wav;
    if (n.type === 'exe') { const e = ext(n); return e === 'bat' ? I.bat : I.exe; }
    const e = ext(n);
    if (/^(sys|dll|vxd|drv|ini|inf|bug|dat|cfg|com|bak|tmp)$/.test(e)) return e === 'bat' ? I.bat : I.sys;
    if (e === 'bat') return I.bat;
    if (e === 'doc' || e === 'htm') return I.doc;
    return I.txt;
  }
  const dosName = n => { const e = ext(n), base = n.name.replace(/\.[^.]*$/, '').toUpperCase().replace(/[^A-Z0-9_~!-]/g, ''); return (base.length > 8 || /[ .]/.test(n.name.replace(/\.[^.]*$/, '')) ? base.slice(0, 6) + '~1' : base) + (e ? '.' + e.toUpperCase().slice(0, 3) : ''); };
  const dateOf = n => n.date || (n.type === 'dir' ? '10/12/98' : '01/01/99');
  const unlocked = store.get(KEY.unlocked, {});
  const isUnlocked = n => !n.locked || unlocked[n.name];
  // ================================================================ pixel art (char grids + palettes, drawn crisp to canvas)
  const PAL = { k: '#000', w: '#fff', g: '#3a9a2a', G: '#1f5e14', l: '#8ad84a', r: '#e10600', R: '#8a0000', y: '#ffd400', Y: '#b08a00', b: '#2a7ad8', B: '#0028c8', c: '#9fd0ff', C: '#00e5ff', o: '#ff8000', p: '#ff8ac0', s: '#f2c79a', S: '#c8956a', n: '#7a4a1a', N: '#4a2a0a', a: '#9a9a9a', A: '#555', e: '#c8c8c8', d: '#e8e0c8', D: '#b8ae90', t: '#008080', T: '#004848', m: '#c0187a', v: '#5b16c9', u: '#fff3b0', i: '#203060' };
  const sym = rows => rows.map(r => r + [...r].reverse().join(''));
  // a tiny paint program for scenes
  function Canvas(w, h, fill) {
    const g = Array.from({ length: h }, () => Array(w).fill(fill || '.'));
    const self = {
      w, h, g,
      px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h && c) g[y][x] = c; return self; },
      rect(x, y, rw, rh, c) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) self.px(x + i, y + j, c); return self; },
      box(x, y, rw, rh, c, edge) { self.rect(x, y, rw, rh, c); if (edge) { self.rect(x, y, rw, 1, edge); self.rect(x, y + rh - 1, rw, 1, edge); self.rect(x, y, 1, rh, edge); self.rect(x + rw - 1, y, 1, rh, edge); } return self; },
      disc(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) self.px(cx + x, cy + y, c); return self; },
      ring(cx, cy, r0, r1, f) { for (let y = -r1; y <= r1; y++) for (let x = -r1; x <= r1; x++) { const d = Math.sqrt(x * x + y * y); if (d >= r0 && d <= r1) self.px(cx + x, cy + y, f(x, y, d)); } return self; },
      line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) self.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); return self; },
      each(f) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = f(x, y, g[y][x]); if (c) g[y][x] = c; } return self; },
      stamp(x0, y0, rows) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') self.px(x0 + i, y0 + j, c); })); return self; },
      text(x, y, str, c) { for (const ch of str) { const f = FONT[ch]; if (f) { f.forEach((r, j) => [...r].forEach((b, i) => { if (b === '1') self.px(x + i, y + j, c); })); } x += 4; } return self; },
      rows() { return g.map(r => r.join('')); },
    };
    return self;
  }
  const FONT = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
    A: ['010', '101', '111', '101', '101'], C: ['111', '100', '100', '100', '111'], E: ['111', '100', '110', '100', '111'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], J: ['001', '001', '001', '101', '111'], K: ['101', '110', '100', '110', '101'], L: ['100', '100', '100', '100', '111'], O: ['111', '101', '101', '101', '111'], R: ['110', '101', '110', '101', '101'], S: ['111', '100', '111', '001', '111'], V: ['101', '101', '101', '101', '010'], '!': ['010', '010', '010', '000', '010'], W: ['101', '101', '101', '111', '101'], G: ['111', '100', '101', '101', '111'], M: ['101', '111', '111', '101', '101'], T: ['111', '010', '010', '010', '010'], N: ['110', '101', '101', '101', '101'], D: ['110', '101', '101', '101', '110'], P: ['110', '101', '110', '100', '100'], U: ['101', '101', '101', '101', '111'], B: ['110', '101', '110', '101', '110'], Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'], ' ': ['000', '000', '000', '000', '000'] };
  // seeded random so "photos" look the same every time
  const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const GRUB_HEAD = [ // Gubbinz's head, left half (mirrored)
    '............', '............', '........GGGG', '......GGgggg', '.....Ggggggg', 'G...Gggggggg', 'GG..Gggggggg', 'GgG.GgGGGggg',
    '.GgGgGwwwGgg', '.GggGwwrkGgg', '..GgGwwrkGgg', '..GggGwwGggg', '...GgggggggG', '....Gkkkkkkk', '....Gkwkwkwk', '.....Gkkkkkk', '......GGgggg', '........GGGG'];
  const ART = {
    gubbinz: { bg: '#fff8dc', rows: () => sym([...GRUB_HEAD, '......nnnnnn', '.....nNnnnnn', '....nnnnnnnn', '...gnnnNnnnn', '...gnnnnnnnn', '....nnnnnnnn']) },
    gubbinz_asleep: { bg: '#203060', rows: () => { const c = Canvas(24, 24); c.stamp(0, 0, sym(GRUB_HEAD.map((r, i) => i >= 8 && i <= 11 ? r.replace(/[wrk]/g, 'g').replace(/GwwwG/, 'GGGGG') : r))); c.rect(6, 18, 12, 6, 'b').rect(6, 18, 12, 1, 'c'); c.text(17, 1, 'Z', 'w'); c.px(17, 1, 'w').px(18, 1, 'w').px(19, 1, 'w').px(19, 2, 'w').px(18, 3, 'w').px(17, 4, 'w').px(17, 5, 'w').px(18, 5, 'w').px(19, 5, 'w'); c.px(21, 4, 'c').px(22, 4, 'c').px(22, 5, 'c').px(21, 6, 'c').px(22, 6, 'c'); for (let y = 8; y < 12; y++) c.rect(4, y, 16, 1, '.'); c.stamp(4, 8, sym(['GgGgGggg', '.GgGGGGG', '.GgGgggg', '..Gggggg']).map(r => r.slice(0, 16))); return c.rows(); } },
    ork: { bg: '#d8e8d0', rows: () => sym([
      '............', '.......aaaaa', '.....aaeeeee', '....aeeeeaaa', '....aeeaGGGG', '...GaaGGgggg', '..GgGgggGGgg', '..GgggGrrkGg', '..GgggGrrkGg', '..GggggGGggg', '...Gggggggll', '...GgGkkkkkk',
      '..GgGkkwkkkk', '..GgGkwwkkkk', '...GgGkkkkkk', '....GGgggggg', 'rrr...GGGGGG', 'ryrr..kkkkkk', 'rrrrr.kAkkkk', 'ryyrrrkkAkkk', 'rrrrrkkkkkkk', '.rrr.GkkkAkk', '.....Ggkkkkk', '.....Gg.kkkk', '.......kk.kk', '.......kk.kk', '....AAAAAAAA', '...AkkkkkkkA']) },
    turtle: { bg: '#fff', rows: () => { const c = Canvas(32, 24); c.disc(4, 3, 2, 'y').px(1, 3, 'y').px(7, 3, 'y').px(4, 0, 'y'); c.each((x, y) => y > 18 ? (((x * 7 + y * 3) % 5) ? 'l' : 'g') : null);
      for (let y = 4; y <= 14; y++) for (let x = 3; x <= 25; x++) { const dx = (x - 14) / 11, dy = (y - 14) / 10; if (dx * dx + dy * dy <= 1) c.px(x, y, ((x + (y % 2) * 2) % 5 === 0 || y % 4 === 1) ? 'N' : 'n'); }
      c.rect(4, 14, 21, 2, 'u').rect(4, 15, 21, 1, 'Y'); c.rect(7, 16, 3, 3, 'b').rect(18, 16, 3, 3, 'b').rect(7, 18, 4, 1, 'B').rect(18, 18, 4, 1, 'B'); c.stamp(1, 11, ['.bb', 'b..', 'b.b', '.bb']);
      c.disc(27, 10, 4, 'b').px(28, 8, 'k').px(29, 8, 'k').px(28, 7, 'w').line(26, 12, 30, 12, 'B').px(30, 11, 'B').rect(23, 9, 2, 6, 'r').px(22, 14, 'r').px(22, 15, 'r'); return c.rows(); } },
    squig: { bg: '#f4f0e0', rows: () => sym([
      '............', '............', '.......RRRRR', '.....RRrrrrr', '....Rrrrrrrr', '...Rrrwwrrrr', '...RrwwkrRrr', '..RrrwkkrRrr', '..Rrrrrrrrrr', '..Rrrrrrrrrr', '.RrkkkkkkkkK', '.Rrkwkwkwkwk',
      '.Rrkkkkkkkkk', '.Rrkkkpppppp', '.Rrkwkwkwkwk', '..Rrkkkkkkkk', '..Rrrrrrrrrr', '...Rrrrrrrrr', '....RRrrrrrr', '.....RRRRrrr', '.....RyR..RR', '....RyyR....', '....RRRR....', '............'].map(r => r.replace(/K/g, 'k'))) },
    dave: { bg: '#fffbe0', rows: () => sym([
      '....N.N.N.N.', '...NnNnNnNnN', '...Nnnnnnnnn', '..Nnnnnnnnnn', '..Nnnssssnsn', '..Nnssssssss', '..Nnssssssss', '...ssskksssS', '...sswkkssss', '...ssskkssss', 'S..sssssssSs', 'SS.sSsSssssS',
      '.S.ssssssssS', '...sssskkkkk', '...ssskwwwww', '....sskrrrkk', '....ssskkkss', '.....sssssss', '.......sssss', '....rrrrrrrr', '..rrrrrrwwrr', '.rrrrrrrrwrr', '.rrrrrrrrrrr', '.rrrrrrrrrrr']) },
    warboss: { bg: '#301818', rows: () => sym([
      'a...........', 'aa..........', '.aa.....aaaa', '.aea..aaeeee', '..aeaaeeeeaa', '...aeeeaaaaa', '...aeaGGGGGG', '....GgggggGG', '...GggGGgggg', '...GgGyyykGg', '...GgGyyrrGg', '...GggGGGggg', '..GggggggGll',
      '..GgggGkkkkk', '.GgggGkwkkkk', '.GgggGkwwkkk', '.GggGkkwkkkk', '..GgGkkkkkkk', '...GGGgggggg', 'rrrr..GGGGGG', 'ryrrr.kkkkkk', 'rrryrrkyykkk', 'ryrrrrkkyykk', 'rrrryrrkkkkk', '.rrrrrkAkkkk', '..rr.GgkkkkA', '.....Ggkkkkk', '....AAAAAAAA']) },
    ugly_ork: { bg: '#fff', rows: () => { const c = Canvas(24, 24), R = rng(7); c.disc(12, 9, 6, 'g').disc(10, 8, 2, 'l').disc(12, 16, 5, 'r').disc(13, 15, 2, 'g'); c.px(9, 8, 'r').px(14, 9, 'R').px(10, 7, 'k').px(15, 8, 'k'); c.rect(8, 12, 7, 1, 'k'); c.each((x, y, v) => R() < 0.08 ? 'gryw'[(R() * 4) | 0] : null); c.line(18, 2, 22, 12, 'e').line(19, 2, 23, 11, 'w'); c.rect(4, 21, 16, 2, 'k'); c.px(6, 20, 'g').px(16, 19, 'r').px(17, 20, 'r'); return c.rows(); } },
    school: { bg: '#2a5aa8', rows: () => { const c = Canvas(26, 32), R = rng(42); c.each(() => { const v = R(); return v < 0.25 ? 'B' : v < 0.45 ? 'c' : v < 0.7 ? 'b' : null; }); c.each((x, y) => { const v = R(); return y > 2 && v < 0.12 ? 'i' : null; });
      const head = sym(GRUB_HEAD.map(r => r.replace('Gkkkkkkk', 'Gggkkkkk').replace('Gkwkwkwk', 'GggGkwkw').replace('Gkkkkkk', 'GgGkkkk')));
      c.stamp(1, 1, head.map(r => r.slice(0, 24)));
      c.stamp(1, 18, sym(['.....wwwwwww', '...aawwwwwrr', '..aaaawwwwrr', '.aaaaaawwwry', '.aaaaaaawwrr', 'aaaaaaaaawrr', 'aaaaaaaaaarr', 'aaaaaaaaaary', 'aaaaaaaaaarr', 'aaaaaaaaaaar', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa'].map(r => r.slice(0, 12))));
      c.each((x, y) => (x < 1 || y < 1 || x > 24 || y > 30) ? 'D' : null); c.rect(0, 31, 26, 1, 'd'); return c.rows().map(r => r); } },
    pc: { bg: '#d8c8a8', rows: () => { const c = Canvas(32, 24); c.rect(0, 0, 32, 2, 'D'); c.box(3, 2, 17, 14, 'd', 'D').rect(5, 4, 13, 9, 't').rect(9, 6, 7, 5, 'e').rect(9, 6, 7, 1, 'B').px(6, 5, 'w').px(6, 8, 'w').px(6, 11, 'y'); c.rect(10, 8, 5, 2, 'w'); c.rect(8, 16, 7, 2, 'D').rect(6, 18, 11, 1, 'D'); c.rect(18, 3, 2, 2, 'y');
      c.box(22, 5, 7, 14, 'd', 'D').rect(23, 7, 5, 1, 'A').rect(23, 9, 5, 1, 'A').rect(24, 11, 3, 1, 'k').px(27, 16, 'g').px(26, 16, 'r'); c.rect(0, 19, 32, 5, 'n').rect(0, 19, 32, 1, 'N'); c.box(3, 20, 15, 3, 'e', 'a').each((x, y) => y === 21 && x > 4 && x < 16 && x % 2 ? 'a' : null); c.box(20, 20, 3, 3, 'e', 'a'); c.line(21, 20, 22, 18, 'A'); c.rect(25, 20, 5, 3, 'A').rect(26, 19, 3, 1, 'r'); return c.rows(); } },
    rubik: { bg: '#e8e8f8', rows: () => { const c = Canvas(24, 24), F = 'rgyrbwogr', T = 'wwbyrwgwo', S = 'bboygbyrw', col = { r: 'r', g: 'g', y: 'y', b: 'B', w: 'w', o: 'o' };
      for (let y = 2; y <= 7; y++) { const sh = 7 - y; for (let x = 0; x < 15; x++) { const gx = x, st = gx % 5 === 4 || y === 2 ? 'k' : col[T[Math.min(2, (y - 2) >> 1) * 3 + Math.min(2, (gx / 5) | 0)]]; c.px(2 + sh + x, y, st); } }
      for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) c.px(2 + x, 8 + y, (x % 5 === 4 || y % 5 === 4 || x === 0 || y === 0) ? 'k' : col[F[((y / 5) | 0) * 3 + ((x / 5) | 0)]]);
      for (let x = 0; x < 6; x++) for (let y = 0; y < 15; y++) { const yy = 8 + y - x; c.px(17 + x, yy, (y % 5 === 4 || y === 0 || x === 5) ? 'k' : col[S[((y / 5) | 0) * 3 + Math.min(2, (x / 2) | 0)]]); }
      c.line(2, 22, 16, 22, 'k').line(16, 22, 22, 16, 'k'); return c.rows(); } },
    rain: { bg: '#a8a8a8', rows: () => { const c = Canvas(40, 28), R = rng(99); c.each((x, y) => y < 13 ? ((x + y) % 2 && R() < 0.5 - y * 0.03 ? 'e' : (R() < 0.1 ? 'A' : null)) : null); c.rect(0, 13, 40, 5, 'A').each((x, y) => y >= 13 && y < 18 && (x + y) % 3 === 0 ? 'T' : null); c.rect(0, 18, 40, 10, 'D').each((x, y) => y >= 18 && R() < 0.2 ? 'n' : null);
      c.rect(4, 19, 2, 6, 'r').rect(6, 19, 2, 6, 'w').rect(8, 19, 2, 6, 'r').rect(10, 19, 2, 6, 'w').rect(3, 25, 10, 1, 'N');
      c.rect(25, 15, 9, 1, 'r').rect(24, 16, 11, 1, 'r').rect(23, 17, 13, 1, 'R').px(25, 16, 'w').px(29, 15, 'w').line(29, 18, 29, 24, 'k'); c.disc(29, 20, 1, 's').rect(28, 21, 3, 4, 'B').px(28, 25, 'k').px(30, 25, 'k');
      for (let i = 0; i < 70; i++) { const x = (R() * 44) | 0, y = (R() * 28) | 0; c.px(x, y, 'c').px(x - 1, y + 1, 'c'); } return c.rows(); } },
    eclipse: { bg: '#0a0a28', rows: () => { const c = Canvas(32, 24), R = rng(11); for (let i = 0; i < 14; i++) c.px((R() * 32) | 0, (R() * 14) | 0, R() < 0.5 ? 'w' : 'c'); c.ring(16, 10, 6, 9.5, (x, y, d) => d < 7.4 ? 'w' : d < 8.6 ? (R() < 0.7 ? 'c' : 'i') : (R() < 0.35 ? 'i' : null)); c.disc(16, 10, 6, 'k'); c.px(21, 5, 'w').px(22, 4, 'w').px(23, 3, 'w').px(22, 5, 'w').px(21, 4, 'w').px(23, 5, 'u').px(21, 3, 'u');
      c.each((x, y) => y > 19 ? 'k' : y === 19 ? (x % 5 ? 'o' : 'k') : null); c.stamp(2, 15, ['..k..', '.kkk.', 'kkkkk', '.kkk.', '..k..']).stamp(25, 14, ['...k...', '..kkk..', '.kkkkk.', 'kkkkkkk', '..kkk..', '...k...']); return c.rows(); } },
    trukk: { bg: '#e8e0d0', rows: () => { const c = Canvas(32, 20); c.rect(2, 7, 22, 7, 'r').rect(17, 3, 7, 5, 'r').rect(18, 4, 4, 3, 'c').rect(24, 9, 5, 5, 'R').rect(2, 7, 22, 1, 'R'); c.rect(3, 4, 2, 3, 'a').rect(6, 4, 2, 3, 'a').rect(1, 2, 3, 2, 'A');
      for (let x = 3; x < 22; x += 4) c.stamp(x, 9, ['.y.', 'yoy', 'oyo']); c.disc(6, 15, 3, 'k').disc(6, 15, 1, 'a').disc(21, 15, 3, 'k').disc(21, 15, 1, 'a'); c.rect(28, 10, 3, 1, 'a').rect(28, 12, 3, 1, 'a'); c.rect(0, 18, 32, 2, 'D'); c.px(12, 5, 'g').rect(11, 5, 3, 2, 'g').px(12, 4, 'g'); return c.rows(); } },
    modem: { bg: '#fff', rows: () => { const c = Canvas(32, 16); c.box(2, 4, 28, 9, 'd', 'D').rect(3, 4, 26, 1, 'w'); c.text(4, 6, '56K', 'A'); ['g', 'g', 'r', 'g', 'y', 'y', 'g'].forEach((l, i) => c.px(15 + i * 2, 10, l)); c.rect(14, 12, 15, 1, 'D'); c.rect(4, 13, 3, 1, 'A').rect(25, 13, 3, 1, 'A'); c.line(30, 8, 31, 8, 'A').line(31, 8, 31, 15, 'A'); return c.rows(); } },
    gameboy: { bg: '#5a4a3a', pal: { 1: '#0f380f', 2: '#306230', 3: '#8bac0f', 4: '#9bbc0f' }, rows: () => { const c = Canvas(34, 38); c.box(2, 1, 30, 36, 'e', 'a').rect(4, 3, 26, 16, 'A').rect(5, 5, 24, 12, '4').text(6, 6, '148320', '1').text(10, 11, 'LV18', '2').px(5, 4, 'r');
      c.rect(6, 25, 5, 1, 'k').rect(8, 23, 1, 5, 'k').disc(23, 26, 1, 'm').disc(27, 24, 1, 'm').rect(12, 31, 3, 1, 'a').rect(17, 31, 3, 1, 'a'); for (let i = 0; i < 4; i++) c.line(21 + i * 2, 35, 23 + i * 2, 33, 'a'); return c.rows(); } },
    xmas: { bg: '#102040', rows: () => { const c = Canvas(24, 30), R = rng(3); for (let i = 0; i < 18; i++) c.px((R() * 24) | 0, (R() * 22) | 0, 'w'); for (let y = 3; y < 23; y++) { const half = ((y - 3) * 0.48 + 1) | 0; c.rect(12 - half, y, half * 2, 1, (y % 4 === 0) ? 'G' : 'g'); }
      for (let i = 0; i < 26; i++) { const y = 4 + ((R() * 18) | 0), half = ((y - 3) * 0.48) | 0; c.px(12 - half + ((R() * half * 2) | 0), y, 'rybwo'[(R() * 5) | 0]); } c.stamp(10, 0, ['..y..', '.yyy.', 'yyyyy', '.y.y.']); c.rect(10, 23, 4, 3, 'n'); c.box(3, 24, 6, 5, 'r', 'R').rect(5, 24, 1, 5, 'y'); c.box(15, 25, 7, 4, 'b', 'B').rect(18, 25, 1, 4, 'w'); c.rect(0, 29, 24, 1, 'N'); return c.rows(); } },
    snowman: { bg: '#cfe3f4', rows: () => { const c = Canvas(28, 24), R = rng(5); c.rect(0, 17, 28, 7, 'w'); c.disc(13, 15, 5, 'w').disc(13, 7, 3, 'w'); c.ring(13, 15, 5, 5.9, () => 'e').ring(13, 7, 3, 3.9, () => 'e'); c.px(12, 6, 'k').px(14, 6, 'k').px(13, 7, 'o').px(14, 7, 'o').px(15, 8, 'o'); c.rect(10, 10, 7, 1, 'r').rect(15, 11, 2, 3, 'r'); c.rect(10, 3, 7, 1, 'k').rect(11, 0, 5, 3, 'k'); c.px(13, 13, 'k').px(13, 15, 'k').px(13, 17, 'k'); c.line(8, 13, 4, 10, 'n').line(18, 13, 22, 9, 'n');
      for (let i = 0; i < 40; i++) c.px((R() * 28) | 0, (R() * 17) | 0, 'w'); c.px(13, 7, 'o'); return c.rows(); } },
    shuttle: { bg: '#000818', rows: () => { const c = Canvas(32, 18), R = rng(8); for (let i = 0; i < 20; i++) c.px((R() * 32) | 0, (R() * 18) | 0, 'w'); c.rect(9, 7, 17, 4, 'w').rect(9, 10, 17, 1, 'k').stamp(26, 7, ['ww..', 'wwww', 'wwwk', 'kkk.']).stamp(9, 2, ['kk...', 'wwk..', 'wwwk.', 'wwwwk', 'wwwww']).stamp(13, 11, ['wwwwwww', '.kkkkk.']);
      c.px(27, 8, 'k').px(28, 8, 'k').rect(15, 7, 1, 1, 'k').rect(18, 7, 1, 1, 'k'); c.rect(6, 8, 3, 2, 'A').stamp(1, 7, ['..oyy', 'royyw', '..oyy']); c.px(20, 8, 'b').px(21, 8, 'r'); return c.rows(); } },
    shelf: { bg: '#e8dcc0', rows: () => { const c = Canvas(32, 20); c.rect(0, 15, 32, 2, 'n').rect(0, 17, 32, 1, 'N'); const arm = ['r', 'k', 'r', 'y', 'B', 'r', 'k'];
      arm.forEach((a, i) => { const x = 2 + i * 4; c.stamp(x, 8, ['.g.', 'grg', '.g.', a + a + a, a + 'k' + a, 'g.g', 'kkk']); c.px(x + 1, 9, 'w'); }); c.px(3, 7, 'a').px(15, 7, 'a').px(16, 6, 'a').px(17, 7, 'a'); c.rect(30, 11, 1, 4, 'n').px(30, 10, 'k'); c.box(27, 12, 3, 3, 'w', 'A').rect(28, 12, 1, 1, 'r'); c.rect(0, 0, 32, 1, 'D'); c.text(1, 1, 'WAAAGH!', 'r'); return c.rows(); } },
    leonids: { bg: '#8a8a8a', rows: () => { const c = Canvas(32, 24), R = rng(1999); c.each((x, y) => { const v = R(); return v < 0.3 ? 'a' : v < 0.45 ? 'A' : v < 0.55 ? 'e' : null; }); c.rect(0, 20, 32, 4, 'k').rect(4, 17, 2, 3, 'k').rect(3, 16, 4, 1, 'k').px(5, 15, 'y'); c.rect(20, 18, 8, 2, 'k').rect(22, 16, 4, 2, 'k'); return c.rows(); } },
    jedi: { bg: '#202040', rows: () => { const c = Canvas(24, 32); c.stamp(0, 0, sym([
      '............', '........nnnn', '.......nnnnn', '......nnssss', '......nsssss', '......sskkss', '......ssssss', '.......sssss', '........ssss', '.....nnndddd', '....nnnddddd', '...nnnnddddd',
      '...nnnnddddd', '..nnnnndddd', '..nnnnNNNNNN', '..nnnnnddddd', '..nnnnnddddd', '..nnnnnddddd', '..nnnnnddddd', '...nnnnddddd', '...nnnnddddd', '...nnnnNNNN.', '...nnnnN....', '...nnnnN....', '..nnnnnN....', '..nNNNN.....', '............'].map(r => r.padEnd(12, '.').slice(0, 12))));
      c.line(18, 4, 18, 15, 'l').line(19, 4, 19, 15, 'w').rect(18, 16, 2, 3, 'A').rect(17, 18, 3, 2, 's'); c.stamp(1, 26, ['.oo.', 'okko', 'oooo', '.oo.']).px(2, 25, 'g'); c.rect(0, 30, 24, 2, 'A'); return c.rows(); } },
    robot: { bg: '#f4f8ff', rows: () => { const c = Canvas(32, 24); c.each((x, y) => (x % 4 === 0 || y % 4 === 0) ? 'c' : null); c.stamp(4, 10, ['......aaaaaaaaaaaaaa', '....aaAAAAAAAAAAAAAa', '..aaAAAAAAAAAAAAAAAa', 'yyyyyyAAAAArAAAAAAAa', '.yyyyyAAAAAAAAAAAAAa', '..aaaaaaaaaaaaaaaaaa']); c.disc(8, 17, 2, 'k').disc(20, 17, 2, 'k').disc(8, 17, 0, 'a').disc(20, 17, 0, 'a');
      c.disc(25, 7, 4, 'e').ring(25, 7, 4, 5.2, (x, y) => (Math.atan2(y, x) * 4 | 0) % 2 ? 'A' : null).px(25, 7, 'k').rect(24, 10, 2, 2, 'A'); c.text(2, 2, 'SIR', 'B').text(2, 20, 'MK1', 'B'); c.line(14, 5, 23, 4, 'r'); return c.rows(); } },
    cat: { bg: '#9fd0ff', rows: () => { const c = Canvas(32, 24); c.each((x, y) => y > 14 ? ((y % 3 === 0) || ((x + (((y / 3) | 0) % 2) * 3) % 6 === 0) ? 'D' : (y % 3 === 1 ? 'r' : 'R')) : null); c.rect(0, 14, 32, 1, 'a');
      c.stamp(10, 1, sym(['o.....', 'oo...o', 'ooooon', 'ookooo', 'ooyooo', 'ooooop', '.oooww', '..oooo', '.ooonn', 'oooooo', 'oonooo', 'oooooo', 'ooooon', '.ooooo']).map(r => r)); c.line(22, 13, 26, 13, 'o').line(26, 13, 27, 17, 'o').px(27, 18, 'n'); c.px(12, 5, 'k').px(19, 5, 'k'); c.disc(4, 3, 2, 'y'); return c.rows(); } },
    dave_paint: { bg: '#fff', rows: () => { const c = Canvas(32, 24); c.disc(10, 6, 4, 'l').px(8, 5, 'k').px(12, 5, 'k').line(8, 8, 12, 8, 'k').px(7, 2, 'l').px(6, 1, 'l').px(13, 2, 'l').px(14, 1, 'l'); c.line(10, 10, 10, 17, 'k').line(10, 12, 6, 15, 'k').line(10, 12, 14, 9, 'k').line(10, 17, 7, 22, 'k').line(10, 17, 13, 22, 'k'); c.line(14, 9, 15, 4, 'A');
      c.text(16, 4, 'JACK', 'b').text(16, 11, 'IS', 'r').text(16, 18, 'ACE', 'g'); return c.rows(); } },
    wallpaper: { bg: '#5b16c9', rows: () => { const c = Canvas(32, 24); c.each((x, y) => ((x + y) % 8 < 2) ? 'm' : null); c.rect(1, 5, 30, 14, 'k').text(8, 6, 'JACK', 'y').text(3, 12, 'ATTACK!', 'y'); c.rect(2, 18, 28, 1, 'r'); [[3, 2], [28, 2], [5, 21], [26, 21], [16, 21]].forEach(([x, y]) => c.stamp(x - 1, y - 1, ['.w.', 'www', '.w.'])); return c.rows(); } },
    fanart: { bg: '#ffe0f0', rows: () => { const c = Canvas(24, 24); c.stamp(0, 0, sym(GRUB_HEAD.slice(2, 18)).map(r => r)); for (let i = 0; i < 6; i++) c.stamp(2 + i * 4, 18, ['.r.r', 'rrrr', '.rr.']); return c.rows(); } },
  };
  const artCache = {};
  function artCanvas(key) {
    const a = ART[key] || ART.ugly_ork;
    const rows = artCache[key] || (artCache[key] = a.rows());
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), pal = Object.assign({}, PAL, a.pal || {});
    g.fillStyle = a.bg || '#fff'; g.fillRect(0, 0, w, h);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return cv;
  }
  const artSize = key => { const rows = artCache[key] || (artCache[key] = (ART[key] || ART.ugly_ork).rows()); return [Math.max(...rows.map(r => r.length)), rows.length]; };
  // ================================================================ C:\My Documents
  const MD = 'C:/My Documents';
  const DIARY = MD + '/Diary';
  const diaryList = []; // [md, node]
  function D(mmdd, text) {
    const [m, d] = mmdd.split('-');
    const node = { name: `${d}-${m}-99.txt`, type: 'txt', date: `${d}/${m}/99`, diary: mdOf(mmdd), text: `${DAYS[new Date(1999, +m - 1, +d).getDay()]} ${+d} ${MONTHS[+m - 1]} 1999\n\n` + text };
    diaryList.push([mdOf(mmdd), node]);
    put(DIARY, node);
  }
  A.fs.dir(DIARY).date = '01/01/99';
  txt(DIARY, 'README FIRST.txt', '01/01/99', `THIS IS JACK'S DIARY.\n\nIF YOU ARE NOT JACK, STOP READING.\n\nDAVE, THIS MEANS YOU.\n\nMOM, THIS ALSO MEANS YOU. (Sorry Mom.)\n\nOne file for every day something happens. If there isn't a file for a day, nothing happened. Or I was playing GoldenEye.\n`);
  D('01-01', `NEW YEAR'S DAY!!! The last year of the 1900s!!!

Stayed up till midnight. Dad fell asleep at 11:40 and woke up at 12:02 and said "did I miss it". Yes Dad.

I launched my website today. It's called JACK ATTACK! and it's a games mag but on the Internet, so it's free and it never runs out. It took me all of the Christmas holidays and I had to learn HTML from a library book. The book is from 1996 so it's basically ancient.

New Year's resolutions:
1. Solve a Rubik's cube (haven't got one yet, details)
2. Paint 50 miniatures
3. Beat Dave at GoldenEye (Oddjob doesn't count, he's too small)
4. Update the website EVERY DAY
5. Eat a vegetable (Mom made me add this one)`);
  D('01-03', `Wrote the specs of our PC on the website because people need to know.

Pentium II 350MHz. 64MB of RAM. 6.4 GIGABYTE hard drive. 32x CD-ROM. 56K modem.

Mom read it over my shoulder and said "nobody needs 6.4 gigabytes". I said what about when I've got 400 photos of my LEGO spaceships. She said "you haven't got a camera". I said details again.

Dad says when he was my age computers were the size of a room. He says this every time. I think he means the computer at his work, which was the size of a room, in 1984, and he was a grown up. So that doesn't count.`);
  D('01-09', `Pokemon cards are out in English in America! Dave has seen a picture of a Charizard one. It's shiny. He says if I give him my bike he'll get me one when they come out here.

Dave doesn't have a Charizard. Dave doesn't have ANY Pokemon cards. Dave is trying to get my bike for nothing.

Played GoldenEye at his house anyway. Facility, Licence to Kill mode, one shot and you're dead. I won 7-4. He says his controller is broken. It is not broken, I checked.`);
  D('01-16', `GOT A RUBIK'S CUBE IN THE JANUARY SALES!!!

It was in a bargain bin with a box of jigsaws and a yo-yo with no string. 99p. NINETY NINE PEE for the hardest puzzle in the world.

Mom says she had one in the 80s and peeled the stickers off. That's cheating. I will NOT be peeling the stickers off.

Done one side already. Well. Nearly one side. Eight squares out of nine. The last one is the hardest. It is ALWAYS the last one.`);
  D('01-23', `Painted my first Ork Nob today!!!

Skin: green (obviously). Armour: RED, because red ones go faster. Everybody knows that.

The undercoat was black. Then I did the green, then a lighter green on the top bits (drybrushing, the man in the shop showed me). His teeth are white with a bit of brown so they look dirty. Orks don't brush their teeth. They brush them with OTHER ORKS.

Glued my finger to his axe. Got it off. The axe now has a fingerprint on it, which is like a signature.

Mom says the bedroom smells of glue. It smells of VICTORY.`);
  D('01-29', `WORMS ARMAGEDDON IS OUT!!!

Didn't buy it (pocket money is all going in the Metal Gear Solid fund) but Dave's cousin let us play it at Dave's house and it is the BEST four-player game ever. You can name your worms. I named mine Pikachu, Boba, Sir Killalot and Dave. Then I blew up Dave (the worm) with a banana bomb and Dave (the human) said that's personal.

The Holy Hand Grenade sings when you throw it. The sheep is the best weapon though. A sheep. That explodes.

Mom rang Dave's mom at 8 to say I had to come home. It was a 4-player game. We were in sudden death. Some things are more important than tea.`);
  D('02-05', `Went to the cinema to see A Bug's Life. The circus bugs are the best bit. The ladybird who is actually a boy ladybird is funny.

THERE ARE BLOOPERS AT THE END. Like real outtakes but they're cartoons, so somebody had to MAKE the mistakes on purpose. That's mad. Everybody was leaving and me and Dad stayed and watched all of them.

Got a hot dog. Dad had popcorn and dropped half of it. The bloopers were on the screen and the bloopers were also in the seats.`);
  D('02-14', `Valentine's Day.

Cards received: 0.
Cards sent: 1 (to Gubbinz, from "a secret admirer", I drew him at the weekend and he lives on a bit of paper above my desk now).

Gubbinz is a little green... thing. Half alien, half gremlin, all ears. He eats pizza. He is my best drawing. I think one day he should be on the website. Maybe he could be a pet. Like a Tamagotchi but with ears.

Mom got a card from Dad. Dad got a card from Mom. They both said "oh you shouldn't have". They both should have.`);
  D('02-18', `RED DWARF IS BACK!!!

Series VIII started tonight on BBC Two and the whole crew is back. Even Rimmer, and he was dead. Well, he was a hologram. Now he's not a hologram, he's alive again. It's complicated. It's Red Dwarf.

Dad and me watched it together and Dad laughed so much he did the snort. Mom came in to see what the snort was about and then she stayed and watched too.

Smoke me a kipper, I'll be back for breakfast!`);
  D('02-20', `ONE WHOLE SIDE OF THE RUBIK'S CUBE!!!

The YELLOW side. All nine squares. And the sides of that layer match too, so it's actually the whole TOP LAYER, which is more than a side, which means I am basically one third of the way to solving it.

(Dave says that's not how fractions work. Dave got 4 out of 20 on the fractions test.)

Taking it to school on Monday to show Mr Bell (maths). He'll probably do a turn and mess it up. TEACHERS.`);
  D('02-26', `Massive day.

1. METAL GEAR SOLID IS OUT. Dave got it. I watched him play it for three hours. Snake hides in a cardboard box. The guards walk RIGHT PAST. That's not even a joke, that's the actual game.

2. Intel brought out the Pentium III at 500MHz. Our PC is a Pentium II at 350MHz. So our PC is now officially old. It's not even two months old. Dad says "it does what we need". I said what if what we need changes. He said it won't. It will.

3. Had fish fingers. Not massive, just nice.`);
  D('03-05', `Robot Wars Grand Final!!!

Panic Attack won the whole thing. It's got forks like a forklift truck and it just picks the other robots up and dumps them in the pit. Simple but effective, like a Game Boy.

Sir Killalot is still the best though. He's a house robot so he's not even allowed to win. That's the saddest thing I've ever heard.

I'm going to design my own robot. It will have a flipper AND a saw AND be red, so it goes faster.`);
  D('03-12', `RED NOSE DAY!!!

There was a Doctor Who on Comic Relief!!! Rowan Atkinson was the Doctor and then he kept regenerating into different people, one after the other, like when you keep pressing restart on a level. It was SO funny. Dad says it's the first Doctor Who on telly in ages.

We had to wear something red to school and give a pound. I wore my red Sir Killalot T-shirt (I painted it myself, it's a bit stiff). Dave wore a red nose on his ear. Got told off. Worth it.`);
  D('03-26', `There's a virus going round in emails called Melissa. It sends itself to the first 50 people in your address book. Dad was reading about it in the paper going "see, SEE, this is what I said about the Internet".

Checked our emails. We had one from my cousin ${CN('cousin2')} that said "Important Message From ${CN('cousin2')}" and had an attachment. DIDN'T OPEN IT. Rang ${CN('cousin2')}. ${CN('cousin2')} said "I didn't send you anything". THAT'S THE VIRUS, ${CN('cousin2').toUpperCase()}.

Dad has also got a new game called Championship Manager 3 and he went on the computer at 7 o'clock "for ten minutes" and he is STILL ON IT. It is 10:30. I am writing this on paper and will type it up tomorrow.`);
  D('04-01', `April Fools!!!

Told Dave that Nintendo had announced that GoldenEye 2 would be free with every N64 if you posted them your old cartridge. He nearly posted it. I stopped him at the postbox. I'm not a monster.

Dave got me back: he told me there was no school today because of the clocks changing. There was school. I was late. Mrs Hargreaves did not think it was funny.

Also they caught the man who did the Melissa virus. That's not an April Fool, it was on the news. Dad said "good".`);
  D('04-03', `I SOLVED THE RUBIK'S CUBE!!!!!!!!!

THE WHOLE THING! ALL SIX SIDES!!!

It took three hours and a book from the library that has the moves in it. You do it layer by layer. The bottom, then the middle, then the top, and the top is the bit where you just have to trust the moves even though it looks like you're breaking everything.

Ran downstairs. Mom said "well done love". Dad said "now mix it up and do it again". So I did. It took 2 hours. I'm getting faster. I wrote the moves down in my Lists folder so I don't forget.

Best day of 1999 so far.`);
  D('04-17', `Put JACKTRIS on the website!!! It's my own Tetris. I made it from scratch and it works, mostly. The pieces fall and the lines go and everything.

Bug list:
- If you press up too fast the piece can go a bit inside the wall. I've fixed it. I think.
- The music is the old Russian folk song. That's not a bug, that's a feature.

Dave played it for an hour and got 3,200 points. My best is 41,000. He says the keyboard is wrong for Tetris. The keyboard is not wrong for Tetris.`);
  D('04-26', `A virus called Chernobyl went off today. It was set to go off on the 26th of April and it wipes your hard drive. It got loads of computers all over the world.

I checked ours. Then I checked it again. Then Dad came in and asked why I was checking the computer and I told him and he checked it as well. It's fine. Everything is fine. All my LEGO photos and the website are fine.

I'm going to back up the website onto floppy disks. It needs 14 floppies. I have 9. Mom says she'll buy some more if I tidy my room. That is a hostage situation.`);
  D('05-15', `GUBBINZ IS ON THE WEBSITE!!!

He's a virtual pet. Everybody who visits the site shares him, so if you feed him, he's fed for everyone. If nobody feeds him he gets grumpy.

I spent all of last week getting him to work and the hardest bit was getting his ears to flap. Ear flapping is VERY important for a Gubbinz.

I put him on the front page and then I fed him eleven times to test it. He is now very full.

Dave says Gubbinz looks like me. Rude. (He sort of does around the ears.)`);
  D('05-19', `The Phantom Menace came out in America today.

People camped outside cinemas for WEEKS. In tents. With lightsabers.

It doesn't come out here till July. JULY. That's eight weeks. That's two months. That's the whole of the summer term.

I am going to have to avoid the whole Internet so nobody spoils it. I'm not going on any websites except mine. Mine is safe. Mine is spoiler-free. I put a sign on the front page.

Worst day of my life. (Apart from that time with the paddling pool.)`);
  D('05-31', `Bank holiday! It rained, which means PAINTING DAY.

Did TWELVE Space Marines. Twelve!!! That's more than a whole squad. They all have red bits so they go faster (Dave says Space Marines don't work like that. Mine do). One of them has a red helmet, red boots AND a red backpack so he is the fastest Space Marine in the galaxy. His name is Brother Zoom.

Drybrushing is magic. You wipe almost all the paint off the brush, then you just brush over the top and all the edges light up. It's like cheating but it's allowed.

Mom brought me a sandwich up so I didn't have to stop. Best Mom.`);
  D('06-01', `My cousin ${CN('cousin2')} tried a new program called Napster where you can get songs off other people's computers.

One song is 3MB. Our modem goes at about 5KB a second if the wind is blowing the right way. So that's ten minutes for ONE song.

${CN('cousin2')} got to 99%. NINETY NINE PERCENT. And then his mom picked up the phone downstairs to ring his auntie and the Internet went off and the song disappeared forever.

He said a word that I'm not allowed to write in my diary. Even though it's MY diary.`);
  D('06-11', `SAW THE MATRIX!!!

There is no spoon. THERE IS NO SPOON.

Tried to bend a spoon at tea time. Just with my mind. Mom said "Jack, eat your peas". I said "there are no peas". She said "there will be no pudding".

The bit in the lobby. The bit with the helicopter. The bit where he dodges the bullets and goes all the way back. Me and Dave did the bullet dodge in the playground and Dave fell over. That's what happens when you're not the One.

Made a Matrix screensaver page for the website in honour of it.`);
  D('06-20', `NEW TETRIS HIGH SCORE!!!

148,320 on the Game Boy. Level 18. LEVEL EIGHTEEN.

At level 18 the pieces don't fall, they just APPEAR at the bottom. You have to decide where they go before you've even seen them. I think my brain went faster than the Pentium III.

My thumbs hurt. My left thumb has a little dent in it from the D-pad.

Took a photo of the screen with Dad's camera so nobody can say I made it up. It'll take a week to get developed. Dave will have to wait.`);
  D('06-25', `Went to see The Mummy at the cinema!

The scarab beetles crawl UNDER YOUR SKIN. You can see them moving. I'm never going to Egypt. Or anywhere sandy. Or the beach.

Slept with the landing light on. Not because I was scared. Because the landing needed lighting.

Also Dungeon Keeper 2 and Driver came out today. Dave's got Driver and nobody can pass the car park test at the start. Dave has tried 60 times. I tried once and crashed into a pillar. It's the hardest bit of any game ever and it's the FIRST BIT.`);
  D('07-03', `Put Blobbit Lob on the website!

It's a game where you fire Blobbits (my own made-up bouncy critters) out of a catapult and they bounce off mushrooms. If you get a good bounce they go really far. Gubbinz is the one loading the catapult because he's the smallest.

Had to work out the physics. Gravity is just "add a bit to the speed going down, every frame". That's it. That's all gravity is. Mr Okafor said it's a bit more complicated than that. Not in Blobbit Lob it isn't.`);
  D('07-16', `SAW THE PHANTOM MENACE!!!!!!!!

Darth Maul has a DOUBLE lightsaber. Both ends. I didn't know you were allowed to do that.

The podrace was the best bit. Sebulba is a cheater.

The music in the big fight at the end is called Duel of the Fates and it's got a choir singing in it and it's the most epic thing I have ever heard. I've got the CD. I've played it 40 times. Mom has asked me to play it 39 fewer times.

Jar Jar was... Jar Jar.

Dad fell asleep in the bit with the Senate. He says he was resting his eyes. For twenty minutes.`);
  D('07-23', `SCHOOL'S OUT FOR SUMMER!!!

SIX WEEKS of N64, LEGO, the website and staying up late.

Plan for the summer:
- Update the website every day
- Get under 3 minutes on the Rubik's cube
- Build a LEGO X-wing without the instructions
- Level 19 on Tetris
- Go outside (Mom)

Mrs Hargreaves said "have a lovely summer, Jack, and maybe read a book". I said I read the manual for Dungeon Keeper 2. She said a real book. The manual has 64 pages. That's a real book.`);
  D('08-07', `SUMMER TETRIS MARATHON!!!

Started at 2 o'clock. Got to level 19 at 11pm. LEVEL NINETEEN.

Then Mom came in and took the Game Boy off me. AT LEVEL NINETEEN. She said "it's eleven o'clock at night and you have been playing that thing for nine hours".

That's not even the bad bit. The bad bit is she switched it off. She didn't pause it. She SWITCHED IT OFF.

The score is gone forever. It only lives in my memory now. And in this diary.`);
  D('08-11', `THE ECLIPSE!!!

The Moon went in front of the Sun at about 11 o'clock in the morning. It was only TOTAL down in Cornwall but it still went really dim here, like evening in the middle of the day, and it got cold, and the birds went completely quiet. Even the dog next door stopped barking.

I had the special eclipse glasses from the newsagent. Didn't look at the Sun without them, I promised Mom. I also made a pinhole viewer out of a cereal box for my science project and you could see the little crescent Sun on the bottom of the box.

It was cloudy for about half of it, which is the most British thing ever. But for the important bit the clouds moved and EVERYBODY in our street cheered.

The next one in mainland Britain isn't till 2090. I'll be REALLY old.`);
  D('08-21', `Put a CHAT ROOM on the website!!!

You type a message and everybody who's on the site sees it. In REAL TIME. It's like a phone call but with typing and without the phone bill. Well, with the phone bill. The modem is the phone bill.

First message was me saying "hello?". Nobody answered. Second message was me saying "hello??". Nobody answered. Then Dave came on from his house and typed "OI" and it was the best moment of my life.

We talked for an hour. About what? Nothing. It was brilliant.`);
  D('08-22', `Some satellite clocks (GPS) all went back to zero last night because they only count up to a certain number of weeks and then start again. The man on the news said it's like a practice for the Millennium Bug.

Nothing broke. Planes didn't fall out of the sky. Our video recorder is still flashing 12:00, but that's been flashing 12:00 since 1996.

I'm starting to think the Millennium Bug is going to be the same. But I'm still going to have a torch ready. Just in case.`);
  D('09-06', `Back to school. Boo.

New timetable. Double maths on a Monday. Who decided that? Who looks at a Monday and goes "you know what this needs? MORE MATHS"?

Good things about being back:
- Computer club on Thursdays. ${CN('teacher')} says I can help with the school website. It currently has one page and that page says "Welcome to the website". That's it.
- Dave sits next to me in science.

Bad things:
- Everything else.`);
  D('09-09', `9/9/99!!!

The Dreamcast came out in America today. It's on 9/9/99 because that's a cool date. Sonic Adventure looks like a film. Five weeks till it's out here.

Also, some really old computer programs use 9999 to mean "no date" or "the end", so today might have confused them. Nothing happened. Our computer is fine. The bank is fine. The traffic lights are fine.

Mr Bell made us write 9/9/99 at the top of our maths books and then talk about patterns. Then I worked out that 9 x 9 x 99 is 8,019. He said that wasn't the point. It's a FACT though.`);
  D('09-18', `RUBIK'S CUBE IN UNDER 4 MINUTES!!!

3 minutes 51 seconds. Dad timed it with the oven clock.

The trick is to stop looking at the instructions. My hands just KNOW the moves now. R U R' U'. R U R' U'. It's like a song you can't stop humming.

Next goal: under 2 minutes. That's halving it. I've halved it before. (From 8 to 4. From 3 hours to 8 minutes was more than halving it but who's counting.)

(Me. I'm counting.)`);
  D('09-23', `NASA lost a spaceship to Mars because one team worked in pounds (old-fashioned units) and the other team worked in metric. The spaceship went too low and burned up.

A $125 MILLION spaceship. Lost because of UNITS.

Mr Bell came into maths, didn't say anything, and wrote "MARS CLIMATE ORBITER" on the board and underlined it twice. Then he said "now. Who wants to tell me why we show our units?"

He is going to go on about this until I leave school. Possibly until I die.`);
  D('09-25', `Put the MegaCube on the website!!!

It's ONE Rubik's cube that EVERYBODY on the site shares. If you turn it, it's turned for everyone. So if somebody nearly solves it and then somebody else does a move... that's it. That's the whole game. It's either the most fun thing ever or a disaster. Probably both.

I scrambled it first. Sorry everybody.

Dave turned the top face 400 times to see if it would break. It didn't. Dave might be broken.`);
  D('10-04', `Walking with Dinosaurs started on BBC One!!!

It looks REAL. Like somebody went back in time with a camera. Dad says it's computers. HOW is it computers? Our computer can't even run Quake III properly (not that it's out yet) and the BBC made a whole T-Rex.

The bit where the big one dies made Mom go "oh no" and she wasn't even watching properly.

Going to do my next school project on dinosaurs. Or on how they made the dinosaurs. That's even better.`);
  D('10-05', `POKEMON BLUE IS OUT!!!

Mom took me to the shop after school. The man had a whole stack of them and half were gone already.

I picked SQUIRTLE. Obviously. He's a turtle and he's blue and he squirts water and that's the best possible thing a creature can do. I've drawn him loads already. Well, not him, a turtle like him. My own one.

Beat Brock already because water beats rock. My Squirtle is level 14 and his name is SHELLDON.

There are 151 Pokemon on a cartridge that's only 1 MEGABYTE. HOW?

Dave got Red. We're going to trade. He doesn't know yet that I'm going to make him give me his Bulbasaur.`);
  D('10-14', `THE DREAMCAST IS OUT HERE TODAY!!!

About two hundred pounds. 200MHz chip. 16MB of RAM. And it has a 33.6K MODEM BUILT IN. You can go on the Internet ON A GAMES CONSOLE.

Went to the shop just to look at it. They had one set up with Sonic Adventure and a queue of kids waiting to have a go. I got two minutes. Sonic ran down the side of a building. It was the best two minutes of my life.

Mom said "we'll see" about Christmas. "We'll see" is not a no. "We'll see" is a maybe. A maybe is nearly a yes.

Dave says his dad is getting one "definitely". Dave's dad says a lot of things "definitely".`);
  D('10-16', `Learnt how to paint FLAMES on an Ork trukk!!!

You do it with red first, then orange, then yellow on the tips. Yellow on the TIPS. Not all over. If you do it all over it looks like custard.

Red ones go faster. Red ones with FLAMES go even faster. That's just Ork science.

Took a picture of it with Dad's camera. Saved it in My Pictures once it was developed and scanned at ${CN('cousin2')}'s (${CN('cousin2')} has a scanner).`);
  D('10-27', `FINAL FANTASY VIII IS OUT!!!

It's on FOUR DISCS. FOUR. That's about 2.6 gigabytes of game. Our whole hard drive is 6.4.

The intro made my jaw actually drop. Mom said "close your mouth Jack, you'll catch flies". There was a flying sword fight on a cliff. With a gunblade. A sword that's ALSO a gun.

Spent two hours on the card game instead of doing the story. It's called Triple Triad and it's addictive.

Dave asked how far I've got. Disc 1. Still. Forever.`);
  D('10-31', `Halloween! Went trick-or-treating as a Jedi. Again. Third year running.

Same brown dressing gown (Dad's), same green lightsaber (a torch with green sweet wrappers on it), same beige top.

Dave went as an alien. He painted his face green and it wouldn't come off. He's going to be green at school tomorrow. He says it's "his look now".

Got: 14 fun-size chocolate bars, 3 apples (why), 1 toothbrush (WHY), 2 lollies. Gave the toothbrush to Dave. He needs it.`);
  D('11-02', `Everybody got a leaflet about the Millennium Bug through the door.

It says to "keep a supply of essentials" and "have a torch and batteries". Mom has bought 40 tins of beans. FORTY. We're going to be eating beans until 2003.

Dad has filled the bath with water. Not yet, he's going to on New Year's Eve. "Just in case." Mom said what if the bug only affects baths. Dad didn't laugh.

I've checked my PC with a Y2K checker program. It says we're COMPLIANT. That means it won't break. Probably.

Also put a Y2K countdown on the website. It goes down every second. It's making everybody nervous.`);
  D('11-05', `Bonfire Night AND Spyro 2 came out!!!

Spyro is a little purple dragon who headbutts things and breathes fire. He's back with new levels and you can swim now. Didn't get it. Dave didn't get it either. Nobody got it. Christmas list!

Bonfire Night: went to the big one at the park. Sparklers (wrote JACK in the air, also wrote N64, also wrote POKEMON but ran out of sparkler at the M). Jacket potato with beans (one of Mom's 40 tins). The fireworks were massive. One was green and Dave said it looked like his face on Halloween.`);
  D('11-18', `THE LEONID METEOR STORM WAS LAST NIGHT!!!

Thousands of shooting stars an hour, the man on the news said. Maybe the most for 33 years.

Set my alarm for 2am. Got up. Put on my coat over my pyjamas. Went in the garden. Looked up.

It was cloudy.

Of course it was cloudy. It's ALWAYS cloudy. I stood there for twenty minutes anyway in case there was a gap. There was not a gap. I took a photo anyway. It's just grey.

Dad came out with a cup of tea and said "anything?". I said "clouds". He said "ah". We stood there for a bit. It was actually quite nice.`);
  D('11-19', `SUPER SMASH BROS. IS OUT HERE!!!

FINALLY!!! It came out in Japan in JANUARY. It's been nearly a year!!!

Mario vs Link vs Pikachu vs Kirby vs Donkey Kong vs Samus vs Fox vs Yoshi. On a 16MB cartridge. And there are SECRET characters. You can unlock Luigi, Ness, Captain Falcon and Jigglypuff. I've already got Luigi (you do the target smash with everyone).

Four players at Dave's: me (Link), Dave (Pikachu), Dave's cousin (Kirby), Dave's dad (he picked Jigglypuff by accident and won). Dave's dad WON. He doesn't even play games. He just pressed buttons. Video games are not fair.`);
  D('12-03', `ROBOT WARS IS BACK!!! Series 3!!!

The new arena has even more traps. Sir Killalot is still the best.

I've designed my robot. It's called SIR GRUNTALOT. It's got a flipper on the front (yellow) and a big saw on an arm (I drew the teeth one at a time) and it's grey with a red stripe because red ones go faster.

${CN('teacher')} at computer club said I should look up how much a real one costs. I'm not going to look it up. Some dreams are better as drawings.`);
  D('12-06', `DONKEY KONG 64 IS OUT TODAY!!!

It comes with the Expansion Pak which DOUBLES the N64's memory from 4MB to 8MB. You actually NEED it to play the game. It's a 32MB cartridge. THIRTY TWO.

I don't have it. Mom said "we'll see" again. It's December 6th. It's 19 days before Christmas. "We'll see" in December means "it's already wrapped and in the wardrobe".

I haven't looked in the wardrobe. I want it to be a surprise. (I haven't looked. I HAVEN'T.)`);
  D('12-17', `Quake III Arena came out here today.

You need a 3D card and 64MB of RAM. We have EXACTLY 64MB of RAM. Dave's cousin lent me the demo on a CD and it runs! It runs in a window the size of a stamp. At 640x480 the frame rate goes down to "slideshow".

Mom came in during a match and said "is that the one where you shoot people" and I said "no it's the one where you shoot ROBOTS who are people" and she said "hmm".

Writing to Father Christmas about a Voodoo3. Father Christmas knows what a Voodoo3 is. Dad doesn't.`);
  D('12-25', `MERRY CHRISTMAS!!!

GOT DONKEY KONG 64!!! AND A RUMBLE PAK!!! AND A LEGO SPACESHIP!!!

(I did NOT look in the wardrobe. I want that on record.)

Also got: socks (Gran), a book about space (${CN('cousin2')}), a Gubbinz mug that Mom made at one of those paint-a-pot places (BEST PRESENT), a selection box, and a new Rubik's cube because the old one is "a bit sticky" (it's covered in model paint).

The DK Rap is now stuck in my head and will be stuck there forever. Mom has heard it nine times today. She says if she hears "DK, Donkey Kong" once more she's moving to Mars. Mars is cursed, Mom. NASA keeps losing things there.

Best Christmas ever.`);
  D('12-28', `The Millennium Bug came EARLY!!!

Loads of card machines in shops stopped working because they thought it was the year 1900. Dad was in the supermarket and the lady had to do everything on paper with a little machine that goes ka-chunk.

So the bug is REAL. And it's three days early. Which means it's either going to be really bad on New Year's Eve, or it's already used up all its badness.

Dad has bought a SECOND torch.`);
  D('12-31', `LAST DAY OF 1999. LAST DAY OF THE 1900s. LAST DAY OF THE MILLENNIUM (Dave's dad says actually that's next year, everybody has told Dave's dad to be quiet).

Going to Dave's for the Millennium Party!!! I've packed: sleeping bag, N64, GoldenEye, 4 controllers, Pokemon Blue, link cable, party poppers, a torch (MILLENNIUM BUG).

I'm saving this diary now in case the computer explodes at midnight. If you're reading this in the year 2000, then we made it. Hello future!

If you're reading this and it's still 1999... that would be weird. That would mean the year started again. That can't happen.

Can it?

YESSS!!! HAPPY NEW YEAR!!!`);

  // ---------------------------------------------------------------- Homework
  const HW = MD + '/Homework';
  txt(HW, 'what I want to be when I grow up.txt', '22/01/99', `WHAT I WANT TO BE WHEN I GROW UP
by Jack
English homework for Mrs Hargreaves (500 words, I did 512)

When I grow up I want to make video games. There are other things I would also like to be, and I will list them later in case the first one doesn't work out, but games is the main one.

I want to make games because games are the only kind of story where YOU are the one who does things. In a book you just read about the hero. In a film you just watch the hero. In a game you ARE the hero, or sometimes a little green dinosaur, or a worm with a bazooka. I think that is the most exciting kind of story there is.

I have already made two games. One is called JACKTRIS (nearly finished) and it's like Tetris (Tetris was made in Russia by a man called Alexey Pajitnov, I looked it up). The other one isn't finished. It's about a robot who has to get to the shops before they shut. It's harder than it sounds because his batteries keep running out.

To make games you need to be good at:
1. Maths (for the physics and the scores)
2. Art (for the characters)
3. Stories (for the story)
4. Music (for the music)
5. Typing (for typing)

I am good at 2, 3 and 5, and I'm getting better at 1. For 4 I can play the recorder, but only Three Blind Mice and the first bit of the Star Wars music.

OTHER THINGS I WOULD LIKE TO BE:
- An astronaut. I would like to go to Mars. Someone has to, and they'll need someone who's good with computers. Also I would like to see the Earth from space and wave at Mom.
- The world Rubik's cube champion. I got my cube last week and I can nearly do one side. The world record is a LOT faster than "nearly one side". I'm working on it.
- A Space Marine. (Mrs Hargreaves, this is not a real job. I know.)
- A Jedi. (This is also not a real job. But if it was, I'd be good at it.)

When I am grown up I will also have a computer with a 10 GIGABYTE hard drive and a 3D card and nobody will tell me to get off it at 8 o'clock.

THE END

Teacher's comment: "Lovely enthusiasm, Jack, and a very clear structure. Please don't draw X-wings in the margin. 8/10."`);
  txt(HW, 'SCIENCE - the eclipse project.txt', '16/08/99', `SCIENCE PROJECT: THE TOTAL SOLAR ECLIPSE OF 11 AUGUST 1999
by Jack
For Mr Okafor (summer holiday project)

1. WHAT IS AN ECLIPSE?
A solar eclipse is when the Moon goes in front of the Sun and blocks it out. The Moon's shadow lands on the Earth. If you're right in the middle of the shadow, it's a TOTAL eclipse and the whole Sun is covered. If you're a bit to the side, it's a PARTIAL eclipse and only some of the Sun is covered.

2. THE AMAZING COINCIDENCE
The Sun is about 400 times wider than the Moon. But it's also about 400 times further away. So from Earth they look almost exactly the same size! That's why the Moon fits over the Sun perfectly. If the Moon was a bit smaller we'd never get total eclipses at all. I think this is the most amazing fact in the universe.

3. WHERE WAS IT TOTAL?
The path of totality went across the bottom of England: Cornwall and part of Devon, and the island of Alderney. Totality only lasted about two minutes. Everywhere else in Britain got a partial eclipse, including us.

4. WHAT I SAW
- It went dim, like evening.
- It got colder. (I had a thermometer. It went down about 2 degrees.)
- The birds stopped singing.
- Through the special glasses, the Sun looked like a biscuit with a bite out of it.
- Through my pinhole viewer (see section 5) you could see a little crescent.

5. HOW TO MAKE A PINHOLE VIEWER
You need: a cereal box, tin foil, a pin, white paper, sticky tape.
a) Tape white paper inside the bottom of the box.
b) Cut a hole in the top at one end and cover it with foil.
c) Make a tiny pin hole in the foil.
d) Stand with your BACK to the Sun and look into the box. A tiny picture of the Sun appears on the paper!

6. SAFETY
NEVER EVER LOOK AT THE SUN. Not even a bit. Not even with sunglasses. Your eyes can get burnt and it doesn't even hurt while it's happening, which is the scary part. Only use proper eclipse glasses, or a pinhole viewer.

7. COOL WORDS
- Corona: the Sun's outer atmosphere, you can only see it during totality. It looks like a white glowing crown.
- Baily's beads: little dots of sunlight shining through valleys on the edge of the Moon.
- Diamond ring: the very last bead, which looks like a diamond on a ring.
- Umbra: the dark middle of the shadow. Penumbra: the lighter edge.

8. WHEN IS THE NEXT ONE?
The next total eclipse you can see from mainland Britain is in 2090. I will be very old. I will bring my grandchildren. I will tell them about the clouds.

Mr Okafor's comment: "Excellent work Jack, A. Lovely diagram of the pinhole viewer. Please don't draw X-wings in the corona."`, { date: '16/08/99' });
  txt(HW, 'maths sheet 4 - fractions.txt', '08/02/99', `MATHS - SHEET 4 - FRACTIONS                Name: Jack
                                             Set: 2 (Mr Bell)

1)  1/2 + 1/4 =  3/4                          ( o o )   <- Blobbit
                                              ( ### )
2)  2/3 of 18 =  12                            ^   ^

3)  Simplify 12/16 =  3/4

4)  Which is bigger, 3/5 or 5/8?
    3/5 = 24/40, 5/8 = 25/40
    so 5/8 is bigger (by one fortieth, which is basically nothing)

5)  A pizza is cut into 8 slices. Dave eats 3 and Jack eats 2.
    What fraction is left?   3/8
    (Why did Dave get more?? Unfair question)

6)  1 3/4 - 5/8 =  1 1/8                       __
                                              |  |   <- a tetris piece
7)  What is 7/10 as a percentage?  70%       __|  |
                                             |_____|
8)  A Rubik's cube has 6 faces with 9 stickers each.
    What fraction of the stickers are red?   9/54 = 1/6
    (On a SOLVED cube. On my cube right now it's about 11/54)

9)  0.375 as a fraction =  3/8

10) Jack has 20 miniatures. 3/4 of them are painted.
    How many are NOT painted?   5
    (Mr Bell this question is about me isn't it)

                                   GET IN!! <- sorry, crossed out
                                   ------

Mark: 9/10. "Q6: check your working, should be 1 1/8. Oh, it is. 10/10.
              Please stop drawing Tetris pieces on your worksheets. - Mr B"`);
  txt(HW, 'French - ma famille.txt', '03/03/99', `FRENCH HOMEWORK - Ma famille et moi
(Mrs Pike)

Je m'appelle Jack.
J'habite dans une maison avec ma mere, mon pere et un ordinateur.
L'ordinateur s'appelle "le PC". Il est beige.

Ma mere est tres gentille mais elle dit toujours "eteins l'ordinateur!"
(= "turn off the computer!" - I had to look up "eteins", it was worth it)

Mon pere aime le football sur l'ordinateur. Il ne joue pas au football. Il le regarde. Sur l'ordinateur.

Mon meilleur ami s'appelle Dave. Dave est tres drole et un peu bizarre.

J'aime les jeux video, la Guerre des Etoiles et le Rubik's cube.
Je n'aime pas les choux de Bruxelles.

Mon animal: je n'ai pas d'animal. J'ai un Gubbinz. Il s'appelle Gubbinz. Il est vert. Il mange des Wotsits.

Mrs Pike's comment: "Tres bien, Jack! But 'Gubbinz' is not French. Neither is 'Wotsits'. 15/20"`);
  txt(HW, 'history - the Romans.txt', '10/05/99', `HISTORY - What did the Romans do for us?
(Mr Fenwick)

The Romans came to Britain in AD 43 and stayed for nearly 400 years. That's longer than anyone has ever played the same game.

THINGS THE ROMANS GAVE US:
1. Straight roads. Before the Romans the roads were wiggly.
2. Baths. Public ones. With everybody in them. (No thank you.)
3. Central heating, called a hypocaust. Hot air under the floor.
4. Towns with proper planning, like SimCity.
5. Aqueducts, which are bridges for water.
6. Latin, which is where loads of English words come from. "Computer" comes from Latin "computare", which means to count. So the Romans basically invented computers. (Mr Fenwick says this is "a stretch".)

THE ARMY
Roman soldiers were called legionaries. They had shields called scutum and they could make a formation called the tortoise (testudo) where they put their shields all around and on top like a shell.

This is the same as what Space Marines would do if they had to fight aliens with shields. Which they wouldn't, because they have power armour. But if they did.

Mr Fenwick's comment: "Good facts. Less Space Marines please. B+"`);
  txt(HW, 'HOMEWORK DIARY.txt', '07/09/99', `HOMEWORK DIARY - AUTUMN TERM

Mon  Maths sheet 12 (angles)           DONE
Tue  English: write a spooky story     DONE (it had a robot in it)
Wed  Science: find 5 examples of       DONE (the fridge door, the kettle,
     forces in your house                   gravity, Dad's Champ Manager tantrum)
Thu  French vocab test                 REVISED (a bit)
Fri  History: Tudor family tree        not done - the Tudors are confusing,
                                       everyone is called Henry or Mary
`);

  // ---------------------------------------------------------------- Lists
  const LI = MD + '/Lists';
  txt(LI, 'things to remember.txt', '31/12/98', `THINGS TO REMEMBER
==================

- Mom's birthday is in the calendar on the fridge. LOOK AT THE FRIDGE.
- Feed Gubbinz (the website one) every day
- Don't press the turbo button on the PC, it doesn't do anything and Dad thinks it does
- Floppies go in label side UP
- The modem number is in Dial-Up Networking, don't change it
- Never lend Dave a pencil (never comes back)
- Never lend Dave a game (never comes back)
- Never lend Dave anything

PASSWORD REMINDER FOR MY SECRET FOLDER
(so I don't forget it. This is NOT the password, it's a riddle.
Dave can't do riddles so this is safe.)

   What colour is Pikachu?
   (6 letters. Dave says "orange".
   Dave is wrong.)
`);
  txt(LI, 'top 10 games EVER.txt', '15/03/99', `JACK'S TOP 10 GAMES EVER (UPDATED REGULARLY)

1.  GoldenEye 007 (N64)        - the best game ever made. Facility. Slappers only.
2.  The Legend of Zelda: Ocarina of Time (N64) - the bit where you grow up!!!
3.  Super Mario 64 (N64)       - 120 stars. I have 118. Two are lost forever.
4.  Tetris (Game Boy)          - simple. perfect. thumb-destroying.
5.  Worms Armageddon (PC)      - the sheep. THE SHEEP.
6.  Metal Gear Solid (PS)      - Dave's copy. Cardboard box tactics.
7.  Final Fantasy VII (PS)     - Dave's copy. I cried. (No I didn't.)
8.  Theme Park (PC)            - salty chips = more drinks sold. Genius.
9.  Doom (PC)                  - IDDQD
10. JACKTRIS (PC/Internet)     - my own one. Is this allowed? It's my list.

Games I'm waiting for: Episode I Racer, Pokemon, Smash Bros, Donkey Kong 64,
Final Fantasy VIII, the Dreamcast, and anything with Star Wars in it.
`);
  txt(LI, 'top 10 films of 1999.txt', '20/12/99', `TOP 10 FILMS OF 1999 (that I saw)

1. The Matrix              - there is no spoon
2. The Phantom Menace      - Darth Maul. Pod race. Jar Jar (minus 1 point)
3. A Bug's Life            - bloopers!
4. The Mummy               - scarab beetles (never again)
5. Star Trek: Insurrection - Picard does a dance
6. Wild Wild West          - giant mechanical spider. That's all.
7. Austin Powers 2         - Mom covered my eyes twice
8. The World Is Not Enough - not as good as GoldenEye. Nothing is.
9. (I've only seen 8 films. Mom says the cinema is "very dear".)
10. (see above)

Can't wait for: Toy Story 2 (February!!!), Galaxy Quest, Pokemon: the movie
`);
  txt(LI, 'christmas list 1999.txt', '01/11/99', `CHRISTMAS LIST 1999
(for Mom, Dad, Gran and Father Christmas, in that order)

1. DREAMCAST (+ Sonic Adventure) (+ a VMU) (+ a second controller)
2. Donkey Kong 64 (comes with the Expansion Pak!!!)
3. A Rumble Pak
4. LEGO. Any LEGO. LEGO is always a good present.
5. Spyro 2
6. A 3D graphics card (a Voodoo3, Dad, it's a GRAPHICS CARD, it goes INSIDE the computer)
7. A Zip drive (100MB on one disk!!!)
8. Paint (green, red, and that silver one for axes)
9. A book about space
10. Socks (for Gran to buy, she always buys socks, this way it's on the list)

DEFINITELY NOT: a jumper. Any jumper.
`);
  txt(LI, 'christmas list 1998 (what I got).txt', '27/12/98', `CHRISTMAS 1998 - WHAT I ASKED FOR vs WHAT I GOT

ASKED FOR                      GOT
Zelda: Ocarina of Time         Zelda: Ocarina of Time!!!
LEGO Technic                   LEGO Technic!!!
A PC                           A PC!!! (well, the family PC, but it lives
                               in MY ROOM because "you're the one who uses it")
A modem                        It came with the PC! 56K!
A Rubik's cube                 No (getting one in the sales)
A jumper                       I didn't ask for a jumper. Got a jumper.
`);
  const RUBIK = `RUBIK'S CUBE - HOW TO SOLVE IT (layer by layer)
written by Jack after solving it for the FIRST TIME on 03/04/99

THE LETTERS
  F = front face   B = back face
  U = up (top)     D = down (bottom)
  R = right        L = left
  A letter on its own   = turn that face CLOCKWISE (as if you're looking at it)
  A letter with a '     = turn it ANTICLOCKWISE  (R' says "R prime")
  A letter with a 2     = turn it twice (U2)

STEP 1: WHITE CROSS
  Make a white cross on top, with the edge colours matching the middles.
  No moves for this. You just have to think. (Took me 3 days to get it.)

STEP 2: WHITE CORNERS
  Put the white corner above where it goes (front right, top layer... flip
  the cube so white is on the BOTTOM first). Then do:
      R U R' U'
  ...again and again until the corner goes in the right way round.
  Sometimes it takes 5 goes. Don't panic. It always works.

STEP 3: MIDDLE LAYER EDGES
  Find an edge on top without yellow. Turn the top so it matches its middle.
  If it needs to go to the RIGHT:   U R U' R' U' F' U F
  If it needs to go to the LEFT:    U' L' U L U F U' F'

STEP 4: YELLOW CROSS
      F R U R' U' F'
  Do it once or twice or three times until you get a yellow cross.
  (Dot -> L shape -> line -> cross)

STEP 5: YELLOW EDGES IN THE RIGHT PLACES
      R U R' U R U2 R' U
  This swaps edges round. Hold the two good ones at the back and right.

STEP 6: YELLOW CORNERS IN THE RIGHT PLACES
      U R U' L' U R' U' L
  Swaps three corners round. Hold the one that's already right at the
  front right.

STEP 7: TWIST THE LAST CORNERS
      R' D' R D
  Do it until the corner at front right is yellow on top. Then turn ONLY
  THE TOP (U) to bring the next one there. Keep going.
  THE CUBE WILL LOOK BROKEN IN THE MIDDLE OF THIS STEP. TRUST IT.
  (This is the scariest step. It's like a sword fight with a puzzle.)

DONE!!! GET IN!!!

MY TIMES:
`;
  txt(LI, "rubik's cube moves.txt", '03/04/99', '', { get text() { return RUBIK + gated('', [['04-03', '  03/04/99   3 hours (first ever! library book)'], ['04-04', '  04/04/99   2 hours'], ['04-20', '  20/04/99   26 minutes'], ['05-30', '  30/05/99   8 minutes 12 seconds'], ['07-30', '  30/07/99   5 minutes 40 seconds'], ['09-18', '  18/09/99   3 minutes 51 seconds (DAD TIMED IT WITH THE OVEN CLOCK)'], ['11-27', '  27/11/99   3 minutes 02 seconds'], ['12-29', '  29/12/99   2 minutes 48 seconds (on the new cube, much smoother)']]) + '\n'; } });
  txt(LI, 'tetris high scores.txt', '02/01/99', '', { get text() { return gated(`TETRIS HIGH SCORE LOG (Game Boy, A-TYPE, MUSIC A obviously)
===============================================================
Date        Score     Level   Notes
`, [['01-02', '02/01/99     38,140    9      new Game Boy batteries'], ['01-30', '30/01/99     51,900    11     on the bus (Mom drove, I mean in the car)'], ['02-27', '27/02/99     64,220    12'], ['03-28', '28/03/99     80,505    13     got a TETRIS (4 lines) on level 13!!!'], ['04-18', '18/04/99     88,010    14     after making Jacktris, my brain is all Tetris now'], ['05-22', '22/05/99    102,330    15     OVER 100,000!!!!!'], ['06-20', '20/06/99    148,320    18     LEVEL 18!!! PHOTO TAKEN AS PROOF'], ['08-07', '07/08/99    ???,???    19     Mom switched it off. AT LEVEL 19. The score is lost.'], ['08-30', '30/08/99    141,800    17     still not as good as the lost one'], ['11-11', '11/11/99    150,060    18     NEW RECORD!!! Beat the photo!!! (no photo of this one, oops)'], ['12-26', '26/12/99    156,440    19     Boxing Day. Gran watched. She said "very nice dear"']], `

Dave's best: 11,203. (Dave says his Game Boy is "slow". Game Boys aren't slow.)
`); } });
  txt(LI, 'ork painting log.txt', '23/01/99', '', { get text() { return gated(`PAINTING LOG (minis, models, anything with a brush)
=================================================
(red ones go faster)

`, [['01-23', '23/01/99  Ork Nob #1 - "Big Grob". Red armour. Glued finger to axe.'], ['02-06', '06/02/99  Space Marine #1 - "Brother Tiny". Tiny. Painted his eyes with a cocktail stick.'], ['02-21', '21/02/99  Orks x3. Got the green right this time (two coats).'], ['03-27', '27/03/99  Spent all pocket money on an Airfix Spitfire. Glue everywhere. Mom opened a window.'], ['04-10', '10/04/99  Learned DRYBRUSHING. It is magic. Redid Big Grob\'s armour.'], ['05-31', '31/05/99  TWELVE SPACE MARINES in one day. Bank holiday. Brother Zoom is the fastest (all red).'], ['06-12', '06/06/99  Painted a squig. Red, with white teef. Looks angry. Good.'], ['07-27', '27/07/99  Summer holidays: the whole mob is done. Took a photo of them on my shelf.'], ['08-15', '15/08/99  Started a Warboss. TOP SECRET. Not showing Dave until he\'s finished.'], ['09-11', '11/09/99  Warboss finished. Best thing I have ever painted. In the secret folder.'], ['10-16', '16/10/99  FLAMES on the trukk! Red, then orange, then yellow on the TIPS.'], ['11-20', '20/11/99  Bits box sorted into old ice cream tubs: heads, arms, guns, "misc"'], ['12-27', '27/12/99  Christmas LEGO spaceship built. Painting the last Orks before the Millennium!']], `

TOTAL PAINTED: lots. (I lost count at 40.)
RESOLUTION WAS 50. I THINK I'VE DONE IT. I'M NOT COUNTING AGAIN.
`); } });
  txt(LI, 'bits box inventory.txt', '20/11/99', `BITS BOX INVENTORY (sorted into ice cream tubs!!!)

TUB 1 (Raspberry Ripple) - HEADS
  - 14 Ork heads (3 with helmets, 1 with a cigar - not a cigar, a stick)
  - 6 Space Marine helmets
  - 1 head I can't identify. Might be a gnome.

TUB 2 (Vanilla) - ARMS
  - 22 arms, holding: choppas (9), sluggas (7), nothing (6)
  - 1 arm holding a tiny teapot (SPECIAL)

TUB 3 (Mint Choc Chip) - GUNS AND STUFF
  - big gun barrels, gubbinz, bitz, more gubbinz

TUB 4 (Neapolitan) - "MISC"
  - wheels, a banner pole, a dice, a Lego man (how?), half a biscuit (WHY)
`);
  txt(LI, 'names for Orks.txt', '28/03/99', `GOOD NAMES FOR ORKS (for when I paint new ones)

Big Grob         Zoomgob (fastest)     Snaggatoof
Grimskull        Wazbang               Krumpa
Gubbinz (taken, he's the website helper)

SPACE MARINE NAMES: Brother Zoom, Brother Tiny, Sergeant Biscuit
ROBOT WARS NAMES: Sir Gruntalot, The Flipper, Toastmaster 3000
GAME BOY SAVE NAMES: JACK, JAX, ACE, J-DOG (no), DAVE (only to annoy Dave)
TAMAGOTCHI NAMES: Chompy, Mr Bitey, Lunch (RIP all three)
`);
  txt(LI, 'things that are better than homework.txt', '14/09/99', `THINGS THAT ARE BETTER THAN HOMEWORK
1. Everything
2. Literally everything
3. Even tidying my room (no, wait, not that)
4. Going to the dentist? (no)
5. OK some things are worse than homework. But not many.
`);
  txt(LI, 'jobs Mom wants me to do.txt', '10/07/99', `JOBS MOM WANTS ME TO DO (she typed this, on MY computer, in MY documents)

[ ] Tidy bedroom (paint pots DON'T count as tidy if they're on the floor)
[ ] Take the cereal bowls back downstairs (all six)
[ ] Feed the goldfish next door while they're on holiday
[ ] Go OUTSIDE. In the AIR.
[ ] Get off the computer at 8pm

Love Mom x

P.S. I know where the biscuits went.
`);

  // ---------------------------------------------------------------- Stories
  const ST = MD + '/Stories';
  txt(ST, 'STAR CRUISER ZETA - chapter 1.txt', '13/02/99', `STAR CRUISER ZETA
A science fiction story by Jack
CHAPTER 1: THE SIGNAL

Commander Jax Hartley had been asleep in the cryo-pod for 199 years when the alarm went off.

"WAKE UP COMMANDER," said the ship's computer, ZETA. ZETA had a voice like a very calm lady who was also slightly annoyed. "WE ARE RECEIVING A SIGNAL."

Jax climbed out of the pod. His legs felt like spaghetti. His hair had grown down to his knees, which was weird because you're not supposed to grow in cryo-sleep. He decided to worry about that later.

"What kind of signal?" he said.

"IT APPEARS TO BE," said ZETA, "A MODEM."

Jax walked to the window. Outside, the planet Kepler-9 turned slowly. It was beige. The whole planet was beige, like a computer from 1999.

From the surface came a noise. A long, horrible, screeching noise. BEEEEE-DOOOO-KSSSHHHHH.

"It's trying to connect to us," said Jax.

"SHALL I ANSWER?" asked ZETA.

Jax thought about it. Answering a strange signal from a beige planet in deep space was probably the most dangerous thing anyone could ever do. On the other hand, he'd been asleep for 199 years and he was very bored.

"Answer it," he said.

The screen flickered. Letters appeared, one at a time, very slowly.

    H . E . L . L . O .

    A . R . E .   Y . O . U .   O . N . L . I . N . E . ?

TO BE CONTINUED IN CHAPTER 2!!!
(Chapter 2 is not written yet. It will have lasers.)
`);
  txt(ST, 'STAR CRUISER ZETA - chapter 2.txt', '19/06/99', `STAR CRUISER ZETA
CHAPTER 2: THE BEIGE PLANET

Jax took the shuttle down to Kepler-9. ZETA came too, in a small handheld unit that looked like a Game Boy but with more buttons.

The surface was covered in tall beige towers. Each tower had a slot in the front and a little green light that blinked. Some of them hummed. Some of them made a grinding noise.

"These are computers," said Jax. "The whole planet is computers."

"THEY ARE VERY OLD," said ZETA. "THEY ARE STILL WAITING FOR SOMETHING."

"What?"

"A DOWNLOAD. IT HAS BEEN DOWNLOADING FOR 4,000 YEARS. IT IS AT 99 PERCENT."

Jax looked at the screen. It said 99%. The little bar was nearly full. He could feel the whole planet holding its breath.

And then, from very far away, somewhere on the other side of the world, a phone rang.

The bar disappeared.

"NOOOOOOO," said the planet.

(Yes, planets can talk in this story. It's sci-fi.)

TO BE CONTINUED. THERE WILL DEFINITELY BE LASERS NEXT TIME.
`);
  txt(ST, 'Gubbinz and the Squig of Doom.txt', '29/05/99', `GUBBINZ AND THE BLOBBIT OF DOOM
a space story by Jack (it was called "the Squig of Doom" in the first draft, but then I invented Blobbits)

Gubbinz was the smallest helper on the whole of Space Station Bad Moon, and that was saying something, because the helpers are already very small.

Every morning, Gubbinz had the same job: feed the Blobbits. The Blobbits lived in a big pen made of old spaceship doors, and they were round and red and they were mostly mouth.

"Morning, Blobbits," said Gubbinz, every morning, and threw them a bucket of space crisps.

The Blobbits said "NOM" and "NOM NOM" and one of them, the biggest one, said "GRRRAAAAH" and tried to eat the bucket.

The biggest Blobbit was called Chompy. Chompy was the size of a cooker. Chompy had eaten four buckets, a moon boot, two robots (they got rebooted) and a small hover car.

One morning, Gubbinz forgot to shut the airlock.

Chompy saw the airlock. Chompy saw Gubbinz. Chompy saw the WHOLE STATION, full of space cadets, space cadets' dinners, and very tasty-looking moon boots.

"Uh oh," said Gubbinz.

Chompy went BOING. Then BOING BOING. Blobbits don't walk. They bounce. (In low gravity they bounce A LOT.)

He bounced over the canteen (the cook was not happy). He bounced over the robot workshop (a laser went off and blew a hole in the space loo). He bounced over the Captain, who was asleep in his big chair, and ate his hat.

Nobody eats the Captain's hat.

The Captain woke up. "WHO," he said, in a voice like a rocket launch, "LET THE BLOBBIT OUT?"

Every robot on the station pointed at Gubbinz.

Gubbinz did the only thing a little helper can do in that situation. He pointed at a different robot.

But the Captain didn't shout at anyone. He looked at Chompy, bouncing round and round the station with his hat in its mouth, and he started to laugh. A big, booming, Father Christmas laugh.

"That Blobbit," said the Captain, "is FAST. And it's RED."

He climbed onto Chompy's back. Chompy went BOING. The Captain went "WOOOOO-HOOOO!" And they bounced off down the corridor together, faster than any hover car.

From that day on, the Captain rode Chompy everywhere. And Gubbinz got promoted to Head Blobbit Keeper, which was the same job as before, but with a hat.

THE END

(Red ones go faster. Even Blobbits.)
`);
  txt(ST, 'poem - ode to my modem.txt', '17/03/99', `ODE TO MY MODEM
a poem by Jack

O modem, O modem, you sing me a song,
It's screechy and squeaky and twenty seconds long.
You beep and you boop and you go KSSHHHH,
Then we're on the Internet! (For about an hour.)

You're 56K, which is ever so fast,
Except when you're not, which is most of the time.
(That doesn't rhyme. Neither do you, modem.)

O modem, O modem, please don't disconnect,
When Mom rings ${CN('auntie')} to "just quickly check".
I've downloaded ninety-nine percent of a thing,
And now it is gone. Because of the ring.

THE END
`);
  txt(ST, 'spooky story (english homework).txt', '28/09/99', `THE THING IN THE COMPUTER
a spooky story by Jack (English homework, Mrs Hargreaves)

It was 11:58pm on the 31st of December 1999. Jack was the only one awake.

The computer was on. It shouldn't have been on. He'd switched it off. He KNEW he'd switched it off, because he'd done the Shut Down properly and waited for the "It is now safe to turn off your computer" screen like Dad always told him.

But now the screen was glowing in the dark. And on the screen, in green letters, it said:

    THE YEAR IS 1999

Jack pressed a key. The letters changed.

    THE YEAR IS 1999
    THE YEAR IS 1999
    THE YEAR IS 1999

11:59pm. The clock in the corner of the screen ticked. The hard drive started to grind, like it was thinking very hard about something.

Midnight.

The screen went black. Then white. Then, very slowly, letters appeared again:

    THE YEAR IS 1900

Jack looked out of the window. The streetlights were gas lamps. There was a horse.

THE END

Mrs Hargreaves: "Very creepy, Jack! Lovely twist. Is the horse friendly? A-"
`);

  // ---------------------------------------------------------------- Letters
  const LE = MD + '/Letters';
  txt(LE, 'thank you letter to Gran.txt', '28/12/98', `Dear Gran,

Thank you very much for the socks. They are very warm and they are blue, which is my second favourite colour after red (red ones go faster).

I had a lovely Christmas. I got Zelda and some LEGO Technic and a COMPUTER (well, it's the family computer, but it lives in my room). I am going to make a website on it. A website is like a magazine but you can read it on the computer. When it is finished you can look at it on your computer. (You haven't got a computer. You can look at it on mine.)

Thank you also for the £5. I am going to save it for a Game Boy game.

Love from Jack xxx

P.S. Mom says to say thank you for the jumper as well. Thank you for the jumper.
`);
  txt(LE, 'letter to the games magazine.txt', '02/03/99', `Dear Editor,

I have been reading your magazine since issue 1 and I think it is the best magazine in the world. (Apart from mine, which is called JACK ATTACK! and is on the Internet, but that's a website, so it doesn't count as a rival.)

I have three questions:

1. Is there going to be a GoldenEye 2? If so, can Oddjob be banned?

2. Is it true that you can unlock Luigi in Mario 64? A boy at my school says his cousin did it. I have looked everywhere. Is his cousin lying? (I think his cousin is lying.)

3. Can you put more Robot Wars in your magazine? There is never enough Robot Wars.

Yours faithfully,
Jack

P.S. Please print this letter. Dave says you won't. Prove Dave wrong.
`);
  txt(LE, 'letter to the modem company.txt', '19/04/99', `Dear JackNet Customer Services,

I am writing to complain about my modem.

It says 56K on the box. It does not go at 56K. It goes at about 40K on a good day and 26K when it's raining. Today it went at 14.4K, which is the speed of a modem from the olden days (1994).

Also, every time my Mom picks up the phone, the Internet stops. Is there a way to make the Internet keep going when Mom is on the phone? Or a way to make Mom not be on the phone?

Please reply soon. (By post. If you email me, the modem will have to download it, and we'll be here all week.)

Yours sincerely,
Jack (age: old enough)
`);
  txt(LE, 'letter to Father Christmas 1999.txt', '24/11/99', `Dear Father Christmas,

I hope you are well and the elves are OK.

I have been mostly good this year. I'll be honest, there was the thing with the glue, and the thing with Dave's GoldenEye cartridge (it was an accident) (it was mostly an accident), but apart from that, VERY good.

Please see the attached list. (It's in my Lists folder. You're magic, you can probably read it from there.)

A quick question: are you Millennium Bug compliant? Will your sleigh still work after midnight on the 31st? I don't want you getting stuck in 1900 with all the presents. If you need a Y2K checker program I can put one on a floppy disk for you.

Love from Jack

P.S. I'm leaving out a mince pie and a carrot, as usual. And a slice of pizza for Gubbinz in case he's helping you this year.
`);
  txt(LE, 'TO BE OPENED IN THE YEAR 2000.txt', '01/01/99', '', { future: true, size: '2 KB' });
  txt(LE, 'sorry letter to Dave.txt', '15/09/99', `Dave,

Sorry I said your Pikachu was "rubbish and squeaky" in front of everyone.

It isn't rubbish. It is a bit squeaky.

Do you want to come round on Saturday? We can play Smash Bros (when it comes out) and you can be Pikachu and I won't say anything.

Your best mate,
Jack

P.S. I still have your pencil. You can have it back. (This is a big deal for me.)
`);

  // ---------------------------------------------------------------- School
  const SC = MD + '/School';
  txt(SC, 'school report (summer term).txt', '20/07/99', `END OF YEAR REPORT - SUMMER TERM 1999
Pupil: Jack                                    Form tutor: Mrs Hargreaves

ENGLISH (Mrs Hargreaves)                                       A-
  Jack writes with real imagination and energy. His science fiction stories
  are a joy to read. He must learn that not every story needs a laser in it.

MATHS (Mr Bell)                                                B+
  Jack has a quick mind and excellent mental arithmetic. His working is
  sometimes hidden underneath drawings of falling blocks. Effort: very good.

SCIENCE (Mr Okafor)                                            A
  A natural scientist! Jack asks brilliant questions. Some of them are about
  whether lasers could cut a planet in half. (They could not.)

FRENCH (Mrs Pike)                                              B
  Bon travail. Jack's vocabulary is growing. "Gubbinz" is not French.

HISTORY (Mr Fenwick)                                           B+
  Strong knowledge of the Romans. Please stop comparing them to Space Marines.

ART (Miss Lowe)                                                A
  Jack's eye for detail is remarkable. His painted models are very fine.
  He has also painted part of the art room table. Green.

${('PE (' + CN('teacher2') + ')').padEnd(63)}C+
  Jack tries hard. He seems to enjoy cross-country most when it is cancelled.

${('ICT (' + CN('teacher') + ')').padEnd(63)}A*
  Jack knows more about the school computers than I do. Please could he stop
  fixing them without asking. (Thank you for fixing them.)

FORM TUTOR'S COMMENT:
  A lovely, kind, funny member of the form. Jack is always ready to help others
  (especially with their computers). A great year. Have a restful summer, Jack,
  and maybe spend a little time outdoors. - Mrs H

ATTENDANCE: 98%   LATE: 2 (one was April Fool's Day, we know about that)
`);
  txt(SC, 'timetable.txt', '06/09/99', `TIMETABLE - AUTUMN 1999

       |  1          |  2          |  3          |  4          |  5
-------+-------------+-------------+-------------+-------------+-------------
MON    | MATHS       | MATHS       | English     | French      | PE (boo)
TUE    | Science     | Science     | History     | Maths       | Art (YES)
WED    | English     | Geography   | ICT (YES)   | Music       | RE
THU    | French      | Maths       | Science     | English     | Comp. Club!
FRI    | History     | English     | PE (boo)    | Art (YES)   | Form time

Double maths on a Monday. Whose idea was this.
`);
  txt(SC, 'detention slip (not my fault).txt', '30/06/99', `DETENTION SLIP
Pupil: Jack and Dave
Reason: Doing "the Matrix" in the corridor. Specifically, the slow-motion
        bullet dodge. Dave fell into ${CN('teacher2')}.

Time: 3:30 - 4:00, Thursday, Room 12

Jack's note: It was not my fault. I did the bullet dodge PERFECTLY. Dave
did it badly, fell over, and took out a PE teacher. I just happened to be
standing next to him. In a long black coat. Doing the same thing.
OK it was a bit my fault.
`);
  txt(SC, 'computer club notes.txt', '16/09/99', `COMPUTER CLUB - THURSDAYS - ${CN('teacher')}

THINGS WE'VE DONE:
- Made the school website have TWO pages instead of one (I did it)
- Fixed the printer (it was out of cyan, it is always out of cyan)
- Learned about the Millennium Bug. The school's computers are "probably fine".
  ${CT('{teacher} crossed {teacher.his} fingers when {teacher.he} said this.')}
- Taught Mrs Hargreaves how to double-click. (It took most of the lesson.)

IDEAS FOR NEXT WEEK:
- A school chat room (${CN('teacher')} said "absolutely not")
- A school games page (${CN('teacher')} said "absolutely not" again, but smiling)
`);

  // ---------------------------------------------------------------- Cheats
  const CH = MD + '/Cheats';
  txt(CH, 'READ ME - cheat rules.txt', '20/02/99', `JACK'S CHEAT COLLECTION - RULES

1. Only cheats I have TESTED, or that are in a proper magazine, go in the
   main files.
2. Anything a boy at school "heard from his cousin" goes in the RUMOURS file
   and gets labelled UNCONFIRMED PLAYGROUND RUMOUR.
3. Cheating is fine in single player. Cheating at Dave's is war.
`);
  txt(CH, 'N64 cheats.txt', '27/02/99', `N64 CHEATS (tested in my bedroom)
=================================

GOLDENEYE 007
  You unlock the cheat options by beating levels fast enough:
  - Paintball Mode:    beat DAM on Secret Agent in under 2:40
  - Invincibility:     beat FACILITY on 00 Agent in under 2:05
  - DK Mode (big heads, long arms): beat RUNWAY on Agent in under 5:00
  Finish all the levels on Secret Agent to unlock the bonus level AZTEC.
  Finish everything on 00 Agent (including Aztec) to unlock EGYPTIAN.
  Then you get 007 mode where you can change how good the guards are.
  (Paintball mode is the best one. The walls turn into art.)

SUPER MARIO 64
  - Get all 120 stars, then go outside and use the cannon by the moat to
    get onto the castle roof. YOSHI IS UP THERE!!! He gives you 100 lives
    and your triple jump goes sparkly. (Confirmed! Dave's cousin has 120.)

ZELDA: OCARINA OF TIME
  - Play the Sun's Song to make it day or night whenever you want.
  - Play Epona's Song in a field (when you're grown up) and your horse comes.

SUPER SMASH BROS. - see the separate file.
`);
  txt(CH, 'PC cheats.txt', '03/03/99', `PC CHEATS
=========
Type these while you're playing (just type, there's no box):

DOOM
  IDDQD       God mode (your face goes all shiny-eyed)
  IDKFA       All weapons, ammo and keys
  IDCLIP      Walk through walls (DOOM II)
  IDSPISPOPD  Walk through walls (the first DOOM - good luck spelling it)
  IDBEHOLD    Pick a power-up

DUKE NUKEM 3D
  DNKROZ      God mode
  DNSTUFF     All weapons, ammo and items

QUAKE (press the ~ key to open the console first)
  god         God mode
  noclip      Walk through walls
  impulse 9   All weapons

STARCRAFT (press Enter, type it, press Enter)
  show me the money      +10,000 minerals and gas
  power overwhelming     Invincible units
  operation cwal         Build things really fast
  black sheep wall       See the whole map
  there is no cow level  Win the mission

AGE OF EMPIRES (press Enter, type it, press Enter)
  COINAGE           +1000 gold
  WOODSTOCK         +1000 wood
  PEPPERONI PIZZA   +1000 food
  QUARRY            +1000 stone
  BIGDADDY          A sports car with a rocket launcher. In the Bronze Age.
  PHOTON MAN        A man with a laser gun. Also in the Bronze Age.

ROLLERCOASTER TYCOON
  Rename a guest to "Chris Sawyer" (the man who made the game) and he walks
  round your park taking photos. "Simon Foster" paints pictures.
`);
  txt(CH, 'PlayStation cheats (Dave tested these).txt', '20/03/99', `PLAYSTATION CHEATS (Dave has the PlayStation, Dave tested these)
=========================================================

METAL GEAR SOLID
  - The boss PSYCHO MANTIS can read your mind (and your memory card!).
    Plug your controller into PORT 2 and he can't read it anymore!
    This is the most mind-blowing thing a game has ever done.
  - Meryl's codec frequency is on the back of the CD case. (140.15)

TOMB RAIDER II
  - Level skip: light a flare, take one step forward, one step back,
    turn around three times, then jump FORWARDS.
  - All weapons: same thing, but jump BACKWARDS at the end.
  (Dave did the flare dance for twenty minutes before he got it right.
   His mom came in and asked why Lara was dancing.)
`);
  txt(CH, 'old school cheats.txt', '12/04/99', `OLD SCHOOL CHEATS (from ${CN('cousin2')}, who had a NES and a Mega Drive)

THE KONAMI CODE
  Up, Up, Down, Down, Left, Right, Left, Right, B, A (then Start)
  On CONTRA it gives you 30 lives. (${CN('cousin2')} needed every one of them.)
  (Try it on this website too. Just saying.)

SONIC THE HEDGEHOG 2
  Level select: go to the Sound Test in Options and play
  sounds 19, 65, 09, 17. Then hold A and press Start on the title screen.
`);
  txt(CH, 'Pokemon tips.txt', '12/10/99', `POKEMON RED/BLUE TIPS
=====================

- Pick SQUIRTLE. It makes Brock easy. (Bulbasaur is also OK. Charmander
  makes Brock really hard. Dave picked Charmander-- no, Dave got Red and
  picked Bulbasaur. Doesn't matter. Squirtle is best.)
- Water beats fire. Fire beats grass. Grass beats water. It's like
  rock-paper-scissors but with animals.

MISSINGNO. (REAL, BUT BE CAREFUL!!!)
  Talk to the old man in Viridian City who shows you how to catch Pokemon.
  Then fly to Cinnabar Island and surf up and down the east coast (the edge
  where land meets water). A glitchy Pokemon called MissingNo. turns up.
  Your 6th item gets multiplied to loads (128!). Rare Candies!!!
  BUT: it can mess up your Hall of Fame and make your game look funny.
  ${CN('cousin2')} says save BEFORE. I say ${CN('cousin2')} is right for once.

MEW UNDER THE TRUCK
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<<
  There's a truck next to the S.S. Anne. Everyone at school says if you use
  Strength on it, Mew is underneath. Nobody has ever done it. I tried for an
  hour. I don't think it's true. But what if it is.
`);
  txt(CH, 'Smash Bros secret characters.txt', '25/11/99', `SUPER SMASH BROS. - HOW TO UNLOCK THE SECRET CHARACTERS

LUIGI            Finish "Break the Targets" (Bonus Practice 1) with ALL 8 of
                 the starting characters. (Done it! First night!)
JIGGLYPUFF       Finish the 1-player game.
CAPTAIN FALCON   Finish the 1-player game in under 20 minutes.
NESS             Finish the 1-player game on Normal (or harder) with 3 lives,
                 WITHOUT using a continue.

When you unlock one, you have to beat them in a fight. If you lose, you can
try again next time you finish the requirement.

Dave unlocked Jigglypuff and now he plays as Jigglypuff and says "puff puff"
every time he does the Rest move. It's unbearable.
`);
  txt(CH, 'PLAYGROUND RUMOURS (unconfirmed).txt', '25/03/99', `PLAYGROUND RUMOURS
==================
EVERYTHING IN THIS FILE IS AN UNCONFIRMED PLAYGROUND RUMOUR.
Nobody has ever actually done any of these. Somebody's cousin always has.

- LUIGI IS IN MARIO 64. There's a statue in the castle garden that says
  "L is real 2401". Everyone says it means Luigi is in the game somewhere.
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<< (I've looked. A LOT.)

- THE TRIFORCE IS IN OCARINA OF TIME and you can get it if you do
  something with every item.
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<<

- ALL BONDS IN GOLDENEYE: you can play as all the old James Bonds.
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<<

- SHENG LONG in Street Fighter II: a secret master you can fight.
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<< (${CN('cousin2')} says this one was a joke
  in a magazine all along.)

- If you blow on a cartridge it works better.
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<< (but everybody does it anyway)

- A big kid at the bus stop says if you turn the N64 off and on really fast 100 times
  you get a secret menu.
  >>> UNCONFIRMED PLAYGROUND RUMOUR <<< (I got to 34 and Mom told me to
  stop because of the electricity bill)
`);

  // ---------------------------------------------------------------- My Pictures
  const PI = MD + '/My Pictures';
  A.fs.dir(PI).date = '02/01/99';
  pic(PI, 'Gubbinz.bmp', '13/02/99', 'gubbinz');
  pic(PI, "Jack's painted Ork.bmp", '24/01/99', 'ork');
  pic(PI, 'the family PC.bmp', '02/01/99', 'pc');
  pic(PI, "my rubik's cube.bmp", '17/01/99', 'rubik');
  pic(PI, 'my turtle drawing.bmp', '06/10/99', 'turtle');
  pic(PI, 'holiday photo (rain).jpg', '14/08/98', 'rain');
  pic(PI, 'school photo - grot (scanned).jpg', '09/03/99', 'school');
  pic(PI, 'eclipse 99.bmp', '11/08/99', 'eclipse');
  pic(PI, 'Dave (drawn by me).bmp', '30/01/99', 'dave');
  pic(PI, 'trukk with flames.jpg', '19/10/99', 'trukk');
  pic(PI, 'our 56K modem.bmp', '05/01/99', 'modem');
  pic(PI, 'tetris high score PROOF.jpg', '27/06/99', 'gameboy');
  pic(PI, 'christmas 98.jpg', '25/12/98', 'xmas');
  pic(PI, "Dad's snowman.jpg", '20/01/99', 'snowman');
  pic(PI, 'space shuttle.bmp', '29/05/99', 'shuttle');
  pic(PI, 'my Orks on the shelf.jpg', '27/07/99', 'shelf');
  pic(PI, 'leonids (it was cloudy).jpg', '18/11/99', 'leonids');
  pic(PI, 'halloween - jedi again.jpg', '01/11/99', 'jedi');
  pic(PI, 'SIR GRUNTALOT (robot design).bmp', '03/12/99', 'robot');
  pic(PI, "next door's cat.jpg", '11/04/99', 'cat');
  pic(PI, 'gubbinz asleep.bmp', '16/05/99', 'gubbinz_asleep');
  pic(PI, 'secret squig (DO NOT LOOK).bmp', '30/12/98', 'squig', { hidden: true, secret: 'files.hiddenpic' });

  // ---------------------------------------------------------------- loose files in My Documents
  const done = (md, what) => mdOf(md) <= today().md ? ` (DONE${what ? ' - ' + what : ''})` : '';
  txt(MD, 'website ideas.txt', '05/01/99', '', { get text() { return `JACK ATTACK! WEBSITE IDEAS
- A visitor counter${done('01-02')}
- Cheats page${done('02-27')}
- My own Tetris${done('04-17', 'Jacktris')}
- A virtual pet${done('05-15', 'Gubbinz!!!')}
- A Blobbit-flinging game${done('07-03', 'Blobbit Lob')}
- An art wall where everybody can draw${done('03-20')}
- A chat room${done('08-21')}
- A Rubik's cube that everyone shares${done('09-25', 'MegaCube')}
- A secret page that you only find if you type the right address
  (Not telling you where. Try typing words in the address bar.)
- A forum
- Make the visitor counter go up by 2 each time (no, that's cheating)
- Put loads of secrets EVERYWHERE so nobody ever finds them all (doing it)
`; } });
  txt(MD, 'issue 8 ideas.txt', '20/12/99', `ISSUE 8 IDEAS (after the Millennium)
- Donkey Kong 64 review (once I've got it... hint hint, Father Christmas)
- MGS review (Dave's copy, he's lending it to me "for one week only")
- Interview with Gubbinz
- "Did the Millennium Bug happen?" (find out on January 1st!)
- Best painted models sent in by readers (minis, Airfix, anything)
- New cheats page
`);
  txt(MD, 'shopping list (Mom).txt', '06/11/99', `SHOPPING LIST
milk
bread
beans (more)
beans (MORE)
batteries (for torch - Y2K)
candles (Y2K)
bottled water (Y2K)
tea bags
something nice for Jack's packed lunch that isn't crisps
NOT crisps

- Mom (written on the computer because Jack is ALWAYS on it, so this is
  the only place I know he'll see it. Jack: please print this out.
  Jack: the printer is out of cyan again.)
`);
  txt(MD, 'HELLO DAVE.txt', '12/02/99', `Dave,

If you are reading this, you are on my computer without asking.

Get off my computer.

- Jack

P.S. I know you're still reading. Stop it.
P.P.S. Seriously.
P.P.P.S. OK fine, the cheats are in the Cheats folder. Then get off.
`);
  // ================================================================ the locked folder
  const TOP = MD + '/TOP SECRET (KEEP OUT DAVE)';
  Object.assign(A.fs.dir(TOP), { locked: true, password: 'YELLOW', date: '31/12/98', secret: 'files.locked' });
  txt(TOP, 'README (DAVE STOP READING).txt', '31/12/98', `If you're reading this, you got the password.

Which means you're NOT Dave. (Dave can't do riddles.)

Welcome to my top secret folder. Nothing in here leaves this folder.
Not even in the playground. ESPECIALLY not in the playground.

- Jack
`);
  const stage = (md, txt2) => mdOf(md) <= today().md ? txt2 : 'not yet';
  txt(TOP, 'WORLD DOMINATION PLANS.txt', '31/12/98', '', { secret: 'files.plans', get text() { return `WORLD DOMINATION PLANS (TOP TOP SECRET)
=======================================

STAGE 1: Make a website.                                  ${stage('01-01', 'DONE')}
STAGE 2: Put a little green helper on it.                 ${stage('05-15', 'DONE (Gubbinz)')}
STAGE 3: Get loads of people visiting.                    in progress
STAGE 4: Make a REAL video game. "JACK ATTACK! THE GAME".
         It's got robots, a Rubik's cube level, a Tetris boss
         and Gubbinz as a sidekick who steals your lunch.
STAGE 5: Sell a million copies.
STAGE 6: Buy a Dreamcast. And the next PlayStation. And a house
         with a room just for LEGO.
STAGE 7: World domination. (Be nice about it though.)

SECRET CODE WORDS (for the computer):
  Type GUBBINZRULES into Start > Run. Trust me.
  Type KEEPOUTDAVE into the JackNet Explorer address bar.

If you've read this far, you are now a member of the
Gubbinz Appreciation Society. There are no other members.
`; } });
  pic(TOP, 'WARBOSS (FINISHED - DO NOT SHOW DAVE).bmp', '11/09/99', 'warboss');
  txt(TOP, 'the truth about Dave.txt', '31/12/98', `THE TRUTH ABOUT DAVE

Dave is annoying.
Dave never gives pencils back.
Dave uses Oddjob in GoldenEye.
Dave blows on cartridges even after I told him it does nothing.

Dave is also my best mate and I'd be really bored without him.

DO NOT TELL DAVE ANY OF THIS. ESPECIALLY THE LAST BIT.
`);
  txt(TOP, 'what I would do with a million pounds.txt', '19/03/99', `WHAT I WOULD DO WITH A MILLION POUNDS

1. Every game. Ever. Even the bad ones (for reviews).
2. A Pentium III. 500MHz. 128MB of RAM.
3. A second phone line JUST for the Internet so Mom can ring ${CN('auntie')}
   whenever she likes.
4. Every LEGO set. Ever.
5. A trip to space. Do they let kids go to space? Find out.
6. A new car for Mom and Dad (a red one, so it goes faster)
7. Give some to Dave. Not a lot. Like a hundred quid.
8. Donate some to the RSPCA because next door's cat is nice
9. A massive TV for Robot Wars
10. Put the rest in the bank for when I'm old (2050)
`);
  txt(TOP, 'my REAL rubiks plan.txt', '01/05/99', `SECRET RUBIK'S PLAN

Step 1: Get under 1 minute.
Step 2: Turn up at school with the cube scrambled.
Step 3: Say "oh, this old thing?"
Step 4: Solve it in front of everyone.
Step 5: Walk away. Don't look back. Like in a film when something explodes.
`);

  // ================================================================ C:\ (the root)
  const C = 'C:';
  txt(C, 'AUTOEXEC.BAT', '10/12/98', `@ECHO OFF
REM *** JackOS 98 AUTOEXEC.BAT ***
REM Don't touch this file. Dad said. - Jack
SET PATH=C:\\JACKOS;C:\\JACKOS\\COMMAND;C:\\GAMES
SET TEMP=C:\\JACKOS\\TEMP
SET BLASTER=A220 I5 D1 H5 P330 T6
LH C:\\JACKOS\\COMMAND\\MSCDEX.EXE /D:JACKCD01
LH C:\\JACKOS\\MOUSE.COM
REM LH C:\\GUBBINZ\\FEED.EXE /PIZZA:MANY
ECHO Loading JackOS...
ECHO Remember to feed Gubbinz!
`);
  txt(C, 'CONFIG.SYS', '10/12/98', `DEVICE=C:\\JACKOS\\HIMEM.SYS
DEVICE=C:\\JACKOS\\EMM386.EXE NOEMS
DOS=HIGH,UMB
FILES=40
BUFFERS=30
DEVICEHIGH=C:\\JACKOS\\COMMAND\\CDROM.SYS /D:JACKCD01
DEVICEHIGH=C:\\JACKOS\\SYSTEM\\GUBBINZ.VXD /EARS:FLAPPY
REM DEVICE=C:\\JACKOS\\MOM.SYS /BEDTIME:8PM   <- disabled by Jack
REM ^ re-enabled by Mom
DEVICE=C:\\JACKOS\\MOM.SYS /BEDTIME:8PM
`);
  txt(C, 'HOMEWORK.DOC', '30/12/98', '', { secret: 'files.homeworkdoc' });
  txt(C, 'SCANDISK.LOG', '29/12/98', `Microsoft ScanDisk-style log (JackOS edition)
Drive C: checked on 29/12/98

ScanDisk found and fixed problems on drive C.
  - 1 lost cluster found in 1 chain. Saved as FILE0000.CHK.
    (It was half a drawing of an X-wing. Dave switched the PC off at the wall.)
  - Surface scan: no bad sectors. One slightly grumpy sector.

Reason for ScanDisk: JackOS was not shut down properly.
Note to Dave: USE START > SHUT DOWN. NOT THE BUTTON. NOT THE WALL.
`);
  txt(C, 'MSDOS.SYS', '10/12/98', `[Paths]
WinDir=C:\\JACKOS
WinBootDir=C:\\JACKOS
HostWinBootDrv=C

[Options]
BootMulti=1
BootGUI=1
Logo=1
;The following lines are required for compatibility with other programs.
;Do not remove them (MSDOS.SYS needs to be >1024 bytes).
;xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
;xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
;(Jack's note: yes, this file is literally padded with x's. Computers are weird.)
`, { hidden: true });
  exe(C, 'COMMAND.COM', '10/12/98', '93 KB', { app: 'dos.run' });
  exe(C, 'GUBBINZ.EXE', '15/05/99', '1.4 MB', { app: 'files.run', arg: 'go:grot' });
  exe(C, 'JACKTRIS.EXE', '17/04/99', '212 KB', { app: 'files.run', arg: 'go:demos' });
  // ---- C:\JACKATAK (the website files)
  const JA = 'C:/JACKATAK';
  A.fs.dir(JA).date = '30/12/98';
  txt(JA, 'index.htm', '01/01/99', `<HTML>
<HEAD><TITLE>JACK ATTACK! Online</TITLE></HEAD>
<BODY BGCOLOR="#000000" TEXT="#FFFF00">
<CENTER>
<H1>WELCOME TO JACK ATTACK!!!</H1>
<MARQUEE>The games mag wot Jack made!!! Updated EVERY DAY!!!</MARQUEE>
<IMG SRC="under_construction.gif">
<P>You are visitor number <!-- counter goes here -->
<P>Best viewed at 800x600 in JackNet Explorer
<P><A HREF="cheats.htm">CHEATS</A> | <A HREF="hobby.htm">HOBBY</A> | <A HREF="gubbinz.htm">GUBBINZ</A>
<!-- Dave if you're reading the source code GET OFF MY WEBSITE -->
</CENTER>
</BODY>
</HTML>
`);
  txt(JA, 'cheats.htm', '27/02/99', `<HTML><BODY BGCOLOR="#000080" TEXT="#FFFFFF">
<H1>CHEATS!!!</H1>
<P>All tested in my bedroom. See the Cheats page on the real site.
<!-- secret: there are codes for THIS website too. Try typing IDDQD in the cheat box. -->
</BODY></HTML>
`);
  txt(JA, 'CLOCK.DLL', '01/01/99', `CLOCK.DLL - JACK ATTACK! Millennium countdown module
Version 1.999

if (year == 99) { year = 19 + "" + year; }   // "1999"
if (year == 100) { year = 19 + "" + year; }  // "19100" ... uh oh

TODO: fix this before New Year's Eve.
TODO: (from 31/12) didn't fix it. We'll see what happens.
`);
  txt(JA, 'counter.txt', '02/01/99', `000027\n\n(Not the real number. The real number is on the website. This is a backup in case the Internet breaks.)\n`);
  txt(JA, 'todo.txt', '03/01/99', `WEBSITE TODO
- Spellcheck everything (Mom found "recieve" 6 times)
- Make the logo bigger
- Make the logo EVEN BIGGER
- Add more N64 stuff
- Stop adding <BLINK> to everything (Mrs Hargreaves says it gives her a headache)
`);
  // ---- C:\GAMES
  const GA = 'C:/GAMES';
  A.fs.dir(GA).date = '28/12/98';
  txt(GA, 'readme.txt', '28/12/98', `C:\\GAMES\n\nOld DOS games live here. Dad's from before JackOS.\nIf a game doesn't work, try typing the name into MS-DOS mode. If that doesn't work, it's broken. If it's broken, it was Dave.\n`);
  txt(GA + '/SAVES', 'GOLDENEYE times.txt', '14/03/99', `GOLDENEYE 007 - MY BEST TIMES (Agent)\n\nDam          1:58\nFacility     1:46\nRunway       0:39  (just get on the plane!)\nSurface 1    2:33\nBunker 1     1:12\nSilo         3:44\nFrigate      1:51\nSurface 2    2:20\nBunker 2     1:55\nStatue       3:10\nArchives     1:20\nStreets      2:01\nDepot        0:56\nTrain        2:44\nJungle       1:49\nControl      5:58  (Natalya. Why.)\nCaverns      2:30\nCradle       1:01\nAztec        5:12  (Jaws!!!)\nEgyptian     not unlocked yet\n`);
  txt(GA + '/SAVES', 'worms team names.txt', '30/01/99', `WORMS TEAMS\n\nTeam JACK:  Pikachu, Boba, Sir Killalot, Dave\nTeam DAVE:  Jack, Jack's Mom, Jack's Mom's Cat (we don't have a cat), Ian\nDAVE: who is Ian\nDAVE: "nobody knows who Ian is"\n`);
  txt(GA, 'DOOM.TXT', '28/12/98', `DOOM - Dad's copy, on 4 floppies.\nType IDDQD for god mode. (Don't tell Dad I told you.)\nDad's best: E1M1 in 47 seconds. He brings this up at Christmas.\n`);

  // ================================================================ C:\Program Files
  const PF = 'C:/Program Files';
  A.fs.dir(PF).date = '10/12/98';
  const prog = (dir, date, exes, readme) => { const p = PF + '/' + dir; A.fs.dir(p).date = date; exes.forEach(([n, size, arg]) => exe(p, n, date, size, { app: 'files.run', arg })); if (readme) txt(p, 'readme.txt', date, readme); return p; };
  prog('Accessories', '10/12/98', [['NOTEPAD.EXE', '52 KB', 'app:notepad'], ['MSPAINT.EXE', '343 KB', 'app:paint|mspaint|pbrush'], ['CALC.EXE', '93 KB', 'app:calc|calculator'], ['WORDPAD.EXE', '205 KB', 'wordpad'], ['SNDREC32.EXE', '89 KB', 'app:sndrec|soundrec']], `ACCESSORIES\n===========\nLittle programs that come free with JackOS.\n\nNOTEPAD   - for writing things. The best program ever made.\nPAINT     - for drawing things. Pixel by pixel. Like a Game Boy would.\nCALCULATOR - for maths homework. (It's not cheating, it's a tool.)\nWORDPAD   - like Notepad but it wants you to pick a font.\n`);
  prog('JackNet Explorer', '10/12/98', [['IEXPLORE.EXE', '1.1 MB', 'browser']], `JACKNET EXPLORER 5\n==================\nThe best way to see the World Wide Web.\n\nSYSTEM REQUIREMENTS: a computer, a modem, a phone line, and nobody\nneeding to use the phone for the next two hours.\n\nKNOWN ISSUES:\n- Toolbars sometimes install themselves. We don't know why. We're sorry.\n- If Mom picks up the phone, the Internet will stop. This is not a bug.\n  This is Mom.\n`);
  prog('Outlook Express', '10/12/98', [['MSIMN.EXE', '58 KB', 'app:outlook']], `OUTLOOK EXPRESS\n===============\nSend and receive e-mail! Over the INTERNET!\n\nTIP: Your account is the FAMILY account. Please don't sign up for\nnewsletters with it. (This means you, Jack. - Mom)\n`);
  prog('JackTris', '17/04/99', [['JACKTRIS.EXE', '212 KB', 'go:demos']], `JACKTRIS v1.0\n=============\nBy Jack. My own Tetris. Made from scratch.\n\nCONTROLS: Left/Right to move, Up to turn, Down to drop faster.\nMUSIC: the old Russian folk song (Korobeiniki). It's public domain,\nwhich means nobody owns it, which means everybody owns it.\n\nHIGH SCORE TO BEAT: mine.\n\nKNOWN BUG: none. (There was one with the wall. It's fixed. I think.)\n`);
  txt(PF + '/JackTris', 'HISCORE.DAT', '17/04/99', `JACK  41000\nJACK  38200\nJACK  35900\nJACK  30300\nGRAN    450   <- Gran had a go at Christmas\nDAVE   3200\n`);
  prog('Blobbit Lob', '03/07/99', [['SQUIGLOB.EXE', '187 KB', 'go:demos']], `BLOBBIT LOB\n===========\nPull back the catapult. Let go. WATCH THE BLOBBIT FLY.\n\nPHYSICS ENGINE: "add a bit to the speed going down, every frame".\nMr Okafor says this is "a simplification". It works though.\n\nNo Blobbits were harmed in the making of this game. They LIKE it.\n(The folder still says Squig Lob. That was its name in the first draft.)\n`);
  prog('Gubbinz', '15/05/99', [['GUBBINZ.EXE', '1.4 MB', 'go:grot']], `GUBBINZ - THE VIRTUAL PET\n=========================\nThere is only ONE Gubbinz and EVERYBODY shares him.\n\nFeed him. Pet him. Do NOT let him near the pizza unsupervised.\n\nSystem requirements: a heart.\n`);
  txt(PF + '/Gubbinz', 'GUBBINZ.INI', '15/05/99', `[Gubbinz]\nEars=flappy\nHunger=always\nFavouriteFood=pizza\nSecondFavouriteFood=more pizza\nBedtime=never\nCanBeTrustedWithPizza=0\n`);
  prog('Cube Timer 2.0', '20/04/99', [['CUBETIME.EXE', '64 KB', 'cubetime']], `CUBE TIMER 2.0\n==============\nTimes your Rubik's cube solves. Press SPACE to start, SPACE to stop.\n\nVersion 1.0 used the oven clock. Version 2.0 uses the computer clock,\nwhich is more accurate and doesn't need Dad to be in the kitchen.\n`);
  prog('Ork Painter 98', '03/02/99', [['ORKPAINT.EXE', '410 KB', 'orkpaint']], `MINI PAINTER 98\n===============\nPaint your models on the computer before you paint them for real!\n\nCOLOURS AVAILABLE: Red.\n\nWhy only red? Because red ones go faster. We tried adding other\ncolours but they kept going red on their own.\n`);
  prog('Y2K Checker', '01/11/99', [['Y2KCHECK.EXE', '96 KB', 'y2k']], `Y2K CHECKER 1.0\n===============\nIs your computer ready for the Year 2000?\nRun Y2KCHECK.EXE to find out!\n\nThis program checks:\n- Your BIOS clock\n- Your programs\n- Your video recorder (please hold it up to the screen)\n- Your nerves\n\nDISCLAIMER: If the world ends on 01/01/2000, we can't give you a refund.\n`);
  prog('JackNet Anti-Virus 99', '27/03/99', [['AV99.EXE', '780 KB', 'av']], `JACKNET ANTI-VIRUS 99\n=====================\nProtecting your computer from: viruses, worms, Trojans, and gremlins in hats.\n\nVirus definitions last updated: 27/03/99 (the day after Melissa,\nwhen Dad panicked and bought this).\n\nREMEMBER: Never open attachments from people you don't know.\nAlso never open attachments from people you DO know, if they say\n"Important Message From" in the subject. That's how Melissa got ${CN('cousin2')}.\n`);
  txt(PF + '/JackNet Anti-Virus 99', 'VIRUSDEF.DAT', '27/03/99', `KNOWN VIRUSES (14,203)\n...\nW97M.Melissa    - e-mail worm. Sends itself to 50 people. Rude.\nW95.CIH         - "Chernobyl". Goes off on 26 April. Very bad.\nGROTTY.EXE      - not a real virus. It's a gremlin in a hat.\nDAVE.COM        - borrows things and never gives them back.\n`);
  prog('ModemMeter', '06/01/99', [['MODEMMTR.EXE', '41 KB', 'modem']], `MODEMMETER\n==========\nShows how fast your modem is REALLY going.\n\nSpoiler: not 56K. It's never 56K. 56K is a lie told by boxes.\n`);
  prog('WinJack', '12/02/99', [['WINJACK.EXE', '320 KB', 'wingrot']], `WINJACK - THE ARCHIVE UTILITY FOR EVERYONE\n==========================================\nSquash your files down small! Unsquash them again!\n\nThis is SHAREWARE. You may use it for 30 days. After that, please\nregister by sending 10 Rupees to the address below.\n(Nobody has ever registered. Everybody just clicks "I Agree" forever.)\n`);
  prog('Plus! for JackOS', '25/12/98', [['THEMES.EXE', '1.9 MB', 'themes']], `PLUS! FOR JACKOS\n================\nDesktop Themes! Screen savers! A pinball game (coming soon)!\n\nTHEMES INCLUDED:\n- Star Cruiser (silver and blue, very loud)\n- Space (black with stars, very quiet)\n- 1999 (beige)\n- Inside Your Computer (also beige)\n`);
  prog('Online Services', '10/12/98', [['SIGNUP.EXE', '15 KB', 'app:online>signup']], `ONLINE SERVICES\n===============\nSign up for an Internet service today! Get 50 FREE HOURS!*\n\n*Free hours must be used in your first month. Phone calls charged at\nlocal rate. Mom will see the phone bill. Mom WILL see the phone bill.\n`);
  prog('Games', '10/12/98', [['SOL.EXE', '56 KB', 'app:solitaire|sol'], ['WINMINE.EXE', '23 KB', 'app:minesweeper|winmine|mines'], ['FREECELL.EXE', '33 KB', 'app:freecell'], ['PINBALL.EXE', '700 KB', 'app:pinball']], `GAMES\n=====\nThe games that come with JackOS. Dad plays Solitaire. Mom plays\nSolitaire. Gran played Solitaire once and asked where the cards went.\n`);
  A.fs.dir(PF + '/Uninstall Information').hidden = true;
  txt(PF + '/Uninstall Information', 'uninst.log', '12/02/99', `Uninstall log\n\n12/02/99  Uninstalled: "SUPER COOL SCREENSAVER 3000" (it was a toaster with wings, Dad said no)\n04/05/99  Uninstalled: "FREE Smileys!!!" (it came back)\n05/05/99  Uninstalled: "FREE Smileys!!!" (it came back AGAIN)\n06/05/99  Gave up.\n`, { hidden: true });

  // ================================================================ C:\JACKOS
  const W = 'C:/JACKOS';
  A.fs.dir(W).date = '10/12/98';
  txt(W, 'README.TXT', '10/12/98', `WELCOME TO JACKOS 98
====================
Thank you for choosing JackOS 98! (You didn't choose it. It came with the computer.)

WHAT'S NEW:
- The Start button! (It's also how you shut down. Don't ask.)
- The Internet is now built into EVERYTHING.
- Over 200 new ways to change your desktop colour.
- Support for "Universal Serial Bus" (USB). We have no USB things. Nobody has
  any USB things. But we support them.

Please do not delete any files in this folder. Especially MOM.SYS.
`);
  txt(W, 'JACKOS.INI', '10/12/98', `[windows]
load=
run=GUBBINZ.EXE
NullPort=None
device=Inkjet Printer (Out of Cyan),WINSPOOL,LPT1:

[Desktop]
Wallpaper=(None)
TileWallpaper=0
Pattern=Teal (it's always teal)

[intl]
sCountry=United Kingdom
iDate=1
sShortDate=dd/MM/yy
sCurrency=£

[Sounds]
SystemStart=JackOS Start.wav
SystemExit=JackOS Shutdown.wav
PizzaEaten=boing.wav
`);
  txt(W, 'SYSTEM.INI', '10/12/98', `[boot]
shell=Explorer.exe
system.drv=system.drv
mouse.drv=mouse.drv
network.drv=dialup.drv
helper.drv=gubbinz.drv

[386Enh]
woafont=dosapp.fon
EGA80WOA.FON=EGA80WOA.FON
GubbinzEars=FLAPPY
MaxPizza=unlimited

[Mom]
Bedtime=20:00
Weekends=21:00
Holidays=21:30 (if you've been good)
`);
  txt(W, 'Y2K.BUG', '01/01/99', `                    _   _
                   (o)-(o)
          ____     /     \\     ____
         /    \\___|  Y2K  |___/    \\
                   \\_____/
                  //  | |  \\\\
                 //   | |   \\\\

Y2K.BUG
-------
Species: Millennius Buggus
Habitat: inside computers, video recorders, card machines in shops
Diet: two-digit years
Wakes up: midnight, 31/12/1999
Danger level: UNKNOWN (that's what makes it scary)

Behaviour: when the year goes from 99 to 00, the bug thinks it's 1900.
Your computer will then:
  [ ] explode
  [ ] think it's the Victorian times
  [X] probably be fine (Jack's Y2K checker says COMPLIANT)

HOW TO PREPARE (according to Mom):
  - 40 tins of beans
  - 2 torches (Dad bought a second one)
  - fill the bath
  - candles
  - don't panic (Mom is panicking)

THIS FILE IS A BUG. DO NOT FEED AFTER MIDNIGHT.
`, { secret: 'files.y2kbug' });
  txt(W, 'SQUIG.DLL', '15/05/99', `SQUIG.DLL - Super QUick Interface Graphics library v2.1

Exports:
  BounceBlobbit()       - makes the Blobbit bounce
  BounceBlobbitHigher() - makes the Blobbit bounce higher
  FeedBlobbit()         - DO NOT CALL (the Blobbit will eat the function)
  ChompyMode()          - enables the BIG Blobbit. Use with caution.

Error 0x5Q16: Blobbit has escaped from DLL. Please check the bathroom.
`);
  txt(W, 'MOM.SYS', '10/12/98', `MOM.SYS - Maternal Operating Manager, version 1.0
==================================================

This system file cannot be deleted, moved, renamed or argued with.

LOADED SERVICES:
  [RUNNING] Bedtime enforcement (20:00, 21:00 at weekends)
  [RUNNING] "Have you done your homework?" (polls every 15 minutes)
  [RUNNING] Phone line arbitration (Mom wins)
  [RUNNING] Dinner's ready notifier (warning: only shouts once)
  [RUNNING] Room tidiness monitor (status: CRITICAL)
  [RUNNING] Hugs (unlimited)

KNOWN ISSUES:
  - Picks up the phone when a download is at 99%.
  - Can see through closed doors.
  - Knows when you've been on the computer even if you switch it off
    before she gets upstairs. (The monitor is still warm. She checks.)

DO NOT ATTEMPT TO DISABLE. (Jack tried in CONFIG.SYS. See CONFIG.SYS.)
`);
  txt(W, 'WAAAGH.DRV', '23/01/99', `WAAAGH.DRV - Loud Noises Driver

Supports: WAAAGH!, COWABUNGA!, HADOUKEN!!!
Volume: LOUD. There is no other setting.
Sample rate: 44,100 shouts per second

This driver makes everything louder, brighter and faster (if red).
`);
  txt(W, 'MODEM.INF', '10/12/98', `; MODEM.INF - JackNet 56K Voice/Fax/Data/Screech Modem

[Version]
Signature="$JackOS$"
Class=Modem

[Strings]
Modem1="JackNet 56K Modem (actually about 44K)"
Init="AT&F E0 V1 S0=0 &C1 &D2 +MS=V90"
Speaker="ON. ALWAYS ON. EVERYONE IN THE HOUSE WILL HEAR IT."
ConnectSound="BEEEEEEE-DOOOO-KSSSSHHHHHHH-DINGDINGDING-KSSSSH"

[Known Issues]
1="Disconnects when phone is picked up downstairs"
2="Disconnects when phone is picked up upstairs"
3="Disconnects when someone THINKS about the phone"
`);
  txt(W, 'HIMEM.SYS', '10/12/98', `HIMEM.SYS\n\nHi, Mem!\n\n(This file manages the "high memory". All 64MB of it. It's very important and very boring.)\n`);
  txt(W, 'SPOON.SYS', '11/06/99', `There is no SPOON.SYS.\n`);
  txt(W, 'BEANS.DAT', '02/11/99', `Y2K EMERGENCY SUPPLIES - managed by MOM.SYS\n\nBaked beans:        40 tins\nBaked beans (more): 12 tins\nSpaghetti hoops:     6 tins (Jack's request)\nCandles:            24\nTorches:             2 (Dad's second torch is "the backup torch")\nBath:               to be filled at 23:00 on 31/12\n`);
  txt(W, 'VIDEO.SYS', '10/12/98', `VIDEO.SYS - Video Recorder Clock Driver\n\nCurrent time: 12:00\nCurrent time: 12:00\nCurrent time: 12:00\n\n(It has said 12:00 since 1996. Nobody knows how to change it. Nobody will ever know.)\n`);
  txt(W, 'RUPEES.DLL', '05/01/99', `RUPEES.DLL - Gem Currency Library\n\nExchange rates:\n  1 Rupee = 1 Rupee\n  10 Rupees = a squig pie\n  100 Rupees = a second-hand trukk (no brakes)\n  1,000 Rupees = a Gargant (not really)\n\nDave owes Jack: 4 Rupees.\n`);
  txt(W, 'TIPS.TXT', '10/12/98', `JACKOS TIPS
===========
- Double-click things to open them. (Or right-click and pick Open.)
- Right-click a file to see its Properties.
- In Explorer, View > Show hidden files shows files that are hiding. Some files are shy.
- Start > Run lets you type commands. Some commands are secret.
- Press F5 in Notepad to put the date in. It's always 1999.
- If the computer crashes, it's probably Gubbinz.
`);
  txt(W, 'SETUP.LOG', '10/12/98', `JackOS Setup log - 10/12/98\n\nCopying files... OK\nDetecting hardware... OK\nDetecting helper... FOUND (GUBBINZ.VXD)\nDetecting Mom... FOUND (MOM.SYS) - cannot be skipped\nSetup complete. Please restart your computer.\nPlease restart your computer.\nPLEASE restart your computer.\n`);
  exe(W, 'EXPLORER.EXE', '10/12/98', '204 KB', { app: 'files.run', arg: 'app:explorer' });
  exe(W, 'NOTEPAD.EXE', '10/12/98', '52 KB', { app: 'files.run', arg: 'app:notepad' });
  exe(W, 'REGEDIT.EXE', '10/12/98', '120 KB', { app: 'files.run', arg: 'app:regedit>regedit' });
  exe(W, 'SCANDSKW.EXE', '10/12/98', '180 KB', { app: 'files.run', arg: 'app:scandisk>scandisk' });
  exe(W, 'DEFRAG.EXE', '10/12/98', '230 KB', { app: 'files.run', arg: 'app:defrag>defrag' });
  const WS = W + '/SYSTEM';
  A.fs.dir(WS).date = '10/12/98';
  txt(WS, 'GUBBINZ.VXD', '15/05/99', `GUBBINZ.VXD - Virtual Gubbinz Device Driver
===========================================

This driver lets JackOS talk to Gubbinz. Gubbinz does not listen.

FUNCTIONS:
  VGD_FlapEars      - flap ears (left, right, or both)
  VGD_Eat           - eat whatever is nearest (WARNING: may include drivers)
  VGD_Hide          - hide in the Recycle Bin
  VGD_Crash         - "A fatal exception 0E has occurred in VXD GUBBINZ(01)"

If JackNet Anti-Virus finds this file and says it's a virus, it isn't.
It's a Gubbinz in a hat.
`);
  txt(WS, 'VMM32.VXD', '10/12/98', `VMM32.VXD - Virtual Machine Manager\n\nThis file is so important that if you delete it, nothing works.\nNot even the Start button. Not even the clock.\nPlease do not delete it. (Dave.)\n`);
  txt(WS, 'MOUSE.DRV', '10/12/98', `MOUSE.DRV\n\nSupports: 2-button mice, 3-button mice, and the ball-type mouse that needs\nits ball taking out and cleaning every week because it's full of fluff.\n\nTip: if the pointer jumps around, clean the ball. If it still jumps, it's\nthe cat. (We don't have a cat. Investigate.)\n`);
  txt(WS, 'SHELL32.DLL', '10/12/98', `SHELL32.DLL - contains every icon on the computer.\n\nAll 238 of them. One of them is a picture of a little torch.\nJack has looked for it for ages. It's in here somewhere.\n`);
  exe(WS, 'KRNL386.EXE', '10/12/98', '75 KB', { app: 'files.run', arg: 'kernel' });
  txt(WS, 'DAKKA.DRV', '23/01/99', `DAKKA.DRV - More Turbo driver (the turbo button finally does something)\n\nSetting: MORE\nMaximum setting: MORE\nMinimum setting: MORE\n`);
  txt(WS, 'HAMSTER.SYS', '10/12/98', `HAMSTER.SYS\n\nThis is the hamster that runs in a wheel inside the computer to make it go.\nCurrent speed: 350MHz (the hamster is very fit).\nFeed it: Thursdays.\n`);
  // ---- C:\JACKOS\Temp (hidden)
  const TMP = W + '/Temp';
  Object.assign(A.fs.dir(TMP), { hidden: true, date: '10/12/98', secret: 'files.temp' });
  [['~DF1999.TMP', '14/03/99', 'ÿØÿà JFIF ...... ÿÛ C ......\n(this is the start of a picture that never finished downloading)\n'],
   ['~WRL0001.TMP', '22/01/99', 'What I want to be when I grow up\nWhen I grow up I want to be a\nWhen I grow up I want to\nWhen I grow up\n(autosave from the English homework, 14 attempts)'],
   ['~GRT0042.TMP', '16/05/99', 'crumbs\ncrumbs\npizza crumbs\na tiny LEGO helmet\nmore crumbs\n(Gubbinz has been in here.)\n'],
   ['install_leftovers.tmp', '25/12/98', 'SETUP WAS HERE\n(pieces of 14 different installers that never cleaned up after themselves)\n'],
   ['download_99percent.tmp', '01/06/99', '[ 99% of a song by a band ' + CN('cousin2') + ' likes ]\n\nThe last 1% will never arrive.\nMom picked up the phone.\n'],
   ['CRASH.DMP', '26/04/99', 'Memory dump at the moment the computer froze:\n\n0000: 48 41 44 4F 55 4B 45 4E   HADOUKEN\n0008: 50 49 5A 5A 41 00 00 00   PIZZA...\n0010: 47 55 42 42 49 4E 5A 00   GUBBINZ.\n\nCause of crash: Gubbinz.\n'],
   ['dave_was_here.tmp', '20/02/99', 'DAVE WAS HERE\nDAVE WAS HERE\nDAVE WAS HERE\n\nJack: how did you even get in here\n'],
   ['~TMP4B2.TMP', '10/12/98', '\n\n\n'],
  ].forEach(([n, d, t]) => txt(TMP, n, d, t, { hidden: true }));
  txt(TMP, 'is anyone there.txt', '28/12/98', `Hello?

Is anyone reading the temp files?

Nobody reads the temp files. That's why I'm hiding this here.

I'm the computer. Hi. I'm a Pentium II, 350MHz, 64MB of RAM, and I live in
Jack's bedroom. It's quite nice in here. It's warm because of me.

Some things I've seen:
- Jack painting miniatures at 2am under the desk with a torch.
- Dave trying to guess the password to the secret folder 41 times.
  (He guessed "DAVE" 17 times. Dave, it's not "DAVE".)
- Mom checking if my monitor is still warm. It always is.

Anyway. Don't tell anyone I can type.

- The Computer
`, { hidden: true, secret: 'files.tempnote' });
  // ---- C:\JACKOS\Favorites (Internet shortcuts to Jack's site)
  const FAV = W + '/Favorites';
  A.fs.dir(FAV).date = '01/01/99';
  lnk(FAV, "Jack's Home.url", 'home', '01/01/99'); lnk(FAV, 'Games Arcade.url', 'demos', '17/04/99'); lnk(FAV, 'Cheats.url', 'cheats', '27/02/99');
  lnk(FAV, 'Hobby Corner.url', 'orks', '23/01/99'); lnk(FAV, 'Gubbinz Pet.url', 'grot', '15/05/99'); lnk(FAV, 'Letters.url', 'letters', '02/01/99');
  lnk(FAV, 'Art Wall.url', 'art', '20/03/99'); lnk(FAV, 'Chat Room.url', 'chat', '21/08/99'); lnk(FAV, 'Reviews.url', 'reviews', '05/10/99'); lnk(FAV, 'Screensaver.url', 'saver', '11/06/99');
  // ---- C:\JACKOS\Media (sounds you can play)
  const MED = W + '/Media';
  A.fs.dir(MED).date = '10/12/98';
  wav(MED, 'tada.wav', 'solve'); wav(MED, 'ding.wav', 'beep', null, '11 KB'); wav(MED, 'chord.wav', 'uhoh', null, '25 KB'); wav(MED, 'chimes.wav', 'join', null, '55 KB');
  wav(MED, 'JackOS Start.wav', 'startup', null, '171 KB'); wav(MED, 'JackOS Shutdown.wav', 'shutdown', null, '141 KB'); wav(MED, 'boing.wav', 'boing', null, '8 KB');
  wav(MED, 'modem connecting.wav', 'modem', '06/01/99', '402 KB'); wav(MED, 'WAAAGH.wav', 'waaagh', '23/01/99', '88 KB'); wav(MED, 'dice.wav', 'dice', '23/01/99', '9 KB');
  put(MED, { name: 'jack_theme.mid', type: 'wav', music: 'theme', date: '01/01/99', size: '6 KB' });
  put(MED, { name: 'korobeiniki.mid', type: 'wav', music: 'tris', date: '17/04/99', size: '4 KB' });
  // ---- C:\JACKOS\Cookies
  txt(W + '/Cookies', 'jack@jacknet.txt', '03/01/99', `COOKIES\n\nThese are not real cookies. They're tiny files that websites leave on your computer.\n\nMom read the word "Cookies" over my shoulder and got very excited.\nThen very disappointed.\n`);

  // ================================================================ drives A: and D: (not part of C:)
  const mkdrive = (name, label) => ({ name, label, type: 'dir', kids: [], drive: true });
  const FLOPPY = mkdrive('A:', "DAVE'S DISK");
  const CDROM = mkdrive('D:', 'JACKATTACK7');
  const dput = (root, path, node) => { let n = root; for (const p of path.split('/').filter(Boolean)) { let k = n.kids.find(x => x.name === p); if (!k) { k = { name: p, type: 'dir', kids: [], date: node.date }; n.kids.push(k); } n = k; } n.kids.push(node); return node; };
  dput(FLOPPY, '', { name: 'README.TXT', type: 'txt', date: '18/03/99', text: `JACK\n\nTHIS DISK HAS THE THING ON IT.\n\nGIVE IT BACK BY FRIDAY.\n\n- DAVE\n\n(the thing is my homework. well, YOUR homework. that I copied. its fine, I changed some words)\n` });
  dput(FLOPPY, '', { name: 'HOMEWRK.TXT', type: 'txt', date: '18/03/99', text: `WHAT I WANT TO BE WHEN I GROW UP\nby Dave\n\nWhen I grow up I want to make video games. There are other things I would also like to be, and I will lsit them later in case the first one doesnt work out, but games is the main one.\n\nI want to make games because games are the only kind of story where YOU are the one who does things, and you can be Oddjob.\n\nI have allready made zero games. But I have played loads.\n\nOTHER THINGS I WOULD LIKE TO BE:\n- A footballer\n- An astronaut (Jack said it first but I said it louder)\n- Rich\n\nTHE END\n\n(Mrs Hargreaves's comment: "Dave, this seems VERY familiar. See me.")\n` });
  dput(FLOPPY, '', { name: 'DAVEPNT.BMP', type: 'img', art: 'dave_paint', date: '18/03/99' });
  dput(FLOPPY, '', { name: 'GOLDNEYE.TXT', type: 'txt', date: '18/03/99', text: `DAVE'S GOLDENEYE TIPS\n\n1. pick oddjob\n2. hes small so nobody can hit him\n3. pick oddjob again\n4. if jack says oddjob is banned, pick oddjob anyway\n5. slappers only mode is rubbish because i lose\n` });
  dput(FLOPPY, '', { name: 'SECRET.TXT', type: 'txt', date: '18/03/99', text: `THERE IS NO SECRET.\n\nMADE YOU LOOK.\n\n- DAVE\n` });
  dput(FLOPPY, '', { name: 'DAVE.BAS', type: 'txt', date: '18/03/99', text: `10 PRINT "DAVE IS ACE"\n20 GOTO 10\n\nREM my first program. it runs forever. thats how good it is\n` });
  dput(CDROM, '', { name: 'AUTORUN.INF', type: 'txt', date: '01/01/99', text: `[autorun]\nopen=SETUP.EXE\nicon=JACK.ICO\nlabel=JACK ATTACK! COVER DISC #7\n` });
  dput(CDROM, '', { name: 'README.TXT', type: 'txt', date: '01/01/99', text: `JACK ATTACK! COVER DISC #7\n==========================\n\nTHANK YOU for buying* JACK ATTACK!\n(*it's free. It's a website. I burned this CD at ${CN('cousin2')}'s because he has a CD writer.)\n\nON THIS DISC:\n  DEMOS\\     - Jacktris and Blobbit Lob (they open on the website)\n  EXTRAS\\    - a wallpaper and the screensaver\n  DRIVERS\\   - a modem driver. Do NOT install it.\n  VIDEOS\\    - the intro video (needs a codec you haven't got)\n\nIF THE DISC DOESN'T WORK: take it out, blow on it, put it back in.\n(Blowing doesn't help. Everybody does it anyway.)\n` });
  dput(CDROM, '', { name: 'SETUP.EXE', type: 'exe', app: 'files.run', arg: 'setup', date: '01/01/99', size: '1.2 MB' });
  dput(CDROM, 'DEMOS', { name: 'Jacktris Demo.url', type: 'lnk', go: 'demos', date: '01/01/99', size: '1 KB' });
  dput(CDROM, 'DEMOS', { name: 'Blobbit Lob Demo.url', type: 'lnk', go: 'demos', date: '01/01/99', size: '1 KB' });
  dput(CDROM, 'DEMOS', { name: 'Meet Gubbinz.url', type: 'lnk', go: 'grot', date: '01/01/99', size: '1 KB' });
  dput(CDROM, 'EXTRAS', { name: 'WALLPAPR.BMP', type: 'img', art: 'wallpaper', date: '01/01/99' });
  dput(CDROM, 'EXTRAS', { name: 'Screensaver.url', type: 'lnk', go: 'saver', date: '01/01/99', size: '1 KB' });
  dput(CDROM, 'EXTRAS', { name: 'GUBBINZ FAN ART.GIF', type: 'img', art: 'fanart', date: '01/01/99' });
  dput(CDROM, 'DRIVERS', { name: 'MODEM_V09.TXT', type: 'txt', date: '01/01/99', text: `MODEM DRIVER v0.9 (BETA)\n\nDO NOT INSTALL.\n\nThis driver makes your modem 0% faster and 100% louder.\nTested on: one modem. It doesn't work on that one either.\n` });
  dput(CDROM, 'VIDEOS', { name: 'INTRO.AVI', type: 'avi', date: '01/01/99', size: '24 MB' });
  dput(CDROM, 'VIDEOS', { name: 'MAKING OF.AVI', type: 'avi', date: '01/01/99', size: '31 MB' });

  // ================================================================ the Recycle Bin's contents (Restore puts them back)
  const BIN = [
    { id: 'hwreal', from: MD + '/Homework', del: '23/01/99', node: { name: 'homework REAL FINAL v2 (OLD).txt', type: 'txt', date: '21/01/99', text: `WHAT I WANT TO BE WHEN I GROW UP\nby Jack\n\nWhen I grow up I want to be a Jedi.\n\n(Mrs Hargreaves will not accept this. Starting again.)\n` } },
    { id: 'uglyork', from: MD + '/My Pictures', del: '24/01/99', node: { name: 'my first ork (UGLY).bmp', type: 'img', art: 'ugly_ork', date: '10/01/99' } },
    { id: 'dave', from: MD + '/Letters', del: '15/09/99', node: { name: 'DAVE IS NOT MY FRIEND ANYMORE.txt', type: 'txt', date: '14/09/99', text: `DAVE IS NOT MY FRIEND ANYMORE\n\nHe said my Ork looked like a "green potato".\n\nIt does NOT look like a green potato.\n\nI am never speaking to Dave again.\n\n(update: I spoke to him at lunch. He gave me half his chocolate biscuit. we're OK.)\n(update 2: why am I updating a file I'm about to delete)\n` } },
    { id: 'virus', from: MD, del: '27/03/99', node: { name: 'TOTALLY_NOT_A_VIRUS.EXE', type: 'exe', app: 'files.run', arg: 'virus', date: '26/03/99', size: '13 KB' } },
    { id: 'xmas1', from: MD + '/Lists', del: '02/11/99', node: { name: 'christmas list DRAFT 1.txt', type: 'txt', date: '01/11/99', text: `CHRISTMAS LIST (FIRST DRAFT)\n\n1. A real lightsaber\n2. A real Robot Wars robot\n3. A pony (for Gubbinz to ride)\n4. The Moon\n5. A Dreamcast\n\n(Mom said: "let's be realistic". Keeping number 5. Deleting this.)\n` } },
    { id: 'poem', from: MD + '/Stories', del: '18/03/99', node: { name: 'poem about squigs (bad).txt', type: 'txt', date: '18/03/99', text: `SQUIGS\n\nSquigs are red,\nSquigs are round,\nSquigs go bounce,\nOn the ground.\n\nSquigs have teef,\nSquigs eat feet,\nThat is why,\nI wear boots on the street.\n\n(This is the worst poem ever written. Deleting.)\n` } },
    { id: 'maths', from: MD + '/School', del: '12/03/99', node: { name: 'maths test (C-) NOBODY SEE.txt', type: 'txt', date: '11/03/99', text: `MATHS TEST - ALGEBRA\nMark: C-\n\nMr Bell's comment: "Jack, x is not 'whatever I want it to be'."\n\nI revised the wrong chapter. I revised GEOMETRY. I am VERY good at geometry now.\n\n(nobody needs to see this. especially Mom.)\n` } },
    { id: 'site', from: 'C:/JACKATAK', del: '31/12/98', node: { name: 'my_first_website.htm', type: 'txt', date: '20/12/98', text: `<HTML>\n<BODY BGCOLOR="#FF00FF" TEXT="#00FF00">\n<BLINK><H1>WELCOME TO JACKS PAGE!!!!!!!</H1></BLINK>\n<MARQUEE><MARQUEE><MARQUEE>SCROLLING!!!</MARQUEE></MARQUEE></MARQUEE>\n<P>UNDER CONSTRUCTION <IMG SRC="digger.gif"> <IMG SRC="digger.gif"> <IMG SRC="digger.gif">\n<P>THIS IS MY PAGE. IT IS PINK AND GREEN. THIS IS A GOOD IDEA.\n<!-- Jack's note (30/12/98): this was not a good idea. Starting again with JACK ATTACK! -->\n</BODY>\n</HTML>\n` } },
    { id: 'pet', from: MD, del: '09/02/99', node: { name: 'virtual pet (RIP).txt', type: 'txt', date: '09/02/99', text: `IN MEMORY OF\n\nBLIP\nmy virtual pet\n\nborn: 25/12/98 (Christmas present)\ndied: 09/02/99 (during double maths, left in my bag)\n\nHe was a good little blob of pixels.\nHe liked: food (the bread icon), games (the guess-left-or-right one)\nHe did not like: being in my bag during double maths\n\nRIP Blip. You were only 46 days old. That's like 90 in blob years.\n` } },
    { id: 'tornout', from: DIARY, del: '13/11/98', node: { name: '12-11-98.txt', type: 'txt', date: '12/11/98', text: `Thursday 12 November 1998\n\nCried at the end of a film tonight.\n\nNot saying which film.\n\nNot saying how much.\n\nIt was a lot.\n\nDELETE THIS FILE BEFORE ANYONE SEES IT.\n` } },
    { id: 'grubv01', from: MD + '/My Pictures', del: '14/02/99', node: { name: 'Gubbinz v0.1 (ears too small).gif', type: 'img', art: 'fanart', date: '12/02/99' } },
    { id: 'resign', from: MD, del: '11/07/99', node: { name: 'resignation letter.txt', type: 'txt', date: '11/07/99', text: `Dear Mom,\n\nI am writing to resign from my position as Tidier of the Bedroom.\n\nI have held this position for many years and I feel it is time for someone else to take over. Possibly Dad. Possibly a robot.\n\nI will stay on until the end of the week to train my replacement.\n\nYours faithfully,\nJack\n\n(Mom's reply, written on a post-it on the monitor: "Resignation NOT accepted. Tidy your room. Love Mom x")\n` } },
    { id: 'davecheats', from: MD + '/Cheats', del: '21/03/99', node: { name: "Dave's cheats (ALL WRONG).txt", type: 'txt', date: '20/03/99', text: `CHEATS BY DAVE\n\n- In GoldenEye, if you shoot the toilet in Facility 100 times you get a secret gun.\n- In Mario Kart, if you hold all the buttons at the start you go backwards really fast.\n- In Pokemon, if you put the cartridge in the freezer you get ice Pokemon.\n\n(Jack's note: NONE OF THESE ARE REAL. Dave froze his cousin's Game Boy game. It still works but it was wet.)\n` } },
  ];
  // ================================================================ e-mail (Outlook Express). d: 'MM-DD' in 1999 (appears on that day), or old: 'dd/mm/98'
  const FAM = 'The Family <the.family@jacknet.jnet>';
  const DAVE = 'Dave <davetherave@jacknet.jnet>', RYAN = CN('cousin2') + ' <' + Cast.slug('cousin2') + '_the_great@hotjack.jnet>', MOM = 'Mom <the.family@jacknet.jnet>', GRAN = 'Gran <gran.and.grandad@jacknet.jnet>';
  const BILL = 'JackNet Customer Accounts <accounts@jacknet.jnet>', N64 = 'The N64 Fan Club <n64fanclub@members.jacknet.jnet>', GFC = 'Gubbinz Fan Club <gubbinz.fanclub@members.jacknet.jnet>', ALI = CT('{teacher} (Computer Club) <computerclub@skool.kidz>');
  const JACK = '{NAME} <{ADDR}>', ME = JACK, JACKF = 'Jack (The Family) <the.family@jacknet.jnet>'; // {NAME} etc. become whoever is logged on to JackNet
  const MAIL = [
    // ---------------------------------------------------------------- always there (1998)
    { id: 'welcome', f: 'inbox', old: '12/12/98', from: 'JackNet Mail Team <welcome@jacknet.jnet>', subj: 'Welcome to JackNet Mail!', body: `Welcome to JackNet Mail!

Your new e-mail address is: the.family@jacknet.jnet

With JackNet Mail you can:
 * Send letters to anyone in the world, instantly*
 * Receive letters from anyone in the world, instantly*
 * Attach files up to 1MB (that's nearly a whole floppy disk!)

*"Instantly" means "next time you dial up".

Your mailbox can hold 5MB of messages. Please delete old messages or your mailbox will get full and we will send you an e-mail telling you your mailbox is full, which will make it fuller.

Happy e-mailing!
The JackNet Mail Team` },
    { id: 'oewelcome', f: 'inbox', old: '10/12/98', from: 'Outlook Express Team', subj: 'Welcome to Outlook Express', body: `Welcome to Outlook Express!

Outlook Express is your one-stop place for e-mail on your computer.

TIPS:
 - Click New Mail to write a message.
 - Click Send/Recv to check for new messages.
 - Messages you haven't read yet are shown in BOLD.
 - The Deleted Items folder keeps things you delete. Check it sometimes. You never know what's in there.

Enjoy!` },
    { id: 'momrules', f: 'inbox', old: '27/12/98', from: MOM, to: FAM + '; ' + ME, subj: 'THE FAMILY E-MAIL RULES (please read {NAME})', body: `Hello all (especially you, {NAME}),

This is the FAMILY e-mail account. It belongs to all of us. Please follow these rules:

1. Do NOT give our e-mail address out on the Internet. ({NAME}.)
2. Do NOT sign up for newsletters. ({NAME}.)
3. Do NOT open attachments from people we don't know. (Everyone. Mainly your father.)
4. Off the Internet by 8pm. The phone is for PHONING.
5. If you see an e-mail for someone else, don't read it. ({NAME}. And Jack.)

I am writing this e-mail ON THE COMPUTER IN YOUR ROOM while you are having a bath, because it is the only way I know you will read it.

Love Mom x

P.S. Your father says hello. He doesn't know how to send e-mail yet.` },
    { id: 'granfirst', f: 'inbox', old: '29/12/98', from: GRAN, subj: 'TESTING TESTING', body: `HELLO {NAMEUC} THIS IS GRAN

GRANDAD HAS SET UP THE COMPUTER AND I AM TYPING ON IT. I CANNOT FIND THE BUTTON FOR SMALL LETTERS SO EVERYTHING IS BIG.

DID YOU GET THE SOCKS.

THE COMPUTER MADE A VERY STRANGE NOISE WHEN IT WENT ON THE INTERNET. GRANDAD SAYS THAT IS NORMAL. I THINK IT IS BROKEN.

LOVE GRAN XXXX

P.S. HOW DO I SEND THIS` },
    { id: 'ryantips', f: 'inbox', old: '26/12/98', from: RYAN, subj: 'ur new computer', body: `alright cuz

heard you got a PC for christmas. nice. what is it, a pentium 2? mines a K6-2 which is basically faster (dont argue)

some tips from a pro:
- get winamp-style mp3 player thing (when the modem is quicker)
- never let your mom see the phone bill
- defrag every week, it makes the little blocks go in the right places and its relaxing to watch
- dont download anything off the internet

except my tips file, which is attached. read it.

${Cast.slug('cousin2')}
"the great"` , att: [{ name: Cast.slug('cousin2') + '_tips.txt', type: 'txt', text: `${CN('cousin2').toUpperCase()}'S COMPUTER TIPS (copyright ${Cast.slug('cousin2')} 1998)\n\n1. turn it off and on again\n2. if that doesnt work, turn it off and on again but angrier\n3. the turbo button does nothing. press it anyway, it feels fast\n4. never eat crisps near the keyboard\n5. if anyone asks, you are "doing homework"\n6. ${Cast.slug('cousin2')} is always right\n` }] },
    { id: 'junkwin', f: 'junk', old: '20/12/98', from: 'PRIZE NOTIFICATION DEPT <winner@prize-notify-dept.w3b>', subj: '!!! CONGRATULATIONS !!! YOU HAVE BEEN SELECTED !!!', body: `DEAR VALUED INTERNET USER,

CONGRATULATIONS!!! YOUR E-MAIL ADDRESS HAS BEEN SELECTED AT RANDOM FROM OVER 1,000,000 ADDRESSES TO RECEIVE A FANTASTIC PRIZE!!!

YOU HAVE WON:
 [X] A HOLIDAY
 [X] A CAR
 [X] A BIG TELLY
 [X] ALL OF THE ABOVE*

TO CLAIM YOUR PRIZE, SIMPLY REPLY WITH YOUR NAME, YOUR ADDRESS, YOUR MOM'S NAME, YOUR BANK DETAILS AND THE NAME OF YOUR FIRST PET.

*Prize may not exist. Prize does not exist. There is no prize.

JACK'S NOTE: Mom says this is a scam. If someone you don't know says you've won something you didn't enter, you haven't. Never send your details. Ever. And DON'T open the attachment.`, att: [{ name: 'CLAIM_PRIZE.EXE', type: 'exe', blocked: true }] },
    { id: 'clue', f: 'deleted', old: '31/12/98', from: 'Gubbinz <gubbinz@squigpen.grot>', subj: 'psssst', secret: 'files.mailclue', body: `hello!

it's gubbinz. i'm inside the computer. don't tell jack.

it looks like you're trying to find secrets! would you like help? (that's my job now. i'm a helper. i've got a badge.)

here are some things i've seen:

1. jack has a SECRET FOLDER in his My Documents. it has a password. the password is a riddle and the riddle is in his LISTS. the answer is what orks spend. (no, it's not "pizza". i tried. it was not happy.)

2. the A: drive is STUBBORN. it says "please insert a disk". ask it three times. (like Beetlejuice, but with floppies.)

3. there's a folder called Temp inside JACKOS that nobody looks in. you have to make the hidden things show up first. (View menu, in the Explorer.) something in there can TYPE.

4. the bin on the desktop is FULL of stuff jack thought he got rid of. you can put it back. hee hee.

5. if you drag any of this to the bin, i will eat it.

- G

P.S. jack deleted this email. he thinks it's spam. it is not spam. it is GUBBINZ.` },
    { id: 'sentdave1', f: 'sent', old: '28/12/98', from: JACK, to: DAVE, subj: 'TEST', body: `TEST

Dave, if you get this, I have e-mail now!!! Reply!!!

{NAME}` },
    { id: 'sentgran', f: 'sent', old: '29/12/98', from: JACK, to: GRAN, subj: 'Re: TESTING TESTING', body: `Hi Gran!

Yes I got the socks, thank you! They are very warm.

The small letters button is called Caps Lock. It's on the left. It has a little light. If the light is on, everything is BIG.

And yes, the noise is normal. It's the modem talking to the Internet.

Love {NAME} xxx

> HELLO {NAMEUC} THIS IS GRAN
> DID YOU GET THE SOCKS.` },
    { id: 'draftmag', f: 'drafts', old: '30/12/98', from: JACK, to: 'Letters Page', subj: 'letter for the letters page', body: `Dear Editor,

I am writing to say that your magazine is great but it doesn't have enough Robot Wars in it and it never prints my letters.

(unfinished - I'll send it when I've thought of a really good question)` },

    // ---------------------------------------------------------------- January - March
    { id: 'dave0101', f: 'inbox', d: '01-01', from: DAVE, subj: 'HAPPY NEW YEAR + ur website', body: `HAPPY NEW YEAR!!!!!!!!!!!!

looked at your website. its ok i guess.

why is it all yellow and black. it looks like a wasp.

also you spelt "receive" wrong.

dave

p.s. can you put my name on it. like "special thanks to dave". because i helped. (i watched you do it)` },
    { id: 'bill0104', f: 'inbox', d: '01-04', from: BILL, subj: 'Your JackNet statement - December 1998', body: `Dear The Family,

Thank you for choosing JackNet 56K!

STATEMENT FOR: December 1998
-----------------------------------------
Monthly subscription            £9.99
Hours online                    47 hrs 12 mins
Longest single session          4 hrs 51 mins (25/12/98)
Busiest time                    23:00 - 00:30 (?)
-----------------------------------------
TOTAL DUE                       £9.99

Please remember: your phone company will charge you separately for the calls. For 47 hours. We just thought we'd mention it.

Kind regards,
JackNet Customer Accounts
"The Internet, but slowly"` },
    { id: 'ryan0109', f: 'inbox', d: '01-09', from: RYAN, subj: 'pokemon cards', body: `pokemon cards are out in america. my mate's brother has seen a charizard one. shiny. worth like a MILLION pounds probably

when they come out here im getting all 102. you will be jealous

${Cast.slug('cousin2')}

p.s. tell dave not to swap his bike for one. i know dave. dave would do that` },
    { id: 'n64jan', f: 'inbox', d: '01-15', from: N64, subj: 'N64 FAN CLUB NEWSLETTER - January 1999', body: `=========================================
   THE N64 FAN CLUB NEWSLETTER - JANUARY
   (we are a fan club, not Nintendo!)
=========================================

HELLO MEMBERS! Happy New Year! All 214 of you!

NEWS
 * SUPER SMASH BROS. comes out in Japan on 21st January! Mario, Link, Pikachu, Kirby, Donkey Kong, Samus, Fox and Yoshi all hitting each other! No UK date yet. We will be checking every day. EVERY DAY.
 * Everybody got Zelda: Ocarina of Time for Christmas. Everybody. Our postbag is 90% "how do I get past the Water Temple". (Answer: patience. And the Iron Boots. Mostly patience.)

TIP OF THE MONTH
 GoldenEye: on Facility, on Agent, you can get the run down to under 2 minutes if you skip the bathroom. Don't skip the bathroom on 00 Agent, though. You'll need the scientist.

MEMBER'S LETTER
 "Is it true you can play as Luigi in Mario 64?" - every member, every month
 No. Probably. Maybe. We don't know. STOP ASKING.

See you next month!
The N64 Fan Club` },
    { id: 'dave0129', f: 'inbox', d: '01-29', from: DAVE, subj: 'WORMS', body: `my cousin got WORMS ARMAGEDDON

come round tomorrow. bring your controller (you dont need a controller its a pc game. bring yourself)

i am naming my worms after you and your mom and your dad. sorry in advance

dave` },
    { id: 'gran0214', f: 'inbox', d: '02-14', from: GRAN, subj: 'HAPPY VALENTINES DAY', body: `HAPPY VALENTINES DAY TO MY FAVOURITE GRANDCHILD {NAMEUC}

(DONT TELL ${CN('cousin2').toUpperCase()} YOU ARE MY FAVOURITE. HE THINKS IT IS HIM.)

GRANDAD HAS SHOWN ME HOW TO DO SMALL LETTERS but I forgot again.

LOVE GRAN XXXX` },
    { id: 'chain0219', f: 'inbox', d: '02-19', from: RYAN, subj: 'FW: FW: FW: FW: FW: FW: DONT BREAK THE CHAIN!!!!!', body: `>>>>>> THIS IS NOT A JOKE!!!!!
>>>>>
>>>>> This e-mail has been sent around the world 999 times.
>>>>> Send it to 10 people in the next 10 minutes and something
>>>>> AMAZING will happen to you tomorrow.
>>>>>
>>>>> A boy in America sent it to 10 people and he got a
>>>>> Nintendo 64 for FREE.
>>>>>
>>>>> A girl in Australia DIDN'T send it and her Game Boy
>>>>> batteries ran out IN THE MIDDLE OF A BOSS.
>>>>>
>>>>> DON'T BREAK THE CHAIN!!!!!!!!!!!

${Cast.slug('cousin2')}: i sent it to 10 people. if i get an n64 i'll let you know

JACK'S NOTE: chain letters are made up. Nothing happens if you don't send them. Except your Game Boy batteries run out, but that's because they're old.` },
    { id: 'dave0226', f: 'inbox', d: '02-26', from: DAVE, subj: 'METAL GEAR SOLID!!!!!!!!', body: `GOT IT

snake hides in a CARDBOARD BOX and the guards walk right past

i hid in a cardboard box in my room to test it and my mom walked right past. IT WORKS IN REAL LIFE

come round saturday

dave` },
    { id: 'dad0303', f: 'inbox', d: '03-03', from: 'Dad (at work) <dad.at.work@jacknet.jnet>', subj: 'FW: You know you\'re addicted to the Internet when...', body: `(Dad here. Somebody at work sent this round. Thought you'd like it. How do I turn caps lock off. Oh it's off. Good.)

-----Forwarded message-----
YOU KNOW YOU'RE ADDICTED TO THE INTERNET WHEN...

- You wake up at 3am to go to the toilet and check your e-mail on the way back.
- You can hear the modem noise in your sleep.
- You say "brb" out loud.
- Your mom has to e-mail you to tell you dinner's ready.
- You have a "favourite" error message.
- You put www. in front of everything you write.
- You tried to double-click this sentence.
- You're reading this instead of doing something useful.
-----End of forwarded message-----

Love Dad` },
    { id: 'n64mar', f: 'inbox', d: '03-12', from: N64, subj: 'N64 FAN CLUB NEWSLETTER - March 1999', body: `=========================================
   THE N64 FAN CLUB NEWSLETTER - MARCH
=========================================

NEWS
 * MARIO PARTY is out now! WARNING from our members: the mini-games where you spin the control stick can give you blisters on your palm. Use your thumb. Or a sock.
 * POKEMON SNAP comes out in Japan this month. You ride round on a little cart and take PHOTOS of Pokemon. The film gets developed at the end. Like a real camera, but less waiting.
 * Rare are making a new shooter called Perfect Dark, from the people who made GoldenEye. No date yet. We have our fingers crossed. All of them.

READER POLL: BEST N64 CONTROLLER COLOUR
 1. Grey (it came with it)        52%
 2. See-through (WANT)            31%
 3. "The one Dave chewed"         17%

TIP: Mario Kart 64 - on Koopa Troopa Beach, there's a shortcut through the rock in the middle. You need a mushroom.

See you next month!` },
    { id: 'ryanmelissa', f: 'inbox', d: '03-26', from: RYAN, subj: 'Important Message From ' + CN('cousin2'), body: `Here is that document you asked for ... don't show anyone else ;-)
`, att: [{ name: 'list.doc', type: 'doc', blocked: true }] },
    { id: 'ryansorry', f: 'inbox', d: '03-27', from: RYAN, subj: 'DONT OPEN THAT', body: `DONT OPEN THE ONE THAT SAYS IMPORTANT MESSAGE FROM ${CN('cousin2').toUpperCase()}

it wasnt me it was a virus called melissa. it sent itself to everyone in my address book. including my headteacher. and the man from the chip shop

my dad says I'm not allowed on the computer for a week

this is being typed by my mom

${Cast.slug('cousin2')} (by ${Cast.slug('cousin2')}'s mom)` },
    { id: 'junkink', f: 'junk', d: '02-02', from: 'INK DEALS!!! <ink@cheap-inkjet-ink-uk.w3b>', subj: 'CHEAP INK!!! CYAN!!! CYAN!!! CYAN!!!', body: `ARE YOU OUT OF CYAN???

OF COURSE YOU ARE!!! EVERYONE IS ALWAYS OUT OF CYAN!!!

WE HAVE CYAN!!! WE HAVE SO MUCH CYAN!!!
Our warehouse is FULL of cyan. It's all we have. Please. Please buy the cyan.

MAGENTA: out of stock
YELLOW: out of stock
BLACK: out of stock
CYAN: 40,000 cartridges

ORDER NOW!!!` },
    { id: 'sentn64', f: 'sent', d: '01-14', from: JACK, to: N64, subj: 'please can I join', body: `Dear N64 Fan Club,

Please can I join the N64 Fan Club. I have an N64 and GoldenEye and Zelda and Mario 64 (118 stars, the other two are lost forever).

My favourite N64 game is GoldenEye. My favourite character is Bond. Not Oddjob. Never Oddjob.

From {NAME}

P.S. Please don't tell my Mom I signed up for a newsletter.` },
    { id: 'draftmag2', f: 'drafts', d: '03-02', from: JACK, to: 'Letters Page', subj: 'letter (proper one this time)', body: `Dear Editor,

I have three questions:
1. Is there going to be a GoldenEye 2?
2. Is Luigi in Mario 64?
3. Can you put more Robot Wars in your magazine?

(Wrote it as a real letter instead. It's in My Documents\\Letters. Printed it out. Printer out of cyan. Printed it in black. Posted it. Waiting.)` },

    // ---------------------------------------------------------------- April - June
    { id: 'dave0403', f: 'inbox', d: '04-03', from: DAVE, subj: 'Re: I SOLVED IT!!!!!!!', body: `prove it

you probably peeled the stickers off like your mom

dave

> I SOLVED THE RUBIK'S CUBE!!! ALL SIX SIDES!!!` },
    { id: 'sent0403', f: 'sent', d: '04-03', from: JACK, to: DAVE, subj: 'I SOLVED IT!!!!!!!', body: `I SOLVED THE RUBIK'S CUBE!!! ALL SIX SIDES!!!

I'll do it in front of you on Monday. I've written the moves down. R U R' U'. You won't understand. Nobody understands.

{NAME}` },
    { id: 'bill0405', f: 'inbox', d: '04-05', from: BILL, subj: 'Your JackNet statement - March 1999', body: `Dear The Family,

STATEMENT FOR: March 1999
-----------------------------------------
Monthly subscription            £9.99
Hours online                    61 hrs 40 mins   (up 31%!)
Most visited website            "JACK ATTACK!"   (some local site)
-----------------------------------------
TOTAL DUE                       £9.99

NEW! Our "Evenings & Weekends" package means you can use the Internet for less after 6pm*. We've noticed you're already doing that. A lot.

*Mom's note scribbled on the printout: "AFTER 6PM AND BEFORE 8PM."

JackNet Customer Accounts` },
    { id: 'ali0419', f: 'inbox', d: '04-19', from: ALI, to: JACKF, subj: 'Your Tetris game', body: `Hello Jack,

I saw your "Jacktris" game on your website (you showed me the address in Computer Club, I hope that's OK). It's very impressive! Did you really write all of that yourself?

I have shared it with the other teachers. Mr Bell got to level 6 and then had to go and teach Year 10.

I'm afraid I must ask you NOT to put it on the school computers. I know you could. I know you WANT to. Please don't.

Best wishes,
${CN('teacher')}
Computer Club` },
    { id: 'sentbill', f: 'sent', d: '04-19', from: JACK, to: 'JackNet Customer Services <help@jacknet.jnet>', subj: 'complaint about my modem', body: `Dear JackNet,

My modem says 56K on the box. It does not go at 56K. It goes at about 40K on a good day and 26K when it's raining.

Also every time my Mom picks up the phone the Internet stops. Is there a setting to fix this?

Yours sincerely,
{NAME}` },
    { id: 'billreply', f: 'inbox', d: '04-21', from: 'JackNet Customer Services <help@jacknet.jnet>', subj: 'Re: complaint about my modem', body: `Dear Customer,

Thank you for contacting JackNet Customer Services. Your query is important to us.

Regarding your modem speed: "56K" is the maximum speed under perfect conditions. Perfect conditions include: a brand new phone line, no rain, nobody else in your street on the Internet, and a good mood.

Regarding your mother picking up the phone: we're afraid there is no setting for this. We have tried. Our engineers have mothers too.

Kind regards,
Customer Services
JackNet 56K - "The Internet, but slowly"` },
    { id: 'n64may', f: 'inbox', d: '05-14', from: N64, subj: 'N64 FAN CLUB NEWSLETTER - May 1999 (E3 SPECIAL)', body: `=========================================
   THE N64 FAN CLUB - E3 SPECIAL!!!
=========================================

E3, the giant games show in Los Angeles, is on RIGHT NOW. Here's the news:

 * Nintendo's NEXT console has a code name: "DOLPHIN". No pictures. No games. Just a name. Our members have already sent in 40 drawings of what they think it looks like. Most of them are a dolphin.
 * STAR WARS EPISODE I: RACER is out on the 4th of June. Podracing! On the N64! It even supports the Expansion Pak for a sharper picture.
 * DONKEY KONG 64 is coming at the end of the year from Rare. They say it's HUGE.

MEMBER'S QUESTION
 "Is Pokemon coming to the UK?" - YES, in October! For the Game Boy. You have to catch them all. There are 151. Start practising.

See you next month!` },
    { id: 'gfc0520', f: 'inbox', d: '05-20', from: GFC, subj: 'WELCOME TO THE GUBBINZ FAN CLUB!!!', body: `WELCOME, NEW MEMBER!!!

The Gubbinz Fan Club was started on 15/05/99, the same day Gubbinz arrived on JACK ATTACK!, by me, PixelLord. I am his number one fan. You are now his number two fan (or lower, we're still counting).

MEMBERSHIP BENEFITS:
 * a membership card (attached!!!)
 * a monthly newsletter
 * the warm feeling of knowing you fed a virtual pet

CLUB RULES:
 1. Feed Gubbinz every day.
 2. Do NOT feed Gubbinz after midnight. (He's fine. We saw Gremlins, that's all.)
 3. Red ones go faster.

WOO-HOO!!!
PixelLord
President, Gubbinz Fan Club` , att: [{ name: 'membership_card.gif', type: 'img', art: 'fanart' }] },
    { id: 'sentgfc', f: 'sent', d: '05-20', from: JACKF, to: GFC, subj: 'Re: WELCOME TO THE GUBBINZ FAN CLUB!!!', body: `Hi PixelLord!

Thanks for joining me to your fan club! Um. I'm Jack. I made Gubbinz.

So I'm technically his number zero fan?

Can I be Vice-President?

Jack` },
    { id: 'dave0519', f: 'inbox', d: '05-19', from: DAVE, subj: 'PHANTOM MENACE SPOILERS (not really)', body: `ITS OUT IN AMERICA TODAY

i havent seen it. nobody here has seen it. but i heard from a boy whose cousin lives in america that

[DAVE HAS BEEN STOPPED BY JACK'S SPOILER FILTER]

(jack i didnt actually know anything. i was just going to make something up. you were right to stop me)

dave` },
    { id: 'ryan0601', f: 'inbox', d: '06-01', from: RYAN, subj: '99%', body: `ninety nine percent

NINETY NINE PERCENT

i was downloading a song with this new thing called napster. it takes ten minutes for one song on a 56k. i was at 99 percent. mom picked up the phone to ring ${CN('auntie').toLowerCase()}.

gone. all of it. the whole song. except the 99 percent which is in a temp file and wont play

i am never speaking to ${CN('auntie').toLowerCase()} again

${Cast.slug('cousin2')}` },
    { id: 'mom0612', f: 'inbox', d: '06-12', from: MOM, subj: 'GET OFF THE COMPUTER', priority: true, body: `{NAME},

I am sending this from your computer, while you are downstairs getting a drink, so you will see it when you come back up.

GET OFF THE COMPUTER.

It is 9:15. You said "five more minutes" at 8:00. That is 75 more minutes. I have done the maths. I can do maths too.

Also your jobs list is attached. Again.

Love Mom x

P.S. Don't pretend you didn't see this. I'll know. I always know.` , att: [{ name: 'jobs Mom wants me to do.txt', path: 'C:/My Documents/Lists/jobs Mom wants me to do.txt' }] },
    { id: 'gran0621', f: 'inbox', d: '06-21', from: GRAN, subj: 'FW: FW: funny animal pictures', body: `{NAMEUC} THESE ARE VERY FUNNY ANIMAL PICTURES

MRS PATEL AT THE CHURCH SENT THEM TO ME AND NOW I AM SENDING THEM TO YOU

I CAN ONLY SEE ONE PICTURE. IT IS A CAT. IT IS VERY FUNNY. I DONT KNOW WHY.

LOVE GRAN XXXX

>>> ha ha ha these are so funny!!! [picture 1] [picture 2] [picture 3]
>>> pictures may not display` , att: [{ name: 'funny_cat.jpg', type: 'img', art: 'cat' }] },
    { id: 'gfc0628', f: 'inbox', d: '06-28', from: GFC, subj: 'PET OF THE MONTH: JUNE', body: `GUBBINZ FAN CLUB NEWSLETTER - JUNE

PET OF THE MONTH: Gubbinz (again) (he's the only pet) (he wins every month)

MEMBER COUNT: 17!!! (we were 1 last month)

THINGS GUBBINZ DID THIS MONTH:
 - got fed 4,000 times
 - flapped his ears
 - ate a whole pizza
 - looked at us all funny

COMPETITION: draw Gubbinz! The best one wins a picture of Gubbinz.
Winning picture from last month is attached!

SORTED!
PixelLord (President)
Jack (Vice-President)` , att: [{ name: 'grot_of_the_month.bmp', path: 'C:/My Documents/My Pictures/Gubbinz.bmp' }] },
    { id: 'junkcash', f: 'junk', d: '04-12', from: 'Opportunity Knocks <cash@make-cash-from-your-sofa.w3b>', subj: 'Make £££ FROM YOUR SOFA!!!!', body: `ARE YOU TIRED OF WORKING???

WORK FROM HOME!!! MAKE £5,000 A WEEK!!! FROM YOUR SOFA!!!

All you need to do is send us £50 and we will send you instructions on how to make people send YOU £50!!!

It's not a pyramid. It's a triangle. A financial triangle.

REPLY NOW!!!

JACK'S NOTE: Mom says "if it sounds too good to be true, it is". Dad said "hmm, £5,000 a week" and Mom gave him a look.` },
    { id: 'junkpw', f: 'junk', d: '06-15', from: 'HotJack Security Team <security@hotjack-accounts-team.w3b>', subj: 'URGENT: YOUR ACCOUNT WILL BE CLOSED', body: `Dear HotJack User,

Due to a SECURITY PROBLEM, your account will be CLOSED in 24 HOURS.

To keep your account open, reply to this e-mail with your:
 * User name
 * Password
 * Password again (to check)
 * Mother's maiden name
 * The PIN for your bank card

We are definitely the real HotJack.

HotJack Security Team

JACK'S NOTE: 1. We don't even use HotJack, that's ${CN('cousin2')}. 2. NO REAL COMPANY EVER ASKS FOR YOUR PASSWORD. Not by e-mail, not on the phone, not ever. Deleting.` },

    // ---------------------------------------------------------------- July - September
    { id: 'bill0705', f: 'inbox', d: '07-05', from: BILL, subj: 'Your JackNet statement - June 1999', body: `Dear The Family,

STATEMENT FOR: June 1999
-----------------------------------------
Monthly subscription            £9.99
Hours online                    58 hrs 03 mins
Disconnections                  211
  of which "phone picked up"    198
  of which "unknown"            13
-----------------------------------------
TOTAL DUE                       £9.99

We have noticed you get disconnected a lot. Have you thought about a second phone line? (Ask your parents.)

JackNet Customer Accounts` },
    { id: 'dave0716', f: 'inbox', d: '07-16', from: DAVE, subj: 'MAUL', body: `DOUBLE LIGHTSABER

DOUBLE

LIGHTSABER

i made one out of two of my sisters hockey sticks and some tape. its in the garden. come and see. dont tell my sister

dave` },
    { id: 'ali0722', f: 'inbox', d: '07-22', from: ALI, subj: 'Computer Club - summer', body: `Dear Computer Club members,

Thank you for a brilliant year! Some highlights:
 * The school website now has TWO pages (thank you Jack)
 * The printer has been fixed (it was out of cyan)
 * Mrs Hargreaves can now double-click

Have a lovely summer. Please go outside at least once.

See you in September!
${CN('teacher')}` },
    { id: 'n64aug', f: 'inbox', d: '08-01', from: N64, subj: 'N64 FAN CLUB NEWSLETTER - Summer Holiday Special', body: `=========================================
   THE N64 FAN CLUB - SUMMER SPECIAL
=========================================

It's the summer holidays! Here's what to play when it's raining (always):

 * EPISODE I: RACER - try Boonta Eve as Sebulba. Then complain he cheats.
 * GOLDENEYE - still the best. Four player, Facility, proximity mines. Lose friends.
 * MARIO PARTY - see above re: losing friends.
 * ZELDA - have you finished the Water Temple yet? Neither have we.

COMING SOON
 * POKEMON for Game Boy - 5th of October!!!
 * SUPER SMASH BROS. - we STILL don't have a UK date. We have stopped asking. (We have not stopped asking.)
 * DONKEY KONG 64 - comes with the EXPANSION PAK, which doubles the N64's memory from 4MB to 8MB!

Have a great summer!` },
    { id: 'gfc0809', f: 'inbox', d: '08-09', from: GFC, subj: 'ECLIPSE WARNING FOR PETS', body: `GUBBINZ FAN CLUB - IMPORTANT SAFETY MESSAGE

There is an ECLIPSE on Wednesday!!!

DO NOT let your pets look at the sun.
DO NOT let YOURSELF look at the sun.
Use proper eclipse glasses or a pinhole box (Jack says he's doing this for his science project).

Gubbinz will be wearing TWO pairs of sunglasses and hiding under a bucket.

Woo-hoo! (quietly, because of the eclipse)
PixelLord` },
    { id: 'gran0811', f: 'inbox', d: '08-11', from: GRAN, subj: 'THE ECLIPSE', body: `{NAMEUC} DID YOU SEE THE ECLIPSE

GRANDAD AND I WATCHED IT ON THE TELLY. IT WENT DARK ON THE TELLY AND IT ALSO WENT A BIT DARK IN THE GARDEN.

GRANDAD TOOK A PHOTO OF THE TELLY. I HAVE ATTACHED IT. IT IS A PHOTO OF THE TELLY. THE ECLIPSE IS ON IT.

THE NEXT ONE IS IN 2090. I AM NOT GOING TO WAIT FOR THAT ONE.

LOVE GRAN XXXX` , att: [{ name: 'eclipse_on_the_telly.jpg', type: 'img', art: 'eclipse' }] },
    { id: 'ryan0823', f: 'inbox', d: '08-23', from: RYAN, subj: 'ur chat room', body: `went on your chat room. typed "hello" and some kid called xXGrotSlayerXx said "ur mom" and left

10/10 best chat room ever

${Cast.slug('cousin2')}` },
    { id: 'dave0909', f: 'inbox', d: '09-09', from: DAVE, subj: '9/9/99', body: `dreamcast out in america TODAY

sonic runs DOWN A BUILDING

my dad says we are getting one DEFINITELY

(he said that about the trampoline)

dave` },
    { id: 'davepotato', f: 'deleted', d: '09-14', from: DAVE, subj: 'ur ork', body: `ur new ork looks like a green potato

not being funny

ok being a bit funny

dave` },
    { id: 'mom0924', f: 'inbox', d: '09-24', from: MOM, subj: 'NEW COMPUTER RULES FOR SCHOOL NIGHTS', body: `{NAME},

Now you're back at school, here are the new rules:

MONDAY - THURSDAY: homework FIRST. Then computer. Off at 8.
FRIDAY: computer till 9 (if homework is done)
SATURDAY: computer till 9:30 (if your room is tidy)
SUNDAY: family day (I mean it this time)

Your father has also agreed to follow these rules for Championship Manager.

Love Mom x

P.S. Your father has NOT agreed. I'm working on it.` },
    { id: 'junkink2', f: 'junk', d: '08-05', from: 'UPGRADE NOW <deals@ram-ram-ram-deals.w3b>', subj: 'Is your computer SLOW??? MORE RAM!!!', body: `IS YOUR COMPUTER SLOW???

Of course it is! It's 1999! Everything is slow!

DOWNLOAD MORE RAM*!!!
Just click this e-mail 50 times and your computer will have 128MB!!!

*You can't download RAM. RAM is a little green board you put inside your computer. We are lying to you.

JACK'S NOTE: you CAN'T download RAM. ${CN('cousin2')} tried. ${CN('cousin2')} was very disappointed.` },
    { id: 'junky2k', f: 'junk', d: '09-01', from: 'Y2K READY! <survive@millennium-ready-kits.w3b>', subj: 'ONLY 121 DAYS LEFT!!! ARE YOU READY???', body: `THE MILLENNIUM BUG IS COMING!!!

When the clocks strike midnight on 31/12/1999:
 - the lights might go off!
 - the cash machines might stop!
 - your video recorder might forget what time it is! (it already has)

BUY THE Y2K SURVIVAL KIT TODAY:
 * 1 torch
 * 1 tin of beans
 * 1 leaflet about the Millennium Bug
 * 1 more tin of beans

ONLY £99.99!!!

JACK'S NOTE: That's a tin of beans and a torch for a hundred quid. Mom has 40 tins of beans already. Mom should sell Y2K kits.` },
    { id: 'gfcbook', f: 'sent', d: '09-25', from: JACKF, to: GFC, subj: 'new thing on the website', body: `Hi PixelLord,

Tell the fan club: I've put the MegaCube on the website! It's a Rubik's cube that EVERYONE shares.

Gubbinz is not allowed to touch it. He tried to eat a corner.

Jack (Vice-President)` },

    // ---------------------------------------------------------------- October - December
    { id: 'dave1005', f: 'inbox', d: '10-05', from: DAVE, subj: 'I GOT RED', body: `GOT POKEMON RED

picked bulbasaur because its a plant and a dinosaur at the same time

do you want to trade. i will give you a pidgey for your squirtle

(this is a fair trade)

(it is not a fair trade)

dave` , att: [{ name: 'trade_plan.txt', type: 'txt', text: `DAVE'S TRADE PLAN (TOP SECRET)\n\nstep 1: give jack a pidgey\nstep 2: get squirtle\nstep 3: give squirtle back because jack will cry\nstep 4: actually just trade normally\n` }] },
    { id: 'bill1006', f: 'inbox', d: '10-06', from: BILL, subj: 'Your JackNet statement - September 1999', body: `Dear The Family,

STATEMENT FOR: September 1999
-----------------------------------------
Monthly subscription            £9.99
Hours online                    39 hrs 30 mins   (down 32%!)
-----------------------------------------
TOTAL DUE                       £9.99

Your hours online have gone DOWN. Is everything all right? Did someone get some new rules?

JackNet Customer Accounts` },
    { id: 'n64oct', f: 'inbox', d: '10-14', from: N64, subj: 'N64 FAN CLUB NEWSLETTER - October 1999', body: `=========================================
   THE N64 FAN CLUB - OCTOBER
=========================================

NEWS
 * The DREAMCAST is out today. Several members have written in to say they are "just looking" at it. We understand. We are also just looking. We are a fan club, not the police.
 * POKEMON RED & BLUE came out on the 5th for the Game Boy, which counts as Nintendo, so we're allowed to talk about it. 151 Pokemon. Our members have caught... about 30.
 * SUPER SMASH BROS. has a UK date at LAST: 19th of November!!!
 * DONKEY KONG 64: 6th of December. Comes with the Expansion Pak!

TIP: Pokemon - Squirtle makes Brock easy. Charmander makes Brock a nightmare. Pick wisely.

See you next month!` },
    { id: 'gfc1025', f: 'inbox', d: '10-25', from: GFC, subj: 'HALLOWEEN COMPETITION!!!', body: `GUBBINZ FAN CLUB - HALLOWEEN COMPETITION

Dress up as GUBBINZ for Halloween!!!

You will need:
 - green face paint (warning: may not come off)
 - big pointy ears (cardboard is fine)
 - a hungry look

Best costume wins a GOLD STAR (drawn in crayon).

Vice-President Jack says he's going as a Jedi "again". Jack, that is not Gubbinz.

BOOYAH!
PixelLord` },
    { id: 'junkscr', f: 'junk', d: '10-20', from: 'FREE STUFF!!! <free@free-screensavers-free.w3b>', subj: 'FREE SCREENSAVER!!! FISH!!! TOASTERS!!! FREE!!!', body: `GET THE BEST SCREENSAVER EVER!!! FOR FREE!!!

 * Fish that swim!!!
 * Toasters that fly!!!
 * Pipes that go everywhere!!!

Just open the attachment!!!` , att: [{ name: 'SCREENSAVER.EXE', type: 'exe', blocked: true }] },
    { id: 'junkspray', f: 'junk', d: '11-02', from: 'MILLENNIUM PROTECTION <spray@bug-be-gone-2000.w3b>', subj: 'KILL THE MILLENNIUM BUG WITH NEW BUG SPRAY!!!', body: `NEW!!! MILLENNIUM BUG SPRAY!!!

Just spray it on your computer and the Millennium Bug will DIE!!!

 * Kills 99.9% of all Millennium Bugs
 * Smells of lemons
 * Do NOT spray on your computer (it will break)

JACK'S NOTE: The Millennium Bug is not a real bug. It's a mistake in how computers write the year. You can't spray it. I asked Mr Okafor just in case.` },
    { id: 'dave1119', f: 'inbox', d: '11-19', from: DAVE, subj: 'SMASH. MY HOUSE. NOW.', body: `SMASH BROS IS OUT

my house

now

bring a controller (you DO need a controller this time)

i am pikachu. you are not pikachu. nobody else is pikachu.

dave` },
    { id: 'ryan1126', f: 'inbox', d: '11-26', from: RYAN, subj: 'y2k is rubbish', body: `alright

everyones going on about the millennium bug. its rubbish. most computers will be fine. my K6-2 is fine. i checked. with a program. that i downloaded. at 3K a second.

also the millennium doesnt even start till 2001 technically

(everyone at school told me to be quiet when i said that)

${Cast.slug('cousin2')}` },
    { id: 'gran1201', f: 'inbox', d: '12-01', from: GRAN, subj: 'WHAT DOES {NAMEUC} WANT FOR CHRISTMAS (DONT LET {NAMEUC} SEE THIS)', body: `DEAR [MOM]

WHAT DOES {NAMEUC} WANT FOR CHRISTMAS.

LAST YEAR I GOT {NAMEUC} SOCKS AND A JUMPER. I THINK THEY WENT DOWN WELL. THE SOCKS DID.

GRANDAD SAYS {NAMEUC} WANTS A "DREAM CAST". IS THAT A FISHING THING.

PLEASE DONT LET {NAMEUC} SEE THIS EMAIL.

LOVE MOM

P.S. I HAVE GONE ON THE FAMILY EMAIL AGAIN HAVENT I. OH WELL. HELLO {NAMEUC}. YOU ARE GETTING SOCKS.` },
    { id: 'n64dec', f: 'inbox', d: '12-13', from: N64, subj: 'N64 FAN CLUB NEWSLETTER - December 1999 (LAST ONE OF THE MILLENNIUM)', body: `=========================================
   THE N64 FAN CLUB - DECEMBER 1999
   *** THE LAST NEWSLETTER OF THE 1900s ***
=========================================

NEWS
 * DONKEY KONG 64 IS OUT! It comes with the Expansion Pak. The opening rap is... memorable. DK! Donkey Kong!
 * SUPER SMASH BROS. is out! Unlock Luigi by finishing Break the Targets with all 8 starting characters.

OUR TOP 5 N64 GAMES OF 1999 (as voted by members)
 1. Super Smash Bros.
 2. Donkey Kong 64
 3. Star Wars Episode I: Racer
 4. Mario Party
 5. GoldenEye (it's from 1997, but members voted for it anyway, every year, forever)

Merry Christmas and a Happy Millennium!
See you in the year 2000 (if the computers still work)!` },
    { id: 'bill1220', f: 'inbox', d: '12-20', from: BILL, subj: 'JackNet is Millennium Ready!', body: `Dear The Family,

We're pleased to tell you that JackNet is MILLENNIUM READY.

On the 1st of January 2000, your Internet will work exactly as it does now. (Slowly.)

Our engineers have checked every computer, every modem and every clock. Our office kettle is also Y2K compliant.

If your Internet does stop working on New Year's Day, please check:
 1. Is your computer on?
 2. Is someone on the phone?
 3. Is it actually just the hangover from the party? (adults only)

Happy Millennium!
JackNet Customer Accounts` },
    { id: 'mom1224', f: 'inbox', d: '12-24', from: MOM, subj: 'Christmas Eve', body: `{NAME},

It is Christmas Eve. Father Christmas only comes if you are asleep. Asleep means NOT ON THE COMPUTER.

Bed by 9:30. I have checked with Father Christmas and he says this is a firm rule.

Love Mom x

P.S. The mince pie and the carrot are on the side. Don't eat the mince pie.
P.P.S. I know you ate the mince pie last year.` },
    { id: 'gfc1229', f: 'inbox', d: '12-29', from: GFC, subj: 'HAPPY MILLENNIUM FROM THE FAN CLUB', body: `GUBBINZ FAN CLUB - MILLENNIUM MESSAGE

This year Gubbinz got fed 51,000 times (approx).
The Fan Club has 63 members!!!
Gubbinz has not said thank you once. That's how you know he's a real pet.

See you in 2000! If the Millennium Bug gets us, it was nice knowing you.

WAAAGH!!! (one last time for 1999)
PixelLord (President)
Jack (Vice-President)` },
    { id: 'dave1231', f: 'inbox', d: '12-31', from: DAVE, subj: 'PARTY TONIGHT!!!!!!!!', body: `MILLENNIUM PARTY AT MINE

bring:
- n64
- goldeneye
- your controllers (I've only got 2)
- a sleeping bag
- a torch (my dad says in case of the millennium bug)

my dad has bought 50 party poppers. FIFTY.

see you at 7

if the world ends at midnight, you were my best mate

(dont tell anyone i said that)

dave` },
    { id: 'junkdc', f: 'junk', d: '12-10', from: 'XMAS DEALS <xmas@christmas-console-deals.w3b>', subj: 'DREAM CONSOLE FOR £1!!!!!', body: `!!! CHRISTMAS DEAL !!!

GET A BRAND NEW GAMES CONSOLE FOR JUST £1*!!!

*You will receive a cardboard box with a picture of a console on it. The picture is very good.

REPLY NOW!!!` },
    { id: 'draftsanta', f: 'drafts', d: '11-24', from: JACK, to: 'Father Christmas <father.christmas@northpole.kidz>', subj: 'my list', body: `Dear Father Christmas,

Please see the attached list. Oh. I can't attach it. It's on paper. And also in my Lists folder.

Can you get e-mail at the North Pole? Is there a phone line? Do the elves pick up the phone when you're online?

Love {NAME}

(not sending this, the address probably doesn't work. Writing a proper letter instead.)` },
  ];
  // ================================================================ small shared helpers
  const tool = (a, label, svg) => `<button class="tool" type="button" data-a="${a}">${svg}<span>${label}</span></button>`;
  const TB = {
    back: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#36a336" stroke="#145214"/><path d="M14.5 6.5 9 12l5.5 5.5" stroke="#fff" stroke-width="3" fill="none"/></svg>',
    fwd: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#36a336" stroke="#145214"/><path d="M9.5 6.5 15 12l-5.5 5.5" stroke="#fff" stroke-width="3" fill="none"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M1 6h8l2 2h12v14H1z" fill="#f2d16b" stroke="#7a5a00"/><path d="M12 19v-8M8 14l4-4 4 4" stroke="#000" stroke-width="2" fill="none"/></svg>',
    props: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="#fff" stroke="#555"/><rect x="3" y="3" width="18" height="4" fill="#000080"/><path d="M6 11h12M6 14h12M6 17h8" stroke="#555"/></svg>',
    views: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="8" height="8" fill="#f2d16b" stroke="#7a5a00"/><rect x="13" y="3" width="8" height="8" fill="#fff" stroke="#555"/><path d="M2 15h4M8 15h13M2 19h4M8 19h13" stroke="#000080" stroke-width="2"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" stroke="#d42020" stroke-width="3.5"/></svg>',
    restore: '<svg viewBox="0 0 24 24"><path d="M4 4h10l5 5v11H4z" fill="#fff" stroke="#555"/><path d="M9 16a4 4 0 1 0 0-6" stroke="#1a9a1a" stroke-width="2" fill="none"/><path d="M6 8l3 2-3 2z" fill="#1a9a1a"/></svg>',
    empty: '<svg viewBox="0 0 24 24"><path d="M5 6h14l-2 16H7z" fill="#eef4f4" stroke="#000"/><path d="M9 8l1 12M12 8v12M15 8l-1 12" stroke="#6a8a8a"/><ellipse cx="12" cy="6" rx="8" ry="2" fill="#d4e4e4" stroke="#000"/></svg>',
  };
  if (window.JICON) Object.assign(TB, { back: JICON.get('tb-back', 24), fwd: JICON.get('tb-fwd', 24), up: JICON.get('tb-up', 24), props: JICON.get('tb-props', 24), views: JICON.get('tb-views', 24), del: JICON.get('tb-del', 24), restore: JICON.get('tb-restore', 24), empty: JICON.get('tb-empty', 24) });
  function promptBox(title, label, def, cb, opts) {
    const f = document.createElement('form');
    f.innerHTML = `<div style="margin-bottom:6px">${esc(label)}</div><input type="${opts && opts.pw ? 'password' : 'text'}" class="fx-pin" style="width:100%" autocomplete="off"><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="submit" style="min-width:72px">OK</button><button class="btn" type="button" style="min-width:72px">Cancel</button></div>`;
    const w = A.win(title, f, { w: 320, noResize: true, noMax: true, noMin: true, escClose: true, icon: (opts && opts.icon) || I.lock });
    const inp = f.querySelector('input'); inp.value = def || ''; setTimeout(() => { inp.focus(); inp.select(); }, 30);
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => { ev.preventDefault(); w.close(); cb(inp.value); });
    return w;
  }
  const showBrowser = () => { const b = document.getElementById('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } };
  const LOCS = new Set(); // open explorer refreshers
  const refreshAll = () => LOCS.forEach(f => f());
  const parentOf = node => { let hit = null; const walk = (n, trail) => { if (hit) return; for (const k of (n.kids || [])) { if (k === node) { hit = { dir: n, path: trail }; return; } if (k.type === 'dir') walk(k, trail + '\\' + k.name); } }; walk(A.fs.root, 'C:'); if (!hit) walk(FLOPPY, 'A:'); if (!hit) walk(CDROM, 'D:'); return hit; };

  // ================================================================ Explorer
  const VIEW = Object.assign({ mode: 'icons', hidden: false, web: true }, store.get(KEY.view, {}));
  const saveView = () => store.set(KEY.view, VIEW);
  const DRIVES = { 'A:': FLOPPY, 'D:': CDROM };
  let floppyIn = false, floppyTries = 0, cdSeen = false;
  const DIRDESC = {
    'C:\\My Documents': 'Jack\'s stuff. Homework, stories, lists, cheats, pictures and a diary (KEEP OUT).',
    'C:\\My Documents\\Diary': 'One file for every day something happened in 1999.',
    'C:\\My Documents\\My Pictures': 'Drawings, photos (developed and scanned at ' + CN('cousin2') + '\'s) and pixel art.',
    'C:\\My Documents\\Cheats': 'Tested cheats. Rumours are labelled as rumours.',
    'C:\\JACKOS': 'This folder contains files that keep your computer running. Mom says don\'t touch them.',
    'C:\\JACKOS\\Temp': 'Nobody looks in here. Nobody.',
    'C:\\Program Files': 'Programs live here. Some of them even work.',
    'C:\\JACKATAK': 'The files for the JACK ATTACK! website.',
    'C:\\JACKOS\\Media': 'Sounds. Double-click to play them (turn the sound on first!).',
    'C:\\JACKOS\\Favorites': 'Shortcuts to Jack\'s website.',
  };
  const normPath = p => { let s = String(p == null ? '' : p).trim().replace(/\//g, '\\').replace(/\\+$/, ''); s = s.replace(/^([a-z]):/i, (m, l) => l.toUpperCase() + ':'); return s; };
  function resolve(p) {
    const s = normPath(p), low = s.toLowerCase();
    if (!s || low === 'my computer') return { kind: 'mycomp', path: 'My Computer', name: 'My Computer' };
    if (low === 'printers') return { kind: 'printers', path: 'Printers', name: 'Printers' };
    if (low === 'dial-up networking') return { kind: 'dialup', path: 'Dial-Up Networking', name: 'Dial-Up Networking' };
    if (low === 'my documents') return resolve('C:\\My Documents');
    if (low === 'desktop') return resolve('C:\\JACKOS\\Desktop');
    const m = /^([A-Z]):(.*)$/.exec(s); if (!m) return null;
    const drive = m[1] + ':', root = drive === 'C:' ? A.fs.root : DRIVES[drive];
    if (!root) return null;
    let n = root, lock = null; const names = [drive];
    for (const part of m[2].split('\\').filter(Boolean)) { n = (n.kids || []).find(x => x.name.toLowerCase() === part.toLowerCase()); if (!n) return null; names.push(n.name); if (n.type === 'dir' && !lock && !isUnlocked(n)) lock = n; }
    return { kind: n.type === 'dir' ? 'dir' : 'file', node: n, path: names.length === 1 ? drive + '\\' : names.join('\\'), drive, lock, name: names.length === 1 ? (drive === 'C:' ? 'Jack\'s PC (C:)' : drive === 'A:' ? '3½ Floppy (A:)' : 'JACK ATTACK! CD (D:)') : n.name };
  }
  // ---- gates before entering a location (floppy, CD autorun, passwords)
  function gate(loc, ok) {
    if (loc.drive === 'A:' && !floppyIn) return floppyAsk(ok);
    if (loc.drive === 'D:' && !cdSeen) { cdSeen = true; autorun(); }
    if (loc.lock) return askPassword(loc.lock, ok);
    ok();
  }
  function floppyAsk(ok) {
    Sound.play('turn');
    Desk.msgbox('A:\\', 'A:\\ is not accessible.\n\nThe device is not ready. Please insert a disk into drive A:', 'warn', [['Retry', () => {
      floppyTries++;
      if (floppyTries >= 3) { floppyIn = true; Sound.play('thud'); Desk.toast('Drive A:', 'Clunk! There WAS a disk in there. It says "DAVE\'S DISK" on it in felt tip.', 5000); S('floppy'); ok(); }
      else setTimeout(() => floppyAsk(ok), 150);
    }], ['Cancel']]);
  }
  function askPassword(node, ok) {
    promptBox('Enter Password', `"${node.name}" is password protected.\n\nPassword:`, '', v => {
      if (String(v).trim().toUpperCase() === String(node.password).toUpperCase()) {
        unlocked[node.name] = 1; store.set(KEY.unlocked, unlocked); Sound.play('solve');
        Desk.toast('Access granted', 'Welcome, not-Dave.', 3000);
        if (node.secret) S(node.secret.replace(/^files\./, ''));
        refreshAll(); ok();
      } else {
        Sound.play('uhoh');
        const lines = ['Access denied. Nice try, Dave.', 'Wrong password. It\'s not "DAVE" either.', 'Access denied. The riddle is in Jack\'s lists.', 'Nope. Think like an Ork. What do Orks spend?'];
        misc.pwTries = (misc.pwTries || 0) + 1; setMisc('pwTries', misc.pwTries);
        Desk.msgbox('Access Denied', lines[Math.min(lines.length - 1, misc.pwTries - 1)], 'warn');
      }
    }, { pw: true });
  }
  function autorun() {
    const b = document.createElement('div'); b.className = 'fx-autorun';
    b.innerHTML = `<div class="fx-ar-logo">JACK<br>ATTACK!</div><div class="fx-ar-sub">COVER DISC #7 &middot; ISSUE 7</div><div class="fx-ar-btns"><button class="btn" data-ar="demos">Play the demos</button><button class="btn" data-ar="setup">Install</button><button class="btn" data-ar="browse">Browse this CD</button><button class="btn" data-ar="exit">Exit</button></div><div class="fx-ar-foot">Spinning up... whirrrrr</div>`;
    const w = A.win('JACK ATTACK! Cover Disc', b, { w: 360, noResize: true, noMax: true, icon: I.cd });
    Sound.play('turn'); setTimeout(() => Sound.play('startup'), 300);
    S('coverdisc');
    b.addEventListener('click', ev => { const a = ev.target.closest('[data-ar]'); if (!a) return; const k = a.dataset.ar; w.close(); if (k === 'demos') { showBrowser(); IE.go('demos', 'click'); } else if (k === 'setup') { if (window.Setup && Setup.coverDisc) Setup.coverDisc(); else runFake('setup'); } else if (k === 'browse') openExplorer('D:'); });
  }

  // ---- items shown in a location
  function itemsFor(loc) {
    if (loc.kind === 'mycomp') return [
      { name: '3½ Floppy (A:)', icon: I.floppy, type: 'Floppy Disk Drive', go: 'A:', drive: 'A:' },
      { name: 'Jack\'s PC (C:)', icon: I.hdd, type: 'Local Disk', go: 'C:', drive: 'C:' },
      { name: 'JACK ATTACK! CD (D:)', icon: I.cd, type: 'CD-ROM Disc', go: 'D:', drive: 'D:' },
      { name: 'Control Panel', icon: I.cpl, type: 'System Folder', act: () => A.open('control') },
      { name: 'Printers', icon: I.printer, type: 'System Folder', go: 'Printers' },
      { name: 'Dial-Up Networking', icon: I.dialup, type: 'System Folder', go: 'Dial-Up Networking' },
      { name: 'Scheduled Tasks', icon: I.sched, type: 'System Folder', act: () => Desk.msgbox('Scheduled Tasks', 'Scheduled tasks:\n\n- Tidy bedroom (overdue since 1998)\n- Feed Gubbinz (every day, 4pm)\n- ScanDisk (every time Dave switches the PC off at the wall)\n- Millennium (31/12/1999, 23:59:59)', 'info') },
    ];
    if (loc.kind === 'printers') return [
      { name: 'Add Printer', icon: I.printer, type: 'Wizard', act: () => Desk.msgbox('Add Printer Wizard', 'This wizard will help you install your printer.\n\nYou only have one printer. It is out of cyan. Adding another printer will not help. It will also be out of cyan.', 'info') },
      { name: 'Inkjet Printer', icon: I.printer, type: 'Printer (Default)', act: printQueue },
    ];
    if (loc.kind === 'dialup') return [
      { name: 'Make New Connection', icon: I.dialup, type: 'Wizard', act: () => Desk.msgbox('Make New Connection', 'Type a name for the computer you are dialling:\n\nThere is only one: JackNet 56K. It is the only Internet. (It isn\'t, but Dad says it is.)', 'info') },
      { name: 'JackNet 56K', icon: I.dialup, type: 'Dial-Up Connection', act: dialUp },
    ];
    const kids = (loc.node.kids || []).filter(k => VIEW.hidden || !k.hidden);
    kids.sort((a, b) => (a.type === 'dir') === (b.type === 'dir') ? a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) : a.type === 'dir' ? -1 : 1);
    return kids.map(k => ({ name: k.name, icon: iconOf(k), node: k, type: typeName(k), hidden: k.hidden }));
  }

  function openExplorer(start) {
    let loc = resolve(start == null ? 'My Computer' : start) || resolve('My Computer');
    const back = [], fwd = [];
    let sel = null, items = [];
    const b = document.createElement('div'); b.className = 'fx';
    b.innerHTML = `<div class="fx-tools">${tool('back', 'Back', TB.back)}${tool('fwd', 'Forward', TB.fwd)}${tool('up', 'Up', TB.up)}<span class="tsep"></span>${tool('del', 'Delete', TB.del)}${tool('props', 'Properties', TB.props)}${tool('views', 'Views', TB.views)}</div>
      <form class="fx-addr"><label>Address</label><span class="combo"><span class="pgico fx-aico"></span><input type="text" spellcheck="false" autocomplete="off" aria-label="Address"></span><button class="gobtn" type="submit"><svg viewBox="0 0 16 16"><path d="M2 8h9M7 3l5 5-5 5" stroke="#1a9a1a" stroke-width="2.5" fill="none"/></svg>Go</button></form>
      <div class="fx-main"><div class="fx-web"></div><div class="fx-list field" tabindex="0"></div></div>`;
    const w = A.win('My Computer', b, { w: 640, h: 440, menubar: true, status: true, icon: I.mycomp, minW: 260, minH: 200, cls: 'fxwin', onClose: () => LOCS.delete(render) });
    const st2 = document.createElement('span'), st3 = document.createElement('span'); w.status.parentNode.append(st2, st3); st2.className = 'fx-st2'; st3.className = 'fx-st3';
    const list = b.querySelector('.fx-list'), web = b.querySelector('.fx-web'), addr = b.querySelector('.fx-addr input');
    const locIcon = l => l.kind === 'mycomp' ? I.mycomp : l.kind === 'printers' ? I.printer : l.kind === 'dialup' ? I.dialup : l.path === 'C:\\' ? I.hdd : l.path === 'A:\\' ? I.floppy : l.path === 'D:\\' ? I.cd : l.path === 'C:\\My Documents' ? I.mydocs : I.folderOpen;
    function go(p, how) {
      const l = resolve(p);
      if (!l) { Desk.msgbox('Explorer', `Cannot find '${p}'. Make sure the path or Internet address is correct.`, 'warn'); addr.value = loc.path; return; }
      if (l.kind === 'file') { const n = l.node; gate(l, () => openNode(n)); addr.value = loc.path; return; }
      gate(l, () => { if (how !== 'hist') { back.push(loc.path); fwd.length = 0; } loc = resolve(l.path); sel = null; render(); if (how === 'typed') S('address'); if (loc.node && loc.node.secret && loc.node.secret !== 'files.locked') S(loc.node.secret.replace(/^files\./, '')); list.scrollTop = 0; });
    }
    function render() {
      if (w.closed) return;
      if (loc.node && !resolve(loc.path)) loc = resolve('My Computer');
      if (loc.node) loc = resolve(loc.path) || loc;
      if (loc.lock && loc.node) loc = resolve('My Computer');
      items = itemsFor(loc);
      w.setTitle(loc.name); w.el.querySelector('.tb .ico').innerHTML = locIcon(loc); w.task.querySelector('.tico').innerHTML = locIcon(loc);
      addr.value = loc.path; b.querySelector('.fx-aico').innerHTML = locIcon(loc);
      list.className = 'fx-list field ' + (VIEW.mode === 'details' ? 'fx-details' : 'fx-icons');
      b.querySelector('.fx-main').classList.toggle('noweb', !VIEW.web);
      const head = VIEW.mode === 'details' ? `<div class="fx-row fx-hd"><span>Name</span><span>Size</span><span>Type</span><span>Modified</span></div>` : '';
      list.innerHTML = head + items.map((it, i) => VIEW.mode === 'details'
        ? `<button type="button" class="fx-row fx-it${it.hidden ? ' fx-hid' : ''}" data-i="${i}"><span class="fx-nm">${ICO16(it.icon)}<span>${esc(it.name)}</span></span><span>${it.node && it.node.type !== 'dir' ? kbCol(bytesOf(it.node)) : ''}</span><span>${esc(it.type)}</span><span>${it.node ? esc(dateOf(it.node) + ' ' + fakeTime(it.name)) : ''}</span></button>`
        : `<button type="button" class="fx-it${it.hidden ? ' fx-hid' : ''}" data-i="${i}" title="${esc(it.name)}"><span class="fx-ic">${it.icon}</span><span class="fx-lb">${esc(it.name)}</span></button>`).join('') + (items.length ? '' : '<div class="fx-emptymsg">This folder is empty.</div>');
      back.length ? enable('back') : disable('back'); fwd.length ? enable('fwd') : disable('fwd');
      loc.kind === 'mycomp' ? disable('up') : enable('up');
      status(); webView();
    }
    const btn = a => b.querySelector(`[data-a="${a}"]`);
    const enable = a => { btn(a).disabled = false; }, disable = a => { btn(a).disabled = true; };
    function status() {
      const s = items[sel];
      if (s) { w.status.textContent = s.node ? `${s.type}` : s.type; st2.textContent = s.node && s.node.type !== 'dir' ? fmtSize(bytesOf(s.node)) : s.drive === 'C:' ? 'Free Space: 1.21GB, Capacity: 6.4GB' : ''; }
      else {
        const hid = loc.node ? (loc.node.kids || []).filter(k => k.hidden).length : 0;
        w.status.textContent = `${items.length} object(s)` + (!VIEW.hidden && hid ? ` (plus ${hid} hidden)` : '');
        st2.textContent = loc.node ? fmtSize(items.reduce((t, it) => t + (it.node && it.node.type !== 'dir' ? bytesOf(it.node) : 0), 0)) : '';
      }
      st3.innerHTML = loc.kind === 'dir' && loc.drive === 'C:' ? `${ICO16(I.mycomp)} My Computer` : loc.drive === 'D:' ? `${ICO16(I.cd)} CD-ROM` : loc.drive === 'A:' ? `${ICO16(I.floppy)} Floppy` : `${ICO16(I.mycomp)} My Computer`;
      btn('del').disabled = !(s && s.node && s.node.user);
      btn('props').disabled = !(s || loc.node);
      list.querySelectorAll('.fx-it').forEach(e => e.classList.toggle('sel', +e.dataset.i === sel));
    }
    function webView() {
      const s = items[sel];
      let h = `<div class="fx-wico">${locIcon(loc)}</div><div class="fx-wtitle">${esc(loc.name)}</div><div class="fx-wrule"></div>`;
      if (s) {
        h += `<b>${esc(s.name)}</b><br>${esc(s.type)}`;
        if (s.node) h += `<br><br>Modified:<br>${esc(dateOf(s.node))} ${fakeTime(s.name)}` + (s.node.type !== 'dir' ? `<br><br>Size: ${fmtSize(bytesOf(s.node))}` : '') + (s.node.hidden ? '<br><br>Attributes: Hidden' : '') + (s.node.locked ? `<br><br>${isUnlocked(s.node) ? 'Unlocked. Welcome back.' : 'Locked. Password required.'}` : '');
        if (s.drive === 'C:') h += `<br><br>Capacity: 6.4GB<div class="fx-pie"></div><span class="fx-key u"></span>Used: 5.19GB<br><span class="fx-key f"></span>Free: 1.21GB`;
        if (s.drive === 'A:') h += '<br><br>' + (floppyIn ? '1.44MB disk: "DAVE\'S DISK"' : 'No disk inserted. (Probably.)');
        if (s.drive === 'D:') h += '<br><br>JACK ATTACK! Cover Disc #7<br>650MB CD-ROM';
      } else if (loc.kind === 'mycomp') h += 'Displays the files and folders on your computer.<br><br>Select an item to view its description.';
      else if (loc.kind === 'printers') h += 'Use the Printers folder to add or change printers. The printer is out of cyan.';
      else if (loc.kind === 'dialup') h += 'Connect to the Internet with your modem. Make sure nobody needs the phone.';
      else h += esc(DIRDESC[loc.path] || 'Select an item to view its description.');
      web.innerHTML = h;
    }
    function openItem(i) {
      const it = items[i]; if (!it) return;
      Sound.play('click');
      if (it.act) return it.act();
      if (it.go) return go(it.go);
      if (it.node.type === 'dir') return go((loc.path.endsWith('\\') ? loc.path : loc.path + '\\') + it.node.name);
      openNode(it.node);
    }
    function props(i) {
      const it = items[i];
      if (it && it.drive) return driveProps(it.drive);
      if (it && it.node) return nodeProps(it.node, loc.path);
      if (!it && loc.node) return loc.path.length <= 3 ? driveProps(loc.drive) : nodeProps(loc.node, loc.path.replace(/\\[^\\]+$/, ''));
      if (it) Desk.msgbox(it.name, `${it.name}\n\nType: ${it.type}`, 'info');
    }
    function del(i) {
      const it = items[i]; if (!it || !it.node) return;
      if (!it.node.user) {
        const why = /JACKOS/i.test(loc.path) ? 'MOM.SYS says no.' : /Program Files/i.test(loc.path) ? 'This program is in use. (Somebody is always using it.)' : loc.drive !== 'C:' ? 'The disk is write-protected.' : 'Jack would be really upset. These are Jack\'s files.';
        return Desk.msgbox('Error Deleting File', `Cannot delete ${it.name}: Access is denied.\n\n${why}`, 'warn');
      }
      Desk.msgbox('Confirm File Delete', `Are you sure you want to send '${it.name}' to the Recycle Bin?`, 'q', [['Yes', () => { trashUserDoc(it.node, loc.path); }], ['No']]);
    }
    function ctx(ev, i) {
      ev.preventDefault();
      if (i != null) { sel = i; status(); webView(); }
      const it = items[i];
      const menu = it ? [
        { label: 'Open', act: () => openItem(i) },
        ...(it.node && it.node.type === 'txt' ? [{ label: 'Edit', act: () => openNotepad({ name: it.node.name, text: it.node.text, node: it.node }) }] : []),
        ...(it.node && it.node.type !== 'dir' ? [{ label: 'Send To', sub: [{ label: '3½ Floppy (A:)', icon: I.floppy, act: () => Desk.msgbox('Copying...', floppyIn ? 'Cannot copy: the disk is write-protected. (Dave put a sticker over the hole.)' : 'Please insert a disk into drive A:', 'warn') }, { label: 'Desktop (create shortcut)', act: () => Desk.toast('Shortcut', 'The desktop is full. Jack keeps it tidy. (It\'s the only tidy thing he owns.)') }, { label: 'Mail Recipient', icon: I.mail, act: () => compose({ subj: it.node.name, body: `(attached: ${it.node.name})\n`, att: [{ name: it.node.name, node: it.node }] }) }] }] : []),
        '-',
        { label: 'Cut', dis: true }, { label: 'Copy', dis: true },
        '-',
        { label: 'Delete', act: () => del(i), dis: !it.node },
        { label: 'Rename', dis: true },
        '-',
        { label: 'Properties', act: () => props(i) },
      ] : viewMenu();
      IE.menu(menu, ev.clientX, ev.clientY);
    }
    const viewMenu = () => [
      { label: 'Large Icons', rad: VIEW.mode === 'icons', act: () => { VIEW.mode = 'icons'; saveView(); render(); } },
      { label: 'Details', rad: VIEW.mode === 'details', act: () => { VIEW.mode = 'details'; saveView(); render(); } },
      '-',
      { label: 'as Web Page', chk: VIEW.web, act: () => { VIEW.web = !VIEW.web; saveView(); render(); } },
      { label: 'Show hidden files', chk: VIEW.hidden, act: () => { VIEW.hidden = !VIEW.hidden; saveView(); refreshAll(); } },
      '-',
      { label: 'Refresh', key: 'F5', act: render },
    ];
    // events
    let lastTap = 0, lastI = -1;
    list.addEventListener('click', ev => {
      const e = ev.target.closest('.fx-it');
      if (!e) { sel = null; status(); webView(); return; }
      const i = +e.dataset.i, now = Date.now();
      if (touch() || (i === lastI && now - lastTap < 450)) { lastTap = 0; sel = i; status(); openItem(i); return; }
      lastTap = now; lastI = i; sel = i; status(); webView();
    });
    list.addEventListener('contextmenu', ev => { const e = ev.target.closest('.fx-it'); ctx(ev, e ? +e.dataset.i : null); });
    list.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && sel != null) { ev.preventDefault(); openItem(sel); }
      else if (ev.key === 'Backspace') { ev.preventDefault(); up(); }
      else if (ev.key === 'Delete' && sel != null) del(sel);
      else if (ev.key === 'F5') { ev.preventDefault(); render(); }
      else if (/^Arrow/.test(ev.key) && items.length) { ev.preventDefault(); const d = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : -1; sel = sel == null ? 0 : Math.max(0, Math.min(items.length - 1, sel + d)); status(); webView(); const el = list.querySelector(`[data-i="${sel}"]`); if (el) el.scrollIntoView({ block: 'nearest' }); }
    });
    function up() {
      if (loc.kind !== 'dir') return go('My Computer');
      if (/^[A-Z]:\\$/.test(loc.path)) return go('My Computer');
      go(loc.path.replace(/\\[^\\]+$/, '').replace(/^([A-Z]:)$/, '$1\\'));
    }
    b.querySelector('.fx-tools').addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a || a.disabled) return;
      const k = a.dataset.a;
      if (k === 'back' && back.length) { fwd.push(loc.path); go(back.pop(), 'hist'); }
      else if (k === 'fwd' && fwd.length) { back.push(loc.path); go(fwd.pop(), 'hist'); }
      else if (k === 'up') up();
      else if (k === 'props') props(sel);
      else if (k === 'del') del(sel);
      else if (k === 'views') { const r = a.getBoundingClientRect(); IE.menu(viewMenu(), r.left, r.bottom); }
    });
    b.querySelector('.fx-addr').addEventListener('submit', ev => {
      ev.preventDefault(); const v = addr.value.trim(); addr.blur();
      if (/^(https?:|www\.)|\.com|\.co\.uk/i.test(v)) { showBrowser(); IE.navigate(v); return; }
      if (/^recycle bin$/i.test(v)) return openBin();
      if (/^control panel$/i.test(v)) return A.open('control');
      go(v, 'typed');
    });
    addr.addEventListener('focus', () => addr.select());
    const favs = () => { const f = A.fs.get('C:/JACKOS/Favorites'); return f ? f.kids.filter(k => k.type === 'lnk').map(k => ({ label: k.name.replace(/\.url$/, ''), icon: I.url, act: () => A.openFile(k) })) : []; };
    A.menubar(w, [
      ['File', () => [
        { label: 'Open', dis: sel == null, act: () => openItem(sel) },
        { label: 'New', sub: [{ label: 'Folder', act: () => Desk.msgbox('New Folder', 'You can\'t make new folders on Jack\'s computer. He has a system. (The system is chaos.)', 'info') }, { label: 'Text Document', icon: I.txt, act: () => openNotepad({}) }] },
        '-',
        { label: 'Delete', dis: !(items[sel] && items[sel].node), act: () => del(sel) },
        { label: 'Rename', dis: true },
        { label: 'Properties', act: () => props(sel) },
        '-',
        { label: 'Close', act: w.close },
      ]],
      ['Edit', [{ label: 'Undo', dis: true, key: 'Ctrl+Z' }, '-', { label: 'Cut', dis: true, key: 'Ctrl+X' }, { label: 'Copy', dis: true, key: 'Ctrl+C' }, { label: 'Paste', dis: true, key: 'Ctrl+V' }, '-', { label: 'Select All', dis: true, key: 'Ctrl+A' }]],
      ['View', () => [{ label: 'Toolbars', sub: [{ label: 'Standard Buttons', chk: true }, { label: 'Address Bar', chk: true }] }, { label: 'Status Bar', chk: true }, '-', ...viewMenu()]],
      ['Go', () => [
        { label: 'Back', dis: !back.length, act: () => btn('back').click() }, { label: 'Forward', dis: !fwd.length, act: () => btn('fwd').click() }, { label: 'Up One Level', act: up },
        '-',
        { label: 'My Computer', icon: I.mycomp, act: () => go('My Computer') }, { label: 'My Documents', icon: I.mydocs, act: () => go('C:\\My Documents') }, { label: 'Recycle Bin', icon: binFull() ? I.binFull : I.binEmpty, act: openBin },
        { label: 'Mail', icon: I.mail, act: () => A.open('outlook') }, { label: 'Home Page', icon: I.url, act: () => { showBrowser(); IE.go('home', 'click'); } },
      ]],
      ['Favorites', favs],
      ['Help', [{ label: 'Help Topics', act: () => openNotepad({ name: 'Explorer Help.txt', text: EXPLORER_HELP }) }, '-', { label: 'About JackOS', act: () => Desk.msgbox('About JackOS', 'JackOS 98\nVersion 4.10.1999\n\nThis product is licensed to:\nJack (and his Mom)\n\nPhysical memory available to JackOS: 65,024 KB\nSystem resources: 87% free (13% is Gubbinz)', 'info') }]],
    ]);
    LOCS.add(render);
    const want = loc.path; loc = resolve('My Computer');
    render();
    if (want !== 'My Computer') go(want, 'hist');
    setTimeout(() => list.focus(), 50);
    return w;
  }
  const EXPLORER_HELP = `EXPLORER HELP
=============

To open a file or folder: double-click it. (Or click it once and press Enter.)
To see what a file is: click it once and look on the left, or press Properties.
To go back up: press Up, or Backspace.
To type where you want to go: click in the Address bar, type (like C:\\JACKOS), press Enter.

To see hidden files: View > Show hidden files.
  (Hidden files are hidden for a reason. Usually the reason is "nobody wanted you to see them".)

The Recycle Bin is on the desktop. Things in there can be restored.
Drive A: is the floppy drive. Drive D: is the CD-ROM.

If you get lost: Go > My Computer.
`;
  function openNode(node) {
    if (node.locked && !isUnlocked(node)) return askPassword(node, () => openExplorer(A.fs.pathOf(node)));
    if (node.type === 'dir') return openExplorer(A.fs.pathOf(node));
    A.openFile(node);
  }

  // ---- Properties dialogs
  function nodeProps(n, where) {
    const b = document.createElement('div'); b.className = 'fx-props';
    const bytes = n.type === 'dir' ? dirBytes(n) : bytesOf(n), files = [], dirs = [];
    if (n.type === 'dir') (function walk(d) { (d.kids || []).forEach(k => { (k.type === 'dir' ? dirs : files).push(k); if (k.type === 'dir') walk(k); }); })(n);
    const locked = n.locked && !isUnlocked(n);
    b.innerHTML = `<div class="tabs"><span class="on">General</span>${n.type === 'dir' ? '<span>Sharing</span>' : ''}</div><div class="tabpage">
      <div class="fx-pr-top">${iconOf(n)}<input type="text" readonly value="${esc(n.name)}"></div><hr>
      <table><tr><td>Type:</td><td>${esc(typeName(n))}</td></tr><tr><td>Location:</td><td>${esc(where)}</td></tr>
      <tr><td>Size:</td><td>${locked ? '???' : longBytes(bytes)}</td></tr><tr><td>Size on disk:</td><td>${locked ? '???' : longBytes(Math.max(4096, Math.ceil(bytes / 4096) * 4096))}</td></tr>
      ${n.type === 'dir' ? `<tr><td>Contains:</td><td>${locked ? 'Password protected' : `${files.length} Files, ${dirs.length} Folders`}</td></tr>` : ''}</table><hr>
      <table><tr><td>MS-DOS name:</td><td>${esc(dosName(n))}</td></tr><tr><td>Created:</td><td>${esc(dateOf(n))} ${fakeTime(n.name + 'c')}</td></tr>${n.type !== 'dir' ? `<tr><td>Modified:</td><td>${esc(dateOf(n))} ${fakeTime(n.name)}</td></tr><tr><td>Accessed:</td><td>${todayStr()}</td></tr>` : ''}</table><hr>
      <div class="fx-attr">Attributes: <label><input type="checkbox" ${n.user ? '' : 'checked'} disabled> Read-only</label> <label><input type="checkbox" ${n.hidden ? 'checked' : ''} disabled> Hidden</label> <label><input type="checkbox" checked disabled> Archive</label>${/JACKOS/.test(where) ? ' <label><input type="checkbox" checked disabled> System</label>' : ''}</div>
    </div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" style="min-width:72px">OK</button><button class="btn" type="button" style="min-width:72px">Cancel</button><button class="btn" type="button" disabled style="min-width:72px">Apply</button></div>`;
    const w = A.win(n.name + ' Properties', b, { w: 340, noResize: true, noMax: true, noMin: true, escClose: true, icon: iconOf(n) });
    b.querySelectorAll('.btn').forEach(x => x.addEventListener('click', w.close));
    return w;
  }
  function driveProps(drive) {
    const D = { 'C:': ['JACKS PC', 'Local Disk', 'FAT32', 5.19, 1.21], 'A:': ["DAVE'S DISK", '3½ Inch Floppy Disk', 'FAT', 0.0011, 0.0003], 'D:': ['JACKATTACK7', 'CD-ROM Disc', 'CDFS', 0.61, 0] }[drive];
    if (drive === 'A:' && !floppyIn) return floppyAsk(() => driveProps('A:'));
    const gb = v => v < 0.01 ? Math.round(v * 1048576) + 'KB' : v.toFixed(2) + 'GB';
    const pct = Math.round(D[3] / (D[3] + D[4] || 1) * 100);
    const b = document.createElement('div'); b.className = 'fx-props';
    b.innerHTML = `<div class="tabs"><span class="on">General</span><span>Tools</span></div><div class="tabpage">
      <div class="fx-pr-top">${drive === 'A:' ? I.floppy : drive === 'D:' ? I.cd : I.hdd}<input type="text" readonly value="${esc(D[0])}"></div><hr>
      <table><tr><td>Type:</td><td>${D[1]}</td></tr><tr><td>File system:</td><td>${D[2]}</td></tr></table><hr>
      <table><tr><td><span class="fx-key u"></span>Used space:</td><td>${gb(D[3])}</td></tr><tr><td><span class="fx-key f"></span>Free space:</td><td>${gb(D[4])}</td></tr><tr><td>Capacity:</td><td>${drive === 'C:' ? '6.4GB' : drive === 'A:' ? '1.44MB' : '650MB'}</td></tr></table>
      <div class="fx-bigpie" style="--p:${pct}"></div><div style="text-align:center">Drive ${drive.replace(':', '')}</div>
      ${drive === 'C:' ? '<div class="row" style="justify-content:center;margin-top:6px"><button class="btn fx-clean" type="button">Disk Cleanup</button></div>' : ''}
    </div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn fx-ok" type="button" style="min-width:72px">OK</button><button class="btn fx-ok" type="button" style="min-width:72px">Cancel</button></div>`;
    const w = A.win(`${D[0]} (${drive}) Properties`, b, { w: 330, noResize: true, noMax: true, noMin: true, escClose: true, icon: I.hdd });
    b.querySelectorAll('.fx-ok').forEach(x => x.addEventListener('click', w.close));
    const cl = b.querySelector('.fx-clean'); if (cl) cl.addEventListener('click', () => Desk.msgbox('Disk Cleanup', 'Disk Cleanup has finished checking drive C:.\n\nYou can free up 0 bytes.\n\nJack has already deleted everything he can. Except the GoldenEye times. Those stay forever.', 'info'));
  }

  // ---- printers and dial-up
  function printQueue() {
    const b = document.createElement('div');
    b.innerHTML = `<div class="field fx-q"><div class="fx-row fx-hd"><span>Document Name</span><span>Status</span><span>Owner</span><span>Pages</span></div>
      <div class="fx-row"><span>maths homework.txt</span><span>Error - Out of cyan</span><span>Jack</span><span>1</span></div>
      <div class="fx-row"><span>GUBBINZ POSTER (giant).bmp</span><span>Paused (Mom said no)</span><span>Jack</span><span>40</span></div>
      <div class="fx-row"><span>shopping list.txt</span><span>Waiting</span><span>Mom</span><span>1</span></div>
      <div class="fx-row"><span>Championship Manager squad.txt</span><span>Waiting</span><span>Dad</span><span>12</span></div></div>
      <div class="row" style="justify-content:space-between;margin-top:8px"><button class="btn fx-test" type="button">Print Test Page</button><button class="btn fx-x" type="button">Close</button></div>`;
    const w = A.win('Inkjet Printer', b, { w: 460, icon: I.printer, status: true, noMax: true });
    w.status.textContent = '4 document(s) in queue. Printer: Out of cyan.';
    b.querySelector('.fx-x').addEventListener('click', w.close);
    b.querySelector('.fx-test').addEventListener('click', () => {
      w.status.textContent = 'Printing test page... KRRRK-KRRRK-KRRRK-ZZZT';
      Sound.play('dice'); setTimeout(() => Sound.play('dice'), 400); setTimeout(() => Sound.play('thud'), 900);
      setTimeout(() => { S('testpage'); Desk.msgbox('Printer Test Page', 'A test page is now being sent to the printer.\n\nIt came out... magenta and yellow. Everything is orange and pink. The JackOS logo looks like a sunset.\n\nThe printer is out of cyan.', 'info'); w.status.textContent = '4 document(s) in queue. Printer: STILL out of cyan.'; }, 1600);
    });
  }
  function dialUp() {
    const b = document.createElement('form');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${I.dialup.replace('<svg', '<svg width="32" height="32"')}<b>JackNet 56K</b></div>
      <table class="fx-dt"><tr><td>User name:</td><td><input type="text" value="thefamily" readonly></td></tr><tr><td>Password:</td><td><input type="password" value="squigsquig" readonly></td></tr><tr><td></td><td><label><input type="checkbox" checked disabled> Save password</label></td></tr>
      <tr><td>Phone number:</td><td><input type="text" value="01632 960199" readonly></td></tr><tr><td>Dialling from:</td><td><select><option>Jack's bedroom</option></select></td></tr></table>
      <div class="fx-dstat"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="submit" style="min-width:72px">Connect</button><button class="btn fx-x" type="button" style="min-width:72px">Cancel</button></div>`;
    const w = A.win('Connect To', b, { w: 340, noResize: true, noMax: true, icon: I.dialup });
    const st = b.querySelector('.fx-dstat'); let t = [];
    b.querySelector('.fx-x').addEventListener('click', () => { t.forEach(clearTimeout); w.close(); });
    b.addEventListener('submit', ev => {
      ev.preventDefault(); b.querySelector('button[type=submit]').disabled = true; Sound.play('modem');
      const steps = [[0, 'Dialling 01632 960199...'], [2200, 'Dialling... (BEEEE-DOOOO)'], [4200, 'Verifying user name and password...'], [6200, 'Logging on to network... (KSSSHHHHHH)'], [8000, null]];
      t = steps.map(([ms, s]) => setTimeout(() => {
        if (w.closed) return;
        if (s) { st.textContent = s; return; }
        w.close(); S('dialup');
        Desk.msgbox('Dial-Up Networking', 'Connection to JackNet 56K was terminated.\n\nMom picked up the phone downstairs to ring ' + CN('auntie') + '.\n\nTry again after 8pm. (No wait, that\'s bedtime.)', 'warn');
      }, ms));
    });
  }
  // ================================================================ Notepad (the full one)
  const docs = store.get(KEY.docs, {});
  const saveDocs = () => store.set(KEY.docs, docs);
  const userNode = name => ({ name, type: 'txt', user: true, get text() { return (docs[name] || {}).text || ''; }, get date() { return (docs[name] || {}).date || todayStr(); } });
  Object.keys(docs).forEach(n => A.fs.add(MD, userNode(n)));
  let clip = '';
  const badName = n => /[\\/:*?"<>|]/.test(n);
  function openNotepad(o) {
    o = o || {};
    let name = o.name || 'Untitled', node = o.node || null, wrap = store.get('jhp_files_npwrap', true);
    let saved = o.text || '', findQ = '', findCase = false, findUp = false;
    const b = document.createElement('div'); b.className = 'np';
    b.innerHTML = '<textarea spellcheck="false" aria-label="Text"></textarea>';
    const ta = b.querySelector('textarea'); ta.value = saved; ta.setSelectionRange(0, 0); ta.wrap = wrap ? 'soft' : 'off'; ta.classList.toggle('nowrap', !wrap);
    const w = A.win(name + ' - Notepad', b, { w: 560, h: 420, menubar: true, icon: I.notepad, cls: 'npwin', minW: 240, minH: 150 });
    const dirty = () => ta.value !== saved;
    const title = () => w.setTitle(name + ' - Notepad');
    const ins = s => { ta.focus(); if (!document.execCommand('insertText', false, s)) { const a = ta.selectionStart; ta.setRangeText(s, a, ta.selectionEnd, 'end'); } };
    function save(then) {
      if (!node || !node.user) {
        if (node && !node.user) return Desk.msgbox('Notepad', `${name}\n\nThis file is read-only. (It's one of Jack's.)\n\nSave a copy with a different name?`, 'warn', [['Save As...', () => saveAs(then)], ['Cancel']]);
        return saveAs(then);
      }
      write(name, then);
    }
    function write(n, then) {
      docs[n] = { text: ta.value, date: todayStr() }; saveDocs();
      const existing = A.fs.get(MD + '/' + n);
      if (!existing || !existing.user) A.fs.add(MD, userNode(n));
      node = A.fs.get(MD + '/' + n); name = n; saved = ta.value; title(); refreshAll();
      Desk.toast('Notepad', `Saved to C:\\My Documents\\${n}`, 2500);
      S('save');
      if (then) then();
    }
    function saveAs(then) {
      const f = document.createElement('form'); f.className = 'np-dlg';
      const mine = () => (A.fs.get(MD).kids || []).filter(k => k.type === 'txt' && !k.hidden);
      f.innerHTML = `<div class="row" style="flex-wrap:nowrap"><label style="width:70px">Save in:</label><select style="flex:1;min-width:0"><option>My Documents</option></select></div>
        <div class="field np-files">${mine().map(k => `<button type="button" class="np-f" data-n="${esc(k.name)}">${ICO16(iconOf(k))}<span>${esc(k.name)}</span></button>`).join('')}</div>
        <div class="row" style="flex-wrap:nowrap"><label style="width:70px">File name:</label><input type="text" style="flex:1;min-width:0" autocomplete="off"><button class="btn" type="submit" style="min-width:64px">Save</button></div>
        <div class="row" style="flex-wrap:nowrap;margin-top:4px"><label style="width:70px">Save as type:</label><select style="flex:1;min-width:0"><option>Text Documents (*.txt)</option></select><button class="btn" type="button" data-x style="min-width:64px">Cancel</button></div>`;
      const d = A.win('Save As', f, { w: 400, noResize: true, noMax: true, noMin: true, escClose: true, icon: I.notepad });
      const inp = f.querySelector('input'); inp.value = name === 'Untitled' || (node && !node.user) ? (name === 'Untitled' ? '*.txt' : 'Copy of ' + name) : name; setTimeout(() => { inp.focus(); inp.select(); }, 30);
      f.querySelector('.np-files').addEventListener('click', ev => { const e = ev.target.closest('.np-f'); if (e) inp.value = e.dataset.n; });
      f.querySelector('[data-x]').addEventListener('click', d.close);
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        let n = inp.value.trim(); if (!n || n === '*.txt') return;
        if (badName(n)) return Desk.msgbox('Save As', 'A filename cannot contain any of the following characters:\n\\ / : * ? " < > |', 'warn');
        if (!/\.[a-z0-9]{1,4}$/i.test(n)) n += '.txt';
        if (n.length > 60) return Desk.msgbox('Save As', 'That filename is too long. Even for 1999.', 'warn');
        const ex = A.fs.get(MD + '/' + n);
        if (ex && !ex.user) return Desk.msgbox('Save As', `${n}\n\nAccess is denied. That's one of Jack's files. Pick another name.`, 'warn');
        const go = () => { d.close(); write(n, then); };
        if (ex && ex.user && n !== name) return Desk.msgbox('Save As', `${n} already exists.\nDo you want to replace it?`, 'q', [['Yes', go], ['No']]);
        go();
      });
    }
    function confirmLeave(next) {
      if (!dirty()) return next();
      Desk.msgbox('Notepad', `The text in the ${name} file has changed.\n\nDo you want to save the changes?`, 'warn', [['Yes', () => save(next)], ['No', next], ['Cancel']]);
    }
    w.el.querySelector('[data-w=close]').addEventListener('click', ev => { if (dirty() && !w.closed) { ev.stopImmediatePropagation(); confirmLeave(() => { saved = ta.value; w.close(); }); } }, true);
    function load(n2, nd) { node = nd || null; name = n2; saved = nd ? (nd.text || '') : ''; ta.value = saved; ta.setSelectionRange(0, 0); title(); ta.scrollTop = 0; }
    function openDlg() {
      let cur = MD;
      const f = document.createElement('form'); f.className = 'np-dlg';
      f.innerHTML = `<div class="row" style="flex-wrap:nowrap"><label style="width:60px">Look in:</label><span class="field np-look"></span><button class="btn np-up" type="button" title="Up One Level">${TB.up}</button></div>
        <div class="field np-files"></div>
        <div class="row" style="flex-wrap:nowrap"><label style="width:60px">File name:</label><input type="text" style="flex:1;min-width:0" autocomplete="off"><button class="btn" type="submit" style="min-width:64px">Open</button></div>
        <div class="row" style="flex-wrap:nowrap;margin-top:4px"><label style="width:60px">Files of type:</label><select style="flex:1;min-width:0"><option>Text Documents (*.txt)</option></select><button class="btn" type="button" data-x style="min-width:64px">Cancel</button></div>`;
      const d = A.win('Open', f, { w: 400, noResize: true, noMax: true, noMin: true, escClose: true, icon: I.notepad });
      const inp = f.querySelector('input');
      const draw = () => {
        const dir = A.fs.get(cur) || A.fs.get(MD);
        f.querySelector('.np-look').innerHTML = ICO16(I.folderOpen) + ' ' + esc(cur.split('/').pop());
        const ks = (dir.kids || []).filter(k => (k.type === 'dir' || k.type === 'txt') && (VIEW.hidden || !k.hidden)).sort((a, b2) => (a.type === 'dir') === (b2.type === 'dir') ? a.name.localeCompare(b2.name) : a.type === 'dir' ? -1 : 1);
        f.querySelector('.np-files').innerHTML = ks.map(k => `<button type="button" class="np-f" data-n="${esc(k.name)}">${ICO16(iconOf(k))}<span>${esc(k.name)}</span></button>`).join('') || '<i style="color:#666;padding:4px">(empty)</i>';
      };
      const pick = n => {
        const k = A.fs.get(cur + '/' + n);
        if (!k) return Desk.msgbox('Open', `${n}\nFile not found.\nPlease verify the correct file name was given.`, 'warn');
        if (k.type === 'dir') { if (!isUnlocked(k)) return askPassword(k, () => { cur += '/' + k.name; draw(); }); cur += '/' + k.name; inp.value = ''; return draw(); }
        d.close(); confirmLeave(() => { if (k.future) return A.openFile(k); load(k.name, k); if (k.diary) diaryRead(k); if (k.secret) A.secret(k.secret); });
      };
      let lt = 0, ln = '';
      f.querySelector('.np-files').addEventListener('click', ev => { const e = ev.target.closest('.np-f'); if (!e) return; const n = e.dataset.n, now = Date.now(); inp.value = n; if (touch() || (n === ln && now - lt < 450)) pick(n); lt = now; ln = n; });
      f.querySelector('.np-up').addEventListener('click', () => { if (cur.split('/').length > 1) { cur = cur.replace(/\/[^/]+$/, ''); draw(); } });
      f.querySelector('[data-x]').addEventListener('click', d.close);
      f.addEventListener('submit', ev => { ev.preventDefault(); if (inp.value.trim()) pick(inp.value.trim()); });
      draw(); setTimeout(() => inp.focus(), 30);
    }
    function findNext() {
      if (!findQ) return findDlg();
      const hay = findCase ? ta.value : ta.value.toLowerCase(), q = findCase ? findQ : findQ.toLowerCase();
      const i = findUp ? hay.lastIndexOf(q, ta.selectionStart - 1) : hay.indexOf(q, ta.selectionEnd);
      if (i < 0) return Desk.msgbox('Notepad', `Cannot find "${findQ}"`, 'info');
      ta.focus(); ta.setSelectionRange(i, i + q.length); scrollToSel(i);
    }
    function scrollToSel(i) { // measure where the match is with a hidden copy of the textarea
      const m = document.createElement('div'), cs = getComputedStyle(ta);
      m.style.cssText = `position:absolute;visibility:hidden;white-space:${wrap ? 'pre-wrap' : 'pre'};overflow-wrap:break-word;width:${ta.clientWidth}px;font:${cs.font};padding:${cs.padding};line-height:${cs.lineHeight}`;
      m.textContent = ta.value.slice(0, i) + '.'; document.body.appendChild(m);
      ta.scrollTop = Math.max(0, m.offsetHeight - ta.clientHeight / 2); m.remove();
    }
    function findDlg() {
      const f = document.createElement('form');
      f.innerHTML = `<div class="row" style="flex-wrap:nowrap"><label>Find what:</label><input type="text" style="flex:1;min-width:0" autocomplete="off"><button class="btn" type="submit" style="min-width:76px">Find Next</button></div>
        <div class="row" style="justify-content:space-between;margin-top:8px;align-items:flex-start"><label><input type="checkbox" class="np-case"> Match case</label><fieldset class="group" style="margin:0;padding:8px 6px 4px"><span class="lg">Direction</span><label><input type="radio" name="dir" value="up"> Up</label> <label><input type="radio" name="dir" value="down" checked> Down</label></fieldset><button class="btn" type="button" data-x style="min-width:76px">Cancel</button></div>`;
      const d = A.win('Find', f, { w: 380, noResize: true, noMax: true, noMin: true, escClose: true, icon: I.notepad });
      const inp = f.querySelector('input[type=text]'); inp.value = findQ || ta.value.slice(ta.selectionStart, ta.selectionEnd); setTimeout(() => { inp.focus(); inp.select(); }, 30);
      f.querySelector('[data-x]').addEventListener('click', d.close);
      f.addEventListener('submit', ev => { ev.preventDefault(); findQ = inp.value; findCase = f.querySelector('.np-case').checked; findUp = f.querySelector('input[name=dir]:checked').value === 'up'; if (findQ) findNext(); });
    }
    function timeDate() { const t = today(); ins(`${nowTime()} ${pad2(t.d)}/${pad2(t.m)}/1999`); S('timedate'); }
    const sel = () => ta.value.slice(ta.selectionStart, ta.selectionEnd);
    const copy = () => { clip = sel(); ta.focus(); try { document.execCommand('copy'); } catch (e) {} try { navigator.clipboard && navigator.clipboard.writeText(clip).catch(() => {}); } catch (e) {} };
    const paste = () => { ta.focus(); const p = navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject(); p.then(t => ins(t || clip), () => { if (clip) ins(clip); }); };
    A.menubar(w, [
      ['File', () => [
        { label: 'New', act: () => confirmLeave(() => load('Untitled', null)) },
        { label: 'Open...', act: openDlg },
        { label: 'Save', key: 'Ctrl+S', act: () => save() },
        { label: 'Save As...', act: () => saveAs() },
        '-',
        { label: 'Page Setup...', act: () => Desk.msgbox('Page Setup', 'Paper: A4\nOrientation: Portrait\nMargins: big enough to draw X-wings in', 'info') },
        { label: 'Print', act: () => Desk.msgbox('Notepad', 'Printing ' + name + '...\n\nThe printer is out of cyan. Notepad only prints in black, so... it actually worked!? No. Paper jam.', 'warn') },
        '-',
        { label: 'Exit', act: () => confirmLeave(() => { saved = ta.value; w.close(); }) },
      ]],
      ['Edit', () => [
        { label: 'Undo', key: 'Ctrl+Z', act: () => { ta.focus(); document.execCommand('undo'); } },
        '-',
        { label: 'Cut', key: 'Ctrl+X', dis: !sel(), act: () => { copy(); ta.focus(); document.execCommand('delete'); } },
        { label: 'Copy', key: 'Ctrl+C', dis: !sel(), act: copy },
        { label: 'Paste', key: 'Ctrl+V', act: paste },
        { label: 'Delete', key: 'Del', dis: !sel(), act: () => { ta.focus(); document.execCommand('delete'); } },
        '-',
        { label: 'Select All', act: () => { ta.focus(); ta.select(); } },
        { label: 'Time/Date', key: 'F5', act: timeDate },
        '-',
        { label: 'Word Wrap', chk: wrap, act: () => { wrap = !wrap; store.set('jhp_files_npwrap', wrap); ta.wrap = wrap ? 'soft' : 'off'; ta.classList.toggle('nowrap', !wrap); } },
        { label: 'Set Font...', act: () => Desk.msgbox('Font', 'Font: Courier New\nStyle: Regular\nSize: 10\n\n(This is the only font Notepad trusts.)', 'info') },
      ]],
      ['Search', () => [{ label: 'Find...', act: findDlg }, { label: 'Find Next', key: 'F3', act: findNext }]],
      ['Help', () => [{ label: 'Help Topics', act: () => openNotepad({ name: 'Notepad Help.txt', text: NOTEPAD_HELP }) }, '-', { label: 'About Notepad', act: () => Desk.msgbox('About Notepad', 'JackOS Notepad\nVersion 4.10.1999\n\nThis product is licensed to:\nJack (and his Mom)\n\nPhysical memory available to JackOS: 65,024 KB', 'info') }]],
    ]);
    ta.addEventListener('keydown', ev => {
      if (ev.key === 'F5') { ev.preventDefault(); timeDate(); }
      else if (ev.key === 'F3') { ev.preventDefault(); findNext(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); save(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'f') { ev.preventDefault(); findDlg(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'c') clip = sel();
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'x') clip = sel();
      else if (ev.key === 'Tab') { ev.preventDefault(); ins('\t'); }
    });
    // unsaved typing is autosaved (js/gamesave.js, one for Notepad): it comes back in the next blank Notepad, or when that
    // same file is opened again. Saving it, or saying No to "save changes?", forgets it. (A window that never had changes leaves it alone.)
    let owned = false;
    const sv = A.gameSaver ? A.gameSaver('notepad', () => { if (dirty()) owned = true; return !owned ? undefined : dirty() ? { name, text: ta.value, at: ta.selectionStart } : null; }, { v: 1, delay: 600, live: true }).watch(w) : null;
    if (sv) {
      ta.addEventListener('input', () => sv.save());
      const kept = sv.load();
      if (kept && typeof kept.text === 'string' && ((!o.name && !o.text) || String(kept.name) === name)) {
        if (!o.name && !o.text && kept.name && kept.name !== 'Untitled') { const nd = A.fs.find(kept.name); node = nd && nd.type === 'txt' ? nd : null; name = String(kept.name); saved = node ? (node.text || '') : ''; title(); }
        ta.value = kept.text; owned = true;
        const at = Math.min(ta.value.length, +kept.at || 0); setTimeout(() => { try { ta.setSelectionRange(at, at); } catch (e) {} }, 60);
      }
    }
    if (!touch()) setTimeout(() => { ta.focus(); if (!owned) { ta.setSelectionRange(0, 0); ta.scrollTop = 0; } }, 40);
    return w;
  }
  const NOTEPAD_HELP = `NOTEPAD HELP
============

Notepad is for writing plain text. No fonts. No pictures. Just words.

FILE > SAVE saves your file into C:\\My Documents. It will still be there next time.
FILE > OPEN opens a file from My Documents (or its folders).
EDIT > TIME/DATE (or F5) puts the time and date in. It is always 1999.
SEARCH > FIND looks for words. F3 finds the next one.
EDIT > WORD WRAP makes long lines fit in the window.

Jack's files are read-only. You can change them, but you have to save them
with a new name. (He doesn't want anyone "improving" his diary.)
`;
  function diaryRead(node) {
    const read = store.get(KEY.diary, {}); read[node.diary] = 1; store.set(KEY.diary, read);
    if (Object.keys(read).length >= 10) S('diary10');
    const newest = Math.max(...diaryList.map(d => d[0]).filter(m => m <= today().md));
    if (node.diary === newest) S('diarytoday');
  }
  A.OPENERS.txt = node => {
    if (node.future) { S('future'); return Desk.msgbox(node.name, `This file cannot be opened until 01/01/2000.\n\nToday's date is ${todayStr()}.\n\nIt is still 1999. (It is always 1999.)`, 'warn'); }
    if (node.diary) diaryRead(node);
    return openNotepad({ name: node.name, text: node.text || '', node });
  };
  Desk.notepad = (name, text) => openNotepad({ name, text });

  // ================================================================ Image Viewer
  function openViewer(node) {
    let cur = node, zoom = 0, fit = true;
    const sibs = () => { const p = parentOf(cur); return p ? p.dir.kids.filter(k => k.type === 'img' && (VIEW.hidden || !k.hidden || k === cur)).sort((a, c) => a.name.localeCompare(c.name)) : [cur]; };
    const b = document.createElement('div'); b.className = 'iv';
    b.innerHTML = `<div class="iv-tools">${tool('prev', 'Previous', TB.back)}${tool('next', 'Next', TB.fwd)}<span class="tsep"></span><button class="tool" type="button" data-a="in"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="#cfe8ff" stroke="#333" stroke-width="2"/><path d="M15 15l7 7" stroke="#333" stroke-width="3"/><path d="M6 10h8M10 6v8" stroke="#000" stroke-width="2"/></svg><span>Zoom In</span></button><button class="tool" type="button" data-a="out"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="#cfe8ff" stroke="#333" stroke-width="2"/><path d="M15 15l7 7" stroke="#333" stroke-width="3"/><path d="M6 10h8" stroke="#000" stroke-width="2"/></svg><span>Zoom Out</span></button><button class="tool" type="button" data-a="fit"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="#fff" stroke="#555"/><path d="M6 10V6h4M14 6h4v4M18 14v4h-4M10 18H6v-4" stroke="#000080" stroke-width="2" fill="none"/></svg><span>Best Fit</span></button><span class="tsep"></span><button class="tool" type="button" data-a="print">${'<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="7" fill="#fff" stroke="#555"/><rect x="2" y="9" width="20" height="9" fill="#b8b8b8" stroke="#444"/><rect x="6" y="15" width="12" height="7" fill="#fff" stroke="#555"/></svg>'}<span>Print</span></button></div><div class="iv-stage"></div>`;
    const w = A.win('Image Viewer', b, { w: 520, h: 460, status: true, menubar: true, icon: I.viewer, minW: 240, minH: 220, cls: 'ivwin', onClose: () => removeEventListener('resize', onR) });
    const st2 = document.createElement('span'); w.status.parentNode.appendChild(st2);
    const stage = b.querySelector('.iv-stage');
    function draw() {
      const cv = artCanvas(cur.art), [iw, ih] = artSize(cur.art);
      if (fit || !zoom) zoom = Math.max(1, Math.floor(Math.min((stage.clientWidth - 20) / iw, (stage.clientHeight - 20) / ih)) || 1);
      cv.style.width = iw * zoom + 'px'; cv.style.height = ih * zoom + 'px';
      stage.innerHTML = ''; stage.appendChild(cv);
      w.setTitle(cur.name + ' - Image Viewer');
      w.status.textContent = `${iw} x ${ih} pixels, ${ext(cur) === 'bmp' ? '24-bit colour' : '256 colours'}`; st2.textContent = `Zoom: ${zoom * 100}%`;
      const s = sibs(); b.querySelector('[data-a=prev]').disabled = b.querySelector('[data-a=next]').disabled = s.length < 2;
      const seen = store.get(KEY.pics, {}); seen[cur.art + ':' + cur.name] = 1; store.set(KEY.pics, seen);
      if (Object.keys(seen).length >= 10) S('gallery');
    }
    const step = d => { const s = sibs(), i = s.indexOf(cur); cur = s[(i + d + s.length) % s.length]; fit = true; draw(); if (cur.secret) A.secret(cur.secret); };
    const onR = () => { if (fit && !w.closed) draw(); };
    addEventListener('resize', onR);
    b.querySelector('.iv-tools').addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a || a.disabled) return;
      const k = a.dataset.a;
      if (k === 'prev') step(-1); else if (k === 'next') step(1);
      else if (k === 'in') { fit = false; zoom = Math.min(32, zoom + (zoom < 4 ? 1 : 2)); draw(); if (zoom >= 24) S('pixelpeeper'); }
      else if (k === 'out') { fit = false; zoom = Math.max(1, zoom - (zoom <= 4 ? 1 : 2)); draw(); }
      else if (k === 'fit') { fit = true; draw(); }
      else if (k === 'print') Desk.msgbox('Print', `Printing ${cur.name}...\n\nThe printer is out of cyan. Your picture will be printed in "sunset" colours.`, 'warn');
    });
    w.el.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight') step(1); else if (ev.key === 'ArrowLeft') step(-1); });
    A.menubar(w, [
      ['File', [{ label: 'Open My Pictures', act: () => openExplorer('C:\\My Documents\\My Pictures') }, { label: 'Print', act: () => b.querySelector('[data-a=print]').click() }, '-', { label: 'Properties', act: () => { const p = parentOf(cur); nodeProps(cur, p ? p.path : '(e-mail attachment)'); } }, '-', { label: 'Exit', act: w.close }]],
      ['View', () => [{ label: 'Zoom In', act: () => b.querySelector('[data-a=in]').click() }, { label: 'Zoom Out', act: () => b.querySelector('[data-a=out]').click() }, { label: 'Best Fit', chk: fit, act: () => b.querySelector('[data-a=fit]').click() }, '-', { label: 'Next Picture', act: () => step(1) }, { label: 'Previous Picture', act: () => step(-1) }]],
      ['Help', [{ label: 'About Image Viewer', act: () => Desk.msgbox('About Image Viewer', 'JackOS Image Viewer\nVersion 1.0\n\nShows pictures. Every pixel lovingly placed by hand. (Jack\'s hand. With a mouse. It took ages.)', 'info') }]],
    ]);
    requestAnimationFrame(draw);
    return w;
  }
  A.OPENERS.img = node => openViewer(node);

  // ================================================================ sounds (Media Player-ish) and videos
  function openSound(node) {
    const b = document.createElement('div'); b.className = 'snd';
    b.innerHTML = `<div class="snd-wave"><canvas width="240" height="40"></canvas></div><div class="snd-row"><span class="snd-pos mono">0.00 s</span><span class="snd-len mono">Length: ${node.music ? 'forever' : '1.50'} s</span></div><div class="row" style="justify-content:center"><button class="btn" data-s="play" type="button">&#9654; Play</button><button class="btn" data-s="stop" type="button">&#9632; Stop</button></div>`;
    const w = A.win(node.name + ' - Sound Recorder', b, { w: 300, noResize: true, noMax: true, icon: I.wav, onClose: () => { if (node.music) Sound.music.stop(); cancelAnimationFrame(raf); } });
    const cv = b.querySelector('canvas'), g = cv.getContext('2d'); let raf = 0, t0 = 0;
    const frame = () => { const t = (performance.now() - t0) / 1000; g.fillStyle = '#000'; g.fillRect(0, 0, 240, 40); g.strokeStyle = '#0f0'; g.beginPath(); for (let x = 0; x < 240; x++) { const a = (node.music || t < 1.5) ? Math.sin(x * 0.3 + t * 20) * Math.sin(x * 0.05 + t * 3) * 16 * Math.random() : 0; g.lineTo(x, 20 + a); } g.stroke(); b.querySelector('.snd-pos').textContent = (node.music ? t : Math.min(1.5, t)).toFixed(2) + ' s'; if (node.music || t < 1.5) raf = requestAnimationFrame(frame); };
    const play = () => {
      if (!Sound.on) Desk.toast('Sound is off', 'Turn the sound on with the speaker icon in the corner of the taskbar.', 4000);
      if (node.music) Sound.music.play(node.music); else Sound.play(node.sound);
      S('music'); t0 = performance.now(); cancelAnimationFrame(raf); frame();
    };
    b.querySelector('[data-s=play]').addEventListener('click', play);
    b.querySelector('[data-s=stop]').addEventListener('click', () => { if (node.music) Sound.music.stop(); cancelAnimationFrame(raf); });
    play();
    return w;
  }
  A.OPENERS.wav = openSound;
  A.OPENERS.avi = node => Desk.msgbox(node.name, `Cannot play ${node.name}.\n\nThe "JKAT" video codec is not installed. Download it from the Internet? (It's 40MB. See you in 2003.)`, 'warn');
  A.OPENERS.doc = node => node.blocked ? blocked(node) : A.OPENERS.txt(node);
  function blocked(node) {
    S('antivirus');
    Desk.msgbox('JackNet Anti-Virus 99', `WARNING! JackNet Anti-Virus 99 has blocked "${node.name}".\n\nIt contains: ${/list/i.test(node.name) ? 'W97M.Melissa (an e-mail virus)' : /screen/i.test(node.name) ? 'something nasty pretending to be a screensaver' : 'something nasty pretending to be a prize'}.\n\nGood thing Dad bought this the day after Melissa. Never open attachments you weren't expecting!`, 'warn');
  }

  // ================================================================ fake programs (C:\Program Files and friends)
  function progress(title, lines, ms, done, icon) {
    const b = document.createElement('div');
    b.innerHTML = `<div class="fx-plog"></div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">Cancel</button></div>`;
    const w = A.win(title, b, { w: 360, noResize: true, noMax: true, icon: icon || I.exe });
    const bar = b.querySelector('.prog span'), log = b.querySelector('.fx-plog'), n = 28; let i = 0;
    b.querySelector('.btn').addEventListener('click', () => { clearInterval(t); w.close(); });
    const t = setInterval(() => { if (w.closed) return clearInterval(t); i++; if (bar.children.length < n) bar.appendChild(document.createElement('i')); log.textContent = lines[Math.min(lines.length - 1, Math.floor(i / n * lines.length))]; if (i >= n) { clearInterval(t); setTimeout(() => { if (!w.closed) { w.close(); done(); } }, 500); } }, ms / n);
    return w;
  }
  const FAKE = {
    command: () => A.open('dos.run'),
    commandOld: () => Desk.msgbox('COMMAND.COM', 'This program needs MS-DOS mode.\n\nStart > Shut Down > Restart in MS-DOS mode. (Type HELP when you get there.)', 'info'),
    wordpad: () => { Desk.msgbox('WordPad', 'WordPad wants you to choose a font, a size, a colour and a margin.\n\nYou chose Notepad instead. Good choice.', 'info'); openNotepad({}); },
    cubetime: cubeTimer,
    orkpaint: () => { Sound.play('waaagh'); Desk.msgbox('Mini Painter 98', 'Choose a colour:\n\n( ) Red\n\nYou chose: RED.\n\nYour model is now red. It goes faster.', 'info'); },
    y2k: () => progress('Y2K Checker 1.0', ['Checking BIOS clock...', 'Checking BIOS clock... 1999 OK', 'Checking programs... (all 214 of them)', 'Checking the video recorder... still 12:00', 'Checking Mom\'s beans... 52 tins', 'Checking nerves...'], 4200, () => { S('y2kcheck'); Desk.msgbox('Y2K Checker 1.0', 'RESULT: Your computer is Y2K COMPLIANT.\n\n(Probably.)\n\n(We think.)\n\n(Keep a torch handy.)', 'info'); }, I.sys),
    av: () => progress('JackNet Anti-Virus 99', ['Scanning C:\\JACKOS...', 'Scanning C:\\My Documents...', 'Scanning C:\\My Documents\\Diary... (not reading it, promise)', 'Scanning C:\\JACKOS\\SYSTEM\\GUBBINZ.VXD...', 'Scan complete.'], 3500, () => Desk.msgbox('JackNet Anti-Virus 99', 'Scan complete.\n\nFiles scanned: 14,203\nViruses found: 0\nHelpers found: 1 (GUBBINZ.VXD - it\'s a Gubbinz in a hat, ignoring)\n\nYour computer is clean. Your room is not.', 'info')),
    modem: () => Desk.msgbox('ModemMeter', 'Advertised speed:  56,000 bps\nActual speed:      26,400 bps\nWhen raining:      19,200 bps\nWhen Mom is on the phone:  0 bps\n\nDifference: "a lot"', 'info'),
    wingrot: () => Desk.msgbox('WinJack (UNREGISTERED)', 'Thank you for trying WinJack!\n\nThis is day 412 of your 30-day free trial.\n\nPlease register by sending 10 Rupees.', 'warn', [['I Agree'], ['I Agree']]),
    themes: () => Desk.msgbox('Desktop Themes', 'Theme: 1999 (beige)\n\nOther themes are available: also beige.', 'info'),
    signup: () => Desk.msgbox('Online Services', 'Sign up for the Internet today!\n\nYou already have the Internet. It\'s JackNet 56K. It\'s the only one Dad will pay for.', 'info'),
    regedit: () => Desk.msgbox('Registry Editor', 'Dad says:\n\nDO NOT TOUCH THE REGISTRY.\n\nYou have wisely chosen not to touch the registry.', 'warn'),
    scandisk: () => progress('ScanDisk - Jack\'s PC (C:)', ['Checking folders...', 'Checking file allocation table...', 'Checking file system...', 'Checking surface... (the slightly grumpy sector)'], 3600, () => Desk.msgbox('ScanDisk Results', 'ScanDisk did not find any errors on this drive.\n\n6,400,000 KB total disk space\n1 grumpy sector\n0 KB in bad sectors\n1 Gubbinz (expected)', 'info'), I.hdd),
    defrag: defragger,
    kernel: () => Desk.msgbox('KRNL386.EXE', 'You can\'t run the kernel.\n\nThe kernel runs YOU.', 'warn'),
    setup: () => progress('JACK ATTACK! Cover Disc Setup', ['Preparing to install...', 'Copying files: 0 of 0', 'Installing demos... (they\'re on the website already!)', 'Registering Gubbinz...', 'Done!'], 3000, () => { Desk.msgbox('Setup Complete', 'JACK ATTACK! Cover Disc #7 is installed!\n\nEverything on this disc is also on the website. Opening the Games Arcade now...', 'info', [['OK', () => { showBrowser(); IE.go('demos', 'click'); }]]); }, I.cd),
    virus: () => {
      Sound.play('uhoh');
      progress('TOTALLY_NOT_A_VIRUS.EXE', ['Deleting C:\\JACKOS...', 'Deleting C:\\My Documents\\Diary...', 'Deleting C:\\My Documents\\My Pictures\\Gubbinz.bmp...', 'Deleting ALL THE GOLDENEYE SAVES...', 'Deleting...'], 3400, () => { S('virus'); Sound.play('waaagh'); Desk.msgbox('TOTALLY_NOT_A_VIRUS.EXE', 'HA! GOTCHA!\n\nNothing was deleted. It\'s just Gubbinz. He wanted to say hi.\n\nDave made this on his computer and e-mailed it on a floppy. Jack put it in the bin. You got it out. Why would you get it out?\n\n- Gubbinz', 'info'); }, I.exe);
    },
  };
  function runFake(arg, node) {
    arg = String(arg || '');
    if (arg.startsWith('app:')) { const [ids, fb] = arg.slice(4).split('>'); const id = ids.split('|').find(x => KNOWN.has(x)); if (id) return A.open(id); if (fb && FAKE[fb]) return FAKE[fb](node); return Desk.msgbox('JackOS', 'This program could not be started. It might have been eaten by Gubbinz.\n\n(Or it hasn\'t been installed on this computer yet.)', 'warn'); }
    if (arg.startsWith('go:')) { showBrowser(); return IE.go(arg.slice(3), 'click'); }
    if (arg === 'browser') return showBrowser();
    if (FAKE[arg]) return FAKE[arg](node);
    Desk.msgbox('JackOS', 'This program has performed an illegal operation and will be shut down.\n\nIf the problem persists, contact the program vendor. (The vendor is Jack. He\'s at school.)', 'warn');
  }
  A.register('files.run', { open: arg => { runFake(arg); return null; } });
  function cubeTimer() {
    const b = document.createElement('div'); b.className = 'cubet';
    b.innerHTML = `<div class="lcd cubet-lcd">0.00</div><div class="row" style="justify-content:center;margin:8px 0"><button class="btn big cubet-go" type="button">START</button></div><div class="cubet-best small">Jack's best: ${mdOf('12-29') <= today().md ? '2:48' : mdOf('11-27') <= today().md ? '3:02' : mdOf('09-18') <= today().md ? '3:51' : mdOf('07-30') <= today().md ? '5:40' : mdOf('04-03') <= today().md ? '8:12' : 'not solved yet!'}</div><div class="field cubet-log"></div>`;
    const w = A.win('Cube Timer 2.0', b, { w: 260, noResize: true, noMax: true, icon: I.exe, onClose: () => cancelAnimationFrame(raf) });
    let t0 = 0, raf = 0, on = false;
    const lcd = b.querySelector('.cubet-lcd'), go = b.querySelector('.cubet-go');
    const fmt = s => s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}` : s.toFixed(2);
    const tick = () => { lcd.textContent = fmt((performance.now() - t0) / 1000); raf = requestAnimationFrame(tick); };
    go.addEventListener('click', () => {
      on = !on;
      if (on) { t0 = performance.now(); tick(); go.textContent = 'STOP'; Sound.play('beep'); }
      else { cancelAnimationFrame(raf); go.textContent = 'START'; const s = (performance.now() - t0) / 1000; const r = document.createElement('div'); r.textContent = `${fmt(s)}${s < 2 ? '  (you didn\'t even pick it up)' : s > 600 ? '  (did you go and have tea?)' : ''}`; b.querySelector('.cubet-log').prepend(r); Sound.play('pet'); ctLog.unshift(r.textContent); ctLog.length = Math.min(ctLog.length, 30); }
      ctSave();
    });
    // the times (and a solve still being timed: it keeps ticking) are kept, js/gamesave.js
    const ctLog = [], ctSave = () => { if (A.saveGame) A.saveGame('cubetimer', { times: ctLog, run: on ? Date.now() - (performance.now() - t0) : 0 }, { v: 1 }); };
    const kept = A.loadGame ? A.loadGame('cubetimer', 1) : null;
    if (kept && Array.isArray(kept.times)) {
      kept.times.slice(0, 30).reverse().forEach(t => { const r = document.createElement('div'); r.textContent = String(t); b.querySelector('.cubet-log').prepend(r); ctLog.unshift(String(t)); });
      if (kept.run > 0 && Date.now() - kept.run < 864e5) { on = true; t0 = performance.now() - (Date.now() - kept.run); tick(); go.textContent = 'STOP'; }
    }
    return w;
  }
  function defragger() {
    const b = document.createElement('div');
    b.innerHTML = `<div class="dfg"></div><div class="fx-plog">Defragmenting file system...</div><div class="prog" style="margin-top:6px"><span style="display:flex;gap:2px"></span></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">Stop</button></div>`;
    const w = A.win('Defragmenting Drive C', b, { w: 360, noResize: true, noMax: true, icon: I.hdd });
    const grid = b.querySelector('.dfg'), N = 168, cells = [];
    for (let i = 0; i < N; i++) { const c = document.createElement('i'); const r = Math.random(); c.className = r < 0.45 ? 'u' : r < 0.55 ? 'r' : ''; grid.appendChild(c); cells.push(c); }
    let k = 0;
    const t = setInterval(() => {
      if (w.closed) return clearInterval(t);
      const used = cells.filter(c => c.className === 'u' || c.className === 'd').length;
      // find the first gap and pull a later block into it
      const gap = cells.findIndex((c, i) => i < used && c.className === '');
      const from = cells.map((c, i) => c.className === 'u' ? i : -1).filter(i => i > gap).pop();
      if (gap >= 0 && from != null && from > gap) { cells[gap].className = 'd'; cells[from].className = ''; cells[gap].classList.add('hot'); setTimeout(() => cells[gap].classList.remove('hot'), 120); }
      else cells.forEach(c => { if (c.className === 'u') c.className = 'd'; });
      const pct = Math.round(cells.filter(c => c.className === 'd').length / Math.max(1, used) * 100);
      const bar = b.querySelector('.prog span'); while (bar.children.length < Math.round(pct / 100 * 28)) bar.appendChild(document.createElement('i'));
      b.querySelector('.fx-plog').textContent = `Defragmenting file system... ${pct}% complete`;
      if (++k > 400 || (gap < 0)) { clearInterval(t); b.querySelector('.fx-plog').textContent = 'Defragmentation is complete. Like Tetris, but for files.'; Sound.play('solve'); }
    }, 70);
    b.querySelector('.btn').addEventListener('click', () => { clearInterval(t); w.close(); });
  }
  // ================================================================ Recycle Bin
  const restored = store.get(KEY.restored, {});
  let bin = BIN.filter(x => !restored[x.id] && happened(x.del));
  BIN.filter(x => restored[x.id]).forEach(x => A.fs.add(x.from, x.node));
  let binIcon = null;
  const binFull = () => bin.length > 0;
  const binWins = new Set();
  const binChanged = () => { if (binIcon) { binIcon.querySelector('svg').outerHTML = binFull() ? I.binFull : I.binEmpty; } binWins.forEach(f => f()); refreshAll(); };
  // other packs can throw things in the bin (Gubbinz, for one): { id, from, node, confirm?, onRestore?, onEmpty? }
  A.recycle = {
    put(e) { if (bin.some(x => x.id === e.id)) return; bin.push(Object.assign({ del: todayStr(), ext: true }, e)); binChanged(); },
    take(id) { const i = bin.findIndex(x => x.id === id); if (i < 0) return false; bin.splice(i, 1); binChanged(); return true; },
    has: id => bin.some(x => x.id === id),
    open: () => A.open('files.bin'),
    wobble() { if (binIcon) { binIcon.classList.remove('ff-wobble'); void binIcon.offsetWidth; binIcon.classList.add('ff-wobble'); } },
  };
  function trashUserDoc(node, from) {
    const d = A.fs.get(MD); d.kids = d.kids.filter(k => k !== node);
    const text = node.text; delete docs[node.name]; saveDocs();
    bin.push({ id: 'user:' + node.name + ':' + Date.now(), from: MD, del: todayStr(), user: true, node: { name: node.name, type: 'txt', date: todayStr(), text } });
    Sound.play('thud'); binChanged();
  }
  function crumple() {
    if (!Sound.on || !Sound.unlock) return;
    try {
      const c = Sound.unlock(); if (!c) return;
      for (let i = 0; i < 9; i++) {
        const t = c.currentTime + i * 0.045 + Math.random() * 0.03, len = Math.floor(c.sampleRate * 0.06), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
        const s = c.createBufferSource(); s.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 3500; f.Q.value = 1.2;
        const g = c.createGain(); g.gain.value = 0.12;
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
      }
    } catch (e) {}
  }
  function openBin() {
    let sel = -1;
    const b = document.createElement('div'); b.className = 'rb';
    b.innerHTML = `<div class="fx-tools">${tool('restore', 'Restore', TB.restore)}${tool('empty', 'Empty Bin', TB.empty)}${tool('props', 'Properties', TB.props)}</div><div class="rb-main"><div class="fx-web rb-web"></div><div class="field fx-details rb-list" tabindex="0"></div></div>`;
    const w = A.win('Recycle Bin', b, { w: 680, h: 380, status: true, menubar: true, icon: I.binFull, minW: 260, cls: 'fxwin', onClose: () => binWins.delete(draw) });
    const list = b.querySelector('.rb-list'), web = b.querySelector('.rb-web');
    function draw() {
      if (w.closed) return;
      w.el.querySelector('.tb .ico').innerHTML = binFull() ? I.binFull : I.binEmpty; w.task.querySelector('.tico').innerHTML = binFull() ? I.binFull : I.binEmpty;
      list.innerHTML = `<div class="fx-row fx-hd rb-row"><span>Name</span><span>Original Location</span><span>Date Deleted</span><span>Size</span></div>` + bin.map((x, i) => `<button type="button" class="fx-row rb-row fx-it${i === sel ? ' sel' : ''}" data-i="${i}"><span class="fx-nm">${ICO16(iconOf(x.node))}<span>${esc(x.node.name)}</span></span><span>${esc(x.from.replace(/\//g, '\\'))}</span><span>${esc(x.del)}</span><span>${kbCol(bytesOf(x.node))}</span></button>`).join('') + (bin.length ? '' : '<div class="fx-emptymsg">The Recycle Bin is empty. Jack has nothing left to hide.</div>');
      const s = bin[sel];
      web.innerHTML = `<div class="fx-wico">${binFull() ? I.binFull : I.binEmpty}</div><div class="fx-wtitle">Recycle Bin</div><div class="fx-wrule"></div>` + (s ? `<b>${esc(s.node.name)}</b><br>${esc(typeName(s.node))}<br><br>Deleted: ${esc(s.del)}<br><br>From: ${esc(s.from.replace(/\//g, '\\'))}<br><br>To get it back, click Restore.` : 'This folder contains files and folders that you have deleted.<br><br>To restore something, select it and click Restore.');
      b.querySelector('[data-a=restore]').disabled = !s; b.querySelector('[data-a=props]').disabled = !s; b.querySelector('[data-a=empty]').disabled = !bin.length;
      w.status.textContent = s ? `1 object(s) selected` : `${bin.length} object(s)`;
    }
    function restore() {
      const s = bin[sel]; if (!s) return;
      bin.splice(sel, 1); sel = -1;
      if (s.user) { docs[s.node.name] = { text: s.node.text, date: s.node.date }; saveDocs(); A.fs.add(MD, userNode(s.node.name)); }
      else if (s.ext) { binChanged(); if (s.onRestore) s.onRestore(); S('restore'); return; }
      else { A.fs.add(s.from, s.node); restored[s.id] = 1; store.set(KEY.restored, restored); }
      Sound.play('join');
      Desk.toast('Restored', `${s.node.name} is back in ${s.from.replace(/\//g, '\\')}.` + (s.id === 'virus' ? ' (Are you SURE you want to run it?)' : ''), 4000);
      S('restore'); binChanged();
    }
    function empty() {
      if (!bin.length) return;
      const special = bin.find(x => x.ext && x.confirm);
      Desk.msgbox(bin.length > 1 ? 'Confirm Multiple File Delete' : 'Confirm File Delete', special ? special.confirm : bin.length > 1 ? `Are you sure you want to delete all of the ${bin.length} items in the Recycle Bin?\n\n(Jack will never see them again. Gubbinz might.)` : `Are you sure you want to delete '${bin[0].node.name}'?`, 'q', [['Yes', () => {
        list.classList.add('crumple'); crumple();
        setTimeout(() => { const gone = bin.filter(x => x.ext && x.onEmpty); bin = []; sel = -1; list.classList.remove('crumple'); binChanged(); S('emptybin'); gone.forEach(x => x.onEmpty()); }, 500);
      }], ['No']]);
    }
    const props = () => { const s = bin[sel]; if (s) Desk.msgbox(s.node.name + ' Properties', `${s.node.name}\n\nType: ${typeName(s.node)}\nOriginal location: ${s.from.replace(/\//g, '\\')}\nDeleted: ${s.del}\nSize: ${fmtSize(bytesOf(s.node))}\n\nThis item is in the Recycle Bin. To open it, restore it first.`, 'info'); };
    let lt = 0, li = -1;
    list.addEventListener('click', ev => {
      const e = ev.target.closest('.fx-it'); if (!e) { sel = -1; return draw(); }
      const i = +e.dataset.i, now = Date.now(); sel = i; draw();
      if (i === li && now - lt < 450) props(); lt = now; li = i;
    });
    list.addEventListener('contextmenu', ev => { const e = ev.target.closest('.fx-it'); ev.preventDefault(); if (e) { sel = +e.dataset.i; draw(); IE.menu([{ label: 'Restore', act: restore }, '-', { label: 'Cut', dis: true }, { label: 'Delete', act: () => Desk.msgbox('Delete', 'To delete one thing, you have to empty the whole bin. Them\'s the rules. (They\'re not, but Jack only coded the big button.)', 'info') }, '-', { label: 'Properties', act: props }], ev.clientX, ev.clientY); } else IE.menu([{ label: 'Empty Recycle Bin', dis: !bin.length, act: empty }, { label: 'Refresh', act: draw }], ev.clientX, ev.clientY); });
    b.querySelector('.fx-tools').addEventListener('click', ev => { const a = ev.target.closest('[data-a]'); if (!a || a.disabled) return; ({ restore, empty, props })[a.dataset.a](); });
    A.menubar(w, [['File', () => [{ label: 'Empty Recycle Bin', dis: !bin.length, act: empty }, { label: 'Restore', dis: !bin[sel], act: restore }, '-', { label: 'Properties', dis: !bin[sel], act: props }, '-', { label: 'Close', act: w.close }]], ['Edit', [{ label: 'Undo Delete', dis: true }, { label: 'Select All', dis: true }]], ['View', [{ label: 'Details', rad: true }, { label: 'Refresh', act: draw }]], ['Help', [{ label: 'About the Recycle Bin', act: () => Desk.msgbox('Recycle Bin', 'The Recycle Bin keeps things you\'ve deleted, in case you change your mind.\n\nJack changes his mind a lot.', 'info') }]]]);
    binWins.add(draw); draw();
    return w;
  }

  // ================================================================ Outlook Express
  const ms = Object.assign({ read: {}, moved: {}, gone: {}, user: [] }, store.get(KEY.mail, {}));
  const saveMs = () => store.set(KEY.mail, ms);
  const FOLDERS = [['inbox', 'Inbox', I.inbox], ['outbox', 'Outbox', I.outbox], ['sent', 'Sent Items', I.sent], ['deleted', 'Deleted Items', I.trash], ['drafts', 'Drafts', I.drafts], ['junk', 'Junk', I.junk]];
  const oeWins = new Set();
  const mailChanged = () => { saveMs(); oeWins.forEach(f => f()); };
  // who's logged on: every e-mail says {NAME} until it's shown, then it's them (MailGen writes the rest of the post)
  const meNick = () => (window.Net && Net.me && Net.me.nick) || 'Guest';
  const meAddr = () => (meNick().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'guest') + '@jacknet.jnet';
  const pers = s => s == null ? s : String(s).replace(/\{NAMEUC\}/g, meNick().toUpperCase()).replace(/\{NAME\}/g, meNick()).replace(/\{ADDR\}/g, meAddr());
  const pcache = new Map(); let pcNick = '';
  function persMsg(m) {
    if (pcNick !== meNick()) { pcache.clear(); pcNick = meNick(); }
    let p = pcache.get(m.id);
    if (!p) { p = Object.assign({}, m, { from: pers(m.from), to: pers(m.to || (/^JackNet Customer/.test(m.from) ? FAM : ME)), subj: pers(m.subj), body: pers(m.body) }); pcache.set(m.id, p); }
    return p;
  }
  const MG = () => window.MailGen && MailGen.ready ? MailGen : null;
  const fold = m => ms.moved[m.id] || (MG() ? MailGen.folder(m) : m.f);
  const isNew = m => (!m.user || m.inc) && !ms.read[m.id] && !m.pre;
  const minOf = t => { const [h, mi] = String(t || '0:0').split(':').map(Number); return (h * 60 + mi) || 0; };
  const staticTime = m => { const t = fakeTime(m.id); if (mdOf(m.d) !== today().md) return t; const d = new Date(), now = d.getHours() * 60 + d.getMinutes(), x = minOf(t); return x <= now ? t : `${Math.floor(x * now / 1440 / 60)}:${pad2(Math.floor(x * now / 1440) % 60)}`; }; // today's post never comes from the future
  const msgDate = m => m.user || m.gen ? m.date + ' ' + m.time : m.d ? `${m.d.slice(3)}/${m.d.slice(0, 2)}/99 ${staticTime(m)}` : `${m.old} ${fakeTime(m.id)}`;
  const msgKey = m => m.user ? 2000 + m.seq : m.gen ? mdOf(m.gd) + minOf(m.time) / 1440 : m.d ? mdOf(m.d) + minOf(staticTime(m)) / 1440 : -mdOfOld(m.old);
  const mdOfOld = s => { const [d, mo] = s.split('/').map(Number); return 1300 - (mo * 100 + d); };
  function messages(folder) {
    const all = MAIL.filter(m => !m.d || mdOf(m.d) <= today().md).map(persMsg).concat(MG() ? MailGen.list() : [], ms.user.map(u => Object.assign({ user: true }, u)));
    return all.filter(m => !ms.gone[m.id] && fold(m) === folder).sort((a, b) => msgKey(b) - msgKey(a));
  }
  const unread = folder => messages(folder).filter(m => isNew(m) && folder !== 'sent' && folder !== 'drafts').length;
  const nameOf = s => String(s || '').replace(/\s*<.*>$/, '') || s;
  function markRead(m) {
    if ((m.user && !m.inc) || ms.read[m.id]) return;
    ms.read[m.id] = 1; mailChanged();
    if (Object.keys(ms.read).length >= 10) S('mail10');
    if (fold(m) === 'junk') S('junk');
    if (m.secret) A.secret(m.secret);
    if (MG()) MailGen.onRead(m);
  }
  function attNode(a) { return a.node || (a.path ? (A.fs.get(a.path) || A.fs.find(a.name)) : Object.assign({ date: todayStr() }, a)); }
  function openAtt(a) {
    const n = attNode(a);
    if (!n) return Desk.msgbox(a.name, 'This attachment could not be found. It may have been deleted. (By Gubbinz.)', 'warn');
    if (n.blocked) return blocked(n);
    S('attach');
    A.openFile(n);
  }
  function msgHtml(m, full) {
    return `<div class="oe-mh"><div><b>From:</b> ${esc(pers(m.from || JACK))}</div><div><b>To:</b> ${esc(pers(m.to || FAM))}</div>${full ? `<div><b>Date:</b> ${esc(msgDate(m))}</div>` : ''}<div><b>Subject:</b> ${esc(m.subj || '(no subject)')}</div>${m.att && m.att.length ? `<div class="oe-att"><b>Attach:</b> ${m.att.map((a, i) => `<button type="button" class="oe-ab" data-att="${i}">${ICO16(iconOf(attNode(a) || a))}${esc(a.name)} <small>(${fmtSize(bytesOf(attNode(a) || a))})</small></button>`).join(' ')}</div>` : ''}</div><div class="oe-body${m.mono ? ' oe-mono' : ''}${m.ascii ? ' oe-pre' : ''}">${esc(m.body || '').replace(/\bhttps?:\/\/[^\s<]+/g, u => `<a href="#" class="oe-link" data-url="${u}">${u}</a>`)}</div>`;
  }
  function wireAtt(el, m) { el.querySelectorAll('[data-att]').forEach(x => x.addEventListener('click', () => openAtt(m.att[+x.dataset.att]))); }
  function openOutlook(startFolder) {
    let folder = startFolder || 'inbox', sel = null, list = [];
    const b = document.createElement('div'); b.className = 'oe';
    const tb = (a, l, svg) => `<button class="tool" type="button" data-a="${a}">${svg}<span>${l}</span></button>`;
    const SV = {
      newm: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="17" height="12" fill="#fff" stroke="#555"/><path d="M2 7l8.5 6L19 7" fill="none" stroke="#555"/><path d="M18 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#ffd400" stroke="#a07000"/></svg>',
      reply: '<svg viewBox="0 0 24 24"><rect x="6" y="8" width="16" height="11" fill="#fff" stroke="#555"/><path d="M6 8l8 6 8-6" fill="none" stroke="#555"/><path d="M9 5H4v5M4 5l6 6" stroke="#1a5ad8" stroke-width="2" fill="none"/></svg>',
      fwd: '<svg viewBox="0 0 24 24"><rect x="2" y="8" width="16" height="11" fill="#fff" stroke="#555"/><path d="M2 8l8 6 8-6" fill="none" stroke="#555"/><path d="M15 5h5v5M20 5l-6 6" stroke="#1a9a1a" stroke-width="2" fill="none"/></svg>',
      print: '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="7" fill="#fff" stroke="#555"/><rect x="2" y="9" width="20" height="9" fill="#b8b8b8" stroke="#444"/><rect x="6" y="15" width="12" height="7" fill="#fff" stroke="#555"/></svg>',
      del: TB.del,
      sr: '<svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" fill="#fff" stroke="#555"/><path d="M4 9l8 6 8-6" fill="none" stroke="#555"/><path d="M8 6V1M6 3l2-2 2 2" stroke="#d42020" stroke-width="1.6" fill="none"/><path d="M16 1v5M14 4l2 2 2-2" stroke="#1a9a1a" stroke-width="1.6" fill="none"/></svg>',
      addr: '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" fill="#c8102e" stroke="#600"/><rect x="7" y="5" width="10" height="14" fill="#fff"/><circle cx="12" cy="10" r="2.5" fill="#555"/><path d="M8 17c1-3 7-3 8 0" fill="#555"/></svg>',
    };
    if (window.JICON) Object.assign(SV, { newm: JICON.get('tb-newmail', 24), reply: JICON.get('tb-reply', 24), fwd: JICON.get('tb-forward', 24), print: JICON.get('tb-print', 24), sr: JICON.get('tb-sendrecv', 24), addr: JICON.get('tb-addr', 24) });
    b.innerHTML = `<div class="fx-tools oe-tools">${tb('new', 'New Mail', SV.newm)}<span class="tsep"></span>${tb('reply', 'Reply', SV.reply)}${tb('replyall', 'Reply All', SV.reply)}${tb('forward', 'Forward', SV.fwd)}<span class="tsep"></span>${tb('print', 'Print', SV.print)}${tb('delete', 'Delete', SV.del)}<span class="tsep"></span>${tb('sendrecv', 'Send/Recv', SV.sr)}${tb('addresses', 'Addresses', SV.addr)}</div>
      <div class="oe-head"><span class="oe-fname"></span><select class="oe-fsel" aria-label="Folder"></select><span class="oe-brand">JackNet Mail</span></div>
      <div class="oe-main"><div class="oe-folders field"></div><div class="oe-right"><div class="oe-list field" tabindex="0"></div><div class="oe-prev field"></div></div></div>`;
    const w = A.win('Inbox - Outlook Express', b, { w: 720, h: 500, menubar: true, status: true, icon: I.mail, minW: 280, minH: 260, cls: 'oewin', onClose: () => oeWins.delete(draw) });
    const st2 = document.createElement('span'); st2.className = 'fx-st3'; w.status.parentNode.appendChild(st2); st2.innerHTML = `${ICO16(I.dialup)} Working Online`;
    const lEl = b.querySelector('.oe-list'), pEl = b.querySelector('.oe-prev'), fEl = b.querySelector('.oe-folders'), fSel = b.querySelector('.oe-fsel');
    const fname = f => FOLDERS.find(x => x[0] === f)[1];
    const mine = () => folder === 'sent' || folder === 'outbox' || folder === 'drafts';
    function draw() {
      if (w.closed) return;
      list = messages(folder);
      if (sel && !list.includes(sel)) sel = list.find(m => m.id === sel.id) || null;
      w.setTitle(fname(folder) + ' - Outlook Express');
      b.querySelector('.oe-brand').textContent = meNick() + ' - JackNet Mail';
      b.querySelector('.oe-fname').innerHTML = ICO16(FOLDERS.find(x => x[0] === folder)[2]) + ' ' + esc(fname(folder));
      fEl.innerHTML = `<div class="oe-tree0">${ICO16(I.oe)} Outlook Express</div><div class="oe-tree1">${ICO16(I.folderOpen)} Local Folders</div>` + FOLDERS.map(([id, n, ic]) => { const u = unread(id), c = id === 'outbox' ? messages('outbox').length : u; return `<button type="button" class="oe-f${id === folder ? ' on' : ''}${c ? ' b' : ''}" data-f="${id}">${ICO16(ic)}<span>${n}${c ? ` (${c})` : ''}</span></button>`; }).join('');
      fSel.innerHTML = FOLDERS.map(([id, n]) => { const u = unread(id); return `<option value="${id}"${id === folder ? ' selected' : ''}>${n}${u ? ` (${u})` : ''}</option>`; }).join('');
      lEl.innerHTML = `<div class="oe-row oe-hd"><span>!</span><span>${ICO16(I.clip)}</span><span>${mine() ? 'To' : 'From'}</span><span>Subject</span><span>${mine() ? 'Sent' : 'Received'}</span></div>` + list.map((m, i) => `<button type="button" class="oe-row${isNew(m) && !mine() ? ' unread' : ''}${m === sel ? ' sel' : ''}" data-i="${i}"><span>${m.priority ? '<b style="color:#c00">!</b>' : ''}</span><span>${m.att && m.att.length ? ICO16(I.clip) : ''}</span><span class="oe-from">${ICO16(isNew(m) && !mine() ? I.envClosed : I.envOpen)}<span>${esc(nameOf(mine() ? (m.to || '') : m.from))}</span></span><span class="oe-subj">${esc(m.subj || '(no subject)')}</span><span class="oe-date">${esc(msgDate(m))}</span></button>`).join('') + (list.length ? '' : `<div class="fx-emptymsg">There are no items in this view.</div>`);
      if (sel) { pEl.innerHTML = msgHtml(sel); wireAtt(pEl, sel); }
      else pEl.innerHTML = `<div class="oe-none">${folder === 'inbox' && unread('inbox') ? `<b>You have ${unread('inbox')} unread message(s) in your Inbox.</b><br><br>` : ''}Click a message to read it here. Double-click to open it in its own window.</div>`;
      const n = list.length, u = unread(folder);
      w.status.textContent = `${n} message(s), ${u} unread`;
      ['reply', 'replyall', 'forward', 'print', 'delete'].forEach(a => { b.querySelector(`[data-a=${a}]`).disabled = !sel; });
    }
    function pick(i, open) {
      sel = list[i]; if (!sel) return;
      markRead(sel); draw();
      if (open) openMsg(sel, () => list);
      if (touch() && innerWidth < 640) pEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    let lt = 0, li = -1;
    lEl.addEventListener('click', ev => { const e = ev.target.closest('.oe-row[data-i]'); if (!e) return; const i = +e.dataset.i, now = Date.now(); const dbl = i === li && now - lt < 450; lt = now; li = i; if (list[i] && list[i].user && list[i].f === 'drafts' && dbl) return compose(Object.assign({ draftOf: list[i] }, list[i])); pick(i, dbl); });
    lEl.addEventListener('keydown', ev => { const i = list.indexOf(sel); if (ev.key === 'ArrowDown') { ev.preventDefault(); pick(Math.min(list.length - 1, i + 1)); } else if (ev.key === 'ArrowUp') { ev.preventDefault(); pick(Math.max(0, i - 1)); } else if (ev.key === 'Enter' && sel) openMsg(sel, () => list); else if (ev.key === 'Delete' && sel) delMsg(sel); });
    lEl.addEventListener('contextmenu', ev => { const e = ev.target.closest('.oe-row[data-i]'); if (!e) return; ev.preventDefault(); pick(+e.dataset.i); IE.menu([{ label: 'Open', act: () => openMsg(sel, () => list) }, { label: 'Print', act: () => act('print') }, '-', { label: 'Reply to Sender', act: () => act('reply') }, { label: 'Forward', act: () => act('forward') }, '-', { label: 'Mark as Unread', dis: sel.user, act: () => { delete ms.read[sel.id]; mailChanged(); } }, { label: 'Delete', act: () => delMsg(sel) }], ev.clientX, ev.clientY); });
    fEl.addEventListener('click', ev => { const e = ev.target.closest('[data-f]'); if (e) { folder = e.dataset.f; sel = null; draw(); } else if (ev.target.closest('.oe-tree0,.oe-tree1')) { folder = 'inbox'; sel = null; draw(); } });
    fSel.addEventListener('change', () => { folder = fSel.value; sel = null; draw(); });
    function act(a) {
      if (a === 'new') return compose({});
      if (a === 'sendrecv') return sendRecv();
      if (a === 'addresses') return addressBook();
      if (!sel) return;
      if (a === 'reply' || a === 'replyall') compose(replyTo(sel));
      else if (a === 'forward') compose(fwdOf(sel));
      else if (a === 'print') Desk.msgbox('Print', `Printing "${sel.subj}"...\n\nThe printer is out of cyan. The e-mail came out in a lovely shade of "brownish".`, 'warn');
      else if (a === 'delete') delMsg(sel);
    }
    b.querySelector('.oe-tools').addEventListener('click', ev => { const e = ev.target.closest('[data-a]'); if (e && !e.disabled) act(e.dataset.a); });
    A.menubar(w, [
      ['File', () => [{ label: 'New', sub: [{ label: 'Mail Message', act: () => compose({}) }] }, { label: 'Open', dis: !sel, act: () => openMsg(sel, () => list) }, '-', { label: 'Print', dis: !sel, act: () => act('print') }, '-', { label: 'Work Offline', act: () => Desk.toast('Outlook Express', 'You are now working offline. (You were always working offline. The modem is unplugged so Mom can use the phone.)', 5000) }, { label: 'Exit', act: w.close }]],
      ['Edit', () => [{ label: 'Delete', dis: !sel, act: () => delMsg(sel) }, { label: 'Empty \'Deleted Items\' Folder', act: emptyDeleted }, '-', { label: 'Mark All as Read', act: () => { messages(folder).forEach(m => { if (!m.user || m.inc) ms.read[m.id] = 1; }); mailChanged(); } }]],
      ['View', () => FOLDERS.map(([id, n, ic]) => ({ label: n, icon: ic, rad: id === folder, act: () => { folder = id; sel = null; draw(); } }))],
      ['Tools', () => [{ label: 'Send and Receive', act: sendRecv }, { label: 'Address Book...', act: addressBook }, { label: 'Inbox Assistant...', act: () => loadMail().then(g => g.assistant()) }, '-', { label: 'Accounts...', act: () => Desk.msgbox('Internet Accounts', `Mail account: JackNet Mail (default)\nAddress: ${meAddr()}\nAlso: the.family@jacknet.jnet (the family one)\nServer: mail.jacknet.jnet\n\nConnection: JackNet 56K (dial-up)\n\nDon't change anything. Dad set it up and it took him a whole Sunday.`, 'info') }, { label: 'Options...', act: () => Desk.msgbox('Options', 'Check for new messages every: 30 minutes\nPlay sound when new messages arrive: yes\nSend messages immediately: yes (they never go)\nMom mode: ON', 'info') }]],
      ['Message', () => [{ label: 'New Message', act: () => compose({}) }, '-', { label: 'Reply to Sender', dis: !sel, act: () => act('reply') }, { label: 'Forward', dis: !sel, act: () => act('forward') }, '-', { label: 'Block Sender...', dis: !sel, act: () => { if (sel && /^\s*Mom\b/.test(sel.from)) A.secret('mail.blockmom'); Desk.msgbox('Block Sender', sel && /Dave|Mom|Gran/.test(sel.from) ? 'You can\'t block ' + nameOf(sel.from) + '. Believe us, we tried.' : 'Sender blocked. (They\'ll be back. They always come back.)', 'info'); } }]],
      ['Help', [{ label: 'About Outlook Express', act: () => Desk.msgbox('About Outlook Express', 'Outlook Express\nVersion 5 (JackOS edition)\n\nE-mail for the whole family. Mainly Jack.\n\nThis product is licensed to:\nThe Family', 'info') }]],
    ]);
    oeWins.add(draw); draw();
    if (unread('inbox') && folder === 'inbox') Sound.play('join');
    if (!MG()) loadMail().catch(() => {});
    return w;
  }
  function delMsg(m) {
    const f = ms.moved[m.id] || m.f;
    if (f === 'deleted') return Desk.msgbox('Outlook Express', `Are you sure you want to permanently delete "${m.subj}"?`, 'q', [['Yes', () => { if (m.user) ms.user = ms.user.filter(u => u.id !== m.id); else ms.gone[m.id] = 1; mailChanged(); }], ['No']]);
    if (m.user) { const u = ms.user.find(x => x.id === m.id); if (u) u.f = 'deleted'; } else ms.moved[m.id] = 'deleted';
    Sound.play('thud'); mailChanged();
  }
  function emptyDeleted() {
    const d = messages('deleted'); if (!d.length) return Desk.msgbox('Outlook Express', 'The Deleted Items folder is already empty.', 'info');
    Desk.msgbox('Outlook Express', `Are you sure you want to permanently delete all ${d.length} message(s) in the Deleted Items folder?`, 'q', [['Yes', () => { d.forEach(m => { if (m.user) ms.user = ms.user.filter(u => u.id !== m.id); else ms.gone[m.id] = 1; }); crumple(); mailChanged(); }], ['No']]);
  }
  const quote = m => `\n\n----- Original Message -----\nFrom: ${pers(m.from || JACK)}\nTo: ${pers(m.to || FAM)}\nSent: ${msgDate(m)}\nSubject: ${m.subj}\n\n` + String(m.body || '').split('\n').map(l => '> ' + l).join('\n');
  const replyTo = m => ({ to: m.user && !m.inc ? (m.to || '') : m.from, subj: /^re:/i.test(m.subj) ? m.subj : 'Re: ' + m.subj, body: quote(m), reOf: m.id });
  const fwdOf = m => ({ subj: 'Fw: ' + m.subj, body: quote(m), att: m.att, fwOf: m.id });
  function openMsg(m, getList) {
    const b = document.createElement('div'); b.className = 'oe-msg';
    const SV = { reply: '<svg viewBox="0 0 24 24"><rect x="6" y="8" width="16" height="11" fill="#fff" stroke="#555"/><path d="M9 5H4v5M4 5l6 6" stroke="#1a5ad8" stroke-width="2" fill="none"/></svg>' };
    if (window.JICON) SV.reply = JICON.get('tb-reply', 24);
    b.innerHTML = `<div class="fx-tools">${tool('reply', 'Reply', SV.reply)}${tool('forward', 'Forward', TB.fwd)}${tool('delete', 'Delete', TB.del)}<span class="tsep"></span>${tool('prev', 'Previous', TB.up.replace('M12 19v-8M8 14l4-4 4 4', 'M12 19v-8M8 14l4-4 4 4'))}${tool('next', 'Next', TB.up.replace('M12 19v-8M8 14l4-4 4 4', 'M12 11v8M8 15l4 4 4-4'))}</div><div class="oe-msgbody field"></div>`;
    const w = A.win(m.subj || '(no subject)', b, { w: 540, h: 440, icon: I.envOpen, minW: 260, minH: 200, cls: 'oewin' });
    const body = b.querySelector('.oe-msgbody');
    const show = () => { w.setTitle(m.subj || '(no subject)'); body.innerHTML = msgHtml(m, true); wireAtt(body, m); body.scrollTop = 0; markRead(m); };
    b.querySelector('.fx-tools').addEventListener('click', ev => {
      const e = ev.target.closest('[data-a]'); if (!e) return; const a = e.dataset.a, L = getList(), i = L.indexOf(m);
      if (a === 'reply') compose(replyTo(m)); else if (a === 'forward') compose(fwdOf(m));
      else if (a === 'delete') { delMsg(m); w.close(); }
      else if (a === 'prev' && i > 0) { m = L[i - 1]; show(); } else if (a === 'next' && i >= 0 && i < L.length - 1) { m = L[i + 1]; show(); }
    });
    show();
    return w;
  }
  const CONTACTS = [['Dave', DAVE], [CN('cousin2') + ' (cousin)', RYAN], ['Gran', GRAN], ['Mom', MOM], ['Dad (at work)', 'Dad (at work) <dad.at.work@jacknet.jnet>'], [CT('{teacher} (Computer Club)'), ALI], ['The N64 Fan Club', N64], ['Gubbinz Fan Club', GFC], ['JackNet Customer Services', 'JackNet Customer Services <help@jacknet.jnet>']];
  function addressBook(pickCb) {
    const b = document.createElement('div');
    b.innerHTML = `<div class="field fx-details ab-list">${CONTACTS.map(([n, a], i) => `<button type="button" class="fx-row ab-row fx-it" data-i="${i}"><span class="fx-nm">${ICO16('<svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" fill="#f2c79a" stroke="#000"/><path d="M2 15c0-5 12-5 12 0z" fill="#2a7ad8" stroke="#000"/></svg>')}<span>${esc(n)}</span></span><span>${esc(a.replace(/^.*<|>$/g, ''))}</span></button>`).join('')}</div><div class="small" style="margin-top:6px">${pickCb ? 'Click a contact to add them.' : 'Click a contact to write to them.'}</div>`;
    const w = A.win('Address Book - The Family', b, { w: 440, h: 320, icon: I.mail, noMax: true });
    b.querySelector('.ab-list').addEventListener('click', ev => { const e = ev.target.closest('[data-i]'); if (!e) return; const a = CONTACTS[+e.dataset.i][1]; w.close(); pickCb ? pickCb(a) : compose({ to: a }); });
  }
  let seq = ms.user.reduce((m, u) => Math.max(m, u.seq || 0), 0);
  function compose(o) {
    o = o || {};
    const b = document.createElement('form'); b.className = 'oe-comp';
    b.innerHTML = `<div class="fx-tools">${tool('send', 'Send', '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="12" fill="#fff" stroke="#555"/><path d="M2 7l8 6 8-6" fill="none" stroke="#555"/><path d="M14 4h8M19 1l3 3-3 3" stroke="#1a9a1a" stroke-width="2" fill="none"/></svg>')}<span class="tsep"></span>${tool('save', 'Save', '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="#333" stroke="#000"/><rect x="7" y="3" width="10" height="6" fill="#c0c0c0"/><rect x="6" y="13" width="12" height="8" fill="#fff"/></svg>')}${tool('attach', 'Attach', '<svg viewBox="0 0 24 24"><path d="M15 5v11a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10" fill="none" stroke="#000" stroke-width="1.6"/></svg>')}${tool('check', 'Check', '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="#fff" stroke="#555"/><path d="M6 12l4 4 8-9" stroke="#1a9a1a" stroke-width="2.5" fill="none"/></svg>')}${tool('spell', 'Spelling', '<svg viewBox="0 0 24 24"><text x="2" y="12" font-size="9" font-family="Arial" font-weight="bold">ABC</text><path d="M6 17l4 4 10-10" stroke="#1a5ad8" stroke-width="2.5" fill="none"/></svg>')}</div>
      <div class="oe-fields"><label>From:</label><select><option>${esc(meNick())} (${esc(meAddr())}) - JackNet Mail</option></select><label><button type="button" class="oe-to">To:</button></label><input type="text" name="to" autocomplete="off"><label>Cc:</label><input type="text" name="cc" autocomplete="off"><label>Subject:</label><input type="text" name="subj" autocomplete="off"></div>
      <div class="oe-catt"></div><textarea name="body" spellcheck="false"></textarea>`;
    const w = A.win(o.subj || 'New Message', b, { w: 540, h: 440, icon: I.mail, minW: 280, minH: 260, cls: 'oewin' });
    const f = n => b.querySelector(`[name=${n}]`);
    f('to').value = o.to || ''; f('cc').value = o.cc || ''; f('subj').value = o.subj || ''; f('body').value = o.body || '';
    if (o.att && o.att.length) b.querySelector('.oe-catt').innerHTML = `<b>Attach:</b> ${o.att.map(a => esc(a.name)).join(', ')}`;
    f('subj').addEventListener('input', () => w.setTitle(f('subj').value || 'New Message'));
    b.querySelector('.oe-to').addEventListener('click', () => addressBook(a => { f('to').value = (f('to').value ? f('to').value + '; ' : '') + a; }));
    const start = JSON.stringify([o.to || '', o.cc || '', o.subj || '', o.body || '']);
    const changed = () => JSON.stringify([f('to').value, f('cc').value, f('subj').value, f('body').value]) !== start;
    const rec = folderId => { const t = today(); const u = { id: 'u' + Date.now(), seq: ++seq, f: folderId, from: pers(JACK), reOf: o.reOf, fwOf: o.fwOf, to: f('to').value.trim(), cc: f('cc').value.trim(), subj: f('subj').value.trim() || '(no subject)', body: f('body').value, date: `${pad2(t.d)}/${pad2(t.m)}/99`, time: nowTime() }; if (o.draftOf) ms.user = ms.user.filter(x => x.id !== o.draftOf.id); ms.user.push(u); mailChanged(); return u; };
    let done = false;
    w.el.querySelector('[data-w=close]').addEventListener('click', ev => { if (!done && changed() && !w.closed) { ev.stopImmediatePropagation(); Desk.msgbox('New Message', 'Do you want to save changes to this message?', 'warn', [['Yes', () => { rec('drafts'); done = true; w.close(); Desk.toast('Outlook Express', 'Your message has been saved in your Drafts folder.', 3000); }], ['No', () => { done = true; w.close(); }], ['Cancel']]); } }, true);
    b.addEventListener('submit', ev => ev.preventDefault());
    b.querySelector('.fx-tools').addEventListener('click', ev => {
      const e = ev.target.closest('[data-a]'); if (!e) return; const a = e.dataset.a;
      if (a === 'send') {
        if (!f('to').value.trim() && !f('cc').value.trim()) return Desk.msgbox('Send Mail', 'The message must have at least one recipient. Please put an e-mail address or a Contact name in the To or Cc box.', 'warn');
        if (!f('subj').value.trim()) return Desk.msgbox('Outlook Express', 'This message does not have a subject. Do you want to send it anyway?', 'q', [['Yes', () => { f('subj').value = '(no subject)'; e.click(); }], ['No']]);
        rec('outbox'); done = true; w.close(); S('send'); sendRecv(true);
      } else if (a === 'save') { rec('drafts'); done = true; w.close(); Desk.toast('Outlook Express', 'Your message has been saved in your Drafts folder.', 3000); }
      else if (a === 'attach') Desk.msgbox('Insert Attachment', 'Attachments are switched off.\n\nMom\'s rule number 3. Also, a 1MB attachment would take about four minutes to send on our modem, and Mom needs the phone.', 'info');
      else if (a === 'check') { const t = f('to').value.trim(); if (!t) return Desk.msgbox('Check Names', 'There are no names to check.', 'info'); const hit = CONTACTS.find(c => c[0].toLowerCase().startsWith(t.toLowerCase().split(/[ <@]/)[0])); if (hit) { f('to').value = hit[1]; Desk.toast('Check Names', `Found: ${hit[0]}`, 2000); } else Desk.msgbox('Check Names', `"${t}" is not in your Address Book. That's OK, JackNet will try anyway. (It won't get there.)`, 'info'); }
      else if (a === 'spell') Desk.msgbox('Spelling', 'JackOS could not find a spelling checker.\n\nMrs Hargreaves would be disappointed. (She found "recieve" 6 times on the website.)', 'warn');
    });
    setTimeout(() => (o.to ? f('body') : f('to')).focus(), 40);
    return w;
  }
  // Mail to anyone @jackattack.jnet really arrives: it's posted on the Letters page, and JACK ATTACK!'s mail robot replies.
  const toMag = m => ((m.to || '') + ' ' + (m.cc || '')).toLowerCase().split(/[\s,;<>"]+/).some(a => /@jackattack\.jnet$/.test(a) && !/^(weekly|forums|noreply|no-reply|robot)@/.test(a));
  function deliverToMag(list) {
    list.forEach((m, k) => {
      const u = ms.user.find(x => x.id === m.id); if (u) u.f = 'sent';
      const name = Net.me.member ? Net.me.nick : 'A Reader (' + Net.me.nick + ')';
      const own = String(m.body || '').split(/\n-{3,}\s*Original Message/i)[0].split('\n').filter(l => !/^>/.test(l)).join('\n').trim(); // just what they wrote, not the quoted e-mail
      const msg = (m.subj && m.subj !== '(no subject)' ? m.subj + ' - ' : '') + own;
      setTimeout(() => Net.send({ t: 'gb', name, from: '', home: '', found: 'E-mail', msg: msg.slice(0, 500) || '(an empty e-mail!)' }), k * 11000);
      setTimeout(() => {
        const t = today();
        ms.user.push({ id: 'r' + Date.now() + k, seq: ++seq, f: 'inbox', inc: true, from: 'JACK ATTACK! Letters <letters@jackattack.jnet>', to: m.from || JACK,
          subj: 'Re: ' + (m.subj || '(no subject)') + ' - THANKS FOR YOUR LETTER!!!',
          body: `Hi ${nameOf(name)}!!!\n\nThanks for your e-mail to JACK ATTACK! Online. This is an automatic reply from my mail robot (I built it myself, it is a bit rubbish).\n\nYour letter has gone straight onto the LETTERS page for everyone to read. Have a look:\n\n    http://www.jackattack.jnet/letters.htm\n\nIf it's a really good one it might be STAR LETTER of the day!!! I read every single letter (Mom says not at the dinner table).\n\nYESSS!\nJack\nEditor, JACK ATTACK! Online\n\n-----\n> ${String(m.body || '').split('\n').slice(0, 6).join('\n> ')}`,
          date: `${pad2(t.d)}/${pad2(t.m)}/99`, time: nowTime() });
        mailChanged(); Sound.play('join');
        Desk.toast('Outlook Express', 'You have 1 new e-mail message from JACK ATTACK! Letters.', 5000);
        A.secret('files.maglettter');
      }, 7000 + k * 11000 + Math.random() * 5000);
    });
    mailChanged();
  }
  A.defineSecret('files.maglettter', 'You\'ve got mail', 'Write to Jack the 1999 way');
  function sendRecv(justSent) {
    const mag = messages('outbox').filter(toMag);
    if (mag.length) deliverToMag(mag);
    const out = messages('outbox');
    loadMail().catch(() => {});
    const b = document.createElement('div');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${I.mail.replace('<svg', '<svg width="32" height="32"')}<div class="fx-plog">${out.length ? `Sending message 1 of ${out.length}` : 'Checking for new messages on \'JackNet Mail\'...'}</div></div><div class="prog" style="margin-top:8px"><span style="display:flex;gap:2px"></span></div><div class="group"><span class="lg">Tasks</span><div class="small">${out.length ? `&#9654; Send ${out.length} message(s)` : ''}<br>&#9654; Check for new messages on 'JackNet Mail'</div></div><div class="row" style="justify-content:flex-end"><button class="btn" type="button">Hide</button><button class="btn" type="button">Stop</button></div>`;
    const w = A.win('JackNet Mail - ' + (out.length ? 'Sending' : 'Receiving'), b, { w: 360, noResize: true, noMax: true, icon: I.mail });
    b.querySelectorAll('.btn').forEach((x, i) => x.addEventListener('click', () => { if (i) clearInterval(t); w.close(); }));
    Sound.play('modem');
    const bar = b.querySelector('.prog span'); let i = 0;
    const t = setInterval(() => {
      i++; if (i < 18) bar.appendChild(document.createElement('i'));
      if (i === 8 && out.length) b.querySelector('.fx-plog').textContent = `Sending message 1 of ${out.length}... Connecting to 'smtp.jacknet.jnet'...`;
      if (i >= 26) {
        clearInterval(t); if (!w.closed) w.close();
        const sent = MG() ? MailGen.send(ms.user.filter(u => u.f === 'outbox' && !toMag(u))).length : 0;
        const left = messages('outbox'), got = MG() ? MailGen.fetch() : 0;
        if (sent && !left.length) { Desk.toast('Outlook Express', `${sent} message${sent > 1 ? 's' : ''} sent.${got ? ' And 1 new message came in!' : ''}`, 4000); mailChanged(); return; }
        if (got && !left.length) { Desk.toast('Outlook Express', 'You have 1 new message!', 4000); mailChanged(); return; }
        if (justSent && !left.length) { mailChanged(); return; }
        if (left.length) Desk.msgbox('JackNet Mail - Error', `The server could not be found. (Account: 'JackNet Mail', SMTP Server: 'smtp.jacknet.jnet', Error Number: 0x800CCC0D)\n\nAccount: 'JackNet Mail'\nServer: 'smtp.jacknet.jnet'\nProtocol: SMTP\nPort: 25\nSecure(SSL): No\nSocket Error: 11001\n\n${left.length} message(s) are still in your Outbox.${sent ? `\n\n(${sent} other message(s) were sent fine: mail to addresses on JackNet always gets there.)` : '\n\nTIP: JackNet Mail can only reach addresses on JackNet (like dave@hotjack.jnet). The rest of the Internet is a bit far.'}`, 'warn');
        else Desk.toast('Outlook Express', unread('inbox') ? `No new messages. (You still have ${unread('inbox')} unread in your Inbox!)` : 'No new messages. Check again tomorrow. (It\'s always tomorrow in 1999.)', 4000);
        mailChanged();
      }
    }, 110);
  }
  // what the e-mail engine (js/mail-gen.js) gets to use
  const mailApi = {
    ms, contacts: CONTACTS, icon: I.mail, changed: mailChanged, save: saveMs, messages, isNew, nameOf, compose, sendRecv: () => sendRecv(),
    byId: id => { for (const [f] of FOLDERS) { const m = messages(f).find(x => x.id === id); if (m) return m; } return null; },
    deliver: o => { ms.user.push(Object.assign({ id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6), seq: ++seq, f: 'inbox', inc: true, date: todayStr(), time: nowTime() }, o)); const inc = ms.user.filter(u => u.inc); if (inc.length > 120) { const old = new Set(inc.slice(0, inc.length - 120).map(u => u.id)); ms.user = ms.user.filter(u => !old.has(u.id)); } mailChanged(); },
  };
  let mailP = null;
  function loadMail() {
    return mailP = mailP || A.load('js/mail-gen.js').then(() => Promise.all(['js/mail-tpl-a.js', 'js/mail-tpl-b.js', 'js/mail-tpl-c.js'].map(f => A.load(f)))).then(() => { if (!MailGen.ready) MailGen.attach(mailApi); return MailGen; }).catch(e => { mailP = null; throw e; });
  }
  // ================================================================ register everything
  A.register('explorer', { cmd: ['explorer', 'winfile', 'my computer'], open: arg => openExplorer(arg) });
  A.register('notepad', { cmd: ['notepad', 'edit'], open: arg => openNotepad(arg && typeof arg === 'object' ? arg : {}) });
  A.register('outlook', { single: true, cmd: ['msimn', 'outlook', 'outlook express', 'mail', 'email', 'e-mail'], open: () => openOutlook() });
  A.register('imgview', { cmd: ['imgview', 'kodakimg', 'pictures'], open: arg => arg && arg.art ? openViewer(arg) : openExplorer('C:\\My Documents\\My Pictures') });
  A.register('files.bin', { single: true, cmd: ['recycled', 'recycle bin', 'recycle'], open: () => openBin() });
  A.cmd(['c:', 'c:\\', 'c:/'], () => A.open('explorer', 'C:\\'));
  A.cmd(['a:', 'a:\\', 'a:/'], () => A.open('explorer', 'A:\\'));
  A.cmd(['d:', 'd:\\', 'd:/'], () => A.open('explorer', 'D:\\'));
  A.cmd(['my documents', 'mydocs'], () => A.open('explorer', 'C:\\My Documents'));
  A.cmd(['defrag'], () => runFake('app:defrag>defrag'));
  A.cmd(['scandisk', 'scandskw'], () => runFake('app:scandisk>scandisk'));
  A.cmd(['regedit'], () => runFake('app:regedit>regedit'));
  A.cmd(['gubbinzrules', 'gubbinz rules'], gubbinzRules);
  A.OPENERS.exe = node => node.blocked ? blocked(node) : runFake(node.arg, node);
  A.addProgram(['Accessories', 'Notepad'], 'notepad', I.notepad);
  A.addProgram(['Accessories', 'Image Viewer'], 'imgview', I.viewer);
  A.addProgram(['Accessories', 'System Tools', 'Y2K Checker'], () => runFake('y2k'), I.sys);
  A.addProgram(['Accessories', 'Communications', 'Dial-Up Networking'], () => openExplorer('Dial-Up Networking'), I.dialup);
  A.addProgram(['Accessories', 'Entertainment', 'Sound Recorder'], () => openExplorer('C:\\JACKOS\\Media'), I.wav);
  A.addProgram(['Accessories', 'Cube Timer 2.0'], cubeTimer, I.exe);
  A.addProgram(['Outlook Express'], 'outlook', I.mail);
  A.addProgram(['JackOS Explorer'], 'explorer', I.folderOpen);

  // ---- desktop icons
  A.desktopIcon('My Computer', I.mycomp, () => openExplorer('My Computer'), 'iconMyComp');
  A.desktopIcon('My Documents', I.mydocs, () => openExplorer('C:\\My Documents'), 'iconMyDocs');
  A.desktopIcon('Outlook Express', I.mail, () => A.open('outlook'), 'iconOutlook');
  binIcon = A.desktopIcon('Recycle Bin', binFull() ? I.binFull : I.binEmpty, () => A.open('files.bin'), 'iconBin');

  // ---- secret bits outside the drive
  function gubbinzRules() {
    S('runcode'); Sound.play('waaagh');
    const who = (window.Net && Net.me && Net.me.nick) || 'You';
    const b = document.createElement('div'); b.className = 'gas';
    b.innerHTML = `<div class="gas-in"><div class="gas-t">GUBBINZ APPRECIATION SOCIETY</div><div class="gas-s">CERTIFICATE OF MEMBERSHIP</div><div class="gas-pic"></div><p>This is to certify that</p><div class="gas-n">${esc(who)}</div><p>is an official member of the Gubbinz Appreciation Society<br>and is entitled to: one (1) slice of pizza, flappy ears (honorary)<br>and the right to shout WAAAGH! at any time.</p><div class="gas-sig"><span>Jack</span><span>Gubbinz (his mark: <b>X</b>)</span></div></div>`;
    const cv = artCanvas('gubbinz'); cv.style.width = '72px'; cv.style.height = '72px'; b.querySelector('.gas-pic').appendChild(cv);
    A.win('GUBBINZRULES.EXE', b, { w: 380, noResize: true, noMax: true, icon: I.exe });
  }
  if (window.IE && IE.addPage) IE.addPage('keepoutdave', 'KEEP OUT DAVE', () => {
    S('secretpage');
    const img = artCanvas('warboss').toDataURL();
    return `<div class="kod"><h1 class="kod-h">KEEP OUT DAVE</h1><div class="kod-scan">DAVE DETECTOR v1.0 ... scanning ... <b>RESULT: YOU ARE NOT DAVE.</b> Welcome!</div>
      <p>This is my secret page. If you found it, you read my WORLD DOMINATION PLANS, which means you got into my secret folder, which means you solved the riddle. Respect.</p>
      <div class="kod-row"><img src="${img}" width="168" height="168" alt="Jack's best ever painted Warboss" class="kod-img"><div><h3>MY BEST EVER MODEL</h3><p>This is my Warboss. He took four weeks. His armour has 9 coats of red (because red ones go faster). Dave has never seen him. Dave will NEVER see him.</p><p>If you see Dave, act normal.</p></div></div>
      <h3>THINGS DAVE DOESN'T KNOW</h3><ul><li>I've unlocked Egyptian in GoldenEye.</li><li>I let him win at Mario Kart sometimes. (Sometimes.)</li><li>The password to my folder. (He's tried "DAVE" 17 times.)</li><li>He's my best mate. (DO NOT TELL HIM.)</li></ul>
      <p class="kod-foot">You are visitor number <b>2</b> to this page. (Visitor number 1 was me.)</p></div>`;
  });

  // ---- secrets
  [['locked', 'Keep out, Dave!', 'One folder needs a password. The riddle is somewhere on C:'],
   ['plans', 'World domination', 'Read Jack\'s top secret plans'],
   ['runcode', 'Gubbinz rules', 'A secret code word works in Start > Run'],
   ['secretpage', 'Not Dave', 'Jack has a hidden web page. The address is a secret too'],
   ['diarytoday', 'Dear Diary', 'Read what Jack wrote most recently'],
   ['diary10', 'Nosy reader', 'Read ten of Jack\'s diary entries'],
   ['restore', 'Second chances', 'Some things in the bin deserve to come back'],
   ['emptybin', 'Take out the trash', 'Every bin needs emptying eventually'],
   ['virus', 'Totally not a virus', 'Run something Jack threw away for a good reason'],
   ['temp', 'Temp worker', 'Find the folder nobody is supposed to look in'],
   ['tempnote', 'Ghost in the machine', 'Somebody left a note where nobody reads'],
   ['hiddenpic', 'Camera shy', 'A shy picture is hiding with the others'],
   ['floppy', 'Insert disk', 'Drive A: needs a bit of persuading'],
   ['coverdisc', 'Cover disc', 'There\'s a CD in drive D:'],
   ['save', 'Author', 'Write and save something of your own'],
   ['timedate', 'What year is it?', 'Ask Notepad for the time and date'],
   ['future', 'Not yet!', 'Try to open a letter meant for the future'],
   ['homeworkdoc', 'Procrastinator', 'Open Jack\'s homework. All of it'],
   ['mail10', 'Inbox hero', 'Read ten e-mails'],
   ['mailclue', 'Message in a bin', 'Check where deleted e-mail goes'],
   ['junk', 'Spam, spam, spam', 'Read something from the Junk folder'],
   ['attach', 'Paperclip', 'Open an e-mail attachment'],
   ['antivirus', 'Melissa who?', 'Try to open a dodgy attachment'],
   ['send', 'Server not found', 'Try to send an e-mail'],
   ['y2kbug', 'Bug hunter', 'Find the Millennium Bug itself'],
   ['y2kcheck', 'Compliant (probably)', 'Check the computer is ready for the year 2000'],
   ['dialup', 'Mom\'s on the phone', 'Try to connect to the Internet the old way'],
   ['testpage', 'Out of cyan', 'Print a test page'],
   ['address', 'Power user', 'Type your way around Explorer'],
   ['gallery', 'Art critic', 'Look at ten of Jack\'s pictures'],
   ['pixelpeeper', 'Pixel peeper', 'Get really, REALLY close to one of Jack\'s pictures'],
   ['music', 'Press play', 'Play something from the Media folder'],
  ].forEach(([id, n, h]) => A.defineSecret('files.' + id, n, h));

  // ---- typing a folder path into Start > Run opens it (once every pack has added its folders)
  addEventListener('load', () => {
    if (!KNOWN.has('defrag')) A.addProgram(['Accessories', 'System Tools', 'Disk Defragmenter'], () => runFake('defrag'), I.hdd);
    if (!KNOWN.has('scandisk')) A.addProgram(['Accessories', 'System Tools', 'ScanDisk'], () => runFake('scandisk'), I.hdd);
    const walk = (n, p) => (n.kids || []).forEach(k => { if (k.type !== 'dir') return; const q = p + '\\' + k.name; A.cmd([q.toLowerCase(), q.toLowerCase().replace(/\\/g, '/')], () => A.open('explorer', q)); walk(k, q); });
    walk(A.fs.root, 'C:');
  });
  // ---- the e-mail engine (js/mail-*.js): a personal, date-aware pile of post for whoever is logged on. Loaded a few seconds after log-on.
  (window.BootDone || Promise.resolve()).then(() => setTimeout(() => loadMail().catch(e => console.warn('[mail]', e)), 2500));
  [['live', 'Special delivery', 'Stay online long enough for the post to come'], ['tray', 'Little envelope', 'Something in the corner of the screen wants your attention'],
   ['rare', 'Once in a blue modem', 'Some e-mails only turn up once in a while'], ['golden', 'The Golden Cartridge', 'The rarest e-mail on JackNet. Good luck'],
   ['gran', 'CAPS LOCK CHAMPION', 'Write back to Gran'], ['dave', 'Challenge accepted', 'Reply to Dave. He\'s been practising'], ['gubbinz', 'Fluent in Gubbinz', 'Write to a certain little green helper'],
   ['chain', 'Don\'t break the chain', 'Do what the chain letter says (it\'s harmless)'], ['chain5', 'Chain gang', 'Keep a chain letter going. And going'], ['chain10', 'The never-ending chain', 'Does it ever stop?'],
   ['unsub', 'Unsubscribe me!', 'Try to leave a mailing list'], ['unsub5', 'Still subscribed', 'Try to leave five different mailing lists'],
   ['ecard', 'Wish you were here', 'Pick up an e-card'], ['rules', 'Inbox Assistant', 'Teach Outlook Express a new trick'], ['exclusive', 'Nobody gets in', 'Turn the junk filter all the way up'],
   ['hoax', 'Hoax buster', 'Check whether a scary virus warning is real'], ['spamclick', 'Never click the spam', 'Ask a spammer to remove you (don\'t do this for real)'],
   ['midnight', 'Night owl', 'Check your e-mail when you should be asleep'], ['switch', 'Identity crisis', 'Log on as somebody else and see whose post you get'],
   ['read50', 'Postmaster General', 'Read fifty e-mails'], ['today', 'Inbox zero, 1999', 'Read every e-mail that arrived today'], ['regular', 'Regular correspondent', 'Check your e-mail on seven different days'],
   ['release', 'It\'s out TODAY', 'Read an e-mail on a big day'], ['penpal', 'Pen pal', 'Write to your pen pal'], ['bounce', 'Return to sender', 'Get an e-mail sent back to you'],
   ['ascii', 'ASCII masterpiece', 'Some e-mails are pictures made of letters'], ['jack', 'From the Editor', 'Get a letter from Jack himself'], ['blockmom', 'Nice try', 'Try to stop Mom\'s e-mails'],
   ['ooo', 'Out of office', 'E-mail Dad at work'], ['space', 'Mission control', 'Read the space news on a launch day'],
  ].forEach(([id, n, h]) => A.defineSecret('mail.' + id, n, h));

  document.addEventListener('click', ev => { // links inside e-mails open in JackNet Explorer
    const a = ev.target.closest && ev.target.closest('.oe-link'); if (!a) return; ev.preventDefault();
    const br = document.getElementById('browser'); if (br) { br.classList.remove('min'); const tb = document.getElementById('taskBrowser'); if (tb) tb.hidden = false; if (window.Desk && Desk.activate) Desk.activate(br); } // the browser comes to the front
    if (window.IE) IE.navigate(a.dataset.url);
  });
  // mailto: links on web pages, and IE's Mail > New Message, write a new e-mail
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('#page a[href^="mailto:"]'); if (!a) return; ev.preventDefault();
    const q = a.getAttribute('href').slice(7).split('?'), p = new URLSearchParams(q[1] || '');
    compose({ to: decodeURIComponent(q[0]), subj: p.get('subject') || '', body: p.get('body') || '' });
  });
  window.JackFiles = { open: openExplorer, notepad: openNotepad, viewer: openViewer, outlook: openOutlook, bin: openBin, compose, art: artCanvas, deliver: o => mailApi.deliver(o) };
})();
