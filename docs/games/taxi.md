# Mad Minicab (Daydream) — depth pass 1

Parody of the late-90s arcade crazy-cab classic. All code, models, textures, music and text are original; town, shop
and place names are invented parodies. Every person on screen who is "someone you know" comes from `window.Cast`
(`me`, `mate1`–`mate4`, `sister`; Mom/Dad/Gran are family titles). Internal ids/save keys are unchanged
(`dc.taxi`, medal ids, `sv.mates.dave|luke|callum|jackk` are keys only, never shown).

## Scope: the original vs this cartridge

| Feature / content | Original has | Before this run | After this run |
| --- | --- | --- | --- |
| Arcade mode (fares buy time) | Yes, time bonus per drop by speed | Yes | Yes, unchanged handling |
| Work shifts 3 / 5 / 10 min | Yes | Yes | Yes |
| City | 1 arcade city + 1 extra city on the home port | 1 town (48×48 blocks, 26 places, hill, pier, river, docks) | Same town (second city not built) |
| Fare colour by distance + countdown | 5 colours, per-fare timer | 3 colours, per-fare timer, bail-out | Same |
| Drivers | 4 (with own cars) + unlockables | 4 (one unlockable) | 4; driver select is now a 3D showroom (the real cab on a turntable + the driver modelled beside it) instead of flat painted rectangles |
| Crazy moves | Dash, drift, back dash, stop, limit cut | Dash, drift, through, jump | + **Crazy Stop** (flat-out to dead stop). Back dash / limit cut not built |
| Combo tips | Yes | Yes | Yes |
| Skill challenge box | 16 tests in a grid, opened progressively, ends in a finale | 10 tests, all open | **16 tests in a 4×4 grid**; each row opens with 3 medals in the row above; six new tests (Crazy Stop, Hilltop Hop, Backwards Bolt, Combo King, Midnight Pop, The Big One) |
| End-of-shift licence grade | Class rating at the end | Rank title by money only | **Licence class E–S** judged per minute (so 3/5/10/arcade compare), stamped on the results card; best class per mode saved |
| Licence / records | Records screen | Cabbies' table, medals | + **LICENCE** screen (player's licence card: name from Cast, driver, fares, takings, class per mode, 16-medal strip) |
| Ending / credits | Box completion reward | None | Medal on all 16 tests → "FULL LICENCE" result, then the staff roll (also on LICENCE page 2) |
| High-score names | Rival names | Fixed real-cast names (DAVE, LUKE…) baked into saves | Cast ids (`@mate1`… `@sister`, MOM, DAD, GRAN) resolved when drawn; old saves migrated in place; the player's row uses `Cast.me()` |
| Fare characters | Many | 14 folk + 4 mates + Mom | Same people; mates' names and every "JACK" line now come from the player's cast (`{ME}`) |
| Refresh / pause safety | n/a | Refresh lost the shift; Mom's line used a wall-clock timer | Shift snapshot (clock, money, tips, fare + destination, cab pose) autosaved every 3 s and on pause; a refresh resumes **paused**; a test in progress restarts that test; Mom's second line is on the fare clock |
| Attract demo, title, options, expert code | Yes | Yes | Yes (how-to now two pages: controls + the crazy moves) |
| Soundtrack | Licensed punk | Original chiptune-ish songs | Same |

## Critique, ranked (what was fixed)

1. **High — names:** real cast names hard-coded in the cabbies' table, mates and Mom ("JACK?!"). Fixed (Cast + migration).
2. **High — refresh-safety:** a refresh dropped the shift. Fixed (snapshot/restore, resumes paused).
3. **High — depth:** 10 always-open tests, no licence class, no ending. Fixed (16 gated tests, class E–S, licence card, credits).
4. **High — art:** driver select used flat 2D rectangles for cars. Replaced by the real 3D cab + driver model.
5. **Medium — results screen:** gameplay HUD (clock, minimap, speedo, VMG card) drew through the results. Now a clean card layout.
6. **Medium — VMG "saving" card** sat on top of the speedo and was timed by draw calls; now timed by the game clock and placed clear of the speedo.
7. **Medium — menu headings** overlapped the hazard-stripe logo on every sub-menu. Logo shrunk/moved.

## Next chunk to build (not done)

- Crazy Back Dash and Limit Cut moves; a 4th–5th fare colour band.
- Second city (the "home port" extra map) — biggest remaining content gap.
- Unlockables beyond Nan (bonus vehicle, e.g. a milk-float or rickshaw; another for an S class).
- Per-fare floating countdown above the passenger's head (original style) and destination signposts.
- Medal thresholds for Hilltop Hop / Combo King / The Big One need tuning from real play.
- Gamepad and touch passes in the room were not re-verified in this run.

## Reproduce

`node tests/games/taxi.mjs` (own throwaway server + `/tmp/jhp-taxi-*` data) plays the production cartridge at native
640×480 with real key edges: title, attract demo, every menu, driver select, countdown, throttle, drift, crazy dash,
pick-up, pause, mid-fare refresh, drop-off (long drive uses the cartridge's own autopilot), results with licence class,
all 16 Crazy Box starts, row locks, crazy stop, refresh during a test, sunset/night, model showcase, a frame-time sample,
then the real bedroom (telly view, LOCK IN, keyboard drive, house menu freeze, refresh resume).
`--baseline` plays the committed HEAD cartridge into `tests/shots/games/taxi/before/`.

## Performance (SwiftShader, native 640×480, update + draw + 1-px readback, arcade start)

Before: mean 62.4 ms, p95 86.6 ms (host load ~9–13). After: mean 58.4 ms, p95 64.7 ms (host load ~15). Same scene
(61 draw calls, ~34k triangles); this run added no per-frame geometry, so the difference is host noise. The shared
host's software renderer is well under the console's 30 fps target either way; a real GPU is not the bottleneck.

## Review shots

`tests/shots/games/taxi/before/*.png` vs `after/*.png` (each with a `-native.png` 640×480 frame): `drivers`
(flat rectangles → 3D showroom), `menu-box` (10 open → 16 gated), `results` (HUD bleed → clean card + licence class),
`refresh-paused` (new), `menu-licence`, `menu-licence-2` (credits), `menu-how-2`, `test-0`…`test-15`, `crazy-stop`,
`test-result-gold`, `refresh-test`, `tod-sunset`, `tod-night`, `in-room`, `lock-in`, `lock-in-play`, `refresh-room`.
