/* lan: THE LAN. Every visitor's PC is on one network (server side: mods/lan.js).
 *  - Network Neighborhood for real: \\GUEST1234 and \\NAME-PC for everyone online, Shared Documents you can open and copy,
 *    "Sharing..." on your own files (right-click in My Computer), Map Network Drive, and WinPopup between real visitors.
 *  - Floppy sneakernet: Send To > 3½ Floppy (A:), a disk box, labels, "Disk is full", and "Give disk to..." another visitor.
 *  - SQUIG99: a harmless pretend e-mail worm (a parody of 1999's Happy99) that spreads to people you've swapped stuff with,
 *    the www.jackshield.netz outbreak map and JACKCLEAN.EXE, which cures it in one click.
 *  - Counter Wars (www.counterwars.homepagez): the week's Top 10 Homepagez hit counters and the Golden Counter Award.
 *  - Quiz Night: QuizJack runs a 1999 pub quiz in JackIRC #quiznight on the hour, every hour.
 * This file is the always-loaded core (hooks, network messages, tray); lan-ui.js (windows) and lan-web.js (web sites) load lazily. */
(function () {
  'use strict';
  const A = window.Apps;
  if (!A || !window.Net) return;
  const esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const J = (n, s) => (window.JICON && JICON.has(n)) ? (s ? JICON.get(n, s) : JICON.icon(n)) : A.ICON.exe;
  const touch = () => matchMedia('(hover:none)').matches;
  const S = (id, name, hint) => A.defineSecret('lan.' + id, name, hint);
  const got = id => A.secret('lan.' + id);
  const d99 = () => { const t = Desk.today99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; };
  const KEY = { shares: 'jhp_lan_shares', got: 'jhp_lan_got', pops: 'jhp_lan_pops' };

  // ================================================================ shared state + a tiny event hub (lan-ui.js and lan-web.js listen here)
  const hub = {};
  const L = window.LAN = {
    online: [], inf: null, blocks: [], box: null, disk: null, shares: store.get(KEY.shares, []), pops: [], got, S, d99, esc, J, touch,
    on(t, fn) { (hub[t] = hub[t] || []).push(fn); return () => { hub[t] = hub[t].filter(x => x !== fn); }; },
    emit(t, m) { (hub[t] || []).slice().forEach(fn => { try { fn(m); } catch (e) { console.error(e); } }); },
    send: m => Net.send(m),
    pcName: o => o ? (o.member ? String(o.nick).toUpperCase().slice(0, 12) + '-PC' : String(o.nick).toUpperCase()) : '?',
    diskIn: () => !!(L.box && L.box.cur),
    ui: null, web: null,
  };
  L.loadUI = () => A.load('js/lan-ui.js').then(() => L.ui);
  L.loadWeb = () => A.load('js/lan-web.js').then(() => L.web);
  const withUI = fn => L.loadUI().then(ui => fn(ui)).catch(e => { console.error(e); Desk.msgbox('JackOS', 'Cannot find the file \'LAN.DLL\' (or one of its components). Is the network cable plugged in?', 'warn'); });

  // ================================================================ styles (this pack has no .css file, so they live here)
  const css = `
.lan-tray svg{width:16px;height:16px}
.lan-pc .ff-grid{background:#fff}
.lan-bar{display:flex;align-items:center;gap:6px;flex:none;font:11px var(--ui);padding:2px 2px 0}
.lan-bar .field{flex:1;height:14px;padding:1px;display:flex;gap:1px;overflow:hidden}
.lan-bar .field i{display:block;flex:none;width:6px;background:#000080}
.lan-label{position:relative;flex:none;margin:2px;padding:6px 10px 6px 40px;background:#f8f6e8;border:1px solid #808080;font:15px "Comic Sans MS","Comic Sans",cursive;color:#1a1a8a;min-height:22px;cursor:pointer;background-image:repeating-linear-gradient(#f8f6e8 0 13px,#b8c8ff 13px 14px)}
.lan-label:before{content:"";position:absolute;left:8px;top:6px;width:22px;height:22px;background:#2a2a2a;border:1px solid #000;box-shadow:inset 6px 0 0 #707070}
.lan-label small{display:block;font:10px var(--ui);color:#666}
.lan-grind{display:inline-flex;align-items:center;gap:6px}
.lan-grind b{display:inline-block;width:8px;height:8px;border-radius:50%;background:#0c0;box-shadow:0 0 4px #0f0;animation:lanBlink .18s steps(2) infinite}
@keyframes lanBlink{50%{background:#040}}
.lan-copy{display:flex;align-items:center;justify-content:space-between;height:44px;margin:4px 0 8px;position:relative}
.lan-copy .pg{position:absolute;left:44px;top:8px;animation:lanFly 1s linear infinite}
@keyframes lanFly{0%{left:44px;top:14px}50%{top:0}100%{left:calc(100% - 64px);top:14px}}
.lan-pick{height:180px;overflow:auto;padding:2px;margin:6px 0;font:12px var(--ui)}
.lan-pick button{display:flex;align-items:center;gap:6px;width:100%;border:0;background:none;padding:3px 4px;text-align:left;font:inherit;color:#000;min-height:24px}
.lan-pick button svg{width:16px;height:16px;flex:none}
.lan-pick button.sel{background:#000080;color:#fff}
.lan-pick small{color:#666;margin-left:auto}
.lan-pick button.sel small{color:#ddd}
.lan-wp{display:flex;flex-direction:column;gap:6px;height:100%}
.lan-wp .ff-poptext{flex:1;min-height:80px;max-height:none;background:#fff}
.lan-wp .hd{font:12px var(--ui)}
.lan-fw{position:relative;height:220px;background:#000;overflow:hidden;border:2px inset #fff}
.lan-fw canvas{position:absolute;inset:0;width:100%;height:100%}
.lan-fw .msg{position:absolute;left:0;right:0;bottom:12px;text-align:center;font:bold 20px "Comic Sans MS",cursive;color:#ff0;text-shadow:2px 2px #c00}
.lan-scan{font:12px var(--ui)}
.lan-scan .field{height:110px;overflow:auto;padding:4px;font:11px "Courier New",monospace;white-space:pre-wrap}
.lan-scan .hit{color:#c00;font-weight:bold}
.lan-ss-logo{font:bold 20px Arial,sans-serif;color:#063;display:flex;align-items:center;gap:8px}
.ir-l.lan-qg .lan-qn{color:#9c009c}
.ir-l.lan-qg.q{font-weight:bold}
.ir-l.lan-qg.win{color:#009300;font-weight:bold}
.ir-l.lan-qg.hint{color:#7f0000}
.ir-l.lan-qg.big{font-weight:bold;color:#00007f}
.ir-l.lan-qg.info{color:#555}
@media (max-width:520px){.lan-pick{height:150px}}
`;
  const st = document.createElement('style'); st.id = 'lan-css'; st.textContent = css; document.head.appendChild(st);

  // ================================================================ files <-> the wire (text, a 64x48 16-colour picture, or a built-in picture)
  const PAL16 = [[0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0], [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192], [128, 128, 128], [255, 0, 0], [0, 255, 0], [255, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255]];
  const PW = 64, PH = 48;
  const parseSize = s => { const m = /([\d,.]+)\s*(KB|MB|bytes?)?/i.exec(String(s || '')); if (!m) return 0; const v = parseFloat(m[1].replace(/,/g, '')); const u = (m[2] || 'KB').toUpperCase(); return Math.round(u === 'MB' ? v * 1048576 : u.startsWith('B') ? v : v * 1024); };
  L.fmtSize = b => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : b >= 1024 ? Math.max(1, Math.round(b / 1024)).toLocaleString('en-GB') + ' KB' : b + ' bytes';
  function encodePic(dataURL) {
    return new Promise((ok, bad) => {
      const im = new Image();
      im.onload = () => {
        try {
          const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
          const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH); g.drawImage(im, 0, 0, PW, PH);
          const px = g.getImageData(0, 0, PW, PH).data, out = new Uint8Array(PW * PH / 2);
          for (let i = 0; i < PW * PH; i++) {
            const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2]; let best = 0, bd = 1e9;
            for (let k = 0; k < 16; k++) { const p = PAL16[k], d = (r - p[0]) ** 2 + (gg - p[1]) ** 2 + (b - p[2]) ** 2; if (d < bd) { bd = d; best = k; } }
            out[i >> 1] |= (i & 1) ? best : best << 4;
          }
          let s = ''; for (const v of out) s += String.fromCharCode(v);
          ok(btoa(s));
        } catch (e) { bad(e); }
      };
      im.onerror = () => bad(new Error('picture'));
      im.src = dataURL;
    });
  }
  const picCache = new Map();
  L.picURL = (pc, scale) => {
    const k = pc + (scale || 4); if (picCache.has(k)) return picCache.get(k);
    let url = '';
    try {
      const raw = atob(pc), cv = document.createElement('canvas'), z = scale || 4; cv.width = PW * z; cv.height = PH * z;
      const g = cv.getContext('2d');
      for (let i = 0; i < PW * PH; i++) { const v = raw.charCodeAt(i >> 1), c = (i & 1) ? v & 15 : v >> 4, p = PAL16[c]; g.fillStyle = `rgb(${p[0]},${p[1]},${p[2]})`; g.fillRect((i % PW) * z, Math.floor(i / PW) * z, z, z); }
      url = cv.toDataURL('image/png');
    } catch (e) { url = ''; }
    if (picCache.size > 60) picCache.clear();
    picCache.set(k, url); return url;
  };
  // a file node on the C: drive -> a wire file (null if it can't travel)
  L.toWire = async node => {
    if (!node || node.type === 'dir') return null;
    const base = { n: String(node.name).slice(0, 40), d: /^\d\d\/\d\d\/99$/.test(node.date || '') ? node.date : d99() };
    if (node.pc && /^[A-Za-z0-9+/]{2048}$/.test(node.pc)) return Object.assign(base, { ty: 'pic', pc: node.pc, sz: parseSize(node.size) || 461878 });
    if (node.type === 'png' || (node.type === 'img' && node.dataURL)) {
      const url = node.dataURL; if (!url) return null;
      return Object.assign(base, { ty: 'pic', pc: await encodePic(url), sz: parseSize(node.size) || 461878 });
    }
    if (node.type === 'img' && node.art && /^[a-z0-9_]{1,30}$/.test(node.art)) return Object.assign(base, { ty: 'art', art: node.art, sz: parseSize(node.size) || 230454 });
    let text = null; try { text = node.text; } catch (e) { text = null; }
    if (typeof text === 'string' && !node.locked && !node.blocked) return Object.assign(base, { ty: 'txt', tx: text.slice(0, 3000), sz: Math.max(parseSize(node.size), text.length, 1) });
    return null;
  };
  // a wire file -> a node you can open
  L.toNode = (f, extra) => {
    const n = { name: f.n, date: f.d || d99(), size: L.fmtSize(f.sz || 1), lan: true };
    if (f.ty === 'txt') Object.assign(n, { type: 'txt', text: f.tx || '' });
    else if (f.ty === 'pic') { Object.assign(n, { type: 'png', pc: f.pc }); Object.defineProperty(n, 'dataURL', { get: () => L.picURL(f.pc, 5), enumerable: false }); }
    else if (f.ty === 'art') Object.assign(n, { type: 'img', art: f.art });
    return Object.assign(n, extra || {});
  };
  L.iconOf = (f, s) => f.ty === 'txt' ? J('txt', s) : J('bmp', s);

  // ---- "From JackNet": files you've copied off other people's PCs (kept in this browser)
  const GOT_DIR = 'C:/My Documents/From JackNet';
  let gotFiles = store.get(KEY.got, []);
  function syncGot() {
    const dir = A.fs.dir(GOT_DIR); dir.date = dir.date || d99();
    dir.kids = gotFiles.map(f => L.toNode(f, { from: f.from }));
    dir.kids.push({ name: 'README.TXT', type: 'txt', date: '01/06/99', size: '1 KB', text: 'FROM JACKNET\n\nFiles you copy off other people\'s computers (in Network Neighborhood, or off a floppy\nsomebody handed you) end up in here.\n\nRemember: only open files from people you know. And never run a .EXE you weren\'t expecting.\n(Ask JackShield. They know.)\n' });
  }
  L.keep = (f, from) => {
    let name = f.n; const taken = new Set(gotFiles.map(x => x.n.toLowerCase()));
    for (let i = 2; taken.has(name.toLowerCase()) && i < 99; i++) name = f.n.replace(/(\.[^.]*)?$/, m => ` (${i})` + m);
    gotFiles.push(Object.assign({}, f, { n: name, from: String(from || '').slice(0, 20) }));
    if (gotFiles.length > 25) gotFiles = gotFiles.slice(-25);
    store.set(KEY.got, gotFiles); syncGot();
    return name;
  };
  L.unkeep = name => { gotFiles = gotFiles.filter(x => x.n !== name); store.set(KEY.got, gotFiles); syncGot(); };
  syncGot();

  // ---- my shares (the browser remembers them and puts them back on the network every time you connect)
  L.saveShares = () => store.set(KEY.shares, L.shares.slice(-8));
  function reshare() { L.shares.slice(-8).forEach((f, i) => setTimeout(() => Net.send({ t: 'lanShare', f }), 300 + i * 250)); }

  // ================================================================ network messages
  const setOnline = list => { L.online = Array.isArray(list) ? list : []; L.emit('online', L.online); };
  Net.on('welcome', m => { setOnline(m.online); setTimeout(() => { Net.send({ t: 'lanFlBox' }); reshare(); }, 400); quizOn = false; });
  Net.on('online', m => setOnline(m.online));
  Net.on('loginOk', () => setTimeout(() => Net.send({ t: 'lanFlBox' }), 500));
  ['lanShares', 'lanShareCh', 'lanList', 'lanFile', 'lanErr', 'lanPopOk', 'lanFl', 'lanFlErr', 'lanFlGave', 'lanOutbreak', 'lanOutbreakCh', 'lanCw', 'lanQuizTop', 'lanAdminOk']
    .forEach(t => Net.on(t, m => L.emit(t, m)));
  Net.on('lanMe', m => { const was = L.inf; L.inf = m.inf || null; L.blocks = m.blocks || []; L.myPc = m.pc; tray(); if (!was && L.inf) L.emit('infected', L.inf); L.emit('lanMe', m); });
  Net.on('lanBlocks', m => { L.blocks = m.list || []; L.emit('lanBlocks', m); });
  Net.on('lanFlBox', m => { L.box = m; L.emit('lanFlBox', m); });
  Net.on('lanFl', m => { L.disk = m; L.emit('lanFl', m); });
  Net.on('lanPopIn', m => { got('popin'); A.secret('fun.netgot'); withUI(ui => ui.popIn(m)); });
  Net.on('lanFlGot', m => {
    got('got'); try { Sound.play('thud'); } catch (e) {}
    const lbl = m.l ? `It says "${m.l}" on the label.` : 'The label is blank. (Mysterious.)';
    Desk.msgbox('You\'ve been handed a floppy disk!', `You've been handed a floppy disk by ${m.from}!\n\n${lbl}\nThere ${m.nf === 1 ? 'is 1 file' : `are ${m.nf} files`} on it.${m.note ? `\n\nA sticky note on it says:\n"${m.note}"` : ''}\n\n${m.inDrive ? 'It\'s in your drive A: now.' : 'It\'s in your disk box. (Your drive already had a disk in it.)'}`, 'info',
      [['Open A:', () => A.open('lan.floppy')], ['OK']]);
  });
  // the SQUIG99 e-mail turns up in Outlook Express
  Net.on('lanWormMail', m => deliverWorm(m.from, m.g | 0));
  function deliverWorm(from, g) {
    if (!window.JackFiles || !JackFiles.deliver) return;
    const who = String(from || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20);
    JackFiles.deliver({
      from: who ? `${who} <${who.toLowerCase()}@jacknet.jnet>` : '(unknown sender) <happy@new.year.99>', to: (Net.me.nick || 'you') + '@jacknet.jnet',
      subj: 'Happy New Year 1999 !!', worm: true,
      body: `${who ? `(This e-mail was sent from ${who}'s computer.)\n\n` : ''}Happy New Year 1999 !!\n\nOpen the attachment for FIREWORKS!!!\nIt's really good!!! Fireworks and everything!!!\n\n${who ? '' : 'Pass it on!!!\n'}`,
      att: [{ name: 'SQUIG99.EXE', type: 'exe', app: 'lan.squig99', arg: { from: who, g }, size: '10 KB', date: d99() }],
    });
    try { Sound.play('join'); } catch (e) {}
    Desk.toast('JackMail Express', 'You have 1 new e-mail message: "Happy New Year 1999 !!"', 6000);
  }
  L.deliverWorm = deliverWorm;

  // ================================================================ programs
  const open = (name, arg) => withUI(ui => ui[name](arg));
  A.register('nethood', { cmd: ['nethood', 'network', 'network neighborhood', 'net view', 'network neighbourhood'], open: arg => L.loadUI().then(ui => ui.nethood(arg)) });
  A.register('lan.winpopup', { cmd: ['winpopup.exe'], open: arg => L.loadUI().then(ui => ui.winpopup(arg)) });
  A.register('lan.floppy', { cmd: ['floppy', 'diskbox'], open: arg => L.loadUI().then(ui => ui.floppy(arg)) });
  A.register('lan.squig99', { open: arg => L.loadUI().then(ui => ui.squig99(arg)) });
  A.register('lan.squigclean', { cmd: ['jackclean', 'jackclean.exe', 'jackcln', 'squigclean', 'squigclean.exe', 'squigcln'], open: arg => L.loadUI().then(ui => ui.squigclean(arg)) });
  A.cmd(['winpopup', 'net send'], () => A.open('lan.winpopup'));
  A.cmd(['net use', 'net use e:', 'map network drive'], () => open('mapDrive'));
  A.cmd(['nbtstat', 'net config'], () => Desk.notepad('NET CONFIG.TXT', `NET CONFIG\n\nComputer name        \\\\${L.myPc || L.pcName(Net.me)}\nUser name            ${Net.me.nick || 'GUEST'}\nWorkgroup            JACKNET\nWorkstation root     C:\\JACKOS\nSoftware version     4.10.1998\nRedirector version   Y2K-compatible\nComputers on the LAN ${L.online.length}\n\nThe command completed successfully.\n`));
  A.cmd(['quiznight', '#quiznight', 'quiz night', 'pub quiz', 'quizjack', 'quizgrot'], () => quizJoin());
  A.cmd(['jackshield', 'squigshield', 'squig99', 'happy99'], () => { $('browser').classList.remove('min'); IE.navigate('http://www.jackshield.netz/'); });
  A.cmd(['counterwars', 'counter wars'], () => { $('browser').classList.remove('min'); IE.navigate('http://www.counterwars.homepagez/'); });
  // Run "a:" opens your own disk when one of yours is in the drive (Dave's disk otherwise, like before)
  const prevA = A.cmds['a:'];
  A.cmd(['a:', 'a:\\', 'a:/'], raw => L.diskIn() || !prevA ? A.open('lan.floppy') : prevA(raw));
  A.addProgram(['Accessories', 'Communications', 'WinPopup'], 'lan.winpopup', J('popup'));
  A.addProgram(['Accessories', 'System Tools', '3½ Floppy Disk Box'], 'lan.floppy', J('floppy'));
  if (window.Setup && Setup.product) {
    try {
      Setup.product('lan.squigclean', { n: 'JackClean 1.0', v: '1.0', kb: 96, lic: 'Freeware', by: 'JackShield Labs', cat: 'util', sq: 5, rel: '15/03/99', ic: 'scandisk', def: false,
        home: 'http://www.jackshield.netz/', apps: ['lan.squigclean'], paths: ['Accessories > System Tools > JackClean'], launch: 'lan.squigclean', exe: 'JACKCLN.EXE', dir: 'JackShield',
        d: 'Finds the SQUIG99 e-mail worm and gets rid of it in one click. Also checks under the bed. Free from JackShield Labs.', note: 'Free for kids, grans and anyone with a worm problem.' });
      A.addProgram(['Accessories', 'System Tools', 'JackClean'], 'lan.squigclean', J('scandisk'));
    } catch (e) { console.error(e); }
  }

  // ---- files on the C: drive
  A.fs.add('C:/JACKOS', { name: 'WINPOPUP.EXE', type: 'exe', app: 'lan.winpopup', date: '11/05/98', size: '28 KB' });
  A.fs.add('C:/JACKOS', { name: 'LMHOSTS.SAM', type: 'txt', date: '11/05/98', size: '3 KB', text: '# LMHOSTS file for the JackNet LAN\n#\n# This file says which computer is which. It is mostly comments.\n# Lines that start with # are comments. This is also a comment.\n#\n# 192.168.0.1    JACKS-PC        #PRE  (the good one)\n# 192.168.0.2    DAVE-PC         #PRE  (switched off at the wall)\n# 192.168.0.99   GUBBINZ         #PRE  (how did Gubbinz get an IP address)\n#\n# Everyone else turns up by themselves. That\'s the magic of the network.\n# (Dad says it isn\'t magic, it\'s "NetBIOS". Same thing.)\n' });
  A.fs.add('C:/JACKOS', { name: 'NETWORK.TXT', type: 'txt', date: '20/06/99', size: '2 KB', text: 'THE JACKNET LAN - HOW IT WORKS\n==============================\n\nEvery person on the site right now has a computer in Network Neighborhood.\nGuests are \\\\GUEST1234, members are \\\\NAME-PC.\n\nSHARING\n  Right-click one of your files in My Computer > Sharing... and it goes in your\n  Shared Documents. Other people can open it and copy it. Stop sharing any time.\n  Only text files and pictures fit down the cable. Pictures get squashed to\n  64 x 48 and 16 colours, because of the 56K modem.\n\nWINPOPUP\n  Pops a message up on somebody\'s screen. Be nice, or they\'ll block you.\n\nFLOPPIES\n  Right-click a file > Send To > 3½ Floppy (A:). Then "Give disk to..." hands the\n  actual disk to someone else on the LAN. Like at school, but without Dave\n  losing it.\n\nVIRUSES\n  Don\'t run attachments you weren\'t expecting. Even from your mates.\n  ESPECIALLY from your mates. (See www.jackshield.netz)\n' });
  A.fs.add('C:/Program Files/JackIRC', { name: 'QUIZNITE.TXT', type: 'txt', date: '02/07/99', size: '1 KB', text: 'QUIZ NIGHT!!!\n\nEvery hour, on the hour, for 10 minutes, QuizJack runs a pub quiz in JackIRC.\n\n  /join #quiznight\n\nQuestions about 1999: games, films, telly, music, space, Intergalactic Battles and Pocket Critters.\nFirst right answer gets a point. Just type the answer.\n!scores shows this week\'s leaderboard. !next says when the next one starts.\n\nQuizJack is a bot. He is not a real person. (He says he is.)\n' });

  // ---- secrets
  S('nethood', 'Anybody home?', 'Look inside somebody else\'s computer (they said you could)');
  S('share', 'Sharing is caring', 'Let other people see one of your files');
  S('copy', 'Sneaky download', 'Copy a file off another computer on the LAN');
  S('popup', 'Pop goes the message', 'Send a WinPopup to a real person');
  S('popin', 'Message for you, sir', 'Get a WinPopup from somebody else');
  S('block', 'Talk to the hand', 'Stop someone popping messages at you');
  S('mapdrive', 'Drive E: (does not exist)', 'Try to map a network drive');
  S('entire', 'The whole wide network', 'Look at the Entire Network');
  S('floppy', 'Sneakernet', 'Copy something onto a floppy disk');
  S('diskfull', '1.44 MB ought to be enough', 'Fill a floppy right up');
  S('label', 'Felt-tip technology', 'Write on a floppy disk label');
  S('give', 'Hand-delivered', 'Give a floppy disk to someone else on the LAN');
  S('got', 'Special delivery', 'Be handed a floppy disk by somebody');
  S('format', 'Squeaky clean', 'Format a floppy disk');
  S('worm', 'Happy New Year 1999!!', 'Open an attachment you probably shouldn\'t have');
  S('tray', 'Something in the tray', 'Poke the thing that moved into your clock corner');
  S('cure', 'Worm-free', 'Get rid of a worm with JackClean');
  S('squigshield', 'Outbreak!', 'Visit the people who track e-mail worms');
  S('counterwars', 'Counter Wars', 'Find out whose hit counter is winning this week');
  S('quiz', 'Pub quiz (no pub)', 'Find the quiz that happens every hour, on the hour');
  S('quizwin', 'Quiz champion', 'Be the first to answer one of QuizJack\'s questions');

  // ================================================================ hooks into My Computer (Explorer) without touching apps-files.js
  // 1) right-clicking a file on C: gives "Sharing..." and a working Send To > 3½ Floppy (A:)
  let ctxT = null;
  const fxName = it => ((it.querySelector('.fx-lb, .fx-nm span') || it).textContent || '').trim();
  document.addEventListener('contextmenu', ev => {
    ctxT = null;
    const it = ev.target.closest && ev.target.closest('.fxwin .fx-it'); if (!it) return;
    const win = it.closest('.fxwin'), addr = win && win.querySelector('.fx-addr input'); if (!addr) return;
    const path = addr.value || '', name = fxName(it);
    if (!/^C:/i.test(path)) return;
    const node = A.fs.get(path.replace(/\\+$/, '') + '\\' + name);
    if (node && node.type !== 'dir') ctxT = { node, ts: Date.now() };
  }, true);
  if (window.IE && IE.menu) {
    const menu0 = IE.menu;
    IE.menu = function (items, x, y, level) {
      try {
        if (!level && ctxT && Date.now() - ctxT.ts < 1500 && Array.isArray(items)) {
          const i = items.findIndex(it => it && it.label === 'Send To' && Array.isArray(it.sub) && it.sub.some(s => s && /^3\u00bd Floppy/.test(s.label)));
          if (i >= 0) {
            const node = ctxT.node; ctxT = null;
            const sub = items[i].sub.map(s => s && /^3\u00bd Floppy/.test(s.label) ? Object.assign({}, s, { act: () => L.sendToFloppy(node) }) : s);
            items = items.slice(); items[i] = Object.assign({}, items[i], { sub });
            items.splice(i + 1, 0, { label: 'Sharing...', icon: J('network', 16), act: () => L.shareNode(node) });
          }
        }
      } catch (e) { console.error(e); }
      return menu0.call(this, items, x, y, level);
    };
  }
  L.sendToFloppy = node => withUI(ui => ui.sendToFloppy(node));
  L.shareNode = node => withUI(ui => ui.shareNode(node));
  // 2) when one of YOUR disks is in the drive, opening A: in My Computer opens it (otherwise it's Dave's disk, as before)
  let aLast = 0, aEl = null;
  document.addEventListener('click', ev => {
    const it = ev.target.closest && ev.target.closest('.fxwin .fx-it'); if (!it || !L.diskIn()) return;
    if (fxName(it) !== '3\u00bd Floppy (A:)') return;
    const now = Date.now();
    if (touch() || (aEl === it && now - aLast < 450)) { ev.stopPropagation(); ev.preventDefault(); aLast = 0; A.open('lan.floppy'); }
    else { aLast = now; aEl = it; }
  }, true);
  document.addEventListener('submit', ev => {
    const f = ev.target; if (!f || !f.matches || !f.matches('.fxwin .fx-addr') || !L.diskIn()) return;
    const v = (f.querySelector('input') || {}).value || '';
    if (/^\s*a:\\?\s*$/i.test(v)) { ev.preventDefault(); ev.stopPropagation(); A.open('lan.floppy'); }
  }, true);
  // 3) Outlook Express: while SQUIG99 lives in your PC, e-mails you send get tagged (harmless, cosmetic)
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('.oe-comp [data-a=send]'); if (!b || !L.inf) return;
    const ta = b.closest('.oe-comp').querySelector('textarea[name=body]');
    if (ta && !/\(sent by SQUIG99\)/.test(ta.value)) ta.value = ta.value.replace(/\s*$/, '') + '\n\n(sent by SQUIG99)';
  }, true);

  // ================================================================ the squig in the tray (only while infected)
  const SQUIG16 = '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="7.5" cy="10" r="2.2" fill="limegreen" stroke="darkgreen" stroke-width="0.7"/><circle cx="9.3" cy="7.6" r="2.4" fill="limegreen" stroke="darkgreen" stroke-width="0.7"/><rect x="0.5" y="9.5" width="10" height="6" fill="white" stroke="black" stroke-width="0.8"/><path d="M0.5 9.5l5 3.5 5-3.5" fill="none" stroke="gray" stroke-width="0.8"/><circle cx="11.8" cy="4.6" r="3.6" fill="limegreen" stroke="darkgreen" stroke-width="0.8"/><circle cx="10.6" cy="3.8" r="1.2" fill="white"/><circle cx="13.2" cy="3.8" r="1.2" fill="white"/><circle cx="10.9" cy="4" r="0.6" fill="black"/><circle cx="13.5" cy="4" r="0.6" fill="black"/><path d="M10.5 6.2q1.4 1.1 2.8 0" fill="none" stroke="darkgreen" stroke-width="0.7"/><path d="M11 1.3l-0.6-1M12.8 1.2l0.6-1" stroke="darkgreen" stroke-width="0.6"/></svg>';
  L.SQUIG16 = SQUIG16;
  let trayBtn = null;
  function tray() {
    const t = $('tray');
    if (L.inf && !trayBtn && t) {
      trayBtn = document.createElement('button'); trayBtn.type = 'button'; trayBtn.className = 'sys-tray lan-tray'; trayBtn.title = 'SQUIG99 is living in your computer'; trayBtn.setAttribute('aria-label', trayBtn.title);
      trayBtn.innerHTML = SQUIG16;
      t.insertBefore(trayBtn, $('clock') || null);
      trayBtn.addEventListener('click', ev => {
        ev.stopPropagation(); got('tray'); try { Sound.play('boing'); } catch (e) {}
        Desk.msgbox('SQUIG99', `Hello!!! I am SQUIG99!!! I live in your clock corner now!!!\n\nI put "(sent by SQUIG99)" on the e-mails you send, and I went and e-mailed myself to the people you've been swapping messages and files with. (Don't worry. I'm pretend. I don't break anything.)\n\nWant me gone? Get JACKCLEAN.EXE from www.jackshield.netz`, 'warn',
          [['Get JackClean', () => { if (window.Setup && Setup.has && !Setup.has('lan.squigclean')) { $('browser').classList.remove('min'); IE.navigate('http://www.jackshield.netz/download.html'); } else A.open('lan.squigclean'); }], ['Leave him']]);
      });
      trayBtn.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu([{ label: 'What is this?', act: () => trayBtn.click() }, { label: 'Run JackClean', act: () => A.open('lan.squigclean') }, '-', { label: 'Exit', act: () => Desk.toast('SQUIG99', 'You can\'t exit a worm. That\'s the whole point of worms. (Try JackClean.)') }], ev.clientX, ev.clientY - 10); });
    } else if (!L.inf && trayBtn) { trayBtn.remove(); trayBtn = null; }
  }

  // ================================================================ Quiz Night: QuizJack in JackIRC's #quiznight window
  let quizOn = false;
  const quizWin = () => { for (const el of document.querySelectorAll('.ir-child.chan')) { const t = el.querySelector('.ir-ct'); if (t && /^#quiznight\b/i.test(t.textContent || '')) return el; } return null; };
  function quizNick(el) {
    const ul = el.querySelector('.ir-nicks'); if (!ul || ul.querySelector('.lan-qgn')) return;
    const li = document.createElement('li'); li.className = 'ir-svc lan-qgn'; li.dataset.n = 'QuizJack'; li.title = 'The Quiz Night bot. A program, not a person. (He disagrees.)'; li.innerHTML = '@QuizJack <small>[bot]</small>';
    ul.appendChild(li);
  }
  setInterval(() => {
    const el = quizWin(), on = !!el && Net.connected;
    if (on !== quizOn) { quizOn = on; Net.send({ t: 'lanQuizHere', on }); if (on) got('quiz'); }
    if (el) quizNick(el);
  }, 1500);
  Net.on('_close', () => { quizOn = false; });
  const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  Net.on('lanQuiz', m => {
    const el = quizWin(); if (!el) return;
    const log = el.querySelector('.ir-log'); if (!log) return;
    const d = document.createElement('div'); d.className = 'ir-l lan-qg ' + (/^(q|win|hint|big|info|reveal)$/.test(m.cls) ? m.cls : '');
    d.innerHTML = `<span class="ir-ts">[${hhmm()}]</span> &lt;<b class="ir-nk lan-qn">@QuizJack</b>&gt; ${esc(String(m.text || '').slice(0, 400))}`;
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.appendChild(d); while (log.children.length > 300) log.firstChild.remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
    if (m.cls === 'win' && Net.me.nick && String(m.text).indexOf(' ' + Net.me.nick + ' got it') > 0) got('quizwin');
    if (m.cls === 'q') { try { Sound.note(660, 0.08, 'square'); setTimeout(() => Sound.note(880, 0.1, 'square'), 90); } catch (e) {} }
  });
  document.addEventListener('submit', ev => {
    const f = ev.target; if (!f || !f.matches || !f.matches('.ir-in')) return;
    const el = f.closest('.ir-child'); if (!el || el !== quizWin()) return;
    const v = ((f.querySelector('input') || {}).value || '').trim();
    if (v && !v.startsWith('/')) Net.send({ t: 'lanQuizAns', a: v.slice(0, 120) });
  }, true);
  // Run "quiznight": start JackIRC and join the channel
  function quizJoin() {
    A.open('social.irc');
    let n = 0, seen = 0, joined = false;
    const focusQuiz = () => { const b = [...document.querySelectorAll('.ir-sbtn')].find(x => /#quiznight$/i.test(x.textContent.trim())); if (b && !b.classList.contains('on')) b.click(); };
    const t = setInterval(() => {
      if (++n > 80) return clearInterval(t);
      if (quizWin()) { clearInterval(t); [200, 1500, 3500].forEach(ms => setTimeout(focusQuiz, ms)); return; }
      if (joined) return;
      const st = document.querySelector('.ir-child.status'), stOk = st && !/not connected/i.test((st.querySelector('.ir-ct') || {}).textContent || 'not connected') && n > 12;
      const ch = document.querySelector('.ir-child.chan .ir-in') || (stOk && st.querySelector('.ir-in')); if (!ch) return;
      if (++seen < 5) return; // let #jackattack finish saying hello first
      joined = true;
      const inp = ch.querySelector('input'); inp.value = '/join #quiznight';
      if (ch.requestSubmit) ch.requestSubmit(); else ch.dispatchEvent(new Event('submit', { cancelable: true }));
    }, 500);
  }
  L.quizJoin = quizJoin;

  // ================================================================ web sites (filled in by lan-web.js when you visit)
  if (window.IE && IE.addSite) {
    const lazy = (site, path) => () => { const el = document.createElement('div'); el.className = 'lan-site'; el.innerHTML = '<p style="padding:20px;font:13px Arial,sans-serif">Contacting the server... (56K, please wait)</p>'; L.loadWeb().then(w => w.render(site, path, el)).catch(e => { console.error(e); el.innerHTML = '<h2>404 Not Found</h2>'; }); return el; };
    const pages = (site, list) => { const p = {}; list.forEach(([path, title]) => { p[path] = { title, html: lazy(site, path) }; }); return p; };
    IE.addSite('www.jackshield.netz', { title: 'JackShield - Outbreak Centre', desc: 'Live e-mail worm outbreak map, the Virus Encyclopedia and FREE JackClean.', cat: 'help',
      pages: pages('ss', [['/', 'JackShield - Outbreak Centre'], ['/index.html', 'JackShield - Outbreak Centre'], ['/download.html', 'JackShield - Download JackClean'], ['/virus.html', 'JackShield - Virus Encyclopedia'], ['/tips.html', 'JackShield - Safe Surfing Tips']]) });
    IE.addSite('www.counterwars.homepagez', { title: 'COUNTER WARS!!! Top 10 Hit Counters', desc: 'Whose Homepagez hit counter is winning this week? Golden Counter Award inside!', cat: 'fun',
      pages: pages('cw', [['/', 'COUNTER WARS!!! Top 10 Hit Counters'], ['/index.html', 'COUNTER WARS!!! Top 10 Hit Counters'], ['/halloffame.html', 'COUNTER WARS!!! Hall of Fame'], ['/rules.html', 'COUNTER WARS!!! Rules'], ['/quiz.html', 'COUNTER WARS!!! Quiz Night Leaderboard']]) });
  }
})();
