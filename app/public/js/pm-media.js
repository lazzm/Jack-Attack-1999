/* pm-media: PHYSICAL MEDIA. Jack's discs, game boxes, magazines and floppies are real things in his room (js/pm-room.js draws
 * them in 3D: the games shelf by the PC, the floppy box, the pile of mags with their cover CDs taped on). You put a disc in
 * the PC's real CD tray (or a floppy in the slot) and the PC sees it: drive D: is still discs.js's jhp_discs.cd, drive A: is
 * ours. This file is the PC side: what you own, what is where, the discs other packs never had a drive for (audio CDs, the
 * monthly cover CDs, the JackOS 98 CD...), drive A: in My Computer, Eject, and a small "lean back and grab a disc" window
 * for when you can't get to the room (phones). New things turn up as you play: downloads get saved to floppies, games come
 * by post from a mail-order catalogue, back issues of the mag arrive with their discs, mates leave things round yours.
 *
 *   PM.items()            every thing you own: [{ id, kind, title, label, disc, where }]   kind: box jewel sleeve cdr cart floppy mag
 *   PM.item(id) / PM.owns(id) / PM.where(id) -> 'D' | 'A' | 'tray' | 'shelf'
 *   PM.insert(id, o)      put it in its drive (o.room: it came from the room, so no nudge; the room animates it first)
 *   PM.ejectD() / PM.ejectA() / PM.take(id) (off the open tray, back to the shelf)
 *   PM.on('change', fn)   anything moved (fn(why, id)); why: 'insert' 'eject' 'ejectA' 'insertA' 'own' 'tray' 'parcel'
 *   PM.parcels() / PM.openParcel()   mail-order parcels waiting in the room
 * State: localStorage jhp_pm (roams with a member's profile): { v, own:{id:ts}, a, tray, fl:{id:{k,lab,pid,c,t}}, ord:[{id,at}],
 *   parcel:[id], days:[...], gift:n, seen:{} } */
(function () {
  'use strict';
  const A = window.Apps, D = window.Discs; if (!A || !D || !D.ext || window.PM) return;
  const store = A.store, esc = A.esc;
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i, b), toast = (t, x, ms) => { try { Desk.toast(t, x, ms); } catch (e) {} };
  const today = () => { try { return Desk.today99(); } catch (e) { const d = new Date(); return { m: d.getMonth() + 1, d: d.getDate(), md: (d.getMonth() + 1) * 100 + d.getDate() }; } };
  const cast = (s, f) => { try { return window.Cast ? Cast.t(s) : f; } catch (e) { return f || s; } };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON3 = MONTHS.map(m => m.slice(0, 3).toUpperCase());
  const pad = n => String(n).padStart(2, '0');

  // ================================================================ state
  const KEY = 'jhp_pm';
  const ls = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const S0 = store.get(KEY, null);
  const S = Object.assign({ v: 1, own: {}, a: '', tray: '', fl: {}, days: [], gift: 0, seen: {}, n: 0 }, S0 || {});
  ['own', 'fl', 'seen'].forEach(k => { if (!S[k] || typeof S[k] !== 'object' || Array.isArray(S[k])) S[k] = {}; });
  ['days'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
  const save = () => store.set(KEY, S);
  const EVS = {}; const emit = (ev, ...a) => (EVS[ev] || []).forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } });
  const changed = (why, id) => { save(); emit('change', why, id); };

  // ================================================================ the catalogue: discs.js's boxes + our own discs + the mags + floppies
  const KIND = { big: 'box', jewel: 'jewel', cdr: 'cdr', sleeve: 'sleeve', floppy: 'floppy', cart: 'cart' };
  const MINE = {
    'pm.os98': { kind: 'jewel', title: 'JackOS 98 CD-ROM', label: 'JACKOS98', c1: '#0a246a', c2: '#ffffff', c3: '#3a8ad8', sys: true,
      blurb: 'The JackOS 98 CD that came with the PC. Mom keeps it "somewhere safe". JackOS Setup asks for it whenever you tick a box.' },
    'pm.netplanet': { kind: 'sleeve', title: 'NetPlanet 4.0 FREE trial CD', label: 'NETPLANET4', c1: '#1a3aaa', c2: '#ffd400', c3: '#e10600', junk: true,
      blurb: 'It came through the letterbox in a cardboard sleeve. 500 FREE HOURS! (in the first month). The fourth one this week. They make good coasters.' },
    'pm.gub': { kind: 'jewel', title: 'Gubbinz & The Robots: Greatest Hits', label: 'GUBBINZ', c1: '#ff6a00', c2: '#ffffff', c3: '#2a2aaa', audio: 'gubbinz',
      blurb: 'Nine smash hits from the only band with four tin robots in it. An Enhanced CD: put it in the PC for bonus band photos.' },
    'pm.mix': { kind: 'jewel', title: 'Dad\'s car mix', label: 'MIX!!', c1: '#d8d8e0', c2: '#000', c3: '#c00000', audio: 'mix',
      blurb: 'Dad\'s CD from the car. "DAD\'S CAR MIX - DO NOT TOUCH" in felt tip. It has been in the car. It has been UNDER the car.' },
  };
  for (const x of window.PMCat?.ITEMS || []) if(x.kind==='hardware') MINE[x.id]={kind:'hardware',title:x.title,console:x.console,blurb:x.blurb,c1:'#303945',c2:'#ddcf9e'};
  const MAG = m => 'pm.mag.' + pad(m), COVER = m => 'pm.cv.' + pad(m);
  const magOut = m => m >= 1 && m <= 12 && m <= today().m;
  const BOXES = () => D.BOXES;
  function item(id) {
    if (!id) return null;
    const b = D.BOX[id];
    if (b) return { id, kind: KIND[b.kind] || 'jewel', title: D.titleOf(b), label: b.label, disc: b.kind === 'floppy' ? '' : id, a: b.kind === 'floppy', box: b, owner: b.owner || (S.lent && S.lent[id]) || '', c1: b.c1, c2: b.c2, c3: b.c3 };
    if (MINE[id]) return Object.assign({ id, disc: MINE[id].kind==='hardware'?'':id }, MINE[id]);
    const mm = /^pm\.mag\.(\d\d)$/.exec(id);
    if (mm) { const m = +mm[1]; return { id, kind: 'mag', m, title: window.MagazineCat?.byId[id]?.title || `JACK ATTACK! ${MONTHS[m - 1]} 1999`, label: 'JA ' + MON3[m - 1] + ' 99', disc: COVER(m) }; }
    const f = S.fl[id];
    if (f) return { id, kind: 'floppy', a: true, title: f.lab || 'A blank floppy disk', label: f.lab || '', fl: f };
    return null;
  }
  const discItem = disc => !disc ? '' : /^pm\.cv\./.test(disc) ? 'pm.mag.' + disc.slice(6) : disc; // (what's in D: -> the thing on the shelf)
  // mail-order games (mods/pmx.js keeps the orders): yours once the parcel's opened
  const SRV = { member: false, orders: [], today: 0, max: 3, bal: 0, md: 0, ok: false };
  S.opened = S.opened && typeof S.opened === 'object' ? S.opened : {};
  const srvOwns = id => SRV.member && SRV.orders.some(o => o.id === id && S.opened[o.no]);
  const cartFound = id => { try { return /^cart\./.test(id) && ((ls('jhp_starter')!=='1'&&window.RoomCat?.GAME[id.slice(5)]?.own)||window.Room?.found?.(id)); } catch (e) { return false; } };
  const owns = id => !!(S.own[id] || S.fl[id] || srvOwns(id) || cartFound(id));
  function items() {
    const out = [];
    for (const b of BOXES()) if (owns(b.id)) out.push(item(b.id));
    for (const id in MINE) if (owns(id)) out.push(item(id));
    for (let m = 1; m <= 12; m++) if (owns(MAG(m)) && magOut(m)) out.push(item(MAG(m)));
    for (const id of Object.keys(S.fl).sort((x, y) => (S.fl[x].t || 0) - (S.fl[y].t || 0))) out.push(item(id));
    return out.map(x => Object.assign(x, { where: where(x.id) }));
  }
  function where(id) {
    if (S.a === id) return 'A';
    if (discItem(D.drive) === id) return 'D';
    if (S.tray === id) return 'tray';
    return 'shelf';
  }

  // ================================================================ our discs in drive D: (discs.js runs them: AutoPlay, Explore)
  const file = (n, t, s, fn) => [n, t, s, fn];
  const notepad = (n, t) => () => Desk.notepad(n, t);
  const openCD = id => { try { if (window.Carta && Carta.openWith) Carta.openWith('carta.cdplayer', 'cd', id); else A.open('carta.cdplayer', id); } catch (e) { A.open('carta.cdplayer', id); } };
  D.ext('pm.os98', { label: 'JACKOS98', title: 'JackOS 98 CD-ROM',
    autorun() { return msg('JackOS 98 CD-ROM', 'Welcome to JackOS 98!\n\nThis CD is already installed on your computer. You can add and remove JackOS components (Solitaire, the screen savers, Phone Dialer...) in JackOS Setup.\n\nWhat would you like to do?', 'q', [['JackOS Setup', () => { try { Setup.applet('setup'); } catch (e) { A.open('control'); } }], ['Browse This CD', () => D.open && openD()], ['Close']]); },
    files: () => [file('SETUP.EXE', 'exe', '412 KB', () => { try { Setup.applet('setup'); } catch (e) {} }), file('README.TXT', 'txt', '9 KB', notepad('README.TXT', 'JACKOS 98 README\n================\n\nThank you for choosing JackOS 98!\n\n- If the computer says "not responding", wait.\n- If it still says it, wait more.\n- If it STILL says it, it\'s Dave\'s fault.\n\nKeep this CD safe. You will need it the next time you tick a box in JackOS Setup.\n')), file('DRIVERS', 'dir', '', () => msg('D:\\DRIVERS', 'Drivers for every printer ever made. Except ours.', 'info')), file('CABS', 'dir', '', () => msg('D:\\CABS', '127 files called JACK98_1.CAB to JACK98_127.CAB. Do not touch.', 'info'))] });
  D.ext('pm.netplanet', { label: 'NETPLANET4', title: 'NetPlanet 4.0 trial CD',
    autorun() {
      sfx('startup');
      const inst = window.Setup && Setup.get('online') ? Setup.has('online') : true;
      return msg('NetPlanet 4.0', 'WELCOME TO NETPLANET 4.0!\n\n500 FREE HOURS* of the Internet!\n\n(*in your first month. That\'s about 16 hours a day. Mom says no.)\n\n' + (inst ? 'NetPlanet is already installed. It\'s in the Online Services folder on your desktop.' : 'Install NetPlanet now?'), 'info', inst ? [['OK']] : [['Install', () => Setup.install('online', 'cd')], ['Use it as a coaster']]);
    },
    files: () => [file('SETUP.EXE', 'exe', '1.1 MB', () => (window.Setup && Setup.get('online') && !Setup.has('online')) ? Setup.install('online', 'cd') : msg('NetPlanet 4.0', 'Already installed. You can only have so much NetPlanet.', 'info')), file('FREEHRS.TXT', 'txt', '1 KB', notepad('FREEHRS.TXT', '500 FREE HOURS!!!\n\n*In your first calendar month. Phone calls charged at your normal rate. After that, it\'s £16.99 a month. Cancel any time** \n\n**by post, in triplicate, with a stamped addressed envelope.\n'))] });
  D.ext('pm.gub', { label: 'GUBBINZ', title: 'Gubbinz & The Robots', autorun: () => openCD('gubbinz'),
    files: () => [file('Track01.cda', 'exe', '44 bytes', () => openCD('gubbinz')), file('BAND', 'dir', '', () => openCD('gubbinz')), file('README.TXT', 'txt', '1 KB', notepad('README.TXT', 'GUBBINZ & THE ROBOTS - GREATEST HITS (ENHANCED CD)\n\nPut this CD in a CD player for music. Put it in a computer for music AND pictures of four tin robots looking moody.\n'))] });
  D.ext('pm.mix', { label: 'MIX!!', title: 'Dad\'s car mix', autorun: () => openCD('mix'),
    files: () => [1, 2, 3, 4, 5, 6].map(i => file('Track0' + i + '.cda', 'exe', '44 bytes', () => openCD('mix'))) });
  for (let m = 1; m <= 12; m++) D.ext(COVER(m), { label: 'JA_' + MON3[m - 1] + '99', title: `JACK ATTACK! ${MONTHS[m - 1]} cover CD`,
    autorun: () => A.open('ssn.disc', m - 1),
    files: () => [file('AUTORUN.EXE', 'exe', '220 KB', () => A.open('ssn.disc', m - 1)), file('DEMOS', 'dir', '', () => A.open('ssn.disc', m - 1)), file('README.TXT', 'txt', '2 KB', notepad('README.TXT', `JACK ATTACK! COVER CD - ${MONTHS[m - 1].toUpperCase()} 1999\n\nIf the menu doesn't appear by itself, run AUTORUN.EXE.\nDisc not working? Blow on it. Then ring the helpline (calls cost 50p a minute. Ask whoever pays the bill).\n`))] });
  function openD() { try { A.cmds['d:'] ? A.cmds['d:']('d:') : A.open('explorer', 'D:\\'); } catch (e) {} }

  // ================================================================ the fresh PC, and PCs that were here before
  const FRESH = ['pm.os98', 'pm.netplanet', 'pm.gub', 'pm.mix', 'cover7', 'dx61', 'rts'];
  if (!S0) {
    const old = ls('jhp_discs') != null || window.JHPEverBooted === true || !!ls('jhp_roam_who') || /"mig":1/.test(ls('jhp_setup') || '');
    const t = Date.now();
    if (old) { BOXES().forEach(b => { S.own[b.id] = t; }); for (const id in MINE) S.own[id] = t; S.gift = 99; S.old = 1; } // (everything the old cupboard had: nothing is lost)
    else FRESH.forEach(id => { S.own[id] = t; });
    S.fl['pm.fl.1'] = { k: 'blank', lab: '', c: 0, t: t }; S.fl['pm.fl.2'] = { k: 'blank', lab: '', c: 1, t: t + 1 }; S.n = 2;
    if (old) addFloppy({ k: 'dave', lab: 'DAVE\'S DISK', c: 3 }, true);
    save();
  }
  // Record the magazines and machines already present in older rooms once.
  if(!S.magazines){
    const now=Date.now();for(const id of window.MagazineCat?.STARTER || ['pm.mag.01','pm.mag.02'])if(!S.own[id])S.own[id]=now;
    // Retain the old room's distinct back issues, but do not create duplicate copies.
    if(ls('jhp_starter')!=='1'){for(const m of [1,2,3,4,5,6,8,9])S.own[MAG(m)]=S.own[MAG(m)]||now;const current=today().m;S.own[MAG(current)]=S.own[MAG(current)]||now;for(const id in MINE)if(MINE[id].kind==='hardware')S.own[id]=S.own[id]||now}
    S.magazines=1;save();
  }
  { const c = D.drive; const it = discItem(c); if (it && !owns(it) && (D.BOX[it] || MINE[it] || /^pm\.mag/.test(it))) { S.own[it] = Date.now(); save(); } }
  if (S.a && !S.fl[S.a] && S.a !== 'gquest') { S.a = ''; save(); }
  if (S.tray && (!owns(S.tray) || discItem(D.drive) === S.tray)) { S.tray = ''; save(); }
  function grant(id, why) {
    if (!id || owns(id)) return false;
    S.own[id] = Date.now(); changed('own', id);
    if (why) toast(why[0], why[1], 6000);
    return true;
  }
  function addFloppy(f, quiet) {
    const id = 'pm.fl.' + (++S.n);
    S.fl[id] = Object.assign({ c: S.n % 7, t: Date.now() }, f);
    if (!quiet) changed('own', id); else save();
    return id;
  }

  // ---- visiting days: mates leave things round yours (a fresh PC fills up as you play)
  const GIFTS = [
    { id: 'fl.dave', fl: { k: 'dave', lab: 'DAVE\'S DISK', c: 3 }, t: ['Dave came round', 'Dave left his floppy disk on your desk. "DON\'T LOOK ON IT." It\'s in your floppy box.'] },
    { id: 'fl.gcse', fl: { k: 'gcse', lab: 'GCSE COURSEWORK?? DO NOT DELETE', c: 1 }, t: ['Found it!', 'Your GCSE coursework floppy was in your school bag the whole time. It\'s in the floppy box now. (Back it up!)'] },
    { id: 'n64', t: ['Luke came round', 'Luke "forgot" his ULTRA 64 cartridge. Again. It\'s on your games shelf.'] },
    { id: 'callumcd', t: ['Callum came round', 'Callum lent you his shareware mix CD. He wants it back by Friday. It\'s on your games shelf.'] },
    { id: 'pinball', lent: 'JackK', t: ['JackK came round', 'JackK lent you SPACE JACK PINBALL. "Don\'t beat my high score." It\'s on your games shelf, with his name on it.'] },
    { id: 'jrt', t: ['Callum came round (again)', 'Callum lent you JACKREAL TOURNAMENT. "Don\'t scratch it. I\'ll know." It\'s on your games shelf.'] },
    { id: 'gquest', t: ['A floppy in the post', 'The text adventure floppy came in the post from a shareware club. It\'s in your floppy box.'] },
  ];
  function dayTick() {
    const t = today(), k = t.m * 100 + t.d, real = new Date().toDateString();
    if (S.days[S.days.length - 1] === real) return;
    S.days = S.days.concat([real]).slice(-40); save();
    if (S.days.length < 2) return;
    while (S.gift < GIFTS.length) {
      const g = GIFTS[S.gift++];
      if (g.fl) { if (!Object.values(S.fl).some(f => f.k === g.fl.k)) { addFloppy(g.fl); setTimeout(() => toast(g.t[0], g.t[1], 7000), 4000); break; } }
      else if (!owns(g.id)) { if (g.lent) { S.lent = S.lent || {}; S.lent[g.id] = g.lent; } grant(g.id); setTimeout(() => toast(g.t[0], g.t[1], 7000), 4000); break; }
    }
    save(); void k;
  }
  if (window.BootDone) BootDone.then(() => setTimeout(dayTick, 3000)); else setTimeout(dayTick, 6000);

  // ================================================================ watching drive D: (whoever changes it: the room, the PC, the CD Player)
  let lastD = D.drive, fromRoom = false, nudged = false;
  const roomLive = () => { const pb = document.getElementById('bootPower'); return !!(pb && pb.isConnected && !pb.hidden && window.Room); };
  function pollD() {
    const now = D.drive;
    if (now === lastD) return;
    const was = lastD; lastD = now;
    const wi = discItem(was), ni = discItem(now);
    if (ni && S.tray === ni) S.tray = '';
    if (ni && !owns(ni)) S.own[ni] = Date.now(); // (an old way in: Fetch it from the cupboard)
    if (was && !now) { if (wi && owns(wi) && roomLive()) S.tray = wi; changed('eject', wi); }
    else { changed('insert', ni); if (!fromRoom) nudge(); }
    fromRoom = false;
    syncCD(wi, ni);
  }
  setInterval(pollD, 350);
  function nudge() {
    if (nudged || S.seen.nudge >= 3 || !window.BootDone) return; nudged = true;
    S.seen.nudge = (S.seen.nudge | 0) + 1; save();
    setTimeout(() => toast('Psst...', 'Your discs are on the shelf by the PC, in your room. Stand up (Start > Shut Down) and you can put them in the tray for real.', 7000), 1500);
  }
  // the CD Player keeps its own disc: keep it in step with drive D:
  const CDMAP = { gubbinz: 'pm.gub', mix: 'pm.mix' };
  let cdWas = null;
  function cdApi() { try { const c = window.Carta && Carta.api && Carta.api.cd; return c && c.alive && c.alive() ? c : null; } catch (e) { return null; } }
  function syncCD(wi, ni) {
    const c = cdApi(); if (!c) return;
    const has = c.state.disc && CDMAP[c.state.disc.id];
    if (wi && has === wi && ni !== wi) { const b = document.querySelector('.ct-cd-body [data-b=eject], .ct-c [data-b=eject]'); if (b && !c.state.reading) { cdWas = null; b.click(); } }
  }
  setInterval(() => {
    const c = cdApi(); if (!c) { cdWas = null; return; }
    const id = c.state.disc ? c.state.disc.id : null;
    if (id === cdWas) return; const prev = cdWas; cdWas = id;
    const want = CDMAP[id];
    if (want && D.drive !== want && owns(want)) { fromRoom = true; D.insert(want, () => {}, { quiet: true, room: true }); }
    else if (!id && prev && CDMAP[prev] && D.drive === CDMAP[prev]) D.eject();
  }, 700);

  // ================================================================ putting things in, taking them out
  function mayInsert(id, o) {
    if (o && o.room) return true;
    const it = discItem(id);
    if (!it || owns(it) || !(D.BOX[it] || MINE[it] || /^pm\.mag/.test(it))) return true;
    sfx('uhoh');
    const t = (item(it) || {}).title || id;
    msg('Drive D:', `You haven't got ${t}.\n\nIt isn't on your shelf, so it can't go in the drive. (You can't put a disc you haven't got in a CD-ROM drive. Dave tried.)\n\n${D.BOX[it] && SHOP.includes(it) ? 'You could order it from the Pixel Post catalogue...' : ''}`, 'warn', D.BOX[it] && SHOP.includes(it) ? [['Look in the catalogue', () => catalogue(it)], ['OK']] : [['OK']]);
    return false;
  }
  function insert(id, o) {
    o = o || {};
    const it = item(id); if (!it || !owns(id)) return false;
    if (it.a) return insertA(id, o);
    if (it.kind === 'cart') { D.insert('n64'); return false; }
    if (S.tray === id) S.tray = '';
    fromRoom = !!o.room;
    const q = o.quiet != null ? o.quiet : !(document.body && document.body.classList.contains('online')); // (PC off: it's just in the drive. On: AutoPlay)
    D.insert(it.disc, q ? () => {} : null, { quiet: q, room: true });
    pollD();
    return true;
  }
  const pcOn = () => !!(document.body && document.body.classList.contains('online')) && !roomLive();
  function ejectD() { if (!D.drive) return false; D.eject(); pollD(); return true; }
  function take(id) { if (S.tray === id) { S.tray = ''; changed('tray', id); } }
  function insertA(id, o) {
    if (!S.fl[id] && id !== 'gquest') return false;
    const was = S.a; S.a = id; changed('insertA', id);
    if (was && was !== id) emit('change', 'ejectA', was);
    sfx('thud');
    if (!(o && o.quiet) && pcOn()) toast('Drive A:', `Clunk. ${labelA(id)} is in drive A:. Open My Computer to look on it.`, 4000);
    return true;
  }
  function ejectA() { if (!S.a) return false; const was = S.a; S.a = ''; changed('ejectA', was); sfx('click'); return true; }
  const labelA = id => { const it = item(id); return it ? (it.label ? '"' + it.label + '"' : 'The blank floppy') : 'A floppy'; };

  // ================================================================ drive A: in My Computer
  function floppyFiles(id) {
    if (id === 'gquest') return [['QUEST.EXE', 'exe', '338 KB', () => (window.Setup && Setup.get('grotquest')) ? (Setup.has('grotquest') ? Setup.launch('grotquest') : Setup.install('grotquest', 'file')) : 0], ['README.TXT', 'txt', '1 KB', notepad('README.TXT', 'THE TEXT ADVENTURE v1.2\n\nYou are standing in a dark room. There is a floppy disk here.\n> TAKE DISK\nTaken.\n\nSHAREWARE - PLEASE COPY!\n')]];
    const f = S.fl[id]; if (!f) return [];
    if (f.k === 'dl') { const p = window.Setup && Setup.get(f.pid); return p ? [[Setup.setupFile(p).toUpperCase(), 'exe', Setup.kbStr(Math.min(p.kb, 1400)), () => Setup.install(f.pid, 'file')], ['README.TXT', 'txt', '1 KB', notepad('README.TXT', `${p.n}\n${'='.repeat(p.n.length)}\n\nSaved off JackNet onto this floppy so I don't have to download it AGAIN (it took ages and Mom picked up the phone twice).\n\nTo put it back on the PC: run ${Setup.setupFile(p).toUpperCase()}.\n`)]] : []; }
    if (f.k === 'dave') return [['README.TXT', 'txt', '1 KB', notepad('README.TXT', 'THIS IS DAVE\'S DISK\n\nIf found please return to DAVE.\nIf you are Jack: DON\'T LOOK ON IT.\n\nYou looked, didn\'t you.\n')], ['HOMEWRK.TXT', 'txt', '1 KB', notepad('HOMEWRK.TXT', 'Science homework\n\nThe heart is a pump. It pumps blood. The end.\n\n(Mr ' + (window.Cast ? Cast.first('teacher') : 'Hughes') + ' said "more detail please". There is no more detail.)\n')], ['LEVEL1.LOB', 'txt', '2 KB', notepad('LEVEL1.LOB', 'DAVE\'S LEVEL\n\n##############\n#            #\n#  WALL      #\n#            #\n##############\n\nit is a wall. it is a very good wall.\n')]];
    if (f.k === 'gcse') return [['ENGLISH.DOC', 'txt', '24 KB', notepad('ENGLISH.DOC', 'GCSE ENGLISH COURSEWORK - "A Day I Will Never Forget"\n(draft 3) (FINAL) (actually final) (FINAL FINAL)\n\nIt was a dark and stormy night. Actually it was a Tuesday. I was playing my ULTRA 64 when\n\n[that is as far as I have got. Due Friday.]\n')], ['GEOG.DOC', 'txt', '8 KB', notepad('GEOG.DOC', 'Geography: rivers.\n\nRivers start at the top and go to the bottom. They have meanders.\n\n(I drew a meander in Paint. It looks like a worm.)\n')], ['BACKUP.TXT', 'txt', '1 KB', notepad('BACKUP.TXT', 'I am backing up my coursework onto this floppy. There is only one copy of this floppy.\n\nThis is fine.\n')]];
    if (f.k === 'boot') return [['COMMAND.COM', 'exe', '93 KB', () => msg('A:\\COMMAND.COM', 'This is the JackOS 98 Startup Disk. Keep it somewhere safe, in case the PC won\'t start. (It will always start. Probably.)', 'info')], ['IO.SYS', 'txt', '218 KB', notepad('IO.SYS', 'MZ......(this is a system file. It looks like this to everyone.)')], ['README.TXT', 'txt', '13 KB', notepad('README.TXT', 'JACKOS 98 STARTUP DISK\n\nIf JackOS will not start, leave this disk in drive A: and switch on.\n')]];
    return [];
  }
  function floppyWin(id) {
    const files = floppyFiles(id), it = item(id);
    const body = document.createElement('div');
    body.className = 'pmd-fx';
    body.innerHTML = `<div class="field pmd-fxl">${files.length ? files.map((f, i) => `<button type="button" class="pmd-fxi" data-i="${i}"><span>${A.ICON[f[1] === 'exe' ? 'exe' : f[1] === 'dir' ? 'folder' : 'txt'] || ''}</span><span>${esc(f[0])}</span></button>`).join('') : '<div class="pmd-fxe">This disk is empty.<br><small>(1.44 MB free. All of it.)</small></div>'}</div>`;
    const w = A.win(`${it && it.label ? it.label.slice(0, 22) : 'Untitled'} (A:)`, body, { w: 380, h: 250, status: true, minW: 240, minH: 150, icon: (A.ICON.floppy || '') });
    if (w.status) w.status.textContent = `${files.length} object(s)    3½ Floppy (A:)`;
    let lastI = -1, lastT = 0;
    body.querySelectorAll('.pmd-fxi').forEach(e => e.addEventListener('click', () => {
      body.querySelectorAll('.pmd-fxi').forEach(x => x.classList.toggle('sel', x === e));
      const i = +e.dataset.i, now = Date.now();
      if (matchMedia('(hover:none)').matches || (i === lastI && now - lastT < 450)) { lastT = 0; sfx('click'); files[i][3](); } else { lastT = now; lastI = i; }
    }));
    return w;
  }
  A.register('pm.floppy', { open: id => floppyWin(id || S.a) });
  const touch = () => matchMedia('(hover:none)').matches;
  const fxName = it => ((it.querySelector('.fx-lb, .fx-nm span') || it).textContent || '').trim();
  let aLast = 0, aEl = null;
  document.addEventListener('click', ev => {
    const it = ev.target.closest && ev.target.closest('.fxwin .fx-it'); if (!it || !S.a) return;
    if (!/^3\u00bd Floppy \(A:\)$/.test(fxName(it))) return;
    const now = Date.now();
    if (touch() || (aEl === it && now - aLast < 450)) { ev.stopPropagation(); ev.preventDefault(); aLast = 0; floppyWin(S.a); }
    else { aLast = now; aEl = it; }
  }, true);
  document.addEventListener('submit', ev => {
    const f = ev.target; if (!f || !f.matches || !f.matches('.fxwin .fx-addr') || !S.a) return;
    const v = (f.querySelector('input') || {}).value || '';
    if (/^\s*a:\\?\s*$/i.test(v)) { ev.preventDefault(); ev.stopPropagation(); floppyWin(S.a); }
  }, true);
  // Eject on the right-click menu of A: and D: in My Computer
  let ctxDrive = null;
  document.addEventListener('contextmenu', ev => {
    ctxDrive = null;
    const it = ev.target.closest && ev.target.closest('.fxwin .fx-it'); if (!it) return;
    const n = fxName(it);
    if (/\(A:\)$/.test(n)) ctxDrive = { d: 'A', ts: Date.now() }; else if (/\(D:\)$/.test(n)) ctxDrive = { d: 'D', ts: Date.now() };
  }, true);
  if (window.IE && IE.menu) {
    const menu0 = IE.menu;
    IE.menu = function (items, x, y, level) {
      try {
        if (!level && ctxDrive && Date.now() - ctxDrive.ts < 1500 && Array.isArray(items) && !items.some(i => i && i.label === 'Eject')) {
          const d = ctxDrive.d; ctxDrive = null;
          const full = d === 'A' ? !!S.a : !!D.drive;
          items = items.slice(); items.splice(Math.min(1, items.length), 0, { label: 'Eject', dis: !full, act: () => d === 'A' ? ejectA() : ejectD() }, '-');
        }
      } catch (e) { console.error(e); }
      return menu0.call(this, items, x, y, level);
    };
  }
  A.cmd(['eject a:', 'eject a'], () => ejectA() || toast('Drive A:', 'There\'s no floppy in drive A:.', 3000));

  // ================================================================ new things turning up
  // downloads: "saved to a floppy" (one floppy per program)
  document.addEventListener('setup', ev => {
    const d = ev.detail || {}; if (!d.on || !window.Setup) return;
    const p = Setup.get(d.id); if (!p || p.nodl || p.disc || p.k !== 'web' || p.tb || Setup.fresh(d.id)) return;
    if (Object.values(S.fl).some(f => f.pid === d.id)) return;
    const n = Object.values(S.fl).filter(f => f.k === 'dl').length;
    if (n >= 60) return;
    const lab = biro(p.n);
    addFloppy({ k: 'dl', pid: d.id, lab });
    if (!S.seen.dlTip) { S.seen.dlTip = 1; save(); setTimeout(() => toast('Saved to floppy', `You copied ${p.n} onto a floppy disk, so you never have to download it again. It's in the floppy box on your desk (in your room).`, 7000), 2500); }
  });
  function biro(n) { // how Jack would write it on the label
    let s = String(n).replace(/ \(.*\)$/, '').replace(/\s+v?\d+(\.\d+)*[a-z]?$/i, '').toUpperCase();
    if (s.length > 20) s = s.slice(0, 19) + '.';
    return s + ['', '!!', ' (GOOD)', ' - KEEP', '', ' :)', ''][s.length % 7];
  }
  // the JackOS Startup Disk (Add/Remove Programs > Startup Disk) uses up a blank floppy; back issues of the mag
  const sec0 = A.secret;
  A.secret = function (id) {
    const r = sec0.apply(this, arguments);
    try {
      if (id === 'setup.bootdisk' && !Object.values(S.fl).some(f => f.k === 'boot')) {
        const blank = Object.keys(S.fl).find(k => S.fl[k].k === 'blank');
        if (blank) { S.fl[blank] = Object.assign(S.fl[blank], { k: 'boot', lab: 'JACKOS 98 STARTUP DISK' }); changed('own', blank); } else addFloppy({ k: 'boot', lab: 'JACKOS 98 STARTUP DISK', c: 0 });
      }
    } catch (e) {}
    return r;
  };
  if (A.apps && A.apps['ssn.disc']) { // opening a month's cover CD: that issue is yours now (the mag arrives with its disc)
    const sd = A.apps['ssn.disc'], open0 = sd.open;
    sd.open = function (arg) {
      const m = (typeof arg === 'number' ? arg : +arg) + 1;
      // A digital cover-CD menu is not a physical magazine purchase.
      return open0.apply(this, arguments);
    };
  }

  // ================================================================ mail order: Pixel Post (Rupees, members; js/pm-cat.js + mods/pmx.js)
  const CAT = window.PMCat || { ITEMS: [], byId: {}, DAYMAX: 3, out: () => true };
  try { CAT.addCarts(window.RoomCat); } catch (e) {}
  const SHOP = CAT.ITEMS.map(x => x.id);
  const PRICE = {}; CAT.ITEMS.forEach(x => { PRICE[x.id] = x.price; });
  const md99 = () => SRV.md || today().md;
  const isOut = x => CAT.out(x, md99());
  const titleOfShop = id => { const b = D.BOX[id]; try { return b ? D.titleOf(b) : (CAT.byId[id] || {}).title || id; } catch (e) { return (CAT.byId[id] || {}).title || id; } };
  function hardwareArt(x) {
    const palettes={n64:['#173431','#173d80','#f8c742','FOUR PORTS. NO ARGUMENTS.'],ps:['#f0e9d6','#b9b6ae','#284d77','A WHOLE NEW PLAY SPACE.'],md:['#25232c','#202127','#d14839','SIXTEEN BITS. ALL ATTITUDE.'],dc:['#173d86','#efeee8','#f49736','DREAM BIG. PLAY LATE.']};
    const [bg,body,accent,slogan]=palettes[x.console]||palettes.n64;
    const machine=x.console==='md'
      ?'<ellipse cx="100" cy="150" rx="74" ry="28" fill="#101216" stroke="#777"/><ellipse cx="100" cy="139" rx="74" ry="25" fill="#292b30" stroke="#777"/><ellipse cx="103" cy="136" rx="37" ry="17" fill="#141519" stroke="#a39a89"/><path d="M76 129H129V135H76Z" fill="#050608"/><text x="103" y="149" text-anchor="middle" fill="#bc9d60" font-family="Arial" font-size="12">16 BIT</text>'
      :`<path d="M27 126L145 108L179 140L62 160Z" fill="${body}" stroke="#84868b"/><path d="M27 126V150L62 185V160ZM62 160L179 140V165L62 185Z" fill="${x.console==='n64'?'#171a21':'#8e908f'}" stroke="#555b64"/>${x.console==='n64'?'<path d="M66 132L118 124L128 131L76 139Z" fill="#0b1016" stroke="#777c80"/><path d="M67 166L77 164V171L67 173ZM90 162L100 160V167L90 169ZM113 158L123 156V163L113 165ZM136 154L146 152V159L136 161Z" fill="#080b11"/>':x.console==='ps'?'<ellipse cx="104" cy="134" rx="30" ry="11" fill="none" stroke="#777c80" stroke-width="2"/><circle cx="53" cy="137" r="5" fill="#777b7b"/><path d="M77 166L89 164V171L77 173ZM132 157L144 155V162L132 164Z" fill="#090e14"/>':'<path d="M71 129Q100 106 136 128Q141 143 111 151Q77 154 71 129Z" fill="#f5f2e8" stroke="#999"/><path d="M92 133Q107 118 120 132Q122 142 108 140Q99 137 108 132" fill="none" stroke="#ed7833" stroke-width="3"/><path d="M77 166L87 164V171L77 173ZM94 163L104 161V168L94 170ZM111 160L121 158V165L111 167ZM128 157L138 155V162L128 164Z" fill="#343739"/>'}`;
    return `<svg viewBox="0 0 200 270" role="img" aria-label="${esc(x.title)} boxed console"><rect width="200" height="270" fill="${bg}"/><path d="M0 78L200 42V64L0 100ZM0 203L200 167V179L0 215Z" fill="${accent}" opacity=".25"/><rect x="0" y="0" width="200" height="8" fill="${accent}"/><text x="12" y="28" fill="${accent}" font-family="Arial" font-weight="bold" font-size="9">PIXEL POST • BOXED HARDWARE</text><text x="12" y="62" fill="${x.console==='ps'?'#293e52':'#fff5d6'}" font-family="Arial" font-weight="bold" font-size="28">${esc(x.title)}</text><ellipse cx="100" cy="181" rx="77" ry="13" fill="#050a11" opacity=".3"/>${machine}<rect x="8" y="207" width="184" height="25" fill="${accent}"/><text x="100" y="223" text-anchor="middle" fill="#101b2c" font-family="Arial" font-weight="bold" font-size="10">${slogan}</text><text x="100" y="247" text-anchor="middle" fill="${x.console==='ps'?'#293e52':'#fff5d6'}" font-family="Arial" font-size="8.7">CONSOLE • CONTROLLER • TV LEADS</text><text x="100" y="262" text-anchor="middle" fill="${accent}" font-family="Courier New" font-size="9">DELIVERED TO YOUR DOOR</text></svg>`;
  }
  const shopArt = x => {
    if(x.kind==='mag')return '<img alt="'+esc(x.title)+' cover" src="art/magazines-v1/'+esc(window.MagazineCat.byId[x.id].art)+'.webp" style="width:100%;height:100%;object-fit:contain">';
    if(x.kind==='hardware')return hardwareArt(x);
    const b=D.BOX[x.id];if(b)return D.front(b);
    try{return window.PMArt?PMArt.cartArt(x):''}catch(e){return ''}
  };
  // a console game that came by post: Agent L's find (rm-cat.js FINDS, spot 'mail') is what makes it playable
  function grantCart(id) {
    if(ls('jhp_starter')==='1')return; // Purchase ownership supplies the physical game; no discovery reward.
    try { const F = window.RoomCat && RoomCat.FIND && RoomCat.FIND[id]; if (!F) return; if (window.Room && Room._ && Room._.foundIt) { if (!Room.found(id)) Room._.foundIt(F); return; }
      const st = JSON.parse(localStorage.getItem('jhp_rm') || '{}'); st.f = st.f || {}; if (!st.f[id]) { st.f[id] = Date.now(); localStorage.setItem('jhp_rm', JSON.stringify(st)); try { if (window.Net && Net.me && Net.me.member) Net.send({ t: 'rmFind', id }); } catch (e) {} }
    } catch (e) {}
  }
  function parcels() { return SRV.member ? SRV.orders.filter(o => !S.opened[o.no]).map(o => o.id) : []; }
  let waiters = [];
  function order(id) {
    return new Promise(res => {
      if (!window.Net || !Net.me || !Net.me.member) return res({ err: 'Ordering is for JackNet members. Joining is FREE: Start > Log Off, then pick a name and a password!' });
      if (owns(id)) return res({ err: 'You\'ve already got that one! It\'s on your shelf.' });
      waiters.push(res); Net.send({ t: 'pmxOrder', id });
      setTimeout(() => { const i = waiters.indexOf(res); if (i >= 0) { waiters.splice(i, 1); res({ err: 'The order line is engaged. (Somebody\'s on the Internet.) Try again in a minute.' }); } }, 9000);
    });
  }
  function net() {
    if (!window.Net) return;
    Net.on('pmxMe', m => {
      SRV.ok = true; SRV.member = !m.guest; SRV.orders = Array.isArray(m.orders) ? m.orders : []; SRV.today = m.today | 0; SRV.max = m.max || CAT.DAYMAX; SRV.bal = m.bal | 0; SRV.md = m.md || 0;
      // (anything bought shows on the shelf; a parcel that's waiting is a parcel)
      changed('server');
      const n = parcels().length;
      if (n && !S.seen.postHint) { S.seen.postHint = Date.now(); save(); setTimeout(() => toast('You\'ve got post!', n > 1 ? `${n} parcels are waiting by the front door.` : 'A parcel is waiting for you by the front door. (Mom put it by the front door.)', 7000), 3000); }
      collector();
    });
    Net.on('pmxOrdered', m => {
      const o = m.order; if (!o) return;
      if (!SRV.orders.some(x => x.no === o.no)) SRV.orders.push(o);
      SRV.today = m.today | 0; SRV.bal = m.bal | 0;
      const w = waiters.shift(); if (w) w({ ok: true, order: o });
      A.secret('pm.order');
      arrive(o);
      changed('parcel', o.id); collector();
    });
    Net.on('pmxErr', m => { const w = waiters.shift(); if (w) w({ err: m.msg }); });
    const ask = () => { try { Net.send({ t: 'pmxMe' }); } catch (e) {} };
    Net.on('welcome', ask); Net.on('loginOk', ask);
    try { if (Net.me && Net.me.id) ask(); } catch (e) {}
  }
  function collector() { if (SRV.orders.length >= 5) A.secret('pm.collector'); }
  // the parcel arrives (straight away): the doorbell, Mom shouting up the stairs, an e-mail from Pixel Post
  function arrive(o) {
    const t = titleOfShop(o.id);
    sfx('join');
    const lines = [`DING DONG! ... Mom: "JACK! PARCEL FOR YOU! I've signed for it. It's by the front door."`, `The postie's been! Mom: "JAAACK! Another parcel! What have you bought NOW?" (It's by the front door.)`, `Knock knock. Mom: "Jack, the postman says this is the third parcel this week." (It's by the front door.)`];
    const say = lines[(SRV.orders.length + 2) % lines.length];
    try { if (window.Room && Room.say && roomLive()) Room.say('Ding dong!', say, 6000); } catch (e) {}
    toast('Ding dong!', say.replace(/^DING DONG! \.\.\. /, ''), 7000);
    try {
      if (window.JackFiles && JackFiles.deliver) JackFiles.deliver({ from: 'Pixel Post Orders <orders@pixelpost.jnet>', to: ((Net.me && Net.me.nick) || 'Jack') + ' <me@jacknet.jnet>', subj: `Your Pixel Post order ${o.no} has been delivered!`,
        body: `Dear ${(Net.me && Net.me.nick) || 'customer'},\r\n\r\nThank you for ordering from PIXEL POST, the games people!\r\n\r\nORDER NUMBER: ${o.no}\r\nITEM:         ${t} (boxed)\r\nPRICE:        ${o.price} Rupees\r\nP&P:          FREE!\r\n\r\nYour parcel has been delivered and signed for (by "MOM").\r\nIt is waiting for you by the front door.\r\n\r\nPlease allow 28 days for delivery. (It already came. Our van is very fast.)\r\n\r\nThe Pixel Post Team\r\nwww.pixelpost.jnet\r\n` });
    } catch (e) {}
  }
  function openParcel(id, physical=false) {
    if(!physical){toast('Pixel Post',window.PCOnly?.desktopOnly?'Your parcel is by the front door. Unbox it in the house when you play on a desktop or laptop.':'Your parcel is by the front door. Stand up, go downstairs and press F to unbox it.',6000);return null;}
    const L = SRV.orders.filter(o => !S.opened[o.no]); const o = id ? L.find(x => x.id === id) || L[0] : L[0]; if (!o) return null;
    S.opened[o.no] = Date.now(); A.secret('pm.post');
    if (/^cart\./.test(o.id)) grantCart(o.id);
    if (!S.seen.parcelDay) { S.seen.parcelDay = 1; A.secret('pm.parcelday'); }
    changed('parcel', o.id);
    return o.id;
  }

  // the catalogue: www.pixelpost.jnet (and the paper one in the room: js/pm-gl.js)
  const HOST = 'www.pixelpost.jnet';
  function catalogue(hl) {
    const br = document.getElementById('browser'); if (br) br.classList.remove('min');
    IE.navigate('http://' + HOST + '/');
    if (hl) setTimeout(() => { const e = document.querySelector('#s-secret [data-pp="' + hl + '"]'); if (e) e.scrollIntoView({ block: 'center' }); }, 300);
  }
  const fmtDate = r => { const [d, m] = String(r).split('/').map(Number); return d + ' ' + MONTHS[m - 1]; };
  function card(x) {
    const b = D.BOX[x.id], have = owns(x.id), out = isOut(x), mine = SRV.orders.find(o => o.id === x.id);
    const art = shopArt(x) || `<svg viewBox="0 0 200 270"><rect width="200" height="270" fill="#555"/></svg>`;
    const waiting=!!mine&&!S.opened[mine.no];
    const legacy=ls('jhp_starter')!=='1';
    const alias=legacy&&x.kind==='mag'&&Object.keys(window.MagazineCat?.LEGACY_ALIASES||{}).find(id=>MagazineCat.LEGACY_ALIASES[id]===x.id);
    const physicalId=x.kind==='hardware'?x.console:alias||'pmb.'+x.id;
    let saved;try{saved=window.Apps?.loadGame('hs.things',1)?.t?.[physicalId]}catch(e){}
    const thing=window.House?.THINGS?.[physicalId]||(saved?{at:{room:saved[0]},snap:saved[5]}:null);
    const room=thing?.at?.room;
    const location=thing?.st==='held'?'IN YOUR HANDS':x.kind==='hardware'?(legacy||thing?.snap==='hardware.dock.'+x.console?'CONNECTED TO YOUR TELLY':room==='hall'?'UNBOXED — IN THE HALL':room==='bedroom'?'UNBOXED — IN YOUR ROOM':'UNBOXED — IN THE HOUSE'):x.kind==='mag'?(room==='hall'?'UNBOXED — IN THE HALL':room&&room!=='bedroom'?'IN THE HOUSE':String(thing?.snap||'').startsWith('reading.slot.')?'ON YOUR BOOKSHELF':'IN YOUR ROOM'):'ON YOUR SHELF';
    const lend = b && b.owner ? ` <span class="ppo-lent">(you've got ${esc(b.owner)}'s)</span>` : '';
    return `<div class="ppo-it${have ? ' have' : ''}${out ? '' : ' soon'}" data-pp="${esc(x.id)}">${x.tag && out ? `<span class="ppo-flag ${x.tag}">${{ new: 'NEW IN!', hot: 'HOT!', budget: 'BUDGET' }[x.tag] || ''}</span>` : ''}<div class="ppo-art">${art}</div><div class="ppo-tx"><b>${esc(titleOfShop(x.id))}</b><small>${esc(x.blurb)}</small>
      <span class="ppo-pr">${x.price} <i class="ppo-rp"></i> Rupees</span>${waiting ? `<span class="ppo-got">&#9993; DELIVERED (order ${esc(mine.no)}): it's by the front door, waiting to be opened!</span>` : have ? `<span class="ppo-got">&#10004; ${location}${mine ? ' (order ' + esc(mine.no) + ')' : ''}${lend}</span>` : !out ? `<span class="ppo-soon">COMING SOON: in the shops ${esc(fmtDate(x.rel))}</span>` : `<button type="button" class="ppo-buy" data-buy="${esc(x.id)}">ORDER IT</button>`}</div></div>`;
  }
  function shopPage() {
    const el = document.createElement('div'); el.className = 'ppo';
    let flash = '';
    const draw = () => {
      const member = !!(window.Net && Net.me && Net.me.member), L = CAT.ITEMS.slice();
      const newIn = L.filter(x => isOut(x) && x.tag === 'new'), soon = L.filter(x => !isOut(x)), rest = L.filter(x => isOut(x) && x.tag !== 'new');
      const n = parcels().length;
      el.innerHTML = `<div class="ppo-top"><div class="ppo-logo">PIXEL<b>POST</b></div><div class="ppo-tag">Games, consoles & magazines by mail order &middot; every game boxed, with the manual &middot; FREE P&amp;P &middot; Est. 1994</div></div>
        <div class="ppo-strip"><marquee scrollamount="4">*** ORDER ONLINE WITH RUPEES *** SAME-DAY DELIVERY (IT'S QUICKER IN JACKNET) *** NO SECONDHAND DISCS *** ${CAT.DAYMAX} ORDERS A DAY PER CUSTOMER (MOM'S RULES) ***</marquee></div>
        ${flash ? `<div class="ppo-note ok">${flash}</div>` : ''}
        ${member ? `<div class="ppo-acct"><span>Customer: <b>${esc(Net.me.nick)}</b></span><span>Your Rupees: <b>${SRV.bal}</b></span><span>Orders today: <b>${SRV.today} of ${SRV.max}</b></span>${n ? `<span class="ppo-wait">&#9993; ${n} parcel${n > 1 ? 's' : ''} waiting by the front door!</span>` : ''}</div>`
          : '<div class="ppo-note">You need to be a <b>JackNet member</b> to order (we take Rupees, and the Rupees live in your JackNet account). Joining is FREE: Start &gt; Log Off, then pick a name and a password!</div>'}
        ${newIn.length ? `<h3 class="ppo-h">NEW IN THIS MONTH</h3><div class="ppo-grid">${newIn.map(card).join('')}</div>` : ''}
        <h3 class="ppo-h">THE CATALOGUE</h3><div class="ppo-grid">${rest.map(card).join('')}</div>
        ${soon.length ? `<h3 class="ppo-h">COMING SOON</h3><div class="ppo-grid">${soon.map(card).join('')}</div>` : ''}
        <div class="ppo-ft">Pixel Post Ltd &middot; Unit 4, The Industrial Estate &middot; Prices in Rupees, P&amp;P free &middot; Goods signed for at the door are deemed delivered (Mom signs for everything) &middot; No refunds: once it's opened, it's yours &middot; <a href="http://www.sharewareshack.netz/">Want it free? Try shareware!</a></div>`;
      el.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.buy, x = CAT.byId[id], t = titleOfShop(id);
        if (!member) return msg('Pixel Post', 'You need to be a JackNet member to order.\n\nJoining is FREE: Start > Log Off, then pick a name and a password!', 'info');
        msg('Pixel Post', `Order ${t} for ${x.price} Rupees?\n\nIt comes boxed, with the manual. Delivery: straight away.`, 'q', [['Order it', () => {
          b.disabled = true; b.textContent = 'RINGING...'; sfx('modem');
          order(id).then(r => {
            if (r.err) { msg('Pixel Post', r.err, 'warn'); draw(); return; }
            flash = `&#10004; Thank you! Order <b>${esc(r.order.no)}</b>: ${esc(t)}. Your parcel has been delivered. It's by the front door! (Go and open it: stand up from the PC.)`;
            draw();
          });
        }], ['Cancel']]);
      }));
    };
    draw();
    const off = on2('change', () => { if (!el.isConnected) return off(); draw(); });
    return el;
  }
  net();
  if (window.IE && IE.addSite) IE.addSite(HOST, { title: 'Pixel Post - games by mail order', desc: 'Boxed PC games by post, paid in Rupees.', cat: 'games', pages: { '/': { title: 'Pixel Post - games by mail order', html: shopPage } } });

  // ================================================================ the fallback on the PC: "lean back and grab a disc"
  // (the real way is in the room: the games shelf by the PC. This is for phones, or when you can't be bothered to stand up.)
  const WHERE = { D: 'in drive D:', A: 'in drive A:', tray: 'on the CD tray', shelf: 'on the shelf' };
  const KN = { box: 'Games', jewel: 'Games & CDs', sleeve: 'Games & CDs', cdr: 'Games & CDs', cart: 'Games & CDs', mag: 'Mags & cover CDs', floppy: 'Floppy disks' };
  function grabWin() {
    A.secret('disc.cupboard');
    const body = document.createElement('div'); body.className = 'pmd-gw';
    const w = A.win('Lean Back and Grab a Disc', body, { w: 430, h: 470, status: true, minW: 280, minH: 300, icon: A.ICON.cdrom || '', onClose: () => { off(); } });
    let sel = '';
    function draw() {
      if (w.closed) return;
      const L = items(), groups = {};
      L.forEach(x => { (groups[KN[x.kind] || 'Other'] = groups[KN[x.kind] || 'Other'] || []).push(x); });
      const dIt = item(discItem(D.drive)), aIt = item(S.a);
      body.innerHTML = `<div class="pmd-gw-tip"><b>Your discs are on the shelf behind you.</b> Press Q or F2 to stand up; the PC stays on. E picks up a PC game case and F takes out its disc. Aim at the highlighted PC tray and press E to insert it. Or choose a disc here:</div>
        <div class="pmd-gw-dr"><div><b>D:</b> ${dIt ? esc(dIt.title) : '<i>empty</i>'} <button type="button" class="btn" data-e="D"${D.drive ? '' : ' disabled'}>Eject</button></div><div><b>A:</b> ${aIt ? esc(aIt.label || 'blank floppy') : '<i>empty</i>'} <button type="button" class="btn" data-e="A"${S.a ? '' : ' disabled'}>Eject</button></div></div>
        <div class="field pmd-gw-l">${Object.keys(groups).map(g => `<div class="pmd-gw-g">${esc(g)}</div>` + groups[g].map(x => `<button type="button" class="pmd-gw-i${sel === x.id ? ' sel' : ''}" data-id="${esc(x.id)}"><span class="pmd-gw-ic pmd-ic-${x.kind}" style="--a:${x.c1 || '#888'};--b:${x.c3 || '#444'}"></span><span class="pmd-gw-n">${esc(x.kind === 'floppy' ? (x.label || 'Blank floppy disk') : x.title)}</span><span class="pmd-gw-w">${esc(WHERE[x.where])}</span></button>`).join('')).join('')}</div>
        <div class="pmd-gw-b"><button type="button" class="btn" data-a="in" ${sel ? '' : 'disabled'}>Put it in the drive</button><button type="button" class="btn" data-a="rd" ${sel && item(sel) && (item(sel).box || MINE[sel]) ? '' : 'disabled'}>Read Me</button><button type="button" class="btn" data-a="cat">Order games...</button>${parcels().length ? '<span>Parcel waiting by the front door</span>' : ''}</div>`;
      if (w.status) w.status.textContent = `${L.length} things   ${parcels().length ? 'A parcel is waiting!' : ''}`;
      body.querySelectorAll('.pmd-gw-i').forEach(b => b.addEventListener('click', () => { sfx('click'); const was = sel; sel = b.dataset.id; if (was === sel && !touch()) put(); draw(); }));
      body.querySelectorAll('[data-e]').forEach(b => b.addEventListener('click', () => { b.dataset.e === 'A' ? ejectA() : ejectD(); }));
      const act = { in: put, rd: () => { const it = item(sel); if (!it) return; if (it.box) Desk.notepad('README.TXT', D.readmeText(it.box)); else Desk.notepad('README.TXT', `${it.title}\n\n${it.blurb || ''}`); }, cat: () => catalogue(), pk: () => { const id = openParcel(); if (id) { sfx('solve'); msg('A parcel!', `You rip open the parcel. It's ${D.titleOf(D.BOX[id])}!\n\nThe box is on your shelf now, by the PC.`, 'info'); } } };
      body.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => act[b.dataset.a]()));
    }
    function put() {
      const it = item(sel); if (!it) return;
      if (it.kind === 'cart') return D.insert('n64');
      if (it.where === (it.a ? 'A' : 'D')) return it.a ? floppyWin(it.id) : (D.EXT[D.drive] ? D.EXT[D.drive].autorun() : D.autorun(D.drive));
      if (!S.seen.lean) { S.seen.lean = 1; save(); toast('*stretch*', 'You lean right back on your chair and grab it off the shelf. (Careful. Mom says you\'ll break the chair.)', 4500); }
      insert(it.id, { quiet: false });
    }
    const off = on2('change', () => setTimeout(draw, 0));
    draw();
    if (innerWidth < 700) w.el.classList.add('maxwin');
    return w;
  }
  function on2(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); return () => { EVS[ev] = EVS[ev].filter(f => f !== fn); }; }
  // the old Games Cupboard (a 2D shelf inside the PC) is gone: its icon and Run commands open this instead
  A.register('discs.cupboard', { single: true, cmd: ['cupboard', 'discs', 'games cupboard', 'gamescupboard', 'mydiscs', 'my discs', 'grab'], open: grabWin });
  A.cmd(['pixelpost', 'mail order', 'catalogue'], () => catalogue());
  const relabel = () => { const ic = document.getElementById('dgIconCupboard'); if (!ic) return; const t = [...ic.querySelectorAll('span,div,label')].find(e => /Games Cupboard/.test(e.textContent) && !e.children.length); if (t) t.textContent = 'My Discs'; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(relabel, 0)); else setTimeout(relabel, 0);

  [['shelf', 'The real shelf', 'Pick a game box up off the shelf in your room'],
    ['open', 'Shiny side down', 'Open a box in your room and take the disc out'],
    ['tray', 'Whirr, click', 'Put a disc in the PC\'s CD tray with your own hands'],
    ['floppy', 'Clunk', 'Push a floppy disk into the PC'],
    ['order', 'Mail order', 'Order a game by post'],
    ['post', 'Rip!', 'Open a parcel'],
    ['coaster', 'Free coaster', 'Find a use for a trial CD'],
    ['mags', 'Back issues', 'Collect six issues of the mag'],
    ['floppies', 'Floppy hoarder', 'Have ten floppies in your floppy box'],
    ['parcelday', 'Parcel day', 'Open your first parcel from the postie'],
    ['collector', 'Mail-order addict', 'Order five games from the catalogue'],
    ['catalogue', 'Cover to cover', 'Read the whole Pixel Post catalogue'],
  ].forEach(([k, n, h]) => A.defineSecret('pm.' + k, n, h));
  on2('change', () => {
    try { if (Object.keys(S.fl).length >= 10) A.secret('pm.floppies'); if (Object.keys(S.own).filter(k => /^pm\.mag\./.test(k)).length >= 6) A.secret('pm.mags'); } catch (e) {}
  });

  window.PM = {
    items, item, owns, where, insert, insertA, ejectD, ejectA, take, mayInsert, grant, discItem, floppyFiles, openFloppy: floppyWin,
    on: on2, parcels, orders: () => SRV.orders.slice(), srv: SRV, openParcel, order, catalogue, CAT, shopArt, titleOfShop, roomLive, pcOn, labelA,
    get drive() { return D.drive; }, get driveA() { return S.a; }, get tray() { return S.tray; }, S, save, MONTHS, MON3, magOut, SHOP, PRICE, cast,
    _poll: pollD,
  };
})();
