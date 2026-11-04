# JackNet first-player review

Review date: 4 November 2026. Local `signup` checkout only, disposable state under `/tmp`; production was not used. Evidence: `tests/shots/signup/{before,after}/`. The game calendar stays in 1999.

## Ranked losses (qualitative risk, not measured conversion rates)

1. **You must commit before seeing the game.** The first page is a small logon box in a large empty teal screen. There is no house picture or explanation of the adventure. A stranger cannot tell what they are joining. Fix: real in-game bedroom photograph and a short, specific invitation, with an obvious Create Account route. Mandatory account gate remains.
2. **Three typed credentials and a second form.** Signup asks for user name, password, password again, then a character first name and Boy/Girl. Character fields have defaults, but the extra Next/Create step looks mandatory. Fix: two typed fields, show-password control, character defaults visible in an optional About You section on the same form. Family name is explicitly fictional and changeable later.
3. **Taken name discovered after About You.** You finish a second screen before the server rejects the account name. No alternative is offered. Fix: rejection on the single form with a server-checked suggestion; preserve typed values and place errors next to fields.
4. **Forgotten password is a dead end.** No link, email, recovery code or automated reset exists. Existing salted scrypt hashes cannot recover passwords. Fix: honest help explaining saved-browser/password-manager options and the absence of a reset; never ask children for personal details or invent an insecure reset.
5. **Connection loss discards the form.** The socket close handler rebuilds the gate, losing the password and unfinished signup; a late reply can appear frozen. Fix: retain the live form and show connection/pending status, bounded waiting and a retry path.
6. **Loading starts with an unexplained sentence.** Settings load replaces the window with bare text; early HTML has no useful download status. Existing artwork progress is based on actual queued jobs, but not exposed during settings. Fix: labelled setup stages, actual asset loading counts and honest slow-connection guidance; no fabricated percentages.
7. **Phone keyboard and focus.** Automatic first-field focus can summon a keyboard before the game is explained. A centred tall form may be awkward in landscape or a short visual viewport. Fix: readable 16px fields, 44px targets, scrollable viewport-aware gate, restrained focus, and portrait/landscape checks.
8. **Error accessibility.** One general message far from both fields; no field-specific description or invalid state. Fix: associated labels, inline messages, `aria-invalid`, a live status, keyboard order and Enter submission.
9. **Returning sessions already work.** Token is persisted locally; refresh and later browser visits resume without a password. Keep session handling, logout revocation, roaming identity, balances and standing/seated state unchanged. Verify rather than replace.

## Measurement method

One Chromium browser at a time, 1366×860 desktop and emulated touch phone. Real keys type with a fixed 45ms inter-character delay; phone controls use real touch. Times include screenshots and local software-WebGL work, so they are reproducible diagnostics, not a real-device speed promise. An action counts focusing a field or pressing a button, not individual characters. Required text fields and optional character controls are counted separately. Detailed event timings are written to each evidence `results.json`.

Baseline happy route: Create Account → user name → password → confirm password → Next → default About You → Create Account → room. Three required typed fields; two identity choices already populated; six focus/button actions before movement. No personal information is required: the old wording asks for a first name but permits a made-up name. No email, age or address is collected.

## Results and verification

In progress; final measurements and exact test results will be recorded below before handoff.

Implementation choices: password hashing, rate limits and session protocol remain unchanged. The only server addition is a free-name suggestion attached to the existing public taken-name error (also handles a simultaneous signup race). Suggestions pass the same username and reserved-name validation; no account is reserved. Character edits use the existing validated, rate-limited `meSet` path. Owner Jack remains fixed. Form input is never interpolated into HTML, and passwords live only in the input/request memory, never local/session storage, logs or screenshots. All requests and scripts remain first-party under the existing CSP.

The first screen now defaults to Create Account for a stranger (two typed fields and one Create button: three focus/button actions, compared with six). Existing local account state opens Log On; a saved token opens a loading/resume window. A returning account on a new browser has a clearly labelled “Already joined? Log On” button. The grey window, navy title bar, raised buttons and teal background retain the game's period UI.

The unseen 3D loop now waits while the mandatory account window is open, keeping its frame timestamp current. This avoids spending rendering time or advancing physics behind signup and resumes on the next frame after authentication. The room watchdog also ignores this deliberately covered view.

The first baseline runner stopped before completing the logout/error sequence; its partial native desktop captures remain, including an actual flat teal loading capture. A subsequent preview attempt hit an occupied test port and was stopped. Test wrappers now select a free port in 18080–18099 and verify that their own server is alive before using it. These attempts are not counted as passing regressions or as product page-load bugs.

An actual logout regression was caught and fixed during testing: restoring the guest profile cleared `jhp_roam_who`, so the initial stranger detector opened Create Account after logout. The gate now reuses the already device-only `jhp_logon_seen` flag (no account name, password or personal details) to choose Log On. Roaming already excludes this key. A successful login or token resume sets it; authentication still requires the existing server token or password.

Room warm-up was also shading the entire invisible house at full viewport size. It now uploads the same geometry with a one-pixel scissor for that hidden pass, restores the renderer's previous scissor and visibility, and renders the visible room normally. Textures and shader variants are still prepared. This changes hidden loading work, not the game's graphics quality or device settings.

Character settings are available from Menu > About You and from JackNet > Edit my profile, so the existing JackOS-only fallback has a route too. Owner Jack remains fixed.

## Measured comparison

Actions below mean focusing a required credential field or pressing a necessary button. Optional inspection of About You is excluded; screenshots have separate elapsed timings in JSON. Automatic character defaults need no typing or extra button. Physical movement is asserted from the actual house pose after a real key or touch-stick gesture.

| Route | Original flow | Revised flow |
| --- | --- | --- |
| Required typed fields | 3 (user name, password, confirm password) | 2 (user name, password) |
| Character choices | First name + Boy/Girl, prefilled, separate required screen | Same choices, prefilled, expandable on signup; editable later |
| Necessary form actions before the house | 6 | 3 |
| Desktop, navigation to walking | Not completed reliably on this shared host; already 98.21s at About You, before final Create | 44.50s (40.86s to a ready bedroom) |
| Phone, navigation to walking | Not completed reliably; already 59.68s at About You, before final Create | 43.92s (40.57s to a ready bedroom) |

These are software-rendering diagnostics with an explicit test-only 0.5 raster cap, not phone hardware measurements or a controlled claim of a particular speedup. The original loading screenshot timed out on separate desktop and phone runs. Original native desktop arrival/walking captures also exist, but that partial run did not retain a valid end-to-end timing. No exact original walking time is claimed. Raw/capture-excluded step timings are in `tests/shots/signup/after/results.json`; partial original bounds are in `before/baseline-partial.json`.

## Evidence limits and remaining work

The `before/` directory contains partial captures from several isolated runs, not a completed single original journey. The original-flow loading capture failed on both a separate desktop run and a separate phone run. Original phone arrival, original error/recovery/next-day screenshots, and a completed original walking timing were not obtained. This is a baseline evidence gap; the corresponding revised desktop and phone paths were exercised.

The complete revised main journeys produced zero page errors or new console warnings in both device runs. The first combined runner then failed because a test predicate used an unguarded global during a legitimate profile reload. After fixing that predicate, the unavailable-graphics simulation also needed to block the browser's experimental WebGL alias. Focused reruns passed the real no-WebGL message, phone fallback character changes and original-code password login. Earlier failed/cancelled attempts are retained in the logs and are not counted as passing full test commands.

No real name, age, email or address is required. No live data, deployment files, version, changelog or AGENTS.md was changed. No account was reset. No deploy, commit or push was performed. The pre-existing untracked voice path was left alone.

No owner input is needed for these changes. A future safe password-recovery feature could use one-time recovery codes generated by the server and stored only as hashes, with authenticated setup for existing players; this needs a separate design and security review. The current UI honestly describes the lack of a reset.

## Actual test results

| Command / check | Real result |
| --- | --- |
| `bash tests/signup-check.sh syntax` | Exit 0, all touched JS and new JS checked |
| `bash tests/signup-check.sh units` | Exit 0, all 48 `*-unit.cjs` files passed |
| `node --expose-internals tests/parody-audit.cjs` | Exit 0; 0 authored spans to rewrite |
| `bash tests/signup-check.sh identity-edit` | Exit 0; desktop and touch character edits |
| `bash tests/signup-check.sh signup-fallback` | Exit 0; no-WebGL desktop, phone fallback profile/character edit, original-code password login; legacy hash/salt/created preserved |
| `bash tests/signup-check.sh signup` | Exit 1 in the failure-simulation portion. Both complete desktop/phone main journeys passed, including errors, movement, logout, refresh and reopening. Test predicate/simulation corrected; full combined command not rerun. |
| `bash tests/signup-check.sh signup-extras` | Exit 1 in the incomplete WebGL simulation. Slow files, reconnect credential retention, short viewports and phone landscape passed. Corrected graphics path passed the focused fallback run above. |
| `node tests/identity-house.mjs --case=sarah` | Exit 1: gallery `House.hush` cleared the queued welcome before the assertion. Test now waits for the natural welcome before the gallery; corrected test not rerun. |
| `bash tests/signup-check.sh story` | Exit 1 when the owner phase attempted a second browser. Gameplay reached Game Lad, chores, PC assembly/install, diary refresh, phone/veteran checks with no browser errors. Runner now closes the first browser before owner phase; corrected full run not rerun. |
| `node tests/smoke.mjs` | Exit 1, 9/12 passed. Walk-refresh, prop-refresh and mobile-desktop timed out with loading still visible. Browser-errors and server-log passed. These waits have not been reproduced alone and are not diagnosed as a product defect. See `tests/shots/signup/checks/smoke.log`. |
| `bash tests/signup-check.sh readonly` | Exit 0; HTTP 200, mandatory gate, no guest bypass, no browser errors/warnings |
| `owner-tools <url>` | Not run (owner unit checks passed; full owner browser suite still needed) |
| `mobile.mjs --only=gate,story` | Not run; the new signup runner used real touch at 390×844, but is not a substitute for this broader suite |
| `onboard.mjs`, `onboard-arrival.mjs`, `onboard-popups.mjs` | Not run; onboard layout unit passed |

Browser runs were serial, on disposable localhost servers and `/tmp` data, using system Chromium. Functional runs used an explicit 0.5 raster cap and skipped Playwright's wait for unrelated hidden-program font loads. Main signup screenshots keep native CSS dimensions. Native desktop captures are retained separately. These checks do not establish real phone performance or a physical password-manager/keyboard integration result.

Next: rerun the corrected identity/story harnesses, isolate the smoke refresh waits with the same renderer, complete mobile/owner/onboard suites, and repeat native/physical-device art and keyboard checks before any deployment. The final loading-status guard prevents later file-progress text from overwriting an unsupported-graphics alert; it was syntax/unit checked, but that exact final alert screenshot was not recaptured.
