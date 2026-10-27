/* ex-cat: the ECONOMY expansion catalogue (prefix ex). Shared by the server mod (mods/ex.js requires it) and the browser
 * (a plain script tag, so it's there before anything renders). Every number the server pays or charges is written down
 * here once.
 *   JackCards Series Two "Byte Beasties": 38 original creature cards (extra JackLoot items of type 'card', exclusives:
 *     they never drop at random, they come out of booster packs, the free starter deck and Card Clash prizes)
 *   BATTLE: Card Clash stats for every JackCard (Series Two beasts, and Series One as gadgets + a few characters)
 *   PACK / DECK / CPU: booster packs, deck rules, the computer players
 *   BAY: JackBay Rupee Auctions rules (fees, increments, anti-sniper rule)      TOWN: Jacktown Town Hall levels
 *   JOBS: four more Pocket Money jobs for the Odd Jobz Board / Mom's list        TOUR: The Mega Masters (weekly cup)
 *   EARN: our earn sources (added to econ's table, so caps, loot drops, missions and XP all ride on it)
 *   augment(LootCat): adds the cards, trophies, sets and missions to the JackLoot catalogue (server and browser alike) */
(function (root) {
  'use strict';
  // people in the browser come from the visitor's own cast (js/cast.js). The server has no cast: anything it shows everyone
  // (job names: J.n) names nobody, and the {templates} in browser-only text (who, blurb) are filled in by CT.
  const CT = s => (typeof Cast !== 'undefined' && Cast.t ? Cast.t(s) : s);
  if (typeof Cast !== 'undefined' && Cast.add) { Cast.add('nbrkid', { role: "Mrs Pemberton's grandson (the odd-job hamster)", g: 'm', pool: ['childF', 'childM'] }); Cast.add('nbrpet', { role: "Mrs Pemberton's grandson's runaway hamster", pool: ['smallF', 'smallM'] }); }
  // ---------------------------------------------------------------- elements (each beats the next one round the ring)
  // Zap > Splash > Blaze > Clank > Sprout > Cosmic > Zap. +2 damage against the one you beat, -1 against the one that beats you.
  const EL = {
    zap: { n: 'Zap', col: '#ffd400', dk: '#6a5400', beats: 'splash', why: 'electricity and water do NOT mix' },
    splash: { n: 'Splash', col: '#2f80ee', dk: '#0a2a6a', beats: 'blaze', why: 'puts the fire out' },
    blaze: { n: 'Blaze', col: '#ff4a1a', dk: '#6a1000', beats: 'clank', why: 'melts metal' },
    clank: { n: 'Clank', col: '#9aa4b0', dk: '#30363e', beats: 'sprout', why: 'it is basically a lawnmower' },
    sprout: { n: 'Sprout', col: '#3ab03a', dk: '#0a4a10', beats: 'cosmic', why: 'aliens are allergic to sprouts' },
    cosmic: { n: 'Cosmic', col: '#9a3ae0', dk: '#2a0a4a', beats: 'zap', why: 'cosmic rays scramble computers' },
  };
  const EL_ORDER = ['zap', 'splash', 'blaze', 'clank', 'sprout', 'cosmic'];
  const elMod = (a, d) => (!a || !d ? 0 : EL[a] && EL[a].beats === d ? 2 : EL[d] && EL[d].beats === a ? -1 : 0);

  // ---------------------------------------------------------------- abilities
  const AB = {
    first: ['Speedy', 'Hits first. If it knocks out the beast in front of it, it takes no damage back.'],
    armour: ['Armour', 'Takes 1 less damage from every hit.'],
    pierce: ['Overflow', 'Damage left over after knocking out a beast goes through to the other player.'],
    spark: ['Spark', 'When it arrives: 1 damage to the beast opposite (or the other player if there isn\'t one).'],
    clever: ['Clever', 'When it arrives: draw a card.'],
    reach: ['Splash Hit', 'Also does 1 damage to the enemy beasts in the lanes either side.'],
    heal: ['Patch-Up', 'At the end of every round, you get 1 Hit Point back.'],
    grow: ['Grower', 'Gets +1 Attack at the end of every round it survives.'],
    cheer: ['Cheerleader', 'Your other beasts get +1 Attack while it is in play.'],
    hover: ['Hover', 'Flies over the beast in front of it and hits the other player (unless that beast hovers too).'],
    thorns: ['Spiky', 'Anything that hits it takes 1 damage back.'],
    leech: ['Snacker', 'Damage it does to the other player heals you the same amount.'],
    reborn: ['Reborn', 'The first time it is knocked out, it goes back into your hand instead.'],
  };

  // ---------------------------------------------------------------- JackCards Series Two: BYTE BEASTIES
  // [key, name, element, rarity, cost, attack, hp, ability, flavour, art, extra]
  // art: [body, colour, colour2, eyes, mouth, top, extra]  (drawn by js/ex-art.js; the server ignores it)
  const BEASTS = [
    ['voltbat', 'Voltbat', 'zap', 0, 1, 2, 1, '', 'Hangs upside down from the power lines. Lights up when it sneezes.', ['bird', '#ffd400', '#3a3a3a', 'two', 'fangs', 'ears', 'sparks']],
    ['sparkplug', 'Sparkplug', 'zap', 0, 2, 2, 2, 'spark', 'A tiny gremlin who lives in the back of the telly. Bzzt!', ['pear', '#ffe24a', '#e10600', 'angry', 'grin', 'antenna', 'sparks']],
    ['megahurtz', 'Megahurtz', 'zap', 1, 3, 3, 3, 'first', 'A hamster who ran so fast in its wheel that it turned into electricity.', ['ball', '#f0c070', '#ffd400', 'two', 'teeth', 'ears', 'wheel']],
    ['modemouse', 'Modemouse', 'zap', 1, 2, 1, 3, 'clever', 'Squeaks at 56K. EEEE-DOO-KSSSHHH. Knows the way to every web site.', ['bean', '#b8b8c0', '#ffd400', 'two', 'smile', 'ears', 'cable']],
    ['thunderbyte', 'Thunderbyte', 'zap', 2, 4, 3, 4, 'reach', 'Crackles across all three lanes at once. Do not use during a storm.', ['blob', '#ffd400', '#2a2a8a', 'angry', 'fangs', 'horns', 'wings']],
    ['gigawatt', 'Gigawatt the Great', 'zap', 3, 5, 4, 5, 'cheer', 'King of the Big Power Station. Everybody glows a bit brighter when he is about.', ['ball', '#fff06a', '#ff8a00', 'visor', 'grin', 'crown', 'sparks']],
    ['dialup', 'Dial-Up Dragon', 'zap', 4, 6, 6, 6, 'reach', 'Takes four minutes to connect. Then it breathes 56,000 bits a second of pure lightning.', ['dragon', '#ffd400', '#1a1a5a', 'angry', 'fangs', 'horns', 'wings'], { lim: 250 }],
    ['puddlepup', 'Puddlepup', 'splash', 0, 1, 1, 2, 'heal', 'Shakes itself dry. On you. Every single time.', ['ball', '#5aa8ff', '#fff', 'two', 'tongue', 'ears', 'drops']],
    ['squelch', 'Squelchfish', 'splash', 0, 2, 3, 1, '', 'Lives in the swimming baths filter. Smells of verruca socks.', ['fish', '#2f80ee', '#ffd400', 'two', 'o', 'fin', 'bubbles']],
    ['drizzle', 'Drizzlewisp', 'splash', 0, 2, 2, 2, 'hover', 'A little grey cloud with a grudge. Follows you home and rains on your chips.', ['ghost', '#c8d0dc', '#5aa8ff', 'sleepy', 'o', 'none', 'drops']],
    ['kraken', 'Bath-Tub Kraken', 'splash', 1, 4, 3, 4, 'armour', 'Lurks under the bubbles. Has eaten nine rubber ducks and a flannel.', ['blob', '#3a5ad8', '#ff8ad8', 'one', 'teeth', 'none', 'tentacles']],
    ['fizzpop', 'Fizzpop', 'splash', 1, 3, 2, 3, 'reach', 'A can of pop that shook itself up. Do NOT open. Do not even look at it.', ['can', '#e10600', '#5aa8ff', 'angry', 'grin', 'tab', 'bubbles']],
    ['tsunamo', 'Tsunamo', 'splash', 2, 5, 5, 4, 'pierce', 'A wave that learnt to surf on itself. Totally radical. Also wet.', ['wave', '#2f80ee', '#e0f4ff', 'angry', 'grin', 'none', 'drops']],
    ['embertoad', 'Embertoad', 'blaze', 0, 1, 2, 1, '', 'Croaks smoke rings. Sits on the radiator all winter long.', ['toad', '#ff8a2a', '#ffd400', 'sleepy', 'smile', 'none', 'smoke']],
    ['chilli', 'Chilli Imp', 'blaze', 0, 2, 3, 1, 'first', 'Small, red and VERY hot. Dave ate one for a dare. Dave was quiet for a week.', ['pear', '#e10600', '#3ab03a', 'angry', 'fangs', 'stalk', 'tail']],
    ['toastie', 'Toastasaurus', 'blaze', 1, 3, 2, 3, 'grow', 'Pops up every two minutes. Slightly burnt round the edges. Grows if you let it.', ['box', '#c8ccd4', '#c88a3a', 'two', 'teeth', 'toast', 'legs']],
    ['bert', 'Bonfire Bert', 'blaze', 1, 3, 3, 2, 'thorns', 'Remember, remember... to stand well back. Prickly when poked with a stick.', ['cone', '#8a5a2a', '#ff8a00', 'angry', 'grin', 'flame', 'sparks']],
    ['scorchio', 'Scorchio', 'blaze', 2, 4, 4, 3, 'pierce', 'A fire-breathing lizard who thinks he is the weatherman. Tomorrow: SCORCHIO!', ['dragon', '#ff4a1a', '#ffd400', 'two', 'grin', 'spikes', 'flamebreath']],
    ['magmoth', 'Magmoth', 'blaze', 3, 5, 5, 4, 'hover', 'Flutters towards the brightest light in the house. Usually the telly.', ['bug', '#ff6a1a', '#ffd400', 'two', 'none', 'antenna', 'wings']],
    ['phoenix', 'Pixel Phoenix', 'blaze', 5, 6, 6, 5, 'reborn', 'A bird made of 8-bit fire. Game over? Not for this one. Insert coin, continue.', ['phoenix', '#ff4a1a', '#ffd400', 'visor', 'beak', 'crest', 'pixwings'], { lim: 25 }],
    ['sproutling', 'Sproutling', 'sprout', 0, 1, 1, 3, '', 'The Brussels sprout nobody ate at Christmas. It has come back for revenge.', ['ball', '#4ac04a', '#a0f07a', 'angry', 'frown', 'leaf', 'none']],
    ['conkerclops', 'Conkerclops', 'sprout', 0, 2, 2, 2, 'thorns', 'A champion acorn quest with one big eye. A 47-er! Baked in the oven (cheating).', ['ball', '#8a4a1a', '#3ab03a', 'one', 'grin', 'shell', 'string']],
    ['mossquito', 'Mossquito', 'sprout', 0, 2, 2, 2, 'leech', 'Bites you and you come up in moss. Itchy, green moss.', ['bug', '#3a8a2a', '#a0f07a', 'two', 'beak', 'antenna', 'wings']],
    ['weedwhack', 'Weedwhacker', 'sprout', 1, 3, 3, 3, 'reach', 'Pops up between the patio slabs. Dad has tried everything. EVERYTHING.', ['blob', '#2a9a2a', '#ff3a6a', 'angry', 'fangs', 'leaf', 'leaves']],
    ['potato', 'Potato Pete', 'sprout', 1, 2, 1, 4, 'heal', 'Just a potato. A very brave potato. Wears his Cubs cap with pride.', ['bean', '#c8a060', '#2a5ad8', 'two', 'smile', 'cap', 'arms']],
    ['oakenhulk', 'Oakenhulk', 'sprout', 2, 5, 4, 6, 'armour', 'An old oak tree that got up one day and went for a walk. Very, very slowly.', ['box', '#8a5a2a', '#3ab03a', 'sleepy', 'frown', 'leaves', 'arms']],
    ['robobin', 'Robo-Bin', 'clank', 0, 2, 2, 2, 'armour', 'A wheelie bin that wants to be a robot. Collects rubbish on Tuesdays.', ['box', '#4a7a4a', '#c0c0c0', 'visor', 'none', 'lid', 'wheels']],
    ['cogwobble', 'Cogwobbler', 'clank', 0, 1, 1, 2, 'clever', 'Made of spare cogs from the back of the kitchen drawer. Ticks when it thinks.', ['cog', '#9aa4b0', '#ffd400', 'two', 'o', 'antenna', 'none']],
    ['spanner', 'Spannerjaw', 'clank', 0, 3, 4, 2, '', 'Bites through bolts. And fences. And Dad\'s toolbox. And the fence again.', ['box', '#6a7480', '#e10600', 'angry', 'teeth', 'horns', 'legs']],
    ['tintyrant', 'Tin Tyrant', 'clank', 1, 4, 3, 4, 'cheer', 'A clockwork robot that took over the whole toy box. All hail the Tin Tyrant.', ['bot', '#c0c8d0', '#e10600', 'visor', 'teeth', 'crown', 'arms']],
    ['flipper', 'Flipper Bot', 'clank', 1, 3, 3, 2, 'first', 'Built for the robot arena on the telly. Flips anything that comes near it.', ['wedge', '#e10600', '#3a3a3a', 'visor', 'none', 'none', 'wheels']],
    ['gearhead', 'Gearhead Max', 'clank', 2, 5, 4, 5, 'grow', 'Upgrades himself every round with bits from the bits box. Nobody knows when he will stop.', ['bot', '#6a7480', '#ffd400', 'lcd', 'grin', 'dish', 'arms']],
    ['spudnik', 'Spudnik', 'cosmic', 0, 1, 1, 2, 'hover', 'A potato that was launched into orbit by mistake. It beeps.', ['bean', '#c8a060', '#c0c0c0', 'two', 'o', 'antenna', 'stars']],
    ['moonmoth', 'Moonmoth', 'cosmic', 0, 2, 2, 2, 'hover', 'Only comes out when there is a full moon AND a good film on.', ['bug', '#b07af0', '#ffe680', 'sleepy', 'none', 'antenna', 'wings']],
    ['glorp', 'Glorp the Visitor', 'cosmic', 1, 3, 3, 3, 'leech', 'Came in peace. Stayed for the crisps. Has had all the cheese and onion.', ['blob', '#5ad85a', '#9a3ae0', 'three', 'grin', 'antenna', 'arms']],
    ['starnacle', 'Starnacle', 'cosmic', 1, 2, 1, 3, 'armour', 'Sticks to the side of space shuttlebuses and refuses to let go. Ever.', ['shell', '#d06ad0', '#ffe680', 'stalk', 'o', 'none', 'stars']],
    ['newt', 'Nebula Newt', 'cosmic', 2, 4, 3, 4, 'cheer', 'Its spots are actual galaxies. Do not lick the newt.', ['lizard', '#6a2ab0', '#ffe680', 'two', 'smile', 'none', 'stars']],
    ['warpwhale', 'Warp Whale', 'cosmic', 3, 6, 5, 7, 'hover', 'Swims between the stars at warp factor nine, singing songs about plankton.', ['whale', '#3a2a8a', '#8ad8ff', 'two', 'smile', 'spout', 'stars']],
  ];
  const X2 = 'card.x2_';
  const CARDS = BEASTS.map(([k, name, el, r, cost, atk, hp, ab, d, art, x], i) => Object.assign({ id: X2 + k, k, no: i + 1, name, el, r, cost, atk, hp, ab, d, art }, x || {}));
  const CARD = {}; for (const c of CARDS) CARD[c.id] = c;

  // ---------------------------------------------------------------- Card Clash: every JackCard that can be played
  // beasts: { kind:'b', cost, atk, hp, el, ab }   gadgets: { kind:'g', cost, fx, tg:'own'|'foe'|'' (needs a lane), txt }
  // fx: heal (you), draw, face (damage to the other player), mull (swap your hand), own:{atk,hp,tmp,shield,rescue},
  //     foe:{dmg,tmp,bounce}, allFoe:{dmg,tmp}, allOwn:{tmp,hp}
  const G = (cost, tg, fx, txt) => ({ kind: 'g', cost, tg, fx, txt });
  const BATTLE = {
    'card.floppy': G(1, '', { heal: 3 }, 'SAVE GAME: you get 3 Hit Points back.'),
    'card.modem': G(2, '', { draw: 2 }, 'CONNECT: draw 2 cards.'),
    'card.cdrom': G(1, 'own', { own: { hp: 3 } }, 'COASTER: your beast in that lane gets +3 HP.'),
    'card.cube': G(1, 'foe', { foe: { tmp: -2 } }, 'SCRAMBLE: the enemy beast in that lane gets -2 Attack this round.'),
    'card.tetris': G(3, '', { allFoe: { dmg: 1 } }, 'LINE CLEAR: 1 damage to every enemy beast.'),
    'card.yoyo': G(3, 'foe', { foe: { bounce: 1 } }, 'ROUND THE WORLD: send the enemy beast in that lane back to their hand.'),
    'card.pager': G(1, 'own', { own: { tmp: 2 } }, 'BEEP BEEP: your beast in that lane gets +2 Attack this round.'),
    'card.mobile': G(1, '', { draw: 1, heal: 1 }, 'PHONE HOME: draw a card and get 1 Hit Point back.'),
    'card.vhs': G(1, 'own', { own: { rescue: 1 } }, 'REWIND: your beast in that lane goes back to your hand (good as new).'),
    'card.walkman': G(2, '', { allOwn: { tmp: 1 } }, 'PUMP UP THE VOLUME: all your beasts get +1 Attack this round.'),
    'card.vpet': G(2, 'own', { own: { atk: 1, hp: 2 } }, 'FEED ME: your beast in that lane gets +1 Attack and +2 HP for good.'),
    'card.486': G(0, 'own', { own: { tmp: 1 } }, 'TURBO BUTTON: +1 Attack this round. (It probably does nothing.)'),
    'card.euro': G(0, '', { mull: 1 }, 'EXCHANGE RATE: shuffle your hand into your deck and draw the same number again.'),
    'card.y2k': G(3, 'foe', { foe: { dmg: 3 } }, 'MILLENNIUM BUG: 3 damage to the enemy beast in that lane.'),
    'card.dome': G(2, 'own', { own: { shield: 1 } }, 'BIG TENT: your beast in that lane takes no damage this round.'),
    'card.seti': G(1, '', { draw: 1 }, 'SEARCHING SPACE: draw a card. (No aliens yet.)'),
    'card.jackpc': G(3, '', { face: 3 }, "JACK'S PC: 3 damage straight to the other player."),
    'card.jackpot': G(4, '', { draw: 2, heal: 5 }, 'JACKPOT!: draw 2 cards and get 5 Hit Points back.'),
    'card.phantom': G(2, '', { allOwn: { hp: 1 } }, 'THE QUEUE: all your beasts get +1 HP. (They have been standing there for hours.)'),
    'card.eclipse': G(2, '', { allFoe: { tmp: -1 } }, 'TOTAL ECLIPSE: every enemy beast gets -1 Attack this round.'),
    'card.pocket': G(2, '', { draw: 2 }, 'GOTTA SWAP THEM ALL: draw 2 cards.'),
    'card.dreamcast': G(2, 'own', { own: { tmp: 3 } }, 'ONLINE!: your beast in that lane gets +3 Attack this round.'),
    'card.bonfire': G(2, 'foe', { foe: { dmg: 2 } }, 'WHOOSH: 2 damage to the enemy beast in that lane.'),
    'card.pumpkin': G(1, 'foe', { foe: { tmp: -2 } }, 'BOO!: the enemy beast in that lane gets -2 Attack this round.'),
    'card.xmas': G(2, '', { heal: 4 }, 'CHRISTMAS TELLY: you get 4 Hit Points back.'),
    'card.nye': G(5, '', { allFoe: { dmg: 2 } }, 'FIREWORKS: 2 damage to every enemy beast.'),
    // Series One characters fight too
    'card.gubbinz': { kind: 'b', cost: 2, atk: 2, hp: 2, el: 'sprout', ab: 'leech' },
    'card.squig': { kind: 'b', cost: 3, atk: 3, hp: 3, el: 'clank', ab: 'first' },
    'card.dave': { kind: 'b', cost: 2, atk: 1, hp: 3, el: 'zap', ab: 'clever' },
    'card.mom': { kind: 'b', cost: 4, atk: 2, hp: 5, el: 'splash', ab: 'armour' },
  };
  for (const c of CARDS) BATTLE[c.id] = { kind: 'b', cost: c.cost, atk: c.atk, hp: c.hp, el: c.el, ab: c.ab };
  const DECK = { size: 15, copies: 2, oneOf: 4, gadgetsMax: 6 }; // oneOf: this rarity and up are one per deck
  // the loaner deck (guests, or a member whose deck isn't full yet: the gaps are filled from this)
  const LOANER = ['voltbat', 'puddlepup', 'sproutling', 'embertoad', 'sparkplug', 'squelch', 'drizzle', 'conkerclops', 'robobin', 'moonmoth', 'spanner', 'megahurtz', 'toastie'].map(k => X2 + k).concat(['card.floppy', 'card.modem']);
  const STARTER = LOANER.slice(); // the free starter deck a member can claim once (real cards for keeps)
  // the computer players: [id, name, blurb, deck, Rupees for beating them]
  const CPU = {
    dave: { n: 'Dave', d: "Jack's best mate. Plays whatever card he picks up first. Says his cousin has a Pixel Phoenix.", pay: 3, lv: 0,
      deck: ['voltbat', 'voltbat', 'sparkplug', 'puddlepup', 'squelch', 'squelch', 'embertoad', 'chilli', 'sproutling', 'conkerclops', 'robobin', 'cogwobble', 'spudnik', 'moonmoth'].map(k => X2 + k).concat(['card.dave']) },
    callum: { n: 'Callum', d: 'The PC gamer. Thinks about every move. Mostly about how he would do it on a PC.', pay: 6, lv: 1,
      deck: ['voltbat', 'sparkplug', 'modemouse', 'drizzle', 'squelch', 'fizzpop', 'chilli', 'toastie', 'mossquito', 'conkerclops', 'cogwobble', 'flipper', 'spudnik', 'moonmoth'].map(k => X2 + k).concat(['card.floppy']) },
    jackk: { n: 'JackK', d: "Jack's mate Jack (the other one). Knows every card, every combo and every element. Very hard.", pay: 10, lv: 2,
      deck: ['megahurtz', 'thunderbyte', 'drizzle', 'tsunamo', 'kraken', 'scorchio', 'bert', 'weedwhack', 'oakenhulk', 'tintyrant', 'gearhead', 'glorp', 'newt'].map(k => X2 + k).concat(['card.modem', 'card.y2k']) },
  };
  const DUEL = { hp: 18, lanes: 3, hand0: 4, handMax: 7, rounds: 10, enMax: 6, planSecs: 75, idleForfeit: 2 };

  // ---------------------------------------------------------------- booster packs (www.cardkorner.kidz)
  // 5 cards: 3 Common, 1 Uncommon and one Rare-or-better (Rare 80%, Epic 15%, Legendary 4%, Jackpot 1%). The odds are
  // printed on the wrapper (by order of Mom). A limited card that has all been found falls back to the next one down.
  const PACK = { price: 75, dayMax: 5, held: 20, slots: [0, 0, 0, 1, 'r'], rare: [[2, 80], [3, 15], [4, 4], [5, 1]] };

  // ---------------------------------------------------------------- JackBay Rupee Auctions
  const BAY = {
    durs: [[30, '30 minutes'], [120, '2 hours'], [720, '12 hours'], [1440, '1 day'], [4320, '3 days']], // minutes
    listFee: p => Math.min(25, Math.max(1, Math.ceil(p * 0.02))), reserveFee: 5, finalPct: 5, // fees vanish (a Rupee sink)
    snipe: 60, snipeMax: 15, // a bid in the last 60 seconds puts the clock back to 60 seconds (up to 15 times)
    maxLots: 8, maxBids: 25, priceMax: 1000000, minEarned: 100,
    inc: p => (p < 50 ? 1 : p < 200 ? 5 : p < 1000 ? 10 : p < 5000 ? 25 : 100),
  };

  // ---------------------------------------------------------------- Jacktown Town Hall: daily takings, upkeep, upgrades
  // takings per building (shops and things people pay to go in); a plot's gross takings = sum x level x town mood,
  // capped by its level; the council keeps the upkeep (business rates) out of it. Collected once a UK day.
  const TAKE = { r: 0, t: 0, f: 0, p: 0.5, F: 1, h: 1, a: 2, o: 0.5, s: 4, T: 5, m: 2, q: 4, w: 5, g: 0, e: 1, n: 1, x: 8, b: 7, R: 3, c: 9 };
  const TOWN = {
    levels: [
      { n: 'Corner Plot', cost: 0, mult: 1, cap: 25, rates: 2 },
      { n: 'High Street', cost: 250, mult: 1.3, cap: 40, rates: 4 },
      { n: 'Market Square', cost: 600, mult: 1.6, cap: 55, rates: 7 },
      { n: 'Shopping Arcade', cost: 1400, mult: 2, cap: 75, rates: 11 },
      { n: 'Retail Park', cost: 3000, mult: 2.5, cap: 100, rates: 16 },
    ],
    keep: 3, // uncollected takings wait for you for up to 3 days
  };

  // ---------------------------------------------------------------- more Pocket Money jobs (grind-cat.js JOBS format)
  const JOBS = {
    shelves: { n: 'Stacking Shelves', who: "Mr Dobbs at Dobbs' Mini-Mart", list: 'odd', secs: 60, max: 90, good: 30, pay: 22, rate: 1.6, unit: 'tins stacked', blurb: 'Grab each thing off the trolley and put it on the shelf with the right label. Beans with beans, crisps with crisps. Do NOT drop the eggs.' },
    newsletter: { n: 'Type Up the Parish Newsletter', who: 'Reverend Pugh at St Barnabus', list: 'odd', secs: 60, max: 60, good: 15, pay: 22, rate: 1.2, unit: 'typos fixed', blurb: "Reverend Pugh typed it on his old typewriter. It is FULL of mistakes. Click every spelling mistake to fix it before it goes to the printers. Don't click the right words!" },
    hamster: { n: 'Catch the Runaway Hamster', who: CT("Mrs Pemberton's grandson {nbrkid}"), list: 'odd', secs: 45, max: 70, good: 22, pay: 22, rate: 2.2, unit: 'catches', blurb: CT('{nbrpet} the hamster has escaped AGAIN. {nbrpet.He} keeps popping out from behind the sofa, the telly and the plant pot. Click {nbrpet.him} quick! Mind the cat.') },
    errands: { n: "Mom's Errands", who: 'Mom', list: 'mom', secs: 60, max: 60, good: 16, pay: 20, rate: 1.4, unit: 'things fetched', blurb: "Mom reads out the shopping list ONCE. Remember it, then grab the right things off the shelves at the corner shop. No sweets unless they're on the list!" },
  };
  // the streak (any paid job on back-to-back days) and the Job of the Day (one odd job a day pays a bonus on its first go)
  const STREAK = { per: 3, max: 21 }; // day n of a streak pays 3 x n Rupees, up to 21
  const JOTD = ['paper', 'mow', 'dog', 'shelves', 'newsletter', 'hamster'];

  // ---------------------------------------------------------------- THE MEGA MASTERS: the weekly cup (1999 weeks, Monday to Sunday)
  const TOUR = {
    arcade: [['tris', 'JACKTRIS'], ['snake', 'SNAKE'], ['bricks', 'BRICK BASH'], ['invaders', 'SAUCER INVADERS'], ['rocks', 'SPACE ROCKS'], ['squig', 'BLOBBIT LOB'], ['whack', 'WHACK-A-ROBOT'], ['simon', 'SIMON SAYS']],
    jobs: ['paper', 'shelves', 'mow', 'hamster', 'dog', 'newsletter', 'washup', 'errands', 'car', 'tidy'],
    prizes: [150, 75, 40], part: 10, // Rupees for 1st/2nd/3rd, and for everyone who entered (per event)
    cups: ['trinket.ex_cupg', 'trinket.ex_cups', 'trinket.ex_cupb'],
    clash: { pvp: 3, draw: 1, cpu: 1, cpuDay: 4 }, // Card Clash League points (a win against JackK counts as a cpu point, up to 4 a day)
  };

  // ---------------------------------------------------------------- earn sources (econ's balance table format)
  const EARN = {
    exclash: { amt: 3, cap: 6, gap: 20, drop: 0.08, label: 'Won a game of Card Clash' },
    exduel: { amt: 15, cap: 3, drop: 0.2, label: 'Won a Card Clash online' },
    extake: { amt: 0, cap: 1, label: 'Jacktown takings' },
    exstreak: { amt: 3, cap: 1, label: 'Odd Jobz streak bonus' },
    exjotd: { amt: 5, cap: 1, drop: 0.1, label: 'Job of the Day bonus' },
  };

  // ---------------------------------------------------------------- extra JackLoot things: trophies, set prizes
  const LOOT = [
    ['trinket.ex_cupg', 'Mega Masters Gold Cup', 3, 'trinket', ['cup', '#ffd400'], 'For winning an event at The Mega Masters. Polish it every Sunday.', { ex: 1 }],
    ['trinket.ex_cups', 'Mega Masters Silver Cup', 2, 'trinket', ['cup', '#d8dce4'], 'Second place at The Mega Masters. So close!', { ex: 1 }],
    ['trinket.ex_cupb', 'Mega Masters Bronze Cup', 1, 'trinket', ['cup', '#c87a3a'], 'Third place at The Mega Masters. On the podium!', { ex: 1 }],
    ['btn.ex_beastie', 'BEASTIE MASTER', 4, 'btn', ['BEASTIE', 'MASTER', '#2a0a5a', '#ffd400', 'shine'], 'For collecting every single Byte Beastie. All 38. Even the phoenix.', { ex: 1 }],
    ['badge.ex_clash', 'Card Clash Champ', 3, 'badge', ['#e10600', '#fff', 'VS'], 'Top of the Card Clash League for a whole 1999 week.', { ex: 1 }],
    ['badge.ex_tycoon', 'Retail Park Tycoon', 3, 'badge', ['#0a5a2a', '#ffd400', 'R5'], 'Built a Jacktown plot all the way up to a Retail Park.', { ex: 1 }],
    ['badge.ex_auction', 'Going Going Gone', 2, 'badge', ['#ffcc00', '#0033cc', 'BID'], 'Won a JackBay Rupee Auction.', { ex: 1 }],
  ];
  const SETS = [
    ...EL_ORDER.map(e => ({ id: 'ex_' + e, n: `Byte Beasties: ${EL[e].n} Gang`, d: `Every ${EL[e].n} Byte Beastie in JackCards Series Two.`, items: CARDS.filter(c => c.el === e).map(c => c.id), teef: 120 })),
    { id: 'ex_beasties', n: 'Byte Beasties: The Lot', d: 'All 38 Byte Beasties, from Voltbat to Warp Whale. Pixel Phoenix and all.', items: CARDS.map(c => c.id), teef: 1000, give: 'btn.ex_beastie' },
  ];
  const MISSIONS = [
    ['ex_clash1', 'Win a game of Card Clash (JackCards Binder 99, a free download)', ['exclash', 'exduel'], 1],
    ['ex_job1', 'Do a job off the Odd Jobz Board or Mom\'s Chore List', ['job'], 1],
  ];

  // add everything to the JackLoot catalogue (and the Pocket Money jobs to GrindCat). Safe to call more than once.
  function augment(L, Gc) {
    if (L && L.ITEM) {
      const put = it => { if (L.ITEM[it.id]) return; L.ITEMS.push(it); L.ITEM[it.id] = it; };
      for (const c of CARDS) put(Object.assign({ id: c.id, name: c.name, r: c.r, type: 'card', art: [100 + c.no, 'x2', EL[c.el].col], d: c.d, ex: 1, x2: c.k }, c.lim ? { lim: c.lim } : {}));
      for (const [id, name, r, type, art, d, x] of LOOT) put(Object.assign({ id, name, r, type, art, d }, x || {}));
      if (L.SETS && L.SET) for (const s of SETS) if (!L.SET[s.id]) { L.SETS.push(s); L.SET[s.id] = s; }
      if (L.MISSIONS && L.MISS) for (const [id, n, ev, need] of MISSIONS) if (!L.MISS[id]) { const m = { id, n, ev, need }; L.MISSIONS.push(m); L.MISS[id] = m; }
      if (L.TYPES && L.TYPES.card) L.TYPES.card = ['JackCards', 'card', 'Trading cards of 1999: Series One (gadgets) and Series Two (Byte Beasties). Pick a favourite to show on your profile, or battle with them in Card Clash.'];
    }
    if (Gc && Gc.JOBS) for (const k in JOBS) if (!Gc.JOBS[k]) Gc.JOBS[k] = JOBS[k];
  }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // the 1999 week a UK day is in (Monday to Sunday), the same sums as mods/grind.js
  function week(day) {
    const y = +day.slice(0, 4), m = +day.slice(5, 7), d = Math.min(+day.slice(8, 10), m === 2 ? 28 : 31);
    const t = Date.UTC(1999, m - 1, d), dow = (new Date(t).getUTCDay() + 6) % 7;
    const mon = t - dow * 864e5, thu = mon + 3 * 864e5, ty = new Date(thu).getUTCFullYear();
    const no = Math.floor((thu - Date.UTC(ty, 0, 1)) / (7 * 864e5)) + 1;
    const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fd = x => { const q = new Date(x); return q.getUTCDate() + ' ' + M[q.getUTCMonth()]; };
    return { w: y + '.' + no, no, label: `Week ${no} of 1999 (${fd(mon)} - ${fd(mon + 6 * 864e5)})`, mon, dow };
  }
  // this week's events: an arcade game and a job, picked by the week number (everybody gets the same)
  function tourEvents(w) {
    const h = hash('megamasters|' + w);
    const a = TOUR.arcade[h % TOUR.arcade.length], j = TOUR.jobs[(h >>> 8) % TOUR.jobs.length];
    return [{ k: 'arcade', g: a[0], n: a[1] }, { k: 'job', g: j, n: '' }, { k: 'clash', g: 'clash', n: 'CARD CLASH LEAGUE' }];
  }
  const jotd = day => JOTD[hash('jotd|' + day) % JOTD.length];

  const C = { EL, EL_ORDER, elMod, AB, CARDS, CARD, X2, BATTLE, DECK, LOANER, STARTER, CPU, DUEL, PACK, BAY, TAKE, TOWN, JOBS, STREAK, JOTD, jotd, TOUR, tourEvents, EARN, LOOT, SETS, MISSIONS, augment, hash, week };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.ExCat = C;
})(this);
