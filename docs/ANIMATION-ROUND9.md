# Models and animation — round 9

Base: `models` / main **2.84.0**. Changes remain in the working tree. No deployment, git writes, version, changelog, AGENTS, live-data or `site/` edits. The pre-existing untracked voice-media link is preserved.

## Changes

- Sipping uses an upward finger curl around the handle, with the wrist below the mug. The existing mug joint counter-rotates to keep the cup upright. An inward/downward elbow pole, a small head tip and a same-frame mouth constraint replace the sideways upper-arm pose. All three family rigs use it.
- Mom's handset follows the solved ear and cheek, including oblique turns and low-detail maintenance updates. The lower grip keeps the forearm close; the fingers close around the handset. Attended heads retain their pose between visible frames.
- Before standing, Dad folds the existing newspaper leaf; Mom lowers her magazine. Both hands constrain the transfer onto the actual upholstered armrest. Standing waits for the transfer. Returning readers sit, reach for the resting page, take both grips and recover their reading pose. The page stays at full scale, including while its owner walks elsewhere. Its existing skinned draw can show the parked page with the hidden owner masked out. A culled owner updates only the page joint, preserving the hidden body clock and shared random schedule. Transfer, parked position and retrieval state survive serialization; absent owners retain their parked reading too.
- The exposed props now use original period print in spare space in their existing atlas: **THE DAILY WAIL**, “TEA TAKES A DAY OFF”, and **JACK ATTACK! / CHEATS! / GAME LAD**. Solid edges, meshes, atlas dimensions and triangle counts are retained. Both sides carry print.
- Washing, cooking and watering acknowledge a listener through restrained shoulders and torso. Explicit conversations retain the current working wrist frames and tool orientation; routine work resumes at its paused phase. These jobs retain their work-facing body instead of turning the hands away from the work.
- Delivered family replies look towards the previous nearby speaker, hold a heard reaction and make one small returning nod/shoulder/free-hand gesture. Audio loading preserves the selected addressee; source time governs the gesture, suspension holds it and cancellation clears it. Explicit player conversations retain priority. Queue choice, eligibility, history, cooldowns, rewards and random selection remain unchanged.
- **53 additional everyday lines** have explicit word anchors: **50** aligned against available recordings and **three text-only directions** where recordings are absent. Total: **133 lines / 233 acting beats**, including all **108** morning/afternoon/evening lines. The original 80 direction records are unchanged. No recordings, names, dialogue text or moods were rewritten.

## Measurements

<!-- R9_METRICS -->
Production r128 skeleton/skin probes; distances are centimetres. Studio camera angles are 0° / 45° / 90°; contact probes also turn the head through ±80°. Negative elbow height means the elbow is above the shoulder.

| Measure | Main 2.84.0 | Working tree |
|---|---:|---:|
| Sip elbow below shoulder, all three | -23.57–-3.89 | 7.58–19.93 |
| Largest sideways elbow projection | 19.56 | 0.00 |
| Largest near-rim / mouth-anchor gap | 2.86 | 1.50 |
| Largest nearest earpiece / ear-anchor gap | 11.68 | 0.000000000 |

Largest mug finger / solid-surface gap: **0.053 cm**. Phone finger / handset gap: **0.095 cm**.
Dad transfer: worst finger gap **0.075 cm**, parked world drift **0.000000000 cm**, page scale **1.000000**. Main has no corresponding visible put-away transfer; its page is hidden after standing.
Mom transfer: worst finger gap **0.112 cm**, parked world drift **0.000000000 cm**, page scale **1.000000**. Main has no corresponding visible put-away transfer; its page is hidden after standing.

Zero-time reload: largest tested page displacement **0.04907 cm**. Retrieval finger gaps: **0.097 cm** maximum. Each tested retrieval returns to transfer=0 / parked=false.
Paused washing/cooking/watering acknowledgements: largest wrist drift **0.000000000 cm**, largest orientation change **0.000000042 radians** after the small initial grip settle. Reply envelope: pending **0**, peak **1.000**, released **0**; suspended source-clock samples are retained in the contact JSON.

**60 Low/Potato outfit/LOD budgets checked; maximum 2,998 triangles including shadow.** Family near: Mom 2,818, Dad 2,998, Crystal 2,994 (8,810 total). Native rig submissions remain **two**, with mesh/bone counts, atlas dimensions and final vertex/triangle allocations unchanged. The culled-owner page uses the existing body draw and hides its owner's shadow/proxy.

Live, alternating recorded exchanges:

| Device | Turns | Sip peak | Early sip cancels | Reply targets sampled | Returning gesture peak |
|---|---:|---:|---:|---:|---:|
| desktop | 12 | 0.999936 | 0 | 154 | 1.000 |
| landscape | 12 | 0.999987 | 0 | 171 | 1.000 |

The JSON retains each turn, held props, own-speech cup lowering, source samples and reply addressees.

Paired whole-house mobile timing, complete main archive first and working tree second. Software-renderer milliseconds; lower is better. These are shared-host samples, without physical-device certification.

| Case | Frame p50 main → tree | Frame p95 main → tree | Render p50 main → tree | Calls main → tree | Triangles main → tree |
|---|---:|---:|---:|---:|---:|
| walk-cpu4x | 183.3 → 183.3 | 200 → 200.1 | 20.2 → 19.4 | 176 → 176 | 174868 → 174868 |
| walk-cpu1x | 83.4 → 83.3 | 100.1 → 100 | 4.3 → 4.1 | 63 → 63 | 156382 → 156382 |

Scene/adaptation and host-load differences must be read alongside timing differences; this pair does not isolate the cost of a person. Raw hashes, actual exits and samples: `tests/shots/mobile/r9-final-{main,tree}-perf.json`.
<!-- /R9_METRICS -->

## Native frame evidence

Original matched 1366×860 rig views are retained as native 700×860 crops in `tests/shots/models/r9/{before,after}/`. The house captures retain the full native viewport, including four phone/tablet portrait/landscape sizes, in `tests/shots/models/r9-house/{before,after}/`. Strips crop empty margins and add labels; screenshot pixels are never resampled.

- Sip, front / 45° / side: [Mom front](../tests/shots/models/r9/compare-sip-mom-0.png), [Mom 45°](../tests/shots/models/r9/compare-sip-mom-45.png), [Mom side](../tests/shots/models/r9/compare-sip-mom-90.png); [Dad front](../tests/shots/models/r9/compare-sip-dad-0.png), [Dad 45°](../tests/shots/models/r9/compare-sip-dad-45.png), [Dad side](../tests/shots/models/r9/compare-sip-dad-90.png); [Crystal front](../tests/shots/models/r9/compare-sip-sister-0.png), [Crystal 45°](../tests/shots/models/r9/compare-sip-sister-45.png), [Crystal side](../tests/shots/models/r9/compare-sip-sister-90.png).
- Phone: [front](../tests/shots/models/r9/compare-phone-0.png), [45°](../tests/shots/models/r9/compare-phone-45.png), [side](../tests/shots/models/r9/compare-phone-90.png), [house call](../tests/shots/models/r9/house-phone.png).
- Reading: [paper studio strip](../tests/shots/models/r9/compare-reading-dad-45.png), [magazine studio strip](../tests/shots/models/r9/compare-reading-mom-45.png), [paper departure and return in the house](../tests/shots/models/r9/house-reading-dad.png), [magazine departure and return in the house](../tests/shots/models/r9/house-reading-mom.png). Other front/side strips and the crop ledger are beside these files.
- Live recorded exchanges: `tests/shots/models/r8-exchanges/r9-final/`. These retain production speech/audio/controller updates rather than the staged rig clock.

<!-- R9_ART_REVIEW -->
Reviewed the native sip peaks for all three people at front, 45° and side, the oblique handset strips, and both reading transfers. The lower elbow silhouette and small head tip read consistently across the nine sip views. The printed newspaper and magazine remain solid and legible on the upholstery after the owner leaves. The paper departure was also inspected at phone/tablet portrait and landscape sizes.

The first house-phone film exposed a fixture bug: its indexed loop passed a pair instead of a look-coordinate object, producing non-finite head/hair poses on both main and the working tree. The poisoned later work shots were rejected too. The corrected fixture checks finite head/hair quaternions. Both replacement runs passed; the 19 phone/work frames per version replace the rejected images while retaining the 30 unaffected reading frames. I inspected the corrected front/45°/side call, all three work acknowledgements, and phone/tablet portrait/landscape call views. Hair and head poses are intact, the receiver stays at the ear and the elbow remains low. The studio phone/contact evidence was unaffected.
<!-- /R9_ART_REVIEW -->

## Test ledger

<!-- R9_TESTS -->
All 12 touched JavaScript files passed `node --check`; all three Python tools compiled. Exact commands and exits are in `tests/shots/models/r9-syntax-results.json`. `git diff --check` also returned exit 0. Functional room-fixture gates use `FIXTURE_RASTER_RATIO=.5`; art exports restore native raster resolution. Smoke uses `SMOKE_SCALE=3 STORY_SCALE=3` and starts its own disposable server.

| Exact command | Actual result |
|---|---|
| `node tests/models-animation.mjs --label=r9-probe --only=idle,walk,stairs,stairs-down,talk,question,page,release,magazine,carry,sit,stand --skip-perf --stairs-rise=20` | exit 0; 45.6 s |
| `node tests/characters.mjs --only=day,space,bump` | exit 0; 101.9 s |
| `node tests/people-pass.mjs --desktop --skip-perf` | exit 0; 184.0 s |
| `SMOKE_SCALE=3 node tests/voices.mjs http://127.0.0.1:18080` | exit 0; 554.8 s |
| `node tests/identity-house.mjs --case=sarah` | exit 0; 174.7 s |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | exit 0; 234.6 s |
| `node tests/models-round9-gate.mjs --only=units,models,characters,people-pass` | 85 scripts; 85 pass; 0 fail; exact per-file commands/exits in `r9-final-unit-results.json` |
| `node tests/models-round9-gate.mjs --only=units,models,characters,people-pass` | exit 0; 447.4 s; source stable=False |
| `node tests/models-round9.mjs --baseline` | exit 0; 13.5 s; source stable=True |
| `node tests/models-round9.mjs` | exit 0; 13.5 s; source stable=True |
| `NODE_OPTIONS=--require=/opt/stacks/landing-models/tests/browser-budget.cjs node tests/models-round9-review.mjs` | exit 143; interrupted; duration not recorded; source stable=None |
| `node tests/models-house-r9.mjs --baseline` | exit 0; 139.3 s; source stable=True |
| `node tests/models-house-r9.mjs` | exit 0; 144.0 s; source stable=True |
| `node tests/models-cues-r8.mjs` | exit 0; 8.7 s; source stable=True |
| `MODELS_EXCHANGE_LABEL=r9-final node tests/models-exchanges-r8.mjs` | exit 0; 248.5 s; source stable=True |
| `node tests/models-round9-mobile-pair.mjs` | exit 0; 188.5 s; source stable=True |
| `node tests/models-house-r9.mjs --baseline --only-phone --append` | exit 1; 26.6 s; source stable=True |
| `node tests/models-house-r9.mjs --only-phone --append` | exit 1; 28.2 s; source stable=True |
| `node tests/models-round9-gate.mjs --only=units,models,characters,people-pass` | exit 0; 377.1 s; source stable=True |
| `node tests/models-house-r9.mjs --baseline --only-phone --append` | exit 0; 56.6 s; source stable=True |
| `node tests/models-house-r9.mjs --only-phone --append` | exit 0; 55.9 s; source stable=True |

`norepeat-unit.cjs`, `welcome-unit.cjs` and `voices-unit.cjs` are included in the complete unit ledger. Every gate rejects page/console errors and checks its disposable-server log for module-load failure.

Development attempts also exposed incomplete unit stubs for the new presentation fields and a reading-film window that ended while the return route was still walking. Those were corrected and rerun. The contact probe retains its measured 0.049 cm reload residual; it is not reported as exact zero. Earlier failures and later exits remain in the runner logs/ledgers.
<!-- /R9_TESTS -->

Final verification: `node tests/models-round9-review.mjs --verify` returned exit 0: all eight latest serial stages passed with stable hashes matching the final three runtime files. The frozen-source gate rerun passed 88 checks (85 units plus animation, characters and people-pass). Bump passed first attempt in each completed character run. The earlier review driver ended with SIGTERM/143; its cause was not established, and the completed stages were subsequently rerun in shorter batches.

Only one browser of this task runs at a time. Every server uses a free port in 18080–18099 and disposable `/tmp` data and is closed by its own child-process PID. Performance is measured only by the full-main-archive-first, working-tree-second mobile pair. Screenshot probes and synthetic clocks are contact/art evidence, not device FPS measurements.

## Limits

<!-- R9_LIMITS -->
- No recordings are installed for `talk.mom.morning.07`, `talk.dad.afternoon.11` or `talk.sister.morning.08`; their acting uses explicit text anchors. Recorded-word/sub-word timings are estimated alignment, without a complete listening audit of every clip.
- Phone/tablet evidence uses emulated viewports/input and a shared software renderer. Physical GPU, thermal, audio-output and touch-latency certification is not provided.
- The newspaper has a real leaf fold and retrieval, rather than a complete reading-page-turn system. The parked reading remains an NPC cosmetic prop in its existing draw.
- Ordinary washing/stirring/pouring paths still use their established authored work coordinates. The new acknowledgement preserves those working contacts after a small initial grip settle; it does not add a complete sink/pan/planter surface solver.
- Arbitrarily moved furniture, every seasonal costume's native art and every cancel/refresh/input combination are not fully swept. Preserve the passing gate results and the narrower scope of the dedicated contact/restore probes.
<!-- /R9_LIMITS -->

## Rewritten next ten

1. Extend base-clip painted-mouth directions beyond the current forty recordings, starting with chores, pocket money, repeated visits and common questions; inspect consonant closures against real playback.
2. Restore or record the three missing everyday clips, then replace their text-only timing with inspected recorded-word spans while retaining the authored anchors and dialogue IDs.
3. Capture approach, interrupted conversations, reading transfer, phone grip, Esc, rotation and refresh on physical weak phones and tablets; measure sustained GPU, thermal and input/audio latency.
4. Author addressee and returning-gesture intent for longer scripted family exchanges, including three-way relays and player interruptions. Preserve the selection/history rules and held-tool constraints.
5. Build a complete newspaper page turn and distinct inside/reverse spreads using the existing leaf allocation; retain full-scale props, both contacts and the new fold/retrieval path.
6. Tie ordinary washing, stirring and pouring paths to the actual sink, pan and planter surfaces, including close oblique listeners; keep the precise paused work contacts and the two-draw limit.
7. Develop an original crayon drawing beneath the live nib, with supported paper and a finished reverse, using the existing atlas and draw allocation.
8. Extend native profile-mouth, brow, collar, hand and pattern reviews through every child costume and the coated adult, including Potato textures and LOD transitions.
9. Sweep moved chairs, armrest surfaces, interrupted sit/stand and parked reading across refreshes and room/floor changes; keep saved poses and object contacts together as furniture moves.
10. Review contact shadows, armrest print lighting and held-prop silhouettes through continuous room/stair transitions, then rank remaining visible motion defects from native films rather than isolated poses.
