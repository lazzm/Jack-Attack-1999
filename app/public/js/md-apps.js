/* md-apps: the programs that talk to JackMUD (lazy, after js/md-term.js).
 *   MDApps.telnet(host, port)   JackOS Telnet: Connect > Remote System..., Edit, Terminal > Preferences / logging, Help
 *   MDApps.dos(sh, args)        MS-DOS TELNET host [port], right there in the DOS box (ANSI colour and all)
 *   MDApps.muddy()              MUDdy 98 (a download): terminal + map + compass + health bars + who's here */
(function () {
  'use strict';
  if (window.MDApps || !window.MDTerm) return;
  const A = window.Apps, esc = A.esc, store = A.store, T = window.MDTerm, MD = window.MD;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const isMud = host => /^(mud\.jacknet\.jnet|jacknet\.jnet|(www\.)?jackmud\.jnet|mud\.jackmud\.jnet)$/i.test(String(host || '').trim());
  const portNo = p => { p = String(p || '').trim().toLowerCase(); return { '': 23, telnet: 23, daytime: 13, echo: 7, qotd: 17, chargen: 19, mud: 4000 }[p] || (+p | 0); };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now99 = () => { const t = Desk.today99(), d = new Date(); const p = n => String(n).padStart(2, '0'); return `${DAYS[t.date.getDay()]} ${MON[t.m - 1]} ${p(t.d)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} 1999`; };
  const QOTD = ['"There are 10 kinds of people: those who understand binary and those who don\'t." - Callum', '"Have you tried turning it off and on again?" - Saint Reboot', '"It\'s not a bug, it\'s a feature." - every programmer ever', '"The Millennium Bug is a myth. Probably." - Dave', '"Never trust a goose." - Farmer Giles'];

  // ================================================================ fake hosts (the ones that aren't JackMUD)
  // a tiny line-mode conversation for the other ports: returns { start(), line(text) } or null
  function fakeHost(host, port, term, end) {
    if (isMud(host) && port === 23) {
      let step = 0;
      return { start() { term.write(`\x1b[0m\r\nJackNIX 1.0 (mud.jacknet.jnet) (ttyp3)\r\n\r\n\x1b[1;30mThis is the boring way in. Nothing here but the server's filing cabinet.\x1b[0m\r\n\r\n`); term.prompt('login: '); },
        line(t) { if (step === 0) { step = 1; term.prompt('Password: '); term.password(true); return; } term.password(false); term.write('\r\nLogin incorrect\r\n\r\n\x1b[1;33mPSST! JackMUD lives on port 4000, not 23! Try Connect > Remote System again, with Port: 4000.\x1b[0m\r\n'); A.secret('md.port23'); setTimeout(() => end('Connection to host lost.'), 900); } };
    }
    if (isMud(host) && port === 13) return { start() { term.write(now99() + '\r\n'); setTimeout(() => end('Connection to host lost.'), 400); }, line() {} };
    if (isMud(host) && port === 17) return { start() { term.write(QOTD[Math.floor(Math.random() * QOTD.length)] + '\r\n'); setTimeout(() => end('Connection to host lost.'), 400); }, line() {} };
    if (isMud(host) && port === 7) return { start() { term.write('\x1b[1;30m(echo server: everything you type comes back. Riveting. Type QUIT to stop.)\x1b[0m\r\n'); term.prompt(''); }, line(t) { if (/^quit$/i.test(t.trim())) return end('Connection closed by foreign host.'); term.write(t + '\r\n'); } };
    if (/^(localhost|127\.0\.0\.1)$/i.test(host)) return { start() { term.write('Connected to localhost.\r\nYou are already here. You have connected to yourself. Hello, you.\r\n'); setTimeout(() => end('Connection to host lost.'), 1500); }, line() {} };
    return null;
  }
  const MOVIE = /^(jacknet\.tv|towel(\.blinkenlights\.nl)?|blinkenlights)$/i;

  // ================================================================ the Connect dialog
  const HOSTS = () => { const L = store.get('jhp_md_hosts', []); return [...new Set([...L, 'mud.jacknet.jnet', 'jacknet.tv'])].slice(0, 8); };
  function connectDialog(parent, cb) {
    const b = h('div', 'md-dlg');
    const last = store.get('jhp_md_last', { h: 'mud.jacknet.jnet', p: '4000' });
    b.innerHTML = `<div class="md-dlgrow"><label for="mdHost"><u>H</u>ost Name:</label><input id="mdHost" class="field" list="mdHostList" value="${esc(last.h)}" autocomplete="off" spellcheck="false"><datalist id="mdHostList">${HOSTS().map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
      <div class="md-dlgrow"><label for="mdPort"><u>P</u>ort:</label><input id="mdPort" class="field" list="mdPortList" value="${esc(last.p)}" autocomplete="off"><datalist id="mdPortList"><option value="4000"><option value="telnet"><option value="daytime"><option value="echo"><option value="qotd"></datalist></div>
      <div class="md-dlgrow"><label for="mdTerm"><u>T</u>ermType:</label><select id="mdTerm" class="field"><option>ansi</option><option>vt100</option><option>vt52</option></select></div>
      <p class="md-dlghint">JackMUD: <b>mud.jacknet.jnet</b>, port <b>4000</b></p>
      <div class="md-dlgbtns"><button type="button" class="btn md-ok">Connect</button><button type="button" class="btn md-cancel">Cancel</button></div>`;
    const w = A.win('Connect', b, { w: 300, noResize: true, noMax: true, noMin: true, escClose: true, icon: MD.ICO.telnet });
    const go = () => { const host = b.querySelector('#mdHost').value.trim(), port = b.querySelector('#mdPort').value.trim() || 'telnet'; if (!host) return Desk.msgbox('Telnet', 'Please type a host name.', 'warn'); w.close(); cb(host, port); };
    b.querySelector('.md-ok').addEventListener('click', go);
    b.querySelector('.md-cancel').addEventListener('click', w.close);
    b.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }));
    setTimeout(() => { const i = b.querySelector('#mdHost'); i.focus(); i.select(); }, 50);
    return w;
  }

  // ================================================================ JackOS Telnet
  let telW = null;
  function telnet(host, port) {
    if (telW && !telW.closed) { telW.restore(); if (host) telW.connect(host, port); return telW; }
    const body = h('div', 'md-tel');
    const term = T.term({ skin: 'win', onLine: t => W.line(t), onCols: c => { if (W.sess) W.sess.cols(c); }, onEscape: () => W.disconnect('Connection closed.') });
    const qb = T.quickbar({ skin: 'win', send: c => { term.send(c); term.focus(); } });
    body.append(term.el, qb.el);
    const W = A.win('Telnet - (None)', body, { w: Math.min(720, innerWidth - 8), h: Math.min(520, innerHeight - 70), menubar: true, icon: MD.ICO.telnet, minW: 260, minH: 200,
      onClose: () => { if (W.sess) W.sess.close(); stopLog(); term.destroy(); telW = null; } });
    telW = W;
    let log = null, qbOn = store.get('jhp_md_qbar', true);
    const setQb = on => { qbOn = on; store.set('jhp_md_qbar', on); body.classList.toggle('md-qoff', !on); };
    const setLive = (on, title) => { term.setLive(on); W.setTitle('Telnet - ' + (title || '(None)')); body.classList.toggle('md-mudon', !!(on && W.mud)); if (!on) qb.off(); };
    setQb(qbOn); setLive(false);
    term.info('JackOS Telnet 1.0   Connect > Remote System... to dial up a host.');
    term.info('(JackMUD is at mud.jacknet.jnet, port 4000. Tell your mates.)\n');
    const sink = {
      write: s => { term.write(s); if (log) { log.t += T.strip(s); if (log.t.length > 60000) log.t = log.t.slice(-60000); } },
      prompt: p => term.prompt(p), info: s => term.info(s), cols: () => term.cols(),
      stat: st => qb.stat(st),
      end: why => { W.sess = null; W.mud = false; setLive(false); term.info('\n' + why); if (!W.closed && !W.quiet) Desk.msgbox('Telnet', why === 'Connection closed by foreign host.' ? 'Connection to host lost.' : why, 'info'); W.quiet = false; },
    };
    W.line = t => { if (W.fake) return W.fake.line(t); if (W.sess) { W.sess.send(t); if (log) log.t += t + '\n'; } };
    W.disconnect = why => { W.quiet = true; if (W.sess) W.sess.close(false, why || 'Connection closed.'); else if (W.fake) { W.fake = null; setLive(false); term.info('\n' + (why || 'Connection closed.')); } };
    W.connect = (hst, prt) => {
      hst = String(hst || '').trim(); const pn = portNo(prt);
      if (!hst) return;
      if (W.sess || W.fake) { W.quiet = true; if (W.sess) W.sess.close(false, 'Connection closed.'); W.fake = null; }
      const hl = [hst, ...store.get('jhp_md_hosts', []).filter(x => x.toLowerCase() !== hst.toLowerCase())].slice(0, 6); store.set('jhp_md_hosts', hl);
      store.set('jhp_md_last', { h: hst, p: String(prt || 'telnet') });
      if (MOVIE.test(hst)) { const f = A.cmds['telnet jacknet.tv']; if (f) f('telnet jacknet.tv'); return; }
      term.info(`Connecting to ${hst}${pn !== 23 ? ' port ' + pn : ''}...`);
      sfx('modem');
      const endFake = why => { W.fake = null; setLive(false); term.info('\n' + why); if (!W.closed) Desk.msgbox('Telnet', 'Connection to host lost.', 'info'); };
      setTimeout(() => {
        if (W.closed) return;
        if (isMud(hst) && pn === 4000) { W.mud = true; setLive(true, hst); W.sess = T.session(sink, 'tel'); term.focus(); return; }
        const fk = fakeHost(hst, pn, term, endFake);
        if (fk) { W.fake = fk; setLive(true, hst); fk.start(); term.focus(); return; }
        term.info('Connect failed!');
        Desk.msgbox('Connect Failed!', `Could not open a connection to host on port ${pn} : Connect failed`, 'warn');
      }, isMud(hst) ? 900 : 1600);
    };
    // logging (a real file on the C: drive)
    function startLog() { if (log) return; Desk.ask('Open Log File', 'Log file name (it goes in My Documents):', 'TELNET.LOG', 12, n => { if (!n) return; log = { name: String(n).replace(/[\\/:*?"<>|]/g, '').toUpperCase() || 'TELNET.LOG', t: '' }; term.info('(Logging to C:\\My Documents\\' + log.name + ')'); }); }
    function stopLog() { if (!log) return; try { A.fs.add('C:/My Documents', { name: log.name, type: 'txt', text: log.t || '(empty)', date: (() => { const t = Desk.today99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; })(), size: Math.max(1, Math.round(log.t.length / 1024)) + ' KB' }); } catch (e) {} if (!W.closed) term.info('(Log saved: C:\\My Documents\\' + log.name + ')'); log = null; }
    A.menubar(W, [
      ['Connect', () => [{ label: 'Remote System...', act: () => connectDialog(W, W.connect) }, { label: 'Disconnect', dis: !(W.sess || W.fake), act: () => W.disconnect('Connection closed.') }, '-',
        ...HOSTS().slice(0, 4).map((x, i) => ({ label: `${i + 1} ${x}`, act: () => W.connect(x, isMud(x) ? '4000' : 'telnet') })), '-', { label: 'Exit', act: () => W.close() }]],
      ['Edit', () => [{ label: 'Copy', key: 'Ctrl+Ins', act: () => term.copy() }, { label: 'Paste', key: 'Shift+Ins', act: () => { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => term.paste(t), () => {}); } }, '-', { label: 'Select All', act: () => term.selectAll() }, { label: 'Clear Screen', act: () => term.clear() }]],
      ['Terminal', () => [{ label: 'Preferences...', act: prefs }, '-', { label: log ? 'Stop Logging' : 'Start Logging...', act: () => (log ? stopLog() : startLog()) }, '-', { label: 'JackMUD Quick Bar', chk: qbOn, act: () => setQb(!qbOn) }]],
      ['Help', () => [{ label: 'Contents', act: () => Desk.notepad('TELNET.HLP', HELP) }, { label: 'Search for Help on...', act: () => Desk.notepad('TELNET.HLP', HELP) }, '-', { label: 'About Telnet...', act: () => Desk.msgbox('About Telnet', 'JackOS Telnet\nVersion 1.0 (4.10.1999)\n\nConnects your PC to other computers, one letter at a time.\n\nCopyright (c) Jack 1998-1999', 'info') }]],
    ]);
    function prefs() {
      const b = h('div', 'md-dlg md-prefs');
      b.innerHTML = `<fieldset class="group"><legend class="lg">Terminal Options</legend><label><input type="checkbox" class="pe"> <u>L</u>ocal Echo (type on the screen)</label><label><input type="checkbox" class="pq"> JackMUD <u>Q</u>uick Bar</label><label><input type="checkbox" class="pc"> Clickable commands</label></fieldset>
        <fieldset class="group"><legend class="lg">Colours</legend>${Object.entries(T.THEMES).map(([k, v]) => `<label><input type="radio" name="mdth" value="${k}"> ${v}</label>`).join('')}</fieldset>
        <fieldset class="group"><legend class="lg">Fonts</legend><select class="field ps">${Object.keys(T.SIZES).map(k => `<option value="${k}">${T.SIZES[k]} point Lucida Console</option>`).join('')}</select></fieldset>
        <div class="md-dlgbtns"><button type="button" class="btn md-ok">OK</button><button type="button" class="btn md-cancel">Cancel</button></div>`;
      const w = A.win('Terminal Preferences', b, { w: 300, noResize: true, noMax: true, noMin: true, escClose: true, icon: MD.ICO.telnet });
      b.querySelector('.pe').checked = term.opts.inline; b.querySelector('.pq').checked = qbOn; b.querySelector('.pc').checked = term.opts.clickable !== false;
      b.querySelector(`[name=mdth][value=${term.opts.theme}]`).checked = true; b.querySelector('.ps').value = term.opts.size;
      b.querySelector('.md-ok').addEventListener('click', () => {
        term.inline(b.querySelector('.pe').checked); store.set('jhp_md_inline', b.querySelector('.pe').checked); setQb(b.querySelector('.pq').checked); term.opts.clickable = b.querySelector('.pc').checked;
        const th = b.querySelector('[name=mdth]:checked'); if (th) term.setTheme(th.value); term.setSize(b.querySelector('.ps').value); w.close(); term.focus();
      });
      b.querySelector('.md-cancel').addEventListener('click', w.close);
    }
    const inl = store.get('jhp_md_inline', null); if (inl !== null && !T.phone()) term.inline(!!inl);
    if (host) setTimeout(() => W.connect(host, port || '23'), 150);
    else setTimeout(() => { if (!W.closed && !W.sess) connectDialog(W, W.connect); }, 350);
    term.focus();
    return W;
  }
  const HELP = `JACKOS TELNET HELP
==================
Telnet lets your computer talk to another computer over the JackNet, one line of text at a time.

TO CONNECT
  Connect > Remote System...
  Host Name:  the computer you want (for example mud.jacknet.jnet)
  Port:       which "door" on that computer. JackMUD is on port 4000.
              "telnet" (port 23) is the normal login door.
  TermType:   leave it on ansi for colours.

TO DISCONNECT
  Type QUIT in JackMUD (it saves your character), or Connect > Disconnect.

TIPS
  * Press the Up arrow to repeat something you typed before.
  * Click a WHITE CAPITAL word in JackMUD to type it for you.
  * Terminal > Preferences changes the colours and the font size.
  * Terminal > Start Logging saves everything to a file in My Documents.
  * The Quick Bar has buttons for walking about, and for the people and things around you.

OTHER HOSTS TO TRY
  jacknet.tv      a film made out of letters
  mud.jacknet.jnet port 13 (daytime) or 17 (qotd)
`;

  // ================================================================ MS-DOS: TELNET host [port]
  // ANSI-aware word wrap for the DOS screen (the server sends long paragraphs; DOS needs them broken up)
  function wrap(s, cols) {
    const out = [];
    for (const line of String(s).replace(/\r/g, '').split('\n')) {
      let cur = '', vis = 0, word = '', wvis = 0;
      const flushWord = () => { if (vis + wvis > cols && vis > 0) { out.push(cur); cur = ''; vis = 0; word = word.replace(/^ +/, m => { wvis -= m.length; return ''; }); } cur += word; vis += wvis; word = ''; wvis = 0; };
      const parts = line.split(/(\x1b\[[0-9;]*m)/);
      for (const p of parts) {
        if (/^\x1b\[/.test(p)) { word += p; continue; }
        for (const ch of p) {
          if (ch === ' ') { flushWord(); word = ' '; wvis = 1; continue; }
          word += ch; wvis++;
          if (wvis >= cols) { flushWord(); }
        }
      }
      flushWord(); out.push(cur);
    }
    return out.join('\n');
  }
  const dosSafe = s => String(s).replace(/★/g, '*').replace(/[♪♫]/g, '\u266a').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  async function dos(sh, args) {
    const a = sh.args ? sh.args(args || '') : String(args || '').split(/\s+/).filter(Boolean);
    const host = a[0], port = portNo(a[1] || 'telnet'), HOSTO = sh.host, t = HOSTO.term, scr = HOSTO.screen;
    if (!host || /^\/\?$/.test(host)) {
      if (!host && sh.mode === 'win') { sh.println('Starting JackOS Telnet...'); MD.telnet(); return; }
      sh.println('Connects to another computer over the JackNet.');
      sh.println('');
      sh.println('TELNET host [port]');
      sh.println('');
      sh.println('  host   the computer to connect to (try MUD.JACKNET.JNET)');
      sh.println('  port   the port number (JackMUD is on 4000)');
      sh.println('');
      sh.println('Example:  TELNET MUD.JACKNET.JNET 4000');
      return;
    }
    if (MOVIE.test(host)) { sh.println('Connecting to ' + host + '... the film opens in a window.'); const f = A.cmds['telnet jacknet.tv']; if (f) f('telnet jacknet.tv'); return; }
    sh.println(`Trying ${host}...`);
    await HOSTO.sleep(700);
    if (!(isMud(host) && (port === 4000 || port === 23 || port === 13 || port === 17))) {
      await HOSTO.sleep(1200);
      sh.println(`telnet: Unable to connect to remote host: Connection refused`);
      return;
    }
    if (port === 13) { sh.println(now99()); sh.println('Connection closed by foreign host.'); return; }
    if (port === 17) { sh.println(QOTD[Math.floor(Math.random() * QOTD.length)]); sh.println('Connection closed by foreign host.'); return; }
    if (port === 23) { sh.println('Connected to mud.jacknet.jnet.'); sh.println(''); sh.println('JackNIX 1.0 (mud.jacknet.jnet)'); sh.println(''); sh.print('login: '); await DOS.core.readLine(HOSTO, {}); sh.print('Password: '); await DOS.core.readLine(HOSTO, { password: true }); sh.println(''); sh.println('Login incorrect'); sh.println(''); sh.println('(Psst: JackMUD is on port 4000. TELNET MUD.JACKNET.JNET 4000)'); A.secret('md.port23'); return; }
    sh.println(`Connected to ${host}.`);
    sh.println('Escape character is \'^]\'.');
    const cols = () => scr.cols;
    let buf = '', prompt = '', hist = [], hi = 0, done = null, shownLen = 0;
    const W = s => t.write(s);
    // the input line is always the last thing on the screen: clear it, print what arrived, put it back
    const clearLine = () => { const n = Math.floor((prompt.length + shownLen) / cols()); for (let i = 0; i < n; i++) W('\r\x1b[K\x1b[A'); W('\r\x1b[K'); };
    const redraw = () => { W('\x1b[0m'); W(promptRaw); W('\x1b[1;37m' + buf + '\x1b[0m'); shownLen = buf.length; };
    let promptRaw = '';
    const sink = {
      write: s => { clearLine(); W(wrap(dosSafe(s), cols()).replace(/\n/g, '\r\n')); redraw(); },
      prompt: p => { clearLine(); promptRaw = dosSafe(p); prompt = T.strip(promptRaw); redraw(); },
      info: s => { clearLine(); W('\x1b[1;30m' + s + '\x1b[0m\r\n'); redraw(); },
      cols, stat: () => {},
      end: why => { clearLine(); W('\x1b[0m\r\n' + why + '\r\n'); if (done) done(); },
    };
    const S = T.session(sink, 'dos');
    const oldKey = HOSTO.onkey;
    HOSTO.onkey = ev => {
      if (ev.type !== 'key') return;
      const k = ev.key;
      if (ev.ctrl && (k === ']' || k === '5')) { S.close(false, 'Connection closed.'); return false; }
      if (k === 'Enter') { const line = buf; W('\r\n'); buf = ''; shownLen = 0; promptRaw = ''; prompt = ''; if (line.trim()) { hist.push(line); if (hist.length > 30) hist.shift(); } hi = hist.length; S.send(line); return false; }
      if (k === 'Backspace') { if (buf) { clearLine(); buf = buf.slice(0, -1); redraw(); } return false; }
      if (k === 'Escape') { clearLine(); buf = ''; redraw(); return false; }
      if (k === 'ArrowUp' || k === 'ArrowDown') { if (!hist.length) return false; hi = Math.max(0, Math.min(hist.length, hi + (k === 'ArrowUp' ? -1 : 1))); clearLine(); buf = hist[hi] || ''; redraw(); return false; }
      if (ev.ch && !ev.ctrl && buf.length < 200) { clearLine(); buf += ev.ch; redraw(); return false; }
      return false;
    };
    await new Promise(res => { done = res; const iv = setInterval(() => { if (HOSTO.dead || !HOSTO.el.isConnected) { clearInterval(iv); S.close(); res(); } else if (S.ended) { clearInterval(iv); res(); } }, 500); });
    HOSTO.onkey = oldKey;
    HOSTO.brk = false; if (HOSTO.flush) HOSTO.flush();
  }

  // ================================================================ MUDdy 98
  let mudW = null;
  function muddy() {
    if (mudW && !mudW.closed) { mudW.restore(); return mudW; }
    A.secret('md.muddy');
    const body = h('div', 'md-app');
    body.innerHTML = `<div class="md-tb"><button type="button" class="md-tbb md-tconn" title="Connect to JackMUD"><span class="md-ti md-ti-conn"></span><span>Connect</span></button><button type="button" class="md-tbb md-tdisc" title="Disconnect" disabled><span class="md-ti md-ti-disc"></span><span>Disconnect</span></button><span class="md-tsep"></span><button type="button" class="md-tbb md-tcol" title="Colours"><span class="md-ti md-ti-col"></span><span>Colours</span></button><button type="button" class="md-tbb md-tfont" title="Font size"><span class="md-ti md-ti-font"></span><span>Font</span></button><span class="md-tsep"></span><button type="button" class="md-tbb md-tweb" title="JackMUD web site"><span class="md-ti md-ti-web"></span><span>Web site</span></button><span class="md-tlamp" title="Connection"><i></i><b>Offline</b></span></div>
      <div class="md-split"><div class="md-left"></div><div class="md-right"></div></div><div class="md-tabs"><button type="button" data-v="term" class="on">Terminal</button><button type="button" data-v="panel">Map &amp; Stats</button></div>`;
    const term = T.term({ skin: 'app', onLine: t => { if (W.sess) W.sess.send(t); else { term.info('(Not connected. Click Connect!)'); } }, onCols: c => { if (W.sess) W.sess.cols(c); } });
    const pan = T.panel({ skin: 'app', send: c => { if (W.sess) { term.send(c); } } });
    body.querySelector('.md-left').appendChild(term.el); body.querySelector('.md-right').appendChild(pan.el);
    const W = A.win('MUDdy 98 - JackMUD', body, { w: Math.min(900, innerWidth - 8), h: Math.min(580, innerHeight - 60), icon: MD.ICO.muddy, minW: 300, minH: 260, menubar: true,
      onClose: () => { if (W.sess) W.sess.close(); term.destroy(); mudW = null; } });
    mudW = W;
    const lamp = body.querySelector('.md-tlamp');
    const setOn = on => { body.querySelector('.md-tconn').disabled = on; body.querySelector('.md-tdisc').disabled = !on; lamp.classList.toggle('on', on); lamp.querySelector('b').textContent = on ? 'Online' : 'Offline'; term.setLive(on); if (!on) pan.off(); };
    const sink = { write: s => term.write(s), prompt: p => term.prompt(p), info: s => term.info(s), cols: () => term.cols(), stat: st => pan.stat(st), end: why => { W.sess = null; setOn(false); term.info('\n*** ' + why); } };
    const connect = () => { if (W.sess) return; term.info('Dialling mud.jacknet.jnet:4000... (MUDdy 98 v1.3)'); sfx('modem'); setOn(true); setTimeout(() => { if (!W.closed) { W.sess = T.session(sink, 'app'); term.focus(); } }, 700); };
    body.querySelector('.md-tconn').addEventListener('click', connect);
    body.querySelector('.md-tdisc').addEventListener('click', () => { if (W.sess) W.sess.close(false, 'Disconnected.'); });
    body.querySelector('.md-tweb').addEventListener('click', () => MD.go('http://' + MD.SITE + '/'));
    const thList = Object.keys(T.THEMES), szList = Object.keys(T.SIZES);
    body.querySelector('.md-tcol').addEventListener('click', () => { term.setTheme(thList[(thList.indexOf(term.opts.theme) + 1) % thList.length]); term.info('(Colours: ' + T.THEMES[term.opts.theme] + ')'); });
    body.querySelector('.md-tfont').addEventListener('click', () => term.setSize(szList[(szList.indexOf(term.opts.size) + 1) % szList.length]));
    body.querySelectorAll('.md-tabs button').forEach(b => b.addEventListener('click', () => { body.querySelectorAll('.md-tabs button').forEach(x => x.classList.toggle('on', x === b)); body.dataset.v = b.dataset.v; if (b.dataset.v === 'term') term.focus(); }));
    body.dataset.v = 'term';
    A.menubar(W, [
      ['File', [{ label: 'Connect', act: connect }, { label: 'Disconnect', act: () => W.sess && W.sess.close(false, 'Disconnected.') }, '-', { label: 'Exit', act: () => W.close() }]],
      ['View', () => [...thList.map(k => ({ label: T.THEMES[k], rad: term.opts.theme === k, act: () => term.setTheme(k) })), '-', ...szList.map(k => ({ label: T.SIZES[k] + ' point text', rad: term.opts.size === k, act: () => term.setSize(k) }))]],
      ['Help', [{ label: 'MUDdy Help', act: () => Desk.notepad('MUDDY.TXT', HELP2) }, { label: 'JackMUD Web Site', act: () => MD.go('http://' + MD.SITE + '/newbie.html') }, '-', { label: 'About MUDdy 98...', act: () => Desk.msgbox('About MUDdy 98', 'MUDdy 98 version 1.3\nThe MUD client that draws the map for you.\n\n(c) 1998 Mudlark Software. Freeware!\n\n"Muddy boots welcome."', 'info') }]],
    ]);
    setOn(false);
    term.info('Welcome to MUDdy 98!  Click Connect (top left) to play JackMUD.');
    term.info('Click the compass to walk, and click people and monsters in "Here with you".\n');
    setTimeout(connect, 600);
    return W;
  }
  const HELP2 = `MUDDY 98 HELP
=============
Connect / Disconnect   top left. MUDdy connects to JackMUD by itself when it starts.
The terminal           type commands at the bottom, press Enter. Up arrow = last command.
                       Click a WHITE CAPITAL WORD to type it.
Map & Stats            your health (HP), magic (MP) and experience (XP), a map of where
                       you've been (yellow = you, a little ! = someone to talk to),
                       a compass (lit up = you can go that way), and who's here.
                       Click someone to talk to them; click a monster to fight it.
Colours / Font         change how the terminal looks.
On a small screen, the tabs at the bottom swap between the terminal and the map.`;

  window.MDApps = { telnet, dos, muddy, wrap };
})();
