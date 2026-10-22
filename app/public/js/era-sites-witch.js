/* era-sites-witch: two famous kinds of 1999 web weirdness.
 *  www.squigwitch.cyb  THE SQUIG WITCH PROJECT: a "found footage" mystery site (kid-friendly: nobody is harmed, and
 *                      the hidden truth page shows what really happened). Grainy pixel "film stills" on canvas.
 *  www.jackbo.netz     WELCOME TO JACKBO: one spinning logo, a booming welcome, and a loading bar that never finishes. */
(function () {
  'use strict';
  const ES = window.EraSites, A = window.Apps, esc = ES.esc;
  const W = 'www.squigwitch.cyb', U = p => 'http://' + W + p;
  // the witch's spooky grey cat (she keeps 104 of them), pixel art added to the shared kit sprites
  ES.SPR.wcat = ES.SPR.wcat || ['S.........S..', 'SS.......Sz..', 'SzSSSSSSSzz..', 'Szyyzzzyyzz..', 'Szykzzzkyzz..', 'Szzzzpzzzzz..', '.SzzSzSzzz...', '..Szzzzzz....', '.SzzzzzzzS..S', 'SzzzzzzzzzS.S', 'Szzzzzzzzzz.S', 'SzzzzzzzzzzS.', '.Sz.Szz.Sz...'];
  ES.css('witch', `
.sw{background:#000;color:#ddd;font:14px/1.6 "Courier New",Courier,monospace;padding:0 0 10px}
.sw a{color:#c8c8c8}
.sw-top{text-align:center;padding:26px 12px 10px;position:relative}
.sw-title{font:bold 34px/1.05 "Times New Roman",serif;letter-spacing:6px;color:#eee;text-transform:uppercase;animation:swflick 6s infinite}
.sw-title small{display:block;font:13px "Courier New",monospace;letter-spacing:3px;color:#888;margin-top:8px}
@keyframes swflick{0%,19%,21%,62%,64%,100%{opacity:1}20%,63%{opacity:.3}}
.sw-nav{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 18px;padding:8px;border-top:1px solid #333;border-bottom:1px solid #333;font-size:13px;text-transform:uppercase;letter-spacing:2px}
.sw-nav a{text-decoration:none;color:#aaa}.sw-nav a:hover{color:#fff}
.sw-body{max-width:640px;margin:0 auto;padding:16px 14px}
.sw-body h2{font:bold 20px "Times New Roman",serif;letter-spacing:4px;text-transform:uppercase;color:#fff;border-bottom:1px solid #444;padding-bottom:4px}
.sw-body p{margin:10px 0}
.sw-red{color:#c00}
.sw-stills{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.sw-still{background:#111;border:1px solid #333;padding:6px;text-align:center;font-size:12px;color:#999}
.sw-still canvas{width:100%;height:auto;image-rendering:pixelated;display:block;background:#000;cursor:crosshair}
.sw-diary{background:#e8dcc0;color:#2a2010;font:15px/1.5 "Comic Sans MS","Comic Sans",cursive;padding:14px 18px;border-radius:2px;box-shadow:inset 0 0 40px rgba(90,60,20,.5);transform:rotate(-.6deg)}
.sw-diary h3{margin:12px 0 2px;font:bold 15px "Comic Sans MS",cursive;color:#5a1a00}
.sw-diary .scr{text-decoration:line-through;opacity:.6}
.sw-diary .wob{display:inline-block;transform:rotate(-3deg);font-size:18px}
.sw-map{width:100%;max-width:600px;display:block;margin:0 auto;background:#d8c8a0;border:6px solid #3a2a10}
.sw-map .pin{cursor:pointer}
.sw-mapnote{min-height:3em;border:1px dashed #555;padding:6px 8px;margin-top:8px;color:#ccc}
.sw-case{background:#f0f0e0;color:#111;font:13px "Courier New",monospace;padding:14px;border:1px solid #888}
.sw-case h3{margin:0 0 6px;text-align:center}
.sw-stamp{display:inline-block;border:3px solid #c00;color:#c00;font:bold 18px Arial;padding:2px 10px;transform:rotate(-8deg);margin:6px}
.sw-ppl{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
.sw-p{width:180px;background:#111;border:1px solid #333;padding:8px;text-align:center;font-size:12px}
.sw-p .face{background:#2a2a2a;display:block;margin:0 auto 6px;filter:grayscale(1) contrast(1.3)}
.sw-grain{position:absolute;inset:0;pointer-events:none;opacity:.08;background:repeating-radial-gradient(circle at 30% 40%,#fff 0 1px,transparent 1px 3px);animation:swgrain .4s steps(3) infinite}
@keyframes swgrain{33%{background-position:7px 3px}66%{background-position:-5px 6px}}
.sw-truth{background:#fff6d8;color:#000;font:14px/1.5 Arial,sans-serif;padding:16px;border:4px double #c8a040}
.sw-truth h2{color:#5a3a00;border-color:#c8a040}
@media (max-width:600px){.sw-title{font-size:24px;letter-spacing:3px}}
`);

  const nav = `<div class="sw-nav"><a href="${U('/')}">Home</a><a href="${U('/legend.html')}">The Legend</a><a href="${U('/missing.html')}">The Missing</a><a href="${U('/footage.html')}">The Footage</a><a href="${U('/diary.html')}">The Diary</a><a href="${U('/map.html')}">The Map</a><a href="${U('/dossier.html')}">Case File</a></div>`;
  const page = (c, body) => `<div class="sw"><div class="sw-top"><div class="sw-grain"></div><div class="sw-title">The Jack Witch Project<small>Jackwood, October 1998</small></div></div>${nav}<div class="sw-body">${body}</div>${c.foot({ ctrText: 'You are visitor', ctrAfter: 'to this site. <span class="sw-red">Do not go into the woods.</span>', best: 'Best viewed with the lights OFF', copy: 'This site is a work of fiction. No students, cats or witches were harmed. &copy; 1999 Jackaby Pictures' }).replace('<div class="es-foot">', '<div class="es-foot" style="color:#888">')}</div>`;

  ES.def(W, '/', c => page(c, `<p style="text-align:center;font-size:16px">In October 1998, three film students went into the <b>Hollow Hill Woods</b> near Jackwood, to make a documentary about a local legend: <b>the Jack Witch</b>.</p>
    <p style="text-align:center;font-size:16px" class="sw-red">They were never seen again.</p>
    <p style="text-align:center;font-size:16px">A year later, their footage was found.</p>
    <p style="text-align:center;margin-top:26px">${ES.spr('wcat', 5)}</p>
    <p style="text-align:center">This site contains the footage, the diary, the map and the legend.<br>Make up your own mind.</p>
    <p style="text-align:center;font-size:12px;color:#777">[ <a href="${U('/legend.html')}">enter</a> ]</p>`));

  ES.def(W, '/legend.html', c => page(c, `<h2>The Legend</h2>
    <p><b>1785.</b> The village of Old Catbury is founded at the edge of the Hollow Hill Woods. Villagers complain that their <i>left socks</i> keep going missing. Only the left ones.</p>
    <p><b>1786.</b> An old woman called <b>Elly Jackaby</b> is told off by the village for keeping "far too many cats" (one hundred and four). She walks into the woods with all of them and is never seen again. The left socks keep going missing.</p>
    <p><b>1809.</b> The village changes its name to Jackwood. Nobody remembers why. The cats remember.</p>
    <p><b>1825.</b> Eleven witnesses watch a pale hand reach out of the river and take a whole picnic basket. The sandwiches are never recovered. "They were egg," says one witness, sadly.</p>
    <p><b>1886.</b> A girl goes missing in the woods. She comes back three days later and says an old woman made her <i>wipe her feet</i>, gave her soup, and "would not stop talking about cats".</p>
    <p><b>1941.</b> A local man disappears in the woods for a week. When he comes back, he says only one thing: <i>"She made me do the washing up."</i></p>
    <p><b>1994.</b> Hikers report little bundles of sticks hanging in the trees, shaped like tiny people. Experts say they are probably "just bundles of sticks". The experts are not invited back.</p>
    <p><b>October 1998.</b> Three film students go into the woods to find out the truth. <a href="${U('/missing.html')}">They are still missing.</a></p>`));

  const PEOPLE = [['Hezza Grimsdottir', 'Director', 'Organised. Bossy. Carried the only map (see diary). "We are NOT lost. I know EXACTLY where we are."', ['..hhhhhhhh..', '.hhhhhhhhhh.', '.hhnnnnnnhh.', 'hhnknnnnknhh', 'hhnnnnnnnnhh', '.hnnnNNnnnh.', '.hnnkkkknnh.', '..nnnnnnnn..', '...rrrrrr...', '.rrrrrrrrrr.']],
    ['Jez Grimley', 'Camera', 'Filmed everything. EVERYTHING. Including six hours of his own feet.', ['............', '..mmmmmmmm..', '.mmmmmmmmmm.', '.mnnnnnnnnm.', 'nnkknnnnkknn', 'nnnnnnnnnnnn', '.nnnnNNnnnn.', '.nnnkkkknnn.', '..nnnnnnnn..', '.uuuuuuuuuu.']],
    ['Mikey Squibb', 'Sound', 'In charge of the sound recorder and the biscuits. Only one of these was a good idea.', ['...bbbbbb...', '..bbbbbbbb..', '.bbnnnnnnbb.', '.bnknnnnknb.', '.nnnnnnnnnn.', '.nnnnNNnnnn.', '.nnnwkkwnnn.', '..nnnnnnnn..', '...gggggg...', '.gggggggggg.']]];
  ES.def(W, '/missing.html', c => page(c, `<h2>The Missing</h2><p>Missing since <b>21 October 1998</b>. Last seen buying biscuits at the Jackwood corner shop.</p>
    <div class="sw-ppl">${PEOPLE.map(([n, r, d, f]) => `<div class="sw-p">${ES.pix(f, 9, null, 'face')}<b style="color:#fff">${esc(n)}</b><br><span class="sw-red">${esc(r)}</span><p>${esc(d)}</p></div>`).join('')}</div>
    <p style="text-align:center">If you have any information, please contact the <a href="${U('/dossier.html')}">Jackwood Sheriff's Department</a>. Or just shout into the woods. Someone might shout back.</p>`));

  // ---------------------------------------------------------------- the footage: tiny grainy film stills drawn on canvas
  const STILLS = [
    ['Roll 1, Day 1: Interviews in town', 'town'], ['Roll 3, Day 2: Into the woods', 'woods'], ['Roll 5, Day 2: The pile of stones', 'stones'],
    ['Roll 6, Night 3: Something outside the tent', 'tent'], ['Roll 8, Day 4: The stick men', 'sticks'], ['Roll 11, Day 6: The house', 'house'],
  ];
  function paint(cv, kind, R) {
    const x = cv.getContext('2d'), w = 64, h = 48, f = (c, a, b, cw, ch) => { x.fillStyle = c; x.fillRect(a, b, cw, ch); };
    f('#1a1a1a', 0, 0, w, h);
    const trees = (n, col) => { for (let i = 0; i < n; i++) { const tx = Math.floor(R() * w), tw = 1 + Math.floor(R() * 3); f(col, tx, 0, tw, h); } };
    if (kind === 'town') { f('#5a5a5a', 0, 0, w, 26); f('#3a3a3a', 0, 26, w, 22); f('#7a7a7a', 6, 8, 16, 18); f('#2a2a2a', 10, 14, 4, 12); f('#9a9a9a', 40, 4, 20, 22); f('#202020', 44, 10, 4, 4); f('#202020', 52, 10, 4, 4); f('#bbb', 28, 22, 6, 6); f('#888', 28, 28, 6, 12); f('#bbb', 26, 26, 2, 6); }
    if (kind === 'woods') { f('#2a2a2a', 0, 30, w, 18); trees(14, '#0e0e0e'); trees(6, '#262626'); f('#444', 30, 34, 6, 3); }
    if (kind === 'stones') { f('#2a2a2a', 0, 24, w, 24); trees(8, '#101010'); for (let i = 0; i < 7; i++) { f('#777', 20 + i * 3, 38 - i * 2, 10 - i, 3); } for (let i = 0; i < 5; i++) f('#666', 44 + i * 2, 40 - i * 2, 8 - i, 3); }
    if (kind === 'tent') { f('#050505', 0, 0, w, h); for (let i = 0; i < 24; i++) f('#3a3a2a', 32 - i, 14 + i, i * 2, 1); f('#000', 30, 30, 4, 8); f('#c8c8a0', 14, 22, 1, 1); f('#c8c8a0', 17, 22, 1, 1); f('#c8c8a0', 48, 26, 1, 1); f('#c8c8a0', 51, 26, 1, 1); }
    if (kind === 'sticks') { f('#262626', 0, 0, w, h); trees(10, '#121212'); [[14, 8], [30, 4], [46, 10]].forEach(([a, b]) => { f('#8a7a5a', a + 2, b, 1, 10); f('#8a7a5a', a, b + 3, 5, 1); f('#8a7a5a', a + 1, b + 10, 1, 4); f('#8a7a5a', a + 3, b + 10, 1, 4); f('#8a7a5a', a, b - 1, 1, 2); f('#8a7a5a', a + 4, b - 1, 1, 2); f('#555', a + 2, 0, 1, b); }); }
    if (kind === 'house') { f('#202020', 0, 0, w, h); trees(6, '#0a0a0a'); f('#4a4a40', 12, 14, 40, 30); f('#2a2a24', 8, 10, 48, 6); f('#000', 28, 28, 8, 16); f('#7a7a60', 18, 20, 6, 6); f('#7a7a60', 40, 20, 6, 6); f('#bbb', 20, 22, 2, 2);
      // something small and friendly on the window sill: a teacup (click it!)
      f('#e8e0c0', 41, 24, 3, 2); f('#e8e0c0', 44, 24, 1, 1); }
    // grain + vignette
    for (let i = 0; i < 260; i++) { const g = Math.floor(R() * 90); f(`rgba(${g + 120},${g + 120},${g + 110},${0.08 + R() * 0.12})`, Math.floor(R() * w), Math.floor(R() * h), 1, 1); }
    f('rgba(0,0,0,.35)', 0, 0, w, 2); f('rgba(0,0,0,.35)', 0, h - 2, w, 2);
  }
  ES.def(W, '/footage.html', c => {
    c.after.push(() => {
      const draw = () => c.qa('.sw-still canvas').forEach((cv, i) => paint(cv, STILLS[i][1], ES.rng(i * 7 + Math.floor(Date.now() / 140) % 5)));
      draw(); c.every(draw, 140);
      c.qa('.sw-still canvas').forEach((cv, i) => cv.addEventListener('click', ev => {
        const r = cv.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * 64, py = (ev.clientY - r.top) / r.height * 48;
        if (STILLS[i][1] === 'house' && px >= 38 && px <= 47 && py >= 21 && py <= 28) { c.sfx('solve'); ES.go(U('/truth.html')); return; }
        c.sfx('click'); const cap = cv.parentNode.querySelector('.cap'); cap.textContent = ['(the picture is too grainy to make anything out)', '(you think you see something move. It was the grain.)', '(Jez\'s thumb is over the lens)', '(zoom... enhance... nope)'][Math.floor(Math.random() * 4)];
      }));
    });
    return page(c, `<h2>The Footage</h2><p>The film and the sound tapes were found in October 1999, under the foundations of a <b>very tidy</b> house in the woods. These are stills from the rolls. Click a still to look closer.</p><div class="sw-stills">${STILLS.map(([t]) => `<div class="sw-still"><canvas width="64" height="48" aria-label="${esc(t)}"></canvas>${esc(t)}<br><i class="cap"></i></div>`).join('')}</div><p style="font-size:12px;color:#777">The last roll ends with Mikey standing in the corner of a room, facing the wall. Experts believe he had been put in "time out". Why? Read <a href="${U('/diary.html')}">the diary</a>.</p>`);
  });

  ES.def(W, '/diary.html', c => page(c, `<h2>The Diary</h2><p>Found in Hezza's rucksack. Some pages are missing. Some pages are jam.</p><div class="sw-diary">
    <h3>Oct 20, 1998</h3>Day 1! Interviewed loads of people in Jackwood. Everyone has heard of the Jack Witch. Nobody will say much. One old man said "wipe your feet" and walked off. Bought supplies: 3 torches, 1 map, 14 packets of biscuits (Mikey's job).
    <h3>Oct 21</h3>Into the woods! Beautiful. Found a pile of stones in a weird shape. Jez says it's a cat's grave. Mikey says it's a pile of stones. Jez filmed his feet for an hour by mistake.
    <h3>Oct 22</h3>Walked all day. We passed the same log <b>FOUR TIMES</b>. It's a nice log. I'm starting to hate the log. <span class="scr">I know exactly where we are.</span>
    <h3>Oct 22, night</h3>Noises outside the tent. Giggling. And... sweeping? Somebody was sweeping the forest. In the morning, the area round our tent was very tidy and there were little piles of biscuit crumbs.
    <h3>Oct 23</h3><b>THE MAP IS GONE.</b> Mikey wrapped his sandwich in it. Then he ate the sandwich. WITH THE MAP. He says it "tasted like north". We are now officially lost.
    <h3>Oct 24</h3>Found little stick men hanging in the trees. Hundreds of them. Jez says it's spooky. I think they're actually quite well made. Somebody has a lot of time and a lot of sticks.
    <h3>Oct 25</h3>Recorded my apology to camera. <span class="wob">I'm so sorry.</span> I'm sorry to Mikey's Mom and Jez's Mom and my Mom. I'm sorry I said I knew where we were. I'm sorry I ate the last three packets of biscuits in the night and blamed the witch. It was me. It was ALWAYS me.
    <h3>Oct 26</h3>We found a house in the middle of the woods. There's a light on. And a smell of soup. Mikey has gone inside. Jez is filming. I'm going in after th
    <p style="text-align:right">(the diary ends here)</p></div>`));

  const PINS = [[70, 230, 'Base camp', 'Where the tent was. Something swept it.'], [180, 150, 'The log', 'Passed four times. Still a nice log.'], [250, 260, 'The creek', 'Where the map would have been lost if Mikey had not eaten it first.'], [330, 120, 'Pile of stones', 'Possibly a cat\'s grave. Possibly some stones.'], [420, 200, 'Stick men', 'Hundreds of stick men in the trees. Quite well made, honestly.'], [520, 90, 'THE HOUSE', 'The house in the middle of the woods. Smells of soup. Wipe your feet.']];
  ES.def(W, '/map.html', c => {
    c.after.push(() => c.qa('.pin').forEach(p => p.addEventListener('click', () => { const d = PINS[+p.dataset.i]; c.q('.sw-mapnote').innerHTML = `<b>${esc(d[2])}:</b> ${esc(d[3])}`; c.sfx('click'); })));
    const trees = Array.from({ length: 70 }, (_, i) => { const R = ES.rng('t' + i), x = Math.floor(R() * 600), y = 20 + Math.floor(R() * 300); return `<path d="M${x} ${y}l-6 12h12z" fill="#3a5a2a" opacity=".7"/>`; }).join('');
    return page(c, `<h2>The Map</h2><p>A copy of the map, drawn from memory (the real one was eaten). Click the markers.</p>
      <svg class="sw-map" viewBox="0 0 600 340" role="img" aria-label="Hand drawn map of the Hollow Hill Woods"><rect width="600" height="340" fill="#d8c8a0"/>${trees}<path d="M0 270c80-20 140 10 250-10s200 40 350 0" stroke="#4a7ab0" stroke-width="10" fill="none"/>
      <path d="M70 230C120 180 160 160 180 150s30 40 0 50-60-60 10-80 70 60 70 140c20-80 60-140 80-150s40 80 90 80 60-110 100-110" stroke="#c00" stroke-width="3" fill="none" stroke-dasharray="8 6"/>
      ${PINS.map(([x, y, n], i) => `<g class="pin" data-i="${i}" tabindex="0" role="button" aria-label="${esc(n)}"><circle cx="${x}" cy="${y}" r="13" fill="#fff" stroke="#000" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="14">${i === 5 ? '?' : i + 1}</text><text x="${x}" y="${y + 30}" text-anchor="middle" font-family="Comic Sans MS,cursive" font-size="13">${esc(n)}</text></g>`).join('')}
      <text x="560" y="320" font-family="Comic Sans MS,cursive" font-size="18">N?</text><text x="20" y="30" font-family="Comic Sans MS,cursive" font-size="16" fill="#5a1a00">HOLLOW HILL WOODS (here be cats)</text></svg><div class="sw-mapnote">Click a marker...</div>`);
  });

  ES.def(W, '/dossier.html', c => page(c, `<h2>Case File</h2><div class="sw-case"><h3>JACKWOOD SHERIFF'S DEPARTMENT</h3>
    CASE No.: 98-1021<br>TYPE: Missing persons (3)<br>STATUS: <span class="sw-stamp">OPEN</span><br><br>
    SEARCH: 11 days. 1,000 volunteers. 2 helicopters. 1 sniffer dog (Biscuit). Biscuit found 412 cats and no students.<br><br>
    ITEMS RECOVERED (Oct 1999):<br>- 2 film cameras (one still filming Jez's feet)<br>- 1 sound recorder<br>- 11 rolls of film<br>- 1 diary (see attached) (sticky)<br>- 14 empty biscuit packets<br>- 0 maps<br><br>
    NOTES: The house where the footage was found was very clean. Officers were made to wipe their feet. A small sign on the door said <i>"BACK IN 5 MINS - E.S."</i><br><br>
    OFFICER'S OPINION: "Spooky. Also, the soup was very good."</div><p>Have you seen them? <a href="${U('/missing.html')}">The Missing</a></p>` + c.gb([['Night Owl', '19/09/99', 'I went to the Hollow Hill Woods last week. Someone tidied my rucksack while I was asleep.'], ['Biscuit (the dog)', '01/09/99', 'WOOF. (I found a cat.)']], { title: 'Leave a Tip for the Sheriff', btn: 'Send Tip', ph: 'What did you see in the woods?' })));

  ES.def(W, '/truth.html', c => {
    c.later(() => c.secret('eras.witch'), 500);
    const pic = ES.pix(['..................................', '...........kkkkkkkkkkkk...........', '..........kvvvvvvvvvvvvk..........', '.........kvvvvvvvvvvvvvvk.........', '........kkkkkkkkkkkkkkkkkk........', '...........nnnnnnnnnnnn...........', '...........nknnnnnnnknn...........', '...........nnnnnnnnnnnn...........', '...........nnnwkkkkwnnn...........', '............vvvvvvvvvv............', '..hh....bb.vvvvvvvvvvvv.mm...k...k', '.hnnh..bnnbvvvvvvvvvvvv.mnnm.kkkkk', '.hnnh..bnnb.vvvvvvvvvv..mnnm.kykyk', '..rr....gg..vvvvvvvvvv...uu..kkkkk', '.rrrr..gggg.vvvvvvvvvv..uuuuk.kkk.', '.r..r..g..g..kk....kk...u..u.kkkkk'], 6);
    return `<div class="sw"><div class="sw-body"><div class="sw-truth"><h2>WHAT REALLY HAPPENED</h2>
      <p style="text-align:center">${pic}</p><p style="text-align:center"><i>A photo, found tucked behind the teacup on the window sill. Hezza, Mikey and Jez, waving, next to a little old lady in a pointy hat. And a cat.</i></p>
      <p>Dear whoever finds this,</p><p>We are FINE! We got lost (Mikey ate the map), and we followed the smell of soup to Mrs Jackaby's house. She is about 200 years old, very nice, and has 104 cats. She was a bit cross about the biscuit crumbs.</p>
      <p>She asked us to stay and help with the cats "for a few days", and it has been nearly a year. We have been very busy. Jez films the cats. Mikey makes the soup. I have drawn a <b>new map</b> and I DEFINITELY know where we are.</p>
      <p>The stick men are hers. She makes them for fun. The socks were the cats.</p>
      <p>We'll be home for Christmas. Tell our Moms we're sorry. Especially about the biscuits.</p><p>Love, Hezza, Jez &amp; Mikey<br>P.S. Wipe your feet.</p>
      <p style="text-align:center"><a href="${U('/')}" style="color:#5a3a00">Back to the site</a> (shhh, don't tell anyone, it ruins the mystery)</p></div></div></div>`;
  });

  // ================================================================ WELCOME TO JACKBO
  const G = 'www.jackbo.netz';
  ES.css('grotbo', `
.gbo{background:#000;color:#fff;text-align:center;font:bold 22px/1.4 Arial,Helvetica,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px 12px}
.gbo-logo{width:220px;height:220px;max-width:70vw;max-height:70vw;animation:gbospin 4s linear infinite}
@keyframes gbospin{to{transform:rotate(360deg)}}
.gbo-say{min-height:3em;font-size:26px;letter-spacing:1px;max-width:600px;text-shadow:0 0 8px rgba(255,255,255,.4)}
.gbo-say.boom{animation:gboboom .7s}
@keyframes gboboom{from{transform:scale(1.3);opacity:0}}
.gbo-bar{width:300px;max-width:80vw;height:14px;border:2px solid #fff;padding:2px}
.gbo-bar i{display:block;height:100%;width:0;background:#fff}
.gbo-pc{font:12px Arial,sans-serif;color:#888}
.gbo-snd{font:12px Arial,sans-serif}
.gbo a{color:#888}
`);
  const LINES = ['Welcome... to Jackbo.', 'This is Jackbo. Welcome.', 'Welcome to Jackbo.', 'You can do ANYTHING at Jackbo.', 'Anything at all.', 'The only limit... is yourself.', '(And your modem.)', 'Welcome to Jackbo.', 'Yes. This is Jackbo.', 'And welcome to YOU, who have come to Jackbo.', 'Anything is possible at Jackbo.', 'The impossible is possible at Jackbo.', 'The possible is ALSO possible at Jackbo.', 'Welcome to Jackbo.', 'Jackbo is still loading anything.', 'Please wait. Anything takes a while.', 'This... is Jackbo.', 'Welcome.'];
  ES.def(G, '/', c => {
    c.after.push(() => {
      const say = c.q('.gbo-say'), bar = c.q('.gbo-bar i'), pc = c.q('.gbo-pc'), t0 = Date.now(); let i = 0, done = false;
      const voice = c.q('.gbo-voice');
      const speak = s => { try { if (voice.checked && window.speechSynthesis && window.SpeechSynthesisUtterance) { const u = new SpeechSynthesisUtterance(s.replace(/\(|\)/g, '')); u.pitch = 0.3; u.rate = 0.75; speechSynthesis.cancel(); Sound.speak(u); } } catch (e) {} };
      const next = () => { const s = LINES[i % LINES.length]; i++; say.textContent = s; say.classList.remove('boom'); void say.offsetWidth; say.classList.add('boom'); if (window.Sound && Sound.on) { Sound.note(55 + (i % 3) * 8, 0.6, 'sine'); Sound.note(110, 0.4, 'triangle'); } speak(s); };
      next(); c.every(next, 3400);
      c.every(() => { const s = (Date.now() - t0) / 1000, p = 99 * (1 - Math.exp(-s / 25)); bar.style.width = p + '%'; pc.textContent = (p >= 98.9 ? '99%' : Math.floor(p) + '%') + ' loaded. Please wait.'; if (s > 90 && !done) { done = true; c.secret('eras.grotbo'); pc.textContent = '99% loaded. Please wait. (Still. Anything takes time.)'; } }, 250);
      c.off(() => { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} });
      c.q('.gbo-logo').addEventListener('click', () => { c.sfx('boing'); next(); });
    });
    const ring = Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180, x = 100 + Math.cos(a) * 72, y = 100 + Math.sin(a) * 72; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="${['#e10600', '#ffd400', '#00c8ff', '#3a9a2a'][i % 4]}"/>`; }).join('');
    return `<div class="es gbo"><svg class="gbo-logo" viewBox="0 0 200 200" role="img" aria-label="Jackbo logo"><circle cx="100" cy="100" r="96" fill="none" stroke="#fff" stroke-width="3"/><circle cx="100" cy="100" r="85" fill="none" stroke="#7a3ac8" stroke-width="14"/>${ring}<circle cx="100" cy="100" r="50" fill="#111" stroke="#fff" stroke-width="2"/><defs><radialGradient id="gboSm" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff8b0"/><stop offset=".5" stop-color="#ffd400"/><stop offset="1" stop-color="#c88a00"/></radialGradient></defs><circle cx="100" cy="100" r="36" fill="url(#gboSm)" stroke="#000" stroke-width="3"/><ellipse cx="88" cy="90" rx="5" ry="8"/><ellipse cx="112" cy="90" rx="5" ry="8"/><path d="M80 106q20 22 40 0" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/><path d="M128 72l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#fff"/></svg>
      <div class="gbo-say" aria-live="polite"></div><div class="gbo-bar"><i></i></div><div class="gbo-pc">0% loaded</div>
      <label class="gbo-snd"><input type="checkbox" class="gbo-voice"> Booming voice (needs speakers)</label>
      <div style="font:11px Arial;color:#555">Jackbo requires JackFlash 4 and a lot of patience. &copy; 1999 Jackbo. All anything reserved.</div>${c.foot({ ctrText: 'Welcome, visitor', ctrAfter: 'to Jackbo', best: 'Best viewed at Jackbo' }).replace('es-foot"', 'es-foot" style="color:#555"')}</div>`;
  });
})();
