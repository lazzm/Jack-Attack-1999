/* mail-tpl-c: the rest of the post. Spam (family friendly, and the junk filter usually gets it), virus hoaxes (with
 * HoaxWatch explaining why they're nonsense), pictures made of letters, e-cards for every festival, and the rare ones. */
(function () {
  'use strict';
  const G = window.MailGen; if (!G) return;
  const add = G.add;
  const REMOVE = '\n\nTo be REMOVED from our list click here: http://www.remove-me-now.w3b/remove.html';

  // ================================================================ SPAM (it lands in Junk, mostly)
  const SPAM = [
    ['MAKE RUPEES FAST <rupees@makerupeesfast.w3b>', 'MAKE RUPEES FAST!!! $$$ (WORKS FOR EVERYONE) $$$', `DEAR FRIEND,\n\nARE YOU TIRED OF BEING SKINT???\n\nMAKE {=n3} RUPEES A WEEK FROM YOUR OWN BEDROOM!!! NO EXPERIENCE NEEDED!!! MY COUSIN DID IT AND NOW HE HAS A GAME LAD MADE OF GOLD!!!\n\nJUST SEND 10 RUPEES TO FIND OUT HOW!!!\n\n(THE SECRET IS: ASK OTHER PEOPLE TO SEND YOU 10 RUPEES.)`],
    ['Mega Mane 2000 <hair@megamane2000.w3b>', 'MIRACLE HAIR GROWTH FOR ROBOTS!!! (and humans)', `ARE YOU A ROBOT???\nIS YOUR HEAD SHINY AND METAL???\n\nTRY MEGA MANE 2000!!! JUST RUB IT ON AND WAIT!!!\n\n"I used it for a week and now I have a lovely ponytail" - R. Wars, Surrey\n\n*Robots do not have hair. This product is a bottle of green squash.`],
    ['Download Depot <ram@moreram-now.w3b>', 'Your computer is SLOW!!! DOWNLOAD MORE RAM!!!', `IS YOUR COMPUTER SLOW???\n\nDOWNLOAD 128MB OF RAM RIGHT NOW!!! FREE!!!\n\nJust click and the RAM comes down your phone line!!!\n\n(This is not how RAM works. RAM is a thing you plug in. You cannot download it. But please click anyway.)`],
    ['Floppy Mountain <sales@floppymountain.w3b>', '10,000 FLOPPY DISKS FOR £1!!! (one pound!!!)', `10,000 FLOPPY DISKS!!!\nONLY £1!!!\n\nThat's {=n2} megabytes of storage for less than a bag of crisps!!!\n\n(Disks may already have someone's homework on them. Disks may not be disks. Delivery: £400.)`],
    ['Turbo Modem Ltd <fast@turbomodemboost.w3b>', 'MAKE YOUR MODEM 1000x FASTER!!!', `Tired of waiting???\n\nOUR AMAZING SOFTWARE makes your 56K modem go at 56,000K!!!\n\nWatch films! Download the WHOLE INTERNET in one evening!!!\n\nHOW IT WORKS: it changes the number on the screen. That's it. That's how it works.`],
    ['Genuine Space Stuff <moon@realmoonrocks.w3b>', 'GENUINE MOON ROCK - ONLY £9.99!!!', `OWN A PIECE OF THE MOON!!!\n\nEach rock comes with a certificate saying it is from the Moon!!!\n\nWARNING: rock is from the garden. Certificate is from the printer. The Moon is still where it was.`],
    ['Space Cadet School By Post <train@jedischoolbypost.w3b>', 'BECOME A SPACE CADET KNIGHT BY POST!!!', `Learn the ways of the Force in just 6 weeks!!!\n\nYou will receive:\n - A certificate (ONE (1) certificate)\n - A cardboard tube\n - Lesson 1: "Waving Your Hand At Doors"\n\nThe doors at the supermarket open by themselves anyway. Results guaranteed!`],
    ['The Secret Society <secret@secretoftheuniverse.w3b>', 'THE SECRET OF THE UNIVERSE (only £5)', `For just £5 we will tell you the SECRET OF THE UNIVERSE.\n\nScientists DON'T want you to know this!!!\n\n(It's 42. You've been reading the wrong books. That'll be £5.)`],
    ['DREAM CONSOLE DEALS <win@dreamconsolewin.w3b>', 'YOU HAVE WON A DREAM CONSOLE!!! CLAIM NOW!!!', `CONGRATULATIONS {=name^}!!!\n\nYOU HAVE BEEN SELECTED TO WIN A BRAND NEW 128-BIT DREAM CONSOLE!!!\n\nTO CLAIM, SIMPLY SEND US YOUR NAME, ADDRESS, YOUR MOM'S BANK DETAILS AND YOUR PASSWORD!!!\n\n(NEVER do this. Nobody real asks for your password. If you won something you didn't enter, you didn't win it.)`],
    ['Toe Typing Institute <toes@typewithyourtoes.w3b>', 'Learn to TYPE WITH YOUR TOES!!!', `Why waste your hands???\n\nTYPE WITH YOUR TOES and keep your hands free for crisps!!!\n\n{=n2} words a minute in just one week!!!\n\nFree with every course: a very clean keyboard (you'll need it).`],
    ['PC Scan 2000 <scan@pc-virus-scan-2000.w3b>', 'WARNING: your computer has 1,000 VIRUSES!!!', `URGENT!!! OUR SCAN HAS FOUND 1,000 VIRUSES ON YOUR COMPUTER!!!\n\n(We have not scanned your computer. We can't. We just sent this e-mail to everyone.)\n\nDOWNLOAD OUR FIX NOW!!!\n\n(Our fix is the virus.)`],
    ['Bouncy Yo-Yo Co <bouncy@bouncysquig.w3b>', 'MAKE YOUR YO-YO 50% BOUNCIER!!!', `IS YOUR YO-YO NOT BOUNCY ENOUGH???\n\nNEW Yo-Spring will make your yo-yo come back faster than a boomerang!!!\n\nSide effects: yo-yo may come back too fast. Yo-yo may hit your nose. Yo-yo was always going to hit your nose.`],
    ['Forever Choc <choc@foreverchocolate.w3b>', 'Chocolate bar that NEVER RUNS OUT!!!', `Imagine a chocolate bar that NEVER RUNS OUT!!!\n\nOur scientists have done it!!!\n\n(It's a picture of a chocolate bar. You can look at it forever. It never runs out. Technically.)`],
    ['GameTV Converters <tv@gameboytv.w3b>', 'Turn your GAME LAD into a TELLY!!!', `Watch TV on your Game Lad!!!\n\nJust plug our amazing adaptor into the link cable port!!!\n\nPicture quality: four shades of green. Channels: none. Batteries: £{=n2} a day.`],
    ['Pocket Money Doubler <double@pocketmoneydoubler.w3b>', 'DOUBLE YOUR POCKET MONEY GUARANTEED!!!', `Want DOUBLE pocket money???\n\nOur secret method WORKS EVERY TIME!!!\n\nSTEP 1: Ask for double pocket money.\nSTEP 2: There is no step 2.\n\n(Results may vary. Results will vary. Your Mom will say no.)`],
  ];
  add('spam', {
    spam: 1, from: 'x',
    mails: SPAM.map(([f, s, b]) => ({ from: f, rawsubj: 1, subj: s, body: b + REMOVE })),
  });
  add('spam2', {
    spam: 1, from: 'x',
    mails: [
      { from: 'Y2K Survival Store <beans@y2ksurvivalstore.w3b>', w: c => c.is('y2k') ? 3 : c.m >= 9 ? 0.4 : 0, rawsubj: 1, subj: 'Y2K IS COMING!!! BUY BEANS NOW!!!', body: `ONLY A FEW WEEKS UNTIL THE YEAR 2000!!!\n\nOUR MILLENNIUM SURVIVAL KIT CONTAINS:\n - 1 tin of beans\n - 1 candle\n - 1 leaflet called "Don't Panic"\n\nONLY £99.99!!!` + REMOVE },
      { from: 'Valentine Express <love@valentineexpress.w3b>', w: c => c.is('valrun') ? 5 : 0, rawsubj: 1, subj: 'SOMEONE LIKES YOU!!! FIND OUT WHO FOR £5!!!', body: `SOMEONE HAS A CRUSH ON YOU!!!\n\nFOR JUST £5 WE WILL TELL YOU WHO!!!\n\n(It's probably Gubbinz. It's always Gubbinz. Keep your £5.)` + REMOVE },
      { from: 'Spooky Deals <boo@spookydeals.w3b>', w: c => c.is('halloweenrun') ? 4 : 0, rawsubj: 1, subj: 'REAL GHOST FOR SALE!!! (in a jar)', body: `OWN A REAL GHOST!!!\n\nComes in a jar!!! You can't see it because it is a GHOST!!!\n\nJar is empty. That's how you know it's a ghost.` + REMOVE },
      { from: 'Christmas Bargains <xmas@xmasbargainz.w3b>', w: c => c.is('advent') ? 4 : 0, rawsubj: 1, subj: 'SANTA\'S OFFICIAL SLEIGH BELLS - ONLY £49.99', body: `GENUINE SLEIGH BELLS FROM THE NORTH POLE!!!\n\nOFFICIALLY USED BY FATHER CHRISTMAS!!!\n\n(Bells may be from a cat collar. Father Christmas has been informed. He is not happy.)` + REMOVE },
      { from: 'Eclipse Shades Direct <shades@eclipseshadesdirect.w3b>', w: c => c.is('eclipserun') ? 5 : 0, rawsubj: 1, subj: 'ECLIPSE GLASSES!!! 3 FOR £1!!!', body: `ECLIPSE GLASSES!!! CHEAP!!!\n\n(These are ordinary sunglasses with the word ECLIPSE written on them. NEVER use them for the eclipse. Only use proper eclipse viewers with a safety mark, or a pinhole box. Your eyes are not replaceable.)` + REMOVE },
    ],
  });

  // ================================================================ VIRUS HOAXES (and why they're nonsense)
  const HOAXES = [
    ['squig', 'Hamster Surprise', 'If you get an e-mail called "Hamster Surprise", do NOT open it! It will eat your hard drive, then your floppy disks, then your keyboard!', 'Just opening an ordinary text e-mail can\'t do anything to your computer. There is no "Hamster Surprise" virus. Hamsters cannot live in e-mails (sorry {hamster}). This warning has just been forwarded round and round by people trying to be helpful.'],
    ['toaster', 'The Toaster Virus', 'A new virus spreads through the phone line and makes your TOASTER burn your bread! Unplug all toasters!', 'Computer viruses only live on computers, and only if you run a dodgy program. They can\'t travel through the phone line into your toaster. Your toast is safe. Burnt toast is just burnt toast.'],
    ['mouseball', 'The Mouse Muncher', 'There is a virus that makes your mouse ball shrink until it falls out! Check your mouse ball daily!', 'Software can\'t change the size of a plastic ball. If your mouse is jumpy, it\'s fluff on the little rollers inside. Clean them!'],
    ['homework', 'The Homework Virus', 'WARNING: a virus called HOMEWORK.EXE changes all the answers in your homework to wrong ones!!!', 'There\'s no such virus. Wrong answers in your homework are, sadly, your own work. But DO be careful of real .EXE attachments: never run a program someone e-mails you unless a grown-up says it\'s OK.'],
    ['modemfire', 'The Burning Modem', 'Do not go online on Friday the 13th or a virus will make your modem catch fire!!!', 'A virus can\'t set your modem on fire, on any day. Real viruses (like Chernobyl in April) can do real damage, but only if you run an infected program. Keep a virus checker up to date and don\'t run strange attachments.'],
    ['y2kearly', 'Millennium Bug Early Release', 'The Millennium Bug is arriving EARLY via e-mail! If you get an e-mail with "2000" in the subject, delete it at once!', 'The Millennium Bug isn\'t an e-mail. It\'s a mistake in how some old computers store the year. It can\'t be sent to you, early or otherwise. You can open e-mails with "2000" in them!'],
    ['monitor', 'The Monitor Melter', 'A new e-mail virus turns your screen up so bright that it MELTS! Turn your brightness down NOW!', 'E-mails can\'t melt monitors. Turning your brightness down is fine though, it\'s easier on your eyes.'],
    ['phonebill', 'The Phone Bill Bandit', 'If you open an e-mail called "FREE PHONE CALLS" a virus will make your modem phone Australia all night!!!', 'An e-mail can\'t make your modem dial anywhere by itself. But someone DID once trick people into running a dialler program. So: never run programs from strangers!'],
  ];
  HOAXES.forEach(([id, name, claim, truth]) => G.hoax(id, { name, claim, truth }));
  const HFROM = Cast.deep(['Gran <gran.and.grandad@jacknet.jnet>', 'Dad (at work) <dad.at.work@jacknet.jnet>', 'Cousin {cousin} <{cousin?popprince|popprincess}_{cousin.slug}@hotjack.jnet>', 'Auntie Pat <pat.and.ken@pensionernet.jnet>', 'Dave <davetherave@jacknet.jnet>']);
  add('hoax', {
    from: 'x', w: 1,
    mails: HOAXES.map(([id, name, claim]) => ({ hoax: id, from: '{=hfrom}', v: { hfrom: HFROM }, rawsubj: 1, subj: `FW: FW: VIRUS WARNING!!! "${name.toUpperCase()}" - PLEASE READ!!!`, body: `[JackNet Mail HoaxWatch] This message looks like a VIRUS HOAX. Find out why: http://www.hoaxwatch.netz/${id}.html\n\n{please read this!!!|THIS IS SERIOUS. PASS IT ON.|I thought you should know about this.|Doris sent me this. Is it true?}\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n>> WARNING!!! WARNING!!! WARNING!!!\n>>\n>> ${claim}\n>>\n>> This was confirmed by SCIENTISTS and also a man on the radio.\n>> It is the WORST VIRUS EVER. There is NO CURE.\n>>\n>> FORWARD THIS TO EVERYONE YOU KNOW!!!\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>` })),
  });

  // ================================================================ PICTURES MADE OF LETTERS (sent in a monospaced font, obviously)
  const ART = [
    ['look its a cat!!!', ['  /\\_/\\', ' ( o.o )', '  > ^ <', ' /     \\', '(_)---(_)', '', 'it took me ages']],
    ['COW', ['        (__)', '        (oo)', '  /------\\/', ' / |    ||', '*  /\\---/\\', '   ~~   ~~', '', 'moo.']],
    ['i drew a blobbit', ['    .-""""-.', '   /  O  O  \\', '  |  vvvvvv  |', '   \\  ^^^^  /', "    '-.__.-'", '     /    \\', '', 'it is a blobbit. i made them up. like pocket critters but rounder']],
    ['ROCKET', ['     /\\', '    /  \\', '   | () |', '   |    |', '   |    |', '  /| /\\ |\\', ' /_|/  \\|_\\', '    ****', '   ******', '', '3... 2... 1... BLAST OFF']],
    ['fish', ['    ><(((("> ', '', '            ><((((">', '', '  ><(((("> ', '', 'theyre swimming']],
    ['a cake for no reason', ['     i  i  i', '    _|__|__|_', '   |~~~~~~~~~|', '   |  CAKE!  |', '  _|_________|_', ' |_____________|', '', 'happy unbirthday']],
    ['rubiks cube', ['    +---+---+---+', '   / R / G / B /|', '  +---+---+---+ |', ' / W / Y / O /|/|', '+---+---+---+ | +', '| B | R | G |/|/', '+---+---+---+ +', '| Y | W | R |/', '+---+---+---+', '', 'this is what mine looks like. its not solved']],
    ['BLOCKOLOGY', ['  []', '  [][]', '  []      [][]', '          [][]', '[][][][]', '', '      []', '  [][][]', '', 'its raining blockology']],
    ['floppy disk', [' ____________', '|  |    |  |\\', '|  |____|  | |', '|           | |', '|  ________ | |', '| |  1.44  || |', '| |   MB   || |', '|_|________||/', '', 'saved u a copy']],
    ['owl', ['  ,_,', ' (O,O)', ' (   )', '  " "', '', 'hoo']],
    ['a spaceship', ['        __', '   ___/ o\\___', '  <__________>', '    \\/ \\/ \\/', '', 'its going to the moon. or the shops']],
    ['a snowman (its cold)', ['     ___', '    _|_|_', '    (o o)', '   (  :  )', '  (   :   )', '   """""""', '', 'brrr'], c => c.season === 'winter'],
    ['PUMPKIN', ['     __', '  .-"||"-.', ' / /\\  /\\ \\', '|    /\\    |', ' \\ \\/\\/\\/ /', "  '-.__.-'", '', 'boo'], c => c.is('halloweenrun') || c.is('halloween')],
    ['christmas tree!!!', ['      *', '     /.\\', '    /..o\\', '   /.o..*\\', '  /..*..o.\\', ' /.o...*...\\', '     |||', '', 'merry christmas'], c => c.is('advent') || c.is('xmaseve')],
    ['sunshine', ['    \\  |  /', '  -- .---. --', '    /     \\', '  - |  :) | -', '    \\     /', "  -- '---' --", '    /  |  \\', '', 'its sunny (not here)'], c => c.season === 'summer'],
  ];
  const AFROM = Cast.deep(['{cousin2} <{cousin2.slug}_the_great@hotjack.jnet>', 'Dave <davetherave@jacknet.jnet>', 'Cousin {cousin} <{cousin?popprince|popprincess}_{cousin.slug}@hotjack.jnet>', '{club3} <yoyo_{club3.slug}@hotjack.jnet>']);
  add('ascii', {
    from: 'x', w: 1.1, ascii: 1,
    mails: ART.map(([subj, lines, when]) => ({ w: when ? c => when(c) ? 4 : 0 : 1, mono: 1, ascii: 1, rawsubj: 1, subj, from: 'x', body: 'x', after: (o, c, r) => { o.from = G.pick(AFROM, r); o.body = lines.join('\n') + '\n\n' + G.pick(['', 'took me ages', 'made in notepad', 'send me one back', 'from ' + o.from.split(' ')[0].toLowerCase()], r); } })),
  });

  // ================================================================ E-CARDS (Greetz-o-Matic)
  const GZ = 'Greetz-o-Matic! <cards@greetzomatic.kidz>';
  const CARDFROM = { gran: ['Gran', 'Gran <gran.and.grandad@jacknet.jnet>'], mom: ['Mom', 'Mom <the.family@jacknet.jnet>'], kim: [Cast.t('Cousin {cousin}'), Cast.t('Cousin {cousin} <{cousin?popprince|popprincess}_{cousin.slug}@hotjack.jnet>')], dave: ['Dave', 'Dave <davetherave@jacknet.jnet>'], gub: ['Gubbinz', 'Gubbinz <gubbinz@squigpen.grot>'], pat: ['Auntie Pat', 'Auntie Pat <pat.and.ken@pensionernet.jnet>'] };
  function cardMail(o) {
    return {
      must: o.must, w: o.w, from: GZ, subj: '{=cardFrom} has sent you an e-card!',
      card: (c, r) => { const who = G.pick(o.who, r), f = CARDFROM[who]; c.cardFrom = f[0]; const msg = G.expand(G.pick(o.msgs[who] || o.msgs.any, r), c, r); return { art: o.art, title: G.expand(o.title, c, r), msg: who === 'gran' ? msg.toUpperCase() : msg, up: who === 'gran', from: f[0], fromAddr: f[1] }; },
      body: `Hello {=name}!\n\n{=cardFrom} has sent you a Greetz-o-Matic e-card!\n\nTo see your card, click here (or copy it into your web browser):\n\nhttp://www.greetzomatic.kidz/pickup/{=code}.html\n\nYour card will be kept for 30 days.\n\n---\nGreetz-o-Matic! The Internet's number one free e-card site (in this street)\nhttp://www.greetzomatic.kidz/`,
    };
  }
  add('ecard', {
    from: GZ, w: 0.6, noreply: 1,
    mails: [
      cardMail({ must: c => c.is('newyear'), art: 'firework', title: 'Happy New Year!', who: ['gran', 'kim', 'pat'], msgs: { gran: ['Happy New Year {=name}! 1999! Gran and Grandad x'], any: ['Happy New Year {=name}!!! 1999 is going to be the best year ever!!!', 'Happy New Year! Here\'s to 1999!'] } }),
      cardMail({ must: c => c.is('valentine'), art: 'heart', title: 'Happy Valentine\'s Day!', who: ['gub', 'gran'], msgs: { gub: ['Roses are red, Game Boys are too, the best things are red, and so are you. (your face. when you read this.)\n\nfrom: a SECRET ADMIRER\n\n(it is Gubbinz)'], gran: ['Happy Valentine\'s Day {=name}! From a secret admirer! (It is Gran)'] } }),
      cardMail({ must: c => c.is('pancake'), art: 'pancake', title: 'Happy Pancake Day!', who: ['gran', 'kim'], msgs: { gran: ['Happy Pancake Day! Lemon and sugar! Love Gran'], any: ['FLIP FLIP FLIP!!! happy pancake day!!!'] } }),
      cardMail({ must: c => c.key === '04-04', art: 'egg', title: 'Happy Easter!', who: ['gran', 'mom', 'pat'], msgs: { gran: ['Happy Easter {=name}. Don\'t eat all your eggs at once. Love Gran'], any: ['Happy Easter {=name}! Hope the Easter Bunny finds you!'] } }),
      cardMail({ must: c => c.is('eclipse'), art: 'eclipse', title: 'Happy Eclipse Day!', who: ['kim', 'gran'], msgs: { gran: ['Do not look at the Sun! Happy eclipse! Love Gran'], any: ['It\'s ECLIPSE DAY!!! (dont look at it!!!) watch the moon go across on this card instead!!!'] } }),
      cardMail({ must: c => c.is('halloween'), art: 'pumpkin', title: 'Happy Halloween!', who: ['kim', 'dave', 'gub'], msgs: { gub: ['BOO! did i scare ya? i am in a pumpkin. it iz warm in here.'], any: ['BOO!!! Happy Halloween {=name}!!! Trick or treat!!!'] } }),
      cardMail({ must: c => c.is('bonfire'), art: 'firework', title: 'Remember, remember...', who: ['gran', 'dave'], msgs: { gran: ['Happy Bonfire Night! Stand well back! Love Gran'], any: ['WHOOOOSH BANG!!! happy bonfire night!!!'] } }),
      cardMail({ must: c => c.is('xmas'), art: 'tree', title: 'Merry Christmas!', who: ['gran', 'kim', 'pat'], msgs: { gran: ['Merry Christmas {=name}! Hope you like the socks. Love Gran and Grandad xxxx'], any: ['MERRY CHRISTMAS {=name}!!! Hope you got everything on your list!!!', 'Merry Christmas and a happy new MILLENNIUM!'] } }),
      cardMail({ must: c => c.is('nye'), art: 'firework', title: 'Happy New Millennium!', who: ['kim', 'gran', 'pat'], msgs: { gran: ['Happy New Year! The year 2000! I never thought I would see it! Love Gran'], any: ['Last night of the 1900s!!! See you in the year 2000!!!'] } }),
      cardMail({ w: c => c.is('schoolsout') || c.is('summerhols') ? 2 : 0, art: 'sun', title: 'Happy Holidays!', who: ['gran', 'kim'], msgs: { gran: ['Enjoy your holidays! Sun cream! Love Gran'], any: ['SCHOOL\'S OUT!!! have the best summer ever!!!'] } }),
      cardMail({ w: c => c.is('backrun') || c.is('backtoschool') ? 3 : 0, art: 'flower', title: 'Good Luck!', who: ['gran', 'pat'], msgs: { any: ['Good luck back at school {=name}! Work hard! Love Gran', 'Good luck for the new term!'] } }),
      cardMail({ w: c => c.season === 'winter' && !c.is('advent') ? 0.8 : 0, art: 'snow', title: 'Brrrr!', who: ['gran', 'kim'], msgs: { gran: ['It is very cold. Wear a vest. Love Gran'], any: ['It\'s freezing!!! here is a snowman to keep you company!!!'] } }),
      cardMail({ w: 0.6, art: 'squig', title: 'Just Because!', who: ['gub', 'kim', 'dave'], msgs: { gub: ['Hello. No reason. Here is a picture. I drew it in Paint. WAAAGH!'], any: ['Just because!!! hope ur having a good {=dayname}!!!'] } }),
      cardMail({ w: 0.4, art: 'rocket', title: 'You\'re out of this world!', who: ['dave', 'kim', 'gran'], msgs: { gran: ['Grandad says you are out of this world. I think that is a compliment. Love Gran'], any: ['ur out of this world!!! (dont let it go to ur head)'] } }),
      cardMail({ w: 0.25, art: 'flower', title: 'Happy Birthday!', who: ['gran'], msgs: { gran: ['Happy birthday {=name}!\n\n(It is not your birthday. I pressed the wrong one. Grandad says I cannot take it back. Have a nice day anyway. Love Gran)'] } }),
    ],
  });

  // ================================================================ THE RARE ONES (about one day in ten; the Golden Cartridge is rarer still)
  add('rare', {
    from: 'x', w: 0, mails: [],
    rares: [
      { from: 'Your Computer <pc@localhost.jnet>', subj: 'Hello. It\'s me. Your computer.', body: `Dear {=name},\n\nIt's me, your computer. Hello.\n\nI don't normally write. But I've been thinking (at 350MHz).\n\n * Please stop eating crisps over my keyboard. There is a whole crisp under the F key.\n * I don't mind playing {=game}. I DO mind being turned off at the wall.\n * The noise I make when I go online is me singing. Nobody has ever said it was nice.\n * When I crash, it's not personal.\n\nThat's all. Thank you for having me.\n\nYour Computer\n(Pentium II, 64MB, beige)` },
      { from: 'The Millennium Bug <bug@bios.jnet>', subj: 'hello. i am the millennium bug', body: `hello {=name}.\n\ni am the millennium bug. everybody is talking about me. i am very famous.\n\ni live in the BIOS. it is quite small in here. i have a little bed made of a resistor.\n\non the 1st of january i am going to make all the clocks think it is 1900. then i am going to have a little lie down.\n\nplease do not tell the people with the stickers that say "Y2K COMPLIANT". they are after me.\n\nyours,\nthe millennium bug\n(size: 2 digits)` },
      { from: 'Mr Tiddles <mr.tiddles@davesplace.jnet>', subj: 'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm', body: `mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,;;;;;;;;;;;;;;;;''''''''''''''\n\nggggggggggggggggggggggggggggggggggggggggggggggggggggggggggh\n\n  [[[[[[[[[[[[[[[[[[[[[[[[[[[[[[ p\n\n\n----------\ndave's note: SORRY {=name}. that was mr tiddles. he walked on the keyboard and then sat on the send button. he says hello. (he doesnt.)` },
      { from: 'The Moon <moon@orbitbulletin.infobahn>', subj: 'A message from the Moon', body: `Dear {=name},\n\nThis is the Moon. You may have seen me. I'm the big round one.\n\n{I just wanted to say sorry about getting in front of the Sun in August. I was just passing.|Thank you for looking at me. Most people only look at me when I'm full.|I'm about 384,000 km away, so this e-mail may have taken a while.}\n\nThe footprints from 1969 are still here. Nobody has hoovered.\n\nLove,\nThe Moon` },
      { from: '{hamster} <{hamster.slug}@hamstercam.webcom>', subj: 'squeak', body: `squeak\n\nsqueak squeak {=name} squeak\n\nsqueak (sunflower seed) squeak squeak\n\nsqueak.\n\n{hamster}\n(hamster)\n\n---\nNote from the Hamster Cam team: we left the keyboard in {hamster.his} cage by mistake. {hamster.He} has sent 46 of these.` },
      { from: 'Granny Gubbinz <granny@squigpen.grot>', subj: 'IS GUBBINZ BEING GOOD', fx: 'gran', body: `DEAR {=name}\n\nTHIS IS GRANNY GUBBINZ. GUBBINZ'S GRAN. I LIVE IN THE FLOPPY DRIVE.\n\nIS GUBBINZ EATING PROPERLY. IS HE WEARING HIS VEST. TELL HIM TO RING HIS GRAN.\n\nI HAVE KNITTED HIM A JUMPER WIV A ROCKET ON IT.\n\nLOVE GRANNY GUBBINZ XXXX\n\nP.S. HOW DO I SEND THIS` },
      { from: 'Rocky <rocky@petrock.netz>', subj: '.', body: `.\n\n\n\nRocky\n(a rock)` },
      { from: 'The Recycle Bin <bin@desktop.jnet>', subj: 'I am full', body: `Dear {=name},\n\nI am the Recycle Bin. I am on your desktop. Bottom corner. You know the one.\n\nI am full of things people threw away. Homework. Pictures. A poem about Pocket Critters. I've read them all. Some of them are quite good.\n\nYou can put things back, you know. Just open me and have a look.\n\nYours, crumpled,\nThe Recycle Bin` },
      { from: 'The Modem <modem@com2.jnet>', subj: 'SKREEEEEEEEEEE', mono: 1, body: `BEEEEP BOOOP BEEP BOOP BEEP\n\nkrrrrrrssssshhhhhhhhhhhhh\n\nSKREEEEEEEEEEEEEEEEEEEEEEEEEE\n\n  bong   bong   bong\n\nKSSSSHHHHHHHHHHHHHHH-bip-bip-bip\n\n.........................\n\n(connected at 44,000 bps)\n\nhello {=name}. this is how i talk. nobody ever writes back.` },
      { w: c => c.is('advent') || c.is('xmaseve'), from: 'Father Christmas <santa@northpole.kidz>', subj: 'Re: your list', body: `Dear {=name},\n\nThank you for your list. The elves have read it. One of them laughed, but we've had a word.\n\nI can't tell you what you're getting. But I can say that you are on the {Nice|Mostly Nice|Nice (just)} list.\n\nPlease leave a mince pie out. Not a sprout. Somebody always leaves a sprout.\n\nHo ho ho,\nFather Christmas\n\nP.S. Rudolph says hello. He's got a cold. His nose is redder than usual.` },
      { golden: true, from: 'The Golden Cartridge <golden@squigpen.grot>', subj: '*** YOU HAVE FOUND THE GOLDEN CARTRIDGE ***', mono: 1, body: `*****************************************\n*                                       *\n*  YOU HAVE FOUND THE GOLDEN CARTRIDGE  *\n*                                       *\n*****************************************\n\n           .-""""""""-.\n         .'  $      $  '.\n        /    O      O    \\\n       |   vvvvvvvvvvvv   |\n        \\   ^^^^^^^^^^   /\n         '.            .'\n           '-.______.-'\n\nOnly a very few inboxes on JackNet ever get this e-mail.\n\nYou are one of them, {=name}.\n\nThe Golden Cartridge grants you: good luck at {=game}, one (1) extra life, and the right to tell everybody you found the Golden Cartridge. (They won't believe you. That's how you know it's special.)\n\nWAAAGH!` },
    ],
  });
})();
