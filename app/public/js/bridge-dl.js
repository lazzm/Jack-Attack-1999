/* bridge-dl: the web page and the PC talk to each other, part B. Things you download off the (fake) Web really change
 * the (fake) PC: Desktop Dazzle (www.desktopdazzle.webcom) has wallpapers, animated cursors, desktop themes, screen savers,
 * TrueType fonts and FREE smileys; plug-in sites need ShockJack / JackTime / RealJack installed before they work; and
 * The Annoying Ring (www.freepagez.w3b) is a webring of homepages full of 1999 JavaScript tricks (no right-click, earthquakes,
 * pop-up chains, window resizing, scrolling status bars, autoplaying MIDIs...). Art + fonts: bridge-dl-art.js, pages: bridge-dl-web.js.
 * State (roams): jhp_bdl = { walls: [], curs: [], cursor, fonts: [], savers: [], theme: {id, parts} | null, seen: {} } */
(function () {
  'use strict';
  const A = window.Apps; if (!A || window.BridgeDL) return;
  const $ = id => document.getElementById(id);
  const esc = A.esc, store = A.store;
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i, b), toast = (t, x, ms) => Desk.toast(t, x, ms);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const J = (n, s) => (window.JICON && JICON.has(n)) ? (s ? JICON.get(n, s) : JICON.icon(n)) : A.ICON.exe;
  const touchy = () => matchMedia('(hover:none)').matches;
  const hash = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const d99 = () => { const t = Desk.today99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; };
  const kbStr = kb => kb >= 1024 ? (kb / 1024).toFixed(1).replace(/\.0$/, '') + ' MB' : kb + ' KB';
  const DD = 'www.desktopdazzle.webcom', DDU = 'http://' + DD + '/';

  // ================================================================ state
  const KEY = 'jhp_bdl';
  let S = store.get(KEY, {});
  const norm = () => { if (!S || typeof S !== 'object') S = {}; ['walls', 'curs', 'fonts', 'savers'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; }); if (!S.seen || typeof S.seen !== 'object') S.seen = {}; };
  norm();
  const save = () => store.set(KEY, S);
  const art = () => A.load('js/bridge-dl-art.js').then(() => window.BridgeDLArt);
  const web = () => art().then(() => A.load('js/bridge-dl-web.js')).then(() => window.BridgeDLWeb);
  const secret = id => A.secret('bdl.' + id);

  // ================================================================ the catalogue (names here; the drawings live in bridge-dl-art.js)
  const WALLS = {
    space: { n: 'Deep Space Nebula', kb: 469, by: 'StarGazer99', d: 'A ringed planet, a comet and about a million stars. Looks AMAZING on a 15 inch monitor.' },
    waaagh: { n: 'Scrapyard Robot', kb: 512, by: 'Mek_Mike', d: 'A massive rusty robot glaring at you from your own desktop. Rivets, sparks, a flipper. Mom said "turn that off".' },
    podrace: { n: 'Desert Peapod Race', kb: 455, by: 'Zoom Zoom Kid', d: 'Two huge engines and a tiny cockpit tearing across a desert planet with two suns. Not from any film. Definitely.' },
    blocks: { n: 'Falling Blocks', kb: 233, by: 'LineClearer', d: 'Seven blocks, a well and a high score of 19990. That T-piece is about to go in the perfect spot.' },
    cube: { n: 'The Cube', kb: 301, by: 'Cuber42', d: 'A giant scrambled puzzle cube floating in purple space. You will want to solve it. You cannot. It is a picture.' },
    dinos: { n: 'Dino Valley', kb: 488, by: 'RexFan', d: 'Long necks at sunset, a smoking volcano and a flying lizard. Roar not included.' },
    sunset: { n: 'Tropical Sunset', kb: 396, by: 'Shazza', d: 'A stripy sun going down behind a palm tree. Very relaxing. Good for homework (it won\'t help with homework).' },
    monolith: { n: 'The Monolith', kb: 214, by: 'HAL_9001', d: 'A mysterious black slab on the Moon, with the Earth and Sun lined up above it. Play something dramatic.' },
    cybergrid: { n: 'Cyber Grid', kb: 342, by: 'Neon_Ninja', d: 'A pink laser grid running off into the sunset. This is what the Internet looks like on the inside.' },
    y2k: { n: 'Y2K Countdown', kb: 198, by: 'BunkerBob', d: 'One second to midnight on New Year\'s Eve. Has your computer got its beans in?' },
    underwater: { n: 'Underwater Adventure', kb: 410, by: 'Desktop Dazzle', d: 'Fish, seaweed, light rays and a treasure chest. Part of the Underwater Adventure theme.' },
    mystery: { n: 'Mystery Field', kb: 377, by: 'Desktop Dazzle', d: 'Something is hovering over the cornfield again. Part of the Mystery 1999 theme.' },
  };
  const CURS = {
    squig: { n: 'Spinning Blobbit', kb: 12, d: 'An arrow with a little red Blobbit going round and round next to it. Round and round. Round and round.' },
    rocket: { n: 'Little Rocket', kb: 9, d: 'Your pointer is a rocket! The flames flicker. Whoosh.' },
    laser: { n: 'Laser Sword', kb: 11, d: 'A glowing green energy blade. Point at things like a Space Cadet. (Not a real Space Cadet. Copyright lawyers, please go away.)' },
    cube: { n: 'Cube Spinner', kb: 14, d: 'An arrow with a tiny puzzle cube that keeps changing colour.' },
    rainbow: { n: 'Rainbow Arrow', kb: 8, d: 'The normal arrow, but it goes through every colour of the rainbow. Every. Single. Second.' },
    hourglass: { n: 'Forever Busy', kb: 10, d: 'The hourglass, ALL THE TIME. Everyone will think your computer is thinking really hard. A classic prank.' },
    choppa: { n: 'Swinging Spanner', kb: 13, d: 'A rusty arrow with a big spanner that swings about. Part of the Scrapyard Robots theme.' },
    fish: { n: 'Goldfish', kb: 9, d: 'Your pointer is a goldfish with a waggly tail. Blub.' },
    saucer: { n: 'Flying Saucer', kb: 12, d: 'An arrow followed by a little saucer with flashing lights. Part of the Mystery 1999 theme.' },
  };
  const SAVERS = {
    floppies: { n: 'Flying Floppies', kb: 88, d: 'Floppy disks with little wings flap across the screen. Watch out for the 5¼ inch ones.' },
    warp: { n: 'Warp Tunnel', kb: 64, d: 'Stars streak past at warp speed and change colour. Go to the toilet and come back: you\'re still in space.' },
    aquarium: { n: 'Aquarium', kb: 120, d: 'Fish, bubbles and wavy weed. Real fish need feeding. These don\'t.' },
    lava: { n: 'Lava Lamp', kb: 51, d: 'Big blobs of orange goo float about. Groovy, man. (Dad says that\'s what the seventies were like.)' },
    orkraid: { n: 'Robot Air Raid', kb: 97, d: 'Rusty robot jets zoom past trailing smoke and silly banners. Part of the Scrapyard Robots theme.' },
    saucer: { n: 'Saucer Sighting', kb: 76, d: 'A flying saucer beams up cows, one at a time, all night. Part of the Mystery 1999 theme.' },
  };
  const FONTS = {
    comic: { n: 'Comic Strip', file: 'COMICSQG.TTF', kb: 30, stack: '"Comic Squigs","Comic Sans MS",cursive', d: 'Wobbly hand-drawn capitals, like a real comic. Great for posters, birthday cards and SHOUTING.' },
    pixel: { n: 'Blocky 8-Bit', file: 'BLOCKY8.TTF', kb: 20, stack: '"Blocky 8-Bit","Courier New",monospace', d: 'Chunky pixel letters straight off an arcade machine. INSERT COIN.' },
    ding: { n: 'Wingdingz', file: 'WINGDNGZ.TTF', kb: 18, stack: '"Wingdingz","Arial",sans-serif', d: 'Every letter is a little picture! A is a rocket, B is a floppy, H is a heart... Write secret messages your Mom can\'t read.' },
  };
  const THEMES = {
    waaagh: { n: 'Scrapyard Robots', pid: 'bdl.th.waaagh', wall: 'waaagh', cur: 'choppa', saver: 'orkraid', scheme: ['#3a5a10', '#8ab030', '#b8b48c'], snd: 'ork', kb: 3100, d: 'Turns your whole computer into a robot scrapyard! A rusty Scrapyard Robot wallpaper, green and brown jackos, a Swinging Spanner pointer, the Robot Air Raid screen saver, clanks for sounds and a Scrap Bin instead of a Recycle Bin.' },
    space: { n: 'Outer Space Deluxe', pid: 'bdl.th.space', wall: 'space', cur: 'rocket', saver: 'warp', scheme: ['#10104a', '#6a3ab0', '#c8c4dc'], snd: 'space', kb: 2700, d: 'A nebula wallpaper with a ringed planet, deep purple jackos, a rocket pointer, the Warp Tunnel screen saver and bleepy computer noises. My Computer becomes a space station.' },
    sea: { n: 'Underwater Adventure', pid: 'bdl.th.sea', wall: 'underwater', cur: 'fish', saver: 'aquarium', scheme: ['#0a5a8a', '#2ab0c8', '#a8d4e0'], snd: 'sea', kb: 2900, d: 'Glug glug! An undersea wallpaper with a treasure chest, sea-blue jackos, a goldfish pointer, the Aquarium screen saver and bubbly sounds. The Recycle Bin becomes a clam.' },
    mystery: { n: 'Mystery 1999', pid: 'bdl.th.mystery', wall: 'mystery', cur: 'saucer', saver: 'saucer', scheme: ['#0a2a0a', '#3a8a3a', '#a4b0a0'], snd: 'mystery', kb: 2500, d: 'The truth is... somewhere. A cornfield wallpaper with a saucer, spooky green jackos, a flying saucer pointer, the Saucer Sighting screen saver and creepy whistly sounds.' },
  };
  const PLUGS = {
    shock: { pid: 'bdl.shock', n: 'ShockJack', full: 'ShockJack Player 7', what: 'animated content' },
    jtime: { pid: 'bdl.jtime', n: 'JackTime', full: 'JackTime 4', what: 'movies' },
    rsquig: { pid: 'realsquig', n: 'RealJack', full: 'RealJack Player G2', what: 'live audio' },
  };
  const SMILEYS = [[':-)', 'Smile'], [';-)', 'Wink'], [':-D', 'Big grin'], [':-P', 'Tongue'], [':-O', 'Surprised'], ['8-)', 'Cool'], [':-(', 'Sad'], ['>:-(', 'Cross'], ['O:-)', 'Angel'], [':-*', 'Kiss'], ['\\o/', 'Hooray'], ['(^_^)', 'Happy'], ['<:-)', 'Party hat'], [':-#', 'Secret']];
  const SMILEY_SIG = '\n\n--\nThis e-mail was made 1000% more fun with FREE SMILEYZ!!! from www.desktopdazzle.webcom :-) ;-) :-D';

  // ================================================================ styles
  const css = h(null, null, 'style'); css.id = 'bdl-css';
  css.textContent = `
html.bdl-cur,html.bdl-cur body,html.bdl-cur body *:not(input):not(textarea):not(select):not([contenteditable="true"]):not(.rz):not(.appgrip):not(#sizeGrip){cursor:var(--bdl-cur)!important}
.bdl-tap{position:fixed;z-index:99999;width:32px;height:32px;pointer-events:none;animation:bdlTap .7s ease-out forwards}
@keyframes bdlTap{from{opacity:1;transform:scale(1.4)}to{opacity:0;transform:scale(.9) translateY(-10px)}}
.bdl-tray{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;background:none;cursor:pointer}
.bdl-tray svg{width:16px;height:16px;animation:bdlBob 1s ease-in-out infinite}
@keyframes bdlBob{50%{transform:translateY(-2px)}}
.bdl-sm{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:2px 4px;margin:2px 0;background:linear-gradient(90deg,#ffe600,#ff7ad8,#7ae0ff);border:1px solid #808080;font:bold 10px Tahoma,sans-serif}
.bdl-sm button{min-width:28px;height:24px;padding:0 3px;font:11px "Courier New",monospace;background:#fff;border:1px solid #000;border-radius:3px;cursor:pointer}
.bdl-sm button:hover{background:#ffffa0}
.bdl-sm .ad{margin-left:auto;color:#a00;font-size:10px;white-space:nowrap}
.bdl-fp h2{font-weight:normal;margin:6px 0;font-size:28px;overflow-wrap:anywhere}
.bdl-fp .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25;margin:2px 0}
.bdl-fp{background:#fff;border:2px inset #fff;padding:8px;height:100%;overflow:auto;box-sizing:border-box}
.bdl-th{display:flex;gap:10px;flex-wrap:wrap}
.bdl-th .pv{flex:1 1 220px;min-width:200px;height:150px;border:2px inset #fff;position:relative;overflow:hidden;background:#008080}
.bdl-th .pv .w{position:absolute;left:22%;top:24%;width:60%;border:2px outset #fff;background:var(--pf,#c0c0c0);font:11px Tahoma,sans-serif}
.bdl-th .pv .w b{display:block;color:#fff;padding:2px 4px;background:linear-gradient(90deg,var(--p1,#000080),var(--p2,#1084d0))}
.bdl-th .pv .w span{display:block;padding:6px 4px;background:#fff;margin:3px;border:1px inset #ccc}
.bdl-th .pv .c{position:absolute;right:8px;bottom:6px;width:32px;height:32px}
.bdl-th .side{flex:1 1 160px;min-width:150px}
.bdl-th .side label{display:block;margin:2px 0}
.bdl-th .desc{flex-basis:100%;font:11px/1.35 Tahoma,sans-serif;min-height:42px}
.bdl-pop .appbody{padding:0!important;display:flex;flex-direction:column}
.bdl-pop .pbar{display:flex;gap:4px;align-items:center;padding:2px 4px;border-bottom:1px solid #808080;font:11px Tahoma,sans-serif}
.bdl-pop .pbar span{flex:1;min-width:0;background:#fff;border:2px inset #fff;padding:1px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bdl-pop .bdl-pbody{flex:1;overflow:auto;background:#fff;color:#000}
.bdl-plugwin .stage{background:#000;min-height:240px;position:relative;overflow:hidden}
.bdl-cp{display:flex;gap:10px;align-items:center}
.bdl-cp .big{width:64px;height:64px;flex:none;border:2px inset #fff;background:#fff;display:flex;align-items:center;justify-content:center}
.bdl-cp .big img{width:32px;height:32px;image-rendering:pixelated;transform:scale(1.6)}
`;
  document.head.appendChild(css);

  // ================================================================ downloads that are just a file (wallpapers, cursors, fonts, screen savers)
  // the File Download dialog and progress window from setup.js, but the file lands in the right folder instead of running a setup program
  const DL_ICON = '<svg viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="13" fill="#2a7ad8" stroke="#003" /><path d="M6 11c5 2 7-3 12-1s5 6 9 4M5 20c6-2 9 3 14 1s5-4 8-3" stroke="#1a9a3a" stroke-width="3" fill="none"/><path d="M10 6a13 13 0 0 1 14 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/></svg>';
  const DL_FOLDER = '<svg viewBox="0 0 32 32" width="32" height="32"><path d="M2 8h11l3 3h14v17H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 13h28" stroke="#7a5a00"/></svg>';
  const DL_PAPER = '<svg viewBox="0 0 14 16" width="14" height="16"><path d="M1 1h8l4 4v10H1z" fill="#fff" stroke="#000"/><path d="M3 7h8M3 10h8M3 13h6" stroke="#000080"/></svg>';
  const KINDS = {
    wall: { cat: WALLS, ext: '.bmp', dir: 'C:\\My Documents\\My Pictures', type: 'Bitmap Image', list: 'walls' },
    cur: { cat: CURS, ext: '.ani', dir: 'C:\\JACKOS\\CURSORS', type: 'Animated Cursor', list: 'curs' },
    font: { cat: FONTS, ext: '', dir: 'C:\\JACKOS\\FONTS', type: 'TrueType Font file', list: 'fonts' },
    saver: { cat: SAVERS, ext: '.scr', dir: 'C:\\JACKOS\\SYSTEM', type: 'Screen Saver', list: 'savers' },
  };
  const fileName = (kind, id) => kind === 'font' ? FONTS[id].file : kind === 'saver' ? SAVERS[id].n.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() + '.SCR' : KINDS[kind].cat[id].n + KINDS[kind].ext;
  const has = (kind, id) => S[KINDS[kind].list].includes(id);
  let dlBusy = false;
  function download(kind, id) {
    const K = KINDS[kind], it = K && K.cat[id]; if (!it) return;
    if (dlBusy) return msg('JackNet Explorer', 'You are already downloading something!\n\nOne thing at a time: it\'s a 56K modem, not a fire hose.', 'warn');
    const file = fileName(kind, id), host = kind === 'font' ? 'fonts.desktopdazzle.webcom' : 'dl.desktopdazzle.webcom';
    let mode = store.get('jhp_bdl_dlmode', 'open');
    A.ui.dialog('File Download', `<div class="dl"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${DL_ICON}<div style="flex:1;min-width:0"><p style="margin:0 0 8px">You have chosen to download a file from this location.</p><p style="margin:0 0 8px"><b>${esc(file)}</b> (${esc(K.type)}, ${kbStr(it.kb)}) from ${esc(host)}</p><p style="margin:0 0 4px">What would you like to do with this file?</p><label style="display:flex;gap:5px;align-items:center"><input type="radio" name="bdlm" value="open" ${mode === 'open' ? 'checked' : ''}> Open this file from its current location</label><label style="display:flex;gap:5px;align-items:center"><input type="radio" name="bdlm" value="save" ${mode === 'save' ? 'checked' : ''}> Save this file to disk</label><hr class="pgk-hr"><label style="display:flex;gap:5px;align-items:center"><input type="checkbox" checked disabled> Always ask before opening this type of file</label></div></div></div>`,
      [['OK', bx => { mode = (qs(bx, 'input[name=bdlm]:checked') || {}).value || 'open'; store.set('jhp_bdl_dlmode', mode); setTimeout(() => progress(kind, id, file, host, mode), 50); }], ['Cancel'],
        ['More Info', () => { msg('File Download', `${file}\n\nType: ${K.type}\nSize: ${kbStr(it.kb)}\nFrom: ${host}\n\n${K.type}s can't hurt your computer. Probably. Desktop Dazzle scans every file with a real magnifying glass. It has found 0 viruses and 3 crumbs.`, 'info'); return false; }]], { w: 400, icon: J('jacknet', 16) });
  }
  function progress(kind, id, file, host, mode) {
    const K = KINDS[kind], it = K.cat[id], total = it.kb;
    dlBusy = true;
    const b = h(`<div class="dl"><div class="dl-anim"><span class="a l">${DL_ICON}</span><span class="a r">${DL_FOLDER}</span><span class="pp">${DL_PAPER}</span><span class="pp">${DL_PAPER}</span><span class="pp">${DL_PAPER}</span></div>
<div class="dl-st">Saving:</div><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(file)} from ${esc(host)}</div><div class="dl-bar" style="margin:6px 0"></div>
<div class="dl-grid"><span>Estimated time left:</span><span class="dl-left">Not known (opening the line...)</span><span>Download to:</span><span>${esc(K.dir)}\\${esc(file)}</span><span>Transfer rate:</span><span class="dl-rate">0 KB/Sec</span></div>
<div class="row" style="justify-content:flex-end;gap:6px;margin-top:8px"><button class="btn" data-d="cancel">Cancel</button></div></div>`);
    const w = A.win('0% of ' + file + ' Completed', b, { w: 380, icon: J('jacknet', 16), noResize: true, noMax: true, onClose: () => { dlBusy = false; } });
    const set = A.ui.progBar(qs(b, '.dl-bar'));
    const dur = Math.max(1600, Math.min(4200, 1200 + Math.sqrt(total) * 110));
    let got = 0, last = performance.now(), done = false;
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      const now = performance.now(), dt = now - last; last = now;
      const rate = total / dur * 1000 * (0.7 + Math.random() * 0.6);
      got = Math.min(total, got + rate * dt / 1000);
      const f = got / total; set(f); w.setTitle(Math.floor(f * 100) + '% of ' + file + ' Completed');
      qs(b, '.dl-left').textContent = `${Math.ceil(Math.max(0, (total - got) / Math.max(1, rate)))} sec (${kbStr(Math.floor(got))} of ${kbStr(total)} copied)`;
      qs(b, '.dl-rate').textContent = rate.toFixed(1) + ' KB/Sec';
      if (f >= 1 && !done) {
        done = true; clearInterval(iv); b.classList.add('paused'); qs(b, '.dl-st').textContent = 'Download complete:'; w.setTitle('Download complete'); sfx('join');
        try { Net.kv.inc('bdl.dl.' + kind + '.' + id); } catch (e) {}
        setTimeout(() => { w.close(); installFile(kind, id, mode); }, 450);
      }
    }, 120);
    qs(b, '[data-d=cancel]').addEventListener('click', () => w.close());
  }
  function installFile(kind, id, mode) {
    const K = KINDS[kind], it = K.cat[id], first = !has(kind, id);
    if (first) { S[K.list].push(id); save(); }
    fileNodes();
    document.dispatchEvent(new CustomEvent('bdl-installed', { detail: { kind, id } }));
    if (kind === 'wall') return addPic(id).then(() => mode === 'open' ? setWallpaper(id) : msg('Download complete', `${it.n}.bmp has been saved to My Pictures.\n\nDo you want to use it as your desktop wallpaper?`, 'q', [['Yes', () => setWallpaper(id)], ['No', () => toast('Display Properties', 'It\'s in Control Panel > Display > Background whenever you want it.', 4000)]]));
    if (kind === 'cur') return mode === 'open' ? setCursor(id) : msg('Download complete', `${fileName('cur', id)} has been saved to C:\\JACKOS\\CURSORS.\n\nDo you want to use it as your mouse pointer now?`, 'q', [['Yes', () => setCursor(id)], ['No', () => toast('Mouse Properties', 'It\'s in Control Panel > Mouse > Pointers whenever you want it.', 4000)]]);
    if (kind === 'font') { addFontStack(id); return loadFont(id).then(() => { secret('font'); if (mode === 'open') fontPreview(id); else toast('Fonts', `${it.n} is installed! Pick it from the font list in WordPod.`, 5000); }); }
    if (kind === 'saver') { notifySavers(); return msg('Download complete', `${SAVERS[id].n} has been installed in C:\\JACKOS\\SYSTEM.\n\nDo you want to make it your screen saver now?`, 'q', [['Yes', () => { setSaver(id); if (mode === 'open') startSaver(id); }], ['Preview', () => startSaver(id)], ['No']]); }
  }

  // ================================================================ wallpapers (they join Display Properties > Background, which lists My Pictures)
  const svgData = svg => 'data:image/svg+xml,' + encodeURIComponent(svg);
  const picName = id => WALLS[id].n + '.bmp';
  function addPic(id) {
    return art().then(a => {
      const data = svgData(a.WALLS[id]()), name = picName(id);
      const pics = store.get('jhp_prog_pics', []).filter(p => p.name !== name);
      pics.push({ name, data, date: d99() });
      try { localStorage.setItem('jhp_prog_pics', JSON.stringify(pics)); } catch (e) { toast('Display Properties', 'Your hard disk is full! The wallpaper was downloaded but could not be saved.', 5000); }
      const dir = A.fs.dir('C:/My Documents/My Pictures');
      dir.kids = dir.kids.filter(k => k.name !== name).concat([{ name, type: 'png', dataURL: data, date: d99(), size: kbStr(WALLS[id].kb), painted: true }]);
      return data;
    });
  }
  function setWallpaper(id, quiet) {
    return art().then(a => {
      const data = svgData(a.WALLS[id]()), w = { img: data, mode: 'Stretch', col: '#000000' };
      const d = $('desktop'); if (d) d.style.background = `url("${data}") center/100% 100% no-repeat,#000000`;
      try { localStorage.setItem('jhp_prog_wall', JSON.stringify(w)); } catch (e) {}
      if (!quiet) { toast('Display Properties', `Wallpaper changed to "${WALLS[id].n}". Lovely.`, 3500); secret('wallpaper'); }
    });
  }

  // ================================================================ animated cursors (real CSS cursors, the frames swapped about 8 times a second)
  const root = document.documentElement;
  let curFrames = [], curI = 0, curT = null, lastMove = 0, tapImg = null;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') lastMove = Date.now(); }, { passive: true, capture: true });
  function applyCursor() {
    clearInterval(curT); curT = null;
    if (!S.cursor || !CURS[S.cursor]) { root.classList.remove('bdl-cur'); root.style.removeProperty('--bdl-cur'); curFrames = []; return Promise.resolve(); }
    const want = S.cursor;
    return art().then(a => {
      if (S.cursor !== want) return;
      const fr = a.cursorFrames(want); curFrames = fr.map(f => f.css); tapImg = svgData(fr[0].svg); curI = 0;
      root.style.setProperty('--bdl-cur', curFrames[0]); root.classList.add('bdl-cur');
      if (curFrames.length > 1) curT = setInterval(() => {
        if (document.hidden || Date.now() - lastMove > 2500) return;
        curI = (curI + 1) % curFrames.length; root.style.setProperty('--bdl-cur', curFrames[curI]);
      }, 120);
    });
  }
  function setCursor(id, quiet) {
    S.cursor = id && CURS[id] ? id : null; save();
    return applyCursor().then(() => {
      if (quiet) return;
      if (S.cursor) { secret('cursor'); toast('Mouse Properties', touchy() ? `Pointer changed to "${CURS[id].n}". Click anywhere and it sparkles!` : `Pointer changed to "${CURS[id].n}". Wiggle the mouse!`, 4500); }
      else toast('Mouse Properties', 'Pointers reset to the JackOS default.', 3000);
    });
  }
  // phones have no pointer: the cursor pops up where you tap
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || !S.cursor || !tapImg) return;
    const p = DesktopSurface.point(e.clientX, e.clientY);
    const im = h(null, 'bdl-tap', 'img'); im.src = tapImg; im.alt = ''; im.style.left = (p.x - 4) + 'px'; im.style.top = (p.y - 4) + 'px';
    DesktopSurface.root().appendChild(im); setTimeout(() => im.remove(), 800);
  }, { passive: true, capture: true });

  // Control Panel > Mouse > Pointers (apps-programs.js calls this when it builds the tab)
  function pointersTab(pg, c) {
    const sel = qs(pg, '.pgk-ps'); if (!sel) return;
    S.curs.forEach(id => { const o = document.createElement('option'); o.value = 'bdl:' + id; o.textContent = CURS[id].n + ' (animated)'; sel.appendChild(o); });
    if (S.cursor && S.curs.includes(S.cursor)) sel.value = 'bdl:' + S.cursor;
    const first = qs(pg, '.pgk-pi b');
    let pv = null;
    const preview = () => {
      clearInterval(pv); const v = sel.value;
      if (!first) return;
      if (!v.startsWith('bdl:')) { first.innerHTML = '<svg viewBox="0 0 12 19" width="12" height="19"><path d="M.5.5v15l4-4 2.5 6 2-1-2.5-5.5H12z" fill="#fff" stroke="#000"/></svg>'; return; }
      art().then(a => { const fr = a.cursorFrames(v.slice(4)); let i = 0; const show = () => { first.innerHTML = `<img src="${svgData(fr[i % fr.length].svg)}" width="24" height="24" alt="">`; i++; }; show(); pv = setInterval(() => { if (!first.isConnected) return clearInterval(pv); show(); }, 140); });
    };
    sel.addEventListener('change', preview); preview();
    const def = qs(pg, '[data-p=def]'), br = qs(pg, '[data-p=br]');
    if (def) { const d2 = def.cloneNode(true); def.replaceWith(d2); d2.addEventListener('click', () => { sel.value = '(None)'; preview(); c.dirty(); toast('Mouse Properties', 'Back to the plain old JackOS pointers. Press Apply.', 3000); }); }
    if (br) { const b2 = br.cloneNode(true); br.replaceWith(b2); b2.addEventListener('click', () => msg('Browse', 'C:\\JACKOS\\CURSORS contains:\n\n' + ['hourglass_forever.ani (you don\'t want it)'].concat(S.curs.map(id => fileName('cur', id) + '  (' + CURS[id].n + ')')).join('\n') + (S.curs.length ? '' : '\n\nGet more FREE animated cursors at ' + DD), 'info')); }
    c.onApply(() => { const v = sel.value; if (v.startsWith('bdl:')) { if (S.cursor !== v.slice(4)) setCursor(v.slice(4)); } else if (S.cursor) setCursor(null); });
  }

  // ================================================================ fonts (built by bridge-dl-art.js, given to the browser with the FontFace API)
  const SYSF = [['Arial', 'ARIAL.TTF', 'Arial,Helvetica,sans-serif', 64], ['Arial Black', 'ARIBLK.TTF', '"Arial Black",Arial,sans-serif', 115], ['Book Antiqua', 'BKANT.TTF', '"Book Antiqua",Palatino,Georgia,serif', 158], ['Comic Sans MS', 'COMIC.TTF', '"Comic Sans MS","Comic Neue",cursive', 125], ['Courier New', 'COUR.TTF', '"Courier New",Courier,monospace', 99], ['Georgia', 'GEORGIA.TTF', 'Georgia,serif', 140], ['Impact', 'IMPACT.TTF', 'Impact,"Anton",sans-serif', 133], ['Lucida Console', 'LUCON.TTF', '"Lucida Console",Monaco,monospace', 108], ['MS Sans Serif', 'SSERIFE.FON', '"MS Sans Serif",Tahoma,sans-serif', 64], ['Tahoma', 'TAHOMA.TTF', 'Tahoma,Verdana,sans-serif', 166], ['Times New Roman', 'TIMES.TTF', '"Times New Roman",Times,serif', 81], ['Trebuchet MS', 'TREBUC.TTF', '"Trebuchet MS",Tahoma,sans-serif', 121], ['Verdana', 'VERDANA.TTF', 'Verdana,Geneva,sans-serif', 137]];
  const fontLoads = {};
  function loadFont(id) {
    if (fontLoads[id]) return fontLoads[id];
    return fontLoads[id] = art().then(a => {
      const ff = new FontFace(FONTS[id].n, a.FONTS[id]());
      document.fonts.add(ff);
      return ff.load();
    }).catch(e => { delete fontLoads[id]; console.warn('[bridge-dl] font', id, e); });
  }
  function addFontStack(id) { const K = window.OfficeKit; if (K && K.FONTSTACK) K.FONTSTACK[FONTS[id].n] = FONTS[id].stack; }
  const fontList = () => S.fonts.filter(id => FONTS[id]).map(id => [FONTS[id].n, FONTS[id].stack]);
  function fontPreview(id, sys) {
    const f = id ? FONTS[id] : null, name = f ? f.n : sys[0], stack = f ? f.stack : sys[2];
    const go = () => {
      const sample = id === 'ding' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789' : 'The quick brown fox jumps over the lazy dog. 1234567890';
      const b = h(`<div class="bdl-fp"><div class="row"><button class="btn" data-x="done">Done</button><button class="btn" data-x="print">Print</button></div><h2 style="font-family:${esc(stack)}">${esc(name)} (TrueType)</h2><p class="small">Typeface name: ${esc(name)}<br>File size: ${f ? f.kb : sys[3]} KB<br>Version: ${f ? 'Version 1.99 (made in Desktop Dazzle\'s Font Kit)' : 'Version 2.76'}<br>${f ? 'Downloaded from: ' + DD : 'Came with: JackOS 98'}</p><hr><div style="font-family:${esc(stack)}"><p style="font-size:14px;margin:4px 0">abcdefghijklmnopqrstuvwxyz<br>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>1234567890.:,;(:*!?')</p>${[12, 18, 24, 36, 48].map(s => `<div class="s" style="font-size:${s}px"><small style="font:11px Tahoma,sans-serif">${s}</small> ${esc(sample)}</div>`).join('')}</div></div>`);
      const w = A.win(name + ' (TrueType)', b, { w: 520, h: 420, icon: J('fonts', 16) });
      qs(b, '[data-x=done]').addEventListener('click', w.close);
      qs(b, '[data-x=print]').addEventListener('click', () => msg('Print', 'The printer is out of cyan. It is always out of cyan.', 'warn'));
      return w;
    };
    return id ? loadFont(id).then(go) : go();
  }

  // ================================================================ screen savers (joining apps-fun's Savers like era-apps.js does)
  const saverIdOf = name => Object.keys(SAVERS).find(k => SAVERS[k].n === name && S.savers.includes(k));
  const rawSaver = () => { let v = null; try { v = localStorage.getItem('jhp_saver'); } catch (e) {} if (v && v[0] === '"') { try { v = JSON.parse(v); } catch (e) {} } return v == null ? '' : String(v); };
  const notifySavers = () => window.dispatchEvent(new CustomEvent('jhp-savers'));
  function setSaver(id) { try { localStorage.setItem('jhp_saver', SAVERS[id].n); if (localStorage.getItem('jhp_saverwait') == null) localStorage.setItem('jhp_saverwait', '3'); } catch (e) {} toast('Display Properties', `Your screen saver is now "${SAVERS[id].n}". Leave the computer alone for a few minutes to see it.`, 4500); }
  function runSaver(canvas, id, full) {
    let stopped = false, raf = 0, last = 0, inst = null, W = 0, H = 0;
    const g = canvas.getContext('2d');
    const build = a => {
      const r = canvas.getBoundingClientRect();
      W = canvas.width = Math.max(40, Math.round(full ? DesktopSurface.width() : (r.width || canvas.width)));
      H = canvas.height = Math.max(30, Math.round(full ? DesktopSurface.height() : (r.height || canvas.height)));
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H); inst = a.SAVERS[id](g, W, H);
    };
    let AR = null;
    const frame = t => {
      if (stopped) return;
      if (!canvas.isConnected) return stop();
      raf = requestAnimationFrame(frame);
      if (!full && !canvas.getClientRects().length) { last = 0; return; }
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      try { inst.frame(dt); } catch (e) { console.error(e); stop(); }
    };
    const onRes = () => { if (!stopped && AR) build(AR); };
    function stop() { stopped = true; cancelAnimationFrame(raf); if (full) removeEventListener('resize', onRes); }
    art().then(a => { if (stopped) return; AR = a; build(a); raf = requestAnimationFrame(frame); if (full) addEventListener('resize', onRes); });
    return stop;
  }
  function takeOver(id) {
    const el = $('ffSaver'); if (!el || el._era) return false;
    el._era = SAVERS[id].n;
    const old = el.querySelector('canvas'); if (old) old.remove();
    const c = document.createElement('canvas'); el.appendChild(c);
    el.setAttribute('aria-label', SAVERS[id].n + ' screen saver (press any key)');
    runSaver(c, id, true);
    return true;
  }
  function startSaver(id) { const SV = window.Savers; if (SV && SV.start) setTimeout(() => SV.start(SAVERS[id].n), 250); }
  let lastInput = Date.now();
  ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart', 'scroll'].forEach(t => addEventListener(t, () => { if (!(window.Savers && Savers.running)) lastInput = Date.now(); }, { capture: true, passive: true }));
  function hookSavers() {
    const SV = window.Savers; if (!SV || SV._bdl) return; SV._bdl = true;
    const oList = SV.list, oPrev = SV.preview, oStart = SV.start, oConf = SV.configure;
    SV.list = () => (oList ? oList.call(SV) : []).concat(S.savers.filter(k => SAVERS[k]).map(k => SAVERS[k].n));
    SV.preview = (canvas, name) => saverIdOf(name) ? (canvas ? runSaver(canvas, saverIdOf(name), false) : () => {}) : oPrev.call(SV, canvas, name);
    SV.start = (name, opts) => {
      const id = saverIdOf(name || rawSaver());
      if (!id) return oStart.call(SV, name, opts);
      if (SV.running) return;
      oStart.call(SV, 'Starfield Simulation', opts); takeOver(id);
    };
    SV.configure = name => saverIdOf(name) ? msg('Display Properties', `${name}\n\n${SAVERS[saverIdOf(name)].d}\n\nThere are no settings. It came off the Internet. Be grateful.`, 'info') : (oConf && oConf.call(SV, name));
    // the idle timer starts the chosen saver; when it's one of ours, swap it in
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.id === 'ffSaver' && !n._era) { const id = saverIdOf(rawSaver()); if (id && Date.now() - lastInput > 15000) takeOver(id); } }).observe(DesktopSurface.root(), { childList: true });
    notifySavers();
  }
  if (window.Savers) hookSavers(); else document.addEventListener('DOMContentLoaded', hookSavers);
  A.OPENERS.scr = node => { const id = node.bdl; if (id && S.savers.includes(id)) startSaver(id); else msg(node.name, 'This screen saver is broken. (It was downloaded during a thunderstorm.)', 'warn'); };

  // ================================================================ desktop themes (Plus!-style, downloaded and installed with InstallJack)
  const SND = {
    ork: { open: () => [110, 82].forEach((f, i) => setTimeout(() => Sound.note(f, 0.18, 'sawtooth'), i * 120)), close: () => Sound.note(70, 0.2, 'square'), err: () => Sound.play('waaagh') },
    space: { open: () => [880, 1320].forEach((f, i) => setTimeout(() => Sound.note(f, 0.08, 'sine'), i * 90)), close: () => [1320, 660].forEach((f, i) => setTimeout(() => Sound.note(f, 0.08, 'sine'), i * 90)), err: () => [220, 233, 220].forEach((f, i) => setTimeout(() => Sound.note(f, 0.15, 'triangle'), i * 150)) },
    sea: { open: () => [300, 420, 560].forEach((f, i) => setTimeout(() => Sound.note(f, 0.06, 'sine'), i * 60)), close: () => [560, 420, 300].forEach((f, i) => setTimeout(() => Sound.note(f, 0.06, 'sine'), i * 60)), err: () => Sound.note(150, 0.4, 'sine') },
    mystery: { open: () => [988, 1175, 1047, 523, 784].forEach((f, i) => setTimeout(() => Sound.note(f, 0.22, 'sine'), i * 230)), close: () => Sound.note(392, 0.3, 'sine'), err: () => [740, 698].forEach((f, i) => setTimeout(() => Sound.note(f, 0.3, 'triangle'), i * 300)) },
  };
  const TICON = {
    waaagh: { iconBin: '<svg viewBox="0 0 32 32"><path d="M6 10h20l-3 19H9z" fill="#8a5a30" stroke="#000"/><path d="M5 8h22v3H5z" fill="#6a4a20" stroke="#000"/><path d="M10 14l2 12M16 14v12M22 14l-2 12" stroke="#4a2a10" stroke-width="2"/><circle cx="11" cy="9" r="1.2" fill="#ccc"/><circle cx="21" cy="9" r="1.2" fill="#ccc"/><path d="M12 4l4 4 5-5" stroke="#9aa" stroke-width="3" fill="none"/></svg>', iconMyComp: '<svg viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="19" fill="#6a4a20" stroke="#000"/><circle cx="5.5" cy="6.5" r=".8" fill="#c8a070"/><circle cx="26.5" cy="6.5" r=".8" fill="#c8a070"/><rect x="6" y="7" width="20" height="13" fill="#2a3a10"/><path d="M16 9.5V8" stroke="#9a9aa8"/><circle cx="16" cy="7.8" r="1" fill="#e10600"/><rect x="10.5" y="9.5" width="11" height="9" rx="1" fill="#9a9aa8" stroke="#000" stroke-width=".7"/><rect x="12" y="11.5" width="3" height="2.4" fill="#ffd400"/><rect x="17" y="11.5" width="3" height="2.4" fill="#ffd400"/><path d="M12.5 16.2h7" stroke="#333" stroke-width="1.4" stroke-dasharray="1 .8"/><rect x="9" y="24" width="14" height="5" fill="#8a8a8a" stroke="#000"/></svg>' },
    space: { iconMyComp: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="#bbb" stroke="#000"/><rect x="1" y="14" width="30" height="4" fill="#6a8ad8" stroke="#000"/><circle cx="16" cy="16" r="4" fill="#6cf" stroke="#000"/><path d="M16 2v5M16 25v5" stroke="#000" stroke-width="2"/></svg>' },
    sea: { iconBin: '<svg viewBox="0 0 32 32"><path d="M3 20q13-18 26 0z" fill="#f2b8c8" stroke="#000"/><path d="M3 20q13 10 26 0" fill="#e898b0" stroke="#000"/><circle cx="16" cy="19" r="3" fill="#fff" stroke="#999"/><path d="M8 18l3-8M13 16l1-9M19 16l-1-9M24 18l-3-8" stroke="#c07890"/></svg>' },
    mystery: { iconBin: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="14" rx="14" ry="5" fill="#9aa0a8" stroke="#000"/><path d="M10 12q6-9 12 0" fill="#bfefff" stroke="#000"/><path d="M11 18l-5 11h20l-5-11" fill="#e0ff9a" opacity=".7"/><circle cx="9" cy="15" r="1.3" fill="#ff0"/><circle cx="16" cy="16" r="1.3" fill="#0f0"/><circle cx="23" cy="15" r="1.3" fill="#f0f"/></svg>' },
  };
  const TCSS = { waaagh: '.tb{text-shadow:1px 1px #000}', space: '.tb{text-shadow:0 0 4px #c8b4ff}', sea: '.tb{text-shadow:0 0 3px #bfefff}', mystery: '.tb{color:#bfffbf!important;text-shadow:0 0 5px #7f7}' };
  const tStyle = h(null, null, 'style'); tStyle.id = 'bdl-theme-css'; document.head.appendChild(tStyle);
  let iconBackup = {};
  const themeOK = () => S.theme && THEMES[S.theme.id] && window.Setup && Setup.has(THEMES[S.theme.id].pid);
  function themeIcons(id) {
    Object.entries(iconBackup).forEach(([eid, svg]) => { const el = $(eid), s = el && el.querySelector('svg'); if (s) s.outerHTML = svg; }); iconBackup = {};
    if (!id || !TICON[id]) return;
    Object.entries(TICON[id]).forEach(([eid, svg]) => { const el = $(eid), s = el && el.querySelector('svg'); if (s) { iconBackup[eid] = s.outerHTML; s.outerHTML = svg.replace('<svg', '<svg width="32" height="32"'); } });
  }
  function themeLook(id, parts) {
    const t = THEMES[id], r = root.style;
    if (parts.colours) { r.setProperty('--title1', t.scheme[0]); r.setProperty('--title2', t.scheme[1]); r.setProperty('--face', t.scheme[2]); tStyle.textContent = TCSS[id] || ''; }
    else tStyle.textContent = '';
    themeIcons(parts.icons ? id : null);
  }
  function applyTheme(id, parts) {
    parts = Object.assign({ wall: true, colours: true, cursor: true, sounds: true, icons: true, saver: true }, parts || {});
    if (id === 'std') {
      const r = root.style; ['--title1', '--title2', '--face'].forEach(k => r.removeProperty(k)); tStyle.textContent = ''; themeIcons(null);
      if (S.theme && S.theme.parts.wall) { const d = $('desktop'); if (d) d.style.background = ''; try { localStorage.removeItem('jhp_prog_wall'); } catch (e) {} }
      if (S.theme && S.theme.parts.cursor && S.cursor === THEMES[S.theme.id].cur) setCursor(null, true);
      S.theme = null; save(); return Promise.resolve();
    }
    const t = THEMES[id];
    if (window.SysThemes && SysThemes.active) { try { SysThemes.apply({ key: 'std' }); } catch (e) {} }
    try { localStorage.removeItem('jhp_system_theme'); localStorage.setItem('jhp_prog_scheme', JSON.stringify('JackOS Standard')); } catch (e) {}
    S.theme = { id, parts }; save();
    if (parts.saver && !S.savers.includes(t.saver)) { S.savers.push(t.saver); save(); fileNodes(); notifySavers(); }
    themeLook(id, parts);
    if (parts.saver) try { localStorage.setItem('jhp_saver', SAVERS[t.saver].n); } catch (e) {}
    const jobs = [];
    if (parts.wall) jobs.push(addPic(t.wall).then(() => { if (!S.walls.includes(t.wall)) { S.walls.push(t.wall); save(); } return setWallpaper(t.wall, true); }));
    if (parts.cursor) { if (!S.curs.includes(t.cur)) { S.curs.push(t.cur); save(); fileNodes(); } jobs.push(setCursor(t.cur, true)); }
    if (parts.sounds && SND[t.snd]) try { SND[t.snd].open(); } catch (e) {}
    secret('theme');
    return Promise.all(jobs);
  }
  // put a theme back after a restart, unless something else has changed the look since
  function restoreTheme() {
    if (!S.theme) return;
    let sys = null, sch = null; try { sys = localStorage.getItem('jhp_system_theme'); sch = localStorage.getItem('jhp_prog_scheme'); } catch (e) {}
    if (!themeOK() || (sys && sys !== 'null') || (sch && sch !== '"JackOS Standard"')) { S.theme = null; save(); return; }
    themeLook(S.theme.id, S.theme.parts);
  }
  // window sounds for the theme, smileys for Outlook Express, and pop-up bookkeeping: one watcher on the desktop
  let lastSnd = 0;
  const tsnd = k => { if (!S.theme || !S.theme.parts.sounds || !Sound.on) return; const t = THEMES[S.theme.id], now = Date.now(); if (!t || now - lastSnd < 250) return; lastSnd = now; try { SND[t.snd][k](); } catch (e) {} };
  new MutationObserver(ms => {
    for (const m of ms) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.classList.contains('appwin')) { if (qs(n, '.oe-comp')) smileyBar(n); if (qs(n, '.msgbox')) tsnd('err'); else tsnd('open'); }
        else if (n.classList.contains('float') && qs(n, '.msgbox')) tsnd('err');
      }
      for (const n of m.removedNodes) if (n.nodeType === 1 && n.classList.contains('appwin') && !qs(n, '.msgbox')) tsnd('close');
    }
  }).observe(DesktopSurface.root(), { childList: true });
  function themeWindow(pick) {
    const ids = Object.keys(THEMES).filter(k => Setup.has(THEMES[k].pid));
    const cur = S.theme ? S.theme.id : 'std', parts0 = (S.theme && S.theme.parts) || {};
    const b = h(`<div class="bdl-th"><label style="flex-basis:100%">Theme: <select class="tsel" style="min-width:200px">${['std'].concat(ids).map(k => `<option value="${k}">${k === 'std' ? 'JackOS Standard' : esc(THEMES[k].n)}</option>`).join('')}</select></label>
<div class="pv"><div class="w"><b>Active Window</b><span>Window Text</span></div><img class="c" alt=""></div>
<div class="side group"><span class="lg">Settings</span>${[['wall', 'Desktop wallpaper'], ['colours', 'Colours'], ['cursor', 'Mouse pointer'], ['sounds', 'Sound events'], ['icons', 'Desktop icons'], ['saver', 'Screen saver']].map(([k, l]) => `<label><input type="checkbox" data-p="${k}" ${parts0[k] === false ? '' : 'checked'}> ${l}</label>`).join('')}</div>
<div class="desc"></div><div class="row" style="flex-basis:100%;justify-content:flex-end"><button class="btn" data-t="ok">OK</button><button class="btn" data-t="cancel">Cancel</button><button class="btn" data-t="apply">Apply</button></div></div>`);
    const w = A.win('Desktop Dazzle Themes', b, { w: 470, icon: J('themes', 16), noResize: true, noMax: true, escClose: true });
    const sel = qs(b, '.tsel'), pv = qs(b, '.pv'), desc = qs(b, '.desc'), cimg = qs(b, '.c');
    sel.value = pick && ids.includes(pick) ? pick : cur;
    const prev = () => {
      const k = sel.value, t = THEMES[k], win = qs(pv, '.w');
      if (!t) { pv.style.background = '#008080'; ['--p1', '--p2', '--pf'].forEach(p => win.style.removeProperty(p)); cimg.removeAttribute('src'); cimg.hidden = true; desc.textContent = 'The classic JackOS look: teal desktop, grey jackos, a plain white arrow. Like a fresh computer out of the box.'; return; }
      win.style.setProperty('--p1', t.scheme[0]); win.style.setProperty('--p2', t.scheme[1]); win.style.setProperty('--pf', t.scheme[2]); desc.textContent = t.d;
      art().then(a => { if (sel.value !== k) return; pv.style.background = `url("${svgData(a.WALLS[t.wall]())}") center/cover`; cimg.src = svgData(a.cursorFrames(t.cur)[0].svg); cimg.hidden = false; });
    };
    sel.addEventListener('change', prev); prev();
    const parts = () => { const p = {}; qsa(b, '[data-p]').forEach(i => { p[i.dataset.p] = i.checked; }); return p; };
    const doApply = () => applyTheme(sel.value, parts()).then(() => toast('Desktop Themes', sel.value === 'std' ? 'Back to JackOS Standard.' : `"${THEMES[sel.value].n}" is on! Open and close a window${Sound.on ? '' : ' (with sound on)'} to hear it.`, 4000));
    qs(b, '[data-t=apply]').addEventListener('click', doApply);
    qs(b, '[data-t=ok]').addEventListener('click', () => { doApply(); w.close(); });
    qs(b, '[data-t=cancel]').addEventListener('click', w.close);
    return w;
  }

  // ================================================================ products: themes, plug-ins and the smileys go through setup.js (File Download + InstallJack)
  const P = (id, o) => window.Setup && Setup.product(id, Object.assign({ def: false, by: 'Desktop Dazzle Media', home: DDU, cat: 'fun', lic: 'Freeware', sq: 4 }, o));
  Object.entries(THEMES).forEach(([k, t], i) => P(t.pid, { n: t.n + ' Desktop Theme', v: '1.' + i, kb: t.kb, rel: ['05/06/99', '19/03/99', '28/07/99', '13/08/99'][i], ic: 'themes', apps: ['bdl.theme:' + k.toUpperCase()], paths: ['Desktop Dazzle > ' + t.n + ' Theme'], launch: 'bdl.theme:' + k, exe: 'THEMES.EXE', dir: 'Plus! Dazzle\\' + t.n.replace(/[^A-Za-z0-9 ]/g, ''), setup: k + 'thm.exe', d: t.d, note: 'Needs High Colour (16 bit) or better. Looks a bit sad in 16 colours.' }));
  P('bdl.shock', { n: 'ShockJack Player 7', v: '7.0', kb: 1180, by: 'Jackromedia Inc.', home: 'http://www.jacktoonz.toonz/', cat: 'net', sq: 5, rel: '12/04/99', ic: 'media', apps: ['bdl.plugin:SHOCK'], paths: ['ShockJack 7 > About ShockJack'], launch: 'bdl.plugin:shock', exe: 'SQSHOCK.OCX', setup: 'sqshock7.exe',
    d: 'The plug-in that makes web pages MOVE! Animated intros, cartoons and spinning 3D logos right inside JackNet Explorer. Over 3 million web sites need it (to show you a logo for 30 seconds before you can click anything).', note: 'You may need to restart JackNet Explorer. You won\'t, but you may.' });
  P('bdl.jtime', { n: 'JackTime 4 Player', v: '4.0', kb: 5200, by: 'JackTime Media Ltd', home: 'http://www.trailerpark.flick/', cat: 'mm', sq: 4, rel: '01/05/99', ic: 'media', apps: ['bdl.plugin:JTIME'], paths: ['JackTime > JackTime Player'], launch: 'bdl.plugin:jtime', exe: 'JACKTIME.EXE', setup: 'jtime4.exe',
    d: 'Watch movie trailers on the Internet! In a window the size of a matchbox! At 12 frames a second! The future is here, and it is slightly blurry.', note: 'Upgrade to JackTime 4 PRO for full screen (£20). Or squint.' });
  // RealJack Player G2 already exists (era-apps.js, product 'realsquig'): the radio station uses that one
  P('bdl.smileys', { n: 'FREE SMILEYZ!!! 3.0', v: '3.0', kb: 640, lic: 'Adware', cat: 'net', sq: 2, rel: '01/07/99', ic: 'messenger', apps: ['bdl.smileys'], paths: ['FREE SMILEYZ! > Smiley Palette'], exe: 'SMILEYZ.EXE', setup: 'freesmileyz.exe',
    d: 'Hundreds of FREE smileys for your e-mails!!! :-) ;-) :-D Adds a smiley bar to JackMail Express so every message you send is 1000% more fun. (Also adds a small advert to the bottom of every message. A small one.)', note: 'Does NOT contain spyware. We checked. We asked it and it said no.' });

  A.register('bdl.theme', { open(arg) { return themeWindow(String(arg || '').toLowerCase()); } });
  Object.entries(THEMES).forEach(([k, t]) => A.addProgram(['Desktop Dazzle', t.n + ' Theme'], () => A.open('bdl.theme', k), J('themes', 16)));
  A.cmd(['dazzle', 'desktopdazzle'], () => openSite(DDU));
  A.cmd(['dazzlethemes', 'bdlthemes'], () => themeWindow());
  A.register('bdl.plugin', { open(arg) { const k = String(arg || 'shock').toLowerCase(); return web().then(W => W.pluginApp(k)); } });
  A.register('bdl.smileys', { open() { return smileyPalette(); } });
  A.addProgram(['ShockJack 7', 'About ShockJack'], () => A.open('bdl.plugin', 'shock'), J('media', 16));
  A.addProgram(['JackTime', 'JackTime Player'], () => A.open('bdl.plugin', 'jtime'), J('media', 16));
  A.addProgram(['FREE SMILEYZ!', 'Smiley Palette'], () => A.open('bdl.smileys'), J('messenger', 16));
  const plugOK = k => !!(PLUGS[k] && window.Setup && Setup.has(PLUGS[k].pid));

  // ================================================================ FREE SMILEYZ!!! in Outlook Express
  const SMI = '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="7" fill="#ffd400" stroke="#000"/><circle cx="5.5" cy="6" r="1"/><circle cx="10.5" cy="6" r="1"/><path d="M4.5 9.5q3.5 3.5 7 0" stroke="#000" fill="none"/></svg>';
  function smileyBar(win) {
    if (!window.Setup || !Setup.has('bdl.smileys') || qs(win, '.bdl-sm')) return;
    const ta = qs(win, 'textarea[name=body]'), anchor = qs(win, '.oe-catt'); if (!ta || !anchor) return;
    const bar = h(`${SMI}<b>SMILEYZ!</b>${SMILEYS.map(([s, n]) => `<button type="button" title="${esc(n)}">${esc(s)}</button>`).join('')}<span class="ad">Powered by FREE SMILEYZ!!! 3.0</span>`, 'bdl-sm');
    anchor.parentNode.insertBefore(bar, anchor);
    qsa(bar, 'button').forEach(bt => bt.addEventListener('click', () => {
      const s = bt.textContent, a = ta.selectionStart || ta.value.length, e = ta.selectionEnd || a;
      ta.value = ta.value.slice(0, a) + s + ' ' + ta.value.slice(e);
      if (!ta.value.includes('FREE SMILEYZ!!!')) ta.value += SMILEY_SIG;
      ta.focus(); const p = a + s.length + 1; ta.setSelectionRange(p, p); sfx('click');
    }));
    const send = qs(win, '.fx-tools [data-a=send]');
    if (send) send.addEventListener('click', () => { const to = qs(win, '[name=to]'); if (to && to.value.trim() && ta.value.includes('FREE SMILEYZ!!!')) secret('smiley'); }, true);
  }
  function smileyPalette() {
    const b = h(`<p style="margin:0 0 6px">Click a smiley to see what it means. Then open <b>JackMail Express</b> and write a New Message: the smiley bar is at the top!</p><div class="bdl-sm" style="justify-content:center">${SMILEYS.map(([s, n]) => `<button type="button" title="${esc(n)}">${esc(s)}</button>`).join('')}</div><p class="small sm-out" style="min-height:2.5em;margin:6px 0">&nbsp;</p><div class="row" style="justify-content:flex-end"><button class="btn" data-x="mail">Write an e-mail</button><button class="btn" data-x="close">Close</button></div>`);
    const w = A.win('FREE SMILEYZ!!! Palette', b, { w: 380, icon: J('messenger', 16), noResize: true, noMax: true });
    qsa(b, '.bdl-sm button').forEach(bt => bt.addEventListener('click', () => { qs(b, '.sm-out').textContent = `${bt.textContent} means "${bt.title}". Tilt your head to the left!`; sfx('click'); }));
    qs(b, '[data-x=mail]').addEventListener('click', () => { w.close(); A.open('outlook'); toast('FREE SMILEYZ!!!', 'Click "New Mail" and the smiley bar will be waiting for you. :-)', 5000); });
    qs(b, '[data-x=close]').addEventListener('click', w.close);
    return w;
  }

  // ================================================================ the tray MIDI player (pages that autoplay music)
  const NOTE = '<svg viewBox="0 0 16 16"><path d="M6 2l8-1.5v10" stroke="#000" stroke-width="1.6" fill="none"/><path d="M6 2v10" stroke="#000" stroke-width="1.6"/><ellipse cx="4" cy="12.5" rx="2.6" ry="2" fill="#a020c0" stroke="#000"/><ellipse cx="12" cy="11" rx="2.6" ry="2" fill="#a020c0" stroke="#000"/></svg>';
  let midiBtn = null, midiTitle = '', midiWin = null;
  const midi = {
    play(tune, title) {
      midiTitle = title || tune;
      try { if (Sound.on) Sound.music.play(tune); } catch (e) {}
      if (!midiBtn && $('tray')) { midiBtn = h(NOTE, 'bdl-tray', 'button'); midiBtn.id = 'bdlMidi'; midiBtn.addEventListener('click', midiPanel); $('tray').insertBefore(midiBtn, $('tray').firstChild); }
      if (midiBtn) midiBtn.title = 'JackTunes MIDI Plug-in: ' + midiTitle + (Sound.on ? '' : ' (muted)');
      midi.tune = tune;
      if (!Sound.on) toast('JackTunes MIDI', `This page is playing "${midiTitle}"! (Your sound is off. Click the speaker by the clock to hear it. Or don't. Probably don't.)`, 5000);
    },
    stop() { try { if (midi.tune && Sound.music.playing === midi.tune) Sound.music.stop(); } catch (e) {} midi.tune = null; if (midiBtn) { midiBtn.remove(); midiBtn = null; } if (midiWin && !midiWin.closed) midiWin.close(); },
    tune: null,
  };
  function midiPanel() {
    if (midiWin && !midiWin.closed) return midiWin.focus();
    const b = h(`<div class="row" style="flex-wrap:nowrap;gap:8px;align-items:center"><span style="width:32px;height:32px;display:inline-block">${NOTE.replace('<svg', '<svg width="32" height="32"')}</span><div style="flex:1;min-width:0"><b>Now playing:</b><div class="lcd" style="padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(midiTitle)}.mid</div><div class="small">JackTunes MIDI Plug-in 2.1 (it came with a homepage)</div></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-m="play">&#9654; Play</button><button class="btn" data-m="stop">&#9632; Stop</button></div>`);
    midiWin = A.win('JackTunes MIDI', b, { w: 300, icon: NOTE, noResize: true, noMax: true });
    qs(b, '[data-m=play]').addEventListener('click', () => { if (!Sound.on) return msg('JackTunes MIDI', 'Your sound is switched off. Click the speaker in the corner by the clock first.', 'info'); if (midi.tune) Sound.music.play(midi.tune); });
    qs(b, '[data-m=stop]').addEventListener('click', () => { midi.stop(); toast('JackTunes MIDI', 'Peace and quiet at last. Mom says thank you.', 3000); });
  }

  // ================================================================ files on C: (they come back after a restart)
  function fileNodes() {
    A.fs.dir('C:/JACKOS/CURSORS').kids = A.fs.dir('C:/JACKOS/CURSORS').kids.filter(k => !k.bdl);
    A.fs.add('C:/JACKOS/CURSORS', { name: 'hourglass_forever.ani', type: 'ani', date: '10/12/98', size: '6 KB', text: '' });
    S.curs.forEach(id => CURS[id] && A.fs.add('C:/JACKOS/CURSORS', { name: fileName('cur', id), type: 'ani', bdl: id, date: d99(), size: kbStr(CURS[id].kb) }));
    const fd = A.fs.dir('C:/JACKOS/FONTS'); fd.kids = fd.kids.filter(k => !k.bdl);
    if (!fd.kids.length) SYSF.forEach(f => fd.kids.push({ name: f[1], type: 'ttf', sys: f[0], date: '10/12/98', size: f[3] + ' KB' }));
    S.fonts.forEach(id => FONTS[id] && A.fs.add('C:/JACKOS/FONTS', { name: FONTS[id].file, type: 'ttf', bdl: id, date: d99(), size: kbStr(FONTS[id].kb) }));
    const sd = A.fs.dir('C:/JACKOS/SYSTEM'); sd.kids = sd.kids.filter(k => !k.bdlSaver);
    S.savers.forEach(id => SAVERS[id] && sd.kids.push({ name: fileName('saver', id), type: 'scr', bdl: id, bdlSaver: true, date: d99(), size: kbStr(SAVERS[id].kb) }));
    const pd = A.fs.dir('C:/My Documents/My Pictures'), names = new Set(store.get('jhp_prog_pics', []).map(p => p.name));
    S.walls.forEach(id => { if (WALLS[id] && !names.has(picName(id))) addPic(id); });
    if (pd && !pd.kids) pd.kids = [];
  }
  A.OPENERS.ttf = node => node.bdl ? fontPreview(node.bdl) : fontPreview(null, SYSF.find(f => f[0] === node.sys) || SYSF[0]);
  A.OPENERS.ani = node => {
    if (!node.bdl) return msg(node.name, 'This pointer is an hourglass that never stops. Jack set it as a joke on Dad\'s computer once. Never again.', 'info');
    const id = node.bdl;
    art().then(a => {
      const fr = a.cursorFrames(id);
      const d = A.ui.dialog(node.name, `<div class="bdl-cp"><div class="big"><img alt=""></div><div><b>${esc(CURS[id].n)}</b><br><span class="small">${esc(CURS[id].d)}</span></div></div>`, [['Use it', () => setCursor(id)], ['Close']], { w: 340, icon: J('mouse', 16) });
      const img = qs(d.b, 'img'); let i = 0; const tick = () => { if (!img.isConnected) return clearInterval(iv); img.src = svgData(fr[i++ % fr.length].svg); }; const iv = setInterval(tick, 130); tick();
    });
  };

  // ================================================================ the web sites (pages render from bridge-dl-web.js)
  function openSite(url) { const br = $('browser'); if (br) br.classList.remove('min'); IE.navigate(url); }
  function lazy(host, path) {
    return () => {
      if (window.BridgeDLWeb) return BridgeDLWeb.render(host, path);
      const el = h('<p style="font:13px Arial,sans-serif;padding:20px;background:#fff;color:#000;margin:0;min-height:300px">Contacting host: ' + esc(host) + '... (the modem is doing its noises)</p>');
      web().then(W => { if (el.isConnected) el.replaceWith(W.render(host, path)); }).catch(() => { el.textContent = 'The page cannot be displayed. (The modem hung up.)'; });
      return el;
    };
  }
  const SITES = {
    [DD]: { title: 'DESKTOP DAZZLE!!! FREE Wallpapers, Cursors, Themes & More', desc: 'FREE wallpapers, animated cursors, desktop themes, screen savers, fonts and smileys! Make your computer look AWESOME. Updated every week (ish).', cat: 'soft',
      pages: { '/': ['DESKTOP DAZZLE!!! FREE stuff for your desktop', 'free wallpapers cursors themes screen savers fonts smileys download'], '/wallpapers.html': ['FREE Wallpapers - Desktop Dazzle', 'wallpaper download space robot scrapyard peapod race blocks cube dinosaurs sunset monolith cyber grid y2k'], '/cursors.html': ['FREE Animated Cursors - Desktop Dazzle', 'animated cursors ani blobbit spanner rocket laser sword cube rainbow hourglass mouse pointer'], '/themes.html': ['Desktop Themes - Desktop Dazzle', 'desktop themes scrapyard robots outer space underwater mystery 1999 plus'], '/savers.html': ['FREE Screen Savers - Desktop Dazzle', 'screen savers flying floppies warp tunnel aquarium lava lamp'], '/fonts.html': ['FREE Fonts - Desktop Dazzle', 'fonts truetype comic strip blocky 8-bit wingdingz'], '/smileys.html': ['FREE SMILEYZ - Desktop Dazzle', 'free smileys emoticons e-mail jackmail express'], '/plugins.html': ['Plug-in Zone - Desktop Dazzle', 'plug-ins shockjack shocksquig jacktime realjack realsquig download'], '/intro.html': ['Desktop Dazzle - ShockJack Intro', 'shocksquig intro skip intro'], '/about.html': ['About Desktop Dazzle', 'about webmaster dazzledan awards'] } },
    'www.jacktoonz.toonz': { title: 'JACKTOONZ - Cartoons on the Web!', desc: 'Online cartoons starring Gubbinz, made with ShockJack. Plus a spinning 3D logo that took three weeks.', cat: 'fun',
      pages: { '/': ['JACKTOONZ - Cartoons on the Web!', 'cartoons shockjack gubbinz robot trouble'], '/3d.html': ['JACKTOONZ - 3D Logo Zone', '3d spinning logo shocksquig'] } },
    'www.trailerpark.flick': { title: 'THE TRAILER PARK - Movie trailers online', desc: 'Watch movie trailers on the Internet with JackTime! RoboKid, Attack of the 50ft Blob and more. Bring popcorn (and patience).', cat: 'fans',
      pages: { '/': ['THE TRAILER PARK - Movie trailers online', 'movie trailers jacktime robokid attack of the 50ft blob'], '/robogrot.html': ['RoboKid - Trailer', 'robokid trailer'], '/squig50.html': ['Attack of the 50ft Blob - Trailer', '50ft blob trailer'] } },
    'www.radiojack.wubwub': { title: 'RADIO JACK 99.9 - Live on the Internet!', desc: 'Internet radio for everyone! Listen live with RealJack: chart hits, the Video Game Music Hour and the shipping forecast.', cat: 'fun',
      pages: { '/': ['RADIO JACK 99.9 - Live on the Internet!', 'internet radio realjack realsquig live stream'] } },
    'www.freepagez.w3b': { title: 'The Annoying Ring', desc: 'A webring of homepages with ALL the best JavaScript: no right-clicking, earthquakes, pop-ups, scrolling text and MIDI music! Join today!', cat: 'weird', ring: 1,
      pages: { '/': ['THE ANNOYING RING - Home', 'annoying ring webring javascript homepages'], '/~kev/': ["KEV'S KOOL GRAPHIX", 'kev graphics right click disabled'], '/~shazza/': ["SHAZZA'S PONY PALACE", 'ponies midi music'], '/~dean/': ["DEAN'S DISASTER ZONE", 'earthquake shake'], '/~gaz/': ["GAZ'S MEGA PAGE", 'best viewed in 1024x768 resolution'], '/~kyle/': ["Kyle's Korner", 'small window corner'], '/~freestuff/': ['FREE STUFF ZONE!!!', 'free stuff pop-ups winner'], '/~billy/': ["Billy's Page (please don't go)", 'please do not leave'], '/~sparkle/': ['~*~ SpArKlE ZoNe ~*~', 'sparkles glitter snow'] } },
  };
  Object.entries(SITES).forEach(([host, s]) => {
    const pages = {};
    Object.entries(s.pages).forEach(([p, [title, text]]) => {
      const pg = { title, text: title + '. ' + text + '. ' + s.desc, html: lazy(host, p) };
      pages[p] = pg;
      if (p.length > 2 && p.endsWith('/')) pages[p.slice(0, -1)] = { title, text: pg.text, path: p, html: lazy(host, p) };
    });
    IE.addSite(host, { title: s.title, desc: s.desc, cat: s.cat, pages });
  });
  // pages come alive (status bars, pop-ups, music...) when they're shown, and stop when you leave
  let onPage = null;
  document.addEventListener('section', ev => {
    const d = String(ev.detail || '');
    const leaving = onPage; onPage = null;
    if (leaving && window.BridgeDLWeb) BridgeDLWeb.leave(leaving, d);
    const m = d.match(/^site:(www\.[a-z0-9.-]+)(\/.*)$/);
    if (!m || !SITES[m[1]]) return;
    const page = { host: m[1], path: m[2].replace(/^(\/~[a-z]+)$/, '$1/') };
    onPage = page;
    web().then(W => { if (onPage === page) W.enter(page); });
  });
  document.addEventListener('setup', ev => {
    const d = ev.detail || {};
    if (window.BridgeDLWeb) BridgeDLWeb.setupChanged(d);
    if (!d.on && S.theme && THEMES[S.theme.id] && THEMES[S.theme.id].pid === d.id) applyTheme('std').then(() => toast('Desktop Themes', 'The theme has been removed, so your desktop is back to JackOS Standard.', 4000));
  });

  // ================================================================ secrets
  [['wallpaper', 'Interior decorator', 'Download a picture off the Web and put it on your desktop'],
    ['cursor', 'Pointy', 'Make your mouse pointer move all by itself'],
    ['font', 'Font fanatic', 'Install a font you found on the Internet'],
    ['theme', 'Total makeover', 'Change everything at once with a theme from the Web'],
    ['plugin', 'Plugged in', 'A broken puzzle piece means you are missing something. Fix it'],
    ['intro', 'Patience of a saint', 'Watch a whole website intro without skipping it'],
    ['rclick', 'Graphics thief', 'Keep right-clicking a page that says you can\'t'],
    ['quake', 'Earthquake survivor', 'Survive three earthquakes on one homepage'],
    ['popups', 'Pop-up whacker', 'Close a whole chain of pop-up jackos'],
    ['clingy', 'Can\'t say goodbye', 'Get talked out of leaving a homepage three times'],
    ['ring', 'Ring of annoyance', 'Visit every homepage on the most annoying webring on the Web'],
    ['smiley', 'Smiley spammer', 'Send an e-mail with FREE smileys in it'],
  ].forEach(s => A.defineSecret('bdl.' + s[0], s[1], s[2]));

  // ================================================================ start up
  S.fonts.forEach(id => FONTS[id] && addFontStack(id));
  fileNodes();
  if (S.cursor) applyCursor();
  setTimeout(() => { restoreTheme(); if (S.fonts.length) setTimeout(() => S.fonts.forEach(loadFont), 1500); }, 600);

  window.BridgeDL = {
    WALLS, CURS, SAVERS, FONTS, THEMES, PLUGS, SMILEYS, DD, DDU, get S() { return S; }, save,
    art, web, has, download, setWallpaper, setCursor, setSaver, startSaver, runSaver, applyTheme, themeWindow, loadFont, fontPreview, fontList, pointersTab,
    plugOK, midi, secret, openSite, svgData, kbStr, hash, h, qs, qsa, msg, toast, sfx, J, touchy, esc,
  };
})();
