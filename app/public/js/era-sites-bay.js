/* era-sites-bay: JACKBAY, da world's online marketplace (a 1999 online auction parody). Pretend money only.
 * Every auction is shared by everyone online: each item runs in rounds of a fixed length (the same clock for every
 * visitor), bids are pushed to the Net.kv list 'eras.bay.<item>' as "round|pence" (the server stamps the bidder's
 * name, so nobody can bid as someone else), and each visitor's browser replays the same bids, plus the same seeded
 * computer bidders, to work out the high bidder. When a round ends the item is relisted. */
(function () {
  'use strict';
  const ES = window.EraSites, A = window.Apps, esc = ES.esc, store = ES.store;
  const H = 'www.jackbay.webcom', U = p => 'http://' + H + p;
  ES.css('bay', `
.gb{background:#fff;font:13px/1.4 Arial,Helvetica,sans-serif}
.gb a{color:#0033cc}
.gb-top{display:flex;align-items:flex-end;gap:10px 18px;padding:10px 12px 6px;flex-wrap:wrap;border-bottom:2px solid #ffcc00}
.gb-logo{font:bold 40px/1 "Arial Black",Arial,sans-serif;letter-spacing:-3px;text-decoration:none!important;text-shadow:1px 1px 0 rgba(0,0,0,.15)}
.gb-logo span:nth-child(1){color:#e53238}.gb-logo span:nth-child(2){color:#0064d2}.gb-logo span:nth-child(3){color:#f5af02}.gb-logo span:nth-child(4){color:#86b817}
.gb-logo small{display:block;font:bold 10px Arial,sans-serif;letter-spacing:0;color:#666}
.gb-nav{display:flex;gap:2px;flex-wrap:wrap;margin-left:auto}
.gb-nav a{background:#ffcc00;color:#000!important;font:bold 12px Arial,sans-serif;padding:4px 10px;border-radius:6px 6px 0 0;text-decoration:none}
.gb-srch{display:flex;gap:6px;align-items:center;padding:6px 12px;background:#fff8d0;border-bottom:1px solid #e0d090;flex-wrap:wrap;font-size:12px}
.gb-srch input{font:13px Arial,sans-serif;width:200px;max-width:60vw}
.gb-wrap{display:flex;gap:12px;padding:10px 12px;align-items:flex-start}
.gb-cats{width:170px;flex:none;font-size:12px;border:1px solid #c8c8e8;background:#eef0ff}
.gb-cats h4{margin:0;background:#3a4ab8;color:#fff;padding:3px 6px;font-size:12px}
.gb-cats ul{margin:4px 0;padding-left:18px}
.gb-main{flex:1;min-width:0}
.gb-tab{width:100%;border-collapse:collapse;font-size:12px}
.gb-tab th{background:#ccccff;text-align:left;padding:4px;font-size:11px}
.gb-tab td{padding:5px 4px;border-bottom:1px solid #e0e0f0;vertical-align:middle}
.gb-tab tr:nth-child(even) td{background:#f6f6ff}
.gb-tab .pic{width:56px}
.gb-tab .pr{font-weight:bold;white-space:nowrap}
.gb-pic{display:inline-flex;align-items:center;justify-content:center;background:#fff;border:1px solid #aaa;width:52px;height:52px;overflow:hidden}
.gb-pic svg{width:46px;height:46px}
.gb-big .gb-pic{width:180px;height:180px}.gb-big .gb-pic svg{width:160px;height:160px}
.gb-soon{color:#e10600;font-weight:bold}
.gb-hot{display:inline-block;background:#e10600;color:#fff;font:bold 9px Arial;padding:0 3px;margin-left:4px;vertical-align:middle}
.gb-item{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}
.gb-det{flex:1;min-width:240px}
.gb-det table{border-collapse:collapse;font-size:12px;width:100%}
.gb-det td{padding:3px 6px;border-bottom:1px solid #eee;vertical-align:top}
.gb-det td:first-child{font-weight:bold;white-space:nowrap;background:#f0f0ff;width:110px}
.gb-bid{border:2px solid #3a4ab8;background:#eef0ff;padding:8px;margin:10px 0;font-size:12px}
.gb-bid input{font:14px Arial,sans-serif;width:90px}
.gb-msg{margin-top:6px;font-weight:bold}
.gb-hist{font-size:12px;border-collapse:collapse;width:100%;margin-top:6px}
.gb-hist td,.gb-hist th{padding:2px 6px;border-bottom:1px solid #ddd;text-align:left}
.gb-hist tr.me td{background:#fff8c0}
.gb-star{display:inline-block;width:13px;height:13px;vertical-align:-2px}
.gb-desc{border:1px solid #ccc;padding:8px 10px;margin:10px 0;background:#fffff0}
.gb-desc h3{margin:0 0 4px;font:bold 16px "Comic Sans MS","Comic Sans",cursive;color:#c00000}
.gb-won{background:#ffe;border:3px double #e53238;padding:10px;text-align:center;margin:10px 0;font:bold 16px Arial}
.gb-fb li{margin:4px 0}
.gb-pos{color:#008000;font-weight:bold}.gb-neu{color:#666;font-weight:bold}.gb-neg{color:#c00;font-weight:bold}
@media (max-width:700px){.gb-wrap{flex-direction:column}.gb-cats{width:auto;order:2}.gb-tab .hide{display:none}.gb-logo{font-size:32px}.gb-nav{margin-left:0}}
`);

  // ================================================================ the catalogue
  const P = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const sv = b => `<svg viewBox="0 0 32 32" class="es-pix" aria-hidden="true">${b}</svg>`;
  const ITEMS = [
    ['squig', 'Holo Charizard Card (Base Set, American, corner a bit bent)', 'toys', 250, 600, 'trainer_tez', 12, 'A shoebox, Jacktown', sv(`${P(7, 3, 18, 26, '#ffd400')}${P(9, 5, 14, 12, '#ffe8c0')}<path d="M10 16c0-4 3-6 5-6l2-3 1 4c2 1 3 3 2 5l3-1-2 4H10z" fill="#ff8a00" stroke="#a03a00" stroke-width=".6"/><path d="M12 6l3 3M19 6l-2 3" stroke="#ff4a00"/>${P(9, 19, 14, 2, '#fff')}${P(9, 22, 14, 1, '#999')}${P(9, 24, 10, 1, '#999')}${P(20, 24, 3, 3, '#e10600')}`), 'The shiny one EVERYBODY wants. One careful owner (me), well, two (my brother bent the corner). It is in a plastic sleeve now. Please do not ask if it is real. It is real. It is SO real. No swaps. No returns. Please. Do not return it.'],
    ['pogs', "Dave's POG Collection (200+ pogs, 3 slammers, 1 tin)", 'toys', 150, 500, 'dave_kool_page', 3, 'Dave\'s bedroom', sv(`<circle cx="12" cy="18" r="9" fill="#ffd400" stroke="#000"/><circle cx="12" cy="18" r="5" fill="#e10600"/><circle cx="21" cy="12" r="9" fill="#0064d2" stroke="#000"/><path d="M17 12h8M21 8v8" stroke="#fff" stroke-width="2"/><circle cx="22" cy="24" r="7" fill="#999" stroke="#000"/><text x="22" y="27" text-anchor="middle" font-size="7" font-family="Arial" font-weight="bold">KO</text>`), 'My whole POG collection!!! Over 200 pogs, three slammers (one is metal, it is DEADLY), and the official tin. Nobody plays POGs anymore so I am selling them to buy Pokemon cards. Mom says I will regret this. Mom said that about the yo-yo too.'],
    ['y2ktin', 'Y2K SURVIVAL TIN - beans, candle, wind-up torch + more', 'y2k', 250, 900, 'millennium_gaz', 99, 'An underground bunker (the garage)', sv(`${P(6, 8, 20, 20, '#9a9a9a')}${P(6, 8, 20, 3, '#c8c8c8')}${P(9, 14, 14, 10, '#ffd400')}<text x="16" y="21.5" text-anchor="middle" font-size="6" font-family="Arial Black,Arial" font-weight="bold">Y2K</text>`), 'Everything you need for the Millennium Bug: 4 tins of beans, 1 candle, 1 wind-up torch, a whistle, a printed copy of the Internet (the bits I like) and a floppy disk of all my saved games. Tin opener NOT included (I need it).'],
    ['furby', 'Talking Owl-Hamster Toy that will NOT go to sleep', 'toys', 300, 700, Cast.t('cousin_{cousin.slug}'), 41, 'The garage (it lives there now)', ES.pix(['..k......k..', '..kk....kk..', '..vvvvvvvv..', '.vvvvvvvvvv.', '.vwwvvvvwwv.', '.vwkvvvvkwv.', '.vvvvyyvvvv.', '.vvvvyyvvvv.', '.vvvvvvvvvv.', '..vvvvvvvv..', '..yy....yy..'], 1), 'It talks. All the time. In the night. It learnt to say "me love you" and "uh oh" and something that sounds like "Kevin". Batteries removed. STILL TALKS. Comes with earplugs. Please take it far away.'],
    ['beanie', 'Bean Bag Bear, TAG STILL ON, VERY RARE!!!', 'toys', 500, 800, 'beanz4ever', 230, 'A plastic box in a cupboard', ES.pix(['.nn....nn.', 'nNNnnnnNNn', '.nnnnnnnn.', '.nknnnnkn.', '.nnnNNnnn.', '..nnkknn..', '.rrrrrrrr.', 'nnnnnnnnnn', '.nnnnnnnn.', '.nn....nn.'], 1), 'Super rare bear. Tag protector on. Never played with, never looked at, never loved. My mom says these are an INVESTMENT. Only about four million of them were made, so hurry.'],
    ['tama', 'Pocket Virtual Pet (died 4 times, still works)', 'toys', 50, 420, 'snotty_nose', 7, 'Bottom of school bag', ES.pix(['...pppppp...', '..pppppppp..', '.pppppppppp.', '.ppsssssspp.', '.ppskskssppp', '.ppsssssspp.', '.ppssksssppp', '.pppppppppp.', '.ppykyppykp.', '..pppppppp..', '...pppppp...'], 1), 'Works fine. My pet died four times. Once in maths. Once in assembly (the beeping!!!). It is not my fault, they need feeding EVERY HOUR. Comes with a little grave I drew.'],
    ['floppies', 'Box of 10 Floppy Disks (8 work) + GOLDENEYE CHEATS.TXT', 'computers', 75, 360, 'megahertzmike', 402, 'Megahertz Mike\'s desk', sv(`${P(5, 5, 22, 22, '#222')}${P(9, 5, 14, 8, '#c8c8c8')}${P(18, 6, 3, 6, '#222')}${P(8, 16, 16, 9, '#fff')}<path d="M10 19h12M10 22h9" stroke="#00f"/>`), '1.44MB each. 8 out of 10 work. One of them has a file called GOLDENEYE CHEATS.TXT on it and I am NOT saying which one. Labels written in felt tip. One label says "DO NOT FORMAT". I formatted it.'],
    ['cds', '37 FREE Internet Trial CDs (great coasters)', 'computers', 10, 300, 'coaster_king', 1999, 'Every doormat in Britain', sv(`<circle cx="16" cy="16" r="12" fill="#d8d8f0" stroke="#000"/><circle cx="16" cy="16" r="12" fill="url(#gbcd)" opacity=".6"/><defs><linearGradient id="gbcd"><stop offset="0" stop-color="#f0f"/><stop offset=".5" stop-color="#0ff"/><stop offset="1" stop-color="#ff0"/></linearGradient></defs><circle cx="16" cy="16" r="3" fill="#fff" stroke="#000"/>`), 'They come through the door every week. I have 37. Each one says FREE HOURS. I have never used one. They make excellent coasters, frisbees and bird scarers. Postage will cost more than the item.'],
    ['saber', 'Lightsaber (wrapping paper tube, red felt tip, HUMS*)', 'scifi', 120, 480, 'jackattack_99', 77, 'The airing cupboard', sv(`<path d="M6 26L22 10" stroke="#e10600" stroke-width="5" stroke-linecap="round"/><path d="M22 10l5-5" stroke="#777" stroke-width="5"/>`), 'Genuine home-made lightsaber. Red felt tip all the way round. Handle drawn on in biro. *The humming is done by you. Has been in TWO duels (one won, one "a draw" according to Dave).'],
    ['ram', '4MB RAM Stick (72-pin SIMM), Still Warm', 'computers', 200, 540, 'megabyte_matt', 650, 'Inside a beige box', sv(`${P(2, 11, 28, 10, '#0a6a2a')}${[4, 9, 14, 19, 24].map(x => P(x, 13, 4, 5, '#111')).join('')}${P(2, 21, 28, 2, '#d4a000')}`), 'Took it out of my old computer when I upgraded to 32MB. It was very warm. It is now less warm. Works (probably). Will make your old PC almost 1% faster.'],
    ['modem', '14.4K Modem (makes THE NOISE, noise included)', 'computers', 100, 420, 'bbs_bob', 88, 'Under the stairs', sv(`${P(4, 12, 24, 10, '#e8e0c8')}${P(4, 20, 24, 2, '#888')}${[7, 10, 13, 16].map((x, i) => P(x, 15, 2, 2, i % 2 ? '#0f0' : '#f00')).join('')}<text x="24" y="18.5" text-anchor="middle" font-size="4" font-family="Arial">14.4</text>`), 'Goes EEEEE-KRRRR-BONG-BONG-SHHHHHH every time. Connects at 14,400 bits a second on a good day. Takes 20 minutes to load a picture of a cat. Comes with the noise, at no extra charge.'],
    ['gameboy', 'Original Grey Brick Handheld (crack shaped like a duck)', 'games', 400, 720, 'tetris_tim', 150, 'My coat pocket', ES.pix(['.ssssssss.', '.sSSSSSSs.', '.sSddddSs.', '.sSdlldSs.', '.sSddddSs.', '.sSSSSSSs.', '.ssssssss.', '.sk..s.ps.', '.kkk.spps.', '.sk..s..s.', '.ssssssss.', '..s.s.....'], 1), 'Plays Tetris. Plays Tetris very well. Screen has a crack in it shaped like a duck, which actually helps with the long pieces. Needs 4 AA batteries. Does not need sleep. Neither will you.'],
    ['dcbox', 'EMPTY Dreamcast Box (no console inside) (I\'m still saving)', 'games', 20, 600, 'saving_up_sam', 23, 'On top of my wardrobe', sv(`${P(6, 6, 20, 22, '#fff')}<path d="M6 6h20v22H6z" fill="none" stroke="#000"/><circle cx="16" cy="15" r="5" fill="none" stroke="#f60" stroke-width="2"/><path d="M14 13c2-1 4 0 4 2" stroke="#f60" fill="none"/><text x="16" y="25" text-anchor="middle" font-size="3.5" font-family="Arial">EMPTY</text>`), 'The box is real. The box is lovely. The box smells new. There is nothing inside the box because my cousin has the Dreamcast and I have the box. Selling to raise money to buy a Dreamcast to put in a box.'],
    ['toof', 'Bits Box: 300 Spare Model Bits (mostly arms)', 'orks', 30, 360, 'paintbrush_pete', 5, 'Under my bed', sv(`${P(4, 14, 24, 14, '#b08a60')}${P(4, 12, 24, 3, '#d8b080')}${P(7, 8, 3, 6, '#3a9a2a')}${P(13, 8, 4, 4, '#888')}<circle cx="21" cy="10" r="3" fill="#222" stroke="#888"/>${P(25, 9, 2, 5, '#2a5ad8')}<text x="16" y="24" text-anchor="middle" font-size="7" font-family="Arial" font-weight="bold">BITS</text>`), 'My whole bits box from painting Warhammer minis and Airfix kits. About 300 spare bits: arms, heads, shields, three tank wheels and a Space Marine backpack. One Ork head is glued to a Spitfire. I do not know why. Buyer collects. Smells of polystyrene cement.'],
    ['tape', Cast.t("{cousin}'s Top 40 Mixtape (taped off the radio, DJ talks over every song)"), 'music', 80, 480, Cast.t('cousin_{cousin.slug}'), 41, Cast.t('{cousin}\'s bedroom'), sv(`${P(3, 8, 26, 16, '#222')}${P(6, 10, 20, 7, '#fff')}<circle cx="11" cy="20" r="3" fill="#fff"/><circle cx="21" cy="20" r="3" fill="#fff"/><text x="16" y="15.5" text-anchor="middle" font-size="4.5" font-family="Comic Sans MS,cursive" fill="#c00"${Cast.n('cousin').length > 5 ? ' textLength="19" lengthAdjust="spacingAndGlyphs"' : ''}>${Cast.t('{cousin.NAME}')}S MIX</text>`), 'All the best songs from the Sunday chart!!! Every single song has the DJ talking over the start AND the end. One song is cut off because Mom shouted "TEA IS READY". Side B is mostly adverts. 10/10.'],
    ['ufo', 'Real Photo of a UFO (it is a frisbee) (or IS it)', 'weird', 60, 540, 'custard_files', 13, 'Classified', sv(`${P(0, 0, 32, 32, '#9ad0ff')}<ellipse cx="16" cy="14" rx="10" ry="3.5" fill="#888" stroke="#000"/><ellipse cx="16" cy="12" rx="5" ry="3" fill="#cfe" stroke="#000"/>${P(0, 26, 32, 6, '#3a9a2a')}<path d="M24 26l1-6 1 6" stroke="#000" fill="none"/>`), 'Taken in our back garden at 4:15pm. It is DEFINITELY a UFO and NOT my brother\'s frisbee, which went missing at exactly 4:14pm. Slightly blurry because of the alien energy (and because I was running).'],
    ['mousemat', 'HAUNTED Mouse Mat (mouse moves by itself)', 'weird', 45, 420, 'spooky_steve', 66, 'A desk on a slope', sv(`${P(4, 8, 24, 18, '#2a2a6a')}<path d="M8 22c4-10 12-10 16 0" stroke="#fff" fill="none" stroke-dasharray="2 2"/><ellipse cx="21" cy="13" rx="3" ry="4.5" fill="#e8e8e8" stroke="#000"/><path d="M21 8.5V5c0-2 3-2 3 0" stroke="#000" fill="none"/>`), 'The mouse moves on its own. At night. When nobody is looking. (Also during the day, when the desk is on a slope, which it is.) Comes with ghost (ghost may not be included).'],
    ['invisible', 'INVISIBLE Pet Alien (comes in box)', 'pets', 5, 300, 'kev_the_seller', 1, 'In the box (honest)', sv(`${P(6, 12, 20, 14, '#c8a060')}<path d="M6 12l5-5h20l-5 5" fill="#e8c080" stroke="#000"/><path d="M6 12h20v14H6z" fill="none" stroke="#000"/><text x="16" y="21" text-anchor="middle" font-size="7" font-family="Arial">?</text>`), 'Very rare invisible alien (my uncle got it in Roswell). You cannot see it, which proves it is invisible. Box is NOT empty, it just looks empty. Feed it invisible food. If it bites you, you will not see it coming.'],
    ['gecart', 'GoldenEye 007 Cartridge (N64, no box, label a bit chewed)', 'games', 800, 660, 'luke_n64', 64, 'Luke\'s bedroom', sv(`<path d="M6 6h20v18l-2 3H8l-2-3z" fill="#9a9a9a" stroke="#000"/>${P(9, 8, 14, 11, '#c8a000')}<text x="16" y="15.5" text-anchor="middle" font-size="6" font-family="Arial" font-weight="bold">007</text>${P(10, 24, 12, 2, '#555')}`), 'Proper N64 GoldenEye. Works if you blow on it. (Everyone says do not blow on it. Everyone blows on it.) My save is still on it: Facility on 00 Agent DONE. Comes with the multiplayer rules written on a napkin. Rule 1: No Oddjob.'],
    ['bobafett', 'Boba Fett Figure, STILL ON THE CARD (never opened!!!)', 'scifi', 400, 720, 'kenner_ken', 310, 'A shelf nobody is allowed to touch', sv(`${P(7, 3, 18, 26, '#1a1a3a')}${P(9, 5, 14, 2, '#ffd400')}<rect x="10" y="9" width="12" height="17" rx="2" fill="#d8e8f0" stroke="#888"/>${P(14, 10, 4, 4, '#3a6a3a')}${P(14, 12, 4, 1, '#000')}${P(13, 14, 6, 7, '#6a7a4a')}${P(13, 21, 2, 4, '#8a8a6a')}${P(17, 21, 2, 4, '#8a8a6a')}`), 'Mint on card. MINT. ON. CARD. I have never opened it and I never will. I am only selling because I bought a second one to open, and now I have opened it, and it was brilliant. Serious collectors only. No timewasters. No Jawas.'],
    ['lego', 'LEGO Space Base: 98% of the bricks + the instructions', 'toys', 300, 600, 'brick_boy', 45, 'A big tub under the bed', sv(`${P(4, 18, 24, 6, '#2a5ad8')}${P(10, 13, 12, 5, '#c8c8c8')}${P(13, 10, 6, 3, '#ffd400')}${P(1, 21, 4, 3, '#c8c8c8')}${P(27, 21, 4, 3, '#c8c8c8')}${[6, 10, 14, 18, 22].map(x => P(x, 17, 2, 1, '#4a7af8')).join('')}${P(14, 24, 4, 4, '#e10600')}`), 'All the bricks except one blue 2x4 (the Hoover took it). Instructions slightly ripped on page 12 but you can work it out. Two spacemen included, one with a cracked helmet (he has seen things). Treading on a piece in the night is at your own risk.'],
    ['scalex', 'Scalextric Figure-of-Eight (one car works, one car flies)', 'toys', 250, 540, 'scalextric_nutter', 29, 'The landing', sv(`<path d="M6 16c0-7 10-7 10 0s10 7 10 0-10-7-10 0-10 7-10 0z" fill="none" stroke="#333" stroke-width="5"/><path d="M6 16c0-7 10-7 10 0s10 7 10 0-10-7-10 0-10 7-10 0z" fill="none" stroke="#fff" stroke-width=".6" stroke-dasharray="2 2"/>${P(7, 10, 4, 2, '#e10600')}${P(23, 20, 4, 2, '#2a5ad8')}`), 'Figure-of-eight track, two cars, two controllers. The red car is brilliant. The blue car comes off at the first corner every single time and goes under the radiator. Includes the bit of track Dad stood on (still works, a bit bumpy).'],
  ].map(r => ({ id: r[0], name: r[1], cat: r[2], start: r[3], dur: r[4], seller: r[5], fb: r[6], loc: r[7], pic: r[8], desc: r[9] }));
  const BYID = {}; ITEMS.forEach(i => { BYID[i.id] = i; });
  const CATS = { toys: 'Toys & Crazes', computers: 'Computers', games: 'Video Games', scifi: 'Sci-Fi', pets: 'Pets (?)', music: 'Music', y2k: 'Y2K Supplies', orks: 'Hobby & Models', weird: 'Weird Stuff' };
  const FAKE = ['pikaluvr99', 'dreamcast_dave', 'beanie_baron', 'sn1per_bob', 'mom_of_3', 'scalextric_nutter', 'pog_champ', 'gubbinz', 'bidz4fun', 'nan_online', 'xX_sonic_Xx', 'tiddles_owner', 'fragwise', 'cubeboy'];

  // ================================================================ the auction clock (same for everybody)
  const OFF = 137; // seconds, so rounds don't all end on the minute
  const now = () => Date.now() / 1000;
  const roundOf = (it, t) => Math.floor(((t == null ? now() : t) + OFF + ES.hash(it.id) % it.dur) / it.dur);
  const endOf = (it, r) => (r + 1) * it.dur - OFF - ES.hash(it.id) % it.dur;
  const incOf = p => p < 100 ? 5 : p < 500 ? 25 : p < 2500 ? 50 : 100;
  const money = p => '&pound;' + (p / 100).toFixed(2);
  const left = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return s <= 0 ? 'Ended' : h ? `${h}h ${m}m` : m ? `${m}m ${x}s` : `${x}s`; };
  const key = it => 'eras.bay.' + it.id;
  // the computer bidders for one round: [{t, by, max}] (all visitors get the same list)
  function fakes(it, r) {
    const R = ES.rng(it.id + ':' + r), st = endOf(it, r) - it.dur, out = [], n = 2 + Math.floor(R() * 5), val = it.start * (2 + R() * 5);
    for (let i = 0; i < n; i++) out.push({ t: st + it.dur * (0.08 + 0.8 * R()), by: FAKE[Math.floor(R() * FAKE.length)], max: Math.round(it.start + (val - it.start) * (0.3 + 0.7 * R())) });
    if (R() < 0.45) out.push({ t: endOf(it, r) - 2 - R() * 5, by: 'sn1per_bob', max: Math.round(val * (1.05 + R() * 0.3)), snipe: 1 });
    return out.sort((a, b) => a.t - b.t);
  }
  // replay a round: returns { high, by, bids: [{t, by, amt, me}] }
  function state(it, r, live, upto) {
    const T = upto == null ? now() : upto, end = endOf(it, r);
    const ev = fakes(it, r).filter(f => f.t <= Math.min(T, end)).map(f => ({ t: f.t, by: f.by, max: f.max, fake: 1, snipe: f.snipe }));
    (live || []).forEach(e => { const m = /^(\d+)\|(\d+)$/.exec(e.text || ''); if (m && +m[1] === r && e.ts / 1000 <= end + 3) ev.push({ t: e.ts / 1000, by: e.by, max: +m[2], member: e.member }); });
    ev.sort((a, b) => a.t - b.t);
    let high = it.start, by = null; const bids = [];
    for (const e of ev) {
      const need = by ? high + incOf(high) : high;
      if (e.fake) { if (e.max >= need && e.by !== by) { high = need; by = e.by; bids.push({ t: e.t, by: e.by, amt: high, snipe: e.snipe }); } }
      else if (e.max >= need && e.max <= 999900) { high = e.max; by = e.by; bids.push({ t: e.t, by: e.by, amt: high, real: 1 }); }
    }
    return { high, by, bids, end };
  }
  const myNick = () => (window.Net && Net.me && Net.me.nick) || '';
  const STAR = n => { const c = n >= 1000 ? '#e10600' : n >= 500 ? '#8a2ac8' : n >= 100 ? '#1abcbc' : n >= 50 ? '#2a5ad8' : n >= 10 ? '#ffd400' : ''; return c ? `<svg class="gb-star" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .8l2.2 4.6 5 .6-3.7 3.5 1 5L8 12l-4.5 2.5 1-5L.8 6l5-.6z" fill="${c}" stroke="#000" stroke-width=".7"/></svg>` : ''; };
  const seller = it => `<b>${esc(it.seller)}</b> (<a href="${U('/feedback.html')}">${it.fb}</a>) ${STAR(it.fb)}`;
  // what you've bid on and won (this browser only)
  const mine = () => store.get('jhp_eras_bay', { bids: {}, won: [] });
  const saveMine = m => store.set('jhp_eras_bay', m);

  // ================================================================ furniture
  const head = c => `<div class="gb-top"><a class="gb-logo" href="${U('/')}"><span>j</span><span>a</span><span>c</span><span>k</span><span style="color:#e53238">b</span><span style="color:#0064d2">a</span><span style="color:#f5af02">y</span><small>The World's Online Marketplace&trade;</small></a>
    <div class="gb-nav"><a href="${U('/')}">browse</a><a href="${U('/sell.html')}">sell</a><a href="${U('/mybay.html')}">my jackbay</a><a href="${U('/feedback.html')}">community</a><a href="${U('/help.html')}">help</a></div></div>
    <form class="gb-srch" action="#"><label>Search <input type="text" class="gb-q" placeholder="e.g. pokemon" aria-label="Search auctions"></label><button class="es-btn" type="submit">Find it!</button><span>${ITEMS.length} items for sale right now &middot; PRETEND money only</span></form>`;
  const page = (c, main, cats) => `<div class="gb">${head(c)}<div class="gb-wrap">${cats === false ? '' : `<div class="gb-cats"><h4>Categories</h4><ul>${Object.keys(CATS).map(k => `<li><a href="${U('/')}" data-gbcat="${k}">${CATS[k]}</a> (${ITEMS.filter(i => i.cat === k).length})</li>`).join('')}</ul><h4>JackBay Tips</h4><ul><li>Never send cash in the post.</li><li>"Slightly used" means the dog had a go.</li><li><a href="${U('/help.html')}">What is sniping?</a></li><li><a href="http://www.winbig.w3b/">You have WON!!!</a> (have you?)</li></ul></div>`}<div class="gb-main">${main}</div></div>${c.foot({ ctrText: 'Auctions viewed:', ctrAfter: '', ctr: 'red', best: 'Best viewed in <b>800x600</b>. Bid responsibly.', copy: 'JackBay is pretend. No real money, Rupees or Pokemon cards ever change hands. Mom checked. &copy; 1999 JackBay Inc. (a kid with a clipboard)' })}</div>`;

  function listRows(c, filter) {
    return ITEMS.filter(filter || (() => true)).map(it => `<tr data-id="${it.id}"><td class="pic"><a href="${U('/item/' + it.id + '.html')}" class="gb-pic">${it.pic}</a></td><td><a href="${U('/item/' + it.id + '.html')}">${esc(it.name)}</a><span class="gb-hot" hidden>HOT!</span><br><small class="hide">${esc(CATS[it.cat])} &middot; seller ${esc(it.seller)} ${STAR(it.fb)}</small></td><td class="pr">-</td><td class="bd hide">-</td><td class="tl">-</td></tr>`).join('');
  }
  function liveTable(c, tbody) {
    const lives = {};
    const draw = () => {
      const t = now();
      tbody.querySelectorAll('tr[data-id]').forEach(tr => {
        const it = BYID[tr.dataset.id], r = roundOf(it, t), s = state(it, r, lives[it.id], t), rem = s.end - t;
        tr.querySelector('.pr').innerHTML = money(s.high);
        tr.querySelector('.bd').textContent = s.bids.length;
        const tl = tr.querySelector('.tl'); tl.textContent = left(rem); tl.className = 'tl' + (rem < 60 ? ' gb-soon' : '');
        tr.querySelector('.gb-hot').hidden = s.bids.length < 5;
        tr.dataset.rem = rem;
      });
      // ending soonest at the top, like the real thing
      const rows = [...tbody.querySelectorAll('tr[data-id]')], sorted = rows.slice().sort((a, b) => a.dataset.rem - b.dataset.rem);
      if (sorted.some((r, i) => r !== rows[i])) sorted.forEach(r => tbody.appendChild(r));
      checkWins(c, lives);
    };
    const ids = [...tbody.querySelectorAll('tr[data-id]')].map(tr => tr.dataset.id);
    c.get(ids.map(id => 'eras.bay.' + id)).then(v => { ids.forEach(id => { const l = v['eras.bay.' + id]; lives[id] = Array.isArray(l) ? l : []; }); draw(); });
    ids.forEach(id => c.watch('eras.bay.' + id, ev => { if (ev.type === 'push') { (lives[id] = lives[id] || []).push(ev.e); draw(); } }));
    draw(); c.every(draw, 1000);
  }
  // you won? (checked on any JackBay page for rounds you bid in that have ended)
  function checkWins(c, lives) {
    const m = mine(), t = now(); let ch = false;
    for (const k of Object.keys(m.bids)) {
      const [id, r] = k.split(':'), it = BYID[id]; if (!it || !lives[id]) continue;
      if (endOf(it, +r) > t - 2) continue;
      const s = state(it, +r, lives[id], endOf(it, +r) + 5);
      delete m.bids[k]; ch = true;
      if (s.by && s.by === myNick()) {
        m.won.unshift({ id, p: s.high, d: ES.tsDate() }); m.won = m.won.slice(0, 30);
        c.secret('eras.baywin'); c.sfx('solve');
        Desk.msgbox('JackBay - You Won!', `CONGRATULATIONS!!! You won "${it.name}" for ${(s.high / 100).toFixed(2)} pretend pounds!\n\nThe seller (${it.seller}) will post it to you second class. It will never arrive, because it is pretend.\n\nPlease leave feedback!`, 'info');
      } else if (s.by) {
        const wasSniped = s.bids.length && s.bids[s.bids.length - 1].snipe;
        c.toast('JackBay', wasSniped ? `You were SNIPED on "${it.name}" by ${s.by} in the last few seconds! Classic.` : `The auction for "${it.name}" has ended. ${s.by} won it for ${(s.high / 100).toFixed(2)}.`, 7000);
      }
    }
    if (ch) saveMine(m);
  }

  // ================================================================ pages
  ES.def(H, '/', c => {
    c.after.push(() => {
      const tb = c.q('.gb-tab tbody'); liveTable(c, tb);
      const filt = f => tb.querySelectorAll('tr[data-id]').forEach(tr => { tr.hidden = !f(BYID[tr.dataset.id]); });
      c.on('.gb-srch', 'submit', ev => { ev.preventDefault(); const q = c.q('.gb-q').value.trim().toLowerCase(); filt(it => !q || (it.name + ' ' + it.desc).toLowerCase().includes(q)); c.q('.gb-ttl').textContent = q ? `Search results for "${q}"` : 'All Auctions'; });
      c.el.addEventListener('click', ev => { const a = ev.target.closest('[data-gbcat]'); if (!a) return; ev.preventDefault(); ev.stopPropagation(); filt(it => it.cat === a.dataset.gbcat); c.q('.gb-ttl').textContent = CATS[a.dataset.gbcat]; }, true);
    });
    return page(c, `<div style="background:#fffbe0;border:1px solid #ffcc00;padding:6px 8px;margin-bottom:8px;font-size:12px"><b>Welcome to JackBay!</b> Every auction here is LIVE: everybody on JackNet sees the same bids at the same time. When an auction ends, the seller lists it again (they have loads). <b>Bids are in pretend money.</b></div>
      <h2 class="gb-ttl" style="margin:4px 0;font:bold 18px Arial">All Auctions</h2><table class="gb-tab"><thead><tr><th class="pic">Picture</th><th>Item</th><th>Price</th><th class="hide">Bids</th><th>Time Left</th></tr></thead><tbody>${listRows(c)}</tbody></table>`);
  });

  ES.def(H, /^\/item\//, c => {
    const id = c.path.replace(/^\/item\/|\.html$/g, ''), it = BYID[id];
    if (!it) return page(c, '<h2>Item not found</h2><p>This item has been removed. (The dog ate the listing.)</p>');
    c.after.push(() => wireItem(c, it));
    return page(c, `<div class="gb-item gb-big"><div><span class="gb-pic">${it.pic}</span><br><small>(click to enlarge) (it does not enlarge)</small></div>
      <div class="gb-det"><h2 style="margin:0 0 6px;font:bold 18px Arial">${esc(it.name)}</h2><div style="font-size:11px;margin-bottom:6px">Item #${(ES.hash(it.id) % 90000000 + 10000000)} &middot; ${esc(CATS[it.cat])}</div>
      <table><tr><td>Current bid</td><td class="gb-cur" style="font-size:15px;font-weight:bold">-</td></tr><tr><td>Quantity</td><td>1</td></tr><tr><td># of bids</td><td class="gb-n">0</td></tr><tr><td>Time left</td><td class="gb-left">-</td></tr><tr><td>Started</td><td class="gb-st">-</td></tr><tr><td>Location</td><td>${esc(it.loc)}</td></tr><tr><td>Seller</td><td>${seller(it)}</td></tr><tr><td>High bidder</td><td class="gb-hb">-</td></tr><tr><td>Postage</td><td>Second class. Buyer pays. Pets collect only.</td></tr></table>
      <form class="gb-bid" autocomplete="off"><b>Bidding</b><br>Minimum bid: <b class="gb-min">-</b><br><label>Your maximum bid: &pound;<input type="text" inputmode="decimal" class="gb-amt" aria-label="Your bid in pounds"></label> <button class="es-btn" type="submit">Review bid</button><div class="gb-msg" aria-live="polite"></div><small>Bidding as <b>${esc(myNick() || 'Guest')}</b>. Pretend money only.</small>${window.Guest && Guest.is() ? Guest.badge('Members bid') : ''}</form></div></div>
      <div class="gb-desc"><h3>Description</h3>${esc(it.desc)}<p style="font-size:11px;color:#666">Seller added: <i>${['Thanks for looking!!!', 'NO TIME WASTERS', 'smoke free home (mostly dog free)', 'Happy bidding!', 'A++++ seller, check my feedback'][ES.hash(it.id) % 5]}</i></p></div>
      <h3 style="margin:8px 0 2px">Bid History</h3><table class="gb-hist"><thead><tr><th>Bidder</th><th>Bid</th><th>Time</th></tr></thead><tbody></tbody></table>
      <p><a href="${U('/')}">&lt;&lt; Back to all auctions</a></p>`);
  });
  function wireItem(c, it) {
    let live = [];
    const draw = () => {
      const t = now(), r = roundOf(it, t), s = state(it, r, live, t), rem = s.end - t;
      c.q('.gb-cur').innerHTML = money(s.high) + (s.bids.length ? '' : ' (starting bid)');
      c.q('.gb-n').textContent = s.bids.length;
      const lf = c.q('.gb-left'); lf.textContent = left(rem) + (rem < 60 && rem > 0 ? '  ENDING SOON!' : ''); lf.className = 'gb-left' + (rem < 60 ? ' gb-soon' : '');
      c.q('.gb-st').textContent = ES.tsDate((s.end - it.dur) * 1000) + ' ' + ES.tsTime((s.end - it.dur) * 1000);
      c.q('.gb-hb').innerHTML = s.by ? esc(s.by) + (s.by === myNick() ? ' <b style="color:#008000">(YOU!)</b>' : '') : '<i>no bids yet</i>';
      c.q('.gb-min').innerHTML = money(s.by ? s.high + incOf(s.high) : s.high);
      c.q('.gb-hist tbody').innerHTML = s.bids.slice().reverse().map(b => `<tr${b.by === myNick() ? ' class="me"' : ''}><td>${esc(b.by)}${b.snipe ? ' <span class="gb-hot">SNIPE</span>' : ''}</td><td>${money(b.amt)}</td><td>${ES.tsTime(b.t * 1000)}:${ES.pad(Math.floor(b.t) % 60)}</td></tr>`).join('') || '<tr><td colspan="3"><i>No bids yet. Be the first!</i></td></tr>';
      checkWins(c, { [it.id]: live });
    };
    c.get([key(it)]).then(v => { live = Array.isArray(v[key(it)]) ? v[key(it)] : []; draw(); });
    c.watch(key(it), ev => { if (ev.type === 'push') { live.push(ev.e); draw(); if (ev.e.by !== myNick()) c.sfx('click'); } });
    draw(); c.every(draw, 1000);
    c.on('.gb-bid', 'submit', ev => {
      ev.preventDefault();
      if (window.Guest && Guest.is()) return Guest.need('Bidding on JackBay', () => { const f = c.q('.gb-bid'); if (f && c.el.isConnected) f.requestSubmit(); }); // (bids need a name that stays put)
      const msg = c.q('.gb-msg'), raw = c.q('.gb-amt').value.replace(/[£,\s]/g, ''), amt = Math.round(parseFloat(raw) * 100);
      const t = now(), r = roundOf(it, t), s = state(it, r, live, t), need = s.by ? s.high + incOf(s.high) : s.high;
      if (!myNick()) { msg.textContent = 'You need to be on JackNet to bid.'; return; }
      if (!(amt > 0)) { msg.textContent = 'Please type a bid, like 2.50'; return; }
      if (amt > 999900) { msg.textContent = 'Whoa! The maximum bid is £9,999. Even for a holo Charizard.'; return; }
      if (amt < need) { msg.innerHTML = `Your bid must be at least ${money(need)}.`; c.sfx('uhoh'); return; }
      if (s.by === myNick()) { msg.textContent = 'You are already the high bidder! Bidding against yourself is very generous, though.'; return; }
      Desk.msgbox('Review and Confirm Bid', `Item: ${it.name}\nYour bid: £${(amt / 100).toFixed(2)} (pretend money)\n\nBy clicking Place Bid you promise to pay the seller if you win. (You won't, because it's pretend.)`, 'q', [['Place Bid', () => {
        if (!c.push(key(it), roundOf(it) + '|' + amt)) { msg.textContent = 'Not connected to JackNet. Try again in a minute!'; return; }
        const m = mine(); m.bids[it.id + ':' + roundOf(it)] = 1; saveMine(m);
        msg.textContent = 'Bid placed! Watch the clock...'; c.sfx('pet'); c.secret('eras.bid'); c.q('.gb-amt').value = '';
        if (endOf(it, roundOf(it)) - now() < 10) { c.secret('eras.snipe'); c.toast('JackBay', 'SNIPE! Bidding in the last 10 seconds: sneaky. Very 1999.', 5000); }
      }], ['Cancel']]);
    });
  }

  ES.def(H, '/mybay.html', c => {
    const m = mine();
    c.after.push(() => { const tb = c.q('.gb-tab tbody'); if (tb) liveTable(c, tb); });
    const ids = [...new Set(Object.keys(m.bids).map(k => k.split(':')[0]))].filter(i => BYID[i]);
    return page(c, `<h2 style="margin-top:0">My JackBay: ${esc(myNick() || 'Guest')}</h2><h3>Items I'm Bidding On</h3>${ids.length ? `<table class="gb-tab"><thead><tr><th class="pic">Picture</th><th>Item</th><th>Price</th><th class="hide">Bids</th><th>Time Left</th></tr></thead><tbody>${listRows(c, it => ids.includes(it.id))}</tbody></table>` : '<p>You are not bidding on anything. <a href="' + U('/') + '">Go and find a bargain!</a></p>'}
      <h3>Items I've Won</h3>${m.won.length ? '<ul>' + m.won.map(w => `<li><b>${esc((BYID[w.id] || {}).name || w.id)}</b> for ${money(w.p)} on ${esc(w.d)} <small>(awaiting delivery since forever)</small></li>`).join('') + '</ul>' : '<p>Nothing yet. Keep bidding!</p>'}
      <p style="font-size:11px">Your bids and wins are remembered by this computer only.</p>`);
  });

  const FB = [['dave_kool_page', 'pos', 'A+++++ GREAT JACKBAYER, POGS ARRIVED, ONE WAS A BOTTLE TOP'], ['mom_of_3', 'pos', 'Item as described. Fast postage. Bear is lovely.'], ['pikaluvr99', 'neg', 'Card arrived. Card was a Pikachu drawn in biro. Nice drawing though.'], ['coaster_king', 'neu', 'Received 37 CDs. I now have 74 CDs. Please stop.'], ['nan_online', 'pos', 'LOVELY TRANSACTION. HOW DO I TURN OFF THE CAPITALS.'], ['sn1per_bob', 'pos', 'won in the last 2 seconds. sorry not sorry. A+'], ['gubbinz', 'neu', 'got the box. the box is empty. or IS it. A+'], ['scalextric_nutter', 'pos', 'Track arrived. Car now goes faster. Straight off the table. Would bid again.']];
  ES.def(H, '/feedback.html', c => {
    const cls = { pos: ['gb-pos', 'Praise'], neu: ['gb-neu', 'Neutral'], neg: ['gb-neg', 'Complaint'] };
    return page(c, `<h2 style="margin-top:0">Feedback Forum</h2><p>Feedback is how JackBay works: after every auction, buyers and sellers leave each other a comment. Get 10 good ones and you get a <b>yellow star</b> ${STAR(10)}. 50 gets you blue ${STAR(50)}, 100 turquoise ${STAR(100)}, 500 purple ${STAR(500)} and 1,000 a red one ${STAR(1000)}.</p>
      <h3>Top Sellers</h3><ul class="gb-fb">${ITEMS.slice().sort((a, b) => b.fb - a.fb).filter((x, i, l) => l.findIndex(y => y.seller === x.seller) === i).slice(0, 8).map(it => `<li>${seller(it)}</li>`).join('')}</ul>
      <h3>Recent Feedback</h3><ul class="gb-fb">${FB.map(([w, k, t]) => `<li><span class="${cls[k][0]}">${cls[k][1]}:</span> ${esc(t)} <small>from ${esc(w)}</small></li>`).join('')}</ul>` +
      c.gb([['A++++ JackBayer', '02/10/99', 'Everything went brilliantly. Would trade Pokemon cards again.'], ['beanie_baron', '28/09/99', 'Still waiting for my bear. It is fine. I am patient. I am not patient.']], { k: 'eras.bay.fb', title: 'Leave Feedback for the Whole Community', btn: 'Leave Feedback', ph: 'e.g. A+++++ would bid again!!!', thanks: 'Feedback left! A+++' }));
  });
  ES.def(H, '/help.html', c => page(c, `<h2 style="margin-top:0">Help &amp; Safety</h2>
    <h3>How does bidding work?</h3><p>Type the most you want to pay. If nobody bids more before the clock runs out, you win! Each new bid has to beat the last one by a little bit (the "increment"). Bids are in <b>pretend money</b>.</p>
    <h3>What is sniping?</h3><p>Sniping is when somebody waits until the very last seconds of an auction and then bids, so nobody has time to bid back. Our most famous sniper is <b>sn1per_bob</b>. Nobody has ever seen sn1per_bob. Nobody knows how he does it. He has a lot of Pokemon cards.</p>
    <h3>What does "slightly used" mean?</h3><p>It means bitten.</p>
    <h3>Safety tips</h3><ul><li>Never give anyone your real name, address or school.</li><li>Never send real money to anybody you meet on the Internet. (JackBay is pretend, so it is extra easy.)</li><li>If a deal sounds too good to be true (a Dreamcast for 50p), it is an empty box.</li><li>Ask a grown-up before you buy anything online. Ever.</li></ul>
    <p><a href="http://www.jackdot.jnet/">Jackdot</a> &middot; <a href="http://www.rupeeshop.jnet/">The Rupee Emporium</a> (real Rupees!) &middot; <a href="http://www.winbig.w3b/">Have you won?</a></p>`));
  // selling is for JackNet members: a guest's listing waits behind the members-only box (and goes up if they join)
  const sellGate = c => { const fn = ev => { if (!(window.Guest && Guest.is()) || !ev.target.closest('.es-gb')) return; ev.preventDefault(); ev.stopImmediatePropagation(); const f = ev.target; Guest.need('Selling on JackBay', () => { if (f.isConnected) f.requestSubmit(); }); }; c.el.addEventListener('submit', fn, true); c.off(() => c.el.removeEventListener('submit', fn, true)); return ''; };
  ES.def(H, '/sell.html', c => page(c, `<h2 style="margin-top:0">Sell Your Item</h2><p>Got something to sell? Describe it below and it goes up on the <b>Sellers' Corner</b> board for everyone to see. (Real auctions are for our Gold Sellers only, which means kids with clipboards.)</p>${sellGate(c)}${window.Guest && Guest.is() ? Guest.webNote('Selling on JackBay') : ''}` +
    c.gb([['kev_the_seller', '11/10/99', 'FOR SALE: one (1) more invisible alien. Box very empty. I mean full.'], ['megahertzmike', '03/10/99', 'Swapping: a 2MB graphics card for anything with more MB.']], { k: 'eras.bay.sell', title: "Sellers' Corner (live)", btn: 'List my item!', ph: 'e.g. FOR SALE: one sock, worn once, the other one is under my bed', thanks: 'Listed! Good luck!' })));
})();
