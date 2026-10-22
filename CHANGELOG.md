# Jack's Home Page - changelog

## 2.32.1 - 2026-10-22
- Fixed cross-console HUD leakage: the room CRT's cached shader could retain a disposed Daydream HUD sampler after switching to Ultra 64/Goldenballs. Live uniforms now belong to the material and keep stable identities while their texture values update. Regression reproduced the stale binding, then passed repeated Daydream taxi → Ultra kart → Goldenballs switches with paused HUDs and native/LOCK IN captures. Added the taxi lighthouse's missing driveable forecourt instead of suppressing its "no road" warning.
- Removed the old CSS CRT speaker-grille pseudo-elements from LOCK IN. The two vertical grille slots looked exactly like a stray pause symbol over games; these are now hidden along with the other bezel decorations, without removing any game's own pause UI.
- Fixed a rapid grab/use/put-back rendering glitch found in the final TV screenshots: grabbing set mesh layers directly but did not update the cached front-layer flag until the next rendered frame. Releasing before that frame could leave a returned box drawn above the room/TV. Grabbing now uses the shared layer-state updater immediately, including contact-shadow visibility; all grabbable objects benefit.
- The isolated physical box-to-console regression now asserts the returned case is settled on the world layer before capturing TV playback, then tests Backspace, inserted/background refresh, eject and own-case return. Desktop/narrow screenshots inspected and the movable-prop regression rerun; no application console errors/warnings or module-load failures. Other browsers and physical hardware remain unverified; no manual live-data changes.

## 2.32.0 - 2026-10-22
- Kept the bedroom TV's dark twenty-slot rack and added separate, grabbable packaging for all nineteen bedroom console games as they are owned/found: solid cartridge boxes and jewel cases with recessed liners, edge walls, hinges, opening lids, original genre-themed cover illustrations, full back print and fitted spine titles. Boxes stand upright, supported by the shelves, with clearance between neighbours and inside the rack edges; starting games spread across the five shelves.
- Every playable disc/cartridge remains its original media object and save ID, now inside its own box initially. F picks up a box and opens it at its home slot (or away from slots); E/click returns the box. F places it when aiming at a different available slot. Loose media returns to its own case first; a console rejects the whole box. Shelf opening is limited to a small angle so lids do not sweep through neighbouring games; cases away from the rack can open wider.
- Free slots highlight under the crosshair, and a chosen slot becomes that box's new saved home. The assignment is stored in the existing roaming-profile key namespace; refresh and Put Everything Back/tidy retain the arrangement. Loose boxes/media can still be placed on ordinary surfaces with the grab API. Tidying returns media to their cases and stops a console whose medium was removed. Old factory rack positions migrate into boxes, while loose customised media and inserted games are retained; no entitlement IDs or server schema changed.
- Corrected snap aiming to ignore only the held object, not every movable object, so another movable case can be a real return target. At a box's own slot the hint distinguishes F to open from E/click to return. Inspection now advertises the same one-press Backspace return as screens.
- Verification: isolated authenticated tests exercise real F pickup/open/custom-slot placement, disc and cartridge removal/return, original-media identity, full-rack capacity and geometry bounds, rejecting whole-box console insertion, tidy, refresh, front/reverse inspection and desktop 1366x860/narrow 390x844 captures. Chair-placement and movable-prop/pillow regressions also pass after the snap change, with no application console errors/warnings or module-load failures. The physical box-to-console/background-refresh/eject loop is checked separately before deployment.
- Limits: this is the bedroom console rack, not a rewrite of the separate PC bookcase or the Super Ultra stored downstairs. Covers are original procedural print illustrations, not captured game screenshots; related titles share genre artwork. Full hardware/touch and other-browser verification, exhaustive collision testing with arbitrary furniture layouts, detailed paper manuals and a full-site parody/art audit remain outside this release. The chair and Backspace fixes were deployed first in 2.31.1/2.31.2 as requested. No manual live-data edits; normal deploy safety snapshots are retained.

## 2.31.2 - 2026-10-22
- Moved the new quick lean-back shortcut from Q to Backspace after the screenshot/control review exposed existing Q shoulder-button, weapon-swap and camera controls in console games. Those game controls remain unchanged. Backspace leaves PC/TV/handheld/focused views or inspection in one press; Esc still opens the menu, and editing text retains ordinary Backspace deletion. Updated all new hints and standing controls accordingly.
- Repeated isolated PC/console/family-TV quick-exit, continuing-game, LOCK IN and editable-field regressions; reviewed screenshots. The chair-placement fix from 2.31.1 is unchanged. TV-side shelf customisation and new console-game boxes remain the next separate task. No manual live-data edits; physical hardware/other browsers remain unverified.

## 2.31.1 - 2026-10-22
- Fixed furniture placement when looking down: a floor-only item aimed into the player's own footprint now settles just beyond their feet if the full destination is safe. Walls, doors, other furniture and the monitor approach remain protected; no unrestricted free-space search or clipping bypass. Placement and walking use the same rotated player-clearance calculation, including after turning a chair with R.
- Floor furniture lands fully upright instead of retaining the last fraction of the held-object sway. The chair/beanbag F hint correctly says "put down", not the inherited "Inspect" label. Rejection text explains aiming farther ahead; the Esc-menu return remains available.
- Q now leans back immediately from the PC, consoles, handhelds, focused furniture/screens and inspection; Esc remains the game menu. Text fields keep their Q key. This also exits LOCK IN without switching the PC off or restarting the background TV game. Updated the PC, console, focus-button and menu hints. Verified PC/console/family-TV quick returns, same console instance, LOCK IN exit and typing safety on isolated data.
- Verification: isolated-server regression covers F/E/click placement with level, floor, near-feet and steep downward aim, R rotation, floor contact, player clearance/walking collision, PC-approach rejection, menu return and refresh at 1366x860 and 390x844. Multi-angle screenshots inspected; existing movable-prop/pillow regression rerun. Physical hardware/other browsers remain unverified. This is the chair hotfix only; the newly requested customisable TV-side shelf and boxes for every console game are next, not included here. No manual live-data changes.

## 2.31.0 - 2026-10-22
- Rebuilt the desk chair as an ordinary late-1990s armless upholstered task chair: padded woven seat/back, separate rear shell, connected adjustable support, gas lift, under-seat mechanism/lever, five legs and ten caster wheels. Added original underside print and a separate ground-contact shadow. The chair, beanbag, schoolbag, revision books, mug, pencil pot and hi-fi can be moved. Furniture collision follows its saved position; unsafe floor drops are rejected, and grab raycasts ignore the held model correctly.
- F is the primary contextual interaction: pick up/use, insert into a highlighted slot, otherwise use or place a held object. E/click remain alternatives. Esc opens a period-styled game menu with Resume, contextual return/put-back actions, graphics and browser full-screen controls. Mouse ownership is automatic: walking requests lock; desktop, inspection and menus release it. The menu stops movement, not online programs or background TV playback.
- Added LOCK IN: press 0, or use the Esc-menu setting, to enlarge the active PC, console, Game Lad or family-TV screen without replacing its canvas or restarting its program. Native proportions are preserved (4:3 for PC/TV, 10:9 for Game Lad); press 0 again to return. Editable text fields retain their 0 key. The default is still the physical in-world screen. Removed the old side-on PC power-button camera stage: lean directly from first person and return to the saved entry pose. Shutdown retains the same house/props and its off state through refresh.
- Renamed the target-range game GOLDENBALLS without changing catalogue IDs/save keys. Updated selected house artwork, labels and dialogue to original parody names. VHS titles now fit their labels without truncation; chore tapes can be inserted with F, autoplay on AV, continue away from the lounge, survive refresh and be ejected/reused. Returning tapes regenerates each independent tower-slot pose. Galaxy Walk has an original animated bridge programme; these are short fictional programmes, not full films.
- Added one phase-aware procedural cube skybox and 18 solid, non-walkable backdrop houses with roofs, windows, doors, trees, pavements and gardens. Removed duplicate exterior grounds/sky cards, overlapping stair-hall walls and repeated door reveals. Intentional printed decals have a small depth bias with normal occlusion retained. The geometric audit's candidate face overlaps fell from 813 to 739; this includes hidden joins and is not a claim that every visible flicker is eliminated.
- Reworked the kitchen sink cutout/basin/rims, tap and washing-up alignment; separated appliances and clutter, reserved a real fridge bay and supported the microwave above it. Improved lounge cushion piping, garden bins/flower beds/fencing and solid shed roof; moved obstructions clear of doors. Thickened curtains and duvet; improved the mug, pencil pot, books and bedroom glass/lava-lamp placement. There is one physical pillow, initially on the floor, which snaps onto the mattress and stays there after refresh. Exact-old-default chore placements migrate locally without replacing custom placements or progress.
- Verified on isolated temporary data: authenticated chair/menu/PC, movable-prop collision and safe placement, pillow refresh, physical VHS insertion/away playback/refresh/ejection/reusable slots, Goldenballs and background continuation, same-scene shutdown/off refresh/power-on, LOCK IN same-instance toggles and text-field guard, and handheld native-aspect resizing. Inspected multi-angle desktop 1366x860 and narrow 390x844 screenshots plus PC display captures at 1920x1080 and 2560x1080. Final regressions report no application console errors/warnings or server module-load failures. GPU-driver ReadPixels/stall diagnostics are excluded by the shared browser fixture; software WebGL is not a physical-GPU benchmark.
- Remaining: the whole-site parody conversion (including fake-web/homepage/news/listings), exhaustive every-model/box-art/label/flicker review, dynamic cable physics, broader performance profiling, other browsers and physical keyboard/mouse/touch hardware are not finished or verified. Some models and short VHS programmes still need a dedicated detail/art pass. The requested minimal-starter test profile, account-only save reset and live test account were not implemented; live-account creation remains held pending explicit approval to write user data. No manual live-data edits or server schema changes; the normal deploy safety snapshot is retained.

## 2.30.0 - 2026-10-22
- Lighting now belongs to each room, not whichever room the player occupies. Visible rooms reuse one fixed-size GPU light rig in depth-preserving passes; opaque surfaces render before glass. Walking through a doorway no longer reallocates the bedroom's lights or changes its ambient brightness. Room transforms update once per composite; switches and time-of-day changes still ease smoothly. The PC desktop, front-layer held props and live background console remain in the same scene.
- Removed ambient-shadow strips across bedroom/downstairs door openings, corrected inward-facing wall strips and floor/ceiling fade directions, and clipped the under-stair fade to its sloping wall. The hall floor beneath the stairs now uses the hall's lighting; adjoining hall/landing carpet panels use matte per-pixel lighting even on Low to avoid large-quad brightness seams.
- Added solid, labelled ceiling switches on the landing and in the hall, lounge and kitchen. Their rocker angles follow actual state. Ceiling lights, the cupboard pull cord, lounge lamp and gas fire retain explicit on/off choices through refresh using the existing local/roaming profile mechanism. Fixed the bedroom switch rocker transform too.
- Rebuilt the lounge standard lamp with a thick fabric shade, rolled edges, bulb/socket and routed wall-plug cable. Replaced the open coffee-table bowl with a closed glazed model. The display cabinet now has real sides, back, shelves and supported ornaments behind solid framed sliding glass doors; panels have separate tracks and saved open/closed state. Expanded its walking collision to cover the front edge.
- Fixed a cold-entry save-order bug: the house could initialize before Apps/gamesave.js and cache an empty legacy fallback, subsequently replacing modern prop/openable records. It now reads existing versioned envelopes directly, chooses the newest modern/local/fallback save and preserves unbuilt-room records. Pending placements/openables flush on page hiding; drops save their committed landing height rather than a transient midair position. No server schema change or manual live-data edits; layouts already overwritten by an older build are not automatically recovered.
- Verification and limits: authenticated isolated-server regressions cover fixed-view doorway brightness, actual WASD crossing, immediate drop refresh, save-format precedence, physical switch use, rapid toggles, lamp/fire refresh, cabinet mid-slide refresh, inward shade geometry, PC/inspection/TV/glass rendering and desktop/narrow captures. An 18-minute soak passed 267 room/door/light cycles, periodic refreshes and forced WebGL context recovery, with no browser errors/warnings or accumulating light objects (peak 1,604 renderer geometries / 15 shader programs). Cross-browser profile restoration, wrong-password rejection and member logoff passed too. Screenshots inspected at 1366x860 and 390x844, including day/night, doorway, stair and lounge close/reverse views. Software-WebGL timings are not a physical-GPU benchmark or a universal performance improvement claim. Other browsers, real touch hardware, exhaustive whole-house collision/art review, dynamic cable physics and physically traced light spill/shadows remain unverified or outside this pass.
- High-quality day/dusk/night and off-bulb budget checks pass when run alone. A resource-contended concurrent SwiftShader attempt triggered the existing blank-frame watchdog warning; it was not reproduced in the standalone run and was not suppressed. Extreme CPU-contention behaviour still needs physical-hardware verification. The budget test now waits for the actual fade to settle instead of assuming 1.3 seconds is sufficient under software rendering.

## 2.29.2 - 2026-10-21
- Rebuilt the bedroom desk lamp with connected twin arms, hinge pins, anchored springs, a weighted base and rocker switch. Its head sits clear of the arms; the shade is a solid rolled-edge metal shell with a cream interior and recessed bulb/socket, not a double-sided open cylinder. Fixed details are batched; the shade uses two material groups.
- The warm light now originates at the modelled bulb, with a shorter desk-lamp range. Bulb and interior glow switch off properly. Clicking always toggles the lamp, including when it reveals a hidden item; saved on/off state survives refresh. Added a routed power cable and second plug on the shared wall plate, clearing the desktop edge, back panel, wall and skirting.
- Tested on isolated data: physical bulb/light alignment, sampled cable-radius clearances, repeated switching, actual E-key and mouse-click use, and off/on refresh. Inspected close, reverse, interior, day/night and 1366x860/390x844 screenshots and iterated on the model. No browser errors/warnings or module-load errors in the final regression. Limits: Chromium/software WebGL only; no other-browser/physical-phone verification or whole-house lighting overhaul. The previously identified room-boundary lighting and doorway shadow strip remain unfixed.

## 2.29.1 - 2026-10-21
- Rebuilt the bedroom beanbag as one closed fabric skin with a depressed seat, raised back, panel seams, matte woven fabric and refill zip. Removed the separate raised 'dent' lump and conspicuous horizontal texture bands. Collision bounds now cover the wider shape.
- Rebuilt the Ultra 64 and PlaySpace pads with solid contoured upper/lower shells, D-pads, shoulder buttons, raised face buttons, analogue controls, underside details and strain reliefs. Fixed controllers/cables are batched by material rather than adding a draw call for every small part. Existing interaction targets and console gameplay are unchanged.
- Controller leads now leave actual front sockets, clear the shelf lips, descend outside the cabinet and rest on the rug. Rounded-polyline routes avoid spline overshoot. AV leads use real rear cabinet openings; the TV back clears the wall. The power lead passes above/around the cabinet and skirting to a modelled wall socket rather than ending inside furniture. No dynamic cable-physics claim: these are fixed bedroom cable routes, not a whole-house cable audit.
- Verification: repeated isolated-server multi-angle desktop 1366x860 and narrow 390x844 screenshots, geometry validity and authenticated refresh regression. Added sampled cable-radius clearance checks against the cabinet shelves, sides, back braces, floor, wall and skirting, plus walking collision at the beanbag and retained interaction targets. Screenshots reviewed and iterated; no browser errors/warnings or server module-load errors. Physical hardware/other browsers and a full gameplay regression are not verified. Previously reported doorway shadow-strip and room-boundary lighting changes remain separate, unfixed issues.

## 2.29.0 - 2026-10-21
- JackNet accounts are now required before gameplay. A period-styled Log On/Create Account dialog replaces guest entry; Escape, Cancel and room controls cannot bypass it. Anonymous sockets cannot perform gameplay requests. Existing accounts, roaming profiles and progress are retained; profiles load before the gate opens, including in a second browser. Member logoff returns to mandatory sign-in.
- Added an additive, server-held pocket-cash wallet in integer pence. New wallets start at £0 without converting or removing existing Rupees or inventory. Jobs and chores now pay cash; Saturday pocket money is £5 once per Saturday. Existing server earn caps and legacy job/XP bookkeeping remain intact.
- JackNet Bank's statement now includes Pocket Money Exchange, cash history and receipts: £1 buys 20 Rupees, in 5p increments, up to £20 per day. This is fictional game money, one-way only, with no real-money payments. Server validation, persisted rotating exchange slips and replay receipts prevent duplicate charges; insufficient cash, invalid amounts and full Rupee accounts do not consume cash.
- Verified with isolated temporary data: wallet preservation, wage and Saturday caps, invalid amounts, overdrafts, duplicate/reloaded slips, daily rollover, full-account safety, anonymous socket blocking, explicit signup, token resume, wrong passwords, cross-browser saved-profile restoration, member logoff, real timed job wages, bank double-click exchange and refresh. Inspected desktop 1366x860 and narrow 390x844 account/bank screenshots; new browser regressions report no errors/warnings and the test server has no module-load errors.
- Limits: Chromium/software WebGL only; physical phone hardware, other browsers and a full-house art/control re-audit were not verified in this account/economy release. Historical tests relying on Guest buttons need authenticated setup. No manual live-data edits or migration; the normal owner-approved deploy backup is retained.

## 2.28.1 - 2026-10-21
- Removed the legacy PC-only power-button landing view from cold entry. Fresh visits now start standing at a walkable bedroom overview; saved positions and powered-on desktop resumes are unchanged. The PC remains an in-world object which can be switched on manually.
- The old CSS tower is hidden behind a short, period-styled room-preparation message until the actual house is rendered and revealed. If the renderer is unavailable, a clear WebGL/reload message replaces the obsolete entry screen instead of leaving the player stranded there.
- Verified on isolated temporary data: delayed-engine loading without an intro flash, fresh entry and saved-position refresh at 1366x860 and touch-enabled 390x844, manual PC power-on/logon, and a simulated renderer-unavailable branch. Screenshots inspected; no browser errors/warnings in the normal-entry regressions or server module-load errors. Actual unsupported phone hardware was not available to reproduce the owner's device failure. Mandatory accounts and the proposed pounds-to-Rupees bank remain unchanged, pending approval of their separate persistent wallet change.

## 2.28.0 - 2026-10-21
- PC Restart now reuses the room and boot sequence instead of reloading the browser. Physical props and the background console runtime remain alive. Repeated restart requests are guarded; desktop game saves flush and PC windows close before the next boot. Shut Down retains its existing in-room power cycle.
- Guest Log Off now returns to the logon screen inside the same 3D monitor without rebuilding the house. Repeated logoff works; entering the monitor clears the standing HUD/input flag, including after resize. Member logoff and incoming roaming-profile changes deliberately retain their existing reload: safely replacing profile-owned in-memory state needs a separate account-handover change.
- Reusable crash recovery clears old crash handlers/flags, hides stale DOS/standby/crash screens, and retains the unclean-shutdown flag so ScanDisk still runs. Old desktop resume records are discarded without discarding the room.
- The room watchdog no longer mistakes intentional BIOS/shutdown screens for broken overdraw, avoiding false repair warnings and unnecessary diagnostics.
- Added localhost-only restart/logoff and repeated-crash/console-continuation regressions; updated the power regression to wait for DOM readiness rather than all delayed page resources. Remaining: account-switch scene preservation, DOS-specific end-to-end coverage, other browsers and physical-GPU benchmarking are not claimed by this batch.
- Verified on isolated temporary data: menu-driven and duplicate restarts, repeated guest logoff, member-path safety guard, resize and desktop pointer ownership, stand/sit after logoff, refresh during BIOS, two simulated crashes with ScanDisk and the same advancing console instance, plus cold power-on/shutdown/repower. Inspected 1366x860 and 390x844 screenshots; new regressions report no browser errors/warnings and the server has no module-load errors. A resource-heavy parallel attempt was rerun sequentially; the final runs pass.

## 2.27.0 - 2026-10-21
- Walking saves now retain location and door states throughout the house and outdoors. Destination rooms load before collision validation; expired bedroom-only resume restrictions are removed. New visits still start with closed doors, while a resumed visit restores its saved doors. Invalid positions fall back safely.
- Page hiding saves the grounded player position immediately; jump/head-bob offsets are not baked into saves. Space jumps while carrying instead of dropping the item; Click/E places it, I inspects, and Esc backs out of inspection before returning the item. Updated carry hints.
- Partial scene saves retain props and openable records from rooms not yet built. Props left in lazily registered rooms restore when those rooms become available instead of resetting to their bedroom homes. New grabs/tidying supersede deferred placements. Concurrent house loading now awaits the full door-registration promise.
- The first-bedroom tutorial no longer appears over the garden after an outdoor, powered-off resume.
- Added isolated refresh/control regressions and deferred-prop, partial-save, aged-position and malformed-camera tests, with desktop/narrow screenshots. Limits: this is the first persistence/control slice, not the full proposed roadmap. Restart/logoff/crash page lifecycle, remappable bindings, shelf overflow/swapping, broad art work, native packaging and physical-GPU performance measurement remain unchanged. The existing 48-hour PC power policy remains unchanged; browser refresh still restores powered-on/off walking appropriately. Standard deployment safety backup approved by the owner; no schema migration or manual live-user data edits.
- Verification: refresh at collision-valid positions in all eight spaces, open-door restoration, powered-off outdoor resume, jumping while carrying, inspection/Esc ordering, deferred item restoration and partial-save retention passed on an isolated server. Existing PC shutdown/repower and input-transition regressions passed. Desktop and 390x844 captures inspected; no browser errors/warnings in the new regressions or module-load errors in the test server. Not an exhaustive walked collision audit: cramped cupboard camera clearance still needs a separate pass.

## 2.26.0 - 2026-10-21
- Personal PC media arrangements: carry a box, case or magazine, aim at an unassigned shelf gap and release into the highlighted position. It slides upright into its new reserved home; the old slot is freed. Mixed item widths, gaps and shelf edges are checked so models cannot overlap or overhang. Existing marked homes remain reserved for items left out; loose discs still return to their own cases first.
- Tidying now respects the player's chosen arrangement. New purchases reuse available gaps without repacking the existing collection; invalid/overlapping saved slot entries are repaired. The console rack is unchanged.
- Reuses the existing player profile/JackOS logon and roaming save format: guests keep browser-local arrangements; a member's collection, layout and room save follow their account. No server schema changes, data migration or manual live-user data edits. This is browser-game groundwork for an eventual desktop release, not a Windows executable or offline-account redesign.
- Snap targets are copied before animation, shelf reservations commit before the slide and immediately save, and re-grabbing cancels the old slide. Refresh during placement, Esc cancellation and rapid placements preserve a coherent arrangement.
- Verified on isolated temporary data: physical placement, mixed media, Esc, re-grab and rapid-drop races, mid-slide refresh, tidy, unchanged console homes, two separate test accounts and a profile restored in another browser. Desktop/narrow screenshots inspected; existing bookcase and PC input-transition regressions pass. Limits: Chromium software WebGL; finite shelf capacity and the existing roaming-profile storage/network limits remain. Other browsers, a native Windows package and offline/cloud conflict redesign were not verified or implemented.

## 2.25.1 - 2026-10-21
- Follow-up car angle review: corrected reversed cabin triangle winding caused by baking a mirrored Y scale into static geometry. Near-side glazing is now solid from outside, rather than disappearing and exposing the parcel-shelf prop. No layout, mud IDs or chore-state changes.
- Verified with the isolated car-angle/scrubbing regression and inspected screenshots. Same hardware/browser and broader art-pass limits as 2.25.0.

## 2.25.0 - 2026-10-21
- Real-prop inspection: I while carrying brings the same solid object into view; drag to rotate, wheel to zoom, Esc returns to carrying. F on the puzzle cube now turns its actual 26-cubie model by dragging a face; right-drag rotates it. Six complete faces, thin inset stickers, animated quarter turns, persistent puzzle state and the existing solved secret replace the unrelated flat close-up.
- Game Lad lifts into a stable, centred play pose rather than chasing its dropped position. Its rear cartridge follows the full handheld rotation, including inspection, with the label hidden from the front. Corrected coplanar battery-cover flicker, screw placement and interrupted lift/return handling. Esc leaves its running game intact.
- PC shutdown no longer reloads the house: room objects, placements and background console sessions remain alive. Reusable power-on resets the boot state; fixed the stale standing flag that blocked clicks on the second logon screen. Desktop pointer ownership remains separate from walking.
- Shelf artwork rasterizes immediately, including backs and edges, behind a bounded room-preparation screen; textures upload before walking starts. Printed fallbacks replace grey placeholders, and game-box price stickers correctly say Rupees instead of treating game prices as pounds. Held/inspected objects no longer carry flat contact-shadow cards, and shadow planes no longer inflate object collision bounds. The right-hand console rack layout is unchanged.
- Lighting source selection is fixed per room, not player proximity, removing approach-dependent relighting and unnecessary movement-time reselection. Unified room prompts, buttons, chore counters and inspection controls use restrained square late-1990s game styling. Physical-console control hints render above the projected PC desktop, so its glass cannot cover their text or swallow clicks. Walking gestures request mouse lock with throttled failure handling; inspection and JackOS deliberately release it.
- Dad's car: opaque glass, joined sloping pillars, door trim/handles and clearer wheel hubs. Mud, roof dirt, boot writing, scrub targets and rinse effects now share the actual car's position/scale instead of floating at its old coordinates; chore IDs and earn paths are unchanged.
- Verification: isolated Chromium tests and inspected screenshots for physical cube dragging/rotation/refresh, handheld front/rear/play/Esc, repeated PC shutdown/power-on with scene identity checks, shelf slots/returns and sampled views of all eight house spaces. Additional desktop sizing/input and day/dusk/night checks are recorded in the test scripts.
- Limits/remaining: software WebGL only; no physical-GPU performance benchmark or exhaustive audit of every wall angle, model, artwork asset, browser or game campaign. Existing Super Ultra overlay and games without mid-session saves remain as previously documented. Restart/logoff/crash still use their existing page lifecycle; this release preserves the scene for Shut Down. Desktop prioritised as requested; the new inspector is not a separately polished phone interface. Broader foliage, furniture and artwork refinement remains an ongoing art pass, not a claim that every asset was rebuilt.

## 2.24.0 - 2026-10-21
- Esc now leaves physical console games running on their screens. Returning keeps the same game instance, timer and progress; room controls cannot leak into the game. Ejecting or switching consoles really stops it and releases screen textures. Background console selection/power restores without forcing the player back into a close-up.
- Background game drawing/uploads are capped at 30 Hz when the screen is visible and 10 Hz otherwise, while simulation keeps its fixed update step. Sound is quieter when leaned out and silent outside the bedroom; hidden tabs suspend the loop. Removed a permanent case-target animation that unnecessarily forced room redraws.
- Whole-house lighting pass: more readable cool daylight, warm indoor bounce and subdued night fill across bedroom, landing, hall, cupboard, lounge, kitchen, garden and drive. Off lights no longer consume the fixed GPU light budget; selection follows actual influence and walking position, preserving stable slots and smooth fades. PC glow follows actual power, not simply standing up.
- Outdoor sky, distant rooftops and street-lamp glow now follow day/night changes without a refresh; corrected the garden's dusk ambient branch. Reduced kitchen window glare and localized bedroom lamp/screen glow.
- Verification: isolated Chromium screenshots across all eight spaces at day/dusk/night, ceiling-switch and off-light-budget checks; TV continuation/re-entry/background-refresh tests. Limits: software WebGL, not a physical-GPU FPS benchmark or exhaustive corner/browser audit. One active console runtime; refresh uses each game's existing saves (games without mid-session saves return to their title), whereas Esc preserves the exact running session.

## 2.23.1 - 2026-10-21
- PC media bookcase now has four evenly spaced bays and reserved, edged slots: upright big boxes, jewel cases and solid printed-spine magazines, with shelf-edge clearance. Existing crowded shelf poses migrate once; objects left elsewhere stay where they were.
- Boxes/cases/mags highlight their own return slot and slide upright into it. Loose discs highlight their own case, including cases moved away from the shelf. Slot assignments and placements persist across refreshes.
- Added a physical-shelf "Put everything back" action; tidying closes cases, returns discs and clears stale placement animations. The right-hand console rack and its models are unchanged.
- Verified on isolated data: 26-item collection, box/case/mag returns, disc return, tidy, refresh persistence and inspected front/oblique desktop screenshots. Chromium software WebGL only; not every possible collection, browser or physical GPU was tested.

## 2.23.0 - 2026-10-21
- JackOS stays inside the physical 4:3 CRT, with recessed curved glass, a dark lip, sheen and scanlines. Room HUD hides while seated; desktop windows, menus, tooltips and balloons use monitor coordinates and stay inside its glass.
- Stand/sit and PC power transitions keep the room visible. Corrected wake-container visibility, viewport-dependent window geometry, desktop mouse capture, shutdown/Esc races and foreground-canvas ownership.
- Console games use a live screen texture in the room; physical shelf media use the grab system and aligned shelf placement. Cartridge/disc modelling and console insertion details have been refined.
- Quality-bar standing rules recorded in AGENTS.md. Browser regression scripts cover monitor sizing, UI interaction, refresh and power cycles on isolated test data.
- Corrected desktop readiness checks for the persistent room, projected secret-item hit testing, and the no-WebGL standing-refresh fallback. Game Lad now uses its physical LCD too.
- Remaining: the away Super Ultra retains its legacy overlay; games without mid-session saves restart at their title. Physical disc/Game Lad insertion and every individual game were not exhaustively verified.
- Verification limits: automated Chromium uses software WebGL. Physical GPU hardware, Safari/iOS and every individual console-game campaign have not been exhaustively tested.

## 2.22.0 - 2026-10-21
- (Owner only) a layout editor: logged in as Jack, F9 in the room flies freely, selects and moves models, keeps the edits locally and exports them as layout-edits.json to be written into the code.

## 2.21.4 - 2026-10-21
- The PC's desktop gets the mouse back after switching on from the room (the room's mouse lock never let go); room mouse capture only happens in the room.

## 2.21.3 - 2026-10-21
- Crouch is C only (Ctrl + W while crouching closed the browser tab).

## 2.21.2 - 2026-10-21
- Walking again after letting go of the mouse re-locks it reliably (keeps retrying while you move).

## 2.21.1 - 2026-10-21
- The tab-title lock is a script file now (the site's security policy blocked it inline).

## 2.21.0 - 2026-10-21
- The stairwell rebuilt properly: one even flight that stops at the wall, aligned string/handrail/spindles, a closed-in cupboard
  under the slope, the fuse box on the hall wall.
- Front and back doors open onto real doorways and you can walk out to the drive and the garden; a proper 1999 front door
  (handle, letterbox, glass). Doorway gaps closed, duplicate frames and overlapping floors removed.

## 2.20.1 - 2026-10-21
- The browser tab always says "Jack Attack 1999" (pages no longer change it).

## 2.20.0 - 2026-10-21
- You're a kid now: eye height about 128 cm (was an adult's 160), sat and crouched heights to match.
- Rooms load fully before they're shown (no pop-in), and lights fade between rooms instead of jumping.
- On the stairs you no longer see a flash of the cupboard underneath; the landing window sits flush; the cupboard door fits under the stairs.

## 2.19.3 - 2026-10-21
- Doors can be opened again (the bedroom door was unclickable, trapping you in). Shift now jogs (1.5x).
- Wardrobe doors open outwards and its top sits flush; the chest of drawers has a proper carcass; the beanbag isn't wedged into the furniture.

## 2.19.2 - 2026-10-21
- The real cause of the black room: after a refresh, the boot screen's tidy-up removed the layer that holds the 3D room. It no longer does while you're standing, and the watchdog can put the layer back.

## 2.19.1 - 2026-10-21
- A watchdog keeps the room drawn while you walk round (repairs a hidden canvas, a lost 3D surface or an empty frame) and reports what it fixed (POST /diag -> data/diag.log).

## 2.19.0 - 2026-10-21
- JackOS is JackOS everywhere: no "Windows" left in the PC (C:\JACKOS, C:\JACKOS\SYSTEM32, JACKOS.INI, JackOS Setup/Update/
  Explorer...); old C:\WINDOWS paths still open. Consoles' own screens use their names (Game Lad, Ultra 64).
- Easter egg: drag My Computer onto the Recycle Bin. (Desktop icons can be dragged now.)

## 2.18.4 - 2026-10-21
- F5 anywhere in the house no longer goes black (if the spot can't be restored you're back at the desk).
- Doors start shut and are solid from both sides (no black doorways); door signs on the landing side.
- The landing floor ends at the stairwell, with a full-length balustrade; the landing window sits flush.
- Consoles use their own names in the room: Ultra 64, PlaySpace, Game Lad, Segue, Daydream, Super Ultra.

## 2.18.3 - 2026-10-21
- Jack's little sister is Crystal for everyone (the rest of the cast is still picked per visitor).

## 2.18.2 - 2026-10-21
- Walking captures the mouse on any click in the room or any movement key, not just a clean click.

## 2.18.1 - 2026-10-21
- The live desktop stays inside the monitor's screen when you stand up (it follows the 3D monitor, not an old layout).

## 2.18.0 - 2026-10-21
- Jump (Space) and crouch (C/Ctrl); JUMP and DUCK buttons on touch screens.
- The stairs are rebuilt the right way round and you can walk up and down them.
- Dad's car is out on the drive instead of through the hall wall; the sofa and armchair face the telly.
- Less flicker (camera near plane), a floor gap under the stairs closed, and a refresh while standing can't stay black.

## 2.17.2 - 2026-10-21
- Standing up after a refresh (wake) no longer shows a black room, and the mouse locks there too: the wake rule hid the room.

## 2.17.1 - 2026-10-21
- The room no longer goes black after standing up (it rebuilds itself if the browser dropped its 3D surface).
- Click into the room to lock the mouse like a first-person game (crosshair; Esc lets go).
- Refreshing while standing keeps you standing in the same spot, facing the same way, with no desktop flash.

## 2.17.0 - 2026-10-21
- Walk round the house freely: WASD/arrow keys (Shift to walk slowly), drag to look, E or click to use; on-screen joystick on
  phones. The old fixed views and < > arrows are gone. The bedroom doorway is clear (the school bag moved).
- The switched-off PC, monitor, keyboard and mouse are solid 3D models in the room (no more see-through shell from the side).
- Stand up from the PC without switching it off: Start > Stand up, hold Esc, or F2. Back after 10+ hours with the PC left on,
  you start standing in the room.
- Graphics: Low/Medium/High chosen automatically (with a step down if it gets slow); G key or the Start menu to change.
- The Full screen checkbox is gone. Warmer bedroom lighting, an outdoor sky, cupboard light, a better mobile, the cordless
  phone upright.

## 2.16.1 - 2026-10-21
- Jack's chair is rolled back from the desk, so it no longer shows through the keyboard in the PC view.

## 2.16.0 - 2026-10-21
The house release (work in progress, shipped as it stands).
- Jack's house: walk round in 3D (WASD/arrows, drag to look), pick things up and put them down (Garry's-Mod style), open
  drawers, cases and the PC's CD tray; downstairs with the living room (telly with Telly-Text, VHS, landline), kitchen,
  cupboard under the stairs (the Super Nintendo) and the garden/drive. Stand up from a running PC and sit back down.
- Real media: the Games Cupboard is now a bookcase of boxed games, jewel cases, mags with cover CDs and a floppy box in
  the room; put a disc in the PC's tray and drive D: has it. Pixel Post mail-order catalogue (Rupees, instant delivery).
- Consoles: 10 new cartridges (SNES Formula Null, Zeldo, Super Plumbo World, Street Scrapper II; N64 Wobble Party 64;
  PlayStation Metal Gerbil Solid; Game Boy Grabbo Land and Pocket Critters Puddle Version; Mega Drive Teeny Motors;
  Dreamcast Toy Squadron) and the Pocket Critters link cable (server-refereed trades and battles).
- Existing room games: big polish passes (taxi arrow and city, Zip art, fighters, racers, platformers) - partly done.
- Chores move into the house as real 3D activities for Rupees - partly done.

## 2.15.0 - 2026-10-20
Rolling release 1 of round 2: JackMUD, JackWorld, and everyone gets their own cast.
- JACKMUD (www.jackmud.jnet): a live multiplayer text adventure on the server: 137 rooms in 13 areas (the Academy newbie
  school, Baudby town, Floppy Fields, the Sewers, the Caves of Lag, Mount Megabyte, Orbital Station 99, the Moon...), 42
  people to talk to, 45 monsters with 5 bosses (the Millennium Bug last), 20 quests, 4 classes, 20 levels, parties, shops, a
  bank and the Rupee Exchange. Reach it by Telnet (now a real Telnet program), `TELNET MUD.JACKNET.JNET 4000` in MS-DOS, the
  web site's "Java applet", or the MUDdy 98 client download. Fainting, not dying. 37 secrets. (js/md-*.js, mods/md*.js)
- JACKWORLD 99 (www.jackworld.jnet, a download): a shared isometric avatar chat world with ten public rooms (Lobby, Jacktown
  Square, Pixel Arcade, Rooftop Disco, the Park, the Beach, Space Station JW-1, Snowy Peak, the Revision Library and a hidden
  Moon Base), avatars with the JackNet faces and loot hats, speech bubbles and emotes, NPC regulars (Dave, Luke, Callum, JackK
  and JackWorld's own crowd), after-school and Friday-night-disco busy times. Members own a room: five sizes, 186 furni on 13
  catalogue pages (interactive tellies, jukebox, trampoline, vendors...), 53 weekly limited rares, locks and doorbells,
  guestbooks, likes and Room of the Week. Quiz Booth, Musical Chairs and Snowball Fight pay capped Rupees. Word filter,
  reports and moderator tools. 24 secrets. (js/jw-*.js, mods/jw.js)
- YOUR OWN CAST: apart from Jack, Dave, Luke, Callum, JackK, Mom, Dad, Gran, Grandad, Nan and Gubbinz, everyone in Jack's
  1999 is picked per visitor with a gender and the right pronouns: his little sister, his cousin, auntie and uncle, the
  teachers, the shopkeeper, the cat, the hamsters and all the other kids. Comics and portraits are drawn to match; homepage
  addresses follow the names (old ones still work). Members keep their cast on any PC. (js/cast.js)
- No Skip on the switch-on: the boot always plays in full (a wake after a refresh still resumes).
- Town Hall's "upgrade" secret can be earned now.

## 2.14.0 - 2026-10-20
The big expansion: Jack's bedroom, a card craze, real auctions, back issues and the Great JackNet Hunt.
- JACK'S BEDROOM: the dark room around the family PC is now Jack's 1999 bedroom with three views (the PC, the telly
  corner, the window and bed). Five playable consoles with their own start-up screens and 13 original games: Ultra
  Sixty-Four (Kart Kaos 64, Secret Agent 64: Target Range, Bounce Quest 64), PlaySpace (Warp Wombat, Tekno Fist, Anti-Grav
  3000), Game Lad (Blockology, Pocket Critters: Moss Version), Segue! (Zip the Hedgehog, Pavements of Peril) and, from
  14/10, the Daydream (Mad Minicab, Zip Adventure, Soul Sabre). Blow on the cartridge. Posters, cork board, drawer of letters
  and floppies, a twistable puzzle cube, Eggbert the keyring pet, lava lamp, real sky out of the window, Mr Tibbs the cat, a
  CD rack, 8 lost games to find, Mom's lost change; server-checked scores and capped Rupees. (js/rm-*.js, mods/rm.js)
- ECONOMY: JackCards Series Two "Byte Beasties" (38 original creatures, holo shine, limited legendaries) with booster
  packs at www.cardkorner.kidz, the JackCards Binder 99 download and Card Clash (vs Dave, Callum, JackK or a friend online,
  refereed by the server); JackBay Rupee auctions (server-held items and bids, proxy bidding, anti-sniping, fees); Jacktown
  Town Hall takings and licences; four new Odd Jobz mini-jobs with streaks and a Job of the Day; The Mega Masters weekly
  cup. (js/ex-*.js, mods/ex.js)
- JACK ATTACK! BACK ISSUES: twelve monthly issues (Jan-Dec 1999) that go on sale on the 1st, with reviews of 66 real 1999
  games that appear on their UK release dates, previews, letters, cheats, a pull-out poster and a server-judged competition
  (Super Reader badge for all twelve). Plus 17 new "Class of '99" sites tied to real 1999 events on their dates, on a
  webring. (js/cx-*.js, mods/cx.js)
- THE GREAT JACKNET HUNT (www.greathunt.jnet): ten chapters of clues across the web, the PC, DOS, the Registry, the
  calendar, the bedroom, the magazine and the Phone Dialer, ten Golden Bytes, a hint line, a Hunter's Kit download, and
  server-verified rewards up to the numbered Millennium Disk (999 ever). A new Secrets Found window with categories,
  medals, ranks and hint bulbs, and 70 new secrets. (js/sx-*.js, mods/sx.js)
- JAQUAKE: much easier baddies (hit rate 53% -> 26%, slower to react, visible projectiles, infighting), faster guns
  (Boomstick 0.6 -> 0.4 s, quick weapon switch), eight guns, dynamic lighting, new textures, Quake-style status bar, menus,
  console and intermission.
- JACKREAL TOURNAMENT: gentler bots (accuracy ~0.9 -> 0.1-0.3 at the default skill, slower reactions, no instant 180s), faster
  guns plus right-click alt fire on every weapon, a UT-style HUD, rebuilt weapons, new textures and lighting, kid-friendly
  announcer, Tournament Ladder and drop-down console. The online referee's fire-rate table matches.

## 2.13.4 - 2026-10-20
- The PC's power button works and shows the hand pointer all over, including on the power symbol itself (it showed a plain
  arrow there, so it looked as if only the edge of the button could be clicked).

## 2.13.3 - 2026-10-19
- Turning a phone sideways and back upright no longer leaves the JackNet Explorer window stuck at its landscape size (where
  it couldn't be moved or resized): it goes back to filling the screen. Program windows fit back on the screen after every
  rotation too (they hung off the bottom in landscape) and get their own size back afterwards.
- Jack's mate is just Jack, JackNet name JackK: no more "Other Jack" anywhere (comics, news, files, phone, discs, bots).

## 2.13.2 - 2026-10-19
A bare PC really is bare.
- The system tray only shows what this PC actually has: sound, people online, Rupees, the dial-up connection, new mail and
  the clock. The Jackotchi egg only appears once Jackotchi Virtual Pet is downloaded (no more hungry-pet nags, scheduled
  "Feed Gubbinz" runs or download prompts for a pet you never got), its "needs feeding" icon only shows while it really
  does, Task Scheduler turns up once Scheduled Tasks has been opened, and the Treasure Chest is for members.
- Admin: POST /admin/reset-installs?name=X puts a member's PC back to bare software (programs, toolbars, discs, open
  windows) while keeping their progress (secrets, saved games, files, settings, mail). Old profile kept as a .bak file.

## 2.13.1 - 2026-10-19
- Switching on: the fly-in to the monitor stays sharp. The last stretch of the zoom hands over to the real BIOS screen
  (scaled to the glass, see-through so the glow and scanlines stay) instead of stretching the monitor's small copy.

## 2.13.0 - 2026-10-19
Rupees, all of gaming, saved games, and a lot more to do.
- RUPEES replace Teef as the money of JackNet: colourful gem tiers drawn from scratch (Green 1, Blue 5, Red 20, Purple 50,
  Gold 100, Rainbow 500) in the tray, bank, shops, loot and games. Old balances carry over 1:1.
- The grind: Rupee Hunt (gems hidden across the fake web), daily chores, a JackNet rank ladder with rank-up rewards, and a
  Hall of Fame. loot.giveOnce so rank rewards never double up.
- The site is about ALL of 1999 gaming now: Orks and Warhammer are a light touch among PC, console, handheld, arcade and
  tabletop stuff. Real games, films and telly named plainly; parody names varied (not everything "Jack-something").
- Art pass across icons, sites, programs and games. No visible phone wording ("tap", "swipe"): 1999 PC words throughout,
  still fully usable on a phone.
- Saved games: Solitaire, FreeCell, Hearts, Spider, the DOS games and editors, office programs and more keep their exact
  state (every card) and carry on after a refresh or the PC waking up.
- Leap day: on a real 29 February the site glitches, because 29/02/1999 never existed.
- Share and social: e-cards, shareable homepages (/~name, with their own link previews), brag badges, chain letters,
  floppy swaps and homepage contests.
- Events and mysteries: the NO CARRIER puzzle trail (starts in View > Source), a time capsule, weekly events on 1999
  weekdays, synced JackNet Radio and a shared family pet.
- JAQUAKE and JACKREAL: always-on public servers (join in one click), JackSpy 3D, Frag Zone, online deathmatch and co-op,
  new maps.
- Games Cupboard polish: RollerJack Tycoon, JackCity 3000, Age of Jackpires II, Championship Boss, Dungeon Keepa 2 and
  Jacks: Armageddon get tutorials or advisors, clearer screens and goals, more depth, better art and sound, resume after a
  reload, plus JackNet sharing/online play where it fits.
- Polish crawl (part): Cube Timer hints, wording and layout fixes; "Unregistered" nags never interrupt a game.
- Bought pointers show everywhere inside the PC (title bars, menus, taskbar). The FunCursor toolbar's sparkle trail stays
  off serious sites (bank, exchanges, mail, search, news, JackShield).
- Fixes: Outlook links bring the browser forward, View Source secret, Millennium Vault link, What's On link on the home
  page, the locked-folder riddle.

## 2.12.3 - 2026-10-19
- Custom mouse pointers only show inside the pretend PC: the room with the PC and monitor always has the normal pointer.

## 2.12.2 - 2026-10-19
The database is sacred.
- The server never starts "fresh" over an unreadable state.json any more: it restores the newest good backup, or refuses to
  start so nothing gets overwritten. Rolling backups in data/backups: one at every start-up, hourly (72 kept), and a full daily
  copy of the data folder incl. roaming profiles and homepages (60 kept). deploy.sh snapshots data before every deploy.
- Admin: POST /admin/reset-pc?name=X gives a member a brand-new PC (the old roaming profile is kept as a .bak file); open
  windows reload into it, and stale uploads from before the reset are refused.
- Free toolbars creep in less often (first after ~4 min, then every 10-14 min).

## 2.12.1 - 2026-10-19
Easier to find and nicer to share.
- New title and description, link preview card (og/twitter tags + a 1200x630 picture of the family PC glowing in the dark with the
  site on its screen), JSON-LD, canonical URL, a new CRT-monitor "J!" favicon, home-screen icon + web manifest, robots.txt and
  sitemap.xml, and a 1999-style page for visitors without JavaScript. The server knows .jpg/.xml/.webmanifest now.

## 2.12.0 - 2026-10-19
More ways to play together, and a polish pass over everything.
- Online multiplayer, part 2: Jacks: Armageddon online (2-4 players + spectators; the host referees, each go replays exactly on
  every screen; drop countdown, skipped goes after 20 s, late joiners watch, rematch; also fixes a go that could never end when a
  jack was wedged under an overhang), Snake Link-up on Jack's Mobile (first to 3, LINK LOST pause + 3-2-1), Millionaire Fastest
  Finger First (2-4 players, hot seat with lifelines, armchair scores for everyone else). Arcade "now playing" pings go through
  the Zone relay, throttled. Five new secrets.
- Custom mouse pointers (CursorMania!, bought or looted pointers) now show everywhere: title bars, menus, taskbar, Start menu.
- Polish crawl over 156 programs, 990 fake-site pages, 209 hidden pages, 23 sections at desktop and phone sizes: Zone Chess
  crash fixed, phone scroll and taskbar clock fixes, clipped windows and buttons, leftover old names (SQUIG@home, GrotToons,
  grotmail), "Windows" -> "JackOS" labels, no PlayStation 2 before its 13/09/99 announcement, Mom not mum.
- JackLoot: "1 things" plurals, Treasure Chest redraws after a drop.

## 2.11.0 - 2026-10-16
Loot, a fresh PC, and playing together.
- JackLoot (mods/loot.js, js/loot*.js): Teef for nearly everything through one server earn path with daily caps (log-on
  streak that never goes down, scores, posts, letters, chat, secrets, cube, WAAAGH, Gubbinz, JRT frags, Quiz Night, homepage
  visits, new sites/programs, play time, Daily Missions); 176 collectable items in 13 types with six rarities (Common ->
  Jackpot) that shine more the rarer they are, limited serial numbers, seasonal 1999 drops, a free Daily Parcel, no mystery
  boxes. Treasure Chest program (equip, recycle, the Combinator, sets, achievements), Trading Post (escrowed two-way trades), Pay
  a Friend, the Bazaar player market (5% fee), JackNet Bank statements, and www.lootlings.jnet (shops, item database, Museum,
  Top Collectors; PUBLIC BETA until the 15/11 Grand Opening). Gear shows on chat names, avatars, profiles, homepages, your PC.
- Fresh PC (js/setup*.js): new visitors start with a 1998-style JackOS install; everything else comes from the new JackNet
  Software Centre (starter packs: The Gamer, The Chatterbox, The Music Fan, The Nerd, The Show-Off, Dave's Pack), the
  Shareware Shack, the programs' own sites ("GET IT HERE" bars) and CDs. Returning visitors keep everything; members' installed
  programs roam with them ("My PC: N programs" on profiles).
- Play together (js/mp.js, mods/mp.js): "Play with someone..." in game menus, a "Who wants to play?" lobby, invites from
  Uh-Oh!/JSN contacts, Zone chess, 4-player Hearts with bots, same-board races (Squigsweeper, FreeCell, Spider, Jack Jong,
  Slider), score races (Pipe Jack, Pinball), live Pod Jack Racer ghosts, a Multiplayer page with live counts. Dropped
  connections are survived everywhere (JACKTRIS, Zone, JRT, JSN, Hangout, IRC, Whiteboard, WinPopup, texts...).

## 2.10.1 - 2026-10-16
- Comics rewritten for laughs: every strip has a setup, escalation and punchline; running gags (Mom on the phone line, Dad vs
  the computer, Callum's PC bragging, Luke and Dave's Nintendo devotion, Other Jack); new cast Luke, Other Jack and Callum; 10
  new strips on real 1999 dates (the Euro, Pancake Day, Mothering Sunday, April Fool, Episode I, the European Cup final,
  Millionaire, Bonfire Night...). Dave's Comik is now a recurring, gloriously rubbish black-biro series on exercise-book paper.

## 2.10.0 - 2026-10-16
- Grot -> Jack: products, programs and sites are Jack-named now (JackSearch, JackBay, Jackdot, JackFAQs, JACKFAX, Jackbo, Ain't It
  Kool News, NewJacks, JackToonz, Radio Jack, Jack FM, Jacktown, Jack Stock Exchange, JackLotto, Jackdown Park, Jackotchi,
  JackShield, RealJack, Babel Jack, HotJack (was GrotMail), Jack Quest, Space Jack Pinball, SkiJack, Pod Jack Racer, Pipe Jack,
  Jack Jong, Jack Chess, Jacklings, Jack Ball, 3D Jack Maze, JACK@home, Jackster, Jack Sweeper...). Old addresses redirect,
  old Run commands still work, saves/secrets/ids unchanged. Gubbinz, WAAAGHooo!, teef and the squig games keep the Ork flavour.

## 2.9.3 - 2026-10-16
- Resilient multiplayer: a visitor whose connection drops (tab asleep, phone locked, wobbly signal) gets the same id back when
  they reconnect (within 3 minutes), and reconnects the moment the tab is looked at again. JackNet Zone games (checkers,
  reversi, Connect 4...) now wait up to 2 minutes for a dropped player with the clock stopped, then resync the board,
  instead of ending after 4 seconds.

## 2.9.2 - 2026-10-16
- Comics, second pass: proper arms (shoulder, elbow, forearm) that reach where they should, mitten/open/pointing/fist hands
  that grip props, knees that bend when sitting/running/falling, crisp lying-down and leaning poses with KO stars, rooms with
  receding floors, skirting, window light and per-room details, and several panels re-staged so the joke reads.

## 2.9.1 - 2026-10-16
- Phones: the power-on scene fills the width (mouse and mat back, no empty band on top), landscape phones put the caption
  beside the set, and the power button has a 44px+ tap zone.

## 2.9.0 - 2026-10-16
Guests vs members (js/guest.js).
- Guests can look at everything, play single-player games, use the PC's programs, lurk in chat, write to Jack and sign
  guestbooks. Members only: forum posts and shout-outs, profiles, publishing a homepage, sending Uh-Oh! / JSN / WinPopup
  messages and texts, giving floppies away, the shared high-score tables, Teef (shop, plots, lotto, races), GrotBay bids,
  Shareware Shack ratings/reviews, Pen Pals, the Nerd Quiz Hall of Fame and the compo. A "JackNet Members Only" box (Join /
  Log On) carries on with what you were doing after you join; the server refuses the same things from guests.
- Signing up copies a guest's PC (desktop, files, scores, secrets) to their new JackNet profile with a progress box; logging on
  to an existing profile asks whether to merge this PC's files or use the saved profile.
- Guests: no Uh-Oh! window popping up at start, clearer logon box, Start > Log Off shows the right name, padlocks on
  members-only Start menu items, one gentle "your files stay on this computer" note.
- Pop-up balloons queue (2 at a time, 1 on phones) instead of piling up; no room flash after Log Off.

## 2.8.1 - 2026-10-16
- Switch-on: the camera always swings and zooms smoothly into the monitor (driven frame by frame; reduced motion just makes it
  shorter), scanlines only on the monitor glass, 3D mouse with a cable, raised keys, fixed monitor stand, camera a bit wider.
- Switch-off: Shut Down / Restart / blue screens shrink the page back onto the monitor glass, the CRT collapses to a line and a
  dot, the camera pulls back to the room. New painted-cloud JackOS splash; nothing in the boot screens is selectable.
- Refresh behaves like a home PC left on: back within 48 hours (and not shut down) -> wakes from standby in about a second on the
  same page with the same windows; after Shut Down (even F5 straight after) or 48+ hours away -> the room with the PC off and a
  fresh boot. A brand-new visitor no longer gets ScanDisk. No white flash before the first paint.

## 2.8.0 - 2026-10-16
- The Games Cupboard (js/discs*.js): a shelf of big-box PC games with box art and box backs, a D: drive (one disc at a time,
  autorun menus, Install / Play / Explore CD / DirectX 6.1), two-click installs or the full wizard with CD keys, "Please
  insert Disc 2", scratched discs (Abort, Retry, Fail? - polish it on your jumper), JackNet Top Installs chart, Callum's
  borrowed discs. Six new playable games, each a demo until its real 1999 release date: RollerJack Tycoon, JackCity 3000,
  Jacks: Armageddon, Age of Jackpires II, Championship Boss 99/00, Dungeon Keepa 2.
- What everyone talked about in 1999 (js/news99*.js): TOTALITY! (the eclipse), EURO WATCH, DOME WATCH, POP GOSSIP!, CRAZE
  WATCH, Jack Wants to Be a Millionaire (playable), JACK'S LAUNCH PAD, THE SPORTS DESK, THE POPCORN COUNTDOWN; each changes with
  the date and has the mates' comments; 31 dated What's New posts and countdowns; a 1999 LINKS box on Cool Links.

## 2.7.3 - 2026-10-16
- JAQUAKE (js/pcgames-jaquake.js): a Quake-style shareware shooter: chunky 256-colour software look, coloured light, flickering
  torches, Jack's face on the status bar, 3 maps with keys, lifts, secrets and the Giga-Blob boss, drop-down console (god,
  noclip, map, give all; iddqd from the wrong game), touch controls.
- JACKREAL TOURNAMENT (js/pcgames-jrt.js, mods/arena.js): arena DeathMatch + Capture the Flag vs bots (Callum is always
  Godlike), announcer (FIRST BLOOD... M-M-M-MONSTER KILL), 2 maps; the DEMO until 22/11. Online games between real visitors
  with a server browser, LAN games, spectators, chat, host hand-over and server-side checks.

## 2.7.2 - 2026-10-16
- No more sticky notes on the desktop (the family's "Who's been on the computer?!" notes and Mom's bedtime note are off).

## 2.7.1 - 2026-10-16
- JSN - the JackNet Network (www.jsn.jnet, js/jsn*.js, mods/jsn.js): a busy 1999 portal (channels, search, JackMail box,
  horoscopes, chat) ranked near the top of the JackNet, with a JSN button on the Links bar.
- JSN Messenger Service: only downloadable from 22/07 (its real 1999 release date; a "coming this summer" teaser before).
  Contact list Online/Not Online, statuses (Busy, Be Right Back, Away, On The Phone, Out To Lunch, Appear Offline), "says:"
  conversations, sign-in pop-ups, new-mail count, allow/block lists; real JackNet members only; messages are relayed live and
  never stored.

## 2.7.0 - 2026-10-16
The family PC comes alive, and the year has seasons.
- Power-on scene: a beige CRT monitor (JackVision 15) next to the tower, keyboard and mouse on the desk. Only the tower's power
  button starts it; the monitor warms up, the BIOS starts small on its screen and the camera zooms in. No CRT flicker over the
  switched-off room.
- Y2K Night (js/seasons*.js): on 31/12 a Millennium Eve special, countdown from 23:00, the bug at midnight (19100, 1/1/1900,
  falling icons, 15 error boxes, printer, mates' WinPopups), "2000" fireworks, restart back to 01/01/1999 ("...again?").
  Run y2kdrill (or the Y2K Bunker's hidden link) to try it any day. Special days through the year (New Year, snow day,
  Valentine's, Pancake Day, Red Nose Day, April Fool's, Easter egg hunt, school's out, Halloween, Bonfire Night, Children in
  Need, Christmas tree + presents). Monthly JACK ATTACK! Cover CD. The dial-up line sometimes drops (Mom picked up the phone).
- The LAN (js/lan*.js, mods/lan.js): Network Neighborhood shows the visitors online with Shared Documents, WinPopup, floppy
  disks you can hand to other visitors, the harmless SQUIG99 e-mail worm with www.squigshield.netz and SquigClean, Counter
  Wars for Homepagez hit counters, hourly Quiz Night with QuizGrot in JackIRC #quiznight.
- Desktop goodies (js/bridge-dl*.js): www.desktopdazzle.webcom with wallpapers, animated cursors, screen savers, 4 desktop
  themes, real fonts (Comic Squigs, Blocky 8-Bit, Wingdingz) and FREE SMILEYZ; plug-ins (ShockSquig 7, JackTime 4) for
  SquigToonz and The Trailer Park; The Annoying Ring of 1999-JavaScript homepages (no right-click, earthquake, pop-up chain...).
- The family PC (js/family*.js, mods/sms.js): 50 family files appear through the year (Mom, Dad, little sister Lucy, Jack's
  mates); Jack's Mobile (Snake, ringtone composer, T9, texts between real visitors, 10p credit and top-up cards); Grotchi
  nag + www.grotchigraveyard.kidz; the dot-matrix printer gives you a real printout PNG (Print in the browser uses it).

## 2.6.6 - 2026-10-16
- Graphics overhaul: the JACK & CO. comics redrawn (inked outlines, bigger expressive faces, 14 expressions, speech bubbles
  that never cover faces, accurate props); Hamster Cam is a real 1999 webcam still (grain, JPEG blocks, timestamp, 30-second
  refresh drawn line by line) of a properly drawn hamster whose routine follows the time of day (IR night vision); new Fish
  Tank Cam, Sheldon Cam (hibernating in winter), Goldie's bowl; fake-site "scanned photos" at 4x detail; ten JackCarta
  pictures redrawn; magazine Star Wars banner, Gubbinz poster/fan-club art and wallpapers redrawn.

## 2.6.5 - 2026-10-16
- Jack's account: members can be given a temporary password (POST /admin/register {"name","pass","mustChange":true}) and are
  asked to pick a new one in a JackOS "Change JackNet Password" dialog at logon (mods/jackbox.js + js/jackbox.js).
- Every reader's letter (Write to Jack, e-mails to anyone@jackattack.jnet) is also kept privately for the member called Jack and
  arrives in his Outlook Express as a real e-mail (live when he's online, the backlog when he logs on).
- Other people's cursors: only on JACK ATTACK! itself (sections, Games Arcade, Jack's own hidden pages), never on the other
  fake sites (they all shared one channel before), and only when you're scrolled to the same part of the same page.
- Web page <-> PC (js/bridge.js): right-click pictures (Save Picture As into My Pictures/Paint, Set as Wallpaper, Set as
  Desktop Item, E-mail, Copy...) and links (Save Target As, Copy Shortcut, Send To Desktop...), drag links/pictures/the
  address icon onto the desktop, "Make this my home page!" with the real Set Home Page dialog, Add to Active Desktop (live
  Hamster Cam, weather, news), File > Save As into My Documents (opens again from disk), Work Offline + dial-up tray icon,
  pages that know your PC (cookies really appear in C:\WINDOWS\Cookies), JackAmp skins site.

## 2.6.4 - 2026-10-16
- The power-on screen is now a 3D beige 1999 family PC tower (CSS 3D: CD-ROM, floppy, POWER/TURBO/RESET, LEDs, stickers)
  sitting on a desk in a dim room; it turns towards the mouse, the button latches in, LEDs flicker, the camera zooms in to
  the BIOS. Pressing it asks for full screen on a cold boot ("Full screen" tick box, remembered).

## 2.6.3 - 2026-10-16
- Gubbinz no longer strolls along the taskbar by himself (felt less like a real PC); Start > Run > gubbinz still calls him.
- Quick Launch now matches the real 1998 one: JackNet Explorer, Outlook Express, Show Desktop (desk blotter icon; really
  minimises and restores every window) and View Channels.

## 2.6.2 - 2026-10-16
- The Links bar now has its own full-width row under the Address bar (as IE5 let you drag it), shown to everyone
  (also re-enabled once for visitors who had hidden it) and on phones: WAAAGHooo!, GrotSearch, Jackgle!, Ask Gubbinz
  (ordered by 1999 popularity, Jackgle! climbs through the year), Best of the Web, JackMail, Homepagez, ChatterBox,
  GrotBay, Software, Cool Links... each with its own little site icon; the rest behind the chevron.

## 2.6.1 - 2026-10-16
- Finding the sites, 1999-style: sites are ranked by how popular their real-1999 equivalents were (the portal/directory,
  free e-mail and free homepages at the top, personal pages at the bottom; Jackgle! climbs through the year).
  WAAAGHooo! Hot 100 chart, "Most Popular Sites" in each directory category, JackNet Top 20 on Cool Links, engines
  listed biggest first, WAAAGHooo! is the default search service and the home-page search box.
- IE5-style Links bar: Internet Start, Best of the Web, Free JackMail, Jack's Home, Cool Links, Software...
- "Surf the Web" button near the top of the magazine menu (Cool Links / LINK-O-RAMA).

## 2.6.0 - 2026-10-16
Software you can install and uninstall, the 1999 search wars, and a lot more "it's just like THAT program!".
- Installer (js/setup.js, setup-shack.js): every program belongs to a product (JackOS component, download, cover disc or
  CD-ROM). Uninstalling really removes Start menu entries, desktop icons, Run commands and windows ("Problem with
  Shortcut" afterwards). Add/Remove Programs rebuilt: Install/Uninstall list, working Windows Setup tab with Details and
  the JackOS CD, Install... from CD/downloads, Startup Disk. File Download dialog (Run/Save), progress window with Mom
  picking up the phone, InstallGrot setup wizard (blue backdrop, EULA, CD keys, DLL conflicts, bundled toolbars, restart
  prompts), shared-file removal prompts, shareware nag screens, cover disc autorun menu (demos, DirectX 6.1, helpline).
- The Shareware Shack (www.sharewareshack.netz): ~100 programs incl. toolbars, squig ratings, mirrors, live download
  counts, visitor ratings and reviews. Download-only extras: Squig Screen Mates, Desktop Fish Tank (no fish), DaveZip.
- Search engines (js/web-engines*.js): WAAAGHooo! portal/directory, Jackgle! (BETA until 21/09), Ask Gubbinz, GrotSearch
  restyled as the old cluttered engine; IE search bar with a search-service chooser; WebDir master directory of ~120 sites.
- Links made obvious: LINK-O-RAMA Cool Links (88x31 button wall for every site, Site of the Day, random surf), "SURF THE
  JACKNET!" home box, new Links bar buttons, Favorites > JackNet Directory, popular sites in the address dropdown.
- Era software (js/era-apps*.js): Squigsweeper, Grot Ball, Squig's Revenge, 3D Grot Maze and Grot Island screen savers,
  SQUIG@home (shared work units), Staples the paperclip, RealSquig Player, Squigster (real sharing between visitors),
  plus a dodgy shelf (FIREWORKS.EXE, RAM Doubler 99, Purple Pal, Registry Fixer Pro, Modem Turbo, cursors, weather...).
- Era websites (js/era-sites*.js): Grotdot, GrotBay live auctions, The Squig Witch Project, Grotbo, GrotFAQs, Ain't It
  Grot News, Newgrots, Web Toyz, Holo Hut, House Robot HQ, a Futurama page, GROTFAX teletext, and the Ring of
  Fire-and-Glitter dodgy sites (download more RAM, fake Y2K scan, Nutscape-only, frames in frames, pop-ups...).
- Homepagez PageBuilder (js/homepages*.js, mods/homepages.js): members build and publish real structured homepages at
  members.homepagez.webcom/~name/ with counters, guestbooks, polls and a member webring; strict server-side sanitising.

## 2.5.1 - 2026-10-15
- Teef economy (mods/econ.js): earn Teef as a member; Teef Emporium shop (desktop wallpapers, cursors, sounds, colours,
  Gubbinz food and hats, taskbar pets, badges, Squig Ticker 98), Squig Stock Exchange, Grotville town sim, JackNet Bank,
  lottery, grot races, squig farm.
- Uh-Oh! Messenger works like ICQ: Uh-Oh! numbers (1999000 + member no x 37), add by number/nick, authorisation requests,
  offline messages via a private server mailbox (mods/pm.js), docked contact list. No fake people anywhere (JackIRC's
  bot is JackServ [bot]).
- Personalised, date-themed e-mail engine (~35 senders, addressed to the logged-on JackNet user; replies from Gran,
  Dave, Gubbinz; e-card, hoax and unsubscribe sites; Inbox Assistant).
- Comics rebuilt as "Jack & Co.": new art, 11-character cast, 40 strips released through 1999, archive, ratings,
  comments, a vote-the-ending strip and a caption strip.
- JackCarta: 268 subject-specific pictures with captions (LEGO is a brick now), fact fixes.
- Pinball: physics rework (sub-stepping, capsule collisions, ball search); the inlane traps are gone. SkiGrot crash loop fixed.
- Toolbars: 29 adware toolbars with skins, mascots, tickers, banner ads and mini games; bundled-install dialogs.
- Icons: official JackOS pixel icon set (171 icons), JackOS cube logo (no more Windows-like flag), new JackNet Explorer
  globe icon and animated throbber, pixel toolbar buttons.
- Fact-check pass (~50 corrections), consistency fixes, no age/location hints.

## 2.5.0 - 2026-10-15
The big one. JackOS 98 is now a whole lived-in PC and a whole 1999 internet.
- JackNet logon at boot (auto logon with a saved token, sign up by picking a name, or Guest); Start > Log Off <nick>.
  Roaming profiles: a member's desktop, files, settings, secrets and saves follow them (mods/roam.js, DATA_DIR/profiles).
- Server: generic shared state (Net.kv inc/push/put/watch, /admin/kv-del) + peer relay (Net.relay), and a mods/*.js
  plugin loader with site events (hello/score/post/chat/gb/login/close).
- The magazine lives at http://www.jackattack.jnet/ inside JackNet Explorer (typing jacklm.com works too); other sites
  and hidden pages get the whole page (no magazine chrome around them). No OS-style windows inside web pages.
- Website: the Hangout (Palace-style avatar chat with 5 rooms, props, jukebox, trivia), What's Happening feed, member bar,
  Star Wars shrine, Comics, Top 10s, Nerd Quiz, Polls, Compo, Pen Pals, Downloads that install things, Cool Links, more
  reviews/cheats/Ork words, precise same-place cursors, web-style boxes everywhere, Screensaver page is a download page.
- Living 1999 timeline: Now Playing / Craze / On the Box / Charts / Space Watch / Saving Up / Hype-o-meter; 1998 things
  fade out through spring; ~200 more dated posts and countdowns.
- Fake 1999 web: ~240 pages on ~60 sites with fake TLDs (.jnet .grot .webcom .kidz ...), GrotSearch, webrings,
  neighbourhoods, e-cards between visitors, adopt-a-pixel pets, live counters and guestbooks.
- The Zone moves to www.jacknetzone.jnet: lobby, 27 rooms, 9 online games in separate game windows, ladders, profiles,
  weekly Reversi Cup, Java Arcade.
- Programs: MS-DOS Prompt (COMMAND.COM, EDIT, JBASIC, Grot Quest, shareware, MS-DOS mode), 13 games (pinball, ski,
  pod racer, Hearts, Spider, chess...), WordPad/JackCalc/Cardfile/Address Book/HyperTerminal BBSes/Calendar/Win 3.1
  Program+File Manager/JackMeeting, Task Manager, Device Manager, Help (187 topics), Printers, 12 desktop themes,
  Welcome tour, JackCarta 99 encyclopedia, Media Player, CD Player, typing tutor, Stamp Studio, Uh-Oh! Messenger,
  JackIRC (the chat room moved here), whiteboard, fridge magnets, corkboard, radio, snowballs, parcels, bottles.
- Outlook Express: mail to @jackattack.jnet becomes a Letter and gets an auto-reply; mailto links compose mail.
- New pixel-art JackOS icon library (jackattack.jnet/icons), more adware toolbars, Gubbinz can be put in the Recycle Bin,
  OS polish everywhere (bevels, z-order, keyboard menus, Win98 controls), right-click menus everywhere.

## 2.4.6 - 2026-10-15
- Right-click anywhere gets a JackOS menu, never the real browser's: desktop icons (Open/Send To/Delete/Properties...),
  title bars (system menu), text boxes (Undo/Cut/Copy/Paste/Select All), toolbars, Start menu, "What's This?" elsewhere.
- CRT glass 20% softer; flickers are now rare and random (8-25 s apart, tiny blips) instead of on a loop.

## 2.4.5 - 2026-10-15
- CRT glass 15% less intense overall.

## 2.4.4 - 2026-10-15
- CRT flicker and interference line 30% fainter.
- deploy.sh only publishes the new stamped index.html once the restarted server answers through Cloudflare
  (`--static` skips the restart).

## 2.4.3 - 2026-10-15
- CRT glass turned up a notch: stronger scanlines and RGB phosphor grid, a cool-to-warm glass tint, and faint irregular
  flicker and the odd interference line.

## 2.4.2 - 2026-10-15
- Subtle CRT monitor glass over the whole screen: faint scanlines and phosphor stripes, darker curved corners, a slow
  rolling refresh band (off with Run > crt; no motion with prefers-reduced-motion).

## 2.4.1 - 2026-10-15
- Start menu: access-key letters no longer have gaps ("P rograms").
- Desktop icons stay on the desktop when the browser is maximised or full screen; leaving full screen restores the window.
- Desktop icons sit on a regular Win98-style grid.

## 2.4.0 - 2026-10-14
- JackOS desktop framework (apps.js): window manager for programs, desktop icons, cascading Start menu (Programs,
  Documents, Settings, Find, Help, Run), virtual C: drive, Run dialog, Ctrl+Alt+Del Close Program, Secrets Found tracker
  (155 secrets), WinPopup messages between visitors, hidden address-bar pages.
- Files pack: Explorer/My Computer, ~230 files (1999 diary that grows by date, homework, stories, lists, locked folder),
  full Notepad, pixel-art image viewer, Recycle Bin, Outlook Express with 70 dated emails.
- Programs pack: Calculator, Paint, JackAmp (10 original chiptunes), Disk Defragmenter, ScanDisk, Registry Editor
  (edits do things), Control Panel with 20 working applets, Phone Dialer (DTMF), System Information, Clipboard, Char Map.
- Fun pack: 8 idle screen savers, Network Neighborhood (real visitors, net send), Gubbinz desktop pet, 18 hidden web
  pages + WebRing, ~90 Run commands, seasonal/time-of-day events, Briefcase, Online Services, Grotchi.
- Solitaire + FreeCell, written from scratch with original card art and the bouncing win.
- Message boxes keep line breaks; Sound.setVolume for JackAmp.

## 2.3.0 - 2026-10-14
- Member profiles: 16 pixel avatars, name colour, mood, page theme, bio, favourites, forum signature, a profile visit
  counter and shout-outs. Members page with online dots; names in chat/nicklist/forums link to profiles (#members/Name).
- Forums: 7 boards (UBB/phpBB style), topics, replies, quotes, [b]/[i]/[u], smileys, new-post folders, live updates;
  members post, everyone reads. Admin: /admin/delete-topic?topic= and /admin/delete-post?topic=&post=.
- Shut Down now goes splash -> CRT switch-off -> power button (no "safe to turn off" screen).

## 2.2.0 - 2026-10-14
- The PC: switch-on power button, BIOS, ScanDisk (only if you didn't shut down properly), JackOS splash, dial-up with
  modem noise. Proper Shut Down dialog (stand by / shut down / restart / MS-DOS mode) with closing animations and a
  CRT switch-off; super-rare random BSODs that reboot. Served from ./site via ./deploy.sh (build-stamped ?v=).
- JackNet Explorer is a full IE5-style browser: working menus, toolbar, history/favorites/search explorer bar,
  editable address bar with the real URL and a "page cannot be displayed" error page, right-click menus, view source,
  save as, print, properties, Internet Options, full screen, draggable/resizable window that only scrolls inside.
- Old-PC life: adware toolbars that install themselves and stack up (14 kinds incl. WAAAGHoo! Answers, GrotBuddy),
  rare joke pop-ups, Office-Assistant-style Gubbinz on the Letters page.
- The site lives in 1999: researched calendar of ~160 games/sci-fi/tech/space posts (UK dates) that appear on their
  day, with countdowns to the hyped releases; resets to 01/01/99 every New Year.
- Games Arcade: no fake installers. JACKTRIS (Tetris) with live spectating and KNOCKOUT battles, Squig Lob ghosts on
  a shared daily course, plus Snake, Grot Sweeper, Brick Bash, Ork Invaders, Space Rocks, Grot Pong, Whack-a-Grot,
  Simon Says and Save the Grot (hangman), all with shared high-score tables.
- Flashier: sparkles, headline marquee, rainbow headings, flames, 88x31 badges, glitter cursor in the page.
- Letters: one per 10 seconds. "Mom", not "mum". No location clues.

## 2.1.0 - 2026-10-14
- JackNet membership: a Win98-style "Welcome to JackNet" log-on box on the first visit. A new user name + password
  makes you a member (numbered); an existing one logs you in on any device. Cancel = browse as a guest (GuestNNNN).
- Passwords are scrypt-hashed and browsers keep a session token. Rate-limited log-ins, 10-minute lockout after 8 bad
  passwords, bad-word filter on names, and reserved names (Jack, admin, sysop, Gubbinz, guest* and so on).
- Free nickname changes removed. Members get a star in the chat list, and only a logged-in member can sign a letter
  with their name. Log On / Log Off in the Start menu and the chat window.
- Admin: POST /admin/register {"name","pass"} claims a reserved name, POST /admin/members lists members,
  POST /admin/delete-member?name= removes one.

## 2.0.0 - 2026-10-14
- New concept: "JACK ATTACK! Online", an abandoned games-mag fan site set in 1999, shown inside a Win98-style
  browser window (JackNet Explorer: back/forward/address bar) on a desktop with taskbar, Start menu and clock.
- Forever-1999 loop: posts appear on their day each year (earliest date is 08/04/99, the "No Scrubs" launch post),
  the "gone to the party" post shows on 31/12, and at New Year the countdown glitches (YEAR 19100) and resets to
  1999. Test with ?y2ktest. Letters show relative times, never real dates.
- Pages: Home, Cover CD (MegaCube, new Squig Lob game with shared high scores, Stickman Stunts; each behind a fake
  InstallShield wizard), Gubbinz, Screensaver (Display Properties + full-screen plasma), Reviews + Readers' Game of
  the Year poll, Cheats (+ a Run box with secret codes), Orks (WAAAGH! meter, Ork namer), Letters (Jack replies,
  daily Star Letter), Art Wall, Chat.
- Shared extras: live activity feed, per-page "N here" badges, cursors only shown to people on the same page.
- Visitor counter is now real (fake 1337 seed removed; one visit per browser per 30 min, max 5 per IP).
- Warhammer content is vague on purpose: loves Orks, no armies or points.
- Self-hosted fonts (Anton, Bangers; SIL OFL).

## 1.0.0 - 2026-10-14
- Replaced the old dark "jack matthews" splash (backup: /mnt/media/backups/archive/landing-old-2026-04-29/) with a 1999-style homepage.
- Node server (app/server.js) serves the site and a shared WebSocket; state persisted to data/state.json.
- LIVE (shared) toys: hit counter, The Button, MegaCube shared Rubik's cube (solve counter, reset vote, scramble cooldown),
  plasma ball that shows other visitors' touches, stickman fling counter, Gubbinz the shared virtual grot,
  WAAAGH! meter (screen-shake event for everyone), graffiti wall, N64 poll, mIRC-style chat, guestbook,
  other visitors' cursors, netizens-online list.
- Local toys: ragdoll stickmen, dial-up splash, cursor sparkles, chiptune "MIDI", dice roller, Ork name generator, Y2K countdown.
