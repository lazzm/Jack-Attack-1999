/* cx-mag-b: the words of JACK ATTACK! back issues, July to December 1999 (lazy, loaded by js/cx.js; drawn by js/cx-mag.js).
 * Same rules as cx-mag-a.js: real games, UK release dates (never early), kid's-eye opinions, no copied text.
 * Dates checked: Wikipeedia (EU/PAL lines), the EuroGold 1999 UK list, NASSA mission pages. Compo answers live in mods/cx.js. */
(function () {
  'use strict';
  const M = window.CXMag; if (!M) return;
  const T = (x, y, s, txt, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.f || 'Anton,Impact,Arial Black,sans-serif'}" font-size="${s}" text-anchor="${o.a || 'middle'}" fill="${o.c || '#fff'}"${o.st ? ` stroke="${o.st}" stroke-width="${o.sw || 2}" paint-order="stroke"` : ''}>${txt}</text>`; };
  const stars = (n, seed, h) => Array.from({ length: n }, (_, i) => `<circle cx="${(i * 67 + seed) % 300}" cy="${(i * 41 + seed * 3) % (h || 400)}" r="${i % 7 ? 0.8 : 1.6}" fill="#fff"/>`).join('');
  const lines = (arr, x, y, s, c, f) => arr.map((t, i) => `<text x="${x}" y="${y + i * (s + 6)}" font-family="${f || 'Arial Black,Arial,sans-serif'}" font-size="${s}" fill="${c || '#fff'}">${t}</text>`).join('');

  // ================================================================ JULY
  M.add(7, {
    blurb: { editorial: 'Intergalactic Battles! The Moon! Holidays!', reviews: 'Ape Escapade, F-1 World Grand Prix II, Attack of the Saucerbloke, Q-Type DX, Supermun 64', previews: 'Pocket Critters, Marlo Golf, the Daydream', letters: 'Strawberries and spoilers', cheats: 'Racer + Driver part 2', poster: 'The Moon: 30 years', compo: 'Win 40 Rupees' },
    ed: `<p>JULY! Three massive things this month:</p>
      <p><b>1. INTERGALACTIC BATTLES.</b> <i>The Phantom Nuisance</i> is out here on <b>Friday 16 July</b>. We've got tickets for the Saturday morning showing. Dad is taking me, Luke, Dave and JackK. Spoiler ban stays on until then. After that, ANYTHING GOES.</p>
      <p><b>2. THE MOON.</b> On <b>20 July</b> it will be exactly <b>30 years</b> since Apolly 11 landed on the Moon and Neil Armweak and Buzz Aldrip walked on it. Michael Collinz stayed in orbit going round and round, which I think is the most patient anyone has ever been. The poster this month is all about it.</p>
      <p><b>3. SCHOOL'S OUT.</b> Nearly. Six weeks of games, BLOCKO and staying up late.</p>
      <p>I'm saving up for the BLOCKO Intergalactic Battles Z-Wing (<b>£29.99</b>). I'm about three car washes away. Also Wimbledon is on, so Mom is not available for anything between 2pm and 8pm.</p>`,
    revIntro: 'Summer\'s here: monkeys, racing cars, a little alien, a classic shooter, and... Supermun. Sorry.',
    rev: [
      { g: 'Ape Escapade', p: 'PLAYSPACE', d: '07-02', s: [86, 88, 92, 88], o: 90, v: 'Gotta Stash \'Em All. (Monkeys.)',
        t: ['A monkey has put on a magic helmet that makes him super clever, and now loads of monkeys have escaped through a time machine. You chase them through different times with a net and catch them. Every monkey has a helmet with a light on top that changes colour when it sees you, and then it runs off.',
          'You HAVE to have the controller with two sticks to play it: one stick moves your boy, the other swings whatever you\'re holding, like the net or a stick. It feels weird for five minutes, then it\'s the best thing ever. The monkeys all have names and they do funny dances.'],
        up: 'Catching monkeys. Two-stick controls. Gadgets.', dn: 'Needs the two-stick pad. Some monkeys are SO annoying.' },
      { g: 'F-1 World Grand Prix II', p: 'ULTRA 64', d: '07-02', s: [86, 76, 84, 84], o: 84, v: 'Lights out and away we go!',
        t: ['Formula One on the ULTRA 64, with all the real teams, drivers and tracks from last season. You can do proper race weekends with practice and qualifying, or just a quick race. You can turn the help on, so the car brakes for corners for you, which I did.',
          'It\'s quite realistic, which means if you touch anybody your front wing falls off. Dad loves it. Dad shouts at the TV during the real races too, so this is not new.'],
        up: 'All the real teams. Proper race weekends. Dad likes it.', dn: 'Hard without the helpers. Wing falls off. A lot.' },
      { g: 'Attack of the Saucerbloke', p: 'PLAYSPACE', d: '07-16', s: [74, 76, 72, 66], o: 71, v: 'Take me to your leader.',
        t: ['You\'re a little alien who has landed on Earth, running about zapping things and blowing up things in a funny cartoony way. It\'s silly and colourful and the alien makes good noises.',
          'But it\'s quite short, and it gets a bit samey after a few levels. Fun for a rainy afternoon in the holidays, then back on the shelf.'],
        up: 'Funny. Colourful. Good noises.', dn: 'Short. Samey. Not much to do.' },
      { g: 'Q-Type DX', p: 'GAME LAD COLOR', d: '07-20', s: [82, 80, 88, 86], o: 86, v: 'Old school, new colours.',
        t: ['Two classic space shooting games (Q-Type and Q-Type II) on one Game Lad Color cart, plus a special mode that plays them both one after the other. You fly a little ship sideways through alien bases and shoot everything.',
          'The best bit is the Force, a little ball you can stick on the front or back of your ship, or fire off to bounce around. It\'s really hard. Dad says the arcade one was even harder and he spent all his pocket money on it.'],
        up: 'Two games in one. The Force pod. Proper hard.', dn: 'Proper hard. Batteries.' },
      { g: 'Supermun', p: 'ULTRA 64', d: '07-23', s: [40, 44, 28, 30], o: 32, v: 'Up, up and... oh no.',
        t: ['Supermun has to save his friends in a city made by a computer, which is full of green fog so you can\'t see very far. The first thing you do is fly through rings. Then you fly through more rings. Then, if you miss a ring, you start again and fly through the rings again.',
          'The flying controls go everywhere. Luke flew into a building and got stuck in it. I really wanted this to be good because Supermun is brilliant. It is NOT good. Rent it, laugh, take it back. Don\'t buy it.'],
        up: 'It\'s Supermun. Laughing at it with your mates.', dn: 'Rings. Fog. Rings in the fog. More rings.' },
    ],
    pre: [
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', when: 'This autumn!', hype: 99, t: 'IT\'S COMING. The cartoon is already on telly here (on satellite: JackK has it, I watch it at his house). Two versions, 150 monsters, trade them over a Link Cable. Start saving.' },
      { g: 'Marlo Golf', p: 'ULTRA 64', when: 'After the holidays', hype: 76, t: 'Marlo and friends play golf, from the people who made a famous golf game in Japan. You unlock more players by beating them. Mom might actually play this one.' },
      { g: 'The Daydream', p: 'SEGUE', when: 'This autumn', hype: 88, t: 'Segue\'s new console is coming to Europe this autumn. 128-bit, a modem in the box, and a memory card with a little screen on it. Callum has already started saving. He says he is "investing".' },
    ],
    let: [
      { from: 'Luke', how: 'by e-mail', t: 'Jack, it\'s Wimbledon and my mom won\'t let me play the ULTRA 64 because she\'s watching the tennis on the big telly. Is there a tennis game I can play on the little telly? Luke', r: 'Play the tennis in the garden with a real racket, like an animal. That\'s what I do while Mom watches.' },
      { from: 'JackK', how: 'by e-mail', t: 'Jack I have seen a picture of the new Intergalactic Battles baddie with the red and black face in a magazine. Is that a spoiler? JackK', r: 'A picture is NOT a spoiler. It\'s on every poster. Anything that happens in the film IS a spoiler. Nine days left. Hold the line.' },
      { from: 'Dave', how: 'shouted over the garden fence', t: 'JACK. MY COUSIN SAYS IN THE NEW INTERGALACTIC BATTLES', r: 'LA LA LA LA LA LA. (Dave has been cut off by the editor.)' },
    ],
    ch: [
      { g: 'Episode I Racer', p: 'ULTRA 64 / PC', t: 'Coming up to a jump? Tilt your nose up for more air and down to land faster. And keep an eye on your engines: if one catches fire, hold the repair button and it puts it out while you drive.' },
      { g: 'Driver', p: 'PLAYSPACE', t: 'In the chases, the police cars go mad if you drive past them fast. Drive normally (stop at red lights!) and they leave you alone. It\'s a very polite game.' },
      { g: 'Micro Mechanics 64 Turbo', p: 'ULTRA 64', t: 'Two people per controller: one holds the left side, one holds the right. Decide who gets which side BEFORE you start. Learn from our mistakes.' },
      { g: 'Ape Escapade', p: 'PLAYSPACE', t: 'Sneak up on monkeys slowly by pushing the stick only a little bit. If their helmet light goes red, they\'ve seen you. Wait, and let it go back to normal.' },
    ],
    poster: { title: 'THE MOON: 30 YEARS', col: '#000010', cap: '20 July 1969: Apolly 11 landed in the Sea of Tranquility. Neil Armweak and Buzz Aldrip walked on the Moon while Michael Collinz flew round it in the command module. 30 years ago this month!',
      svg: `<rect width="300" height="400" fill="#000010"/>${stars(80, 7)}<circle cx="150" cy="170" r="110" fill="#c8c8c0"/><g fill="#a8a8a0">${[[110, 120, 22], [190, 150, 30], [140, 220, 18], [200, 230, 12], [96, 190, 10], [170, 100, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><circle cx="186" cy="168" r="5" fill="#ffd400" stroke="#000"/><path d="M186 168 L250 120" stroke="#ffd400" stroke-width="2"/>${T(258, 112, 12, 'SEA OF TRANQUILITY', { c: '#ffd400', a: 'end' })}${T(150, 34, 30, 'THE MOON', { c: '#fff' })}<g transform="translate(150 330)"><path d="M-30 0 h60 l-10 -26 h-40z" fill="#e8c860" stroke="#000" stroke-width="2"/><path d="M-30 0 l-14 18 M30 0 l14 18 M-10 0 l-6 18 M10 0 l6 18" stroke="#ccc" stroke-width="3"/><rect x="-14" y="-44" width="28" height="18" fill="#ddd" stroke="#000" stroke-width="2"/><circle cx="0" cy="-35" r="4" fill="#222"/></g>${T(150, 392, 12, '30 YEARS SINCE THE FIRST MOONWALK', { c: '#9fd0ff' })}` },
    compo: { intro: 'WIN 40 RUPEES! Three questions on the July issue. May the Farce be with you.',
      q: [['When is The Phantom Nuisance out in the UK?', ['16 July', '19 May', '20 July', '1 August']],
        ['How many years since Apolly 11 landed on the Moon on 20 July?', ['25', '30', '40', '20']],
        ['How much is the BLOCKO Z-Wing Jack is saving up for?', ['£9.99', '£19.99', '£49.99', '£29.99']]] },
  });

  // ================================================================ AUGUST
  M.add(8, {
    blurb: { editorial: 'The eclipse is coming!', reviews: 'Rugpats: Scavenger Hunt, Crock 2, Speed Geeks, Tiberian Moon, BLOCKO Racers', previews: 'Pocket Critters, Tony Squawk\'s, Finally Fantasy VIII', letters: 'WE SAW INTERGALACTIC BATTLES', cheats: 'Racer, Ape Escapade, BLOCKO', poster: 'Eclipse safety!', compo: 'Win 40 Rupees' },
    ed: `<p>WE SAW INTERGALACTIC BATTLES. Saturday morning, front row (bad idea, neck still hurts). The peapod race was the best ten minutes of my life. The lightspatula fight at the end with the double-ended lightspatula: jackreal. Dave cried at one bit and says he didn't. He did. Spoiler ban is now OFF.</p>
      <p>Next big thing: on <b>Wednesday 11 August</b> there's a <b>total eclipse of the Sun</b>. The Moon goes right in front of the Sun. In Cornwall it goes completely dark for about two minutes at about <b>11:11 in the morning</b>. Where we are, most of the Sun gets covered but not all of it. <b>NEVER LOOK STRAIGHT AT THE SUN</b>, not even with sunglasses. Make a pinhole viewer (see the poster) or use proper eclipse glasses.</p>
      <p>Space news: at the end of July NASSA crashed a probe called <b>Lunar Prospectus</b> into the Moon ON PURPOSE, to see if it would throw up water from ice in a crater. Nobody saw a splash. The Moon is keeping its secrets.</p>`,
    revIntro: 'The summer holidays: a crocodile, a load of karts, some BLOCKO, and Callum in a war room.',
    rev: [
      { g: 'Rugpats: Scavenger Hunt', p: 'ULTRA 64', d: '08-10', s: [70, 66, 62, 58], o: 62, v: 'For little brothers and sisters.',
        t: ['A board game with the babies from the cartoon. Up to four of you go round the board looking for things, with some mini-games on the way. It looks just like the cartoon.',
          'It\'s fine for little kids. My little sister {jsister} loved it. I played it with her for an hour and lost twice. To be honest she was better at it than me. Don\'t tell anyone.'],
        up: 'Looks like the cartoon. Good for little kids.', dn: 'Slow. Not many mini-games. Losing to your little sister.' },
      { g: 'Crock 2', p: 'PLAYSPACE', d: '08-20', s: [82, 80, 80, 80], o: 80, v: 'Snap happy.',
        t: ['Crock the crocodile is back, and this time he\'s off to find his mom and dad, with help from the little furry Gobbos. It\'s a 3D platform game with lots of different villages, jumping puzzles and silly bosses.',
          'The controls are better than the first game and it\'s really colourful. It\'s quite easy, but there\'s loads to collect. A good one for the summer holidays.'],
        up: 'Colourful. Gobbos. Lots of collecting.', dn: 'Easy. Some jumping is fiddly.' },
      { g: 'Speed Geeks', p: 'PLAYSPACE', d: '08-27', s: [84, 82, 86, 84], o: 85, v: 'Kart Kaos, but on the PlaySpace.',
        t: ['Cartoon kids racing go-karts round bendy tracks, firing weapons at each other. It\'s fast and very colourful, with lots of shortcuts and power-ups.',
          'If you\'ve got a PlaySpace and you\'re jealous of Kart Kaos, this is for you. Four-player with a Multi Tap is good fun. Luke says Kart Kaos is better. Luke has an ULTRA 64. Luke would say that.'],
        up: 'Fast. Funny weapons. Four-player.', dn: 'Not Kart Kaos (sorry). The music.' },
      { g: 'Command & Confuse: Tiberian Moon', p: 'PC', d: '08-27', s: [86, 88, 88, 92], o: 89, v: 'Construction complete.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: the big strategy game sequel is FINALLY here. Two sides fight over a green crystal that spreads across the world. You build a base, harvest the crystal for money and build an army to smash the other side.',
          'There are giant walking robots now, and the ground can get blown into craters. There are films between the missions with real actors. I did the first ten missions in two days. My dad asked if I\'d seen the sun this summer. I said yes, during the eclipse.'],
        up: 'Walking robots. Massive battles. Films between missions.', dn: 'Pathfinding (my units get lost going round a tree).' },
      { g: 'BLOCKO Racers', p: 'PC', d: '08-27', s: [80, 78, 84, 88], o: 85, v: 'Build it. Race it. Break it.',
        t: ['You BUILD your car out of BLOCKO, brick by brick, and you build your driver too, then you race against BLOCKO characters to become champion. You pick up bricks on the track for power-ups, like cannons and turbos.',
          'The building bit is the best bit. I made a car that\'s just a massive tower. It\'s slow, but it looks AMAZING. The champion is a racer called Rocket Racer and he is very smug. I beat him. He is less smug now.'],
        up: 'Building your car. Building your driver. Beating Rocket Racer.', dn: 'Bit short. Some races are too easy.' },
    ],
    pre: [
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', when: 'October', hype: 100, t: 'Two months. TWO MONTHS. I\'ve decided I\'m picking Squirturtle. Luke is picking Charbroiler. Dave says he\'s picking Zapachu, which you can\'t do, Dave.' },
      { g: 'Tony Squawk\'s Skateboarding', p: 'PLAYSPACE', when: 'Autumn', hype: 85, t: 'A skateboarding game with real pro skaters. Two minutes per go, do as many tricks as you can. Everyone in America is going mad for it.' },
      { g: 'Finally Fantasy VIII', p: 'PLAYSPACE', when: 'Autumn', hype: 90, t: 'The next massive Finally Fantasy. FOUR discs. The people are drawn like real people now, not little blocky ones. The intro is meant to be like a film. Get comfy.' },
    ],
    let: [
      { from: 'Dave', how: 'by e-mail (his first ever e-mail!!!)', t: 'jack i did not cry in intergalactic battles. i had something in my eye. it was a bit of popcorn. dave', r: 'Popcorn. In both eyes. For ten minutes. Sure thing, Dave. (Welcome to e-mail!)' },
      { from: '{club4}', how: 'by e-mail', t: 'Dear Jack, my teacher says we can\'t look at the eclipse. What is the point of an eclipse if you can\'t look at it?? {club4}', r: 'You CAN look at it, just not straight at it! Make a pinhole viewer: a hole in a bit of card, and the Sun shines through onto another bit of card. You see a little picture of the eclipse. See the poster!' },
      { from: 'Callum', how: 'by e-mail', t: 'Jack, can I write the Tiberian Moon review? I\'ve played it more than anyone in the country. Probably. Callum', r: 'Yes. Done. It\'s in this issue. Now go outside. It\'s August.' },
    ],
    ch: [
      { g: 'Ape Escapade', p: 'PLAYSPACE', t: 'When you\'ve caught a few monkeys, go back to old levels with your new gadgets. Some monkeys can only be reached with the right gadget.' },
      { g: 'Episode I Racer', p: 'ULTRA 64 / PC', t: 'Spend your prize money on better parts at the junk shop, not on pit droids, once you\'ve got four droids. More droids = faster repairs, but four is plenty.' },
      { g: 'BLOCKO Racers', p: 'PC', t: 'Collect the same colour power-up brick more than once before you use it and it gets more powerful. Three white bricks = super-powered.' },
      { g: 'RollerCoaster Rupeecoon', p: 'PC', t: 'Put the toilets and food stalls near the exits of your scariest coasters. Guests come off feeling sick. Plan ahead. (Mom says this is the most sensible tip in the whole magazine.)' },
    ],
    poster: { title: 'ECLIPSE SAFETY!', col: '#000', cap: 'NEVER look straight at the Sun, not even through sunglasses, binoculars or a camera. Use a pinhole viewer or proper eclipse glasses. Total in Cornwall on Wednesday 11 August at about 11:11am, for about two minutes.',
      svg: `<rect width="300" height="400" fill="#05050f"/>${stars(40, 3, 200)}<circle cx="150" cy="120" r="80" fill="#ff9a00" opacity=".25"/><circle cx="150" cy="120" r="56" fill="#fff6c0" opacity=".9"/><circle cx="150" cy="120" r="50" fill="#000"/>${T(150, 30, 26, 'ECLIPSE SAFETY!', { c: '#ffd400' })}<g transform="translate(0 210)"><rect x="20" y="0" width="260" height="180" fill="#ffd400"/>${T(150, 30, 20, 'MAKE A PINHOLE VIEWER', { c: '#000' })}<rect x="40" y="50" width="60" height="70" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="70" cy="85" r="2" fill="#000"/><path d="M70 85 L210 110 M70 85 L210 70" stroke="#e10600" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="200" y="50" width="60" height="70" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="230" cy="90" r="9" fill="#ff9a00"/><circle cx="234" cy="90" r="8" fill="#fff"/><text x="44" y="140" font-family="Arial Black,Arial" font-size="10">1. HOLE IN CARD</text><text x="168" y="140" font-family="Arial Black,Arial" font-size="10">2. WATCH THIS ONE</text>${T(150, 168, 16, 'SUN BEHIND YOU. NEVER LOOK AT IT!', { c: '#e10600' })}</g>` },
    compo: { intro: 'WIN 40 RUPEES! Three questions on the August issue. Do not look at the Sun while answering.',
      q: [['At about what time is the eclipse total in Cornwall?', ['9:11am', '10:11am', '12:11pm', '11:11am']],
        ['What should you NEVER do during an eclipse?', ['Wear a hat', 'Stay indoors', 'Look straight at the Sun', 'Make a pinhole viewer']],
        ['What did NASSA crash Lunar Prospectus into?', ['The Moon', 'Mars', 'The Sun', 'The sea']]] },
  });

  // ================================================================ SEPTEMBER
  M.add(9, {
    blurb: { editorial: 'Back to school + countdowns', reviews: 'Re-Vault, Beetle Adventure Pacing, Hover Havoc 3, Marlo Golf, Sled Squall', previews: 'Pocket Critters, Daydream, Finally Fantasy VIII', letters: 'The eclipse was cloudy', cheats: 'Cube tips + golf', poster: 'Solve the cube!', compo: 'Win 40 Rupees' },
    ed: `<p>Back to school. New pencil case, same old timetable. The holidays went SO fast. I didn't even finish my Blockology marathon.</p>
      <p>The eclipse: it was cloudy here. Of COURSE it was cloudy. But it went dark and cold and quiet, and the birds stopped singing, and the street lights came on in the middle of the morning. It was really weird and really brilliant. My pinhole viewer showed a little crescent Sun for about a minute when the clouds moved. Worth it.</p>
      <p>Now the COUNTDOWNS: the <b>Daydream</b> comes out in America on <b>9/9/99</b>, and here on <b>14 October</b>. And <b>Pocket Critters</b> is out here on <b>5 October</b>! I'm picking Squirturtle. I've been picking Squirturtle for nine months.</p>
      <p>Poster this month: a simple way to solve the Rubrick's cube, layer by layer. I've got it down to 1 minute 40. Resolution number 3 (under a minute) is still on.</p>`,
    revIntro: 'Little cars, curvy Beetles, anti-gravity, golf and snow. A very racy month.',
    rev: [
      { g: 'Re-Vault', p: 'PC', d: '09-03', s: [86, 80, 86, 88], o: 86, v: 'Remote control chaos.', by: 'Jack (on Callum\'s PC)',
        t: ['Racing radio-controlled cars! But the tracks are in houses, supermarkets and museums, so you race under tables and between shelves, and a skateboard ramp is a massive jump. There are weapons like water balloons and a lightning bolt.',
          'There\'s a track editor too. The cars bounce and flip about like real RC cars, which means you spend some time upside down in the frozen food aisle. Callum\'s 3D card makes it look amazing.'],
        up: 'Racing in a supermarket. Bouncy cars. Track editor.', dn: 'Flipping over. Some cars are too fast to steer.' },
      { g: 'Beetle Adventure Pacing', p: 'ULTRA 64', d: '09-04', s: [90, 84, 88, 86], o: 88, v: 'Shortcuts everywhere!',
        t: ['You race those new round Beetle cars through massive tracks full of secret shortcuts: through caves, over waterfalls, past dinosaurs. There are boxes hidden all over the tracks to find, and finding them all unlocks stuff.',
          'It looks gorgeous for an ULTRA 64. There\'s also a battle mode where you drive round an arena firing things at your mates. Luke found a shortcut through a barn. I found a shortcut into a lake.'],
        up: 'Shortcuts. Beautiful tracks. Battle mode.', dn: 'Only a few tracks. The lake.' },
      { g: 'Hover Havoc 3', p: 'PLAYSPACE', d: '09-10', s: [94, 96, 88, 86], o: 90, v: 'The future is fast.',
        t: ['Anti-gravity racing in the future, in very cool hover ships, on tracks that loop and twist through a shiny city. Everything looks really clean and stylish, and the music is like being in a club (I\'ve never been in a club, but I imagine).',
          'It\'s now in high resolution, so everything is super sharp, and you can play two-player split screen. It\'s really hard to begin with. Then you learn the airbrakes and suddenly you\'re flying.'],
        up: 'Looks amazing. The music. Two-player.', dn: 'Very hard at first. Bumping walls.' },
      { g: 'Marlo Golf', p: 'ULTRA 64', d: '09-14', s: [86, 84, 92, 94], o: 91, v: 'Hole in one!',
        t: ['Golf, with Marlo and his friends. You aim, press the button for power, press it again for accuracy, and watch the ball fly. Every character hits it differently. You win new characters by beating them in matches.',
          'It\'s really good, even if you don\'t like golf (I don\'t like golf). Four people can play, and there\'s a mini golf mode. MOM PLAYED IT. Mom beat me. Mom then said "this is just like real golf" and went to make tea, undefeated.'],
        up: 'Easy to learn. Unlocking characters. Mom playing.', dn: 'Losing to Mom.' },
      { g: 'Sled Squall', p: 'PLAYSPACE', d: '09-24', s: [86, 84, 86, 84], o: 85, v: 'Brrrrrr-illiant.',
        t: ['Snowmobile racing down mountains, through forests and over massive jumps where you do tricks in the air. It\'s really fast and the snow sprays everywhere.',
          'The tricks give you boost, so you want to show off on every jump. Two-player is good. Played it in a warm bedroom with a duvet on to make it feel real.'],
        up: 'Massive jumps. Tricks. Snow!', dn: 'Easy to fall off. Some tracks look alike.' },
    ],
    pre: [
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', when: '5 October', hype: 100, t: 'THIS IS NOT A DRILL. 5 October. You get one of three starters, Professor Acorn gives you a Critterdex, and you go and catch them all. Get a Link Cable. Get two versions in your house if you can (or make friends with someone who has the other one).' },
      { g: 'The Daydream', p: 'SEGUE', when: '14 October', hype: 95, t: 'Out in America on 9/9/99 and here on 14 October. Zip Adventure looks JACKREAL. It comes with a modem so you can go on the Internet on the telly.' },
      { g: 'Finally Fantasy VIII', p: 'PLAYSPACE', when: 'October', hype: 92, t: 'Out in October! You\'re Squawl, a student at a school for soldiers. There\'s a card game inside the game that everyone says is better than most games.' },
    ],
    let: [
      { from: 'JackK', how: 'by e-mail', t: 'Jack, the eclipse was cloudy at mine too. But my dog barked at it. Does that count? JackK', r: 'That definitely counts. Animals go a bit funny in an eclipse. {cat} went under the bed. ({cat.He} does that anyway.)' },
      { from: '{kidVal}', how: 'by e-mail', t: 'Hi Jack! I can solve the Rubrick\'s cube now!!! It took me all summer. Love {kidVal}', r: 'BRILLIANT! What\'s your time? Mine\'s 1:40. Race you. (This month\'s poster is how I do it.)' },
      { from: 'Luke', how: 'by e-mail', t: 'Jack, which Pocket Critters should I pick? Luke', r: 'You told me you\'re picking Charbroiler. You told me 41 times. Pick Charbroiler, Luke.' },
    ],
    ch: [
      { g: 'Marlo Golf', p: 'ULTRA 64', t: 'Watch the wind arrow! Aim a bit to one side when it\'s windy. And on the greens, look at the grid lines: they show which way the ground slopes.' },
      { g: 'Hover Havoc 3', p: 'PLAYSPACE', t: 'Use the airbrakes on tight corners: tap the left or right one to swing round. Pros use them on every bend.' },
      { g: 'Rubrick\'s Cube', p: 'REAL LIFE', t: 'Start with a white cross on top, with the edges matching the middle colours on the sides. That\'s the hardest bit to get your head round. After that, see the poster.' },
      { g: 'Beetle Adventure Pacing', p: 'ULTRA 64', t: 'Every track has loads of shortcuts. If you see a fence that looks weak or a ramp that seems to go nowhere, go through it.' },
    ],
    poster: { title: 'SOLVE THE CUBE!', col: '#202020', cap: 'A Rubrick\'s cube has 6 faces, each with 9 stickers. Solve it in layers: the white cross, the white corners, the middle layer, the yellow cross, then the last corners. Practise each step until you can do it without thinking.',
      svg: `<rect width="300" height="400" fill="#202020"/>${T(150, 40, 30, 'SOLVE THE CUBE!', { c: '#ffd400' })}<g transform="translate(110 60) scale(1.1)"><path d="M36 0 L72 18 L36 36 L0 18Z" fill="#fff" stroke="#000" stroke-width="2"/><path d="M0 18 L36 36 V78 L0 60Z" fill="#e10600" stroke="#000" stroke-width="2"/><path d="M72 18 L36 36 V78 L72 60Z" fill="#2a7ad8" stroke="#000" stroke-width="2"/><g stroke="#000" stroke-width="1.5"><path d="M12 12 L48 30 M24 6 L60 24 M24 30 L60 12 M12 24 L48 6"/><path d="M0 32 L36 50 M0 46 L36 64 M12 24 V66 M24 30 V72"/><path d="M72 32 L36 50 M72 46 L36 64 M60 24 V66 M48 30 V72"/></g></g>${[['1', 'WHITE CROSS', '#fff'], ['2', 'WHITE CORNERS', '#fff'], ['3', 'MIDDLE LAYER', '#3ad03a'], ['4', 'YELLOW CROSS', '#ffd400'], ['5', 'YELLOW FACE', '#ffd400'], ['6', 'LAST CORNERS', '#ff8a00'], ['7', 'LAST EDGES: DONE!', '#e10600']].map(([n, t, c], i) => `<circle cx="40" cy="${170 + i * 30}" r="11" fill="${c}" stroke="#000"/><text x="40" y="${175 + i * 30}" text-anchor="middle" font-family="Arial Black,Arial" font-size="12">${n}</text><text x="60" y="${175 + i * 30}" font-family="Arial Black,Arial" font-size="14" fill="#fff">${t}</text>`).join('')}` },
    compo: { intro: 'WIN 40 RUPEES! Three questions on the September issue. You\'ve had all summer to practise.',
      q: [['When does the Daydream come out in the UK?', ['9 September', '14 October', '5 October', '25 December']],
        ['How many faces does a Rubrick\'s cube have?', ['4', '9', '6', '8']],
        ['Which Pocket Critters is Jack picking?', ['Bulbabeast', 'Squirturtle', 'Charbroiler', 'Zapachu']]] },
  });

  // ================================================================ OCTOBER
  M.add(10, {
    blurb: { editorial: 'The biggest month in history', reviews: 'Pocket Critters! Zip Adventure, Power Rock, Finally Fantasy VIII, Tony Squawk\'s, Jet Pack Twins, Rayhand 2, Homeplanet, Age of Emperors II', previews: 'Smush Bros., Donkey Wrong 64, Spike the Stegosaur 2', letters: 'Gotta Stash \'Em All', cheats: 'Pocket Critters tips galore', poster: 'Console spotter\'s guide', compo: 'Win 40 Rupees' },
    ed: `<p>THIS IS IT. The biggest month for games EVER. On <b>5 October</b> Pocket Critters Moss and Puddle come out. On <b>14 October</b> the Daydream comes out, for <b>£199.99</b>. And then Finally Fantasy VIII, and Jet Pack Twins, and Rayhand 2... My pocket money has left the building.</p>
      <p>Plus the Rugby World Cup starts today in Wales, at the new Millennium Stadium. And it's Halloween at the end of the month, so this is also our SPOOKY SPECIAL (Gubbinz is dressed as a ghost. It's a tea towel).</p>
      <p>This issue has NINE reviews, the most ever. Some of them won't be up straight away because the games come out during the month. Keep checking back!</p>
      <p>Our poster this month is a guide to what all the "bits" mean. The Game Lad is <b>8-bit</b>, the PlaySpace is <b>32-bit</b>, the ULTRA 64 is (obviously) <b>64-bit</b>, and the Daydream is <b>128-bit</b>. More bits = more better. Mostly.</p>`,
    revIntro: 'NINE REVIEWS. The biggest Reviews section in JACK ATTACK! history. Each one goes up the day the game is out.',
    rev: [
      { g: 'Homeplanet', p: 'PC', d: '10-01', s: [94, 96, 88, 90], o: 91, v: 'Space is BIG.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: a strategy game in proper 3D space. You\'ve got a giant mothership full of people, looking for your home planet, and you build fighters, frigates and huge battleships to protect it. You can spin the camera round anywhere and zoom in on any ship.',
          'Watching hundreds of little fighters swarm round a battleship with laser trails everywhere is the best-looking thing I\'ve ever seen on a computer. The music at the start is really sad and really good. Your fleet carries on to the next mission, so don\'t waste ships.'],
        up: 'Full 3D space battles. The music. The mothership.', dn: 'Hard to tell up from down. Losing ships forever.' },
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', d: '10-05', s: [82, 88, 97, 99], o: 96, v: 'I\'ve stopped doing homework.',
        t: ['FINALLY. You get your first Pocket Critters from Professor Acorn (I picked Squirturtle, of course), and set off across the land catching wild Pocket Critters, training them up and battling the eight Gym Leaders. Every Pocket Critters has a type, like water or fire or grass, and water beats fire, fire beats grass, grass beats water. Simple, but there\'s LOADS more to it.',
          'Moss and Puddle have some different Pocket Critters in them, so to catch all 150 you need to trade with someone who has the other version, using a Link Cable. Everyone at school has it. The playground is now basically a trading market. I have 47. Luke has 52. Dave has 4, and three of them are Ratatat.'],
        up: 'Catching them all. Trading. Battles. Endless.', dn: 'You need both versions. Zubats. So many Zubats.' },
      { g: 'Zip Adventure', p: 'DAYDREAM', d: '10-14', s: [97, 88, 84, 80], o: 87, v: 'Gotta go fast. Gotta save up.', by: 'Jack (at Callum\'s)',
        t: ['Callum got a Daydream ON THE DAY and I was round at his house by 4pm. The purple badger in 3D, running so fast the camera can barely keep up. In the first level a giant whale chases you along a wooden pier, smashing it to bits behind you. My mouth was open the whole time.',
          'There are six characters to play, each with their own story, and little creatures called Chums that you can raise and put on the memory card, which has a tiny screen. The camera goes mad sometimes and some characters (fishing) are a bit boring. But the fast bits are the best thing I\'ve ever seen.'],
        up: 'The whale. The speed. Graphics from the future.', dn: 'The camera. The fishing. I don\'t own a Daydream.' },
      { g: 'Power Rock', p: 'DAYDREAM', d: '10-14', s: [92, 86, 90, 86], o: 89, v: 'Throw the table!', by: 'Jack and Callum',
        t: ['A fighting game, but instead of two people punching each other in a line, you run around a whole 3D room. You can pick up chairs, tables, barrels and bombs and throw them. Collect three magic stones and you turn into a super version of your fighter.',
          'It is SO much fun with two players. Callum threw a table at me, then I threw the same table back at him. It\'s a bit short on your own, but with a mate it\'s brilliant.'],
        up: 'Throwing furniture. Transforming. Two-player.', dn: 'Short on your own. Only a few fighters.' },
      { g: 'Tony Squawk\'s Skateboarding', p: 'PLAYSPACE', d: '10-22', s: [86, 90, 95, 94], o: 93, v: 'Just one more go.',
        t: ['You\'re a real pro skater and you get two minutes per go to skate around a level, doing tricks for points and collecting things like the letters S-K-A-T-E and a secret tape. Do tricks one after another and the points multiply.',
          'It is impossible to put down. Two minutes is never enough, so you have one more go. And another. Then it\'s 10pm. The music is loud and Mom asked me what "that noise" was. I said it\'s "skate punk". She said "turn the skate punk down".'],
        up: 'Two-minute runs. Combos. Secret tapes. ONE MORE GO.', dn: 'Bails hurt (to watch). Loud.' },
      { g: 'Finally Fantasy VIII', p: 'PLAYSPACE', d: '10-27', s: [97, 93, 86, 92], o: 90, v: 'Four discs. FOUR.',
        t: ['A massive adventure on four CDs. You\'re Squawl, a student at a school that trains young soldiers. The people look like real people and the films between the bits are the best I\'ve ever seen on a PlaySpace.',
          'You "draw" magic from enemies and attach it to your stats, which is confusing for the first few hours. But the summon monsters are SPECTACULAR, and there\'s a card game called Triple Tried that I have played more than the actual game.'],
        up: 'The films. The summons. Triple Tried.', dn: 'Confusing magic system. Squall never smiles.' },
      { g: 'Rayhand 2: The Great Escape', p: 'ULTRA 64', d: '10-29', s: [92, 90, 90, 86], o: 90, v: 'No arms, no legs, no problem.',
        t: ['Rayhand is a hero with no arms or legs (his hands and feet just float) and he has to escape from robot pirates and save his world. It\'s 3D now and it looks beautiful, all forests and caves and waterfalls.',
          'You can use your hair like a helicopter to float down, and ride on a rocket that you have to steer. His friend is a big blue frog-thing who is very funny. One of the best platform games this year.'],
        up: 'Beautiful. Funny. Helicopter hair.', dn: 'The talking is in a made-up language with subtitles. A lot of reading.' },
      { g: 'Jet Pack Twins', p: 'ULTRA 64', d: '10-29', s: [92, 90, 86, 88], o: 88, v: 'Bugs. Lots of bugs.',
        t: ['From Rare (the Goldenballs and Bongo people). Two twins and their robot-armoured dog fight an army of giant ants across loads of planets. You shoot from behind your character, and the ants explode into gloop when you get them.',
          'You also have to rescue the little furry Tribals everywhere, and you need ALL of them to get to the end. That is very, very annoying. But the shooting is great and the planets are huge.'],
        up: 'Shooting ants. The dog. Massive planets.', dn: 'Rescuing EVERY Tribal. Controls take practice.' },
      { g: 'Age of Emperors II: The Age of Kingz', p: 'PC', d: '10-29', s: [90, 86, 92, 96], o: 92, v: 'Trebuchets solve everything.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: build a medieval kingdom. Villagers chop wood, farm and mine gold and stone, then you build castles and armies with knights, archers and trebuchets that throw rocks at walls. There are campaigns about real people from history, like William Wallis and Joan of Ark.',
          'It\'s even better than the first one. Watching a trebuchet knock down a castle wall is the best thing ever. Jack wants me to tell you about the car cheat. It\'s in Cheats Corner.'],
        up: 'Castles. Trebuchets. History.', dn: 'So much to manage. Villagers standing around doing nothing.' },
    ],
    pre: [
      { g: 'Super Smush Bros.', p: 'ULTRA 64', when: 'November', hype: 94, t: 'Marlo, Lingo, Zapachu, Donkey Wrong and more, all fighting each other! Knock them off the stage to win. Four players. I have already decided who I\'m going to be (Link).' },
      { g: 'Donkey Wrong 64', p: 'ULTRA 64', when: 'December', hype: 95, t: 'Coming in time for Christmas, with an Expansion Pouch in the box. Five Kongs, giant levels. Christmas list item number one (after the Daydream).' },
      { g: 'Spike the Stegosaur 2', p: 'PLAYSPACE', when: 'November', hype: 82, t: 'The little purple dragon is back. Over here it\'s called Spike the Stegosaur 2: Gateway to Glimmer. New moves: swimming, climbing, and a head-bash.' },
    ],
    let: [
      { from: 'Luke', how: 'by e-mail', t: 'Jack I have 52 Pocket Critters. How many have you got? Also, do you want to swap your spare Pidgeon for my spare Spearoo? Luke', r: '47. And NO, Luke. I know what you\'re doing. Nobody needs two Spearows.' },
      { from: 'Mom', how: 'on a note on the fridge', t: 'Jack, your Game Lad is not allowed at the dinner table. Love Mom. PS: what is a Zoo Bat?', r: 'A Zoo Bat is a bat that lives in caves and appears every three steps. Mom, I promise the Game Lad will not come to dinner. (It will sit on the stairs.)' },
      { from: 'Callum', how: 'by e-mail', t: 'Jack. I got a Daydream. Come round. Callum', r: 'ON MY WAY. (See the Zip Adventure review!)' },
    ],
    ch: [
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', t: 'In the Pocket Critters Centre by Mt. Mooncake, a man sells you a Magicarp for 500. It is rubbish. Buy it anyway, train it up to level 20 and it turns into Gyaradish. TRUST ME.' },
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', t: 'Can\'t get into Sellotape City? Buy a drink from the vending machines on the roof of the Kiln department store and give it to the thirsty guard.' },
      { g: 'Age of Emperors II', p: 'PC', t: 'Press Enter and type <b>how do you turn this on</b> for a cobra sports car with a gun on it. Also <b>robin hood</b> gives you 1,000 gold. Callum says cheating is for "noobs". Callum used it twice.' },
      { g: 'Zip Adventure', p: 'DAYDREAM', t: 'Take a Chum on your memory card (the one with the screen) to look after it on the bus. Bring it back home and it will have grown!' },
    ],
    poster: { title: 'CONSOLE SPOTTER\'S GUIDE', col: '#e8e8f0', cap: 'What the "bits" mean: how much data the chip handles in one go. Game Lad 8-bit. PlaySpace 32-bit. Ultra 64: 64-bit. Daydream: 128-bit. More bits doesn\'t always mean better games, but it does mean bragging rights.',
      svg: `<rect width="300" height="400" fill="#f0f0f8"/>${T(150, 38, 24, 'CONSOLE SPOTTER\'S', { c: '#e10600' })}${T(150, 64, 24, 'GUIDE 1999', { c: '#000' })}${[['GAME LAD', '8-BIT', '#9bbc0f', 90], ['PLAYSPACE', '32-BIT', '#2a2a8a', 160], ['ULTRA 64', '64-BIT', '#3a3a3a', 230], ['DAYDREAM', '128-BIT', '#ff7a00', 300]].map(([n, b, c, y], i) => `<rect x="20" y="${y}" width="260" height="58" fill="#fff" stroke="#000" stroke-width="2"/><rect x="28" y="${y + 8}" width="${[24, 56, 60, 52][i]}" height="${[40, 30, 26, 34][i]}" rx="4" fill="${['#c8c8d0', '#bbb', '#555', '#fafafa'][i]}" stroke="#000" stroke-width="2"/><rect x="${[32, 36, 40, 40][i]}" y="${y + 12}" width="${[16, 14, 10, 14][i]}" height="${[12, 6, 10, 14][i]}" fill="${c}"/>${T(100, y + 26, 16, n, { c: '#000', a: 'start' })}<rect x="100" y="${y + 34}" width="${[22, 44, 88, 170][i]}" height="12" fill="${c}"/>${T(272, y + 45, 13, b, { c: '#000', a: 'end' })}`).join('')}<text x="150" y="384" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#555">Bars drawn to scale. Bragging not to scale.</text>` },
    compo: { intro: 'WIN 40 RUPEES! Three questions on the biggest issue ever. Gotta answer \'em all.',
      q: [['When does Pocket Critters Moss & Puddle come out in the UK?', ['14 October', '1 October', '5 October', '31 October']],
        ['How much does the Daydream cost?', ['£199.99', '£99.99', '£149.99', '£299.99']],
        ['How many bits is the Game Lad, according to the poster?', ['32', '64', '128', '8']]] },
  });

  // ================================================================ NOVEMBER
  M.add(11, {
    blurb: { editorial: 'Remember, remember...', reviews: 'Super Smush Bros., Spike the Stegosaur 2, Park Panic World, FIFO 2000, Tarzon, Mousey\'s Racing Adventure', previews: 'Donkey Wrong 64, Grand Tourismo 2, Imperfect Dark', letters: 'The Pocket Critters trading wars', cheats: 'Unlock the secret Smash fighters', poster: 'The Firework Code', compo: 'Win 40 Rupees' },
    ed: `<p>Remember, remember the <b>5th of November</b>! Bonfire Night! We're going to the big display at the park. Mom says I can have one sparkler and I have to wear gloves. Read the Firework Code poster in this issue, everybody. Fireworks are not toys. (Unlike everything else in this magazine, which is all toys.)</p>
      <p>I played a Daydream at Callum's all half-term. It is unbelievable. I am trying to work out how to ask for one for Christmas in a way that Mom can't say no to. Current plan: a presentation with charts. (I'll draw the charts in Paint.)</p>
      <p>Rugby World Cup final on Saturday the 6th in Cardiff. Space news: on the night of <b>17-18 November</b> there might be a <b>meteor storm</b>, the Leonids, with loads of shooting stars. Best viewing is in the early hours of the 18th. I am going to ask to stay up. I already know the answer.</p>
      <p>Pocket Critters update: I have 98. The playground is a stock market. Someone at school was offered a WHOLE Game Lad Color for their Chargrillizard. They said no.</p>`,
    revIntro: 'A very full month: fighting, flying, footy and a theme park. Remember to come back on the 19th for Smush Bros.!',
    rev: [
      { g: 'Tarzon', p: 'PLAYSPACE', d: '11-01', s: [86, 84, 80, 70], o: 80, v: 'Swing it!',
        t: ['The game of the new Dizzney film. You play Tarzon from when he\'s a little kid to when he\'s grown up, running and swinging through the jungle. The best bits are when you slide along tree branches like you\'re surfing, really fast, dodging things.',
          'It\'s mostly side-on like an old platform game but it looks 3D. It looks just like the film. It\'s quite short and quite easy, but the tree-surfing is great.'],
        up: 'Tree-surfing. Looks like the film. Good for younger players.', dn: 'Short. Easy.' },
      { g: 'Spike the Stegosaur 2: Gateway to Glimmer', p: 'PLAYSPACE', d: '11-05', s: [92, 88, 90, 90], o: 90, v: 'Dragon-tastic.',
        t: ['Spike the Stegosaur the little purple dragon goes on holiday and ends up in a new world, which has been taken over by a grumpy little baddie. You run around huge colourful worlds, collecting gems, charging into things with your horns and flaming baddies.',
          'This time you can learn new moves: swimming underwater, climbing ladders and a head-bash. A bear who loves money charges you gems to learn them. There are loads of little mini-games in each level too. Brilliant.'],
        up: 'Beautiful worlds. New moves. Loads of mini-games.', dn: 'The money-grabbing bear. Some mini-games are tricky.' },
      { g: 'FIFO 2000', p: 'PLAYSPACE', d: '11-05', s: [88, 90, 84, 88], o: 86, v: 'Back of the net!',
        t: ['The new FIFO. Loads of real teams, leagues and players, a proper season mode, and now some classic famous teams from the past too. The players look more like real people and the commentary says your players\' names.',
          'Dave and I played twenty matches in a row. I won eleven, he won seven and two were draws. He says he won nine. He did not win nine. Callum says you can do a bicycle kick if you\'re lucky. I am not lucky.'],
        up: 'Real teams. Classic teams. Two-player.', dn: 'Shooting is hard. Dave\'s maths.' },
      { g: 'Park Panic World', p: 'PC', d: '11-19', s: [92, 86, 88, 90], o: 89, v: 'Ride it yourself!',
        t: ['Build a theme park, from Bullfrag. There are four different themed lands, like a spooky one and a space one. You put down rides, shops and paths and keep the visitors happy (and stop them being sick).',
          'The best bit: you can go into the park yourself and RIDE THE ROLLERCOASTERS you built, in 3D, like you\'re on them. I built a coaster with a massive drop and rode it. I felt sick. It was perfect.'],
        up: 'Riding your own coasters! Four lands. Funny guide.', dn: 'Needs a good 3D card. Slows down when the park gets big.' },
      { g: 'Super Smush Bros.', p: 'ULTRA 64', d: '11-19', s: [86, 90, 96, 94], o: 93, v: 'Nobody plays as Jelly Puff on purpose.',
        t: ['Ultra Entertainment\'s heroes fight each other: Marlo, Lingo, Donkey Wrong, Zapachu, Samosa, Blobby, Yosher and Vixen, plus secret ones. Instead of an energy bar, the more you get hit the further you fly, and you lose when you get knocked off the stage.',
          'Items fall from the sky: hammers, bombs, Critter Cubes with random Pocket Critters inside. With four players it is the most fun four people can have with an ULTRA 64, and that includes Goldenballs. I said it. Goldenballs fans, write in.'],
        up: 'Four-player chaos. Items. Secret characters.', dn: 'Single player is short. Arguing about who is Zapachu.' },
      { g: 'Mousey\'s Racing Adventure', p: 'GAME LAD COLOR', d: '11-25', s: [86, 80, 84, 82], o: 83, v: 'Vroom vroom, ha-ha!',
        t: ['Mousey and his friends race karts, from above, on the Game Lad Color. But there\'s an adventure too: you drive around between races, finding secrets and doing little jobs to unlock new tracks and characters.',
          'It\'s made by Oddware, and it looks really good for a Game Lad. Good for car journeys. Not good when Mom says "turn the sound off".'],
        up: 'Racing AND an adventure. Looks great.', dn: 'Easy races. Turning the sound off.' },
    ],
    pre: [
      { g: 'Donkey Wrong 64', p: 'ULTRA 64', when: '6 December', hype: 97, t: 'Next month! With an Expansion Pouch in the box! Five Kongs, each with their own colour of banana to collect.' },
      { g: 'Grand Tourismo 2', p: 'PLAYSPACE', when: 'Early next year', hype: 90, t: 'Out in Japan in December. Hundreds and hundreds of cars, rally driving, and licence tests that will make you cry. We get it in the new year.' },
      { g: 'Imperfect Dark', p: 'ULTRA 64', when: 'Next year', hype: 98, t: 'Still not out. Still looks amazing. It\'s going to be the best game of 2000, if 2000 happens (see Y2K).' },
    ],
    let: [
      { from: 'Dave', how: 'by e-mail', t: 'jack i swapped my game lad for lukes chargrillizard. now i have a chargrillizard but nothing to play it on. was that a good swap. dave', r: 'Dave. DAVE. No. Go and swap it back. Take your mom.' },
      { from: '{kidVal}', how: 'by e-mail', t: 'Hi Jack! I have caught 140 Pocket Critters! Can I be in the magazine? Love {kidVal}', r: 'You ARE in the magazine. 140! That\'s the best in our readers so far. {kidVal} is the champion. Everyone else: get catching.' },
      { from: 'JackK', how: 'by e-mail', t: 'Jack, are you staying up for the meteors? JackK', r: 'I\'m going to ask. If I\'m allowed, I\'ll count them and put the number in the next issue. If I\'m not, I\'ll count them in my dreams.' },
    ],
    ch: [
      { g: 'Super Smush Bros.', p: 'ULTRA 64', t: '<b>Louie G</b>: finish Break the Targets with all eight starting fighters. <b>Ness</b>: beat 1P mode on Normal with 3 lives and no continues. <b>Captain Pigeon</b>: beat 1P mode in under 20 minutes. <b>Jelly Puff</b>: just finish 1P mode.' },
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', t: 'The Old Pole: go to the house in Fusebox Town where the Fishing Guru lives. Talk to him. Fish in any water. (You mostly catch Magicarp. See last month\'s tip!)' },
      { g: 'Park Panic World', p: 'PC', t: 'Put a few cheap rides in early to get money coming in. Then build the big rollercoaster and go and ride it.' },
      { g: 'Spike the Stegosaur 2', p: 'PLAYSPACE', t: 'Save up your gems! The bear charges for every move, and you\'ll need them to get to new areas.' },
    ],
    poster: { title: 'THE FIREWORK CODE', col: '#0a0a2a', cap: 'Stay safe on Bonfire Night: only grown-ups light fireworks. Stand well back. Never go back to a lit firework. Wear gloves for sparklers, and put used ones in a bucket of water. Keep pets indoors.',
      svg: `<rect width="300" height="400" fill="#0a0a2a"/>${[[60, 60, '#ff4aff'], [230, 50, '#ffd400'], [150, 90, '#3affff']].map(([x, y, c]) => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${x} ${y}l${(Math.cos(a) * 30).toFixed(1)} ${(Math.sin(a) * 30).toFixed(1)}" stroke="${c}" stroke-width="3"/>`; }).join('')).join('')}${T(150, 160, 30, 'THE FIREWORK CODE', { c: '#ffd400' })}${['ONLY GROWN-UPS LIGHT FIREWORKS', 'STAND WELL BACK', 'NEVER GO BACK TO A LIT FIREWORK', 'NEVER PUT ONE IN YOUR POCKET', 'NEVER THROW FIREWORKS', 'GLOVES ON FOR SPARKLERS', 'USED SPARKLERS IN A BUCKET', 'KEEP PETS INDOORS'].map((t, i) => `<circle cx="28" cy="${192 + i * 25}" r="9" fill="#e10600"/><text x="28" y="${196 + i * 25}" text-anchor="middle" font-family="Arial Black,Arial" font-size="10" fill="#fff">${i + 1}</text><text x="44" y="${197 + i * 25}" font-family="Arial Black,Arial" font-size="13" fill="#fff">${t}</text>`).join('')}` },
    compo: { intro: 'WIN 40 RUPEES! Three questions on the November issue. Sparklers at the ready (with gloves on).',
      q: [['What date is Bonfire Night?', ['5 November', '31 October', '11 November', '1 November']],
        ['According to the Firework Code, when should you go back to a lit firework?', ['After a minute', 'If it fizzles', 'When a grown-up says', 'Never']],
        ['Whose Daydream did Jack play all half-term?', ['Dave\'s', 'Luke\'s', 'Callum\'s', 'Mom\'s']]] },
  });

  // ================================================================ DECEMBER
  M.add(12, {
    blurb: { editorial: 'The last issue of the 1900s', reviews: 'Donkey Wrong 64, Squirms Armageddon (PS), BLOCKO Rock Traders, Gauntlet Leggings, Opposing Farce, Racer on Game Lad', previews: 'Imperfect Dark, Grand Tourismo 2, PlaySpace 2', letters: 'Christmas lists', cheats: 'DW64 secrets', poster: 'WANTED: The Millennium Bug', compo: 'Win 40 Rupees' },
    ed: `<p>This is it. The <b>LAST ISSUE OF THE 1900s</b>. Next issue will be in the year 2000, if the computers don't all explode. Mom has bought 40 tins of beans just in case. Dad says that's silly. Dad has bought a torch.</p>
      <p>My Christmas list, in order: <b>1. A Daydream.</b> 2. Donkey Wrong 64. 3. BLOCKO Mindstorms. 4. A Scaletrix. 5. More red paint. Mom says "we'll see". I have asked Dad what "we'll see" means and he said "it means we'll see".</p>
      <p>Space: on <b>3 December</b> the <b>Mars Polar Landlord</b> lands near the south pole of Mars. I've had it on my calendar in red pen since it launched in January. Fingers crossed.</p>
      <p>Thanks for reading JACK ATTACK! all year. Twelve issues, lots of reviews, one blister clinic, one eclipse, one Pocket Critters, zero spoilers. See you on the other side. Happy Christmas, and Happy New Millennium!</p>`,
    revIntro: 'Christmas is coming, and so are the big games. Check back as the month goes on.',
    rev: [
      { g: 'Gauntlet Leggings', p: 'ULTRA 64', d: '12-01', s: [80, 82, 84, 82], o: 82, v: 'Warrior needs food badly!',
        t: ['Up to four players pick a warrior, a wizard, an archer or a valkyrie and smash through dungeons full of monsters, collecting keys, treasure and FOOD. A voice tells you when you\'re running out of health and it is very dramatic about it.',
          'On your own it\'s a bit repetitive, but with four people it\'s chaos: everyone running for the same plate of chicken. Luke always shoots the food by accident.'],
        up: 'Four players. Levelling up. The dramatic voice.', dn: 'Samey on your own. Shooting the food.' },
      { g: 'Half-Loaf: Opposing Farce', p: 'PC', d: '12-03', s: [90, 92, 92, 86], o: 91, v: 'The other side of the story.', by: 'Callum (guest reviewer)',
        t: ['CALLUM: an add-on for Half-Loaf (you need the original). This time you\'re a soldier sent into the science base, and you see bits of the first game from the other side. There are new weapons and new monsters, and a grappling thing that pulls you up to the ceiling.',
          'It\'s really clever how it fits around the first game. It\'s shorter, but every level is great. Jack\'s PC can just about run it with everything turned down. Mine runs it perfectly. Just saying.'],
        up: 'Fits round the first game. New weapons. Clever.', dn: 'Shorter. Need Half-Loaf first.' },
      { g: 'Donkey Wrong 64', p: 'ULTRA 64', d: '12-06', s: [93, 88, 86, 95], o: 89, v: 'He\'s the leader of the bunch.',
        t: ['DK in 3D, by Oddware, and it comes with an Expansion Pouch in the box so it can be HUGE. You play as five different Kongs, and each one collects their own colour of bananas and has their own moves, guns and musical instruments. Some doors only open for one Kong, so you swap between them a lot.',
          'There is SO much to collect. Maybe too much. But the worlds are massive, it looks amazing, and inside there\'s a whole old arcade game hidden away. Oh, and it starts with a rap. Mom heard the rap from the kitchen and came in to see what was going on.'],
        up: 'Massive. Five Kongs. Hidden arcade games. The rap.', dn: 'TOO much collecting. Backtracking. The rap is in my head forever.' },
      { g: 'Squirms Armageddon', p: 'PLAYSPACE', d: '12-10', s: [78, 90, 94, 94], o: 90, v: 'Incoming! (Again!)',
        t: ['The best PC party game is now on the PlaySpace. Same worms, same silly weapons, same island getting blown to bits. You pass the controller between turns, so up to four people can play with one pad.',
          'Aiming with a controller is a bit fiddlier than a mouse, but it\'s still brilliant. Played it at Luke\'s on a Sunday afternoon. It was dark when we stopped. It\'s December. It gets dark at 4. But still.'],
        up: 'Same brilliant game. Pass the pad.', dn: 'Aiming is fiddly. The Ninja Rope is even harder.' },
      { g: 'BLOCKO Rock Traders', p: 'PLAYSPACE', d: '12-10', s: [78, 76, 72, 70], o: 74, v: 'Dig it.',
        t: ['The Rock Traders are a team of BLOCKO miners stuck on a strange planet, digging for energy crystals so they can get home. On the PlaySpace you control them directly, drilling through rock and driving little vehicles while rock monsters cause trouble.',
          'It looks just like the BLOCKO sets. But it\'s quite slow, and digging gets a bit samey. Good if you love BLOCKO (I love BLOCKO). The PC version is more of a building-a-base game.'],
        up: 'BLOCKO! Drilling. Vehicles.', dn: 'Slow. Samey digging.' },
      { g: 'Intergalactic Battles Episode I: Racer', p: 'GAME LAD COLOR', d: '12-17', s: [74, 70, 76, 74], o: 74, v: 'Peapodracing in your pocket.',
        t: ['The peapodracing game, but on the Game Lad Color, from above. You race around the tracks, avoiding walls and other racers, and buy upgrades between races.',
          'It\'s quite good fun for a Game Lad, but it\'s not like the ULTRA 64 one. It\'s great for the car journey to see your relatives at Christmas, though, and that\'s what I needed it for.'],
        up: 'Peapodracing on the go. Upgrades.', dn: 'Not like the big version. Hard to see what\'s coming.' },
    ],
    pre: [
      { g: 'Imperfect Dark', p: 'ULTRA 64', when: '2000', hype: 99, t: 'NEXT YEAR. Joanna Murk, secret agent, gadgets, and a multiplayer that\'s meant to be even better than Goldenballs. It needs an Expansion Pouch for most of it. Good job I\'m getting one with DW64 (hopefully).' },
      { g: 'Grand Tourismo 2', p: 'PLAYSPACE', when: 'January 2000', hype: 92, t: 'Out in Japan already. Hundreds of cars. Two discs. It\'s going to eat all of January.' },
      { g: 'PlaySpace 2', p: 'SOMY', when: 'Japan: March 2000', hype: 97, t: 'It\'s official: the next PlaySpace is called PlaySpace 2 and it comes out in Japan in March. It will play your old PlaySpace games AND DVDs. No date for us yet. I am going to need a LOT of car washes.' },
    ],
    let: [
      { from: 'Dave', how: 'by e-mail', t: 'jack what do you want for christmas. i am getting you something. it is a surprise. it is not a daydream. dave', r: 'Thank you, Dave! Please give me back my Kart Kaos 64 (from LAST OCTOBER). That would be the best present ever.' },
      { from: 'Luke', how: 'by e-mail', t: 'Jack, I stayed up for the meteors and saw SEVEN shooting stars. Then I fell asleep on the sofa. How many did you see? Luke', r: 'I wasn\'t allowed to stay up. I saw none. I am happy for you, Luke. I am VERY happy for you. (I am not.)' },
      { from: 'Mom', how: 'on a note on the fridge', t: 'Jack. Christmas list received. "We\'ll see." Love Mom. PS: who is "Daydream"?', r: 'Mom. Mom. It\'s not a WHO, it\'s a WHAT. And it\'s the most important WHAT in the whole world. (See every issue since July.)' },
    ],
    ch: [
      { g: 'Donkey Wrong 64', p: 'ULTRA 64', t: 'In Frantic Factoryy there\'s an old Donkey Wrong arcade machine you can play. Beat it twice for something special. And Cranky Wrong has another old game hidden in his lab once you\'ve collected enough banana medals.' },
      { g: 'Super Smush Bros.', p: 'ULTRA 64', t: 'Beat 1P mode with all eight of the starting characters and you unlock a new stage, which is a bit of an old Marlo game. Retro!' },
      { g: 'Half-Loaf', p: 'PC', t: 'Start it with <b>-console</b>, then type <b>sv_cheats 1</b> and <b>impulse 101</b> in the console for every weapon. (Callum says this is "wrong". Callum showed me.)' },
      { g: 'Pocket Critters Moss & Puddle', p: 'GAME LAD', t: 'When you\'ve beaten the Fabulous Four, a cave near Pebble Bay opens. There is something VERY powerful at the bottom. Save before you go in. Take every Mega Cube you have.' },
    ],
    poster: { title: 'WANTED: THE MILLENNIUM BUG', col: '#e8d8a8', cap: 'WANTED for messing up computers at midnight on 31 December 1999. Description: thinks it\'s 1900. Last seen: inside old computer clocks. Reward: 40 tins of beans (Mom\'s). If you see it, tell a grown-up who knows about computers.',
      svg: `<rect width="300" height="400" fill="#e8d8a8"/><rect x="10" y="10" width="280" height="380" fill="none" stroke="#5a3a1a" stroke-width="4"/>${T(150, 64, 54, 'WANTED', { c: '#5a1a00' })}${T(150, 92, 16, 'FOR MESSING UP CLOCKS', { c: '#5a1a00' })}<rect x="60" y="110" width="180" height="150" fill="#f8f0d8" stroke="#5a3a1a" stroke-width="3"/><g transform="translate(150 186)"><ellipse rx="44" ry="34" fill="#3a8a2a" stroke="#000" stroke-width="3"/><circle cx="-16" cy="-8" r="10" fill="#fff" stroke="#000"/><circle cx="16" cy="-8" r="10" fill="#fff" stroke="#000"/><circle cx="-14" cy="-6" r="4"/><circle cx="18" cy="-6" r="4"/><path d="M-14 14 q14 10 28 0" stroke="#000" stroke-width="3" fill="none"/><path d="M-30 -26 l-14 -22 M30 -26 l14 -22" stroke="#000" stroke-width="3"/><path d="M-44 0 h-14 M44 0 h14 M-40 16 l-14 10 M40 16 l14 10 M-40 -14 l-14 -10 M40 -14 l14 -10" stroke="#000" stroke-width="3"/><text y="54" text-anchor="middle" font-family="Courier New,monospace" font-size="16" font-weight="bold" fill="#e10600">01/01/00</text></g>${T(150, 290, 22, 'THE MILLENNIUM BUG', { c: '#000' })}${T(150, 318, 10, 'ALIASES: Y2K, THE BUG, "THAT THING ON THE NEWS"', { c: '#5a1a00', f: 'Arial Black,Arial' })}${T(150, 346, 20, 'REWARD: 40 TINS OF BEANS', { c: '#5a1a00' })}${T(150, 372, 11, 'SIGNED: MOM (SHERIFF OF THE KITCHEN)', { c: '#5a1a00', f: 'Arial Black,Arial' })}` },
    compo: { intro: 'WIN 40 RUPEES! The last competition of the 1900s. Make it count!',
      q: [['When does Mars Polar Landlord land on Mars?', ['1 December', '25 December', '31 December', '3 December']],
        ['What is number one on Jack\'s Christmas list?', ['A bike', 'A Daydream', 'BLOCKO Mindstorms', 'Socks']],
        ['Who is on this month\'s WANTED poster?', ['The Millennium Bug', 'Dave', 'Gubbinz', 'Father Christmas']]] },
  });
})();
