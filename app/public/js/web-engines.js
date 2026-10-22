/* web-engines: the 1999 search wars, and a way to find every site on the JackNet.
 * window.WebDir = the master directory of the fake web (built at runtime from IE.sites + the WebPack manifest + Jack's
 * own hidden pages), with 88x31 buttons for every site, one shared search over the whole web (the JackSearch index,
 * extended with every IE.addSite page) and the Search bar in JackNet Explorer.
 * The engines live at www.waaaghooo.find (the big portal), www.jackgle.find (the little upstart from a garage) and
 * www.askgubbinz.find (the butler). Their page bodies, and the LINK-O-RAMA page, load from js/web-engines-p.js. */
(function () {
  'use strict';
  const A = window.Apps, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const WP = () => window.WebPack;
  const MAIN = 'www.jackattack.jnet';
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const t99 = () => (window.Desk && Desk.today99 ? Desk.today99() : { m: 1, d: 1, md: 101, date: new Date(1999, 0, 1) });
  const dayOfYear = () => { const t = t99(); return Math.round((new Date(1999, t.m - 1, t.d) - new Date(1999, 0, 1)) / 864e5); };
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sfx = n => { try { Sound.play(n); } catch (e) {} };

  // ================================================================ pixel icons (8x8, drawn here, original)
  const PX = { k: '#000', w: '#fff', r: '#e10600', o: '#ff8c00', y: '#ffd400', g: '#3c3', G: '#1a7a1a', b: '#2a7ad8', B: '#003080', c: '#6cf', p: '#f9c', P: '#a040c0', n: '#8a5a2a', e: '#999', E: '#555', l: '#ccc', s: '#f2c79a', t: '#d9a441', m: '#e8381b' };
  const ICONS = {
    globe: '..bbbb..|.bggbbb.|bgggbgbb|bbggbbgb|bbbgbbbb|bbbbggbb|.bbbbgb.|..bbbb..',
    star: '...yy...|...yy...|yyyyyyyy|.yyyyyy.|..yyyy..|.yyyyyy.|.yy..yy.|y......y',
    heart: '.rr..rr.|rrrrrrrr|rwrrrrrr|rrrrrrrr|.rrrrrr.|..rrrr..|...rr...|........',
    ork: '.GGGGGG.|GggggggG|GrrggrrG|GggggggG|GgkkkkgG|GgwkwkgG|.GggggG.|..GGGG..',
    paint: '......nk|.....nk.|....nk..|...yy...|.kkyykk.|kbbbbbbk|kbwbbbbk|.kkkkkk.', // a paint pot and brush (hobby badges)
    squig: '.m....m.|.mmmmmm.|mwwmmwwm|mwkmmwkm|mpmmmmpm|mmkkkkmm|.mmkkmm.|.n....n.',
    rocket: '...rr...|..rwwr..|..wbbw..|..wwww..|..wwww..|.rwwwwr.|r.oyyo.r|...oo...',
    planet: '........|...oo...|..oooo..|yyooooyy|.yyyyyy.|..oooo..|...oo...|........',
    saber: '......cw|.....cw.|....cw..|...cw...|..ee....|.eke....|ee......|e.......',
    pod: '........|ee......|eoe.k...|ee..kbb.|ee..kbcb|eoe.kbb.|ee......|........',
    note: '...kkkkk|...k...k|...k...k|...k...k|.kkk.kkk|kkkkkkkk|.kk..kk.|........',
    mail: 'eeeeeeee|ekwwwwke|ewkwwkwe|ewwkkwwe|ewwwwwwe|ewwwwwwe|eeeeeeee|........',
    chat: '.wwwwww.|wwwwwwww|wkwkwkww|wwwwwwww|.wwwwww.|..ww....|.w......|........',
    mag: '.kkkk...|kccwck..|kcccck..|kcccck..|.kkkkn..|.....nn.|......nn|.......n',
    tooth: '.wwwwww.|wwwwwwww|wwwwwwww|wwwwwwww|.wwwwww.|.ww..ww.|.ww..ww.|.w....w.',
    gem: '...gG...|..gwgG..|.gwggGG.|.gggGGG.|.gggGGG.|.ggGGGG.|..gGGG..|...GG...',
    floppy: 'BBBBBBB.|BBeeeBBB|BBeEeBBB|BBBBBBBB|BwwwwwwB|BwkkkkwB|BwwwwwwB|BBBBBBBB',
    cd: '..llll..|.lcppll.|lcpyylll|lpykkyll|llykkypl|lllyypcl|.llppcl.|..llll..',
    joy: '...rr...|...rr...|....k...|....k...|..kkkk..|.EEEEEE.|.EErEEE.|.kkkkkk.',
    skull: '.wwwwww.|wwwwwwww|wkkwwkkw|wkkwwkkw|wwwkkwww|.wwwwww.|.wkwkwk.|........',
    hamster: '........|t.t.....|tttttt..|tkttttt.|twwtttpt|twwwwttt|.tttttt.|..n..n..',
    rock: '........|........|...eee..|.eeleee.|eewkewke|eeeeeeee|.eeEEee.|..EEEE..',
    ball: '..kkkk..|.kwwkwk.|kwwkkwwk|kwkwwkwk|kwwkkwwk|kwkwwkwk|.kwwkwk.|..kkkk..',
    yoyo: '...k....|...k....|...k....|.rrrrr..|rrwwwrr.|rrrrrrr.|.rrrrr..|........',
    book: '........|nnnnnnn.|nwwwwwn.|nwkkkwn.|nwwwwwn.|nwkkkwn.|nnnnnnn.|........',
    tv: '..k..k..|...kk...|eeeeeeee|ebbbbbee|ebcbbbee|ebbbbbeo|eeeeeeee|.e....e.',
    cake: '...y....|...r....|.pppppp.|pwpwpwpp|nnnnnnnn|wwwwwwww|nnnnnnnn|eeeeeeee',
    flower: '..pp....|.pyyp...|..pp....|...g....|g..g.pp.|.g.gpyyp|...g.pp.|GGGGGGGG',
    fish: '........|..ooo...|.ookoo.o|oooooooo|.oooooo.|..ooo..o|........|........',
    eye: '........|..kkkk..|.kwwwwk.|kwwbbwwk|kwbkkbwk|.kwbbwk.|..kkkk..|........',
    ufo: '........|...cc...|..cccc..|.eeeeee.|eyeyeyee|.eeeeee.|..y..y..|.y....y.',
    bolt: '....yy..|...yy...|..yy....|.yyyyyy.|....yy..|...yy...|..yy....|.y......',
    house: '...rr...|..rrrr..|.rrrrrr.|rrrrrrrr|.wcwwcw.|.wwnnww.|.wwnnww.|GGGGGGGG',
    trophy: 'yyyyyyyy|yyyyyyyy|y.yyyy.y|.yyyyyy.|..yyyy..|...yy...|..nnnn..|.nnnnnn.',
    computer: '.eeeeee.|.eBBBBe.|.eBbbBe.|.eBBBBe.|.eeeeee.|...ee...|.llllll.|llllllll',
    cube: 'rrkwwkbb|rrkwwkbb|kkkkkkkk|yykggkoo|yykggkoo|kkkkkkkk|bbkrrkww|bbkrrkww',
    block: '........|..cc....|..cc....|cccccc..|cccccc..|........|oooo.yy.|oooo.yy.',
    bone: '........|........|ww....ww|wwwwwwww|wwwwwwww|ww....ww|........|........',
    bank: '...ee...|..eeee..|.eeeeee.|eeeeeeee|.e.e.e..|.e.e.e..|.e.e.e..|eeeeeeee',
    chart: 'EEEEEEEE|E.....gE|E....g.E|E.g.g..E|Eg.g...E|E......E|EEEEEEEE|........',
    pound: '..yyyy..|.yy..yy.|.yy.....|yyyyy...|.yy.....|.yy.....|yyyyyyy.|........',
    dice: 'wwwwwwww|wkwwwwkw|wwwwwwww|wwwkkwww|wwwkkwww|wwwwwwww|wkwwwwkw|wwwwwwww',
    tortoise: '........|........|..GGGG..|.GgGGgG.|GGGgGGGs|GGGGGGss|.s.s.s..|........',
    mush: '..rrrr..|.rwrrwr.|rrrrrrrr|rwrrrrwr|...ww...|...ww...|..wwww..|GGGGGGGG',
    bowtie: '........|........|rr....rr|rrrkkrrr|rrrkkrrr|rr....rr|........|........',
    shades: '........|........|kkkkkkkk|kck..kck|kkk..kkk|.k....k.|........|........',
    J: '..yyyyy.|....yy..|....yy..|....yy..|yy..yy..|yy..yy..|.yyyy...|........',
    grot: 'g......g|gg.gg.gg|.gggggg.|.gkggkg.|.gggggg.|..gwwg..|...gg...|........',
    alien: 'y......y|.k....k.|..gggg..|.gggggg.|gkkggkkg|gkwggkwg|.gggggg.|..gkkg..', // a little green alien
    yarn: '..pppp..|.pPpPpp.|pPpPpPpp|ppPpPpPp|pPpPpPpp|.ppPpPp.|..pppp.P|.......P',
    rain: '........|...ww...|.wwwwww.|wwwwwwww|wwwwwwww|.b.b.b..|b.b.b...|........',
    grin: '..yyyy..|.yyyyyy.|yykyykyy|yyyyyyyy|ykyyyyky|yykkkkyy|.yyyyyy.|..yyyy..',
    orb: '..PPPP..|.PcPPPP.|PcPPPPPP|PPPPPPPP|PPPPPPPP|.PPPPPP.|..nnnn..|.nnnnnn.',
    gift: '..y..y..|...yy...|rrryyrrr|rrryyrrr|yyyyyyyy|rrryyrrr|rrryyrrr|rrryyrrr',
    biscuit: '..tttt..|.tnttnt.|tttttttt|tnttnttt|tttttntt|tnttttnt|.ttnttt.|..tttt..',
    clock: '..kkkk..|.kwwwwk.|kwwkwwwk|kwwkwwwk|kwwkkkwk|kwwwwwwk|.kwwwwk.|..kkkk..',
    spider: '........|k.k..k.k|.k.kk.k.|kkkrrkkk|.k.kk.k.|k.k..k.k|........|........',
    fire: '...r....|..rr..r.|..ror.r.|.rooorr.|.royyor.|royyyyor|royyyyor|.roooor.',
    news: 'wwwwwwww|wkkkkkkw|wwwwwwww|wkkwkkkw|wkkwwwww|wkkwkkkw|wwwwwwww|........',
    brick: '.r..r...|rrrrrrrr|rrrrrrrr|rrrrrrrr|........|........|........|........',
    pixel: '.tttttt.|trtgtbtt|tttttttt|tytttpt.|ttttttt.|.tttttt.|........|........',
    cam: '..eeee..|.eekkee.|.ekbbke.|.ekbbke.|.eekkee.|..eeee..|...ee...|.eeeeee.',
    robot: '...rr...|.eeeeee.|.ebeebe.|.eeeeee.|..eEEe..|eeeeeeee|e.eeee.e|..e..e..',
    tree: '...GG...|..GGgG..|.GgGGGG.|GGGGgGGG|.GGGGGG.|...nn...|...nn...|..nnnn..',
    tele: 'EEEEEEEE|EkykkgkE|EkkkkkkE|EkcccckE|EkkkkkkE|EkrkbkkE|EEEEEEEE|.E....E.',
  };
  const icache = {};
  function icon(name, cls) {
    const key = name + '|' + (cls || '');
    if (icache[key]) return icache[key];
    const rows = (ICONS[name] || ICONS.globe).split('|'), paths = {};
    rows.forEach((row, y) => { let x = 0; while (x < 8) { const ch = row[x]; if (ch === '.' || !ch) { x++; continue; } let n = 1; while (row[x + n] === ch) n++; (paths[ch] = paths[ch] || []).push(`M${x} ${y}h${n}v1h-${n}z`); x += n; } });
    return (icache[key] = `<svg class="${cls || 'wi'}" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${Object.keys(paths).map(c => `<path fill="${PX[c]}" d="${paths[c].join('')}"/>`).join('')}</svg>`);
  }

  // ================================================================ what we know about each site
  // badge: [top line, bottom line, icon, style, palette]. Styles and palettes are below; anything missing is picked by hash.
  const NEON = ['#0ff', '#ff0', '#3f3', '#f6f', '#ff9a00', '#ff4040', '#7cf'];
  const STYLES = ['bev', 'neon', 'stripe', 'split', 'chrome', 'stars', 'check', 'dbl', 'sunset', 'lcd', 'paper', 'fire'];
  const PALS = [['#1e6fd9', '#000080', '#fff'], ['#e10600', '#600', '#ff0'], ['#2a9a2a', '#0a4a0a', '#fff'], ['#ffd400', '#c08000', '#000'], ['#a040c0', '#3a0a6a', '#fff'], ['#ff7ac0', '#a0206a', '#fff'],
    ['#00c0c0', '#004a5a', '#fff'], ['#ff8c00', '#8a3a00', '#fff'], ['#606060', '#202020', '#3f3'], ['#fff', '#c0c0c0', '#000080'], ['#000', '#333', '#0ff'], ['#5b16c9', '#ffd400', '#ffd400'], ['#8a5a2a', '#3a2000', '#ffd400'], ['#0028c8', '#e10600', '#fff']];
  const CT = s => window.Cast ? Cast.t(s) : s, sparkly = n => '*~' + n.split('').map((ch, i) => i % 2 ? ch.toLowerCase() : ch.toUpperCase()).join('') + '~*'; // the visitor's own cast (js/cast.js)
  const BADGE = {
    '~dave': ["DAVE'S", 'TOTAL CARNAGE', 'trophy', 'fire', 1], '~kim': [sparkly(CT('{cousin.first}')), 'PoP PaRaDiSe', 'heart', 'sunset', 5], knitting: ['KNIT &', 'NATTER CLUB', 'yarn', 'paper', 9], poetree: ['PO-ETREE', 'KORNER', 'grot', 'stripe', 2],
    computerclub: ['ROOM 14', 'COMPUTER CLUB', 'computer', 'lcd'], '~stu': ['MOULDY', 'TANGERINES', 'note', 'stripe', 7], '~nan': ["NAN'S", 'RECIPES', 'cake', 'paper', 9], '~biscuit': ['WOOF!', "BISCUIT'S PAGE", 'bone', 'bev', 12],
    '~kevin': ['PET ROCK', 'NEW ADDRESS!', 'rock', 'chrome'], '~tom': [CT("{kidSoon.FIRST}'S"), 'COMING SOON', 'clock', 'check', 3], '~lee': ['YO-YO', 'TRICK ZONE', 'yoyo', 'bev', 1], rovers: ['ROVERS', 'JUNIORS FC', 'ball', 'stripe', 2],
    '~ellie': ['POCKET CRITTERS', 'ALL 151!', 'star', 'sunset', 13], '~blockhead': ['BLOCK', 'SHRINE', 'block', 'lcd'], cubetimes: ['CUBE', 'RECORDS', 'cube', 'check', 10], '~zed': [CT("{club1.FIRST}'S"), 'SCI-FI ZONE', 'ufo', 'stars'],
    '~gaz': ['MILLENNIUM', 'BUNKER', 'clock', 'neon', 8], top100cheats: ['TOP 100', 'CHEATS!!!', 'joy', 'neon', 10], '~mike': ['MEGAHERTZ', 'MIKE', 'computer', 'chrome'], '~mek': ['MINI', 'PAINTING', 'paint', 'dbl', 2],
    '~ash': [CT("{club2.FIRST}'S"), 'SPACE PAGE', 'planet', 'stars'], fanfic: ['FAN-FIC', 'ARCHIVE', 'book', 'paper', 9], ascii: ['ASCII', 'ART  :-)', 'computer', 'lcd'], midi: ['MIDI', 'HEAVEN', 'note', 'sunset', 4],
    '~sam': ['EPISODE I', 'COUNTDOWN', 'saber', 'stars'], jarjar: ['JAR JAR JAMS?', 'THE DEBATE', 'eye', 'bev', 7], podracing: ['PODRACING', 'HQ', 'pod', 'stripe', 7], swrumours: ['RUMOUR', 'MILL', 'eye', 'neon', 10],
    brickwars: ['BRICK', 'WISHLIST', 'brick', 'bev', 3], saberduel: ['ME vs DAVE', 'SABER DUEL', 'saber', 'neon', 1], news: ['JACKNET', 'NEWS', 'news', 'chrome'], weather: ['JACKNET', 'WEATHER', 'rain', 'bev', 6],
    teef: ['GEM', 'EXCHANGE', 'gem', 'dbl', 12], hamstercam: ['HAMSTER', 'CAM - LIVE!', 'hamster', 'neon', 1], jokes: ['JOKE OF', 'THE DAY', 'grin', 'check', 3], jackmail: ['JackMail', 'FREE E-MAIL', 'mail', 'bev', 0],
    chatroom: ['THE BACK', 'ROOM CHAT', 'chat', 'check', 4], counters: ['COUNTER', 'MANIA', 'eye', 'lcd'], lost: ['404', 'NOT FOUND', 'mag', 'paper'], downloads: ['FREE', 'DOWNLOADS!!!', 'floppy', 'fire'],
    crystalball: ['MYSTIC', 'GUBBINZ', 'orb', 'stars'], orktranslate: ['BABEL', 'JACK', 'chat', 'stripe', 2], awards: ['COOL SITE', 'AWARDS', 'trophy', 'dbl', 4], timecapsule: ['TIME', 'CAPSULE', 'clock', 'chrome'],
    petition: ['SIGN THE', 'PETITION!', 'book', 'paper'], poll: ['POLL', 'BOOTH', 'chart', 'bev', 6], parcel: ['PASS THE', 'PARCEL', 'gift', 'sunset', 1], biscuitring: ['BISCUIT', 'RING', 'biscuit', 'bev', 12],
    homepagez: ['HOMEPAGEZ', 'FREE 1MB!', 'house', 'bev', 0], riddle: ['RIDDLE', 'TRAIL ???', 'mag', 'check', 8], search: ['JACK', 'SEARCH', 'spider', 'grot'], directory: ['JACKSEARCH', 'DIRECTORY', 'book', 'grot'],
    lookhere: ['LOOK', 'HERE!', 'eye', 'bev', 1], hoods: ['HOMEPAGEZ', 'HOODS', 'house', 'check', 6], 'hz-rory': ['ROCKET', "RORY'S PAD", 'rocket', 'stars'], 'hz-hiscore': ['HIGH SCORE', 'HALL OF FAME', 'joy', 'neon', 1],
    'hz-priya': ['PIXEL', CT("{club4.FIRST}'S ART"), 'pixel', 'check', 5], 'hz-snotlin': ["LITTLE GREEN", "KEVIN'S HOME", 'alien', 'stripe', 12], 'hz-fungus': ['THE', 'MUSHROOMS', 'mush', 'bev', 12], 'hz-fluffy': ['DJ FLUFFY', 'FAN CLUB', 'cd', 'sunset', 5],
    'hz-recorder': ['RECORDER', 'CLUB', 'note', 'paper'], 'hz-goldie': ['GOLDIE', '1997-1999', 'fish', 'stars'], 'hz-sheldon': ['SHELDON', 'THE TORTOISE', 'tortoise', 'bev', 2], csotd: ['COOL SITE', 'OF THE DAY', 'shades', 'neon', 3],
    ezine: ['BYTESIZE', 'E-ZINE #7', 'news', 'sunset', 13], ecardz: ['eCardz!', 'SEND ONE!', 'mail', 'sunset', 5], freetoolz: ['FREE', 'TOOLZ', 'computer', 'bev', 6], chatterbox: ['CHATTER', 'BOX', 'chat', 'sunset', 4],
    getrich: ['$$$ GET', 'RICH QUICK', 'pound', 'fire'], custard: ['THE', 'CUSTARD FILES', 'eye', 'stars'], adopt: ['ADOPT A', 'PIXEL PET', 'heart', 'check', 5], megaflash: ['MEGAFLASH', '2000 !!!', 'bolt', 'neon', 11],
    galaxyring: ['GALAXY', 'RING', 'planet', 'stars'],
    'jacknetzone.jnet': ['JACKNET', 'GAMING ZONE', 'joy', 'neon', 3], 'rupeeshop.jnet': ['THE RUPEE', 'EMPORIUM', 'gem', 'dbl', 2], 'jacknetbank.webcom': ['JACKNET', 'BANK', 'bank', 'chrome'],
    'jackexchange.grot': ['JACK', 'EXCHANGE', 'chart', 'lcd'], 'jacktown.jnet': ['JACKTOWN', 'ONLINE TOWN', 'house', 'stripe', 2], 'jacklotto.grot': ['JACK', 'LOTTO', 'dice', 'fire'],
    'jackdownpark.grot': ['JACKDOWN', 'PARK', 'trophy', 'stripe', 2], 'mypixelfarm.webcom': ['MY PIXEL', 'PET FARM', 'hamster', 'bev', 2], 'greetzomatic.kidz': ['GREETZ-O', 'MATIC!', 'gift', 'sunset', 5],
    'hoaxwatch.netz': ['HOAX', 'WATCH', 'mag', 'paper'], 'unsubomatic.netz': ['UNSUB-O', 'MATIC', 'mail', 'chrome'], 'sharewareshack.netz': ['SHAREWARE', 'SHACK', 'floppy', 'bev', 12],
    'jackdot.jnet': ['JACKDOT', 'NEWS 4 NERDS', 'computer', 'lcd'], 'jackbay.webcom': ['JACKBAY', 'AUCTIONS!', 'pound', 'sunset', 3], 'squigwitch.cyb': ['THE JACK', 'WITCH PROJECT', 'tree', 'stars'],
    'jackbo.netz': ['JACKBO', 'ANYTHING!!', 'grin', 'neon'], 'jackfaqs.w3b': ['JACKFAQS', 'WALKTHROUGHS', 'book', 'paper'], 'aintitkoolnews.infobahn': ["AIN'T IT", 'KOOL NEWS', 'eye', 'fire'],
    'newjacks.wubwub': ['NEWJACKS', 'CARTOONS!', 'bolt', 'sunset', 7], 'webtoyz.kidz': ['WEB TOYZ', 'BUBBLE WRAP!', 'grin', 'check', 5], 'holohut.kidz': ['THE HOLO', 'HUT', 'star', 'chrome'],
    'houserobots.cyb': ['HOUSE', 'ROBOT HQ', 'robot', 'stripe', 1], 'year3000.cyb': ['YEAR 3000', 'GOOD NEWS!', 'rocket', 'stars'], 'jackfax.jnet': ['JACKFAX', 'P100 INDEX', 'tele', 'lcd'],
    'waaaghooo.find': ['WAAAGH', 'ooo!', 'ork', 'wg'], 'jackgle.find': ['Jackgle!', 'BETA', 'mag', 'jg'], 'askgubbinz.find': ['ASK', 'GUBBINZ', 'bowtie', 'ag'],
    'jack:holocron': ['THE', 'HOLOCRON', 'saber', 'stars'], 'jack:dave': ["DAVE'S", 'v0.1 (OLD)', 'clock', 'check', 3], 'jack:orkhole': ['THE PAINT', 'HOLE', 'paint', 'fire'], 'jack:y2k': ['Y2K', 'SURVIVAL', 'clock', 'lcd'],
    'jack:gubbinzfanclub': ['GUBBINZ', 'FAN CLUB', 'grot', 'lcd'], 'jack:keepoutdave': ['KEEP OUT', 'DAVE!!!', 'skull', 'check', 1], 'jack:jackamp': ['JACKAMP', 'MIDI PLAYER', 'note', 'chrome'],
    'jack:jackcarta': ['JACKCARTA', '99 CD-ROM', 'cd', 'bev', 0], 'jack:hklm': ['HKEY_', 'LOCAL_MACHINE', 'computer', 'paper'], mag: ['JACK', 'ATTACK!', 'J', 'ja'],
  };
  // sites added with IE.addSite that aren't in the WebPack manifest (an IE.addSite object may also carry desc + cat itself)
  const SITE_INFO = {
    'jacknetzone.jnet': { d: 'Play Reversi, Checkers, Battleships and more against REAL people. Ladders, cups and a Java arcade.', cat: 'games', dyn: 1 },
    'rupeeshop.jnet': { d: 'Spend your Rupees on hats, wallpapers, cursors and pets. No refunds. WAAAGH.', cat: 'news', dyn: 1 },
    'jacknetbank.webcom': { d: 'Online banking for your Rupees. Statements, the rich list and a vault you are not allowed in.', cat: 'news', dyn: 1 },
    'jackexchange.grot': { d: 'Buy and sell shares in GEMS, PETS and CUBE. Prices go up. Prices go down. Mostly down.', cat: 'news', dyn: 1 },
    'jacktown.jnet': { d: 'A whole town on the Internet. Get a plot, build a hut, read the Gazette, avoid the geese.', cat: 'comm', dyn: 1 },
    'jacklotto.grot': { d: 'Pick your numbers. Win Rupees. (You will not win Rupees.)', cat: 'fun', dyn: 1 },
    'jackdownpark.grot': { d: 'Go-kart racing! Read the form, place a bet, shout at the screen.', cat: 'fun', dyn: 1 },
    'mypixelfarm.webcom': { d: 'Raise your own pixel pets. Feed them. Sell them. Buy more pens.', cat: 'fun', dyn: 1 },
    'greetzomatic.kidz': { d: 'Free animated e-cards. Pick up the ones your mates sent you.', cat: 'comm' },
    'hoaxwatch.netz': { d: 'Got a scary FORWARD THIS TO EVERYONE e-mail? Check it here before you send it to your whole address book.', cat: 'help' },
    'unsubomatic.netz': { d: 'Unsubscribe from mailing lists the proper way. Takes 28 days (and counting).', cat: 'help' },
    'remove-me-now.w3b': { hide: 1 },
    'waaaghooo.find': { d: 'The most visited place on the JackNet! The big web directory: every site, sorted by hand (by very tired students). Plus Answers, Cool! sites and news.', cat: 'help', self: 1 },
    'jackgle.find': { d: 'A new search engine from two students in a garage. One box, two buttons, very fast. Nerds love it.', cat: 'help', self: 1 },
    'askgubbinz.find': { d: 'Ask a question in plain English and Gubbinz the butler fetches the answer. He is wearing a tiny bow tie.', cat: 'help', self: 1 },
    'waaaghoo.find': { hide: 1, self: 1 },
    'sharewareshack.netz': { d: 'Shareware, freeware and demos. Download them, install them, uninstall them, repeat.', cat: 'soft', force: 'soft' },
  };
  // Jack's own hidden pages that are meant to be found (Cool Links lists them); site-data.js has the proper words if it's loaded
  const JACK = {
    holocron: ['THE HOLOCRON', "Jack's secret Intergalactic Battles vault. Space Cadet only.", 'sw'], dave: ["Dave's Homepage (the old one)", 'Under construction since March. His cousin is doing the graphics.', 'mates'],
    orkhole: ['The Paint Hole', "Jack's painting tips for minis, model kits and anything with a brush.", 'hobby'], y2k: ['Y2K Survival Centre', "A checklist, a countdown and Mom's beans.", 'weird'],
    gubbinzfanclub: ['The Gubbinz Fan Club', 'Official fan page for the little green helper. Signed photo: he ate it.', 'fun'], keepoutdave: ['KEEP OUT DAVE', 'A page Dave is not allowed to look at.', 'weird'],
    jackamp: ['JackAmp', "Jack's media player page. It really whips the... Mom says we can't finish that.", 'soft'], jackcarta: ['JackCarta 99', 'The multimedia encyclopedia on CD-ROM, online.', 'sci'],
    hklm: ['HKEY_LOCAL_MACHINE', 'For people who know what the registry is.', 'sci'],
  };
  const CAT_FIX = { downloads: 'soft', freetoolz: 'soft', search: 'help', directory: 'help', awards: 'comm' };
  const COOL = new Set(['mag', '~dave', '~kim', 'podracing', 'hamstercam', '~sam', 'chatterbox', 'custard', 'adopt', 'midi', 'top100cheats', '~mek', 'cubetimes', 'jackgle.find', 'jacknetzone.jnet',
    'rupeeshop.jnet', 'ezine', 'hz-goldie', 'megaflash', '~ash', 'hz-rory', 'jokes', 'hoaxwatch.netz', 'jack:holocron', 'orktranslate', 'jackdownpark.grot']);
  const NEWS = new Set(['jackgle.find', 'askgubbinz.find', 'sharewareshack.netz', 'squigwitch.cyb', 'year3000.cyb', 'holohut.kidz', 'jackbay.webcom', 'adopt', 'ezine', 'ecardz', 'greetzomatic.kidz', 'jackexchange.grot', 'jacktown.jnet', 'hoaxwatch.netz', 'mypixelfarm.webcom']);
  const POP = ['jackgle.find', 'waaaghooo.find', 'search', 'askgubbinz.find', 'jacknetzone.jnet', 'chatterbox', 'jackmail', 'hamstercam', 'rupeeshop.jnet', 'lookhere', 'news', 'ezine', '~dave', 'sharewareshack.netz'];
  const ORDER = ['games', 'fun', 'fans', 'sw', 'sci', 'hobby', 'mates', 'comm', 'news', 'soft', 'help', 'weird'];
  const SITE_DATA = () => window.SITE_DATA || null;

  function cats() {
    const c = Object.assign({}, (WP() && WP().CATS) || {}, { soft: 'Software & Downloads' }); delete c.hidden; delete c.sub;
    const out = {}; ORDER.filter(k => c[k]).concat(Object.keys(c).filter(k => !ORDER.includes(k))).forEach(k => { out[k] = c[k]; }); return out;
  }
  const catKey = c => { c = String(c || '').toLowerCase(); const C = cats(); if (C[c]) return c; if (/soft|down|prog|share|free/.test(c)) return 'soft'; if (/game/.test(c)) return 'games'; if (/shop|news/.test(c)) return 'news'; if (/search|help/.test(c)) return 'help'; if (/chat|comm|mail/.test(c)) return 'comm'; return 'fun'; };
  const hostKey = h => String(h || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  // ================================================================ the master list (built lazily, rebuilt when new sites turn up)
  let LIST = null, sig = '';
  function list() {
    const W = WP(), sites = (window.IE && IE.sites) || {}, sd = SITE_DATA();
    const s2 = Object.keys(sites).length + ':' + (W ? Object.keys(W.M).length : 0) + ':' + (sd ? 1 : 0);
    if (LIST && s2 === sig) return LIST;
    sig = s2; const out = [], seenHost = new Set();
    const add = e => { e.cool = COOL.has(e.id); e.isNew = NEWS.has(e.id) || !!e.isNew; e.short = e.short || (BADGE[e.id] ? (BADGE[e.id][0] + ' ' + BADGE[e.id][1]).replace(/\s+/g, ' ') : e.title); out.push(e); };
    add({ id: 'mag', kind: 'mag', sec: 'home', host: MAIN, url: 'http://' + MAIN + '/', title: 'JACK ATTACK! Online', desc: 'The games mag Jack made. Reviews, cheats, Intergalactic Battles, the Games Arcade, the Hangout and a little green helper called Gubbinz. The best site on the JackNet (says Jack).', cat: 'games' });
    if (W) for (const w of Object.keys(W.M)) {
      const m = W.M[w]; if (m.host) seenHost.add(hostKey(m.host)); // hidden sites (the prize page...) stay hidden
      if (m.parent || m.cat === 'hidden' || m.cat === 'sub') continue;
      add({ id: w, kind: 'web', w, host: m.host || MAIN, url: W.urlOfWord(w), title: m.t, desc: m.d, cat: catKey(CAT_FIX[w] || m.cat) });
    }
    for (const key of Object.keys(sites)) {
      if (seenHost.has(key)) continue;
      const s = sites[key], info = SITE_INFO[key] || {};
      if (info.hide || s.hidden || s.noindex === 'hide' || !s.pages || !(s.pages['/'] || Object.keys(s.pages).length)) continue;
      add({ id: key, kind: 'site', host: s.host || key, url: 'http://' + (s.host || key) + '/', title: s.title || key, desc: s.desc || info.d || 'A site on the JackNet. Nobody has written a description yet. Maybe it is very mysterious.', cat: catKey(info.force || s.cat || info.cat || 'fun'), isNew: !SITE_INFO[key] && !BADGE[key] || NEWS.has(key) });
    }
    const links = sd && Array.isArray(sd.links) ? sd.links : null;
    for (const w of Object.keys(JACK)) {
      if (window.IE && !IE.pages[w]) continue;
      const l = links && links.find(x => x.w === w);
      add({ id: 'jack:' + w, kind: 'jack', w, host: MAIN, url: 'http://' + MAIN + '/' + w, title: l ? l.t : JACK[w][0], desc: l ? l.d : JACK[w][1], cat: JACK[w][2] });
    }
    return (LIST = out);
  }
  const byId = id => list().find(e => e.id === id);
  const byUrl = url => { const u = normU(url); return list().find(e => normU(e.url) === u); };
  function byCat() { const C = cats(), o = {}; Object.keys(C).forEach(k => { o[k] = []; }); list().forEach(e => { (o[e.cat] = o[e.cat] || []).push(e); }); Object.keys(o).forEach(k => o[k].sort((a, b) => sortT(a).localeCompare(sortT(b)))); return o; }
  const sortT = e => e.title.replace(/^[^a-z0-9]+/i, '').toLowerCase();
  // How popular each site is, modelled on who the big sites of 1999 were: the portal/directory first, then free e-mail,
  // free homepages, the big search engine, start pages, chat, e-cards, auctions, downloads... personal pages last.
  // Jackgle! starts tiny and climbs through the year (it was a beta in a garage in early 1999).
  const POPS = { 'waaaghooo.find': 100, 'jsn.jnet': 90, homepagez: 97, hoods: 93, jackmail: 96, search: 94, lookhere: 91, chatterbox: 88, ecardz: 86, 'jackbay.webcom': 85,
    'sharewareshack.netz': 84, 'jacknetzone.jnet': 83, 'rupeeshop.jnet': 81, 'askgubbinz.find': 80, news: 79, hamstercam: 77, weather: 70, csotd: 72, 'squigwitch.cyb': 74,
    mag: 62, top100cheats: 68, 'jackdot.jnet': 66, ezine: 55, jokes: 64, counters: 50, biscuitring: 52, freetoolz: 58, downloads: 57, adopt: 60, directory: 61 };
  function pop(e) {
    if (!e) return 0;
    if (e.id === 'jackgle.find') { const d = dayOfYear(); return Math.round(18 + d / 365 * 48); }
    const k = e.id.replace(/^www\./, '');
    if (POPS[k] != null) return POPS[k];
    const h = hash('pop' + e.id) % 12;
    return e.kind === 'site' ? 32 + h : e.kind === 'jack' ? 10 + h : e.kind === 'mag' ? 62 : 16 + h;
  }
  const hot = n => list().filter(e => e.kind !== 'jack').slice().sort((a, b) => pop(b) - pop(a) || a.title.localeCompare(b.title)).slice(0, n || 100);
  function popular(n) { return hot(n || 12); }
  function random(not) { const L = list().filter(e => e.id !== not && e.kind !== 'mag'); return L[Math.floor(Math.random() * L.length)]; }
  function siteOfDay() { const L = list().filter(e => e.kind !== 'mag' && !(SITE_INFO[e.id] || {}).self && e.id !== 'lost'); return L[(hash('sotd' + dayOfYear()) % L.length)]; }

  function open(e) {
    if (typeof e === 'string') e = byId(e) || byUrl(e);
    if (!e) return;
    const br = $('browser'); if (br) br.classList.remove('min');
    if (e.kind === 'mag') return IE.go(e.sec || 'home', 'click');
    if (e.kind === 'web' && WP()) return WP().go(e.w);
    if (e.kind === 'jack') return IE.navigate(e.w);
    IE.navigate(e.url);
  }

  // ================================================================ 88x31 buttons
  function spec(e) {
    const b = BADGE[e.id] || [], h = hash(e.id);
    const words = e.title.replace(/\s[-:(].*$/, '').replace(/[^A-Za-z0-9!' &]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().split(' ').filter(Boolean);
    let top = b[0], bot = b[1];
    if (!top) { top = words.shift() || 'SITE'; while (words.length && (top + ' ' + words[0]).length <= 10) top += ' ' + words.shift(); top = top.slice(0, 10); }
    if (!bot) { bot = ''; while (words.length && (bot + ' ' + words[0]).trim().length <= 13) bot = (bot + ' ' + words.shift()).trim(); bot = bot || hostKey(e.host).split('.').pop().toUpperCase(); }
    const ic = b[2] || { games: 'joy', fun: 'grin', fans: 'star', sw: 'saber', sci: 'planet', hobby: 'cube', mates: 'house', comm: 'chat', news: 'news', soft: 'floppy', help: 'mag', weird: 'eye' }[e.cat] || 'globe';
    const st = b[3] || STYLES[h % STYLES.length], pal = PALS[b[4] != null ? b[4] : (h >>> 5) % PALS.length];
    return { top, bot, ic, st, pal, neon: NEON[(h >>> 13) % NEON.length], blink: (h >>> 9) % 4 === 0 };
  }
  function badge(e, o) {
    o = o || {}; if (typeof e === 'string') e = byId(e); if (!e) return '';
    const s = spec(e), beta = e.id === 'jackgle.find' ? (t99().md < 921 ? 'BETA' : 'SEARCH!') : s.bot;
    const sz = (s.top.length > 9 ? ' wd-st' : '') + (beta.length > 12 ? ' wd-sb' : '');
    return `<a href="#" class="wd88 wd-${s.st}${s.blink && !o.still ? ' wdbl' : ''}${sz}" data-wd="${esc(e.id)}" title="${esc(e.title)}" aria-label="${esc(e.title)}" style="--b:${s.pal[0]};--c:${s.pal[1]};--f:${s.pal[2]};--n:${s.neon}">${icon(s.ic)}<span class="wt"><b>${esc(s.top)}</b><i>${esc(beta)}</i></span>${e.isNew && o.newb !== false ? '<em class="wn">NEW!</em>' : ''}</a>`;
  }
  // every button click counts: twenty different ones is a secret
  let clicked = store.get('jhp_eng_btn', []);
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('[data-wd]'); if (!a) return;
    ev.preventDefault(); sfx('click');
    const id = a.dataset.wd; if (!clicked.includes(id)) { clicked.push(id); store.set('jhp_eng_btn', clicked); if (clicked.length >= 20) secret('eng.badges'); }
    if (a.dataset.wdsotd) secret('eng.sotd');
    open(id);
  });
  document.addEventListener('mouseover', ev => { const a = ev.target.closest && ev.target.closest('[data-wd]'); if (!a || !$('brStatus')) return; const e = byId(a.dataset.wd); if (e) $('brStatus').textContent = e.url; });

  // ================================================================ the search index (JackSearch's spiders, plus every IE.addSite page)
  const normU = u => { let s = String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[#?].*$/, '').replace(/index\.html?$/, ''); if (!s.includes('/')) s += '/'; return s; };
  function linksOf(raw) {
    const out = new Set(); let m; raw = String(raw || '');
    const re1 = /data-wp="([^"?]+)"/g; while ((m = re1.exec(raw))) out.add('w:' + m[1].toLowerCase());
    const re2 = /href="(https?:\/\/[^"]+)"/g; while ((m = re2.exec(raw))) out.add('u:' + normU(m[1]));
    const re3 = /data-page="([^"]+)"/g; while ((m = re3.exec(raw))) out.add('w:' + m[1].toLowerCase());
    return [...out];
  }
  const tpl = document.createElement('template');
  const plain = raw => { tpl.innerHTML = String(raw || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<(br|\/p|\/div|\/li|\/td|\/th|\/h\d|\/option|\/a|\/span|\/b|\/tr|\/label)\b[^>]*>/gi, '$& '); const t = tpl.content.textContent.replace(/\s+/g, ' ').trim(); tpl.innerHTML = ''; return t; };
  // pages made with IE.addSite (and Jack's own pages) for the JackSearch index. Called by web-search.js while it builds.
  function siteDocs(have, only) {
    const W = WP(), out = [], sites = (window.IE && IE.sites) || {};
    const wh = new Set(Object.values(W ? W.M : {}).map(m => hostKey(m.host)).filter(Boolean));
    const gsCat = c => ((W && W.CATS) || {})[c] ? c : 'help';
    const keep = { secret: A.secret, nav: IE.navigate, go: IE.go };
    A.secret = () => false; IE.navigate = () => {}; IE.go = () => {}; // indexing must not hand out secrets or wander off
    try {
      for (const key of only || Object.keys(sites)) {
        if (wh.has(key) || !sites[key]) continue;
        const s = sites[key], info = SITE_INFO[key] || {}; if (info.hide || s.hidden || !s.pages) continue;
        const desc = s.desc || info.d || '', cat = gsCat(catKey(info.force || s.cat || info.cat || 'fun'));
        const paths = Object.keys(s.pages), front = s.pages['/'] ? '/' : paths[0];
        const quick = info.dyn || info.self || s.noindex;
        for (const p of (quick ? [front] : paths.slice(0, 40))) {
          const pg = s.pages[p]; let raw = '';
          if (quick) raw = paths.map(x => (s.pages[x] && s.pages[x].title) || '').filter((x, i, a) => x && a.indexOf(x) === i).join('. ');
          else if (pg && typeof pg.text === 'string') raw = pg.text;
          else { try { const h = typeof pg === 'function' ? pg() : (pg && pg.html !== undefined ? (typeof pg.html === 'function' ? pg.html() : pg.html) : pg); raw = typeof h === 'string' ? h : (h && h.outerHTML) || ''; } catch (e) { raw = ''; } }
          let body = plain(raw); if (body.length < 400 && /contacting host|waiting for reply|loading|connecting to/i.test(body)) body = ''; // a page still dialling up has nothing to read yet
          const title = (pg && pg.title) || s.title || key, url = 'http://' + (s.host || key) + ((pg && pg.path) || p);
          out.push({ w: key + p, kind: 'site', sub: p !== front, title, url, desc: p === front ? desc : title, cat, text: fold(title + ' ' + (p === front ? desc : '') + ' ' + key + ' ' + body), body: body.slice(0, 5000), size: Math.round(3 + body.length / 90), out: linksOf(raw) });
        }
      }
      const known = new Set((have || []).map(e => e.w));
      for (const w of only ? [] : Object.keys(JACK)) {
        if (known.has(w) || !IE.pages[w]) continue;
        let raw = ''; if (['holocron', 'orkhole', 'y2k', 'gubbinzfanclub'].includes(w)) { try { const h = IE.pages[w].html; raw = typeof h === 'function' ? h() : h; if (typeof raw !== 'string') raw = ''; } catch (e) { raw = ''; } }
        const body = plain(raw);
        out.push({ w, kind: 'other', title: JACK[w][0], url: 'http://' + MAIN + '/' + w, desc: JACK[w][1], cat: gsCat(JACK[w][2]), text: fold(JACK[w].join(' ') + ' ' + w + ' ' + body), body: body.slice(0, 5000), size: 4 + Math.round(body.length / 90), out: linksOf(raw) });
      }
    } finally { A.secret = keep.secret; IE.navigate = keep.nav; IE.go = keep.go; }
    return out;
  }
  // count the links pointing at every page: more links in = better (that's the Jackgle trick)
  function inlinks(ix) {
    const W = WP(), key = {}, alias = (W && W.ALIAS) || {};
    ix.forEach((e, i) => { e.urlf = fold(e.url.replace(/^http:\/\//, '')); e.inl = 0; key['u:' + normU(e.url)] = i; if (e.kind !== 'site') key['w:' + String(e.w).toLowerCase()] = i; });
    ix.forEach((e, i) => {
      const seen = new Set();
      for (let t of (e.out || [])) {
        if (t.startsWith('w:') && alias[t.slice(2)]) t = 'w:' + alias[t.slice(2)].toLowerCase();
        const j = key[t]; if (j == null || j === i || seen.has(j)) continue; seen.add(j); ix[j].inl++;
      }
    });
    list().forEach(d => { const j = key['u:' + normU(d.url)]; if (j != null) ix[j].inl += 2; }); // listed in the directory and on LINK-O-RAMA
    return ix;
  }
  let IXP = null, IX = null, builtHosts = new Set();
  // sites that turn up after the spiders' first crawl get crawled the next time anyone searches
  const recrawl = ix => { const fresh = Object.keys((window.IE && IE.sites) || {}).filter(k => !builtHosts.has(k)); if (fresh.length && ix.length) { fresh.forEach(k => builtHosts.add(k)); try { ix.push(...siteDocs(ix, fresh)); inlinks(ix); vocab = null; } catch (e) { console.error(e); } } return ix; };
  // members' own homepages at members.homepagez.webcom/~name/ (made with the Homepagez builder, listed by the server). Titles are
  // typed by visitors, so they are only ever used as text (escaped everywhere they're shown) and checked against the word filter.
  let hpAt = 0;
  function members(ix) {
    if (!window.HPZ || !HPZ.req || Date.now() - hpAt < 120000 || !ix.length) return Promise.resolve(ix);
    hpAt = Date.now();
    const got = HPZ.req({ t: 'hpzList', what: 'all' }).then(m => {
      if (!m || !Array.isArray(m.items)) return ix;
      for (let i = ix.length - 1; i >= 0; i--) if (ix[i].member) ix.splice(i, 1);
      for (const it of m.items.slice(0, 500)) {
        const k = String((it && it.k) || '').toLowerCase(); if (!/^[a-z0-9_-]{2,16}$/.test(k)) continue;
        let t = String(it.t || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); if (!t || RUDE.test(t)) t = '~' + k + "'s homepage";
        const url = HPZ.memberUrl ? HPZ.memberUrl(k) : 'http://members.homepagez.webcom/~' + k + '/', hood = String(it.hood || '').replace(/[^A-Za-z]/g, '').slice(0, 16);
        const desc = 'A homepage made by ~' + k + ' with the Homepagez builder' + (hood ? ', in the ' + hood + ' neighbourhood' : '') + '.';
        ix.push({ w: 'hpz:' + k, kind: 'site', member: true, sub: false, title: t, url, desc, cat: 'mates', text: fold(t + ' ' + k + ' ' + desc), body: desc, size: 3, out: [], inl: 1, urlf: fold(url.replace(/^http:\/\//, '')) });
      }
      vocab = null; return ix;
    });
    return Promise.race([got, new Promise(r => setTimeout(() => r(ix), 1500))]);
  }
  function ready() {
    if (IXP) return IXP.then(recrawl).then(members);
    const W = WP(); if (!W) return Promise.resolve([]);
    return (IXP = W.load(5).then(() => W.searchApi.build()).then(ix => { builtHosts = new Set(Object.keys((window.IE && IE.sites) || {})); return (IX = inlinks(ix)); }).then(members).catch(e => { console.error(e); IXP = null; return []; }));
  }
  const RUDE = /\b(poo+p?|bum|butt|fart|stupid|idiot|dumb|smelly|ugly|shut ?up|loser|git|sucks?|willy|knickers|crap|damn|bloody|bugger|arse|piss|f+u+c+k\w*|sh[i1]t\w*|bitch\w*|bastard)\b/i;
  const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'it', 'i', 'me', 'my', 'you', 'what', 'where', 'who', 'how', 'why', 'when', 'which', 'can', 'do', 'does', 'find', 'about', 'some', 'any', 'please', 'info', 'information', 'get', 'with', 'at', 'be', 'there', 'tell', 'show', 'want', 'like', 'page', 'pages', 'site', 'website', 'web', 'www']);
  function parseQ(q) {
    let s = fold(q).trim(); const o = { related: null, site: null, plus: [], minus: [], raw: String(q || '').trim() };
    s = s.replace(/related:(\S+)/, (m, u) => { o.related = u; return ' '; }).replace(/site:(\S+)/, (m, u) => { o.site = hostKey(u); return ' '; }).replace(/cat:([a-z]+)/, (m, u) => { o.cat = u; return ' '; });
    for (const tok of s.match(/[-+]?[a-z0-9~'][a-z0-9~'.]*/g) || []) { const t = tok.replace(/^[-+]/, '').replace(/[.']+$/, ''); if (!t) continue; (tok[0] === '-' ? o.minus : o.plus).push(t); }
    o.plus = o.plus.slice(0, 8); return o;
  }
  function snip(e, words) {
    const body = e.body || e.desc || '', low = body.toLowerCase();
    let i = -1; for (const w of words) { i = low.indexOf(w); if (i >= 0) break; }
    let s = i < 0 ? body.slice(0, 160) : body.slice(Math.max(0, i - 70), i + 120);
    if (i > 70) s = s.replace(/^\S*\s/, ''); s = s.replace(/\s\S*$/, '');
    let h = esc(s); words.forEach(w => { if (w.length > 1) h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<b>$1</b>'); });
    return (i > 70 ? '...' : '') + h + (s.length < body.length ? '...' : '');
  }
  function rank(ix, q, mode) {
    const t0 = performance.now(), o = parseQ(q), res = { q: o.raw, words: o.plus, hits: [], filtered: false, related: null };
    if (mode === 'grot' && RUDE.test(o.raw)) { res.filtered = true; return res; }
    if (o.related) {
      const base = ix.find(e => normU(e.url) === normU(o.related)) || ix.find(e => e.urlf && e.urlf.startsWith(hostKey(o.related)));
      res.related = base || null;
      if (base) res.hits = ix.filter(e => e !== base && e.cat === base.cat && !e.sub).sort((a, b) => b.inl - a.inl).map(e => ({ e, score: e.inl, snip: esc(e.desc || '') }));
    } else if (o.plus.length || o.site || o.cat) {
      let words = o.plus.filter(w => !STOP.has(w)); if (!words.length) words = o.plus;
      for (const e of ix) {
        if (o.site && !e.urlf.startsWith(o.site)) continue;
        if (o.cat && e.cat !== o.cat) continue;
        const tt = fold(e.title); let score = 0, ok = true;
        for (const w of o.minus) if (e.text.includes(w)) { ok = false; break; }
        if (!ok) continue;
        for (const w of words) {
          const st = w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w; // "orks" finds "Ork Painting" too
          const n = e.text.split(w).length - 1, inT = tt.includes(st), inU = e.urlf.includes(st);
          if (!n && !inT && !inU) { ok = false; break; }
          if (mode === 'jackgle') score += Math.min(n, 4) * 1.5 + (inT ? 10 : 0) + (inU ? 8 : 0);
          else if (mode === 'grot') score += Math.min(n, 12) + (inT ? 15 : 0) + (String(e.w) === w ? 25 : 0);
          else score += Math.min(n, 6) + (inT ? 12 : 0) + (inU ? 4 : 0);
        }
        if (!ok) continue;
        if (mode === 'jackgle') { score += 6 * Math.log2(1 + (e.inl || 0)) + (e.sub ? -2 : 3); if (words.length > 1 && e.text.includes(words.join(' '))) score += 6; }
        else if (mode !== 'grot') score += Math.log2(1 + (e.inl || 0)) * 2 + (e.sub ? 0 : 2);
        res.hits.push({ e, score, snip: snip(e, words.length ? words : o.plus) });
      }
      res.hits.sort((a, b) => b.score - a.score);
      const seen = new Set(); res.hits = res.hits.filter(h => { const u = normU(h.e.url); if (seen.has(u)) return false; seen.add(u); return true; });
    }
    res.n = res.hits.length; res.secs = Math.max(0.03, (performance.now() - t0) / 1000 + (mode === 'grot' ? 0.31 : mode === 'jackgle' ? 0.02 : 0.12));
    return res;
  }
  function search(q, mode) { return ready().then(ix => rank(ix, q, mode || 'jackgle')); }
  // directory matches (WAAAGHooo! Category Matches, Ask Gubbinz): sites and categories whose names fit the words
  function dirMatch(q) {
    const o = parseQ(q), words = o.plus.filter(w => !STOP.has(w)), C = cats(), out = { cats: [], sites: [] };
    if (!words.length && !o.cat) return out;
    for (const k of Object.keys(C)) { const n = fold(C[k]); if (words.some(w => w.length > 2 && n.includes(w))) out.cats.push(k); }
    for (const e of list()) {
      if (o.cat && e.cat !== o.cat) continue;
      const t = fold(e.title + ' ' + e.short), d = fold(e.desc + ' ' + e.host); let s = 0;
      for (const w of words) { if (t.includes(w)) s += 5; else if (d.includes(w)) s += 2; }
      if (!words.length) s = 1;
      if (s) out.sites.push({ e, s: s + (e.cool ? 1 : 0) });
    }
    out.sites.sort((a, b) => b.s - a.s); out.sites = out.sites.map(x => x.e);
    return out;
  }
  // Did you mean...? (the nearest word that is actually on the web)
  let vocab = null;
  function didYouMean(q) {
    const o = parseQ(q); if (!o.plus.length || !IX) return '';
    if (!vocab) { vocab = new Set(); IX.forEach(e => fold(e.title + ' ' + (e.desc || '')).split(/[^a-z0-9]+/).forEach(w => { if (w.length > 3) vocab.add(w); })); }
    const dist = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
    let changed = false; const fixed = o.plus.map(w => { if (vocab.has(w) || w.length < 4) return w; let best = w, bd = 3; for (const v of vocab) { if (Math.abs(v.length - w.length) > 2) continue; const dd = dist(w, v); if (dd < bd) { bd = dd; best = v; } } if (best !== w) changed = true; return best; });
    return changed ? fixed.join(' ') : '';
  }

  // ================================================================ the engines themselves (pages render from js/web-engines-p.js)
  const ENG = {
    waaaghooo: { host: 'www.waaaghooo.find', name: 'WAAAGHooo!', pages: { '/': ['home', 'WAAAGHooo!'], '/search': ['search', 'WAAAGHooo! Search Results'], '/cool.html': ['cool', 'WAAAGHooo! - Cool! Sites'], '/new.html': ['new', "WAAAGHooo! - What's New"], '/answers/': ['answers', 'WAAAGHooo! Answers'], '/addurl.html': ['addurl', 'WAAAGHooo! - Suggest a Site'], '/random.html': ['random', 'WAAAGHooo! Random Link'], '/hot100.html': ['hot', 'WAAAGHooo! Hot 100'], '/inside.html': ['inside', 'Inside WAAAGHooo!'], '/dir/': ['home', 'WAAAGHooo!'] } },
    jackgle: { host: 'www.jackgle.find', name: 'Jackgle!', pages: { '/': ['home', 'Jackgle!'], '/search': ['search', 'Jackgle! Search'], '/about.html': ['about', 'About Jackgle!'], '/jobs.html': ['jobs', 'Jobs at Jackgle!'], '/advanced.html': ['advanced', 'Jackgle! Advanced Search'] } },
    askgubbinz: { host: 'www.askgubbinz.find', name: 'Ask Gubbinz', pages: { '/': ['home', 'Ask Gubbinz!'], '/ask': ['ask', 'Ask Gubbinz! - Answers'], '/about.html': ['about', 'About Your Butler'] } },
  };
  const PEND = {}, LASTQ = store.get('jhp_eng_lastq', {});
  let RAW = { t: '', at: 0 };
  // remember the address a link or the address bar asked for, so ?q= survives (JackNet Explorer drops it)
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('#s-secret a[href^="http"]'); if (a) RAW = { t: a.getAttribute('href'), at: Date.now() }; }, true);
  const ab = $('addrBar'); if (ab) ab.addEventListener('keydown', ev => { if (ev.key === 'Enter') RAW = { t: ab.value, at: Date.now() }; }, true);
  function takeQuery(eng) {
    if (PEND[eng] != null) { const q = PEND[eng]; delete PEND[eng]; return q; }
    if (Date.now() - RAW.at < 1500 && hostKey(RAW.t) === hostKey(ENG[eng].host)) { const m = /[?&]q=([^&#]*)/.exec(RAW.t); if (m) { try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return m[1]; } } }
    return LASTQ[eng] || '';
  }
  function setQ(eng, q) { LASTQ[eng] = String(q || '').slice(0, 80); store.set('jhp_eng_lastq', LASTQ); }
  function mount(eng, view, arg) {
    const el = document.createElement('div'); el.className = 'wpg wde wde-' + eng;
    const ctx = { eng, view, arg, q: ['search', 'ask'].includes(view) ? takeQuery(eng) : '' };
    const draw = () => { try { window.WebEnginesP.render(el, ctx); } catch (e) { console.error(e); el.innerHTML = '<p>This page has a bug in it. (Not the Millennium one. A normal one.)</p>'; } };
    if (window.WebEnginesP) draw();
    else {
      el.innerHTML = `<div class="wde-load"><p>Contacting host: <b>${esc(ENG[eng].host)}</b>...<br>Host contacted. Waiting for reply...</p><p class="wde-dots">.</p></div>`;
      A.load('js/web-engines-p.js').then(() => setTimeout(() => { if (el.isConnected) draw(); }, 200)).catch(() => { el.innerHTML = `<h2>The page cannot be displayed</h2><p>The server at <b>${esc(ENG[eng].host)}</b> is not answering. Try <b>Refresh</b>. (Mom might be on the phone.)</p>`; });
    }
    return el;
  }
  function registerEngines() {
    if (!window.IE || !IE.addSite) return;
    const C = cats();
    Object.keys(C).forEach(k => { ENG.waaaghooo.pages['/dir/' + k + '.html'] = ['cat', 'WAAAGHooo! - ' + C[k], k]; });
    for (const eng of Object.keys(ENG)) {
      const E = ENG[eng], pages = {};
      for (const p of Object.keys(E.pages)) { const [view, title, arg] = E.pages[p]; pages[p] = { title, path: p, html: () => mount(eng, view, arg) }; }
      IE.addSite(E.host, { title: E.pages['/'][1], desc: SITE_INFO[hostKey(E.host)].d, cat: 'help', pages });
    }
    // a typo-squatter from 1999: two o's instead of three (that's how the toolbar spells it)
    IE.addSite('www.waaaghoo.find', { title: 'WAAAGHoo?', hidden: true, pages: { '/': { title: 'Did you mean WAAAGHooo!?', html: () => typo() } } });
    [['jackgle', 'http://www.jackgle.find/'], ['waaaghooo', 'http://www.waaaghooo.find/'], ['waaaghoo', 'http://www.waaaghooo.find/'], ['askgubbinz', 'http://www.askgubbinz.find/']].forEach(([w, u]) => {
      if (!IE.pages[w]) IE.addPage(w, 'Redirecting...', () => { const el = document.createElement('div'); el.className = 'wpg'; el.innerHTML = `<p>Looking for <b>${esc(u)}</b>? Taking you there...</p>`; setTimeout(() => { if (el.isConnected) IE.navigate(u); }, 300); return el; });
    });
    if (!IE.pages.linkorama) IE.addPage('linkorama', 'LINK-O-RAMA!!!', () => { const el = document.createElement('div'); setTimeout(() => IE.go('links', 'click'), 0); return el; });
  }
  function typo() {
    const el = document.createElement('div'); el.className = 'wpg'; el.style.cssText = 'text-align:center;font:14px Arial,sans-serif';
    el.innerHTML = `<h2 style="color:#5b16c9">Oops! Count the o's!</h2><p>You typed <b>waaaghoo</b> with TWO o's. The proper one has THREE: <a href="http://www.waaaghooo.find/">www.waaaghooo.find</a></p><p class="small">(The toolbar spells it with two. The intern who made the toolbar ran out of o's.)</p><p>Taking you to the right one in <b class="wdt">4</b>...</p>`;
    let n = 4; const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); n--; el.querySelector('.wdt').textContent = n; if (n <= 0) { clearInterval(t); IE.navigate('http://www.waaaghooo.find/'); } }, 1000);
    return el;
  }
  function goSearch(eng, q) {
    q = String(q || '').trim(); const br = $('browser'); if (br) br.classList.remove('min');
    if (eng === 'grot') { if (WP()) { WP().pendingQuery = q; WP().go('search'); } return; }
    if (eng === 'gubbinz') eng = 'askgubbinz';
    if (eng === 'site') { IE.go('home', 'click'); return; }
    PEND[eng] = q;
    IE.navigate('http://' + ENG[eng].host + (eng === 'askgubbinz' ? '/ask' : '/search') + (q ? '?q=' + encodeURIComponent(q).replace(/%20/g, '+') : ''));
  }
  // after JackNet Explorer has drawn a page, put the search back in the address bar and the title
  function setAddr(url, title) { setTimeout(() => { const a = $('addrBar'); if (a && a.value && hostKey(a.value) === hostKey(url)) a.value = url; if (title) { $('winTitle').textContent = title + ' - JackNet Explorer'; $('taskBrowser').textContent = title; document.title = title; } }, 0); }
  let rands = store.get('jhp_eng_rand', 0);
  function surfRandom() { const e = random(); rands++; store.set('jhp_eng_rand', rands); if (rands >= 5) secret('eng.random'); sfx('boing'); Desk.toast('Surfing...', 'Off you go to ' + e.title + '!', 2500); open(e); return e; }

  // ================================================================ JackNet Explorer: the Search bar, Favorites, address list
  const PROVS = [['waaaghooo', 'WAAAGHooo!'], ['grot', 'JackSearch'], ['gubbinz', 'Ask Gubbinz'], ['jackgle', 'Jackgle! (new)'], ['site', 'This site (JACK ATTACK!)']]; // in order of 1999 popularity
  const provLogo = p => ({ jackgle: '<span class="wdx-lg wdx-jg"><i>J</i><i>a</i><i>c</i><i>k</i><i>g</i><i>l</i><i>e</i><i>!</i></span>', waaaghooo: '<span class="wdx-lg wdx-wg">WAAAGH<i>ooo!</i></span>', grot: '<span class="wdx-lg wdx-gs">JACK<i>SEARCH</i></span>', gubbinz: `<span class="wdx-lg wdx-ag">${icon('bowtie', 'wdx-bt')}Ask Gubbinz</span>`, site: '<span class="wdx-lg wdx-ja">JACK ATTACK!</span>' }[p] || '');
  const pageIco = () => (window.JICON ? JICON.get('webpage', 16) : icon('globe'));
  const folderIco = () => (window.JICON ? JICON.get('folder', 16) : icon('house'));
  function xbar(body, local) {
    let prov = store.get('jhp_eng_prov', 'waaaghooo'); if (!PROVS.some(p => p[0] === prov)) prov = 'waaaghooo';
    body.innerHTML = `<div class="wdx"><div class="wdx-top"><button class="btn" type="button" data-x="new">New</button><button class="btn" type="button" data-x="next" disabled>Next &gt;</button><button class="btn" type="button" data-x="cust">Customize...</button></div>
<label class="wdx-ch">Choose a search service:<select id="wdxProv">${PROVS.map(p => `<option value="${p[0]}"${p[0] === prov ? ' selected' : ''}>${p[1]}</option>`).join('')}</select></label>
<div class="wdx-logo"></div><form id="xform" class="row" style="gap:4px;flex-wrap:nowrap" autocomplete="off"><input type="text" id="xq" maxlength="80" style="flex:1;min-width:0"><button class="btn" type="submit" style="padding:2px 6px">Search</button></form><div id="xres" style="margin-top:8px"></div></div>`;
    const sel = body.querySelector('#wdxProv'), logo = body.querySelector('.wdx-logo'), inp = body.querySelector('#xq'), res = body.querySelector('#xres'), next = body.querySelector('[data-x=next]');
    let page = 0, last = null;
    const ph = () => { logo.innerHTML = provLogo(prov); inp.placeholder = prov === 'gubbinz' ? 'Ask a question...' : prov === 'site' ? 'Find a page on JACK ATTACK!...' : 'Search the web...'; };
    ph();
    sel.addEventListener('change', () => { prov = sel.value; store.set('jhp_eng_prov', prov); ph(); res.innerHTML = ''; next.disabled = true; if (inp.value.trim()) run(); });
    body.querySelector('[data-x=new]').addEventListener('click', () => { inp.value = ''; res.innerHTML = ''; next.disabled = true; inp.focus(); });
    body.querySelector('[data-x=cust]').addEventListener('click', () => Desk.msgbox('Customize Search Settings', 'Use one search service for all searches:\n\n' + PROVS.map(p => (p[0] === prov ? '(o) ' : '( ) ') + p[1]).join('\n') + '\n\nPick one from the "Choose a search service" list. JackNet Explorer will remember it. (It has a very good memory. 32MB of it.)', 'info'));
    next.addEventListener('click', () => { page++; draw(); });
    let used = store.get('jhp_eng_xprov', []);
    function run() {
      const q = inp.value.trim(); if (!q) return;
      if (!used.includes(prov)) { used.push(prov); store.set('jhp_eng_xprov', used); if (PROVS.every(p => used.includes(p[0]))) secret('eng.xbar'); }
      if (prov === 'site') { next.disabled = true; local(); return; }
      res.innerHTML = '<div class="wdx-wait">Searching the web... (dialling up)</div>'; page = 0;
      const mode = prov === 'grot' ? 'grot' : prov === 'jackgle' ? 'jackgle' : 'dir';
      search(q, mode).then(r => { last = r; if (prov === 'waaaghooo' || prov === 'gubbinz') { const d = dirMatch(q).sites; const have = new Set(d.map(e => normU(e.url))); r.hits = d.map(e => ({ e: { title: e.title, url: e.url, size: 0, dir: e }, snip: esc(e.desc) })).concat(r.hits.filter(h => !have.has(normU(h.e.url)))); r.n = r.hits.length; } draw(); });
    }
    function draw() {
      const r = last; if (!r) return; res.innerHTML = ''; const per = 10, slice = r.hits.slice(page * per, page * per + per);
      next.disabled = (page + 1) * per >= r.n;
      if (prov === 'gubbinz') res.insertAdjacentHTML('beforeend', `<div class="wdx-ask">${icon('bowtie', 'wdx-bt')} Gubbinz asks: <i>Where can I find information about <b>${esc(subject(r.q))}</b>?</i></div>`);
      res.insertAdjacentHTML('beforeend', `<div class="wdx-n">${r.filtered ? 'The Family Filter (set by Mom) hid the results for that.' : r.n ? `${r.n} result${r.n > 1 ? 's' : ''} found${r.n > per ? ` (${page * per + 1}-${Math.min(r.n, page * per + per)})` : ''}:` : 'No pages found. Try another word!'}</div>`);
      slice.forEach(h => {
        const b = document.createElement('button'); b.className = 'xi'; b.type = 'button'; b.innerHTML = pageIco() + '<span>' + esc(h.e.title) + '</span>';
        b.addEventListener('click', () => { if (h.e.dir) open(h.e.dir); else openHit(h.e); });
        res.appendChild(b);
        const sn = document.createElement('div'); sn.className = 'snip'; sn.innerHTML = h.snip + `<br><span class="wdx-u">${esc(h.e.url.replace(/^http:\/\//, ''))}</span>`; res.appendChild(sn);
      });
      if (r.n) { const m = document.createElement('a'); m.href = '#'; m.className = 'wdx-more'; m.textContent = 'See all the results on ' + PROVS.find(p => p[0] === prov)[1].replace(' (JACK ATTACK!)', '') + ' >>'; m.addEventListener('click', ev => { ev.preventDefault(); goSearch(prov, r.q); }); res.appendChild(m); }
    }
    body.querySelector('#xform').addEventListener('submit', ev => { ev.preventDefault(); run(); });
    setTimeout(() => { if (inp.isConnected && innerWidth > 760) inp.focus(); }, 30);
  }
  function openHit(e) {
    const br = $('browser'); if (br) br.classList.remove('min');
    if (e.kind === 'main') return IE.go(e.w, 'click');
    if (e.kind === 'web' || e.kind === 'other') return WP().go(e.w);
    IE.navigate(e.url);
  }
  const subject = q => { const w = String(q || '').replace(/[?!.]+$/, '').split(/\s+/).filter(x => x && !STOP.has(fold(x))); return (w.length ? w : String(q || '').split(/\s+/)).slice(0, 6).join(' '); };
  // Favorites > JackNet Directory: every site, by category
  function favItems(PAGE, FOLDER) {
    const C = cats(), bc = byCat();
    return [{ label: 'LINK-O-RAMA!!! (all of them)', icon: PAGE || pageIco(), act: () => { $('browser').classList.remove('min'); IE.go('links', 'click'); } }, '-',
      ...Object.keys(C).filter(k => bc[k] && bc[k].length).map(k => ({ label: C[k], icon: FOLDER || folderIco(), sub: () => bc[k].map(e => ({ label: e.title.length > 46 ? e.title.slice(0, 44) + '...' : e.title, icon: PAGE || pageIco(), act: () => open(e) })) }))];
  }
  function xbarFavs(body, xi, FOLDER, PAGE) {
    const open1 = new Set(); const wrap = document.createElement('div'); body.appendChild(wrap);
    const draw = () => {
      wrap.innerHTML = '';
      const f = document.createElement('button'); f.type = 'button'; f.className = 'xi folder wdx-f'; f.innerHTML = (FOLDER || folderIco()) + '<span>JackNet Directory</span>'; f.addEventListener('click', () => { open1.has('*') ? open1.delete('*') : open1.add('*'); draw(); }); wrap.appendChild(f);
      if (!open1.has('*')) return;
      const C = cats(), bc = byCat();
      Object.keys(C).filter(k => bc[k] && bc[k].length).forEach(k => {
        const g = document.createElement('button'); g.type = 'button'; g.className = 'xi wdx-sub'; g.innerHTML = (FOLDER || folderIco()) + '<span>' + esc(C[k]) + ' (' + bc[k].length + ')</span>'; g.addEventListener('click', () => { open1.has(k) ? open1.delete(k) : open1.add(k); draw(); }); wrap.appendChild(g);
        if (open1.has(k)) bc[k].forEach(e => { const b = xi(PAGE || pageIco(), e.title, () => open(e)); b.classList.add('wdx-sub2'); wrap.appendChild(b); });
      });
    };
    draw();
  }

  // ================================================================ the Links bar: on its own row (IE5 let you drag it there), the most popular
  // sites of the JackNet first, so everybody can find the search engines and directories. As many as fit, the rest behind the chevron.
  const LINKS = [ // [label, url or #section, icon, WebDir id]
    ['WAAAGHooo!', 'http://www.waaaghooo.find/', 'ork', 'waaaghooo.find'], ['JackSearch', 'http://www.jacksearch.find/', 'spider', 'search'],
    ['Jackgle!', 'http://www.jackgle.find/', 'mag', 'jackgle.find'], ['Ask Gubbinz', 'http://www.askgubbinz.find/', 'bowtie', 'askgubbinz.find'],
    ['Best of the Web', 'http://www.waaaghooo.find/hot100.html', 'trophy'], ['JSN', 'http://www.jsn.jnet/', 'globe', 'jsn.jnet'], ['Free JackMail', null, 'mail', 'jackmail'], ['Homepagez', null, 'house', 'homepagez'],
    ['ChatterBox', null, 'chat', 'chatterbox'], ['JackBay', 'http://www.jackbay.webcom/', 'pound', 'jackbay.webcom'], ['Software', 'http://www.sharewareshack.netz/', 'floppy'],
    ['Cool Links', '#links', 'star'], ["Jack's Home", '#home', 'J'], ['Games Arcade', '#demos', 'joy'], ['Write to Jack', '#letters', 'mail'],
  ];
  function linksRow() {
    const bl = $('bandLinks'), addr = $('bandAddr'); if (!bl || !addr) return;
    let row = $('bandLinksRow');
    if (!row) { row = document.createElement('div'); row.className = 'band linksband'; row.id = 'bandLinksRow'; row.innerHTML = '<span class="grip"></span>'; addr.after(row); row.appendChild(bl); }
    const chev = bl.querySelector('.chev'), eng = LINKS.slice(0, 4).sort((a, b) => pop(byId(b[3]) || {}) - pop(byId(a[3]) || {})); // Jackgle! climbs the list as 1999 goes on
    const out = eng.concat(LINKS.slice(4)).map(([label, u, ic, id]) => {
      const e = id && byId(id); u = u || (e && e.url); if (!u) return '';
      const at = u[0] === '#' ? `data-go="${u.slice(1)}"` : `data-url="${esc(u)}"`;
      return `<button type="button" ${at} title="${esc(e ? e.title + ' - ' + (e.desc || '') : label)}">${icon(ic, 'wd-lico')}<span>${esc(label)}</span></button>`;
    }).join('');
    [...bl.querySelectorAll('button:not([id])')].forEach(b => b.remove()); // keep buttons other programs put there (Uh-Oh!)
    chev.insertAdjacentHTML('afterend', out);
    if (!store.get('jhp_links_row', 0)) { store.set('jhp_links_row', 1); const br = $('browser'); if (br && br.classList.contains('no-links')) { br.classList.remove('no-links'); store.set('jhp_bands', store.get('jhp_bands', []).filter(c => c !== 'no-links')); } }
  }
  function fitLinks() {
    const bl = $('bandLinks'); if (!bl) return; const band = bl.parentElement, own = band.id === 'bandLinksRow', combo = band.querySelector('.combo');
    const bs = [...bl.querySelectorAll('button')]; bs.forEach(b => b.classList.remove('wd-over')); bl.classList.remove('wd-ovf');
    if ((!own && innerWidth <= 1100) || $('browser').classList.contains('min')) return;
    for (let i = bs.length - 1; i > 0 && ((own ? bl.scrollWidth > bl.clientWidth + 1 : band.scrollWidth > band.clientWidth + 1) || (!own && combo && combo.offsetWidth < 280)); i--) { bs[i].classList.add('wd-over'); bl.classList.add('wd-ovf'); }
  }

  // ================================================================ the home page: SURF THE JACKNET!
  let surfT = null;
  function homeBox() {
    const box = $('surfBox'); if (!box) return;
    const ed = document.querySelector('#s-home .ed'); if (ed && ed.nextElementSibling !== box) ed.after(box);
    const L = list(), n = L.length, show = innerWidth < 520 ? 3 : innerWidth < 900 ? 4 : 6;
    box.hidden = false; box.classList.add('wd-surf');
    box.innerHTML = `<div class="wd-surf-h"><span class="wd-surf-t">SURF THE JACKNET!</span><span class="wd-surf-n">${Math.floor(n / 10) * 10}+ SITES!!!</span></div>
<p class="wd-surf-p">There's a whole World Wide Web out there (well, a JackNet-wide one): my mates' homepages, shops that take Rupees, a hamster on a webcam, a town full of pixel people and FOUR search engines fighting to be the biggest. Click a button. Go on.</p>
<div class="wd-surf-row"></div>
<form class="wd-surf-f" autocomplete="off"><span class="wd-surf-l">Search the web with ${provLogo('waaaghooo')}</span><span class="wd-surf-in"><input type="text" maxlength="60" aria-label="Search the web with WAAAGHooo!" placeholder="hamster, cheats, Pokemon..."><button class="btn" type="submit">Search!</button></span></form>
<div class="wd-surf-b"><a href="#" data-go="links" class="wd-surf-all">&#9733; See ALL ${n} sites in COOL LINKS &#9733;</a><button class="btn wd-surf-rand" type="button">Surf somewhere random!</button></div>`;
    const row = box.querySelector('.wd-surf-row');
    const pool = L.slice().sort((a, b) => (pop(b) + hash(b.id + dayOfYear()) % 45) - (pop(a) + hash(a.id + dayOfYear()) % 45)); // popular sites turn up most
    let k = 0; const take = () => pool[k++ % pool.length];
    row.innerHTML = Array.from({ length: show }, () => badge(take(), { newb: false })).join('');
    box.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); goSearch('waaaghooo', box.querySelector('input').value); });
    box.querySelector('.wd-surf-rand').addEventListener('click', surfRandom);
    clearInterval(surfT);
    surfT = setInterval(() => {
      if (document.hidden || !box.isConnected || !box.closest('.sec.on') || $('browser').classList.contains('min')) return;
      const kids = row.children; if (!kids.length) return;
      const i = Math.floor(Math.random() * kids.length), d = document.createElement('span'); d.innerHTML = badge(take(), { newb: false });
      const nb = d.firstChild; nb.classList.add('wd-in'); row.replaceChild(nb, kids[i]);
    }, 2600);
  }

  // ================================================================ secrets
  [['eng.allfour', 'Search wars', 'Visit all four search engines on the JackNet'], ['eng.jacky5', 'Feeling very Jacky', "Press the I'm Feeling Jacky button five times"],
   ['eng.rude', 'Mind your language', 'Ask the butler something rude. He is far too polite to answer'], ['eng.cool', 'Ice cool', "Find the big portal's list of Cool! sites"],
   ['eng.didyoumean', 'Did you mean...?', 'Search the new engine for its own name'], ['eng.cache', 'Snapshot', 'Look at a cached copy of a page'],
   ['eng.mom', 'Nice try', 'Try to switch off the Family Filter. Mom set it'], ['eng.addurl', '6 to 8 weeks', 'Suggest a site to the biggest directory on the JackNet'],
   ['eng.random', 'Random surfer', 'Surf somewhere random five times'], ['eng.badges', 'Button collector', 'Click twenty different 88x31 buttons'],
   ['eng.xbar', 'Search party', 'Use every search service in the Search bar'], ['eng.sotd', 'Site of the Day', "Visit Jack's Site of the Day from the Cool Links page"],
   ['eng.jobs', 'Garage job', 'Apply for a job at a company that works out of a garage']].forEach(s => A.defineSecret(...s));
  let engVis = store.get('jhp_eng_vis', []);
  document.addEventListener('section', ev => {
    const d = String(ev.detail || ''); const m = /^site:(?:www\.)?([^/]+)/.exec(d); if (!m) return;
    const h = m[1].toLowerCase(), k = { 'jackgle.find': 'jg', 'waaaghooo.find': 'wg', 'jacksearch.find': 'gs', 'askgubbinz.find': 'ag' }[h];
    if (k && !engVis.includes(k)) { engVis.push(k); store.set('jhp_eng_vis', engVis); if (engVis.length >= 4) secret('eng.allfour'); }
  });

  // ================================================================ styles for the buttons, the home box and the Search bar (the engines bring their own)
  const css = document.createElement('style'); css.id = 'wde-css';
  css.textContent = `
.wd88{position:relative;display:inline-flex;align-items:center;gap:1px;width:88px;height:31px;box-sizing:border-box;overflow:hidden;vertical-align:middle;text-decoration:none!important;font:bold 9px/1 Arial,Helvetica,sans-serif;color:var(--f)!important;background:var(--b);border:1px solid #000;cursor:pointer;flex:none;padding:0 1px;-webkit-user-select:none;user-select:none}
.wd88 .wi{flex:none;width:24px;height:24px;display:block;margin-left:1px}
.wd88 .wt{display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:0;flex:1;text-align:center;line-height:1.1;white-space:nowrap;overflow:hidden}
.wd88 .wt b{font-size:9.5px;letter-spacing:-.2px;display:block}
.wd88 .wt i{font-style:normal;font-size:7px;font-weight:bold;display:block;letter-spacing:-.1px}
.wd88 .wn{position:absolute;top:0;right:0;background:#e10600;color:#ff0;font:bold 6px/1 Arial,sans-serif;font-style:normal;padding:1px 2px;animation:wdblink .6s steps(1) infinite}
.wd88.wdbl .wt i{animation:wdblink 1s steps(1) infinite}
.wd88:hover{filter:brightness(1.2)}.wd88:active{transform:translate(1px,1px)}
.wd88:focus-visible{outline:2px dotted #ff0;outline-offset:1px}
@keyframes wdblink{50%{opacity:0}}
.wd-bev{background:linear-gradient(var(--b),var(--c));border:2px outset var(--b);text-shadow:1px 1px 0 rgba(0,0,0,.6)}
.wd-neon{background:#000;color:var(--n)!important;border-color:var(--n);text-shadow:0 0 3px var(--n)}.wd-neon .wt i{color:#fff}
.wd88.wd-st .wt b{font-size:8px;letter-spacing:-.3px}.wd88.wd-sb .wt i{font-size:6.5px;letter-spacing:-.2px}
.wd-stripe{background:repeating-linear-gradient(45deg,var(--b) 0 4px,var(--c) 4px 8px);text-shadow:1px 1px 0 #000,-1px -1px 0 #000;color:#fff!important}
.wd-split{background:linear-gradient(90deg,var(--c) 0 28px,var(--b) 28px)}.wd-split .wt{color:var(--f)}
.wd-chrome{background:linear-gradient(#fff,#bbb 48%,#777 52%,#ddd);color:#000080!important;border-color:#444}
.wd-stars{background:#000 radial-gradient(circle,#fff 0 .6px,transparent 1px) 0 0/9px 7px;color:var(--n)!important;border-color:#666}.wd-stars .wt i{color:#fff}
.wd-check{background:repeating-conic-gradient(var(--b) 0 25%,#fff 0 50%) 0 0/8px 8px}.wd-check .wt{background:#fff;color:#000;padding:1px 2px;border:1px solid #000;flex:none;max-width:58px}
.wd-dbl{border:3px double var(--f);background:var(--b);color:var(--f)!important}
.wd-sunset{background:linear-gradient(90deg,var(--b),var(--c));color:#fff!important;text-shadow:1px 1px 0 #000}
.wd-lcd{background:#9bbc0f;color:#0f380f!important;border-color:#306230;font-family:"Courier New",monospace}.wd-lcd .wt b{font-family:"Courier New",monospace;font-weight:bold}
.wd-paper{background:#fff;color:#00e!important;border-color:#888;font-family:"Times New Roman",serif}.wd-paper .wt b{text-decoration:underline;font-family:"Times New Roman",serif;font-size:10px}.wd-paper .wt i{color:#000}
.wd-fire{background:linear-gradient(0deg,#ff0 0,#f80 35%,#e10600 70%,#300 100%);color:#fff!important;text-shadow:1px 1px 0 #000,0 0 2px #000}
.wd-grot{background:#000060;color:#ffd400!important;border:2px solid #ffd400;font-family:Georgia,serif}.wd-grot .wt b{font-family:Georgia,serif;letter-spacing:1px}
.wd-wg{background:linear-gradient(#7a2ad8,#3a0a7a);color:#ffd400!important;border:2px outset #b88aff}.wd-wg .wt b{font:900 12px/1 "Arial Black",Arial,sans-serif;-webkit-text-stroke:.5px #000;letter-spacing:-.5px}.wd-wg .wt i{color:#fff;font-size:9px;font-style:italic}
.wd-jg{background:#fff;border-color:#999;color:#000!important}.wd-jg .wt b{font:bold 12px Georgia,serif;color:#1a8a3a;text-shadow:1px 1px 0 #ccc}.wd-jg .wt i{color:#e10600}
.wd-ag{background:#f8ecd0;color:#6a1020!important;border:2px solid #6a1020}.wd-ag .wt b,.wd-ag .wt i{font-family:Georgia,serif;font-style:italic}
.wd-ja{background:linear-gradient(135deg,#e0157a,#5b16c9);color:#ffd400!important;text-shadow:1px 1px 0 #000;border:2px solid #000}.wd-ja .wt b{font-size:11px}
.wd88.wd-in{animation:wdin .5s steps(4)}@keyframes wdin{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0)}}
/* the home page box */
.wd-surf{position:relative;margin:16px 0;padding:12px 14px 12px;color:#fff;background:#000 radial-gradient(circle,#fff 0 1px,transparent 1.4px) 0 0/31px 23px;border:4px solid #000;box-shadow:6px 6px 0 #000;outline:4px solid transparent;overflow:hidden}
.wd-surf::before{content:"";position:absolute;inset:0;padding:4px;background:linear-gradient(90deg,#f00,#ff8c00,#ffd400,#3c3,#00e5ff,#5b16c9,#e0157a,#f00) 0 0/200% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:wdrain 3s linear infinite;pointer-events:none}
@keyframes wdrain{to{background-position:200% 0}}
.wd-surf-h{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.wd-surf-t{font:400 clamp(26px,5vw,40px)/1 var(--comic);color:var(--sun);-webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:3px 3px 0 #e0157a;transform:rotate(-2deg);display:inline-block;letter-spacing:.03em;animation:wdwig 1.2s ease-in-out infinite}
@keyframes wdwig{50%{transform:rotate(1deg) scale(1.03)}}
.wd-surf-n{font:bold 13px Arial,sans-serif;background:#e10600;color:#ff0;padding:3px 8px;border:2px solid #ff0;transform:rotate(4deg);animation:wdblink .8s steps(1) infinite}
.wd-surf-p{font:14px/1.45 Georgia,serif;margin:8px 0 10px;color:#e8e8ff}
.wd-surf-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;min-height:31px;margin:0 0 12px}
.wd-surf-f{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;background:#fff;color:#000;padding:6px 10px;border:2px inset #ccc;margin:0 auto 10px;max-width:560px}
.wd-surf-l{font:bold 13px Arial,sans-serif}
.wd-surf-in{display:flex;gap:4px;flex:1;min-width:180px}.wd-surf-in input{flex:1;min-width:0;font:13px Arial,sans-serif;padding:2px 4px}
.wd-surf-b{display:flex;align-items:center;justify-content:center;gap:10px 16px;flex-wrap:wrap}
.wd-surf-all{font:400 18px var(--comic);color:var(--lime)!important;letter-spacing:.05em;text-shadow:2px 2px 0 #000}
.wd-surf-rand{font-weight:bold}
/* little logos (Search bar, home box) */
.wdx-lg{font:bold 15px Georgia,serif;white-space:nowrap}
.wdx-jg i{font-style:normal;text-shadow:1px 1px 0 #bbb}.wdx-jg i:nth-child(1){color:#1a8a3a}.wdx-jg i:nth-child(2){color:#a040c0}.wdx-jg i:nth-child(3){color:#ff7a00}.wdx-jg i:nth-child(4){color:#1e6fd9}.wdx-jg i:nth-child(5){color:#e10600}.wdx-jg i:nth-child(6){color:#c8a000}.wdx-jg i:nth-child(7){color:#00a0a0}.wdx-jg i:nth-child(8){color:#e10600}
.wdx-wg{font:900 15px "Arial Black",Arial,sans-serif;color:#ffd400;-webkit-text-stroke:.6px #3a0a7a;text-shadow:1px 1px 0 #3a0a7a;letter-spacing:-.5px}.wdx-wg i{color:#7a2ad8;-webkit-text-stroke:0;text-shadow:none;font-style:italic}
.wdx-gs{font:bold 13px Georgia,serif;color:#000060;letter-spacing:1px}.wdx-gs i{font-style:normal;color:#c89600}
.wdx-ag{font:italic bold 14px Georgia,serif;color:#6a1020;display:inline-flex;align-items:center;gap:3px}
.wdx-ja{font:400 16px var(--comic);color:#e0157a;letter-spacing:.04em}
.wdx-bt{width:16px;height:16px;vertical-align:-3px}
/* the Search bar */
.wdx-top{display:flex;gap:3px;margin-bottom:6px}.wdx-top .btn{padding:1px 5px;font-size:11px;min-width:0}
.wdx-ch{display:block;font:11px var(--ui);margin-bottom:6px}.wdx-ch select{display:block;width:100%;margin-top:2px;font:11px var(--ui)}
.wdx-logo{background:#fff;border:1px solid #808080;padding:4px 6px;margin-bottom:6px;text-align:center}
.wdx-wait{color:#555;font-style:italic}.wdx-n{margin-bottom:4px}.wdx-u{color:#080;font-size:10px;word-break:break-all}
.wdx-ask{background:#f8ecd0;border:1px solid #6a1020;padding:3px 4px;margin-bottom:6px;font:11px var(--ui)}
.wdx-more{display:block;margin:6px 0;font:bold 11px var(--ui);color:#00e}
.xbody .wdx-f{font-weight:bold;margin-top:6px}.xbody .wdx-sub{padding-left:12px}.xbody .wdx-sub2{padding-left:24px}
.links button.wd-over{display:none!important}.links.wd-ovf .chev{display:inline}
.linksband .links{flex:1 1 auto;min-width:0;margin-left:0;padding-left:2px;border-left:0;box-shadow:none;overflow:hidden}
.linksband .links button{display:flex;flex:none}.linksband .links .chev{order:99;margin-left:auto;padding:0 4px;cursor:default}
.linksband .links .chev{display:none}.linksband .links.wd-ovf .chev{display:inline}
.wd-lico{width:16px!important;height:16px!important;flex:none;image-rendering:pixelated}
@media (max-width:640px){ #browser:not(.no-links) .linksband .links{display:flex} .linksband .links button{padding:2px 3px} }
#browser.no-links #bandLinksRow{display:none}
.wde-load{font:13px "Courier New",monospace;padding:20px}.wde-dots::after{content:"...";animation:wdblink 1s steps(1) infinite}
@media (max-width:520px){.wd-surf{padding:10px 8px}.wd-surf-f{padding:6px}.wd-surf-p{font-size:13px}}
`;
  document.head.appendChild(css);

  // ================================================================ start up
  registerEngines();
  const boot = () => {
    try { homeBox(); } catch (e) { console.error(e); }
    try { linksRow(); } catch (e) { console.error(e); }
    fitLinks();
    const bl = $('bandLinks');
    if (bl && window.MutationObserver) new MutationObserver(() => fitLinks()).observe(bl, { childList: true });
    if (window.ResizeObserver && $('bandAddr')) new ResizeObserver(() => fitLinks()).observe($('bandAddr'));
    window.addEventListener('resize', fitLinks);
    if ($('browser')) new MutationObserver(() => setTimeout(fitLinks, 0)).observe($('browser'), { attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
  // the site-data file (Jack's words for his own pages) arrives later; refresh the box once more sites have registered
  window.addEventListener('load', () => setTimeout(() => { LIST = null; if ($('surfBox') && !$('surfBox').hidden) { const r = $('surfBox').querySelector('.wd-surf-n'); if (r) r.textContent = Math.floor(list().length / 10) * 10 + '+ SITES!!!'; const a = $('surfBox').querySelector('.wd-surf-all'); if (a) a.innerHTML = `&#9733; See ALL ${list().length} sites in COOL LINKS &#9733;`; } fitLinks(); }, 1500));

  window.WebDir = {
    list, cats, byCat, pop, hot, get: byId, byUrl, random, siteOfDay, popular, badge, icon, open, openHit, search, ready, rank, dirMatch, didYouMean, siteDocs, linksOf, normU, hostKey, fold, hash, plain, subject, RUDE, STOP,
    goSearch, setAddr, setQ, surfRandom, xbar, favItems, xbarFavs, fitLinks, homeBox, ENG, PROVS, provLogo, spec, t99, dayOfYear,
    get index() { return IX; }, get count() { return IX ? IX.length : 0; },
    linkorama(el, D) { el.innerHTML = '<p class="sitewait">Loading the LINK-O-RAMA...</p>'; return A.load('js/web-engines-p.js').then(() => window.WebEnginesP.linkorama(el, D)).catch(e => { console.error(e); el.innerHTML = '<p>The LINK-O-RAMA fell over. Click Refresh!</p>'; }); },
  };
})();
