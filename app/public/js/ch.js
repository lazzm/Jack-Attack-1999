/* ch: MOM'S JOBS, for real. Mom's chores aren't programs on the PC any more: they're things you do with your own hands in
 * the rooms of Jack's 3D house (tidy your room, make the bed, the washing up, hoover the lounge...), for Rupees that the
 * server pays (mods/ch.js; the catalogue is js/ch-cat.js). Mom's list is stuck on the fridge, with a copy on Jack's wall.
 * This file is the always-loaded bit: it loads the rest when the house is built (js/ch-core.js, then a file per part of the
 * house: js/ch-bed.js, js/ch-kitchen.js, js/ch-lounge.js, js/ch-out.js), and on the PC it leaves a note where the old
 * "Mom's Chores" program used to be (Start > Run "chores" still works: it says where the list went, and stands you up).
 * API for other packs (window.Chores):
 *   Chores.take(id) -> true when a chore handled that click (the house's sink/bin/hoover spots ask first). Ids are the job
 *                     ids in js/ch-cat.js; the house's own names 'bin' (the kitchen bin) and 'washing' are understood too.
 *   Chores.fridgeHTML() -> today's list as an <ol> (for a paper on the fridge door), or '' before it has loaded
 *   Chores.pcNote()     the PC's "where did Mom's list go?" window
 *   Chores.ready        a promise: the chores are built in the house */
(function () {
  'use strict';
  if (window.Chores) return;
  const V = (document.querySelector('script[src*="js/ch.js"]') || {}).src || '';
  const ver = (/[?&]v=([^&]+)/.exec(V) || [])[1] || '';
  const loaded = {};
  const loadJs = src => {
    if (window.Apps && Apps.load) return Apps.load(src);
    return loaded[src] = loaded[src] || new Promise((res, rej) => { const s = document.createElement('script'); s.src = src + (ver ? '?v=' + ver : ''); s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error('load ' + src)); }; document.head.appendChild(s); });
  };
  let core = null, readyRes;
  const ready = new Promise(r => { readyRes = r; });
  const PARTS = { bedroom: ['js/ch-bed.js'], kitchen: ['js/ch-kitchen.js', 'js/ch-out.js'], hall: ['js/ch-lounge.js'], lounge: ['js/ch-lounge.js'], garden: ['js/ch-out.js'], drive: ['js/ch-out.js'] };
  const partP = {};
  function loadCore() {
    if (!core) core = loadJs('js/ch-cat.js').then(() => loadJs('js/ch-core.js')).then(() => { if (!window.ChoreKit) throw new Error('no ChoreKit'); augment(); return window.ChoreKit; }).catch(e => { core = null; throw e; });
    return core;
  }
  function part(rid) {
    const f = PARTS[rid]; if (!f) return Promise.resolve();
    return partP[rid] = partP[rid] || loadCore().then(() => f.reduce((p, src) => p.then(() => loadJs(src)), Promise.resolve())).then(() => { if (window.ChoreKit) ChoreKit.built(rid); }).catch(e => { delete partP[rid]; console.warn('chores', rid, e && e.message); });
  }
  // the Pocket Money table on the PC learns the new jobs too (the Hall of Fame lists them)
  function augment() { try { if (window.ChoreCat && window.GrindCat) ChoreCat.augment(GrindCat); } catch (e) {} }
  let augT = 0; const augLoop = () => { augment(); if (!(window.GrindCat && window.ChoreCat && GrindCat.JOBS.bed) && augT++ < 40) setTimeout(augLoop, 3000); };

  // ---- the house: build our bits into each room as it is built
  function hook() {
    const H = window.House; if (!H || !H.ok || !window.Room) return false;
    H.on('built', rid => { if (PARTS[rid]) part(rid); });
    for (const rid in PARTS) if (H.ROOMS[rid] && H.ROOMS[rid].built) part(rid);
    // (Jack's room is built the moment the house is on show, or when you stand up from the PC)
    H.on('start', () => part('bedroom')); H.on('stood', () => part('bedroom'));
    const wait = () => { if (partP.bedroom) partP.bedroom.then(() => readyRes(window.ChoreKit)); else setTimeout(wait, 1500); }; wait();
    return true;
  }
  if (!hook()) document.addEventListener('DOMContentLoaded', hook);

  // ---- the PC: where the old program was, a note saying where the list went
  const ICO = '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="21" height="27" fill="#fffbe0" stroke="#7a6a3a"/><path d="M5 3h21v4H5z" fill="#ffe680" stroke="#7a6a3a"/><path d="M9 12h3M9 17h3M9 22h3" stroke="#e10600" stroke-width="1.6"/><path d="M14 12h9M14 17h8M14 22h9M14 26h6" stroke="#203080" stroke-width="1.1"/><path d="M8.6 11.6l1 1 2-2.4" stroke="#0a8a2a" stroke-width="1.4" fill="none"/><circle cx="15.5" cy="3.8" r="3.2" fill="#e10600" stroke="#600"/><circle cx="14.6" cy="2.9" r="1" fill="#fff" opacity=".8"/></svg>';
  let noteW = null;
  function pcNote() {
    const A = window.Apps; if (!A || !A.win) return null;
    if (noteW && !noteW.closed) { noteW.restore(); return noteW; }
    const canStand = !!(window.House && House.canStand && House.canStand());
    const b = document.createElement('div'); b.className = 'ch-pc';
    b.innerHTML = `<div class="grc-note ch-pcnote"><h3>Jack -</h3><p>I've stuck your list of jobs on the <b>FRIDGE</b> (and there's a copy on your bedroom wall, by the door).</p><p>Get up off that computer and do them for real. Not on the screen. With your <b>HANDS</b>.</p><p>Pocket money paid when they're done. Love Mom x</p><p class="ch-pcps">P.S. No, the computer can't do them for you. I asked Dad.</p></div>
      <p class="ch-pchow">The jobs are in the house now: ${canStand ? 'press <b>Stand up</b>, walk out of your room and down the stairs to the kitchen.' : 'stand up from the PC (the chair button by the clock, or hold <b>Esc</b>) and look round the house.'} Members get paid in Rupees for every job.</p>
      <div class="row ch-pcrow">${canStand ? '<button type="button" class="btn" data-ch="stand"><b>Stand up</b></button>' : ''}<button type="button" class="btn" data-ch="ok">OK, Mom</button></div>`;
    const w = noteW = A.win("Mom's Chore List", b, { w: 400, icon: (window.Grind && Grind.ICO && Grind.ICO.chores) || ICO, noMax: true, noResize: true });
    b.addEventListener('click', ev => {
      const t = ev.target.closest('[data-ch]'); if (!t) return;
      if (t.dataset.ch === 'stand') { w.close(); setTimeout(() => { try { if (House.canStand()) House.standUp(); } catch (e) {} }, 120); }
      else w.close();
    });
    try { if (window.Apps.secrets && Apps.secrets['ch.moved']) Apps.secret('ch.moved'); } catch (e) {}
    return w;
  }
  function take(id) {
    const map = { bin: 'bins', washing: 'tidy' }; id = map[id] || id;
    if (window.ChoreKit) return ChoreKit.take(id);
    loadCore().then(K => K.take(id)).catch(() => {});
    return false;
  }
  function fridgeHTML() { return window.ChoreKit ? ChoreKit.listHTML() : ''; }
  function door(which) { return !!(window.ChoreKit && ChoreKit.door && ChoreKit.door(which)); } // (the house asks before its front door opens)
  window.Chores = { take, fridgeHTML, pcNote, door, ready, load: loadCore, part, ICO };
  // secrets (ours start 'ch.'), defined early so the Secrets Found count knows them
  const SECRETS = [
    ['ch.moved', 'Gone Analogue', "Look for Mom's Chore List on the PC. It isn't there any more."],
    ['ch.first', 'Good Lad', "Do one of Mom's jobs, for real, round the house."],
    ['ch.all', 'Who Are You and What Have You Done With Jack?', "Do every job on Mom's list in one day."],
    ['ch.gold', 'Gold Star', 'Get a 100% Mom rating on a job.'],
    ['ch.every', 'Jack of All Chores', 'Do every kind of job in the house at least once.'],
    ['ch.cactus', 'Never Give Up', 'Water something that is very, very dead.'],
    ['ch.sock', 'The Sock Monster', 'Find out where the odd socks go.'],
    ['ch.plug', 'PING!', 'Pull the vacuum too far from the socket.'],
    ['ch.purr', 'Fed and Watered', "Feed next door's cat. (It isn't even our cat.)"],
    ['ch.knot', 'Double Knot', 'Tie up a bin bag.'],
    ['ch.rinse', 'Bubble Trouble', 'Fill the sink right to the top with bubbles.'],
    ['ch.ketchup', 'Dad Insists', 'Put the ketchup on the table.'],
    ['ch.list', 'Read the Small Print', "Read Mom's list up close."],
  ];
  const defSecrets = () => { try { for (const [id, n, h] of SECRETS) Apps.defineSecret(id, n, h); } catch (e) {} };
  if (window.Apps && Apps.defineSecret) defSecrets(); else document.addEventListener('DOMContentLoaded', defSecrets);
  window.Chores.SECRETS = SECRETS;
  // the catalogue is small: fetch it soon, so the Hall of Fame on the PC lists the new jobs
  setTimeout(() => { loadJs('js/ch-cat.js').then(augLoop, () => {}); }, 4000);
})();
