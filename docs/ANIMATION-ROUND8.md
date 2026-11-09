# Models and animation, round 8

Live between-turn drinking remains unfinished: both the full and focused exchange checks fail that assertion. The other authored beats, body pivots, held contacts, profile expressions and joined-name cues are implemented.

Base: `bbe75c4` (main 2.83.1). Changes remain in the `models` working tree. No deployment, commit, version, CHANGELOG, AGENTS, production-data or container changes.

## Player-visible changes

- 80 priority lines now carry 126 explicit word-anchored joke, question, warm, firm, thinking and phrase beats. Selection: two repeat-visit welcomes, 23 Chapter 1 lines and 55 everyday time-of-day lines. This is a curated priority set; no player-frequency telemetry was available. The smile grows at the punchline instead of staying at its final strength through the setup. A question can raise the brows without relying on a question-mark keyword.
- Free standing family listeners turn in small planted-foot pivots towards a speaker. Attention must settle for 320 ms; each turn is at most about 25 degrees, at 0.8 rad/s, with a pause between steps. Seats, stairs, station jobs, avoidance and the Bonfire display keep their existing controls. The rig's existing foot solver provides exclusive support; there is no route or position change.
- Seated readers keep both grips, tilt their paper/magazine towards the lap and lower it within both arms' reach. The cup grip and staged sip motion follow a quiet listening interval and lower when its owner speaks; the live between-turn sip assertion remains unresolved (see risks). Its near rim follows the solved mouth through head turns; the free hand rests on the thigh. A seated drawing keeps the crayon and pad, pauses at the nib contact and resumes its previous phase. Engaged one-handed jobs retain the tool and pause their action phase.
- Brows extend slightly towards the temples and have clear fringe space. Painted mouths spread around the original skull; at grazing camera angles, the same mouth paint eases onto the visible cheek. This is a shader coordinate adjustment on the solid head, using the actual render camera and solved head frame. No lip mesh, face card, bone, pass, texture upload or extra draw is added.
- All 402 available joined-name recordings have their own 3,028 painted-mouth cues, including 249 lip/teeth contact spans. The 100 ms join closes the mouth before the base track starts. The original audio is untouched. File/duration qualification retains the existing fallback for absent or replaced tracks.

Both acting and mouth cues use decoded source time, after the actual decoded name prefix. MP3 manifest durations include padding and are unsuitable for qualifying the acting clock; the generated acting pack therefore uses decoded PCM durations. The text-only fallback follows the chosen word anchor and accounts for a displayed name prefix. Cancelled speech and stale timing do not invent a heard punchline. Dialogue words, voice selection, anti-repeat memory and welcome selection are unchanged.

## Numbers and limits

- Low/Potato near/far, including six shadow triangles: Mom **2,818 / 1,731**, Dad (all outfits) **2,998 / 1,895**, sister **2,994 / 1,835**. Near family total: **8,810**, six draws. Maximum over all Low outfits: **2,998**. Final rendered rig probe: **two calls**. These are the existing 2.83.1 counts.
- The native house gallery actually constructs standard-detail rigs: Mom **5,238**, Dad **5,526**, sister **5,546**, unchanged against main. Its first candidate assertion incorrectly applied the Low limit to those rigs; that harness assertion was corrected to compare with main at the same house detail. Low budgets are independently checked by the rig/model suites.
- Geometry contact checks: worst sampled finger-to-page gap below **0.09 cm**; paper lowers about **16.8 cm**, magazine **11.6 cm** in the unit seating fixture. Across twelve sipping cases (three family members × front/45°/±80°), sampled near-rim-to-mouth gaps are **0.43–1.87 cm**. Paused nib height is **0.05 cm** above the pad.
- Four wide-group direction cases (65°, ±100°, 160°): **zero planted-foot drift**, no frame with both feet swinging, maximum heading change **0.01333 rad/frame** at 60 Hz. Thirty-six raised-brow triangle-ray cases cover family Low and Potato fronts and grazing views.
- Cue boundaries are estimated offline at 10 ms, rather than manually verified production phonetics. Runtime clip qualification and source-clock tests are separate from that accuracy limit.

<!-- R8_PERF -->
Final official `mobile.mjs --only=perf` pair: complete archived main first, then working tree; fresh throwaway servers/data and one browser at a time. Both tests exited 0. Source hashes are recorded before/after each sample.

| Case | Main p50 / p95 ms | Tree p50 / p95 ms | Main → tree calls | Main → tree triangles |
|---|---:|---:|---:|---:|
| walk-cpu4x | 233.3 / 349.9 | 333.4 / 600 | 176 → 176 | 174868 → 174868 |
| walk-cpu1x | 100 / 199.9 | 100 / 183.4 | 63 → 63 | 156382 → 156382 |

The final 4× sample is slower: p50 233.3 → 333.4 ms (+43%), p95 349.9 → 600 ms (+71%). Host load rose from 15.4 to 17.5 during those samples. This is a real measured slowdown; its cause remains unresolved. The 1× median is unchanged at 100 ms. Calls and triangles match in this final pair.

The pair uses SwiftShader, adaptation rung 5, diffuse lighting and 832,932 pixels. Shared-host load and scene batching/culling differ between samples; the timing difference is not an isolated measurement of model cost or a hardware FPS promise. The per-rig two-call/triangle checks are independent. Earlier preliminary pair medians were 183.3 → 183.3 ms (4×) and 83.3 → 83.4 ms (1×). The final pair artifacts are `tests/shots/mobile/r8-final-{main,tree}-perf.json`.
<!-- /R8_PERF -->

## Evidence

Local artifacts are under `tests/shots/models/r8/` (before/after), `tests/shots/models/r8-exchanges/`, `tests/shots/models/r8-final-probe/` and `tests/shots/mobile/`. They are ignored review artifacts, not shipped game assets.

The native gallery uses full-resolution house captures at desktop 1366×860, phone 390×844/844×390 and tablet 768×1024/1024×768. Face views use a 1 m observer distance in the front garden, away from the hall's obstructing stairs/walls. Props use the real lounge furniture at front and oblique views. Contact sheets retain source pixels; they crop or concatenate without resizing. The main gallery is a superset of the candidate captures; omitted candidate readbacks still execute the identical simulation steps.

The acting strips replay energy and mouth classes sampled from real decoded recordings on controlled source times. They are acting diagnostics, not a claim of live queue playback. `models-exchanges-r8.mjs` separately exercises twelve alternating real recorded turns in actual seats, with mug, paper and drawing props, using the production queue and clocks. The full candidate run completed 24 turns but failed the drinking assertion; the final focused replay also failed that assertion. The wide-group strip uses production controller ticks with one held speaker target; it is a presentation fixture, not a new authored dialogue sequence.

The original long capture batch received SIGTERM (parent exit 143) after desktop and phone captures. Those captures were retained; the remaining views were split into shorter serial runs with the existing own-browser memory guard. No application error was observed before that termination. The real-exchange fixture originally placed its observer in Dad's chair approach and correctly prevented him seating; the observer was moved clear before staging.

<!-- R8_EVIDENCE -->
| Native registered evidence | Main | Working tree |
|---|---:|---:|
| Profile captures | 120 | 108 |
| Decoded acting strip frames | 21 | 21 |
| Seated prop frames | 40 | 40 |
| Controller group frames | 7 | 7 |

Selected native-pixel review files:
- `tests/shots/models/r8/compare-dad-80.png` — formerly invisible profile mouth versus visible mouth classes.
- `tests/shots/models/r8/compare-mom-0.png` — clear fringe/brow space.
- `tests/shots/models/r8/{before,after}/strip-beat-{mom,dad,sister}.png` — setup, word landing and release on decoded source time.
- `tests/shots/models/r8/{before,after}/strip-prop-dad-paper-65.png` — kept grips and lowered reading.
- `tests/shots/models/r8/{before,after}/strip-prop-mom-tea-65.png` — cup down, speak, sip, return.
- `tests/shots/models/r8/{before,after}/strip-prop-sister-draw-65.png` — held pad/crayon.
- `tests/shots/models/r8/{before,after}/strip-group.png` — body turns through the same held-speaker sequence.
- `tests/shots/models/r8-exchanges/{before,after}/` — live recorded turn captures and saved samples from the latest focused replay.
<!-- /R8_EVIDENCE -->

## Validation ledger

Every unit command and real exit is retained in `tests/shots/models/r8-unit-results.json`; browser gate results are in `r8-test-results.json` and capture/review attempts in `r8-review-results.json`. Earlier failures remain in those ledgers. Passing reruns do not erase them.

Two older unit expectations needed intentional updates: the thigh-support test now uses an unpropped seated pose; the released-paper test explicitly stands before checking world-space release. New tests measure both actual held page surfaces during seated conversation, rather than expecting the seated paper to disappear. A paused-drawing contact failure led to the exact constraint solve while paused. The camera test constructs observers in the solved head frame, including reflected room parenting.

<!-- R8_TESTS -->
| Command | Real exit / result |
|---|---|
| `node --check <each changed JS file>` | 15 individual commands, all exit 0; exact file commands in `r8-syntax-results.json` |
| `MODELS_ROUND=r8 python3 tests/models-units.py` | 84 suites, 0 failures; aggregate exit 0 |
| `node tests/models-animation.mjs --label=r8-probe --only=idle,walk,stairs,stairs-down,talk,question,page,release,magazine,carry,sit,stand --skip-perf --stairs-rise=20` | exit 0 |
| `node tests/characters.mjs --only=day,space,bump` | exit 0 |
| `node tests/people-pass.mjs --desktop --skip-perf` | exit 0 |
| `SMOKE_SCALE=3 node tests/voices.mjs http://127.0.0.1:18080` | exit 0 |
| `node tests/identity-house.mjs --case=sarah` | exit 0 |
| `cd tests && SMOKE_SCALE=3 STORY_SCALE=3 node smoke.mjs` | exit 1 |
| `node tests/models-round8.mjs --baseline --append --compact --parts=profiles --devices=tablet-portrait` | exit 0 |
| `node tests/models-round8.mjs --baseline --append --compact --parts=profiles --devices=tablet-landscape` | exit 0 |
| `node tests/models-round8.mjs --baseline --append --compact --parts=acting` | exit 0 |
| `node tests/models-round8.mjs --baseline --append --compact --parts=props` | exit 0 |
| `node tests/models-round8.mjs --baseline --append --compact --parts=groups` | exit 0 |
| `node tests/models-round8.mjs --append --compact --parts=profiles --devices=desktop` | exit 0; 1 earlier failed attempt(s) retained |
| `node tests/models-round8.mjs --append --compact --parts=profiles --devices=portrait` | exit 0; 1 earlier failed attempt(s) retained |
| `node tests/models-round8.mjs --append --compact --parts=profiles --devices=landscape` | exit 0; 1 earlier failed attempt(s) retained |
| `node tests/models-round8.mjs --append --compact --parts=profiles --devices=tablet-portrait` | exit 0; 1 earlier failed attempt(s) retained |
| `node tests/models-round8.mjs --append --compact --parts=profiles --devices=tablet-landscape` | exit 0 |
| `node tests/models-round8.mjs --append --compact --parts=acting` | exit 0 |
| `node tests/models-round8.mjs --append --compact --parts=props` | exit 0 |
| `node tests/models-round8.mjs --append --compact --parts=groups` | exit 0 |
| `node tests/models-cues-r8.mjs` | exit 0; 1 earlier failed attempt(s) retained |
| `node tests/models-exchanges-r8.mjs --baseline --devices=desktop` | exit 0; 1 earlier failed attempt(s) retained |
| `node tests/models-exchanges-r8.mjs` | exit 1; 1 earlier failed attempt(s) retained |
| `node tests/models-animation.mjs --label=r8-final-probe --only=idle,walk,stairs,stairs-down,talk,question,page,release,magazine,carry,sit,stand --skip-perf --stairs-rise=20` | exit 0 |
| `node tests/models-round8-mobile-pair.mjs` | exit 0 |
| `cd tests && SMOKE_SCALE="3" STORY_SCALE="3" MODELS_BASELINE_REF="HEAD" NODE_OPTIONS="--require=/opt/stacks/landing-models/tests/browser-budget.cjs --require=/opt/stacks/landing-models/tests/models-main-preload.cjs" node smoke.mjs --only=pc-controls --keep-shots` | exit 0; 1 earlier failed attempt(s) retained |
| `cd tests && SMOKE_SCALE="3" STORY_SCALE="3" node smoke.mjs` | exit 0 |
| `node tests/models-exchanges-r8.mjs --devices=desktop --turns=6` | exit 1 |
| `node tests/models-round8-mobile-pair.mjs` | exit 0 |

The initial full smoke exited 1 (11/12): an immediate second PC LOCK IN toggle assertion. The later complete smoke exited 0 (12/12). No application control code was changed. An initial main-comparison preload fulfilled the HTML document and triggered Chromium local-network WebSocket blocking; the corrected diagnostic routes only the three model/voice scripts and keeps a real localhost document. Its otherwise-unused acting-data script remains in the document.

The first live candidate exchange completed all 24 recorded turns with held props, listener reactions and no overlapping voices, but its drinking assertion failed. Capped locomotion dt was one suspected cause of the slow sip schedule. The final correction gives quiet intervals, sip scheduling and sip easing an elapsed-time clock, without changing locomotion dt. A four-rendered-frames/s unit regression was added. The focused six-turn desktop replay also exited 1 with the same Mom drinking assertion. Live between-turn drinking remains unresolved despite the passing slow-render unit. The repeated main → tree performance pair is reported above; the full 24-turn matrix was not repeated after that last timing-only correction. The broader browser gates predate this final sip-only correction; the 84 unit suites and final performance pair follow it.
<!-- /R8_TESTS -->

## Not verified / risks

- No physical phone/tablet, gamepad or hardware-GPU certification. Software Chromium frame timings are comparative diagnostics on a shared host.
- No manual listening/phonetic audit of every one of the 402 names or 80 acted clips. The source-qualified tracks, decoded clocks, real playback paths and selected native strips are checked; phonetic sub-word timing remains estimated.
- The family fronts/three-quarter/side expressions are reviewed. Every seasonal costume's native facial art is not individually re-reviewed; all Low outfit triangle limits remain enforced.
- The view-dependent mouth placement is deliberately stylised. Front and three-quarter placement is restrained; near-profile paint shifts to remain visible without adding geometry.
- Git metadata is read-only in this sandbox. The pre-existing untracked `app/public/audio/voice` link was preserved; it is not part of this change.

<!-- R8_RISKS -->
The final 4× paired timing regressed and needs a quieter paired investigation; the passing test does not establish performance parity. Live between-turn drinking is unfinished: the slow-render unit passes, but both the original 24-turn run and final focused six-turn replay fail the Mom sipping assertion. Held-prop and staged contact checks pass. All requested pre-existing suites were run; broader browser gates and the passing full smoke rerun predate the last sip-only clock correction. No feature changes were started after the cutoff. Changes remain uncommitted because git metadata is read-only.
<!-- /R8_RISKS -->

## Rewritten next ten

1. **Finish live between-turn drinking:** investigate why the staged and four-frames/s unit sips pass but real queued exchanges keep Mom's mug too low. Preserve held grips, elapsed-time scheduling and speech selection.
2. **Next base-clip mouth cues:** extend beyond the original forty base recordings, starting with chore hand-ins, pocket money, repeat visits and everyday questions. The joined-name pack is complete for the currently available recordings.
3. **Remaining everyday acting:** direct the other 53 time-of-day lines with explicit word anchors, then frequent household barks. Keep their existing moods and selection/history behaviour.
4. **Phone-to-ear contact:** make the existing phone grip follow the solved head through oblique conversations, using the same contact principle as the cup.
5. **Workstation listening:** add small shoulder/torso acknowledgements while washing, cooking and watering, without rotating hands away from the work surface or changing routes.
6. **Put the reading away visibly:** fold/tuck a paper or magazine before standing and recover it on return, with both grips constrained during the transfer rather than relying on scale fades.
7. **Family turn hand-offs:** direct addressee gaze, a held reaction and a small returning gesture across actual multi-line family exchanges, preserving player control and current anti-repeat rules.
8. **Original drawing-pad artwork:** let a small, period-appropriate crayon doodle develop under the nib, with clean paper edges and a supported reverse, while preserving the current hand contacts and draw budget.
9. **Costume profile pass:** carry the native side-mouth/brow review through every child costume and the coated adult, including hats, Potato textures and distant LOD transitions.
10. **Native interaction films on real devices:** review approach, conversation, cup/paper/drawing interruptions, Esc, rotation and refresh on physical phones/tablets, then rank the remaining visible motion issues from those films.

## Changed files

- `app/public/index.html` — load acting data before the rig.
- `app/public/js/np-beats.js` — generated 80-line performance directions.
- `app/public/js/np-rig.js` — acting, held props, contact, fringe and profile paint.
- `app/public/js/np-life.js` — presentation-only listener pivots and line-ID forwarding.
- `app/public/js/st-voice.js` — decoded source clock and joined-name cues.
- `app/public/audio/voice-name-phonemes.json` — source-qualified name mouth tracks.
- `tools/audio/author-acting-beats.py` — explicit anchors and offline word timing.
- `tools/audio/author-name-cues.py` — offline name-track authoring.
- `tests/models-round8-unit.cjs` — acting, contact, pivots and brow/camera checks.
- `tests/models-name-cues-unit.cjs` — original hashes and name cue invariants.
- `tests/models-cues-r8.mjs` — real decoding and source clocks.
- `tests/models-round8.mjs` — native matched house snapshots.
- `tests/models-exchanges-r8.mjs` — live seated recorded exchanges.
- `tests/models-round8-mobile-pair.mjs` — complete main archive, then working tree.
- `tests/models-round8-sheets.py` — native-pixel strips and comparisons.
- `tests/models-round8-gate.mjs` — serial requested regression gate.
- `tests/models-round8-review.mjs` — resumable serial capture/review ledger.
- `tests/models-main-preload.cjs` — unchanged-main browser comparison and lock-input diagnostics.
- `tests/models-appeal-unit.cjs` — retain standing paper-release coverage.
- `tests/seated-talk-unit.cjs` — unpropped thigh-support coverage.
- `docs/PEOPLE.md` — current presentation behaviour and budgets.
- `docs/ANIMATION-ROUND8.md` — this report and next ten.
