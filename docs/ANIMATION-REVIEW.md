# Family model and animation pass — review log

## Baseline

Branch `models`, baseline `2040234`. Production files were unchanged during research and baseline capture. `tests/models-animation.mjs --baseline` loads the HEAD rig in an isolated solid diagnostic stage with the game's three.js r128. It is a **rig probe**, not evidence of navigation or actual handle contact. Fixed random seed, lighting, 52-degree vertical field of view, 2 m / 4 m cameras, Low tier, 1366×860 desktop and 390×844 portrait projection. Each sequence records 0.10, 0.40, 0.80 and 1.40 seconds. Frames and labelled sheets: `tests/shots/models/before/`.

## Top ten defects, ranked before editing

1. **Contact fails to convey weight at starts and on stairs.** The first stride pulls the body into a conspicuous crouch; long stair reaches drop the hips dramatically. Sole orientation can also cut through a riser. Feet need contact-aware timing, not more bob.
2. **Standing up pops immediately upright.** All three are already standing in the first 0.10 s probe; the old seat disappears before the blend has finished. Sitting lacks a forward weight transfer.
3. **Mom's bob and Crystal's scalp look like moulded helmets.** Rear silhouettes are almost unbroken domes. The bunches are two egg shapes and the lower bob barely reacts.
4. **Heads are generic balls/eggs behind painted faces.** Dad needs a clearer jaw/temple distinction; Mom's chin is pointed; profile and rear cranium transitions lack deliberate form.
5. **Hands read as mittens.** A rounded tapered blob and a tiny thumb do not establish a palm, finger grouping or grip at 2 m. Carrying makes this especially obvious.
6. **Sideways adjustments and stationary turns skate.** The lateral probe drags a near-static pose across the floor. Both adjustment feet may be scheduled in one update; the support side needs an exclusive plant.
7. **Idle arms look too symmetrical and held away from the body.** Breathing and weight shift already exist, but the shoulders and elbows repeat the same stiff shape. Tiny continuous noise cannot substitute for a relaxed base pose.
8. **Props are attached rather than convincingly held.** The paper is supported by diagonal mittens across its back; generic door reach has no actual handle target. The carry probe is a pose only, without a carried object.
9. **Look-at eyes do not account for the head's current lag.** The original residual uses the requested head angle rather than the animated orientation; blinks jump straight between open and shut.
10. **Clothes and shoes are too uniformly smooth.** Cuffs and hems have thickness, but cloth has few structural folds; the sole colour is interpolated over the rounded upper rather than reading as a firm edge.

The 4 m captures make the priority clear: balance, silhouette and timing survive at distance; tiny surface marks do not. The phone captures retain sufficient projected size to see the same problems.

## Baseline cost

All figures include the six contact-shadow triangles. Two draws per character. Low near/far: Mom **2,598 / 1,582**; Dad work, home and weekend **2,886 / 1,806**; Crystal **2,882 / 1,746**. Every other Low costume also passes 3,000 (maximum 2,998).

Warmed serial browser CPU benchmark, median milliseconds per `rig.update` (13 batches of 2,000 frames, three rigs; rendering excluded): idle **0.02582**, walk **0.02942**, jobs **0.03660**, far **0.02688**. P95: **0.03320 / 0.04543 / 0.04207 / 0.03855** respectively. This shared host uses ANGLE Vulkan SwiftShader; these are rig CPU measurements, not real-phone GPU performance. Full raw samples: `before/metrics.json`.

The production-skeleton diagnostic also reproduces three defects independently of the screenshots: first-frame stand jumps of **28.50 / 36.61 / 9.65 cm** (Mom / Dad / Crystal), startup hip drops of **17.82 / 19.21 / 17.39 cm**, and **85 of 150 lateral frames with both adjustment feet airborne**, for each person. Existing steady flat-ground foot plants are already accurate (numerical error below 0.000001 cm); the fix must retain those locks. Raw measurements: `tests/shots/models/kinematics-before.json`.

## Results

Production changes: `app/public/js/np-rig.js` and a small foot-height callback in `app/public/js/np-life.js`. Navigation, saved-state formats, outfits, ages, audio and shared-world state are unchanged. The callback supplies solid tread heights to the rig while the body retains its navigation ramp.

| Rank | Result in this round |
|---|---|
| 1 | Short first strides reduce the flat-start hip dip below 8 cm. The house now supplies its visible 20 cm risers / 25 cm treads rather than the navigation ramp to foot IK. Planned forefoot/heel clearance, earlier uphill lift and earlier downhill horizontal placement prevent sole/riser intersections in both controlled stair directions. Heel/toe roll uses the sole contact as its pivot. |
| 2 | Fixed the first-frame stand pop by retaining the seat descriptor through the existing blend. Added forward counterbalance and retained continuous leg targets. |
| 3 | Improved, not exhausted: Mom has three original solid overlapping nape locks and a swept part; Crystal has a deeper rear part, shaped swept masses and tapered bunches. Existing hair bones add bounded settling after turns. |
| 4 | Improved existing head vertices: temple narrowing, jaw angle, rounder chin and fuller rear cranium. Faces remain painted and stylised. |
| 5 | Replaced family mittens with a palm, four grouped curled fingers and an opposing thumb. No new joints or draws. Static fingers still need grip-specific posing. |
| 6 | Fixed simultaneous adjustment-foot lifts; small steps anticipate actual lateral displacement and the hips shift toward the support foot. Root navigation remains authoritative. |
| 7 | Relaxed/asymmetric elbow and shoulder base pose, seeded breath rates. Existing gaze/idle variation retained. |
| 8 | Deferred: world-space handle targets and prop-specific grips require a separate contact pass. The generic reach/carry probes do not prove real object contact. |
| 9 | Eyes now cover the residual to the animated head, so the gaze leads a head turn. Blink closes/reopens through the atlas half-lid frame. Existing speech-mouth behaviour retained. |
| 10 | Deferred: no new cloth folds or sole construction in this round. |

Current Low near/far (including shadows): Mom **2,778 / 1,726** (+6.9% / +9.1%); Dad all outfits **2,958 / 1,890** (+2.5% / +4.7%); Crystal **2,954 / 1,830** (+2.5% / +4.8%). Every other outfit remains unchanged. All stay below 3,000 and +25%; still two draws.

The paired AB/BA benchmark in `tests/models-perf.cjs` measures all three production rigs in one JS process, with the same r128 math, seeded states and stubbed atlas painting. Sixteen alternating 2,000-frame batches follow 3,000 warmup frames. Median **ms per frame for all three**: idle **0.07197 → 0.06725**, walk **0.07905 → 0.07374**, jobs **0.09542 → 0.08496**, far **0.07978 → 0.06894**, stairs **0.07865 → 0.07331**. These are CPU costs, not whole-house render times or physical-phone GPU claims. Skipping unbuilt/settled prop transforms and calculating the prop easing once offsets added contact work. Raw samples: `tests/shots/models/paired-cpu.json`. A second paired mode executes the production house foot-height callback against the original navigation-ramp callback, with the same root ramp and floor-level changes: **0.09245 → 0.08545 ms per frame for all three** (−7.6%). This includes the new rectangular floor queries and tread arithmetic, but still excludes rendering. Command: `node tests/models-perf.cjs --only=house-stairs` (exit 0).

The final geometry diagnostic checks actual skinned sole vertices against solid 17.5 cm diagnostic risers and the house’s 20 cm risers, both with 25 cm treads, in both directions. It also executes the actual production floor callback across the upstairs/downstairs seam and checks that the space below the flight retains its downstairs floor. It records more than 100 planted contacts per person/direction, under 1.5 cm maximum support gap and no sole penetration; baseline intersections reach roughly 19–22 cm ascending and 12–17 cm descending. Flat stance points retain numerical precision. Stand-up first-frame displacement falls from **28.50 / 36.61 / 9.65 cm** to about **0.22 / 0.29 / 0.08 cm**. Side shuffles go from **85** double-airborne frames to **zero** in the same 150-frame path. These are controlled rig checks, not a claim that every house stair/seat path has been visually verified.

The separate full-house capture fixture produced Mom's real washing-up and kitchen-door frames, but its broad simulation setup was too slow on this shared host and was interrupted while preparing stairs. It is not a passing integration test. The controlled rig sheets remain the repeatable before/after reference; required game regressions are run separately.

### Visual review

Personally inspected all **48 baseline sheets**, all **12 model-shape batch sheets**, all **24 motion-batch sheets**, and all **48 final sheets**. Each final set contains 624 original frames from matching cameras/timestamps. The original full-house partial sheet was also inspected: the washing-up and door passages are useful context, but the stair camera loses Mom above its frame and is rejected as stair evidence. The repeatable rig sheets are explicitly labelled as probes.

At 2 m, the new palm/thumb/finger silhouette reads more clearly, and Mom's rear hair now has overlapping rounded ends. Crystal's bunches taper instead of ending as eggs. At 4 m, the relaxed shoulders and turn/stand balance matter more than finger detail. Both phone projection sizes retain these changes. The harsh remaining findings are the generic paper grip, dense scalp mass, smooth cuffs/soles and stair hip compression during a long double support. The head is still deliberately stylised; this pass does not claim a complete character-art overhaul. The fixed 2 m camera clips Dad's hair slightly in some raised poses; it was retained identically for comparison.

Portrait phone projection was reviewed; tablet and landscape art coverage and physical-device GPU measurements remain unverified. Controlled descent contact is covered by the skinned-geometry check, but final rendered sequences show ascent only.

## Next ten

1. Target each real door handle in world space, follow its hinge briefly and release cleanly.
2. Author paper/mug/sponge grip poses with finger contact and two explicit paper grip points.
3. Add broad cloth folds at elbows, knees and cuffs by reallocating existing geometry.
4. Give shoes a firm sole edge and better heel/toe silhouettes within the remaining budget.
5. Audit sit/stand contact against each real chair and sofa, including interruptions and refresh mid-transition.
6. Add restrained expression/gesture accents at conversational beats without changing the audio system.
7. Let stair gaze anticipate the next tread and inspect continuous descents from actual player cameras.
8. Refine stationary-turn anticipation and foot order at 45/90/180 degrees without changing navigation.
9. Calibrate washing-up, reading and carrying wrist frames against their actual objects at all heights.
10. Complete the full matched in-house action matrix on phone/tablet portrait/landscape, plus a physical weak-device GPU profile.

## Validation ledger

All tests use throwaway state under `/tmp`, on localhost ports 18080–18099, one browser at a time. Own child servers are terminated by their PID. No deploy, commit, live data or version changes.

| Exact command | Result |
|---|---|
| `node --check app/public/js/np-rig.js` | Exit 0. New JS evidence tools also pass `node --check`. |
| `for f in tests/*-unit.cjs; do node "$f"; done` | All 49 exit 0; per-file ledger `/tmp/jhp-model-unit-results-final.tsv`. The newly seeded production-rig diagnostic was then rerun separately: exit 0. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; 0 authored spans in 0 files. |
| `node tests/characters.mjs --only=day,space,bump` | Exit 0, 3/3. Three simulated days / 77,760 ticks; no overlap failures; longest recorded blockage 1.0 s. |
| `FIXTURE_DEBUG=1 FIXTURE_RASTER_RATIO=0.25 timeout -k 10s 240s node tests/models-gate.mjs --only=voices` | Exit 0. Child `node tests/voices.mjs http://127.0.0.1:18081 --only=speak,two`: exit 0, 2/2 (149.7 s). |
| `node tests/models-animation.mjs --label=before --baseline` | Exit 0, 624 frames. |
| `node tests/models-animation.mjs --label=model-shapes --only=idle,rear,carry` | Exit 0, 144 intermediate frames. |
| `node tests/models-animation.mjs --label=motion --only=walk,side,stairs,stand,rear` | Exit 0, 240 intermediate frames. |
| `node tests/models-animation.mjs --label=after` | Exit 0, 624 final frames, zero browser errors/warnings recorded. |
| `node tests/models-rig-unit.cjs --baseline` / `node tests/models-rig-unit.cjs` | Both exit 0; baseline records defects, after enforces contact/budget acceptance. |
| `node tests/models-perf.cjs` | Exit 0, paired measurements recorded above. |
| `python3 tests/models-sheets.py before` (also `model-shapes`, `motion`, `after`) | Exit 0 for each. All resulting sheets personally viewed. |

The first broad browser queue was terminated after 600 s (exit 143) before completing its first voice case. An isolated native-resolution voice retry reached standing but exceeded the 240 s wrapper (exit 124); the functional retry above passed using the fixture's existing raster cap. This cap changes drawing resolution, not layout, production animation or assertions; its screenshots are not native-resolution art evidence. No phone performance claim uses the cap. The three initial broad in-house capture attempts were interrupted (exit 130), not reported as passing.

Remaining required regression outcomes are appended below as each finishes. A missing result is not a pass.

- `FIXTURE_DEBUG=1 FIXTURE_RASTER_RATIO=0.25 MODELS_TEST_TIMEOUT=240000 timeout -k 10s 270s node tests/models-gate.mjs --only=door-walk`: exit 0. Child `node tests/door-walk.mjs http://127.0.0.1:18081`: exit 0, every tested door in both directions, standing eye height retained (121.5 s).

- `FIXTURE_DEBUG=1 MODELS_TEST_TIMEOUT=240000 timeout -k 10s 270s node tests/models-gate.mjs --only=identity`: exit 1. Child `node tests/identity-house.mjs --case=sarah`: exit 1 after 71.1 s, waiting for Create Account click/navigation. Isolated repeat `MODELS_TEST_TIMEOUT=240000 timeout -k 10s 270s node tests/models-gate.mjs --only=identity`: exit 1 after 59.0 s, again timing out on the same click before the house assertions. Not reported as an identity pass or attributed to the rig change.

- `MODELS_TEST_TIMEOUT=240000 timeout -k 10s 270s node tests/models-gate.mjs --only=mobile`: exit 1. Child `node tests/mobile.mjs http://127.0.0.1:18081 --only=perf`: stopped at the runner’s 240 s limit, then reported context closure and 0/1. No valid performance result was collected; a longer isolated native-resolution retry follows.

The first phone perf attempt did finish its 4×-CPU leg before interruption: software-host frame median 600 ms / p95 950 ms, render median 32.7 ms, 70 draws / 117,924 scene triangles, family enabled, tier high at 0.85 scale (832,932 pixels). Its 1× leg did not finish. This partial result is archived as `tests/shots/models/mobile-first-partial.json`; it is neither a passing test nor a physical-phone baseline comparison.

- `MODELS_TEST_TIMEOUT=360000 timeout -k 10s 390s node tests/models-gate.mjs --only=mobile`: exit 1 after 360.2 s. The longer isolated native-resolution retry also reached the runner limit and reported context closure (0/1); no complete phone perf pass. Partial output is archived as `tests/shots/models/mobile-retry-partial.json`.

The narrower native in-house stair attempt (`FIXTURE_DEBUG=1 timeout -k 10s 150s node tests/models-house.mjs --label=before --baseline --people=mom --states=stairs --devices=desktop`) also exceeded its wrapper (exit 124). Inspection found its replacement camera outside the front wall, so these images are explicitly rejected, moved to `tests/shots/models/rejected-house-attempt/`, and not used as evidence. The incomplete capture prototype was removed from the working tree; the reliable rig probe remains. The full in-house action matrix is **not verified**.

The first bonfire run used `BONFIRE_RESUME_LOGIN=1 FIXTURE_DEBUG=1 FIXTURE_RASTER_RATIO=0.25 MODELS_TEST_TIMEOUT=360000 timeout -k 10s 390s node tests/models-gate.mjs --only=events-bonfire`. It was deliberately interrupted (exit 130) after successful carry/stack assertions while producing optional day/night screenshot pairs. A fresh full interaction/assertion run follows with the existing `BONFIRE_NO_SHOTS=1` option; this changes capture coverage and is recorded explicitly.

All 49 `*-unit.cjs` files were rerun **after** the production tread callback, using `for f in tests/*-unit.cjs; do node "$f" > "/tmp/jhp-model-unit-logs/${f##*/}.log" 2>&1 || exit; done`: exit 0. Syntax checks on every remaining touched JS file and `git diff --check` also exit 0. The character day/space/bump browser pass preceded the final floor callback; that callback has independent house-dimension and seam checks.

- `BONFIRE_RESUME_LOGIN=1 BONFIRE_NO_SHOTS=1 FIXTURE_DEBUG=1 FIXTURE_RASTER_RATIO=0.25 MODELS_TEST_TIMEOUT=360000 timeout -k 10s 390s node tests/models-gate.mjs --only=events-bonfire`: exit 1. The full test attempt completed preparations and reached the display finale, then hit the 360 s runner limit during the post-display reload. Child `node tests/events-bonfire.mjs http://127.0.0.1:18081`: exit 1, context closed at timeout. Cleanup/catch-up/phone end cases remain unverified; this is not a pass.

### Exact house-riser visual supplement

`node tests/models-animation.mjs --label=stairs20-before --baseline --only=stairs --stairs-rise=20` and `node tests/models-animation.mjs --label=stairs20-after --only=stairs --stairs-rise=20` both exit **0**, each with 48 frames, two character draws, and no recorded browser errors/warnings. `python3 tests/models-sheets.py stairs20-before` and `python3 tests/models-sheets.py stairs20-after` both exit 0. These are solid diagnostic stairs with the house's 20 cm rise / 25 cm going, not a claim of real-house navigation coverage.

Personally inspected all 12 paired before/after sheets (`tests/shots/models/paired20-sheet-*.jpg`), covering every frame in these two supplements: all three family members, desktop / phone portrait, 2 m / 4 m. Foot landings clear the risers and the long reaching crouch is reduced; a deliberately stylised bent-knee double-support pose remains. Full-body motion and silhouette still read at 4 m. The supplement adds 96 captured frames to the 1,248 primary before/after frames (plus the earlier intermediate batches). Some extreme Dad shoe positions are cropped at 2 m; the identical cameras were retained.

### Scope and remaining risks

The final source changes stay in the rig and its small contact-floor callback. No navigation, outdoor/cupboard models, persistence schema, real data, account balances, audio, version, changelog or AGENTS changes. Pre-existing untracked `app/public/audio/voice` was left untouched. No deploy, Docker, commit or push.

The requested full matched **in-house** action matrix was not completed; the probes are the reliable matched art evidence. Native landscape/tablet art, every real seat/prop/handle contact, stair turns/interruptions and refresh mid-NPC-transition remain unverified. All available outfit geometries/budgets are checked, but every seasonal outfit was not separately art-reviewed. No physical weak phone was profiled. Identity fails before house assertions; phone performance and bonfire are incomplete at their imposed limits. Those failures must not be read as passes. The current stair callback matches the present 25 cm / 20 cm house construction; future stair geometry changes must update that contact profile.

### Final smoke result and stopping point

`FIXTURE_DEBUG=1 FIXTURE_RASTER_RATIO=0.25 MODELS_TEST_TIMEOUT=430000 timeout -k 10s 460s node tests/models-gate.mjs --only=smoke`: exit **1**. Child `node tests/smoke.mjs`: exit **1**, **11/12 passed**, 333.4 s. Passed: sparse-signup, account-house, pc-controls, console-game, phone-typing, prop-refresh, escape-menu, canonical-views, mobile-desktop, browser-errors and server-log. Only **walk-refresh** failed: its wait for loading/profile readiness expired, with mode still `walk` and the loading marker still present. Its state-preservation assertions were not reached. It was not rerun in isolation before the time stop, so the cause is unclassified; this is a recorded timeout, not a diagnosed rig bug.

The phone smoke case did pass shared account/prop state, portrait-to-landscape context survival and the chosen JackOS-only refresh path. This does not turn the separate incomplete phone performance gate into a pass. Canonical smoke screenshots are functional capture coverage, not additional native-resolution character-art review.

Final `for f in app/public/js/np-{rig,life}.js tests/models-*.mjs tests/models-*.cjs; do node --check "$f" || exit; done`, `node --expose-internals tests/parody-audit.cjs` and `git diff --check`: all exit **0** (parody replacements **0**). Branch remains `models`. All owned server/browser runners have finished and cleaned up their disposable state. Stopped new work at the 90-minute mark, leaving the final ten minutes of the requested budget unused. No test is represented as passing without a completed successful result.

## Round 2 — 4 November 2026

Base: `e5d6d5d9b0eec7c4c3f6236052bdcab570edb05a`, the merged `models` HEAD containing live round 1. No deployment, commit, version change or live-data access. Further primary-source research is appended to [ANIMATION-RESEARCH.md](ANIMATION-RESEARCH.md). The useful ideas were staged whole-shoe clearance, explicit object-space contact windows, prop-first grip anchors, chair-relative support, broad authored garment folds and selected speech accents followed by holds. All implementation and geometry are original, using the existing r128 helpers.

### Harsh review: the ten most conspicuous problems

| Rank | What looked cheap | This round |
|---|---|---|
| 1 | The trailing heel shot up before the foot came forward on stairs. | Fixed: shorter stair strides, separate intermediate/final tread heights, 2 cm ascent / 3 cm descent clearance and a higher swing-knee direction. Stair gaze follows the flight. Whole skinned soles remain clear. |
| 2 | A hand reached into space beside the closed door, then ignored the hinge. | Fixed: lever anchors exported from the original solid model; a small family callback reads their actual world transform. Adult overhand and child underhand reaches shift weight, follow the initial swing, then release. Routes are unchanged. |
| 3 | The newspaper chased the average of the hands, so neither grip was reliable. | Fixed: an independent folded-paper frame and two grip anchors on its real surface; world-oriented wrists and finger closure. The frame is high/close enough for Dad's actual arm lengths. |
| 4 | Washing wrists and the sponge sat too low and too far outside the real bowl. | Improved: the scrub path reaches into the existing basin, with a stable wrist and closing fingers. Native in-house profile/far views replace the unhelpful rear-only probe. |
| 5 | Feet could sit underneath the sofa's projecting front plinth. | Fixed for adult family seat poses: pelvis moves forward inside the rig and ankles target the clear floor ahead of the actual upholstery. Saved roots/seat anchors do not move. Child sofa perch remains distinct. |
| 6 | Interrupting a sit could leave a seated rig travelling along a route, or jump back to the seat before standing. | Fixed: an interrupted descent becomes a stand from its current root and current blend. Support feet remain in world space. |
| 7 | Refresh discarded an unfinished sit/stand and restarted another pose. | Fixed: optional transition phase, original root interpolation and support contacts join the existing local family save. Older saves still work. Nine person/seat combinations exercise sit restore, interruption and stand restore; a real page reload also checks a naturally scheduled mid-sit. |
| 8 | Sleeves and trousers read as smooth tubes, particularly at cuffs and knees. | Improved: existing rings form broad cuff, elbow and knee changes. No runtime cloth simulation or additional garment topology. |
| 9 | Shoes looked melted into their soles. | Improved: capped outsole/welt/toe rings and a simpler ankle collar, reallocating polygons. Near Low loses 16 triangles per family member; Low far meshes retain their prior cost. |
| 10 | Speech arms waved continuously and negative stationary turns always started with the same foot. | Improved: a first phrase accent and selected later accents have holds, small nods and painted expression changes. Signed 45°, 90° and 180° turns lead with the appropriate foot and preserve exclusive support. No audio code changes. |

### Measurements and their limits

The actual r128 skeleton/skin tests inspect sole vertices, support-foot world positions and grip frames, not just requested IK points. Established-flight shin angles exclude the artificial first half-second of a mid-flight diagnostic teleport; house sequences start from the real upper/lower landing. No penetration checks are excluded. Positive shin angles below mean the ankle is below the knee.

| Measure | Before | After |
|---|---:|---:|
| Extra stair arc above the planned tread | 11 cm | 2 cm up / 3 cm down |
| Minimum trailing shin angle, house ascent: Mom / Dad / sister | −27.7° / −16.6° / −22.0° | 23.6° / 21.2° / 10.1° |
| Minimum trailing shin angle, house descent: Mom / Dad / sister | −17.3° / −10.9° / −5.9° | 28.9° / 32.5° / 16.2° |
| Whole-sole penetration, all tested flights/directions | Already guarded in round 1 | 0 cm |
| Stand support drift, worst frame | 1.27–2.33 cm | Below numerical precision |
| First-frame horizontal jump after interrupting a sit | 0.49–0.99 cm | Below numerical precision |
| Adult/child turn lead at negative 45° / 90° / 180° | Always left | Right, with one foot planted |
| Low near triangles including shadow: Mom / Dad / sister | 2,778 / 2,958 / 2,954 | 2,762 / 2,942 / 2,938 |
| Low far triangles including shadow: Mom / Dad / sister | 1,726 / 1,890 / 1,830 | Unchanged |
| Skinned draws per person | 2 | 2 |

Finger flexion reuses two reserved bones previously unused by the painted eyelids. Bone count, shader attributes, material count and draw count do not increase. All existing outfits, Halloween visitors and both distance meshes are checked; no Low/Potato person exceeds 3,000 triangles. House captures use the automatic production tier, which can differ from the explicitly Low rig probe. Desktop is 1366×860; phone is a 390×844 touch-emulated viewport. These are shared-host Chromium/SwiftShader captures, not measurements from physical phones.

### Evidence

`tests/shots/models/r2-before/house/` contains the matched HEAD house sequences. `r2-batch1/house/` records the complete initial nine-action matrix (walking, ascending, descending, door, job, sitting, standing, talking, carrying): 432 native frames, three people, two viewports, two cameras, four times. `r2-after/house/` recaptures the seven affected actions after the final contact/stair/seat batches. Walking and mug carrying also have the batch-1 captures. The stage probe in `r2-probe/` adds unobstructed Low models at exact 2 m and 4 m, including separate 45°/90°/180° turns and descending stairs.

House camera positions and actual ranges are in each `report.json`. Most near views are around 2 m and far views around 4 m; the full diagonal view up the flight is 4.5–5.4 m. The corrected HEAD cameras stay inside the actual house; the forty unmatched after lounge frames are not accepted as matched evidence. Earlier blocked landing/door calibration frames were rejected and are not acceptance evidence. A real refresh preserved the sister's root, goal, `sit` phase and blend exactly in the captured snapshot; nine seat combinations also restore both transition directions through the same production save/restore functions.

Functional regression runs may use the fixture's 0.25 raster cap to keep shared software rendering timely; all house and Low probe art captures are uncapped. The paired CPU benchmark measures all three family rigs per update without rendering. It is not GPU frame time or a physical-phone FPS claim.

### Round 2 completed checks and CPU cost

Paired AB/BA benchmark, all three Low family rigs together, milliseconds per update (16 batches after warm-up):

| Mode | HEAD | After |
|---|---:|---:|
| Idle | 0.07245 | 0.07744 |
| Walking | 0.07554 | 0.08464 |
| Jobs | 0.08717 | 0.08654 |
| Far | 0.07714 | 0.07875 |
| Stairs | 0.07922 | 0.08604 |
| Stairs with real tread callback | 0.08547 | 0.09285 |

The largest added median is 0.00910 ms for all three rigs. No physical-phone GPU time was measured. Raw paired results: `tests/shots/models/r2-paired-cpu.json`. Newspaper palm-to-folded-surface error falls from 17.953 cm to 0.0797 cm. Settled closed-door lever contact is within numerical precision for adults and 0.02 cm for the sister; the child follows the early hinge swing within 0.86 cm before releasing. These measure palms, not complete finger-pad penetration.

Every result below is round 2, superseding no failed round-1 result silently:

| Actual command | Result |
|---|---|
| `node --check` on all eight touched JavaScript files | Exit 0 |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; 0 replacement spans |
| `python3 tests/models-units.py` | Exit 0; all 50 `*-unit.cjs` scripts; exact individual commands/results in `tests/shots/models/r2-unit-results.json` |
| `node tests/models-rig-unit.cjs` | Exit 0, including final head/door clearance assertions |
| `node tests/models-rig-unit.cjs --baseline` | Exit 0; baseline measurement mode |
| `node tests/models-perf.cjs` | Exit 0; paired CPU results above |
| `node tests/models-animation.mjs --label=r2-probe --only=stairs,stairs-down,turn45,turn90,turn180,job,carry --skip-perf --stairs-rise=20` | Exit 0; 336 frames / 24 sheets |
| `node tests/characters.mjs --only=day,space,bump` | Exit 0; 3/3, 145.294 s |
| `node tests/people-pass.mjs --desktop --skip-perf` | Exit 0; all cases, 337.412 s |
| `node tests/door-walk.mjs http://127.0.0.1:18080` | Exit 0; 94.971 s |
| `node tests/voices.mjs http://127.0.0.1:18080 --only=speak,two` | Exit 0; 2/2, 106.166 s |
| `node tests/smoke.mjs` via the model gate | Incomplete: parent runner exited 143 after sparse-signup passed; no complete smoke result |
| `node tests/events-bonfire.mjs`; `node tests/identity-house.mjs --case=sarah` | Not run this round |
| `git diff --check` | Exit 0 |

Browser regression commands ran serially through `tests/models-gate.mjs` with disposable `/tmp` data and owned server PID cleanup; completed server checks found no mod-load failures. Functional runs used `FIXTURE_RASTER_RATIO=0.25`; characters/people-pass also used `SMOKE_SCALE=1.3`. Art captures used native raster. An earlier non-TTY characters/people-pass run ended 143 and was superseded by the successful isolated, monitored serial rerun. The smoke interruption was not diagnosed as an application bug and was not rerun before the stop.

Personally inspected all 24 Low probe sheets and all 24 final seven-action house sheets. Comparison review caught far lounge cameras outside the valid floor in several HEAD views; those were rejected. HEAD was recaptured from a valid interior camera, but the matching after recapture did not complete before the stop. Forty far Mom/sister lounge frames consequently remain unmatched and are excluded from the paired comparison sheets. Raw records retain camera coordinates/ranges. Desktop and portrait-phone matrices are present; landscape/tablet and physical weak-phone performance remain unverified. The real reload assertion covers one naturally scheduled sister mid-sit; both-direction transition restoration for nine family-seat combinations is an API check, not nine real browser reloads. Movable dining/desk chairs, finger-pad penetration on every prop, every seasonal outfit's visual appearance, and exhaustive interrupted door contacts remain next-round work. No deployment or commit was performed.


### Next ten

1. Bind NPC sitting to additional movable dining/desk chairs using their real surfaces, without adding family routes in this branch.
2. Give the sister an authored armchair perch and test upholstery clearance there as closely as her sofa perch.
3. Add hand support on armrests/thighs during the weight transfer into/out of seats; retain interruption continuity.
4. Extend explicit grip frames to the magazine, drawing pad/crayon, watering can and briefcase; add object-surface penetration checks for finger pads.
5. Keep the newspaper's object frame stable throughout its fade/put-down and add an original page-turn gesture.
6. Exercise NPC door reaches from both sides of every leaf, including fast interruptions and a player closing a moving door.
7. Check entire-flight stair sequences and the first/last tread on physical weak phones, including tight clothes/shoe clearances at the top seam.
8. Add wider conversational emotion/gesture choices and longer matched samples, including a held mug while the other hand gestures.
9. Give broad cloth folds better compression when deeply seated, without additional polygons or a cloth solver.
10. Profile actual low-end phone GPU frame time and sustained thermals; keep the current deterministic CPU/triangle gates as separate evidence.

Stopped new work at the 90-minute cutoff (21:27 UTC). Final comparison regeneration excludes camera mismatches; the complete regenerated comparison collection was not individually re-reviewed before stopping. All 24 Low probe and 24 seven-action house sheets were reviewed earlier; forty far lounge frames remain unmatched.
