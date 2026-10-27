/* mail-tpl-b: newsletters, clubs and services. JACK ATTACK! Weekly, the N64 Fan Club, the Grey Box Gazette,
 * Orbit Bulletin (space news, straight from the 1999 timeline), the Starport Sci-Fi Society, the Outer Rim Fan Club,
 * the Falling Blocks Society, the Cubists' Club, Joke of the Day, Mystic Gubbinz, Megahertz Mike, the Gem Exchange,
 * the JackNet Zone, forum notifications, the JackNet Mail Team, billing, and a Y2K bunker. Every list has an
 * unsubscribe link. None of them work. */
(function () {
  'use strict';
  const G = window.MailGen; if (!G) return;
  const add = G.add, U = G.util;
  const unsubLine = id => `\n\n-----------------------------------\nYou are getting this because you (or somebody on your computer) signed up.\nTo unsubscribe, go to: http://www.unsubomatic.netz/u/${id}.html`;
  const plat = p => (c) => c.games.filter(g => g.p === p);

  // ================================================================ JACK ATTACK! WEEKLY (Fridays)
  add('weekly', {
    mono: 1,
    from: 'JACK ATTACK! Weekly <weekly@jackattack.jnet>', addrs: ['weekly@jackattack.jnet'], news: 'jaweekly', noreply: 1,
    sched: c => c.fri,
    mails: [{ subj: c => `JACK ATTACK! Weekly - Issue #${Math.floor(c.n / 7) + 1} - ${c.date} 1999`, body: c => {
      const L = [];
      L.push('====================================', '    JACK ATTACK!   W E E K L Y', `  Issue #${Math.floor(c.n / 7) + 1} * ${c.dateLong}`, '====================================', '');
      L.push(c.guest ? 'Hello {=name}! (Join JackNet and get your own name: http://www.jackattack.jnet/login.htm)' : '{Hello|Hiya|Greetings|Alright} {=name}! {Here\'s your weekly dose of JACK ATTACK!|Another week, another newsletter!|Here\'s everything that happened this week. Probably.}', '');
      if (c.posts.length) { L.push('--- THIS WEEK ON THE SITE ---'); c.posts.slice(0, 5).forEach(p => L.push(` * [${p.tag}] ${p.text}`)); L.push(''); }
      if (c.no1) L.push('--- NUMBER ONE ---', ` ${c.no1}${c.no1new ? ' (NEW this week!)' : ` (week ${c.no1wk})`}`, ` Jack says: ${c.no1verdict}`, '');
      if (c.cds.length) { L.push('--- COUNTDOWN ---'); c.cds.slice(0, 3).forEach(h => L.push(` ${h.left} day${h.left === 1 ? '' : 's'} till ${h.name}`)); L.push(''); }
      if (c.games.length) { L.push('--- WHAT JACK\'S PLAYING ---'); c.games.slice(0, 3).forEach(g => L.push(` * ${g.name} (${g.on.replace(/^the /, '')})${g.note ? ': ' + g.note : ''}`)); L.push(''); }
      if (c.crazes.length) L.push('--- PLAYGROUND CRAZE OF THE WEEK ---', ` ${c.crazes[0].name}. ${c.crazes[0].note}`, '');
      if (c.mom) L.push('--- MOM SAYS ---', ` ${c.mom}`, '');
      L.push('--- GUBBINZ\'S CORNER ---', ' {Hello. This is Gubbinz. I am in the newsletter now. WAAAGH!|Gubbinz says: it looks like you are reading a newsletter. Would you like help?|Gubbinz has eaten this week\'s competition. Sorry.|Gubbinz says: blow on the cartridge. Always blow on the cartridge.}', '');
      L.push('--- TIP OF THE WEEK ---', ' {Try typing things into Start > Run. You never know.|Right-click the desktop. Then right-click everything else.|There\'s a Recycle Bin on the desktop. It\'s full of things Jack didn\'t want you to see.|Read the Letters page! Then write one: http://www.jackattack.jnet/letters.htm|Beat Jack\'s JACKTRIS score: http://www.jackattack.jnet/demos.htm}', '');
      L.push('See you next Friday!', 'Jack (Editor) and Gubbinz (Assistant Editor, Snacks)', 'http://www.jackattack.jnet/');
      return L.join('\n');
    }, foot: unsubLine('jaweekly') }],
  });

  // ================================================================ THE N64 FAN CLUB (tip of the week, Wednesdays)
  const N64T = ['Blowing into the cartridge does NOT help. (Everyone does it anyway.)', 'Rumble Pouch eating your batteries? Take them out when you\'re not playing. Your Mom will thank you.', 'The Controller Pouch holds 123 pages. Label yours with a sticker so your little brother doesn\'t "borrow" it.', 'Hold the controller by the middle and the outside handles for the best grip. Three handles! Genius.', 'Play four-player? Agree the rules BEFORE you start. It saves a lot of shouting.', 'Never pull the cartridge out while the power is on. Ever. It\'s the law. (It\'s not the law, but don\'t.)', 'Is the picture wobbly? Wiggle the aerial lead. Then wiggle it the other way.', 'Keep your cartridges in their boxes, not in a heap under the bed with the crisps.'];
  add('n64', {
    mono: 1,
    from: 'The ULTRA 64 Fan Club <n64fanclub@members.jacknet.jnet>', addrs: ['n64fanclub@members.jacknet.jnet'], news: 'n64', noreply: 1,
    sched: c => c.dow === 3,
    mails: [{ subj: '{ULTRA 64 FAN CLUB: Tip of the Week|ULTRA 64 FAN CLUB WEEKLY - {=date}|ULTRA 64 Fan Club: your weekly update}', body: c => {
      const n = plat('ULTRA 64')(c);
      return `=============================\n  ULTRA 64 FAN CLUB - WEEKLY TIP\n=============================\n\nHello {=name}!\n\nTIP OF THE WEEK:\n ${G.pick(N64T, G.rng(c.key + 'n64'))}\n\n${n.length ? 'WHAT MEMBERS ARE PLAYING:\n' + n.slice(0, 3).map(g => ` * ${g.name}${g.note ? ' - ' + g.note : ''}`).join('\n') + '\n\n' : ''}MEMBER OF THE WEEK: {=name}! {(We picked you out of a hat. It was a big hat.)|For being brilliant. And for reading this far.|Congratulations! Your prize is this sentence.}\n\n${c.cds.length ? 'COUNTDOWN: ' + c.cdline + '\n\n' : ''}{Keep it real (64-bit real),|See you next Wednesday,|Happy gaming,}\nThe ULTRA 64 Fan Club Committee`;
    }, foot: unsubLine('n64') }],
  });

  // ================================================================ THE GREY BOX GAZETTE (PlayStation fans, Tuesdays)
  add('greybox', {
    mono: 1,
    from: 'The Grey Box Gazette <gazette@greyboxgamers.netz>', addrs: ['gazette@greyboxgamers.netz'], news: 'greybox', noreply: 1,
    sched: c => c.dow === 2,
    mails: [{ subj: '{The Grey Box Gazette - {=date}|GREY BOX GAZETTE: this week in grey boxes|Grey Box Gazette #{=n2}}', body: c => {
      const ps = plat('PS')(c);
      return `***********************************\n*     T H E   G R E Y   B O X     *\n*         G A Z E T T E           *\n***********************************\nfor fans of the grey console with the round buttons\n\nDear {=name},\n\n${ps.length ? 'ON THE GREY BOX RIGHT NOW:\n' + ps.slice(0, 3).map(g => ` > ${g.name}${g.note ? ': ' + g.note : ''}`).join('\n') : 'ON THE GREY BOX RIGHT NOW:\n > Everything. It\'s all good. Buy a memory card.'}\n\nMEMORY CARD CORNER:\n {A memory card holds 15 blocks (that's 128KB). Some games want 3 blocks for ONE save. Plan ahead!|Running out of blocks? Delete those demo saves from the cover disc.|Label your memory cards! Nothing is worse than overwriting your big brother's save. (Ask Dave.)}\n\nREADER'S LETTER:\n "{My disc skips on the bit with the video. Help!|Is it OK to play with the lid open? Asking for a friend.|My little sister put a biscuit in the disc tray.}" - {a reader|N. from somewhere}\n OUR ANSWER: {Clean the disc with a soft cloth, from the middle outwards. Never in circles!|No. Close the lid.|Please send us the biscuit.}\n\n{Press X to continue,|Stay grey,|Keep spinning,}\nThe Gazette Team`;
    }, foot: unsubLine('greybox') }],
  });

  // ================================================================ ORBIT BULLETIN (space news, from the real 1999 timeline)
  add('orbit', {
    mono: 1,
    from: 'Orbit Bulletin <bulletin@orbitbulletin.infobahn>', addrs: ['bulletin@orbitbulletin.infobahn'], news: 'orbit', noreply: 1,
    sched: c => c.spPast.some(p => p.ago <= 1) || (c.spNext && c.spNext.left <= 1) || (c.mon && G.hash(c.key + 'ob') % 2 === 0),
    mails: [{ subj: c => c.spPast.some(p => p.ago === 0) ? `ORBIT BULLETIN: ${c.spPast.find(p => p.ago === 0).text.split(/[.!:]/)[0]}` : c.spNext && c.spNext.left <= 2 ? `ORBIT BULLETIN: ${c.spNext.left === 1 ? 'Tomorrow' : 'In ' + c.spNext.left + ' days'} - ${c.spNext.text}` : `ORBIT BULLETIN - space news for the week of ${c.date}`,
      after: (o, c) => { if (c.spPast.some(p => p.ago === 0)) o.mission = true; },
      body: c => {
        const L = ['  *    .   ORBIT BULLETIN   .    *', ' .   *  your weekly space news  *  .', '', 'Hello {=name}, space fan!', ''];
        if (c.spPast.length) { L.push('LATEST NEWS:'); c.spPast.forEach(p => L.push(` * ${p.ago === 0 ? 'TODAY' : p.ago === 1 ? 'YESTERDAY' : 'This week'}: ${p.text}`)); L.push(''); }
        const nx = (c.spAll.next || []).slice(0, 3);
        if (nx.length) { L.push('COMING UP:'); nx.forEach(n => L.push(` * In ${n.left} day${n.left === 1 ? '' : 's'}: ${n.text}`)); L.push(''); }
        if (c.sky) L.push('TONIGHT\'S SKY:', ` ${c.sky}`, ` (It gets dark at ${c.dark} at the moment. Wrap up warm!)`, '');
        L.push('SPACE FACT:', ' {The Moon is about 384,000 km away. That\'s about ten times round the Earth.|Light from the Sun takes about eight minutes to reach us.|Mars has the biggest volcano in the Solar System: Olympus Mons, more than twice as tall as Everest.|A day on Venus is longer than a year on Venus.|Saturn would float in a bath, if you could find a big enough bath.|Jupiter has more than 15 moons that we know of. Four of the big ones were found by Galilayo in 1610.|The footprints on the Moon will still be there for millions of years. There\'s no wind to blow them away.|The International Space Station is being built in space, one bit at a time, like the world\'s most expensive construction kit.|1999 is 30 years since people first walked on the Moon (20 July 1969).}', '');
        L.push('{Keep looking up!|Clear skies,|Ad astra (that\'s Latin for "to the stars"),}', 'The Orbit Bulletin team');
        return L.join('\n');
      }, foot: unsubLine('orbit') }],
  });

  // ================================================================ THE STARPORT SCI-FI SOCIETY (Thursdays)
  const SCIQ = [['In 2001: A Space Oddity, what is the spaceship\'s computer called?', 'HOL 9000'], ['In Red Dork, what is the name of the ship\'s computer?', 'Holly'], ['What is the Doctor\'s time machine called in Doctor Whoops?', 'The TARDISH'], ['In The Hitchhiker\'s Guide to the Galaxy, what is the answer to life, the universe and everything?', '42'],
    ['What speed does the DeLorry need to reach in Back to the Furniture?', '88 miles per hour'], ['In Alien, what is the name of the spaceship?', 'The Nostromato'], ['What year is Futurarma set in?', 'The year 3000'], ['What is Mr Sprock\'s home planet?', 'Vulcan'],
    ['How long was Lickster in stasis in Red Dork?', 'Three million years'], ['Who is the captain of the Enterprize in Galaxy Walk: The Next Instalment?', 'Jean-Luc Pickle'], ['In Thunderbudgies, which Thunderbudgie is the space station?', 'Thunderbudgie 5'], ['Which planet do the Dalicks come from?', 'Scarrow']];
  add('starport', {
    mono: 1,
    from: 'The Starport Sci-Fi Society <starport@scifizone.cyb>', addrs: ['starport@scifizone.cyb'], news: 'starport', noreply: 1,
    sched: c => c.dow === 4,
    mails: [{ subj: '{STARPORT SOCIETY: transmission #{=n3}|Starport Sci-Fi Society - this week|INCOMING TRANSMISSION from the Starport}', body: c => {
      const r = G.rng(c.key + 'sq'), q = G.pick(SCIQ, r), q2 = G.pick(SCIQ, G.rng(c.key + 'sq2'));
      const tv = c.tvs.filter(t => /Red Dwarf|Futurama|Farscape|Doctor Who|Dinosaurs/i.test(t.name));
      return `>>> INCOMING TRANSMISSION <<<\n>>> STARPORT SCI-FI SOCIETY <<<\n\nGreetings, {=name}, Earthling member!\n\n${tv.length ? 'ON THE TELLY:\n' + tv.map(t => ` * ${t.name}${t.ch ? ' (' + t.ch + ')' : ''}`).join('\n') + '\n\n' : ''}${/Matrix|PHANTOM|2001/i.test(c.film) ? 'AT THE CINEMA / ON VIDEO:\n * ' + c.film + '\n\n' : ''}QUIZ OF THE WEEK:\n Q: ${q[0]}\n A: (scroll down)\n\n\n\n\n A: ${q[1]}\n\nLAST WEEK'S BRAIN-BENDER:\n Q: ${q2[0]}\n A: ${q2[1]}\n\nMEMBERS' DEBATE:\n {Would you rather have a lightspatula or a zip screwdriver?|Best ship computer: HAL, Holly or the one on The Enterprize?|Is a robot that can feel sad still a robot?|If you could go to any year, which would it be? (No, not the year 2000. That's next year.)}\n Reply to the Society to vote! (Replies go to the Society's robot. It reads them very slowly.)\n\n{Live long and keep watching,|Smoke me a kipper,|Until the next transmission,}\n{club1}, Chief Science Officer, Starport Sci-Fi Society\nhttp://www.scifizone.cyb/`;
    }, foot: unsubLine('starport') }],
  });

  // ================================================================ THE OUTER RIM FAN CLUB (a galaxy far, far away)
  const SWF = ['Episode I opened in America on 19 May 1999 and in the UK on 16 July 1999.', 'Qui-Gon Gym is played by Liam Kneesun. Young Obi-Wan Cannoli is Ewan McGreaser.', 'Queen Amidolly is played by Natalie Porkman.', 'Dark Mole\'s lightspatula has a blade at BOTH ends.', 'Tattyween has two suns.', 'Jar Jar Jams is a Gungoo, from the underwater city of Otoh Gungoo.', 'The big peapod race in Episode I is the Boomta Eve Classic.', 'Yoga is 900 years old in Return of the Space Cadets.', 'The first Intergalactic Battles film came out in America in 1977.', 'The Millennium Pigeon made the Kettle Run in less than twelve parsecs.'];
  add('outerrim', {
    mono: 1,
    from: 'The Outer Hem Fan Club <holonet@outerrimfans.jnet>', addrs: ['holonut@outerrimfans.jnet'], news: 'outerrim', noreply: 1,
    sched: c => c.sun && c.md <= 1031,
    mails: [
      { must: c => ['05-19', '07-14', '07-16', '05-03'].includes(c.key), rel: 1, subj: c => ({ '05-19': 'IT\'S HERE (IN AMERICA)', '07-14': 'THE LONDON PREMIERE IS TONIGHT', '07-16': 'TODAY IS THE DAY. EPISODE I IS OUT IN THE UK!!!', '05-03': 'MIDNIGHT MADNESS: the toys are out (in America)' })[c.key], body: c => `OUTER HEM FAN CLUB - SPECIAL BULLETIN\n\n{=name}!!!\n\n${({ '05-19': 'Episode I: The Phantom Nuisance opens in America TODAY. We have to wait until 16 July. That is 58 more days. Spoiler shields UP. Do not read the newsgroups. Do not trust your American pen pals.', '07-14': 'The Phantom Nuisance has its big premiere in London tonight! Two more days for the rest of us. Two. More. Days.', '07-16': 'THE PHANTOM NUISANCE IS OUT IN THE UK TODAY!!! Queue early, bring snacks, and don\'t forget to breathe. We\'ve waited sixteen years since Return of the Space Cadets. SIXTEEN YEARS.', '05-03': 'The Episode I toys went on sale in America at one minute past midnight! People queued in the dark for Dark Mole figures. We are not jealous. We are VERY jealous.' })[c.key]}\n\nMay the Force be with you!\nThe Outer Hem Fan Club` },
      { subj: '{OUTER HEM FAN CLUB - transmission from the Outer Hem|HoloNut News: Outer Hem Fan Club|Outer Hem Fan Club weekly}', body: c => {
        const r = G.rng(c.key + 'sw');
        const phase = c.md < 519 ? `Only ${U.dayNo('05-19') - c.n} days until Episode I opens in America, and ${U.dayNo('07-16') - c.n} until it opens HERE.` : c.md < 716 ? `America has seen Episode I. We have NOT. ${U.dayNo('07-16') - c.n} days to go. SPOILER SHIELDS UP.` : `Episode I is OUT! How many times have you seen it? Tell us! (Our record so far is ${G.between(6, 14, r)}.)`;
        return `.-------------------------------.\n|  OUTER HEM FAN CLUB  HOLONUT  |\n'-------------------------------'\n\nHello {=name},\n\n${phase}\n\nFAN FACT:\n ${G.pick(SWF, r)}\n\n${c.crazes.some(x => /Episode|lightsaber|figures/i.test(x.name)) ? 'IN THE PLAYGROUND: ' + c.crazes.find(x => /Episode|lightsaber|figures/i.test(x.name)).name + '. ' + c.crazes.find(x => /Episode|lightsaber|figures/i.test(x.name)).note + '\n\n' : ''}SHRINE OF THE WEEK: http://www.episode1countdown.jnet/\n\nMay the Force be with you,\nThe Outer Hem Fan Club`;
      }, foot: unsubLine('outerrim') },
    ],
  });

  // ================================================================ THE FALLING BLOCKS SOCIETY (for Tetris people)
  add('blocks', {
    mono: 1,
    from: 'The Falling Blocks Society <lines@fallingblocks.infobahn>', addrs: ['lines@fallingblocks.infobahn'], news: 'blocks', noreply: 1,
    sched: (c, r) => c.mon && G.hash(c.key + 'b') % 3 === 0,
    mails: [{ subj: '{Falling Blocks Society: line clearance report|THE FALLING BLOCKS SOCIETY - high scores|Falling Blocks Society newsletter}', body: c => {
      const r = G.rng(c.key + 'blk');
      const fake = ['BLOCKHEAD', 'LINEQUEEN', 'TETRISTOM', 'LONGBARLARRY', 'SPINDOCTOR', 'MRDROP'];
      const rows = fake.slice(0, 4).map((n, i) => [n, 160000 - i * 21000 - G.between(0, 9000, r)]).concat([[c.name.toUpperCase().slice(0, 12), G.between(2000, 60000, r)]]).sort((a, b) => b[1] - a[1]);
      return `|   |   |   |\n| FALLING BLOCKS SOCIETY |\n|___|___|___|\n\nHello {=name},\n\nTHIS WEEK'S MEMBERS' HIGH SCORES:\n${rows.map((x, i) => ` ${i + 1}. ${x[0].padEnd(13, '.')} ${x[1].toLocaleString('en-GB')}`).join('\n')}\n\n(Your score is an estimate. We estimated it.)\n\nBLOCK FACT:\n {Blockology was made by Alexey Pyjamanov in Moscow in 1984.|There are seven different Blockology pieces. Each one is made of four squares.|Clearing four lines at once is called a "Blockology". It's the best feeling in the world.|Blockology came with the Game Lad in 1989.|Blockology DX came out last year for the Game Lad Color. In COLOUR.}\n\nTIP:\n {Always leave a gap for the long bar. It WILL come. Eventually.|Don't stack in the middle. The middle is a trap.|Look at the "next" box, not at the falling piece.|If you start seeing blocks when you close your eyes, have a break.}\n\nTry JACKTRIS (members' favourite): http://www.jackattack.jnet/demos.htm\n\nKeep it level,\nThe Falling Blocks Society`;
    }, foot: unsubLine('blocks') }],
  });

  // ================================================================ THE CUBISTS' CLUB (Rubik's cube fans)
  const MOVES = ['R', 'L', 'U', 'D', 'F', 'B'];
  add('cube', {
    mono: 1,
    from: 'The Cubists\' Club <twist@cuberecords.infobahn>', addrs: ['twist@cuberecords.infobahn'], news: 'cube', noreply: 1,
    sched: c => G.hash(c.key + 'cube') % 5 === 0,
    mails: [{ subj: '{The Cubists\' Club: Scramble of the Week|CUBISTS\' CLUB NEWSLETTER|Twist and shout: the Cubists\' Club}', body: c => {
      const r = G.rng(c.key + 'scr'); let last = '', sc = [];
      while (sc.length < 20) { const m = G.pick(MOVES, r); if (m === last) continue; last = m; sc.push(m + G.pick(['', "'", '2'], r)); }
      return `+---+---+---+\n| CUBISTS'  |\n|   CLUB    |\n+---+---+---+\n\nHello {=name},\n\nSCRAMBLE OF THE WEEK (hold the cube with white on top, green at the front):\n ${sc.join(' ')}\n\nTIP OF THE WEEK:\n {Start with the white cross. Get the edges to match the middle colours on the sides too!|Corners next: get the white corners in, one at a time.|Then the middle layer. Then the last layer. Then lie down for a bit.|Practise looking AHEAD while you turn. Don't stop to stare!|A drop of the right sort of lubricant makes a stiff cube turn better. Ask a grown-up. Never use butter. (Dave.)}\n\nCUBE FACT:\n {The cube was invented by Erno Rubrick, in Hungary, in 1974.|There are 43,252,003,274,489,856,000 ways to mix up a cube. Only one of them is solved.|The first big world championship was in Budapest in 1982.|The cube has 26 little pieces you can see, round a hidden middle that holds it together.}\n\nMembers' records: http://www.cuberecords.infobahn/\n\nKeep twisting,\nThe Cubists' Club`;
    }, foot: unsubLine('cube') }],
  });

  // ================================================================ JOKE OF THE DAY
  const JOKES = ['Why did the computer go to the doctor?\nIt had a virus!', 'Why was the computer cold?\nIt left its JackOS open!', 'What do you call a computer superhero?\nA screen saver!', 'Why did the spider go on the Internet?\nTo check its web site!', 'What do you get if you cross an Eggbert with a modem?\nSomething that beeps all night and then makes a horrible noise.',
    'Why did the Game Lad go to the doctor?\nIt had a bad case of low batteries.', 'How do you make a Dalick laugh on a Saturday?\nTell him a joke on Wednesday.', 'What\'s an astronaut\'s favourite part of a computer?\nThe space bar!', 'Why did the mouse cross the mouse mat?\nTo get to the other side of the screen.', 'What do you call a deer with no eyes?\nNo idea!',
    'Why was the maths book sad?\nIt had too many problems.', 'What do you call a dinosaur with a big vocabulary?\nA thesaurus!', 'How does the Moon cut his hair?\nEclipse it!', 'Why did the cookie go to the doctor?\nIt felt crummy.', 'What did the floppy disk say to the CD?\nYou think you\'re so shiny.', 'Why did the robot go on holiday?\nIt needed to recharge its batteries.',
    'What\'s orange and sounds like a parrot?\nA carrot!', 'What do you call a sleeping bull?\nA bulldozer!', 'Why can\'t you trust an atom?\nThey make up everything.', 'What did the Pent-Yum say to the 486?\nYou\'re history.', 'Knock knock.\nWho\'s there?\nY2K.\nY2K who?\nY2K-nock? The Millennium Bug ate the rest of this joke.', 'Why did the Space Cadet cross the road?\nTo get to the Dark Side.',
    'What lies at the bottom of the sea and twitches?\nA nervous wreck.', 'What do you get when you cross a snowman and a vampire?\nFrostbite!', 'Why did the scarecrow win a prize?\nHe was outstanding in his field.', 'What do you call a fish with no eyes?\nA fsh.', 'What\'s the fastest thing in the world?\nA red one.'];
  add('joke', {
    mono: 1,
    from: 'Joke of the Day <jokes@jokeoftheday.wubwub>', addrs: ['jokes@jokeoftheday.wubwub'], news: 'joke', noreply: 1,
    sched: c => G.hash(c.key + 'joke') % 10 < 3,
    mails: [{ subj: '{Joke of the Day - {=date}|Your Joke of the Day!!!|Today\'s joke (it\'s a good one)|JOKE OF THE DAY #{=n3}}', body: c => `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n   J O K E   O F   T H E   D A Y\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\nHi {=name}!\n\n${G.pick(JOKES, G.rng(c.key + 'j1'))}\n\n\nBONUS JOKE:\n${G.pick(JOKES, G.rng(c.key + 'j2'))}\n\nRate today's joke: http://jokeoftheday.wubwub/\n\n{Groan responsibly,|Ba-dum-tsss,|Thank you, we're here all week,}\nThe Joke of the Day team`, foot: unsubLine('joke') }],
  });

  // ================================================================ MYSTIC GUBBINZ (horoscopes, very accurate, 100%)
  add('mystic', {
    from: 'Mystic Gubbinz <stars@mysticgubbinz.grot>', addrs: ['stars@mysticgubbinz.grot'], news: 'mystic', noreply: 1, fx: 'none',
    sched: c => G.hash(c.key + 'my') % 4 === 0,
    mails: [{ subj: '{YOUR STARS FOR {=date^}|Mystic Gubbinz says...|The crystal ball has spoken}', body: `*~*~*~* MYSTIC GUBBINZ *~*~*~*\n     sees all, knows all\n  (eats all, if it is crunchy)\n\n{=name}!\n\nI have looked into my crystal ball {(it is a marble)|(it is a Magic 8-Ball)|(it is a gobstopper)} and I see:\n\n * {Today you will meet someone. They will be wearing shoes.|You will eat something today. Probably food.|A big thing is coming. It might be {=soonestName}. It might be a bus.|Someone will say your name today. It might be your Mom. You might be in trouble.|Something will go "beep". Do not panic.}\n * {Your lucky number is {=n2}.|Your lucky number is 64.|Your lucky number is all of them.}\n * {Your lucky colour is red, because red ones go faster.|Avoid anything beige. Like your computer.|Wear something see-through purple. Like a Game Lad Color.}\n * {Do not trust an Eggbert today.|Today is a good day to tidy your room. (Your Mom paid me to say that.)|The stars say: go to bed earlier. The stars are boring.}\n\nYour star sign is: {ZAPACHU|THE BIG ROCKET|THE MILLENNIUM BUG|THE BITS BOX|BLOCKOLOGY BLOCK}. (What? Everyone is.)\n\nAsk the crystal ball a question: http://mysticgubbinz.grot/\n\nWAAAGH!\nMystic Gubbinz`, v: { soonestName: c => c.soonest ? c.soonest.name : 'the weekend' }, foot: unsubLine('mystic') }],
  });

  // ================================================================ MEGAHERTZ MIKE (PC tips, far too many numbers)
  add('mike', {
    from: 'Megahertz Mike <mike@megahertzmike.cyb>', addrs: ['mike@megahertzmike.cyb'], news: 'mike', noreply: 1, w: 0.8,
    mails: [{ subj: '{MHz MIKE\'S TIP OF THE WEEK|Megahertz Mike: make your PC FASTER|Mike\'s PC Corner}', body: `MEGAHERTZ MIKE'S PC CORNER\n==========================\n\nAlright {=name}!\n\nTHIS WEEK'S TIP:\n {Defrag your hard drive! When files get split up all over the disk, it slows things down. Defrag puts the bits back together. (Also: lovely to watch.)|Clean your mouse ball! Twist the cover off the bottom and pick the fluff off the little rollers. It's disgusting. It's brilliant.|Too many programs starting when the PC boots? Check the Start Up folder in the Start menu.|Don't keep your floppies near a speaker. The magnet can scramble them!|ScanDisk after a crash. Every time. It finds the lost bits.}\n\nNUMBER CORNER:\n {A floppy disk holds 1.44MB. A CD-ROM holds about 650MB. That's about 450 floppies!|A Zip disk holds 100MB. That's about 70 floppies in one!|A DVD holds 4.7GB. You could fit about seven CDs on one!|56K modems hardly ever connect at 56K. Most phone lines give you somewhere in the 40s.|The Pent-Yum III came out in February at 450MHz and 500MHz.|The Hoodoo3 graphics card has 16MB of video memory. SIXTEEN.}\n\nMIKE'S DREAM PC THIS WEEK:\n {Pent-Yum III 500MHz, 128MB RAM, 13GB hard drive, Hoodoo3. Price: one kidney.|Anything with a fan that's quieter than my Mom's vacuum.|Mine. But with more MHz.}\n\nMore MHz: http://megahertzmike.cyb/\n\nMike`, foot: unsubLine('mike') }],
  });

  // ================================================================ COOL SITE OF THE DAY
  const SITES = Cast.deep([['www.davesplace.jnet', "DAVE'S KOOL PAGE 2", 'Bedroom wrestling starring Dave and his cat'], ['www.{cousin.slug}spopzone.kidz', "{cousin}'s PoP PaRaDiSe", 'Glitter, charts and a slambook'], ['www.yoyozone.kidz', "{club3}'s Yo-Yo Trick Zone", 'Yo-yo tricks with diagrams'], ['www.pokefacts.kidz', "{kidPoke}'s Pocket Critters Facts Page", 'All 151!'],
    ['www.orkpaint.grot', "Snaz's Miniature Painting Tips", 'Space Mariners, AirMix, rusty metal and the bits box'], ['www.episode1countdown.jnet', "{kidEp1.NAME}'S EPISODE I COUNTDOWN", 'Countdown, trailers and the queue'], ['www.podracinghq.jnet', 'PEAPODRACING HQ', 'Pods, drivers, and why Sebulbar is a cheat'], ['www.hamstercam.webcom', 'HAMSTER CAM', '{hamster} the hamster, live(ish)'],
    ['www.gemexchange.grot', 'Da Gem Exchange', 'Da only shop dat takes Rupees'], ['www.babeljack.grot', 'Babel Jack', 'Translate English into silly languages'], ['www.cuberecords.infobahn', 'Cube Records', 'Fastest cube solves (on our street)'], ['www.scifizone.cyb', "{club1}'s Sci-Fi Zone", 'Spaceships, robots and Red Dork'],
    ['millenniumbunker.netz', "{kidY2k}'s Millennium Bunker", 'Y2K survival tips (beans)'], ['www.petrock.netz', "Kevin's Pet Rock", 'Rocky the rock. Still a rock.'], ['asciigallery.netz', 'The ASCII Gallery', 'Pictures made of letters'], ['www.galaxyring.jnet', 'The Galaxy Ring', 'A webring for space and sci-fi']]);
  add('csotd', {
    mono: 1,
    from: 'Cool Site of the Day <picks@coolsiteoftheday.wubwub>', addrs: ['picks@coolsiteoftheday.wubwub'], news: 'csotd', noreply: 1, w: 0.7,
    mails: [{ subj: '{Cool Site of the Day: {=st}|Today\'s COOL SITE!|You HAVE to see this site}', v: { st: c => SITES[G.hash(c.key + 'cs') % SITES.length][1] }, body: c => { const s = SITES[G.hash(c.key + 'cs') % SITES.length]; return `     \\|/\n   -- * --   COOL SITE OF THE DAY\n     /|\\\n\nHey {=name}! Today's Cool Site is:\n\n   ${s[1]}\n   ${s[2]}\n\n   http://${s[0]}/\n\n{It's cool. It's a site. It's the Cool Site of the Day!|We give it five spinning globes out of five.|Our judges looked at it for nearly a whole minute.}\n\nSee all our past picks: http://www.coolsiteoftheday.wubwub/\n\nThe Cool Site of the Day Team`; }, foot: unsubLine('csotd') }],
  });

  // ================================================================ THE HAMSTER (Cast 'hamster') (Hamster Cam updates)
  add('hamster', {
    from: 'Hamster Cam <{hamster.slug}@hamstercam.webcom>', addrs: ['{hamster.slug}@hamstercam.webcom', 'nibbles@hamstercam.webcom'], news: 'hamster', noreply: 1, w: 0.45,
    mails: [{ subj: '{HAMSTER CAM ALERT: {hamster} is {awake|eating|on the wheel|asleep again}|{hamster} update!|HAMSTER CAM: news}', body: `HAMSTER CAM ALERT!!!\n\nDear {=name},\n\nYou asked us to tell you when something happens on Hamster Cam. Something has happened:\n\n  {{hamster} is awake!|{hamster} has eaten a sunflower seed.|{hamster} has gone in {hamster.his} tube. {hamster.He} has not come out of {hamster.his} tube.|{hamster} ran on {hamster.his} wheel for eleven minutes. A new record.|{hamster} is asleep. (This is what {hamster.he} does most of the time.)|{hamster} has stuffed both cheeks so full that {hamster.he} can't get through the door of {hamster.his} house.}\n\nWatch live (one picture every two minutes): http://www.hamstercam.webcom/\n\nSqueak!\nThe Hamster Cam team (and {hamster})`, foot: unsubLine('hamster') }],
  });

  // ================================================================ ROCKY THE PET ROCK
  add('rock', {
    from: 'Kevin (Rocky\'s owner) <kevin@petrock.netz>', addrs: ['kevin@petrock.netz'], news: 'rock', noreply: 1, w: 0.3,
    mails: [{ subj: '{Rocky\'s weekly update|ROCKY NEWS|Rocky: what happened this week}', body: `ROCKY'S WEEKLY UPDATE\n\nHi {=name},\n\nThis week, Rocky:\n * {sat on my desk|sat on my windowsill (a change of scene)|went on holiday to the garden|was used as a paperweight by my Dad (we have had words)}\n * {did not move|was very still|had a bath}\n * {is still a rock|is still a rock (I checked)}\n\n{Rocky says hello. (He doesn't. He's a rock.)|Visitors to Rocky's page this week: {=n2}. Rocky was unmoved.}\n\nhttp://www.petrock.netz/\n\nKevin`, foot: unsubLine('rock') }],
  });

  // ================================================================ DA GEM EXCHANGE
  add('teef', {
    from: 'Da Gem Exchange <orders@gemexchange.grot>', addrs: ['orders@gemexchange.grot', 'orders@teefexchange.grot'], news: 'teef', w: 1.2, fx: 'ork',
    mails: [
      { subj: '{SPESHUL OFFER!!!|2 SQUIGS FOR DA PRICE OF 3!!!|DIS WEEK ONLY|BIG SALE (BIG)}', body: `DA GEM EXCHANGE - DA ONLY SHOP DAT TAKES RUPEES\n\nOI {=name}!\n\nDIS WEEK'S SPESHUL OFFERS:\n * {Squig (red, bouncy)|Squig (green, bitey)|Squig (mystery)} ........ {=n2} Rupees\n * {A big choppa|A slightly smaller choppa|A choppa wiv a sticker on} ........ {=n3} Rupees\n * {Red paint (makes fings go faster)|A bits box (full of bits)|A helmet (one previous owner, he iz fine)} ........ {=n1} Rupees\n * {A mystery box (it might be empty)|A tin of beans (for da Millennium)|A pebble (we fink it iz a pebble)} ........ 1 Rupee\n\nCome to da shop: http://www.gemexchange.grot/\n\nNO REFUNDS. NO RETURNS. NO SQUIGS IN DA SHOP.\nDa Management` , foot: unsubLine('teef') },
      { subj: '{Yer order haz been sent|ORDER CONFIRMED|Re: yer order}', body: `Oi {=name},\n\nFanks for yer order!\n\n  Order number: {=n3}-{=n2}\n  Items: {1 x squig (red)|1 x big choppa|1 x bits box|1 x mystery box}\n  Price: {=n2} Rupees\n  Delivery: {by grot (2-3 days)|by squig (it might bite da postman)|by catapult (stand clear)}\n\nYer Rupee balance iz now: {=n1} Rupees. {Spend dem wisely. Or quickly.|Dat iz not many Rupees.}\n\nTrack yer order: http://www.gemexchange.grot/\n\nDa Gem Exchange`, foot: unsubLine('teef') },
    ],
    reply: [{ body: `OI {=name},\n\nFanks for yer e-mail. Da shop grot haz read it. {He did not understand it.|He haz eaten it.|He sez: wot?}\n\nIf ya want sumfin, go to da shop: http://www.gemexchange.grot/\n\nDa Gem Exchange\n\n{=quote}` }],
  });

  // ================================================================ THE JACKNET ZONE (games with strangers)
  add('zone', {
    from: 'The JackNet Zone <zone@jacknetzone.jnet>', addrs: ['zone@jacknetzone.jnet'], news: 'zone', noreply: 1, w: 1,
    mails: [
      { subj: '{{=foe} wants a rematch!|You\'ve been challenged!|New challenge in the Zone}', once: { foe: ['xXGoldenballsXx', 'ReversiQueen', 'U64Kid', 'Checkmate_Charlie', 'ZapachuLord', 'PeapodRacer99', 'LineQueen', 'BigDaveFan'] }, body: `THE JACKNET ZONE\n\nHi {=name},\n\n{=foe} wants a {rematch|game|quick game} of {Reversi|Draughts|Chess|Backgammon|Hearts}! {They say they've been practising.|They say you got lucky last time.|They've sent a smiley :-)}\n\nCome to the Zone and find a table: http://www.jacknetzone.jnet/\n\nRemember: be a good sport! No shouting in CAPITALS (unless you win).\n\nThe Zone Team`, foot: unsubLine('zone') },
      { subj: '{Zone Points report|Your Zone rating this week|Tournament this Saturday!}', body: `THE JACKNET ZONE - WEEKLY REPORT\n\n{=name}, here's how you're doing:\n\n  Zone rating: {=n3}\n  Games played: {=n1}\n  Best game: {Reversi|Draughts|Chess|Hearts}\n  Rank: {Rookie|Padawannabe|Space Cadet|Space Cadet Knight|Grand Master (in training)}\n\n{TOURNAMENT on Saturday at 7pm! Prize: a big gold star next to your name.|This week's most-played game was Reversi. Again.|Tip: in Reversi, the corners are worth a LOT.}\n\nhttp://www.jacknetzone.jnet/\n\nThe Zone Team`, foot: unsubLine('zone') },
    ],
  });

  // ================================================================ FORUM NOTIFICATIONS
  const TOPICS = c => {
    const t = ['BEST ULTRA 64 GAME EVER?', 'Post your Jacktris high score!', 'Robo Rumble: best robot ever?', 'Is the Rubrick\'s cube actually possible?', 'What\'s on your Christmas list? (yes, already)', 'Favourite crisps (serious topic)'];
    if (c.md >= 301 && c.md <= 930) t.push('IS JAR JAR JAMS RUINING IT?', 'Episode I: how many times have you seen it?', 'Dark Mole figure: where can I find one??');
    if (c.md >= 801 && c.md <= 1031) t.push('MOSS OR PUDDLE?', 'Pocket Critters: who did you pick first?');
    if (c.md >= 901) t.push('DAYDREAM: worth £199?', 'Smush Bros: who is the best character?');
    if (c.md >= 1101) t.push('Y2K: are we doomed?', 'What are you doing for the Millennium?');
    if (c.md <= 331) t.push('Metal Gear Wobbly: Pyjama Mantis is in my head', 'Kazoo of Time: the Water Tempura (HELP)');
    return t;
  };
  add('forums', {
    from: 'JACK ATTACK! Forums <forums@jackattack.jnet>', addrs: ['forums@jackattack.jnet'], news: 'forums', noreply: 1, w: c => c.member ? 1.3 : 0.4,
    mails: [{ subj: '[JACK ATTACK! Forums] New reply to "{=topic}"', once: { topic: (c, r) => G.pick(TOPICS(c), r), who: ['xXGoldenballsXx', 'U64Kid', 'PeapodRacer99', 'ZapachuLord', 'Cubemaster', 'LineQueen', 'ReversiQueen', 'BigDaveFan', 'CadetJosh', 'PixelPete'] }, body: `Hello {=name},\n\n{=who} has replied to a topic you are watching: "{=topic}".\n\nThey wrote:\n  "{I totally agree!!!|No way. NO WAY.|lol|This is the best topic on the whole forum.|You're all wrong and I'm right.|Has anyone tried turning it off and on again?|first! (I am not first)}"\n\nRead the whole topic: http://www.jackattack.jnet/forums.htm\n\nThere may be more replies, but you won't get another e-mail until you visit the forums again. (We're not made of e-mails.)\n\nJACK ATTACK! Forums robot`, foot: unsubLine('forums') }],
  });

  // ================================================================ THE JACKNET MAIL TEAM
  add('jnmail', {
    from: 'JackNet Mail Team <welcome@jacknet.jnet>', addrs: ['welcome@jacknet.jnet'], w: c => c.guest ? 1 : 0.6,
    mails: [
      { subj: '{Your mailbox is nearly full|WARNING: mailbox {=n2}% full|Mailbox space}', body: c => `Dear ${c.guest ? 'Valued Guest' : '{=name}'},\n\nYour JackNet Mail mailbox is {=n2}% full.\n\nPlease delete some old messages, or your mailbox will get full and we will have to send you an e-mail to tell you your mailbox is full, which will make it fuller.\n\nTIP: the Deleted Items folder counts too! Empty it from the Edit menu.\n\nThe JackNet Mail Team` },
      { subj: '{Keep your password safe!|A message about passwords|IMPORTANT: passwords}', body: c => `Dear ${c.guest ? 'Valued Guest' : '{=name}'},\n\nA reminder from the JackNet Mail Team:\n\n * We will NEVER ask for your password by e-mail. Not ever.\n * Don't tell anyone your password. Not your best mate. Not your cousin. Not Gubbinz.\n * If an e-mail says it's from us and asks for your password, it's a FAKE. Delete it!\n * A good password is long and hard to guess. "password" is not a good password. Nor is "dave".\n\nStay safe online!\nThe JackNet Mail Team` },
      { subj: 'NEW! The Inbox Assistant', body: c => `Dear ${c.guest ? 'Valued Guest' : '{=name}'},\n\nTired of junk mail? JackMail Express has an Inbox Assistant that can move junk into your Junk folder automatically!\n\nFind it under: Tools > Inbox Assistant...\n\nYou can make your own rules too. (Except about Mom. Nobody can make rules about Mom.)\n\nThe JackNet Mail Team` },
      { subj: '{Planned maintenance|Server maintenance on {=tomorrow} night}', body: c => `Dear ${c.guest ? 'Valued Guest' : '{=name}'},\n\nJackNet Mail will be switched off for maintenance on {=tomorrow} night between 2am and 4am. {We're giving the servers a dust.|We're adding more megabytes.|An engineer will be turning it off and on again.}\n\nIf you are awake at 2am, please go to bed.\n\nThe JackNet Mail Team` },
      { w: c => c.guest ? 2 : 0, subj: 'Your guest mailbox', body: `Dear Valued Guest,\n\nYou're using a JackNet guest mailbox. That's fine! But guests get a new name every time, which makes it hard for your friends to find you.\n\nJoin JackNet (it's FREE) and you get your own name, your own mailbox and your own desktop on any computer.\n\nhttp://www.jackattack.jnet/login.htm\n\nThe JackNet Mail Team` },
    ],
    reply: [{ body: `Dear {=name},\n\nThank you for contacting the JackNet Mail Team. Your e-mail is important to us.\n\nYou are number {=n3} in the queue.\n\n{Please do not reply to this e-mail, as it will put you back to the end of the queue.|While you wait, why not defragment your hard drive?}\n\nThe JackNet Mail Team\n\n{=quote}` }],
  });

  // ================================================================ BILLING (JackNet Customer Accounts)
  add('billing', {
    from: 'JackNet Customer Accounts <accounts@jacknet.jnet>', addrs: ['accounts@jacknet.jnet'], w: 0.5, noreply: 1,
    mails: [
      { subj: '{JackNet Usage Alert|Your hours online this week|You\'ve been busy!}', body: c => `Dear ${c.guest ? 'Valued Guest' : '{=name}'},\n\nThis is a friendly usage alert from JackNet 56K.\n\n  Hours online this week:   {=n2} hrs {=n1}0 mins\n  Busiest time:             {22:00 - 23:30|16:00 - 18:00 (after school?)|07:30 - 08:15 (before school??)}\n  Most visited:             "JACK ATTACK!" (some local site)\n\n{Remember: the phone line can't be used for phoning while you're online.|Phone calls to JackNet cost the local rate. They add up!|Your Mom has been informed. (We don't do that. But imagine if we did.)}\n\nJackNet Customer Accounts\nJackNet 56K - "The Internet, but slowly"` },
    ],
  });

  // ================================================================ THE MILLENNIUM BUNKER (Cast 'kidY2k') (Y2K panic, November and December)
  add('bunker', {
    from: '{kidY2k} (Millennium Bunker) <{kidY2k.slug}@millenniumbunker.netz>', addrs: ['{kidY2k.slug}@millenniumbunker.netz', 'gaz@millenniumbunker.netz'], news: 'bunker', noreply: 1, w: c => c.is('y2k') ? 2.2 : 0,
    mails: [{ subj: c => `Y2K ALERT: ONLY ${U.dayNo('12-31') - c.n + 1} DAYS LEFT!!!`, body: c => `!!! THE MILLENNIUM BUNKER - Y2K UPDATE !!!\n\n${c.name},\n\nThere are ONLY ${U.dayNo('12-31') - c.n + 1} DAYS until the year 2000!!!\n\nHERE IS WHAT YOU NEED:\n * {Beans. Lots of beans.|Candles (and matches, and a grown-up)|A wind-up radio|A torch (with batteries)|Bottled water|A paper map (in case the computers forget where everything is)}\n * {More beans.|A list of phone numbers written on PAPER.|Spare socks.}\n\nWHAT THE MILLENNIUM BUG REALLY IS:\n Old computers saved the year as two numbers, like "99". When it goes to "00", some of them might think it's 1900! Lots of clever people have been fixing it all year. It'll PROBABLY be fine. But I've got beans, just in case.\n\nVisit the bunker: http://millenniumbunker.netz/\n\nStay safe,\n{kidY2k}\n(in the bunker)`, foot: unsubLine('bunker') }],
  });

  // ================================================================ UNSUBSCRIBE PAGES (they never work)
  const prog = '<div class="mg-uoprog"><i></i></div>';
  G.unsub('jaweekly', { name: 'JACK ATTACK! Weekly', page: n => `<h2>Unsubscribe from JACK ATTACK! Weekly?</h2><p>Are you SURE? There's Gubbinz's Corner and everything.</p><p><button type="button" class="mg-btn" data-mgdodge data-mguo="jaweekly">Yes, unsubscribe me</button></p>`, click: t => { t.closest('.mg-uobody').innerHTML = '<h2>Done!</h2><p>You have been unsubscribed.</p><p>...</p><p><b>UPDATE:</b> Gubbinz has eaten the database. You are still subscribed. Sorry!</p>'; } });
  G.unsub('n64', { name: 'The ULTRA 64 Fan Club', page: () => `<h2>Unsubscribing from the ULTRA 64 Fan Club</h2><p>Please wait while we process your request...</p>${prog}<p>Your request will be processed in 6 to 8 weeks. Or 64 weeks.</p>` });
  G.unsub('greybox', { name: 'The Grey Box Gazette', page: () => `<h2>Error</h2><p>The Unsubscribe button could not be found.</p><p>Please blow on the disc and try again.</p><p>Press X to continue. (There is no X.)</p>` });
  G.unsub('orbit', { name: 'Orbit Bulletin', page: () => `<h2>Unsubscribe request sent!</h2><p>Your request is travelling to our server at the speed of light.</p><p>Our server is on a satellite near Proxima Centauri. Your request will arrive in about <b>4.2 years</b>. Please keep reading the Bulletin until then.</p>` });
  G.unsub('starport', { name: 'The Starport Sci-Fi Society', page: () => `<h2>TRANSMISSION ERROR</h2><p>Your unsubscribe request has fallen into a black hole.</p><p>From where you're standing it will take forever to get there. From where it's standing it already has. Physics!</p>` });
  G.unsub('outerrim', { name: 'The Outer Hem Fan Club', page: () => `<h2>These aren't the unsubscribe pages you're looking for.</h2><p>You can go about your business.</p><p>Move along.</p><p>(You are still subscribed.)</p>` });
  G.unsub('blocks', { name: 'The Falling Blocks Society', page: () => `<h2>Unsubscribing...</h2><p>Your request didn't fit. We've rotated it.</p><p>It still didn't fit. We've rotated it again.</p><p><b>GAME OVER.</b> You are still subscribed. Insert coin to try again.</p>` });
  G.unsub('cube', { name: 'The Cubists\' Club', page: () => `<h2>To unsubscribe, solve the cube below.</h2><p style="font:28px monospace;line-height:1">&#11035;&#129001;&#11036;<br>&#129000;&#11035;&#129001;<br>&#11036;&#129000;&#11035;</p><p><button type="button" class="mg-btn" data-mguo="cube">I give up</button></p>`, click: t => { t.parentNode.innerHTML = '<b>Giving up is not allowed in the Cubists\' Club.</b> You are still subscribed. Keep twisting!'; } });
  G.unsub('joke', { name: 'Joke of the Day', page: () => `<h2>Why did the e-mail address cross the road?</h2><p>To stay subscribed!</p><p>(That's the joke. And the answer. You're still subscribed.)</p>` });
  G.unsub('mystic', { name: 'Mystic Gubbinz', page: () => `<h2>MYSTIC GUBBINZ SAW DIS COMING.</h2><p>Da crystal ball sez: NO.</p><p>Da crystal ball also sez yer lucky number iz 7.</p>` });
  G.unsub('mike', { name: 'Megahertz Mike', page: () => `<h2>Unsubscribe processing at 33MHz...</h2>${prog}<p>Please upgrade to a faster processor to unsubscribe faster. Mike recommends 500MHz.</p>` });
  G.unsub('csotd', { name: 'Cool Site of the Day', page: () => `<h2>This page has been chosen as COOL SITE OF THE DAY!</h2><p>As a reward, you have been subscribed for another year!</p>` });
  G.unsub('hamster', { name: 'Hamster Cam', page: () => Cast.t(`<h2>{hamster} is processing your request.</h2><p>{hamster} has put your request in {hamster.his} cheek.</p><p>{hamster} has gone in {hamster.his} tube.</p><p>{hamster} is asleep.</p>`) });
  G.unsub('rock', { name: 'Rocky the Pet Rock', page: () => `<h2>Unsubscribe from Rocky?</h2><p>Rocky has received your request.</p><p>Rocky has not moved.</p><p>Rocky is a rock.</p>` });
  G.unsub('teef', { name: 'Da Gem Exchange', page: () => `<h2>UNSUBSCRIBIN COSTS 5 RUPEES</h2><p>Yer Rupee balance: <b>${window.Econ && Econ.rupees ? Econ.rupees(0, true) : '0 Rupees'}</b>.</p><p>Earn more Rupees by stayin subscribed! WAAAGH!</p>` });
  G.unsub('zone', { name: 'The JackNet Zone', page: () => `<h2>Notification settings</h2><p><label><input type="checkbox" checked data-mguo="zone"> Tell me about EVERYTHING</label></p><p class="mg-small">Untick the box to stop getting e-mails.</p>`, click: t => { setTimeout(() => { t.checked = true; t.parentNode.insertAdjacentHTML('afterend', '<br><b>The box has ticked itself again.</b> It likes being ticked.'); }, 600); } });
  G.unsub('forums', { name: 'JACK ATTACK! Forums', page: () => `<h2>Stop watching this topic?</h2><p>The topic is watching you back.</p><p>Visit the forums to change your settings: <a href="http://www.jackattack.jnet/forums.htm">www.jackattack.jnet/forums.htm</a></p>` });
  G.unsub('bunker', { name: 'The Millennium Bunker', page: () => `<h2>CANNOT UNSUBSCRIBE: Y2K LOCKDOWN</h2><p>The bunker doors are sealed until 1 January 2000.</p><p>Please eat some beans and try again next year.</p>` });
})();
