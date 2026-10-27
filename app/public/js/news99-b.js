/* news99-b: page bodies for POP GOSSIP!, JACK WANTS TO BE A MILLIONAIRE, JACK'S LAUNCH PAD, THE SPORTS DESK and
 * THE POPCORN COUNTDOWN (lazy, from js/news99.js). Facts (all checked):
 * UK number ones of 1999 (Official Chart, given here on the Sunday each was announced), Miami 7 on CBBC 8 Apr 1999,
 * Steptacular 25 Oct 1999, Britney = best-selling single of 1999. Millionaire: ITV from 4 Sep 1998, Chris Tarrant,
 * the 15-step money ladder, safe at £1,000 and £32,000, three lifelines, 19.21m viewers on 7 Mar 1999, no million winner
 * in 1999. Space: Mars Polar Lander 3 Jan, Stardust 7 Feb, Breitling Orbiter 3 (1-21 Mar), STS-96 27 May / docked 29 May /
 * home 6 Jun, STS-93 scrub 20 Jul at T-7s, launch 23 Jul (Eileen Collins, Chandra), night landing 27 Jul (Florida time),
 * Lunar Prospector 31 Jul, Cassini flyby 18 Aug, Mir left empty 28 Aug, Leonids peak about 02:02 UT 18 Nov, STS-103 19-27
 * Dec (all six gyroscopes). Sport: Boat Race 3 Apr (Cambridge), Grand National 10 Apr (Bobbyjo), Man Utd: league 16 May
 * (2-1 Spurs), FA Cup 22 May (2-0 Newcastel), European Cup 26 May (2-1 Bayern), Cricket World Cup 14 May-20 Jun
 * (Australia beat Pakistan at Lord's), Wimbledon finals 4 Jul (Sampras, Davenport), British GP 11 Jul (Coulthard),
 * the Open 18 Jul (Paul Lawrie, play-off), Ryder Cup 26 Sep (USA), Rugby World Cup 1 Oct-6 Nov (Wales hosts, Australia
 * 35-12 France), Hakkinen champion 31 Oct. Films: UK release dates from the UK box office records. */
(function () {
  'use strict';
  const N = window.N99; if (!N) return;
  const esc = N.esc, store = N.store, nice = N.nice;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ================================================================ POP GOSSIP!
  const PH = 'www.popgossip.kidz', PU = p => 'http://' + PH + p;
  N.css('pop', `
.pg{background:#ffe0f4;color:#3a003a;font:13px/1.5 "Comic Sans MS",Verdana,sans-serif;padding-bottom:6px;background-image:radial-gradient(#ffb8e6 1.5px,transparent 1.5px);background-size:14px 14px}
.pg a{color:#a0007a;font-weight:bold}
.pg-top{text-align:center;padding:12px 8px;background:linear-gradient(90deg,#ff3ab0,#a040ff,#3ab0ff);color:#fff}
.pg-top b{display:block;font:bold 40px/1 "Comic Sans MS",cursive;text-shadow:3px 3px 0 #6a006a,0 0 10px #fff;letter-spacing:2px}
.pg-nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:6px}
.pg-nav a{background:#fff;border:2px dotted #a0007a;padding:2px 10px;border-radius:12px;text-decoration:none}
.pg-in{max-width:720px;margin:0 auto;padding:8px 10px}
.pg-no1{display:flex;gap:12px;align-items:center;background:#fff;border:4px solid #ff3ab0;border-radius:14px;padding:10px;box-shadow:4px 4px 0 #a040ff}
.pg-no1 .b{flex:none;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7a0,#ffc800 60%,#c08000);display:flex;align-items:center;justify-content:center;font:bold 30px "Arial Black",sans-serif;color:#7a003a;border:3px solid #fff;box-shadow:0 0 0 3px #ffc800}
.pg-no1 big{display:block;font:bold 18px "Comic Sans MS",cursive}
.pg-ten{background:#fff;border:2px solid #a040ff;border-radius:10px;padding:6px 10px;margin:10px 0}
.pg-ten li{padding:3px 0;border-bottom:1px dotted #e0a0d0}
.pg-goss{background:#fffbe0;border:2px dashed #ff3ab0;padding:6px 10px;margin:8px 0}
.pg-goss small{color:#a0007a;font-weight:bold}
.pg table{border-collapse:collapse;width:100%;background:#fff;font-size:12px}
.pg td,.pg th{border:1px solid #e0a0d0;padding:3px 6px;text-align:left}
.pg th{background:#ff3ab0;color:#fff}
.pg-vote label{display:flex;gap:8px;align-items:center;padding:5px 0;min-height:30px}
.pg-vote input{width:20px;height:20px}
`);
  const CHART = [ // [Sunday it was announced, artist, song]
    ['01-03', 'Stairs', 'Heartbleat / Comedy'], ['01-10', 'Chubby Slim', 'Phrase You'], ['01-17', '999', 'A Little Bit Less'], ['01-24', 'The Offcuts', 'Pretty Spry (for a Tall Guy)'],
    ['01-31', 'Armand van Hedgen', "You Don't Know Us"], ['02-07', 'Blondini', 'Marcia'], ['02-14', 'Lenny Kravitzel', 'Fly Away'], ['02-21', 'Brittany Spheres', '...Baby Two More Times'],
    ['03-07', 'Boyzown', 'When the Going Gets Rough'], ['03-21', 'B*Stitched', 'Blame It on the Weathervane'], ['03-28', 'Mr. Ooze', 'Flat Feet'], ['04-11', 'Martina McCrutchen', 'Perfect Minute'],
    ['04-25', 'Westloaf', 'Spare It Again'], ['05-09', 'Backalley Boys', 'I Want It This Way'], ['05-16', 'Boyzown', 'You Kneaded Me'], ['05-23', 'Shins &amp; Bigtoe', 'Sweet Like Custard'],
    ['06-06', 'Baz Lurkman', "Everyone Is Free (To Wear Sunhats)"], ['06-13', 'Z Club 7', 'Bring Them All Back'], ['06-20', 'Vengaboats', 'Zoom, Zoom, Zoom, Zoom!!'], ['06-27', 'ATC', '9 PM (Till I Get Home)'],
    ['07-11', 'Rickie Martini', "Livin' la Vida Cocoa"], ['08-01', 'Ronan Keeping', 'When You Say Something at All'], ['08-15', 'Westloaf', 'If I Let You Stay'], ['08-22', 'Gerri Hallowed', 'Mi Chico Bambino'],
    ['08-29', 'Lou Bagel', 'Bongo No. 5'], ['09-12', 'Vengaboats', "We're Going to Majorca!"], ['09-19', 'Eiffle 56', 'Green (Da Ba Doo)'], ['10-10', 'Christina Aquilina', 'Genie in a Jar'],
    ['10-24', 'Westloaf', 'Flying Without Strings'], ['10-31', 'Fyve', "Keep On Moovin'"], ['11-07', 'Gerri Hallowed', 'Lift Me Down'], ['11-14', 'Robbie Wilkins', "She's the Two / It's Only Them"],
    ['11-21', 'Wamdoo Project', 'King of My Cottage'], ['11-28', 'Cliff Richer', 'The Millennium Plea'], ['12-19', 'Westloaf', 'I Have a Scheme / Reasons in the Sun'],
  ];
  const PG_GOSS = [
    ['01-03', 'The first chart of 1999 is in, and it\'s <b>Stairs</b>! Hand dance, everybody.'],
    ['02-21', '<b>Brittany Spheres</b> goes to number one with <i>...Baby Two More Times</i>. The school corridor will never be the same.'],
    ['03-28', 'A yellow puppet called Flat Derek is number one. Well, <b>Mr. Ooze</b> is. With no words at all. This is the future.'],
    ['04-08', '<b>Z Club 7</b> have their own TV series on CBBC: <i>Mallorca 7</i>! They haven\'t even had a single out yet. Watch this space.'],
    ['04-25', '<b>Westloaf</b>\'s first ever single, <i>Spare It Again</i>, goes straight to number one! Five Irish lads. Many stools.'],
    ['06-13', '<b>Z Club 7</b>\'s first single <i>Bring Them All Back</i> is number one! Told you to watch this space.'],
    ['07-25', '<b>Rickie Martini</b> has been number one for three weeks. Moms everywhere are dancing with the vacuum.'],
    ['09-19', '<b>Eiffle 56</b> go to number one with <i>Green (Da Ba Doo)</i>. It stays there THREE weeks. The whole country is blue.'],
    ['10-25', '<b>Stairs</b>\' new album <i>Stairtacular</i> is out today! It has a song about a tragedy and a song about a heartbeat. We knew those already.'],
    ['11-28', '<b>Cliff Richer</b> is number one with <i>The Millennium Plea</i>. Christmas chart battle: is it Cliff or is it Westloaf?'],
    ['12-19', '<b>WESTLOAF ARE THE CHRISTMAS NUMBER ONE!!!</b> <i>I Have a Scheme / Reasons in the Sun</i>. Cliff had three weeks at the top. The last Christmas number one of the 1900s!'],
    ['12-26', 'Biggest-selling single of the whole of 1999: <b>Brittany</b>, <i>...Baby Two More Times</i>, well over a MILLION copies. Of course.'],
  ];
  const PG_MATES = [
    ['01-04', 'Luke', 'Stairs are rubbish. (I know all the moves.)'],
    ['02-23', 'Dave', 'My sister has played Brittany 400 times. I counted. I had nothing else to do because she was playing Brittany.'],
    ['04-26', 'Callum', 'Westloaf = they stand up at the key change. That\'s the whole song.'],
    ['06-21', 'JackK', 'Boom Boom Boom Boom is my favourite song because it has FOUR exclamation marks in it.'],
    ['08-30', 'Jack', 'Mom does Bongo No. 5 at every barbecue. Every. Barbecue.'],
    ['09-25', 'Luke', 'I\'m blue da ba doo da ba daa. Sorry. Can\'t stop. Help.'],
    ['11-29', 'Jack', 'MY MOM BOUGHT THE CLIFF SINGLE. I am moving out. To Dave\'s.'],
    ['12-20', 'Dave', 'Westloaf beat Cliff!!! My sister screamed so loud the dog hid.'],
  ];
  const chartAt = c => { let i = -1; CHART.forEach((r, j) => { if (c.past(r[0])) i = j; }); return i; };
  const pgPage = (c, body) => `<div class="pg"><div class="pg-top"><b>POP GOSSIP!</b>The weekly chart chat &middot; by Gemma (glitter is my favourite colour)</div>
    <div class="pg-nav"><a href="${PU('/')}">This Week</a><a href="${PU('/no1s.html')}">Number Ones of 1999</a><a href="${PU('/vote.html')}">Your Number One</a></div><div class="pg-in">${body}</div>${N.foot(c, 'POP GOSSIP! is a fan site. We are not the real chart (they are on the radio on Sundays)')}</div>`;
  N.def(PH, '/', c => {
    const i = chartAt(c), goss = PG_GOSS.filter(g => c.past(g[0])).reverse().slice(0, 4);
    if (i < 0) return pgPage(c, `<div class="pg-no1"><div class="b">?</div><div><big>The first chart of 1999 is on Sunday!</big>Still on Christmas songs. Mom has been singing them since November.</div></div>` + N.mates(c, PG_MATES, 'GOSSIP BOX'));
    const r = CHART[i], weeks = Math.floor((c.n - N.dayNo(r[0])) / 7) + 1, ten = CHART.slice(Math.max(0, i - 9), i + 1).reverse();
    return pgPage(c, `<div class="pg-no1"><div class="b">1</div><div><small>NUMBER ONE THIS WEEK</small><big>${r[2]}</big><b>${r[1]}</b><br>${weeks > 1 ? `${weeks} weeks at the top!` : 'Brand new at the top this week!'}</div></div>
      <div class="pg-ten"><b>THE GOSSIP TEN</b><br><small>The ten songs everyone's humming this week: this week's number one, then the ones that were number one before it. (Not the official chart. That is on the radio.)</small><ol>${ten.map(x => `<li><b>${x[2]}</b> - ${x[1]}</li>`).join('')}</ol></div>
      <h3>Gossip!</h3>${goss.map(g => `<div class="pg-goss"><small>${N.short(g[0])}</small> ${g[1]}</div>`).join('')}` + N.mates(c, PG_MATES, 'GOSSIP BOX'));
  });
  N.def(PH, '/no1s.html', c => {
    const so = CHART.filter(r => c.past(r[0]));
    return pgPage(c, `<h2>Every Number One of 1999 (so far)</h2>${so.length ? `<table><tr><th>Chart from</th><th>Song</th><th>Artist</th></tr>${so.map(r => `<tr><td>${N.short(r[0])}</td><td>${r[2]}</td><td>${r[1]}</td></tr>`).join('')}</table>` : '<p>None yet! The first chart of the year is on Sunday 3 January.</p>'}<p><small>${so.length} number ones so far this year. Some stayed for weeks, some for just one.</small></p>`);
  });
  N.def(PH, '/vote.html', c => {
    const i = chartAt(c), ten = i < 0 ? [] : CHART.slice(Math.max(0, i - 9), i + 1).reverse(), mine = store.get('jhp_n99_no1', null);
    c.after.push(() => { const f = c.q('form'); if (!f) return; f.addEventListener('submit', ev => { ev.preventDefault(); const v = (f.querySelector('input:checked') || {}).value; if (!v) return; store.set('jhp_n99_no1', v); N.secret('n99.no1'); N.sfx('solve'); const o = c.q('[data-out]'); o.innerHTML = `<b>YOUR number one: ${v}</b>. Gemma says: good choice! (She says that to everyone.)`; }); });
    return pgPage(c, `<h2>Your Number One</h2>${ten.length ? `<form class="pg-vote">${ten.map(x => `<label><input type="radio" name="s" value="${esc(x[2].replace(/&amp;/g, '&'))}"> <span><b>${x[2]}</b> - ${x[1]}</span></label>`).join('')}<button class="n99-btn" type="submit">VOTE!</button></form>` : '<p>No songs to vote for yet. Come back after Sunday!</p>'}<p data-out>${mine ? 'Last time you picked: <b>' + esc(mine) + '</b>' : ''}</p>`);
  });

  // ================================================================ JACK WANTS TO BE A MILLIONAIRE (by JackK)
  const MH = 'www.jackmillionaire.kidz', MU = p => 'http://' + MH + p;
  N.css('mil', `
.ml{background:#000418 radial-gradient(ellipse at 50% 0,#1a2a8a,#000418 70%);color:#fff;font:14px/1.45 Arial,Helvetica,sans-serif;padding-bottom:6px}
.ml a{color:#ffb000}
.ml-top{text-align:center;padding:14px 8px 8px}
.ml-top b{display:inline-block;font:bold 26px/1.1 Georgia,"Times New Roman",serif;color:#ffd060;border:3px solid #ffd060;border-radius:50%;padding:18px 26px;background:radial-gradient(#2a3aaa,#000a40);box-shadow:0 0 20px #3a5aff}
.ml-nav{display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;padding:6px;font-weight:bold}
.ml-in{max-width:760px;margin:0 auto;padding:8px 10px}
.ml-game{display:flex;gap:10px;flex-wrap:wrap}
.ml-main{flex:1 1 300px;min-width:0}
.ml-q{background:linear-gradient(#0a1a6a,#000a3a);border:2px solid #9ab0ff;border-radius:22px;padding:12px 16px;margin:6px 0 10px;text-align:center;font-size:15px}
.ml-ans{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ml-ans button{background:linear-gradient(#0a1a6a,#000a3a);color:#fff;border:2px solid #9ab0ff;border-radius:20px;padding:8px 10px;min-height:42px;font:14px Arial,sans-serif;text-align:left;cursor:pointer}
.ml-ans button b{color:#ffb000;margin-right:6px}
.ml-ans button.sel{background:#e08000;color:#000}.ml-ans button.sel b{color:#000}
.ml-ans button.ok{background:#1a9a1a}.ml-ans button.gone{visibility:hidden}
.ml-ladder{flex:0 0 150px;font:bold 12px Arial,sans-serif;list-style:none;margin:0;padding:4px;background:rgba(0,10,60,.7);border:1px solid #556;display:flex;flex-direction:column-reverse}
.ml-ladder li{padding:2px 6px;color:#ffb000}
.ml-ladder li.safe{color:#fff}
.ml-ladder li.on{background:#e08000;color:#000}
.ml-life{display:flex;gap:8px;margin:6px 0;flex-wrap:wrap}
.ml-life button{border:2px solid #9ab0ff;background:#000a3a;color:#fff;border-radius:50%/40%;min-width:70px;min-height:36px;font:bold 12px Arial,sans-serif;cursor:pointer}
.ml-life button:disabled{opacity:.3;text-decoration:line-through}
.ml-msg{min-height:44px;background:rgba(0,0,0,.4);border:1px solid #445;padding:6px 8px;margin:8px 0}
.ml-aud{display:flex;gap:8px;align-items:flex-end;height:90px;margin:6px 0}
.ml-aud div{flex:1;background:#3a6aff;text-align:center;font:11px Arial;color:#fff;position:relative}
.ml-aud div span{position:absolute;top:-14px;left:0;right:0}
@media (max-width:520px){.ml-ans{grid-template-columns:1fr}.ml-ladder{flex-basis:100%;flex-direction:row-reverse;flex-wrap:wrap;gap:2px}.ml-ladder li{font-size:10px;padding:1px 4px}}
`);
  const LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
  const money = v => '£' + v.toLocaleString('en-GB');
  // [question, right answer, wrong, wrong, wrong]: two per step, one picked each game
  const QS = [
    [['How many sides does a Rubrick\'s cube have?', '6', '4', '8', '12'], ['What colour is Zapachu?', 'Yellow', 'Blue', 'Green', 'Pink']],
    [['Which of these is NOT a planet?', 'The Moon', 'Mars', 'Venus', 'Saturn'], ['How many players does a football team have on the pitch at once?', '11', '9', '10', '12']],
    [['In "CD-ROM", what does CD stand for?', 'Compact Disc', 'Computer Disk', 'Copy Data', 'Cool Drive'], ['In Blockology, how many squares make each falling piece?', '4', '3', '5', '6']],
    [['How many days are there in a leap year?', '366', '365', '364', '360'], ['What is the closest star to the Earth?', 'The Sun', 'The North Star', 'Sirius', 'The Moon']],
    [['How many kilobytes are in one megabyte (the way computers count)?', '1024', '1000', '100', '512'], ['Which is the biggest planet in our Solar System?', 'Jupiter', 'Saturn', 'Neptune', 'Earth']],
    [['What is the capital city of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'], ['How many squares are there on a chess board?', '64', '36', '81', '100']],
    [['In which year did people first walk on the Moon?', '1969', '1959', '1972', '1965'], ['What is the chemical symbol for gold?', 'Au', 'Go', 'Gd', 'Ag']],
    [['Which gas do plants take in from the air to make their food?', 'Carbon dioxide', 'Oxygen', 'Helium', 'Nitrogen'], ['How many bits are there in a byte?', '8', '2', '4', '16']],
    [['Who painted the Moaner Lisa?', 'Leonardo da Vincent', 'Michaelangelo-ish', 'Vincent van Goh', 'Pablo Picasa'], ['Which is the biggest ocean on Earth?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic']],
    [['How many hearts does an octopus have?', '3', '1', '2', '8'], ['Which planet has a big moon called Titan?', 'Saturn', 'Mars', 'Jupiter', 'Uranus']],
    [['What was the first man-made satellite, launched in 1957, called?', 'Sputnik 1', 'Apollo 1', 'Explorer 1', 'Vostok 1'], ['Which metal has the chemical symbol Fe?', 'Iron', 'Lead', 'Tin', 'Copper']],
    [['What is the hardest natural material?', 'Diamond', 'Granite', 'Steel', 'Quartz'], ['How many bones are there in an adult human body?', '206', '186', '226', '306']],
    [['Who was the first person to fly in space?', 'Yuri Garglin', 'Neil Armweak', 'John Glimm', 'Alan Shepherd-Pie'], ['Roughly how fast does light travel?', '300,000 km per second', '3,000 km per second', '30,000 km per second', '3 million km per second']],
    [['Which planet spins tipped right over on its side?', 'Uranus', 'Venus', 'Mercury', 'Neptune'], ['What is the smallest prime number?', '2', '1', '3', '0']],
    [['Which planet in our Solar System is NOT named after a god?', 'Earth', 'Mars', 'Mercury', 'Neptune'], ['Which big galaxy can you see with just your eyes from Britain on a dark night?', 'Andromeda', 'The Whirlpool', 'The Sombrero', 'The Large Magellanic Cloud']],
  ];
  const FRIENDS = [['Dave', 0.55, ['Er... I reckon it\'s', 'DEFINITELY', 'My cousin says']], ['Luke', 0.7, ['Easy. It\'s', 'Pretty sure it\'s', 'Go for']], ['Callum', 0.8, ['I\'ve looked it up on the Internet already. It\'s', 'It\'s']], ['Jack', 0.75, ['Ooh. I think it\'s', 'I\'d say']]];
  const mlPage = (c, body) => `<div class="ml"><div class="ml-top"><b>JACK WANTS TO BE<br>A MILLIONAIRE</b><br><small>a fan page for the best quiz on telly &middot; by JackK (Jack with a K. Not THAT Jack. The cool one.)</small></div>
    <div class="ml-nav"><a href="${MU('/')}">Home</a><a href="${MU('/play.html')}">PLAY THE QUIZ</a><a href="${MU('/facts.html')}">Show Facts</a></div><div class="ml-in">${body}</div>${N.foot(c, 'An unofficial fan page. No real money. Not even pretend money really.')}</div>`;
  const ML_MATES = [
    ['01-09', 'Jack', 'My mom shouts the answers at the telly. She got to 64,000 last night. From the sofa.'],
    ['03-08', 'Callum', 'Apparently over 19 MILLION people watched it last night. That\'s nearly everyone who has a telly.'],
    ['04-20', 'Dave', 'If I ring a mate it would be my mom and she would say "Dave, it\'s 9 o\'clock, why are you on a quiz show".'],
    ['06-15', 'Luke', 'Is that your last answer? Yes. Is that your last answer? YES. Is that your...'],
    ['09-10', 'JackK', 'Updated the quiz. Question 15 is SO hard. Nobody will ever get it. Prove me wrong.'],
    ['11-02', 'Jack', 'Got to 32,000 on the quiz here. Phoned Dave. Dave was wrong. Thanks Dave.'],
    ['12-30', 'Luke', 'Still nobody on the real show has won the million. Next year, maybe?'],
  ];
  N.def(MH, '/', c => mlPage(c, `<p style="text-align:center;font-size:16px"><b>Is that your last answer?</b></p>
    <p>Welcome to my fan page for <b>Who Wants to Be a Squillionaire?</b>, the quiz everyone in the country is watching on ITB. Fifteen questions. Three lifelines. One million pounds. And Chris Tarrot giving you a LOOK.</p>
    <p>I made my own version, with my own questions: <a href="${MU('/play.html')}"><b>PLAY IT HERE!</b></a> You get <b>50:50</b>, <b>Ring a Mate</b> (my mates, so good luck) and <b>Poll the Crowd</b>. If you get to &pound;1,000 or &pound;32,000 you keep it even if you get the next one wrong. Pretend pounds only.</p>
    ${c.until('03-07') <= 0 ? '<p><b>Record!</b> On 7 March over 19 million people watched one episode. Mom was one of them. Dad was asleep but he still counts.</p>' : ''}` + N.mates(c, ML_MATES, 'FINAL ANSWERS')));
  N.def(MH, '/facts.html', c => mlPage(c, `<h2>Show Facts</h2><ul><li>First shown on ITB on <b>4 September 1998</b>.</li><li>The host is <b>Chris Tarrot</b>.</li><li><b>15 questions</b> to the million. The money: ${LADDER.map(money).join(', ')}.</li>
    <li>Safe at <b>&pound;1,000</b> and <b>&pound;32,000</b>: you can't go lower than those once you've got there.</li><li>Three lifelines: <b>50:50</b> (two wrong answers vanish), <b>Ring a Mate</b> and <b>Poll the Crowd</b>.</li>
    <li>Biggest audience of 1999: over <b>19 million</b>, on 7 March.</li><li>Has anyone won the million yet? ${c.key === '12-31' ? 'Not in 1999! Maybe in 2000.' : 'Not yet!'}</li></ul>`));
  N.def(MH, '/play.html', c => {
    if (FF && !FF.s.ended) { c.after.push(() => ffMount(c.q('.ml-ffwrap'))); return mlPage(c, '<div class="ml-ffwrap"><div class="ml-ff"></div></div>'); }
    c.after.push(() => { const b = c.q('[data-ffplay]'); if (b) b.addEventListener('click', ev => { ev.preventDefault(); if (window.MP) MP.pick('mil.ff'); }); });
    c.after.push(() => {
      const root = c.q('.ml-game'); if (!root) return;
      const S = { lvl: 0, q: null, life: { ff: 1, ph: 1, au: 1 }, lock: false };
      const $q = root.querySelector('.ml-q'), $a = root.querySelector('.ml-ans'), $m = root.querySelector('.ml-msg'), $l = root.querySelector('.ml-ladder'), $life = root.querySelector('.ml-life');
      const safe = () => (S.lvl >= 10 ? 32000 : S.lvl >= 5 ? 1000 : 0);
      const ladder = () => { $l.innerHTML = LADDER.map((v, i) => `<li class="${i === 4 || i === 9 ? 'safe' : ''}${i === S.lvl ? ' on' : ''}">${i + 1}. ${money(v)}</li>`).join(''); };
      const lifeBtns = () => { $life.innerHTML = `<button type="button" data-l="ff"${S.life.ff ? '' : ' disabled'}>50:50</button><button type="button" data-l="ph"${S.life.ph ? '' : ' disabled'}>Phone</button><button type="button" data-l="au"${S.life.au ? '' : ' disabled'}>Audience</button><button type="button" data-l="walk">Walk away</button>`; };
      const end = (text, won) => { S.lock = true; $m.innerHTML = text + `<br><button type="button" class="n99-btn" data-again>Play again</button>`; if (won) N.sfx('solve'); };
      function ask() {
        const set = QS[S.lvl], q = pick(set), opts = [q[1], q[2], q[3], q[4]].sort(() => Math.random() - 0.5);
        S.q = { text: q[0], right: q[1], opts }; S.lock = false; ladder(); lifeBtns();
        $q.innerHTML = `<small>Question ${S.lvl + 1} for ${money(LADDER[S.lvl])}</small><br>${esc(q[0])}`;
        $a.innerHTML = opts.map((o, i) => `<button type="button" data-o="${i}"><b>${'ABCD'[i]}:</b>${esc(o)}</button>`).join('');
        $m.textContent = S.lvl === 0 ? 'Let\'s play! Pick an answer.' : `You've got ${money(LADDER[S.lvl - 1])}. ${S.lvl === 5 || S.lvl === 10 ? 'And that\'s SAFE now!' : ''}`;
      }
      root.addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-again')) { S.lvl = 0; S.life = { ff: 1, ph: 1, au: 1 }; ask(); return; }
        if (S.lock) return;
        if (b.dataset.o != null) {
          if (b.classList.contains('sel')) {
            S.lock = true; const ok = S.q.opts[+b.dataset.o] === S.q.right;
            $m.textContent = 'Final answer... (dramatic pause)'; N.sfx('turn');
            setTimeout(() => {
              const rb = $a.querySelectorAll('button')[S.q.opts.indexOf(S.q.right)]; rb.classList.add('ok');
              if (!ok) { N.sfx('uhoh'); end(`Oh no! The answer was <b>${esc(S.q.right)}</b>. You go home with <b>${money(safe())}</b>.`); return; }
              N.sfx('zap');
              if (S.lvl === 14) { N.secret('n99.million'); end('<b>YOU HAVE WON ONE MILLION POUNDS!!!</b> (Pretend ones.) JackK is amazed. He said nobody would ever do it.', true); return; }
              S.lvl++; setTimeout(ask, 900);
            }, 1100);
            return;
          }
          $a.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b));
          $m.textContent = 'Is that your last answer? (Click it again to lock it in.)'; return;
        }
        const l = b.dataset.l; if (!l) return;
        if (l === 'walk') { end(`You walk away with <b>${money(S.lvl ? LADDER[S.lvl - 1] : 0)}</b>. Sensible. Your mom would be proud.`); return; }
        if (!S.life[l]) return; S.life[l] = 0; b.disabled = true; N.sfx('button');
        const btns = Array.from($a.querySelectorAll('button')), ri = S.q.opts.indexOf(S.q.right);
        if (l === 'ff') { const wrong = btns.map((x, i) => i).filter(i => i !== ri).sort(() => Math.random() - 0.5).slice(0, 2); wrong.forEach(i => { btns[i].classList.add('gone'); btns[i].disabled = true; }); $m.textContent = 'Computer, take away two wrong answers...'; }
        if (l === 'ph') {
          const [who, skill, says] = pick(FRIENDS), right = Math.random() < skill - S.lvl * 0.025, live = btns.map((x, i) => i).filter(i => !btns[i].classList.contains('gone'));
          const guess = right ? ri : pick(live.filter(i => i !== ri).concat(live.length > 1 ? [] : [ri]));
          $m.innerHTML = `Ring ring... <b>${who}:</b> "${pick(says)} <b>${esc(S.q.opts[guess])}</b>. ${right ? 'Probably.' : 'I think. Maybe. Is my 30 seconds up?'}"`; N.secret('n99.friend');
        }
        if (l === 'au') {
          const live = btns.map((x, i) => i).filter(i => !btns[i].classList.contains('gone'));
          const p = btns.map((x, i) => (live.includes(i) ? Math.random() * 30 : 0)); p[ri] += 70 - S.lvl * 3.5;
          const tot = p.reduce((a, x) => a + x, 0), pc = p.map(x => Math.round(x / tot * 100));
          $m.innerHTML = `The audience says:<div class="ml-aud">${pc.map((v, i) => `<div style="height:${Math.max(2, v * 0.8)}px"><span>${v}%</span>${'ABCD'[i]}</div>`).join('')}</div>`;
        }
      });
      ask();
    });
    return mlPage(c, `<div class="ml-game"><div class="ml-main"><div class="ml-life"></div><div class="ml-q"></div><div class="ml-ans"></div><div class="ml-msg"></div></div><ol class="ml-ladder"></ol></div>${window.MP ? '<p class="ml-ffad"><b>NEW!</b> Play against your mates over JackNet: <b>SPEEDIEST FINGER FIRST</b>. Same question, same moment. Get it in the right order first and YOU are in the hot seat! <button type="button" class="n99-btn" data-ffplay>Play with someone...</button></p>' : ''}<p><small>All questions written by me (JackK) with help from the encyclopedia. If one is wrong, it was the encyclopedia.</small></p>`);
  });

  // ================================================================ FASTEST FINGER FIRST (2-4 people over JackNet: an mp.js session, game 'mil.ff')
  // The host's browser is the quizmaster: it holds the whole show (st) and sends it to everybody whenever it changes
  // ({k:'S'}); players send answers ({k:'ffa'} order + reaction time, then the hot seat's {k:'sel'|'fin'|'life'|'walk'}) and
  // the armchair guesses of the people watching ({k:'arm'}). Somebody dropping out gets the show again when they're back
  // (mp.js 'need' -> the session's state()); the Fastest Finger clock only runs while the host is connected.
  const FFQ = [ // [the question, the four answers in the RIGHT order]
    ['Put these planets in order, starting nearest the Sun.', ['Mercury', 'Venus', 'Earth', 'Mars']],
    ['Put these in order of size, smallest first.', ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte']],
    ['Put these coins in order of value, lowest first.', ['1p', '5p', '20p', '£1']],
    ['Put these in order, smallest number first.', ['A dozen', 'A score', 'A gross', 'A thousand']],
    ['Put these space firsts in order, earliest first.', ['Sputnik 1 goes up', 'People walk on the Moon', 'The first Space Shuttle flight', 'The Mir space station goes up']],
    ['Put these in order, shortest first.', ['Millimetre', 'Centimetre', 'Metre', 'Kilometre']],
    ['Put these rainbow colours in order, starting from the outside.', ['Red', 'Orange', 'Yellow', 'Green']],
    ['Put these animals in order of size, smallest first.', ['Mouse', 'Cat', 'Horse', 'Elephant']],
    ['Put these names in alphabetical order.', ['Dave', 'Gubbinz', 'Jack', 'Mom']],
    ['Put these days in order through the year, earliest first.', ['Valentine\'s Day', 'Bonfire Night', 'Christmas Day', 'New Year\'s Eve']],
    ['Put these shapes in order, fewest sides first.', ['Triangle', 'Square', 'Hexagon', 'Octagon']],
    ['Put these in order of speed, slowest first.', ['A snail', 'Somebody walking', 'A car on the motorway', 'Concorde']],
    ['Put these in order of how many legs they have, fewest first.', ['A snake', 'A bird', 'A dog', 'A spider']],
  ];
  N.css('milff', `
.ml-ffad{background:rgba(0,10,60,.7);border:1px dashed #ffd060;padding:6px 8px}
.ml-ffwrap{display:flex;flex-direction:column}
.ml-ff{padding:6px 0}
.ml-ff .ml-q small{color:#ffb000}
.ml-ff .ml-ans button.arm{border-style:dashed;border-color:#ffd060}
.ml-ff .ml-ans button.ok{background:#1a9a1a}.ml-ff .ml-ans button.bad{background:#a01a1a}
.ml-ff .ml-ans button:disabled{cursor:default}
.ml-fford{min-height:30px;font:bold 16px Arial,sans-serif;color:#ffd060;text-align:center;margin:6px 0}
.ml-ffbar{height:8px;background:#000a3a;border:1px solid #9ab0ff;margin:4px 0}.ml-ffbar i{display:block;height:100%;background:#ffb000}
.ml-fft{width:100%;border-collapse:collapse;margin:6px 0}.ml-fft td{padding:3px 6px;border-bottom:1px solid #334}
.ml-fft tr.win td{background:#e08000;color:#000;font-weight:bold}
.ml-ffhot{background:linear-gradient(90deg,#e08000,#ffd060);color:#000;font:bold 14px Arial,sans-serif;padding:5px 10px;border-radius:14px;text-align:center;margin:4px 0}
.ml-ffbtns{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 0}
.ml-ffpl{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}.ml-ffpl span{background:#0a1a6a;border:1px solid #9ab0ff;border-radius:10px;padding:2px 8px;font-size:12px}
`);
  let FF = null;
  const ffRid = () => Math.random().toString(36).slice(2, 8);
  const ffClean = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, n || 24).trim();
  const ffPlay = MU('/play.html');
  const ffSafe = lvl => (lvl >= 10 ? 32000 : lvl >= 5 ? 1000 : 0);
  N.ffLive = () => !!(FF && !FF.s.ended);
  N.ffDbg = () => (FF ? { st: FF.st, my: FF.my, host: FF.s.host } : null); // (testing)
  N.ff = s => {
    if (FF && FF.s !== s && !FF.s.ended) FF.s.leave(true);
    FF = { s, st: null, my: { id: '', ord: [], t0: 0, sent: false }, armQ: '', armO: -1, root: null, timers: [], arm: {}, ffAns: {}, lastPh: '' };
    const F = FF;
    s.ffOpen = s.host;
    s.on('m', (d, from) => { if (FF === F && d && typeof d === 'object') ffMsg(d, from); });
    s.on('state', st => { if (FF === F && !s.host && ffOk(st)) ffSet(st); });
    s.on('roster', () => { if (FF !== F) return; if (s.host && F.st && F.st.ph === 'lobby') { F.st.pl = s.humans().slice(0, 4).map(p => [p.id, p.nick]); ffPush(); } else ffRender(); });
    ['lost', 'back'].forEach(e => s.on(e, () => { if (FF === F) ffRender(); }));
    const out = id => { if (FF !== F) return; if (id === s.hostId) { s.end(`${s.nick(id)} (the quizmaster) has gone home. Show's over!`); return; } if (s.host) ffGone(id); };
    s.on('gone', out); s.on('left', out);
    s.on('end', why => { if (FF !== F) return; F.timers.forEach(clearTimeout); clearInterval(F.iv); FF = null; if (why && why !== 'You left the game.') try { Desk.toast('Speediest Finger First', why, 4000); } catch (e) {} if (F.root && F.root.isConnected) N.open(ffPlay); });
    if (s.host) {
      s.state(() => F.st);
      F.iv = setInterval(() => { if (FF === F) ffClock(); }, 250);
      if (s.resumed && ffOk(s.saved)) { F.st = s.saved; ffResume(); } else F.st = { v: 0, ph: 'lobby', pl: s.humans().slice(0, 4).map(p => [p.id, p.nick]), bank: {}, arm: {}, round: 0, msg: '' };
      ffPush();
    } else {
      setTimeout(() => { if (FF === F) s.need(); }, 200);
      F.iv = setInterval(() => { // my Fastest Finger answer didn't get there (a dropped line)? Say it again.
        const st = F.st; if (FF !== F || !st || st.ph !== 'ff' || !F.my.pkt || F.my.id !== st.ff.id || !Net.connected) return;
        if (!(st.ff.got || []).includes(Net.me.id) && Date.now() - F.my.at > 2500) { F.my.at = Date.now(); s.send(F.my.pkt, s.hostId); }
      }, 1000);
    }
    N.open(ffPlay);
  };
  const ffOk = st => !!st && typeof st === 'object' && typeof st.ph === 'string' && Array.isArray(st.pl) && st.pl.length <= 4 && st.bank && typeof st.bank === 'object';
  const ffName = id => { const p = FF && FF.st && FF.st.pl.find(x => x[0] === id); return p ? ffClean(p[1], 24) : 'Somebody'; };
  const ffIn = id => !!(FF && FF.st && FF.st.pl.some(x => x[0] === id));
  // ---- the host
  function ffPush() { const F = FF; if (!F || !F.s.host) return; F.st.v = (F.st.v | 0) + 1; F.s.send({ k: 'S', st: F.st }); F.s.save(F.st); ffSet(F.st, true); }
  const later = (ms, fn) => { const F = FF; const t = setTimeout(() => { if (FF === F) fn(); }, ms); F.timers.push(t); };
  function ffStart() { // a new Fastest Finger question for everybody
    const F = FF, st = F.st;
    F.s.ffOpen = false;
    const used = st.used || [];
    let i = Math.floor(Math.random() * FFQ.length); for (let k = 0; k < FFQ.length && used.includes(i); k++) i = (i + 1) % FFQ.length;
    st.used = used.concat(i).slice(-8);
    const ord = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    st.ph = 'ff'; st.ff = { id: ffRid(), i, ord, n: (st.ff && st.ph === 'ff' ? st.ff.n : 0) }; st.msg = ''; st.hot = 0;
    F.ffAns = {}; F.ffLeft = 20000; F.ffTries = (F.ffTries | 0) + 1;
    ffPush();
  }
  function ffClock() { // the Fastest Finger countdown (only while the host is on the line)
    const F = FF, st = F.st; if (!st || st.ph !== 'ff' || !Net.connected) { F.lastTick = 0; return; }
    const t = Date.now(); if (F.lastTick) F.ffLeft -= t - F.lastTick; F.lastTick = t;
    const live = st.pl.filter(p => !F.s.left.has(p[0]) && !F.s.gone.has(p[0]));
    if (F.ffLeft <= 0 || live.every(p => F.ffAns[p[0]])) ffEval();
  }
  function ffEval() {
    const F = FF, st = F.st, rows = st.pl.map(([id]) => { const a = F.ffAns[id]; return a ? [id, a.ok ? 1 : 0, a.ms, a.o.map(k => 'ABCD'[st.ff.ord.indexOf(k)]).join('')] : [id, 0, 0, '']; });
    rows.sort((a, b) => (b[1] - a[1]) || ((a[2] || 1e9) - (b[2] || 1e9)));
    let win = rows.find(r => r[1]);
    if (!win && F.ffTries >= 3) { // three goes and nobody got it: whoever got most in the right place
      const right = r => (r[3] ? [...r[3]].filter((ch, k) => st.ff.ord['ABCD'.indexOf(ch)] === k).length : -1);
      win = rows.slice().sort((a, b) => right(b) - right(a) || ((a[2] || 1e9) - (b[2] || 1e9)))[0];
      if (win && right(win) < 0) win = rows[Math.floor(Math.random() * rows.length)];
    }
    st.ph = 'ffres'; st.ff.res = rows; st.hot = win ? win[0] : 0;
    st.msg = win ? (win[1] ? `${ffName(win[0])} was fastest with the right order, in ${(win[2] / 1000).toFixed(2)} seconds!` : `Nobody got it AGAIN, so ${ffName(win[0])} goes, for getting the most right.`) : 'Nobody got it right! Another one...';
    ffPush();
    later(win ? 4500 : 3500, () => { if (win) { F.ffTries = 0; ffHot(win[0]); } else ffStart(); });
  }
  function ffHot(id) { const st = FF.st; st.ph = 'hot'; st.hot = id; st.lvl = 0; st.life = { ff: 1, ph: 1, au: 1 }; st.round = (st.round | 0) + 1; ffAsk(); }
  function ffAsk() {
    const F = FF, st = F.st;
    st.qj = Math.random() < 0.5 ? 0 : 1; st.qo = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    st.gone = []; st.sel = -1; st.lock = 0; st.reveal = -1; st.aud = null; st.phone = null; st.won = null;
    st.msg = st.lvl === 0 ? `${ffName(st.hot)} is in the hot seat! Question 1, for ${money(LADDER[0])}...` : `${ffName(st.hot)} has ${money(LADDER[st.lvl - 1])}.${st.lvl === 5 || st.lvl === 10 ? ' And that\'s SAFE now!' : ''}`;
    F.arm = {}; ffPush();
  }
  const ffRight = st => st.qo.indexOf(1);
  function ffFinal() {
    const F = FF, st = F.st; if (st.lock || st.sel < 0) return;
    st.lock = 1; st.msg = `${ffName(st.hot)} says "final answer"... (dramatic pause)`; ffPush();
    later(1600, () => {
      const r = ffRight(st), ok = st.sel === r;
      st.reveal = r;
      for (const id in F.arm) if (F.arm[id] === r && +id !== st.hot) st.arm[id] = (st.arm[id] | 0) + 1;
      const q = QS[st.lvl][st.qj];
      if (!ok) { st.won = ffSafe(st.lvl); st.msg = `Oh no! The answer was ${q[1]}. ${ffName(st.hot)} goes home with ${money(st.won)}.`; ffDone(); return; }
      if (st.lvl === 14) { st.won = LADDER[14]; st.msg = `${ffName(st.hot)} HAS WON ONE MILLION POUNDS!!! (Pretend ones.)`; ffDone(); return; }
      st.msg = `${q[1]} is RIGHT! ${ffName(st.hot)} has ${money(LADDER[st.lvl])}!`; ffPush();
      later(1800, () => { st.lvl++; ffAsk(); });
    });
  }
  function ffDone() { const st = FF.st; st.bank[st.hot] = Math.max(st.bank[st.hot] | 0, st.won | 0); st.ph = 'res'; ffPush(); }
  function ffWalk(why) { const st = FF.st; if (st.ph !== 'hot' || st.lock) return; st.won = st.lvl ? LADDER[st.lvl - 1] : 0; st.msg = `${ffName(st.hot)} ${why || 'walks away'} with ${money(st.won)}.`; st.reveal = ffRight(st); ffDone(); }
  function ffLife(l) {
    const st = FF.st; if (st.ph !== 'hot' || st.lock || !st.life[l]) return;
    st.life[l] = 0; const ri = ffRight(st), live = [0, 1, 2, 3].filter(i => !st.gone.includes(i));
    if (l === 'ff') { st.gone = [0, 1, 2, 3].filter(i => i !== ri).sort(() => Math.random() - 0.5).slice(0, 2); if (st.gone.includes(st.sel)) st.sel = -1; st.msg = 'Computer, take away two wrong answers...'; }
    if (l === 'ph') { const [who, skill, says] = pick(FRIENDS), right = Math.random() < skill - st.lvl * 0.025, g = right ? ri : pick(live.filter(i => i !== ri).concat(live.length > 1 ? [] : [ri])); st.phone = { who, says: pick(says), g, right: right ? 1 : 0 }; st.msg = `Phoning ${who}...`; }
    if (l === 'au') { const p = [0, 1, 2, 3].map(i => (live.includes(i) ? Math.random() * 30 : 0)); p[ri] += 70 - st.lvl * 3.5; const tot = p.reduce((a, x) => a + x, 0); st.aud = p.map(x => Math.round(x / tot * 100)); st.msg = 'The audience has voted!'; }
    ffPush();
  }
  function ffGone(id) { // a player left (or never came back)
    const st = FF.st; if (!st) return;
    if (st.ph === 'lobby') { st.pl = st.pl.filter(p => p[0] !== id); ffPush(); return; }
    if (st.ph === 'hot' && st.hot === id && !st.lock) ffWalk('had to go, and walks away');
  }
  function ffResume() { // the host's page was reloaded mid-show
    const st = FF.st;
    if (st.ph === 'ff' || st.ph === 'ffres') { FF.ffTries = 0; if (st.ph === 'ffres' && st.hot) ffHot(st.hot); else ffStart(); }
    else if (st.ph === 'hot' && st.lock) { st.lock = 0; st.msg = 'Sorry, the studio lights went off for a second. Final answer?'; }
  }
  function ffMsg(d, from) { // the host takes everybody's answers; the others take the show
    const F = FF, s = F.s, st = F.st;
    if (!s.host) { if (d.k === 'S' && from === s.hostId && ffOk(d.st) && (!st || (d.st.v | 0) > (st.v | 0) || d.st.ph !== st.ph)) ffSet(d.st); return; }
    if (!st || !ffIn(from)) return;
    if (d.k === 'ffa' && st.ph === 'ff' && d.id === st.ff.id && !F.ffAns[from] && Array.isArray(d.o) && d.o.length === 4) ffAnswer(from, d.o, +d.ms);
    else if (from === st.hot && st.ph === 'hot') ffHotIn(d);
    else if (d.k === 'arm' && st.ph === 'hot' && from !== st.hot && !st.lock && d.q === st.round + ':' + st.lvl && [0, 1, 2, 3].includes(d.o)) F.arm[from] = d.o;
  }
  function ffAnswer(id, o, ms) {
    const F = FF, st = F.st, ord = o.map(k => k | 0);
    if (new Set(ord).size !== 4 || !ord.every(k => k >= 0 && k < 4)) return;
    F.ffAns[id] = { o: ord, ok: ord.every((k, i) => k === i), ms: Math.max(400, Math.min(60000, Math.round(ms) || 60000)) };
    st.ff.got = Object.keys(F.ffAns).map(Number); ffPush(); // (so a phone that lost its answer on the way knows to send it again)
  }
  function ffHotIn(d) {
    const st = FF.st;
    if (d.k === 'sel' && !st.lock && [0, 1, 2, 3].includes(d.o) && !st.gone.includes(d.o)) { st.sel = d.o; st.msg = `${ffName(st.hot)} goes for ${'ABCD'[d.o]}... Is that your last answer?`; ffPush(); }
    else if (d.k === 'fin' && d.o === st.sel) ffFinal();
    else if (d.k === 'life' && ['ff', 'ph', 'au'].includes(d.l)) ffLife(d.l);
    else if (d.k === 'walk') ffWalk();
  }
  // ---- everybody: what arrives, and what we press
  function ffSet(st, mine) {
    const F = FF; if (!F) return;
    const was = F.st ? F.st.ph : '', wasHot = F.st ? F.st.hot : 0;
    F.st = st;
    if (!mine && !F.s.host) F.s.save(st);
    if (st.ph === 'ff' && F.my.id !== st.ff.id) F.my = { id: st.ff.id, ord: [], t0: performance.now(), sent: false };
    if (st.ph !== was || st.hot !== wasHot) ffPhase(was);
    ffRender();
  }
  function ffPhase(was) {
    const F = FF, st = F.st, me = Net.me.id, here = F.root && F.root.isConnected;
    if (st.ph === 'ff') { N.sfx('turn'); if (!here) N.open(ffPlay); }
    if (st.ph === 'ffres' && st.hot === me && st.ff.res && st.ff.res.some(r => r[0] === me && r[1])) { N.secret('mp.fff'); N.sfx('solve'); }
    if (st.ph === 'hot' && st.hot === me && !here) N.open(ffPlay);
    if (st.ph === 'end' && was !== 'end' && ffIn(me)) { const best = Object.entries(st.bank).sort((a, b) => b[1] - a[1]); const w = best.length && (!best[1] || best[0][1] > best[1][1]) && best[0][1] > 0 ? +best[0][0] : 0; Net.send({ t: 'mpResult', sid: F.s.rsid(), w }); }
    if ((st.arm[me] | 0) >= 5) N.secret('mp.armchair');
  }
  function ffSend(d) { const F = FF; if (!F) return; if (F.s.host) { if (d.k === 'ffa') { ffAnswer(Net.me.id, d.o, d.ms); ffRender(); } else if (d.k === 'arm') { if (F.st.ph === 'hot' && !F.st.lock) F.arm[Net.me.id] = d.o; } else if (Net.me.id === F.st.hot) ffHotIn(d); } else F.s.send(d, F.s.hostId); }
  function ffMount(wrap) {
    const F = FF; if (!F || !wrap) return;
    F.root = wrap.querySelector('.ml-ff');
    F.s.attach({ el: wrap, body: F.root });
    F.root.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b || b.disabled || !FF) return;
      const st = FF.st, me = Net.me.id, x = b.dataset;
      if (x.go === 'start') { if (st.pl.length < 2) return; FF.ffTries = 0; st.bank = {}; st.arm = {}; st.round = 0; ffStart(); }
      else if (x.go === 'next') { FF.ffTries = 0; ffStart(); }
      else if (x.go === 'end') { st.ph = 'end'; ffPush(); }
      else if (x.go === 'again') { FF.ffTries = 0; st.bank = {}; st.arm = {}; st.round = 0; ffStart(); }
      else if (x.go === 'inv') { if (window.MP) MP.pick('mil.ff'); }
      else if (x.go === 'leave') { Desk.msgbox('Speediest Finger First', 'Leave the show?', 'q', [['Leave', () => { if (FF) FF.s.leave(); }], ['Stay']]); }
      else if (x.ff != null && st.ph === 'ff' && ffIn(me) && !FF.my.sent) { // pick the next one in your order
        const k = +x.ff; if (FF.my.ord.includes(k)) return;
        FF.my.ord.push(k); N.sfx('click');
        if (FF.my.ord.length === 4) { FF.my.sent = true; FF.my.ms = performance.now() - FF.my.t0; FF.my.pkt = { k: 'ffa', id: FF.my.id, o: FF.my.ord.map(j => st.ff.ord[j]), ms: FF.my.ms }; FF.my.at = Date.now(); ffSend(FF.my.pkt); }
        ffRender();
      } else if (x.go === 'clear') { if (!FF.my.sent) { FF.my.ord = []; ffRender(); } }
      else if (x.o != null && st.ph === 'hot' && !st.lock) {
        const o = +x.o;
        if (st.hot === me) { if (st.sel === o) ffSend({ k: 'fin', o }); else ffSend({ k: 'sel', o }); }
        else if (ffIn(me)) { FF.armQ = st.round + ':' + st.lvl; FF.armO = o; ffSend({ k: 'arm', q: FF.armQ, o }); ffRender(); }
      } else if (x.l && st.hot === me) ffSend({ k: 'life', l: x.l });
      else if (x.go === 'walk' && st.hot === me) Desk.msgbox('Speediest Finger First', 'Walk away with the money?', 'q', [['Walk away', () => ffSend({ k: 'walk' })], ['Keep playing']]);
    });
    ffRender();
  }
  function ffRender() {
    const F = FF; if (!F || !F.root || !F.root.isConnected) return;
    const st = F.st, s = F.s, me = Net.me.id, host = s.host, el = F.root;
    if (!st) { el.innerHTML = '<div class="ml-q">Connecting to the studio...</div>'; return; }
    const pls = `<div class="ml-ffpl">${st.pl.map(([id, n]) => `<span>${esc(ffClean(n))}${id === s.hostId ? ' (host)' : ''}${id === me ? ' (you)' : ''}${s.lost.has(id) ? ' &middot; <i>reconnecting</i>' : ''}${st.bank[id] ? ' &middot; ' + money(st.bank[id]) : ''}</span>`).join('')}</div>`;
    const btns = a => `<div class="ml-ffbtns">${a.map(([k, t]) => `<button type="button" class="n99-btn" data-go="${k}">${t}</button>`).join('')}</div>`;
    let h = '';
    if (st.ph === 'lobby') {
      h = `<div class="ml-q"><b>SPEEDIEST FINGER FIRST</b><br>Same question for everybody at the same moment: put the four answers in the right order. Fastest right answer goes in the HOT SEAT. Everybody else watches (and shouts at the telly).</div>${pls}
        ${host ? (st.pl.length < 2 ? '<div class="ml-msg">Waiting for somebody to join. Invite a mate!</div>' : '<div class="ml-msg">Everybody ready? Fingers on buzzers!</div>') + btns([['start', 'START THE SHOW!'], ['inv', 'Invite someone'], ['leave', 'Leave']]) : `<div class="ml-msg">Waiting for ${esc(s.nick(s.hostId))} to start the show...</div>` + btns([['leave', 'Leave']])}`;
    } else if (st.ph === 'ff' || st.ph === 'ffres') {
      const q = FFQ[st.ff.i] || FFQ[0], res = st.ph === 'ffres', mine = F.my.id === st.ff.id ? F.my : { ord: [], sent: false };
      const left = res ? 0 : Math.max(0, 20 - (performance.now() - (mine.t0 || performance.now())) / 1000);
      h = `<div class="ml-ffhot">SPEEDIEST FINGER FIRST</div><div class="ml-q">${esc(q[0])}</div>
        <div class="ml-ans">${st.ff.ord.map((k, j) => `<button type="button" data-ff="${j}"${res || mine.sent || mine.ord.includes(j) || !ffIn(me) ? ' disabled' : ''} class="${!res && mine.ord.includes(j) ? 'sel' : ''}"><b>${'ABCD'[j]}:</b>${esc(q[1][k])}</button>`).join('')}</div>
        <div class="ml-fford">${res ? 'Right order: ' + [0, 1, 2, 3].map(k => 'ABCD'[st.ff.ord.indexOf(k)]).join(' ') : mine.ord.length ? mine.ord.map(j => 'ABCD'[j]).join(' ') + (mine.sent ? ` &middot; locked in (${(mine.ms / 1000).toFixed(2)}s)` : '') : ffIn(me) ? 'Click them in order!' : ''}</div>
        ${!res ? `<div class="ml-ffbar"><i style="width:${Math.round(left / 20 * 100)}%"></i></div>${!mine.sent && mine.ord.length ? btns([['clear', 'Start again']]) : ''}` : ''}
        ${res ? `<table class="ml-fft">${st.ff.res.map(r => `<tr class="${r[0] === st.hot ? 'win' : ''}"><td>${esc(ffName(r[0]))}</td><td>${r[3] ? esc(r[3].split('').join(' ')) : 'no answer'}</td><td>${r[3] ? (r[1] ? '&#10004;' : '&#10008;') : ''}</td><td>${r[2] ? (r[2] / 1000).toFixed(2) + 's' : ''}</td></tr>`).join('')}</table>` : ''}
        <div class="ml-msg">${esc(st.msg || (res ? '' : 'Quick!'))}</div>${pls}`;
    } else if (st.ph === 'hot' || st.ph === 'res') {
      const q = QS[st.lvl][st.qj], hotMe = st.hot === me, armMine = F.armQ === st.round + ':' + st.lvl ? F.armO : -1;
      const ans = st.qo.map((k, i) => { const cls = [st.gone.includes(i) ? 'gone' : '', st.sel === i ? 'sel' : '', st.reveal === i ? 'ok' : st.reveal >= 0 && st.sel === i ? 'bad' : '', !hotMe && armMine === i ? 'arm' : ''].filter(Boolean).join(' '); return `<button type="button" data-o="${i}" class="${cls}"${st.lock || st.ph === 'res' || st.gone.includes(i) || (!hotMe && !ffIn(me)) ? ' disabled' : ''}><b>${'ABCD'[i]}:</b>${esc(q[k])}</button>`; }).join('');
      const life = hotMe && st.ph === 'hot' ? `<div class="ml-life"><button type="button" data-l="ff"${st.life.ff && !st.lock ? '' : ' disabled'}>50:50</button><button type="button" data-l="ph"${st.life.ph && !st.lock ? '' : ' disabled'}>Phone</button><button type="button" data-l="au"${st.life.au && !st.lock ? '' : ' disabled'}>Audience</button><button type="button" data-go="walk"${st.lock ? ' disabled' : ''}>Walk away</button></div>` : '';
      const extra = st.phone ? `<br>Ring ring... <b>${esc(st.phone.who)}:</b> "${esc(st.phone.says)} <b>${esc(q[st.qo[st.phone.g]])}</b>. ${st.phone.right ? 'Probably.' : 'I think. Maybe. Is my 30 seconds up?'}"` : st.aud ? `<div class="ml-aud">${st.aud.map((v, i) => `<div style="height:${Math.max(2, v * 0.8)}px"><span>${v}%</span>${'ABCD'[i]}</div>`).join('')}</div>` : '';
      h = `<div class="ml-ffhot">${hotMe ? 'YOU ARE IN THE HOT SEAT!' : 'IN THE HOT SEAT: ' + esc(ffName(st.hot)).toUpperCase()}</div>
        <div class="ml-game"><div class="ml-main">${life}<div class="ml-q"><small>Question ${st.lvl + 1} for ${money(LADDER[st.lvl])}</small><br>${esc(q[0])}</div><div class="ml-ans">${ans}</div>
        <div class="ml-msg">${esc(st.msg || '')}${extra}${!hotMe && ffIn(me) && st.ph === 'hot' ? `<br><small>Shouting at the telly: click what YOU would say. Armchair score: ${st.arm[me] | 0}</small>` : ''}${hotMe && st.sel >= 0 && !st.lock ? '<br><small>Click it again to lock it in.</small>' : ''}</div>
        ${st.ph === 'res' ? (host ? btns([['next', 'Next Fastest Finger!'], ['end', 'End the show'], ['leave', 'Leave']]) : `<div class="ml-msg">Waiting for ${esc(s.nick(s.hostId))} to start the next round...</div>` + btns([['leave', 'Leave']])) : ''}
        </div><ol class="ml-ladder">${LADDER.map((v, i) => `<li class="${i === 4 || i === 9 ? 'safe' : ''}${i === st.lvl ? ' on' : ''}">${i + 1}. ${money(v)}</li>`).join('')}</ol></div>${pls}`;
    } else if (st.ph === 'end') {
      const rows = st.pl.slice().sort((a, b) => (st.bank[b[0]] | 0) - (st.bank[a[0]] | 0));
      h = `<div class="ml-ffhot">THAT'S THE END OF THE SHOW!</div><table class="ml-fft">${rows.map((p, i) => `<tr class="${i === 0 && (st.bank[p[0]] | 0) > 0 ? 'win' : ''}"><td>${i + 1}. ${esc(ffClean(p[1]))}${p[0] === me ? ' (you)' : ''}</td><td>${money(st.bank[p[0]] | 0)}</td><td>armchair: ${st.arm[p[0]] | 0}</td></tr>`).join('')}</table>
        <div class="ml-msg">Pretend money only. JackK says well done everybody (except Dave).</div>${host ? btns([['again', 'Play again'], ['inv', 'Invite someone'], ['leave', 'Leave']]) : btns([['leave', 'Leave']])}`;
    }
    el.innerHTML = h;
    if (st.ph === 'ff' && !F.barT) { F.barT = setInterval(() => { if (!FF || FF !== F || FF.st.ph !== 'ff' || !F.root || !F.root.isConnected) { clearInterval(F.barT); F.barT = 0; return; } const bar = F.root.querySelector('.ml-ffbar i'); if (bar) bar.style.width = Math.round(Math.max(0, 20 - (performance.now() - (F.my.t0 || 0)) / 1000) / 20 * 100) + '%'; }, 250); }
  }

  // ================================================================ JACK'S LAUNCH PAD (space news)
  const SH = 'www.jackspacenews.cyb', SU = p => 'http://' + SH + p;
  N.css('space', `
.sp{background:#0b1030;color:#dfe8ff;font:13px/1.5 Verdana,Arial,sans-serif;padding-bottom:6px}
.sp a{color:#ff9a3a}
.sp-top{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px 8px;background:linear-gradient(#1a2a6a,#0b1030);border-bottom:3px solid #ff6a00}
.sp-top b{font:bold 30px/1 "Arial Black",Impact,sans-serif;color:#fff;letter-spacing:1px}
.sp-top svg{width:56px;height:56px}
.sp-nav{display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;padding:6px;font-weight:bold;background:#121a48}
.sp-in{max-width:740px;margin:0 auto;padding:10px}
.sp-next{background:#000;border:2px solid #ff6a00;padding:10px;text-align:center;font:bold 14px "Courier New",monospace;color:#3f3}
.sp-next big{display:block;font-size:22px;color:#fff}
.sp-item{border-left:4px solid #ff6a00;padding:4px 10px;margin:8px 0;background:rgba(255,255,255,.04)}
.sp-item small{color:#9ab}
.sp-item.up{border-left-color:#3a8aff;opacity:.85}
.sp-pad{text-align:center;margin:12px 0}
.sp-pad button{width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff6a6a,#c00000 60%,#600);border:6px solid #888;color:#fff;font:bold 16px "Arial Black",sans-serif;cursor:pointer;box-shadow:0 6px 0 #333}
.sp-pad button:active{transform:translateY(4px);box-shadow:0 2px 0 #333}
.sp-rocket{position:relative;height:130px;overflow:hidden;border-bottom:2px solid #345}
.sp-rocket svg{position:absolute;left:50%;bottom:0;width:30px;margin-left:-15px;transition:bottom 2.5s ease-in}
.sp-rocket.go svg{bottom:150px}
`);
  const PATCH = '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="#1a3a9a" stroke="#ff6a00" stroke-width="3"/><path d="M28 8 L34 30 L28 26 L22 30 Z" fill="#fff"/><path d="M24 30 L28 44 L32 30" fill="#ff6a00"/><circle cx="14" cy="18" r="1.2" fill="#fff"/><circle cx="42" cy="14" r="1" fill="#fff"/><circle cx="44" cy="38" r="1.3" fill="#fff"/><path d="M6 34 Q28 50 50 34" fill="none" stroke="#3af" stroke-width="2"/></svg>';
  // [date, headline, what happened, what to look forward to (shown before it happens)]
  const LOG = [
    ['01-03', 'Mars Polar Lander launched', 'NASSA\'s Mars Polar Lander is on its way to land near the south pole of Mars in December.', 'Mars Polar Lander launch'],
    ['02-07', 'Stardust launched!', 'Stardust is off to fly through the dust cloud round a comet, catch some in a sort of space sponge and bring it back to Earth.', 'Stardust launch: the comet dust catcher'],
    ['03-01', 'Breitlung Orbiter 3 takes off', 'Bertram Piccaro and Brian Jonas set off from Switzerland in a giant balloon to try to go all the way round the world without stopping. Nobody has ever done it!', 'Round-the-world balloon attempt'],
    ['03-20', 'THE BALLOON DID IT!', 'Breitlung Orbiter 3 crossed the finish line over Africa: the first balloon to fly non-stop all the way round the world!', ''],
    ['03-21', 'Balloon lands in Egypt', 'Piccaro and Jones landed in the Egyptian desert after 19 days, 21 hours and 55 minutes in the air. World record!', ''],
    ['05-27', 'Discovery launched to the space station', 'Space Shuttle Discovery (mission STS-96) blasted off with supplies for the brand new International Space Station.', 'Shuttle Discovery to the space station'],
    ['05-29', 'FIRST DOCKING WITH THE ISS', 'Discovery docked with the International Space Station: the first time a shuttle has ever docked with it! The crew carried in tons of supplies.', 'First shuttle docking with the ISS'],
    ['06-06', 'Discovery home safe', 'Discovery landed in Florida after nearly ten days in space.', ''],
    ['07-20', 'Columbia launch stopped at T-7 seconds', 'The computers stopped the countdown seven seconds before launch because they spotted too much hydrogen. Better safe than sorry. Try again soon!', 'Columbia launch: first woman shuttle commander'],
    ['07-23', 'COLUMBIA LAUNCHES! Eileen Collinz makes history', 'Columbia (STS-93) launched with <b>Eileen Collinz</b> in charge: the first woman ever to command a Space Shuttle! On board: the <b>Chandra X-ray Observatory</b>, a telescope that sees X-rays from space.', ''],
    ['07-27', 'Columbia lands in the dark', 'Columbia landed in Florida in the middle of the night (Florida time). Chandra is now up there looking at black holes and exploded stars.', ''],
    ['07-31', 'Lunar Prospector crashes into the Moon (on purpose!)', 'NASSA steered the Lunar Prospector probe into a crater near the Moon\'s south pole, to see if any water ice would splash up.', 'Lunar Prospector\'s planned crash into the Moon'],
    ['08-11', 'TOTAL ECLIPSE OF THE SUN', 'Total in Cornwall, a big bite out of the Sun everywhere else in Britain. See <a href="http://www.totality99.cyb/">TOTALITY!</a>', 'THE TOTAL ECLIPSE'],
    ['08-18', 'Cassini zooms past Earth', 'The Cassini probe flew past Earth to pick up speed for its trip to Saturn. It gets there in 2004.', 'Cassini flies past Earth'],
    ['08-28', 'Mir is empty', 'The crew of the Russian space station Mir came home, leaving it with nobody on board for now.', ''],
    ['11-18', 'LEONID METEOR STORM', 'Early this morning (peak at about 2am GMT) Europe got the best view of a meteor STORM: thousands of shooting stars an hour at the peak!', 'the Leonid meteor storm (best seen from Europe!)'],
    ['12-19', 'Discovery off to fix Hubbly', 'Discovery (STS-103) launched to repair the Hubbly Space Telescope.', 'Shuttle mission to fix Hubbly'],
    ['12-27', 'Hubbly fixed!', 'Discovery came home after the astronauts replaced all six of Hubbly\'s gyroscopes on spacewalks. Hubbly can point at things again!', ''],
  ];
  const SP_MATES = [
    ['02-08', 'Callum', 'A space sponge for comet dust. That is the coolest job a sponge has ever had.'],
    ['03-22', 'Luke', 'Round the world in a balloon in 20 days. It takes my dad 20 minutes to blow up ONE balloon.'],
    ['05-30', 'Dave', 'They docked with the space station! Like the bit in Goldenballs where... no, nothing like that.'],
    ['07-24', 'JackK', 'First woman shuttle commander! My sister has put a picture of Eileen Collinz on her wall.'],
    ['11-18', 'Jack', 'Got up at 2am for the meteors. Saw some! Then my feet froze.'],
    ['12-28', 'Callum', 'Hubbly has six new gyroscopes. My PC still has the same fan from 1997.'],
  ];
  const spPage = (c, body) => `<div class="sp"><div class="sp-top">${PATCH}<div><b>JACK'S LAUNCH PAD</b><br><small>Space news 1999 &middot; by Jack (yes, that Jack, from JACK ATTACK!) &middot; T-minus forever</small></div></div>
    <div class="sp-nav"><a href="${SU('/')}">Mission Control</a><a href="${SU('/launches.html')}">Launch Log 1999</a><a href="${SU('/sky.html')}">Sky Watch</a></div><div class="sp-in">${body}</div>${N.foot(c, 'JACK\'S LAUNCH PAD. Not NASSA. I wish.')}</div>`;
  const ROCKET = '<svg viewBox="0 0 30 90" aria-hidden="true"><path d="M15 2 C24 14 24 40 22 70 H8 C6 40 6 14 15 2Z" fill="#eee" stroke="#000"/><circle cx="15" cy="28" r="4" fill="#3af" stroke="#000"/><path d="M8 56 L1 74 L8 70 Z M22 56 L29 74 L22 70 Z" fill="#c00"/><path d="M10 72 L15 89 L20 72Z" fill="#ff9a00"/></svg>';
  N.def(SH, '/', c => {
    const next = LOG.find(r => r[3] && c.until(r[0]) >= 0), past = LOG.filter(r => c.past(r[0])).reverse().slice(0, 4);
    c.after.push(() => { const b = c.q('[data-launch]'); if (b) b.addEventListener('click', () => { const r = c.q('.sp-rocket'); let n = 3; b.disabled = true; const tick = () => { b.textContent = n ? n : 'GO!'; N.sfx('beep'); if (n-- > 0) setTimeout(tick, 600); else { r.classList.add('go'); N.sfx('zap'); N.secret('n99.liftoff'); setTimeout(() => { r.classList.remove('go'); b.disabled = false; b.textContent = 'LAUNCH'; }, 3500); } }; tick(); }); });
    return spPage(c, `<div class="sp-next">${next ? `NEXT UP<big>${next[3]}</big>${c.until(next[0]) === 0 ? 'TODAY!!!' : `T-minus ${c.until(next[0])} day${c.until(next[0]) === 1 ? '' : 's'} (${nice(next[0])})`}` : 'NEXT UP<big>The year 2000!</big>New missions next year. Watch this space. (Literally.)'}</div>
      <div class="sp-rocket">${ROCKET}</div><div class="sp-pad"><button type="button" data-launch>LAUNCH</button></div>
      <h3>Latest news</h3>${past.length ? past.map(r => `<div class="sp-item"><small>${N.short(r[0])}</small><br><b>${r[1]}</b><br>${r[2]}</div>`).join('') : '<p>Nothing launched yet this year! Not even me off the trampoline.</p>'}
      <p><small>Space station fact: the first two bits of the International Space Station went up in November and December 1998 (Zarya and Unity). More bits every year!</small></p>` + N.mates(c, SP_MATES, 'MISSION CONTROL CHAT'));
  });
  N.def(SH, '/launches.html', c => spPage(c, `<h2>Launch Log 1999</h2>${LOG.map(r => c.past(r[0]) ? `<div class="sp-item"><small>${N.short(r[0])}</small> <b>${r[1]}</b><br>${r[2]}</div>` : (r[3] ? `<div class="sp-item up"><small>${N.short(r[0])} (coming up)</small> <b>${r[3]}</b></div>` : '')).join('')}`));
  N.def(SH, '/sky.html', c => spPage(c, `<h2>Sky Watch</h2>
    <div class="sp-item${c.past('08-11') ? '' : ' up'}"><b>Total eclipse of the Sun: 11 August.</b> Total in Cornwall at about 11:11 in the morning. NEVER look at the Sun! Make a <a href="http://www.totality99.cyb/pinhole.html">pinhole viewer</a>.</div>
    <div class="sp-item${c.past('11-18') ? '' : ' up'}"><b>The Leonids: the night of 17/18 November.</b> Every November the Earth goes through dust left by a comet. ${c.past('11-18') ? 'This year it was a proper STORM, peaking at about 2am GMT on the 18th, best from Europe!' : 'This year the experts think it could be a STORM, with Europe getting the best view.'} Wrap up warm, lie down, look up. No telescope needed.</div>
    <p><b>How to watch shooting stars:</b> get away from street lights, let your eyes get used to the dark for 20 minutes (no Game Lad!), and be patient. Bring a flask. Bring a mom.</p>`));

  // ================================================================ THE SPORTS DESK (plain text)
  const TH = 'www.sportsdesk.netz', TU = p => 'http://' + TH + p;
  N.css('sport', `
.sd{background:#fff;color:#000;font:13px/1.45 "Courier New",Courier,monospace;padding:10px 10px 4px}
.sd a{color:#00c}
.sd pre{white-space:pre-wrap;font:13px/1.45 "Courier New",monospace;margin:0 0 10px}
.sd hr{border:0;border-top:1px dashed #000}
.sd .sd-h{font-weight:bold}
`);
  // [date, sport, text, preview (before)]
  const RES = [
    ['04-03', 'ROWING', 'THE BOAT RACE: Cambridge beat Oxford by three and a half lengths.', 'The Boat Race (Oxford v Cambridge)'],
    ['04-10', 'RACING', 'THE GRAND NATIONAL at Aintree: won by BOBBYJOE (10/1), ridden by Paul Carbury.', 'The Grand National'],
    ['05-14', 'CRICKET', 'The CRICKET WORLD CUP begins in England. Twelve teams. Five weeks.', 'Cricket World Cup starts in England'],
    ['05-16', 'FOOTBALL', 'PREMIER LEAGUE, final day: Mancake Utd 2 Totterham 1. Mancake United are CHAMPIONS. That is trophy number one.', 'Premier League final day'],
    ['05-22', 'FOOTBALL', 'FA CUP FINAL at Wembley: Mancake Utd 2 Newcastel Untied 0 (Sheringdon, Scoles). Trophy number two: the "Double".', 'FA Cup final at Wembley'],
    ['05-26', 'FOOTBALL', 'EUROPEAN CUP FINAL in Barcelona: Mancake Utd 2 Bavaria Munchen 1. Two goals in injury time (Sheringdon, Solskjar)! THE TREBLE!', 'European Cup final in Barcelona'],
    ['06-20', 'CRICKET', 'WORLD CUP FINAL at Lord\'s: Australia beat Pakistan by 8 wickets. Australia are world champions.', 'Cricket World Cup final at Lord\'s'],
    ['07-04', 'TENNIS', 'WIMBLEDON: Pete Samprass beat Andre Agassy 6-3 6-4 7-5 for his sixth Wimbledon title. Women\'s champion: Lindsay Davenham (beat Steffi Graph 6-4 7-5). Tim Hen-man got to the semi-finals again.', 'Wimbledon finals'],
    ['07-11', 'MOTOR RACING', 'BRITISH GRAND PRIX at Silverstone: 1. David Coalhard 2. Eddie Ervine 3. Ralf Shoemaker.', 'British Grand Prix'],
    ['07-18', 'GOLF', 'THE OPEN at Carnoustie: Paul Lorry of Scotland wins in a play-off! He started the last day ten shots behind: a record comeback.', 'The Open (golf)'],
    ['09-26', 'GOLF', 'RYDER CUP at Brookline, USA: the United States beat Europe.', 'The Ryder Cup'],
    ['10-01', 'RUGBY', 'The RUGBY WORLD CUP kicks off, hosted by Wales, at the brand new Millennium Stadium in Cardiff.', 'Rugby World Cup kicks off in Wales'],
    ['10-31', 'MOTOR RACING', 'JAPANESE GRAND PRIX: Mika Hackinen wins at Suzuka and is WORLD CHAMPION for the second year running.', 'Last Grand Prix of the season'],
    ['11-06', 'RUGBY', 'RUGBY WORLD CUP FINAL at the Millennium Stadium: Australia 35 France 12. Australia are world champions.', 'Rugby World Cup final in Cardiff'],
  ];
  const SD_MATES = [
    ['05-23', 'Luke', 'Two trophies down. Dad says nobody English has ever done three. Wednesday!!!'],
    ['05-27', 'Dave', 'My dad knocked the ULTRA 64 off the telly when the second goal went in. It still works. U64s are indestructible.'],
    ['07-05', 'Callum', 'Watched Wimbledon instead of playing Jaquake. That is how good it was. (I played Jaquake after.)'],
    ['10-02', 'JackK', 'The new stadium in Cardiff has a roof that closes! Like a giant tin.'],
    ['11-01', 'Jack', 'Hackinen won the championship. I played F1 on the PlaySpace to celebrate. Crashed at the first corner.'],
  ];
  const sdPage = (c, body) => `<div class="sd"><pre><span class="sd-h">THE SPORTS DESK</span>  -  results in plain text since 1996
${c.long.toUpperCase()}
[ <a href="${TU('/')}">RESULTS</a> ] [ <a href="${TU('/treble.html')}">THE TREBLE</a> ] [ <a href="${TU('/calendar.html')}">CALENDAR</a> ]</pre><hr>${body}<hr><pre>No pictures = fast. This page is about 3 KB.
Run by Steve. Send your scores in by e-mail.</pre>${N.mates(c, SD_MATES, 'SPORTS PHONE-IN')}${N.foot(c, 'THE SPORTS DESK')}</div>`;
  N.def(TH, '/', c => {
    const done = RES.filter(r => c.past(r[0])).reverse(), soon = RES.filter(r => c.until(r[0]) > 0 && c.until(r[0]) <= 60);
    return sdPage(c, `<pre><span class="sd-h">LATEST RESULTS</span>\n${done.length ? done.slice(0, 8).map(r => `${N.short(r[0])}  ${r[1].padEnd(12)} ${r[2]}`).join('\n') : 'No big results yet this year. The football goes on every week, ask your dad.'}\n\n<span class="sd-h">COMING UP</span>\n${soon.length ? soon.map(r => `${N.short(r[0])}  ${r[1].padEnd(12)} ${r[3]}  (${c.until(r[0])} day${c.until(r[0]) === 1 ? '' : 's'})`).join('\n') : 'Nothing big in the next two months. Rest those legs.'}</pre>`);
  });
  N.def(TH, '/treble.html', c => {
    const n = ['05-16', '05-22', '05-26'].filter(k => c.past(k)).length;
    if (n === 3) N.secret('n99.treble');
    const T = ['PREMIER LEAGUE ..... ' + (n > 0 ? 'WON (16/05/99)' : 'to play for'), 'FA CUP ............. ' + (n > 1 ? 'WON (22/05/99)' : 'final 22/05/99'), 'EUROPEAN CUP ....... ' + (n > 2 ? 'WON (26/05/99)' : 'final 26/05/99')];
    return sdPage(c, `<pre><span class="sd-h">THE TREBLE</span>\nCan any English club win the league, the FA Cup AND the European Cup in one season?\nIt has never been done.\n\nMANCHESTER UNITED 1998-99\n${T.join('\n')}\n\n${n === 3 ? 'THEY DID IT. THE TREBLE. Both goals in the final came in injury time.\nTeddy Sheringdon, then Ole Gunnar Solskjar.\nThe Camp Noo, Barcelona, Wednesday 26 May 1999. Football, eh.' : n ? `${n} down, ${3 - n} to go...` : 'The season is still going. Ask again in May.'}</pre>`);
  });
  N.def(TH, '/calendar.html', c => sdPage(c, `<pre><span class="sd-h">SPORT CALENDAR 1999</span>\n${RES.map(r => `${N.short(r[0])}  ${r[1].padEnd(12)} ${c.past(r[0]) ? r[2] : r[3] + ' [to come]'}`).join('\n')}</pre>`));

  // ================================================================ THE POPCORN COUNTDOWN
  const FH = 'www.popcorn99.cyb', FU = p => 'http://' + FH + p;
  N.css('film', `
.fc{background:#2a0006;color:#fff6e0;font:13px/1.5 Georgia,"Times New Roman",serif;padding-bottom:6px;background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.25) 0 10px,transparent 10px 22px)}
.fc a{color:#ffd400}
.fc-top{text-align:center;padding:10px 6px;background:#000;border-bottom:4px solid #c8a000}
.fc-top b{display:inline-block;font:bold 30px/1.1 Impact,"Arial Black",sans-serif;letter-spacing:3px;color:#ffd400;padding:6px 14px;border:4px dotted #ffd400}
.fc-nav{display:flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;padding:6px;font:bold 13px Arial,sans-serif}
.fc-in{max-width:740px;margin:0 auto;padding:8px 10px}
.fc-card{display:flex;gap:10px;align-items:center;background:rgba(0,0,0,.45);border:2px solid #c8a000;padding:8px 10px;margin:8px 0}
.fc-card .d{flex:none;width:76px;text-align:center;background:#ffd400;color:#2a0006;font:bold 26px/1 Impact,sans-serif;padding:6px 2px}
.fc-card .d small{display:block;font:bold 10px Arial,sans-serif}
.fc-card.out .d{background:#3a9a3a;color:#fff}
.fc table{border-collapse:collapse;width:100%;font:12px Arial,sans-serif}
.fc td,.fc th{border:1px solid #6a3a20;padding:4px 6px;text-align:left}
.fc th{background:#c8a000;color:#2a0006}
.fc-ticket{display:inline-flex;margin:12px auto;background:#ffd400;color:#2a0006;font:bold 14px "Courier New",monospace;border:2px dashed #2a0006;cursor:pointer;position:relative}
.fc-ticket span{padding:12px 16px}
.fc-ticket .stub{border-left:2px dashed #2a0006;transition:transform .6s}
.fc-ticket.torn .stub{transform:translate(14px,18px) rotate(14deg)}
`);
  // [UK date, title, note, US date or '', buzz once out]
  const FILMS = [
    ['01-01', 'Galaxy Walk: Insubordination', 'The Next Instalment crew, film number three.', '', 'Pickle does a dance. Not even joking.'],
    ['02-05', 'A Bug\'s Strife', 'Pixer\'s new one: an ant hires some circus bugs to fight grasshoppers.', '11-25 (1998)', 'Stay for the bloopers at the end!'],
    ['05-21', 'Knotting Hill', 'A man with a bookshop meets a film star. Mom has been counting down for weeks.', '', 'Moms everywhere say it is "lovely".'],
    ['06-11', 'The Modemtrix', 'Is anything real? Kung fu, slow-motion bullets and long black coats.', '03-31', 'There is no spoon. Everyone is trying to dodge things in slow motion.'],
    ['06-25', 'The Mommy', 'An adventure in Egypt with a mummy that comes back to life. And beetles.', '05-07', 'Scarab beetles. Sleep with the light on.'],
    ['07-16', 'Intergalactic Battles Episode I: The Phantom Nuisance', 'THE big one. The first new Intergalactic Battles film in 16 years. Out in America on 19 May. Premiere in London on 14 July.', '05-19', 'Biggest opening weekend ever in Britain: about &pound;9.5 million! Duel of the Fates is the best bit.'],
    ['10-22', 'Tarzon', 'Dizzney\'s new cartoon. He surfs down tree branches.', '06-18', 'The tree surfing looks like a video game.'],
    ['11-12', 'The Sixth Scents', 'A spooky one everyone\'s whispering about. DON\'T tell anyone the ending.', '08-06', 'Luke saw it. Luke won\'t tell us the ending. Luke is a good man.'],
    ['11-26', 'The World Is Plenty', 'The new James Bland.', '', 'Gadgets, a boat chase on the Thames and a big explosion. Classic.'],
  ];
  const FC_MATES = [
    ['03-12', 'Callum', 'They\'re showing the new Intergalactic Battles trailer before films in America and people are paying just to see the TRAILER.'],
    ['04-15', 'Dave', 'Saw The Modemtrix trailer on the Internet. Took 40 minutes to download. Worth it.'],
    ['06-12', 'Luke', 'THE MODEMTRIX. I tried to dodge a football in slow motion at lunch. It hit me in normal motion.'],
    ['07-17', 'Jack', 'SAW EPISODE I!!! Queued for ages. Dark Mole has a DOUBLE lightspatula. I need to lie down.'],
    ['07-18', 'JackK', 'Peapod Race = best ten minutes of my life. Jar Jar Jams = the other ten minutes.'],
    ['11-13', 'Luke', 'Saw The Sixth Scents. Not telling. Stop asking.'],
    ['11-25', 'Callum', 'Toy Storey 2 is out in America. Here? Not till 11 February. FEBRUARY.'],
  ];
  const fcPage = (c, body) => `<div class="fc"><div class="fc-top"><b>THE POPCORN COUNTDOWN</b><br><small>Films coming soon to a cinema near you (in Britain, not America) &middot; by Rachel, who sits in the middle of row G</small></div>
    <div class="fc-nav"><a href="${FU('/')}">Now &amp; Next</a><a href="${FU('/dates.html')}">UK Release Dates</a><a href="${FU('/ticket.html')}">Ticket Stub</a></div><div class="fc-in">${body}</div>${N.foot(c, 'THE POPCORN COUNTDOWN. Please switch off your pagers.')}</div>`;
  N.def(FH, '/', c => {
    const next = FILMS.filter(f => c.until(f[0]) > 0).slice(0, 3), now = FILMS.filter(f => c.past(f[0]) && c.until(f[0]) > -42).reverse();
    const card = (f, out) => `<div class="fc-card${out ? ' out' : ''}"><div class="d">${out ? 'OUT<small>NOW</small>' : c.until(f[0]) + '<small>DAYS TO GO</small>'}</div><div><b>${f[1]}</b> <small>(UK: ${nice(f[0])})</small><br>${out ? f[4] : f[2]}</div></div>`;
    return fcPage(c, `${now.length ? '<h3>Out now</h3>' + now.map(f => card(f, 1)).join('') : ''}<h3>Coming soon</h3>${next.length ? next.map(f => card(f, 0)).join('') : ''}
      ${c.until('11-24') <= 0 ? '<div class="fc-card"><div class="d">2000<small>NEXT YEAR</small></div><div><b>Toy Storey 2</b><br>Out in America on 24 November, but not here till <b>11 February 2000</b>. The longest countdown on this site.</div></div>' : !next.length ? '' : ''}` + N.mates(c, FC_MATES, 'IN THE FOYER'));
  });
  N.def(FH, '/dates.html', c => fcPage(c, `<h2>UK Release Dates 1999</h2><table><tr><th>Film</th><th>UK</th><th>America</th><th></th></tr>${FILMS.map(f => `<tr><td>${f[1]}</td><td>${nice(f[0])}</td><td>${f[3] ? (/1998/.test(f[3]) ? nice(f[3].slice(0, 5)) + ' 1998' : nice(f[3])) : 'about the same'}</td><td>${c.past(f[0]) ? 'OUT' : c.until(f[0]) + ' days'}</td></tr>`).join('')}<tr><td>Toy Storey 2</td><td>11 February 2000</td><td>24 November</td><td>next year!</td></tr></table><p><small>Why does everything come out in America first? Nobody knows. Rachel has written to the cinema. Twice.</small></p>`));
  N.def(FH, '/ticket.html', c => {
    const f = FILMS.filter(x => c.past(x[0])).pop();
    c.after.push(() => { const t = c.q('.fc-ticket'); if (t) t.addEventListener('click', () => { if (t.classList.contains('torn')) return; t.classList.add('torn'); N.sfx('click'); N.secret('n99.ticket'); c.q('[data-tk]').textContent = 'Enjoy the film! No talking. No kicking the seat. Popcorn: allowed.'; }); });
    return fcPage(c, `<h2>Your Ticket</h2><p>Click the stub to tear it off, like the man at the door does.</p><div style="text-align:center"><div class="fc-ticket" role="button" tabindex="0"><span>ADMIT ONE<br>${f ? f[1] : 'Coming Soon'}<br>SCREEN 2 &middot; ROW G</span><span class="stub">${N.short(c.key)}<br>No. ${String(N.hash(c.key) % 99999).padStart(5, '0')}</span></div></div><p data-tk style="text-align:center"></p>`);
  });
})();
