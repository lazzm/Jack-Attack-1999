/* SOUL SABRE (Dreamcast, in Jack's room): a weapons fighter in a ring. Nine fighters with swords, an axe, a staff, a
 * rapier, twin daggers, a spear and a frying pan (plus MIMIC, hidden, and LORD GLOOM, the boss), nine stages over water,
 * lava and clouds, RING OUTS, 8-way running, Guard Impacts, Arcade (story, rival, boss, an ending each), Versus CPU,
 * Survival, Time Attack and Training. Clean and bright at 640x480 with long glowing weapon trails and real shadows.
 * The engine is js/rm-g-fightkit.js (shared with TEKNO FIST): this file is the cast, their moves, the stages and the tunes.
 * Controls: A (Z) horizontal slash (catches sidesteps), B (X) vertical slash (big, straight), X (C) kick, Y (V) guard
 * (hold; with Down: crouch guard). Forward + guard just before a hit: GUARD IMPACT. A+Y or B+Y: throws.
 * Secrets: rm.duel.ring (in rm-cat.js), rm.duel.gloom (beat Lord Gloom in Arcade), rm.duel.impact (3 Guard Impacts in a match).
 * The save (rm.dc.duel, v1): options, unlocks, endings, the high-score table. Everything is original and made in code. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const SECRETS = [['rm.duel.gloom', 'Dawn Breaker', 'Beat the lord of the endless night in Soul Sabre.'], ['rm.duel.impact', 'Impact!', 'Knock three attacks aside in one Soul Sabre fight.']];
  try { for (const [id, n, h] of SECRETS) if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {}
  const kit = (window.Apps && Apps.load ? Apps.load('js/rm-g-fightkit.js') : Promise.reject(new Error('no loader'))).catch(e => { console.error(e); });
  let CFG = null;
  const NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const mel = s => s.trim().split(/\s+/).map(t => t === '.' ? 0 : t === '-' ? -1 : (NN[t[0]] + (t[1] === '#' ? 1 : t[1] === 'b' ? -1 : 0) + 12 * (+t.slice(-1) + 1)));

  function build() {
    const RF = window.RmFight, PP = RF.PP, POSE = RF.POSE, PT = RF.PT, shade = RF.shade;
    const P = o => PP(o);
    const M = o => Object.assign({ kind: 'w', ac: 4, push: 0.03 }, o);
    const legs = { hl: [0.4, 0.1], kl: 0.45, hr: [-0.3, 0.12], kr: 0.35 };
    const low = { hl: [1.3, 0.3], kl: 2.0, hr: [0.7, 0.25], kr: 1.9 };
    const L = o => Object.assign({}, legs, o), D = o => Object.assign({}, low, o);
    const hA = P(L({ y: -0.1, lean: 0.05, twist: 1.2, sl: [0.6, 0.4], el: 1.2, sr: [1.5, 0.9, -0.4], er: 0.4 }));
    const hB = P(L({ y: -0.12, lean: 0.2, twist: -1.1, spin: -0.3, sl: [0.6, 0.5], el: 1.2, sr: [1.5, 0.1, 1.0], er: 0.1, fw: 0.1 }));
    const h2A = P(L({ y: -0.12, lean: 0.15, twist: -1.0, sl: [0.6, 0.5], el: 1.2, sr: [1.5, 0.3, 1.1], er: 0.2 }));
    const h2B = P(L({ y: -0.1, lean: 0.1, twist: 1.1, spin: 0.3, sl: [0.6, 0.4], el: 1.2, sr: [1.5, 1.1, -0.6], er: 0.3, fw: 0.05 }));
    const vA = P(L({ y: -0.04, lean: -0.25, twist: 0.2, sl: [0.8, 0.3], el: 1.2, sr: [3.0, 0.1], er: 0.4 }));
    const vB = P({ y: -0.2, lean: 0.5, twist: -0.1, sl: [0.6, 0.4], el: 1.0, sr: [0.9, 0.05], er: 0.1, hl: [0.7, 0.1], kl: 0.7, hr: [-0.45, 0.12], kr: 0.3, fw: 0.25 });
    const kA = P({ y: -0.05, lean: -0.1, sl: [0.8, 0.4], el: 1.4, sr: [0.9, 0.3], er: 0.7, hl: [0.2, 0.05], kl: 0.3, hr: [0.9, 0.05], kr: 1.6 });
    const kB = P({ y: -0.04, lean: -0.35, sl: [0.8, 0.5], el: 1.3, sr: [0.8, 0.4], er: 0.6, hl: [0.1, 0.05], kl: 0.25, hr: [1.55, 0.05], kr: 0.05, fr: -0.6 });
    const overhead = P({ y: -0.04, lean: -0.35, sl: [3.0, 0.1], el: 0.3, sr: [3.0, 0.1], er: 0.3, hl: [0.4, 0.1], kl: 0.45, hr: [-0.3, 0.12], kr: 0.35 });
    const chop = P({ y: -0.3, lean: 0.75, sl: [0.9, 0.1], el: 0.1, sr: [0.9, 0.1], er: 0.1, hl: [0.8, 0.1], kl: 0.9, hr: [-0.5, 0.1], kr: 0.3, fw: 0.3 });
    const twirl = P({ y: -0.05, sl: [1.4, 1.2], el: 0.3, sr: [1.5, 1.2], er: 0.2, hl: [0.3, 0.2], kl: 0.3, hr: [-0.3, 0.2], kr: 0.3 });
    const thrust = P({ y: -0.28, lean: 0.6, twist: -0.3, sl: [0.5, 0.6], el: 0.6, sr: [1.6, 0.0], er: 0.0, hl: [0.9, 0.1], kl: 0.6, hr: [-0.8, 0.1], kr: 0.1, fw: 0.4 });
    const base = [
      M({ id: 'hs', n: 'SWEEPING SLASH', btn: 'a', su: 10, ac: 5, re: 14, dmg: 9, rng: 2.3, ht: 'h', track: true, next: { a: 'hs2' }, A: hA, B: hB }),
      M({ id: 'hs2', n: 'RETURN SLASH', btn: 'a', chainOnly: true, su: 9, ac: 5, re: 18, dmg: 9, rng: 2.3, ht: 'h', track: true, A: h2A, B: h2B }),
      M({ id: 'vs', n: 'CLEAVER', btn: 'b', su: 14, ac: 4, re: 18, dmg: 13, rng: 2.4, ht: 'm', next: { b: 'vs2' }, A: vA, B: vB }),
      M({ id: 'vs2', n: 'DOUBLE CLEAVER', btn: 'b', chainOnly: true, su: 13, ac: 4, re: 22, dmg: 12, rng: 2.4, ht: 'm', kd: true, A: vA, B: vB }),
      M({ id: 'kick', n: 'BOOT', btn: 'x', su: 8, ac: 4, re: 12, dmg: 7, rng: 1.45, ht: 'm', push: 0.1, kind: 'p', trail: 'ftR', A: kA, B: kB }),
      M({ id: 'lowh', n: 'ANKLE SLICE', btn: 'a', dir: 'd', su: 12, ac: 5, re: 18, dmg: 8, rng: 2.2, ht: 'l', track: true, crush: 'high', A: P(D({ y: -0.4, lean: 0.4, twist: 1.1, sl: [0.6, 0.4], el: 1.0, sr: [1.0, 0.9], er: 0.3 })), B: P(D({ y: -0.45, lean: 0.55, twist: -1.0, sl: [0.6, 0.4], el: 1.0, sr: [0.9, 0.1, 0.9], er: 0.1 })) }),
      M({ id: 'rise', n: 'SKY RISER', btn: 'b', dir: 'd', su: 15, ac: 4, re: 24, dmg: 12, rng: 2.0, ht: 'm', launch: true, A: P(D({ y: -0.4, lean: 0.5, sl: [0.6, 0.4], el: 1.0, sr: [0.2, 0.1], er: 0.2 })), B: P({ y: 0.05, lean: -0.35, sl: [0.6, 0.4], el: 1.0, sr: [2.9, 0.05], er: 0.1, hl: [0.2, 0.1], kl: 0.2, hr: [-0.2, 0.1], kr: 0.1 }) }),
      M({ id: 'lowk', n: 'SHIN KICK', btn: 'x', dir: 'd', su: 9, ac: 3, re: 14, dmg: 6, rng: 1.5, ht: 'l', kind: 'p', crush: 'high', A: P({ y: -0.3, lean: 0.2, sl: [0.8, 0.4], el: 1.2, sr: [0.9, 0.3], er: 0.7, hl: [0.9, 0.2], kl: 1.4, hr: [0.4, 0.1], kr: 1.2 }), B: P({ y: -0.32, lean: 0.1, sl: [0.8, 0.4], el: 1.2, sr: [0.9, 0.3], er: 0.7, hl: [0.9, 0.2], kl: 1.4, hr: [0.8, 0.2], kr: 0.05 }) }),
      M({ id: 'lunge', n: 'LUNGE', btn: 'b', dir: 'f', su: 18, ac: 6, re: 22, dmg: 15, rng: 2.6, ht: 'm', dash: 0.12, push: 0.3, A: P({ y: -0.2, lean: -0.1, twist: 0.6, sl: [0.6, 0.4], el: 1.0, sr: [1.2, 0.3], er: 1.6, hl: [0.6, 0.1], kl: 0.9, hr: [-0.4, 0.1], kr: 0.8 }), B: thrust }),
      M({ id: 'spin', n: 'HURRICANE', btn: 'a', dir: 'b', su: 16, ac: 8, re: 24, dmg: 12, rng: 2.3, ht: 'h', track: true, push: 0.25, spin: -Math.PI * 2, A: P(L({ y: -0.1, twist: 1.3, sl: [0.6, 0.6], el: 0.8, sr: [1.5, 1.2], er: 0.2 })), B: P(L({ y: -0.1, twist: 0, sl: [1.2, 1.3], el: 0.2, sr: [1.5, 1.3], er: 0.1 })) }),
      M({ id: 'barge', n: 'SHOULDER BARGE', btn: 'x', dir: 'f', su: 12, ac: 5, re: 18, dmg: 6, rng: 1.3, ht: 'm', dash: 0.09, push: 0.4, kind: 'p', A: P(L({ y: -0.15, lean: 0.2, twist: 1.2, sl: [0.4, 0.3], el: 0.8, sr: [0.6, 0.2], er: 0.8 })), B: P({ y: -0.2, lean: 0.5, twist: 1.4, sl: [0.4, 0.3], el: 0.8, sr: [0.6, 0.2], er: 0.8, hl: [0.8, 0.1], kl: 0.6, hr: [-0.6, 0.1], kr: 0.2, fw: 0.35 }) }),
      M({ id: 'pommel', n: 'POMMEL STRIKE', btn: 'a', dir: 'f', su: 9, ac: 3, re: 14, dmg: 8, rng: 1.4, ht: 'h', A: P(L({ y: -0.1, twist: 0.5, sr: [1.2, 0.2], er: 1.8, sl: [0.6, 0.4], el: 1.2 })), B: P(L({ y: -0.12, lean: 0.25, twist: -0.3, sr: [1.6, 0.0], er: 1.0, sl: [0.6, 0.4], el: 1.2, fw: 0.15 })) }),
    ];
    const SP = (btn, dir, o) => M(Object.assign({ btn, dir, sp: true }, o));
    const T = (n, kind, dmg) => ({ n, kind, dmg });
    const roster = [
      { id: 'ayako', n: 'AYAKO SWIFT', s: 'SWORD OF THE NORTH WIND', from: 'A MOUNTAIN VILLAGE', stats: [3, 5, 3], home: 'cherry', rival: 'kiki', spd: 1.15, pow: 0.92, ai: { agg: 1.1 },
        body: { h: 0.98, w: 0.9, chest: 0.94, limb: 0.92 }, hair: 'pony', top: 'robe', pants: 'plain', sleeves: 'long', shoes: 'boot', extra: ['sash'],
        face: { brow: 'angry', eyes: 'big', mouth: 'flat', lash: 1, fringe: 'bangs' },
        weapon: { kind: 'katana', len: 1.15, col: '#e8f0ff', col2: '#d02020', grip: '#2a1a1a', trail: '#ff9ad0', angle: 0.62 },
        col: { skin: '#f0c8a0', hair: '#1a1a2a', top: '#f4f0ea', top2: '#d02020', inner: '#1a1a2a', sleeve: '#f4f0ea', pants: '#d02020', shoe: '#2a1a1a', sash: '#d02020', lip: '#c03040' },
        cos: [{ col: { top: '#1a2a5a', sleeve: '#1a2a5a', top2: '#ffd040', pants: '#1a1a2a', sash: '#ffd040' } }, { col: { top: '#ff9ad0', sleeve: '#ff9ad0', top2: '#ffffff', pants: '#5a2a5a', sash: '#ffffff', hair: '#5a2a1a' } }],
        stance: { y: -0.14, lean: 0.12, twist: 0.5, sl: [0.9, 0.2, 0.5], el: 1.3, sr: [1.0, 0.1, 0.4], er: 1.0, wr: 0.3, hl: [0.5, 0.12], kl: 0.6, hr: [-0.4, 0.12], kr: 0.45 },
        win2: { y: -0.05, lean: -0.05, twist: 0.3, sl: [0.3, 0.3], el: 0.3, sr: [2.8, 0.2], er: 0.2, hl: [0.1, 0.1], kl: 0.1, hr: [-0.1, 0.1], kr: 0.1 },
        quote: 'The wind never misses.', taunt: 'Too slow, like a Monday morning.', rivalLine: 'Kiki. You stole my grandmother\'s recipe book.',
        moves: [M({ id: 'ayaq', n: 'WIND CUT', btn: 'a', su: 8, ac: 4, re: 12, dmg: 8, rng: 2.3, ht: 'h', track: true, next: { a: 'hs2', b: 'ayaq2' }, A: hA, B: hB }),
          M({ id: 'ayaq2', n: 'WIND CUT, FALLING LEAF', btn: 'b', chainOnly: true, su: 11, ac: 4, re: 22, dmg: 12, rng: 2.3, ht: 'm', kd: true, A: vA, B: vB })],
        specials: [SP('a', 'f', { n: 'PETAL DANCE', su: 11, ac: 10, re: 18, dmg: 14, hits: 2, rng: 2.4, ht: 'h', track: true, dash: 0.07, spin: -Math.PI * 2, fx: 'petal', A: P({ y: -0.2, twist: 1.3, sl: [0.6, 0.6], el: 0.8, sr: [1.5, 1.2], er: 0.2, hl: [0.6, 0.1], kl: 0.8, hr: [-0.4, 0.1], kr: 0.6 }), B: twirl }),
          SP('b', 'b', { n: 'MOON ARC', su: 14, ac: 5, re: 24, dmg: 13, rng: 2.2, ht: 'm', launch: true, hop: 0.6, A: P({ y: -0.35, lean: 0.4, sr: [0.3, 0.1], er: 0.1, sl: [0.6, 0.4], el: 1.0, hl: [1.2, 0.2], kl: 1.8, hr: [0.6, 0.2], kr: 1.6 }), B: P({ y: 0, lean: -0.6, sr: [3.1, 0.1], er: 0.0, sl: [1.5, 0.6], el: 0.4, hl: [0.4, 0.1], kl: 0.6, hr: [-0.2, 0.1], kr: 1.2 }) }),
          SP('x', 'b', { n: 'NORTH WIND STEP', su: 8, ac: 6, re: 16, dmg: 11, rng: 2.5, ht: 'm', dash: 0.18, track: true, A: P(L({ y: -0.3, lean: 0.5, twist: 1.0, sl: [0.4, 0.3], el: 0.6, sr: [0.6, 0.6], er: 0.4 })), B: thrust })],
        throws: [T('MOUNTAIN TOSS', 'hip', 22), T('WIND SLASH', 'slash', 22)],
        story: ['Ayako Swift guards the old sword of her mountain village. She has never once been late for anything.', 'When the Soul Sabre tournament was announced, she packed a sword, a spare sword and a packed lunch.'],
        ending: ['Ayako carried the Soul Sabre home through the snow and hung it over the village fireplace.', 'Now the whole village goes to bed on time. Every night. At nine.', 'The wind never misses. Neither does Ayako.'] },
      { id: 'bramble', n: 'BRAMBLE', s: 'AXE OF THE GREENWOOD', from: 'THE GREENWOOD', stats: [5, 2, 3], home: 'shrine', rival: 'zephyr', spd: 0.82, pow: 1.25, ai: { agg: 0.95, thr: 1.8 },
        body: { h: 1.1, w: 1.35, chest: 1.15, limb: 1.25, belly: 1.1 }, hair: 'mohawk', top: 'vest', pants: 'plain', sleeves: 'none', shoes: 'boot', extra: ['belt', 'necklace'],
        face: { brow: 'thick', mouth: 'teeth', beard: '#a85a1a', hairY: 9 },
        weapon: { kind: 'axe', len: 1.05, col: '#c8ccd0', grip: '#5a3a1a', trail: '#9aff7a', angle: 0.7 },
        col: { skin: '#d8a070', hair: '#c06a1a', top: '#4a6a2a', top2: '#7a5a2a', pants: '#5a4a2a', belt: '#2a1a0a', beltOn: 1, shoe: '#3a2a1a', glove: '#5a4a2a', extra: '#e0c040', beads: '#e8e0c0' },
        cos: [{ col: { top: '#5a2a1a', pants: '#2a2a2a', hair: '#1a1a1a', glove: '#2a2a2a' } }, { col: { top: '#2a4a6a', pants: '#3a4a5a', hair: '#e8e0c0', skin: '#a86a3a', glove: '#3a4a5a' } }],
        stance: { y: -0.16, lean: 0.25, twist: 0.3, sl: [0.7, 0.4], el: 1.4, sr: [1.6, 0.3], er: 1.6, hl: [0.4, 0.25], kl: 0.6, hr: [-0.3, 0.25], kr: 0.5 },
        win2: { y: -0.05, lean: -0.15, hp: -0.3, sl: [0.4, 0.6], el: 1.8, sr: [3.0, 0.3], er: 0.4, hl: [0.2, 0.25], kl: 0.2, hr: [-0.1, 0.25], kr: 0.1 },
        quote: 'TIMBERRRR!', taunt: 'Chopped. Like firewood.', rivalLine: 'Zephyr! The forest wants its spear back!',
        moves: [M({ id: 'bramchop', n: 'FELLING CHOP', btn: 'b', su: 17, ac: 4, re: 20, dmg: 16, rng: 2.3, ht: 'm', kd: true, A: overhead, B: chop })],
        specials: [SP('a', 'f', { n: 'TIMBER!', su: 22, ac: 5, re: 26, dmg: 21, rng: 2.3, ht: 'm', kd: true, unb: true, fx: 'leaf', A: overhead, B: chop }),
          SP('b', 'b', { n: 'LOG ROLL', su: 15, ac: 12, re: 24, dmg: 14, hits: 2, rng: 2.2, ht: 'h', track: true, dash: 0.05, push: 0.3, spin: -Math.PI * 4, A: twirl, B: twirl }),
          SP('x', 'b', { n: 'BEAR HUG STOMP', su: 14, ac: 5, re: 20, dmg: 13, rng: 1.4, ht: 'l', crumple: true, kind: 'p', A: P({ y: -0.05, sl: [1.5, 0.6], el: 0.6, sr: [1.5, 0.6], er: 0.6, hl: [1.5, 0.1], kl: 1.6, hr: [0, 0.1], kr: 0 }), B: P({ y: -0.25, lean: 0.3, sl: [1.5, 0.6], el: 0.6, sr: [1.5, 0.6], er: 0.6, hl: [0.6, 0.1], kl: 0.2, hr: [-0.2, 0.1], kr: 0.4 }) })],
        throws: [T('LOG THROW', 'slam', 26), T('TREE TRUNK SPIN', 'spin', 24)],
        story: ['Bramble is the woodcutter of the Greenwood. He has chopped down exactly one tree in his life, and he still feels bad about it.', 'He wants the Soul Sabre so he can plant a new forest. A really big one.'],
        ending: ['Bramble swapped the Soul Sabre for ten thousand acorns.', 'He planted every single one. It took him all summer.', 'In a hundred years it will be the biggest forest in the land. TIMBERRR... no. Wait. The opposite of that.'] },
      { id: 'finn', n: 'FINN FLETCHER', s: 'THE WHIRLING STAFF', from: 'THE SKY TEMPLE', stats: [3, 4, 5], home: 'sky', rival: 'bramble', spd: 1.05,
        body: { h: 1.02, w: 0.98 }, hair: 'topknot', top: 'tunic', pants: 'plain', sleeves: 'none', shoes: 'shoe', extra: ['sash', 'necklace'],
        face: { brow: 'flat', mouth: 'smirk', hairY: 3, backY: 6 },
        weapon: { kind: 'staff', len: 1.0, col: '#8a5a2a', col2: '#ffd040', grip: '#8a5a2a', trail: '#ffd27a', angle: 0.95 },
        col: { skin: '#e0b088', hair: '#3a2a1a', top: '#f08a1a', top2: '#c06a10', pants: '#f08a1a', sash: '#8a1a1a', shoe: '#5a3a1a', beads: '#5a3a1a' },
        cos: [{ col: { top: '#8a1a1a', pants: '#8a1a1a', sash: '#ffd040' } }, { col: { top: '#3a7a3a', pants: '#3a7a3a', sash: '#f4f4f4', skin: '#8a5a3a' } }],
        stance: { y: -0.16, lean: 0.1, twist: 0.6, sl: [1.2, 0.3], el: 1.4, sr: [0.8, 0.3], er: 1.5, hl: [0.55, 0.2], kl: 0.7, hr: [-0.4, 0.2], kr: 0.6 },
        win2: { y: -0.05, lean: 0.4, hp: 0.3, sl: [1.0, 0.1, 0.8], el: 1.6, sr: [1.0, 0.1, 0.8], er: 1.6, hl: [0.05, 0.05], kl: 0.05, hr: [0.05, 0.05], kr: 0.05 },
        quote: 'Patience. Then a big stick.', taunt: 'You walked into my staff. Twice.', rivalLine: 'Bramble. Please stop chopping my temple.',
        moves: [M({ id: 'finnpoke', n: 'STAFF POKE', btn: 'b', su: 11, ac: 4, re: 15, dmg: 11, rng: 2.6, ht: 'm', next: { b: 'finnpoke2' }, A: P(L({ y: -0.15, twist: 0.6, sl: [1.2, 0.3], el: 1.4, sr: [1.0, 0.3], er: 1.8 })), B: thrust }),
          M({ id: 'finnpoke2', n: 'POKE, POKE', btn: 'b', chainOnly: true, su: 10, ac: 4, re: 20, dmg: 11, rng: 2.6, ht: 'm', push: 0.25, A: P(L({ y: -0.15, twist: 0.6, sl: [1.2, 0.3], el: 1.4, sr: [1.0, 0.3], er: 1.8 })), B: thrust })],
        specials: [SP('a', 'f', { n: 'POLE VAULT', su: 14, ac: 6, re: 20, dmg: 13, rng: 1.8, ht: 'm', dash: 0.12, hop: 0.9, kd: true, kind: 'p', crush: 'low', trail: 'ftR', A: P({ y: -0.3, lean: 0.4, sl: [1.2, 0.2], el: 0.8, sr: [1.2, 0.2], er: 0.8, hl: [1.0, 0.1], kl: 1.6, hr: [0.4, 0.1], kr: 1.6 }), B: P({ y: 0, lean: -0.4, sl: [2.4, 0.2], el: 0.3, sr: [2.4, 0.2], er: 0.3, hl: [1.5, 0.1], kl: 0.1, hr: [1.5, 0.1], kr: 0.1 }) }),
          SP('b', 'b', { n: 'WHIRLING STAFF', su: 12, ac: 14, re: 22, dmg: 13, hits: 3, rng: 2.6, ht: 'h', track: true, push: 0.2, A: twirl, B: twirl, spin: Math.PI * 4 }),
          SP('x', 'b', { n: 'TEMPLE BELL', su: 18, ac: 5, re: 22, dmg: 15, rng: 2.4, ht: 'm', crumple: true, A: overhead, B: chop })],
        throws: [T('STAFF VAULT', 'flip', 22), T('PRAYER WHEEL', 'spin', 22)],
        story: ['Finn Fletcher lives in the Sky Temple, where the monks study patience, kindness and hitting things with sticks.', 'He has been sent down the mountain to bring back the Soul Sabre before somebody silly gets it.'],
        ending: ['Finn brought the Soul Sabre back to the Sky Temple, where it will be kept safe for ever.', 'The monks were so pleased they gave him a day off. He spent it meditating.', 'Then he spent the evening hitting things with a stick.'] },
      { id: 'clanks', n: 'SIR CLANKS', s: 'THE TIN KNIGHT', from: 'CASTLE CLANKINGTON', stats: [4, 3, 4], home: 'castle', rival: 'gloom', spd: 0.92, pow: 1.1, ai: { agg: 0.95 },
        body: { h: 1.06, w: 1.15, chest: 1.12, limb: 1.1 }, hair: 'helmet', top: 'armour', pants: 'armour', sleeves: 'long', shoes: 'boot', extra: ['shield', 'pads', 'gauntlets', 'greaves', 'belt'], emblem: 'cross',
        face: { full: '#b8bcc8', noNose: 1, mouth: 'none', eyes: 'shades' },
        weapon: { kind: 'sword', len: 1.3, col: '#d8dce8', col2: '#ffd040', grip: '#3a2a6a', trail: '#9ad8ff', angle: 0.55 },
        col: { skin: '#e8b890', hair: '#b8bcc8', helm: '#b8bcc8', top: '#b8bcc8', top2: '#3a4ab0', sleeve: '#9aa0b0', arm: '#9aa0b0', pants: '#9aa0b0', belt: '#3a2a1a', beltOn: 1, shoe: '#6a7080', glove: '#6a7080', extra: '#3a4ab0', shield: '#3a4ab0', plume: '#c01a1a', pad: '#9aa0b0', gauntlet: '#b8bcc8', greave: '#b8bcc8', neck: '#6a7080' },
        cos: [{ col: { helm: '#d8b030', top: '#d8b030', gauntlet: '#d8b030', greave: '#d8b030', pad: '#c8a020', shield: '#8a1010', extra: '#8a1010', plume: '#f4f4f4' }, look: { face: { full: '#d8b030', noNose: 1, mouth: 'none', eyes: 'shades' } } }, { col: { helm: '#3a3a44', top: '#3a3a44', gauntlet: '#3a3a44', greave: '#3a3a44', pad: '#2a2a30', sleeve: '#2a2a30', arm: '#2a2a30', pants: '#2a2a30', shield: '#2a6a2a', extra: '#2a6a2a', plume: '#2aff6a' }, look: { face: { full: '#3a3a44', noNose: 1, mouth: 'none', eyes: 'shades' } } }],
        stance: { y: -0.12, lean: 0.12, twist: 0.15, sl: [1.2, 0.35, 0.3], el: 1.6, sr: [0.9, 0.15], er: 1.2, hl: [0.4, 0.15], kl: 0.5, hr: [-0.3, 0.15], kr: 0.4 },
        win2: { y: -0.03, lean: -0.05, sl: [0.8, 0.4], el: 1.6, sr: [2.9, 0.1], er: 0.1, hl: [0.0, 0.1], kl: 0, hr: [0, 0.1], kr: 0 },
        quote: 'For honour! And for tea.', taunt: 'Clank clank. That is the sound of defeat.', rivalLine: 'Lord Gloom! I have come to switch the lights back on!',
        moves: [M({ id: 'clankbash', n: 'SHIELD PUNCH', btn: 'x', su: 9, ac: 4, re: 14, dmg: 8, rng: 1.4, ht: 'h', push: 0.2, kind: 'p', A: P(L({ y: -0.12, twist: -0.6, sl: [1.0, 0.3], el: 1.6, sr: [0.9, 0.15], er: 1.2 })), B: P(L({ y: -0.15, lean: 0.3, twist: 0.3, sl: [1.6, 0.0], el: 0.4, sr: [0.9, 0.15], er: 1.2, fw: 0.15 })) })],
        specials: [SP('a', 'f', { n: 'SHIELD BASH', su: 12, ac: 5, re: 18, dmg: 9, rng: 1.4, ht: 'm', dash: 0.1, push: 0.42, kind: 'p', A: P({ y: -0.15, twist: -1.0, sl: [1.2, 0.0], el: 1.4, sr: [0.8, 0.3], er: 0.6, hl: [0.5, 0.1], kl: 0.6, hr: [-0.4, 0.1], kr: 0.4 }), B: P({ y: -0.2, lean: 0.4, twist: -0.4, sl: [1.6, 0.0], el: 0.6, sr: [0.7, 0.3], er: 0.6, hl: [0.8, 0.1], kl: 0.5, hr: [-0.6, 0.1], kr: 0.2, fw: 0.35 }) }),
          SP('b', 'b', { n: 'HONOUR STRIKE', su: 20, ac: 5, re: 24, dmg: 19, rng: 2.6, ht: 'm', kd: true, fx: 'gold', A: overhead, B: chop }),
          SP('x', 'b', { n: 'TEA BREAK', su: 30, ac: 2, re: 30, dmg: 1, rng: 0.1, ht: 'm', heal: 6, A: P({ y: -0.1, lean: -0.1, sl: [0.4, 0.2], el: 2.6, sr: [0.4, 0.4], er: 1.6 }), B: P({ y: -0.1, lean: -0.15, hp: -0.4, sl: [0.4, 0.2], el: 2.8, sr: [0.4, 0.4], er: 1.6 }) })],
        throws: [T('CASTLE TOSS', 'toss', 22), T('KNIGHTLY SUPLEX', 'suplex', 26)],
        story: ['Sir Clanks is the last knight of Castle Clankington. Nobody has seen his face since 1974. He says this is "for safety".', 'Lord Gloom has made it night time for ever, and Sir Clanks cannot see to make his tea. This will not do.'],
        ending: ['Sir Clanks beat Lord Gloom and the sun came up at last.', 'He made the finest cup of tea the land had ever seen, and drank it through his visor.', 'He still did not take the helmet off. Some things are private.'] },
      { id: 'cutlass', n: 'CAPTAIN CUTLASS', s: 'THE SALTY SWORD', from: 'THE SEVEN AND A HALF SEAS', stats: [4, 3, 3], home: 'harbour', rival: 'chef', spd: 0.98, pow: 1.05,
        body: { h: 1.04, w: 1.08, belly: 1.15 }, hair: 'tricorn', top: 'pirate', pants: 'stripe', sleeves: 'long', shoes: 'boot', extra: ['belt', 'patch', 'hook'],
        face: { brow: 'angry', mouth: 'grin', beard: '#2a1a1a', tache: '#2a1a1a', hairY: 8 },
        weapon: { kind: 'cutlass', len: 0.9, col: '#d8dce0', col2: '#d8b030', grip: '#3a1a0a', trail: '#7ae0ff', angle: 0.58 },
        col: { skin: '#d89868', hair: '#2a1a1a', hat: '#1a1a1a', top: '#8a1a1a', top2: '#f2ece0', sleeve: '#f2ece0', pants: '#1a2a5a', stripe: '#f4f4f4', belt: '#3a2a1a', beltOn: 1, shoe: '#1a1a1a', extra: '#c01a1a', skullHat: 1 },
        cos: [{ col: { top: '#1a3a7a', hat: '#5a1a1a', pants: '#2a2a2a', extra: '#ffd040' } }, { col: { top: '#2a5a2a', hat: '#2a2a2a', pants: '#5a3a1a', extra: '#f4f4f4', hair: '#c06a1a', beard: '#c06a1a' }, look: { face: { brow: 'angry', mouth: 'grin', beard: '#c06a1a', tache: '#c06a1a', hairY: 8 } } }],
        stance: { y: -0.12, lean: 0.15, twist: 0.4, sl: [0.7, 0.5], el: 1.2, sr: [1.1, 0.25, 0.3], er: 0.8, hl: [0.45, 0.2], kl: 0.55, hr: [-0.3, 0.2], kr: 0.45, hp: -0.1 },
        win2: { y: -0.04, lean: -0.15, hp: -0.3, sl: [0.6, 0.6], el: 2.2, sr: [2.8, 0.3], er: 0.4, hl: [1.0, 0.1], kl: 1.6, hr: [-0.1, 0.1], kr: 0.1 },
        quote: 'Arr! That be the end of THAT.', taunt: 'Walk the plank, landlubber!', rivalLine: 'Chef! You put pineapple on my ship\'s biscuits!',
        moves: [M({ id: 'cuthook', n: 'HOOK SWIPE', btn: 'x', su: 9, ac: 4, re: 14, dmg: 8, rng: 1.45, ht: 'h', kind: 'p', A: P(L({ y: -0.1, twist: -0.8, sl: [1.2, 1.0], el: 0.6, sr: [1.1, 0.25], er: 0.8 })), B: P(L({ y: -0.12, twist: 0.7, sl: [1.5, 0.1, 0.9], el: 0.2, sr: [1.1, 0.25], er: 0.8 })) })],
        specials: [SP('a', 'f', { n: 'BROADSIDE', su: 12, ac: 8, re: 20, dmg: 14, hits: 2, rng: 2.2, ht: 'h', track: true, dash: 0.06, A: hA, B: hB }),
          SP('b', 'b', { n: 'ANCHOR DROP', su: 20, ac: 5, re: 24, dmg: 18, rng: 2.1, ht: 'm', kd: true, hop: 0.5, A: overhead, B: chop }),
          SP('x', 'b', { n: 'PEG-LEG SWEEP', su: 11, ac: 5, re: 20, dmg: 9, rng: 1.6, ht: 'l', kd: true, kind: 'p', spin: 1.2, crush: 'high', A: P(D({ y: -0.45, lean: 0.4, sl: [0.6, 0.5], el: 1.2, sr: [0.6, 0.5], er: 1.2 })), B: P({ y: -0.55, lean: 0.6, spin: 1.0, sl: [0.6, 0.6], el: 1.2, sr: [0.6, 0.6], er: 1.2, hl: [1.4, 0.2], kl: 2.3, hr: [1.3, 1.3], kr: 0.05 }) })],
        throws: [T('WALK THE PLANK', 'toss', 22), T('KEELHAUL', 'flip', 24)],
        story: ['Captain Cutlass has sailed the seven seas, and half of an eighth one before he got scared and turned back.', 'He wants the Soul Sabre because it is the only treasure he has never found. Also he has lost his map. Again.'],
        ending: ['Captain Cutlass buried the Soul Sabre on a desert island and drew a map with a big X on it.', 'Then he lost the map.', 'He is still looking. Arr.'] },
      { id: 'fleuret', n: 'MADAME FLEURET', s: 'THE DANCING RAPIER', from: 'A FENCING SALON IN PARIS', stats: [2, 5, 4], home: 'colosseum', rival: 'clanks', spd: 1.2, pow: 0.88, ai: { agg: 1.15 },
        body: { h: 0.99, w: 0.88, chest: 0.92, limb: 0.88 }, hair: 'bob', top: 'fencer', pants: 'plain', sleeves: 'long', shoes: 'boot', emblem: 'flower', extra: ['collar'],
        face: { brow: 'up', eyes: 'narrow', mouth: 'smirk', lash: 1, fringe: 'bangs' },
        weapon: { kind: 'rapier', len: 1.25, col: '#e8eef8', col2: '#d8b030', grip: '#2a2a2a', trail: '#c8a0ff', angle: 0.5 },
        col: { skin: '#f4d4bc', hair: '#2a1a14', top: '#f8f8f4', top2: '#c8c8c8', sleeve: '#f8f8f4', pants: '#f8f8f4', shoe: '#1a1a1a', extra: '#d02a5a', collar: '#f8f8f4', lip: '#c0102a' },
        cos: [{ col: { top: '#1a1a1a', sleeve: '#1a1a1a', pants: '#1a1a1a', collar: '#1a1a1a', extra: '#ffd040', hair: '#e8c060' } }, { col: { top: '#2a4a9a', sleeve: '#2a4a9a', pants: '#f8f8f4', collar: '#f8f8f4', extra: '#f8f8f4', hair: '#8a2a1a' } }],
        stance: { y: -0.2, lean: 0.05, twist: 0.9, sl: [0.2, 1.2, 0], el: 1.8, sr: [1.35, 0.0, 0.2], er: 0.2, hl: [0.6, 0.3], kl: 0.8, hr: [-0.2, 0.5], kr: 0.7, hry: 0.6 },
        win2: { y: -0.02, lean: -0.05, twist: 0.4, sl: [0.4, 1.0], el: 2.0, sr: [2.6, 0.0], er: 0.2, hl: [0.0, 0.1], kl: 0.0, hr: [0.3, 0.1], kr: 0.6 },
        quote: 'Touché! And again, touché.', taunt: 'You fight like a cabbage.', rivalLine: 'Sir Clanks, you clank. It is very distracting.',
        moves: [M({ id: 'fleupoke', n: 'QUICK POINT', btn: 'b', su: 7, ac: 3, re: 11, dmg: 8, rng: 2.6, ht: 'm', next: { b: 'fleupoke2' }, A: P({ y: -0.2, twist: 0.9, sl: [0.2, 1.2], el: 1.8, sr: [1.2, 0.0], er: 1.2, hl: [0.6, 0.3], kl: 0.8, hr: [-0.2, 0.5], kr: 0.7 }), B: P({ y: -0.28, lean: 0.3, twist: 1.0, sl: [0.2, 1.4], el: 1.6, sr: [1.6, 0.0], er: 0.0, hl: [1.0, 0.3], kl: 0.9, hr: [-0.5, 0.5], kr: 0.1, fw: 0.3 }) }),
          M({ id: 'fleupoke2', n: 'POINT, COUNTERPOINT', btn: 'b', chainOnly: true, su: 7, ac: 3, re: 11, dmg: 8, rng: 2.6, ht: 'h', next: { b: 'fleupoke3' }, A: P({ y: -0.2, twist: 0.9, sl: [0.2, 1.2], el: 1.8, sr: [1.2, 0.0], er: 1.2, hl: [0.6, 0.3], kl: 0.8, hr: [-0.2, 0.5], kr: 0.7 }), B: P({ y: -0.22, lean: 0.25, twist: 1.0, sl: [0.2, 1.4], el: 1.6, sr: [1.7, 0.0], er: 0.0, hl: [0.9, 0.3], kl: 0.9, hr: [-0.5, 0.5], kr: 0.1, fw: 0.3 }) }),
          M({ id: 'fleupoke3', n: 'TRIPLE POINT', btn: 'b', chainOnly: true, su: 9, ac: 4, re: 20, dmg: 11, rng: 2.8, ht: 'm', dash: 0.08, kd: true, A: P({ y: -0.2, twist: 0.9, sl: [0.2, 1.2], el: 1.8, sr: [1.2, 0.0], er: 1.2, hl: [0.6, 0.3], kl: 0.8, hr: [-0.2, 0.5], kr: 0.7 }), B: thrust })],
        specials: [SP('a', 'f', { n: 'FLÈCHE', su: 9, ac: 6, re: 22, dmg: 13, rng: 2.8, ht: 'm', dash: 0.2, push: 0.2, A: P({ y: -0.3, lean: 0.4, twist: 0.9, sl: [0.2, 1.2], el: 1.8, sr: [1.2, 0.0], er: 1.2, hl: [1.0, 0.3], kl: 1.2, hr: [-0.2, 0.5], kr: 0.9 }), B: thrust }),
          SP('b', 'b', { n: 'PETAL STORM', su: 12, ac: 16, re: 20, dmg: 16, hits: 5, rng: 2.6, ht: 'h', fx: 'petal', A: thrust, B: P({ y: -0.22, lean: 0.25, twist: 1.0, sl: [0.2, 1.4], el: 1.6, sr: [1.7, 0.3], er: 0.0, fw: 0.3 }) }),
          SP('x', 'b', { n: 'RIPOSTE STEP', su: 6, ac: 4, re: 14, dmg: 9, rng: 2.4, ht: 'm', back: 0.08, A: P(L({ y: -0.1, lean: -0.2, sl: [0.2, 1.2], el: 1.8, sr: [1.2, 0.0], er: 0.6 })), B: thrust })],
        throws: [T('EN GARDE!', 'hip', 22), T('PIROUETTE', 'spin', 22)],
        story: ['Madame Fleuret has won every fencing competition in France. Twice. Once with her eyes shut.', 'She is bored. The Soul Sabre tournament is the only challenge left. She has brought a picnic.'],
        ending: ['Madame Fleuret won the Soul Sabre and opened a fencing school by the river.', 'Lesson one: stand up straight. Lesson two: touché.', 'Lesson three: always bring a picnic.'] },
      { id: 'kiki', n: 'KIKI KUNAI', s: 'THE TWIN DAGGERS', from: 'THE HIDDEN VILLAGE', stats: [2, 5, 2], home: 'ice', rival: 'ayako', spd: 1.28, pow: 0.84, bounce: 1, ai: { agg: 1.25 },
        body: { h: 0.93, w: 0.86, chest: 0.9, limb: 0.86, head: 1.05 }, hair: 'hood', top: 'ninja', pants: 'plain', sleeves: 'long', shoes: 'boot',
        face: { brow: 'angry', eyes: 'big', mouth: 'none', cover: '#2a2a3a', lash: 1, hairY: 12, backY: 26 },
        weapon: { kind: 'dagger', len: 0.36, col: '#d8dce8', col2: '#c01a1a', grip: '#2a2a2a', trail: '#ff4a6a', angle: 0.7, off: true },
        col: { skin: '#f0c8a8', hair: '#1a1a24', hood: '#2a2a3a', top: '#2a2a3a', top2: '#c01a1a', sleeve: '#2a2a3a', pants: '#2a2a3a', shoe: '#1a1a24', glove: '#2a2a3a' },
        cos: [{ col: { hood: '#f4f4f4', top: '#f4f4f4', sleeve: '#f4f4f4', pants: '#d8d8e0', top2: '#2a6af0', glove: '#2a6af0' }, look: { face: { brow: 'angry', eyes: 'big', mouth: 'none', cover: '#f4f4f4', lash: 1, hairY: 12, backY: 26 } } }, { col: { hood: '#8a1a3a', top: '#8a1a3a', sleeve: '#8a1a3a', pants: '#3a1a2a', top2: '#ffd040', glove: '#ffd040' }, look: { face: { brow: 'angry', eyes: 'big', mouth: 'none', cover: '#8a1a3a', lash: 1, hairY: 12, backY: 26 } } }],
        stance: { y: -0.3, lean: 0.35, twist: 0.3, sl: [1.0, 0.6, 0.3], el: 1.0, sr: [0.4, 0.5], er: 1.5, hl: [0.9, 0.35], kl: 1.3, hr: [0.1, 0.35], kr: 1.2 },
        win2: { y: -0.4, lean: 0.4, sl: [0.6, 0.3], el: 2.0, sr: [0.6, 0.3], er: 2.0, hl: [1.5, 0.2], kl: 2.4, hr: [0.2, 0.4], kr: 2.2 },
        quote: 'You never saw me. Nobody does.', taunt: 'Too slow! I was there and then I wasn\'t.', rivalLine: 'Ayako. The recipe book was a LIBRARY book.',
        moves: [M({ id: 'kikistab', n: 'DOUBLE STAB', btn: 'a', su: 6, ac: 5, re: 10, dmg: 7, hits: 2, rng: 1.7, ht: 'h', next: { a: 'kikistab2' }, A: P(L({ y: -0.2, twist: 0.4, sl: [1.0, 0.6], el: 1.0, sr: [0.6, 0.5], er: 1.6 })), B: P(L({ y: -0.25, lean: 0.3, twist: -0.2, sl: [1.5, 0.1], el: 0.2, sr: [1.5, 0.1], er: 0.2, fw: 0.15 })) }),
          M({ id: 'kikistab2', n: 'STAB, STAB, SPIN', btn: 'a', chainOnly: true, su: 8, ac: 8, re: 16, dmg: 9, hits: 2, rng: 1.8, ht: 'h', track: true, spin: -Math.PI * 2, A: twirl, B: twirl })],
        specials: [SP('a', 'f', { n: 'SHADOW STEP', su: 6, ac: 6, re: 18, dmg: 10, rng: 2.2, ht: 'm', dash: 0.22, crush: 'high', A: POSE.crouch, B: thrust }),
          SP('b', 'b', { n: 'FALLING STAR', su: 14, ac: 6, re: 22, dmg: 14, rng: 1.8, ht: 'm', hop: 1.2, kd: true, crush: 'low', A: POSE.jump, B: chop }),
          SP('x', 'b', { n: 'SPINNING TOP', su: 10, ac: 14, re: 20, dmg: 12, hits: 4, rng: 1.6, ht: 'l', spin: Math.PI * 4, crush: 'high', A: P(D({ y: -0.5, lean: 0.4, sl: [1.4, 1.2], el: 0.2, sr: [1.4, 1.2], er: 0.2 })), B: P(D({ y: -0.55, lean: 0.5, sl: [1.5, 1.3], el: 0.1, sr: [1.5, 1.3], er: 0.1 })) })],
        throws: [T('SMOKE BOMB', 'magic', 22), T('MONKEY CLIMB', 'flip', 22)],
        story: ['Kiki Kunai is the sneakiest ninja in the Hidden Village. She once hid in a room for three days and nobody noticed. It was her own birthday party.', 'She wants the Soul Sabre so everybody notices her for once.'],
        ending: ['Kiki won the Soul Sabre and held it up in front of the whole tournament.', 'Everybody noticed her. Everybody cheered. It was absolutely terrifying.', 'She hid in a cupboard for a week. It was lovely.'] },
      { id: 'chef', n: 'CHEF CROUTON', s: 'THE SIZZLING PAN', from: 'A RESTAURANT THAT IS ALWAYS SHUT', stats: [4, 2, 3], home: 'colosseum', rival: 'cutlass', spd: 0.9, pow: 1.1, ai: { thr: 1.6 },
        body: { h: 1.0, w: 1.2, belly: 1.4, head: 1.08 }, hair: 'chef', top: 'chef', pants: 'check', sleeves: 'long', shoes: 'shoe', extra: ['belt'],
        face: { brow: 'up', mouth: 'grin', tache: '#2a1a1a', blush: 1, hairY: 8 },
        weapon: { kind: 'pan', len: 0.9, col: '#2a2a2e', col2: '#5a5a62', grip: '#3a2a1a', trail: '#ffb04a', angle: 0.6 },
        col: { skin: '#f0c098', hair: '#2a1a1a', top: '#f8f8f4', sleeve: '#f8f8f4', pants: '#f8f8f4', pants2: '#1a1a1a', belt: '#f8f8f4', beltOn: 1, shoe: '#1a1a1a', extra: '#d02020' },
        cos: [{ col: { top: '#1a1a1a', sleeve: '#1a1a1a', extra: '#ffd040', pants: '#5a5a5a' } }, { col: { top: '#ffd0e0', sleeve: '#ffd0e0', extra: '#2a6af0', pants: '#ffd0e0', pants2: '#d02060' } }],
        stance: { y: -0.12, lean: 0.2, twist: 0.3, sl: [0.6, 0.6], el: 1.6, sr: [1.3, 0.3], er: 1.4, hl: [0.4, 0.25], kl: 0.5, hr: [-0.3, 0.25], kr: 0.4 },
        win2: { y: -0.04, lean: -0.1, sl: [0.6, 0.4], el: 2.4, sr: [2.7, 0.3], er: 0.6, hl: [0.1, 0.2], kl: 0.1, hr: [-0.1, 0.2], kr: 0.1 },
        quote: 'Magnifique! Who wants seconds?', taunt: 'You have been... SERVED.', rivalLine: 'Captain! Your ship\'s biscuits were a CRIME.',
        moves: [M({ id: 'chefflip', n: 'PANCAKE FLIP', btn: 'b', dir: 'd', su: 12, ac: 4, re: 22, dmg: 12, rng: 1.9, ht: 'm', launch: true, A: P(D({ y: -0.4, lean: 0.5, sl: [0.6, 0.4], el: 1.0, sr: [0.2, 0.1], er: 0.2 })), B: P({ y: 0.05, lean: -0.35, sl: [0.6, 0.4], el: 1.0, sr: [2.9, 0.05], er: 0.1, hl: [0.2, 0.1], kl: 0.2, hr: [-0.2, 0.1], kr: 0.1 }) })],
        specials: [SP('a', 'f', { n: 'FRYING TONIGHT', su: 13, ac: 12, re: 20, dmg: 15, hits: 3, rng: 2.0, ht: 'h', track: true, fx: 'fire', A: hA, B: hB }),
          SP('b', 'b', { n: 'THE BIG BONK', su: 22, ac: 5, re: 24, dmg: 20, rng: 2.0, ht: 'm', crumple: true, A: overhead, B: chop }),
          SP('x', 'b', { n: 'HOT SOUP', su: 16, ac: 10, re: 20, dmg: 10, rng: 1.6, ht: 'm', unb: true, push: 0.3, fx: 'steam', A: P({ y: -0.1, lean: -0.2, sl: [1.2, 0.5], el: 1.4, sr: [1.6, 0.3], er: 0.6 }), B: P({ y: -0.15, lean: 0.4, sl: [1.6, 0.2], el: 0.2, sr: [1.6, 0.2], er: 0.2, fw: 0.1 }) })],
        throws: [T('TOSSED SALAD', 'spin', 22), T('SIZZLER', 'pancake', 26)],
        story: ['Chef Crouton\'s restaurant has three gold stars, a waiting list of ten years, and has never once been open.', 'He has entered the Soul Sabre tournament to find the perfect knife for slicing baguettes. Any sword will do.'],
        ending: ['Chef Crouton used the Soul Sabre to slice the most perfect baguette the world has ever seen.', 'He opened his restaurant at last, for one night only. Everybody came.', 'Then he shut it again. Magnifique.'] },
      { id: 'zephyr', n: 'ZEPHYR', s: 'THE SPEAR OF THE DUNES', from: 'THE ENDLESS DESERT', stats: [3, 4, 5], home: 'sky', rival: 'fleuret', spd: 1.08,
        body: { h: 1.04, w: 0.96, limb: 0.95 }, hair: 'bandana', top: 'vest', pants: 'plain', sleeves: 'none', shoes: 'boot', baggy: 1, extra: ['sash', 'necklace'],
        face: { brow: 'flat', mouth: 'smirk', paint: '#2a6af0', hairY: 8 },
        weapon: { kind: 'spear', len: 1.1, col: '#e8e0c8', col2: '#2a6af0', grip: '#6a4a2a', trail: '#7ac8ff', angle: 0.88 },
        col: { skin: '#a86a3a', hair: '#1a1a1a', hat: '#2a6af0', top: '#c8a060', pants: '#e8dcc0', sash: '#2a6af0', shoe: '#6a4a2a', beads: '#f4f4f4' },
        cos: [{ col: { hat: '#c01a1a', top: '#5a3a1a', pants: '#3a2a1a', sash: '#c01a1a' } }, { col: { hat: '#f4f4f4', top: '#2a5a5a', pants: '#f4f4f4', sash: '#ffd040', skin: '#e0b088' } }],
        stance: { y: -0.18, lean: 0.15, twist: 0.7, sl: [1.0, 0.3, 0.3], el: 1.2, sr: [0.6, 0.4], er: 1.8, hl: [0.55, 0.2], kl: 0.7, hr: [-0.4, 0.2], kr: 0.6 },
        win2: { y: -0.04, lean: -0.1, sl: [0.6, 0.5], el: 1.6, sr: [2.9, 0.2], er: 0.3, hl: [0.05, 0.1], kl: 0, hr: [0.9, 0.1], kr: 1.8 },
        quote: 'The sand remembers everything.', taunt: 'Out of reach. Always out of reach.', rivalLine: 'Fleuret, your sword is too short. I am sorry.',
        moves: [M({ id: 'zepoke', n: 'LONG THRUST', btn: 'b', su: 13, ac: 4, re: 18, dmg: 12, rng: 3.0, ht: 'm', push: 0.15, A: P(L({ y: -0.15, twist: 0.8, sl: [1.0, 0.3], el: 1.2, sr: [0.6, 0.4], er: 1.8 })), B: thrust })],
        specials: [SP('a', 'f', { n: 'DUNE SWEEP', su: 14, ac: 6, re: 22, dmg: 13, rng: 3.0, ht: 'l', track: true, kd: true, crush: 'high', A: P(D({ y: -0.4, lean: 0.4, twist: 1.1, sl: [0.6, 0.4], el: 1.0, sr: [1.0, 0.9], er: 0.3 })), B: P(D({ y: -0.45, lean: 0.55, twist: -1.0, sl: [0.6, 0.4], el: 1.0, sr: [0.9, 0.1, 0.9], er: 0.1 })) }),
          SP('b', 'b', { n: 'SANDSTORM', su: 12, ac: 16, re: 22, dmg: 15, hits: 3, rng: 2.8, ht: 'h', track: true, spin: Math.PI * 4, push: 0.25, A: twirl, B: twirl }),
          SP('x', 'b', { n: 'VAULTING KICK', su: 14, ac: 6, re: 20, dmg: 13, rng: 1.9, ht: 'm', hop: 0.9, dash: 0.1, kd: true, kind: 'p', trail: 'ftR', A: P({ y: -0.3, lean: 0.4, sl: [1.2, 0.2], el: 0.8, sr: [1.2, 0.2], er: 0.8, hl: [1.0, 0.1], kl: 1.6, hr: [0.4, 0.1], kr: 1.6 }), B: P({ y: 0, lean: -0.4, sl: [2.4, 0.2], el: 0.3, sr: [2.4, 0.2], er: 0.3, hl: [1.5, 0.1], kl: 0.1, hr: [1.5, 0.1], kr: 0.1 }) })],
        throws: [T('DESERT WIND', 'toss', 22), T('SPEAR VAULT', 'flip', 24)],
        story: ['Zephyr guards the oasis at the heart of the Endless Desert. It is very hot, and very far from the shops.', 'The Soul Sabre is said to be able to make it rain. Zephyr would like some rain, please.'],
        ending: ['Zephyr planted the Soul Sabre in the sand at the oasis and waited.', 'Nothing happened for a week. Then it rained, and rained, and rained.', 'The desert is now a lovely lake. Zephyr has taken up canoeing.'] },
    ];
    const hidden = [
      { id: 'mimic', n: 'MIMIC', s: 'THE MIRROR SWORD', from: 'BEHIND THE LOOKING GLASS', stats: [3, 3, 3], lock: 1, home: 'sky', spd: 1.0, hint: 'SOMEBODY SHINY WATCHES EVERY ARCADE RUN...',
        body: { h: 1.0, w: 1.0 }, hair: 'mimic', top: 'chrome', pants: 'chrome', sleeves: 'none', shoes: 'bare',
        face: { full: '#c8ccd8', eyes: 'visor', visor: '#7af0ff', mouth: 'none', noNose: 1 },
        weapon: { kind: 'sword', len: 1.2, col: '#f4f8ff', col2: '#7af0ff', grip: '#c8ccd8', trail: '#7af0ff', angle: 0.6, edge: '#7af0ff' },
        col: { skin: '#c8ccd8', hair: '#d8dce8', top: '#c8ccd8', pants: '#c8ccd8', arm: '#c8ccd8', glove: '#c8ccd8', shoe: '#c8ccd8', neck: '#a8acb8' },
        cos: [{ col: { skin: '#d8b040', hair: '#e8c050', top: '#d8b040', pants: '#d8b040', arm: '#d8b040', glove: '#d8b040', shoe: '#d8b040', neck: '#b89030' }, look: { face: { full: '#d8b040', eyes: 'visor', visor: '#ff4a2a', mouth: 'none', noNose: 1 } } }],
        stance: { y: -0.12, lean: 0.1, twist: 0.4, sl: [0.8, 0.3], el: 1.2, sr: [1.0, 0.1, 0.3], er: 0.9, hl: [0.45, 0.12], kl: 0.55, hr: [-0.35, 0.12], kr: 0.4 },
        quote: '...', taunt: 'I am you. But shinier.',
        specials: [SP('a', 'f', { n: 'BORROWED WIND', su: 11, ac: 10, re: 18, dmg: 14, hits: 2, rng: 2.4, ht: 'h', track: true, dash: 0.07, spin: -Math.PI * 2, fx: 'ice', A: twirl, B: twirl }),
          SP('b', 'b', { n: 'BORROWED THUNDER', su: 20, ac: 5, re: 24, dmg: 19, rng: 2.6, ht: 'm', kd: true, fx: 'ice', A: overhead, B: chop }),
          SP('x', 'b', { n: 'BORROWED SHADOW', su: 6, ac: 6, re: 18, dmg: 10, rng: 2.2, ht: 'm', dash: 0.22, crush: 'high', A: POSE.crouch, B: thrust })],
        throws: [T('REFLECTION', 'hip', 22), T('MIRROR SPIN', 'spin', 22)],
        story: ['Nobody knows where Mimic came from. It copies every move it sees, and it has been watching you.', 'It does not want the Soul Sabre. It wants to be the Soul Sabre. Or possibly a toaster. It is hard to tell.'],
        ending: ['Mimic held the Soul Sabre and saw its own reflection in the blade.', 'For the first time ever, it copied nobody. It just stood there, being itself.', 'It was quite nice, actually.'] },
    ];
    const boss = { id: 'gloom', n: 'LORD GLOOM', s: 'THE ENDLESS NIGHT', from: 'VOLCANO KEEP', stats: [5, 4, 5], lock: 1, home: 'volcano', spd: 1.0, pow: 1.12, hint: 'BEAT ARCADE MODE ON NORMAL OR HARDER.', ai: { agg: 1.1 },
      body: { h: 1.18, w: 1.2, chest: 1.15, limb: 1.1 }, hair: 'horns', top: 'dark', pants: 'armour', sleeves: 'long', shoes: 'boot', extra: ['cape', 'pads', 'gauntlets', 'greaves', 'belt'], capeEmblem: 'moon',
      face: { full: '#3a2a4a', eyes: 'visor', visor: '#d04aff', mouth: 'none', noNose: 1, trim: '#b04aff' },
      weapon: { kind: 'great', len: 1.5, col: '#3a2a4a', col2: '#b04aff', grip: '#1a1a1a', trail: '#c06aff', angle: 0.6, edge: '#e09aff' },
      col: { skin: '#9a8aa8', hair: '#3a2a4a', helm: '#2a1a3a', horn: '#e8e0d0', top: '#2a1a3a', top2: '#7a2ab0', sleeve: '#3a2a4a', arm: '#2a1a3a', pants: '#1a1020', belt: '#b04aff', beltOn: 1, shoe: '#1a1020', glove: '#3a2a4a', extra: '#b04aff', pad: '#2a1a3a', gauntlet: '#2a1a3a', greave: '#2a1a3a', cape: '#3a0a5a', trim: '#b04aff', neck: '#1a1020' },
      cos: [{ col: { helm: '#e8e8f0', top: '#e8e8f0', pad: '#e8e8f0', gauntlet: '#e8e8f0', greave: '#e8e8f0', cape: '#f4f4ff', trim: '#ffd040', extra: '#ffd040', belt: '#ffd040' }, look: { face: { full: '#e8e8f0', eyes: 'visor', visor: '#ffd040', mouth: 'none', noNose: 1, trim: '#ffd040' } } }],
      stance: { y: -0.1, lean: 0.12, twist: 0.3, sl: [1.0, 0.3, 0.3], el: 1.1, sr: [1.1, 0.2, 0.3], er: 0.8, hl: [0.45, 0.18], kl: 0.5, hr: [-0.35, 0.18], kr: 0.4 },
      win2: { y: -0.02, lean: -0.15, hp: -0.25, sl: [0.4, 0.8], el: 0.3, sr: [2.9, 0.3], er: 0.1, hl: [0.2, 0.2], kl: 0.1, hr: [-0.2, 0.2], kr: 0.1 },
      quote: 'The night always wins.', taunt: 'The night always wins. Go to bed.',
      moves: [M({ id: 'gloomcleave', n: 'NIGHTFALL', btn: 'b', su: 16, ac: 5, re: 20, dmg: 16, rng: 2.8, ht: 'm', fx: 'dark', A: vA, B: vB })],
      specials: [SP('a', 'f', { n: 'ECLIPSE', su: 18, ac: 6, re: 24, dmg: 18, rng: 2.8, ht: 'm', kd: true, dash: 0.08, fx: 'dark', A: overhead, B: chop }),
        SP('b', 'b', { n: 'DARK HURRICANE', su: 14, ac: 12, re: 22, dmg: 15, hits: 3, rng: 2.7, ht: 'h', track: true, push: 0.3, spin: -Math.PI * 4, fx: 'dark', A: twirl, B: twirl }),
        SP('x', 'b', { n: 'ENDLESS NIGHT', su: 30, ac: 6, re: 26, dmg: 24, rng: 2.4, ht: 'm', unb: true, kd: true, push: 0.25, fx: 'dark', A: overhead, B: chop })],
      throws: [T('NIGHTMARE', 'slam', 28), T('GRAVE DIGGER', 'suplex', 28)],
      story: ['Lord Gloom has made it night time for ever. He says daytime is "too bright" and "too cheerful".', 'He holds the Soul Sabre in Volcano Keep, and every champion who comes to take it goes home grumpy.'],
      ending: ['Lord Gloom beat everybody, and the night went on and on.', 'Then he tripped over his own cape in the dark and decided, on balance, that a little bit of daylight would be fine.', 'Just a little bit. In the mornings.'] };
    // ---------------------------------------------------------------- the stages: a ring over water (or lava, or clouds) and a view
    const PI = Math.PI, R = s => RF.prng(s);
    // the fighting ring: a tiled top, a thick base, a trim round the edge, steps or posts at the corners
    function ring(SB, half, o) {
      const top = SB.tex(64, 64, (g, w, h) => { const r = R(o.seed || 17); g.fillStyle = o.top; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const k = 0.86 + r() * 0.28; g.fillStyle = shade(o.top, k); g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x * 16 + 1, y * 16 + 1, 14, 1); } g.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i <= 64; i += 16) { g.fillRect(i, 0, 1, 64); g.fillRect(0, i, 64, 1); } PT.noise(g, 0, 0, w, h, 0.08, r); if (o.motif) { g.strokeStyle = o.motif; g.lineWidth = 1.5; g.beginPath(); g.arc(32, 32, 10, 0, PI * 2); g.stroke(); } });
      SB.bucket({ map: top }).box(half * 2, 0.5, half * 2, { y: -0.25, wuv: 2 });
      const side = SB.tex(64, 64, (g, w, h) => PT.stone(g, w, h, { col: o.side, rows: 3, seed: 5 }));
      SB.bucket({ map: side }).box(half * 2 + 0.5, o.deep || 3.2, half * 2 + 0.5, { y: -0.5 - (o.deep || 3.2) / 2, wuv: 2 });
      const pr = SB.bucket({});
      for (const [x, z, w, d] of [[0, half + 0.02, half * 2 + 0.1, 0.1], [0, -half - 0.02, half * 2 + 0.1, 0.1], [half + 0.02, 0, 0.1, half * 2 + 0.1], [-half - 0.02, 0, 0.1, half * 2 + 0.1]]) pr.box(w, 0.08, d, { x, y: 0.015, z, col: o.edge });
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { pr.box(0.6, o.post || 0.4, 0.6, { x: x * (half + 0.25), y: (o.post || 0.4) / 2 - 0.2, z: z * (half + 0.25), col: o.postCol || shade(o.side, 1.2), grad: [1.1, 0.7] }); }
      return pr;
    }
    function water(SB, col, y, o) {
      o = o || {};
      const t = SB.tex(64, 64, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = R(23); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.22})`; g.fillRect(r() * 64 | 0, r() * 64 | 0, 6 + r() * 10 | 0, 1); } }, { rep: [40, 40] });
      SB.bucket({ map: t, emissive: o.emissive, unlit: o.unlit, ref: m => SB.on(tt => { m.material.map.offset.x = tt * (o.sx || 0.0006); m.material.map.offset.y = tt * (o.sy || 0.0003); }) }).plane(320, 320, { rx: -PI / 2, y, rep: [40, 40] });
    }
    function torch(pr, em, x, z, y) { pr.cyl(0.08, 0.1, 1.6, 6, { x, y: y + 0.8, z, col: '#3a2a1a' }); pr.cyl(0.18, 0.1, 0.25, 6, { x, y: y + 1.65, z, col: '#2a2a2a' }); em.cone(0.16, 0.4, 6, { x, y: y + 1.95, z, col: '#ffb040' }); }
    function flag(SB, x, y, z, col, col2, ry) { const t = SB.tex(32, 48, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = col2; g.fillRect(0, h * 0.4, w, h * 0.2); g.beginPath(); g.arc(w / 2, h / 2, 6, 0, PI * 2); g.fill(); }, { clamp: true }); SB.bucket({ map: t, side: SB.T.DoubleSide, ref: m => { m.position.set(x, y, z); SB.on(tt => { m.rotation.y = (ry || 0) + Math.sin(tt * 0.05 + x) * 0.15; }); } }).plane(1.2, 1.8, { x: 0.6, y: 0, z: 0 }); pr0(SB).cyl(0.06, 0.06, 3, 5, { x, y: y - 0.6, z, col: '#3a2a1a' }); }
    const pr0 = SB => SB._pole || (SB._pole = SB.bucket({}));
    const stages = [
      { id: 'castle', n: 'SUNSET CASTLE', d: 'A ring on the moat at golden hour.', music: 'fight1', build(SB) {
        SB.sky([[0, '#2a1a5a'], [0.4, '#c04a6a'], [0.7, '#ff9a4a'], [0.85, '#ffd88a'], [1, '#f0a070']], { lift: 0.02 }); SB.fog(0xf0a070, 40, 160);
        SB.disc('#fff0b0', 9, [0, 10, -150], { glow: 1 });
        SB.band((g, w, h) => PT.clouds(g, w, h, { n: 14, col: 'rgba(255,170,150,.7)', y0: 0.05, dy: 0.4, s: 22 }), { r: 130, h: 50, y: 30, rep: 2, ph: 128 });
        SB.band((g, w, h) => { PT.skyline(g, w, h, { layers: [{ kind: 'hills', col: '#8a4a6a', hmin: 0.1, hmax: 0.4 }] }); PT.skyline(g, w, h, { seed: 7, layers: [{ kind: 'castle', col: '#4a2a4a', hmin: 0.25, hmax: 0.55 }] }); }, { r: 110, h: 30, y: 8, rep: 2, ph: 128 });
        water(SB, '#2a5a9a', -2.5, { emissive: 0x201020 });
        const pr = ring(SB, 4.2, { top: '#c8b89a', side: '#7a6a5a', edge: '#ffd040' }), em = SB.bucket({ unlit: true });
        const wall = SB.tex(64, 64, (g, w, h) => PT.stone(g, w, h, { col: '#8a7a8a', rows: 5, seed: 9 }));
        const wb = SB.bucket({ map: wall });
        wb.box(40, 8, 3, { x: 0, y: 1.5, z: -26, wuv: 3 }); for (let i = -18; i <= 18; i += 2) wb.box(1, 1, 3, { x: i, y: 6, z: -26, wuv: 3 });
        for (const x of [-20, -8, 8, 20]) { wb.cyl(2.4, 2.6, 16, 10, { x, y: 5, z: -26, wuv: 3 }); pr.cone(3, 4, 10, { x, y: 15, z: -26, col: '#5a2a4a' }); flag(SB, x, 18, -26, '#3a4ab0', '#ffd040', 0); }
        for (const [x, z] of [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]]) torch(pr, em, x, z, -0.5);
        SB.crowd([[-14, 1.8, -24.5, 0], [-12, 1.8, -24.5, 0], [-10, 1.8, -24.5, 0], [10, 1.8, -24.5, 0], [12, 1.8, -24.5, 0], [14, 1.8, -24.5, 0], [-3, 1.8, -24.5, 0], [3, 1.8, -24.5, 0]], { cols: ['#3a4ab0', '#c01a1a', '#ffd040', '#f4f4f4'] });
        SB.drift({ n: 30, box: [-10, 10, 0.5, 6, -10, 6], vy: 0.01, sway: 0.02, col: '#ffd890', size: 0.06, add: true, cell: 1, flick: 1 });
        SB.light({ amb: 0.75, sky: 0xffd0b0, ground: 0x5a3a5a, sun: 1.0, sunCol: 0xffc890, dir: [0, 0.45, -1], rim: 1.0, rimCol: 0xffe0a0 });
        return { ring: 4.2, waterY: -2.5, splashCol: '#e8f4ff' };
      } },
      { id: 'shrine', n: 'WATERFALL SHRINE', d: 'A red gate, a pool, a very loud waterfall.', music: 'fight2', build(SB) {
        SB.sky([[0, '#3a8ad8'], [0.55, '#9ad0f0'], [1, '#c8f0e8']]); SB.fog(0x9ad0e0, 30, 120);
        SB.band((g, w, h) => PT.skyline(g, w, h, { layers: [{ kind: 'peaks', col: '#7aa0b8', hmin: 0.3, hmax: 0.9, snow: '#f4f8ff' }, { kind: 'trees', col: '#2a6a4a', hmin: 0.1, hmax: 0.35 }] }), { r: 110, h: 40, y: 10, rep: 2, ph: 128 });
        water(SB, '#1a6a7a', -2.5, { emissive: 0x002020 });
        const pr = ring(SB, 4.2, { top: '#a08a6a', side: '#5a4a3a', edge: '#e03a2a', motif: '#e03a2a' });
        const rock = SB.tex(64, 64, (g, w, h) => { PT.stone(g, w, h, { col: '#6a7a6a', rows: 6, seed: 3 }); const r = R(4); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,${100 + r() * 60 | 0},50,.35)`; g.fillRect(r() * w | 0, r() * h | 0, 4, 2); } });
        const rb = SB.bucket({ map: rock });
        rb.box(80, 44, 12, { x: 0, y: 14, z: -46, wuv: 6 }); rb.box(20, 30, 20, { x: -40, y: 8, z: -30, ry: 0.4, wuv: 6 }); rb.box(20, 26, 20, { x: 40, y: 6, z: -30, ry: -0.4, wuv: 6 });
        const fallT = SB.tex(32, 64, (g, w, h) => { g.fillStyle = '#cfefff'; g.fillRect(0, 0, w, h); const r = R(29); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,170,220,${0.2 + r() * 0.5})`; g.fillRect(r() * 32 | 0, r() * 64 | 0, 1 + r() * 3 | 0, 8 + r() * 20 | 0); } }, { rep: [2, 4] });
        SB.bucket({ map: fallT, unlit: true, ref: m => SB.on(t => { m.material.map.offset.y = t * 0.025; }) }).plane(14, 40, { x: 0, y: 15, z: -39.9, rep: [2, 4] });
        SB.drift({ n: 50, box: [-8, 8, -2.5, 4, -40, -36], vy: 0.05, sway: 0.03, col: '#ffffff', size: 1.2, cell: 3, a: 0.35 });
        // the red gate behind the ring
        const red = '#d02a1a';
        for (const x of [-3.4, 3.4]) pr.cyl(0.26, 0.3, 6.5, 10, { x, y: 2.75, z: -8, col: red });
        pr.box(9.2, 0.5, 0.7, { x: 0, y: 6.1, z: -8, col: red }); pr.box(10.4, 0.35, 0.9, { x: 0, y: 6.6, z: -8, col: '#1a1a1a' }); pr.box(8, 0.3, 0.5, { x: 0, y: 5.0, z: -8, col: red });
        for (const x of [-3.4, 3.4]) pr.box(0.8, 0.8, 0.8, { x, y: -0.1, z: -8, col: '#2a2a2a' });
        for (let i = 0; i < 4; i++) pr.box(0.9, 0.18, 0.9, { x: -6.5 + (i % 2) * 13, y: 1.2 + (i > 1 ? 0.6 : 0), z: -6, col: '#8a8a7a' });
        const r = R(9); for (let i = 0; i < 16; i++) { const x = (r() < 0.5 ? -1 : 1) * (12 + r() * 14), z = -30 + r() * 28; pr.cyl(0.3, 0.4, 3, 6, { x, y: 1.5 - 2.5, z, col: '#5a3a2a' }); pr.ball(2.2 + r(), 8, 6, { x, y: 3.2 - 2.5 + r(), z, col: r() < 0.3 ? '#ff9ac0' : '#3a8a4a', sy: 0.8 }); }
        SB.crowd([[-9, -0.5, -10, 0.4], [-10, -0.5, -8, 0.6], [9, -0.5, -10, -0.4], [10, -0.5, -8, -0.6]].concat([[-11, -0.5, -5, 0.8], [11, -0.5, -5, -0.8]]), { cols: ['#f4f4f4', '#d02a1a', '#2a4a8a'] });
        SB.light({ amb: 0.9, sky: 0xd8f0ff, ground: 0x3a5a4a, sun: 0.9, sunCol: 0xfff8e0, dir: [0.5, 1, 0.5], rim: 0.5, rimCol: 0xa0e0ff });
        return { ring: 4.2, waterY: -2.5, splashCol: '#e0fff8' };
      } },
      { id: 'harbour', n: 'HARBOUR RAFT', d: 'A raft in the harbour. The fishmongers are watching.', music: 'fight3', build(SB) {
        SB.sky([[0, '#2a6ad8'], [0.55, '#9ac8f8'], [1, '#d8f0ff']]); SB.fog(0xbfe0ff, 40, 150);
        SB.band((g, w, h) => PT.clouds(g, w, h, { n: 12, col: 'rgba(255,255,255,.85)', y0: 0.1, dy: 0.5, s: 22 }), { r: 130, h: 50, y: 30, rep: 2, ph: 128 });
        water(SB, '#1a4a9a', -1.6, { emissive: 0x001030 });
        const raft = SB.tex(64, 64, (g, w, h) => PT.planks(g, w, h, { col: '#a07a4a', n: 6, seed: 2 }));
        SB.bucket({ map: raft }).box(8.2, 0.5, 8.2, { y: -0.25, wuv: 2 });
        const pr = SB.bucket({});
        for (let i = -3; i <= 3; i++) pr.cyl(0.35, 0.35, 8.6, 10, { x: i * 1.18, y: -0.85, z: 0, rx: PI / 2, col: '#6a4a2a' });
        for (const [x, z] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]]) { pr.cyl(0.12, 0.12, 1.4, 6, { x, y: 0.4, z, col: '#5a3a1a' }); pr.torus(0.12, 0.04, 4, 8, { x, y: 1.0, z, rx: PI / 2, col: '#e8dcc0' }); }
        for (const x of [-4.2, 4.2]) pr.cyl(0.025, 0.025, 8.4, 4, { x, y: 0.9, z: 0, rx: PI / 2, col: '#e8dcc0' });
        const quay = SB.tex(64, 64, (g, w, h) => PT.stone(g, w, h, { col: '#9a9a9a', rows: 4 }));
        SB.bucket({ map: quay }).box(90, 4, 8, { y: -0.5, z: -34, wuv: 3 });
        const house = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); PT.noise(g, 0, 0, w, h, 0.08, R(3)); g.fillStyle = '#3a5a8a'; for (const [x, y] of [[8, 10], [36, 10], [8, 36], [36, 36]]) { g.fillRect(x, y, 18, 16); g.fillStyle = '#f4f4f4'; g.fillRect(x + 8, y, 2, 16); g.fillRect(x, y + 7, 18, 2); g.fillStyle = '#3a5a8a'; } });
        const hb = SB.bucket({ map: house }); const cols = ['#c02a1a', '#2a5a9a', '#2a8a4a', '#e0a020', '#8a2a8a', '#c06a1a'];
        for (let i = 0; i < 10; i++) { const x = -36 + i * 8, hh = 7 + (i % 3) * 2; hb.box(7, hh, 6, { x, y: 1.5 + hh / 2, z: -40, rep: [1, 1] }); pr.box(7.6, 0.6, 6.6, { x, y: 1.6 + hh, z: -40, col: cols[i % cols.length] }); pr.cone(5, 2.6, 4, { x, y: 3.2 + hh, z: -40, ry: PI / 4, sz: 0.9, col: shade(cols[i % cols.length], 0.8) }); }
        // boats bobbing
        const boats = []; for (const [x, z, s, c] of [[-22, -22, 1.4, '#c01a1a'], [20, -26, 1.8, '#2a5ad0'], [30, -8, 1.0, '#f4f4f4'], [-30, -6, 1.2, '#2a8a3a']]) { const bb = SB.bucket({ ref: m => { m.position.set(x, -1.2, z); m.scale.setScalar(s); boats.push(m); } }); bb.box(8, 1.6, 2.8, { col: c, grad: [1.1, 0.7] }); bb.box(7.2, 0.2, 2.4, { y: 0.8, col: '#8a6a3a' }); bb.box(0.2, 7, 0.2, { y: 4, col: '#6a4a2a' }); bb.box(0.08, 4.5, 3.6, { y: 4.4, x: 0.15, ry: PI / 2, col: '#f8f4e8' }); bb.box(2, 1.2, 1.6, { x: -2, y: 1.4, col: '#e8e0d0' }); }
        SB.on(t => boats.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.02 + i) * 0.05; b.position.y = -1.2 + Math.sin(t * 0.03 + i) * 0.1; }));
        SB.crowd(Array.from({ length: 22 }, (_, i) => [-26 + i * 2.4 + (i % 3) * 0.3, 1.5, -31 + (i % 2) * 0.8, 0]), { cols: ['#c01a1a', '#2a5ad0', '#f4f4f4', '#ffd040', '#2a8a3a', '#5a3a1a'] });
        SB.drift({ n: 10, box: [-24, 24, 6, 14, -30, 0], vy: 0, vx: 0.04, sway: 0.04, col: '#ffffff', size: 0.5, cell: 0 });
        SB.light({ amb: 0.95, sky: 0xffffff, ground: 0x4a6a8a, sun: 0.9, sunCol: 0xfff4e0, dir: [0.4, 1, 0.6], rim: 0.4 });
        return { ring: 4.1, waterY: -1.6, splashCol: '#ffffff' };
      } },
      { id: 'cherry', n: 'CHERRY BLOSSOM BRIDGE', d: 'Moonlight, lanterns and falling petals.', music: 'fight2', build(SB) {
        SB.sky([[0, '#0a0a2a'], [0.6, '#2a2a5a'], [1, '#5a4a7a']]); SB.stars(160); SB.fog(0x2a2a4a, 30, 110);
        SB.disc('#fff8e0', 7, [-40, 40, -120], { glow: 1 });
        SB.band((g, w, h) => PT.skyline(g, w, h, { layers: [{ kind: 'peaks', col: '#2a2a4a', hmin: 0.3, hmax: 0.8 }, { kind: 'trees', col: '#1a1a30', hmin: 0.1, hmax: 0.3 }] }), { r: 110, h: 34, y: 8, rep: 2, ph: 128 });
        water(SB, '#1a2a5a', -2.6, { emissive: 0x0a0a20, sx: 0.001 });
        const pr = ring(SB, 4.2, { top: '#8a5a3a', side: '#5a3020', edge: '#d02a1a', post: 1.2, postCol: '#d02a1a' }), em = SB.bucket({ unlit: true });
        // the bridge rails and a pagoda
        for (const s of [-1, 1]) { pr.box(9.2, 0.12, 0.12, { x: 0, y: 1.0, z: s * 4.5, col: '#d02a1a' }); for (let i = -4; i <= 4; i += 2) pr.box(0.12, 1.0, 0.12, { x: i, y: 0.5, z: s * 4.5, col: '#d02a1a' }); }
        for (let i = 0; i < 4; i++) { const y = 2 + i * 3.4, w2 = 9 - i * 1.6; pr.box(w2 * 0.7, 3, w2 * 0.7, { x: 18, y: y + 1.5, z: -30, col: '#d8c8a8' }); pr.box(w2 * 1.15, 0.5, w2 * 1.15, { x: 18, y: y + 3.1, z: -30, col: '#3a2a3a' }); em.box(w2 * 0.5, 1.2, 0.05, { x: 18, y: y + 1.6, z: -30 + w2 * 0.35 + 0.03, col: '#ffcc80' }); }
        pr.cone(1, 4, 6, { x: 18, y: 17.5, z: -30, col: '#3a2a3a' });
        const r = R(12);
        for (let i = 0; i < 12; i++) { const x = (r() < 0.5 ? -1 : 1) * (10 + r() * 16), z = -28 + r() * 30; pr.cyl(0.3, 0.45, 4, 6, { x, y: 0, z, col: '#3a2020' }); for (let k = 0; k < 4; k++) pr.ball(1.6 + r(), 8, 6, { x: x + (r() - 0.5) * 2.4, y: 2.6 + r() * 1.6, z: z + (r() - 0.5) * 2.4, col: shade('#ffaacc', 0.85 + r() * 0.3) }); }
        for (const [x, z] of [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]]) { pr.cyl(0.08, 0.08, 1.4, 6, { x, y: 1.6, z, col: '#2a1a1a' }); em.cyl(0.32, 0.32, 0.6, 8, { x, y: 2.6, z, col: '#ff8a3a' }); }
        SB.drift({ n: 90, box: [-12, 12, -2, 9, -14, 8], vy: -0.012, vx: 0.01, sway: 0.02, cols: ['#ffb0d0', '#ffd0e0', '#ff90b8'], size: 0.12, cell: 3, a: 0.95 });
        SB.crowd([[-10, -0.5, -6, 0.9], [-11, -0.5, -3, 1.2], [10, -0.5, -6, -0.9], [11, -0.5, -3, -1.2], [-9, -0.5, -9, 0.6], [9, -0.5, -9, -0.6]], { cols: ['#d02a5a', '#2a2a6a', '#f4f4f4', '#5a2a8a'] });
        SB.light({ amb: 0.7, sky: 0xa0a8ff, ground: 0x302040, sun: 0.75, sunCol: 0xd8e0ff, dir: [-0.4, 0.8, -0.6], rim: 0.9, rimCol: 0xffa0d0 });
        return { ring: 4.2, waterY: -2.6, splashCol: '#c8d8ff' };
      } },
      { id: 'colosseum', n: 'GRAND COLOSSEUM', d: 'Ten thousand people, all shouting your name. Probably.', music: 'fight1', build(SB) {
        SB.sky([[0, '#3a7ad8'], [0.6, '#8ac0f0'], [1, '#e8f0f8']]); SB.fog(0xe0d8c8, 40, 140);
        const sand = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#d8c090'; g.fillRect(0, 0, w, h); PT.noise(g, 0, 0, w, h, 0.18, R(5), 1); });
        SB.bucket({ map: sand }).plane(80, 80, { rx: -PI / 2, y: -1.8, wuv: 4 });
        ring(SB, 4.2, { top: '#c8b090', side: '#a89070', edge: '#c01a1a', deep: 1.4, motif: '#8a5a20' });
        const stoneT = SB.tex(64, 64, (g, w, h) => PT.stone(g, w, h, { col: '#c8b898', rows: 4, seed: 6 }));
        const st = SB.bucket({ map: stoneT }), pr = SB.bucket({});
        // the stands: rings of steps all the way round, with arches at the top
        for (let i = 0; i < 6; i++) st.cyl(26 + i * 2.2, 26 + i * 2.2, 1.6 + i * 1.6, 40, { y: -1.8 + (1.6 + i * 1.6) / 2, open: true, wuv: 3 });
        st.cyl(26, 26, 2.2, 40, { y: -0.7, open: true, wuv: 3 });
        for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, rr = 39.5; pr.box(1.4, 6, 0.8, { x: Math.sin(a) * rr, y: 11, z: Math.cos(a) * rr, ry: a, col: '#b8a888', grad: [1.1, 0.7] }); }
        pr.cyl(40.5, 40.5, 1.2, 40, { y: 14.5, open: true, col: '#a89878' });
        const spots = []; const r = R(31);
        for (let row = 0; row < 5; row++) for (let i = 0; i < 26; i++) { const a = (i + row * 0.5 + r() * 0.4) / 26 * PI * 2, rr = 27.2 + row * 2.2; spots.push([Math.sin(a) * rr, -1.8 + (row + 1) * 1.6, Math.cos(a) * rr, a + PI]); }
        SB.crowd(spots, { scale: 1.3, cols: ['#c01a1a', '#f4f4f4', '#2a5ad0', '#ffd040', '#2a8a3a', '#8a2a8a', '#f08a1a', '#1a1a1a'] });
        for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; flag(SB, Math.sin(a) * 40, 17, Math.cos(a) * 40, ['#c01a1a', '#ffd040', '#2a5ad0', '#f4f4f4'][i % 4], '#1a1a1a', -a); }
        SB.light({ amb: 0.72, sky: 0xfff0d8, ground: 0x6a5040, sun: 0.85, sunCol: 0xffe8c0, dir: [0.5, 0.8, 0.4], rim: 0.5, rimCol: 0xffd090 });
        return { ring: 4.2, waterY: -1.8, splashCol: '#e8d8b0', dustCol: '#d8c090' };
      } },
      { id: 'ice', n: 'ICE PALACE', d: 'A frozen lake under the northern lights.', music: 'fight3', build(SB) {
        SB.sky([[0, '#02041a'], [0.5, '#0a2a4a'], [1, '#2a6a8a']]); SB.stars(200); SB.fog(0x1a3a5a, 30, 120);
        // the aurora: soft green curtains (additive)
        const au = SB.tex(64, 64, (g, w, h) => { for (let x = 0; x < w; x++) { const k = 0.5 + Math.sin(x * 0.3) * 0.3 + Math.sin(x * 0.11) * 0.2; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(60,255,160,${0.35 * k})`); gr.addColorStop(1, 'rgba(60,120,255,0)'); g.fillStyle = gr; g.fillRect(x, 0, 1, h); } });
        SB.bucket({ map: au, add: true, side: SB.T.DoubleSide, ref: m => SB.on(t => { m.material.map.offset.x = t * 0.0006; }) }).cyl(100, 100, 40, 32, { y: 38, open: true });
        const ice = SB.tex(64, 64, (g, w, h) => { PT.vgrad(g, 0, 0, w, h, [[0, '#a8d8f0'], [1, '#7ab8e0']]); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; const r = R(7); for (let i = 0; i < 8; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 20; y += (r() - 0.5) * 20; g.lineTo(x, y); } g.stroke(); } });
        SB.bucket({ map: ice, emissive: 0x102030 }).plane(320, 320, { rx: -PI / 2, y: -2.2, wuv: 6 });
        ring(SB, 4.2, { top: '#d8eef8', side: '#8ab8d0', edge: '#7af0ff', motif: '#5ac8f0' });
        const pr = SB.bucket({}), gl = SB.bucket({ transparent: true, opacity: 0.85 });
        const r = R(14);
        for (let i = 0; i < 16; i++) { const a = r() * PI * 2, d = 16 + r() * 30, h = 4 + r() * 14; gl.cone(1 + r() * 2, h, 6, { x: Math.sin(a) * d, y: -2.2 + h / 2, z: Math.cos(a) * d - 10, col: shade('#a8e0ff', 0.8 + r() * 0.3) }); }
        // the palace
        for (const [x, h, w2] of [[-12, 18, 4], [-6, 26, 5], [0, 32, 6], [6, 26, 5], [12, 18, 4]]) { pr.box(w2, h, w2, { x, y: -2 + h / 2, z: -50, col: '#c8e8ff', grad: [1.2, 0.7] }); pr.cone(w2 * 0.8, w2 * 1.6, 6, { x, y: -2 + h + w2 * 0.8, z: -50, col: '#9ad0ff' }); }
        SB.drift({ n: 110, box: [-14, 14, -2, 12, -14, 10], vy: -0.02, vx: 0.006, sway: 0.01, col: '#ffffff', size: 0.08, cell: 3, a: 0.9 });
        SB.crowd([[-9, -2.2, -8, 0.6], [-10, -2.2, -5, 0.9], [9, -2.2, -8, -0.6], [10, -2.2, -5, -0.9], [-8, -2.2, -10, 0.4], [8, -2.2, -10, -0.4]], { cols: ['#f4f4f4', '#2a5ad0', '#c01a1a'] });
        SB.light({ amb: 0.8, sky: 0xc0e8ff, ground: 0x203858, sun: 0.85, sunCol: 0xe0f4ff, dir: [-0.3, 0.9, 0.5], rim: 1.0, rimCol: 0x6affc0 });
        return { ring: 4.2, waterY: -2.2, splashCol: '#e8f8ff', dustCol: '#e8f4ff' };
      } },
      { id: 'sky', n: 'SKY TEMPLE', d: 'Above the clouds. It is a long way down.', music: 'fight4', build(SB) {
        SB.sky([[0, '#1a5ad8'], [0.6, '#7ab8f8'], [1, '#e8f4ff']], { lift: -0.2 }); SB.fog(0xd8ecff, 40, 160);
        SB.disc('#ffffff', 6, [60, 70, -100], { glow: 1 });
        const cl = SB.tex(128, 128, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); PT.clouds(g, w, h, { n: 30, col: 'rgba(255,255,255,.95)', y0: 0, dy: 1, s: 26 }); }, { rep: [6, 6] });
        SB.bucket({ map: cl, transparent: true, ref: m => SB.on(t => { m.material.map.offset.x = t * 0.0004; }) }).plane(400, 400, { rx: -PI / 2, y: -12, rep: [6, 6] });
        SB.bucket({ map: cl, transparent: true, opacity: 0.6, ref: m => SB.on(t => { m.material.map.offset.x = -t * 0.0003; }) }).plane(400, 400, { rx: -PI / 2, y: -7, rep: [4, 4] });
        ring(SB, 4.2, { top: '#f0e8d8', side: '#c8b898', edge: '#ffd040', deep: 3, motif: '#ffd040' });
        const pr = SB.bucket({});
        pr.cone(4.6, 7, 8, { y: -7.5, rx: PI, col: '#a89878' });
        for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; if (Math.abs(Math.sin(a)) < 0.5 && Math.cos(a) > 0) continue; const x = Math.sin(a) * 7, z = Math.cos(a) * 7; pr.cyl(0.45, 0.5, 7, 10, { x, y: 3.5 - 1.5, z, col: '#f4ecdc', grad: [1.1, 0.8] }); pr.box(1.3, 0.5, 1.3, { x, y: 5.8, z, col: '#e8dcc8' }); }
        pr.cyl(9, 7, 0.6, 24, { y: -1.4, col: '#d8c8a8' });
        // floating islands
        const r = R(19); for (let i = 0; i < 6; i++) { const a = r() * PI * 2, d = 24 + r() * 30, y = -4 + r() * 10; pr.cone(3 + r() * 3, 6 + r() * 4, 7, { x: Math.sin(a) * d, y, z: Math.cos(a) * d, rx: PI, col: '#8a7a6a' }); pr.cyl(3.4, 3.4, 0.8, 8, { x: Math.sin(a) * d, y: y + 3.4, z: Math.cos(a) * d, col: '#5aa04a' }); }
        SB.drift({ n: 30, box: [-12, 12, -3, 8, -12, 8], vy: 0.01, sway: 0.03, col: '#fff8d0', size: 0.06, add: true, cell: 1 });
        SB.crowd([[-6.2, -1.1, -6.2, 0.8], [6.2, -1.1, -6.2, -0.8], [-7, -1.1, 3, 1.6], [7, -1.1, 3, -1.6]], { cols: ['#f08a1a', '#8a1a1a'] });
        SB.light({ amb: 1.0, sky: 0xffffff, ground: 0xa0b0c8, sun: 0.9, sunCol: 0xfff8e8, dir: [0.6, 0.9, -0.5], rim: 0.6, rimCol: 0xffffff });
        return { ring: 4.2, waterY: -12, splashCol: '#ffffff', noSplash: 1 };
      } },
      { id: 'volcano', n: 'VOLCANO KEEP', d: 'Lord Gloom\'s home. Lava below. Do not fall in.', music: 'boss', boss: 1, lock: 1, build(SB) {
        SB.sky([[0, '#05030a'], [0.45, '#2a0a1a'], [0.75, '#8a1a0a'], [1, '#3a0a0a']]); SB.fog(0x3a0a0a, 28, 100);
        SB.band((g, w, h) => PT.skyline(g, w, h, { layers: [{ kind: 'peaks', col: '#1a0a0a', hmin: 0.2, hmax: 0.7 }] }), { r: 110, h: 30, y: 8, rep: 2, ph: 128 });
        water(SB, '#ff4a0a', -2.6, { unlit: true, sx: 0.0004, sy: 0.0002 });
        const lava2 = SB.tex(64, 64, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); const r = R(5); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(40,10,5,${0.5 + r() * 0.4})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 8, 2 + r() * 5, r() * 3, 0, PI * 2); g.fill(); } }, { rep: [30, 30] });
        SB.bucket({ map: lava2, transparent: true, unlit: true, ref: m => SB.on(t => { m.material.map.offset.x = -t * 0.0003; }) }).plane(320, 320, { rx: -PI / 2, y: -2.55, rep: [30, 30] });
        ring(SB, 4.2, { top: '#4a3a3a', side: '#2a1a1a', edge: '#ff5a1a', motif: '#b04aff' });
        const pr = SB.bucket({}), em = SB.bucket({ unlit: true, ref: m => SB.on(t => { m.scale.y = 1 + Math.sin(t * 0.05) * 0.15; }) });
        pr.cyl(10, 34, 34, 12, { y: 10, z: -80, col: '#2a1a1a', grad: [1.3, 0.6] }); em.cyl(9.5, 9.5, 0.6, 12, { y: 27.2, z: -80, col: '#ff6a1a' });
        for (const [x, z, h] of [[-12, -10, 10], [12, -12, 12], [-16, 6, 8], [16, 8, 9], [-8, 14, 7], [9, 15, 8]]) { pr.cyl(0.3, 2.4, h, 6, { x, y: h / 2 - 3, z, col: '#2a1a1a' }); }
        // the dark keep behind
        for (const [x, h] of [[-8, 16], [0, 22], [8, 16]]) { pr.box(5, h, 5, { x, y: h / 2 - 2.6, z: -24, col: '#1a1020', grad: [1.1, 0.6] }); pr.cone(3.8, 6, 4, { x, y: h + 0.4, z: -24, ry: PI / 4, col: '#2a1a3a' }); }
        const win = SB.bucket({ unlit: true }); for (const x of [-8, 0, 8]) for (let y = 4; y < 14; y += 4) win.box(0.8, 1.4, 0.1, { x, y, z: -21.45, col: '#b04aff' });
        SB.drift({ n: 80, box: [-14, 14, -2.6, 12, -14, 10], vy: 0.04, sway: 0.02, cols: ['#ff8a2a', '#ffd040', '#ff4a1a'], size: 0.08, add: true, cell: 1, flick: 1 });
        SB.crowd([[-7, -2.6, -18, 0.2], [-5, -2.6, -18, 0.1], [5, -2.6, -18, -0.1], [7, -2.6, -18, -0.2]], { scale: 1.2, cols: ['#1a1020', '#2a1a3a'], skins: ['#5a4a6a'] });
        SB.light({ amb: 0.65, sky: 0xff8a6a, ground: 0x401010, sun: 0.75, sunCol: 0xffb080, dir: [0, 0.6, 1], rim: 1.2, rimCol: 0xff5a1a });
        return { ring: 4.2, waterY: -2.6, splashCol: '#ffb04a' };
      } },
      { id: 'galleon', n: 'PIRATE GALLEON', d: 'A duel on deck. Over the side means the sharks.', music: 'fight4', lock: 'surv', build(SB) {
        SB.sky([[0, '#1a3a8a'], [0.6, '#6aa0e0'], [1, '#c8e0f0']]); SB.fog(0xa8c8e0, 40, 150);
        water(SB, '#1a3a7a', -3, { emissive: 0x001020, sx: 0.001 });
        const deck = SB.tex(64, 64, (g, w, h) => PT.planks(g, w, h, { col: '#9a6a3a', n: 8, seed: 11 }));
        SB.bucket({ map: deck }).box(9, 0.5, 9, { y: -0.25, wuv: 2 });
        const pr = SB.bucket({});
        pr.box(10, 3, 22, { y: -1.9, z: -3, col: '#5a3a1a', grad: [1.1, 0.6] }); pr.box(10.2, 0.4, 22.2, { y: -0.3, z: -3, col: '#3a2a1a' });
        pr.box(9, 3, 6, { y: 1.5, z: -11, col: '#6a4a2a' }); pr.box(9.4, 0.3, 6.4, { y: 3.1, z: -11, col: '#3a2a1a' });
        for (const [z, h] of [[-7, 16], [6, 13]]) { pr.cyl(0.25, 0.32, h, 8, { y: h / 2, z: z, col: '#5a3a1a' }); pr.box(6, 0.2, 0.2, { y: h * 0.6, z, col: '#5a3a1a' }); pr.box(5.6, h * 0.42, 0.08, { y: h * 0.62, z: z + 0.2, col: '#f4ecdc' }); pr.box(0.9, 0.6, 0.9, { y: h + 0.1, z, col: '#3a2a1a' }); }
        const fl = SB.tex(48, 32, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(24, 14, 6, 0, PI * 2); g.fill(); g.fillRect(19, 18, 10, 4); g.fillStyle = '#111'; g.fillRect(20, 12, 3, 3); g.fillRect(25, 12, 3, 3); }, { clamp: true });
        SB.bucket({ map: fl, side: SB.T.DoubleSide, ref: m => SB.on(t => { m.rotation.y = Math.sin(t * 0.06) * 0.2; }) }).plane(2.4, 1.6, { x: 1.2, y: 17.6, z: -7 });
        for (const s of [-1, 1]) for (let z = -12; z <= 6; z += 2) pr.box(0.15, 0.9, 0.15, { x: s * 4.9, y: 0.45, z, col: '#3a2a1a' });
        for (const s of [-1, 1]) pr.box(0.2, 0.15, 19, { x: s * 4.9, y: 0.95, z: -3, col: '#3a2a1a' });
        for (const s of [-1, 1]) for (let z = -10; z <= 4; z += 4) pr.cyl(0.2, 0.25, 1.2, 8, { x: s * 5.2, y: -1.2, z, rz: PI / 2, col: '#1a1a1a' });
        // the island behind
        pr.cone(16, 10, 10, { x: -40, y: -1, z: -60, col: '#d8c090' }); for (let i = 0; i < 3; i++) palm(pr, -40 + i * 4 - 4, -58 + i, 6 + i);
        SB.crowd([[-3, 3.25, -12, 0], [-1, 3.25, -12, 0], [1, 3.25, -12, 0], [3, 3.25, -12, 0], [-2, 3.25, -10, 0], [2, 3.25, -10, 0]], { cols: ['#c01a1a', '#f4f4f4', '#1a1a1a', '#2a3a8a'] });
        SB.drift({ n: 8, box: [-20, 20, 6, 14, -30, 0], vy: 0, vx: 0.04, sway: 0.03, col: '#ffffff', size: 0.5, cell: 0 });
        SB.light({ amb: 0.9, sky: 0xffffff, ground: 0x4a5a7a, sun: 0.9, sunCol: 0xfff0d0, dir: [0.5, 1, 0.3], rim: 0.5 });
        return { ring: 4.5, waterY: -3, splashCol: '#ffffff' };
      } },
    ];
    function palm(b, x, z, h) { for (let i = 0; i < 6; i++) b.cyl(0.12, 0.15, h / 6, 6, { x: x + Math.sin(i * 0.3) * 0.15 * i, y: h / 12 + i * h / 6, z, col: i % 2 ? '#8a6a3a' : '#6a4a2a' }); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; b.box(0.35, 0.05, 1.8, { x: x + 0.75 + Math.sin(a) * 0.8, y: h - 0.1, z: z + Math.cos(a) * 0.8, ry: a, rx: 0.4, col: '#2a8a2a' }); } }
    // ---------------------------------------------------------------- the tunes (original: sweeping and heroic)
    const music = {
      title: { bpm: 92, wave: 'triangle', vol: 0.07, lead: mel('A4 - - - C5 - E5 - - - - - D5 - C5 - B4 - - - - - - - . . . . . . . . A4 - - - C5 - F5 - - - - - E5 - D5 - E5 - - - - - - - . . . . . . . .'), bass: mel('A2 . . . E3 . . . A2 . . . E3 . . . G2 . . . D3 . . . G2 . . . D3 . . . F2 . . . C3 . . . F2 . . . C3 . . . E2 . . . B2 . . . E2 . . . G#2 . . .'), drums: 'o.......x.......' },
      select: { bpm: 112, wave: 'triangle', vol: 0.07, lead: mel('D5 . F5 . A5 . F5 . G5 . E5 . C5 . E5 . D5 . F5 . A5 . D6 . C6 - A5 - G5 - - -'), bass: mel('D3 . . . A2 . . . C3 . . . G2 . . . Bb2 . . . F2 . . . A2 . . . A2 . . .'), drums: 'o...x...o.o.x...' },
      vs: { bpm: 132, wave: 'square', vol: 0.04, lead: mel('D5 - - - . . D5 - C5 - - - . . A4 - Bb4 - - - . . C5 - A4 - - - - - - -'), bass: mel('D2 . D2 . D3 . D2 . D2 . D2 . D3 . D2 . Bb1 . Bb1 . Bb2 . Bb1 . A1 . A1 . A2 . A1 .'), drums: 'o.o.x.o.o.o.x.oo' },
      story: { bpm: 80, wave: 'triangle', vol: 0.08, lead: mel('A4 - - - E5 - - - D5 - C5 - B4 - - - C5 - - - A4 - - - G4 - - - A4 - - -'), bass: mel('A2 . . . . . . . F2 . . . . . . . G2 . . . . . . . E2 . . . . . . .') },
      fight1: { bpm: 140, wave: 'square', vol: 0.04, lead: mel('D5 . D5 F5 A5 - G5 F5 E5 - D5 - C#5 - A4 - D5 . D5 F5 A5 - Bb5 A5 G5 - F5 - E5 - - - F5 . F5 A5 C6 - Bb5 A5 G5 - F5 - E5 - C5 - D5 . E5 . F5 . G5 . A5 - - - - - - -'), bass: mel('D2 . D3 . D2 . D3 . Bb1 . Bb2 . A1 . A2 . D2 . D3 . D2 . D3 . G1 . G2 . A1 . A2 .'), drums: 'o...x.o.o...x...' },
      fight2: { bpm: 126, wave: 'triangle', vol: 0.07, lead: mel('E5 . G5 . A5 - - . B5 . A5 . G5 . E5 . D5 . E5 . G5 - - . . . . . . . . . E5 . G5 . A5 - - . D6 . B5 . A5 . G5 . A5 - - - - . . .'), bass: mel('E2 . . E3 . . E2 . C2 . . C3 . . C2 . D2 . . D3 . . D2 . B1 . . B2 . . B1 .'), drums: 'o..x..o.x..o.x..' },
      fight3: { bpm: 150, wave: 'square', vol: 0.035, lead: mel('B4 . D5 . F#5 . B5 - A5 . F#5 . E5 . D5 . E5 . F#5 . A5 . G5 - F#5 . E5 . D5 - - - B4 . D5 . F#5 . B5 - C#6 . D6 . C#6 . A5 . B5 . F#5 . A5 . E5 . F#5 - - -'), bass: mel('B1 . B2 . B1 . B2 . G1 . G2 . G1 . G2 . A1 . A2 . A1 . A2 . F#1 . F#2 . F#1 . F#2 .'), drums: 'o.x.o.xxo.x.o.x.' },
      fight4: { bpm: 120, wave: 'triangle', vol: 0.07, lead: mel('G5 - D5 - G5 - A5 - B5 - - - A5 - G5 - E5 - - - D5 - E5 - G5 - - - - - - - G5 - D5 - G5 - A5 - B5 - - - D6 - B5 - C6 - B5 - A5 - G5 - - - - - - -'), bass: mel('G2 . . . D3 . . . E2 . . . B2 . . . C3 . . . G2 . . . D3 . . . D2 . . .'), drums: 'o...x...o..ox...' },
      boss: { bpm: 144, wave: 'sawtooth', vol: 0.038, lead: mel('C5 . . C5 Eb5 . G5 . F#5 - G5 - Eb5 - C5 - Ab4 . . Ab4 C5 . Eb5 . D5 - Eb5 - B4 - G4 - C5 . . C5 Eb5 . G5 . C6 - B5 - Ab5 - G5 - F5 . Eb5 . D5 . Eb5 . F5 - - - G5 - - -'), bass: mel('C2 C2 . C3 C2 C2 . C3 Ab1 Ab1 . Ab2 G1 G1 . G2'), drums: 'oox.o.x.oox.o.xx' },
      win: { bpm: 120, wave: 'triangle', vol: 0.08, lead: mel('D5 F#5 A5 D6 - - A5 - B5 - A5 - F#5 - - - G5 B5 D6 G6 - - D6 - E6 - D6 - A5 - - -'), bass: mel('D3 . A2 . D3 . A2 . D3 . A2 . D3 . A2 . G2 . D3 . G2 . D3 . A2 . E3 . A2 . C#3 .'), drums: 'o...x...o...x...' },
      ending: { bpm: 76, wave: 'triangle', vol: 0.09, lead: mel('D5 - - - F#5 - A5 - B5 - - - A5 - - - G5 - - - F#5 - E5 - F#5 - - - - - - - D5 - - - F#5 - A5 - D6 - - - C#6 - - - B5 - - - A5 - G5 - A5 - - - - - - -'), bass: mel('D3 . . . A2 . . . B2 . . . F#2 . . . G2 . . . D2 . . . A2 . . . A2 . . .') },
    };
    const how = K => [
      ['THE BUTTONS', `!${K.label('a')} SWEEPING SLASH: GOES SIDEWAYS, CATCHES PEOPLE`, '  WHO STEP AROUND YOU', `!${K.label('b')} CLEAVER: STRAIGHT DOWN. BIG, BUT YOU CAN STEP IT`, `!${K.label('x')} KICK      ${K.label('y')} GUARD (HOLD IT)`, 'RUN ANY OF EIGHT WAYS WITH THE ARROWS (OR THE STICK).', 'UP AND DOWN RUN INTO AND OUT OF THE SCREEN:', 'STEP ROUND A CLEAVER AND HIT THEM IN THE SIDE.', 'PAUSE: START (MOVE LISTS ARE IN THE PAUSE MENU)'],
      ['GUARDING', `!HOLD ${K.label('y')} TO GUARD HIGH AND MID ATTACKS.`, `!HOLD ${K.label('y')} AND DOWN TO GUARD LOW (AND DUCK HIGHS).`, 'MIDS HIT YOU WHEN YOU CROUCH. LOWS HIT YOU STANDING.', `!GUARD IMPACT: FORWARD + ${K.label('y')} JUST BEFORE A HIT`, 'LANDS. IT KNOCKS THEIR WEAPON ASIDE: FREE HIT!', 'TOO EARLY AND YOU ARE WIDE OPEN. TIMING IS EVERYTHING.', 'GLOWING SPECIALS CANNOT BE GUARDED. GET AWAY!'],
      ['RING OUT!', '!THE FIGHT IS ON A RING. FALL OFF AND YOU LOSE THE ROUND,', 'NO MATTER HOW MUCH ENERGY YOU HAVE LEFT.', `!${K.label('a')}+${K.label('y')} OR ${K.label('b')}+${K.label('y')}: THROWS (BREAK ONE: SAME BUTTONS)`, 'SHOVES, BARGES AND THROWS ARE GREAT NEAR THE EDGE.', `→+${K.label('x')} SHOULDER BARGE PUSHES THEM A LONG WAY.`, 'KEEP YOUR OWN BACK AWAY FROM THE WATER.'],
      ['SPECIALS AND COMBOS', `!→+${K.label('a')}   ←+${K.label('b')}   ←+${K.label('x')}`, 'EVERY FIGHTER HAS THREE SPECIALS ON THOSE.', `↓+${K.label('b')} SKY RISER LAUNCHES THEM: HIT THEM IN THE AIR!`, `STRINGS: ${K.label('a')},${K.label('a')}  ${K.label('b')},${K.label('b')} AND MORE: PRESS AGAIN AS IT LANDS.`, '', '!WIN ARCADE TO UNLOCK FIGHTERS, COSTUMES AND STAGES.'],
    ];
    return {
      title: 'SOUL SABRE', sub: 'A TALE OF STEEL AND SPARKS', subCol: '#ffe8a0', copy: '(C) 1999 SILVERFISH STUDIO', licence: 'PRODUCED BY OR UNDER LICENCE FROM DAYDREAM', look: 'dc', duel: true, fov: 42, logoGrad: ['#ffffff', '#c8e0ff', '#5a8ae0', '#ffd27a'], logoDeep: '#0a1a4a', logoSize: 46, panelEdge: 'rgba(160,200,255,.8)',
      roster, hidden, boss, stages, base, jumps: [], throwBtns: [['a', 'y'], ['b', 'y']], music, how, dbgName: 'sabre', masterName: 'LEGEND', defaultName: 'JACK', fightWord: 'FIGHT!',
      hitCol: '#ffe8a0', guardCol: '#a0e0ff', barCol: '#7affd0', trailCol: '#9ad8ff', throwFling: 0.09, dmgMul: 1.2, maxScore: 50000, rate: 400, arcadeLen: 4, selCols: 6, hiTop: 24000,
      perfectSecret: null, ringSecret: 'rm.duel.ring', giSecret: 'rm.duel.impact', bossSecret: 'rm.duel.gloom',
      show: { top: '#0a1030', mid: '#2a4a8a', bot: '#c8d8f0', pool: '#8ab0e0', beam: 'rgba(200,220,255,.4)', dust: '#c8e0ff', rim: '#9ac8ff', fog: '#2a3a6a' },
    };
  }

  TV.game('dc.duel', {
    buttons: ['a', 'b', 'x', 'y'], stick: true,
    help: 'Run: arrows (any way). Sweeping slash: Z. Cleaver: X. Kick: C. Guard: V (hold; Down+V low). Forward+V just before a hit: Guard Impact. Throws: Z+V, X+V. Pause: Enter.',
    three: true,
    make(K) {
      let inner = null;
      const go = () => { if (inner || K.done) return; try { if (!CFG) CFG = build(); inner = window.RmFight.make(K, CFG); } catch (e) { console.error(e); } };
      if (window.RmFight && window.RmFight.v >= 2) go(); else kit.then(go);
      return {
        update(dt) { if (inner) inner.update(dt); },
        draw() { if (inner) inner.draw(); else { K.hud.fillStyle = '#000'; K.hud.fillRect(0, 0, K.W, K.H); K.font.center(K.hud, 'LOADING...', K.W / 2, K.H / 2, '#fff', 2); } },
        end() { if (inner && inner.end) inner.end(); },
      };
    },
  });
})();
