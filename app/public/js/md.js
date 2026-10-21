/* md.js: JACKMUD, the live multiplayer text adventure (the always-loaded part; everything heavy loads when first needed).
 *   Telnet (Start > Programs > Accessories > Communications > Telnet)  Connect > Remote System: mud.jacknet.jnet port 4000
 *   MS-DOS                                                              C:\> telnet mud.jacknet.jnet 4000
 *   The web client (a Java applet, honest)                              http://www.jackmud.jnet/play.html
 *   MUDdy 98 (a download from www.jackmud.jnet): a proper MUD client with a map, a compass and health bars
 * The world, the monsters, the quests and your character all live on the server (mods/md.js). This file: secrets, the
 * Telnet and DOS hooks, the web site's pages (js/md-web.js), the shared terminal (js/md-term.js) and programs (js/md-apps.js).
 * window.MD: on(type, fn) -> off, load(name), telnet(host, port), go(url), ICO */
(function () {
  'use strict';
  const A = window.Apps; if (!A || !window.Desk || window.MD) return;
  const evs = {};
  const emit = (t, d) => (evs[t] || []).slice().forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  const HOST = 'mud.jacknet.jnet', SITE = 'www.jackmud.jnet';
  const MD = window.MD = {
    HOST, SITE, PORT: 4000, emit,
    on(t, fn) { (evs[t] = evs[t] || []).push(fn); return () => { evs[t] = (evs[t] || []).filter(x => x !== fn); }; },
    load: name => A.load('js/md-term.js').then(() => (name ? A.load('js/md-' + name + '.js') : null)),
    telnet(host, port) { return MD.load('apps').then(() => window.MDApps.telnet(host, port)); },
    go(url) { const b = document.getElementById('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } const tb = document.getElementById('taskBrowser'); if (tb) tb.hidden = false; IE.navigate(url); },
  };

  // ================================================================ icons
  const ICO = MD.ICO = {
    // a little castle on a CRT: JackMUD
    mud: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="28" height="21" rx="2" fill="#c0c0c0" stroke="#000"/><rect x="4.5" y="5.5" width="23" height="16" fill="#000" stroke="#555"/><path d="M8 19v-6h2v2h2v-2h2v2h1v-4h2v4h1v-2h2v2h2v-2h2v6z" fill="#ffd400"/><rect x="15.4" y="15.6" width="1.4" height="3.4" fill="#000"/><path d="M15.6 8.5h1.4v2.5h-1.4zM16.2 8.6l2.4.8-2.4.8z" fill="#e10600"/><rect x="11" y="24" width="10" height="2.4" fill="#808080" stroke="#000"/><rect x="6" y="26.4" width="20" height="3.4" fill="#c0c0c0" stroke="#000"/><path d="M6.5 6.5h5" stroke="#3f3" stroke-width=".8" opacity=".7"/></svg>',
    // MUDdy 98: a muddy boot over a terminal
    muddy: '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="22" rx="1.5" fill="#000080" stroke="#000"/><rect x="4" y="5" width="24" height="17" fill="#000"/><path d="M6 8h9M6 11h12M6 14h7" stroke="#55ff55" stroke-width="1.4"/><path d="M6 17h4" stroke="#ffff55" stroke-width="1.4"/><path d="M17 12h5v8h5c2 0 3 1 3 3v3H16z" fill="#7a4a1a" stroke="#000"/><path d="M16 23h14" stroke="#4a2a0a" stroke-width="1.6"/><path d="M18 14h3M18 16h3" stroke="#c8a070" stroke-width=".8"/><circle cx="24" cy="21" r="1.2" fill="#5a3a1a"/><circle cx="28" cy="22" r=".9" fill="#5a3a1a"/><rect x="5" y="2" width="22" height="2.4" fill="#000080"/></svg>',
    telnet: window.JICON && JICON.has && JICON.has('dos') ? JICON.icon('dos') : '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="24" fill="#000" stroke="#808080"/><rect x="2" y="4" width="28" height="4" fill="#000080"/><path d="M6 13l4 3-4 3" stroke="#c0c0c0" stroke-width="1.5" fill="none"/><rect x="12" y="18" width="6" height="2" fill="#c0c0c0"/></svg>',
  };

  // ================================================================ the wire: the server's messages go to whoever is listening (js/md-term.js)
  if (window.Net) {
    for (const t of ['mdOut', 'mdEnd', 'mdWho', 'mdTop']) Net.on(t, m => emit(t, m));
    Net.on('mdSecret', m => { const id = String(m.id || ''); if (/^md\.[a-z0-9]+$/.test(id) && A.secrets[id]) A.secret(id); });
    Net.on('_open', () => emit('_open'));
    Net.on('_close', () => emit('_close'));
  }

  // ================================================================ secrets (the server says when you've found one)
  [['md.connect', 'You Have Connected', 'There is a whole world made of words on the JackNet. Connect to it'],
    ['md.born', 'A Hero Is Born', 'Pick a class and step into a text adventure'],
    ['md.grad', 'Top of the Class', 'Pass every lesson at an academy for adventurers'],
    ['md.dos', 'Old School', 'Telnet into a fantasy world from a black-and-grey prompt'],
    ['md.web', 'Java Is Brewing', 'Play the MUD in your web browser (it is an applet!)'],
    ['md.port23', 'Wrong Door', 'Telnet to the MUD... on the wrong port'],
    ['md.muddy', 'Proper MUD Client', 'Download a MUD client with a map and a compass'],
    ['md.xyzzy', 'Wrong Game', 'Say a famous magic word from an even older adventure'],
    ['md.faint', 'Out Cold', 'Run out of HP in JackMUD (an owl will sort you out)'],
    ['md.riddle', 'Clever Clogs', 'Answer the troll\'s riddle'],
    ['md.wish', 'Make a Wish', 'Throw a coin in the fountain in the middle of town'],
    ['md.reboot', 'Turn It Off and On Again', 'Press the big button in the temple'],
    ['md.ducks', 'Duck Magnet', 'Feed the ducks in the park'],
    ['md.needle', 'Needle in a Haystack', 'Jump into some hay'],
    ['md.guess', 'Beat the Machine', 'Win at the Guess-O-Tron in the arcade'],
    ['md.den', 'Access All Areas', "Find the MUD's builder's secret room"],
    ['md.falls', 'Behind the Waterfall', 'The bear was guarding something. Look behind the water'],
    ['md.ratbag', 'Long Live the King (Somewhere Else)', 'Defeat the ruler of the sewers'],
    ['md.treasure', 'X Marks the Spot', 'Dig up buried pirate treasure'],
    ['md.squidgy', 'Calamari Is Off', 'Beat the Kraken\'s little cousin'],
    ['md.buffer', '100% Loaded', 'Defeat the thing that makes everything slow'],
    ['md.dragon', 'Dragon Friend', 'Help a dragon get her save game back'],
    ['md.peak', 'Top of the World', 'Climb to the very top of the mountain'],
    ['md.astronaut', 'Space Exam', 'Pass the astronaut test'],
    ['md.space', 'We Have Lift-Off', 'Launch a rocket into space'],
    ['md.donotpress', 'DO NOT PRESS', 'Press the button you were told not to press'],
    ['md.moon', 'One Small Step', 'Land on the Moon (it is cheese)'],
    ['md.moonflag', 'In Peace for All Mankind', 'Find the old flag on the Moon'],
    ['md.muncher', 'Moon Saver', 'Stop the thing eating the Moon'],
    ['md.moonhero', 'Queen\'s Favourite', 'Be thanked by royalty on the Moon'],
    ['md.y2k', 'Millennium Hero', 'Defeat the Millennium Bug before the year 2000'],
    ['md.party', 'Better Together', 'Form a party with another player in JackMUD'],
    ['md.lv10', 'Double Figures', 'Reach level 10 in JackMUD'],
    ['md.lv20', 'Legend', 'Reach the top level in JackMUD'],
    ['md.explore50', 'Wanderer', 'Visit 50 different rooms in JackMUD'],
    ['md.explore', 'Cartographer', 'Visit nearly every room in JackMUD'],
    ['md.allquests', 'Questmaster', 'Finish every single quest in JackMUD'],
  ].forEach(([id, n, h]) => A.defineSecret(id, n, h));

  // ================================================================ Telnet (the existing Accessories program becomes a real Telnet client)
  // The old ASCII film still plays: connect to jacknet.tv (or type "telnet jacknet.tv" in Run, as before).
  const openTelnet = (host, port) => { MD.telnet(host, port).catch(e => { console.error(e); Desk.msgbox('Telnet', 'Telnet could not start. (Not enough memory, or Dave unplugged something.)', 'warn'); }); };
  A.register('md.telnet', { open: arg => { const [h, p] = String(arg || '').split(':'); return MD.telnet(h || '', p || ''); } });
  function hookTelnet() {
    const L = A.programs || [];
    let hit = false;
    for (const p of L) if (p.path && p.path.join('>') === 'Accessories>Communications>Telnet') { p.target = () => openTelnet(); hit = true; }
    if (!hit) A.addProgram(['Accessories', 'Communications', 'Telnet'], () => openTelnet(), ICO.telnet);
  }
  hookTelnet();
  A.cmd(['telnet', 'telnet.exe'], () => setTimeout(() => openTelnet(), 60));
  A.cmd(['telnet mud.jacknet.jnet 4000', 'telnet mud.jacknet.jnet', 'telnet mud.jacknet.jnet:4000', 'telnet://mud.jacknet.jnet:4000', 'jackmud', 'mud', 'telnet jackmud', 'telnet jackmud.jnet 4000'], () => setTimeout(() => openTelnet(HOST, '4000'), 60));
  A.cmd(['telnet mud.jacknet.jnet 23'], () => setTimeout(() => openTelnet(HOST, '23'), 60));
  // telnet:// links on web pages open the Telnet program
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a[href^="telnet:"]'); if (!a) return;
    ev.preventDefault(); ev.stopPropagation();
    const m = /^telnet:\/\/([^:/]+)(?::(\d+))?/i.exec(a.getAttribute('href') || ''); openTelnet(m ? m[1] : HOST, m && m[2] ? m[2] : '23');
  }, true);

  // ================================================================ MS-DOS: TELNET host [port]
  const DOS = window.DOS;
  if (DOS) {
    DOS.progs = DOS.progs || {};
    DOS.progs.telnet = async (sh, args, node) => {
      try { await MD.load('apps'); } catch (e) { sh.println('Not enough memory to run TELNET.'); return; }
      return window.MDApps.dos(sh, args, node);
    };
  }

  // ================================================================ MUDdy 98 (a download)
  const PID = 'md.muddy';
  try {
    if (window.Setup && Setup.product) Setup.product(PID, {
      n: 'MUDdy 98', v: '1.3', kb: 1480, lic: 'Freeware', by: 'Mudlark Software', cat: 'net', sq: 5, rel: '14/12/98', def: false,
      d: 'The MUD client for people who are fed up of typing NORTH. A colour terminal, a map that draws itself as you explore, a clickable compass, health and magic bars, and one-click buttons for everything. Made for JackMUD (mud.jacknet.jnet port 4000), works with any MUD (it does not).',
      note: 'Remember to QUIT before Mom picks up the phone. MUDdy can\'t save you from that.',
      home: 'http://' + SITE + '/download.html', apps: [PID], paths: ['MUDdy 98 >'], icons: ['mdIconMuddy'], cmds: ['muddy', 'muddy98'],
      launch: PID, exe: 'MUDDY98.EXE', dir: 'MUDdy 98', ic: 'dos',
    });
  } catch (e) { console.error(e); }
  A.register(PID, { single: true, cmd: ['muddy', 'muddy98', 'muddy.exe', 'muddy98.exe'], open: () => MD.load('apps').then(() => window.MDApps.muddy()) });
  A.addProgram(['MUDdy 98', 'MUDdy 98'], PID, ICO.muddy);
  A.addProgram(['MUDdy 98', 'JackMUD Home Page'], () => MD.go('http://' + SITE + '/'), ICO.mud);
  A.addProgram(['MUDdy 98', 'Read Me'], () => Desk.notepad('MUDDY.TXT', README), null);
  A.desktopIcon('MUDdy 98', ICO.muddy, () => A.open(PID), 'mdIconMuddy');
  const README = `MUDdy 98 version 1.3
====================
(c) 1998 Mudlark Software. Freeware! Copy it for your mates!

MUDdy is a MUD client. A MUD is a "Multi-User Dungeon": a game made of words that
lots of people play at the same time over the Internet, like a book you can walk
around in, with your mates in it.

MUDdy connects to JackMUD (mud.jacknet.jnet, port 4000) and adds:
  * a MAP that draws itself as you walk about
  * a COMPASS: click a direction to go that way
  * HEALTH, MAGIC and EXPERIENCE bars
  * a "Who's here" list: click someone to talk to them, click a monster to fight it
  * one-click buttons for LOOK, INVENTORY, QUESTS and friends
  * command history (press the Up arrow)

HANDY KEYS
  Up / Down     your last commands
  Enter         send
  Esc           clear the line
  Numpad 8 2 4 6 (with Num Lock off): north south west east. Very pro.

Rule number one of MUDding: QUIT properly before somebody needs the phone.
`;

  // ================================================================ www.jackmud.jnet (pages fill themselves once js/md-web.js has loaded)
  function page(fn) {
    return () => {
      const el = document.createElement('div'); el.className = 'mdw mdw-loading';
      el.innerHTML = '<p class="mdw-wait">Contacting host www.jackmud.jnet... Host contacted. Waiting for reply...</p>';
      MD.load('web').then(() => { el.classList.remove('mdw-loading'); window.MDWeb[fn](el); })
        .catch(e => { console.error(e); el.innerHTML = '<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The server is not answering. Click <b>Refresh</b>, or try again later.</p></div>'; });
      return el;
    };
  }
  const PAGES = {
    '/': ['home', ''], '/play.html': ['play', 'Play Now (Java)'], '/newbie.html': ['newbie', 'Newbie Guide'], '/classes.html': ['classes', 'The Classes'],
    '/map.html': ['map', 'Map of the Realm'], '/who.html': ['who', "Who's Online"], '/heroes.html': ['heroes', 'Hall of Heroes'], '/bestiary.html': ['bestiary', 'The Bestiary'], '/news.html': ['news', 'News & Updates'],
    '/download.html': ['download', 'Download MUDdy 98'], '/rules.html': ['rules', 'The Rules'],
  };
  if (window.IE && IE.addSite) {
    const pages = {}; for (const p in PAGES) pages[p] = { title: 'JackMUD' + (PAGES[p][1] ? ' - ' + PAGES[p][1] : ': Swords, Sorcery and Slow Modems'), html: page(PAGES[p][0]) };
    IE.addSite(SITE, { title: 'JackMUD: Swords, Sorcery and Slow Modems', desc: 'JackMUD is a FREE multiplayer text adventure! 137 rooms, 20 quests, monsters, magic and your mates, live. Play in your browser (Java) or telnet to mud.jacknet.jnet port 4000.', cat: 'games', pages });
  }
  A.addProgram(['Internet', 'JackMUD (play online)'], () => MD.go('http://' + SITE + '/'), ICO.mud);
  A.cmd(['www.jackmud.jnet', 'jackmud.jnet', 'jackmud web'], () => MD.go('http://' + SITE + '/'));

  // ================================================================ the JackLoot badge for beating the Millennium Bug (the server has the same entry)
  A.load('js/loot-cat.js').then(() => { const L = window.LootCat; if (L && L.ITEM && !L.ITEM['badge.md_y2k']) { const it = { id: 'badge.md_y2k', name: 'Millennium Hero', r: 3, type: 'badge', art: ['#000080', '#ffd400', 'Y2K'], d: 'Beat THE MILLENNIUM BUG deep under the Clock Tower in JackMUD. Every clock in Baudby is safe for the year 2000!', ex: 1 }; L.ITEMS.push(it); L.ITEM[it.id] = it; } }).catch(() => {});

  // ================================================================ a note on the hard drive
  try {
    A.fs.add('C:/My Documents', { name: 'JACKMUD.TXT', type: 'txt', date: '15/11/98', size: '2 KB', text: `JACKMUD!!! (my MUD)
===================
It's finally OPEN. 137 rooms. Took me since the summer holidays.

HOW TO PLAY
  * Start > Programs > Accessories > Communications > Telnet
    then Connect > Remote System...   Host Name: mud.jacknet.jnet   Port: 4000
  * or in MS-DOS:   telnet mud.jacknet.jnet 4000
  * or on the web:  www.jackmud.jnet  (there's a Java thing, it takes AGES to load)
  * or get MUDdy 98 from the web site, it draws a map for you. Callum says it's cheating.

TODO
  - fix geese following people into the bank (DONE)
  - the space level (DONE!!!)
  - Callum's server room: TOO HARD?? (he says no. it is.)
  - stop Dave naming every monster after his sister (DONE, mostly)
  - Atlantis level? next year
  - a secret room for me. behind something. no one will ever find it. (done ;)

Remember: QUIT before Mom picks up the phone or the line drops and your guy just
stands there like a lemon for two minutes.
` });
  } catch (e) {}
})();
