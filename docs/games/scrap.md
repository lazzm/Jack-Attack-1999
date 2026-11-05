# Street Scrapper II — cartridge depth and review

This is an original 16-bit tournament-fighter parody, drawn at 256×224 and displayed on the Super Ultra telly. The reference is the early World Warrior console format that would still be on a teenager's shelf in 1999, not the entire later series. No reference assets, code, logos or music were used. The [publisher's original-game overview](https://www.nintendo.com/en-gb/Games/Super-Nintendo/Street-Fighter-II-The-World-Warrior-793127.html) describes the eight distinct starting fighters, individual endings and two-player play.

## Scope at this run

| Feature / content | Original format has | Before | Now |
| --- | --- | --- | --- |
| Starting roster | Eight distinct fighters | Eight | Eight; actor names from the player's cast, stable costume/save IDs |
| Final gauntlet | Four bosses after seven rivals | One boss; eight total fights | Four promoters; eleven fights, no duplicate opponent IDs |
| Arenas | Twelve fighter arenas | Nine plus bonus driveway | Twelve plus driveway; three new layered arenas, original promoter themes |
| Core combat | Six buttons, strengths, crouch/jump attacks, throws, block/chip, special motions, dizzy, combinations | Present | Retained; tested with real keys, motion inputs, touch and pads |
| Arcade structure | Best of three, travel, quotes, continue, ending | Present, short ladder | Full eleven-bout ladder; twelve cast-aware three-page endings over animated arena/win scenes; dedicated illustrated storyboards remain a later chunk |
| Bonus rounds | Multiple timed destruction diversions | Fridge; intended 30s incorrectly became 99s; black result transition | Fridge and fizzy barrel stack, true 30s clock, visible damage states and results |
| Versus | Local head-to-head | Missing | CPU or local player 2, twelve arena choices, rematch/change fighters/title |
| Training | Later revisions/collections add practice | Five dummy behaviours, move list | Retained; per-string damage, pause and exact saved practice state |
| Options | Difficulty, clock and controller/sound settings | Missing | Eight difficulty levels, 60/99 clock, shake switch; controller/audio remain the console's shared controls |
| Character secrets | Mirror colours; playable bosses in later editions | Alternate colours and two achievement hooks | Colours, achievements, earned promoter selection after a championship |
| Ending / credits / score table | Distinct endings, staff roll, score entry | Present; fixed names | Complete route tested; dynamic cast credits/defaults and player initials; existing saved entries preserved |
| Attract / audio | Title, scores, CPU demo, stage themes, impact cues | Present | Retained; three additional authored themes; cast-safe tips |
| Cartridge state | Original hardware did not offer exact mid-bout saving | Between-match ladder checkpoint | Exact simulation, projectiles, throws, AI plans, clocks, round wins, pause, selection, quotes and ending pages; Save & Title |
| Mobile / physical screen | Original controller/TV only | Shared console runtime; heavy attacks beside movement | Same cartridge on real telly / LOCK IN; six attack strengths under the right thumb; compact landscape layout; phone and tablet review |

Existing version-1 cards remain version 1 at the shared save API. The new `session.version: 2`, `options` and optional `suspended` data are additive. The difficulty setting now has eight levels; an earlier three-level option maps to its matching easy/normal/hard setting, and an existing run retains its own scale and clock. Old eight-bout ladders finish as saved; new ladders have eleven bouts. Player-entered high-score names, scores, championship flags and unrecognised card fields are retained. New default names and authored names/credits use `Cast` (`me`, `mate1`…`mate4`, `sister`). The same cast member can act in multiple costumes; costume IDs never change. Original eight-bout saves retain their original difficulty curve and clock. A regular new run faces seven rivals plus four promoters; a promoter run faces eight regulars plus the other three promoters. Both have eleven bouts.

## Controls

Player 1: arrows; V/C/U light/medium/heavy punch; X/Z/E light/medium/heavy kick; Enter pauses. Hold away to block, down-away for low block; direction + heavy at close range throws. The move list explains each fighter's motion commands. Physical gamepads use the shared Super Ultra mapping. Phones use a cartridge-scoped six-button fighting panel: Y/X/L punches above B/A/R kicks, all on the right; direction remains on the left. It keeps the runtime's multi-touch capture and restores the generic pad on ejection. Q, T, Escape and Ctrl+F remain house/browser controls.

Local player 2: a second standard gamepad, or I/J/K/L and 1/2/3 punches, 4/5/6 kicks. Both pads use the same button mapping. Select/Shift on character selection switches to the earned promoter crew. Versus defaults to CPU; the venue page explicitly selects CPU or player 2.

## Harsh baseline critique and changes

1. **High — state loss:** refresh dropped the current round, projectiles, training and selection. Added simulation snapshots, reference reconnection and scene restoration; lifecycle flush, periodic save, and Save & Title. No renderer surfaces enter the card. A second refresh during cold sprite loading retains the original fight checkpoint. A finished score receipt also restores, with no new scoring token or duplicate score submission.
2. **High — missing finale:** one boss could not deliver the classic four-step climax. Added parcel boxer, masked mopper and tea master, each with an individual silhouette, outfit, stance, speeds, special set, arena and original theme. The existing Baron completes the gauntlet.
3. **High — authored names:** default scores, credits, tips and character notes forced the owner's cast onto other players. Authored display names now follow the account's cast; legacy player-entered initials remain untouched.
4. **Medium — incomplete modes:** added local/CPU versus, venue selection, rematch and saved options. Championship completion unlocks promoter costumes, with their move lists, colours and ending pages.
5. **Medium — bonus presentation:** fixed the overwritten clock, added the fizzy barrel diversion and replaced the blank result screen with a clear score/result card over the arena.
6. **Medium — lettering:** fitted full titles and long names, repaired crowded selection/score columns and centred the dock sign. Nothing is silently truncated. All 36 complete ending paragraphs have measured bounds checks; pronouns distinguish the winner, the Baron and Mom correctly.
7. **Medium — phone combat:** moved both heavy attacks into the right-hand six-button group and added compact landscape wings. Tests hold movement while pressing every strength, including at 320×568 and 568×320.
8. **Medium — motion notation:** corrected the rising special to show its required down-right finish; real right/down/down-right input launches SKY FIST.
9. **Medium — palette defaults:** corrected three-digit hex colours so grey/white material defaults no longer become blue.

The existing shaded sprites, planted contact shadows, parallax stages, camera tracking, hit-stop, sparks, dust and falling debris were worth retaining. No kart/racing machinery was added to this fighter.

## Verification and captures

Runner: `node tests/games/scrap.mjs` owns its disposable localhost server and temporary data. `--baseline` uses the original script captured before editing at `/tmp/scrap-before.js`; `--native` limits the run to the cartridge harness; `--room-only` limits it to physical integration; `--quick` skips the original arena gallery. One browser runs at a time.

Captures: `tests/shots/games/scrap/before/` and `after/`, with both displayed PNGs and `*-native.png`. Each contains title, menus, select, fight start, real motion special frame sequence, collision, pause, moves, original arena starts/mid-fight and attract. The after directory adds options, venue/local versus, exact restore states, K.O./results, both bonuses, eleven ladder results, endings, credits, high scores and all four promoters. Physical/touch captures and performance results are recorded below. `before/touch-pad-phone-*` shows the generic pad immediately before the ergonomic pass, with the other game improvements already present. `after/ending-review-page-*.png` collects all twelve costumes on each ending page.

The eleven-bout regression uses bounded K.O. fixtures to exercise every real round/match/progression transition. It is not a claim that an autoplay agent beat the entire tournament. Movement, six attacks, quarter-circle and rising-motion specials, damage, blocking/chip, fireball clashes, local second-player input, pause and controller polling use real DOM/CDP input. A real-input CPU bout finished 2–0 with 14 landed hits; the eleven-bout progression uses separate bounded fixtures. Save tests compare the entire simulation snapshot after restore, including projectiles and cyclic throw ownership. Physical integration performs real page reloads of both a paused fight and the finished score card, account save acknowledgement, right-thumb/movement chords at six phone/tablet sizes, and pad-style cleanup on ejection.

## Next chunk

Add a genuinely moving bonus obstacle course (rolling fizzy barrels rather than the current destructible stack), authored promoter storyboards beyond the three text pages, and independent simultaneous two-pad character selection. A later-edition expansion could add speed settings, a bracket mode and further starting fighters, but those are not prerequisites of this cartridge's World Warrior target. Longer human play sessions should tune all twelve matchups and command-grab corner cases; automated state-machine coverage is not a balance assessment.

## Final results

Final verification:

- `node tests/games/scrap.mjs --baseline` — exit 0, original cartridge and physical telly; final matched benchmark instrumentation.
- `node tests/games/scrap.mjs` — exit 0 on the final full desktop/phone pass, including compact phones, legacy continuation, all 36 ending pages, two-finger attacks and completed-result refresh.
- `node tests/games/scrap.mjs --native` — exit 0 in the focused pass. The final full run also covers cold/double refresh, the original legacy difficulty curve and all twelve ending routes.
- `node tests/games/scrap.mjs --native --quick` — exit 0 on the final motion-notation pass; the documented rising command launches correctly.
- `node tests/games/scrap.mjs --sheets` — exit 0; labelled native PNG review sheets, with annotations outside the game image.
- `node tests/mobile.mjs --only=gate` — exit 0, 1/1.
- `for f in tests/*-unit.cjs; do node --expose-internals "$f" || exit; done` — exit 0, all 51 files.
- `node --expose-internals tests/parody-audit.cjs` — exit 0, zero authored spans to rewrite.
- `SMOKE_SCALE=4 node tests/smoke.mjs` — exit 0, 12/12; full-resolution software WebGL, no raster cap. No browser errors or failed server modules.
- Default `node tests/smoke.mjs` — interrupted, exit 130 after shared-house refresh/loading and PC-control timeouts; those same paths passed with the runner's documented timing multiplier. No shared house/test-runner code was changed.

Final before/after frame statistics are written into `before/performance.json`, `after/performance.json` and each directory's `display-performance.json`. Native samples include production simulation, draw and one-pixel canvas readback after warm-up, with typography instrumentation disabled during timing. Display samples warm up after LOCK IN and include the whole page. Host load and the software GPU renderer are recorded. These are CPU-host diagnostics, not hardware FPS claims.

| Software-host measurement | Before | After |
| --- | --- | --- |
| Native simulation + draw + readback, median / p95 | 1.5 / 3.4 ms | 1.4 / 1.8 ms |
| Native worst sample | 7.8 ms | 3.6 ms |
| Whole displayed LOCK IN view, median / p95 | 33.3 / 50.0 ms | 33.3 / 49.9 ms |

Renderer: Chromium / ANGLE SwiftShader (Subzero). Native timings remain below a 16.7 ms simulation-frame budget; the complete software-rendered house/page has a slower display cadence. Runs varied with host contention, so the figures do not establish a hardware speedup. The largest cartridge snapshot observed was 4,563 bytes, comfortably below the 20 KB roaming-card threshold.

Not verified: extended human balance testing of every matchup and subjective audio audition. The full ladder's transitions are covered, but only the early CPU bout was won through real attack inputs. Dedicated ending storyboards and a moving bonus course are the next content chunk.
