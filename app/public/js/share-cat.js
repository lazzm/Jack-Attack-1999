/* share-cat: the fixed lists behind SHARE & SOCIAL (e-cards, chain letters, brag badges, floppy disk swaps, Cool Site
 * of the Month). Shared by the browser (js/share*.js) and the server (mods/share.js validates against it), so it must
 * stay plain data + pure functions. Nothing in here comes from a visitor. */
(function (root) {
  'use strict';
  // ---- SparkleCardz! categories: [id, name, colour, special day in 1999 (month*100+day) or 0, blurb]
  const CATS = [
    ['bday', 'Birthday', '#ff3399', 0, 'Candles, cake and balloons. Lots of balloons.'],
    ['thanks', 'Thank You', '#ff8c00', 0, 'Say ta very much. Properly.'],
    ['just', 'Just Because', '#2a9ad8', 0, 'No reason. Just saying hello.'],
    ['getwell', 'Get Well Soon', '#2aa84a', 0, 'Soup, blankets and telly in bed.'],
    ['miss', 'Missing You', '#8a5ad8', 0, 'For mates who moved away (or are just at their Gran\'s).'],
    ['well', 'Well Done!', '#d8a800', 0, 'Passed your exam? Solved the cube? Brilliant!'],
    ['val', "Valentine's Day", '#e8003c', 214, 'Roses are #FF0000. Sunday 14 February 1999.'],
    ['mom', "Mother's Day", '#d0508a', 314, 'Mothering Sunday is 14 March 1999. Don\'t forget!'],
    ['hallo', 'Halloween', '#ff7a00', 1031, 'Spooky cards for Sunday 31 October 1999. Boo!'],
    ['bonfire', 'Bonfire Night', '#d83a00', 1105, 'Remember, remember, the 5th of November!'],
    ['hols', 'Happy Holidays', '#1a7a3a', 1225, 'Snow, crackers and far too much pudding.'],
    ['mill', 'Millennium', '#2a2ad8', 1231, 'The big one: 31 December 1999. Hello, Year 2000!'],
  ];
  // ---- the cards: [id, category, title]. The art + music for each lives in js/share-cards.js.
  const CARDS = [
    ['bday-cake', 'bday', 'The Big Cake'], ['bday-balloons', 'bday', 'Balloon Bonanza'], ['bday-pressie', 'bday', 'Pressie Time!'],
    ['bday-ork', 'bday', 'Orky Birthday'], ['bday-disco', 'bday', 'Birthday Disco'], ['bday-rocket', 'bday', 'Blast Off! Another Year'],
    ['thanks-flowers', 'thanks', 'A Big Bunch of Thanks'], ['thanks-star', 'thanks', "You're a Star!"], ['thanks-gems', 'thanks', 'Thanks a Million'],
    ['thanks-robot', 'thanks', 'Thank You (Beep Boop)'],
    ['just-rainbow', 'just', 'Rainbow Hello'], ['just-cat', 'just', 'Cat Nap'], ['just-fish', 'just', 'Fishy Hello'], ['just-ufo', 'just', 'Beam Me a Message'],
    ['just-cube', 'just', 'Puzzled Without You'], ['just-squig', 'just', 'Blobbit Says Hi'],
    ['getwell-soup', 'getwell', "Soup's Up"], ['getwell-teddy', 'getwell', 'Bear Hugs'], ['getwell-thermo', 'getwell', 'Feel Better Soon'], ['getwell-bed', 'getwell', 'Duvet Day'],
    ['miss-moon', 'miss', 'Under the Same Moon'], ['miss-letter', 'miss', 'A Letter for You'], ['miss-puppy', 'miss', 'Puppy Eyes'], ['miss-beach', 'miss', 'Wish You Were Here'],
    ['well-done', 'well', 'Well Done!'], ['well-exam', 'well', 'Exam Ace'], ['well-cube', 'well', 'Cube Solved!'],
    ['val-hearts', 'val', 'Hearts a-Flutter'], ['val-rose', 'val', 'Roses are #FF0000'], ['val-cupid', 'val', "Cupid's Arrow"], ['val-robots', 'val', 'Two Robots in Love'],
    ['mom-flowers', 'mom', 'Best Mom in the World'], ['mom-tea', 'mom', 'Breakfast in Bed'], ['mom-heart', 'mom', 'Love You, Mom'],
    ['hallo-pumpkin', 'hallo', 'Pumpkin Patch'], ['hallo-ghost', 'hallo', 'Boo!'], ['hallo-bats', 'hallo', 'Bat Attack'], ['hallo-cauldron', 'hallo', 'Bubble Bubble'],
    ['bonfire-fire', 'bonfire', 'Remember, Remember'], ['bonfire-rockets', 'bonfire', 'Rocket Night'], ['bonfire-sparkler', 'bonfire', 'Sparkler Writing'], ['bonfire-wheel', 'bonfire', 'Catherine Wheel Whirl'],
    ['hols-snowman', 'hols', 'Frosty Hello'], ['hols-tree', 'hols', 'O Christmas Tree'], ['hols-snow', 'hols', 'Let It Snow'], ['hols-cracker', 'hols', 'Cracker Jokes'],
    ['mill-countdown', 'mill', 'Countdown to 2000'], ['mill-fireworks', 'mill', 'Millennium Fireworks'], ['mill-bug', 'mill', 'Bug-Free 2000!'], ['mill-hello', 'mill', 'Hello, Year 2000!'],
  ];
  const CARD = {}; CARDS.forEach(c => { CARD[c[0]] = c; });
  const CAT = {}; CATS.forEach(c => { CAT[c[0]] = c; });

  // ---- chain letters: [id, subject]. The letters themselves are in js/share-web.js. All harmless, all fake, no real money.
  const CHAINS = [
    ['lucky', 'The Lucky Blobbit of Good Fortune'], ['grot', 'DANCING GROT!!! (you HAVE to see this)'], ['megasoft', 'MegaSoft will give you Rupees for forwarding this!!!'],
    ['virus', 'VIRUS WARNING!!! PLEASE READ AND PASS ON!!!'], ['friends', 'The Friendship Test :-)'], ['y2k', 'Y2K survival tips - pass it on'],
    ['jokes', 'The never-ending joke chain'], ['petition', 'PETITION: cartoons ALL DAY on Saturdays'], ['pizza', "FREE PIZZA from Big Tony's!!!"],
  ];
  const CHAIN = {}; CHAINS.forEach(c => { CHAIN[c[0]] = c; });

  // ---- games with high-score tables (server.js GAMES): id -> [name, how to show a score, lower is better]
  const GAMES = {
    tris: ['JACKTRIS', 'pts'], squig: ['BLOBBIT LOB', 'm'], snake: ['SNAKE', 'pts'], sweep: ['JACK SWEEPER', 's', 1], bricks: ['BRICK BASH', 'pts'],
    invaders: ['SAUCER INVADERS', 'pts'], rocks: ['SPACE ROCKS', 'pts'], pong: ['JACK PONG', 'pts'], whack: ['WHACK-A-ROBOT', 'pts'], simon: ['SIMON SAYS', 'rounds'], hangman: ['HANGMAN', 'pts'],
  };
  const num = n => String(Math.floor(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function fmtScore(g, s) {
    const G = GAMES[g]; if (!G) return num(s);
    if (G[1] === 'm') return (Math.floor(+s || 0) / 10).toFixed(1) + 'm';
    if (G[1] === 's') return num(s) + ' seconds';
    if (G[1] === 'rounds') return num(s) + ' rounds';
    return num(s);
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = m => { const k = /^\d{4}-(\d{2})$/.exec(String(m || '')); return k ? MONTHS[(+k[1] - 1) % 12] + ' 1999' : 'this month'; };

  // ---- brag badges. Every number in one of these comes from the server (mods/share.js), never from the browser.
  // kind -> [label, colour A, colour B, text colour, icon]
  const BADGES = {
    gb: ['Guestbook', '#000080', '#2a6ad8', '#ffff00', 'book'], score: ['High score', '#000000', '#3a3a3a', '#00ff00', 'joy'],
    rank: ['JackNet Rank', '#600080', '#a040c0', '#ffffff', 'star'], secrets: ['Secrets', '#202020', '#5a4a00', '#ffd400', 'key'],
    member: ['Membership', '#003a80', '#0080c0', '#ffffff', 'card'], cards: ['E-cards', '#c0005a', '#ff69b4', '#ffffff', 'mail'],
    chain: ['Chain letters', '#404040', '#808080', '#ffffff', 'chain'], cotm: ['Cool Site', '#8a5a00', '#ffd400', '#000000', 'trophy'],
    hp: ['Home Page', '#006000', '#20a020', '#ffffff', 'house'],
  };
  function badgeText(k, g, v, name) {
    const n = name || 'Someone';
    switch (k) {
      case 'gb': return { big: "I signed Jack's Guestbook!", small: 'JACK ATTACK! Online', og: `${n} signed Jack's Guestbook!` };
      case 'score': { const G = GAMES[g] || ['A GAME']; return { big: `My ${G[0]} high score: ${fmtScore(g, v)}`, small: 'Can you beat it?', og: `${n}'s ${G[0]} high score: ${fmtScore(g, v)}. Can you beat it?` }; }
      case 'rank': return { big: `Rank: ${v}`, small: 'JackNet Rank', og: `${n} is a ${v} on JackNet!` };
      case 'secrets': return { big: `I found ${num(v)} secrets`, small: 'on the family PC', og: `${n} has found ${num(v)} secrets on the family PC. How many can you find?` };
      case 'member': return { big: `JackNet Member #${num(v)}`, small: 'Joined for FREE!', og: `${n} is JackNet Member #${num(v)}` };
      case 'cards': return { big: `I sent ${num(v)} e-cards`, small: 'SparkleCardz!', og: `${n} has sent ${num(v)} e-cards on SparkleCardz!` };
      case 'chain': return { big: `My chain letters went round ${num(v)} times`, small: "Don't break the chain!", og: `${n}'s chain letters have been round JackNet ${num(v)} times!` };
      case 'cotm': return { big: `Cool Site of the Month: ${monthLabel(v)}`, small: 'Homepagez Awards', og: `${n}'s home page won Cool Site of the Month, ${monthLabel(v)}!` };
      case 'hp': return { big: `My Home Page: ${num(v)} hits`, small: 'Homepagez', og: `${n}'s home page has had ${num(v)} visitors!` };
    }
    return { big: 'JACK ATTACK! Online', small: '', og: 'JACK ATTACK! Online' };
  }

  // ---- floppy disks: plastic colours, label stickers, handwriting, limits
  const DISK_COLS = [['#262626', 'Black'], ['#1d4fd8', 'Blue'], ['#c81d1d', 'Red'], ['#1a9a3a', 'Green'], ['#e8c000', 'Yellow'], ['#ff69b4', 'Pink'], ['#8a2be2', 'Purple'], ['#e8e8e8', 'White'], ['#ff8c00', 'Orange'], ['#40b8b8', 'See-through']];
  const DISK_STK = ['star', 'heart', 'skull', 'ork', 'squig', 'smiley', 'rocket', 'bolt', 'cube', 'alien', 'ghost', 'flower'];
  const DISK_HANDS = [['marker', 'Felt tip'], ['biro', 'Biro'], ['caps', 'BLOCK CAPITALS'], ['neat', 'Neat (for school)']];
  const DISK = { bytes: 1457664, files: 12, label: 24, note: 300, txt: 20000, img: 360000, json: 700000 };
  // how much room a file takes on the 1.44 MB disk (a Paint picture is a bitmap really, and bitmaps are BIG)
  const diskSize = f => f.k === 'txt' ? Math.max(1, utf8(f.t || '')) : f.k === 'img' ? Math.max(20480, Math.floor(String(f.d || '').length * 0.75) * 4) : 512;
  function utf8(s) { let n = 0; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); n += c < 0x80 ? 1 : c < 0x800 ? 2 : (c >= 0xd800 && c < 0xdc00) ? (i++, 4) : 3; } return n; }

  const LIMITS = { msg: 300, sig: 30, ps: 80, cardDay: 15, fwdDay: 10, fwdMax: 5, chainInDay: 3, diskDay: 5, badgeDay: 20, cardDays: 60 };

  const C = { CATS, CAT, CARDS, CARD, CHAINS, CHAIN, GAMES, fmtScore, num, MONTHS, monthLabel, BADGES, badgeText, DISK_COLS, DISK_STK, DISK_HANDS, DISK, diskSize, utf8, LIMITS };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.ShareCat = C;
})(typeof window !== 'undefined' ? window : this);
