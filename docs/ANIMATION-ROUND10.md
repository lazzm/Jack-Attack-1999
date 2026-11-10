# Models and animation — round 10

Base: `models` / main **2.87.0**, HEAD `9f8638015424ec7a15c13c04aa3e47649d02e0c1`. Working-tree changes only. No deployment, git writes, version, changelog, AGENTS, live-data or `site/` changes. The pre-existing untracked voice-media link is preserved.

Final verification: **88/88 unit scripts, 22/22 syntax/whitespace checks and the browser runs listed below passed**. Final day/space/bump passed 3/3; bump passed without an isolated retry. Voices passed all nine cases in three serial groups. Main then tree passed the paired mobile benchmark. Native before/after strips and the rewritten next ten are below. Runtime source was frozen for the final checks; the report retains the limits of earlier broad sweeps and the failed/interrupted development attempts.

## Changes

- Ordinary washing, stirring and watering read the real room/chore surfaces. Sponge contact follows the washing bowl's current water height; the wooden spoon bowl traces a small circle within the real saucepan, including its current object transform. The watering rose stays above a safe patch of the flower bed, derived from `House.REAR.flowers`. Tool offsets, world wrist orientation and reachable working leans are solved together. Cooking's free hand rests on the actual counter. Removing the pan lowers the spoon instead of stirring an absent pan. Work conversations keep their held contacts; the close-conversation backstep is suppressed for these three jobs.
- Routine washing can show the bowl's existing water mesh without changing any plug/fill/chore steps, rewards or saved dish placements. It returns to the player's water state when the routine finishes. No extra mesh is built.
- Dad completes a 162-degree newspaper turn, holds the reverse page to read, and later turns back. The near hand follows the actual leaf while a small inward/upward page movement keeps both wrists reachable. The grip slides toward the fold through the turn, keeping each wrist on its own side rather than crossing the forearms. Listening and speaking pause the page clock. The underlying stack folds with the cover for the original upholstered put-away and retrieval; putting away an already turned page retains its current fold instead of snapping it open. Optional saved presentation fields retain the reading time, leaf and transfer entry.
- Four original printed faces occupy Dad's unused pelvis atlas tile; his trousers already use the leg tile. The atlas dimensions remain unchanged. A solid underlying right page uses the spare plate joint, so the turn reveals a complete two-page inside spread. Its twelve triangles are paid for by sixteen fewer triangles in the Low/Potato briefcase handle; Dad is four triangles lighter overall, with the same skeleton and two draws. **THE DAILY WAIL / TEA TAKES A DAY OFF**, **HOME NEWS / SOCKS FORM ESCAPE CLUB**, **THE INSIDE / MYSTERY OF THE LAST PEA**, and **SPORT / SNAIL WINS SLOW CUP** have distinct illustrations and columns. Mom's magazine and all clothing retain their own cells.
- **78 new base-clip mouth tracks** extend the original forty to **118**. They cover chores, pocket money, household questions and common family questions. The original forty records are preserved exactly. The offline helper reuses the existing phonetic aligner and records source hashes, recorded-word spans, estimated sub-word boundaries and explicit rejects. No recordings, dialogue text, names or selection data change.
- Twelve authored exchange directions add named addressees, a smaller agreeing nod, questioning shoulders or a restrained free-hand offer. Longer replies can relay from their previous speaker to a third nearby person on the base recording clock. Consecutive sentences retain the same recipient. A player conversation clears family relay/return intent immediately. Queue ordering, eligibility, cooldowns, heard history and random selection retain their existing code.

- The sister develops an original red-crayon house, flower and sun beneath her actual nib, with lifted travel between strokes. Her supported paper has a finished **FOR MOM** and heart on its reverse. A shared 35-stroke path drives the hand and painted marks; the existing face-coordinate attribute carries the paper coordinates. One scalar uniform reveals the strokes in the existing material, with no added geometry, varying, texture upload or draw. Talking pauses the nib on the paper; optional saved presentation state retains the picture across restore.

## Measurements

Distances are centimetres, using production r128 skinned geometry. These are contact measurements, not performance measurements.

<!-- R10_METRICS -->
| Measure (cm unless stated) | Main 2.87.0 | Working tree |
|---|---:|---:|
| Washing, full bowl: largest target-height error | 1.866 | 0.000000 |
| Washing, half bowl: largest target-height error | 4.057 | 0.019174 |
| Spoon bowl: largest target-height error | 14.061 | 0.000000 |
| Watering rose: largest target-height error | 10.212 | 0.000000 |
| Complete reading turn (degrees) | 7.650 | 162.000 |

Largest held-tool finger/solid gap: **0.0488 cm**. Paused wrist drift after the initial grip settle: **0.000000000 cm**.
Full/half bowl worst submerged-sponge elliptical radii: **0.8178 / 0.8789** (inside is ≤1). Spoon bowl's lowest vertex stays **0.8184 cm** above the real pan's inner floor.
Turn finger/solid gap: **0.5764 cm** maximum; turned-page put-away entry moves **0.00695 cm**, with **0.000000000 radians** of fold jump. Put-away finger gap: **0.5764 cm**.
Drawing nib/stroke error: **1.22e-13 cm**; six unfinished/finished zero-time restores: maximum nib drift **2.59e-14 cm**, ink drift **0**.

The watering target is **65 cm above soil**; the error above measures the rose against that target, not zero height above the plant. Washing targets use the existing full/half water planes. The kitchen capture also verifies temporary wet/dry rendering with unchanged serialized chore state.

**60 Low/Potato outfit/LOD budgets** checked; maximum **2,998 triangles including shadow**. Family near: Mom **2,818**, Dad **2,994**, sister **2,994**, total **8,806**, six draws. Each person retains two submissions and the original skeleton/atlas dimensions.

Real-playback mouth captures: **6 clips**, **48 sampled consonant contacts**, **40 fully closed MBP frames**. Joined-name playback includes `mom-call/jack`. Attempts and every source sample remain in `r10-mouths/live.json`.

Paired mobile measurements (full main archive first, working tree second): see the raw `r10-final-{main,tree}-perf.json` and `r10-pair-results.json` in `tests/shots/mobile/`. Timing is shared-host software rendering, not physical-device certification.

| Run | Frame p50 / p95 ms, main → tree | Render p50 ms, main → tree | Calls / triangles, both |
|---|---|---|---|
| walk-cpu4x | 299.9 / 399.9 → 183.4 / 216.6 | 31.2 → 20.2 | 181 / 187,554 |
| walk-cpu1x | 166.7 / 216.7 → 99.9 / 100.1 | 7.1 → 4.3 | 63 / 166,722 |

Both runs sampled 832,932 pixels at scale 0.85 with diffuse lighting and adaptation level 5 at measurement. Main passed through levels 3–4 during warm-up; tree started at 5. Renderer peak RSS: main **1,039 MiB**, tree **1,058 MiB**. This single noisy pair supports unchanged scene cost; it does not establish a speed improvement.
<!-- /R10_METRICS -->

## Native evidence

<!-- R10_ART -->
Native matched strips (screenshot pixels cropped and labelled, never resampled):

- [Washing](../tests/shots/models/r10/compare-washup-110.png), [stirring](../tests/shots/models/r10/compare-cook-110.png), [watering](../tests/shots/models/r10/compare-water-35.png), [page turn in the house](../tests/shots/models/r10/compare-paper-35.png).
- [Paper front / full turn](../tests/shots/models/r10/paper-turn-45.png), [put-away / retrieval](../tests/shots/models/r10/paper-transfer-45.png); front and side strips and the crop ledger are alongside these files.
- [Drawing developing under the nib](../tests/shots/models/r10/drawing-close.png), [its reverse](../tests/shots/models/r10-drawing/after/reverse.png). Low/Potato/standard shader views and four phone/tablet orientations are in `r10-drawing/after/`.
- Full native house viewports, two angles, close/wide views and four phone/tablet portrait/landscape sizes: `tests/shots/models/r10-final-house/{before,after}/`.
- Real-play consonant close-ups and source samples: `tests/shots/models/r10-mouths/`; family relay/interruption evidence: `tests/shots/models/r8-exchanges/r10-intent-after/`.

I inspected the work contacts from both kitchen sides, the watering view, the front and inside newspaper lettering, the folded stack, and the developing picture/reverse. The final work region keeps the solid sponge inside the red bowl, the spoon clear of the pan bottom and the free palm clear of the separate kitchen sponge. Mobile and strip reviews are recorded with the final verification results below.
<!-- /R10_ART -->

## Tests and actual exits

<!-- R10_TESTS -->
Exact commands and actual exits; earlier failed attempts remain in the complete JSON ledger and development notes. The dedicated render/contact stages also retain before/after source hashes. Functional fixtures use the recorded raster ratio; native art restores raster 1.0. Performance runs omit the functional raster override.

| Command | Actual exit |
|---|---:|
| `node tests/models-animation.mjs --label=r10-probe --only=idle,walk,stairs,stairs-down,talk,question,page,release,magazine,carry,sit,stand --skip-perf --stairs-rise=20` | 0 |
| `node tests/characters.mjs --only=day,space,bump` | 0 |
| `node tests/people-pass.mjs --desktop --skip-perf` | 0 |
| `node tests/models-intent-r10.mjs` | 0 |
| `node tests/models-paper-r10.mjs` | 0 |
| `node tests/models-paper-r10.mjs --baseline` | 0 |
| `node tests/models-mouths-r10.mjs` | 0 |
| `SMOKE_SCALE=3 node tests/voices.mjs http://127.0.0.1:18081 --only=audio,layout,speak` | 0 |
| `node tests/models-round10.mjs --baseline --folder=r10-final-house --actions=washup,cook` | 0 |
| `node tests/models-drawing-r10.mjs --baseline` | 0 |
| `node tests/models-drawing-r10.mjs` | 0 |
| `node tests/models-cues-r8.mjs` | 0 |
| `SMOKE_SCALE=3 node tests/voices.mjs http://127.0.0.1:18081 --only=muted,names` | 0 |
| `SMOKE_SCALE=3 node tests/voices.mjs http://127.0.0.1:18081 --only=edge,two,prompt,phone` | 0 |
| `node tests/models-round10.mjs --folder=r10-final-house --actions=washup,cook` | 0 |
| `FIXTURE_RASTER_RATIO=.35 node tests/cupboard.mjs http://127.0.0.1:18081` | 0 |
| `node tests/models-round10.mjs --baseline --folder=r10-final-house --actions=water,paper --append` | 0 |
| `FIXTURE_RASTER_RATIO=.35 node tests/identity-house.mjs --case=sarah` | 0 |
| `node tests/models-round10.mjs --folder=r10-final-house --actions=water,paper --append` | 0 |
| `cd tests && FIXTURE_RASTER_RATIO=.35 SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | 0 |
| `MODELS_EXCHANGE_LABEL=r10-final-desktop node tests/models-exchanges-r8.mjs --devices=desktop` | 0 |
| `MODELS_EXCHANGE_LABEL=r10-final-landscape node tests/models-exchanges-r8.mjs --devices=landscape` | 0 |
| `node tests/models-round10-mobile-pair.mjs` | 0 |
| `node tests/models-round10-gate.mjs --only=models` | 0 |
| `node tests/models-round10.mjs --folder=r10-final-house --actions=paper --append` | 0 |
| `node tests/models-round10.mjs --baseline --folder=r10-final-house --only-phone --append` | 0 |
| `node tests/models-round10.mjs --folder=r10-final-house --only-phone --append` | 0 |
| `FIXTURE_RASTER_RATIO=.35 node tests/people-pass.mjs --desktop --skip-perf` | 0 |
| `FIXTURE_RASTER_RATIO=.35 node tests/characters.mjs --only=day,space,bump` | 0 |

Complete unit sweep: **88/88 pass**. This includes `norepeat-unit.cjs`, `welcome-unit.cjs` and `voices-unit.cjs`.

| Exact unit command | Actual exit |
|---|---:|
| `cd tests && node announcements-unit.cjs` | 0 |
| `cd tests && node art-gallery-unit.cjs` | 0 |
| `cd tests && node art-return-unit.cjs` | 0 |
| `cd tests && node audio-routing-unit.cjs` | 0 |
| `cd tests && node beanbag-grip-unit.cjs` | 0 |
| `cd tests && node bedroom-hifi-unit.cjs` | 0 |
| `cd tests && node board-art-unit.cjs` | 0 |
| `cd tests && node bonfire-geometry-unit.cjs` | 0 |
| `cd tests && node bonfire-unit.cjs` | 0 |
| `cd tests && node case-actions-frame-unit.cjs` | 0 |
| `cd tests && node case-eject-unit.cjs` | 0 |
| `cd tests && node cat-pose-unit.cjs` | 0 |
| `cd tests && node console-surface-unit.cjs` | 0 |
| `cd tests && node cupboard-geometry-unit.cjs` | 0 |
| `cd tests && node dialogue-pools-unit.cjs` | 0 |
| `cd tests && node dialogue-requests-unit.cjs` | 0 |
| `cd tests && node family-phone-private-unit.cjs` | 0 |
| `cd tests && node fix-1102-unit.cjs` | 0 |
| `cd tests && node fixes2-1102-unit.cjs` | 0 |
| `cd tests && node fixes3-unit.cjs` | 0 |
| `cd tests && node fixes4-geometry-unit.cjs` | 0 |
| `cd tests && node fixes4-unit.cjs` | 0 |
| `cd tests && node fixes5-unit.cjs` | 0 |
| `cd tests && node fixture-predicate-unit.cjs` | 0 |
| `cd tests && node ghost-commit-unit.cjs` | 0 |
| `cd tests && node graphics-device-unit.cjs` | 0 |
| `cd tests && node grass-state-unit.cjs` | 0 |
| `cd tests && node house-readback-unit.cjs` | 0 |
| `cd tests && node hover-prompt-unit.cjs` | 0 |
| `cd tests && node hs-input-unit.cjs` | 0 |
| `cd tests && node identity-unit.cjs` | 0 |
| `cd tests && node interior-adapt-unit.cjs` | 0 |
| `cd tests && node interior-light-unit.cjs` | 0 |
| `cd tests && node jw-furni-unit.cjs` | 0 |
| `cd tests && node magazine-catalogue-unit.cjs` | 0 |
| `cd tests && node material-reflection-unit.cjs` | 0 |
| `cd tests && node mobile-frame-unit.cjs` | 0 |
| `cd tests && node mobile-phone-unit.cjs` | 0 |
| `cd tests && node models-appeal-unit.cjs` | 0 |
| `cd tests && node models-closeup-unit.cjs` | 0 |
| `cd tests && node models-face-unit.cjs` | 0 |
| `cd tests && node models-grips-unit.cjs` | 0 |
| `cd tests && node models-name-cues-unit.cjs` | 0 |
| `cd tests && node models-rig-unit.cjs` | 0 |
| `cd tests && node models-round10-unit.cjs` | 0 |
| `cd tests && node models-round7-unit.cjs` | 0 |
| `cd tests && node models-round8-unit.cjs` | 0 |
| `cd tests && node models-round9-unit.cjs` | 0 |
| `cd tests && node models-stair-interrupt-unit.cjs` | 0 |
| `cd tests && node models-weight-unit.cjs` | 0 |
| `cd tests && node movement-unit.cjs` | 0 |
| `cd tests && node norepeat-unit.cjs` | 0 |
| `cd tests && node onboard-layout-unit.cjs` | 0 |
| `cd tests && node owner-tools-unit.cjs` | 0 |
| `cd tests && node pause-pan-unit.cjs` | 0 |
| `cd tests && node pc-game-coordinates-unit.cjs` | 0 |
| `cd tests && node people-loop-unit.cjs` | 0 |
| `cd tests && node people-motion-unit.cjs` | 0 |
| `cd tests && node people-pass-unit.cjs` | 0 |
| `cd tests && node physics-unit.cjs` | 0 |
| `cd tests && node placement-migration-unit.cjs` | 0 |
| `cd tests && node pointer-release-unit.cjs` | 0 |
| `cd tests && node print-art-unit.cjs` | 0 |
| `cd tests && node props-geometry-unit.cjs` | 0 |
| `cd tests && node qa6-recovery-unit.cjs` | 0 |
| `cd tests && node qa7-unit.cjs` | 0 |
| `cd tests && node reading-turn-unit.cjs` | 0 |
| `cd tests && node roam-sync-unit.cjs` | 0 |
| `cd tests && node rupee-ledger-unit.cjs` | 0 |
| `cd tests && node season-cat-unit.cjs` | 0 |
| `cd tests && node seated-talk-unit.cjs` | 0 |
| `cd tests && node shop-sparse-unit.cjs` | 0 |
| `cd tests && node sms-private-unit.cjs` | 0 |
| `cd tests && node sound-meter-unit.cjs` | 0 |
| `cd tests && node sound-scheduler-unit.cjs` | 0 |
| `cd tests && node sound-space-unit.cjs` | 0 |
| `cd tests && node starter-unit.cjs` | 0 |
| `cd tests && node static-batch-unit.cjs` | 0 |
| `cd tests && node story-order-unit.cjs` | 0 |
| `cd tests && node story-unit.cjs` | 0 |
| `cd tests && node touch-picking-unit.cjs` | 0 |
| `cd tests && node ui-hud-unit.cjs` | 0 |
| `cd tests && node vfx-unit.cjs` | 0 |
| `cd tests && node voices-unit.cjs` | 0 |
| `cd tests && node wallet-unit.cjs` | 0 |
| `cd tests && node welcome-unit.cjs` | 0 |
| `cd tests && node world-pose-unit.cjs` | 0 |
| `cd tests && node world-sound-unit.cjs` | 0 |

Syntax/whitespace sweep: **22/22 pass**.

| Exact command | Actual exit |
|---|---:|
| `node --check app/public/js/ch-kitchen.js` | 0 |
| `node --check app/public/js/hs-house.js` | 0 |
| `node --check app/public/js/np-beats.js` | 0 |
| `node --check app/public/js/np-life.js` | 0 |
| `node --check app/public/js/np-rig.js` | 0 |
| `node --check tests/models-appeal-unit.cjs` | 0 |
| `node --check tests/models-drawing-r10.mjs` | 0 |
| `node --check tests/models-intent-r10.mjs` | 0 |
| `node --check tests/models-mouths-r10.mjs` | 0 |
| `node --check tests/models-paper-r10.mjs` | 0 |
| `node --check tests/models-rig-unit.cjs` | 0 |
| `node --check tests/models-round10-gate.mjs` | 0 |
| `node --check tests/models-round10-mobile-pair.mjs` | 0 |
| `Python compile: tests/models-round10-report.py` | 0 |
| `node --check tests/models-round10-review.mjs` | 0 |
| `Python compile: tests/models-round10-sheets.py` | 0 |
| `node --check tests/models-round10-unit.cjs` | 0 |
| `node --check tests/models-round10.mjs` | 0 |
| `node --check tests/models-round7-unit.cjs` | 0 |
| `node --check tests/models-weight-unit.cjs` | 0 |
| `Python compile: tools/audio/author-round10-mouths.py` | 0 |
| `git diff --check` | 0 |

Raw ledgers: `tests/shots/models/r10-unit-results.json`, `r10-complete-ledger.json`, `r10-review-results.json`, and `r10-syntax-results.json`.
<!-- /R10_TESTS -->

Early development caught a too-short drawing reach (corrected by fitting the picture and leaning naturally over it), incomplete tool reach, a wrist Euler-order mismatch and assumptions in the historical paper fixture that the leaf never left its front position. These were corrected: the tests now follow the real moving leaf, while the new complete-turn test also checks both solid finger contacts and put-away continuity. The first art camera looked through the kitchen window; final close contact views use kitchen-side cameras. Two serial combined runners were interrupted with exit 143 around the command lifetime limit and were split into shorter stages. An early capture browser briefly overlapped the baseline and was stopped. A later short paper capture overlapped a mouth diagnostic by about two seconds. Neither involved performance sampling. Final browser stages use a task-specific `flock` lock; the affected evidence is rerun under it.

## Limits and unverified paths

<!-- R10_LIMITS -->
- Mouth timings are estimated phonetic boundaries within recorded word spans. Live-play closure checks do not certify a complete human listening audit of every recording.
- Phone/tablet captures use emulated viewports and input. Shared-host software-renderer timing does not certify physical GPU, thermal, audio-output or touch latency.
- The paired walking benchmark does not isolate the developing-drawing shader's cost on a weak physical GPU. Its Low/Potato/standard paths and unchanged submissions are render-checked separately.
- The developing picture is filmed on the production rig against a supported fixture table; a complete ordinary house drawing routine is not filmed in this round's house strip set.
- Arbitrary moved furniture, every seasonal costume's native art, and every possible refresh/input/cancellation combination are not exhaustively swept. Historical model browser films outside the exact command ledger were not rerun; the current animation, R8 exchange/name-cue and dedicated round-10 paths were checked.
- The voices groups, cupboard and identity sweeps preceded the last small contact/paper refinements. The final people-pass rerun passed all desktop cases; the final day/space/bump rerun passed 3/3. Final unit, model animation, exchange, dedicated mouth/drawing/contact and paired-performance checks record frozen-source hashes; the ledger distinguishes each run. The three unavailable everyday recordings remain outside this round's mouth tracks.
<!-- /R10_LIMITS -->

## Rewritten next ten

1. Add a modest pouring stream from the real watering rose to the soil, including interrupted pours and low-detail updates, within the existing rendering budget.
2. Extend surface contacts to wiping, car washing and household hand supports; check moved objects, absent tools and player interruptions from native films.
3. Extend source-qualified painted-mouth directions through remaining chore/request variants and common questions, prioritising inspected consonants over clip counts.
4. Test approach, exchanges, drawing, page turn/put-away, pouring, Esc, refresh and rotation on physical weak phones/tablets, including sustained heat and input/audio latency.
5. Restore or record the three missing everyday recordings, then replace their text-only directions using inspected recorded spans without changing dialogue IDs or selection.
6. Extend authored family exchanges through more long conversations, with meaningful three-way relays and restrained held-tool reactions; keep history and eligibility independent.
7. Add another original picture and a natural show/gift/put-away sequence for the sister's finished paper, retaining the same nib/surface solver and saved progress.
8. Extend native profile-mouth, brows, collars, fingers and clothing-pattern reviews through every child costume and the coated adult, including LOD transitions.
9. Sweep newspaper stack/fold silhouettes, print lighting, moved upholstery supports and culled-owner restoration through long reading/return films and Potato transitions.
10. Review contact shadows, seated supports and held-prop silhouettes through continuous room/stair movement; rank remaining defects from films and contact measurements.
