/* homepages: Homepagez member homepages. JackNet members build a REAL homepage with "Homepagez PageBuilder" and
 * everybody else can visit it in JackNet Explorer and sign its guestbook.
 *   http://members.homepagez.webcom/~name/             a member's page (also /~name/home.html if a made-up resident has the name)
 *   http://www.homepagez.webcom/SpaceCity/Launchpad/4023/   the same page by its street address
 *   http://members.homepagez.webcom/directory.html     the Member Pages directory (by neighbourhood, newest, most visited)
 *   http://members.homepagez.webcom/signup.html        "Build your own FREE homepage! 2 MB of space!"
 * A page is STRUCTURED DATA (a list of blocks), never HTML. mods/homepages.js (the server) validates and cleans every
 * field, and the renderer (homepages-view.js) escapes every bit of text again. The top part of this file is shared
 * with the server (it's require()d by mods/homepages.js), so it must stay plain data + pure functions.
 * Lazy parts: js/homepages-view.js (renderer, directory, sign-up page), js/homepages-builder.js (the PageBuilder). */
(function () {
  'use strict';
  // ================================================================ shared data (client + server)
  const HPZ = {
    LIMITS: { blocks: 40, text: 300, json: 16384, gb: 40, gbText: 200, links: 10, items: 10, stickers: 8, badges: 8, opts: 5 },
    HOODS: {
      SpaceCity: { streets: ['Launchpad', 'Nebula', 'Orbit', 'Asteroid'], ico: 'rocket', bg: '#000033', fg: '#ccffee', blurb: 'Space, science and the future (which is 2000).',
        rules: ['No pages about ice cream. (It melts in the rocket exhaust.)', 'All countdowns must reach zero eventually.', 'Aliens welcome. Please wipe your feet.', 'No saying the Moon is made of cheese. (#12 Orbit Street already did.)', 'Pages must be at least 50% space.'] },
      Arcadia: { streets: ['Joystick', 'Pixel', 'Cartridge', 'Highscore'], ico: 'joystick', bg: '#200030', fg: '#ffccff', blurb: 'Games, cheats, high scores and the people who play them.',
        rules: ['No cheating on the High Score Hall of Fame.', 'Blowing on cartridges is allowed.', 'Every page must mention at least one game. Any game. Even Pong.', 'No spoilers without a big WARNING!!! sign.', 'Respect the pause button.'] },
      Grotville: { streets: ['Mudpit', 'Fungus', 'Teefstreet', 'Squigalley'], ico: 'squig', bg: '#2a3a1a', fg: '#ccff99', blurb: 'Monsters, aliens, slime, War Hamster, mud and anyone who likes the colour green.',
        rules: ['Mud is compulsory.', 'No pages about soap.', 'Pets must be kept on a lead. Even virtual ones.', 'Shouting counts as a whole sentence.', 'Gubbinz is in charge. (He says.)'] },
      Tunesville: { streets: ['Bassline', 'Recorder', 'Encore', 'Mixtape'], ico: 'guitar', bg: '#300a00', fg: '#ffdd99', blurb: 'Bands, fans, MIDIs and people learning the recorder (sorry, neighbours).',
        rules: ['No recorder practice after 8pm.', 'MIDIs must be turned DOWN when Mom says so.', 'Air guitar counts as an instrument.', 'No pages about silence.', 'Every band is the best band in the world.'] },
      PetPark: { streets: ['Goldfish', 'Tortoise', 'Kennel', 'Hutch'], ico: 'dog', bg: '#1a3a10', fg: '#eeffcc', blurb: 'Pets: real ones, pretend ones, and ones that are rocks.',
        rules: ['Pets must be real, pretend, or a rock.', 'No pages about cats on Goldfish Street. (It upsets the residents.)', 'Hamsters may not run the webring.', 'Tortoise pages may be updated slowly.', 'Clean up after your dog. (Including on the guestbook.)'] },
    },
    // houses the made-up residents already live in (see web-p5.js); 'FOR RENT' ones are free to move into
    TAKEN: ['spacecity/launchpad/4021', 'spacecity/launchpad/4022', 'spacecity/launchpad/4030', 'spacecity/nebula/1999', 'spacecity/nebula/2001', 'spacecity/orbit/7', 'spacecity/orbit/8', 'spacecity/orbit/12',
      'arcadia/joystick/2210', 'arcadia/joystick/2211', 'arcadia/joystick/2212', 'arcadia/pixel/3112', 'arcadia/pixel/3120', 'arcadia/cartridge/64', 'arcadia/cartridge/65',
      'grotville/mudpit/1234', 'grotville/mudpit/1235', 'grotville/mudpit/1236', 'grotville/fungus/4040', 'grotville/teefstreet/1', 'grotville/teefstreet/2', 'grotville/teefstreet/3',
      'tunesville/bassline/8080', 'tunesville/bassline/8081', 'tunesville/bassline/8082', 'tunesville/recorder/1212', 'tunesville/encore/99', 'tunesville/encore/100',
      'petpark/goldfish/101', 'petpark/goldfish/103', 'petpark/tortoise/7070', 'petpark/tortoise/7071', 'petpark/kennel/1', 'petpark/kennel/2', 'petpark/kennel/3', 'petpark/kennel/4'],
    RENT: ['spacecity/launchpad/4023', 'spacecity/nebula/2010', 'arcadia/pixel/3113', 'arcadia/cartridge/66', 'grotville/fungus/4041', 'tunesville/recorder/1213', 'petpark/goldfish/102'],
    // made-up residents of members.homepagez.webcom/~name/ (their page wins; a member with the same name gets /~name/home.html)
    RESIDENTS: ['gubbinz', 'biscuit', 'tom'],
    PALETTE: [['#000000', 'Black'], ['#ffffff', 'White'], ['#c0c0c0', 'Silver'], ['#808080', 'Grey'], ['#ff0000', 'Red'], ['#800000', 'Maroon'], ['#ff8000', 'Orange'], ['#ffff00', 'Yellow'],
      ['#808000', 'Olive'], ['#00ff00', 'Lime'], ['#008000', 'Green'], ['#00ff99', 'Mint'], ['#00ffff', 'Aqua'], ['#008080', 'Teal'], ['#0000ff', 'Blue'], ['#000080', 'Navy'],
      ['#9966ff', 'Lilac'], ['#800080', 'Purple'], ['#ff00ff', 'Fuchsia'], ['#ff69b4', 'Hot Pink']],
    FONTS: [['times', 'Times New Roman', '"Times New Roman",Times,serif'], ['arial', 'Arial', 'Arial,Helvetica,sans-serif'], ['comic', 'Comic Sans MS', '"Comic Sans MS","Comic Sans",cursive'],
      ['courier', 'Courier New', '"Courier New",Courier,monospace'], ['impact', 'Impact', 'Impact,"Arial Black",sans-serif'], ['verdana', 'Verdana', 'Verdana,Geneva,sans-serif'], ['georgia', 'Georgia', 'Georgia,serif']],
    BGS: [['none', 'Plain colour'], ['stars', 'Starry night'], ['space', 'Deep space'], ['clouds', 'Fluffy clouds'], ['grass', 'Grass'], ['bricks', 'Brick wall'], ['flames', 'FLAMES!!!'], ['water', 'Under the sea'],
      ['paper', 'Exercise book'], ['hearts', 'Pink hearts'], ['slime', 'Green slime'], ['matrix', 'Green computer code'], ['checker', 'Checkerboard'], ['denim', 'Denim'], ['rainbow', 'Rainbow stripes (ow)']],
    TUNES: [['none', '(no music)'], ['hpz_elise', 'FURELISE.MID'], ['hpz_joy', 'ODE2JOY.MID'], ['hpz_ent', 'ENTRTAIN.MID'], ['hpz_green', 'GRNSLEEV.MID'], ['hpz_space', 'SPACEY.MID'], ['hpz_grot', 'GROTHOP.MID'],
      ['web-rave', 'RAVE99.MID'], ['web-space', 'STARS.MID'], ['web-sad', 'SADSONG.MID'], ['web-hamster', 'HAMSTER.MID'], ['jamp_dial_up_dreams', 'DIALUP.MID'], ['jamp_rubik_rag', 'RUBIKRAG.MID'],
      ['jamp_y2k_bug_boogie', 'Y2KBOOGI.MID'], ['jamp_waaagh_anthem', 'WAAAGH.MID'], ['theme', 'JACKATAK.MID'], ['tris', 'KOROBEIN.MID']],
    HRS: [['groove', '3D groove'], ['plain', 'Plain line'], ['rainbow', 'Rainbow'], ['flames', 'Flames'], ['dots', 'Bouncy dots'], ['squig', 'Squiggle'], ['barbed', 'Barbed wire'], ['stars', 'Stars']],
    UCS: [['sign', 'Road sign'], ['worker', 'Digging man'], ['tape', 'Hazard tape']],
    SPRITES: ['cat', 'dog', 'hamster', 'rock', 'fish', 'ork', 'squig', 'house', 'computer', 'floppy', 'cube', 'rocket', 'planet', 'ufo', 'trophy', 'guitar', 'star', 'cake', 'flower', 'ball', 'yoyo', 'kid', 'pod', 'teapot', 'skull', 'tree', 'car', 'robot', 'tortoise', 'mushroom', 'candle', 'joystick', 'blob', 'bat', 'dragon'],
    CLIPART: ['globe', 'mail', 'new', 'hot', 'smiley', 'heart', 'cone', 'point', 'fire', 'eyes'],
    COUNTERS: [['odo', 'Odometer'], ['lcd', 'Green LCD'], ['led', 'Red LED'], ['plain', 'Plain text'], ['words', 'In words']],
    CLABELS: ['You are visitor number', 'Visitors since I started counting:', 'Hits:', 'People who have looked at this page:'],
    BADGES: [['bvie', 'Best viewed with', 'JackNet Explorer', 'linear-gradient(#0050c0,#002070)', '#fff'], ['bv800', 'Best viewed at', '800 x 600', '#000', '#00ff00'], ['y2k', 'Y2K', 'COMPLIANT!', '#c00000', '#ffff00'],
      ['notepad', 'Made with', 'Notepad', '#fff', '#000'], ['pgb', 'Made with', 'PageBuilder', 'linear-gradient(#ff6a00,#ffd400)', '#000'], ['hpz', 'Hosted FREE by', 'Homepagez', '#ffd400', '#c04000'],
      ['nofr', 'NO FRAMES!', '(no way!)', '#808080', '#fff'], ['modem', 'I \u2665 my', '56K modem', '#008080', '#fff'], ['ork', 'WAAAGH!', 'Ork approved', '#1a7a1a', '#ffff00'],
      ['jnet', 'JackNet', 'MEMBER', '#000080', '#fff'], ['mom', 'Mom', 'approved', '#ff69b4', '#fff'], ['tea', 'Powered by', 'tea & biscuits', '#8a5a2a', '#fff'],
      ['cube', 'Cubers', 'Club 1999', 'linear-gradient(90deg,#e10600,#ffd400,#2a7ad8)', '#fff'], ['nojunk', 'No junk', 'e-mail!', '#fff', '#c00000'], ['kids', 'Kid-safe', 'site', '#00a000', '#fff'], ['y2000', 'Ready for', 'the year 2000!', '#000', '#ffff00']],
    RINGS: [['hpz', 'Homepagez Member Ring'], ['biscuit', 'The Biscuit Ring'], ['galaxy', 'The Galaxy Ring']],
    HOWS: [['surf', 'Just surfing'], ['ring', 'A webring'], ['search', 'A search engine'], ['mate', 'A mate told me'], ['lost', 'I am lost'], ['dir', 'The Member Pages directory']],
    BULLETS: [['dot', 'Dots'], ['star', 'Stars'], ['squig', 'Blobbits'], ['num', 'Numbers']],
    ALIGNS: ['l', 'c', 'r'],
    TLDS: ['jnet', 'kidz', 'homepagez', 'webcom', 'cyb', 'wubwub', 'netz', 'w3b', 'infobahn', 'grot', 'find', 'zyne'],
  };
  HPZ.STICKERS = HPZ.SPRITES.concat(HPZ.CLIPART);
  // a link may only go somewhere on the (fake) World Wide Web: http://host.on.a.fake.tld/path
  HPZ.URL_RE = new RegExp('^http://(?:[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?\\.){1,3}(?:' + HPZ.TLDS.join('|') + ')(?:/[a-z0-9._~/-]{0,100})?$');
  HPZ.normUrl = function (u) {
    let s = String(u == null ? '' : u).trim().toLowerCase().slice(0, 140);
    if (!s) return '';
    if (/^https:\/\//.test(s)) s = 'http://' + s.slice(8);
    if (!/^[a-z][a-z0-9+.-]*:/.test(s)) s = 'http://' + s.replace(/^\/+/, '');
    if (/^http:\/\/[^/]+$/.test(s)) s += '/';
    return HPZ.URL_RE.test(s) ? s : '';
  };
  HPZ.addrKey = (hood, street, num) => (hood + '/' + street + '/' + (num | 0)).toLowerCase();
  HPZ.addrText = (hood, street, num) => hood + '/' + street + '/' + (num | 0);
  HPZ.findHood = h => Object.keys(HPZ.HOODS).find(k => k.toLowerCase() === String(h || '').toLowerCase()) || null;
  HPZ.findStreet = (hood, s) => hood && HPZ.HOODS[hood] ? HPZ.HOODS[hood].streets.find(k => k.toLowerCase() === String(s || '').toLowerCase()) || null : null;
  HPZ.ids = list => list.map(x => Array.isArray(x) ? x[0] : x);

  if (typeof module === 'object' && module.exports) { module.exports = HPZ; return; }
  if (typeof window === 'undefined' || !window.Apps) return;

  // ================================================================ client: the always-loaded bits
  const A = window.Apps, esc = A.esc;
  window.HPZ = HPZ;
  const MH = 'members.homepagez.webcom', WH = 'www.homepagez.webcom';
  HPZ.MH = MH; HPZ.WH = WH;
  // the made-up "Coming soon" kid lives at /~<their name>/ for this visitor (js/cast.js) as well as the old /~tom/: a real member
  // with that name gets /~name/home.html here, which works for every visitor
  if (window.Cast) { const s = Cast.slug('kidSoon'); if (s && !HPZ.RESIDENTS.includes(s)) HPZ.RESIDENTS.push(s); }
  HPZ.memberPath = name => '/~' + String(name).toLowerCase() + '/' + (HPZ.RESIDENTS.includes(String(name).toLowerCase()) ? 'home.html' : '');
  HPZ.memberUrl = name => 'http://' + MH + HPZ.memberPath(name);
  HPZ.addrUrl = a => 'http://' + WH + '/' + String(a || '') + '/';
  HPZ.isRent = (hood, street, num) => HPZ.RENT.includes(HPZ.addrKey(hood, street, num));
  HPZ.isTaken = (hood, street, num) => HPZ.TAKEN.includes(HPZ.addrKey(hood, street, num));
  HPZ.esc = esc;

  // ---- talking to mods/homepages.js: req({t:..}) -> Promise(reply); HPZ.on(type, fn) for broadcasts
  let rid = 0; const pend = {}, subs = {};
  ['hpzPage', 'hpzList', 'hpzPublished', 'hpzGb', 'hpzPoll', 'hpzOk', 'hpzErr', 'hpzGbNew', 'hpzPollNew', 'hpzNew'].forEach(t => Net.on(t, m => {
    if (m && m.rid && pend[m.rid]) { const p = pend[m.rid]; delete pend[m.rid]; p(m); }
    (subs[t] || []).slice().forEach(fn => { try { fn(m); } catch (e) { console.error(e); } });
  }));
  HPZ.req = (msg, ms) => new Promise(res => {
    const id = msg.rid || ++rid; msg.rid = id; pend[id] = res;
    if (!Net.send(msg)) { delete pend[id]; return res({ t: 'hpzErr', err: 'JackNet is not connected. (Is the modem plugged in?)', offline: true }); }
    setTimeout(() => { if (pend[id]) { delete pend[id]; res({ t: 'hpzErr', err: 'The Homepagez server took too long to answer. Try again!', timeout: true }); } }, ms || 9000);
  });
  HPZ.rid = () => ++rid;
  HPZ.on = (t, fn) => { (subs[t] = subs[t] || []).push(fn); return () => { subs[t] = (subs[t] || []).filter(x => x !== fn); }; };
  HPZ.me = () => (window.Net && Net.me) || {};
  HPZ.titles = {}; // lower name -> title (from directory listings), so the window title is right straight away

  HPZ.loadView = () => A.load('js/web-kit.js').catch(() => {}).then(() => A.load('js/homepages-view.js'));
  HPZ.loadBuilder = () => HPZ.loadView().then(() => A.load('js/homepages-builder.js'));
  const showBrowser = () => { const b = document.getElementById('browser'); if (b) b.classList.remove('min'); };
  HPZ.go = url => { showBrowser(); IE.navigate(url); };

  // ================================================================ the PageBuilder program (window now, insides lazy-loaded)
  const ICON32 = '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="24" height="22" fill="#fff" stroke="#000"/><rect x="2" y="4" width="24" height="5" fill="#000080"/><rect x="5" y="12" width="12" height="3" fill="#ff6a00"/><rect x="5" y="17" width="16" height="2" fill="#808080"/><rect x="5" y="21" width="10" height="2" fill="#808080"/><circle cx="24" cy="22" r="7" fill="#2a7ad8" stroke="#000"/><path d="M17 22h14M24 15v14M19 18c3 2 7 2 10 0M19 26c3-2 7-2 10 0" stroke="#7fe07f" fill="none"/><path d="M27 4l4 4-9 9-5 1 1-5z" fill="#ffd400" stroke="#000"/></svg>';
  HPZ.ICON = ICON32;
  A.register('hpz.builder', { single: true, cmd: ['pagebuilder', 'pgbuild', 'homepagez', 'hpz'], open(arg) {
    const body = document.createElement('div'); body.className = 'hpzb-loading';
    body.innerHTML = '<p style="margin:20px;font:12px Tahoma,sans-serif">Loading Homepagez PageBuilder 2.0...<br><br>Checking for 2 MB of free web space... OK</p>';
    const w = A.win('Homepagez PageBuilder', body, { w: 860, h: innerWidth < 640 ? innerHeight - 50 : 600, icon: ICON32, menubar: true, status: true, minW: 300, minH: 260 });
    HPZ.loadBuilder().then(() => { if (!w.closed && HPZ.builder) HPZ.builder.mount(w, arg); })
      .catch(() => { if (!w.closed) body.innerHTML = '<p style="margin:20px">PGBUILD.EXE is corrupt or missing. Try reinstalling it from the CD-ROM. (Or press Refresh: the floppy might just be slow.)</p>'; });
    return w;
  } });
  HPZ.openBuilder = arg => { const w = A.open('hpz.builder', arg); if (arg && HPZ.builder && HPZ.builder.apply && w) HPZ.builder.apply(arg); return w; };
  A.addProgram(['Internet', 'Homepagez PageBuilder'], 'hpz.builder', ICON32);
  A.desktopIcon('PageBuilder', ICON32, () => HPZ.openBuilder(), 'iconHpzBuilder');
  A.cmd(['ftp', 'ftp.exe'], () => Desk.msgbox('FTP', 'ftp> _\n\nTyping FTP commands by hand is for grown-ups with beards. Use Homepagez PageBuilder > File > Publish and it does all the FTP-ing for you!', 'info', [['Open PageBuilder', () => HPZ.openBuilder()], ['OK']]));
  if (window.Setup && Setup.product) Setup.product('hpz', {
    n: 'Homepagez PageBuilder', v: '2.0', kb: 1450, lic: 'Freeware', by: 'Homepagez Inc. (Webcom Division)', cat: 'net', sq: 5, rel: '01/06/99',
    d: 'Build your OWN homepage and put it on the World Wide Web for FREE! Headings, marquees, BLINKING text, hit counters, guestbooks and 45 pieces of clip art. No HTML needed!',
    note: 'Free web space: 2 MB. Free FTP-ing: included. Free adverts on your page: also included (sorry).',
    apps: ['hpz.builder'], paths: ['Internet > Homepagez PageBuilder'], icons: ['iconHpzBuilder'], def: false, launch: 'hpz.builder', exe: 'PGBUILD.EXE', dir: 'Homepagez',
  });

  // ================================================================ secrets
  [['publish', 'Webmaster!', 'Put your very own page on the World Wide Web'], ['visit', 'Good neighbour', 'Visit a homepage built by another JackNet member'],
    ['sign', 'Signed, sealed, delivered', "Sign somebody else's guestbook"], ['self', 'Talking to yourself', 'Sign your OWN guestbook (everybody does it)'],
    ['ice', 'Brain freeze', 'Break a neighbourhood rule in SpaceCity'], ['source', 'View Source', 'Find out what your page looks like underneath'],
    ['blink', 'Blink and you miss it', 'Build a page that blinks... a LOT'], ['ring', 'Ring-a-ding-ding', 'Hop all the way round a webring of real homepages'],
    ['full', '2 MB? Used it all', 'Fill your page right up to the limit'], ['tips', 'Tip-top', 'Read every PageBuilder tip of the day'],
    ['rent', 'Moving in', 'Move into a house that was FOR RENT'], ['poll', 'Democracy!', 'Vote in a poll on somebody\'s homepage']]
    .forEach(([id, n, h]) => A.defineSecret('hpz.' + id, n, h));

  // ================================================================ files on the C: drive
  const PF = 'C:/Program Files/Homepagez';
  A.fs.add(PF, { name: 'PGBUILD.EXE', type: 'exe', app: 'hpz.builder', size: '1,204 KB', date: '01/06/99' });
  A.fs.add(PF, { name: 'README.TXT', type: 'txt', size: '3 KB', date: '01/06/99', text: `HOMEPAGEZ PAGEBUILDER 2.0
========================

Thank you for choosing Homepagez, the FREE home on the World Wide Web
for everyone! (2 MB of space. That's nearly two floppy disks!)

WHAT YOU NEED
  * A JackNet membership (FREE!)
  * A modem (14.4K or faster; 56K recommended)
  * Something to say about yourself, your pet or your favourite game

HOW TO BUILD YOUR PAGE
  1. Start > Programs > Internet > Homepagez PageBuilder
  2. Click the buttons on the toolbar to add things to your page:
     headings, text, marquees, blinking text, lines, clip art,
     a hit counter, a guestbook, links, a poll...
  3. Pick a neighbourhood and a house number (Page tab).
  4. File > Publish. PageBuilder FTPs your page to our server.
  5. Tell everyone your address! Write it on your pencil case!

YOUR ADDRESS
  http://www.homepagez.webcom/<Neighbourhood>/<Street>/<Number>/
  (or the short one: http://members.homepagez.webcom/~yourname/)

THE RULES
  * Be nice. No rude words (our robot will star them out anyway).
  * Never put your real address, phone number or school on your page.
  * Links can only go to other places on the Web (no funny business).
  * Obey your neighbourhood's rules. SpaceCity is VERY strict about
    ice cream.

KNOWN PROBLEMS
  * Blinking text may annoy your visitors. This is not a bug.
  * If Mom picks up the phone while you are publishing, the upload
    will fail. Ask her nicely to wait. Then try again.

(c) 1999 Homepagez Inc. All rights reserved. Homepagez is not
responsible for what you put on your page. You are. Yes, YOU.
` });
  A.fs.add(PF, { name: 'FTP.LOG', type: 'txt', size: '1 KB', date: '23/11/98', text: `ftp> open ftp.homepagez.webcom
Connected to ftp.homepagez.webcom.
220 Homepagez FTP server (Version 1.0) ready.
Name (ftp.homepagez.webcom:jack): jack
331 Password required for jack.
Password: ********
230 User jack logged in.
ftp> put index.html
200 PORT command successful.
150 Opening ASCII mode data connection for index.html (2048 bytes).
426 Connection closed; transfer aborted.
ftp> put index.html
Not connected.
ftp> bye
Not connected.

*** NOTE TO SELF: MOM PICKED UP THE PHONE. AGAIN. ***
*** Put up a sign on the phone: "INTERNET IN USE!!!" ***
` });
  A.fs.add('C:/My Documents/My Webs', { name: 'README.TXT', type: 'txt', size: '1 KB', date: '02/06/99', text: 'This is where Homepagez PageBuilder keeps your page while you work on it.\n\nFile > Save in PageBuilder saves a copy here as MYPAGE.HTM.\nFile > Publish puts it on the World Wide Web for everyone to see!\n\n(Jack\'s first homepage is in here somewhere. It just said HELLO in 72-point Comic Sans. It was beautiful.)' });

  // ================================================================ JackNet Explorer: hook the Homepagez hosts
  // The two hosts are registered by apps-web.js. Rather than re-registering them, their page table is wrapped in a
  // Proxy: every page that exists keeps working exactly as before, and paths nobody owns are answered here.
  const NAME_RE = /^\/~([a-z0-9_-]{2,16})(\/(home\.html?)?)?$/;
  const loadingEl = (host) => {
    const el = document.createElement('div'); el.className = 'hpz-host';
    el.innerHTML = `<div style="padding:18px;font:14px 'Times New Roman',serif;background:#fff;min-height:400px">Contacting host: <b>${esc(host)}</b>...<br>Host contacted. Waiting for reply...</div>`;
    return el;
  };
  const viewPage = (host, kind, arg) => () => {
    const el = loadingEl(host);
    HPZ.loadView().then(() => HPZ.view.mount(el, kind, arg))
      .catch(() => { el.innerHTML = '<h2 style="padding:18px">The page cannot be displayed</h2><p style="padding:0 18px">The Homepagez server is having a lie down. Click Refresh in a minute.</p>'; });
    return el;
  };
  function memberRoute(p, t) {
    if (p === '/directory.html' || p === '/members.html') return { title: 'Homepagez Member Pages', path: '/directory.html', html: viewPage(MH, 'dir') };
    if (p === '/signup.html' || p === '/join.html') return { title: 'Build your own FREE homepage! - Homepagez', path: '/signup.html', html: viewPage(MH, 'signup') };
    const m = NAME_RE.exec(p); if (!m) return null;
    const name = m[1];
    if (HPZ.RESIDENTS.includes(name) && !m[3] && t['/~' + name + '/']) return t['/~' + name + '/']; // the made-up resident lives here
    return { title: (HPZ.titles[name] || '~' + name + "'s homepage") + ' - Homepagez', path: HPZ.memberPath(name), html: viewPage(MH, 'page', { name }) };
  }
  function addrRoute(p) {
    if (p === '/members.html' || p === '/directory.html') return { title: 'Homepagez Member Pages', path: '/members.html', html: viewPage(WH, 'dir') };
    if (p === '/signup.html') return { title: 'Build your own FREE homepage! - Homepagez', path: '/signup.html', html: viewPage(WH, 'signup') };
    const m = /^\/([a-z]+)\/([a-z]+)\/0*(\d{1,4})\/?(index\.html?)?$/.exec(p); if (!m) return null;
    const hood = HPZ.findHood(m[1]), street = HPZ.findStreet(hood, m[2]); if (!hood || !street || !(+m[3])) return null;
    const a = HPZ.addrText(hood, street, +m[3]);
    return { title: 'Homepagez - ' + a, path: '/' + a + '/', html: viewPage(WH, 'page', { addr: a }) };
  }
  function wrap(key, host, route) {
    if (!window.IE || !IE.sites) return;
    if (!IE.sites[key]) IE.addSite(host, { title: 'Homepagez', pages: {} });
    const site = IE.sites[key]; if (!site || (site.pages && site.pages.__hpz)) return;
    const orig = site.pages || {};
    site.pages = new Proxy(orig, { get(t, p) {
      if (p === '__hpz') return true;
      if (typeof p !== 'string' || p.charAt(0) !== '/' || Object.prototype.hasOwnProperty.call(t, p)) return t[p];
      return route(p, t) || undefined;
    } });
  }
  const hook = () => { wrap('members.homepagez.webcom', MH, memberRoute); wrap('homepagez.webcom', WH, addrRoute); };
  hook(); setTimeout(hook, 0); window.addEventListener('load', hook);

  // dress up the made-up Homepagez pages with the real members (the made-up page renders into its own element; ours sits after it)
  document.addEventListener('section', ev => {
    hook();
    const d = String(ev.detail || ''); let what = null;
    if (d === 'site:' + MH + '/' || d === 'site:' + WH + '/') what = { kind: 'front' };
    else { const m = /^site:www\.homepagez\.webcom\/([a-z]+)\/$/.exec(d); const hood = m && HPZ.findHood(m[1]); if (hood) what = { kind: 'hood', hood }; }
    if (!what) return;
    const sec = document.getElementById('s-secret'); if (!sec) return;
    const box = document.createElement('div'); box.className = 'hpz-deco'; sec.appendChild(box);
    HPZ.loadView().then(() => { if (box.isConnected) HPZ.view.deco(box, what); }).catch(() => box.remove());
  });

  // Start > Programs > Internet: the directory and the sign-up page too
  A.addProgram(['Internet', 'Homepagez Member Pages'], () => HPZ.go('http://' + MH + '/directory.html'), J16());
  function J16() { return window.JICON && JICON.has && JICON.has('url') ? JICON.icon('url') : ICON32; }
})();
