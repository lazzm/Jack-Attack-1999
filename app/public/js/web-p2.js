/* web-p2: the 1999 Web, part 2. Fan shrines, hobbies, science and nerd stuff. */
(function () {
  const W = window.WebPack, esc = W.esc, tile = W.tile;
  // the people are this visitor's own cast (js/cast.js): every page's text, guestbook seeds and guestbook options go through
  // Cast.t, so {kidPoke}, {kidY2k.his}, {club2?boy|girl} ... come out with this visitor's names and the right he/she
  const def = (w, o) => { const h = o.html; if (h) o.html = c => { const gb = c.gb; c.gb = (seed, opt) => gb(Cast.deep(seed), Cast.deep(opt)); try { return Cast.t(h(c)); } finally { c.gb = gb; } }; return W.def(w, o); };

  // ---------------------------------------------------------------- ~ellie: Pokemon facts
  const GYMS = [['Brick', 'Moss Town', 'Moss', 'Rock'], ['Soggy', 'Pebble Bay', 'Splash', 'Water'], ['Lt. Zapp', 'Fusebox Town', 'Spark', 'Electric'], ['Petunia', 'Kiln Village', 'Kiln', 'Grass'], ['Kogger', 'Fusty City', 'Sock', 'Poison'], ['Sabotina', 'Sellotape City', 'Sellotape', 'Psychic'], ['Blame', 'Custard Island', 'Custard', 'Fire'], ['Don Giovinco', 'Gravel City', 'Gravel', 'Ground']];
  const QUIZ = [['How many Pocket Critters are there in Moss and Puddle?', ['150', '151', '101', '200'], 1], ['Which of these is a starter Pocket Critters?', ['Zapachu', 'Squirturtle', 'Evie', 'Snorelax'], 1], ['What do you need to trade with a mate?', ['A modem', 'A Link Cable', 'A Game Pike', 'A stamp'], 1], ['Which gym leader gives you the Moss Badge?', ['Soggy', 'Brick', 'Kogger', 'Blame'], 1], ['Which Pocket Critters only evolves when you TRADE it?', ['Pidgeon', 'Ratatat', 'Haunty', 'Magicarp'], 2], ['What type is Charbroiler?', ['Water', 'Fire', 'Grass', 'Bug'], 1]];
  def('~ellie', {
    css: `.wp-u-ellie{background:#fff ${tile('<circle cx="20" cy="20" r="9" fill="#e3350d" stroke="#222" stroke-width="2"/><path d="M11 20h18" stroke="#222" stroke-width="2"/><path d="M20 29a9 9 0 0 0 9-9H11a9 9 0 0 0 9 9z" fill="#fff"/><circle cx="20" cy="20" r="3" fill="#fff" stroke="#222" stroke-width="2"/>', 40)};color:#222;font:14px/1.45 Verdana,Arial,sans-serif}
.wp-u-ellie .el-wrap{max-width:660px;margin:0 auto;background:#fff;border:4px solid #3b4cca;border-radius:10px;padding:12px 16px;box-shadow:0 0 0 4px #ffcb05}
.wp-u-ellie h1{font:bold 32px "Arial Black",Arial,sans-serif;color:#ffcb05;-webkit-text-stroke:1.5px #3b4cca;text-shadow:3px 3px 0 #3b4cca;text-align:center;margin:0 0 6px}
.wp-u-ellie h2{background:#e3350d;color:#fff;font:bold 15px Verdana,sans-serif;padding:3px 8px;margin:14px 0 6px;border-radius:4px}
.wp-u-ellie table{width:100%;font-size:13px}.wp-u-ellie td,.wp-u-ellie th{border:1px solid #bbb;padding:3px 5px}.wp-u-ellie th{background:#ffe680;text-align:left}
.wp-u-ellie .el-types span{display:inline-block;padding:1px 7px;margin:2px;border-radius:9px;color:#fff;font-size:11px;font-weight:bold;border:1px solid rgba(0,0,0,.3)}
.wp-u-ellie .el-q{background:#f0f4ff;border:2px solid #3b4cca;padding:10px;border-radius:8px}
.wp-u-ellie .el-q .btn{margin:3px}
.wp-u-ellie .el-res{font-weight:bold;min-height:20px;margin-top:4px}
.wp-u-ellie .el-note{font-size:11px;color:#666;font-style:italic}
.wp-u-ellie a{color:#3b4cca}`,
    html: c => `<div class="el-wrap"><h1>{kidPoke.NAME}'S POCKET CRITTERS FACTS PAGE</h1>
<p class="c"><marquee scrollamount="5">GOTTA LEARN 'EM ALL!!! &nbsp; &#9679; &nbsp; Facts only, no made-up stuff (I checked them in the magazine) &nbsp; &#9679; &nbsp; Moss or Puddle? VOTE BELOW!</marquee></p>
<p>Hiya! I'm {kidPoke} and I am OBSESSED with Pocket Critters. It's been on telly here since the spring and the Game Lad games came out in the shops this autumn and EVERYONE in my class has one (or is borrowing one). This page has proper facts, not rumours. For rumours, go and see ${c.a('swrumours', 'the Rumour Mill')}, that's what it's for.</p>
<p class="el-note">No pictures on this page because Jack says you're not allowed to copy them off the Internet. So use your imagination. Zapachu is yellow.</p>
<h2>THE BASICS</h2><ul><li>There are <b>151</b> Pocket Critters in Moss and Puddle. Number 1 is Bulbabeast and number 151 is MewOne.</li><li>You pick one starter from <b>Bulbabeast</b> (grass), <b>Charbroiler</b> (fire) or <b>Squirturtle</b> (water). Your rival picks the one that beats yours. Rude.</li><li>Moss and Puddle have slightly different Pocket Critters in them. That's why you need a mate with the other one and a <b>Link Cable</b>. (Jack has Puddle Version. I have Moss Version. We are a good team.)</li><li>Some Pocket Critters only evolve when you trade them: Kadabba, Machoked, Gravelly and Haunty. Not through the cable, no evolution!</li><li>You can carry 6 Pocket Critters. The rest go in the PC in the Pocket Critters Centre. Yes, a PC. Like this one, but it holds monsters.</li></ul>
<h2>VERSION EXCLUSIVES</h2><table><tr><th>Only in MOSS</th><th>Only in PUDDLE</th></tr><tr><td>Snake-E, Arbonk, Oddball, Gloom, Vile Perfume, Growlbite, Arcaninny, Manky, Primeate, Scythey, Electabuzzzz</td><td>Sandshoe, Sandsplash, Bellsprat, Weepinbill, Victory Bell, Vulpickle, Ninetalez, Meowf, Persian, Pincer, Magmaar</td></tr></table>
<h2>THE 8 GYM BADGES</h2><table><tr><th>#</th><th>Leader</th><th>Town</th><th>Badge</th><th>Type</th></tr>${GYMS.map((g, i) => `<tr><td>${i + 1}</td><td>${g[0]}</td><td>${g[1]}</td><td>${g[2]} Badge</td><td>${g[3]}</td></tr>`).join('')}</table>
<h2>THE 15 TYPES</h2><div class="el-types">${[['Normal', '#a8a878'], ['Fire', '#f08030'], ['Water', '#6890f0'], ['Electric', '#d8b000'], ['Grass', '#78c850'], ['Ice', '#58b8c8'], ['Fighting', '#c03028'], ['Poison', '#a040a0'], ['Ground', '#c0a040'], ['Flying', '#a890f0'], ['Psychic', '#f85888'], ['Bug', '#a8b820'], ['Rock', '#b8a038'], ['Ghost', '#705898'], ['Dragon', '#7038f8']].map(([t, col]) => `<span style="background:${col}">${t}</span>`).join('')}</div><p class="small">Water beats fire, fire beats grass, grass beats water. Electric beats water AND flying. Nothing beats Mom saying "bedtime".</p>
<h2>{kidPoke.NAME}'S TOP TIPS</h2><ol><li>SAVE before you fight a legendary bird. Then save again.</li><li>Don't put your Ratatat in the PC and forget about it like Dave did. It's been in there since October.</li><li>Fishing rods: Old Pole only catches Magicarp. Magicarp does NOTHING... until level 20. Then it's a Gyaradish and your mate's face goes funny.</li><li>Give your Pocket Critters nicknames. Mine are all named after biscuits.</li></ol>
<h2>POCKET CRITTERS QUIZ</h2><div class="el-q"><div class="el-qq"></div><div class="el-qa"></div><div class="el-res"></div><p class="small">Score: <b class="el-sc">0</b> / ${QUIZ.length}</p></div>
<h2>RED OR BLUE? (live vote)</h2><p class="c"><button class="btn" type="button" data-v="red">RED!</button> <button class="btn" type="button" data-v="blue">BLUE!</button></p><p class="c el-votes">Loading votes...</p>
<p class="c">Trainers who've visited: ${c.counter('flip')}</p>
${c.gb([['Jack', c.daysAgo(2), 'Red is better. Growlbite. Enough said.', 5], ['Dave', c.daysAgo(4), 'i caught a MEWONE. (ok i didnt. but i nearly did. its under the truck.)', 3], ['{kidPoke}', c.daysAgo(4), 'DAVE THERE IS NO MEWONE UNDER THE TRUCK. STOP IT.', 0]], { title: 'Trainer Guestbook', ph: 'Moss or Puddle? Favourite Pocket Critters? (no rumours!!)' })}
<p class="c small">See also: ${c.a('swrumours', 'the Rumour Mill')} &middot; ${c.a('top100cheats', 'cheats')} &middot; ${c.a('~kim', '{cousin} ({cousin.he} likes Jelly Puff)')}</p>
${c.ring()}</div>`,
    setup(el, c) {
      const qq = el.querySelector('.el-qq'), qa = el.querySelector('.el-qa'), res = el.querySelector('.el-res'), sc = el.querySelector('.el-sc');
      let i = 0, score = 0;
      const ask = () => {
        if (i >= QUIZ.length) { qq.innerHTML = '<b>FINISHED!</b> ' + (score === QUIZ.length ? 'POCKET CRITTERS MASTER!!! (of this quiz)' : score >= 4 ? 'Pretty good! Read the page again for the rest.' : 'Hmm. Were you even reading?'); qa.innerHTML = '<button class="btn" type="button">Try again</button>'; qa.firstChild.addEventListener('click', () => { i = 0; score = 0; sc.textContent = 0; ask(); }); return; }
        const q = QUIZ[i]; qq.innerHTML = `<b>Q${i + 1}:</b> ${esc(q[0])}`; qa.innerHTML = q[1].map((a, k) => `<button class="btn" type="button" data-k="${k}">${esc(a)}</button>`).join(''); res.textContent = '';
        qa.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const ok = +b.dataset.k === q[2]; if (ok) { score++; sc.textContent = score; Sound.play('pet'); } else Sound.play('uhoh'); res.textContent = ok ? 'CORRECT!' : 'Nope! It was ' + q[1][q[2]] + '.'; i++; setTimeout(ask, 900); }));
      };
      ask();
      const votes = el.querySelector('.el-votes'), show = v => { if (!v || typeof v !== 'object') v = {}; const r = +v.red || 0, b = +v.blue || 0, t = r + b; votes.innerHTML = t ? `RED: <b>${r}</b> (${Math.round(r / t * 100)}%) &nbsp; BLUE: <b>${b}</b> (${Math.round(b / t * 100)}%) &nbsp; <span class="small">${t} votes</span>` : 'No votes yet!'; };
      const K = 'web.ellie.vote';
      const load = () => c.get([K]).then(v => show(v[K]));
      load(); c.watch(K, ev => { if (ev.type === 'put') load(); });
      el.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { c.get([K]).then(v => { const o = v[K] || {}; const n = (+o[b.dataset.v] || 0) + 1; Net.kv.put(K, b.dataset.v, String(n)); Sound.play('click'); }); }));
    },
  });

  // ---------------------------------------------------------------- ~blockhead: the other Tetris shrine
  def('~blockhead', {
    css: `.wp-u-blockhead{background:#000 ${tile('<rect x="2" y="2" width="12" height="12" fill="#101828"/><rect x="18" y="2" width="12" height="12" fill="#1a1030"/><rect x="2" y="18" width="12" height="12" fill="#0a2010"/><rect x="18" y="18" width="12" height="12" fill="#201808"/>', 32)};color:#ddd;font:14px/1.5 "Courier New",monospace}
.wp-u-blockhead h1{text-align:center;font:bold 30px "Courier New",monospace;color:#fff;margin:4px 0}
.wp-u-blockhead h1 span{display:inline-block;padding:2px 6px;margin:1px;border:2px outset #888}
.wp-u-blockhead .bh-rival{background:#300;border:2px solid #f00;color:#fcc;padding:6px 10px;text-align:center;font-weight:bold}
.wp-u-blockhead h2{color:#0ff;font:bold 18px "Courier New",monospace;border-bottom:1px dashed #0ff;margin:16px 0 6px}
.wp-u-blockhead .bh-pieces{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.wp-u-blockhead .bh-p{text-align:center;font-size:12px}
.wp-u-blockhead .bh-p canvas{display:block;margin:0 auto 2px;image-rendering:pixelated;width:64px;height:48px;background:#111;border:1px solid #444}
.wp-u-blockhead table{width:100%;font-size:13px}.wp-u-blockhead td{border-bottom:1px solid #333;padding:4px;vertical-align:top}
.wp-u-blockhead .bh-well{display:block;margin:8px auto;image-rendering:pixelated;width:160px;height:320px;border:3px solid #666;background:#000}
.wp-u-blockhead a{color:#ff0}.wp-u-blockhead .wgb{background:#111;color:#ddd;border-color:#0ff}.wp-u-blockhead .wgb-head{background:#008}.wp-u-blockhead .wgbe-h b{color:#0ff}
.wp-u-blockhead .wctr-green{font-size:18px}`,
    html: c => `<h1>${'THE OTHER BLOCK SHRINE'.split(' ').map((w, i) => `<span style="background:${['#c00', '#0a0', '#00c', '#c80'][i]}">${w}</span>`).join(' ')}</h1>
<div class="bh-rival">NOTE: This is NOT ${c.a('tetris', 'the Shrine of the Falling Blocks')}. That one is Jack's. This one is MINE and it has MORE FACTS. (We are not arguing. We are both right. Mine is more right.)</div>
<h2>&gt; HISTORY (all true)</h2><ul><li>The game was invented in <b>1984</b> by <b>Alexey Pyjamanov</b>, a computer scientist in Moscow, on an Elektronika 60 computer that didn't even have proper graphics. The blocks were made of square brackets!</li><li>The name comes from <b>"tetra"</b> (Greek for four, because every piece has four squares) and <b>tennis</b>, his favourite sport.</li><li>It came to the Game Lad in <b>1989</b> and was bundled with it. That is why everyone's dad can play it.</li><li>The Game Lad music that everyone hums is a Russian folk song called <b>Korobeiniki</b>. It's over 100 years old. It's about a pedlar. Nobody knows this. Now YOU do.</li></ul>
<h2>&gt; THE 7 PIECES (tetrominoes)</h2><div class="bh-pieces">${['I', 'O', 'T', 'S', 'Z', 'J', 'L'].map(p => `<div class="bh-p"><canvas width="16" height="12" data-p="${p}"></canvas>${p}</div>`).join('')}</div><p class="c small">Every piece is 4 squares. There are exactly 7 ways to stick 4 squares together (if you count mirror images as different). That's maths. I checked.</p>
<h2>&gt; THE BLOCKHEAD RULES OF PLAY</h2><table><tr><td>1.</td><td>Keep the left or right column empty for the long piece. The long piece will not come. Keep it empty anyway.</td></tr><tr><td>2.</td><td>When the long piece finally comes, you will have filled the column by accident. This is the law.</td></tr><tr><td>3.</td><td>A "blockology" is four lines at once. Say it out loud when you get one. Everyone must hear.</td></tr><tr><td>4.</td><td>The S and Z pieces are the enemy. They are not evil. They just look it.</td></tr><tr><td>5.</td><td>Never, ever let your little brother "have a go" with your high score on the screen.</td></tr></table>
<h2>&gt; MY HIGH SCORES</h2><table><tr><td>Game Lad</td><td>142,350 (level 9 start, the proper way)</td></tr><tr><td>JackTris (in ${c.go('demos', 'the arcade')})</td><td>a lot but Jack keeps beating it, suspicious</td></tr><tr><td>The one on Mom's work computer</td><td>unknown, she changed the password</td></tr></table>
<h2>&gt; THE ENDLESS WELL</h2><p class="c small">It plays itself. Forever. Like my brain at night.</p><canvas class="bh-well" width="40" height="80"></canvas>
<p class="c">${c.midi('web-block', 'falling_blocks_remix.mid')} <span class="small">(my OWN tune, not the Russian one, before anyone says anything)</span></p>
<p class="c">Blockheads counted: ${c.counter('green')}</p>
${c.gb([['Jack', c.daysAgo(3), 'MORE facts? we will see about that. nice well though', 4], ['Blockhead', c.daysAgo(3), 'we will indeed see', 5], ['Dave', c.daysAgo(10), 'which block is the best one', 2], ['Blockhead', c.daysAgo(10), 'the I piece, Dave. the I piece.', 0]], { title: 'The Block Book', ph: 'Your best score? Favourite piece?' })}
<p class="c small">Rival shrine: ${c.a('tetris')} &middot; ${c.a('cubetimes', 'cube records')} &middot; ${c.a('top100cheats', 'cheats')}</p>
${c.ring()}`,
    setup(el, c) {
      const SH = { I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[1, 1, 1], [0, 1, 0]], S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]] };
      const COL = { I: '#0ff', O: '#ff0', T: '#c0f', S: '#0f0', Z: '#f00', J: '#06f', L: '#f80' };
      el.querySelectorAll('[data-p]').forEach(cv => { const g = cv.getContext('2d'), s = SH[cv.dataset.p]; g.fillStyle = COL[cv.dataset.p]; s.forEach((r, y) => r.forEach((v, x) => { if (v) g.fillRect(x * 4 + (4 - r.length) * 2 + 0, y * 4 + 2, 3, 3); })); });
      // an endless, self-playing well: drops random pieces at random columns, clears full lines
      const well = el.querySelector('.bh-well'), g = well.getContext('2d'), CW = 10, CH = 20, grid = Array.from({ length: CH }, () => Array(CW).fill(''));
      let piece = null, acc = 0;
      const rot = s => s[0].map((_, i) => s.map(r => r[i]).reverse());
      const fits = (s, x, y) => s.every((r, dy) => r.every((v, dx) => !v || (y + dy >= 0 && y + dy < CH && x + dx >= 0 && x + dx < CW && !grid[y + dy][x + dx])));
      const spawn = () => { const k = W.pick(Object.keys(SH)); let s = SH[k]; for (let i = W.ri(0, 3); i > 0; i--) s = rot(s); let best = null; for (let x = 0; x <= CW - s[0].length; x++) { let y = 0; while (fits(s, x, y + 1)) y++; if (fits(s, x, y)) { const h = y + s.length; if (!best || h > best.h || (h === best.h && Math.random() < 0.5)) best = { x, y, h }; } } if (!best) { grid.forEach(r => r.fill('')); return spawn(); } piece = { k, s, x: best.x, y: -s.length, ty: best.y }; };
      spawn();
      c.anim(dt => {
        acc += dt; if (acc > 0.07) { acc = 0; if (piece.y < piece.ty) piece.y++; else { piece.s.forEach((r, dy) => r.forEach((v, dx) => { if (v && piece.y + dy >= 0) grid[piece.y + dy][piece.x + dx] = piece.k; })); for (let y = CH - 1; y >= 0; y--) if (grid[y].every(Boolean)) { grid.splice(y, 1); grid.unshift(Array(CW).fill('')); y++; } spawn(); } }
        g.fillStyle = '#000'; g.fillRect(0, 0, 40, 80);
        grid.forEach((r, y) => r.forEach((v, x) => { if (v) { g.fillStyle = COL[v]; g.fillRect(x * 4, y * 4, 3, 3); } }));
        piece.s.forEach((r, dy) => r.forEach((v, dx) => { if (v && piece.y + dy >= 0) { g.fillStyle = COL[piece.k]; g.fillRect((piece.x + dx) * 4, (piece.y + dy) * 4, 3, 3); } }));
      });
    },
  });

  // ---------------------------------------------------------------- cubetimes: Rubik's cube records + live league
  def('cubetimes', {
    css: `.wp-cubetimes{background:#f4f4f4 ${tile('<rect x="1" y="1" width="8" height="8" fill="#e10600"/><rect x="11" y="1" width="8" height="8" fill="#fff"/><rect x="21" y="1" width="8" height="8" fill="#0028c8"/><rect x="1" y="11" width="8" height="8" fill="#ffd400"/><rect x="11" y="11" width="8" height="8" fill="#0a0"/><rect x="21" y="11" width="8" height="8" fill="#ff8c00"/><rect x="1" y="21" width="8" height="8" fill="#0028c8"/><rect x="11" y="21" width="8" height="8" fill="#e10600"/><rect x="21" y="21" width="8" height="8" fill="#fff"/>', 30)};color:#000;font:14px/1.45 Arial,sans-serif}
.wp-cubetimes .ct-wrap{background:#fff;max-width:680px;margin:0 auto;border:3px solid #000;padding:12px 16px}
.wp-cubetimes h1{font:bold 30px "Arial Black",Arial,sans-serif;text-align:center;margin:0 0 4px}
.wp-cubetimes h2{background:#000;color:#ffd400;font:bold 15px Arial,sans-serif;padding:3px 8px;margin:14px 0 6px}
.wp-cubetimes table{width:100%;font-size:13px}.wp-cubetimes td,.wp-cubetimes th{border:1px solid #999;padding:3px 6px;text-align:left}.wp-cubetimes th{background:#eee}
.wp-cubetimes .ct-timer{text-align:center;background:#000;color:#0f0;font:bold 52px "Courier New",monospace;padding:8px;border:4px inset #888;margin:8px 0}
.wp-cubetimes .ct-timer.ready{color:#ff0}.wp-cubetimes .ct-timer.run{color:#0f0}
.wp-cubetimes .ct-big{font-size:18px;padding:8px 20px}
.wp-cubetimes .ct-scr{font:bold 15px "Courier New",monospace;background:#ffd400;padding:4px 8px;display:inline-block}
.wp-cubetimes .ct-league td:first-child{font-weight:bold;width:30px}
.wp-cubetimes .me{background:#fff3b0}
.wp-cubetimes a{color:#0028c8}`,
    html: c => `<div class="ct-wrap"><h1>THE CUBE SPEED RECORDS PAGE</h1>
<p class="c"><i>For people who can solve it fast, people who can solve it slow, and people who can solve it "if you give me a minute, no, don't look"</i></p>
<h2>FACTS (checked, 1999)</h2><ul><li>The cube was invented in <b>1974</b> by <b>Erno Rubrick</b>, a Hungarian teacher of architecture. He called it the "Magic Cube". It took him over a month to solve his own puzzle the first time!</li><li>It has <b>43,252,003,274,489,856,000</b> possible positions. That's 43 quintillion. If you did one a second you'd need over a trillion years. Don't.</li><li>Only <b>one</b> of those positions is solved. (Dave says "two if you count peeling the stickers off". No, Dave.)</li><li>The first World Championship was in <b>Budapest in 1982</b>. The winner was <b>Minh Thay</b> from the USA with a time of <b>22.95 seconds</b>. That was the world record for the whole of the 80s and most of the 90s. (Everyone thinks there are faster people out there now... there hasn't been a proper competition in AGES.)</li><li>Nobody knows the smallest number of moves that will ALWAYS solve it. In 1995 a maths person proved it's never more than 29 face turns, and that at least one position needs 20. So it's somewhere between 20 and 29. Computers are working on it.</li><li>Dave's record: 4 days. (He left it on the radiator and the stickers slid off, then he put them back on solved.)</li></ul>
<h2>STOPWATCH + LEAGUE (live)</h2><p>Scramble your cube with this, put it down, then press <b>START</b> (or the space bar). Press <b>STOP</b> when you're done. Honest times only! You can post your time to the league and everyone on JackNet can see it.</p>
<p class="c">Scramble: <span class="ct-scr"></span> <button class="btn ct-newscr" type="button">New</button></p>
<div class="ct-timer" aria-live="polite">0.00</div>
<p class="c"><button class="btn ct-big ct-start" type="button">START</button> <button class="btn ct-big ct-stop" type="button" disabled>STOP</button> <button class="btn ct-post" type="button" disabled>Post to the league</button></p>
<p class="c ct-msg small"></p>
<table class="ct-league"><tr><th>#</th><th>Who</th><th>Time</th><th>When</th></tr><tbody class="ct-lb"><tr><td colspan="4">Loading the league from the CGI-BIN...</td></tr></tbody></table>
<p class="small">The league keeps the last 40 posted times. Fastest first. Times under 10 seconds get a very hard stare from the webmaster.</p>
<h2>METHOD</h2><p>I use the layer-by-layer method. Jack has written the whole thing out at ${c.a('cubeclub', 'the Cube Club')}, with the moves. Learn it, practise it, then come back and beat my time (which is 1 minute 48, don't laugh).</p>
<p class="c">${c.midi('web-cube', 'twist_and_turn.mid')}</p>
<p class="c">Cubers counted: ${c.counter('odo')}</p>
<p class="c small">Also: ${c.a('cubeclub')} &middot; ${c.a('~blockhead', 'the other block shrine')} &middot; ${c.a('~lee', 'yo-yo tricks')}</p>
${c.ring()}</div>`,
    setup(el, c) {
      const t = el.querySelector('.ct-timer'), st = el.querySelector('.ct-start'), sp = el.querySelector('.ct-stop'), po = el.querySelector('.ct-post'), msg = el.querySelector('.ct-msg'), scr = el.querySelector('.ct-scr'), lb = el.querySelector('.ct-lb');
      const scramble = () => { const F = ['R', 'L', 'U', 'D', 'F', 'B'], M = ['', "'", '2']; let out = [], last = ''; while (out.length < 20) { const f = W.pick(F); if (f === last) continue; last = f; out.push(f + W.pick(M)); } scr.textContent = out.join(' '); };
      scramble(); el.querySelector('.ct-newscr').addEventListener('click', scramble);
      let t0 = 0, raf = 0, running = false, result = 0;
      const tick = () => { if (!running) return; t.textContent = ((performance.now() - t0) / 1000).toFixed(2); raf = requestAnimationFrame(tick); };
      const start = () => { if (running) return; running = true; t0 = performance.now(); t.className = 'ct-timer run'; st.disabled = true; sp.disabled = false; po.disabled = true; msg.textContent = ''; Sound.play('beep'); tick(); };
      const stop = () => { if (!running) return; running = false; cancelAnimationFrame(raf); result = (performance.now() - t0) / 1000; t.textContent = result.toFixed(2); t.className = 'ct-timer'; st.disabled = false; sp.disabled = true; po.disabled = result < 2; Sound.play('solve'); c.secret('web.cubetime'); if (result < 2) msg.textContent = 'Under 2 seconds? Nobody is that fast. Not even the cube.'; };
      st.addEventListener('click', start); sp.addEventListener('click', stop);
      const key = ev => { if (ev.code !== 'Space' || !el.isConnected || !el.closest('.sec.on') || ev.target.closest('input,textarea')) return; ev.preventDefault(); running ? stop() : start(); };
      document.addEventListener('keydown', key);
      const K = 'web.cube.league';
      const draw = arr => { const rows = (arr || []).map(e => { const m = /^([\d.]+)\|/.exec(e.text || ''); return m ? { t: +m[1], by: e.by, ts: e.ts } : null; }).filter(x => x && x.t > 0).sort((a, b) => a.t - b.t).slice(0, 15); lb.innerHTML = rows.length ? rows.map((r, i) => `<tr class="${r.by === Net.me.nick ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.by)}</td><td>${r.t < 60 ? r.t.toFixed(2) + 's' : Math.floor(r.t / 60) + 'm ' + (r.t % 60).toFixed(2) + 's'}</td><td>${W.tsDate(r.ts)}</td></tr>`).join('') : '<tr><td colspan="4">Nobody has posted a time yet. Be the first!</td></tr>'; };
      const load = () => c.get([K]).then(v => draw(v[K]));
      load(); c.watch(K, ev => { if (ev.type === 'push') load(); });
      po.addEventListener('click', () => { if (!Net.kv.push(K, result.toFixed(2) + '|solve')) return (msg.textContent = 'Not connected!'); po.disabled = true; msg.textContent = 'Posted! Check the league.'; });
      return () => { running = false; cancelAnimationFrame(raf); document.removeEventListener('keydown', key); };
    },
  });

  // ---------------------------------------------------------------- ~zed: sci-fi film reviews of 1999 (release-date aware)
  const FILMS = Cast.deep([
    ['The Modemtrix', 611, 5, 'Went in knowing nothing. Came out convinced I could dodge things. (I cannot. Dave threw a tennis ball at me on the way home and it got me right on the ear.) The bit where the camera goes round the frozen kick is the coolest thing I have ever seen in a cinema. 15 certificate, Mom took me, she liked the coats.'],
    ['Intergalactic Battles: Episode I - The Phantom Nuisance', 716, 4, "I'm not going to spoil it. I'll just say: the peapod race is incredible, the duel at the end is incredible, and {kidEp1} cried ({kidEp1.he} says it was the air conditioning). There's a floppy-eared alien that some people hate. I thought he was fine, honestly, but there's a whole debate page about it. Read my mate's LINK_SAM for more."],
    ['The Mommy', 625, 4, 'Not strictly sci-fi, but there are beetles that go under your skin, so it counts. Brilliant fun. The leading man is funny and shoots things and the sand face is dead scary. Lost a star because Dave kept whispering "it\'s not a real mummy" for two hours.'],
    ['Wild Wild Nest', 813, 2, 'A giant mechanical spider. Cowboys. A big song at the end. I wanted to love it. I didn\'t. The spider was good. Two stars, one of them for the spider.'],
    ['Deep Bluey Sea', 1015, 3, 'Super-clever sharks. One of the sharks is REALLY clever. There is a speech in it that ends in a way I did not expect and everyone in the cinema went "OH!". Worth it for that.'],
    ['The Iron Giraffe', 1217, 5, 'A boy and a giant robot from space. Cartoon but NOT for babies. I will not tell you how it ends. I will tell you that {kidEp1}, Dave AND me all had "something in our eye" and that it was definitely the best film of the year that isn\'t about peapodracing.'],
    ['Blade (last year, on video now)', 101, 4, 'Vampires, a nightclub, sunglasses at night. On video now so you can watch it with the sound down when your parents are asleep. (Don\'t.)'],
    ['Dark City (last year, on video)', 101, 5, 'A city where it is always night and nobody notices. Strange, dark and brilliant. If you liked The Modemtrix you have to see this. They even look a bit alike.'],
  ]);
  def('~zed', {
    css: `.wp-u-zed{background:#05070f ${tile('<circle cx="7" cy="11" r=".8" fill="#fff"/><circle cx="33" cy="4" r="1.1" fill="#fff"/><circle cx="52" cy="30" r=".7" fill="#fff"/><circle cx="20" cy="44" r="1" fill="#aaf"/><circle cx="44" cy="52" r=".6" fill="#fff"/><circle cx="60" cy="14" r=".5" fill="#fff"/>', 64)};color:#cfe;font:14px/1.5 Verdana,Arial,sans-serif}
.wp-u-zed h1{font:bold 34px Impact,"Arial Black",sans-serif;letter-spacing:2px;text-align:center;color:#0ff;text-shadow:0 0 10px #0ff,0 0 30px #08f;margin:8px 0}
.wp-u-zed .zd-film{border:1px solid #0ff;background:rgba(0,30,60,.7);padding:10px 14px;margin:10px auto;max-width:680px;display:flex;gap:12px;flex-wrap:wrap}
.wp-u-zed .zd-film .zd-poster{flex:none;width:70px;height:100px;border:2px solid #0ff;display:flex;align-items:center;justify-content:center;font:bold 10px Arial,sans-serif;text-align:center;color:#fff;padding:3px;box-sizing:border-box}
.wp-u-zed .zd-film>div:last-child{flex:1 1 300px;min-width:0}
.wp-u-zed .zd-film b{font-size:17px;color:#fff}
.wp-u-zed .zd-stars{color:#ffd400;font-size:18px;letter-spacing:2px}
.wp-u-zed .zd-soon{opacity:.75;border-style:dashed}
.wp-u-zed .zd-tag{display:inline-block;background:#f0f;color:#000;font:bold 10px Arial,sans-serif;padding:1px 5px;margin-left:6px}
.wp-u-zed .zd-rate{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin:10px 0}
.wp-u-zed a{color:#ff0}.wp-u-zed .wgb{background:#001;color:#cfe;border-color:#0ff}.wp-u-zed .wgb-head{background:#036}.wp-u-zed .wgbe-h b{color:#0ff}`,
    html: c => {
      const md = c.t99.md;
      return `<h1>{club1.NAME}'S SCI-FI FILM ZONE</h1>
<p class="c"><marquee scrollamount="4">&#9733; Every sci-fi film at the pictures this year, reviewed by ME, {club1}, aged "old enough (my big brother says)" &#9733; Stars out of 5 &#9733; No spoilers (mostly) &#9733;</marquee></p>
<p class="c">What a year for sci-fi!!! A film about a computer world, a film with a peapod race, a robot cartoon that made Dave cry. I review them all. Films I haven't seen yet (because they're not out yet, I'm not a time traveller) are marked <span class="zd-tag">COMING SOON</span>.</p>
${FILMS.map(([t, rel, stars, txt]) => { const out = rel <= md || rel === 101; const col = ['#060', '#600', '#036', '#303', '#630'][t.length % 5]; return `<div class="zd-film${out ? '' : ' zd-soon'}"><div class="zd-poster" style="background:${col}">${esc(t.replace(/ \(.*\)/, ''))}</div><div><b>${esc(t)}</b>${out ? '' : '<span class="zd-tag">COMING SOON</span>'}<br>${out ? `<span class="zd-stars">${'&#9733;'.repeat(stars)}${'&#9734;'.repeat(5 - stars)}</span><p>${txt.replace('LINK_SAM', c.a('~sam', 'Episode I countdown page'))}</p>` : `<p><i>Out on ${String(rel % 100).padStart(2, '0')}/${String(Math.floor(rel / 100)).padStart(2, '0')}/99 here. I have already asked Mom. She said "we'll see". That means yes.</i></p>`}</div></div>`; }).join('')}
<h3 class="c">WHAT'S THE BEST SCI-FI FILM OF 1999? (live vote)</h3><div class="zd-rate">${['The Modemtrix', 'Episode I', 'The Mommy', 'The Iron Giraffe', 'Something else'].map((f, i) => `<button class="btn" type="button" data-f="f${i}">${f}</button>`).join('')}</div><p class="c zd-res small">Loading votes...</p>
<p class="c">Visitors from this planet: ${c.counter('led')}</p>
${c.gb([['{kidEp1}', c.daysAgo(1), 'Episode I should be 5 stars. I am not speaking to you.', 2], ['{club1}', c.daysAgo(1), 'you are literally sat next to me', 0], ['Jack', c.daysAgo(6), 'Dark City review is spot on. also the sharks one, that speech!!!', 5]], { title: 'Review my reviews', ph: 'Agree? Disagree? Seen something I missed?' })}
<p class="c small">Mates: ${c.a('~sam', "{kidEp1}'s countdown")} &middot; ${c.a('~ash', 'real space')} &middot; ${c.a('fanfic', 'stories')} &middot; ${c.a('matrix', 'wake up')}</p>
${c.ring()}`;
    },
    setup(el, c) {
      const K = 'web.zed.vote', res = el.querySelector('.zd-res'), names = ['The Modemtrix', 'Episode I', 'The Mommy', 'The Iron Giraffe', 'Something else'];
      const show = v => { v = v && typeof v === 'object' ? v : {}; const t = names.reduce((s, _, i) => s + (+v['f' + i] || 0), 0); res.innerHTML = t ? names.map((n, i) => `${esc(n)}: <b>${+v['f' + i] || 0}</b>`).join(' &nbsp;|&nbsp; ') + ` <span class="small">(${t} votes)</span>` : 'No votes yet!'; };
      const load = () => c.get([K]).then(v => show(v[K])); load(); c.watch(K, ev => { if (ev.type === 'put') load(); });
      el.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => c.get([K]).then(v => { const o = v[K] || {}; Net.kv.put(K, b.dataset.f, String((+o[b.dataset.f] || 0) + 1)); Sound.play('click'); })));
    },
  });

  // ---------------------------------------------------------------- ~gaz: millennium countdown bunker
  def('~gaz', {
    css: `.wp-u-gaz{background:#1a1a1a ${tile('<path d="M0 0h20v20H0z" fill="#1a1a1a"/><path d="M0 20L20 0" stroke="#2a2a2a" stroke-width="3"/>', 20)};color:#ff0;font:14px/1.45 "Courier New",monospace}
.wp-u-gaz .gz-top{border:4px solid #ff0;background:repeating-linear-gradient(-45deg,#ff0 0 14px,#000 14px 28px);padding:4px;text-align:center}
.wp-u-gaz .gz-top h1{background:#000;margin:0;padding:8px;font:bold 26px "Courier New",monospace;color:#ff0}
.wp-u-gaz .gz-cd{text-align:center;background:#000;border:3px inset #666;margin:12px auto;padding:10px;max-width:560px}
.wp-u-gaz .gz-n{font:bold 44px "Courier New",monospace;color:#f00;text-shadow:0 0 8px #f00}
.wp-u-gaz .gz-box{background:#000;border:2px solid #ff0;padding:10px 14px;margin:10px auto;max-width:620px}
.wp-u-gaz h2{color:#f80;font:bold 17px "Courier New",monospace;margin:0 0 6px}
.wp-u-gaz .gz-btn{display:block;margin:10px auto;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#f66,#c00 60%,#700);border:6px solid #444;box-shadow:0 6px 0 #222,0 0 20px #f00;color:#fff;font:bold 15px Arial,sans-serif;cursor:pointer}
.wp-u-gaz .gz-btn:active{transform:translateY(4px);box-shadow:0 2px 0 #222}
.wp-u-gaz .gz-alarm{animation:gzalarm .3s steps(2) infinite}
@keyframes gzalarm{50%{background:#400}}
.wp-u-gaz table{width:100%;font-size:13px}.wp-u-gaz td{border-bottom:1px dotted #660;padding:3px}
.wp-u-gaz a{color:#0f0}.wp-u-gaz .wgb{background:#000;color:#ff0;border-color:#ff0}.wp-u-gaz .wgb-head{background:#660}.wp-u-gaz .wgbe-h b{color:#f80}`,
    html: c => `<div class="gz-top"><h1>&#9888; {kidY2k.NAME}'S MILLENNIUM COUNTDOWN BUNKER &#9888;</h1></div>
<p class="c"><marquee scrollamount="6">THE BUG IS COMING *** 99 BECOMES 00 *** PLANES MIGHT FALL OUT OF THE SKY (probably not) *** CASH MACHINES MIGHT GIVE OUT FREE MONEY (probably not) (but maybe) *** BE READY ***</marquee></p>
<div class="gz-cd"><div>TIME UNTIL THE YEAR 2000:</div><div class="gz-n">--</div><div class="small gz-sub">calculating...</div></div>
<div class="gz-box"><h2>&gt; WHO IS {kidY2k.NAME}</h2><p>I am {kidY2k}. I am 13. I have read EVERYTHING about the Millennium Bug. I have a torch, a wind-up radio, 24 tins of spaghetti hoops and a plan. My plan is: on the 31st of December at 11:59pm I will be in the shed with the spaghetti hoops. Mom says I am "being dramatic". We'll see who's dramatic when the microwave thinks it's 1900, Mom.</p><p class="small">Jack has a bunker too (${c.a('y2kbunker', 'it has beans')}). Mine is better because it has a RED BUTTON.</p></div>
<div class="gz-box"><h2>&gt; THINGS THAT MIGHT HAPPEN AT MIDNIGHT</h2><table><tr><td>Video recorder forgets how to record</td><td>LIKELY (it can't record anyway)</td></tr><tr><td>Computers think it is 1900</td><td>POSSIBLE (that's the whole bug)</td></tr><tr><td>Dad's digital watch goes weird</td><td>CERTAIN (it's already weird)</td></tr><tr><td>The lights go off</td><td>POSSIBLE (that's why: torch)</td></tr><tr><td>Everything is fine and I look silly</td><td>...don't</td></tr></table></div>
<div class="gz-box"><h2>&gt; BUNKER INVENTORY</h2><ul><li>Spaghetti hoops: 24 tins</li><li>Tin opener: 2 (one is Nan's, don't tell her)</li><li>Torch: 1 (batteries: 1 set) (spare batteries: no) (note to self: batteries)</li><li>Wind-up radio: 1 (does not need batteries, THIS is the one)</li><li>Board games: Draughts, that one with the hippos</li><li>My cube (${c.a('cubetimes', 'for timing')}), for when it gets boring</li><li>Toilet roll: Mom won't let me take any into the shed. This is the weak point in the plan.</li></ul></div>
<div class="gz-box c"><h2>&gt; EMERGENCY DRILL</h2><p>Press the button to test the bunker alarm. Do NOT press it after midnight on the 31st. That's the real one.</p><button class="gz-btn" type="button">PRESS IN<br>EMERGENCY</button><div class="gz-msg small"></div></div>
<p class="c">${c.midi('web-gaz', 'bunker_alarm.mid')}</p>
<p class="c">Survivors who have visited: ${c.counter('led', { len: 5 })}</p>
${c.gb([["{kidY2k}'s Mom", c.daysAgo(2), '{kidY2k}. The shed. We have talked about this. Love, your MOTHER', 1], ['Jack', c.daysAgo(5), 'you need beans as well as hoops. trust me. see my page', 4], ['{kidY2k}', c.daysAgo(5), 'HOOPS ARE BEANS WITH BETTER SHAPES', 5]], { title: 'SURVIVOR LOG', ph: 'What is in YOUR bunker?' })}
<p class="c small">${c.a('y2kbunker', "Jack's bunker")} &middot; ${c.a('timecapsule', 'the time capsule')} &middot; ${c.a('~mike', 'is my PC Y2K ready?')}</p>
${c.ring()}`,
    setup(el, c) {
      const n = el.querySelector('.gz-n'), sub = el.querySelector('.gz-sub');
      const upd = () => { const t = Desk.today99(), now = new Date(), target = new Date(2000, 0, 1), cur = new Date(1999, t.m - 1, t.d, now.getHours(), now.getMinutes(), now.getSeconds()); let s = Math.max(0, Math.floor((target - cur) / 1000)); const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60; n.textContent = `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; sub.textContent = d > 100 ? 'plenty of time. buy hoops.' : d > 30 ? 'getting close. check torch.' : d > 7 ? 'VERY CLOSE. SHED READY.' : Cast.t('THIS IS IT. {kidY2k.NAME} OUT.'); };
      upd(); c.every(upd, 1000);
      let presses = 0; const msg = el.querySelector('.gz-msg');
      el.querySelector('.gz-btn').addEventListener('click', () => { presses++; el.classList.add('gz-alarm'); Sound.play('uhoh'); setTimeout(() => el.classList.remove('gz-alarm'), 1500); msg.textContent = ['DRILL! DRILL! Everyone to the shed!', 'That was a drill. Hoops not eaten.', 'Again? The neighbours are looking.', Cast.t('STOP. PRESSING. THE BUTTON. ({kidY2k})')][Math.min(presses - 1, 3)]; if (presses === 3) c.secret('web.bunker'); });
    },
  });

  // ---------------------------------------------------------------- top100cheats
  const CHEATS = [['Jacktris (this site)', 'Type GUBBINZ on the title screen', 'All blocks are green. This changes nothing. Gubbinz asked for it.'], ['Blobbit Lob (this site)', 'Hold both mouse buttons', 'The Blobbit makes a different noise. Also you can\'t aim. Not a great cheat.'], ['Zip the Badger 2', 'Up, Down, Left, Right, A + Start', 'Level select. (Every game has this. It\'s practically the law.)'], ['Ninja Postman', 'Pause and type MAIL', 'Infinite letters. The dogs are still fast though.'], ['Rally Legend 98', 'Name your driver "BIGWHEELS"', 'Giant tyres. Car can\'t fit under bridges. Hilarious for 4 minutes.'], ['Space Jack Pinball', 'Tilt 3 times in a row', 'Gubbinz appears on the backglass and tells you off. Technically a cheat.'], ['Dungeon of Gloom II', 'Hold L + R while loading', 'Your character wears a bucket on his head. Defence +1, dignity -100.'], ['Crash Kart Chaos', 'Finish backwards', 'Mirror mode unlocks. Do not try this in real life (Dave did, on his bike).'], ['Tank Attack 3D', 'Shoot the moon', 'The moon falls down. You lose. But WHAT a way to lose.'], ['Wizard Wars', 'Type XYZZY', 'Nothing happens. It just says "Nothing happens." It\'s a tradition.'], ['Mega Goalie', 'Pick the team called "DAVE FC"', 'Every player is called Dave. Every player dives the wrong way.'], ['Megabloke Mushroom Tour', 'Collect 99 mushrooms, then one more', 'The counter says 00. See? Y2K is EVERYWHERE.'], ['The Goblin Chronicles', 'Say the password "RUPEES" to the shopkeeper', 'He gives you 1 Rupee. You need 400.'], ['Sky Pirates', 'Hold A on the loading screen', 'Nothing. But it feels like it helps.'], ['Robot Rumble', 'Enter name as "ILOVEMOM"', 'Mom appears as a secret boss. You cannot beat Mom. Nobody can beat Mom.']];
  const LIFE = [['School', 'Say "I left it on the printer at home"', 'Works once per teacher. Keep a list.'], ['Dinner', 'Eat the sprouts first', 'They\'re gone. It\'s over. The rest is pudding.'], ['Bedtime', 'Claim you\'re "just saving"', 'Buys you 20 minutes. Do not actually save. (Do actually save.)'], ['Homework', 'Up, Up, Down, Down on the calculator', 'Does nothing. We tried.'], ['The Bus', 'Sit at the back', 'Unlocks "cool". Also unlocks "bumpy".'], ['Dave', 'Say "Mr Tiddles says hi"', 'Dave stops whatever he\'s doing to go and check. Every time.']];
  def('top100cheats', {
    css: `.wp-top100cheats{background:#000 ${tile('<text x="2" y="20" font-family="Courier New" font-size="14" fill="#0a0a0a" font-weight="bold">CHEAT</text>', 60, 28)};color:#0f0;font:13px/1.45 "Courier New",monospace}
.wp-top100cheats h1{font:bold 36px "Arial Black",Impact,sans-serif;text-align:center;color:#f00;text-shadow:3px 3px #ff0,6px 6px #00f;margin:4px 0}
.wp-top100cheats .tc-fire{text-align:center;color:#f80;font-weight:bold}
.wp-top100cheats .tc-box{border:2px solid #0f0;padding:8px 12px;margin:12px auto;max-width:720px;background:#001a00}
.wp-top100cheats h2{color:#ff0;font:bold 18px "Courier New",monospace;margin:0 0 6px}
.wp-top100cheats table{width:100%}.wp-top100cheats td,.wp-top100cheats th{border:1px solid #060;padding:3px 5px;vertical-align:top;text-align:left}.wp-top100cheats th{background:#030;color:#ff0}
.wp-top100cheats .tc-code{color:#0ff;font-weight:bold}
.wp-top100cheats .tc-search{display:flex;gap:6px;flex-wrap:wrap}.wp-top100cheats .tc-search input{flex:1;min-width:120px;background:#000;color:#0f0;border:1px solid #0f0;font:13px "Courier New",monospace}
.wp-top100cheats a{color:#ff0}.wp-top100cheats .wgb{background:#001a00;color:#0f0;border-color:#0f0}.wp-top100cheats .wgb-head{background:#060}.wp-top100cheats .wgbe-h b{color:#ff0}
.wp-top100cheats .wctr-green{font-size:18px}`,
    html: c => `<h1>TOP 100 CHEATS!!!</h1><p class="tc-fire">(well, ${CHEATS.length + LIFE.length}. I ran out. send me more. the title stays because it looks good)</p>
<p class="c"><marquee scrollamount="8">+++ CHEATZ +++ CODEZ +++ TIPZ +++ no passwords for REAL games because they are all in the magazines and this is the INTERNET +++ CHEATZ +++</marquee></p>
<div class="tc-box"><h2>FIND A CHEAT</h2><div class="tc-search"><input type="text" placeholder="type a game name..." aria-label="Find a cheat"><span class="small tc-n"></span></div></div>
<div class="tc-box"><h2>GAME CHEATS</h2><table class="tc-t"><tr><th>#</th><th>Game</th><th>Code</th><th>What happens</th></tr>${CHEATS.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r[0])}</td><td class="tc-code">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></div>
<div class="tc-box"><h2>CHEATS FOR REAL LIFE</h2><p class="small">Tested by me and Dave. Results may vary. Results did vary.</p><table class="tc-t"><tr><th>#</th><th>Level</th><th>Code</th><th>What happens</th></tr>${LIFE.map((r, i) => `<tr><td>${CHEATS.length + i + 1}</td><td>${esc(r[0])}</td><td class="tc-code">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table></div>
<div class="tc-box"><h2>THE CODE THAT WORKS ON EVERYTHING</h2><p>You know the one. Up, up, down, down... Jack's got ${c.a('konami', 'a whole page about it')}. Try it on the actual website. Try it on this page. Try it on Dave.</p></div>
<p class="c">Cheaters cheated: ${c.counter('green')} (we don't judge)</p>
${c.gb([['Dave', c.daysAgo(1), 'the ILOVEMOM one is real I beat her once. (I did not.)', 5], ['Gary', c.daysAgo(8), 'my cousin says if you type JUSTIN on any game you get infinite lives', 3], ['Webmaster', c.daysAgo(8), 'Gary your cousin made that up. like all the others.', 0]], { title: 'SEND ME CHEATS', ph: 'Game + code + what it does. Made up ones only please, obviously.' })}
<p class="c small">${c.go('cheats', "Jack's real cheats page")} &middot; ${c.a('~ellie', 'Pocket Critters facts (no cheats)')} &middot; ${c.a('downloads', 'free downloads')}</p>
${c.ring()}`,
    setup(el) {
      const inp = el.querySelector('input'), rows = [...el.querySelectorAll('.tc-t tr')].filter(r => r.querySelector('td')), n = el.querySelector('.tc-n');
      inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); let k = 0; rows.forEach(r => { const on = !q || r.textContent.toLowerCase().includes(q); r.style.display = on ? '' : 'none'; if (on) k++; }); n.textContent = q ? k + ' cheat(s) found' + (k ? '' : '. try "dave"') : ''; });
    },
  });

  // ---------------------------------------------------------------- ~mike: the upgrade diary
  const DIARY = [['Day 1', 'THE PLAN', 'My PC is a 300 MHz Celery-on. Dave says it\'s "slow". I read in a magazine that the Celery-on 300A can be made to run at <b>450 MHz</b> by changing one setting on the motherboard: the bus speed, from 66 MHz to 100 MHz. That\'s 50% faster FOR FREE. The magazine says "at your own risk". Dad says "at MY risk, it\'s my computer". We are at an impasse.'], ['Day 3', 'THE PARTS', 'Opened the case with a butter knife (couldn\'t find the screwdriver). Inside: the Celery-on on its slot, 32 MB of RAM (ONE stick), a 4 GB hard drive, a 2 MB graphics card that my mate calls "a potato". The motherboard has jumpers. I have no idea which ones. There is dust in the shape of a small animal.'], ['Day 5', 'THE RAM', 'Saved up and bought a 32 MB stick of PC100 SDRAM from the computer fair at the leisure centre. The man said "you\'ll want PC100 if you\'re going to 100 MHz bus" and winked. He knew. Now 64 MB. JackOS opens Paint before I\'ve finished blinking.'], ['Day 8', 'THE SWITCH', 'Found the jumper in the manual (page 31, it was under the pizza menu). Moved the bus speed jumper from 66 to 100. Hands shaking. Pressed the power button. BIOS screen says... <b>CELERY-ON 450 MHz</b>. I shouted. Dad came in. I said nothing was wrong. It wasn\'t!'], ['Day 9', 'THE HEAT', 'It crashed twice during a game. The chip is HOT. The magazine says this is "thermal" and that I need a better heatsink and fan. The man at the fair sold me one shaped like a big metal hedgehog, for a fiver. Fitted it. Thermal paste looks like toothpaste. (It is NOT toothpaste. Dave.)'], ['Day 12', 'THE RESULT', 'Stable for three days. Everything is faster. Games that were slide shows are now games. Dad has noticed the computer "sounds like a hairdryer" but has also noticed his spreadsheet opens "a bit quicker" so he\'s allowed it. 300 to 450 MHz for the price of RAM and a hedgehog. UPGRADE COMPLETE. Next: a 3D card. Saving starts now.']];
  def('~mike', {
    css: `.wp-u-mike{background:#dfe6d6 ${tile('<rect width="24" height="24" fill="#dfe6d6"/><rect x="4" y="4" width="16" height="16" fill="none" stroke="#b8c8a8"/><rect x="9" y="9" width="6" height="6" fill="#b8c8a8"/><path d="M12 0v4M12 20v4M0 12h4M20 12h4" stroke="#b8c8a8"/>', 24)};color:#102;font:14px/1.5 Verdana,Arial,sans-serif}
.wp-u-mike .mk-wrap{max-width:660px;margin:0 auto;background:#fff;border:2px solid #333;padding:12px 16px}
.wp-u-mike h1{font:bold 26px "Arial Black",Arial,sans-serif;text-align:center;margin:0}
.wp-u-mike .mk-mhz{text-align:center;font:bold 40px "Courier New",monospace;color:#060;margin:4px 0}
.wp-u-mike .mk-spec{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;font-size:13px;background:#eef3ea;border:1px solid #9a9;padding:8px}
.wp-u-mike .mk-spec b{color:#060}
.wp-u-mike .mk-day{border-left:5px solid #060;padding:4px 10px;margin:12px 0}
.wp-u-mike .mk-day h3{margin:0 0 3px;font:bold 15px Verdana,sans-serif}.wp-u-mike .mk-day h3 span{color:#888;font-weight:normal}
.wp-u-mike .mk-bench{background:#000;color:#0f0;font:12px "Courier New",monospace;padding:8px;white-space:pre-wrap}
.wp-u-mike .mk-bar{display:inline-block;height:10px;background:#0f0;vertical-align:middle}
.wp-u-mike a{color:#060}.wp-u-mike .wgb-head{background:#060}
@media (max-width:600px){.wp-u-mike .mk-spec{grid-template-columns:1fr}}`,
    html: c => `<div class="mk-wrap"><h1>MEGAHERTZ MIKE'S UPGRADE DIARY</h1><div class="mk-mhz">300 &rarr; 450 MHz</div>
<p class="c"><i>"It's not about the megahertz. It's about the megahertz."</i> - me</p>
<div class="mk-spec"><div><b>Before:</b> Celery-on 300A @ 300 MHz</div><div><b>After:</b> Celery-on 300A @ 450 MHz (100 MHz bus)</div><div><b>RAM:</b> 32 MB &rarr; 64 MB PC100 SDRAM</div><div><b>Hard drive:</b> 4.3 GB (3.1 GB is games)</div><div><b>Graphics:</b> 2 MB (a potato)</div><div><b>Sound:</b> 16-bit, with the speakers that came free</div><div><b>Monitor:</b> 15" at 800x600, 60Hz (flickers if you look at it sideways)</div><div><b>Modem:</b> 56K (actually connects at 44,000)</div><div><b>OS:</b> JackOS 98 (Jack installed it, don't ask)</div><div><b>Cooling:</b> a metal hedgehog</div></div>
${DIARY.map(([d, t, txt]) => `<div class="mk-day"><h3>${esc(t)} <span>${esc(d)}</span></h3><p>${txt}</p></div>`).join('')}
<h3>BENCHMARK (very scientific)</h3><div class="mk-bench">TEST                 300 MHz    450 MHz
Boot to desktop       61 sec     44 sec   <span class="mk-bar" style="width:120px"></span>
Open Paint            4.0 sec    2.1 sec  <span class="mk-bar" style="width:160px"></span>
Blobbit Lob (fps)     14         25       <span class="mk-bar" style="width:150px"></span>
Dave being impressed  no         briefly  <span class="mk-bar" style="width:30px"></span></div>
<h3>WARNING</h3><p class="small">Changing bus speeds can break your computer, lose your work, or make your dad cross. Not all chips will do it. Mine did. Do not blame me. Do not blame the hedgehog.</p>
<p class="c">Hardware nerds counted: ${c.counter('hex')}</p>
${c.gb([['Jack', c.daysAgo(2), 'the hedgehog is a legend. can you do mine? mom says no. do it anyway', 5], ['Dad', c.daysAgo(3), 'Michael, the hairdryer noise. We need to talk about the hairdryer noise.', 2], ['Computer fair man', c.daysAgo(9), 'told you. PC100.', 5]], { title: 'Tech Support (guestbook)', ph: 'Ask Mike a hardware question' })}
<p class="c small">${c.a('computerclub', 'Computer Club')} &middot; ${c.a('~gaz', 'is it Y2K safe?')} &middot; ${c.a('downloads', 'downloads at 44K')} &middot; ${c.go('demos', 'test it in the arcade')}</p>
${c.ring()}</div>`,
  });

  // ---------------------------------------------------------------- ~mek: miniature painting tips (vague, hobby only; Orks are one chapter)
  def('~mek', {
    css: `.wp-u-mek{background:#2a3a1a ${tile('<rect width="16" height="16" fill="#2a3a1a"/><rect width="8" height="8" fill="#1e2c12"/><rect x="8" y="8" width="8" height="8" fill="#1e2c12"/>', 16)};color:#e8e0c0;font:14px/1.5 Arial,sans-serif}
.wp-u-mek h1{font:bold 34px Impact,"Arial Black",sans-serif;text-align:center;color:#8fd14f;text-shadow:3px 3px 0 #000;letter-spacing:1px;margin:4px 0}
.wp-u-mek .mk-box{background:rgba(0,0,0,.55);border:3px solid #8fd14f;padding:10px 14px;margin:12px auto;max-width:640px}
.wp-u-mek h2{color:#ffd400;font:bold 18px Impact,sans-serif;letter-spacing:1px;margin:0 0 6px}
.wp-u-mek .mk-pal{display:flex;gap:6px;flex-wrap:wrap}
.wp-u-mek .mk-pal span{display:inline-flex;align-items:center;gap:6px;font-size:12px;background:#000;padding:3px 8px 3px 3px;border:1px solid #555}
.wp-u-mek .mk-pal i{width:20px;height:20px;border:1px solid #fff;display:inline-block}
.wp-u-mek .mk-skin{display:flex;gap:4px;align-items:center;justify-content:center;margin:8px 0}
.wp-u-mek .mk-skin button{width:48px;height:48px;border:3px outset #888;cursor:pointer}
.wp-u-mek canvas{display:block;margin:6px auto;width:160px;height:160px;image-rendering:pixelated;background:#111;border:3px solid #000}
.wp-u-mek .mk-checks{background:repeating-conic-gradient(#fff 0 25%,#000 0 50%) 0 0/16px 16px;height:16px;border:1px solid #000}
.wp-u-mek a{color:#8fd14f}.wp-u-mek .wgb{background:#1a2410;color:#e8e0c0;border-color:#8fd14f}.wp-u-mek .wgb-head{background:#3a5a1a}.wp-u-mek .wgbe-h b{color:#ffd400}`,
    html: c => `<h1>SNAZ'S MINIATURE PAINTING TIPS</h1>
<p class="c"><marquee scrollamount="5">THIN YOUR PAINTS (I never do) &nbsp;&#9679;&nbsp; THREE LAYERS LOOK LIKE A HUNDRED &nbsp;&#9679;&nbsp; DON'T DIP YOUR BRUSH IN YOUR TEA &nbsp;&#9679;&nbsp; CHECKS ON EVERYTHING &nbsp;&#9679;&nbsp; RED ONES GO FASTER</marquee></p>
<div class="mk-box"><h2>WHO IS SNAZ</h2><p>Snaz is my painting name. Jack's is "Jack". I've been painting little models since my birthday, when I got a box of Space Mariners and a brush that was too big. Since then: Gorks, a squad of Elder, an AirMix Spitfire, a Robo Rumble robot made of a margarine tub and all the trees on Dad's train set. These are my tips. They are not rules. There are no rules. Only paint. (Mom says there ARE rules, about the carpet.)</p></div>
<div class="mk-box"><h2>1. THREE LAYERS (the Gork skin trick)</h2><p>Every colour looks better in three layers. Start dark, then paint a lighter shade on the raised bits (muscles, noses, knuckles, the edges of armour), then an even lighter one on just the very tops. Three shades. Looks like a hundred. It works on Space Mariner armour and Elder helmets too, but the best for practising is green Gork skin. Click the greens below to see the three layers go on a (very small) Gork.</p><div class="mk-skin"><button type="button" data-g="0" style="background:#1f4a1a" aria-label="Dark green"></button><button type="button" data-g="1" style="background:#3f8a2a" aria-label="Mid green"></button><button type="button" data-g="2" style="background:#8fd14f" aria-label="Light green"></button><button type="button" data-g="3" style="background:#ffd400" aria-label="Teef and eyes"></button></div><canvas width="20" height="20" aria-label="A pixel Gork head being painted"></canvas><p class="c small mk-say">Start with the dark green.</p></div>
<div class="mk-box"><h2>2. METAL: SHINY OR RUSTY?</h2><p>Paint it dark grey first, then drybrush silver over it (nearly no paint on the brush, flick it across). Stop there for Space Mariner guns and AirMix propellers. For rust (Gorks, old tanks, the robot that lost on Robo Rumble), dab brown and orange into the corners. If it looks like it's been left in the rain for a year, you're done. Mine looks like it's been left in the rain for a THOUSAND years. That is also fine.</p></div>
<div class="mk-box"><h2>3. CHECKS AND FLAMES</h2><p>Checks are the law: racing cars, Gork buggies, Dave's skateboard. Paint the bit white, let it DRY (actually dry, go and have a biscuit), then paint little black squares with the tiniest brush you own. They will go wobbly. Nobody minds. Flames: red at the bottom, orange in the middle, yellow at the tips, on anything that goes fast.</p><div class="mk-checks" aria-hidden="true"></div></div>
<div class="mk-box"><h2>4. NEAT EDGES (Space Mariners, Elder and planes)</h2><p>Some models want to be tidy. Paint the main colour, then run a thin, watered-down dark line into the gaps between the armour plates. Every panel pops out. Elder want smooth colours, so do two thin coats instead of one fat one. AirMix tip: paint the pilot BEFORE you glue the canopy on. Learn from me. He is still unpainted. He is still in there.</p></div>
<div class="mk-box"><h2>5. THE BITS BOX</h2><p>Every spare bit from every kit goes in a tub. Arms, heads, a wheel, half a gun, an AirMix propeller, a BLOCKO steering wheel, something that might be a horn. When a model looks boring, go in the bits box and stick something on. A bigger gun. A pot on his head. Two pots. The bits box is where the best models come from. Jack's bits box is a biscuit tin. Mine is a lunchbox. We've been told to stop swapping bits at school.</p></div>
<div class="mk-box"><h2>SNAZ'S PALETTE (my names for them)</h2><div class="mk-pal">${[['#1f4a1a', 'Swamp Green'], ['#3f8a2a', 'Gork Green'], ['#8fd14f', 'Lime Fizz'], ['#1e4aa8', 'Marine Blue'], ['#c0c0c0', 'Dented Silver'], ['#ff8c00', 'Rust Orange'], ['#e10600', 'Go-Faster Red'], ['#ffd400', 'Banana Yellow'], ['#000', 'Black (for checks)'], ['#fff', 'White (for checks)']].map(([h, n]) => `<span><i style="background:${h}"></i>${n}</span>`).join('')}</div></div>
<p class="c">Painters who've dropped by: ${c.counter('odo')}</p>
${c.gb([['Jack', c.daysAgo(3), 'three greens changed my life. also stop taking my wheels out of the biscuit tin', 5], ['Gubbinz', c.daysAgo(4), 'yoo painted a little green man who looks just like me. he looks GOOD. do me next', 5], ['Mom', c.daysAgo(7), 'The carpet. We have discussed the carpet.', 1]], { title: 'PAINT TALK', ph: 'What are YOU painting? Tips? Disasters?' })}
<p class="c small">${c.go('orks', "Jack's Hobby Corner")} &middot; ${c.a('poetree', "Gubbinz's poems")} &middot; ${c.a('teef', 'shop for gems')} &middot; ${c.a('ascii', 'ASCII art')}</p>
${c.ring()}`,
    setup(el) {
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'), say = el.querySelector('.mk-say');
      // layers of a pixel Ork head: base dark, mid highlights, light tops, then teef and eyes
      const L = [
        { col: '#1f4a1a', px: [[7, 3, 6, 1], [5, 4, 10, 1], [4, 5, 12, 6], [5, 11, 10, 3], [6, 14, 8, 2], [3, 7, 1, 3], [16, 7, 1, 3]] },
        { col: '#3f8a2a', px: [[6, 5, 3, 2], [11, 5, 3, 2], [8, 8, 4, 3], [5, 12, 3, 1], [12, 12, 3, 1], [7, 4, 6, 1]] },
        { col: '#8fd14f', px: [[7, 5, 1, 1], [12, 5, 1, 1], [9, 8, 2, 1], [8, 4, 4, 1]] },
        { col: '#ffd400', px: [[6, 7, 2, 1], [12, 7, 2, 1], [6, 13, 1, 2], [9, 13, 1, 2], [13, 13, 1, 2]] },
      ];
      const SAY = ['Dark green all over. Looks like a blob. Trust me.', 'Mid green on the raised bits. Starting to look like someone.', 'Light green on the very tops. Now he\'s got a face!', 'Teef and eyes last. He\'s DONE. Waaagh.'];
      let done = 0;
      const draw = () => { g.fillStyle = '#111'; g.fillRect(0, 0, 20, 20); for (let i = 0; i < done; i++) { g.fillStyle = L[i].col; L[i].px.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h)); } if (done >= 4) { g.fillStyle = '#000'; g.fillRect(7, 7, 1, 1); g.fillRect(13, 7, 1, 1); } };
      draw();
      el.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.g; if (i !== done) { say.textContent = i < done ? 'Already did that layer!' : 'Not yet! ' + SAY[done].split('.')[0] + ' first.'; Sound.play('uhoh'); return; } done++; draw(); say.textContent = SAY[i]; Sound.play(done === 4 ? 'waaagh' : 'pet'); }));
    },
  });

  // ---------------------------------------------------------------- ~ash: space page
  const PLANETS = [['Mercury', 0.39, 3, '#b0a090', 'Closest to the Sun. No air. Boiling in the day, freezing at night. Terrible holiday.'], ['Venus', 0.72, 5, '#e8c070', 'Hottest planet (hotter than Mercury!) because of its thick clouds. Spins backwards. Show-off.'], ['Earth', 1, 5.2, '#4090e0', 'Home. Has Dave on it. Otherwise perfect.'], ['Mars', 1.52, 4, '#d06040', 'Red, dusty, two tiny moons. There are robots trying to get there RIGHT NOW. One of them got lost this year because somebody mixed up metric and imperial units. Really.'], ['Jupiter', 5.2, 12, '#d8b080', 'The biggest. Could fit over 1,000 Earths inside. Has a storm bigger than Earth that has been going for hundreds of years.'], ['Saturn', 9.5, 10, '#e0d0a0', 'RINGS. Made of ice and rock. Would float in a bath if you had a big enough bath.'], ['Uranus', 19, 7, '#80d0e0', 'Rolls on its side like a ball. Nobody knows why. Stop laughing at the name.'], ['Neptune', 30, 7, '#4060d0', 'Windiest planet. Blue. Very far. Takes 165 years to go round the Sun once.'], ['Pluto', 39, 2, '#c0b0b0', 'Tiny and far away. Smaller than our Moon! Its orbit is so wonky it was closer to the Sun than Neptune until February this year.']];
  def('~ash', {
    css: `.wp-u-ash{background:#000 ${tile('<circle cx="10" cy="20" r=".7" fill="#fff"/><circle cx="50" cy="8" r="1" fill="#fff"/><circle cx="80" cy="60" r=".6" fill="#ddf"/><circle cx="30" cy="70" r=".9" fill="#fff"/><circle cx="66" cy="34" r=".5" fill="#fff"/><circle cx="90" cy="90" r=".8" fill="#ffd"/>', 96)};color:#dde;font:14px/1.5 Verdana,Arial,sans-serif}
.wp-u-ash h1{font:bold 30px Verdana,sans-serif;text-align:center;color:#fff;letter-spacing:4px;margin:6px 0;text-shadow:0 0 12px #48f}
.wp-u-ash .as-box{border:1px solid #48f;background:rgba(10,20,50,.75);padding:10px 14px;margin:12px auto;max-width:660px}
.wp-u-ash h2{color:#8cf;font:bold 16px Verdana,sans-serif;margin:0 0 6px;letter-spacing:1px}
.wp-u-ash .as-sys{position:relative;height:90px;background:#000;border:1px solid #336;overflow:hidden}
.wp-u-ash .as-sun{position:absolute;left:-30px;top:15px;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,#fff,#ff0 40%,#f80);box-shadow:0 0 20px #f80}
.wp-u-ash .as-pl{position:absolute;top:45px;border-radius:50%;transform:translate(-50%,-50%);cursor:pointer;border:1px solid rgba(255,255,255,.4)}
.wp-u-ash .as-pl.on{box-shadow:0 0 0 3px #fff}
.wp-u-ash .as-info{min-height:44px;font-size:13px;margin-top:6px}
.wp-u-ash table{width:100%;font-size:13px}.wp-u-ash td{border-bottom:1px solid #336;padding:3px 4px;vertical-align:top}
.wp-u-ash .as-sky{display:block;margin:0 auto;width:100%;max-width:400px;height:200px;background:#000;border:1px solid #48f;cursor:crosshair}
.wp-u-ash a{color:#8cf}.wp-u-ash .wgb{background:#0a1430;color:#dde;border-color:#48f}.wp-u-ash .wgb-head{background:#246}.wp-u-ash .wgbe-h b{color:#8cf}`,
    html: c => `<h1>{club2.NAME}'S SPACE PAGE</h1>
<p class="c"><i>"Space is big. Really big." - a book Dave hasn't read.</i></p>
<div class="as-box"><h2>THE SOLAR SYSTEM (click a planet)</h2><div class="as-sys"><div class="as-sun"></div>${PLANETS.map((p, i) => `<span class="as-pl" data-i="${i}" role="button" tabindex="0" aria-label="${p[0]}" style="left:${8 + i * 10.8}%;width:${p[2] * 2.2}px;height:${p[2] * 2.2}px;background:${p[3]}"></span>`).join('')}</div><div class="as-info">Not to scale. If it was to scale, Pluto would be in the next town and the Sun would be the size of a beach ball.</div></div>
<div class="as-box"><h2>SPACE NEWS 1999</h2><table>
<tr><td>11 Aug</td><td><b>TOTAL SOLAR ECLIPSE</b> over Cornwall, the first one in Britain since 1927! The sky went dark in the middle of the morning. We only got a partial one from here but it still went weird and the birds stopped singing. DO NOT look at the Sun. Use the special glasses. Dave looked at it. Dave is fine. Dave was lucky.</td></tr>
<tr><td>July</td><td>The <b>Chandruff</b> X-ray telescope is due to go up on the Space Shuttlebus, and Eileen Collinz will be the first woman ever to command a Shuttle!</td></tr>
<tr><td>Sept</td><td>The <b>Mars Climate Orbiteer</b> is due to arrive at Mars. It's been flying there since last December. Fingers crossed!</td></tr>
<tr><td>All year</td><td>The <b>International Space Stationery</b> is being built! The first two bits (a Russian one and an American one) were joined up in orbit last December. It's going to be HUGE. You can already see it go over sometimes, like a fast star.</td></tr>
<tr><td>Nov</td><td>The <b>Leonid</b> meteor shower, around the 17th/18th. Last year was good. This year might be a STORM. Get up at 3am. Bring a blanket. Mom said no. I'm going anyway (sorry Mom).</td></tr>
<tr><td>Still</td><td><b>Mirth</b>, the Russian space station, is still up there. It's 13 years old and a bit creaky.</td></tr></table></div>
<div class="as-box"><h2>MAKE YOUR OWN CONSTELLATION</h2><p class="small">Click stars to join them up. Then name it. Real astronomers did this with a bear, a plough and a man with a belt, so anything goes.</p><canvas class="as-sky" width="400" height="200"></canvas><p class="c"><input type="text" class="as-name" maxlength="30" placeholder="Name your constellation" aria-label="Constellation name"> <button class="btn as-clear" type="button">Clear</button></p><p class="c as-out small"></p></div>
<p class="c">${c.midi('web-space', 'orbit.mid')}</p>
<p class="c">Earthlings logged: ${c.counter('bin')} <span class="small">(in binary, because space)</span></p>
${c.gb([['Jack', c.daysAgo(2), 'I made "The Great Pot Noodlez". it is three stars. it is perfect.', 5], ['Dave', c.daysAgo(4), 'i can still see fine. a bit green. but fine', 3], ['{teacher.Sir}', c.daysAgo(10), 'Excellent page, {club2.first}. Units. Matter. ({teacher.Mr} {teacher.first}, Computer Club)', 5]], { title: 'Mission Log', ph: 'Seen anything in the sky? (not Dave)' })}
<p class="c small">${c.a('~zed', 'sci-fi films')} &middot; ${c.a('~sam', 'a galaxy far away')} &middot; ${c.a('area51', 'the "truth"')} &middot; ${c.a('~kevin', 'a space rock (it is not)')}</p>
${c.ring()}`,
    setup(el) {
      const info = el.querySelector('.as-info');
      el.querySelectorAll('.as-pl').forEach(s => { const go = () => { el.querySelectorAll('.as-pl').forEach(x => x.classList.remove('on')); s.classList.add('on'); const p = PLANETS[+s.dataset.i]; info.innerHTML = `<b>${p[0]}</b>: ${p[1]} times as far from the Sun as Earth. ${esc(p[4])}`; Sound.play('click'); }; s.addEventListener('click', go); s.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); });
      const cv = el.querySelector('.as-sky'), g = cv.getContext('2d'), out = el.querySelector('.as-out'), name = el.querySelector('.as-name');
      const stars = Array.from({ length: 34 }, (_, i) => ({ x: 12 + ((i * 97) % 376), y: 12 + ((i * 61 + 17) % 176), r: 1 + (i % 3) }));
      let picked = [];
      const draw = () => { g.fillStyle = '#000'; g.fillRect(0, 0, 400, 200); g.strokeStyle = '#8cf'; g.lineWidth = 1.5; g.beginPath(); picked.forEach((s, i) => i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y)); g.stroke(); stars.forEach(s => { g.fillStyle = picked.includes(s) ? '#ff0' : '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }); };
      draw();
      cv.addEventListener('click', ev => { const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * 400 / r.width, y = (ev.clientY - r.top) * 200 / r.height; const s = stars.find(s => Math.hypot(s.x - x, s.y - y) < 12); if (!s) return; if (picked[picked.length - 1] === s) picked.pop(); else picked.push(s); draw(); Sound.play('click'); if (picked.length >= 3) out.textContent = `"${name.value.trim() || 'The Unnamed Thing'}" (${picked.length} stars). Officially recognised by the ${Cast.n('club2')} Astronomical Society.`; });
      name.addEventListener('input', () => { if (picked.length >= 3) out.textContent = `"${name.value.trim() || 'The Unnamed Thing'}" (${picked.length} stars). Officially recognised by the ${Cast.n('club2')} Astronomical Society.`; });
      el.querySelector('.as-clear').addEventListener('click', () => { picked = []; out.textContent = ''; draw(); });
    },
  });

  // ---------------------------------------------------------------- fanfic: the archive
  const STORIES = Cast.deep([
    ['The Blobbit Who Ate the Internet', 'JackAttack', 'G', `It started with the modem. Gubbinz had always said the modem "sounded hungry", and one Tuesday, while Jack was at school, a small red Blobbit bounced into the computer through the floppy drive and ate the Internet.

Not all of it. Just the bit with the pictures.

Jack came home to a World Wide Web made entirely of words. "Where are the cool flames?" he asked. "Where is the spinning globe?" The Blobbit burped, and a tiny animated GIF of a flame came out and sat on the desk, flickering.

Dave came round and said he could fix it. Dave said this about everything. He opened the case with a spoon. The Blobbit looked at Dave. Dave looked at the Blobbit. "He's got my cheat codes in him," said Dave, quietly. "ALL of them."

In the end Gubbinz climbed in, had a word, and the Blobbit gave the Internet back in exchange for a biscuit. The pictures came back one line at a time, the way pictures do on a 56K modem, from the top. Jack said that was the best part anyway.

The flame GIF is still on the desk. Nobody has the heart to close it.`],
    ['Floppy', 'PixelPriya', 'G', `My name is A:\\. I am a floppy disk. I hold 1.44 megabytes, which is quite a lot, thank you, whatever the CD-ROM says.

I have been many things. I was a homework. I was a saved game, three levels in. I was a letter to a pen pal that never got printed. Today I am "STUFF.DOC", and I don't know what's in me, because I can't read myself. Only the drive can read me, and the drive is busy making its noise.

The CD-ROM says I am old. The CD-ROM holds 650 megabytes and cannot be written on, so what does it know. I can be written on hundreds of times. I have a little tab you can slide to make me read-only, like a secret. I have a metal door that goes "shk".

Tonight the boy will write something on me and put me in his bag and tomorrow I will be in a different computer in a different room and a teacher will say "Oh, you brought it on a disk, well done." That is my purpose. That is what I'm for.

Do not put a magnet near me. Do not put me on the radiator. Do not bend me. I am not the bendy kind. The bendy kind are dead now.`],
    ['Year Zero Zero', '{kidY2k}', 'PG', `11:59pm. 31st December 1999.

{kidY2k} stood in the shed with the torch under {kidY2k.his} chin, which is the correct way to hold a torch when something is about to happen. Twenty-four tins of spaghetti hoops stood behind {kidY2k.him} like an army.

"Ten," said the radio. It was a wind-up radio. {kidY2k} had wound it. "Nine."

In the house, the lights were on. Mom was watching the telly with a glass of something. Dad had fallen asleep. The microwave clock said 23:59 and knew nothing of the danger.

"Three. Two. One."

Nothing happened.

Then, slowly, with enormous dignity, the microwave clock rolled over to 00:00. The video recorder, which had said 00:00 since 1994, continued to say 00:00. {kidY2k} waited. A firework went off somewhere. Somebody in the next street cheered.

{kidY2k} opened a tin of hoops, cold, with Nan's tin opener, and ate them in the dark, and decided that being ready for something that didn't happen was still being ready, and that this was, in its own way, a victory.

The torch batteries ran out at 00:04.`],
    ['The Robot Who Could Only Say "Done"', '{club2}', 'G', `In the corner of the browser lived a small program whose only job was to say "Done" at the bottom of the screen when a page had finished loading.

It said it hundreds of times a day. "Done." "Done." "Done." It never got to say anything else. It watched the pages go by: a page about Pocket Critters, a page about a hamster, a page that was nothing but a yellow sign. "Done," it said to each of them, meaning: I saw you, you made it, well done.

One day a page did not finish loading. The boy's mom had picked up the phone. The little program waited at "Opening page..." and then at "(1 item remaining)" and then nothing. It wanted very badly to say "Done". It could not. It was not done.

It waited all through tea. It waited while the boy did his homework. At 8pm the boy came back, pressed Refresh, and the page came in all at once, the picture from the top down, the counter ticking up by one.

"Done," said the program.

And meant it more than it had ever meant anything.`],
    ['Mr Tiddles Defends the Title', 'Dave', 'G', `The crowd (a beanbag) went wild. Mr Tiddles entered the ring (the bed) in the usual way: he was already there, asleep.

His opponent, The Duvet, climbed the top rope (the headboard). "TONIGHT," said The Duvet, "THE CHAMPIONSHIP CHANGES HANDS."

Mr Tiddles opened one eye.

The Duvet leapt. For a moment he was in the air, magnificent, a wrestler, a legend. Then Mr Tiddles stood up and moved six inches to the left, and The Duvet landed on nothing, and then on the floor.

"ONE," said the referee (Jack). "TWO. THREE."

Mr Tiddles sat on the belt, which was made of a cereal box, and began to wash his face. The crowd (a beanbag) could not believe it. The Duvet, from the floor, said something that has been edited out of this story.

Thirty-two wins. Zero losses. The Furry Fury has never once tried.`],
  ]);
  W.STORIES = STORIES;
  def('fanfic', {
    css: `.wp-fanfic{background:#f3ead6 ${tile('<path d="M0 24h48" stroke="#d8ccb0" stroke-width="1"/>', 48, 24)};color:#2a2010;font:15px/1.6 Georgia,"Times New Roman",serif}
.wp-fanfic .ff-wrap{max-width:660px;margin:0 auto;background:#fffdf5;border:1px solid #9a8a60;padding:14px 20px;box-shadow:3px 3px 0 #9a8a60}
.wp-fanfic h1{font:bold 30px Georgia,serif;text-align:center;margin:0 0 2px;letter-spacing:1px}
.wp-fanfic .fa-sub{text-align:center;font-style:italic;color:#6a5a30}
.wp-fanfic .fa-list{list-style:none;padding:0;margin:12px 0}
.wp-fanfic .fa-list li{padding:6px 4px;border-bottom:1px dotted #9a8a60;display:flex;gap:8px;flex-wrap:wrap;align-items:baseline}
.wp-fanfic .fa-list a{font-weight:bold;font-size:16px;color:#5a1a00}
.wp-fanfic .fa-rt{font:bold 10px Arial,sans-serif;background:#5a1a00;color:#fff;padding:1px 5px;border-radius:3px}
.wp-fanfic .fa-story{display:none;background:#fff;border:2px solid #5a1a00;padding:10px 18px;margin:10px 0}
.wp-fanfic .fa-story.on{display:block}
.wp-fanfic .fa-story pre{white-space:pre-wrap;font:15px/1.65 Georgia,serif;margin:0}
.wp-fanfic .fa-story h3{margin:0;font:bold 20px Georgia,serif}
.wp-fanfic .fa-by{color:#6a5a30;font-style:italic;margin-bottom:8px}
.wp-fanfic .fa-rules{font-size:13px;background:#f0e8d0;padding:8px 12px;border-left:4px solid #5a1a00}
.wp-fanfic a{color:#5a1a00}.wp-fanfic .wgb{background:#fffdf5;border-color:#5a1a00}.wp-fanfic .wgb-head{background:#5a1a00;font-family:Georgia,serif}`,
    html: c => `<div class="ff-wrap"><h1>The Fan-Fiction Archive</h1><div class="fa-sub">Original stories by JackNet readers, about JackNet things. Reading time: one bus journey each.</div>
<div class="fa-rules"><b>Archive rules:</b> 1. Original characters only (our ones, not the telly ones). 2. Keep it G or PG. 3. No killing Gubbinz. 4. Dave is allowed to lose. Dave is always allowed to lose.</div>
<ul class="fa-list">${STORIES.map((s, i) => `<li><a href="#" data-s="${i}">${esc(s[0])}</a> <span class="small">by ${esc(s[1])}</span> <span class="fa-rt">${s[2]}</span> <span class="small">${s[3].split(/\s+/).length} words</span></li>`).join('')}</ul>
${STORIES.map((s, i) => `<div class="fa-story" data-s="${i}"><h3>${esc(s[0])}</h3><div class="fa-by">by ${esc(s[1])} &middot; rated ${s[2]}</div><pre>${esc(s[3])}</pre><p class="c"><a href="#" data-close="1">[ back to the list ]</a></p></div>`).join('')}
<p class="small">Want to send a story? Write it in Jotpad, save it as .TXT, and attach it to a letter on ${c.go('letters', "Jack's letters page")}. Or just post the first line in the guestbook and let someone else finish it. That's how "The Blobbit Who Ate the Internet" started.</p>
<p class="c">Readers: ${c.counter('roman')} <span class="small">(in Roman numerals. It's a LIBRARY.)</span></p>
${c.gb([['Pixel{club4.first}', c.daysAgo(2), 'the "Done" one made me go quiet for a bit', 5], ['Dave', c.daysAgo(3), 'MY story is the best one. it is TRUE. he really did move six inches', 5], ['{kidY2k}', c.daysAgo(6), 'mine is NOT fiction. it is a FORECAST.', 4]], { title: 'Reviews &amp; story starters', ph: 'Review a story, or write the first line of a new one...' })}
<p class="c small">${c.a('poetree', 'poems')} &middot; ${c.a('ascii', 'art made of letters')} &middot; ${c.a('~zed', 'film reviews')} &middot; ${c.a('~dave', 'BCW (the real thing)')}</p>
${c.ring()}</div>`,
    setup(el) {
      const list = el.querySelector('.fa-list');
      el.querySelectorAll('[data-s]').forEach(a => { if (a.tagName !== 'A') return; a.addEventListener('click', ev => { ev.preventDefault(); el.querySelectorAll('.fa-story').forEach(s => s.classList.toggle('on', s.dataset.s === a.dataset.s)); list.style.display = 'none'; el.querySelector('.fa-story.on').scrollIntoView({ block: 'start', behavior: 'smooth' }); Sound.play('turn'); }); });
      el.querySelectorAll('[data-close]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); el.querySelectorAll('.fa-story').forEach(s => s.classList.remove('on')); list.style.display = ''; list.scrollIntoView({ block: 'start', behavior: 'smooth' }); }));
    },
  });

  // ---------------------------------------------------------------- ascii: the gallery
  const ART = [
    ['Cat', ' /\\_/\\\n( o.o )\n > ^ <\n /| |\\\n(_| |_)'],
    ['Rocket', '    /\\\n   /  \\\n  | () |\n  |    |\n /| JK |\\\n/_|____|_\\\n  /_/\\_\\\n   ^^^^'],
    ['Robot', '    _|_\n  [ o o ]\n  |  -  |   BEEP BOOP\n /|=====|\\\n  |_____|\n   || ||\n  [_] [_]'],
    ['Blobbit', '   .---.\n  / o o \\\n |  \\_/  |  BOING\n |       |\n  \\_____/\n   U   U'],
    ['Floppy disk', ' ______________\n|  __________  |\n| |    1.44  | |\n| |__________| |\n|   ________   |\n|  |   __   |  |\n|__|__|__|__|__|'],
    ['Modem', ' ___________________\n|  o o o o o o  56K |\n|___________________|\n   SCREEEEE-BEEP'],
    ['The Y2K Bug', '   \\ | /\n  --(oo)--   00 00 00\n   /|\\/|\\\n  ..  \\\\  ..\n   NOT COMPLIANT'],
    ['{hamster}', '  (\\_/)\n  (o.o)  <-- hamster\n  (> <)      (cam)\n  (")(")'],
    ['Gubbinz (small)', '  ,-.\n (o o)  hello!\n  >v<\n  /|\\\n  / \\'],
  ];
  def('ascii', {
    css: `.wp-ascii{background:#000;color:#aaa;font:13px/1.2 "Courier New",monospace}
.wp-ascii h1{font:bold 14px "Courier New",monospace;color:#0f0;white-space:pre;text-align:center;margin:0 0 8px;line-height:1.1;overflow:auto}
.wp-ascii .ac-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.wp-ascii .ac-art{background:#050505;border:1px solid #333;padding:8px}
.wp-ascii .ac-art b{color:#ff0;display:block;margin-bottom:4px}
.wp-ascii pre{margin:0;color:#fff;font:13px/1.15 "Courier New",monospace;white-space:pre;overflow:auto}
.wp-ascii .ac-ban{background:#050505;border:1px solid #0f0;padding:10px;margin:14px 0}
.wp-ascii .ac-ban input{background:#000;color:#0f0;border:1px solid #0f0;font:13px "Courier New",monospace;width:200px;max-width:100%}
.wp-ascii .ac-out{color:#0f0;overflow:auto;margin-top:8px;font-size:11px;line-height:1.05}
.wp-ascii a{color:#ff0}.wp-ascii .wgb{background:#050505;color:#aaa;border-color:#0f0}.wp-ascii .wgb-head{background:#030}.wp-ascii .wgbe-h b{color:#0f0}.wp-ascii .wgbe-t{font-family:"Courier New",monospace}`,
    html: c => `<h1> _    ___  ___  ___  ___      _    ___  _____
/ \\  / __|/ __||_ _||_ _|    /_\\  | _ \\|_   _|
| || \\__ \\\\__ \\ | |  | |    / _ \\ |   /  | |
|_|_||___/|___/|___||___|  /_/ \\_\\|_|_\\  |_|   G A L L E R Y</h1>
<p class="c">Art made out of LETTERS. Works on any computer, even the school ones. Even on PAPER. Select it, copy it, put it in your e-mail signature. (Use a font where all the letters are the same width or it goes wonky.)</p>
<div class="ac-grid">${ART.map(([n, a]) => `<div class="ac-art"><b>${esc(n)}</b><pre>${esc(a)}</pre></div>`).join('')}</div>
<div class="ac-ban"><b>BANNER MAKER</b> - type a word, get it BIG. (Letters, numbers and spaces. Max 10.)<br><input type="text" class="ac-in" maxlength="10" value="JACKNET" aria-label="Banner text"> <button class="btn ac-go" type="button">Make it!</button><pre class="ac-out"></pre></div>
<p class="c">Artists and copiers: ${c.counter('plain')}</p>
${c.gb([['Pixel{club4.first}', c.daysAgo(1), 'the floppy disk one is PERFECT. printing it. (not at club, {teacher.sir})', 5], ['Gubbinz', c.daysAgo(3), 'the robot wun looks like my uncle', 4], ['Jack', c.daysAgo(5), 'who made the Y2K bug one. its brilliant. its horrible. its brilliant', 5]], { title: 'SIGN IN ASCII', ph: 'Leave some art! (it keeps the spaces)' })}
<p class="c small">${c.a('computerclub', 'Computer Club')} &middot; ${c.a('fanfic', 'stories')} &middot; ${c.a('~mek', 'painting tips')} &middot; ${c.a('hamstercam', 'the real {hamster}')}</p>
${c.ring()}`,
    setup(el) {
      // a tiny 5x5 bitmap font for the banner maker
      const F = { A: '01110,10001,11111,10001,10001', B: '11110,10001,11110,10001,11110', C: '01111,10000,10000,10000,01111', D: '11110,10001,10001,10001,11110', E: '11111,10000,11110,10000,11111', F: '11111,10000,11110,10000,10000', G: '01111,10000,10011,10001,01111', H: '10001,10001,11111,10001,10001', I: '11111,00100,00100,00100,11111', J: '00111,00010,00010,10010,01100', K: '10001,10010,11100,10010,10001', L: '10000,10000,10000,10000,11111', M: '10001,11011,10101,10001,10001', N: '10001,11001,10101,10011,10001', O: '01110,10001,10001,10001,01110', P: '11110,10001,11110,10000,10000', Q: '01110,10001,10101,10010,01101', R: '11110,10001,11110,10010,10001', S: '01111,10000,01110,00001,11110', T: '11111,00100,00100,00100,00100', U: '10001,10001,10001,10001,01110', V: '10001,10001,10001,01010,00100', W: '10001,10001,10101,11011,10001', X: '10001,01010,00100,01010,10001', Y: '10001,01010,00100,00100,00100', Z: '11111,00010,00100,01000,11111', '0': '01110,10011,10101,11001,01110', '1': '00100,01100,00100,00100,01110', '2': '01110,10001,00110,01000,11111', '3': '11110,00001,00110,00001,11110', '4': '10010,10010,11111,00010,00010', '5': '11111,10000,11110,00001,11110', '6': '01110,10000,11110,10001,01110', '7': '11111,00010,00100,01000,01000', '8': '01110,10001,01110,10001,01110', '9': '01110,10001,01111,00001,01110', '!': '00100,00100,00100,00000,00100', ' ': '00000,00000,00000,00000,00000' };
      const out = el.querySelector('.ac-out'), inp = el.querySelector('.ac-in');
      const make = () => { const s = inp.value.toUpperCase().replace(/[^A-Z0-9! ]/g, '').slice(0, 10) || 'HI'; const rows = ['', '', '', '', '']; for (const ch of s) { const g = (F[ch] || F[' ']).split(','); for (let r = 0; r < 5; r++) rows[r] += g[r].replace(/1/g, ch === ' ' ? ' ' : '#').replace(/0/g, ' ') + '  '; } out.textContent = rows.join('\n'); Sound.play('click'); };
      el.querySelector('.ac-go').addEventListener('click', make); inp.addEventListener('keydown', e => { if (e.key === 'Enter') make(); }); make();
    },
  });

  // ---------------------------------------------------------------- midi: MIDI Heaven
  def('midi', {
    css: `.wp-midi{background:#000080 ${tile('<text x="4" y="22" font-size="18" fill="#1a1a9a">&#9835;</text><text x="24" y="38" font-size="12" fill="#15158a">&#9834;</text>', 44)};color:#fff;font:14px/1.45 Arial,sans-serif}
.wp-midi h1{font:bold 40px "Comic Sans MS",cursive;text-align:center;color:#ff0;text-shadow:3px 3px #000;margin:4px 0}
.wp-midi .md-list{max-width:560px;margin:12px auto;background:#c0c0c0;color:#000;border:3px outset #fff;padding:8px}
.wp-midi .md-row{display:flex;align-items:center;gap:8px;padding:4px;border-bottom:1px solid #888;flex-wrap:wrap}
.wp-midi .md-row:last-child{border:0}
.wp-midi .md-row .wmidi{flex:1 1 260px}
.wp-midi .md-row .md-by{font-size:11px;color:#333;flex:1 1 120px}
.wp-midi .md-mom{text-align:center;background:#ff0;color:#000;font-weight:bold;padding:6px;max-width:560px;margin:10px auto;border:3px dashed #f00}
.wp-midi .md-done{color:#0f0;font-weight:bold}
.wp-midi a{color:#ff0}.wp-midi .wgb{color:#000;border-color:#ff0}`,
    html: c => `<h1>&#9835; MIDI HEAVEN &#9835;</h1>
<p class="c"><marquee scrollamount="5" behavior="alternate">&#9834; THIS PAGE IS NOTHING BUT MIDI &#9834; EVERY TUNE ON JACKNET IN ONE PLACE &#9834; TURN IT UP &#9834;</marquee></p>
<div class="md-mom">WARNING: Mom says if she hears "that bleepy one" one more time she is cutting the wire. The wire is the phone line. Choose wisely.</div>
<p class="c">Every tune on here is <b>original</b>, made by the person it says, on a keyboard or in a tracker, not nicked off a CD. That's the rule. (The Blockology one on ${c.a('tetris', "Jack's shrine")} is a very old folk song, so that's allowed too.) Play all ${W.TUNES.length} and you are a MIDI MANIAC.</p>
<div class="md-list">${W.TUNES.map(([t, f]) => `<div class="md-row">${c.midi(t, f)}<span class="md-by">${esc({ 'web-dave': "Dave (Mr Tiddles's entrance)", 'web-kim': '{cousin} ({cousin.his} own pop song)', 'web-knit': "Jack, for Mom'z club", 'web-band': 'The Mouldy Tangerines', 'web-gaz': '{kidY2k} (bunker alarm)', 'web-space': "{club2}'s space page", 'web-hamster': '{hamster} the hamster (Jack)', 'web-parcel': 'Pass the Parcel', 'web-saga': "{kidEp1}'s countdown page", 'web-pod': 'Peapodracing HQ', 'web-lift': 'Gem Exchange hold music', 'web-sad': "{kidSoon}'s page (unfinished)", 'web-nan': "Nan's kitchen", 'web-rave': 'bedroom rave (Jack)', 'web-cube': 'cube records', 'web-block': 'the other block shrine' }[t] || 'JackNet')}</span></div>`).join('')}</div>
<p class="c md-prog">Played: <b class="md-n">0</b> / ${W.TUNES.length} <span class="md-done"></span></p>
<p class="c">Listeners: ${c.counter('odo')}</p>
${c.gb([['{cousin}', c.daysAgo(1), 'mine is the best one obviously', 5], ['{kidBand}', c.daysAgo(2), 'ours is the loudest one which is the same as best', 4], ['Mom', c.daysAgo(2), 'THE WIRE.', 1]], { title: 'Requests', ph: 'Which one is your favourite? Requests?' })}
<p class="c small">More music: ${c.a('jackamp', 'JackAmp')} &middot; ${c.a('grotdance', 'The Gubbinz Dance')} &middot; ${c.a('~stu', 'the band')} &middot; ${c.a('~kim', '{cousin}')}</p>
${c.ring()}`,
    setup(el, c) {
      let played = {}; try { played = JSON.parse(localStorage.getItem('jhp_web_midi') || '{}'); } catch (e) {}
      const n = el.querySelector('.md-n'), done = el.querySelector('.md-done');
      const upd = () => { const k = Object.keys(played).length; n.textContent = k; if (k >= W.TUNES.length) { done.textContent = 'MIDI MANIAC!!!'; c.secret('web.midi'); } };
      upd();
      el.addEventListener('wmidi', ev => { played[ev.detail] = 1; try { localStorage.setItem('jhp_web_midi', JSON.stringify(played)); } catch (e) {} upd(); });
    },
  });
})();
