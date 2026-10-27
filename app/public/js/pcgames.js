/* pcgames: the 1999 PC shooters pack. JAQUAKE (a rusty shareware first-person shooter) and JACKREAL TOURNAMENT
 * (an arena shooter with bots, practice sessions and real online deathmatch between visitors, via mods/arena.js).
 * This always-loaded file is tiny: icons, programs, installer entries, files and secrets. The engine and the games
 * are fetched the first time one is opened (js/pcgames-grid.js, -engine.js, -jaquake.js, -arena.js, -jrt.js). */
(function () {
  'use strict';
  if (!window.Apps) return;
  const I = {
    jaquake: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#3a2414" stroke="#000"/><path d="M2 2h28v6H2z" fill="#5a3a1a"/><g fill="#a8582a" stroke="#200a00"><path d="M17 5h8v15q0 7-8 7h-5q-6 0-7-6l5-1q1 2 3 2h3q1 0 1-2z"/></g><path d="M18 6h6v2h-6z" fill="#d88848"/><path d="M8 20l2 5-4-1z" fill="#fffff0" stroke="#000" stroke-width=".5"/><circle cx="6" cy="9" r="1.2" fill="#ffa020"/><circle cx="27" cy="27" r="1" fill="#ffa020"/></svg>',
    jrt: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#0a0a2a" stroke="#000"/><path d="M16 3l11 4v8q0 9-11 14Q5 24 5 15V7z" fill="#c8a020" stroke="#5a4000"/><path d="M16 6l8 3v6q0 6-8 10-8-4-8-10V9z" fill="#2a3a8a"/><text x="16" y="19.5" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="8" fill="#ffd400" stroke="#000" stroke-width=".4">JRT</text><path d="M3 27h26" stroke="#e10600" stroke-width="2"/></svg>',
    txt: Apps.ICON.txt,
  };
  const ENG = ['js/pcgames-grid.js', 'js/pcgames-engine.js'];
  const chain = files => files.reduce((p, f) => p.then(() => Apps.load(f)), Promise.resolve());
  const today = () => { const m = location.search.match(/[?&]pcgdate=(\d{2})(\d{2})/); return m ? { m: +m[1], d: +m[2], md: +m[1] * 100 + +m[2] } : Desk.today99(); };
  const jrtFull = () => today().md >= 1122;

  const LIVE = {}; // app id -> { G, env, w } while a game window is open
  function launch(o, arg) {
    const host = document.createElement('div'); host.className = 'pcg-host'; host.tabIndex = 0; host.dataset.game = o.id; // (data-game: no screen saver while you play)
    host.style.cssText = 'position:absolute;inset:0;background:#000;outline:none;overflow:hidden';
    host.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#c0c0c0;font:12px 'Courier New',monospace;text-align:center">${o.icon.replace('<svg', '<svg width="48" height="48"')}<div>${o.loading}</div><div class="prog" style="width:180px"><span style="display:flex;gap:2px"></span></div></div>`;
    let G = null;
    const w = Apps.win(o.title, host, { w: Math.min(860, innerWidth - 20), h: Math.min(620, innerHeight - 60), icon: o.icon, cls: 'pcgwin', minW: 320, minH: 240, onClose: () => { clearInterval(fill); if (G && G.close) G.close(); if (LIVE[o.id] && LIVE[o.id].w === w) delete LIVE[o.id]; } });
    w.body.style.cssText = 'padding:0;overflow:hidden;background:#000;position:relative;min-height:200px';
    if (innerWidth < 700 || innerHeight < 540) w.el.classList.add('maxwin');
    const bar = host.querySelector('.prog span'); let k = 0;
    const fill = setInterval(() => { if (k < 16 && bar) { bar.appendChild(document.createElement('i')); k++; } }, 70);
    // JAQUAKE swaps between single player and JackNet deathmatch in the same window
    const env = { full: jrtFull(), today, w,
      toMP(a) { if (G && G.close) G.close(); host.innerHTML = ''; G = PCG.jqNet(w, host, a || null, env); w.setTitle('JAQUAKE - JackNet Deathmatch'); setTimeout(() => host.focus(), 30); },
      toSP() { if (G && G.close) G.close(); host.innerHTML = ''; G = PCG.jaquake(w, host, null, env); w.setTitle('JAQUAKE'); setTimeout(() => host.focus(), 30); } };
    LIVE[o.id] = { w, env, get G() { return G; } };
    chain(ENG.concat(o.files)).then(() => {
      clearInterval(fill);
      if (w.closed) return;
      if (!window.THREE || !window.PCG || !PCG[o.entry]) throw new Error('missing ' + o.entry);
      host.innerHTML = '';
      if (o.id === 'jaquake' && arg && typeof arg === 'object' && arg.go) env.toMP(arg);
      else G = PCG[o.entry](w, host, arg, env);
      setTimeout(() => host.focus(), 30);
    }).catch(e => {
      clearInterval(fill); console.error(e);
      if (!w.closed) host.innerHTML = `<div style="padding:20px;color:#c0c0c0;font:12px 'Courier New',monospace">${o.exe} could not start.<br><br>General Protection Fault in module 3DFIX.VXD. (Or the CD is scratched. Try again.)</div>`;
    });
    return w;
  }
  // start a game with an instruction (join a server, quick match...), or hand it to the copy that's already running
  function play(id, arg) {
    const L = LIVE[id === 'pcgames.jaquake' ? 'jaquake' : 'jrt'];
    if (L && !L.w.closed && L.G) {
      L.w.restore(); L.w.focus && L.w.focus();
      if (L.G.runArg) L.G.runArg(arg); else if (L.env && id === 'pcgames.jaquake') L.env.toMP(arg);
      return L.w;
    }
    return Apps.open(id, arg);
  }
  const GAMES = {
    jaquake: { id: 'jaquake', title: 'JAQUAKE', exe: 'JAQUAKE.EXE', icon: I.jaquake, entry: 'jaquake', files: ['js/pcgames-jaquake.js', 'js/pcgames-arena.js', 'js/pcgames-jrt.js'], loading: 'JAQUAKE v1.06 (shareware)<br>Loading PAK0.PAK...' },
    jrt: { id: 'jrt', title: 'Jackreal Tournament', exe: 'JRT.EXE', icon: I.jrt, entry: 'jrt', files: ['js/pcgames-arena.js', 'js/pcgames-jrt.js'], loading: 'JACKREAL TOURNAMENT<br>Loading textures, bots and attitude...' },
  };
  Apps.register('pcgames.jaquake', { single: true, cmd: ['jaquake', 'jaquake.exe'], open: arg => launch(GAMES.jaquake, arg) });
  Apps.register('pcgames.jrt', { single: true, cmd: ['jrt', 'jrt.exe', 'jackreal'], open: arg => launch(GAMES.jrt, arg) });
  const note = (name, text) => () => { const n = Apps.fs.find(name); if (n) Apps.openFile(n); else Desk.notepad(name, text); };

  // ================================================================ read-mes and files on C:
  const JQ_README = `JAQUAKE v1.06 SHAREWARE
=======================
Episode 1: "The Rusty Dimension" (3 maps)

Something has gone very wrong at the Rusty Slipgate. Tin robots are
clanking through it. Slime blobs are wobbling about. A few imps have
set up camp. Nobody asked them to.

You have a Jackhammer, a Boomstick and an attitude. Go and poof them all.

KEYS
  W A S D / arrows ... move          SPACE ........ jump
  Mouse .............. look          Left click ... shoot (or CTRL)
  1 to 8 / wheel ..... weapons       \` ............ console
  ESC ................ menu          TAB .......... how am I doing?

WEAPONS
  1 Jackhammer ....... for when you're out of ammo, or showing off
  2 Boomstick ........ seven pellets, one big bang
  3 Double Boomstick . fourteen pellets, two shells, one VERY big bang
  4 Rivet Gun ........ fires hot rivets. Very fast. Very rude.
  5 Super Rivet Gun .. fires BIG hot rivets. Even ruder.
  6 Grenade Jack ..... lobs bouncy pineapples. They go off in a bit.
  7 Rocket Jack ...... fires a rocket with Jack's face painted on. Big poof.
  8 Zapper ........... a crackly beam. NEVER use it in the bath.

SKILL
  EASY, NORMAL, HARD and NIGHTMARE. NORMAL is right if you're new: the
  baddies take a moment to spot you, wave their arms about before they
  shoot, and their shots are slow enough to side-step. On NIGHTMARE
  they don't bother waving. Callum plays on NIGHTMARE. Of course he does.

TIPS
  * Shoot walls that look a bit different. Some of them move.
  * Rocket jump: look at your feet, jump and fire Rocket Jack.
  * Water is safe. Slime is not. Lava is REALLY not.
  * Nothing in this game bleeds. Everything goes POOF. Mom checked.

MULTIPLAYER (new in 1.06!)
  Pick MULTIPLAYER on the main menu. PLAY ONLINE NOW drops you straight
  into a deathmatch on JackNet. The [JackNet] servers are on all day and
  all night: if nobody is about, bots keep you company until they are.
  DM1: The Rusty Pit ........ a lava pit, one bridge, one Quad Jack
  DM2: Jackstone Cloisters .. a courtyard with a slime moat
  CO-OP ..................... you and your mates against six waves of
                              tin robots, imps and slime blobs
  Frags go on the weekly JackNet Rankings (members only).

SYSTEM REQUIREMENTS
  486 DX2/66 (Pent-Yum recommended), 8 MB RAM, VGA, CD-ROM or 9 floppies,
  Sound Bluster or 100% compatible. A mouse. A cup of squash.

SHAREWARE: copy this for your mates! Episodes 2-4 cost £19.99 from
Jackware Software, PO Box 1999. Allow 28 days for delivery.
`;
  const JQ_CFG = `// JAQUAKE config.cfg - written by JAQUAKE, do not edit (Jack edited it)
name "Jack"
sensitivity "3.5"
fov "90"
skill "1"
bind "\`" "toggleconsole"
bind "SPACE" "+jump"
bind "MOUSE1" "+attack"
// keys can be changed in Options > Customize controls now. Jack's dad said fine.
// cheats are typed in the console. no, I'm not saying which.
// Callum says: try the one from the OTHER game.
`;
  const JRT_README = `JACKREAL TOURNAMENT
===================
"The galaxy's most dangerous sport. Played in Jack's bedroom."

Welcome to the Tournament! Sign up, pick your gun, frag the bots.

GAME TYPES
  DeathMatch ........ first to the frag limit wins
  Capture the Flag .. grab their flag, bring it to yours. Easy. (It is not easy.)

MAPS
  Space Station Jack a rusty platform floating in space. LOW GRAVITY.
  Coax Foundry       a cable works at sunset: two sheds, crates, a crane.
  Castle Jackstone   a crumbly castle with a courtyard and battlements.
  Coax Canyon        two forts on two cliffs and one wobbly bridge.

TOURNAMENT LADDER (new!)
  Six matches, from Dave (Novice) all the way up to Callum. Beat one to
  unlock the next. The demo has the first rungs.

THE GUNS (left click fires, RIGHT click is ALT FIRE)
  1 Impact Jackhammer  punch / shove. Hit the floor with it to HAMMER JUMP.
  2 Jack Pistol ....... quick shots / rapid fire (wobblier)
  3 Shock Jack ........ purple beam / slow purple ball. Shoot your own
                        ball with the beam for a SHOCK COMBO. Big poof.
  4 Rattler ........... rattles / rattles MORE (less accurate)
  5 Flak Jack ......... a spray of hot bits (they bounce) / a lobbed shell
  6 Rocket Jack ....... rockets / grenades that bounce about

THE ANNOUNCER (he shouts a lot, and on PCs that can talk, he talks)
  FIRST POOF ....... first frag of the match
  Double Poof / Multi Poof / Ultra Poof / M-M-M-MONSTER POOF
                     ... frags in quick succession
  Poofing Spree, Rampage, Dominating, Unstoppable, GODLIKE
                     ... frags without dying

BOTS
  Novice, Average, Skilled, Masterful, Godlike. Average is the default:
  they miss, they stop for pickups, they don't all go for you at once.
  The Usual Suspects puts everyone at their own level (Callum: GODLIKE).

ONLINE PLAY
  PLAY ONLINE NOW .. one click: the best game on JackNet for you.
  The [JackNet] servers are on 24/7: Deathmatch, Capture the Flag and
  Newbies Only (the bots go easy). Nobody on? The bots start a match
  with you straight away, and real people join in as they turn up.
  Find Internet Game shows every game on JackNet with ping and players.
  Start LAN Game makes a game for everyone on your network (your house).
  Empty slots get filled with bots. Up to 8 players. Spectators welcome.
  At the end of each match everybody votes for the next map.
  Lost your connection, or tabbed out for your tea? Your place is kept
  for two minutes. Frags go on the JackNet Rankings (members only).

KEYS: WASD move, mouse look, click shoot, RIGHT click (or F) alt fire,
SPACE jump, press a direction twice quickly to DODGE, 1-6 weapons, TAB scores,
Y talk, \` console, ESC menu. Change them in Options > Controls.
Options also has your HUD colour, five crosshairs and the announcer.

DEMO VERSION: two maps, and a nag screen. The full game is out on
22 November 1999. Ask for it for Christmas.
`;
  const CALLUM = `CALLUM'S LAN PARTY GUIDE (v3, now with snacks)
==============================================

1. Bring your OWN PC. Not just the monitor, JackK.
2. Bring a network card. ISA is fine. PCI is better. Mine is PCI.
3. Coax cable goes from PC to PC. Put the T-pieces on. Put the
   TERMINATORS on the ends or NOTHING works. I'm not explaining it again.
4. My PC: Pent-Yum III 450, overclocked to 504 (it's fine, I put a
   bigger fan on), 128 MB RAM, Hoodoo3 3000. 90 fps in JRT. Jack's
   does about 25. Luke's does a slideshow.
5. Luke and Dave: it is NOT on the ULTRA 64. Stop asking. Yes I know
   Goldenballs has four player split screen. This has EIGHT and no screen
   cheating. (Dave, I could see you looking at my quarter.)
6. Mom's rule (Jack's Mom): finish by 10. Crisps stay in the kitchen.
7. I always win. That's not a rule, it's just what happens.

Bot names on my server: me, Jack, JackK (Jack with a K), Luke, Dave, plus the
made-up ones. The bot called "Callum" is set to GODLIKE. Obviously.
`;
  const SERVERS = `JACKNET 24/7 SERVERS (copied off the Frag Zone, www.fragzone.jnet)
=================================================================
[JackNet] Deathmatch 24/7 ............... JRT DeathMatch, map rotation
[JackNet] Capture the Flag .............. JRT CTF (bring a mate)
[JackNet] Newbies Only (bots go easy) ... JRT for Dave
[JackNet] JAQUAKE Deathmatch ............ JAQUAKE DM1 and DM2
[JackNet] JAQUAKE Co-op (monster waves) . you lot vs the tin robots

They are ALWAYS on. If nobody's there, the bots start a match with you.
JackSpy 3D finds them all (Start > Programs > Internet), or just press
PLAY ONLINE NOW in the game. Ping is better when nobody's on the phone.

Callum's server is not on this list. Callum's Mom switches it off at 10.
`;
  const SPY_README = `JACKSPY 3D v2.10 - the Internet game finder
===========================================
Finds every Jackreal Tournament and JAQUAKE game on JackNet, shows you
the ping, the map and who's playing, and joins it with one click.

  Refresh ......... ask the master server for the latest list
  Quick Match ..... JackSpy picks the best game for you
  Join / Spectate . double-click a server, or use the buttons
  Filters ......... hide empty or full servers, pick a game type
  Rankings ........ the weekly and all-time frag tables

UNREGISTERED SHAREWARE: you can use JackSpy 3D for 30 days (it does not
count. It never stops working. Shhh.) Registering costs £14.99 and gets
you a warm feeling and a sticker.

(c) 1999 JackSpy Industries. "We spy with our little eye, something
beginning with F. Frags."
`;
  try {
    Apps.fs.add('C:/Games/Jaquake', { name: 'JAQUAKE.EXE', type: 'exe', app: 'pcgames.jaquake', size: '412 KB', date: '17/03/99' });
    Apps.fs.add('C:/Games/Jaquake', { name: 'README.TXT', type: 'txt', text: JQ_README, size: '2 KB', date: '17/03/99' });
    Apps.fs.add('C:/Games/Jaquake/ID1', { name: 'CONFIG.CFG', type: 'txt', text: JQ_CFG, size: '1 KB', date: '02/05/99' });
    Apps.fs.add('C:/Games/Jaquake/ID1', { name: 'PAK0.PAK', type: 'txt', text: 'PACK\u0000\u0000\u0004\u00a0\u0000... (18,689 KB of robots, textures and maps. Jotpad does not understand it. Neither does Jack.)', size: '18,689 KB', date: '17/03/99' });
    Apps.fs.add('C:/Games/Jaquake', { name: 'ORDER.TXT', type: 'txt', text: 'TO ORDER THE FULL VERSION OF JAQUAKE\n\nSend £19.99 (+50p p&p) by cheque or postal order to:\nJACKWARE SOFTWARE, PO Box 1999.\n\nYou get: Episodes 2, 3 and 4, 28 more maps, the Rivet Mines, the\nRobot Fortress and Jack\'s Revenge. On one CD-ROM or nine floppy disks.\nPlease ask a grown-up before sending money through the post.\n', size: '1 KB', date: '17/03/99' });
    Apps.fs.add('C:/Games/JRT', { name: 'JRT.EXE', type: 'exe', app: 'pcgames.jrt', size: '1,204 KB', date: jrtFull() ? '22/11/99' : '28/09/99' });
    Apps.fs.add('C:/Games/JRT', { name: 'README.TXT', type: 'txt', text: JRT_README, size: '3 KB', date: '28/09/99' });
    Apps.fs.add('C:/Games/JRT', { name: 'CALLUM.TXT', type: 'txt', text: CALLUM, size: '2 KB', date: '09/10/99' });
    Apps.fs.add('C:/Games/JRT/System', { name: 'JRT.INI', type: 'txt', text: '[Engine.Engine]\nGameRenderDevice=GlideDrv.GlideRenderDevice\n; Jack: I don\'t have a 3dfix card. It works anyway?!\n[Botpack.Bots]\nBotName[0]=Callum\nBotSkill[0]=GODLIKE\nBotName[1]=JackK\nBotSkill[1]=Masterful\nBotName[2]=Luke\nBotSkill[2]=Average (busy playing Kart Kaos in his head)\nBotName[3]=Dave\nBotSkill[3]=Novice\nBotTaunt[3]="Is this on the ULTRA 64?"\n', size: '4 KB', date: '22/11/99' });
    Apps.fs.add('C:/Games/JRT', { name: 'SERVERS.TXT', type: 'txt', text: SERVERS, size: '1 KB', date: '19/10/99' });
    Apps.fs.add('C:/Program Files/JackSpy 3D', { name: 'JACKSPY.EXE', type: 'exe', app: 'pcgames.spy', size: '1,450 KB', date: '04/10/99' });
    Apps.fs.add('C:/Program Files/JackSpy 3D', { name: 'README.TXT', type: 'txt', text: SPY_README, size: '2 KB', date: '04/10/99' });
  } catch (e) {}

  // ================================================================ Start menu, installer, secrets
  Apps.addProgram(['Games', 'JAQUAKE', 'JAQUAKE'], 'pcgames.jaquake', I.jaquake);
  Apps.addProgram(['Games', 'JAQUAKE', 'Read Me'], note('README.TXT', JQ_README), I.txt);
  Apps.addProgram(['Games', 'Jackreal Tournament', jrtFull() ? 'Jackreal Tournament' : 'Jackreal Tournament DEMO'], 'pcgames.jrt', I.jrt);
  Apps.addProgram(['Games', 'Jackreal Tournament', "Callum's LAN Party Guide"], note('CALLUM.TXT', CALLUM), I.txt);
  if (window.Setup && Setup.product) {
    Setup.product('pcgames.jaquake', { n: 'JAQUAKE 1.06 (shareware)', v: '1.06', kb: 18900, lic: 'Shareware', by: 'Jackware Software', cat: 'games', sq: 5, rel: '17/03/99',
      d: 'The rustiest first-person shooter on the planet. Three maps of tin robots, slime blobs and one VERY big blob, plus deathmatch and co-op on JackNet. Drop-down console. Rocket jumping. Everything goes POOF.',
      note: 'Shareware! Copy it for your mates. Episodes 2-4 by post.', apps: ['pcgames.jaquake'], paths: ['Games > JAQUAKE >'], icons: [], def: false, launch: 'pcgames.jaquake', exe: 'JAQUAKE.EXE', dir: 'Jaquake', ic: 'exe' });
    Setup.product('pcgames.jrt', { n: jrtFull() ? 'Jackreal Tournament' : 'Jackreal Tournament DEMO', v: jrtFull() ? '4.05' : '3.48 demo', kb: jrtFull() ? 48200 : 22100, lic: jrtFull() ? 'Commercial' : 'Demo', by: 'Wiggly Megagames', cat: 'games', sq: 5, rel: jrtFull() ? '22/11/99' : '28/09/99',
      d: 'Arena deathmatch and Capture the Flag against bots with names and attitudes, or against REAL people on JackNet. Low gravity in space. FIRST BLOOD! M-M-M-MONSTER KILL!',
      note: jrtFull() ? 'Callum always wins. Prove him wrong.' : 'Demo: two maps. The full game comes out on 22 November 1999.', apps: ['pcgames.jrt'], paths: ['Games > Jackreal Tournament >'], icons: [], def: false, launch: 'pcgames.jrt', exe: 'JRT.EXE', dir: 'JRT', ic: 'exe' });
  }
  // JackSpy 3D: the Internet game finder (lazy loaded, js/pcgames-spy.js)
  const SPY_ICON = '<svg viewBox="0 0 32 32"><circle cx="13" cy="13" r="10.5" fill="#2a6ad8" stroke="#000"/><path d="M5 10q8-4 16 0M4 15q9 4 18 0M13 3v20M8 5q-3 8 0 16M18 5q3 8 0 16" fill="none" stroke="#9ad0ff" stroke-width="1"/><path d="M20 20l9 9" stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"/><circle cx="13" cy="13" r="10.5" fill="none" stroke="#e8e8f0" stroke-width="2"/><text x="13" y="17" text-anchor="middle" font-family="Arial Black,Arial" font-weight="bold" font-size="9" fill="#ffd400" stroke="#000" stroke-width=".4">3D</text></svg>';
  I.spy = SPY_ICON;
  Apps.register('pcgames.spy', { single: true, cmd: ['jackspy', 'jackspy.exe', 'jackspy3d'], open(arg) {
    const body = document.createElement('div'); body.innerHTML = '<p style="padding:20px;font:12px Tahoma">Contacting the JackNet master server...</p>';
    const w = Apps.win('JackSpy 3D', body, { w: Math.min(720, innerWidth - 10), h: Math.min(520, innerHeight - 50), icon: SPY_ICON, menubar: true, status: true, minW: 300, minH: 260 });
    Apps.load('js/pcgames-grid.js').then(() => Apps.load('js/pcgames-arena.js')).then(() => Apps.load('js/pcgames-spy.js')).then(() => { if (!w.closed && window.PCGSpy) PCGSpy.app(w, body, arg); }).catch(e => { console.error(e); body.innerHTML = '<p style="padding:20px">JackSpy 3D could not start. (JACKSPY.DLL is missing. Have you tried turning it off and on again?)</p>'; });
    return w;
  } });
  Apps.addProgram(['Internet', 'JackSpy 3D'], 'pcgames.spy', SPY_ICON);
  if (window.Setup && Setup.product) Setup.product('pcgames.spy', { n: 'JackSpy 3D 2.10', v: '2.10', kb: 1450, lic: 'Shareware', by: 'JackSpy Industries', cat: 'net', sq: 5, rel: '04/10/99',
    d: 'Finds every Jackreal Tournament and JAQUAKE game on JackNet: pings, maps, who\'s playing. Join with one click. Quick Match picks the best game for you. Rankings too.',
    note: 'Unregistered shareware. It never actually stops working.', apps: ['pcgames.spy'], paths: ['Internet > JackSpy 3D'], icons: [], def: false, launch: 'pcgames.spy', exe: 'JACKSPY.EXE', dir: 'JackSpy 3D', ic: 'exe' });
  // The Frag Zone: a fan site with the 24/7 servers and the rankings
  if (window.IE && IE.addSite) {
    const page = () => { const el = document.createElement('div'); el.innerHTML = '<p style="font:12px Verdana;padding:20px">Loading the Frag Zone... (frames are coming soon)</p>'; Apps.load('js/pcgames-grid.js').then(() => Apps.load('js/pcgames-arena.js')).then(() => Apps.load('js/pcgames-spy.js')).then(() => { if (window.PCGSpy) PCGSpy.fan(el); }).catch(() => { el.innerHTML = '<h2>The page cannot be displayed</h2><p>The server is not answering. Try <b>Refresh</b>.</p>'; }); return el; };
    IE.addSite('www.fragzone.jnet', { title: 'The Frag Zone', desc: 'The No.1 Jackreal Tournament and JAQUAKE fan site on JackNet: 24/7 servers, the frag rankings, news and clans.', cat: 'games', pages: { '/': { title: 'The Frag Zone - JRT and JAQUAKE', html: page }, '/rankings.html': { title: 'The Frag Zone - Rankings', html: page }, '/servers.html': { title: 'The Frag Zone - Servers', html: page } } });
  }
  Apps.cmd(['quake', 'quake.exe'], () => Desk.msgbox('JackOS', "Cannot find 'JAQUAKE.EXE'. Did you mean JAQUAKE? (It's in Start > Programs > Games. It's cheaper.)", 'info'));
  Apps.defineSecret('fps.secrets', 'Secret squirrel', 'Find every secret area in a rusty shareware shooter');
  Apps.defineSecret('fps.iddqd', 'Wrong game, mate', 'Type a famous old cheat from a DIFFERENT game into a console');
  Apps.defineSecret('fps.boss', 'Big blob, big poof', 'Defeat whatever is snoring at the bottom of the Blob Pit');
  Apps.defineSecret('fps.squigjump', 'Rocket Jack', 'Fly using your own explosion');
  Apps.defineSecret('fps.firstblood', 'FIRST POOF!', 'Be the first to frag someone in an online tournament');
  Apps.defineSecret('fps.monster', 'M-M-M-MONSTER POOF', 'Frag five in quick succession');
  Apps.defineSecret('fps.combo', 'Shock and awe', 'Blow up your own slow purple ball with a fast purple beam');
  Apps.defineSecret('fps.ladder', 'Champion of 1999', 'Climb all the way to the top of a tournament ladder');
  Apps.defineSecret('fps.jrtcheat', 'Callum saw that', 'Fill your pockets the cheaty way in a tournament practice');
  Apps.defineSecret('fps.flag', 'Flag waver', 'Capture the enemy flag');
  Apps.defineSecret('fps.callum', 'Callum is not amused', 'Win a match against the bot who always wins');
  Apps.defineSecret('fps.nag', 'Pester power', 'Try to buy a game before it is out');
  Apps.defineSecret('fps.online', 'Online at last', 'Join a game on a JackNet server');
  Apps.defineSecret('fps.netwin', 'Champion of JackNet', 'Win an online Jackreal Tournament match');
  Apps.defineSecret('fps.jqwin', 'Rust in peace', 'Win an online deathmatch in a rusty shooter');
  Apps.defineSecret('fps.coop', 'Team players', 'Survive every wave of monsters with your mates');
  Apps.defineSecret('fps.quad', 'Power up!', 'Grab a damage power-up in an arena');
  Apps.defineSecret('fps.spy', 'I spy with my little eye', 'Find a game with a game finder');
  Apps.defineSecret('fps.fanzone', 'Fan club', 'Visit the No.1 fan site for two shooters');
  Apps.defineSecret('fps.infight', 'They never did get on', 'Get two different baddies to fall out with each other');
  Apps.defineSecret('fps.fizz', 'Not in the bath!', 'Use something electric where you really should not');
  window.PCGStub = { I, launch, play, GAMES, jrtFull, today, LIVE };
})();
