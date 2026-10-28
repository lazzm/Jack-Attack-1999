# Jack Attack 1999: house scale survey

Date: 2026-10-27 (branch house-scale, on the 2.57.0 release candidate). Owner: "perhaps make house slightly larger in
aspects around - look around everywhere and improve pls - like car is like squashed in you know", and earlier "I cant
walk down the stairs? :/".

Method: eye-height captures (eye 158 cm above the floor, 1366x860, Low tier) of every room, the stairs both ways, the
drive and the street (`node tests/house-scale.mjs http://localhost:PORT before|after [--tier=] [--only=]`, shots in
`tests/shots/house-scale/before|after/`), the plan in `js/hs-house.js` measured against a typical late-90s British
semi (1930s-1970s stock), and a stairs approach test (`node tests/house-stairs.mjs http://localhost:PORT`).

Engine units: centimetres, y down. Upstairs floor y 73, ceiling -185; downstairs floor y 353, ceiling 95.

## Historical findings (27 October, before -> verdict)

| Area | Measured (before) | Real late-90s semi | Verdict |
|---|---|---|---|
| Ceiling height | 258 cm both floors | 2.3-2.5 m | Generous, keep (reads well at eye 158) |
| Floor to floor | 280 cm | 2.6-2.7 m | Slightly tall, keep (stairs are built round it) |
| Jack's bedroom | 520 x 306 | box room 2.4 x 2.0, back double 3.5 x 3.0 | Generous, keep |
| Lounge | 475 x 395 | 3.5-4.5 x 3.5-4.0 | Right, keep |
| Kitchen (diner) | 475 x 351 | 2.5-3.5 x 3.0-4.5 | Right, keep |
| Hall beside the stairs | 121 cm clear (x 207..328) | 0.9-1.2 m | Right, keep |
| Landing corridor | 76 cm clear (x 252..328) | 0.9-1.0 m | Narrow but period-plausible; widening means moving the bedroom wall (see Not done) |
| Stairs | 14 risers of 20 cm, going 25 cm, 38.7 deg, 75 cm between strings | rise <= 22, going >= 22, pitch <= 42 deg, ~76-85 cm | Correct; but only the middle 33 cm fits the player's 44 cm body, so off-centre approaches stopped dead |
| Doors | 80 cm leaves, 205 cm high | 76-82 x 198-204 | Right, keep |
| House front | 720 cm wide, 2 storeys | semi 6.5-7.5 m | Right, keep |
| **Front garden** | **400 cm** house to pavement (z 702..1100) | **5.5-7 m** (a car plus the path) | **Too shallow: the car could not fit** |
| **Dad's car** | model scaled to **82%**: 336 x 140 x 109 cm, rear bumper 36 cm from the front wall | family saloon 4.4-4.6 x 1.7-1.75 x 1.4 m | **Toy-sized and squashed in** (the owner's complaint) |
| Drive / gateway | 160 cm gateway, car overhanging the tarmac edge (x 470) | 2.4-3 m gateway | Too narrow; car could never have got in |
| Pedestrian gate | 50 cm gap, gatepost not solid, no gate | 0.9 m gate | Janky |
| Pavement / road | 100 cm pavement, 490 cm road | 1.8 m / 5.5 m estate road | Narrow but fine at this view distance; kept |
| Back garden | 500 cm deep | 10+ m | Shallow, but backs onto the rear street; not changed this pass (see Not done) |

Other jank found while looking round: the family were solid on the one-person-wide stairs (anyone standing on the flight,
at its head or at its foot stopped you dead); Mom's story spot in the hall stood in the lounge doorway; the sister's
yo-yo spot stood in the middle of the hall corridor, closing it; the front-door "frosted" landing window shows a clear
view (left: art, not scale).

## Changes (before -> after)

- **Front garden depth**: 400 -> **600 cm** (FZ, the pavement's back edge: z 1100 -> 1300). Shared constant
  `House.FRONT` (js/hs-world.js) used by js/hs-house.js, js/season-halloween.js; the shared street (js/hs-environment.js)
  moved with it: pavements, road, kerbs, drains, lamps, the opposite houses (front edges 1800 -> 2000) and the side
  neighbours' front gardens (front edge 1100 -> 1300).
- **Dad's car**: scale 0.82 -> **1.04**: 426 x 177 x 139 cm, wheelbase 291 cm (a period family saloon). Frame
  `{x 430, z 906}` -> `{x 488, z 1000}`: 86 cm behind the boot to the house, 73 cm in front to the wall, 66 cm to the
  path on the left, 140 cm to next door's hedge on the right. Every car-relative thing follows the frame: the boot lid,
  the story's boot spots and PC parts (st-opening.js), the mud splodges (ch-out.js, already car-local), the roof support,
  the collider, the pick box.
- **Drive**: tarmac x 120..620 (was 120..510); a **264 cm gateway** (x 356..620) between brick piers with caps; a real
  **84 cm pedestrian gate** on the path's line with a black steel leaf standing open (solid), the path 84 cm wide with
  brick edging; front wall and hedge moved to the new boundary; the lamp-post at the kerb off to the side (x 700).
- **Walkable front**: x -340..716, to the pavement (z 1370); both sides of the car walkable; the wall, piers, hedge, gate
  leaf and next door's hedge are solid (the old gatepost was walk-through).
- **Chores outside**: lawn 336 -> 534 cm deep (mowing par 100 -> 150 s, same pay); leaves spread over the longer
  hardstanding; the bucket and the sack by the pedestrian gate; Dad's car-wash and story spots beside the car, off the
  path; the sister's school exit is out of the front gate.
- **Family**: never solid where the house is one person wide: the stairs with their head and foot (x 322..412,
  z 196..664), the hall beside the stairs and the landing corridor (you squeeze past); elsewhere they are a
  round contact for the walking controller, so you slide round someone instead of stopping dead (the movement audit's
  pre-existing lounge<->kitchen stuck legs were the sister's yo-yo spot in the middle of the hall); Mom's hall spot moved
  out of the lounge doorway; the sister's yo-yo spot moved to the hall wall. Nav grid now covers the whole plot
  (x -360..740, z -600..1400).
- **Halloween**: the lantern snap and the static pumpkin sit on the new piers; trick-or-treaters walk up the 6 m path
  from the gate (7.6 s, was 5.2 s) and the parent waits on the pavement.
- **Stairs**: a stair funnel in the walking controller (js/hs-world.js `stairFunnel`): heading into the flight off-centre
  at its head or its foot eases you sideways onto it instead of stopping dead on the top step.

## Saved placements

`hs.things` save version pv 2 -> 3 (js/hs-world.js `migratePlacement`). For a save older than pv 3, each record in the
`drive` room: inside/on the old car (old car-local |x| <= 92, |z| <= 210) -> the same car-local spot on the new car (so
the boot's contents stay in the boot, a thing on the roof stays on the roof); where the bigger car now stands -> set down
on the drive beside it (x = car side - 32 cm, z clamped to the drive); everything else keeps its exact pose (the old
garden is all still inside the new one). Records of rooms not built yet are migrated at the next save, so a pv 3 save
never strands an old pose. Snapped things use their (moved) snap poses. The pv bump also re-runs the one-time collider
check for furniture (nudge at most 45 cm), as designed.

## Not done (proposed next)

- Back garden 5 m -> 7-8 m: move the rear fence, shed, tree and the rear street/plots (hs-environment rear plots,
  neighbourhood test) the same way as the front.
- Landing corridor 76 -> 90 cm and stairs 75 -> 85 cm between strings: needs the east wall moved out (x 410 -> 420+)
  and every hall/landing/cupboard coordinate re-laid; a bigger job than this pass.
- The landing's "bubbly" window shows a clear view.

## Approved follow-up: 2.57.14, 28 October

The historical six-metre layout is superseded by Jack's explicit approval of a seven-metre front plot. House.FRONT.FZ is 1400; the car frame is x 500/z 1075, scale 1.04, roof height 126.9 before scaling. Clearances are 109.8 cm from doorstep to boot and 106.8 cm from nose to gateway. Street/seasonal/chores/family targets share House.FRONT. Walking and NPC grids include the extended pavement.

Placement version 6 transfers saved car/roof and raised lounge props once, retaining rotation and metadata. Completed mowing strips extend through the new rows without resetting progress or paying again. Browser fixtures verify roof contact, repeat refresh, real phone movement past the open boot and nose, PC power, boot state and rotation.

The lounge now has a 190 cm sofa, 86 cm armchair and 90 x 50 cm coffee table, with 83 cm between table and sofa. Person queues yield from the back safely. Current captures use the actual 143 cm standing eye and shipped walking lens: `shots/house-scale/round2-approved-*`, desktop and phone/tablet portrait/landscape. Final 144 exterior views find no shell holes. Remaining advisory dimensions are explicitly open in SCALE-REVIEW.md.
