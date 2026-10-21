/* JackOS: taskbar, Start menu, dialogs, shut down, cheats and the 1999 time loop. */
(function () {
  const $ = id => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const svgIcon = {
    info: '<svg viewBox="0 0 32 32" width="32" height="32" style="flex:none" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#000080" stroke-width="2"/><rect x="14" y="13" width="4" height="12" fill="#000080"/><rect x="14" y="7" width="4" height="4" fill="#000080"/></svg>',
    warn: '<svg viewBox="0 0 32 32" width="32" height="32" style="flex:none" aria-hidden="true"><path d="M16 2 31 29H1z" fill="#ffd400" stroke="#000"/><rect x="14.5" y="11" width="3" height="10" fill="#000"/><rect x="14.5" y="23" width="3" height="3" fill="#000"/></svg>',
    q: '<svg viewBox="0 0 32 32" width="32" height="32" style="flex:none" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#000080" stroke-width="2"/><text x="16" y="23" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#000080">?</text></svg>',
  };
  const MBJ = { info: 'info', warn: 'warning', warning: 'warning', q: 'question', question: 'question', error: 'error', err: 'error' };
  const mbIcon = k => window.JICON && MBJ[k] ? JICON.get(MBJ[k], 32).replace('<svg ', '<svg style="flex:none" ') : (svgIcon[k] || svgIcon.info);


  // ================================================================ balloons (system-tray tips)
  // They queue: at most 2 on screen (1 on a phone), the rest wait their turn, and in the first half minute after
  // switching on they come out a few seconds apart instead of all at once. toast() returns the balloon element.
  const toastQ = []; let toastLast = 0, toastGone = 0, toastTimer = 0, bootAt = 0, deskAt = 0;
  document.addEventListener('DOMContentLoaded', () => (window.BootDone || Promise.resolve()).then(() => { bootAt = Date.now(); }));
  const toastMax = () => (innerWidth < 600 ? 1 : 2);
  function toastPump() {
    clearTimeout(toastTimer); toastTimer = 0;
    const wrap = $('toastWrap'); if (!wrap || !toastQ.length) return;
    // nobody can see a balloon under the switch-on screens, the log-on box or the dial-up window: they wait until it's gone
    if (document.querySelector('#boot:not(.gone), .jlogoff:not(.jlbye), .logon, .dialwin')) { deskAt = 0; toastTimer = setTimeout(toastPump, 400); return; }
    const now = Date.now(); if (!deskAt) deskAt = now;
    // the first minute on the desktop: one balloon at a time with a breather in between (a new visitor gets a lot of hellos)
    const settling = !bootAt || now - Math.max(bootAt, deskAt) < 60000, gap = settling ? 4000 : 500;
    if (wrap.children.length >= (settling ? 1 : toastMax())) return; // a balloon going away calls toastPump again
    const wait = wrap.children.length ? toastLast + gap - now : settling ? toastGone + 1200 - now : 0;
    if (wait > 0) { toastTimer = setTimeout(toastPump, wait); return; }
    const { b, ms } = toastQ.shift();
    toastLast = now;
    wrap.appendChild(b);
    setTimeout(() => b._gone(), ms || 4500);
    if (toastQ.length) toastTimer = setTimeout(toastPump, gap);
  }
  function toast(title, text, ms) {
    const b = document.createElement('div'); b.className = 'balloon';
    const t = document.createElement('b'); t.textContent = title; b.appendChild(t);
    b.appendChild(document.createTextNode(text));
    let gone = false;
    b._gone = () => { if (gone) return; gone = true; if (b.isConnected) toastGone = Date.now(); b.remove(); const i = toastQ.findIndex(q => q.b === b); if (i >= 0) toastQ.splice(i, 1); toastPump(); };
    b.addEventListener('click', b._gone); b.title = 'Click to close';
    const key = title + '\n' + text, wrap = $('toastWrap');
    // the same balloon already showing or waiting: don't say it twice
    if (toastQ.some(q => q.key === key) || (wrap && [...wrap.children].some(x => x._key === key))) return b;
    b._key = key;
    toastQ.push({ b, ms, key });
    while (toastQ.length > 6) toastQ.shift(); // nobody reads a seventh one
    toastPump();
    try { document.dispatchEvent(new CustomEvent('jhp-toast', { detail: { title, text } })); } catch (e) {}
    return b;
  }

  // ================================================================ floating windows
  // ---- one window manager for every window on the desktop (Desk dialogs, Apps windows and the browser):
  // a single stacking order, one active window (blue title bar, pressed taskbar button), the rest inactive (grey).
  const winEls = () => [...document.querySelectorAll('.float'), $('browser')].filter(Boolean);
  const shown = el => el.isConnected && el.style.display !== 'none' && !el.classList.contains('min') && !el.classList.contains('closing');
  function nz() { // next z-index. Every so often squash the stack back down, so windows never climb over the taskbar (3000) or menus
    let z = (window.JZ || 2400) + 1;
    if (z > 2950) {
      z = 2401;
      winEls().filter(e => e.style.zIndex).sort((a, b) => a.style.zIndex - b.style.zIndex).forEach(e => { e.style.zIndex = z++; });
    }
    return (window.JZ = z);
  }
  function activate(el) {
    if (!el) return;
    if (+el.style.zIndex !== window.JZ) el.style.zIndex = nz();
    winEls().forEach(e => e.classList.toggle('inactive', e !== el));
    document.querySelectorAll('#tasks .tbtn').forEach(t => t.classList.toggle('on', t === el._task));
  }
  function activateTop() { // after a close or minimise, the next window down comes to the front (like JackOS)
    const next = winEls().filter(shown).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    if (next) { next.classList.remove('inactive'); activate(next); }
    else document.querySelectorAll('#tasks .tbtn').forEach(t => t.classList.remove('on'));
  }
  const isActive = el => shown(el) && !el.classList.contains('inactive') && +el.style.zIndex >= (window.JZ || 0);
  const place = (w, x, y) => { // keep a new window fully on screen (phones too)
    const r = w.getBoundingClientRect(), H = innerHeight - 32;
    w.style.left = Math.round(Math.max(4, Math.min(innerWidth - r.width - 4, x))) + 'px';
    w.style.top = Math.round(Math.max(4, Math.min(H - r.height - 4, y))) + 'px';
  };
  let TASKICO = '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="12" fill="#c0c0c0" stroke="#000"/><rect x="2" y="3" width="12" height="3" fill="#000080"/></svg>';
  document.addEventListener('DOMContentLoaded', () => { if (window.JICON) TASKICO = JICON.get('app', 16); });
  function openWin(title, body, width) {
    const w = document.createElement('div');
    w.className = 'win float'; w.style.width = Math.min(width || 340, innerWidth - 8) + 'px';
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', title);
    const tb = document.createElement('div'); tb.className = 'tb';
    const t = document.createElement('span'); t.className = 't'; t.textContent = title;
    const ctl = document.createElement('span'); ctl.className = 'ctl';
    const x = document.createElement('button'); x.textContent = 'x'; x.setAttribute('aria-label', 'Close');
    ctl.appendChild(x); tb.append(t, ctl);
    const bd = document.createElement('div'); bd.className = 'body'; bd.appendChild(body);
    w.append(tb, bd);
    document.body.appendChild(w);
    const r = w.getBoundingClientRect();
    place(w, (innerWidth - r.width) / 2 + (Math.random() * 40 - 20), (innerHeight - 32 - r.height) / 2 - 20 + (Math.random() * 40 - 20));
    // taskbar button: click it to bring the window forward, again to tuck it away
    const task = document.createElement('button'); task.className = 'tbtn'; task.innerHTML = `<span class="tico">${TASKICO}</span><span></span>`; task.lastChild.textContent = title; task.title = title;
    $('tasks').appendChild(task); w._task = task;
    task.addEventListener('click', () => { if (w.style.display === 'none') { w.style.display = ''; activate(w); } else if (isActive(w)) { w.style.display = 'none'; activateTop(); } else activate(w); });
    w.addEventListener('pointerdown', () => activate(w), true);
    activate(w);
    // drag by the title bar
    let drag = null;
    tb.addEventListener('pointerdown', ev => { if (ev.target.closest('button')) return; drag = { dx: ev.clientX - w.offsetLeft, dy: ev.clientY - w.offsetTop }; tb.setPointerCapture(ev.pointerId); });
    tb.addEventListener('pointermove', ev => {
      if (!drag) return;
      w.style.left = Math.max(-w.offsetWidth + 60, Math.min(innerWidth - 60, ev.clientX - drag.dx)) + 'px';
      w.style.top = Math.max(0, Math.min(innerHeight - 50, ev.clientY - drag.dy)) + 'px';
    });
    tb.addEventListener('pointerup', () => { drag = null; });
    tb.addEventListener('pointercancel', () => { drag = null; });
    let closed = false;
    const close = () => { if (closed) return; closed = true; w.remove(); task.remove(); activateTop(); };
    x.addEventListener('click', close);
    w.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !ev.defaultPrevented) { ev.preventDefault(); close(); } });
    return { el: w, body: bd, close };
  }
  function msgbox(title, text, icon, buttons) {
    const body = document.createElement('div');
    body.className = 'msgbox';
    body.innerHTML = '<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px">' + (mbIcon(icon || 'info')) + '<div class="txt" style="padding-top:8px;white-space:pre-line"></div></div><div class="row btns" style="justify-content:center;margin-top:14px"></div>';
    body.querySelector('.txt').textContent = text;
    const win = openWin(title, body, 330);
    (buttons || [['OK']]).forEach(([label, fn], i) => {
      const b = document.createElement('button'); b.className = 'btn' + (i ? '' : ' dflt'); b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { win.close(); if (fn) fn(); });
      body.querySelector('.btns').appendChild(b);
      if (i === 0) setTimeout(() => b.focus(), 30);
    });
    Sound.play('uhoh');
    return win;
  }
  function ask(title, text, def, maxlen, cb) {
    const body = document.createElement('form');
    body.innerHTML = '<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px">' + mbIcon('q') + '<div class="txt" style="padding-top:4px"></div></div><div class="row" style="margin-top:10px"><input type="text" autocomplete="off" style="flex:1;min-width:0' + (maxlen <= 3 ? ';text-transform:uppercase;font:bold 18px Courier New,monospace;letter-spacing:4px' : '') + '"></div><div class="row btns" style="justify-content:center;margin-top:12px"><button class="btn dflt" type="submit">OK</button><button class="btn" type="button">Cancel</button></div>';
    body.querySelector('.txt').textContent = text;
    const inp = body.querySelector('input'); inp.maxLength = maxlen; inp.value = def || '';
    const win = openWin(title, body, 320);
    setTimeout(() => { inp.focus(); inp.select(); }, 30);
    body.addEventListener('submit', ev => { ev.preventDefault(); win.close(); cb(inp.value); });
    body.querySelector('button[type=button]').addEventListener('click', win.close);
  }
  function notepad(name, text) {
    const body = document.createElement('div'); body.className = 'notepad';
    body.innerHTML = '<div class="menubar" style="margin:-4px -4px 4px"><button>File</button><button>Edit</button><button>Search</button><button>Help</button></div><textarea readonly></textarea>';
    body.querySelector('textarea').value = text;
    openWin(name + ' - Notepad', body, 460);
  }

  // ================================================================ pages are driven by JackNet Explorer (ie.js)
  const go = (sec, how) => window.IE && IE.go(sec, how);
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-go]');
    if (b) { ev.preventDefault(); go(b.dataset.go, 'click'); Sound.play('click'); }
  });

  const PARTY = `party.txt

31/12/99

THINGS TO TAKE TO DAVE'S
- sleeping bag
- N64 + GoldenEye + 4 controllers (borrow ${window.Cast ? Cast.n('kidEp1') : 'Sam'}'s)
- Pokemon Blue + link cable
- party poppers
- torch (in case of MILLENNIUM BUG)

THINGS TO DO WHEN I GET BACK
- issue 8!!!
- finish the Hobby page
- MGS review
- new cheats page
- feed Gubbinz

back next year!!!
`;
  const readme = () => window.Desk.notepad('party.txt', PARTY);
  $('iconReadme').addEventListener('click', readme);
  if ($('emailMe') && !/^mailto:/.test($('emailMe').getAttribute('href') || '')) $('emailMe').addEventListener('click', ev => { ev.preventDefault(); msgbox('Outlook Express', "My mom says I'm not allowed to put my email on the Internet. Write a letter on the Letters page instead!", 'warn'); });

  // ================================================================ start menu + tray
  const sm = $('startMenu');
  $('startBtn').addEventListener('click', ev => { ev.stopPropagation(); sm.classList.toggle('open'); $('startBtn').classList.toggle('on', sm.classList.contains('open')); $('startBtn').setAttribute('aria-expanded', sm.classList.contains('open')); });
  document.addEventListener('click', ev => { if (!sm.contains(ev.target) && ev.target !== $('startBtn')) { sm.classList.remove('open'); $('startBtn').classList.remove('on'); } });
  // Ctrl+Esc opens the Start menu from the keyboard (and Esc closes it)
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && ev.ctrlKey) { ev.preventDefault(); $('startBtn').click(); if (sm.classList.contains('open')) sm.querySelector('button').focus(); }
    else if (ev.key === 'Escape' && sm.classList.contains('open') && !document.querySelector('.menu')) { sm.classList.remove('open'); $('startBtn').classList.remove('on'); }
  });
  $('smUpdate').addEventListener('click', () => { $('startMenu').classList.remove('open'); msgbox('JackOS Update', 'Connecting to JackOS Update...\n\nYour computer is completely up to date. For 1999. There will never be another update. Enjoy!', 'info'); if (window.Apps) Apps.secret('update'); });
  // ---- Shut Down JackOS... the proper way
  const reboot = how => { try { sessionStorage.setItem('jhp_forceboot', how); } catch (e) {} location.reload(); };
  function shutdownSplash(msg, then) {
    Sound.music.stop();
    // every window closes down into the taskbar, the taskbar goes, the screen dims...
    document.querySelectorAll('.float').forEach((f, i) => setTimeout(() => f.classList.add('closing'), i * 120));
    setTimeout(() => $('browser').classList.add('closing'), 300);
    setTimeout(() => $('taskbar').classList.add('closing'), 700);
    setTimeout(() => { $('dimmer').hidden = false; }, 1000);
    setTimeout(() => {
      $('shutMsg').textContent = msg; $('shutdown').hidden = false; $('dimmer').hidden = true;
      if (!$('shutdown').querySelector('.sbar')) $('shutdown').firstElementChild.insertAdjacentHTML('beforeend', '<div class="sbar"><i></i></div>');
      Sound.play('shutdown');
      setTimeout(then, 3200);
    }, 2000);
  }
  function crtOff(then) { // the picture collapses to a line, then a dot, then nothing
    $('crt').classList.add('off'); Sound.play('crt');
    setTimeout(then, 1700);
  }
  $('smShutdown').addEventListener('click', () => {
    sm.classList.remove('open');
    const f = document.createElement('form');
    f.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start">${window.JICON ? JICON.get('shutdown', 32).replace('<svg ', '<svg style="flex:none" ') : '<svg viewBox="0 0 32 32" width="32" height="32" style="flex:none"><rect x="3" y="4" width="26" height="18" fill="#c0c0c0" stroke="#000"/><rect x="6" y="7" width="20" height="12" fill="#000080"/><rect x="10" y="24" width="12" height="4" fill="#808080"/></svg>'}<div><div>What do you want the computer to do?</div>
      <label style="display:block;margin-top:8px"><input type="radio" name="sd" value="standby"> <u>S</u>tand by</label>
      <label style="display:block"><input type="radio" name="sd" value="off" checked> S<u>h</u>ut down</label>
      <label style="display:block"><input type="radio" name="sd" value="restart"> <u>R</u>estart</label>
      <label style="display:block"><input type="radio" name="sd" value="dos"> Restart in <u>M</u>S-DOS mode</label></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" type="submit" style="min-width:75px">OK</button><button class="btn" type="button" style="min-width:75px">Cancel</button><button class="btn" type="button" style="min-width:75px">Help</button></div>`;
    const w = openWin('Shut Down JackOS', f, 340);
    const [, cancel, help] = f.querySelectorAll('.btn');
    cancel.addEventListener('click', w.close);
    help.addEventListener('click', () => msgbox('Help', 'Shut down: switch the PC off properly (no ScanDisk next time!).\nRestart: turn it off and on again.\nStand by: nap mode, wiggle the mouse to wake it.', 'info'));
    f.addEventListener('submit', ev => {
      ev.preventDefault(); w.close();
      const v = f.querySelector('input:checked').value;
      if (v === 'standby') { $('standby').hidden = false; Sound.music.stop(); setTimeout(() => { const wake = () => { $('standby').hidden = true; ['pointermove', 'keydown', 'pointerdown'].forEach(e => document.removeEventListener(e, wake)); Sound.play('join'); }; ['pointermove', 'keydown', 'pointerdown'].forEach(e => document.addEventListener(e, wake)); }, 800); }
      else if (v === 'off') { try { localStorage.setItem('jhp_clean', '1'); } catch (e) {} shutdownSplash('JackOS is shutting down...', () => crtOff(() => reboot('power'))); }
      else if (v === 'restart') { try { localStorage.setItem('jhp_clean', '1'); } catch (e) {} shutdownSplash('JackOS is restarting...', () => crtOff(() => reboot('bios'))); }
      else if (v === 'dos') { try { localStorage.setItem('jhp_clean', '1'); } catch (e) {} shutdownSplash('Preparing to start your computer in MS-DOS mode...', dos); }
    });
  });

  // ---- MS-DOS mode: a tiny command prompt
  function dos() {
    $('shutdown').hidden = true; $('dos').hidden = false;
    if (window.DOS && DOS.fullscreen) return DOS.fullscreen($('dos'), () => { $('dos').hidden = true; reboot('bios'); });
    const out = $('dosOut'), inp = $('dosIn');
    const say = t => { out.textContent += t + '\n'; $('dos').scrollTop = 1e9; };
    out.textContent = '';
    say('JackOS(R) 98 MS-DOS Mode\n   (C)Copyright Jack 1999. All rights reserved (by Jack).\n\nType HELP for a list of commands. Type WIN to go back to JackOS.\n');
    setTimeout(() => inp.focus(), 50);
    const FILES = ['AUTOEXEC BAT', 'COMMAND  COM', 'CONFIG   SYS', 'JACKATAK     <DIR>', 'JACKOS      <DIR>', 'GAMES        <DIR>', 'HOMEWORK DOC  (empty)', 'GUBBINZ  EXE', 'JACKTRIS EXE'];
    inp.onkeydown = ev => {
      if (ev.key !== 'Enter') return;
      const cmd = inp.value.trim(), c = cmd.toUpperCase().split(/\s+/)[0]; inp.value = '';
      say('C:\\>' + cmd);
      if (!c) return;
      if (c === 'HELP') say('DIR     List files\nCLS     Clear the screen\nVER     Show the version\nDATE    Show the date\nTYPE    Show a file (try TYPE PARTY.TXT)\nGUBBINZ Run Gubbinz\nWIN     Start JackOS\nEXIT    Start JackOS');
      else if (c === 'DIR') say(' Volume in drive C is JACKS PC\n Directory of C:\\\n\n' + FILES.join('\n') + '\n        9 file(s)       6.4GB free (after deleting homework)');
      else if (c === 'CLS') out.textContent = '';
      else if (c === 'VER') say('\nJackOS 98 [Version 4.10.1999]');
      else if (c === 'DATE') { const t = today99(); say(`Current date is ${DAYS[t.date.getDay()].slice(0, 3)} ${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}-1999`); }
      else if (c === 'TYPE') say(/PARTY/i.test(cmd) ? PARTY : 'File not found');
      else if (c === 'GUBBINZ') say("OI! This is DOS! There's no graphics in here! Type WIN, silly.");
      else if (c === 'WIN' || c === 'EXIT') { say('Starting JackOS 98...'); setTimeout(() => reboot('bios'), 600); }
      else if (c === 'FORMAT') say('Nice try. Mom would kill you.');
      else say('Bad command or file name');
    };
  }

  function sfxIcon() { $('sfxWaves').style.display = Sound.on ? '' : 'none'; $('sfxX').style.display = Sound.on ? 'none' : ''; $('sfxBtn').title = 'Sound effects: ' + (Sound.on ? 'on' : 'off'); }
  $('sfxBtn').addEventListener('click', () => { Sound.on = !Sound.on; sfxIcon(); Sound.play('click'); toast('Volume', Sound.on ? 'Sound effects on.' : 'Sound effects off.', 1800); });
  sfxIcon();
  document.addEventListener('sfxchange', sfxIcon);
  $('netBtn').addEventListener('click', () => window.JackIRC && JackIRC.launch ? JackIRC.launch({ autojoin: true }) : go('chat', 'click'));
  function clock() { const d = new Date(); $('clock').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); const t = today99(); $('clock').title = `${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999`; }

  // ================================================================ cheats
  let paintball = false, rainbow = false, big = false;
  const CHEATS = {
    IDDQD: () => 'God mode ON. (This is the wrong game, but OK.)',
    WAAAGH: () => { const f = $('waaaghFlash'); $('waaaghFlashBy').textContent = 'a little WAAAGH! just for you'; f.style.display = 'flex'; document.body.classList.add('shake'); Sound.play('waaagh'); setTimeout(() => { f.style.display = 'none'; document.body.classList.remove('shake'); }, 1800); return 'WAAAGH! (only you heard that one)'; },
    BIGHEAD: () => { big = !big; if (window.Stickmen) Stickmen.bigHeads(big); return big ? 'DK Mode! The stickmen have BIG HEADS now. (Games > Stickman Stunts)' : 'Heads back to normal.'; },
    PAINTBALL: () => { paintball = !paintball; return paintball ? 'Paintball mode ON. Click anywhere on the page.' : 'Paintball mode OFF.'; },
    MISSINGNO: () => { document.body.classList.add('glitch'); setTimeout(() => document.body.classList.remove('glitch'), 2500); return 'MISSINGNO. appeared! Your Hall of Fame is ruined.'; },
    UUDDLRLRBA: () => { rainbow = !rainbow; document.body.classList.toggle('rainbow', rainbow); return rainbow ? '+30 lives. And everything is rainbow now.' : 'Rainbow off.'; },
    BSOD: () => { bsod(); return ''; },
  };
  CHEATS.KONAMI = CHEATS.UUDDLRLRBA; CHEATS.DKMODE = CHEATS.BIGHEAD;
  function runCheat(raw) {
    const code = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const out = $('cheatOut');
    if (CHEATS[code]) {
      const msg = CHEATS[code]();
      if (msg) { out.textContent = '\u2714 ' + msg; out.style.color = '#060'; }
      Sound.play('pet');
      const n = (+store.get('jhp_cheats') || 0) + 1; store.set('jhp_cheats', n);
    } else if (code) {
      out.style.color = '#c00';
      out.textContent = `Cannot find '${raw}'. Make sure the name is correct, and then try again.`;
      Sound.play('uhoh');
    }
  }
  $('cheatForm').addEventListener('submit', ev => { ev.preventDefault(); runCheat($('cheatInput').value); $('cheatInput').value = ''; });
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0;
  document.addEventListener('keydown', ev => {
    kpos = ev.key === KONAMI[kpos] ? kpos + 1 : (ev.key === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; toast('Cheat!', CHEATS.UUDDLRLRBA()); }
  });
  const SPLAT = ['#e10600', '#0028c8', '#ffd400', '#0a0', '#f0f', '#00e5ff'];
  $('pane').addEventListener('pointerdown', ev => {
    if (!paintball || ev.target.closest('canvas,button,input,textarea,select')) return;
    const r = $('pane').getBoundingClientRect();
    const s = document.createElement('span'); s.className = 'splat';
    const c = SPLAT[Math.floor(Math.random() * SPLAT.length)];
    s.style.background = `radial-gradient(circle,${c} 45%,transparent 46%),radial-gradient(circle at 20% 30%,${c} 18%,transparent 19%),radial-gradient(circle at 80% 70%,${c} 14%,transparent 15%)`;
    s.style.left = (ev.clientX - r.left) + 'px'; s.style.top = (ev.clientY - r.top) + 'px';
    $('pane').appendChild(s); Sound.play('thud');
    setTimeout(() => s.remove(), 15000);
  });
  const CRASHES = [
    'A fatal exception 0E has occurred at 0028:C0011E36 in VXD GUBBINZ(01) + 00010E36. The current application will be terminated.',
    'A fatal exception 0D has occurred at 015F:BFF9DBA7 in VXD JOYSTICK(03) + 00004A2C. The current application will be terminated.',
    'A fatal exception 06 has occurred at 0167:BFF71234 in VXD Y2K(02) + 00001999. The current application will be terminated.',
    'An exception 0E has occurred at 0028:C02A0201 in VxD VMM(01) + 00001999. This was called from 0028:C0034A1C in VxD MODEM(01). It may be possible to continue normally.',
    'JackOS has run out of memory. All 64MB of it. Someone opened too many toolbars.',
  ];
  let crashed = false;
  function bsod(why) {
    if (crashed) return; crashed = true;
    Sound.music.stop();
    $('bsodText').textContent = CRASHES[Math.floor(Math.random() * CRASHES.length)];
    $('bsod').style.display = 'flex';
    try { localStorage.setItem('jhp_clean', '0'); } catch (e) {} // crashed = not shut down properly = ScanDisk next time
    const go = () => { document.removeEventListener('keydown', go); $('bsod').removeEventListener('click', go); crtOff(() => reboot('bios')); };
    setTimeout(() => { document.addEventListener('keydown', go); $('bsod').addEventListener('click', go); }, 500);
  }
  // super rare: roughly once every eight hours of browsing, the PC just... crashes
  setInterval(() => { if (!document.hidden && !document.getElementById('boot') && (Math.random() < 1 / 480 || /[?&]bsodtest/.test(location.search))) bsod('random'); }, /[?&]bsodtest/.test(location.search) ? 5000 : 60000);

  // ================================================================ forever 1999
  // The page lives in 1999: same day and month as the visitor's real clock. Posts appear on their day each year,
  // the countdown runs to the Millennium, and at midnight on New Year it glitches and starts 1999 all over again.
  const mmdd = d => (d.getMonth() + 1) * 100 + d.getDate();
  const testOffset = /[?&]y2ktest/.test(location.search) ? (new Date(new Date().getFullYear() + 1, 0, 1) - Date.now()) - 8000 : 0;
  const now = () => new Date(Date.now() + testOffset);
  // ---- the calendar: CAL.posts = [['MM-DD', 'TAG', 'text'], ...], CAL.hype = [['MM-DD', 'name', daysBefore], ...]
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let newsShown = 10;
  function today99() { // same day and month, but in 1999 (which had no 29 February)
    const n = now();
    let m = n.getMonth() + 1, d = n.getDate();
    if (m === 2 && d === 29) d = 28;
    return { m, d, md: m * 100 + d, date: new Date(1999, m - 1, d) };
  }
  const mdOf = s => { const [m, d] = s.split('-').map(Number); return m * 100 + d; };
  const dd = s => { const [m, d] = s.split('-'); return d + '/' + m + '/99'; };
  function calendar() {
    const t = today99(), CAL = window.CAL || { posts: [], hype: [] };
    $('todayLine').textContent = `Today is ${DAYS[t.date.getDay()]} ${t.d} ${MONTHS[t.m - 1]} 1999`;
    // posts up to today, newest first
    const posts = CAL.posts.filter(p => mdOf(p[0]) <= t.md).sort((a, b) => mdOf(b[0]) - mdOf(a[0]));
    const ul = $('news'); ul.innerHTML = '';
    posts.slice(0, newsShown).forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${dd(p[0])}</b><span class="tag tag-${p[1]}">${p[1]}</span>${p[2]}`;
      if (mdOf(p[0]) === t.md) li.classList.add('fresh');
      ul.appendChild(li);
    });
    $('newsMore').hidden = posts.length <= newsShown;
    // countdowns to the big stuff
    const counts = [];
    for (const [d, name, before] of CAL.hype) {
      const [m, day] = d.split('-').map(Number);
      const left = Math.round((new Date(1999, m - 1, day) - t.date) / 86400000);
      if (left >= 0 && left <= before) counts.push([left, name]);
    }
    counts.sort((a, b) => a[0] - b[0]);
    $('countdowns').hidden = !counts.length;
    $('countList').innerHTML = counts.slice(0, 5).map(([left, name]) =>
      left === 0 ? `<li class="today">${name} is OUT TODAY!!!</li>`
      : left === 1 ? `<li><b>TOMORROW!!!</b> ${name}</li>`
      : `<li>Only <b>${left}</b> days until ${name}!!!</li>`).join('');
    // reviews and anything else marked data-from="MM-DD" only appear once it's happened
    document.querySelectorAll('[data-from]').forEach(el => { el.hidden = mdOf(el.dataset.from) > t.md; });
    document.querySelectorAll('[data-until]').forEach(el => { el.hidden = mdOf(el.dataset.until) <= t.md; });
    $('lastPost').hidden = t.md !== 1231;
    $('lastUpdated').textContent = posts.length ? `Last updated: ${dd(posts[0][0])} \u00b7 ` : '';
  }
  $('newsMore').addEventListener('click', () => { newsShown += 15; calendar(); });
  let lastLeft = null, inEvent = false;
  function countdown() {
    const n = now(), target = new Date(n.getFullYear() + 1, 0, 1);
    let left = Math.max(0, Math.floor((target - n) / 1000));
    if (lastLeft !== null && left > lastLeft + 60 && !inEvent) newYear(); // we just ticked past midnight
    lastLeft = left;
    if (inEvent) return;
    const d = Math.floor(left / 86400); left %= 86400;
    const hh = Math.floor(left / 3600); left %= 3600;
    const mm = Math.floor(left / 60), ss = left % 60;
    $('y2k').textContent = `${d} days ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  function newYear() {
    if (document.body.classList.contains('ssn-y2k')) return; // Y2K Night (seasons-y2k.js) is running its own show
    inEvent = true;
    const ev = $('y2kEvent'), tx = $('y2kText'), sm2 = $('y2kSmall');
    ev.style.display = 'flex'; tx.textContent = 'HAPPY NEW YEAR!!! 2000!!!'; sm2.textContent = '*** THE NEW MILLENNIUM IS HERE ***';
    $('y2k').classList.add('glitch'); Sound.play('solve');
    setTimeout(() => { tx.textContent = 'ERROR: YEAR 19100'; sm2.textContent = 'MILLENNIUM BUG DETECTED. C:\\JACKATAK\\CLOCK.DLL has stopped responding.'; document.body.classList.add('glitch'); Sound.play('uhoh'); }, 3200);
    setTimeout(() => { tx.textContent = 'RESETTING TO 1999...'; sm2.textContent = 'Please wait. Do not turn off your computer.'; }, 6000);
    setTimeout(() => {
      ev.style.display = 'none'; document.body.classList.remove('glitch'); $('y2k').classList.remove('glitch');
      inEvent = false; calendar(); countdown();
      toast('Welcome back to 1999!', 'Same old year. Again. Forever.', 7000);
    }, 9500);
  }
  calendar(); countdown();
  setInterval(countdown, 1000);
  setInterval(calendar, 60000);

  // ================================================================ start up (JackNet Explorer opens the first page)
  clock(); setInterval(clock, 10000);
  $('clock').addEventListener('dblclick', () => {
    const t = today99(), first = new Date(1999, t.m - 1, 1).getDay(), days = new Date(1999, t.m, 0).getDate();
    const body = document.createElement('div');
    let grid = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<b>${d}</b>`).join('');
    for (let i = 0; i < first; i++) grid += '<span></span>';
    for (let d = 1; d <= days; d++) grid += `<span class="${d === t.d ? 'today' : ''}">${d}</span>`;
    body.innerHTML = `<div class="tabs"><span class="on">Date &amp; Time</span><span>Time Zone</span></div><div class="tabpage"><div class="row" style="margin-bottom:8px"><select><option>${MONTHS[t.m - 1]}</option></select><input type="text" value="1999" readonly style="width:60px"></div><div class="calgrid">${grid}</div><p style="margin:8px 0 0">Current time: <b>${$('clock').textContent}</b></p></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button">OK</button></div>`;
    const w = openWin('Date/Time Properties', body, 300);
    body.querySelector('.btn').addEventListener('click', w.close);
  });
  window.Desk = { refreshNews: () => calendar(), go, toast, msgbox, ask, notepad, openWin, activate, activateTop, isActive, nz, place, readme, today99, bsod, reboot, get current() { return window.IE ? IE.current : null; } };
})();
