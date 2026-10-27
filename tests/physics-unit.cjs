// The house physics solver without WebGL, the DOM or player data: node tests/physics-unit.cjs
// Covers falling/settling, stacking without jitter, tunnelling, tucking the desk chair under the real desk heights,
// the player capsule (push, heavy resist, never trapped), placement queries, tipping off edges, door sweeps, sleep cost.
const assert = require('node:assert/strict');
const P = require('../app/public/js/hs-physics.js');
const FY = 73; // the bedroom floor (y is down)
const box = (hx, hz, h, o) => Object.assign({ t: 'box', x: 0, z: 0, hx, hz, lo: 0, hi: h }, o);
const cyl = (r, lo, hi, o) => Object.assign({ t: 'cyl', x: 0, z: 0, r, lo, hi }, o);
function room(extra) {
  const w = P.create({ floors: { U: FY, G: 353 } });
  const walls = P.wallsFrom([{ x0: -280, z0: -56, x1: 240, z1: 250 }], 40, -400, 400);
  // the real desk: a 3.2 cm top whose underside is 69.8 cm up, the left end board, the drawer unit and the modesty panel
  const desk = [
    { x0: -76, z0: -55, x1: 76, z1: 31, top: 0, bot: 3.2 },
    { x0: -76, z0: -54, x1: -72, z1: 30, top: 2, bot: FY },
    { x0: 38, z0: -52, x1: 74, z1: 29.4, top: 2, bot: FY },
    { x0: -72, z0: -53.4, x1: 38, z1: -52, top: 6, bot: 66 },
  ];
  w.setStatic('U', walls.concat(desk, extra || []));
  return w;
}
function run(w, seconds) { for (let i = 0; i < Math.round(seconds * 60); i++) w.step(1 / 60); }
// The desk chair: castor star, gas column, seat (a support), and a back that swivels with the seat.
const CHAIR = [cyl(31, 0, 9, { player: false }), cyl(4, 9, 37), box(22.5, 21.5, 49, { lo: 36, z: 2, sw: true, top: true }), box(21, 4.5, 89, { lo: 55, z: -23, sw: true })];

// 1. a dropped box falls, bounces a little, settles exactly on the floor and sleeps
{
  const w = room(), b = w.add('crate', { lvl: 'U', x: 0, z: 120, y: FY - 80, parts: [box(10, 10, 20)], mass: 2 });
  w.wake(b); run(w, 3);
  assert.equal(b.y, FY, 'Dropped box did not land exactly on the floor');
  assert.equal(w.awake.size, 0, 'Settled box never went to sleep');
}
// 2. stacking: three boxes dropped on top of each other come to rest stacked, then stay perfectly still
{
  const w = room(), bs = [0, 1, 2].map(i => w.add('s' + i, { lvl: 'U', x: i * 1.5, z: 150, y: FY - 30 - i * 30, parts: [box(12, 9, 8)], mass: 1 }));
  bs.forEach(b => w.wake(b)); run(w, 4);
  assert.equal(bs[0].y, FY); assert(Math.abs(bs[1].y - (FY - 8)) < 1e-9, 'Second box is not on the first'); assert(Math.abs(bs[2].y - (FY - 16)) < 1e-9, 'Third box is not on the second');
  const pose = bs.map(b => [b.x, b.y, b.z, b.ry].join());
  run(w, 5); assert.deepEqual(bs.map(b => [b.x, b.y, b.z, b.ry].join()), pose, 'Stack jittered at rest');
  assert.equal(w.awake.size, 0);
}
// 3. no tunnelling: a very fast body stops at a 2 cm partition
{
  const w = room([{ x0: 0, z0: 60, x1: 2, z1: 240, top: -200, bot: FY }]), b = w.add('fast', { lvl: 'U', x: -60, z: 150, y: FY, parts: [box(5, 5, 10)] });
  b.vx = 4000; w.wake(b); run(w, 1);
  assert(b.x <= -5 + 0.05, 'Fast body tunnelled through a thin wall: x=' + b.x);
}
// 4. the chair tucks under the desk: the seat (49 cm) slides under the 69.8 cm desk top; the 89 cm back stops at its front edge
{
  const w = room(), ch = w.add('chair', { lvl: 'U', x: -15, z: 106, y: FY, ry: 180, parts: CHAIR, mass: 9, mu: 0.25, noStack: true, tip: 0 });
  w.tryMove(ch, 0, -140);
  const seat = ch.wp[2], back = ch.wp[3];
  // (the back sits over the rear of the seat, so the seat's back edge stays a hand's width short of the edge)
  assert(seat.az0 < 31 - 35 && seat.az1 <= 31 + 6, 'Seat did not go under the desk: ' + seat.az0 + '..' + seat.az1);
  assert(Math.abs(back.az0 - 31) < 0.6, 'Back should rest against the desk edge, at ' + back.az0);
  assert(seat.top > 3.2, 'Seat top must stay below the desk top');
  // turned sideways the back is too wide to go under: it still stops at the edge
  const w2 = room(), c2 = w2.add('chair', { lvl: 'U', x: -15, z: 106, y: FY, ry: 90, parts: CHAIR, mass: 9 });
  w2.tryMove(c2, 0, -140); assert(c2.wp[3].az0 >= 31 - 0.6, 'Sideways back went under the desk top');
  // swivel: turning the seat under the desk is blocked by the desk; out in the room it turns freely
  assert.equal(w.tryTurn(ch, 0, 90), false, 'Seat swivelled through the desk');
  const w3 = room(), c3 = w3.add('chair', { lvl: 'U', x: -15, z: 150, y: FY, ry: 180, parts: CHAIR, mass: 9 });
  assert.equal(w3.tryTurn(c3, 0, 90), true); assert.equal(c3.sw, 90);
}
// 5. the player is a kinematic capsule: pushes light things, barely moves heavy ones, and is never trapped
{
  const w = room(), light = w.add('bin', { lvl: 'U', x: 0, z: 150, y: FY, parts: [cyl(10, 0, 27)], mass: 1, mu: 0.5 });
  const heavy = w.add('chest', { lvl: 'U', x: -150, z: 150, y: FY, parts: [box(25, 25, 60)], mass: 60, mu: 1 });
  const feet = FY, head = FY - 140, r = 22;
  const lightMoved = w.playerPush('U', -40, 150, r, feet, head, 10, 0, 1 / 60);
  const heavyMoved = w.playerPush('U', -205, 150, r, feet, head, 10, 0, 1 / 60);
  assert(lightMoved > 1.5 && light.x > 1.5, 'Light bin was not pushed');
  assert(heavyMoved < lightMoved * 0.3, 'Heavy chest moved as easily as the bin');
  // small light things are kicked aside, never a wall: walking into the bin can't stop the player
  assert.equal(w.playerBlocked('U', light.x, light.z, r, feet, head), false, 'A light bin blocked the player');
  assert.equal(w.playerBlocked('U', heavy.x, heavy.z, r, feet, head), true, 'A heavy chest did not block the player');
  // a low magazine (3 cm) is under the step height: it never blocks the player
  const mag = w.add('mag', { lvl: 'U', x: 100, z: 50, y: FY, parts: [box(10, 14, 3)] });
  assert.equal(w.playerBlocked('U', 100, 50, r, feet, head), false, 'A flat magazine blocked the player');
  // something the player is already inside (a refresh, a door shoving it) is a ghost until they walk clear
  const chair = w.add('chair', { lvl: 'U', x: 100, z: 200, y: FY, ry: 0, parts: CHAIR, mass: 9 });
  w.updateGhosts('U', 100, 200, r, feet, head);
  assert(w.ghost.has('chair'), 'Overlapped chair was not ghosted');
  assert.equal(w.playerBlocked('U', 100, 200, r, feet, head), false, 'Player trapped inside the chair');
  w.updateGhosts('U', 100, 160, r, feet, head); assert(w.ghost.has('chair'), 'Ghost cleared before the player was clear');
  w.updateGhosts('U', 100, 120, r, feet, head); assert(!w.ghost.has('chair'), 'Ghost never cleared');
  assert.equal(w.playerBlocked('U', 100, 200, r, feet, head), true, 'Chair is solid again once clear');
  assert(mag);
}
// 6. placement queries: on the desk, under the desk, and blocked
{
  const w = room();
  const book = { parts: [box(10, 14, 3)] }, carton = { parts: [box(25, 20, 75)] };
  const onDesk = w.findRest(book, 'U', 0, 0, 0, -60);
  assert.equal(onDesk.y, 0); assert(onDesk.ok, 'Book did not fit on the desk');
  const underDesk = w.findRest(book, 'U', 0, 0, 0, 40); // released below the desk top
  assert.equal(underDesk.y, FY); assert(underDesk.ok, 'A flat book should fit under the desk');
  const tall = w.findRest(carton, 'U', 0, 0, 0, 40);
  assert.equal(tall.ok, false, 'A 75 cm carton cannot stand under a 69.8 cm desk top');
  const intoWall = w.findRest(carton, 'U', -270, 100, 0, FY - 1);
  assert.equal(intoWall.ok, false, 'Carton was allowed into the wall');
}
// 7. a box pushed off the desk edge tips over the edge and falls to the floor
{
  const w = room(), b = w.add('mug', { lvl: 'U', x: 0, z: 26, y: 0, parts: [cyl(4, 0, 10)], mass: .4 });
  b.vz = 150; w.wake(b); run(w, 2.5);
  assert.equal(b.y, FY, 'Mug balanced in mid-air past the desk edge');
  assert(b.z > 31, 'Mug fell through the desk instead of off its edge');
}
// 8. a swinging door leaf (kinematic) shoves a body out of its way
{
  const w = room(), b = w.add('bag', { lvl: 'U', x: 200, z: 180, y: FY, parts: [box(14, 8, 36)], mass: 3 });
  for (let a = 0; a <= 90; a += 3) {
    const r = a * Math.PI / 180;
    w.setKinematic('door', 'U', { x: 236 - Math.sin(r) * 40, z: 150 + Math.cos(r) * 40, hx: 2, hz: 40, ry: -a, top: -132, bot: FY });
    run(w, 1 / 60);
  }
  run(w, 2);
  const leaf = w.staticsNear('U', 180, 100, 240, 240).find(s => s.kind === 'kinematic');
  assert(!w._.footprint(Object.assign({}, b.wp[0]), leaf), 'Door leaf left the bag inside it');
}
// 9. settling migrates an old saved pose: out of the desk, down to the floor
{
  const w = room(), b = w.add('old', { lvl: 'U', x: 20, z: 20, y: 40, parts: [box(12, 12, 30)], mass: 2 });
  w.settle(b); assert.equal(b.y, FY); assert(!w.overlapping(b), 'Settled body still overlaps something');
}
// 10. sleep costs nothing; a busy room stays well inside the frame budget
{
  const w = room(), list = [];
  for (let i = 0; i < 30; i++) list.push(w.add('b' + i, { lvl: 'U', x: -200 + (i % 10) * 40, z: 80 + Math.floor(i / 10) * 45, y: FY - 20 - (i % 3) * 25, parts: [box(9, 7, 12)], mass: 1 }));
  list.forEach(b => w.wake(b));
  let worst = 0, total = 0, n = 0;
  for (let i = 0; i < 240; i++) { const t0 = performance.now(); w.step(1 / 60); const ms = performance.now() - t0; worst = Math.max(worst, ms); total += ms; n++; }
  assert.equal(w.awake.size, 0, 'Thirty bodies never settled');
  const t0 = performance.now(); for (let i = 0; i < 1000; i++) w.step(1 / 60); const idle = (performance.now() - t0) / 1000;
  assert(idle < 0.01, 'Sleeping world is not free: ' + idle + ' ms/step');
  console.log(`  budget: 30 awake bodies avg ${(total / n).toFixed(3)} ms/step, worst ${worst.toFixed(2)} ms; idle ${idle.toFixed(4)} ms/step`);
}
// 11. walls: the inverted floor plan is solid outside the rooms and open inside, with a doorway gap
{
  const walls = P.wallsFrom([{ x0: 0, z0: 0, x1: 100, z1: 100 }, { x0: 100, z0: 40, x1: 110, z1: 60 }, { x0: 110, z0: 0, x1: 200, z1: 100 }], 20, -200, 400);
  const solid = (x, z) => walls.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
  assert(!solid(50, 50) && !solid(105, 50) && !solid(150, 50)); assert(solid(105, 20) && solid(-5, 50) && solid(150, 110));
  assert(walls.length <= 8, 'Walls were not merged: ' + walls.length);
}
// 12. something authored in mid-air (a bat hung from the ceiling) is anchored: a bump or a rebuild never drops it
{
  const w = room(), bat = w.add('bat', { lvl: 'U', x: 0, z: 150, y: FY - 160, parts: [box(12, 3, 10)], mass: .2 });
  w.playerPush('U', 0, 150 + 3 + 22 + 1, 22, FY, FY - 200, 0, -3, 1 / 60); run(w, 1);
  assert.equal(bat.y, FY - 160, 'A hung decoration fell when bumped');
  w.wake(bat); run(w, 3); assert.equal(bat.y, FY, 'A forced wake (letting go of it) must drop it');
}
console.log('PHYSICS UNIT PASS: fall/settle/sleep, stacking without jitter, no tunnelling, chair tucks under the real desk heights, capsule push/heavy resist/ghost, placement queries, edge tip-off, door sweep, save migration, sleep cost, merged walls, anchored decorations');
