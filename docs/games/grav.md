# Anti-Grav 3000 — depth pass, 3 November 2026

Original PlaySpace hover racer, presented at 320×240 on the bedroom television and in 4:3 LOCK IN.
All hulls, scenery, texture painting, effects, tunes and code are original. The visitor's Cast supplies every
pilot, record-holder and staff name. Fixed save key `rm.ps.grav`, its version, old track indices, lap records,
championship results, unlocks, scores and secret IDs remain compatible.

## Scope against the 1999 genre benchmark

This compares the 1999 single-player release, without later expanded editions. The comparison was checked
against the period instruction manual
and period mode descriptions. This is a substantial single-player pass; local two-player racing remains a scope gap.

| Feature/content | Original has | Before | This pass |
| --- | --- | --- | --- |
| Racing circuits | 8 main circuits | 5 league + 1 secret | 8 league circuits; original indices retained; new Biscuit Works and Cloud Nine |
| Secret circuits | 4 prototype courses | None | 4 separately authored wireframe blueprints: Beta Blocker, Teapot Loop, Null and Void, Unsigned Off |
| Teams/craft | 8 distinct teams | 4 + secret prototype | 8 stat sets/hulls, original low-poly art; three new variants have solid tapered pods and fins |
| Field | 12 ships | 8 | 12, with racing lines, overtaking, mine avoidance, pit strategy and bounded speed catch-up |
| Speed classes | 4 | 2 | Sub-Zip, Supersonic, Hyperactive, Ludicrous; consecutive league wins open the next |
| Tournament | Multi-race points league | Five rounds, podium | Eight rounds, cumulative standings, reverse championship grid, podium, ending pages and credits |
| Single races | Medals per circuit/craft/class | No career medal grid | 256 league medals; bronze/silver/gold retained separately for all eight ships and four classes |
| Time trials | Per-class records | Track-only records/ghost | Class-specific records/ghosts, free starting turbo; first-class legacy keys retained |
| Challenges | 24 race/time/combat tests | None | Eight tracks × three licences; completing each eight-test discipline opens a craft |
| Eliminator | Combat, scoring, respawning craft | None | Five knockouts to win; combat licences require three; pit repair disabled, craft rebuild after elimination |
| Checkpoint pressure | Timed race progression | None | Separate checkpoint-attack mode, timed extensions and saved attack records |
| Shield boost | Spend energy for extra thrust | Pads/weapon turbo only | Hold V/triangle for hyperthrust; drains shield, stops at reserve energy; pads/turbo remain separate |
| Airbrakes | Independent shoulders; both slow down | Opposite shoulders cancelled out | U/E swing the tail; both scrub speed; smoothed steering and speed-dependent chase lens |
| Weapons | Offensive/defensive pickups | Six, with oversized effects | Six polished weapons, absorb-to-repair, visible shield shell; protection also prevents projectile slowdown |
| Unlocks/secrets | Ships, classes, prototypes, codes | One class, track and ship | Four-class league ladder, secret craft, licence/medal craft unlocks, blueprint per class's 32 starter golds, rainbow/all-open codes |
| Attract/presentation | Demo, menus, flybys, results, music | Present but obstructed | Automatic Cast-driven demo, clear flybys, complete lettering, paged twelve-place results, final-lap music cue |
| Local multiplayer | Two players on one console | Absent | **Not implemented** — next depth chunk |
| Refresh/pause | Memory-card progress | Race lost on refresh | Exact simulation snapshot on pause/leave and every two seconds; race/countdown resumes paused; results/standings/ending restore |

## Ranked critique and fixes

1. **High: the pale slab hid the road.** Deterministic reproduction of the owner's 280-idle/150-thrust frames
   reproduced it. Rendering with particles hidden removed the slab: unbounded near-camera exhaust point sprites
   were the cause. Native screen-space caps are now 8/14 pixels, with lower pool counts. The start stripe was a
   separate 2.5-metre road ribbon: it is now a 0.7-metre painted band.
2. **High: refresh discarded the race and league.** Plain-value snapshots rebuild meshes, rivals, shots, ghost
   recording, championship points and presentation phase. Points use stable pilot IDs so identical Cast names cannot merge scores. Live races resume paused. Loading/countdown/finish/results/
   standings/podium/both ending pages/credits are covered by the simulation regression; actual browser reloads cover
   racing and credits. Ghost snapshots use delta encoding to keep ordinary saves compact. New ghosts are account-scoped and may use spare
   roaming space, with a hash selecting the current recording; they never request large-save fallback that could evict another game.
3. **High: shallow progression and fixed names.** Added the content in the scope table; new scores store a Cast ID.
   Existing personal score values and stored names are preserved; the screen resolves their owner through Cast. No real-brand authored text remains in the parody audit.
4. **Medium: track themes had almost no scenery.** The scenery builder checked a track property that lived on its
   theme. Fixed; city blocks, mountains, refineries, coral and towers now appear. A solid building that would have
   filled a tunnel is constructed above the tunnel's clearance instead.
5. **Medium: start-grid lamp blob / title sign collision.** Repair lamps are recessed outside the racing line;
   the title camera is an elevated flyby with a reserved logo area, rather than flying through gantries.
6. **Medium: recovery could recursively drain energy.** Rescue invulnerability previously still ran falling physics,
   allowing repeated rescue charges. A recovering craft now waits for its tractor-beam cooldown before physics resumes.
   The seeded low-class Cloud Nine reproducer finishes after this fix.
7. **Medium: dual brakes, blown highlights and missing feedback.** Fixed dual-brake cancellation, softened the pale
   track palettes, added solid bend markers, bounded exhaust, bank-aligned contact shadows, shield field and hyperthrust feedback. Repeated racing hulls
   are instanced by team to reduce submission cost. Frame-by-frame
   review includes the new hulls from both sides and every circuit.

## Validation / before versus after

`tests/games/grav.mjs` is the physical-case/browser regression. It uses real keyboard input for menus, throttle,
steering, shoulder brakes, hyperthrust, fire/absorb, pause, Esc and Q/T; a simulated standard browser gamepad exercises
its shared mapper. It captures all circuit starts/mid-races, automatic attract frames, all weapon flows, a complete
unshortened three-lap race, the eight-round league, endings/credits and refresh restoration. The league's later
race distances are explicitly shortened through placement hooks; the production finish/points/unlock code still runs.
`grav-sim.cjs` completes all twelve circuits in all four classes and exercises save phases without a renderer.
`grav-render.mjs` is a deterministic original-renderer art review; `--before` serves HEAD's cartridge, with the same
seed and inputs. It asserts finite particle caps and that exhaust cannot cover the road.

Shots: `tests/shots/games/grav/before/` and `after/`; the direct comparison is
`before/render/moving-native.png` versus `after/render/moving-native.png`.
`before/render/moving-no-particles-native.png` isolates the original exhaust fault. Full-room captures are
`after/room-title.png`, `after/room-race.png`, and `after/lean-back.png`.

Initial eight-craft comparison on software Chromium: native 320×240, rAF median **16.7 ms** and p95 **33.4 ms** both
before/after; render submission **0.170 → 0.173 ms**, **33 → 35 draw calls**, **17,304 → 21,288 triangles**.
The paired native twelve-ship review (`before/render/performance.json`, `after/render/performance.json`) retained
**16.7 ms median** rAF intervals; native p95 was **16.8 → 33.3 ms**. Blocking render-plus-GPU-finish time
was **0.30 → 0.30 ms median**, **0.50 → 0.50 ms p95**. Exhaust coverage fell from **8.59% to 0.36%**.
The final whole-room SwiftShader run (`after/performance.json`) recorded **16.7 ms median / 33.4 ms p95**,
matching the original whole-room baseline, with **0.313 ms** render submission,
**38 draws / 23,124 triangles**. Earlier whole-room samples reached 33.4/66.7 ms;
timing varies with the shared host. These are software-renderer measurements, not hardware FPS promises.

## Final review and gates

- Syntax checks and parody audit pass (zero authored text spans flagged).
- Simulation pass: all 48 circuit/class combinations, four league endings, every medal/blueprint/licence unlock,
  legacy personal data, duplicate Cast display names, compact live snapshots and ghost storage quota protection.
- Full `grav.mjs` pass: real keyboard actions, simulated standard gamepad, exact race refresh, Esc, Q/T, an
  unshortened three-lap race, eight-round league, endings, combat, ghost playback and all four touch layouts.
- `screen-focus.mjs --profile=desktop` passes the two-screen power-order, focus, LOCK IN and refresh regression.
- Native renderer review passes, including particle coverage/caps, every hull from two angles, twelve circuits,
  and a runner-up ending that correctly describes a lost league.
- Viewed the final 1366×860 and 1024×768 desktop shots, the in-room television, phone 390×844/844×390 and tablet
  768×1024/1024×768 captures. All retain 4:3; touch thrust and steering work, action buttons meet the size check;
  the original slab, green start-grid lamp blob and title/sign overlap are visibly gone.
- The default smoke run hit house-profile loading timeouts before the console check. An isolated `SMOKE_SCALE=2`
  retry passed signup, account/house, walk refresh, PC controls, console play, phone typing, prop refresh and Esc;
  the remaining broad house/mobile checks were stopped at the worker deadline, so a full smoke pass is not claimed.
  The standalone `tests/mobile.mjs` suite was not run; this game's four touch layouts passed instead. Physical hardware,
  actual two-device ghost synchronisation and human race balancing remain unverified.

## Next depth chunk

- Local two-player split-screen, with a second pad and an intentional phone/tablet arrangement; retain one simulation,
  stable native aspect and independent inputs. This is the remaining original-mode gap, not claimed as complete here.
- Human balancing of all four classes and combat licences; deterministic autopilot completion is not a substitute for
  owner play-testing. More rival personality and bespoke team engine timbres would make a further polish pass worthwhile.
