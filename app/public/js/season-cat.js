/* season-cat: the 1999 seasonal event catalogue, shared by Node (mods/season.js) and the browser (js/season.js).
 * Data only: windows, phases, objectives and rewards. Dates are MM-DD in the loop year (always 1999).
 * Text may use Cast templates ({me}, {sister}); the browser fills them, the server never shows them.
 * Rewards are Rupees paid by the server only (capped econ source 'season'), once per account per event per loop.
 * A "loop" is one real year of play (the 1999 loop has not glitched round yet: docs/EVENTS-1999.md 4.14).
 * Daylight: sun(mm, dd) gives rough sunrise/sunset for a generic English garden, in clock time, with the 1999
 * British Summer Time rule (28 Mar to 31 Oct). No place is ever named. */
(function (root) {
  'use strict';
  const md = s => { const [m, d] = String(s).split('-').map(Number); return m * 100 + d; };
  const DOW = (mm, dd) => new Date(Date.UTC(1999, mm - 1, mm === 2 && dd === 29 ? 28 : dd)).getUTCDay();

  // ---- the events. Keep ids stable: they are save keys.
  const EVENTS = [
    {
      id: 'halloween99', web: 'halloween', name: 'Halloween', from: '10-24', to: '11-01', peak: '10-31', endHour: 12,
      phases: [{ id: 'lead', from: '10-24' }, { id: 'day', from: '10-31' }, { id: 'tail', from: '11-01' }],
      needs: { chapter: 2 }, decor: 'halloween', pack: 'js/season-halloween.js',
      treatHours: [17, 21], // trick-or-treaters knock from 17:00 to 20:59 (game hour) on the day
      jump: [
        { id: 'before', label: 'Before Halloween (Sun 10 Oct, 14:00)', date: '10-10', hour: 14 },
        { id: 'lead', label: 'Halloween lead-up (Wed 27 Oct, 16:00)', date: '10-27', hour: 16 },
        { id: 'afternoon', label: 'Halloween afternoon (Sun 31 Oct, 15:00)', date: '10-31', hour: 15 },
        { id: 'peak', label: 'Halloween night (Sun 31 Oct, 18:00)', date: '10-31', hour: 18 },
        { id: 'tail', label: 'The morning after (Mon 1 Nov, 9:00)', date: '11-01', hour: 9 },
        { id: 'after', label: 'All over (Tue 2 Nov, 14:00)', date: '11-02', hour: 14 },
      ],
      objectives: [
        { id: 'hw-pumpkin', text: "Mom's got a pumpkin. Help carve it.", hint: 'Kitchen table: spread the newspaper, cut the lid, scoop it out, draw a face, carve it, then the tea-light. Carry it out to the front step.',
          phases: ['lead', 'day'], reward: 20, ordered: true, gap: 1.2,
          steps: ['paper', 'lid', 'scoop', 'face', 'carve', 'candle', 'place'] },
        { id: 'hw-decorate', text: "Put up {sister}'s decorations.", hint: "{sister}'s box is in the hall. E carries each one to a glowing spot: a bat, a cobweb, a spider, a paper lantern and a ghost.",
          phases: ['lead', 'day'], reward: 10, gap: 1, steps: ['bat', 'web', 'spider', 'lantern', 'ghost'] },
        { id: 'hw-lights', text: "Put the porch light on before 5 o'clock.", hint: "The switch is by the front door. Mom's rule: light on means we're open for trick-or-treaters.",
          phases: ['day'], reward: 5, steps: ['on'] },
        { id: 'hw-bowl', text: 'Fill the sweets bowl on the hall table.', hint: 'The tin of sweets is in the cupboard under the stairs. E carries it to the bowl on the hall table.',
          phases: ['day'], reward: 10, steps: ['fill'] },
        { id: 'hw-treat', text: 'Answer the door to 5 trick-or-treaters.', hint: 'When they knock: open the front door, hold the sweets bowl (E) and press F to hand out. Mind what they ask for.',
          phases: ['day'], reward: 20, count: 5, bonus: { at: 10, amt: 10 } },
        { id: 'hw-clean', text: 'Clear up the sweet wrappers.', hint: 'Last night left wrappers all over the hall. E picks each one up; put them in the kitchen bin.',
          phases: ['tail'], reward: 5, gap: .6, steps: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'] },
      ],
      // fun-size parody sweets (fictional names). nuts/choc flags drive the kids' requests.
      sweets: [
        { id: 'choc', name: 'Choc Bits', note: 'with nuts', nuts: true, choc: true, col: '#6a3a1e', wrap: '#c8202a' },
        { id: 'fang', name: 'Fizzy Fangs', note: 'fizzy', col: '#f2f2ea', wrap: '#2a8a3a' },
        { id: 'dab', name: 'Sherbet Dib-Dabs', note: 'sherbet', col: '#f6e27a', wrap: '#e6a51a' },
        { id: 'eye', name: 'Jelly Eyeballs', note: 'jelly', col: '#e8e8e0', wrap: '#7a2aa8' },
        { id: 'toff', name: 'Toffee Chewers', note: 'toffee', choc: false, col: '#b0743a', wrap: '#1a4aa8' },
        { id: 'slug', name: 'Sour Slugs', note: 'sour', col: '#7ad04a', wrap: '#e0e020' },
      ],
      fill: [8, 8, 8, 8, 8, 8], // one pour from the tin; the tin holds two pours (Dad eats one Choc Bit)
      tinPours: 2, maxGroups: 12, costumes: ['ghost', 'witch', 'skeleton', 'wizard', 'dragon', 'pumpkin', 'mummy', 'bat', 'spacecadet'],
    },
    {
      // Bonfire Night: catalogued (window, phases, jump) so the engine and owner tools know it; content comes next.
      id: 'bonfire99', web: 'bonfire', name: 'Bonfire Night', from: '11-01', to: '11-06', peak: '11-05', soon: true,
      phases: [{ id: 'lead', from: '11-01' }, { id: 'day', from: '11-05' }, { id: 'tail', from: '11-06' }],
      needs: { chapter: 2 }, decor: null, pack: null,
      jump: [{ id: 'peak', label: 'Bonfire Night (Fri 5 Nov, 19:00) - coming soon', date: '11-05', hour: 19 }],
      objectives: [],
    },
  ];
  const byId = Object.fromEntries(EVENTS.map(e => [e.id, e]));
  for (const e of EVENTS) { e.objById = Object.fromEntries(e.objectives.map(o => [o.id, o])); e.sweetById = Object.fromEntries((e.sweets || []).map(s => [s.id, s])); }

  // ---- which events are on: today = { mm, dd, hour }
  function phaseOf(e, t) {
    const n = t.mm * 100 + t.dd;
    if (n < md(e.from) || n > md(e.to)) return null;
    if (e.endHour != null && n === md(e.to) && t.hour >= e.endHour) return null;
    if (e.startHour != null && n === md(e.from) && t.hour < e.startHour) return null;
    let ph = null; for (const p of e.phases) if (n >= md(p.from)) ph = p.id;
    return ph;
  }
  function active(t) { return EVENTS.map(e => ({ e, phase: phaseOf(e, t) })).filter(x => x.phase); }
  // a day either side (time zones): the server accepts a window edge that the visitor's own clock has reached
  function near(e, t) {
    if (phaseOf(e, t)) return phaseOf(e, t);
    for (const k of [-1, 1]) { const d = new Date(Date.UTC(1999, t.mm - 1, t.dd + k)); const p = phaseOf(e, { mm: d.getUTCMonth() + 1, dd: d.getUTCDate(), hour: 11 }); if (p) return p; }
    return null;
  }

  // ---- daylight. Day of year -> solar declination and equation of time (a classic approximation, a few minutes out).
  function bst(mm, dd) { const n = mm * 100 + dd; return n >= 328 && n < 1031; } // 1999: clocks forward 28 Mar, back 31 Oct
  function sun(mm, dd) {
    const doy = Math.round((Date.UTC(1999, mm - 1, dd) - Date.UTC(1999, 0, 0)) / 864e5);
    const R = Math.PI / 180, lat = 52 * R, dec = -23.44 * R * Math.cos(2 * Math.PI / 365 * (doy + 10));
    const c = (Math.sin(-0.833 * R) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, c))) / R / 15, B = 2 * Math.PI * (doy - 81) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B), noon = 12.1 - eot / 60 + (bst(mm, dd) ? 1 : 0);
    return { rise: noon - w, set: noon + w, bst: bst(mm, dd) };
  }

  const cat = { EVENTS, byId, md, DOW, phaseOf, active, near, sun, bst, version: 1 };
  if (typeof module !== 'undefined' && module.exports) module.exports = cat;
  else root.SeasonCat = cat;
})(typeof window !== 'undefined' ? window : globalThis);
