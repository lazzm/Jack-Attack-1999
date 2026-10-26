# Jack Attack 1999: house physics

Date: 2026-10-26. Scope: the 3D house (three.js r128). The owner asked for "the whole game and all items physics based",
a vertical collider system (things fit under desks, beds and tables only when they really fit), a desk chair that never
blocks or traps you and tucks under the desk naturally, and carrying/placing that is obvious within seconds.

Files: `app/public/js/hs-physics.js` (the solver, no DOM, no three.js), `app/public/js/hs-world.js` (the host: static
world, bodies for things, the player capsule, carrying, the ghost, saves), `app/public/js/rm-room.js` (the bedroom's
real furniture colliders and prop settings). Tests: `tests/physics-unit.cjs`, `tests/physics.mjs`.

---------------------------------------------------------------------
## 1. Decision: a purpose-built solver, not a vendored library

The site's CSP is `script-src 'self'` and every script is a classic (non-module) file loaded in order. The candidates:

| Option | Licence | Format / fit | Verdict |
| --- | --- | --- | --- |
| cannon-es 0.20.0 | MIT | ESM/CJS only (no UMD), 774 KB unpacked, last published 2022 | Needs a module bundle step or a module script that loads after hs-world.js; generic box-box contacts need tuning to stack without jitter; no character controller. |
| cannon 0.6.2 | MIT | UMD build, unmaintained since 2015-16 | Same generic-solver issues; dead code base. |
| oimo.js 1.0.9 | MIT | UMD build, unmaintained | Same; little documentation. |
| Rapier (rapier3d-compat 0.21) | Apache-2.0, not MIT | WebAssembly | Compiling WebAssembly needs `'wasm-unsafe-eval'` in the CSP; not MIT; ~15 MB unpacked. Excluded. |
| ammo.js | zlib | asm.js/WASM, multi-MB | Same CSP/size problems. Excluded. |
| **Purpose-built (chosen)** | ours | ~25 KB classic script | Exactly the shapes the house needs; integrates with the existing movement controller instead of replacing it. |

Why purpose-built wins here:
- **The player stays the movement pass's controller.** The circular collide-and-slide, stair ramp, low-lintel and
  anti-stuck rules (tests/movement-audit-notes.md) are kept unchanged. A general engine would want to own the character
  (or force a second, competing representation). Bodies simply become extra contacts for that controller, plus a push.
- **The house's shapes are boxes and upright cylinders.** Furniture stands upright; small props are boxes, round ones
  (bin, basket, mug, beanbag) are cylinders. A collider = a yaw-rotated footprint plus a real vertical range. Contacts
  are exact 2D SAT in plan plus an interval test in height, which is cheap, deterministic and does not jitter.
- **Resting is analytic.** A body lands on "the highest top under its base whose footprint holds its centre of mass" and
  is then put to sleep at exactly that height. Stacks are exact (no solver drift), so nothing jitters or z-fights at
  rest. A generic impulse solver gets there only with tuning and sleeping thresholds per scene.
- **Cost.** Only awake bodies simulate; a sleeping world costs nothing (measured 0.0004 ms/step in Node).
- **Size and maintenance.** One readable file with unit tests, no build step, no licence file to carry.

What we gave up (honestly): free 3D rotation. Props do not tumble onto their sides; a bump makes them **tip** (a damped
spring rotation about the base, up to 14 degrees) and they come back upright. Tall light things (the bin) rock more,
low heavy things barely. If the owner later wants full tumbling, the solver has a clear place for it (a resting-face
state per body), but it is not in this pass.

---------------------------------------------------------------------
## 2. Colliders: the vertical collider system

Coordinates are the engine's: centimetres, y DOWN (a smaller y is higher). Every collider has a top and a bottom.

- **Walls**: the floor plan's walkable rectangles (doorway rectangles only while the door is open) are inverted into a few
  merged solid boxes per floor (`HousePhysics.wallsFrom`, greedy merge on a compressed grid; the bedroom-and-landing floor
  needs about 55 static boxes in total including furniture). Rebuilt when a door opens or shuts.
- **`H.block(lvl, x0, z0, x1, z1, o)`**: the player's 2D blocker, as before. For bodies it is also a box from the floor up
  to `o.top`, or up to the lowest surface declared inside it (so a cabinet is solid up to its top), or full height.
  `o.solid: false` keeps it player-only when the furniture has precise parts.
- **`H.support(room, x0, z0, x1, z1, y, o)`**: a surface things rest on, now a slab `o.thick` deep (default 2.5 cm).
  A shelf is a thin slab: things slide under it if they fit.
- **`H.solid(lvl, x0, z0, x1, z1, top, bot, o)`**: a precise static part (new). `o.when()` switches it (the story's PC).
- **Doors**: an open or swinging leaf is a kinematic box (from the leaf mesh each time its angle changes); it shoves
  bodies out of its way. A shut door is part of the wall.

The bedroom's real furniture (rm-room.js):
- **Desk**: a 3.2 cm top whose underside is 69.8 cm above the carpet, the left end board, the drawer unit, the modesty
  panel, the lamp, and (when they exist) the monitor and tower. The knee space between them is open.
- **Bed**: a slab from the duvet (y 30) to the base (63) on four legs (the head end used to float: legs added), the foot
  board and headboard. Ten centimetres of space under the base along the room side: flat things fit, a box does not.
- **Telly** on its cabinet, the media rack's sides and top, the reading bookcase's sides.

Bodies are compounds of parts `{t:'box'|'cyl', x, z, hx, hz | r, lo, hi, sw, top, player}` (lo/hi measured up from the
body's bottom). `sw` parts turn with the chair's swivel; `top` marks what can be stacked on; `player:false` parts (the
chair's castor star) are below the step height and never block your feet.

**The player** is a kinematic capsule: a 22 cm circle from the step height (8 cm) to 12 cm above the eyes. Crouching
shortens it. It cannot pass under low furniture (the desk top at 69.8 cm, the bed at 10 cm), and it steps over flat
things (a magazine on the floor). Thresholds keep the movement pass's 8 cm step.

---------------------------------------------------------------------
## 3. The solver (hs-physics.js)

- Fixed 60 Hz step with an accumulator (at most 4 steps a frame: a slow frame slows physics, it never spirals).
- Per awake body per step: tip spring, Coulomb floor friction (castors roll, a beanbag grips), horizontal motion in
  substeps of at most 3 cm or 60% of the body's smallest half-width (no tunnelling through a 2 cm wall or a door leaf),
  push-out from statics, other bodies (mass-weighted shove, waking them) and the player, yaw/swivel (undone if a turn
  would wedge it), then gravity onto the highest valid support, a small bounce, and riders carried along.
- **Support rule**: a body rests on a surface only if its centre of mass is over it. Otherwise it tips off the edge: the
  overlap becomes a sideways contact and it slides off and falls.
- **Sleep**: grounded and still for 0.25 s -> velocities cleared, height snapped exactly to the support, removed from the
  awake set. Woken by: the player pushing it, another body, a door leaf, its support moving away, a static change that
  overlaps it. A sleeping body is never moved by a world rebuild (authored poses survive).
- **Player push** (`playerPush`): before the movement sweep, any body the capsule would enter is shoved along the contact
  normal by what the player wants to move into it times its push factor `1 / (1 + mass x friction / 6)` (chair on castors
  0.85, beanbag 0.42, basket ~0.7, bin ~0.95). An off-centre shove spins it (a chair's seat swivels instead). The sweep
  then stops at whatever did not give way, so heavy things slow you down instead of stopping you dead.
- **Never trapped**: a body the player is already inside (a refresh, a door shoving it, the story placing it) is a ghost
  for the player until they are fully clear of it; the solver also never leaves a body inside the player.

---------------------------------------------------------------------
## 4. Carrying, placing, dragging (the host, hs-world.js)

- Small things are lifted. They are held below and slightly right of the crosshair, at a distance scaled by their size,
  so the crosshair always shows what you're aiming at (asserted in tests/physics.mjs).
- **Ghost preview**: a see-through copy where the thing will land, computed with the physics colliders every 40 ms
  (80 ms on Low): green = fits, red = blocked (the panel says why), gold = clicks into a highlighted slot. A footprint
  plate shows the base. Furniture on the floor also keeps the old placement guards (doorways, stairs, the way to the PC,
  never sealing a passage).
- **Targets**: every free slot that accepts what you carry (a job's basket or bin, shelf slots, console slots) glows
  softly (one instanced draw for up to 48 targets).
- **E / click** sets it down exactly at the ghost (a 0.23 s glide, then asleep: no settling wobble). Red ghost: E refuses
  with a reason. **X** lets go: it leaves your hands with a little of their motion, falls, bounces and settles.
  **R** turns 45 degrees, **wheel** 15 degrees; Shift+wheel or + / - bring it nearer or further. **Q** / right click
  returns it to where it came from.
- **Big furniture is dragged, not lifted** (the chair, the beanbag): E takes hold and it slides along the floor in front
  of you, colliding with everything and pushing lighter things. Walk it to the desk and it tucks in as far as its back
  allows. If it catches and you walk off, you let go. E lets go. F on the chair sits on it (it rolls out from under the
  desk first if it's tucked in). Seated, the seat and back swivel with your view.
- **F while carrying** works the door, drawer, cupboard, car boot, switch or seat you're aiming at (a prompt shows the
  action next to the crosshair); aiming at nothing usable, F uses the carried thing as before.

---------------------------------------------------------------------
## 5. Saves

`hs.things` records stay `[room, x, y, z, ry, snap, hide]` with an optional 8th `{sw}` (the chair's swivel), and the save
object gains `pv: 2`. A carried thing saves the place it was picked up from; the grip itself is remembered per device
(`jhp_hs_held`) and handed back after a refresh. Older saves (no `pv`) are checked once against the new colliders: a
placement that now overlaps something is nudged out (at most 45 cm) and dropped onto its support, then saved. Nothing
else moves on load: sleeping bodies keep their exact saved pose.

---------------------------------------------------------------------
## 6. Budgets and measurements

- Target: under 1 ms of physics per frame on the potato tier (solver plus the player's capsule queries plus the ghost).
- `House.physics.frameMs` is the whole per-frame physics cost; `House.physics.world.stats` is the solver alone.
- Node (tests/physics-unit.cjs): 30 awake boxes average about 0.15-0.3 ms per step on this host; a sleeping world
  0.0004 ms per step.
- Browser (tests/physics.mjs, software WebGL, CPU throttled 4x as a potato stand-in): see tests/shots/physics/report.json
  for the p50/p95 of the whole-frame physics cost while pushing the chair.
- Not measured: real low-end phones or old laptops with hardware GPUs (the house is desktop-only today).
