# Jack Attack 1999: touch controls (research and decisions)

Date: 2026-10-28. Scope: the 3D house on phones and tablets (js/hs-touch.js, the console pads and the Game Lad in
js/rm-tv.js, frame pacing in js/hs-world.js). Owner feedback after round 2 (2.57.6/7, Android Chrome ~412x915):
"janky and hard: research and focus on making mobile controls polished and easy". Tests: tests/mobile.mjs `feel` phase.

## 1. What good mobile 3D games and the platform guidance say

| Topic | Finding | Source |
| --- | --- | --- |
| Floating stick | Spawn the stick where the thumb lands in the left movement area; restrict the area so it never fights buttons | abratabia.com virtual joystick guide; cursa.app touch patterns |
| Dead zone | ~10-15 % of the stick radius (0.1-0.2 typical), radial, with output remapped from 0 at the dead-zone edge (no jump) | abratabia.com; HutongGames/PlayMaker docs; AppGameKit `SetVirtualJoystickDeadZone` |
| Response curve | Fine control near the centre, full speed at the rim; linear feels twitchy at low speeds, too-steep feels sluggish | bugnet.io; abratabia.com |
| Release | Reset output to zero and hide the floating visuals on lift; track by pointer id | abratabia.com; cursa.app |
| Look speed | Tune so one swipe turns roughly 180 deg; players want it consistent regardless of finger speed (Minecraft Bedrock feedback asks for "fixed sensitivity"); acceleration is the usual cause of "inconsistent aim" complaints | Minecraft feedback; mobile sensitivity guides; gimx forum (PUBG) |
| Look smoothing | Light smoothing reduces jitter but adds lag; decouple look from frame time (sensitivity must not change with FPS) | sensitivity guides; Granblue mod notes |
| Contextual buttons | Genshin-style: skill buttons appear only when relevant, keeping the button count down; jump/sprint bottom-right | Genshin guides and reviews |
| Tap to interact | Minecraft Bedrock "Joystick & tap to interact": tap a thing to use it; hold for continuous actions; players ask for a visual indicator of what a long press does | Minecraft wiki and bug tracker |
| Aim assist for taps | Pick the nearest candidate within a generous radius of the touch (an invisible larger hit area, or distance-to-object test) | Fancade "tap to pick closest object"; Construct forum |
| Target sizes | Apple 44x44 pt, Material 48x48 dp (~9 mm); WCAG 2.5.5 44x44 CSS px (AAA), 2.5.8 24x24 (AA) | HIG/Material summaries; W3C WCAG |
| Browser gestures | `overscroll-behavior: none` on html/body stops pull-to-refresh and the glow; `touch-action: none` on the game surface stops pan/zoom; edge back-swipes can still interrupt a touch (handle `pointercancel`) | Chrome developers blog "Take control of your scroll"; Babylon.js forum; Mozilla bug 1807074 |
| Passive listeners | Non-passive touch listeners block scrolling; with `touch-action: none` pointer events need no `preventDefault` to stop panning | Chrome developers blog |
| High-rate input | `getCoalescedEvents()` recovers every sample merged into one pointermove; `pointerrawupdate` for the rare app that needs more; not needed when only the summed delta matters | MDN; Chrome "Aligned input events" |
| Orientation lock | `screen.orientation.lock()` needs fullscreen first (after a user gesture); the lock ends with fullscreen | PlayCanvas forum; bugnet.io; usefulangle |
| Frame pacing | A locked 30 is better than an uneven 40-55; but look and walking feel stepped at 30 when the phone could hold 60 | docs/GRAPHICS.md section 1.5; Chrome rendering guidance |

Sources (fetched 2026-10-28):
[abratabia.com virtual joystick](https://www.abratabia.com/game-controls/virtual-joystick.php),
[bugnet.io](https://bugnet.io/blog/how-to-fix-mobile-virtual-joystick-feeling-bad),
[cursa.app touch controls](https://cursa.app/en/page/touch-controls-for-mobile-games-input-patterns-and-feedback),
[PlayMaker virtual joystick](https://hutonggames.com/playmaker/docs/actions/input-system-actions/input-action-actions/mouse-virtual-joystick/),
[AppGameKit dead zone](https://appgamekit.com/documentation/Reference/Input/SetVirtualJoystickDeadZone.htm),
[Minecraft Bedrock sensitivity feedback](https://feedback.minecraft.net/hc/en-us/community/posts/45759686198669-Fixed-sensitivity),
[gimx forum on PUBG aim](https://gimx.fr/forum/viewtopic.php?p=15560),
[Minecraft PE wiki](https://minecraft.gamepedia.com/Minecraft:_Pocket_Edition),
[MCPE bug 160401](https://bugs-legacy.mojang.com/browse/MCPE-160401),
[Fancade tap to pick closest](https://www.fancade.com/wiki/Tap_to_pick_closest_object),
[Construct touch radius](https://www.construct.net/en/forum/construct-2/how-do-i-18/need-better-touch-radius-58159),
[WCAG target size (Adrian Roselli)](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html),
[Chrome: overscroll-behavior](https://developer.chrome.com/blog/overscroll-behavior),
[Babylon.js back-swipe report](https://forum.babylonjs.com/t/chrome-for-android-aborting-back-swipe-changes-input-handling/27361),
[Mozilla bug 1807074](https://bugzilla.mozilla.org/show_bug.cgi?id=1807074),
[MDN getCoalescedEvents](https://developer.mozilla.org/docs/Web/API/PointerEvent/getCoalescedEvents),
[MDN pointerrawupdate](https://developer.mozilla.org/docs/Web/API/Element/pointerrawupdate_event),
[Chrome aligned input events](https://developer.chrome.com/blog/aligning-input-events),
[PlayCanvas orientation](https://forum.playcanvas.com/t/force-landscape-orientation-mode/14501),
[bugnet.io orientation lock](https://bugnet.io/blog/fix-html5-game-orientation-lock-fails-pwa-android),
[Android Central Genshin review](https://androidcentral.com/genshin-impact).
Most figures come from developer tutorials and community material, not studio postmortems: they are starting points,
tuned below by measurement.

## 2. What was janky in round 2, and the fixes (round 3)

| Problem (measured or found in code) | Fix |
| --- | --- |
| Phones run Potato capped at 30 Hz: look and walking visibly step on a phone that could hold 60 | `hs-world.js`: phones on Potato start at 60 Hz; if the measured rate falls under 50 twice in a row they lock to 30 (stable), and retry 60 after 30 s when frames are cheap. `House.perf().cap` reports it |
| Buttons fired on `click`: a thumb that rolled a few px (click slop) or a second finger made presses vanish ("buttons not working") | HUD buttons act on `pointerdown` with pointer capture, a pressed look and a short buzz; keyboard clicks still work, a pointer's own trailing click is ignored by click detail, including long holds; keyboard/switch activation remains available immediately |
| `touch-action: manipulation` on buttons let a rolling thumb pan or start pull-to-refresh; text selection and long-press callouts on Android | `overscroll-behavior: none` on html/body for handhelds; buttons `touch-action: none`; no user-select/callout while walking |
| Taps had to land exactly on a thing (small things on a 412 px screen are 20-40 px) | Aim assist: exact point first, else the nearest of 16 samples on rings of 14 and 28 px (a fingertip is ~35 px) finds the thing in reach; the click happens there. Measured hit rate round the puzzle cube: 100 % at 0/12/24 px, 38 % at 34 px, 0 % at 48 px at the shipped wider lens |
| Look speed ~95 deg per screen width with up to 2.3x acceleration: slow, and the same drag turned by different amounts | 150 deg across the short side, acceleration capped at 1.5x for flicks (1x below 0.5 px/ms). Measured: a 200 px drag turns 70 deg slow, 82 deg quick |
| Stick output linear after the dead zone | Gentle curve (power 1.35): measured 0 / 0 / 21 / 43 / 87 / 138 cm/s at 10 / 20 / 35 / 50 / 75 / 100 % deflection, 205 cm/s (jog) past the rim |
| A second finger resting on the look side was ignored for the rest of its touch | It takes over the look when the first finger lifts (measured: 50 deg turn from the second finger) |
| The test harness lifted every finger at once (CDP `touchEnd` releases the points it lists) | `tests/mobile.mjs` lifts exactly one finger per `up()`; multi-touch checks now mean what they say |
| Two fingers on a note or the story line pinch-zoomed the whole page; a one-finger drag on a close-up could be taken by the browser (pointercancel mid-turn) | `html.handheld-house{touch-action:pan-x pan-y}` (lists, the diary and JackOS still scroll; nothing zooms); the 3D layers are `touch-action:none`. Measured: one finger turns the mug close-up, two fingers zoom it |
| Three things to read at once on a 360 px phone (coach card, "The PC is still on" note, a secret toast over the story line) | The coach card waits while a note/voice/call is up; portrait toasts sit under the story line |

Kept from round 2 (already in line with the research): floating stick restricted to the left/lower area, radial dead
zone (12 px slop + 14 %), auto-jog past the rim, contextual buttons with verbs, press-to-see-what-it-does labels with
release to act and drag-away to cancel, pointer events with capture and `pointercancel` handling, `touch-action: none`
on the room surface, 44 px+ targets, one-time coach card, haptics via `navigator.vibrate` where supported.

How it is measured (tests/mobile.mjs `feel`, real CDP touches, Pixel profile 412x915): stick speed at 10-140 %
deflection (settled velocity), a 200 px drag slow vs quick, aim-assist hit rates on 8 points at 0/12/24/34/48 px round
an isolated thing (plus one real press 22 px off it that must pick it up), a second finger taking over the look, a
16 px rolling press on Crouch, one-finger turn and two-finger zoom of a close-up, the frame cap, and touch-path
recordings (contact sheets + pose/touch logs) at 412x915, 915x412, 360x740 and 740x360 (`*-path-sheet.jpg`,
`report.json` `paths`). Software WebGL here cannot hold 60 Hz, so the tests see the cap fall back to 30; a real phone
that holds 60 keeps it.

Not done (and why): orientation lock (needs fullscreen; the game already plays in both orientations); gyro look (not
1999, and a motion-permission prompt on iOS); `getCoalescedEvents` (look sums deltas, so merged samples lose nothing).

## Manager verification, 28 October

Primary documentation checked for this release: [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) defines the enhanced 44 CSS-pixel target; [Chrome overscroll guidance](https://developer.chrome.com/blog/overscroll-behavior) explains pull-to-refresh control; [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) and [pointercancel](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event) explain browser gesture ownership and cancellation. The numerical stick/look curves above are game tuning choices measured by our fixtures, rather than standards requirements. The earlier community reading list is historical research, not an independent claim of studio best practice.

Main through 2.57.14 is merged, preserving hands, coach persistence, family personal space, lens and expanded-plot migrations. The coach now also waits for the actual `.rm-note` and discovery toast, and yields visually if a new message arrives while it is visible. Portrait discovery toasts start below the objective. Physical Android/Edge behavior and perceived feel still need Jack's hardware review; software Chromium captures cannot establish real phone frame rate.

The software-host run surfaced the intentional slow-device choice over an item press. General phone fixtures now remember the retained-house preference; the smallest-phone scenario separately forces the real choice and presses Keep the house, asserting pose/mode preservation. No hit-test assertion is relaxed.

A 360 px case press exposed a real shelf conflict: the narrow spine's surrounding rack help won after subpixel finger rounding. The rack now marks its general help as a fallback; nearby visible cases win, while exact doors/people keep priority. A production-picker unit covers case priority, empty shelf help, direct door presses, wall occlusion and reach. The capture helper now uses House.STAND instead of easing from the old eye height.
