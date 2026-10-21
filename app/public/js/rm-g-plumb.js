/* SUPER PLUMBO WORLD (Super Nintendo, in Jack's room): a side-scrolling platformer on Biscuit Isle. Plumbo the plumber
 * (flat cap, dungarees, ginger moustache) walks the island map from level dot to level dot: Custard Meadows, Crumbly
 * Caves (it has a SECRET exit: carry the key to the keyhole and a hidden path opens across the sea), Wafer Heights,
 * the Gloomy Pantry (a haunted house), Fizzy Lagoon (the secret level) and Bourbon Castle, where King Grumblesnout waits.
 * Run with Y, jump with B (hold it to go higher), spin jump with A. Tea cakes make you big, the sherbet daisy lets you
 * throw fizzy sherbet balls, the bin-bag cape lets you fly (run until the P meter is full, then jump) and glide (hold B).
 * Crumpet the dino-pal hatches from an egg block: ride him, gulp baddies with Y. Five golden biscuits hide in every
 * level. Three save files (the battery in the cartridge), a high-score table with the lads' scores already on it.
 * Score: stomps (chains double up), coins, golden biscuits, the goal tape and the time left. Everything here (the art,
 * the music, the levels) is drawn and written from scratch. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const W = 256, H = 224, T = 16;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const q5 = v => Math.min(255, Math.round(v / 8) * 8); // 5 bits a channel: the Super Nintendo's 15-bit colour
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------------------------------------------------------------- sprite makers
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  // draw with shapes, then crisp it up (hard alpha, 15-bit colour, an optional 1px outline)
  function spr(w, h, fn, outline) {
    const c = mk(w, h), g = c.getContext('2d'); fn(g, w, h);
    crisp(c, outline);
    return c;
  }
  function crisp(c, outline) {
    const w = c.width, h = c.height, g = c.getContext('2d');
    let im; try { im = g.getImageData(0, 0, w, h); } catch (e) { return c; }
    const d = im.data; if (!d || !d.length) return c;
    const a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { const o = i * 4; if (d[o + 3] > 100) { d[o + 3] = 255; a[i] = 1; d[o] = q5(d[o]); d[o + 1] = q5(d[o + 1]); d[o + 2] = q5(d[o + 2]); } else d[o + 3] = 0; }
    if (outline) {
      const [r, gg, b] = hexRGB(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (a[i]) continue;
        if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) { const o = i * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; }
      }
    }
    g.putImageData(im, 0, 0);
    return c;
  }
  // pixel art from strings: one letter a pixel ('.' is see-through), outlined, with a 1px border all round
  function pix(rows, pal, outline) {
    const w = Math.max(...rows.map(r => r.length)) + 2, h = rows.length + 2;
    const c = mk(w, h), g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x + 1, y + 1, 1, 1); } } });
    return crisp(c, outline === undefined ? '#180c10' : outline);
  }
  function flip(c) { const f = mk(c.width, c.height), g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; }
  const both = c => [c, flip(c)]; // [facing right, facing left]
  const ell = (g, x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); g.fill(); };
  const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const grad = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s)); return gr; };

  // ---------------------------------------------------------------- Plumbo (facing right; the outline is added for us)
  const PAL = {'c': '#7a6650', 'C': '#a8927a', 'd': '#4a3a2e', 's': '#f8c898', 'S': '#d89068', 'h': '#e8702a', 'H': '#a84818', 'e': '#202040', 'w': '#ffffff', 'g': '#40b850', 'G': '#24803c', 'b': '#3c64d8', 'B': '#24409c', 'y': '#f8e048', 'o': '#7a4418', 'O': '#b07038', 'm': '#d85c18', 'n': '#f0a878'};
  const PAL_FIRE = Object.assign({}, PAL, { c: '#e0e0e8', C: '#ffffff', d: '#9898b0', g: '#f8d838', G: '#c09810', b: '#e85898', B: '#a82868', y: '#ffffff' });
  const HEAD = ['...cCcCcCc....', '..cCcCcCcCccc.', '.ccccccccdddddd', '.HHhsssseSs...', 'HHhSssssesss..', 'HHhSsssssssnn.', '.HhssssmmmmSn.', '..hsssmHHHm...', '...SsssSSs....'];
  const HEADF = ['....cCcCcc....', '..cCcCcCcCcc..', '.cccccccccccc.', '.dddddddddddd.', '.HseSssssSesH.', '.HseSssssSesH.', '.Hssssnnssssh.', '..sSmmmmmmSs..', '...ssmHHmss...'];
  const HEADB = ['....cCcCcc....', '..cCcCcCcCcc..', '.cccccccccccc.', '.cccccccccccc.', '.HHHHHHHHHHHH.', '.HHhhhhhhhhHH.', '.SHhhhhhhhhHS.', '..HHhhhhhhHH..', '...SSSSSSSS...'];
  const SB = { // small bodies (6 rows)
    stand: ['...gGbgggbG...', '..gggbbbbbggg.', '.ssgbybbbybss.', '..sBbbbbbbbs..', '...Bbb..bbB...', '..oOoo..oOoo..'],
    walk: ['...gGbgggbGss.', '..gggbbbbbgss.', '.ssgbybbbybg..', '...Bbbbbbbbb..', '..Bbbb...bbbo.', '.oOoo.....oOO.'],
    run: ['...gGbgggbGss.', 'ss.gGbbbbbgss.', '..ggbybbbyb...', '...Bbbbbbbbb..', '..Bbbb...bbbo.', '.oOoo.....oOO.'],
    jump: ['...gGbgggbGss.', '..gggbbbbbgs..', '.ssgbybbbybg..', '...Bbbbbbbbbbo', '..oObb...BoOO.', '.oOo..........'],
    skid: ['....gGbgggbG..', '...gggbbbbbgss', '..ssgbybbbybgs', '....Bbbbbbbb..', '...Bbbb..bbbbo', '..oOoo....oOOo'],
    kick: ['...gGbgggbG...', '..gggbbbbbggs.', '.ssgbybbbyb...', '...Bbbbbbbbbbo', '..Bbb.....oOO.', '.oOo..........'],
    hold: ['...gGbgggbGss.', '..gggbbbbbgss.', '...gbybbbyb...', '...Bbbbbbbb...', '..Bbbb..bbbb..', '.oOoo...ooOo..'],
    front: ['...ggbggbgg...', '.sggGbbbbGggs.', '.s.gbybbybg.s.', '...Bbbbbbbb...', '...Bbb..bbB...', '..oOoo..ooOo..'],
    back: ['...ggbggbgg...', '.sggGbbbbGggs.', '.s.gbbbbbbg.s.', '...Bbbbbbbb...', '...Bbb..bbB...', '..oOoo..ooOo..'],
    dead: ['s..ggbggbgg..s', 'ss.gGbbbbGg.ss', '...gbybbybg...', '...Bbbbbbbb...', '...Bbb..bbB...', '..oOoo..ooOo..'],
    swim: ['...gGbgggbGsss', '..gggbbbbbg...', '.ssgbybbbyb...', '...Bbbbbbbbbbb', '..Bbbb....bbbo', '.oOo.......oOO'],
  };
  const BT = { // big torsos (8 rows)
    stand: ['...ggbgggbgg..', '..gGGbgggbggg.', '.gGgGbbbbbgggg', '.gGgbbybybbgGg', '.gGbbbbbbbbbGg', '.ssbbbbbbbbbss', '.SsBbbbbbbbbss', '...Bbbbbbbbbb.'],
    swing: ['...ggbgggbgg..', '..gGGbgggbgggs', '.gGgGbbbbbggss', '.gGgbbybybbg..', '.ssbbbbbbbbb..', '.ssbbbbbbbbb..', '...Bbbbbbbbb..', '...Bbbbbbbbbb.'],
    run: ['...ggbgggbggss', '..gGGbgggbggss', 'ssgGGbbbbbgg..', 'ssGgbbybybb...', '...bbbbbbbbb..', '...Bbbbbbbbb..', '...Bbbbbbbbb..', '...Bbbbbbbbbb.'],
    up: ['...ggbgggbggss', '..gGGbgggbggss', '.gGgGbbbbbggs.', '.gGgbbybybbg..', '.gGbbbbbbbbb..', '.ssbbbbbbbbb..', '.SsBbbbbbbbb..', '...Bbbbbbbbbb.'],
    hold: ['...ggbgggbgg..', '..gGGbgggbgggs', '.gGgGbbbbbgggs', '.gGgbbybybbgss', '.gGbbbbbbbbb..', '..Bbbbbbbbbb..', '..Bbbbbbbbbb..', '...Bbbbbbbbbb.'],
    front: ['...ggbggbgg...', '..gggbggbggg..', '.gGgbbbbbbgGg.', '.gGgbybbybgGg.', '.gG.bbbbbb.Gg.', '.ss.bbbbbb.ss.', '.ss.Bbbbbb.ss.', '....Bbbbbb....'],
    back: ['...ggbggbgg...', '..gggbggbggg..', '.gGggbbbbggGg.', '.gGgbbbbbbgGg.', '.gG.bbbbbb.Gg.', '.ss.bbbbbb.ss.', '.ss.Bbbbbb.ss.', '....Bbbbbb....'],
    dead: ['ss.ggbggbgg.ss', 'ssgggbggbgggss', '..gGbbbbbbGg..', '...gbybbybg...', '....bbbbbb....', '....bbbbbb....', '....Bbbbbb....', '....Bbbbbb....'],
  };
  const BL = { // big legs (8 rows)
    stand: ['..Bbbbbbbbbbb.', '..Bbbbbbbbbbb.', '..Bbbbb.Bbbbb.', '..Bbbb...bbbb.', '..BBbb...bBBb.', '..ooOo...oOoo.', '.oOOoo..ooOOo.', '.ooooo..ooooo.'],
    stride: ['..Bbbbbbbbbbbb', '.Bbbbbb.bbbbb.', '.Bbbbb...bbbbb', 'Bbbbb.....bbbb', 'BBbb......BbbB', 'ooOo.......oOo', 'oOOo......ooOO', 'oooo......oooo'],
    half: ['..Bbbbbbbbbbb.', '..Bbbbbbbbbbb.', '.Bbbbb..bbbbb.', '.Bbbb....bbbb.', '.BBbb....bbBB.', '.ooOo....oOoo.', 'oOOoo...ooOOo.', 'ooooo...ooooo.'],
    jump: ['..Bbbbbbbbbbbb', '..Bbbbbbbbbbbb', '..Bbbbb..Bbbbo', '..Bbbb...BoOOo', '..BBbb....oOo.', '..ooOo........', '.oOOoo........', '.ooooo........'],
    kick: ['..Bbbbbbbbbbb.', '..Bbbbbbbbbbbb', '..Bbbbb..bbbbb', '..Bbbb....bboO', '..BBbb.....oOO', '..ooOo........', '.oOOoo........', '.ooooo........'],
    front: ['....Bbbbbb....', '....Bbbbbb....', '...BBbb.bbB...', '...Bbb..bbb...', '...Bbb..bbB...', '..ooOo..oOoo..', '..oOOo..oOOo..', '..oooo..oooo..'],
  };
  function plumboSet(P) {
    const sm = (head, body, pre) => both(pix([...(pre || []), ...head, ...body], P));
    const bg = (head, t, l) => both(pix([...head, ...t, ...l], P));
    const S = {
      stand: sm(HEAD, SB.stand), walk: sm(HEAD, SB.walk), run: sm(HEAD, SB.run), run2: sm(HEAD, SB.stand.map((r, i) => i < 3 ? SB.run[i] : r)), jump: sm(HEAD, SB.jump), fall: sm(HEAD, SB.walk),
      skid: sm(HEAD, SB.skid), kick: sm(HEAD, SB.kick), hold: sm(HEAD, SB.hold), hold2: sm(HEAD, SB.hold.map((r, i) => i < 4 ? r : SB.walk[i])), front: sm(HEADF, SB.front), back: sm(HEADB, SB.back), dead: sm(HEADF, SB.dead),
      duck: sm(HEAD, ['..ggbbbbbbgg..', '.ssBbybbybBss.', '.oOoobbbbooOo.'], ['', '', '']), swim: sm(HEAD, SB.swim), up: sm(HEAD, SB.stand),
    };
    const B = {
      stand: bg(HEAD, BT.stand, BL.stand), walk: bg(HEAD, BT.swing, BL.stride), walk2: bg(HEAD, BT.stand, BL.half), run: bg(HEAD, BT.run, BL.stride), run2: bg(HEAD, BT.run, BL.half),
      jump: bg(HEAD, BT.up, BL.jump), fall: bg(HEAD, BT.swing, BL.stride), skid: bg(HEAD, BT.swing, BL.kick),
      kick: bg(HEAD, BT.stand, BL.kick), hold: bg(HEAD, BT.hold, BL.stand), hold2: bg(HEAD, BT.hold, BL.half), front: bg(HEADF, BT.front, BL.front), back: bg(HEADB, BT.back, BL.front), dead: bg(HEADF, BT.dead, BL.front),
      duck: both(pix([...Array(9).fill(''), ...HEAD, '..ggGbbbbbggg.', '.gGgbybbbybgG.', '.ssbbbbbbbbbss', '.SsBbbbbbbbbss', '..BBbbbbbbbBB.', '.ooOooBBooOoo.', '.ooooo..ooooo.'], P)),
      swim: bg(HEAD, BT.up, BL.jump), up: bg(HEAD, BT.stand, BL.stand),
    };
    return { S, B };
  }

  // ---------------------------------------------------------------- everything else (built once, the first time the game is made)
  let ART = null;
  function art() {
    if (ART) return ART;
    const A = {};
    A.pl = plumboSet(PAL); A.plF = plumboSet(PAL_FIRE);
    // the bin-bag cape: hanging, flapping, flowing up, spread for gliding (drawn behind Plumbo, facing right)
    // the bin-bag cape (pixel art; the yellow drawstring is the knot at Plumbo's neck)
    const CAPEP = {'k': '#2a2a3a', 's': '#5c5c78', 'l': '#9090b0', 'y': '#f8d020', 'Y': '#c09010'};
    const capeSpr = rows => { const c = pix(rows, CAPEP); let ax = 0, ay = 0; rows.forEach((r, y) => { const i = r.lastIndexOf('Y'); if (i >= 0) { ax = i + 1; ay = y + 1; } }); const f = flip(c); c.ax = ax; c.ay = ay; f.ax = c.width - 1 - ax; f.ay = ay; return [c, f]; };
    A.cape = { hang: capeSpr(['......yyY', '....kkkkk', '...kkskkk', '...kkskk.', '..kkkskk.', '..kkskk..', '.kkkskk..', '.kkskkk..', 'kkkskk...', 'kkskkk...', 'kssskkk..', 'kkkkkkkk.', 'kk.kk.kk.', 'k...k..k.']), flap: [capeSpr(['..............yyY.', '...........kkkkkk.', '........kkkksskkk.', '.....kkkkssskkkk..', '...kkkssssskkkk...', '.kkksssskkkkkk....', 'kkssskkkkkkk......', 'kkkkkkk.kkk.......', 'kk.kk...k.........', 'k.................']), capeSpr(['..............yyY.', '............kkkkk.', '........kkkkkskk..', '....kkkkkssskkk...', 'kkkkkssssskkkk....', 'kssssskkkkkkk.....', 'kkkkkk.kk.k.......', '.kk.k....k........'])], up: capeSpr(['k...k...', 'kk.kk.k.', 'kkkkkkk.', 'kkskkkk.', '.kskkk..', '.kskkk..', '..skkk..', '..skk...', '..kkk...', '...kkyyY']), glide: capeSpr(['......................yyY.', '...............kkkkkkkkkk.', '........kkkkkkkssssssskk..', '...kkkkksssssskkkkkkkk....', 'kkkssssskkkkkkkkk.........', 'kksskkkkk.k..k............', 'kkkkk.k...................']) };
    // ---- the baddies
    const OUT = '#180808';
    const conk = f => spr(18, 18, g => {
      ell(g, 4 + f * 2, 16, 3.4, 1.8, '#3a1808'); ell(g, 14 - f * 2, 16, 3.4, 1.8, '#3a1808');
      ell(g, 9, 9, 8, 7.4, '#7a3010'); ell(g, 9, 8, 7.4, 6.6, '#a84818'); ell(g, 6, 5, 3, 2.2, '#d87838'); ell(g, 5, 4.5, 1.2, 0.9, '#f8c890');
      ell(g, 9, 2.8, 3.4, 1.4, '#e8c890'); rect(g, 8, 0, 2, 2, '#583010');
      rect(g, 4, 8, 4, 4, '#fff'); rect(g, 10, 8, 4, 4, '#fff'); rect(g, 6, 9, 2, 3, '#101010'); rect(g, 10, 9, 2, 3, '#101010');
      poly(g, [3, 6, 8, 8, 8, 9, 3, 7.4], '#301008'); poly(g, [15, 6, 10, 8, 10, 9, 15, 7.4], '#301008');
      rect(g, 7, 13, 4, 1, '#401008');
    }, OUT);
    A.conk = [0, 1].map(f => both(conk(f)));
    A.conkFlat = spr(18, 18, g => { ell(g, 9, 14, 8.5, 3.4, '#7a3010'); ell(g, 9, 13.4, 8, 2.8, '#a84818'); rect(g, 4, 13, 3, 1, '#fff'); rect(g, 11, 13, 3, 1, '#fff'); ell(g, 6, 12, 2, 0.8, '#d87838'); }, OUT);
    // the cuppa crab: a little crab living in a china teacup (stomp him and he hides in it: kick the cup!)
    const cupBody = (g, by) => {
      ell(g, 9, by + 9, 7.4, 6, '#d8e0f0'); rect(g, 1.6, by + 2, 14.8, 7, '#e8f0f8'); ell(g, 9, by + 2.6, 7.4, 2, '#f8fcff');
      ell(g, 9, by + 2.6, 6, 1.3, '#8a5028'); rect(g, 2, by + 6, 14, 2, '#3a68d8'); rect(g, 3, by + 9, 12, 1, '#88a8e8');
      for (let i = 0; i < 3; i++) ell(g, 4.5 + i * 4.5, by + 7, 1, 1, '#f8fcff');
      g.strokeStyle = '#d8e0f0'; g.lineWidth = 2; g.beginPath(); g.arc(17, by + 6.5, 2.6, -1.4, 1.4); g.stroke();
    };
    A.crab = [0, 1].map(f => both(spr(22, 22, g => {
      ell(g, 5 + f, 20, 2.4, 1.4, '#c83018'); ell(g, 13 - f, 20, 2.4, 1.4, '#c83018');
      // claws and eye stalks poking out of the cup
      rect(g, 6, 3 - f, 1.4, 4, '#e84828'); rect(g, 11, 3 - f, 1.4, 4, '#e84828'); ell(g, 6.6, 3 - f, 2, 2, '#fff'); ell(g, 11.6, 3 - f, 2, 2, '#fff'); rect(g, 7, 2.4 - f, 1.4, 1.6, '#101010'); rect(g, 12, 2.4 - f, 1.4, 1.6, '#101010');
      ell(g, 1.8, 7 + f, 2.6, 2.2, '#e84828'); ell(g, 18.4, 8 - f, 2.6, 2.2, '#e84828'); rect(g, 0, 6 + f, 2, 1, '#901808'); rect(g, 18, 7 - f, 2, 1, '#901808');
      g.translate(0, 0); cupBody(g, 8);
    }, OUT)));
    A.cup = [0, 1, 2, 3].map(f => spr(22, 18, g => { // the empty cup spinning (and peeking)
      g.translate(11, 9); g.scale([1, 0.5, -1, 0.5][f], 1); g.translate(-11, -9); cupBody(g, 3);
      if (f === 0) { ell(g, 7, 5.6, 1.4, 1.2, '#fff'); ell(g, 11, 5.6, 1.4, 1.2, '#fff'); rect(g, 7, 5.4, 1, 1, '#101010'); rect(g, 11, 5.4, 1, 1, '#101010'); }
    }, OUT));
    A.bee = [0, 1].map(f => both(spr(20, 18, g => {
      ell(g, 7, 4 - f, 4.4, 2.6 + f, 'rgba(220,240,255,.95)', -0.4); ell(g, 12, 4 - f, 4, 2.4 + f, 'rgba(200,228,255,.95)', 0.4);
      ell(g, 10, 11, 8, 6, '#f8c010'); rect(g, 5, 6, 2.4, 10, '#282018'); rect(g, 10, 5, 2.4, 12, '#282018');
      ell(g, 15, 9.6, 2.4, 2.4, '#fff'); rect(g, 15.6, 9, 1.4, 2, '#101010'); poly(g, [2, 10, 0, 13, 3, 12], '#606060');
      rect(g, 14, 3, 1, 3, '#282018'); rect(g, 16, 2, 1, 4, '#282018'); ell(g, 10, 7, 3, 1.2, '#fff0a0');
    }, '#201800')));
    A.prick = [0, 1].map(f => both(spr(20, 18, g => {
      for (let i = 0; i < 7; i++) { const a = Math.PI * (0.95 + i * 0.16); poly(g, [9 + Math.cos(a) * 4, 10 + Math.sin(a) * 4, 9 + Math.cos(a + 0.12) * 10, 10 + Math.sin(a + 0.12) * 10, 9 + Math.cos(a + 0.3) * 4, 10 + Math.sin(a + 0.3) * 4], '#5a3818'); }
      ell(g, 9, 11, 7.4, 5.4, '#7a5028'); for (let i = 0; i < 4; i++) ell(g, 4 + i * 3, 8 + (i % 2), 1, 1.6, '#a87848');
      ell(g, 14, 12, 4.4, 3.6, '#e8c898'); ell(g, 18, 12.6, 1.6, 1.4, '#301818'); rect(g, 14, 10, 1.6, 2, '#101010');
      ell(g, 6 + f * 2, 16.6, 2.2, 1.4, '#e8c898'); ell(g, 13 - f * 2, 16.6, 2.2, 1.4, '#e8c898');
    }, OUT)));
    A.bat = [0, 1, 2].map(f => both(spr(22, 16, g => {
      if (f === 2) { ell(g, 11, 8, 4, 6, '#6a3890'); poly(g, [7, 2, 4, 12, 8, 14], '#4a2070'); poly(g, [15, 2, 18, 12, 14, 14], '#4a2070'); ell(g, 9.4, 11, 1, 1, '#fff'); ell(g, 12.6, 11, 1, 1, '#fff'); rect(g, 10, 0, 2, 2, '#4a2070'); return; }
      const wy = f ? 2 : -3;
      poly(g, [9, 7, 0, 4 + wy, 3, 8 + wy, 1, 11 + wy * 0.6, 9, 10], '#4a2070'); poly(g, [13, 7, 22, 4 + wy, 19, 8 + wy, 21, 11 + wy * 0.6, 13, 10], '#4a2070');
      ell(g, 11, 9, 4.4, 4.6, '#7a48a8'); poly(g, [8, 6, 8, 2, 10, 5], '#7a48a8'); poly(g, [14, 6, 14, 2, 12, 5], '#7a48a8');
      ell(g, 9.4, 8.4, 1.4, 1.4, '#fff'); ell(g, 12.6, 8.4, 1.4, 1.4, '#fff'); rect(g, 9.4, 8, 1, 1.4, '#101010'); rect(g, 12.6, 8, 1, 1.4, '#101010'); rect(g, 10, 11, 2, 1, '#fff');
    }, '#100818')));
    A.sheet = [0, 1, 2].map(f => both(spr(26, 26, g => { // a bedsheet ghost (f 2: shy, hiding his face)
      g.fillStyle = '#f0f4ff'; g.beginPath(); g.moveTo(3, 24); g.quadraticCurveTo(1, 4, 13, 2); g.quadraticCurveTo(25, 4, 23, 24);
      for (let i = 0; i < 4; i++) g.quadraticCurveTo(21 - i * 5, 20 + ((i + f) % 2) * 4, 18 - i * 5, 24); g.closePath(); g.fill();
      ell(g, 9, 9, 4, 6, 'rgba(255,255,255,.9)');
      rect(g, 4, 20, 18, 1, '#c8d0f0');
      if (f === 2) { ell(g, 9, 12, 3.4, 2.6, '#f8f8ff'); ell(g, 17, 12, 3.4, 2.6, '#f8f8ff'); rect(g, 12, 16, 3, 1, '#e86888'); }
      else { ell(g, 10, 11, 2.2, 3, '#202040'); ell(g, 17, 11, 2.2, 3, '#202040'); ell(g, 10.6, 10, 0.8, 1, '#fff'); ell(g, 17.6, 10, 0.8, 1, '#fff'); ell(g, 14, 17, 3, 2, '#402040'); ell(g, 14, 18, 1.6, 0.8, '#e86888'); }
    }, '#383868')));
    A.crush = [0, 1].map(f => spr(28, 32, g => { // GRUMPY BRICK
      rect(g, 1, 1, 26, 30, '#8890a8'); rect(g, 1, 1, 26, 3, '#b8c0d8'); rect(g, 1, 28, 26, 3, '#585870'); rect(g, 1, 1, 3, 30, '#a0a8c0'); rect(g, 24, 1, 3, 30, '#686880');
      for (const [x, y] of [[3, 3], [22, 3], [3, 26], [22, 26]]) rect(g, x, y, 3, 3, '#d0d8f0');
      rect(g, 5, 9, 7, 6, '#fff'); rect(g, 16, 9, 7, 6, '#fff'); rect(g, f ? 6 : 8, 11, 3, 3, '#101010'); rect(g, f ? 19 : 17, 11, 3, 3, '#101010');
      poly(g, [4, 7, 12, 10, 12, 8, 4, 5], '#303040'); poly(g, [24, 7, 16, 10, 16, 8, 24, 5], '#303040');
      rect(g, 7, 20, 14, 5, '#303040'); for (let i = 0; i < 4; i++) rect(g, 8 + i * 3.4, 20, 2, f ? 5 : 2, '#fff');
    }, '#101018'));
    A.toffee = [0, 1].map(f => spr(16, 16, g => { ell(g, 8, 8, 7, 7, '#f86818'); ell(g, 8, 7, 6, 5.6, '#f8a028'); ell(g, 6, 5, 2.4, 2, '#fff0a0'); rect(g, 4, 7, 2, 3, '#301008'); rect(g, 10, 7, 2, 3, '#301008'); if (f) rect(g, 6, 11, 4, 1, '#301008'); }, '#401000'));
    A.tin = [0, 1].map(f => both(spr(16, 26, g => { // a toy tin soldier
      rect(g, 4, 0, 8, 8, '#202030'); rect(g, 4, 6, 8, 1, '#f8d020'); rect(g, 5, 8, 7, 5, '#f8c898'); rect(g, 9, 9, 1, 2, '#101010'); rect(g, 11, 11, 1, 1, '#d84040');
      rect(g, 3, 13, 10, 7, '#d82828'); rect(g, 7, 13, 2, 7, '#f8f0e0'); rect(g, 3, 18, 10, 1, '#f8d020'); rect(g, 12, 14, 3, 5, '#d82828');
      rect(g, 4 + (f ? 1 : 0), 20, 3, 5, '#202060'); rect(g, 9 - (f ? 1 : 0), 20, 3, 5, '#202060'); rect(g, 3 + f, 24, 4, 2, '#101010'); rect(g, 9 - f, 24, 4, 2, '#101010');
      ell(g, 6, 2, 1.4, 1.2, '#585870');
    }, '#100810')));
    A.tinPile = spr(18, 12, g => { rect(g, 2, 8, 6, 4, '#d82828'); rect(g, 9, 9, 7, 3, '#202060'); rect(g, 5, 4, 7, 5, '#202030'); rect(g, 5, 8, 7, 1, '#f8d020'); rect(g, 12, 6, 4, 3, '#f8c898'); rect(g, 13, 7, 1, 1, '#101010'); }, '#100810');
    A.fish = [0, 1].map(f => both(spr(18, 14, g => {
      poly(g, [2, 7, 0, 1 + f * 2, 0, 13 - f * 2], '#e86018'); ell(g, 10, 7, 7, 5.6, '#f88828'); ell(g, 10, 9, 5, 2.6, '#f8d098');
      poly(g, [8, 2, 12, 0, 13, 3], '#e86018'); ell(g, 13, 5.6, 2, 2, '#fff'); rect(g, 13.6, 5, 1, 1.6, '#101010'); rect(g, 16, 8, 2, 1, '#a02010');
    }, '#401000')));
    // ---- King Grumblesnout: a big grumpy boar in a crown (frames: stand, step, jump, dizzy, angry)
    A.boss = [0, 1, 2, 3, 4].map(f => both(spr(52, 52, g => {
      const bob = f === 1 ? 1 : 0, by = f === 2 ? -2 : 0;
      // cape
      poly(g, [10, 18 + by, 4, 46, 34, 46, 30, 18 + by], '#7a1838'); poly(g, [10, 18 + by, 8, 44, 16, 44], '#a82850');
      // legs
      rect(g, 15 - bob * 2, 40, 7, 10, '#a85860'); rect(g, 29 + bob * 2, 40, 7, 10, '#a85860'); rect(g, 13 - bob * 2, 47, 10, 4, '#3a2020'); rect(g, 28 + bob * 2, 47, 10, 4, '#3a2020');
      // tummy
      ell(g, 26, 32 + by, 15, 13, '#d07880'); ell(g, 27, 34 + by, 10, 9, '#f0b0b0');
      rect(g, 13, 38 + by, 26, 4, '#583010'); rect(g, 23, 37 + by, 6, 6, '#f8d020');
      // arms
      ell(g, 11, 30 + by - (f === 4 ? 6 : 0), 4, 6, '#c06870'); ell(g, 42, 30 + by - (f === 4 ? 6 : 0), 4, 6, '#c06870');
      // head
      ell(g, 28, 16 + by, 14, 11, '#d07880'); ell(g, 18, 8 + by, 4, 5, '#c06870', -0.5); ell(g, 37, 7 + by, 4, 5, '#c06870', 0.5);
      ell(g, 39, 19 + by, 7, 5.6, '#f0a0a8'); ell(g, 37, 19 + by, 1.4, 2, '#602030'); ell(g, 42, 19 + by, 1.4, 2, '#602030');
      poly(g, [33, 24 + by, 35, 30 + by, 37, 24 + by], '#fff8e0'); poly(g, [42, 23 + by, 44, 28 + by, 45, 22 + by], '#fff8e0'); // tusks
      if (f === 3) { // dizzy: swirly eyes
        g.strokeStyle = '#202020'; g.lineWidth = 1.2; for (const ex of [25, 32]) { g.beginPath(); g.arc(ex, 13 + by, 2.6, 0, 5.5); g.stroke(); }
      } else {
        ell(g, 25, 13 + by, 3, 3.4, '#fff'); ell(g, 32, 13 + by, 3, 3.4, '#fff'); rect(g, 26, 12 + by, 2, 3, '#101010'); rect(g, 33, 12 + by, 2, 3, '#101010');
        poly(g, [21, 8 + by, 28, 11 + by, 28, 9 + by, 22, 6 + by], '#401018'); poly(g, [36, 8 + by, 30, 11 + by, 30, 9 + by, 36, 6 + by], '#401018');
        if (f === 4) { rect(g, 22, 7 + by, 2, 2, '#f84040'); }
      }
      // crown
      poly(g, [17, 6 + by, 17, -0 + by + 1, 22, 4 + by, 27, -1 + by + 1, 32, 4 + by, 37, 1 + by, 37, 6 + by], '#f8c818'); rect(g, 17, 5 + by, 20, 2, '#c89010');
      ell(g, 27, 3 + by, 1.6, 1.6, '#e82848'); ell(g, 21, 5 + by, 1, 1, '#38a8f8'); ell(g, 33, 5 + by, 1, 1, '#38a8f8');
    }, '#200810')));
    // ---- Crumpet the dino-pal (facing right): walk 2 frames, gulp (mouth open), and the egg he hatches from
    const dino = (f, mouth) => spr(28, 30, g => {
      const st = f ? 2 : 0;
      ell(g, 6, 22, 6, 3, '#e87828', 0.5); // tail
      rect(g, 8 - st, 22, 5, 8, '#e87828'); rect(g, 15 + st, 22, 5, 8, '#e87828'); ell(g, 9 - st, 29, 4.4, 1.6, '#c85010'); ell(g, 17 + st, 29, 4.4, 1.6, '#c85010');
      ell(g, 13, 20, 9, 6.4, '#f89038'); ell(g, 14, 22, 6, 4, '#f8e0b0');
      rect(g, 7, 13, 10, 4, '#d82838'); rect(g, 7, 13, 10, 1, '#f86070'); // saddle
      rect(g, 18, 8, 6, 12, '#f89038'); // neck
      ell(g, 22, 7, 6, 5.6, '#f89038'); ell(g, 25, mouth ? 7 : 9, 4.6, mouth ? 2.4 : 3, '#f8a048');
      if (mouth) { poly(g, [22, 9, 28, 8, 28, 13, 23, 12], '#f89038'); rect(g, 23, 9, 5, 2, '#a01828'); }
      ell(g, 21, 4, 2.6, 3, '#fff'); rect(g, 21.6, 3, 1.4, 2.4, '#101010'); ell(g, 27, 7, 0.8, 0.8, '#a04010');
      for (let i = 0; i < 3; i++) poly(g, [16 - i * 3, 13, 14.6 - i * 3, 10, 13 - i * 3, 13], '#38b048'); // spines
      poly(g, [21, 1, 22, -1, 24, 2], '#38b048');
    }, '#301008');
    A.dino = [both(dino(0)), both(dino(1)), both(dino(0, 1))];
    A.egg = [0, 1].map(f => spr(16, 18, g => { ell(g, 8, 10, 6.4, 7.4, '#f8f8f0'); ell(g, 6, 7, 2, 2.4, '#fff'); for (const [x, y] of [[5, 12], [10, 8], [11, 14], [7, 4]]) ell(g, x, y, 1.6, 1.4, '#e87828'); if (f) poly(g, [2, 10, 5, 8, 8, 11, 11, 8, 14, 10, 14, 11, 2, 11], '#806040'); }, '#302010'));
    // ---- power-ups and pick-ups
    A.cake = spr(16, 16, g => { // a tea cake: a chocolate dome on a biscuit, in red foil
      ell(g, 8, 9, 7, 6.6, '#583018'); ell(g, 8, 8.6, 6.4, 6, '#784020'); ell(g, 5.6, 6, 2.2, 2.6, '#c08050', -0.5); ell(g, 5, 5.4, 0.8, 1, '#fff');
      rect(g, 1, 11, 14, 4, '#d82828'); rect(g, 1, 11, 14, 1, '#f86868'); for (let i = 0; i < 4; i++) rect(g, 2 + i * 4, 12, 2, 3, '#f8f0f0'); rect(g, 2, 15, 12, 1, '#901818');
      rect(g, 5, 10, 2, 1, '#f8f8f8'); rect(g, 9, 10, 2, 1, '#f8f8f8');
    }, '#200808');
    A.daisy = [0, 1].map(f => spr(16, 16, g => {
      rect(g, 7, 9, 2, 7, '#30a030'); ell(g, 4, 13, 3, 1.4, '#38b838', -0.4); ell(g, 12, 13, 3, 1.4, '#38b838', 0.4);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + f * 0.4; ell(g, 8 + Math.cos(a) * 4.4, 6 + Math.sin(a) * 4.4, 2.4, 2.4, i % 2 ? '#f8e048' : '#f8c018'); }
      ell(g, 8, 6, 3, 3, '#fff8f0'); for (let i = 0; i < 4; i++) rect(g, 6.4 + (i % 2) * 2.4, 4.6 + (i >> 1) * 2.4, 1, 1, '#f878b8'); rect(g, 6, 6, 1, 1, '#101010'); rect(g, 9, 6, 1, 1, '#101010');
    }, '#302008'));
    A.bag = spr(16, 16, g => { poly(g, [5, 4, 11, 4, 14, 12, 12, 15, 4, 15, 2, 12], '#282838'); poly(g, [6, 6, 8, 6, 6, 13, 4, 12], '#686880'); poly(g, [6, 4, 4, 0, 8, 3, 12, 0, 10, 4], '#282838'); rect(g, 5, 3, 6, 2, '#f8d020'); }, '#0c0c14');
    A.oneup = spr(16, 16, g => { ell(g, 8, 8, 7, 7, '#d89848'); ell(g, 8, 7.4, 6.4, 6.4, '#e8b060'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ell(g, 8 + Math.cos(a) * 5.6, 8 + Math.sin(a) * 5.6, 0.7, 0.7, '#a86828'); }
      poly(g, [8, 11.6, 4.4, 7.6, 5, 5.2, 7, 5, 8, 6.4, 9, 5, 11, 5.2, 11.6, 7.6], '#e01838'); rect(g, 5.6, 6, 1, 1, '#f88898'); }, '#301008');
    A.gbisc = [0, 1, 2, 3].map(f => spr(16, 26, g => { // a golden biscuit (spins)
      const sx = [1, 0.66, 0.2, 0.66][f]; g.translate(8, 13); g.scale(sx, 1); g.translate(-8, -13);
      g.fillStyle = '#c87808'; g.beginPath(); g.roundRect ? g.roundRect(1, 1, 14, 24, 4) : g.rect(1, 1, 14, 24); g.fill();
      g.fillStyle = '#f8c820'; g.beginPath(); g.roundRect ? g.roundRect(2, 2, 12, 22, 3) : g.rect(2, 2, 12, 22); g.fill();
      rect(g, 4, 4, 8, 18, '#f8e060'); rect(g, 4, 4, 8, 1, '#fff8c0');
      for (let i = 0; i < 3; i++) { ell(g, 8, 8 + i * 5, 2.4, 1.6, '#e8a010'); ell(g, 8, 7.6 + i * 5, 1.4, 0.8, '#fff0a0'); }
      for (let i = 0; i < 4; i++) { rect(g, 2.6, 5 + i * 5, 1, 1, '#a86008'); rect(g, 12.4, 5 + i * 5, 1, 1, '#a86008'); }
    }, '#402000'));
    A.coin = [0, 1, 2, 3].map(f => spr(12, 16, g => {
      const w = [5, 3.6, 1.4, 3.6][f]; ell(g, 6, 8, w, 7, '#c88008'); ell(g, 6, 8, Math.max(0.6, w - 1), 6, '#f8c818');
      if (f !== 2) { rect(g, 6 - w * 0.25, 4, Math.max(1, w * 0.4), 8, '#fff0a0'); } else rect(g, 5.4, 2, 1.2, 12, '#fff8c0');
    }, '#402000'));
    A.key = spr(18, 16, g => { ell(g, 5, 8, 4.6, 4.6, '#f8c818'); ell(g, 5, 8, 2, 2, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-out'; ell(g, 5, 8, 1.8, 1.8, '#000'); g.globalCompositeOperation = 'source-over';
      rect(g, 9, 7, 8, 3, '#f8c818'); rect(g, 13, 10, 2, 3, '#f8c818'); rect(g, 16, 10, 2, 4, '#f8c818'); rect(g, 9, 7, 8, 1, '#fff8a0'); ell(g, 4, 6, 1.4, 1, '#fff8a0'); }, '#402000');
    A.ball = [0, 1].map(f => spr(10, 10, g => { ell(g, 5, 5, 4, 4, '#f8e048'); ell(g, 5, 5, 2.6, 2.6, '#fff8e0'); rect(g, f ? 2 : 6, f ? 6 : 2, 2, 2, '#f878b8'); rect(g, f ? 6 : 3, f ? 3 : 6, 1, 1, '#78d8f8'); }, '#806000'));
    A.crumb = [0, 1].map(f => spr(14, 14, g => { ell(g, 7, 7, 6, 6, '#c88848'); ell(g, 6, 6, 4, 4, '#e8b070'); for (let i = 0; i < 5; i++) ell(g, 3 + ((i * 5 + f * 3) % 9), 3 + ((i * 7 + f) % 8), 1, 1, '#805020'); }, '#301808'));
    A.star = spr(9, 9, g => poly(g, [4.5, 0, 5.8, 3.2, 9, 3.4, 6.4, 5.6, 7.4, 9, 4.5, 7, 1.6, 9, 2.6, 5.6, 0, 3.4, 3.2, 3.2], '#fff8a0'), '#a87808');
    A.puff = [0, 1, 2].map(f => spr(16, 16, g => { const r = 3 + f * 2; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ell(g, 8 + Math.cos(a) * r, 8 + Math.sin(a) * r, 3.4 - f * 0.6, 3.4 - f * 0.6, '#fff'); } ell(g, 8, 8, r * 0.8, r * 0.8, f ? 'rgba(0,0,0,0)' : '#fff'); }, '#9898b0'));
    A.dust = [0, 1, 2].map(f => spr(8, 8, g => ell(g, 4, 4, 3.4 - f, 3.4 - f, ['#f8f8f8', '#e0e0e8', '#c0c0d0'][f])));
    A.spark = [0, 1].map(f => spr(9, 9, g => { rect(g, 4, f ? 1 : 0, 1, f ? 7 : 9, '#fff'); rect(g, f ? 1 : 0, 4, f ? 7 : 9, 1, '#fff'); rect(g, 3, 3, 3, 3, '#fff8a0'); }));
    A.mapPl = [0, 1].map(f => both(pix([...HEAD, ...(f ? SB.walk : SB.stand)], PAL)));
    return (ART = A);
  }

  // ---------------------------------------------------------------- tiles (16x16, one set per theme, built when a level loads)
  const TH = {
    grass: { top: '#48c038', top2: '#88e048', dirt: '#c88848', dirt2: '#a86830', dirt3: '#e8b070', hard: ['#c89868', '#f0c890', '#805830'], semi: ['#e8c050', '#f8e8a0', '#a07018'] },
    cave: { top: '#9890a8', top2: '#c8c0d8', dirt: '#5a4868', dirt2: '#3e3050', dirt3: '#7a6888', hard: ['#787088', '#a8a0b8', '#484058'], semi: ['#a87848', '#d8a870', '#684020'] },
    sky: { top: '#f8f0f8', top2: '#ffffff', dirt: '#f090b0', dirt2: '#d06890', dirt3: '#f8c0d0', hard: ['#e8b870', '#f8e0a8', '#a87838'], semi: ['#ffffff', '#ffffff', '#b8c8e8'] },
    ghost: { top: '#a87850', top2: '#c89870', dirt: '#584058', dirt2: '#402840', dirt3: '#705870', hard: ['#9a6838', '#c89058', '#583818'], semi: ['#9a6838', '#c89058', '#583818'] },
    water: { top: '#f8d880', top2: '#fff0b8', dirt: '#e8b060', dirt2: '#c08840', dirt3: '#f8d088', hard: ['#d89858', '#f8c888', '#986028'], semi: ['#f08898', '#f8c0c8', '#a84858'] },
    castle: { top: '#9898a8', top2: '#c0c0d0', dirt: '#686878', dirt2: '#484858', dirt3: '#888898', hard: ['#7880a0', '#a8b0c8', '#404860'], semi: ['#8a7060', '#b89880', '#4a3828'] },
  };
  function tiles(theme) {
    const P = TH[theme], C = {};
    const R = (seed) => { let a = seed; return () => (a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; };
    // ground: 16 variants by which sides are open (1 top, 2 left, 4 right, 8 bottom)
    C.ground = [];
    for (let m = 0; m < 16; m++) C.ground[m] = spr(16, 16, g => {
      const r = R(7 + m);
      rect(g, 0, 0, 16, 16, P.dirt);
      if (theme === 'castle' || theme === 'ghost') { // bricks / boards
        if (theme === 'castle') { for (let y = 0; y < 16; y += 8) { rect(g, 0, y + 7, 16, 1, P.dirt2); const o = (y / 8) % 2 ? 4 : 12; rect(g, o, y, 1, 7, P.dirt2); rect(g, 0, y, 16, 1, P.dirt3); } }
        else { for (let x = 0; x < 16; x += 8) { rect(g, x + 7, 0, 1, 16, P.dirt2); rect(g, x, 0, 1, 16, P.dirt3); } rect(g, 3, 5, 1, 1, P.dirt2); rect(g, 11, 10, 1, 1, P.dirt2); }
      } else if (theme === 'sky') { // a wafer biscuit: pink layers with a cream filling
        for (let y = 0; y < 16; y += 4) { rect(g, 0, y, 16, 1, P.dirt3); rect(g, 0, y + 3, 16, 1, P.dirt2); }
        for (let x = 0; x < 16; x += 4) rect(g, x, 0, 1, 16, 'rgba(160,40,80,.35)');
      } else {
        for (let i = 0; i < 7; i++) { const x = r() * 14 | 0, y = r() * 14 | 0; rect(g, x, y, 2, 2, P.dirt2); rect(g, x, y, 1, 1, P.dirt3); }
        if (theme === 'cave' && r() < 0.12) { const x = 3 + r() * 9 | 0, y = 4 + r() * 8 | 0; poly(g, [x, y + 3, x + 2, y - 1, x + 4, y + 3], '#68d8f0'); rect(g, x + 1, y + 1, 1, 1, '#e0ffff'); }
        if (theme === 'water') for (let i = 0; i < 3; i++) ell(g, r() * 16, r() * 16, 1.2, 0.8, '#f8f0d8');
      }
      if (m & 2) { rect(g, 0, 0, 2, 16, P.dirt2); rect(g, 0, 0, 1, 16, 'rgba(0,0,0,.35)'); }
      if (m & 4) { rect(g, 14, 0, 2, 16, P.dirt2); rect(g, 15, 0, 1, 16, 'rgba(0,0,0,.45)'); }
      if (m & 8) { rect(g, 0, 14, 16, 2, P.dirt2); rect(g, 0, 15, 16, 1, 'rgba(0,0,0,.4)'); }
      if (m & 1) {
        if (theme === 'grass') { rect(g, 0, 0, 16, 5, P.top); rect(g, 0, 0, 16, 2, P.top2); for (let x = 0; x < 16; x += 3) rect(g, x + 1, 5, 2, 1 + ((x * 7) % 3), P.top); rect(g, 0, 6, 16, 1, 'rgba(60,30,0,.25)'); if (m & 2) rect(g, 0, 0, 2, 6, '#309028'); if (m & 4) rect(g, 14, 0, 2, 6, '#309028'); }
        else if (theme === 'sky') { rect(g, 0, 0, 16, 3, '#f8e8c0'); rect(g, 0, 0, 16, 1, '#fff'); rect(g, 0, 3, 16, 1, '#d8a878'); }
        else if (theme === 'water') { rect(g, 0, 0, 16, 3, P.top); rect(g, 0, 0, 16, 1, P.top2); }
        else if (theme === 'cave') { rect(g, 0, 0, 16, 3, P.top); rect(g, 0, 0, 16, 1, P.top2); rect(g, 4, 3, 3, 1, P.top); rect(g, 11, 3, 2, 1, P.top); }
        else if (theme === 'ghost') { rect(g, 0, 0, 16, 4, P.top); rect(g, 0, 0, 16, 1, P.top2); rect(g, 0, 4, 16, 1, '#281828'); }
        else { rect(g, 0, 0, 16, 3, P.top); rect(g, 0, 0, 16, 1, P.top2); }
      }
    });
    C.groundD = [1, 2, 3].map(d => C.ground.map(t => { const c = mk(16, 16), g = c.getContext('2d'); g.drawImage(t, 0, 0); g.fillStyle = `rgba(20,0,30,${d * 0.09})`; g.fillRect(0, 0, 16, 16); return c; }));
    const bevel = (g, c) => { rect(g, 0, 0, 16, 16, c[0]); rect(g, 0, 0, 16, 2, c[1]); rect(g, 0, 0, 2, 16, c[1]); rect(g, 0, 14, 16, 2, c[2]); rect(g, 14, 0, 2, 16, c[2]); };
    C.hard = spr(16, 16, g => { bevel(g, P.hard); if (theme === 'ghost') { rect(g, 2, 7, 12, 2, P.hard[2]); poly(g, [3, 3, 5, 3, 13, 12, 11, 12], P.hard[2]); } else { rect(g, 4, 4, 8, 8, P.hard[2]); rect(g, 5, 5, 6, 6, P.hard[0]); rect(g, 5, 5, 6, 1, P.hard[1]); } });
    C.semi = [0, 1, 2].map(p => spr(16, 16, g => { // left, middle, right
      if (theme === 'sky') { ell(g, 8, 8, p === 1 ? 10 : 7, 6, '#fff'); ell(g, p === 0 ? 10 : p === 2 ? 6 : 8, 5, 6, 4, '#fff'); ell(g, 8, 12, 9, 2, '#d0d8f0'); return; }
      rect(g, 0, 0, 16, 7, P.semi[0]); rect(g, 0, 0, 16, 2, P.semi[1]); rect(g, 0, 6, 16, 1, P.semi[2]);
      if (theme === 'grass') { for (let i = 0; i < 4; i++) ell(g, 2 + i * 4, 3.6, 1.2, 1.2, '#fff8d0'); rect(g, 0, 7, 16, 1, 'rgba(0,0,0,.3)'); }
      else if (theme === 'water') { for (let i = 0; i < 3; i++) ell(g, 3 + i * 5, 4, 1.4, 1, '#fff'); }
      else { rect(g, 5, 2, 1, 4, P.semi[2]); rect(g, 12, 2, 1, 4, P.semi[2]); }
      if (p === 0) { rect(g, 0, 0, 1, 7, P.semi[2]); } if (p === 2) rect(g, 15, 0, 1, 7, P.semi[2]);
    }, theme === 'sky' ? '#a0b0d8' : '#201010'));
    return C;
  }
  // the blocks and things that look the same everywhere
  let TC = null;
  function common() {
    if (TC) return TC;
    const C = {};
    C.brick = spr(16, 16, g => { rect(g, 0, 0, 16, 16, '#c86020'); for (let y = 0; y < 16; y += 4) { rect(g, 0, y, 16, 1, '#f8a058'); rect(g, 0, y + 3, 16, 1, '#702808'); const o = (y / 4) % 2 ? 4 : 11; rect(g, o, y, 1, 4, '#702808'); rect(g, o + 1, y + 1, 1, 2, '#f8a058'); } });
    C.q = [0, 1, 2, 3].map(f => spr(16, 16, g => {
      const sh = [0, 0.15, 0.35, 0.15][f];
      rect(g, 0, 0, 16, 16, '#c87808'); rect(g, 1, 1, 14, 14, f === 2 ? '#f8d050' : '#f8b818'); rect(g, 1, 1, 14, 2, '#fff0a0'); rect(g, 1, 13, 14, 2, '#c87808');
      for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) rect(g, x, y, 2, 2, '#906008');
      g.fillStyle = '#583008'; // the question mark (its shadow, then itself)
      const qm = [[5, 4, 6, 2], [10, 5, 2, 3], [8, 8, 3, 2], [7, 9, 2, 2], [7, 12, 2, 2], [4, 5, 2, 2]];
      for (const [x, y, w, h] of qm) rect(g, x + 1, y + 1, w, h, '#a86008'); for (const [x, y, w, h] of qm) rect(g, x, y, w, h, sh ? '#fff8e0' : '#fff');
    }));
    C.used = spr(16, 16, g => { rect(g, 0, 0, 16, 16, '#7a4818'); rect(g, 1, 1, 14, 14, '#a86828'); rect(g, 1, 1, 14, 1, '#c88848'); for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) rect(g, x, y, 2, 2, '#583008'); });
    C.msg = spr(16, 16, g => { rect(g, 0, 0, 16, 16, '#5838a8'); rect(g, 1, 1, 14, 14, '#8868e0'); rect(g, 1, 1, 14, 2, '#b8a0f8'); rect(g, 1, 13, 14, 2, '#5838a8'); ell(g, 8, 7, 5, 3.6, '#fff'); poly(g, [5, 9, 4, 12, 8, 10], '#fff'); for (let i = 0; i < 3; i++) rect(g, 5 + i * 2.4, 6.6, 1.4, 1.4, '#5838a8'); });
    C.jelly = [0, 1].map(f => spr(16, 16, g => { ell(g, 8, 9 + f, 8, 7 - f, '#e83888'); ell(g, 8, 8 + f, 7, 6 - f, '#f878b8'); ell(g, 5, 5 + f, 2.6, 1.6, '#ffd0e8'); rect(g, 4, 10, 2, 2, '#c01868'); rect(g, 10, 10, 2, 2, '#c01868'); rect(g, 7, 12, 2, 1, '#c01868'); }, '#600830'));
    // drainpipes, in copper
    // drainpipes, in copper (a lip on top, a round body: lit from the left)
    const pipeCol = (g, x0, x1, y0, y1) => { const cols = ['#5a2008', '#a84c18', '#e88a40', '#f8c890', '#f0a058', '#d87830', '#c06020', '#a04810', '#803410', '#5a2008']; const w = x1 - x0; for (let i = 0; i < w; i++) { g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(i / w * cols.length))]; g.fillRect(x0 + i, y0, 1, y1 - y0); } };
    const pipeTop = side => spr(16, 16, g => { const c = mk(32, 16), cg = c.getContext('2d'); pipeCol(cg, 0, 32, 0, 12); cg.fillStyle = '#3a1404'; cg.fillRect(0, 12, 32, 1); pipeCol(cg, 3, 29, 13, 16); cg.fillStyle = 'rgba(255,240,200,.5)'; cg.fillRect(0, 0, 32, 1); cg.fillStyle = 'rgba(60,20,0,.35)'; cg.fillRect(0, 10, 32, 2); g.drawImage(c, side ? -16 : 0, 0); });
    const pipeBody = side => spr(16, 16, g => { const c = mk(32, 16), cg = c.getContext('2d'); pipeCol(cg, 3, 29, 0, 16); for (let y = 3; y < 16; y += 8) { cg.fillStyle = 'rgba(60,20,0,.25)'; cg.fillRect(3, y, 26, 1); } g.drawImage(c, side ? -16 : 0, 0); });
    C.pipeTL = pipeTop(0); C.pipeTR = pipeTop(1); C.pipeL = pipeBody(0); C.pipeR = pipeBody(1);
    C.spike = spr(16, 16, g => { rect(g, 0, 12, 16, 4, '#686878'); for (let i = 0; i < 4; i++) { poly(g, [i * 4, 12, i * 4 + 2, 3, i * 4 + 4, 12], '#e0e0f0'); poly(g, [i * 4 + 2, 3, i * 4 + 4, 12, i * 4 + 2.6, 12], '#9898a8'); } }, '#202028');
    C.lavaTop = [0, 1, 2, 3].map(f => spr(16, 16, g => { rect(g, 0, 4, 16, 12, '#e83808'); for (let x = 0; x < 16; x++) { const y = 3 + Math.round(Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.6); rect(g, x, y, 1, 3, '#f89818'); rect(g, x, y, 1, 1, '#fff070'); } ell(g, (f * 5) % 16, 10, 2, 1, '#f86818'); }));
    C.lava = spr(16, 16, g => { rect(g, 0, 0, 16, 16, '#d82808'); ell(g, 5, 6, 3, 1.4, '#f05010'); ell(g, 12, 12, 2.4, 1.2, '#f05010'); });
    C.waterTop = [0, 1, 2, 3].map(f => { const c = mk(16, 16), g = c.getContext('2d'); g.fillStyle = 'rgba(80,160,248,.42)'; g.fillRect(0, 4, 16, 12); for (let x = 0; x < 16; x++) { const y = 3 + Math.round(Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.4); g.fillStyle = 'rgba(220,248,255,.85)'; g.fillRect(x, y, 1, 1); g.fillStyle = 'rgba(120,200,255,.6)'; g.fillRect(x, y + 1, 1, 2); } return c; });
    C.water = (() => { const c = mk(16, 16), g = c.getContext('2d'); g.fillStyle = 'rgba(56,120,232,.42)'; g.fillRect(0, 0, 16, 16); return c; })();
    C.door = [0, 1].map(f => spr(16, 32, g => { // a creaky door (f 1: the exit, with a light)
      rect(g, 0, 0, 16, 32, '#402018'); rect(g, 2, 2, 12, 30, f ? '#c84828' : '#7a4828'); for (let y = 4; y < 30; y += 7) rect(g, 3, y, 10, 1, f ? '#902810' : '#583010');
      rect(g, 2, 2, 12, 1, f ? '#f87848' : '#a87048'); ell(g, 11, 18, 1.4, 1.4, '#f8d020'); if (f) { ell(g, 8, 8, 3, 3, '#f8f088'); rect(g, 8, 5, 1, 6, '#c84828'); rect(g, 5, 8, 6, 1, '#c84828'); }
    }, '#100808'));
    C.bigdoor = spr(32, 48, g => { rect(g, 0, 4, 32, 44, '#302028'); g.fillStyle = '#583848'; g.beginPath(); g.arc(16, 16, 14, Math.PI, 0); g.lineTo(30, 48); g.lineTo(2, 48); g.fill(); for (let x = 6; x < 30; x += 6) rect(g, x, 6, 2, 42, '#402030'); for (let y = 18; y < 48; y += 10) rect(g, 2, y, 28, 3, '#806070'); ell(g, 16, 8, 4, 3, '#e8c020'); rect(g, 15, 9, 2, 3, '#e8c020'); }, '#100810');
    C.keyhole = spr(16, 32, g => { ell(g, 8, 9, 6.4, 6.4, '#101018'); poly(g, [3, 12, 13, 12, 15, 30, 1, 30], '#101018'); ell(g, 8, 9, 3, 3, '#282840'); }, '#f8d020');
    return (TC = C);
  }

  // ---------------------------------------------------------------- the backgrounds (parallax layers, drawn once per level)
  function backdrop(theme) {
    const sky = mk(W, H), sg = sky.getContext('2d');
    const L = []; // { c, f (x speed), fy (y speed), y (screen y when the camera is at the bottom), drift }
    const lay = (w, h, f, fy, y, fn, drift) => { const c = mk(w, h); fn(c.getContext('2d'), w, h); crisp(c); L.push({ c, f, fy, y, drift: drift || 0 }); };
    const R = (seed) => { let a = seed; return () => (a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; };
    const r = R(theme.length * 977);
    const cloud = (g, x, y, s, col, sh) => { for (let i = 0; i < 4; i++) ell(g, x + (i - 1.5) * 9 * s, y - (i % 3 === 1 ? 4 : 1) * s, 10 * s, 7 * s, sh); for (let i = 0; i < 4; i++) ell(g, x + (i - 1.5) * 9 * s, y - 2 - (i % 3 === 1 ? 4 : 1) * s, 9 * s, 6 * s, col); ell(g, x - 6 * s, y - 6 * s, 3 * s, 2 * s, '#fff'); };
    if (theme === 'grass') {
      sg.fillStyle = grad(sg, 0, 0, 0, H, ['#5098f0', '#88c8f8', '#d0f0ff']); sg.fillRect(0, 0, W, H);
      lay(512, 120, 0.06, 0.02, 10, g => { for (let i = 0; i < 6; i++) cloud(g, 40 + i * 90 + r() * 30, 30 + r() * 50, 0.8 + r() * 0.6, '#ffffff', '#c0e0f8'); }, 0.12);
      lay(512, 150, 0.15, 0.08, 74, g => { // far blue-green hills
        for (let i = 0; i < 6; i++) { const x = i * 96 + r() * 30, w = 70 + r() * 40, h = 70 + r() * 50; ell(g, x, 150, w, h, '#78c0a0'); ell(g, x - w * 0.3, 150 - h * 0.6, w * 0.25, h * 0.15, '#98d8b8'); ell(g, x + 512, 150, w, h, '#78c0a0'); }
      });
      lay(512, 130, 0.32, 0.18, 104, g => { // the big round hills with stripes (and a face or two, because why not)
        for (let i = 0; i < 5; i++) {
          const x = i * 110 + 30 + r() * 30, w = 40 + r() * 20, h = 70 + r() * 50;
          const draw = (ox) => {
            g.save(); g.beginPath(); g.ellipse(ox, 130, w, h, 0, 0, Math.PI * 2); g.clip();
            g.fillStyle = '#30a048'; g.fillRect(ox - w, 130 - h, w * 2, h);
            for (let s = 0; s < 8; s++) { g.fillStyle = s % 2 ? '#28903e' : '#40b858'; g.fillRect(ox - w, 130 - h + s * (h / 8) + 4, w * 2, h / 16); }
            g.fillStyle = 'rgba(0,40,0,.25)'; g.fillRect(ox + w * 0.35, 130 - h, w, h);
            g.restore(); ell(g, ox - w * 0.4, 130 - h * 0.78, w * 0.18, h * 0.08, '#88e090');
            if (i % 2 === 0) { rect(g, ox - 8, 130 - h * 0.62, 3, 6, '#103010'); rect(g, ox + 5, 130 - h * 0.62, 3, 6, '#103010'); rect(g, ox - 7, 130 - h * 0.62, 1, 2, '#fff'); rect(g, ox + 6, 130 - h * 0.62, 1, 2, '#fff'); }
          };
          draw(x); if (x + w > 512) draw(x - 512); if (x - w < 0) draw(x + 512);
        }
      });
      lay(512, 40, 0.55, 0.3, 190, g => { for (let i = 0; i < 14; i++) { const x = i * 38 + r() * 10, s = 0.7 + r() * 0.5; for (const ox of [x, x - 512]) { ell(g, ox, 40, 18 * s, 14 * s, '#1a7830'); ell(g, ox - 4, 34, 10 * s, 8 * s, '#28903e'); ell(g, ox - 8 * s, 30, 3 * s, 2 * s, '#58c060'); } } });
    } else if (theme === 'cave') {
      sg.fillStyle = grad(sg, 0, 0, 0, H, ['#100818', '#281838', '#382040']); sg.fillRect(0, 0, W, H);
      lay(512, 224, 0.15, 0.1, 0, g => { // far rock columns
        for (let i = 0; i < 8; i++) { const x = i * 64 + r() * 30, w = 14 + r() * 20; g.fillStyle = grad(g, x - w, 0, x + w, 0, ['#2a1a38', '#3a2850', '#201430']); g.fillRect(x - w, 0, w * 2, 224); for (let y = 0; y < 224; y += 24) rect(g, x - w, y + r() * 10, w * 2, 2, '#1a1028'); }
      });
      lay(512, 224, 0.38, 0.25, 0, g => { // stalactites, stalagmites and glowing crystals
        for (let i = 0; i < 16; i++) { const x = i * 32 + r() * 20, h = 20 + r() * 50; poly(g, [x - 10, 0, x + 10, 0, x + 1, h], '#4a3060'); poly(g, [x - 10, 0, x - 2, 0, x + 1, h], '#5a4078'); }
        for (let i = 0; i < 12; i++) { const x = i * 44 + r() * 20, h = 18 + r() * 40; poly(g, [x - 12, 224, x + 12, 224, x, 224 - h], '#3a2450'); }
        for (let i = 0; i < 9; i++) { const x = r() * 512, y = 60 + r() * 120; g.fillStyle = 'rgba(80,220,255,.12)'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); poly(g, [x - 3, y + 4, x, y - 6, x + 3, y + 4], '#68d8f0'); poly(g, [x + 2, y + 4, x + 5, y - 2, x + 7, y + 4], '#48a8d8'); }
      });
    } else if (theme === 'sky') {
      sg.fillStyle = grad(sg, 0, 0, 0, H, ['#5878e0', '#a090e8', '#f8a8a0', '#f8d8a0']); sg.fillRect(0, 0, W, H);
      sg.fillStyle = '#fff8d0'; sg.beginPath(); sg.arc(190, 150, 22, 0, 7); sg.fill(); sg.fillStyle = 'rgba(255,248,208,.25)'; sg.beginPath(); sg.arc(190, 150, 34, 0, 7); sg.fill();
      lay(512, 224, 0.08, 0.04, 0, g => { for (let i = 0; i < 9; i++) cloud(g, r() * 512, 60 + r() * 150, 1 + r() * 1.2, '#f8e8f0', '#d8b8d8'); }, 0.06);
      lay(512, 120, 0.2, 0.12, 110, g => { // floating far-off islands
        for (let i = 0; i < 4; i++) { const x = 60 + i * 128 + r() * 30, y = 40 + r() * 50, w = 24 + r() * 16; poly(g, [x - w, y, x + w, y, x + w * 0.4, y + w * 0.9, x - w * 0.2, y + w * 1.1], '#9878a8'); ell(g, x, y, w + 2, 6, '#78b888'); ell(g, x - 6, y - 8, 7, 9, '#58a070'); }
      });
      lay(512, 80, 0.45, 0.3, 160, g => { for (let i = 0; i < 8; i++) cloud(g, i * 64 + r() * 20, 50 + r() * 20, 1.4 + r() * 0.5, '#ffffff', '#e0d0e8'); g.fillStyle = '#ffffff'; g.fillRect(0, 54, 512, 26); });
    } else if (theme === 'ghost') {
      sg.fillStyle = grad(sg, 0, 0, 0, H, ['#180c20', '#281838']); sg.fillRect(0, 0, W, H);
      lay(256, 224, 0.5, 0.5, 0, g => { // the wallpaper, windows with the moon, portraits
        for (let x = 0; x < 256; x += 16) { rect(g, x, 0, 8, 224, '#302040'); rect(g, x + 8, 0, 8, 224, '#2a1a38'); for (let y = 8; y < 224; y += 32) { ell(g, x + 4, y, 2, 3, '#3a2850'); } }
        for (let i = 0; i < 2; i++) { const x = 30 + i * 128; rect(g, x - 2, 40, 44, 60, '#584030'); rect(g, x, 42, 40, 56, '#101838'); ell(g, x + 28, 56, 7, 7, '#f8f0c0'); ell(g, x + 31, 54, 6, 6, '#101838'); rect(g, x + 19, 42, 2, 56, '#584030'); rect(g, x, 68, 40, 2, '#584030'); }
        { const x = 100; rect(g, x - 3, 52, 30, 38, '#a88838'); rect(g, x, 55, 24, 32, '#403048'); ell(g, x + 12, 66, 7, 8, '#706080'); rect(g, x + 4, 76, 16, 11, '#605070'); rect(g, x + 8, 64, 2, 2, '#f8f8f8'); rect(g, x + 14, 64, 2, 2, '#f8f8f8'); }
        rect(g, 0, 150, 256, 4, '#584030'); rect(g, 0, 154, 256, 70, '#22142c');
        for (let x = 0; x < 256; x += 24) rect(g, x, 154, 2, 70, '#1a0e22');
      });
    } else if (theme === 'water') {
      sg.fillStyle = grad(sg, 0, 0, 0, H, ['#58b8f8', '#2878d8', '#1848a8', '#103070']); sg.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) { sg.fillStyle = 'rgba(200,240,255,.07)'; poly(sg, [20 + i * 44, 0, 44 + i * 44, 0, 10 + i * 44 + 30, H, i * 44 - 20, H], 'rgba(200,240,255,.07)'); }
      lay(512, 160, 0.2, 0.15, 64, g => { for (let i = 0; i < 7; i++) { const x = i * 80 + r() * 30, h = 50 + r() * 70; poly(g, [x - 30, 160, x - 14, 160 - h, x + 8, 160 - h * 0.8, x + 34, 160], '#184888'); } });
      lay(512, 100, 0.45, 0.35, 124, g => {
        for (let i = 0; i < 14; i++) { const x = i * 37 + r() * 14, h = 30 + r() * 50; g.strokeStyle = i % 2 ? '#38a058' : '#48c068'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, 100); for (let y = 0; y < h; y += 6) g.lineTo(x + Math.sin(y / 9 + i) * 4, 100 - y); g.stroke(); }
        for (let i = 0; i < 8; i++) { const x = r() * 512; ell(g, x, 98, 8, 6, '#e87888'); ell(g, x - 5, 92, 4, 5, '#f8a0b0'); ell(g, x + 6, 93, 3, 4, '#f8a0b0'); }
      });
    } else { // castle
      sg.fillStyle = grad(sg, 0, 0, 0, H, ['#100810', '#281420', '#401818']); sg.fillRect(0, 0, W, H);
      lay(256, 224, 0.4, 0.4, 0, g => {
        for (let y = 0; y < 224; y += 12) for (let x = 0; x < 256; x += 24) { const o = (y / 12) % 2 ? 12 : 0; rect(g, x + o, y, 23, 11, '#2a2030'); rect(g, x + o, y, 23, 1, '#3a3040'); }
        for (let i = 0; i < 2; i++) { const x = 40 + i * 128; g.fillStyle = '#100808'; g.beginPath(); g.arc(x + 16, 60, 16, Math.PI, 0); g.fillRect(x, 60, 32, 50); g.fill(); g.fillStyle = grad(g, 0, 50, 0, 110, ['#301010', '#a83010']); g.fillRect(x + 3, 60, 26, 50); g.beginPath(); g.arc(x + 16, 60, 13, Math.PI, 0); g.fill(); rect(g, x + 15, 46, 2, 64, '#100808'); rect(g, x, 82, 32, 2, '#100808'); }
        for (let i = 0; i < 2; i++) { const x = 104 + i * 128; rect(g, x, 0, 16, 224, '#382838'); rect(g, x, 0, 3, 224, '#4a3a4a'); rect(g, x + 13, 0, 3, 224, '#201820'); }
      });
    }
    return { sky, L };
  }

  // decorations (no collision): drawn behind everything in the level
  let DECO = null;
  function decos() {
    if (DECO) return DECO;
    const D = {};
    D.bush = spr(48, 20, g => { for (let i = 0; i < 4; i++) ell(g, 8 + i * 11, 13 - (i % 2) * 3, 9, 8, '#289838'); for (let i = 0; i < 4; i++) ell(g, 6 + i * 11, 10 - (i % 2) * 3, 5, 4, '#48c050'); rect(g, 0, 18, 48, 2, '#289838'); }, '#104010');
    D.fence = spr(48, 18, g => { for (let i = 0; i < 4; i++) { rect(g, 4 + i * 12, 2, 4, 16, '#f8e8c8'); poly(g, [4 + i * 12, 2, 6 + i * 12, 0, 8 + i * 12, 2], '#f8e8c8'); rect(g, 7 + i * 12, 3, 1, 15, '#c8b090'); } rect(g, 0, 6, 48, 3, '#e8d0a8'); rect(g, 0, 12, 48, 3, '#e8d0a8'); }, '#403020');
    D.flower = [0, 1].map(f => spr(10, 14, g => { rect(g, 4, 5, 2, 9, '#30a030'); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + f * 0.3; ell(g, 5 + Math.cos(a) * 2.6, 4 + Math.sin(a) * 2.6, 1.8, 1.8, f ? '#f85878' : '#f8f8f8'); } ell(g, 5, 4, 1.4, 1.4, '#f8d020'); }, '#183010'));
    D.sign = spr(20, 26, g => { rect(g, 8, 10, 4, 16, '#a06830'); rect(g, 1, 2, 18, 11, '#d89850'); rect(g, 1, 2, 18, 2, '#f8c880'); poly(g, [15, 7.5, 9, 4, 9, 6, 5, 6, 5, 9, 9, 9, 9, 11], '#583010'); }, '#301808');
    D.crystal = spr(16, 20, g => { poly(g, [2, 20, 5, 6, 8, 20], '#48b8e8'); poly(g, [6, 20, 9, 1, 13, 20], '#68d8f8'); poly(g, [9, 1, 11, 20, 13, 20], '#3898c8'); poly(g, [11, 20, 14, 10, 16, 20], '#48b8e8'); rect(g, 8, 6, 1, 6, '#e8ffff'); }, '#102838');
    D.torch = [0, 1, 2].map(f => spr(12, 24, g => { rect(g, 4, 10, 4, 14, '#605050'); rect(g, 2, 9, 8, 3, '#808080'); ell(g, 6, 5 + (f % 2), 4 - (f === 2 ? 1 : 0), 5, '#f86818'); ell(g, 6, 6, 2.4, 3, '#f8d048'); ell(g, 6, 7, 1, 1.4, '#fff8c0'); }, '#200808'));
    D.candle = [0, 1].map(f => spr(10, 18, g => { rect(g, 3, 8, 4, 10, '#f0e8d8'); rect(g, 2, 16, 6, 2, '#a88838'); ell(g, 5, 4 + f, 2.4, 3.4, '#f8a830'); ell(g, 5, 5 + f, 1.2, 1.8, '#fff8c0'); }, '#201010'));
    D.cobweb = spr(24, 24, g => { g.strokeStyle = 'rgba(220,220,240,.8)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { const a = i / 4 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); g.stroke(); } for (let r = 6; r < 24; r += 6) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI / 2); g.stroke(); } });
    D.weed = [0, 1].map(f => spr(12, 32, g => { g.strokeStyle = '#38b058'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 32); for (let y = 0; y < 30; y += 4) g.lineTo(6 + Math.sin(y / 6 + f * 1.5) * 3, 32 - y); g.stroke(); }, '#0c4020'));
    D.banner = spr(20, 32, g => { rect(g, 0, 0, 20, 3, '#806040'); poly(g, [2, 3, 18, 3, 18, 30, 10, 24, 2, 30], '#a81830'); ell(g, 10, 13, 4, 4, '#f8c818'); rect(g, 9, 8, 2, 10, '#a81830'); }, '#200808');
    D.chain = spr(8, 48, g => { for (let y = 0; y < 48; y += 6) { g.strokeStyle = y % 12 ? '#686878' : '#9898a8'; g.lineWidth = 2; g.strokeRect(2, y + 1, 4, 5); } });
    D.palm = spr(40, 56, g => { for (let y = 20; y < 56; y += 4) ell(g, 20 + (56 - y) * 0.1, y, 3.4, 2.4, y % 8 ? '#a87038' : '#c89058'); for (let i = 0; i < 5; i++) { const a = -Math.PI + i * Math.PI / 4; g.strokeStyle = '#38a848'; g.lineWidth = 5; g.beginPath(); g.moveTo(22, 20); g.quadraticCurveTo(22 + Math.cos(a) * 14, 12 + Math.sin(a) * 14, 22 + Math.cos(a) * 20, 20 + Math.sin(a) * 6 + 6); g.stroke(); } ell(g, 20, 22, 3, 3, '#805020'); ell(g, 25, 23, 3, 3, '#805020'); }, '#183010');
    D.arrow = spr(18, 12, g => { poly(g, [0, 4, 10, 4, 10, 0, 18, 6, 10, 12, 10, 8, 0, 8], '#f8d020'); }, '#402000');
    return (DECO = D);
  }

  // ---------------------------------------------------------------- the levels
  // Built from little ASCII stamps put at tile positions. Map letters:
  //  # ground   X hard block   B brick   ? coin block   P power block (tea cake when small)   F bag block (the cape)
  //  1 extra-life block   E egg block (Crumpet)   m coin brick (lots of coins)   M message block   i hidden coin block
  //  I hidden 1-up block   = ledge (jump up through it)   o coin   ^ spikes   J jelly block   ~ lava top   L lava
  //  w water top   W water   [ ] { } a drainpipe (top left, top right, body left, body right)
  // Things: c conker   k cuppa crab   p prickle   z bee (side to side)   Z bee (up and down)   v bat   g ghost
  //  T grumpy brick   t hot toffee   s tin soldier   f fish   G golden biscuit   K key   H keyhole   * midway tape
  //  ! goal   S start   e loose egg (Crumpet waiting)   Q crumbly biscuit (falls)
  const TID = { '#': 1, X: 5, B: 2, '?': 3, P: 3, F: 3, '1': 3, E: 3, m: 2, M: 19, i: 20, I: 20, '=': 6, o: 7, '^': 12, J: 17, '~': 13, L: 14, w: 15, W: 16, '[': 8, ']': 9, '{': 10, '}': 11 };
  const QC = { '?': 'coin', P: 'pow', F: 'bag', '1': 'oneup', E: 'egg', m: 'coins', i: 'coin', I: 'oneup' };
  const OBJ = { c: 'conk', k: 'crab', p: 'prick', z: 'bee', Z: 'beev', v: 'bat', g: 'sheet', T: 'crush', t: 'toffee', s: 'tin', f: 'fish', G: 'gbisc', K: 'key', H: 'keyhole', '*': 'mid', '!': 'goal', e: 'dino' };
  function builder(o) {
    const w = o.w, h = o.h, g = new Uint8Array(w * h);
    const L = { name: o.name, theme: o.theme, w, h, g, q: {}, msg: {}, objs: [], deco: [], rooms: [], doors: [], plats: [], start: { x: 2, y: h - 5 }, time: o.time || 300, song: o.song || o.theme, water: 0 };
    const set = (x, y, id) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = id; };
    const B = {
      L,
      fill(x0, y0, x1, y1, id) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, id == null ? 1 : id); return B; },
      ground(x0, x1, top) { return B.fill(x0, top, x1, h - 1, 1); },
      clear(x0, y0, x1, y1) { return B.fill(x0, y0, x1, y1, 0); },
      at(x, y, s) {
        s.split('\n').forEach((row, dy) => {
          for (let dx = 0; dx < row.length; dx++) {
            const ch = row[dx], X = x + dx, Y = y + dy;
            if (ch === ' ' || ch === '.') continue;
            if (TID[ch] != null) { set(X, Y, TID[ch]); if (QC[ch]) L.q[X + ',' + Y] = QC[ch]; }
            else if (ch === 'S') L.start = { x: X, y: Y };
            else if (OBJ[ch]) L.objs.push({ k: OBJ[ch], x: X, y: Y });
          }
        });
        return B;
      },
      pipe(x, top, bot) { set(x, top, 8); set(x + 1, top, 9); for (let y = top + 1; y <= (bot == null ? h - 1 : bot); y++) { set(x, y, 10); set(x + 1, y, 11); } return B; },
      msg(x, y, text) { set(x, y, 19); L.msg[x + ',' + y] = text; return B; },
      deco(k, x, y) { L.deco.push({ k, x: x * T, y: y * T }); return B; },
      room(x0, x1, y0, y1) { L.rooms.push({ x0: x0 * T, x1: (x1 + 1) * T, y0: y0 * T, y1: (y1 + 1) * T }); return B; },
      door(x, y, tx, ty, exit) { L.doors.push({ x: x * T, y: y * T, tx: tx * T, ty: ty * T, exit: exit || '' }); return B; },
      // a moving platform: kind 'h' (side to side), 'v' (up and down), 'f' (falls when you stand on it); n tiles wide, range in tiles
      plat(x, y, n, kind, range, speed) { L.plats.push({ x: x * T, y: y * T, n, kind, range: (range || 0) * T, sp: speed || 1 }); return B; },
      water(y) { L.water = y; return B; },
    };
    return B;
  }

  function level(n) {
    let B;
    if (n === 1) { // ------------------------------------------------ CUSTARD MEADOWS
      B = builder({ name: 'CUSTARD MEADOWS', theme: 'grass', w: 214, h: 24, time: 300 });
      B.ground(0, 34, 20).at(3, 19, 'S');
      B.deco('bush', 0, 19).deco('fence', 9, 19).deco('flower', 15, 19).deco('flower', 16, 19);
      B.msg(8, 16, 'WELCOME TO BISCUIT ISLE!|(B) JUMPS. HOLD IT TO JUMP HIGHER.|HOLD (Y) TO RUN. (A) IS A SPIN JUMP.|STOMP THE BADDIES. HIT THE ? BLOCKS!|THERE ARE 5 GOLDEN BISCUITS IN EVERY LEVEL.');
      B.at(14, 16, '?').at(18, 16, 'B?BPB').at(20, 12, '?').at(24, 19, 'c');
      B.pipe(28, 17, 19).at(32, 19, 'c').deco('bush', 30, 19);
      B.at(36, 14, 'G'); // over the first gap
      B.ground(38, 70, 20).at(42, 19, 'k').at(45, 16, 'oooo').at(49, 16, 'BEB').deco('flower', 44, 19).deco('bush', 52, 19);
      B.at(55, 19, 'c').at(58, 19, 'c');
      B.ground(62, 70, 17).at(66, 13, 'z').at(64, 16, 'k').deco('fence', 63, 16);
      B.ground(71, 98, 20).at(72, 17, '======').at(79, 14, '======').at(80, 13, 'oooo').at(82, 10, 'G');
      B.at(75, 19, 'c').at(78, 19, 'c').msg(85, 16, 'PRICKLES ARE TOO SPIKY TO STOMP...|BUT A SPIN JUMP (A) BOUNCES RIGHT OFF THEM!').at(89, 19, 'p');
      B.pipe(93, 16, 19).deco('bush', 95, 19);
      B.ground(99, 124, 20).at(101, 20, '*').at(104, 16, 'BBBFBBB').at(107, 12, 'ooooo').at(111, 19, 'k').at(115, 19, 'k').deco('fence', 116, 19).deco('flower', 120, 19);
      B.at(126, 17, 'G').at(124, 14, 'o').at(128, 14, 'o').at(125, 13, 'o').at(127, 13, 'o'); // low over the big gap: a brave one
      B.deco('bush', 136, 19).deco('fence', 145, 19).deco('flower', 130, 19).deco('bush', 56, 19).deco('flower', 88, 19).deco('fence', 112, 19);
      B.ground(129, 150, 20).at(133, 19, 'JJJ').at(133, 10, 'ooo').at(134, 6, 'G').at(133, 8, 'ooo');
      B.at(140, 19, 'c').at(142, 19, 'c').at(144, 19, 'c').pipe(147, 17, 19);
      B.ground(151, 161, 20).at(152, 16, 'B?mB').at(155, 19, 'c').at(158, 16, '...X\n..XX\n.XXX\nXXXX').at(163, 12, 'z').at(162, 11, 'ooo').deco('flower', 151, 19).deco('bush', 153, 19);
      B.ground(166, 214, 20).at(166, 16, 'X\nX\nX\nX').at(169, 17, 'BBBBB').at(172, 10, 'G').at(169, 13, '1');
      B.at(177, 19, 'k').at(181, 19, 'c').at(185, 19, 'p').at(188, 16, '?P?').deco('bush', 190, 19).deco('sign', 196, 19).deco('fence', 174, 19).deco('flower', 183, 19).deco('flower', 184, 19);
      B.at(178, 13, '=====').at(179, 12, 'ooo').pipe(193, 17, 19);
      B.at(201, 20, '!');
    } else if (n === 2) { // ------------------------------------------- CRUMBLY CAVES (a secret exit up in the roof)
      B = builder({ name: 'CRUMBLY CAVES', theme: 'cave', w: 204, h: 24, time: 300 });
      B.fill(0, 0, 203, 1).fill(0, 5, 203, 6).fill(0, 2, 56, 4).fill(171, 2, 203, 4); // the roof, with a secret tunnel inside it (x 62..170)
      B.ground(0, 30, 20).at(3, 19, 'S').deco('crystal', 6, 18);
      B.msg(9, 16, 'THE CRUMBLY CAVES! MIND THE BATS.|PSST... THIS LEVEL HAS TWO WAYS OUT.|THE ROOF IS THINNER THAN IT LOOKS...|(HOLD (Y) TO CARRY THINGS. LET GO TO THROW.)');
      B.at(14, 16, '?P?').at(18, 7, 'v').at(21, 19, 'c').at(24, 19, 'c').at(26, 16, 'BBmBB').at(28, 12, 'G');
      B.ground(33, 56, 20).plat(31, 17, 2, 'f');
      B.at(36, 19, 'k').at(40, 7, 'v').at(44, 19, 'p').at(46, 16, 'oooo').at(50, 7, 'v').deco('crystal', 47, 18);
      // the hint: ledges going up to a gap in the roof
      B.at(49, 17, '===').at(52, 14, '===').at(54, 11, '===').at(58, 11, 'J').clear(57, 5, 59, 6).at(50, 16, 'o').at(53, 13, 'o').at(55, 10, 'o').at(58, 8, 'o');
      B.ground(57, 60, 20).at(59, 19, 'c');
      B.plat(62, 17, 2, 'f').plat(66, 15, 2, 'f').plat(70, 17, 2, 'f').at(67, 11, 'G');
      B.ground(74, 98, 20).at(76, 19, 'k').at(80, 16, 'BB?BB').at(84, 7, 'v').at(88, 19, 'c').at(90, 19, 'c').at(92, 16, 'XX\nXX\nXX').at(92, 14, 'G');
      B.ground(99, 112, 17).at(101, 16, 'p').at(104, 13, 'BPB').at(108, 7, 'v');
      B.ground(113, 130, 20).at(115, 20, '*').at(118, 19, 'k').at(121, 19, 'k').at(124, 16, 'ooooo').at(126, 7, 'v');
      B.ground(131, 133, 18).plat(134, 16, 3, 'h', 4, 0.8).ground(141, 160, 20).at(143, 19, 'p').at(146, 16, '?B?B?').at(150, 7, 'v').at(152, 19, 'c').at(155, 19, 'c').at(151, 12, 'G');
      B.ground(161, 168, 17).ground(169, 204, 20).at(172, 19, 'k').at(176, 16, 'BBEBB').at(180, 7, 'v').at(183, 19, 'p').deco('crystal', 186, 18).at(192, 20, '!');
      // up in the roof: coins, a golden biscuit, bats, the key... and the keyhole
      B.at(62, 4, 'oooooo').at(78, 4, 'c').at(86, 3, 'G').at(96, 4, 'k').at(100, 3, 'oooo').at(112, 4, 'K').at(124, 4, 'c').at(132, 3, 'ooo').at(140, 4, 'k').at(150, 3, 'oooo');
      B.at(164, 3, 'H').clear(167, 5, 169, 6); // (and a way back down if you came up without the key)
    } else if (n === 3) { // ------------------------------------------- WAFER HEIGHTS (up in the sky)
      B = builder({ name: 'WAFER HEIGHTS', theme: 'sky', w: 210, h: 28, time: 300 });
      B.ground(0, 14, 22).at(3, 21, 'S').msg(7, 18, 'WAFER HEIGHTS: WAY UP IN THE SKY.|STAND ON THE MOVING PLATFORMS.|BISCUIT PLATFORMS CRUMBLE... SO KEEP MOVING!|WITH THE CAPE: RUN TILL THE P METER FILLS, THEN JUMP!');
      B.at(10, 18, 'F').plat(16, 21, 3, 'h', 5, 0.9).ground(26, 36, 20).at(28, 19, 'k').at(32, 16, 'BEB').at(31, 12, 'G');
      B.at(38, 18, '=====').at(45, 15, '=====').at(52, 12, '=====').at(46, 14, 'ooo').at(53, 11, 'ooo').at(48, 10, 'z');
      B.plat(59, 16, 2, 'f').plat(63, 16, 2, 'f').plat(67, 16, 2, 'f').at(63, 12, 'ooo').at(65, 10, 'G');
      B.ground(71, 84, 20).at(73, 19, 'c').at(76, 19, 'c').at(79, 16, '?P?').at(82, 19, 'k');
      B.plat(86, 14, 3, 'v', 6, 0.8).ground(91, 98, 14).at(93, 13, 'p').at(96, 10, 'oo');
      B.at(100, 14, 'JJ').at(100, 6, 'G').at(104, 17, '=====').at(106, 13, 'Z');
      B.ground(110, 126, 20).at(112, 20, '*').at(115, 16, 'BBBBB').at(117, 12, '1').at(120, 19, 'c').at(123, 19, 'c').at(124, 15, 'z');
      B.plat(128, 18, 3, 'h', 6, 1.1).plat(140, 15, 3, 'v', 5, 0.9).ground(146, 152, 17).at(148, 16, 'k').at(150, 12, 'G');
      B.plat(154, 17, 2, 'f').plat(158, 15, 2, 'f').plat(162, 13, 2, 'f').plat(166, 15, 2, 'f').at(158, 11, 'oooooooo').at(160, 9, 'z');
      B.ground(170, 210, 20).at(173, 19, 'p').at(177, 16, '?B?').at(181, 19, 'c').at(184, 19, 'k').at(187, 13, 'G').at(186, 16, 'XXX').at(198, 20, '!');
    } else if (n === 4) { // ------------------------------------------- GLOOMY PANTRY (a haunted house: two rooms and a door out)
      B = builder({ name: 'GLOOMY PANTRY', theme: 'ghost', w: 140, h: 24, time: 300, song: 'ghost' });
      B.fill(0, 0, 139, 6).fill(0, 7, 0, 23).fill(66, 7, 69, 23).fill(139, 7, 139, 23);
      B.ground(1, 65, 20).at(3, 19, 'S').deco('candle', 2, 18).deco('cobweb', 1, 7).deco('candle', 20, 18).deco('cobweb', 40, 7).deco('candle', 44, 18);
      B.msg(7, 16, 'THE GLOOMY PANTRY. OOOH...|THE SHEETIES ARE SHY: THEY ONLY CREEP|UP ON YOU WHEN YOU LOOK AWAY!|FIND THE DOOR AT THE END. PRESS UP AT A DOOR.');
      B.at(12, 16, '?').at(36, 15, 'I').at(16, 13, '======').at(18, 9, 'G').at(24, 16, 'g').at(26, 19, 'c').at(30, 16, 'BPB').at(34, 19, 'c').at(38, 12, 'g');
      B.at(42, 16, 'XXX').at(42, 15, 'oo').at(46, 13, 'XXX\nX..\nX..').at(47, 11, 'G').at(52, 19, 'k').at(56, 14, 'g').at(58, 16, '===').at(60, 13, '===');
      B.door(63, 18, 72, 18).room(0, 66, 0, 23);
      B.ground(70, 138, 20).deco('candle', 74, 18).deco('cobweb', 70, 7).deco('candle', 96, 18).deco('cobweb', 110, 7).deco('candle', 120, 18).room(66, 139, 0, 23);
      B.at(76, 19, 'c').at(80, 16, 'i?i').at(84, 12, 'g').at(87, 17, '^^^').ground(87, 89, 18).at(90, 16, 'G').at(93, 15, 'XXXX').at(94, 14, 'oo');
      B.at(99, 19, 'k').at(102, 13, '=====').at(104, 11, 'G').at(106, 16, 'g').at(110, 19, 'c').at(112, 19, 'c');
      B.ground(116, 120, 17).at(118, 16, 'p').at(122, 13, 'g').at(125, 16, 'BB?BB').at(127, 12, 'G').at(130, 14, 'g');
      B.door(135, 18, 0, 0, 'exit');
    } else if (n === 5) { // ------------------------------------------- FIZZY LAGOON (the secret one: under the sea)
      B = builder({ name: 'FIZZY LAGOON', theme: 'water', w: 190, h: 28, time: 300 });
      const o = 4, at = (x, y, s) => B.at(x, y + o, s), gr = (a, b, y) => B.ground(a, b, y + o);
      B.water(8 + o); gr(0, 14, 8); at(3, 7, 'S'); B.deco('palm', 5, 7 + o); B.msg(9, 4 + o, 'YOU FOUND THE SECRET FIZZY LAGOON!|IN THE WATER, PRESS (B) TO SWIM UP.|THIS WAY IS A SHORTCUT TO THE CASTLE...');
      gr(15, 40, 21); at(20, 12, 'ooo'); at(24, 15, 'f'); at(28, 18, 'XX\nXX\nXX'); at(29, 16, 'G'); at(33, 11, 'f'); at(36, 18, 'ooo');
      gr(41, 70, 20); at(44, 14, '?P?'); at(48, 17, 'f'); at(52, 11, '^^^^\nXXXX'); at(56, 19, 'k'); at(60, 14, 'G'); at(60, 16, 'XX'); at(64, 13, 'f');
      gr(71, 75, 14); at(72, 12, 'oo'); gr(76, 110, 21); at(78, 17, 'f'); at(84, 11, 'f'); at(88, 14, '^^^^\nXXXX'); at(89, 11, 'G'); at(95, 17, 'f'); at(98, 21, '*'); at(102, 12, 'oooo');
      gr(111, 120, 17); at(113, 16, 'p'); gr(121, 150, 21); at(123, 12, 'f'); at(127, 16, 'BB1BB'); at(132, 18, 'f'); at(136, 8, 'XXXX'); at(137, 6, 'G'); at(140, 15, 'f'); at(146, 11, 'f');
      gr(151, 165, 19); at(153, 13, 'oooooo'); at(156, 18, 'k'); at(160, 12, 'G'); at(159, 14, '===');
      gr(166, 190, 8); B.deco('palm', 168, 7 + o).deco('palm', 184, 7 + o); at(178, 8, '!');
    } else { // ------------------------------------------------------- BOURBON CASTLE (and King Grumblesnout)
      B = builder({ name: 'BOURBON CASTLE', theme: 'castle', w: 204, h: 24, time: 400, song: 'castle' });
      B.fill(0, 0, 203, 5).fill(0, 6, 0, 23);
      B.ground(1, 20, 20).at(3, 19, 'S').deco('torch', 2, 17).deco('banner', 8, 8).deco('torch', 14, 17);
      B.msg(6, 16, 'BOURBON CASTLE. KING GRUMBLESNOUT IS IN HERE|WITH EVERY BISCUIT ON THE ISLAND.|LAVA IS HOT. GRUMPY BRICKS ARE GRUMPY.|STOMP THE KING THREE TIMES!');
      B.at(10, 16, '?P?').at(17, 19, 's');
      B.fill(21, 22, 30, 22, 13).fill(21, 23, 30, 23, 14).at(24, 23, 't').at(28, 23, 't').plat(22, 18, 3, 'h', 5, 0.9);
      B.ground(31, 50, 20).at(34, 6, 'T').at(40, 6, 'T').at(37, 13, 'G').at(44, 19, 's').at(47, 16, 'BFB');
      B.fill(51, 22, 64, 22, 13).fill(51, 23, 64, 23, 14).at(54, 23, 't').at(59, 23, 't').at(63, 23, 't').at(52, 18, 'XX').at(57, 16, 'XX').at(62, 18, 'XX').at(57, 14, 'oo');
      B.ground(65, 92, 20).at(66, 20, '*').deco('torch', 68, 17).at(72, 19, 's').at(75, 6, 'T').at(80, 16, '^^^^').fill(80, 17, 83, 17, 5).at(81, 14, 'G').at(86, 19, 's').at(89, 6, 'T');
      B.fill(93, 22, 112, 22, 13).fill(93, 23, 112, 23, 14).plat(94, 15, 3, 'v', 4, 0.8).plat(100, 16, 3, 'h', 4, 1).plat(108, 15, 3, 'v', 4, 0.9).at(97, 23, 't').at(104, 23, 't').at(110, 23, 't').at(104, 11, 'G');
      B.ground(113, 140, 20).at(115, 16, '?1?').at(119, 19, 's').at(122, 6, 'T').at(126, 6, 'T').at(130, 19, 'p').at(133, 19, 's').deco('banner', 128, 8).at(136, 13, 'G').at(135, 16, 'XXX');
      B.fill(141, 22, 160, 22, 13).fill(141, 23, 160, 23, 14).fill(141, 18, 160, 18, 5).at(144, 6, 'T').at(150, 6, 'T').at(156, 6, 'T').at(153, 15, 'G');
      B.ground(161, 184, 20).deco('torch', 166, 17).deco('torch', 178, 17).at(170, 19, 's').at(174, 16, 'P');
      B.fill(185, 6, 187, 23).door(181, 18, 190, 18).room(0, 186, 0, 23);
      // the King's room (one screen)
      B.fill(188, 6, 188, 23).fill(203, 6, 203, 23).ground(189, 202, 20).deco('banner', 191, 8).deco('banner', 199, 8).deco('torch', 189, 17).deco('torch', 201, 17).room(188, 203, 0, 23);
      B.L.boss = { x: 199 * T, y: 20 * T };
    }
    return B.L;
  }

  // ---------------------------------------------------------------- the island map: level dots and the paths between them
  // need: the exit that opens the path ('2s' is the Crumbly Caves' secret exit)
  const NODES = [
    { x: 52, y: 162, lv: 0, name: "PLUMBO'S SHED" },
    { x: 86, y: 160, lv: 1 },
    { x: 116, y: 128, lv: 2, red: 1 },
    { x: 158, y: 114, lv: 3 },
    { x: 198, y: 132, lv: 4, house: 1 },
    { x: 40, y: 52, lv: 5, secret: 1 },
    { x: 206, y: 74, lv: 6, castle: 1 },
  ];
  const EDGES = [
    { a: 0, b: 1, need: '', pts: [[52, 162], [70, 166], [86, 160]] },
    { a: 1, b: 2, need: '1', pts: [[86, 160], [100, 150], [104, 136], [116, 128]] },
    { a: 2, b: 3, need: '2', pts: [[116, 128], [134, 128], [146, 118], [158, 114]] },
    { a: 3, b: 4, need: '3', pts: [[158, 114], [172, 120], [184, 134], [198, 132]] },
    { a: 4, b: 6, need: '4', pts: [[198, 132], [214, 118], [218, 96], [206, 74]] },
    { a: 2, b: 5, need: '2s', pts: [[116, 128], [100, 110], [80, 96], [62, 80], [48, 64], [40, 52]] },
    { a: 5, b: 6, need: '5', pts: [[40, 52], [64, 38], [100, 32], [140, 32], [176, 40], [198, 54], [206, 74]] },
  ];
  const LVNAME = ['', 'CUSTARD MEADOWS', 'CRUMBLY CAVES', 'WAFER HEIGHTS', 'GLOOMY PANTRY', 'FIZZY LAGOON', 'BOURBON CASTLE'];
  const HI0 = [['LUKE', 61200], ['DAVE', 48850], ['JK', 35400], ['CAL', 22150], ['JACK', 15300], ['MOM', 2400]];
  const NAMES = ['JACK', 'BIG JACK', 'JACK2', 'PLUMBO', 'TEST', 'ASDF', 'DAVE SUX', 'LUKE SUX'];
  const exitsOf = f => f ? Object.keys(f.cl || {}).length : 0;

  // ---------------------------------------------------------------- music: little strings of notes (16th-note steps)
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nt(s) {
    const out = [];
    for (const t of s.trim().split(/\s+/)) {
      if (t === '.') out.push(0); else if (t === '-') out.push(-1);
      else { const m = /^([A-G])([#b]?)(\d)$/.exec(t); if (!m) { out.push(0); continue; } out.push(12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)); }
    }
    return out;
  }
  const rep = (s, n) => Array(n).fill(s).join(' ');
  const bassBar = (r, f) => `${r} . ${f} . ${r} . ${f} . ${r} . ${f} . ${r} . ${f} .`;
  const SONGS = {
    grass: { bpm: 150, wave: 'square', vol: 0.05, bassWave: 'triangle',
      lead: nt(`E5 - G5 - C6 - - - B5 - G5 - A5 - - -  G5 - E5 - C5 - D5 - E5 - - - . . . .  F5 - A5 - D6 - - - C6 - A5 - B5 - - -  A5 - F5 - D5 - E5 - F5 - - - G5 - - -
                E5 - G5 - C6 - - - D6 - E6 - - - C6 -  A5 - - - F5 - A5 - G5 - - - E5 - - -  F5 - E5 - D5 - - - G5 - F5 - E5 - - -  D5 - - - B4 - D5 - C5 - - - . . . .`),
      bass: nt([bassBar('C3', 'G3'), 'C3 . G3 . C3 . G3 . G2 . D3 . G2 . D3 .', bassBar('D3', 'A3'), 'F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 .', bassBar('C3', 'G3'), bassBar('F2', 'C3'), 'D3 . A3 . D3 . A3 . G2 . D3 . G2 . D3 .', 'G2 . D3 . G2 . B2 . C3 . G3 . C3 . . .'].join(' ')),
      drums: [...rep('o . . . x . . . o . o . x . . x', 8).split(' ')] },
    cave: { bpm: 112, wave: 'triangle', vol: 0.07, bassWave: 'square',
      lead: nt(`A4 - - - C5 - E5 - - - D5 - C5 - B4 -  A4 - - - E4 - - - G4 - A4 - - - - -  F4 - - - A4 - C5 - - - B4 - A4 - G4 -  E4 - - - - - - - G#4 - - - B4 - - -
                A4 - - - C5 - E5 - - - G5 - F5 - E5 -  D5 - - - C5 - B4 - C5 - - - A4 - - -  F4 - A4 - C5 - F5 - E5 - - - D5 - B4 -  A4 - - - - - - - . . . . E4 - - -`),
      bass: nt(rep('A2 . . . A2 . . . A2 . . . E2 . . .', 2) + ' ' + 'F2 . . . F2 . . . F2 . . . C3 . . . E2 . . . E2 . . . E2 . . . G#2 . . . ' + 'A2 . . . A2 . . . A2 . . . E2 . . . D2 . . . D2 . . . E2 . . . E2 . . . F2 . . . F2 . . . E2 . . . E2 . . . A2 . . . A2 . . . A2 . . . E2 . . .'),
      drums: [...rep('o . . . . . . . x . . . . . . .', 8).split(' ')] },
    sky: { bpm: 156, wave: 'square', vol: 0.045, bassWave: 'triangle',
      lead: nt(`C6 - - - A5 - F5 - G5 - A5 - - - . .  Bb5 - - - G5 - E5 - F5 - G5 - - - . .  A5 - C6 - F6 - - - E6 - D6 - C6 - - -  D6 - C6 - Bb5 - A5 - G5 - - - - - . .
                C6 - - - A5 - F5 - G5 - A5 - - - . .  D6 - - - Bb5 - G5 - A5 - Bb5 - - - . .  C6 - A5 - F5 - A5 - G5 - E5 - C5 - E5 -  F5 - - - - - - - . . . . . . . .`),
      bass: nt([bassBar('F2', 'C3'), bassBar('C3', 'G3'), bassBar('F2', 'C3'), bassBar('G2', 'D3'), bassBar('F2', 'C3'), bassBar('Bb2', 'F3'), bassBar('C3', 'G3'), bassBar('F2', 'C3')].join(' ')),
      drums: [...rep('o . x . x . x . o . x . x . x x', 8).split(' ')] },
    ghost: { bpm: 96, wave: 'triangle', vol: 0.07, bassWave: 'square',
      lead: nt(`E5 - - - D#5 - - - E5 - B4 - C5 - - -  A4 - - - . . C4 - E4 - A4 - B4 - - -  . . E4 - G#4 - B4 - C5 - - - . . E4 -  E5 - - - D#5 - - - E5 - - - . . . .`),
      bass: nt('A2 . E3 . A3 . E3 . A2 . E3 . A3 . E3 . F2 . C3 . F3 . C3 . F2 . C3 . F3 . C3 . E2 . B2 . E3 . B2 . E2 . B2 . E3 . G#2 . A2 . E3 . A3 . E3 . E2 . B2 . E3 . B2 .'),
      drums: [...rep('. . . . . . . . . . . . x . . .', 4).split(' ')] },
    water: { bpm: 104, wave: 'triangle', vol: 0.075, bassWave: 'triangle',
      lead: nt(`G5 - - - - - E5 - D5 - C5 - - - - -  D5 - - - - - E5 - F5 - G5 - - - - -  A5 - - - G5 - F5 - E5 - D5 - - - C5 -  D5 - - - - - - - . . . . . . . .
                G5 - - - - - E5 - D5 - C5 - - - - -  F5 - - - - - E5 - D5 - C5 - - - A4 -  B4 - - - C5 - D5 - G5 - F5 - E5 - D5 -  C5 - - - - - - - . . . . . . . .`),
      bass: nt('C3 . . . G3 . . . C3 . . . G3 . . . G2 . . . D3 . . . G2 . . . D3 . . . F2 . . . C3 . . . F2 . . . A2 . . . G2 . . . D3 . . . G2 . . . B2 . . . C3 . . . G3 . . . C3 . . . G3 . . . F2 . . . C3 . . . F2 . . . C3 . . . G2 . . . D3 . . . G2 . . . D3 . . . C3 . . . G3 . . . C3 . . . . . . .'),
      bassVol: 0.05 },
    castle: { bpm: 138, wave: 'sawtooth', vol: 0.035, bassWave: 'square',
      lead: nt(`D5 - - - . . D5 - F5 - - - E5 - D5 -  C#5 - - - . . A4 - - - - - . . . .  D5 - - - . . D5 - G5 - - - F5 - E5 -  F5 - - - E5 - D5 - C#5 - - - A4 - - -
                Bb4 - - - . . Bb4 - D5 - - - C5 - Bb4 -  A4 - - - . . E4 - - - - - . . . .  D5 - F5 - A5 - - - G5 - F5 - E5 - G5 -  F5 - - - E5 - - - D5 - - - . . . .`),
      bass: nt(rep('D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2', 1) + ' ' + rep('A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 A2 A1', 1) + ' ' + rep('D2 D2 D3 D2 D2 D2 D3 D2', 2) + ' ' + rep('A1 A1 A2 A1', 4) + ' ' + rep('Bb1 Bb1 Bb2 Bb1', 4) + ' ' + rep('A1 A1 A2 A1', 4) + ' ' + rep('D2 D2 D3 D2', 4) + ' ' + rep('A1 A1 A2 A1', 2) + ' D2 . . . D2 . . .'),
      drums: [...rep('o . . o x . . . o . o . x . . .', 8).split(' ')] },
    boss: { bpm: 172, wave: 'square', vol: 0.045, bassWave: 'sawtooth',
      lead: nt(`E5 . E5 . G5 . E5 . A5 - - - G5 - E5 -  D5 . D5 . F5 . D5 . G5 - - - F5 - D5 -  E5 . E5 . G5 . E5 . B5 - - - A5 - G5 -  A5 - G5 - F5 - E5 - D#5 - - - B4 - - -`),
      bass: nt(rep('E2 E2 E3 E2', 4) + ' ' + rep('D2 D2 D3 D2', 4) + ' ' + rep('E2 E2 E3 E2', 4) + ' ' + rep('B1 B1 B2 B1', 4)),
      drums: [...rep('o . x . o o x . o . x . o . x x', 4).split(' ')] },
    map: { bpm: 128, wave: 'square', vol: 0.045, bassWave: 'triangle',
      lead: nt(`G5 - E5 - G5 - C6 - - - G5 - A5 - G5 -  F5 - D5 - F5 - B5 - - - A5 - G5 - F5 -  E5 - C5 - E5 - A5 - - - G5 - F5 - E5 -  D5 - - - G5 - - - C5 - - - . . . .`),
      bass: nt([bassBar('C3', 'E3'), bassBar('G2', 'D3'), bassBar('A2', 'E3'), 'F2 . A2 . G2 . B2 . C3 . G2 . C3 . . .'].join(' ')),
      drums: [...rep('o . . . x . . . o . . . x . . .', 4).split(' ')] },
    title: { bpm: 140, wave: 'square', vol: 0.05, bassWave: 'triangle',
      lead: nt(`C5 - E5 - G5 - C6 - - - . . G5 - C6 -  B5 - A5 - G5 - E5 - - - . . . . . .  F5 - A5 - C6 - F6 - - - E6 - D6 - C6 -  B5 - - - D6 - - - G5 - - - . . . .
                C5 - E5 - G5 - C6 - - - . . G5 - C6 -  E6 - D6 - C6 - A5 - - - . . F5 - A5 -  G5 - - - E5 - C5 - D5 - - - G4 - B4 -  C5 - - - - - - - . . . . . . . .`),
      bass: nt([bassBar('C3', 'G3'), bassBar('A2', 'E3'), bassBar('F2', 'C3'), bassBar('G2', 'D3'), bassBar('C3', 'G3'), bassBar('A2', 'E3'), 'F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 .', 'C3 . G3 . C3 . . . . . . . . . . .'].join(' ')),
      drums: [...rep('o . x . o . x . o . x . o . x x', 8).split(' ')] },
  };
  function song(name, fast) { const S = SONGS[name]; if (!S) return null; return fast ? Object.assign({}, S, { bpm: Math.round(S.bpm * 1.25) }) : S; }

  // ================================================================ the game
  TV.game('sn.plumb', {
    buttons: ['b', 'a', 'y', 'x'],
    help: 'Move: arrows. Jump: X (hold it to jump higher). Spin jump: Z. Run, throw and carry: hold V or C. Pause: Enter.',
    make(K) {
      const A = art(), CM = common(), DC = decos(), F = K.font, sfx = K.sfx; let g = K.g;
      const lab = b => '(' + K.label(b) + ')';
      const say = s => s.replace(/\((A|B|X|Y)\)/g, (m, b) => lab(b.toLowerCase()));
      // ---------------------------------------------------------- the battery save: three files and the high-score table
      function freshSave() {
        return { v: 1, files: [null, { name: 'DAVE SUX', cl: { 1: 1, 2: 1 }, gb: { 1: 3, 2: 1 }, node: 2, t: 0 }, { name: 'TEST', cl: { 1: 1 }, gb: {}, node: 1, t: 0 }],
          hi: HI0.map(([n, s]) => ({ n, s })) };
      }
      let SV = K.load();
      if (!SV || !Array.isArray(SV.files) || SV.files.length !== 3 || !Array.isArray(SV.hi)) SV = freshSave();
      const store = () => { try { K.save(SV); } catch (e) {} };
      let FI = 0, FL = null; // the file being played

      // ---------------------------------------------------------- sounds
      const S = {
        jump() { sfx.tone(300, 0.16, 'square', 0.07, 0, 760); },
        spin() { sfx.tone(520, 0.2, 'square', 0.05, 0, 980); sfx.noise(0.25, 0.05, 3000, 0, 'bandpass', 800); },
        stomp(n) { sfx.tone(220 + n * 40, 0.08, 'square', 0.1, 0, 90); sfx.noise(0.08, 0.12, 900); sfx.tone(660 + n * 90, 0.1, 'square', 0.06, 0.06); },
        bonk() { sfx.tone(880, 0.06, 'square', 0.08); sfx.tone(440, 0.18, 'square', 0.07, 0.05, 110); },
        coin() { sfx.tone(1568, 0.05, 'square', 0.06); sfx.tone(2093, 0.22, 'square', 0.06, 0.05); },
        bump() { sfx.tone(160, 0.08, 'square', 0.1, 0, 70); },
        brk() { sfx.noise(0.25, 0.18, 1600, 0, 'lowpass', 300); sfx.tone(120, 0.12, 'square', 0.08, 0, 50); },
        sprout() { sfx.seq([[60, 0.25], [67, 0.25], [72, 0.25], [64, 0.25], [71, 0.25], [76, 0.25]], { bpm: 600, vol: 0.06 }); },
        power() { sfx.seq([[60, 0.5], [64, 0.5], [67, 0.5], [72, 0.5], [76, 0.5], [79, 0.5], [84, 1]], { bpm: 720, vol: 0.07 }); },
        cape() { sfx.noise(0.3, 0.1, 2500, 0, 'bandpass', 600); sfx.seq([[72, 0.5], [79, 0.5], [84, 1]], { bpm: 500, vol: 0.06 }); },
        oneup() { sfx.seq([[76, 0.5], [79, 0.5], [88, 0.5], [84, 0.5], [86, 0.5], [91, 1]], { bpm: 520, vol: 0.07 }); },
        hurt() { sfx.seq([[72, 0.5], [67, 0.5], [60, 0.5], [55, 1]], { bpm: 600, vol: 0.08 }); },
        kick() { sfx.tone(180, 0.06, 'square', 0.12, 0, 600); sfx.noise(0.05, 0.1, 2000); },
        fire() { sfx.tone(900, 0.07, 'square', 0.05, 0, 1600); sfx.noise(0.08, 0.04, 6000, 0, 'highpass'); },
        fizz() { sfx.noise(0.18, 0.08, 5000, 0, 'highpass', 1500); },
        gbisc() { sfx.seq([[84, 0.5], [88, 0.5], [91, 0.5], [96, 1]], { bpm: 560, vol: 0.07, wave: 'triangle' }); sfx.tone(1568, 0.3, 'square', 0.03, 0.12); },
        jelly() { sfx.tone(200, 0.2, 'sine', 0.14, 0, 600); },
        msg() { sfx.seq([[79, 0.5], [84, 1]], { bpm: 400, vol: 0.06 }); },
        swim() { sfx.tone(400, 0.1, 'sine', 0.06, 0, 700); },
        pipe() { sfx.seq([[67, 0.5], [60, 0.5], [55, 0.5], [48, 1]], { bpm: 480, vol: 0.07 }); },
        mid() { sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1]], { bpm: 500, vol: 0.07 }); },
        thud() { sfx.tone(90, 0.3, 'square', 0.14, 0, 40); sfx.noise(0.3, 0.2, 500); },
        gulp() { sfx.tone(300, 0.12, 'square', 0.08, 0, 120); sfx.tone(600, 0.06, 'square', 0.05, 0.12); },
        tongue() { sfx.tone(700, 0.06, 'square', 0.05, 0, 1200); },
        hatch() { sfx.noise(0.1, 0.1, 3000); sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5]], { bpm: 480, vol: 0.06, when: 0.1 }); },
        boss() { sfx.tone(140, 0.4, 'sawtooth', 0.1, 0, 60); sfx.noise(0.4, 0.15, 800); },
        bossHit() { sfx.seq([[84, 0.25], [79, 0.25], [72, 0.25], [67, 0.25], [60, 0.5]], { bpm: 400, vol: 0.09 }); sfx.noise(0.2, 0.15, 1200); },
        tick() { sfx.tone(1200, 0.03, 'square', 0.04); },
        menu() { sfx.tone(880, 0.04, 'square', 0.05); },
        ok() { sfx.seq([[76, 0.5], [83, 1]], { bpm: 600, vol: 0.07 }); },
        door() { sfx.noise(0.4, 0.08, 400, 0, 'bandpass', 900); sfx.tone(110, 0.3, 'triangle', 0.1, 0.1, 80); },
        dead() { sfx.seq([[71, 0.5], [77, 1], [0, 0.5], [77, 0.5], [77, 0.67], [76, 0.67], [74, 0.67], [72, 1], [64, 1], [60, 2]], { bpm: 300, vol: 0.08 }); },
        clear() { sfx.seq([[67, 0.5], [72, 0.5], [76, 0.5], [79, 1], [76, 0.5], [79, 2], [0, 0.5], [68, 0.5], [72, 0.5], [75, 0.5], [80, 1], [75, 0.5], [80, 2], [0, 0.5], [70, 0.5], [74, 0.5], [77, 0.5], [82, 1], [82, 0.5], [82, 0.5], [84, 3]], { bpm: 420, vol: 0.07 }); sfx.seq([[48, 4], [44, 4], [46, 3]], { bpm: 105, vol: 0.08, wave: 'triangle' }); },
        secret() { sfx.seq([[72, 0.5], [79, 0.5], [84, 0.5], [88, 0.5], [91, 0.5], [96, 2]], { bpm: 360, vol: 0.07, wave: 'triangle' }); sfx.seq([[60, 1], [67, 1], [72, 3]], { bpm: 180, vol: 0.06 }); },
        over() { sfx.seq([[72, 1], [67, 1], [64, 1], [69, 1.5], [71, 1.5], [69, 1], [68, 1.5], [70, 1.5], [68, 1], [67, 4]], { bpm: 240, vol: 0.08, wave: 'triangle' }); },
        dot() { sfx.tone(1320, 0.05, 'square', 0.04); },
        walk() { sfx.tone(600, 0.03, 'triangle', 0.04); },
      };

      // ---------------------------------------------------------- session state
      let mode = 'title', mT = 0, menu = 0, score = 0, lives = 5, coins = 0, power = 'S', reserve = '', dinoCarry = false;
      let lastRep = { t: 0, sc: 0 }, finalSent = false, hiPos = -1, initials = ['J', 'A', 'K'], iCur = 0, endKind = '';
      let ctlShown = false, paused = false, pauseSel = 0, msgBox = null, flash = 0, shake = 0, fade = 0;
      const addScore = (n, x, y) => { score = Math.min(99999, score + n); if (x != null) pop(x, y, String(n)); };
      const oneUp = (x, y) => { lives = Math.min(99, lives + 1); S.oneup(); if (x != null) pop(x, y, '1UP', '#78f878'); };
      // progress reports to JackNet. The server only believes points-a-second since the last report, so a milestone is sent
      // only when it's well affordable (and not when a game over might be round the corner), and the final one waits
      // (a few seconds at most) until it's believable.
      function report() {
        if (score < lastRep.sc + 3000 || K.t - lastRep.t < score / 300 + 25 || lives < 3) return;
        K.over(score, { keep: true }); lastRep = { t: K.t, sc: score };
      }
      const affordable = () => Math.floor(300 * (K.t - lastRep.t + 4));

      // ---------------------------------------------------------- the level being played
      let LN = 0, L = null, G8 = null, GM = null, TS = null, BG = null, E = [], PL = [], bumps = [], room = null, LW = 0, LH = 0;
      let time = 0, tick = 0, hurry = false, midLv = 0, gbMask = 0, gbList = [], lvT = 0, ending = null, bossE = null, bossOn = false, secretFound = false;
      const P = { x: 0, y: 0, w: 12, h: 14, vx: 0, vy: 0, dir: 1, on: false, wasOn: false, coy: 0, jbuf: 0, jk: 0, spin: false, pm: 0, fly: 0, duck: false, inv: 0, chain: 0,
        carry: null, ride: null, swim: false, kick: 0, throwT: 0, cspin: 0, grow: 0, dead: 0, plat: null, anim: 0, skid: false, auto: 0, tongue: 0, tongueHit: null, door: 0, glide: false };
      const PMAX = 56;
      const tcache = {}, bcache = {};
      const tileAt = (tx, ty) => (tx < 0 || tx >= LW) ? 5 : (ty < 0 || ty >= LH) ? 0 : G8[ty * LW + tx];
      const SOLID = new Uint8Array(32); [1, 2, 3, 4, 5, 8, 9, 10, 11, 17, 19].forEach(i => SOLID[i] = 1);
      const solid = (tx, ty) => SOLID[tileAt(tx, ty)] === 1;
      const setTile = (tx, ty, id) => { if (tx >= 0 && ty >= 0 && tx < LW && ty < LH) G8[ty * LW + tx] = id; };
      const inWater = (px, py) => L && L.water && py >= L.water * T && !solid(px >> 4, py >> 4);
      let GD = null;
      function masks() { // which sides of each ground tile are open (for the grass edges), and how deep under the surface it is (for shading)
        GM = new Uint8Array(LW * LH); GD = new Uint8Array(LW * LH);
        for (let x = 0; x < LW; x++) { let d = 0; for (let y = 0; y < LH; y++) { if (G8[y * LW + x] === 1) { GD[y * LW + x] = Math.min(3, d >> 1); d++; } else d = 0; } }
        for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
          if (G8[y * LW + x] !== 1) continue;
          const o = t => t !== 1;
          GM[y * LW + x] = (y > 0 && o(tileAt(x, y - 1)) ? 1 : 0) | (x > 0 && o(tileAt(x - 1, y)) ? 2 : 0) | (x < LW - 1 && o(tileAt(x + 1, y)) ? 4 : 0) | (y < LH - 1 && o(tileAt(x, y + 1)) ? 8 : 0);
        }
      }
      // ---- things in the level
      const SZ = { conk: [14, 14], crab: [14, 16], cup: [16, 14], prick: [16, 14], bee: [14, 14], beev: [14, 14], bat: [14, 12], sheet: [20, 20], crush: [24, 30], toffee: [12, 12], tin: [12, 24], fish: [14, 12],
        gbisc: [14, 24], key: [16, 14], keyhole: [16, 32], mid: [32, 48], goal: [48, 144], dino: [20, 26], cake: [14, 14], daisy: [14, 16], bag: [14, 14], oneup: [14, 14], egg: [14, 16], boss: [36, 44], crumb: [12, 12], wave: [12, 12], ball: [8, 8] };
      const ENEMY = { conk: 1, crab: 1, cup: 1, prick: 1, bee: 1, beev: 1, bat: 1, sheet: 1, crush: 1, toffee: 1, tin: 1, fish: 1, boss: 1, crumb: 1, wave: 1 };
      const EDIBLE = { conk: 1, crab: 1, cup: 1, prick: 1, bee: 1, beev: 1, bat: 1, tin: 1, fish: 1, cake: 1, daisy: 1, bag: 1, oneup: 1 };
      function ent(k, x, y, o) {
        const [w, h] = SZ[k] || [16, 16];
        const e = { k, x, y, w, h, vx: 0, vy: 0, dir: -1, on: false, st: '', t: 0, rm: false, dying: '', dt: 0, hx: x, hy: y, f: 0, chain: 0, grace: 0, id: 0 };
        if (o) Object.assign(e, o);
        E.push(e); return e;
      }
      function spawnObj(o) {
        const k = o.k, [w, h] = SZ[k] || [16, 16], bx = o.x * T + (T - w) / 2, by = (o.y + 1) * T - h;
        if (k === 'mid') return ent(k, o.x * T, o.y * T - 48, { done: midLv === LN });
        if (k === 'goal') return ent(k, o.x * T, o.y * T - 144, { tape: 0, tdir: 1 });
        if (k === 'gbisc') { const e = ent(k, o.x * T + 1, o.y * T, {}); return e; }
        if (k === 'crush') return ent(k, o.x * T + 4, o.y * T, { st: 'wait', hy: o.y * T });
        if (k === 'toffee') return ent(k, bx, o.y * T, { st: 'wait', t: (o.x * 13) % 90, hy: o.y * T });
        if (k === 'bee' || k === 'beev' || k === 'bat' || k === 'sheet' || k === 'fish') return ent(k, bx, o.y * T, { hx: bx, hy: o.y * T, t: o.x * 7 });
        if (k === 'keyhole') return ent(k, o.x * T, (o.y + 2) * T - 32);
        if (k === 'dino') return ent(k, bx, by, { dir: 1 });
        return ent(k, bx, by, { dir: -1, vx: 0 });
      }
      function loadLevel(n, atMid) {
        LN = n; L = level(n); G8 = L.g; LW = L.w; LH = L.h; masks();
        TS = tcache[L.theme] || (tcache[L.theme] = tiles(L.theme));
        BG = bcache[L.theme] || (bcache[L.theme] = backdrop(L.theme));
        E = []; PL = []; bumps = []; fxClear(); bossE = null; bossOn = false; msgBox = null; paused = false;
        for (const o of L.objs) spawnObj(o);
        gbList = E.filter(e => e.k === 'gbisc').sort((a, b) => a.x - b.x); gbList.forEach((e, i) => { e.id = i; if (gbMask & (1 << i)) e.rm = true; });
        for (const p of L.plats) PL.push({ x: p.x, y: p.y, w: p.n * T, h: 8, kind: p.kind, x0: p.x, y0: p.y, range: p.range, sp: p.sp, t: 0, dx: 0, dy: 0, st: 0, vy: 0, on: 0 });
        // Plumbo
        let sx = L.start.x * T + 2, sy = (L.start.y + 1) * T;
        const mid = E.find(e => e.k === 'mid');
        if (atMid && mid) { sx = mid.x + 8; sy = mid.y + 48; mid.done = true; }
        Object.assign(P, { x: sx, y: 0, vx: 0, vy: 0, dir: 1, on: false, coy: 0, jbuf: 0, spin: false, pm: 0, fly: 0, duck: false, inv: 0, chain: 0, carry: null, ride: null, swim: false, kick: 0, throwT: 0, cspin: 0, grow: 0, dead: 0, plat: null, auto: 0, tongue: 0, door: 0, glide: false });
        P.w = 12; P.h = power === 'S' ? 14 : 26; P.y = sy - P.h;
        if (dinoCarry) { const d = ent('dino', P.x - 4, sy - 26, { dir: 1 }); mount(d, true); }
        time = L.time; tick = 0; hurry = false; lvT = 0; secretFound = false;
        room = findRoom(); camSnap();
        K.music(song(L.song));
      }
      function findRoom() {
        const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
        for (const r of L.rooms) if (cx >= r.x0 && cx < r.x1 && cy >= r.y0 - 200 && cy < r.y1 + 64) return r;
        return { x0: 0, x1: LW * T, y0: 0, y1: LH * T };
      }

      // ---------------------------------------------------------- particles (a fixed pool: nothing made while playing)
      const FX = []; for (let i = 0; i < 180; i++) FX.push({ on: false, k: '', x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 0, txt: '', col: '', g: 0, f: 0 });
      function fx(k, x, y, vx, vy, life, gr) { for (const p of FX) if (!p.on) { p.on = true; p.k = k; p.x = x; p.y = y; p.vx = vx || 0; p.vy = vy || 0; p.t = 0; p.life = life || 30; p.g = gr || 0; p.f = 0; return p; } return null; }
      function fxClear() { for (const p of FX) p.on = false; }
      function pop(x, y, txt, col) { const p = fx('txt', x, y, 0, -0.7, 50); if (p) { p.txt = txt; p.col = col || '#fff'; } }
      function stars(x, y, n) { for (let i = 0; i < (n || 5); i++) { const a = i / (n || 5) * Math.PI * 2; fx('star', x, y, Math.cos(a) * 1.6, Math.sin(a) * 1.6 - 0.6, 26, 0.05); } }
      function sparkle(x, y) { for (let i = 0; i < 4; i++) fx('spark', x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 14, 0, -0.2, 18 + i * 3); }
      function dust(x, y, n) { for (let i = 0; i < (n || 2); i++) fx('dust', x - 3 + Math.random() * 6, y - 4, (Math.random() - 0.5) * 0.8, -0.3, 18); }
      function brickBits(x, y) { for (const [vx, vy] of [[-1.4, -4.4], [1.4, -4.4], [-1.1, -2.6], [1.1, -2.6]]) fx('bit', x + 8 + vx * 3, y + 8, vx, vy, 70, 0.22); }
      function coinPop(x, y) { const p = fx('coinpop', x, y, 0, -4.6, 30, 0.3); S.coin(); coins++; addScore(20); if (coins >= 100) { coins -= 100; oneUp(x, y - 10); } return p; }

      // ---------------------------------------------------------- the camera (smooth, with look-ahead)
      const cam = { x: 0, y: 0, la: 0, ty: 0 };
      function camSnap() { room = findRoom(); cam.la = 0; cam.x = clamp(P.x + P.w / 2 - W / 2, room.x0, room.x1 - W); cam.y = clamp(P.y + P.h - 150, room.y0, room.y1 - H); cam.ty = cam.y; }
      function camera() {
        room = findRoom();
        const want = P.auto ? 0 : (Math.abs(P.vx) > 0.5 ? Math.sign(P.vx) * 36 : P.dir * 22);
        cam.la = lerp(cam.la, want, 0.04);
        let tx = P.x + P.w / 2 - W / 2 + cam.la;
        cam.x = lerp(cam.x, tx, 0.14);
        const px = P.x + P.w / 2 - cam.x; if (px < 72) cam.x = P.x + P.w / 2 - 72; if (px > W - 72) cam.x = P.x + P.w / 2 - (W - 72);
        cam.x = clamp(cam.x, room.x0, Math.max(room.x0, room.x1 - W));
        // up and down: follow the ground you stand on, and only chase you in the air when you leave the middle of the screen
        const feet = P.y + P.h;
        if (P.on || P.swim || P.ride && P.on) cam.ty = feet - 150;
        else { if (P.y - cam.ty < 44) cam.ty = P.y - 44; if (feet - cam.ty > H - 28) cam.ty = feet - (H - 28); }
        cam.ty = clamp(cam.ty, room.y0, Math.max(room.y0, room.y1 - H));
        cam.y = lerp(cam.y, cam.ty, P.on ? 0.08 : 0.12);
        if (P.y - cam.y < 30) cam.y = P.y - 30; if (feet - cam.y > H - 12) cam.y = feet - (H - 12);
        cam.y = clamp(cam.y, room.y0, Math.max(room.y0, room.y1 - H));
      }

      // ---------------------------------------------------------- moving through the tiles
      // returns: 1 = hit something
      function moveX(o, dx, isP) {
        o.x += dx; if (!dx) return 0;
        const y0 = (o.y + 1) >> 4, y1 = (o.y + o.h - 1) >> 4;
        if (dx > 0) { const tx = (o.x + o.w) >> 4; for (let ty = y0; ty <= y1; ty++) if (solid(tx, ty)) { o.x = tx * T - o.w; return 1; } }
        else { const tx = Math.floor(o.x) >> 4; for (let ty = y0; ty <= y1; ty++) if (solid(tx, ty)) { o.x = (tx + 1) * T; return 1; } }
        if (isP && o.x < room.x0) { o.x = room.x0; return 1; }
        return 0;
      }
      // returns 1 landed, -1 hit the ceiling (and the tile it hit), 0 nothing
      let hitTx = 0, hitTy = 0;
      function moveY(o, dy, isP, semi) {
        const oldB = o.y + o.h; o.y += dy;
        const x0 = (o.x + 1) >> 4, x1 = (o.x + o.w - 1) >> 4;
        if (dy > 0) {
          const ty = (o.y + o.h) >> 4;
          for (let tx = x0; tx <= x1; tx++) { const t = tileAt(tx, ty); if (SOLID[t] || (t === 6 && semi !== false && oldB <= ty * T + 0.5)) { o.y = ty * T - o.h; return 1; } }
        } else if (dy < 0) {
          const ty = Math.floor(o.y) >> 4;
          // the tile nearest the middle first (that's the one you hit)
          const cx = (o.x + o.w / 2) >> 4, order = cx === x0 ? [x0, x1] : [x1, x0];
          for (const tx of order) { const t = tileAt(tx, ty); if (SOLID[t] || (isP && t === 20)) { o.y = (ty + 1) * T; hitTx = tx; hitTy = ty; return -1; } }
        }
        return 0;
      }
      const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

      // ---------------------------------------------------------- blocks
      function hitBlock(tx, ty, by) {
        const t = tileAt(tx, ty), key = tx + ',' + ty, big = power !== 'S';
        if (t === 3 || t === 20) {
          const q = L.q[key] || 'coin'; setTile(tx, ty, 4); bumps.push({ tx, ty, t: 0 }); bonkAbove(tx, ty);
          if (q === 'coin') coinPop(tx * T + 2, ty * T - 14);
          else if (q === 'coins') { L.q[key] = 'coins'; coinPop(tx * T + 2, ty * T - 14); }
          else sprout(q, tx, ty);
          if (t === 3 || q !== 'coin') S.bump();
        } else if (t === 2) {
          const q = L.q[key];
          if (q === 'coins') { L.qn = L.qn || {}; const n = (L.qn[key] = (L.qn[key] || 0) + 1); coinPop(tx * T + 2, ty * T - 14); bumps.push({ tx, ty, t: 0 }); bonkAbove(tx, ty); if (n >= 10) setTile(tx, ty, 4); S.bump(); }
          else if (big || by === 'shell') { setTile(tx, ty, 0); brickBits(tx * T, ty * T); S.brk(); addScore(50); bonkAbove(tx, ty); shake = Math.max(shake, 3); }
          else { bumps.push({ tx, ty, t: 0 }); bonkAbove(tx, ty); S.bump(); }
        } else if (t === 19) { bumps.push({ tx, ty, t: 0 }); showMsg(L.msg[key] || ''); }
        else if (t === 17) { bumps.push({ tx, ty, t: 0 }); S.jelly(); }
        else S.bump();
      }
      function bonkAbove(tx, ty) { // baddies standing on a block you thump get knocked flying
        const r = { x: tx * T, y: ty * T - 4, w: T, h: 6 };
        for (const e of E) if (!e.rm && !e.dying && ENEMY[e.k] && e.k !== 'boss' && overlap(e, r)) defeat(e, 'bonk', 200);
        for (const e of E) if (!e.rm && (e.k === 'cake' || e.k === 'oneup') && overlap(e, r)) { e.vy = -3.4; e.vx = -e.vx || 1; }
      }
      function sprout(q, tx, ty) {
        const big = power !== 'S';
        let k = q === 'pow' ? (big ? 'daisy' : 'cake') : q === 'bag' ? (big ? 'bag' : 'cake') : q;
        if (q === 'egg' && P.ride) k = 'oneup';
        const [w, h] = SZ[k] || [14, 14];
        ent(k, tx * T + (T - w) / 2, ty * T + 1, { st: 'rise', t: 0, ry: ty * T - h, vx: 0, dir: P.x + P.w / 2 < tx * T + 8 ? 1 : -1 });
        S.sprout();
      }
      function showMsg(text) { if (!text) return; msgBox = { lines: say(text).split('|'), t: 0 }; S.msg(); }

      // ---------------------------------------------------------- Plumbo
      const big = () => power !== 'S';
      function setSize() {
        const nh = P.ride ? (big() ? 40 : 30) : (big() && !P.duck ? 26 : 14), nw = P.ride ? 16 : 12;
        if (nh !== P.h || nw !== P.w) { P.y += P.h - nh; P.x += (P.w - nw) / 2; P.h = nh; P.w = nw; }
      }
      function roomAbove() { // can you stand up (big) here?
        const x0 = (P.x + 1) >> 4, x1 = (P.x + P.w - 1) >> 4, ty = (P.y + P.h - 27) >> 4;
        for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) return false;
        return true;
      }
      function hurt() {
        if (P.inv > 0 || P.dead || P.grow || K.dbg.god) return;
        if (P.ride) { const d = P.ride; dismount(); d.st = 'scared'; d.t = 0; d.vx = (d.x < P.x ? -1 : 1) * 2.2; d.dir = Math.sign(d.vx); P.inv = 100; S.hurt(); P.vy = -3; return; }
        if (power === 'S') return die();
        dropCarry(false);
        power = (power === 'B') ? 'S' : 'B'; P.inv = 110; P.grow = -30; S.hurt(); shake = 4;
        setSize();
        if (reserve) { const k = reserve; reserve = ''; ent(k, cam.x + W / 2 - 7, cam.y + 20, { st: 'drop', t: 0 }); }
      }
      function die() {
        if (P.dead) return;
        P.dead = 1; P.vx = 0; P.vy = 0; dropCarry(false); if (P.ride) { P.ride.rm = true; P.ride = null; } dinoCarry = false;
        power = 'S'; K.music(null); S.dead(); setSize();
      }
      function dropCarry(throwIt) {
        const e = P.carry; if (!e) return; P.carry = null; e.carried = false;
        if (!throwIt) { e.vx = 0; e.vy = 0; e.st = e.k === 'cup' ? 'idle' : ''; return; }
        const up = K.held('up'), dn = K.held('down');
        e.x = P.dir > 0 ? P.x + P.w : P.x - e.w;
        if (e.k === 'cup') {
          if (up) { e.vy = -6.4; e.vx = P.vx * 0.6; e.st = 'idle'; e.thrown = 30; }
          else if (dn) { e.vx = 0; e.vy = 0; e.st = 'idle'; }
          else { e.vx = P.dir * 3.6; e.st = 'slide'; e.grace = 12; e.chain = 0; S.kick(); P.kick = 10; }
        } else { e.vx = dn ? 0 : P.dir * 2.2 + P.vx * 0.5; e.vy = up ? -5.6 : dn ? 0 : -2.4; }
        if (moveX(e, 0)) {} // (if it would end up in a wall, it stays where it is)
        const tx = (e.x + e.w / 2) >> 4, ty = (e.y + e.h / 2) >> 4; if (solid(tx, ty)) { e.x = P.x + P.w / 2 - e.w / 2; }
      }
      function mount(d, quiet) {
        P.ride = d; d.ridden = true; d.st = ''; d.vx = 0; P.spin = false; P.fly = 0; dropCarry(false);
        const feet = d.y + d.h; setSize(); P.y = feet - P.h; P.x = d.x + d.w / 2 - P.w / 2; P.vy = 0;
        if (!quiet) { S.hatch(); addScore(200, P.x, P.y); }
      }
      function dismount() {
        const d = P.ride; if (!d) return; P.ride = null; d.ridden = false;
        d.x = P.x + P.w / 2 - d.w / 2; d.y = P.y + P.h - d.h; d.vx = 0; d.vy = 0; d.dir = P.dir; d.t = 0; d.st = 'wait';
        setSize();
      }
      function stepPlayer() {
        if (P.dead) { // the "oops" hop: frozen a moment, then up and off the bottom of the screen
          P.dead++;
          if (P.dead === 36) P.vy = -5.2;
          if (P.dead > 36) { P.vy += 0.24; P.y += P.vy; }
          if (P.dead > 180) afterDeath();
          return;
        }
        if (P.grow) { P.grow += P.grow > 0 ? -1 : 1; return; }
        if (P.door) return stepDoor();
        const swim = inWater(P.x + P.w / 2, P.y + P.h * 0.4);
        if (swim && !P.swim) { for (let i = 0; i < 6; i++) fx('bub', P.x + Math.random() * 12, P.y + P.h, 0, -0.6 - Math.random(), 40); P.vy *= 0.3; P.fly = 0; P.spin = false; }
        P.swim = swim;
        const sx = P.auto ? P.auto : (K.held('right') ? 1 : 0) - (K.held('left') ? 1 : 0);
        const runH = !P.auto && (K.held('y') || K.held('x')), jumpH = !P.auto && (K.held('b') || K.held('a'));
        if (!P.auto) { if (K.pressed('b')) { P.jbuf = 7; P.jk = 0; } if (K.pressed('a')) { P.jbuf = 7; P.jk = 1; } }
        if (P.jbuf > 0) P.jbuf--;
        // duck (big Plumbo crouches; little Plumbo just looks small)
        const wantDuck = P.on && K.held('down') && !P.auto && !P.ride && !P.carry;
        if (wantDuck !== P.duck && P.on) { if (wantDuck || roomAbove()) { P.duck = wantDuck; setSize(); } }
        // run / walk / skid
        const max = P.swim ? 1.3 : runH ? (P.pm >= PMAX ? 3.0 : 2.4) : 1.4;
        P.skid = false;
        if (sx && !(P.duck && P.on)) {
          if (P.vx * sx < 0) { P.vx += sx * (P.on ? 0.24 : 0.12); if (P.on && Math.abs(P.vx) > 1) { P.skid = true; if (K.frame % 4 === 0) dust(P.x + P.w / 2, P.y + P.h); if (K.frame % 10 === 0) sfx.noise(0.08, 0.04, 2500); } }
          else if (Math.abs(P.vx) < max) P.vx = sx > 0 ? Math.min(max, P.vx + (P.on ? 0.1 : 0.08)) : Math.max(-max, P.vx - (P.on ? 0.1 : 0.08));
          else if (P.on) P.vx -= sx * 0.06;
          if (!P.spin) P.dir = sx;
        } else if (P.on) { const fr = P.duck ? 0.05 : 0.07; P.vx = Math.abs(P.vx) <= fr ? 0 : P.vx - Math.sign(P.vx) * fr; }
        if (Math.abs(P.vx) > max + 0.1 && !P.on && !P.fly) P.vx -= Math.sign(P.vx) * 0.02;
        // the P meter (run flat out for a bit and it fills: then you go even faster, and with the cape you can fly)
        if (P.on) { if (runH && sx && P.vx * sx > 0 && Math.abs(P.vx) >= 2.3) P.pm = Math.min(PMAX, P.pm + 1); else if (P.pm > 0) P.pm = Math.max(0, P.pm - 2); }
        else if (!P.fly && P.pm > 0 && !(power === 'C' && P.pm >= PMAX)) P.pm = Math.max(0, P.pm - 0.5);
        // jump
        if (P.jbuf > 0 && (P.on || P.coy > 0) && !P.swim) doJump();
        // falling: gravity (gentle while you hold jump on the way up), gliding with the cape, swimming
        if (P.swim) {
          P.vy = Math.min(P.vy + 0.06, 1.3);
          if (!P.auto && (K.pressed('b') || K.pressed('a'))) {
            const surf = L.water * T;
            if (P.y < surf + 2) { P.vy = -5.4; S.jump(); for (let i = 0; i < 6; i++) fx('bub', P.x + i * 2, surf, (i - 3) * 0.3, -1.2, 20, 0.1); }
            else { P.vy = P.vy > -2.3 ? -2.3 : Math.max(-3, P.vy - 0.8); S.swim(); fx('bub', P.x + P.w / 2 + P.dir * 6, P.y + 4, 0, -0.8, 50); }
          }
          if (K.held('down')) P.vy = Math.min(P.vy + 0.08, 1.8);
        } else if (P.fly > 0) {
          if (jumpH && power === 'C') { P.vy = Math.max(P.vy - 0.4, -3.1); P.fly--; if (K.frame % 6 === 0) fx('dust', P.x + P.w / 2 - P.dir * 8, P.y + P.h, -P.dir * 0.5, 0.4, 16); } else P.fly = 0;
          if (P.fly === 0) P.pm = 0;
        } else {
          P.vy += (P.vy < 0 && jumpH) ? 0.19 : 0.42;
          P.glide = power === 'C' && P.vy > 0 && jumpH && !P.carry && !P.ride;
          if (P.glide) { if (P.vy > 1.0) P.vy = Math.max(1.0, P.vy - 0.5); if (K.frame % 10 === 0) S.cape && sfx.noise(0.1, 0.02, 1500); }
          if (P.vy > 4.2) P.vy = 4.2;
        }
        // cape twirl / sherbet / Crumpet's tongue (Y)
        if (!P.auto && (K.pressed('y') || K.pressed('x'))) {
          if (P.ride) { if (!P.tongue) { P.tongue = 1; P.tongueHit = null; S.tongue(); } }
          else if (!P.carry && power === 'F' && P.throwT <= 0 && E.filter(e => e.k === 'ball' && !e.rm).length < 2) { ent('ball', P.x + P.w / 2 - 4 + P.dir * 8, P.y + (big() ? 8 : 4), { vx: P.dir * 3.8, vy: 1.6 }); P.throwT = 12; S.fire(); }
          else if (!P.carry && power === 'C' && !P.cspin) { P.cspin = 18; sfx.noise(0.2, 0.08, 2000, 0, 'bandpass', 700); }
        }
        if (P.throwT > 0) P.throwT--; if (P.kick > 0) P.kick--; if (P.cspin > 0) P.cspin--;
        if (P.tongue) { P.tongue++; if (P.tongue > 16) P.tongue = 0; }
        // carrying: let go of Y to throw
        if (P.carry && !runH) dropCarry(true);
        // move: riding a platform first
        if (P.plat && P.on) { P.x += P.plat.dx; moveX(P, 0, true); P.y = P.plat.y - P.h; }
        P.wasOn = P.on;
        const hx = moveX(P, P.vx, true); if (hx) { if (Math.abs(P.vx) > 2 && P.swim === false) {} P.vx = 0; P.pm = Math.max(0, P.pm - 8); }
        P.on = false; P.plat = null;
        const hy = moveY(P, P.vy, true);
        if (hy === 1) land();
        else if (hy === -1) { if (P.vy < 0) { P.vy = 0.5; hitBlock(hitTx, hitTy, 'head'); P.fly = 0; } }
        // platforms
        for (const p of PL) {
          if (p.gone) continue;
          if (P.vy >= 0 && P.x + P.w > p.x + 1 && P.x < p.x + p.w - 1 && P.y + P.h >= p.y - 1 && P.y + P.h - P.vy - Math.max(0, p.dy) <= p.y + 3) {
            P.y = p.y - P.h; if (!P.wasOn || P.vy > 1) land(); else { P.on = true; P.vy = 0; } P.plat = p; p.on = 1;
          }
        }
        if (!P.on && P.wasOn && P.vy >= 0) P.coy = 6; else if (P.coy > 0 && !P.on) P.coy--;
        if (P.on) P.coy = 0;
        // fell off the bottom of the world
        if (P.y > LH * T + 8) { die(); P.dead = 40; P.vy = 0; }
        // touching nasty tiles
        { const fx0 = (P.x + 2) >> 4, fx1 = (P.x + P.w - 2) >> 4, fy = (P.y + P.h) >> 4, my = (P.y + P.h - 4) >> 4;
          for (let tx = fx0; tx <= fx1; tx++) { const t = tileAt(tx, my), tb = tileAt(tx, fy); if (t === 13 || t === 14 || tb === 13) { die(); return; } if (tb === 12 && P.on || t === 12) { if (P.ride) { P.vy = -4; P.on = false; } else hurt(); } } }
        if (P.inv > 0) P.inv--;
        P.anim += Math.max(Math.abs(P.vx), P.on ? 0 : 0.6) * 0.18;
        setSize();
      }
      function doJump() {
        const sp = Math.abs(P.vx);
        if (P.ride && P.jk === 1) { // spin off Crumpet: a big leap off his back
          const d = P.ride; dismount(); d.vx = 0; P.vy = -5.8; P.on = false; P.jbuf = 0; P.coy = 0; S.spin(); return;
        }
        P.spin = P.jk === 1 && !P.carry && !P.ride;
        P.vy = -(P.spin ? 4.8 + sp * 0.14 : 5.15 + sp * 0.16);
        P.on = false; P.coy = 0; P.jbuf = 0; P.plat = null; P.chain = 0;
        if (power === 'C' && P.pm >= PMAX && !P.spin && !P.ride && !P.carry) { P.fly = 80; S.cape(); }
        if (P.spin) S.spin(); else S.jump();
      }
      function land() {
        if (P.vy > 2.6) { dust(P.x + 2, P.y + P.h, 1); dust(P.x + P.w - 2, P.y + P.h, 1); }
        // a big spin jump smashes bricks under you
        if (P.spin && big() && P.vy > 0) {
          const tx = (P.x + P.w / 2) >> 4, ty = (P.y + P.h + 1) >> 4;
          if (tileAt(tx, ty) === 2 && !L.q[tx + ',' + ty]) { hitBlock(tx, ty, 'spin'); P.vy = 1.2; P.on = false; return; }
        }
        // jelly blocks: boing (higher if you hold jump)
        { const tx = (P.x + P.w / 2) >> 4, ty = (P.y + P.h + 1) >> 4;
          if (tileAt(tx, ty) === 17) { const hold = K.held('b') || K.held('a'); P.vy = hold ? -8.8 : -6.2; P.on = false; bumps.push({ tx, ty, t: 0, down: 1 }); S.jelly(); P.chain = 0; P.spin = P.spin && hold; return; } }
        P.vy = 0; P.on = true; P.spin = false; P.fly = 0; P.chain = 0; P.glide = false;
        if (P.ride && P.ride.landT == null) {}
      }
      function stepDoor() { // through a door (or into the boss room): fade out, move, fade in
        P.door++;
        if (P.door === 24) {
          const d = P.doorTo;
          if (d.exit === 'exit') { P.door = 0; return courseClear('door'); }
          P.x = d.tx + 2; P.y = d.ty + 32 - P.h; P.vx = 0; P.vy = 0; if (P.ride) { P.ride.x = P.x; }
          camSnap();
          if (LN === 6 && P.x > 187 * T && !bossE) startBoss();
        }
        if (P.door >= 48) P.door = 0;
      }

      // ---------------------------------------------------------- the things in the level
      function defeat(e, how, pts) { // how: squash (flat), bonk (flies off upside down), puff (spun into smoke), gulp (Crumpet ate it), coin (sherbet turned it into a coin)
        if (e.dying || e.rm) return;
        if (e.k === 'boss') return;
        if (P.carry === e) { P.carry = null; }
        e.dying = how; e.dt = 0; e.carried = false;
        if (how === 'bonk') { e.vy = -3.6; e.vx = (e.x < P.x ? -1 : 1) * 1.2; stars(e.x + e.w / 2, e.y + e.h / 2, 4); S.bonk(); }
        else if (how === 'puff') { e.vx = 0; e.vy = 0; fx('puff', e.x + e.w / 2 - 8, e.y + e.h / 2 - 8, 0, 0, 24); stars(e.x + e.w / 2, e.y + e.h / 2, 6); }
        else if (how === 'coin') { e.rm = true; fx('puff', e.x + e.w / 2 - 8, e.y + e.h / 2 - 8, 0, 0, 20); coinPop(e.x + e.w / 2 - 6, e.y); S.fizz(); }
        else if (how === 'gulp') { e.rm = true; }
        else if (how === 'squash') { e.vx = 0; }
        if (pts) addScore(pts, e.x + e.w / 2 - 6, e.y - 8);
      }
      const CHAIN = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
      function chainPts(n, x, y) { if (n >= CHAIN.length) { oneUp(x, y); return 0; } return CHAIN[n]; }
      function stomp(e) {
        const n = P.chain++; const pts = chainPts(n, e.x, e.y - 8);
        P.vy = (K.held('b') || K.held('a')) ? -5.4 : -3.6; P.on = false; shake = Math.max(shake, 3);
        S.stomp(Math.min(n, 7));
        if (P.spin || P.ride) {
          if (e.k === 'boss') return;
          defeat(e, 'puff', pts); if (P.spin) P.vy = -3.2; return;
        }
        if (e.k === 'conk') { defeat(e, 'squash', pts); }
        else if (e.k === 'crab') { e.k = 'cup'; e.w = SZ.cup[0]; e.y += e.h - SZ.cup[1]; e.h = SZ.cup[1]; e.st = 'idle'; e.vx = 0; e.t = 0; addScore(pts, e.x, e.y - 8); stars(e.x + 8, e.y, 3); }
        else if (e.k === 'cup') { if (e.st === 'slide') { e.st = 'idle'; e.vx = 0; e.t = 0; addScore(pts, e.x, e.y - 8); } else { kickCup(e); } }
        else if (e.k === 'tin') { e.st = 'pile'; e.t = 0; e.vx = 0; addScore(pts, e.x, e.y - 8); }
        else defeat(e, e.k === 'conk' ? 'squash' : 'bonk', pts);
      }
      function kickCup(e) { e.st = 'slide'; e.vx = (P.x + P.w / 2 < e.x + e.w / 2 ? 1 : -1) * 3.6; e.grace = 12; e.chain = 0; S.kick(); P.kick = 10; addScore(200, e.x, e.y - 8); }
      function body(e, turnAtEdge, grav) { // walking things: gravity, walls (turn round), the ground
        e.vy = Math.min(e.vy + (grav || 0.3), 4);
        if (moveX(e, e.vx)) { e.vx = -e.vx; e.dir = -e.dir; e.wall = 1; } else e.wall = 0;
        e.on = moveY(e, e.vy, false) === 1; if (e.on) e.vy = 0;
        if (!e.on) for (const p of PL) if (!p.gone && e.vy >= 0 && e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h >= p.y && e.y + e.h - e.vy - 1 <= p.y + 2) { e.y = p.y - e.h; e.vy = 0; e.on = true; e.x += p.dx; }
        if (turnAtEdge && e.on) { const ax = e.vx > 0 ? (e.x + e.w + 1) >> 4 : Math.floor(e.x - 1) >> 4, ay = (e.y + e.h + 2) >> 4; if (!solid(ax, ay) && tileAt(ax, ay) !== 6) { e.vx = -e.vx; e.dir = -e.dir; } }
        if (e.y > LH * T + 40) e.rm = true;
      }
      function faceP(e) { e.dir = P.x + P.w / 2 < e.x + e.w / 2 ? -1 : 1; }
      function stepEnts() {
        const ax0 = cam.x - 96, ax1 = cam.x + W + 96;
        for (let i = 0; i < E.length; i++) {
          const e = E[i]; if (e.rm) continue;
          const always = e.k === 'ball' || e.k === 'boss' || e.k === 'crumb' || e.k === 'wave' || e.carried || e.ridden || e.dying || e.st === 'slide' || e.st === 'rise' || e.st === 'drop' || e.k === 'goal';
          if (!always && (e.x + e.w < ax0 || e.x > ax1)) continue;
          e.t++; e.f++;
          if (e.dying) { stepDying(e); continue; }
          if (e.carried) { e.x = P.dir > 0 ? P.x + P.w - 3 : P.x - e.w + 3; e.y = P.y + P.h - e.h - (big() ? 7 : 1); e.dir = P.dir; continue; }
          if (e.ridden) { e.x = P.x + P.w / 2 - e.w / 2; e.y = P.y + P.h - e.h; e.dir = P.dir; continue; }
          stepEnt(e);
          if (e.rm || e.dying) continue;
          interact(e);
        }
        if (E.length > 120 && K.frame % 60 === 0) E = E.filter(e => !e.rm);
      }
      function stepDying(e) {
        e.dt++;
        if (e.dying === 'squash') { if (e.dt > 30) { e.rm = true; fx('puff', e.x + e.w / 2 - 8, e.y + e.h - 14, 0, 0, 18); } }
        else if (e.dying === 'bonk') { e.vy += 0.25; e.x += e.vx; e.y += e.vy; if (e.y > cam.y + H + 40) e.rm = true; }
        else if (e.dying === 'puff') { if (e.dt > 8) e.rm = true; }
        else e.rm = true;
      }
      function stepEnt(e) {
        switch (e.k) {
          case 'conk': if (!e.vx) e.vx = 0.5 * e.dir; body(e, false); break;
          case 'crab': if (!e.vx) e.vx = 0.42 * e.dir; body(e, true); break;
          case 'prick': if (!e.vx) e.vx = 0.4 * e.dir; body(e, true); break;
          case 'tin':
            if (e.st === 'pile') { e.vx = 0; body(e, false); if (e.t > 200) { e.st = ''; e.vx = 0.5 * e.dir; e.y -= 0; fx('puff', e.x - 2, e.y + 4, 0, 0, 16); } }
            else { if (!e.vx) e.vx = 0.5 * e.dir; body(e, true); }
            break;
          case 'cup':
            if (e.st === 'slide') {
              e.vy = Math.min(e.vy + 0.3, 4);
              const wx = e.vx > 0 ? (e.x + e.w + 1) >> 4 : Math.floor(e.x - 1) >> 4, wy = (e.y + e.h / 2) >> 4;
              if (moveX(e, e.vx)) { const t = tileAt(wx, wy); if (t === 3 || t === 2 || t === 20) { if (e.x > cam.x - 16 && e.x < cam.x + W + 16) hitBlock(wx, wy, 'shell'); } e.vx = -e.vx; S.bump(); }
              e.on = moveY(e, e.vy, false) === 1; if (e.on) e.vy = 0;
              if (e.y > LH * T + 40) e.rm = true;
              if (e.grace > 0) e.grace--;
              if (e.x < cam.x - 200 || e.x > cam.x + W + 200) e.rm = true;
              // a sliding cup knocks baddies flying
              for (const o of E) if (o !== e && !o.rm && !o.dying && ENEMY[o.k] && o.k !== 'boss' && o.k !== 'crush' && o.k !== 'toffee' && o.k !== 'sheet' && overlap(e, o)) {
                const pts = CHAIN[Math.min(e.chain++, CHAIN.length - 1)]; defeat(o, 'bonk', pts); if (o.k === 'cup' && o.st === 'slide') defeat(e, 'bonk', 0);
              }
            } else {
              if (e.thrown > 0) e.thrown--;
              e.vx *= e.on ? 0.85 : 0.99; body(e, false);
              if (e.st === 'idle' && e.t > 420) { e.k = 'crab'; e.y -= SZ.crab[1] - e.h; e.w = SZ.crab[0]; e.h = SZ.crab[1]; e.st = ''; faceP(e); e.vx = 0.42 * e.dir; }
              // thrown up into a block
              if (e.vy < 0) { const tx = (e.x + e.w / 2) >> 4, ty = Math.floor(e.y - 1) >> 4; const t = tileAt(tx, ty); if (t === 2 || t === 3) { hitBlock(tx, ty, 'shell'); e.vy = 1; } }
            }
            break;
          case 'key': e.vx *= e.on ? 0.8 : 0.99; body(e, false, 0.3); if (e.y > LH * T) { e.x = e.hx; e.y = e.hy; e.vx = e.vy = 0; } break;
          case 'bee': e.x = e.hx + Math.sin(e.t / 70) * 44; e.y = e.hy + Math.sin(e.t / 11) * 4; e.dir = Math.cos(e.t / 70) > 0 ? 1 : -1; break;
          case 'beev': e.y = e.hy + Math.sin(e.t / 50) * 40; faceP(e); break;
          case 'bat':
            if (e.st === '') { if (Math.abs(P.x - e.x) < 70 && P.y > e.y - 8 && P.y - e.y < 170) { e.st = 'swoop'; e.t = 0; faceP(e); e.vx = e.dir * 1.3; e.vy = 2.2; sfx.tone(1200, 0.08, 'square', 0.03, 0, 1800); } }
            else { e.vy -= 0.035; if (e.vy < -0.4) e.vy = -0.4; e.x += e.vx; e.y += e.vy + Math.sin(e.t / 6) * 0.4; if (e.y < e.hy - 40) e.vy = 0.6; if (e.t > 600) e.rm = true; }
            break;
          case 'sheet': {
            const lookingAt = (P.dir > 0) === (e.x + e.w / 2 > P.x + P.w / 2);
            e.shy = lookingAt;
            if (!lookingAt) { const dx = P.x + P.w / 2 - (e.x + e.w / 2), dy = P.y + P.h / 2 - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1; if (d < 220) { e.vx = lerp(e.vx, dx / d * 0.55, 0.05); e.vy = lerp(e.vy, dy / d * 0.45, 0.05); } }
            else { e.vx *= 0.9; e.vy *= 0.9; }
            e.x += e.vx; e.y += e.vy + Math.sin(e.t / 20) * 0.15; faceP(e); break;
          }
          case 'crush':
            if (e.st === 'wait') { e.y = e.hy; const cx = e.x + e.w / 2, pc = P.x + P.w / 2; if (Math.abs(cx - pc) < 34 && P.y > e.y) { e.st = 'fall'; e.vy = 0; } }
            else if (e.st === 'fall') { e.vy = Math.min(e.vy + 0.45, 6.5); const r = moveY(e, e.vy, false, false); if (r === 1 || e.y > LH * T) { e.st = 'land'; e.t = 0; S.thud(); if (e.x > cam.x - 32 && e.x < cam.x + W + 32) shake = 8; dust(e.x + 4, e.y + e.h, 2); dust(e.x + e.w - 4, e.y + e.h, 2); } }
            else if (e.st === 'land') { if (e.t > 50) e.st = 'rise'; }
            else if (e.st === 'rise') { e.y -= 1; if (e.y <= e.hy) { e.y = e.hy; e.st = 'wait'; } }
            break;
          case 'toffee':
            if (e.st === 'wait') { e.y = e.hy + 20; if (e.t > 100) { e.st = 'jump'; e.vy = -6.2; e.t = 0; } }
            else { e.vy += 0.17; e.y += e.vy; if (K.frame % 3 === 0) fx('ember', e.x + 4 + Math.random() * 4, e.y + 10, 0, 0.3, 20); if (e.vy > 0 && e.y >= e.hy + 20) { e.st = 'wait'; e.t = 0; } }
            break;
          case 'fish': {
            const surf = L.water * T;
            if (Math.abs(P.x - e.x) < 90 && P.swim) { e.vx = lerp(e.vx, Math.sign(P.x - e.x) * 0.8, 0.02); e.vy = lerp(e.vy, Math.sign(P.y - e.y) * 0.5, 0.02); }
            else { e.vx = lerp(e.vx, Math.sin(e.t / 90) * 0.7, 0.05); e.vy = Math.sin(e.t / 25) * 0.3; }
            if (moveX(e, e.vx)) e.vx = -e.vx; moveY(e, e.vy, false); if (e.y < surf + 4) e.y = surf + 4;
            e.dir = e.vx >= 0 ? 1 : -1; break;
          }
          case 'dino':
            if (e.st === 'scared') { body(e, false); if (e.t > 80) { e.st = 'wait'; e.vx = 0; } }
            else { e.vx = 0; body(e, false); faceP(e); }
            break;
          case 'egg':
            if (e.st === 'rise') { e.y -= 1; if (e.y <= e.ry) { e.st = ''; e.t = 0; } }
            else { body(e, false); if (e.t > 45) { e.rm = true; fx('puff', e.x - 1, e.y, 0, 0, 20); const d = ent('dino', e.x - 3, e.y + e.h - 26, {}); faceP(d); S.hatch(); pop(e.x, e.y - 10, 'HELLO!', '#f8d020'); } }
            break;
          case 'cake': case 'oneup':
            if (e.st === 'rise') { e.y -= 0.6; if (e.y <= e.ry) { e.st = ''; e.vx = e.dir * (e.k === 'oneup' ? 1.2 : 1.0); } }
            else if (e.st === 'drop') { e.y += 1; e.x = clamp(e.x, cam.x + 8, cam.x + W - 24); if (e.t > 50) { e.st = ''; e.vx = 0; } }
            else { if (!e.vx) e.vx = e.dir; body(e, false); }
            break;
          case 'daisy':
            if (e.st === 'rise') { e.y -= 0.6; if (e.y <= e.ry) e.st = ''; } else if (e.st === 'drop') { e.y += 1; if (e.t > 50) e.st = ''; } else body(e, false);
            break;
          case 'bag':
            if (e.st === 'rise') { e.y -= 2.4; if (e.y <= e.ry - 24) { e.st = 'float'; e.t = 0; } }
            else if (e.st === 'drop') { e.y += 1; if (e.t > 50) { e.st = 'float'; e.t = 0; e.hx = e.x; } }
            else { if (!e.hx || e.t === 1) e.hx = e.x; e.x = e.hx + Math.sin(e.t / 22) * 18; e.y += 0.5; e.dir = Math.cos(e.t / 22) > 0 ? 1 : -1; if (e.y > LH * T) e.rm = true; }
            break;
          case 'ball':
            e.vy = Math.min(e.vy + 0.32, 4);
            if (moveX(e, e.vx)) { e.rm = true; fx('puff', e.x - 4, e.y - 4, 0, 0, 14); }
            if (moveY(e, e.vy, false) === 1) e.vy = -2.8;
            if (e.x < cam.x - 16 || e.x > cam.x + W + 16 || e.y > cam.y + H + 16 || e.t > 200) e.rm = true;
            if (L.water && inWater(e.x + 4, e.y + 4)) { e.rm = true; fx('bub', e.x, e.y, 0, -1, 30); }
            for (const o of E) if (!o.rm && !o.dying && ENEMY[o.k] && overlap(e, o)) {
              e.rm = true;
              if (o.k === 'boss') { o.sneeze = 12; S.fizz(); break; }
              if (o.k === 'crush' || o.k === 'sheet' || o.k === 'toffee' || o.k === 'wave') { fx('puff', e.x - 4, e.y - 4, 0, 0, 14); S.fizz(); break; }
              defeat(o, 'coin', 200); break;
            }
            break;
          case 'crumb':
            e.vy = Math.min(e.vy + 0.22, 4); e.x += e.vx; e.y += e.vy;
            if (e.y + e.h >= 20 * T) { e.y = 20 * T - e.h; e.vy = -e.bounce; e.bounce *= 0.7; if (e.bounce < 1.5) e.rm = true; }
            if (e.x < room.x0 + 16 || e.x > room.x1 - 28) e.vx = -e.vx;
            break;
          case 'wave': e.x += e.vx; if (e.x < room.x0 + 8 || e.x > room.x1 - 20) e.rm = true; if (K.frame % 3 === 0) fx('ember', e.x + 6, e.y + 10, 0, -0.5, 14); break;
          case 'boss': stepBoss(e); break;
          case 'mid': break;
          case 'goal': e.tape += e.tdir * 1.1; if (e.tape > 120) e.tdir = -1; if (e.tape < 0) e.tdir = 1; break;
        }
      }
      // what happens when Plumbo touches something
      function interact(e) {
        if (P.dead || P.door) return;
        const k = e.k;
        if (k === 'ball' || k === 'mid' && e.done) return;
        if (k === 'goal') {
          const ty = e.y + 128 - e.tape;
          if (P.x + P.w > e.x + 18 && P.x < e.x + 36 && P.y < ty + 4 && P.y + P.h > ty) return goalHit(e, ty);
          if (P.x > e.x + 26) return goalHit(e, -1);
          return;
        }
        // Crumpet's tongue
        if (P.ride && P.tongue && P.tongue < 12 && EDIBLE[k] && !e.carried) {
          const len = P.tongue < 7 ? P.tongue * 5 : (12 - P.tongue) * 6, ty = P.y + P.h - 22, tx0 = P.dir > 0 ? P.x + P.w + 4 : P.x - 4 - len;
          if (e.x < tx0 + len && e.x + e.w > tx0 && e.y < ty + 14 && e.y + e.h > ty - 8) {
            if (ENEMY[k]) { defeat(e, 'gulp', 200); S.gulp(); pop(e.x, e.y - 8, 'GULP!', '#f8d020'); coinPop(P.x + P.w / 2 - 6, P.y - 10); }
            else { e.rm = true; collectItem(k, e); }
            P.tongue = 12; return;
          }
        }
        if (!overlap(P, e)) {
          // the cape twirl reaches a little further
          if (P.cspin && ENEMY[k] && k !== 'boss' && k !== 'crush' && k !== 'sheet' && k !== 'toffee' && !(k === 'cup' && e.st !== 'slide') && Math.abs(e.x + e.w / 2 - (P.x + P.w / 2)) < 24 && e.y < P.y + P.h && e.y + e.h > P.y + 2) { defeat(e, 'bonk', 200); }
          return;
        }
        if (k === 'gbisc') { e.rm = true; gbMask |= 1 << e.id; const n = popcount(gbMask); S.gbisc(); sparkle(e.x + 7, e.y + 12); addScore(1000, e.x, e.y - 8); if (n === 5) { oneUp(e.x, e.y - 20); pop(e.x - 10, e.y - 30, 'ALL 5!', '#f8d020'); } return; }
        if (k === 'mid') { e.done = true; midLv = LN; S.mid(); addScore(500, e.x + 8, e.y + 10); if (power === 'S') { power = 'B'; setSize(); P.grow = 30; } sparkle(e.x + 16, e.y + 20); return; }
        if (k === 'keyhole') { if (P.carry && P.carry.k === 'key') secretExit(e); return; }
        if (k === 'key') { if ((K.held('y') || K.held('x')) && !P.carry && !P.ride) { P.carry = e; e.carried = true; S.menu(); } else if (!P.on && P.vy > 0 && P.y + P.h - e.y < 8) { P.y = e.y - P.h; P.vy = 0; P.on = true; } return; }
        if (k === 'dino') { if (!P.ride && !e.ridden && P.vy > 0 && P.y + P.h - e.y < 14 && !P.carry) mount(e); return; }
        if (k === 'egg') return;
        if (k === 'cake' || k === 'daisy' || k === 'bag' || k === 'oneup') { if (e.st === 'rise' && e.k !== 'bag') return; e.rm = true; collectItem(k, e); return; }
        if (!ENEMY[k]) return;
        // a resting cup: pick it up (hold Y) or kick it
        if (k === 'cup' && e.st !== 'slide') {
          if (e.thrown > 0) return;
          if ((K.held('y') || K.held('x')) && !P.carry && !P.ride) { P.carry = e; e.carried = true; e.st = 'idle'; e.t = 0; return; }
          if (!P.on && P.vy > 0 && P.y + P.h - e.y < 8) { stomp(e); return; }
          kickCup(e); return;
        }
        if (k === 'cup' && e.grace > 0) return;
        if (P.carry === e) return;
        // jumping on top of it?
        const fromAbove = P.vy > 0 && P.y + P.h - e.y < 10 + P.vy;
        if (k === 'boss') { if (fromAbove && e.st !== 'hurt' && e.st !== 'intro' && e.st !== 'defeat') bossHit(e); else if (e.st !== 'defeat' && e.st !== 'intro') hurt(); return; }
        if (k === 'crush') { if (fromAbove) { P.vy = -4; P.on = false; S.bump(); } else hurt(); return; }
        if (k === 'sheet' || k === 'toffee' || k === 'wave') { if ((k === 'toffee' || k === 'wave') && fromAbove && P.spin) { P.vy = -4; S.bump(); return; } hurt(); return; }
        if (k === 'crumb') { if (fromAbove && P.spin) { P.vy = -4; e.rm = true; fx('puff', e.x - 2, e.y - 2, 0, 0, 14); return; } hurt(); return; }
        if (fromAbove) {
          if (k === 'prick' && !P.spin && !P.ride) { hurt(); return; }
          if (k === 'tin' && e.st === 'pile') { if (P.spin) stomp(e); else { P.vy = -3.6; } return; }
          stomp(e); return;
        }
        if (k === 'tin' && e.st === 'pile') return;
        if (P.ride && (k !== 'prick')) { /* Crumpet doesn't mind a bump from the side... but you do */ }
        hurt();
      }
      const popcount = m => { let n = 0; while (m) { n += m & 1; m >>= 1; } return n; };
      function collectItem(k, e) {
        if (k === 'oneup') return oneUp(e.x, e.y);
        if (k === 'cake') { addScore(1000, e.x, e.y); if (power === 'S') { power = 'B'; P.grow = 36; setSize(); S.power(); } else { if (!reserve) reserve = 'cake'; S.power(); } return; }
        if (k === 'daisy') { addScore(1000, e.x, e.y); if (power === 'C' && !reserve) reserve = 'bag'; else if (power === 'F' && !reserve) reserve = 'daisy'; power = 'F'; P.grow = 36; setSize(); S.power(); sparkle(P.x + 6, P.y + 10); return; }
        if (k === 'bag') { addScore(1000, e.x, e.y); if (power === 'F' && !reserve) reserve = 'daisy'; else if (power === 'C' && !reserve) reserve = 'bag'; power = 'C'; P.grow = 24; setSize(); S.cape(); fx('puff', P.x - 2, P.y + P.h - 16, 0, 0, 20); return; }
      }
      function stepPlats() {
        for (const p of PL) {
          if (p.gone) continue;
          const ox = p.x, oy = p.y; p.t++;
          if (p.kind === 'h') p.x = p.x0 + (1 - Math.cos(p.t * 0.012 * p.sp)) * p.range / 2;
          else if (p.kind === 'v') p.y = p.y0 + (1 - Math.cos(p.t * 0.014 * p.sp)) * p.range / 2;
          else if (p.kind === 'f') { if (p.on && !p.st) p.st = 1; if (p.st) { p.st++; if (p.st > 26) { p.vy = Math.min(p.vy + 0.18, 4); p.y += p.vy; } if (p.y > LH * T + 20) p.gone = true; } }
          p.dx = p.x - ox; p.dy = p.y - oy; p.on = 0;
        }
      }

      // ---------------------------------------------------------- the end of a level: the goal tape, the keyhole, the door
      let clear = null; // { kind, t, tape, timeB, gbB, stage }
      function goalHit(e, ty) {
        if (clear) return;
        let tapeB = 0;
        if (ty >= 0) { const hgt = clamp(1 - (ty - e.y) / 128, 0, 1); tapeB = hgt > 0.92 ? 5000 : hgt > 0.7 ? 2000 : hgt > 0.45 ? 1000 : hgt > 0.2 ? 400 : 100; e.cut = { x: e.x + 24, y: ty, vy: -2 }; S.coin(); }
        e.tdir = 0;
        startClear('goal', tapeB);
      }
      function startClear(kind, tapeB) {
        clear = { kind, t: 0, tape: tapeB || 0, timeB: time * 10, gbN: popcount(gbMask), stage: 0, counted: 0 };
        K.music(null); S.clear();
        if (P.carry) { const c = P.carry; dropCarry(false); defeat(c, 'coin', 0); }
        for (const e of E) if (ENEMY[e.k] && !e.dying && !e.rm && e.k !== 'boss' && e.x > cam.x - 16 && e.x < cam.x + W + 16) defeat(e, 'coin', 0);
        P.auto = kind === 'goal' ? 1 : 0;
      }
      function courseClear(kind) { if (!clear) startClear(kind, 0); }
      function secretExit(e) {
        if (clear) return; secretFound = true;
        const key = P.carry; P.carry = null; if (key) { key.rm = true; }
        clear = { kind: 'secret', t: 0, tape: 0, timeB: time * 10, gbN: popcount(gbMask), stage: 0, counted: 0, kx: e.x + 8, ky: e.y + 12 };
        K.music(null); S.secret(); K.secret('lk.plumb.secret');
      }
      function stepClear() {
        const c = clear; c.t++;
        for (const e of E) if (ENEMY[e.k] && !e.dying && !e.rm && e.k !== 'boss' && e.x > cam.x - 8 && e.x < cam.x + W + 8) defeat(e, 'coin', 0);
        if (c.kind === 'goal') { // walk on through the posts
          if (P.on && c.t > 20) { P.auto = 1; } stepPlayer();
          if (P.x > cam.x + W + 20) P.x = cam.x + W + 20;
        }
        for (const e of E) if (e.cut) { e.cut.vy += 0.15; e.cut.y += e.cut.vy; }
        if (c.kind === 'secret' && c.t < 160) return;
        if (c.t >= 150 && c.stage === 0) c.stage = 1;
        if (c.t > 150 && c.stage === 1) { // count the time bonus into the score
          if (c.timeB > 0) { const d = Math.min(c.timeB, 50); c.timeB -= d; addScore(d); c.counted += d; if (K.frame % 3 === 0) S.tick(); }
          else if (c.tape) { const d = Math.min(c.tape, 100); c.tape -= d; addScore(d); if (K.frame % 3 === 0) S.tick(); }
          else { c.stage = 2; c.t2 = 0; }
        }
        if (c.stage === 2) { c.t2++; if (c.t2 > 90 || (c.t2 > 20 && (K.pressed('b') || K.pressed('a') || K.pressed('start')))) leaveLevel(true); }
      }
      function leaveLevel(won) {
        const kind = clear ? clear.kind : '';
        dinoCarry = !!P.ride;
        if (won) {
          const ex = kind === 'secret' ? '2s' : String(LN);
          const was = !!FL.cl[ex]; FL.cl[ex] = 1;
          FL.gb[LN] = Math.max(FL.gb[LN] || 0, popcount(gbMask));
          if (!was) mapUnlock = ex;
          midLv = 0;
        }
        clear = null; FL.node = NODES.findIndex(n => n.lv === LN); if (FL.node < 0) FL.node = 0;
        store();
        if (won && LN === 6) return startEnding();
        toMap();
        if (won) report();
      }

      // ---------------------------------------------------------- King Grumblesnout
      let bossSay = null;
      function startBoss() {
        bossE = ent('boss', L.boss.x - 18, 6 * T, { st: 'intro', hp: 3, t: 0, vy: 0, dir: -1, ix: 0 });
        bossOn = true; K.music(null);
      }
      function stepBoss(e) {
        const floor = 20 * T, speed = 0.9 + (3 - e.hp) * 0.35;
        if (e.sneeze > 0) { e.sneeze--; if (e.sneeze === 11) pop(e.x + 10, e.y - 6, 'ACHOO!', '#f8f8f8'); return; }
        const grav = () => { e.vy = Math.min(e.vy + 0.32, 6); e.y += e.vy; if (e.y + e.h >= floor) { const hard = e.vy > 3; e.y = floor - e.h; e.vy = 0; e.on = true; return hard; } e.on = false; return false; };
        const walls = () => { if (e.x < room.x0 + 18) { e.x = room.x0 + 18; e.vx = Math.abs(e.vx); } if (e.x + e.w > room.x1 - 18) { e.x = room.x1 - 18 - e.w; e.vx = -Math.abs(e.vx); } };
        switch (e.st) {
          case 'intro':
            if (grav()) { S.thud(); shake = 14; dust(e.x + 6, floor, 3); dust(e.x + e.w - 6, floor, 3); }
            if (e.t === 70) { bossSay = { s: "OI! THEM'S MY BISCUITS!", t: 150 }; S.boss(); }
            if (e.t > 150) { e.st = 'walk'; e.t = 0; K.music(song('boss')); }
            break;
          case 'walk':
            faceP(e); e.vx = e.dir * speed; e.x += e.vx; walls(); grav(); e.f = e.t;
            if (e.t > 90 + (e.hp * 20)) { e.t = 0; e.st = Math.random() < 0.5 ? 'pound' : 'throw'; if (e.st === 'pound') { e.vy = -7.4; e.vx = (P.x - e.x) / 46; S.boss(); } }
            break;
          case 'pound':
            e.x += e.vx; walls();
            if (grav()) { S.thud(); shake = 12; e.st = 'rest'; e.t = 0; for (const d of [-1, 1]) ent('wave', e.x + e.w / 2 - 6 + d * 20, floor - 12, { vx: d * (1.8 + (3 - e.hp) * 0.3) }); dust(e.x + 4, floor, 3); dust(e.x + e.w - 4, floor, 3); }
            break;
          case 'throw':
            faceP(e); grav();
            if (e.t % 34 === 20 && e.t < 20 + 34 * (4 - e.hp)) { ent('crumb', e.x + e.w / 2 - 6, e.y + 6, { vx: e.dir * (1.2 + Math.random() * 1.4), vy: -4.6, bounce: 4.4 }); sfx.tone(300, 0.1, 'square', 0.06, 0, 150); }
            if (e.t > 40 + 34 * (4 - e.hp)) { e.st = 'walk'; e.t = 0; }
            break;
          case 'rest': grav(); if (e.t > 40) { e.st = 'walk'; e.t = 0; } break;
          case 'hurt': grav(); e.x += e.vx; e.vx *= 0.95; walls(); if (e.t > 80) { e.st = e.hp > 0 ? 'walk' : 'defeat'; e.t = 0; if (e.hp > 0) { bossSay = { s: e.hp === 2 ? 'GRRR! STOP THAT!' : 'RIGHT! NOW I AM CROSS!', t: 110 }; S.boss(); } } break;
          case 'defeat':
            e.vy = -2.4 - e.t * 0.02; e.y += e.vy; e.x += Math.sin(e.t / 6) * 2; if (K.frame % 4 === 0) stars(e.x + e.w / 2, e.y + e.h, 2);
            if (e.t === 1) { bossSay = { s: "WAAAH! I'M TELLING MY MOM!", t: 160 }; for (const o of E) if (o.k === 'crumb' || o.k === 'wave') o.rm = true; }
            if (e.y < cam.y - 80 && !clear) { e.rm = true; startClear('boss', 0); }
            break;
        }
      }
      function bossHit(e) {
        e.hp--; e.st = 'hurt'; e.t = 0; e.vx = (e.x + e.w / 2 < P.x + P.w / 2 ? -1 : 1) * 2.4;
        P.vy = -5.6; P.on = false; shake = 12; flash = 6; S.bossHit(); stars(e.x + e.w / 2, e.y + 6, 8); addScore(e.hp ? 2000 : 5000, e.x + 10, e.y - 10);
        if (e.hp <= 0) { K.music(null); }
      }

      // ---------------------------------------------------------- dying, game over
      function afterDeath() {
        lives--;
        if (lives <= 0) { lives = 0; return gameOver(); }
        loadLevelFade(LN, midLv === LN);
      }
      let pendingLoad = null;
      function loadLevelFade(n, mid) { mode = 'enter'; mT = 0; pendingLoad = { n, mid }; K.music(null); }
      function gameOver() { mode = 'over'; mT = 0; K.music(null); S.over(); endKind = 'over'; }

      // ---------------------------------------------------------- the island map
      let mapUnlock = '', rev = null, walk = null, mapMenu = false, mapSel = 0;
      const MAPC = mapArt();
      const edgeOpen = e => !e.need || (FL && FL.cl[e.need]);
      const segs = e => { if (e._len) return e; let s = 0; e._l = [0]; for (let i = 1; i < e.pts.length; i++) { s += Math.hypot(e.pts[i][0] - e.pts[i - 1][0], e.pts[i][1] - e.pts[i - 1][1]); e._l.push(s); } e._len = s; return e; };
      EDGES.forEach(segs);
      function along(e, d) { // a point d pixels along an edge (from a to b)
        d = clamp(d, 0, e._len); let i = 1; while (i < e.pts.length - 1 && e._l[i] < d) i++;
        const a = e.pts[i - 1], b = e.pts[i], k = (d - e._l[i - 1]) / ((e._l[i] - e._l[i - 1]) || 1);
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      }
      function toMap() {
        mode = 'map'; mT = 0; walk = null; mapMenu = false; P.dead = 0; clear = null;
        K.music(song('map'));
        if (mapUnlock) { const es = EDGES.filter(e => e.need === mapUnlock); if (es.length) rev = { es, t: 0 }; mapUnlock = ''; }
      }
      function mapPos() {
        if (walk) { const p = along(walk.e, walk.fwd ? walk.d : walk.e._len - walk.d); return p; }
        const n = NODES[FL.node] || NODES[0]; return [n.x, n.y];
      }
      function stepMap() {
        if (rev) { rev.t++; if (rev.t % 3 === 0 && rev.t < rev.es.reduce((a, e) => Math.max(a, e._len), 0) / 2) S.dot(); if (rev.t > rev.es.reduce((a, e) => Math.max(a, e._len), 0) / 2 + 40) rev = null; return; }
        if (mapMenu) {
          if (K.pressed('up') || K.pressed('down')) { mapSel = 1 - mapSel; S.menu(); }
          if (K.pressed('start') || K.pressed('y')) { mapMenu = false; S.menu(); }
          else if (K.pressed('b') || K.pressed('a')) { S.ok(); if (mapSel === 0) mapMenu = false; else { store(); mapMenu = false; K.music(null); mode = 'done'; endRun('quit'); } }
          return;
        }
        if (walk) {
          walk.d += 1.25; if (K.frame % 12 === 0) S.walk();
          if (walk.d >= walk.e._len) { FL.node = walk.fwd ? walk.e.b : walk.e.a; walk = null; store(); }
          return;
        }
        const node = FL.node;
        for (const [b, dx, dy] of [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]]) {
          if (!K.held(b)) continue;
          let best = null, bs = 0.45;
          for (const e of EDGES) {
            if (!edgeOpen(e) || (e.a !== node && e.b !== node)) continue;
            const fwd = e.a === node, p0 = fwd ? e.pts[0] : e.pts[e.pts.length - 1], p1 = fwd ? e.pts[1] : e.pts[e.pts.length - 2];
            const vx = p1[0] - p0[0], vy = p1[1] - p0[1], m = Math.hypot(vx, vy) || 1, dot = (vx * dx + vy * dy) / m;
            if (dot > bs) { bs = dot; best = { e, fwd }; }
          }
          if (best) { walk = { e: best.e, fwd: best.fwd, d: 0 }; break; }
        }
        if (!walk && (K.pressed('b') || K.pressed('a'))) { const n = NODES[node]; if (n.lv > 0) { S.ok(); gbMask = 0; midLv = 0; loadLevelFade(n.lv, false); } else S.bump(); }
        if (!walk && K.pressed('start')) { mapMenu = true; mapSel = 0; S.menu(); }
      }
      function mapArt() { // the island, drawn once
        const c = mk(W, H), m = c.getContext('2d');
        m.fillStyle = grad(m, 0, 0, 0, H, ['#1858c0', '#2878e0', '#1858c0']); m.fillRect(0, 0, W, H);
        const blob = (cx, cy, rx, ry, seed, n) => { const pts = []; let a = seed; for (let i = 0; i < n; i++) { a = (a * 16807) % 2147483647; const t = i / n * Math.PI * 2, r = 0.86 + (a / 2147483647) * 0.2; pts.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); } return pts; };
        const shape = (pts, col, grow) => { m.fillStyle = col; m.beginPath(); pts.forEach(([x, y], i) => { const cx = 132, cy = 118; const X = x + (x - cx) * grow, Y = y + (y - cy) * grow; i ? m.lineTo(X, Y) : m.moveTo(X, Y); }); m.closePath(); m.fill(); };
        const main = blob(132, 118, 116, 80, 99, 22), isl = blob(40, 52, 22, 16, 7, 10);
        // shallows, sand, grass (the island has a bit of a cliff edge, for depth)
        shape(main, '#3898e8', 0.12); shape(main, '#f0d890', 0.03); shape(main, '#a07040', 0); m.save(); m.translate(0, -4); shape(main, '#48b040', -0.02); m.restore();
        for (const p of [isl]) { m.fillStyle = '#3898e8'; m.beginPath(); p.forEach(([x, y], i) => i ? m.lineTo(x + (x - 40) * 0.25, y + (y - 52) * 0.25) : m.moveTo(x + (x - 40) * 0.25, y + (y - 52) * 0.25)); m.fill(); m.fillStyle = '#f0d890'; m.beginPath(); p.forEach(([x, y], i) => i ? m.lineTo(x, y) : m.moveTo(x, y)); m.fill(); m.fillStyle = '#58c050'; m.beginPath(); p.forEach(([x, y], i) => i ? m.lineTo(x + (x - 40) * -0.25, y - 2 + (y - 52) * -0.25) : m.moveTo(x + (x - 40) * -0.25, y - 2 + (y - 52) * -0.25)); m.fill(); }
        // patches of lighter grass, hills, trees, mountains by the castle
        let r = 5; const rn = () => (r = (r * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 26; i++) ell(m, 40 + rn() * 190, 60 + rn() * 110, 8 + rn() * 10, 4 + rn() * 4, '#58c050');
        const hill = (x, y, s) => { ell(m, x, y + 2, 12 * s, 6 * s, '#287828'); ell(m, x, y, 11 * s, 7 * s, '#38a038'); ell(m, x - 3 * s, y - 3 * s, 4 * s, 2 * s, '#78d068'); };
        [[70, 120, 1], [92, 100, 1.2], [150, 150, 1], [176, 152, 0.8], [130, 90, 0.9], [230, 128, 0.8]].forEach(h => hill(...h));
        const tree = (x, y) => { rect(m, x - 1, y, 2, 4, '#704010'); ell(m, x, y - 2, 5, 5, '#206820'); ell(m, x - 1, y - 3, 3, 3, '#38a038'); };
        [[30, 150], [36, 140], [64, 182], [100, 176], [118, 168], [142, 172], [214, 154], [226, 146], [80, 90], [104, 80], [60, 132]].forEach(t => tree(...t));
        const peak = (x, y, s) => { poly(m, [x - 14 * s, y, x, y - 22 * s, x + 14 * s, y], '#8a7a8a'); poly(m, [x, y - 22 * s, x + 14 * s, y, x + 3 * s, y], '#6a5a6a'); poly(m, [x - 5 * s, y - 14 * s, x, y - 22 * s, x + 4 * s, y - 15 * s, x, y - 13 * s], '#f8f8f8'); };
        peak(182, 82, 1.1); peak(230, 86, 0.9); peak(170, 66, 0.8);
        // a lake
        ell(m, 174, 102, 13, 6, '#2878e0'); ell(m, 172, 101, 9, 3, '#58a8f8');
        // the level icons
        const n = NODES;
        // Plumbo's shed
        { const x = n[0].x - 16, y = n[0].y - 8; rect(m, x, y - 8, 14, 10, '#e8d8b8'); poly(m, [x - 2, y - 8, x + 7, y - 16, x + 16, y - 8], '#c83020'); rect(m, x + 5, y - 4, 4, 6, '#704018'); rect(m, x + 10, y - 6, 3, 3, '#78c8f8'); }
        // the cave: a rocky mound with a dark mouth
        { const x = n[2].x, y = n[2].y - 6; ell(m, x, y, 14, 9, '#786878'); ell(m, x - 3, y - 4, 7, 4, '#9888a0'); ell(m, x, y + 3, 6, 5, '#181020'); }
        // wafer heights: a pink wafer tower poking into the clouds
        { const x = n[3].x, y = n[3].y - 8; for (let i = 0; i < 4; i++) { rect(m, x - 6, y - i * 6, 12, 5, '#f090b0'); rect(m, x - 6, y - i * 6, 12, 1, '#f8c0d0'); } ell(m, x - 6, y - 24, 8, 4, '#fff'); ell(m, x + 6, y - 22, 7, 4, '#fff'); }
        // the gloomy pantry: a spooky little house
        { const x = n[4].x, y = n[4].y - 6; rect(m, x - 9, y - 8, 18, 12, '#584870'); poly(m, [x - 12, y - 8, x, y - 20, x + 12, y - 8], '#382848'); rect(m, x - 6, y - 5, 4, 4, '#f8e870'); rect(m, x + 2, y - 5, 4, 4, '#f8e870'); rect(m, x - 2, y - 2, 4, 6, '#201828'); }
        // bourbon castle
        { const x = n[6].x, y = n[6].y - 4; rect(m, x - 14, y - 16, 28, 18, '#9890a0'); rect(m, x - 14, y - 16, 28, 2, '#c0b8c8'); for (const tx of [-16, 10]) { rect(m, x + tx, y - 26, 8, 28, '#a8a0b0'); poly(m, [x + tx - 1, y - 26, x + tx + 4, y - 34, x + tx + 9, y - 26], '#c82838'); } rect(m, x - 4, y - 8, 8, 10, '#301828'); for (let i = 0; i < 4; i++) rect(m, x - 12 + i * 7, y - 19, 4, 3, '#9890a0'); }
        // the secret lagoon islet: a palm
        { const x = n[5].x + 8, y = n[5].y - 4; m.strokeStyle = '#a07040'; m.lineWidth = 2; m.beginPath(); m.moveTo(x, y); m.quadraticCurveTo(x + 2, y - 8, x - 1, y - 14); m.stroke(); for (const a of [-2.6, -1.9, -1.2, -0.5]) { m.strokeStyle = '#38a038'; m.beginPath(); m.moveTo(x - 1, y - 14); m.lineTo(x - 1 + Math.cos(a) * 8, y - 14 + Math.sin(a) * 4 + 4); m.stroke(); } }
        return crisp(c);
      }

      // ---------------------------------------------------------- menus
      const LOGO = { sup: fancy('SUPER', 2, ['#fff8e0'], '#a81818', 2, '#601010'), plu: fancy('PLUMBO', 5, ['#f84838', '#f8c818', '#48c848', '#3878f8', '#f88818', '#f868b8'], '#200810', 4, '#683048'), wor: fancy('WORLD', 3, ['#ffffff'], '#1838a8', 3, '#102060') };
      function fancy(str, k, cols, outline, depth, ext) {
        const w = F.width(str, k) + 8 + depth, h = 8 * k + 8 + depth;
        const m = mk(w, h), mg = m.getContext('2d'); mg.imageSmoothingEnabled = false;
        for (let i = 0; i < str.length; i++) F.draw(mg, str[i], 4 + i * 6 * k, 4, cols[i % cols.length], k);
        mg.globalCompositeOperation = 'source-atop';
        mg.fillStyle = 'rgba(255,255,255,.55)'; mg.fillRect(0, 4, w, Math.max(1, Math.round(k * 1.4)));
        mg.fillStyle = 'rgba(255,255,255,.25)'; mg.fillRect(0, 4 + Math.round(k * 1.4), w, Math.max(1, Math.round(k * 0.8)));
        mg.fillStyle = 'rgba(0,0,40,.3)'; mg.fillRect(0, 4 + k * 5, w, k * 2);
        const silOf = col => { const s = mk(w, h), sg = s.getContext('2d'); sg.drawImage(m, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, w, h); return s; };
        const sil = silOf(outline), sx = silOf(ext || outline);
        const out = mk(w, h), og = out.getContext('2d');
        const o = Math.max(1, Math.round(k / 2.5));
        for (let d = depth; d >= 1; d--) for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) og.drawImage(sx, d + dx, d + dy);
        for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]) og.drawImage(sil, dx, dy);
        og.drawImage(m, 0, 0);
        return crisp(out);
      }
      const panel = (x, y, w, h, col) => { // a bevelled Super Nintendo-style window
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 3, y + 3, w, h);
        g.fillStyle = '#f8f0d8'; g.fillRect(x, y, w, h); g.fillStyle = '#383050'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
        g.fillStyle = col || '#2a3a8a'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 2, y + 2, w - 4, 2); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 2, y + h - 4, w - 4, 2);
      };
      const wrap = (s, n) => { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
      function toTitle() { mode = 'title'; mT = 0; menu = 0; K.music(song('title')); }
      function startFile(i) {
        FI = i; FL = SV.files[i]; FL.cl = FL.cl || {}; FL.gb = FL.gb || {}; if (FL.node == null) FL.node = 0;
        score = 0; lives = 5; coins = 0; power = 'S'; reserve = ''; dinoCarry = false; lastRep = { t: K.t, sc: 0 };
        store();
      }
      let fileSel = 0, erasing = false, eraseAsk = -1, nameSel = 0, story = 0;
      function stepTitle() {
        if (mT > 0.5 && (K.pressed('start') || K.pressed('b') || K.pressed('a'))) { S.ok(); mode = 'files'; mT = 0; fileSel = 0; erasing = false; eraseAsk = -1; }
      }
      function stepFiles() {
        if (eraseAsk >= 0) {
          if (K.pressed('b') || K.pressed('a')) { SV.files[eraseAsk] = null; store(); eraseAsk = -1; erasing = false; S.brk(); }
          else if (K.pressed('y') || K.pressed('x') || K.pressed('start')) { eraseAsk = -1; S.menu(); }
          return;
        }
        if (K.pressed('up')) { fileSel = (fileSel + 3) % 4; S.menu(); } if (K.pressed('down')) { fileSel = (fileSel + 1) % 4; S.menu(); }
        if (K.pressed('y') || K.pressed('x')) { if (erasing) { erasing = false; S.menu(); } else { toTitle(); S.menu(); } return; }
        if (K.pressed('b') || K.pressed('a') || K.pressed('start')) {
          if (fileSel === 3) { erasing = !erasing; S.menu(); return; }
          const f = SV.files[fileSel];
          if (erasing) { if (f) { eraseAsk = fileSel; S.menu(); } else S.bump(); return; }
          S.ok();
          if (f) { startFile(fileSel); toMap(); }
          else { mode = 'name'; mT = 0; nameSel = 0; }
        }
      }
      function stepName() {
        if (K.pressed('left')) { nameSel = (nameSel + NAMES.length - 1) % NAMES.length; S.menu(); }
        if (K.pressed('right') || K.pressed('up') || K.pressed('down')) { nameSel = (nameSel + 1) % NAMES.length; S.menu(); }
        if (K.pressed('y') || K.pressed('x')) { mode = 'files'; S.menu(); return; }
        if (K.pressed('b') || K.pressed('a') || K.pressed('start')) {
          SV.files[fileSel] = { name: NAMES[nameSel], cl: {}, gb: {}, node: 0, t: 0 }; startFile(fileSel); S.ok();
          mode = 'story'; mT = 0; story = 0;
        }
      }
      const STORY = [
        'ONE SUNNY MORNING ON BISCUIT ISLE, PLUMBO WENT TO THE BISCUIT TIN FOR HIS ELEVENSES...',
        '...AND IT WAS EMPTY! KING GRUMBLESNOUT HAD NICKED EVERY BISCUIT ON THE WHOLE ISLAND. EVEN THE CUSTARD CREAMS.',
        'GET THEM BACK, PLUMBO! STOMP ACROSS THE ISLAND TO BOURBON CASTLE. AND KEEP AN EYE OUT FOR SECRETS...',
      ];
      function stepStory() {
        if (mT > 0.6 && (K.pressed('b') || K.pressed('a') || K.pressed('start'))) { S.menu(); story++; mT = 0; if (story >= STORY.length) toMap(); }
      }
      function stepPause() {
        if (K.pressed('up') || K.pressed('down')) { pauseSel = 1 - pauseSel; S.menu(); }
        if (K.pressed('start')) { paused = false; S.menu(); K.music(song(bossOn && bossE ? 'boss' : L.song, hurry)); return; }
        if (K.pressed('b') || K.pressed('a')) {
          S.ok(); paused = false;
          if (pauseSel === 0) { K.music(song(bossOn && bossE ? 'boss' : L.song, hurry)); return; }
          dinoCarry = !!P.ride; midLv = 0; FL.node = NODES.findIndex(n => n.lv === LN); store(); toMap();
        }
      }
      // ---- the high-score table (the lads' scores are already on it)
      function endRun(kind) {
        endKind = kind; finalSent = false;
        const lowest = SV.hi[SV.hi.length - 1];
        if (score > 0 && (!lowest || score > lowest.s)) { mode = 'initials'; mT = 0; const nm = (FL && FL.name || 'JAK').replace(/[^A-Z]/g, '') + 'AAA'; initials = [nm[0], nm[1], nm[2]]; iCur = 0; }
        else sendFinal();
      }
      const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?. ';
      function stepInitials() {
        const ci = ABC.indexOf(initials[iCur]);
        if (K.pressed('up')) { initials[iCur] = ABC[(ci + 1) % ABC.length]; S.menu(); }
        if (K.pressed('down')) { initials[iCur] = ABC[(ci + ABC.length - 1) % ABC.length]; S.menu(); }
        if (K.pressed('left') && iCur > 0) { iCur--; S.menu(); }
        if (K.pressed('right') && iCur < 2) { iCur++; S.menu(); }
        if (K.pressed('y') || K.pressed('x')) { if (iCur > 0) iCur--; S.menu(); }
        if (K.pressed('b') || K.pressed('a') || K.pressed('start')) {
          if (iCur < 2 && !K.pressed('start')) { iCur++; S.menu(); return; }
          const n = initials.join('').trim() || 'JAK';
          SV.hi.push({ n, s: score, me: 1 }); SV.hi.sort((a, b) => b.s - a.s); SV.hi.length = Math.min(SV.hi.length, 8);
          hiPos = SV.hi.findIndex(x => x.me); SV.hi.forEach(x => delete x.me); store(); S.oneup();
          mode = 'hiShow'; mT = 0;
        }
      }
      let finalWait = 0;
      function sendFinal() {
        if (finalSent) return;
        if (score > affordable() && finalWait < 25 * 60) { finalWait++; return; } // (checked again next frame)
        finalSent = true;
        const sc = Math.min(score, affordable());
        const ex = FL ? exitsOf(FL) : 0;
        if (endKind === 'quit') K.over(sc, { title: 'SAVED!', text: `Your file is saved (${ex} ${ex === 1 ? 'exit' : 'exits'} found). Pick it on the file screen to carry on.` });
        else if (endKind === 'won') K.over(sc, { title: 'BISCUIT ISLE IS SAVED!', text: `King Grumblesnout ran home to his Mom. ${ex} ${ex === 1 ? 'exit' : 'exits'} found${FL && FL.cl['2s'] ? ', secret one and all' : ''}.` });
        else K.over(sc, { title: 'GAME OVER', text: `Plumbo got as far as ${LVNAME[LN] ? LVNAME[LN].toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'the map'}. Your file is saved: pick CONTINUE next time.` });
      }
      // ---- the ending
      function startEnding() { mode = 'ending'; mT = 0; K.music(song('title')); ending = { t: 0 }; K.secret('lk.plumb.castle'); }

      // ================================================================ drawing
      const FONTH = 8;
      const txt = (s, x, y, col, k, sh) => F.draw(g, s, x, y, col || '#fff', k || 1, sh === undefined ? '#101020' : sh);
      const ctr = (s, y, col, k, sh) => F.center(g, s, W / 2, y, col || '#fff', k || 1, sh === undefined ? '#101020' : sh);
      function drawSprite(c, x, y, flipY) {
        if (!flipY) return g.drawImage(c, Math.round(x), Math.round(y));
        g.save(); g.translate(Math.round(x), Math.round(y + c.height)); g.scale(1, -1); g.drawImage(c, 0, 0); g.restore();
      }
      const at = (e, c) => [e.x + e.w / 2 - c.width / 2 - cx, e.y + e.h - c.height + 1 - cy];
      let cx = 0, cy = 0;
      function drawBack() {
        g.drawImage(BG.sky, 0, 0);
        const maxY = room.y1 - H;
        for (const l of BG.L) {
          const cw = l.c.width;
          let ox = -((cx * l.f + K.t * 60 * l.drift) % cw); if (ox > 0) ox -= cw;
          const oy = Math.round(l.y + (maxY - cy) * l.fy);
          for (let x = Math.round(ox); x < W; x += cw) g.drawImage(l.c, x, oy);
        }
      }
      function drawTiles() {
        const tx0 = Math.floor(cx / T), ty0 = Math.max(0, Math.floor(cy / T)), tx1 = tx0 + 17, ty1 = Math.min(LH - 1, ty0 + 15);
        const qf = CM.q[[0, 0, 1, 2, 3, 2, 1, 0][(K.frame >> 3) & 7]], cf = A.coin[(K.frame >> 3) & 3], lf = CM.lavaTop[(K.frame >> 3) & 3];
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = Math.max(0, tx0); tx <= Math.min(LW - 1, tx1); tx++) {
          const t = G8[ty * LW + tx]; if (!t || t === 20) continue;
          let x = tx * T - cx, y = ty * T - cy;
          if (bumps.length) for (const b of bumps) if (b.tx === tx && b.ty === ty) y += (b.down ? 1 : -1) * Math.round(Math.sin(Math.min(b.t, 10) / 10 * Math.PI) * 5);
          let c;
          switch (t) {
            case 1: { const i = ty * LW + tx, d = GD[i]; c = d ? TS.groundD[d - 1][GM[i]] : TS.ground[GM[i]]; break; } case 2: c = CM.brick; break; case 3: c = qf; break; case 4: c = CM.used; break; case 5: c = TS.hard; break;
            case 6: { const l = tileAt(tx - 1, ty) !== 6, r = tileAt(tx + 1, ty) !== 6; c = TS.semi[l ? 0 : r ? 2 : 1]; break; }
            case 7: g.drawImage(cf, x + 2, y); continue;
            case 8: c = CM.pipeTL; break; case 9: c = CM.pipeTR; break; case 10: c = CM.pipeL; break; case 11: c = CM.pipeR; break;
            case 12: c = CM.spike; break; case 13: c = lf; break; case 14: c = CM.lava; break; case 17: c = CM.jelly[bumps.length && bumps.some(b => b.tx === tx && b.ty === ty) ? 1 : 0]; break; case 19: c = CM.msg; break;
            default: continue;
          }
          g.drawImage(c, x, y);
        }
      }
      function drawDeco() {
        for (const d of L.deco) {
          let c = DC[d.k]; if (Array.isArray(c)) c = c[(K.frame >> 3) % c.length];
          const x = d.x - cx, y = d.y + T - c.height - cy; if (x > W || x + c.width < 0 || y > H || y + c.height < 0) continue;
          if (d.k === 'torch' || d.k === 'candle') { g.fillStyle = d.k === 'torch' ? 'rgba(248,140,40,.12)' : 'rgba(248,220,120,.10)'; g.beginPath(); g.arc(x + c.width / 2, y + 6, 22 + Math.sin(K.t * 9) * 2, 0, 7); g.fill(); }
          g.drawImage(c, Math.round(x), Math.round(y));
        }
        // doors
        for (const d of L.doors) { const c = LN === 6 && d.tx > 187 * T ? CM.bigdoor : CM.door[d.exit ? 1 : 0]; g.drawImage(c, d.x - cx - (c.width - 16) / 2, d.y + 32 - c.height - cy); }
      }
      function drawPlats() {
        for (const p of PL) {
          if (p.gone) continue;
          const x = Math.round(p.x - cx + (p.kind === 'f' && p.st > 0 && p.st < 26 ? (K.frame % 4 < 2 ? 1 : -1) : 0)), y = Math.round(p.y - cy);
          if (x > W || x + p.w < 0) continue;
          if (p.kind === 'f') { // a digestive biscuit: crumbles once you stand on it
            g.fillStyle = '#583010'; g.fillRect(x, y, p.w, 9); g.fillStyle = '#c88848'; g.fillRect(x + 1, y + 1, p.w - 2, 7); g.fillStyle = '#e8b070'; g.fillRect(x + 1, y + 1, p.w - 2, 2);
            g.fillStyle = '#986028'; for (let i = 4; i < p.w - 2; i += 6) g.fillRect(x + i, y + 4, 2, 2);
          } else { // a custard cream on a rail
            g.fillStyle = '#402008'; g.fillRect(x, y, p.w, 10); g.fillStyle = '#e8c070'; g.fillRect(x + 1, y + 1, p.w - 2, 3); g.fillStyle = '#fff8d8'; g.fillRect(x + 1, y + 4, p.w - 2, 2); g.fillStyle = '#d8a858'; g.fillRect(x + 1, y + 6, p.w - 2, 3);
            g.fillStyle = '#f8e0a0'; g.fillRect(x + 1, y + 1, p.w - 2, 1); g.fillStyle = '#a87830'; for (let i = 4; i < p.w - 2; i += 8) g.fillRect(x + i, y + 2, 3, 1);
          }
        }
      }
      function drawEnts(items) {
        for (const e of E) {
          if (e.rm) continue;
          const isItem = e.k === 'cake' || e.k === 'daisy' || e.k === 'bag' || e.k === 'oneup' || e.k === 'egg';
          if (items !== (isItem && e.st === 'rise')) continue;
          if (e.ridden) continue;
          if (e.x + e.w < cx - 40 || e.x > cx + W + 40 || e.y > cy + H + 40 || e.y + e.h < cy - 160) continue;
          const df = e.dir > 0 ? 0 : 1, f2 = (e.f >> 3) & 1, fl = e.dying === 'bonk';
          let c = null;
          switch (e.k) {
            case 'conk': c = e.dying === 'squash' ? A.conkFlat : A.conk[f2][df]; break;
            case 'crab': c = A.crab[f2][df]; break;
            case 'cup': c = A.cup[e.st === 'slide' ? (e.f >> 2) & 3 : 0]; if (e.st === 'idle' && e.t > 340) { const [x, y] = at(e, c); drawSprite(c, x + (K.frame % 4 < 2 ? 1 : -1), y, fl); continue; } break;
            case 'prick': c = A.prick[f2][df]; break;
            case 'bee': case 'beev': c = A.bee[(e.f >> 2) & 1][df]; break;
            case 'bat': c = A.bat[e.st === '' ? 2 : (e.f >> 3) & 1][df]; break;
            case 'sheet': c = A.sheet[e.shy ? 2 : (e.f >> 4) & 1][df]; g.globalAlpha = e.shy ? 0.75 : 0.92; break;
            case 'crush': c = A.crush[e.st === 'fall' || e.st === 'land' ? 1 : 0]; break;
            case 'toffee': c = A.toffee[(e.f >> 3) & 1]; { const [x, y] = at(e, c); drawSprite(c, x, y, e.vy > 0 && e.st === 'jump'); } continue;
            case 'tin': c = e.st === 'pile' ? A.tinPile : A.tin[f2][df]; if (e.st === 'pile' && e.t > 160) { const [x, y] = at(e, c); g.drawImage(c, x + (K.frame % 4 < 2 ? 1 : -1), y); continue; } break;
            case 'fish': c = A.fish[(e.f >> 3) & 1][df]; break;
            case 'dino': c = A.dino[e.st === 'scared' ? (e.f >> 2) & 1 : 0][df]; break;
            case 'egg': c = A.egg[e.t > 25 && K.frame % 8 < 4 ? 1 : 0]; break;
            case 'cake': c = A.cake; break;
            case 'daisy': c = A.daisy[(e.f >> 4) & 1]; break;
            case 'bag': c = A.bag; break;
            case 'oneup': c = A.oneup; break;
            case 'gbisc': c = A.gbisc[(e.f >> 3) & 3]; { const [x, y] = at(e, c); g.drawImage(c, x, y + Math.round(Math.sin(e.f / 12) * 1.5)); if (K.frame % 40 === e.id * 8) sparkle(e.x + 7, e.y + 6); } continue;
            case 'key': c = A.key; break;
            case 'keyhole': c = CM.keyhole; break;
            case 'ball': c = A.ball[(e.f >> 2) & 1]; break;
            case 'crumb': c = A.crumb[(e.f >> 3) & 1]; break;
            case 'wave': { const x = e.x - cx, y = e.y - cy; g.drawImage(A.star, x + 1, y + 2); g.drawImage(A.spark[(e.f >> 2) & 1], x + 2, y - 2); } continue;
            case 'boss': {
              const st = e.st, fr = st === 'hurt' ? 3 : st === 'pound' || st === 'intro' && !e.on ? 2 : st === 'throw' ? 4 : st === 'walk' ? ((e.f >> 3) & 1) : 0;
              c = A.boss[fr][df]; if (st === 'hurt' && K.frame % 6 < 3) continue;
              const [x, y] = at(e, c);
              g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(e.x + e.w / 2 - cx, 20 * T - cy, 20 * clamp(1 - (20 * T - e.y - e.h) / 200, 0.3, 1), 4, 0, 0, 7); g.fill();
              drawSprite(c, x, y, false); if (e.sneeze) { g.drawImage(A.puff[0], x + (df ? -6 : 44), y + 14); } continue;
            }
            case 'mid': {
              const x = e.x - cx, y = e.y - cy;
              for (const px of [x, x + 28]) { g.fillStyle = '#583010'; g.fillRect(px, y, 4, 48); g.fillStyle = '#f8f0e0'; g.fillRect(px + 1, y, 2, 48); for (let i = 0; i < 48; i += 8) { g.fillStyle = '#e83838'; g.fillRect(px + 1, y + i, 2, 4); } g.fillStyle = '#f8c818'; g.fillRect(px - 1, y - 3, 6, 4); }
              if (!e.done) { g.fillStyle = '#402008'; g.fillRect(x + 4, y + 18, 24, 5); g.fillStyle = '#f8c818'; g.fillRect(x + 4, y + 19, 24, 3); g.fillStyle = '#fff8a0'; g.fillRect(x + 4, y + 19, 24, 1); }
              continue;
            }
            case 'goal': {
              const x = e.x - cx, y = e.y - cy;
              for (const px of [x + 4, x + 40]) { g.fillStyle = '#301808'; g.fillRect(px - 1, y - 1, 6, 146); g.fillStyle = '#f8e8c8'; g.fillRect(px, y, 4, 144); g.fillStyle = '#c8a878'; g.fillRect(px + 3, y, 1, 144); for (let i = 0; i < 144; i += 12) { g.fillStyle = '#2858d8'; g.fillRect(px, y + i, 4, 5); } ell(g, px + 2, y - 3, 4, 4, '#f8c818'); }
              if (!e.cut) { const ty = y + 128 - e.tape; g.fillStyle = '#402008'; g.fillRect(x + 8, ty - 1, 32, 6); g.fillStyle = '#f8c818'; g.fillRect(x + 8, ty, 32, 4); g.fillStyle = '#fff8a0'; g.fillRect(x + 8, ty, 32, 1); }
              else { g.fillStyle = '#f8c818'; g.fillRect(e.cut.x - cx, e.cut.y - cy, 14, 3); }
              continue;
            }
          }
          if (!c) continue;
          const [x, y] = at(e, c);
          if (e.k === 'gbisc' || e.k === 'keyhole') {} else if (!fl && e.on !== undefined && ENEMY[e.k] && e.k !== 'sheet' && e.k !== 'bee' && e.k !== 'beev' && e.k !== 'bat' && e.k !== 'fish' && e.on) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(Math.round(x + 3), Math.round(e.y + e.h - cy), c.width - 6, 1); }
          drawSprite(c, x, y, fl);
          g.globalAlpha = 1;
        }
      }
      function plFrame() {
        const set = power === 'F' ? A.plF : A.pl, fr = big() ? set.B : set.S, d = P.dir > 0 ? 0 : 1;
        if (P.dead) return fr.dead[0];
        if (P.grow) { const k = (Math.abs(P.grow) >> 2) & 1; const other = (k ? set.S : set.B); return (P.grow > 0 ? (k ? set.B : set.S) : other).stand[d]; }
        if (P.ride) return fr.stand[d];
        if (P.spin || P.cspin) { const i = (K.frame >> 2) & 3; return i === 1 ? fr.front[0] : i === 3 ? fr.back[0] : fr.stand[i === 0 ? 0 : 1]; }
        if (P.swim && !P.on) return ((P.anim | 0) & 1 ? fr.swim : fr.jump)[d];
        if (P.kick) return fr.kick[d];
        if (P.duck) return fr.duck[d];
        if (!P.on) return (P.carry ? fr.hold : P.vy < 0 || P.fly ? (P.pm >= PMAX && power !== 'C' ? fr.run : fr.jump) : fr.fall)[d];
        if (P.skid) return fr.skid[d];
        const moving = Math.abs(P.vx) > 0.1, a = (P.anim | 0) & 1;
        if (P.carry) return (moving && a ? fr.hold2 : fr.hold)[d];
        if (!moving) return (K.held('up') ? fr.up : fr.stand)[d];
        if (P.pm >= PMAX) return (a ? fr.run : fr.run2)[d];
        return (big() ? (a ? fr.walk : fr.walk2) : (a ? fr.walk : fr.stand))[d];
      }
      function drawPlayer() {
        if (P.door > 12 && P.door < 36) return;
        if (P.inv > 0 && (K.frame & 3) < 2 && !P.dead) return;
        const c = plFrame(), feet = P.y + P.h;
        let x = Math.round(P.x + P.w / 2 - c.width / 2 - cx), y = Math.round(feet - c.height + 1 - cy);
        if (P.ride) {
          const d = A.dino[P.tongue ? 2 : P.on && Math.abs(P.vx) > 0.2 ? ((P.anim | 0) & 1) : 0][P.dir > 0 ? 0 : 1];
          const dx = Math.round(P.x + P.w / 2 - d.width / 2 - cx), dy = Math.round(feet - d.height + 1 - cy);
          const rx = Math.round(P.x + P.w / 2 - c.width / 2 - cx - P.dir * 5), ry = dy + 18 - c.height + 10;
          g.drawImage(c, rx, ry);
          g.drawImage(d, dx, dy);
          if (P.tongue) { const len = P.tongue < 7 ? P.tongue * 5 : Math.max(0, (12 - P.tongue) * 6), mx = P.dir > 0 ? dx + 26 : dx + 2, my = dy + 11; g.fillStyle = '#e83878'; g.fillRect(P.dir > 0 ? mx : mx - len, my, len, 2); ell(g, mx + P.dir * len, my + 1, 2.4, 2.4, '#f85898'); }
          return;
        }
        if (power === 'C' && !P.dead && !P.grow) {
          const capeK = P.glide && Math.abs(P.vx) > 0.8 ? 'glide' : P.fly || (!P.on && P.vy <= 0.5) || (P.on && Math.abs(P.vx) > 0.3) ? 'flap' : !P.on ? 'up' : 'hang';
          let cc = A.cape[capeK]; if (capeK === 'flap') cc = cc[(K.frame >> 3) & 1]; cc = cc[P.dir > 0 ? 0 : 1];
          const nx = P.x + P.w / 2 - cx - P.dir * 3, ny = y + (P.duck ? 20 : 10);
          if (!(P.spin || P.cspin) || (K.frame >> 2) % 2) g.drawImage(cc, Math.round(nx - cc.ax), Math.round(ny - cc.ay));
          if (P.cspin || P.spin) { g.fillStyle = 'rgba(40,40,56,.9)'; const a = K.frame * 0.9; g.fillRect(Math.round(nx + Math.cos(a) * 14 - 4), Math.round(ny + 6 + Math.sin(a) * 3), 9, 4); }
        }
        if (P.on && !P.swim && !P.dead) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(Math.round(P.x + 1 - cx), Math.round(feet - cy), P.w - 2, 1); }
        g.drawImage(c, x, y);
      }
      function drawFx() {
        for (const p of FX) {
          if (!p.on) continue;
          p.t++; p.x += p.vx; p.y += p.vy; p.vy += p.g; if (p.t >= p.life) { p.on = false; continue; }
          const x = Math.round(p.x - cx), y = Math.round(p.y - cy), k = p.t / p.life;
          switch (p.k) {
            case 'txt': F.draw(g, p.txt, x - F.width(p.txt, 1) / 2 + 6, y, p.col, 1, '#101020'); break;
            case 'star': g.drawImage(A.star, x - 4, y - 4); break;
            case 'spark': g.drawImage(A.spark[(p.t >> 2) & 1], x - 4, y - 4); break;
            case 'dust': g.drawImage(A.dust[Math.min(2, k * 3 | 0)], x - 4, y - 4); break;
            case 'puff': g.drawImage(A.puff[Math.min(2, k * 3 | 0)], x, y); break;
            case 'bit': g.save(); g.translate(x, y); g.rotate(p.t * 0.3 * Math.sign(p.vx || 1)); g.fillStyle = '#c86020'; g.fillRect(-3, -3, 6, 6); g.fillStyle = '#f8a058'; g.fillRect(-3, -3, 6, 2); g.fillStyle = '#702808'; g.fillRect(-3, 2, 6, 1); g.restore(); break;
            case 'coinpop': g.drawImage(A.coin[(p.t >> 2) & 3], x, y); if (p.t === p.life - 1) sparkle(p.x + 6, p.y + 8); break;
            case 'bub': g.strokeStyle = 'rgba(230,250,255,.85)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 1.6 + (p.t % 3 === 0 ? 0.3 : 0), 0, 7); g.stroke(); p.x += Math.sin(p.t / 5) * 0.3; if (L && L.water && p.y < L.water * T + 3) p.on = false; break;
            case 'ember': g.fillStyle = k < 0.5 ? '#f8d048' : '#f86818'; g.fillRect(x, y, 2, 2); break;
          }
        }
      }
      let WSKY = null;
      function drawWaterSky() { // above the lagoon's surface: the sky
        if (!L.water) return; const sy = L.water * T - cy; if (sy <= 0) return;
        if (!WSKY) { WSKY = mk(W, H); const wg = WSKY.getContext('2d'); wg.fillStyle = grad(wg, 0, 0, 0, H, ['#58a8f8', '#a8dcf8', '#e8f8ff']); wg.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) { const x = 20 + i * 52, y = 30 + (i % 3) * 22; for (let j = 0; j < 4; j++) ell(wg, x + (j - 1.5) * 8, y - (j % 3 === 1 ? 3 : 0), 9, 6, '#ffffff'); } crisp(WSKY); }
        const h = Math.min(H, Math.ceil(sy) + 4); g.drawImage(WSKY, 0, H - h, W, h, 0, 0, W, h);
      }
      function drawWater() {
        if (!L.water) return;
        const sy = L.water * T - cy; if (sy > H) return;
        const tx0 = Math.floor(cx / T), ty0 = Math.max(L.water, Math.floor(cy / T));
        for (let ty = ty0; ty <= Math.min(LH - 1, ty0 + 15); ty++) for (let tx = tx0; tx <= tx0 + 17; tx++) {
          const s = solid(tx, ty), y0 = ty === L.water ? 4 : 0;
          if (s && (tx < 15 || tx >= 166)) continue; // (the dry beaches)
          g.fillStyle = s ? 'rgba(30,100,230,.14)' : 'rgba(30,100,230,.30)'; g.fillRect(tx * T - cx, ty * T - cy + y0, T, T - y0);
        }
        const wf = CM.waterTop[(K.frame >> 3) & 3]; const ox = -(cx % 16);
        for (let x = ox; x < W; x += 16) if (!solid((x + cx) >> 4, L.water)) g.drawImage(wf, x, sy);
        if (K.frame % 20 === 0) fx('bub', cx + Math.random() * W, cy + H, 0, -0.5, 200);
      }
      const gbIcon = [0, 1].map(on => spr(9, 12, gg => { gg.fillStyle = on ? '#c87808' : '#3a3040'; gg.fillRect(1, 1, 7, 10); gg.fillStyle = on ? '#f8c820' : '#605868'; gg.fillRect(2, 2, 5, 8); if (on) { gg.fillStyle = '#fff0a0'; gg.fillRect(2, 2, 5, 1); gg.fillRect(4, 4, 1, 1); gg.fillRect(4, 7, 1, 1); } }, '#100808'));
      function drawHud() {
        const hy = 4;
        txt('PLUMBO', 8, hy, '#f86848'); txt('X' + String(lives).padStart(2, ' '), 14, hy + 10, '#fff');
        // golden biscuits
        for (let i = 0; i < 5; i++) g.drawImage(gbIcon[gbMask & (1 << i) ? 1 : 0], 55 + i * 9, hy - 2);
        // the P meter
        for (let i = 0; i < 6; i++) { const on = P.pm >= (i + 1) * PMAX / 6; const x = 56 + i * 6, y = hy + 11; g.fillStyle = '#201008'; g.fillRect(x, y, 5, 6); g.fillStyle = on ? '#f8f8f8' : '#484858'; g.fillRect(x + 1, y + 1, 2, 4); g.fillRect(x + 3, y + 2, 1, 2); }
        if (P.pm >= PMAX) txt('P', 94, hy + 10, K.frame % 8 < 4 ? '#f8d020' : '#f84838');
        // the reserve box
        const bx = W / 2 - 12; g.fillStyle = '#101020'; g.fillRect(bx - 1, 1, 26, 26); g.fillStyle = '#e8e0d0'; g.fillRect(bx, 2, 24, 24); g.fillStyle = '#202040'; g.fillRect(bx + 2, 4, 20, 20); g.fillStyle = '#2a3a8a'; g.fillRect(bx + 3, 5, 18, 18);
        if (reserve) { const c = reserve === 'cake' ? A.cake : reserve === 'daisy' ? A.daisy[0] : A.bag; g.drawImage(c, bx + 12 - c.width / 2, 14 - c.height / 2); }
        txt('TIME', 160, hy, '#f8d020'); txt(String(Math.max(0, time)).padStart(3, '0'), 166, hy + 10, time < 100 && K.frame % 30 < 15 ? '#f84838' : '#fff');
        g.drawImage(A.coin[0], 200, hy - 3); txt('X' + String(coins).padStart(2, '0'), 212, hy, '#fff');
        txt(String(score).padStart(5, '0'), 248 - F.width('00000', 1), hy + 10, '#fff');
      }
      function iris(r, fx0, fy0) { // the circle wipe (Super Nintendo style)
        g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(fx0, fy0, Math.max(0, r), 0, Math.PI * 2, true); g.fill('evenodd');
      }
      function drawLevel() {
        const sh = shake > 0 ? Math.round((Math.random() - 0.5) * shake) : 0;
        cx = Math.round(cam.x); cy = Math.round(cam.y) + sh;
        drawBack(); drawWaterSky(); drawDeco(); drawEnts(true); drawTiles(); drawPlats(); drawEnts(false); drawPlayer(); drawWater(); drawFx();
        if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash / 10})`; g.fillRect(0, 0, W, H); }
        drawHud();
        // iris in at the start
        if (lvT < 40) iris(lvT / 40 * 200, P.x + P.w / 2 - cx, P.y + P.h / 2 - cy);
        if (P.door) { const k = P.door < 24 ? P.door / 24 : 1 - (P.door - 24) / 24; g.fillStyle = `rgba(0,0,0,${clamp(k * 1.2, 0, 1)})`; g.fillRect(0, 0, W, H); }
        if (P.dead > 150) { g.fillStyle = `rgba(0,0,0,${(P.dead - 150) / 30})`; g.fillRect(0, 0, W, H); }
        if (bossSay && bossSay.t > 0) { bossSay.t--; const w = F.width(bossSay.s, 1) + 16; panel(W / 2 - w / 2, 34, w, 20, '#8a2a3a'); ctr(bossSay.s, 40, '#fff'); }
        if (clear) drawClear();
        if (msgBox) drawMsg();
        if (paused) drawPause();
        // the controls, the first time in
        if (lvT >= 420 && LN === 1) ctlShown = true;
        if (LN === 1 && lvT < 420 && !ctlShown && !msgBox && !paused && !clear && FL && !FL.cl['1']) { const a = clamp(Math.min(lvT - 40, 420 - lvT) / 30, 0, 1); if (a > 0) { g.globalAlpha = a; panel(30, 32, 196, 40, '#2a3a8a'); ctr(`${lab('b')} JUMP   ${lab('y')} RUN   ${lab('a')} SPIN`, 40, '#fff'); ctr('HIT THE PURPLE BLOCK TO READ IT!', 56, '#f8d020'); g.globalAlpha = 1; } }
      }
      function drawClear() {
        const c = clear;
        if (c.kind === 'secret') { const r = c.t < 120 ? 220 - c.t * 1.8 : Math.max(0, 220 - 120 * 1.8); iris(Math.max(r, c.t < 130 ? 4 : 0), c.kx - cx, c.ky - cy); if (c.t < 140) return; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
        if (c.t < 100 && c.kind !== 'secret') return;
        const a = clamp((c.t - 100) / 20, 0, 1); g.globalAlpha = a;
        panel(36, 58, 184, 104, '#2a3a8a');
        const title = c.kind === 'secret' ? 'SECRET EXIT!' : c.kind === 'boss' ? 'CASTLE CLEAR!' : 'COURSE CLEAR!';
        ctr(title, 68, c.kind === 'secret' ? '#f878f8' : '#f8d020', 2);
        txt('TIME BONUS', 52, 96, '#fff'); txt(String(c.timeB).padStart(5, ' '), 170, 96, '#fff');
        txt('TAPE BONUS', 52, 108, '#fff'); txt(String(c.tape).padStart(5, ' '), 170, 108, '#fff');
        txt('BISCUITS', 52, 120, '#fff'); for (let i = 0; i < 5; i++) { g.fillStyle = i < c.gbN ? '#f8c818' : '#584838'; g.fillRect(166 + i * 8, 120, 6, 8); }
        txt('SCORE', 52, 140, '#f8d020'); txt(String(score).padStart(5, '0'), 170, 140, '#f8d020');
        if (c.kind === 'secret' && c.t > 200) ctr('A HIDDEN PATH HAS OPENED!', 172, K.frame % 30 < 20 ? '#f878f8' : '#fff');
        g.globalAlpha = 1;
      }
      function drawMsg() {
        const lines = []; for (const l of msgBox.lines) lines.push(...wrap(l, 38));
        const h = lines.length * 11 + 22, y = Math.round(H / 2 - h / 2 - 10);
        panel(8, y, 240, h, '#4a2a8a');
        lines.forEach((l, i) => txt(l, 16, y + 9 + i * 11, '#fff'));
        if (K.frame % 40 < 28) txt('>', 236, y + h - 10, '#f8d020');
      }
      function drawPause() {
        g.fillStyle = 'rgba(0,0,20,.55)'; g.fillRect(0, 0, W, H);
        panel(48, 64, 160, 92, '#2a3a8a');
        ctr('PAUSED', 74, '#f8d020', 2);
        ['CARRY ON', 'BACK TO THE MAP'].forEach((s, i) => { txt(s, 84, 100 + i * 14, i === pauseSel ? '#fff' : '#9898c8'); if (i === pauseSel) txt('>', 72, 100 + i * 14, '#f8d020'); });
        ctr(`${lab('b')} PICK   START: GO`, 138, '#c8c8e8');
      }
      // ---- the map
      function drawMap() {
        g.drawImage(MAPC, 0, 0);
        // sparkles on the sea
        for (let i = 0; i < 14; i++) { const x = (i * 71 + K.t * 6 * (i % 2 ? 1 : -1)) % W, y = 30 + (i * 37) % 180; const xx = x < 0 ? x + W : x; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(xx | 0, y, (K.frame + i * 7) % 60 < 30 ? 4 : 2, 1); }
        // paths
        for (const e of EDGES) {
          if (!edgeOpen(e)) continue;
          let len = e._len; if (rev && rev.es.includes(e)) len = Math.min(e._len, rev.t * 2);
          const sea = e.need === '2s' || e.need === '5';
          for (let d = 4; d < len - 3; d += 6) { const [x, y] = along(e, d); if (sea && !onLand(x, y)) { ell(g, x, y + 1, 2.6, 1.6, '#204878'); ell(g, x, y, 2.6, 1.6, '#c8b8a0'); } else { g.fillStyle = '#704828'; g.fillRect(x - 2, y - 1, 4, 3); g.fillStyle = '#f0d8a0'; g.fillRect(x - 2, y - 2, 4, 3); } }
        }
        // level dots
        NODES.forEach((n, i) => {
          if (i > 0 && !EDGES.some(e => edgeOpen(e) && (e.a === i || e.b === i))) return;
          if (rev && rev.es.some(e => e.b === i) && rev.t * 2 < rev.es.find(e => e.b === i)._len) return;
          if (n.castle || n.house || n.lv === 0) { if (FL.cl[n.lv]) { g.fillStyle = '#2858d8'; g.fillRect(n.x + 8, n.y - 30, 1, 10); g.fillStyle = '#48c848'; g.fillRect(n.x + 9, n.y - 30, 6, 4); } return; }
          const cl = FL.cl[n.lv], col = n.red ? '#e83030' : '#f8d020', pulse = !cl && K.frame % 40 < 20;
          ell(g, n.x, n.y + 2, 7, 4, '#402010'); ell(g, n.x, n.y, 7, 4, pulse ? '#fff8c0' : col); ell(g, n.x - 2, n.y - 1, 3, 1.4, 'rgba(255,255,255,.6)');
          if (cl) { g.fillStyle = '#2858d8'; g.fillRect(n.x + 4, n.y - 12, 1, 10); g.fillStyle = '#48c848'; g.fillRect(n.x + 5, n.y - 12, 5, 4); }
          if (n.red && FL.cl['2s']) { g.drawImage(A.star, n.x - 13, n.y - 12); }
        });
        // Plumbo
        const [px, py] = mapPos(); const fr = A.mapPl[walk ? (K.frame >> 3) & 1 : 0][walk && walkDir() < 0 ? 1 : 0];
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(px, py + 2, 6, 2, 0, 0, 7); g.fill();
        if (dinoCarry) { const d = A.dino[walk ? (K.frame >> 3) & 1 : 0][0]; g.drawImage(fr, Math.round(px - 8 - 4), Math.round(py - 30 + (walk ? 0 : Math.round(Math.sin(K.t * 4))))); g.drawImage(d, Math.round(px - 14), Math.round(py - 29)); }
        else g.drawImage(fr, Math.round(px - 8), Math.round(py - 16 - (walk ? (K.frame >> 3) & 1 : 0)));
        // the panels
        panel(0, 0, W, 24, '#2a3a8a');
        txt('BISCUIT ISLE', 8, 8, '#f8d020'); txt(FL.name, 248 - F.width(FL.name, 1), 8, '#fff');
        txt('X' + lives, 112, 8, '#fff'); g.drawImage(A.mapPl[0][0], 94, 2);
        panel(0, 194, W, 30, '#2a3a8a');
        const n = NODES[FL.node];
        if (!walk) {
          const name = n.lv ? LVNAME[n.lv] : n.name;
          txt(name, 8, 200, '#fff');
          if (n.lv) { const best = FL.gb[n.lv] || 0; for (let i = 0; i < 5; i++) { g.fillStyle = i < best ? '#f8c818' : '#584838'; g.fillRect(170 + i * 8, 200, 6, 8); } txt(FL.cl[n.lv] ? 'DONE' : '', 214, 200, '#78f878'); if (n.red && FL.cl['2s']) { g.drawImage(A.star, 140, 199); } }
          txt(n.lv ? `${lab('b')} PLAY   D-PAD WALK   START MENU` : 'D-PAD: WALK TO A LEVEL   START: MENU', 8, 212, '#c8c8f8');
        } else txt('...', 8, 200, '#fff');
        if (rev) { panel(40, 96, 176, 24, '#6a2a8a'); ctr('A NEW PATH HAS OPENED!', 104, '#fff'); }
        if (mapMenu) { panel(64, 80, 128, 58, '#2a3a8a'); ['BACK TO THE MAP', 'SAVE AND QUIT'].forEach((s, i) => { txt(s, 84, 92 + i * 14, i === mapSel ? '#fff' : '#9898c8'); if (i === mapSel) txt('>', 74, 92 + i * 14, '#f8d020'); }); ctr('YOUR FILE SAVES BY ITSELF', 124, '#c8c8e8'); }
      }
      function walkDir() { if (!walk) return 1; const a = along(walk.e, walk.fwd ? walk.d : walk.e._len - walk.d), b = along(walk.e, walk.fwd ? walk.d + 2 : walk.e._len - walk.d - 2); return b[0] >= a[0] ? 1 : -1; }
      const LANDC = (() => { const c = MAPC.getContext('2d'); return (x, y) => { try { const d = c.getImageData(x | 0, y | 0, 1, 1).data; return !(d[2] > d[0] + 60); } catch (e) { return true; } }; })();
      const landCache = {};
      function onLand(x, y) { const k = (x | 0) + ',' + (y | 0); if (landCache[k] == null) landCache[k] = LANDC(x, y); return landCache[k]; }
      // ---- the title
      const TITLE = { bg: backdrop('grass'), gt: tiles('grass'), x: 0 };
      function drawTitleBg(t) {
        const T0 = TITLE; g.drawImage(T0.bg.sky, 0, 0);
        const scx = t * 30;
        for (const l of T0.bg.L) { const cw = l.c.width; let ox = -((scx * l.f + t * 60 * l.drift) % cw); if (ox > 0) ox -= cw; for (let x = Math.round(ox); x < W; x += cw) g.drawImage(l.c, x, l.y + 24); }
        const gy = 192, off = -Math.round(scx % 16);
        for (let x = off; x < W; x += 16) { g.drawImage(T0.gt.ground[1], x, gy); g.drawImage(T0.gt.ground[0], x, gy + 16); }
      }
      function drawTitle() {
        const t = K.t;
        drawTitleBg(t);
        // a little attract: Plumbo chasing a conker along the grass
        const run = (t * 70) % (W + 120) - 60, f = (K.frame >> 3) & 1;
        g.drawImage(A.conk[f][0], Math.round(run + 30), 176); g.drawImage(A.pl.S[f ? 'run' : 'run2'][0], Math.round(run), 176);
        if (Math.sin(t * 3) > 0.9) g.drawImage(A.coin[(K.frame >> 3) & 3], Math.round(run + 4), 150);
        const showHi = mode === 'title' && (t % 16) > 9;
        if (!showHi) {
          const bob = k => Math.round(Math.sin(t * 2 + k) * 2);
          g.drawImage(LOGO.sup, W / 2 - LOGO.sup.width / 2, 14 + bob(0));
          g.drawImage(LOGO.plu, W / 2 - LOGO.plu.width / 2, 34 + bob(1));
          g.drawImage(LOGO.wor, W / 2 - LOGO.wor.width / 2, 82 + bob(2));
          g.drawImage(A.pl.B.jump[0], 20, 96 + bob(3)); g.drawImage(A.gbisc[(K.frame >> 3) & 3], 222, 100 + bob(4));
          if (mode === 'title') { if (K.frame % 50 < 34) ctr('PRESS START', 128, '#fff', 1); ctr('HI-SCORE ' + String(Math.max(K.best, SV.hi[0] ? SV.hi[0].s : 0)).padStart(5, '0'), 146, '#f8d020'); }
        } else drawHiTable(28, -1);
        ctr('(C) 1999 BISCUIT BROS.', 214 - 6, '#ffffff', 1, '#203020');
      }
      function drawHiTable(y, hl) {
        panel(40, y, 176, 24 + SV.hi.length * 12, '#2a3a8a');
        ctr('TOP PLUMBERS', y + 8, '#f8d020');
        SV.hi.forEach((h, i) => { const col = i === hl ? (K.frame % 20 < 10 ? '#f8d020' : '#fff') : '#fff'; txt(`${i + 1}.`, 56, y + 22 + i * 12, '#9898c8'); txt(h.n, 76, y + 22 + i * 12, col); txt(String(h.s).padStart(5, ' '), 166, y + 22 + i * 12, col); });
      }
      function drawFiles() {
        drawTitleBg(K.t); g.fillStyle = 'rgba(0,0,30,.35)'; g.fillRect(0, 0, W, H);
        panel(20, 22, 216, 156, '#2a3a8a');
        ctr(erasing ? 'ERASE WHICH FILE?' : 'SELECT A FILE', 32, erasing ? '#f87878' : '#f8d020', 1);
        for (let i = 0; i < 3; i++) {
          const f = SV.files[i], y = 54 + i * 26, on = fileSel === i;
          if (on) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(28, y - 5, 200, 22); }
          txt('FILE ' + 'ABC'[i], 44, y, on ? '#fff' : '#a8a8d8');
          if (f) { txt(f.name, 100, y, on ? '#fff' : '#c8c8e8'); g.drawImage(A.star, 100, y + 9); txt(String(exitsOf(f)).padStart(2, ' ') + (exitsOf(f) === 1 ? ' EXIT' : ' EXITS'), 110, y + 9, '#f8d020'); if (f.cl['6']) txt('DONE!', 186, y + 9, '#78f878'); }
          else txt('NEW GAME', 100, y, on ? '#78f878' : '#88a888');
        }
        { const y = 136, on = fileSel === 3; if (on) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(28, y - 5, 200, 18); } txt(erasing ? 'DO NOT ERASE' : 'ERASE A FILE', 44, y, on ? '#fff' : '#a8a8d8'); }
        const cy2 = fileSel < 3 ? 54 + fileSel * 26 : 136; g.drawImage(A.pl.S.stand[0], 26, cy2 - 6 + Math.round(Math.sin(K.t * 6)));
        ctr(`${lab('b')} PICK   ${lab('y')} BACK`, 162, '#c8c8e8');
        if (eraseAsk >= 0) { panel(36, 80, 184, 50, '#8a2a2a'); ctr('ERASE FILE ' + 'ABC'[eraseAsk] + '?', 90, '#fff'); ctr('THAT CANNOT BE UNDONE!', 102, '#f8d020'); ctr(`${lab('b')} YES  ${lab('y')} NO`, 116, '#fff'); }
        ctr('HOLD ON TO YOUR BISCUITS', 196, '#fff', 1, '#203020');
      }
      function drawName() {
        drawTitleBg(K.t); g.fillStyle = 'rgba(0,0,30,.35)'; g.fillRect(0, 0, W, H);
        panel(28, 50, 200, 100, '#2a3a8a');
        ctr('NAME YOUR FILE', 60, '#f8d020');
        const n = NAMES[nameSel]; ctr('<  ' + n + '  >', 86, '#fff', 2);
        ctr('LEFT / RIGHT: CHANGE', 112, '#c8c8e8'); ctr(`${lab('b')} OK   ${lab('y')} BACK`, 126, '#c8c8e8');
      }
      function drawStory() {
        const t = mT;
        g.fillStyle = grad(g, 0, 0, 0, H, ['#f8a868', '#f8d8a0']); g.fillRect(0, 0, W, H);
        g.drawImage(MAPC, 0, 0); g.fillStyle = 'rgba(20,10,40,.35)'; g.fillRect(0, 0, W, H);
        if (story === 0) {
          g.drawImage(A.pl.B[(K.frame >> 5) & 1 ? 'up' : 'stand'][0], 96, 96);
          const x = 120, y = 106; rect(g, x - 1, y - 1, 30, 22, '#101830'); rect(g, x, y, 28, 20, '#3858c8'); rect(g, x, y + 5, 28, 3, '#f8d020'); rect(g, x, y + 14, 28, 2, '#f8d020'); rect(g, x + 20, y, 4, 20, '#5878e0');
          ell(g, x + 14, y, 14, 4, '#7898f0'); ell(g, x + 14, y, 11, 2.6, '#101830'); ell(g, x + 36, y - 6, 9, 3, '#7898f0', -0.5); F.draw(g, '?', x + 40, y - 30 + Math.round(Math.sin(t * 6) * 2), '#fff', 2, '#101020');
        }
        if (story === 1) { g.drawImage(A.boss[(K.frame >> 3) & 1][1], 140 - (t * 40 % 60), 70); for (let i = 0; i < 5; i++) g.drawImage(A.gbisc[(K.frame >> 3 + i) & 3], 196 - (t * 40 % 60) + i * 6, 76 + (i % 2) * 6); g.drawImage(A.pl.B.front[0], 60, 90); }
        if (story === 2) { g.drawImage(A.pl.B.jump[0], 110, 80 - Math.abs(Math.sin(t * 4)) * 16); }
        panel(8, 140, 240, 70, '#2a3a8a');
        wrap(STORY[story], 37).forEach((l, i) => txt(l, 16, 152 + i * 12, '#fff'));
        if (K.frame % 40 < 28) txt('>', 236, 198, '#f8d020');
      }
      function drawEnter() {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        const n = pendingLoad ? pendingLoad.n : LN;
        ctr(LVNAME[n], 84, '#fff', 2);
        g.drawImage(A.pl.S.stand[0], 104, 112); txt('X ' + lives, 126, 118, '#fff');
        if (n === 6) ctr('THE LAST ONE. GOOD LUCK!', 150, '#f8d020');
        else if (n === 5) ctr('A SECRET LEVEL!', 150, '#f878f8');
      }
      function drawOver() {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        const k = clamp(mT / 1.2, 0, 1);
        g.globalAlpha = k; const go = LOGO.over || (LOGO.over = fancy('GAME OVER', 3, ['#f84838', '#f8c818'], '#300808', 3, '#681818'));
        g.drawImage(go, W / 2 - go.width / 2, 70 - (1 - k) * 20); g.globalAlpha = 1;
        g.drawImage(A.pl.S.dead[0], 120, 120);
        if (mT > 1.5) { ctr('SCORE ' + String(score).padStart(5, '0'), 150, '#fff'); ctr('YOUR FILE IS SAVED.', 166, '#c8c8e8'); }
      }
      function drawInitials() {
        drawTitleBg(K.t); g.fillStyle = 'rgba(0,0,30,.45)'; g.fillRect(0, 0, W, H);
        panel(28, 30, 200, 130, '#2a3a8a');
        ctr('NEW HIGH SCORE!', 42, K.frame % 20 < 10 ? '#f8d020' : '#fff', 1);
        ctr(String(score).padStart(5, '0'), 58, '#fff', 2);
        ctr('ENTER YOUR NAME', 84, '#c8c8e8');
        for (let i = 0; i < 3; i++) { const x = 96 + i * 24, on = i === iCur; panel(x - 4, 98, 20, 24, on ? '#4a5ad8' : '#202060'); txt(initials[i], x + 1, 104, '#fff', 2); if (on && K.frame % 30 < 20) { txt('^', x + 3, 124, '#f8d020'); } }
        ctr(`UP/DOWN: LETTER  ${lab('b')}: NEXT`, 140, '#c8c8e8');
      }
      function drawEnding() {
        const t = mT;
        if (t < 7) { // the castle falls down
          g.fillStyle = grad(g, 0, 0, 0, H, ['#283880', '#8090d8', '#f8c8a0']); g.fillRect(0, 0, W, H);
          ell(g, 128, 230, 200, 70, '#48a040'); ell(g, 128, 226, 190, 60, '#58b850');
          const sink = clamp((t - 1.5) * 18, 0, 70), sx = t > 1.5 && t < 5 ? Math.round(Math.sin(t * 50) * 2) : 0;
          g.save(); g.beginPath(); g.rect(0, 0, W, 180); g.clip();
          const x = 128 + sx, y = 120 + sink;
          castleArt(x, y);
          g.restore();
          if (t > 1.5 && t < 5.5 && K.frame % 3 === 0) fxDust(70 + Math.random() * 116, 168 + Math.random() * 10);
          if (t > 4.5) { ctr('BOURBON CASTLE IS RUBBLE!', 30, '#fff', 1); }
          g.drawImage(A.pl.B.front[0], 40, 160); if (dinoCarry) g.drawImage(A.dino[0][0], 14, 160);
          drawEndDust();
        } else { // home, with the biscuits back, and the credits
          g.fillStyle = grad(g, 0, 0, 0, H, ['#f8a868', '#f8e0b0']); g.fillRect(0, 0, W, H);
          ell(g, 128, 236, 220, 70, '#48a040');
          const gf = A.gbisc[0]; for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) g.drawImage(gf, 160 + i * 17 + r * 8, 172 - r * 20);
          g.drawImage(A.pl.B[Math.floor(t * 3) % 2 ? 'jump' : 'stand'][0], 110, 154 - (Math.floor(t * 3) % 2) * 8);
          const CRED = ['THE BISCUITS ARE BACK IN THE TIN.', 'KING GRUMBLESNOUT HAS GONE', 'HOME TO HIS MOM. (SHE WAS CROSS.)', '', 'SUPER PLUMBO WORLD', '', 'STARRING', 'PLUMBO THE PLUMBER', 'CRUMPET THE DINO-PAL', 'KING GRUMBLESNOUT (BOO!)', '', 'MADE BY THE BISCUIT BROS.', 'IN A SHED, IN 1999', '', 'THANKS FOR PLAYING!', '', 'THE END'];
          const sc = (t - 7) * 18;
          g.save(); g.beginPath(); g.rect(0, 8, W, 124); g.clip();
          CRED.forEach((l, i) => { const y = 140 + i * 14 - sc; if (y > -10 && y < 150) ctr(l, Math.round(y), i === 4 || i === 16 ? '#f8d020' : '#fff', i === 16 ? 2 : 1, '#402010'); });
          g.restore();
        }
        if (t > 3) txt('START: SKIP', 186, 214, 'rgba(255,255,255,.7)');
      }
      function castleArt(x, y) { // the castle, with bricks and shading
        for (const [tx, tw] of [[-58, 24], [34, 24]]) {
          g.fillStyle = grad(g, x + tx, 0, x + tx + tw, 0, ['#c8c0d0', '#a8a0b0', '#787088']); g.fillRect(x + tx, y - 60, tw, 92);
          for (let i = 0; i < 4; i++) g.fillRect(x + tx - 2 + i * 7, y - 66, 5, 7);
          poly(g, [x + tx - 4, y - 66, x + tx + tw / 2, y - 98, x + tx + tw + 4, y - 66], '#c82838'); poly(g, [x + tx + tw / 2, y - 98, x + tx + tw + 4, y - 66, x + tx + tw / 2 + 3, y - 66], '#901828');
          rect(g, x + tx + tw / 2 - 1, y - 112, 2, 14, '#584050'); rect(g, x + tx + tw / 2 + 1, y - 112, 9, 6, '#f8c818');
          rect(g, x + tx + 8, y - 40, 8, 12, '#301828'); rect(g, x + tx + 8, y - 40, 8, 3, '#584050');
        }
        g.fillStyle = grad(g, x - 34, 0, x + 34, 0, ['#b8b0c0', '#9890a0', '#706880']); g.fillRect(x - 34, y - 40, 68, 72);
        for (let i = 0; i < 6; i++) g.fillRect(x - 34 + i * 12, y - 48, 8, 9);
        g.fillStyle = 'rgba(40,30,50,.35)'; for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) g.fillRect(x - 34 + c * 12 + (r % 2) * 6, y - 38 + r * 8, 11, 1);
        g.fillStyle = '#301828'; g.beginPath(); g.arc(x, y + 6, 12, Math.PI, 0); g.fillRect(x - 12, y + 6, 24, 26); g.fill();
        rect(g, x - 1, y - 6, 2, 38, '#584050');
      }
      const endDust = [];
      function fxDust(x, y) { if (endDust.length < 60) endDust.push({ x, y, vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 1.6, t: 0 }); }
      function drawEndDust() { for (let i = endDust.length - 1; i >= 0; i--) { const d = endDust[i]; d.t++; d.x += d.vx; d.y += d.vy; d.vy += 0.02; if (d.t > 50) { endDust.splice(i, 1); continue; } g.drawImage(A.puff[Math.min(2, d.t / 17 | 0)], d.x | 0, d.y | 0); } }

      function drawSheet(n) { // (testing: every sprite on one screen)
        g.fillStyle = n === 2 ? '#68b8f8' : '#9890a0'; g.fillRect(0, 0, W, H);
        let x = 2, y = 2, rowH = 0;
        const put = c => { if (Array.isArray(c)) c = c[0]; if (x + c.width > W) { x = 2; y += rowH + 2; rowH = 0; } g.drawImage(c, x, y); x += c.width + 2; rowH = Math.max(rowH, c.height); };
        if (n === 1 || n === 2) { for (const s of [A.pl, A.plF]) { for (const k in s.S) put(s.S[k]); for (const k in s.B) put(s.B[k]); } for (const k in A.cape) put(Array.isArray(A.cape[k][0]) ? A.cape[k][0] : A.cape[k]); return; }
        for (const c of [A.conk[0], A.conk[1], A.conkFlat, A.crab[0], A.crab[1], ...A.cup, A.bee[0], A.bee[1], A.prick[0], A.prick[1], ...A.bat, ...A.sheet, ...A.crush, ...A.toffee, ...A.tin, A.tinPile, ...A.fish, ...A.dino, ...A.egg, A.cake, ...A.daisy, A.bag, A.oneup, ...A.gbisc, ...A.coin, A.key, ...A.ball, ...A.crumb, A.star, ...A.puff, CM.brick, ...CM.q, CM.used, CM.msg, ...CM.jelly, CM.pipeTL, CM.pipeTR, CM.spike, CM.door[0], CM.door[1], CM.keyhole]) put(c);
        for (const c of A.boss) put(c);
      }
      // ================================================================ the debug handle (for testing)
      K.dbg = {
        st: () => ({ mode, LN, x: P.x | 0, y: P.y | 0, vx: +P.vx.toFixed(2), vy: +P.vy.toFixed(2), on: P.on, power, lives, score, coins, time, gb: gbMask, cl: FL && FL.cl, node: FL && FL.node, clear: clear && clear.kind, boss: bossE && bossE.hp, ride: !!P.ride, carry: P.carry && P.carry.k, ents: E.filter(e => !e.rm).length, paused, msg: !!msgBox, pm: P.pm, dead: P.dead }),
        warp(n, x, y) { if (!FL) { if (!SV.files[0]) SV.files[0] = { name: 'JACK', cl: {}, gb: {}, node: 0 }; startFile(0); } gbMask = 0; midLv = 0; loadLevel(n, false); mode = 'play'; lvT = 40; if (x != null) { P.x = x * T; P.y = (y != null ? y : 2) * T; camSnap(); } },
        give(p) { power = p; setSize(); }, win() { startClear('goal', 1000); }, kill() { die(); }, setLives(n) { lives = n; }, setTime(t) { time = t; },
        file(i) { startFile(i); toMap(); },
        levelShot(n) { this.warp(n); const c = mk(LW * T, LH * T), gg = c.getContext('2d'); const og = g; const sc = { x: cam.x, y: cam.y }; gg.fillStyle = '#6898c8'; gg.fillRect(0, 0, c.width, c.height);
          for (let x = 0; x < LW * T; x += W) { cam.x = x; cam.y = 0; cx = x; cy = 0; } 
          gg.save(); const draw = () => { drawDeco(); drawEnts(true); drawTiles(); drawPlats(); drawEnts(false); };
          for (let x = 0; x < LW * T; x += W) for (let y = 0; y < LH * T; y += 224) { const t = mk(W, H); const tg = t.getContext('2d'); g = tg; cx = x; cy = y; tg.drawImage(BG.sky, 0, 0); draw(); gg.drawImage(t, x, y); }
          g = og; cam.x = sc.x; cam.y = sc.y; gg.restore(); return c.toDataURL('image/png'); }, tile: (x, y) => tileAt(x, y), setTile: (x, y, t) => setTile(x, y, t), god: false, L: () => L, cam, unlock(k) { FL.cl[k] = 1; store(); }, P, E: () => E, SV: () => SV, boss: () => bossE, hurtBoss() { if (bossE) bossHit(bossE); }, setScore(s) { score = s; },
      };

      // ================================================================ the loop
      toTitle();
      return {
        update(dt) {
          mT += dt;
          if (mode === 'title') return stepTitle();
          if (mode === 'files') return stepFiles();
          if (mode === 'name') return stepName();
          if (mode === 'story') return stepStory();
          if (mode === 'map') return stepMap();
          if (mode === 'enter') { if (mT > 1.6 && pendingLoad) { const pl = pendingLoad; pendingLoad = null; loadLevel(pl.n, pl.mid); mode = 'play'; } return; }
          if (mode === 'over') { if (mT > 3.2 && (mT > 6 || K.pressed('start') || K.pressed('b') || K.pressed('a'))) { mode = 'overDone'; endRun('over'); } return; }
          if (mode === 'initials') return stepInitials();
          if (mode === 'hiShow') { if (mT > 4 || (mT > 1 && (K.pressed('start') || K.pressed('b') || K.pressed('a')))) { mode = 'done'; sendFinal(); } return; }
          if ((mode === 'done' || mode === 'overDone') && !finalSent && finalWait) { sendFinal(); if (mode === 'done' && endKind === 'won') ending.t += dt; return; }
          if (mode === 'ending') { ending.t += dt; if (mT > 27 || (mT > 3 && K.pressed('start'))) { mode = 'done'; dinoCarry = false; endRun('won'); } return; }
          if (mode !== 'play') return;
          // ---- playing
          if (msgBox) { msgBox.t++; if (msgBox.t > 20 && (K.pressed('b') || K.pressed('a') || K.pressed('y') || K.pressed('x') || K.pressed('start'))) { msgBox = null; S.menu(); } return; }
          if (paused) return stepPause();
          if (K.pressed('start') && !clear && !P.dead && !P.door && lvT > 40) { paused = true; pauseSel = 0; K.music(null); S.menu(); return; }
          if (K.pressed('select') && reserve && !clear && !P.dead) { const k = reserve; reserve = ''; ent(k, cam.x + W / 2 - 7, cam.y + 20, { st: 'drop', t: 0 }); S.menu(); }
          lvT++;
          if (flash > 0) flash--; if (shake > 0) shake = Math.max(0, shake - 0.6);
          for (const b of bumps) b.t++; if (bumps.length && bumps[0].t > 12) bumps = bumps.filter(b => b.t <= 12);
          if (clear) { stepClear(); stepPlats(); camera(); return; }
          if (!P.dead && !P.grow && !P.door) {
            if (++tick >= 40) { tick = 0; time--; if (time === 100) { hurry = true; sfx.seq([[84, 0.5], [84, 0.5], [84, 0.5], [91, 1]], { bpm: 480, vol: 0.07 }); K.music(song(bossOn && bossE ? 'boss' : L.song, true)); } if (time <= 0) { time = 0; die(); } }
          }
          stepPlats();
          stepPlayer();
          if (!P.dead && !P.grow) {
            // coins
            const x0 = (P.x + 1) >> 4, x1 = (P.x + P.w - 1) >> 4, y0 = Math.max(0, (P.y + 1) >> 4), y1 = (P.y + P.h - 1) >> 4;
            for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === 7) { setTile(tx, ty, 0); coins++; addScore(20); S.coin(); sparkle(tx * T + 8, ty * T + 8); if (coins >= 100) { coins -= 100; oneUp(tx * T, ty * T); } }
            // doors: press up
            if (K.pressed('up') && P.on && !P.door) for (const d of L.doors) if (P.x + P.w > d.x + 2 && P.x < d.x + 14 && P.y + P.h > d.y + 16 && P.y < d.y + 32) { P.door = 1; P.doorTo = d; S.door(); P.vx = 0; break; }
          }
          if (!P.grow && !P.door && !P.dead) stepEnts();
          if (!P.dead) camera();
        },
        draw() {
          drawMain();
          if (finalWait && !finalSent && K.frame % 40 < 30) { panel(40, 196, 176, 20, '#2a3a8a'); ctr('SAVING... DO NOT SWITCH OFF!', 202, '#f8d020'); }
        },
        end() { K.music(null); },
      };
      function drawMain() {
          g.imageSmoothingEnabled = false;
          if (K.dbg.sheet) return drawSheet(K.dbg.sheet);
          if (mode === 'title') return drawTitle();
          if (mode === 'files') return drawFiles();
          if (mode === 'name') return drawName();
          if (mode === 'story') return drawStory();
          if (mode === 'map') return drawMap();
          if (mode === 'enter') return drawEnter();
          if (mode === 'over' || mode === 'overDone') return drawOver();
          if (mode === 'initials') return drawInitials();
          if (mode === 'hiShow' || mode === 'done') { if (endKind === 'won' && mode === 'done') return drawEnding(); drawTitleBg(K.t); g.fillStyle = 'rgba(0,0,30,.4)'; g.fillRect(0, 0, W, H); return drawHiTable(30, hiPos); }
          if (mode === 'ending') return drawEnding();
          if (L) drawLevel();
      }
    },
  });
})();
