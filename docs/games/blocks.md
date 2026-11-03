# Blockology — Game Lad cartridge

Native 160 × 144, 10 × 18 well. All code, pixel art and four chip tunes are original.
The benchmark is the late-90s handheld falling-block genre: the complete endless,
25-line junk and link-style score-chasing loops, with a handheld-sized presentation.
This pass preserves the cartridge ID, save version and existing player scores.

## Depth / scope

| Feature / content | Handheld benchmark has | Before this pass | Current cartridge |
| --- | --- | --- | --- |
| Core well | Seven shapes, rotation, soft drop, next piece | All present | All retained; reliable D-pad repeat, release and reversal; analog stick supported |
| Endless play | Starting levels 0–9, escalating speed and score | Marathon; high starting levels stalled progression | Marathon; ten cleared lines advances from the selected level |
| Junk challenge | 25 lines; ten levels × six heights | All 60 combinations, isolated attempts | All 60; persistent stamps, flight log, next-flight progression |
| Timed score / line race | Additional score-attack variations in the genre | Three-minute Ultra and 40 Lines | Both retained, exact timer/well saves and native results/retry loop |
| Versus | Two wells, line attacks, match results | First-to-three CPU; easy/normal/unlockable hard | Retained; saved CPU board, pending junk, current plan, score and round intermission |
| Human link | Two human players | Absent | Absent; CPU and cartridge high scores provide the current rivalry loop |
| Rewards | Score-dependent launch scenes | Three launch sizes | All three; every B-Type clear launches, 9-5 shuttle finale and cast credits |
| Secrets | Hidden difficulty / special rewards | Heart speed, music D, hard CPU, launch secret | Retained; flight stamps and finale are battery-backed |
| High scores | Cartridge initials and bests | Four top-five tables; fixed authored people | Four tables; factory initials from mate1–4/sister, player initials from Cast.me; user records preserved |
| Audio | Original chip music, music selection, effects | Three tunes + unlockable fourth / OFF | Retained; separate persisted music/effects switches in options and pause |
| Picture | Restricted colours, patterned chunky blocks | Colour default; classic optional | Four-shade default for new cartridges; colour preference preserved on old cartridges |
| Battery | Safe suspended progress | Partial Marathon/B-Type only; bag/hold/clears lost | All five modes, wells, bag/RNG, hold permission, gravity/lock, clears, timers, CPU, initials, launches and credits; staff-roll replays preserve parked runs |
| Presentation | Attract play, menus, small readable HUD | Present; overlaps, overlong banners, results handed off to shell | Native menus/results, smaller notices, stationary HUD during impact, uncluttered options |
| Controls | D-pad, two turn buttons, Start/Select | Keyboard and shared console controls | Keyboard, D-pad/analog gamepad, moulded handheld buttons and LOCK IN phone controller |

## Review priorities

Initial critique, in order:

1. **High:** Timed/CPU runs could disappear on refresh; clears, hold permission and
   the random stream were not saved. A resumed hold could be used twice.
2. **High:** Factory scores named fixed people instead of the player's cast.
3. **Medium:** No persistent route through the 60 B-Type presets or staff ending.
4. **Medium:** Long well notices, menu scores and option values could overlap.
5. **Medium:** Level progress stalled when starting above zero. Direction repeat
   retained charge after release. Results left the cartridge for a generic score card.
6. **Medium:** No independent music/effects switches; impact shifted the whole HUD.
7. **High, discovered in rendered review:** first contact on an already visible
   console pad was lost when input changed from keyboard to touch.

Implemented fixes are listed in the scope table. The visual review also caught
and fixed a long Marathon description crossing its panel, a level-up replacing
the four-row celebration, and a credits scroll that stopped before THE END.

Before / after examples (full views and matching `-native.png` captures):

- `tests/shots/games/blocks/before/04-menu.png` → `after/04-menu.png`:
  uncluttered menu and a direct flight-log entry.
- `before/10-pause.png` → `after/10-pause.png`: readable native pause menu,
  independent audio controls, and an explicit save-and-quit path.
- `after/16-flight-log.png`, `after/38-flight-stamp.png`: 60 persistent goals
  and the next-flight loop.
- `after/26-medium-rocket.png`, `after/40a-shuttle-pad.png`,
  `after/41-credits.png`, `after/42b-the-end.png`:
  launch, cast credits and the final card.
- `after/44-phone.png`, `after/44-phone-landscape.png`, `after/45-touch-playing.png`:
  handheld proportions and the actual phone controller.

All relative `before/` and `after/` paths above are beneath
`tests/shots/games/blocks/`. These review images are intentionally ignored by git.


## Saves and scoring

The existing `rm.gb.blocks` version-1 save envelope is retained. A nested `cart`
record carries the expanded state, tagged `v: 2`; old flat well records still load.
Untouched factory score rows are recognized by their original score/level/time and
reseeded from the cast. Three-character user initials and all user scores survive.
No economy state or account data is edited. Scores still use the console's existing
server-held scoring protocol; cartridge results use its backwards-compatible
`keep` option so the game can show its own native results and retry controls.

Progress checkpoints every second, at pause and important transitions, on hidden
tabs, before unload, pagehide, and cartridge end. Returning to active play after a
reload starts paused. Quitting explicitly parks the run behind CONTINUE. Timers
measure active game time only; the house Esc menu freezes the console simulation.

## Repeatable review

`node tests/games/blocks.mjs --baseline` serves the checked-in cartridge source
from HEAD in an isolated throwaway account. `node tests/games/blocks.mjs` reviews
the working tree. `--logic` runs the fast behavioral checks alone, including all
60 challenge win/launch paths, legacy batteries and deterministic future bags.
Each full command owns one browser and one child server on port
18089 (`BLOCKS_PORT=18080..18099` overrides it), with a fresh DATA_DIR under `/tmp`.

Captures: `tests/shots/games/blocks/{before,after}/`; each screen has a full-view
and exact native-resolution PNG. The test records short frame sequences, checks
real keyboard/phone/gamepad input and saves, and uses the existing debug fixtures
to reach expensive endings. One 25-line flight is played using real rotations,
direction presses and drops with a placement adviser. Finale preparation and CPU
deaths are explicit accelerated fixtures, not claims of human skill.

Performance: a warmed native update+draw batch and real requestAnimationFrame
intervals are recorded in each capture directory's `performance.json`. The after
run also writes `matched-performance.json`: alternating before/after batches
in one browser to reduce variation from the shared host. No extra
dependencies are required. The only shared-kit change is in `rm-tv.js`: an
identical visible control pad now retains its DOM/listeners during an input-mode
switch. Rebuilding it during pointerdown detached the very first touch/mouse
press. The regression flow checks another Game Lad cartridge and the kart game,
and the normal smoke/mobile gates cover the shared console path.

## Final cartridge verification

`node tests/games/blocks.mjs` passed the rendered flow, including a complete
25-line flight using 77 real-input placements. The fast suite also covers every
level/height win and launch, solo top-out paths, CPU loss, legacy batteries,
future piece streams, and staff-roll replay without losing a parked game.
Keyboard, first-contact touch, analog gamepad, Esc pause, Q/LOCK IN, six viewports,
and the same shared controls in `gb.mon` and `n64.kart` passed. Browser warning/
error collection and the throwaway server's module-load check were clear.

Reviewed captures include title/attract, mode/music/level menus, mid-play and
line-clear frames, native results/initials, all three launches, flight stamps,
cast credits/THE END, pause, the in-room handheld, phone portrait/landscape and
tablet portrait/landscape. No high or medium findings remain in those implemented
paths. Human link play is still the explicit scope gap in the table above.
Physical devices/controllers and audible music quality were not manually reviewed.

## Measured performance

Final matched native samples, alternating old/new batches in the same browser.
The smoke renderer identified ANGLE/Vulkan SwiftShader (software rendering):

| Measurement | Before | After |
| --- | ---: | ---: |
| Native update + draw, mean | 0.915 ms | 0.973 ms |
| 60-frame batch average, p95 | 1.168 ms | 1.202 ms |
| Browser frame interval, median | 16.7 ms | 16.7 ms |
| Browser frame interval, p95 | 16.7 ms | 16.8 ms |

The matched cost increase is about 0.06 ms; both are comfortably inside a
16.7 ms frame budget. Native batches stub audio and persistence to measure the
engine/drawing cost. Browser frame intervals are sampled from the actual page with LOCK IN active;
they are separate from the batch figures. The host is shared, so earlier
separate-run means varied and are not evidence of a speed improvement.

## Broader gates and limits

- Full smoke: **12/12 passed** with `SMOKE_SCALE=4` under SwiftShader; browser
  errors and server module-load checks clear. The initial automatic allowance
  expired during cold setup, so signup and unchanged-HEAD PC controls were also
  rerun alone and passed before the successful full rerun.
- `tests/mobile.mjs --only=tablet`: **1/1 passed**, with portrait/landscape shots
  reviewed in `tests/shots/mobile/tablet-*.png`.
- The broader `--only=full,tablet` process ended with **SIGTERM** before its
  summary. Phone captures reached the physical Game Lad, two-finger controls,
  LOCK IN, rotation and phone/diary screens. Its complete full-phone phase is
  **not verified**; the dedicated Blockology phone-input run passed separately.
- Syntax, fast cartridge regressions, shared input unit tests and the global
  authored-parody audit passed (zero replacements). No deployment or commit was
  performed; live data and unrelated working-tree files were not changed.

## Next chunk

Real human link play: two consenting players, synchronized piece streams and
garbage, reconnect-safe match state and a link-cable presentation. The current
CPU match is not human multiplayer. A later art pass could add more launch-pad
vignettes and flight-log medals without changing the core rules or save keys.
