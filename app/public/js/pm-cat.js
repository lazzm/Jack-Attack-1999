/* pm-cat: the PIXEL POST mail-order catalogue (shared by the server, mods/pmx.js, and the pages: js/pm-media.js, js/pm-gl.js).
 * Boxed games you can order with Rupees. JackNet members only; the server takes the Rupees and records the order, and the
 * parcel turns up in Jack's room straight away. A game is only on sale from its 1999 release date (the site's "today",
 * the same day and month as the real one): before that it's in the catalogue as COMING SOON.
 *   id: the Games Cupboard box (js/discs.js BOXES) or 'cart.<game>' for a console cartridge (js/rm-cat.js, if Agent L
 *   marks it with `shop`); price in Rupees; rel 'dd/mm' (1999); tag: 'new' | 'hot' | 'budget' | ''; blurb: Jack's words. */
(function (root) {
  'use strict';
  const ITEMS = [
    { id: 'keepa', title: 'Dungeon Keepa 2', price: 320, rel: '25/06', tag: 'hot', blurb: 'Be the baddie! Dig a dungeon, slap your imps and squash the heroes who come to nick your gold. Evil has never been this much fun.' },
    { id: 'park', title: 'RollerJack Tycoon', price: 280, rel: '12/04', tag: 'hot', blurb: 'Build a theme park and a rollercoaster that goes loop the loop. Then watch the little guests be sick. Brilliant.' },
    { id: 'city', title: 'JackCity 3000', price: 300, rel: '31/01', tag: '', blurb: 'Be the Mayor! Roads, power stations, schools, and a giant monster that knocks it all down. You will be up till 2am.' },
    { id: 'squigs', title: 'Jacks: Armageddon', price: 240, rel: '29/01', tag: '', blurb: 'Little teams of jacks with bazookas, sheep and banana bombs, taking turns. The best game for four people and one mouse.' },
    { id: 'carta', title: 'JackCarta 99', price: 350, rel: '01/10', tag: '', blurb: 'The whole encyclopedia on two CDs. Videos! Sounds! Your homework, done (well, copied out). Mom will say yes to this one.' },
    { id: 'jaquake', title: 'Jaquake (full version)', price: 200, rel: '17/03', tag: 'budget', blurb: 'The scary 3D shooter, all of it, not just the shareware bit. Play it with the lights off. Then turn the lights back on.' },
    { id: 'podracer', title: 'Pod Jack Racer', price: 260, rel: '19/05', tag: 'new', blurb: 'Pods, deserts, 600 mph. The film is out this summer. Practise now so you can tell everyone you could do it in real life.' },
    { id: 'grotlings', title: 'Jacklings', price: 110, rel: '01/04', tag: 'budget', blurb: 'Lead the little guys home before they walk off a cliff. The big red button is the best and worst bit.' },
    { id: 'pinball', title: 'Space Jack Pinball', price: 90, rel: '01/02', tag: 'budget', blurb: 'A whole pinball table in your PC. Tilt it. It tells you off. Tilt it again.' },
    { id: 'boss', title: 'Championship Boss 99/00', price: 290, rel: '03/12', tag: 'new', blurb: 'Be the manager! Buy players, shout at the ref, get sacked in October. The new season, every stat, every club.' },
  ];
  const CART_BASE = 160; // (console cartridges Agent L puts on sale: their own price, or this)
  const DAYMAX = 3;       // orders per member per day
  const md = s => { const [d, m] = String(s).split('/').map(Number); return m * 100 + d; };
  const byId = {}; ITEMS.forEach(x => { byId[x.id] = x; });
  const C = {
    ITEMS, byId, DAYMAX, CART_BASE, md,
    out: (x, todayMd) => !x.rel || md(x.rel) <= todayMd,
    // carts from js/rm-cat.js (the browser only; the server reads them too if rm-cat is requireable)
    addCarts(cat) {
      if (!cat || !cat.GAME) return;
      for (const g in cat.GAME) {
        const G = cat.GAME[g], price = G && (G.mail || G.shop); if (!G || !price || byId['cart.' + g]) continue;
        const con = (cat.CONSOLES || {})[G.con] || {}, F = (cat.FIND || {})['cart.' + g] || {};
        const x = { id: 'cart.' + g, cart: g, con: G.con, conName: con.n || G.con, media: con.media || 'cartridge', col: G.col || con.col || '#888', title: (G.title || G.n || g) + ' (' + (con.n || G.con) + ')', price: typeof price === 'number' ? price : CART_BASE, rel: F.from || G.from || con.from || '', tag: 'new', blurb: G.blurb || G.d || 'A game for the telly.' };
        ITEMS.push(x); byId[x.id] = x;
      }
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.PMCat = C;
})(typeof window !== 'undefined' ? window : this);
