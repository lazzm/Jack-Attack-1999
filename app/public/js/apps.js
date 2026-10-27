/* JackOS apps: window manager for desktop programs, desktop icons, Start > Programs, Run, a virtual C: drive,
 * Ctrl+Alt+Del and the Secrets Found tracker. App packs (apps-*.js) register themselves through window.Apps. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const ICON = {
    app: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" fill="#c0c0c0" stroke="#000"/><rect x="3" y="5" width="26" height="5" fill="#000080"/></svg>',
    folder: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/></svg>',
    txt: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><path d="M10 13h13M10 17h13M10 21h13M10 25h9" stroke="#000080"/></svg>',
    img: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" fill="#fff" stroke="#000"/><path d="M5 25l7-9 5 6 4-4 6 7z" fill="#2a9a2a"/><circle cx="22" cy="11" r="3" fill="#ffd400"/></svg>',
    exe: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="5" fill="#000080"/><rect x="8" y="14" width="8" height="8" fill="#fff" stroke="#000"/></svg>',
    lock: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><rect x="12" y="16" width="10" height="8" fill="#ffd400" stroke="#000"/><path d="M14 16v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#000" stroke-width="1.5"/></svg>',
    drive: '<svg viewBox="0 0 32 32"><rect x="3" y="11" width="26" height="12" fill="#c0c0c0" stroke="#000"/><rect x="6" y="17" width="10" height="2" fill="#000"/><rect x="23" y="17" width="3" height="2" fill="#0c0"/></svg>',
  };
  // the official JackOS 98 icon set (icons.js) replaces the old placeholders when it's loaded
  const J = (n, o) => window.JICON ? JICON.icon(n, o) : null;
  if (window.JICON) Object.assign(ICON, { app: J('app'), folder: J('folder'), txt: J('txt'), img: J('bmp'), exe: J('exe'), lock: J('lock'), drive: J('hdd'), lnk: J('url'), dir: J('folder'), wav: J('wav') });
  // program id / desktop icon id / Start menu path -> official icon (only where the official icon is the specific match)
  const JMAP = {
    'social.uhoh': 'messenger', 'social.wb': 'whiteboard', 'social.radio': 'radio', 'social.fridge': 'magnets', '#iconUhOh': 'messenger',
    notepad: 'notepad', outlook: 'mail', explorer: 'folderOpen', calc: 'calc', mspaint: 'paint', jackamp: 'jackamp', defrag: 'defrag', scandisk: 'scandisk', regedit: 'regedit',
    control: 'control', nethood: 'network', winver: 'logo', sol: 'cards', freecell: 'freecell', 'dos.run': 'dos', find: 'find',
    'system.welcome': 'welcome', 'system.taskmgr': 'taskmgr', 'system.devmgr': 'devmgr', 'system.sysmon': 'sysmon', 'system.update': 'update', 'system.sndvol': 'sound',
    'system.themes': 'themes', 'system.printers': 'printer', 'system.help': 'helpbook',
    'office.wordpad': 'wordpad', 'office.calc': 'spreadsheet', 'office.cardfile': 'cardfile', 'office.abook': 'addressbook', 'office.calendar': 'calendar', 'office.hyper': 'hyperterm',
    'office.clock': 'clock', 'office.magnify': 'magnifier',
    '#iconMyComp': 'computer', '#iconMyDocs': 'documents', '#iconOutlook': 'mail', '#iconNetHood': 'network', '#iconBriefcase': 'briefcase', '#iconSol': 'cards', '#iconFreecell': 'freecell',
    '#iconDos': 'dos', '#iconZone': 'zone', '#iconCoolSites': 'favorites', '@JackAmp': 'jackamp',
    'Accessories > JBASIC': 'jbasic', 'Games > Jack Quest': 'adventure', 'Games > Internet Games > JackNet Gaming Zone': 'zone', 'Games > Internet Games > Zone Reversi': 'reversi',
    imgview: 'picture', 'office.imaging': 'picture', 'office.packager': 'package', dialer: 'phone', charmap: 'charmap', clipbrd: 'clipboard', msinfo32: 'sysinfo', grotchi: 'grotchi', online: 'online',
    'system.tips': 'tip', 'system.accwiz': 'access', 'system.channels': 'channels', 'system.icw': 'icw', 'system.sndrec': 'mic', 'system.sched': 'sched', 'system.backup': 'backup', 'system.cleanmgr': 'cleanup',
    'system.tuneup': 'tuneup', 'system.rsrcmtr': 'rsrc', 'system.y2kpatch': 'y2k', 'carta.stamp': 'stamp', 'carta.mplayer': 'media', 'carta.cdplayer': 'cdplayer', 'carta.encyc': 'carta', 'carta.typing': 'typing',
    'games.pinball': 'pinball', 'games.hearts': 'hearts', 'games.spider': 'spider', 'games.pipe': 'pipe', 'games.mahjong': 'mahjong', 'games.slide': 'slider', 'games.jigsaw': 'jigsaw', 'games.reversi': 'reversi', 'games.chess': 'chess', 'games.cube': 'cube', 'games.ski': 'ski', 'games.podracer': 'podracer', 'games.grotlings': 'grotlings',
    '#iconOnline': 'online', '#ct-dicon-carta': 'carta', '#ct-dicon-mplayer': 'media', '#iconGamesFolder': 'games', '#iconPinball': 'pinball', '#iconOfficeProgman': 'oldpc',
    'Accessories > Entertainment > Sound Recorder': 'mic', 'Accessories > System Tools > Y2K Checker': 'y2k', 'Accessories > Communications > JackPopup': 'popup', 'Accessories > JACK-DOS Editor': 'edit',
    'Internet > JackSearch': 'url', 'Internet > JackSearch Directory': 'url', 'Internet > JackNet News': 'url', 'Internet > The Biscuit Ring': 'url', 'Internet > Hamster Cam': 'url', 'Internet > LookHere! Start Page': 'url', 'Internet > eCardz': 'url', 'Internet > Adopt-a-Pixel': 'url', 'Internet > JackMail (free e-mail)': 'url',
    'JackCarta 99 > Read Me': 'txt', 'JackAmp > Read Me': 'txt', 'Gubbinz Teaches Typing > Squig Drop (game)': 'typing', 'Gubbinz Teaches Typing > Meteor Typer (game)': 'typing',
    'Accessories > Communications > Dial-Up Networking': 'dialup', 'Accessories > Cube Timer 2.0': 'cube', 'Accessories > Screen Savers >': 'screensaver',
    // art pack 2: every program that used to draw its own flat icon now has official 32+16 pixel art (icons.js)
    'social.throw': 'snowball', 'social.hang': 'hangout', 'social.cork': 'corkboard', 'social.capsule': 'capsule', 'social.parcel': 'parcel', 'social.irc': 'irc',
    'JackNet Hangout > Message in a Bottle': 'bottle', '#iconHangout': 'hangout', '#iconSnowball': 'snowball', '#iconJackIRC': 'irc',
    'setup.centre': 'getsoft', 'setup.getsoft': 'getsoft', '#suIconGetSoft': 'getsoft', 'setup.mates': 'mates', '#suIconMates': 'mates',
    'loot.chest': 'chest', 'JackLoot >': 'chest', '#lxDeskChest': 'chest', 'discs.cupboard': 'cupboard', '#dgIconCupboard': 'cupboard', 'Games > Games Cupboard': 'cupboard',
    'family.phone': 'mobile', '#iconFamPhone': 'mobile', 'family.printq': 'dotmatrix', 'hpz.builder': 'pagebuilder', '#iconHpzBuilder': 'pagebuilder', 'Internet > Homepagez Member Pages': 'url',
    'ssn.disc': 'coverdisc', '#ssnIconDisc': 'coverdisc', 'system.regwiz': 'regwiz', 'office.write': 'write', 'JackCarta 99 > Quiz Keep': 'castle',
    'Accessories > System Tools > Jack Commander': 'commander', 'jsn.msgr': 'jsn', 'Online Services >': 'ringnet', 'Online Services > FreeSurfa': 'freesurfa', 'Online Services > Dial-a-Dave': 'phone', 'Online Services > HotJack Free Email': 'mail',
    'pcgames.jaquake': 'quake', 'pcgames.jrt': 'jrt', 'discs.park': 'coaster', 'discs.city': 'city', 'discs.squigs': 'grenade', 'discs.rts': 'helmet', 'discs.boss': 'football', 'discs.keepa': 'claw',
    'era.sweeper': 'bugsweeper', 'era.grotball': 'jezz', 'era.sqhome': 'seti', 'JACK@home > JACK@home Screen Saver': 'seti', 'era.realsquig': 'realjack', 'era.squigster': 'jackster', 'era.staples': 'staples',
    'era.fireworks': 'fireworks', 'era.buddy': 'purplepal', 'era.ramdbl': 'ramdbl', 'era.modem': 'modemturbo', 'era.regfix': 'regfix', 'era.y2ksuite': 'y2ksuite', 'era.winsquig': 'winjack',
    'era.prank': 'prank', 'era.weather': 'weather', 'era.cursors': 'cursors', 'era.photo': 'jackshots', 'era.kpt': 'kpt', 'era.squigso': 'drsquigso', winmine: 'sweeper',
    'Internet > Rupees > Jack Stock Exchange': 'stocks', 'Internet > Rupees > Jacktown': 'town', 'Internet > Rupees > JackNet Bank': 'bank', 'Internet > Rupees > JackLotto': 'lotto',
    'Internet > Rupees > Jackdown Park Kart Races': 'kart', 'Internet > Rupees > My Pixel Pet Farm': 'farm', 'econ.ticker': 'ticker', '#ecDeskTown': ['town', { lnk: true }],
    'Squig Screen Mates >': 'mates', 'Blobbit Screen Mates >': 'mates', 'Screen Mates >': 'mates', 'RealJack >': 'realjack', 'Jackster >': 'jackster',
  };
  // Read Me files and uninstallers in any program group get the standard icons
  const jmap = k => { if (!window.JICON || !k) return null; let n = JMAP[k]; if (!n && k.indexOf(' > ') > 0) n = (/ > (Read Me|README\.TXT)$/i.test(k) ? 'txt' : / > Uninstall /.test(k) ? 'addrem' : null) || JMAP[k.slice(0, k.lastIndexOf(' > ')) + ' >']; return n ? (Array.isArray(n) ? J(n[0], n[1]) : J(n)) : null; };
  const setWinIcon = (w, svg) => { if (!w || !svg || !w.el) return; const a = w.el.querySelector('.tb .ico'), b = w.task && w.task.querySelector('.tico'); if (a) a.innerHTML = svg; if (b) b.innerHTML = svg; };


  // ================================================================ windows
  const nz = () => (window.Desk && Desk.nz ? Desk.nz() : (window.JZ = (window.JZ || 2400) + 1)), top = () => window.JZ || 2400; // shared with Desk's dialogs
  let nextId = 1;
  const wins = new Map(); // id -> win
  // Keep windows within the JackOS desktop when its logical size changes.
  function fitWins() {
    const vw = DesktopSurface.width(), vh = DesktopSurface.height() - 32; // (the taskbar)
    for (const w of wins.values()) {
      const el = w.el; if (w.closed || el.style.display === 'none' || el.classList.contains('maxwin')) continue;
      const want = el._want || { w: el.offsetWidth, h: 0 };
      el.style.width = Math.max(160, Math.min(want.w, vw - 8)) + 'px';
      if (want.h) el.style.height = Math.max(100, Math.min(want.h, vh - 8)) + 'px';
      const r = DesktopSurface.rect(el);
      el.style.left = Math.max(4, Math.min(r.left, vw - r.width - 4)) + 'px';
      el.style.top = Math.max(0, Math.min(r.top, vh - Math.min(r.height, vh) - 4)) + 'px';
    }
  }
  let fitT = 0, lastVp = DesktopSurface.width() + 'x' + DesktopSurface.height(); // only for a real change of screen size (programs fire their own 'resize's)
  addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(() => { const v = DesktopSurface.width() + 'x' + DesktopSurface.height(); if (v === lastVp) return; lastVp = v; fitWins(); }, 120); });
  function win(title, body, o) {
    o = o || {};
    const id = nextId++;
    const el = document.createElement('div');
    el.className = 'win float appwin' + (o.cls ? ' ' + o.cls : '');
    el.style.width = Math.min(o.w || 420, DesktopSurface.width() - 8) + 'px';
    if (o.h) el.style.height = Math.min(o.h, DesktopSurface.height() - 50) + 'px';
    el.style.zIndex = nz();
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
    el.innerHTML = `<div class="tb"><span class="ico">${o.icon || ICON.app}</span><span class="t"></span><span class="ctl">${o.noMin ? '' : '<button data-w="min" aria-label="Minimise">_</button>'}${o.noMax ? '' : '<button data-w="max" aria-label="Maximise">&#9633;</button>'}<button data-w="close" aria-label="Close">x</button></span></div>${o.menubar ? '<div class="menubar appmenu"></div>' : ''}<div class="appbody"></div>${o.status ? '<div class="status appstatus"><span></span></div>' : ''}${o.noResize ? '' : '<span class="sizegrip appgrip"></span>'}`;
    el.querySelector('.t').textContent = title;
    const bd = el.querySelector('.appbody');
    if (body) bd.appendChild(body);
    DesktopSurface.root().appendChild(el);
    const r = DesktopSurface.rect(el);
    const off = (wins.size % 6) * 24;
    el.style.left = Math.max(4, Math.min(DesktopSurface.width() - r.width - 4, (o.x != null ? o.x : (DesktopSurface.width() - r.width) / 2 - 60 + off))) + 'px';
    el.style.top = Math.max(4, Math.min(DesktopSurface.height() - r.height - 40, (o.y != null ? o.y : (DesktopSurface.height() - r.height) / 2 - 70 + off))) + 'px';
    const task = document.createElement('button'); task.className = 'tbtn';
    task.innerHTML = `<span class="tico">${o.icon || ICON.app}</span><span></span>`; task.lastChild.textContent = title; task.title = title;
    $('tasks').appendChild(task); el._task = task;
    const maxBtn = el.querySelector('[data-w=max]');
    const toggleMax = () => { const on = el.classList.toggle('maxwin'); if (maxBtn) maxBtn.setAttribute('aria-label', on ? 'Restore' : 'Maximise'); window.dispatchEvent(new Event('resize')); };
    el._want = { w: el.offsetWidth, h: o.h ? el.offsetHeight : 0 }; // the size it wants: screen rotations squeeze it to fit and give it back
    const w = {
      id, el, body: bd, task, closed: false,
      menubar: el.querySelector('.appmenu'), status: el.querySelector('.appstatus span'),
      setTitle(t) { el.querySelector('.t').textContent = t; task.lastChild.textContent = t; task.title = t; el.setAttribute('aria-label', t); },
      focus() { if (Desk.activate) Desk.activate(el); else { el.style.zIndex = nz(); el.classList.remove('inactive'); } },
      close() { if (w.closed) return; w.closed = true; if (o.onClose) o.onClose(); el.remove(); task.remove(); wins.delete(id); if (Desk.activateTop) Desk.activateTop(); },
      min() { el.style.display = 'none'; task.classList.remove('on'); if (Desk.activateTop) Desk.activateTop(); },
      restore() { el.style.display = ''; w.focus(); },
    };
    wins.set(id, w);
    w.focus();
    el.addEventListener('pointerdown', () => w.focus(), true);
    task.addEventListener('click', () => { if (el.style.display === 'none') w.restore(); else if (Desk.isActive ? Desk.isActive(el) : +el.style.zIndex === top()) w.min(); else w.focus(); });
    el.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.w;
      if (a === 'close') w.close(); else if (a === 'min') w.min();
      else toggleMax();
    }));
    // drag + resize
    const tb = el.querySelector('.tb');
    let drag = null;
    tb.addEventListener('pointerdown', ev => { if (ev.button > 0 || ev.target.closest('button') || el.classList.contains('maxwin')) return; const p = DesktopSurface.point(ev.clientX, ev.clientY); drag = { dx: p.x - el.offsetLeft, dy: p.y - el.offsetTop }; tb.setPointerCapture(ev.pointerId); });
    tb.addEventListener('pointermove', ev => { if (!drag) return; const p = DesktopSurface.point(ev.clientX, ev.clientY); el.style.left = Math.max(-el.offsetWidth + 80, Math.min(DesktopSurface.width() - 80, p.x - drag.dx)) + 'px'; el.style.top = Math.max(0, Math.min(DesktopSurface.height() - 60, p.y - drag.dy)) + 'px'; });
    tb.addEventListener('pointerup', () => { drag = null; });
    tb.addEventListener('pointercancel', () => { drag = null; });
    tb.addEventListener('dblclick', ev => { if (!ev.target.closest('button') && !o.noMax) toggleMax(); });
    const grip = el.querySelector('.appgrip');
    if (grip) {
      let rs = null;
      grip.addEventListener('pointerdown', ev => { ev.preventDefault(); const p = DesktopSurface.point(ev.clientX, ev.clientY); rs = { x: p.x, y: p.y, w: el.offsetWidth, h: el.offsetHeight }; grip.setPointerCapture(ev.pointerId); });
      grip.addEventListener('pointermove', ev => { if (!rs) return; const p = DesktopSurface.point(ev.clientX, ev.clientY); el.style.width = Math.min(DesktopSurface.width() - Math.max(0, el.offsetLeft) - 4, Math.max(o.minW || 220, rs.w + p.x - rs.x)) + 'px'; el.style.height = Math.min(DesktopSurface.height() - el.offsetTop - 36, Math.max(o.minH || 140, rs.h + p.y - rs.y)) + 'px'; });
      grip.addEventListener('pointerup', () => { if (rs) el._want = { w: el.offsetWidth, h: el.offsetHeight }; rs = null; window.dispatchEvent(new Event('resize')); });
      grip.addEventListener('pointercancel', () => { rs = null; });
    }
    el.addEventListener('keydown', ev => { if (ev.key === 'Escape' && o.escClose) w.close(); });
    // programs that fill their window a moment after it opens: for the first few seconds, nudge it back up/left so it
    // never hangs off the bottom of the screen behind the taskbar (unless the visitor has already moved it)
    if (window.ResizeObserver && !o.h) {
      let moved = false; tb.addEventListener('pointerdown', () => { moved = true; }, { once: true });
      const ro = new ResizeObserver(() => {
        if (moved || w.closed || el.classList.contains('maxwin')) return;
        const r = DesktopSurface.rect(el); if (!r.height) return;
        const t = Math.max(4, Math.min(r.top, DesktopSurface.height() - 40 - r.height)), l = Math.max(4, Math.min(r.left, DesktopSurface.width() - r.width - 4));
        if (t < r.top - 1) el.style.top = t + 'px'; if (l < r.left - 1) el.style.left = l + 'px';
      });
      ro.observe(el); setTimeout(() => ro.disconnect(), 4000);
    }
    return w;
  }
  // a simple JackOS 98 menubar for app windows: items = [['File', [ {label, act, key, dis, chk}, '-', ... ]], ...]
  function menubar(w, items) {
    w.menubar.innerHTML = '';
    let cur = null; // { b, m } the menu that is open from this bar
    const isOpen = () => cur && cur.m && cur.m.isConnected;
    const show = (b, list) => {
      IE.closeMenus();
      const r = b.getBoundingClientRect(), m = IE.menu(typeof list === 'function' ? list() : list, r.left, r.bottom);
      b.classList.add('open'); cur = { b, m };
      const watch = () => { if (m.isConnected) requestAnimationFrame(watch); else b.classList.remove('open'); };
      requestAnimationFrame(watch);
      return m;
    };
    const keys = {};
    for (const [label, list] of items) {
      const b = document.createElement('button'); b.type = 'button';
      // JackOS 98 menus underline an access key (the first letter); Alt+that letter opens it
      const s = document.createElement('span'), u = document.createElement('u'); u.textContent = label.charAt(0); s.append(u, label.slice(1)); b.appendChild(s);
      b.addEventListener('click', () => { if (isOpen() && cur.b === b) { IE.closeMenus(); return; } show(b, list); });
      b.addEventListener('mouseenter', () => { if (isOpen() && cur.b !== b) show(b, list); });
      const k = label.charAt(0).toLowerCase(); if (!keys[k]) keys[k] = () => { const m = show(b, list); const f = m.querySelector('button:not(:disabled)'); if (f) f.classList.add('hl'); };
      w.menubar.appendChild(b);
    }
    if (!w._altKeys) w.el.addEventListener('keydown', ev => { if (ev.altKey && !ev.ctrlKey && w._altKeys[ev.key.toLowerCase()]) { ev.preventDefault(); ev.stopPropagation(); w._altKeys[ev.key.toLowerCase()](); } });
    w._altKeys = keys; w.el._altKeys = keys;
  }

  // ================================================================ registry: apps, programs menu, run commands
  const APPS = {}, CMDS = {}, PROGRAMS = []; // PROGRAMS: [path array, appId or fn, icon]
  function register(id, def) { APPS[id] = def; if (def.cmd) [].concat(def.cmd).forEach(c => { CMDS[c.toLowerCase()] = () => open(id); }); }
  function open(id, arg) {
    const a = APPS[id];
    if (!a) return Desk.msgbox('JackOS', `Cannot find '${id}'. Make sure the name is correct.`, 'warn');
    if (window.Setup && !Setup.ok(id, arg)) return Setup.missing(id, arg); // uninstalled (see setup.js)
    if (a.single && a._w && !a._w.closed) { a._w.restore(); return a._w; }
    const w = a.open(arg);
    if (window.Setup) Setup.track(id, w, arg);
    if (a.single) a._w = w;
    const ji = jmap(id);
    if (ji && w) { if (typeof w.then === 'function') w.then(x => setWinIcon(x, ji), () => {}); else setWinIcon(w, ji); }
    return w;
  }
  function addProgram(path, target, icon) { PROGRAMS.push({ path, target, icon: (typeof target === 'string' && jmap(target)) || jmap(path.join(' > ')) || icon }); }
  function cmd(names, fn) { [].concat(names).forEach(n => { CMDS[n.toLowerCase()] = fn; }); }
  function run(text) {
    const raw = String(text || '').trim(); if (!raw) return true;
    const key = raw.toLowerCase().replace(/\.exe$/, '');
    if (CMDS[key]) { if (window.Setup && Setup.blockedCmd(key)) { Setup.missingCmd(key); return true; } CMDS[key](raw); return true; }
    if (/^https?:|^www\.|\.com|\.co\.uk/.test(key)) { if (window.IE) { document.getElementById('browser').classList.remove('min'); IE.navigate(raw); } return true; }
    const f = fs.find(raw); if (f) { openFile(f); return true; }
    return false;
  }

  // ================================================================ the C: drive
  // nodes: { name, type: 'dir'|'txt'|'img'|'exe'|'lnk', kids?, text?, art?, app?, go?, locked?, password?, secret?, date?, size? }
  const root = { name: 'C:', type: 'dir', kids: [] };
  // old saved paths (C:/WINDOWS...) still resolve: the folder is JACKOS now
  const aliasOld = p => String(p).replace(/^(C:[\\/]+)WINDOWS(?=[\\/]|$)/i, '$1JACKOS');
  const fs = {
    root,
    // mkdir -p style: fs.dir('C:/My Documents/Diary') returns the dir node
    dir(path) { let n = root; for (const part of aliasOld(path).replace(/^C:\\?\/?/i, '').split(/[\\/]/).filter(Boolean)) { let k = n.kids.find(x => x.name.toLowerCase() === part.toLowerCase() && x.type === 'dir'); if (!k) { k = { name: part, type: 'dir', kids: [] }; n.kids.push(k); } n = k; } return n; },
    add(path, node) { const d = fs.dir(path); d.kids = d.kids.filter(k => k.name.toLowerCase() !== node.name.toLowerCase()); d.kids.push(node); return node; },
    get(path) { let n = root; for (const part of aliasOld(path).replace(/^C:\\?\/?/i, '').split(/[\\/]/).filter(Boolean)) { n = (n.kids || []).find(x => x.name.toLowerCase() === part.toLowerCase()); if (!n) return null; } return n; },
    find(name) { if (!name) return null; const low = String(name).toLowerCase(); let hit = null; (function walk(n) { if (hit) return; if (n.name.toLowerCase() === low && n.type !== 'dir') hit = n; (n.kids || []).forEach(walk); })(root); return hit; },
    pathOf(node) { const out = []; (function walk(n, trail) { if (n === node) { out.push(...trail, n.name); return true; } return (n.kids || []).some(k => walk(k, [...trail, n.name])); })(root, []); return out.join('\\').replace(/^C:/, 'C:'); },
  };
  const OPENERS = {}; // type -> fn(node)
  function openFile(node) {
    if (node.secret) secret(node.secret);
    if (node.type === 'exe' && node.app) return open(node.app, node.arg);
    if (node.type === 'lnk' && node.go) { document.getElementById('browser').classList.remove('min'); return IE.go(node.go, 'click'); }
    if (OPENERS[node.type]) return OPENERS[node.type](node);
    if (node.type === 'txt') return Desk.notepad(node.name, node.text || '');
    Desk.msgbox(node.name, 'There is no program associated with this file. Try opening it with Jotpad. (Or maybe it\'s a secret?)', 'info');
  }

  // ================================================================ secrets
  const SECRETS = {}; // id -> { name, hint }
  let found = store.get('jhp_secrets', {});
  function defineSecret(id, name, hint) { SECRETS[id] = { name, hint }; }
  function secret(id) {
    if (!SECRETS[id] || found[id]) return false;
    found[id] = Date.now(); store.set('jhp_secrets', found);
    const n = Object.keys(found).filter(k => SECRETS[k]).length, total = Object.keys(SECRETS).length;
    Desk.toast('\u2605 SECRET FOUND! \u2605', `${SECRETS[id].name}  (${n} of ${total} found)`, 6000);
    Sound.play('solve');
    return true;
  }
  function secretsWindow() {
    const ids = Object.keys(SECRETS), got = ids.filter(k => found[k]);
    const b = document.createElement('div');
    b.innerHTML = `<p style="margin:0 0 6px"><b>${got.length}</b> of <b>${ids.length}</b> secrets found (${Math.floor(got.length / Math.max(1, ids.length) * 100)}%). Keep exploring!</p><div class="prog" style="margin-bottom:8px"><span style="display:flex;gap:2px">${'<i></i>'.repeat(Math.round(got.length / Math.max(1, ids.length) * 30))}</span></div>
      <div class="field" style="height:260px;overflow:auto;padding:4px;font:12px var(--ui)">${ids.map(k => found[k] ? `<div class="sec-row got">\u2605 <b>${esc(SECRETS[k].name)}</b></div>` : `<div class="sec-row">? <i>${esc(SECRETS[k].hint || '???')}</i></div>`).join('')}</div>`;
    win('Secrets Found', b, { w: 380, icon: '<svg viewBox="0 0 32 32"><path d="M16 2l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffd400" stroke="#a07000"/></svg>', noResize: true, noMax: true });
  }

  // Native double-click opens; keyboard/assistive button clicks activate once.
  function bindLaunch(el, action, select) {
    el.dataset.openGesture = 'icon';
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.addEventListener('click', ev => {
      if (ev.button > 0) return;
      if (select) select(ev);
      const directTouch=ev.isTrusted&&(ev.pointerType==='touch'||ev.pointerType==='pen'||ev.sourceCapabilities?.firesTouchEvents);
      if (ev.detail === 0 || directTouch) action();
    });
    el.addEventListener('dblclick', ev => {
      if (ev.button > 0) return;
      ev.preventDefault(); action();
    });
    // Buttons generate their own keyboard click. Other icon rows need Enter.
    if (el.tagName !== 'BUTTON') el.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      if (!ev.repeat) action();
    });
  }
  // ================================================================ desktop icons
  const icons = document.querySelector('.icons');
  function desktopIcon(label, icon, action, id) {
    icon = jmap('#' + id) || jmap('@' + label) || icon;
    const b = document.createElement('button'); b.className = 'dicon'; if (id) b.id = id;
    b.innerHTML = icon + `<span>${esc(label)}</span>`;
    b.type = 'button';
    bindLaunch(b, action, () => { document.querySelectorAll('.dicon.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
    icons.appendChild(b);
    return b;
  }

  // ================================================================ Start menu: Programs / Documents / Settings / Find
  function programsTree() {
    const tree = {};
    for (const p of PROGRAMS) { if (window.Setup && !Setup.showProgram(p)) continue; let n = tree; for (const part of p.path.slice(0, -1)) n = n[part] = n[part] || {}; n[p.path[p.path.length - 1]] = p; }
    const lock = (it, p) => (window.Guest ? Guest.lockItem(it, p) : it); // members-only programs get a padlock for guests (js/guest.js)
    const toItems = n => Object.keys(n).sort((a, b) => { const fa = !n[a].target, fb = !n[b].target; return fa === fb ? a.localeCompare(b) : (fa ? -1 : 1); }).map(k => n[k].target
      ? lock({ label: k, icon: n[k].icon || ICON.exe, act: () => typeof n[k].target === 'function' ? n[k].target() : open(n[k].target) }, n[k])
      : { label: k, icon: J('programs') || ICON.folder, sub: () => toItems(n[k]) });
    return toItems(tree);
  }
  function startSub(btn, items) { const r = btn.getBoundingClientRect(); IE.menu(typeof items === 'function' ? items() : items, r.right - 4, r.top - 2); }
  document.querySelectorAll('#startMenu [data-sm]').forEach(b => {
    const which = b.dataset.sm;
    const items = () => which === 'programs' ? programsTree()
      : which === 'documents' ? (fs.get('C:/My Documents').kids.filter(k => k.type !== 'dir').slice(0, 12).map(k => ({ label: k.name, icon: ICON[k.type] || ICON.txt, act: () => { closeStart(); openFile(k); } })))
      : which === 'settings' ? [{ label: 'Control Panel', icon: J('control') || ICON.app, act: () => { closeStart(); open('control'); } }, { label: 'Printers', icon: J('printer') || ICON.app, act: () => { closeStart(); open('system.printers'); } }, { label: 'Taskbar & Start Menu...', icon: J('settings') || ICON.app, act: () => { closeStart(); Desk.msgbox('Taskbar Properties', 'Always on top: yes. Auto hide: no. Show clock: yes. It\'s perfect, don\'t touch it.', 'info'); } }]
      : which === 'find' ? [{ label: 'Files or Folders...', icon: J('find') || ICON.folder, act: () => { closeStart(); open('find'); } }, { label: 'On the Internet...', icon: J('jacknet') || ICON.app, act: () => { closeStart(); document.getElementById('navSearch').click(); } }, { label: 'People...', icon: J('user') || ICON.app, act: () => { closeStart(); IE.go('members', 'click'); } }, { label: 'Secrets...', icon: J('key') || ICON.app, act: () => { closeStart(); window.Apps.secretsWindow(); } }]
      : [];
    const show = () => startSub(b, items);
    b.addEventListener('mouseenter', show); b.addEventListener('click', show);
  });
  const closeStart = () => { $('startMenu').classList.remove('open'); $('startBtn').classList.remove('on'); };
  // pointing at a plain item folds any open submenu away; the keyboard walks the menu like JackOS does
  document.querySelectorAll('#startMenu button:not([data-sm])').forEach(b => b.addEventListener('mouseenter', () => IE.closeMenus()));
  $('startMenu').addEventListener('keydown', ev => {
    const bs = [...$('startMenu').querySelectorAll('button')], i = bs.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); IE.closeMenus(); bs[(i + (ev.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); }
    else if (ev.key === 'ArrowRight' && i >= 0 && bs[i].dataset.sm) { ev.preventDefault(); bs[i].click(); const m = document.querySelector('.menu'); const f = m && m.querySelector('button:not(:disabled)'); if (f) f.classList.add('hl'); }
    else if (ev.key === 'Enter' && i >= 0 && bs[i].dataset.sm) { ev.preventDefault(); bs[i].click(); }
    else if (ev.key === 'Escape') { ev.preventDefault(); closeStart(); $('startBtn').focus(); }
  });
  $('smRunDlg').addEventListener('click', () => { closeStart(); runDialog(); });
  $('smHelp').addEventListener('click', () => { closeStart(); Desk.readme ? Desk.notepad('JackOS Help.txt', HELP) : 0; secret('help'); });
  const HELP = `JACKOS 98 HELP\n==============\n\nWelcome to JackOS 98!\n\n* Double-click the icons on the desktop to open things.\n* Start > Programs has loads of programs. Some are games.\n* Start > Run lets you type commands. There are secret ones.\n* Start > Find > Secrets shows how many secrets you've found.\n* Ctrl+Alt+Del does what you think it does.\n\nThere are LOTS of secrets on this computer. Nobody has found them all.\nNot even Jack. (Jack hid them. Jack forgot where.)\n`;

  // ================================================================ Run...
  function runDialog(prefill) {
    const f = document.createElement('form');
    f.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><svg viewBox="0 0 32 32" width="32" height="32" style="flex:none"><rect x="3" y="6" width="26" height="20" fill="#c0c0c0" stroke="#000"/><rect x="3" y="6" width="26" height="4" fill="#000080"/><path d="M9 20l5-5-5-5" stroke="#000" stroke-width="2" fill="none"/></svg><span>Type the name of a program, folder, document, or Internet resource, and JackOS will open it for you.</span></div><div class="row" style="margin-top:10px;flex-wrap:nowrap"><label for="runIn"><u>O</u>pen:</label><input type="text" id="runIn" style="flex:1;min-width:0" autocomplete="off" list="runHist"><datalist id="runHist">${store.get('jhp_runhist', []).map(h => `<option value="${esc(h)}">`).join('')}</datalist></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" type="submit" style="min-width:75px">OK</button><button class="btn" type="button" style="min-width:75px">Cancel</button><button class="btn" type="button" style="min-width:75px">Browse...</button></div>`;
    const w = win('Run', f, { w: 380, noResize: true, noMax: true, noMin: true, escClose: true });
    const inp = f.querySelector('input'); inp.value = prefill || ''; setTimeout(() => inp.focus(), 30);
    const [, cancel, browse] = f.querySelectorAll('.btn');
    cancel.addEventListener('click', w.close); browse.addEventListener('click', () => { w.close(); open('explorer', 'C:'); });
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const v = inp.value.trim(); if (!v) return;
      store.set('jhp_runhist', [v, ...store.get('jhp_runhist', []).filter(x => x !== v)].slice(0, 15));
      w.close();
      if (!run(v)) Desk.msgbox(v, `Cannot find the file '${v}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`, 'warn');
    });
  }

  // ================================================================ Ctrl+Alt+Del: Close Program
  let cad = 0;
  document.addEventListener('keydown', ev => {
    if (ev.ctrlKey && ev.altKey && (ev.key === 'Delete' || ev.key === 'Backspace' || ev.key === 'End')) { ev.preventDefault(); closeProgram(); }
  });
  function closeProgram() {
    if (++cad >= 2 && document.querySelector('.closeprog')) { secret('ctrlaltdel2'); document.querySelectorAll('.closeprog').forEach(e => e.closest('.appwin') && e.closest('.appwin').remove()); return document.getElementById('bsod') && Desk.bsod ? Desk.bsod() : 0; }
    setTimeout(() => { cad = 0; }, 3000);
    secret('ctrlaltdel');
    const b = document.createElement('div'); b.className = 'closeprog';
    const list = () => ['Explorer', 'JackNet Explorer', 'Systray', 'Gubbinz.exe (not responding)', ...[...wins.values()].filter(w => !w.el.querySelector('.closeprog')).map(w => w.el.querySelector('.t').textContent), ...((window.OldPC && OldPC.toolbarItems ? OldPC.toolbarItems() : []).map(t => t.label))];
    b.innerHTML = `<div class="field cplist" style="height:170px;overflow:auto;padding:2px"></div><p style="font-size:11px;margin:8px 0">WARNING: Pressing CTRL+ALT+DEL again will restart your computer. You will lose unsaved information in all programs that are running.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-cp="end">End Task</button><button class="btn" data-cp="shut">Shut Down</button><button class="btn" data-cp="cancel">Cancel</button></div>`;
    const draw = () => { b.querySelector('.cplist').innerHTML = list().map((n, i) => `<div class="cpi${i === 0 ? ' sel' : ''}" tabindex="0">${esc(n)}</div>`).join(''); b.querySelectorAll('.cpi').forEach(e => e.addEventListener('click', () => { b.querySelectorAll('.cpi').forEach(x => x.classList.remove('sel')); e.classList.add('sel'); })); };
    draw();
    const w = win('Close Program', b, { w: 340, noResize: true, noMax: true, noMin: true, escClose: true });
    b.querySelector('[data-cp=cancel]').addEventListener('click', w.close);
    b.querySelector('[data-cp=shut]').addEventListener('click', () => { w.close(); document.getElementById('smShutdown').click(); });
    b.querySelector('[data-cp=end]').addEventListener('click', () => {
      const sel = b.querySelector('.cpi.sel'); if (!sel) return; const name = sel.textContent;
      if (name === 'Explorer') { Desk.msgbox('Explorer', 'If you end Explorer, the whole desktop will disappear. (Jack tried it once. It was very boring.)', 'warn'); }
      else if (name === 'JackNet Explorer') { document.getElementById('brClose').click(); }
      else if (/^Gubbinz/.test(name)) { secret('endgubbinz'); Desk.msgbox('Gubbinz.exe', "This program is not responding. It's eating a biscuit. Click End Task again to... no, he's fine, leave him.", 'warn'); }
      else if (name === 'Systray') Desk.toast('Systray', 'The clock refuses to close. It has a job to do.');
      else { for (const w2 of wins.values()) if (w2.el.querySelector('.t').textContent === name) w2.close(); if (window.OldPC && OldPC.uninstallByName) OldPC.uninstallByName(name); }
      draw();
    });
  }

  // ================================================================ built-in: Find Files, and the Notepad that remembers
  register('find', { single: true, open() {
    const b = document.createElement('form');
    b.innerHTML = `<div class="row"><label>Named:</label><input type="text" class="fq" style="flex:1;min-width:0"><button class="btn" type="submit">Find Now</button></div><div class="field" style="height:200px;overflow:auto;margin-top:8px;padding:4px" class="fres"></div><div class="small fcount" style="margin-top:4px">0 file(s) found</div>`;
    const w = win('Find: All Files', b, { w: 420, icon: J('find') || ICON.folder });
    b.addEventListener('submit', ev => {
      ev.preventDefault();
      const q = b.querySelector('.fq').value.trim().toLowerCase(), out = b.querySelector('.field'); out.innerHTML = '';
      if (!q) return;
      const hits = [];
      (function walk(n, path) { (n.kids || []).forEach(k => { const p = path + '\\' + k.name; if (k.name.toLowerCase().includes(q) || (k.text && k.text.toLowerCase().includes(q))) hits.push([k, p]); walk(k, p); }); })(root, 'C:');
      hits.slice(0, 200).forEach(([k, p]) => { const r = document.createElement('div'); r.className = 'xi'; r.innerHTML = `<span style="width:16px;height:16px;display:inline-block">${ICON[k.type] || ICON.txt}</span> ${esc(k.name)} <small style="color:#666">${esc(p)}</small>`; bindLaunch(r, () => k.type === 'dir' ? open('explorer', p) : openFile(k)); out.appendChild(r); });
      b.querySelector('.fcount').textContent = `${hits.length} file(s) found` + (hits.length ? ' (double-click to open)' : '');
      if (/secret|password/.test(q)) secret('findsecret');
    });
    return w;
  } });

  // defaults so the Start menu always has something
  fs.dir('C:/My Documents'); fs.dir('C:/Program Files'); fs.dir('C:/JACKOS');
  defineSecret('ctrlaltdel', 'Three-finger salute', 'Some keys are best pressed together...');
  defineSecret('ctrlaltdel2', 'Double trouble', 'What happens if you do it twice?');
  defineSecret('endgubbinz', 'Task murderer', 'Try to end a task that should not be ended');
  defineSecret('help', 'RTFM', 'Read the manual');
  defineSecret('findsecret', 'Nosy parker', 'Search the hard drive for something you should not');

  // Lazy loading for big content (encyclopedia articles, adventure text...): Apps.load('js/x.js') / Apps.loadJSON('data/x.json').
  // Uses the same build stamp as apps.js so Cloudflare never serves a stale copy after a deploy.
  const STAMP = ((document.querySelector('script[src*="js/apps.js"]') || {}).src || '').split('?v=')[1] || String(Date.now());
  const loaded = {};
  function load(src) {
    return loaded[src] = loaded[src] || new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src + '?v=' + STAMP; s.onload = res;
      s.onerror = () => { delete loaded[src]; rej(new Error('could not load ' + src)); }; document.head.appendChild(s);
    });
  }
  function loadJSON(src) { return loaded[src] = loaded[src] || fetch(src + '?v=' + STAMP).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(e => { delete loaded[src]; throw e; }); }

  window.Apps = { load, loadJSON, bindLaunch, win, menubar, register, open, addProgram, cmd, run, fs, openFile, OPENERS, defineSecret, secret, secretsWindow, desktopIcon, runDialog, ICON, esc, store, get found() { return found; }, get secrets() { return SECRETS; }, get programs() { return PROGRAMS; }, get apps() { return APPS; }, get cmds() { return CMDS; } };
})();
