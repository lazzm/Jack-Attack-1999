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

## Rear plot and kitchen sizing pass (3 November 2026, branch sizing)

Units are centimetres, y down; standing eye remains 143 cm. `House.REAR` in `hs-world.js` defines the rear plot.
The house and front drive stay in place. The back road and its rear row move 10 m north together; neighbour meshes
remain in the same static batches, and the camera-relative horizon continues beyond them.

| Plan element | Before x / z | Revised x / z | Size / clearance |
|---|---|---|---|
| Rear garden, main rectangle | -300..215 / -560..-56 | -340..440 / -1476..-176 | 7.8 × 13 m, full house width with side margins |
| Kitchen interior | -280..195 / -56..295 | -280..195 / -176..295 | 4.75 × 4.71 m; rear extension 1.2 m |
| Kitchen table | centre -60 / 170 | centre -60 / 110 | Existing 120 × 80 cm pine table, four chairs |
| Kitchen walkways, including chair backs | south 41 cm; north 76 cm | south 101 cm; north 136 cm | West 124 cm, east 159 cm; measured to collision footprints |
| Rear window | head 158 cm; sill 63 cm | head 210 cm; sill 100 cm | 120 × 110 cm, clear of cooker hood and wall cupboards |
| Rear worktop / sink / cooker / fridge | z -56..14 | z -176..-106 | Whole run, appliances, controls, chores and props move 120 cm |
| Patio | -215..115 / -191..-61 | -215..195 / -376..-181 | 4.10 × 1.95 m, directly outside the door |
| Path and shed hardstanding | none | -320..-230 / -1270..-376 | 90 cm path with paved turn into patio; 2 × 1.3 m shed apron |
| Shed | centre -212 / -462 | centre -230 / -1330 | 180 × 120 cm; ridge about 200 cm; 76 × 175 cm door |
| Rotary dryer | centre 80 / -280 | centre 250 / -650 | Existing 252 cm spread, separate from the central play lawn |
| Flower bed | centre -230 / -270 | centre -170 / -700 | Beside the path, with Mom standing on the lawn side |
| Trees | 145 / -500; -40 / -540 | 330 / -1335; 90 / -1400 | Existing art, moved to the far boundary |
| Wheelie bin / water butt | 160 / -190; 180 / -102 | 370 / -280; 235 / -222 | Beside the patio; butt clears the entire outward door swing |
| Bonfire watching rope / stack / launch / wheel | z -181 / -402 / -455 / -520 | z -498.4 / -1068.5 / -1205.2 / -1372.8 | 5.7 m rope-to-stack and 7.1 m rope-to-launch |

A rearrangement alone could not provide 90 cm on both sides of the four chairs in the old kitchen depth. The 1.2 m
extension and a 60 cm table move provide those clearances without widening the house or moving the hall door. It has
solid brick returns, a closed felt roof, fascia, gutter and downpipe, visible below the bedroom window. The original
upper-storey footprint and stair geometry remain unchanged.

Placement version 10 moves old counter/table/chair-supported objects, the bin lid and objects on the new paving once. Objects on the
old open lawn retain their coordinates. Snapped things follow their new anchors, metadata and chore progress remain,
and old standing poses just outside the back door remain outside. The family cache also migrates old counter poses. Daily chore placements use the same transfer, retaining partial
washing, job timers and completed steps. Portable seats keep a migrated standing return point.
Evidence and final verification status are recorded in `tests/shots/sizing/` and the task report; open scale rows are
retained in `SCALE-REVIEW.md` rather than assumed complete.

Rear geometry budget: the neighbourhood remains **80 static meshes**, **74,862 → 74,922 triangles** (+60, 0.08%).
The longer connecting road accounts for the extra stripe geometry. Extending the neighbour gardens adds no meshes.
The rear grass stays **one instanced draw**, **2,862 → 2,772 blades** (31,482 → 30,492 triangles); texture repeats remain
in centimetres. Fence posts, paving and the extension are built into the existing room batches. Per-view renderer
counts are included in the screenshot reports, since the number of visible rooms and frustum direction affect totals.

Matched 1366 × 860 daytime views (full draw totals, including rooms, neighbourhood and the open event):

| Camera | Before calls → after | Before triangles → after |
|---|---|---|
| Garden from back door | 73 → 149 | 127,702 → 137,172 |
| Garden from far end | 1,073 → 1,142 | 337,512 → 338,540 |
| Bedroom window | 146 → 190 | 148,024 → 157,022 |
| Kitchen hall doorway | 562 → 668 | 257,330 → 260,770 |
| Kitchen back doorway | 338 → 219 | 210,754 → 158,886 |
| Kitchen with Mom at sink | 315 → 330 | 187,444 → 191,382 |

Across all 24 matched day/night desktop/phone views, peak calls are **1,094 → 1,163 (+6%)** and peak triangles
**337,512 → 338,540 (+0.3%)**. Individual garden views render more of the relocated event props and backdrop;
the back-door view's call count rises substantially, as the table above shows. The final small paved path/patio join adds 12 triangles to the garden batch. Room portals and static batches remain
in use. These are software-renderer geometry counts; real-device frame-rate performance remains unverified.

The final far-end captures include the filled bucket from the real Firework Code input. The new paved turn has
separate desktop/phone detail views (`after/*-day-path-turn-detail.png`); its joints and contact were inspected.

Verification handoff at the worker time limit: syntax checks, all 42 unit scripts, parody audit (0 spans),
neighbourhood geometry, characters `--only=day,space,bump`, all eight real Bonfire objectives, 20 selected Bonfire
art views across desktop/phone/potato, and the old-save/two-refresh fixture passed. All 24 matched before and after
views, the Bonfire captures and final paving details were visually reviewed. The complete Bonfire run preceded the
final butt-clearance/paving touch-ups; the final real F at the relocated butt received the server acknowledgement,
and the added paving migrations pass the production-function unit checks.

The full Halloween run was interrupted at the budget boundary after all six carving steps and the start of
trick-or-treating passed; it has no full passing result. The first attempt received SIGTERM before connecting.
The mobile `--only=gate,full` attempt also received SIGTERM without a complete result. Full `physics.mjs`,
`story-ch1.mjs`, `smoke.mjs`, Halloween and mobile regression results remain outstanding. Real hardware performance
and the remaining Stage 3 rows (including G3/G4) remain unverified/open. No live deployment is part of this branch.


## Sizing round 2 (3 November 2026, merged base a7d88c5)

The gloves stool and `bf.gloves` target move together from (44, 53) to (174, -148), in the nook to the right of the
back door. Its ID and all server progress keys stay unchanged. The stool clears the outward door leaf and the
central approach. Existing saved cactus positions still fit the enlarged sill; the default cactus and gathered
right curtain now leave each other clear, and the pole ends before the bedroom side wall.

| Opening | World bounds (cm, y down) | Interior / backing |
|---|---|---|
| Jack's main rear window | x 148..232, y -137..-14 | Real 84 × 123 cm casement; shared inside/outside aperture and glass |
| High bedroom window | x -245..-115, y -166..-126 | Real 130 × 40 cm fanlight, above the existing posters and TV |
| Kitchen extension side window | z -160..-80, y 143..235, x about 195..206 | Real 80 × 92 cm casement facing the side garden, clear of the stool and appliances |
| Upper unmodeled rear room | x 270..380, y -137..-14 | Recessed frame, glass and solid pleated closed curtains with opaque backing |
| Lower unmodeled rear room | x 270..380, y 143..253 | Same closed construction; no view into an absent room |

`House.REAR.bedroomWindows` drives the bedroom walls, exterior holes and both directions of portal bounds.
The kitchen's side aperture is also in both room portal lists. Glass and frames have thickness; the extension has
a lead flashing strip at its junction with the original wall. Furniture and posters retain their positions.
The merged fence boards and rails are retained; matching solid weeds now follow both long sides and short returns.
The merged trees remain rooted at y 353, and their contact shadows were inspected in the garden captures.

Matched day/night, desktop/phone counts from `tests/shots/sizing/round2/{before,after}/report.json`:

| View | Before calls | After calls | Before triangles | After triangles |
|---|---:|---:|---:|---:|
| Desktop day, rear from far end | 1143 | 1144 | 349748 | 357538 |
| Desktop night, rear from far end | 1163 | 1165 | 349816 | 357606 |
| Desktop day, garden from back door | 149 | 149 | 145672 | 151694 |
| Phone day, garden from back door | 143 | 144 | 143914 | 151454 |
| Desktop day, kitchen doorway | 388 | 395 | 216318 | 231012 |
| Phone day, kitchen doorway | 303 | 314 | 199908 | 216426 |

The peak among the 12 paired views changes from 1164 to 1165 calls; peak triangles rise about 2.2%.
No new scene lights are added. Static batching and portal culling remain active.

Verification method: native-resolution before/after art captures; Bonfire art requests desktop/phone/potato coverage;
functional regression fixtures can use `FIXTURE_RASTER_RATIO=0.5` on the shared software-renderer host. This only
caps canvas raster pixels; CSS viewport coordinates, geometry, gameplay assertions and real inputs remain intact.
`REGRESSION_NO_SHOTS=1` skips optional galleries in physics/Halloween/story, retaining their checks and failure
captures. Character/physics/Halloween setup reuses the existing real WebSocket login/profile helper and ordinary
standing token resume. Fresh resumed fixture accounts complete the normal About You form before gameplay. Explicit browser logon remains in smoke/mobile/story. The first full Bonfire attempt completed gameplay but its final non-owner wait hit the CSP; polling through `evaluate` fixed the fixture and the complete rerun passed. The production CSP is unchanged.

### Round 2 verification ledger

Only disposable localhost servers and `/tmp` state are used. Each browser runs serially. Tests still absent below are **not verified**, even if queued.

| Check | Actual result |
|---|---|
| Syntax: `node --check` on every touched JS/MJS/CJS, including `tests/sizing-round2.mjs` | exit 0 |
| `for f in tests/*-unit.cjs; do node "$f" || exit; done` | exit 0; 44 files, including PV10 old-save/repeated-load tests |
| `node --expose-internals tests/parody-audit.cjs` | exit 0; zero authored spans |
| `node tests/neighbourhood-geometry.cjs` | exit 0; 83 meshes / 76146 triangles |
| `node tests/sizing-round2.mjs <throwaway URL> before/after` | before/after exits 0; 12 matched pairs, 24 after shots |
| `events-bonfire.mjs` | exit 0 |
| `bonfire-art.mjs (default attempt)` | exit 143; runner terminated during desktop capture; full default suite incomplete |
| `bonfire-art.mjs (focused phone)` | exit 0; objective target, crosshair pick, real touch F, gold-willow framing/gaze |
| `events-halloween.mjs` | exit 0 |
| `characters.mjs --only=day,space,bump` | exit 0 |
| `physics.mjs` | exit 0 |
| `story-ch1.mjs <throwaway URL>` | exit 124; time-budget cutoff after real tidy accepted; full story remains unverified |
| `smoke.mjs` | NOT RUN |
| `mobile.mjs --only=gate,full` | NOT RUN |

Earlier attempts: full Bonfire first exit 1 (final non-owner fixture CSP wait, subsequently corrected); characters setup interrupted with exit 130 (fresh account About You form, fixture corrected). No production identity/save or CSP rules changed.

Exact browser commands actually issued (see results above; an entry without a result may only have been queued near the cutoff):

```sh
env BONFIRE_RESUME_LOGIN=1 BONFIRE_NO_SHOTS=1 FIXTURE_DEBUG=1 node tests/events-bonfire.mjs http://localhost:18089
env FIXTURE_RASTER_RATIO=0.5 BONFIRE_RESUME_LOGIN=1 BONFIRE_NO_SHOTS=1 FIXTURE_DEBUG=1 node tests/events-bonfire.mjs http://localhost:18089
env FIXTURE_DEBUG=1 FIXES2_ART_TAG=sizing-round2 node tests/bonfire-art.mjs http://localhost:18089
env FIXTURE_RASTER_RATIO=0.5 REGRESSION_NO_SHOTS=1 FIXTURE_DEBUG=1 node tests/events-halloween.mjs http://localhost:18089
env FIXTURE_RASTER_RATIO=0.5 FIXTURE_DEBUG=1 node tests/characters.mjs --only=day\,space\,bump
env FIXTURE_DEBUG=1 FIXES2_ART_TAG=sizing-round2 BONFIRE_ART_MODES=phone BONFIRE_ART_ONLY=06-gloves-by-back-door\,15-gold-willows node tests/bonfire-art.mjs http://localhost:18089
env FIXTURE_RASTER_RATIO=0.5 FIXTURE_DEBUG=1 node tests/characters.mjs --only=day\,space\,bump
env FIXTURE_RASTER_RATIO=0.5 REGRESSION_NO_SHOTS=1 node tests/physics.mjs
env FIXTURE_RASTER_RATIO=0.5 REGRESSION_NO_SHOTS=1 FIXTURE_DEBUG=1 node tests/story-ch1.mjs http://localhost:18089
env FIXTURE_RASTER_RATIO=0.5 FIXTURE_DEBUG=1 node tests/smoke.mjs
node tests/mobile.mjs --only=gate\,full
```

Evidence: `tests/shots/sizing/round2/{before,after}/`, `bonfire-desktop/`, `bonfire-phone/`. Captures are native resolution and personally reviewed. Full default Bonfire art coverage, including Potato, requires a completed rerun; a focused pass is not a full-suite pass. G3/G4 and other open stage-3 rows remain open.
