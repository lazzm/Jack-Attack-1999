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
| Buttons fired on `click`: a thumb that rolled a few px (click slop) or a second finger made presses vanish ("buttons not working") | HUD buttons act on `pointerdown` with pointer capture, a pressed look and a short buzz; keyboard clicks still work, a pointer's own trailing click is ignored |
| `touch-action: manipulation` on buttons let a rolling thumb pan or start pull-to-refresh; text selection and long-press callouts on Android | `overscroll-behavior: none` on html/body for handhelds; buttons `touch-action: none`; no user-select/callout while walking |
| Taps had to land exactly on a thing (small things on a 412 px screen are 20-40 px) | Aim assist: exact point first, else the nearest of 16 samples on rings of 14 and 28 px (a fingertip is ~35 px) finds the thing in reach; the click happens there. Measured hit rate round the puzzle cube: 100 % at 0/12/24 px, 88 % at 34 px, 63 % at 48 px |
| Look speed ~95 deg per screen width with up to 2.3x acceleration: slow, and the same drag turned by different amounts | 150 deg across the short side, acceleration capped at 1.5x for flicks (1x below 0.5 px/ms). Measured: a 200 px drag turns 70 deg slow, 82 deg quick |
| Stick output linear after the dead zone | Gentle curve (power 1.35): measured 0 / 0 / 21 / 43 / 87 / 138 cm/s at 10 / 20 / 35 / 50 / 75 / 100 % deflection, 205 cm/s (jog) past the rim |
| A second finger resting on the look side was ignored for the rest of its touch | It takes over the look when the first finger lifts (measured: 50 deg turn from the second finger) |
| The test harness lifted every finger at once (CDP `touchEnd` releases the points it lists) | `tests/mobile.mjs` lifts exactly one finger per `up()`; multi-touch checks now mean what they say |

Kept from round 2 (already in line with the research): floating stick restricted to the left/lower area, radial dead
zone (12 px slop + 14 %), auto-jog past the rim, contextual buttons with verbs, press-to-see-what-it-does labels with
release to act and drag-away to cancel, pointer events with capture and `pointercancel` handling, `touch-action: none`
on the room surface, 44 px+ targets, one-time coach card, haptics via `navigator.vibrate` where supported.

Not done (and why): orientation lock (needs fullscreen; the game already plays in both orientations); gyro look (not
1999, and a motion-permission prompt on iOS); `getCoalescedEvents` (look sums deltas, so merged samples lose nothing).
