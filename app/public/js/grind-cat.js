/* grind-cat: the GRIND pack catalogue (The Great Rupee Hunt, Pocket Money jobs, JackNet Rank). Shared by the server mod
 * (mods/grind.js requires it) and the browser (js/grind*.js load it), so every number is written down once and the
 * server is the one that pays. Nothing random is ever sold here, and nothing here costs Rupees.
 *   SPOTS: [id, group, clue, plain hint]  group: 'pc' (desktop + programs), 'mag' (JACK ATTACK! sections), 'web' (fake sites)
 *          A spot only works if js/grind-hunt.js knows how to find it (or another file calls GemHunt.spot(id, el)).
 *   hunt(day) -> today's [{ id, c }] (seeded by the UK date, so everyone hunts the same spots)
 *   JOBS: the Pocket Money mini-games and what they pay.  RANK: JackNet Rank levels, titles and rewards. */
(function (root) {
  'use strict';
  const GEM = { green: 1, blue: 5, red: 20, purple: 50, gold: 100, rainbow: 500 };
  const GEM_NAME = { green: 'Green', blue: 'Blue', red: 'Red', purple: 'Purple', gold: 'Gold', rainbow: 'Rainbow' };

  // ---------------------------------------------------------------- The Great Rupee Hunt: hook spots
  const SPOTS = [
    // the PC: the desktop and the programs on it
    ['pc.desk', 'pc', "No need to open a thing. Just look at your desktop. Properly. Behind the icons, in the teal.", 'On the desktop itself'],
    ['pc.start', 'pc', 'Every journey on this PC begins with a click on the button that says where to begin.', 'Inside the Start menu'],
    ['pc.bin', 'pc', "One kid's rubbish is another kid's treasure. Have a rummage in what got thrown away.", 'In the Recycle Bin'],
    ['pc.mycomp', 'pc', 'Look inside the computer. The one on the computer.', 'My Computer'],
    ['pc.paint', 'pc', 'An artist left a sparkle in the corner of a blank canvas. Grab a brush.', 'Paint (Accessories)'],
    ['pc.sol', 'pc', 'Shuffled in with fifty-two others, sitting on the back of the deck.', 'Solitaire'],
    ['pc.freecell', 'pc', "Four free cells, four foundations, and one thing that isn't a card at all.", 'FreeCell'],
    ['pc.notepad', 'pc', 'Plain text, plain grey, plain boring. Except for one glint at the edge of the page.', 'Any Notepad file'],
    ['pc.dos', 'pc', 'C:\\> Three letters list a directory. Type them and read right to the end.', 'MS-DOS Prompt: type DIR'],
    ['pc.calc', 'pc', 'Sums are hard. Gems are easy. Look right next to the answer.', 'Calculator'],
    ['pc.control', 'pc', 'Mouse, Modem, Fonts, Sounds... the place where all the settings live has one setting too many.', 'Control Panel'],
    ['pc.outlook', 'pc', "You've got mail. And something shinier than mail, down among the folders.", 'Outlook Express'],
    ['pc.jackamp', 'pc', 'Something sparkly is queued up at the bottom of the playlist.', 'JackAmp'],
    ['pc.mines', 'pc', 'The little smiley face is guarding something. It is not a mine. Probably.', 'Minesweeper-style game in Games'],
    ['pc.help', 'pc', 'When all else fails, read the manual. Look down the side of the contents.', 'Help (Start menu)'],
    ['pc.wordpad', 'pc', "Not Notepad: its posher cousin with the ruler.", 'WordPad'],
    ['pc.fridge', 'pc', 'Stuck on a cold white door with all the words.', 'Fridge Magnet Poetry'],
    ['pc.chest', 'pc', "There's treasure in the chest that isn't loot.", 'Treasure Chest'],
    ['pc.find', 'pc', 'Searching for files? Search the searcher.', 'Find: Files or Folders'],
    ['pc.run', 'pc', 'Run, Rupee, run! (Start, then the one that runs.)', 'The Run box'],
    ['pc.chores', 'pc', "Mom's list is stuck to the fridge. Something's stuck to the note that says so.", "Start > Run: chores"],
    ['pc.pet', 'pc', 'Your little digital pet is sitting on something. It is not an egg.', 'The Jackotchi (Games)'],
    // the magazine: JACK ATTACK! Online itself
    ['mag.home', 'mag', 'The front page of the magazine. Read past the headlines.', 'JACK ATTACK! front page'],
    ['mag.reviews', 'mag', 'Somebody gave this sparkler eleven out of ten.', 'Reviews'],
    ['mag.cheats', 'mag', 'Cheaters never prosper. Except today, on the page full of cheats.', 'Cheats'],
    ['mag.letters', 'mag', 'Dear Jack, I found this in your postbag. Love, a reader.', 'Letters'],
    ['mag.art', 'mag', "Hung in the gallery between the readers' drawings.", 'Readers\' Art'],
    ['mag.forums', 'mag', 'Posted on the message boards, but nobody has replied to it.', 'Forums'],
    ['mag.demos', 'mag', 'INSERT COIN. Or, just this once, a gem.', 'The Games Arcade'],
    ['mag.top10', 'mag', 'Number eleven in a top ten.', 'Top 10'],
    ['mag.comics', 'mag', 'Between the panels of the funny pages.', 'Comics'],
    ['mag.starwars', 'mag', 'A long time ago, in a section far, far away...', 'The space films section'],
    ['mag.links', 'mag', "Jack's links page has one link that isn't a link.", 'Links'],
    ['mag.downloads', 'mag', 'Download speed: 3.2 KB a second. Gem speed: instant.', 'Downloads'],
    ['mag.penpals', 'mag', 'Pen pals wanted. Sparkly ones especially.', 'Pen Pals'],
    ['mag.quiz', 'mag', 'Q: What is shiny and hiding on the page full of questions?', 'The Nerd Quiz'],
    ['mag.polls', 'mag', 'Vote now! (The gem is not one of the options. It is next to them.)', 'Polls'],
    ['mag.members', 'mag', 'Hiding in the list of everybody who ever joined.', 'Members'],
    // the JackNet: fake web sites
    ['web.waaaghooo', 'web', 'The biggest directory on the JackNet has one entry that is not a web site.', 'www.waaaghooo.find'],
    ['web.jackgle', 'web', 'The search engine from a garage. It found the gem before you did.', 'www.jackgle.find'],
    ['web.hamster', 'web', "Still running in that wheel. What's that next to it?", 'Hamster Cam'],
    ['web.bay', 'web', 'Going once, going twice... no bids needed for this one.', 'JackBay'],
    ['web.bank', 'web', 'Where the Rupees live. One escaped from the vault.', 'JackNet Bank'],
    ['web.lootlings', 'web', 'The little diggers missed one. Right on their front page.', 'Lootlings'],
    ['web.shack', 'web', 'Freeware, shareware, demoware... gemware.', 'The Shareware Shack'],
    ['web.hpz', 'web', 'Free web pages for everybody. One of the free things is extra free.', 'Homepagez'],
    ['web.dave', 'web', "Jack's best mate has a web site. Mind the cat.", "Dave's Place"],
    ['web.scifi', 'web', 'The truth is out there. So is a gem, in the sci-fi zone.', 'www.scifizone.cyb'],
    ['web.space', 'web', "Mission control reports an unidentified shiny object. Read the space news.", 'www.jackspacenews.cyb'],
    ['web.blocks', 'web', 'A shrine to falling blocks. One block fell further than the rest.', 'blockshrine.w3b'],
    ['web.cube', 'web', 'Six sides, nine squares each, one world record... and one gem.', 'www.cuberecords.infobahn'],
    ['web.robots', 'web', 'Build a robot, enter the arena... the robots are guarding a gem.', 'www.houserobots.cyb'],
    ['web.bricks', 'web', 'A wish list of little plastic bricks. Somebody wished for a gem.', 'www.brickwishlist.kidz'],
    ['web.yoyo', 'web', 'Walk the dog, rock the baby, round the world... find the gem.', 'www.yoyozone.kidz'],
    ['web.zone', 'web', 'Real people, real games, one real gem on the front page.', 'www.jacknetzone.jnet'],
    ['web.oddjobz', 'web', "Help wanted! Pays in Rupees. One's pinned to the board already.", 'The Odd Jobz Board'],
    ['web.hunt', 'web', 'Sometimes the answer is right under your nose. On this very page, maybe.', 'The Rupee Hunt page'],
  ].map(([id, g, clue, hint]) => ({ id, g, clue, hint }));
  const SPOT = {}; for (const s of SPOTS) SPOT[s.id] = s;

  const HUNT = { n: 10, bonus: 40, mix: { pc: 4, mag: 3, web: 3 } };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // today's ten: seeded by the UK date ('2026-10-19'), so every visitor hunts the same spots on the same day
  function hunt(day, ids) {
    const ok = ids ? new Set(ids) : null, out = [];
    let h = hash('rupeehunt|' + day);
    const next = () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (t ^ (t >>> 14)) >>> 0; }; // mulberry32
    for (const g of ['pc', 'mag', 'web']) {
      const pool = SPOTS.filter(s => s.g === g && (!ok || ok.has(s.id))).map(s => s.id);
      for (let k = 0; k < HUNT.mix[g] && pool.length; k++) out.push(pool.splice(next() % pool.length, 1)[0]);
    }
    // the colours: mostly green and blue, one red (some days purple), one gold (very rarely a RAINBOW)
    const big = next() % 30 === 0 ? 'rainbow' : 'gold', mid = next() % 4 === 0 ? 'purple' : 'red';
    const cols = [big, mid, 'blue', 'blue', 'blue', 'green', 'green', 'green', 'green', 'green'];
    const res = out.map(id => ({ id, c: '' }));
    const rk = res.map(() => next()), order = res.map((x, i) => i).sort((a, b) => rk[a] - rk[b]);
    order.forEach((i, k) => { res[i].c = cols[k] || 'green'; });
    return res;
  }

  // ---------------------------------------------------------------- Pocket Money jobs (mini-games)
  // secs: how long a round lasts; max: the highest score the game can give; good: the score that earns full pay;
  // pay: full pay for a round; rate: the most score a very good player can get per second (the server's sanity check). The server pays the first rounds of each job each day at RUNS of the full rate.
  const JOBS = {
    washup: { n: 'The Washing Up', who: 'Mom', list: 'mom', secs: 60, max: 60, good: 22, pay: 20, rate: 1.3, unit: 'things put away', blurb: 'Stack the clean plates, bowls and mugs on the draining board before the pile wobbles over.' },
    tidy: { n: 'Tidy Your Room', who: 'Mom', list: 'mom', secs: 50, max: 40, good: 18, pay: 20, rate: 1.6, unit: 'things put away', blurb: "Drag everything to where it goes before Mom comes up the stairs to check." },
    car: { n: "Wash Dad's Car", who: 'Dad (via Mom)', list: 'mom', secs: 45, max: 100, good: 92, pay: 20, rate: 10, unit: '% clean', blurb: 'Scrub every bit of mud off the car with the sponge. Watch out for the pigeon.' },
    paper: { n: 'Paper Round', who: 'The paper shop on the corner', list: 'odd', secs: 70, max: 500, good: 230, pay: 22, rate: 14, unit: 'points', blurb: 'Ride down Acacia Avenue and throw the papers to the houses that ordered one. Jump the bins!' },
    mow: { n: 'Mow the Lawn', who: 'Mr Grimsdale next door', list: 'odd', secs: 60, max: 100, good: 85, pay: 22, rate: 4, unit: '% mown', blurb: 'Mow every bit of grass. Do NOT mow the flowerbeds. Do NOT run over the gnome.' },
    dog: { n: 'Walk the Dog', who: 'Mrs Pemberton at No. 42', list: 'odd', secs: 60, max: 500, good: 300, pay: 22, rate: 12, unit: 'points', blurb: 'Walk Biscuit to the park and back. Keep him away from cats, puddles and lampposts. Collect the treats.' },
  };
  const RUNS = [1, 0.6, 0.4, 0.25]; // pay for the 1st, 2nd, 3rd and 4th round of a job each day; after that it's just for fun (and the Hall of Fame)
  const jobPay = (j, sc, n) => { const J = JOBS[j]; if (!J || n >= RUNS.length) return 0; const perf = Math.max(0, Math.min(1, sc / J.good)); return Math.round(J.pay * perf * RUNS[n]); };
  const jobDayMax = j => { const J = JOBS[j]; return J ? RUNS.reduce((s, f) => s + Math.round(J.pay * f), 0) : 0; };

  // ---------------------------------------------------------------- JackNet Rank
  const TITLES = ['', 'Newbie', 'Dial-Up Dabbler', 'Lurker', 'Mouse Wrangler', 'Netizen', 'Guestbook Signer', 'Chat Room Regular', 'Floppy Swapper',
    'Bookmark Collector', 'Surfer', 'Search Engine Scout', 'Web Ring Rider', 'MIDI Maestro', 'Shareware Junkie', 'Webmaster', 'HTML Hero',
    'Frames Fanatic', 'Hit Counter King', 'Modem Whisperer', 'Leet Haxx0r', 'Overclocker', 'Pixel Pusher', 'Bug Squasher', 'Beta Tester',
    'Power User', 'Sysop', 'Cyberpunk', 'Y2K Bug Hunter', 'Net Ninja', 'Cyber Legend', 'Info Superhighwayman', 'Packet Pilot', 'Server Sage',
    'Bandwidth Baron', 'Megabyte Monarch', 'Gigabyte Guru', 'Mainframe Master', 'Digital Dynamo', 'Virtual Voyager', 'JackNet Elite',
    'Cyber Samurai', 'Silicon Wizard', 'Code Commander', 'Binary Bard', 'Millennium Master', 'Grand Webmaster', 'Keeper of the Big Server',
    'Captain Cyberspace', 'JackNet Immortal', 'Lord of the JackNet'];
  const MAXLV = 50;
  const xpFor = lv => (lv <= 1 ? 0 : Math.round(30 * Math.pow(lv - 1, 2.2)));
  const levelOf = xp => { let lv = 1; while (lv < MAXLV && xp >= xpFor(lv + 1)) lv++; return lv; };
  const levelReward = lv => lv * 5; // Rupees for reaching a level
  // exclusive JackLoot cosmetics at milestones (loot-cat row format: [id, name, rarity, type, art, flavour, extra]); they never drop at random
  const RANK_LOOT = [
    [5, 'badge.gr_netizen', 'Netizen Badge', 1, 'badge', ['#008080', '#fff', 'NET'], 'Reached JackNet Rank 5: Netizen. You live on the Net now.'],
    [10, 'btn.gr_surfer', 'I SURF THE JACKNET', 2, 'btn', ['I SURF THE', 'JACKNET', '#0050c0', '#ffff00', 'shine'], 'Reached JackNet Rank 10: Surfer. Surf\'s up, dude.'],
    [15, 'name.gr_webmaster', 'Webmaster Green Name', 2, 'name', ['#008a3a', '#40e070'], 'Reached JackNet Rank 15: Webmaster. Your name glows like a fresh hit counter.'],
    [20, 'badge.gr_leet', 'L33T Badge', 3, 'badge', ['#000', '#00ff40', '1337'], 'Reached JackNet Rank 20: Leet Haxx0r. U R 1337.'],
    [25, 'col.gr_green', 'Green Screen Theme', 3, 'col', ['#003a10', '#00a030', '#c4dcc8'], 'Reached JackNet Rank 25: Power User. Title bars like an old green terminal.'],
    [30, 'btn.gr_legend', 'CYBER LEGEND', 3, 'btn', ['CYBER', 'LEGEND', '#2a0050', '#ff7aff', 'shine'], 'Reached JackNet Rank 30: Cyber Legend.'],
    [40, 'name.gr_elite', 'JackNet Elite Name', 4, 'name', ['#ff00c8', '#00c8ff', '#ffd400'], 'Reached JackNet Rank 40: JackNet Elite. Very few names look like this.'],
    [50, 'badge.gr_lord', 'Lord of the JackNet', 5, 'badge', ['#000', '#fff', 'rainbow'], 'Reached JackNet Rank 50, the very top. Everybody bow.'],
  ];
  // XP: 1 for every Rupee the server pays you, +3 for everything that pays, +1 (up to 60 a day) for things past their daily cap
  const XP = { perPaid: 3, unpaid: 1, unpaidDay: 60 };

  const C = { GEM, GEM_NAME, SPOTS, SPOT, HUNT, hunt, hash, JOBS, RUNS, jobPay, jobDayMax, TITLES, MAXLV, xpFor, levelOf, levelReward, RANK_LOOT, XP };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.GrindCat = C;
})(this);
