/* cx-mag-a: the words of JACK ATTACK! back issues, January to June 1999 (lazy, loaded by js/cx.js; drawn by js/cx-mag.js).
 * Reviews are of real games with their UK release dates (each review shows from that date; where only the month is
 * known, from the last Friday that month, never early). Scores for games the main site also reviews match it.
 * Facts checked: Wikipedia infoboxes (EU/PAL/UK lines) + the EuroGold 1999 UK shop list.
 * The competition answers are NOT here: the server keeps them (mods/cx.js). Keep the question order in step with it. */
(function () {
  'use strict';
  const M = window.CXMag; if (!M) return;
  // a little poster kit (300 x 400)
  const T = (x, y, s, txt, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.f || 'Anton,Impact,Arial Black,sans-serif'}" font-size="${s}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#fff'}"${o.st ? ` stroke="${o.st}" stroke-width="${o.sw || 2}" paint-order="stroke"` : ''}${o.w ? ` font-weight="${o.w}"` : ''}>${txt}</text>`; };
  const stars = (n, seed, h) => Array.from({ length: n }, (_, i) => `<circle cx="${(i * 67 + seed) % 300}" cy="${(i * 41 + seed * 3) % (h || 400)}" r="${i % 7 ? 0.8 : 1.6}" fill="#fff"/>`).join('');

  // ================================================================ JANUARY
  M.add(1, {
    blurb: { editorial: 'New year, new mag, new resolutions', reviews: 'Rogue Squadrilla, Squirms Armageddon, Lingo\'s Awakening DX, Boulder\'s Gate', previews: 'Metal Gear Wobbly, Marlo Party, Pocket Critters, a new Segue machine', letters: 'Dave complains (again)', cheats: 'Christmas present cheats', poster: 'The whole Solar System!', compo: 'Win 40 Rupees' },
    ed: `<p>HAPPY NEW YEAR!!! It's <b>1999</b>, which is the last year with a 1 at the front. Next year everything goes to 2000 and the computers might all go wrong (see Y2K, everywhere). So this year I am going to get as much gaming done as possible, just in case.</p>
      <p>My New Year's resolutions: <b>1.</b> Review 100 games this year. <b>2.</b> Finish Kazoo of Time without looking anything up (Water Tempura, I'm coming for you). <b>3.</b> Solve the Rubrick's cube in under a minute. <b>4.</b> Stop letting Dave borrow things. Number 4 is the hardest.</p>
      <p>Christmas was brilliant. I got Rogue Squadrilla, a Rumble Pouch, a BLOCKO set and a jumper with a reindeer on it. Mom says the jumper is "for best". I don't know what "best" is. Luke got Zeldo too, so now we ring each other up to compare hearts. Callum got a 3D card for his PC and won't stop going on about frames per second.</p>
      <p>This issue we've got the first reviews of the year, a load of previews (1999 is going to be MASSIVE: there's a new Intergalactic Battles film in the summer, and something called Pocket Critters is coming that everyone in America is going mad for), and a free poster of the whole Solar System for your wall. All nine planets. Even little Pluto.</p>`,
    revIntro: 'The first reviews of 1999! Most of January is spent playing what you got for Christmas, so not much is out. But what is out is good.',
    rev: [
      { g: 'Intergalactic Battles: Rogue Squadrilla', p: 'ULTRA 64', d: '01-11', s: [92, 90, 88, 85], o: 88, v: 'Stay on target... STAY ON TARGET!',
        t: ['I got this for Christmas but it\'s only just properly in the shops round here, so here\'s the review. You fly Z-wings and snowspeeders for the Rebel Allowance, blowing up Imperial stuff on loads of different planets. Every mission has a gold, silver and bronze medal and you get them for speed, accuracy and not letting your mates get blown up.',
          'The best bit is the snowspeeder level where you wrap the tow cable round an AT-ET\'s legs. You go round and round and round and it falls over. I have done this about two hundred times. With the Expansion Pouch plugged in it goes into high resolution and looks jackreal.'],
        up: 'Snowspeeder tow cable. The music. Proper Intergalactic Battles sounds.', dn: 'Fog on some levels. Your wingmen are rubbish.' },
      { g: 'Squirms Armageddon', p: 'PC', d: '01-29', s: [80, 92, 95, 96], o: 91, v: 'Incoming!', by: 'Jack and Callum',
        t: ['The worms are back and they\'ve got even sillier weapons. Two teams of worms take it in turns on a little island, and you have to wipe out the other team with bazookas, grenades, air strikes, a sheep that explodes, a banana bomb and the Holy Hand Grenade, which sings when you throw it.',
          'We played this at Callum\'s with four people on one keyboard and it was the best night ever. The Super Sheep flies when you press the button again. The Ninja Rope takes ages to learn and then you swing about like Tarzon. Made by Team18, who are British. Get in.'],
        up: 'Four players, one keyboard. The Super Sheep. The worm voices.', dn: 'Fights over who has the keyboard. Instant replays of your OWN worm falling in the sea.' },
      { g: 'The Legend of Zeldo: Lingo\'s Awakening DX', p: 'GAME LAD COLOR', d: '01-29', s: [84, 86, 94, 92], o: 92, v: 'A massive adventure in your pocket.',
        t: ['This is the old Game Lad Zeldo, but now in COLOUR on the Game Lad Color. Lingo gets shipwrecked on Kohlrabi Island and has to collect eight musical instruments to wake up the Wind Cod. It plays like the old Super Ultra Zeldo, from above, with dungeons full of keys, switches and bosses.',
          'There\'s a brand new dungeon that only works on a Game Lad Color, all about colours, and a photographer who takes pictures of you that you can print out if you\'ve got a Game Lad Printer. It still works on an old grey Game Lad too, just in black and white.'],
        up: 'Massive. Funny. The colour dungeon. Fits in your pocket.', dn: 'Batteries. I went through FOUR on Boxing Day.' },
      { g: 'Boulder\'s Gate', p: 'PC', d: '01-29', s: [86, 88, 90, 97], o: 90, v: 'Five CDs. FIVE.', by: 'Callum (guest reviewer)',
        t: ['CALLUM HERE. This is a huge fantasy adventure where you make your own hero, pick up a gang of up to six adventurers and walk all over a giant map fighting monsters. The fights happen in real time but you can press space to pause, give everyone orders, and unpause. That makes you feel like a genius.',
          'It comes on FIVE CDs and you have to swap them sometimes. My favourite character is a big warrior who keeps a tiny hamster called Boo and talks to it in battles. Jack wanted to play but it took him twenty minutes to make his character and then he called him "Jack". Typical.'],
        up: 'Massive world. Pausing fights. The hamster.', dn: 'Disc swapping. Loading. More loading.' },
    ],
    pre: [
      { g: 'Metal Gear Wobbly', p: 'PLAYSPACE', when: 'Out next month!', hype: 96, t: 'Everyone in the magazines says this is the most exciting game EVER. You\'re a soldier sneaking round a base in the snow, hiding from guards. The magazines say it\'s like being in a film. It\'s been out in America since last year. I am counting the days.' },
      { g: 'Marlo Party', p: 'ULTRA 64', when: 'Spring 1999', hype: 75, t: 'Marlo and his mates play a giant board game, and between turns everyone does a little mini-game. It came out in Japan just before Christmas. Up to four players. Looks like the perfect thing for when Luke and Dave come round.' },
      { g: 'Pocket Critters', p: 'GAME LAD', when: 'Later this year (we hope)', hype: 99, t: 'A Game Lad game from Japan where you catch little monsters and train them to fight. It is HUGE in Japan and in America. There are 150 of them (151 if you believe the rumours) and there are two versions, moss and puddle. Ultra Entertainment, please bring it here quickly.' },
      { g: 'Segue\'s new console', p: 'SEGUE', when: 'Later this year', hype: 80, t: 'Segue have a new console out in Japan, and it\'s a 128-bit machine with a modem built in, so you can play on the Internet on your telly. Callum says it\'s more powerful than his PC. Callum is lying to protect his feelings.' },
    ],
    let: [
      { from: 'Dave, from down the road', how: 'by hand, through the letterbox', t: 'dear jack. you said rogue squadrilla is better than goldenballs. that is the wrongest thing anyone has ever said. goldenballs forever. also can i borrow rogue squadrilla. from dave', r: 'Dave. I never said that. And no, because you still have my Kart Kaos 64 from OCTOBER. Resolution number 4 starts NOW.' },
      { from: '{kidVal}', how: 'by e-mail', t: 'Hi Jack! I love your mag. I got a Game Lad Color for Christmas and the screen is in COLOUR. Is it worth getting Zeldo for it? {kidVal?My big sister says it\'s too hard for me. I said that is rubbish.|My brother says it\'s for boys. I said that is rubbish.} Love {kidVal}', r: '{kidVal?It is DEFINITELY not too hard for you and your sister is wrong (sisters usually are. I have one. I know).|It\'s DEFINITELY not just for boys and your brother is wrong (brothers usually are).} Lingo\'s Awakening DX is out this month and it\'s amazing. Review in this issue!' },
      { from: 'Luke', how: 'by e-mail', t: 'Jack. I have 13 hearts in Zeldo. How many have you got? Also the Water Tempura is impossible. Luke', r: 'Eleven. And yes. Yes it is.' },
      { from: 'A worried reader', how: 'on a postcard', t: 'Dear Jack, will my Ultra 64 still work in the year 2000? My dad says it might explode.', r: 'It will NOT explode. Games consoles don\'t care what year it is. Your dad might be thinking of the video recorder. The video recorder might explode.' },
    ],
    ch: [
      { g: 'The Legend of Zeldo: Kazoo of Time', p: 'ULTRA 64', t: 'Not a cheat, a TIP: if you\'re stuck for money, cut the grass and smash pots everywhere. And the Gourd in Gourd City who rolls about? Drop a bomb in his way. Trust me.' },
      { g: 'Backpack Buddies', p: 'ULTRA 64', t: 'In Treasure Grove Cove, the sandcastle has letters on the floor. Spell words on them with Kazoobie\'s beak to type in codes. Jump on letters, don\'t walk.' },
      { g: 'Pocket Critters (if it ever comes out)', p: 'GAME LAD', t: 'People on the Internet say you can find MewOne under a truck by a boat. This is a RUMOUR and I can\'t test it because the game isn\'t out here. I\'ll test it when it is. Stay tuned.' },
      { g: 'Squirms Armageddon', p: 'PC', t: 'The Super Sheep is a missile you steer. Fire it, press the button again and it flies. Steer it with the arrow keys into the other team. Then do it again until Callum shouts.' },
    ],
    poster: { title: 'THE SOLAR SYSTEM', col: '#000010', cap: 'All nine planets, in order from the Sun. Little Pluto is out at the end, about 40 times further from the Sun than us. Not drawn to scale (the paper wasn\'t big enough. Nothing is big enough).',
      svg: `<rect width="300" height="400" fill="#000010"/>${stars(70, 11)}<circle cx="150" cy="-60" r="110" fill="#ffd400"/><circle cx="150" cy="-60" r="118" fill="none" stroke="#ff9a00" stroke-width="6" opacity=".6"/>${T(150, 30, 26, 'THE SOLAR SYSTEM', { c: '#000' })}${[
        ['MERCURY', 76, 6, '#aaa'], ['VENUS', 104, 9, '#e8c870'], ['EARTH', 136, 10, '#2a7ad8'], ['MARS', 166, 8, '#d0502a'], ['JUPITER', 212, 26, '#d8a070'], ['SATURN', 270, 20, '#e8d090'], ['URANUS', 318, 13, '#8ae0e8'], ['NEPTUNE', 354, 13, '#3a5ad8'], ['PLUTO', 386, 4, '#c8b8a0']].map(([n, y, r, c], i) =>
        `<circle cx="${i % 2 ? 200 : 100}" cy="${y}" r="${r}" fill="${c}"/>${n === 'SATURN' ? `<ellipse cx="200" cy="${y}" rx="34" ry="7" fill="none" stroke="#c8b070" stroke-width="3"/>` : ''}${n === 'EARTH' ? '<circle cx="118" cy="128" r="3" fill="#ccc"/>' : ''}${T(i % 2 ? 150 : 150, y + 4, 12, n, { c: '#fff', a: 'middle' })}`).join('')}` },
    compo: { intro: 'WIN 40 RUPEES! Answer three questions about this issue. Easy if you read it. Impossible if you\'re Dave.',
      q: [['How many games does Jack want to review in 1999?', ['10', '100', '365', '1,000']],
        ['What did Mom say Jack\'s reindeer jumper is for?', ['School', 'Bed', 'Dave', 'Best']],
        ['How many planets are on this month\'s poster?', ['9', '8', '10', '7']]] },
  });

  // ================================================================ FEBRUARY
  M.add(2, {
    blurb: { editorial: 'Valentine\'s Day: a warning', reviews: 'Metal Gear Wobbly, Civic Chaos 3000, Alpha Centauri, Warlo Land II, A Bug\'s Strife', previews: 'Marlo Party, Ridge Wrecker Type 4, Driver', letters: 'Can you play games in a box?', cheats: 'MGS tips + Civic Chaos money', poster: 'Know your Blockology pieces', compo: 'Win 40 Rupees' },
    ed: `<p>February. Cold, dark, and it has Valentine's Day in it. A girl in our class gave Luke a card and he went the colour of a postbox. We have promised not to mention it. (I have mentioned it here. Sorry Luke.)</p>
      <p>But the BIG news: <b>Metal Gear Wobbly</b> is out at the end of the month, and it's the game I've been waiting for since I first read about it. I've saved up <b>£34.99</b> from pocket money and doing the car. Dad says if I spend that much on a game I have to finish it. Deal.</p>
      <p>Also: <i>A Bug's Strife</i> is out at the cinema here this month. The circus bugs are meant to be the best bit. Stay for the bloopers at the end, everyone says.</p>
      <p>This issue's poster is all seven Blockology pieces with their proper names, so you can win arguments in the playground. The long one is called <b>I</b>. Not "the long one". Not "the stick". I.</p>`,
    revIntro: 'A sneaky month. A soldier in a box, a mayor with a rubbish dump, and a man who loves treasure more than anything.',
    rev: [
      { g: 'Civic Chaos 3000', p: 'PC', d: '02-13', s: [84, 80, 90, 95], o: 89, v: 'The mayor will see you now.',
        t: ['You\'re the mayor and you build a whole city: roads, houses, shops, factories, power stations, water pipes, schools, the lot. Then the people move in and immediately start moaning about everything. Advisers pop up and tell you what you\'re doing wrong, and a news ticker runs along the bottom of the screen.',
          'You can make deals with the cities next door, like selling them your rubbish. You can also build famous landmarks. I built a massive city and then accidentally put the rubbish dump next to the school. The children complained. Fair enough.'],
        up: 'Massive cities. The news ticker. Landmarks.', dn: 'Rubbish. So much rubbish. The traffic jams.' },
      { g: 'Sid Mayer\'s Alpha Centauri', p: 'PC', d: '02-19', s: [78, 86, 92, 96], o: 90, v: 'One more turn. ONE more.', by: 'Callum (guest reviewer)',
        t: ['CALLUM HERE AGAIN. It\'s from the man who made Civilizzation, but in space. A colony ship crash-lands on a new planet and everyone splits into seven gangs who all want different things: some love nature, some love science, some love money. You build bases, invent things and try not to get eaten.',
          'The planet is ALIVE and doesn\'t like you very much. There are worms that make your soldiers scared. You can design your own units by picking the body, the weapons and the armour. I stayed up until 2am. Do not tell my mom.'],
        up: 'Designing your own units. The planet fighting back.', dn: 'Takes AGES. Not for people who like explosions.' },
      { g: 'Warlo Land II', p: 'GAME LAD COLOR', d: '02-25', s: [80, 82, 88, 86], o: 85, v: 'Wah-ha-ha!',
        t: ['Warlo is Marlo\'s evil (well, greedy) cousin, and in this game he CAN\'T DIE. Instead, baddies set him on fire, squash him flat, make him fat or turn him into a zombie, and you have to use those to solve the puzzles. Flat Warlo floats down like paper. Fat Warlo breaks floors.',
          'It\'s a colour version of a Game Lad game that came out last year, and there are loads of secret ways through the levels. A pirate lady has nicked all his treasure. He wants it back. That\'s the whole story. That\'s all you need.'],
        up: 'Can\'t die = no shouting. Loads of secrets. Very funny.', dn: 'A bit easy. Squashed Warlo is a bit TOO slow.' },
      { g: 'A Bug\'s Strife', p: 'PLAYSPACE', d: '02-26', s: [76, 74, 68, 62], o: 68, v: 'A bit of a bug.',
        t: ['The game of the film. You\'re Flick the ant, running around 3D levels collecting grain and seeds. Plant a seed and it grows into a plant you can climb or bounce on, and berries are your ammo. The levels look a lot like the film, with giant grass and leaves.',
          'But the camera keeps getting stuck behind blades of grass, and after a while it\'s just collect, collect, collect. Good if you\'re little or you LOVE the film. See the film first. The film is better.'],
        up: 'Looks like the film. Growing plants is clever.', dn: 'The camera. Samey. Short.' },
      { g: 'Metal Gear Wobbly', p: 'PLAYSPACE', d: '02-26', s: [92, 95, 93, 88], o: 92, v: 'Snake? Snake?! SNAAAAKE!', soon: 'I have saved up £34.99 for this.',
        t: ['IT\'S HERE. You\'re Soggy Snake and you sneak into a snowy base on an island called Shadow Moss. You\'re not meant to fight everyone: you hide, crawl under things, knock on walls to distract guards and, best of all, hide inside a cardboard box. When a guard sees you a big red ! pops up over his head and you PANIC.',
          'There are loads of talking bits on the radio (the Codec) and the story is like a film. Two discs! The boss fights are the cleverest I\'ve ever seen. One boss reads your memory card and talks about the OTHER games you\'ve saved. I am not even joking. Also the man who gives you the frequency for a character says it\'s on the back of the CD box. It IS on the back of the CD box.'],
        up: 'The box. The bosses. The story. Feels like a film.', dn: 'Over too quickly. Loads of talking. The torture bit made my hand hurt.' },
    ],
    pre: [
      { g: 'Marlo Party', p: 'ULTRA 64', when: 'March', hype: 82, t: 'Out next month! Six characters (Marlo, Louie G, Pear, Yosher, Warlo and Donkey Wrong) on giant board games. Loads of mini-games. Bring three friends and a lot of patience.' },
      { g: 'Ridge Wrecker Type 4', p: 'PLAYSPACE', when: 'Spring', hype: 78, t: 'The new Ridge Wrecker. The pictures look like photos. Callum says the cars drift round corners like they\'re on ice. I said that sounds dangerous. He said that is the POINT.' },
      { g: 'Driver', p: 'PLAYSPACE', when: 'Summer', hype: 85, t: 'You\'re a getaway driver in old American cities, like in a 70s police film. You get chased by the police. Lots. The cars bounce on their springs and the hubcaps fly off. Looks amazing.' },
    ],
    let: [
      { from: 'Callum', how: 'by e-mail (from his PC, which is better than yours, he says)', t: 'Jack. Can you actually hide in a cardboard box in Metal Gear Wobbly or is that a joke? Because I tried it in real life at school and {teacher2} found me in the PE cupboard in about four seconds. Callum', r: 'It is REAL. In the game the guards walk right past you. In real life {teacher2} is too clever. Also you were in a box that said "BIBS" on it.' },
      { from: '{club4}', how: 'by e-mail', t: 'Dear Jack, I made a Civic Chaos with no roads. Nobody moved in. Why? From {club4}', r: 'People need roads to get to their houses, {club4}! Or they won\'t move in. That\'s the first rule of Civic Chaos. The second rule is put the power station far away from everything.' },
      { from: 'Dave', how: 'on the back of a crisp packet', t: 'jack. luke got a valentines card. i got one too. it was from my nan. dave', r: 'That counts, Dave. That definitely counts.' },
    ],
    ch: [
      { g: 'Metal Gear Wobbly', p: 'PLAYSPACE', t: 'When you meet the boss who can read your mind, plug your controller into <b>port 2</b>. He can\'t read it any more. Also: Meryl\'s radio frequency really is on the back of the CD box. Look at the screenshots.' },
      { g: 'Civic Chaos 3000', p: 'PC', t: 'Hold down <b>Ctrl + Alt + Shift</b> and press <b>C</b>. A box pops up. Type <b>I am weak</b> and everything is free. You will feel guilty. Do it anyway.' },
      { g: 'Squirms Armageddon', p: 'PC', t: 'Do the training missions and you unlock extra stuff in the options. Getting all the gold medals is very, very hard. I have one. It\'s a start.' },
      { g: 'Rogue Squadrilla', p: 'ULTRA 64', t: 'On the snowspeeder level, go round the AT-ET\'s legs THREE times with the tow cable. Not two. Three. Then let go.' },
    ],
    poster: { title: 'KNOW YOUR TETROMINOES', col: '#101040', cap: 'The seven Blockology pieces are called tetrominoes (four squares each!) and they all have letter names. Learn them. Win arguments.',
      svg: `<rect width="300" height="400" fill="#101040"/><g stroke="#0a0a2a" stroke-width="1">${Array.from({ length: 20 }, (_, i) => `<path d="M0 ${i * 20}h300M${i * 20} 0v400" stroke="#1a1a5a"/>`).join('')}</g>${T(150, 40, 28, 'KNOW YOUR', { c: '#ffd400' })}${T(150, 72, 30, 'TETROMINOES', { c: '#fff' })}${[
        ['I', '#00e5ff', [[0, 0], [1, 0], [2, 0], [3, 0]], 30, 100], ['O', '#ffd400', [[0, 0], [1, 0], [0, 1], [1, 1]], 190, 100], ['T', '#b040e0', [[0, 0], [1, 0], [2, 0], [1, 1]], 30, 170], ['S', '#3ad03a', [[1, 0], [2, 0], [0, 1], [1, 1]], 170, 170],
        ['Z', '#e10600', [[0, 0], [1, 0], [1, 1], [2, 1]], 30, 250], ['J', '#2a5ad8', [[0, 0], [0, 1], [1, 1], [2, 1]], 170, 250], ['L', '#ff8a00', [[2, 0], [0, 1], [1, 1], [2, 1]], 90, 320]].map(([n, c, cells, x, y]) =>
        cells.map(([cx, cy]) => `<rect x="${x + cx * 22}" y="${y + cy * 22}" width="22" height="22" fill="${c}" stroke="#000" stroke-width="2"/><rect x="${x + cx * 22 + 3}" y="${y + cy * 22 + 3}" width="6" height="6" fill="#fff" opacity=".5"/>`).join('') + T(x + 100 > 290 ? x - 14 : x + 104, y + 30, 26, n, { c, a: 'middle' })).join('')}` },
    compo: { intro: 'WIN 40 RUPEES! Three questions about the February issue. The long Blockology piece is a clue to one of them.',
      q: [['How much has Jack saved up for Metal Gear Wobbly?', ['£19.99', '£29.99', '£34.99', '£39.99']],
        ['What is the long Blockology piece called?', ['I', 'L', 'Stick', 'J']],
        ['Who sent Dave his Valentine\'s card?', ['{kidVal}', 'His nan', 'Luke', '{teacher2}']]] },
  });

  // ================================================================ MARCH
  M.add(3, {
    blurb: { editorial: 'Red Nose Day + a balloon', reviews: 'Marlo Party, Rollcrate, Z-Wing Alliance, Wartone 2100', previews: 'RollerCoaster Rupeecoon, Ridge Wrecker Type 4, Imperfect Dark', letters: 'Blisters. So many blisters.', cheats: 'Marlo Party survival guide', poster: 'Build-a-Bot blueprint', compo: 'Win 40 Rupees' },
    ed: `<p>MARCH! Spring is here, apparently, although it is raining so hard that Gubbinz won't go outside.</p>
      <p>Two things this month. One: <b>Red Nose Day</b> is on <b>Friday 12 March</b>. Our school is doing a non-uniform day for 50p and I'm going as a Space Cadet (a dressing gown and a torch with a tube on it). Two: two men are trying to fly round the WHOLE WORLD in a balloon without stopping, and they set off today. If they do it, they'll be the first ever. I've stuck a map on my wall to follow them.</p>
      <p>Also, Marlo Party is out, which means I'm going to need plasters. You'll see why.</p>
      <p>Mom says I spend too long on the computer. I said I'm working on a magazine, which is basically a job. She said a job pays money. I said that's what the 20p cover price is for. She said I have sold three copies. All to Dave. He keeps losing them.</p>`,
    revIntro: 'Party games, upside-down cars and the Battle of Endoor. A very good month.',
    rev: [
      { g: 'Marlo Party', p: 'ULTRA 64', d: '03-09', s: [78, 80, 86, 84], o: 80, v: 'Bring plasters.',
        t: ['It\'s a board game in your ULTRA 64. Four players go round a board, roll a dice block, land on spaces, and every turn there\'s a mini-game where you all fight for coins. Coins buy stars, and whoever has the most stars at the end wins. Then you all argue about it.',
          'There are tons of mini-games and most of them are great. But some of them make you spin the control stick round and round as fast as you can, and if you do it with your palm it HURTS. Luke has a blister. Dave has two. I have been doing it with my thumb, like Mom said.'],
        up: 'Four-player chaos. Stealing stars. Mini-games.', dn: 'Blisters. Losing a star to a Boo on the last turn. Being Dave.' },
      { g: 'Rollcrate', p: 'PLAYSPACE', d: '03-12', s: [86, 88, 84, 78], o: 84, v: 'Which way is up?',
        t: ['Racing cars with massive wheels that can drive on the walls AND the ceiling. If you flip over, you just keep going upside down. You fire rockets at the cars in front and you can blow up the buildings so they fall onto the track in front of the people behind you.',
          'It goes really, really fast, which is brilliant but also means I spend a lot of time driving into walls and not knowing which way is up. The music is loud and dancey. Mom asked me to turn it down three times.'],
        up: 'Driving on the ceiling. Knocking buildings over. Speed.', dn: 'Easy to get lost. Hard to see where the track goes.' },
      { g: 'Intergalactic Battles: Z-Wing Alliance', p: 'PC', d: '03-26', s: [86, 94, 90, 90], o: 91, v: 'This is where the fun begins.', by: 'Jack (on Callum\'s PC)',
        t: ['A space flight game on the PC where you\'re a pilot from a family that moves cargo round the galaxy, until the Empire turns up and you join the Rebels. You fly from the cockpit with loads of buttons for shields and lasers, and it feels like being in the films.',
          'The best bit: you get to fly the Millennium Pigeon into the second Dread Scone at the Battle of Endoor. With Callum\'s joystick. I didn\'t breathe for the whole level. Needs a fast PC and a joystick, and you need to read the manual. Yes, the whole manual.'],
        up: 'The Falcon. The Battle of Endoor. Intergalactic Battles sounds.', dn: 'Hard. LOADS of keys to learn. Our PC is too slow.' },
      { g: 'Wartone 2100', p: 'PC', d: '03-26', s: [82, 78, 88, 90], o: 86, v: 'Build it, then build a better one.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: a strategy game where the world has gone wrong and you rebuild it, with a base and an army. The cool bit is that you DESIGN your vehicles. Pick a body, pick wheels or tracks or hover, pick a weapon, and the factory makes it.',
          'It\'s all in 3D so you can spin the camera round. The research tree is massive. It\'s by a British company, which Jack says I have to mention because he mentions it every time. There. Mentioned.'],
        up: 'Designing tanks. Massive research tree. 3D camera.', dn: 'Gets very hard. Lots of clicking.' },
    ],
    pre: [
      { g: 'RollerCoaster Rupeecoon', p: 'PC', when: 'April', hype: 80, t: 'Build a theme park and design your own rollercoasters, loop by loop. Then watch the little people ride them. Some of them will be sick. Made by the man who made Transport Typhoon.' },
      { g: 'Ridge Wrecker Type 4', p: 'PLAYSPACE', when: 'April', hype: 75, t: 'Out next month, and the screenshots STILL look like photos. Callum says the intro is better than most films. Callum has not seen most films.' },
      { g: 'Imperfect Dark', p: 'ULTRA 64', when: 'When it\'s ready', hype: 95, t: 'From the people who made Goldenballs! You\'re a secret agent called Joanna Murk in the future. That\'s all anyone knows. I have read everything about it, which took four minutes.' },
    ],
    let: [
      { from: 'Luke', how: 'by e-mail (typed with one hand)', t: 'JACK. I have a blister from Marlo Party. My mom put a plaster on it and said I am banned from the paddle game. Is there a way to win without spinning the stick? Luke', r: 'Use your thumb, not your palm! And remember, the board is worth more than the mini-games. Stars win, not coins. See Cheats Corner. Get well soon, soldier.' },
      { from: 'JackK', how: 'by e-mail', t: 'Jack, it\'s JackK. Did you know there are two men in a balloon trying to go round the world? I am following them on the news every night. My dad says balloons can\'t steer. How do they steer?? JackK', r: 'They go up and down to find winds going the right way! Clever. I\'m following them on my map too. Let\'s see who gets bored first. (It won\'t be me.)' },
      { from: 'Ms Pinto', how: 'by e-mail', t: 'Hello Jack, I am a teacher and some of my class read your magazine. Please could you put more spelling in it? Thank you!', r: 'Hello Miss! This issue has 4,102 words in it, all spelt right (I used the spell checker). Except "Gubbinz". That\'s his name.' },
    ],
    ch: [
      { g: 'Marlo Party', p: 'ULTRA 64', t: 'SURVIVAL GUIDE: <b>1.</b> Thumb, not palm. <b>2.</b> Save your coins for stars (they cost 20). <b>3.</b> Avoid Boo if you\'re winning. <b>4.</b> Never, ever let Dave hold the controller with the good stick.' },
      { g: 'Rollcrate', p: 'PLAYSPACE', t: 'If you\'re lost, follow the arrows on the walls. They point the way even when you\'re upside down. Also, shoot the buildings right after you pass them, not before.' },
      { g: 'Metal Gear Wobbly', p: 'PLAYSPACE', t: 'Finish the game and you get a different prize depending on how you got through the torture bit. One ending gives you a bandana with infinite ammo. The other gives you stealth camouflage. Play it twice!' },
      { g: 'Lingo\'s Awakening DX', p: 'GBC', t: 'The colour dungeon is near the graveyard. Push the gravestones in the right order. (Hint: there\'s a book in the library that tells you.)' },
    ],
    poster: { title: 'BUILD-A-BOT BLUEPRINT', col: '#0a2a6a', cap: 'Design your own fighting robot! Wedge at the front, armour all round, wheels you can\'t knock off. Draw yours and send it in.',
      svg: `<rect width="300" height="400" fill="#0a3a8a"/>${Array.from({ length: 16 }, (_, i) => `<path d="M0 ${i * 25}h300${i < 12 ? `M${i * 25} 0v400` : ""}" stroke="#2a5ab0" stroke-width="1"/>`).join('')}${T(150, 42, 30, 'BUILD-A-BOT', { c: '#fff' })}${T(150, 64, 14, 'TOP SECRET BLUEPRINT No. 99', { c: '#9fd0ff', f: 'Courier New,monospace' })}<g fill="none" stroke="#fff" stroke-width="3"><path d="M60 250 L90 160 H210 L240 250 Z"/><rect x="110" y="180" width="80" height="44"/><circle cx="95" cy="262" r="22"/><circle cx="205" cy="262" r="22"/><path d="M60 250 L30 270 H90"/><path d="M150 160 V120 M130 120 h40 M150 120 l-30 -20 M150 120 l30 -20"/></g><g fill="#fff" font-family="Courier New,monospace" font-size="11">${[[30, 300, 'A: WEDGE (flip them!)'], [30, 318, 'B: ARMOUR (lots)'], [30, 336, 'C: WHEELS (x2, fat ones)'], [30, 354, 'D: SPINNY THING ON TOP'], [30, 372, 'E: BATTERIES (from the remote)']].map(([x, y, t]) => `<text x="${x}" y="${y}">${t}</text>`).join('')}</g><g fill="#ffd400" font-family="Arial Black,Arial" font-size="14">${[[44, 266, 'A'], [140, 206, 'B'], [88, 300, 'C'], [184, 116, 'D']].map(([x, y, t]) => `<text x="${x}" y="${y}">${t}</text>`).join('')}</g>` },
    compo: { intro: 'WIN 40 RUPEES! Three questions on the March issue. Put your blister plaster on first.',
      q: [['What day is Red Nose Day this year?', ['Monday 1 March', 'Saturday 20 March', 'Sunday 14 March', 'Friday 12 March']],
        ['How much does a star cost in Marlo Party?', ['10 coins', '20 coins', '50 coins', '100 coins']],
        ['Who has Jack sold all his copies of the mag to?', ['Mom', 'Luke', 'Dave', 'Ms Pinto']]] },
  });

  // ================================================================ APRIL
  M.add(4, {
    blurb: { editorial: 'Easter eggs (real and in games)', reviews: 'RollerCoaster Rupeecoon, Ridge Wrecker Type 4, Bust-A-Grin 4, Road Challenge, Call to Power, Micro Mechanics 64', previews: 'Castlevanilla, Driver, Dungeon Keepa 2', letters: 'The balloon made it!', cheats: 'Name your guests', poster: 'The Ultimate Rollercoaster', compo: 'Win 40 Rupees' },
    ed: `<p>THE BALLOON MADE IT! The two men in the balloon went all the way round the world without stopping and landed in Egypt. My map is covered in red pen. I'm going to keep it forever.</p>
      <p>It's the Easter holidays so I have eaten six Easter eggs and I feel a bit funny. Speaking of Easter eggs: in games, an "Easter egg" means a hidden secret the people who made it put in. This issue has a special Cheats Corner all about them. My favourite: in RollerCoaster Rupeecoon you can name the people in your park, and some names do special things.</p>
      <p>April is HUGE for games: six reviews this month! And I didn't even fall for any April Fools. (Dave told me they were making a Goldenballs 2 where you play as Oddbob. I knew it was a joke because Oddbob is NOT ALLOWED.)</p>`,
    revIntro: 'Six reviews! April is when everything comes out at once, like buses.',
    rev: [
      { g: 'Civilizzation: Call to Power', p: 'PC', d: '04-02', s: [76, 74, 84, 92], o: 83, v: 'From cavemen to space cities.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: like Civilizzation, where you start with one city in the stone age and try to build the greatest civilisation ever. But this one keeps going into the FUTURE, with cities under the sea and in space.',
          'There are some really odd units, like lawyers who can tie up your enemy\'s cities and TV preachers who convert them. It takes ages to get to the future bits. Worth it for the space cities.'],
        up: 'Space cities! Sea cities! Weird units.', dn: 'The start is slow. Menus everywhere.' },
      { g: 'Need for Speed: Road Challenge', p: 'PLAYSPACE', d: '04-02', s: [86, 84, 84, 82], o: 84, v: 'Pull over, sunshine.',
        t: ['Fast, posh cars on long roads through mountains and towns, and this time the police are after you with sirens and roadblocks. The cars get dented and scratched when you crash, which is new, and in the career you have to pay to fix them. Dad says that\'s just like real life.',
          'Two-player split screen is good fun. Luke drove the whole race in reverse to "see what happened". What happened is he came last.'],
        up: 'Police chases. Proper damage. Gorgeous cars.', dn: 'Paying for repairs. Crashing into a police car on purpose (Luke).' },
      { g: 'RollerCoaster Rupeecoon', p: 'PC', d: '04-12', s: [82, 76, 94, 95], o: 89, v: 'Guests are complaining about the vomit.',
        t: ['Build a theme park! Put down rides, shops, toilets and paths, hire cleaners and mechanics, and design your own rollercoasters bit by bit: lift hill, drop, loop, corkscrew, the lot. Then watch the tiny people ride them and see if they scream with joy or are sick on the path.',
          'Everything has little numbers you can check, like how scary a ride is and how hungry everyone is. I built a coaster so extreme that nobody would get on it. So I built a bigger one. Then I opened the park and charged £1 for an umbrella when it rained. Genius.'],
        up: 'Designing coasters. Watching people. So much to do.', dn: 'Vomit. Vandals. Queues that go on for MILES.' },
      { g: 'Bust-A-Grin 4', p: 'PLAYSPACE', d: '04-15', s: [74, 82, 90, 92], o: 87, v: 'Pop! Pop! Pop!',
        t: ['You fire coloured bubbles up into a pile of bubbles, and if three of the same colour touch they pop. That\'s it. That\'s the whole game. It is IMPOSSIBLE to put down.',
          'New this time: some levels have two piles hanging off a pulley, so if you pop bubbles on one side the other side drops down. And chain reactions, where popping one lot makes others fall into place. Two-player is the best: every time you pop loads, your mate gets extra bubbles. Revenge!'],
        up: 'Simple. Addictive. Two-player revenge.', dn: 'The music gets stuck in your head for DAYS.' },
      { g: 'Ridge Wrecker Type 4', p: 'PLAYSPACE', d: '04-16', s: [94, 90, 86, 84], o: 88, v: 'Sideways is the fast way.',
        t: ['The most beautiful racing game on the PlaySpace, end of argument. You pick a team and race through a story across a whole season, and the cars slide round every corner in massive drifts that look so cool.',
          'The tracks go through cities at sunset and at night with all the lights on. The music is very cool and very jazzy. There are LOADS of cars to unlock. Luke says it\'s not realistic because nobody drives sideways. I said that\'s what makes it good.'],
        up: 'Drifting. Night-time city. Unlocking cars.', dn: 'Only a few tracks. Some races are too easy.' },
      { g: 'Micro Mechanics 64 Turbo', p: 'ULTRA 64', d: '04-23', s: [76, 72, 92, 94], o: 88, v: 'Eight people. One telly. Chaos.',
        t: ['Tiny cars racing round giant kitchen tables, pool tables, gardens and school desks. The camera is from above, and if you fall too far behind you\'re out. Made by Codemonsters, who are British (I\'ve started saying this every time, sorry).',
          'The best thing: up to EIGHT people can play at once, because two people can share one controller, one on the left side and one on the right. We did it at Luke\'s. It was the loudest room in the country.'],
        up: 'Eight players! The breakfast table track. Tiny cars.', dn: 'Elbows. You will get elbowed.' },
    ],
    pre: [
      { g: 'Castlevanilla', p: 'ULTRA 64', when: 'May', hype: 70, t: 'The vampire-hunting series goes 3D. You can be a man with a whip or a girl with magic. There\'s a castle. You can probably guess the rest.' },
      { g: 'Driver', p: 'PLAYSPACE', when: 'Summer', hype: 88, t: 'Still coming. Still looks unbelievable. Four cities, a police force that hates you, and a film director mode where you can make replays of your chases.' },
      { g: 'Dungeon Keepa 2', p: 'PC', when: 'Summer', hype: 72, t: 'You\'re the baddie! You dig out a dungeon, attract monsters to live in it and try to stop the heroes stealing your gold. Callum says the first one was the best thing ever. Also British (sorry).' },
    ],
    let: [
      { from: 'JackK', how: 'by e-mail', t: 'Jack!!! The balloon did it!!! Bertram Piccaro and Brian Jonas!!! They landed in Egypt!!! My map is FULL!!! JackK', r: 'MINE TOO!!! Nearly 20 days in a balloon. I can\'t even sit still in a car for 20 minutes. Heroes.' },
      { from: 'Dave', how: 'in the playground', t: 'jack i built a rollercoaster in rollercoaster rupeecoon that doesnt finish. it just goes up and off the end. is that allowed. dave', r: 'It is NOT allowed, Dave. Those people had paid for a ticket.' },
      { from: 'Emma', how: 'by e-mail', t: 'Dear Jack, can you do a review of a game for girls? From Emma', r: 'Every game in this mag is for girls! And boys. And Mom (she\'s very good at Bust-A-Grin). But tell me which games YOU like and I\'ll review more of those. Deal?' },
    ],
    ch: [
      { g: 'RollerCoaster Rupeecoon', p: 'PC', t: 'EASTER EGG: name one of your guests <b>Chris Sawyerr</b> (he made the game) and he walks around taking photos. Some other names do special things too. Try your mates\' names. (Not Dave. Dave falls in the lake.)' },
      { g: 'Civic Chaos 3000', p: 'PC', t: 'Sell your rubbish to the city next door. They pay you for it! (Then they get annoyed and stop. Then you do it again.)' },
      { g: 'Ridge Wrecker Type 4', p: 'PLAYSPACE', t: 'Drift by letting go of the accelerator just as you turn, then put your foot down again. Practise on the first corner of the first track until it feels right.' },
      { g: 'Bust-A-Grin 4', p: 'PLAYSPACE', t: 'Bounce your shots off the walls to reach bubbles round corners. The best players never fire straight up.' },
    ],
    poster: { title: 'THE ULTIMATE ROLLERCOASTER', col: '#5a2a8a', cap: 'Designed by me. Lift hill, a vertical drop, two loops, a corkscrew and a splash at the end. Height restriction: you must be taller than Gubbinz.',
      svg: `<rect width="300" height="400" fill="#9fd8ff"/><circle cx="250" cy="60" r="28" fill="#fff36a"/><rect y="340" width="300" height="60" fill="#3a9a3a"/>${T(150, 40, 24, 'THE ULTIMATE', { c: '#e10600', st: '#fff', sw: 4 })}${T(150, 70, 24, 'ROLLERCOASTER', { c: '#e10600', st: '#fff', sw: 4 })}<path d="M10 330 L60 110 L80 330 C90 240 150 240 150 280 C150 320 110 320 110 280 C110 240 170 220 200 260 C230 300 190 320 190 290 C190 250 260 240 290 330" fill="none" stroke="#e10600" stroke-width="8"/><path d="M10 330 L60 110 L80 330 C90 240 150 240 150 280 C150 320 110 320 110 280 C110 240 170 220 200 260 C230 300 190 320 190 290 C190 250 260 240 290 330" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 7"/><g stroke="#666" stroke-width="3">${[30, 45, 60, 100, 170, 240, 270].map(x => `<path d="M${x} 340 V${x < 61 ? 330 - (x - 10) * 4.4 : 300}"/>`).join('')}</g><path d="M240 360 q20 -20 40 0" fill="#2a7ad8"/><g font-family="Arial Black,Arial" font-size="11" fill="#000"><text x="66" y="104">DROP!</text><text x="118" y="232">LOOP 1</text><text x="176" y="236">LOOP 2</text><text x="230" y="372">SPLASH!</text></g>` },
    compo: { intro: 'WIN 40 RUPEES! Three questions about the April issue. No April Fools in the answers, promise.',
      q: [['Where did the round-the-world balloon land?', ['Egypt', 'Switzerland', 'America', 'Australia']],
        ['Which guest name makes someone walk round taking photos in RollerCoaster Rupeecoon?', ['Dave', '{teacher2}', 'Chris Sawyerr', 'Gubbinz']],
        ['How many Easter eggs did Jack eat?', ['Two', 'Four', 'Ten', 'Six']]] },
  });

  // ================================================================ MAY
  M.add(5, {
    blurb: { editorial: 'Intergalactic Battles is out (in America)', reviews: 'Castlevanilla, Starsiege: Tribbles, Rampage 2, Cricket World Cup 99, Pitstall', previews: 'Episode I Racer, Driver, Ape Escapade', letters: 'Spoilers are banned', cheats: 'The no-spoiler zone', poster: 'Round the world in 20 days', compo: 'Win 40 Rupees' },
    ed: `<p>This is the month. <b>Intergalactic Battles Episode I: The Phantom Nuisance</b> comes out in America on <b>19 May</b>. Over here we have to wait until <b>16 July</b>. That is NINE WEEKS of avoiding spoilers. I have told everyone: if you know anything, do not tell me. I will put my fingers in my ears and hum the music.</p>
      <p>The Cricket World Cup starts here in England on 14 May too, so Dad is happy, and there's a cricket game to review. And May is usually quiet for games, so this issue is a bit of a mixed bag: vampires, giant monsters, a jungle and some jetpacks.</p>
      <p>On the poster this month: the balloon that went all the way round the world in March. I couldn't stop thinking about it, so I drew it.</p>`,
    revIntro: 'A quiet month for games, so I played EVERYTHING. Even the cricket.',
    rev: [
      { g: 'Cricket World Cup 99', p: 'PC', d: '05-01', s: [76, 70, 74, 78], o: 74, v: 'Howzat!',
        t: ['The official game of the Cricket World Cup, which is being played in England this summer. All the teams are in it. You bat by picking which way to hit the ball and when, and you bowl by picking where it lands and how fast.',
          'Dad loved it. Dad played a whole one-day match and I had to bring him his tea at the computer. I got bowled out third ball and went to play Worms. It\'s good if you love cricket. If you don\'t, it is a LOT of cricket.'],
        up: 'All the teams. Dad. It\'s on during the real World Cup.', dn: 'Long. Very long. Very, very long.' },
      { g: 'Castlevanilla', p: 'ULTRA 64', d: '05-14', s: [78, 86, 74, 76], o: 76, v: 'Vampire killer, camera filler.',
        t: ['You go into Dracula\'s castle to defeat him, either as a man with a whip or a girl who does magic. It\'s all in 3D now, with skeletons, giant monsters and the creepiest music I\'ve heard. It has day and night, and some things only happen at certain times.',
          'But the camera is a nightmare and the jumping is fiddly, so I fell off a LOT of ledges. When it works it\'s spooky and great. I played it with the lights on. Not because I was scared. Because it was dark.'],
        up: 'The music. Spooky castle. Two characters.', dn: 'The camera. Falling off things. More falling off things.' },
      { g: 'Starsiege: Tribbles', p: 'PC', d: '05-14', s: [80, 82, 92, 94], o: 90, v: 'Jetpacks make everything better.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: a team shooting game you play on the Internet with LOADS of people. Everyone has a jetpack. The maps are giant outdoor hills, and teams play capture the flag.',
          'The best trick: run down a hill, hold jump, and you slide down the slope really fast like you\'re skiing, then jetpack at the bottom and fly across the whole map. My dad got the phone bill. I am now only allowed to play after 6pm when it\'s cheaper.'],
        up: 'Jetpacks. Skiing down hills. Teamwork.', dn: 'Needs the Internet. The PHONE BILL.' },
      { g: 'Rampage Too: Universal Tour', p: 'ULTRA 64', d: '05-21', s: [70, 68, 76, 66], o: 70, v: 'Smash. Eat. Smash. Repeat.',
        t: ['Giant monsters climb up buildings and punch them until they fall down. Three new monsters (a giant rat, a rhino and a lobster) have to rescue the three monsters from the old game who have been locked up. You travel round the world smashing famous cities.',
          'It\'s brilliant for about twenty minutes with three people, punching each other off buildings. Then you realise every level is the same. Good for a laugh at a sleepover.'],
        up: 'Three-player smashing. Eating people who throw things at you.', dn: 'Same every level. Gets boring.' },
      { g: 'Pitstall: Beyond the Jungle', p: 'GAME LAD COLOR', d: '05-28', s: [80, 74, 74, 72], o: 75, v: 'Swing, jump, fall in pit.',
        t: ['A jungle adventure where you run, jump and swing on vines, like the very old Pitstall that my dad played when he was a kid.',
          'It\'s quite hard and the jumping takes practice. Looks great in colour. Dad picked it up and said "is this the same Pitstall?" and then didn\'t give it back for an hour.'],
        up: 'Looks good. Swinging on vines. Dad nostalgia.', dn: 'Hard. Falling into pits (it\'s in the name).' },
    ],
    pre: [
      { g: 'Intergalactic Battles Episode I: Racer', p: 'ULTRA 64 / PC', when: 'June (out in America in May)', hype: 97, t: 'The peapod race from the new film, as a game! Two giant engines, a little seat on a cable, and you go round desert canyons at hundreds of miles an hour. It comes out on the ULTRA 64 and PC. I am going to be very good at this.' },
      { g: 'Driver', p: 'PLAYSPACE', when: 'June', hype: 90, t: 'Getting close now! The magazines say the cars handle just like big old 70s cars: bouncy, sideways, and hubcaps everywhere.' },
      { g: 'Ape Escapade', p: 'PLAYSPACE', when: 'Summer', hype: 78, t: 'Monkeys have escaped and you catch them with a net. You need the controller with two sticks to play it (one to move, one to swing your stuff around). Looks bonkers.' },
    ],
    let: [
      { from: 'Luke', how: 'by e-mail', t: 'Jack, my cousin in America has seen the new Intergalactic Battles and he has e-mailed me what happens. Do you want me to tell you? Luke', r: 'NO! NO! NO! Delete the e-mail. Delete your cousin. (Don\'t delete your cousin.) SPOILERS ARE BANNED UNTIL 16 JULY. This is official JACK ATTACK! policy.' },
      { from: 'Callum', how: 'by e-mail', t: 'Jack, my dad says if I go on the Internet before 6pm again he is cancelling it. I said I was doing homework. He said "on a jetpack?" Callum', r: 'Fair point from your dad there, Callum.' },
      { from: 'Mom', how: 'on a note on the fridge', t: 'Jack. Bins are out on Thursday. Room, tidy, please. Love Mom. PS: I like the magazine.', r: 'Thanks Mom! (Room tidied. Mostly. The BLOCKO is still on the floor but it is ORGANISED on the floor.)' },
    ],
    ch: [
      { g: 'Starsiege: Tribbles', p: 'PC', t: '<b>Skiing</b>: run down a slope and keep tapping jump. You speed up instead of slowing down. Jetpack at the bottom of the hill to fly up the next one.' },
      { g: 'Marlo Party', p: 'ULTRA 64', t: 'Visit Boo when someone else is winning. He\'ll steal coins for you for free, or a whole STAR if you\'ve got 50 coins to pay him. Then hide behind the sofa.' },
      { g: 'Squirms Armageddon', p: 'PC', t: 'The Concrete Donkey falls from the sky and smashes straight down through everything. Save it for a worm that\'s hiding deep in a cave.' },
      { g: 'Castlevanilla', p: 'ULTRA 64', t: 'Pick up every bit of meat you find. Seriously. You\'ll need it. Also, when the camera goes funny, stop moving and let it catch up.' },
    ],
    poster: { title: 'ROUND THE WORLD IN 20 DAYS', col: '#0a5aa8', cap: 'Breitlung Orbiter 3: the first balloon EVER to fly all the way round the world without stopping. Bertram Piccaro and Brian Jonas took off from Switzerland on 1 March 1999 and landed in Egypt on 21 March, after 19 days, 21 hours and 55 minutes. Legends.',
      svg: `<rect width="300" height="400" fill="#3a9ae8"/><rect y="250" width="300" height="150" fill="#1a5ab8"/><g fill="#3ab03a" opacity=".85"><path d="M10 270 q30-20 60 0 t50 10 v20 h-110z"/><path d="M150 290 q40-30 80-10 t60 0 v30 h-140z"/><path d="M40 340 q30-10 50 5 t40 0 v20 h-90z"/></g><path d="M20 300 C80 240 220 240 280 300" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/>${T(150, 40, 22, 'ROUND THE WORLD', { c: '#fff', st: '#003', sw: 3 })}${T(150, 66, 22, 'IN 20 DAYS!', { c: '#ffd400', st: '#003', sw: 3 })}<g transform="translate(150 150)"><ellipse rx="44" ry="60" fill="#f0f0f0" stroke="#999" stroke-width="2"/><path d="M-44 -6 h88" stroke="#c0c0c0" stroke-width="6"/><path d="M-30 -48 q30 -20 60 0" stroke="#d0d0d0" stroke-width="5" fill="none"/><path d="M-20 56 L-12 84 M20 56 L12 84" stroke="#555" stroke-width="2"/><rect x="-14" y="84" width="28" height="18" fill="#e8e8e8" stroke="#555" stroke-width="2"/><circle cx="-6" cy="93" r="3" fill="#2a7ad8"/><circle cx="6" cy="93" r="3" fill="#2a7ad8"/></g><g font-family="Arial Black,Arial" font-size="11" fill="#fff"><text x="14" y="388">1 MARCH: SWITZERLAND</text><text x="190" y="388">21 MARCH: EGYPT</text></g>` },
    compo: { intro: 'WIN 40 RUPEES! Three questions about the May issue. No spoilers in the questions, I promise.',
      q: [['When does The Phantom Nuisance come out in the UK?', ['19 May', '16 July', '1 June', '25 December']],
        ['When is Callum allowed on the Internet now?', ['After 6pm', 'Before school', 'Only at weekends', 'Never']],
        ['Where did the round-the-world balloon take off from?', ['Egypt', 'England', 'Switzerland', 'America']]] },
  });

  // ================================================================ JUNE
  M.add(6, {
    blurb: { editorial: 'Peapodracing + exams', reviews: 'Episode I Racer, The Phantom Nuisance, Midtown Badness, Driver, Dungeon Keepa 2, V-Ralley 2', previews: 'Ape Escapade, Donkey Wrong 64, Imperfect Dark', letters: 'The car park of gloom', cheats: 'Driver survival', poster: 'Peapodracer cut-away', compo: 'Win 40 Rupees' },
    ed: `<p>June: exams, sunshine and the best month for games EVER. Peapodracing on the 4th! Driver at the end of the month! I have a maths test in the middle. Priorities.</p>
      <p>The Intergalactic Battles games are out before the film here, so I've had to play The Phantom Nuisance on the PC with my eyes half shut to avoid spoilers. I can confirm: there is a peapod race. I'd already guessed that from the other game.</p>
      <p>Also, Ultra Entertainment showed loads of new games at the big games show in America last month, including a new <b>Donkey Wrong</b> game for Christmas. See Previews!</p>
      <p>Big thanks to everyone who wrote in about the balloon poster. Ten of you said you've stuck it on your ceiling. One of you stuck it on your dog. (Please don't stick things on dogs.)</p>`,
    revIntro: 'The big summer games are here. Pods, cop cars and a Horned Reaper.',
    rev: [
      { g: 'Intergalactic Battles Episode I: Racer', p: 'ULTRA 64 / PC', d: '06-04', s: [91, 88, 90, 82], o: 90, v: 'Now THIS is peapodracing!',
        t: ['You race peapodracers (two huge engines pulling a little seat) round tracks on lots of different planets, against loads of aliens. It is SO fast. You win prize money and buy new parts from a grumpy junk dealer, and your little pit droids fix your pod between races.',
          'You can overheat your engines by boosting too long, and if you scrape a wall too much an engine catches fire and you have to hold a button to repair it while you\'re still racing. With the Expansion Pouch it looks better on the ULTRA 64 too. I\'m going to play it until the film comes out. Then I\'m going to play it more.'],
        up: 'The SPEED. Buying parts. Two-player.', dn: 'Exploding into a canyon wall at 600mph. Every time. Every single time.' },
      { g: 'Intergalactic Battles Episode I: The Phantom Nuisance', p: 'PC', d: '06-04', s: [70, 84, 66, 60], o: 68, v: 'Good film, OK game, great lightspatula.',
        t: ['The film as a game, viewed from above and behind, where you play as the heroes walking through the story. You talk to lots of people and then sometimes there\'s a lightspatula fight or a shoot-out.',
          'Bouncing blaster shots back with the lightspatula is great. But you spend a lot of time looking for things and talking, and the jumping is hard. Careful: it tells you the story of the film, so if you haven\'t seen it, wait!'],
        up: 'Being a Space Cadet. lightspatula deflecting.', dn: 'Loads of talking. Spoils the film. Jumping.' },
      { g: 'Midtown Badness', p: 'PC', d: '06-04', s: [84, 78, 88, 90], o: 87, v: 'Rush hour, every hour.', by: 'Jack (on Callum\'s PC)',
        t: ['You drive round a whole American city (Chicago) with real traffic, trains going overhead and people walking about. You can race through checkpoints, race other cars, or just cruise around wherever you like.',
          'You can drive a CITY BUS. A huge bus, in a race. I drove the bus the wrong way down a road and knocked over a lot of bins and won. Callum says this is not how you are meant to play it. It IS how I play it.'],
        up: 'A whole city. The bus. Cruising about.', dn: 'Needs a fast PC. Police everywhere.' },
      { g: 'Dungeon Keepa 2', p: 'PC', d: '06-25', s: [88, 90, 88, 90], o: 89, v: 'It\'s good to be bad.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: you\'re an evil dungeon lord and your little imps dig out a dungeon for you. You build rooms (a lair, a library, a training room) and monsters come to live in them. Then heroes turn up to steal your treasure and your monsters fight them.',
          'You pick monsters up with a big hand and can SLAP them to make them work harder. You can even jump into a monster and walk around in first person. The man who does the voice is very funny and slightly evil. By Bullfrag, who are British. (Jack made me write that.)'],
        up: 'Slapping imps. Possessing monsters. Being the baddie.', dn: 'Gets very busy. Heroes always come at the worst time.' },
      { g: 'Driver', p: 'PLAYSPACE', d: '06-25', s: [86, 90, 90, 80], o: 86, v: 'Shoulda stayed in the car park.',
        t: ['You\'re an undercover cop pretending to be a getaway driver, in big American cities. The cars are huge 70s cars with bouncy springs, and when the police chase you it feels exactly like a film. You can save your best chases and edit them like a film director.',
          'BUT. Before you play the game, you have to pass a test in an underground car park, doing handbrake turns and stuff in a time limit. It is the hardest thing I have ever done. I did it on the 37th go. My thumbs were shaking. After that, the rest of the game is a dream.'],
        up: 'Car chases. Bouncy cars. Film director mode.', dn: 'THE CAR PARK.' },
      { g: 'V-Ralley 2', p: 'PLAYSPACE', d: '06-25', s: [88, 80, 86, 92], o: 87, v: 'Easy on the gravel.',
        t: ['Rally driving, through mud, snow and gravel, all over the world. The cars slide about in a really realistic way and get bashed up when you hit things. Your co-driver shouts out the corners before they come.',
          'The amazing bit is there\'s a track editor where you make your own stages and then drive them. I made one that\'s just one long straight. My co-driver had nothing to say. Four-player split screen too, if you\'ve got a Multi Tap.'],
        up: 'Track editor! Sliding on snow. Four-player.', dn: 'Hard to start with. My co-driver sounds bored.' },
    ],
    pre: [
      { g: 'Ape Escapade', p: 'PLAYSPACE', when: 'July', hype: 82, t: 'Next month! You need the controller with two sticks. One moves your boy, the other swings your net. The monkeys have flashing lights on their helmets that tell you if they\'ve spotted you.' },
      { g: 'Donkey Wrong 64', p: 'ULTRA 64', when: 'Christmas', hype: 92, t: 'Shown off at the big American games show! Donkey Wrong in 3D, by Oddware (the Backpack Buddies people), with a whole gang of Kongs to play as. It looks ENORMOUS.' },
      { g: 'Imperfect Dark', p: 'ULTRA 64', when: 'Not this year?', hype: 96, t: 'More news from the show: it looks brilliant, it\'s full of gadgets, and nobody will say when it\'s out. Next year, probably. I am going to be very old by then.' },
    ],
    let: [
      { from: 'Luke', how: 'by e-mail', t: 'Jack HELP. I can\'t pass the car park in Driver. Is there a cheat? Luke', r: 'Cheats Corner, Luke. Breathe. It\'s just a car park. A car park full of dreams that have died.' },
      { from: '{kidEp1}', how: 'by e-mail', t: 'Dear Jack. Who is faster in Episode I Racer, you or Dave? {kidEp1}', r: 'Me. Obviously. Dave picks the slowest racer because he likes his hat. You can\'t race in a hat.' },
      { from: 'JackK', how: 'by e-mail', t: 'Jack, I stuck the balloon poster on my ceiling and it fell on my face in the night. JackK', r: 'Use more Blue-Stuck. Learn from JackK, readers.' },
    ],
    ch: [
      { g: 'Driver', p: 'PLAYSPACE', t: 'THE CAR PARK: do the moves in the order it shows, and use the HANDBRAKE for the turns, not the brakes. Don\'t rush the first ones: the clock is kinder than you think. And when you fail, put the controller down, have a drink of squash, try again.' },
      { g: 'Episode I Racer', p: 'ULTRA 64 / PC', t: 'Buy the cheapest pit droids early: they repair your pod between races for free. And you can boost only when the engines are cool. Watch the heat bar!' },
      { g: 'Dungeon Keepa 2', p: 'PC', t: 'Slapping an imp makes it work faster for a bit. Don\'t slap them too much. They remember.' },
      { g: 'Midtown Badness', p: 'PC', t: 'Pick the bus. Ignore Callum.' },
    ],
    poster: { title: 'PEAPODRACER CUT-AWAY', col: '#2a1a0a', cap: 'How a peapodracer works (my version): two massive engines held together by an energy beam, cables to a tiny seat, and you holding on for dear life. Not official. Drawn in maths.',
      svg: `<rect width="300" height="400" fill="#e8b878"/><rect y="300" width="300" height="100" fill="#c88a4a"/><circle cx="240" cy="60" r="30" fill="#fff8c0"/><circle cx="200" cy="40" r="18" fill="#fff8c0"/>${T(150, 46, 26, 'PEAPODRACER', { c: '#3a1a00' })}${T(150, 74, 20, 'CUT-AWAY', { c: '#3a1a00' })}<g transform="translate(30 140)"><rect x="0" y="0" width="150" height="34" rx="17" fill="#bbb" stroke="#000" stroke-width="3"/><rect x="0" y="70" width="150" height="34" rx="17" fill="#bbb" stroke="#000" stroke-width="3"/><path d="M30 34 v36 M110 34 v36" stroke="#00e5ff" stroke-width="5"/><rect x="140" y="4" width="14" height="26" fill="#ff7a00"/><rect x="140" y="74" width="14" height="26" fill="#ff7a00"/><path d="M154 17 L210 48 M154 87 L210 56" stroke="#000" stroke-width="2"/><path d="M206 38 h40 l12 14 -12 14 h-40z" fill="#d8b040" stroke="#000" stroke-width="3"/><circle cx="230" cy="52" r="7" fill="#00e5ff"/><g stroke="#000" stroke-width="1.5" fill="none"><path d="M20 10 h100 M20 24 h100 M20 80 h100 M20 94 h100"/></g></g><g font-family="Arial Black,Arial" font-size="11" fill="#000"><text x="20" y="128">ENGINE (BIG)</text><text x="20" y="268">ENGINE (ALSO BIG)</text><text x="70" y="200">ENERGY BEAM</text><text x="196" y="226">YOU (SMALL)</text><text x="186" y="138">CABLES</text></g>` },
    compo: { intro: 'WIN 40 RUPEES! Three questions about the June issue. Peapodracers ready...',
      q: [['When does Previews say Imperfect Dark is coming out?', ['Christmas', 'July', 'Not this year (probably)', 'Tomorrow']],
        ['What did one reader stick the balloon poster on?', ['A car', 'A cake', 'Their nan', 'Their dog']],
        ['What does Jack say you should use for the turns in the Driver car park?', ['The brakes', 'The handbrake', 'The horn', 'The radio']]] },
  });
})();
