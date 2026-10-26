/* rm-cat: the catalogue for Jack's bedroom (the room round the family PC). Shared by the browser (js/rm-room.js and
 * friends) and the server (mods/rm.js requires it), so a game, a find or a hiding place is only written down once.
 *   CONSOLES  the machines in the room (from: 'dd/mm' = only there from that day of 1999)
 *   GAMES     every cartridge/disc: id 'con.name', title, file (lazy js/rm-g-*.js), score rules the server checks
 *             (max score, rate = most points a second, min = shortest believable run in seconds, pay = the score a run
 *             needs before it earns anything), own: 1 = came with the console, else where it is found (FINDS)
 *             shop: Rupees = only from the mail-order catalogue (Agent P's pack; its FIND has spot 'mail', mail: 1: the parcel grants it),
 *             owner: a mate's name = borrowed (a name sticker on the cart), deps: shared files to load first,
 *             pal: a Game Lad cartridge's own colours (rm-tv.js GBPAL key)
 *   FINDS     things to find in the room (carts and Treasure Tin bits). spot = the clickable thing that hides it.
 *   SPOTS     the daily "Mom lost her purse money" hiding places, with a vague clue each */
(function (root) {
  'use strict';
  const CONSOLES = {
    n64: { n: 'Ultra 64', full: 'the Ultra 64', brand: 'ULTRA SIXTY-FOUR', media: 'cartridge', col: '#2b2b2b' },
    ps: { n: 'PlaySpace', full: 'the PlaySpace', brand: 'PLAYSPACE', media: 'disc', col: '#b9b6ae' },
    gb: { n: 'Game Lad', full: 'the Game Lad Color', brand: 'GAME LAD', media: 'cartridge', col: '#6a3fb0', hand: 1 },
    md: { n: 'Segue', full: 'the Segue', brand: 'SEGUE', media: 'cartridge', col: '#1a1a1a' },
    dc: { n: 'Daydream', full: 'the Daydream', brand: 'DAYDREAM', media: 'disc', col: '#efefe9', from: '14/10' },
    // away: 1 = not under the bedroom telly (the SNES lives in the cupboard under the stairs: js/hs-*.js opens it)
    sn: { n: 'Super Ultra', full: 'the Super Ultra', brand: 'SUPER ULTRA SYSTEM', media: 'cartridge', col: '#c8c6c0', away: 1 }, // (in the cupboard under the stairs: not on the bedroom telly's AV switch)
  };
  // max: biggest believable score, rate: points a second at the very most, min: shortest real run (s), pay: score a run
  // needs to earn anything, best: a "good" score (shown as the target)
  const G = (id, title, file, o) => Object.assign({ id, con: id.split('.')[0], title, file }, o);
  const GAMES = [
    G('n64.kart', 'KART KAOS 64', 'rm-g-kart', { own: 1, max: 30000, rate: 120, min: 40, pay: 1500, blurb: 'Three laps, eight karts, one banana-shaped grudge.', col: '#d8261c' }),
    G('n64.range', 'GOLDENBALLS: TARGET RANGE', 'rm-g-range', { max: 60000, rate: 600, min: 20, pay: 3000, blurb: 'The firing range from the spy game. Pop the targets, spare the civilians.', col: '#a77824' }),
    G('n64.hop', 'BOUNCE QUEST 64', 'rm-g-hop', { max: 20000, rate: 100, min: 30, pay: 800, blurb: 'Hop round Biscuit Island and find all the golden acorns.', col: '#f0b800' }),
    G('ps.run', 'WARP WOMBAT', 'rm-g-run', { own: 1, max: 40000, rate: 200, min: 20, pay: 1500, blurb: 'Spin, jump and smash crates down the jungle path.', col: '#e8661c' }),
    G('ps.fight', 'TEKNO FIST', 'rm-g-fight', { max: 50000, rate: 400, min: 20, pay: 3000, blurb: 'Best of three. Six fighters and a boss. One very loud announcer.', col: '#7a1010' }),
    G('ps.grav', 'ANTI-GRAV 3000', 'rm-g-grav', { max: 30000, rate: 150, min: 40, pay: 1500, blurb: 'Hover racing at silly speeds to thumping music.', col: '#1a4ad0' }),
    G('gb.blocks', 'BLOCKOLOGY', 'rm-g-blocks', { own: 1, max: 999999, rate: 900, min: 15, pay: 2000, blurb: 'Falling blocks. Clear lines. Do not panic.', col: '#8a8a8a' }),
    G('gb.mon', 'POCKET CRITTERS: MOSS VERSION', 'rm-g-mon', { deps: ['lk-crit'], max: 99999, rate: 40, min: 20, pay: 300, blurb: 'Catch them, train them, beat the Moss Town gym.', col: '#3a8a3a' }),
    G('md.zip', 'ZIP THE BADGER', 'rm-g-zip', { own: 1, max: 99999, rate: 400, min: 20, pay: 3000, blurb: 'Gotta go quick. Rings, springs and loop-the-loops.', col: '#8840c4' }),
    G('md.rage', 'PAVEMENTS OF PERIL', 'rm-g-rage', { max: 99999, rate: 300, min: 20, pay: 3000, blurb: 'Clean up Grimsby Street with your fists (and a lead pipe).', col: '#c01a6a' }),
    G('dc.taxi', 'MAD MINICAB', 'rm-g-taxi', { own: 1, max: 50000, rate: 200, min: 30, pay: 2000, blurb: 'Get your passengers there FAST. Pavements are just wide roads.', col: '#f0c800' }),
    G('dc.dash', 'ZIP ADVENTURE', 'rm-g-dash', { max: 99999, rate: 500, min: 20, pay: 3000, blurb: 'Zip goes 3D! Run, ring-chase and loop down Emerald Bay.', col: '#8840c4' }),
    G('dc.duel', 'SOUL SABRE', 'rm-g-duel', { max: 50000, rate: 400, min: 20, pay: 3000, blurb: 'Swords, sparks and very dramatic hair.', col: '#5a2ab0' }),
    // ---- expansion pack 35 (Agent L): the Super Ultra under the stairs, and more lost games round the room
    G('gb.mon2', 'POCKET CRITTERS: PUDDLE VERSION', 'rm-g-mon', { max: 99999, rate: 40, min: 20, pay: 300, deps: ['lk-crit'], pal: 'left', owner: '{mate4}', blurb: '{mate4}\'s copy. Different critters live in the long grass. Link up and trade!', col: '#2a6ad0' }),
    G('gb.grab', 'GRABBO LAND', 'rm-g-grab', { shop: 60, max: 99999, rate: 250, min: 30, pay: 1500, blurb: 'The greediest treasure hunter on the island. Barge, bash and grab it all.', col: '#e0b000' }),
    G('n64.party', 'WOBBLE PARTY 64', 'rm-g-party', { owner: '{mate1}', max: 30000, rate: 60, min: 90, pay: 1000, blurb: 'Dice, stars and minigames. Four players, one board, zero friendships left.', col: '#2a9ad8' }),
    G('ps.sneak', 'METAL GERBIL SOLID', 'rm-g-sneak', { shop: 90, max: 50000, rate: 150, min: 60, pay: 2000, blurb: 'Tactical Sneaking Action. Hide in a box. Never be seen.', col: '#4a5a4a' }),
    G('md.teeny', 'TEENY MOTORS', 'rm-g-teeny', { owner: '{mate3}', max: 30000, rate: 150, min: 40, pay: 1500, blurb: 'Tiny cars racing across the breakfast table. Mind the cornflakes.', col: '#e8341c' }),
    G('sn.zero', 'FORMULA NULL', 'rm-g-zero', { own: 1, max: 50000, rate: 200, min: 40, pay: 1500, blurb: 'Hover racing in glorious Mode 7. It came with the console!', col: '#2a3ad0' }),
    G('sn.zeldo', 'THE LEGEND OF ZELDO', 'rm-g-zeldo', { shop: 90, max: 99999, rate: 60, min: 60, pay: 800, blurb: 'A Link to the Pasta. A sword, a shield and a dungeon full of keys.', col: '#2a8a3a' }),
    G('sn.plumb', 'SUPER PLUMBO WORLD', 'rm-g-plumb', { owner: '{mate2}', max: 99999, rate: 300, min: 30, pay: 2000, blurb: 'Stomp, spin and fly across Biscuit Isle. Every exit counts.', col: '#d8261c' }),
    G('dc.toy', 'TOY SQUADRON', 'rm-g-toy', { shop: 100, max: 50000, rate: 200, min: 40, pay: 2000, blurb: 'Fly a toy plane round a giant house. Missions in every room. Mind the cat.', col: '#d83a2a' }),
    G('sn.fight', 'STREET SCRAPPER II', 'rm-g-scrap', { shop: 80, max: 50000, rate: 400, min: 20, pay: 3000, blurb: 'Eight scrappers. One tournament. Fireballs are allowed.', col: '#e88a1c' }),
  ];
  // Resolve at access: the catalogue may load before the account gate has bound Cast.
  const authored = (o, keys) => { for (const key of keys) if (typeof o[key] === 'string' && o[key].includes('{')) {
    const template = o[key]; Object.defineProperty(o, key, { enumerable: true, configurable: true,
      get: () => typeof Cast !== 'undefined' ? Cast.t(template) : template });
  } };
  GAMES.forEach(g => authored(g, ['owner', 'blurb']));
  const GAME = {}; for (const g of GAMES) GAME[g.id] = g;

  // things to find. spot: the clickable thing in the room that hides it (rm-room.js), n: name, d: what Jack says
  const FINDS = [
    { id: 'cart.n64.range', spot: 'drawer', n: 'GOLDENBALLS cartridge', d: "There it is! Under the letters. I thought {mate1} nicked it." },
    { id: 'cart.n64.hop', spot: 'wardrobe', n: 'BOUNCE QUEST 64 cartridge', d: 'In the wardrobe, inside a welly. Classic me.' },
    { id: 'cart.ps.fight', spot: 'bed', n: 'TEKNO FIST disc', d: "Under the bed with a sock and half a Wobbly Wheel. The disc is fine. The Wobbly Wheel isn't." },
    { id: 'cart.ps.grav', spot: 'bin', n: 'ANTI-GRAV 3000 disc', d: 'In the bin?! Mom must have thought the case was rubbish. It IS a bit cracked.' },
    { id: 'cart.gb.mon', spot: 'beanbag', n: 'POCKET CRITTERS cartridge', d: 'Down the side of the beanbag! My save file had 3 hours on it!' },
    { id: 'cart.md.rage', spot: 'tvback', n: 'PAVEMENTS OF PERIL cartridge', d: 'Fell down behind the telly with all the leads. Dusty. Blow on it.' },
    { id: 'cart.dc.dash', spot: 'dcbox', from: '14/10', n: 'ZIP ADVENTURE disc', d: 'It was in the Daydream box the whole time, under the instructions.' },
    { id: 'cart.dc.duel', spot: 'post', from: '14/10', n: 'SOUL SABRE disc', d: "Won it in the JACK ATTACK! competition! (A proper prize. I am keeping the envelope.)" },
    { id: 'cart.gb.mon2', spot: 'bed', n: 'POCKET CRITTERS: PUDDLE VERSION cartridge', d: 'Under my pillow! {mate4} lent me {mate4.his} PUDDLE VERSION so we can trade critters. I need a link cable now...' },
    { id: 'link.cable', spot: 'tvback', n: 'Game Lad link cable', d: 'A LINK CABLE, tangled up with the telly leads! Now I can trade and battle Pocket Critters with my mates.' },
    { id: 'cart.n64.party', spot: 'wardrobe', n: 'WOBBLE PARTY 64 cartridge', d: 'On top of the wardrobe. Mom hid it after the Great Mini-Game Row. It\'s {mate1}\'s, so I have to give it back. Eventually.' },
    // (mail: only arrives by post, ordered from the mail-order catalogue (Agent P's pack): never hidden in a room)
    { id: 'cart.ps.sneak', spot: 'mail', mail: 1, n: 'METAL GERBIL SOLID disc', d: 'It came in the post! Still in the shrink-wrap. Tactical Sneaking Action, here I come.' },
    { id: 'cart.gb.grab', spot: 'mail', mail: 1, n: 'GRABBO LAND cartridge', d: 'It came in the post! A brand-new Game Lad game. The box smells amazing.' },
    { id: 'cart.md.teeny', spot: 'shelf', n: 'TEENY MOTORS cartridge', d: 'Behind the Buildex roller coaster. It\'s {mate3}\'s! {mate3.He} says it\'s the only console game worth playing. {mate3.He} has a point.' },
    { id: 'cart.sn.zeldo', spot: 'mail', mail: 1, n: 'THE LEGEND OF ZELDO cartridge', d: 'It came in the post! With a fold-out map and everything.' },
    { id: 'cart.sn.plumb', spot: 'hs.sofa', n: 'SUPER PLUMBO WORLD cartridge', d: 'Down the back of the sofa, with 40p and a lot of crumbs. It\'s {mate2}\'s copy. Do NOT tell {mate2}.' },
    { id: 'cart.dc.toy', spot: 'mail', mail: 1, from: '14/10', n: 'TOY SQUADRON disc', d: 'It came in the post! A Daydream game where you fly toys round a house. Mom says do NOT try it with real planes.' },
    { id: 'cart.sn.fight', spot: 'mail', mail: 1, n: 'STREET SCRAPPER II cartridge', d: 'It came in the post! Eight scrappers. {mate1} is going DOWN.' },
    { id: 'tin.marble', spot: 'rug', n: 'Shooter marble', d: 'The big swirly one. Never play with this one, it is too precious.' },
    { id: 'tin.tazo', spot: 'bin', n: 'Shiny tazo', d: 'Out of a crisp packet. Worth more than the crisps were.' },
    { id: 'tin.badge', spot: 'shelf', n: '"I BUILT A ROBOT" badge', d: 'From the robot-building club at the library. I built a robot. It fell over.' },
    { id: 'tin.holo', spot: 'posterfilm', n: 'Hologram sticker', d: 'Stuck behind the poster. It goes from a rocket to an alien when you tilt it.' },
    { id: 'tin.key', spot: 'cat', n: 'Tiny brass key', d: "The cat from next door was lying on it. It's the key to my money box!" },
    { id: 'tin.cheat', spot: 'mags', n: 'Cheat code card', d: 'Free with a games mag: UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A. Works on everything (it does not).' },
    { id: 'tin.ticket', spot: 'cork', n: 'Cinema ticket stub', d: 'From when we went to see the new space film. {mate1} cried at the end. {mate1.He} says {mate1.he} did not.', from: '16/07' },
    { id: 'tin.conker', spot: 'window', n: 'Champion acorn quest', d: 'A 12-er. Baked in the oven (that is cheating, do not tell {mate1}).', from: '20/09' },
  ];
  FINDS.forEach(f => authored(f, ['d']));
  const FIND = {}; for (const f of FINDS) FIND[f.id] = f;

  // the daily hiding place of Mom's lost change (the server picks one a day for each member)
  const SPOTS = [
    ['bed', 'Somewhere soft that you sleep on.'], ['beanbag', 'Somewhere squishy you sit on to play games.'], ['drawer', 'Somewhere you keep letters.'],
    ['bin', 'Somewhere that needs emptying. (Not by Mom, she says.)'], ['wardrobe', 'Somewhere with clothes in it.'], ['rug', 'Somewhere on the floor that you walk on.'],
    ['cat', 'Somewhere warm, furry and asleep.'], ['window', 'Somewhere you look out of.'], ['shelf', 'Somewhere up high with toys on.'],
    ['tvback', 'Somewhere behind something that glows.'], ['mags', 'Somewhere with lots of pages.'], ['lamp', 'Somewhere bright.'],
  ];
  const COIN = { amts: [10, 20, 50], label: 'Found Mom\'s lost change' }; // (the pence is a joke: it pays Rupees)

  // secrets (Apps.defineSecret at start-up, so the Secrets window counts them all): [id, name, hint]
  const SECRETS = [
    ['rm.room', 'Not a Grown-Up', 'Look round your room before you switch the PC on.'],
    ['rm.blow', 'Blow On It', 'When a cartridge will not work, there is only one thing for it.'],
    ['rm.tibbs', 'Cat Whisperer', 'Stroke the visitor on the bed until he purrs.'],
    ['rm.night', 'Night Owl', 'Look out of your window when it is dark outside.'],
    ['rm.tin', 'Treasure Hoarder', 'Fill the treasure tin in your room.'],
    ['rm.allgames', 'Every Last Game', 'Find every game hidden in your room.'],
    ['rm.lava', 'Groovy', 'Watch the lava lamp for a whole minute.'],
    ['rm.post', 'You Have Won!', 'Play lots of different games in your room and wait for the post.'],
    ['rm.cube', 'Solved It For Real', 'Solve the real puzzle cube on your desk.'],
    ['rm.pet', 'Pet Parent', 'Keep the keyring pet happy and fed.'],
    ['rm.kart.short', 'Off-Road', 'Some kart tracks have a short cut. Some of them are even allowed.'],
    ['rm.range.gold', 'Golden Gun', 'Clear the target range without hitting a single civilian.'],
    ['rm.hop.all', 'Acorn Collector', 'Find every golden acorn on Biscuit Island.'],
    ['rm.run.box', 'Crate Smasher', 'Smash every crate on a level of Warp Wombat.'],
    ['rm.fight.perfect', 'Flawless', 'Win a round of Tekno Fist without being hit once.'],
    ['rm.grav.lap', 'Sub-Light Speed', 'Beat the track record on a lap of Anti-Grav 3000.'],
    ['rm.blocks.tetra', 'Four in a Row', 'Clear four lines at once in Blockology.'],
    ['rm.mon.gym', 'Moss Badge', 'Beat the gym leader in Pocket Critters.'],
    ['rm.zip.rings', 'Ring Hoarder', 'Finish a level of Zip the Badger holding 100 rings.'],
    ['rm.rage.pipe', 'Pipe Dream', 'Find the lead pipe in Pavements of Peril.'],
    ['rm.taxi.tip', 'Big Tipper', 'Get a passenger somewhere so fast they give you a huge tip.'],
    ['rm.dash.loop', 'Loop the Loop', 'Run all the way round the big loop in Zip Adventure.'],
    ['rm.duel.ring', 'Ring Out', 'Knock somebody clean out of the ring in Soul Sabre.'],
    // ---- expansion pack 35 (Agent L)
    ['lk.cable', 'Linked Up', 'Find a link cable in your room.'],
    ['lk.trade', 'Fair Swap', 'Trade a Pocket Critter with somebody else on JackNet.'],
    ['lk.battle', 'Cable Club Champ', 'Win a Pocket Critters link battle against another member.'],
    ['lk.tradeevo', 'Trade Up', 'Some critters change when they go down a link cable.'],
    ['lk.dex', 'Critter Expert', 'Catch every single Pocket Critter. You will need a friend.'],
    ['lk.puddle', 'Puddle Badge', 'Beat the gym leader in the Puddle Version of Pocket Critters.'],
    ['lk.zero.gold', 'Gold Cup', 'Win every race of a Formula Null cup.'],
    ['lk.zero.jump', 'Big Air', 'Find the jump-ramp short cut in Formula Null.'],
    ['lk.zeldo.boss', 'Pasta La Vista', 'Beat the dungeon boss in The Legend of Zeldo.'],
    ['lk.zeldo.heart', 'Heart of Gold', 'Find a hidden heart piece in The Legend of Zeldo.'],
    ['lk.plumb.castle', 'Castle Crasher', 'Beat the castle in Super Plumbo World.'],
    ['lk.plumb.secret', 'Secret Exit', 'Find a secret exit in Super Plumbo World.'],
    ['lk.scrap.champ', 'World Scrapper', 'Win the Street Scrapper II tournament.'],
    ['lk.scrap.perfect', 'PERFECT!', 'Win a round of Street Scrapper II without being hit.'],
    ['lk.party.star', 'Superstar', 'Win a game of Wobble Party 64.'],
    ['lk.party.sweep', 'Clean Sweep', 'Win every minigame in one game of Wobble Party 64.'],
    ['lk.sneak.ghost', 'Ghost', 'Finish Metal Gerbil Solid without being spotted once.'],
    ['lk.sneak.box', 'Box Fan', 'Hide in a cardboard box right under a guard\'s nose.'],
    ['lk.grab.hoard', 'Treasure Hoarder', 'Find every treasure in Grabbo Land.'],
    ['lk.grab.boss', 'Big Boss Barge', 'Beat the boss in Grabbo Land.'],
    ['lk.toy.ace', 'Toy Box Ace', 'Get gold on every mission in Toy Squadron.'],
    ['lk.toy.cat', 'Cat Nap', 'Land a toy plane on the cat in Toy Squadron.'],
    ['lk.teeny.cup', 'Breakfast Champion', 'Win the Teeny Motors championship.'],
    ['lk.teeny.bowl', 'Bowl Ride', 'Take the short cut through the cereal bowl in Teeny Motors.'],
  ];

  const md = s => { const [d, m] = String(s).split('/').map(Number); return m * 100 + d; }; // 'dd/mm' -> mmdd
  const C = { CONSOLES, GAMES, GAME, FINDS, FIND, SPOTS, COIN, SECRETS, md };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.RoomCat = C;
  // (in the browser: finding the link cable in the room is a secret too)
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { if (window.Room && Room.on) Room.on('find', id => { if (id === 'link.cable' && Room._ && Room._.secret) Room._.secret('lk.cable'); }); } catch (e) {} }, 0));
})(typeof window !== 'undefined' ? window : this);
