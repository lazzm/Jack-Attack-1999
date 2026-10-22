/* JackCity 3000 (Maxijack, 1999) for the Games Cupboard. An isometric city builder: zone it, power it, tax it, watch it
 * grow, then watch a giant B-movie blob sit on it. Original code and art: everything is drawn on canvas at load time. */
(function () {
  'use strict';
  const D = window.Discs; if (!D) return;

  // ================================================================ constants
  const N = 48, NN = N * N, OX = N * 16 + 16, OY = 84, WW = N * 32 + 32, WH = N * 16 + OY + 28;
  const T_NONE = 0, T_ROAD = 1, T_ZONE = 2, T_BLD = 3, T_RUB = 4;
  const GRASS = 0, WATER = 1, TREES = 2;
  const ZR = 1, ZC = 2, ZI = 3;
  const ZNAME = ['', 'Residential', 'Commercial', 'Industrial'];
  // residents / jobs per zone tile, by kind, density and level
  const POP = { 1: [[0, 12, 30], [0, 40, 100, 220]], 2: [[0, 10, 24], [0, 30, 70, 150]], 3: [[0, 14, 32], [0, 35, 80, 160]] };
  const MAXLV = [2, 3];
  // k: { n name, sz footprint, cost, up upkeep/month, cap power, wat water, cov coverage map, use power use, good land value,
  //      reward population, lock (petition), cb shop boost, rb home boost, cat menu, nearW must touch water }
  const BLD = {
    coal: { n: 'Coal Power Plant', sz: 2, cost: 3000, up: 35, cap: 500, cat: 'power', d: 'Burns coal. 500 units of power and a LOT of smoke.' },
    gas: { n: 'Gas Power Plant', sz: 2, cost: 5000, up: 50, cap: 420, cat: 'power', d: 'Cleaner than coal, dearer than coal. 420 units of power.' },
    wind: { n: 'Wind Turbine', cost: 400, up: 4, cap: 60, cat: 'power', d: 'Clean power: 60 units. It\'s always windy in JackCity.' },
    wtower: { n: 'Water Tower', cost: 350, up: 6, wat: 150, use: 1, cat: 'water', d: 'Water for 150 units. Bigger buildings need water to grow.' },
    pump: { n: 'Pumping Station', cost: 900, up: 12, wat: 600, use: 3, nearW: 1, cat: 'water', d: 'Pumps 600 units from the river, lake or sea. Must touch water.' },
    police: { n: 'Police Station', cost: 500, up: 40, cov: 'pol', use: 6, cat: 'serv', d: 'Cuts crime nearby.' },
    fire: { n: 'Fire Station', cost: 500, up: 40, cov: 'fir', use: 6, cat: 'serv', d: 'Puts out fires nearby. Fire engines included.' },
    school: { n: 'School', cost: 700, up: 45, cov: 'edu', use: 6, cat: 'serv', d: 'Clever kids. Raises land value.' },
    library: { n: 'Library', cost: 300, up: 12, cov: 'edu', small: 1, use: 2, cat: 'serv', d: 'Books AND a CD-ROM. A little school for a little area.' },
    hosp: { n: 'Hospital', cost: 900, up: 55, cov: 'hea', use: 8, cat: 'serv', d: 'Healthy people. Raises land value.' },
    bus: { n: 'Bus Depot', cost: 600, up: 25, cov: 'bus', use: 3, cat: 'serv', d: 'Buses take cars off the roads nearby. Less traffic, less smog.' },
    park: { n: 'Park', cost: 80, up: 1, good: 150, cat: 'serv', d: 'Trees, a pond and a bench. Everyone loves it.' },
    burger: { n: 'Jack Burger Stand', cost: 150, up: 0, good: 80, use: 2, cb: 0.06, lock: 1, cat: 'serv', d: 'The people asked for it. Shops love it.' },
    stadium: { n: 'Football Stadium', sz: 2, cost: 4000, up: 40, good: 120, use: 10, rb: 0.08, cb: 0.05, cat: 'serv', d: 'Home of JackCity Rovers. More people want to live here.' },
    statue: { n: 'Statue of Jack', cost: 0, good: 255, reward: 800, d: 'Reward for 800 people. Even the cap is bronze.' },
    zoo: { n: 'City Zoo', sz: 2, cost: 0, good: 255, reward: 2000, use: 4, d: 'Reward for 2,000 people. Do not feed the flamingos.' },
    mansion: { n: 'Mayor\'s Mansion', cost: 0, good: 220, reward: 3500, use: 4, d: 'Reward for 3,500 people. Has a bouncy castle.' },
    arcade: { n: 'Jack\'s Mega Arcade', cost: 0, good: 170, reward: 5000, use: 6, cb: 0.1, d: 'Reward for 5,000 people. Luke and Dave live here now.' },
    mast: { n: 'JackTV Mast', cost: 0, good: 140, reward: 8000, use: 8, rb: 0.06, d: 'Reward for 8,000 people. Four channels! FOUR!' },
    rocket: { n: 'Rocket Launch Pad', sz: 2, cost: 0, good: 200, reward: 12000, use: 12, rb: 0.08, cb: 0.08, d: 'Reward for 12,000 people. Next stop: the Moon. (Dave\'s uncle says it\'s his.)' },
  };
  const REWARDS = ['statue', 'zoo', 'mansion', 'arcade', 'mast', 'rocket'];
  const ORDS = {
    burgerfri: { n: 'Free Jack Burger Fridays', c: 40, d: 'Land is worth more. People queue round the block.' },
    nohw: { n: 'No Homework on Fridays', c: 0, d: 'More people want to live here. Teachers furious.' },
    lollipop: { n: 'Lollipop Ladies', c: 30, d: 'Less crime. They also stop the traffic. A lot.' },
    recycle: { n: 'Recycling Scheme', c: 50, d: 'Less pollution. Even Dave recycles now.' },
    tourism: { n: 'Visit JackCity! Campaign', c: 60, d: 'More demand for shops. Posters of Jack everywhere.' },
    hosepipe: { n: 'Hosepipe Ban', c: 0, d: 'Uses 15% less water. Lawns go brown. Grandad sulks.' },
    carshare: { n: 'Car Share Week', c: 20, d: 'Less traffic. Everybody argues about the radio.' },
  };
  // neighbour deals (signed while visiting a member's city; stored in YOUR save): pay = Rupees a month (+ in, - out)
  const DEALS = {
    power: { n: 'Sell them 100 units of spare power', pay: 120, d: '+120 Rupees a month. Uses 100 units of your power.' },
    water: { n: 'Buy 200 units of water from them', pay: -50, d: '-50 Rupees a month. +200 units of water for you.' },
    bus: { n: 'Run a bus route between the cities', pay: 40, d: '+40 Rupees a month in fares. Day-trippers want more shops.' },
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearStr = y => y === 0 ? '1999' : String(19099 + y); // the millennium bug: after 1999 comes 19100
  // money is Rupees (the site's currency): fmt() for words, gem()+num() for compact displays
  const num = n => Math.round(n).toLocaleString('en-GB');
  const fmt = n => { const v = Math.round(n); return num(v) + (Math.abs(v) === 1 ? ' Rupee' : ' Rupees'); };
  const gem = px => (window.Econ && Econ.gem ? Econ.gem('green', px || 12) : `<svg viewBox="0 0 12 16" width="${Math.round((px || 12) * 0.75)}" height="${px || 12}"><path d="M6 0l6 6-6 10L0 6z" fill="#3ae06a" stroke="#063" stroke-width="1"/><path d="M6 0L3 6h6z" fill="#b8ffd0"/></svg>`);
  const gnum = (n, px) => `<span class="dg-city-g">${gem(px)}${num(n)}</span>`;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = l => l[rnd(l.length)];
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = i => { let x = (i * 2654435761) >>> 0; x ^= x >>> 13; x = Math.imul(x, 1274126177) >>> 0; return (x ^ (x >>> 16)) >>> 0; };
  const b64 = a => { let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
  const unb64 = (s, A) => { const t = atob(s), a = new A(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ================================================================ little SVG icons and faces
  const ICO = {
    query: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="#bfe8ff" stroke="#000" stroke-width="2"/><path d="M15 15l6 6" stroke="#7a4a1a" stroke-width="4"/><path d="M8 8.5a2 2 0 1 1 2.5 2v1.5" stroke="#000080" stroke-width="1.6" fill="none"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M12 1l4 5h-3v5h5V8l5 4-5 4v-3h-5v5h3l-4 5-4-5h3v-5H6v3l-5-4 5-4v3h5V6H8z" fill="#ffd400" stroke="#000"/></svg>',
    doze: '<svg viewBox="0 0 24 24"><rect x="6" y="8" width="11" height="7" fill="#ffd400" stroke="#000"/><rect x="10" y="3" width="6" height="6" fill="#ffd400" stroke="#000"/><rect x="11.5" y="4.5" width="3" height="3" fill="#9cf"/><path d="M1 9h4v10H1z" fill="#999" stroke="#000"/><rect x="5" y="15" width="16" height="5" rx="2.5" fill="#333" stroke="#000"/></svg>',
    road: '<svg viewBox="0 0 24 24"><path d="M1 21L10 3h4l9 18z" fill="#555" stroke="#000"/><path d="M12 5v3M12 10v3M12 15v4" stroke="#ffd400" stroke-width="1.6"/></svg>',
    zone: '<svg viewBox="0 0 24 24"><rect x="1" y="13" width="7" height="9" fill="#3c3" stroke="#000"/><rect x="8.5" y="7" width="7" height="15" fill="#39f" stroke="#000"/><rect x="16" y="10" width="7" height="12" fill="#fc3" stroke="#000"/></svg>',
    power: '<svg viewBox="0 0 24 24"><path d="M14 1L4 14h7l-3 9 12-14h-7z" fill="#ffd400" stroke="#000"/></svg>',
    serv: '<svg viewBox="0 0 24 24"><path d="M12 1l9 4v6c0 6-4 10-9 12C7 21 3 17 3 11V5z" fill="#2a4ad8" stroke="#000"/><path d="M12 6l1.6 3.5 3.8.4-2.9 2.5.9 3.7L12 14.2 8.6 16.1l.9-3.7-2.9-2.5 3.8-.4z" fill="#ffd400"/></svg>',
    reward: '<svg viewBox="0 0 24 24"><path d="M6 2h12v5a6 6 0 0 1-12 0z" fill="#ffd400" stroke="#000"/><path d="M6 4H2v2a4 4 0 0 0 4 4M18 4h4v2a4 4 0 0 1-4 4" fill="none" stroke="#000"/><rect x="10" y="13" width="4" height="5" fill="#c90" stroke="#000"/><rect x="6" y="18" width="12" height="4" fill="#7a4a1a" stroke="#000"/></svg>',
    data: '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" fill="#fff" stroke="#000"/><rect x="4" y="12" width="4" height="9" fill="#3c3"/><rect x="10" y="6" width="4" height="15" fill="#fc3"/><rect x="16" y="9" width="4" height="12" fill="#e33"/></svg>',
    budget: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="19" rx="9" ry="3.5" fill="#c90" stroke="#000"/><ellipse cx="12" cy="15" rx="9" ry="3.5" fill="#fc3" stroke="#000"/><ellipse cx="12" cy="11" rx="9" ry="3.5" fill="#ffd400" stroke="#000"/><path d="M8.5 9.5h7M12 9.5v3.5" stroke="#7a4a00" stroke-width="1.8"/></svg>',
    adv: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="7" fill="#f2c9a0" stroke="#000"/><path d="M5 9c0-6 14-6 14 0-3-2-11-2-14 0z" fill="#6a3a1a"/><circle cx="9.5" cy="10" r="1" /><circle cx="14.5" cy="10" r="1"/><path d="M9 13.5c2 1.5 4 1.5 6 0" stroke="#000" fill="none"/><path d="M4 23c1-5 15-5 16 0z" fill="#2a4ad8" stroke="#000"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 4L2 10l7 6v-4c6 0 9 2 11 7 0-8-4-12-11-12z" fill="#3a8ae8" stroke="#000" stroke-linejoin="round"/></svg>',
    water: '<svg viewBox="0 0 24 24"><path d="M12 2C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-13z" fill="#3a8ae8" stroke="#000"/><path d="M9 14a3 3 0 0 0 3 4" stroke="#bfe8ff" stroke-width="2" fill="none"/></svg>',
    dis: '<svg viewBox="0 0 24 24"><path d="M2 21c0-9 4-15 10-15s10 6 10 15l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z" fill="#4ad83a" stroke="#0a3a10" stroke-width="1.2"/><circle cx="8" cy="15" r="2" fill="#a040c0" opacity=".7"/><circle cx="17" cy="17" r="1.5" fill="#a040c0" opacity=".7"/><ellipse cx="7.5" cy="9.5" rx="2" ry="1.2" fill="#e0ffc0"/><path d="M9.5 8V4.5M14.5 8V4.5" stroke="#1a7a2a" stroke-width="1.4"/><circle cx="9.5" cy="4" r="2.2" fill="#fff" stroke="#000" stroke-width=".7"/><circle cx="14.5" cy="4" r="2.2" fill="#fff" stroke="#000" stroke-width=".7"/><circle cx="10" cy="4.4" r="1"/><circle cx="15" cy="4.4" r="1"/><ellipse cx="12" cy="13" rx="5" ry="2.6" fill="#3a0a2a"/><path d="M8 11.4l1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6" fill="#fff"/></svg>',
  };
  const sw = c => `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="${c}" stroke="#000"/></svg>`;
  const swd = c => `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="${c}" stroke="#000"/><path d="M2 8h20M2 14h20M8 2v20M14 2v20" stroke="rgba(0,0,0,.35)"/></svg>`;
  // advisor portraits: o = { skin, hair, hairStyle, shirt, grot, glasses, cap, hat }
  function face(o) {
    const sk = o.skin || '#f2c9a0';
    let s = `<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" fill="${o.bg || '#5a7ab8'}"/><path d="M6 48c2-10 34-10 36 0z" fill="${o.shirt || '#2a4ad8'}" stroke="#000"/>`;
    if (o.grot) s += `<path d="M10 20L1 12l3 14zM38 20l9-8-3 14z" fill="${sk}" stroke="#000"/>`;
    s += `<ellipse cx="24" cy="22" rx="${o.grot ? 12 : 11}" ry="13" fill="${sk}" stroke="#000"/>`;
    if (o.hair) s += o.long ? `<path d="M12 22c-2-14 26-14 24 0 0-6-4-9-12-9s-12 3-12 9z" fill="${o.hair}" stroke="#000"/><path d="M12 22c-2 8-1 14 2 16M36 22c2 8 1 14-2 16" stroke="${o.hair}" stroke-width="4" fill="none"/>` : `<path d="M13 18c0-11 22-11 22 0-3-3-6-4-11-4s-8 1-11 4z" fill="${o.hair}" stroke="#000"/>`;
    if (o.cap) s += `<path d="M12 16c0-9 24-9 24 0z" fill="${o.cap}" stroke="#000"/><path d="M12 16h-8l2 2h8z" fill="${o.cap}" stroke="#000"/>`;
    if (o.hat) s += `<path d="M11 15h26l-3-8H14z" fill="#123" stroke="#000"/><rect x="21" y="9" width="6" height="4" fill="#ffd400"/><rect x="9" y="15" width="30" height="3" fill="#000"/>`;
    if (o.peak) s += `<path d="M10 15c0-8 28-8 28 0z" fill="${o.peak}" stroke="#000"/><path d="M13 15h22l3 3H13z" fill="#111" stroke="#000"/><rect x="21" y="9" width="6" height="3" fill="#ffd400" stroke="#000" stroke-width=".5"/>`;
    const ey = o.grot ? '#e10600' : '#000';
    s += `<circle cx="19.5" cy="22" r="1.8" fill="${ey}"/><circle cx="28.5" cy="22" r="1.8" fill="${ey}"/>`;
    if (o.glasses) s += `<circle cx="19.5" cy="22" r="4" fill="none" stroke="#000" stroke-width="1.3"/><circle cx="28.5" cy="22" r="4" fill="none" stroke="#000" stroke-width="1.3"/><path d="M23.5 22h1" stroke="#000"/>`;
    if (o.tache) s += `<path d="M17 28c3-3 5-1 7-1s4-2 7 1c-3 1-5 0-7 0s-4 1-7 0z" fill="${o.tache}" stroke="#000" stroke-width=".6"/>`;
    s += o.grot ? '<path d="M17 29h14l-2 3H19z" fill="#000"/><path d="M19 29l1 2 1-2M27 29l1 2 1-2" stroke="#fff" fill="none"/>' : `<path d="M19 29c3 2.5 7 2.5 10 0" stroke="#000" stroke-width="1.4" fill="none"/>`;
    return s + '</svg>';
  }
  const FACES = {
    fin: face({ hair: '#888', long: true, glasses: true, shirt: '#7a2a5a', bg: '#7ab87a' }),
    pow: face({ hair: '#5a3a1a', glasses: true, shirt: '#333', bg: '#3a3a6a' }),
    safe: face({ hat: true, shirt: '#123', bg: '#6a7a9a' }),
    plan: face({ hair: '#c8902a', cap: '#e10600', shirt: '#2a8a2a', bg: '#b8a05a' }),
    env: face({ hair: '#3a2a1a', long: true, shirt: '#2a8a4a', bg: '#4a8ab8' }),
    kids: face({ hair: '#2a1a0a', cap: '#2a2ad8', shirt: '#e10600', bg: '#d87a2a' }),
    mom: face({ hair: '#7a3a1a', long: true, shirt: '#c06090', bg: '#e0b0c0' }),
    tra: face({ peak: '#1a3a7a', tache: '#6a4a2a', shirt: '#c0a020', bg: '#c8d8e8', skin: '#e8b890' }),
  };
  const ADV = {
    fin: ['Mrs Tuppence', 'Finance'], pow: ['Callum', 'Power & Utilities'], safe: ['Sgt. Bobby', 'Police & Fire'],
    plan: ['JackK', 'Planning'], tra: ['Mr Lane', 'Transport'], env: ['Ms Greenleaf', 'Environment'],
  };

  // ================================================================ the music (an original tune)
  try {
    if (window.Sound && Sound.addTune && !(Sound.tunes && Sound.tunes().includes('gcity'))) Sound.addTune('gcity', { step: 0.19, hats: true,
      lead: [72, 0, 76, -1, 79, -1, 76, 0, 74, 0, 77, -1, 81, -1, 77, 0, 76, 0, 79, -1, 84, -1, 81, 79, 77, -1, 76, -1, 74, -1, 0, 0,
        69, 0, 72, -1, 76, -1, 74, 72, 71, 0, 74, -1, 77, -1, 76, 74, 72, 0, 76, 79, 81, -1, 79, 77, 76, -1, 74, -1, 72, -1, 0, 0],
      bass: [48, 48, 55, 55, 50, 50, 57, 57, 52, 52, 59, 59, 53, 53, 55, 55, 45, 45, 52, 52, 50, 50, 55, 55, 48, 48, 53, 53, 55, 55, 48, 48] });
  } catch (e) {}

  const HEADLINES = [
    'LOCAL BOY CLAIMS DOG ATE HIS HOMEWORK. DOG UNAVAILABLE FOR COMMENT.',
    'DAVE AND LUKE QUEUE ALL NIGHT FOR NEW ULTRA 64 GAME. FALL ASLEEP. MISS NEW ULTRA 64 GAME.',
    'CALLUM UPGRADES TO 64 MB OF RAM: "IT FLIES NOW," HE SAYS. IT DOES NOT FLY.',
    'Y2K BUG: EXPERTS SAY PANIC A BIT, BUT NOT TOO MUCH, AND STOCK UP ON BEANS.',
    'DUCK SIGHTED IN BOATING LAKE. BOATING LAKE CLOSED. DUCK HAVING A LOVELY TIME.',
    'TRAFFIC CHAOS ON HIGH STREET CAUSED BY ONE VERY SLOW SNAIL.',
    'LOCAL CAT WINS BIGGEST WHISKERS CONTEST FOR SEVENTH YEAR RUNNING.',
    'MAYOR\'S MOM: "THE MAYOR MUST TIDY HIS ROOM BEFORE OPENING ANY MORE ROADS."',
    'WEATHER: DRIZZLE. THEN MORE DRIZZLE. OUTLOOK: DRIZZLY.',
    'JACKK DENIES BEING "THE SPARE JACK": "I WAS HERE FIRST," HE SAYS.',
    'LOCAL MAN BUYS 56K MODEM. PHONE BILL ARRIVES. LOCAL MAN SELLS 56K MODEM.',
    'NEW JACK BURGER FLAVOUR: "SURPRISE". NOBODY KNOWS WHAT IT IS.',
    'SUNDAY LEAGUE TEAM LOSES 14-0. MANAGER: "WE WERE UNLUCKY."',
    'CORNER SHOP SELLS OUT OF POGS. AGAIN.',
    'SCIENTISTS CONFIRM: EGGBERTS DO NOT NEED FEEDING DURING DOUBLE MATHS.',
    'COUNCIL TO REPAINT ALL ZEBRA CROSSINGS PURPLE "FOR A CHANGE".',
    'DAVE CLAIMS HIS UNCLE OWNS THE MOON. MOON DENIES IT.',
    'CITY LIBRARY FINALLY GETS A CD-ROM. QUEUE FOR ENCYCLOPAEDIA NOW 3 WEEKS.',
    'GIANT MILLENNIUM SANDCASTLE PLANNED FOR THE PARK. CITIZENS UNSURE.',
    'LUKE ASKS COUNCIL TO RENAME CITY "N64VILLE". COUNCIL SAYS NO. LUKE SULKS.',
    'POWER CUT: GRANDAD BLAMES "THEM COMPUTERS".',
    'MAYOR SEEN PLAYING JACKCITY 3000 IN OFFICE. "IT\'S RESEARCH," SAYS MAYOR.',
    'HOW MANY COUNCILLORS DOES IT TAKE TO CHANGE A LIGHTBULB? COMMITTEE FORMED.',
    'TOP OF THE POPS PRESENTER SPOTTED AT JACK BURGER. ORDERS "THE USUAL".',
  ];

  // ================================================================ the game
  D.mod('city', (G) => {
    G.css('dg-css-city', `
.dg-city-root{position:absolute;inset:0;display:flex;flex-direction:column;background:#c0c0c0;color:#000;font:11px/1.3 Tahoma,"MS Sans Serif",sans-serif;touch-action:none}
.dg-city-top{display:flex;align-items:center;gap:4px;padding:3px 4px;background:linear-gradient(#45557a,#1a2238);color:#fff;border-bottom:2px solid #000;flex-wrap:wrap;flex:none}
.dg-city-chip{background:#000;color:#7fe0ff;font:bold 12px/16px "Courier New",monospace;padding:0 4px;border:2px inset #667;white-space:nowrap}
.dg-city-chip.m{color:#9f9}.dg-city-chip.neg{color:#f66}.dg-city-chip.n{color:#ffd400;max-width:120px;overflow:hidden;text-overflow:ellipsis}
.dg-city-spd{display:flex;gap:1px;margin-left:auto}
.dg-city-spd button{font:bold 10px Tahoma,sans-serif;min-width:27px;height:22px;border:2px outset #fff;background:#c0c0c0;color:#000;padding:0 3px;cursor:pointer}
.dg-city-spd button.on{border-style:inset;background:#9ab}
.dg-city-mid{flex:1;display:flex;min-height:0}
.dg-city-tools{touch-action:pan-x pan-y;width:56px;flex:none;display:flex;flex-direction:column;gap:2px;padding:3px;background:#b0b0b0;border-right:2px solid #555;overflow:auto}
.dg-city-tb{width:48px;height:36px;flex:none;border:2px outset #fff;background:#c0c0c0;display:flex;flex-direction:column;align-items:center;justify-content:center;font:9px/1 Tahoma,sans-serif;cursor:pointer;padding:1px;color:#000}
.dg-city-tb svg{width:20px;height:20px;margin-bottom:1px}
.dg-city-tb.on{border-style:inset;background:#9ab}
.dg-city-view{flex:1;position:relative;background:#0a0a18;overflow:hidden;min-width:0;min-height:0}
.dg-city-view canvas.main{position:absolute;left:0;top:0;image-rendering:pixelated;touch-action:none}
.dg-city-mini{position:absolute;right:4px;bottom:4px;border:2px outset #fff;background:#000;width:98px;height:98px;image-rendering:pixelated;cursor:crosshair}
.dg-city-tick{height:18px;flex:none;background:#000;color:#ffd400;font:bold 12px/18px "Courier New",monospace;overflow:hidden;white-space:nowrap;position:relative;border-top:2px solid #444}
.dg-city-tick span{position:absolute;left:0;top:0;will-change:transform}
.dg-city-tick em{color:#7fe0ff;font-style:normal}
.dg-city-fly{position:absolute;z-index:6;background:#c0c0c0;border:2px outset #fff;box-shadow:3px 3px 0 rgba(0,0,0,.5);padding:3px;display:flex;flex-direction:column;gap:1px;max-height:80%;overflow:auto;min-width:190px}
.dg-city-fly button{display:flex;align-items:center;gap:6px;border:1px solid transparent;background:none;font:11px Tahoma,sans-serif;padding:3px 6px;text-align:left;cursor:pointer;color:#000;min-height:30px}
.dg-city-fly button:hover,.dg-city-fly button:focus{background:#000080;color:#fff;outline:none}
.dg-city-fly button svg{width:22px;height:22px;flex:none}
.dg-city-fly button small{margin-left:auto;padding-left:10px;opacity:.8}
.dg-city-fly button:disabled{opacity:.45}
.dg-city-fly .hd{font:bold 11px Tahoma,sans-serif;padding:2px 6px;background:linear-gradient(90deg,#000080,#1084d0);color:#fff}
.dg-city-modal{position:absolute;inset:0;z-index:12;background:rgba(0,0,20,.45);display:flex;align-items:center;justify-content:center;padding:8px}
.dg-city-dlg{background:#c0c0c0;border:2px outset #fff;box-shadow:4px 4px 0 rgba(0,0,0,.6);max-width:min(560px,100%);max-height:100%;display:flex;flex-direction:column;color:#000}
.dg-city-dlg > .t{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font:bold 11px Tahoma,sans-serif;padding:3px 6px;flex:none}
.dg-city-dlg > .b{padding:8px;overflow:auto;min-height:0}
.dg-city-dlg > .f{display:flex;gap:6px;justify-content:flex-end;padding:0 8px 8px;flex-wrap:wrap;flex:none}
.dg-city-dlg .btn{min-width:72px;min-height:26px}
.dg-city-adv{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px}
.dg-city-adv svg{flex:none;border:2px inset #fff}
.dg-city-adv p{margin:0 0 4px}
.dg-city-bud{display:grid;grid-template-columns:auto 1fr auto;gap:3px 8px;align-items:center}
.dg-city-bud input[type=range]{width:100%;min-width:90px}
.dg-city-bud h4{grid-column:1/-1;margin:6px 0 0;font:bold 11px Tahoma,sans-serif;border-bottom:1px solid #808080}
.dg-city-q{position:absolute;left:6px;top:6px;z-index:5;background:#ffffe1;border:1px solid #000;box-shadow:2px 2px 0 rgba(0,0,0,.5);padding:6px 8px;max-width:230px;font:11px/1.35 Tahoma,sans-serif;color:#000}
.dg-city-q b{color:#000080}
.dg-city-q button{position:absolute;right:2px;top:2px;border:1px outset #fff;background:#c0c0c0;font:bold 10px Tahoma,sans-serif;width:16px;height:16px;padding:0;line-height:12px}
.dg-city-pet{position:absolute;right:8px;top:8px;z-index:5;background:#c0c0c0;border:2px outset #fff;box-shadow:3px 3px 0 rgba(0,0,0,.5);width:min(300px,calc(100% - 16px));color:#000}
.dg-city-pet .t{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font:bold 11px Tahoma,sans-serif;padding:2px 6px}
.dg-city-pet .b{display:flex;gap:8px;padding:6px}
.dg-city-pet .b svg{flex:none;border:2px inset #fff}
.dg-city-pet .f{display:flex;gap:6px;justify-content:flex-end;padding:0 6px 6px}
.dg-city-title{position:absolute;inset:0;z-index:9;overflow:hidden;background:#000}
.dg-city-title canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;object-fit:cover}
.dg-city-logo{position:absolute;left:0;right:0;top:9%;text-align:center;pointer-events:none}
.dg-city-logo .a{font:italic 900 min(64px,12vw)/0.95 Impact,"Arial Black",sans-serif;color:#ffd400;letter-spacing:2px;text-shadow:3px 3px 0 #c00000,6px 6px 0 #000,0 0 18px rgba(255,200,0,.5);-webkit-text-stroke:1px #600}
.dg-city-logo .b{font:900 min(44px,9vw)/1 "Arial Black",Impact,sans-serif;color:#dfe8ff;letter-spacing:8px;text-shadow:2px 2px 0 #3a5ab8,4px 4px 0 #000;margin-top:2px}
.dg-city-logo .c{font:bold 11px "Courier New",monospace;color:#9cf;letter-spacing:3px;margin-top:8px;text-shadow:1px 1px 0 #000}
.dg-city-menu{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);display:flex;flex-direction:column;gap:5px;width:min(230px,80%)}
.dg-city-menu button{font:bold 14px "Arial Black",Tahoma,sans-serif;color:#fff;background:linear-gradient(#4a6ad8,#1a2a8a);border:3px outset #8af;padding:7px 10px;cursor:pointer;text-shadow:1px 1px 0 #000;letter-spacing:1px}
.dg-city-menu button:hover,.dg-city-menu button:focus{background:linear-gradient(#e83a1a,#8a1a0a);border-color:#f98;outline:none}
.dg-city-ver{position:absolute;left:6px;bottom:4px;font:10px "Courier New",monospace;color:#789}
.dg-city-slot{display:flex;align-items:center;gap:8px;padding:6px;border:1px solid #808080;margin-bottom:4px;background:#fff;cursor:pointer;min-height:36px}
.dg-city-slot:hover,.dg-city-slot.sel{background:#000080;color:#fff}
.dg-city-slot small{display:block;opacity:.8}
.dg-city-root.narrow .dg-city-mid{flex-direction:column}
.dg-city-root.narrow .dg-city-tools{order:2;width:auto;height:50px;flex-direction:row;border-right:0;border-top:2px solid #555;overflow-x:auto;overflow-y:hidden}
.dg-city-root.narrow .dg-city-tb{width:46px;height:42px}
.dg-city-root.narrow .dg-city-chip{font-size:11px;padding:0 4px}
.dg-city-root.narrow .dg-city-spd{margin-left:0}
.dg-city-root.narrow .dg-city-mini{width:74px;height:74px}
.dg-city-g{display:inline-flex;align-items:center;gap:3px}.dg-city-g svg{flex:none}
.dg-city-rci{display:flex;gap:3px;align-items:stretch;height:30px;background:#000;border:2px inset #667;padding:0 4px;position:relative;cursor:pointer;font:inherit;color:inherit}
.dg-city-rci span{position:relative;width:11px;display:block}
.dg-city-rci i{display:block;width:9px;left:1px;position:absolute;bottom:calc(100% - 13px)}
.dg-city-rci i.neg{top:13px;bottom:auto}
.dg-city-rci u{position:absolute;left:0;right:0;bottom:-1px;font:bold 7px/7px Tahoma,sans-serif;color:#aaa;text-decoration:none;text-align:center}
.dg-city-rci b{position:absolute;left:2px;right:2px;top:13px;border-top:1px solid #666}
.dg-city-chip.goal{font:bold 11px/16px "Courier New",monospace;color:#ffd400;cursor:pointer;max-width:200px;overflow:hidden;text-overflow:ellipsis}
.dg-city-chip.goal.won{color:#9f9}
.dg-city-tb:disabled{opacity:.4;cursor:default}
.dg-city-tb.hint,.dg-city-spd button.hint,.dg-city-fly button.hint{animation:dgCityHint .7s steps(2) infinite;position:relative;z-index:1}
@keyframes dgCityHint{0%{box-shadow:0 0 0 2px #ffd400,0 0 8px 2px #ffd400}50%{box-shadow:0 0 0 2px #e10600}}
.dg-city-fly .hd ~ .hd{margin-top:3px}
.dg-city-q{max-width:250px}
.dg-city-qt{border-collapse:collapse;margin:3px 0;font-size:11px}.dg-city-qt td{padding:0 3px 0 0}
.dg-city-qb{display:inline-block;width:70px;height:7px;background:#fff;border:1px solid #808080;vertical-align:middle;position:relative}.dg-city-qb i{position:absolute;left:0;top:0;bottom:0}
.dg-city-qb.big{width:100%;height:10px;display:block;margin:3px 0}
.dg-city-why{margin:4px 0;padding:3px 5px;background:#ffe0d0;border:1px solid #c66}.dg-city-why.ok{background:#dfd;border-color:#6a6}
.dg-city-tut{position:absolute;left:6px;bottom:6px;z-index:7;width:min(340px,calc(100% - 12px));background:#ffffe1;border:2px outset #fff;box-shadow:3px 3px 0 rgba(0,0,0,.55);color:#000;font:11px/1.35 Tahoma,sans-serif}
.dg-city-tut .t{display:flex;align-items:center;gap:6px;background:linear-gradient(90deg,#7a2a5a,#c06090);color:#fff;font:bold 11px Tahoma,sans-serif;padding:2px 3px 2px 6px}
.dg-city-tut .t span{flex:1}.dg-city-tut .t small{font-weight:normal;opacity:.9}
.dg-city-tut .t button{border:1px outset #fff;background:#c0c0c0;font:bold 10px Tahoma,sans-serif;width:18px;height:16px;padding:0;line-height:10px;color:#000}
.dg-city-tut .b{display:flex;gap:8px;padding:6px}.dg-city-tut .b svg{flex:none;border:2px inset #fff}
.dg-city-tut .f{display:flex;gap:3px;align-items:center;padding:0 6px 6px}
.dg-city-tut .f i{width:8px;height:8px;border:1px solid #808080;background:#fff;display:block}.dg-city-tut .f i.d{background:#3a3}.dg-city-tut .f i.c{background:#ffd400}
.dg-city-tut.mini .b,.dg-city-tut.mini .f{display:none}
.dg-city-visit{position:absolute;left:0;right:0;top:0;z-index:6;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;padding:4px 8px;background:repeating-linear-gradient(45deg,#ffd400 0 12px,#ffe86a 12px 24px);border-bottom:2px solid #000;color:#000;font:11px Tahoma,sans-serif}
.dg-city-visit .vt{flex:1 1 auto;min-width:0}.dg-city-visit .vt b{font-size:12px}
.dg-city-visit .vb{display:flex;gap:6px}.dg-city-visit .btn{min-height:26px}
.dg-city-visit .vr{background:#fff;border:1px solid #000;padding:0 4px}
.dg-city-root.visiting .dg-city-q{top:auto;bottom:6px}
.dg-city-root.visiting .dg-city-tb:not([data-t=query]):not([data-t=hand]):not([data-t="@data"]){opacity:.35}
.dg-city-root.visiting .dg-city-spd{display:none}
.dg-city-ledger{border-collapse:collapse;width:100%;font-size:11px}.dg-city-ledger td{padding:2px 4px;border-bottom:1px dotted #a0a0a0}.dg-city-ledger td:last-child{text-align:right;white-space:nowrap}.dg-city-ledger tr.tot td{font-weight:bold;border-top:1px solid #000}
.dg-city-info{display:flex;gap:10px;flex-wrap:wrap;max-width:560px}
.dg-city-info-l{flex:1 1 220px;min-width:0}.dg-city-info-r{flex:1 1 300px;min-width:0}
.dg-city-rating{margin:8px 0;padding:4px 6px;background:#fff;border:2px inset #fff}
.dg-city-goals{padding:4px 6px;background:#ffffe1;border:1px solid #808080}
.dg-city-gtabs{display:flex;gap:2px;margin-bottom:4px}.dg-city-gtabs .btn{min-width:0;min-height:24px;padding:0 8px}.dg-city-gtabs .btn.on{border-style:inset;background:#d8d8d8;font-weight:bold}
.dg-city-graph{width:100%;max-width:300px;height:auto;aspect-ratio:2/1;border:2px inset #fff;image-rendering:auto;display:block}
.dg-city-gkey{display:flex;gap:8px;flex-wrap:wrap;font-size:10px;margin-top:3px;align-items:center}.dg-city-gkey i{display:inline-block;width:10px;height:3px;margin-right:3px;vertical-align:middle}.dg-city-gkey small{margin-left:auto;color:#666}
.dg-city-stars{color:#e8a000;font-size:16px;letter-spacing:2px;text-shadow:1px 1px 0 #000}
p.dg-city-stars{font-size:28px;margin:0}
.dg-city-slot > svg{flex:none;width:28px;height:28px}
.dg-city-slot.off{opacity:.5;cursor:default}.dg-city-slot.off:hover{background:#fff;color:#000}
.dg-city-root.narrow .dg-city-chip[data-k=name],.dg-city-root.narrow .dg-city-chip[data-k=wat]{display:none}
.dg-city-root.narrow .dg-city-chip.goal{max-width:150px;font-size:10px}
.dg-city-root.narrow .dg-city-tut{top:6px;bottom:auto}
.dg-city-root.narrow .dg-city-q{top:auto;bottom:6px}
.dg-city-root.narrow .dg-city-visit{padding:3px 4px}
`);
    const host = G.host;
    host.style.display = 'block';
    const root = document.createElement('div'); root.className = 'dg-city-root';
    host.appendChild(root);

    // ================================================================ state
    let S = null;            // the save-able city
    let ter, typ, pl, zk, zd, lv, fire, anc; // tile arrays
    let blds = [];           // [{k, x, y}]
    const pow = new Uint8Array(NN), roadD = new Uint8Array(NN), poll = new Uint8Array(NN), crime = new Uint8Array(NN), lval = new Uint8Array(NN), traf = new Uint8Array(NN);
    const cov = { pol: new Uint8Array(NN), fir: new Uint8Array(NN), edu: new Uint8Array(NN), hea: new Uint8Array(NN), bus: new Uint8Array(NN) };
    const tmpA = new Float32Array(NN), tmpB = new Float32Array(NN);
    let P = 0, Jc = 0, Ji = 0, powCap = 0, powUse = 0, watCap = 0, watUse = 0, dR = 0, dC = 0, dI = 0, roadsN = 0, unpowered = 0, jams = 0;
    let dirtyWorld = true, dirtyRoads = true, dirtyPower = true, dirtyMaps = true;
    let speed = 2, paused = false, modals = 0, playing = false, tool = 'query', overlay = '', zoom = 1;
    let squig = null, tornado = null, quake = 0, cars = [], smokes = [], sessionStart = Date.now(), momDone = false, dead = false;
    let visiting = null;     // { name, title, entry, home } while looking round a neighbour's city (read-only)
    const fx = [];           // little feedback effects: { x, y (world px), t, k, s (text) }
    const idx = (x, y) => y * N + x;
    const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
    const waterShort = () => watUse > watCap;

    function blank(name, money) {
      ter = new Uint8Array(NN); typ = new Uint8Array(NN); pl = new Uint8Array(NN); zk = new Uint8Array(NN); zd = new Uint8Array(NN); lv = new Uint8Array(NN); fire = new Uint8Array(NN); anc = new Int16Array(NN).fill(-1);
      blds = []; squig = null; tornado = null; quake = 0; cars = []; fx.length = 0; undoRec = null;
      S = { v: 2, name: name || 'Jacksville', money: money == null ? 20000 : money, mo: 0, yr: 0, day: 0, rTax: 7, cTax: 7, iTax: 7, fund: { pol: 100, fir: 100, edu: 100, hea: 100, bus: 100 },
        ords: {}, unlock: {}, placed: {}, loans: [], maxP: 0, dis: true, months: 0, last: null, pets: {}, ms: {}, well: 40,
        hist: { p: [], j: [], m: [], r: [], c: [], i: [] }, deals: [], tips: {}, tut: -1, rating: 60, scen: null };
      dirtyWorld = dirtyRoads = dirtyPower = dirtyMaps = true;
    }
    function genMap(seed, kind) {
      const r = rng(seed);
      if (kind === 'river') {
        let x = 14 + r() * 20, w = 2;
        for (let y = 0; y < N; y++) { x += (r() - 0.5) * 1.6; x = clamp(x, 6, N - 8); w = clamp(w + (r() - 0.5) * 0.6, 1.6, 3.2); for (let k = Math.floor(x - w / 2); k <= Math.floor(x + w / 2); k++) if (inb(k, y)) ter[idx(k, y)] = WATER; }
      } else if (kind === 'lake') {
        const cx = 12 + r() * 24, cy = 12 + r() * 24, rad = 5 + r() * 3;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy); if (d < rad + Math.sin(a * 3 + seed) * 1.6 + Math.cos(a * 5) * 0.8) ter[idx(x, y)] = WATER; }
      } else if (kind === 'coast') {
        const side = Math.floor(r() * 2);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const t = side ? x : y, o = side ? y : x; if (t > N - 9 + Math.sin(o * 0.35 + seed) * 2.2 + Math.sin(o * 0.13) * 2) ter[idx(x, y)] = WATER; }
      } else if (kind === 'forest') {
        // a little pond so a Pumping Station is possible
        const cx = 8 + r() * 6, cy = 34 + r() * 6;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x - cx, (y - cy) * 1.3) < 2.6) ter[idx(x, y)] = WATER;
      }
      const blobs = kind === 'forest' ? 18 : 9;
      for (let b = 0; b < blobs; b++) {
        const cx = r() * N, cy = r() * N, rad = 1.5 + r() * 3.5;
        for (let y = Math.floor(cy - rad - 1); y <= cy + rad + 1; y++) for (let x = Math.floor(cx - rad - 1); x <= cx + rad + 1; x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) < rad + r() * 0.8 && ter[idx(x, y)] === GRASS) ter[idx(x, y)] = TREES;
      }
    }
    // Callum's city: a ready-made town to poke around in (the scenarios start from it too)
    function buildCallum(name, money) {
      blank(name || 'Callumton (Callum\'s)', money == null ? 4321 : money);
      genMap(1999, 'coast');
      const r = rng(77);
      for (let y = 6; y < 40; y++) for (let x = 4; x < 36; x++) if (ter[idx(x, y)] === TREES) ter[idx(x, y)] = GRASS;
      const roadAt = (x, y) => { const i = idx(x, y); if (ter[i] === TREES) ter[i] = GRASS; typ[i] = T_ROAD; zk[i] = 0; lv[i] = 0; };
      for (const y of [8, 14, 20, 26, 32]) for (let x = 6; x <= 34; x++) roadAt(x, y);
      for (const x of [6, 13, 20, 27, 34]) for (let y = 8; y <= 32; y++) roadAt(x, y);
      const fill = (x0, y0, x1, y1, k, d, maxL) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); if (typ[i] !== T_NONE || ter[i] === WATER) continue; ter[i] = GRASS; typ[i] = T_ZONE; zk[i] = k; zd[i] = d; lv[i] = 1 + Math.floor(r() * maxL); } };
      fill(7, 9, 12, 13, ZR, 0, 2); fill(14, 9, 19, 13, ZR, 0, 2); fill(21, 9, 26, 13, ZR, 0, 2); fill(28, 9, 33, 13, ZR, 0, 2);
      fill(7, 15, 12, 19, ZR, 1, 1); fill(14, 15, 19, 19, ZC, 1, 2); fill(21, 15, 26, 19, ZC, 0, 2); fill(28, 15, 33, 19, ZR, 0, 2);
      fill(7, 21, 12, 25, ZR, 0, 2); fill(14, 21, 19, 25, ZC, 0, 2); fill(21, 21, 26, 25, ZR, 0, 1); fill(28, 21, 33, 25, ZR, 0, 1);
      fill(7, 27, 12, 31, ZI, 0, 2); fill(14, 27, 19, 31, ZI, 1, 2); fill(21, 27, 26, 31, ZI, 0, 1);
      const put = (k, x, y) => { const b = BLD[k], sz = b.sz || 1; for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { const i = idx(x + dx, y + dy); typ[i] = T_ZONE; zk[i] = 0; lv[i] = 0; ter[i] = GRASS; } placeB(k, x, y, true); };
      put('coal', 4, 33); put('coal', 3, 26); put('police', 16, 17); put('fire', 9, 23); put('school', 24, 11); put('park', 23, 23); put('park', 30, 17); put('statue', 17, 15); put('wind', 4, 30); put('wind', 4, 29);
      put('wtower', 5, 11); put('wtower', 5, 17); put('wtower', 5, 22);
      S.mo = 9; S.yr = 0; S.maxP = 1700; S.placed.statue = 1; S.unlock.burger = 1; S.pets.burger = 1; S.rTax = 8; S.cTax = 8; S.iTax = 6;
      for (const x of [13, 20, 27]) for (const y of [11, 17, 23, 29]) pl[idx(x, y)] = 1;
      for (const y of [14, 20, 26]) for (const x of [10, 16, 23, 30]) pl[idx(x, y)] = 1;
      for (let y = 28; y <= 32; y++) pl[idx(5, y)] = 1; pl[idx(6, 28)] = 1; pl[idx(5, 27)] = 1;
      S.callum = 1;
      recalcAll();
      for (let k = 0, ch = 0; k < NN * 4 && P > 3100; k++) { const i = hash(k * 7 + 13) % NN; if (typ[i] === T_ZONE && lv[i] > 1 && zk[i] !== ZC) { lv[i]--; if (++ch % 10 === 0) computeTotals(); } }
      recalcAll();
      S.well = Math.max(40, Math.ceil(watUse * 1.05 - watCap + S.well)); // Callum "borrowed" the reservoir next door
      recalcAll();
      S.startP = P; S.ms = { village: 1, statue: 1 }; if (P >= 2000) S.ms.zoo = 1; if (P >= 3500) S.ms.mansion = 1;
    }

    // ================================================================ buildings
    function placeB(k, x, y, free) {
      const b = BLD[k], sz = b.sz || 1;
      blds.push({ k, x, y });
      for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { const i = idx(x + dx, y + dy); typ[i] = T_BLD; zk[i] = 0; lv[i] = 0; pl[i] = 0; ter[i] = GRASS; }
      reAnc();
      if (!free) S.money -= b.cost;
      if (b.reward) S.placed[k] = 1;
      dirtyWorld = dirtyPower = dirtyMaps = true;
    }
    function reAnc() { anc.fill(-1); blds.forEach((b, n) => { const sz = BLD[b.k].sz || 1; for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) anc[idx(b.x + dx, b.y + dy)] = n; }); }
    function removeB(n, rubble) {
      const b = blds[n]; if (!b) return; const sz = BLD[b.k].sz || 1;
      for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { const i = idx(b.x + dx, b.y + dy); typ[i] = rubble ? T_RUB : T_NONE; zk[i] = 0; fire[i] = 0; }
      if (BLD[b.k].reward) delete S.placed[b.k];
      blds.splice(n, 1); reAnc();
      dirtyWorld = dirtyPower = dirtyMaps = true;
    }
    const bldAt = i => anc[i] >= 0 ? blds[anc[i]] : null;
    const has = k => blds.some(b => b.k === k);
    const touchesWater = (x, y, sz) => { for (let dy = -1; dy <= sz; dy++) for (let dx = -1; dx <= sz; dx++) { if (dx >= 0 && dy >= 0 && dx < sz && dy < sz) continue; if (inb(x + dx, y + dy) && ter[idx(x + dx, y + dy)] === WATER) return true; } return false; };

    // ================================================================ simulation: derived maps
    function computeRoads() {
      roadD.fill(9); const q = []; roadsN = 0;
      for (let i = 0; i < NN; i++) if (typ[i] === T_ROAD) { roadD[i] = 0; q.push(i); roadsN++; }
      for (let h = 0; h < q.length; h++) { const i = q[h], d = roadD[i]; if (d >= 3) continue; const x = i % N, y = (i / N) | 0; for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (!inb(nx, ny)) continue; const j = idx(nx, ny); if (roadD[j] > d + 1) { roadD[j] = d + 1; q.push(j); } } }
      dirtyRoads = false;
    }
    const conducts = i => typ[i] === T_ZONE || typ[i] === T_BLD || pl[i];
    function usage(i) { if (typ[i] === T_ZONE) return lv[i] ? POP[zk[i] || 1][zd[i]][lv[i]] / 10 : 0.2; if (typ[i] === T_BLD) { const b = bldAt(i); return b ? (BLD[b.k].use || 0) / ((BLD[b.k].sz || 1) ** 2) : 0; } return 0; }
    const dealN = k => (S.deals || []).filter(d => d.k === k).length;
    function computePower() {
      pow.fill(0); powCap = 0; powUse = 0; unpowered = 0; watCap = S.well || 0; watUse = 0;
      const q = [], seen = new Uint8Array(NN);
      blds.forEach(b => { const d = BLD[b.k]; if (d.wat) watCap += d.wat; if (!d.cap) return; powCap += d.cap; const sz = d.sz || 1; for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { const i = idx(b.x + dx, b.y + dy); seen[i] = 1; pow[i] = 1; q.push(i); } });
      watCap += dealN('water') * 200;
      const sold = Math.min(powCap, dealN('power') * 100); // power promised to the neighbours goes first
      let left = powCap - sold; powUse = sold;
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % N, y = (i / N) | 0;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (!inb(nx, ny)) continue; const j = idx(nx, ny); if (seen[j] || !conducts(j)) continue;
          seen[j] = 1; q.push(j);
          const u = usage(j); if (left >= u) { left -= u; powUse += u; pow[j] = 1; }
        }
      }
      for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i]) { if (!pow[i]) unpowered++; else if (lv[i]) watUse += POP[zk[i]][zd[i]][lv[i]] / 12; }
      if (S.ords.hosepipe) watUse *= 0.85;
      dirtyPower = false;
    }
    function blur(src, dst, passes) {
      for (let p = 0; p < passes; p++) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; s += src[ny * N + nx]; c++; } dst[y * N + x] = s / c * 1.6; }
        src.set(dst);
      }
    }
    // traffic: every building sends its people and workers onto the roads within 2 tiles (3 if there are none closer)
    function computeTraffic() {
      tmpA.fill(0); jams = 0;
      for (let i = 0; i < NN; i++) {
        if (typ[i] !== T_ZONE || !lv[i]) continue;
        const v = POP[zk[i]][zd[i]][lv[i]], x = i % N, y = (i / N) | 0;
        for (let r = 2; r <= 3; r++) {
          let n = 0;
          for (let yy = Math.max(0, y - r); yy <= Math.min(N - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(N - 1, x + r); xx++) if (typ[yy * N + xx] === T_ROAD) n++;
          if (!n) continue;
          for (let yy = Math.max(0, y - r); yy <= Math.min(N - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(N - 1, x + r); xx++) if (typ[yy * N + xx] === T_ROAD) tmpA[yy * N + xx] += v / n;
          break;
        }
      }
      const k = (S.ords.carshare ? 0.85 : 1) * (S.ords.lollipop ? 1.08 : 1);
      for (let i = 0; i < NN; i++) { traf[i] = typ[i] === T_ROAD ? clamp(tmpA[i] * 0.8 * k * (1 - cov.bus[i] / 255 * 0.6), 0, 255) : 0; if (traf[i] > 170) jams++; }
    }
    function computeMaps() {
      // coverage from services
      for (const k in cov) cov[k].fill(0);
      blds.forEach(b => {
        const d = BLD[b.k]; if (!d.cov) return; const f = (S.fund[d.cov] == null ? 100 : S.fund[d.cov]) / 100, R = (d.small ? 3 : 5) + (d.small ? 2 : 5) * f, a = cov[d.cov], sz = d.sz || 1, cx = b.x + (sz - 1) / 2, cy = b.y + (sz - 1) / 2, pk = d.small ? 0.55 : 1;
        for (let y = Math.max(0, b.y - 11); y <= Math.min(N - 1, b.y + 11); y++) for (let x = Math.max(0, b.x - 11); x <= Math.min(N - 1, b.x + 11); x++) { const dd = Math.hypot(x - cx, y - cy); if (dd > R) continue; const v = 255 * pk * (1 - dd / (R + 1)) * (0.4 + 0.6 * f); const i = idx(x, y); if (v > a[i]) a[i] = v; }
      });
      computeTraffic();
      // pollution
      tmpA.fill(0);
      for (let i = 0; i < NN; i++) {
        if (typ[i] === T_ZONE && zk[i] === ZI) tmpA[i] = lv[i] * (zd[i] ? 48 : 30);
        else if (typ[i] === T_BLD) { const b = bldAt(i); if (b && b.k === 'coal') tmpA[i] = 230; else if (b && b.k === 'gas') tmpA[i] = 90; }
        else if (typ[i] === T_ROAD) tmpA[i] = traf[i] * 0.45;
      }
      if (S.ords.recycle) for (let i = 0; i < NN; i++) tmpA[i] *= 0.75;
      blur(tmpA, tmpB, 3);
      for (let i = 0; i < NN; i++) { let v = tmpA[i]; if (ter[i] === TREES) v -= 25; if (typ[i] === T_BLD) { const b = bldAt(i); if (b && b.k === 'park') v -= 50; } poll[i] = clamp(v, 0, 255); }
      // crime
      tmpA.fill(0);
      for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && (zk[i] === ZR || zk[i] === ZC) && lv[i]) tmpA[i] = lv[i] * (zd[i] ? 32 : 13) + 8;
      blur(tmpA, tmpB, 2);
      for (let i = 0; i < NN; i++) crime[i] = clamp(tmpA[i] * 1.3 - cov.pol[i] * 0.95 - (S.ords.lollipop ? 15 : 0), 0, 255);
      // land value
      tmpA.fill(0);
      for (let i = 0; i < NN; i++) { if (ter[i] === WATER) tmpA[i] = 70; else if (ter[i] === TREES) tmpA[i] = 30; if (typ[i] === T_BLD) { const b = bldAt(i); if (b && BLD[b.k].good) tmpA[i] = BLD[b.k].good; } }
      blur(tmpA, tmpB, 3);
      tmpB.set(traf); for (let i = 0; i < NN; i++) tmpB[i] = Math.max(0, traf[i] - 90); // only heavy traffic hurts
      for (let i = 0; i < NN; i++) {
        let jam = 0; const x = i % N, y = (i / N) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, y + dy)) jam = Math.max(jam, tmpB[idx(x + dx, y + dy)]);
        lval[i] = clamp(70 + tmpA[i] * 1.1 + (cov.edu[i] + cov.hea[i]) * 0.14 - poll[i] * 0.7 - crime[i] * 0.3 - jam * 0.3 + (S.ords.burgerfri ? 10 : 0), 0, 255);
      }
      dirtyMaps = false; if (overlay) dirtyWorld = true;
    }
    function computeTotals() {
      P = 0; Jc = 0; Ji = 0;
      for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && lv[i]) { const v = POP[zk[i]][zd[i]][lv[i]]; if (zk[i] === ZR) P += v; else if (zk[i] === ZC) Jc += v; else Ji += v; }
      const taxE = t => t > 7 ? -(t - 7) * 0.07 : (7 - t) * 0.035;
      const cb = blds.reduce((s, b) => s + (BLD[b.k].cb || 0), 0) + dealN('bus') * 0.05, rb = blds.reduce((s, b) => s + (BLD[b.k].rb || 0), 0);
      const tR = (Jc + Ji) * 1.9 + 160, tC = P * 0.27 + 30, tI = P * 0.33 + 70;
      dR = clamp((tR - P) / Math.max(160, tR * 0.5) + taxE(S.rTax) + (S.ords.nohw ? 0.08 : 0) + rb, -1, 1);
      dC = clamp((tC - Jc) / Math.max(50, tC * 0.5) + taxE(S.cTax) + cb + (S.ords.tourism ? 0.12 : 0), -1, 1);
      dI = clamp((tI - Ji) / Math.max(70, tI * 0.5) + taxE(S.iTax), -1, 1);
      if (P > S.maxP) S.maxP = P;
    }
    function recalcAll() { computeRoads(); computePower(); computeTotals(); computeMaps(); dirtyWorld = true; }

    // ================================================================ simulation: the daily tick
    // why a zone lot isn't growing (for the Query tool and the advisors): '' when it can grow
    function blocker(i) {
      const k = zk[i]; if (!k) return '';
      if (!pow[i]) return 'No power. Run a Power Line to it (yellow bolt).';
      if (roadD[i] > 3) return 'Too far from a road. Lots need a road within 3 tiles.';
      const dem = k === ZR ? dR : k === ZC ? dC : dI;
      if (dem <= -0.05) return 'Nobody wants more ' + (k === ZR ? 'houses' : k === ZC ? 'shops' : 'factories') + ' right now (see the R C I demand bars).';
      const max = MAXLV[zd[i]]; if (lv[i] >= max) return '';
      if ((lv[i] >= 1 || zd[i]) && waterShort()) return 'Needs water to grow bigger. Build a Water Tower or a Pumping Station.';
      const need = lv[i] === 2 ? (k === ZR ? 700 : k === ZC ? 1200 : 900) : lv[i] === 1 && zd[i] ? 150 : 0;
      if (P < need) return `Waits for a bigger town (${num(need)} people) before it grows taller.`;
      if (lv[i] >= 1 && desire(i) < needDes(lv[i])) {
        if (k === ZI) return 'Land is too pricey here for a bigger factory.';
        if (crime[i] > 70 && crime[i] >= poll[i]) return 'Too much crime round here to grow bigger. A Police Station nearby would sort it.';
        if (poll[i] > 60) return 'Too smoky round here to grow bigger. Keep factories and power plants further away, or plant a park.';
        return 'Land value too low to grow bigger. Parks, schools, hospitals, trees and water nearby help; pollution and crime hurt.';
      }
      return '';
    }
    const needDes = l => l === 1 ? 0.08 : 0.26; // how nice a lot must be to grow from size l to l+1
    function desire(i) {
      const k = zk[i], L = lval[i] / 255;
      let jam = 0; const x = i % N, y = (i / N) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (inb(x + dx, y + dy)) jam = Math.max(jam, traf[idx(x + dx, y + dy)]);
      return k === ZR ? L + (cov.edu[i] + cov.hea[i]) / 1600 - poll[i] / 380 - crime[i] / 700 - Math.max(0, jam - 150) / 500
        : k === ZC ? L * 0.8 + (roadD[i] <= 1 ? 0.2 : 0) - crime[i] / 600 - Math.max(0, jam - 190) / 600 : 0.55 + (roadD[i] <= 1 ? 0.15 : 0) - L * 0.1;
    }
    function growTile(i) {
      const k = zk[i]; if (!k) return;
      const ok = roadD[i] <= 3 && pow[i];
      if (!ok) { if (lv[i] && Math.random() < 0.12) { lv[i]--; dirtyWorld = true; } return; }
      const dem = k === ZR ? dR : k === ZC ? dC : dI, des = desire(i), max = MAXLV[zd[i]];
      if (lv[i] && lv[i] >= 2 && watUse > watCap * 1.25 && Math.random() < 0.05) { lv[i]--; dirtyWorld = true; return; }
      if (lv[i] < max && dem > -0.05) {
        if ((lv[i] >= 1 || zd[i]) && waterShort()) return;
        const need = lv[i] === 2 ? (k === ZR ? 700 : k === ZC ? 1200 : 900) : lv[i] === 1 && zd[i] ? 150 : 0;
        if (P < need) return;
        if (lv[i] >= 1 && des < needDes(lv[i])) return;
        if (Math.random() < (0.14 + dem * 0.38 + (des - 0.5) * 0.25) * (lv[i] ? 0.75 : 1)) { lv[i]++; dirtyWorld = true; dirtyPower = true; puff(i, 'up'); }
      } else if (lv[i] && (dem < -0.35 || des < 0.08) && Math.random() < 0.08) { lv[i]--; dirtyWorld = true; }
    }
    function flammable(i) { return (typ[i] === T_ZONE && lv[i]) || (typ[i] === T_BLD) || ter[i] === TREES && typ[i] === T_NONE; }
    function startFire(i) { if (flammable(i) && !fire[i]) { fire[i] = 1; dirtyWorld = true; return true; } return false; }
    function destroy(i, burnt) {
      if (typ[i] === T_BLD) { const n = anc[i]; if (n >= 0) removeB(n, true); return; }
      if (typ[i] === T_ZONE && lv[i]) { typ[i] = T_RUB; lv[i] = 0; }
      else if (typ[i] === T_ROAD && !burnt) { typ[i] = T_RUB; zk[i] = 0; dirtyRoads = true; }
      if (ter[i] === TREES) ter[i] = GRASS;
      pl[i] = 0; fire[i] = 0;
      dirtyWorld = dirtyPower = dirtyMaps = true;
    }
    function step() {
      if (dirtyRoads) computeRoads();
      if (dirtyPower) computePower();
      computeTotals();
      // growth: sample zone tiles
      for (let n = 0; n < 60; n++) { const i = rnd(NN); if (typ[i] === T_ZONE) growTile(i); }
      // fires
      for (let i = 0; i < NN; i++) {
        if (!fire[i]) continue;
        fire[i]++;
        const c = cov.fir[i] / 255;
        if (fire[i] > 6 && Math.random() < 0.015 + c * 0.1) { fire[i] = 0; dirtyWorld = true; if (typ[i] === T_ZONE && lv[i] > 1 && Math.random() < 0.5) lv[i]--; continue; }
        if (fire[i] > 45) { destroy(i, true); continue; }
        if (Math.random() < 0.09 * (1 - c * 0.8)) { const x = i % N, y = (i / N) | 0, d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); if (inb(x + d[0], y + d[1])) startFire(idx(x + d[0], y + d[1])); }
      }
      // rubble clears itself (slowly)
      for (let n = 0; n < 12; n++) { const i = rnd(NN); if (typ[i] === T_RUB && Math.random() < 0.06) { typ[i] = zk[i] ? T_ZONE : T_NONE; lv[i] = 0; dirtyWorld = true; } }
      S.day++;
      if (S.day % 6 === 0 || dirtyMaps) computeMaps();
      if (S.day >= 30) { S.day = 0; month(); }
      if (undoRec && ++undoRec.days > 45) { undoRec = null; undoBtn(); }
      if (S.tut >= 0 && S.day % 3 === 0) tutorialCheck();
      updateTop();
    }

    // ================================================================ month end: money, news, events
    function upkeep() {
      const e = { roads: Math.round(roadsN * 0.25), pol: 0, fir: 0, edu: 0, hea: 0, bus: 0, power: 0, water: 0, other: 0, ord: 0, loans: 0, deals: 0 };
      blds.forEach(b => { const d = BLD[b.k]; if (!d.up) return; if (d.cov) e[d.cov] += d.up * (S.fund[d.cov] == null ? 100 : S.fund[d.cov]) / 100; else if (d.cap) e.power += d.up; else if (d.wat) e.water += d.up; else e.other += d.up; });
      for (const k in S.ords) if (S.ords[k] && ORDS[k]) e.ord += ORDS[k].c;
      S.loans.forEach(l => { e.loans += l.pay; });
      const inc = Math.round((P * S.rTax + Jc * S.cTax + Ji * S.iTax) * 0.035);
      const dIn = (S.deals || []).reduce((s, d) => s + (DEALS[d.k] ? DEALS[d.k].pay : 0), 0);
      e.deals = -dIn; // negative cost = income
      let tot = 0; for (const k in e) { e[k] = Math.round(e[k]); tot += e[k]; }
      return { inc, e, tot, dIn };
    }
    // the Mayor's approval rating, 0-100 (shown in City Info; the voters grumble about whatever is worst)
    function rateMayor() {
      let n = 0, cr = 0, po = 0;
      for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i] === ZR && lv[i]) { n++; cr += crime[i]; po += poll[i]; }
      const workers = P * 0.55, jobs = Jc + Ji, unemp = workers > 50 ? clamp((workers - jobs) / workers, 0, 1) : 0;
      const tax = (S.rTax + S.cTax + S.iTax) / 3, zones = (() => { let z = 0; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i]) z++; return z; })();
      const parts = {
        tax: -Math.max(0, tax - 7) * 4, crime: n ? -cr / n / 4 : 0, poll: n ? -po / n / 4 : 0, jobs: -unemp * 35,
        power: zones ? -unpowered / zones * 35 : 0, water: waterShort() ? -10 : 0, traffic: -Math.min(15, jams * 0.6), money: S.money < 0 ? -10 : 0,
        fun: Math.min(12, blds.filter(b => BLD[b.k].good).length * 1.5),
      };
      let r = 66; for (const k in parts) r += parts[k];
      S.rating = Math.round(clamp(r, 0, 100));
      return parts;
    }
    function month() {
      const u = upkeep();
      S.money += u.inc - u.tot; S.last = u;
      S.loans.forEach(l => { l.left--; }); S.loans = S.loans.filter(l => l.left > 0);
      S.mo++; S.months++;
      rateMayor();
      const H = S.hist; H.p.push(P); H.j.push(Jc + Ji); H.m.push(Math.round(S.money)); H.r.push(Math.round(dR * 100)); H.c.push(Math.round(dC * 100)); H.i.push(Math.round(dI * 100));
      for (const k in H) if (H[k].length > 120) H[k].splice(0, H[k].length - 120);
      if (S.mo >= 12) {
        S.mo = 0; S.yr++;
        if (S.yr === 1) { news('MILLENNIUM BUG HITS JACKCITY: TOWN HALL CALENDAR NOW SAYS "JANUARY 19100". MAYOR: "LOOKS FINE TO ME."', true); G.toast('Happy New Year!', 'The town hall computer says it\'s the year 19100. Callum says that\'s the millennium bug. Nobody panic.', 7000); }
        else news('HAPPY NEW YEAR ' + yearStr(S.yr) + '! FIREWORKS SCARE THE DOG. DOG SCARES FIREWORKS.', true);
        autosave();
      }
      milestones();
      if (S.deals && S.deals.length && S.months % 6 === 0) news(pick(['NEIGHBOUR DEAL PAYS OFF: ', 'TRADE NEWS: ']) + 'JACKCITY AND ' + String(pick(S.deals).city).toUpperCase() + ' "GETTING ON LIKE A HOUSE ON FIRE". FIRE BRIGADE ON STANDBY.');
      // money trouble
      if (S.money < 0 && S.money > -10000 && S.mo % 3 === 0) pet('fin', 'We\'re in the red, Mayor! ' + fmt(S.money) + '. Raise taxes, cut funding or take a loan in the Budget window. And stop building things.', [['Budget', () => budget()], ['Later']]);
      if (S.money < -10000) return gameOver();
      if (scenTick()) return;
      if (S.dis && P > 150) { const r = Math.random(); if (r < 0.03) randomFire(); else if (P > 800 && r < 0.042) startTornado(); else if (P > 1200 && r < 0.048) startQuake(); else if (P > 1500 && r < 0.054) startSquig(); }
      if (!advisorTip()) petitions();
      if (!momDone && Date.now() - sessionStart > 20 * 60000) { momDone = true; pet('mom', 'JACK! It\'s a SCHOOL NIGHT! Ten more minutes and then that computer goes OFF. I mean it this time.', [['OK Mom', () => {}], ['5 more minutes', () => G.toast('Mom', 'TEN minutes. Not twenty. I\'m counting.', 5000)]]); }
      if (G.demo && (S.months >= 24 || P >= 2000 && !S.callum)) { playing = false; dead = true; AS.clear(); G.stopMusic(); if (tickAnim) { tickAnim.onfinish = null; tickAnim.cancel(); } G.timer(() => { const d = G.demoEnd('You\'ve built a whole town in two years! The full version of JackCity 3000 has no time limit, cities of 50,000 people, the City Zoo, the Mayor\'s Mansion and Jack\'s Mega Arcade.'); void d; }, 200); }
      if (Math.random() < 0.5) news(contextNews() || pick(HEADLINES));
    }
    const STEPS = [[500, 'village', 'Village', 'JackCity is now a VILLAGE!', 'Population 500! The residents have built a duck pond and a bus stop. The bus never comes.'],
      [800, 'statue', 'Statue', 'Reward: Statue of Jack', 'Population 800! The town wants a statue of you. Find it in the Rewards menu (the trophy) and put it somewhere nice.'],
      [2000, 'zoo', 'Town', 'JackCity is now a TOWN! Reward: City Zoo', 'Population 2,000! You can now build the City Zoo from the Rewards menu.'],
      [3500, 'mansion', 'Mansion', 'Reward: Mayor\'s Mansion', 'Population 3,500! The council has voted to give you a mansion. (With a bouncy castle.)'],
      [5000, 'arcade', 'City', 'JackCity is now a CITY!', 'Population 5,000! You\'re a real Mayor now. Reward: Jack\'s Mega Arcade (Luke and Dave have already moved in).'],
      [8000, 'mast', 'Big City', 'Reward: JackTV Mast', 'Population 8,000! JackCity gets its own telly channel. It mostly shows the Mayor waving.'],
      [12000, 'rocket', 'METROPOLIS', 'JackCity is a METROPOLIS!', 'Population 12,000! Reward: a Rocket Launch Pad. Mom says you\'re not allowed on it.']];
    function milestones() {
      for (const [p, k, , t, x] of STEPS) if (S.maxP >= p && !S.ms[k]) {
        S.ms[k] = 1; G.sfx('solve');
        if (p === 5000 && (S.startP || 0) < 2000) G.secret('city.big');
        if (!visiting) modal(t, `<div class="dg-city-adv">${FACES.plan}<div><p><b>${esc(t)}</b></p><p>${esc(x)}</p></div></div>`, [['Hooray!']]);
        news(t.toUpperCase().replace('REWARD:', '- REWARD:'), true);
        break;
      }
    }
    function nextGoal() { for (const [p, k, name] of STEPS) if (!S.ms[k] && S.maxP < p) return [p, name]; return null; }
    function gameOver() {
      playing = false; AS.clear();
      modal('IMPEACHED!', `<div class="dg-city-adv">${FACES.mom}<div><p><b>The voters have run you out of town!</b></p><p>JackCity owes ${fmt(-S.money)}. The council has sold the town hall at a car boot sale. Mom says you're grounded from being Mayor.</p></div></div>`, [['Load a city', () => loadDlg()], ['Title screen', () => titleScreen()]], true);
    }
    function contextNews() {
      const l = [];
      if (unpowered > 6) l.push('BLACKOUT! ' + unpowered + ' BUILDINGS HAVE NO POWER. FAMILIES EAT TEA BY CANDLELIGHT.');
      if (waterShort()) l.push('TAPS RUN DRY! RESIDENTS WASH IN LEMONADE. "IT\'S STICKY," SAYS GRANDAD.');
      if (jams > 4) l.push('TRAFFIC JAM ON THE HIGH STREET NOW SO LONG IT HAS ITS OWN POSTCODE.');
      if (S.rTax > 11) l.push('RESIDENTS GRUMBLE ABOUT ' + S.rTax + '% TAXES: "I\'D RATHER LIVE IN A BIN."');
      if (S.money < 1000) l.push('CITY TREASURY NOW CONTAINS ' + fmt(S.money).toUpperCase() + ', A BUTTON AND SOME FLUFF.');
      const avgP = poll.reduce((a, b) => a + b, 0) / NN; if (avgP > 35) l.push('SMOG ALERT: GRANNIES ADVISED TO STAY INDOORS AND WATCH COUNTDOWN.');
      if (P > 400 && !has('police')) l.push('CRIME WAVE: SOMEONE NICKED ALL THE GARDEN GNOMES. "WE NEED A POLICE STATION," SAY RESIDENTS.');
      if (dR > 0.6) l.push('HOUSING SHORTAGE! PEOPLE SLEEPING IN THEIR SHEDS. ZONE MORE RESIDENTIAL!');
      if (dC > 0.6) l.push('SHOPS WANTED: CITIZENS HAVE TO GO TO THE NEXT TOWN FOR CRISPS.');
      if (dI > 0.6) l.push('FACTORIES WANTED: BUILDERS HAVE NOTHING TO HIT WITH HAMMERS.');
      if (S.rating > 80) l.push('POLL: ' + S.rating + '% OF CITIZENS THINK THE MAYOR IS "ACE". THE REST THINK HE IS "WICKED".');
      else if (S.rating < 35 && P > 100) l.push('POLL: ONLY ' + S.rating + '% OF CITIZENS LIKE THE MAYOR. THE REST HAVE WRITTEN TO THEIR NAN.');
      if (P > 0) l.push('JACKCITY POPULATION NOW ' + num(P) + '. MAYOR "QUITE CHUFFED".');
      return l.length && Math.random() < 0.7 ? pick(l) : null;
    }
    // petitioners pop up with requests
    function petitions() {
      if (petEl || visiting || S.tut >= 0 || Math.random() > 0.3) return;
      const opts = [];
      if (P > 150 && !S.pets.burger) opts.push(() => { S.pets.burger = 1; pet('plan', 'Mayor! Everyone wants a Jack Burger stand. Can we have one? Pleeeease? It boosts shops AND it\'s delicious.', [['Yes!', () => { S.unlock.burger = 1; G.sfx('solve'); G.toast('JackCity 3000', 'Jack Burger Stand added to the Services menu (the shield).', 5000); news('MAYOR APPROVES JACK BURGER STAND. PEOPLE DANCE IN STREETS.', true); }], ['No', () => news('MAYOR SAYS NO TO JACK BURGERS. JACKK "DEVASTATED".', true)]]); });
      if (P > 300 && !S.pets.nohw) opts.push(() => { S.pets.nohw = 1; pet('kids', 'Luke and Dave here. Can you make a law: No Homework on Fridays? Then we can play ULTRA 64 all Friday night. Residents will LOVE it.', [['Pass the law', () => { S.ords.nohw = 1; news('NO HOMEWORK ON FRIDAYS! LUKE AND DAVE CARRIED THROUGH TOWN ON SHOULDERS.', true); }], ['Absolutely not', () => news('HOMEWORK STAYS. LUKE AND DAVE "WILL BE WRITING TO THEIR MP".', true)]]); });
      if (P > 600 && !has('park') && !S.pets.park) opts.push(() => { S.pets.park = 1; pet('plan', 'JackK here. Can we have a park? Somewhere to skateboard. Parks make land worth more too. I read it in a book. (A Ladybird book.)', [['Build a park', () => setTool('b:park')], ['Later']]); });
      if (P > 400 && S.iTax > 6 && !S.pets.mek) opts.push(() => { S.pets.mek = 1; pet('fin', 'The factory owners want lower taxes on factories. They say they\'ll "build loads more" if you say yes.', [['Cut industry tax', () => { S.iTax = Math.max(0, S.iTax - 1); computeTotals(); updateTop(); }], ['No', () => {}]]); });
      if (P > 1000 && !S.pets.tour) opts.push(() => { S.pets.tour = 1; pet('fin', 'A proposal, Mayor: a "Visit JackCity!" tourism campaign. Posters of Jack on every bus. ' + fmt(60) + ' a month. Shops will love it.', [['Approve', () => { S.ords.tourism = 1; }], ['Decline', () => {}]]); });
      if (P > 1800 && !S.pets.rovers) opts.push(() => { S.pets.rovers = 1; pet('kids', 'JackCity Rovers want a proper stadium! They play on the rec at the moment and the ball keeps going in the duck pond. (It\'s in the Services menu.)', [['Show me', () => setTool('b:stadium')], ['Maybe later', () => {}]]); });
      if (opts.length) pick(opts)();
    }

    // ================================================================ disasters
    function randomFire() { const l = []; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && lv[i] && (zk[i] === ZI || Math.random() < 0.3)) l.push(i); if (l.length) { const i = pick(l); startFire(i); alertAt(i, 'FIRE!', 'A fire has broken out! Fire stations nearby will put it out. Bulldoze around it to stop it spreading.'); } }
    function fireDisaster() { const l = []; for (let i = 0; i < NN; i++) if (flammable(i) && (typ[i] !== T_NONE)) l.push(i); if (!l.length) return G.toast('Disasters', 'There\'s nothing to set on fire. Build something first!', 4000); const i = pick(l); startFire(i); alertAt(i, 'FIRE!', 'A fire has broken out! People are running about shouting.'); }
    function startTornado() { if (tornado) return; const x = rnd(N), y = rnd(N); tornado = { x, y, t: 0, a: Math.random() * 6.28, life: 14 }; alertAt(idx(x, y), 'WHIRLWIND!', 'A big whirlwind is spinning across JackCity. Hold onto your hats.'); G.sfx('turn'); }
    function startQuake() {
      if (quake) return; quake = 2.5; shake = 2.5;
      let hit = 0; for (let k = 0; k < 40; k++) { const i = rnd(NN); if (typ[i] === T_ZONE && lv[i] || typ[i] === T_ROAD) { if (Math.random() < 0.35) startFire(i); else destroy(i); hit++; } }
      alertAt(idx(N >> 1, N >> 1), 'EARTHQUAKE!', 'The ground is wobbling like a jelly at a birthday party! ' + hit + ' things have fallen over. Bulldoze the rubble and rebuild.');
      G.sfx('thud'); G.sfx('crt');
    }
    function startSquig() {
      if (squig) return;
      // walk from an edge towards the busiest part of town and out the other side
      let sx = 0, sy = 0, n = 0; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && lv[i]) { sx += i % N; sy += (i / N) | 0; n++; }
      const cx = n ? sx / n : N / 2, cy = n ? sy / n : N / 2, ang = Math.random() * 6.283;
      const x0 = cx + Math.cos(ang) * 13, y0 = cy + Math.sin(ang) * 13;
      squig = { x: x0, y: y0, x0, y0, vx: -Math.cos(ang) * 1.8, vy: -Math.sin(ang) * 1.8, t: 0, stomp: 0.8, life: 0, pokes: 0, ouch: 0, popAt: P };
      alertAt(idx(clamp(Math.round(cx), 0, N - 1), clamp(Math.round(cy), 0, N - 1)), 'BLOB ATTACK!!!', 'A GIANT BLOB has oozed out of the bog and is heading for town! It\'s hungry. It\'s angry. It\'s mostly teeth. Click on it to poke it with a stick: three pokes and it goes home.');
      G.sfx('thud'); G.sfx('uhoh'); news('GIANT BLOB SPOTTED HEADING FOR TOWN! CITIZENS ADVISED TO HIDE BEHIND SOMETHING BIG.', true);
    }
    // poke the blob: it turns round in a huff; three pokes and it goes home early
    function pokeBlob() {
      const s = squig; if (!s || s.ouch > 0) return false;
      s.pokes++; s.ouch = 0.8; G.sfx('boing'); shake = 0.15;
      const a = Math.atan2(s.vy, s.vx) + Math.PI * (0.6 + Math.random() * 0.8); s.vx = Math.cos(a) * 1.8; s.vy = Math.sin(a) * 1.8;
      const [px, py] = tp(s.x, s.y); fx.push({ x: px, y: py - 40, t: 0, k: 'txt', s: ['OI!', 'OUCH!', 'HMPH!'][Math.min(2, s.pokes - 1)], c: '#b6ff3a' });
      if (s.pokes >= 3) { s.leaving = 1; G.secret('city.poke'); news('MAYOR POKES GIANT BLOB WITH A STICK. BLOB GOES HOME IN A HUFF. "RUDE," SAYS BLOB.', true); }
      else G.status('You poked the blob! (' + s.pokes + ' of 3.) It doesn\'t like that.');
      return true;
    }
    function alertAt(i, t, x) { if (visiting) return; centerOn(i % N, (i / N) | 0); G.status(t + ' ' + x); news(t + ' ' + x.toUpperCase(), true); G.sfx('uhoh'); }
    function updateDisasters(dt) {
      if (quake > 0) quake = Math.max(0, quake - dt);
      if (squig) {
        const s = squig; s.t += dt; s.life += dt; if (s.ouch > 0) s.ouch -= dt;
        const sp = s.leaving ? 2.2 : 1; s.x += s.vx * dt * sp; s.y += s.vy * dt * sp;
        s.stomp -= dt;
        if (s.stomp <= 0 && !s.leaving) {
          s.stomp = 0.45;
          const x = Math.round(s.x), y = Math.round(s.y);
          for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) { if (!inb(x + dx, y + dy) || (dx || dy) && Math.random() < 0.5) continue; const i = idx(x + dx, y + dy); if (typ[i] !== T_NONE || ter[i] === TREES) { if (Math.random() < 0.3) startFire(i); else destroy(i); } }
          G.sfx('thud'); shake = 0.25;
        }
        if (s.life > 3 && (s.x < -3 || s.y < -3 || s.x > N + 2 || s.y > N + 2 || (!s.leaving && Math.hypot(s.x - s.x0, s.y - s.y0) > 27)) || s.life > 25) {
          squig = null; G.sfx('boing');
          news('THE GIANT BLOB HAS GONE HOME FOR ITS TEA. CLEAN-UP BEGINS. "IT WASN\'T THAT BAD," SAYS NOBODY.', true);
          if (P > 0) G.secret('city.squig');
          if (S.scen) S.scen.blobDone = 1;
          G.toast('JackCity 3000', 'The blob has gone! Bulldoze the rubble and rebuild.', 5000);
        }
      }
      if (tornado) {
        const t = tornado; t.t += dt; t.a += (Math.random() - 0.5) * dt * 3;
        t.x += Math.cos(t.a) * dt * 2.2; t.y += Math.sin(t.a) * dt * 2.2;
        const x = Math.round(t.x), y = Math.round(t.y);
        if (inb(x, y) && Math.random() < dt * 5) { const i = idx(x, y); if (typ[i] !== T_NONE || ter[i] === TREES) destroy(i); }
        if (t.t > t.life || !inb(x, y) && t.t > 2) { tornado = null; news('WHIRLWIND BLOWS ITSELF OUT. GRANDAD\'S SHED FOUND IN NEXT COUNTY.', true); }
      }
    }
    let shake = 0;
    // a little puff of feedback over a tile (growth sparkle, build dust, cost text)
    function puff(i, k, s, c) { if (fx.length > 40) return; const [px, py] = tp(i % N, (i / N) | 0); fx.push({ x: px, y: py + 8, t: 0, k, s, c }); }

    // ================================================================ rendering: the world (cached), drawn only when something changes
    const world = document.createElement('canvas'); world.width = WW; world.height = WH;
    const wc = world.getContext('2d');
    const tp = (x, y) => [(x - y) * 16 + OX, (x + y) * 8 + OY]; // tile top vertex
    function dia(c, px, py, s, fill) { const cy = py + 8; c.beginPath(); c.moveTo(px, cy - 8 * s); c.lineTo(px + 16 * s, cy); c.lineTo(px, cy + 8 * s); c.lineTo(px - 16 * s, cy); c.closePath(); c.fillStyle = fill; c.fill(); }
    function poly(c, p, fill) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fillStyle = fill; c.fill(); }
    // an isometric box centred on (cx, cy) (the middle of its footprint), half-size s tiles, H pixels tall
    function box(c, cx, cy, s, H, top, left, right) {
      const hw = 16 * s, hh = 8 * s;
      poly(c, [cx - hw, cy, cx, cy + hh, cx, cy + hh - H, cx - hw, cy - H], left);
      poly(c, [cx, cy + hh, cx + hw, cy, cx + hw, cy - H, cx, cy + hh - H], right);
      poly(c, [cx, cy - hh - H, cx + hw, cy - H, cx, cy + hh - H, cx - hw, cy - H], top);
    }
    function hip(c, cx, cy, s, H, rh, l, r) { const hw = 16 * s, hh = 8 * s, ay = cy - H - rh; poly(c, [cx - hw, cy - H, cx, cy + hh - H, cx, ay], l); poly(c, [cx, cy + hh - H, cx + hw, cy - H, cx, ay], r); }
    function windows(c, cx, cy, s, H, floors, cols, seed, lit, dark, bot) {
      const hw = 16 * s, hh = 8 * s, fh = (H - (bot || 3)) / floors;
      for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) / cols, on = (hash(seed + f * 31 + k * 7) & 7) < 3;
        // left face: from (cx-hw, cy) to (cx, cy+hh)
        let x = cx - hw + t * hw, y = cy + t * hh - H + 2 + f * fh;
        c.fillStyle = on ? lit : dark; c.fillRect(Math.round(x) - 1, Math.round(y), 2, Math.max(1, Math.min(3, fh - 1)));
        x = cx + t * hw; y = cy + hh - t * hh - H + 2 + f * fh;
        c.fillStyle = (hash(seed + f * 13 + k * 3 + 99) & 7) < 3 ? lit : dark; c.fillRect(Math.round(x) - 1, Math.round(y), 2, Math.max(1, Math.min(3, fh - 1)));
      }
    }
    const GR = ['#4f9a3a', '#55a03e', '#4a9436', '#53a23c'];
    const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = clamp(Math.round(r * f), 0, 255); g = clamp(Math.round(g * f), 0, 255); b = clamp(Math.round(b * f), 0, 255); return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); };
    function ground(c, i, px, py) {
      if (ter[i] === WATER) {
        dia(c, px, py, 1, (hash(i) & 1) ? '#2a5cc0' : '#2856b8');
        c.fillStyle = 'rgba(160,200,255,.5)'; const h = hash(i); c.fillRect(px - 6 + (h & 7), py + 6 + ((h >> 3) & 3), 4, 1);
        return;
      }
      dia(c, px, py, 1, GR[hash(i) & 3]);
      if ((hash(i) & 15) === 3) { c.fillStyle = '#6ab84a'; c.fillRect(px - 3, py + 7, 1, 1); c.fillRect(px + 5, py + 10, 1, 1); }
    }
    function trees(c, i, px, py) {
      const h = hash(i), n = 2 + (h & 1);
      for (let k = 0; k < n; k++) {
        const ox = ((h >> (k * 4)) & 15) - 7.5, oy = ((h >> (k * 4 + 2)) & 7) - 3;
        const tx = px + ox * 1.1, ty = py + 8 + oy;
        c.fillStyle = '#5a3a1a'; c.fillRect(Math.round(tx), Math.round(ty) - 3, 1, 4);
        c.fillStyle = '#1f5a1a'; c.beginPath(); c.arc(tx, ty - 6, 4.2, 0, 6.3); c.fill();
        c.fillStyle = '#2f7a24'; c.beginPath(); c.arc(tx - 1, ty - 7, 3, 0, 6.3); c.fill();
        c.fillStyle = '#4a9a34'; c.fillRect(Math.round(tx) - 2, Math.round(ty) - 9, 2, 1);
      }
    }
    const NB = [[1, 0, 8, 12], [-1, 0, -8, 4], [0, 1, -8, 12], [0, -1, 8, 4]]; // neighbour, edge midpoint offset from tile top
    function road(c, i, px, py) {
      const x = i % N, y = (i / N) | 0, water = ter[i] === WATER;
      if (water) { c.fillStyle = '#6a5a4a'; c.fillRect(px - 2, py + 8, 4, 8); }
      const con = NB.filter(([dx, dy]) => inb(x + dx, y + dy) && typ[idx(x + dx, y + dy)] === T_ROAD);
      c.lineCap = 'butt';
      c.strokeStyle = water ? '#8a8a8a' : '#4a4a4a'; c.lineWidth = 9;
      if (!con.length) dia(c, px, py, 0.45, '#4a4a4a');
      for (const [, , ex, ey] of con) { c.beginPath(); c.moveTo(px, py + 8); c.lineTo(px + ex, py + ey); c.stroke(); }
      dia(c, px, py, 0.32, water ? '#8a8a8a' : '#4a4a4a');
      if (water) { c.strokeStyle = '#ddd'; c.lineWidth = 1; for (const [, , ex, ey] of con) { c.beginPath(); c.moveTo(px - 3, py + 8 - 2); c.lineTo(px + ex - 3, py + ey - 2); c.stroke(); } }
      c.strokeStyle = '#e8d040'; c.lineWidth = 1; c.setLineDash([2, 2]);
      if (con.length === 2 || con.length === 1) for (const [, , ex, ey] of con) { c.beginPath(); c.moveTo(px, py + 8); c.lineTo(px + ex, py + ey); c.stroke(); }
      c.setLineDash([]);
    }
    function powerLine(c, i, px, py) {
      const x = i % N, y = (i / N) | 0, ox = typ[i] === T_ROAD ? 7 : 0, top = py + 8 - 11;
      c.strokeStyle = '#222'; c.lineWidth = 1;
      for (const [dx, dy, ex, ey] of NB) { if (!inb(x + dx, y + dy)) continue; const j = idx(x + dx, y + dy); if (pl[j] || typ[j] === T_BLD || typ[j] === T_ZONE) { c.beginPath(); c.moveTo(px + ox, top); c.lineTo(px + ex + ox * 0.5, py + ey - 11); c.stroke(); } }
      c.fillStyle = '#6a4a2a'; c.fillRect(px + ox, top, 1, 12); c.fillStyle = '#333'; c.fillRect(px + ox - 2, top, 5, 1);
    }
    const ZC_COL = { 1: ['#7ccf5a', '#3c9a2a'], 2: ['#6aa8e8', '#2a6ac0'], 3: ['#e8d060', '#b0901a'] };
    function zoneLot(c, i, px, py) {
      const [a, b] = ZC_COL[zk[i]], dense = zd[i];
      dia(c, px, py, 1, b); dia(c, px, py, 0.82, dense ? b : a);
      if (dense) { c.fillStyle = a; for (let k = -2; k <= 2; k++) c.fillRect(px + k * 5 - 1, py + 8 + (k & 1 ? 1 : -1), 2, 2); }
    }
    function zoneBuilding(c, i, px, py) {
      const k = zk[i], d = zd[i], L = lv[i], h = hash(i), cx = px, cy = py + 8, v = h & 3;
      if (k === ZR) {
        if (!d) {
          dia(c, px, py, 0.95, '#5aa83e');
          const wall = ['#efe2c0', '#d8b090', '#c8c8b8', '#e8c8a0'][v], roof = ['#b03a2a', '#7a4a2a', '#5a5a6a', '#a05a2a'][(h >> 2) & 3];
          if (L === 1) { box(c, cx + 2, cy + 1, 0.45, 6, wall, shade(wall, 0.8), shade(wall, 0.65)); hip(c, cx + 2, cy + 1, 0.5, 6, 6, shade(roof, 0.85), roof); c.fillStyle = '#5a3a1a'; c.fillRect(cx, cy + 2, 2, 3); c.fillStyle = '#9cf'; c.fillRect(cx - 4, cy - 1, 2, 2); c.fillRect(cx + 5, cy, 2, 2); }
          else { box(c, cx - 4, cy + 2, 0.38, 9, wall, shade(wall, 0.8), shade(wall, 0.65)); hip(c, cx - 4, cy + 2, 0.42, 9, 5, shade(roof, 0.85), roof); box(c, cx + 6, cy - 1, 0.38, 9, wall, shade(wall, 0.78), shade(wall, 0.62)); hip(c, cx + 6, cy - 1, 0.42, 9, 5, shade(roof, 0.85), roof); windows(c, cx - 4, cy + 2, 0.38, 9, 2, 2, h, '#ffe680', '#456'); windows(c, cx + 6, cy - 1, 0.38, 9, 2, 2, h + 5, '#ffe680', '#456'); }
        } else {
          const wall = ['#b85a3a', '#c8a080', '#a8a8b8', '#d8c8a0'][v], H = [0, 14, 26, 42][L];
          dia(c, px, py, 0.95, '#8a8a7a');
          box(c, cx, cy, 0.78, H, shade(wall, 1.1), shade(wall, 0.85), shade(wall, 0.68));
          windows(c, cx, cy, 0.78, H, Math.round(H / 5), 3, h, '#ffe680', '#2a3a5a');
          if (L === 3) { box(c, cx + 3, cy - 1, 0.18, H + 5, '#888', '#666', '#555'); c.fillStyle = '#e10600'; c.fillRect(cx + 3, cy - H - 9, 1, 2); }
          else box(c, cx - 3, cy + 1, 0.15, H + 2, '#999', '#777', '#666');
        }
      } else if (k === ZC) {
        if (!d) {
          dia(c, px, py, 0.95, '#9a9a8a');
          const wall = ['#d8d8e8', '#e8d8b8', '#c8e0e0', '#e0c8d8'][v], aw = ['#e10600', '#2a6ad8', '#2a9a2a', '#e8a000'][(h >> 3) & 3], H = L === 1 ? 8 : 13;
          box(c, cx, cy, 0.7, H, shade(wall, 1.05), shade(wall, 0.82), shade(wall, 0.68));
          poly(c, [cx - 11, cy, cx, cy + 5.6, cx, cy + 5.6 - 3, cx - 11, cy - 3], aw);
          poly(c, [cx, cy + 5.6, cx + 11, cy, cx + 11, cy - 3, cx, cy + 5.6 - 3], shade(aw, 0.75));
          windows(c, cx, cy, 0.7, H - 4, L === 1 ? 1 : 2, 3, h, '#bfe8ff', '#3a5a7a', 1);
          if (L === 2) { c.fillStyle = aw; c.fillRect(cx - 6, cy - H - 7, 12, 5); c.fillStyle = '#fff'; c.fillRect(cx - 4, cy - H - 5, 8, 1); c.fillStyle = '#333'; c.fillRect(cx - 1, cy - H - 2, 1, 3); }
        } else {
          const glass = ['#4a8aa8', '#3a6a9a', '#5a9a8a', '#6a7a9a'][v], H = [0, 16, 30, 48][L];
          dia(c, px, py, 0.95, '#9a9a8a');
          box(c, cx, cy, 0.8, H, shade(glass, 1.3), shade(glass, 0.9), shade(glass, 0.7));
          c.strokeStyle = 'rgba(200,240,255,.35)'; c.lineWidth = 1;
          for (let f = 4; f < H; f += 4) { c.beginPath(); c.moveTo(cx - 12.8, cy - f); c.lineTo(cx, cy + 6.4 - f); c.lineTo(cx + 12.8, cy - f); c.stroke(); }
          if (L >= 2) { c.fillStyle = '#ccc'; c.fillRect(cx, cy - H - 10, 1, 10); c.fillStyle = '#e10600'; c.fillRect(cx - 1, cy - H - 11, 3, 2); }
        }
      } else {
        dia(c, px, py, 0.95, '#7a7060');
        const wall = ['#9a8a7a', '#8a8a8a', '#a08060', '#7a8a7a'][v], H = d ? [0, 10, 14, 18][L] : [0, 6, 9][L], s = d ? 0.85 : 0.7;
        box(c, cx, cy, s, H, shade(wall, 1.1), shade(wall, 0.8), shade(wall, 0.65));
        // sawtooth roof
        if (L >= 2 || d) { c.fillStyle = shade(wall, 0.55); for (let k = -2; k <= 1; k++) poly(c, [cx + k * 5, cy - H + 1 + k * 2.5 * -0.2, cx + k * 5 + 4, cy - H - 4 - k * 0.5, cx + k * 5 + 5, cy - H + 1], shade(wall, 0.5)); }
        const chim = (ox, oy, ch) => { box(c, cx + ox, cy + oy, 0.12, H + ch, '#6a5a5a', '#8a3a2a', '#6a2a1a'); smokes.push([cx + ox, cy + oy - H - ch - 1]); };
        chim(-6, 1, d ? 12 : 6); if (d && L >= 2) chim(5, -1, 15);
        if (d && L === 3) { box(c, cx + 7, cy + 4, 0.2, 9, '#ddd', '#bbb', '#999'); }
      }
    }
    function special(c, b, px, py) {
      const k = b.k, cx = px, cy = py + 8;
      if (k === 'coal') {
        const mx = px, my = py + 16; // centre of the 2x2 footprint
        dia(c, px, py + 8, 1.95, '#6a6a60');
        box(c, mx - 4, my + 2, 1.2, 16, '#a8a8a0', '#8a8a82', '#6a6a64');
        windows(c, mx - 4, my + 2, 1.2, 16, 2, 5, 7, '#ffd400', '#334');
        box(c, mx + 14, my - 2, 0.4, 8, '#222', '#111', '#000');
        for (const [ox, oy] of [[-10, -4], [2, -10]]) { box(c, mx + ox, my + oy, 0.22, 40, '#ddd', '#c8c8c8', '#a0a0a0'); c.fillStyle = '#e10600'; c.fillRect(mx + ox - 3, my + oy - 34, 7, 3); c.fillRect(mx + ox - 3, my + oy - 26, 7, 3); smokes.push([mx + ox, my + oy - 42]); }
      } else if (k === 'wind') {
        dia(c, px, py, 0.4, '#888');
        c.fillStyle = '#eee'; c.fillRect(cx - 1, cy - 30, 2, 30); c.fillStyle = '#bbb'; c.fillRect(cx, cy - 30, 1, 30);
        winds.push([cx, cy - 31]);
      } else if (k === 'police') {
        dia(c, px, py, 0.95, '#8a8a8a');
        box(c, cx, cy, 0.75, 13, '#c8d0e8', '#5a6a9a', '#3a4a7a'); windows(c, cx, cy, 0.75, 13, 2, 3, 5, '#ffe680', '#223');
        c.fillStyle = '#2a4ad8'; c.fillRect(cx - 2, cy - 19, 5, 3); c.fillStyle = '#9cf'; c.fillRect(cx - 1, cy - 18, 3, 1);
        poly(c, [cx - 12, cy - 9, cx, cy - 3, cx, cy - 5, cx - 12, cy - 11], '#fff');
      } else if (k === 'fire') {
        dia(c, px, py, 0.95, '#8a8a8a');
        box(c, cx, cy, 0.75, 12, '#d86a4a', '#b8432a', '#8a2a1a');
        poly(c, [cx + 2, cy + 5, cx + 10, cy + 1, cx + 10, cy - 6, cx + 2, cy - 2], '#ddd'); c.strokeStyle = '#999'; c.lineWidth = 1; for (let k2 = 0; k2 < 3; k2++) { c.beginPath(); c.moveTo(cx + 2, cy + 3 - k2 * 2.2); c.lineTo(cx + 10, cy - 1 - k2 * 2.2); c.stroke(); }
        box(c, cx - 7, cy + 1, 0.2, 20, '#d86a4a', '#b8432a', '#8a2a1a'); c.fillStyle = '#ffd400'; c.fillRect(cx - 8, cy - 19, 3, 2);
      } else if (k === 'school') {
        dia(c, px, py, 0.95, '#9a9a8a'); c.fillStyle = '#e8e8e8'; c.fillRect(cx + 3, cy + 1, 7, 1);
        box(c, cx - 2, cy, 0.7, 10, '#e0c070', '#c89a4a', '#a07a3a'); windows(c, cx - 2, cy, 0.7, 10, 2, 3, 11, '#bfe8ff', '#456');
        box(c, cx - 2, cy, 0.2, 18, '#e0c070', '#c89a4a', '#a07a3a'); hip(c, cx - 2, cy, 0.24, 18, 5, '#7a2a1a', '#a03a2a'); c.fillStyle = '#ffd400'; c.fillRect(cx - 3, cy - 15, 2, 2);
      } else if (k === 'hosp') {
        dia(c, px, py, 0.95, '#9a9a8a');
        box(c, cx, cy, 0.8, 16, '#f4f4f4', '#d0d0d8', '#b0b0c0'); windows(c, cx, cy, 0.8, 16, 3, 3, 21, '#bfe8ff', '#5a6a8a');
        c.strokeStyle = '#e10600'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 5, cy - 16 - 2.5); c.lineTo(cx + 5, cy - 16 + 2.5); c.moveTo(cx + 5, cy - 16 - 2.5); c.lineTo(cx - 5, cy - 16 + 2.5); c.stroke();
      } else if (k === 'park') {
        dia(c, px, py, 1, '#5ab846');
        c.strokeStyle = '#d8c090'; c.lineWidth = 2; c.beginPath(); c.moveTo(px - 8, py + 4); c.lineTo(px + 8, py + 12); c.moveTo(px + 8, py + 4); c.lineTo(px - 8, py + 12); c.stroke();
        c.fillStyle = '#3a8ae8'; c.beginPath(); c.ellipse(px, py + 8, 3.5, 1.8, 0, 0, 6.3); c.fill(); c.fillStyle = '#cdf'; c.fillRect(px, py + 5, 1, 3);
        trees(c, i2(b.x, b.y) + 3, px - 7, py - 1); c.fillStyle = '#7a4a1a'; c.fillRect(px + 6, py + 9, 4, 1);
      } else if (k === 'burger') {
        dia(c, px, py, 0.95, '#9a9a8a');
        box(c, cx + 2, cy + 1, 0.45, 7, '#ffd400', '#e10600', '#b00000');
        c.fillStyle = '#ccc'; c.fillRect(cx - 7, cy - 16, 1, 16);
        c.fillStyle = '#d89a3a'; c.beginPath(); c.ellipse(cx - 7, cy - 19, 6, 3.4, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#3a9a2a'; c.fillRect(cx - 13, cy - 19, 12, 1); c.fillStyle = '#7a3a1a'; c.fillRect(cx - 13, cy - 18, 12, 2); c.fillStyle = '#d89a3a'; c.fillRect(cx - 12, cy - 16, 10, 2);
      } else if (k === 'statue') {
        dia(c, px, py, 1, '#5ab846'); dia(c, px, py, 0.55, '#bbb');
        box(c, cx, cy, 0.4, 7, '#ddd', '#aaa', '#888');
        box(c, cx, cy - 7, 0.15, 9, '#c89a4a', '#a0702a', '#7a5018');
        c.fillStyle = '#a0702a'; c.fillRect(cx - 6, cy - 15, 3, 1); c.fillRect(cx - 7, cy - 18, 1, 3);
        c.fillStyle = '#c89a4a'; c.beginPath(); c.arc(cx, cy - 19, 3.5, 0, 6.3); c.fill();
        c.fillStyle = '#8a5a1a'; c.fillRect(cx - 4, cy - 23, 7, 2); c.fillRect(cx + 2, cy - 22, 4, 1);
        c.fillStyle = '#ffe8a0'; c.fillRect(cx - 1, cy - 20, 1, 1);
      } else if (k === 'zoo') {
        const mx = px, my = py + 16;
        dia(c, px, py + 8, 1.95, '#6ac04e');
        c.fillStyle = '#3a8ae8'; c.beginPath(); c.ellipse(mx + 8, my + 2, 9, 4.5, 0, 0, 6.3); c.fill();
        c.strokeStyle = '#7a4a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(mx - 30, my); c.lineTo(mx, my + 15); c.lineTo(mx + 30, my); c.lineTo(mx, my - 15); c.closePath(); c.stroke();
        for (let k2 = 0; k2 <= 10; k2++) { c.fillStyle = '#7a4a1a'; c.fillRect(Math.round(mx - 30 + k2 * 3), Math.round(my + k2 * 1.5) - 3, 1, 3); c.fillRect(Math.round(mx + k2 * 3), Math.round(my + 15 - k2 * 1.5) - 3, 1, 3); }
        zoos.push([mx - 10, my - 2], [mx + 4, my - 8], [mx - 2, my + 6]);
        box(c, mx + 18, my - 8, 0.35, 8, '#d8b080', '#a87a4a', '#8a5a3a'); hip(c, mx + 18, my - 8, 0.4, 8, 5, '#2a6a2a', '#3a8a3a');
      } else if (k === 'mansion') {
        dia(c, px, py, 1, '#5ab846');
        box(c, cx, cy, 0.8, 12, '#f8f0e0', '#d8d0c0', '#b8b0a0'); windows(c, cx, cy, 0.8, 12, 2, 4, 3, '#ffe680', '#456');
        hip(c, cx, cy, 0.84, 12, 9, '#2a7a5a', '#3a9a6a');
        for (let k2 = 0; k2 < 4; k2++) { c.fillStyle = '#fff'; c.fillRect(Math.round(cx - 11 + k2 * 3.3), Math.round(cy - 10 + k2 * 1.6), 1, 9); }
        c.fillStyle = '#ccc'; c.fillRect(cx, cy - 32, 1, 11); c.fillStyle = '#e10600'; c.fillRect(cx + 1, cy - 32, 5, 3);
        c.fillStyle = '#ff5ac8'; c.fillRect(cx + 9, cy + 2, 5, 3); c.fillStyle = '#ffd400'; c.fillRect(cx + 9, cy + 1, 1, 1); c.fillRect(cx + 13, cy + 1, 1, 1);
      } else if (k === 'gas') {
        const mx = px, my = py + 16;
        dia(c, px, py + 8, 1.95, '#7a7a70');
        box(c, mx - 8, my + 3, 0.95, 12, '#d8dce8', '#a8b0c0', '#8890a0'); windows(c, mx - 8, my + 3, 0.95, 12, 2, 4, 9, '#9cf', '#334');
        for (const [ox, oy] of [[10, -2], [2, -8]]) { c.fillStyle = '#c8d0d8'; c.beginPath(); c.ellipse(mx + ox, my + oy - 4, 8, 4, 0, 0, 6.3); c.fill(); c.fillStyle = '#9aa4b0'; c.fillRect(mx + ox - 8, my + oy - 4, 16, 6); c.fillStyle = '#b8c0c8'; c.beginPath(); c.ellipse(mx + ox, my + oy - 10, 8, 4, 0, 0, 6.3); c.fill(); c.fillStyle = '#9aa4b0'; c.beginPath(); c.ellipse(mx + ox, my + oy + 2, 8, 4, 0, 0, Math.PI); c.fill(); }
        box(c, mx - 16, my - 2, 0.16, 28, '#e8e8e8', '#c8c8c8', '#a0a0a0'); c.fillStyle = '#2a6ad8'; c.fillRect(mx - 18, my - 26, 5, 2); smokes.push([mx - 16, my - 31, 1]);
      } else if (k === 'wtower') {
        dia(c, px, py, 0.6, '#8a8a8a');
        c.fillStyle = '#6a6a7a'; for (const ox of [-5, 5]) c.fillRect(cx + ox - 1, cy - 16, 2, 16); c.fillRect(cx - 1, cy - 16, 2, 18);
        c.strokeStyle = '#6a6a7a'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 5, cy - 4); c.lineTo(cx + 5, cy - 12); c.moveTo(cx + 5, cy - 4); c.lineTo(cx - 5, cy - 12); c.stroke();
        c.fillStyle = '#4a8ae8'; c.beginPath(); c.ellipse(cx, cy - 18, 9, 4, 0, 0, 6.3); c.fill(); c.fillStyle = '#3a6ac0'; c.fillRect(cx - 9, cy - 26, 18, 8); c.fillStyle = '#6aaaf8'; c.beginPath(); c.ellipse(cx, cy - 26, 9, 4, 0, 0, 6.3); c.fill();
        c.fillStyle = '#fff'; c.fillRect(cx - 4, cy - 23, 8, 2); c.fillStyle = '#ccc'; c.fillRect(cx, cy - 33, 1, 4);
      } else if (k === 'pump') {
        dia(c, px, py, 0.95, '#8a9aa0');
        box(c, cx - 2, cy + 1, 0.6, 9, '#c8d8e0', '#8aa0b0', '#6a8090'); hip(c, cx - 2, cy + 1, 0.64, 9, 5, '#3a5a8a', '#4a6aa8');
        c.fillStyle = '#2a6ad8'; c.beginPath(); c.ellipse(cx + 8, cy + 3, 5, 2.5, 0, 0, 6.3); c.fill(); c.fillStyle = '#9cf'; c.fillRect(cx + 6, cy + 2, 3, 1);
        c.fillStyle = '#555'; c.fillRect(cx + 3, cy - 2, 6, 2); c.fillStyle = '#ffd400'; c.fillRect(cx - 4, cy - 7, 3, 3);
      } else if (k === 'library') {
        dia(c, px, py, 0.95, '#9a9a8a');
        box(c, cx, cy, 0.7, 10, '#e8d8c0', '#b89a7a', '#987a5a'); hip(c, cx, cy, 0.74, 10, 6, '#5a3a2a', '#7a4a3a');
        for (let k2 = 0; k2 < 3; k2++) { c.fillStyle = '#fff'; c.fillRect(Math.round(cx - 10 + k2 * 3.5), Math.round(cy - 8 + k2 * 1.7), 1, 8); }
        c.fillStyle = '#e10600'; c.fillRect(cx + 4, cy - 6, 2, 3); c.fillStyle = '#2a6ad8'; c.fillRect(cx + 6, cy - 7, 2, 3); c.fillStyle = '#ffd400'; c.fillRect(cx + 8, cy - 8, 2, 3);
      } else if (k === 'bus') {
        dia(c, px, py, 0.95, '#6a6a6a');
        poly(c, [cx - 13, cy - 1, cx, cy + 5.5, cx + 13, cy - 1, cx, cy - 7.5], '#555');
        box(c, cx + 3, cy - 2, 0.55, 8, '#c8c8c8', '#9a9a9a', '#7a7a7a'); c.fillStyle = '#9a9a9a'; c.fillRect(cx - 10, cy - 10, 1, 9);
        c.fillStyle = '#e10600'; c.fillRect(cx - 9, cy - 3, 9, 4); c.fillStyle = '#9cf'; c.fillRect(cx - 8, cy - 3, 7, 1); c.fillStyle = '#111'; c.fillRect(cx - 8, cy + 1, 2, 1); c.fillRect(cx - 3, cy + 1, 2, 1);
        c.fillStyle = '#ffd400'; c.fillRect(cx + 1, cy - 12, 6, 3); c.fillStyle = '#000'; c.fillRect(cx + 2, cy - 11, 4, 1);
      } else if (k === 'stadium') {
        const mx = px, my = py + 16;
        dia(c, px, py + 8, 1.95, '#8a8a80');
        c.fillStyle = '#c8c8d0'; c.beginPath(); c.ellipse(mx, my, 29, 14.5, 0, 0, 6.3); c.fill();
        c.fillStyle = '#e10600'; c.beginPath(); c.ellipse(mx, my - 3, 28, 14, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#3aa03a'; c.beginPath(); c.ellipse(mx, my, 20, 10, 0, 0, 6.3); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.ellipse(mx, my, 4, 2, 0, 0, 6.3); c.moveTo(mx - 10, my - 5); c.lineTo(mx + 10, my + 5); c.stroke();
        c.fillStyle = '#a00'; c.fillRect(mx - 28, my - 3, 56, 3); for (const ox of [-24, 24]) { c.fillStyle = '#ddd'; c.fillRect(mx + ox, my - 26, 1, 22); c.fillStyle = '#ffe680'; c.fillRect(mx + ox - 2, my - 28, 5, 3); }
      } else if (k === 'mast') {
        dia(c, px, py, 0.8, '#7a7a7a');
        c.strokeStyle = '#d8d8d8'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 6, cy); c.lineTo(cx, cy - 46); c.lineTo(cx + 6, cy); for (let k2 = 0; k2 < 6; k2++) { const y2 = cy - 6 - k2 * 7, w2 = 6 - k2; c.moveTo(cx - w2, y2); c.lineTo(cx + w2 - 1, y2 - 6); } c.stroke();
        c.fillStyle = '#e10600'; c.fillRect(cx - 1, cy - 49, 3, 3); c.fillRect(cx - 4, cy - 24, 2, 2); c.fillRect(cx + 3, cy - 24, 2, 2);
        c.fillStyle = '#fff'; c.fillRect(cx - 4, cy - 34, 8, 4); c.fillStyle = '#2a4ad8'; c.fillRect(cx - 3, cy - 33, 6, 2);
      } else if (k === 'rocket') {
        const mx = px, my = py + 16;
        dia(c, px, py + 8, 1.95, '#9a9a90'); dia(c, px, py + 8, 1.2, '#7a7a74');
        box(c, mx + 10, my - 4, 0.25, 40, '#e10600', '#b00000', '#800000'); for (let k2 = 0; k2 < 5; k2++) { c.fillStyle = '#555'; c.fillRect(mx + 3, my - 10 - k2 * 8, 7, 1); }
        c.fillStyle = '#eee'; c.fillRect(mx - 4, my - 44, 9, 40); c.fillStyle = '#ccc'; c.fillRect(mx + 1, my - 44, 4, 40);
        c.fillStyle = '#e10600'; c.beginPath(); c.moveTo(mx - 4, my - 44); c.lineTo(mx + 0.5, my - 56); c.lineTo(mx + 5, my - 44); c.fill();
        c.fillRect(mx - 8, my - 10, 4, 8); c.fillRect(mx + 5, my - 10, 4, 8); c.fillStyle = '#2a4ad8'; c.fillRect(mx - 1, my - 36, 3, 3); c.fillStyle = '#000'; c.font = 'bold 5px sans-serif'; c.fillText('JACK', mx - 4, my - 20);
      } else if (k === 'arcade') {
        dia(c, px, py, 0.95, '#555');
        box(c, cx, cy, 0.8, 15, '#5a2a8a', '#3a1a6a', '#2a0a4a');
        c.fillStyle = '#ff3ad8'; for (let k2 = 0; k2 < 6; k2++) c.fillRect(Math.round(cx - 12 + k2 * 2), Math.round(cy - 12 + k2), 2, 2);
        c.fillStyle = '#3affff'; for (let k2 = 0; k2 < 6; k2++) c.fillRect(Math.round(cx + 2 + k2 * 2), Math.round(cy - 5 - k2), 2, 2);
        c.fillStyle = '#ffd400'; c.fillRect(cx - 6, cy - 24, 12, 4); c.fillStyle = '#e10600'; c.fillRect(cx - 5, cy - 23, 10, 2);
      }
    }
    const i2 = (x, y) => idx(x, y);
    let winds = [], zoos = [];
    function rubble(c, i, px, py) {
      dia(c, px, py, 0.95, '#7a6a5a');
      const h = hash(i); for (let k = 0; k < 9; k++) { c.fillStyle = ['#555', '#8a7a6a', '#a09080', '#4a3a2a'][(h >> k) & 3]; c.fillRect(px - 9 + ((h >> (k * 2)) & 15) + k, py + 5 + ((h >> (k + 3)) & 7), 2 + (k & 1), 2); }
    }
    function heat(v, good) { const t = clamp(v / 255, 0, 1), hue = good ? 10 + t * 110 : 120 - t * 120; return `hsla(${hue},85%,${45 + (good ? 0 : t * 5)}%,.78)`; }
    function overlayCol(i) {
      if (ter[i] === WATER && typ[i] !== T_ROAD) return null;
      if (overlay === 'lval') return heat(lval[i], true);
      if (overlay === 'poll') return poll[i] < 8 ? null : heat(poll[i]);
      if (overlay === 'crime') return crime[i] < 8 ? null : heat(crime[i]);
      if (overlay === 'power') return conducts(i) ? (pow[i] ? 'rgba(255,230,0,.85)' : 'rgba(230,0,0,.85)') : null;
      if (overlay === 'traf') return typ[i] === T_ROAD ? heat(Math.max(20, traf[i])) : null;
      const a = cov[overlay]; if (a) return a[i] < 8 ? null : `rgba(40,120,255,${(a[i] / 255 * 0.85).toFixed(2)})`;
      return null;
    }
    function renderWorld() {
      smokes = []; winds = []; zoos = [];
      wc.clearRect(0, 0, WW, WH);
      for (let d = 0; d <= 2 * N - 2; d++) for (let x = Math.max(0, d - N + 1); x <= Math.min(N - 1, d); x++) {
        const y = d - x, i = idx(x, y), [px, py] = tp(x, y), t = typ[i];
        ground(wc, i, px, py);
        if (overlay) {
          if (t === T_ROAD) road(wc, i, px, py); else if (t === T_ZONE || t === T_BLD) dia(wc, px, py, 0.9, '#888');
          const col = overlayCol(i); if (col) dia(wc, px, py, 1, col);
          continue;
        }
        if (t === T_NONE) { if (ter[i] === TREES) trees(wc, i, px, py); }
        else if (t === T_ROAD) road(wc, i, px, py);
        else if (t === T_ZONE) { if (lv[i]) zoneBuilding(wc, i, px, py); else zoneLot(wc, i, px, py); }
        else if (t === T_RUB) rubble(wc, i, px, py);
        else if (t === T_BLD) { const b = bldAt(i); if (b) { const sz = BLD[b.k].sz || 1; if (x === b.x + sz - 1 && y === b.y + sz - 1) { const [ax, ay] = tp(b.x, b.y); special(wc, b, ax, ay); } else if (sz > 1) dia(wc, px, py, 1, '#6a6a60'); } }
        if (pl[i]) powerLine(wc, i, px, py);
        if (showGrid) { wc.strokeStyle = 'rgba(0,0,0,.18)'; wc.lineWidth = 1; wc.beginPath(); wc.moveTo(px, py); wc.lineTo(px + 16, py + 8); wc.lineTo(px, py + 16); wc.stroke(); }
      }
      dirtyWorld = false;
    }
    let showGrid = false;

    // ================================================================ DOM: top bar, tools, view, ticker
    root.innerHTML = `<div class="dg-city-top"><span class="dg-city-chip n" data-k="name" title="Your city"></span><span class="dg-city-chip" data-k="date" title="Today's date in the city"></span><span class="dg-city-chip m" data-k="money" title="The city treasury (Rupees)"></span><span class="dg-city-chip" data-k="pop" title="Population"></span><span class="dg-city-chip" data-k="pow" title="Power used / power made"></span><span class="dg-city-chip" data-k="wat" title="Water used / water supplied"></span><button type="button" class="dg-city-rci" title="Demand: what the people want more of. Up = build more, down = they've got enough. Click for City Info."><span><i data-r="r" style="background:#3c3"></i><u>R</u></span><span><i data-r="c" style="background:#39f"></i><u>C</u></span><span><i data-r="i" style="background:#fc3"></i><u>I</u></span><b></b></button><button type="button" class="dg-city-chip goal" data-k="goal" title="Your next goal. Click for City Info."></button><span class="dg-city-spd"><button type="button" data-s="0" title="Pause (Space)">II</button><button type="button" data-s="1" title="Snail speed (1)">&gt;</button><button type="button" data-s="2" title="Bike speed (2)">&gt;&gt;</button><button type="button" data-s="3" title="Rocket speed (3)">&gt;&gt;&gt;</button></span></div>
<div class="dg-city-mid"><div class="dg-city-tools"></div><div class="dg-city-view"><canvas class="main"></canvas><canvas class="dg-city-mini" width="96" height="96" title="Minimap: click to jump there"></canvas></div></div><div class="dg-city-tick"><span></span></div>`;
    const top = k => root.querySelector(`[data-k="${k}"]`);
    const view = root.querySelector('.dg-city-view'), cv = view.querySelector('canvas.main'), ctx = cv.getContext('2d'), mini = view.querySelector('.dg-city-mini'), mctx = mini.getContext('2d');
    const tick = root.querySelector('.dg-city-tick span');
    let showMini = !G.phone;
    mini.style.display = showMini ? '' : 'none';
    root.querySelector('.dg-city-rci').addEventListener('click', () => { G.sfx('click'); cityInfo(); });
    top('goal').addEventListener('click', () => { G.sfx('click'); cityInfo(); });

    const TOOLS = [
      ['query', 'Query', ICO.query, 'Query (Q): click a tile to see what\'s there and why it isn\'t growing'], ['hand', 'Scroll', ICO.hand, 'Scroll (H): drag the map about'], ['doze', 'Bulldoze', ICO.doze, 'Bulldoze (X): drag over things to knock them down'],
      ['!undo', 'Undo', ICO.undo, 'Undo (Ctrl+Z): take back the last thing you built and get the Rupees back'], ['road', 'Road', ICO.road, 'Road (R): drag out a street'], ['@zone', 'Zones', ICO.zone, 'Zones (Z): homes, shops and factories'],
      ['@power', 'Power', ICO.power, 'Power & Water (P): power plants, power lines, water towers'], ['@serv', 'Services', ICO.serv, 'Services (E): police, fire, schools, parks, buses...'], ['@reward', 'Rewards', ICO.reward, 'Rewards: special buildings for a bigger city'],
      ['@data', 'Data', ICO.data, 'Data maps and City Info (M)'], ['!budget', 'Budget', ICO.budget, 'Budget (B): taxes, funding, laws and loans'], ['!adv', 'Advisors', ICO.adv, 'Advisors (V): what your team thinks'], ['@dis', 'Disasters', ICO.dis, 'Disasters: if you\'re feeling brave'],
    ];
    const toolsEl = root.querySelector('.dg-city-tools');
    toolsEl.innerHTML = TOOLS.map(([k, l, ic, tt]) => `<button type="button" class="dg-city-tb" data-t="${k}" title="${esc(tt)}">${ic}<span>${l}</span></button>`).join('');
    const undoBtn = () => { const b = toolsEl.querySelector('[data-t="!undo"]'); if (b) b.disabled = !undoRec || !!visiting; };
    const costTag = c => c ? gnum(c, 11) : 'FREE';
    const FLY = {
      zone: () => [['Zones'], ['zr0', 'Residential (light)', sw('#7ccf5a'), 10, 0, 'Houses. Grow into semis.'], ['zr1', 'Residential (dense)', swd('#3c9a2a'), 20, 0, 'Flats. Grow into tower blocks in a big town.'], ['zc0', 'Commercial (light)', sw('#6aa8e8'), 10, 0, 'Corner shops and high street shops.'], ['zc1', 'Commercial (dense)', swd('#2a6ac0'), 20, 0, 'Offices and skyscrapers.'], ['zi0', 'Industrial (light)', sw('#e8d060'), 10, 0, 'Workshops. A bit smelly.'], ['zi1', 'Industrial (dense)', swd('#b0901a'), 20, 0, 'Big factories. Very smelly.']],
      power: () => [['Power'], ['line', 'Power Line', ICO.power, 5, 0, 'Carries power from plants to zones (and across roads).'], ...['wind', 'coal', 'gas'].map(k => ['b:' + k, BLD[k].n, ICO.power, BLD[k].cost, 0, BLD[k].d]), ['Water'], ['b:wtower', BLD.wtower.n, ICO.water, BLD.wtower.cost, 0, BLD.wtower.d], ['b:pump', BLD.pump.n, ICO.water, BLD.pump.cost, 0, BLD.pump.d]],
      serv: () => [['Services'], ...['police', 'fire', 'school', 'library', 'hosp', 'bus', 'park', 'stadium'].map(k => ['b:' + k, BLD[k].n, k === 'police' ? ICO.serv : sw(SWC[k]), BLD[k].cost, 0, BLD[k].d]), ['b:burger', BLD.burger.n + (S.unlock.burger ? '' : ' (locked)'), sw('#ffd400'), BLD.burger.cost, !S.unlock.burger, S.unlock.burger ? BLD.burger.d : 'Locked: wait for the people to ask for one.']],
      reward: () => [['Rewards'], ...REWARDS.map(k => ['b:' + k, BLD[k].n + (S.maxP < BLD[k].reward ? ` (${num(BLD[k].reward)} people)` : S.placed[k] ? ' (built)' : ''), ICO.reward, 0, S.maxP < BLD[k].reward || !!S.placed[k], BLD[k].d])],
      data: () => [['City Info'], ['!info', 'City Info & Graphs...', ICO.data, 0, 0, 'Population, jobs, money, demand, the Mayor rating and your goals.'], ['Data Maps'], ['%', 'Normal view', sw('#4f9a3a')], ['%lval', 'Land Value', sw('#3aa0e8')], ['%poll', 'Pollution', sw('#c84a2a')], ['%crime', 'Crime', sw('#a02a8a')], ['%traf', 'Traffic', sw('#e8a020')], ['%power', 'Power Grid', sw('#ffd400')], ['%pol', 'Police Coverage', sw('#2a4ad8')], ['%fir', 'Fire Coverage', sw('#d86a4a')], ['%edu', 'Schools', sw('#e0c070')], ['%hea', 'Hospitals', sw('#f4f4f4')], ['%bus', 'Bus Routes', sw('#e10600')]],
      dis: () => [['Disasters'], ['&fire', 'Start a Fire', sw('#ff7a00')], ['&tornado', 'Whirlwind', sw('#999')], ['&jaquake', 'Earthquake', sw('#8a6a4a')], ['&squig', 'BLOB ATTACK!', ICO.dis]],
    };
    const SWC = { fire: '#d86a4a', school: '#e0c070', library: '#b89a7a', hosp: '#f4f4f4', bus: '#e10600', park: '#5ab846', stadium: '#c8c8d0' };
    const OVN = { lval: 'Land Value: red is cheap, green is posh', poll: 'Pollution: red is smoggy', crime: 'Crime: red is naughty', traf: 'Traffic: red roads are jammed. Bus Depots help', power: 'Power Grid: yellow has power, red has none', pol: 'Police coverage', fir: 'Fire station coverage', edu: 'School and library coverage', hea: 'Hospital coverage', bus: 'Bus Depot coverage' };
    let flyEl = null;
    function closeFly() { if (flyEl) { flyEl.remove(); flyEl = null; } }
    function openFly(name, btn) {
      closeFly();
      const items = FLY[name]();
      flyEl = document.createElement('div'); flyEl.className = 'dg-city-fly';
      flyEl.innerHTML = items.map(it => it.length === 1 ? `<div class="hd">${esc(it[0])}</div>` : `<button type="button" data-f="${it[0]}" ${it[4] ? 'disabled' : ''} ${it[5] ? `title="${esc(it[5])}"` : ''}>${it[2]}<span>${esc(it[1])}</span>${it[3] ? `<small>${costTag(it[3])}</small>` : ''}</button>`).join('');
      root.appendChild(flyEl);
      const r = btn.getBoundingClientRect(), rr = root.getBoundingClientRect(), fr = flyEl.getBoundingClientRect();
      if (root.classList.contains('narrow')) { flyEl.style.left = clamp(r.left - rr.left, 2, rr.width - fr.width - 2) + 'px'; flyEl.style.bottom = (rr.bottom - r.top + 2) + 'px'; }
      else { flyEl.style.left = (r.right - rr.left + 2) + 'px'; flyEl.style.top = clamp(r.top - rr.top, 2, rr.height - fr.height - 2) + 'px'; }
      flyEl.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
        const f = b.dataset.f; closeFly(); G.sfx('click');
        if (f === '!info') return cityInfo();
        if (f[0] === '%') return setOverlay(f.slice(1));
        if (f[0] === '&') return disaster(f.slice(1));
        setTool(f);
      }));
      drawTut();
    }
    function setOverlay(o) { overlay = o; dirtyWorld = true; if (overlay) computeMaps(); G.status(overlay ? 'Data map - ' + OVN[o] + '. Press Esc or pick "Normal view" to go back.' : 'Normal view.'); }
    function disaster(k) { if (!playing || visiting) return; if (k === 'fire') fireDisaster(); else if (k === 'tornado') startTornado(); else if (k === 'quake') startQuake(); else startSquig(); }
    toolsEl.addEventListener('click', ev => {
      const b = ev.target.closest('[data-t]'); if (!b || b.disabled) return; const t = b.dataset.t; G.sfx('click');
      if (visiting && !/^(query|hand|@data)$/.test(t)) { closeFly(); return G.status('You\'re visiting! You can look round and query things, but you can\'t build here. Press Leave to go home.'); }
      if (t[0] === '@') { if (flyEl && flyEl._k === t) return closeFly(); openFly(t.slice(1), b); flyEl._k = t; return; }
      closeFly();
      if (t === '!budget') return budget();
      if (t === '!adv') return advisors();
      if (t === '!undo') return undo();
      setTool(t);
    });
    G.on(root, 'pointerdown', ev => { if (flyEl && !flyEl.contains(ev.target) && !ev.target.closest('.dg-city-tb')) closeFly(); }, true);
    const TOOLNAME = { query: 'Query: click a tile to see what\'s there, and why it isn\'t growing.', hand: 'Scroll: drag the map around.', doze: 'Bulldoze: 1-5 Rupees a tile. Drag for an area.', road: 'Road: 10 Rupees a tile (bridges 50). Drag to draw. Zones need a road within 3 tiles.', line: 'Power Line: 5 Rupees a tile. Connects plants to zones, and carries power across roads.', zr0: 'Residential (light): 10 Rupees a tile. Drag a box next to a road.', zr1: 'Residential (dense): 20 Rupees a tile. Drag a box. Flats grow when the town is bigger.', zc0: 'Commercial (light): 10 Rupees a tile. Drag a box.', zc1: 'Commercial (dense): 20 Rupees a tile. Drag a box.', zi0: 'Industrial (light): 10 Rupees a tile. Keep it away from houses.', zi1: 'Industrial (dense): 20 Rupees a tile. Keep it well away from houses.' };
    function setTool(t) {
      if (visiting && !/^(query|hand)$/.test(t)) t = 'query';
      tool = t;
      toolsEl.querySelectorAll('.dg-city-tb').forEach(b => { const k = b.dataset.t; b.classList.toggle('on', k === t || (k === '@zone' && /^z/.test(t)) || (k === '@power' && (t === 'line' || /^b:(coal|wind|gas|wtower|pump)$/.test(t))) || (k === '@serv' && t.startsWith('b:') && BLD[t.slice(2)].cat === 'serv') || (k === '@reward' && t.startsWith('b:') && !!BLD[t.slice(2)].reward)); });
      if (t.startsWith('b:')) { const b = BLD[t.slice(2)]; G.status(`${b.n}: ${b.cost ? fmt(b.cost) : 'FREE'}. ${b.d}${b.sz ? ' (2x2 tiles)' : ''}`); }
      else G.status(TOOLNAME[t] || '');
      qbox(null);
    }
    root.querySelector('.dg-city-spd').addEventListener('click', ev => { const b = ev.target.closest('[data-s]'); if (!b) return; G.sfx('click'); setSpeed(+b.dataset.s); tutorialCheck(); });
    function setSpeed(s) { if (s === 0) paused = true; else { paused = false; speed = s; } root.querySelectorAll('.dg-city-spd button').forEach(b => b.classList.toggle('on', paused ? b.dataset.s === '0' : +b.dataset.s === speed)); }
    function updateTop() {
      if (!S) return;
      top('name').textContent = visiting ? S.name + ' (visiting)' : S.name; top('date').textContent = MONTHS[S.mo] + ' ' + yearStr(S.yr);
      const m = top('money'); m.innerHTML = gnum(S.money, 12); m.classList.toggle('neg', S.money < 0);
      top('pop').textContent = 'Pop ' + num(P);
      const p = top('pow'); p.textContent = 'Pwr ' + Math.round(powUse) + '/' + powCap; p.style.color = powCap && powUse > powCap * 0.9 || unpowered ? '#f96' : '#7fe0ff';
      const w = top('wat'); w.textContent = 'H₂O ' + Math.round(watUse) + '/' + watCap; w.style.color = waterShort() ? '#f96' : watUse > watCap * 0.85 ? '#ffd400' : '#7fe0ff';
      for (const [k, v] of [['r', dR], ['c', dC], ['i', dI]]) { const e = root.querySelector(`[data-r="${k}"]`); e.style.height = Math.max(1, Math.round(Math.abs(v) * 10)) + 'px'; e.classList.toggle('neg', v < 0); }
      root.querySelector('.dg-city-rci').title = `Demand (click for City Info)\nHomes (R): ${dmd(dR)}\nShops (C): ${dmd(dC)}\nFactories (I): ${dmd(dI)}`;
      const g = top('goal'), sc = scenGoal();
      if (visiting) g.textContent = 'Visiting';
      else if (sc) { g.textContent = sc.short; g.classList.toggle('won', !!sc.won); }
      else { const ng = nextGoal(); g.textContent = ng ? `Next: ${ng[1]} ${num(Math.min(P, ng[0]))}/${num(ng[0])}` : 'Metropolis!'; g.classList.remove('won'); }
    }
    const dmd = v => v > 0.6 ? 'LOTS wanted' : v > 0.25 ? 'wanted' : v > -0.05 ? 'a few wanted' : v > -0.4 ? 'enough for now' : 'too many!';

    // ---- news ticker (Web Animations, so it measures itself)
    const newsQ = [];
    let tickAnim = null;
    function news(t, urgent) { if (urgent) newsQ.unshift(t); else newsQ.push(t); if (newsQ.length > 6) newsQ.length = 6; if (!tickAnim) nextNews(); }
    function nextNews() {
      if (G.closed || dead) return;
      const t = newsQ.shift() || (S ? (contextNews() || pick(HEADLINES)) : pick(HEADLINES));
      tick.innerHTML = `<em>${visiting ? esc(S.name.toUpperCase()) + ' GAZETTE' : 'JACKCITY NEWS'}</em> &bull; ${esc(t)} &bull;`;
      const cw = tick.parentNode.clientWidth || 600, sw2 = tick.scrollWidth || 400;
      try { tickAnim = tick.animate([{ transform: `translateX(${cw}px)` }, { transform: `translateX(${-sw2}px)` }], { duration: (cw + sw2) / 70 * 1000, easing: 'linear' }); tickAnim.onfinish = () => { tickAnim = null; nextNews(); }; }
      catch (e) { tickAnim = null; G.timer(nextNews, 8000); }
    }
    G.onClose(() => { if (tickAnim) { tickAnim.onfinish = null; tickAnim.cancel(); } });

    // ---- canvas sizing (1:1 pixels, or chunky 2x zoom)
    let cw = 300, ch = 200, camX = 0, camY = 0;
    function fit() {
      root.classList.toggle('narrow', root.clientWidth < 560);
      const r = view.getBoundingClientRect(); if (!r.width || !r.height) return;
      const mx = camX + cw / 2, my = camY + ch / 2;
      cw = Math.max(64, Math.floor(r.width / zoom)); ch = Math.max(64, Math.floor(r.height / zoom));
      if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
      cv.style.width = cw * zoom + 'px'; cv.style.height = ch * zoom + 'px';
      ctx.imageSmoothingEnabled = false; camX = mx - cw / 2; camY = my - ch / 2; clampCam();
    }
    const ro = new ResizeObserver(fit); ro.observe(view); ro.observe(root); G.onClose(() => ro.disconnect());
    function clampCam() { camX = clamp(camX, -cw / 2, WW - cw / 2); camY = clamp(camY, -ch / 2, WH - ch / 2); }
    function centerOn(x, y) { const [px, py] = tp(x, y); camX = px - cw / 2; camY = py + 8 - ch / 2; clampCam(); }
    function setZoom(z) { zoom = z; fit(); G.status(z === 2 ? 'Zoom: chunky 2x. Press - to zoom out.' : 'Zoom: normal. Press + for chunky 2x.'); }
    // screen (canvas px) -> tile
    function tileAt(sx, sy) { const wx = sx + camX, wy = sy + camY, a = (wx - OX) / 16, b = (wy - OY - 8) / 8; const x = Math.round((a + b) / 2), y = Math.round((b - a) / 2); return inb(x, y) ? [x, y] : null; }
    const local = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * cw / r.width, (ev.clientY - r.top) * ch / r.height]; };
    // is this canvas point on the blob? (any tool pokes it)
    function onBlob(sx, sy) { if (!squig) return false; const [px, py] = tp(squig.x, squig.y), qx = px - camX, qy = py + 8 - camY; return Math.abs(sx - qx) < 34 && sy < qy + 6 && sy > qy - 62; }

    // ================================================================ input on the map
    let drag = null, hover = null;
    const pointers = new Map();
    const panTool = () => tool === 'hand' || tool === 'query';
    G.on(cv, 'contextmenu', e => e.preventDefault());
    G.on(cv, 'pointerdown', ev => {
      if (!playing) return;
      ev.preventDefault(); closeFly();
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      pointers.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (pointers.size >= 2) { drag = { pan: true, x: ev.clientX, y: ev.clientY, moved: true, multi: true }; return; }
      const [sx, sy] = local(ev), t = tileAt(sx, sy);
      if (!visiting && ev.button === 0 && onBlob(sx, sy) && pokeBlob()) { drag = { pan: true, x: ev.clientX, y: ev.clientY, moved: true }; return; }
      if (ev.button === 1 || ev.button === 2 || (panTool() && ev.pointerType !== 'mouse') || tool === 'hand') { drag = { pan: true, x: ev.clientX, y: ev.clientY, moved: false, t0: t }; return; }
      drag = { pan: false, a: t, b: t, moved: false, x: ev.clientX, y: ev.clientY };
    });
    G.on(cv, 'pointermove', ev => {
      if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, [ev.clientX, ev.clientY]);
      const [sx, sy] = local(ev);
      hover = tileAt(sx, sy);
      cv.style.cursor = squig && onBlob(sx, sy) ? 'crosshair' : '';
      if (!drag) { if (hover && ev.pointerType === 'mouse') hoverStatus(); return; }
      if (drag.pan) {
        const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        if (drag.multi && pointers.size >= 2) { const ps = [...pointers.values()]; const mx = (ps[0][0] + ps[1][0]) / 2, my = (ps[0][1] + ps[1][1]) / 2; if (drag.mx != null) { camX -= (mx - drag.mx) / zoom; camY -= (my - drag.my) / zoom; } drag.mx = mx; drag.my = my; }
        else { camX -= dx / zoom; camY -= dy / zoom; drag.x = ev.clientX; drag.y = ev.clientY; }
        clampCam(); return;
      }
      if (hover) { drag.b = hover; if (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) > 4) drag.moved = true; }
      if (drag.a && drag.b) previewStatus();
    });
    const endPtr = ev => {
      pointers.delete(ev.pointerId);
      if (!drag) return;
      const d = drag;
      if (d.multi) { if (pointers.size === 0) drag = null; return; }
      drag = null;
      if (d.pan) { if (!d.moved && tool === 'query' && d.t0) query(d.t0); return; }
      if (ev.type === 'pointercancel' || !d.a) return;
      apply(tool, d.a, d.b || d.a);
    };
    G.on(cv, 'pointerup', endPtr); G.on(cv, 'pointercancel', endPtr);
    G.on(cv, 'pointerleave', () => { if (!drag) hover = null; });
    G.on(cv, 'wheel', ev => { ev.preventDefault(); if (ev.ctrlKey || Math.abs(ev.deltaY) > Math.abs(ev.deltaX) * 2 && ev.shiftKey) return setZoom(ev.deltaY < 0 ? 2 : 1); camX += ev.deltaX / zoom; camY += ev.deltaY / zoom; clampCam(); }, { passive: false });
    G.on(mini, 'pointerdown', ev => { ev.stopPropagation(); const r = mini.getBoundingClientRect(); const x = Math.floor((ev.clientX - r.left) / r.width * N), y = Math.floor((ev.clientY - r.top) / r.height * N); centerOn(clamp(x, 0, N - 1), clamp(y, 0, N - 1)); });
    const keys = new Set();
    const KEYS = [['Q', 'Query tool'], ['H', 'Scroll tool'], ['X or Delete', 'Bulldoze'], ['R', 'Road'], ['L', 'Power Line'], ['Z', 'Zones menu'], ['P', 'Power & Water menu'], ['E', 'Services menu'], ['M', 'Data maps menu'], ['I', 'City Info & graphs'], ['B', 'Budget'], ['V', 'Advisors'], ['Ctrl+Z', 'Undo the last thing you built'], ['Space', 'Pause / carry on'], ['1, 2, 3', 'Snail, bike, rocket speed'], ['Arrows or W A S D', 'Scroll the map'], ['+ and -', 'Chunky 2x zoom in / out'], ['Esc', 'Close a window, cancel a tool, normal view'], ['F1', 'How to Play']];
    G.on(document, 'keydown', ev => {
      if (dead || !G.focused() || ev.target.closest && ev.target.closest('input,textarea,select')) return;
      if (ev.key === 'Escape') { if (closeTopModal()) return ev.preventDefault(); closeFly(); if (overlay) setOverlay(''); setTool('query'); return; }
      if (ev.key === 'F1') { ev.preventDefault(); return help(); }
      if (!playing || modals) return;
      const k = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); return undo(); }
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const fly = t => { const b = toolsEl.querySelector(`[data-t="${t}"]`); if (b && !visiting) { openFly(t.slice(1), b); flyEl._k = t; } };
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(k)) { keys.add(k); ev.preventDefault(); }
      else if (k === ' ') { ev.preventDefault(); if (!visiting) setSpeed(paused ? speed : 0); }
      else if (k === '1' || k === '2' || k === '3') { if (!visiting) setSpeed(+k); }
      else if (k === '+' || k === '=') setZoom(2); else if (k === '-' || k === '_') setZoom(1);
      else if (k === 'q') setTool('query'); else if (k === 'h') setTool('hand'); else if (k === 'i') cityInfo(); else if (k === 'm') { const b = toolsEl.querySelector('[data-t="@data"]'); openFly('data', b); flyEl._k = '@data'; }
      else if (visiting) return;
      else if (k === 'b') budget(); else if (k === 'v') advisors(); else if (k === 'r') setTool('road'); else if (k === 'l') setTool('line'); else if (k === 'x' || k === 'delete') setTool('doze');
      else if (k === 'z') fly('@zone'); else if (k === 'p') fly('@power'); else if (k === 'e') fly('@serv');
    });
    G.on(document, 'keyup', ev => keys.delete(ev.key.toLowerCase()));
    function hoverStatus() { if (!hover || drag) return; if (squig && tool !== 'hand') return; if (tool === 'query') G.status('Tile ' + hover[0] + ',' + hover[1] + ' - click to query it.' + (visiting ? ' Press Leave (top of the map) to go home.' : '')); }
    function previewStatus() { const tiles = toolTiles(tool, drag.a, drag.b); const c = tiles.reduce((s, i) => s + costOf(tool, i), 0); if (!tool.startsWith('b:') && tool !== 'query' && tool !== 'hand') G.status(`${tiles.length} tile(s): ${fmt(c)}${c > S.money ? '  (not enough money!)' : ''}`); }

    // ================================================================ tools
    function toolTiles(t, a, b) {
      if (!a || !b) return [];
      const out = [];
      if (t === 'road' || t === 'line') {
        // L-shaped: along the longer axis first
        const [x0, y0] = a, [x1, y1] = b, sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
        let x = x0, y = y0; out.push(idx(x, y));
        if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) { while (x !== x1) { x += sx; out.push(idx(x, y)); } while (y !== y1) { y += sy; out.push(idx(x, y)); } }
        else { while (y !== y1) { y += sy; out.push(idx(x, y)); } while (x !== x1) { x += sx; out.push(idx(x, y)); } }
        return out;
      }
      if (t[0] === 'z' || t === 'doze') { for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) out.push(idx(x, y)); return out; }
      if (t.startsWith('b:')) { const sz = BLD[t.slice(2)].sz || 1; for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) if (inb(b[0] + dx, b[1] + dy)) out.push(idx(b[0] + dx, b[1] + dy)); return out; }
      return [idx(b[0], b[1])];
    }
    function costOf(t, i) {
      if (t === 'road') return typ[i] === T_ROAD ? 0 : ter[i] === WATER ? 50 : (typ[i] === T_NONE || (typ[i] === T_ZONE && !lv[i]) || pl[i]) ? 10 : 0;
      if (t === 'line') return pl[i] || typ[i] === T_ZONE || typ[i] === T_BLD ? 0 : ter[i] === WATER ? 20 : 5;
      if (t[0] === 'z') return canZone(i) ? (t[2] === '1' ? 20 : 10) : 0;
      if (t === 'doze') return typ[i] === T_BLD ? 5 : typ[i] === T_RUB ? 2 : typ[i] === T_ROAD ? 1 : typ[i] === T_ZONE ? (lv[i] ? 4 : 1) : ter[i] === TREES || pl[i] ? 3 : 0;
      return 0;
    }
    const canZone = i => ter[i] !== WATER && (typ[i] === T_NONE || (typ[i] === T_ZONE && !lv[i])) && !pl[i];
    function nope(msg) { G.sfx('beep'); G.status(msg); }
    // ---- undo: the last placement (until the city has moved on 45 days, or something else changes it)
    let undoRec = null;
    function undoBegin() { return { a: [ter.slice(), typ.slice(), pl.slice(), zk.slice(), zd.slice(), lv.slice(), fire.slice()], blds: JSON.stringify(blds), placed: Object.assign({}, S.placed), money: S.money }; }
    function undoCommit(u, label) {
      const now = [ter, typ, pl, zk, zd, lv, fire], ch = [];
      for (let i = 0; i < NN; i++) for (let k = 0; k < 7; k++) if (now[k][i] !== u.a[k][i]) { ch.push(i); break; }
      undoRec = { tiles: ch.map(i => [i, u.a.map(a => a[i])]), after: ch.map(i => now.filter((a, k) => k !== 5).map(a => a[i]).join()), blds: u.blds, bldsAfter: JSON.stringify(blds), placed: u.placed, spent: u.money - S.money, label, days: 0 };
      undoBtn();
    }
    function undo() {
      if (!playing || visiting) return;
      const u = undoRec; if (!u) return nope('Nothing to undo.');
      const now = [ter, typ, pl, zk, zd, lv, fire];
      const changed = JSON.stringify(blds) !== u.bldsAfter || u.tiles.some(([i], n) => now.filter((a, k) => k !== 5).map(a => a[i]).join() !== u.after[n]);
      if (changed) { undoRec = null; undoBtn(); return nope('Too late to undo that: something else has happened there since.'); }
      for (const [i, v] of u.tiles) for (let k = 0; k < 7; k++) now[k][i] = v[k];
      blds = JSON.parse(u.blds); reAnc(); S.placed = u.placed; S.money += u.spent;
      undoRec = null; undoBtn();
      dirtyWorld = dirtyPower = dirtyMaps = dirtyRoads = true; recalcAll(); updateTop();
      G.sfx('turn'); G.status(`Undone: ${u.label}. ${fmt(u.spent)} back in the treasury.`);
    }
    function apply(t, a, b) {
      if (t === 'query') return query(b);
      if (t === 'hand' || visiting) return;
      if (t.startsWith('b:')) return placeTool(t.slice(2), b);
      const tiles = toolTiles(t, a, b); let spent = 0, n = 0;
      const u = undoBegin();
      for (const i of tiles) {
        const c = costOf(t, i); if (!c) continue;
        if (S.money < c) { nope('Not enough money! Take out a loan in the Budget window, or wait for taxes.'); break; }
        if (t === 'road') { typ[i] = T_ROAD; zk[i] = 0; lv[i] = 0; if (ter[i] === TREES) ter[i] = GRASS; dirtyRoads = true; }
        else if (t === 'line') { pl[i] = 1; if (ter[i] === TREES) ter[i] = GRASS; }
        else if (t[0] === 'z') { typ[i] = T_ZONE; zk[i] = { r: ZR, c: ZC, i: ZI }[t[1]]; zd[i] = t[2] === '1' ? 1 : 0; lv[i] = 0; if (ter[i] === TREES) ter[i] = GRASS; }
        else if (t === 'doze') { if (typ[i] === T_BLD) { const n2 = anc[i]; if (n2 >= 0) removeB(n2, false); } else if (typ[i] === T_RUB) { typ[i] = T_NONE; zk[i] = 0; } else if (typ[i] === T_ROAD) { typ[i] = T_NONE; dirtyRoads = true; } else if (typ[i] === T_ZONE) { if (lv[i]) lv[i] = 0; else { typ[i] = T_NONE; zk[i] = 0; } } else if (pl[i]) pl[i] = 0; else if (ter[i] === TREES) ter[i] = GRASS; fire[i] = 0; puff(i, 'dust'); }
        S.money -= c; spent += c; n++;
      }
      if (n) {
        G.sfx(t === 'doze' ? 'thud' : 'click'); if (t !== 'doze') G.note(t === 'road' ? 330 : t === 'line' ? 660 : 523, 0.06, 'square');
        dirtyWorld = dirtyPower = dirtyMaps = true; computeRoads(); computePower(); computeTotals(); updateTop();
        const name = t === 'road' ? 'road' : t === 'line' ? 'power line' : t === 'doze' ? 'bulldozing' : ZNAME[{ r: 1, c: 2, i: 3 }[t[1]]] + ' zone';
        undoCommit(u, `${n} tile(s) of ${name}`);
        puff(b[1] * N + b[0], 'txt', '-' + num(spent), '#ffd400');
        G.status(`Done: ${n} tile(s) for ${fmt(spent)}.` + (t[0] === 'z' && !roadNear(tiles) ? ' Careful: no road within 3 tiles of some of it!' : '') + ' (Ctrl+Z to undo)');
        tutorialCheck();
      }
      else if (!S || S.money >= 5) G.status('Nothing to do there.');
    }
    const roadNear = tiles => tiles.every(i => roadD[i] <= 3 || typ[i] !== T_ZONE);
    function placeTool(k, at) {
      const b = BLD[k], sz = b.sz || 1;
      if (b.lock && !S.unlock[k]) return nope('Nobody has asked for one yet.');
      if (b.reward && (S.maxP < b.reward || S.placed[k])) return nope(S.placed[k] ? 'You\'ve already built that one!' : 'Not unlocked yet: you need ' + num(b.reward) + ' people.');
      for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { const x = at[0] + dx, y = at[1] + dy; if (!inb(x, y)) return nope('Doesn\'t fit there.'); const i = idx(x, y); if (ter[i] === WATER || !(typ[i] === T_NONE || (typ[i] === T_ZONE && !lv[i]))) return nope('There\'s something in the way. Bulldoze it first.'); }
      if (b.nearW && !touchesWater(at[0], at[1], sz)) return nope(b.n + ' must be right next to water (a river, lake or the sea).');
      if (S.money < b.cost) return nope('Not enough money! ' + b.n + ' costs ' + fmt(b.cost) + '.');
      const u = undoBegin();
      placeB(k, at[0], at[1]);
      G.sfx(b.cap ? 'zap' : 'join'); G.note(392, 0.08, 'square'); G.timer(() => G.note(587, 0.1, 'square'), 90);
      computePower(); computeMaps(); computeTotals(); updateTop();
      undoCommit(u, b.n);
      const i0 = idx(at[0] + sz - 1, at[1] + sz - 1); puff(i0, 'dust'); if (b.cost) puff(i0, 'txt', '-' + num(b.cost), '#ffd400');
      G.status(`${b.n} built.` + (b.cap ? ' Now run Power Lines from it to your zones.' : b.wat ? ' The water board does the pipes for you.' : '') + ' (Ctrl+Z to undo)');
      if (b.reward && b.reward >= 800) news(b.n.toUpperCase() + ' OPENS. PEOPLE FLOCK TO GAWP AT IT.', true);
      tutorialCheck();
    }
    let qEl = null;
    function qbox(html) { if (qEl) { qEl.remove(); qEl = null; } if (!html) return; qEl = document.createElement('div'); qEl.className = 'dg-city-q'; qEl.innerHTML = '<button type="button" aria-label="Close">x</button>' + html; view.appendChild(qEl); qEl.querySelector('button').addEventListener('click', () => qbox(null)); }
    let qTile = null;
    const bar = (v, good) => `<span class="dg-city-qb"><i style="width:${Math.round(v / 2.55)}%;background:${heat(v, good)}"></i></span>`;
    function query(t) {
      if (!t) return; const i = idx(t[0], t[1]); qTile = i; G.sfx('click');
      const pct = v => Math.round(v / 2.55) + '%';
      const meters = `<table class="dg-city-qt"><tr><td>Land value</td><td>${bar(lval[i], 1)}</td><td>${pct(lval[i])}</td></tr><tr><td>Pollution</td><td>${bar(poll[i])}</td><td>${pct(poll[i])}</td></tr><tr><td>Crime</td><td>${bar(crime[i])}</td><td>${pct(crime[i])}</td></tr></table>`;
      let h = '';
      if (typ[i] === T_ZONE && zk[i]) {
        const names = { 1: ['Empty lot', 'Little house', 'Semi-detached houses', ''], 2: ['', 'Block of flats', 'Big block of flats', 'Tower block'] };
        const cnames = { 1: ['Empty lot', 'Corner shop', 'High street shop', ''], 2: ['', 'Offices', 'Office block', 'Skyscraper'] };
        const inames = { 1: ['Empty lot', 'Workshop', 'Factory', ''], 2: ['', 'Works', 'Big factory', 'Crisp factory'] };
        const nm = (zk[i] === ZR ? names : zk[i] === ZC ? cnames : inames)[zd[i] ? 2 : 1][lv[i]] || 'Empty lot';
        const v = lv[i] ? POP[zk[i]][zd[i]][lv[i]] : 0, why = blocker(i), max = MAXLV[zd[i]];
        h = `<b>${nm}</b><br>${ZNAME[zk[i]]} zone (${zd[i] ? 'dense' : 'light'}) &middot; size ${lv[i]} of ${max}<br>${zk[i] === ZR ? 'Residents' : 'Jobs'}: ${num(v)}<br>Power: ${pow[i] ? 'yes' : '<b style="color:#c00">NO</b>'} &middot; Road: ${roadD[i] <= 3 ? 'yes' : '<b style="color:#c00">too far</b>'} &middot; Water: ${waterShort() ? '<b style="color:#c00">short</b>' : 'yes'}${meters}`;
        h += why ? `<div class="dg-city-why"><b>Why isn't it growing?</b> ${esc(why)}</div>` : lv[i] >= max ? '<div class="dg-city-why ok">As big as it gets. Lovely.</div>' : '<div class="dg-city-why ok">Happy and growing!</div>';
        if (fire[i]) h += '<br><b style="color:#c00">ON FIRE!</b>';
      } else if (typ[i] === T_BLD) {
        const b = bldAt(i), d = BLD[b.k];
        h = `<b>${esc(d.n)}</b><br>${esc(d.d)}` + (d.cap ? `<br>Power: ${Math.round(powUse)} of ${powCap} units used (whole grid)` : '') + (d.wat ? `<br>Water: ${Math.round(watUse)} of ${watCap} units used (whole city)` : '') + (d.cov ? `<br>Funding: ${S.fund[d.cov] == null ? 100 : S.fund[d.cov]}%` : '') + (d.up ? `<br>Upkeep: ${fmt(d.up)} a month` : '') + (d.good ? '<br>Makes the land around it worth more.' : '');
      } else if (typ[i] === T_ROAD) {
        const tr = traf[i], lvl = tr > 170 ? '<b style="color:#c00">JAMMED</b>' : tr > 110 ? 'busy' : tr > 50 ? 'steady' : 'quiet';
        h = `<b>${ter[i] === WATER ? 'Bridge' : 'Road'}</b><br>Traffic: ${lvl} ${bar(tr)}<br>Upkeep: a quarter of a Rupee a month${pl[i] ? '<br>A power line runs along it.' : ''}${tr > 170 ? '<div class="dg-city-why">Too many cars! Add more roads nearby, or a Bus Depot.</div>' : ''}`;
      }
      else if (typ[i] === T_RUB) h = '<b>Rubble</b><br>Bulldoze it (2 Rupees) or wait for the council to tidy it up.';
      else h = `<b>${ter[i] === WATER ? 'Water' : ter[i] === TREES ? 'Trees' : 'Grass'}</b>${pl[i] ? '<br>Power line' : ''}${meters}`;
      qbox(h + `<small style="color:#666">Tile ${t[0]}, ${t[1]}</small>`);
    }

    // ================================================================ in-game dialogs
    const modalStack = [];
    function modal(title, html, buttons, noClose) {
      const m = document.createElement('div'); m.className = 'dg-city-modal';
      m.innerHTML = `<div class="dg-city-dlg"><div class="t">${esc(title)}</div><div class="b">${html}</div><div class="f"></div></div>`;
      const f = m.querySelector('.f');
      const close = () => { if (!m.isConnected) return; m.remove(); modals = Math.max(0, modals - 1); const k = modalStack.indexOf(o); if (k >= 0) modalStack.splice(k, 1); };
      (buttons || [['OK']]).forEach(([l, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = l; b.addEventListener('click', () => { G.sfx('click'); if (fn && fn(m) === false) return; close(); }); f.appendChild(b); });
      root.appendChild(m); modals++;
      const o = { m, close, noClose }; modalStack.push(o);
      setTimeout(() => { const b = f.querySelector('button'); if (b) b.focus(); }, 30);
      return o;
    }
    function closeTopModal() { const o = modalStack[modalStack.length - 1]; if (!o || o.noClose) return false; o.close(); return true; }
    let petEl = null;
    const who2 = who => ADV[who] || (who === 'kids' ? ['Luke & Dave', 'Petitioners'] : who === 'mom' ? ['Mom', 'Calling up the stairs'] : ['Citizen', '']);
    function pet(who, text, buttons) {
      if (petEl) petEl.remove();
      const [nm, role] = who2(who);
      petEl = document.createElement('div'); petEl.className = 'dg-city-pet';
      petEl.innerHTML = `<div class="t">${esc(nm)}${role ? ' - ' + esc(role) : ''}</div><div class="b">${FACES[who] || FACES.plan}<div>${esc(text)}</div></div><div class="f"></div>`;
      const el = petEl, f = el.querySelector('.f');
      (buttons || [['OK']]).forEach(([l, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = l; b.addEventListener('click', () => { G.sfx('click'); el.remove(); if (petEl === el) petEl = null; if (fn) fn(); }); f.appendChild(b); });
      view.appendChild(el); G.sfx('uhoh'); G.note(880, 0.05, 'square');
      G.timer(() => { if (el.isConnected) { el.remove(); if (petEl === el) petEl = null; } }, 30000);
    }
    function budget() {
      if (!S || !playing || visiting) return;
      S.tutBud = 1; tutorialCheck();
      const sl = (k, v, max, lab) => `<span>${lab}</span><input type="range" min="0" max="${max}" value="${v}" data-b="${k}" aria-label="${lab}"><b data-v="${k}">${v}%</b>`;
      const dealRows = () => (S.deals || []).length ? S.deals.map((d, n) => `<span style="grid-column:1/-1;display:flex;gap:6px;align-items:center"><span style="flex:1"><b>${esc(d.city)}</b> (${esc(d.n)}): ${esc(DEALS[d.k] ? DEALS[d.k].n : d.k)}, ${DEALS[d.k] && DEALS[d.k].pay < 0 ? '-' : '+'}${fmt(Math.abs(DEALS[d.k] ? DEALS[d.k].pay : 0))} a month</span><button type="button" class="btn" data-x="${n}" style="min-width:0">Cancel</button></span>`).join('') : '<span style="grid-column:1/-1">No deals yet. Visit a neighbouring city on JackNet (Game menu) and shake hands with its Mayor.</span>';
      const html = `<div class="dg-city-bud">
<h4>Taxes (higher = more Rupees, but people and firms move away)</h4>${sl('rTax', S.rTax, 20, 'Residential')}${sl('cTax', S.cTax, 20, 'Commercial')}${sl('iTax', S.iTax, 20, 'Industrial')}
<h4>Funding (lower = cheaper, but it covers a smaller area)</h4>${sl('pol', S.fund.pol, 100, 'Police')}${sl('fir', S.fund.fir, 100, 'Fire')}${sl('edu', S.fund.edu, 100, 'Schools')}${sl('hea', S.fund.hea, 100, 'Hospitals')}${sl('bus', S.fund.bus == null ? 100 : S.fund.bus, 100, 'Buses')}
<h4>Laws (ordinances)</h4>${Object.keys(ORDS).map(k => `<label style="grid-column:1/-1;display:flex;gap:6px;align-items:center"><input type="checkbox" data-o="${k}" ${S.ords[k] ? 'checked' : ''}><span><b>${esc(ORDS[k].n)}</b> (${ORDS[k].c ? fmt(ORDS[k].c) + ' a month' : 'free'}): ${esc(ORDS[k].d)}</span></label>`).join('')}
<h4>This month (estimate)</h4><span style="grid-column:1/-1" class="dg-city-est"></span>
<h4>Neighbour deals</h4><span style="display:contents" class="dg-city-deals">${dealRows()}</span>
<h4>Loans</h4><span style="grid-column:1/-1">${S.loans.length ? S.loans.map(l => `${fmt(l.pay)} a month for ${l.left} more months`).join('<br>') : 'No loans. The bank manager is waiting. He has a tie with ducks on.'}</span>
</div>`;
      const est = () => { const v = upkeep(), e = v.e; return `<table class="dg-city-ledger"><tr><td>Taxes coming in</td><td>+${fmt(v.inc)}</td></tr>${v.dIn ? `<tr><td>Neighbour deals</td><td>${v.dIn >= 0 ? '+' : '-'}${fmt(Math.abs(v.dIn))}</td></tr>` : ''}<tr><td>Roads</td><td>-${fmt(e.roads)}</td></tr><tr><td>Police, fire, schools, hospitals, buses</td><td>-${fmt(e.pol + e.fir + e.edu + e.hea + e.bus)}</td></tr><tr><td>Power and water</td><td>-${fmt(e.power + e.water)}</td></tr><tr><td>Laws and other bits</td><td>-${fmt(e.ord + e.other)}</td></tr>${e.loans ? `<tr><td>Loan repayments</td><td>-${fmt(e.loans)}</td></tr>` : ''}<tr class="tot"><td>Every month</td><td style="color:${v.inc + v.dIn - (v.tot + v.dIn) >= 0 ? '#060' : '#c00'}">${v.inc - v.tot >= 0 ? '+' : '-'}${fmt(Math.abs(v.inc - v.tot))}</td></tr></table>Treasury: <b>${fmt(S.money)}</b>`; };
      const o = modal('Budget - ' + S.name, html, [['Take a Loan (' + fmt(10000) + ')', () => { if (S.loans.length >= 3) { G.msg('Bank of Jack', 'The bank says no. Three loans is enough. The bank manager is getting grumpy.', 'warn'); return false; } S.loans.push({ pay: 320, left: 36 }); S.money += 10000; G.sfx('dice'); updateTop(); news('MAYOR BORROWS 10,000 RUPEES FROM THE BANK OF JACK. BANK MANAGER "DELIGHTED".', true); }], ['Done']]);
      const m = o.m, estEl = m.querySelector('.dg-city-est');
      estEl.innerHTML = est();
      m.querySelectorAll('[data-b]').forEach(r => r.addEventListener('input', () => { const k = r.dataset.b, v = +r.value; if (k in S.fund || k === 'bus') S.fund[k] = v; else S[k] = v; m.querySelector(`[data-v="${k}"]`).textContent = v + '%'; computeTotals(); updateTop(); estEl.innerHTML = est(); dirtyMaps = true; }));
      m.querySelectorAll('[data-o]').forEach(c => c.addEventListener('change', () => { S.ords[c.dataset.o] = c.checked ? 1 : 0; computePower(); computeTotals(); estEl.innerHTML = est(); dirtyMaps = true; updateTop(); }));
      m.querySelector('.dg-city-deals').addEventListener('click', ev => { const b = ev.target.closest('[data-x]'); if (!b) return; const d = S.deals[+b.dataset.x]; if (!d) return; S.deals.splice(+b.dataset.x, 1); G.sfx('thud'); news('DEAL OFF! JACKCITY AND ' + String(d.city).toUpperCase() + ' "NOT SPEAKING".', true); computePower(); computeTotals(); updateTop(); m.querySelector('.dg-city-deals').innerHTML = dealRows(); estEl.innerHTML = est(); });
    }
    function advice() {
      const a = {};
      const u = upkeep(), net = u.inc - u.tot, zones = (() => { let n = 0; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE) n++; return n; })();
      a.fin = S.money < 0 ? 'We\'re in the red! Raise taxes a bit, cut funding, or take a loan. And no more statues.' : net < 0 ? `We're losing ${fmt(-net)} a month. More residents means more taxes - or trim the budget.` : Math.max(S.rTax, S.cTax, S.iTax) > 11 ? 'Taxes are sky high, Mayor. People are moving to the next town. Try 7 to 9 percent.' : `The budget is healthy: ${fmt(net)} a month profit. Treat yourself to a Jack Burger.`;
      a.pow = !powCap ? 'We have NO power plant! Nothing grows without power. Build a Wind Turbine or a Coal Power Plant and run Power Lines to your zones. Zones pass power to each other, but roads don\'t: run a Power Line across the road.' : unpowered ? `${unpowered} zone tile(s) have no power. Check the Power Grid data map: red means no electric. Join them up with Power Lines.` : powUse > powCap * 0.85 ? 'We\'re nearly out of power. When the grid runs out, buildings go dark and people leave. Build another plant.' : waterShort() ? 'We\'ve run out of water! Bigger buildings won\'t grow without it. Build a Water Tower, or a Pumping Station next to the river.' : watUse > watCap * 0.85 ? 'Water\'s getting low. A Water Tower or a Pumping Station would sort it.' : 'Power and water are fine. My PC has never been happier. (I\'ve still only got 32 MB of RAM though.)';
      const avgC = crime.reduce((s, v) => s + v, 0) / NN, burning = fire.reduce((s, v) => s + (v ? 1 : 0), 0);
      a.safe = burning ? 'THERE\'S A FIRE! Fire stations put out fires in their area. Bulldoze a gap to stop it spreading.' : P > 300 && !has('police') ? 'Crime is creeping up, Mayor. Someone nicked my hat. Build a Police Station.' : P > 500 && !has('fire') ? 'No fire station! If anything catches fire, it\'s all going up. Build one near the houses.' : avgC > 30 ? 'Crime is high. More police stations, or better police funding.' : 'All quiet on the streets. Except Dave. Dave is never quiet.';
      a.plan = !zones ? 'Start with a Road, then zone Residential (green) and Industrial (yellow) along it. Then power it all up!' : dR > 0.4 ? 'People want houses! Zone more Residential (green), near the road, away from smoky factories.' : dC > 0.4 ? 'People want shops. Zone some Commercial (blue) near the houses.' : dI > 0.4 ? 'Builders want factories. Zone more Industrial (yellow). Keep it away from the houses - it\'s smelly.' : P > 600 && !has('school') ? 'A School and a Hospital make land worth more, so bigger buildings grow. Trust me, I read it in a book.' : 'Looking good! Dense zones grow into big blocks once the town is bigger and land is worth more. Query a lot to see why it isn\'t growing.';
      let far = 0; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i] && roadD[i] > 3) far++;
      a.tra = far ? `${far} zone tile(s) are more than 3 tiles from a road. Nobody walks that far. Not even to the chippy.` : jams > 2 ? `${jams} bits of road are jammed solid. More roads, or a Bus Depot (Services). The Traffic data map shows the worst spots.` : !roadsN ? 'No roads yet! I\'ve got a bus and nowhere to drive it.' : P > 1500 && !has('bus') ? 'A Bus Depot would keep the cars down as the town grows. I\'d drive it myself.' : 'Traffic is flowing nicely. Well, apart from that snail on the High Street.';
      const avgP = poll.reduce((s, v) => s + v, 0) / NN;
      a.env = avgP > 30 ? 'Pollution is bad, Mayor. The ducks are coughing. Plant parks, or try the Recycling law, or swap coal for gas or wind.' : !has('park') ? 'Parks! Trees! Ponds with ducks in! People pay more to live near a park.' : 'The air smells nice. Mostly chips, but nice chips.';
      return a;
    }
    function advisors() {
      if (!S || !playing || visiting) return;
      const a = advice();
      modal('Advisors - ' + S.name, Object.keys(ADV).map(k => `<div class="dg-city-adv">${FACES[k]}<div><p><b>${esc(ADV[k][0])}</b> (${esc(ADV[k][1])})</p><p>${esc(a[k])}</p></div></div>`).join(''), [['Thanks, everyone']]);
    }

    // ---- the advisors' guided start (skippable; remembered once seen). S.tut = step, or -1 when off/done.
    const countT = (t, k) => { let n = 0; for (let i = 0; i < NN; i++) if (typ[i] === t && (k == null || zk[i] === k)) n++; return n; };
    const TUT = [
      { who: 'plan', hint: 'road', t: 'Welcome, Mayor! I\'m JackK, your Planner. Every town starts with a road: pick Road (R) and drag a street across the grass.', ok: () => countT(T_ROAD) >= 6 },
      { who: 'plan', hint: '@zone', f: ['zr0'], t: 'Lovely road! Now somewhere to live: open Zones and pick Residential (light), then drag a box right next to the road. Houses need a road within 3 tiles.', ok: () => countT(T_ZONE, ZR) >= 6 },
      { who: 'pow', hint: '@power', f: ['b:coal', 'b:wind'], t: 'Callum, Power. Nothing grows without electric! Open Power and build a Coal Power Plant a little way from the houses. (A Wind Turbine is cheaper, but tiny.)', ok: () => powCap > 0 },
      { who: 'pow', hint: '@power', f: ['line'], t: 'Now join it up: pick Power Line and draw from the plant to your zones. Zones pass power to each other, but roads don\'t, so run a line across any road. Blinking yellow bolts mean "no power".', ok: () => countT(T_ZONE, ZR) > 0 && unpowered === 0 },
      { who: 'plan', hint: '@zone', f: ['zi0', 'zc0'], t: 'People need jobs and shops! Zone some Industrial (yellow) a little way from the houses (factories are smelly) and some Commercial (blue) along the road. Power them up too.', ok: () => countT(T_ZONE, ZC) >= 4 && countT(T_ZONE, ZI) >= 4 },
      { who: 'tra', hint: 'spd', t: 'Mr Lane, Transport. Right, let\'s get things moving! Press the >>> (rocket) speed button and watch your town grow. Little cars mean people are off to work.', ok: () => P >= 40 },
      { who: 'fin', hint: '!budget', t: 'Mrs Tuppence, Finance. Taxes pay for everything. Open the Budget (B) to see the Rupees coming in. About 7% is fair: higher brings in more, but people move away.', ok: () => !!S.tutBud },
      { who: 'plan', t: 'That\'s the basics, Mayor! The R C I bars at the top show what people want more of: homes, shops, factories. Your first goal is 500 people (a village). Query (Q) any building to see why it isn\'t growing. We\'ll pop up with advice now and then. Good luck!' },
    ];
    let tutEl = null;
    function tutorialCheck() {
      if (!S || visiting || S.tut == null || S.tut < 0) return drawTut();
      const st = TUT[S.tut];
      if (st && st.ok && playing && st.ok()) {
        S.tut++; G.sfx('solve'); G.note(784, 0.08, 'square'); G.timer(() => G.note(1047, 0.12, 'square'), 90);
      }
      drawTut();
    }
    function endTut(skipped) { if (!skipped) G.secret('city.tut'); S.tut = -1; G.save('tutSeen', 1); drawTut(); if (skipped) G.status('Tutorial skipped. You can start it again from Help > Advisor Tutorial.'); }
    function drawTut() {
      root.querySelectorAll('.hint').forEach(e => e.classList.remove('hint'));
      const st = S && !visiting && playing && S.tut >= 0 ? TUT[S.tut] : null;
      if (!st) { if (tutEl) { tutEl.remove(); tutEl = null; } return; }
      if (!tutEl || tutEl._n !== S.tut) {
        if (!tutEl) { tutEl = document.createElement('div'); tutEl.className = 'dg-city-tut'; view.appendChild(tutEl); tutEl.addEventListener('click', ev => { const b = ev.target.closest('[data-tu]'); if (!b) return; G.sfx('click'); if (b.dataset.tu === 'skip' || b.dataset.tu === 'done') endTut(b.dataset.tu === 'skip'); else tutEl.classList.toggle('mini'); }); }
        const [nm, role] = who2(st.who), last = S.tut === TUT.length - 1;
        tutEl._n = S.tut;
        tutEl.innerHTML = `<div class="t"><span>${esc(nm)} - ${esc(role)}</span><small>Step ${S.tut + 1} of ${TUT.length}</small><button type="button" data-tu="min" title="Make it smaller / bigger" aria-label="Shrink">_</button></div><div class="b">${FACES[st.who]}<div>${esc(st.t)}</div></div><div class="f">${TUT.map((_, k) => `<i class="${k < S.tut ? 'd' : k === S.tut ? 'c' : ''}"></i>`).join('')}<span style="flex:1"></span>${last ? '<button type="button" class="btn" data-tu="done">Thanks!</button>' : '<button type="button" class="btn" data-tu="skip">Skip tutorial</button>'}</div>`;
      }
      if (st.hint) { const e = st.hint === 'spd' ? root.querySelector('.dg-city-spd [data-s="3"]') : toolsEl.querySelector(`[data-t="${st.hint}"]`); if (e) e.classList.add('hint'); }
      if (flyEl && st.f) st.f.forEach(f => { const e = flyEl.querySelector(`[data-f="${f}"]`); if (e) e.classList.add('hint'); });
    }
    // ---- timely advice after the tutorial (one at a time, each topic rests a while)
    let noTips = !!G.load('noTips', false);
    function advisorTip() {
      if (petEl || noTips || visiting || !S || S.tut >= 0 || S.months < 2 || Math.random() > 0.5) return false;
      const u = upkeep(), net = u.inc - u.tot, empty = k => { let n = 0; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i] === k && !lv[i] && pow[i] && roadD[i] <= 3) n++; return n; };
      let far = 0, posh = 0; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i]) { if (roadD[i] > 3) far++; else if (zk[i] === ZR && lv[i] && /^(Land value|Too much|Too smoky)/.test(blocker(i))) posh++; }
      const avgP = poll.reduce((s, v) => s + v, 0) / NN, flyB = t => () => { const b = toolsEl.querySelector(`[data-t="${t}"]`); if (b) { openFly(t.slice(1), b); flyEl._k = t; } };
      const L = [
        ['unpow', unpowered > 3, 'pow', `${unpowered} zone tiles have no power, Mayor! They're blinking yellow bolts at me. Run Power Lines to them. The Power Grid map shows the dark bits in red.`, [['Show me', () => setOverlay('power')], ['OK']], 5],
        ['powlow', powCap && powUse > powCap * 0.88, 'pow', `The grid is at ${Math.round(powUse / powCap * 100)}%! When it runs out, buildings go dark. Build another power plant before my PC switches off again.`, [['Power menu', flyB('@power')], ['OK']], 6],
        ['water', P > 80 && watUse > watCap * 0.9, 'pow', waterShort() ? 'The taps have run DRY! Bigger buildings won\'t grow without water. Build a Water Tower, or a Pumping Station right next to the river or sea.' : 'Water\'s nearly all used up. A Water Tower now would save a lot of moaning later.', [['Water Tower', () => setTool('b:wtower')], ['OK']], 6],
        ['road', far > 3, 'tra', `${far} zone tiles are too far from a road (more than 3 tiles). Nobody will build there. Not even Dave.`, [['Road tool', () => setTool('road')], ['OK']], 8],
        ['traffic', jams > 3, 'tra', `${jams} bits of road are jammed solid! Build more roads to share the cars out, or a Bus Depot (Services) nearby. The Traffic map shows the red bits.`, [['Traffic map', () => setOverlay('traf')], ['OK']], 9],
        ['zoneR', dR > 0.45 && empty(ZR) < 3, 'plan', 'People are queuing to move here! Zone more Residential (green), near a road and away from the factories.', [['Zones', flyB('@zone')], ['OK']], 5],
        ['zoneI', dI > 0.45 && empty(ZI) < 3, 'plan', 'Builders want more factories! Zone some Industrial (yellow). Not next to the houses, though.', [['Zones', flyB('@zone')], ['OK']], 6],
        ['zoneC', dC > 0.45 && empty(ZC) < 3, 'plan', 'People want shops! Zone some Commercial (blue) near the houses.', [['Zones', flyB('@zone')], ['OK']], 6],
        ['net', net < 0 && S.money < 6000, 'fin', `We're losing ${fmt(-net)} a month and the treasury has ${fmt(S.money)}. Nudge the taxes up a bit, or trim the funding.`, [['Budget', () => budget()], ['Later']], 6],
        ['lval', posh > 12 && dR > 0.2, 'plan', `${posh} homes could grow bigger, but the area isn't nice enough. Police Stations cut crime; parks, schools, hospitals, trees and water views make land worth more; smoke makes it worth less. Query a house to see what's wrong. (Or just zone more homes!)`, [['Crime map', () => setOverlay('crime')], ['Land Value map', () => setOverlay('lval')], ['OK']], 10],
        ['tax', Math.max(S.rTax, S.cTax, S.iTax) >= 11, 'fin', 'Taxes are ever so high, Mayor. People are packing their suitcases. Somewhere around 7 to 9 percent keeps everyone happy.', [['Budget', () => budget()], ['OK']], 10],
        ['police', P > 500 && !has('police'), 'safe', 'Crime\'s going up! Someone pinched the gnomes off the roundabout. We need a Police Station.', [['Build one', () => setTool('b:police')], ['Later']], 10],
        ['firest', P > 700 && !has('fire'), 'safe', 'No fire station, Mayor! If anything catches fire it\'s all going up. Build one near the houses.', [['Build one', () => setTool('b:fire')], ['Later']], 10],
        ['school', P > 900 && !has('school'), 'plan', 'A School makes land worth more, so houses grow into bigger houses. And the kids get clever. Mostly.', [['Build one', () => setTool('b:school')], ['Later']], 12],
        ['poll', avgP > 28, 'env', 'Ms Greenleaf here. The air is thick with smog and the ducks are coughing. Parks soak it up, the Recycling law helps, and gas or wind beats coal.', [['Pollution map', () => setOverlay('poll')], ['OK']], 10],
        ['rating', S.rating < 35 && P > 300, 'fin', `Only ${S.rating}% of people think you're doing a good job. Check City Info (I) to see what they're moaning about.`, [['City Info', () => cityInfo()], ['OK']], 12],
      ];
      for (const [k, cond, who, text, btns, cool] of L) {
        if (!cond || (S.tips[k] || 0) > S.months) continue;
        S.tips[k] = S.months + cool; pet(who, text, btns); return true;
      }
      return false;
    }

    // ---- City Info: the numbers, the Mayor rating, graphs and goals
    function cityInfo() {
      if (!S || !playing) return;
      const parts = rateMayor(), u = upkeep(), net = u.inc - u.tot, workers = Math.round(P * 0.55), jobs = Jc + Ji;
      const worst = Object.entries(parts).filter(([, v]) => v < -2).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([k]) => ({ tax: 'taxes are too high', crime: 'crime', poll: 'pollution', jobs: 'not enough jobs', power: 'power cuts', water: 'no water', traffic: 'traffic jams', money: 'the city is in debt' }[k]));
      const sc = scenGoal(), ng = nextGoal();
      const row = (a, b) => `<tr><td>${a}</td><td><b>${b}</b></td></tr>`;
      const html = `<div class="dg-city-info"><div class="dg-city-info-l"><table class="dg-city-ledger">
${row('Population', num(P))}${row('Jobs (shops / factories)', num(jobs) + ` (${num(Jc)} / ${num(Ji)})`)}${row('Workers looking for jobs', workers > jobs ? num(workers - jobs) : 'nobody')}
${row('Power', Math.round(powUse) + ' of ' + powCap + (unpowered ? ` (${unpowered} dark)` : ''))}${row('Water', Math.round(watUse) + ' of ' + watCap + (waterShort() ? ' (SHORT!)' : ''))}${row('Traffic jams', jams ? jams + ' road tile(s)' : 'none')}
${row('Treasury', fmt(S.money))}${row('Every month', (net >= 0 ? '+' : '-') + fmt(Math.abs(net)))}</table>
<div class="dg-city-rating"><b>Mayor rating: ${S.rating}%</b><span class="dg-city-qb big"><i style="width:${S.rating}%;background:${heat(S.rating * 2.55, 1)}"></i></span><small>${worst.length ? 'People moan about: ' + esc(worst.join(', ')) + '.' : 'Nobody is moaning. Not even Grandad.'}</small></div>
<div class="dg-city-goals"><b>Goals</b><br>${sc ? esc(sc.long) : ''}${sc && ng ? '<br>' : ''}${ng ? `Next milestone: ${esc(ng[1])} at ${num(ng[0])} people (${num(P)} now).` : 'You\'ve reached every milestone. Metropolis!'}${S.deals && S.deals.length ? `<br>Neighbour deals: ${S.deals.length}` : ''}</div></div>
<div class="dg-city-info-r"><div class="dg-city-gtabs"><button type="button" class="btn on" data-g="p">People</button><button type="button" class="btn" data-g="m">Money</button><button type="button" class="btn" data-g="d">Demand</button></div><canvas class="dg-city-graph" width="300" height="150"></canvas><div class="dg-city-gkey"></div></div></div>`;
      const o = modal('City Info - ' + S.name, html, [['Close']]);
      const gc = o.m.querySelector('canvas'), gk = o.m.querySelector('.dg-city-gkey');
      const drawG = g => {
        o.m.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === g));
        const H = S.hist, x = gc.getContext('2d'), W = 300, Ht = 150;
        const sets = g === 'p' ? [[H.p, '#2a9a2a', 'Population'], [H.j, '#2a6ad8', 'Jobs']] : g === 'm' ? [[H.m, '#c08000', 'Treasury']] : [[H.r, '#3c3', 'Homes (R)'], [H.c, '#39f', 'Shops (C)'], [H.i, '#e8b000', 'Factories (I)']];
        x.fillStyle = '#000'; x.fillRect(0, 0, W, Ht);
        x.strokeStyle = '#1a3a1a'; x.lineWidth = 1; for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(0, k * Ht / 5 + 0.5); x.lineTo(W, k * Ht / 5 + 0.5); x.stroke(); }
        const all = sets.flatMap(s => s[0]); gk.innerHTML = sets.map(s => `<span><i style="background:${s[1]}"></i>${esc(s[2])}</span>`).join('') + `<small>last ${H.p.length} month(s)</small>`;
        if (all.length < 2) { x.fillStyle = '#7fe0ff'; x.font = '11px Tahoma,sans-serif'; x.fillText('Come back in a month or two:', 60, 70); x.fillText('graphs need a bit of history.', 64, 86); return; }
        let lo = g === 'd' ? -100 : Math.min(0, ...all), hi = g === 'd' ? 100 : Math.max(10, ...all); if (hi === lo) hi = lo + 1;
        const py = v => Ht - 6 - (v - lo) / (hi - lo) * (Ht - 18);
        if (lo < 0) { x.strokeStyle = '#666'; x.beginPath(); x.moveTo(0, py(0) + 0.5); x.lineTo(W, py(0) + 0.5); x.stroke(); }
        for (const [d, c] of sets) { x.strokeStyle = c; x.lineWidth = 2; x.beginPath(); d.forEach((v, k) => { const px = 4 + k / Math.max(1, d.length - 1) * (W - 8); if (k) x.lineTo(px, py(v)); else x.moveTo(px, py(v)); }); x.stroke(); }
        x.fillStyle = '#ccc'; x.font = '10px Tahoma,sans-serif'; x.fillText(g === 'd' ? 'wanted' : num(hi), 4, 11); x.fillText(g === 'd' ? 'not wanted' : num(lo), 4, Ht - 2);
      };
      o.m.querySelector('.dg-city-gtabs').addEventListener('click', ev => { const b = ev.target.closest('[data-g]'); if (b) { G.sfx('click'); drawG(b.dataset.g); } });
      drawG('p');
    }

    // ================================================================ scenarios: a goal, a deadline, a win or a lose screen
    const SCEN = {
      fresh: { n: 'A Fresh Start', months: 24, d: 'An empty valley with a river running through it. The council wants a proper town: 2,500 people within 2 years.', setup() { blank('Freshwater', 15000); genMap(4242, 'river'); }, goal: () => [P, 2500, 'people'] },
      bog: { n: 'It Came From The Bog', months: 24, d: 'Bogmouth is a happy seaside town. Something big is stirring in the bog... Survive the blob attack, then grow the town to 6,000 people within 2 years.', setup() { buildCallum('Bogmouth', 12000); S.callum = 0; }, goal: () => [P, 6000, 'people', !S.scen.blobDone && 'and survive the blob'] },
      dark: { n: 'Blackout Borough', months: 18, d: 'Both power plants have conked out and Dimly-on-Sea is in the dark. Get every zone powered and the town up to 5,000 people within 18 months.', setup() { buildCallum('Dimly-on-Sea', 7000); S.callum = 0; blds.filter(b => BLD[b.k].cap).forEach(b => removeB(blds.indexOf(b), true)); recalcAll(); }, goal: () => [P, 5000, 'people', unpowered > 0 && 'with no power cuts'] },
      skint: { n: 'Skint City', months: 36, d: 'The last Mayor spent everything on a giant millennium sandcastle. Get the treasury up to 15,000 Rupees within 3 years without going bust.', setup() { buildCallum('Skintley', -1500); S.callum = 0; S.loans = [{ pay: 320, left: 30 }, { pay: 320, left: 30 }]; S.rTax = 5; S.cTax = 5; S.iTax = 5; S.ords = { burgerfri: 1, tourism: 1, lollipop: 1 }; }, goal: () => [Math.max(0, S.money), 15000, 'Rupees'] },
      metro: { n: 'Metropolis 19100', months: 120, d: 'A huge empty lakeside, a big pot of money and one big dream: 10,000 people within 10 years.', setup() { blank('Metropolis', 60000); genMap(19100, 'lake'); }, goal: () => [P, 10000, 'people'] },
    };
    function scenGoal() {
      const sc = S && S.scen; if (!sc || !SCEN[sc.id]) return null;
      const d = SCEN[sc.id], [v, target, unit, extra] = d.goal(), left = sc.dl - (S.months - sc.start), won = v >= target && !extra;
      if (sc.done === 1) return { short: 'WON! ' + d.n, long: `Scenario "${d.n}": WON! You're playing on for fun now.`, won: true };
      if (sc.done === -1) return { short: 'Free play', long: `Scenario "${d.n}" is over. You're playing on for fun.` };
      return { short: `Goal ${num(Math.min(v, target))}/${num(target)} · ${left} mo`, long: `Scenario "${d.n}": ${num(target)} ${unit}${extra ? ' ' + extra : ''}. You have ${num(Math.min(v, target))} with ${left} month(s) to go.`, won, left, v, target };
    }
    function scenTick() {
      const sc = S.scen; if (!sc || sc.done || !SCEN[sc.id]) return false;
      const el = S.months - sc.start;
      if (sc.id === 'bog' && !sc.blobGo && el >= 3) { sc.blobGo = 1; startSquig(); return true; }
      const g = scenGoal();
      if (g.won) {
        sc.done = 1; const frac = el / sc.dl, stars = frac <= 0.5 ? 3 : frac <= 0.8 ? 2 : 1, best = G.load('scen', {}) || {};
        if (!(best[sc.id] >= stars)) { best[sc.id] = stars; G.save('scen', best); }
        G.secret('city.scen'); G.sfx('solve'); news('MAYOR DOES IT! ' + SCEN[sc.id].n.toUpperCase() + ' SCENARIO WON. COUNCIL THROWS A PARTY WITH JELLY.', true);
        modal('SCENARIO WON!', `<div class="dg-city-adv">${FACES.fin}<div><p class="dg-city-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p><p><b>${esc(SCEN[sc.id].n)}: you did it in ${el} month(s)!</b></p><p>The council is so pleased they've given you a certificate. It's laminated. You can carry on playing ${esc(S.name)} as long as you like.</p></div></div>`, [['Keep playing'], ['Scenarios', () => scenDlg()]]);
        return true;
      }
      if (el >= sc.dl) {
        sc.done = -1; G.sfx('uhoh'); news('TIME\'S UP FOR THE MAYOR. COUNCIL "A BIT DISAPPOINTED, TO BE HONEST".', true);
        modal('Out of time!', `<div class="dg-city-adv">${FACES.mom}<div><p><b>${esc(SCEN[sc.id].n)}: not this time.</b></p><p>${esc(g.long)}</p><p>Mom says it's only a game and tea's ready. You can try again, or carry on building for fun.</p></div></div>`, [['Try again', () => startScen(sc.id)], ['Keep playing'], ['Title screen', () => titleScreen()]], true);
        return true;
      }
      if (el === Math.floor(sc.dl / 2) && !sc.half) { sc.half = 1; pet('fin', `Halfway there, Mayor! ${g.long}`, [['City Info', () => cityInfo()], ['OK']]); }
      return false;
    }
    function startScen(id) {
      const d = SCEN[id]; if (!d) return;
      d.setup(); S.scen = { id, start: S.months, dl: d.months, done: 0 }; S.tut = -1; S.dis = true;
      recalcAll();
      startPlay(d.n + ': ' + d.d);
      modal('Scenario: ' + d.n, `<div class="dg-city-adv">${FACES.plan}<div><p><b>${esc(d.n)}</b></p><p>${esc(d.d)}</p><p>Your goal is shown at the top of the screen. Click it for City Info.</p></div></div>`, [['Let\'s go!']]);
    }
    function scenDlg() {
      const best = G.load('scen', {}) || {};
      const rows = Object.keys(SCEN).map(k => `<div class="dg-city-slot" data-sc="${k}">${ICO.reward.replace('<svg', '<svg width="28" height="28"')}<div><b>${esc(SCEN[k].n)} <span class="dg-city-stars">${best[k] ? '★'.repeat(best[k]) + '☆'.repeat(3 - best[k]) : ''}</span></b><small>${esc(SCEN[k].d)}</small></div></div>`).join('');
      const o = modal('Scenarios', `<p style="margin:0 0 6px">Pick a challenge. Win quickly for three stars.</p>${rows}`, [['Cancel']]);
      o.m.querySelectorAll('[data-sc]').forEach(e => e.addEventListener('click', () => { G.sfx('button'); o.close(); if (visiting) visiting = null; startScen(e.dataset.sc); }));
    }

    // ================================================================ saving (and checking anything that comes in from JackNet)
    const SLOTS = ['auto', '1', '2', '3'];
    function snapshot() { return { S, ter: b64(ter), typ: b64(typ), pl: b64(pl), zk: b64(zk), zd: b64(zd), lv: b64(lv), fire: b64(fire), blds, when: MONTHS[S.mo] + ' ' + yearStr(S.yr), pop: P }; }
    const MAXV = { ter: 2, typ: 4, pl: 1, zk: 3, zd: 1, lv: 3, fire: 60 };
    function restore(d) {
      if (!d || !d.S || typeof d.S !== 'object') throw new Error('bad city');
      const A = {};
      for (const k in MAXV) { const a = unb64(Array.isArray(d[k]) ? d[k].join('') : String(d[k] || ''), Uint8Array); if (a.length !== NN) throw new Error('bad ' + k); for (let i = 0; i < NN; i++) if (a[i] > MAXV[k]) a[i] = MAXV[k]; A[k] = a; }
      const s = d.S, nu = (v, a, b, def) => (typeof v === 'number' && isFinite(v)) ? clamp(v, a, b) : def, ob = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      blank(String(s.name || 'Jacksville').slice(0, 24), nu(s.money, -1e9, 1e9, 0));
      Object.assign(S, { mo: nu(s.mo, 0, 11, 0) | 0, yr: nu(s.yr, 0, 9999, 0) | 0, day: nu(s.day, 0, 29, 0) | 0, rTax: nu(s.rTax, 0, 20, 7) | 0, cTax: nu(s.cTax, 0, 20, 7) | 0, iTax: nu(s.iTax, 0, 20, 7) | 0,
        maxP: nu(s.maxP, 0, 1e7, 0), months: nu(s.months, 0, 1e6, 0) | 0, dis: s.dis !== false, callum: s.callum ? 1 : 0, startP: nu(s.startP, 0, 1e7, 0), well: nu(s.well, 0, 5000, 40), rating: nu(s.rating, 0, 100, 60), tut: nu(s.tut, -1, TUT.length - 1, -1) | 0, tutBud: s.tutBud ? 1 : 0 });
      for (const k of ['pol', 'fir', 'edu', 'hea', 'bus']) S.fund[k] = nu(ob(s.fund)[k], 0, 100, 100) | 0;
      for (const k in ORDS) if (ob(s.ords)[k]) S.ords[k] = 1;
      for (const k in BLD) { if (ob(s.unlock)[k]) S.unlock[k] = 1; if (ob(s.placed)[k]) S.placed[k] = 1; }
      S.pets = Object.assign({}, ob(s.pets)); S.ms = Object.assign({}, ob(s.ms)); S.tips = Object.assign({}, ob(s.tips));
      S.loans = (Array.isArray(s.loans) ? s.loans : []).slice(0, 3).map(l => ({ pay: nu(l && l.pay, 0, 1000, 320), left: nu(l && l.left, 0, 60, 0) | 0 })).filter(l => l.left > 0);
      S.deals = (Array.isArray(s.deals) ? s.deals : []).filter(x => x && DEALS[x.k]).slice(0, 4).map(x => ({ n: String(x.n || '?').slice(0, 24), city: String(x.city || '?').slice(0, 40), k: x.k, since: nu(x.since, 0, 1e6, 0) }));
      const h = ob(s.hist); for (const k in S.hist) S.hist[k] = (Array.isArray(h[k]) ? h[k] : []).slice(-120).map(v => nu(v, -1e9, 1e9, 0));
      const sc = ob(s.scen); S.scen = SCEN[sc.id] ? { id: sc.id, start: nu(sc.start, 0, 1e6, 0), dl: nu(sc.dl, 1, 1000, 12), done: nu(sc.done, -1, 1, 0), blobGo: sc.blobGo && sc.blobDone ? 1 : 0, blobDone: sc.blobDone ? 1 : 0, half: sc.half ? 1 : 0 } : null;
      ({ ter, typ, pl, zk, zd, lv, fire } = A);
      for (let i = 0; i < NN; i++) { if (typ[i] !== T_ZONE) { if (typ[i] !== T_RUB) zk[i] = 0; lv[i] = 0; } else if (lv[i] > MAXLV[zd[i]]) lv[i] = MAXLV[zd[i]]; if (typ[i] === T_BLD) typ[i] = T_NONE; }
      blds = [];
      for (const b of (Array.isArray(d.blds) ? d.blds : []).slice(0, 600)) {
        if (!b || !BLD[b.k] || !Number.isInteger(b.x) || !Number.isInteger(b.y)) continue; const sz = BLD[b.k].sz || 1;
        if (!inb(b.x, b.y) || !inb(b.x + sz - 1, b.y + sz - 1)) continue;
        let free = true; for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) if (typ[idx(b.x + dx, b.y + dy)] === T_BLD) free = false;
        if (!free) continue;
        blds.push({ k: b.k, x: b.x, y: b.y }); for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { const i = idx(b.x + dx, b.y + dy); typ[i] = T_BLD; zk[i] = 0; lv[i] = 0; }
      }
      reAnc(); recalcAll();
      if (!(s.v >= 2)) { S.well = Math.max(40, Math.ceil(watUse * 1.1 - (watCap - S.well))); S.v = 2; recalcAll(); } // older cities: grandfathered water
    }
    function save(slot) { if (visiting) return; try { G.save('slot' + slot, snapshot()); if (slot !== 'auto') { G.toast('JackCity 3000', `Saved "${S.name}" to slot ${slot}.`, 3000); G.sfx('join'); } } catch (e) { G.msg('JackCity 3000', 'Could not save. The disk is full (of Dave\'s homework).', 'warn'); } }
    function autosave() { if (S && !S.callum && !visiting) save('auto'); }
    // the carry-on save (a refresh, a closed window or a Shut Down): the city as it is, back paused (Callum's too). Not while visiting.
    const AS = G.autosave(() => (visiting ? (visiting.home ? visiting.home.snap : undefined) : playing && S ? snapshot() : undefined));
    function slotInfo(s) { const d = G.load('slot' + s, null); return d && d.S ? d : null; }
    function loadDlg() {
      const rows = SLOTS.map(s => { const d = slotInfo(s); return `<div class="dg-city-slot" data-s="${s}" ${d ? '' : 'style="opacity:.55"'}>${ICO.zone.replace('<svg', '<svg width="28" height="28"')}<div><b>${s === 'auto' ? 'Autosave' : 'Slot ' + s}: ${d ? esc(d.S.name) : '(empty)'}</b><small>${d ? esc(d.when) + ' &middot; ' + num(d.pop || 0) + ' people &middot; ' + esc(fmt(d.S.money)) : 'Nothing saved here yet.'}</small></div></div>`; }).join('')
        + `<div class="dg-city-slot" data-s="callum">${ICO.reward.replace('<svg', '<svg width="28" height="28"')}<div><b>CALLUM'S CITY - DO NOT SAVE OVER IT</b><small>Callumton, Oct 1999. "I've got a system," says Callum. The system is mostly houses.</small></div></div>`;
      const o = modal('Load City', rows, [['Cancel']]);
      o.m.querySelectorAll('[data-s]').forEach(e => e.addEventListener('click', () => {
        const s = e.dataset.s;
        if (s === 'callum') { o.close(); visiting = null; buildCallum(); startPlay('Loaded Callum\'s city. Don\'t tell him.'); return; }
        const d = slotInfo(s); if (!d) { G.sfx('beep'); return; }
        o.close(); visiting = null;
        try { restore(d); startPlay('Loaded "' + S.name + '".'); } catch (err) { console.warn(err); G.msg('JackCity 3000', 'That save file is corrupted. (Possibly by Dave.)', 'warn'); titleScreen(); }
      }));
    }
    function saveDlg() {
      if (!S || visiting) return;
      if (S.callum) G.toast('JackCity 3000', 'Callum said DON\'T save over his city. Pick a slot of your own.', 4000);
      const rows = SLOTS.filter(s => s !== 'auto').map(s => { const d = slotInfo(s); return `<div class="dg-city-slot" data-s="${s}">${ICO.budget.replace('<svg', '<svg width="28" height="28"')}<div><b>Slot ${s}: ${d ? esc(d.S.name) : '(empty)'}</b><small>${d ? esc(d.when) + ' &middot; ' + num(d.pop || 0) + ' people' : 'Empty'}</small></div></div>`; }).join('');
      const o = modal('Save City', rows, [['Cancel']]);
      o.m.querySelectorAll('[data-s]').forEach(e => e.addEventListener('click', () => { o.close(); if (S.callum) { S.callum = 0; S.name = S.name.replace(' (Callum\'s)', ' (mine now)'); } save(e.dataset.s); updateTop(); }));
    }

    // ================================================================ JackNet: neighbouring cities (Discs.showcase kind 'city')
    // JackNet keeps strings under 2,000 characters, so the tile layers go up in chunks
    const chunked = d => { const o = Object.assign({}, d); for (const k in MAXV) o[k] = o[k].match(/.{1,1500}/g) || []; return o; };
    const mineForNet = () => (!S || visiting || S.callum || !playing) ? null : { title: S.name, data: chunked(snapshot()), stats: { pop: P, jobs: Jc + Ji, year: yearStr(S.yr), rating: S.rating, size: blds.length } };
    function neighbours() {
      D.showcase('city', {
        title: 'JackCity Neighbours', sub: 'Cities built by JackNet members. Visit them, rate them, and sign a neighbour deal.', what: 'a city', icon: D.GAMES.city.icon, c1: '#1a3a7a',
        stats: e => { const s = e.stats || {}; return `${num(+s.pop || 0)} people &middot; ${num(+s.jobs || 0)} jobs${s.rating != null ? ` &middot; Mayor rating ${esc(s.rating)}%` : ''}${s.year ? ' &middot; year ' + esc(s.year) : ''}`; },
        visit: e => { try { G.w.restore(); G.w.focus(); } catch (err) {} visitCity(e); },
        mine: mineForNet, noMine: 'Start or load a city of your own first (not Callum\'s!), then press Upload. Your own city goes up, just as it is right now.',
      });
    }
    function uploadMine() {
      if (window.Guest && Guest.is()) return Guest.need('Putting your city on JackNet', () => {});
      const m = mineForNet(); if (!m) return G.msg('JackCity 3000', S && S.callum ? 'That\'s Callum\'s city! Save it as your own first (Game > Save City).' : 'Start or load a city of your own first.', 'info');
      G.status('Uploading ' + S.name + ' to JackNet at 3.6 KB/sec...'); G.sfx('modem');
      D.net.put('city', m.title, m.data, m.stats).then(r => { if (G.closed) return; if (!r.ok) return G.msg('JackNet', r.err || 'JackNet isn\'t answering.', 'warn'); G.secret('city.up'); G.toast('JackNet', `"${m.title}" is on JackNet! Other Mayors can visit it now.`, 4000); G.status('Uploaded to JackNet. Game > Neighbouring Cities to see it.'); });
    }
    let visitEl = null;
    function visitCity(e) {
      if (!e || !e.data) return;
      let home = null;
      if (visiting) home = visiting.home; else if (playing && S && !dead) { home = { snap: JSON.parse(JSON.stringify(snapshot())), spare: Math.max(0, powCap - powUse), cam: [camX, camY], speed, paused }; try { AS.now(); } catch (err) {} }
      try { restore(e.data); } catch (err) { console.warn(err); if (home) { restore(home.snap); startPlay(''); } return G.msg('JackNet', 'That city got scrambled on the way down the phone line. Try another one!', 'warn'); }
      visiting = { name: String(e.name), title: String(e.title || S.name), entry: e, home, mine: !!e.mine };
      S.name = String(e.title || S.name).slice(0, 40); S.tut = -1;
      startPlay('Visiting ' + S.name + ', built by ' + e.name + '. Look round, click things with Query, then press Leave.');
      setSpeed(2);
      visitEl = document.createElement('div'); visitEl.className = 'dg-city-visit';
      visitEl.innerHTML = `<div class="vt"><b>Visiting ${esc(S.name)}</b> <span>by ${esc(e.name)}</span></div><div class="vr"></div><div class="vb"><button type="button" class="btn" data-v="deal">Neighbour deal...</button><button type="button" class="btn" data-v="leave"><b>Leave</b></button></div>`;
      if (!e.mine) visitEl.querySelector('.vr').appendChild(D.rateBox('city', e)); else visitEl.querySelector('.vr').textContent = 'Your own city, as everybody else sees it.';
      view.appendChild(visitEl);
      visitEl.querySelector('[data-v=leave]').addEventListener('click', () => { G.sfx('click'); leaveVisit(); });
      visitEl.querySelector('[data-v=deal]').addEventListener('click', () => { G.sfx('click'); dealDlg(); });
      news('WELCOME TO ' + S.name.toUpperCase() + '! TWINNED WITH JACKCITY (PROBABLY).', true);
      G.menu(menus());
    }
    function leaveVisit() {
      const v = visiting; if (!v) return;
      if (visitEl) { visitEl.remove(); visitEl = null; }
      visiting = null;
      if (v.home) { try { restore(v.home.snap); } catch (err) { console.warn(err); return titleScreen(); } startPlay('Back home in ' + S.name + '.'); [camX, camY] = v.home.cam; clampCam(); setSpeed(v.home.paused ? 0 : v.home.speed); try { AS.now(); } catch (err) {} }
      else titleScreen();
    }
    function dealDlg() {
      const v = visiting; if (!v) return;
      if (!v.home) return G.msg('JackCity 3000', 'Start a city of your own first! Deals are signed between two Mayors.', 'info');
      if (v.home.snap.S.callum) return G.msg('JackCity 3000', 'You\'re looking after Callum\'s city. Save it as your own first, then come back and do deals.', 'info');
      if (v.mine) return G.msg('JackCity 3000', 'You can\'t do a deal with yourself. (Dave tried. It didn\'t work.)', 'info');
      const hs = v.home.snap.S, deals = hs.deals = hs.deals || [], already = deals.find(d => d.n === v.name);
      if (already) return G.msg('JackCity 3000', `You already have a deal with ${v.name}: ${DEALS[already.k].n}. One deal per neighbour. (Cancel it in your Budget if you want a different one.)`, 'info');
      if (deals.length >= 4) return G.msg('JackCity 3000', 'You\'ve got four neighbour deals already. The council can\'t cope with any more paperwork.', 'info');
      const rows = Object.keys(DEALS).map(k => { const d = DEALS[k], no = k === 'power' && v.home.spare < 100; return `<div class="dg-city-slot${no ? ' off' : ''}" data-dl="${k}" ${no ? 'aria-disabled="true"' : ''}>${k === 'power' ? ICO.power : k === 'water' ? ICO.water : ICO.road}<div><b>${esc(d.n)}</b><small>${esc(d.d)}${no ? ` You only have ${Math.round(v.home.spare)} units spare at home.` : ''}</small></div></div>`; }).join('');
      const o = modal('Neighbour deal with ' + v.title, `<div class="dg-city-adv">${FACES.fin}<div><p>Mrs Tuppence here. ${esc(v.name)}'s Mayor is happy to shake hands. Pick one deal. It starts at home next month and you can cancel it any time in the Budget.</p></div></div>${rows}`, [['Not now']]);
      o.m.querySelectorAll('[data-dl]').forEach(el => el.addEventListener('click', () => {
        if (el.classList.contains('off')) return G.sfx('beep');
        const k = el.dataset.dl; deals.push({ n: v.name, city: v.title.slice(0, 40), k, since: hs.months || 0 }); o.close();
        G.sfx('solve'); G.secret('city.deal'); G.toast('Neighbour deal signed!', `${DEALS[k].n} with ${v.title}. ${DEALS[k].d}`, 5000);
        try { AS.now(); } catch (err) {}
        news('HANDSHAKE! JACKCITY SIGNS A DEAL WITH ' + v.title.toUpperCase() + '. "LOVELY PEOPLE," SAYS MAYOR.', true);
      }));
    }

    // ================================================================ new game, title screen
    function newDlg() {
      const seen = !!G.load('tutSeen', false);
      const html = `<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 8px;align-items:center;min-width:min(330px,80vw)">
<label for="dgcn">City name:</label><input id="dgcn" type="text" maxlength="24" value="${esc(pick(['Jacksville', 'Jackford', 'New Jackton', 'Upper Wibble', 'Little Pixelby', 'Modemham']))}">
<span>Landscape:</span><select data-n="map"><option value="river">River runs through it</option><option value="lake">Big lake</option><option value="coast">Seaside</option><option value="forest">Forests</option></select>
<span>Difficulty:</span><select data-n="dif"><option value="50000">Easy (50,000 Rupees)</option><option value="20000" selected>Medium (20,000 Rupees)</option><option value="10000">Hard (10,000 Rupees)</option></select>
<span></span><label><input type="checkbox" data-n="dis" checked> Random disasters</label>
<span></span><label><input type="checkbox" data-n="tut" ${seen ? '' : 'checked'}> Advisor tutorial (a guided start)</label></div>
<p style="margin:8px 0 0;font-size:10px;color:#444">Tip: Road first, then zones next to it, then power. People need all three.</p>`;
      modal('Start a New City', html, [['Start!', m => {
        const name = (m.querySelector('#dgcn').value || 'Jacksville').trim().slice(0, 24) || 'Jacksville';
        const map = m.querySelector('[data-n=map]').value, money = +m.querySelector('[data-n=dif]').value;
        visiting = null; if (visitEl) { visitEl.remove(); visitEl = null; }
        blank(name, money); S.dis = m.querySelector('[data-n=dis]').checked; genMap((Math.random() * 1e9) | 0, map);
        S.tut = m.querySelector('[data-n=tut]').checked ? 0 : -1;
        recalcAll(); startPlay('Welcome to ' + name + ', Mayor! Start with a road.');
        tutorialCheck();
      }], ['Cancel']]);
    }
    let titleEl = null, titleStop = null;
    function titleScreen() {
      playing = false; closeFly(); qbox(null);
      if (visitEl) { visitEl.remove(); visitEl = null; } visiting = null;
      while (modalStack.length) modalStack[modalStack.length - 1].close();
      if (petEl) { petEl.remove(); petEl = null; }
      drawTut();
      if (titleEl) titleEl.remove();
      titleEl = document.createElement('div'); titleEl.className = 'dg-city-title';
      titleEl.innerHTML = `<canvas width="320" height="200"></canvas><div class="dg-city-logo"><div class="a">JACKCITY</div><div class="b">3000</div><div class="c">MAXIJACK &middot; ${G.demo ? 'PLAYABLE DEMO' : 'FULL VERSION'} &middot; 1999</div></div><div class="dg-city-menu"><button type="button" data-m="new">New City</button><button type="button" data-m="scen">Scenarios</button><button type="button" data-m="load">Load City</button><button type="button" data-m="net">Neighbouring Cities</button><button type="button" data-m="help">How to Play</button><button type="button" data-m="quit">Quit to JackOS</button></div><div class="dg-city-ver">v1.1 &middot; Licensed to Jack${G.demo ? ' &middot; DEMO' : ''}</div>`;
      root.appendChild(titleEl);
      const tc = titleEl.querySelector('canvas'), tx = tc.getContext('2d');
      const skyline = []; const r = rng(3000); let x = 0; while (x < 320) { const w = 8 + r() * 22, hgt = 20 + r() * 70 * (1 - Math.abs(x - 160) / 260); skyline.push([x, w, hgt, r()]); x += w + 1; }
      let tt = 0;
      if (titleStop) titleStop();
      titleStop = G.loop(dt => {
        tt += dt;
        const g = tx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#0a0628'); g.addColorStop(0.55, '#5a1a6a'); g.addColorStop(0.85, '#e8602a'); g.addColorStop(1, '#ffc84a');
        tx.fillStyle = g; tx.fillRect(0, 0, 320, 200);
        for (let k = 0; k < 40; k++) { tx.fillStyle = (k + Math.floor(tt * 2)) % 7 ? '#fff' : '#9cf'; tx.fillRect((k * 73) % 320, (k * 37) % 90, 1, 1); }
        tx.fillStyle = '#ffd84a'; tx.beginPath(); tx.arc(160, 168, 34, 0, 6.3); tx.fill();
        // the giant blob, peeking over the skyline now and then
        const bx = tc.clientWidth && tc.clientWidth / tc.clientHeight < 1.2 ? 160 : 250; // stays in view when the title is tall and thin
        const sy = 150 - Math.max(0, Math.sin(tt * 0.6)) * 40, wob = Math.sin(tt * 5) * 1.5;
        tx.fillStyle = '#2ab83a'; tx.beginPath(); tx.ellipse(bx, sy + 8, 30 + wob, 30 - wob, 0, Math.PI, 0); tx.fill(); tx.fillRect(bx - 30 - wob, sy + 7, 60 + wob * 2, 41);
        tx.fillStyle = '#7af05a'; tx.beginPath(); tx.ellipse(bx - 12, sy - 6, 9, 5, -0.5, 0, 6.3); tx.fill();
        tx.fillStyle = '#b040e0'; tx.beginPath(); tx.arc(bx + 14, sy + 12, 5, 0, 6.3); tx.arc(bx - 14, sy + 20, 4, 0, 6.3); tx.fill();
        tx.strokeStyle = '#1a8a2a'; tx.lineWidth = 3; tx.beginPath(); tx.moveTo(bx - 7, sy - 14); tx.lineTo(bx - 10, sy - 26 + wob); tx.moveTo(bx + 7, sy - 14); tx.lineTo(bx + 10, sy - 26 - wob); tx.stroke();
        tx.fillStyle = '#fff'; tx.beginPath(); tx.arc(bx - 10, sy - 28 + wob, 6, 0, 6.3); tx.arc(bx + 10, sy - 28 - wob, 6, 0, 6.3); tx.fill(); tx.fillStyle = '#000'; tx.beginPath(); tx.arc(bx - 8, sy - 27 + wob, 2.6, 0, 6.3); tx.arc(bx + 8, sy - 27 - wob, 2.6, 0, 6.3); tx.fill();
        tx.fillStyle = '#3a0a2a'; tx.beginPath(); tx.ellipse(bx, sy + 2, 12, 5, 0, 0, 6.3); tx.fill(); tx.fillStyle = '#fffbe0'; for (let k = 0; k < 4; k++) tx.fillRect(bx - 9 + k * 5, sy - 3, 3, 3);
        for (const [x0, w, hgt, s2] of skyline) {
          tx.fillStyle = '#120a20'; tx.fillRect(x0, 200 - hgt, w, hgt);
          for (let wy = 200 - hgt + 4; wy < 196; wy += 5) for (let wx = x0 + 2; wx < x0 + w - 2; wx += 4) if (hash(wx * 7 + wy * 13 + Math.floor(tt / 2 + s2 * 9)) % 5 < 2) { tx.fillStyle = '#ffd860'; tx.fillRect(wx, wy, 2, 2); }
        }
        tx.fillStyle = '#05030a'; tx.fillRect(0, 194, 320, 6);
      });
      titleEl.querySelector('.dg-city-menu').addEventListener('click', ev => {
        const b = ev.target.closest('[data-m]'); if (!b) return; G.sfx('button');
        const m = b.dataset.m;
        if (m === 'new') newDlg(); else if (m === 'scen') scenDlg(); else if (m === 'load') loadDlg(); else if (m === 'net') neighbours(); else if (m === 'help') help(); else G.quit();
      });
      G.menu(menus());
      G.status('JackCity 3000 - ' + (G.demo ? 'Demo version: two years or 2,000 people. Full game in the shops from ' + D.longDate(G.def.rel) + '!' : 'Build the city of your dreams. Giant blob not included. (It\'s included.)'));
    }
    function startPlay(msg) {
      if (titleEl) { titleEl.remove(); titleEl = null; } if (titleStop) { titleStop(); titleStop = null; }
      while (modalStack.length) modalStack[modalStack.length - 1].close();
      if (petEl) { petEl.remove(); petEl = null; }
      if (!visiting && visitEl) { visitEl.remove(); visitEl = null; }
      playing = true; dead = false; sessionMonths0 = S.months; squig = null; tornado = null; quake = 0; cars = []; fx.length = 0; undoRec = null; undoBtn();
      root.classList.toggle('visiting', !!visiting);
      fit();
      let sx = 0, sy = 0, n = 0; for (let i = 0; i < NN; i++) if (typ[i] !== T_NONE) { sx += i % N; sy += (i / N) | 0; n++; }
      centerOn(n ? Math.round(sx / n) : N / 2, n ? Math.round(sy / n) : N / 2);
      overlay = ''; setTool('query'); setSpeed(2); updateTop(); dirtyWorld = true;
      G.menu(menus());
      G.status(msg || '');
      news(msg ? msg.toUpperCase() : 'WELCOME, MAYOR!', true);
      drawTut();
      if (G.sound && !Sound.music.playing && musicOn) G.music('gcity');
    }
    let sessionMonths0 = 0, musicOn = true;
    function help() {
      modal('How to Play JackCity 3000', `<div style="max-width:460px;font-size:11px;line-height:1.45">
<p><b>You are the Mayor.</b> Build a city and keep the people happy. Happy people pay taxes. Taxes pay for more city.</p>
<p><b>1. Roads.</b> Pick Road and drag out a street. <b>2. Zones.</b> Green = Residential (homes), Blue = Commercial (shops), Yellow = Industrial (factories). Drag a box near a road: lots need a road within 3 tiles. <b>3. Power.</b> Build a power plant and run Power Lines to your zones (zones pass power along to each other, roads don't). <b>4. Water.</b> Bigger buildings need water: a Water Tower, or a Pumping Station next to a river, lake or the sea.</p>
<p>The <b>R C I</b> bars at the top show what people want more of. Keep taxes around 7%. Police, fire stations, schools, hospitals and parks make land worth more, so bigger buildings grow. Busy roads jam up: a Bus Depot helps. Click anything with <b>Query</b> to see why it isn't growing.</p>
<p><b>Goals:</b> reach 500, 800, 2,000, 3,500, 5,000, 8,000 and 12,000 people for new titles and rewards, or try a <b>Scenario</b> from the title screen. Go bust (owe more than 10,000 Rupees) and you're out!</p>
<p><b>JackNet:</b> Game &gt; Neighbouring Cities lets you visit other Mayors' cities, rate them and sign neighbour deals. Members can upload their own.</p>
<p><b>Disasters:</b> fires, whirlwinds, earthquakes and the giant blob from the bog. Click on the blob to poke it with a stick.</p>
<p><b>Controls:</b> drag to build. Scroll with the Scroll tool, the arrow keys, or right-drag. Click the minimap to jump. Ctrl+Z undoes the last thing you built. Help &gt; Keyboard Keys has the full list.</p></div>`, [['Got it']]);
    }
    function keysDlg() { modal('Keyboard Keys', `<table class="dg-city-ledger">${KEYS.map(([k, d]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(d)}</td></tr>`).join('')}</table>`, [['OK']]); }
    function menus() {
      const v = !!visiting;
      return [
        ['Game', () => [{ label: 'New City...', act: newDlg }, { label: 'Scenarios...', act: scenDlg }, { label: 'Load City...', act: () => loadDlg() }, { label: 'Save City...', dis: !playing || v, act: saveDlg }, '-',
          { label: 'Neighbouring Cities (JackNet)...', act: neighbours }, { label: 'Upload My City to JackNet', dis: !playing || v, act: uploadMine }, ...(v ? [{ label: 'Leave ' + S.name, act: leaveVisit }] : []), '-',
          { label: 'Title Screen', act: () => { autosave(); titleScreen(); } }, { label: 'Exit', act: () => { autosave(); G.quit(); } }]],
        ['Options', () => [{ label: 'Pause', key: 'Space', chk: paused, dis: !playing || v, act: () => setSpeed(paused ? speed : 0) }, { label: 'Snail speed', key: '1', rad: !paused && speed === 1, act: () => setSpeed(1) }, { label: 'Bike speed', key: '2', rad: !paused && speed === 2, act: () => setSpeed(2) }, { label: 'Rocket speed', key: '3', rad: !paused && speed === 3, act: () => setSpeed(3) }, '-',
          { label: 'Random Disasters', chk: !!(S && S.dis), dis: !S || v, act: () => { S.dis = !S.dis; } }, { label: 'Advisor Pop-ups', chk: !noTips, act: () => { noTips = !noTips; G.save('noTips', noTips); } }, { label: 'Music', chk: musicOn, act: () => { musicOn = !musicOn; if (musicOn && playing) G.music('gcity'); else G.stopMusic(); if (musicOn && !G.sound) G.toast('JackCity 3000', 'Turn the sound on in JackOS to hear the music.', 3000); } },
          { label: 'Grid Lines', chk: showGrid, act: () => { showGrid = !showGrid; dirtyWorld = true; } }, { label: 'Minimap', chk: showMini, act: () => { showMini = !showMini; mini.style.display = showMini ? '' : 'none'; } }, { label: 'Zoom 2x (chunky)', key: '+', chk: zoom === 2, act: () => setZoom(zoom === 2 ? 1 : 2) }]],
        ['JackOS', () => [{ label: 'City Info & Graphs', key: 'I', dis: !playing, act: cityInfo }, { label: 'Budget', key: 'B', dis: !playing || v, act: budget }, { label: 'Advisors', key: 'V', dis: !playing || v, act: advisors }, '-',
          ...[['lval', 'Land Value map'], ['poll', 'Pollution map'], ['crime', 'Crime map'], ['traf', 'Traffic map'], ['power', 'Power Grid map']].map(([k, l]) => ({ label: l, rad: overlay === k, dis: !playing, act: () => setOverlay(k) })), { label: 'Normal view', rad: !overlay, act: () => setOverlay('') }]],
        ['Disasters', () => [{ label: 'Fire', dis: !playing || v, act: () => disaster('fire') }, { label: 'Whirlwind', dis: !playing || v, act: () => disaster('tornado') }, { label: 'Earthquake', dis: !playing || v, act: () => disaster('quake') }, { label: 'BLOB ATTACK!', dis: !playing || v, act: () => disaster('squig') }]],
        ['Help', () => [{ label: 'How to Play', key: 'F1', act: help }, { label: 'Keyboard Keys', act: keysDlg }, { label: 'Advisor Tutorial', dis: !playing || v, act: () => { S.tut = 0; S.tutBud = 0; G.sfx('click'); tutorialCheck(); } }, { label: 'Mayor\'s Tips (Advisors)', dis: !playing || v, act: advisors }, '-', { label: 'About JackCity 3000...', act: () => G.about() }]],
      ];
    }

    // ================================================================ the frame: blit the world, then everything that moves
    let acc = 0, t = 0;
    const STEP = { 1: 0.7, 2: 0.33, 3: 0.11 };
    G.loop(dt => {
      t += dt;
      if (!playing || dead) return;
      if (!paused && !modals && !visiting) {
        acc += dt; let n = 0;
        while (acc >= STEP[speed] && n < 4) { acc -= STEP[speed]; step(); n++; }
        if (n >= 4) acc = 0;
        updateDisasters(dt);
      }
      // keyboard scroll
      const ks = 420 * dt / zoom;
      if (keys.has('arrowleft') || keys.has('a')) camX -= ks; if (keys.has('arrowright') || keys.has('d')) camX += ks;
      if (keys.has('arrowup') || keys.has('w')) camY -= ks; if (keys.has('arrowdown') || keys.has('s')) camY += ks;
      clampCam();
      if (dirtyWorld) renderWorld();
      draw(dt);
    });
    function updateCars(dt) {
      const want = Math.min(110, Math.floor((P + Jc + Ji) / 40));
      if (cars.length < want && roadsN > 1) for (let k = 0; k < 4 && cars.length < want; k++) { const i = rnd(NN); if (typ[i] === T_ROAD && Math.random() < 0.25 + traf[i] / 200 && (ter[i] !== WATER || Math.random() < 0.3)) cars.push({ i, d: rnd(4), p: Math.random(), c: pick(['#e10600', '#ffd400', '#fff', '#2a4ad8', '#2a9a2a', '#222']) }); }
      if (cars.length > want + 5) cars.length = want;
      for (const car of cars) {
        car.p += dt * (paused && !visiting ? 0 : 1.4) * (traf[car.i] > 170 ? 0.35 : traf[car.i] > 110 ? 0.7 : 1);
        if (car.p >= 1) {
          car.p = 0; const x = car.i % N, y = (car.i / N) | 0, [dx, dy] = NB[car.d];
          const nx = x + dx, ny = y + dy;
          if (inb(nx, ny) && typ[idx(nx, ny)] === T_ROAD) car.i = idx(nx, ny);
          const opts = [0, 1, 2, 3].filter(k => { const [ax, ay] = NB[k]; const xx = (car.i % N) + ax, yy = ((car.i / N) | 0) + ay; return inb(xx, yy) && typ[idx(xx, yy)] === T_ROAD && !(ax === -dx && ay === -dy); });
          car.d = opts.length ? pick(opts) : [1, 0, 3, 2][car.d];
        }
        if (typ[car.i] !== T_ROAD) car.dead = 1;
      }
      cars = cars.filter(c => !c.dead);
    }
    function draw(dt) {
      ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, cw, ch);
      let sx = Math.round(camX), sy = Math.round(camY);
      if (shake > 0) { shake -= dt; sx += rnd(5) - 2; sy += rnd(5) - 2; }
      // blit the visible part of the world
      const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(WW, sx + cw), y1 = Math.min(WH, sy + ch);
      if (x1 > x0 && y1 > y0) ctx.drawImage(world, x0, y0, x1 - x0, y1 - y0, x0 - sx, y0 - sy, x1 - x0, y1 - y0);
      const W = (wx, wy) => [wx - sx, wy - sy];
      const vis = (x, y, m) => x > -m && y > -m && x < cw + m && y < ch + m;
      if (!overlay) {
        // cars
        updateCars(dt);
        for (const car of cars) { const x = car.i % N, y = (car.i / N) | 0, [px, py] = tp(x, y), e = NB[car.d], f = car.p * 2 - 1, side = car.d === 0 || car.d === 3 ? 1.5 : -1.5; const [qx, qy] = W(px + e[2] * f + side, py + 8 + (e[3] - 8) * f + side * 0.5 - 1); if (!vis(qx, qy, 4)) continue; ctx.fillStyle = car.c; ctx.fillRect(Math.round(qx) - 1, Math.round(qy) - 1, 3, 2); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(Math.round(qx) - 1, Math.round(qy) + 1, 3, 1); }
        // smoke
        for (let k = 0; k < smokes.length; k++) { const [wx, wy, light] = smokes[k], [qx, qy] = W(wx, wy); if (!vis(qx, qy, 30)) continue; for (let p = 0; p < 3; p++) { const ph = (t * 0.6 + p / 3 + k * 0.17) % 1, g2 = light ? 240 - ph * 20 : 200 - ph * 80; ctx.fillStyle = `rgba(${g2},${g2},${g2 + (light ? 10 : 0)},${((light ? 0.35 : 0.55) * (1 - ph)).toFixed(2)})`; const r2 = 1.5 + ph * 4; ctx.beginPath(); ctx.arc(qx + ph * 9 + Math.sin(ph * 6 + k) * 2, qy - ph * 18, r2, 0, 6.3); ctx.fill(); } }
        // wind turbine blades
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        for (const [wx, wy] of winds) { const [qx, qy] = W(wx, wy); if (!vis(qx, qy, 20)) continue; for (let b = 0; b < 3; b++) { const a = t * 3 + b * 2.094; ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx + Math.cos(a) * 11, qy + Math.sin(a) * 11); ctx.stroke(); } ctx.fillStyle = '#ccc'; ctx.fillRect(qx - 1, qy - 1, 3, 3); }
        // the zoo: flamingos bobbing about and a penguin waddling by the pool
        for (let k = 0; k < zoos.length; k++) {
          const [wx, wy] = zoos[k];
          if (k % 3 === 1) { const sw = Math.sin(t * 6 + k) * 1.2, [qx, qy] = W(wx + sw, wy); if (!vis(qx, qy, 10)) continue; ctx.fillStyle = '#ff9a00'; ctx.fillRect(qx - 2, qy + 3, 2, 1); ctx.fillRect(qx + 1, qy + 3, 2, 1); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(qx, qy - 1, 2.6, 4.2, sw * 0.08, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(qx + 0.6, qy, 1.4, 2.8, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(qx, qy - 5, 2, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(qx + 0.5, qy - 6, 1, 1); ctx.fillStyle = '#ff9a00'; ctx.fillRect(qx + 2, qy - 5, 2, 1); continue; }
          const [qx, qy] = W(wx, wy - Math.abs(Math.sin(t * 4 + k)) * 2); if (!vis(qx, qy, 10)) continue;
          ctx.fillStyle = '#c04a7a'; ctx.fillRect(qx - 1, qy + 2, 1, 5); ctx.fillRect(qx + 1, qy + 2, 1, 3); ctx.fillRect(qx + 1, qy + 4, 2, 1);
          ctx.fillStyle = '#ff7ab8'; ctx.beginPath(); ctx.ellipse(qx, qy, 3.6, 2.4, -0.2, 0, 6.3); ctx.fill(); ctx.fillStyle = '#e0508a'; ctx.fillRect(qx - 3, qy, 3, 1);
          ctx.strokeStyle = '#ff7ab8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(qx + 2.5, qy - 1); ctx.quadraticCurveTo(qx + 5, qy - 4, qx + 3, qy - 6); ctx.quadraticCurveTo(qx + 1.5, qy - 8, qx + 3, qy - 9); ctx.stroke();
          ctx.fillStyle = '#ff7ab8'; ctx.beginPath(); ctx.arc(qx + 3.5, qy - 9, 1.4, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(qx + 4.6, qy - 9.4, 1.4, 1); ctx.fillStyle = '#111'; ctx.fillRect(qx + 5.6, qy - 9, 1, 1.4);
        }
        // no-power bolts blink over zones that want electric
        if ((t * 2 | 0) % 2) for (let i = 0; i < NN; i++) { if (typ[i] !== T_ZONE || pow[i] || !zk[i]) continue; const [px, py] = tp(i % N, (i / N) | 0), [qx, qy] = W(px, py + (lv[i] ? -8 - lv[i] * 4 : 2)); if (!vis(qx, qy, 8)) continue; ctx.fillStyle = '#ffd400'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qx + 1, qy); ctx.lineTo(qx - 3, qy + 5); ctx.lineTo(qx, qy + 5); ctx.lineTo(qx - 1, qy + 9); ctx.lineTo(qx + 3, qy + 3); ctx.lineTo(qx, qy + 3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      }
      // fires (+ fire engines in covered areas)
      for (let i = 0; i < NN; i++) {
        if (!fire[i]) continue; const [px, py] = tp(i % N, (i / N) | 0), [qx, qy] = W(px, py + 8); if (!vis(qx, qy, 30)) continue;
        for (let f = 0; f < 5; f++) { const ph = (t * 2.5 + f * 0.37 + i * 0.13) % 1, fx = qx + (f - 2) * 3.5 + Math.sin(t * 9 + f) * 1.5, fy = qy - ph * 16, r2 = 4 * (1 - ph) + 1; ctx.fillStyle = ph < 0.3 ? '#fff38a' : ph < 0.6 ? '#ff9a00' : 'rgba(200,40,0,.8)'; ctx.beginPath(); ctx.arc(fx, fy, r2, 0, 6.3); ctx.fill(); }
        if (cov.fir[i] > 60) { const ex = qx + 12, ey = qy + 4; ctx.fillStyle = '#d00'; ctx.fillRect(ex - 5, ey - 4, 10, 4); ctx.fillStyle = '#9cf'; ctx.fillRect(ex + 2, ey - 4, 3, 2); ctx.fillStyle = '#111'; ctx.fillRect(ex - 4, ey, 2, 1); ctx.fillRect(ex + 2, ey, 2, 1); ctx.fillStyle = (t * 6 | 0) % 2 ? '#39f' : '#f33'; ctx.fillRect(ex - 1, ey - 6, 2, 2); ctx.strokeStyle = 'rgba(120,180,255,.8)'; ctx.beginPath(); ctx.moveTo(ex - 5, ey - 3); ctx.quadraticCurveTo(ex - 10, ey - 14, qx, qy - 6); ctx.stroke(); }
      }
      // tornado
      if (tornado) { const [px, py] = tp(tornado.x, tornado.y), [qx, qy] = W(px, py + 8); for (let k = 0; k < 12; k++) { const r2 = 3 + k * 1.6, o = Math.sin(t * 8 + k * 0.7) * k * 0.6; ctx.fillStyle = `rgba(${150 - k * 4},${150 - k * 4},${160 - k * 4},.55)`; ctx.beginPath(); ctx.ellipse(qx + o, qy - k * 5, r2, r2 * 0.4, 0, 0, 6.3); ctx.fill(); } }
      // the giant blob: a wobbling green jelly from a 1950s B-movie, purple goo inside, goggly eyes and a big gummy mouth
      if (squig) {
        const st = squig.t, sq = 1 + Math.sin(st * 9) * (squig.ouch > 0 ? 0.2 : 0.07), bob = Math.abs(Math.sin(st * 5)) * 3, [px, py] = tp(squig.x, squig.y), [qx, qy] = W(px, py + 8);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(qx, qy + 2, 28 * sq, 10, 0, 0, 6.3); ctx.fill();
        const R = 26, top = qy - bob, pts = [];
        for (let k = 0; k <= 28; k++) { const a = Math.PI + k / 28 * Math.PI, w = 1 + Math.sin(a * 5 + st * 7) * 0.06 + Math.sin(a * 3 - st * 4) * 0.05; pts.push([qx + Math.cos(a) * R * sq * 1.15 * w, top - 4 + Math.sin(a) * R / sq * w]); }
        const blob = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], top); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[pts.length - 1][0], top); for (let k = 6; k >= 0; k--) { const x = qx + (k / 6 * 2 - 1) * R * sq * 1.15, d = (k % 2 ? 3 : 0) + Math.max(0, Math.sin(st * 3 + k * 1.7)) * 3; ctx.lineTo(x, top + d); } ctx.closePath(); };
        const gr = ctx.createRadialGradient(qx - 10, top - 26, 3, qx, top - 12, R * 1.3); gr.addColorStop(0, '#d8ffb0'); gr.addColorStop(0.35, '#6ae83a'); gr.addColorStop(1, '#1a7a2a');
        ctx.fillStyle = gr; blob(); ctx.fill(); ctx.strokeStyle = '#0a3a10'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(176,60,230,.8)'; for (const [ox, oy, r2] of [[-14, -10, 5], [9, -6, 4], [15, -18, 3], [-4, -4, 3]]) { ctx.beginPath(); ctx.arc(qx + ox + Math.sin(st * 2 + ox) * 1.5, top + oy - Math.cos(st * 2 + oy) * 1.5, r2, 0, 6.3); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(qx - 14, top - 24, 6, 3, -0.6, 0, 6.3); ctx.fill();
        const lk = squig.vx > 0 ? 2 : -2;
        for (const ex of [-8, 8]) { const ey = top - 34 - (ex < 0 ? Math.sin(st * 6) : Math.cos(st * 6)) * 1.5; ctx.strokeStyle = '#1a7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(qx + ex * 0.6, top - 24); ctx.lineTo(qx + ex, ey + 4); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(qx + ex, ey, 5.5, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(qx + ex + lk, ey + 1, 2.4, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(qx + ex + lk - 1, ey - 1, 1, 1); }
        const mo = 4 + Math.abs(Math.sin(st * 4)) * 5;
        ctx.fillStyle = '#3a0a2a'; ctx.beginPath(); ctx.ellipse(qx, top - 12, 13, mo, 0, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#0a3a10'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#ff6a9a'; ctx.beginPath(); ctx.ellipse(qx + 2, top - 12 + mo * 0.5, 6, mo * 0.4, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#fffbe0'; for (let k = -10; k <= 6; k += 5.3) { ctx.beginPath(); ctx.moveTo(qx + k, top - 12 - mo + 1); ctx.lineTo(qx + k + 2.2, top - 12 - mo + 5); ctx.lineTo(qx + k + 4.4, top - 12 - mo + 1); ctx.fill(); }
        if (squig.ouch > 0) { ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(qx + 40, top - 40); ctx.lineTo(qx + 14, top - 18); ctx.stroke(); }
        if ((st * 2 | 0) % 3 === 0 && !squig.ouch) { ctx.font = 'bold 12px Impact,Arial Black,sans-serif'; ctx.fillStyle = '#b6ff3a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('GLORRRP!', qx - 26, top - 50); ctx.fillText('GLORRRP!', qx - 26, top - 50); }
      }
      // feedback effects: growth sparkles, bulldozer dust, cost text
      for (let k = fx.length - 1; k >= 0; k--) {
        const f = fx[k]; f.t += dt; const life = f.k === 'txt' ? 1.4 : f.k === 'up' ? 0.9 : 0.7;
        if (f.t > life) { fx.splice(k, 1); continue; }
        const [qx, qy] = W(f.x, f.y), a = 1 - f.t / life; if (!vis(qx, qy, 40)) continue;
        if (f.k === 'txt') { ctx.font = 'bold 11px Tahoma,sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,' + a.toFixed(2) + ')'; ctx.fillStyle = f.c || '#fff'; ctx.globalAlpha = a; const tw = ctx.measureText(f.s).width; ctx.strokeText(f.s, qx - tw / 2, qy - 14 - f.t * 18); ctx.fillText(f.s, qx - tw / 2, qy - 14 - f.t * 18); ctx.globalAlpha = 1; }
        else if (f.k === 'up') { ctx.fillStyle = 'rgba(255,255,160,' + a.toFixed(2) + ')'; for (let p = 0; p < 4; p++) { const an = p * 1.57 + f.t * 3, r2 = 6 + f.t * 14; ctx.fillRect(Math.round(qx + Math.cos(an) * r2), Math.round(qy - 14 + Math.sin(an) * r2 * 0.5 - f.t * 10), 2, 2); } }
        else { ctx.fillStyle = 'rgba(160,140,110,' + (a * 0.7).toFixed(2) + ')'; for (let p = 0; p < 5; p++) { const an = p * 1.26, r2 = 3 + f.t * 20; ctx.beginPath(); ctx.arc(qx + Math.cos(an) * r2, qy + Math.sin(an) * r2 * 0.5 - f.t * 6, 3 + f.t * 4, 0, 6.3); ctx.fill(); } }
      }
      if (quake > 0) { ctx.fillStyle = 'rgba(120,80,40,' + Math.min(0.25, quake * 0.1).toFixed(2) + ')'; ctx.fillRect(0, 0, cw, ch); shake = Math.max(shake, 0.05); }
      // cursor / drag preview
      const prev = visiting ? [] : drag && !drag.pan && drag.a ? toolTiles(tool, drag.a, drag.b) : hover && tool !== 'hand' && !G.touch ? toolTiles(tool, hover, hover) : [];
      if (prev.length && tool !== 'hand') {
        let ok = true;
        if (tool.startsWith('b:')) { const b = BLD[tool.slice(2)], h0 = drag && drag.b || hover; ok = prev.length === (b.sz || 1) ** 2 && prev.every(i => ter[i] !== WATER && (typ[i] === T_NONE || typ[i] === T_ZONE && !lv[i])) && S.money >= b.cost && (!b.nearW || (h0 && touchesWater(h0[0], h0[1], b.sz || 1))); }
        ctx.lineWidth = 1;
        for (const i of prev) { const [px, py] = tp(i % N, (i / N) | 0), [qx, qy] = W(px, py); ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx + 16, qy + 8); ctx.lineTo(qx, qy + 16); ctx.lineTo(qx - 16, qy + 8); ctx.closePath(); ctx.fillStyle = tool === 'doze' ? 'rgba(255,60,0,.35)' : ok ? 'rgba(255,255,255,.28)' : 'rgba(255,0,0,.35)'; ctx.fill(); ctx.strokeStyle = ok && tool !== 'doze' ? '#fff' : '#f33'; ctx.stroke(); }
      }
      if (qEl && qTile != null) { const [px, py] = tp(qTile % N, (qTile / N) | 0), [qx, qy] = W(px, py); ctx.strokeStyle = (t * 4 | 0) % 2 ? '#ff0' : '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(qx + 16, qy + 8); ctx.lineTo(qx, qy + 16); ctx.lineTo(qx - 16, qy + 8); ctx.closePath(); ctx.stroke(); }
      if (paused && !visiting) { ctx.font = 'bold 14px Impact,Arial Black,sans-serif'; ctx.fillStyle = '#ffd400'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('PAUSED', cw / 2 - 26, 20); ctx.fillText('PAUSED', cw / 2 - 26, 20); }
      if (showMini && (t * 4 | 0) !== drawMini._t) { drawMini._t = t * 4 | 0; drawMini(); }
    }
    function drawMini() {
      const img = mctx.createImageData(N, N), d = img.data;
      for (let i = 0; i < NN; i++) {
        let c;
        if (overlay) { const col = overlayCol(i); c = col ? [255, 200, 0] : [40, 90, 40]; if (overlay === 'poll') c = [Math.min(255, 60 + poll[i]), 80, 40]; if (overlay === 'lval') c = [40, 60 + lval[i] / 2, Math.min(255, lval[i] + 40)]; }
        else if (fire[i]) c = [255, 120, 0];
        else if (typ[i] === T_ROAD) c = [70, 70, 70];
        else if (typ[i] === T_ZONE) c = zk[i] === ZR ? [60, 200 - lv[i] * 30, 60] : zk[i] === ZC ? [70, 120, 230 - lv[i] * 30] : [220 - lv[i] * 25, 190 - lv[i] * 25, 50];
        else if (typ[i] === T_BLD) c = [230, 230, 230];
        else if (typ[i] === T_RUB) c = [120, 100, 80];
        else if (ter[i] === WATER) c = [40, 90, 190];
        else if (ter[i] === TREES) c = [30, 90, 30];
        else c = [80, 150, 60];
        if (pl[i] && typ[i] === T_NONE) c = [200, 180, 60];
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
      }
      if (!drawMini.c) { drawMini.c = document.createElement('canvas'); drawMini.c.width = N; drawMini.c.height = N; }
      drawMini.c.getContext('2d').putImageData(img, 0, 0);
      mctx.imageSmoothingEnabled = false; mctx.drawImage(drawMini.c, 0, 0, 96, 96);
      // the view rectangle (corners of the screen, in tiles)
      const cs = [[0, 0], [cw, 0], [cw, ch], [0, ch]].map(([x, y]) => { const wx = x + camX, wy = y + camY, a = (wx - OX) / 16, b = (wy - OY - 8) / 8; return [(a + b) / 2 * 2, (b - a) / 2 * 2]; });
      mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.beginPath(); cs.forEach(([x, y], k) => k ? mctx.lineTo(x + 1, y + 1) : mctx.moveTo(x + 1, y + 1)); mctx.closePath(); mctx.stroke();
    }

    // ================================================================ test hook (Playwright drives the real sim with it)
    G._city = {
      get S() { return S; }, get P() { return P; }, get jobs() { return Jc + Ji; }, get demand() { return [dR, dC, dI]; }, get playing() { return playing; },
      get pow() { return [powUse, powCap, unpowered]; }, get squig() { return squig; },
      // the client (page) coordinates of a tile's centre
      client(x, y) { const [px, py] = tp(x, y), r = cv.getBoundingClientRect(); return [r.left + (px - camX) * r.width / cw, r.top + (py + 8 - camY) * r.height / ch]; },
      center: (x, y) => centerOn(x, y), days(n) { for (let k = 0; k < n; k++) step(); }, tile: (x, y) => { const i = idx(x, y); return { ter: ter[i], typ: typ[i], zk: zk[i], lv: lv[i], pow: pow[i], pl: pl[i] }; },
      disaster: k => disaster(k), blob: dt => updateDisasters(dt), poke: () => pokeBlob(),
      get wat() { return [watUse, watCap]; }, get jams() { return jams; }, get visiting() { return visiting; }, get undo() { return !!undoRec; },
      diag() { const o = { traf: Math.max(...traf), busy: traf.filter(v => v > 110).length }; for (let i = 0; i < NN; i++) if (typ[i] === T_ZONE && zk[i] === ZR && lv[i]) { const k = 'z' + zd[i] + 'l' + lv[i], r = o[k] = o[k] || { n: 0, des: 0, lval: 0, poll: 0, crime: 0, edu: 0 }; r.n++; r.des += desire(i); r.lval += lval[i]; r.poll += poll[i]; r.crime += crime[i]; r.edu += cov.edu[i] + cov.hea[i]; } for (const k in o) for (const f in o[k]) if (f !== 'n') o[k][f] = +(o[k][f] / o[k].n).toFixed(2); return o; },
      month: () => month(), scen: id => startScen(id), visit: e => visitCity(e), leave: () => leaveVisit(), why: (x, y) => blocker(idx(x, y)),
    };

    // ================================================================ go
    G.onClose(() => { if (playing) autosave(); });
    fit();
    titleScreen();
    { const d = AS.load();
      if (d && d.S && d.ter) {
        try { restore(d); startPlay('Welcome back, Mayor! ' + S.name + ' is just as you left it.'); setSpeed(0); G.toast('JackCity 3000', 'Welcome back, Mayor! The city is paused: press Space or a speed button to carry on.', 4500); }
        catch (e) { console.error(e); AS.clear(); titleScreen(); }
      } }
    nextNews();
  });
})();
