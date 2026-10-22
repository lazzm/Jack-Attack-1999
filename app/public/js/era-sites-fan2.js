/* era-sites-fan2: more 1999 fan sites.
 *  www.holohut.kidz      THE HOLO HUT: Pocket Monster card swap guide (Base Set, Jungle, and Fossil from 10 Oct), live swap board
 *  www.houserobots.cyb   HOUSE ROBOT HQ: unofficial Robot Wars fan site + build-a-robot arena fight
 *  www.year3000.cyb      GOOD NEWS EVERYONE!: a Futurama fan page (US facts only; countdown to Fry's freezing)
 *  www.jackfax.jnet      JACKFAX: teletext on the Internet (P100 index, P302 football, P150 quiz, hidden pages) */
(function () {
  'use strict';
  const ES = window.EraSites, A = window.Apps, esc = ES.esc, store = ES.store;

  // ================================================================ THE HOLO HUT
  const HH = 'www.holohut.kidz', HU = p => 'http://' + HH + p;
  ES.css('holo', `
.hh{background:#ffe95a;color:#000;font:13px/1.4 Verdana,Arial,sans-serif;padding-bottom:6px}
.hh a{color:#0033aa;font-weight:bold}
.hh-top{background:linear-gradient(#3a6ad8,#1a3aa8);color:#ffe95a;text-align:center;padding:10px;border-bottom:4px solid #e10600}
.hh-top b{display:block;font:bold 32px "Arial Black",Arial,sans-serif;letter-spacing:1px;text-shadow:3px 3px 0 #1a2a6a,-1px -1px 0 #fff}
.hh-nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:6px;background:#fff6b0;border-bottom:2px solid #d8b800}
.hh-nav a{background:#e10600;color:#fff!important;padding:3px 10px;border-radius:10px;text-decoration:none;font-size:12px}
.hh-in{max-width:760px;margin:0 auto;padding:10px}
.hh-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.hh-c{background:#fff;border:2px solid #000;border-radius:6px;padding:6px;display:flex;gap:6px;align-items:center;cursor:pointer;text-align:left;font:12px Verdana,sans-serif;color:#000}
.hh-c svg{width:40px;height:54px;flex:none}
.hh-c b{display:block}
.hh-c .sv{color:#c00;font-size:11px}
.hh-c.shiny{animation:hhshine 1s linear infinite}
@keyframes hhshine{50%{box-shadow:0 0 12px #f0f,0 0 4px #0ff}}
.hh-note{background:#fff;border:2px dashed #e10600;padding:8px;margin:10px 0}
`);
  const TYPECOL = { Fire: '#e8582a', Water: '#3a8ae8', Grass: '#3aa83a', Lightning: '#f0d020', Psychic: '#a050c8', Fighting: '#b06030', Colorless: '#d8d8d0' };
  const SETS = {
    base: ['Base Set', '09-01', 102, 'Alakabam:Psychic Blastoise:Water Chansey:Colorless Charizard:Fire Clefairy:Colorless Gyarados:Water Hitmonchan:Fighting Machamp:Fighting Magneton:Lightning MewToo:Psychic Nidoking:Grass Ninetales:Fire Poliwrath:Water Raichu:Lightning Venusaur:Grass Zapdos:Lightning'],
    jungle: ['Jungle', '06-16', 64, 'Clefable:Colorless Electrode:Lightning Flareon:Fire Jolteon:Lightning Kangaskhan:Colorless Mr.Mime:Psychic Nidoqueen:Grass Pidgeot:Colorless Pinsir:Grass Scyther:Grass Snorlax:Colorless Vaporeon:Water Venomoth:Grass Victreebel:Grass Vileplume:Grass Wigglytuff:Colorless'],
    fossil: ['Fossil', '10-10', 62, 'Aerodactyl:Fighting Articuno:Water Ditto:Colorless Dragonite:Colorless Gengar:Psychic Haunter:Psychic Hitmonlee:Fighting Hypno:Psychic Kabutops:Fighting Lapras:Water Magneton:Lightning Moltres:Fire Muk:Grass Raichu:Lightning Zapdos:Lightning'],
  };
  const SWAP = { Charizard: '50 commons AND your bike (Dave tried)', Blastoise: '30 commons', Venusaur: '25 commons', Mewtwo: '25 commons + a Mars bar', Zapdos: '15 commons', Chansey: '10 commons', Machamp: '4 commons (everyone has one)', Gyarados: '20 commons', Alakazam: '18 commons', Raichu: '15 commons', Snorlax: '15 commons', Scyther: '20 commons', Dragonite: '30 commons', Gengar: '25 commons', Moltres: '20 commons', Articuno: '20 commons', Ditto: '12 commons', Clefairy: '8 commons', 'Mr.Mime': '10 commons', Vaporeon: '14 commons', Jolteon: '14 commons', Flareon: '14 commons', Lapras: '16 commons', Aerodactyl: '16 commons', Kabutops: '12 commons' };
  const card = (name, type) => `<svg viewBox="0 0 40 54" aria-hidden="true"><rect x="1" y="1" width="38" height="52" rx="3" fill="#f8d030" stroke="#000"/><rect x="4" y="4" width="32" height="46" rx="2" fill="${TYPECOL[type]}"/><rect x="6" y="9" width="28" height="18" fill="url(#hhg${type})" stroke="#000" stroke-width=".6"/><defs><linearGradient id="hhg${type}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#bff"/><stop offset=".7" stop-color="#fbf"/><stop offset="1" stop-color="#ffb"/></linearGradient></defs><circle cx="20" cy="18" r="6" fill="${TYPECOL[type]}" stroke="#000" stroke-width=".6"/><rect x="6" y="30" width="28" height="3" fill="#fff" opacity=".8"/><rect x="6" y="36" width="20" height="2" fill="#fff" opacity=".6"/><rect x="6" y="40" width="24" height="2" fill="#fff" opacity=".6"/><text x="6" y="7.5" font-size="4" font-family="Arial" font-weight="bold">${esc(name.slice(0, 11))}</text></svg>`;
  const hhPage = (c, body) => `<div class="hh"><div class="hh-top"><b>THE HOLO HUT</b>Pocket Monster card swaps, values and fakes. Est. 1999. Gotta swap 'em all!</div><div class="hh-nav"><a href="${HU('/')}">Home</a><a href="${HU('/base.html')}">Base Set</a><a href="${HU('/jungle.html')}">Jungle</a><a href="${HU('/fossil.html')}">Fossil</a><a href="${HU('/fakes.html')}">Spot a Fake</a><a href="${HU('/swap.html')}">Swap Board</a></div><div class="hh-in">${body}</div>${c.foot({ ctrText: 'Trainers visited:', ctrAfter: '', best: 'Best viewed with a shiny card in your hand' })}</div>`;
  const out = (c, s) => ES.mdOf(SETS[s][1]) <= c.md;
  ES.def(HH, '/', c => hhPage(c, `<p><b>Welcome, Trainer!</b> The Holo Hut is the place for swap values for every HOLO (the shiny ones) in the card game. Prices are in <b>commons</b>: how many normal cards people in our playground will swap you for one holo. (We don't do real money. Real money is for sweets.)</p>
    <ul><li><a href="${HU('/base.html')}">Base Set</a>: ${SETS.base[2]} cards, 16 holos. Out in English since 9 January 1999.</li><li>${out(c, 'jungle') ? `<a href="${HU('/jungle.html')}">Jungle</a>: ${SETS.jungle[2]} cards, 16 holos. Out in English since 16 June 1999.` : 'Jungle: the next set. Coming in June (in America first). Can\'t wait.'}</li><li>${out(c, 'fossil') ? `<a href="${HU('/fossil.html')}">Fossil</a>: ${SETS.fossil[2]} cards, 15 holos. Brand new: out in English since 10 October 1999!` : 'Fossil: the third set. Rumoured for later this year. Ghost types!!!'}</li></ul>
    <div class="hh-note"><b>HOLO HUT RULES:</b> Never swap a card you want back. Never swap with someone who says "trust me". Always check for fakes (see <a href="${HU('/fakes.html')}">Spot a Fake</a>). If a teacher bans them, put them AWAY. (Ours are in a shoebox.)</div>
    <p>Links: <a href="http://www.pokefacts.kidz/">${Cast.n('kidPoke')}'s Pocket Critters Facts Page</a> &middot; <a href="http://www.jackfaqs.w3b/faq/pokemon-rb.txt">Red/Blue FAQ</a> &middot; <a href="http://www.jackbay.webcom/">JackBay</a> (no cards there yet)</p>`));
  const setPage = s => c => {
    if (!out(c, s)) return hhPage(c, `<h2>${SETS[s][0]}</h2><p>This set isn't out in English yet! Check back soon. In the meantime, here's a picture of my empty binder: [ ] [ ] [ ]</p>`);
    c.after.push(() => c.qa('.hh-c').forEach(el => el.addEventListener('click', () => { const n = el.dataset.n; c.sfx('click'); if (n === 'Charizard') { c.secret('eras.holo'); el.classList.add('shiny'); Desk.msgbox('THE HOLO HUT', 'CHARIZARD!!!\n\nThe card EVERYONE wants. Fire type. Big orange dragon. Breathes fire on everything.\n\nSwap value: 50 commons AND your bike.\n\nNobody in our school has one. Dave says his cousin has one. Dave\'s cousin says he does not.', 'info'); } else c.toast('The Holo Hut', `${n}: ${SWAP[n] || (8 + ES.hash(n) % 10) + ' commons'}.`, 4000); })));
    return hhPage(c, `<h2>${SETS[s][0]} Holos</h2><p>${SETS[s][2]} cards in the set. Here are the holos. Click one for its swap value.</p><div class="hh-cards">${SETS[s][3].split(' ').map(p => { const [n, t] = p.split(':'); return `<button type="button" class="hh-c" data-n="${n}">${card(n, t)}<span><b>${n.replace('.', '. ')}</b>${t} type<br><span class="sv">${esc(SWAP[n] || (8 + ES.hash(n) % 10) + ' commons')}</span></span></button>`; }).join('')}</div>`);
  };
  ['base', 'jungle', 'fossil'].forEach(s => ES.def(HH, '/' + s + '.html', setPage(s)));
  ES.def(HH, '/fakes.html', c => hhPage(c, `<h2>How to Spot a Fake</h2><ol><li><b>Spelling.</b> If it says PIKACHOO, CHARIZRAD or "Psycic", it is a fake.</li><li><b>Flimsy.</b> Real cards are stiff. Fakes bend like a crisp packet.</li><li><b>Blurry.</b> The picture looks like it was photocopied in a hurry (it was).</li><li><b>The back.</b> Fake backs are often the wrong shade of blue.</li><li><b>The HP.</b> If a Caterpie has 400 HP, something is wrong.</li><li><b>The price.</b> A whole binder of holos for 50p at the market = fakes.</li></ol><p>If you got a fake: don't swap it to someone else! That's what a fake would do.</p>`));
  ES.def(HH, '/swap.html', c => hhPage(c, `<h2>The Swap Board (live!)</h2><p>Post what you HAVE and what you WANT. Then sort it out in the playground (with a grown-up watching). Never post your address or school!</p>` + c.gb([['Ash_Wannabe', '20/10/99', 'HAVE: 3 Machamp. WANT: anything that is not Machamp.'], ['CardShark', '15/10/99', 'HAVE: Gengar (Fossil, holo!!!) WANT: Charizard. Yes I know.']], { k: 'eras.gb.holoswap', title: 'Haves &amp; Wants', btn: 'Post it!', ph: 'HAVE: ... WANT: ...' })));

  // ================================================================ HOUSE ROBOT HQ
  const RB = 'www.houserobots.cyb', RU = p => 'http://' + RB + p;
  ES.css('robot', `
.rb{background:#2a2a2a repeating-linear-gradient(45deg,#2e2e2e 0 6px,#262626 6px 12px);color:#eee;font:13px/1.45 Arial,Helvetica,sans-serif}
.rb a{color:#ffd400}
.rb-top{background:repeating-linear-gradient(-45deg,#ffd400 0 18px,#111 18px 36px);padding:8px}
.rb-top div{background:#111;text-align:center;padding:8px;border:3px solid #888}
.rb-top b{display:block;font:bold 30px Impact,"Arial Black",sans-serif;color:#e10600;letter-spacing:2px;text-shadow:2px 2px 0 #fff}
.rb-nav{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px}
.rb-nav a{background:linear-gradient(#888,#444);color:#fff!important;border:2px outset #aaa;padding:3px 12px;text-decoration:none;font-weight:bold;font-size:12px}
.rb-in{max-width:760px;margin:0 auto;padding:10px}
.rb-hr{display:flex;gap:12px;align-items:flex-start;background:#111;border:2px solid #555;padding:10px;margin:10px 0;flex-wrap:wrap}
.rb-hr h3{margin:0;color:#ffd400;font:bold 20px Impact,Arial,sans-serif;letter-spacing:1px}
.rb-hr .pic{background:#444;border:2px inset #777;padding:4px}
.rb-hr > div:last-child{flex:1;min-width:200px}
.rb-form{background:#111;border:2px solid #555;padding:10px;display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center}
.rb-form select,.rb-form input{font:13px Arial,sans-serif;max-width:100%}
.rb-log{background:#000;color:#0f0;font:13px "Courier New",monospace;padding:8px;min-height:160px;border:2px inset #555;margin-top:10px;white-space:pre-wrap}
`);
  const HR = [
    ['SIR KILLALOT', 'The biggest, heaviest house robot of them all, new for the second series. Tracks, a massive lance and a hydraulic claw that can pick a whole robot up and carry it off. Usually towards the flames.', ['.......SSSS.........', '......SssssS........', '......SRrrRS........', '.......SSSS.........', '...SSSSSSSSSSS......', '..SsssssssssssS.....', 'SSSsssssssssssSswwww', 'S.SsssSSSSsssssS....', 'SSSsssssssssssS.....', '...SSSSSSSSSSSS.....', '..zzzzzzzzzzzzzz....', '.zkSkSkSkSkSkSkkz...', '..zzzzzzzzzzzzzz....'], 'Lance, claw, BIG'],
    ['MATILDA', 'The only lady among the house robots. A dinosaur-shaped robot with tusks at the front for flipping and a chainsaw on the back. Do not get in front of her. Do not get behind her either.', ['..............gg....', '.............ggrg...', '.....gggggggggggggg.', '...gGgGgGgGgggggggww', 'sssggggggggggggggw.w', 'zszgggggggggggggg...', 'sssGGGGGGGGGGGGGG...', '...GGGGGGGGGGGGGG...', '...zzzzzzzzzzzzzz...', '...kzkzkzkzkzkzkz...'], 'Tusks, chainsaw'],
    ['SHUNT', 'A big yellow-and-black bulldozer of a robot with a scoop at the front and an axe. Shunt likes to shove robots into the pit, then wave the axe about a bit.', ['.........sss........', '.........ssB........', '...........B........', '...........B........', '..yyyyyyyyyyyy......', '..ykkykkykkyyy......', '..yyyyyyyyyyyy.ss...', '..kykkykkykkyysss...', '..yyyyyyyyyyyyssss..', '..zzzzzzzzzzzzzsssss', '..zkzkzkzkzkzkz.....'], 'Axe, scoop'],
    ['DEAD METAL', 'Silver, low and mean, with a circular saw and a pair of big pincers. He holds you still with the pincers and then the saw comes down. Sparks everywhere.', ['......SSS...........', '.....SsSsS..........', '.....SSkSS..........', '......SSS...........', '.......S............', '...sssssssssss.ss...', '..sSSSSSSSSSSSs..s..', '..sSSrSSSSSrSSsss...', '..sSSSSSSSSSSSs..s..', '...zzzzzzzzzzz.ss...', '...kzkzkzkzkzk......'], 'Saw, pincers'],
    ['SGT BASH', 'Sgt Bash has a flamethrower and a crusher on the front, and a spinning lamp on his head. He is the one who sets your robot on fire. Shouting "WATCH OUT" does not help.', ['........oo..........', '........rr..........', '..GGGGGGGGGGGG......', '.GgggggggggggG......', '.GgdgdgdgdgggGsss...', '.GgggggggggggGs.oyo.', '.GgggggggggggGsssroy', '.GGGGGGGGGGGGGsss...', '..zzzzzzzzzzzz......', '..kzkzkzkzkzkz......'], 'Flamethrower, crusher'],
  ];
  const rbPage = (c, body) => `<div class="rb"><div class="rb-top"><div><b>HOUSE ROBOT HQ</b>The UNOFFICIAL fan site for Robo Rumble, the best thing on BBC Two</div></div><div class="rb-nav"><a href="${RU('/')}">Home</a><a href="${RU('/house.html')}">House Robots</a><a href="${RU('/arena.html')}">The Arena</a><a href="${RU('/champs.html')}">Champions</a><a href="${RU('/build.html')}">Build a Robot!</a></div><div class="rb-in">${body}</div>${c.foot({ ctrText: 'Roboteers:', ctrAfter: 'have visited', ctr: 'red', best: 'Best viewed behind the sofa' })}</div>`;
  ES.def(RB, '/', c => {
    const s3 = c.md >= 1203, s2won = c.md >= 305;
    return rbPage(c, `<p style="font-size:15px"><b>3... 2... 1... ACTIVATE!</b> Welcome to House Robot HQ, the fan site for the telly programme where people build robots in their garages and then fight them in an arena full of flames, spikes and house robots.</p>
      <div class="rb-hr"><div><h3>LATEST NEWS</h3>${s3 ? '<p><b>ROBO RUMBLE IS BACK!!!</b> The third series is on BBC Two. New robots! The house robots are back and they are not happy.</p>' : s2won ? '<p>The second series is over and <b>Panic Attack</b> is the champion! Roll on series 3. Start building, roboteers!</p>' : '<p>The second series is on BBC Two right now! Craig Charles is presenting, Philippa Forrester is in the pits with the roboteers, and Sir Killalot is crushing everything.</p>'}</div></div>
      <p>Who is your favourite house robot? Mine is Sir Killalot. Dave's is Sgt Bash because "fire". Mom's is Matilda because "she's the only girl and she's got a chainsaw, good for her".</p>
      <p>Links: <a href="http://www.jackdot.jnet/">Jackdot</a> &middot; <a href="http://megahertzmike.cyb/">Megahertz Mike</a> (he wants to build one) &middot; <a href="http://www.newjacks.wubwub/">NewJacks cartoons</a></p>` + c.gb([['FlipperFan', '12/03/99', 'Panic Attack for the win!!! Lifting forks FOREVER.'], ['Matt_Meccano', '04/12/99', 'BUILT A ROBOT. PAINTED IT RED. RED ONES GO FASTER. IT DOES NOT GO.']], { title: 'Sign the Pit Book', btn: 'Activate!', ph: 'Who is your favourite robot?' }));
  });
  ES.def(RB, '/house.html', c => rbPage(c, `<h2 style="color:#ffd400">THE HOUSE ROBOTS</h2><p>The house robots guard the arena. In a fight they wait in the corners (the CPZs), and if your robot wanders in... good luck.</p>` + HR.map(([n, d, px, w]) => `<div class="rb-hr"><div class="pic">${ES.pix(px, 5)}</div><div><h3>${n}</h3><p>${esc(d)}</p><p><b>Weapons:</b> ${esc(w)}</p></div></div>`).join('')));
  ES.def(RB, '/arena.html', c => rbPage(c, `<h2 style="color:#ffd400">THE ARENA</h2><ul><li><b>CPZs</b> (Corner Patrol Zones): marked squares in the corners where the house robots live. Stay out!</li><li><b>The Pit</b>: a hole in the floor. Push your opponent in and they are OUT. Push yourself in and Dave will never let you forget it.</li><li><b>Flames</b>: fire comes up out of the floor. Sgt Bash brings his own.</li><li><b>Cease!</b>: when the time is up, or a robot is beaten, Craig Charles shouts it and everything stops. Sometimes the house robots do one last crunch first.</li></ul><p>Robots have to fit a weight limit, and every battle is judged if nobody gets knocked out. Fair play.</p>`));
  ES.def(RB, '/champs.html', c => rbPage(c, `<h2 style="color:#ffd400">GRAND CHAMPIONS</h2><table style="border-collapse:collapse"><tr><td style="padding:4px 10px;border:1px solid #555"><b>Series 1</b> (1998)</td><td style="padding:4px 10px;border:1px solid #555">ROAD BLOCK</td></tr><tr><td style="padding:4px 10px;border:1px solid #555"><b>Series 2</b></td><td style="padding:4px 10px;border:1px solid #555">${c.md >= 305 ? 'PANIC ATTACK' : 'still fighting!'}</td></tr>${c.md >= 1203 ? '<tr><td style="padding:4px 10px;border:1px solid #555"><b>Series 3</b></td><td style="padding:4px 10px;border:1px solid #555">on now!</td></tr>' : ''}</table><p>The first series was presented by Jeremy Clarkson. From the second series it's Craig Charles (who was Lister in Red Dork!) with Philippa Forrester.</p>`));
  const BUILD = { shape: { Wedge: 3, Box: 2, 'Dustbin on wheels': 1, Invertible: 4 }, weapon: { Flipper: 4, Axe: 3, Spinner: 3, Crusher: 3, 'Wooden spoon': 0 }, armour: { Cardboard: 0, Aluminium: 2, Steel: 3, Titanium: 4 } };
  ES.def(RB, '/build.html', c => {
    c.after.push(() => {
      const log = c.q('.rb-log'); let busy = false;
      c.on('.rb-go', 'click', () => {
        if (busy) return; busy = true;
        const v = k => c.q('.rb-' + k).value, name = (c.q('.rb-name').value.trim() || 'Unnamed Robot').slice(0, 24);
        const pow = BUILD.shape[v('shape')] + BUILD.weapon[v('weapon')] + BUILD.armour[v('armour')], R = ES.rng(name + Date.now()), score = pow + R() * 6;
        const hr = HR[Math.floor(R() * HR.length)][0];
        const lines = [`3... 2... 1... ACTIVATE!`, `${name} rolls out of its corner!`, v('weapon') === 'Wooden spoon' ? `${name} raises its... wooden spoon. The crowd goes quiet.` : `${name} goes in with the ${v('weapon').toLowerCase()}! Sparks!`, `Oh no, it's wandered into the CPZ. Here comes ${hr}!`,
          score > 9 ? `${name} dodges ${hr}! The crowd goes WILD!` : v('armour') === 'Cardboard' ? `${hr} goes straight through the cardboard. Ouch.` : `${hr} grabs ${name}! This could be the end!`,
          score > 9 ? `${name} drives its opponent into THE PIT!!!` : score > 6 ? `${name} is still moving! Just about!` : `${name} is on fire. That's not ideal.`, 'CEASE!',
          score > 9 ? `WINNER: ${name}! Through to the next round!` : score > 6 ? `It goes to the judges... and they pick ${name}! Phew!` : `${name} is OUT. Back to the garage. Better luck next series!`];
        log.textContent = ''; let i = 0;
        const step = () => { if (i >= lines.length) { busy = false; if (score > 6) { c.secret('eras.robot'); c.sfx('solve'); } else c.sfx('uhoh'); return; } log.textContent += lines[i++] + '\n'; c.sfx('click'); c.later(step, 900); };
        step();
      });
    });
    const sel = (k, o) => `<select class="rb-${k}" aria-label="${k}">${Object.keys(o).map(x => `<option>${x}</option>`).join('')}</select>`;
    return rbPage(c, `<h2 style="color:#ffd400">BUILD A ROBOT!</h2><p>Design your robot, then send it into the arena. Will it survive the house robots?</p><div class="rb-form"><label>Name</label><input class="rb-name" maxlength="24" placeholder="e.g. Chaos Toaster"><label>Shape</label>${sel('shape', BUILD.shape)}<label>Weapon</label>${sel('weapon', BUILD.weapon)}<label>Armour</label>${sel('armour', BUILD.armour)}<span></span><button class="es-btn rb-go" type="button">INTO THE ARENA!</button></div><div class="rb-log" aria-live="polite">Waiting for a robot...</div>`);
  });

  // ================================================================ GOOD NEWS EVERYONE! (Futurama fan page)
  const FU = 'www.year3000.cyb', FUU = p => 'http://' + FU + p;
  ES.css('fut', `
.fu{background:#14002a radial-gradient(circle at 70% 20%,#3a1a6a,#14002a 60%);color:#e8e0ff;font:13px/1.5 Verdana,Arial,sans-serif}
.fu a{color:#7aff7a}
.fu-top{text-align:center;padding:16px 10px 8px}
.fu-top b{display:block;font:bold 30px "Arial Black",Arial,sans-serif;color:#7aff7a;text-shadow:0 0 10px #0f0;letter-spacing:1px}
.fu-in{max-width:700px;margin:0 auto;padding:10px 14px}
.fu-box{background:rgba(0,0,0,.4);border:2px solid #7a5aff;border-radius:10px;padding:10px;margin:10px 0}
.fu-cd{font:bold 22px "Courier New",monospace;color:#ff6;text-align:center}
.fu-crew li{margin:6px 0}
`);
  const fuPage = (c, body) => `<div class="fu"><div class="fu-top"><b>GOOD NEWS, EVERYONE!</b>The Year 3000 Cartoon Page &middot; a Futurama fan site</div><div style="text-align:center"><a href="${FUU('/')}">Home</a> | <a href="${FUU('/crew.html')}">The Crew</a> | <a href="${FUU('/episodes.html')}">Episodes</a></div><div class="fu-in">${body}</div>${c.foot({ ctrText: 'Visitors from the year 1999:', ctrAfter: '', ctr: 'lcd', best: 'Best viewed in the year 3000' })}</div>`;
  ES.def(FU, '/', c => {
    c.after.push(() => { const el = c.q('.fu-cd'); const tick = () => { const t = ES.t99(), n = new Date(), now = new Date(1999, t.m - 1, t.d, n.getHours(), n.getMinutes(), n.getSeconds()), s = Math.max(0, Math.floor((new Date(2000, 0, 1) - now) / 1000)); el.textContent = `${Math.floor(s / 86400)} days ${ES.pad(Math.floor(s / 3600) % 24)}:${ES.pad(Math.floor(s / 60) % 60)}:${ES.pad(s % 60)}`; }; tick(); c.every(tick, 1000); });
    return fuPage(c, `${c.md >= 328 ? '' : '<p class="fu-box"><b>COMING SOON:</b> a new cartoon from the man who made The Simpsocks, set in the year 3000! It starts in America on 28 March.</p>'}<p><b>Futurama</b> is the new cartoon from Matt Groening, the man who made The Simpsocks. It started in America on the Fox channel on <b>28 March 1999</b>. My pen pal in America sends me tapes. The tapes take ages. Worth it.</p>
      <p>It's about <b>Fry</b>, a pizza delivery boy from New York who falls into a freezing machine at midnight on New Year's Eve 1999... and wakes up <b>1,000 years later</b>, on New Year's Eve 2999! He gets a job at a space delivery company called Planet Express, with a one-eyed captain and a robot who bends things.</p>
      <div class="fu-box"><b>COUNTDOWN!</b> Fry gets frozen at midnight on 31/12/1999. That's in:<div class="fu-cd">...</div><small>Stay away from cryogenic freezers on New Year's Eve. Just in case.</small></div>
      <p>See also: <a href="http://www.scifizone.cyb/">${Cast.n('club1')}'s Sci-Fi Zone</a> &middot; <a href="http://www.aintitkoolnews.infobahn/">Ain't It Kool News</a> &middot; <a href="http://millenniumbunker.netz/">${Cast.n('kidY2k')}'s Millennium Bunker</a></p>`);
  });
  ES.def(FU, '/crew.html', c => fuPage(c, `<h2>The Crew</h2><ul class="fu-crew"><li><b>Philip J. Fry</b>: a delivery boy from 1999, now in 2999. Not the sharpest. Very loyal.</li><li><b>Turanga Leela</b>: the captain of the Planet Express ship. One eye. Kicks everything.</li><li><b>Bender</b>: a robot built for bending girders. Mostly just rude. Fry's best friend.</li><li><b>Professor Farnsworth</b>: Fry's great-great-great-(lots of greats)-nephew. Owns Planet Express. Very, very old. Always says "Good news, everyone!" right before the bad news.</li><li><b>Dr. Zoidberg</b>: the ship's doctor. A lobster-ish alien who does not know much about humans.</li><li><b>Hermes Conrad</b>: the accountant. Loves paperwork.</li><li><b>Amy Wong</b>: the intern. Clumsy and rich.</li><li><b>Nibbler</b>: Leela's little pet. Eats EVERYTHING. Like Dave.</li></ul>`));
  ES.def(FU, '/episodes.html', c => {
    const eps = ['Space Pilot 3000', 'The Series Has Landed', 'I, Roommate', "Love's Labours Lost in Space", 'Fear of a Bot Planet', 'A Fishful of Dollars', 'My Three Suns', 'A Big Piece of Garbage', 'Hell Is Other Robots'];
    return fuPage(c, `<h2>Episodes (shown in America, spring 1999)</h2><ol>${eps.map(e => `<li>${esc(e)}</li>`).join('')}</ol><p><small>No spoilers here! I've only seen the ones on my pen pal's tapes. More episodes are being made.</small></p>` + c.gb([['BenderFan', '30/04/99', 'Best new cartoon EVER.'], ['FryInTheIce', '01/05/99', 'What if it really happens on New Year\'s Eve?!']], { title: 'Guestbook of the Future', ph: 'Your message to the year 3000...' }));
  });

  // ================================================================ JACKFAX (teletext)
  const TX = 'www.jackfax.jnet';
  ES.css('ttx', `
.tx{background:#000;color:#fff;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:10px}
.tx-scr{width:100%;max-width:640px;background:#000;font-family:"Courier New",Courier,monospace;font-weight:bold;line-height:1;letter-spacing:0;border:6px solid #222;border-radius:10px;padding:6px;box-shadow:0 0 0 2px #444}
.tx-r{white-space:pre;height:1.2em;overflow:visible;position:relative}
.tx-r.dh{height:2.4em}.tx-r.dh span{display:inline-block;transform:scaleY(2);transform-origin:top}
.tx-r span{display:inline-block;height:1.2em;line-height:1.2em;vertical-align:top}
.tx-r .fl{animation:esblink 1s steps(2) infinite}
.tx-r .hid{visibility:hidden}.tx-scr.rev .tx-r .hid{visibility:visible}
.tx-k{display:grid;grid-template-columns:repeat(5,52px);gap:6px}
.tx-k button{min-height:36px;font:bold 16px Arial;background:#333;color:#fff;border:2px outset #666;border-radius:4px;cursor:pointer}
.tx-fast{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.tx-fast button{min-height:34px;min-width:72px;font:bold 13px Arial;border:2px outset #888;border-radius:4px;cursor:pointer;color:#000}
.tx-help{font:12px Arial,sans-serif;color:#aaa;text-align:center;max-width:600px}
`);
  const COL = { k: '#000', r: '#f00', g: '#0f0', y: '#ff0', b: '#00f', m: '#f0f', c: '#0ff', w: '#fff' };
  // markup: {fg}{FG for background} e.g. "{y}{B} JACKFAX " ; {!} flash on, {.} flash off, {?} hidden (revealed by REVEAL), {d} at line start = double height
  function row(s) {
    let fg = 'w', bg = 'k', fl = false, hid = false, out = '', buf = '', dh = false;
    if (s.startsWith('{d}')) { dh = true; s = s.slice(3); }
    const flush = () => { if (buf) out += `<span style="color:${COL[fg]};background:${COL[bg]}"${fl || hid ? ` class="${fl ? 'fl' : ''}${hid ? ' hid' : ''}"` : ''}>${esc(buf)}</span>`; buf = ''; };
    let len = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{' && s[i + 2] === '}') { flush(); const k = s[i + 1]; if (COL[k]) fg = k; else if (COL[k.toLowerCase()]) bg = k.toLowerCase(); else if (k === '!') fl = true; else if (k === '.') { fl = false; hid = false; } else if (k === '?') hid = true; i += 2; continue; }
      if (len < 40) { buf += s[i]; len++; }
    }
    if (len < 40) buf += ' '.repeat(40 - len);
    flush();
    return `<div class="tx-r${dh ? ' dh' : ''}">${out}</div>`;
  }
  const wrap = (s, w) => { const o = []; let l = ''; String(s).split(/\s+/).forEach(x => { if ((l + x).length > w) { o.push(l.trim()); l = ''; } l += x + ' '; }); if (l.trim()) o.push(l.trim()); return o; };
  const strip = h => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&eacute;/g, 'e').replace(/&Eacute;/g, 'E').replace(/&pound;/g, '£').replace(/&[a-z]+;/g, '');
  const TEAMS = ['Jacktown Rovers', 'Eggbert Town', 'Real Mechanoids', 'Sprite Utd', 'Polygon City', 'Gem Wanderers', 'Hollow Hill FC', 'Byte Athletic'];
  function league(day) {
    const R = ES.rng('lg' + Math.floor(day / 7)), t = TEAMS.map(n => ({ n, p: 0, w: 0, d: 0, l: 0, pts: 0 })), res = [];
    const weeks = Math.max(1, Math.min(14, Math.floor(day / 7) % 30 + 1));
    for (let wk = 0; wk < weeks; wk++) for (let i = 0; i < 8; i += 2) { const a = t[(i + wk) % 8], b = t[(i + 1 + wk * 3) % 8]; if (a === b) continue; const ga = Math.floor(R() * 4), gb = Math.floor(R() * 4); a.p++; b.p++; if (ga > gb) { a.w++; b.l++; a.pts += 3; } else if (gb > ga) { b.w++; a.l++; b.pts += 3; } else { a.d++; b.d++; a.pts++; b.pts++; } if (wk === weeks - 1) res.push(`${a.n.slice(0, 15).padEnd(15)} ${ga}-${gb} ${b.n.slice(0, 15)}`); }
    return { t: t.sort((a, b) => b.pts - a.pts), res };
  }
  const QUIZ = [['How many bits in a byte?', ['4', '8', '16', '1999'], 1], ['What does Pac-Man eat?', ['Only salad', 'Nothing', 'Dots', 'Teletext'], 2], ['How many Pocket Critters in Red and Blue?', ['100', '150', '151', '1,000'], 2], ['A floppy disk holds...', ['1.44MB', '650MB', '4.7GB', 'A sandwich'], 0], ['What colour is Zip?', ['Blue', 'Red', 'Beige', 'Tartan'], 0], ['What year comes after 1999?', ['1900', '2000', '19100', 'Nobody knows'], 1], ['What does a 56K modem sound like?', ['Silence', 'A cat', 'EEEE-KRRR-BONG', 'Opera'], 2], ['Which planet is the Red Planet?', ['Mars', 'Venus', 'Saturn', 'Jacktown'], 0]];
  ES.def(TX, '/', c => {
    c.after.push(() => wireTtx(c));
    return `<div class="tx"><div class="tx-scr" role="region" aria-label="Teletext screen" aria-live="polite"></div>
      <div class="tx-fast"><button type="button" data-f="0" style="background:#f33">News</button><button type="button" data-f="1" style="background:#3c3">Sport</button><button type="button" data-f="2" style="background:#ff3">Games</button><button type="button" data-f="3" style="background:#39f">Index</button></div>
      <div class="tx-k">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}</div>
      <div class="tx-fast"><button type="button" class="tx-rev" style="background:#ccc">REVEAL</button><button type="button" class="tx-hold" style="background:#ccc">HOLD</button></div>
      <div class="tx-help">Type a 3-digit page number (keyboard or buttons). Coloured buttons are FASTEXT. Some pages are not in the index...</div>${c.foot({ ctrText: 'Viewers:', ctr: 'lcd', best: 'Best viewed on a 14" portable telly' }).replace('es-foot"', 'es-foot" style="color:#aaa"')}</div>`;
  });
  function pages(c) {
    const t = c.t, posts = ((window.CAL && CAL.posts) || []).filter(p => ES.mdOf(p[0]) <= c.md).slice(-40).reverse();
    const lg = league(Math.floor((t.date - new Date(1999, 0, 1)) / 864e5));
    const P = {};
    const hd = (txt, bg) => `{d}{${bg || 'B'}}{y} ${txt.padEnd(38)} `;
    P[100] = { f: [101, 302, 470, 100], s: [[hd('JACKFAX', 'B'), '', '{c} The text service for gamers and Moms', '', '{w} NEWS HEADLINES ................ {y}101', '{w} WEATHER ....................... {y}102', '{w} JACKBOOZLE (quiz) ............ {y}150', '{w} MILLENNIUM COUNTDOWN .......... {y}199', '{w} FOOTBALL ...................... {y}302', '{w} TELLY GUIDE ................... {y}400', '{w} JACKITISER (games) ............ {y}470', '{w} JOKES ......................... {y}500', '{w} SUBTITLES ..................... {y}888', '', '{g} Type a number on the keypad below', '{m} ' + '▀▄'.repeat(19)]] };
    P[101] = { f: [102, 302, 470, 100], s: [0, 1, 2].map(k => { const p = posts[k]; const L = p ? wrap(strip(p[2]), 38) : ['Nothing has happened today.', 'Jackfax apologises.']; return [hd('NEWS', 'R'), '', `{y} ${(p ? p[1] : 'NEWS')} ${p ? ES.dmy(ES.dateOf(p[0])) : ''}`, '', ...L.slice(0, 12).map(l => '{w} ' + l), '', `{c} More news: page 101 sub ${k + 1}/3`]; }) };
    const temps = ['NORTH', 'MIDLANDS', 'WALES', 'SOUTH', 'SCOTLAND'].map(n => [n, 6 + ES.hash(n + t.md) % 12]);
    P[102] = { f: [101, 302, 199, 100], s: [[hd('WEATHER', 'B'), '', '{c}      ██            {w}TODAY: ' + ['Rain', 'Showers', 'Cloudy', 'Drizzle', 'Sunny spells (rare)'][t.md % 5], '{c}     █████', '{c}      ████', '{g}     ██████        ' + temps.map(x => '').join(''), '{g}      █████', '{g}     ██████', '{g}    ███████', '{g}  █████████', '', ...temps.map(([n, v]) => `{w} ${n.padEnd(12)}{y}${String(v).padStart(3)}C`), '', '{m} Take a coat. Mom says.']] };
    P[150] = { f: [151, 302, 470, 100], quiz: 1, s: QUIZ.slice(0, 4).map((q, i) => [hd('JACKBOOZLE', 'M'), '', `{y} Question ${i + 1} of 4`, '', ...wrap(q[0], 38).map(l => '{w} ' + l), '', ...q[1].map((a, j) => `{${'rgyb'[j]}} ${'ABCD'[j]}: ${a}`), '', `{w} Answer: {?}${'ABCD'[q[2]]} - ${q[1][q[2]]}{.}`, '', '{c} Press REVEAL to see the answer!'])};
    const now = new Date(), dt = new Date(1999, t.m - 1, t.d, now.getHours(), now.getMinutes(), now.getSeconds()), secs = Math.max(0, Math.floor((new Date(2000, 0, 1) - dt) / 1000));
    P[199] = { f: [101, 302, 470, 100], live: 1, s: [[hd('MILLENNIUM', 'R'), '', '{y} TIME LEFT UNTIL THE YEAR 2000:', '', `{d}{g}  ${Math.floor(secs / 86400)} DAYS`, '', `{w}  ${ES.pad(Math.floor(secs / 3600) % 24)} HOURS ${ES.pad(Math.floor(secs / 60) % 60)} MINS ${ES.pad(secs % 60)} SECS`, '', '{c} Save your work. Back up your saves.', '{c} Check your video recorder clock.', '{r}{!} DO NOT PANIC{.}', '', '{m} Millennium Bug advice: page 199']] };
    P[302] = { f: [101, 303, 470, 100], s: [[hd('FOOTBALL', 'G'), '', '{y} JACK LEAGUE: LATEST', '', ...lg.res.map(r => '{w} ' + r), '', '{c} Eggbert Town manager: "It died', '{c} at half time. These things happen."', '', '{g} Table: page 303'], [hd('FOOTBALL', 'G'), '', '{y}  JACK LEAGUE TABLE    P  W  D  L PTS', ...lg.t.map((x, i) => `{w} ${String(i + 1).padStart(2)} ${x.n.slice(0, 18).padEnd(18)}{c}${String(x.p).padStart(2)} ${String(x.w).padStart(2)} ${String(x.d).padStart(2)} ${String(x.l).padStart(2)} {y}${String(x.pts).padStart(3)}`)]] };
    P[303] = { f: P[302].f, s: [P[302].s[1]] };
    const shows = ['The News', 'Robo Rumble', 'Gubbinz\'s Kitchen', 'Neighbours', 'Top of the Pops', 'Antiques Roadshow', 'Galaxy Walk (repeat)', 'Blue Peter (for kids)', 'Weather for Gamers', 'Film: Toy Robots', 'Snooker (all of it)', 'Closedown'];
    P[400] = { f: [101, 302, 470, 100], s: [[hd('TELLY GUIDE', 'B'), '', '{y} JACK1 TONIGHT', ...shows.slice(0, 6).map((s, i) => `{c} ${ES.pad(17 + Math.floor(i / 2))}:${i % 2 ? '30' : '00'} {w}${s}`), '', '{y} JACK2 TONIGHT', ...shows.slice(6).map((s, i) => `{c} ${ES.pad(18 + Math.floor(i / 2))}:${i % 2 ? '30' : '00'} {w}${s}`)]] };
    P[470] = { f: [471, 302, 101, 100], s: [[hd('JACKITISER', 'M'), '', '{y} THE GAMES PAGES (NOW IN COLOUR)', '', '{w} Hello readers. Today we are cross', '{w} about load times. 40 seconds to load', '{w} a level?! In that time you could', '{w} eat a whole pizza. Two pizzas.', '', '{c} REVIEWS on 471', '{c} CHEATS on 472', '', '{g} Mr Pixel says: "BLIPBLIPBLIP."'], [hd('JACKITISER', 'M'), '', '{y} REVIEWS', '', '{w} SPACE JACK PINBALL (PC)  {g}9/10', '{w} Flippers! Ramps! Aliens! Tilted it.', '', '{w} SKIJACK (PC)             {g}8/10', '{w} Do NOT ski past 2000m. We did. RIP.', '', '{w} JACKLINGS (PC)           {g}9/10', '{w} They walk off cliffs. We cried.', '', '{w} BLOBBIT LOB (Web)        {g}7/10', '{w} Bouncy. Lobby. Blobby.']] };
    P[471] = { f: [472, 302, 470, 100], s: [P[470].s[1]] };
    P[472] = { f: [470, 302, 101, 100], s: [[hd('JACKITISER', 'M'), '', '{y} CHEATS', '', '{w} SPACE JACK PINBALL: type DAKKA', '{w} during a game for multiball.', '', '{w} SKIJACK: press F to go faster.', '{w} Faster than what? You will see.', '', '{w} JACK QUEST: try SAY XYZZY', '', '{c} Full guides: www.jackfaqs.w3b']] };
    const J = [['Why did the robot cross the road?', 'A chicken programmed it.'], ['What is a gamer\'s favourite key?', 'The ESCAPE key.'], ['How many Space Cadet does it take', 'to change a light bulb? None. The Force.'], ['What do you call a computer that', 'sings? A Dell. (Ask your Dad.)'], ['Why was the modem sad?', 'It kept getting cut off. (MOM!)']];
    P[500] = { f: [101, 302, 470, 100], s: J.map(j => [hd('JOKES', 'G'), '', '', '{y} ' + j[0], '', '{w} ' + j[1], '', '', '{c} Groan-o-meter: ' + '█'.repeat(3 + ES.hash(j[0]) % 6)]) };
    P[888] = { f: [101, 302, 470, 100], s: [['', '', '', '', '', '', '', '', '', '', '{w}{K}  Subtitles are not available for', '{w}{K}  this programme. Sorry.', '', '', '', '', '', '', '', '', '', '', '']] };
    P[123] = { secret: 1, f: [101, 302, 470, 100], s: [[hd('GUBBINZ WOZ ERE', 'R'), '', '{g}        █     █', '{g}        ███████', '{g}        █ {r}█{g} █ {r}█{g}█', '{g}        ███████', '{g}         █{w}▀▀▀{g}█', '', '{w} Oi. This is MY page. There is nothing', '{w} here. Go away. Unless you have pizza.', '', '{y}{!} SECRET PAGE FOUND!{.}']] };
    P[999] = { secret: 1, f: [101, 302, 470, 100], s: [['{d}{W}{k} ENGINEERING TEST PAGE                  ', '', '{r}█████{g}█████{y}█████{b}█████{m}█████{c}█████{w}█████', '{r}█████{g}█████{y}█████{b}█████{m}█████{c}█████{w}█████', '', '{w} ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789', '{w} The quick brown fox jumps over the', '{w} lazy dog.', '', '{y} If you can read this, your telly works.', '{c} If you can not read this, how?', '', '{!}{r} ENGINEERS ONLY. AND YOU, APPARENTLY.{.}']] };
    return P;
  }
  function wireTtx(c) {
    const scr = c.q('.tx-scr'); let cur = 100, sub = 0, typed = '', search = null, hold = false, P = pages(c);
    const fit = () => { const w = scr.clientWidth - 12; scr.style.fontSize = Math.max(6, w / 40 / 0.6) + 'px'; };
    fit(); if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(scr); c.off(() => ro.disconnect()); }
    const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const header = (shown) => { const n = new Date(), t = c.t; return `{w}P${String(typed ? (typed + '---').slice(0, 3) : cur).padEnd(4)} {y}JACKFAX{w} ${String(shown).padEnd(3)} {c}${D[t.date.getDay()]} ${ES.pad(t.d)} ${MO[t.m - 1]}{y} ${ES.pad(n.getHours())}:${ES.pad(n.getMinutes())}/${ES.pad(n.getSeconds())}`; };
    const draw = (shown) => {
      const pg = P[shown == null ? cur : shown];
      let lines;
      if (shown != null && shown !== cur) lines = [header(shown)];
      else if (!pg) lines = [header(cur), '', '', '', '', '{w}   Page ' + cur + ' is not in service.', '', '{c}   Try page 100 for the index.'];
      else { const s = pg.s[sub % pg.s.length]; lines = [header(cur), ...s]; if (pg.s.length > 1) lines[0] += ''; }
      while (lines.length < 24) lines.push('');
      const pgo = P[cur] || P[100];
      lines[24] = `{r}${'NEWS'.padEnd(10)}{g}${'SPORT'.padEnd(10)}{y}${'GAMES'.padEnd(10)}{c}INDEX`;
      const L2 = []; lines.slice(0, 25).forEach((l, i) => { if (i > 0 && l === '' && /^\{d\}/.test(lines[i - 1] || '')) return; L2.push(l); }); scr.innerHTML = L2.map(row).join('');
      void pgo;
    };
    const go = n => {
      n = +n; if (!(n >= 100 && n <= 899) && n !== 999) { typed = ''; draw(); return; }
      clearInterval(search); let shown = cur; typed = ''; const target = n;
      search = setInterval(() => { if (!scr.isConnected) return clearInterval(search); shown = shown >= 899 ? 100 : shown + 7; draw(shown); }, 70);
      c.later(() => { clearInterval(search); search = null; cur = target; sub = 0; P = pages(c); draw(); if (P[cur] && P[cur].secret) c.secret('eras.ttx'); c.sfx('click'); }, 700 + Math.random() * 900);
    };
    const key = d => { typed += d; c.sfx('click'); if (typed.length === 3) { const n = typed; typed = n; draw(); go(n); } else draw(); };
    c.qa('.tx-k button').forEach(b => b.addEventListener('click', () => key(b.dataset.n)));
    c.qa('.tx-fast button[data-f]').forEach(b => b.addEventListener('click', () => { const pg = P[cur] || P[100]; go(pg.f[+b.dataset.f]); }));
    c.on('.tx-rev', 'click', () => { scr.classList.toggle('rev'); c.sfx('click'); });
    c.on('.tx-hold', 'click', ev => { hold = !hold; ev.target.textContent = hold ? 'HOLD ON' : 'HOLD'; });
    const onKey = ev => { if (!scr.isConnected) return document.removeEventListener('keydown', onKey); if (/^[0-9]$/.test(ev.key) && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) key(ev.key); };
    document.addEventListener('keydown', onKey); c.off(() => document.removeEventListener('keydown', onKey));
    draw();
    let tk = 0;
    c.every(() => { if (search) return; tk++; const pg = P[cur]; if (pg && pg.live) P = pages(c); if (!hold && pg && pg.s.length > 1 && tk % 8 === 0) sub++; if (!typed) draw(); }, 1000);
  }
})();
