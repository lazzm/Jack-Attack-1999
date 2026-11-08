# Family model and animation pass — review log

Current: round 6, faces that talk and feel, is appended below. Earlier round findings, measurements and unfinished work remain as dated history.

## Round 1 baseline — historical

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

## Round 1 carry-over list — historical

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


### Round 3 starting priorities — rewritten before implementation

These are remaining defects/coverage gaps, not a claim that already-shipped contact and persistence work is absent.

1. Replace Dad's rigid early sit/stand silhouette with a hips-first descent, forward chest counterbalance and a reachable support hand; preserve interrupted transitions.
2. Inspect actual newspaper finger contact from the player's front/oblique view, including grip visibility and put-down continuity.
3. Bind/test the rig against every real indoor chair and sofa surface (including movable seats), clearly distinguishing NPC production transitions from player-seat tests.
4. Complete the forty previously unmatched far lounge frames with identical HEAD/after cameras and times; reject invalid captures explicitly.
5. Give the three family walks distinct weight, pelvis/shoulder opposition and stabilised heads; preserve planted contacts and route safety while easing actual speed.
6. Make near idle weight/breath/glance motion read without synchronised loops; disable cosmetic additions at distance.
7. Broaden the neck-to-shoulder silhouette using existing polygons and review rear/side views; improve secondary hair response without extra draws/bones.
8. Refine painted talking shapes and brow/eye beats from the existing voice signal, without changing audio playback or voice files.
9. Capture/review the real-house action matrix in phone portrait, landscape and tablet layouts, retaining matched desktop evidence.
10. Finish the required regression queue, especially bonfire and complete smoke, and report fresh triangle/paired CPU measurements separately from unmeasured physical-phone GPU performance.

Round 2 stopped new work at its 90-minute cutoff (21:27 UTC). Its final comparison regeneration excluded camera mismatches; forty far lounge frames were still unmatched at that round’s stop. Round 3 replaces that incomplete evidence below.


## Round 3 — 5 November 2026

Base: `fd98f5dbb55bcbb03f561c8e1b8ec16ae925b3f1` (merged live 2.70.0). The round-3 starting priorities above were written before production changes; the current next ten below replaces the historical carry-over list. Research began at 05:04 UTC; implementation starts only after the requested approximately fifteen-minute research period. Original research synthesis and primary-source links are appended to ANIMATION-RESEARCH.md.

### Initial harsh review, ranked

1. Dad's first sit frame has a nearly upright chest and hands prematurely hovering at his waist; standing starts by rising before adequate forward weight transfer.
2. The paper obscures the important finger contact from the normal player view; a palm anchor alone cannot verify a grip. The current skin has fingers on both sides of a leaf plane away from its edge.
3. Only three production family seat anchors were covered; the actual centre sofa cushion, four kitchen chairs, office chair and beanbag need explicit real-surface testing. The sister's deep armchair perch is not calibrated.
4. Forty far lounge after frames lacked a matching valid HEAD camera. Fresh baseline capture now uses one shared camera set.
5. Dad is the fastest family member (104 cm/s versus Mom's 98), and the same pelvis/arm parameters blur the three personalities.
6. Walking head movement follows the torso too closely in some frames; extra bounce should not shake the gaze.
7. Near idle has small existing weight/breath/glance motion, but there are long stiff holds and new idle detail must be disabled at distance.
8. Thin cylindrical necks and abrupt shoulder taper weaken the large-head silhouettes from side/rear views.
9. Hair lag exists, but its input uses the requested look angle rather than the actual animated head; left/right parts settle together.
10. Four painted mouth frames already follow recorded loudness, but brows remain static and expression accents can run independently of audible beats. Landscape/tablet real-house coverage is also still missing at the start.

### Ranked-review disposition

1. **Improved:** early chest counterbalance, retreating hips, delayed rise and real armrest support; armless push-offs remain limited.
2. **Fixed at the reviewed reading pose:** visible paper-edge fingers, measured against the actual skinned leaves; full finger-volume clearance and put-down remain open.
3. **Coverage completed:** all 30 person/seat combinations, both API restore directions and interruption, plus nine old-phase conversions and one real page reload. Arbitrary moved-chair layouts remain open.
4. **Fixed evidence gap:** complete 864-frame HEAD and final sets, including the forty former far-lounge gaps, with exact camera/aim/time checks.
5. **Improved:** individual speeds and pelvis/shoulder/arm weight; existing controller acceleration/braking retained.
6. **Improved:** head stabilisation measured on the real skeleton while preserving explicit look targets.
7. **Improved:** seeded near weight swaps, breathing and glances; far cosmetic motion skipped.
8. **Improved:** broader flared neck base and gentler existing shoulder rings, unchanged triangles.
9. **Improved:** actual-head-driven hair lag with distinct left/right settles; modest two-bone motion, no strand simulation.
10. **Improved and coverage completed:** recorded-level mouth/brow accents plus matched portrait, landscape and tablet house matrices. Emotional/phoneme timing and physical device profiling remain open.

### Changes and verification

The early seat pose now separates pelvis retreat, lowering and chest counterbalance. A support hand targets an actual armrest or seat lip only when reachable; it does not stretch to a chair behind a standing figure. Rising includes an initial forward transfer before root travel. Existing seat anchors and routes are retained. New transition saves retain exact roots and a motion marker; old phase times convert to the revised curves. Normal seated/standing saves and outfit IDs keep their existing format.

Model construction exports three sofa-cushion surfaces, the armchair, four kitchen-chair surfaces, plus person-seat dimensions on the existing movable office chair and beanbag. This is contact metadata, not new family destinations. The test stages the original production controller against each real model. It pulls the office chair clear of its desk only in temporary fixture data. It does not assert that the family now schedules visits to these additional seats or that routes to every chair were added.

The folded newspaper is 44 cm wide instead of 52 cm, retaining two solid folded leaves and identical topology. The existing hands now grip the visible outside edges. The skinned-finger test measures the real paper triangles, with about 0.008 cm nearest surface separation and 29 of 75 sampled finger vertices beyond each leaf silhouette, versus no beyond-edge vertices in the old grip. This is a surface/visibility diagnostic; it does not prove every soft finger volume is intersection-free.

Dad walks at 92 cm/s (was 104), Mom 106 (was 98), sister 102 (was 96), using distinct pelvis and arm amplitudes. The original follower still accelerates, brakes and clamps at doors/bodies. The short descending-start correction prevents an already advanced foot being pulled back up a tread. Whole-sole stair acceptance remains zero penetration. Head stabilisation opposes the walking torso without overriding explicit player/object/stair gaze. Quiet seeded weight changes, breathing and glances run near; far rigs skip these cosmetic details and keep support/action motion.

The existing neck rings have broader bases and the upper torso rings form a gentler shoulder slope. No polygons, bones, skin attributes or character draws are added. Mom's hair ends and the sister's bunches use actual animated head heading for bounded lag, with slightly different left/right settles. A painted brow offset and faster mouth attack use the existing recording's level; no audio playback, voice text or voice assets change.

Completed at this point: all 52 `*-unit.cjs` scripts exit 0; parody audit exits 0 with 0 spans; rig contacts/outfit/LOD budgets and the new actual-skin weight, paper and voice checks pass. All 30 person/seat combinations passed sit restoration, interruption and stand restoration. Nine production family-seat combinations also passed conversion of old saved phases, and a real page reload preserved a naturally scheduled sister mid-sit. The seasonal family goal is suppressed only inside that standard-routine reload fixture, since 5 November otherwise sends the family to the bonfire; dedicated bonfire regressions use the real seasonal code.

The original upstairs seat-camera level was wrong and those images were rejected. Corrected upstairs captures use the real bedroom level; a final replacement also hides the fixture's parked background relatives and uses a clear side view of the beanbag. The staged captures hold the house in its existing focus mode while the production family controller is stepped explicitly; they are not a live walking-camera recording. Some near landscape frames crop lower legs, so far views and the unobstructed Low probe are necessary for foot review. Native house baseline capture contains 864 frames across desktop 1366×860, phone portrait 390×844, phone landscape 844×390 and touch tablet 1024×768, near/far, all three people and nine actions. A 12-minute first capture limit interrupted the tablet section (exit 1); the isolated append/fill run completed the set (exit 0). This was a capture-runner limit, not a page-load defect.

### Round 3 measurements

The early seat angles/hip positions below use the deterministic actual-skin rig test with a 57 cm starting offset. They use a fresh identical random seed for each person in both versions; they are mechanics measurements, not angles extracted from the house screenshots. Each real seat is separately staged against its own surface.

| Measurement | HEAD | After |
|---|---:|---:|
| Dad chest lean at 0.10 s sitting | 4.27° forward | 14.41° forward |
| Dad hips, forward position at 0.10 s (start = 57 cm) | 57.51 cm | 49.71 cm |
| Dad chest lean at 0.10 s standing | -0.97° | 8.63° forward |
| Walking head-pitch range: Mom / Dad / sister | 5.79° / 5.79° / 5.74° | 0.96° / 1.01° / 0.99° |
| Low near triangles incl. shadow: Mom / Dad / sister | 2762 / 2942 / 2938 | Unchanged |
| Low far triangles incl. shadow: Mom / Dad / sister | 1726 / 1890 / 1830 | Unchanged |
| High near triangles incl. shadow: Mom / Dad / sister | 5214 / 5502 / 5522 | Unchanged |
| Skinned draws per person | 2 | 2 |
| Whole-sole penetration on tested 17.5/20 cm stair flights, both directions | 0 cm | 0 cm |
| Far cosmetic pelvis/breath range | Nonzero | Numerical zero |

The paired CPU benchmark runs all three Low family rigs together, no renderer, 16 AB/BA batches after warm-up. The browser was closed during this run. Times below are milliseconds per update for **all three**, not GPU frame time or a physical-phone FPS result.

| Mode | HEAD | After |
|---|---:|---:|
| Idle | 0.077000 | 0.077031 |
| Walking | 0.069339 | 0.080292 |
| Jobs | 0.051448 | 0.050357 |
| Far | 0.076759 | 0.068063 |
| Stairs | 0.093300 | 0.088354 |
| Real stair callback | 0.091000 | 0.094306 |

Final paired run after caching the unchanged wash-up targets: walking adds 0.010953 ms for all three rigs (15.8% of the isolated median); far updates save 11.3%, jobs save 2.1%. Shared-host scheduling produces visible batch variance; these are measured medians, not a guaranteed phone budget. The benchmark ran with the browser closed. No character topology, bone count, skin attributes or draws increase. Raw results: `tests/shots/models/r3-paired-cpu.json`, `r3-kinematics-before.json`, `r3-kinematics-after.json`, `r3-weight-before.json`, `r3-weight-after.json`. Every outfit/LOD budget is checked; every outfit was not separately art-reviewed.

### Round 3 evidence and test results

The matched final house set contains **864 frames**, as does HEAD: three people, nine actions, near/far, four times, desktop/portrait-phone/landscape-phone/tablet. `python3 tests/models-compare-r3.py` exits 0 and produces **72** paired sheets after checking identical camera positions, aims and times. The forty former far-lounge gaps are included. All 72 were inspected via the twelve `r3-review-house/overview-*.jpg` atlases, with native closer checks of Dad's reading/sit/stand and the stair silhouettes.

The real-seat set covers **30 person × seat combinations / 240 frames**, using every sofa cushion, armchair, four kitchen chairs, office chair and beanbag. All twelve seat sheets were inspected via `r3-review-seats/`; native close views were also checked. The office chair is pulled out in disposable test state only. An intermediate low-raster beanbag replacement inherited the functional gate's diagnostic cap and was rejected as final art evidence. The final native replacement exits 0, uses a clear front-oblique camera and replaces all 24 beanbag frames; all 240 final seat frames now use native raster. The three replacement beanbag sheets and native Mom close-ups were inspected again; Dad’s approaching standing head crops slightly in the 0.8 s close frame, so that frame is not accepted as a full-body silhouette check. The art harness explicitly rejects inherited raster caps.

The Low probe contains **576 frames / 36 sheets**, at exact 2 m and 4 m on desktop and portrait phone, covering idle, walk, stop, turn, rear, ascent, descent, sit, stand, jobs, carrying and talking. All 36 sheets were inspected via six `r3-review-probe/` atlases. The probe does not replace the real-house evidence or establish physical touch/GPU performance. Some close landscape house frames crop legs under the existing focus lens; matched far views and unobstructed probe views cover those foot poses.

The 52 final unit commands/results are preserved individually in `tests/shots/models/r3-unit-results.json`. The serial browser gate records every completed child command, real exit and duration in `tests/shots/models/r3-gate-results.json`. Functional browser runs use `FIXTURE_RASTER_RATIO=0.25`, `SMOKE_SCALE=1.3`, disposable `/tmp` data and owned server cleanup. Bonfire skips optional screenshots but retains its assertions, real inputs, refresh and date progression. Main house and probe art frames use native raster.

Earlier failures are retained honestly: the first baseline runner hit its capture limit (exit 1), an early seat interruption was blocked by the fixture's leftover conversation hold, and the first ordinary-routine reload could not start because the real 5 November seasonal goal superseded it. These fixture problems were corrected and the affected checks rerun. The descending-start sole unit caught a regression from the new walking speeds; the final tread guard fixed it and the full rig suite passed. An initial `git diff --check` found a trailing documentation blank line (exit 2); that is corrected. The first voice gate was 1/2 (exit 1): its exact coefficient-22 assertion rejected the intentional separate mouth attack/release rates. The assertion now verifies causal movement toward the consumed audio sample inside a bounded 18–40 response-rate window, rather than copying one implementation coefficient. The corrected full voice rerun result is recorded below. No page-load timeout has been classified as an application bug.

<!-- ROUND3_TESTS_BEGIN -->

| Actual command/check | Round 3 result |
|---|---|
| `node --check` on all ten touched JavaScript files | Exit 0 |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; 0 authored spans |
| `python3 tests/models-units.py` | Exit 0; 52/52, including strengthened visible-brow sampling |
| `node tests/models-weight-unit.cjs --baseline` | Exit 0; independent identical per-person seeds |
| `node tests/models-house-r3.mjs --label=r3-after` | Exit 0; 864 native frames |
| Real-seat production-controller capture/API checks | Exit 0 on corrected append runs; 30 surfaces/person combinations, 9 legacy conversions, 1 exact real mid-sit reload |
| `node tests/models-perf.cjs` | Exit 0; 34.124 s |
| `node tests/models-house-r3.mjs --label=r3-real-seats --seats-only --seat-matrix --seats=beanbag --devices=desktop --append` | Exit 0; 57.601 s |
| `node tests/models-animation.mjs --label=r3-probe --only=idle,walk,stop,turn,rear,stairs,stairs-down,sit,stand,job,carry,talk --skip-perf --stairs-rise=20` | Exit 0; 72.026 s |
| `node tests/events-bonfire.mjs http://127.0.0.1:18081` | Exit 0; 535.513 s |
| `node tests/voices.mjs http://127.0.0.1:18081 --only=speak,two` | Exit 1; 78.970 s |
| `node tests/door-walk.mjs http://127.0.0.1:18081` | Exit 0; 52.763 s |
| `node tests/characters.mjs --only=day,space,bump` | Exit 0; 91.943 s |
| `node tests/smoke.mjs` | Exit 0; 149.213 s |
| `node tests/people-pass.mjs --desktop --skip-perf` | Exit 0; 271.454 s |
| `node tests/voices.mjs http://127.0.0.1:18080 --only=speak,two` | Exit 0; 126.199 s |
| `node tests/models-gate.mjs --only=voices` | Exit 0; final correction/replacement |
| `node tests/models-house-r3.mjs --label=r3-real-seats --seats-only --seat-matrix --seats=beanbag --devices=desktop --append` | Exit 0; final correction/replacement |
| `python3 tests/models-compare-r3.py` | Exit 0; 72 exact matched sheets |
| `python3 tests/models-seat-sheets-r3.py` | Exit 0; 12 sheets |
| `python3 tests/models-sheets.py r3-probe` | Exit 0; 36 sheets |
| `git diff --check` | Exit 0 |

No identity browser or separate mobile-perf script ran this round. Physical phones, arbitrary chair moves and actual mid-stand page reloads are unverified. The required browser commands run serially. The initial serial runner exits 1 because its first voice oracle failed; all other requested browser children exit 0. The corrected complete voice rerun passes 2/2 and exits 0. Both voice results remain separate rows; no failed exit is silently replaced.
<!-- ROUND3_TESTS_END -->

### Round 3 carry-over list — historical

1. Calibrate armless-seat lip reaches further: when an arm cannot reach the surface safely, the current rig deliberately uses the relaxed fallback. Give that transfer a convincing thigh/seat push without arm stretch.
2. Replace the cupped resting lap hands with better thigh/armrest support and check finger-pad/self contact from several close angles.
3. Add full-flight stair interruptions and tight first/last-tread turns at a wider speed range; retain the whole-sole and no-heel-kick gates.
4. Profile physical weak-phone GPU time, sustained thermals and real touch behaviour; software-host CPU and emulated viewports do not establish these.
5. Extend the native real-house comparison to longer idle holds and dedicated start/stop/turn sequences beyond the main nine-action matrix and Low probe.
6. Add actual page reloads during standing and interrupted transfers at more seats; this round has API restore coverage for all ten surfaces, nine old-phase checks and one exact real mid-sit reload.
7. Exercise arbitrary moved/swivelled office-chair positions and saved furniture placement with the contact metadata, without adding family routes here.
8. Author more dialogue intent in the brow/eye/body accents. The current signal supplies loudness/progress, not phoneme timings or emotional labels.
9. Preserve the newspaper object frame during its fade/put-down and add a restrained original page-turn action.
10. Calibrate explicit magazine, drawing-pad/crayon, watering-can and briefcase grips against their full solid geometry and finger volumes.


## Round 4 — 6 November 2026

Base: `dbe892526f82b1d10f90ea0cd5976b31070695c1`, merged 2.72.1. Research starts 04:00 UTC; production remains unchanged during the fifteen-minute research/baseline window. Speech selection and the new no-repeat memory are outside this pass.

### Starting review, ranked before production edits

1. The forward arm extreme folds the forearm upward; Mom reads as carrying an invisible parcel. Dad and the sister share the same elbow formula.
2. The exposed neck remains a narrow vertical tube; the shoulder/collar join needs a larger, inclined base rather than another small width increase.
3. Both resting hands cup together above the lap instead of lying on separate supported thighs.
4. Armless and unreachable-armrest transfers lack a visible thigh push.
5. When paper is hidden for conversation, its frame switches to the moving hands and head, causing a pop during the fade.
6. The newspaper is static: no small leaf/page action supports the reading performance.
7. Stair acceptance lacks interruptions and tight first/last-tread turns; established straight flights alone are insufficient.
8. Actual page reload coverage remains one mid-sit, while the wider seat matrix only exercises save/restore APIs. The first restored bone pose also needs inspection.
9. Questions and sentence endings still share largely generic accents, despite the existing loudness/progress signal and player look target.
10. Magazine/pad/crayon/can/case contacts are not all calibrated against their solid geometry. Physical-phone GPU cost remains unmeasured.

### Implementation and acceptance record

Research findings for this round: preserve readable negative space around free arms, build neck mass into the shoulder silhouette, author support palms separately from handle hooks and edge pinches, and preserve an object's own frame when a hand releases. The source notes and limitations are in `ANIMATION-RESEARCH.md`. No downloaded code, models or textures are used.

All production work is in `app/public/js/np-rig.js`; family routes, speech selection/no-repeat memory, audio, furniture placement and save formats are unchanged. Existing neck/torso vertices are redistributed; a reserved, previously unweighted jaw joint now articulates an existing solid newspaper leaf. No bone, mesh, triangle or draw is added. Cached thigh, magazine and drawing poses replace avoidable allocations.

| Ranked finding | Change and acceptance |
|---|---|
| 1 — carrying-like free arm | Shoulder-driven swing, soft elbow and quiet wrist on all three. Actual skin measurements and first recaptures pass. |
| 2 — tube neck | Wider inclined neck, broad base, reshaped trapezius/collar rings and a matching Dad collar. Geometry/LOD/outfit checks pass; matched final house review pending. |
| 3 — cupped lap | Separate palm-down contacts follow the real solved upper thighs. Original rest-palm checks pass. |
| 4 — armless transfers | Those same thigh supports remain available through sit/stand; reachable existing armrests still take precedence. Real-seat recapture coverage is recorded below, not assumed. |
| 5 — paper release pop | Retain the last world-space paper frame while hands disengage; also retain the magazine frame. First release-frame translation is zero, including a separately moving root. |
| 6 — static paper | An original 8° hinged leaf movement uses existing geometry/joint capacity. This is a restrained leaf adjustment, not a complete page flip. The grip accompanies it. |
| 7 — interrupted stairs | Plan adjustment-step landing/clearance from the whole sole, lift before translating/rotating and lower after clearance. Actual skinned soles pass first/middle/last stops and turns in both directions at three speeds. |
| 8 — reload coverage | Initialise the first restored bone target correctly even at zero elapsed time. New real reload matrix exercises natural lounge routines; actual results below. |
| 9 — dialogue intent | Cache sentence boundaries/question intent at line start; consume existing audio loudness/progress for question brows and small terminal nods, and suppress addressed gaze breaks. Silent/ended mouth behaviour remains covered. |
| 10 — prop grips | Authored magazine edge frames, pad support underneath its edge, a crayon pinch/tip on the solid pad, closed can/case handle hooks. Actual solid-surface tests include thumb and finger volumes. |

Final measurements, browser exits, art review and the rewritten next ten follow after the serial gates.

### Before/after mechanics and geometry

| Person | Peak free-walk elbow bend | Highest wrist above hips | Low neck middle-ring width | Low near / far triangles, including shadow |
|---|---:|---:|---:|---:|
| mom | 58.2° → 18.1° | 14.8 → 3.7 cm | 9.3 → 11.4 cm | 2762 / 1726, unchanged |
| dad | 53.1° → 16.7° | 13.7 → 2.7 cm | 9.8 → 12.0 cm | 2942 / 1890, unchanged |
| sister | 57.5° → 15.9° | 14.1 → 4.3 cm | 9.6 → 11.2 cm | 2938 / 1830, unchanged |

Two skinned draws per person before and after: one body/props mesh and its existing contact shadow. Triangle change: **0%** on every checked outfit/LOD. High near remains Mom 5,214, Dad 5,502, sister 5,522. Low/Potato near remains within 3,000.

Dad’s first paper release changes from 14.62 cm / 10.03° to 0.00 cm / 0.00000°. A separately translated/turned root gives 3.55e-15 cm paper-frame drift. The solid leaf reaches 8.0°; the moving palm-anchor error peaks at 1.36 cm, so this remains a useful refinement target.

Resting-palm normal changes from upward-facing (about −0.83 against house-down) to **+1.00** on the thigh. A newly restored, zero-time seated blend retains its phase and clock while acquiring about **13° forward chest lean**, instead of the old upright bind pose.

Interrupted-stair acceptance: **216 scenarios** (three people × three speeds × two directions × four stop positions × three turn choices), checking actual skinned shoe-sole vertices through 150 stopped/turning frames each. Peak tread/riser penetration changes from **19.85 cm to 0 cm**. No two adjustment feet swing together; support-point drift is floating-point noise. This does not establish arbitrary 180° turns or route reversal/restart through the banister. A later settled-contact audit caught a regression in the conservative rectangular footprint: imaginary shoe corners could hold a foot 20.15 cm above the tread. The final planner samples the actual rounded outsole ring instead. The strengthened same 216-scenario test now checks hovering too: settled minimum sole clearance is 0.15 cm on every family rig, with zero penetration. The rejected intermediate measurement is retained in `r4-stair-interrupt-batch-rectangle.json`.

| Solid contact sample | Before | After |
|---|---:|---:|
| Magazine right finger gap | 3.40 cm | 0.06 cm |
| Crayon thumb gap | 1.52 cm | 0.05 cm |
| Can finger gap | 0.52 cm | 0.02 cm |
| Briefcase finger gap | 0.12 cm | 0.03 cm |
| Pad supporting finger gap | 3.37 cm | 0.07 cm |
| Crayon tip above pad top | 11.90 cm | 0.04 cm |

These are nearest actual solid-surface/skin-vertex gaps, not proof of an anatomical, collision-free hand. Can/case thumb gaps remain about **1.3 cm**; the magazine, pad and crayon measured thumb gaps are below 0.1 cm. The pad palm supports the underside of its edge. The crayon’s former roughly 12 cm hover is removed.

Original expression acceptance compares equal-length questions/statements against the same loudness/progress trace. Question brow peak is about **0.032 versus 0.020** for the statement, the terminal nod target reaches **4.3°**, addressed saccade offsets stay small, and the mouth closes when the recording ends. No voice selection, audio or hearing-memory code changes.


### Final rig CPU budget

Paired AB/BA on vendored r128: 16 alternating 2,000-frame batches after 3,000 warm-up frames. Final complete run used the final rounded-outline source, with the browser closed. Values are **ms/frame for all three rigs together**, excluding rendering; they are not physical-phone GPU measurements.

| Mode | HEAD median ms | Final median ms | Change |
|---|---:|---:|---:|
| idle | 0.05597 | 0.04024 | -28.1% |
| walk | 0.05812 | 0.04789 | -17.6% |
| turns | 0.04663 | 0.06436 | +38.0% |
| jobs | 0.05160 | 0.05783 | +12.1% |
| seated | 0.05961 | 0.05229 | -12.3% |
| far | 0.04235 | 0.04411 | +4.2% |
| stairs | 0.06320 | 0.04885 | -22.7% |
| house-stairs | 0.06829 | 0.04660 | -31.8% |

Largest median increase: **0.01772 ms for all three rigs**. Two skinned draws and every checked triangle count are unchanged. Earlier paired samples are retained in `r4-paired-cpu-batch1.json`; absolute times from different shared-host load windows are not directly comparable.

### Evidence and final validation

Native family evidence was captured without a forced test raster cap. All generated frame sheets were opened for review, including every final 2 m/4 m probe sequence and the matched house comparisons.

- `tests/shots/models/r4-comparisons/`: 60 exact-camera/time house comparison sheets; body/action batch frames are labelled R4 BATCH and superseding collar/walk frames are labelled FINAL. The latest desktop stair correction is shown separately in `r4-stair-final/house/`.
- `tests/shots/models/r4-before/house/` and `r4-after/house/`: 576 native frames each. Five principal actions on desktop, portrait phone, landscape phone and 1024×768 tablet; interrupted/turning entry-tread cases on desktop/phone. Near/far house ranges are recorded, rather than asserted to be exactly 2/4 m.
- `tests/shots/models/r4-neck-final/house/`: 48 final-collar walk frames on desktop/phone and a correctly rendered real mid-sit reload pair (`sheet-refresh.jpg`).
- `tests/shots/models/r4-stair-final/house/`: final rounded-outline stair-stop/turn recapture on desktop, same near/far cameras as HEAD. The earlier phone interruption batch predates the late footprint correction.
- `tests/shots/models/r4-probe/`: 576 Low frames at exactly 2 m / 4 m, desktop/portrait phone; all outfits/LOD geometry budgets also checked.
- `r4-props-before/`, `r4-props-after/`, `r4-paper-before/`, `r4-paper-final/`: separate original grip/question/armless and final crease/release sequences. Release includes the first 0/1/3/6 frames.

Six unique actual page reload cases passed exactly: Mom/sofa L, Dad/armchair and sister/sofa R, each during sit and stand. Saved x/z, transition blend, phase and goal were unchanged. The first run was interrupted with terminal exit 143 after three checks; the resumed append/fill run exited 0 with all six complete. Its paused-bedroom pictures were rejected and moved under `r4-reloads/house/rejected/`. The corrected additional visible sister reload and nine legacy/API lounge-seat checks exited 0 in the final collar capture. Head/gaze cosmetics are not saved poses.

The native capture-enabled Bonfire attempt was deliberately interrupted to limit extra outdoor capture cost. The no-extra-shots functional attempt then stalled waiting for `House.held() === "bf.tray"`. A real E retry on that same disposable page did not clear it; a direct read-only pick found the tray at about 119 cm. That fixture page was closed deliberately to end the stalled test; its recorded exit is **1**, not a pass. Root cause and a baseline comparison are unverified; no outdoor/Bonfire product code was changed.

Functional browser gates used the existing `FIXTURE_RASTER_RATIO=0.5` fixture diagnostic and `BONFIRE_NO_SHOTS=1`; this does not modify shipped graphics. Native family evidence and rig CPU measurements remain separate. The runner explicitly removes the raster cap from model and mobile children. The full voices entry ran all nine cases and passed 9/9. The queue was stopped at the time reserve; inspect the table for completed children.

| Actual command | Exit | Seconds |
|---|---:|---:|
| `node tests/models-perf.cjs` | 0 | 37.999 |
| `node tests/models-animation.mjs --label=r4-props-before --baseline --only=question,magazine,draw,water,briefcase,page,release,armless --skip-perf` | 0 | 25.905 |
| `node tests/models-animation.mjs --label=r4-props-after --only=question,magazine,draw,water,briefcase,page,release,armless --skip-perf` | 0 | 27.740 |
| `node tests/models-house-r3.mjs --label=r4-before --baseline --only=stairs-turn-up,stairs-turn-down --devices=desktop,phone --append` | 0 | 142.211 |
| `node tests/models-house-r3.mjs --label=r4-after --only=walk,sit,stand,job,talk,stairs-turn-up,stairs-turn-down --devices=desktop,phone,landscape,tablet --stair-devices=desktop,phone` | 0 | 646.198 |
| `node tests/models-animation.mjs --label=r4-probe --only=idle,walk,stop,turn,rear,stairs,stairs-down,sit,stand,job,carry,talk --skip-perf --stairs-rise=20` | 0 | 55.466 |
| `node tests/models-animation.mjs --label=r4-paper-before --baseline --only=page,release --skip-perf` | 0 | 4.221 |
| `node tests/models-animation.mjs --label=r4-paper-final --only=page,release --skip-perf` | 0 | 4.271 |
| `node tests/models-house-r3.mjs --label=r4-neck-final --only=walk --devices=desktop,phone --verify-seats` | 0 | 94.786 |
| `node tests/models-house-r3.mjs --label=r4-stair-final --only=stairs-turn-up,stairs-turn-down --devices=desktop` | 0 | 91.729 |
| `node tests/models-perf.cjs` | 0 | 31.307 |
| `node tests/models-perf.cjs` | 0 | 22.433 |
| `node tests/events-bonfire.mjs http://127.0.0.1:18080` | 1 | 603.024 |
| `node tests/voices.mjs http://127.0.0.1:18080` | 0 | 619.414 |
| `node tests/door-walk.mjs http://127.0.0.1:18080` | 0 | 84.075 |
| `for f in app/public/js/np-rig.js tests/models-*.{cjs,mjs}; do node --check "$f" || exit; done` | 0 | — |
| `node --expose-internals tests/parody-audit.cjs` | 0; 0 authored spans | — |
| `MODELS_ROUND=r4 python3 tests/models-units.py` | 0; 56/56 | — |
| `node tests/models-house-r3.mjs --label=r4-reloads --seats-only --reload-matrix --devices=desktop --append --fill` | 0; 6 unique exact reloads | — |

**Not completed at the reserve:** the character day/space/bump gate started and was interrupted before a result; people-pass desktop/skip-perf, mobile gate/perf and smoke did not run. No fresh full ten-surface seat matrix, moved-chair sweep, physical-device GPU/thermal run, or complete page flip was verified. Existing paper release is a stable fade, not a persistent object placed on furniture. The remaining next ten below are deliberately unfinished work.

No deployment, commit, version/CHANGELOG/AGENTS edit, live-data access or new voice asset was performed. Production edits are confined to `np-rig.js`; `np-life.js`, `np-lines.js`, `st-voice.js` and `hs-life.js` have no diff. Pre-existing untracked `app/public/audio/voice` and `tests/tests/` were left alone.

<details><summary>All 56 unit commands — actual exits</summary>

| Command | Exit |
|---|---:|
| `node tests/art-gallery-unit.cjs` | 0 |
| `node tests/art-return-unit.cjs` | 0 |
| `node tests/audio-routing-unit.cjs` | 0 |
| `node tests/bedroom-hifi-unit.cjs` | 0 |
| `node tests/board-art-unit.cjs` | 0 |
| `node tests/bonfire-geometry-unit.cjs` | 0 |
| `node tests/bonfire-unit.cjs` | 0 |
| `node tests/case-eject-unit.cjs` | 0 |
| `node tests/cat-pose-unit.cjs` | 0 |
| `node tests/console-surface-unit.cjs` | 0 |
| `node tests/cupboard-geometry-unit.cjs` | 0 |
| `node tests/family-phone-private-unit.cjs` | 0 |
| `node tests/fix-1102-unit.cjs` | 0 |
| `node tests/fixes2-1102-unit.cjs` | 0 |
| `node tests/fixes3-unit.cjs` | 0 |
| `node tests/fixes4-geometry-unit.cjs` | 0 |
| `node tests/fixes4-unit.cjs` | 0 |
| `node tests/fixes5-unit.cjs` | 0 |
| `node tests/graphics-device-unit.cjs` | 0 |
| `node tests/grass-state-unit.cjs` | 0 |
| `node tests/hs-input-unit.cjs` | 0 |
| `node tests/identity-unit.cjs` | 0 |
| `node tests/jw-furni-unit.cjs` | 0 |
| `node tests/magazine-catalogue-unit.cjs` | 0 |
| `node tests/mobile-frame-unit.cjs` | 0 |
| `node tests/mobile-phone-unit.cjs` | 0 |
| `node tests/models-appeal-unit.cjs` | 0 |
| `node tests/models-grips-unit.cjs` | 0 |
| `node tests/models-rig-unit.cjs` | 0 |
| `node tests/models-stair-interrupt-unit.cjs` | 0 |
| `node tests/models-weight-unit.cjs` | 0 |
| `node tests/movement-unit.cjs` | 0 |
| `node tests/norepeat-unit.cjs` | 0 |
| `node tests/onboard-layout-unit.cjs` | 0 |
| `node tests/owner-tools-unit.cjs` | 0 |
| `node tests/pc-game-coordinates-unit.cjs` | 0 |
| `node tests/people-loop-unit.cjs` | 0 |
| `node tests/people-pass-unit.cjs` | 0 |
| `node tests/physics-unit.cjs` | 0 |
| `node tests/placement-migration-unit.cjs` | 0 |
| `node tests/print-art-unit.cjs` | 0 |
| `node tests/props-geometry-unit.cjs` | 0 |
| `node tests/reading-turn-unit.cjs` | 0 |
| `node tests/roam-sync-unit.cjs` | 0 |
| `node tests/season-cat-unit.cjs` | 0 |
| `node tests/shop-sparse-unit.cjs` | 0 |
| `node tests/sms-private-unit.cjs` | 0 |
| `node tests/starter-unit.cjs` | 0 |
| `node tests/static-batch-unit.cjs` | 0 |
| `node tests/story-order-unit.cjs` | 0 |
| `node tests/story-unit.cjs` | 0 |
| `node tests/touch-picking-unit.cjs` | 0 |
| `node tests/voices-unit.cjs` | 0 |
| `node tests/wallet-unit.cjs` | 0 |
| `node tests/world-pose-unit.cjs` | 0 |
| `node tests/world-sound-unit.cjs` | 0 |

</details>

### Next ten — round 4, rewritten from this pass

1. Extend **actual page reloads** to the kitchen seats, pulled-out office chair and beanbag. The six exact lounge checks do not establish those other saved surfaces or arbitrary moved furniture. Picture acceptance is recorded in the evidence section.
2. Add asymmetric resting-finger fans and occasional one-hand release/re-settle. Palm-down thigh support is now implemented; the remaining issue is variety and soft finger/self contact, not the old cupped-lap pose.
3. Author a **complete page flip and a physical lap/table rest**. This round preserves release frames and adds an 8° solid-leaf adjustment; it does not place a persistent newspaper on furniture or turn an entire page over.
4. Tighten the moving newspaper pinch beyond the present roughly 1.36 cm peak palm-anchor discrepancy, with contact checks through the entire leaf action and more side/rear player views.
5. Extend interrupted-stair acceptance to ±180° sweeps, direction reversals, LOD-transition footprints and a real route restart close to both landing rails. This pass covers stops and 0°/45°/−90° turns at three speeds, not every continuous motion.
6. Add arbitrary moved/swivelled-chair contact sweeps. Existing real surface metadata and saved pose conversion remain intact; this round does not establish all furniture placements.
7. Refine can/case thumb opposition and finger silhouettes at close range. Their fingers now close on the authored handles, but nearest thumb-to-surface gaps remain around 1.3 cm and there is no full hand collision solver.
8. Extend dialogue acting to longer, multi-sentence exchanges and listening reactions, with independent intent per person. Question brows, terminal nod targets and addressed gaze are implemented; emotional labels and phoneme timing are unavailable.
9. Expand matched **real-house** captures to dedicated long idle, start/stop/turn sequences and all less-used grips on phone landscape/tablet. Probe clips and the five principal house actions are useful but are different evidence.
10. Measure sustained GPU/frame cost, thermals and touch behaviour on physical weak phones/tablets. Paired host rig CPU, software rendering and emulated device profiles do not prove physical-device performance.

## Round 5 — close-range family pass, 7 November 2026

Base: `62cadbc` (2.75.1); main subsequently reached `83c706d` (2.77.0), deliberately unmerged for owner review. `np-rig.js` and `np-life.js` are unchanged between this HEAD and main, so the isolated pre-change rig control also matches main’s rig source. No deploy, commit, version, changelog, AGENTS, site or real-data changes. The pre-existing untracked `app/public/audio/voice` is untouched. Research and the inspected source references are in ANIMATION-RESEARCH.md.

### What changed

- `np-rig.js`: a thigh-facing free-hand frame; grouped, tapered fingers with a gentle index-to-little cascade; thumb closer to the index; staggered one-hand release/re-settle. Reallocated hidden finger-root cap triangles to four-sided near fingers. Explicit prop/support grips remain separate. Settled nonzero finger curls skip redundant Euler/quaternion writes; release motion retains its easing.
- `np-rig.js`: a flared neck base, shaded upper join, collar rings around the neck, and rolled shoulder caps with joined normals. Mom's torso cell gives its front more texels within the same atlas; legible knit stitches, restrained cream ribbing and removal of the skin-coloured shelf address the close surface defects. Atlas sizes remain 512 px / 256 px, with two draws per person.
- `hs-world.js` / the presentation hooks in `np-life.js`: 400 ms face framing after F. Mouse movement, touch look and walking input cancel it. Only view angles change; walking coordinates, grounded height and seat state are unchanged. Existing visible angles save normally, with no saved/replayed framing timer. The original checked 32 cm half-step path and family routes are retained; the retreat now uses the rig’s planted adjustment steps instead of playing a forward walk cycle under backward root motion.
- `np-rig.js` / `looks()` in `np-life.js`: look pitch originates at eye height, a small addressed parent lean/tilt, and listener nod/blink responses to selected internal sentence endings. Other nearby family members look at the active speaker in their room. Reactions consume the existing line/voice clock; speech selection and heard-line memory are unchanged.

### Geometry and CPU

Low near / far, **including six contact-shadow triangles**:

| Person | HEAD | Working tree | Near change |
|---|---:|---:|---:|
| Mom | 2762 / 1726 | 2818 / 1731 | +2.03% |
| Dad, all three outfits | 2942 / 1890 | 2998 / 1895 | +1.90% |
| Crystal | 2938 / 1830 | 2994 / 1835 | +1.91% |

All measured Low/Potato costumes stay below 3,000; no draw or bone was added. Every new near family increase is below the requested 8%. Complete outfit/LOD figures: `tests/shots/models/r5-closeup-before.json` and `r5-closeup-after.json`. These exclude rendering and are not a physical-device claim.

Paired per-person CPU (ms/update; 16 AB/BA batches × 2,000 updates after 3,000 warmups; no rendering):

| Person | Idle HEAD → after | Walk HEAD → after | Conversation HEAD → after | Listener HEAD → after |
|---|---:|---:|---:|---:|
| mom | 0.02098 → 0.02385 | 0.02534 → 0.02437 | 0.02773 → 0.02922 | 0.02551 → 0.02560 |
| dad | 0.02237 → 0.02574 | 0.02534 → 0.02289 | 0.02634 → 0.02712 | 0.02478 → 0.02574 |
| sister | 0.02589 → 0.02567 | 0.02452 → 0.02675 | 0.02698 → 0.02876 | 0.02444 → 0.02369 |

Raw batches: `tests/shots/models/r5-person-cpu.json`; all-three-rig modes, including stairs/turns/jobs/seated/far: `tests/shots/models/r5-paired-cpu.json`. Both commands exit 0: `node tests/models-closeup-perf.cjs` and `MODELS_ROUND=r5 node tests/models-perf.cjs`. Shared-host noise limits interpretation of small percentage differences.


The actual standing palm normals align with the thigh by **0.27 → >0.99**. A 20-second deterministic rest sample records 97/97/136 release frames for Mom/Dad/Crystal, with zero simultaneous left/right releases. Parent head pitch at a 60 cm eye target changes from Mom **+9.5° upward to about −2.2° downward**, Dad **−3.1° to about −19.1°**. Crystal continues to look up. Listener phrase-response peak is approximately 4.9°, with blink frames and a closed listening mouth. Native bone/skin checks also verify that the house eye target remains correct when the renderer's mirrored room root is attached. The same 32 cm retreat trajectory now has hip-height ranges **7.63 → 2.31 cm / 6.86 → 2.09 cm / 10.39 → 3.10 cm** (Mom/Dad/Crystal), with an exclusive support foot. This is a controlled rig comparison of the previous forward-cycle request against the new adjustment-step request, not a house-navigation capture.

### Evidence and limits

The three owner-provided hall screenshots in `/opt/stacks/landing-train7/tests/shots/people-pass/` were inspected before production edits. New **native mesh/material diagnostic** comparison sheets are in `tests/shots/models/r5-native-probe/compare-*.jpg`. All 30 final front/side/rear/neck/hand comparison pairs were inspected, together with the three overview sheets for the three people, standing and engaged. They render the exported production mesh, skin normals and atlas with a small CPU rasteriser; they omit the painted-face shader and real house lighting, and are **not gameplay screenshots** or proof of real-input staging. Their headings explicitly identify this limitation. The previews caught a raised shoulder point, a dark atlas-edge line and a rear neck-base breakthrough. The cap was lowered into the torso, clothing UVs inset, collar weights anchored to the chest, and the hidden neck base moved 7 mm forward. A solid rolled collar lip closes the edge. Actual geometry cross-sections now keep the skin inside the garment, with about 2 mm clearance at the opening; all final native views were recaptured and reviewed.

The release workers were both inactive before the first browser run. The original `systemctl --user` query failed inside the worker, so the same units were checked through read-only D-Bus `ActiveState` queries. No browser ran during the active hold. Browser work resumed after the owner's pause, serially, with a fresh 80-minute allowance.

`tests/models-conversation.mjs` starts from a saved standing pose and uses real keys / CDP fingers for all subsequent travel and aim, then actual F / the phone F button. Only actors are staged by fixtures. Every case has a **before-F / after-F gameplay pair** at 1366×860 desktop or 844×390 phone landscape. Capture raster is native requested resolution; navigation alone uses an explicitly recorded 0.25 cap. These are staging comparisons within the working tree, not HEAD model comparisons. The separate successful HEAD Mom/1 m pilot and native mesh A/B sheets provide base-model controls.

**18/18 after shots have eyes in frame**, checked numerically and by inspecting both complete contact sheets. All F samples retain player X/Z exactly. Closest desktop approaches measure 59.98 cm; phone approaches measure 58.93 cm. The existing retreat reaches approximately 92/91 cm respectively without moving the player. Actual 1 m and 2 m stopping distances are retained below. Mouse and touch look cancel the ease; each cancelled view remains unchanged after 500 ms. Both real reload checks preserve coordinates exactly and view angles within normal save rounding (under 0.04°); standing stays standing.

Raw pairs: `tests/shots/models/r5-conversation/after/{device}-{person}-{cm}-{before-f|after-f}.png`. The complete manifest is `after/evidence.json`, with measured approach ranges, viewports and paths. Numerical cases, cancellations and reloads: `after/report.json`. Reviewed contact sheets: `after/desktop-contact.jpg`, `after/landscape-contact.jpg`, and matching `*-before-contact.jpg`. The native PNGs remain the evidence for close surface judgement.

| Person / nominal cm | Desktop actual cm / eyes x,y | Phone landscape actual cm / eyes x,y |
|---|---:|---:|
| mom / 200 | 201.30 / 679.7, 427.3 | 200.86 / 422.0, 195.0 |
| mom / 100 | 100.61 / 693.9, 425.6 | 101.36 / 420.2, 195.6 |
| mom / 60 | 59.98 / 697.3, 459.9 | 58.93 / 428.1, 175.2 |
| dad / 200 | 194.76 / 684.5, 424.5 | 200.57 / 423.6, 194.0 |
| dad / 100 | 102.57 / 673.9, 406.7 | 101.22 / 421.9, 195.0 |
| dad / 60 | 59.98 / 683.0, 424.6 | 58.93 / 407.7, 190.5 |
| sister / 200 | 196.12 / 683.0, 429.2 | 202.20 / 422.0, 195.0 |
| sister / 100 | 104.11 / 679.3, 439.9 | 100.75 / 429.8, 203.7 |
| sister / 60 | 59.98 / 700.7, 442.4 | 58.93 / 417.8, 193.5 |

Eye coordinates are sampled before the following PNG capture; normal facial motion can change their exact pixels during capture. Both the telemetry and images pass the frame check. Adaptive character LOD differs between some house shots, so matched Low triangle deltas come from the rig measurements above, not a subtraction of unmatched screenshot LODs.

The first long sweep terminated with exit 143 after 17 saved cases; a separate appended case completed the set with exit 0. Precision refinements exposed test-controller stopping/touch sequencing errors (exit 1), and one reload readiness predicate referenced a not-yet-loaded global (exit 1). Those fixture defects were fixed. The final appended phone close/refresh run exits 0, completing all eighteen final frame samples and both refresh checks. Detailed attempt logs remain in `/tmp/jhp-r5-logs/talk-*.log`; none of the failed attempts is counted as a passing command.

The phone Mom captures expose an existing temporary chore reminder / busy-label overlap across the lower face. Eyes remain visible, but this prevents claiming a fully polished conversation HUD. Long natural listener exchanges and physical-device performance remain separate acceptance work.

### Validation ledger — node and native checks

| Command | Actual result |
|---|---|
| `node --check` on all touched production and test JS | Exit 0 at each completed edit; final sweep exit 0. |
| `MODELS_ROUND=r5 python3 tests/models-units.py` | Initial working-tree run: 66/67 passed, with a save-fixture failure during staging development. The final ordinary view-angle save path and updated fixture pass 68/68, exit 0, including the new close-range test; per-file real exits and log paths are in `tests/shots/models/r5-unit-results.json`. |
| `node tests/models-closeup-unit.cjs --baseline` | Exit 0; before geometry/palm/gaze measurements. |
| `node tests/models-closeup-unit.cjs` | Exit 0; real rig geometry, standing palms, parent gaze, one-hand re-settle, listening, mirrored root, view projection and actual mouse/touch cancellation hooks, garment/neck cross-section clearance, atlas edge guards, and a grounded half-step with one support foot. The projection test is not real-input browser evidence. |
| `node tests/models-appeal-unit.cjs` | Exit 0. |
| `node tests/models-grips-unit.cjs` | Exit 0; solid prop/thumb contact and existing speech-expression acceptance retained. |
| `MODELS_ROUND=r5 node tests/models-weight-unit.cjs` | Exit 0; existing weight, support, paper and voice behaviour. |
| `node tests/world-pose-unit.cjs` | Exit 0, including unchanged saved coordinates and retention of visible view angles. |
| `node tests/norepeat-unit.cjs` | Exit 0; least recently heard, refresh-safe, per account, bounded. |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; zero authored spans in zero files. |
| Throwaway server boot at port 18097, DATA_DIR under `/tmp`, own-PID shutdown | Exit 0; HTTP readiness succeeded and no “mod failed to load”. No browser was started. |
| `node /tmp/r5-native-probe.cjs` / `python3 /tmp/r5-native-probe.py` | Exit 0; native comparison diagnostics only, as limited above. |

### Serial browser gates

Browser commands run serially with disposable local data. The current sweep's log is `/tmp/jhp-r5-logs/talk-after-resumed.log`; earlier attempts and the successful baseline Mom/1 m pilot remain in the same log directory. Final results replace the in-progress entries below. A complete isolated `main` 2.77.0 application tree is used for the phone performance control; it is not merged or deployed.

| Required command | Status |
|---|---|
| `node tests/models-conversation.mjs --baseline` / appended after runs | HEAD Mom/1 m pilot exit 0. Completed working-tree pre-F/post-F matrix: 18/18 eyes inside, native requested capture raster, position preserved, mouse/touch cancellation and desktop/phone refresh pass. Full sweep 143 after 17 cases; append 0; precision fixture retries 1; final phone close/refresh append 0. Exact successful final command: `node tests/models-conversation.mjs --devices=landscape --people=sister --ranges=60 --append`. |
| `node tests/models-animation.mjs --label=r5-after --only=idle,question,rear --skip-perf` | Exit 0; 144 native desktop/phone frames across Mom/Dad/Crystal, 2 m/4 m, idle/addressed/rear. Actual renderer: 2 calls, 2,994 triangles for final character; all Low outfits <=3,000. Metrics `tests/shots/models/r5-after/metrics.json`. Full browser pose matrix and browser HEAD model baseline not run. |
| `node tests/characters.mjs --only=day,space,bump` | Exit 0, 3/3: day 77,760 ticks, bump, space; normal raster. Initial non-terminal attempt terminated 143 before output; the persistent-terminal rerun is the passing gate. Log `/tmp/jhp-r5-logs/characters-final.log`. |
| `FIXTURE_RASTER_RATIO=.5 node tests/people-pass.mjs --desktop --skip-perf` | Exit 0; 18/18 cases including conversation, two people, oncoming and six doors. Native attempt passed Hall/landing, then was interrupted (terminal exit 1) because software-rendered passage took 31/27 seconds. Full uncapped run is not complete; viewport/input/routes are unchanged by the raster cap. |
| `FIXTURE_RASTER_RATIO=.25 node tests/voices.mjs http://127.0.0.1:18080` | Exit 1, 8/9, 415.394 s. My six-minute wrapper deadline closed the prompt browser; audio/layout/speak/muted/names/edge/two/phone all pass. The full invocation is not reported as a pass. |
| `FIXTURE_RASTER_RATIO=.25 node tests/voices.mjs http://127.0.0.1:18097 --only=prompt` | Exit 0, 1/1, 55 s. All nine cases have passing coverage across the two runs; a single clean 9/9 full invocation was not completed. |
| `FIXTURE_RASTER_RATIO=.25 node tests/door-walk.mjs http://127.0.0.1:18080` | Exit 0; all eight door directions, 52.822 s. Functional raster diagnostic; full uncapped run not performed. |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | Interrupted, terminal exit 1. Normal raster. Sparse signup (80.1 s), account-house (78.3 s), walk-refresh (41.2 s) pass; pc-controls times out at 60 s with player still standing. Cause unresolved. Console-game, phone-typing, prop-refresh, escape-menu, canonical-views, mobile-desktop, browser-errors and server-log cases were not completed. |
| `node tests/mobile.mjs http://127.0.0.1:18098 --only=perf` | Exit 0; 1/1, uncapped complete main 2.77.0 control, 175 seconds. |
| `node tests/mobile.mjs http://127.0.0.1:18098 --only=gate,perf` | Exit 0; 2/2, five account-gate profiles plus uncapped CPU4x/CPU1x walking. Gate 63 s, perf 188 s. |

### Uncapped mobile comparison against current main

The control serves the complete archived application at `83c706d` (main 2.77.0) with the same installed dependencies and voice-asset link. It does not route a few newer files into an older application and does not merge main. Both runs use their own disposable server/data and a single browser. No raster cap or competing test ran during either benchmark.

| Case | Main frameP50 → working tree | Delta | Main → after calls / triangles | Host load main → after |
|---|---:|---:|---:|---:|
| `walk-cpu4x` | 466.7 → 533.3 ms | **+14.3% worse** | 208 → 164 / 166,968 → 174,630 | 14.8 → 17.9 |
| `walk-cpu1x` | 300.0 → 200.0 ms | −33.3% | 67 → 63 / 148,180 → 154,654 | 16.1 → 15.7 |

Both are High, 832,932 pixels, scale 0.85, with family enabled. The test command passes its functional assertions; that does **not** establish a frame-time performance pass. The CPU4x regression is unresolved. The actual views, host load and version lighting differ, so neither result isolates model cost or demonstrates physical-phone performance. Matched per-person rig CPU above is the separate model-only evidence.

Raw controls: `tests/shots/mobile/r5-main-2.77.0-report.json`, `r5-after-report.json`; comparison with full fields and revision: `r5-comparison.json`. Own server logs have no “mod failed to load”.

Full command/exit/log ledger, including fixture failures and interrupted attempts: `tests/shots/models/r5-validation.json`. The 68-unit ledger is separate at `r5-unit-results.json`. Final syntax command: `bash /tmp/jhp-r5-syntax.sh` (all eight touched/restored JS files), exit 0. Final parody command: `node --expose-internals tests/parody-audit.cjs`, exit 0, zero spans.

### Narrow visual scorecard

The three supplied calibration anchors and the complete eighteen-case gameplay capture set were inspected. This scores only the changed family presentation; unchanged world, lighting, rewards and art direction are not re-scored. No overall AAA/showcase or whole-game premium claim is made.

| Changed genre category | Before → after | Evidence / remaining pass |
|---|---:|---|
| Family forms (Hero) | 1.5 → 2 | Recognisable painted faces retained; thigh-facing tapered fingers, wrapped collar and rounded shoulder silhouette. Faceting remains visible close up. |
| Conversation interaction | 1 → 2 | Real body aim and F now bring all eighteen eye frames into view, with immediate input ownership and stable saved standing poses. |
| Clothing materials | 1.5 → 2 | Sharper Mom knit/cream front, guarded atlas boundaries and no neckline shelf; same atlas allocation and draw count. Other outfits need a wider continuity sweep. |
| Acting / motion | 1.5 → 2 | Parent lean/look-down, planted retreat and separate rest-hand releases; controlled listener nod/blink checks pass. Long natural alternating exchanges remain unverified. |
| Conversation HUD | 1 → 1 | Existing temporary task/busy UI still covers part of Mom's lower face in phone landscape. This is an automatic premium failure under the skill scorecard. |

Changed-category mean: **1.3 → 1.8**. The pass improves the requested close presentation; it does not meet the complete premium threshold. Native renderer/budget evidence is the rig metrics and requested game/performance gates, with software-host limitations stated separately. The standalone canvas inspector has not been run; no entropy/edge-density score is invented.

### Next ten — round 5, rewritten

1. Move temporary chore reminders and the redundant busy prompt clear of the lower face in phone landscape; inspect complete facial expressions as well as eye framing.
2. Isolate the CPU4x frameP50 regression with matched world revisions, view/route samples and repeated AB/BA phone runs; record load, LOD and pixels rather than attributing the whole-version comparison to models.
3. Extend real-input conversation staging to seated speakers, stairs, oblique approaches, walls that prevent the half-step, and rapid F/Esc/look interruptions.
4. Refine the moving newspaper pinch through a complete leaf action, then author a full page flip and persistent lap/table rest. The current leaf adjustment is not a page turn.
5. Extend reload/interrupt coverage to kitchen chairs, pulled-out office chair and beanbag; sweep moved/swivelled furniture against armrests and thigh supports from front/side/rear.
6. Extend stair acceptance to continuous ±180° turns, reversals, LOD changes and real route restarts near both landing rails.
7. Inspect every existing prop grip close up; refine can/case thumb opposition and finger webs by funding triangles from hidden surfaces, preserving thigh-facing free-hand rest.
8. Capture long natural alternating family exchanges, paused/ended recordings and interrupted jobs; tune listener timing from that acting evidence rather than adding continuous nods.
9. Extend outfit collar/underarm and cloth-pattern continuity captures to phone landscape and tablets; preserve the atlas/draw budgets while improving less-used silhouettes.
10. Measure sustained GPU cost, thermal behaviour and touch response on physical weak phones/tablets. Software rendering and emulated CPU throttling do not establish those results.

### Stop-point risks / not verified

Stopped at the requested ten-minute reserve. No further production edits were made during the resumed browser pass. Smoke failed/incomplete; its PC-control timeout has not been attributed to a source change. One clean full voices invocation did not pass (wrapper limit); all nine cases have passing coverage across the full run and prompt retry. Full uncapped people/voice/door gates were not completed; explicit functional raster caps are listed above. Full browser model pose matrix and baseline model browser captures were not run; focused native captures, native A/B diagnostics, all 68 units and paired CPU checks are separate evidence. CPU4x phone frameP50 is 14.3% worse and unresolved. Phone lower-face HUD overlap, long natural listener acting, physical-device performance and integration with main 2.77.0 lighting remain unverified. Main is deliberately unmerged; no commit/deploy/version/data changes.

## Round 5b — unobstructed conversations and speed, 7 November 2026

Base `5cd96fb`, including the owner's round-5 commit and clean main 2.77.0 lighting/effects merge. Main control is `/opt/stacks/landing/app`, read-only, pinned `83c706d`. Baseline rig/life/world working files match that commit's blobs. No commits, deployment, version, changelog, AGENTS, site or real-data edits. Pre-existing voice symlink untouched.

### Changes

- Family spots expose a transient `hideTip` predicate while that person holds a player conversation or has a current/queued addressed line after the pose is released. Desktop hover and phone caption rendering honour it; labels/verbs and the disabled Wait action retain their existing semantics. Speech selection and memory are unchanged.
- The house HUD gets an ephemeral conversation class at state transitions, including gaps between lines. On short landscape screens the current-job strip moves from its ordinary bottom offset to 12 px above the safe-area bottom while a hold or family balloon is present. It returns to normal placement afterward. Chore counters, hint lifetime and saves are unchanged.
- Completed face easing returns before modal, distance and active-speaker checks. The 400 ms motion and input cancellation are unchanged; its completed/idle path no longer repeats those guards.
- The conversation harness records the speaker's projected eyes/mouth and a face exclusion rectangle, visible UI panels, action-caption count and intersections. It also checks reminder restoration. All navigation/aim/F remains real input; actor-only staging is explicit. Native requested capture resolution is restored for every image; navigation alone uses the existing 0.25 cap.

### Alternating uncapped mobile performance

Exactly main1 → tree1 → main2 → tree2, each `node tests/mobile.mjs http://127.0.0.1:18098 --only=perf`, fresh disposable server/data, one browser, no other tests of mine during sampling. Another worker's game remained running. All four exit 0. No fidelity cap or performance-test assertion was weakened.

| Run | Source | CPU4x frameP50 | CPU1x frameP50 | 4x / 1x calls | 4x / 1x load |
|---|---|---:|---:|---:|---:|
| main1 | main 2.77.0 | 366.7 ms | 233.3 ms | 181 / 63 | 11.9 / 11.6 |
| tree1 | working tree | 383.3 ms | 233.4 ms | 181 / 63 | 10.9 / 11.2 |
| main2 | main 2.77.0 | 366.8 ms | 233.3 ms | 208 / 67 | 10.2 / 11.2 |
| tree2 | working tree | 366.7 ms | 233.3 ms | 208 / 67 | 12 / 11.6 |

Mean of the two reported run P50s: **CPU4x 366.75 → 375.00 ms (+2.25%)**, **CPU1x 233.30 → 233.35 ms (+0.02%)**. Both meet the requested 5% target in this sample. All runs: High, 832,932 pixels, scale 0.85, diffuse lighting, light weights ready and no atlas repaint on clock update. Corresponding pairs have matching calls and triangle totals. One tree CPU4x run is one 16.6 ms step slower; the other matches main. This sample does not establish an 8.25 ms model-caused cost. Raw runs, views, adaptive history, source checks and comparison: `tests/shots/mobile/r5b-{main1,tree1,main2,tree2,comparison}.json`.

### Controlled CPU attribution

Actual production rigs, main source versus working tree, 16 paired AB/BA batches × 2,000 updates after 3,000 warmups. Atlas paint and rendering excluded. Milliseconds per person/update:

| Person | Idle main → tree | Walk | Addressed | Listening |
|---|---:|---:|---:|---:|
| mom | 0.010058 → 0.010464 | 0.011327 → 0.011564 | 0.013076 → 0.013912 | 0.011881 → 0.012723 |
| dad | 0.011025 → 0.011886 | 0.011266 → 0.011624 | 0.011991 → 0.012420 | 0.011846 → 0.012048 |
| sister | 0.011618 → 0.012431 | 0.012071 → 0.012562 | 0.012565 → 0.013351 | 0.011206 → 0.012193 |

The additional rig-update costs are under 0.001 ms per person in these medians. Controlled actual `looks()` functions for all three people cost 0.003208 → 0.003632 ms idle and 0.003175 → 0.008264 ms during listening (about 0.0051 ms extra for the trio). These isolate presentation logic with controlled world inputs, not full navigation or rendering.

Framing function: idle 0.000013 ms/tick; active about 0.00281 ms for the short ease; completed 0.000697 → 0.000018 ms. In 163,000 completed-tick calls, the old code repeats 163,000 modal guards; the new code repeats zero. The walking performance test does not start a player conversation, so its framing state is null: the completed-ease cleanup is not credited for the ABAB walking result. Raw CPU batches: `tests/shots/models/r5b-person-cpu.json`, `r5b-presentation-cpu.json`.

### Validation and images

All 75 `*-unit.cjs` files pass, with actual command/exit/log records in `tests/shots/models/r5b-unit-results.json`. The initial desktop matrix hit a coarse-key stopping oscillation (fixture exit 1); diagonal mouse-directed key corrections fixed precision without any player pose API. The appended desktop run exits 0, completing nine native after frames. The first phone run then hit a slow partial-stick return timeout (fixture exit 1); full stick for long returns and shorter fine corrections fixed the fixture. Its appended Dad/Crystal run exits 0. All eighteen native after frames (Mom, Dad, Crystal × 60/100/200 cm × desktop/phone landscape) now have zero redundant captions, zero measured face intersections and eyes inside the frame. Movement, mouse/touch look cancellation, F, refresh and saved player-pose assertions pass. The phone Mom reminder moves from y=207 to y=345 during conversation and returns to y=207 afterward. Screens: `tests/shots/models/r5b-conversation/after/{desktop,landscape}-contact.jpg`, eighteen `*-after-f.png`, `landscape-objective-restored.png`; exact distances, projected face bounds and panels are in `report.json`/`evidence.json`. Full browser-gate results follow below.

After the four alternating performance runs, the caption predicate was broadened to cover current/queued addressed lines after the pose hold is released. This presentation-only edge branch is not exercised by the walking sample. No rig, renderer, lighting, walking logic or framing math changed afterward; the measurement-time and final file hashes are retained separately.

Functional house gates use the existing explicit raster diagnostic (0.5 for smoke/people/characters, 0.25 for voices/door) so all cases can complete on this software renderer while another worker's game remains active. Viewports, input, collision geometry and assertions are unchanged. The eighteen conversation images and four mobile performance runs use native requested capture resolution / uncapped rendering respectively. Raster caps are disclosed per command; these functional runs are not uncapped performance evidence.

### Round 5b visual/budget result

The owner's round-5 before contact sheets showed the busy caption over mouths/chins and the phone Mom reminder over the face. Both revised contact sheets and native captures have been inspected: 18/18 eyes inside, 0/18 captions on the active speaker, 0/18 face-panel intersections. The narrow conversation-HUD score rises from 1 to 2 for this tested matrix; other round-5 categories are unchanged. This is not a whole-game AAA claim. Low triangles are unchanged this round: Mom 2,818 → 2,818, Dad 2,998 → 2,998, Crystal 2,994 → 2,994, including six shadow triangles each; all remain two character draw calls. There are no model, atlas or material edits in 5b.

### Next ten — round 5b, rewritten

1. Extend the face/UI matrix to seated speakers, stairs, oblique approaches and walls that prevent the half-step.
2. Extend real-input rapid F/Esc/look cancellation to interrupted/queued exchanges and changed jobs, checking all HUD restoration paths.
3. Inspect phone portrait, tablet and very short landscape conversation layouts with simultaneous carry/objective UI.
4. Capture long natural alternating family exchanges, paused/ended recordings and interrupted jobs; tune listener timing from that evidence.
5. Refine newspaper pinch through a complete leaf action, then author a full page flip and persistent lap/table rest.
6. Extend furniture reload/interrupt coverage to kitchen chairs, pulled-out office chair and beanbag, including swivelled supports.
7. Extend stairs to continuous ±180° turns, reversals, LOD changes and real route restarts at both landing rails.
8. Inspect every prop grip close up; refine thumb opposition and webs by reallocating hidden triangles while preserving relaxed free hands.
9. Sweep less-used outfit collars, underarms and cloth-pattern joins at close desktop/phone/tablet ranges within the same atlas/draw budgets.
10. Repeat sustained matched performance on physical weak phones/tablets for GPU, thermal and touch response; shared-host SwiftShader ABAB is narrower evidence.

### Round 5b final gate ledger

Full commands, actual exits, fixture retries and log paths: `tests/shots/models/r5b-validation.json`; all 75 individual unit commands: `r5b-unit-results.json`. Final syntax checks pass for all nine touched/new JavaScript test/production files; parody audit exits 0 with zero authored spans; `git diff --check` exits 0.

| Command (from repository root unless shown) | Actual result | Rendering / evidence |
|---|---|---|
| `node tests/mobile.mjs http://127.0.0.1:18098 --only=perf` | 0, 0, 0, 0, alternating main/tree/main/tree | Uncapped; raw four reports and comparison above |
| `node tests/models-closeup-perf.cjs --baseline-ref=main --round=r5b` | exit 0 | Controlled real rigs; CPU table above |
| `node tests/models-presentation-perf.cjs` | exit 0 | Controlled actual looks/framing functions |
| `cd tests && MODELS_ROUND=r5b python3 models-units.py` | exit 0, 75/75 | Repeated on final caption source |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | exit 0, 12/12 | `FIXTURE_RASTER_RATIO=.5`; own disposable server, no URL |
| `node tests/voices.mjs http://127.0.0.1:18080` | exit 0, 9/9 in one full invocation, 414 s | `FIXTURE_RASTER_RATIO=.25`; URL first; speaking, muted, names, edge, two, prompt and phone all pass |
| `node tests/door-walk.mjs http://127.0.0.1:18080` | exit 0, 53 s | `FIXTURE_RASTER_RATIO=.25`; eight real-input traversals, own server log clean |
| `node tests/people-pass.mjs --desktop --skip-perf` | exit 0, 18/18 | `FIXTURE_RASTER_RATIO=.5`; real keyboard passage, browser/server checks pass |
| `node tests/characters.mjs --only=day,space,bump` | exit 0, 3/3 | `FIXTURE_RASTER_RATIO=.5`; 77,760 day ticks, bump and personal space |
| `node tests/models-conversation.mjs --round=r5b` with explicit device/person selections | complete 18/18; corrected append runs exit 0 | Two initial fixture attempts exit 1, preserved in ledger; all real input, native requested captures |

### Round 5b limits / handoff

All requested 5b suites completed before the ten-minute work cutoff. No browser remains running from these gates. No further implementation is planned. Functional raster caps are explicit above; uncapped full smoke/voice/people/door/character runs were not repeated. Physical-phone GPU/thermal behaviour, portrait/tablet conversation layout, seated/oblique/wall-blocked staging and long natural listener exchanges remain future work. The final current/queued-line caption guard was added after the four uncapped speed runs; final units, full voices and the later matrix cases cover it functionally, but that final predicate was not re-benchmarked. Source hashes distinguish the sampled and final trees. Geometry, rig animation, rendering, lighting and walking are unchanged after sampling. Both initial matrix failures were fixture navigation precision/timeouts, corrected with real inputs; their nonzero exits are not concealed by the completed eighteen-frame set. No commit, deployment, data, site, version, changelog or AGENTS changes; pre-existing voice link retained.

## Round 6 — faces that talk and feel, 8 November 2026

Base/main `f68ee3639778c292ee6260998a33e7e78f63fd30`, live 2.80.0. Work began 14:55:48 UTC; fresh research through 15:11 is recorded with primary sources in ANIMATION-RESEARCH.md. No commit, deployment, Docker, real-data, site, version, changelog or AGENTS changes. The pre-existing untracked voice symlink is retained. The implementation does not change speech selection, account identity, no-repeat memory or saved-state formats.

### Changes and budget

- `st-voice.js` derives a 100 Hz source-PCM envelope once per decoded buffer, cached weakly with the existing 24-clip decoded cache. Runtime interpolation and cumulative audible-time progress are O(1). Quiet intervals and joined name/line gaps retain their real timing. Distance, wall filtering and user volume no longer alter articulation; scheduled, suspended and ended playback close the mouth. Amplitude is one byte per 10 ms; the cumulative activity index adds four bytes per bin. Temporary RMS/sorting arrays are released after construction.
- `np-rig.js` packs eight mouth cells into the existing row by removing transparent side margins. Rest, M/B/P seal, A, E/I, O/U, F/V and other consonants use a small original spelling schedule; recorded articulation advances over audible time. Continuous amplitude scales the painted aperture, with 45 ms premultiplied frame blending and a separate outgoing aperture to avoid reopening during closure. This is approximate articulation, **not** phoneme/word alignment or speech recognition. Text-only lines get a duration-normalised punctuation schedule.
- Independent warm happy, cross, tired, cheeky and sad layers affect brow height/slope/asymmetry, eye aperture and mouth corners. Question accents remain. A fourth optional `talk` argument accepts a mood string or `{mood}`; ordinary lines infer restrained cues. Happy/cheeky smiles retain eye sparkles and narrow the eyes instead of holding crescent eyes throughout speech. Pause blinks have fast closure/slower reopening and a cooldown. Thinking briefly glances away. A listener waits until the joke cue, then delays and releases one closed-mouth smile, including after the turn's listener pointer clears.
- `hs-world.js` respects the existing family `hideTip` predicate while carrying, removing a redundant F caption across the face. Portrait conversation/objective CSS reuses the existing measured carry stack to keep the job slip clear of bottom controls.
- Native stair review exposed a real defect: `placeRig` can parent a speaker on the flight into the hidden cupboard underneath. A hall/landing parent correction made Dad visible, but the tree then failed the bump route while the base control passed. **That correction was backed out at the cutoff. `np-life.js` is unchanged from HEAD. Stair visibility remains unfinished; the attempted-fix images are not evidence of the final branch.**

Low geometry remains **Mom 2,818; Dad 2,998; Crystal 2,994 triangles**, including contact shadows, **two draws each**. Atlas stays **512×512 / 256×256 Potato: 0% memory growth**, with no speech-time painting or new textures, dependencies, meshes or bones. The existing `jaw` bone still turns the newspaper leaf.

### Evidence method and honest limits

`tests/models-faces.mjs` plays a real recording per person, samples the actual voice handle every 8 ms and replays that trace through the production rig at exact 60 Hz. It captures frames **0,2,...120**, 61/person, 183 before and 183 after, using the same diagnostic camera/light and pinned base route. Native frames, trace data, rig state, uniforms, triangle/draw/atlas budgets and source hashes accompany the sheets. These are facial probes; they are not falsely labelled as natural in-house conversations. Separate native real-F cases stage only initial positions and inventory, then use actual input, menus and refresh.

Chosen recorded lines: Mom `talk.mom.evening.02` (4.931 s), Dad `c1.dad.hello` (4.548 s), Crystal `talk.sister.afternoon.03` (4.071 s). Mom's long early silence is real PCM silence: the face must stay still there. The after set adds a 24-expression contact sheet, a 21-mouth chart and recorded-punchline listener sequences. The original 2-second strips deliberately retain the requested duration rather than moving their window to hide pauses.

An initial stair projection assertion passed while Dad was invisible. That screenshot was explicitly rejected after visual inspection; actor ancestry and offscreen-balloon assertions now supplement projection/UI checks. The attempted-fix native desktop capture visibly showed Dad, but is rejected as final-branch evidence after rollback. Its stair lighting is also too dark; neither defect is claimed resolved.

Short-landscape native review also exposed a genuine carry/reply overlap on seated Mom. The carry tag now uses the left side below the room heading, and `np-bubble.js` can wrap the same phone-size lettering into a 192 px side column while carrying. The native 740×360 recapture shows the complete face, held video, reply and controls separately. The portrait job slip reuses the measured stack above the bottom controls. These are two actual layout fixes, not just larger test tolerances.

Thinking gaze is layered over the old saccade state, and pause blinks do not reschedule the shared idle random clock. A 1,000-frame comparison against the actual base rig proves identical random consumption through thinking, speech, pauses and ended voice; facial beats must not perturb later line/navigation choices. `norepeat-unit` remains mandatory. Speech selection in `np-life.js` is unchanged.

Two fixture races are explicit. The phone voice wait previously accepted a fading balloon and then read no live bubble; it now matches the requested named live utterance and freezes/samples in one evaluation. The conversation matrix previously used a real keyboard Esc, which correctly selected keyboard input, then looked for touch buttons; every subsequent touch case now makes a real screen press to restore that input mode. It also waits for actual carrying controls, the measured portrait stack and a visible delivered reply before sampling. Projection alone never proves visibility.

### Next ten — round 6, rewritten

1. Fix the flight render-parent defect while preserving real route, welcome and dialogue behavior; then improve face lighting at the stairs and dark oblique lounge approaches with a world-lighting/contact review. The visible actor now renders, but dark faces still hide fine acting; do not disguise this with invented “AAA” scores.
2. Add authored word/phoneme markers for the most important recorded lines, then extend coverage across the 746 recordings. Activity-weighted spelling is a useful fallback, not exact alignment; inspect bilabial closures, teeth contacts, accents and name joins by ear and frame.
3. Capture long natural alternating Mom/Dad/Crystal exchanges, including interruptions, cancelled/paused audio and changed jobs. Review joke-cue timing, turn-boundary smiles and held listening gaze in the house rather than only the controlled probe.
4. Complete the full seated/standing × wall/stair/oblique × desktop/phone/tablet matrix, rapid F/Esc/look input and HUD restoration. Keep visibility ancestry, delivered-reply and control-overlap assertions alongside harsh native screenshot review.
5. Extend stair acceptance through continuous ±180° turns, reversals, real route restarts, LOD changes and both landing rails, including the hall/landing room-parent seam.
6. Extend furniture refresh/interrupt and support checks to kitchen chairs, the pulled-out/swivelled office chair and beanbag, with moved furniture viewed from front, side and rear.
7. Finish the newspaper pinch through a complete leaf action, then author a real page flip and persistent lap/table rest; the existing leaf adjustment is still not a page turn.
8. Inspect every prop grip close up, especially can/case thumb opposition and finger webs. Reallocate hidden geometry while retaining relaxed free hands and the 3k Low budget.
9. Sweep less-used costume collars, underarms and pattern joins at close desktop/phone/tablet ranges; retain the atlas/draw allocation and improve silhouette continuity before adding surface noise.
10. Measure sustained GPU, thermal behaviour, audio-output latency and touch response on physical weak phones/tablets. Paired shared-host SwiftShader runs and emulated CPU throttling are narrower evidence.

Final command exits, measurements and remaining unverified cases follow below. Incomplete or interrupted jobs are not passes.

<!-- r6-final-ledger -->
### Final measured CPU and mobile result

Final per-person CPU probe: actual production r128 rigs, 16 alternating AB/BA batches of 2,000 updates after 3,000 warmups, rendering and atlas paint excluded. Recorded mode supplies the same synthetic level/activity callbacks to both rigs; it measures rig work, not one-off envelope construction or actual audio-output latency. No browser of mine ran during this final CPU probe. Milliseconds per person/update:

| Person | Idle base → tree | Walk | Text conversation | Recorded | Listening |
|---|---:|---:|---:|---:|---:|
| mom | 0.018588 → 0.019598 | 0.019884 → 0.017632 | 0.022833 → 0.021852 | 0.013378 → 0.016033 | 0.019031 → 0.017745 |
| dad | 0.018983 → 0.020607 | 0.018519 → 0.018311 | 0.021070 → 0.018890 | 0.017276 → 0.018694 | 0.016857 → 0.016853 |
| sister | 0.018926 → 0.019383 | 0.020020 → 0.018544 | 0.017862 → 0.018266 | 0.018041 → 0.020109 | 0.018325 → 0.019075 |

Recorded-speech extra rig CPU is approximately **2.655 / 1.418 / 2.068 microseconds** for Mom / Dad / Crystal in these medians. Relative increases are 19.8% / 8.2% / 11.5%; do not conceal the percentages or mistake this CPU-only probe for GPU evidence. Source hashes and every batch are in `tests/shots/models/r6-person-cpu.json`.

| Uncapped mobile sample | 4× P50 | 1× P50 | 4× / 1× calls |
|---|---:|---:|---:|
| main | 433.2 ms | 183.3 ms | 181 / 63 |
| tree1 | 299.9 ms | 216.6 ms | 181 / 63 |
| main2 | 466.5 ms | 266.6 ms | 208 / 67 |
| tree2 | 333.4 ms | 183.4 ms | 208 / 67 |
| main3 | 316.6 ms | 133.3 ms | 181 / 63 |
| tree3 | 266.7 ms | 116.7 ms | 208 / 67 |

The final main3 → tree3 pair uses frozen main and the six sampled production assets, with matching measurement-time before/after source hashes, High tier, 832,932 pixels, 0.85 scale, diffuse lighting, ready bakes and zero atlas repaint. **Its scene loads differ**: 174,738/154,482 triangles on main versus 167,076/148,052 on tree, 181/63 versus 208/67 calls. Thus 316.6→266.7 ms and 133.3→116.7 ms are observations, **not a clean attributed speed improvement**. Main2/tree2 have matched 208/67 scene calls, but predate the final stair/bubble/RNG corrections and one control interval overlapped an earlier CPU diagnostic. The stair-parent correction was subsequently rolled back; the other five sampled production assets remain final. The historical 170–180/83 ms reference was not reproduced on this shared software renderer. No physical-phone performance claim is made.

### Exact validation ledger

All servers own disposable `/tmp` data on 18080–18099; one browser of mine at a time. Functional house gates disclose their existing raster caps. Native art captures restore requested resolution; all mobile performance samples are uncapped.

| Command (repository root unless cwd shown) | Real exit | Log / detail |
|---|---:|---|
| `node tests/models-faces.mjs --baseline` | 0 | `/tmp/jhp-r6-faces-before-gate.log` |
| `node tests/models-faces.mjs` | 0 | `/tmp/jhp-r6-faces-after-gate.log` |
| `node tests/models-mobile-pair.mjs --label=tree1` | 0 | `/tmp/jhp-r6-mobile-tree1-gate.log` |
| `node tests/models-mobile-pair.mjs --label=main2 --baseline` | 0 | `/tmp/jhp-r6-mobile-main2-gate.log` |
| `node tests/models-mobile-pair.mjs --label=tree2` | 0 | `/tmp/jhp-r6-mobile-tree2-gate.log` |
| `MODELS_ROUND=r6 FIXTURE_RASTER_RATIO=.25 node tests/models-gate.mjs --only=voices` | 143 | `/tmp/jhp-r6-voices-1794152082047.log` |
| `MODELS_ROUND=r6 FIXTURE_RASTER_RATIO=.25 node tests/models-gate.mjs --only=voices` | 1 | `/tmp/jhp-r6-voices-gate.log` |
| `FIXTURE_RASTER_RATIO=.5 node tests/characters.mjs --only=day,space,bump` | 1 | `/tmp/jhp-r6-characters-gate.log` |
| `FIXTURE_RASTER_RATIO=.5 node tests/people-pass.mjs --desktop --skip-perf` | 0 | `/tmp/jhp-r6-people-gate.log` |
| `cd tests && FIXTURE_RASTER_RATIO=.5 SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | 0 | `/tmp/jhp-r6-smoke-gate.log` |
| `FIXTURE_RASTER_RATIO=.5 node tests/identity-house.mjs --case=sarah` | 0 | `/tmp/jhp-r6-identity-gate.log` |
| `MODELS_ROUND=r6 node tests/models-perf.cjs` | 0 | `/tmp/jhp-r6-models-perf-gate.log` |
| `node tests/models-animation.mjs --label=r6-after --only=idle,talk,question,stairs,stairs-down,sit,stand,rear --skip-perf --stairs-rise=20` | 0 | `/tmp/jhp-r6-models-animation-gate.log` |
| `node tests/models-closeup-perf.cjs --baseline-ref=main --round=r6` | 0 | `/tmp/jhp-r6-person-cpu-final-gate.log` |
| `node tests/models-mobile-pair.mjs --label=main3 --baseline` | 0 | `/tmp/jhp-r6-mobile-main3-gate.log` |
| `node tests/models-mobile-pair.mjs --label=tree3` | 0 | `/tmp/jhp-r6-mobile-tree3-gate.log` |
| `bash /tmp/jhp-r6-phone.sh` | 0 | `/tmp/jhp-r6-voice-phone-gate.log` |
| `FIXTURE_RASTER_RATIO=.5 node tests/.r6-characters-baseline.mjs --only=bump` | 0 | `/tmp/jhp-r6-bump-base-gate.log` |
| `FIXTURE_RASTER_RATIO=.5 node tests/characters.mjs --only=bump` | 1 | `/tmp/jhp-r6-bump-tree-gate.log` |
| `node tests/models-conversation-layouts.mjs --devices=tablet,portrait,short --cases=stairs-dad,oblique-mom,seated-sister --append` | 1 | `/tmp/jhp-r6-layouts-final-gate.log` |
| `node tests/models-faces.mjs` | 0 | `/tmp/jhp-r6-faces-after-gate.log` |
| `MODELS_ROUND=r6 python3 tests/models-units.py` | 0 | `/tmp/jhp-r6-units-final-gate.log` |
| `python3 tests/models-faces-sheets.py` | 0 | `/tmp/jhp-r6-sheets-final-gate.log` |
| `FIXTURE_RASTER_RATIO=.5 node tests/characters.mjs --only=bump` | 0 | `/tmp/jhp-r6-bump-tree-gate.log` |
| `node tests/models-conversation-layouts.mjs --devices=tablet --cases=seated-mom --append` | 1 | `/tmp/jhp-r6-tablet-mom-gate.log` |
| `node tests/models-conversation-layouts.mjs --devices=tablet --cases=seated-mom --append` | 0 | `/tmp/jhp-r6-tablet-mom-gate.log` |

Unit ledger: **79 scripts, 79 pass**; every exact `node tests/*-unit.cjs` invocation and log is in `tests/shots/models/r6-unit-results.json`. This includes `norepeat-unit`, all model units, source-PCM lifecycle, listener/pause/mood checks, the baseline shared-random cadence regression. The first unit run failed the seeded paper grip after an idle random draw was removed; the old draw schedule was restored and subsequent full runs pass. The initial voice-unit mock supplied silent decoded PCM and nonzero analyser data; it now supplies actual PCM with a silent interval and checks the new source-envelope API without discarding the real audio-output integration checks.

Syntax ledger: 12 touched/new JavaScript files checked with `node --check`, 0 failures, exact commands in `tests/shots/models/r6-syntax.json`. `git diff --check` is checked at handoff.

The full voice invocation exits 1 (**8/9**): phone read an absent balloon after matching a fading one. The strengthened phone-only retry is `FIXTURE_RASTER_RATIO=.25 node tests/voices.mjs http://127.0.0.1:18089 --only=phone`, **exit 0, 1/1**. All nine cases therefore have passing coverage across the full run and retry; there is no single clean full invocation after the fixture correction. The early long-lived queue and two matrix attempts were terminated externally (143), not passed. The first short-landscape matrix failed a real carry-on-face overlap and triggered the production layout fix. Later matrix runs failed waiting for touch Talk; they are not labelled successful coverage.

The initial character invocation is **2/3, exit 1**; day and space pass, bump fails with Mom talking and no phone goal. The isolated base bump passes; the uncorrected tree retry fails. `debug.sim()` deliberately omits speechTick, so its simulated 60 seconds cannot finish a real-time welcome/conversation. A wait-before-simulation fixture attempt also failed and was removed. The stair-parent production change was rolled back; both `np-life.js` and `tests/characters.mjs` now match HEAD. The last focused bump result above tests that rollback. A clean final full three-case invocation is not claimed. Speech selection is unchanged.

### Art evidence and remaining limits

Final facial probe source matches current rig/voice assets: **True**. Before/after: 183 native 480×480 frames each, frames 0,2,...120, six labelled strips `tests/shots/models/r6-faces/{before,after}-{mom,dad,sister}-strip.jpg` and 240 px GIF review aids. `expressions.jpg` has 24 expression poses; `visemes.jpg` has 21 mouth poses; `listeners.jpg` has 15 recorded-punchline samples. Native originals and actual playback traces remain in `before/` and `after/`. Final pose probe adds 384 native desktop/phone rig frames in `tests/shots/models/r6-after/`; it enforces two draws and every Low costume/LOD budget. These are controlled probes, not natural in-house exchanges.

Native real-input house captures currently retained: **10 cases**, with 4 recorded refresh checks, in `tests/shots/models/r6-layouts/`. The per-case JSON records actual projected faces, panels, player pose and control intersections. Older desktop entries predate the strengthened ancestry/reply waits; the attempted desktop stair has explicit visible ancestry but belongs to the rolled-back prototype. The wall-sister fixture placed her into the closed front door and is rejected. Only completed assertions and personally reviewed images count. Full cross-product mobile coverage is unfinished.

Personally reviewed the six facial before/after strips, expression and mouth charts, recorded-listener sheet, selected native facial frames, desktop seated/oblique/stair house captures, portrait seated Mom and stairs, and the corrected native short-landscape seated Mom. The short-screen before image covers the face; its after image separates the tag, reply, face, held video and objective. Existing stair/oblique lighting is visibly dark. Final additional contact sheets and any late tablet shot are named in the handoff; no unseen capture is claimed reviewed.

**Not verified / risks:** exact phoneme/word alignment across all 746 recordings; prolonged natural alternating exchanges; all furniture and mobile layout combinations; native Potato-viseme art; uninterrupted audio-output latency or sustained GPU/thermal performance on physical devices. The larger mobile matrix is incomplete, the failed Talk fixture pressed the upper-left menu area and paused the game (diagnostic showed the correct Mom raycast with busy=true); the focused retry presses the upper centre instead. The flight-parent fix is withheld after the route regression. The stair and wall prototype captures are rejected as final acceptance evidence. Shared-host scene variation prevents attributing whole-house speed differences to the face work. No claim of a complete AAA character or whole-game premium result. No deploy, commit, version/changelog/AGENTS, site or real-data edits.

Handoff at 16:35 UTC: implementation frozen at the cutoff. After removing the stair-parent prototype, the original focused bump test passes (52.4 s). Final 79-unit handoff run passes; 12 changed/new JS files pass syntax, and the reverted life/character files were separately checked and match HEAD. The focused tablet seated-Mom run passes (111.4 s), including visible delivered reply, carry/objective/control separation and standing refresh. Its native `tablet-seated-mom.png` was personally viewed: face clear, held video below the mouth, reply and reminders above. Broader tablet/phone matrix remains unfinished. Stair prototype and closed-front-door wall fixture are rejected in `r6-layouts/report.json` and README.txt. No browser/server of this task remains.
