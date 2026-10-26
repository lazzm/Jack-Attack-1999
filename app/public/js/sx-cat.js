/* sx-cat: the Great JackNet Hunt's public catalogue, shared by the server (mods/sx.js requires it) and the browser
 * (js/sx.js loads it). Only things it is fine for anyone to read live here: chapter titles, where each key is hidden
 * (roughly), the Golden Bytes' vague hints, the rewards and the Hint Line's rules. The keys themselves, the byte codes
 * and the Hint Line's hints are only ever on the server. */
(function (root) {
  'use strict';
  // the ten chapters: n, title, where the key is hidden, a little icon (drawn by js/sx-hunt.js)
  const CH = [
    { n: 1, t: 'Under the Bonnet', w: 'Hunt HQ (this web site)', ic: 'page' },
    { n: 2, t: 'Shy Files', w: "Jack's hard drive", ic: 'folder' },
    { n: 3, t: 'C:\\> Prompt', w: 'JACK-DOS', ic: 'dos' },
    { n: 4, t: 'The Vault', w: 'The Registry', ic: 'reg' },
    { n: 5, t: 'Dear Diary', w: "Jack's 1999 Calendar", ic: 'cal' },
    { n: 6, t: 'Lights Out', w: "Your bedroom", ic: 'room' },
    { n: 7, t: 'Cheat!', w: 'The JACK ATTACK! magazine', ic: 'mag' },
    { n: 8, t: 'Round the Ring', w: 'The World Wide Web', ic: 'web' },
    { n: 9, t: 'Hold the Line', w: 'The telephone', ic: 'phone' },
    { n: 10, t: 'The Countdown', w: 'Everything you have found', ic: 'disk' },
  ];
  // the Golden Bytes: ten little gold things hidden all over the PC (you need every one for 100%)
  const BYTES = [
    { id: 'glint', n: 'The Glint', h: 'Now and then, something gold glints on the desktop. Be quick.' },
    { id: 'dos', n: 'The Hidden Byte', h: 'One byte only shows itself to a DIR with the right switch, right at the top of C:.' },
    { id: 'robots', n: 'The Robot-Proof Byte', h: 'Even robots are told to keep away from one page on Hunt HQ.' },
    { id: 'reg', n: 'The Byte Drawer', h: 'The Registry has a drawer full of bytes. It is shut.' },
    { id: 'phone', n: 'The Phone Byte', h: 'You can ring a byte. Well, five of them: B-Y-T-E-S.' },
    { id: 'ring', n: 'The Tiniest Link', h: 'One site in the Hunters\' Ring has a link the size of a full stop. Look at the stars.' },
    { id: 'note', n: 'The Logbook Byte', h: 'Jotpad keeps a log if you ask it the old way: four capital letters, with a full stop in front.' },
    { id: 'clock', n: 'The Grumpy Clock', h: 'Click the clock on the taskbar until it gets cross.' },
    { id: 'room', n: 'The Bedroom Byte', h: 'Something gold is hiding in your bedroom. Somewhere you\'d keep a secret.' },
    { id: 'mag', n: 'The Back Issue Byte', h: 'The very first back issue of JACK ATTACK! has a byte in its cheats.' },
  ];
  const BYTE = {}; BYTES.forEach(b => { BYTE[b.id] = b; });
  // JackLoot exclusives (never random): [id, name, rarity, type, art, flavour, extra]
  const LOOT = [
    ['badge.sx_hunter', 'Great Hunt Finisher', 3, 'badge', ['#0a2a6a', '#ffd400', 'KEY'], 'Found all ten keys of the Great JackNet Hunt in 1999. COUNTDOWN!'],
    ['badge.sx_champ', 'Great Hunt Champion', 4, 'badge', ['#111111', '#ffd400', 'crown'], '100% of the Great JackNet Hunt: every key and every Golden Byte. Very few names wear this.'],
    ['trinket.sx_mdisk', 'The Millennium Disk', 5, 'trinket', ['floppy', '#bfefff'], 'The one and only disk Jack hid at the end of the Great JackNet Hunt. The label says MILLENNIUM - DO NOT FORMAT.', { lim: 999 }],
  ];
  // the Rupees (members only; econ's earn path, daily caps)
  const PAY = { key: 25, byte: 10, done: 250, full: 400 };
  // the Hint Line: three hints a chapter. Hint 1 is free; the others open by themselves after a while, or members can
  // pay a few Rupees to hear one now (the money goes nowhere: it's the phone bill)
  const HINT = { n: 3, wait: [0, 10 * 60, 30 * 60], cost: [0, 10, 25] };
  const PHONE = { hint: '0909 879 0486', hintRaw: '09098790486', hunters: '4868377' };
  const C = { CH, BYTES, BYTE, LOOT, PAY, HINT, PHONE, NCH: CH.length, NBYTE: BYTES.length };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.SxCat = C;
})(this);
