/* setup: installing and uninstalling programs on JackOS 98.
 * Every program on the PC belongs to a "product" (a JackOS component, or third-party software that came off the web, a
 * magazine cover disc or a CD-ROM). Uninstalling one really takes it away: its Start menu entries, desktop icons, Run
 * commands and windows. Get it back from Control Panel > Add/Remove Programs (JackOS Setup tab for JackOS components,
 * Install... for CD-ROMs and downloaded setup files) or download it again from The Shareware Shack
 * (http://www.sharewareshack.netz/), which goes through the File Download dialog and the InstallJack setup wizard.
 *   Setup.product(id, fields)  register a product (other packs call this at load time; see the catalogue below)
 *   Setup.has(id) / Setup.install(id) / Setup.uninstall(id) / Setup.download(id) / Setup.applet(tab)
 * State (roams with JackNet profiles): jhp_setup = { rm: {id: ts}, add: {id: ts}, noicon: {id: 1}, when: {id: 'dd/mm/99'}, dl: [...] } */
(function () {
  const A = window.Apps, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i, b), toast = (t, x, ms) => Desk.toast(t, x, ms);
  const J = (n, s) => (window.JICON && JICON.has(n)) ? (s ? JICON.get(n, s) : JICON.icon(n)) : A.ICON.exe;
  const mini = (svg, sz) => String(svg || '').replace('<svg', `<svg width="${sz || 32}" height="${sz || 32}"`);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const secret = id => A.secret(id);
  const SITE = 'www.sharewareshack.netz', SHACK = 'http://' + SITE + '/';
  const d99 = () => { const t = Desk.today99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; };
  const kbStr = kb => kb >= 1024 ? (kb / 1024).toFixed(1).replace(/\.0$/, '') + ' MB' : kb + ' KB';

  // ================================================================ the catalogue
  const PR = {}, ORDER = [];
  let shackOn = false, gate = null;
  const LIC = ['Freeware', 'Shareware', 'Demo', 'Adware', 'Postcardware', 'Pizzaware', 'JackOS component', 'Commercial'];
  // A FRESH PC (2.3): a brand-new visitor gets what a real 1998 family PC had out of the box, re-themed: JackOS and its
  // JackOS Setup components (Accessories, System Tools, Solitaire, FreeCell, Hearts, Bugsweeper, Media Player...),
  // JackNet Explorer, Outlook Express, the Online Services folder, the Games Cupboard and the cover CD. EVERY other
  // product is download-only (def:false), whatever its caller says: get it from the JackNet Software Centre
  // (setup-centre.js), The Shareware Shack, the programs' own web sites, Desktop Dazzle, JSN, or a CD-ROM.
  // Browsers that used the PC before this version keep everything they had (see LEGACY below).
  const FRESH = new Set(['online']);          // third-party things that DID come with the PC (the Online Services desktop folder)
  const OS_OFF = new Set(['spider', 'reversi']); // JackOS components a Typical setup leaves out (tick them in JackOS Setup)
  const OS_ADOPT = { sweeper: 'games' };       // came with the OS, so it lives in JackOS Setup > Games (not on the download sites)
  const ALLSOFT = /[?&]allsoft\b/.test(location.search); // testing: ?allsoft pretends everything is installed (nothing saved)
  function product(id, o) {
    o = Object.assign({ v: '1.0', kb: 200, lic: 'Freeware', by: 'Unknown', cat: 'util', sq: 3, rel: '01/01/99', d: '', apps: [], paths: [], icons: [], cmds: [] }, o, { id });
    if (OS_ADOPT[id] && !o.grp) Object.assign(o, { grp: OS_ADOPT[id], lic: 'JackOS component', by: 'JackOS' });
    o.def = o.def !== false; o.k = o.k || (o.grp ? 'os' : 'web');
    o.wasDef = o.def;
    if ((o.k === 'web' && !FRESH.has(id)) || (o.k === 'os' && OS_OFF.has(id))) o.def = false;
    if (!o.exe) o.exe = (o.n.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'PROGRAM').toUpperCase() + '.EXE';
    if (!o.dir) o.dir = o.n.replace(/\s+\d[\d.a-z]*$/i, '').replace(/[\\/:*?"<>|!]/g, '');
    if (!PR[id]) ORDER.push(id);
    PR[id] = o;
    if (gate) { rebuild(); refreshIcons(); }
    if (shackOn) registerShack();
    return o;
  }
  // JackOS 98 components (Control Panel > Add/Remove Programs > JackOS Setup), grouped like JackOS Setup groups
  const GROUPS = {
    acc: ['Accessories', 'Includes Calculator, Paint, WordPad, Imaging and other handy programs.'],
    games: ['Games', 'Solitaire, FreeCell, Hearts, Spider Solitaire and Reversi. Essential for "testing the mouse".'],
    savers: ['Screen Savers', 'Stops your monitor getting things burnt into it. Also very good to look at.'],
    comm: ['Communications', 'Phone Dialer, HyperTerminal, JackMeeting, Fax and WinPopup, for talking to other computers.'],
    mm: ['Multimedia', 'CD Player, Media Player, Sound Recorder and the Volume Control.'],
    access: ['Accessibility', 'Options to change keyboard, sound, display and mouse behaviour for people with mobility, hearing or visual impairments.'],
    sys: ['System Tools', 'Character Map, Clipboard Viewer, Backup, System Monitor and friends.'],
    office: ['Office Tools', 'JackCalc, Cardfile, Calendar, the Address Book and Object Packager. For "doing homework".'],
    old: ['JackOS 3.1 Leftovers', 'Program Manager, File Manager and Write. Dad says he "knows where everything is" in these.'],
  };
  const os = (id, grp, n, kb, apps, paths, x) => product(id, Object.assign({ grp, n, kb, apps, paths, lic: 'JackOS component', by: 'JackOS', v: '4.10.1998' }, x || {}));
  os('calc', 'acc', 'Calculator', 160, ['calc'], ['Accessories > Calculator'], { ic: 'calc', d: 'Adds up. Has a scientific mode for the brave.' });
  os('paint', 'acc', 'Paint', 340, ['mspaint'], ['Accessories > Paint'], { ic: 'paint', d: 'Draw pictures with the spray can, like a real artist.' });
  os('wordpad', 'acc', 'WordPad', 1100, ['office.wordpad'], ['Accessories > WordPad'], { ic: 'wordpad', d: 'Like Notepad, but with bold.' });
  os('imaging', 'acc', 'Imaging', 4400, ['office.imaging'], ['Accessories > Imaging'], { ic: 'picture', d: 'Look at scanned pictures and draw on them.' });
  os('quickview', 'acc', 'Quick View', 210, ['imgview'], ['Accessories > Image Viewer'], { ic: 'picture', d: 'Peeks at pictures without opening Paint.' });
  os('clock', 'acc', 'Clock', 24, ['office.clock'], ['Accessories > Clock'], { ic: 'clock', d: 'A clock. In a window.' });
  os('themes', 'acc', 'Desktop Themes', 24800, ['system.themes'], ['Accessories > Desktop Themes'], { ic: 'themes', d: 'Wallpapers, sounds and icons that match. 24.8 MB! That\'s about 17 floppies.' });
  os('sol', 'games', 'Solitaire', 180, ['sol'], ['Games > Solitaire'], { icons: ['iconSol'], ic: 'cards', d: 'The card game that has eaten more hours than anything else on Earth.' });
  os('freecell', 'games', 'FreeCell', 190, ['freecell'], ['Games > FreeCell'], { icons: ['iconFreecell'], ic: 'freecell', d: 'Almost every deal can be won. Almost.' });
  os('hearts', 'games', 'Hearts', 240, ['games.hearts'], ['Games > Hearts'], { ic: 'hearts', d: 'Avoid the Queen of Spades. Or shoot the moon.' });
  os('spider', 'games', 'Spider Solitaire', 260, ['games.spider'], ['Games > Spider Solitaire'], { ic: 'spider', d: 'Solitaire with eight legs.' });
  os('reversi', 'games', 'Reversi', 90, ['games.reversi'], ['Games > Reversi'], { ic: 'reversi', d: 'Black and white counters. Easy to learn, hard to beat the computer.' });
  [['ss.squigs', 'Flying Saucers'], ['ss.stars', 'Starfield Simulation'], ['ss.pipes', '3D Pipes'], ['ss.mystify', 'Mystify Your Mind'], ['ss.text', '3D Text'], ['ss.marquee', 'Marquee'], ['ss.curves', 'Curves and Colors'], ['ss.rain', 'Digital Rain']]
    .forEach(([id, n]) => os(id, 'savers', n, 60 + n.length * 9, [], ['Accessories > Screen Savers > ' + n].concat(n === '3D Text' ? ['Accessories > Screen Savers > 3D Text Setup...'] : []), { ic: 'screensaver', d: 'A screen saver.' }));
  os('dialer', 'comm', 'Phone Dialer', 120, ['dialer'], ['Accessories > Communications > Phone Dialer'], { ic: 'phone', d: 'Rings people using the modem. Mom says use the actual phone.' });
  os('hyper', 'comm', 'HyperTerminal', 600, ['office.hyper'], ['Accessories > Communications > HyperTerminal'], { ic: 'hyperterm', d: 'Dial into bulletin boards. Very green text.' });
  os('meeting', 'comm', 'JackMeeting', 3100, ['office.meeting'], ['Accessories > Communications > JackMeeting'], { ic: 'phone', d: 'Video calls! (If anyone had a webcam.)' });
  os('fax', 'comm', 'Fax', 1700, ['office.fax'], ['Accessories > Fax >'], { ic: 'printer', d: 'Send faxes from the computer. Nobody you know has a fax.' });
  os('winpopup', 'comm', 'WinPopup', 60, [], ['Accessories > Communications > WinPopup'], { cmds: ['winpopup', 'net send'], ic: 'popup', d: 'Pop up messages on other computers. Teachers hate it.' });
  os('icw', 'comm', 'Internet Connection Wizard', 900, ['system.icw'], ['Accessories > Communications > Internet Connection Wizard'], { ic: 'icw', d: 'Sets up your Internet. Asks a LOT of questions.' });
  os('channels', 'comm', 'Channel Guide', 420, ['system.channels'], ['Accessories > Communications > Channel Guide'], { ic: 'channels', d: 'Push technology! The Internet comes to YOU. (Slowly.)' });
  os('cdplayer', 'mm', 'CD Player', 110, ['carta.cdplayer'], ['Accessories > Entertainment > CD Player'], { ic: 'cdplayer', d: 'Plays music CDs in the CD-ROM drive.' });
  os('mplayer', 'mm', 'Media Player', 380, ['carta.mplayer'], ['Accessories > Entertainment > Media Player'], { icons: ['ct-dicon-mplayer'], ic: 'media', d: 'Plays AVI videos the size of a stamp.' });
  os('sndrec', 'mm', 'Sound Recorder', 90, ['system.sndrec', 'sndrec'], ['Accessories > Entertainment > Sound Recorder'], { ic: 'mic', d: 'Record yourself saying "EX-TER-MIN-ATE" and set it as the startup sound.' });
  os('sndvol', 'mm', 'Volume Control', 70, ['system.sndvol'], ['Accessories > Entertainment > Volume Control'], { ic: 'sound', d: 'Turn it up. Turn it down. Mom: turn it DOWN.' });
  os('magnify', 'access', 'Magnifier', 80, ['office.magnify'], ['Accessories > Accessibility > Magnifier'], { ic: 'magnifier', d: 'Makes the screen bigger.' });
  os('accwiz', 'access', 'Accessibility Wizard', 300, ['system.accwiz'], ['Accessories > Accessibility > Accessibility Wizard'], { ic: 'access', d: 'Bigger text, sticky keys and more.' });
  os('charmap', 'sys', 'Character Map', 60, ['charmap'], ['Accessories > System Tools > Character Map'], { ic: 'charmap', d: 'Every letter in every font. For typing é.' });
  os('clipbrd', 'sys', 'Clipboard Viewer', 40, ['clipbrd'], ['Accessories > System Tools > Clipboard Viewer'], { ic: 'clipboard', d: 'See what you copied. Thrilling.' });
  os('rsrcmtr', 'sys', 'System Resource Meter', 30, ['system.rsrcmtr'], ['Accessories > System Tools > Resource Meter'], { ic: 'rsrc', d: 'Shows how close the computer is to falling over.' });
  os('backup', 'sys', 'Backup', 4300, ['system.backup'], ['Accessories > System Tools > Backup'], { ic: 'backup', d: 'Backs up your files onto 412 floppy disks.' });
  os('sysmon', 'sys', 'System Monitor', 150, ['system.sysmon'], ['Accessories > System Tools > System Monitor'], { ic: 'sysmon', d: 'Graphs! Of the processor! Going up and down!' });
  os('sched', 'sys', 'Scheduled Tasks', 200, ['system.sched'], ['Accessories > System Tools > Scheduled Tasks'], { ic: 'sched', d: 'Runs things at 3am when everyone is asleep.' });
  os('tuneup', 'sys', 'Maintenance Wizard', 220, ['system.tuneup'], ['Accessories > System Tools > Maintenance Wizard'], { ic: 'tuneup', d: 'Makes your computer faster (it says).' });
  os('cleanmgr', 'sys', 'Disk Cleanup', 120, ['system.cleanmgr'], ['Accessories > System Tools > Disk Cleanup'], { ic: 'cleanup', d: 'Empties the Temporary Internet Files. All 40 MB of them.' });
  os('jcalc', 'office', 'JackCalc Spreadsheet', 2300, ['office.calc'], ['Accessories > Office Tools > JackCalc Spreadsheet'], { ic: 'spreadsheet', d: 'Rows and columns of numbers. Dad does the gas bill in it.' });
  os('cardfile', 'office', 'Cardfile', 90, ['office.cardfile'], ['Accessories > Office Tools > Cardfile'], { ic: 'cardfile', d: 'Index cards, on the computer.' });
  os('calendar', 'office', 'Calendar', 140, ['office.calendar'], ['Accessories > Office Tools > Calendar'], { ic: 'calendar', d: 'Shows 1999. Only 1999.' });
  os('abook', 'office', 'Address Book', 260, ['office.abook'], ['Accessories > Address Book'], { ic: 'addressbook', d: 'Everyone\'s e-mail address. All six of them.' });
  os('packager', 'office', 'Object Packager', 70, ['office.packager'], ['Accessories > Office Tools > Object Packager'], { ic: 'package', d: 'Nobody knows what this does.' });
  os('dadpc', 'old', 'JackOS 3.1 Leftovers', 820, ['office.progman', 'office.winfile', 'office.write'], ['Dad\'s Old Computer >'], { icons: ['iconOfficeProgman'], ic: 'oldpc', d: 'Program Manager, File Manager and Write, copied off Dad\'s old 386.' });

  // third-party software (downloads, cover discs and CD-ROMs)
  const sw = (id, o) => product(id, o);
  sw('jackamp', { n: 'JackAmp 2.0 MIDI Edition', v: '2.0', kb: 1640, lic: 'Freeware', by: 'JackSoft (Jack)', cat: 'mm', sq: 5, rel: '20/02/99', ic: 'jackamp', home: 'jackamp',
    apps: ['jackamp'], paths: ['JackAmp >', 'Accessories > Entertainment > JackAmp'], icons: ['@JackAmp'], exe: 'JACKAMP.EXE', dir: 'JackAmp',
    d: 'The media player that really whips the... (Mom said no). Playlist, graphic equaliser, a spectrum analyser that goes all bouncy, and a mixtape of original MIDIs.', note: 'Skins coming in version 3! Probably.' });
  sw('grotchi', { n: 'Jackotchi Virtual Pet 1.0', kb: 210, lic: 'Freeware', by: 'Gubbinz Software Ltd', cat: 'fun', sq: 4, rel: '03/03/99', ic: 'grotchi', apps: ['grotchi'], paths: ['Accessories > Jackotchi'], exe: 'JACKOTCHI.EXE', d: 'A virtual pet on your desktop. Feed it, clean up after it, and don\'t leave it alone all weekend.' });
  sw('uhoh', { n: 'Uh-Oh! Messenger 99a', v: '99a', kb: 2900, lic: 'Freeware', by: 'Uh-Oh! Communications', cat: 'net', sq: 5, rel: '15/01/99', ic: 'messenger', home: 'uhoh',
    apps: ['social.uhoh'], paths: ['Accessories > Communications > Uh-Oh! Messenger', 'Internet > Uh-Oh! Messenger'], icons: ['iconUhOh'], cmds: ['nudge', 'buzz'], exe: 'UHOH.EXE', dir: 'Uh-Oh!',
    d: 'Instant messages! Get your own Uh-Oh! number, add your mates and see who\'s online. Uh-oh! (That\'s the noise it makes.)' });
  sw('irc', { n: 'JackIRC 1.99', v: '1.99', kb: 1100, lic: 'Shareware', by: 'Room 14 Software', cat: 'net', sq: 5, rel: '09/01/99', ic: 'whiteboard', home: 'jackirc', apps: ['social.irc'], paths: ['Internet > JackIRC'], exe: 'JACKIRC.EXE',
    d: 'Internet Relay Chat with channels, /commands and a bot called JackServ. Type /join #jackattack and say hello.', note: 'Registering costs £10. Or press "Continue" for ever. Your choice.' });
  sw('hangout', { n: 'JackNet Hangout Pack', kb: 2400, lic: 'Freeware', by: 'JackNet', cat: 'net', sq: 4, rel: '01/04/99', ic: 'magnets', apps: ['social.hang', 'social.fridge', 'social.cork', 'social.capsule', 'social.throw', 'social.parcel'],
    paths: ['JackNet Hangout >'], icons: ['iconHangout', 'iconSnowball'], d: 'Fridge magnet poetry, the corkboard, the time capsule, snowball fights and pass the parcel with everyone online.' });
  sw('wb', { n: 'JackNet Whiteboard', kb: 640, lic: 'Freeware', by: 'JackNet', cat: 'net', sq: 4, rel: '12/02/99', ic: 'whiteboard', apps: ['social.wb'], paths: ['Accessories > Communications > JackNet Whiteboard'], d: 'Draw on the same picture as everyone else on JackNet at the same time. Please don\'t draw rude things.' });
  sw('radio', { n: 'JackNet Radio Tuner', kb: 380, lic: 'Freeware', by: 'JackNet', cat: 'mm', sq: 3, rel: '30/03/99', ic: 'radio', apps: ['social.radio'], paths: ['Accessories > Communications > JackNet Radio'], d: 'Internet radio! Everybody hears the same song at the same time. Like real radio, but with buffering.' });
  sw('zone', { n: 'JackNet Gaming Zone', kb: 3300, lic: 'Freeware', by: 'JackNet Zone', cat: 'games', sq: 5, rel: '01/02/99', ic: 'zone', home: 'http://www.jacknetzone.jnet/', apps: ['zone'], paths: ['Games > Internet Games >'], icons: ['iconZone'],
    d: 'Play Reversi, Checkers, Battleships, Backgammon and more against real people over the Internet. Lag included free.' });
  sw('online', { n: 'Online Services Sampler', kb: 9800, lic: 'Demo', by: 'Various', cat: 'net', sq: 1, rel: '01/09/98', ic: 'online', apps: ['online'], paths: ['Online Services >'], icons: ['iconOnline'], disc: 'NetPlanet 4.0 FREE trial CD (came in the post)',
    d: 'NetPlanet 4.0, FreeSurfa, RupeeLink Unlimited and Dial-a-Dave. 50 FREE hours!* (*in the first month, at peak rate, per hour)', restart: true });
  sw('ticker', { n: 'Jack Ticker 98', kb: 160, lic: 'Freeware', by: 'Jack Stock Exchange', cat: 'net', sq: 3, rel: '10/11/98', ic: 'sysmon', home: 'http://www.jackexchange.grot/', apps: ['econ.ticker'], paths: ['Internet > Rupees > Jack Ticker 98'], d: 'Live share prices scrolling across your desktop. Buy low, sell high, panic always.' });
  sw('carta', { n: 'JackCarta 99', v: '99', kb: 412000, lic: 'Commercial', by: 'JackSoft Reference', cat: 'edu', sq: 5, rel: '01/10/98', ic: 'carta', home: 'jackcarta', apps: ['carta.encyc'], paths: ['JackCarta 99 >'], icons: ['ct-dicon-carta'],
    disc: 'JackCarta 99 CD-ROM (Disc 1 of 2)', nodl: true, exe: 'JCARTA.EXE', d: 'The multimedia encyclopedia on CD-ROM. Hundreds of articles, pictures, the Quiz Keep and a timeline. CD-ROM only: 412 MB would take about 17 hours on a 56K modem.' });
  sw('typing', { n: 'Gubbinz Teaches Typing', kb: 2900, lic: 'Commercial', by: 'JackSoft Learning', cat: 'edu', sq: 4, rel: '01/08/98', ic: 'typing', apps: ['carta.typing'], paths: ['Gubbinz Teaches Typing >'], disc: 'JackCarta 99 CD-ROM (Disc 2 of 2)',
    d: 'Learn to type with all ten fingers, with Gubbinz, plus Meteor Typer, the typing game where meteors fall and you type them to dust.' });
  sw('stamp', { n: 'Stamp Studio', kb: 3800, lic: 'Commercial', by: 'JackSoft Kids', cat: 'fun', sq: 5, rel: '01/11/98', ic: 'stamp', apps: ['carta.stamp'], paths: ['Stamp Studio >'], disc: 'JackCarta 99 CD-ROM (Disc 2 of 2)',
    d: 'The art program with stamps, silly sounds and the dynamite that blows your picture up.' });
  const game = (id, n, app, ic, kb, sq, rel, d, x) => sw(id, Object.assign({ n, kb, lic: 'Freeware', by: 'Hot Jack Games', cat: 'games', sq, rel, ic, apps: [app], paths: ['Games > ' + n.replace(/ \d.*$/, '')], d }, x || {}));
  game('pinball', 'Space Jack Pinball', 'games.pinball', 'pinball', 2200, 5, '01/07/98', 'Full-table space pinball with flippers, bumpers, ramps, missions and a launch plunger. Tilt at your peril.', { icons: ['iconPinball'], lic: 'Freeware', by: 'Mekboy Interactive' });
  game('ski', 'SkiJack', 'games.ski', 'ski', 120, 5, '14/12/98', 'Ski down the mountain. Avoid the trees. Do NOT go too far down the mountain. (Press F to go faster.)', { disc: 'JACK ATTACK! Cover Disc 7' });
  game('podracer', 'Pod Jack Racer', 'games.podracer', 'podracer', 3400, 4, '19/05/99', 'Race pods through the desert at 600 mph. Unofficial. Not affiliated with any galaxy.', { lic: 'Demo', disc: 'JACK ATTACK! Cover Disc 7' });
  game('pipe', 'Pipe Jack', 'games.pipe', 'pipe', 260, 4, '02/02/99', 'Lay the pipes before the slime comes. Then lay them faster.', { disc: 'JACK ATTACK! Cover Disc 7' });
  game('mahjong', 'Jack Jong', 'games.mahjong', 'mahjong', 540, 4, '22/01/99', 'Match the tiles. Clear the pile. Pretend it\'s relaxing.');
  game('slide', 'Slider 15', 'games.slide', 'slider', 40, 3, '05/05/98', 'The sliding 15 puzzle. Now with pictures.', { lic: 'Freeware', by: 'Megahertz Mike' });
  game('jigsaw', 'Jigsaw 98', 'games.jigsaw', 'jigsaw', 820, 3, '11/11/98', 'Jigsaws on the computer: no lost pieces down the back of the sofa.', { lic: 'Shareware' });
  game('chess', 'Jack Chess', 'games.chess', 'chess', 700, 4, '17/02/99', 'Chess against a robot who has read one book about chess. Twice.');
  game('cubetrain', 'Cube Net Trainer', 'games.cube', 'cube', 300, 5, '08/03/99', 'Learn to solve the cube, one layer at a time, then race the clock.', { lic: 'Freeware', by: 'The Cube Speed Records Page', home: 'http://www.cuberecords.infobahn/' });
  game('grotlings', 'Jacklings', 'games.grotlings', 'grotlings', 1500, 5, '01/04/99', 'Little Jacklings walk off cliffs unless you give them jobs. Diggers, blockers, builders, and the big red button.', { lic: 'Demo', disc: 'JACK ATTACK! Cover Disc 7' });
  sw('grotquest', { n: 'Jack Quest', kb: 340, lic: 'Shareware', by: 'Bedroom Coders UK', cat: 'dos', sq: 5, rel: '06/06/98', ic: 'adventure', apps: ['dos.run:JACKQUEST'], paths: ['Games > Jack Quest'], exe: 'JACKQUEST.EXE', d: 'A text adventure. You are standing in a dark room. There is a lamp here. > EAT LAMP' });
  sw('dosgames', { n: 'DOS Shareware Collection', kb: 2100, lic: 'Shareware', by: 'Various', cat: 'dos', sq: 4, rel: '01/12/98', ic: 'dos', apps: ['dos.run:JACKCRAWL', 'dos.run:DAKKA', 'dos.run:SQUIGPIE', 'dos.run:SQUIGHUNT', 'dos.run:TRUKKRACE', 'dos.run:GEMWARS', 'dos.run:TEEFWARS'],
    paths: ['Games > DOS Shareware >'], disc: 'JACK ATTACK! Cover Disc 7', d: 'Six DOS games on one disk: Jack Crawl, Flak Attack!, Chip Van Tycoon, Alien Hunt, Turbo Racer and the Gem Wars BBS door. Register them all for £45!' });
  sw('jbasic', { n: 'JBASIC 1.1', v: '1.1', kb: 190, lic: 'Freeware', by: 'Room 14 Computer Club', cat: 'dos', sq: 4, rel: '20/09/98', ic: 'jbasic', home: 'http://room14.cyb/', apps: ['dos.run:JBASIC', 'dos.run:QBASIC'], paths: ['Accessories > JBASIC'], d: 'Write your own programs! 10 PRINT "DAVE IS SMELLY" 20 GOTO 10' });
  sw('gc', { n: 'Jack Commander 3.0', v: '3.0', kb: 280, lic: 'Shareware', by: 'Gubbinz Software Ltd', cat: 'dos', sq: 4, rel: '14/10/98', ic: 'dos', apps: ['dos.run:GC'], paths: ['Accessories > System Tools > Jack Commander'], d: 'Two blue panels full of files. F5 copies, F8 deletes, F10 quits. Once you\'ve used it you\'ll never go back.' });
  sw('intro', { n: 'JACK INTRO (demoscene)', kb: 64, lic: 'Freeware', by: 'JaCk/R00M14', cat: 'mm', sq: 5, rel: '31/12/98', ic: 'dos', apps: ['dos.run:INTRO'], paths: ['Accessories > Entertainment > JACK INTRO (demo)'], d: 'A 64 KB intro with plasma, a starfield, a scroller and greetz. Greetz to everyone. Especially Dave.' });
  sw('cubetimer', { n: 'Cube Timer 2.0', v: '2.0', kb: 30, lic: 'Freeware', by: 'Megahertz Mike', cat: 'util', sq: 4, rel: '08/03/99', ic: 'cube', paths: ['Accessories > Cube Timer 2.0'], cmds: ['cubetime'], d: 'Times your Rubrick\'s Cube solves to the hundredth of a second. Includes an average of 5.' });
  sw('y2kpatch', { n: 'JackOS Y2K Compliance Patch', kb: 1900, lic: 'Freeware', by: 'JackOS', cat: 'util', sq: 3, rel: '01/06/99', ic: 'y2k', apps: ['system.y2kpatch'], paths: ['Accessories > System Tools > Y2K Compliance Patch', 'Accessories > System Tools > Y2K Checker'], cmds: ['y2k'],
    d: 'Makes your computer ready for the year 2000. Probably. ' + Cast.n('kidY2k') + ' says it\'s not enough and you need tins of beans as well.', restart: true });

  // ================================================================ state + the gate
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const hadSetup = lsGet('jhp_setup') != null;
  let S = store.get('jhp_setup', {}); if (!S || typeof S !== 'object' || Array.isArray(S)) S = {};
  const norm = () => { ['rm', 'add', 'noicon', 'when'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; }); if (!Array.isArray(S.dl)) S.dl = []; };
  norm();
  const save = () => store.set('jhp_setup', S);
  // ---- the fresh-PC migration (runs once per setup state, and the state roams, so once per member).
  // A state without v:2 that belongs to someone who used this PC before (a saved jhp_setup, a finished boot, or a
  // member's roamed profile) gets every product that WAS pre-installed for them in 2.2 marked as installed, unless
  // they had removed it. A brand-new visitor starts fresh. (roam.js keeps a member's own jhp_setup over a guest's.)
  const LEGACY = ['spider', 'reversi', 'jackamp', 'grotchi', 'uhoh', 'irc', 'hangout', 'wb', 'radio', 'zone', 'online', 'ticker', 'carta', 'typing', 'stamp',
    'pinball', 'ski', 'podracer', 'pipe', 'mahjong', 'slide', 'jigsaw', 'chess', 'cubetrain', 'grotlings', 'grotquest', 'dosgames', 'jbasic', 'gc', 'intro',
    'cubetimer', 'y2kpatch', 'pcgames.jaquake', 'pcgames.jrt', 'sweeper', 'grotball', 'revenge', 'maze', 'island', 'staples', 'happy99', 'ramdbl', 'prank',
    'winsquig', 'ssdance', 'squigso', 'hpz'];
  if (S.v !== 2) {
    // (boot.js marks the PC as booted as soon as it loads, so ask boot-early.js what it was before this visit)
    const everBooted = typeof window.JHPEverBooted === 'boolean' ? window.JHPEverBooted : lsGet('jhp_everbooted') === '1';
    if (hadSetup || everBooted || lsGet('jhp_roam_who')) { const t = Date.now(); LEGACY.forEach(id => { if (!S.rm[id] && !S.add[id]) S.add[id] = t; }); S.mig = 1; }
    S.v = 2; save();
  }
  const has = id => { const p = PR[id]; if (!p) return true; if (p.tb) return !!(window.OldPC && OldPC.installed.includes(p.tb)); if (ALLSOFT) return true; return p.def ? !S.rm[id] : !!S.add[id]; };
  function rebuild() {
    const g = { apps: new Set(), exact: new Set(), pre: [], icons: new Set(), cmds: new Set() };
    for (const id of ORDER) {
      const p = PR[id];
      if (!has(id)) { p.apps.forEach(a => g.apps.add(a)); p.paths.forEach(x => x.endsWith(' >') ? g.pre.push(x + ' ') : g.exact.add(x)); p.icons.forEach(i => g.icons.add(i)); p.cmds.forEach(c => g.cmds.add(c.toLowerCase())); }
      else if (S.noicon[id]) p.icons.forEach(i => g.icons.add(i));
    }
    gate = g;
    document.body && document.body.classList.toggle('no-uhoh', !has('uhoh'));
  }
  rebuild();
  const ownerOf = (app, arg) => ORDER.find(id => !has(id) && (PR[id].apps.includes(app) || (arg != null && PR[id].apps.includes(app + ':' + String(arg).toUpperCase()))));
  function ok(app, arg) { return !(gate.apps.has(app) || (arg != null && typeof arg === 'string' && gate.apps.has(app + ':' + arg.toUpperCase()))); }
  function showProgram(p) {
    const ps = p.path.join(' > ');
    if (gate.exact.has(ps) || gate.pre.some(x => ps.startsWith(x))) return false;
    return !(typeof p.target === 'string' && gate.apps.has(p.target));
  }
  const blockedCmd = key => gate.cmds.has(key);
  function missingFor(pid, what) {
    const p = PR[pid];
    if (!p) return msg('JackOS', `Cannot find '${what}'. Make sure the name is correct.`, 'warn');
    sfx('beep');
    const where = p.k === 'os' ? 'It\'s a JackOS component: put it back from Control Panel > Add/Remove Programs > JackOS Setup (have the JackOS 98 CD-ROM handy).'
      : p.nodl ? `Put the ${p.disc} in the CD-ROM drive and use Control Panel > Add/Remove Programs > Install.`
      : `You can download it again from The Shareware Shack (${SITE})${p.disc ? ', or install it from the ' + p.disc : ''}.`;
    const when = S.when[pid] ? ` You removed it on ${S.when[pid]}.` : (p.def ? '' : ' It has never been installed on this computer.');
    msg('Problem with Shortcut', `The item '${p.exe}' that this shortcut refers to has been changed or moved, so this shortcut will no longer work properly.\n\n${p.n} is not installed.${when}\n\n${where}`, 'warn',
      p.k === 'os' || p.nodl ? [['Add/Remove...', () => applet(p.k === 'os' ? 1 : 0)], ['OK']] : [['Get it now', () => showSoft(pid)], ['OK']]);
  }
  const missing = (app, arg) => missingFor(ownerOf(app, arg), app);
  const missingCmd = key => missingFor(ORDER.find(id => !has(id) && PR[id].cmds.map(c => c.toLowerCase()).includes(key)), key);

  // which programs are running (for "please close it first")
  const running = new Map(); // product id -> Set of windows
  function track(app, w, arg) {
    try { nag(app, arg, w); } catch (e) {}
    const add = x => { if (!x || !x.el) return; if (GAMEISH.test(app)) x.el.dataset.game = '1'; ORDER.forEach(id => { const p = PR[id]; if (p.apps.includes(app) || (arg != null && p.apps.includes(app + ':' + String(arg).toUpperCase()))) { if (!running.has(id)) running.set(id, new Set()); running.get(id).add(x); } }); };
    if (w && typeof w.then === 'function') w.then(add, () => {}); else add(w);
  }
  // shareware nags now and then ("Day 31 of your 30-day evaluation"). Never in the middle of a game: a game's nag waits
  // until its window is closed, and no nag pops while a game window is in front, the mouse is captured or it's full screen.
  // At most one every few minutes.
  const nagged = new Set();
  const GAMEISH = /^(pcgames\.(jaquake|jrt)|discs|games\.|dos\.run|zone\.|grind\.|squig)/;
  let nagAt = 0;
  const nagBusy = () => !!(document.pointerLockElement || document.fullscreenElement || document.webkitFullscreenElement
    || qsa(document, '.float[data-game]').some(e => e.isConnected && Desk.isActive && Desk.isActive(e))
    || qsa(document, '.float').some(e => e.offsetWidth && /Setup|Connect|Wizard|Sign[ -]?(Up|In)|Log ?On/i.test(e.getAttribute('aria-label') || ''))); // a program's own first dialog
  function nag(app, arg, w) {
    const id = ORDER.find(x => PR[x].lic === 'Shareware' && !PR[x].nonag && (PR[x].apps.includes(app) || (arg != null && PR[x].apps.includes(app + ':' + String(arg).toUpperCase()))));
    if (!id || nagged.has(id) || Date.now() - nagAt < 240000 || Math.random() > 0.3) return;
    nagged.add(id); nagAt = Date.now();
    const p = PR[id], since = S.add[id] || store.get('jhp_setup_first', 0) || (store.set('jhp_setup_first', Date.now()), Date.now());
    const day = 31 + Math.floor((Date.now() - since) / 864e5) + ORDER.indexOf(id) % 40;
    let tries = 0, mine = w && !w.then ? w : null;
    if (w && typeof w.then === 'function') w.then(x => { mine = x; }, () => {});
    // wait for a quiet moment: no game in front, and (for an ordinary program) its own window in front, not its connect dialog
    const when = () => { if (mine && (mine.closed || !mine.el || !mine.el.isConnected)) return; if ((nagBusy() || (mine && !(Desk.isActive && Desk.isActive(mine.el)))) && ++tries < 900) { setTimeout(when, 2000); return; } nagAt = Date.now(); show(); };
    if (p.cat === 'games' || GAMEISH.test(app)) { // a game: say it on the way out
      const watch = x => { if (!x || !x.el) return; const iv = setInterval(() => { if (x.closed || !x.el.isConnected) { clearInterval(iv); mine = null; setTimeout(when, 700); } }, 1000); };
      if (w && typeof w.then === 'function') w.then(watch, () => {}); else watch(w);
      return;
    }
    setTimeout(when, 2500); // (after any connect/setup dialog the program opens itself)
    function show() {
      const d = A.ui.dialog(p.n + ' - Unregistered', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(J(p.ic || 'exe'))}<div><p style="margin:0 0 6px"><b>Thank you for trying ${esc(p.n)}!</b></p><p style="margin:0 0 6px">This is day <b>${day}</b> of your 30-day evaluation period.</p><p style="margin:0 0 6px">${esc(p.n)} is shareware. If you keep using it, you are expected to register it. Registering costs less than a pizza and makes ${esc(p.by)} very happy.</p><p class="small su-nagc" style="margin:0">Continue will be available in 5 seconds...</p></div></div>`,
        [['Register...', () => { secret('setup.nag'); msg('Register ' + p.n, `To register, send a cheque or postal order for £10 to:\n\n${p.by}\nPO Box 1999\n\nPlease allow 28 days for your registration code to arrive by post. (On a floppy disk. In a padded envelope.)`, 'info'); }], ['Continue']], { w: 400, icon: J(p.ic || 'exe', 16) });
      if (!d || !d.b) return;
      const cont = [...d.b.querySelectorAll('.pg-dlgbtns .btn')].find(x => x.textContent === 'Continue'), lab = qs(d.b, '.su-nagc');
      if (!cont) return; cont.disabled = true; let n = 5;
      const iv = setInterval(() => { n--; if (n <= 0 || d.w.closed) { clearInterval(iv); cont.disabled = false; if (lab) lab.textContent = 'Thank you for your patience.'; } else if (lab) lab.textContent = `Continue will be available in ${n} second${n === 1 ? '' : 's'}...`; }, 1000);
    }
  }
  const openWins = pid => [...(running.get(pid) || [])].filter(w => !w.closed && w.el && w.el.isConnected);

  // ---- desktop icons come and go
  function refreshIcons() {
    if (!gate) return;
    qsa(document, '.icons .dicon').forEach(b => {
      const lab = ((qs(b, 'span') || b).textContent || '').trim();
      b.classList.toggle('setup-gone', (b.id && gate.icons.has(b.id)) || gate.icons.has('@' + lab));
    });
  }
  function watchIcons() { const box = qs(document, '.icons'); if (box) new MutationObserver(refreshIcons).observe(box, { childList: true }); refreshIcons(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { rebuild(); watchIcons(); }); else watchIcons();

  function changed(pid, on) {
    rebuild(); refreshIcons(); save();
    document.dispatchEvent(new CustomEvent('setup', { detail: { id: pid, on } }));
    freshCheck();
  }
  function setInstalled(pid, on, o) {
    const p = PR[pid]; if (!p) return; o = o || {};
    if (p.tb) { if (window.OldPC) on ? OldPC.install(p.tb) : OldPC.remove(p.tb); changed(pid, on); return; }
    if (on) { delete S.rm[pid]; if (!p.def) S.add[pid] = Date.now(); if (o.noIcon) S.noicon[pid] = 1; else delete S.noicon[pid]; delete S.when[pid]; }
    else { if (p.def) S.rm[pid] = Date.now(); delete S.add[pid]; S.when[pid] = d99(); openWins(pid).forEach(w => w.close()); }
    const log = store.get('jhp_setup_log', []); log.push([Date.now(), pid, on ? 1 : 0]); store.set('jhp_setup_log', log.slice(-60));
    if (on && log.some(([, id, v]) => id === pid && !v)) secret('setup.reinstall');
    if (!on && log.filter(x => !x[2]).length >= 5) secret('setup.spring');
    changed(pid, on);
  }

  // ================================================================ styles
  const css = h(null, null, 'style'); css.id = 'setup-css';
  css.textContent = `
.dicon.setup-gone{display:none!important}
body.no-uhoh #soLinkUhOh,body.no-uhoh .so-tray,body.no-uhoh #soBadge{display:none!important}
.ig-bg{position:fixed;left:0;top:0;right:0;bottom:32px;background:linear-gradient(#0000b8,#000018);color:#fff;overflow:hidden;font-family:"Times New Roman",serif}
.ig-bg .ig-title{position:absolute;left:28px;top:14px;font:italic bold 34px/1.1 "Times New Roman",serif;text-shadow:3px 3px 0 #000;max-width:calc(100% - 40px)}
.ig-bg .ig-by{position:absolute;right:16px;bottom:10px;font:italic 13px Arial,sans-serif;opacity:.7}
.ig-bg .ig-bill{position:absolute;left:28px;bottom:26px;width:min(340px,calc(100% - 56px));background:#fff;color:#000;border:2px solid #000;box-shadow:4px 4px 0 rgba(0,0,0,.5);padding:10px 12px;font:13px/1.35 Arial,sans-serif;display:none}
.ig-bg .ig-bill b{display:block;font-size:15px;color:#0000a0;margin-bottom:3px}
.ig-bg.copying .ig-bill{display:block}
.ig{font:11px/1.35 Tahoma,"MS Sans Serif",sans-serif;color:#000}
.ig-main{display:flex;gap:12px;min-height:250px}
.ig-side{width:120px;flex:none;background:linear-gradient(160deg,#0a6a8a,#002a4a);border:1px solid #808080;border-right-color:#fff;border-bottom-color:#fff;display:flex;align-items:center;justify-content:center}
.ig-side svg{width:110px;height:auto}
.ig-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.ig-body h3{font:bold 13px Tahoma,sans-serif;margin:0 0 4px}
.ig-body p{margin:0 0 6px}
.ig-lic{height:120px;overflow:auto;background:#fff;border:2px inset #fff;padding:4px 6px;white-space:pre-wrap;font:11px/1.3 "Courier New",monospace}
.ig-field{background:#fff;border:2px inset #fff;padding:3px 6px;font:11px Tahoma,sans-serif;word-break:break-all}
.ig-group{border:1px solid #808080;box-shadow:1px 1px 0 #fff inset,1px 1px 0 #fff;padding:8px 8px 6px;position:relative;margin-top:6px}
.ig-group > b{position:absolute;top:-8px;left:8px;background:#c0c0c0;padding:0 3px;font-weight:normal}
.ig-line{display:flex;align-items:center;gap:6px;margin:8px 0 6px;color:#808080}
.ig-line::after{content:"";flex:1;border-top:1px solid #808080;border-bottom:1px solid #fff}
.ig-btns{justify-content:flex-end;gap:6px}.ig-btns .btn{min-width:76px}
.ig-cur{font:11px "Courier New",monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:4px 0}
.ig-list{background:#fff;border:2px inset #fff;height:96px;overflow:auto;padding:2px}
.ig-list div{padding:1px 4px;cursor:default}.ig-list div.sel{background:#000080;color:#fff}
.ig label{display:flex;align-items:flex-start;gap:5px;margin:3px 0}
.ig .ig-sneaky{font-size:10px;color:#444}
@media (max-width:560px){.ig-side{display:none}.ig-bg .ig-title{font-size:24px}}
.dl{font:11px/1.4 Tahoma,"MS Sans Serif",sans-serif}
.dl-anim{position:relative;height:44px;margin:2px 0 8px}
.dl-anim .a{position:absolute;top:4px}
.dl-anim .a.l{left:4px}.dl-anim .a.r{right:4px}
.dl-anim .pp{position:absolute;top:8px;left:44px;width:14px;height:16px;animation:dlfly 1.2s linear infinite}
.dl-anim .pp:nth-child(4){animation-delay:.4s}.dl-anim .pp:nth-child(5){animation-delay:.8s}
@keyframes dlfly{0%{left:40px;top:14px;opacity:0}15%{opacity:1}50%{top:0}85%{opacity:1}100%{left:calc(100% - 58px);top:14px;opacity:0}}
.dl.paused .pp{animation-play-state:paused}
.dl-grid{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;margin:8px 0}
.dl-grid span:nth-child(odd){white-space:nowrap}
.dl-grid span{min-width:0;overflow:hidden;text-overflow:ellipsis}
.su-li{display:flex;align-items:center;gap:6px;padding:1px 4px;cursor:default}.su-li.sel{background:#000080;color:#fff}.su-li svg{flex:none}
.su-li .sz{margin-left:auto;padding-left:8px}
.su-info{min-height:34px;margin:4px 0}
.su-strip{position:relative;z-index:2;margin:0 0 8px;padding:5px 8px;background:linear-gradient(#fffbd0,#ffef8a);border:2px solid #000080;box-shadow:3px 3px 0 rgba(0,0,0,.35);font:11px/1.35 Tahoma,Verdana,sans-serif;color:#000;display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;text-align:left}
.su-strip .su-st-h{font:bold 12px Verdana,sans-serif;color:#000080;letter-spacing:1px}
.su-strip .su-st-i{display:inline-flex;align-items:center;gap:5px;min-width:0}
.su-strip .su-st-i small{color:#555;white-space:nowrap}
.su-strip .su-st-b{font-size:11px;padding:2px 8px;min-height:24px;white-space:nowrap}
.su-strip .su-st-dl{font-weight:bold;color:#006000}
.su-strip .su-st-more{margin-left:auto;font-size:10px;color:#0000cc!important}
.balloon.su-hello-b{max-width:300px}
.su-hello{margin-top:5px;font-size:11px;line-height:1.7}
.su-hello a{color:#0000cc;text-decoration:underline;white-space:nowrap;padding:2px 0}
`;
  document.head.appendChild(css);

  // ================================================================ the setup wizard (InstallJack)
  const ART = (p, ic) => `<svg viewBox="0 0 110 150" aria-hidden="true"><defs><linearGradient id="igbx" x1="0" x2="1"><stop offset="0" stop-color="#ffd84a"/><stop offset="1" stop-color="#e09a00"/></linearGradient></defs>
<rect x="8" y="64" width="78" height="56" fill="#c8c8c0" stroke="#000"/><rect x="14" y="70" width="66" height="42" fill="#003a6a" stroke="#000"/><path d="M14 70l66 42" stroke="#0a5a9a" stroke-width="10" opacity=".4"/>
<rect x="30" y="120" width="34" height="8" fill="#a8a8a0" stroke="#000"/><rect x="18" y="128" width="58" height="6" fill="#c8c8c0" stroke="#000"/>
<path d="M58 22l40 -8v62l-40 8z" fill="url(#igbx)" stroke="#000"/><path d="M58 22l-14-6 40-8 14 6z" fill="#fff2a0" stroke="#000"/><path d="M44 16v62l14 6V22z" fill="#c07a00" stroke="#000"/>
<g transform="translate(64 30) scale(.9)">${String(ic || '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>
<circle cx="30" cy="40" r="17" fill="#d8d8e8" stroke="#000"/><circle cx="30" cy="40" r="5" fill="#003a6a" stroke="#000"/><path d="M18 30a17 17 0 0 1 22-5" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></svg>`;
  const EULA = p => `END-USER LICENCE AGREEMENT FOR ${p.n.toUpperCase()}

IMPORTANT - READ CAREFULLY (nobody does): This licence agreement ("LICENCE") is a legal agreement between you (a person, or a dog that has learned to use a mouse) and ${p.by} ("THE AUTHOR").

1. GRANT OF LICENCE. You may install and use one copy of the SOFTWARE on one computer, or on Dave's computer if yours is broken again.

2. ${p.lic === 'Shareware' ? 'SHAREWARE. You may try the SOFTWARE for 30 days. After 30 days you must register it or feel very slightly guilty for ever.' : p.lic === 'Demo' ? 'DEMO. This is a demo. The full version has more levels, more fun and costs £24.99 from all good computer shops.' : p.lic === 'Postcardware' ? 'POSTCARDWARE. If you like the SOFTWARE, send the author a postcard. Any postcard. A nice one.' : p.lic === 'Pizzaware' || p.lic === 'Squigware' ? 'PIZZAWARE. If you use the SOFTWARE you agree to post the author one (1) pizza. Margherita is fine.' : p.lic === 'Adware' ? 'ADWARE. The SOFTWARE is FREE because it shows you adverts. Lots of them. All the time. You agreed to this in clause 2, which you are reading now.' : 'FREEWARE. The SOFTWARE is free. Free as in "free". You may give copies to your mates on floppy disk.'}

3. YEAR 2000. The SOFTWARE is Year 2000 compliant. If it is not, the AUTHOR will be in a bunker and cannot be contacted.

4. RESTRICTIONS. You may not reverse engineer, decompile, disassemble or lick the SOFTWARE. You may not use the SOFTWARE to do your homework unless you also do your homework.

5. NO WARRANTIES. The SOFTWARE is provided "AS IS". If it breaks your computer, it was probably already a bit broken.

6. LIMITATION OF LIABILITY. In no event shall the AUTHOR be liable for any damages whatsoever, including lost high scores, lost sleep or being told off for using the phone line.

7. GUBBINZ. Gubbinz has read this agreement and agrees with it. He has also eaten clause 8.

9. MISCELLANEOUS. If you have scrolled all the way to the bottom of this licence, you are the first person ever to do so. Well done. Tell nobody.`;
  const FILES = ['SETUP.INS', 'DATA.Z', '_INST32I.EX_', 'MFC42.DLL', 'MSVCRT.DLL', 'CTL3D32.DLL', 'VBRUN300.DLL', 'COMCTL32.OCX', 'JACK32.DLL', 'README.TXT', 'LICENCE.TXT', 'UNINST.EXE', 'DEISL1.ISU', 'TADA.WAV', 'PROGRAM.ICO', 'HELP.HLP', 'HELP.CNT'];
  const BILL = p => [
    [`Thank you for choosing ${p.n}!`, 'Sit back and relax while Setup copies the files. (Maybe make a cup of tea. A small one.)'],
    ['Did you know?', 'Setup is copying files at nearly 2 megabytes a minute. Your grandad\'s computer would have needed a week.'],
    [p.lic === 'Shareware' ? 'Register today!' : 'Tell your friends!', p.lic === 'Shareware' ? 'Register for just £10 and get the full version, a printed manual and the warm feeling of being honest.' : 'Copy it onto a floppy disk and give it to everyone at school. It\'s allowed!'],
    ['Tip', 'Programs you install appear in the Start menu under Programs. Uninstall them from Control Panel > Add/Remove Programs.'],
    ['Coming soon', `${p.n.replace(/ [\d.]+[a-z]?$/i, '')} 2000: now with Millennium features!`],
  ];
  let wizBusy = false;
  function wizard(pid, src) {
    const p = PR[pid];
    if (!p) return;
    if (wizBusy) return msg('Setup', 'Another Setup program is already running. Please wait for it to finish.\n\n(One thing at a time! This computer only has 32 MB of RAM.)', 'warn');
    if (has(pid) && !p.multi) return msg(p.n + ' Setup', `${p.n} is already installed on this computer.\n\nTo reinstall it, remove it first with Control Panel > Add/Remove Programs.`, 'info', [['Add/Remove...', () => applet(p.k === 'os' ? 1 : 0)], ['OK']]);
    wizBusy = true;
    // "Setup is preparing the InstallJack Wizard..."
    const pre = h(`<div class="ig"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center">${mini(J('exe'), 32)}<div style="flex:1"><div>${esc(p.n)} Setup is preparing the InstallJack&reg; Wizard, which will guide you through the rest of the setup process. Please wait.</div><div class="pre-bar" style="margin-top:8px"></div></div></div></div>`);
    const pw = A.win(p.n + ' Setup', pre, { w: 380, icon: J('exe', 16), noResize: true, noMax: true, noMin: true });
    const set = A.ui.progBar(qs(pre, '.pre-bar'));
    let f = 0; const iv = setInterval(() => { f += 0.07 + Math.random() * 0.08; set(f); if (f >= 1) { clearInterval(iv); pw.close(); open(); } }, 110);
    function open() {
      const icon = J(p.ic || 'exe');
      const bg = h(`<div class="ig-title">${esc(p.n)}</div><div class="ig-bill"><b></b><span></span></div><div class="ig-by">InstallJack&reg; 5.1 &copy; 1997-1999 Gubbinz Software Ltd</div>`, 'ig-bg');
      const tb = $('taskbar'); if (tb) bg.style.bottom = Math.max(0, DesktopSurface.height() - DesktopSurface.rect(tb).top) + 'px';
      DesktopSurface.root().appendChild(bg);
      const d = { dir: 'C:\\Program Files\\' + p.dir, type: 'typical', name: (window.Net && Net.me && Net.me.member && Net.me.nick) || 'Jack', co: '', bundle: null, icon: !!p.icons.length, launch: true, readme: false, restart: !!p.restart };
      const tbLeft = window.OldPC ? Object.keys(OldPC.NAMES).filter(k => !OldPC.installed.includes(k)) : [];
      if ((p.lic === 'Adware' || p.lic === 'Freeware' && Math.random() < 0.4) && tbLeft.length && p.k !== 'os') d.bundle = pick(tbLeft);
      const b = h(`<div class="ig"><div class="ig-main"><div class="ig-side">${ART(p, icon)}</div><div class="ig-body"></div></div><div class="ig-line">InstallJack</div><div class="row ig-btns"><button class="btn" data-ig="back">&lt; Back</button><button class="btn" data-ig="next">Next &gt;</button><button class="btn" data-ig="cancel">Cancel</button></div></div>`);
      const w = A.win(p.n + ' Setup', b, { w: 500, icon: J(p.ic || 'exe', 16), noResize: true, noMax: true, noMin: true, onClose: () => { bg.remove(); wizBusy = false; } });
      bg.style.zIndex = Math.max(1, (+w.el.style.zIndex || 2400) - 1);
      w.el.addEventListener('pointerdown', () => setTimeout(() => { bg.style.zIndex = Math.max(1, (+w.el.style.zIndex || 2400) - 1); }, 0));
      const body = qs(b, '.ig-body'), back = qs(b, '[data-ig=back]'), next = qs(b, '[data-ig=next]'), cancel = qs(b, '[data-ig=cancel]');
      const steps = [
        { r: () => `<h3>Welcome</h3><p>Welcome to the ${esc(p.n)} Setup program. This program will install ${esc(p.n)} on your computer.</p><p>It is strongly recommended that you exit all JackOS programs before running this Setup program.</p><p>Click Cancel to quit Setup and then close any programs you have running. Click Next to continue with the Setup program.</p><p><b>WARNING:</b> This program is protected by copyright law and international treaties. (And by Gubbinz, who bites.)</p>` },
        { r: () => `<h3>Software Licence Agreement</h3><p>Please read the following Licence Agreement. Press the PAGE DOWN key to see the rest of the agreement.</p><div class="ig-lic" tabindex="0">${esc(EULA(p))}</div><p>Do you accept all the terms of the preceding Licence Agreement? If you choose No, Setup will close. To install ${esc(p.n)}, you must accept this agreement.</p>`,
          on: () => { const l = qs(body, '.ig-lic'); l.addEventListener('scroll', () => { if (l.scrollTop + l.clientHeight >= l.scrollHeight - 4) secret('setup.eula'); }); next.textContent = 'Yes'; cancel.textContent = 'No'; },
          off: () => { next.textContent = 'Next >'; cancel.textContent = 'Cancel'; } },
        { r: () => `<h3>User Information</h3><p>Type your name below. You must also type the name of the company you work for.</p><label style="display:block">Name:<input type="text" class="ig-n" maxlength="40" style="width:100%" value="${esc(d.name)}"></label><label style="display:block">Company:<input type="text" class="ig-c" maxlength="40" style="width:100%" value="${esc(d.co)}" placeholder="(you don't work for a company, you're at school)"></label>${p.k === 'cd' || p.disc && src === 'cd' ? `<label style="display:block">CD Key:<input type="text" class="ig-k" maxlength="12" style="width:100%" value=""></label><p class="small">The CD Key is on the yellow sticker on the back of the CD case: <b>1999-${String(4000 + ORDER.indexOf(pid) * 37).slice(0, 4)}</b></p>` : ''}`,
          next: () => { d.name = qs(body, '.ig-n').value.trim() || 'Jack'; d.co = qs(body, '.ig-c').value.trim(); const k = qs(body, '.ig-k'); if (k && k.value.replace(/\D/g, '') !== '1999' + String(4000 + ORDER.indexOf(pid) * 37).slice(0, 4)) { msg('Invalid CD Key', 'The CD Key you entered is not valid. Please check the sticker on the back of the CD case and try again.\n\n(It\'s the one with the long number. Not the price sticker.)', 'warn'); return false; } } },
        { r: () => `<h3>Choose Destination Location</h3><p>Setup will install ${esc(p.n)} in the following folder.</p><p>To install to this folder, click Next. To install to a different folder, click Browse and select another folder.</p><div class="ig-group"><b>Destination Folder</b><div class="row" style="flex-wrap:nowrap;gap:6px"><div class="ig-field" style="flex:1">${esc(d.dir)}</div><button class="btn ig-br" type="button">Browse...</button></div></div><p class="small" style="margin-top:8px">Space required: ${kbStr(p.kb)}<br>Space available on C: 1,903 MB</p>`,
          on: () => qs(body, '.ig-br').addEventListener('click', () => { const opts = ['C:\\Program Files\\' + p.dir, 'C:\\' + p.dir.toUpperCase().replace(/\s/g, '').slice(0, 8), 'C:\\GAMES\\' + p.dir.toUpperCase().replace(/\s/g, '').slice(0, 8), 'C:\\JACKOS\\DESKTOP\\NEW FOLDER (3)']; d.dir = opts[(opts.indexOf(d.dir) + 1) % opts.length]; qs(body, '.ig-field').textContent = d.dir; if (/NEW FOLDER/.test(d.dir)) secret('setup.newfolder'); }) },
        { r: () => `<h3>Setup Type</h3><p>Click the type of Setup you prefer, then click Next.</p>${[['typical', 'Typical', 'Program will be installed with the most common options. Recommended for most users.'], ['compact', 'Compact', 'Program will be installed with minimum required options. For computers with a full hard disk (all of them).'], ['custom', 'Custom', 'You may choose the options you want to install. Recommended for advanced users, and Dave.']].map(([k, l, x]) => `<label><input type="radio" name="igt" value="${k}" ${d.type === k ? 'checked' : ''}><span><b>${l}</b><br>${x}</span></label>`).join('')}${d.bundle ? `<label class="ig-sneaky"><input type="checkbox" class="ig-bun" checked><span>Also install the FREE ${esc(OldPC.NAMES[d.bundle])}! It makes the Internet better and faster and more fun!!! (recommended)</span></label>` : ''}`,
          next: () => { d.type = (qs(body, 'input[name=igt]:checked') || {}).value || 'typical'; const bn = qs(body, '.ig-bun'); if (bn && !bn.checked) { d.bundle = null; secret('setup.eagle'); } if (d.type === 'custom') return customDlg(); } },
        { r: () => `<h3>Select Program Folder</h3><p>Setup will add program icons to the Program Folder listed below. You may type a new folder name, or select one from the existing folders list. Click Next to continue.</p><label style="display:block">Program Folders:<input type="text" maxlength="40" style="width:100%" value="${esc(p.paths[0] ? p.paths[0].split(' > ')[0] : p.dir)}"></label><div style="margin-top:4px">Existing Folders:</div><div class="ig-list">${['Accessories', 'Games', 'Internet', 'JackAmp', 'JackCarta 99', 'JackNet Hangout', 'Online Services', 'StartUp', 'Dad\'s Old Computer'].map(n => `<div>${esc(n)}</div>`).join('')}</div>`,
          on: () => qsa(body, '.ig-list div').forEach(x => x.addEventListener('click', () => { qsa(body, '.ig-list div').forEach(y => y.classList.toggle('sel', y === x)); qs(body, 'input').value = x.textContent; })) },
        { r: () => `<h3>Start Copying Files</h3><p>Setup has enough information to start copying the program files. If you want to review or change any settings, click Back. If you are satisfied with the settings, click Next to begin copying files.</p><div>Current Settings:</div><div class="ig-lic" style="height:110px">Setup Type:\n      ${d.type[0].toUpperCase() + d.type.slice(1)}\n\nTarget Directory:\n      ${esc(d.dir)}\n\nUser Information:\n      ${esc(d.name)}${d.co ? '\n      ' + esc(d.co) : ''}${d.bundle ? '\n\nAlso installing:\n      ' + esc(OldPC.NAMES[d.bundle]) : ''}</div>` },
        { copy: true, r: () => `<h3>Setup Status</h3><p>${esc(p.n)} Setup is performing the requested operations.</p><div class="ig-cur">Installing:</div><div class="ig-bar"></div><div class="small ig-pc" style="text-align:right;margin-top:2px">0%</div>` },
        { r: () => `<h3>InstallJack Wizard Complete</h3><p>Setup has finished installing ${esc(p.n)} on your computer.</p>${p.icons.length ? `<label><input type="checkbox" class="ig-ico" ${d.icon ? 'checked' : ''}><span>Create a shortcut on the desktop</span></label>` : ''}${launchable(p) ? '<label><input type="checkbox" class="ig-run" checked><span>Launch ' + esc(p.n) + ' now</span></label>' : ''}<label><input type="checkbox" class="ig-rd"><span>View the README file</span></label>${d.restart ? `<div class="ig-group"><b>Restart</b><p style="margin:0 0 4px">Setup has finished copying files. You must restart your computer before you can use the program.</p><label><input type="radio" name="igr" value="y"><span>Yes, I want to restart my computer now.</span></label><label><input type="radio" name="igr" value="n" checked><span>No, I will restart my computer later.</span></label></div>` : ''}<p>Click Finish to complete Setup.</p>` },
      ];
      let i = 0;
      function show() {
        const s = steps[i]; body.innerHTML = s.r();
        back.disabled = i === 0 || !!s.copy || i === steps.length - 1; next.disabled = !!s.copy; cancel.disabled = i === steps.length - 1;
        next.textContent = i === steps.length - 1 ? 'Finish' : 'Next >';
        if (s.on) s.on();
        if (s.copy) copy();
        setTimeout(() => { const f = qs(body, 'input[type=text]') || next; if (f && !f.disabled) f.focus(); }, 30);
      }
      function go(n) { const s = steps[i]; if (s.off) s.off(); i = n; show(); }
      function customDlg() {
        const comps = [['Program Files', 1], ['Help Files', 1], ['Sample Files', 1], ['Extra Cheat Codes', 0], ['Spare Rupees', 0], ['The Bit That Makes It Go', 1]];
        const dl = A.ui.dialog('Select Components', `<p style="margin:0 0 6px">Select the components you want to install, clear the components you do not want to install.</p>${comps.map(([n, on2]) => `<label style="display:flex;gap:5px;align-items:center"><input type="checkbox" ${on2 ? 'checked' : ''} data-n="${esc(n)}"> ${esc(n)}</label>`).join('')}`, [['OK', bx => { const g = qs(bx, '[data-n="The Bit That Makes It Go"]'); if (g && !g.checked) { msg('Setup', 'You can\'t leave out The Bit That Makes It Go. Without it, nothing goes. I\'ve put it back.', 'warn'); g.checked = true; return false; } go(i + 1); }], ['Cancel']], { w: 300, icon: J('exe', 16) });
        return dl && false;
      }
      function copy() {
        bg.classList.add('copying');
        const bills = BILL(p); let bi = 0;
        const bill = () => { qs(bg, '.ig-bill b').textContent = bills[bi % bills.length][0]; qs(bg, '.ig-bill span').textContent = bills[bi % bills.length][1]; bi++; };
        bill(); const biv = setInterval(bill, 2600);
        const set = A.ui.progBar(qs(body, '.ig-bar')), dur = clamp(3000 + Math.log10(p.kb + 10) * 900, 3500, 8000);
        let t0 = performance.now(), pausedFor = 0, asked = false, done = false;
        const conflict = Math.random() < 0.35 ? 0.3 + Math.random() * 0.4 : 2;
        const files = FILES.concat([p.exe]).sort(() => Math.random() - 0.5);
        function tick() {
          if (w.closed) { clearInterval(biv); return; }
          const f = clamp((performance.now() - t0 - pausedFor) / dur, 0, 1);
          set(f); qs(body, '.ig-pc').textContent = Math.floor(f * 100) + '%';
          qs(body, '.ig-cur').textContent = 'Installing: ' + d.dir + '\\' + files[Math.floor(f * files.length * 3) % files.length];
          if (!asked && f >= conflict) {
            asked = true; const tp = performance.now();
            msg('Version Conflict', `A file being copied is older than the file currently on your computer. It is recommended that you keep your existing file.\n\nFile name: CTL3D32.DLL\nDescription: 3D JackOS Controls\nYour version: 2.31.000\n\nDo you want to keep this file?`, 'q', [['Yes', () => { pausedFor += performance.now() - tp; requestAnimationFrame(tick); }], ['No', () => { pausedFor += performance.now() - tp; secret('setup.dllhell'); requestAnimationFrame(tick); }], ['Yes to All', () => { pausedFor += performance.now() - tp; requestAnimationFrame(tick); }]]);
            return;
          }
          if (f >= 1) { if (done) return; done = true; clearInterval(biv); bg.classList.remove('copying'); qs(body, '.ig-cur').textContent = 'Updating the Start menu...'; setTimeout(() => go(i + 1), 700); return; }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      function finish() {
        const ico = qs(body, '.ig-ico'), run = qs(body, '.ig-run'), rd = qs(body, '.ig-rd'), rs = qs(body, 'input[name=igr]:checked');
        setInstalled(pid, true, { noIcon: ico ? !ico.checked : false });
        if (src === 'web') secret('setup.download');
        if (fromHome === pid) secret('fresh.homepage');
        if (d.bundle && window.OldPC) { OldPC.install(d.bundle); secret('setup.bundled'); }
        w.close(); sfx('solve');
        if (rd && rd.checked) Desk.notepad('README.TXT', readme(p, d));
        if (rs && rs.value === 'y') { setTimeout(() => Desk.reboot('bios'), 600); return; }
        if (run && run.checked) setTimeout(() => launch(pid), 300);
        else toast('Setup complete', `${p.n} has been installed. Find it in Start > Programs.`, 5000);
      }
      function quit() {
        msg('Exit Setup', 'Setup is not complete. If you quit the Setup program now, the program will not be installed.\n\nYou may run the Setup program at a later time to complete the installation.\n\nTo continue installing, click Resume. To quit the Setup program, click Exit Setup.', 'warn', [['Resume'], ['Exit Setup', () => { w.close(); msg(p.n + ' Setup', 'Setup was interrupted before ' + p.n + ' could be completely installed.\n\nTo complete the installation at another time, please run Setup again.', 'info'); }]]);
      }
      back.addEventListener('click', () => { if (i > 0) go(i - 1); });
      next.addEventListener('click', () => { const s = steps[i]; if (i === steps.length - 1) return finish(); if (s.next && s.next() === false) return; go(i + 1); });
      cancel.addEventListener('click', quit);
      b.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.tagName !== 'BUTTON' && !next.disabled) { ev.preventDefault(); next.click(); } });
      show();
    }
  }
  const launchable = p => !!(p.launch || p.apps[0] || (p.paths[0] && !p.paths[0].endsWith(' >')) || p.paths[0]);
  function launch(pid) {
    const p = PR[pid]; if (!p) return;
    const t = p.launch || p.apps[0];
    if (t) { const [app, arg] = t.split(':'); return A.open(app, arg); }
    const prog = A.programs.find(x => p.paths.some(pa => pa.endsWith(' >') ? x.path.join(' > ').startsWith(pa + ' ') : x.path.join(' > ') === pa));
    if (prog) typeof prog.target === 'function' ? prog.target() : A.open(prog.target);
  }
  const readme = (p, d) => `${p.n.toUpperCase()}\n${'='.repeat(p.n.length)}\n\nVersion ${p.v}   ${p.lic}\nBy ${p.by}\n\nThank you for installing ${p.n}, ${d.name}!\n\n${p.d}\n\nINSTALLED TO\n  ${d.dir}\n\nSYSTEM REQUIREMENTS\n  486DX2/66 or better (Pentium recommended)\n  8 MB RAM (16 MB recommended)\n  ${kbStr(p.kb)} free hard disk space\n  JackOS 95 or JackOS 98\n  Sound Blaster or 100% compatible sound card\n  A mouse (a real one, not Biscuit's toy one)\n\nTO REMOVE\n  Control Panel > Add/Remove Programs.\n\nKNOWN PROBLEMS\n  - If the program does not start, try turning it off and on again.\n  - If it still does not start, ask Dave. Dave will not know.\n\n${p.home ? 'HOMEPAGE\n  ' + (p.home.startsWith('http') ? p.home : 'http://www.jackattack.jnet/' + p.home) + '\n\n' : ''}Get more great software at ${SHACK}\n`;

  // ================================================================ uninstalling
  function uninstall(pid, after) {
    const p = PR[pid];
    if (!p) return;
    if (!has(pid)) return msg('Add/Remove Programs', `${p.n} is not installed.`, 'info');
    msg('Confirm File Deletion', `Are you sure you want to completely remove '${p.n}' and all of its components?`, 'q', [['Yes', () => check()], ['No']]);
    function check() {
      if (openWins(pid).length) return msg('Remove Programs From Your Computer', `${p.n} is running.\n\nSetup cannot remove files that are in use. Close ${p.n} and then click Retry.`, 'warn', [['Retry', check], ['Close it for me', () => { openWins(pid).forEach(w => w.close()); setTimeout(check, 200); }], ['Cancel']]);
      run();
    }
    function run() {
      const b = h(`<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(J('addrem'))}<div style="flex:1;min-width:0"><div>Removing <b>${esc(p.n)}</b>...</div><div class="su-ub" style="margin-top:6px"></div><div class="small su-uf" style="margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">&nbsp;</div></div></div>`);
      const w = A.win('Remove Programs From Your Computer', b, { w: 380, icon: J('addrem', 16), noResize: true, noMax: true, noMin: true });
      const set = A.ui.progBar(qs(b, '.su-ub'));
      const STEPS = ['Removing shared files...', 'Removing program files...', 'Removing folders...', 'Removing program registry entries...', 'Removing desktop icons...', 'Removing Start menu items...', `Deleting C:\\Program Files\\${p.dir}\\${p.exe}...`];
      let f = 0, asked = Math.random() < 0.5 ? 0.45 : 2, tok = true;
      const iv = setInterval(() => {
        if (w.closed) return clearInterval(iv);
        if (!tok) return;
        f += 0.05 + Math.random() * 0.06; set(f); qs(b, '.su-uf').textContent = pick(STEPS);
        if (f >= asked) {
          asked = 2; tok = false;
          msg('Remove Shared File?', 'The system indicates that the following shared file is no longer used by any programs and may be removed:\n\n    JACK32.DLL\n\nIf any programs are still using this file and it is removed, those programs may not function. If you are uncertain what to do, you should choose to keep this shared component. Leaving this file on your system will not cause any harm.\n\nRemove the shared file?', 'q', [['Yes', () => { tok = true; }], ['No', () => { tok = true; }], ['Yes to All', () => { tok = true; }], ['No to All', () => { tok = true; }]]);
          return;
        }
        if (f >= 1) {
          clearInterval(iv); set(1);
          setTimeout(() => {
            w.close(); setInstalled(pid, false); secret('setup.uninstall'); sfx('click');
            const left = Math.random() < 0.5;
            msg('Remove Programs From Your Computer', left ? `Uninstall successfully completed.\n\nSome elements could not be removed. You should manually remove items related to the application:\n\n    C:\\Program Files\\${p.dir}\\SAVES (not empty)\n    C:\\JACKOS\\${p.exe.replace('.EXE', '.INI')}` : 'Uninstall successfully completed.', 'info');
            if (after) after();
          }, 400);
        }
      }, 230);
    }
  }

  // ================================================================ downloading (File Download dialog + the progress window)
  const setupFile = p => (p.setup || (p.id.replace(/[^a-z0-9]/g, '').slice(0, 6) + String(p.v).replace(/\D/g, '').slice(0, 2) + (p.lic === 'Shareware' ? 'sw' : '') + '.exe')).toLowerCase();
  const DL_ICON = '<svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="13" fill="#2a7ad8" stroke="#003" /><path d="M6 11c5 2 7-3 12-1s5 6 9 4M5 20c6-2 9 3 14 1s5-4 8-3" stroke="#1a9a3a" stroke-width="3" fill="none"/><path d="M10 6a13 13 0 0 1 14 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/></svg>';
  const DL_FOLDER = '<svg viewBox="0 0 32 32" width="32" height="32"><path d="M2 8h11l3 3h14v17H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 13h28" stroke="#7a5a00"/></svg>';
  const DL_PAPER = '<svg viewBox="0 0 14 16" width="14" height="16"><path d="M1 1h8l4 4v10H1z" fill="#fff" stroke="#000"/><path d="M3 7h8M3 10h8M3 13h6" stroke="#000080"/></svg>';
  function download(pid, mirror) {
    const p = PR[pid]; if (!p) return;
    if (p.nodl) return msg('The Shareware Shack', `${p.n} is only available on CD-ROM.\n\n${kbStr(p.kb)} would take about ${Math.round(p.kb / 4.8 / 3600)} hours on a 56K modem, and Mom would need the phone at some point.`, 'info');
    const file = setupFile(p), host = (mirror && mirror.host) || 'ftp.sharewareshack.netz';
    let mode = store.get('jhp_setup_dlmode', 'run');
    const dlg = A.ui.dialog('File Download', `<div class="dl"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${DL_ICON}<div style="flex:1;min-width:0"><p style="margin:0 0 8px">You have chosen to download a file from this location.</p><p style="margin:0 0 8px"><b>${esc(file)}</b> from ${esc(host)}</p><p style="margin:0 0 4px">What would you like to do with this file?</p><label style="display:flex;gap:5px;align-items:center"><input type="radio" name="dlm" value="run" ${mode === 'run' ? 'checked' : ''}> Run this program from its current location</label><label style="display:flex;gap:5px;align-items:center"><input type="radio" name="dlm" value="save" ${mode === 'save' ? 'checked' : ''}> Save this program to disk</label><hr class="pgk-hr"><label style="display:flex;gap:5px;align-items:center"><input type="checkbox" checked disabled> Always ask before opening this type of file</label></div></div></div>`,
      [['OK', bx => { mode = (qs(bx, 'input[name=dlm]:checked') || {}).value || 'run'; store.set('jhp_setup_dlmode', mode); setTimeout(() => progress(p, file, host, mode, mirror), 50); }], ['Cancel'], ['More Info', () => { msg('Authenticode', `${file}\n\nPublisher: ${p.by}\nThis program has NOT been signed with a digital certificate. (Nobody does that. It's 1999.)\n\nSome files can harm your computer. If the file information looks suspicious, or you do not fully trust the source, do not open or save this file. ${SITE} scans every upload with a real hamster. The hamster has never found a virus. The hamster may not know what a virus is.`, 'info'); return false; }]], { w: 400, icon: J('jacknet', 16) });
    return dlg;
  }
  function progress(p, file, host, mode, mirror) {
    const total = p.kb, slow = mirror && mirror.slow;
    const b = h(`<div class="dl"><div class="dl-anim"><span class="a l">${DL_ICON}</span><span class="a r">${DL_FOLDER}</span><span class="pp">${DL_PAPER}</span><span class="pp">${DL_PAPER}</span><span class="pp">${DL_PAPER}</span></div>
<div class="dl-st">Saving:</div><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(file)} from ${esc(host)}</div><div class="dl-bar" style="margin:6px 0"></div>
<div class="dl-grid"><span>Estimated time left:</span><span class="dl-left">Not known (opening the line...)</span><span>Download to:</span><span>${mode === 'save' ? 'C:\\My Documents\\My Downloads\\' + esc(file) : 'Temporary Folder'}</span><span>Transfer rate:</span><span class="dl-rate">0 KB/Sec</span></div>
<label style="display:flex;gap:5px;align-items:center"><input type="checkbox" class="dl-close" ${store.get('jhp_setup_dlclose', false) ? 'checked' : ''}> Close this dialog box when download completes</label>
<div class="row" style="justify-content:flex-end;gap:6px;margin-top:8px"><button class="btn" data-d="open" disabled>Open</button><button class="btn" data-d="folder" disabled>Open Folder</button><button class="btn" data-d="cancel">Cancel</button></div></div>`);
    const w = A.win('0% of ' + file + ' Completed', b, { w: 380, icon: J('jacknet', 16), noResize: true, noMax: true });
    const set = A.ui.progBar(qs(b, '.dl-bar'));
    // SquigPipe(tm): a lot faster than a real 56K modem, honestly reported
    const dur = (slow ? 2.2 : 1) * clamp(2600 + Math.sqrt(total) * 90, 3000, 12000), cut = total > 300 && Math.random() < 0.1 ? 0.3 + Math.random() * 0.5 : 2;
    let got = 0, last = performance.now(), paused = false, done = false;
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      if (paused) { last = performance.now(); return; }
      const now = performance.now(), dt = now - last; last = now;
      const rate = total / dur * 1000 * (0.7 + Math.random() * 0.6) * (slow && Math.random() < 0.3 ? 0.2 : 1);
      got = Math.min(total, got + rate * dt / 1000);
      const f = got / total; set(f);
      w.setTitle(Math.floor(f * 100) + '% of ' + file + ' Completed');
      const left = Math.max(0, (total - got) / Math.max(1, rate));
      qs(b, '.dl-left').textContent = `${left >= 60 ? Math.floor(left / 60) + ' min ' : ''}${Math.ceil(left % 60)} sec (${kbStr(Math.floor(got))} of ${kbStr(total)} copied)`;
      qs(b, '.dl-rate').textContent = (rate).toFixed(1) + ' KB/Sec';
      if (f >= cut) {
        paused = true; b.classList.add('paused'); const c = cut; void c;
        msg('Download Error', `JackNet Explorer cannot download ${file} from ${host}.\n\nThe connection with the server was reset.\n\n(Someone picked up the phone downstairs. It was Mom. She wants to ring Nan.)`, 'warn', [['Retry', () => { secret('setup.phone'); paused = false; b.classList.remove('paused'); qs(b, '.dl-st').textContent = 'Resuming:'; }], ['Cancel', () => w.close()]]);
        return;
      }
      if (f >= 1 && !done) {
        done = true; clearInterval(iv); b.classList.add('paused');
        qs(b, '.dl-st').textContent = 'Download complete:'; qs(b, '.dl-left').textContent = `${kbStr(total)} downloaded in ${Math.round(dur / 1000)} sec`;
        w.setTitle('Download complete'); sfx('join');
        try { Net.kv.inc('ss.dl.' + p.id); } catch (e) {}
        const n = store.get('jhp_setup_dln', 0) + 1; store.set('jhp_setup_dln', n); if (n >= 10) secret('setup.hoarder');
        if (mode === 'save') { saveFile(p, file); qs(b, '[data-d=open]').disabled = false; qs(b, '[data-d=folder]').disabled = false; qs(b, '[data-d=cancel]').textContent = 'Close'; if (qs(b, '.dl-close').checked) { w.close(); toast('Download complete', `${file} has been saved to My Downloads.`, 5000); } }
        else setTimeout(() => { w.close(); wizard(p.id, 'web'); }, 500);
      }
    }, 120);
    qs(b, '.dl-close').addEventListener('change', e => store.set('jhp_setup_dlclose', e.target.checked));
    qs(b, '[data-d=cancel]').addEventListener('click', () => w.close());
    qs(b, '[data-d=open]').addEventListener('click', () => { w.close(); wizard(p.id, 'file'); });
    qs(b, '[data-d=folder]').addEventListener('click', () => { w.close(); A.open('explorer', 'C:/My Documents/My Downloads'); });
  }
  // downloaded setup files live in My Documents\My Downloads (and come back after a reboot)
  const DLDIR = 'C:/My Documents/My Downloads';
  function fileNode(x) { return { name: x.file, type: 'exe', app: 'setup.run', arg: x.pid, date: x.date || d99(), size: kbStr(PR[x.pid] ? PR[x.pid].kb : 100) }; }
  function saveFile(p, file) { S.dl = S.dl.filter(x => x.file !== file).concat([{ pid: p.id, file, date: d99() }]).slice(-40); save(); A.fs.add(DLDIR, fileNode(S.dl[S.dl.length - 1])); }
  A.fs.dir(DLDIR);
  A.register('setup.run', { open(pid) { if (PR[pid]) wizard(pid, 'file'); else msg('Setup', 'This setup file is damaged. (Downloaded during a thunderstorm?)', 'warn'); } });
  const restoreFiles = () => S.dl.forEach(x => { if (PR[x.pid]) A.fs.add(DLDIR, fileNode(x)); });

  // ================================================================ Control Panel > Add/Remove Programs
  const JUNK = ['JackNet 56K Dialler 2.1', 'Gubbinz Virtual Pet 1.2', 'Ork Encyclopaedia 98 (CD-ROM)', 'Y2K Fix-o-Matic 1.0', 'Typing Teacher Deluxe', 'Homework Helper 97 (never opened)', 'FREE Screen Saver Pack 3000', 'Encyclopaedia of Everything 1998 (6 CDs, disc 4 missing)'];
  function applet(tab) {
    if (!A.ui) return;
    let pend = null; // JackOS Setup: { id: bool }
    const S2 = A.ui.sheet('Add/Remove Programs Properties', [
      ['Install/Uninstall', (pg, c) => {
        pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(J('addrem'))}<span>To install a new program from a floppy disk or CD-ROM drive, click Install.</span></div><div class="row" style="justify-content:flex-end"><button class="btn" data-a="inst">Install...</button></div><hr class="pgk-hr"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(J('exe'))}<span>The following software can be automatically removed by JackOS. To remove a program or to modify its installed components, select it from the list and click Add/Remove.</span></div><div class="field pgk-prl"></div><div class="small su-info"></div><div class="row" style="justify-content:flex-end"><button class="btn" data-a="rem">Add/Remove...</button></div>`;
        const lst = qs(pg, '.pgk-prl'), info = qs(pg, '.su-info');
        function render() {
          const gone = store.get('jhp_prog_removed', []);
          const items = [
            ...ORDER.filter(id => PR[id].k !== 'os' && PR[id].k !== 'tb' && has(id)).map(id => ({ k: 'p', id, n: PR[id].n, ic: J(PR[id].ic || 'exe', 16), info: `${PR[id].lic} · ${kbStr(PR[id].kb)} · ${PR[id].by}` })),
            ...(window.OldPC ? OldPC.installed.map(k => ({ k: 'tb', id: k, n: OldPC.NAMES[k], ic: J('jacknet', 16), info: 'Adware · installed itself while you weren\'t looking' })) : []),
            { k: 'ie', n: 'JackNet Explorer 5.0', ic: J('jacknet', 16), info: 'Integrated with the operating system' },
            ...JUNK.filter(n => !gone.includes(n)).map(n => ({ k: 'junk', n, ic: J('exe', 16), info: 'Used: rarely' })),
          ].sort((a, b2) => a.n.localeCompare(b2.n));
          lst.innerHTML = items.map((x, i) => `<div class="su-li${i === 0 ? ' sel' : ''}" data-i="${i}">${mini(x.ic, 16)}<span>${esc(x.n)}</span></div>`).join('');
          const sel = i => { qsa(lst, '.su-li').forEach(x => x.classList.toggle('sel', +x.dataset.i === i)); info.textContent = items[i] ? items[i].info : ''; };
          qsa(lst, '.su-li').forEach(e => { e.addEventListener('click', () => sel(+e.dataset.i)); e.addEventListener('dblclick', () => qs(pg, '[data-a=rem]').click()); });
          lst._items = items; sel(0);
        }
        render();
        const onCh = () => { if (pg.isConnected) render(); else document.removeEventListener('setup', onCh); };
        document.addEventListener('setup', onCh);
        qs(pg, '[data-a=inst]').addEventListener('click', installFromDisk);
        qs(pg, '[data-a=rem]').addEventListener('click', () => {
          const s = qs(lst, '.su-li.sel'); if (!s) return; const x = lst._items[+s.dataset.i]; if (!x) return;
          if (x.k === 'p') return uninstall(x.id);
          if (x.k === 'tb') return msg('Confirm File Deletion', `Are you sure you want to completely remove '${x.n}' and all of its components?`, 'q', [['Yes', () => { OldPC.uninstallByName(x.n); setTimeout(render, 60); }], ['No']]);
          if (x.k === 'ie') { secret('setup.trial'); return msg('JackNet Explorer 5.0', 'JackNet Explorer cannot be removed: it is an integrated part of the operating system.\n\nIf you remove it, the Start menu, the desktop, the Help files and the clock will stop working, and Gubbinz will be sad.\n\n(Some people in America are having a big court case about whether that\'s true. JackOS is following it closely.)', 'warn'); }
          msg('Confirm File Deletion', `Are you sure you want to completely remove '${x.n}' and all of its components?`, 'q', [['Yes', () => A.ui.uninstallAnim(x.n, render)], ['No']]);
        });
      }],
      ['JackOS Setup', (pg, c) => {
        pend = {}; ORDER.filter(id => PR[id].k === 'os').forEach(id => { pend[id] = has(id); });
        pg.innerHTML = `<p style="margin:0 0 6px">To add or remove a component, select or clear the check box. A shaded box means that only part of the component will be installed. To see what's included in a component, click Details.</p><div>Components:</div><div class="field pgk-comp" style="height:140px"></div><p class="small su-space" style="margin:6px 0"></p><div class="group"><span class="lg">Description</span><div class="small su-desc" style="min-height:30px"></div><div class="small su-cnt"></div></div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" data-a="det">Details...</button><button class="btn" data-a="disk">Have Disk...</button></div>`;
        const box = qs(pg, '.pgk-comp'); let cur = Object.keys(GROUPS)[0];
        const ids = g => ORDER.filter(id => PR[id].grp === g);
        const size = l => l.reduce((t, id) => t + (pend[id] ? PR[id].kb : 0), 0);
        function render() {
          box.innerHTML = Object.keys(GROUPS).map(g => { const l = ids(g), on2 = l.filter(id => pend[id]).length; return `<label class="pgk-ci${g === cur ? ' sel' : ''}" data-g="${g}"><input type="checkbox" ${on2 ? 'checked' : ''} data-part="${on2 && on2 < l.length ? 1 : 0}"><span style="flex:1">${esc(GROUPS[g][0])}</span><span>${(size(l) / 1024).toFixed(1)} MB</span></label>`; }).join('');
          qsa(box, 'input').forEach(i => { i.indeterminate = i.dataset.part === '1'; });
          qsa(box, '.pgk-ci').forEach(e => {
            e.addEventListener('pointerdown', () => { cur = e.dataset.g; qsa(box, '.pgk-ci').forEach(x => x.classList.toggle('sel', x === e)); desc(); });
            qs(e, 'input').addEventListener('change', ev => { const l = ids(e.dataset.g), want = ev.target.checked; l.forEach(id => { pend[id] = want; }); c.dirty(); render(); });
          });
          const inst = ORDER.filter(id => PR[id].k === 'os' && has(id)).reduce((t, id) => t + PR[id].kb, 0), req = ORDER.filter(id => PR[id].k === 'os' && pend[id] && !has(id)).reduce((t, id) => t + PR[id].kb, 0);
          qs(pg, '.su-space').innerHTML = `Space used by installed components: ${(inst / 1024).toFixed(1)} MB<br>Space required: ${(req / 1024).toFixed(1)} MB<br>Space available on disk: 1,903.2 MB`;
          desc();
        }
        function desc() { const l = ids(cur); qs(pg, '.su-desc').textContent = GROUPS[cur][1]; qs(pg, '.su-cnt').textContent = `${l.filter(id => pend[id]).length} of ${l.length} components selected`; }
        render();
        qs(pg, '[data-a=det]').addEventListener('click', () => {
          const l = ids(cur);
          A.ui.dialog(GROUPS[cur][0], `<p style="margin:0 0 6px">To add a component, select the check box, or click to clear it if you don't want the component. A shaded box means that only part of the component will be installed.</p><div>Components:</div><div class="field pgk-comp" style="height:150px">${l.map((id, i) => `<label class="pgk-ci${i === 0 ? ' sel' : ''}" data-id="${id}"><input type="checkbox" ${pend[id] ? 'checked' : ''}><span style="flex:1">${esc(PR[id].n)}</span><span>${(PR[id].kb / 1024).toFixed(1)} MB</span></label>`).join('')}</div><div class="group"><span class="lg">Description</span><div class="small su-dd" style="min-height:28px">${esc(PR[l[0]].d)}</div></div>`,
            [['OK', bx => { qsa(bx, '.pgk-ci').forEach(e => { pend[e.dataset.id] = qs(e, 'input').checked; }); c.dirty(); render(); }], ['Cancel']], { w: 380, icon: J('addrem', 16) });
          setTimeout(() => qsa(document, '.pg-dlg .pgk-ci[data-id]').forEach(e => e.addEventListener('pointerdown', () => { qsa(e.parentNode, '.pgk-ci').forEach(x => x.classList.toggle('sel', x === e)); const dd = e.closest('.pg-dlg').querySelector('.su-dd'); if (dd) dd.textContent = PR[e.dataset.id].d; })), 0);
        });
        qs(pg, '[data-a=disk]').addEventListener('click', () => msg('Install From Disk', 'Insert the manufacturer\'s installation disk into the drive selected, and then click OK.\n\nCopy manufacturer\'s files from:  A:\\\n\n...\n\nA:\\ is not accessible. The device is not ready.', 'warn'));
        c.onApply(() => applyOS(pend));
      }],
      ['Startup Disk', pg => {
        pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(J('floppy'))}<span>If you have trouble starting JackOS, you can use a startup disk to start your computer, run diagnostic programs, and fix many problems.<br><br>To create a startup disk, click Create Disk. You will need one floppy disk.</span></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="mk">Create Disk...</button></div>`;
        qs(pg, '[data-a=mk]').addEventListener('click', () => msg('Insert Disk', 'Label a disk "JackOS 98 Startup Disk" and insert it into drive A:.\n\nWarning: Setup will delete any existing files on this disk.', 'info', [['OK', () => copyDlg('Creating Startup Disk', ['COMMAND.COM', 'IO.SYS', 'MSDOS.SYS', 'FDISK.EXE', 'FORMAT.COM', 'SYS.COM', 'EDIT.COM', 'SCANDISK.EXE', 'HIMEM.SYS', 'OAKCDROM.SYS', 'GUBBINZ.SYS'], 'A:\\', () => { secret('setup.bootdisk'); msg('Startup Disk', 'Startup disk created.\n\nRemove the disk from drive A:, label it and keep it somewhere safe. (Not in the drawer with the JackOS CD. Mom will "tidy" it.)', 'info'); })], ['Cancel']]));
      }],
    ], { icon: J('addrem', 16), w: 420, tab: tab || 0 });
    return S2.w;
  }
  // JackOS Setup: copy the components off the JackOS 98 CD-ROM (or remove them)
  function applyOS(pend) {
    const add = Object.keys(pend).filter(id => pend[id] && !has(id)), rem = Object.keys(pend).filter(id => !pend[id] && has(id));
    if (!add.length && !rem.length) return;
    const doIt = () => copyDlg(add.length ? 'Copying Files...' : 'Removing Files...', [...add, ...rem].flatMap(id => [PR[id].exe, PR[id].exe.replace('.EXE', '.HLP')]), add.length ? 'D:\\JACKOS 98\\' : 'C:\\JACKOS\\', () => {
      add.forEach(id => setInstalled(id, true)); rem.forEach(id => setInstalled(id, false));
      secret('setup.winsetup');
      msg('System Settings Change', 'JackOS has finished updating your components.\n\nYou must restart your computer before the new settings will take effect.\n\nDo you want to restart your computer now?', 'q', [['Yes', () => Desk.reboot('bios')], ['No']]);
    });
    if (add.length) msg('Insert Disk', 'Please insert the disk labelled \'JackOS 98 CD-ROM\', and then click OK.\n\n(It\'s in the drawer under the printer. Mom put it there "for safe keeping".)', 'info', [['OK', doIt], ['Cancel']]);
    else doIt();
  }
  function copyDlg(title, files, from, done) {
    const b = h(`<div class="dl"><div class="dl-anim"><span class="a l">${mini(J('cdrom'))}</span><span class="a r">${DL_FOLDER}</span><span class="pp">${DL_PAPER}</span><span class="pp">${DL_PAPER}</span><span class="pp">${DL_PAPER}</span></div><div class="dl-f" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">&nbsp;</div><div class="dl-bar" style="margin:6px 0"></div></div>`);
    const w = A.win(title, b, { w: 360, icon: J('cdrom', 16), noResize: true, noMax: true, noMin: true });
    const set = A.ui.progBar(qs(b, '.dl-bar')); let f = 0;
    const iv = setInterval(() => { if (w.closed) return clearInterval(iv); f += 0.04 + Math.random() * 0.05; set(f); qs(b, '.dl-f').textContent = from + pick(files.length ? files : ['SETUP.EXE']); if (f >= 1) { clearInterval(iv); setTimeout(() => { w.close(); done(); }, 300); } }, 180);
  }
  // Add/Remove > Install...: CD-ROMs in the drive, floppies, and setup files you downloaded
  function installFromDisk() {
    const sources = () => [
      ...ORDER.filter(id => PR[id].disc && !has(id)).map(id => ({ cmd: 'D:\\' + (/Cover Disc/.test(PR[id].disc) ? PR[id].dir.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '\\' : '') + 'SETUP.EXE', pid: id, label: `${PR[id].n} (${PR[id].disc})` })),
      ...S.dl.filter(x => PR[x.pid]).map(x => ({ cmd: 'C:\\My Documents\\My Downloads\\' + x.file, pid: x.pid, label: x.file + ' (downloaded)' })),
    ];
    const dl = A.ui.dialog('Install Program From Floppy Disk or CD-ROM', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(J('addrem'))}<span>Insert the product's first installation floppy disk or CD-ROM, and then click Next.</span></div>`,
      [['Next >', () => {
        const src = sources();
        const d2 = A.ui.dialog('Run Installation Program', `<p style="margin:0 0 6px">If this is the correct installation program, click Finish. To start the automatic search again, click Back. To manually search for the installation program, click Browse.</p><label style="display:block">Command line for installation program:<input type="text" class="su-cl" style="width:100%" value="${esc(src.length ? src[0].cmd : 'A:\\SETUP.EXE')}"></label><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn su-brw" type="button">Browse...</button></div>`,
          [['Finish', bx => {
            const v = qs(bx, '.su-cl').value.trim().toUpperCase(), hit = src.find(s => s.cmd.toUpperCase() === v);
            if (hit) { setTimeout(() => wizard(hit.pid, PR[hit.pid].disc ? 'cd' : 'file'), 50); return; }
            if (/^A:/.test(v)) { msg('Install', 'A:\\ is not accessible.\n\nThe device is not ready. (Is there a floppy in it? Is it the one with Dave\'s homework on?)', 'warn'); return false; }
            msg('Install', `Cannot find '${v}'.\n\nThere's nothing new to install on the disc in drive D: right now. Uninstall something first, or download some software from The Shareware Shack (${SITE}).`, 'warn'); return false;
          }], ['Cancel']], { w: 400, icon: J('addrem', 16) });
          setTimeout(() => { const br = d2 && d2.b && qs(d2.b, '.su-brw'); if (br) br.addEventListener('click', () => {
            if (!src.length) return msg('Browse', 'Drive D: contains: JACK ATTACK! Cover Disc 7\n\nEverything on it is already installed. (Jack installed it the day the magazine came.)', 'info');
            A.ui.dialog('Browse', `<div>Look in: Drives and downloads</div><div class="field ig-list" style="height:150px;background:#fff;overflow:auto">${src.map((s, i) => `<div class="su-li${i === 0 ? ' sel' : ''}" data-i="${i}">${mini(J(/^D/.test(s.cmd) ? 'cdrom' : 'exe'), 16)}<span>${esc(s.label)}</span></div>`).join('')}</div>`,
              [['Open', bx => { const s = qs(bx, '.su-li.sel'); if (s) qs(d2.b, '.su-cl').value = src[+s.dataset.i].cmd; }], ['Cancel']], { w: 380, icon: J('folderOpen', 16) });
            setTimeout(() => qsa(document, '.pg-dlg .su-li[data-i]').forEach(e => e.addEventListener('click', () => qsa(e.parentNode, '.su-li').forEach(x => x.classList.toggle('sel', x === e)))), 0);
          }); }, 0);
        return;
      }], ['Cancel']], { w: 380, icon: J('addrem', 16) });
    return dl;
  }

  // ================================================================ JACK ATTACK! Cover Disc 7 (the magazine's CD-ROM menu)
  function coverDisc() {
    const css2 = $('su-cd-css') || document.head.appendChild(Object.assign(h(null, null, 'style'), { id: 'su-cd-css', textContent: `
.cdm{background:radial-gradient(circle at 80% 20%,#5b16c9,#14002e 70%);color:#fff;font:12px/1.4 Verdana,Tahoma,sans-serif;margin:-6px;padding:10px;min-height:330px;position:relative;overflow:hidden}
.cdm-disc{position:absolute;right:-50px;top:-50px;width:190px;height:190px;border-radius:50%;background:conic-gradient(#ff0,#f0f,#0ff,#0f0,#ff0);animation:cdspin 3s linear infinite;opacity:.55}
.cdm-disc::after{content:"";position:absolute;inset:72px;border-radius:50%;background:#14002e;border:6px solid #ccc}
@keyframes cdspin{to{transform:rotate(1turn)}}
.cdm h2{position:relative;margin:0;font:bold italic 30px/1 Impact,"Arial Black",sans-serif;color:#ffe600;text-shadow:3px 3px 0 #e10600,5px 5px 0 #000;letter-spacing:1px}
.cdm .sub{position:relative;font:bold 11px Verdana,sans-serif;color:#9ff;margin:2px 0 10px;letter-spacing:2px}
.cdm-tabs{position:relative;display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.cdm-tabs button{font:bold 11px Verdana,sans-serif;color:#fff;background:linear-gradient(#3a3aff,#1a0a8a);border:2px outset #88f;padding:4px 10px;cursor:pointer}
.cdm-tabs button.on{background:linear-gradient(#ff3a3a,#8a0a0a);border-style:inset}
.cdm-list{position:relative;background:rgba(0,0,0,.45);border:1px solid #66f;padding:6px;max-height:210px;overflow:auto}
.cdm-it{display:flex;gap:8px;align-items:center;padding:5px 2px;border-bottom:1px dotted #449}
.cdm-it:last-child{border:0}
.cdm-it b{color:#ffe600}.cdm-it small{display:block;color:#ccd}
.cdm-it .btn{font-size:11px;padding:2px 8px;min-height:0;margin-left:auto;flex:none}
.cdm-foot{position:relative;margin-top:8px;font-size:10px;color:#aac}` }));
    void css2;
    const demos = () => ORDER.filter(id => PR[id].disc === 'JACK ATTACK! Cover Disc 7');
    const b = h(`<div class="cdm"><div class="cdm-disc"></div><h2>JACK ATTACK!</h2><div class="sub">COVER DISC 7 &middot; 650 MB OF GAMING GOODNESS</div><div class="cdm-tabs"><button data-t="demos" class="on">PLAYABLE DEMOS</button><button data-t="extras">EXTRAS</button><button data-t="drivers">DRIVERS</button><button data-t="help">HELP!</button></div><div class="cdm-list"></div><div class="cdm-foot">Disc not working? Ring the Cover Disc Helpline on 0898 999 999 (calls cost 50p a minute, ask permission from whoever pays the phone bill).</div></div>`);
    const w = A.win('JACK ATTACK! Cover Disc 7', b, { w: 470, icon: J('cdrom', 16), noResize: true, noMax: true });
    const list = qs(b, '.cdm-list');
    const EXTRAS = [['Readers\' high scores', 'Every score you lot sent in. Dave sent in 400 of them.', () => { const br = $('browser'); if (br) br.classList.remove('min'); IE.go('demos', 'click'); }],
      ['The Shareware Shack', 'Hundreds more programs on the Web. Goes online!', () => showSoft2()],
      ['Cheats & saves', 'Every cheat from the mag. Shh.', () => { const br = $('browser'); if (br) br.classList.remove('min'); IE.go('cheats', 'click'); }],
      ['Wallpapers', 'Spaceships, dinosaurs, racing cars and one Ork for your desktop.', () => A.open('control') && toast('Wallpapers', 'Double-click Display, then pick a wallpaper. The good ones came off this disc.', 5000)],
      ['Behind the scenes video', 'A 160x120 video of the JACK ATTACK! office (Jack\'s bedroom). 14 seconds long. 9 MB.', () => A.open('carta.mplayer')]];
    const DRV = [['DirectX 6.1', 'REQUIRED for all demos! Probably. Install it anyway.', 'dx'], ['Sound Blaster 16 drivers', 'For the bleeps.', 'sb'], ['JackNet Explorer 5.0', 'The best browser in the world (it says).', 'ie'], ['Video for JackOS (Indeo codec)', 'Makes the video play. Or at least makes it say why it won\'t.', 'vid']];
    function show(t) {
      qsa(b, '.cdm-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === t));
      if (t === 'demos') list.innerHTML = demos().map(id => `<div class="cdm-it">${mini(J(PR[id].ic || 'exe'), 24)}<div><b>${esc(PR[id].n)}</b><small>${esc(PR[id].d)}</small></div><button class="btn" data-id="${id}">${has(id) ? 'PLAY' : 'INSTALL'}</button></div>`).join('');
      else if (t === 'extras') list.innerHTML = EXTRAS.map((e, i) => `<div class="cdm-it">${mini(J('cdrom'), 24)}<div><b>${esc(e[0])}</b><small>${esc(e[1])}</small></div><button class="btn" data-x="${i}">GO</button></div>`).join('');
      else if (t === 'drivers') list.innerHTML = DRV.map((e, i) => `<div class="cdm-it">${mini(J('chip'), 24)}<div><b>${esc(e[0])}</b><small>${esc(e[1])}</small></div><button class="btn" data-d="${i}">INSTALL</button></div>`).join('');
      else list.innerHTML = `<div style="padding:4px"><b style="color:#ffe600">PROBLEMS?</b><br>1. Is the disc in the right way up? (Shiny side down.)<br>2. Have you installed DirectX 6.1? Install it again. Then once more.<br>3. Does your PC have 16 MB of RAM? Does it really? Check.<br>4. Turn it off and on again.<br>5. Still broken? It's probably Dave's fault. It usually is.<br><br><b style="color:#ffe600">MISSING DISC?</b> Ask your newsagent. Then check under the sofa.</div>`;
      qsa(list, '[data-id]').forEach(x => x.addEventListener('click', () => { const id = x.dataset.id; if (has(id)) { w.close(); launch(id); } else { w.close(); wizard(id, 'cd'); } }));
      qsa(list, '[data-x]').forEach(x => x.addEventListener('click', () => EXTRAS[+x.dataset.x][2]()));
      qsa(list, '[data-d]').forEach(x => x.addEventListener('click', () => { const k = DRV[+x.dataset.d][2]; if (k === 'ie') return msg('JackNet Explorer 5.0 Setup', 'A newer version of JackNet Explorer is already installed. (It\'s the same version.)', 'info'); copyDlg('Installing ' + DRV[+x.dataset.d][0], ['DDRAW.DLL', 'DSOUND.DLL', 'D3DIM.DLL', 'DINPUT.DLL', 'DPLAYX.DLL', 'SB16.VXD', 'IR50_32.DLL'], 'D:\\DRIVERS\\', () => { const n = store.get('jhp_setup_dx', 0) + 1; store.set('jhp_setup_dx', n); if (k === 'dx' && n >= 3) secret('setup.directx'); msg('System Settings Change', `${DRV[+x.dataset.d][0]} installed.\n\nYou must restart your computer before the new settings will take effect.\n\nDo you want to restart your computer now?`, 'q', [['Yes', () => Desk.reboot('bios')], ['No']]); }); }));
    }
    qsa(b, '.cdm-tabs button').forEach(x => x.addEventListener('click', () => { sfx('click'); show(x.dataset.t); }));
    show('demos'); sfx('startup');
    return w;
  }
  const showSoft2 = () => { const br = $('browser'); if (br) br.classList.remove('min'); IE.navigate(SHACK); };
  A.cmd(['autorun', 'd:\\setup.exe', 'd:\\autorun.exe', 'coverdisc', 'cover disc'], () => coverDisc());

  // ================================================================ The Shareware Shack (www.sharewareshack.netz) - pages in setup-shack.js
  const CATS = { games: 'Games', net: 'Internet & Chat', mm: 'Music & Multimedia', util: 'Utilities', edu: 'Education & Reference', home: 'Home & Office', fun: 'Just Plain Silly', dos: 'DOS Corner', savers: 'Screen Savers', tb: 'Toolbars & Add-ons' };
  function lazy(path) {
    return () => {
      if (window.Shack) return Shack.render(path);
      const el = h('<p style="font:13px Arial,sans-serif;padding:20px">Connecting to www.sharewareshack.netz... (the hamster is running as fast as it can)</p>');
      A.load('js/setup-shack.js').then(() => { if (el.isConnected) { const out = Shack.render(path); el.replaceWith(out); } }).catch(() => { el.textContent = 'The page cannot be displayed. (The hamster fell off its wheel.)'; });
      return el;
    };
  }
  const shackPaths = () => ['/', '/new.html', '/top.html', '/search.html', '/submit.html', '/about.html', '/help.html', ...Object.keys(CATS).map(c => '/cat/' + c + '.html'),
    ...ORDER.filter(id => PR[id].k !== 'os').flatMap(id => ['/soft/' + id + '.html', '/dl/' + id + '.html'])];
  function registerShack() {
    if (!window.IE || !IE.addSite) return;
    const pages = {}; shackPaths().forEach(p => { pages[p] = lazy(p); });
    shackOn = true;
    IE.addSite(SITE, { title: 'The Shareware Shack - FREE software downloads!', desc: 'Hundreds of FREE programs! Games, chat, MIDI players, screen savers and toolbars (sorry). Rated by real kids.', cat: 'help', pages });
  }
  const showSoft = pid => { const br = $('browser'); if (br) br.classList.remove('min'); IE.navigate(SHACK + 'soft/' + pid + '.html'); };

  // ================================================================ extras that only come from the web (their apps live in setup-shack.js)
  sw('mates', { n: 'Blobbit Screen Mates 1.0', kb: 290, lic: 'Freeware', by: 'BlobSoft', cat: 'fun', sq: 5, rel: '01/04/99', ic: 'gubbinz', def: false, apps: ['setup.mates'], paths: ['Blobbit Screen Mates >'], icons: ['suIconMates'], exe: 'SQMATES.EXE',
    d: 'A little red Blobbit that lives on your desktop! It bounces along the taskbar, climbs on your jackos, falls off them, sleeps, and eats your mouse pointer. Pick it up and throw it!' });
  sw('fish', { n: 'Desktop Fish Tank (no fish) 1.0', kb: 140, lic: 'Shareware', by: 'AquaJack Software', cat: 'fun', sq: 2, rel: '12/12/98', ic: 'screensaver', def: false, apps: ['setup.fish'], paths: ['Desktop Fish Tank >'], exe: 'FISHTANK.EXE',
    d: 'A beautiful aquarium for your desktop: bubbles, weed, gravel and a treasure chest. Fish are available in Desktop Fish Tank PRO.', note: 'Fish coming in version 2. I promise this time.' });
  sw('davezip', { n: 'DaveZip 6.3', v: '6.3', kb: 760, lic: 'Shareware', by: 'Dave\'s Computer Company (Dave)', cat: 'util', sq: 3, rel: '29/02/98', ic: 'zip', def: false, apps: ['setup.davezip'], paths: ['DaveZip >'], exe: 'DAVEZIP.EXE',
    d: 'Squash your files so they fit on a floppy! Opens .ZIP files, makes .ZIP files, and reminds you every single time that you haven\'t paid for it.', note: 'The release date is 29/02/98. Yes, I know. It\'s a feature.' });
  const lazyApp = (id, n) => A.register(id, { open: arg => A.load('js/setup-shack.js').then(() => Shack.app(n, arg)) });
  lazyApp('setup.mates', 'mates'); lazyApp('setup.fish', 'fish'); lazyApp('setup.davezip', 'davezip');
  A.addProgram(['Blobbit Screen Mates', 'Blobbit Screen Mates'], 'setup.mates', J('gubbinz', 16));
  A.addProgram(['Blobbit Screen Mates', 'Send them all home'], () => A.load('js/setup-shack.js').then(() => Shack.app('mates', 'off')), J('gubbinz', 16));
  A.addProgram(['Desktop Fish Tank', 'Desktop Fish Tank'], 'setup.fish', J('screensaver', 16));
  A.addProgram(['Desktop Fish Tank', 'Buy Fish!'], () => showSoft('fish'), J('url', 16));
  A.addProgram(['DaveZip', 'DaveZip 6.3'], 'setup.davezip', J('zip', 16));
  A.addProgram(['DaveZip', 'Register DaveZip'], () => msg('Register DaveZip', 'To register DaveZip, send £29 to Dave.\n\nDave says he will "definitely" send you a registration number.\n\nDave has never sent anyone a registration number.', 'info'), J('txt', 16));
  A.cmd(['davezip', 'winzip', 'pkzip', 'zip'], () => A.open('setup.davezip'));
  A.cmd(['fishtank', 'fish'], () => A.open('setup.fish'));
  A.cmd(['squigmates', 'screenmate', 'screenmates', 'blobbitmates', 'blobbits'], () => A.open('setup.mates'));
  A.cmd(['shareware', 'sharewareshack', 'downloads'], () => { const br = $('browser'); if (br) br.classList.remove('min'); IE.navigate(SHACK); });

  // the Start menu folder for every JackOS product shortcut that has an "Uninstall" (period-accurate clutter)
  [['Uh-Oh!', 'uhoh'], ['JackIRC', 'irc'], ['Space Jack Pinball', 'pinball'], ['Jacklings', 'grotlings']].forEach(([folder, id]) => { A.addProgram(['Uninstall', 'Uninstall ' + folder], () => uninstall(id), J('addrem', 16)); PR[id].paths.push('Uninstall > Uninstall ' + folder); });
  A.cmd(['uninstall'], () => applet(0));
  A.cmd(['sysocmgr', 'winsetup', 'jackos setup'], () => applet(1));

  // secrets
  [['setup.download', 'Fresh off the Net', 'Download a program and install it'],
    ['setup.uninstall', 'Spring cleaning', 'Get rid of a program properly'],
    ['setup.spring', 'Minimalist', 'Uninstall five things'],
    ['setup.reinstall', 'Second thoughts', 'Put something back after you took it away'],
    ['setup.eula', 'Read the small print', 'Nobody has ever read a whole licence agreement. Be the first.'],
    ['setup.eagle', 'Eagle eyes', 'Spot the sneaky extra in a setup wizard and say no'],
    ['setup.bundled', 'It came free', 'Let a setup wizard give you a little extra something'],
    ['setup.newfolder', 'New Folder (3)', 'Install something somewhere silly'],
    ['setup.dllhell', 'DLL hell', 'Choose badly when two files fight'],
    ['setup.phone', 'Get off the phone!', 'Get interrupted mid-download'],
    ['setup.hoarder', 'Download hoarder', 'Download ten programs'],
    ['setup.trial', 'The trial of the century', 'Try to remove something that refuses to go'],
    ['setup.winsetup', 'From the CD', 'Use JackOS Setup to add or remove part of JackOS'],
    ['setup.bootdisk', 'Just in case', 'Make a startup disk'],
    ['setup.nag', 'Honest customer', 'Try to pay for some shareware'],
    ['setup.directx', 'DirectX 6.1 (again)', 'Install the drivers off the cover disc. And again. And again.'],
    ['setup.warez', 'No warez here', 'Search the download site for something naughty'],
    ['setup.mirror', 'Slowest mirror in the world', 'Download from somebody\'s bedroom'],
    ['setup.rate', 'Critic', 'Rate a program for everyone to see'],
    ['setup.review', 'Everyone\'s a reviewer', 'Write a review on the download site'],
    ['setup.yeet', 'Blobbit launch', 'Throw a screen mate really hard'],
    ['setup.fatsquig', 'Well fed', 'Feed your screen mate five times'],
    ['setup.waaagh', 'Blobbit invasion', 'Fill the desktop with screen mates'],
    ['setup.fish', 'There WAS a fish', 'Knock on the glass of the empty fish tank. Keep knocking.'],
    ['setup.davezip', 'Woof', 'Open the password-protected file in Dave\'s zip'],
  ].forEach(s => A.defineSecret(s[0], s[1], s[2]));

  // ================================================================ the fresh PC: where to get software
  // The JackNet Software Centre (http://software.jacknet.jnet/, pages in setup-centre.js, lazy): categories, "Popular with
  // JackNet members" (real download counts, Net.kv ss.dl.<id>), starter packs that install in one go, and My PC.
  const CENTRE_HOST = 'software.jacknet.jnet', CENTRE = 'http://' + CENTRE_HOST + '/';
  const PACKS = [
    { id: 'gamer', n: 'The Gamer', ic: 'joystick', file: 'gamerpak.exe', tag: 'Games, games and more games.', ids: ['pinball', 'zone', 'chess', 'mahjong', 'grotball', 'revenge', 'jigsaw', 'slide', 'pcgames.jaquake'],
      d: 'Space Jack Pinball, the JackNet Gaming Zone, chess, Jack Jong, Jack Ball and the rest. Everything you need to "test the new graphics card".' },
    { id: 'chat', n: 'The Chatterbox', ic: 'messenger', file: 'chatpak.exe', tag: 'Talk to everyone. All night. (Not on the phone line Mom needs.)', ids: ['uhoh', 'irc', 'jsn', 'hangout', 'wb', 'squigtalk', 'hpz'],
      d: 'Uh-Oh! Messenger, JackIRC, JSN Messenger, the JackNet Hangout, the Whiteboard and Homepagez PageBuilder for your own home page.' },
    { id: 'music', n: 'The Music Fan', ic: 'jackamp', file: 'musicpak.exe', tag: 'Noise! (Quietly, after 9pm.)', ids: ['jackamp', 'radio', 'squigster', 'realsquig', 'bdl.jtime', 'intro', 'ssdance'],
      d: 'JackAmp with its bouncy spectrum analyser, JackNet Radio, Jackster for swapping MIDIs, RealJack and JackTime for videos the size of a stamp, and a demoscene intro.' },
    { id: 'nerd', n: 'The Nerd', ic: 'cube', file: 'nerdpak.exe', tag: 'For people who know what an IRQ is.', ids: ['jbasic', 'gc', 'winsquig', 'cubetimer', 'cubetrain', 'sqhome', 'y2kpatch', 'grotquest', 'dosgames'],
      d: 'JBASIC, Jack Commander, WinJack, the cube timer and trainer, JACK@home, the Y2K patch, a text adventure and six DOS games.' },
    { id: 'showoff', n: 'The Show-Off', ic: 'themes', file: 'deskpak.exe', tag: 'Make the desktop look AMAZING. And busy.', ids: ['mates', 'neko', 'grotchi', 'island', 'maze', 'ssbaby', 'photo', 'bdl.th.space'],
      d: 'Blobbit Screen Mates, Robo-Neko, a Jackotchi, Jack Island, the 3D maze, the dancing baby robot, a new photo every day and the Outer Space theme.' },
    { id: 'dave', n: 'Dave\'s Pack', ic: 'warning', file: 'DAVESTUF.EXE', tag: 'Dave says it is "well good". Dave is often wrong.', ids: ['happy99', 'ramdbl', 'prank', 'modem', 'regfix', 'buddy', 'staples', 'davezip'],
      d: 'Everything Dave put on his computer: fireworks off an e-mail, RAM Doubler, his joke program, Modem Turbo, Registry Fixer Pro, Purple Pal, Staples and DaveZip. What could go wrong?' },
  ];
  const ICON_GET = '<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path d="M3 15l13-5 13 5-13 5z" fill="#e8c27a" stroke="#000"/><path d="M3 15v10l13 5V20z" fill="#c8963a" stroke="#000"/><path d="M29 15v10l-13 5V20z" fill="#a8762a" stroke="#000"/><path d="M3 15l-2 4 13 5 2-4zM29 15l2 4-13 5-2-4z" fill="#f2d79a" stroke="#000"/>'
    + '<circle cx="21" cy="9" r="7" fill="#2a7ad8" stroke="#000"/><path d="M15 8c3 1 4-2 7-1s3 3 5 2M15.5 12c3-1 5 1 8 0" stroke="#1a9a3a" stroke-width="2" fill="none"/><path d="M8 2h4v6h3l-5 6-5-6h3z" fill="#22c022" stroke="#000"/></svg>';
  let fromHome = null;
  // a product's icon: its own JICON, else the icon of its Start menu shortcut, else a plain program
  function iconOf(p, sz) {
    sz = sz || 16;
    if (p.ic && window.JICON && JICON.has(p.ic)) return mini(J(p.ic, sz), sz);
    const prog = (A.programs || []).find(x => (typeof x.target === 'string' && p.apps.includes(x.target)) || p.paths.some(pa => pa.endsWith(' >') ? x.path.join(' > ').startsWith(pa + ' ') : x.path.join(' > ') === pa));
    return mini(prog && prog.icon ? prog.icon : J('exe', sz), sz);
  }
  const everything = () => ORDER.filter(id => PR[id].k !== 'os' && PR[id].k !== 'tb' && has(id));
  const mine = () => everything().filter(id => !FRESH.has(id)); // programs this visitor added (not the ones that came with the PC)
  const browserUp = () => { const br = $('browser'); if (br) br.classList.remove('min'); };
  const openCentre = path => { browserUp(); IE.navigate(CENTRE + String(path || '').replace(/^\//, '')); };
  function lazyCentre(path) {
    return () => {
      if (window.Centre) return Centre.render(path);
      const el = h('<p style="font:13px Verdana,sans-serif;padding:20px">Connecting to the JackNet Software Centre... (downloading the catalogue: 3 KB)</p>');
      A.load('js/setup-centre.js').then(() => { if (el.isConnected) el.replaceWith(Centre.render(path)); }).catch(() => { el.textContent = 'The page cannot be displayed. (The catalogue fell off the server.)'; });
      return el;
    };
  }
  function registerCentre() {
    if (!window.IE || !IE.addSite) return;
    const pages = {};
    ['/', '/packs.html', '/popular.html', '/mypc.html', '/az.html', '/where.html', ...Object.keys(CATS).map(c => '/cat/' + c + '.html'), ...PACKS.map(p => '/pack/' + p.id + '.html')].forEach(p => { pages[p] = lazyCentre(p); });
    IE.addSite(CENTRE_HOST, { title: 'JackNet Software Centre', desc: 'Fill up your new PC! Every program on JackNet, sorted, with Starter Packs that install in one go and what other members have got.', cat: 'help', pages });
  }
  const centreWin = () => A.load('js/setup-centre.js').then(() => Centre.folder());
  A.register('setup.centre', { cmd: ['software', 'software centre', 'softwarecentre', 'software center', 'softwarecenter', 'get software', 'getsoftware', 'catalogue', 'catalog'], open: arg => { openCentre(arg); } });
  A.register('setup.getsoft', { single: true, open: () => centreWin() });
  A.addProgram(['JackNet Software Centre'], 'setup.centre', mini(ICON_GET, 16));
  A.cmd(['starter pack', 'starterpack', 'starter packs'], () => openCentre('packs.html'));
  // the Start menu item, under JackOS Update (like the real one sat at the top of the Start menu)
  function startItem() {
    const up = $('smUpdate'); if (!up || $('smSoftware')) return;
    const b = h(mini(ICON_GET, 32) + 'Software Centre', null, 'button'); b.id = 'smSoftware'; b.setAttribute('role', 'menuitem'); b.title = 'Get programs for your PC from JackNet';
    b.addEventListener('click', ev => { ev.stopPropagation(); const sm = $('startMenu'); if (sm) sm.classList.remove('open'); sfx('click'); openCentre(); });
    up.after(b);
  }
  // "Get it here" strips on the programs' own web sites (keys: hidden page words, site hosts, or host + path)
  const HOME_SOFT = { jackamp: ['jackamp'], skins: ['jackamp'], uhoh: ['uhoh'], jackirc: ['irc'], jackcarta: ['carta', 'typing', 'stamp'],
    'jacknetzone.jnet/': ['zone'], 'jacknetzone.jnet/home.html': ['zone'], 'jacknetzone.jnet/plugin.html': ['zone'], 'jacknetzone.jnet/games.html': ['zone'],
    'jackexchange.grot': ['ticker'], 'cuberecords.infobahn': ['cubetrain', 'cubetimer'], 'room14.cyb': ['jbasic', 'intro', 'irc'], 'megahertzmike.cyb': ['slide', 'cubetimer'],
    'homepagez.webcom': ['hpz'], 'jackotchigraveyard.kidz': ['grotchi'], 'midiheaven.wubwub': ['jackamp', 'squigster'], 'radiojack.wubwub': ['radio', 'realsquig'],
    'trailerpark.flick': ['realsquig', 'bdl.jtime'], 'podracinghq.jnet': ['podracer'], 'episode1countdown.jnet': ['podracer'], 'millenniumbunker.netz': ['y2ksuite', 'y2kpatch'],
    'y2kscan.netz': ['y2kpatch'], 'downloadmoreram.w3b': ['ramdbl'], 'freestuff4u.w3b': ['cursors', 'weather', 'buddy', 'modem', 'regfix'], 'popupmania.w3b': ['buddy'],
    'spacepage.infobahn': ['sqhome'], 'chatterbox.netz': ['irc', 'uhoh'], 'jackdot.jnet': ['gc', 'winsquig'], 'jackfaqs.w3b': ['grotquest', 'dosgames'], 'scifizone.cyb': ['pinball'],
    'megaflash.cyb': ['bdl.shock'], 'jackflash-required.cyb': ['bdl.shock'], 'jacktoonz.toonz': ['bdl.shock'], 'hoaxwatch.netz': ['lan.squigclean'], 'mysquigfarm.webcom': ['mates', 'neko'], 'mypixelfarm.webcom': ['mates', 'neko'],
    'petrock.netz': ['fish'], 'davesplace.jnet': ['prank', 'happy99', 'davezip'], 'kimspopzone.kidz': ['ssbaby', 'ssdance'], 'orkpaint.grot': ['kpt'], 'galaxyring.jnet': ['island', 'maze'],
    'cheatz.w3b': ['ski', 'pipe'], 'jacksearch.find': ['staples'] };
  function strip(ids, host) {
    const el = $('s-secret'); if (!el) return;
    const old = qs(el, '.su-strip'); if (old) old.remove();
    const s = h(null, 'su-strip'), draw = () => {
      s.innerHTML = `<b class="su-st-h">&#11015; GET IT HERE</b>${ids.map(id => { const p = PR[id]; return `<span class="su-st-i">${iconOf(p, 16)}<span><b>${esc(p.n)}</b> <small>${esc(p.lic)} &middot; ${kbStr(p.kb)}</small></span>${has(id) ? `<button type="button" class="btn su-st-b" data-run="${esc(id)}">&#10004; Installed: Open</button>` : p.nodl ? `<button type="button" class="btn su-st-b" data-cd="${esc(id)}">Install from CD-ROM</button>` : `<button type="button" class="btn su-st-b su-st-dl" data-dl="${esc(id)}">Download now!</button>`}</span>`; }).join('')}<a href="#" class="su-st-more" data-su-centre="1">More programs at the JackNet Software Centre &raquo;</a>`;
    };
    draw(); el.prepend(s);
    s.addEventListener('click', ev => {
      const t = ev.target.closest('[data-run],[data-cd],[data-dl]'); if (!t) return;
      if (t.dataset.run) return launch(t.dataset.run);
      if (t.dataset.cd) return wizard(t.dataset.cd, 'cd');
      fromHome = t.dataset.dl; download(t.dataset.dl, { host: 'ftp.' + String(host || CENTRE_HOST).replace(/^www\./, '') });
    });
    const onCh = () => { if (s.isConnected) draw(); else document.removeEventListener('setup', onCh); };
    document.addEventListener('setup', onCh);
  }
  document.addEventListener('section', ev => {
    const d = String(ev.detail || ''); if (!/^(secret|site):/.test(d)) return;
    const key = d.replace(/^(secret|site):/, '').toLowerCase().replace(/^www\./, ''), host = key.split('/')[0];
    const ids = (HOME_SOFT[key] || (key.includes('/') && HOME_SOFT[host]) || []).filter(id => PR[id]);
    if (ids.length) setTimeout(() => strip(ids, /\./.test(host) ? host : 'jackattack.jnet'), 0);
  });
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('[data-su-centre]'); if (!a) return; ev.preventDefault(); openCentre(a.dataset.suCentre === '1' ? '' : a.dataset.suCentre); });
  // "My PC: 23 programs installed" on members' JackNet profiles (Net.kv su.pc: nick -> count; members only publish)
  const pcField = n => String(n || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '_').slice(0, 24) || 'x';
  let pcT = 0;
  function pcCount() { clearTimeout(pcT); pcT = setTimeout(() => { try { if (!ALLSOFT && window.Net && Net.me && Net.me.member && Net.kv) Net.kv.put('su.pc', pcField(Net.me.nick), String(mine().length)); } catch (e) {} }, 2500); }
  if (window.Net && Net.on) {
    Net.on('welcome', m => { if (m && m.member) pcCount(); });
    Net.on('loginOk', () => pcCount());
    Net.on('profile', m => {
      if (!m || !m.p || !m.p.name) return;
      const p = m.p;
      setTimeout(() => {
        const t = qs(document, '#memView .profile .pfacts'); if (!t || qs(t, '.su-mypc')) return;
        const row = h('<th>My PC</th><td>...</td>', 'su-mypc', 'tr'); (qs(t, 'tbody') || t).appendChild(row);
        const fill = n => { qs(row, 'td').innerHTML = n == null || isNaN(n) ? '<i>a fresh JackOS 98 install</i>' : `<b>${n}</b> program${n === 1 ? '' : 's'} installed <a href="#" data-su-centre="${p.me ? 'mypc.html' : '1'}">(${p.me ? 'see them' : 'get some'})</a>`; };
        if (p.me) fill(mine().length);
        else Net.kv.get(['su.pc']).then(v => { const o = v && v['su.pc']; fill(o && o[pcField(p.name)] != null ? +o[pcField(p.name)] : null); });
      }, 0);
    });
  }
  // secrets for the fresh PC
  function freshCheck() {
    if (ALLSOFT) return;
    const n = mine().length;
    if (n >= 25) secret('fresh.25');
    if (!everything().length && !ORDER.some(id => PR[id].k === 'os' && has(id)) && !(window.OldPC && OldPC.installed && OldPC.installed.length)) secret('fresh.bare');
    pcCount();
  }
  [['fresh.pack', 'Starter pack', 'Fill up a fresh PC in one go'], ['fresh.dave', 'Dave\'s computer', 'Let Dave choose your software. (Don\'t.)'],
    ['fresh.25', 'Fully loaded', 'Have 25 programs installed at once'], ['fresh.bare', 'Fresh out of the box (again)', 'Take off everything you can. EVERYTHING.'],
    ['fresh.homepage', 'Straight from the source', 'Download a program from its own web site'], ['fresh.folder', 'Window shopping', 'Look in the Get Software folder'],
  ].forEach(s => A.defineSecret(s[0], s[1], s[2]));
  // the first-boot balloon ("Your PC is fresh out of the box!") or, for people who were here before, what changed
  function afterLogon(fn, n) {
    n = n || 0;
    if ((!DesktopSurface.ready() || document.querySelector('.logon, .dialwin, .jlogoff:not(.jlbye)')) && n < 240) return setTimeout(() => afterLogon(fn, n + 1), 500);
    fn();
  }
  function hello() {
    if (S.hi || ALLSOFT) return;
    S.hi = 1; save();
    if (S.mig) { toast('JackNet Software Centre', 'New: get more programs from the JackNet Software Centre (Start > Software Centre). Everything you had is still installed on this PC.', 9000); return; }
    if (mine().length) return;
    const b = toast('Welcome to your new PC!', 'Your PC is fresh out of the box: just JackOS 98 and a few card games. Get programs from JackNet:', 20000);
    if (!b || !b.appendChild) return;
    const L = [['Software Centre', () => openCentre()], ['Starter Packs', () => openCentre('packs.html')], ['Shareware Shack', () => { browserUp(); IE.navigate(SHACK); }], ['Games Cupboard', () => A.open('discs.cupboard')], ['JackNet Zone', () => { browserUp(); IE.navigate('http://www.jacknetzone.jnet/'); }]];
    const box = h(L.map((x, i) => `<a href="#" data-i="${i}">${esc(x[0])}</a>`).join(' &middot; '), 'su-hello');
    box.addEventListener('click', ev => { const a = ev.target.closest('a'); if (!a) return; ev.preventDefault(); ev.stopPropagation(); b._gone && b._gone(); sfx('click'); L[+a.dataset.i][1](); });
    b.appendChild(box); b.classList.add('su-hello-b');
  }

  function toolbars() {
    if (!window.OldPC || !OldPC.NAMES) return;
    const BLURB = ['Search the Web from ANY page! Also changes your home page, your search page and your mind.', 'FREE smileys, FREE cursors, FREE everything!!! (Shows a few adverts. Only a few. Every few seconds.)', 'Makes JackNet Explorer up to 400% faster!* (*not tested)', 'The toolbar everyone is talking about. Mostly complaining about, but talking.', 'One click and it\'s yours. Two clicks and it\'s also on your cousin\'s computer somehow.'];
    Object.keys(OldPC.NAMES).forEach((k, i) => product('tb.' + k, { tb: k, k: 'tb', n: OldPC.NAMES[k], v: (1 + i % 4) + '.' + (i * 7 % 10), kb: 90 + i * 37 % 400, lic: 'Adware', by: ['ToolbarCorp', 'FreeStuff Media', 'BarBarBar Ltd', 'ClickClick Inc.', 'Gubbinz Software Ltd'][i % 5], cat: 'tb', sq: 1 + i % 2, rel: '0' + (1 + i % 9) + '/0' + (1 + i % 9) + '/99', ic: 'jacknet', def: false, exe: 'TBSETUP.EXE', d: BLURB[i % BLURB.length] }));
  }
  function init() {
    toolbars();
    rebuild(); restoreFiles(); registerShack(); refreshIcons();
    // the extras' desktop icon
    if (!$('suIconMates')) A.desktopIcon('Screen Mates', J('gubbinz'), () => A.open('setup.mates'), 'suIconMates');
    refreshIcons();
    // screen mates come back after a reboot
    if (has('mates') && store.get('jhp_setup_mates', 0) > 0) setTimeout(() => A.load('js/setup-shack.js').then(() => Shack.app('mates', 'boot')).catch(() => {}), 4000);
    // the fresh PC: the Software Centre site, the Start menu item, the Get Software desktop folder and the first-boot balloon
    registerCentre(); startItem();
    if (!$('suIconGetSoft')) { const ic = A.desktopIcon('Get Software', ICON_GET, () => A.open('setup.getsoft'), 'suIconGetSoft'), on = $('iconOnline'); if (ic && on && on.parentNode === ic.parentNode) on.after(ic); }
    (window.BootDone || Promise.resolve()).then(() => setTimeout(() => afterLogon(() => setTimeout(hello, 3500)), 500));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);

  window.Setup = {
    product, has, ok, coverDisc, missing, missingCmd, track, showProgram, blockedCmd, applet, install: (id, src) => wizard(id, src || 'web'), uninstall, download, launch, setInstalled, showSoft,
    get list() { return ORDER.map(id => PR[id]); }, get(id) { return PR[id]; }, CATS, SITE, SHACK, kbStr, setupFile, J, d99,
    PACKS, CENTRE, CENTRE_HOST, ICON_GET, iconOf, openCentre, mine, everything, fresh: id => FRESH.has(id), get migrated() { return !!S.mig; },
  };
})();
