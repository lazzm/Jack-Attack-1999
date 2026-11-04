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

## Sizing 3: remaining rooms and front (4 November 2026)

See the per-row decision ledger in SCALE-REVIEW.md. This working-tree pass retains the approved rear/kitchen plan,
front depth, car frame, storeys, stair pitch, door openings, people and family seat anchors. It changes the desk,
portable bedroom TV, pinboard/calendar, existing robot poster, pillow and beanbag, plus handrails, switch plates,
the adjacent front hedge and sack. Leaf artwork is retained, with fewer material draws. It adds no scene lights or graphics options. TV shell parts use
the existing material-batch helper; live 4:3 glass remains its own interactive mesh.

### Why G3 is left to Jack

The historical statement that *any* ceiling lowering requires new stairs was too broad. There are two choices:

1. **Lower ceilings only:** UC -185 → -170 and GC 95 → 110, keeping floors at UY 73 / GY 353. This gives 243 cm
   clear height (15 cm / 5.8% less), and 38 cm rather than 53 cm over the unchanged 205 cm doors. The stair rise can
   stay 280 cm, but the apparent floor/ceiling void grows 22 → 37 cm. The high bedroom window starts at y -166:
   only **4 cm below the new ceiling**, and its top frame reaches -169, leaving **1 cm** before coving. That window
   and both exterior/portal apertures need lowering or rebuilding, along with coving, loft hatch, ceiling fittings,
   ceiling-hung seasonal objects and any saved placements on those changed surfaces. Lowering one plane now would
   leave inconsistent windows/trim and an implausibly thick floor edge. The gain is modest after the eye/lens fix.
2. **Lower floor-to-floor as well:** retaining the 22 cm floor void with 243 cm rooms gives 265 cm storeys. The current
   14 × 20 cm flight, ramp `73 + .8*(z-250)`, cupboard's sloped ceiling, upstairs floor, all upstairs room/door/window
   positions, exterior bands and NPC stair transitions would need changing together. Old standing/seated/prop/body
   coordinates would need a whole-upstairs migration, including unbuilt rooms and story/seasonal anchors. No such
   migration or partial geometry change is included here.

The measured existing stair is 20 cm rise / 25 cm going, 38.66°, with 74.6 cm clear treads. The hall has 121 cm clear
width; the narrow landing has 76 cm. Widening the landing/stair is a separate horizontal plan decision and must not
be disguised as a ceiling edit. Contemporary dimensional comparisons: [council stair guidance](https://buildingcontrol.bathnes.gov.uk/loft-conversions/stairs-and-guarding),
[domestic desk dimensions](https://www.ikea.com/gb/en/p/alex-desk-white-80483438/), and
[manufacturer stair-part drawings](https://media.cylex-uk.co.uk/companies/2389/1373/uploadedfiles/23891373_636541179842071316_18187-richard-burbidge-trade-brochure-redesign-low-res-complete.pdf).
These are outside-game measuring references, not new in-world brands or claims about 1999 regulations.

### Saved placements: PV11

Existing PV0–10 transfers remain in order. Bedroom records on the removed desk-edge strips move onto its retained
top; supported PC/tower/keyboard positions stay exact. Loose contents of the top drawer follow its 4 cm horizontal /
13 cm depth change. The old beanbag home moves 16 cm left and 26 cm forward; floor props in the enlarged footprint
move into the open aisle at z 166. The magazine stack and its tidy target move from z 58 to 143, keeping stack
heights. One factory daily-mess spot moves to (-188,70) so clothes do not start in the beanbag. The front-edge
Game Lad/Eggbert homes and persisted empty-case anchor also follow the smaller desk. Custom moved furniture stays where it was saved and receives the existing one-time
physics clearance check. An old valid standing/seat-return point newly covered by the beanbag moves to the open
aisle only when that beanbag is still at its factory home. Pillow/mattress and old pillow-top placements move 9 cm
forward, with the old 26 cm pillow-top y corrected to 24.9. Snaps use their new anchors; hidden records, rotations,
chair swivel, unbuilt-room records, daily chore progress and media IDs remain intact. Current-version saves do not
repeat these moves. No live data, account, balance, cap, shared-world or server objective state is edited.

`placement-migration-unit.cjs` checks actual production transfers including metadata and repeated loads;
`world-pose-unit.cjs` checks exact refresh and the newly covered standing point. `sizing3-save.mjs` exercises a real
PV10 profile with restored bodies, a custom chair/swivel, two ordinary refreshes and the changed bedding interactions.
Actual results, screenshot reviews and per-camera draw totals are recorded in the final sizing3 ledger.

### Sizing3 verification ledger (4 November 2026)

All browser runs use one Chromium at a time, ports 18080–18099 and new `/tmp` data. No deployment, container,
version, changelog, live data or account changes. The pre-existing untracked `app/public/audio/voice` entry is untouched.
The owned-server wrapper checks that its own child logged the selected listening port before allowing the browser;
its EXIT trap kills only those child PIDs. An early capture attempt lost a shared-host port race and was discarded.

Native matched captures: `node tests/sizing3.mjs http://localhost:18081 before` and
`node tests/sizing3.mjs http://localhost:18086 after` both exited 0 (34 views each). The final eight changed bedroom /
leaf / sack captures use `SIZING3_ONLY=bedroom-door,desk,leaves,sack`, port 18098, exit 0. Every image was reviewed in
contact sheets, with full-resolution inspections of the changed models, people and phone views. Existing baggier
leaf trial captures were replaced with the retained original artwork. The earlier after views outside those eight
predate the final small material consolidation and factory chair/magazine-home adjustments; they are not all a
fresh capture of the final source. Desktop is 1366 × 860, phone portrait 390 × 844; no raster cap on art captures.

Draw-call evidence (same cameras/actor positions; one sample per rendered view, not a device benchmark):

| Camera | Before | Final capture |
|---|---:|---:|
| Desktop bedroom doorway (previous peak) | 743 | 742 |
| Phone bedroom doorway | 594 | 594 |
| Desktop desk | 473 | 474 |
| Phone desk | 385 | 386 |
| Desktop leaves | 92 | 86 |
| Phone leaves | 74 | 69 |
| Desktop sack | 65 | 64 |
| Phone sack | 59 | 59 |

The complete 34-view sample immediately before the final TV-plastic/zip material consolidation totalled
9,834 → 9,775 draws, but its peak was 744, which triggered that correction. The final heaviest native camera is
742. **Do not interpret this as every view decreasing:** enlarged furniture / relocated magazines enter some
frusta that previously missed them. In particular the earlier phone wardrobe sample rose 100 → 115. No lights,
render passes, texture blur or graphics controls were added. Neighbour scenery stays 83 meshes; hedge detail
changes its triangle count 76,146 → 76,434. Bonfire geometry remains 263 meshes / 43,756 triangles.

Completed non-browser checks: syntax on every touched JS/test, all 47 `tests/*-unit.cjs` (exit 0),
`node --expose-internals tests/parody-audit.cjs` (exit 0, 0 authored spans),
`node tests/neighbourhood-geometry.cjs` (exit 0), and `git diff --check` (exit 0).
`node tests/bedroom-hifi-unit.cjs` and `node tests/physics-unit.cjs` passed again after the last model-material edit.

Bonfire: `FIXTURE_RASTER_RATIO=0.35 BONFIRE_RESUME_LOGIN=1 BONFIRE_NO_SHOTS=1 node tests/events-bonfire.mjs http://localhost:18081`
exited 0: all eight objectives, real wood placements/gestures, Friday display, Saturday catch-up, once-only rewards,
refresh, off-dates, second account and phone resizing. `node tests/bonfire-geometry-unit.cjs` exited 0 in the full unit loop.
Functional raster caps affect only the test renderer; the authored game setting and native art captures are unchanged.

The first full physics run was interrupted (exit 130) after its old drawer aim failed and stacking waited on a
blocked placement. A targeted rerun exited 1 and identified `body:ch.pillow` at the old floor-box test location;
the full-size pillow now legitimately occupies that space. The drawer's corrected aim passed. The stacking fixture
now uses a genuinely clear floor position and checks the ghost before pressing E, so a blocked ghost fails with its
reason instead of silently waiting. Earlier old-save fixture failures included an overlength account name and a
custom chair deliberately coinciding with ordinary chore/tool bodies. The final fixture uses a custom bedroom chair pose (-35,45), after the trial landing pose was rejected by the
existing room-restore validation. It requires collision-free bodies, exact retained position, preserved swivel/metadata
and exact subsequent refreshes; see its final result below. Final browser outcomes are recorded below.

`FIXTURE_RASTER_RATIO=0.35 node tests/characters.mjs --only=day,space,bump` exited 0 (3/3).
The three-day simulation checked 77,760 ticks: minimum nav clearance 23.7 cm, 22 doors opened / 19 shut,
maximum routine wait 1.1 s; personal-space crossings had no body overlaps and maximum wait 1.8 s.

Remaining scope limits: G3, car taper/arches (5/6), landing width (9), stair width (10) and leaf artwork (20)
remain explicit design work. Kitchen dressing (30) was deliberately not expanded. `tests/mobile.mjs` has not run
in this time box; phone portrait captures, Bonfire resizing and any smoke phone checks are narrower evidence,
not a full phone/tablet, landscape or gamepad certification. No whole-house collision sweep or all-door rapid-click
matrix is claimed. The corrected desk drawer was exercised open/closed while carrying. Final gate status follows.

Final regression results available before the time-box stop:

- Full `FIXTURE_RASTER_RATIO=0.35 REGRESSION_NO_SHOTS=1 node tests/physics.mjs`: **exit 1, 14/15**.
  The one failure was an invalid floor expectation: the test's dropped books landed correctly on the washing basket
  at y 27. After moving the drop camera into the clear aisle,
  `FIXTURE_RASTER_RATIO=0.35 REGRESSION_NO_SHOTS=1 node tests/physics.mjs --only=carry-box-through-door,drop-stack-settle,no-browser-errors`
  **exited 0, 3/3**. The full suite has not been rerun a final time after that fixture-only correction. Full-run
  physics cost: 0.177 ms/step unthrottled, 0.524 ms/step at 4× CPU throttle; both budget checks passed.
- `FIXTURE_RASTER_RATIO=0.35 node tests/smoke.mjs`: **interrupted, exit 130** after sparse-signup/account-house passed
  and walk-refresh timed out while the loader was still visible. The alone rerun with `SMOKE_SCALE=4` was also
  interrupted for the time box before it completed a check. **The smoke gate has not passed.** This is not evidence
  of a production refresh defect; a complete alone rerun is still required before shipping.
- `tests/mobile.mjs`: **not run**. A final full physics gate and full smoke gate remain unverified.

`FIXTURE_RASTER_RATIO=0.35 node tests/sizing3-save.mjs http://localhost:18083` exited 1 **after** passing the PV10
migration/body/no-overlap assertions, exact custom chair/swivel, drawer/slot metadata, unchanged standing/PC power /
shut door, two exact normal refreshes, drawer reversal/Esc, A1 inspection, gold pillow placement and pillow work.
The remaining immediate pyjama assertion ran before `snapIn`'s existing **380 ms** animation commits its `onSnap`.
The fixture now waits for the actual thing to leave `anim`, rather than only for hands to become empty. These are
narrower passed assertions within a failing test, **not a passed whole save gate**. The old-save and two refresh
captures were inspected in full. A final no-refresh bedding-only retry is reported below.

The final `SIZING3_REFRESHES=0 FIXTURE_RASTER_RATIO=0.35 node tests/sizing3-save.mjs` bedding-only retry was
interrupted at the 90-minute stop (exit 130); **not verified**. The whole corrected save gate, full smoke gate and
final complete physics rerun must pass before shipping. Working tree left uncommitted and undeployed.

## Under-stairs cupboard, PV12 (4 November, branch cupboard; unreleased)

Jack's request was read as reclaiming the enclosed wedge without moving the flight, and giving the entrance real
headroom and a clear swing. The hall side has its existing mirror, radiator, coats, photos and school bag; no hall
alcove was cut into the low wedge. Keeping that volume inside gives useful shallow storage without narrowing the
121 cm hall. Units below are centimetres, plan coordinates x/z; floor y 353, standing eye 143.

| Top-down plan / clearance | PV11 | PV12 |
| --- | --- | --- |
| Stair footprint (unchanged) | x 332..408 | x 332..408 |
| Cupboard plan area | x 332..408, z 252..440: 76 × 188 | x 332..408, z 252..548: 76 × 296 (+57% plan area) |
| Clear floor definition | x 334..406, z 254..423: 72 × 169 | x 334..406, z 254..548: 72 × 294 (+74% floor length) |
| Lowest end | floor beyond z 441 outside cupboard; sealed wedge | back board z 548; tree carton ends z 545; about 18 cm headroom there (reach-in storage) |
| Door opening in x 330 wall | z 362..438, 76 wide, 94 high | z 270..346, 76 wide, slope-cut: about 234..173 high; no C hint at entrance |
| Door swing | 100° inward into stored objects | 180° outward around projected butt hinge x 324.5, z 270; stops for the player |
| Leaf over carpet | bottom near floor y 353 | bottom y 351, clear of carpet at y 352 |
| Hall route fully open | cupboard leaf in cupboard | leaf folds along east side at x about 322; hall furniture unchanged |
| Tea chest / portable telly | (380,300) / (380,296), telly yaw −20° | (385,273) / (385,275); chest 40 cm wide, telly yaw 0° |
| Super Ultra box / insertion | (352,340), yaw 15° | (348,275), yaw 0°; insertion follows console |
| Filled-case rack | x 385..393, z 370 | unchanged IDs, slots and coordinates |
| Empty-case parking | (379,345), yaw 0° | (397,311), yaw 90°; only old factory park migrates |
| Tall / low storage | ironing board high end, vacuum (398,420), toolbox (350,390) | board against x 403 at z 359; vacuum (345,450), wellies z 476/490, toolbox (352,517), toy bag (393,508), tree (383,533) |
| Player head | fixed 112 eye throughout | normal 143 at entrance; eye lowers under slope with 16 cm margin ahead of capsule |

The soffit remains `73 + 0.8*(z-250) + 23.5`; the last part is storage, not standing space. The existing meter,
bulb/pull switch, paint shelf, loot spot IDs and Halloween sweets tin at (348,422) remain available. The map follows
the room area; the old hall rectangle under the enclosed flight now begins at the slope's floor intersection.
PV12 moves only objects supported by the relocated chest/console box and loose floor records covered by their new
positions. Existing aisle placements and rack snaps stay put. A PV11 player on the newly covered floor resumes
standing in the clear entrance at (370,337); door state is retained. Other save versions and rooms keep their rules.

Geometry evidence: `node tests/cupboard-geometry-unit.cjs` builds both production versions with the real three.js
and HouseKit. Unculled authored draw submissions before runtime merging: hall **46 → 43**, cupboard **62 → 67**,
combined **108 → 110 (+2)**. This is a model submission count, not hardware FPS. The same test checks 91 leaf angles
and all 11,476 solid prop vertices against the side/end lining, carpet and soffit. It caught and corrected the meter
back mounting, the console lead dipping below carpet, and the folded board's bevel touching the floor.
