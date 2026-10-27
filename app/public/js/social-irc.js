/* social-irc: JackIRC, the JackNet IRC client. #jackattack is the site's shared chat (the same stream as the Hangout's
 * speech bubbles); every other channel is live-only over Net.relay('social.irc'). Loaded the first time JackIRC runs. */
window.SocialIRC = function (X) {
  'use strict';
  const { $, h, esc, store, pick, pad, note, got, hash, hhmm, d99, clean, isObj, int, okCol, gate, who, onlineFns, ico, txt, session, imTo, addContact, UM, setStatus, STAT, isIgnored, toggleIgnore, members, others, getOnline, sender, CHAT, IRC_ICON, Throw } = X;
  const SERVER = 'irc.jacknet.jnet', MAIN = '#jackattack', DEFAULTS = ['#jackattack', '#orks', '#starwars', '#games', '#cubes', '#help'], CH_RE = /^#[a-z0-9_-]{1,20}$/;
  const TOPIC_KEY = 'social.irctopic';
  const DEF_TOPICS = { '#jackattack': 'Welcome to #jackattack! Same chat as the Hangout. Be nice, Mom reads this. Type !help for JackServ (the channel bot)', '#orks': 'Painting minis: Gorks, Space Mariners, Elder, bits boxes and why red ones go faster', '#starwars': 'Episode I is out in the UK on 16 July!!! NO SPOILERS for people who haven\'t seen it', '#games': 'Games chat. Cheats welcome. Lies about high scores not welcome', '#cubes': "Rubrick's cubes, Blockology and other square things", '#help': 'Ask anything! Someone might know. Gubbinz definitely does not', '#grotz': 'DIS IS DA SECRET GROT CHANNEL. NO HUMIES. (u can stay)' };
  const COLS = ['#ffffff', '#000000', '#00007f', '#009300', '#ff0000', '#7f0000', '#9c009c', '#fc7f00', '#ffff00', '#00fc00', '#009393', '#00ffff', '#0000fc', '#ff00ff', '#7f7f7f', '#d2d2d2'];
  const QUITS = ['Mom needs the phone', 'Ping timeout', 'Connection reset by peer', 'Dinner time!!!', 'My sister picked up the extension', 'Leaving', 'Bedtime. School tomorrow', 'Gone to paint Gorks', 'Excess flood (sorry)', 'Read error: Connection reset by Mom'];
  const opts = Object.assign({ font: 'fixed', size: 12, scheme: 'classic', ts: true, joins: true, sound: true, log: false, nickcol: true }, store.get('jhp_irc_opts', {}));
  const presence = new Map(); // id -> Set of relay channels they're in
  const seen = new Map();     // nick (lower) -> { nick, ts, what }
  const topics = {};          // chan -> { t, by }
  let C = null;               // the running client
  const host = o => `${String(o.nick).toLowerCase().replace(/[^a-z0-9_-]/g, '')}@dial-up-${pad(hash('h' + o.id) % 99 + 1)}.jacknet.jnet`;
  const quitMsg = o => QUITS[hash('q' + o.nick + o.id) % QUITS.length];
  const me = () => Net.me.nick || 'Guest';
  const lc = s => String(s).toLowerCase();
  const byNick = n => getOnline().find(o => lc(o.nick) === lc(n));
  const saw = (nick, what) => { seen.set(lc(nick), { nick, ts: Date.now(), what }); if (seen.size > 300) seen.delete(seen.keys().next().value); };

  // ---- text: keep the IRC formatting codes (bold, colour, underline, reset), strip everything else nasty
  const ircClean = (s, max) => { const raw = String(s == null ? '' : s).replace(/[\u0000-\u0001\u0004-\u000e\u0010-\u001e\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ').slice(0, max); const plain = clean(raw.replace(/[\u0002\u0003\u000f\u001f]/g, ''), max); return plain ? raw.replace(/\s+/g, ' ').trim() : ''; };
  const strip = s => String(s).replace(/\u0003\d{0,2}(,\d{1,2})?|[\u0002\u000f\u001f]/g, '');
  function fmt(s) { // IRC codes -> escaped HTML (the visible text is re-filtered for bad words)
    s = String(s); let out = '', b = false, u = false, fg = -1, bg = -1, buf = '';
    const flush = () => { if (!buf) return; const st = []; if (b) st.push('font-weight:bold'); if (u) st.push('text-decoration:underline'); if (fg >= 0) st.push('color:' + COLS[fg]); if (bg >= 0) st.push('background:' + COLS[bg]); const t = esc(buf); out += st.length ? `<span style="${st.join(';')}">${t}</span>` : t; buf = ''; };
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '\u0002') { flush(); b = !b; }
      else if (c === '\u001f') { flush(); u = !u; }
      else if (c === '\u000f') { flush(); b = u = false; fg = bg = -1; }
      else if (c === '\u0003') { flush(); const m = /^(\d{1,2})(?:,(\d{1,2}))?/.exec(s.slice(i + 1)); if (m) { fg = +m[1] % 16; if (m[2] !== undefined) bg = +m[2] % 16; i += m[0].length; } else fg = bg = -1; }
      else buf += c;
    }
    flush(); return out;
  }
  const BADF = /\b(f+[u*]+c+k+\w*|sh[i1]te?s?|c[u*]nts?|wank\w*|tw[a@]ts?|n[i1!]gg\w*|f[a@]gg?\w*|retards?|wh[o0]res?|sluts?|bastards?|bollocks)\b/gi;
  const safeFmt = s => fmt(String(s).replace(BADF, m => '*'.repeat(m.length)));
  const toCodes = s => String(s).replace(/\^K/g, '\u0003').replace(/\^B/g, '\u0002').replace(/\^U/g, '\u001f').replace(/\^O/g, '\u000f');

  // ---- JackServ: the channel service bot (a program, not a person; it sits in a separate Services list)
  const SERV = '<b class="ir-serv">JackServ</b>';
  const servSay = (c, s) => line(c, 'bot', `-${SERV}- ${esc(s)}`);
  const BOT = {
    joke: ["Why did the Game Lad cross the road? To get to the other SIDE (it's a Game Lad joke, there's an A side and a B... never mind).", "What's green and goes 'beep beep'? An Eggbert with a cold.", "How many programmers does it take to change a light bulb? None, it's a hardware problem.", "Why do Gorks paint things red? So they go faster. That's not a joke, that's SCIENCE.", "What do you call a dinosaur with a modem? Online-osaurus. HA. (Jack wrote that one, it's rubbish)", "Knock knock. Who's there? Y2K. Y2K who? Y2K-ant you just turn it off and on again.", "What's a droid's favourite snack? Micro-chips. (Dave's one)", "My computer's got 32 MEGABYTES of RAM. Gubbinz thinks that's a kind of goat.", "Why was the ULTRA 64 cold? It left its JackOS open. (It hasn't got JackOS. That's the joke.)", "What did the Pocket Critters say to the Rubrick's cube? Nothing. Pocket Critters can only say their own name."],
    ball: ['Yes.', 'No.', 'Defo.', 'Ask your Mom.', 'Gubbinz says no.', 'Signs point to WAAAGH.', 'Reply hazy, modem crackly, try again.', "Don't count on it.", 'Without a doubt. Probably.', 'Better not tell you now. (I forgot)', 'My sources say ZAPACHU.', 'It is certain. As certain as a 56K modem connecting first time (not very).'],
    help: 'I am JackServ, the channel service bot (a program, not a person). Commands: !joke !8ball <question> !time !seen <nick> !trivia !rules !waaagh',
    rules: '1. Be nice. 2. No swearing (Mom reads the logs). 3. Never give out your real name, address or phone number. 4. No flooding.',
  };
  const TRIVIA = [['How many squares on one face of a normal Rubrick\'s cube?', '9'], ['What colour makes Gork vehicles go faster?', 'red'], ['What is 56K a speed of? (one word)', 'modem'], ['What year comes after 1999? (careful...)', '2000'], ['How many lines do you clear at once to get a BLOCKOLOGY?', '4'], ['What colour is a Game Lad screen? (one word)', 'green'], ['What does the D in DND stand for? (Do Not ...)', 'disturb'], ['Which planet do the peapodracers race on in Episode I? (starts with T)', 'tatooine'], ['How many megabytes are in a gigabyte (roughly, in 1999)?', '1024'], ['What do you do to a cartridge when it won\'t work? (one word, starts with B)', 'blow'], ['What is the port number for IRC? (on this server)', '6667'], ['What do you press to pause most games? (one word)', 'start']];
  const triv = (t = Date.now()) => { const n = Math.floor(t / 90000); return { n, q: TRIVIA[hash('trivia' + n) % TRIVIA.length] }; };
  const trivWon = new Set();
  function botLine(c, cmd, i, arg) { // the same text on every computer, so nobody can make JackServ say anything else
    if (cmd === 'joke') return 'From Gubbinz\'s joke book: ' + BOT.joke[i % BOT.joke.length];
    if (cmd === '8ball') return `${arg ? arg + ': ' : ''}${BOT.ball[i % BOT.ball.length]}`;
    if (cmd === 'waaagh') return 'WAAAAAAAAAGH!!! (that woke up the whole channel. And Mom.)';
    if (cmd === 'trivia') { const t = triv(); return `TRIVIA: ${t.q[0]} (first right answer in the channel wins)`; }
    return null;
  }
  function botCmd(ch, text, local) { // someone (maybe you) typed a !command
    const m = /^!(\w+)\s*(.*)$/.exec(strip(text)); if (!m) return;
    const cmd = lc(m[1]), arg = m[2].trim().slice(0, 60);
    const say = s => servSay(ch, s);
    if (local) got('ircbot');
    if (cmd === 'help') { if (local) say(BOT.help); return; }
    if (cmd === 'rules') { if (local) say(BOT.rules); return; }
    if (cmd === 'time') { if (local) { const d = new Date(), t = Desk.today99(); say(`It is ${d.getHours()}:${pad(d.getMinutes())} on ${t.d}/${t.m}/1999. Still 1999. Always 1999.`); } return; }
    if (cmd === 'seen') { if (!local) return; const n = arg.split(' ')[0]; if (!n) return say('!seen who? Type a name, like: !seen Squirturtle99'); if (lc(n) === lc(me())) return say("That's you. You're right here."); const o = byNick(n); if (o) return say(`${o.nick} is online right now, reading ${X.whereOf(o)}.`); const s = seen.get(lc(n)); return say(s ? `I last saw ${s.nick} ${X.ago(s.ts)}, ${s.what}.` : `I haven't seen ${n} since this computer was switched on.`); }
    if (['joke', '8ball', 'waaagh', 'trivia'].includes(cmd)) {
      const i = hash(cmd + arg + Math.floor(Date.now() / 1000)) % 97;
      if (cmd === '8ball') { if (!arg) { if (local) say('Ask a yes/no question. Like: !8ball will I get a pony'); return; } if (local) got('irc8ball'); }
      if (local) {
        if (ch.name === MAIN) { line(ch, 'notice', `-${SERV}- ${esc(botLine(ch, cmd, i, arg))} <i>(only you can see this)</i>`); return; } // in the shared chat the bot answers privately
        Net.relay(0, 'social.irc', { k: 'b', c: ch.name, n: cmd, i, a: cmd === '8ball' ? '' : '' });
      }
      say(botLine(ch, cmd, i, cmd === '8ball' && local ? arg : ''));
    }
  }
  function trivCheck(ch, nick, text) {
    const t = triv(); if (trivWon.has(t.n)) return;
    if (lc(strip(text)).trim() === t.q[1]) { trivWon.add(t.n); servSay(ch, `CORRECT, ${nick}! The answer was ${t.q[1]}. Have a Rupee.`); if (lc(nick) === lc(me())) got('irctrivia'); }
  }

  // ================================================================ the client window
  const TB = {
    connect: '<path d="M2 12l4-4 2 2 6-6" stroke="#e10600" stroke-width="2" fill="none"/><path d="M10 4h4v4" stroke="#e10600" stroke-width="2" fill="none"/>',
    opts: '<rect x="2" y="3" width="12" height="10" fill="#fff" stroke="#000"/><path d="M4 6h8M4 8h8M4 10h5" stroke="#00007f"/>',
    list: '<rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#000"/><text x="8" y="11.5" font-size="10" font-weight="bold" text-anchor="middle" fill="#009300">#</text>',
    join: '<rect x="2" y="2" width="12" height="12" fill="#ffffc0" stroke="#000"/><path d="M8 4v8M4 8h8" stroke="#009300" stroke-width="2"/>',
    whois: '<circle cx="7" cy="6" r="3" fill="#f2c79a" stroke="#000"/><path d="M2 14q5-7 10 0z" fill="#2a7ad8" stroke="#000"/><text x="13" y="7" font-size="7" font-weight="bold" fill="#e10600">?</text>',
    tile: '<rect x="1.5" y="1.5" width="6" height="6" fill="#fff" stroke="#000"/><rect x="8.5" y="1.5" width="6" height="6" fill="#fff" stroke="#000"/><rect x="1.5" y="8.5" width="6" height="6" fill="#fff" stroke="#000"/><rect x="8.5" y="8.5" width="6" height="6" fill="#fff" stroke="#000"/>',
    cascade: '<rect x="1.5" y="1.5" width="9" height="7" fill="#fff" stroke="#000"/><rect x="4.5" y="4.5" width="9" height="7" fill="#fff" stroke="#000"/><rect x="4.5" y="4.5" width="9" height="2" fill="#000080"/>',
    uhoh: '', help: '<circle cx="8" cy="8" r="6" fill="#ffd400" stroke="#000"/><text x="8" y="11.5" font-size="10" font-weight="bold" text-anchor="middle">?</text>',
  };
  const svg16 = s => `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${s}</svg>`;
  const ICO = { status: svg16('<rect x="1" y="2" width="14" height="10" fill="#c0c0c0" stroke="#000"/><rect x="3" y="4" width="10" height="6" fill="#008080"/><rect x="5" y="12" width="6" height="2" fill="#808080"/>'), chan: svg16('<rect x="1" y="1" width="14" height="14" fill="#fff" stroke="#000"/><text x="8" y="12" font-size="11" font-weight="bold" text-anchor="middle" fill="#009300">#</text>'), list: svg16(TB.list) };

  function open(o) {
    o = o || {};
    if (C && !C.w.closed) { C.w.restore(); if (o.autojoin && C.connected) join(MAIN); return C.w; }
    const b = h('div', 'ir');
    b.innerHTML = `<div class="ir-tools" role="toolbar">${[['connect', 'Connect / Disconnect'], ['opts', 'Options'], '-', ['list', 'Channels List'], ['join', 'Join a Channel'], ['whois', 'Whois'], '-', ['tile', 'Tile JackOS'], ['cascade', 'Cascade JackOS'], '-', ['uhoh', 'Uh-Oh! Messenger'], ['help', 'Help']].map(t => t === '-' ? '<span class="ir-sep"></span>' : `<button type="button" data-t="${t[0]}" title="${t[1]}" aria-label="${t[1]}">${t[0] === 'uhoh' ? X.LOGO16.replace('<svg', '<svg width="16" height="16"') : svg16(TB[t[0]])}</button>`).join('')}</div>
      <div class="ir-switch" role="tablist" aria-label="JackOS"></div><div class="ir-area"></div>`;
    const w = Apps.win('JackIRC', b, { w: 800, h: 560, icon: IRC_ICON, menubar: true, minW: 300, minH: 300, onClose: () => { if (C && C.connected) quit(C.quitMsg || 'JackIRC: the chat room wot moved', true); C = null; } });
    w.body.style.padding = '0';
    C = { w, b, area: b.querySelector('.ir-area'), sw: b.querySelector('.ir-switch'), wins: new Map(), active: null, connected: false, z: 10, tiled: false };
    styleOpts();
    Apps.menubar(w, [
      ['File', () => [{ label: C.connected ? 'Disconnect' : 'Connect...', act: () => C.connected ? quit('Disconnected') : connectDialog() }, '-', { label: 'Options...', act: optionsDialog }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Commands', () => [{ label: 'Join Channel...', act: () => ask('Join Channel', 'Channel name (like #starwars):', '#', v => cmd('/join ' + v)) }, { label: 'List Channels', act: () => cmd('/list') }, { label: 'Whois...', act: () => ask('Whois', 'Nickname:', '', v => cmd('/whois ' + v)) }, '-', { label: 'Set Away...', act: () => ask('Away', 'Away message (blank to come back):', '', v => cmd('/away ' + v)) }, { label: 'Change Nick...', act: () => cmd('/nick') }, '-', { label: 'Message of the Day', act: () => cmd('/motd') }]],
      ['Window', () => [{ label: 'Tile', act: tile }, { label: 'Cascade', act: cascade }, '-', ...[...C.wins.values()].map(c => ({ label: c.name, chk: c === C.active, act: () => activate(c) }))]],
      ['Help', [{ label: 'JackIRC Help', act: () => txt('JACKIRC.TXT', HELP) }, { label: 'JackIRC FAQ (web page)', act: () => { $('browser').classList.remove('min'); IE.navigate('jackirc'); } }, '-', { label: 'About JackIRC...', act: () => Desk.msgbox('About JackIRC', 'JackIRC 1.99\nThe JackNet IRC client.\n\nWritten by Jack\'s cousin over half-term. Logo by Jack. MOTD by Gubbinz (sorry).\n\nThis program is shareware. If you use it for more than 30 days, you owe Jack a biscuit.', 'info') }]],
    ]);
    b.querySelector('.ir-tools').addEventListener('click', ev => {
      const t = ev.target.closest('[data-t]'); if (!t) return;
      const a = t.dataset.t;
      if (a === 'connect') { if (C.connected) quit('Disconnected'); else connectDialog(); }
      else if (a === 'opts') optionsDialog(); else if (a === 'list') cmd('/list'); else if (a === 'join') ask('Join Channel', 'Channel name (like #starwars):', '#', v => cmd('/join ' + v));
      else if (a === 'whois') ask('Whois', 'Nickname:', '', v => cmd('/whois ' + v)); else if (a === 'tile') tile(); else if (a === 'cascade') cascade();
      else if (a === 'uhoh') Apps.open('social.uhoh'); else if (a === 'help') txt('JACKIRC.TXT', HELP);
    });
    const st = child('Status', 'status');
    line(st, 'info', `*** JackIRC 1.99 for JackOS 98. Type <b>/help</b> for a list of commands.`);
    window.addEventListener('resize', fit);
    if (o.autojoin) connect(); else connectDialog();
    return w;
  }
  function styleOpts() { if (!C) return; C.b.className = `ir ir-f-${opts.font} ir-s-${opts.scheme}`; C.b.style.setProperty('--irfs', opts.size + 'px'); }
  const narrow = () => C && C.area.clientWidth < 520;
  function fit() { if (!C || C.w.closed) return; C.wins.forEach(c => c.el.classList.toggle('max', narrow() || c.max)); }

  // ---- MDI child windows
  function child(name, kind) {
    const key = lc(name); if (C.wins.has(key)) return C.wins.get(key);
    const el = h('div', 'ir-child max ' + kind);
    el.innerHTML = `<div class="ir-ctb"><span class="ir-cico">${kind === 'status' ? ICO.status : kind === 'list' ? ICO.list : ICO.chan}</span><span class="ir-ct"></span><span class="ir-cctl"><button type="button" data-c="max" aria-label="Maximise">&#9633;</button><button type="button" data-c="close" aria-label="Close">x</button></span></div>
      ${kind === 'chan' ? '<div class="ir-topic"><span class="ir-ttext"></span><button type="button" class="ir-nbtn" aria-label="Show nick list">Nicks</button></div>' : ''}
      <div class="ir-cbody"><div class="ir-log" role="log" aria-live="polite"></div>${kind === 'chan' ? '<ul class="ir-nicks" aria-label="Nick list"></ul>' : ''}</div>
      ${kind === 'list' ? '' : `<form class="ir-in" autocomplete="off"><input type="text" maxlength="400" aria-label="Type a message or /command" spellcheck="false"><div class="ir-pal" hidden>${COLS.map((c, i) => `<button type="button" data-k="${i}" style="background:${c}" title="Colour ${i}" aria-label="Colour ${i}"></button>`).join('')}</div></form>`}`;
    C.area.appendChild(el);
    const c = { name, key, kind, el, log: el.querySelector('.ir-log'), nicks: el.querySelector('.ir-nicks'), input: el.querySelector('input'), max: true, lines: [] };
    const n = C.wins.size;
    Object.assign(el.style, { left: 20 + n * 22 + 'px', top: 14 + n * 22 + 'px', width: '62%', height: '62%' });
    c.btn = h('button', 'ir-sbtn'); c.btn.type = 'button'; c.btn.setAttribute('role', 'tab'); c.btn.innerHTML = `${kind === 'status' ? ICO.status : kind === 'list' ? ICO.list : ICO.chan}<span></span>`; c.btn.lastChild.textContent = name;
    C.sw.appendChild(c.btn);
    c.btn.addEventListener('click', () => activate(c));
    C.wins.set(key, c);
    el.addEventListener('pointerdown', () => { if (C.active !== c) activate(c, true); });
    el.querySelector('[data-c=max]').addEventListener('click', () => { c.max = !c.max; fit(); });
    el.querySelector('[data-c=close]').addEventListener('click', () => { if (kind === 'chan') cmd('/part ' + name, c); else if (kind === 'list') closeChild(c); else Desk.msgbox('JackIRC', "You can't close the Status window. It's load-bearing.", 'info'); });
    // drag a child window around inside the client (when it's not maximised)
    const tb = el.querySelector('.ir-ctb'); let drag = null;
    tb.addEventListener('pointerdown', ev => { if (ev.target.closest('button') || el.classList.contains('max')) return; drag = { dx: ev.clientX - el.offsetLeft, dy: ev.clientY - el.offsetTop }; tb.setPointerCapture(ev.pointerId); });
    tb.addEventListener('pointermove', ev => { if (!drag) return; el.style.left = Math.max(-40, Math.min(C.area.clientWidth - 60, ev.clientX - drag.dx)) + 'px'; el.style.top = Math.max(0, Math.min(C.area.clientHeight - 24, ev.clientY - drag.dy)) + 'px'; });
    tb.addEventListener('pointerup', () => { drag = null; });
    tb.addEventListener('dblclick', ev => { if (!ev.target.closest('button')) { c.max = !c.max; fit(); } });
    if (c.input) {
      const f = el.querySelector('form'), pal = el.querySelector('.ir-pal'), hist = []; let hi = 0;
      f.addEventListener('submit', ev => { ev.preventDefault(); const v = c.input.value; if (!v.trim()) return; hist.push(v); if (hist.length > 30) hist.shift(); hi = hist.length; c.input.value = ''; pal.hidden = true; cmd(v, c); });
      c.input.addEventListener('keydown', ev => {
        const k = ev.key.toLowerCase();
        if (ev.ctrlKey && 'kbuo'.includes(k) && k.length === 1) { ev.preventDefault(); insert(c.input, '^' + k.toUpperCase()); if (k === 'k') pal.hidden = false; }
        else if (ev.key === 'ArrowUp' && hist.length) { ev.preventDefault(); hi = Math.max(0, hi - 1); c.input.value = hist[hi]; }
        else if (ev.key === 'ArrowDown' && hist.length) { ev.preventDefault(); hi = Math.min(hist.length, hi + 1); c.input.value = hist[hi] || ''; }
        else if (ev.key === 'Tab' && c.kind === 'chan') { ev.preventDefault(); const m = /(\S+)$/.exec(c.input.value); if (!m) return; const hit = nicksOf(c).find(n => lc(n.nick).startsWith(lc(m[1]))); if (hit) c.input.value = c.input.value.slice(0, -m[1].length) + hit.nick + (c.input.value.length === m[1].length ? ': ' : ' '); }
        else if (ev.key === 'Escape') pal.hidden = true;
      });
      pal.addEventListener('click', ev => { const t = ev.target.closest('[data-k]'); if (!t) return; insert(c.input, (c.input.value.endsWith('^K') ? '' : '^K') + t.dataset.k + ' '); pal.hidden = true; c.input.focus(); });
    }
    if (c.nicks) {
      let last = 0;
      c.nicks.addEventListener('click', ev => { const li = ev.target.closest('li'); if (!li) return; c.nicks.querySelectorAll('li.sel').forEach(x => x.classList.remove('sel')); li.classList.add('sel'); const now = Date.now(); if (X.touch() || now - last < 450) { last = 0; nickMenu(li.dataset.n, ev.clientX, ev.clientY); } else last = now; });
      c.nicks.addEventListener('dblclick', ev => { const li = ev.target.closest('li'); if (li) query(li.dataset.n); });
      c.nicks.addEventListener('contextmenu', ev => { const li = ev.target.closest('li'); if (!li) return; ev.preventDefault(); nickMenu(li.dataset.n, ev.clientX, ev.clientY); });
      el.querySelector('.ir-nbtn').addEventListener('click', () => el.classList.toggle('shownicks'));
    }
    fit(); activate(c);
    return c;
  }
  const insert = (inp, s) => { const a = inp.selectionStart, b2 = inp.selectionEnd; inp.value = inp.value.slice(0, a) + s + inp.value.slice(b2); inp.selectionStart = inp.selectionEnd = a + s.length; };
  function activate(c, keepFocus) {
    if (!C || !c) return; C.active = c; c.el.style.zIndex = ++C.z; c.el.hidden = false;
    C.wins.forEach(x => { x.btn.classList.toggle('on', x === c); x.btn.setAttribute('aria-selected', x === c); x.el.classList.toggle('inactive', x !== c); });
    c.btn.classList.remove('msg', 'evt', 'hl');
    title(c);
    if (c.input && !keepFocus && !X.touch()) setTimeout(() => c.input.focus(), 30);
    c.log.scrollTop = c.log.scrollHeight;
  }
  function closeChild(c) { c.el.remove(); c.btn.remove(); C.wins.delete(c.key); if (C.active === c) activate(C.wins.get('status')); }
  function tile() { const list = [...C.wins.values()]; const n = list.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols); list.forEach((c, i) => { c.max = false; Object.assign(c.el.style, { left: (i % cols) / cols * 100 + '%', top: Math.floor(i / cols) / rows * 100 + '%', width: 100 / cols + '%', height: 100 / rows + '%' }); }); fit(); }
  function cascade() { [...C.wins.values()].forEach((c, i) => { c.max = false; Object.assign(c.el.style, { left: 10 + i * 24 + 'px', top: 8 + i * 24 + 'px', width: '64%', height: '64%' }); c.el.style.zIndex = ++C.z; }); fit(); if (C.active) activate(C.active); }
  function title(c) {
    const t = c.kind === 'chan' ? `${c.name} [${nicksOf(c).length}] [+nt]: ${strip((topics[c.key] || {}).t || DEF_TOPICS[c.key] || '')}` : c.kind === 'status' ? `Status: ${me()} on ${SERVER} (6667)${C.connected ? '' : ' [not connected]'}` : 'Channels List';
    c.el.querySelector('.ir-ct').textContent = t;
    if (c.kind === 'chan') { const tp = (topics[c.key] || {}).t || DEF_TOPICS[c.key] || '(no topic set)'; c.el.querySelector('.ir-ttext').innerHTML = safeFmt(tp); c.el.querySelector('.ir-ttext').title = strip(tp); }
    if (c === C.active) C.w.setTitle(`JackIRC - [${c.kind === 'chan' ? c.name : c.kind === 'status' ? 'Status: ' + me() : 'Channels List'}]`);
  }
  const CLS = { msg: '', me: 'ir-act', join: 'ir-join', part: 'ir-join', quit: 'ir-quit', topic: 'ir-join', notice: 'ir-notice', info: 'ir-info', err: 'ir-err', bot: '', own: '', hl: 'ir-hl', motd: 'ir-motd' };
  function line(c, kind, html) {
    if (!c || !C || !C.wins.has(c.key)) return;
    if ((kind === 'join' || kind === 'part' || kind === 'quit') && !opts.joins) return;
    const d = h('div', 'ir-l ' + (CLS[kind] || ''));
    d.innerHTML = (opts.ts ? `<span class="ir-ts">[${hhmm()}]</span> ` : '') + html;
    const atBottom = c.log.scrollHeight - c.log.scrollTop - c.log.clientHeight < 30;
    c.log.appendChild(d); while (c.log.children.length > 300) c.log.firstChild.remove();
    if (atBottom) c.log.scrollTop = c.log.scrollHeight;
    if (c !== C.active) c.btn.classList.add(kind === 'hl' ? 'hl' : (kind === 'msg' || kind === 'me' || kind === 'bot') ? 'msg' : 'evt');
    if (opts.log && c.kind !== 'list') logFile(c, d.textContent);
  }
  const logs = {};
  function logFile(c, text) {
    let n = logs[c.key];
    if (!n) { n = logs[c.key] = Apps.fs.add('C:/Program Files/JackIRC/logs', { name: c.name.replace('#', '') + '.log', type: 'txt', date: d99(), size: '1 KB', text: `Session Start: ${d99()} ${hhmm()}\nSession Ident: ${c.name}\n` }); got('irclog'); }
    n.text = (n.text + text + '\n').split('\n').slice(-300).join('\n'); n.size = Math.max(1, Math.ceil(n.text.length / 1024)) + ' KB';
  }
  const nickHTML = (n, col, op) => `<b class="ir-nk"${opts.nickcol && col ? ` style="color:${okCol(col)}"` : ''}>${op ? '@' : ''}${esc(n)}</b>`;
  function say(c, o, text, isMe, own) { // a chat line from someone
    if (o && isIgnored(o)) return;
    const hl = !own && new RegExp('\\b' + me().replace(/[^\w-]/g, '') + '\\b', 'i').test(strip(text));
    const body = safeFmt(text);
    line(c, hl ? 'hl' : isMe ? 'me' : 'msg', isMe ? `* ${esc(o.nick)} ${body}` : `&lt;${nickHTML(o.nick, o.col, false)}&gt; ${body}`);
    saw(o.nick, `saying stuff in ${c.name}`);
    if (!own && opts.sound && (hl || !isTop())) { note(hl ? 1047 : 880, 0.06, 'square'); if (hl) { note(1319, 0.08, 'square', 90); got('irchl'); } }
  }
  const isTop = () => C && !C.w.closed && C.w.el.style.display !== 'none' && +C.w.el.style.zIndex === (window.JZ || 0);

  // ---- who's in a channel
  function nicksOf(c) {
    const out = [];
    if (c.key === MAIN) getOnline().forEach(o => out.push({ nick: o.nick, voice: !!o.member, col: o.col, id: o.id }));
    else { out.push({ nick: me(), voice: !!Net.me.member, col: Net.me.col, id: Net.me.id }); presence.forEach((set, id) => { const o = who(id); if (o && set.has(c.key)) out.push({ nick: o.nick, voice: !!o.member, col: o.col, id }); }); }
    return out.sort((a, b) => (!!b.op - !!a.op) || (!!b.voice - !!a.voice) || a.nick.localeCompare(b.nick));
  }
  function renderNicks(c) {
    if (!c || !c.nicks) return;
    const list = nicksOf(c);
    c.nicks.innerHTML = list.map(n => `<li data-n="${esc(n.nick)}" class="${n.voice ? 'vo' : ''}${n.id === Net.me.id ? ' me' : ''}" title="${n.voice ? 'JackNet member' : 'Guest'}">${n.voice ? '+' : ''}${esc(n.nick)}</li>`).join('') + '<li class="ir-svh" aria-hidden="true">Services</li><li data-n="JackServ" class="ir-svc" title="Channel service bot. A program, not a person.">JackServ <small>[bot]</small></li>';
    title(c);
  }
  const renderAll = () => { if (C) C.wins.forEach(c => { if (c.kind === 'chan') renderNicks(c); else if (c.kind === 'status') title(c); }); };
  const isServ = n => lc(n) === 'jackserv';
  function nickMenu(n, x, y) {
    if (isServ(n)) return IE.menu([{ label: 'Whois JackServ', act: () => cmd('/whois JackServ') }, { label: 'JackServ commands (!help)', act: () => C.active && servSay(C.active, BOT.help) }], x, y);
    const o = byNick(n), self = o && o.id === Net.me.id;
    IE.menu([
      { label: 'Whois', act: () => cmd('/whois ' + n) },
      { label: 'Uh-Oh! Message', dis: !o || self, act: () => query(n) },
      { label: 'Add to Uh-Oh! Contacts', dis: !o || self || !o.member, act: () => addContact(o.nick) },
      { label: 'Ping', act: () => cmd('/ping ' + n) },
      '-',
      { label: 'Nudge (Uh-Oh!)', dis: !o || self, act: () => X.nudge(session(o)) },
      { label: 'Throw a Snowball', dis: !o || self, act: () => Throw.send(o, 'snow') },
      { label: 'JackNet Profile', dis: !(o && o.member), act: () => { $('browser').classList.remove('min'); if (window.Community) Community.openProfile(n); } },
      '-',
      { label: o && isIgnored(o) ? 'Unignore' : 'Ignore', dis: !o || self, act: () => toggleIgnore(n) },
    ], x, y);
  }
  function query(n) {
    if (isServ(n)) return err('JackServ is a service bot, not a person. It only answers !commands in channels. Try !help');
    const o = byNick(n);
    if (!o) return err(`${n}: No such nick/channel`);
    if (o.id === Net.me.id) return err("You can't query yourself. (Well you can, but it's a bit sad.)");
    session(o);
  }

  // ---- connecting
  function connectDialog() {
    const f = h('form', 'ir-conn');
    f.innerHTML = `<div class="ir-crow">${IRC_ICON.replace('<svg', '<svg width="32" height="32"')}<div><b>Connect to JackNet IRC</b><div class="small">Chat with everyone on JackNet. #jackattack is the main room.</div></div></div>
      <fieldset class="group"><legend>IRC Server</legend><div class="ir-fr"><label>Server:</label><select aria-label="Server"><option>JackNet: ${SERVER}</option><option disabled>EFnat: (Mom says no)</option><option disabled>Underbelly: (the cable doesn't reach)</option></select></div><div class="ir-fr"><label>Port:</label><input type="text" value="6667" readonly size="5" aria-label="Port"></div></fieldset>
      <fieldset class="group"><legend>Your details</legend><div class="ir-fr"><label>Nickname:</label><input type="text" class="ir-nick" maxlength="16" aria-label="Nickname"></div><div class="ir-fr"><label>Full Name:</label><input type="text" maxlength="30" value="A JackNet person" aria-label="Full name"></div><div class="ir-fr"><label>E-mail:</label><input type="text" maxlength="30" value="(Mom says no)" aria-label="E-mail"></div>
      <label class="small"><input type="checkbox" class="ir-aj" checked> Join #jackattack when connected</label></fieldset>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="submit"><b>Connect!</b></button><button class="btn" type="button">Cancel</button></div>`;
    const w = Apps.win('JackIRC Setup', f, { w: 360, icon: IRC_ICON, noResize: true, noMax: true, escClose: true });
    const nk = f.querySelector('.ir-nick'); nk.value = me();
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const want = nk.value.trim();
      w.close();
      if (want && lc(want) !== lc(me())) { setTimeout(() => nickChange(want), 300); }
      connect(!f.querySelector('.ir-aj').checked);
    });
  }
  function connect(noJoin) {
    if (!C || C.connected || C.connecting) return;
    C.connecting = true;
    const st = C.wins.get('status'); activate(st);
    const o = { nick: me(), id: Net.me.id }, hst = host(o).split('@')[1];
    const n = getOnline().length;
    const steps = [
      [300, 'info', `*** Connecting to ${SERVER} (6667)`],
      [700, 'info', '*** Looking up your hostname...'],
      [900, 'info', `*** Found your hostname: ${hst}`],
      [500, 'info', '*** Checking Ident'],
      [900, 'info', '*** Got Ident response (it said "who wants to know?")'],
      [400, 'notice', `-${SERVER}- *** Your host is ${SERVER}, running version JackIRCd-1.9.99`],
      [200, 'info', `Welcome to the JackNet IRC Network ${esc(me())}!${esc(host(o))}`],
      [200, 'info', `There are ${n} user${n === 1 ? '' : 's'} and 1 service (JackServ) on 1 server(s). The server is under Jack's desk.`],
      [200, 'info', `${DEFAULTS.length} channels formed. Several more nobody admits to.`],
    ];
    let t = 0;
    steps.forEach(([d, k, s]) => { t += d; setTimeout(() => { if (C) line(st, k, k === 'notice' ? esc(s) : s.startsWith('***') ? esc(s) : s); }, t); });
    setTimeout(() => {
      if (!C) return; motd(st);
      C.connected = true; C.connecting = false; got('ircconnect'); title(st);
      Net.relay(0, 'social.irc', { k: 'hi' }); // who's in what? (everyone running JackIRC answers)
      if (!noJoin) setTimeout(() => join(MAIN), 400);
    }, t + 300);
  }
  const MOTD = [
    `- ${SERVER} Message of the Day -`,
    '- ',
    '-   HELLO! WELCOME TO JACKNET IRC.  I AM THE MOTD.  GUBBINZ WROTE ME.',
    '- ',
    '-   RULES (Mom made me put these in):',
    '-    1. be nice or i unplug the modem',
    '-    2. no swearing. Mom reads the logs. she reads EVERYTHING',
    '-    3. no real names, no addresses, no phone numbers. we are anonymous',
    '-    4. dont flood. the modem only goes so fast (56K. on a GOOD day)',
    '- ',
    '-   CHANNELS:',
    '-    #jackattack  the main chat. same as the Hangout on the website',
    '-    #gorks        painting  |  #starwars   EPISODE ONE IS OUT 16 JULY',
    '-    #games       cheats  |  #cubes      square things  |  #help   lol',
    '- ',
    '-   Type !help in any channel and JackServ (the channel bot) will help.',
    '-   Y2K NOTICE: this server has been tested for the millennium bug.',
    '-   (Jack turned the clock to 31/12/99 23:59 and watched. Nothing happened.',
    '-    Then his Mom said get off the computer.)',
    '- ',
    '-   P.S. there is NO secret channel. definitely not called #grotz.',
    '- ',
    'End of /MOTD command.',
  ];
  function motd(c) { MOTD.forEach(s => line(c, 'motd', esc(s))); }

  // ---- channels
  function join(name, quiet) {
    name = lc(name).trim(); if (!name.startsWith('#')) name = '#' + name;
    if (!CH_RE.test(name)) return err(`${name}: Illegal channel name. Use letters, numbers, - and _ (up to 20).`);
    if (!C.connected) return err('Not connected to a server. Press the red Connect button first!');
    let c = C.wins.get(name);
    if (c) { activate(c); return c; }
    if (C.wins.size >= 12) return err('Too many jackos open. Close a channel first (your 32MB of RAM is crying).');
    c = child(name, 'chan');
    line(c, 'join', `*** Now talking in ${esc(name)}`);
    const tp = (topics[name] || {}).t || DEF_TOPICS[name];
    if (tp) line(c, 'topic', `*** Topic is '${safeFmt(tp)}'`);
    if (name === MAIN) {
      const recent = CHAT.slice(-15);
      if (recent.length) { line(c, 'info', '*** Replaying the last few lines (JackNet keeps a little bit of #jackattack for the Hangout)'); recent.forEach(m => chatIn(m, c, true)); line(c, 'info', '*** End of replay'); }
    } else {
      Net.relay(0, 'social.irc', { k: 'j', c: name });
      if (!Net.me.member) line(c, 'info', `*** You're a guest, so you can listen in here. Talking in ${esc(name)} is for JackNet members (#jackattack is open to everybody).`);
      if (!DEFAULTS.includes(name) && name !== '#grotz') got('ircnew');
      got('ircjoin');
      if (name === '#grotz') got('ircgrotz');
    }
    servSay(c, name === '#grotz' ? 'There is no channel here. You did not see anything. Move along.' : `Welcome to ${name}, ${me()}! I'm JackServ, the channel service bot. Type !help for commands.`);
    renderNicks(c);
    if (!topics[name]) Net.kv.get([TOPIC_KEY]).then(v => { const m = v[TOPIC_KEY]; if (isObj(m)) for (const [f, t] of Object.entries(m)) if (/^[a-z0-9_-]{1,20}$/.test(f) && typeof t === 'string') { const i = t.indexOf('|'); topics['#' + f] = { t: ircClean(i > 0 ? t.slice(i + 1) : t, 100), by: i > 0 ? clean(t.slice(0, i), 20) : '' }; } C && C.wins.forEach(title); });
    return c;
  }
  function part(c, msg) {
    if (!c || c.kind !== 'chan') return;
    if (c.key !== MAIN) Net.relay(0, 'social.irc', { k: 'p', c: c.key, m: ircClean(msg, 80) });
    closeChild(c);
    line(C.wins.get('status'), 'part', `*** You have left ${esc(c.name)}`);
  }
  function quit(msg, closing) {
    if (!C) return;
    if (C.connected) Net.relay(0, 'social.irc', { k: 'q', m: ircClean(msg, 80) });
    C.connected = false;
    [...C.wins.values()].filter(c => c.kind === 'chan').forEach(c => closeChild(c));
    if (!closing) { line(C.wins.get('status'), 'quit', `*** Disconnected (${esc(msg || 'Quit')})`); title(C.wins.get('status')); }
  }
  const err = s => C && line(C.active || C.wins.get('status'), 'err', '*** ' + esc(s));
  const info = (c, s) => line(c || C.active, 'info', s);
  const outGate = gate(5, 8000), inGate = gate(8, 10000), mainGate = gate(3, 6000);

  // ---- the command line
  function cmd(raw, c) {
    if (!C) return;
    c = c || C.active;
    let text = toCodes(String(raw).trim());
    if (!text) return;
    if (!text.startsWith('/') || text.startsWith('//')) { if (text.startsWith('//')) text = text.slice(1); return sendTo(c, text, false); }
    const m = /^\/(\S+)\s*(.*)$/.exec(text), k = lc(m[1]), rest = m[2].trim(), arg1 = rest.split(/\s+/)[0] || '';
    const need = () => { if (!C.connected) { err('Not connected to a server. Press the red Connect button!'); return false; } return true; };
    switch (k) {
      case 'me': case 'action': if (rest) { sendTo(c, rest, true); got('ircme'); } return;
      case 'join': case 'j': if (!need()) return; rest.split(/[\s,]+/).filter(Boolean).slice(0, 3).forEach(n => join(n)); return;
      case 'part': case 'leave': { const target = arg1.startsWith('#') ? C.wins.get(lc(arg1)) : c; if (!target || target.kind !== 'chan') return err('You are not on that channel.'); part(target, arg1.startsWith('#') ? rest.slice(arg1.length).trim() : rest); return; }
      case 'quit': case 'exit': case 'bye': case 'signoff': { const msg = rest || 'Leaving'; quit(msg); got('ircquit'); C.quitMsg = msg; if (k !== 'quit' || rest) setTimeout(() => C && C.w.close(), 900); return; }
      case 'clear': case 'cls': c.log.innerHTML = ''; return;
      case 'list': if (!need()) return; listWin(); got('irclist'); return;
      case 'topic': {
        const target = arg1.startsWith('#') ? C.wins.get(lc(arg1)) : c, tx = arg1.startsWith('#') ? rest.slice(arg1.length).trim() : rest;
        if (!target || target.kind !== 'chan') return err('Not on a channel.');
        if (!tx) return info(target, `*** Topic for ${esc(target.name)} is '${safeFmt((topics[target.key] || {}).t || DEF_TOPICS[target.key] || '(none)')}'`);
        const t2 = ircClean(tx, 100); if (!t2) return;
        if (!Net.me.member) return window.Guest ? Guest.need('Setting a channel topic', () => cmd(`/topic ${target.name} ${tx}`, target)) : err('Only JackNet members can set topics.');
        if (!Net.kv.put(TOPIC_KEY, target.key.slice(1), (me() + '|' + t2).slice(0, 120))) return err('Not connected.');
        got('irctopic'); return;
      }
      case 'whois': case 'wi': case 'wii': if (!arg1) return err('Usage: /whois nick'); whois(arg1, c); return;
      case 'msg': case 'privmsg': case 'm': { const tx = rest.slice(arg1.length).trim(); if (!arg1 || !tx) return err('Usage: /msg nick message'); if (arg1.startsWith('#')) { const ch = C.wins.get(lc(arg1)); return ch ? sendTo(ch, tx, false) : err('You are not on ' + arg1); } if (isServ(arg1)) return err('JackServ is a service bot, not a person. Talk to it with !commands in a channel.'); const o = byNick(arg1); if (!o) return err(`${arg1}: No such nick`); if (o.id === Net.me.id) return err('Talking to yourself is the first sign of madness.'); imTo(o, strip(tx)); info(c, `-&gt; *${esc(o.nick)}* ${safeFmt(tx)} <i>(sent with Uh-Oh!)</i>`); return; }
      case 'query': case 'q': if (!arg1) return err('Usage: /query nick'); query(arg1); return;
      case 'nick': nickChange(arg1); return;
      case 'away': if (rest) { UM.away.away = clean(rest, 120); setStatus('away'); info(c, `*** You have been marked as being away (${esc(clean(rest, 120))})`); } else { setStatus('online'); info(c, '*** You are no longer marked as being away'); } return;
      case 'back': setStatus('online'); info(c, '*** You are no longer marked as being away'); return;
      case 'names': if (c.kind !== 'chan') return err('Not on a channel.'); info(c, `*** Names in ${esc(c.name)}: ${nicksOf(c).map(n => esc((n.voice ? '+' : '') + n.nick)).join(' ')} (plus JackServ [bot])`); return;
      case 'motd': motd(c); got('ircmotd'); return;
      case 'ping': case 'ctcp': { if (!arg1) return err('Usage: /ping nick'); const o = byNick(arg1); if (!o && !isServ(arg1)) return err(`${arg1}: No such nick`); info(c, `*** [${esc(arg1)} PING]`); setTimeout(() => info(c, `*** [${esc(arg1)} PING reply]: ${300 + hash(arg1 + Date.now()) % 3700}ms (it's dial-up, give it a chance)`), 1200); got('ircping'); return; }
      case 'version': info(c, '*** JackIRC 1.99 for JackOS 98. Made of 100% recycled modem noise.'); return;
      case 'time': info(c, `*** ${SERVER}: ${new Date().toTimeString().slice(0, 8)} ${d99()} (it's always 1999 here)`); return;
      case 'dcc': info(c, "*** DCC SEND: your file is being sent at 0.3 KB/s. Estimated time: Thursday. (Tip: Uh-Oh! can send files too, and it's a bit faster.)"); got('ircdcc'); return;
      case 'server': case 'connect': if (C.connected) info(c, `*** There is only one server. It's ${SERVER}. It's under Jack's desk, next to the vacuum.`); else connect(); return;
      case 'disconnect': quit('Disconnected'); return;
      case 'kick': case 'ban': case 'op': case 'deop': case 'mode': case 'kickban': err(`You're not channel operator. Nobody is, apart from JackServ, and it's a robot.`); setTimeout(() => servSay(c, 'Nice try.'), 700); return;
      case 'help': case 'commands': HELP.split('\n').filter(Boolean).slice(2, 30).forEach(s => info(c, esc(s))); return;
      case 'options': case 'setup': optionsDialog(); return;
      case 'log': opts.log = !opts.log; store.set('jhp_irc_opts', opts); info(c, `*** Logging is now ${opts.log ? 'ON (C:\\Program Files\\JackIRC\\logs)' : 'OFF'}`); return;
      default:
        if (window.SiteChat && SiteChat.EMOTES && SiteChat.EMOTES[k]) { if (c.key === MAIN) { if (mainGate('me')) SiteChat.command('/' + k + (rest ? ' ' + rest : '')); } else sendTo(c, SiteChat.EMOTES[k] + (rest ? ' ' + rest : ''), true); return; }
        err(`Unknown command: /${k}. Type /help for the list.`);
    }
  }
  function nickChange(want) {
    const st = C.active || C.wins.get('status');
    if (!want) { info(st, `*** You are ${esc(me())}. Nicknames on JackNet belong to JackNet members. To change it, log on as a different member.`); if (window.JackLogon) JackLogon.show(); return; }
    if (lc(want) === lc(me())) return info(st, `*** You're already ${esc(me())}.`);
    if (byNick(want)) return err(`${want}: Nickname is already in use.`);
    err(`${want}: Nickname is registered with JackNet. The server only lets you use your own JackNet name. Log on as ${want} (or join JackNet as ${want}) to use it.`);
    if (window.JackLogon) JackLogon.show();
  }
  function sendTo(c, text, isMe) {
    if (!c || c.kind !== 'chan') return err("You're not on a channel. Type /join #jackattack (or press the + button).");
    if (!C.connected) return err('Not connected.');
    if (/[\u0002\u0003\u000f\u001f]/.test(text)) got('irccolour');
    if (c.key === MAIN) {
      const plain = strip(text).slice(0, 200);
      if (!plain.trim()) return;
      if (!mainGate('me')) return err('Flood control! #jackattack is shared with the whole website. Slow down a bit.');
      if (!Net.send({ t: 'chat', text: plain, me: isMe })) return err('Not connected to JackNet. (Is someone on the phone?)');
      if (/^!\w/.test(plain)) setTimeout(() => botCmd(c, plain, true), 300);
      return;
    }
    const t = ircClean(text, 300); if (!t) return;
    if (!Net.me.member) return window.Guest ? Guest.need(`Talking in ${c.name}`, () => sendTo(c, text, isMe)) : err('Talking here is for JackNet members.');
    if (!outGate('me')) return err('Excess flood! Wait a few seconds. (The server kicks you for less.)');
    Net.relay(0, 'social.irc', { k: 'm', c: c.key, t, a: isMe ? 1 : 0 });
    say(c, { nick: me(), col: Net.me.col, id: Net.me.id }, t, isMe, true);
    if (/^!\w/.test(strip(t))) botCmd(c, t, true); else trivCheck(c, me(), t);
  }

  // ---- incoming: the shared site chat (#jackattack)
  function chatIn(m, c, replay) {
    c = c || (C && C.wins.get(MAIN)); if (!c || !isObj(m)) return;
    if (m.sys) { line(c, 'notice', `-<b>JackNet</b>- ${esc(String(m.text || '').replace(/\bORK INVADERS\b/g, 'SAUCER INVADERS').replace(/\bWHACK-A-GROT\b/g, 'WHACK-A-ROBOT').replace(/\bSQUIG LOB\b/g, 'BLOBBIT LOB').slice(0, 300))}`); return; }
    const o = { nick: String(m.nick || '?').slice(0, 20), col: m.col, id: 0 };
    const on = byNick(o.nick); if (on && isIgnored(on)) return;
    say(c, o, String(m.text || '').slice(0, 300), !!m.me, replay || lc(o.nick) === lc(me()));
    if (!replay) trivCheck(c, o.nick, String(m.text || ''));
    if (!replay && /^!\w/.test(String(m.text)) && lc(o.nick) !== lc(me())) { /* only the asker's own JackIRC answers, privately */ }
  }
  Net.on('chat', m => { if (m && m.m) { CHAT_SEEN(m.m); if (C && C.connected) chatIn(m.m); } });
  Net.on('chatClear', () => { const c = C && C.wins.get(MAIN); if (c) { c.log.innerHTML = ''; info(c, '*** The channel was cleared by an IRC operator (Jack).'); } });
  function CHAT_SEEN(m) { if (!m.sys && m.nick) saw(m.nick, 'chatting in #jackattack'); }

  // ---- incoming: relay channels
  Net.onRelay('social.irc', (d, msg) => {
    const o = sender(msg); if (!o || !isObj(d)) return;
    const ch = typeof d.c === 'string' && CH_RE.test(d.c) && d.c !== MAIN ? d.c : null;
    let set = presence.get(o.id); if (!set) presence.set(o.id, set = new Set());
    if (d.k === 'hi') { if (C && C.connected) { const mine = [...C.wins.keys()].filter(k => k.startsWith('#') && k !== MAIN); if (mine.length) Net.relay(o.id, 'social.irc', { k: 'h', l: mine }); } return; }
    if (d.k === 'h') { if (Array.isArray(d.l)) d.l.slice(0, 12).forEach(x => { if (typeof x === 'string' && CH_RE.test(x) && x !== MAIN) set.add(x); }); renderAll(); return; }
    if (!ch) { if (d.k === 'q') { const was = [...set]; presence.delete(o.id); was.forEach(k => { const c = C && C.wins.get(k); if (c) { line(c, 'quit', `*** ${esc(o.nick)} (${esc(host(o))}) Quit (${esc(ircClean(d.m, 80) || 'Leaving')})`); renderNicks(c); } }); saw(o.nick, 'quitting IRC'); } return; }
    const c = C && C.connected ? C.wins.get(ch) : null;
    if (d.k === 'j') {
      if (set.size >= 12 && !set.has(ch)) return; const fresh = !set.has(ch); set.add(ch);
      if (c) { if (fresh) line(c, 'join', `*** ${esc(o.nick)} (${esc(host(o))}) has joined ${esc(ch)}`); renderNicks(c); Net.relay(o.id, 'social.irc', { k: 'h', l: [...C.wins.keys()].filter(k => k.startsWith('#') && k !== MAIN) }); }
      saw(o.nick, 'joining ' + ch); return;
    }
    if (d.k === 'p') { set.delete(ch); if (c) { line(c, 'part', `*** ${esc(o.nick)} (${esc(host(o))}) has left ${esc(ch)}${d.m ? ' (' + esc(ircClean(d.m, 80)) + ')' : ''}`); renderNicks(c); } return; }
    if (!c || isIgnored(o)) return;
    if (!set.has(ch)) { set.add(ch); renderNicks(c); }
    if (d.k === 'm') { if (!inGate(o.id)) return; const t = ircClean(d.t, 300); if (t) { say(c, o, t, d.a === 1, false); trivCheck(c, o.nick, t); } return; }
    if (d.k === 'b') { if (!inGate(o.id) || !['joke', 'waaagh', 'trivia', '8ball'].includes(d.n) || !int(d.i, 0, 96)) return; const s = botLine(c, d.n, d.i, ''); if (s) servSay(c, s); }
  });
  // topics (shared, persistent)
  Net.kv.watch(TOPIC_KEY, ev => {
    if (ev.type !== 'put' || !/^[a-z0-9_-]{1,20}$/.test(ev.f) || typeof ev.v !== 'string') return;
    const ch = '#' + ev.f, i = ev.v.indexOf('|'), t = ircClean(i > 0 ? ev.v.slice(i + 1) : ev.v, 100);
    topics[ch] = { t, by: clean(ev.by, 20) };
    const c = C && C.wins.get(ch); if (c) { line(c, 'topic', `*** ${esc(clean(ev.by, 20) || 'Someone')} changes topic to '${safeFmt(t)}'`); title(c); }
  });
  // site-wide joins, quits and nick changes show in #jackattack (everybody on the site is "in" it)
  // a connection blip isn't a Quit: hold the Quit line for 25 seconds, and say nothing at all if they come straight back
  let prev = new Map(getOnline().map(o => [o.id, o]));
  const quitting = new Map(); // id -> timer
  onlineFns.push(() => {
    const now = new Map(getOnline().map(o => [o.id, o]));
    const c = C && C.connected ? C.wins.get(MAIN) : null;
    for (const [id, o] of now) {
      const was = prev.get(id);
      if (quitting.has(id)) { clearTimeout(quitting.get(id)); quitting.delete(id); if (C && C.connected) { const mine = [...C.wins.keys()].filter(k => k.startsWith('#') && k !== MAIN); if (mine.length) Net.relay(id, 'social.irc', { k: 'h', l: mine }); } continue; }
      if (!was && id !== Net.me.id) { if (c) line(c, 'join', `*** ${esc(o.nick)} (${esc(host(o))}) has joined ${MAIN}`); saw(o.nick, 'arriving on JackNet'); }
      else if (was && was.nick !== o.nick) { C && C.wins.forEach(x => { if (x.kind === 'chan' && (x.key === MAIN || (presence.get(id) || new Set()).has(x.key))) line(x, 'join', `*** ${esc(was.nick)} is now known as ${esc(o.nick)}`); }); if (id === Net.me.id && C) C.wins.forEach(title); }
    }
    for (const [id, o] of prev) if (!now.has(id) && !quitting.has(id)) {
      now.set(id, o); // still listed until the Quit really happens
      quitting.set(id, setTimeout(() => {
        quitting.delete(id); if (getOnline().some(x => x.id === id)) return;
        const msg = quitMsg(o), c2 = C && C.connected ? C.wins.get(MAIN) : null; saw(o.nick, `leaving JackNet (${msg})`);
        if (c2) line(c2, 'quit', `*** ${esc(o.nick)} (${esc(host(o))}) Quit (${esc(msg)})`);
        const set = presence.get(id); if (set && C) set.forEach(k => { const x = C.wins.get(k); if (x) line(x, 'quit', `*** ${esc(o.nick)} (${esc(host(o))}) Quit (${esc(msg)})`); });
        presence.delete(id); prev.delete(id); renderAll();
      }, 25000));
    } else if (!now.has(id) && quitting.has(id)) now.set(id, o);
    prev = now; renderAll();
  });
  Net.on('you', () => setTimeout(renderAll, 50));
  // our own connection came back: ask who's in which channel again, and tell them ours
  Net.on('welcome', () => setTimeout(() => { if (!C || !C.connected) return; Net.relay(0, 'social.irc', { k: 'hi' }); const mine = [...C.wins.keys()].filter(k => k.startsWith('#') && k !== MAIN); if (mine.length) Net.relay(0, 'social.irc', { k: 'h', l: mine }); }, 900));
  setInterval(() => { if (C && C.connected) { const mine = [...C.wins.keys()].filter(k => k.startsWith('#') && k !== MAIN); if (mine.length) Net.relay(0, 'social.irc', { k: 'h', l: mine }); } }, 90000);

  // ---- /whois
  function whois(n, c) {
    const o = byNick(n);
    const out = s => info(c, s);
    if (isServ(n)) { got('ircgubbinz'); out(`<b>JackServ</b> is services@services.jacknet.jnet * JackNet Channel Services`); out('JackServ is a service bot: a program that answers !commands. It is not a person.'); out(`JackServ using ${SERVER} (it lives on the server)`); out('End of /WHOIS list.'); return; }
    if (!o) { out(`*** ${esc(n)}: No such nick/channel`); return; }
    got('ircwhois');
    const chans = [MAIN, ...((presence.get(o.id) && [...presence.get(o.id)]) || (o.id === Net.me.id && C ? [...C.wins.keys()].filter(k => k.startsWith('#') && k !== MAIN) : []))];
    const p = UM.peers.get(o.id) || {}, st = o.id === Net.me.id ? UM.status : p.s || 'online';
    out(`<b>${esc(o.nick)}</b> is ${esc(host(o))} * ${o.member ? 'JackNet member' : 'Guest'}`);
    out(`${esc(o.nick)} on ${chans.map(esc).join(' ')}`);
    out(`${esc(o.nick)} using ${SERVER} JackNet IRC (56K and proud)`);
    if (st !== 'online' && st !== 'ffc' && STAT[st]) out(`${esc(o.nick)} is away: ${esc(STAT[st][0])}${p.m ? ' - ' + esc(p.m) : ''}`);
    out(`${esc(o.nick)} is reading ${esc(X.whereOf(o))}`);
    if (o.member) {
      out(`${esc(o.nick)} has a JackNet profile. Fetching...`);
      members(m => {
        if (!C || !m || !Array.isArray(m.list)) return;
        const card = m.list.find(x => isObj(x) && lc(x.name) === lc(o.nick)); if (!card) return out('End of /WHOIS list.');
        const moods = Array.isArray(m.moods) ? m.moods : [];
        let av = ''; try { if (window.Community && Community.avatarURL) av = `<img class="ir-av" alt="" width="40" height="40" src="${esc(Community.avatarURL(card.avatar | 0))}">`; } catch (e) {}
        const d = h('div', 'ir-l ir-info ir-whoisprof');
        d.innerHTML = `${av}<span>${esc(card.name)} is JackNet member <b>#${int(card.no, 0, 1e9) ? card.no : '?'}</b> &middot; Uh-Oh! #<b>${window.UhOh && int(card.no, 1, 1e7) ? UhOh.uinOfNo(card.no) : '?'}</b> &middot; ${int(card.posts, 0, 1e9) ? card.posts : 0} forum post(s) &middot; mood: ${esc(moods[card.mood] || '?')} <a href="#" class="ir-plink">[view profile]</a></span>`;
        d.querySelector('a').addEventListener('click', ev => { ev.preventDefault(); $('browser').classList.remove('min'); if (window.Community) Community.openProfile(card.name); });
        c.log.appendChild(d); c.log.scrollTop = c.log.scrollHeight;
        out('End of /WHOIS list.');
      });
    } else out('End of /WHOIS list.');
  }

  // ---- /list
  function listWin() {
    let c = C.wins.get('channels list');
    if (!c) c = child('Channels List', 'list'); else activate(c);
    const counts = {};
    DEFAULTS.forEach(k => { counts[k] = 0; });
    counts[MAIN] = getOnline().length;
    presence.forEach((set, id) => { if (who(id)) set.forEach(k => { counts[k] = (counts[k] || 0) + 1; }); });
    C.wins.forEach((x, k) => { if (k.startsWith('#') && k !== MAIN) counts[k] = (counts[k] || 0) + 1; });
    const rows = Object.keys(counts).filter(k => k !== '#grotz' || C.wins.has('#grotz')).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    c.log.innerHTML = `<table class="ir-list"><thead><tr><th>Channel</th><th>Users</th><th>Topic</th></tr></thead><tbody>${rows.map(k => `<tr data-c="${esc(k)}" tabindex="0"><td>${esc(k)}</td><td>${counts[k]}</td><td>${safeFmt((topics[k] || {}).t || DEF_TOPICS[k] || '')}</td></tr>`).join('')}</tbody></table><p class="ir-listnote">Double-click a channel to join it. (JackServ, the channel bot, is in every channel too, but it doesn't count.)</p>`;
    let last = 0;
    c.log.querySelector('tbody').addEventListener('click', ev => { const tr = ev.target.closest('tr'); if (!tr) return; c.log.querySelectorAll('tr.sel').forEach(x => x.classList.remove('sel')); tr.classList.add('sel'); const now = Date.now(); if (X.touch() || now - last < 450) join(tr.dataset.c); last = now; });
    c.log.querySelector('tbody').addEventListener('keydown', ev => { const tr = ev.target.closest('tr'); if (tr && ev.key === 'Enter') join(tr.dataset.c); });
  }

  // ---- options
  function optionsDialog() {
    const f = h('form', 'ir-opts');
    f.innerHTML = `<fieldset class="group"><legend>Font</legend><div class="ir-fr"><label>Font:</label><select data-o="font"><option value="fixed">Fixedsys-ish</option><option value="ui">Tahoma</option><option value="comic">Comic Sans (for fun)</option></select></div><div class="ir-fr"><label>Size:</label><select data-o="size"><option>11</option><option>12</option><option>13</option><option>14</option></select></div></fieldset>
      <fieldset class="group"><legend>Colours</legend>${[['classic', 'Classic (black on white)'], ['hacker', 'Hacker (green on black)'], ['dave', "Dave's (don't ask)"]].map(([v, l]) => `<label class="ir-radio"><input type="radio" name="sch" value="${v}"> ${l}</label>`).join('')}<label><input type="checkbox" data-o="nickcol"> Colour people's nicknames</label></fieldset>
      <fieldset class="group"><legend>Other</legend><label><input type="checkbox" data-o="ts"> Timestamps</label><label><input type="checkbox" data-o="joins"> Show joins, parts and quits</label><label><input type="checkbox" data-o="sound"> Beep when someone says my name or talks in a hidden window</label><label><input type="checkbox" data-o="log"> Log chats to disk <small>(C:\\Program Files\\JackIRC\\logs. Your hard drive will be full by Christmas.)</small></label></fieldset>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="submit">OK</button><button class="btn" type="button">Cancel</button></div>`;
    f.querySelectorAll('[data-o]').forEach(i => { if (i.type === 'checkbox') i.checked = !!opts[i.dataset.o]; else i.value = String(opts[i.dataset.o]); });
    const r = f.querySelector(`input[name=sch][value=${opts.scheme}]`); if (r) r.checked = true;
    const w = Apps.win('JackIRC Options', f, { w: 360, icon: IRC_ICON, noResize: true, noMax: true, escClose: true });
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      f.querySelectorAll('[data-o]').forEach(i => { opts[i.dataset.o] = i.type === 'checkbox' ? i.checked : i.dataset.o === 'size' ? +i.value : i.value; });
      opts.scheme = (f.querySelector('input[name=sch]:checked') || {}).value || 'classic';
      if (!['fixed', 'ui', 'comic'].includes(opts.font)) opts.font = 'fixed';
      store.set('jhp_irc_opts', opts); styleOpts(); w.close(); got('ircopts');
    });
  }
  function ask(t, q, def, cb) { Desk.ask(t, q, def, 40, v => { v = String(v || '').trim(); if (v && v !== '#') cb(v); }); }

  const HELP = `JACKIRC 1.99 HELP
=================

COMMANDS (type them in the box at the bottom)
/join #channel      Join a channel (or make a new one!)
/part               Leave the channel you're in
/list               List channels and how many people are in them
/me does a thing    An action: * You does a thing
/msg nick hello     Private message (opens Uh-Oh! Messenger)
/query nick         Open an Uh-Oh! message window with them
/whois nick         Who is that? (members show their JackNet profile)
/topic new topic    Change the channel topic
/away reason        Mark yourself away (/away on its own = back)
/nick               Nicknames are your JackNet name (log on to change)
/names              Who's in the channel
/ping nick          How laggy are they?
/clear              Clear the window
/motd               Read the Message of the Day again (Gubbinz wrote it)
/log                Turn logging on or off
/quit message       Disconnect, with a parting message

JACKSERV (the channel service bot. It's a program, not a person)
!help !joke !8ball <question> !time !seen <nick> !trivia !rules !waaagh

COLOURS
Ctrl+K then a number (0-15) colours your text. Ctrl+B bold, Ctrl+U
underline, Ctrl+O back to normal. They show as ^K ^B ^U ^O in the
box. (Colours don't work in #jackattack: it's shared with the website.)

#jackattack is the same chat as the Hangout on the website, so people
there see what you say as speech bubbles. Every other channel is
JackIRC-only and live: no history, just like real IRC.

Double-click a nickname to send them an Uh-Oh! message.
Right-click it for Whois, Ping, Nudge and snowballs.
`;
  return { open, get isOpen() { return !!(C && !C.w.closed); }, get connected() { return !!(C && C.connected); }, join: n => C && join(n), cmd: (s) => cmd(s), HELP };
};
