/* Stamp Studio (carta pack, lazy-loaded by apps-carta.js): a silly, noisy kids' paint program.
 * Every tool makes a noise. The dynamite clears the screen. Mom says headphones. */
(function () {
  const C = window.Carta, A = window.Apps;
  if (!C || !A) return;
  const { h, esc, store } = C;
  const note = (f, d, t) => { try { Sound.note(f, d, t); } catch (e) {} };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const W = 640, H = 420;

  // ================================================================ stamps: 16x16 pixel strings, all original
  const PAL = { k: '#000', w: '#fff', g: '#3a9a2a', G: '#1f5e14', l: '#8ad84a', r: '#e10600', R: '#8a0000', y: '#ffd400', Y: '#b08a00', b: '#2a7ad8', B: '#0028c8', c: '#9fd0ff', o: '#ff8000', p: '#ff8ac0', n: '#7a4a1a', N: '#4a2a0a', a: '#9a9a9a', A: '#555', e: '#d8d8d8', s: '#f2c79a', m: '#c0187a', v: '#5b16c9', t: '#008080', u: '#fff3b0', d: '#e8e0c8' };
  const S = (name, rows) => ({ name, rows });
  const STAMPS = [
    S('Blobbit', ['..kk........kk..', '.krrk......krrk.', '..krkkkkkkkkrk..', '..krrrrrrrrrrk..', '.krrwwwrrwwwrrk.', '.krwwwkrrwwwkrk.', 'krrwwkkrrwwkkrrk', 'krprrrrrrrrrrprk', 'krrrkrrrrrrkrrrk', 'krrrrkkkkkkrrrrk', '.krrrrkppkrrrrk.', '..krrrrrrrrrrk..', '...kkrrrrrrkk...', '....kyyk.kyyk...', '...kyyyk.kyyyk..', '...kkkkk.kkkkk..']),
    S('Goblin', ['.......rr.......', '......rrrr......', '.....rrrrrr.....', '....rrrrrrrr....', '...yyyyyyyyyy...', 'Gg.gggggggggg.gG', '.gggwkggggwkggg.', '..ggggglllgggg..', '..gggggllllggg..', '..gkggggggggkg..', '...gkkwkkwkkg...', '....gkkkkkkg....', '.....gggggg.....', '....bbbbbbbb....', '...bbbbyybbbb...', '..gbbbbbbbbbbg..']),
    S('Star', ['.......yy.......', '.......yy.......', '......yyyy......', '......yyyy......', '.....yyyyyy.....', 'yyyyyyyyyyyyyyyy', '.yyyyyyyyyyyyyy.', '..yyyyyyyyyyyy..', '...yyyyyyyyyy...', '....yyyyyyyy....', '....yyyyyyyy....', '...yyyyyyyyyy...', '...yyyy..yyyy...', '..yyy......yyy..', '.yy..........yy.', 'y..............y']),
    S('Heart', ['..rrrr....rrrr..', '.rrrrrr..rrrrrr.', 'rrwwrrrrrrrrrrrr', 'rrwrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', '.rrrrrrrrrrrrrr.', '..rrrrrrrrrrrr..', '...rrrrrrrrrr...', '....rrrrrrrr....', '.....rrrrrr.....', '......rrrr......', '.......rr.......', '................', '................']),
    S('Rocket', ['.......rr.......', '......rrrr......', '.....rrrrrr.....', '.....eeeeee.....', '.....eeeeee.....', '.....ecccce.....', '.....ecccce.....', '.....eeeeee.....', '.....eeeeee.....', '....reeeeeer....', '...rreeeeeerr...', '..rrreeeeeerrr..', '.rrrr.eeee.rrrr.', '......oyyo......', '.....oyyyyo.....', '......o..o......']),
    S('Planet', ['.....ooooo......', '...ooooooooo....', '..oyooooooooo...', '.ooooyoooooooo..', '.oooooooooyooo..', 'ooooooooooooooo.', 'oooyoooooooooooy', 'ooooooooooooyyyy', 'yyyyyooooyyyy...', '.oyyyyyyyyoooo..', '.ooooooooooooo..', '..ooooooyoooo...', '...ooooooooo....', '.....ooooo......', '................', '................']),
    S('UFO', ['......eeee......', '.....ecccce.....', '....ecccccce....', '....ecccccce....', 'aaaaaaaaaaaaaaaa', 'aeeeeeeeeeeeeeea', 'aaaaaaaaaaaaaaaa', '.ayaraybarayara.', '..aaaaaaaaaaaa..', '....yy....yy....', '...yy......yy...', '................', '................', '................', '................', '................']),
    S('Alien', ['......gggg......', '....gggggggg....', '...gggggggggg...', '..gggggggggggg..', '..gkkkggggkkkg..', '..gkkkggggkkkg..', '...gggggggggg...', '....gggggggg....', '......gggg......', '....g.gggg.g....', '.....ggggggg....', '......gggg......', '.....gg..gg.....', '.....gg..gg.....', '....gg....gg....', '................']),
    S('Robot', ['......aa........', '.....aaaa.......', '...eeeeeeee.....', '...ebbbbbbe.....', '...ebrbbrbe.....', '...ebbbbbbe.....', '...ekkkkkke.....', '...eeeeeeee.....', 'a..eeeeeeee..a..', 'aaaeeyeeeyeeaaa.', 'a..eeeeeeee..a..', '...eeeeeeee.....', '...eee..eee.....', '...eee..eee.....', '..aaaa..aaaa....', '................']),
    S('Dinosaur', ['............gg..', '...........gggg.', '...........gkgg.', '...........gggg.', '....ggg....gg...', '..gggggg..gg....', '.gggggggggg.....', 'gggggggggg......', 'ggggggggg.......', '.ggggggg........', '..gggggg........', '...gg.gg........', '...gg..gg.......', '...gg..gg.......', '..ggg..ggg......', '................']),
    S('Cube', ['....rrrrrrrr....', '...ryyrrwwrr....', '..rrrrrrrrrrr...', '.rbbrrggrrrrr...', 'rrrrrrrrrrrrr...', 'ryyyrrbbrrr.r...', 'rrrrrrrrrrr.r...', 'rrrrrrrrrrr.r...', 'ryyyrbbbrrr.r...', 'rrrrrrrrrrr.r...', 'rrrrrrrrrrr.rr..', 'rbbbrrrrryy.r...', 'rrrrrrrrrrr.r...', 'rrrrrrrrrrr.r...', 'rrrrrrrrrrrr....', '................']),
    S('Tetromino', ['................', '................', '....bbbbbbbb....', '....bccccccb....', '....bccccccb....', '....bbbbbbbb....', '....bbbbbbbbbbbb', '....bccccccbcccb', '....bccccccbcccb', '....bbbbbbbbbbbb', '........bbbbbbbb', '........bccccccb', '........bccccccb', '........bbbbbbbb', '................', '................']),
    S('Floppy', ['kkkkkkkkkkkkkkk.', 'kkkeeeeeeeeekkkk', 'kkkeekkkkkeekkkk', 'kkkeekkkkkeekkkk', 'kkkeeeeeeeeekkkk', 'kkkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkkk', 'kkwwwwwwwwwwwwkk', 'kkwwwwwwwwwwwwkk', 'kkwkkwwwwwwwwwkk', 'kkwwwwwwwwwwwwkk', 'kkwkkkkwwwwwwwkk', 'kkwwwwwwwwwwwwkk', 'kkwwwwwwwwwwwwkk', 'kkkkkkkkkkkkkkkk']),
    S('CD', ['.....eeeeee.....', '...eeeeeeeeee...', '..eeeeppeeeeee..', '.eeeeppeeeeecee.', '.eeepeeeeeeecee.', 'eeeepeeeeeeeecce', 'eeeeeeekkeeeeeee', 'eeeeeekaakeeeeee', 'eeeeeekaakeeeeee', 'eeeeeeekkeeeeeee', 'eeceeeeeeeeeeeee', '.eccceeeeeeppee.', '.eeeceeeeeppeee.', '..eeeeeeeppeee..', '...eeeeeeeeee...', '.....eeeeee.....']),
    S('Cat', ['.o...........o..', '.oo.........oo..', '.ooo.......ooo..', '.ooooooooooooo..', '.ooooooooooooo..', '.okooooooookoo..', '.ooooooooooooo..', '.ooooopkpooooo..', '.ooooooooooooo..', '..ooooooooooo...', '..ooooooooooo..o', '..ooooooooooo.oo', '..ooooooooooooo.', '..oooooooooooo..', '..ooo.ooo.ooo...', '..ooo.ooo.ooo...']),
    S('Dog', ['....nnnnnn......', '...nnnnnnnn.....', '.nnnnnnnnnnnn...', '.nnnnkknkknnnn..', '.nnnnnnnnnnnnn..', '.nnnnnnnnnnnnn..', '.nnnnnnkknnnnn..', '..nnnnnnnnnnn...', '....nnnnnnn.....', '....nnnnnnn..nn.', '....nnnnnnn.nn..', '....nnnnnnnnn...', '....nnnnnnnn....', '....nnn.nnn.....', '....nnn.nnn.....', '....nnn.nnn.....']),
    S('Fish', ['................', '......bbbbb.....', '....bbbbbbbbb...', '...bbwkbbbbbbbb.', '..bbbbbbbbbbb.bb', '..bbbbbbbbbbbbb.', '.bbbbbbbbbbbbb..', '..bbbbbbbbbbbbb.', '..bbbbbbbbbbb.bb', '...bbbbbbbbbbbb.', '....bbbbbbbbb...', '......bbbbb.....', '................', '................', '................', '................']),
    S('Flower', ['......pppp......', '.....pppppp.....', '.ppp.pppppp.ppp.', 'ppppppyyyyyppppp', 'pppppyyyyyyypppp', 'ppppppyyyyyppppp', '.ppp.pppppp.ppp.', '.....pppppp.....', '......pppp......', '.......gg.......', '......ggg.......', '.....ggggg......', '.......gg.gg....', '.......gg.......', '.......gg.......', '......gggg......']),
    S('Tree', ['......gggg......', '.....gggggg.....', '....gggggggg....', '...gggggggggg...', '..gggggggggggg..', '....gggggggg....', '...gggggggggg...', '..gggggggggggg..', '.gggggggggggggg.', 'gggggggggggggggg', '......nnnn......', '......nnnn......', '......nnnn......', '......nnnn......', '.....nnnnnn.....', '....gggggggg....']),
    S('House', ['.......rr.......', '......rrrr......', '.....rrrrrr.....', '....rrrrrrrr....', '...rrrrrrrrrr...', '..rrrrrrrrrrrr..', '.rrrrrrrrrrrrrr.', 'rrrrrrrrrrrrrrrr', '.uuuuuuuuuuuuuu.', '.uuccuuuuuuccuu.', '.uuccuuuuuuccuu.', '.uuuuuunnuuuuuu.', '.uuuuuunnuuuuuu.', '.uuuuuunnuuuuuu.', '.uuuuuunnuuuuuu.', 'gggggggggggggggg']),
    S('Sun', ['.......y........', '.y.....y.....y..', '..y...yyy...y...', '...y.yyyyy.y....', '....yyyyyyy.....', '...yyyyyyyyy....', '..yyyyyyyyyyy...', 'yyyyyyyyyyyyyyy.', '..yyyyyyyyyyy...', '...yyyyyyyyy....', '....yyyyyyy.....', '...y.yyyyy.y....', '..y...yyy...y...', '.y.....y.....y..', '.......y........', '................']),
    S('Cloud', ['................', '......wwww......', '....wwwwwwww....', '...wwwwwwwwww...', '.wwwwwwwwwwwwww.', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', '.wwwwwwwwwwwwww.', '..wwwwwwwwwwww..', '................', '................', '................', '................', '................', '................']),
    S('Car', ['................', '................', '......rrrrrr....', '.....rrcccrrr...', '....rrrcccrrrr..', '...rrrrrrrrrrrr.', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', '.rkkkrrrrrrkkkr.', '.kkkkk....kkkkk.', '.kkakk....kkakk.', '.kkkkk....kkkkk.', '..kkk......kkk..', '................']),
    S('Ghost', ['.....wwwwww.....', '...wwwwwwwwww...', '..wwwwwwwwwwww..', '..wwkkwwwwkkww..', '.wwwkkwwwwkkwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.wwwwwwwwwwwwww.', '.www.wwww.wwww..', '.ww...ww...ww...', '................']),
    S('Pizza', ['.......oo.......', '......oyyo......', '.....oyyyyo.....', '.....oyryyo.....', '....oyyyyyyo....', '....oyyyryyo....', '...oyyryyyyyo...', '...oyyyyyyryo...', '..oyyyyryyyyyo..', '..oyryyyyyryyo..', '.oyyyyyryyyyyyo.', '.oyyryyyyyyryyo.', 'oyyyyyyryyyyyyyo', 'oooooooooooooooo', '................', '................']),
    S('Crown', ['................', '................', 'y.....yy.....y..', 'yy....yy....yy..', 'yyy..yyyy..yyy..', 'yyyy.yyyy.yyyy..', 'yyyyyyyyyyyyyy..', 'yyyyyyyyyyyyyy..', 'yyryyyyyyyyryy..', 'yyyyyybbyyyyyy..', 'yyyyyyyyyyyyyy..', 'YYYYYYYYYYYYYY..', 'yyyyyyyyyyyyyy..', 'YYYYYYYYYYYYYY..', '................', '................']),
    S('Moon', ['......yyyy......', '....yyyyyyyy....', '...yyyyyy.......', '..yyyyy.........', '.yyyyy..........', '.yyyy...........', 'yyyy............', 'yyyy............', 'yyyy............', 'yyyy............', '.yyyy...........', '.yyyyy..........', '..yyyyy.........', '...yyyyyy.......', '....yyyyyyyy....', '......yyyy......']),
    S('Mouse', ['................', '................', '....eeeeeeee....', '...eeeeeeeeee...', '..eeeeeaeeeeee..', '..eeeeeaeeeeee..', '..eeeeeeeeeeee..', '..eeeeeeeeeeee..', '..eeeeeeeeeeee..', '..eeeeeeeeeeee..', '...eeeeeeeeee...', '....eeeeeeee....', '.......a........', '.......a........', '......aa........', '................']),
    S('Smiley', ['.....yyyyyy.....', '...yyyyyyyyyy...', '..yyyyyyyyyyyy..', '.yyyykkyyyykkyy.', '.yyyykkyyyykkyy.', 'yyyyyyyyyyyyyyyy', 'yyyyyyyyyyyyyyyy', 'yyyyyyyyyyyyyyyy', 'yykyyyyyyyyyykyy', 'yyykkyyyyyykkyyy', '.yyyykkkkkkyyyy.', '.yyyyyyyyyyyyyy.', '..yyyyyyyyyyyy..', '...yyyyyyyyyy...', '.....yyyyyy.....', '................']),
    S('Spider', ['................', 'k.............k.', '.k....kkk....k..', '..k..kkkkk..k...', '...kkkkkkkkk....', 'kkkkkkkkkkkkkkk.', '...kkrkkkrkk....', '..k.kkkkkkk.k...', '.k...kkkkk...k..', 'k...k.kkk.k...k.', '...k...k...k....', '..k....k....k...', '................', '................', '................', '................']),
    S('Lightning', ['........yyyy....', '.......yyyy.....', '......yyyy......', '.....yyyy.......', '....yyyyyyyy....', '...yyyyyyyy.....', '......yyyy......', '.....yyyy.......', '....yyyy........', '...yyyy.........', '..yyyy..........', '.yyy............', 'yy..............', '................', '................', '................']),
    S('Trophy', ['.yyyyyyyyyyyyyy.', 'yyYyyyyyyyyyyYyy', 'yYyyyyyyyyyyyyYy', 'yYyyyyyyyyyyyyYy', '.yyyyyyyyyyyyyy.', '.YYyyyyyyyyyyYY.', '...yyyyyyyyyy...', '....yyyyyyyy....', '.....yyyyyy.....', '......yyyy......', '......yyyy......', '......yyyy......', '....yyyyyyyy....', '...nnnnnnnnnn...', '...nnnnnnnnnn...', '................']),
  ];
  const stampCache = {};
  function stampCanvas(i, scale) {
    const key = i + ':' + scale;
    if (stampCache[key]) return stampCache[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = 16 * scale;
    const x = cv.getContext('2d');
    STAMPS[i].rows.forEach((r, j) => { for (let k = 0; k < 16; k++) { const c = PAL[r[k]]; if (c) { x.fillStyle = c; x.fillRect(k * scale, j * scale, scale, scale); } } });
    return stampCache[key] = cv;
  }

  const COLOURS = ['#000000', '#808080', '#ffffff', '#e10600', '#ff8000', '#ffd400', '#8ad84a', '#3a9a2a', '#1f5e14', '#00e5ff', '#2a7ad8', '#0028c8', '#5b16c9', '#c0187a', '#ff8ac0', '#7a4a1a', '#f2c79a', '#008080', '#b6ff00', '#9fd0ff'];
  const TOOLS = [
    ['pencil', 'Pencil', '<path d="M4 24l3-1 13-13-2-2L5 21z" fill="#ffd400" stroke="#000"/><path d="M18 8l2 2 2-2-2-2z" fill="#f2c79a" stroke="#000"/><path d="M4 24l1-3 2 2z" fill="#000"/>', 'Scribble! Drag to draw a line.'],
    ['brush', 'Wacky Brush', '<path d="M8 6h6v10H8z" fill="#7a4a1a" stroke="#000"/><path d="M6 16h10v4c0 3-10 3-10 0z" fill="#ff8ac0" stroke="#000"/><circle cx="20" cy="8" r="2" fill="#2a7ad8"/><circle cx="23" cy="14" r="2" fill="#ffd400"/><circle cx="19" cy="19" r="2" fill="#3a9a2a"/>', 'A brush that does silly things. Pick a pattern below.'],
    ['spray', 'Spray Can', '<rect x="9" y="10" width="10" height="14" rx="1" fill="#e10600" stroke="#000"/><rect x="11" y="6" width="4" height="4" fill="#808080" stroke="#000"/><circle cx="20" cy="6" r="1" fill="#000"/><circle cx="23" cy="4" r="1" fill="#000"/><circle cx="23" cy="9" r="1" fill="#000"/>', 'Psssssht. Hold to spray.'],
    ['line', 'Line', '<path d="M5 23L23 5" stroke="#000" stroke-width="3"/>', 'Drag for a straight line.'],
    ['rect', 'Box', '<rect x="5" y="7" width="18" height="14" fill="#9fd0ff" stroke="#000" stroke-width="2"/>', 'Drag out a box.'],
    ['oval', 'Blob', '<ellipse cx="14" cy="14" rx="10" ry="7" fill="#ff8ac0" stroke="#000" stroke-width="2"/>', 'Drag out a blob (an oval).'],
    ['fill', 'Bucket', '<path d="M6 12l8-6 8 6-8 10z" fill="#2a7ad8" stroke="#000"/><path d="M20 14c0 3 3 5 3 8a3 3 0 0 1-6 0c0-3 3-5 3-8z" fill="#2a7ad8" stroke="#000"/>', 'Pour paint into an area. Glug glug.'],
    ['eraser', 'Eraser', '<rect x="5" y="14" width="14" height="8" transform="rotate(-45 12 18)" fill="#ff8ac0" stroke="#000"/><rect x="11" y="6" width="8" height="8" transform="rotate(-45 15 10)" fill="#2a7ad8" stroke="#000"/>', 'Rub things out. Try the silly eraser modes below.'],
    ['stamp', 'Stamps', '<rect x="11" y="3" width="6" height="7" rx="2" fill="#e10600" stroke="#000"/><rect x="12" y="10" width="4" height="4" fill="#7a4a1a" stroke="#000"/><rect x="5" y="14" width="18" height="5" fill="#ffd400" stroke="#000"/><path d="M14 20l1.5 2.5h2.5l-2 1.8.8 2.7-2.8-1.6-2.8 1.6.8-2.7-2-1.8h2.5z" fill="#2a7ad8" stroke="#000" stroke-width=".5"/>', 'THUNK. Click to stamp a picture.'],
    ['text', 'Letters', '<text x="4" y="22" font="bold 20px Arial" font-family="Arial" font-weight="bold" font-size="20">Ab</text>', 'Click, then type. Big chunky letters.'],
    ['mixer', 'Wacky Mixer', '<circle cx="14" cy="14" r="10" fill="#fff" stroke="#000"/><path d="M14 4a10 10 0 0 1 10 10h-10z" fill="#e10600"/><path d="M14 14l10 0a10 10 0 0 1-10 10z" fill="#ffd400"/><path d="M14 14v10A10 10 0 0 1 4 14z" fill="#2a7ad8"/><path d="M4 14A10 10 0 0 1 14 4v10z" fill="#3a9a2a"/>', 'Mix up the WHOLE picture. Pick a mix below.'],
    ['undo', 'Oops!', '<path d="M8 10h10a5 5 0 0 1 0 10H9" fill="none" stroke="#000" stroke-width="3"/><path d="M11 5l-6 5 6 5z" fill="#000"/>', 'Oops! Undo the last thing.'],
    ['dynamite', 'DYNAMITE', '<rect x="8" y="10" width="12" height="14" fill="#e10600" stroke="#000"/><rect x="8" y="14" width="12" height="2" fill="#000"/><path d="M14 10V6c0-2 3-2 3 0" fill="none" stroke="#000" stroke-width="1.5"/><path d="M17 6l1-2 1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1z" fill="#ffd400"/>', 'Clears the whole picture. LOUDLY.'],
  ];
  const BRUSHES = [['dots', 'Dots'], ['rainbow', 'Rainbow'], ['squares', 'Squares'], ['sparkle', 'Sparkle'], ['wobbly', 'Wobbly'], ['shadow', 'Shadow']];
  const ERASERS = [['plain', 'Plain'], ['cheese', 'Swiss Cheese'], ['fade', 'Fade to Black'], ['scramble', 'Scramble']];
  const MIXES = [['mirror', 'Mirror'], ['flip', 'Upside Down'], ['invert', 'Invert'], ['pixel', 'Blocky'], ['tiles', 'Jumble'], ['rainbow', 'Rainbow Wash'], ['wobble', 'Wobble']];
  const SIZES = [2, 5, 10, 18];
  const STAMP_SIZES = [2, 3, 4, 6];

  // ================================================================ the program
  C.mods.stamp = (w, arg) => {
    const root = h('div', 'ct-s');
    root.innerHTML = `<div class="ct-s-main"><div class="ct-s-tools"></div><div class="ct-s-stage"><canvas class="ct-s-cv ct-px" width="${W}" height="${H}"></canvas><canvas class="ct-s-ov ct-px" width="${W}" height="${H}"></canvas><input type="text" class="ct-s-txt" maxlength="24" aria-label="Letters to stamp"></div></div>
      <div class="ct-s-opts"></div><div class="ct-s-pal"></div>`;
    w.body.appendChild(root);
    const cv = root.querySelector('.ct-s-cv'), ctx = cv.getContext('2d'), ov = root.querySelector('.ct-s-ov'), octx = ov.getContext('2d');
    const stage = root.querySelector('.ct-s-stage'), toolsEl = root.querySelector('.ct-s-tools'), optsEl = root.querySelector('.ct-s-opts'), palEl = root.querySelector('.ct-s-pal'), txtIn = root.querySelector('.ct-s-txt');
    const st = { tool: 'pencil', col: '#e10600', size: 1, brush: 'dots', eraser: 'plain', mix: 'mirror', stamp: 0, ssize: 1, undo: [], dirty: false, name: '', busy: false, mixes: 0 };
    const used = new Set(store.get('stamps_used', []));
    const status = t => { w.status.textContent = t; };
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    let lastSnd = 0;
    const snd = (fn, gap) => { const n = performance.now(); if (n - lastSnd < (gap || 60)) return; lastSnd = n; fn(); };

    // ---- layout: fit the 640x420 canvas into the stage, keep aspect
    function fit() { const r = stage.getBoundingClientRect(); if (!r.width) return; const s = Math.min(r.width / W, r.height / H); [cv, ov].forEach(c => { c.style.width = Math.floor(W * s) + 'px'; c.style.height = Math.floor(H * s) + 'px'; }); }
    const ro = new ResizeObserver(fit); ro.observe(stage); fit();
    const pos = ev => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(W - 1, (ev.clientX - r.left) / r.width * W)), y: Math.max(0, Math.min(H - 1, (ev.clientY - r.top) / r.height * H)) }; };

    // ---- tool palette
    TOOLS.forEach(([id, name, svg, tip]) => {
      const b = h('button', 'ct-s-tool'); b.type = 'button'; b.dataset.t = id; b.title = tip;
      b.innerHTML = `<svg viewBox="0 0 28 28">${svg}</svg><span>${esc(name)}</span>`;
      b.addEventListener('click', () => { if (id === 'undo') return undo(); if (id === 'dynamite') return dynamite(); setTool(id); });
      toolsEl.appendChild(b);
    });
    COLOURS.forEach(c => { const b = h('button', 'ct-s-col'); b.type = 'button'; b.style.background = c; b.dataset.c = c; b.title = c; b.addEventListener('click', () => { st.col = c; palEl.querySelectorAll('.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); note(600 + COLOURS.indexOf(c) * 40, 0.05, 'triangle'); }); palEl.appendChild(b); });
    palEl.querySelector(`[data-c="${st.col}"]`).classList.add('on');
    const TOOL_SND = { pencil: () => note(900 + rnd(300), 0.03, 'triangle'), brush: () => note(300 + rnd(500), 0.06, 'sine'), spray: () => note(2000 + rnd(2000), 0.03, 'sawtooth'), line: () => note(440, 0.08, 'square'), rect: () => note(330, 0.08, 'square'), oval: () => note(392, 0.08, 'sine'), fill: () => sfx('boing'), eraser: () => note(150 + rnd(60), 0.05, 'sawtooth'), stamp: () => sfx('thud'), text: () => sfx('click'), mixer: () => sfx('dice') };
    function setTool(t) {
      st.tool = t; toolsEl.querySelectorAll('.ct-s-tool').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      stage.dataset.tool = t; commitText(); renderOpts();
      status(TOOLS.find(x => x[0] === t)[3]);
      (TOOL_SND[t] || (() => {}))();
    }
    const optBtn = (label, on, fn, html) => { const b = h('button', 'ct-s-opt' + (on ? ' on' : '')); b.type = 'button'; b.innerHTML = html || esc(label); b.title = label; b.addEventListener('click', () => { fn(); renderOpts(); }); return b; };
    function renderOpts() {
      optsEl.innerHTML = '';
      const t = st.tool;
      const sizes = () => { optsEl.appendChild(h('span', 'ct-s-ol', 'Size:')); SIZES.forEach((s, i) => optsEl.appendChild(optBtn(String(s), st.size === i, () => { st.size = i; note(300 + i * 100, 0.05); }, `<i class="ct-s-dot" style="width:${s + 4}px;height:${s + 4}px"></i>`))); };
      if (t === 'pencil' || t === 'line' || t === 'rect' || t === 'oval' || t === 'spray' || t === 'eraser') sizes();
      if (t === 'brush') { optsEl.appendChild(h('span', 'ct-s-ol', 'Pattern:')); BRUSHES.forEach(([id, n]) => optsEl.appendChild(optBtn(n, st.brush === id, () => { st.brush = id; sfx('pet'); }))); sizes(); }
      if (t === 'rect' || t === 'oval') { optsEl.appendChild(h('span', 'ct-s-ol', 'Fill:')); [['no', 'Outline'], ['yes', 'Filled']].forEach(([v, n]) => optsEl.appendChild(optBtn(n, (st.filled ? 'yes' : 'no') === v, () => { st.filled = v === 'yes'; }))); }
      if (t === 'eraser') { optsEl.appendChild(h('span', 'ct-s-ol', 'Mode:')); ERASERS.forEach(([id, n]) => optsEl.appendChild(optBtn(n, st.eraser === id, () => { st.eraser = id; note(200, 0.08, 'sawtooth'); }))); }
      if (t === 'mixer') { optsEl.appendChild(h('span', 'ct-s-ol', 'Mix:')); MIXES.forEach(([id, n]) => optsEl.appendChild(optBtn(n, st.mix === id, () => { st.mix = id; }))); const go = h('button', 'btn ct-s-go', 'MIX IT!'); go.type = 'button'; go.addEventListener('click', () => mixer(st.mix)); optsEl.appendChild(go); }
      if (t === 'text') { optsEl.appendChild(h('span', 'ct-s-ol', 'Click the picture, type, then click somewhere else. Size:')); STAMP_SIZES.forEach((s, i) => optsEl.appendChild(optBtn('x' + s, st.ssize === i, () => { st.ssize = i; }))); }
      if (t === 'stamp') {
        optsEl.appendChild(h('span', 'ct-s-ol', 'Size:')); STAMP_SIZES.forEach((s, i) => optsEl.appendChild(optBtn('x' + s, st.ssize === i, () => { st.ssize = i; note(200 + i * 80, 0.05); })));
        const strip = h('div', 'ct-s-stamps');
        STAMPS.forEach((s, i) => { const b = h('button', 'ct-s-st' + (st.stamp === i ? ' on' : '')); b.type = 'button'; b.title = s.name; b.appendChild(stampCanvas(i, 2)); b.addEventListener('click', () => { st.stamp = i; strip.querySelectorAll('.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); note(500 + i * 20, 0.04, 'square'); status('Stamp: ' + s.name + '. Click the picture to stamp it.'); }); strip.appendChild(b); });
        optsEl.appendChild(strip);
      }
    }

    // ---- undo
    function snap() { st.undo.push(ctx.getImageData(0, 0, W, H)); if (st.undo.length > 12) st.undo.shift(); st.dirty = true; }
    function undo() { const d = st.undo.pop(); if (!d) { status('Nothing to oops.'); sfx('uhoh'); return; } ctx.putImageData(d, 0, 0); note(500, 0.08, 'square'); note(300, 0.12, 'square'); status('Oops! Undone.'); }

    // ---- drawing primitives
    const sz = () => SIZES[st.size];
    function dot(x, y, r, col) { ctx.fillStyle = col || st.col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    function seg(a, b, fn) { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / 2)); for (let i = 0; i <= n; i++) fn(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, i); }
    const hue = t => `hsl(${(t * 8) % 360},100%,50%)`;
    let brushT = 0;
    function brushAt(x, y) {
      const r = sz() / 2 + 2; brushT++;
      switch (st.brush) {
        case 'dots': if (brushT % 3 === 0) dot(x + rnd(7) - 3, y + rnd(7) - 3, r * 0.6); break;
        case 'rainbow': dot(x, y, r, hue(brushT)); break;
        case 'squares': if (brushT % 2 === 0) { ctx.fillStyle = st.col; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.strokeStyle = '#000'; ctx.strokeRect(x - r + 0.5, y - r + 0.5, r * 2, r * 2); } break;
        case 'sparkle': if (brushT % 2 === 0) { ctx.fillStyle = pick(['#fff', '#ffd400', st.col]); const s = 2 + rnd(5); ctx.fillRect(x - s / 2 + rnd(11) - 5, y - s / 2 + rnd(11) - 5, s, s); } break;
        case 'wobbly': dot(x + Math.sin(brushT / 3) * r * 1.5, y + Math.cos(brushT / 3) * r * 1.5, r * 0.7); break;
        case 'shadow': dot(x + 3, y + 3, r, 'rgba(0,0,0,.5)'); dot(x, y, r); break;
      }
    }
    function eraseAt(x, y) {
      const r = sz() + 4;
      switch (st.eraser) {
        case 'plain': dot(x, y, r, '#fff'); break;
        case 'cheese': dot(x, y, r, '#fff'); if (rnd(3) === 0) dot(x + rnd(21) - 10, y + rnd(21) - 10, 2 + rnd(5), '#fff'); break;
        case 'fade': { const d = ctx.getImageData(Math.round(x - r), Math.round(y - r), r * 2, r * 2); for (let i = 0; i < d.data.length; i += 4) { d.data[i] *= 0.85; d.data[i + 1] *= 0.85; d.data[i + 2] *= 0.85; } ctx.putImageData(d, Math.round(x - r), Math.round(y - r)); break; }
        case 'scramble': { const s = r * 2, sx = Math.round(x - r), sy = Math.round(y - r); const d = ctx.getImageData(sx, sy, s, s); const p = d.data; for (let i = 0; i < 40; i++) { const a = rnd(s * s) * 4, b = rnd(s * s) * 4; for (let k = 0; k < 3; k++) { const t = p[a + k]; p[a + k] = p[b + k]; p[b + k] = t; } } ctx.putImageData(d, sx, sy); break; }
      }
    }
    function sprayAt(x, y) { const r = sz() * 2 + 6; ctx.fillStyle = st.col; for (let i = 0; i < 10; i++) { const a = Math.random() * 6.3, d = Math.random() * r; ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 1.5, 1.5); } }
    function floodFill(x0, y0, col) {
      x0 |= 0; y0 |= 0;
      const img = ctx.getImageData(0, 0, W, H), p = img.data;
      const idx = (x, y) => (y * W + x) * 4;
      const t = idx(x0, y0), tr = p[t], tg = p[t + 1], tb = p[t + 2];
      const c = document.createElement('canvas').getContext('2d'); c.fillStyle = col; c.fillRect(0, 0, 1, 1); const [fr, fg, fb] = c.getImageData(0, 0, 1, 1).data;
      if (tr === fr && tg === fg && tb === fb) return;
      const same = i => Math.abs(p[i] - tr) < 24 && Math.abs(p[i + 1] - tg) < 24 && Math.abs(p[i + 2] - tb) < 24;
      const stack = [[x0, y0]]; let n = 0;
      while (stack.length && n < 400000) {
        const [x, y] = stack.pop(); let i = idx(x, y);
        if (!same(i)) continue;
        let xl = x; while (xl > 0 && same(idx(xl - 1, y))) xl--;
        let xr = x; while (xr < W - 1 && same(idx(xr + 1, y))) xr++;
        for (let xx = xl; xx <= xr; xx++) { i = idx(xx, y); p[i] = fr; p[i + 1] = fg; p[i + 2] = fb; p[i + 3] = 255; n++; if (y > 0 && same(idx(xx, y - 1))) stack.push([xx, y - 1]); if (y < H - 1 && same(idx(xx, y + 1))) stack.push([xx, y + 1]); }
      }
      ctx.putImageData(img, 0, 0);
    }
    function stampAt(x, y) {
      const s = STAMP_SIZES[st.ssize], c = stampCanvas(st.stamp, s);
      ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
      used.add(st.stamp); store.set('stamps_used', [...used]);
      if (used.size >= STAMPS.length) C.secret('stampall');
      note(120 + rnd(40), 0.07, 'square'); sfx('thud');
    }
    // ---- letters: a little input box over the canvas, stamped when you click elsewhere
    let textAt = null;
    function commitText() {
      if (!textAt) return; const v = txtIn.value.trim();
      if (v) { snap(); ctx.font = `bold ${14 * STAMP_SIZES[st.ssize]}px "Bangers",Impact,Arial,sans-serif`; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(v, textAt.x, textAt.y); ctx.fillStyle = st.col; ctx.fillText(v, textAt.x, textAt.y); sfx('thud'); }
      txtIn.value = ''; txtIn.style.display = 'none'; textAt = null;
    }
    txtIn.addEventListener('keydown', ev => { if (ev.key === 'Enter') commitText(); else if (ev.key === 'Escape') { txtIn.value = ''; commitText(); } else snd(() => note(700 + rnd(400), 0.03, 'square'), 30); });

    // ---- pointer handling
    let drag = null;
    const circle = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    function shape(c, a, b, preview) {
      const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), ww = Math.abs(b.x - a.x), hh = Math.abs(b.y - a.y);
      c.lineWidth = sz(); c.strokeStyle = st.col; c.fillStyle = st.col;
      if (st.tool === 'line') { c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      else if (st.tool === 'rect') { if (st.filled) c.fillRect(x, y, ww, hh); else c.strokeRect(x, y, ww, hh); }
      else { c.beginPath(); c.ellipse(x + ww / 2, y + hh / 2, Math.max(1, ww / 2), Math.max(1, hh / 2), 0, 0, 7); if (st.filled) c.fill(); else c.stroke(); }
    }
    ov.addEventListener('pointerdown', ev => {
      if (st.busy) return;
      ev.preventDefault(); ov.setPointerCapture(ev.pointerId);
      const p = pos(ev); const t = st.tool;
      if (t === 'text') { commitText(); textAt = p; txtIn.style.display = 'block'; txtIn.style.left = (p.x / W * 100) + '%'; txtIn.style.top = (p.y / H * 100) + '%'; setTimeout(() => txtIn.focus(), 20); sfx('click'); return; }
      commitText();
      if (t === 'mixer') { mixer(st.mix); return; }
      snap();
      if (t === 'fill') { floodFill(p.x, p.y, st.col); sfx('boing'); for (let i = 0; i < 4; i++) setTimeout(() => note(200 + i * 90, 0.08, 'sine'), i * 70); return; }
      if (t === 'stamp') { stampAt(p.x, p.y); return; }
      drag = { a: p, last: p, n: 0 };
      if (t === 'pencil') dot(p.x, p.y, sz() / 2);
      else if (t === 'brush') brushAt(p.x, p.y);
      else if (t === 'spray') sprayAt(p.x, p.y);
      else if (t === 'eraser') eraseAt(p.x, p.y);
    });
    ov.addEventListener('pointermove', ev => {
      if (!drag) return;
      const p = pos(ev), t = st.tool; drag.n++;
      if (t === 'pencil') { ctx.lineCap = 'round'; ctx.lineWidth = sz(); ctx.strokeStyle = st.col; ctx.beginPath(); ctx.moveTo(drag.last.x, drag.last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); snd(() => note(800 + rnd(400), 0.02, 'triangle'), 45); }
      else if (t === 'brush') { seg(drag.last, p, (x, y) => brushAt(x, y)); snd(() => note(st.brush === 'rainbow' ? 200 + (brushT * 7) % 600 : 250 + rnd(400), 0.05, 'sine'), 70); }
      else if (t === 'spray') { sprayAt(p.x, p.y); snd(() => note(3000 + rnd(2000), 0.03, 'sawtooth'), 40); }
      else if (t === 'eraser') { seg(drag.last, p, (x, y, i) => { if (i % 3 === 0) eraseAt(x, y); }); snd(() => note(130 + rnd(50), 0.05, 'sawtooth'), 80); }
      else { octx.clearRect(0, 0, W, H); shape(octx, drag.a, p, true); snd(() => note(300 + Math.hypot(p.x - drag.a.x, p.y - drag.a.y), 0.03, 'square'), 60); }
      drag.last = p;
    });
    const up = ev => {
      if (!drag) return;
      const p = pos(ev), t = st.tool;
      if (t === 'line' || t === 'rect' || t === 'oval') { octx.clearRect(0, 0, W, H); shape(ctx, drag.a, p); sfx('button'); }
      else if (t === 'spray') note(1500, 0.1, 'sawtooth');
      drag = null;
    };
    ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);

    // ---- Wacky Mixer
    function mixer(mode) {
      snap();
      const copy = document.createElement('canvas'); copy.width = W; copy.height = H; copy.getContext('2d').drawImage(cv, 0, 0);
      if (mode === 'mirror') { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(copy, 0, 0); ctx.restore(); }
      else if (mode === 'flip') { ctx.save(); ctx.translate(0, H); ctx.scale(1, -1); ctx.drawImage(copy, 0, 0); ctx.restore(); }
      else if (mode === 'invert') { const d = ctx.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 255 - d.data[i]; d.data[i + 1] = 255 - d.data[i + 1]; d.data[i + 2] = 255 - d.data[i + 2]; } ctx.putImageData(d, 0, 0); }
      else if (mode === 'pixel') { const s = 10; ctx.imageSmoothingEnabled = false; const sm = document.createElement('canvas'); sm.width = W / s; sm.height = H / s; sm.getContext('2d').drawImage(copy, 0, 0, W / s, H / s); ctx.drawImage(sm, 0, 0, W / s, H / s, 0, 0, W, H); }
      else if (mode === 'tiles') { const n = 4, tw = W / n, th = H / n; const order = [...Array(n * n).keys()]; for (let i = order.length - 1; i > 0; i--) { const j = rnd(i + 1); [order[i], order[j]] = [order[j], order[i]]; } order.forEach((src, dst) => ctx.drawImage(copy, (src % n) * tw, Math.floor(src / n) * th, tw, th, (dst % n) * tw, Math.floor(dst / n) * th, tw, th)); }
      else if (mode === 'rainbow') { ctx.globalCompositeOperation = 'multiply'; const g = ctx.createLinearGradient(0, 0, W, H); for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${i * 60},100%,70%)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      else if (mode === 'wobble') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 2) ctx.drawImage(copy, 0, y, W, 2, Math.sin(y / 18) * 12, y, W, 2); }
      st.mixes++; store.set('mixes', (store.get('mixes', 0) + 1));
      if (store.get('mixes', 0) >= 5) C.secret('mixer');
      sfx('dice'); [330, 392, 494, 659].forEach((f, i) => setTimeout(() => note(f, 0.1, 'square'), i * 60));
      status('Mixed: ' + MIXES.find(m => m[0] === mode)[1] + '! Oops! puts it back.');
    }

    // ---- DYNAMITE
    function dynamite() {
      if (st.busy) return;
      commitText(); st.busy = true; stage.classList.add('busy'); setTool('dynamite');
      status('Uh oh. Cover your ears!');
      snap();
      const t0 = performance.now(); let raf = 0; const parts = [];
      const bx = W / 2, by = H - 60;
      function frame() {
        const t = (performance.now() - t0) / 1000;
        octx.clearRect(0, 0, W, H);
        if (t < 2.2) { // fuse burning
          const f = 1 - t / 2.2;
          octx.fillStyle = '#e10600'; octx.fillRect(bx - 30, by - 20, 60, 50); octx.fillStyle = '#000'; octx.fillRect(bx - 30, by, 60, 6);
          octx.fillStyle = '#fff'; octx.font = 'bold 12px Tahoma,sans-serif'; octx.textAlign = 'center'; octx.fillText('TNT', bx, by - 4); octx.textAlign = 'left';
          octx.strokeStyle = '#7a4a1a'; octx.lineWidth = 3; octx.beginPath(); octx.moveTo(bx, by - 20); octx.quadraticCurveTo(bx + 20, by - 60, bx + 40 * f + 10, by - 70 * f - 25); octx.stroke();
          const sx = bx + 40 * f + 10, sy = by - 70 * f - 25;
          for (let i = 0; i < 6; i++) { octx.fillStyle = pick(['#ffd400', '#ff8000', '#fff']); octx.fillRect(sx + rnd(17) - 8, sy + rnd(17) - 8, 3, 3); }
          if (Math.floor(t * 10) % 2 === 0) snd(() => note(2500 + rnd(1500), 0.03, 'sawtooth'), 90);
          raf = requestAnimationFrame(frame); return;
        }
        if (t < 2.25 && !parts.length) {
          sfx('waaagh'); note(50, 0.6, 'square'); note(35, 0.9, 'sine');
          for (let i = 0; i < 160; i++) { const a = Math.random() * 6.3, s = 150 + Math.random() * 450; parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, c: pick(['#e10600', '#ff8000', '#ffd400', '#fff', '#000', '#808080']), s: 4 + rnd(10) }); }
          root.classList.add('shake');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        }
        const tt = t - 2.2;
        if (tt < 0.25) { octx.fillStyle = tt < 0.1 ? '#fff' : '#ffd400'; octx.fillRect(0, 0, W, H); }
        octx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.7 - tt)})`; octx.beginPath(); octx.arc(bx, by, tt * 500, 0, 7); octx.fill();
        parts.forEach(p => { p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 8; octx.fillStyle = p.c; octx.fillRect(p.x, p.y, p.s, p.s); });
        if (tt > 0.6 && tt < 1.4) { octx.font = '64px "Bangers",Impact,sans-serif'; octx.textAlign = 'center'; octx.fillStyle = '#000'; octx.fillText('KABOOM!', W / 2 + 4, H / 2 + 4); octx.fillStyle = '#e10600'; octx.fillText('KABOOM!', W / 2, H / 2); octx.textAlign = 'left'; }
        if (tt < 1.8) raf = requestAnimationFrame(frame);
        else { octx.clearRect(0, 0, W, H); root.classList.remove('shake'); st.busy = false; stage.classList.remove('busy'); C.secret('dynamite'); status('BOOM. All gone. (Oops! brings it back, Mom.)'); setTool('pencil'); }
      }
      raf = requestAnimationFrame(frame);
      w.cleanup.push(() => cancelAnimationFrame(raf));
    }

    // ---- demo picture (for "stamp picture.stp")
    function demo() {
      ctx.fillStyle = '#9fd0ff'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#3a9a2a'; ctx.fillRect(0, 320, W, 100);
      const put = (name, x, y, s) => { const i = STAMPS.findIndex(q => q.name === name); const c = stampCanvas(i, s); ctx.drawImage(c, x - c.width / 2, y - c.height / 2); };
      put('Sun', 80, 70, 5); put('Cloud', 300, 60, 4); put('Cloud', 520, 100, 3); put('House', 150, 270, 6); put('Tree', 320, 265, 6); put('Tree', 420, 280, 4);
      put('Blobbit', 520, 300, 4); put('Goblin', 580, 300, 3); put('Dog', 250, 320, 3); put('Flower', 60, 330, 3); put('Flower', 100, 340, 3); put('UFO', 560, 40, 3); put('Rocket', 440, 110, 3);
      ctx.font = 'bold 42px "Bangers",Impact,sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText('MY HOUSE (+ Blobbit)', 160, 390); ctx.fillStyle = '#ffd400'; ctx.fillText('MY HOUSE (+ Blobbit)', 160, 390);
      st.name = 'stamp picture'; st.dirty = false; w.setTitle('stamp picture - Stamp Studio');
    }
    function loadSaved(key) {
      const d = store.get('pic_' + key, null); if (!d) return Desk.msgbox('Stamp Studio', 'That picture has gone. Maybe Gubbinz ate it.', 'warn');
      const img = new Image(); img.onload = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H); st.name = d.name; st.dirty = false; w.setTitle(d.name + ' - Stamp Studio'); }; img.src = d.png;
    }
    function savePic(name) {
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) || 'picture';
      const sm = document.createElement('canvas'); sm.width = 320; sm.height = 210; sm.getContext('2d').drawImage(cv, 0, 0, 320, 210);
      const png = sm.toDataURL('image/png');
      const keys = store.get('pics', []).filter(k => k !== key); keys.push(key);
      while (keys.length > 5) { const old = keys.shift(); try { localStorage.removeItem('jhp_carta_pic_' + old); } catch (e) {} }
      store.set('pics', keys); store.set('pic_' + key, { name, png, date: Desk.today99().date.toLocaleDateString('en-GB').slice(0, 6) + '99' });
      filePic(key, name);
      st.name = name; st.dirty = false; w.setTitle(name + ' - Stamp Studio');
      sfx('solve'); status(`Saved "${name}.stp" in My Pictures.`);
    }
    function filePic(key, name) { A.fs.add('C:/My Documents/My Pictures', { name: name + '.stp', type: 'stp', stamp: 'saved:' + key, date: Desk.today99().date.toLocaleDateString('en-GB').slice(0, 6) + '99', size: '14 KB' }); }
    // re-file pictures saved on an earlier visit
    store.get('pics', []).forEach(k => { const d = store.get('pic_' + k, null); if (d && !A.fs.get('C:/My Documents/My Pictures/' + d.name + '.stp')) filePic(k, d.name); });
    const confirmLose = fn => st.dirty ? Desk.msgbox('Stamp Studio', 'Throw away your picture?', 'q', [['Yes', fn], ['No']]) : fn();
    function newPic() { confirmLose(() => { snap(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); st.name = ''; st.dirty = false; w.setTitle('Stamp Studio'); sfx('turn'); }); }
    function openDlg() {
      const keys = store.get('pics', []);
      const items = [{ label: 'stamp picture (built in)', act: () => confirmLose(demo) }, ...keys.map(k => ({ label: (store.get('pic_' + k, {}).name || k), act: () => confirmLose(() => loadSaved(k)) }))];
      IE.menu(items, w.el.offsetLeft + 20, w.el.offsetTop + 44);
    }
    function saveDlg() { Desk.ask('Save Picture', 'What shall we call it?', st.name || 'my picture', 24, v => { v = String(v || '').trim().replace(/[\\/:*?"<>|]/g, ''); if (v) savePic(v); }); }

    A.menubar(w, [
      ['File', () => [{ label: 'New', key: 'Ctrl+N', act: newPic }, { label: 'Open...', key: 'Ctrl+O', act: openDlg }, { label: 'Save...', key: 'Ctrl+S', act: saveDlg }, '-', { label: 'Print...', act: () => Desk.msgbox('Print', 'Printing in colour on the Inkjet 440...\n\nOut of cyan. Your picture will be printed in yellow, magenta and disappointment.', 'warn') }, '-', { label: 'Exit', act: w.close }]],
      ['Edit', () => [{ label: 'Oops! (Undo)', key: 'Ctrl+Z', act: undo, dis: !st.undo.length }, '-', { label: 'Mix It!', sub: () => MIXES.map(([id, n]) => ({ label: n, act: () => mixer(id) })) }, { label: 'DYNAMITE', act: dynamite }]],
      ['Sounds', () => [{ label: Sound.on ? 'Sounds are ON (speaker icon turns them off)' : 'Sounds are OFF (click the speaker in the taskbar)', dis: true }, { label: 'Test the dynamite noise', act: () => sfx('waaagh') }]],
      ['Help', [{ label: 'How to Use Stamp Studio...', act: () => A.openFile({ name: 'Stamp Studio Help.txt', type: 'txt', text: `STAMP STUDIO HELP\n=================\n\nPick a tool on the left. Pick a colour at the bottom. Draw in the middle.\n\nPENCIL      scribble\nWACKY BRUSH a brush with silly patterns (rainbow! sparkle! wobbly!)\nSPRAY CAN   psssht\nLINE / BOX / BLOB  drag them out\nBUCKET      pours paint into an area\nERASER      rubs out. Try "Swiss Cheese" and "Fade to Black".\nSTAMPS      ${STAMPS.length} pictures to stamp. THUNK.\nLETTERS     click, type, click somewhere else\nWACKY MIXER mixes up the WHOLE picture\nOOPS!       undo (lots of times)\nDYNAMITE    clears the picture. Loudly. Mom hates this one.\n\nFile > Save keeps your picture in My Documents\\My Pictures.\n` }) }, { label: 'About Stamp Studio...', act: () => Desk.msgbox('About Stamp Studio', `Stamp Studio 1.0\n\n${STAMPS.length} stamps. ${TOOLS.length} tools. 1 stick of dynamite.\n\nMade for kids. And Jack. Jack is also a kid, so that's fine.`, 'info') }]],
    ]);
    root.addEventListener('keydown', ev => { if (ev.target === txtIn) return; if (ev.ctrlKey && ev.key === 'z') { ev.preventDefault(); undo(); } else if (ev.ctrlKey && ev.key === 's') { ev.preventDefault(); saveDlg(); } else if (ev.ctrlKey && ev.key === 'n') { ev.preventDefault(); newPic(); } else if (ev.ctrlKey && ev.key === 'o') { ev.preventDefault(); openDlg(); } });
    root.tabIndex = -1;

    function take(a) {
      if (a === 'dynamite') { setTool('dynamite'); Desk.toast('Stamp Studio', 'The dynamite is ready. Click it on the left when you dare.', 4000); setTool('pencil'); toolsEl.querySelector('[data-t=dynamite]').classList.add('wobble'); setTimeout(() => toolsEl.querySelector('[data-t=dynamite]').classList.remove('wobble'), 3000); }
      else if (a && a.type === 'stp') { if (a.stamp === 'demo') demo(); else if (String(a.stamp).startsWith('saved:')) loadSaved(a.stamp.slice(6)); }
    }
    C.api.stamp = { alive: () => !w.closed, take(a) { w.restore(); take(a); } };
    w.cleanup.push(() => ro.disconnect());
    setTool('pencil');
    take(arg);
    status('Welcome to Stamp Studio! Pick a tool. Every tool makes a noise. Sorry, Mom.');
  };
})();
