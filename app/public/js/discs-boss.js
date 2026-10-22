/* Championship Boss 99/00 (Games Cupboard, lazy loaded by discs.js). A text-heavy football management sim in the classic
 * grey-and-navy style: sixteen fictional clubs in the Premier Jack League, the Jack Cup, procedurally generated fictional
 * players, tactics, transfers, minute-by-minute commentary, the board, the inbox, and Mom. Original code, words and art. */
(function () {
  'use strict';
  const D = window.Discs; if (!D) return;

  // ================================================================ helpers
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pk = (R, l) => l[Math.floor(R() * l.length)];
  const rnd = l => l[Math.floor(Math.random() * l.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = (R, l) => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // money is Rupees (the JackNet currency): money() for words, gm() for a compact gem + number in tables
  const amt = n => { n = Math.abs(n); return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M' : n >= 1000 ? Math.round(n / 1000) + 'K' : String(Math.round(n)); };
  const money = n => (n < 0 ? '-' : '') + amt(n) + (Math.round(Math.abs(n)) === 1 ? ' Rupee' : ' Rupees');
  const gemCol = n => { n = Math.abs(n); return n < 1e5 ? 'green' : n < 1e6 ? 'blue' : n < 5e6 ? 'red' : n < 2e7 ? 'purple' : 'gold'; };
  const GEMHEX = { green: '#2ec82e', blue: '#2a7ae8', red: '#e8302a', purple: '#a040d8', gold: '#ffc800' };
  const gemSvg = n => { const c = gemCol(n); if (window.Econ && Econ.gem) { try { return Econ.gem(c, 11); } catch (e) {} } return `<svg viewBox="0 0 12 16" width="8" height="11" aria-hidden="true"><path d="M6 0l6 5-6 11L0 5z" fill="${GEMHEX[c]}" stroke="#000" stroke-width=".8"/><path d="M6 0L3 5h6z" fill="#fff" opacity=".45"/></svg>`; };
  const gm = (n, sfx) => `<span class="dg-boss-rp" title="${money(n)}${sfx ? ' ' + sfx : ''}">${gemSvg(n)}${n < 0 ? '-' : ''}${amt(n)}${sfx ? '<small>' + sfx + '</small>' : ''}</span>`;
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

  // ---- the calendar: day 0 is Sunday 1 August 1999
  const DAY0 = Date.UTC(1999, 7, 1);
  const dayOf = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - DAY0) / 864e5);
  const dateOf = day => new Date(DAY0 + day * 864e5);
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yr = y => y === 1999 ? '1999' : '19' + (y - 1900); // the game is not Y2K compliant. At all.
  const fmtDate = (day, long) => { const d = dateOf(day); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}${long ? ' ' + yr(d.getUTCFullYear()) : ''}`; };
  const LDAYS = [[1999, 8, 7], [1999, 8, 14], [1999, 8, 21], [1999, 8, 28], [1999, 9, 11], [1999, 9, 18], [1999, 9, 25], [1999, 10, 16], [1999, 10, 23], [1999, 10, 30], [1999, 11, 6], [1999, 11, 20], [1999, 11, 27], [1999, 12, 11], [1999, 12, 27],
    [2000, 1, 3], [2000, 1, 15], [2000, 1, 22], [2000, 2, 5], [2000, 2, 12], [2000, 2, 26], [2000, 3, 4], [2000, 3, 11], [2000, 3, 18], [2000, 4, 1], [2000, 4, 8], [2000, 4, 15], [2000, 4, 22], [2000, 4, 29], [2000, 5, 6]].map(x => dayOf(...x));
  const CDAYS = [[1999, 9, 29], [1999, 11, 10], [2000, 2, 16], [2000, 5, 13]].map(x => dayOf(...x));
  const CUPRD = ['First Round', 'Quarter-Final', 'Semi-Final', 'Final'];
  const DEMO_END = dayOf(1999, 12, 31), SEASON_END = dayOf(2000, 5, 14);

  // ================================================================ the database (all fictional)
  // name, short, ground, capacity, reputation, colour 1, colour 2, kit pattern, chairman
  const TEAMS0 = [
    ['Jacksford City', 'Jacksford', 'Jacksford Road', 32000, 16, '#c8102e', '#ffffff', 'halves', 'Sir Reginald Bramley'],
    ['Ashbury Wanderers', 'Ashbury', 'Ashbury Park', 38000, 17, '#1d6b2a', '#ffd400', 'stripes', 'Mr Desmond Ruck'],
    ['Jackport Athletic', 'Jackport', 'Harbour Lane', 24000, 14, '#1b3c8c', '#ffffff', 'hoops', 'Mrs Margaret Pole'],
    ['Gubbinz Town', 'Gubbinz', 'The Pixel Pit', 11000, 9, '#5aa02c', '#2a1a00', 'sash', 'Gubbinz (yes, really)'],
    ['Kettleby United', 'Kettleby', 'Fishdock Road', 18000, 11, '#ff7a00', '#000000', 'stripes', 'Mr Barry Kettle'],
    ['Brackwick Rovers', 'Brackwick', 'Rovers Lane', 21000, 12, '#4a90e2', '#ffffff', 'halves', 'Mr Clive Wetherby'],
    ['Millchester Albion', 'Millchester', 'Mill Lane', 41000, 18, '#6a0dad', '#ffd400', 'plain', 'Lord Millbank'],
    ['Nettlington Park', 'Nettlington', 'Bogside Road', 15000, 10, '#8fd400', '#1a3a00', 'hoops', 'Mr Terry Bunce'],
    ['Copper Vale', 'Copper Vale', 'Vale Meadow', 17000, 11, '#7a1020', '#7fb7e6', 'plain', 'Mr Ron Cleaver'],
    ['Dalton Dynamos', 'Dalton', 'The Gasworks', 26000, 13, '#e10600', '#000000', 'stripes', 'Mr Vic Dalton'],
    ['Bogside Harriers', 'Bogside', 'The Marsh', 13000, 9, '#2a7a7a', '#ffffff', 'sash', 'Mrs Edna Wade'],
    ['Stanton Orient', 'Stanton', 'Boot Hill', 19000, 12, '#ffffff', '#c8102e', 'plain', 'Mr Norman Stamp'],
    ['Hadley Heath', 'Hadley', 'Heath Common', 14000, 10, '#ffd400', '#1b3c8c', 'hoops', 'Mr Alan Heath'],
    ['Jack Hill Academicals', 'Jack Hill', 'The Classroom', 9000, 8, '#111111', '#ffffff', 'stripes', 'Dr Prudence Hill'],
    ['Cooper Bay', 'Cooper Bay', 'The Harbour', 22000, 13, '#0a4a8a', '#ff7a00', 'halves', 'Captain Pete Moss'],
    ['Dunwick Thistle', 'Dunwick', 'Thistle Park', 20000, 12, '#3a1a5a', '#c0c0c0', 'sash', 'Mr Hamish Dunn'],
  ];
  const HONOURS = ['Premier Jack League champions 1931, 1958, 1984', 'Jack Cup winners 1972, 1990', 'Jack Cup runners-up 1966 (still not over it)', 'Division One champions 1979', 'County Shield 1952 (the shield was lost in 1953)', 'Premier Jack League runners-up 1997', 'Jack Cup winners 1911', 'None. But the pies are award-winning.'];
  const FIRST = ['Gary', 'Steve', 'Darren', 'Lee', 'Paul', 'Mark', 'Wayne', 'Craig', 'Dean', 'Neil', 'Stuart', 'Ian', 'Kevin', 'Martin', 'Jason', 'Carl', 'Ryan', 'Scott', 'Robbie', 'Danny', 'Andy', 'Simon', 'Tony', 'Jamie', 'Chris', 'Phil', 'Matt', 'Gareth', 'Rhys', 'Liam', 'Ross', 'Alan', 'Barry', 'Kieran', 'Shane', 'Declan', 'Euan', 'Fraser', 'Hamish', 'Dai', 'Glyn', 'Terry', 'Nigel', 'Graham', 'Trevor', 'Russell', 'Lewis', 'Ashley', 'Jody', 'Darryl', 'Kenny', 'Ally', 'Tommy', 'Vinnie', 'Sean', 'Nicky', 'Dougie'];
  const LAST = ['Pilkington', 'Hodgkiss', 'Thwaite', 'Ollerenshaw', 'Pickering', 'Dunmore', 'Catterick', 'Haworth', 'Fenwick', 'Gribble', 'Moxham', 'Sutcliffe', 'Higginbottom', 'Plunkett', 'Tranter', 'Whitlock', 'Ashworth', 'Kershaw', 'Lumb', 'Crabtree', 'Dobbs', 'Mottram', 'Nuttall', 'Quigley', 'Rudd', 'Scrivens', 'Tolley', 'Underhill', 'Varley', 'Wadsworth', 'Yeadon', 'Ackroyd', 'Blenkinsop', 'Cudworth', 'Dimmock', 'Entwistle', 'Furness', 'Grimshaw', 'Hebblethwaite', 'Illingworth', 'Kettlewell', 'Leatherbarrow', 'Mossop', 'Nettleton', 'Openshaw', 'Pennock', 'Ramsbottom', 'Shufflebottom', 'Tattersall', 'Uttley', 'Wigglesworth', 'Bagshaw', 'Crump', 'Dewhurst', 'Gumbley', 'Hulme', 'Inchley', 'Juniper', 'Lightfoot', 'Marsden', 'Oddie', 'Proudfoot', 'Rackham', 'Scattergood', 'Thistlethwaite', 'Wragg', 'McTavish', 'McGlinchey', 'Docherty', 'Llewellyn', 'Pritchard', 'Prosser', 'Gallagher', 'Brennan', 'Mulrooney', 'Fogarty', 'Dunphy', 'Cassidy'];
  const EU = {
    FRA: [['Pierre', 'Laurent', 'Olivier', 'Julien', 'Stéphane', 'Frédéric'], ['Dupuis', 'Lefebvre', 'Moreau', 'Garnier', 'Rousseau', 'Mercier']],
    NED: [['Jaap', 'Joost', 'Wim', 'Bram', 'Sjoerd', 'Kees'], ['Van der Bloem', 'De Wit', 'Vermeer', 'Bakker', 'Van Dijkstra', 'Kuiper']],
    NOR: [['Tore', 'Lars', 'Rune', 'Espen', 'Kjetil', 'Geir'], ['Haugen', 'Berg', 'Dahl', 'Nygaard', 'Strand', 'Brekke']],
    ITA: [['Luca', 'Marco', 'Stefano', 'Davide', 'Massimo', 'Gianni'], ['Moretti', 'Brunetti', 'Ferraro', 'Colombo', 'Ricci', 'Gallo']],
    DEN: [['Mads', 'Henrik', 'Søren', 'Anders', 'Jesper', 'Morten'], ['Kristensen', 'Holm', 'Madsen', 'Lund', 'Thygesen', 'Bech']],
    GER: [['Uwe', 'Dirk', 'Markus', 'Jörg', 'Holger', 'Sven'], ['Hoffmann', 'Krause', 'Wagner', 'Brandt', 'Vogel', 'Kessler']],
    POR: [['Rui', 'Nuno', 'Tiago', 'Hélder', 'Bruno', 'Paulo'], ['Pereira', 'Carvalho', 'Moura', 'Teixeira', 'Lopes', 'Barros']],
  };
  const NAT = [['ENG', 52], ['SCO', 11], ['WAL', 6], ['IRL', 6], ['NIR', 3], ['FRA', 4], ['NED', 4], ['NOR', 4], ['ITA', 3], ['DEN', 3], ['GER', 2], ['POR', 2]];
  const NATN = { ENG: 'English', SCO: 'Scottish', WAL: 'Welsh', IRL: 'Irish', NIR: 'Northern Irish', FRA: 'French', NED: 'Dutch', NOR: 'Norwegian', ITA: 'Italian', DEN: 'Danish', GER: 'German', POR: 'Portuguese' };
  // attributes (arrays, in this order): 0 Handling 1 Tackling 2 Marking 3 Heading 4 Passing 5 Creativity 6 Dribbling 7 Shooting 8 Pace 9 Stamina
  const ATTRS = ['Handling', 'Tackling', 'Marking', 'Heading', 'Passing', 'Creativity', 'Dribbling', 'Shooting', 'Pace', 'Stamina'];
  const W = { GK: { 0: 0.8, 8: 0.1, 3: 0.1 }, D: { 1: 0.3, 2: 0.25, 3: 0.2, 8: 0.1, 4: 0.1, 9: 0.05 }, M: { 4: 0.3, 5: 0.25, 6: 0.15, 1: 0.1, 7: 0.1, 9: 0.1 }, F: { 7: 0.35, 6: 0.2, 8: 0.2, 3: 0.15, 5: 0.1 } };
  const PRIM = { D: [1, 2, 3], M: [4, 5, 6], F: [7, 8, 6] }, SEC = { D: [8, 4, 9], M: [1, 7, 9], F: [3, 5, 9] };
  const SQUAD = [['GK', 'C', 1], ['GK', 'C', 0], ['D', 'L', 1], ['D', 'R', 1], ['D', 'C', 1], ['D', 'C', 1], ['D', 'C', 0], ['D', 'RC', 0], ['D', 'LC', 0], ['M', 'L', 1], ['M', 'R', 1], ['M', 'C', 1], ['M', 'C', 1], ['M', 'C', 0], ['M', 'RC', 0], ['M', 'LC', 0], ['F', 'C', 1], ['F', 'C', 1], ['F', 'LC', 0], ['F', 'RC', 0]];
  const FORMS = {
    '4-4-2': [['GK', 'C'], ['D', 'L'], ['D', 'C'], ['D', 'C'], ['D', 'R'], ['M', 'L'], ['M', 'C'], ['M', 'C'], ['M', 'R'], ['F', 'C'], ['F', 'C']],
    '4-3-3': [['GK', 'C'], ['D', 'L'], ['D', 'C'], ['D', 'C'], ['D', 'R'], ['M', 'C'], ['M', 'C'], ['M', 'C'], ['F', 'L'], ['F', 'C'], ['F', 'R']],
    '5-3-2': [['GK', 'C'], ['D', 'L'], ['D', 'C'], ['D', 'C'], ['D', 'C'], ['D', 'R'], ['M', 'C'], ['M', 'C'], ['M', 'C'], ['F', 'C'], ['F', 'C']],
    '3-5-2': [['GK', 'C'], ['D', 'C'], ['D', 'C'], ['D', 'C'], ['M', 'L'], ['M', 'C'], ['M', 'C'], ['M', 'C'], ['M', 'R'], ['F', 'C'], ['F', 'C']],
    '4-5-1': [['GK', 'C'], ['D', 'L'], ['D', 'C'], ['D', 'C'], ['D', 'R'], ['M', 'L'], ['M', 'C'], ['M', 'C'], ['M', 'C'], ['M', 'R'], ['F', 'C']],
  };
  const MENT = [[0.86, 1.1], [1, 1], [1.13, 0.9]], MENTN = ['Defensive', 'Normal', 'Attacking'];
  const MORF = [1, 0.9, 0.95, 1, 1.04, 1.08], MORN = ['', 'Abysmal', 'Poor', 'Okay', 'Good', 'Superb'];

  const rat = (p, pos) => { const w = W[pos || p.pos]; let s = 0; for (const k in w) s += p.a[k] * w[k]; return s; };
  const sideOk = (p, s) => s === 'C' ? p.side.includes('C') : p.side.includes(s);
  function fit(p, slot) {
    if (!p) return 0;
    const [sp, ss] = slot;
    let r = p.pos === sp ? rat(p) : rat(p, sp) * (sp === 'GK' || p.pos === 'GK' ? 0.5 : 0.85);
    if (sp !== 'GK' && !sideOk(p, ss)) r *= 0.88;
    return r;
  }
  const eff = (p, slot) => fit(p, slot) * (0.55 + 0.45 * p.cond / 100) * MORF[p.mor];
  function valOf(p) {
    const r = Math.max(3, rat(p)), af = p.age <= 21 ? 1.35 : p.age <= 27 ? 1.1 : p.age <= 30 ? 0.85 : p.age <= 32 ? 0.55 : 0.3;
    const v = 25 * Math.pow(r, 4.2) * af;
    return Math.max(10000, v > 100000 ? Math.round(v / 25000) * 25000 : Math.round(v / 5000) * 5000);
  }
  const wageOf = p => Math.max(250, Math.round(valOf(p) / 280 / 50) * 50);
  const posStr = p => p.pos === 'GK' ? 'GK' : p.pos + ' ' + p.side;
  const pname = p => p ? p.f + ' ' + p.l : '?';

  function natPick(R) { let t = R() * 100; for (const [n, w] of NAT) { if ((t -= w) <= 0) return n; } return 'ENG'; }
  function genPlayer(S, R, team, pos, side, starter, abo, ageo) {
    const ab = clamp(abo != null ? abo : team.rep + (starter ? ri(R, -1, 2) : ri(R, -4, 0)), 4, 19);
    const nat = natPick(R), names = EU[nat];
    const f = names ? pk(R, names[0]) : pk(R, FIRST), taken = new Set(team.pl.map(id => S.P[id].l));
    let l = names ? pk(R, names[1]) : pk(R, LAST);
    for (let k = 0; k < 10 && taken.has(l); k++) l = names ? pk(R, names[1]) : pk(R, LAST);
    const age = ageo || 18 + Math.floor(R() * R() * 10 + R() * 8);
    const a = ATTRS.map((k, i) => {
      let v;
      if (pos === 'GK') v = i === 0 ? ab + ri(R, -1, 1) : (i === 8 || i === 3 || i === 9) ? ab - 3 + ri(R, -3, 2) : ab - 7 + ri(R, -3, 3);
      else if (i === 0) v = ri(R, 1, 4);
      else if (PRIM[pos].includes(i)) v = ab + ri(R, -2, 2);
      else if (SEC[pos].includes(i)) v = ab - 2 + ri(R, -3, 2);
      else v = ab - 6 + ri(R, -3, 3);
      return clamp(v, 1, 20);
    });
    if (age >= 32) a[8] = clamp(a[8] - 3, 1, 20);
    const p = { id: S.nid++, f, l, nat, age, pos, side, a, cond: 100, mor: 3, inj: 0, ban: 0, yc: 0, gl: 0, ap: 0, rt: 0, t: team.id, tl: false, con: ri(R, 1, 4), fm: [], ap0: 0 };
    p.val = valOf(p); p.wage = wageOf(p);
    p.pot = Math.round(clamp(rat(p) + (age <= 20 ? ri(R, 1, 6) : age <= 23 ? ri(R, 0, 3) : 0), 1, 20)); // how good he could be (the youth coach guesses)
    S.P[p.id] = p; team.pl.push(p.id);
    return p;
  }
  const genMgr = R => pk(R, FIRST) + ' ' + pk(R, LAST);
  const expRank = (S, tid) => S.T.slice().sort((a, b) => b.rep - a.rep).findIndex(t => t.id === tid) + 1;
  const expText = r => r <= 2 ? 'win the league' : r <= 5 ? 'challenge for the title' : r <= 9 ? 'a top-half finish' : r <= 12 ? 'a mid-table finish' : 'avoid relegation';
  function addMsg(S, from, subj, body, act, imp) { S.msgs.unshift({ id: S.mid++, day: S.day, from, subj, body, read: false, act: act || null, imp: !!imp }); if (S.msgs.length > 70) S.msgs.length = 70; }
  const news = (S, t) => { S.news.unshift(t); if (S.news.length > 8) S.news.length = 8; };

  // Division One: who's waiting to come up (relegated clubs join the queue)
  const DIV1 = [
    ['Puddleby Town', 'Puddleby', 'Duckpond Lane', 12000, 9, '#3a6ad8', '#ffffff', 'plain', 'Mr Gordon Puddle', 'Division One runners-up 1988'],
    ['Saltmarsh City', 'Saltmarsh', 'The Seawall', 15000, 10, '#1a8a8a', '#ffffff', 'hoops', 'Captain Ida Salt', 'Premier Jack League champions 1921 (they still mention it)'],
    ['Crumbsby United', 'Crumbsby', 'Biscuit Lane', 14000, 9, '#8a5a2a', '#ffe0a0', 'hoops', 'Mr Ken Crumb', 'Jack Cup semi-finalists 1979'],
    ['Wobbleton Rovers', 'Wobbleton', 'Jelly Park', 10000, 8, '#e8a000', '#000000', 'stripes', 'Mrs Jean Wobble', 'None. The jelly is famous though.'],
    ['Grimsditch Town', 'Grimsditch', 'Ditch Lane', 11000, 9, '#2a2a2a', '#ff7a00', 'plain', 'Mr Ernie Grimm', 'Division Two champions 1994'],
    ['Mudford Athletic', 'Mudford', 'The Bog End', 9000, 8, '#5a3a1a', '#ffffff', 'halves', 'Mr Stan Mudd', 'Mudford Charity Shield 1963'],
    ['Tumbledown Wanderers', 'Tumbledown', 'Rickety Road', 8000, 8, '#a01a1a', '#ffd400', 'stripes', 'Mr Basil Tumble', 'None. The stand fell down in 1985. Nobody was hurt.'],
    ['Fizzwick Albion', 'Fizzwick', 'Pop Lane', 13000, 9, '#00a0c0', '#ffffff', 'sash', 'Mrs Pat Fizzwick', 'Division One champions 1990'],
  ];
  const FORMLIST = ['4-4-2', '4-4-2', '4-3-3', '5-3-2', '3-5-2', '4-5-1'];
  function makeTeam(S, R, i, t) {
    const team = { id: i, n: t[0], sh: t[1], gr: t[2], cap: t[3], rep: t[4], c1: t[5], c2: t[6], pat: t[7], ch: t[8], mgr: genMgr(R), form: pk(R, FORMLIST), style: pk(R, [0, 1, 1, 2, 3]), ment: 1, pl: [], hon: t[9] || HONOURS[(i * 3 + 1) % HONOURS.length] };
    const made = SQUAD.map(([pos, side, st]) => genPlayer(S, R, team, pos, side, st));
    const star = pk(R, made.filter((p, k) => SQUAD[k][2] && p.pos !== 'GK'));
    (PRIM[star.pos] || []).forEach(k => { star.a[k] = clamp(star.a[k] + 2, 1, 20); }); star.val = valOf(star); star.wage = wageOf(star);
    return team;
  }
  // the league (a double round robin, circle method) and the Jack Cup first round
  function makeFixtures(S, R) {
    S.fx = [];
    let ids = shuffle(R, S.T.map(t => t.id));
    const rounds = [];
    for (let r = 0; r < 15; r++) {
      const pr = [];
      for (let i = 0; i < 8; i++) { let h = ids[i], a = ids[15 - i]; if ((i === 0 && r % 2) || (i > 0 && (r + i) % 2)) [h, a] = [a, h]; pr.push([h, a]); }
      rounds.push(pr); ids = [ids[0], ids[15], ...ids.slice(1, 15)];
    }
    rounds.forEach((pr, r) => pr.forEach(([h, a]) => S.fx.push({ id: S.fx.length, day: LDAYS[r], c: 'L', h, a })));
    rounds.forEach((pr, r) => pr.forEach(([h, a]) => S.fx.push({ id: S.fx.length, day: LDAYS[15 + r], c: 'L', h: a, a: h })));
    S.cup = { rd: 0 };
    cupDraw(S, shuffle(R, S.T.map(t => t.id)), 0);
  }
  function genWorld(seed, me, mgr, o) {
    o = o || {};
    const R = rng(seed);
    const S = { v: 1, seed, day: 0, me, mgr, P: {}, T: [], fx: [], msgs: [], offers: [], nid: 1, mid: 1, form: '4-4-2', ment: 1, style: 1, sel: [], conf: 60, bal: 0, fin: { gate: 0, tv: 0, sales: 0, buys: 0, wages: 0, prize: 0 }, hist: [], cup: { rd: 0 }, news: [], over: false, played: 0, lpos: 0, season: 1, yth: [], pool: DIV1.map(r => r.slice()), past: [] };
    TEAMS0.forEach((t, i) => S.T.push(makeTeam(S, R, i, t)));
    // a familiar face between the sticks at Gubbinz Town
    const gk = S.P[S.T[3].pl[1]]; gk.f = 'Robby'; gk.l = 'Gubbinson'; gk.nat = 'ENG'; gk.robot = 1; gk.a[0] = clamp(gk.a[0] + 3, 1, 20); gk.a[8] = 3; gk.a[9] = 20; gk.val = valOf(gk); gk.wage = wageOf(gk);
    S.T[me].mgr = mgr;
    S.bal = S.T[me].rep * 380000 + 900000;
    makeFixtures(S, R);
    S.T.forEach(t => { if (t.id !== me) t.sel = null; });
    S.sel = autoPick(S, S.T[me], S.form);
    if (o.cup) return S; // an online Cup Night only needs the clubs and players
    youthIntake(S, R, 3, true);
    const t = S.T[me], ex = expRank(S, me);
    addMsg(S, t.ch + ' (Chairman)', 'Welcome to ' + t.n + '!', `Dear ${mgr},\n\nWelcome to ${t.n}! On behalf of the board, I'm delighted to have you as our new manager.\n\nThis season, the board expects you to ${expText(ex)}.\n\nYour bank balance is ${money(S.bal)}. Spend it wisely. Spend it on players, not on the big telly in the manager's office.\n\nThe lads train at 10. The tea lady is called Brenda. Do not upset Brenda.\n\n${t.ch}\nChairman, ${t.n}`, null, true);
    addMsg(S, TEL, 'Alright, gaffer', `Alright gaffer! Tel Bassett, your assistant. I'm the one in the purple shell suit.\n\nI've picked a ${S.form} for now. Have a look at the Squad and Tactics screens and change whatever you like.\n\nOn the Tactics screen, click a shirt on the pitch, then click another player to swap them. A green ring means he's happy in that position. Red means he'll be rubbish there.\n\nFirst game is on ${fmtDate(LDAYS[0])}. Press Continue when you're ready, and I'll shout if anything important comes up.`);
    news(S, 'The 99/00 Premier Jack League season kicks off on Saturday 7 August!');
    news(S, `${mgr} named as the new manager of ${t.n}.`);
    return S;
  }
  function cupDraw(S, teams, rd) {
    for (let i = 0; i + 1 < teams.length; i += 2) S.fx.push({ id: S.fx.length, day: CDAYS[rd], c: 'C', rd, h: teams[i], a: teams[i + 1] });
    S.cup.rd = rd;
  }
  const TEL = 'Tel (Assistant Manager)';
  // older saves: fill in everything newer versions keep
  function migrate(S) {
    if (S.style == null) S.style = 1;
    if (!S.season) S.season = 1;
    if (!Array.isArray(S.yth)) S.yth = [];
    if (!Array.isArray(S.pool)) S.pool = DIV1.map(r => r.slice());
    if (!Array.isArray(S.past)) S.past = [];
    if (S.fin && S.fin.prize == null) S.fin.prize = 0;
    S.T.forEach(t => { if (t.style == null) t.style = t.rep >= 15 ? 0 : t.rep <= 9 ? 2 : 1; });
    for (const id in S.P) { const p = S.P[id]; if (p.pot == null) p.pot = Math.round(clamp(rat(p) + Math.max(0, 23 - p.age) * 0.5, 1, 20)); if (!Array.isArray(p.fm)) p.fm = []; if (p.ap0 == null) p.ap0 = p.ap || 0; if (p.l === 'Gubbinson' && p.f === 'Robby') p.robot = 1; }
    return S;
  }
  // ---- the youth team: kids with a guess at how good they could be. Promote them, or let them go.
  function youthIntake(S, R, n, quiet) {
    const t = S.T[S.me], made = [];
    for (let k = 0; k < n && S.yth.length < 8; k++) {
      const pos = pk(R, ['GK', 'D', 'D', 'M', 'M', 'M', 'F', 'F']), side = pos === 'GK' ? 'C' : pk(R, ['C', 'C', 'L', 'R', 'LC', 'RC']);
      const tmp = { id: -1, rep: t.rep, pl: t.pl.slice() };
      const p = genPlayer(S, R, tmp, pos, side, 0, clamp(t.rep - 6 + ri(R, -2, 2), 3, 13), ri(R, 15, 16));
      delete S.P[p.id];
      p.t = -1; p.con = 0; p.wage = 60; p.pot = clamp(Math.round(rat(p)) + ri(R, 2, 8) + (R() < 0.12 ? 3 : 0), 5, 20); p.val = valOf(p);
      S.yth.push(p); made.push(p);
    }
    if (!quiet && made.length) addMsg(S, 'Youth Team Coach', 'Youth intake day', `Gaffer,\n\nThe new youth team lads have arrived:\n\n${made.map(p => `${pname(p)} (${posStr(p)}, ${p.age}): ${potWord(p)}`).join('\n')}\n\nHave a look on the Youth Team screen. You can promote any of them to the first team whenever you like.\n\nOne of them asked if we've got a PlaySpace in the changing room. We haven't.`, null, true);
    return made;
  }
  const potStars = p => clamp(Math.round(((p.pot || 8) - 6) / 2.6), 1, 5);
  const potWord = p => ['', 'Honest trier. That\'s about it.', 'Could be a decent squad player.', 'Could make a proper first-teamer.', 'Could be a top player one day.', 'Could be a STAR. Don\'t tell him I said that.'][potStars(p)];
  function bump(p, d, phys) {
    const pool = phys ? [8, 9] : p.pos === 'GK' ? [0, 0, 0, 3, 8] : PRIM[p.pos].concat(PRIM[p.pos], SEC[p.pos]);
    const k = pool[Math.floor(Math.random() * pool.length)]; p.a[k] = clamp(p.a[k] + d, 1, 20);
  }
  // once a month: young players get better (faster if they play), old ones slow down
  function develop(S) {
    const gains = [];
    for (const p of Object.values(S.P).concat(S.yth)) {
      const played = Math.max(0, (p.ap || 0) - (p.ap0 || 0)); p.ap0 = p.ap || 0;
      const r0 = rat(p);
      if (p.age <= 23 && r0 < (p.pot || 0) - 0.3) { const n = 1 + (played >= 2 ? 1 : 0) + (p.age <= 19 ? 1 : 0); for (let k = 0; k < n; k++) if (Math.random() < 0.42) bump(p, 1); }
      else if (p.age >= 31 && Math.random() < 0.28) bump(p, -1, true);
      p.val = valOf(p);
      if ((p.t === S.me || p.t === -1) && Math.round(rat(p)) > Math.round(r0)) gains.push(p);
    }
    return gains;
  }
  // ---- the summer: everybody a year older, contracts, retirements, promotion and relegation, a new fixture list.
  // (Patch 3.05 winds the calendar back to August 1999, so every season is 99/00 again. It's not a bug. It's a feature.)
  function seasonEnd(S) {
    const R = Math.random, tb = table(S), out = { ret: [], left: [], rel: [], up: [], yth: [] };
    tb.forEach((r, i) => { const t = S.T[r.id]; t.rep = clamp(t.rep + (i < 2 ? 1 : i >= 13 ? -1 : 0), 6, 19); });
    // the bottom three go down, three come up from Division One (the manager has already left a relegated club)
    tb.slice(-3).forEach(r => {
      const old = S.T[r.id];
      out.rel.push(old.n);
      S.pool.push([old.n, old.sh, old.gr, old.cap, clamp(old.rep - 1, 7, 10), old.c1, old.c2, old.pat, old.ch, old.hon]);
      old.pl.forEach(id => { delete S.P[id]; });
      if (S.sel) S.sel = S.sel.map(x => (S.P[x] ? x : null));
      S.pool.sort((a, b) => b[4] - a[4] + (R() - 0.5) * 3);
      const nu = S.pool.shift();
      S.T[r.id] = makeTeam(S, R, r.id, nu);
      out.up.push(nu[0]);
    });
    S.msgs.forEach(m => { if (m.act && !m.act.done) m.act.done = 'Too late now: it\'s a new season'; });
    // everybody gets a year older; contracts tick down
    for (const p of Object.values(S.P)) {
      p.age++; p.con--;
      const mine = p.t === S.me;
      if (p.age >= 37 || (p.age >= 33 && R() < (p.age - 32) * 0.22)) { if (mine) out.ret.push(`${pname(p)} (${p.age - 1})`); dropPlayer(S, p); continue; }
      if (p.con <= 0) { if (mine) { out.left.push(pname(p)); dropPlayer(S, p); continue; } p.con = ri(R, 1, 3); }
      Object.assign(p, { gl: 0, ap: 0, rt: 0, yc: 0, ban: 0, cond: 100, mor: 3, fm: [], ap0: 0, tl: mine ? p.tl : false });
      if (p.age >= 32) p.a[8] = clamp(p.a[8] - 1, 1, 20);
      p.val = valOf(p);
    }
    // the youth team grows up: 18-year-olds go up to the first team (if there's room) or leave
    S.yth.forEach(p => { p.age++; });
    S.yth = S.yth.filter(p => { if (p.age < 18) return true; if (S.T[S.me].pl.length < 24) { promote(S, p); out.yth.push(pname(p)); } return false; });
    S.T.forEach(t => refill(S, t, true));
    // the new season
    makeFixtures(S, R);
    S.T.forEach(t => { if (t.id !== S.me) { t.form = R() < 0.3 ? pk(R, FORMLIST) : t.form; } });
    Object.assign(S, { day: 0, over: false, played: 0, lpos: 0, offers: [], cupWin: undefined, cupCel: 0, sackWarn: 0, season: (S.season || 1) + 1 });
    S.fin = { gate: 0, tv: 0, sales: 0, buys: 0, wages: 0, prize: 0 };
    S.sel = autoPick(S, S.T[S.me], S.form);
    return out;
  }
  function dropPlayer(S, p) {
    const t = S.T[p.t]; if (t) t.pl = t.pl.filter(x => x !== p.id);
    delete S.P[p.id];
    if (S.sel) S.sel = S.sel.map(x => (x === p.id ? null : x));
  }
  function promote(S, p) {
    p.t = S.me; p.con = 3; p.wage = Math.max(250, Math.round(wageOf(p) / 2 / 50) * 50); p.val = valOf(p); p.tl = false;
    S.P[p.id] = p; S.T[S.me].pl.push(p.id);
  }
  // a new job: the manager walks into club tid (keeps his name, his record and the database)
  function takeJob(S, tid) {
    const old = S.T[S.me];
    if (old) old.mgr = genMgr(Math.random);
    S.me = tid; const t = S.T[tid]; t.mgr = S.mgr;
    S.bal = t.rep * 380000 + 900000; S.conf = 58; S.sel = autoPick(S, t, S.form); S.yth = []; S.offers = [];
    t.pl.forEach(id => { S.P[id].tl = false; });
  }

  // ---- team selection
  function autoPick(S, team, form) {
    const slots = FORMS[form];
    const avail = team.pl.map(id => S.P[id]).filter(p => p && !p.inj && !p.ban);
    const pairs = [];
    slots.forEach((sl, i) => avail.forEach(p => pairs.push([fit(p, sl) * (0.6 + 0.4 * p.cond / 100), i, p.id])));
    pairs.sort((a, b) => b[0] - a[0]);
    const xi = new Array(11).fill(null), used = new Set();
    for (const [, i, id] of pairs) { if (xi[i] != null || used.has(id)) continue; xi[i] = id; used.add(id); }
    const rest = avail.filter(p => !used.has(p.id)).sort((a, b) => rat(b) - rat(a));
    const bench = [], gk = rest.find(p => p.pos === 'GK');
    if (gk) bench.push(gk.id);
    rest.forEach(p => { if (bench.length < 5 && !bench.includes(p.id)) bench.push(p.id); });
    while (bench.length < 5) bench.push(null);
    return xi.concat(bench);
  }
  // keep the user's selection legal (sold, injured, banned players get replaced by the assistant)
  function fixSel(S) {
    const team = S.T[S.me], slots = FORMS[S.form], changes = [];
    const ok = id => id != null && S.P[id] && S.P[id].t === S.me && !S.P[id].inj && !S.P[id].ban;
    const sel = (S.sel || []).slice(0, 16); while (sel.length < 16) sel.push(null);
    const used = new Set(sel.filter(ok));
    for (let i = 0; i < 16; i++) {
      if (ok(sel[i])) continue;
      const out = sel[i] != null && S.P[sel[i]] ? S.P[sel[i]] : null;
      const cands = team.pl.filter(id => ok(id) && !used.has(id)).map(id => S.P[id]);
      if (!cands.length) { sel[i] = null; continue; }
      const best = i < 11 ? cands.sort((a, b) => fit(b, slots[i]) - fit(a, slots[i]))[0] : cands.sort((a, b) => rat(b) - rat(a))[0];
      sel[i] = best.id; used.add(best.id);
      if (out && i < 11) changes.push(`${pname(best)} comes in for ${pname(out)} (${out.t !== S.me ? 'sold' : out.inj ? 'injured' : 'suspended'}).`);
    }
    S.sel = sel;
    return changes;
  }
  const teamOf = (S, id) => S.T[id];
  const todays = S => S.fx.filter(f => f.day === S.day && !f.done);

  // ================================================================ the match engine
  // tactics: a formation, a mentality (MENT) and a passing style. o.picks (online Cup Night): { tid: { sel, form, ment, style } }
  const STYLES = ['Passing', 'Mixed', 'Long ball', 'Counter'];
  const STYLED = ['Keep it on the deck. Good passers make the midfield purr. A side that can\'t pass gets found out.', 'A bit of everything. Never brilliant, never daft.', 'Hoof it up to the big man. Skips the midfield. Tall strikers who are good in the air love it.', 'Sit deep and break fast. Less of the ball but better chances: deadly against a side that attacks.'];
  function newMatch(S, fx, o) {
    o = o || {};
    const mk = t => {
      const pick = o.picks && o.picks[t.id];
      const user = t.id === S.me && !o.cpu;
      const opp = S.T[fx.h === t.id ? fx.a : fx.h];
      const form = pick ? pick.form : user ? S.form : t.form;
      if (user && !pick) fixSel(S);
      const sel = pick ? pick.sel.slice() : user ? S.sel.slice() : autoPick(S, t, form);
      const ment = pick ? pick.ment : user ? S.ment : t.rep + 3 < opp.rep ? 0 : t.rep > opp.rep + 4 ? 2 : 1;
      const style = pick ? pick.style | 0 : user ? (S.style == null ? 1 : S.style) : (t.style == null ? 1 : t.style);
      return { tid: t.id, user: user || !!pick, form, ment, style, xi: sel.slice(0, 11), bench: sel.slice(11).filter(x => x != null && S.P[x]), subs: 0, goals: 0, shots: 0, on: 0, corners: 0, fouls: 0, yel: [], reds: [], inj: [], poss: 0, boost: 1, agg: 1, played: sel.slice(0, 11).filter(x => x != null), sc: {} };
    };
    return { fx, min: 0, h: mk(S.T[fx.h]), a: mk(S.T[fx.a]), goals: [], log: [], done: false };
  }
  function strength(S, sd) {
    const slots = FORMS[sd.form]; let gk = 0, pas = 0, np = 0, hd = 0, nf = 0; const d = [], m = [], f = [];
    for (let i = 0; i < 11; i++) {
      const id = sd.xi[i]; if (id == null) continue; const p = S.P[id]; if (!p) continue;
      const e = eff(p, slots[i]), ps = slots[i][0];
      if (ps === 'GK') gk = e; else { (ps === 'D' ? d : ps === 'M' ? m : f).push(e); pas += p.a[4]; np++; if (ps === 'F') { hd += p.a[3]; nf++; } }
    }
    const av = l => l.length ? l.reduce((x, y) => x + y, 0) / l.length : 2, mm = MENT[sd.ment];
    let att = (av(f) * (0.72 + 0.12 * f.length) + av(m) * 0.07 * m.length) * mm[0];
    let mid = av(m) * (0.68 + 0.08 * m.length) + av(d) * 0.02 * d.length + av(f) * 0.03 * f.length;
    let def = (av(d) * (0.6 + 0.085 * d.length) + av(m) * 0.045 * m.length) * mm[1];
    const st = sd.style | 0;
    if (st === 0) { const k = clamp(((np ? pas / np : 8) - 10) * 0.014, -0.08, 0.08); mid *= 1 + k; att *= 1 + k / 2; }
    else if (st === 2) { mid *= 0.9; att *= 0.95 + clamp((nf ? hd / nf : 8) - 9, -4, 9) * 0.013; }
    else if (st === 3) { mid *= 0.88; def *= 1.05; }
    return { att, mid, def, gk: gk || 2, st };
  }
  const PW = { sho: { GK: 0, D: 0.5, M: 2.2, F: 6 }, pas: { GK: 0.05, D: 1, M: 4, F: 2 }, foul: { GK: 0.1, D: 3, M: 2, F: 1 }, any: { GK: 0.3, D: 1, M: 1, F: 1 } };
  function pickP(S, sd, kind, not) {
    const slots = FORMS[sd.form]; let tot = 0; const c = [];
    sd.xi.forEach((id, i) => { if (id == null || id === not) return; const p = S.P[id]; if (!p) return; const w = PW[kind][slots[i][0]] * (kind === 'sho' ? p.a[7] + 2 : kind === 'pas' ? p.a[4] + 2 : 1); if (w > 0) { c.push([p, w]); tot += w; } });
    let r = Math.random() * tot; for (const [p, w] of c) { if ((r -= w) <= 0) return p; }
    return c.length ? c[c.length - 1][0] : null;
  }
  // ---- commentary. Every line is a code (so an online Cup Night can send a whole half in a couple of small packets):
  // { min, kind, side, c: [cat, ...numbers] } (or { txt } for free text), and lineText() turns it into words.
  const T = {
    build: ['{p} picks the ball up in midfield...', '{p} goes on a run down the wing!', 'Lovely ball from {p}...', '{p} plays a one-two...', '{t} are pressing now.', '{p} tries a long ball forward...', '{p} skips past one challenge... and another!', '{p} switches the play...', '{p} nutmegs his man! The crowd love that.'],
    lost: ['...but {d} reads it and clears.', '...cut out by {d}.', '...and {d} hoofs it into the stand.', '...offside! The flag goes up.', '...too heavy. Goal kick.', '...and {d} slides in with a perfect tackle.'],
    wide: ['{p} shoots... WIDE!', '{p} blazes it over the bar. Into Row Z!', '{p} scuffs it. The groundsman\'s dog could have done better.', '{p} tries his luck from 30 yards... miles over.', '{p} heads it just wide!', '{p} drags it past the post.', '{p} leans back and skies it. That\'s gone into orbit.'],
    save: ['{p} shoots... SAVED by {k}!', 'Great stop by {k} from {p}!', '{k} tips {p}\'s shot round the post.', '{p} forces a smart save from {k}.', '{k} gathers {p}\'s header. Easy.', '{k} dives full length to keep out {p}\'s drive!', '{k} gets a fingertip to {p}\'s volley!'],
    post: ['{p}... OFF THE POST!', '{p} rattles the crossbar! So close!', '{p} hits the woodwork! The whole ground went "OOOOH".'],
    goal: ['{p} slots it home', '{p} curls it into the top corner', '{p} smashes it in off the bar', '{p} tucks away the rebound', '{p} chips the keeper! Cheeky!', '{p} toe-pokes it in. Dave would be proud', '{p} volleys it in from the edge of the box', '{p} rounds the keeper and walks it in', '{p} scores with a diving header', '{p} bundles it over the line with his knee'],
    assist: [' after a lovely ball from {a}', ' from {a}\'s cross', ' after great work by {a}', ' from {a}\'s knock-down'],
    foul: ['{p} brings down {q}. Free kick.', 'Nasty tackle from {p} on {q}.', '{p} goes through the back of {q}.', '{p} pulls {q}\'s shirt. The ref saw that.', '{p} clips {q}\'s heels.'],
    corner: ['Corner to {t}.', '{t} win a corner...', 'It\'s deflected out for a corner to {t}.'],
    fill: ['The ball goes out for a throw-in.', 'A dog has got onto the pitch! The stewards chase it off.', 'The {t} fans are singing. Badly.', 'Mexican wave in the main stand.', 'The ref stops play to tie his bootlace.', 'Somebody in the crowd has a trumpet. Nobody knows why.', 'End-to-end stuff this!', 'It\'s gone a bit scrappy in midfield.', '{p} is booed by the away fans. He waves.', 'The pie man is doing a roaring trade.', 'A beach ball has blown onto the pitch. {p} boots it into the crowd.', 'The {t} bench are up on their feet complaining about something.'],
    miss: ['SAVED!', 'MISSES!', 'hits the bar!'],
  };
  // team talks: [what happens if it goes badly, what happens if it works]. 0-3 half-time, 4-7 before kick-off
  const XT = [
    ['The players look a bit too relaxed. One of them is doing a crossword.', 'The players nod. They look relaxed and confident.'],
    ['The players look like they\'ve heard it all before.', 'The players look fired up!'],
    ['The gaffer shouts so loud the tea lady cries. The players look shell-shocked.', 'The gaffer throws a teacup at the wall. The players sprint back out. TERRIFIED. And motivated.'],
    ['Gubbinz ate all the orange slices and fell asleep in the kit basket. The players are hungry and confused.', 'Gubbinz stands on the physio\'s table and shouts "WAAAGH!" for six minutes. Weirdly, it works. The lads are buzzing.'],
    ['The lads look TOO relaxed. Somebody\'s eating a sausage roll.', 'The lads look relaxed. Shoulders down, chins up.'],
    ['The lads look confused. "But we\'re good though?"', 'Fists are banged on the table. Nobody expects anything? They\'ll SHOW them.'],
    ['Some of the lads look at their boots. The pressure\'s got to them.', 'The lads nod. They want it.'],
    ['Nobody is sure who Brenda is. The new lad thinks she\'s the physio.', 'Brenda waves from the tea hatch. The players run out like their shorts are on fire.'],
  ];
  // before kick-off: k 1-4 (0 = say nothing). Returns [boost, worked]
  function preTalkB(S, sd, opp, k) {
    const fav = S.T[sd.tid].rep - opp.rep, mor = sd.played.reduce((s, id) => s + (S.P[id] ? S.P[id].mor : 3), 0) / Math.max(1, sd.played.length), r = Math.random();
    if (k === 1) return fav <= 0 ? [1.04, 1] : [0.98, 0];
    if (k === 2) return fav < -1 ? [r < 0.8 ? 1.07 : 1.01, 1] : [0.96, 0];
    if (k === 3) return mor >= 3.3 ? [1.05, 1] : [0.96, 0];
    if (k === 4) return r < 0.5 ? [1.07, 1] : [0.98, 0];
    return [1, 1];
  }
  // half-time: k 0-3, diff = our goals minus theirs
  function htTalkB(k, diff) {
    const r = Math.random();
    if (k === 0) return diff > 0 ? [1.04, 1] : [0.98, 0];
    if (k === 1) return r < 0.75 ? [1.06, 1] : [0.99, 0];
    if (k === 2) return diff < 0 ? (r < 0.6 ? [1.12, 1] : [0.94, 0]) : (r < 0.35 ? [1.06, 1] : [0.92, 0]);
    return r < 0.5 ? [1.13, 1] : [0.9, 0];
  }
  const CATS = ['txt', 'ko', 'h2', 'ht', 'ft', 'build', 'bl', 'wide', 'save', 'post', 'goal', 'corner', 'foul', 'yel', 'red', 'y2', 'inj', 'fill', 'sub', 'pen', 'penwin', 'xt'];
  const KINDS = ['', 'goal', 'chance', 'card', 'sub'], SIDES = ['', 'h', 'a'];
  const fill = (s, o) => String(s || '').replace(/\{(\w)\}/g, (m, k) => o[k] != null ? o[k] : m);
  const tpl = cat => Math.floor(Math.random() * T[cat].length);
  // words for a line. ctx: { h: home team id, a: away team id, final }
  function lineText(S, L, ctx) {
    if (L.txt != null) return L.txt;
    const c = L.c || [], sn = id => { const p = id ? S.P[id] : null; return p ? p.l : 'someone'; }, tn = id => (S.T[id] ? S.T[id].sh : '?');
    const H = S.T[ctx.h] || { sh: '?', gr: 'the ground' }, A = S.T[ctx.a] || { sh: '?' };
    switch (c[0]) {
      case 'ko': return `${c[1] ? 'It\'s the JACK CUP FINAL at Jackbley!' : 'And we\'re off at ' + H.gr + '!'} ${H.sh} v ${A.sh}.`;
      case 'h2': return 'The second half is under way!';
      case 'ht': return `HALF TIME: ${H.sh} ${c[1]}-${c[2]} ${A.sh}`;
      case 'ft': return `FULL TIME: ${H.sh} ${c[1]}-${c[2]} ${A.sh}`;
      case 'build': return fill(T.build[c[1]], { p: sn(c[2]), t: tn(c[3]) });
      case 'bl': return fill(T.build[c[1]], { p: sn(c[2]), t: tn(c[3]) }) + ' ' + fill(T.lost[c[4]], { d: sn(c[5]) });
      case 'wide': return fill(T.wide[c[1]], { p: sn(c[2]) });
      case 'save': return fill(T.save[c[1]], { p: sn(c[2]), k: c[3] ? sn(c[3]) : 'the stand-in keeper' });
      case 'post': return fill(T.post[c[1]], { p: sn(c[2]) });
      case 'goal': return `GOAL!!! ${fill(T.goal[c[1]], { p: sn(c[2]) })}${c[4] ? fill(T.assist[c[3]], { a: sn(c[4]) }) : ''}! ${H.sh} ${c[5]}-${c[6]} ${A.sh}`;
      case 'corner': return fill(T.corner[c[1]], { t: tn(c[2]) });
      case 'foul': return fill(T.foul[c[1]], { p: sn(c[2]), q: sn(c[3]) });
      case 'yel': return `${fill(T.foul[c[1]], { p: sn(c[2]), q: sn(c[3]) })} Yellow card for ${sn(c[2])}.`;
      case 'red': return `RED CARD! ${sn(c[1])} is sent off for a horror tackle on ${sn(c[2])}!`;
      case 'y2': return `Second yellow for ${sn(c[1])}! He's OFF! ${tn(c[2])} are down to ${c[3]}.`;
      case 'inj': return `${sn(c[1])} is down injured... the physio's on. He'll have to come off.`;
      case 'fill': return fill(T.fill[c[1]], { t: tn(c[2]), p: sn(c[3]) });
      case 'sub': return `Substitution for ${tn(c[1])}: ${sn(c[2])} replaces ${sn(c[3])}.`;
      case 'pen': return `PENS: ${sn(c[1])} (${tn(c[2])})... ${c[3] ? 'SCORES!' : T.miss[c[4]] || 'MISSES!'}`;
      case 'penwin': return `${S.T[c[1]] ? S.T[c[1]].n : '?'} win ${c[2]}-${c[3]} on penalties!`;
      case 'xt': return `${tn(c[1])} team talk: ${XT[c[2]] ? XT[c[2]][c[3] ? 1 : 0] : ''}`;
      default: return '';
    }
  }
  // compact wire form of a coded line: [min, kind, side, cat, ...]
  const lineOut = L => [L.min, Math.max(0, KINDS.indexOf(L.kind || '')), Math.max(0, SIDES.indexOf(L.side || '')), Math.max(0, CATS.indexOf((L.c || [])[0])), ...(L.c || []).slice(1).map(v => (typeof v === 'number' && isFinite(v) ? v : 0))];
  const lineIn = a => (Array.isArray(a) && a.length >= 4 && a.length <= 12 ? { min: a[0] | 0, kind: KINDS[a[1] | 0] || '', side: SIDES[a[2] | 0] || '', c: [CATS[a[3] | 0] || 'txt', ...a.slice(4).map(v => +v || 0)] } : null);
  function stepMin(S, M, talk) {
    M.min++;
    const min = M.min, h = M.h, a = M.a;
    const say = (c, kind, side) => { if (talk) M.log.push({ min, c, kind: kind || '', side: side || '' }); };
    const sh = strength(S, h), sa = strength(S, a);
    const mH = Math.pow(sh.mid * 1.07 * h.boost, 0.6), mA = Math.pow(sa.mid * a.boost, 0.6), pH = mH / (mH + mA);
    h.poss += pH; a.poss += 1 - pH;
    [h, a].forEach(sd => sd.xi.forEach(id => { if (id != null && S.P[id]) { const p = S.P[id]; p.cond = Math.max(15, p.cond - (0.27 - p.a[9] * 0.009) * (sd.style === 0 ? 0.95 : 1)); } }));
    const r = Math.random(), foulP = 0.1 * (h.agg + a.agg) / 2;
    if (r < 0.26) {
      const at = Math.random() < pH ? h : a, df = at === h ? a : h, sA = at === h ? sh : sa, sD = at === h ? sa : sh;
      const sideK = at === h ? 'h' : 'a';
      let q = clamp(Math.pow((sA.att * at.boost) / (sD.def * df.boost), 0.5), 0.5, 2);
      if (sA.st === 3) q *= df.ment === 2 ? 1.28 : df.ment === 1 ? 1.1 : 0.97;
      if (sA.st === 2 && sD.st === 3) q *= 0.94;
      const sp = pickP(S, at, 'sho'); if (!sp) return;
      const kp = df.xi[0] != null ? S.P[df.xi[0]] : null;
      if (Math.random() < 0.6 * Math.sqrt(q)) {
        at.shots++;
        if (talk && Math.random() < 0.5) { const bp = pickP(S, at, 'pas', sp.id); say(['build', tpl('build'), bp ? bp.id : 0, at.tid]); }
        if (Math.random() < 0.42 * Math.pow(q, 0.4)) {
          at.on++;
          const gq = clamp(Math.pow(sA.att * at.boost / (sD.gk * 0.5 + sD.def * 0.5), 0.55), 0.5, 2.2);
          if (Math.random() < 0.36 * Math.pow(gq, 0.8)) {
            at.goals++; at.sc[sp.id] = (at.sc[sp.id] || 0) + 1;
            const ap = Math.random() < 0.7 ? pickP(S, at, 'pas', sp.id) : null;
            M.goals.push({ min, side: sideK, pid: sp.id });
            say(['goal', tpl('goal'), sp.id, tpl('assist'), ap ? ap.id : 0, h.goals, a.goals], 'goal', sideK);
          } else {
            say(['save', tpl('save'), sp.id, kp ? kp.id : 0], 'chance', sideK);
            if (Math.random() < 0.35) { at.corners++; if (Math.random() < 0.5) say(['corner', tpl('corner'), at.tid], '', sideK); }
          }
        } else {
          if (Math.random() < 0.07) say(['post', tpl('post'), sp.id], 'chance', sideK);
          else say(['wide', tpl('wide'), sp.id], '', sideK);
          if (Math.random() < 0.15) at.corners++;
        }
      } else if (talk && Math.random() < 0.4) {
        const bp = pickP(S, at, 'pas'), dp = pickP(S, df, 'foul');
        say(['bl', tpl('build'), bp ? bp.id : 0, at.tid, tpl('lost'), dp ? dp.id : 0], '', sideK);
      }
    } else if (r < 0.26 + foulP) {
      const fs = Math.random() < 0.5 ? h : a, vs = fs === h ? a : h;
      const fp = pickP(S, fs, 'foul'), vp = pickP(S, vs, 'any'); if (!fp) return;
      fs.fouls++;
      const sideK = fs === h ? 'h' : 'a';
      const card = Math.random();
      if (card < 0.008 * fs.agg) { sendOff(fs, fp); say(['red', fp.id, vp ? vp.id : 0], 'card', sideK); }
      else if (card < 0.17 * fs.agg) {
        if (fs.yel.includes(fp.id)) { sendOff(fs, fp, true); say(['y2', fp.id, fs.tid, fs.xi.filter(x => x != null).length], 'card', sideK); }
        else { fs.yel.push(fp.id); say(['yel', tpl('foul'), fp.id, vp ? vp.id : 0], 'card', sideK); }
      } else if (talk && Math.random() < 0.5) say(['foul', tpl('foul'), fp.id, vp ? vp.id : 0], '', sideK);
    } else if (r < 0.26 + foulP + 0.004) {
      const sd = Math.random() < 0.5 ? h : a, ip = pickP(S, sd, 'any'); if (!ip) return;
      sd.inj.push(ip.id);
      say(['inj', ip.id], 'card', sd === h ? 'h' : 'a');
      const i = sd.xi.indexOf(ip.id);
      if (!autoSub(S, sd, i, talk ? say : null)) sd.xi[i] = null;
    } else if (talk && Math.random() < 0.1) {
      const sd = Math.random() < 0.5 ? h : a, fp = pickP(S, Math.random() < 0.5 ? h : a, 'any');
      say(['fill', tpl('fill'), sd.tid, fp ? fp.id : 0]);
    }
    // the computer's substitutions (and the auto-pilot's)
    [h, a].forEach(sd => {
      if ((sd.user && !sd.auto) || sd.subs >= 3 || !(min === 60 || min === 70 || min === 80)) return;
      let worst = -1, wc = 72;
      sd.xi.forEach((id, i) => { if (id != null && i > 0 && S.P[id] && S.P[id].cond < wc) { wc = S.P[id].cond; worst = i; } });
      if (worst >= 0) autoSub(S, sd, worst, talk ? say : null);
    });
    function sendOff(sd, p, two) { sd.reds.push([p.id, two ? 1 : 3]); const i = sd.xi.indexOf(p.id); if (i >= 0) sd.xi[i] = null; }
  }
  function autoSub(S, sd, i, say) {
    if (sd.subs >= 3 || !sd.bench.length || i < 0) return false;
    const slot = FORMS[sd.form][i];
    const best = sd.bench.slice().sort((x, y) => fit(S.P[y], slot) - fit(S.P[x], slot))[0];
    const off = sd.xi[i] != null ? S.P[sd.xi[i]] : null;
    sd.xi[i] = best; sd.bench = sd.bench.filter(x => x !== best); sd.subs++; if (!sd.played.includes(best)) sd.played.push(best);
    if (say) say(['sub', sd.tid, best, off ? off.id : 0], 'sub');
    return true;
  }
  // penalties: { win: 'h'|'a', score: '4-3', hs, as, kicks: [[pid, tid, scored, missTpl]] }
  function shootout(S, M) {
    const kicks = []; let hs = 0, as = 0;
    const takers = sd => { const l = sd.xi.filter(x => x != null && S.P[x]).map(id => S.P[id]).sort((x, y) => y.a[7] - x.a[7]); return l.length ? l : sd.played.map(id => S.P[id]).filter(Boolean); };
    const th = takers(M.h), ta = takers(M.a);
    for (let k = 0; k < 20; k++) {
      for (const [sd, list] of [[M.h, th], [M.a, ta]]) {
        const kp = S.P[(sd === M.h ? M.a : M.h).xi[0]], robo = kp && kp.robot ? 0.18 : 0; // (the robot keeper has a tractor beam)
        const p = list[k % list.length], sc = Math.random() < 0.62 + p.a[7] * 0.012 - robo;
        if (sd === M.h) hs += sc; else as += sc;
        kicks.push([p.id, sd.tid, sc ? 1 : 0, tpl('miss')]);
      }
      if (k >= 4 && hs !== as) break;
      if (k < 4) { const left = 4 - k; if (hs > as + left || as > hs + left) break; }
    }
    return { win: hs > as ? 'h' : 'a', score: hs + '-' + as, hs, as, kicks };
  }
  // apply a finished match to the world
  function finish(S, M) {
    const f = M.fx; f.hs = M.h.goals; f.as = M.a.goals; f.done = true;
    if (f.c === 'C' && f.hs === f.as) { const p = shootout(S, M); f.pen = p.win; f.ps = p.score; M.pens = p; }
    const home = S.T[f.h];
    f.att = Math.round(home.cap * clamp(0.45 + home.rep * 0.027 + (f.c === 'C' ? 0.08 : 0) + Math.random() * 0.06, 0.3, 1));
    M.rat = {};
    [[M.h, M.a], [M.a, M.h]].forEach(([sd, op]) => {
      const res = sd.goals > op.goals ? 1 : sd.goals < op.goals ? -1 : 0;
      const team = S.T[sd.tid];
      team.pl.forEach(id => { const p = S.P[id]; if (p.ban > 0 && !sd.played.includes(id)) p.ban--; });
      sd.played.forEach(id => {
        const p = S.P[id]; if (!p) return;
        const g = sd.sc[id] || 0;
        let r = 6.3 + res * 0.6 + g * 1 + (Math.random() * 1.8 - 0.8);
        if (p.pos === 'GK' || p.pos === 'D') r += op.goals === 0 ? 0.7 : -0.25 * op.goals;
        if (sd.reds.some(x => x[0] === id)) r -= 2;
        r = clamp(Math.round(r), 3, 10);
        M.rat[id] = r; p.ap++; p.rt += r; p.gl += g; p.fm = (p.fm || []).concat(r).slice(-5);
      });
      team.pl.forEach(id => { const p = S.P[id], pl = sd.played.includes(id); if (res > 0 && Math.random() < (pl ? 0.6 : 0.3)) p.mor = Math.min(5, p.mor + 1); else if (res < 0 && Math.random() < (pl ? 0.5 : 0.25)) p.mor = Math.max(1, p.mor - 1); });
      sd.yel.forEach(id => { const p = S.P[id]; if (sd.reds.some(x => x[0] === id)) return; p.yc++; if (p.yc >= 5) { p.yc = 0; p.ban = 1; if (sd.user) addMsg(S, 'Assistant Manager', p.l + ' suspended', `${pname(p)} has picked up five yellow cards and will miss the next match.`); } });
      sd.reds.forEach(([id, n]) => { const p = S.P[id]; p.ban = n; if (sd.user) addMsg(S, 'Assistant Manager', p.l + ' suspended', `${pname(p)} was sent off and is suspended for ${n} match${n > 1 ? 'es' : ''}.`); });
      sd.inj.forEach(id => { const p = S.P[id]; p.inj = ri(Math.random, 4, 30); if (sd.user) addMsg(S, 'Club Physio', p.l + ' injured', `${pname(p)} picked up a knock and will be out for about ${p.inj > 13 ? Math.round(p.inj / 7) + ' weeks' : p.inj + ' days'}.\n\nHe says it's "a bit sore". He also says he could play through it. He can't. I've hidden his boots.`); });
    });
    if (f.h === S.me) { const g = f.att * 14; S.bal += g; S.fin.gate += g; }
    let best = null, bv = -1; for (const id in M.rat) { if (M.rat[id] > bv) { bv = M.rat[id]; best = +id; } } M.motm = best;
  }
  function table(S) {
    const rows = S.T.map(t => ({ id: t.id, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0, form: [] }));
    S.fx.filter(f => f.c === 'L' && f.done).sort((x, y) => x.day - y.day).forEach(f => {
      const H = rows[f.h], A = rows[f.a];
      H.p++; A.p++; H.f += f.hs; H.a += f.as; A.f += f.as; A.a += f.hs;
      if (f.hs > f.as) { H.w++; A.l++; H.pts += 3; H.form.push('W'); A.form.push('L'); }
      else if (f.hs < f.as) { A.w++; H.l++; A.pts += 3; A.form.push('W'); H.form.push('L'); }
      else { H.d++; A.d++; H.pts++; A.pts++; H.form.push('D'); A.form.push('D'); }
    });
    return rows.sort((x, y) => y.pts - x.pts || (y.f - y.a) - (x.f - x.a) || y.f - x.f || S.T[x.id].n.localeCompare(S.T[y.id].n));
  }
  const posOf = (S, tid) => table(S).findIndex(r => r.id === tid) + 1;
  function moveTo(S, p, tid) {
    const old = S.T[p.t];
    old.pl = old.pl.filter(x => x !== p.id); S.T[tid].pl.push(p.id); p.t = tid; p.tl = false;
    if (old.id !== S.me) refill(S, old);
    if (S.sel) S.sel = S.sel.map(x => x === p.id ? null : x);
  }
  function refill(S, team, quiet) {
    while (team.pl.length < 17) {
      if (team.id === S.me && S.yth && S.yth.length) {
        const y = S.yth.sort((x, z) => rat(z) - rat(x)).shift(); promote(S, y);
        if (!quiet) addMsg(S, 'Youth Team Coach', 'Youth team call-up', `With the squad looking a bit thin, I've promoted ${pname(y)} (${posStr(y)}, ${y.age}) from the youth team.\n\nHe's very keen. He calls everyone "sir". Even the tea lady.`);
        continue;
      }
      const need = ['GK', 'D', 'M', 'F'].map(ps => [ps, team.pl.filter(id => S.P[id].pos === ps).length]).sort((x, y) => x[1] / ({ GK: 2, D: 7, M: 7, F: 4 }[x[0]]) - y[1] / ({ GK: 2, D: 7, M: 7, F: 4 }[y[0]]))[0][0];
      const p = genPlayer(S, Math.random, team, need, need === 'GK' ? 'C' : rnd(['C', 'L', 'R']), 0, team.rep - 3 + ri(Math.random, -1, 2), 17);
      if (team.id === S.me && !quiet) addMsg(S, 'Youth Team Coach', 'Youth team call-up', `With the squad looking a bit thin, I've promoted ${pname(p)} (${posStr(p)}, 17) from the youth team.\n\nHe's very keen. He calls everyone "sir". Even the tea lady.`);
    }
  }

  // ---- days go by
  const MATES = [
    [dayOf(1999, 8, 2), 'Callum', 'tactics tips', 'Jack,\n\n4-3-3. Attacking. Buy every striker. Works for me every time.\n\nAlso you HAVE to put the youth team kid up front, they always turn out amazing.\n\n- Callum\n\nP.S. Don\'t ring after 9, Mom gets annoyed.'],
    [dayOf(1999, 8, 20), 'Dave', 'footy', 'Why are you playing a football game where you don\'t even get to kick the ball??\n\nCome round and play footy on my ULTRA 64 instead. Luke\'s bringing crisps. Four players!!!\n\nDave'],
    [dayOf(1999, 9, 10), 'Luke', 're: footy', 'Dave says you\'re "managing" now. My nan manages. She manages the bingo.\n\nCome round Saturday, we\'re doing a four player tournament on the ULTRA 64. Bring your own controller, the grey one\'s got a wobbly stick.\n\nLuke'],
    [dayOf(1999, 10, 14), 'JackK', 'Gubbinz Town', 'I took the Gubbinz Town job for a laugh and lost 7-0. Their keeper is LITERALLY A ROBOT.\n\nHe saved a penalty with a tractor beam.\n\nIs that allowed?\n\n- JackK'],
    [dayOf(1999, 11, 5), 'Mom', 'Fireworks', 'Jack,\n\nThe fireworks are at 7. Not "after this match". At 7.\n\nWrap up warm.\n\nMom x'],
    [dayOf(1999, 12, 1), 'Callum', 'Christmas list', 'Jack,\n\nThe full version comes out in a few days. Put it on your Christmas list. Put it at the TOP. Above socks.\n\nThe demo stops at New Year. I know. I cried.\n\n- Callum'],
    [dayOf(1999, 12, 24), 'Gubbinz', 'MERRY CHRISTMAS BOSS', 'MERRY CHRISTMAS BOSS.\n\nIT LOOKS LIKE YOU ARE PICKING A TEAM! I ATE THE TEAM SHEET. SORRY.\n\nALSO THE MINCE PIES.\n\nALSO A BIT OF THE TREE.\n\n- GUBBINZ'],
    [dayOf(2000, 1, 1), 'Sports Jackteractive', 'IMPORTANT: Millennium notice', 'Dear Manager,\n\nCongratulations on reaching the new year!\n\nChampionship Boss 99/00 is mostly Year 2000 compliant. The date will now be shown as 19100. This is normal. Please do not panic. Please do not ring the helpline. The helpline is also showing 19100.\n\nSports Jackteractive Customer Care'],
    [dayOf(2000, 2, 2), 'Dave', 'still?', 'Are you STILL managing?? Luke has finished his game TWICE since you started.\n\nDave'],
    [dayOf(2000, 3, 20), 'Callum', 'my career', 'How\'s my Jackport save going? You didn\'t sell anybody did you.\n\nDid you.\n\n- Callum'],
  ];
  const NEWS = [
    c => `${c.t.n} striker ${c.p} fined two weeks' wages for turning up to training in slippers.`,
    c => `${c.t.n} chairman ${c.t.ch} promises fans "a brand new pie stand by Christmas".`,
    c => `A runaway Furby rolled onto the pitch at ${c.t.gr} and refused to leave for twenty minutes.`,
    c => `Floodlight failure at ${c.t.gr}: "someone plugged a kettle in," says groundsman.`,
    c => `${c.t.n} unveil their new away kit. It's brown. Nobody knows why.`,
    c => `${c.p} (${c.t.sh}) has been named Premier Jack League Player of the Month.`,
    c => `RUMOUR: ${c.u.n} are keeping an eye on ${c.p} (${c.t.sh}).`,
    c => `${c.t.n} mascot "Jacko the Lion" suspended for doing the robot during a minute's applause.`,
    c => `${c.p} (${c.t.sh}) says he is "over the moon" and "sick as a parrot", sometimes on the same day.`,
    c => `${c.t.n} manager ${c.t.mgr} denies he fell asleep during last week's match. "I was thinking."`,
  ];
  function daily(S, quiet, onEvt) {
    const d = dateOf(S.day), wd = d.getUTCDay(), md = d.getUTCDate();
    for (const id in S.P) {
      const p = S.P[id];
      if (p.cond < 100) p.cond = Math.min(100, p.cond + 3 + p.a[9] * 0.15);
      if (p.inj > 0) { p.inj--; if (!p.inj && p.t === S.me && !quiet) addMsg(S, 'Club Physio', p.l + ' fit again', `${pname(p)} has recovered from his injury and is available for selection.`); }
      if (p.mor !== 3 && Math.random() < 0.02) p.mor += p.mor > 3 ? -1 : 1;
    }
    if (wd === 5) { const bill = S.T[S.me].pl.reduce((t, id) => t + S.P[id].wage, 0); S.bal -= bill; S.fin.wages += bill; S.hist.push(S.bal); if (S.hist.length > 52) S.hist.shift(); }
    if (md === 1) {
      const tv = 150000 + S.T[S.me].rep * 12000; S.bal += tv; S.fin.tv += tv;
      if (!quiet && S.day > 5) addMsg(S, S.T[S.me].ch + ' (Chairman)', 'Board update', boardText(S));
      if (S.day > 5) {
        const gains = develop(S), kids = gains.filter(p => p.age <= 21);
        if (!quiet && kids.length) addMsg(S, 'Youth Team Coach', 'Coaching report', `Gaffer,\n\nThe extra shooting practice is paying off. These young lads have got better this month:\n\n${kids.slice(0, 6).map(p => `${pname(p)} (${p.t === -1 ? 'youth team' : 'first team'}, ${p.age}): now rated ${Math.round(rat(p))}`).join('\n')}\n\nPlaying matches helps them most.`);
      }
      if (d.getUTCMonth() === 2) { // 1 March: youth intake day, and contracts running out
        if (!quiet) youthIntake(S, Math.random, 3);
        const exp = S.T[S.me].pl.map(id => S.P[id]).filter(p => p.con <= 1);
        if (!quiet && exp.length) addMsg(S, TEL, 'Contracts running out', `Gaffer,\n\nThese lads' contracts run out in the summer:\n\n${exp.map(p => `${pname(p)} (${posStr(p)}, ${p.age})`).join('\n')}\n\nIf you want to keep any of them, open their player page and offer a new contract. Otherwise they'll walk out the door on a free. ${exp.some(p => p.age >= 32) ? 'Some of the old boys might retire anyway.' : ''}`, null, true);
      }
    }
    if ((S.season || 1) === 1) MATES.forEach(m => { if (m[0] === S.day) addMsg(S, m[1], m[2], m[3], null, true); });
    if (quiet) return;
    // replies to our bids
    S.offers.filter(o => o.day < S.day).forEach(o => {
      S.offers = S.offers.filter(x => x !== o);
      const p = S.P[o.pid]; if (!p || p.t === S.me) return;
      const club = S.T[p.t], starter = autoPick(S, club, club.form).slice(0, 11).includes(p.id);
      const want = p.val * (1 + (starter ? 0.25 : 0) - (p.tl ? 0.25 : 0)) * (0.92 + Math.random() * 0.2);
      if (o.fee >= want) addMsg(S, club.n, 'Bid accepted: ' + pname(p), `${club.n} have accepted your offer of ${money(o.fee)} for ${pname(p)}.\n\nYou may now discuss personal terms with the player.`, { type: 'deal', pid: p.id, fee: o.fee }, true);
      else if (o.fee >= want * 0.72) { const c = Math.round(want / 25000) * 25000 + 25000; addMsg(S, club.n, 'Bid rejected: ' + pname(p), `${club.n} have rejected your offer of ${money(o.fee)} for ${pname(p)}.\n\nThey have indicated that they would accept ${money(c)}.`, { type: 'counter', pid: p.id, fee: c }, true); }
      else addMsg(S, club.n, 'Bid rejected: ' + pname(p), `${club.n} have rejected your offer of ${money(o.fee)} for ${pname(p)}.\n\nTheir chairman, ${club.ch}, laughed so hard he had to have a sit down.`, null, true);
    });
    // other clubs want our players
    const mine = S.T[S.me].pl.map(id => S.P[id]);
    if (mine.length > 16 && Math.random() < 0.022 + (mine.some(p => p.tl) ? 0.05 : 0) && !S.msgs.some(m => m.act && m.act.type === 'bid' && !m.act.done)) {
      const listed = mine.filter(p => p.tl), p = listed.length && Math.random() < 0.75 ? rnd(listed) : rnd(mine.filter(x => rat(x) > 8) .concat(mine).slice(0, 30));
      const buyer = rnd(S.T.filter(t => t.id !== S.me && t.rep >= S.T[S.me].rep - 4));
      const fee = Math.round(p.val * (p.tl ? 0.7 + Math.random() * 0.4 : 0.9 + Math.random() * 0.45) / 25000) * 25000 || 25000;
      addMsg(S, buyer.n, 'Offer for ' + pname(p), `${buyer.n} have made an offer of ${money(fee)} for ${pname(p)} (${posStr(p)}, ${p.age}).\n\nHis value is ${money(p.val)}.${p.tl ? '\n\n(He is on the transfer list.)' : '\n\nHe\'s not for sale, but they asked anyway.'}`, { type: 'bid', pid: p.id, from: buyer.id, fee }, true);
    }
    if (Math.random() < 0.14) {
      const t = rnd(S.T.filter(x => x.id !== S.me)), u = rnd(S.T.filter(x => x.id !== t.id)), p = S.P[rnd(t.pl)];
      news(S, rnd(NEWS)({ t, u, p: pname(p) }));
    }
  }
  function boardText(S) {
    const pos = posOf(S, S.me), ex = expRank(S, S.me), c = S.conf;
    const mood = c >= 85 ? 'absolutely delighted' : c >= 65 ? 'pleased' : c >= 45 ? 'satisfied' : c >= 25 ? 'concerned' : 'very worried';
    return `Dear ${S.mgr},\n\nThe board have met to discuss the club's progress.\n\nWe are currently ${ord(pos)} in the Premier Jack League. Our target is to ${expText(ex)}.\n\nThe board are ${mood} with your performance so far.\n\nBank balance: ${money(S.bal)}.\n\n${c < 25 ? 'Results must improve. Quickly. I am not saying your job is at risk. I am just saying I have been looking at other managers in the newspaper.' : 'Keep up the good work. And please return the board room biscuits.'}\n\n${S.T[S.me].ch}`;
  }
  // after every match day: cup draws, the board
  const DIFFK = [0.6, 1, 1.45], DIFFN = ['Patient', 'Normal', 'Ruthless'];
  const cupWon = f => (f.hs > f.as || (f.hs === f.as && f.pen === 'h') ? 'h' : 'a');
  function afterFixtures(S, quiet) {
    const day = S.day, fx = S.fx.filter(f => f.day === day);
    if (fx.some(f => f.c === 'L') && fx.some(f => f.c === 'L' && (f.h === S.me || f.a === S.me))) {
      const pos = posOf(S, S.me), ex = expRank(S, S.me), mf = fx.find(f => f.c === 'L' && (f.h === S.me || f.a === S.me));
      const my = mf.h === S.me ? mf.hs : mf.as, th = mf.h === S.me ? mf.as : mf.hs;
      const dc = (ex - pos) * 0.35 + (my > th ? 2.5 : my < th ? -3 : 0);
      S.conf = clamp(S.conf + (dc < 0 ? dc * DIFFK[S.diff == null ? 1 : S.diff] : dc), 0, 100);
      S.lpos = pos;
    }
    const cupFx = fx.filter(f => f.c === 'C');
    const myCup = cupFx.find(f => f.h === S.me || f.a === S.me);
    if (myCup) {
      const home = myCup.h === S.me, op = S.T[home ? myCup.a : myCup.h], won = home ? cupWon(myCup) === 'h' : cupWon(myCup) === 'a';
      const gap = op.rep - S.T[S.me].rep;
      S.conf = clamp(S.conf + (won ? 2 + (gap >= 3 ? 3 : 0) : gap <= -3 ? -6 : -2), 0, 100);
    }
    if (!quiet && S.conf < 20 && !S.sackWarn && S.played >= 4) {
      S.sackWarn = 1;
      addMsg(S, S.T[S.me].ch + ' (Chairman)', 'A vote of confidence', `Dear ${S.mgr},\n\nI would like to say, publicly, that you have the full backing of the board.\n\n(In football, this is a bad sign.)\n\nResults must improve. If the board's confidence hits rock bottom, you will be looking for a new job.\n\n${S.T[S.me].ch}`, null, true);
    }
    if (S.conf >= 35) S.sackWarn = 0;
    if (cupFx.length) {
      const rd = cupFx[0].rd;
      const winners = S.fx.filter(f => f.c === 'C' && f.rd === rd).map(f => (cupWon(f) === 'h' ? f.h : f.a));
      if (rd < 3) {
        cupDraw(S, shuffle(Math.random, winners), rd + 1);
        if (!quiet) news(S, `Jack Cup ${CUPRD[rd + 1]} draw: ` + S.fx.filter(f => f.c === 'C' && f.rd === rd + 1).map(f => S.T[f.h].sh + ' v ' + S.T[f.a].sh).join(', ') + '.');
        if (!quiet && winners.includes(S.me)) { const nf = S.fx.find(f => f.c === 'C' && f.rd === rd + 1 && (f.h === S.me || f.a === S.me)); const op = S.T[nf.h === S.me ? nf.a : nf.h]; addMsg(S, 'Jack Cup', CUPRD[rd + 1] + ' draw', `The draw for the Jack Cup ${CUPRD[rd + 1]} has been made.\n\n${S.T[nf.h].n} v ${S.T[nf.a].n}\n\nto be played on ${fmtDate(nf.day)}${rd + 1 === 3 ? ' at the national stadium, Jackbley' : ''}.\n\n${rd + 1 === 3 ? 'A CUP FINAL! Mom says you can stay up for this one.' : 'You\'ll play ' + op.n + '.'}`, null, true); }
      } else { S.cupWin = winners[0]; if (!quiet) news(S, `${S.T[winners[0]].n} win the Jack Cup!`); }
    }
  }
  function autoAdvance(S, toDay) {
    while (S.day < toDay) {
      S.day++; daily(S, true);
      const fx = todays(S);
      if (fx.length) { fx.forEach(f => { const M = newMatch(S, f); for (let i = 0; i < 90; i++) stepMin(S, M, false); finish(S, M); }); afterFixtures(S, true); }
    }
  }

  // ================================================================ looks
  const CSS = `
.dg-boss{position:absolute;inset:0;display:flex;flex-direction:column;background:#24396b;color:#000;font:11px/1.35 Tahoma,Verdana,Arial,sans-serif;touch-action:manipulation;overflow:hidden;text-align:left}
.dg-boss *{box-sizing:border-box}
.dg-boss-btn{font:bold 11px Tahoma,Arial,sans-serif;background:#d4d0c8;color:#000;border:2px solid;border-color:#fff #404040 #404040 #fff;padding:4px 10px;min-height:26px;cursor:pointer;touch-action:manipulation}
.dg-boss-btn:active,.dg-boss-btn.on{border-color:#404040 #fff #fff #404040;background:#b8b4ac}
.dg-boss-btn.on{background:#0a246a;color:#fff}
.dg-boss-btn.go{background:linear-gradient(#5fd05f,#1a8a1a);color:#fff;text-shadow:1px 1px #000;border-color:#bfb #050 #050 #bfb}
.dg-boss-btn.red{background:linear-gradient(#e85050,#9a0a0a);color:#fff;text-shadow:1px 1px #000;border-color:#fbb #500 #500 #fbb}
.dg-boss-btn:disabled{color:#888;text-shadow:none}
.dg-boss-bdg{display:inline-block;width:14px;height:17px;flex:none;vertical-align:-4px;clip-path:polygon(0 0,100% 0,100% 62%,50% 100%,0 62%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.55);margin-right:3px}
.dg-boss-bdg.big{width:30px;height:36px;box-shadow:inset 0 0 0 2px rgba(0,0,0,.6)}
.dg-boss-top{display:flex;align-items:center;gap:8px;padding:4px 8px;background:linear-gradient(#0a1f5c,#1d3a8a);color:#fff;border-bottom:2px solid #000;flex:none;min-height:40px}
.dg-boss-top .club{font:bold 15px Arial,sans-serif;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px #000}
.dg-boss-top .club small{display:block;font:11px Tahoma,sans-serif;color:#9cf;text-shadow:none}
.dg-boss-top .meta{text-align:right;font:bold 11px Tahoma,sans-serif;white-space:nowrap;line-height:1.4}
.dg-boss-top .meta span{color:#ffd400}
.dg-boss-body{flex:1;display:flex;min-height:0}
.dg-boss-nav{width:126px;flex:none;background:#b8c0d4;border-right:2px solid #000;display:flex;flex-direction:column;padding:4px;gap:3px;overflow:auto}
.dg-boss-nav .dg-boss-btn{text-align:left;width:100%;padding:5px 6px;position:relative}
.dg-boss-nav .dg-boss-btn i{font-style:normal;position:absolute;right:4px;top:5px;background:#e10600;color:#fff;border-radius:7px;padding:0 4px;font-size:9px}
.dg-boss-main{flex:1;min-width:0;overflow:auto;background:#dfe5f0;padding:6px;touch-action:pan-y;-webkit-overflow-scrolling:touch}
.dg-boss-bot{display:flex;align-items:center;gap:8px;padding:4px 6px;background:#0a1f5c;flex:none;border-top:2px solid #000}
.dg-boss-tick{flex:1;min-width:0;overflow:hidden;white-space:nowrap;color:#ffe066;font:bold 11px "Courier New",monospace;position:relative;height:16px}
.dg-boss-tick span{position:absolute;left:0;top:0;padding-left:100%;animation:dgbosstick 38s linear infinite}
@keyframes dgbosstick{to{transform:translateX(-100%)}}
.dg-boss-cont{font-size:14px!important;padding:6px 20px!important;min-height:34px!important}
.dg-boss h2{margin:0 0 6px;font:bold 13px Arial,sans-serif;color:#fff;background:linear-gradient(90deg,#0a246a,#3a6ea5);padding:4px 8px;display:flex;align-items:center;gap:6px}
.dg-boss h2 .sp{flex:1}
.dg-boss h3{margin:8px 0 4px;font:bold 11px Tahoma,sans-serif;color:#0a246a;border-bottom:1px solid #0a246a}
.dg-boss-t{width:100%;border-collapse:collapse;background:#fff;font-size:11px;border:1px solid #808080}
.dg-boss-t th{background:#c0c8d8;text-align:left;padding:3px 4px;border-bottom:1px solid #808080;white-space:nowrap;font-weight:bold;cursor:default}
.dg-boss-t th[data-a]{cursor:pointer;text-decoration:underline dotted}
.dg-boss-t td{padding:3px 4px;border-bottom:1px solid #e0e4ec;white-space:nowrap}
.dg-boss-t tr:nth-child(even) td{background:#f1f4fa}
.dg-boss-t tr[data-a]{cursor:pointer}
.dg-boss-t tr[data-a]:active td{background:#0a246a;color:#fff}
.dg-boss-t tr.me td{background:#fff6b0;font-weight:bold}
.dg-boss-t tr.top td:first-child{box-shadow:inset 3px 0 #1a8a1a}
.dg-boss-t tr.rel td:first-child{box-shadow:inset 3px 0 #c00}
.dg-boss-t td.n{text-align:right}
.dg-boss-t .un td{font-weight:bold}
.dg-boss-t tr.sel td{background:#0a246a!important;color:#fff}
.dg-boss .W{color:#0a8a0a;font-weight:bold}.dg-boss .L{color:#c00;font-weight:bold}.dg-boss .Dr{color:#a07000;font-weight:bold}
.dg-boss .v1{color:#c00}.dg-boss .v2{color:#a05a00}.dg-boss .v3{color:#00701a}.dg-boss .v4{color:#0040c0;font-weight:bold}
.dg-boss .tag{display:inline-block;font:bold 9px Tahoma,sans-serif;padding:0 3px;border:1px solid;margin-left:2px}
.dg-boss .tag.xi{color:#0a6a0a}.dg-boss .tag.sub{color:#555}.dg-boss .tag.inj{color:#fff;background:#c00;border-color:#c00}.dg-boss .tag.ban{color:#fff;background:#000}.dg-boss .tag.tl{color:#a05a00}
.dg-boss-panel{background:#f4f6fb;border:1px solid #808080;padding:6px 8px;margin-bottom:6px}
.dg-boss-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0}
.dg-boss-msgs{max-height:190px;overflow:auto;border:1px solid #808080;margin-bottom:6px;background:#fff}
.dg-boss-msg{background:#fff;border:1px solid #808080;padding:8px 10px;white-space:pre-line;font:12px/1.45 Tahoma,sans-serif}
.dg-boss-msg .hd{border-bottom:1px solid #c0c0c0;margin:-2px 0 8px;padding-bottom:4px;white-space:normal;color:#444}
.dg-boss-msg .hd b{color:#000}
.dg-boss-attr{display:grid;grid-template-columns:1fr 1fr;gap:1px 14px;background:#fff;border:1px solid #808080;padding:6px 8px}
.dg-boss-attr div{display:flex;justify-content:space-between;border-bottom:1px dotted #ccd}
.dg-boss-attr b{font:bold 13px "Courier New",monospace}
.dg-boss-tac{display:grid;grid-template-columns:minmax(200px,1fr) 1.2fr;gap:8px;align-items:start}
.dg-boss-pitch{position:relative;width:100%;aspect-ratio:68/92;background:repeating-linear-gradient(0deg,#2f8f2f 0 8.33%,#2a822a 8.33% 16.66%);border:2px solid #fff;outline:2px solid #1a5a1a;overflow:hidden}
.dg-boss-pitch::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:2px solid rgba(255,255,255,.75)}
.dg-boss-pitch::after{content:"";position:absolute;left:50%;top:50%;width:26%;aspect-ratio:1;border:2px solid rgba(255,255,255,.75);border-radius:50%;transform:translate(-50%,-50%)}
.dg-boss-pitch .box{position:absolute;left:22%;right:22%;height:15%;border:2px solid rgba(255,255,255,.75)}
.dg-boss-pitch .box.t{top:-2px}.dg-boss-pitch .box.b{bottom:-2px}
.dg-boss-tok{position:absolute;transform:translate(-50%,-50%);width:72px;text-align:center;font:bold 10px/1.1 Arial,sans-serif;color:#fff;text-shadow:1px 1px 0 #000,-1px 0 #000;cursor:pointer;z-index:1}
.dg-boss-tok .sh{width:22px;height:22px;margin:0 auto 2px;border-radius:4px 4px 2px 2px;border:2px solid #fff;box-shadow:0 0 0 2px #0a0;clip-path:none}
.dg-boss-tok.f1 .sh{box-shadow:0 0 0 2px #ff0}.dg-boss-tok.f2 .sh{box-shadow:0 0 0 2px #f22}
.dg-boss-tok.sel .sh{outline:3px solid #fff;outline-offset:2px;animation:dgbossblink .5s infinite alternate}
.dg-boss-tok .em{opacity:.6}
@keyframes dgbossblink{to{outline-color:#ff0}}
.dg-boss-ov{position:absolute;inset:0;z-index:20;background:rgba(0,0,30,.55);display:flex;align-items:center;justify-content:center;padding:10px}
.dg-boss-dlg{background:#d4d0c8;border:2px solid;border-color:#fff #404040 #404040 #fff;min-width:250px;max-width:min(460px,96%);max-height:94%;display:flex;flex-direction:column;box-shadow:4px 4px 0 rgba(0,0,0,.5)}
.dg-boss-dt{background:linear-gradient(90deg,#0a246a,#3a6ea5);color:#fff;font:bold 11px Tahoma,sans-serif;padding:3px 6px;flex:none}
.dg-boss-dc{padding:10px;overflow:auto;white-space:normal;font:12px/1.45 Tahoma,sans-serif;min-height:0}
.dg-boss-db{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;padding:0 10px 10px;flex:none}
.dg-boss-mom{background:#fff27a;color:#222;font:16px/1.35 "Comic Sans MS","Chalkboard SE",cursive;padding:18px 18px 12px;max-width:min(330px,92%);transform:rotate(-2deg);box-shadow:3px 6px 14px rgba(0,0,0,.6);border-top:16px solid #f5e04a}
.dg-boss-mom b{font-size:20px;display:block;margin-bottom:6px}
.dg-boss-mom .dg-boss-db{padding:10px 0 0;justify-content:center}
.dg-boss-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#fff;text-align:center;padding:14px;overflow:hidden;
background:radial-gradient(circle at 12% 6%,rgba(255,255,210,.55),transparent 16%),radial-gradient(circle at 88% 6%,rgba(255,255,210,.55),transparent 16%),linear-gradient(transparent 70%,rgba(0,0,0,.35) 70%,transparent 72%),repeating-linear-gradient(90deg,#226e22 0 50px,#2a7c2a 50px 100px) 0 100%/100% 30% no-repeat,linear-gradient(#020818,#0a1f5c 72%)}
.dg-boss-title .lights{position:absolute;top:8px;left:0;right:0;display:flex;justify-content:space-between;padding:0 6%}
.dg-boss-title .lights i{display:grid;grid-template-columns:repeat(4,7px);gap:2px}
.dg-boss-title .lights i::before{content:"";grid-column:1/-1;height:16px;background:repeating-linear-gradient(90deg,#fffbe0 0 7px,transparent 7px 9px);box-shadow:0 0 18px 6px rgba(255,255,200,.35)}
.dg-boss-logo .l1{font:bold 11px Arial,sans-serif;letter-spacing:4px;color:#9cf}
.dg-boss-logo .l2{font:italic 900 30px/1 Impact,"Arial Black",sans-serif;letter-spacing:3px;color:#fff;text-shadow:3px 3px 0 #0a246a,5px 5px 0 #000;margin-top:6px}
.dg-boss-logo .l3{font:italic 900 78px/0.95 Impact,"Arial Black",sans-serif;color:#ffd400;text-shadow:4px 4px 0 #c8102e,8px 8px 0 #000;letter-spacing:5px}
.dg-boss-logo .l4{display:inline-block;margin-top:8px;font:bold 16px "Courier New",monospace;background:#c8102e;color:#fff;padding:2px 14px;border:2px solid #fff;transform:skew(-10deg)}
.dg-boss-logo svg{vertical-align:middle}
.dg-boss-menu{display:flex;flex-direction:column;gap:6px;width:min(240px,80%);z-index:1}
.dg-boss-menu .dg-boss-btn{font-size:13px;padding:8px}
.dg-boss-demo{position:absolute;top:22px;right:-40px;transform:rotate(35deg);background:#e10600;color:#fff;font:bold 15px Arial,sans-serif;padding:4px 48px;border:2px solid #fff;box-shadow:0 2px 6px #000;letter-spacing:2px}
.dg-boss-foot{font:10px Tahoma,sans-serif;color:#cfd8ff;text-shadow:1px 1px #000;z-index:1}
.dg-boss-load{position:absolute;inset:0;z-index:30;background:#0a1f5c;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:12px Tahoma,sans-serif;padding:20px;text-align:center}
.dg-boss-load .bar{width:min(300px,80%);height:18px;border:2px inset #fff;background:#fff;padding:2px}
.dg-boss-load .bar i{display:block;height:100%;width:0;background:repeating-linear-gradient(90deg,#0a246a 0 9px,#fff 9px 11px)}
.dg-boss-match{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:#0d2a12;color:#fff}
.dg-boss-sb{display:grid;grid-template-columns:1fr auto 1fr auto;align-items:center;gap:8px;padding:6px 10px;background:linear-gradient(#202020,#3a3a3a);border-bottom:2px solid #000;font:bold 14px Arial,sans-serif;flex:none}
.dg-boss-sb .tm{display:flex;align-items:center;gap:4px;min-width:0;white-space:nowrap;overflow:hidden}
.dg-boss-sb .tm.a{justify-content:flex-end}
.dg-boss-sb .tm span{overflow:hidden;text-overflow:ellipsis}
.dg-boss-sb .sc{font:bold 26px "Courier New",monospace;color:#ffd400;background:#000;padding:0 10px;border:2px inset #555;letter-spacing:2px}
.dg-boss-sb .clk{font:bold 16px "Courier New",monospace;color:#7f7;background:#000;padding:2px 8px;border:2px inset #555;min-width:58px;text-align:center}
.dg-boss-com{flex:none;min-height:78px;display:flex;align-items:center;justify-content:center;text-align:center;padding:10px 14px;background:linear-gradient(#1a5a1a,#0f3f12);border-bottom:2px solid #000;font:bold 17px/1.25 Arial,sans-serif;text-shadow:2px 2px 0 #000}
.dg-boss-com.goal{background:linear-gradient(#c8961b,#6a4400);color:#fff200;animation:dgbossflash .2s 6 alternate}
.dg-boss-com.card{background:linear-gradient(#7a1a1a,#3a0a0a)}
@keyframes dgbossflash{to{filter:brightness(1.7)}}
.dg-boss-mtabs{display:none;gap:2px;padding:4px 4px 0;flex:none}
.dg-boss-mtabs .dg-boss-btn{flex:1;padding:4px 2px}
.dg-boss-mp{flex:1;min-height:0;display:grid;grid-template-columns:1.45fr 1fr 1fr;gap:4px;padding:4px}
.dg-boss-pane{background:#e8ecf4;color:#000;overflow:auto;border:2px inset #fff;min-height:0;touch-action:pan-y}
.dg-boss-pane .ph{background:#c0c8d8;font-weight:bold;padding:2px 4px;position:sticky;top:0}
.dg-boss-ev{padding:2px 4px;border-bottom:1px solid #d0d6e4}
.dg-boss-ev b{display:inline-block;width:28px;color:#0a246a}
.dg-boss-ev.goal{background:#fff3a0;font-weight:bold}.dg-boss-ev.card{color:#a00}.dg-boss-ev.sub{color:#0a246a}.dg-boss-ev.chance{color:#205020}
.dg-boss-st{display:grid;grid-template-columns:1fr auto 1fr;gap:2px 6px;padding:4px 6px;align-items:center}
.dg-boss-st .l{text-align:right;font-weight:bold}.dg-boss-st .r{font-weight:bold}.dg-boss-st .k{text-align:center;color:#444;font-size:10px}
.dg-boss-pbar{grid-column:1/-1;height:6px;background:#c00;border:1px solid #888;margin-bottom:4px}
.dg-boss-pbar i{display:block;height:100%;background:#0a246a}
.dg-boss-mctl{display:flex;flex-wrap:wrap;gap:4px;padding:4px;background:#c0c0c0;border-top:2px solid #fff;flex:none;align-items:center}
.dg-boss-mctl .lb{color:#000;font-weight:bold;margin-right:2px}
.dg-boss-mctl .sp{flex:1}
.dg-boss-bed{position:absolute;inset:0;z-index:40;background:#000;color:#ccc;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font:14px "Comic Sans MS",cursive;text-align:center;padding:20px}
.dg-boss-bed .crt{position:absolute;inset:0;background:#fff;animation:dgbossoff .5s forwards}
@keyframes dgbossoff{0%{transform:scale(1,1)}60%{transform:scale(1,.004)}100%{transform:scale(0,0)}}
.dg-boss-chart{display:flex;align-items:flex-end;gap:2px;height:90px;background:#fff;border:1px solid #808080;padding:4px}
.dg-boss-chart i{flex:1;background:#0a246a;min-height:1px}
.dg-boss-chart i.neg{background:#c00}
.dg-boss-conf{height:14px;border:2px inset #fff;background:#fff;padding:1px}
.dg-boss-conf i{display:block;height:100%;background:linear-gradient(90deg,#c00,#ffd400 50%,#0a0)}
.dg-boss-sticky{background:#fff27a;font:12px "Comic Sans MS",cursive;padding:4px 8px;transform:rotate(-1.5deg);box-shadow:2px 2px 4px rgba(0,0,0,.4);display:inline-block;color:#222}
.dg-boss-narrow .dg-boss-body{flex-direction:column}
.dg-boss-narrow .dg-boss-nav{width:auto;flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:2px solid #000;overflow:visible;padding:3px;gap:2px}
.dg-boss-narrow .dg-boss-nav .dg-boss-btn{flex:1 0 31%;width:auto;text-align:center;padding:6px 2px;font-size:10px;min-height:30px}
.dg-boss-narrow .hm{display:none}
.dg-boss-narrow .dg-boss-tac{grid-template-columns:1fr}
.dg-boss-narrow .dg-boss-pitch{max-width:330px;margin:0 auto}
.dg-boss-narrow .dg-boss-mtabs{display:flex}
.dg-boss-narrow .dg-boss-mp{grid-template-columns:1fr}
.dg-boss-narrow .dg-boss-pane{display:none}
.dg-boss-narrow .dg-boss-pane.on{display:block}
.dg-boss-narrow .dg-boss-sb{grid-template-columns:1fr auto 1fr;font-size:12px;padding:4px 6px}
.dg-boss-narrow .dg-boss-sb .clk{grid-column:1/-1;justify-self:center;order:-1}
.dg-boss-narrow .dg-boss-com{font-size:15px;min-height:96px}
.dg-boss-narrow .dg-boss-logo .l3{font-size:60px}
.dg-boss-narrow .dg-boss-logo .l2{font-size:24px}
.dg-boss-narrow .dg-boss-top .club{font-size:13px}
.dg-boss-narrow .dg-boss-tick{display:none}
.dg-boss-narrow .dg-boss-bot{justify-content:flex-end}
.dg-boss-narrow .dg-boss-cont{flex:1}
.dg-boss-rp{white-space:nowrap}.dg-boss-rp svg{vertical-align:-1px;margin-right:2px}.dg-boss-rp small{font-size:9px;opacity:.8;margin-left:1px}
.dg-boss-top .brd{display:flex;flex-direction:column;gap:2px;font:bold 9px Tahoma,sans-serif;color:#9cf;width:74px;flex:none;cursor:help}
.dg-boss-top .brd i{display:block;height:7px;background:#000;border:1px solid #6a8ac0}.dg-boss-top .brd u{display:block;height:100%}
.dg-boss-top .club small b{color:#ffd400;font-weight:normal}
.dg-boss .stars{color:#e8a000;letter-spacing:1px;white-space:nowrap}
.dg-boss-tip{background:#fffbe0;border:1px solid #c0a000;padding:4px 6px;margin:4px 0;font-size:11px;color:#000}
.dg-boss-tip b{color:#6a0dad}
.dg-boss-tel{position:absolute;z-index:25;right:8px;bottom:50px;display:flex;align-items:flex-end;gap:4px;max-width:min(440px,calc(100% - 12px));pointer-events:none}
.dg-boss-tel>*{pointer-events:auto}
.dg-boss-tel .face{flex:none;width:58px;height:78px;filter:drop-shadow(2px 2px 0 rgba(0,0,0,.5))}
.dg-boss-tel .bub{background:#fffbe0;border:2px solid #000;border-radius:10px;padding:7px 9px;font:12px/1.4 Tahoma,sans-serif;color:#000;box-shadow:3px 3px 0 rgba(0,0,0,.4);position:relative;margin-bottom:18px}
.dg-boss-tel .bub::before{content:"";position:absolute;left:-12px;bottom:10px;border:6px solid transparent;border-right:8px solid #000}
.dg-boss-tel .bub b.nm{display:block;color:#6a0dad;font-size:11px}
.dg-boss-tel .bub .tr{display:flex;gap:6px;justify-content:flex-end;align-items:center;margin-top:6px;flex-wrap:wrap}
.dg-boss-tel .bub .tr small{margin-right:auto;color:#666}
.dg-boss-tel .dg-boss-btn{min-height:24px;padding:2px 8px}
.dg-boss-hl{outline:3px solid #ffd400!important;outline-offset:-1px;animation:dgbosshl .5s infinite alternate}
@keyframes dgbosshl{to{outline-color:#ff3a00}}
.dg-boss-hrow{display:flex;flex:none;border-bottom:2px solid #000;background:#0f3f12;min-height:0}
.dg-boss-hrow .dg-boss-com{flex:1;border-bottom:0;min-width:0}
.dg-boss-hp{flex:none;width:clamp(180px,32%,290px);padding:4px;background:#0a2a0c;display:flex;align-items:center;justify-content:center}
.dg-boss-hp canvas{width:100%;height:auto;display:block;border:1px solid #000;image-rendering:pixelated}
.dg-boss-hp.off{display:none}
.dg-boss-narrow .dg-boss-hrow{flex-direction:column}
.dg-boss-narrow .dg-boss-hp{width:100%;padding:3px}
.dg-boss-narrow .dg-boss-hp canvas{width:auto;max-width:100%;height:132px}
.dg-boss-narrow .dg-boss-hrow .dg-boss-com{min-height:64px;font-size:14px}
.dg-boss-pane.fax{background:#000;color:#fff;font:bold 12px/1.3 "Courier New",monospace;border-color:#444}
.dg-boss-fax .fh{color:#000;background:#00d8ff;padding:1px 4px;display:flex;justify-content:space-between;position:sticky;top:0}
.dg-boss-fax .ft{color:#ffff00;padding:2px 4px;letter-spacing:1px}
.dg-boss-fax .fr{display:grid;grid-template-columns:1fr 46px 1fr;gap:4px;padding:1px 4px}
.dg-boss-fax .fr .s{color:#ffff00;text-align:center}.dg-boss-fax .fr .h{text-align:right}
.dg-boss-fax .fr.new{background:#0000c0}.dg-boss-fax .fr.me{color:#00ff7f}
.dg-boss-fax .fx{color:#ff40ff;padding:2px 4px}
.dg-boss-title{overflow:auto}
.dg-boss-menu .dg-boss-btn small{display:block;font-weight:normal;font-size:10px;color:#333}
.dg-boss-menu .dg-boss-btn.big{background:linear-gradient(#ffe866,#e8b800);border-color:#fff8c0 #806000 #806000 #fff8c0}
.dg-boss-menu .dg-boss-btn.net{background:linear-gradient(#ff7a7a,#c81a1a);color:#fff;text-shadow:1px 1px #000;border-color:#fcc #500 #500 #fcc}
.dg-boss-narrow .dg-boss-title{gap:10px;justify-content:flex-start;padding-top:40px}
.dg-boss-narrow .dg-boss-menu .dg-boss-btn{padding:6px;font-size:12px}
.dg-boss-tabs{display:flex;gap:2px;margin-bottom:4px;flex-wrap:wrap}
.dg-boss-nh{display:flex;align-items:center;gap:8px;padding:4px 8px;background:linear-gradient(#5a0a0a,#a01a1a);color:#fff;border-bottom:2px solid #000;flex:none;min-height:38px}
.dg-boss-nh .t{font:italic 900 18px/1 Impact,"Arial Black",sans-serif;letter-spacing:1px;color:#ffd400;text-shadow:2px 2px 0 #000;white-space:nowrap}
.dg-boss-nh .rd{flex:1;min-width:0;font:bold 12px Arial,sans-serif}
.dg-boss-nh .rd small{display:block;font:11px Tahoma,sans-serif;color:#ffd0d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dg-boss-nh .cd{font:bold 18px "Courier New",monospace;background:#000;color:#7f7;padding:1px 8px;border:2px inset #555;min-width:62px;text-align:center}
.dg-boss-nh .cd.hurry{color:#ff4a4a}
.dg-boss-nb{flex:1;min-height:0;overflow:auto;background:#dfe5f0;padding:6px;touch-action:pan-y;position:relative}
.dg-boss-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:4px}
.dg-boss-cg .dg-boss-btn{display:flex;align-items:center;gap:5px;text-align:left;font-weight:bold}
.dg-boss-cg .dg-boss-btn small{display:block;color:#444;font-weight:normal;font-size:10px}
.dg-boss-cg .dg-boss-btn.taken{opacity:.55}
.dg-boss-br{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;align-items:stretch}
.dg-boss-br .col{display:flex;flex-direction:column;justify-content:space-around;gap:6px}
.dg-boss-br .col>b{text-align:center;font-size:11px;color:#0a246a}
.dg-boss-tie{background:#fff;border:1px solid #808080;font-size:11px;cursor:pointer}
.dg-boss-tie.on{outline:2px solid #0a246a}
.dg-boss-tie>div{display:flex;align-items:center;gap:3px;padding:2px 4px;white-space:nowrap;overflow:hidden}
.dg-boss-tie>div span{overflow:hidden;text-overflow:ellipsis}
.dg-boss-tie>div.w{font-weight:bold;background:#e4ffd8}.dg-boss-tie>div.l{color:#888}
.dg-boss-tie>div b{margin-left:auto;padding-left:4px}
.dg-boss-tie .hu{color:#a01a1a;font-size:10px}
.dg-boss-narrow .dg-boss-br{grid-template-columns:1fr}
.dg-boss-ready{display:inline-block;font:bold 10px Tahoma,sans-serif;padding:0 4px;border:1px solid #0a8a0a;color:#0a8a0a;background:#efffe8}
.dg-boss-ready.no{border-color:#a07000;color:#a07000;background:#fff6d8}
.dg-boss-champ{text-align:center;padding:10px;background:radial-gradient(circle,#fff6a0,#e8b800);border:2px solid #806000;margin-bottom:8px}
.dg-boss-champ b{display:block;font:italic 900 24px Impact,"Arial Black",sans-serif;color:#a01a1a;text-shadow:2px 2px 0 #fff}
.dg-boss-htp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:8;background:#d4d0c8;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:4px 4px 0 rgba(0,0,0,.5);width:min(400px,94%);max-height:90%;overflow:auto;color:#000;font:12px/1.4 Tahoma,sans-serif}
.dg-boss-htp .dg-boss-dc{padding:8px}
.dg-boss-mp.net{grid-template-columns:1.4fr 1fr}
.dg-boss-narrow .dg-boss-mp.net{grid-template-columns:1fr}
.dg-boss-nb .dg-boss-sb{color:#fff}
.dg-boss-nb .dg-boss-pane.on{display:block}
`;
  const BALL = '<svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="#fff" stroke="#000" stroke-width="2"/><path d="M17 9l6 4-2 7h-8l-2-7z" fill="#111"/><path d="M17 9V3M23 13l6-3M21 20l4 6M13 20l-4 6M11 13l-6-3" stroke="#111" stroke-width="1.6"/><path d="M8 7l3 2M26 7l-3 2" stroke="#111"/></svg>';
  const kit = t => t.pat === 'halves' ? `linear-gradient(90deg,${t.c1} 50%,${t.c2} 50%)` : t.pat === 'stripes' ? `repeating-linear-gradient(90deg,${t.c1} 0 3px,${t.c2} 3px 6px)` : t.pat === 'hoops' ? `repeating-linear-gradient(0deg,${t.c1} 0 3px,${t.c2} 3px 6px)` : t.pat === 'sash' ? `linear-gradient(135deg,${t.c1} 38%,${t.c2} 38% 60%,${t.c1} 60%)` : `linear-gradient(${t.c2} 0 22%,${t.c1} 22%)`;
  const bdg = (t, big) => `<span class="dg-boss-bdg${big ? ' big' : ''}" style="background:${kit(t)}"></span>`;
  const vcls = v => v <= 5 ? 'v1' : v <= 10 ? 'v2' : v <= 15 ? 'v3' : 'v4';

  // ================================================================ the game
  D.mod('boss', (G, arg) => {
    G.css('dg-css-boss', CSS);
    const root = document.createElement('div'); root.className = 'dg-boss'; G.host.appendChild(root);
    const ro = new ResizeObserver(() => root.classList.toggle('dg-boss-narrow', root.clientWidth < 600)); ro.observe(root); G.onClose(() => ro.disconnect());
    root.classList.toggle('dg-boss-narrow', G.phone || root.clientWidth < 600);
    let S = null, slot = null, view = 'inbox', sub = {}, live = null, matchesSinceBed = 0, bedtimes = 0, busy = false;
    let NET = null, keep = null; // an online Cup Night (and the career it put to one side)
    let speed = G.load('speed', 1);
    const OPT = Object.assign({ pitch: true, tips: true }, G.load('opt', {}));
    const qs = s => root.querySelector(s);
    const me = () => S.T[S.me];
    const isNarrow = () => root.classList.contains('dg-boss-narrow');
    const member = () => !!(window.Net && Net.me && Net.me.member);
    const myNick = () => (window.Net && Net.me && Net.me.member && Net.me.nick) || 'Jack';

    // ---- dialogs. o: { w, mom, esc: fn (Esc picks it), cls }
    function modal(title, html, buttons, o) {
      o = o || {};
      const ov = document.createElement('div'); ov.className = 'dg-boss-ov' + (o.cls ? ' ' + o.cls : '');
      ov.innerHTML = o.mom ? `<div class="dg-boss-mom">${html}<div class="dg-boss-db"></div></div>` : `<div class="dg-boss-dlg" style="${o.w ? 'width:' + o.w + 'px' : ''}" role="dialog" aria-label="${esc(title)}"><div class="dg-boss-dt">${esc(title)}</div><div class="dg-boss-dc">${html}</div><div class="dg-boss-db"></div></div>`;
      const row = ov.querySelector('.dg-boss-db');
      (buttons || [['OK']]).forEach(([lab, fn, cls, tip]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'dg-boss-btn' + (cls ? ' ' + cls : ''); b.textContent = lab; if (tip) b.title = tip;
        b.addEventListener('click', () => { G.sfx('click'); if (fn && fn(ov) === false) return; ov.remove(); if (telTipOn) telClose(); });
        row.appendChild(b);
      });
      const bs = [...row.querySelectorAll('button')];
      ov._esc = o.esc === false ? null : bs.find(b => /^(Cancel|OK|Close|Got it|No! Cancel|Back)$/i.test(b.textContent)) || (bs.length === 1 ? bs[0] : null);
      root.appendChild(ov);
      setTimeout(() => { const f = ov.querySelector('.dg-boss-db .go') || ov.querySelector('.dg-boss-db button'); if (f && G.focused() && !G.touch) try { f.focus({ preventScroll: true }); } catch (e) {} }, 30);
      return ov;
    }
    const alertBox = (t, x, then) => modal(t, esc(x).replace(/\n/g, '<br>'), [['OK', then]]);

    // ---- menus
    G.menu([
      ['Game', () => [
        { label: 'New Game...', act: () => confirmLeave(newGame) },
        { label: 'Load Game...', act: () => confirmLeave(loadScreen) },
        { label: 'Save Game...', key: 'Ctrl+S', dis: !S || !!live || !!NET, act: saveScreen },
        '-',
        { label: 'Play Online: Cup Night...', act: playOnline },
        { label: 'Managers\' Hall of Fame...', act: hallOfFame },
        '-',
        { label: 'Title Screen', act: () => confirmLeave(title) },
        { label: 'Exit', act: () => confirmLeave(G.quit) },
      ]],
      ['Options', () => [
        ...['Slow', 'Normal', 'Fast', 'Instant'].map((n, i) => ({ label: 'Match speed: ' + n, rad: speed === i, act: () => { speed = i; G.save('speed', i); } })),
        '-',
        { label: 'Match highlights pitch', chk: OPT.pitch, act: () => { OPT.pitch = !OPT.pitch; G.save('opt', OPT); const hp = qs('.dg-boss-hp'); if (hp) hp.classList.toggle('off', !OPT.pitch); } },
        { label: 'Tips from Tel', chk: OPT.tips, act: () => { OPT.tips = !OPT.tips; G.save('opt', OPT); if (!OPT.tips) telClose(); } },
      ]],
      ['Help', () => [
        { label: 'How to Play', act: howTo },
        { label: 'Keyboard Keys', act: keysHelp },
        { label: 'Tel\'s Guided Tour', dis: !S || !!live || !!NET, act: () => tour(true) },
        '-',
        { label: 'About Championship Boss...', act: () => G.about() },
      ]],
    ]);
    function confirmLeave(fn) {
      if (NET) return modal('Cup Night', 'You\'re in an online Cup Night. Leave it?', [['Leave', () => { netLeave(); fn(); }, 'red'], ['Cancel']]);
      if (!S || live) { if (live) return alertBox('Match in progress', 'You can\'t leave in the middle of a match! The fans would riot. Finish the game first.'); return fn(); }
      modal('Championship Boss', 'Any unsaved progress will be lost.<br><br>(Tel keeps an autosave after every match, just in case.)', [['Carry on', fn], ['Cancel']]);
    }
    function howTo() {
      modal('How to Play', `<b>You are the manager.</b> You pick the team, the tactics and the transfers. The players do the running about.<br><br>
&bull; <b>Continue</b> moves the calendar on to the next thing that matters (a match, or an important message).<br>
&bull; <b>Tactics</b>: formation, mentality and passing style. Click a shirt, then another player to swap them. Green ring = happy in that position, yellow = so-so, red = he'll be rubbish.<br>
&bull; <b>Transfers</b>: find a player, make an offer, then agree his wages. Other clubs will bid for your players too (check your Inbox).<br>
&bull; <b>Youth Team</b>: kids who get better every month. Promote the good ones.<br>
&bull; <b>Match day</b>: a team talk before kick-off and at half-time, up to 3 substitutions, and shouting from the touchline.<br>
&bull; Tired players (low Condition) play worse. Rotate your squad! Form is a player's last five match ratings.<br>
&bull; Money is in Rupees. The board keep 250K back for emergencies.<br><br>
The board tell you what they expect. Do better and they'll love you. Do worse and their confidence drops: if it hits rock bottom, you're sacked.<br><br>
<b>Cup Night</b> (Game menu): a knockout cup against real managers on JackNet.`, [['Got it']], { w: 440 });
    }
    function keysHelp() {
      modal('Keyboard Keys', `<table class="dg-boss-t">${[['Enter / Space', 'Continue (or Go to Match)'], ['I', 'Inbox'], ['U', 'Squad'], ['K', 'Tactics'], ['F', 'Fixtures'], ['L', 'League table'], ['C', 'Jack Cup'], ['Y', 'Youth team'], ['R', 'Transfers'], ['M', 'Finances (money)'], ['B', 'Club and board'], ['Ctrl+S', 'Save game'], ['Esc', 'Close a message box'], ['', ''], ['During a match', ''], ['Space / P', 'Pause / carry on'], ['1 2 3 4', 'Slow / Normal / Fast / Skip'], ['S', 'Substitutions'], ['H', 'Shout from the touchline']].map(([k, v]) => k || v ? `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>` : '').join('')}</table>`, [['OK']], { w: 340 });
    }

    // ---- key handling
    const NAVKEY = { i: 'inbox', u: 'squad', k: 'tactics', f: 'fix', l: 'table', c: 'cup', y: 'youth', r: 'transfers', m: 'fin', b: 'club' };
    G.on(document, 'keydown', e => {
      if (!G.focused() || !root.isConnected) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const ov = [...root.querySelectorAll('.dg-boss-ov')].pop();
      if (e.key === 'Escape' && ov) { if (ov._esc) { e.preventDefault(); ov._esc.click(); } return; }
      if (NET || !S) return;
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (!live) saveScreen(); return; }
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (ov) return;
      if (live && !live.done) {
        const k = e.key.toLowerCase();
        if (k === ' ' || k === 'p') { e.preventDefault(); togglePause(); }
        else if ('1234'.includes(k) && k.length === 1) setSpeed(+k - 1);
        else if (k === 's') subsDlg();
        else if (k === 'h') shout();
        return;
      }
      if (live) return;
      if ((e.key === 'Enter' || e.key === ' ') && qs('.dg-boss-cont')) { e.preventDefault(); cont(); return; }
      const v = NAVKEY[e.key.toLowerCase()];
      if (v && qs('.dg-boss-main')) { e.preventDefault(); go(v); }
    });
    function go(v) { G.sfx('click'); view = v; sub = { from: v }; render(); const m = qs('.dg-boss-main'); if (m) m.scrollTop = 0; telSaw(v); }

    // ================================================================ title screen
    function title() {
      S = null; slot = null; live = null; G.stopMusic(); asOff = false; telClose();
      const sv = AS.load(), has = sv && sv.S && sv.S.v === 1 && sv.S.T;
      G.status(G.demo ? `DEMO VERSION - plays until 31 December 1999. Full version in shops ${D.longDate(G.demoUntil)}.` : 'Championship Boss 99/00 - ready.');
      root.innerHTML = `<div class="dg-boss-title"><div class="lights"><i></i><i></i></div>
        ${G.demo ? '<div class="dg-boss-demo">DEMO</div>' : ''}
        <div class="dg-boss-logo"><div class="l1">SPORTS JACKTERACTIVE PRESENTS</div><div class="l2">CHAMPIONSHIP</div><div class="l3">BOSS</div><div class="l4">${BALL} SEASON 99/00</div></div>
        <div class="dg-boss-menu">${has ? `<button class="dg-boss-btn big" data-t="resume">Continue Career<small>${esc(sv.S.T[sv.S.me].n)}, ${esc(fmtDate(sv.S.day, true))}</small></button>` : ''}<button class="dg-boss-btn${has ? '' : ' big'}" data-t="new">New Game</button><button class="dg-boss-btn" data-t="load">Load Game</button><button class="dg-boss-btn net" data-t="online" title="A knockout cup against real managers on JackNet">Play Online: Cup Night</button><button class="dg-boss-btn" data-t="hof">Managers' Hall of Fame</button><button class="dg-boss-btn" data-t="help">How to Play</button><button class="dg-boss-btn" data-t="quit">Quit to JackOS</button></div>
        <div class="dg-boss-foot">v3.05 &middot; &copy; 1999 Sports Jackteractive &middot; Database: 16 clubs, 320 players, 1 goalkeeper who is a robot.</div></div>`;
      root.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { G.sfx('click'); ({ resume: () => resume(AS.load()), new: newGame, load: loadScreen, online: playOnline, hof: hallOfFame, help: howTo, quit: G.quit })[b.dataset.t](); }));
      G.timer(() => { G.note(523, 0.12, 'square'); G.timer(() => G.note(659, 0.12, 'square'), 130); G.timer(() => G.note(784, 0.25, 'square'), 260); }, 200);
    }

    // ================================================================ new game
    function newGame() {
      const nm = myNick();
      let pickT = 2, diff = 1;
      const rows = TEAMS0.map((t, i) => [i, t]).sort((a, b) => b[1][4] - a[1][4]);
      const ov = modal('New Game: Choose Your Club', `<div class="dg-boss-row"><label>Manager name: <input type="text" class="ng-n" maxlength="18" value="${esc(nm)}" style="width:140px"></label></div>
        <div style="max-height:230px;overflow:auto;border:1px solid #808080"><table class="dg-boss-t"><tr><th>Club</th><th title="Reputation: how big the club is">Rep</th><th class="hm">Board expects</th></tr>${rows.map(([i, t], k) => `<tr data-c="${i}" class="${i === pickT ? 'sel' : ''}" style="cursor:pointer"><td>${bdg({ c1: t[5], c2: t[6], pat: t[7] })}${esc(t[0])}</td><td>${'&#9733;'.repeat(Math.max(1, Math.round(t[4] / 4)))}</td><td class="hm">${expText(k + 1)}</td></tr>`).join('')}</table></div>
        <p style="margin:6px 0 0;font-size:11px" class="ng-i"></p>
        <div class="dg-boss-row" style="margin-top:6px"><b title="How quickly the board lose patience, and how much money they give you">Board:</b>${DIFFN.map((n, i) => `<button type="button" class="dg-boss-btn ${i === diff ? 'on' : ''}" data-d="${i}">${n}</button>`).join('')}</div><p class="ng-d" style="margin:2px 0 0;font-size:11px;color:#444"></p>`,
        [['Start Career', o => { const n = o.querySelector('.ng-n').value.trim().slice(0, 18) || 'Jack'; start(n, pickT); }, 'go'], ['Cancel']], { w: 440 });
      const info = () => { const t = TEAMS0[pickT]; ov.querySelector('.ng-i').innerHTML = `<b>${esc(t[0])}</b> play at ${esc(t[2])} (capacity ${t[3].toLocaleString()}). Chairman: ${esc(t[8])}.`; ov.querySelector('.ng-d').textContent = ['Patient board: more money, and they forgive a bad run.', 'Normal board: they want what they want.', 'Ruthless board: less money, and they sack managers for fun.'][diff]; };
      ov.querySelectorAll('tr[data-c]').forEach(tr => tr.addEventListener('click', () => { pickT = +tr.dataset.c; ov.querySelectorAll('tr[data-c]').forEach(x => x.classList.toggle('sel', x === tr)); info(); G.sfx('click'); }));
      ov.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { diff = +b.dataset.d; ov.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); info(); G.sfx('click'); }));
      info();
      function start(n, tid) {
        loading(['Loading clubs...', 'Loading players...', 'Loading referees (they all need glasses)...', 'Teaching Gubbinz the offside rule...', 'Arranging fixtures...'], () => {
          S = genWorld((Math.random() * 1e9) | 0, tid, n); S.diff = diff; S.bal = Math.round(S.bal * [1.3, 1, 0.75][diff] / 10000) * 10000;
          slot = null; view = 'inbox'; sub = {}; matchesSinceBed = 0; bedtimes = 0; shell(); AS.now();
          recBump(r => { r.mgr = n; r.club = me().n; });
          if (!G.load('tour', 0)) G.timer(() => tour(false), 500);
        });
      }
    }
    function loading(steps, done) {
      const l = document.createElement('div'); l.className = 'dg-boss-load';
      l.innerHTML = `<div style="font:bold 16px Arial">Starting a new game</div><div class="st">${esc(steps[0])}</div><div class="bar"><i></i></div><div style="font-size:10px;color:#9cf">Please wait. Do not switch off your computer. Do not let Dave switch off your computer.</div>`;
      root.appendChild(l);
      let k = 0;
      const iv = G.every(() => { k++; l.querySelector('i').style.width = Math.min(100, k * 100 / (steps.length * 3)) + '%'; l.querySelector('.st').textContent = steps[Math.min(steps.length - 1, Math.floor(k / 3))]; if (k >= steps.length * 3) { G.clear(iv); G.timer(() => { l.remove(); done(); }, 150); } }, 90);
    }

    // ================================================================ saving and loading
    const meta = () => G.load('meta', {});
    const metaOf = () => ({ mgr: S.mgr, club: me().n, date: fmtDate(S.day, true), pos: S.lpos || posOf(S, S.me), season: S.season || 1 });
    function writeSlot(k) {
      try { G.save('slot' + k, S); const m = meta(); m[k] = metaOf(); G.save('meta', m); return true; } catch (e) { return false; }
    }
    function saveScreen() {
      if (!S || live || NET) return;
      const m = meta();
      const go2 = k => {
        writeSlot(k); slot = k; G.sfx('solve'); G.status('Game saved to slot ' + k + '.');
        alertBox('Save Game', `Game saved to slot ${k}.\n\n${S.mgr}, ${me().n}, ${fmtDate(S.day, true)}.`);
      };
      const ov = modal('Save Game', `<p style="margin:0 0 6px">Choose a slot. (Floppy disks not required.)</p>${[1, 2, 3].map(k => `<button class="dg-boss-btn" data-s="${k}" style="display:block;width:100%;text-align:left;margin-bottom:4px">Slot ${k}: ${m[k] ? esc(`${m[k].mgr} - ${m[k].club} - ${m[k].date}`) : '(empty)'}</button>`).join('')}
        <button class="dg-boss-btn" data-s="C" style="display:block;width:100%;text-align:left">Callum's career <span class="dg-boss-sticky">DON'T SAVE OVER THIS!!!</span></button>`, [['Cancel']], { w: 380 });
      ov.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.s;
        if (k === 'C') { modal('Are you sure?', '<b>Callum said DON\'T SAVE OVER THIS.</b><br><br>He will know. He always knows. He\'ll come round and check the date on the save file.', [['Save over it anyway', () => { G.save('slotC', S); G.save('metaC', metaOf()); slot = 'C'; ov.remove(); G.secret('boss.callum'); alertBox('Save Game', 'Saved over Callum\'s career.\n\nYou monster.'); }, 'red'], ['No! Cancel']]); return; }
        ov.remove(); go2(k);
      }));
    }
    function loadScreen() {
      const m = meta(), cm = G.load('metaC', null);
      const has = k => !!m[k];
      const ov = modal('Load Game', `${['auto', 1, 2, 3].map(k => `<button class="dg-boss-btn" data-l="${k}" ${has(k) ? '' : 'disabled'} style="display:block;width:100%;text-align:left;margin-bottom:4px">${k === 'auto' ? 'Autosave' : 'Slot ' + k}: ${m[k] ? esc(`${m[k].mgr} - ${m[k].club} - ${m[k].date} (${ord(m[k].pos || 1)})`) : '(empty)'}</button>`).join('')}
        <button class="dg-boss-btn" data-l="C" style="display:block;width:100%;text-align:left;padding:8px">Callum's career: ${esc(cm ? `${cm.club} - ${cm.date}` : 'Jackport Athletic - Sat 13 Nov 1999')}<br><span class="dg-boss-sticky" style="margin-top:4px">CALLUM'S!!! DON'T SAVE OVER THIS - C.</span></button>`, [['Cancel']], { w: 400 });
      ov.querySelectorAll('[data-l]').forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.l; ov.remove();
        if (k === 'C') {
          const saved = G.load('slotC', null);
          loading(['Loading Callum\'s career...', 'Reading CALLUM.SAV...', 'Removing Callum\'s crisp crumbs from the keyboard...'], () => { S = migrate(saved && saved.v === 1 ? saved : callumCareer()); slot = 'C'; view = 'inbox'; sub = {}; shell(); afterLoad(); });
          return;
        }
        const s2 = G.load('slot' + k, null);
        if (!s2 || s2.v !== 1) return alertBox('Load Game', 'That save is corrupted. (Did a magnet go near it?)');
        S = migrate(s2); slot = k === 'auto' ? null : k; view = 'inbox'; sub = {}; shell(); afterLoad();
      }));
    }
    function afterLoad() { if (G.demo && S.day >= DEMO_END) demoOver(); else if (S.over) G.timer(awards, 300); }
    function callumCareer() {
      const S2 = genWorld(19991113, 2, 'Callum');
      S2.T[2].pl.forEach(id => { const p = S2.P[id]; p.a = p.a.map((v, i) => i === 0 && p.pos !== 'GK' ? v : clamp(v + 2, 1, 20)); p.val = valOf(p); p.wage = wageOf(p); }); // Callum's been in the transfer market. A lot.
      S2.conf = 75;
      autoAdvance(S2, dayOf(1999, 11, 13));
      S2.msgs.forEach(x => { x.read = true; });
      S2.lpos = posOf(S2, 2);
      addMsg(S2, 'Callum', 'DON\'T SAVE OVER THIS', `JACK.\n\nThis is MY career. I'm ${ord(S2.lpos)} in the league with Jackport${S2.lpos > 4 ? ' (because the referees are ALL against me)' : ''} and I've been playing it since the summer holidays.\n\nYou can LOOK. You can play ONE match if you want. But DON'T SAVE OVER THIS.\n\nIf I come round and it says I lost 6-0 to Gubbinz Town I will know it was you.\n\n- Callum\n\nP.S. Don't play the left back. He's rubbish. I only kept him because he's got the same name as my uncle.`, null, true);
      return S2;
    }
    function autosave() { try { G.save('slotauto', S); const m = meta(); m.auto = metaOf(); G.save('meta', m); } catch (e) {} AS.now(); }
    // the carry-on save (a refresh, a closed window or a Shut Down): the career as it is, including a match in progress
    let asOff = false;
    const AS = G.autosave(() => {
      if (asOff) return undefined;
      if (NET) return keep && keep.S ? { S: keep.S, slot: keep.slot, view: 'inbox' } : undefined;
      if (!S) return undefined;
      return { S, slot, view: view === 'player' ? 'squad' : view, live: liveSave() };
    }, { every: 20000 });
    function resume(d) {
      if (!d || !d.S || d.S.v !== 1 || !d.S.T) return title();
      try {
        S = migrate(d.S); slot = d.slot || null; view = NAVS.includes(d.view) ? d.view : 'inbox'; sub = { from: view }; shell();
        if (d.live && d.live.fx != null && !S.over) liveResume(d.live);
        else { afterLoad(); G.status('Welcome back, gaffer! Your career is just as you left it.'); }
      } catch (e) { console.error(e); AS.clear(); title(); }
    }

    // ---- the manager's record (this PC, all careers), and the JackNet Hall of Fame (members)
    const REC0 = { mgr: '', club: '', s: 0, t: 0, c: 0, b: 0, n: 0, k: 0, p: 0 };
    const rec = () => Object.assign({}, REC0, G.load('rec', {}));
    function recBump(fn) {
      const r = rec(); fn(r); G.save('rec', r);
      if (member() && D.net && D.net.rec) try { D.net.rec('boss', { mgr: String(r.mgr || myNick()).slice(0, 18), club: String(r.club || '').slice(0, 24), s: r.s, t: r.t, c: r.c, b: r.b, n: r.n, k: r.k, p: r.p }); } catch (e) {}
      return r;
    }

    // ================================================================ the main screen
    const NAV = [['inbox', 'Inbox', 'I'], ['squad', 'Squad', 'Q'], ['tactics', 'Tactics', 'T'], ['fix', 'Fixtures', 'F'], ['table', 'League Table', 'L'], ['cup', 'Jack Cup', 'C'], ['youth', 'Youth Team', 'Y'], ['transfers', 'Transfers', 'R'], ['fin', 'Finances', 'M'], ['club', 'Club & Board', 'B']];
    const NAVS = NAV.map(n => n[0]);
    function shell() {
      root.innerHTML = `<div class="dg-boss-top"></div><div class="dg-boss-body"><div class="dg-boss-nav">${NAV.map(([k, n, key]) => `<button class="dg-boss-btn" data-a="nav" data-x="${k}" title="${n} (key: ${key})">${n}</button>`).join('')}</div><div class="dg-boss-main"></div></div><div class="dg-boss-bot"><div class="dg-boss-tick"><span></span></div><button class="dg-boss-btn go dg-boss-cont" data-a="cont" title="Move the calendar on (Enter)">Continue &gt;</button></div>`;
      render();
    }
    const nextFx = () => S.fx.filter(f => !f.done && (f.h === S.me || f.a === S.me)).sort((a, b) => a.day - b.day)[0];
    const confWord = c => c >= 85 ? 'Delighted' : c >= 65 ? 'Pleased' : c >= 45 ? 'Satisfied' : c >= 25 ? 'Concerned' : c >= 12 ? 'Very worried' : 'Furious';
    const confCol = c => c >= 65 ? '#2ec82e' : c >= 45 ? '#c8d82e' : c >= 25 ? '#ffb000' : '#ff3a2a';
    function render() {
      if (NET) { netDraw(true); netPickChanged(); return; }
      if (!S || !qs('.dg-boss-main')) return;
      const t = me(), unread = S.msgs.filter(m => !m.read).length, nx = nextFx();
      const nxt = nx ? `Next: ${fmtDate(nx.day)} v ${esc(S.T[nx.h === S.me ? nx.a : nx.h].sh)} (${nx.h === S.me ? 'H' : 'A'}${nx.c === 'C' ? ', Cup' : ''})` : 'No more fixtures';
      qs('.dg-boss-top').innerHTML = `${bdg(t, true)}<div class="club">${esc(t.n)}<small>${esc(S.mgr)}${slot === 'C' ? ' (CALLUM\'S SAVE!)' : ''}${(S.season || 1) > 1 ? ` &middot; Season ${S.season}` : ''} &middot; <b>${nxt}</b></small></div><div class="brd" title="Board confidence: ${Math.round(S.conf)}% (${confWord(S.conf)}). If it hits rock bottom, you're sacked."><span>BOARD: ${confWord(S.conf).toUpperCase()}</span><i><u style="width:${Math.max(3, S.conf)}%;background:${confCol(S.conf)}"></u></i></div><div class="meta">${fmtDate(S.day, true)}<br><span>${gm(S.bal)}</span></div>`;
      root.querySelectorAll('.dg-boss-nav [data-x]').forEach(b => { b.classList.toggle('on', b.dataset.x === view || (view === 'player' && b.dataset.x === sub.from)); const n = NAV.find(x => x[0] === b.dataset.x)[1]; b.innerHTML = n + (b.dataset.x === 'inbox' && unread ? `<i>${unread}</i>` : '') + (b.dataset.x === 'youth' && S.yth.length ? `<i style="background:#0a6a0a">${S.yth.length}</i>` : ''); });
      const nm = todays(S).find(f => f.h === S.me || f.a === S.me);
      qs('.dg-boss-cont').innerHTML = S.over ? 'End of Season &gt;' : nm ? 'Go to Match &gt;' : 'Continue &gt;';
      qs('.dg-boss-tick span').textContent = S.news.join('   ***   ');
      const main = qs('.dg-boss-main');
      main.innerHTML = ({ inbox: vInbox, squad: vSquad, tactics: vTactics, fix: vFix, table: vTable, cup: vCup, youth: vYouth, transfers: vTransfers, fin: vFin, club: vClub, player: vPlayer })[view] ? ({ inbox: vInbox, squad: vSquad, tactics: vTactics, fix: vFix, table: vTable, cup: vCup, youth: vYouth, transfers: vTransfers, fin: vFin, club: vClub, player: vPlayer })[view]() : vInbox();
      if (view === 'tactics') wireTactics(main);
      if (view === 'inbox') { const m = S.msgs.find(x => x.id === sub.msg) || S.msgs[0]; if (m) m.read = true; }
      G.status(`${t.n}  |  ${S.fx.some(f => f.done && f.c === 'L') ? ord(posOf(S, S.me)) + ' in the Premier Jack League' : 'Pre-season'}  |  Board confidence: ${Math.round(S.conf)}%${G.demo ? '  |  DEMO: ends 31 Dec 1999' : ''}`);
      telPoint();
    }
    // one click handler for everything in the shell (and the Cup Night pick screen, which shares the tactics view)
    root.addEventListener('click', e => {
      const el = e.target.closest('[data-a]'); if (!el || !root.contains(el) || !S) return;
      const a = el.dataset.a, x = el.dataset.x;
      if (NET && !['form', 'ment', 'style', 'auto'].includes(a)) return;
      if (a === 'nav') go(x);
      else if (a === 'cont') { G.sfx('click'); cont(); }
      else if (a === 'msg') { sub.msg = +x; render(); }
      else if (a === 'macc') msgAct(+x, true);
      else if (a === 'mrej') msgAct(+x, false);
      else if (a === 'pl') { G.sfx('click'); sub = { pid: +x, from: view === 'player' ? sub.from : view }; view = 'player'; render(); qs('.dg-boss-main').scrollTop = 0; }
      else if (a === 'back') { view = sub.from || 'squad'; sub = { from: view }; render(); }
      else if (a === 'sort') { sub.sort = sub.sort === x ? '-' + x : x; render(); }
      else if (a === 'flt') { sub.pos = x; render(); }
      else if (a === 'fltv') { sub.max = +x; render(); }
      else if (a === 'form') { S.form = x; S.sel = autoPick(S, me(), x); sub.ts = null; G.sfx('click'); render(); }
      else if (a === 'ment') { S.ment = +x; G.sfx('click'); render(); }
      else if (a === 'style') { S.style = +x; G.sfx('click'); render(); }
      else if (a === 'auto') { S.sel = autoPick(S, me(), S.form); sub.ts = null; G.sfx('pet'); render(); }
      else if (a === 'tl') { const p = S.P[+x]; p.tl = !p.tl; G.sfx('click'); render(); }
      else if (a === 'offer') offerDlg(S.P[+x]);
      else if (a === 'newcon') newContract(S.P[+x]);
      else if (a === 'yup') youthPromote(+x);
      else if (a === 'ygo') youthRelease(+x);
      else if (a === 'save') saveScreen();
      else if (a === 'allread') { S.msgs.forEach(m => { m.read = true; }); G.sfx('click'); render(); }
    });

    // ---- views
    function vInbox() {
      const m = S.msgs.find(x => x.id === sub.msg) || S.msgs[0];
      const list = `<div class="dg-boss-msgs"><table class="dg-boss-t"><tr><th>Date</th><th class="hm">From</th><th>Subject</th></tr>${S.msgs.map(x => `<tr data-a="msg" data-x="${x.id}" class="${x.read ? '' : 'un'} ${m && x.id === m.id ? 'sel' : ''}"><td>${fmtDate(x.day)}</td><td class="hm">${esc(x.from)}</td><td>${x.act && !x.act.done ? '! ' : ''}${esc(x.subj)}${isNarrow() ? ' <span style="opacity:.6">(' + esc(x.from) + ')</span>' : ''}</td></tr>`).join('')}</table></div>`;
      let body = '<div class="dg-boss-msg">No messages.</div>';
      if (m) {
        let btns = '';
        if (m.act && !m.act.done) {
          const t = m.act.type;
          btns = `<div class="dg-boss-row" style="margin-top:10px">${t === 'bid' ? `<button class="dg-boss-btn go" data-a="macc" data-x="${m.id}">Accept ${esc(money(m.act.fee))}</button><button class="dg-boss-btn red" data-a="mrej" data-x="${m.id}">Reject</button>` : t === 'deal' ? `<button class="dg-boss-btn go" data-a="macc" data-x="${m.id}">Discuss personal terms</button><button class="dg-boss-btn" data-a="mrej" data-x="${m.id}">Pull out</button>` : t === 'counter' ? `<button class="dg-boss-btn go" data-a="macc" data-x="${m.id}">Offer ${esc(money(m.act.fee))}</button><button class="dg-boss-btn" data-a="mrej" data-x="${m.id}">Forget it</button>` : ''}${m.act.pid && S.P[m.act.pid] ? `<button class="dg-boss-btn" data-a="pl" data-x="${m.act.pid}">View player</button>` : ''}</div>`;
        } else if (m.act && m.act.done) btns = `<div class="dg-boss-row" style="color:#555;margin-top:8px"><i>(${esc(m.act.done)})</i></div>`;
        body = `<div class="dg-boss-msg"><div class="hd">From: <b>${esc(m.from)}</b><br>Date: ${fmtDate(m.day, true)}<br>Subject: <b>${esc(m.subj)}</b></div>${esc(m.body)}${btns}</div>`;
      }
      const un = S.msgs.filter(x => !x.read).length;
      return `<h2>Inbox<span class="sp"></span><small>${un} unread</small>${un > 1 ? '<button class="dg-boss-btn" data-a="allread" style="min-height:18px;padding:0 6px;font-size:10px">Mark all read</button>' : ''}</h2>${list}${body}`;
    }
    function status(p) {
      const xi = S.sel.slice(0, 11).includes(p.id), sb = S.sel.slice(11).includes(p.id);
      return (p.inj ? `<span class="tag inj" title="Injured: ${p.inj} days">INJ</span>` : '') + (p.ban ? `<span class="tag ban" title="Suspended for ${p.ban} match${p.ban > 1 ? 'es' : ''}">BAN</span>` : '') + (xi ? '<span class="tag xi" title="In the starting eleven">XI</span>' : sb ? '<span class="tag sub" title="On the bench">SUB</span>' : '') + (p.tl ? '<span class="tag tl" title="On the transfer list">LIST</span>' : '') + (p.con <= 1 && p.t === S.me ? '<span class="tag tl" title="Contract runs out this summer">CON</span>' : '');
    }
    const formAv = p => (p.fm && p.fm.length ? p.fm.reduce((a, b) => a + b, 0) / p.fm.length : 0);
    const formCell = p => { const f = formAv(p); return f ? `<span class="${f >= 7.5 ? 'v4' : f >= 6.5 ? 'v3' : f >= 5.5 ? 'v2' : 'v1'}" title="Last ${p.fm.length} ratings: ${p.fm.join(', ')}">${f.toFixed(1)}</span>` : '<span title="No games yet">-</span>'; };
    function sortList(list, def) {
      const k = (sub.sort || def).replace('-', ''), dir = (sub.sort || def).startsWith('-') ? -1 : 1;
      const key = { name: p => p.l, pos: p => ['GK', 'D', 'M', 'F'].indexOf(p.pos), age: p => p.age, rat: p => -rat(p), cond: p => -p.cond, mor: p => -p.mor, gls: p => -p.gl, val: p => -p.val, avr: p => -(p.ap ? p.rt / p.ap : 0), form: p => -formAv(p), con: p => p.con, club: p => S.T[p.t] ? S.T[p.t].n : '' }[k] || (p => 0);
      return list.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
    }
    const TH = (k, n, cls, tip) => `<th data-a="sort" data-x="${k}" class="${cls || ''}" title="${tip || 'Sort by ' + n}">${n}</th>`;
    function vSquad() {
      const list = sortList(me().pl.map(id => S.P[id]), 'pos');
      return `<h2>First Team Squad<span class="sp"></span><small>${list.length} players &middot; wages ${gm(list.reduce((t, p) => t + p.wage, 0), '/wk')}</small></h2>
        <table class="dg-boss-t"><tr>${TH('name', 'Name')}${TH('pos', 'Pos', '', 'Position: GK, D(efender), M(idfielder), F(orward) and which side (L, R, C)')}${TH('age', 'Age', 'hm')}${TH('rat', 'Rat', '', 'Rating in his position (out of 20)')}${TH('cond', 'Cnd', '', 'Condition: tired players play worse')}${TH('mor', 'Morale', 'hm', 'Happy players play better')}${TH('form', 'Form', '', 'Average of his last five match ratings')}${TH('gls', 'Gls', 'hm', 'Goals this season')}${TH('con', 'Con', 'hm', 'Years left on his contract')}${TH('val', 'Value', 'hm', 'What he\'s worth')}<th></th></tr>
        ${list.map(p => `<tr data-a="pl" data-x="${p.id}"><td>${esc(isNarrow() ? p.f[0] + '. ' + p.l : pname(p))}</td><td>${posStr(p)}</td><td class="hm">${p.age}</td><td class="n ${vcls(rat(p))}">${Math.round(rat(p))}</td><td class="n" style="color:${p.cond < 75 ? '#c00' : p.cond < 90 ? '#a07000' : '#070'}">${Math.round(p.cond)}%</td><td class="hm">${MORN[p.mor]}</td><td class="n">${formCell(p)}</td><td class="n hm">${p.gl}</td><td class="n hm">${p.con}</td><td class="n hm">${gm(p.val)}</td><td>${status(p)}</td></tr>`).join('')}</table>
        <p style="font-size:10px;color:#444">Click a column heading to sort. Click a player to see his details. Hover over a heading for what it means.</p>`;
    }
    function vPlayer() {
      const p = S.P[sub.pid]; if (!p) { view = 'squad'; return vSquad(); }
      const t = S.T[p.t], mine = p.t === S.me;
      const shown = (i) => p.pos !== 'GK' && i === 0 ? '-' : p.a[i];
      return `<h2><button class="dg-boss-btn" data-a="back" style="min-height:20px;padding:1px 6px">&lt; Back</button>${esc(pname(p))}<span class="sp"></span>${bdg(t)}<small>${esc(t.n)}</small></h2>
        <div class="dg-boss-panel"><b style="font-size:14px">${esc(pname(p))}</b>${p.robot ? ' <span class="tag ban" title="Beep boop">ROBOT</span>' : ''} &middot; ${posStr(p)} &middot; ${p.age} years old &middot; ${NATN[p.nat] || p.nat}<br>
        Rating: <b class="${vcls(rat(p))}">${Math.round(rat(p))}</b> &nbsp; Condition: <b>${Math.round(p.cond)}%</b> &nbsp; Morale: <b>${MORN[p.mor]}</b> &nbsp; Form: <b>${formCell(p)}</b>${p.inj ? ` &nbsp; <span class="tag inj">INJURED ${p.inj} days</span>` : ''}${p.ban ? ` &nbsp; <span class="tag ban">BANNED ${p.ban}</span>` : ''}${mine && p.age <= 23 ? `<br>Youth coach's guess: <span class="stars">${'&#9733;'.repeat(potStars(p))}${'&#9734;'.repeat(5 - potStars(p))}</span> ${esc(potWord(p))}` : ''}</div>
        <div class="dg-boss-attr">${ATTRS.map((n, i) => `<div><span>${n}</span><b class="${shown(i) === '-' ? '' : vcls(p.a[i])}">${shown(i)}</b></div>`).join('')}</div>
        <div class="dg-boss-panel" style="margin-top:6px">Value: <b>${gm(p.val)}</b> &middot; Wages: <b>${gm(p.wage, '/wk')}</b> &middot; Contract: <b>${p.con} year${p.con === 1 ? '' : 's'} left</b><br>This season: <b>${p.ap}</b> apps, <b>${p.gl}</b> goals, average rating <b>${p.ap ? (p.rt / p.ap).toFixed(2) : '-'}</b>, yellow cards ${p.yc}${p.tl ? '<br><b style="color:#a05a00">Transfer listed.</b>' : ''}</div>
        <div class="dg-boss-row">${mine ? `<button class="dg-boss-btn" data-a="tl" data-x="${p.id}">${p.tl ? 'Take off transfer list' : 'Put on transfer list'}</button><button class="dg-boss-btn" data-a="newcon" data-x="${p.id}">Offer new contract</button>` : `<button class="dg-boss-btn go" data-a="offer" data-x="${p.id}">Make an offer</button>${S.offers.some(o => o.pid === p.id) ? '<i>Your bid is waiting for a reply.</i>' : ''}`}</div>`;
    }
    // ---- tactics
    function slotXY(form, i) {
      const slots = FORMS[form], ps = slots[i][0];
      if (ps === 'GK') return [50, 91];
      const line = slots.map((s, k) => [s, k]).filter(([s]) => s[0] === ps), n = line.length, k = line.findIndex(([, kk]) => kk === i);
      const y = { D: 72, M: 46, F: 19 }[ps];
      return [((k + 1) / (n + 1)) * 100, y + (n >= 4 && (k === 0 || k === n - 1) ? -4 : 0)];
    }
    // Tel's view of the next opponent
    function telAdvice(op) {
      if (!op) return '';
      const om = op.rep > me().rep + 4 ? 2 : op.rep + 3 < me().rep ? 0 : 1, ost = op.style == null ? 1 : op.style;
      const tips = [];
      if (om === 2 || ost === 0) tips.push(`${esc(op.sh)} like to have the ball. <b>Counter</b> could catch them out on the break.`);
      if (ost === 2) tips.push(`${esc(op.sh)} hoof it long. Put your best headers at the back.`);
      if (ost === 3) tips.push(`${esc(op.sh)} sit back and counter. Don't go gung-ho: <b>Normal</b> mentality.`);
      if (op.rep + 3 < me().rep) tips.push('We\'re the better side. <b>Attacking</b> should get us goals.');
      const tired = S.sel.slice(0, 11).map(id => S.P[id]).filter(p => p && p.cond < 80);
      if (tired.length) tips.push(`${tired.map(p => esc(p.l)).join(', ')} ${tired.length > 1 ? 'are' : 'is'} knackered. Think about resting ${tired.length > 1 ? 'them' : 'him'}.`);
      return tips.length ? `<div class="dg-boss-tip"><b>Tel says:</b> ${tips.slice(0, 2).join(' ')}</div>` : '';
    }
    function vTactics(online) {
      fixSelQuiet();
      const t = me(), slots = FORMS[S.form], nx = !online && nextFx(), op = online ? null : nx ? S.T[nx.h === S.me ? nx.a : nx.h] : null;
      const toks = slots.map((sl, i) => {
        const p = S.sel[i] != null ? S.P[S.sel[i]] : null, [x, y] = slotXY(S.form, i);
        const fr = p ? fit(p, sl) / Math.max(1, rat(p)) : 0;
        return `<div class="dg-boss-tok ${fr >= 0.95 ? '' : fr >= 0.8 ? 'f1' : 'f2'} ${sub.ts === 's' + i ? 'sel' : ''}" data-ts="s${i}" style="left:${x}%;top:${y}%" title="${p ? esc(pname(p)) + ' (' + posStr(p) + ', condition ' + Math.round(p.cond) + '%)' : 'Empty'}"><div class="sh" style="background:${kit(t)}"></div>${p ? esc(p.l) : '<span class="em">(empty)</span>'}</div>`;
      }).join('');
      const benchRow = i => { const id = S.sel[i], p = id != null ? S.P[id] : null; return `<tr data-ts="s${i}" class="${sub.ts === 's' + i ? 'sel' : ''}" style="cursor:pointer"><td>S${i - 10}</td><td>${p ? esc(pname(p)) : '-'}</td><td>${p ? posStr(p) : ''}</td><td class="n">${p ? Math.round(rat(p)) : ''}</td><td class="n">${p ? Math.round(p.cond) + '%' : ''}</td></tr>`; };
      const res = t.pl.filter(id => !S.sel.includes(id)).map(id => S.P[id]).sort((a, b) => ['GK', 'D', 'M', 'F'].indexOf(a.pos) - ['GK', 'D', 'M', 'F'].indexOf(b.pos) || rat(b) - rat(a));
      const xiRows = slots.map((sl, i) => { const p = S.sel[i] != null ? S.P[S.sel[i]] : null; return `<tr data-ts="s${i}" class="${sub.ts === 's' + i ? 'sel' : ''}" style="cursor:pointer"><td>${sl[0]}${sl[0] === 'GK' ? '' : ' ' + sl[1]}</td><td>${p ? esc(pname(p)) : '-'}</td><td>${p ? posStr(p) : ''}</td><td class="n">${p ? Math.round(fit(p, sl)) : ''}</td><td class="n">${p ? Math.round(p.cond) + '%' : ''}</td></tr>`; }).join('');
      return `<h2>Tactics<span class="sp"></span><small>${S.form}, ${MENTN[S.ment]}, ${STYLES[S.style == null ? 1 : S.style]}</small></h2>
        <div class="dg-boss-row"><b>Formation:</b>${Object.keys(FORMS).map(f => `<button class="dg-boss-btn ${S.form === f ? 'on' : ''}" data-a="form" data-x="${f}" title="Play ${f} (the assistant re-picks the team to fit)">${f}</button>`).join('')}</div>
        <div class="dg-boss-row"><b>Mentality:</b>${MENTN.map((n, i) => `<button class="dg-boss-btn ${S.ment === i ? 'on' : ''}" data-a="ment" data-x="${i}" title="${['Fewer goals let in, fewer scored', 'Balanced', 'More goals scored, more let in'][i]}">${n}</button>`).join('')}</div>
        <div class="dg-boss-row"><b>Style:</b>${STYLES.map((n, i) => `<button class="dg-boss-btn ${(S.style == null ? 1 : S.style) === i ? 'on' : ''}" data-a="style" data-x="${i}" title="${esc(STYLED[i])}">${n}</button>`).join('')}<button class="dg-boss-btn" data-a="auto" title="Tel picks the best eleven for this formation">Tel: pick my team</button></div>
        <div class="dg-boss-tip"><b>${STYLES[S.style == null ? 1 : S.style]}:</b> ${esc(STYLED[S.style == null ? 1 : S.style])}</div>
        ${online ? '' : telAdvice(op)}
        <div class="dg-boss-tac"><div><div class="dg-boss-pitch"><div class="box t"></div><div class="box b"></div>${toks}</div><p style="font-size:10px;margin:4px 0">Click a shirt (or a row), then click another player to swap them.</p></div>
        <div><table class="dg-boss-t"><tr><th>Slot</th><th>Starting XI</th><th>Pos</th><th title="How good he is in this slot">Fit</th><th title="Condition">Cnd</th></tr>${xiRows}<tr><th colspan="5">Substitutes</th></tr>${[11, 12, 13, 14, 15].map(benchRow).join('')}<tr><th colspan="5">Reserves</th></tr>${res.map(p => `<tr data-ts="p${p.id}" class="${sub.ts === 'p' + p.id ? 'sel' : ''}" style="cursor:pointer"><td></td><td>${esc(pname(p))} ${p.inj ? '<span class="tag inj">INJ</span>' : ''}${p.ban ? '<span class="tag ban">BAN</span>' : ''}</td><td>${posStr(p)}</td><td class="n">${Math.round(rat(p))}</td><td class="n">${Math.round(p.cond)}%</td></tr>`).join('')}</table></div></div>`;
    }
    function fixSelQuiet() { if (!S.sel || S.sel.length < 16) S.sel = autoPick(S, me(), S.form); S.sel = S.sel.map(id => id != null && S.P[id] && S.P[id].t === S.me ? id : null); }
    function wireTactics(main) {
      main.querySelectorAll('[data-ts]').forEach(el => el.addEventListener('click', () => {
        const k = el.dataset.ts;
        if (!sub.ts) { sub.ts = k; G.sfx('click'); render(); return; }
        if (sub.ts === k) { sub.ts = null; render(); return; }
        swapSel(sub.ts, k); sub.ts = null; G.sfx('turn'); render();
      }));
    }
    function swapSel(a, b) {
      const idx = k => k[0] === 's' ? +k.slice(1) : -1;
      const ia = idx(a), ib = idx(b);
      if (ia >= 0 && ib >= 0) { const t = S.sel[ia]; S.sel[ia] = S.sel[ib]; S.sel[ib] = t; }
      else if (ia >= 0 || ib >= 0) { const si = ia >= 0 ? ia : ib, pid = +(ia >= 0 ? b : a).slice(1), p = S.P[pid]; if (p.inj || p.ban) return alertBox('Not available', `${pname(p)} is ${p.inj ? 'injured' : 'suspended'} and can't be picked.`); S.sel[si] = pid; }
    }
    function vFix() {
      const list = S.fx.filter(f => f.h === S.me || f.a === S.me).sort((a, b) => a.day - b.day);
      const next = list.find(f => !f.done);
      return `<h2>Fixtures &amp; Results<span class="sp"></span><small>${list.filter(f => f.done).length} played, ${list.filter(f => !f.done).length} to go</small></h2><table class="dg-boss-t"><tr><th>Date</th><th>Comp</th><th>Opponent</th><th title="Home or away">H/A</th><th>Result</th><th class="hm">Att</th></tr>${list.map(f => {
        const home = f.h === S.me, op = S.T[home ? f.a : f.h];
        let res = '';
        if (f.done) { const my = home ? f.hs : f.as, th = home ? f.as : f.hs, won = my > th || (my === th && f.pen === (home ? 'h' : 'a')), lost = my < th || (my === th && f.pen && !won); res = `<span class="${won ? 'W' : lost ? 'L' : 'Dr'}">${won ? 'W' : lost ? 'L' : 'D'} ${my}-${th}</span>${f.pen ? ` (p ${f.ps})` : ''}`; }
        return `<tr class="${f === next ? 'me' : ''}"><td>${fmtDate(f.day)}</td><td>${f.c === 'L' ? 'League' : 'Cup ' + ['R1', 'QF', 'SF', 'F'][f.rd]}</td><td>${bdg(op)}${esc(isNarrow() ? op.sh : op.n)}</td><td>${home ? 'H' : 'A'}</td><td>${res}</td><td class="hm n">${f.att ? f.att.toLocaleString() : ''}</td></tr>`;
      }).join('')}</table>`;
    }
    function vTable() {
      const rows = table(S);
      return `<h2>Premier Jack League<span class="sp"></span><small>Season 99/00${(S.season || 1) > 1 ? ' (#' + S.season + ')' : ''}</small></h2><table class="dg-boss-t"><tr><th>Pos</th><th>Team</th><th title="Played">P</th><th class="hm" title="Won">W</th><th class="hm" title="Drawn">D</th><th class="hm" title="Lost">L</th><th class="hm" title="Goals for">F</th><th class="hm" title="Goals against">A</th><th title="Goal difference">GD</th><th title="Points: 3 for a win, 1 for a draw">Pts</th><th class="hm" title="Last five results">Form</th></tr>${rows.map((r, i) => `<tr class="${r.id === S.me ? 'me' : ''} ${i === 0 ? 'top' : i >= 13 ? 'rel' : ''}"><td>${i + 1}</td><td>${bdg(S.T[r.id])}${esc(isNarrow() ? S.T[r.id].sh : S.T[r.id].n)}</td><td class="n">${r.p}</td><td class="n hm">${r.w}</td><td class="n hm">${r.d}</td><td class="n hm">${r.l}</td><td class="n hm">${r.f}</td><td class="n hm">${r.a}</td><td class="n">${r.f - r.a > 0 ? '+' : ''}${r.f - r.a}</td><td class="n"><b>${r.pts}</b></td><td class="hm">${r.form.slice(-5).map(x => `<span class="${x === 'D' ? 'Dr' : x}">${x}</span>`).join('')}</td></tr>`).join('')}</table>
        <p style="font-size:10px;color:#444">Green: champions. Red: relegated to Division One (where the pitches are mostly mud). The board expect you to ${expText(expRank(S, S.me))}.</p>`;
    }
    function vCup() {
      let h = '<h2>The Jack Cup<span class="sp"></span><small>Sponsored by nobody</small></h2>';
      const out = S.fx.some(f => f.c === 'C' && f.done && (f.h === S.me || f.a === S.me) && (cupWon(f) === 'h' ? f.a : f.h) === S.me);
      if (out) h += '<div class="dg-boss-tip">We\'re out of the cup. Tel has put the lucky socks in the bin.</div>';
      for (let rd = 0; rd < 4; rd++) {
        const fx = S.fx.filter(f => f.c === 'C' && f.rd === rd);
        h += `<h3>${CUPRD[rd]} &middot; ${fmtDate(CDAYS[rd])}${rd === 3 ? ' &middot; Jackbley' : ''}</h3>`;
        if (!fx.length) { h += '<p style="margin:2px 0;color:#555">Draw not made yet.</p>'; continue; }
        h += `<table class="dg-boss-t">${fx.map(f => `<tr class="${f.h === S.me || f.a === S.me ? 'me' : ''}"><td>${bdg(S.T[f.h])}${esc(isNarrow() ? S.T[f.h].sh : S.T[f.h].n)}</td><td class="n" style="width:60px;text-align:center">${f.done ? f.hs + ' - ' + f.as : 'v'}</td><td>${bdg(S.T[f.a])}${esc(isNarrow() ? S.T[f.a].sh : S.T[f.a].n)}${f.pen ? ` <small>(${esc(S.T[f.pen === 'h' ? f.h : f.a].sh)} win ${f.ps} on pens)</small>` : ''}</td></tr>`).join('')}</table>`;
      }
      if (S.cupWin != null) h += `<div class="dg-boss-panel" style="margin-top:8px">&#127942; <b>${esc(S.T[S.cupWin].n)}</b> won the Jack Cup!</div>`;
      return h;
    }
    function vYouth() {
      const list = S.yth.slice().sort((a, b) => rat(b) - rat(a));
      return `<h2>Youth Team<span class="sp"></span><small>${list.length} of 8 places &middot; new intake every 1 March</small></h2>
        <div class="dg-boss-tip"><b>Youth coach:</b> These lads train every day and get a bit better every month. The stars are my guess at how good they could get. Promote one and he'll get better faster, because playing matches is the best coaching there is. At 18 they go up to the first team or leave.</div>
        ${list.length ? `<table class="dg-boss-t"><tr><th>Name</th><th>Pos</th><th>Age</th><th title="Rating now">Rat</th><th title="The youth coach's guess at how good he could be">Could be</th><th></th></tr>${list.map(p => `<tr><td>${esc(isNarrow() ? p.f[0] + '. ' + p.l : pname(p))}</td><td>${posStr(p)}</td><td>${p.age}</td><td class="n ${vcls(rat(p))}">${Math.round(rat(p))}</td><td><span class="stars" title="${esc(potWord(p))}">${'&#9733;'.repeat(potStars(p))}${'&#9734;'.repeat(5 - potStars(p))}</span></td><td style="white-space:nowrap"><button class="dg-boss-btn go" data-a="yup" data-x="${p.id}" style="min-height:20px;padding:1px 6px" title="Give him a first-team contract">${isNarrow() ? 'Up' : 'Promote'}</button> <button class="dg-boss-btn" data-a="ygo" data-x="${p.id}" style="min-height:20px;padding:1px 6px" title="Let him go">${isNarrow() ? 'X' : 'Release'}</button></td></tr>`).join('')}</table>` : '<div class="dg-boss-panel">The youth team is empty. The next lot arrive on 1 March. (The youth coach is using the time to re-paint the cones.)</div>'}`;
    }
    function youthPromote(id) {
      const p = S.yth.find(x => x.id === id); if (!p) return;
      if (me().pl.length >= 26) return alertBox('Youth Team', 'The first-team squad is full (26 players). Sell or release somebody first.');
      S.yth = S.yth.filter(x => x !== p); promote(S, p); G.sfx('solve');
      if (potStars(p) >= 4) G.secret('boss.youth');
      news(S, `${pname(p)} (${p.age}) promoted from the ${me().sh} youth team.`);
      render(); alertBox('Promoted!', `${pname(p)} signs his first professional contract: ${money(p.wage)} a week for 3 years.\n\nHis Mom came to watch him sign. She cried. He cried. Tel cried.`);
    }
    function youthRelease(id) {
      const p = S.yth.find(x => x.id === id); if (!p) return;
      modal('Release', `Let ${esc(pname(p))} go? ${potStars(p) >= 4 ? '<br><br><b>The youth coach thinks he could be a star!</b>' : ''}`, [['Let him go', () => { S.yth = S.yth.filter(x => x !== p); G.sfx('click'); render(); }, 'red'], ['Cancel']]);
    }
    function vTransfers() {
      const pos = sub.pos || 'All', max = sub.max || 0;
      let list = Object.values(S.P).filter(p => p.t !== S.me && S.T[p.t] && (pos === 'All' || p.pos === pos) && (!max || p.val <= max));
      list = sortList(list, 'rat').slice(0, 60);
      const listed = me().pl.map(id => S.P[id]).filter(p => p.tl);
      return `<h2>Transfers<span class="sp"></span><small>Budget ${gm(Math.max(0, S.bal - 250000))}</small></h2>
        <div class="dg-boss-row"><b>Position:</b>${['All', 'GK', 'D', 'M', 'F'].map(x => `<button class="dg-boss-btn ${pos === x ? 'on' : ''}" data-a="flt" data-x="${x}">${x}</button>`).join('')}</div>
        <div class="dg-boss-row"><b>Max value:</b>${[[0, 'Any'], [250000, ''], [1000000, ''], [3000000, '']].map(([v, n]) => `<button class="dg-boss-btn ${max === v ? 'on' : ''}" data-a="fltv" data-x="${v}" title="${v ? 'Players worth up to ' + money(v) : 'Any value'}">${n || gm(v)}</button>`).join('')}</div>
        ${S.offers.length ? `<div class="dg-boss-panel">Bids waiting for a reply: ${S.offers.map(o => esc(pname(S.P[o.pid])) + ' (' + esc(money(o.fee)) + ')').join(', ')}</div>` : ''}
        ${listed.length ? `<div class="dg-boss-panel">Your transfer list: ${listed.map(p => esc(pname(p))).join(', ')}</div>` : ''}
        <table class="dg-boss-t"><tr>${TH('name', 'Name')}${TH('club', 'Club', 'hm')}${TH('pos', 'Pos')}${TH('age', 'Age')}${TH('rat', 'Rat', '', 'Rating in his position (out of 20)')}${TH('val', 'Value')}</tr>${list.map(p => `<tr data-a="pl" data-x="${p.id}"><td>${esc(isNarrow() ? p.f[0] + '. ' + p.l : pname(p))}${p.tl ? '<span class="tag tl">LIST</span>' : ''}${p.robot ? ' <span class="tag ban">ROBOT</span>' : ''}</td><td class="hm">${bdg(S.T[p.t])}${esc(S.T[p.t].sh)}</td><td>${posStr(p)}</td><td class="n">${p.age}</td><td class="n ${vcls(rat(p))}">${Math.round(rat(p))}</td><td class="n">${gm(p.val)}</td></tr>`).join('')}</table>`;
    }
    function vFin() {
      const bill = me().pl.reduce((t, id) => t + S.P[id].wage, 0), hist = S.hist.length ? S.hist : [S.bal];
      const mx = Math.max(...hist.map(Math.abs), 1), F = S.fin, inc = F.gate + F.tv + F.sales + (F.prize || 0), out = F.wages + F.buys;
      const R = (n, v) => `<td>${n}</td><td class="n">${gm(v)}</td>`;
      return `<h2>Finances<span class="sp"></span><small>All figures in Rupees</small></h2><div class="dg-boss-panel"><b style="font-size:16px">Bank balance: <span style="color:${S.bal < 0 ? '#c00' : '#070'}">${gm(S.bal)}</span></b><br>Wage bill: <b>${gm(bill)}</b> per week (paid every Friday)<br>Transfer budget: <b>${gm(Math.max(0, S.bal - 250000))}</b> (the board keep 250K back for "emergencies", i.e. biscuits)${S.bal < 0 ? '<br><b style="color:#c00">The bank manager has started ringing. Sell somebody!</b>' : ''}</div>
        <h3>This season</h3><table class="dg-boss-t"><tr><th>Income</th><th class="n">Rupees</th><th>Spending</th><th class="n">Rupees</th></tr><tr>${R('Gate receipts', F.gate)}${R('Wages', F.wages)}</tr><tr>${R('TV money', F.tv)}${R('Transfers in', F.buys)}</tr><tr>${R('Transfers out', F.sales)}<td>Pies for the board</td><td class="n">${gm(312)}</td></tr><tr>${R('Prize money', F.prize || 0)}<td></td><td></td></tr><tr><th>Total</th><th class="n">${gm(inc)}</th><th>Total</th><th class="n">${gm(out + 312)}</th></tr></table>
        <h3>Balance (weekly)</h3><div class="dg-boss-chart">${hist.map(v => `<i class="${v < 0 ? 'neg' : ''}" style="height:${Math.max(2, Math.abs(v) / mx * 100)}%" title="${esc(money(v))}"></i>`).join('')}</div>`;
    }
    function vClub() {
      const t = me(), ex = expRank(S, S.me), tops = Object.values(S.P).filter(p => p.gl > 0 && S.T[p.t]).sort((a, b) => b.gl - a.gl).slice(0, 8), r = rec();
      return `<h2>${bdg(t)} ${esc(t.n)}</h2><div class="dg-boss-panel">Stadium: <b>${esc(t.gr)}</b> (capacity ${t.cap.toLocaleString()})<br>Chairman: <b>${esc(t.ch)}</b><br>Manager: <b>${esc(S.mgr)}</b><br>Honours: ${esc(t.hon)}<br>Board expectation: <b>${expText(ex)}</b> &middot; Board: <b>${DIFFN[S.diff == null ? 1 : S.diff]}</b></div>
        <h3>Board confidence</h3><div class="dg-boss-conf"><i style="width:${S.conf}%"></i></div><p style="margin:3px 0">${S.conf >= 85 ? 'The board think you can walk on water.' : S.conf >= 65 ? 'The board are pleased with you.' : S.conf >= 45 ? 'The board are satisfied. For now.' : S.conf >= 25 ? 'The board are getting twitchy.' : 'The board are reading the job adverts in the paper. For YOUR job.'} <i>(Win league games, beat the board's target, go far in the cup. Losing to rubbish teams makes it drop fast.)</i></p>
        ${S.past.length ? `<h3>Your career</h3><table class="dg-boss-t"><tr><th>Season</th><th>Club</th><th>Finished</th><th>Champions</th></tr>${S.past.map(x => `<tr><td>${x.s}</td><td>${esc(x.club)}</td><td>${ord(x.pos)}${x.cup ? ' + Jack Cup' : ''}</td><td>${esc(x.champ)}</td></tr>`).join('')}</table>` : ''}
        <h3>Your record (all careers on this PC)</h3><p style="margin:2px 0">${r.s} season${r.s === 1 ? '' : 's'} finished &middot; ${r.t} league title${r.t === 1 ? '' : 's'} &middot; ${r.c} Jack Cup${r.c === 1 ? '' : 's'} &middot; best finish ${r.b ? ord(r.b) : '-'} &middot; Cup Nights won: ${r.n} &middot; sacked ${r.k} time${r.k === 1 ? '' : 's'}</p>
        <h3>League top scorers</h3><table class="dg-boss-t"><tr><th>Player</th><th>Club</th><th class="n">Goals</th></tr>${tops.map(p => `<tr data-a="pl" data-x="${p.id}"><td>${esc(pname(p))}</td><td>${bdg(S.T[p.t])}${esc(S.T[p.t].sh)}</td><td class="n">${p.gl}</td></tr>`).join('') || '<tr><td colspan="3">Nobody has scored yet.</td></tr>'}</table>
        <h3>Other managers</h3><p style="margin:2px 0">${S.T.filter(x => x.id !== S.me).map(x => `${esc(x.mgr)} (${esc(x.sh)})`).join(', ')}</p>`;
    }

    // ---- inbox actions (bids, deals)
    function msgAct(id, yes) {
      const m = S.msgs.find(x => x.id === id); if (!m || !m.act || m.act.done) return;
      const a = m.act, p = S.P[a.pid];
      if (!p) { a.done = 'No longer relevant'; return render(); }
      if (a.type === 'bid') {
        if (yes) {
          if (p.t !== S.me) { a.done = 'He has already left'; return render(); }
          S.bal += a.fee; S.fin.sales += a.fee; moveTo(S, p, a.from); refill(S, me()); a.done = 'Accepted. ' + pname(p) + ' has left the club';
          news(S, `${pname(p)} joins ${S.T[a.from].n} for ${money(a.fee)}.`); G.sfx('dice');
        } else { a.done = 'Rejected'; if (Math.random() < 0.3) p.mor = Math.max(1, p.mor - 1); }
        render();
      } else if (a.type === 'counter') {
        if (yes) { if (a.fee > S.bal - 250000) return alertBox('Board', 'The board say you haven\'t got that much money.\n\n(They checked down the back of the sofa. Nothing.)'); a.done = 'Offer increased'; S.offers.push({ pid: p.id, fee: a.fee, day: S.day - 1 }); daily2(); }
        else a.done = 'Forgotten about';
        render();
      } else if (a.type === 'deal') {
        if (!yes) { a.done = 'Pulled out'; return render(); }
        if (p.t === S.me) { a.done = 'Signed!'; return render(); }
        if (a.fee > S.bal - 250000) return alertBox('Board', `You can't afford ${money(a.fee)} any more.\n\nThe board say your transfer budget is ${money(Math.max(0, S.bal - 250000))}.`);
        contract(p, a.fee, ok => { if (ok) { a.done = 'Signed!'; } else if (ok === false) { a.done = 'Talks collapsed'; } render(); });
      }
    }
    function daily2() { // the selling club answers a raised bid straight away
      const o = S.offers[S.offers.length - 1]; if (!o) return;
      S.offers.pop(); const p = S.P[o.pid]; if (!p || !S.T[p.t]) return;
      addMsg(S, S.T[p.t].n, 'Bid accepted: ' + pname(p), `${S.T[p.t].n} have accepted your improved offer of ${money(o.fee)} for ${pname(p)}.\n\nYou may now discuss personal terms with the player.`, { type: 'deal', pid: p.id, fee: o.fee }, true);
      sub.msg = S.msgs[0].id;
    }
    function offerDlg(p) {
      if (S.offers.some(o => o.pid === p.id)) return alertBox('Transfers', 'You\'ve already made a bid for him. Wait for a reply (press Continue).');
      if (G.demo && S.msgs.filter(m => m.act && m.act.type === 'deal' && m.act.done === 'Signed!').length >= 3) return alertBox('DEMO VERSION', 'The demo only lets you sign three players.\n\nThe full version lets you sign as many as the board will pay for!');
      if (me().pl.length >= 26) return alertBox('Transfers', 'Your squad is full (26 players). Sell or release somebody first.');
      let fee = Math.round(p.val / 25000) * 25000;
      const ov = modal('Make an offer: ' + pname(p), `${esc(pname(p))} (${posStr(p)}, ${p.age}) plays for <b>${esc(S.T[p.t].n)}</b>.<br>Value: <b>${gm(p.val)}</b>. Your budget: <b>${gm(Math.max(0, S.bal - 250000))}</b>.<br><br><div class="dg-boss-row" style="justify-content:center"><button class="dg-boss-btn" data-f="-1" title="Offer less">-</button><b class="of" style="font-size:18px;min-width:120px;text-align:center">${esc(money(fee))}</b><button class="dg-boss-btn" data-f="1" title="Offer more">+</button></div><p style="font-size:11px;color:#444;margin:4px 0 0">Clubs want more for their first-team regulars, and less for players on the transfer list.</p>`,
        [['Make offer', () => {
          if (fee > S.bal - 250000) { alertBox('Board', `You can't afford ${money(fee)}.\n\nThe board say your transfer budget is ${money(Math.max(0, S.bal - 250000))}.`); return false; }
          S.offers.push({ pid: p.id, fee, day: S.day }); G.sfx('button');
          alertBox('Offer made', `Your offer of ${money(fee)} for ${pname(p)} has been faxed to ${S.T[p.t].n}.\n\nThey'll reply tomorrow. (Press Continue.)`); render();
        }, 'go'], ['Cancel']]);
      const step = () => fee >= 2e6 ? 100000 : fee >= 500000 ? 50000 : 25000;
      ov.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { fee = Math.max(25000, fee + step() * +b.dataset.f); ov.querySelector('.of').textContent = money(fee); G.sfx('click'); }));
    }
    function contract(p, fee, done) {
      const demand = Math.round(Math.max(p.wage * 1.15, wageOf(p) * 1.05) / 50) * 50;
      let wage = Math.round(p.wage / 50) * 50, yrs = 3, tries = 0;
      const ov = modal('Contract talks: ' + pname(p), `<b>${esc(pname(p))}</b>'s agent wants about <b>${esc(money(demand))}</b> a week. (His agent is wearing sunglasses indoors.)<br><br>Wages:<div class="dg-boss-row" style="justify-content:center"><button class="dg-boss-btn" data-w="-1">-</button><b class="wg" style="font-size:17px;min-width:150px;text-align:center"></b><button class="dg-boss-btn" data-w="1">+</button></div>Contract length:<div class="dg-boss-row" style="justify-content:center">${[1, 2, 3, 4].map(y => `<button class="dg-boss-btn ${y === yrs ? 'on' : ''}" data-y="${y}">${y} yr</button>`).join('')}</div><p class="rs" style="min-height:18px;color:#a00;margin:6px 0 0"></p>`,
        [['Offer contract', o => {
          const need = demand * (yrs >= 3 ? 0.88 : 0.93);
          if (wage >= need) {
            if (fee > S.bal - 250000) { alertBox('Board', 'The board say you can\'t afford the fee any more.'); done(null); return; }
            S.bal -= fee; S.fin.buys += fee; moveTo(S, p, S.me); p.wage = wage; p.con = yrs; p.mor = 4;
            G.sfx('solve'); news(S, `${pname(p)} signs for ${me().n} for ${money(fee)}!`);
            if (p.robot) { G.secret('boss.robot'); addMsg(S, TEL, 'The new keeper', `Gaffer,\n\n${pname(p)} has arrived. He came in a crate.\n\nHe says "BEEP" when he catches the ball. He also says "BEEP" when he doesn't. The lads have named him Robby. They've also given him a shell suit.`); }
            else addMsg(S, TEL, pname(p) + ' signs!', `${pname(p)} has signed a ${yrs} year contract worth ${money(wage)} a week.\n\nHe held up the scarf for the photographers. He held it upside down, but it's the thought that counts.`);
            done(true); return;
          }
          tries++;
          if (tries >= 3) { G.sfx('uhoh'); alertBox('Talks collapsed', `${pname(p)} has decided to stay where he is.\n\nHis agent said something rude and left with all the biscuits.`); done(false); return; }
          o.querySelector('.rs').textContent = rnd(['"My client is insulted." Try a bit more.', '"Is this a joke?" He wants more.', '"We\'re nearly there." A bit more.']);
          G.sfx('beep'); return false;
        }, 'go'], ['Walk away', () => done(null)]], { w: 380 });
      const upd = () => { ov.querySelector('.wg').textContent = money(wage) + '/wk'; ov.querySelectorAll('[data-y]').forEach(b => b.classList.toggle('on', +b.dataset.y === yrs)); };
      ov.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => { wage = Math.max(250, wage + Math.max(50, Math.round(wage * 0.05 / 50) * 50) * +b.dataset.w); upd(); G.sfx('click'); }));
      ov.querySelectorAll('[data-y]').forEach(b => b.addEventListener('click', () => { yrs = +b.dataset.y; upd(); }));
      upd();
    }
    function newContract(p) {
      if (p.con >= 4) return alertBox('Contract', `${pname(p)} already has a long contract. He's happy. He's bought a new car.`);
      if (p.age >= 34) return alertBox('Contract', `${pname(p)} says he's thinking about hanging up his boots.\n\nHe's going to open a pub. It'll be called "The Back Four".`);
      const w2 = Math.round(Math.max(p.wage * 1.2, wageOf(p)) / 50) * 50;
      modal('New contract', `Offer ${esc(pname(p))} a new ${p.con + 2} year deal at <b>${gm(w2, '/wk')}</b> (up from ${gm(p.wage, '/wk')})?`, [['Offer it', () => { p.wage = w2; p.con += 2; p.mor = Math.min(5, p.mor + 1); p.tl = false; G.sfx('solve'); render(); alertBox('Contract signed', `${pname(p)} signs a new deal!\n\n"I love this club," he says. He says that a lot.`); }, 'go'], ['Cancel']]);
    }

    // ================================================================ the calendar
    function cont() {
      if (!S || busy || live || NET || root.querySelector('.dg-boss-ov')) return;
      if (S.over) return awards();
      const mine = todays(S).find(f => f.h === S.me || f.a === S.me);
      if (mine) return matchPre(mine);
      for (let k = 0; k < 30; k++) {
        S.day++;
        const before = S.msgs.filter(m => !m.read && m.imp).length;
        daily(S, false);
        if (G.demo && S.day >= DEMO_END) { render(); autosave(); return demoOver(); }
        const fx = todays(S), my = fx.find(f => f.h === S.me || f.a === S.me);
        if (my) { render(); return matchPre(my); }
        if (fx.length) {
          fx.forEach(f => { const M = newMatch(S, f); for (let i = 0; i < 90; i++) stepMin(S, M, false); finish(S, M); });
          afterFixtures(S, false);
          if (fx[0].c === 'C') { addMsg(S, 'Jack Cup', CUPRD[fx[0].rd] + ' results', fx.map(f => `${S.T[f.h].n} ${f.hs}-${f.as} ${S.T[f.a].n}${f.pen ? ' (' + S.T[f.pen === 'h' ? f.h : f.a].sh + ' win ' + f.ps + ' on pens)' : ''}`).join('\n')); }
        }
        if (S.day >= SEASON_END) { S.over = true; render(); autosave(); return awards(); }
        if (S.msgs.filter(m => !m.read && m.imp).length > before) { const m = S.msgs.find(x => !x.read && x.imp); view = 'inbox'; sub = { from: 'inbox', msg: m.id }; render(); G.sfx('beep'); if (m.act && m.act.type === 'bid') telTip('bid'); return; }
      }
      render();
    }
    function demoOver() {
      G.stopMusic();
      return G.demoEnd('The demo season stops on 31 December 1999. The full version has the whole 99/00 season, the Jack Cup final at Jackbley, end-of-season awards, the youth intake, job offers, and unlimited transfers.');
    }

    // ================================================================ the highlights pitch: a little top-down view of the match
    // (22 dots in their formations, a ball, and every chance in the commentary acted out). Canvas only, no images.
    const hexRgb = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const n = m ? parseInt(m[1], 16) : 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const near = (a, b) => { const x = hexRgb(a), y = hexRgb(b); return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < 160; };
    function makePitch(cv, H, A, hForm, aForm) {
      const ctx = cv.getContext('2d'), W = cv.width, Ht = cv.height, mg = 7, pw = W - mg * 2, ph = Ht - mg * 2;
      const X = x => mg + x * pw, Y = y => mg + y * ph;
      const aCol = near(H.c1, A.c1) ? A.c2 : A.c1, aEdge = near(H.c1, A.c1) ? A.c1 : A.c2;
      const mk = (form, home) => FORMS[form].map((sl, i) => { const [sx, sy] = slotXY(form, i), d = 0.03 + (100 - sy) / 100 * 0.52; const bx = home ? d : 1 - d, by = 0.08 + sx / 100 * 0.84; return { bx, by, x: bx, y: by, gk: sl[0] === 'GK', ph: Math.random() * 6 }; });
      const P = { h: mk(hForm, true), a: mk(aForm, false) };
      const ball = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, sp: 1 };
      let seq = [], flash = 0, flashTxt = '', flashCol = '#ffd400', poss = 0.5, drift = 0, card = null, net = null, t = 0;
      function step(dt) {
        if (!(dt > 0 && dt < 0.25)) dt = 0.016; // (a throttled frame can arrive without a time)
        t += dt;
        if (seq.length) { const s = seq[0]; if (!s.on) { s.on = 1; ball.tx = s.x; ball.ty = s.y; ball.sp = s.sp; if (s.fn) s.fn(); } s.t -= dt; if (s.t <= 0) seq.shift(); }
        else if ((drift -= dt) <= 0) { drift = 0.6 + Math.random() * 0.9; const side = Math.random() < poss ? 1 : -1; ball.tx = clamp(0.5 + side * (0.04 + Math.random() * 0.3), 0.12, 0.88); ball.ty = 0.12 + Math.random() * 0.76; ball.sp = 0.45; }
        const dx = ball.tx - ball.x, dy = ball.ty - ball.y, d = Math.hypot(dx, dy), mv = ball.sp * dt;
        if (d > mv) { ball.x += dx / d * mv; ball.y += dy / d * mv; } else { ball.x = ball.tx; ball.y = ball.ty; }
        const sh = (ball.x - 0.5) * 0.42;
        ['h', 'a'].forEach(k => {
          let best = null, bd = 9;
          P[k].forEach(p => {
            const tx = clamp(p.bx + sh * (p.gk ? 0.12 : 1), 0.02, 0.98), ty = clamp(p.by + (ball.y - 0.5) * (p.gk ? 0.2 : 0.3) + Math.sin(t * 1.3 + p.ph) * 0.015, 0.03, 0.97);
            p.x += (tx - p.x) * Math.min(1, dt * 2); p.y += (ty - p.y) * Math.min(1, dt * 2);
            const dd = Math.hypot(p.x - ball.x, p.y - ball.y); if (!p.gk && dd < bd) { bd = dd; best = p; }
          });
          if (best && bd < 0.25) { best.x += (ball.x - best.x) * Math.min(1, dt * 3); best.y += (ball.y - best.y) * Math.min(1, dt * 3); }
        });
        if (flash > 0) flash -= dt; if (card) { card.t -= dt; if (card.t <= 0) card = null; } if (net) { net.t -= dt; if (net.t <= 0) net = null; }
      }
      function draw() {
        for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2f8f2f' : '#2a822a'; ctx.fillRect(i * W / 10, 0, W / 10 + 1, Ht); }
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
        ctx.strokeRect(mg + 0.5, mg + 0.5, pw, ph);
        ctx.beginPath(); ctx.moveTo(X(0.5) + 0.5, Y(0)); ctx.lineTo(X(0.5) + 0.5, Y(1)); ctx.stroke();
        ctx.beginPath(); ctx.arc(X(0.5), Y(0.5), ph * 0.16, 0, 7); ctx.stroke();
        [0, 1].forEach(s => { const x0 = s ? X(1) - pw * 0.15 : X(0); ctx.strokeRect(x0 + 0.5, Y(0.22) + 0.5, pw * 0.15, ph * 0.56); const x1 = s ? X(1) - pw * 0.05 : X(0); ctx.strokeRect(x1 + 0.5, Y(0.38) + 0.5, pw * 0.05, ph * 0.24); });
        // goals (the net shakes after a goal)
        [0, 1].forEach(s => { const wob = net && net.s === s ? Math.sin(t * 40) * 1.5 : 0; ctx.fillStyle = '#ddd'; ctx.fillRect(s ? X(1) : X(0) - 5 + wob, Y(0.44), 5, ph * 0.12); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 4; k++) ctx.fillRect((s ? X(1) : X(0) - 5) + wob, Y(0.44) + k * ph * 0.03, 5, 1); });
        const dot = (p, fillc, edge, gk) => { const x = Math.round(X(p.x)) - 3, y = Math.round(Y(p.y)) - 3; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 1, y + 2, 6, 6); ctx.fillStyle = edge; ctx.fillRect(x - 1, y - 1, 8, 8); ctx.fillStyle = gk; ctx.fillRect(x, y, 6, 6); ctx.fillStyle = fillc; if (gk === fillc) return; };
        P.h.forEach(p => dot(p, H.c1, '#000', p.gk ? '#e8e800' : H.c1));
        P.h.forEach(p => { if (!p.gk && H.c2 !== H.c1) { ctx.fillStyle = H.c2; ctx.fillRect(Math.round(X(p.x)) - 1, Math.round(Y(p.y)) - 3, 2, 6); } });
        P.a.forEach(p => dot(p, aCol, '#000', p.gk ? '#30e0ff' : aCol));
        P.a.forEach(p => { if (!p.gk) { ctx.fillStyle = aEdge; ctx.fillRect(Math.round(X(p.x)) - 3, Math.round(Y(p.y)) - 1, 6, 2); } });
        const bx = Math.round(X(ball.x)), by = Math.round(Y(ball.y));
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(bx - 1, by + 1, 4, 3); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 2, by - 2, 4, 4); ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, 1, 1);
        if (card) { ctx.fillStyle = card.c; ctx.fillRect(Math.round(X(card.x)) - 3, Math.round(Y(card.y)) - 16, 7, 10); ctx.strokeStyle = '#000'; ctx.strokeRect(Math.round(X(card.x)) - 2.5, Math.round(Y(card.y)) - 15.5, 6, 9); }
        if (flash > 0 && Math.floor(flash * 6) % 2 === 0) { ctx.font = 'bold italic 34px Impact, Arial Black, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(flashTxt, W / 2, Ht / 2 + 12); ctx.fillStyle = flashCol; ctx.fillText(flashTxt, W / 2, Ht / 2 + 12); ctx.textAlign = 'left'; }
      }
      // act out a line of commentary
      function ev(L) {
        const c = L.c ? L.c[0] : '', side = L.side, dir = side === 'a' ? -1 : 1, gx = side === 'a' ? 0 : 1, r = Math.random;
        const approach = { x: gx - dir * (0.18 + r() * 0.1), y: 0.25 + r() * 0.5, t: 0.55, sp: 0.9 };
        if (c === 'goal') seq = [approach, { x: gx + dir * 0.012, y: 0.46 + r() * 0.08, t: 1.4, sp: 2.6, fn: () => G.timer(() => { flash = 1.6; flashTxt = 'GOAL!'; flashCol = '#ffd400'; net = { s: gx, t: 1.2 }; }, 180) }, { x: 0.5, y: 0.5, t: 0.4, sp: 3 }];
        else if (c === 'save') seq = [approach, { x: gx - dir * 0.035, y: 0.47 + r() * 0.06, t: 0.45, sp: 2.4 }, { x: gx - dir * 0.16, y: 0.2 + r() * 0.6, t: 0.5, sp: 0.9 }];
        else if (c === 'wide') seq = [approach, { x: gx + dir * 0.03, y: r() < 0.5 ? 0.3 : 0.7, t: 0.6, sp: 2.2 }, { x: gx - dir * 0.05, y: 0.5, t: 0.3, sp: 1 }];
        else if (c === 'post') seq = [approach, { x: gx, y: r() < 0.5 ? 0.43 : 0.57, t: 0.35, sp: 2.4, fn: () => G.timer(() => { flash = 0.8; flashTxt = 'OOOH!'; flashCol = '#fff'; }, 120) }, { x: gx - dir * 0.2, y: 0.5 + (r() - 0.5) * 0.5, t: 0.5, sp: 1.4 }];
        else if (c === 'corner') seq = [{ x: gx, y: r() < 0.5 ? 0.01 : 0.99, t: 0.5, sp: 1.3 }, { x: gx - dir * 0.08, y: 0.45 + r() * 0.1, t: 0.6, sp: 1.2 }];
        else if (c === 'build' || c === 'bl') seq = [{ x: 0.5 + dir * (0.15 + r() * 0.2), y: 0.15 + r() * 0.7, t: 0.6, sp: 0.8 }];
        else if (c === 'yel' || c === 'red' || c === 'y2') { const pl = P[side === 'a' ? 'a' : 'h'][1 + Math.floor(r() * 10)]; card = { x: pl.x, y: pl.y, c: c === 'yel' ? '#ffe000' : '#e81010', t: 1.4 }; }
        else if (c === 'ko' || c === 'h2' || c === 'ht' || c === 'ft') seq = [{ x: 0.5, y: 0.5, t: 0.2, sp: 4 }];
      }
      return { step, draw, ev, poss: v => { poss = clamp(v, 0.15, 0.85); }, _P: P, _ball: ball };
    }
    // a pitch in a container, looping until the container leaves the page
    function mountPitch(box, H, A, hf, af) {
      const cv = document.createElement('canvas'); cv.width = 300; cv.height = 180; box.appendChild(cv);
      const pt = makePitch(cv, H, A, hf, af);
      const stop = G.loop(dt => { if (!cv.isConnected) { stop(); return; } if (box.classList.contains('off')) return; pt.step(dt); pt.draw(); });
      pt.draw();
      return pt;
    }

    // ================================================================ match day
    const TALKS = [['Say nothing', 'Let them get on with it.'], ['"Go out and enjoy it"', 'Relaxes them. Good for underdogs, risky if you\'re favourites.'], ['"Nobody expects anything from us"', 'Fires up underdogs. Favourites might switch off.'], ['"I expect a WIN. Today."', 'Pressure. Happy players rise to it, unhappy ones don\'t.'], ['"Do it for Brenda"', 'Brenda the tea lady. It might work. It might not.']];
    function matchPre(f) {
      const changes = fixSel(S), op = S.T[f.h === S.me ? f.a : f.h], H = S.T[f.h], A = S.T[f.a];
      const danger = op.pl.map(id => S.P[id]).filter(p => !p.inj && p.pos !== 'GK').sort((a, b) => b.a[7] - a.a[7])[0];
      const xi = S.sel.slice(0, 11).map((id, i) => id != null && S.P[id] ? `${FORMS[S.form][i][0]} ${esc(S.P[id].l)}` : '-').join(', ');
      const oment = op.rep > me().rep + 4 ? 2 : op.rep + 3 < me().rep ? 0 : 1;
      let talkK = 0;
      const ov = modal('MATCH DAY', `<div style="text-align:center"><div style="font:bold 11px Tahoma;color:#555">${f.c === 'L' ? 'PREMIER JACK LEAGUE' : 'JACK CUP ' + CUPRD[f.rd].toUpperCase()} &middot; ${fmtDate(f.day, true)}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0;font:bold 15px Arial">${bdg(H, true)}<span>${esc(H.n)}</span><span style="color:#888">v</span><span>${esc(A.n)}</span>${bdg(A, true)}</div>
        <div>at ${f.c === 'C' && f.rd === 3 ? 'Jackbley Stadium (the national stadium)' : esc(H.gr)}</div></div>
        <h3>Your team (${S.form}, ${MENTN[S.ment]}, ${STYLES[S.style == null ? 1 : S.style]})</h3><div style="font-size:11px">${xi}</div>
        ${changes.length ? `<h3>Tel's changes</h3><div style="font-size:11px">${changes.map(esc).join('<br>')}</div>` : ''}
        <h3>Scouting report</h3><div style="font-size:11px">${esc(op.n)} usually play <b>${op.form}</b>, ${MENTN[oment].toLowerCase()}, ${STYLES[op.style == null ? 1 : op.style].toLowerCase()} style. Watch out for <b>${esc(pname(danger))}</b>. ${esc(op.mgr)} is their manager. ${op.rep > me().rep + 2 ? 'They\'re better than us on paper. Paper doesn\'t play football though.' : op.rep < me().rep - 2 ? 'We should beat this lot. Should.' : 'Should be a close one.'}</div>
        ${telAdvice(op)}
        <h3>Team talk</h3><div class="mp-talk" style="display:flex;flex-direction:column;gap:2px">${TALKS.map(([n, d], i) => `<label style="display:flex;gap:4px;align-items:flex-start;font-size:11px;cursor:pointer"><input type="radio" name="dgbtalk" value="${i}" ${i === 0 ? 'checked' : ''}><span><b>${esc(n)}</b> <span style="color:#555">${esc(d)}</span></span></label>`).join('')}</div>`,
        [['Play Match', () => startMatch(f, null, talkK), 'go', 'Kick off! (Enter)'], ['Change Tactics', () => { go('tactics'); }]], { w: 460, esc: false });
      ov.querySelectorAll('input[name=dgbtalk]').forEach(r => r.addEventListener('change', () => { talkK = +r.value; G.sfx('click'); }));
      telTip('prematch');
    }
    function preTalk(my, op, k) {
      if (!k) return [1, ''];
      const [b, ok] = preTalkB(S, my, op, k);
      return [b, XT[3 + k][ok]];
    }
    function startMatch(f, rs, talkK) {
      const resumed = !!rs;
      const others = rs ? rs.others : todays(S).filter(x => x !== f).map(x => { const M2 = newMatch(S, x); for (let i = 0; i < 90; i++) stepMin(S, M2, false); return M2; });
      const M = rs ? rs.M : newMatch(S, f), H = S.T[f.h], A = S.T[f.a], mySide = rs ? M[rs.my] : f.h === S.me ? M.h : M.a;
      live = { M, others, paused: false, tab: 'ev', ht: rs ? !!rs.ht : false, talked: rs ? !!rs.talked : false, mySide, ctx: { h: f.h, a: f.a, final: f.c === 'C' && f.rd === 3 } };
      const el = document.createElement('div'); el.className = 'dg-boss-match';
      el.innerHTML = `<div class="dg-boss-sb"><div class="tm h">${bdg(H)}<span>${esc(isNarrow() ? H.sh : H.n)}</span></div><div class="sc">0-0</div><div class="tm a"><span>${esc(isNarrow() ? A.sh : A.n)}</span>${bdg(A)}</div><div class="clk">0'</div></div>
        <div class="dg-boss-hrow"><div class="dg-boss-hp${OPT.pitch ? '' : ' off'}" title="Match highlights (Options menu turns this off)"></div><div class="dg-boss-com">The players are coming out of the tunnel...</div></div>
        <div class="dg-boss-mtabs"><button class="dg-boss-btn on" data-tab="ev">Commentary</button><button class="dg-boss-btn" data-tab="st">Stats</button><button class="dg-boss-btn" data-tab="sc">JackFax</button></div>
        <div class="dg-boss-mp"><div class="dg-boss-pane on" data-p="ev"><div class="ph">Commentary</div><div class="evs"></div></div><div class="dg-boss-pane" data-p="st"><div class="ph">Match Stats</div><div class="sts"></div></div><div class="dg-boss-pane fax dg-boss-fax" data-p="sc"><div class="scs"></div></div></div>
        <div class="dg-boss-mctl"><span class="lb">Speed:</span>${['Slow', 'Normal', 'Fast', 'Skip'].map((n, i) => `<button class="dg-boss-btn ${speed === i ? 'on' : ''}" data-sp="${i}" title="${n} (key ${i + 1})">${n}</button>`).join('')}<span class="sp"></span><button class="dg-boss-btn" data-m="shout" title="Shout from the touchline (H)">Shout</button><button class="dg-boss-btn" data-m="subs" title="Substitutions (S)">Subs</button><button class="dg-boss-btn" data-m="pause" title="Pause (Space)">Pause</button></div>`;
      root.appendChild(el); live.el = el;
      live.pitch = mountPitch(el.querySelector('.dg-boss-hp'), H, A, M.h.form, M.a.form);
      el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { live.tab = b.dataset.tab; el.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); el.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x.dataset.p === live.tab)); }));
      el.querySelectorAll('[data-sp]').forEach(b => b.addEventListener('click', () => setSpeed(+b.dataset.sp)));
      el.querySelector('[data-m=pause]').addEventListener('click', togglePause);
      el.querySelector('[data-m=shout]').addEventListener('click', shout);
      el.querySelector('[data-m=subs]').addEventListener('click', () => subsDlg());
      if (resumed) {
        draw();
        if (live.ht && !live.talked && M.min === 45) return teamTalk();
        live.paused = true; el.querySelector('[data-m=pause]').textContent = 'Resume';
        alertBox('Welcome back!', `The match was paused at ${M.min}'. The players have been standing very still, waiting for you.\n\nPress Resume (or Space) to carry on.`);
        return;
      }
      G.note(2600, 0.15, 'sine'); G.timer(() => G.note(2600, 0.4, 'sine'), 220);
      M.log.push({ min: 0, c: ['ko', live.ctx.final ? 1 : 0], kind: '' });
      const [b, txt] = preTalk(mySide, S.T[mySide === M.h ? f.a : f.h], talkK | 0);
      mySide.boost = b; if (txt) M.log.push({ min: 0, txt: 'Team talk: ' + txt, kind: 'sub' });
      draw();
      schedule(1200);
    }
    function setSpeed(i) {
      if (!live) return;
      speed = i; G.save('speed', speed); live.el.querySelectorAll('[data-sp]').forEach(x => x.classList.toggle('on', +x.dataset.sp === i)); G.sfx('click');
      if (speed === 3 && !live.paused && !live.done && !root.querySelector('.dg-boss-ov')) { G.clear(live.tm); tick(); }
    }
    function togglePause() {
      if (!live || live.done) return;
      live.paused = !live.paused; const b = live.el.querySelector('[data-m=pause]'); if (b) b.textContent = live.paused ? 'Resume' : 'Pause';
      G.sfx('click');
      if (!live.paused && !root.querySelector('.dg-boss-ov')) schedule(); else G.clear(live.tm);
    }
    function schedule(extra) { if (!live || live.paused || live.done) return; G.clear(live.tm); live.tm = G.timer(tick, extra != null ? extra : [900, 450, 150, 0][speed]); }
    function tick() {
      if (!live || live.paused || live.done) return;
      const M = live.M, l0 = M.log.length;
      let goal = false, n = 0;
      do {
        const g0 = M.goals.length; stepMin(S, M, true); n++;
        if (M.goals.length > g0) goal = true;
        if (M.min === 45 || M.min >= 90) break;
      } while (speed === 3 && n < 200);
      if (speed < 3) { const big = M.log.slice(l0).reverse().find(L => L.c && ['goal', 'save', 'post', 'wide', 'corner', 'yel', 'red', 'y2', 'build', 'bl'].includes(L.c[0])); if (big && live.pitch) live.pitch.ev(big); }
      draw(goal);
      if (goal && speed < 3) { const mine = M.goals[M.goals.length - 1].side === (live.mySide === M.h ? 'h' : 'a'); G.sfx(mine ? 'solve' : 'uhoh'); if (mine) crowd(); }
      if (M.min === 45 && !live.ht) { live.ht = true; G.note(2600, 0.6, 'sine'); M.log.push({ min: 45, c: ['ht', M.h.goals, M.a.goals], kind: 'goal' }); if (live.pitch) live.pitch.ev({ c: ['ht'] }); draw(); return teamTalk(); }
      if (M.min >= 90) return fullTime();
      schedule(goal && speed < 3 ? 2000 : undefined);
    }
    function crowd() { if (!G.sound) return; for (let i = 0; i < 6; i++) G.timer(() => G.note(180 + Math.random() * 260, 0.18, 'sawtooth'), i * 60); }
    function txtOf(L) { if (L._t == null) L._t = lineText(S, L, live ? live.ctx : { h: 0, a: 0 }); return L._t; }
    function draw(goal) {
      const M = live.M, el = live.el;
      el.querySelector('.sc').textContent = M.h.goals + '-' + M.a.goals;
      el.querySelector('.clk').textContent = M.min + "'";
      G.status(`${S.T[M.h.tid].n} ${M.h.goals}-${M.a.goals} ${S.T[M.a.tid].n}  |  ${M.min}'${live.paused ? '  |  PAUSED' : ''}  |  Keys: Space pause, 1-4 speed, S subs, H shout`);
      const last = M.log[M.log.length - 1], com = el.querySelector('.dg-boss-com');
      if (last) { com.textContent = txtOf(last); com.className = 'dg-boss-com' + (last.c && last.c[0] === 'goal' ? ' goal' : last.kind === 'card' ? ' card' : ''); }
      el.querySelector('.evs').innerHTML = M.log.slice(-150).reverse().map(l => `<div class="dg-boss-ev ${l.kind}"><b>${l.min}'</b>${esc(txtOf(l))}</div>`).join('');
      const tot = Math.max(1, M.h.poss + M.a.poss), ph = Math.round(M.h.poss / tot * 100) || 50;
      if (live.pitch) live.pitch.poss(M.h.poss / tot || 0.5);
      const row = (k, a, b) => `<div class="l">${a}</div><div class="k">${k}</div><div class="r">${b}</div>`;
      el.querySelector('.sts').innerHTML = `<div class="dg-boss-st">${row('', esc(S.T[M.h.tid].sh), esc(S.T[M.a.tid].sh))}${row('Possession', ph + '%', (100 - ph) + '%')}<div class="dg-boss-pbar"><i style="width:${ph}%"></i></div>${row('Shots', M.h.shots, M.a.shots)}${row('On target', M.h.on, M.a.on)}${row('Corners', M.h.corners, M.a.corners)}${row('Fouls', M.h.fouls, M.a.fouls)}${row('Yellow cards', M.h.yel.length, M.a.yel.length)}${row('Red cards', M.h.reds.length, M.a.reds.length)}${row('Subs used', M.h.subs, M.a.subs)}</div>
        <div class="ph">Scorers</div><div style="padding:3px 6px">${M.goals.map(g => `${g.min}' ${esc(S.P[g.pid] ? S.P[g.pid].l : '?')} (${esc(S.T[g.side === 'h' ? M.h.tid : M.a.tid].sh)})`).join('<br>') || 'None yet'}</div>
        <div class="ph">Tactics</div><div style="padding:3px 6px;font-size:10px">${[M.h, M.a].map(sd => `${esc(S.T[sd.tid].sh)}: ${sd.form}, ${MENTN[sd.ment]}, ${STYLES[sd.style | 0]}`).join('<br>')}</div>`;
      el.querySelector('.scs').innerHTML = faxHtml(live.others.map(o => ({ h: o.fx.h, a: o.fx.a, hs: o.goals.filter(g => g.side === 'h' && g.min <= M.min).length, as: o.goals.filter(g => g.side === 'a' && g.min <= M.min).length, fresh: o.goals.some(g => g.min <= M.min && g.min > M.min - 4) })), M.min, M.fx.c === 'C' ? 'JACK CUP' : 'PREMIER JACK LEAGUE');
    }
    // JackFax page 302: the latest scores, in blocky teletext colours
    function faxHtml(list, min, comp) {
      const d = dateOf(S.day);
      return `<div class="fh"><span>P302 JACKFAX 302</span><span>${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}</span></div><div class="ft">FOOTBALL: LATEST SCORES</div><div class="fx">${esc(comp)} &middot; ${min >= 90 ? 'FULL TIME' : min >= 45 && min < 46 ? 'HALF TIME' : min + ' MINS'}</div>${list.length ? list.map(o => `<div class="fr${o.fresh ? ' new' : ''}${o.me ? ' me' : ''}"><span class="h">${esc(S.T[o.h].sh.toUpperCase())}</span><span class="s">${o.hs}-${o.as}</span><span>${esc(S.T[o.a].sh.toUpperCase())}</span></div>`).join('') : '<div class="fr"><span></span><span>NO OTHER GAMES TODAY</span><span></span></div>'}<div class="fx" style="color:#00ff7f">MORE ON P303 &gt;&gt;&gt;</div>`;
    }
    function teamTalk() {
      const M = live.M, my = live.mySide, th = my === M.h ? M.a : M.h, diff = my.goals - th.goals;
      telTip('halftime');
      modal('Half-Time Team Talk', `<b>${esc(S.T[M.h.tid].sh)} ${M.h.goals}-${M.a.goals} ${esc(S.T[M.a.tid].sh)}</b><br><br>The lads are sitting in the dressing room eating orange slices. ${diff > 0 ? 'They look pleased with themselves.' : diff < 0 ? 'Nobody will look you in the eye.' : 'It\'s all to play for.'}<br><br>What do you say? <span style="color:#555">(You can also change tactics with Shout, and make Subs, once the second half starts.)</span>`,
        [['"Well done, lads."', () => talk(0), '', 'Calm. Good when you\'re winning.'], ['"I want MORE!"', () => talk(1), '', 'Usually works.'], ['THE HAIRDRYER', () => talk(2), 'red', 'Shout VERY loudly. Great when losing, risky when winning.'], ['Let Gubbinz do it', () => talk(3), '', 'Nobody knows what will happen.']], { w: 420, esc: false });
      function talk(k) {
        const [b, ok] = htTalkB(k, diff), txt = XT[k][ok];
        if (k === 2 && !ok) my.played.forEach(id => { if (Math.random() < 0.4 && S.P[id]) S.P[id].mor = Math.max(1, S.P[id].mor - 1); });
        if (k === 3 && ok) G.sfx('waaagh');
        my.boost = b; live.talked = true;
        M.log.push({ min: 45, txt: 'Team talk: ' + txt, kind: 'sub' });
        draw();
        alertBox('Team Talk', txt, () => { M.log.push({ min: 46, c: ['h2'], kind: '' }); if (live.pitch) live.pitch.ev({ c: ['h2'] }); draw(); schedule(500); });
      }
    }
    function shout() {
      if (!live || live.done || root.querySelector('.dg-boss-ov')) return;
      const my = live.mySide, was = live.paused; live.paused = true; G.clear(live.tm);
      const back = () => { live.paused = was; if (!was) schedule(400); };
      modal('Shout from the touchline', 'What do you want to shout?', [
        ['Push forward!', () => { my.ment = 2; S.ment = 2; say('You wave your arms: PUSH FORWARD! The full-backs bomb on.'); }, '', 'Attacking mentality'],
        ['Keep it tight!', () => { my.ment = 0; S.ment = 0; say('You shout KEEP IT TIGHT! Everyone drops back.'); }, '', 'Defensive mentality'],
        ['Back to normal', () => { my.ment = 1; S.ment = 1; my.agg = 1; say('You calm down and sit back on the bench.'); }, '', 'Normal mentality'],
        ['Get stuck in!', () => { my.agg = 1.6; my.boost = Math.max(my.boost, 1.03); say('GET STUCK IN! The tackles are flying. Careful, lads...'); }, '', 'Harder tackling: more fouls and cards'],
        ['Hit them on the break!', () => { my.style = 3; say('You point at the halfway line and shout BREAK! The lads drop off and wait to pounce.'); }, '', 'Counter-attack style'],
        ['Cancel', back]]);
      function say(t) { live.M.log.push({ min: live.M.min, txt: t, kind: 'sub' }); draw(); G.sfx('beep'); back(); }
    }
    function subsDlg() {
      if (!live || live.done || root.querySelector('.dg-boss-ov')) return;
      const my = live.mySide, slots = FORMS[my.form];
      if (my.subs >= 3) return alertBox('Substitutions', 'You\'ve used all three substitutes.\n\n(It\'s 1999. You only get three. Stop asking.)');
      const was = live.paused; live.paused = true; G.clear(live.tm);
      let off = null;
      const back = () => { live.paused = was; if (!was && !root.querySelector('.dg-boss-ov')) schedule(400); };
      const ov = modal(`Substitutions (${3 - my.subs} left)`, `<b>Who's coming off?</b> <span style="color:#555">(the match is paused)</span><table class="dg-boss-t" style="margin:4px 0 8px">${my.xi.map((id, i) => id == null || !S.P[id] ? `<tr><td>${slots[i][0]}</td><td colspan="2"><i>(sent off/empty)</i></td></tr>` : `<tr data-o="${i}" style="cursor:pointer"><td>${slots[i][0]}${slots[i][0] === 'GK' ? '' : ' ' + slots[i][1]}</td><td>${esc(pname(S.P[id]))}${my.yel.includes(id) ? ' <span class="tag" style="background:#ffe000;color:#000">Y</span>' : ''}</td><td class="n" style="color:${S.P[id].cond < 70 ? '#c00' : '#070'}">${Math.round(S.P[id].cond)}%</td></tr>`).join('')}</table><b>Who's going on?</b><table class="dg-boss-t" style="margin-top:4px">${my.bench.map(id => `<tr data-n="${id}" style="cursor:pointer"><td>${esc(pname(S.P[id]))}</td><td>${posStr(S.P[id])}</td><td class="n">${Math.round(rat(S.P[id]))}</td></tr>`).join('') || '<tr><td>Nobody left on the bench.</td></tr>'}</table>`, [['Done', back]], { w: 380 });
      ov.querySelectorAll('[data-o]').forEach(tr => tr.addEventListener('click', () => { off = +tr.dataset.o; ov.querySelectorAll('[data-o]').forEach(x => x.classList.toggle('sel', x === tr)); G.sfx('click'); }));
      ov.querySelectorAll('[data-n]').forEach(tr => tr.addEventListener('click', () => {
        if (off == null) return alertBox('Substitution', 'Pick who\'s coming off first.');
        const on = +tr.dataset.n, outP = S.P[my.xi[off]];
        my.xi[off] = on; my.bench = my.bench.filter(x => x !== on); my.subs++; if (!my.played.includes(on)) my.played.push(on);
        live.M.log.push({ min: live.M.min, c: ['sub', my.tid, on, outP ? outP.id : 0], kind: 'sub' }); draw(); G.sfx('button');
        ov.remove(); if (my.subs < 3 && my.bench.length) { live.paused = was; subsDlg(); } else back();
      }));
    }
    function fullTime() {
      const M = live.M; live.done = true; G.clear(live.tm);
      G.note(2600, 0.25, 'sine'); G.timer(() => G.note(2600, 0.25, 'sine'), 300); G.timer(() => G.note(2600, 0.7, 'sine'), 600);
      finish(S, M);
      live.others.forEach(o => finish(S, o));
      M.log.push({ min: 90, c: ['ft', M.h.goals, M.a.goals], kind: 'goal' });
      if (M.pens) { M.pens.kicks.forEach(k => M.log.push({ min: 90, c: ['pen', k[0], k[1], k[2], k[3]], kind: 'card' })); M.log.push({ min: 90, c: ['penwin', M.pens.win === 'h' ? M.h.tid : M.a.tid, Math.max(M.pens.hs, M.pens.as), Math.min(M.pens.hs, M.pens.as)], kind: 'goal' }); }
      if (live.pitch) live.pitch.ev({ c: ['ft'] });
      draw();
      afterFixtures(S, false);
      S.played++; matchesSinceBed++;
      const f = M.fx, my = live.mySide, th = my === M.h ? M.a : M.h;
      const won = my.goals > th.goals || (f.pen && f.pen === (my === M.h ? 'h' : 'a')), lost = !won && (my.goals < th.goals || !!f.pen);
      const verdict = won ? rnd(['Get in!!!', 'WHAT A RESULT!', 'Three points in the bag.', 'The fans are singing your name. Well, a version of it.']) : lost ? rnd(['Gutted.', 'Back to the drawing board.', 'The fans are not happy. One threw a pie.', 'Sick as a parrot.']) : rnd(['A point is a point.', 'Honours even.', 'Not bad. Not good. Just... a draw.']);
      if (f.c === 'L') news(S, `${S.T[M.h.tid].n} ${M.h.goals}-${M.a.goals} ${S.T[M.a.tid].n}.`);
      if (won && S.T[th.tid].rep >= me().rep + 5) G.secret('boss.giant');
      const rats = my.played.filter(id => S.P[id]).map(id => [S.P[id], M.rat[id]]).sort((a, b) => b[1] - a[1]);
      const motm = M.motm != null ? S.P[M.motm] : null;
      let results = '';
      if (live.others.length) results = '<h3>Other results</h3><div style="font-size:11px">' + live.others.map(o => `${esc(S.T[o.fx.h].sh)} ${o.h.goals}-${o.a.goals} ${esc(S.T[o.fx.a].sh)}${o.fx.pen ? ' (p)' : ''}`).join('<br>') + '</div>';
      const pos = posOf(S, S.me);
      if (won) G.sfx('solve'); else if (lost) G.sfx('uhoh');
      G.timer(() => { if (!live) return; modal('Full Time', `<div style="text-align:center;font:bold 18px Arial">${esc(S.T[M.h.tid].sh)} ${M.h.goals} - ${M.a.goals} ${esc(S.T[M.a.tid].sh)}${M.pens ? `<div style="font-size:12px">${esc(S.T[M.pens.win === 'h' ? M.h.tid : M.a.tid].sh)} win ${M.pens.score} on pens</div>` : ''}</div><p style="text-align:center;margin:4px 0 8px"><b>${verdict}</b></p>
        <div style="font-size:11px">Attendance: ${f.att.toLocaleString()}${motm ? ` &middot; Man of the match: <b>${esc(pname(motm))}</b> (${esc(S.T[motm.t] ? S.T[motm.t].sh : '')})` : ''} &middot; Possession ${Math.round(my.poss / Math.max(1, M.h.poss + M.a.poss) * 100)}%, shots ${my.shots}-${th.shots}</div>
        <h3>Your player ratings</h3><div style="font-size:11px;columns:2">${rats.map(([p, r]) => `${esc(p.l)} <b class="${r >= 8 ? 'v4' : r >= 6 ? 'v3' : 'v1'}">${r}</b>`).join('<br>')}</div>${results}
        ${f.c === 'L' ? `<p style="margin:8px 0 0">You are now <b>${ord(pos)}</b> in the Premier Jack League. Board: <b>${confWord(S.conf)}</b>.</p>` : ''}`, [['Continue', endMatch, 'go']], { w: 400, esc: false }); }, 900);
      if (f.c === 'L' && pos === 1) G.secret('boss.top');
    }
    function endMatch() {
      if (live && live.el) live.el.remove();
      live = null; autosave();
      if (S.conf <= 4 && S.played >= 8) return sacked();
      view = 'table'; sub = { from: 'table' }; render();
      if (S.conf < 30) telTip('board');
      if (S.cupWin === S.me && !S.cupCel) { S.cupCel = 1; G.sfx('solve'); G.secret('boss.cup'); recBump(r => { r.c++; r.club = me().n; }); alertBox('JACK CUP WINNERS!', `${me().n} have won the Jack Cup!!!\n\nYou lift the trophy. It's heavier than it looks. Gubbinz is inside it.`); }
      checkBedtime();
    }
    function liveSave() {
      if (!live || live.done || !live.M) return null;
      const st = m => Object.assign({}, m, { fx: m.fx.id, log: (m.log || []).map(L => { const o = Object.assign({}, L); delete o._t; return o; }) });
      return { fx: live.M.fx.id, M: st(live.M), others: live.others.map(st), ht: live.ht, talked: live.talked, my: live.mySide === live.M.h ? 'h' : 'a' };
    }
    function liveResume(d) {
      const f = S.fx.find(x => x.id === d.fx);
      if (!f || f.done || !d.M || !d.M.h) return afterLoad();
      const M = Object.assign({}, d.M, { fx: f });
      const others = (d.others || []).map(o => Object.assign({}, o, { fx: S.fx.find(x => x.id === o.fx) })).filter(o => o.fx && !o.fx.done);
      startMatch(f, { M, others, ht: d.ht, talked: d.talked, my: d.my === 'a' ? 'a' : 'h' });
    }

    // ================================================================ the sack, job offers, the end of the season
    function offersFor(kind) {
      const tb = table(S), mine = me(), rel = new Set(tb.slice(-3).map(r => r.id));
      let c = S.T.filter(t => t.id !== S.me && !(S.over && rel.has(t.id)));
      if (kind === 'up') c = c.filter(t => t.rep > mine.rep && t.rep <= mine.rep + 5).sort((a, b) => b.rep - a.rep);
      else c = c.filter(t => t.rep <= mine.rep + 1).sort((a, b) => posOf(S, b.id) - posOf(S, a.id));
      return c.slice(0, kind === 'up' ? 2 : 3);
    }
    function jobOffers(kind, then) {
      const list = offersFor(kind);
      const head = kind === 'up' ? `Word gets around. After a season like that, other chairmen have been on the phone.<br><br>You can stay at <b>${esc(me().n)}</b>, or take a new challenge:` : kind === 'rel' ? 'Nobody wants a manager who got relegated. Well, nearly nobody. These clubs have rung:' : 'Your phone has been quiet. Then, at 11pm, it rings. These clubs need a manager:';
      const btns = list.map(t => [`${t.n} (${'★'.repeat(Math.max(1, Math.round(t.rep / 4)))})`, () => { takeJobNow(t.id, kind); }, kind === 'up' ? '' : 'go', `${t.n}: the board would expect you to ${expText(expRank(S, t.id))}`]);
      if (kind === 'up') btns.unshift([`Stay at ${me().sh}`, () => { G.sfx('solve'); S.conf = clamp(S.conf + 10, 0, 100); alertBox('Loyalty', `You tell them all you're staying at ${me().n}.\n\nThe fans have made a banner. It's spelt wrong, but it's the thought that counts.`, then); }, 'go']);
      btns.push(['Hang up my sheepskin coat', () => { AS.clear(); asOff = true; G.sfx('shutdown'); alertBox('Retired', `${S.mgr} retires from football management to open a pub called "The Back Four".\n\nYour record is safe in the Hall of Fame.`, title); }, 'red', 'Retire (ends this career)']);
      modal(kind === 'up' ? 'Job offers' : 'Situations vacant', `${head}<ul style="margin:6px 0 0;padding-left:18px">${list.map(t => `<li><b>${esc(t.n)}</b>: ${ord(posOf(S, t.id))} in the league, board would expect you to <b>${expText(expRank(S, t.id))}</b>.</li>`).join('')}</ul>`, btns, { w: 440, esc: false });
      function takeJobNow(tid, k) {
        const t = S.T[tid];
        takeJob(S, tid); G.sfx('solve'); G.secret('boss.job');
        recBump(r => { r.club = t.n; });
        addMsg(S, t.ch + ' (Chairman)', 'Welcome to ' + t.n + '!', `Dear ${S.mgr},\n\nWelcome to ${t.n}! ${k === 'sacked' ? 'We don\'t care what happened at your last club. Much.' : 'We\'re delighted you\'ve joined us.'}\n\nThe board expects you to ${expText(expRank(S, tid))}.\n\nYour transfer budget is ${money(Math.max(0, S.bal - 250000))}.\n\n${t.ch}`, null, true);
        if (then) then(); else { view = 'inbox'; sub = { from: 'inbox' }; shell(); autosave(); }
      }
    }
    function sacked() {
      G.sfx('uhoh'); G.secret('boss.sacked');
      recBump(r => { r.k++; });
      modal('A letter from the Chairman', `Dear ${esc(S.mgr)},<br><br>The board have decided to terminate your contract with immediate effect.<br><br>Please hand back your club car, your tracksuit and the key to the biscuit cupboard.<br><br>${esc(me().ch)}`, [['Look for a new job', () => jobOffers('sacked')], ['Title screen', () => { AS.clear(); asOff = true; title(); }]], { w: 380, esc: false });
    }
    function awards() {
      if (!S || !S.over) return;
      const tb = table(S), champ = S.T[tb[0].id], pos = posOf(S, S.me), ex = expRank(S, S.me);
      if (!S.recDone) {
        S.recDone = 1;
        const prize = (17 - pos) * 120000 + (S.cupWin === S.me ? 500000 : 0); S.bal += prize; S.fin.prize = (S.fin.prize || 0) + prize;
        S.past.push({ s: S.season || 1, club: me().n, pos, cup: S.cupWin === S.me ? 1 : 0, champ: champ.n });
        recBump(r => { r.s++; if (pos === 1) r.t++; r.b = r.b ? Math.min(r.b, pos) : pos; r.club = me().n; r.mgr = S.mgr; });
        S.conf = clamp(S.conf + (ex - pos) * 2.5 + (pos === 1 ? 15 : 0), 0, 100);
        S.prize = prize;
        autosave();
      }
      const all = Object.values(S.P).filter(p => S.T[p.t]);
      const top = all.slice().sort((a, b) => b.gl - a.gl)[0];
      const poy = all.filter(p => p.ap >= 10).sort((a, b) => b.rt / b.ap - a.rt / a.ap)[0];
      const ypy = all.filter(p => p.ap >= 6 && p.age <= 21 && p !== poy).sort((a, b) => b.rt / b.ap - a.rt / a.ap)[0];
      const rel = tb.slice(-3).map(r => S.T[r.id].n);
      if (pos === 1) { G.secret('boss.top'); G.secret('boss.champs'); }
      G.sfx('solve');
      modal('End of Season Awards 99/00', `<div style="text-align:center;font:bold 16px Arial">&#127942; ${esc(champ.n)} are CHAMPIONS! &#127942;</div>
        <h3>The awards</h3>Top scorer: <b>${top ? esc(pname(top)) + ` (${esc(S.T[top.t].sh)}, ${top.gl} goals)` : '-'}</b><br>Player of the Year: <b>${poy ? esc(pname(poy)) + ' (' + esc(S.T[poy.t].sh) + ')' : '-'}</b><br>Young Player of the Year: <b>${ypy ? esc(pname(ypy)) + ' (' + esc(S.T[ypy.t].sh) + ')' : '-'}</b><br>Manager of the Year: <b>${esc(champ.id === S.me ? S.mgr : champ.mgr)}</b><br>Jack Cup winners: <b>${S.cupWin != null && S.T[S.cupWin] ? esc(S.T[S.cupWin].n) : '-'}</b><br>Relegated: ${rel.map(esc).join(', ')}
        <h3>Your season</h3>${esc(me().n)} finished <b>${ord(pos)}</b>. The board wanted you to ${expText(ex)}. Prize money: <b>${gm(S.prize || 0)}</b>.<br><b>${pos <= ex ? 'The board are delighted. They\'ve bought you a mug that says "WORLD\'S BEST MANAGER".' : pos <= ex + 3 ? 'The board say it was "fine". They didn\'t buy you a mug.' : 'The board are very disappointed. They\'ve taken away your parking space.'}</b>`,
        [['Next >', boardVerdict, 'go']], { w: 440, esc: false });
    }
    function boardVerdict() {
      const pos = posOf(S, S.me), ex = expRank(S, S.me);
      if (pos >= 14) {
        G.sfx('uhoh');
        return modal('Relegated', `${esc(me().n)} have been relegated to Division One.<br><br>Division One isn't on this disc. (It's on the "Championship Boss: Mud Edition" add-on. Out never.)<br><br>The chairman shakes your hand, says "it's not you, it's us", and changes the locks.`, [['Find a new club', () => jobOffers('rel', y2k), 'go']], { w: 400, esc: false });
      }
      if (pos > ex + 3 && S.conf < 30) {
        G.sfx('uhoh'); recBump(r => { r.k++; }); G.secret('boss.sacked');
        return modal('A letter from the Chairman', `Dear ${esc(S.mgr)},<br><br>The board wanted you to ${expText(ex)}. You finished ${ord(pos)}.<br><br>We have decided to go in a different direction. The direction is "away from you".<br><br>${esc(me().ch)}`, [['Find a new club', () => jobOffers('sacked', y2k), 'go']], { w: 380, esc: false });
      }
      if ((pos <= ex - 3 || pos === 1) && offersFor('up').length) return jobOffers('up', y2k);
      y2k();
    }
    function y2k() {
      G.sfx('beep');
      modal('Championship Boss 99/00', `<div style="font:bold 13px 'Courier New',monospace;background:#000;color:#0f0;padding:8px">Preparing Season 19100/01...<br><br>DATABASE ERROR #2K<br>Season 19100/01 is not a valid season.<br>MILLENNIUM BUG DETECTED.<br><br>Players aged -1883 have been<br>removed from the database.</div><br>Good news! <b>Patch 3.05</b> (on this month's cover disc) winds the calendar back to August 1999, so you can play 99/00 again <b>with your squad, your money and your record</b>. Everybody gets a year older. Some retire. The youth team grows up. Three clubs come up from Division One.`,
        [['Install Patch 3.05 and carry on', newSeason, 'go'], ['Start a new career', newGame], ['Title screen', title]], { w: 420, esc: false });
    }
    function newSeason() {
      const lastPos = S.past.length ? S.past[S.past.length - 1].pos : 0;
      loading(['Installing Patch 3.05...', 'Winding the calendar back to 1999...', 'Making everybody a year older...', 'Promoting clubs from Division One...', 'Printing new fixture lists...'], () => {
        const out = seasonEnd(S); delete S.recDone; delete S.prize;
        G.secret('boss.season2');
        const t = me(), ex = expRank(S, S.me);
        S.conf = clamp(50 + (lastPos && lastPos <= ex ? 10 : 0), 0, 100);
        const tv = 500000 + t.rep * 60000; S.bal += tv; S.fin.tv += tv;
        addMsg(S, TEL, 'The summer', `Gaffer,\n\nWelcome back! Here's what happened over the summer:\n\n${out.ret.length ? 'Retired: ' + out.ret.join(', ') + '.\n\n' : ''}${out.left.length ? 'Contracts ran out, so these lads left: ' + out.left.join(', ') + '.\n\n' : ''}${out.yth.length ? 'Up from the youth team: ' + out.yth.join(', ') + '.\n\n' : ''}Relegated: ${out.rel.join(', ')}.\nPromoted from Division One: ${out.up.join(', ')}.\n\nThe new kit has arrived. It's purple. Like my shell suit.`, null, true);
        addMsg(S, t.ch + ' (Chairman)', 'The new season', `Dear ${S.mgr},\n\nA new season! This time, the board expects you to ${expText(ex)}.\n\nThe sponsors have paid up: ${money(tv)} is in the bank. Your bank balance is ${money(S.bal)}.\n\n${t.ch}`, null, true);
        news(S, `Season ${S.season}: the Premier Jack League kicks off again on Saturday 7 August! (Patch 3.05 required.)`);
        slot = slot === 'C' ? null : slot; view = 'inbox'; sub = { from: 'inbox' }; matchesSinceBed = 0; shell(); autosave();
      });
    }

    // ---- Mom
    function checkBedtime() {
      const hr = new Date().getHours(), late = hr >= 21 || hr < 6;
      const need = bedtimes === 0 ? (late ? 1 : 3) : 2;
      if (matchesSinceBed < need) return;
      matchesSinceBed = 0; bedtimes++;
      G.sfx('uhoh');
      if (bedtimes === 1) momNote(`<b>MOM:</b>It's a school night! Bed! NOW.<br><br>${late ? 'Do you know what time it is?!' : 'And don\'t say "just one more match". I know that one.'}`, [['5 more minutes', null], ['Save and go to bed', goBed]]);
      else if (bedtimes === 2) { G.secret('boss.bedtime'); momNote('<b>MOM:</b>That was NOT five minutes, Jack. That was two whole football matches.<br><br>I can hear the mouse clicking from downstairs. BED.', [['Just ONE more match', null], ['Save and go to bed', goBed]]); }
      else momNote('<b>MOM:</b>Right. That\'s it. I\'m switching it off at the wall.<br><br>Say goodnight to your football team.', [['Goodnight, lads', goBed]]);
    }
    function momNote(html, btns) { modal('', html, btns, { mom: true, esc: false }); }
    function goBed() {
      let where = 'autosave';
      if (slot && slot !== 'C') { writeSlot(slot); where = 'slot ' + slot; }
      autosave(); bedtimes = 0; matchesSinceBed = 0;
      const b = document.createElement('div'); b.className = 'dg-boss-bed';
      b.innerHTML = `<div class="crt"></div><div class="z" style="opacity:0;transition:opacity 1s">Saved to ${esc(where)}${slot === 'C' ? ' (you didn\'t dare save over Callum\'s career)' : ''}.<br><br>Goodnight, ${esc(S.mgr)}.<br><br>Zzzzz...<br><br><small style="color:#666">(The fans will still be there tomorrow. Continue Career is on the title screen.)</small></div>`;
      root.appendChild(b); G.sfx('shutdown');
      G.timer(() => { const z = b.querySelector('.z'); if (z) z.style.opacity = 1; }, 700);
      G.timer(() => { b.remove(); title(); }, 5200);
    }

    // ================================================================ the Managers' Hall of Fame (JackNet members' records)
    function hallOfFame() {
      const r = rec();
      const ov = modal('Managers\' Hall of Fame', `<div class="dg-boss-tabs"><button type="button" class="dg-boss-btn on" data-h="net">JackNet managers</button><button type="button" class="dg-boss-btn" data-h="me">Your record</button></div><div class="dg-boss-hof" style="max-height:300px;overflow:auto"></div>`, [['Close']], { w: 540 });
      const box = ov.querySelector(".dg-boss-hof");
      const mineHtml = () => `<table class="dg-boss-t"><tr><td>Manager</td><td><b>${esc(r.mgr || myNick())}</b></td></tr><tr><td>Latest club</td><td>${esc(r.club || '-')}</td></tr><tr><td>Seasons finished</td><td>${r.s}</td></tr><tr><td>League titles</td><td>${r.t}</td></tr><tr><td>Jack Cups</td><td>${r.c}</td></tr><tr><td>Best league finish</td><td>${r.b ? ord(r.b) : '-'}</td></tr><tr><td>Online Cup Nights won</td><td>${r.n} (of ${r.p} played)</td></tr><tr><td>Times sacked</td><td>${r.k}</td></tr></table><p style="font-size:11px;color:#444">${member() ? 'Your record goes up to the JackNet Hall of Fame every time it changes.' : 'Join JackNet (it\'s FREE: Start &gt; Log Off, then pick a name) and your record goes up on the JackNet Hall of Fame.'}</p>`;
      const netHtml = items => {
        if (!items) return '<p>JackNet isn\'t answering. (Is somebody on the phone?) Try again in a minute.</p>';
        const L = items.map(e => ({ name: e.name, r: e.rec || {} })).sort((a, b) => sc(b.r) - sc(a.r) || (b.r.s | 0) - (a.r.s | 0)).slice(0, 50);
        if (!L.length) return '<p>Nobody on the Hall of Fame yet. Finish a season (or win a Cup Night) to be the first!</p>';
        return `<table class="dg-boss-t"><tr><th>#</th><th>Manager</th><th class="hm">Club</th><th title="Seasons finished">Sns</th><th title="League titles">Titles</th><th title="Jack Cups">Cups</th><th title="Online Cup Nights won">Cup Nights</th><th title="Best league finish">Best</th><th class="hm" title="Times sacked">Sacked</th></tr>${L.map((e, i) => `<tr class="${e.name === (window.Net && Net.me && Net.me.nick) ? 'me' : ''}"><td>${i + 1}</td><td>${esc(e.name)}${e.r.mgr && e.r.mgr !== e.name ? ` <small style="color:#555">(${esc(e.r.mgr)})</small>` : ''}</td><td class="hm">${esc(e.r.club || '-')}</td><td class="n">${e.r.s | 0}</td><td class="n">${e.r.t | 0}</td><td class="n">${e.r.c | 0}</td><td class="n">${e.r.n | 0}</td><td class="n">${e.r.b ? ord(e.r.b | 0) : '-'}</td><td class="n hm">${e.r.k | 0}</td></tr>`).join('')}</table>`;
      };
      const sc = x => (x.t | 0) * 5 + (x.c | 0) * 3 + (x.n | 0) * 2 + (x.b ? Math.max(0, 9 - x.b) * 0.3 : 0) + (x.s | 0) * 0.2;
      let tab = 'net', cache;
      const draw = () => { ov.querySelectorAll('[data-h]').forEach(b => b.classList.toggle('on', b.dataset.h === tab)); if (tab === 'me') box.innerHTML = mineHtml(); else box.innerHTML = cache === undefined ? '<p>Dialling JackNet...</p>' : netHtml(cache); };
      ov.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.h; G.sfx('click'); draw(); }));
      draw();
      if (D.net && D.net.recs) D.net.recs('boss').then(items => { cache = items; if (ov.isConnected) draw(); }); else cache = null;
    }

    // ================================================================ Tel, the assistant manager (the guided tour + one-off tips)
    const TELFACE = '<svg class="face" viewBox="0 0 58 78" aria-hidden="true"><path d="M5 78V60q0-11 11-14l13-4 13 4q11 3 11 14v18z" fill="#6a1aa0" stroke="#000"/><path d="M5 66l12-6 12 8 12-8 12 6v6l-12-6-12 8-12-8-12 6z" fill="#18b8a8" stroke="#000" stroke-width=".6"/><path d="M29 44v34" stroke="#000"/><path d="M21 45l8 9 8-9" fill="#fff" stroke="#000" stroke-width=".6"/><path d="M21 46q8 14 16 0" fill="none" stroke="#c8c8c8" stroke-width="1.2"/><rect x="26" y="56" width="7" height="4" rx="1" fill="#d8d8d8" stroke="#000" stroke-width=".6"/><rect x="24" y="36" width="10" height="9" fill="#e8b890" stroke="#000"/><ellipse cx="14.5" cy="25" rx="2.5" ry="4" fill="#f0c098" stroke="#000"/><ellipse cx="43.5" cy="25" rx="2.5" ry="4" fill="#f0c098" stroke="#000"/><ellipse cx="29" cy="24" rx="13" ry="15" fill="#f0c098" stroke="#000"/><g fill="#6a3a14" stroke="#000" stroke-width=".6"><circle cx="17" cy="13" r="5"/><circle cx="23" cy="8" r="5.5"/><circle cx="30" cy="7" r="5.5"/><circle cx="37" cy="9" r="5"/><circle cx="41" cy="15" r="4"/><circle cx="16" cy="19" r="3.5"/><circle cx="27" cy="11" r="4"/></g><path d="M20 19l6-1M32 18l6 1" stroke="#3a1a04" stroke-width="1.5"/><circle cx="24" cy="23" r="1.7"/><circle cx="34" cy="23" r="1.7"/><path d="M29 24l-2 5h3" fill="none" stroke="#a06040"/><path d="M20 32q9-6 18 0q-3 3-9 1q-6 2-9-1z" fill="#5a2a0a"/><path d="M25 35q4 2 8 0" stroke="#000" fill="none"/></svg>';
    const TOUR = [
      [null, 'Alright gaffer! Tel Bassett, your assistant manager. Nice shell suit, eh? Purple and teal. Very 1999.<br><br>Let me show you round. Takes a minute. (Or click Skip. I won\'t be offended. Much.)'],
      ['squad', 'This is the <b>Squad</b>. Rat is a player\'s rating out of 20. Cnd is condition: knackered players play badly. Form is his last five match ratings. Click anybody for the full details.'],
      ['tactics', '<b>Tactics</b> really matter. Pick a formation, a mentality and a style. Counter-attack is deadly against teams that attack; passing is great if your lads can pass. Click a shirt, then another player, to swap them.'],
      ['transfers', '<b>Transfers</b>: find a player, make an offer, then agree his wages. Mind the budget. The board keep 250K Rupees back for biscuits.'],
      ['youth', 'The <b>Youth Team</b>. Kids who get better every month. A new lot arrives every 1 March. Promote the stars, and play them!'],
      ['fin', '<b>Finances</b>. Wages go out every Friday. Gate money comes in at home games. Don\'t go into the red or the bank manager rings.'],
      ['.brd', 'And THIS is the <b>board</b>. Beat their target and they love you. If their confidence hits rock bottom, you\'re sacked, and I\'m the one who has to tell you.'],
      ['.dg-boss-cont', '<b>Continue</b> moves the calendar on. On match day: a team talk, then the match with commentary and a little highlights pitch, subs, shouting, and a half-time talk.<br><br>That\'s it! Help &gt; Tel\'s Guided Tour if you want me again. Good luck, gaffer!'],
    ];
    let telK = -1, telTimer = 0, telTipOn = false;
    function telClose() { telTipOn = false; const t = root.querySelector('.dg-boss-tel'); if (t) t.remove(); root.querySelectorAll('.dg-boss-hl').forEach(e => e.classList.remove('dg-boss-hl')); telK = -1; G.clear(telTimer); }
    function telShow(html, btns, o) {
      const old = root.querySelector('.dg-boss-tel'); if (old) old.remove();
      const t = document.createElement('div'); t.className = 'dg-boss-tel';
      if (o && o.top) t.style.cssText = 'top:6px;bottom:auto;align-items:flex-start';
      t.innerHTML = `${TELFACE}<div class="bub" role="status"><b class="nm">Tel says:</b>${html}<div class="tr">${o && o.note ? `<small>${esc(o.note)}</small>` : ''}</div></div>`;
      const row = t.querySelector('.tr');
      btns.forEach(([lab, fn, cls]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'dg-boss-btn' + (cls ? ' ' + cls : ''); b.textContent = lab; b.addEventListener('click', ev => { ev.stopPropagation(); G.sfx('click'); fn(); }); row.appendChild(b); });
      root.appendChild(t);
      return t;
    }
    function tour(force) {
      if (!S || NET) return;
      if (!force && G.load('tour', 0)) return;
      telK = 0; telStep();
    }
    function telStep() {
      if (telK < 0 || !S) return;
      if (telK >= TOUR.length) { G.save('tour', 1); telClose(); G.secret('boss.tel'); return; }
      const [tgt, html] = TOUR[telK];
      telShow(html, [['Skip tour', () => { G.save('tour', 1); telClose(); }], [telK === TOUR.length - 1 ? 'Let\'s go!' : 'Next >', () => { telK++; if (TOUR[telK] && TOUR[telK][0] && !TOUR[telK][0].startsWith('.')) go(TOUR[telK][0]); telStep(); }, 'go']], { note: `${telK + 1} of ${TOUR.length}` });
      telPoint();
    }
    function telPoint() {
      root.querySelectorAll('.dg-boss-hl').forEach(e => e.classList.remove('dg-boss-hl'));
      if (telK < 0 || !TOUR[telK] || !TOUR[telK][0]) return;
      const tg = TOUR[telK][0], el = tg.startsWith('.') ? qs(tg) : qs(`.dg-boss-nav [data-x="${tg}"]`);
      if (el) el.classList.add('dg-boss-hl');
    }
    function telSaw(v) { if (telK >= 0 && TOUR[telK] && TOUR[telK][0] === v) telPoint(); }
    const TIPS = {
      prematch: 'Match day! Pick a team talk before kick-off. Underdogs? "Nobody expects anything from us" works a treat.',
      halftime: 'Half-time! The hairdryer works best when we\'re losing. Letting Gubbinz do it is... a gamble.',
      board: 'The board are getting twitchy. A couple of wins and they\'ll calm down. Maybe play it safe for a bit?',
      bid: 'Somebody wants one of our players! Accept and the money goes straight in the bank. Reject and he might sulk.',
    };
    function telTip(k) {
      if (!OPT.tips || telK >= 0) return;
      const seen = G.load('tips', {}); if (seen[k]) return;
      seen[k] = 1; G.save('tips', seen);
      const t = telShow(esc(TIPS[k]), [['Got it', telClose]], { top: true }); telTipOn = true;
      G.clear(telTimer); telTimer = G.timer(() => { if (t.isConnected) t.remove(); }, 14000);
    }

    // ================================================================ ONLINE: Cup Night (MP session 'boss.online', app 'mp.boss')
    // 2-8 real managers each take a club; computer clubs fill the 8-club bracket. Before each round everybody sets a team
    // and a team talk against the clock; the host plays every tie (the host's machine is the referee) and sends the
    // commentary in small coded packets, so everybody watches the same match. Half-time talks and subs count. Drops: the
    // host waits (with a countdown) for a manager who's reconnecting; a manager who's gone for good goes on auto-pilot.
    // Late arrivals watch. A reload picks the night back up.
    const CN = { PICK: 60000, HALF: 32000, HT: 20000, FT: 12000, LOST: 20000, READY: 3500, CH: 1300 };
    const RDN = ['Quarter-Final', 'Semi-Final', 'Final'];
    function playOnline() {
      if (NET) return;
      if (!window.MP || !D.playOnline) return alertBox('Cup Night', 'Online play isn\'t available right now.');
      const w = D.playOnline('boss.online', { note: 'Cup Night: bring your best XI' });
      if (w && w.close) pickW = w;
    }
    const myId = () => (window.Net && Net.me ? Net.me.id : 0);
    let pickW = null; // the "play with someone" window we opened (closed once the cup starts)
    const netNick = id => (NET && NET.s ? NET.s.nick(id) : 'Somebody');
    function netSession(s) {
      if (NET && NET.s !== s && !NET.s.ended) NET.s.leave(true);
      if (!NET) {
        if (live) { G.clear(live.tm); if (live.el) live.el.remove(); live = null; }
        telClose(); root.querySelectorAll('.dg-boss-ov,.dg-boss-load,.dg-boss-bed').forEach(o => o.remove());
        if (S && S.mgr !== '~cup') { keep = { S, slot, view }; AS.now(); }
      }
      if (pickW) { try { if (!pickW.closed) pickW.close(); } catch (e) {} pickW = null; }
      const W = genWorld(s.seed, 0, '~cup', { cup: true }); W.me = -1;
      S = W; slot = null; sub = {};
      NET = { s, W, st: null, deadline: 0, watch: -1, ck: new Map(), q: [], tok: 8, picks: {}, htp: {}, Ms: [], seen: {}, key: '', lastV: -1, my: { form: '4-4-2', ment: 1, style: 1, talk: 0, ready: false, ht: null }, sendT: 0, done: '', pend: 0, iv: [], pk: '' };
      s.bossOpen = true;
      const mine = () => NET && NET.s === s;
      s.on('m', (d, from) => { if (mine() && d && typeof d === 'object') netMsg(d, from); });
      s.on('roster', () => { if (!mine()) return; if (s.host) { netHostRoster(); } netDraw(true); });
      s.on('lost', id => { if (!mine()) return; s.say(`${netNick(id)} lost connection. ${s.host ? 'The cup waits for them at the next deadline.' : ''}`, true); netDraw(); });
      s.on('back', () => { if (mine()) netDraw(); });
      const out = id => {
        if (!mine()) return;
        if (id === s.hostId) { s.end(`${netNick(id)} (the host) has gone, so the Cup Night is over.`); return; }
        if (s.host && NET.st) { const c = NET.st.mg[id]; if (c != null && NET.st.ph !== 'lobby') { if (!NET.st.auto.includes(c)) NET.st.auto.push(c); s.say(`${netNick(id)} has gone. ${W.T[c].sh} go on auto-pilot.`, true); } else if (NET.st.ph === 'lobby') delete NET.st.mg[id]; if (NET.st.wait && NET.st.wait.id === id) NET.st.wait = null; netBump(true); }
        netDraw(true);
      };
      s.on('gone', out); s.on('left', out);
      s.on('end', why => { if (mine()) netClosed(why); });
      s.on('online', () => { if (mine() && !s.host) setTimeout(() => { if (mine()) s.need(); }, 400); });
      s.btns = () => (s.host && NET && NET.st && NET.st.ph === 'lobby' ? [['Invite someone', () => MP.pick('boss.online')]] : []);
      s.state(id => { setTimeout(() => { if (mine() && s.host) netPush(id, true); }, 0); return { v: NET.st ? NET.st.v : 0 }; });
      if (s.host) {
        const sv = s.resumed && s.saved && s.saved.st;
        if (sv && netOkSt(sv)) {
          NET.st = sv; NET.picks = s.saved.picks || {}; NET.htp = s.saved.htp || {};
          NET.Ms = (s.saved.Ms || []).map(m => m && m.h ? m : null);
          const cond = s.saved.cond || {}; for (const id in cond) if (W.P[id]) W.P[id].cond = cond[id];
          netApplyInj(); NET.deadline = NET.st.ends;
          s.say('Welcome back! The Cup Night carries on.');
        } else NET.st = { v: 1, cid: Math.random().toString(36).slice(2, 8), ph: 'lobby', rd: 0, ends: 0, mg: {}, br: [], ties: [], res: [], rdy: [], auto: [], wait: null, inj: {}, champ: -1 };
        if (NET.st.mg[myId()] == null && NET.st.ph === 'lobby') { NET.st.mg[myId()] = netFreeClub(2); }
        netHostRoster();
        NET.iv.push(G.every(() => { if (mine()) { netHostTick(); netPump(); } }, 300));
        netBump(true);
      } else {
        NET.iv.push(G.every(() => { if (mine()) netPump(); }, 300));
        setTimeout(() => { if (mine()) s.need(); }, 250);
        s.save();
      }
      NET.iv.push(G.every(() => { if (mine()) netTick(); }, 250));
      netDraw(true);
      G.status('Championship Boss: Cup Night (online)');
    }
    const netOkSt = st => st && typeof st === 'object' && typeof st.ph === 'string' && st.mg && typeof st.mg === 'object' && Array.isArray(st.ties) && Array.isArray(st.res);
    function netFreeClub(pref) {
      const taken = new Set(Object.values(NET.st.mg));
      if (pref != null && !taken.has(pref)) return pref;
      const free = S.T.map(t => t.id).filter(i => !taken.has(i)).sort((a, b) => S.T[b].rep - S.T[a].rep + (Math.random() - 0.5) * 8);
      return free[0];
    }
    function netHostRoster() {
      const st = NET.st; if (!st) return;
      const ids = new Set(NET.s.humans().map(p => p.id));
      if (st.ph === 'lobby') { for (const id of Object.keys(st.mg)) if (!ids.has(+id)) delete st.mg[id]; }
      netBump(true);
    }
    function netClosed(why) {
      if (NET) NET.iv.forEach(id => G.clear(id));
      const k = keep; NET = null; keep = null; S = null; live = null;
      if (k && k.S) { S = k.S; slot = k.slot; view = k.view || 'inbox'; sub = { from: view }; shell(); } else title();
      if (why && why !== 'You left the game.') G.toast('Championship Boss', why, 4000);
    }
    function netLeave() { if (NET && NET.s && !NET.s.ended) NET.s.leave(); else if (NET) netClosed(''); }

    // ---- the wire: small messages are sent straight away; the full state goes in paced chunks (the relay allows about
    // a dozen messages a second, and a broadcast costs one per person)
    function netQ(msg, to) { NET.q.push([to || 0, msg]); }
    function netPump() {
      if (!NET || !Net.connected) return;
      NET.tok = Math.min(9, NET.tok + 2.7);
      while (NET.q.length) {
        const [to, msg] = NET.q[0], cost = to ? 1 : Math.max(1, NET.s.others().length);
        if (NET.tok < cost && NET.tok < 9) break;
        NET.q.shift(); NET.tok -= cost;
        if (to) NET.s.send(msg, to); else if (NET.s.others().length) NET.s.send(msg);
      }
    }
    // the state a client needs. full: every line of commentary this round; otherwise only what's new in this phase
    function netWire(full) {
      const st = NET.st, ph = st.ph;
      const o = Object.assign({}, st, { left: Math.max(0, st.ends - Date.now()), ends: undefined });
      o.ties = st.ties.map(t => { const x = Object.assign({}, t); if (!(full || ph === 'h1')) delete x.e1; if (!(full || ph === 'h2')) delete x.e2; return x; });
      return o;
    }
    function netPush(to, full) {
      if (!NET || !NET.s.host || !NET.st) return;
      const json = JSON.stringify(netWire(full)), n = Math.ceil(json.length / CN.CH), id = (NET.cid = (NET.cid || 0) + 1);
      if (to) NET.q = NET.q.filter(x => !(x[0] === to && x[1].k === 'ck')); else NET.q = NET.q.filter(x => !(x[1].k === 'ck' && !x[0]));
      for (let i = 0; i < n; i++) netQ({ k: 'ck', id, i, n, v: NET.st.v, d: json.slice(i * CN.CH, (i + 1) * CN.CH) }, to);
      netPump();
    }
    // host: something changed. phase changes send the state; readiness changes send a tiny note
    function netBump(phase) {
      if (!NET || !NET.s.host) return;
      const st = NET.st; st.v++;
      if (phase) { netPush(0, false); NET.s.save({ st, picks: NET.picks, htp: NET.htp, Ms: NET.Ms.map(m => m ? Object.assign({}, m, { log: m.log.map(L => { const x = Object.assign({}, L); delete x._t; return x; }) }) : null), cond: netCond() }); }
      else { NET.q = NET.q.filter(x => x[1].k !== 'rdy'); netQ({ k: 'rdy', v: st.v, rdy: st.rdy, wait: st.wait ? { id: st.wait.id, left: Math.max(0, st.wait.until - Date.now()) } : null, auto: st.auto, left: Math.max(0, st.ends - Date.now()), mg: st.mg }); netPump(); }
      NET.deadline = st.ends;
      const pk = st.ph + st.rd + st.cid; if (pk !== NET.pk) { NET.pk = pk; netPhase(); }
      netDraw(phase);
    }
    function netCond() { const c = {}; NET.Ms.forEach(M => { if (M) [M.h, M.a].forEach(sd => sd.played.forEach(id => { if (NW().P[id]) c[id] = Math.round(NW().P[id].cond); })); }); return c; }
    const NW = () => NET.W;
    function netMsg(d, from) {
      const s = NET.s;
      if (d.k === 'ck') {
        if (from !== s.hostId || s.host) return;
        if (typeof d.d !== 'string' || !(d.n > 0 && d.n < 60) || !(d.i >= 0 && d.i < d.n)) return;
        let c = NET.ck.get(d.id); if (!c) { c = { n: d.n, parts: [], got: 0, t: Date.now() }; NET.ck.set(d.id, c); }
        if (c.parts[d.i] == null) { c.parts[d.i] = d.d; c.got++; }
        if (c.got === c.n) { NET.ck.delete(d.id); let st = null; try { st = JSON.parse(c.parts.join('')); } catch (e) {} if (st && netOkSt(st)) netApply(st); }
        for (const [k, v] of NET.ck) if (Date.now() - v.t > 30000) NET.ck.delete(k);
        return;
      }
      if (d.k === 'rdy') {
        if (from !== s.hostId || s.host || !NET.st || (d.v | 0) < NET.st.v) return;
        NET.st.v = d.v | 0; NET.st.rdy = Array.isArray(d.rdy) ? d.rdy : []; NET.st.auto = Array.isArray(d.auto) ? d.auto : []; if (d.mg && typeof d.mg === 'object') NET.st.mg = d.mg;
        NET.st.wait = d.wait && typeof d.wait === 'object' ? { id: d.wait.id | 0, until: Date.now() + (d.wait.left | 0) } : null;
        NET.deadline = Date.now() + (d.left | 0);
        netDraw(); return;
      }
      if (!s.host || !NET.st) return;
      const st = NET.st, club = st.mg[from];
      if (d.k === 'club' && st.ph === 'lobby') {
        const tid = d.tid | 0; if (!S.T[tid]) return;
        if (Object.entries(st.mg).some(([id, c]) => c === tid && +id !== from)) return netBump(false);
        st.mg[from] = tid; return netBump(true);
      }
      if (d.k === 'pick' && st.ph === 'pick' && club != null && (d.rd | 0) === st.rd) {
        const p = netValidPick(club, d); if (!p) return;
        NET.picks[club] = p;
        if (d.ready && !st.rdy.includes(club)) { st.rdy.push(club); netBump(false); }
        return;
      }
      if (d.k === 'ht' && st.ph === 'ht' && club != null && (d.rd | 0) === st.rd) {
        NET.htp[club] = { talk: clamp(d.talk | 0, 0, 3), ment: clamp(d.ment | 0, 0, 2), style: clamp(d.style | 0, 0, 3), subs: Array.isArray(d.subs) ? d.subs.slice(0, 3).filter(x => Array.isArray(x)).map(x => [x[0] | 0, x[1] | 0]) : [] };
        if (d.ready && !st.rdy.includes(club)) { st.rdy.push(club); netBump(false); }
      }
    }
    function netValidPick(club, d) {
      const t = NW().T[club]; if (!t || !FORMS[d.form]) return null;
      const ok = new Set(t.pl.filter(id => NW().P[id] && !NW().P[id].inj && !NW().P[id].ban));
      const sel = Array.isArray(d.sel) ? d.sel.slice(0, 16).map(x => (x == null ? null : x | 0)) : [];
      const used = new Set(); const clean = sel.map(x => (x != null && ok.has(x) && !used.has(x) && used.add(x) ? x : null));
      while (clean.length < 16) clean.push(null);
      if (clean.slice(0, 11).filter(x => x != null).length < 9) return null;
      return { sel: clean, form: d.form, ment: clamp(d.ment | 0, 0, 2), style: clamp(d.style | 0, 0, 3), talk: clamp(d.talk | 0, 0, 4) };
    }
    // client: the host's state arrived
    function netApply(st) {
      const old = NET.st, newRound = !old || old.rd !== st.rd || old.cid !== st.cid;
      if (old && st.v < old.v && !newRound) return;
      if (old && !newRound) st.ties.forEach((t, i) => { const o = old.ties[i]; if (o && o.h === t.h && o.a === t.a) { if (!t.e1 && o.e1) t.e1 = o.e1; if (!t.e2 && o.e2) t.e2 = o.e2; } });
      const pk = st.ph + st.rd + st.cid, phaseChanged = pk !== NET.pk;
      NET.st = st; NET.deadline = Date.now() + (st.left | 0);
      if (st.wait) st.wait.until = Date.now() + (st.wait.left != null ? st.wait.left | 0 : CN.LOST);
      if (['ht', 'h2', 'ft', 'end'].includes(st.ph) && st.ties.some(t => !t.e1) && Date.now() - (NET.askedAt || 0) > 3000) { NET.askedAt = Date.now(); setTimeout(() => { if (NET) NET.s.need(); }, 300); }
      if (phaseChanged) { NET.pk = pk; netPhase(); }
      NET.s.save();
      netDraw(phaseChanged);
    }
    function netApplyInj() { const inj = NET.st.inj || {}; Object.values(NW().P).forEach(p => { p.inj = 0; p.ban = 0; }); for (const id in inj) { const p = NW().P[id]; if (p && Array.isArray(inj[id])) { p.inj = inj[id][0] | 0; p.ban = inj[id][1] | 0; } } }
    // every client, when a phase starts
    function netPhase() {
      const st = NET.st, my = st.mg[myId()];
      NW().me = my == null ? -1 : my;
      netApplyInj();
      if (st.ph === 'pick') {
        Object.values(NW().P).forEach(p => { p.cond = 100; });
        NET.my.ready = false;
        if (my != null) G.secret('boss.online');
        if (my != null && netInRound(my)) { S.form = NET.my.form; S.ment = NET.my.ment; S.style = NET.my.style; S.sel = autoPick(NW(), NW().T[my], S.form); sub = {}; G.sfx('join'); G.timer(() => { if (NET) netSendPick(false); }, 400); }
      }
      if (st.ph === 'ht') { NET.my.ht = { talk: -1, ment: S.ment, style: S.style, subs: [] }; NET.my.ready = false; if (my != null && netInRound(my) && !st.auto.includes(my)) G.sfx('beep'); }
      if (st.ph === 'h1' || st.ph === 'h2') { NET.seen = {}; if (st.ph === 'h1') G.note(2600, 0.3, 'sine'); }
      if (st.ph === 'end') netFinale();
      if (NET.watch < 0 || !st.ties[NET.watch] || st.ph === 'pick') NET.watch = netDefaultWatch();
    }
    const netInRound = c => NET.st.ties.some(t => (t.h === c || t.a === c));
    function netDefaultWatch() {
      const st = NET.st, my = st.mg[myId()];
      let i = st.ties.findIndex(t => t.h === my || t.a === my);
      if (i < 0) { const hum = new Set(Object.values(st.mg)); i = st.ties.findIndex(t => hum.has(t.h) || hum.has(t.a)); }
      return Math.max(0, i);
    }
    // ---- host: the cup itself
    function netStart() {
      const st = NET.st, s = NET.s;
      s.humans().forEach(p => { if (st.mg[p.id] == null && !s.gone.has(p.id) && !s.left.has(p.id)) st.mg[p.id] = netFreeClub(); });
      const hum = [...new Set(Object.values(st.mg))];
      if (hum.length < 2) return alertBox('Cup Night', 'You need at least two managers. Invite somebody!');
      const cpu = shuffle(Math.random, S.T.map(t => t.id).filter(i => !hum.includes(i))).sort((a, b) => S.T[b].rep - S.T[a].rep + (Math.random() - 0.5) * 10).slice(0, 8 - Math.min(8, hum.length));
      st.br = shuffle(Math.random, hum.slice(0, 8).concat(cpu));
      st.rd = 0; st.res = []; st.inj = {}; st.auto = []; st.champ = -1; st.rdy = []; st.wait = null; st.half = CN.HALF;
      netRound();
    }
    function netRound() {
      const st = NET.st;
      let teams = st.br;
      for (let r = 0; r < st.rd; r++) { const res = st.res.filter(x => x[0] === r); teams = res.map(x => x[6]); }
      st.ties = []; for (let i = 0; i + 1 < teams.length; i += 2) st.ties.push({ h: teams[i], a: teams[i + 1] });
      st.ph = 'pick'; st.ends = Date.now() + CN.PICK; st.rdy = []; st.wait = null; NET.Ms = []; NET.htp = {};
      Object.values(NW().P).forEach(p => { p.cond = 100; });
      netApplyInj();
      // last round's picks are a fine default, as long as nobody in them is now injured or banned
      for (const c in NET.picks) { const p = netValidPick(+c, NET.picks[c]); if (p) NET.picks[c] = p; else delete NET.picks[c]; }
      netBump(true);
    }
    // the managers who matter right now (their club is playing in this round and they're still here)
    function netNeed() {
      const st = NET.st, s = NET.s;
      return Object.keys(st.mg).map(Number).filter(id => { const c = st.mg[id]; return netInRound(c) && !st.auto.includes(c) && !s.gone.has(id) && !s.left.has(id) && s.humans().some(p => p.id === id); });
    }
    function netHostTick() {
      const st = NET.st; if (!st) return;
      const now = Date.now();
      if (st.ph === 'pick' || st.ph === 'ht') {
        const need = netNeed(), ready = need.every(id => st.rdy.includes(st.mg[id]));
        if (need.length && ready && st.ends - now > CN.READY) { st.ends = now + CN.READY; netBump(false); }
        if (now < st.ends) return;
        const lost = need.filter(id => NET.s.lost.has(id) && !st.rdy.includes(st.mg[id]));
        if (lost.length) {
          if (!st.wait || !lost.includes(st.wait.id)) { st.wait = { id: lost[0], until: now + (st.ph === 'pick' ? CN.LOST : CN.LOST / 2) }; NET.s.say(`Waiting for ${netNick(lost[0])} to reconnect...`, true); netBump(false); return; }
          if (now < st.wait.until) return;
        }
        st.wait = null;
        if (st.ph === 'pick') { netSim(true); st.ph = 'h1'; st.ends = now + CN.HALF; }
        else { const pens = netSim(false); st.ph = 'h2'; st.ends = now + CN.HALF + (pens ? 5000 : 0); }
        st.rdy = []; netBump(true);
      } else if (st.ph === 'h1' && now >= st.ends) { st.ph = 'ht'; st.ends = now + CN.HT; st.rdy = []; NET.htp = {}; netBump(true); }
      else if (st.ph === 'h2' && now >= st.ends) {
        st.ties.forEach(t => { st.res.push([st.rd, t.h, t.a, t.hs, t.as, t.pen || '', t.w]); });
        if (st.rd >= 2) { st.ph = 'end'; st.champ = st.ties[0].w; st.ends = 0; }
        else { st.ph = 'ft'; st.ends = now + CN.FT; }
        netBump(true);
      } else if (st.ph === 'ft' && now >= st.ends) { st.rd++; netRound(); }
    }
    // play a half of every tie (host only)
    function netSim(first) {
      const st = NET.st, w = NW(), nx = {}; let pens = false;
      st.ties.forEach((t, i) => {
        let M = NET.Ms[i];
        if (first || !M) {
          const picks = {};
          [t.h, t.a].forEach(c => { if (!st.auto.includes(c) && NET.picks[c] && Object.values(st.mg).includes(c)) picks[c] = NET.picks[c]; });
          M = newMatch(w, { id: i, day: 0, c: 'C', rd: st.rd, h: t.h, a: t.a }, { picks, cpu: true });
          M.h.auto = M.a.auto = true; // the assistant makes late changes for tired legs
          M.log.push({ min: 0, c: ['ko', st.rd === 2 ? 1 : 0], kind: '' });
          [M.h, M.a].forEach(sd => { const p = picks[sd.tid]; if (p && p.talk) { const [b, ok] = preTalkB(w, sd, w.T[sd === M.h ? t.a : t.h], p.talk); sd.boost = b; M.log.push({ min: 0, c: ['xt', sd.tid, 3 + p.talk, ok], kind: 'sub' }); } });
          for (let k = 0; k < 45; k++) stepMin(w, M, true);
          M.log.push({ min: 45, c: ['ht', M.h.goals, M.a.goals], kind: 'goal' });
          NET.Ms[i] = M; t.l1 = M.log.length; t.e1 = M.log.map(lineOut); t.fm = [M.h.form, M.a.form];
        } else {
          const l0 = M.log.length;
          [M.h, M.a].forEach(sd => {
            const h = NET.htp[sd.tid]; if (!h || !sd.user || st.auto.includes(sd.tid)) return;
            const op = sd === M.h ? M.a : M.h;
            const [b, ok] = htTalkB(h.talk, sd.goals - op.goals); sd.boost = b; M.log.push({ min: 45, c: ['xt', sd.tid, h.talk, ok], kind: 'sub' });
            sd.ment = h.ment; sd.style = h.style;
            h.subs.forEach(([si, on]) => { if (sd.subs >= 3 || si < 0 || si > 10 || sd.xi[si] == null || !sd.bench.includes(on)) return; const off = sd.xi[si]; sd.xi[si] = on; sd.bench = sd.bench.filter(x => x !== on); sd.subs++; if (!sd.played.includes(on)) sd.played.push(on); M.log.push({ min: 45, c: ['sub', sd.tid, on, off], kind: 'sub' }); });
          });
          M.log.push({ min: 46, c: ['h2'], kind: '' });
          for (let k = M.min; k < 90; k++) stepMin(w, M, true);
          M.log.push({ min: 90, c: ['ft', M.h.goals, M.a.goals], kind: 'goal' });
          t.hs = M.h.goals; t.as = M.a.goals;
          if (t.hs === t.as) { const p = shootout(w, M); pens = true; t.pen = p.win; t.ps = p.score; p.kicks.forEach(k => M.log.push({ min: 90, c: ['pen', k[0], k[1], k[2], k[3]], kind: 'card' })); M.log.push({ min: 90, c: ['penwin', p.win === 'h' ? t.h : t.a, Math.max(p.hs, p.as), Math.min(p.hs, p.as)], kind: 'goal' }); }
          t.w = t.hs > t.as || (t.hs === t.as && t.pen === 'h') ? t.h : t.a;
          t.e2 = M.log.slice(l0).map(lineOut); t.done = 1;
          [M.h, M.a].forEach(sd => { sd.reds.forEach(([id]) => { nx[id] = [0, 1]; }); sd.inj.forEach(id => { nx[id] = [1, 0]; }); });
        }
        const sx = sd => [sd.shots, sd.on, sd.corners, sd.fouls, sd.yel.length, sd.reds.length];
        t.sx = [Math.round(M.h.poss / Math.max(1, M.h.poss + M.a.poss) * 100)].concat(sx(M.h), sx(M.a));
      });
      if (!first) st.inj = nx; // last round's bans and knocks have been served; these are for the next round
      return pens;
    }
    function netFinale() {
      const st = NET.st; if (!st || NET.done === st.cid) return;
      NET.done = st.cid;
      const my = st.mg[myId()], champ = st.champ;
      const champId = +(Object.keys(st.mg).find(id => st.mg[id] === champ) || 0);
      if (my != null) recBump(r => { r.p++; if (my === champ) r.n++; });
      if (my === champ) { G.secret('boss.cupnight'); G.sfx('solve'); crowd(); } else G.sfx(my != null ? 'uhoh' : 'click');
      if (my != null) try { Net.send({ t: 'mpResult', sid: NET.s.rsid(), w: champId }); } catch (e) {}
    }

    // ---- what everybody sees
    function netLines(t) { return ((t.e1 || []).concat(NET.st.ph === 'h2' || NET.st.ph === 'ft' || NET.st.ph === 'end' ? t.e2 || [] : [])).map(lineIn).filter(Boolean); }
    function netMin() {
      const st = NET.st, now = Date.now();
      const HALF = st.half || CN.HALF;
      if (st.ph === 'h1') return clamp(Math.floor((1 - (NET.deadline - now) / HALF) * 46), 0, 45);
      if (st.ph === 'ht') return 45;
      if (st.ph === 'h2') { const dur = HALF + (st.ties.some(t => t.pen) ? 5000 : 0); return clamp(45 + Math.floor((1 - (NET.deadline - now) / dur) * 47), 45, 92); }
      if (st.ph === 'ft' || st.ph === 'end') return 99;
      return 0;
    }
    function netScore(t, min) { const L = netLines(t).filter(l => l.min <= min && l.c[0] === 'goal'); return [L.filter(l => l.side === 'h').length, L.filter(l => l.side === 'a').length]; }
    const netCtx = t => ({ h: t.h, a: t.a, final: NET.st.rd === 2 });
    const mgrOf = c => { const id = Object.keys(NET.st.mg).find(k => NET.st.mg[k] === c); return id ? netNick(+id) : ''; };
    const cdTxt = () => { const ms = Math.max(0, NET.deadline - Date.now()); const sc = Math.ceil(ms / 1000); return `${Math.floor(sc / 60)}:${String(sc % 60).padStart(2, '0')}`; };
    function netDraw(force) {
      if (!NET) return;
      const st = NET.st, key = st ? [st.ph, st.rd, st.cid, NET.watch, st.ph === 'lobby' || st.ph === 'pick' || st.ph === 'ft' || st.ph === 'end' ? st.v : '', isNarrow()].join('|') : 'wait';
      if (!force && key === NET.key && qs('.dg-boss-nb')) return netTick();
      if (st && st.ph === 'pick' && NET.key.startsWith('pick|') && !force && qs('.dg-boss-nb .dg-boss-tac')) { NET.key = key; netTopUpdate(); return netReadyRow(); }
      NET.key = key;
      const sc = qs('.dg-boss-nb') ? qs('.dg-boss-nb').scrollTop : 0;
      root.innerHTML = `<div class="dg-boss-nh"><span class="t">CUP NIGHT</span><div class="rd"></div><div class="cd" title="Time left"></div></div><div class="dg-boss-nb"></div>`;
      const body = qs('.dg-boss-nb');
      if (!st) body.innerHTML = `<div class="dg-boss-panel" style="text-align:center;padding:20px">${NET.s.resumed ? 'Rejoining the Cup Night...' : 'Dialling the host...'}<br><br>Downloading the fixtures at 3.6 KB/sec.</div>`;
      else if (st.ph === 'lobby') body.innerHTML = netLobbyHtml();
      else if (st.ph === 'pick') body.innerHTML = netPickHtml();
      else if (st.ph === 'end' || st.ph === 'ft') body.innerHTML = netResultsHtml();
      else body.innerHTML = netMatchHtml();
      netWire2(body);
      if (st && st.ph === 'pick' && sc) body.scrollTop = sc;
      netTopUpdate(); netTick(true);
    }
    function netTopUpdate() {
      const st = NET.st, rd = qs('.dg-boss-nh .rd'); if (!rd) return;
      const my = st ? st.mg[myId()] : null, w = st && st.wait;
      const sub2 = !st ? 'Connecting...' : w ? `${esc(netNick(w.id))} lost connection: waiting ${Math.max(0, Math.ceil((w.until - Date.now()) / 1000))}s, then auto-pilot` : st.ph === 'lobby' ? `${Object.keys(st.mg).length} manager${Object.keys(st.mg).length === 1 ? '' : 's'} ready to go &middot; ${NET.s.host ? 'you\'re the host' : 'host: ' + esc(netNick(NET.s.hostId))}` : st.ph === 'pick' ? 'Pick your team and your team talk!' : st.ph === 'h1' ? 'First half' : st.ph === 'ht' ? 'Half-time: team talks and subs' : st.ph === 'h2' ? 'Second half' : st.ph === 'ft' ? 'Full time. Next round coming up...' : 'The Cup Night is over';
      rd.innerHTML = `${st && st.ph !== 'lobby' ? RDN[st.rd] || '' : 'The Lobby'}${my != null && st && st.ph !== 'lobby' ? ` &middot; ${esc(S.T[my].sh)}${st.auto.includes(my) ? ' (auto-pilot)' : ''}` : st && st.ph !== 'lobby' && my == null ? ' &middot; watching' : ''}<small>${sub2}</small>`;
    }
    function netTick(first) {
      if (!NET || !NET.st) return;
      const st = NET.st, cd = qs('.dg-boss-nh .cd');
      if (cd) { const show = ['pick', 'h1', 'ht', 'h2', 'ft'].includes(st.ph); cd.style.visibility = show ? '' : 'hidden'; cd.textContent = cdTxt(); cd.classList.toggle('hurry', (st.ph === 'pick' || st.ph === 'ht') && NET.deadline - Date.now() < 10000); }
      if (st.wait) netTopUpdate();
      if (st.ph === 'h1' || st.ph === 'h2' || st.ph === 'ht') netMatchUpdate(first);
    }
    // the lobby: pick a club
    function netLobbyHtml() {
      const st = NET.st, s = NET.s, my = st.mg[myId()], taken = {};
      for (const id in st.mg) taken[st.mg[id]] = +id;
      const here = s.humans().filter(p => !s.left.has(p.id) && !s.gone.has(p.id));
      const ppl = here.map(p => `<div class="dg-boss-row" style="margin:2px 0">${st.mg[p.id] != null ? bdg(S.T[st.mg[p.id]]) : '<span class="dg-boss-bdg" style="background:#888"></span>'}<b>${esc(p.nick)}</b>${p.id === s.hostId ? ' <small>(host)</small>' : ''}${p.id === myId() ? ' <small>(you)</small>' : ''}: ${st.mg[p.id] != null ? esc(S.T[st.mg[p.id]].n) : '<i>choosing a club...</i>'}${s.lost.has(p.id) ? ' <small style="color:#a06000">(reconnecting)</small>' : ''}</div>`).join('');
      return `<div class="dg-boss-panel"><b style="font-size:13px">Tonight: the JackNet Cup!</b><br>An 8-club knockout: quarter-finals, semi-finals, then the final at Jackbley. Every manager picks a club; computer clubs fill the empty places. Before each round you get a minute to pick your team and give a team talk, and there's a half-time talk too. Ties are settled on the night (penalties if it's a draw).</div>
        <h3>Managers</h3>${ppl}
        <h3>Your club ${my != null ? `: <span style="color:#000">${esc(S.T[my].n)}</span>` : ''}</h3><div class="dg-boss-cg">${S.T.slice().sort((a, b) => b.rep - a.rep).map(t => { const who = taken[t.id]; const mineT = who === myId(); return `<button type="button" class="dg-boss-btn${mineT ? ' on' : ''}${who != null && !mineT ? ' taken' : ''}" data-n="club" data-x="${t.id}" ${who != null && !mineT ? 'disabled' : ''} title="${esc(t.n)}: reputation ${t.rep}">${bdg(t)}<span>${esc(t.n)}<small>${'&#9733;'.repeat(Math.max(1, Math.round(t.rep / 4)))}${who != null && !mineT ? ' &middot; ' + esc(netNick(who)) : ''}</small></span></button>`; }).join('')}</div>
        <div class="dg-boss-row" style="margin-top:8px">${s.host ? `<button type="button" class="dg-boss-btn go" data-n="start" ${here.length < 2 ? 'disabled' : ''}>Start the Cup Night!</button><button type="button" class="dg-boss-btn" data-n="invite">Invite someone</button>` : `<i>Waiting for ${esc(netNick(s.hostId))} to start the Cup Night...</i>`}<button type="button" class="dg-boss-btn" data-n="leave">Leave</button></div>
        ${s.host && here.length < 2 ? '<p style="font-size:11px;color:#444">You need at least one more manager. Click Invite someone, or wait: your name is up in the JackNet lobby.</p>' : ''}`;
    }
    function netBracketHtml() {
      const st = NET.st, cols = [];
      let teams = st.br;
      for (let r = 0; r < 3; r++) {
        const pairs = []; for (let i = 0; i + 1 < teams.length; i += 2) pairs.push([teams[i], teams[i + 1]]);
        while (pairs.length < [4, 2, 1][r]) pairs.push([null, null]);
        const res = st.res.filter(x => x[0] === r);
        cols.push(`<div class="col"><b>${RDN[r]}</b>${pairs.map(([h, a], i) => { const x = res.find(y => y[1] === h && y[2] === a); const cur = r === st.rd && st.ties[i] && st.ties[i].h === h; const line = (c, g, w) => c == null ? '<div><span style="color:#888">?</span></div>' : `<div class="${x ? (w ? 'w' : 'l') : ''}">${bdg(S.T[c])}<span>${esc(S.T[c].sh)}${mgrOf(c) ? ` <span class="hu">${esc(mgrOf(c))}</span>` : ''}</span><b>${x ? g : ''}</b></div>`; return `<div class="dg-boss-tie${cur && i === NET.watch ? ' on' : ''}" data-n="watch" data-x="${cur ? i : -1}">${line(h, x ? x[3] : '', x && x[6] === h)}${line(a, x ? x[4] + (x[5] ? ' p' : '') : '', x && x[6] === a)}</div>`; }).join('')}</div>`);
        teams = res.length === pairs.length ? res.map(y => y[6]) : [];
      }
      return `<div class="dg-boss-br">${cols.join('')}</div>`;
    }
    function netReadyRow() {
      const st = NET.st, el = qs('.dg-boss-nb .nrdy'); if (!el) return;
      el.innerHTML = Object.keys(st.mg).filter(id => netInRound(st.mg[id])).map(id => { const c = st.mg[id], r = st.rdy.includes(c), au = st.auto.includes(c); return `<span class="dg-boss-ready${r ? '' : ' no'}" title="${r ? 'Ready' : 'Still picking'}">${esc(netNick(+id))} (${esc(S.T[c].sh)}): ${au ? 'AUTO-PILOT' : r ? 'READY' : '...'}</span>`; }).join(' ');
    }
    function netPickHtml() {
      const st = NET.st, my = st.mg[myId()], t = st.ties.find(x => x.h === my || x.a === my);
      if (my == null || !t || st.auto.includes(my)) return `<div class="dg-boss-panel">${my != null && !t ? `<b>${esc(S.T[my].n)}</b> are out of the cup. Tel is consoling the kit man. You can watch the rest of the night!` : my != null ? 'Your club is on auto-pilot.' : 'You\'re watching tonight. Pull up a chair!'} The managers are picking their teams...</div><div class="nrdy" style="margin:4px 0"></div>${netBracketHtml()}<div class="dg-boss-row" style="margin-top:8px"><button type="button" class="dg-boss-btn" data-n="leave">Leave</button></div>`;
      const op = S.T[t.h === my ? t.a : t.h];
      return `<div class="dg-boss-panel">${bdg(S.T[t.h])}<b>${esc(S.T[t.h].n)}</b> v <b>${esc(S.T[t.a].n)}</b>${bdg(S.T[t.a])} &middot; ${RDN[st.rd]}${mgrOf(op.id) ? ` &middot; their manager: <b>${esc(mgrOf(op.id))}</b>` : ' &middot; a computer club'}<br><span style="font-size:11px">${esc(op.n)} like to play ${op.form}, ${STYLES[op.style == null ? 1 : op.style].toLowerCase()} style${mgrOf(op.id) ? ' (unless their manager changes it...)' : ''}.</span></div>
        <div class="dg-boss-row"><b>Team talk:</b><select data-n="talk" aria-label="Team talk">${TALKS.map(([n], i) => `<option value="${i}" ${NET.my.talk === i ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><button type="button" class="dg-boss-btn go" data-n="ready" ${NET.my.ready ? 'disabled' : ''}>${NET.my.ready ? 'Ready! Waiting for the others...' : 'I\'m ready!'}</button><button type="button" class="dg-boss-btn" data-n="leave">Leave</button></div>
        <div class="nrdy" style="margin:2px 0 6px"></div>
        ${vTactics(true)}`;
    }
    function netMatchHtml() {
      const st = NET.st, t = st.ties[NET.watch] || st.ties[0], H = S.T[t.h], A = S.T[t.a];
      return `<div class="dg-boss-sb" style="color:#fff"><div class="tm h">${bdg(H)}<span>${esc(isNarrow() ? H.sh : H.n)}</span></div><div class="sc">0-0</div><div class="tm a"><span>${esc(isNarrow() ? A.sh : A.n)}</span>${bdg(A)}</div><div class="clk">0'</div></div>
        <div class="dg-boss-hrow"><div class="dg-boss-hp${OPT.pitch ? '' : ' off'}"></div><div class="dg-boss-com" style="color:#fff">The teams are coming out...</div></div>
        <div class="dg-boss-tabs" style="margin-top:4px">${st.ties.map((x, i) => `<button type="button" class="dg-boss-btn ${i === NET.watch ? 'on' : ''}" data-n="watch" data-x="${i}" title="Watch this tie">${esc(S.T[x.h].sh)} v ${esc(S.T[x.a].sh)}</button>`).join('')}</div>
        <div class="dg-boss-mp net" style="padding:0;min-height:220px"><div class="dg-boss-pane on" style="min-height:200px"><div class="ph">Commentary</div><div class="evs"></div></div><div class="dg-boss-pane fax dg-boss-fax on"><div class="scs"></div></div></div>
        <div class="nht"></div>`;
    }
    function netResultsHtml() {
      const st = NET.st, my = st.mg[myId()];
      const champ = st.ph === 'end' && st.champ >= 0 ? S.T[st.champ] : null;
      const mt = my != null && st.ties.find(t => t.h === my || t.a === my), through = mt && mt.w === my;
      const verdict = !mt || champ ? '' : `<div class="dg-boss-tip" style="font-size:13px"><b>${through ? 'THROUGH!' : 'Knocked out.'}</b> ${through ? `${esc(S.T[my].n)} are into the ${RDN[st.rd + 1] || 'next round'}! Tel is doing a little dance in his shell suit.` : `${esc(S.T[my].n)} are out. Tel is crying into his shell suit. You can still watch the rest of the night.`}</div>`;
      return `${verdict}${champ ? `<div class="dg-boss-champ">&#127942;<b>${esc(champ.n)}</b>win the JackNet Cup!${mgrOf(champ.id) ? `<br>Manager: <b>${esc(mgrOf(champ.id))}</b>${champ.id === my ? ' (THAT\'S YOU!)' : ''}` : '<br>(a computer club: the humans have some explaining to do)'}</div>` : `<div class="dg-boss-panel"><b>${RDN[st.rd]} results</b><br>${st.ties.map(t => `${bdg(S.T[t.h])}${esc(S.T[t.h].sh)} ${t.hs}-${t.as} ${esc(S.T[t.a].sh)}${bdg(S.T[t.a])}${t.pen ? ` (${esc(S.T[t.w].sh)} win ${t.ps} on pens)` : ''}`).join('<br>')}</div>`}
        ${netBracketHtml()}
        <div class="dg-boss-row" style="margin-top:8px">${st.ph === 'end' && NET.s.host ? '<button type="button" class="dg-boss-btn go" data-n="again">Another Cup Night</button>' : ''}${st.ph === 'end' ? '<button type="button" class="dg-boss-btn" data-n="hof">Hall of Fame</button>' : ''}<button type="button" class="dg-boss-btn" data-n="leave">Leave</button></div>`;
    }
    function netMatchUpdate(first) {
      const st = NET.st, t = st.ties[NET.watch] || st.ties[0], body = qs('.dg-boss-nb'); if (!t || !body || !qs('.dg-boss-nb .evs')) return;
      const min = netMin(), lines = netLines(t), shown = lines.filter(l => l.min <= min), ctx = netCtx(t);
      const [hg, ag] = netScore(t, min);
      const sc = body.querySelector('.sc'); if (sc) sc.textContent = hg + '-' + ag;
      const clk = body.querySelector('.clk'); if (clk) clk.textContent = Math.min(90, min) + "'";
      const key = shown.length + ':' + NET.watch;
      if (!t.e1) { body.querySelector('.dg-boss-com').textContent = 'Waiting for the pictures from the ground...'; }
      if (body._k !== key || first) {
        const fresh = shown.slice(body._n && body._w === NET.watch ? body._n : shown.length);
        body._k = key; body._n = shown.length; body._w = NET.watch;
        const last = shown[shown.length - 1], com = body.querySelector('.dg-boss-com');
        if (last) { com.textContent = lineText(S, last, ctx); com.className = 'dg-boss-com' + (last.c[0] === 'goal' ? ' goal' : last.kind === 'card' ? ' card' : ''); com.style.color = '#fff'; }
        body.querySelector('.evs').innerHTML = shown.slice().reverse().map(l => `<div class="dg-boss-ev ${l.kind}"><b>${Math.min(90, l.min)}'</b>${esc(lineText(S, l, ctx))}</div>`).join('');
        if (!body._pitch || !body._pitch.cv || !body._pitch.cv.isConnected) { const hp = body.querySelector('.dg-boss-hp'); if (hp) { hp.innerHTML = ''; body._pitch = mountPitch(hp, S.T[t.h], S.T[t.a], t.fm && FORMS[t.fm[0]] ? t.fm[0] : '4-4-2', t.fm && FORMS[t.fm[1]] ? t.fm[1] : '4-4-2'); body._pitch.cv = hp.querySelector('canvas'); } }
        const catchUp = first || fresh.length > 8; // (a reload or a late packet: no fanfare for old news)
        const big = fresh.slice().reverse().find(L => ['goal', 'save', 'post', 'wide', 'corner', 'yel', 'red', 'y2', 'build', 'bl', 'ht', 'ft'].includes(L.c[0]));
        if (big && body._pitch && !catchUp) body._pitch.ev(big);
        if (fresh.some(l => l.c[0] === 'goal') && !catchUp) { const my = st.mg[myId()], g = fresh.filter(l => l.c[0] === 'goal').pop(); const scorer = g.side === 'h' ? t.h : t.a; G.sfx(scorer === my ? 'solve' : (t.h === my || t.a === my) ? 'uhoh' : 'click'); if (scorer === my) crowd(); }
        if (body._pitch && t.sx) body._pitch.poss((t.sx[0] || 50) / 100);
        const fax = body.querySelector('.scs');
        if (fax) fax.innerHTML = faxHtml(st.ties.map(x => { const [a1, b1] = netScore(x, min); return { h: x.h, a: x.a, hs: a1, as: b1, fresh: netLines(x).some(l => l.c[0] === 'goal' && l.min <= min && l.min > min - 4), me: x.h === st.mg[myId()] || x.a === st.mg[myId()] }; }), Math.min(90, min), 'JACKNET CUP ' + RDN[st.rd].toUpperCase());
      }
      netHtPanel();
    }
    // half-time: the team talk, a tactics change and up to three subs
    function netHtPanel() {
      const st = NET.st, box = qs('.dg-boss-nb .nht'); if (!box) return;
      const my = st.mg[myId()], t = st.ties.find(x => x.h === my || x.a === my);
      const show = st.ph === 'ht' && my != null && t && !st.auto.includes(my);
      if (!show) { if (box.innerHTML) box.innerHTML = ''; return; }
      if (box.querySelector('.dg-boss-htp')) { const b = box.querySelector('[data-n=htready]'); if (b) { b.disabled = NET.my.ready; b.textContent = NET.my.ready ? 'Sent! Waiting...' : 'Send to the dressing room'; } return; }
      const h = NET.my.ht || (NET.my.ht = { talk: -1, ment: S.ment, style: S.style, subs: [] });
      const pick = NET.my.lastSel || S.sel, xi = pick.slice(0, 11), bench = pick.slice(11).filter(x => x != null && S.P[x]);
      const [hg, ag] = netScore(t, 45), diff = (t.h === my ? hg - ag : ag - hg);
      box.innerHTML = `<div class="dg-boss-htp"><div class="dg-boss-dt">Half-Time: ${esc(S.T[t.h].sh)} ${hg}-${ag} ${esc(S.T[t.a].sh)}</div><div class="dg-boss-dc">
        ${diff > 0 ? 'The lads look pleased with themselves.' : diff < 0 ? 'Nobody will look you in the eye.' : 'It\'s all to play for.'} What do you say?
        <div class="dg-boss-row">${['"Well done, lads."', '"I want MORE!"', 'THE HAIRDRYER', 'Let Gubbinz do it'].map((n, i) => `<button type="button" class="dg-boss-btn ${h.talk === i ? 'on' : ''}${i === 2 ? ' red' : ''}" data-n="htt" data-x="${i}">${n}</button>`).join('')}</div>
        <div class="dg-boss-row"><b>Mentality:</b>${MENTN.map((n, i) => `<button type="button" class="dg-boss-btn ${h.ment === i ? 'on' : ''}" data-n="htm" data-x="${i}">${n}</button>`).join('')}</div>
        <div class="dg-boss-row"><b>Style:</b>${STYLES.map((n, i) => `<button type="button" class="dg-boss-btn ${h.style === i ? 'on' : ''}" data-n="hts" data-x="${i}" title="${esc(STYLED[i])}">${n}</button>`).join('')}</div>
        <div class="dg-boss-row"><b>Sub:</b><select data-n="hoff" aria-label="Coming off"><option value="-1">Who's coming off?</option>${xi.map((id, i) => id != null && S.P[id] ? `<option value="${i}">${esc(S.P[id].l)} (${FORMS[S.form][i][0]})</option>` : '').join('')}</select><select data-n="hon" aria-label="Going on"><option value="-1">Who's going on?</option>${bench.map(id => `<option value="${id}">${esc(S.P[id].l)} (${posStr(S.P[id])})</option>`).join('')}</select><button type="button" class="dg-boss-btn" data-n="hsub">Add</button></div>
        <div class="hsubs" style="font-size:11px">${h.subs.map(([i, on]) => `${esc(S.P[xi[i]] ? S.P[xi[i]].l : '?')} off, ${esc(S.P[on] ? S.P[on].l : '?')} on`).join('<br>') || '<i>No subs.</i>'}</div>
        <div class="dg-boss-db" style="padding:6px 0 0"><button type="button" class="dg-boss-btn go" data-n="htready" ${NET.my.ready ? 'disabled' : ''}>${NET.my.ready ? 'Sent! Waiting...' : 'Send to the dressing room'}</button></div></div></div>`;
    }
    function netSendPick(ready) {
      const st = NET.st, my = st && st.mg[myId()]; if (my == null || st.ph !== 'pick') return;
      fixSelQuiet();
      NET.my.form = S.form; NET.my.ment = S.ment; NET.my.style = S.style; NET.my.lastSel = S.sel.slice();
      const d = { k: 'pick', rd: st.rd, sel: S.sel.slice(0, 16), form: S.form, ment: S.ment, style: S.style, talk: NET.my.talk, ready: !!ready };
      if (NET.s.host) netMsg(d, myId()); else NET.s.send(d, NET.s.hostId);
    }
    function netSendHt(ready) {
      const st = NET.st, my = st && st.mg[myId()]; if (my == null || st.ph !== 'ht' || !NET.my.ht) return;
      const h = NET.my.ht, d = { k: 'ht', rd: st.rd, talk: Math.max(0, h.talk), ment: h.ment, style: h.style, subs: h.subs, ready: !!ready };
      if (NET.s.host) netMsg(d, myId()); else NET.s.send(d, NET.s.hostId);
    }
    // one listener for the Cup Night screens
    function netWire2(body) {
      body.querySelectorAll('[data-ts]').forEach(el => el.addEventListener('click', () => {
        const k = el.dataset.ts;
        if (!sub.ts) { sub.ts = k; G.sfx('click'); netDraw(true); return; }
        if (sub.ts === k) { sub.ts = null; netDraw(true); return; }
        swapSel(sub.ts, k); sub.ts = null; G.sfx('turn'); netDraw(true); netPickChanged();
      }));
      const tk = body.querySelector('[data-n=talk]'); if (tk) tk.addEventListener('change', () => { NET.my.talk = +tk.value; netPickChanged(); });
    }
    function netPickChanged() { G.clear(NET.sendT); NET.sendT = G.timer(() => { if (NET) netSendPick(NET.my.ready); }, 700); }
    root.addEventListener('click', e => {
      if (!NET) return;
      const el = e.target.closest('[data-n]'); if (!el || !root.contains(el) || el.disabled) return;
      const n = el.dataset.n, x = el.dataset.x, st = NET.st;
      if (n === 'leave') return modal('Cup Night', 'Leave the Cup Night?' + (st && st.ph !== 'lobby' && st.mg[myId()] != null && st.ph !== 'end' ? ' Your club will go on auto-pilot.' : ''), [['Leave', netLeave, 'red'], ['Cancel']]);
      if (n === 'invite') return MP.pick('boss.online');
      if (n === 'hof') return hallOfFame();
      if (!st) return;
      G.sfx('click');
      if (n === 'club' && st.ph === 'lobby') { const d = { k: 'club', tid: +x }; if (NET.s.host) netMsg(d, myId()); else { NET.s.send(d, NET.s.hostId); st.mg[myId()] = +x; netDraw(true); } }
      else if (n === 'start' && NET.s.host && st.ph === 'lobby') netStart();
      else if (n === 'again' && NET.s.host && st.ph === 'end') { const mg = {}; NET.s.humans().forEach(p => { if (st.mg[p.id] != null && !NET.s.left.has(p.id) && !NET.s.gone.has(p.id)) mg[p.id] = st.mg[p.id]; }); NET.st = { v: st.v + 1, cid: Math.random().toString(36).slice(2, 8), ph: 'lobby', rd: 0, ends: 0, mg, br: [], ties: [], res: [], rdy: [], auto: [], wait: null, inj: {}, champ: -1 }; NET.picks = {}; netBump(true); }
      else if (n === 'ready' && st.ph === 'pick') { NET.my.ready = true; netSendPick(true); G.sfx('button'); netDraw(true); }
      else if (n === 'watch' && +x >= 0 && st.ties[+x]) { NET.watch = +x; const b = qs('.dg-boss-nb'); if (b) { b._pitch = null; } netDraw(true); }
      else if (n === 'htt' || n === 'htm' || n === 'hts') { const h = NET.my.ht; if (!h || NET.my.ready) return; h[{ htt: 'talk', htm: 'ment', hts: 'style' }[n]] = +x; el.parentNode.querySelectorAll('.dg-boss-btn').forEach(b => b.classList.toggle('on', b === el)); netSendHt(false); }
      else if (n === 'hsub') { const h = NET.my.ht; if (!h || NET.my.ready) return; const off = +qs('[data-n=hoff]').value, on = +qs('[data-n=hon]').value; if (off < 0 || on < 0) return alertBox('Substitution', 'Pick who\'s coming off and who\'s going on.'); if (h.subs.length >= 3) return alertBox('Substitutions', 'Three subs. It\'s 1999.'); if (h.subs.some(z => z[0] === off || z[1] === on)) return; h.subs.push([off, on]); const box = qs('.nht'); if (box) box.innerHTML = ''; netHtPanel(); netSendHt(false); }
      else if (n === 'htready') { const h = NET.my.ht; if (!h) return; if (h.talk < 0) h.talk = 1; NET.my.ready = true; netSendHt(true); netHtPanel(); }
    });
    if (window.MP && MP.hook) MP.hook('mp.boss', G.w, { session: s => netSession(s) });

    // ---- a test hook (for the robot that plays it in testing): the game's own functions, no cheats in the real UI
    G._test = {
      get S() { return S; }, get NET() { return NET; }, get live() { return live; }, get view() { return view; },
      demo(v) { G.demo = !!v; if (S && qs('.dg-boss-main')) render(); return G.demo; },
      cont, render, awards, title, hallOfFame, playOnline,
      // balance check: n seasons for club `club` with a given mentality/style -> average finish, goals for/against
      bench(n, club, ment, style) {
        let pos = 0, gf = 0, ga = 0, goals = 0, games = 0, draws = 0;
        for (let k = 0; k < n; k++) {
          const W = genWorld(1000 + k * 7919, club, 'Bench'); W.ment = ment; W.style = style;
          while (W.day < SEASON_END) { W.day++; daily(W, true); const fx = todays(W); if (fx.length) { fx.forEach(f => { const M = newMatch(W, f); for (let i = 0; i < 90; i++) stepMin(W, M, false); finish(W, M); if (f.c === 'L') { goals += f.hs + f.as; games++; if (f.hs === f.as) draws++; } }); afterFixtures(W, true); } }
          const tb = table(W), r = tb.find(x => x.id === club); pos += tb.indexOf(r) + 1; gf += r.f; ga += r.a;
        }
        return { pos: +(pos / n).toFixed(2), gf: +(gf / n).toFixed(1), ga: +(ga / n).toFixed(1), gpg: +(goals / games).toFixed(2), draws: +(draws / games).toFixed(2) };
      },
      fastCup() { Object.assign(CN, { PICK: 25000, HALF: 9000, HT: 9000, FT: 5000, LOST: 16000 }); return CN; },
      // fast-forward the calendar (every match, ours included, played by the engine with no match screen)
      skipTo(day) {
        if (!S || live || NET) return false;
        while (S.day < day && !S.over) {
          S.day++; daily(S, false);
          if (G.demo && S.day >= DEMO_END) break;
          const fx = todays(S);
          if (fx.length) { fx.forEach(f => { const M = newMatch(S, f); for (let i = 0; i < 90; i++) stepMin(S, M, false); finish(S, M); if (f.h === S.me || f.a === S.me) S.played++; }); afterFixtures(S, false); }
          if (S.day >= SEASON_END) S.over = true;
        }
        render(); return S.day;
      },
    };

    // ---- go
    if (arg === 'callum') { S = migrate(callumCareer()); slot = 'C'; shell(); }
    else {
      const d = AS.load();
      // (a demo career that has reached New Year waits on the title screen for the full version)
      if (d && d.S && d.S.v === 1 && d.S.T && !(G.demo && d.S.day >= DEMO_END)) resume(d); else title();
    }
  });
})();
