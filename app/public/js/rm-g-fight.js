/* TEKNO FIST (PlayStation, in Jack's room): a 3D one-on-one fighter in the late-90s style. Ten fighters (plus GUBBINZ,
 * hidden, and the TEKNO KING, the boss), nine stages, Arcade (a story, a rival, a boss and an ending for everybody),
 * Versus CPU, Survival, Time Attack and Training with move lists. Wobbly polygons, wonky textures, 15-bit dither.
 * The engine is js/rm-g-fightkit.js (shared with SOUL SABRE): this file is the cast, their moves, the stages and the tunes.
 * Controls: Z (✕) left punch, C (□) right punch, X (○) left kick, V (△) right kick. Back (or standing still) guards,
 * Down crouches (and guards lows), tap Up / Down to sidestep, hold Up to jump, tap forward twice to dash.
 * Two buttons together throw: ✕+○ and □+△. Tap back just as a hit lands: PARRY.
 * Secrets: rm.fight.perfect (in rm-cat.js), rm.fight.champ (finish Arcade), rm.fight.combo (an 8-hit combo).
 * The save (rm.ps.fight, v1): options, unlocked fighters/costumes/stages, endings seen, the high-score table.
 * Everything (models, textures, music, story) is original and made in code. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const SECRETS = [['rm.fight.champ', 'Tekno Champion', 'Win the Tekno Fist tournament in Arcade mode.'], ['rm.fight.combo', 'Combo Crazy', 'Land a really long combo in Tekno Fist.']];
  try { for (const [id, n, h] of SECRETS) if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {}
  const kit = (window.Apps && Apps.load ? Apps.load('js/rm-g-fightkit.js') : Promise.reject(new Error('no loader'))).catch(e => { console.error(e); });
  let CFG = null;

  // a little tune notation: 'A4 . C5 - E5' -> MIDI numbers per 16th step ('.' rest, '-' hold)
  const NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const mel = s => s.trim().split(/\s+/).map(t => t === '.' ? 0 : t === '-' ? -1 : (NN[t[0]] + (t[1] === '#' ? 1 : t[1] === 'b' ? -1 : 0) + 12 * (+t.slice(-1) + 1)));
  const rep = (a, n) => { let o = []; for (let i = 0; i < n; i++) o = o.concat(a); return o; };

  function build() {
    const RF = window.RmFight, PP = RF.PP, POSE = RF.POSE, PT = RF.PT, shade = RF.shade;
    const P = o => PP(o);
    // ---------------------------------------------------------------- the shared moves (everybody has these; fighters swap some for their own)
    const legs = { hl: [0.38, 0.1], kl: 0.4, hr: [-0.28, 0.12], kr: 0.3 };
    const crouchL = { hl: [1.45, 0.25], kl: 2.3, hr: [0.9, 0.2], kr: 2.1 };
    const L = o => Object.assign({}, legs, o), C = o => Object.assign({}, crouchL, o);
    const jabA = P(L({ y: -0.08, lean: 0.12, twist: 0.45, sl: [1.0, 0.1], el: 1.6, sr: [1.1, 0.18], er: 2.1 }));
    const jabB = P(L({ y: -0.08, lean: 0.22, twist: 0.65, sl: [1.55, 0.05, 0.15], el: 0.05, sr: [1.1, 0.18], er: 2.1, fw: 0.08 }));
    const crossA = P(L({ y: -0.1, lean: 0.05, twist: 0.8, sl: [1.0, 0.2], el: 2.1, sr: [0.9, 0.3], er: 2.2 }));
    const crossB = P({ y: -0.12, lean: 0.32, twist: -0.6, sl: [1.0, 0.2], el: 2.1, sr: [1.6, 0, 0.25], er: 0.05, hl: [0.45, 0.1], kl: 0.5, hr: [-0.45, 0.12], kr: 0.2, fw: 0.15 });
    const kickA = P({ y: -0.05, lean: -0.1, twist: 0.2, sl: [0.9, 0.3], el: 1.9, sr: [0.9, 0.3], er: 1.9, hl: [0.2, 0.05], kl: 0.3, hr: [0.9, 0.05], kr: 1.6 });
    const kickB = P({ y: -0.04, lean: -0.32, twist: 0.1, sl: [0.9, 0.4], el: 1.8, sr: [0.7, 0.5], er: 1.5, hl: [0.1, 0.05], kl: 0.25, hr: [1.55, 0.05], kr: 0.05, fr: -0.6 });
    const whirl = P({ y: 0.0, lean: -0.4, twist: -0.4, sl: [1.4, 1.0], el: 1.0, sr: [1.4, 1.0], er: 1.0, hl: [0.1, 0.1], kl: 0.4, hr: [1.55, 1.1], kr: 0.05 });
    const dashPunch = P({ y: -0.15, lean: 0.45, twist: -0.6, sl: [0.8, 0.3], el: 2.1, sr: [1.6, 0], er: 0.02, hl: [0.7, 0.1], kl: 0.6, hr: [-0.6, 0.1], kr: 0.2, fw: 0.3 });
    const overhead = P({ y: -0.1, lean: -0.3, sl: [3.0, 0.1], el: 0.3, sr: [3.0, 0.1], er: 0.3, hl: [0.3, 0.1], kl: 0.4, hr: [-0.3, 0.1], kr: 0.3 });
    const smash = P({ y: -0.2, lean: 0.6, sl: [1.0, 0.1], el: 0.2, sr: [1.0, 0.1], er: 0.2, hl: [0.5, 0.1], kl: 0.6, hr: [-0.4, 0.1], kr: 0.4, fw: 0.3 });
    const M = o => Object.assign({ kind: 'p', ac: 3, push: 0.02 }, o);
    const base = [
      M({ id: 'jab', n: 'JAB', btn: 'a', su: 6, ac: 3, re: 9, dmg: 5, rng: 1.25, ht: 'h', hs: 12, next: { a: 'jab2', x: 'one2' }, A: jabA, B: jabB }),
      M({ id: 'jab2', n: 'DOUBLE JAB', btn: 'a', chainOnly: true, su: 6, ac: 3, re: 10, dmg: 5, rng: 1.25, ht: 'h', next: { x: 'one2' }, A: jabA, B: jabB }),
      M({ id: 'one2', n: 'ONE-TWO', btn: 'x', chainOnly: true, su: 8, ac: 3, re: 14, dmg: 9, rng: 1.35, ht: 'h', A: crossA, B: crossB }),
      M({ id: 'cross', n: 'BIG PUNCH', btn: 'x', su: 9, ac: 3, re: 15, dmg: 10, rng: 1.35, ht: 'h', push: 0.04, next: { b: 'cross_k' }, A: crossA, B: crossB }),
      M({ id: 'cross_k', n: 'PUNCH-KICK', btn: 'b', chainOnly: true, su: 11, ac: 4, re: 16, dmg: 10, rng: 1.55, ht: 'm', A: kickA, B: kickB }),
      M({ id: 'kick', n: 'KICK', btn: 'b', su: 9, ac: 4, re: 15, dmg: 9, rng: 1.55, ht: 'm', A: kickA, B: kickB }),
      M({ id: 'round', n: 'ROUNDHOUSE', btn: 'y', su: 15, ac: 4, re: 20, dmg: 14, rng: 1.6, ht: 'h', kd: true, trail: 'ftR',
        A: P({ y: -0.04, lean: -0.2, twist: 0.6, sl: [1.0, 0.5], el: 1.6, sr: [0.8, 0.6], er: 1.4, hl: [0.1, 0.1], kl: 0.3, hr: [0.8, 0.6], kr: 1.4 }),
        B: P({ y: -0.02, lean: -0.5, twist: -0.6, spin: -0.4, sl: [1.2, 0.8], el: 1.5, sr: [0.6, 0.9], er: 1.2, hl: [0.0, 0.1], kl: 0.2, hr: [1.55, 1.0], kr: 0.1, fr: -0.6 }) }),
      M({ id: 'lowp', n: 'LOW JAB', btn: 'a', dir: 'd', su: 6, ac: 3, re: 10, dmg: 4, rng: 1.2, ht: 'l', hs: 10, crush: 'high',
        A: P(C({ y: -0.42, lean: 0.35, twist: 0.2, sl: [1.0, 0.2], el: 2.0, sr: [1.0, 0.2], er: 2.0 })), B: P(C({ y: -0.42, lean: 0.45, twist: 0.5, sl: [1.3, 0.05], el: 0.1, sr: [1.0, 0.2], er: 2.0 })) }),
      M({ id: 'upper', n: 'UPPERCUT', btn: 'x', dir: 'd', su: 13, ac: 3, re: 22, dmg: 11, rng: 1.2, ht: 'm', launch: true, trail: 'hdR',
        A: P(C({ y: -0.36, lean: 0.45, twist: 0.3, sl: [1.0, 0.2], el: 2.0, sr: [0.3, 0.2], er: 1.6 })), B: P({ y: 0.03, lean: -0.25, twist: -0.4, sl: [0.9, 0.2], el: 2.0, sr: [2.75, 0], er: 0.9, hl: [0.3, 0.1], kl: 0.2, hr: [-0.2, 0.1], kr: 0.1 }) }),
      M({ id: 'lowk', n: 'LOW KICK', btn: 'b', dir: 'd', su: 8, ac: 3, re: 14, dmg: 6, rng: 1.45, ht: 'l', hs: 12,
        A: P({ y: -0.2, lean: 0.15, twist: 0.3, sl: [1.0, 0.2], el: 2.0, sr: [1.1, 0.2], er: 2.1, hl: [0.5, 0.1], kl: 0.8, hr: [0.3, 0.2], kr: 1.2 }), B: P({ y: -0.2, lean: 0.08, twist: 0.3, sl: [1.0, 0.2], el: 2.0, sr: [1.1, 0.2], er: 2.1, hl: [0.4, 0.1], kl: 0.7, hr: [0.75, 0.25], kr: 0.05 }) }),
      M({ id: 'sweep', n: 'SWEEP', btn: 'y', dir: 'd', su: 14, ac: 5, re: 24, dmg: 9, rng: 1.6, ht: 'l', kd: true, crush: 'high', trail: 'ftR',
        A: P(C({ y: -0.45, lean: 0.4, twist: 0.4, sl: [0.6, 0.5], el: 1.2, sr: [0.6, 0.5], er: 1.2 })), B: P({ y: -0.55, lean: 0.6, twist: 0.6, spin: 1.0, sl: [0.6, 0.6], el: 1.2, sr: [0.6, 0.6], er: 1.2, hl: [1.4, 0.2], kl: 2.3, hr: [1.3, 1.3], kr: 0.05 }) }),
      M({ id: 'elbow', n: 'ELBOW', btn: 'a', dir: 'f', su: 10, ac: 3, re: 14, dmg: 9, rng: 1.1, ht: 'm', dash: 0.05,
        A: P(L({ y: -0.1, lean: 0.1, twist: 0.6, sl: [1.0, 0.2], el: 2.0, sr: [1.2, 0.6], er: 2.6 })), B: P({ y: -0.12, lean: 0.38, twist: -0.9, sr: [1.6, 0.6], er: 2.6, sl: [1.0, 0.2], el: 2.0, hl: [0.6, 0.1], kl: 0.6, hr: [-0.4, 0.1], kr: 0.3, fw: 0.2 }) }),
      M({ id: 'front', n: 'FRONT KICK', btn: 'b', dir: 'f', su: 11, ac: 4, re: 16, dmg: 10, rng: 1.6, ht: 'm', push: 0.08,
        A: P({ y: -0.05, lean: -0.05, sl: [1.0, 0.3], el: 2.0, sr: [1.0, 0.3], er: 2.0, hl: [0.2, 0.1], kl: 0.3, hr: [1.4, 0.05], kr: 2.0 }), B: P({ y: -0.03, lean: -0.3, sl: [1.0, 0.3], el: 2.0, sr: [1.0, 0.3], er: 2.0, hl: [0.1, 0.1], kl: 0.2, hr: [1.6, 0.05], kr: 0.1, fr: -0.8 }) }),
      M({ id: 'side', n: 'SIDE KICK', btn: 'b', dir: 'b', su: 12, ac: 4, re: 16, dmg: 10, rng: 1.65, ht: 'm', push: 0.07,
        A: P({ y: -0.05, lean: -0.2, twist: -0.6, sl: [0.6, 0.5], el: 1.6, sr: [0.5, 0.5], er: 1.6, hl: [0.1, 0.1], kl: 0.3, hr: [0.9, 0.5], kr: 1.7 }), B: P({ y: -0.04, lean: -0.55, twist: -1.0, sl: [0.6, 0.6], el: 1.4, sr: [0.5, 0.6], er: 1.4, hl: [0, 0.1], kl: 0.2, hr: [1.5, 0.6], kr: 0 }) }),
      M({ id: 'backfist', n: 'SPINNING BACKFIST', btn: 'a', dir: 'b', su: 13, ac: 4, re: 16, dmg: 11, rng: 1.4, ht: 'h', spin: -Math.PI * 2, trail: 'hdL',
        A: P(L({ y: -0.1, twist: 1.0, sl: [0.6, 0.4], el: 1.4, sr: [1.0, 0.2], er: 2.0 })), B: P(L({ y: -0.1, twist: -0.4, sl: [1.55, 1.2], el: 0.2, sr: [1.0, 0.2], er: 2.0 })) }),
    ];
    const jumps = [
      M({ id: 'jpunch', n: 'JUMPING PUNCH', btn: 'a', su: 5, ac: 6, re: 6, dmg: 9, rng: 1.3, ht: 'm', A: P({ y: 0, lean: 0.4, sl: [1.2, 0.3], el: 1.8, sr: [1.0, 0.3], er: 2.0, hl: [1.3, 0.2], kl: 2.0, hr: [0.9, 0.2], kr: 2.1 }), B: P({ y: 0, lean: 0.55, sl: [1.0, 0.3], el: 1.8, sr: [2.0, 0.1], er: 0.1, hl: [1.3, 0.2], kl: 2.0, hr: [0.9, 0.2], kr: 2.1 }) }),
      M({ id: 'jkick', n: 'FLYING KICK', btn: 'b', su: 6, ac: 8, re: 6, dmg: 12, rng: 1.6, ht: 'm', kd: true, trail: 'ftR', A: P({ y: 0, lean: -0.2, sl: [1.0, 0.6], el: 1.2, sr: [1.0, 0.6], er: 1.2, hl: [1.3, 0.2], kl: 2.0, hr: [1.2, 0.1], kr: 1.8 }), B: P({ y: 0, lean: -0.4, sl: [1.2, 0.8], el: 0.8, sr: [1.2, 0.8], er: 0.8, hl: [1.4, 0.2], kl: 2.2, hr: [1.6, 0.1], kr: 0.05, fr: -0.8 }) }),
    ];
    // shortcuts for the fighters' own moves
    const SP = (btn, dir, o) => M(Object.assign({ btn, dir }, o));
    const T = (n, kind, dmg) => ({ n, kind, dmg });
    // ---------------------------------------------------------------- the fighters
    const roster = [
      { id: 'rico', n: 'RICO TURBO', s: 'TURBO KARATE', from: 'BIRMINGHAM, ENGLAND', stats: [3, 4, 3], home: 'dojo', rival: 'stone', trail: '#ff6a2a',
        body: { h: 1.0, w: 1.0, chest: 1.05 }, hair: 'band', top: 'gi', pants: 'gi', sleeves: 'short', shoes: 'bare', extra: ['belt', 'beltTails'], emblem: 'circle', emblemBack: true, emblemY: 18,
        face: { brow: 'angry', mouth: 'flat', fringe: 'zig' },
        col: { skin: '#e8b48a', hair: '#1a1a1a', top: '#f4f4f0', top2: '#d8d8d0', sleeve: '#f4f4f0', pants: '#f4f4f0', belt: '#141414', extra: '#e01a1a', band2: '#e01a1a', emblem: '#e01a1a', beltOn: 1 },
        cos: [{ col: { top: '#2a3ad0', top2: '#1a2a90', sleeve: '#2a3ad0', pants: '#2a3ad0', band2: '#ffd040', emblem: '#ffd040', extra: '#ffd040' } }, { col: { top: '#1a1a1a', top2: '#333', sleeve: '#1a1a1a', pants: '#1a1a1a', belt: '#e01a1a', band2: '#f4f4f4', emblem: '#f4f4f4', extra: '#f4f4f4' } }],
        stance: { y: -0.14, lean: 0.06, twist: 0.6, sl: [1.35, 0.1, 0.25], el: 0.9, sr: [0.45, 0.35], er: 2.3, hl: [0.45, 0.15], kl: 0.45, hr: [-0.35, 0.15], kr: 0.35 },
        win2: { y: -0.05, lean: -0.05, twist: 0.4, sl: [0.4, 0.3], el: 2.4, sr: [1.5, 0.0, 0.5], er: 0.0, hl: [0.5, 0.2], kl: 0.6, hr: [-0.3, 0.2], kr: 0.4 },
        quote: 'TURBO MODE: ENGAGED!', taunt: 'Too slow! Even my nan is faster.', rivalLine: 'Sarge! You still owe me a rematch!',
        moves: [M({ id: 'ricokick', n: 'TURBO SNAP KICK', btn: 'b', su: 7, ac: 4, re: 13, dmg: 9, rng: 1.55, ht: 'm', next: { y: 'ricohigh' }, A: kickA, B: kickB }),
          M({ id: 'ricohigh', n: 'SNAP-ROUNDHOUSE', btn: 'y', chainOnly: true, su: 12, ac: 4, re: 20, dmg: 13, rng: 1.6, ht: 'h', kd: true, trail: 'ftR', A: kickA, B: P({ y: -0.02, lean: -0.5, twist: -0.6, spin: -0.4, sl: [1.2, 0.8], el: 1.5, sr: [0.6, 0.9], er: 1.2, hl: [0.0, 0.1], kl: 0.2, hr: [1.55, 1.0], kr: 0.1 }) })],
        specials: [SP('x', 'f', { n: 'TURBO PUNCH', su: 12, ac: 5, re: 20, dmg: 15, rng: 1.5, ht: 'm', dash: 0.11, push: 0.08, fx: 'fire', trail: 'hdR', A: P({ y: -0.2, lean: 0.1, twist: 0.9, sl: [1.0, 0.2], el: 2.1, sr: [0.6, 0.4], er: 2.4, hl: [0.5, 0.1], kl: 0.8, hr: [-0.4, 0.1], kr: 0.6 }), B: dashPunch }),
          SP('y', 'b', { n: 'WHIRLWIND KICK', su: 14, ac: 8, re: 22, dmg: 15, rng: 1.6, ht: 'h', kd: true, hop: 0.45, spin: Math.PI * 2, crush: 'low', trail: 'ftR', A: whirl, B: whirl }),
          SP('y', 'f', { n: 'TURBO UPPERCUT', su: 10, ac: 6, re: 26, dmg: 13, rng: 1.2, ht: 'm', launch: true, hop: 0.7, fx: 'fire', trail: 'hdR', A: P(C({ y: -0.4, lean: 0.5, sl: [1.0, 0.2], el: 2.0, sr: [0.3, 0.3], er: 1.4 })), B: P({ y: 0.1, lean: -0.3, twist: -0.6, sl: [0.6, 0.3], el: 1.8, sr: [3.0, 0.1], er: 0.1, hl: [1.2, 0.1], kl: 1.6, hr: [0.1, 0.1], kr: 0.4 }) })],
        throws: [T('SHOULDER THROW', 'hip', 22), T('TURBO KICK-OFF', 'toss', 18)],
        story: ['Rico Turbo trained for ten years in a dojo above a carpet shop in Birmingham.', 'He has entered the Tekno Fist tournament to prove that TURBO KARATE is the greatest martial art in the world. (He made it up himself.)'],
        ending: ['Rico Turbo stood on the roof of Tekno Tower holding the golden trophy.', 'Back home the carpet shop gave him a free rug. The dojo had a queue round the block.', 'Turbo Karate classes, every Tuesday. Bring your own headband.'] },
      { id: 'barry', n: 'BIG BARRY', s: 'POUND-SHOP WRESTLING', from: 'GRIMSBY, ENGLAND', stats: [5, 2, 3], home: 'carpark', rival: 'granny', spd: 0.8, pow: 1.2, ai: { agg: 0.9, thr: 2.2 },
        body: { h: 1.08, w: 1.38, belly: 1.45, limb: 1.32, chest: 1.12 }, hair: 'bald', top: 'singlet', pants: 'plain', sleeves: 'none', shoes: 'boot', extra: ['belt'], emblem: 'star', emblemY: 30, emblemS: 4,
        face: { brow: 'thick', mouth: 'grin', tache: '#5a3a1a', bald: true, stubble: '#3a2a1a' },
        col: { skin: '#f0c098', hair: '#5a3a1a', top: '#1a4ad0', top2: '#ffd040', pants: '#1a4ad0', shorts: '#1a4ad0', leg: '#f0c098', shoe: '#1a1a1a', belt: '#ffd040', beltOn: 1, emblem: '#ffd040' },
        cos: [{ col: { top: '#c01a1a', pants: '#c01a1a', shorts: '#c01a1a', top2: '#f4f4f4', belt: '#f4f4f4', emblem: '#f4f4f4' } }, { col: { top: '#2a8a2a', pants: '#2a8a2a', shorts: '#2a8a2a', top2: '#ff8ad0', belt: '#ff8ad0', emblem: '#ff8ad0' } }],
        stance: { y: -0.16, lean: 0.28, twist: 0.15, sl: [0.7, 0.55], el: 1.5, sr: [0.8, 0.5], er: 1.4, hl: [0.4, 0.3], kl: 0.55, hr: [-0.2, 0.3], kr: 0.45 },
        win2: { y: -0.1, lean: -0.1, sl: [1.3, 1.2], el: 1.9, sr: [1.3, 1.2], er: 1.9, hl: [0.3, 0.3], kl: 0.4, hr: [0.1, 0.3], kr: 0.3 },
        quote: 'Barry wins! Barry ALWAYS wins!', taunt: 'Down you go. Barry is too big.', rivalLine: 'Granny! Last time you made Barry cry!',
        moves: [M({ id: 'barrychop', n: 'KNIFE-EDGE CHOP', btn: 'x', su: 10, ac: 3, re: 16, dmg: 12, rng: 1.3, ht: 'h', push: 0.05, A: P({ y: -0.12, twist: 0.9, sl: [0.8, 0.4], el: 1.6, sr: [1.6, 1.1], er: 0.4 }), B: P({ y: -0.14, lean: 0.3, twist: -0.6, sl: [0.8, 0.4], el: 1.6, sr: [1.4, 0.2, 0.6], er: 0.1, fw: 0.1 }) }),
          M({ id: 'barryknee', n: 'BIG KNEE', btn: 'b', dir: 'f', su: 13, ac: 4, re: 18, dmg: 13, rng: 1.2, ht: 'm', launch: true, A: P({ y: -0.1, lean: 0.2, sl: [1.3, 0.5], el: 1.2, sr: [1.3, 0.5], er: 1.2, hl: [0.2, 0.1], kl: 0.3, hr: [0.6, 0.1], kr: 1.8 }), B: P({ y: 0.02, lean: -0.1, sl: [1.6, 0.5], el: 1.0, sr: [1.6, 0.5], er: 1.0, hl: [0.1, 0.1], kl: 0.1, hr: [1.8, 0.1], kr: 2.2 }) })],
        specials: [SP('x', 'f', { n: 'BELLY BOUNCE', su: 16, ac: 6, re: 24, dmg: 16, rng: 1.3, ht: 'm', dash: 0.09, push: 0.12, kd: true, A: P({ y: -0.1, lean: -0.4, sl: [0.5, 1.2], el: 0.5, sr: [0.5, 1.2], er: 0.5, hl: [0.2, 0.2], kl: 0.4, hr: [-0.2, 0.2], kr: 0.4 }), B: P({ y: -0.05, lean: -0.6, sl: [0.8, 1.4], el: 0.2, sr: [0.8, 1.4], er: 0.2, hl: [0.5, 0.2], kl: 0.3, hr: [-0.5, 0.2], kr: 0.3, fw: 0.4 }) }),
          SP('y', 'b', { n: 'BARRY BOMB', su: 22, ac: 6, re: 26, dmg: 20, rng: 1.4, ht: 'm', kd: true, hop: 0.7, crush: 'low', A: overhead, B: smash }),
          SP('y', 'f', { n: 'CHOP CHOP CHOP', su: 12, ac: 12, re: 22, dmg: 15, hits: 3, rng: 1.3, ht: 'h', dash: 0.03, A: P({ y: -0.12, twist: 0.9, sl: [0.8, 0.4], el: 1.6, sr: [1.6, 1.1], er: 0.4 }), B: P({ y: -0.14, lean: 0.3, twist: -0.6, sl: [1.6, 1.1], el: 0.4, sr: [1.4, 0.2], er: 0.1 }) })],
        throws: [T('BODY SLAM', 'slam', 26), T('BARRY PANCAKE', 'pancake', 28)],
        story: ['Big Barry wrestles every Saturday at the Grimsby Pound-Shop Wrestling Federation. Entry: one pound. Hot dogs: also one pound.', 'He wants the Tekno Fist prize money to buy a proper ring. With ropes and everything.'],
        ending: ['Barry carried the trophy home on the train. It took up two seats.', 'The Pound-Shop Wrestling Federation got its new ring, with real ropes and a little bell.', 'Tickets went up to two pounds. Nobody minded.'] },
      { id: 'volt', n: 'MISS VOLT', s: 'LIGHTNING KICKBOXING', from: 'LEEDS, ENGLAND', stats: [2, 5, 3], home: 'rooftop', rival: 'kapow', spd: 1.25, pow: 0.86, bounce: 1, trail: '#7ad8ff', ai: { agg: 1.15 },
        body: { h: 0.97, w: 0.86, chest: 0.92, limb: 0.9 }, hair: 'pony', top: 'tank', pants: 'stripe', sleeves: 'none', shoes: 'trainer', emblem: 'bolt', emblemY: 24, emblemS: 6,
        face: { brow: 'angry', mouth: 'smirk', lash: 1, fringe: 'side' },
        col: { skin: '#c88a5a', hair: '#ffe14a', top: '#1a1a1a', top2: '#ffe14a', pants: '#1a1a1a', stripe: '#ffe14a', shoe: '#f4f4f4', sole: '#ffe14a', glove: '#ffe14a', band: '#ffe14a', emblem: '#ffe14a', lip: '#a02a3a' },
        cos: [{ col: { top: '#f4f4f4', pants: '#f4f4f4', top2: '#2a8af0', stripe: '#2a8af0', glove: '#2a8af0', band: '#2a8af0', emblem: '#2a8af0', hair: '#1a1a1a' } }, { col: { top: '#d01a7a', pants: '#3a1a5a', top2: '#9affff', stripe: '#9affff', glove: '#9affff', band: '#9affff', emblem: '#9affff', hair: '#ff6ad0' } }],
        stance: { y: -0.1, lean: 0.08, twist: 0.4, sl: [1.2, 0.2], el: 2.2, sr: [1.15, 0.2], er: 2.3, hl: [0.3, 0.12], kl: 0.35, hr: [-0.25, 0.12], kr: 0.45, fl: 0.3, fr: 0.4 },
        win2: { y: -0.04, lean: -0.1, twist: 0.3, sl: [0.4, 0.4], el: 2.6, sr: [3.0, 0.2], er: 0.2, hl: [0.0, 0.1], kl: 0.05, hr: [1.2, 0.1], kr: 2.2 },
        quote: 'Shocking, wasn\'t it?', taunt: 'Bzzzt! You lose.', rivalLine: 'Kapow! Get off that skateboard and fight!',
        moves: [M({ id: 'voltjab', n: 'FLICK JAB', btn: 'a', su: 5, ac: 3, re: 8, dmg: 4, rng: 1.25, ht: 'h', next: { b: 'voltk1', a: 'jab2' }, A: jabA, B: jabB }),
          M({ id: 'voltk1', n: 'JAB-KICK', btn: 'b', chainOnly: true, su: 8, ac: 4, re: 12, dmg: 8, rng: 1.55, ht: 'm', next: { b: 'voltk2' }, A: kickA, B: kickB }),
          M({ id: 'voltk2', n: 'JAB-KICK-KICK', btn: 'b', chainOnly: true, su: 9, ac: 4, re: 18, dmg: 10, rng: 1.6, ht: 'h', kd: true, trail: 'ftR', fx: 'zap', A: kickA, B: P({ y: -0.02, lean: -0.5, twist: -0.6, spin: -0.4, sl: [1.2, 0.8], el: 1.5, sr: [0.6, 0.9], er: 1.2, hl: [0.0, 0.1], kl: 0.2, hr: [1.55, 1.0], kr: 0.1 }) })],
        specials: [SP('x', 'f', { n: 'VOLT KNEE', su: 9, ac: 4, re: 16, dmg: 12, rng: 1.05, ht: 'm', dash: 0.1, launch: true, fx: 'zap', trail: 'ftR', A: P({ y: -0.1, lean: 0.1, sl: [1.2, 0.3], el: 2.2, sr: [1.2, 0.3], er: 2.2, hl: [0.3, 0.1], kl: 0.5, hr: [0.5, 0.1], kr: 1.8 }), B: P({ y: 0.05, lean: -0.15, sl: [1.6, 0.3], el: 2.4, sr: [1.6, 0.3], er: 2.4, hl: [-0.1, 0.1], kl: 0.1, hr: [1.6, 0.1], kr: 2.4, fw: 0.15 }) }),
          SP('y', 'b', { n: 'SPARK HEEL', su: 16, ac: 4, re: 20, dmg: 15, rng: 1.55, ht: 'm', kd: true, fx: 'zap', trail: 'ftR', A: P({ y: 0, lean: -0.5, sl: [0.6, 0.6], el: 1.2, sr: [0.6, 0.6], er: 1.2, hl: [0, 0.1], kl: 0.1, hr: [2.7, 0.1], kr: 0.05 }), B: P({ y: -0.1, lean: 0.3, sl: [0.6, 0.6], el: 1.2, sr: [0.6, 0.6], er: 1.2, hl: [0.2, 0.1], kl: 0.3, hr: [1.2, 0.1], kr: 0.05, fw: 0.1 }) }),
          SP('y', 'f', { n: 'THUNDER STEPS', su: 10, ac: 15, re: 20, dmg: 15, hits: 3, rng: 1.6, ht: 'm', dash: 0.05, fx: 'zap', trail: 'ftR', A: kickA, B: kickB })],
        throws: [T('KNEE STORM', 'knee', 22), T('LIVE WIRE', 'zap', 20)],
        story: ['Miss Volt is the fastest kicker in Leeds. Possibly in the north. Possibly in the world.', 'She runs a kickboxing club in a church hall, and the roof leaks. The prize money would fix it. Bzzzt.'],
        ending: ['Miss Volt\'s kickboxing club got a new roof, new mats and a disco ball.', 'Membership went from 6 to 600. The vicar now does a mean roundhouse.', 'Shocking. Absolutely shocking.'] },
      { id: 'unit9', n: 'UNIT 9', s: 'ROBO-BOXING', from: 'A SHED IN SLOUGH', stats: [4, 2, 5], home: 'space', rival: 'doc', spd: 0.9, pow: 1.08, trail: '#ff4a1a',
        body: { h: 1.06, w: 1.18, limb: 1.25, chest: 1.1, glove: 1.15 }, hair: 'robot', top: 'robot', pants: 'armour', sleeves: 'long', shoes: 'boot', gloves: 'boxing', extra: ['pads'],
        face: { full: '#9aa0a8', eyes: 'robot', noNose: 1, mouth: 'none' },
        col: { skin: '#9aa0a8', hair: '#6a7078', helm: '#8a9098', top: '#7a8088', top2: '#5a6068', sleeve: '#6a7078', arm: '#8a9098', pants: '#5a6068', shoe: '#2a2e34', glove: '#ff3a1a', extra: '#ff2a1a', pad: '#ff3a1a', neck: '#4a4e54' },
        cos: [{ col: { top: '#d8c070', helm: '#d8c070', skin: '#d8c070', arm: '#c8b060', sleeve: '#a89040', glove: '#2a6aff', extra: '#2a9aff', pad: '#2a6aff' }, look: { face: { full: '#d8c070', eyes: 'robot', noNose: 1, mouth: 'none', visor: '#2a9aff' } } }, { col: { top: '#2a2a30', helm: '#2a2a30', skin: '#2a2a30', arm: '#3a3a40', sleeve: '#1a1a20', glove: '#7aff3a', extra: '#7aff3a', pad: '#7aff3a' }, look: { face: { full: '#2a2a30', eyes: 'robot', noNose: 1, mouth: 'none', visor: '#7aff3a' } } }],
        stance: { y: -0.08, lean: 0.15, twist: 0.25, sl: [1.25, 0.15], el: 2.2, sr: [1.2, 0.15], er: 2.4, hl: [0.3, 0.15], kl: 0.3, hr: [-0.25, 0.15], kr: 0.25 },
        win2: { y: 0, lean: -0.1, sl: [3.0, 0.2], el: 0.1, sr: [0.2, 0.3], er: 0.2, hl: [0.05, 0.1], kl: 0, hr: [0.05, 0.1], kr: 0 },
        quote: 'TARGET... DEFEATED. BEEP.', taunt: 'DOES NOT COMPUTE: YOUR SKILL.', rivalLine: 'CREATOR. I HAVE COME FOR AN UPGRADE.',
        moves: [M({ id: 'u9hook', n: 'PISTON HOOK', btn: 'x', su: 11, ac: 4, re: 18, dmg: 13, rng: 1.45, ht: 'h', push: 0.05, A: P({ y: -0.1, twist: 0.8, sl: [1.2, 0.2], el: 2.2, sr: [1.3, 0.9], er: 1.2 }), B: P({ y: -0.12, lean: 0.25, twist: -0.8, sl: [1.2, 0.2], el: 2.2, sr: [1.5, 0.4, 1.0], er: 1.4, fw: 0.1 }) }),
          M({ id: 'u9body', n: 'BODY BLOW', btn: 'a', dir: 'f', su: 11, ac: 3, re: 15, dmg: 11, rng: 1.35, ht: 'm', A: P({ y: -0.2, lean: 0.3, twist: 0.6, sl: [1.0, 0.2], el: 2.2, sr: [1.0, 0.2], er: 2.2, hl: [0.5, 0.15], kl: 0.7, hr: [-0.3, 0.15], kr: 0.5 }), B: P({ y: -0.28, lean: 0.45, twist: -0.4, sl: [1.3, 0.05], el: 0.6, sr: [1.0, 0.2], er: 2.2, hl: [0.6, 0.15], kl: 0.8, hr: [-0.3, 0.15], kr: 0.5, fw: 0.1 }) })],
        specials: [SP('x', 'f', { n: 'ROCKET FIST', su: 16, ac: 6, re: 22, dmg: 13, rng: 2.7, ht: 'h', push: 0.06, fx: 'fire', trail: 'hdR', A: P({ y: -0.1, twist: 0.6, sl: [1.0, 0.2], el: 2.0, sr: [1.5, 0.1], er: 1.8 }), B: P({ y: -0.1, lean: 0.25, twist: -0.4, sl: [1.0, 0.2], el: 2.0, sr: [1.6, 0], er: 0, fw: 0.1 }) }),
          SP('y', 'b', { n: 'DRILL KICK', su: 15, ac: 10, re: 22, dmg: 14, hits: 2, rng: 1.6, ht: 'm', spin: Math.PI * 4, dash: 0.04, hop: 0.3, trail: 'ftR', A: whirl, B: whirl }),
          SP('y', 'f', { n: 'MEGA PUNCH 9000', su: 34, ac: 5, re: 26, dmg: 26, rng: 1.5, ht: 'm', unb: true, kd: true, push: 0.2, fx: 'fire', trail: 'hdR', A: P({ y: -0.3, lean: -0.3, twist: 1.2, sl: [1.0, 0.3], el: 2.0, sr: [0.4, 0.6], er: 2.6, hl: [0.6, 0.2], kl: 1.0, hr: [-0.5, 0.2], kr: 0.8 }), B: dashPunch, dash: 0.08 })],
        throws: [T('OVERLOAD', 'zap', 22), T('HYDRAULIC LIFT', 'slam', 25)],
        story: ['UNIT 9 was built in a shed in Slough to sort the post. It sorted the post into a big pile and then punched it.', 'Now it wants to know what it is FOR. The Tekno King says he has the answer. BEEP.'],
        ending: ['UNIT 9 beat the King and went home to the shed in Slough.', 'It sorted every letter in the country in 4.2 seconds, then took up flower arranging.', 'PURPOSE... FOUND. BEEP BOOP.'] },
      { id: 'granny', n: 'GRANNY GRAPPLE', s: 'BINGO-HALL JUDO', from: 'WESTON-SUPER-MARE', stats: [3, 3, 2], home: 'pier', rival: 'barry', spd: 0.95, ai: { thr: 2.5 },
        body: { h: 0.86, w: 0.95, belly: 1.12, head: 1.08 }, hair: 'bun', top: 'cardigan', pants: 'plain', sleeves: 'long', shoes: 'shoe', extra: ['skirt', 'bag'],
        face: { brow: 'up', mouth: 'grin', specs: '#c8a040', blush: 1, hairY: 7 },
        col: { skin: '#f2c8a8', hair: '#e0e0e0', top: '#8a3ab0', top2: '#ffd040', sleeve: '#8a3ab0', pants: '#5a5a6a', skirt: '#5a5a6a', leg: '#e8d0c0', shoe: '#3a2a1a', bag: '#7a2a2a', lip: '#c04a6a' },
        cos: [{ col: { top: '#2a8a6a', sleeve: '#2a8a6a', skirt: '#3a2a1a', pants: '#3a2a1a', bag: '#d0a020' } }, { col: { top: '#e8608a', sleeve: '#e8608a', skirt: '#2a3a7a', pants: '#2a3a7a', bag: '#1a1a1a', hair: '#c8b8e8' } }],
        stance: { y: -0.12, lean: 0.35, twist: 0.2, sl: [0.9, 0.3], el: 1.6, sr: [0.6, 0.2], er: 1.8, hl: [0.3, 0.12], kl: 0.45, hr: [-0.2, 0.12], kr: 0.4, hp: -0.25 },
        win2: { y: -0.03, lean: 0.1, sl: [0.6, 0.6], el: 2.5, sr: [2.6, 0.3], er: 0.5, hl: [0.05, 0.1], kl: 0.05, hr: [0.05, 0.1], kr: 0.05 },
        quote: 'Now eat your greens, dear.', taunt: 'I\'ve been doing this since 1952, love.', rivalLine: 'Barry Higgins! Does your mother know you\'re here?',
        moves: [M({ id: 'grannybag', n: 'HANDBAG', btn: 'a', su: 8, ac: 4, re: 12, dmg: 7, rng: 1.4, ht: 'h', next: { a: 'grannybag2' }, A: P({ y: -0.1, twist: -0.6, sl: [1.4, 0.8], el: 0.6, sr: [0.6, 0.2], er: 1.8 }), B: P({ y: -0.12, twist: 0.8, sl: [1.6, 0.2, 0.9], el: 0.3, sr: [0.6, 0.2], er: 1.8 }) }),
          M({ id: 'grannybag2', n: 'HANDBAG AGAIN', btn: 'a', chainOnly: true, su: 9, ac: 4, re: 18, dmg: 9, rng: 1.4, ht: 'm', kd: true, A: P({ y: -0.1, twist: 0.8, sl: [2.6, 0.2], el: 0.4 }), B: P({ y: -0.16, lean: 0.4, twist: 0, sl: [1.0, 0.1], el: 0.2, fw: 0.1 }) })],
        specials: [SP('x', 'f', { n: 'HANDBAG SWING', su: 14, ac: 6, re: 20, dmg: 14, rng: 1.5, ht: 'h', track: true, kd: true, spin: -1.2, A: P({ y: -0.1, twist: 1.2, sl: [1.3, 1.2], el: 0.3, sr: [0.8, 0.3], er: 1.6 }), B: P({ y: -0.1, twist: -1.2, sl: [1.5, 0.2], el: 0.1, sr: [0.8, 0.3], er: 1.6, fw: 0.1 }) }),
          SP('y', 'b', { n: 'BINGO SWEEP', su: 12, ac: 5, re: 20, dmg: 11, rng: 1.7, ht: 'l', kd: true, spin: 1.2, crush: 'high', A: P(C({ y: -0.45, lean: 0.4, sl: [0.6, 0.5], el: 1.2, sr: [0.6, 0.5], er: 1.2 })), B: P({ y: -0.55, lean: 0.6, spin: 1.0, sl: [0.6, 0.6], el: 1.2, sr: [0.6, 0.6], er: 1.2, hl: [1.4, 0.2], kl: 2.3, hr: [1.3, 1.3], kr: 0.05 }) }),
          SP('y', 'f', { n: 'TWO FAT LADIES', su: 18, ac: 5, re: 22, dmg: 17, rng: 1.25, ht: 'm', crumple: true, A: P({ y: -0.1, lean: -0.2, sl: [2.8, 0.3], el: 0.5, sr: [2.8, 0.3], er: 0.5 }), B: P({ y: -0.2, lean: 0.5, sl: [1.3, 0.1], el: 0.1, sr: [1.3, 0.1], er: 0.1, fw: 0.2 }) })],
        throws: [T('JUDO FLIP', 'hip', 24), T('HANDBAG SPIN', 'spin', 22)],
        story: ['Doris "Granny Grapple" Pike has won the Weston-super-Mare bingo every week since 1972.', 'Nobody argues with her about it. They tried that in 1973.'],
        ending: ['Granny Grapple put the trophy on the mantelpiece next to the bingo dabbers.', 'Then she put the kettle on and made the Tekno King a nice cup of tea, because he looked like he needed one.', 'Eyes down, dear.'] },
      { id: 'pandini', n: 'THE GREAT PANDINI', s: 'MAGIC PANDA-FU', from: 'THE END OF THE PIER SHOW', stats: [3, 4, 3], home: 'temple', rival: 'lotus', spd: 1.05, trail: '#ff9aff',
        body: { h: 1.02, w: 1.15, belly: 1.25, head: 1.15 }, hair: 'ears', top: 'fur', pants: 'fur', sleeves: 'long', shoes: 'bare', extra: ['cape'], capeEmblem: 'star',
        face: { eyes: 'panda', brow: 'none', mouth: 'grin', full: null, noNose: 1, hairY: 4, backY: 4 },
        col: { skin: '#f4f4f0', hair: '#1a1a1a', top: '#1a1a1a', top2: '#f4f4f0', sleeve: '#1a1a1a', arm: '#1a1a1a', pants: '#1a1a1a', shoe: '#1a1a1a', glove: '#1a1a1a', cape: '#5a1a8a', trim: '#ffd040', lip: '#3a1a1a' },
        cos: [{ col: { cape: '#c01a1a', trim: '#f4f4f4' } }, { col: { skin: '#f0d0a0', top2: '#f0d0a0', cape: '#1a5a2a', trim: '#ffd040', hair: '#8a4a1a', top: '#8a4a1a', sleeve: '#8a4a1a', arm: '#8a4a1a', pants: '#8a4a1a', glove: '#8a4a1a', shoe: '#8a4a1a' } }],
        stance: { y: -0.1, lean: 0.1, twist: 0.3, sl: [1.3, 0.4], el: 1.2, sr: [0.9, 0.5], er: 1.6, wl: 0.6, wr: 0.6, hl: [0.35, 0.18], kl: 0.4, hr: [-0.25, 0.18], kr: 0.35 },
        win2: { y: -0.04, lean: -0.05, sl: [2.4, 0.9], el: 0.4, sr: [0.4, 0.2], er: 1.8, hl: [0.1, 0.1], kl: 0.1, hr: [-0.1, 0.1], kr: 0.1 },
        quote: 'Ta-daaa! And for my next trick...', taunt: 'Is THIS your card? It says LOSER.', rivalLine: 'Lady Lotus! Pick a card. Any card.',
        moves: [M({ id: 'pandawand', n: 'WAND TAP', btn: 'a', su: 6, ac: 3, re: 9, dmg: 5, rng: 1.3, ht: 'h', next: { b: 'pandapaw' }, fx: 'magic', A: jabA, B: jabB }),
          M({ id: 'pandapaw', n: 'PAW-PAW', btn: 'b', chainOnly: true, su: 9, ac: 4, re: 16, dmg: 10, rng: 1.4, ht: 'm', A: kickA, B: kickB })],
        specials: [SP('x', 'f', { n: 'RABBIT PUNCH', su: 7, ac: 3, re: 12, dmg: 9, rng: 1.3, ht: 'h', dash: 0.06, fx: 'magic', trail: 'hdR', A: P({ y: -0.1, twist: 0.4, sl: [1.0, 0.2], el: 2.0, sr: [1.0, 0.2], er: 2.4 }), B: dashPunch }),
          SP('y', 'b', { n: 'ROLLING PANDA', su: 10, ac: 12, re: 20, dmg: 12, rng: 1.2, ht: 'l', dash: 0.13, kd: true, crush: 'high', A: POSE.crouch, B: P({ y: -0.6, lean: 1.4, sl: [2.0, 0.2], el: 2.0, sr: [2.0, 0.2], er: 2.0, hl: [2.0, 0.1], kl: 2.4, hr: [2.0, 0.1], kr: 2.4 }) }),
          SP('y', 'f', { n: 'SAWN IN HALF', su: 14, ac: 6, re: 24, dmg: 16, rng: 1.6, ht: 'm', launch: true, fx: 'magic', trail: 'hdL', A: P({ y: -0.1, lean: -0.1, sl: [2.8, 0.4], el: 0.3, sr: [2.8, 0.4], er: 0.3 }), B: P({ y: -0.3, lean: 0.7, sl: [1.2, 0.1], el: 0.1, sr: [1.2, 0.1], er: 0.1, fw: 0.2 }) })],
        throws: [T('VANISHING ACT', 'magic', 24), T('PANDA FLIP', 'flip', 22)],
        story: ['The Great Pandini has done the same magic show at the end of the pier for twenty summers.', 'Is he a panda? Is he a man in a panda suit? He will not say. That is the magic.'],
        ending: ['For his greatest trick, The Great Pandini made the Tekno King disappear.', 'He has not been able to make him come back yet.', 'The pier show sold out until the year 2000. Ta-daaa!'] },
      { id: 'kapow', n: 'KID KAPOW', s: 'SKATEPARK CAPOEIRA', from: 'SOUTHAMPTON, ENGLAND', stats: [2, 4, 4], home: 'carpark', rival: 'volt', spd: 1.15, pow: 0.9, bounce: 1, trail: '#7aff7a', ai: { agg: 1.1 },
        body: { h: 0.95, w: 0.92, limb: 0.92, head: 1.05 }, hair: 'cap', top: 'tee', pants: 'jeans', sleeves: 'short', shoes: 'trainer', baggy: 1, rips: 1, emblem: 'star', emblemY: 22, emblemS: 6,
        face: { brow: 'flat', mouth: 'grin', freckles: 1, fringe: 'bangs', hairY: 9 },
        col: { skin: '#e0b090', hair: '#8a4a1a', hat: '#e01a1a', top: '#2a9a4a', top2: '#1a6a2a', sleeve: '#2a9a4a', pants: '#3a5aa0', shoe: '#f4f4f4', sole: '#e01a1a', emblem: '#ffe040', band: '#1a1a1a' },
        cos: [{ col: { hat: '#1a1a1a', top: '#f08a1a', sleeve: '#f08a1a', emblem: '#1a1a1a', pants: '#2a2a2a', sole: '#f08a1a' } }, { col: { hat: '#2a6af0', top: '#f4f4f4', sleeve: '#f4f4f4', emblem: '#2a6af0', pants: '#8a7a5a', skin: '#8a5a3a' } }],
        stance: { y: -0.2, lean: 0.2, twist: 0.3, sl: [1.0, 0.5], el: 1.4, sr: [0.4, 0.6], er: 1.0, hl: [0.6, 0.35], kl: 0.8, hr: [-0.3, 0.35], kr: 0.7, side: 0.08 },
        win2: { y: -0.06, lean: 0.05, sl: [0.4, 1.2], el: 0.2, sr: [0.4, 1.2], er: 0.2, hl: [0.1, 0.3], kl: 0.1, hr: [0.1, 0.3], kr: 0.1 },
        quote: 'Radical! Totally radical!', taunt: 'You got served. By a kid.', rivalLine: 'Volt! Bet you can\'t do a kickflip!',
        moves: [M({ id: 'kapowcart', n: 'CARTWHEEL KICK', btn: 'y', su: 14, ac: 6, re: 20, dmg: 13, rng: 1.7, ht: 'm', kd: true, hop: 0.35, crush: 'low', trail: 'ftR', A: P({ y: -0.2, lean: 0.6, side: 0.6, sl: [2.0, 1.2], el: 0.2, sr: [2.0, 1.2], er: 0.2, hl: [0.4, 0.4], kl: 0.6, hr: [0.4, 0.4], kr: 0.6 }), B: P({ y: -0.1, lean: 0.4, side: 1.1, sl: [2.6, 1.4], el: 0.1, sr: [2.6, 1.4], er: 0.1, hl: [0.4, 1.2], kl: 0.1, hr: [0.6, 1.4], kr: 0.1 }) }),
          M({ id: 'kapowlow', n: 'BREAKDANCE SWEEP', btn: 'b', dir: 'd', su: 9, ac: 6, re: 16, dmg: 7, hits: 2, rng: 1.6, ht: 'l', spin: Math.PI * 2, crush: 'high', trail: 'ftR', A: POSE.crouch, B: P({ y: -0.65, lean: 0.9, sl: [1.6, 0.3], el: 0.3, sr: [1.6, 0.3], er: 0.3, hl: [1.6, 0.9], kl: 0.1, hr: [1.6, 0.9], kr: 0.1 }) })],
        specials: [SP('x', 'f', { n: 'KICKFLIP KICK', su: 12, ac: 5, re: 22, dmg: 12, rng: 1.4, ht: 'm', launch: true, hop: 0.8, trail: 'ftR', A: P(C({ y: -0.3, lean: 0.3, sl: [1.0, 0.6], el: 1.2, sr: [1.0, 0.6], er: 1.2 })), B: P({ y: 0.1, lean: -0.6, sl: [1.6, 1.0], el: 0.6, sr: [1.6, 1.0], er: 0.6, hl: [2.2, 0.1], kl: 0.1, hr: [1.2, 0.1], kr: 1.6 }) }),
          SP('y', 'b', { n: 'HANDSTAND HELICOPTER', su: 12, ac: 18, re: 22, dmg: 15, hits: 3, rng: 1.5, ht: 'm', spin: Math.PI * 4, crush: 'high', trail: 'ftR', A: P({ y: -0.5, lean: 1.5, sl: [3.0, 0.3], el: 0.1, sr: [3.0, 0.3], er: 0.1, hl: [0.3, 0.5], kl: 0.4, hr: [0.3, 0.5], kr: 0.4 }), B: P({ y: -0.6, lean: 2.6, sl: [3.0, 0.4], el: 0.1, sr: [3.0, 0.4], er: 0.1, hl: [-0.3, 1.2], kl: 0, hr: [-0.3, 1.2], kr: 0 }) }),
          SP('y', 'f', { n: 'OLLIE STOMP', su: 16, ac: 5, re: 20, dmg: 14, rng: 1.4, ht: 'm', hop: 1.0, kd: true, dash: 0.07, crush: 'low', A: POSE.jump, B: P({ y: -0.1, lean: 0.3, sl: [1.6, 0.8], el: 0.6, sr: [1.6, 0.8], er: 0.6, hl: [0.9, 0.1], kl: 0.4, hr: [0.3, 0.1], kr: 1.4 }) })],
        throws: [T('MONKEY FLIP', 'flip', 22), T('SKATE PUSH', 'toss', 18)],
        story: ['Kid Kapow taught himself to fight by doing cartwheels at the skatepark until the park keeper gave up.', 'He is only in the tournament because he lied about his age. Do NOT tell his mom.'],
        ending: ['Kid Kapow won the whole tournament and got home in time for tea.', 'His mom found the trophy under his bed and asked where it came from.', '"Er... school?" said Kid Kapow. He is grounded until 2001.'] },
      { id: 'stone', n: 'SERGEANT STONE', s: 'ARMY PT BOXING', from: 'ALDERSHOT, ENGLAND', stats: [4, 3, 3], home: 'gym', rival: 'rico', spd: 0.95, pow: 1.1, ai: { agg: 1.05 },
        body: { h: 1.06, w: 1.15, chest: 1.15, limb: 1.15 }, hair: 'beret', top: 'camo', pants: 'camo', sleeves: 'short', shoes: 'boot', extra: ['belt'],
        face: { brow: 'thick', mouth: 'frown', stubble: '#3a2a1a', hairY: 9.5, scar: 1 },
        col: { skin: '#d8a070', hair: '#3a2a1a', hat: '#7a1a1a', top: '#5a6a3a', top2: '#3a4a2a', sleeve: '#5a6a3a', pants: '#5a6a3a', shoe: '#1a1a1a', belt: '#2a2a1a', beltOn: 1 },
        cos: [{ col: { top: '#c8b890', top2: '#8a7a50', sleeve: '#c8b890', pants: '#c8b890', hat: '#1a1a1a' } }, { col: { top: '#3a4a6a', top2: '#1a2a3a', sleeve: '#3a4a6a', pants: '#2a3a5a', hat: '#2a8af0', skin: '#8a5a3a' } }],
        stance: { y: -0.1, lean: 0.18, twist: 0.3, sl: [1.3, 0.12], el: 2.2, sr: [1.15, 0.12], er: 2.45, hl: [0.35, 0.12], kl: 0.4, hr: [-0.3, 0.12], kr: 0.3, hp: 0.15 },
        win2: { y: 0, lean: -0.05, hp: -0.1, sl: [0.2, 0.1], el: 0.2, sr: [2.4, 0.3, 1.4], er: 2.4, hl: [0.0, 0.05], kl: 0, hr: [0.0, 0.05], kr: 0 },
        quote: 'DROP AND GIVE ME TWENTY!', taunt: 'You call that a punch, private?', rivalLine: 'Turbo! Your headband is NOT regulation!',
        moves: [M({ id: 'stonehook', n: 'BARRACK HOOK', btn: 'x', su: 10, ac: 3, re: 15, dmg: 12, rng: 1.35, ht: 'h', next: { x: 'stoneupper' }, A: crossA, B: P({ y: -0.12, lean: 0.3, twist: -0.8, sl: [1.0, 0.2], el: 2.1, sr: [1.5, 0.5, 1.0], er: 1.5, hl: [0.4, 0.1], kl: 0.5, hr: [-0.4, 0.12], kr: 0.2, fw: 0.1 }) }),
          M({ id: 'stoneupper', n: 'HOOK-UPPERCUT', btn: 'x', chainOnly: true, su: 11, ac: 3, re: 22, dmg: 12, rng: 1.25, ht: 'm', launch: true, trail: 'hdR', A: P(C({ y: -0.3, lean: 0.4, sl: [1.0, 0.2], el: 2.0, sr: [0.3, 0.2], er: 1.6 })), B: P({ y: 0.03, lean: -0.25, twist: -0.4, sl: [0.9, 0.2], el: 2.0, sr: [2.75, 0], er: 0.9 }) })],
        specials: [SP('x', 'f', { n: 'DRILL SERGEANT', su: 12, ac: 15, re: 22, dmg: 18, hits: 3, rng: 1.4, ht: 'm', dash: 0.05, trail: 'hdR', A: crossA, B: crossB }),
          SP('y', 'b', { n: 'PARADE STOMP', su: 13, ac: 4, re: 20, dmg: 12, rng: 1.3, ht: 'l', kd: true, A: P({ y: -0.05, lean: -0.1, sl: [0.3, 0.1], el: 0.2, sr: [0.3, 0.1], er: 0.2, hl: [1.6, 0.1], kl: 1.8, hr: [0, 0.1], kr: 0 }), B: P({ y: -0.2, lean: 0.2, sl: [0.3, 0.1], el: 0.2, sr: [0.3, 0.1], er: 0.2, hl: [0.6, 0.1], kl: 0.2, hr: [-0.2, 0.1], kr: 0.4 }) }),
          SP('y', 'f', { n: 'ATTEN-SHUN!', su: 15, ac: 4, re: 26, dmg: 15, rng: 1.25, ht: 'm', launch: true, trail: 'hdR', A: P(C({ y: -0.45, lean: 0.5, sl: [1.0, 0.2], el: 2.0, sr: [0.2, 0.3], er: 1.4 })), B: P({ y: 0.08, lean: -0.3, sl: [0.2, 0.1], el: 0.2, sr: [3.0, 0.05], er: 0.05, hl: [0, 0.05], kl: 0, hr: [0, 0.05], kr: 0 }) })],
        throws: [T('ARMY SUPLEX', 'suplex', 26), T('HEADBUTT DRILL', 'head', 22)],
        story: ['Sergeant Stone has run the Saturday boot camp at the school gym for twenty years. He has never once smiled.', 'He has entered Tekno Fist to "sort out this Tekno King character". Left, right, left, right.'],
        ending: ['Sergeant Stone saluted the trophy. The trophy did not salute back, so he made it do press-ups.', 'Some people say that, just for a moment, at the very end, he smiled.', 'He denies this completely.'] },
      { id: 'lotus', n: 'LADY LOTUS', s: 'CRANE TAI CHI', from: 'A GARDEN IN KEW', stats: [3, 4, 4], home: 'temple', rival: 'pandini', spd: 1.05, trail: '#ffb0d0',
        body: { h: 0.98, w: 0.88, chest: 0.92, limb: 0.9 }, hair: 'long', top: 'robe', pants: 'plain', sleeves: 'long', shoes: 'shoe', extra: ['sash'],
        face: { brow: 'flat', eyes: 'narrow', mouth: 'smirk', lash: 1, fringe: 'bangs', backY: 30 },
        col: { skin: '#f0d0b0', hair: '#141414', top: '#c01a2a', top2: '#ffd040', inner: '#f4e8d0', sleeve: '#c01a2a', pants: '#2a1a1a', shoe: '#2a1a1a', sash: '#ffd040', lip: '#c0102a' },
        cos: [{ col: { top: '#1a6aa0', sleeve: '#1a6aa0', top2: '#f4f4f4', sash: '#f4f4f4' } }, { col: { top: '#f4f0e8', sleeve: '#f4f0e8', top2: '#5a8a3a', sash: '#5a8a3a', inner: '#5a8a3a', hair: '#5a3a1a' } }],
        stance: { y: -0.16, lean: 0.05, twist: 0.5, sl: [1.5, 0.25, 0.2], el: 0.7, sr: [1.9, 0.5], er: 1.3, wl: 1.0, wr: -1.0, hl: [0.4, 0.05], kl: 0.5, hr: [-0.4, 0.2], kr: 0.6 },
        win2: { y: -0.05, lean: 0, sl: [2.6, 0.6], el: 0.3, sr: [2.6, 0.6], er: 0.3, wl: 1.0, wr: 1.0, hl: [0.1, 0.05], kl: 0.1, hr: [1.4, 0.1], kr: 2.4 },
        quote: 'Be like water. Wet.', taunt: 'Your chi is all over the place, dear.', rivalLine: 'Pandini. Your tricks will not work on me.',
        moves: [M({ id: 'lotuspalm1', n: 'WILLOW PALM', btn: 'a', su: 7, ac: 4, re: 10, dmg: 6, rng: 1.35, ht: 'h', next: { a: 'lotuspalm2' }, A: P({ y: -0.12, twist: 0.6, sl: [1.2, 0.2], el: 1.2, sr: [2.0, 0.4], er: 1.0, wl: 1.2 }), B: P({ y: -0.14, lean: 0.2, twist: 0.4, sl: [1.55, 0.0], el: 0.1, wl: 1.3, sr: [2.0, 0.4], er: 1.0, fw: 0.1 }) }),
          M({ id: 'lotuspalm2', n: 'DOUBLE WILLOW', btn: 'a', chainOnly: true, su: 8, ac: 4, re: 16, dmg: 10, rng: 1.4, ht: 'm', push: 0.12, A: P({ y: -0.12, twist: -0.2, sl: [1.3, 0.2], el: 1.6, sr: [1.3, 0.2], er: 1.6 }), B: P({ y: -0.16, lean: 0.25, sl: [1.5, 0.1], el: 0.1, sr: [1.5, 0.1], er: 0.1, wl: 1.3, wr: 1.3, fw: 0.15 }) })],
        specials: [SP('x', 'f', { n: 'CRANE BEAK', su: 7, ac: 3, re: 14, dmg: 10, rng: 1.55, ht: 'h', dash: 0.05, A: P({ y: -0.05, twist: 0.4, sl: [2.6, 0.3], el: 0.6, wl: -1.2, sr: [1.0, 0.4], er: 1.0, hl: [0.05, 0.05], kl: 0.1, hr: [1.2, 0.1], kr: 2.2 }), B: P({ y: -0.1, lean: 0.3, twist: 0.2, sl: [1.0, 0.4], el: 1.0, sr: [1.6, 0.05], er: 0.05, wr: -1.2, hl: [0.1, 0.05], kl: 0.2, hr: [1.4, 0.1], kr: 2.0 }) }),
          SP('y', 'b', { n: 'LOTUS PALM', su: 18, ac: 5, re: 20, dmg: 15, rng: 1.4, ht: 'm', push: 0.3, kd: true, fx: 'petal', trail: 'hdR', A: P({ y: -0.2, lean: -0.1, twist: 1.0, sl: [1.0, 0.6], el: 1.4, sr: [0.4, 0.4], er: 2.4, hl: [0.6, 0.3], kl: 0.8, hr: [-0.5, 0.3], kr: 0.7 }), B: P({ y: -0.25, lean: 0.25, twist: -0.2, sl: [1.0, 0.6], el: 1.4, sr: [1.55, 0.0], er: 0.0, wr: 1.4, hl: [0.8, 0.3], kl: 0.9, hr: [-0.6, 0.3], kr: 0.2, fw: 0.2 }) }),
          SP('y', 'f', { n: 'FALLING PETALS', su: 12, ac: 18, re: 20, dmg: 16, hits: 4, rng: 1.5, ht: 'h', fx: 'petal', trail: 'hdL', A: P({ y: -0.1, twist: 0.8, sl: [2.0, 0.6], el: 0.4, sr: [2.2, 0.6], er: 0.4 }), B: P({ y: -0.1, twist: -0.8, sl: [1.5, 0.1], el: 0.1, sr: [1.5, 0.1], er: 0.1 }) })],
        throws: [T('WILLOW THROW', 'hip', 24), T('WHIRLPOOL', 'spin', 22)],
        story: ['Lady Lotus does tai chi in Kew Gardens every morning at six. The pigeons have learned to stay very still.', 'She says the Tekno King has "bad energy". She intends to tidy it up.'],
        ending: ['Lady Lotus defeated the Tekno King without ever looking cross.', 'She now teaches tai chi to the whole tournament every morning at six. Attendance is compulsory.', 'Even Big Barry comes. He is surprisingly bendy.'] },
      { id: 'doc', n: 'DOC SPROCKET', s: 'GADGET-FU', from: 'A SHED IN SLOUGH', stats: [3, 3, 4], home: 'space', rival: 'unit9', spd: 0.95, trail: '#7ad8ff',
        body: { h: 1.02, w: 0.95, belly: 1.08, head: 1.1 }, hair: 'wild', top: 'labcoat', pants: 'plain', sleeves: 'long', shoes: 'shoe', extra: ['coat', 'tie'], weapon: { kind: 'wrench', col: '#a8acb4', grip: '#8a8a90' },
        face: { brow: 'up', mouth: 'teeth', goggles: '#7ad8ff', tache: '#e8e8e8', hairY: 6 },
        col: { skin: '#f0c8a0', hair: '#f0f0f0', top: '#f4f4f4', coat: '#f4f4f4', sleeve: '#f4f4f4', shirt: '#9ab8d8', tie: '#c01a1a', pants: '#4a4a5a', shoe: '#3a2a1a', glove: '#e0c040' },
        cos: [{ col: { top: '#e8e0b0', coat: '#e8e0b0', sleeve: '#e8e0b0', tie: '#2a6a2a', glove: '#2a2a2a' } }, { col: { top: '#3a3a4a', coat: '#3a3a4a', sleeve: '#3a3a4a', tie: '#ff3a1a', shirt: '#1a1a1a', hair: '#ff6a1a', glove: '#7aff3a' } }],
        stance: { y: -0.08, lean: 0.22, twist: 0.3, sl: [1.0, 0.3], el: 1.7, sr: [0.9, 0.4], er: 1.2, hl: [0.35, 0.15], kl: 0.4, hr: [-0.25, 0.15], kr: 0.35, hp: -0.1 },
        win2: { y: -0.04, lean: -0.15, hp: -0.3, sl: [0.9, 0.4], el: 2.2, sr: [3.0, 0.3], er: 0.3, hl: [0.1, 0.1], kl: 0.1, hr: [-0.1, 0.1], kr: 0.1 },
        quote: 'SCIENCE! Hahahaha!', taunt: 'Fascinating. You lost in record time.', rivalLine: 'Unit 9! Come back to the shed this INSTANT!',
        moves: [M({ id: 'docspan', n: 'SPANNER TAP', btn: 'x', su: 10, ac: 4, re: 15, dmg: 11, rng: 1.6, ht: 'h', next: { x: 'docspan2' }, trail: 'hdR', A: P({ y: -0.1, twist: 0.6, sl: [1.0, 0.3], el: 1.7, sr: [2.4, 0.4], er: 1.2 }), B: P({ y: -0.14, lean: 0.35, twist: -0.4, sl: [1.0, 0.3], el: 1.7, sr: [1.0, 0.1], er: 0.2, fw: 0.1 }) }),
          M({ id: 'docspan2', n: 'SPANNER UPSWING', btn: 'x', chainOnly: true, su: 11, ac: 4, re: 22, dmg: 12, rng: 1.5, ht: 'm', launch: true, trail: 'hdR', A: P({ y: -0.2, lean: 0.4, sl: [1.0, 0.3], el: 1.7, sr: [0.4, 0.3], er: 0.4 }), B: P({ y: 0, lean: -0.2, sl: [1.0, 0.3], el: 1.7, sr: [2.8, 0.1], er: 0.2 }) })],
        specials: [SP('x', 'f', { n: 'SPANNER SWING', su: 13, ac: 5, re: 20, dmg: 15, rng: 1.7, ht: 'h', track: true, kd: true, spin: -1.0, trail: 'hdR', A: P({ y: -0.1, twist: 1.2, sl: [0.8, 0.3], el: 1.6, sr: [1.4, 1.3], er: 0.3 }), B: P({ y: -0.12, twist: -1.1, sl: [0.8, 0.3], el: 1.6, sr: [1.5, 0.1, 0.8], er: 0.1, fw: 0.1 }) }),
          SP('y', 'b', { n: 'SPRING BOOTS', su: 14, ac: 6, re: 22, dmg: 14, rng: 1.5, ht: 'm', hop: 1.1, kd: true, dash: 0.08, crush: 'low', trail: 'ftR', A: POSE.jump, B: P({ y: 0.05, lean: -0.3, sl: [1.5, 0.9], el: 0.6, sr: [1.5, 0.9], er: 0.6, hl: [1.5, 0.1], kl: 0.1, hr: [1.5, 0.1], kr: 0.1 }) }),
          SP('y', 'f', { n: 'TESLA PALM', su: 16, ac: 8, re: 22, dmg: 16, hits: 2, rng: 1.35, ht: 'm', crumple: true, fx: 'zap', trail: 'hdL', A: P({ y: -0.15, twist: 0.8, sl: [1.2, 0.5], el: 1.6, sr: [0.9, 0.4], er: 1.2 }), B: P({ y: -0.18, lean: 0.3, twist: 0.2, sl: [1.6, 0.0], el: 0.0, wl: 1.4, sr: [0.9, 0.4], er: 1.2, fw: 0.15 }) })],
        throws: [T('JUMP LEADS', 'zap', 24), T('GADGET BOOT', 'toss', 18)],
        story: ['Doctor Sprocket builds inventions in his shed in Slough. Most of them explode. One of them was UNIT 9.', 'He has entered Tekno Fist to win the prize money for a bigger shed. And to find out where UNIT 9 went.'],
        ending: ['Doc Sprocket built the biggest shed in Slough. It has a lift, a moat and a laser.', 'UNIT 9 came home and helped. Nothing has exploded for nearly a week.', 'His next invention: a toaster that does homework.'] },
    ];
    // ---- the hidden fighter (unlocked by finishing Arcade, or by beating him when he turns up mid-run)
    const hidden = [
      { id: 'gubbinz', n: 'GUBBINZ', s: 'GROT SCRAPPING', from: 'JACKNET (SOMEWHERE)', stats: [2, 5, 2], lock: 1, home: 'bedroom', spd: 1.3, pow: 0.9, bounce: 1, trail: '#9aff3a', hint: 'A LITTLE GREEN SOMEBODY IS WATCHING THE ARCADE...', ai: { agg: 1.3 },
        body: { h: 0.74, w: 0.95, head: 1.55, limb: 0.95, legs: 0.9, belly: 1.1 }, hair: 'grot', top: 'tunic', pants: 'plain', sleeves: 'none', shoes: 'bare', extra: ['belt'],
        face: { eyes: 'grot', brow: 'angry', mouth: 'fangs', bald: true },
        col: { skin: '#6aa83a', hair: '#3a5a1a', top: '#8a6a3a', top2: '#5a4a2a', pants: '#5a4a2a', belt: '#3a2a1a', beltOn: 1, lip: '#2a3a1a' },
        cos: [{ col: { top: '#c01a1a', pants: '#3a1a1a', skin: '#5a9a3a' } }, { col: { top: '#2a2a2a', pants: '#2a2a2a', skin: '#8ac04a', belt: '#ffd040' } }],
        stance: { y: -0.15, lean: 0.45, twist: 0.2, sl: [0.8, 0.5], el: 1.4, sr: [0.9, 0.5], er: 1.5, hl: [0.5, 0.25], kl: 0.8, hr: [0.1, 0.25], kr: 0.8, hp: -0.4 },
        win2: { y: 0.0, lean: -0.1, sl: [3.0, 0.5], el: 0.2, sr: [3.0, 0.5], er: 0.2, hl: [0.05, 0.3], kl: 0.05, hr: [0.05, 0.3], kr: 0.05 },
        quote: 'GUBBINZ IS DA BEST!', taunt: 'Hur hur hur! Youz got BASHED!',
        moves: [M({ id: 'gubbite', n: 'NIBBLE', btn: 'a', su: 5, ac: 3, re: 8, dmg: 4, rng: 1.1, ht: 'h', next: { a: 'gubbite2' }, A: P({ y: -0.1, lean: 0.6, hp: 0.3, sl: [1.2, 0.4], el: 1.4, sr: [1.2, 0.4], er: 1.4 }), B: P({ y: -0.12, lean: 0.9, hp: 0.5, sl: [1.4, 0.4], el: 1.0, sr: [1.4, 0.4], er: 1.0, fw: 0.15 }) }),
          M({ id: 'gubbite2', n: 'NIBBLE NIBBLE', btn: 'a', chainOnly: true, su: 5, ac: 3, re: 8, dmg: 4, rng: 1.1, ht: 'h', next: { a: 'gubbite3' }, A: P({ y: -0.1, lean: 0.6, hp: 0.3, sl: [1.2, 0.4], el: 1.4, sr: [1.2, 0.4], er: 1.4 }), B: P({ y: -0.12, lean: 0.9, hp: 0.5, sl: [1.4, 0.4], el: 1.0, sr: [1.4, 0.4], er: 1.0, fw: 0.15 }) }),
          M({ id: 'gubbite3', n: 'BIG CHOMP', btn: 'a', chainOnly: true, su: 8, ac: 4, re: 18, dmg: 9, rng: 1.2, ht: 'm', kd: true, A: P({ y: -0.1, lean: -0.3, hp: -0.5, sl: [2.2, 0.6], el: 0.6, sr: [2.2, 0.6], er: 0.6 }), B: P({ y: -0.15, lean: 1.0, hp: 0.6, sl: [1.0, 0.4], el: 0.4, sr: [1.0, 0.4], er: 0.4, fw: 0.25 }) })],
        specials: [SP('x', 'f', { n: 'GROT RUSH', su: 10, ac: 8, re: 22, dmg: 13, rng: 1.3, ht: 'm', dash: 0.16, kd: true, A: P({ y: -0.2, lean: 0.9, hp: 0.5, sl: [0.2, 0.3], el: 0.3, sr: [0.2, 0.3], er: 0.3, hl: [0.8, 0.1], kl: 1.0, hr: [-0.6, 0.1], kr: 1.2 }), B: P({ y: -0.25, lean: 1.3, hp: 0.6, sl: [0.1, 0.3], el: 0.2, sr: [0.1, 0.3], er: 0.2, hl: [1.0, 0.1], kl: 0.6, hr: [-0.8, 0.1], kr: 0.8 }) }),
          SP('y', 'b', { n: 'TOE STOMPER', su: 8, ac: 4, re: 16, dmg: 9, rng: 1.1, ht: 'l', crumple: true, A: P({ y: -0.05, sl: [1.5, 0.6], el: 0.6, sr: [1.5, 0.6], er: 0.6, hl: [1.5, 0.1], kl: 1.6, hr: [0, 0.1], kr: 0 }), B: P({ y: -0.25, lean: 0.3, sl: [1.5, 0.6], el: 0.6, sr: [1.5, 0.6], er: 0.6, hl: [0.6, 0.1], kl: 0.2, hr: [-0.2, 0.1], kr: 0.4 }) }),
          SP('y', 'f', { n: 'BIG SHOUT', su: 20, ac: 10, re: 20, dmg: 10, rng: 1.9, ht: 'm', unb: true, push: 0.35, kd: true, fx: 'wind', trail: 'hdR', A: P({ y: -0.2, lean: -0.5, hp: -0.6, sl: [2.4, 1.0], el: 0.4, sr: [2.4, 1.0], er: 0.4 }), B: P({ y: -0.2, lean: 0.4, hp: -0.3, sl: [1.0, 1.4], el: 0.3, sr: [1.0, 1.4], er: 0.3 }) })],
        throws: [T('GROT HEADBUTT', 'head', 20), T('PIGGYBACK PUMMEL', 'knee', 22)],
        story: ['Gubbinz lives somewhere inside JackNet. Nobody knows how he got into the Tekno Fist disc.', 'He wants the trophy because it is shiny. That is the only reason. Shiny.'],
        ending: ['Gubbinz won the whole Tekno Fist tournament and ran off with the trophy.', 'He hid it somewhere on JackNet. It is still there now, if you know where to look.', 'Hur hur hur. SHINY.'] },
    ];
    const boss = { id: 'king', n: 'TEKNO KING', s: 'THE BOSS', from: 'TEKNO TOWER', stats: [5, 4, 4], lock: 1, home: 'tower', spd: 1.0, pow: 1.1, hint: 'BEAT ARCADE MODE ON NORMAL OR HARDER.', trail: '#ffd040', ai: { agg: 1.1 },
      body: { h: 1.14, w: 1.2, chest: 1.12, limb: 1.1 }, hair: 'crown', top: 'king', pants: 'armour', sleeves: 'long', shoes: 'boot', extra: ['cape', 'belt', 'gauntlets'], capeEmblem: 'star',
      face: { mask: '#d8b030', mask2: '#fff0a0', brow: 'angry', mouth: 'frown', beard: '#2a1a0a', hairY: 6 },
      col: { skin: '#d8a070', hair: '#2a1a0a', crown: '#ffd040', top: '#d0a020', top2: '#8a1010', sleeve: '#8a1010', arm: '#8a1010', pants: '#3a1a5a', belt: '#ffd040', beltOn: 1, shoe: '#d0a020', glove: '#d0a020', gauntlet: '#d0a020', extra: '#c01020', cape: '#8a1010', trim: '#ffd040' },
      cos: [{ col: { top: '#c8ccd8', sleeve: '#2a2a3a', arm: '#2a2a3a', pants: '#2a2a3a', cape: '#1a1a3a', trim: '#c8ccd8', crown: '#c8ccd8', glove: '#c8ccd8', gauntlet: '#c8ccd8', shoe: '#c8ccd8', belt: '#c8ccd8' } }],
      stance: { y: -0.08, lean: 0.05, twist: 0.3, sl: [1.0, 0.45], el: 1.4, sr: [0.6, 0.5], er: 1.2, hl: [0.35, 0.18], kl: 0.4, hr: [-0.3, 0.18], kr: 0.35, hp: -0.15 },
      win2: { y: -0.02, lean: -0.2, hp: -0.3, sl: [0.4, 1.3], el: 0.3, sr: [0.4, 1.3], er: 0.3, hl: [0.2, 0.2], kl: 0.1, hr: [-0.2, 0.2], kr: 0.1 },
      quote: 'KNEEL. KNEEL BEFORE THE KING.', taunt: 'BOW BEFORE THE KING OF TEKNO!',
      moves: [M({ id: 'kingslap', n: 'ROYAL BACKHAND', btn: 'a', su: 6, ac: 3, re: 10, dmg: 7, rng: 1.35, ht: 'h', next: { x: 'kinghook' }, A: jabA, B: jabB }),
        M({ id: 'kinghook', n: 'BACKHAND-HAMMER', btn: 'x', chainOnly: true, su: 12, ac: 4, re: 20, dmg: 14, rng: 1.4, ht: 'm', kd: true, A: overhead, B: smash })],
      specials: [SP('x', 'f', { n: 'KING HAMMER', su: 14, ac: 5, re: 22, dmg: 17, rng: 1.6, ht: 'm', dash: 0.1, kd: true, fx: 'gold', trail: 'hdR', A: overhead, B: smash }),
        SP('y', 'b', { n: 'ROYAL WHIRL', su: 13, ac: 8, re: 20, dmg: 15, rng: 1.7, ht: 'h', kd: true, hop: 0.4, spin: Math.PI * 2, trail: 'ftR', A: whirl, B: whirl }),
        SP('y', 'f', { n: 'CROWN CANNON', su: 22, ac: 6, re: 24, dmg: 18, rng: 2.6, ht: 'm', push: 0.2, kd: true, fx: 'gold', trail: 'hdR', A: P({ y: -0.2, lean: -0.2, sl: [1.0, 0.3], el: 2.0, sr: [1.0, 0.3], er: 2.0, hl: [0.6, 0.2], kl: 1.0, hr: [-0.4, 0.2], kr: 0.8 }), B: P({ y: -0.2, lean: 0.4, sl: [1.6, 0.0], el: 0, sr: [1.6, 0.0], er: 0, wl: 1.3, wr: 1.3, fw: 0.2 }) })],
      throws: [T('ROYAL SLAM', 'slam', 28), T('THRONE SUPLEX', 'suplex', 28)],
      story: ['Nobody has ever seen the Tekno King\'s face. Some say there is nothing behind the golden mask. Some say it is a very ordinary man called Keith.', 'He built Tekno Tower, he runs the tournament, and he has never, ever lost.'],
      ending: ['The Tekno King beat... himself? He won his own tournament. Again.', 'Then he took off the golden mask. Underneath was a very ordinary man called Keith.', '"Same time next year?" said Keith.'] };
    // ---------------------------------------------------------------- the stages (each one: a sky, a painted skyline, a floor, props, lights)
    const PI = Math.PI;
    const R = seed => RF.prng(seed);
    // little prop builders (into a vertex-coloured bucket)
    function car(b, x, z, ry, col, r) {
      const o = (dx, dy, dz) => { const c = Math.cos(ry), s = Math.sin(ry); return { x: x + dx * c + dz * s, y: dy, z: z - dx * s + dz * c, ry }; };
      b.box(1.8, 0.62, 4.0, Object.assign(o(0, 0.55, 0), { col, grad: [1.1, 0.7] }));
      b.box(1.62, 0.55, 2.0, Object.assign(o(0, 1.12, -0.25), { col: shade(col, 0.9) }));
      b.box(1.66, 0.42, 1.9, Object.assign(o(0, 1.12, -0.25), { col: '#1a2a3a' }));
      for (const [dx, dz] of [[-0.82, 1.25], [0.82, 1.25], [-0.82, -1.3], [0.82, -1.3]]) b.cyl(0.33, 0.33, 0.24, 10, Object.assign(o(dx, 0.33, dz), { rz: PI / 2, col: '#141414' }));
      b.box(1.5, 0.12, 0.05, Object.assign(o(0, 0.62, 2.01), { col: '#e8e8e0' })); b.box(0.3, 0.14, 0.05, Object.assign(o(-0.65, 0.7, 2.01), { col: '#fff8c0' })); b.box(0.3, 0.14, 0.05, Object.assign(o(0.65, 0.7, 2.01), { col: '#fff8c0' }));
      b.box(0.3, 0.14, 0.05, Object.assign(o(-0.65, 0.7, -2.01), { col: '#c01a1a' })); b.box(0.3, 0.14, 0.05, Object.assign(o(0.65, 0.7, -2.01), { col: '#c01a1a' }));
    }
    function tree(b, x, z, h, col, r) { b.cyl(0.12 * h, 0.18 * h, h * 0.5, 6, { x, y: h * 0.25, z, col: '#5a3a1a' }); for (let i = 0; i < 3; i++) b.cone(h * (0.45 - i * 0.1), h * 0.5, 7, { x, y: h * (0.55 + i * 0.22), z, col: shade(col, 0.8 + i * 0.15), ry: r() * 3 }); }
    function palm(b, x, z, h) { for (let i = 0; i < 6; i++) b.cyl(0.12, 0.15, h / 6, 6, { x: x + Math.sin(i * 0.3) * 0.15 * i, y: h / 12 + i * h / 6, z, col: i % 2 ? '#8a6a3a' : '#6a4a2a' }); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; b.box(0.35, 0.05, 1.8, { x: x + 0.75 + Math.sin(a) * 0.8, y: h - 0.1, z: z + Math.cos(a) * 0.8, ry: a, rx: 0.4, col: '#2a8a2a' }); } }
    function lamp(b, e, x, z, h, col) { b.cyl(0.07, 0.1, h, 6, { x, y: h / 2, z, col: '#2a2a30' }); b.box(0.5, 0.08, 0.1, { x: x + 0.22, y: h, z, col: '#2a2a30' }); e.ball(0.18, 8, 6, { x: x + 0.45, y: h - 0.12, z, col }); }
    function people(n, cx, cz, rad, a0, a1, y, seed, face) { const r = R(seed || 3), out = []; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + r() * 0.6) / n, rr = rad + (r() - 0.5) * 1.2; out.push([cx + Math.sin(a) * rr, y || 0, cz + Math.cos(a) * rr, face != null ? face : a + PI]); } return out; }
    function row(n, x0, x1, z, y, face, jit, seed) { const r = R(seed || 5), out = []; for (let i = 0; i < n; i++) out.push([x0 + (x1 - x0) * (i + 0.5) / n + (r() - 0.5) * (jit || 0.3), y, z + (r() - 0.5) * (jit || 0.3), face]); return out; }
    const signTex = (SB, text, bg, fg, w, h) => SB.tex(w || 128, h || 32, (g, W2, H2) => { g.fillStyle = bg; g.fillRect(0, 0, W2, H2); g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(2, 2, W2 - 4, H2 - 4); g.fillStyle = fg; g.font = `bold ${H2 * 0.62}px Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W2 / 2, H2 / 2 + 1); }, { clamp: true });
    const stages = [
      { id: 'rooftop', n: 'NEON ROOFTOP', d: 'Midnight above the city. Mind the drop.', music: 'fight1', build(SB) {
        SB.sky([[0, '#05030f'], [0.5, '#1a0a3a'], [0.85, '#5a1a5a'], [1, '#c04a6a']], { lift: 0.05 }); SB.stars(140); SB.fog(0x1a0a2a, 18, 70);
        SB.band((g, w, h) => PT.skyline(g, w, h, { kind: 'city', layers: [{ col: '#2a1a4a', hmin: 0.35, hmax: 0.75, bw: 14, lit: 0.12, win: '#ffd27a' }] }), { r: 95, h: 34, y: 4, rep: 3, ph: 128 });
        SB.band((g, w, h) => PT.skyline(g, w, h, { kind: 'city', seed: 9, layers: [{ col: '#120a22', hmin: 0.2, hmax: 0.7, bw: 22, lit: 0.25, win: '#ffe8a0' }] }), { r: 70, h: 26, y: -2, rep: 2, ph: 128, ry: 1 });
        const fl = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#4a4a56'; g.fillRect(0, 0, w, h); PT.noise(g, 0, 0, w, h, 0.25, R(3), 1); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 31, w, 2); g.fillRect(31, 0, 2, h); });
        SB.bucket({ map: fl }).plane(60, 60, { rx: -PI / 2, wuv: 4 });
        const pad = SB.tex(64, 64, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); g.strokeStyle = '#e0c020'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 28, 0, PI * 2); g.stroke(); g.fillStyle = '#e0c020'; g.fillRect(20, 16, 5, 32); g.fillRect(39, 16, 5, 32); g.fillRect(20, 30, 24, 5); }, { clamp: true });
        SB.bucket({ map: pad, transparent: true, alphaTest: 0.4 }).plane(7, 7, { rx: -PI / 2, y: 0.01 });
        const pr = SB.bucket({}), em = SB.bucket({ unlit: true }), r = R(11);
        for (let i = -9; i <= 9; i += 1.5) for (const [x, z] of [[i, -9.5], [i, 9.5], [-9.5, i], [9.5, i]]) pr.box(0.08, 1.1, 0.08, { x, y: 0.55, z, col: '#8a8a9a' });
        for (const [x, z, w, d] of [[0, -9.5, 19, 0.1], [0, 9.5, 19, 0.1], [-9.5, 0, 0.1, 19], [9.5, 0, 0.1, 19]]) { pr.box(w, 0.08, d, { x, y: 1.1, z, col: '#9a9aaa' }); pr.box(w + 0.4, 0.5, d + 0.4, { x, y: -0.2, z, col: '#3a3a44' }); }
        pr.cyl(1.5, 1.5, 3.2, 12, { x: -12, y: 4.2, z: -13, col: '#6a5a4a', grad: [1.1, 0.7] }); pr.cone(1.6, 0.8, 12, { x: -12, y: 6.2, z: -13, col: '#5a4a3a' }); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pr.box(0.2, 2.6, 0.2, { x: -12 + dx, y: 1.3, z: -13 + dz, col: '#3a3a3a' });
        for (let i = 0; i < 4; i++) { pr.box(1.6, 1.1, 1.2, { x: 10 + i * 2, y: 0.55, z: -12, col: '#8a8f96', grad: [1.1, 0.75] }); pr.cyl(0.45, 0.45, 0.1, 10, { x: 10 + i * 2, y: 1.12, z: -12, col: '#2a2a2a' }); }
        pr.box(0.25, 14, 0.25, { x: 13, y: 7, z: 6, col: '#5a5a66' }); const blink = SB.bucket({ unlit: true, ref: m => { SB.on(t => { m.visible = (t % 60) < 30; }); } }); blink.ball(0.25, 6, 4, { x: 13, y: 14.2, z: 6, col: '#ff2020' });
        const s1 = signTex(SB, 'TEKNO', '#1a0a20', '#ff2a8a'), s2 = signTex(SB, 'PIZZA 24HR', '#0a1a20', '#2af0ff');
        const nb = SB.bucket({ map: s1, unlit: true, ref: m => SB.on(t => { m.visible = (t % 170) > 6 && (t % 170) < 160 || (t % 7) < 3; }) }); nb.plane(8, 2, { x: 4, y: 6.8, z: -15.9 });
        SB.bucket({ map: s2, unlit: true }).plane(6, 1.5, { x: -15.9, y: 4.5, z: 4, ry: PI / 2 });
        pr.box(9, 4.4, 0.3, { x: 4, y: 5.4, z: -16.2, col: '#1a1a22' }); pr.box(0.3, 3.4, 7, { x: -16.2, y: 3.6, z: 4, col: '#1a1a22' });
        em.box(9.2, 0.12, 0.12, { x: 4, y: 7.9, z: -15.9, col: '#ff2a8a' }); em.box(9.2, 0.12, 0.12, { x: 4, y: 5.7, z: -15.9, col: '#2af0ff' });
        SB.crowd(row(7, -6, 6, -11.5, 0, 0, 0.6, 3).concat(row(5, -8, -3, 11.5, 0, PI, 0.6, 4)), { scale: 0.95, cols: ['#2a2a3a', '#5a1a4a', '#1a3a5a', '#3a3a3a', '#7a1a1a'] });
        SB.drift({ n: 90, box: [-16, 16, 0, 14, -16, 10], vy: -0.22, vx: 0.03, sway: 0, col: '#9ab0ff', size: 0.07, a: 0.5, cell: 1 });
        SB.light({ amb: 0.75, sky: 0x8a9aff, ground: 0x402040, sun: 0.65, sunCol: 0xc8b0ff, dir: [0.3, 1, 0.5], rim: 0.8, rimCol: 0xff4a9a });
        return { wall: 8.8, dustCol: '#6a6a7a' };
      } },
      { id: 'dojo', n: 'MIDNIGHT DOJO', d: 'Paper walls, polished boards, a lot of quiet students.', music: 'fight2', build(SB) {
        SB.sky([[0, '#0a0604'], [1, '#2a1a10']]); SB.fog(0x1a0c06, 16, 40);
        const fl = SB.tex(64, 64, (g, w, h) => PT.planks(g, w, h, { col: '#b07a40', n: 4, seed: 4 }));
        SB.bucket({ map: fl }).plane(40, 40, { rx: -PI / 2, wuv: 3 });
        const mat = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#4a6a2a'; g.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 2) { g.fillStyle = `rgba(0,0,0,${0.08 + (i % 4) * 0.02})`; g.fillRect(i, 0, 1, h); } g.fillStyle = '#1a1a10'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); });
        const mb = SB.bucket({ map: mat }); for (let i = -2; i <= 1; i++) for (let j = -1; j <= 0; j++) mb.box(3, 0.05, 1.5, { x: i * 3 + 1.5, y: 0.02, z: j * 1.5 + 0.75, wuv: 0 });
        const paper = SB.tex(64, 64, (g, w, h) => { PT.vgrad(g, 0, 0, w, h, [[0, '#f8e8b8'], [1, '#e0c890']]); g.fillStyle = '#3a2210'; for (let i = 0; i <= 64; i += 16) { g.fillRect(i - 1, 0, 2, 64); g.fillRect(0, i - 1, 64, 2); } });
        const pw = SB.bucket({ map: paper, emissive: 0x4a3418 });
        for (const [x, z, ry] of [[0, -11, 0], [0, 11, PI], [-11, 0, PI / 2], [11, 0, -PI / 2]]) pw.plane(22, 5.5, { x, y: 2.75, z, ry, rep: [5.5, 1.4] });
        const wd = SB.bucket({});
        for (let i = -11; i <= 11; i += 3.66) for (const [x, z] of [[i, -10.9], [i, 10.9], [-10.9, i], [10.9, i]]) wd.box(0.4, 6, 0.4, { x, y: 3, z, col: '#3a2210' });
        for (const z of [-10.9, 10.9]) wd.box(22.4, 0.5, 0.6, { x: 0, y: 5.8, z, col: '#3a2210' }); for (const x of [-10.9, 10.9]) wd.box(0.6, 0.5, 22.4, { x, y: 5.8, z: 0, col: '#3a2210' });
        for (let i = -9; i <= 9; i += 3) wd.box(0.3, 0.3, 22, { x: i, y: 6.4, z: 0, col: '#2a1808' });
        wd.box(24, 0.2, 24, { x: 0, y: 6.6, z: 0, col: '#1a0e06' });
        // the shrine at the back: a shelf, a scroll, two lanterns
        wd.box(4, 0.2, 0.8, { x: 0, y: 1.6, z: -10.4, col: '#5a3a1a' }); wd.box(4.2, 0.2, 0.9, { x: 0, y: 1.0, z: -10.4, col: '#4a2a10' });
        const scroll = SB.tex(32, 64, (g, w, h) => { g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 4; i++) { g.fillRect(12, 8 + i * 13, 8, 2); g.fillRect(15, 6 + i * 13, 2, 9); g.fillRect(11, 12 + i * 13, 10, 1); } g.fillStyle = '#7a1a1a'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); });
        SB.bucket({ map: scroll, emissive: 0x302010 }).plane(1.1, 2.4, { x: 0, y: 3.2, z: -10.75 });
        const lan = SB.bucket({ unlit: true }); for (const x of [-7, 7, -7, 7]) { } for (const [x, z] of [[-7, -10], [7, -10], [-10, -5], [10, -5], [-10, 5], [10, 5]]) { lan.cyl(0.38, 0.38, 0.75, 8, { x, y: 4.2, z, col: '#ff7a3a' }); wd.cyl(0.4, 0.4, 0.08, 8, { x, y: 4.62, z, col: '#2a1a0a' }); wd.cyl(0.4, 0.4, 0.08, 8, { x, y: 3.8, z, col: '#2a1a0a' }); }
        const ban = SB.tex(32, 64, (g, w, h) => { g.fillStyle = '#8a1a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd040'; g.beginPath(); g.arc(16, 22, 9, 0, PI * 2); g.fill(); g.fillStyle = '#8a1a1a'; g.beginPath(); g.arc(16, 22, 5, 0, PI * 2); g.fill(); g.fillStyle = '#ffd040'; g.fillRect(4, 44, 24, 3); g.fillRect(4, 52, 24, 3); });
        SB.bucket({ map: ban }).plane(1.6, 3.4, { x: -4, y: 3.4, z: -10.8 }); SB.bucket({ map: ban }).plane(1.6, 3.4, { x: 4, y: 3.4, z: -10.8 });
        // students kneeling round the edge (their heads are just poking up)
        SB.crowd(row(8, -8, 8, -8.6, -0.35, 0, 0.2, 7).concat(row(8, -8, 8, 8.6, -0.35, PI, 0.2, 8)).concat(row(5, -6, 6, 0, -0.35, 0, 0.2, 9).map(([x, y, z]) => [-8.6, y, x, PI / 2])), { scale: 0.95, cols: ['#f4f4f0', '#f4f4f0', '#1a1a1a', '#2a3a8a'] });
        SB.drift({ n: 26, box: [-9, 9, 0.5, 5, -9, 9], vy: 0.004, sway: 0.006, col: '#ffb070', size: 0.05, add: true, cell: 1, flick: 1 });
        SB.light({ amb: 0.65, sky: 0xffd8a0, ground: 0x402010, sun: 0.75, sunCol: 0xffc890, dir: [0.2, 1, 0.4], rim: 0.5, rimCol: 0xff8a3a });
        return { wall: 8.2, dustCol: '#c8a070' };
      } },
      { id: 'carpark', n: 'MULTI-STOREY CAR PARK', d: 'Level 3. Pay and display. Fight and destroy.', music: 'fight3', build(SB) {
        SB.sky([[0, '#06080c'], [1, '#2a2a20']]); SB.fog(0x0c0c10, 14, 46);
        SB.band((g, w, h) => { PT.vgrad(g, 0, 0, w, h, [[0, 'rgba(0,0,0,0)'], [0.4, 'rgba(0,0,0,0)'], [0.5, '#2a1a0a'], [1, '#5a3a10']]); PT.skyline(g, w, h, { kind: 'city', seed: 21, layers: [{ col: '#1a1208', hmin: 0.3, hmax: 0.55, bw: 16, lit: 0.3, win: '#ffb050' }] }); }, { r: 60, h: 18, y: 2, rep: 3, ph: 64 });
        const fl = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#6a6a66'; g.fillRect(0, 0, w, h); PT.noise(g, 0, 0, w, h, 0.22, R(9), 1); g.fillStyle = 'rgba(30,20,10,.25)'; g.beginPath(); g.ellipse(40, 20, 10, 5, 0.4, 0, PI * 2); g.fill(); });
        SB.bucket({ map: fl }).plane(60, 60, { rx: -PI / 2, wuv: 4 });
        const ln = SB.bucket({ unlit: true });
        for (let i = -12; i <= 12; i += 3) for (const z of [-7, 7]) ln.box(0.12, 0.02, 4.2, { x: i, y: 0.012, z: z + (z < 0 ? -1.5 : 1.5), col: '#e8e8d8' });
        for (let i = -10; i <= 10; i += 4) ln.box(1.4, 0.02, 0.2, { x: i, y: 0.012, z: 0, col: '#e0c020' });
        const conc = SB.tex(32, 64, (g, w, h) => { g.fillStyle = '#8a8a86'; g.fillRect(0, 0, w, h); PT.noise(g, 0, 0, w, h, 0.2, R(2), 1); for (let y = 40; y < 64; y += 6) { g.fillStyle = (y / 6) % 2 ? '#e0c020' : '#1a1a1a'; g.fillRect(0, y, w, 6); } });
        const pil = SB.bucket({ map: conc });
        for (const x of [-9, -3, 3, 9]) for (const z of [-9.5, 9.5]) pil.box(1, 4, 1, { x, y: 2, z, rep: [1, 1] });
        const pr = SB.bucket({});
        pr.box(40, 0.4, 40, { x: 0, y: 4.2, z: 0, col: '#3a3a3a' }); for (const x of [-9, -3, 3, 9]) pr.box(0.8, 0.6, 30, { x, y: 3.7, z: 0, col: '#5a5a58' });
        pr.box(30, 1.1, 0.3, { x: 0, y: 0.55, z: -13, col: '#6a6a66', grad: [1, 0.6] }); pr.box(30, 1.1, 0.3, { x: 0, y: 0.55, z: 13, col: '#6a6a66', grad: [1, 0.6] });
        const r = R(4), cols = ['#c02020', '#2050c0', '#e0e0e0', '#20a040', '#e0a020', '#1a1a1a', '#8a2ab0'];
        for (let i = 0; i < 8; i++) car(pr, (i % 4 - 1.5) * 3, i < 4 ? -9.2 : 9.2, i < 4 ? 0 : PI, cols[(i * 3) % cols.length], r);
        const lt = SB.bucket({ unlit: true, ref: m => SB.on(t => { m.visible = !((t % 300) < 5 || ((t + 40) % 413) < 3); }) }); for (const z of [-6, 0, 6]) for (const x of [-6, 0, 6]) lt.box(2.4, 0.08, 0.28, { x, y: 3.98, z, col: '#e8f8ff' });
        const ex = signTex(SB, 'EXIT →', '#1a6a2a', '#ffffff', 64, 24); SB.bucket({ map: ex, unlit: true }).plane(1.8, 0.65, { x: -9, y: 3.2, z: -8.98 });
        const lv = signTex(SB, 'LEVEL 3', '#1a2a6a', '#ffffff', 64, 24); SB.bucket({ map: lv, unlit: true }).plane(2, 0.75, { x: 3, y: 3.2, z: -8.98 });
        SB.crowd(row(6, -7, 7, -12.2, 0, 0, 0.4, 3).concat(people(4, 12, 0, 1.5, -1, 1, 0, 5)), { cols: ['#3a3a3a', '#c02a2a', '#2a3a8a', '#e0e0e0', '#2a2a2a'] });
        SB.light({ amb: 0.7, sky: 0xd8f0ff, ground: 0x303028, sun: 0.7, sunCol: 0xe8f8ff, dir: [0.1, 1, 0.2], rim: 0.6, rimCol: 0xffa040 });
        return { wall: 8.2, dustCol: '#8a8a86' };
      } },
      { id: 'pier', n: 'SEASIDE PIER', d: 'Sunset, seagulls and a funfair. Chips after.', music: 'fight4', build(SB) {
        SB.sky([[0, '#2a2a7a'], [0.45, '#c04a7a'], [0.75, '#ff9a4a'], [1, '#ffd88a']], { lift: 0.0 }); SB.fog(0xf09a6a, 30, 110);
        SB.disc('#fff0b0', 10, [0, 12, -140], { glow: 1 });
        SB.band((g, w, h) => { PT.clouds(g, w, h, { n: 16, col: 'rgba(255,190,170,.75)', y0: 0.05, dy: 0.35, s: 18 }); }, { r: 120, h: 50, y: 30, rep: 2, ph: 128 });
        SB.band((g, w, h) => { PT.skyline(g, w, h, { layers: [{ kind: 'hills', col: '#7a4a6a', hmin: 0.15, hmax: 0.45 }] }); PT.skyline(g, w, h, { seed: 31, layers: [{ kind: 'city', col: '#5a3050', hmin: 0.1, hmax: 0.3, bw: 10, lit: 0.2, win: '#ffe0a0' }] }); }, { r: 100, h: 16, y: 2, rep: 2, ph: 64 });
        const wt = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#3a5aa0'; g.fillRect(0, 0, w, h); const r = R(23); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${190 + r() * 60 | 0},${150 + r() * 60 | 0},${0.2 + r() * 0.4})`; g.fillRect(r() * w | 0, r() * h | 0, 4 + r() * 8 | 0, 1); } }, { rep: [40, 40] });
        SB.bucket({ map: wt, emissive: 0x302030, ref: m => SB.on(t => { m.material.map.offset.x = t * 0.0005; m.material.map.offset.y = t * 0.0003; }) }).plane(300, 300, { rx: -PI / 2, y: -3, rep: [40, 40] });
        const pl = SB.tex(64, 64, (g, w, h) => PT.planks(g, w, h, { col: '#9a7a5a', n: 8, seed: 6 }));
        SB.bucket({ map: pl }).box(20, 0.3, 60, { y: -0.15, z: -14, wuv: 3 });
        const pr = SB.bucket({}), em = SB.bucket({ unlit: true });
        for (let z = -40; z <= 10; z += 4) for (const x of [-9.6, 9.6]) { pr.box(0.15, 1.1, 0.15, { x, y: 0.55, z, col: '#f4f4f0' }); pr.cyl(0.25, 0.3, 3.2, 6, { x, y: -1.6, z, col: '#4a3a2a' }); }
        for (const x of [-9.6, 9.6]) { pr.box(0.12, 0.1, 54, { x, y: 1.1, z: -14, col: '#f4f4f0' }); pr.box(0.08, 0.06, 54, { x, y: 0.6, z: -14, col: '#f4f4f0' }); }
        for (let z = -20; z <= 8; z += 7) for (const x of [-9.2, 9.2]) lamp(pr, em, x, z, 3.6, '#fff4c0');
        // the funfair: a helter-skelter and a big wheel
        for (let i = 0; i < 8; i++) pr.cyl(1.6 - i * 0.15, 1.75 - i * 0.15, 1.2, 12, { x: -14, y: 0.6 + i * 1.2, z: -26, col: i % 2 ? '#e01a1a' : '#f4f4f0' }); pr.cone(0.6, 2.2, 10, { x: -14, y: 10.6, z: -26, col: '#e01a1a' });
        const wheel = SB.bucket({ ref: m => { m.position.set(15, 7.4, -33); SB.on(t => { m.rotation.z = t * 0.002; }); } });
        for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; wheel.box(0.12, 6.2, 0.12, { x: Math.sin(a) * 3.1, y: Math.cos(a) * 3.1, z: 0, rz: -a, col: '#f4f4f4' }); wheel.box(0.9, 0.7, 0.7, { x: Math.sin(a) * 6.2, y: Math.cos(a) * 6.2, z: 0, col: ['#e01a1a', '#2a6af0', '#ffd040', '#2aa04a'][i % 4] }); wheel.box(0.1, 3.3, 0.1, { x: Math.sin(a + 0.26) * 6.05, y: Math.cos(a + 0.26) * 6.05, z: 0, rz: -a - PI / 2, col: '#f4f4f4' }); }
        wheel.torus(6.2, 0.08, 4, 24, { col: '#f4f4f4' });
        pr.box(0.4, 9, 0.4, { x: 14, y: 4.5, z: -32, rz: 0.25, col: '#dcdcdc' }); pr.box(0.4, 9, 0.4, { x: 16, y: 4.5, z: -32, rz: -0.25, col: '#dcdcdc' });
        // deckchairs, a bin, a candyfloss stall
        const r = R(8); for (let i = 0; i < 4; i++) { const x = -6 + i * 4, z = -9; pr.box(0.7, 0.05, 1.0, { x, y: 0.45, z, rx: -0.5, col: ['#e01a1a', '#2a6af0', '#2aa04a', '#ffd040'][i] }); pr.box(0.05, 0.5, 0.05, { x: x - 0.33, y: 0.25, z: z + 0.3, col: '#8a6a3a' }); pr.box(0.05, 0.5, 0.05, { x: x + 0.33, y: 0.25, z: z + 0.3, col: '#8a6a3a' }); }
        pr.box(2.4, 2.2, 1.4, { x: 6, y: 1.1, z: -12, col: '#ff8ad0', grad: [1.1, 0.8] }); pr.box(2.8, 0.15, 1.8, { x: 6, y: 2.6, z: -12, col: '#f4f4f4' }); for (let i = 0; i < 6; i++) pr.box(0.47, 0.6, 1.8, { x: 4.85 + i * 0.47, y: 2.9, z: -12, col: i % 2 ? '#ff4aa0' : '#f4f4f4' });
        SB.crowd(row(9, -8.5, 8.5, -10.6, 0, 0, 0.5, 2).concat(row(9, -8.5, 8.5, 10.6, 0, PI, 0.5, 3)), { cols: ['#e01a1a', '#2a6af0', '#ffd040', '#f4f4f4', '#2aa04a', '#ff8ad0', '#1a1a1a'] });
        SB.drift({ n: 8, box: [-20, 20, 7, 12, -30, 0], vy: 0, vx: 0.03, sway: 0.03, col: '#ffffff', size: 0.35, cell: 0, a: 0.9 });
        SB.light({ amb: 0.8, sky: 0xffc0a0, ground: 0x6a3a5a, sun: 0.9, sunCol: 0xffb070, dir: [0, 0.5, -1], rim: 0.9, rimCol: 0xffe0a0 });
        return { wall: 8.8, dustCol: '#c8a888' };
      } },
      { id: 'gym', n: 'SCHOOL GYM', d: 'Sports day, 1999. The whole school came to watch.', music: 'fight2', build(SB) {
        SB.sky([[0, '#d8d8d0'], [1, '#c8c0b0']]); SB.fog(0xd0c8b8, 26, 60);
        const fl = SB.tex(128, 128, (g, w, h) => { PT.planks(g, w, h, { col: '#d8a868', n: 8, seed: 3 }); g.strokeStyle = '#d02020'; g.lineWidth = 2; g.beginPath(); g.arc(64, 64, 30, 0, PI * 2); g.stroke(); g.strokeStyle = '#2a5ad0'; g.strokeRect(4, 4, w - 8, h - 8); g.beginPath(); g.moveTo(64, 0); g.lineTo(64, h); g.stroke(); }, { clamp: true });
        SB.bucket({ map: fl }).plane(26, 26, { rx: -PI / 2 });
        const ol = SB.tex(64, 64, (g, w, h) => PT.planks(g, w, h, { col: '#b88a50', n: 8, seed: 5 }));
        SB.bucket({ map: ol }).plane(80, 80, { rx: -PI / 2, y: -0.04, wuv: 3 });
        const wall = SB.tex(64, 64, (g, w, h) => PT.bricks(g, w, h, { col: '#d8d0b8', mortar: '#a8a090', bw: 16, bh: 8, seed: 7 }));
        const wb = SB.bucket({ map: wall });
        for (const [x, z, w2, d] of [[0, -14, 30, 0.4], [0, 14, 30, 0.4], [-14, 0, 0.4, 30], [14, 0, 0.4, 30]]) wb.box(w2, 9, d, { x, y: 4.5, z, wuv: 3 });
        const pr = SB.bucket({}), em = SB.bucket({ unlit: true });
        // wall bars, ropes, hoops, benches, a stage curtain
        for (let i = 0; i < 6; i++) pr.box(0.15, 5, 0.15, { x: -12 + i * 1.2, y: 2.5, z: -13.6, col: '#a87040' });
        for (let j = 0; j < 12; j++) pr.box(6.3, 0.08, 0.08, { x: -9, y: 0.4 + j * 0.4, z: -13.55, col: '#c89060' });
        for (let i = 0; i < 4; i++) pr.cyl(0.04, 0.04, 7, 5, { x: 6 + i * 1.2, y: 5.5, z: -11, col: '#e8d8a8' });
        pr.box(6, 0.3, 0.3, { x: 7.8, y: 9, z: -11, col: '#5a5a5a' });
        for (const x of [-13.5, 13.5]) { pr.box(0.1, 1.2, 1.8, { x, y: 4.2, z: 0, col: '#f4f4f4' }); pr.torus(0.3, 0.025, 4, 10, { x: x + (x < 0 ? 0.4 : -0.4), y: 3.6, z: 0, rx: PI / 2, col: '#e05010' }); }
        for (const z of [-11.5, 11.5]) pr.box(18, 0.1, 0.5, { x: 0, y: 0.5, z, col: '#3a5aa0' });
        const cur = SB.tex(64, 64, (g, w, h) => { for (let x = 0; x < w; x += 4) { g.fillStyle = (x / 4) % 2 ? '#8a1a2a' : '#a02a3a'; g.fillRect(x, 0, 4, h); } });
        SB.bucket({ map: cur }).plane(12, 5, { x: 0, y: 4.5, z: 13.75, ry: PI, rep: [3, 1] }); pr.box(13, 1.4, 1.2, { x: 0, y: 0.7, z: 13.2, col: '#6a4a2a' });
        const sd = signTex(SB, 'SPORTS DAY 1999', '#f4f4f0', '#2a5ad0', 128, 24); SB.bucket({ map: sd, unlit: true }).plane(8, 1.5, { x: 0, y: 7.4, z: -13.75 });
        for (const z of [-13.7]) for (let i = 0; i < 5; i++) em.box(2.2, 1.4, 0.05, { x: -10 + i * 5, y: 7.6, z: 13.75, col: '#e8f4ff' });
        for (let i = -9; i <= 9; i += 4.5) em.box(3, 0.1, 0.4, { x: i, y: 8.9, z: 0, col: '#f8f8ff' });
        pr.box(30, 0.3, 30, { x: 0, y: 9.1, z: 0, col: '#9a9a8a' });
        SB.crowd(row(12, -9, 9, -11.6, 0.15, 0, 0.3, 4).concat(row(12, -9, 9, 11.6, 0.15, PI, 0.3, 5)), { scale: 0.8, cols: ['#3a3a8a', '#3a3a8a', '#f4f4f4', '#9a1a1a', '#3a3a8a', '#5a5a5a'] });
        SB.light({ amb: 0.95, sky: 0xffffff, ground: 0x8a7050, sun: 0.6, sunCol: 0xfff8e0, dir: [0.2, 1, 0.3], rim: 0.3 });
        return { wall: 8.5, dustCol: '#d8c8a8' };
      } },
      { id: 'space', n: 'ORBITAL STATION 9', d: 'Two hundred miles up. Try not to break the window.', music: 'fight3', build(SB) {
        SB.sky([[0, '#000004'], [1, '#05081a']]); SB.stars(260, { size: 1.5 }); SB.fog(0x05081a, 30, 140);
        // the Earth, big in the window
        const earth = SB.tex(128, 64, (g, w, h) => { g.fillStyle = '#1a4ab0'; g.fillRect(0, 0, w, h); const r = R(41); g.fillStyle = '#3a8a3a'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * w, 8 + r() * (h - 16), 6 + r() * 14, 3 + r() * 8, r() * 3, 0, PI * 2); g.fill(); } g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 10, 1 + r() * 2, 0, 0, PI * 2); g.fill(); } g.fillStyle = '#f4f8ff'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); });
        SB.bucket({ map: earth, emissive: 0x101830, ref: m => SB.on(t => { m.rotation.y = t * 0.0004; }) }).ball(40, 24, 16, { x: 0, y: -14, z: -95 });
        const fl = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#4a4e58'; g.fillRect(0, 0, w, h); for (const [x, y] of [[0, 0], [32, 0], [0, 32], [32, 32]]) { PT.vgrad(g, x + 1, y + 1, 30, 30, [[0, '#5e626e'], [1, '#464a54']]); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 3, y + 3, 2, 2); g.fillRect(x + 27, y + 3, 2, 2); g.fillRect(x + 3, y + 27, 2, 2); g.fillRect(x + 27, y + 27, 2, 2); } g.fillStyle = '#2a2c34'; g.fillRect(0, 31, w, 2); g.fillRect(31, 0, 2, h); g.fillStyle = 'rgba(255,200,40,.6)'; g.fillRect(14, 14, 4, 4); });
        SB.bucket({ map: fl }).plane(30, 30, { rx: -PI / 2, wuv: 2 });
        const wl = SB.tex(64, 64, (g, w, h) => { PT.metal(g, w, h, { col: '#8a909a', n: 2, rivets: true }); g.fillStyle = '#2a2a30'; g.fillRect(0, 40, w, 6); g.fillStyle = '#e0c020'; for (let x = 0; x < w; x += 8) g.fillRect(x, 41, 4, 4); });
        const wb = SB.bucket({ map: wl });
        wb.box(30, 8, 0.4, { x: 0, y: 4, z: 12, wuv: 4 }); wb.box(0.4, 8, 24, { x: -12, y: 4, z: 0, wuv: 4 }); wb.box(0.4, 8, 24, { x: 12, y: 4, z: 0, wuv: 4 });
        wb.box(30, 1.5, 0.6, { x: 0, y: 0.75, z: -12, wuv: 4 }); wb.box(30, 1.2, 0.6, { x: 0, y: 7.4, z: -12, wuv: 4 });
        const pr = SB.bucket({}), em = SB.bucket({ unlit: true });
        for (let x = -12; x <= 12; x += 4) pr.box(0.4, 6, 0.4, { x, y: 4, z: -12, col: '#5a6070' });
        pr.box(30, 0.4, 30, { x: 0, y: 8.2, z: 0, col: '#3a3e48' });
        for (const x of [-11, 11]) for (let z = -8; z <= 8; z += 4) { pr.box(1.2, 1.4, 2.2, { x, y: 0.7, z, col: '#4a505a', grad: [1.2, 0.7] }); em.box(0.05, 0.6, 1.6, { x: x + (x < 0 ? 0.62 : -0.62), y: 1.1, z, col: ['#2af07a', '#2a9aff', '#ff4a2a'][Math.abs(z) % 3] }); }
        for (let i = 0; i < 3; i++) pr.cyl(0.18, 0.18, 24, 8, { x: -11.4, y: 5.4 + i * 0.5, z: 0, rx: PI / 2, col: ['#c8a020', '#8a8a8a', '#a02a2a'][i] });
        const lt = SB.bucket({ unlit: true, ref: m => SB.on(t => { m.material.color.setHSL(0.6, 0.5, 0.6 + Math.sin(t * 0.05) * 0.2); }) }); for (let x = -9; x <= 9; x += 6) lt.box(2, 0.1, 0.5, { x, y: 7.95, z: 0, col: '#ffffff' });
        SB.crowd(row(5, -10, -4, 9, 0, PI, 0.5, 6), { cols: ['#f4f4f4', '#f08a1a', '#f4f4f4'], skins: ['#c8d0d8'] });
        SB.drift({ n: 40, box: [-12, 12, 0, 8, -12, 12], vy: 0.002, sway: 0.004, col: '#9ad0ff', size: 0.04, add: true, cell: 1 });
        SB.light({ amb: 0.7, sky: 0xa0c8ff, ground: 0x202838, sun: 0.85, sunCol: 0xffffff, dir: [-0.3, 0.6, -1], rim: 0.9, rimCol: 0x4a9aff });
        return { wall: 8.5, dustCol: '#8a90a0' };
      } },
      { id: 'temple', n: 'JUNGLE TEMPLE', d: 'Ancient stones, a waterfall and very loud birds.', music: 'fight4', build(SB) {
        SB.sky([[0, '#3a8ac8'], [0.6, '#9ad0e0'], [1, '#c8e8c8']]); SB.fog(0x8ab89a, 16, 70);
        SB.band((g, w, h) => PT.skyline(g, w, h, { layers: [{ kind: 'trees', col: '#2a5a3a', hmin: 0.4, hmax: 0.9 }, { kind: 'trees', col: '#1a3a22', hmin: 0.2, hmax: 0.55 }] }), { r: 60, h: 22, y: 6, rep: 3, ph: 128 });
        const st = SB.tex(64, 64, (g, w, h) => { PT.stone(g, w, h, { col: '#8a8a70', rows: 4, seed: 3 }); const r = R(5); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,${120 + r() * 60 | 0},40,${0.2 + r() * 0.3})`; g.fillRect(r() * w | 0, r() * h | 0, 3 + r() * 5 | 0, 2); } });
        SB.bucket({ map: st }).plane(60, 60, { rx: -PI / 2, wuv: 3 });
        const sb = SB.bucket({ map: st });
        for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9], [-9, 0], [9, 0]]) { sb.box(1.4, 5, 1.4, { x, y: 2.5, z, wuv: 2 }); sb.box(2, 0.5, 2, { x, y: 5.2, z, wuv: 2 }); }
        for (let i = 0; i < 5; i++) sb.box(16 - i * 2.6, 1.2, 4 - i * 0.6, { x: 0, y: 0.6 + i * 1.2, z: -16 - i * 0.8, wuv: 2 });
        sb.box(4, 4, 3, { x: 0, y: 8, z: -19.5, wuv: 2 });
        const pr = SB.bucket({}), r = R(13);
        // a big stone head
        pr.box(3, 3.4, 2.6, { x: 13, y: 1.7, z: -14, col: '#7a7a62', grad: [1, 0.6] }); pr.box(3.2, 0.6, 2.8, { x: 13, y: 3.6, z: -14, col: '#6a6a52' }); pr.box(0.6, 1.2, 0.5, { x: 13, y: 1.8, z: -12.6, col: '#5a5a48' }); pr.box(2, 0.3, 0.2, { x: 13, y: 0.8, z: -12.68, col: '#2a2a20' }); for (const s of [-1, 1]) pr.box(0.6, 0.3, 0.2, { x: 13 + s * 0.8, y: 2.6, z: -12.68, col: '#2a2a20' });
        for (let i = 0; i < 14; i++) tree(pr, (r() < 0.5 ? -1 : 1) * (13 + r() * 9), -20 + r() * 34, 5 + r() * 6, '#2a7a3a', r);
        for (let i = 0; i < 6; i++) palm(pr, (i % 2 ? -1 : 1) * (11 + r() * 3), -8 + i * 3, 5 + r() * 2);
        for (let i = 0; i < 30; i++) pr.cone(0.4 + r() * 0.5, 0.8 + r() * 0.8, 5, { x: (r() < 0.5 ? -1 : 1) * (9.6 + r() * 2), y: 0.4, z: -12 + r() * 24, col: shade('#3a9a3a', 0.7 + r() * 0.5) });
        const fallT = SB.tex(32, 64, (g, w, h) => { g.fillStyle = '#cfefff'; g.fillRect(0, 0, w, h); const r2 = R(29); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,170,220,${0.2 + r2() * 0.5})`; g.fillRect(r2() * 32 | 0, r2() * 64 | 0, 1 + r2() * 3 | 0, 8 + r2() * 20 | 0); } }, { rep: [2, 3] });
        SB.bucket({ map: fallT, unlit: true, ref: m => SB.on(t => { m.material.map.offset.y = t * 0.02; }) }).plane(6, 16, { x: -16, y: 6, z: -22, rep: [2, 3] });
        SB.drift({ n: 30, box: [-10, 10, 0.5, 5, -10, 10], vy: 0.003, sway: 0.01, col: '#e0ff6a', size: 0.06, add: true, cell: 1, flick: 1 });
        SB.drift({ n: 20, box: [-20, 0, -1, 2, -24, -20], vy: 0.04, sway: 0.02, col: '#ffffff', size: 0.5, cell: 3, a: 0.4 });
        SB.crowd(people(6, 0, -14, 1.5, -1, 1, 3.6, 3, 0), { scale: 0.9, cols: ['#c84a1a', '#e0a020', '#f4f4f0'], skins: ['#a86a3a', '#8a5a2a'] });
        SB.light({ amb: 0.85, sky: 0xe0ffd8, ground: 0x3a5a2a, sun: 0.85, sunCol: 0xfff0c0, dir: [0.4, 1, 0.3], rim: 0.5, rimCol: 0xc0ff9a });
        return { wall: 8.4, dustCol: '#a8a888' };
      } },
      { id: 'tower', n: 'TEKNO TOWER', d: 'The very top. Storm clouds. A throne. The King.', music: 'boss', boss: 1, lock: 1, build(SB) {
        SB.sky([[0, '#05020a'], [0.6, '#2a0a1a'], [1, '#6a1a1a']]); SB.fog(0x2a0610, 14, 60);
        SB.band((g, w, h) => PT.clouds(g, w, h, { n: 22, col: 'rgba(60,20,40,.85)', y0: 0.1, dy: 0.6, s: 26 }), { r: 100, h: 60, y: 20, rep: 2, ph: 128 });
        SB.band((g, w, h) => PT.skyline(g, w, h, { kind: 'city', layers: [{ col: '#1a0a12', hmin: 0.1, hmax: 0.4, bw: 10, lit: 0.3, win: '#ff7a3a' }] }), { r: 90, h: 30, y: -14, rep: 3, ph: 128 });
        const fl = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#2e2e38'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a22'; for (let i = 0; i < 64; i += 8) { g.fillRect(i, 0, 1, 64); g.fillRect(0, i, 64, 1); } g.fillStyle = '#4a4a5a'; for (let i = 4; i < 64; i += 16) for (let j = 4; j < 64; j += 16) g.fillRect(i, j, 2, 2); });
        SB.bucket({ map: fl }).cyl(11, 11, 0.6, 32, { y: -0.3, wuv: 3 });
        const em = SB.bucket({ unlit: true, ref: m => SB.on(t => { m.material.color.setRGB(1, 0.25 + Math.sin(t * 0.06) * 0.15, 0.1); }) });
        em.torus(4.4, 0.06, 4, 40, { y: 0.02, rx: -PI / 2 }); em.torus(10.9, 0.12, 4, 48, { y: 0.02, rx: -PI / 2 });
        const pr = SB.bucket({});
        pr.cyl(11.4, 9, 30, 32, { y: -15.6, col: '#1a1a24', grad: [1, 0.3] });
        for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, x = Math.sin(a) * 10, z = Math.cos(a) * 10; pr.box(1, 8, 1, { x, y: 4, z, ry: a, col: '#4a4a5a', grad: [1.2, 0.6] }); pr.cone(0.8, 1.5, 4, { x, y: 8.75, z, ry: a + PI / 4, col: '#d0a020' }); em.box(1.05, 0.3, 1.05, { x, y: 2 + (i % 3), z, ry: a }); }
        // the throne
        pr.box(2.6, 0.6, 2, { x: 0, y: 0.3, z: -9, col: '#5a1010' }); pr.box(2.4, 4.4, 0.5, { x: 0, y: 2.6, z: -9.8, col: '#d0a020', grad: [1.2, 0.7] }); pr.box(2.0, 0.9, 1.6, { x: 0, y: 1.05, z: -9.1, col: '#8a1010' }); for (const s of [-1, 1]) pr.box(0.3, 1.0, 1.6, { x: s * 1.15, y: 1.2, z: -9.1, col: '#d0a020' }); pr.cone(0.4, 0.9, 4, { x: 0, y: 5.2, z: -9.8, col: '#ffd040' });
        const flash = SB.bucket({ unlit: true, add: true, ref: m => SB.on(t => { const k = (t % 400); m.visible = k < 6 || (k > 10 && k < 14); }) }); flash.plane(200, 80, { y: 30, z: -90, col: '#c8b8ff' });
        SB.crowd(people(14, 0, 0, 10.4, -2.2, 2.2, 0, 7), { scale: 1.05, cols: ['#1a1a1a', '#2a2a2a', '#d0a020'], skins: ['#3a3a3a'] });
        SB.drift({ n: 50, box: [-12, 12, 0, 10, -12, 12], vy: 0.03, sway: 0.02, col: '#ff6a2a', size: 0.08, add: true, cell: 1, flick: 1 });
        SB.light({ amb: 0.6, sky: 0xff8a8a, ground: 0x200810, sun: 0.85, sunCol: 0xffc8a0, dir: [0.3, 1, 0.6], rim: 1.0, rimCol: 0xff3a1a });
        return { wall: 8.6, dustCol: '#5a4a50' };
      } },
      { id: 'bedroom', n: 'BEDROOM FLOOR', d: 'Fighting on Jack\'s carpet. Everything is ENORMOUS.', music: 'fight1', lock: 'surv', build(SB) {
        SB.sky([[0, '#5a6a8a'], [1, '#8a7a6a']]); SB.fog(0x6a5a50, 30, 120);
        const cp = SB.tex(64, 64, (g, w, h) => { g.fillStyle = '#5a6aa0'; g.fillRect(0, 0, w, h); const r = R(3); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.12})`; g.fillRect(r() * w | 0, r() * h | 0, 1, 1); } g.strokeStyle = 'rgba(255,220,120,.35)'; g.lineWidth = 2; g.strokeRect(6, 6, w - 12, h - 12); });
        SB.bucket({ map: cp }).plane(200, 200, { rx: -PI / 2, wuv: 6 });
        const pr = SB.bucket({}), em = SB.bucket({ unlit: true });
        // a giant puzzle cube, a cartridge, the bed, a console, a can of pop
        const cube = (x, z, s) => { const cs = ['#e01a1a', '#2a6af0', '#ffd040', '#2aa04a', '#f4f4f4', '#f08a1a']; pr.box(s, s, s, { x, y: s / 2, z, col: '#111' }); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { pr.box(s * 0.3, s * 0.3, 0.05, { x: x - s / 3 + i * s / 3, y: s / 6 + j * s / 3, z: z + s / 2 + 0.03, col: cs[(i + j * 2) % 6] }); pr.box(0.05, s * 0.3, s * 0.3, { x: x - s / 2 - 0.03, y: s / 6 + j * s / 3, z: z - s / 3 + i * s / 3, col: cs[(i * 2 + j + 1) % 6] }); pr.box(s * 0.3, 0.05, s * 0.3, { x: x - s / 3 + i * s / 3, y: s + 0.03, z: z - s / 3 + j * s / 3, col: cs[(i + j + 2) % 6] }); } };
        cube(-14, -16, 7);
        pr.box(14, 2, 10, { x: 16, y: 1, z: -18, ry: 0.3, col: '#3a3a3a', grad: [1.1, 0.7] }); pr.box(12, 0.4, 8, { x: 16, y: 2.2, z: -18, ry: 0.3, col: '#2a2a2a' }); pr.box(3, 0.6, 2, { x: 12, y: 2.3, z: -14.5, ry: 0.3, col: '#c01a1a' }); pr.cyl(1, 1, 0.5, 12, { x: 19, y: 2.3, z: -16, col: '#5a5a5a' });
        pr.box(9, 11, 2, { x: -2, y: 5.5, z: -26, rx: -0.15, col: '#7a7a7a', grad: [1.1, 0.75] }); pr.box(7, 4, 0.3, { x: -2, y: 8, z: -24.9, rx: -0.15, col: '#c8c8b8' });
        pr.box(60, 9, 22, { x: 0, y: 4.5, z: 30, col: '#2a5aa0', grad: [1.15, 0.6] }); pr.box(60, 2, 24, { x: 0, y: 9.5, z: 30, col: '#f4f0e0' });
        pr.cyl(2.2, 2.2, 7, 16, { x: 16, y: 3.5, z: 10, col: '#c01a1a', grad: [1.2, 0.8] }); pr.cyl(2.15, 2.15, 0.2, 16, { x: 16, y: 7.1, z: 10, col: '#c8c8c8' });
        pr.box(0.6, 26, 60, { x: -36, y: 13, z: 0, col: '#d8c890' }); pr.box(12, 16, 0.3, { x: -35.6, y: 14, z: -6, ry: PI / 2, col: '#1a2a6a' }); em.box(8, 10, 0.1, { x: -35.4, y: 14, z: -6, ry: PI / 2, col: '#3a6ad0' });
        em.ball(1.6, 10, 8, { x: 22, y: 30, z: -30, col: '#fff0c0' });
        SB.drift({ n: 40, box: [-14, 14, 0.2, 9, -14, 14], vy: -0.002, sway: 0.008, col: '#fff4d0', size: 0.06, a: 0.6, cell: 1 });
        SB.light({ amb: 0.8, sky: 0xffe8c8, ground: 0x404060, sun: 0.85, sunCol: 0xfff0c0, dir: [0.6, 1, -0.6], rim: 0.5, rimCol: 0xa0c0ff });
        return { wall: 9, dustCol: '#7a8ab0' };
      } },
    ];
    // ---------------------------------------------------------------- the tunes (original: thumping late-90s arcade techno)
    const DR = { four: 'o.x.o.x.o.x.o.xx', brk: 'o.x.o.xoo.x.o.x.', half: 'o...x...o...x...', none: '' };
    const music = {
      title: { bpm: 118, wave: 'sawtooth', vol: 0.035, lead: mel('E5 - - D5 C5 - B4 - A4 - - - . . C5 D5 E5 - G5 - F5 - E5 - D5 - - - . . . . E5 - - D5 C5 - B4 - A4 - - - . . A4 B4 C5 - E5 - D5 - C5 - B4 - - - G#4 - - -'), bass: mel('A2 . . . A2 . . . F2 . . . F2 . . . G2 . . . G2 . . . E2 . . . E2 . . . A2 . . . A2 . . . F2 . . . F2 . . . D2 . . . D2 . . . E2 . . . E2 . . .'), drums: DR.half },
      select: { bpm: 126, wave: 'triangle', vol: 0.07, lead: mel('A4 . C5 . E5 . C5 . D5 . F5 . A5 . F5 . G5 . E5 . C5 . E5 . D5 . B4 . G4 . B4 .'), bass: mel('A2 . . . A3 . . . D2 . . . D3 . . . C2 . . . C3 . . . G2 . . . G3 . . .'), drums: 'o...x...o.o.x...' },
      vs: { bpm: 140, wave: 'sawtooth', vol: 0.04, lead: mel('A4 - - - . . A4 - G4 - - - . . E4 - F4 - - - . . G4 - E4 - - - - - - -'), bass: mel('A1 . A1 . A2 . A1 . A1 . A1 . A2 . A1 . F1 . F1 . F2 . F1 . E1 . E1 . E2 . E1 .'), drums: 'o.o.x.o.o.o.x.oo' },
      story: { bpm: 90, wave: 'triangle', vol: 0.07, lead: mel('E5 - - - D5 - C5 - D5 - - - . . . . C5 - - - B4 - A4 - B4 - - - . . . .'), bass: mel('A2 . . . . . . . F2 . . . . . . . C2 . . . . . . . G2 . . . . . . .') },
      fight1: { bpm: 150, wave: 'sawtooth', vol: 0.035, lead: mel('A4 . A4 C5 . A4 D5 . C5 . A4 . G4 . A4 . A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . C5 . A4 . A4 C5 . A4 D5 . C5 . A4 . G4 . A4 . E5 . D5 . C5 . B4 . G4 . A4 - - - . . . .'), bass: mel('A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 . F1 . F2 . F1 . F2 . G1 . G2 . G1 . G2 .'), drums: DR.four },
      fight2: { bpm: 140, wave: 'sawtooth', vol: 0.032, lead: mel('D5 . F5 . G5 . A5 - - . G5 . F5 . D5 . C5 . D5 . F5 . G5 - - . . . . . D5 . F5 . G5 . A5 - - . C6 . A5 . G5 . F5 . G5 - - - - . . .'), bass: mel('D2 . D2 D3 . D2 C2 . D2 . D2 D3 . D2 A1 . Bb1 . Bb1 Bb2 . Bb1 A1 . C2 . C2 C3 . C2 D2 .'), drums: DR.brk },
      fight3: { bpm: 156, wave: 'sawtooth', vol: 0.03, lead: mel('E5 . E5 . G5 . E5 . A5 . G5 . E5 . D5 . E5 . E5 . G5 . B5 . A5 - G5 - E5 - - - E5 . E5 . G5 . E5 . A5 . B5 . C6 . B5 . A5 . G5 . A5 . F#5 . E5 - - - . . . .'), bass: mel('E2 . E2 E3 E2 . E2 E3 C2 . C2 C3 D2 . D2 D3'), drums: DR.four },
      fight4: { bpm: 136, wave: 'sawtooth', vol: 0.032, lead: mel('G5 . D5 . B4 . D5 . G5 . A5 . B5 - - - A5 . G5 . E5 . G5 . A5 . G5 . E5 . D5 - - - G5 . D5 . B4 . D5 . G5 . A5 . B5 - - - D6 . B5 . C6 - A5 . B5 . G5 . A5 . G5 - - -'), bass: mel('G2 . . G2 . . G3 . C2 . . C2 . . C3 . E2 . . E2 . . E3 . D2 . . D2 . . D3 .'), drums: 'o.x.o.xxo.x.oox.' },
      boss: { bpm: 158, wave: 'sawtooth', vol: 0.04, lead: mel('C5 . C5 . Eb5 . C5 . G5 . F5 . Eb5 . D5 . C5 . C5 . Eb5 . G5 . Ab5 - G5 - F5 - Eb5 - C5 . C5 . Eb5 . C5 . G5 . F5 . Eb5 . D5 . Eb5 . F5 . G5 . Ab5 . B5 - - - C6 - - -'), bass: mel('C2 C2 . C3 C2 C2 . C3 Ab1 Ab1 . Ab2 G1 G1 . G2'), drums: 'oox.o.x.oox.o.xx' },
      win: { bpm: 140, wave: 'sawtooth', vol: 0.035, lead: mel('C5 E5 G5 C6 - - G5 - A5 - G5 - E5 - - - F5 A5 C6 F6 - - C6 - D6 - C6 - G5 - - -'), bass: mel('C3 . G2 . C3 . G2 . C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . B2 .'), drums: DR.half },
      ending: { bpm: 84, wave: 'triangle', vol: 0.08, lead: mel('C5 - - - E5 - G5 - A5 - - - G5 - - - F5 - - - E5 - D5 - E5 - - - - - - - C5 - - - E5 - G5 - C6 - - - B5 - - - A5 - - - G5 - F5 - G5 - - - - - - -'), bass: mel('C3 . . . G2 . . . A2 . . . E2 . . . F2 . . . C2 . . . G2 . . . G2 . . .') },
    };
    const how = K => [
      ['THE BUTTONS', `!${K.label('a')} LEFT PUNCH   ${K.label('x')} RIGHT PUNCH`, `!${K.label('b')} LEFT KICK    ${K.label('y')} RIGHT KICK`, 'MOVE WITH THE ARROWS. FORWARD = TOWARDS THEM.', 'TAP FORWARD TWICE TO DASH IN (BACK TWICE TO HOP AWAY)', 'HOLD UP TO JUMP. PUNCH OR KICK IN THE AIR.', 'TAP UP OR DOWN QUICKLY TO SIDESTEP INTO OR OUT OF', 'THE SCREEN: STRAIGHT ATTACKS WHOOSH RIGHT PAST YOU.', `PAUSE: START (MOVE LISTS ARE IN THE PAUSE MENU)`],
      ['GUARDING', '!STANDING STILL OR HOLDING BACK GUARDS HIGH + MID.', '!HOLD DOWN TO CROUCH: IT GUARDS LOWS AND DUCKS HIGHS.', 'MID ATTACKS HIT CROUCHERS. LOW ATTACKS HIT STANDERS.', 'SO: WATCH THEIR FEET, AND MIX IT UP YOURSELF.', '!PARRY: TAP BACK JUST AS A HIGH OR MID HIT LANDS.', 'THEY STAGGER: HIT THEM WHILE THEY ARE OPEN!', 'COUNTER HIT: HIT THEM WHILE THEY START AN ATTACK', 'FOR EXTRA DAMAGE.'],
      ['THROWS AND COMBOS', `!${K.label('a')}+${K.label('b')} OR ${K.label('x')}+${K.label('y')} TOGETHER: THROW`, 'EVERY FIGHTER THROWS IN THEIR OWN WAY.', '!BREAK A THROW: PRESS THE SAME BUTTONS AS IT GRABS.', 'YOU CAN\'T THROW SOMEBODY WHO IS CROUCHING.', `!↓+${K.label('x')} UPPERCUT LAUNCHES THEM INTO THE AIR:`, 'HIT THEM AGAIN BEFORE THEY LAND = A JUGGLE!', `STRINGS: ${K.label('a')},${K.label('a')},${K.label('x')} AND MORE. PRESS THE NEXT`, 'BUTTON JUST AS THE LAST HIT LANDS.'],
      ['SPECIAL MOVES', `!→+${K.label('x')}  ←+${K.label('y')}  →+${K.label('y')}`, 'EVERY FIGHTER HAS THREE SPECIALS ON THOSE.', 'SEE THEM ON THE SELECT SCREEN AND IN THE', 'PAUSE MENU MOVE LIST (YELLOW).', 'SOME SPECIALS GLOW: THOSE CANNOT BE GUARDED.', 'GET OUT OF THE WAY!', '', '!WIN ARCADE TO UNLOCK FIGHTERS AND COSTUMES.'],
    ];
    const pickN = (n, ex) => { const ids = [...Array(roster.length).keys()].filter(i => i !== ex); for (let i = ids.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; } return ids.slice(0, n); };
    return {
      title: 'TEKNO FIST', sub: 'THE TEKNO KING\'S TOURNAMENT', copy: '(C) 1999 BIG BANG SOFTWARE', licence: 'LICENSED BY PLAYSPACE ENTERTAINMENT', look: 'ps1', fov: 42, logoGrad: ['#fff8d0', '#ffd040', '#ff8a10', '#a02000'], logoDeep: '#4a0a00', logoSize: 44, panelEdge: '#c08a20',
      roster, hidden, boss, stages, base, jumps, throwBtns: [['a', 'b'], ['x', 'y']], music, how, dbgName: 'tekno', masterName: 'TEKNO MASTER', defaultName: 'JACK',
      hitCol: '#ffe080', guardCol: '#80c0ff', barCol: '#ffd84a', trailCol: '#ffd27a', maxScore: 50000, rate: 400, arcadeLen: 5, selCols: 6, hiTop: 26000,
      perfectSecret: 'rm.fight.perfect', comboSecret: 'rm.fight.combo', comboSecretN: 8, champSecret: 'rm.fight.champ',
      show: { top: '#05060c', mid: '#1a0a2a', bot: '#3a1010', pool: '#7a4a2a', beam: 'rgba(255,190,120,.35)', dust: '#ffb070', rim: '#ff8a3a', fog: '#0a0608' },
    };
  }

  TV.game('ps.fight', {
    buttons: ['a', 'b', 'x', 'y'],
    help: 'Move: arrows (back guards, tap Up/Down to sidestep, hold Up to jump). Punches: Z / C. Kicks: X / V. Throws: Z+X or C+V. Pause: Enter.',
    three: true,
    make(K) {
      let inner = null;
      const go = () => { if (inner || K.done) return; try { if (!CFG) CFG = build(); inner = window.RmFight.make(K, CFG); } catch (e) { console.error(e); } };
      if (window.RmFight && window.RmFight.v >= 2) go(); else kit.then(go);
      return {
        update(dt) { if (inner) inner.update(dt); },
        draw() { if (inner) inner.draw(); else { K.hud.fillStyle = '#000'; K.hud.fillRect(0, 0, K.W, K.H); K.font.center(K.hud, 'LOADING...', K.W / 2, K.H / 2, '#fff', 1); } },
        end() { if (inner && inner.end) inner.end(); },
      };
    },
  });
})();
