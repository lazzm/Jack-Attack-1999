# Audio (generation pipeline and cast)

Owner approved the Gemini test tape (2026-10-26): "voices and audio is great".

## Tools
- Generator lives outside the repo: `~/jack-audio/gen.mjs` + `batch.json` (key in `~/.secrets/gemini.env`, never in git).
  Every generated file is logged with model, voice, prompt and filters in `~/jack-audio/out/provenance.jsonl`.
- Music: Google Lyria via the Gemini API (`/v1beta/interactions`): `lyria-3-clip-preview` for 30 s clips/tests,
  `lyria-3.5` for full tracks. Always "Instrumental only" unless we supply ORIGINAL kid-safe lyrics; never name real
  artists, songs, games or brands. Output carries an inaudible SynthID watermark.
- Voices: `gemini-3.8-flash-tts`. Put the performance direction in a short leading `[bracket tag]`; a long
  "Say this like ...: line" prompt gets read aloud. Verify every line by transcribing it back (`transcribe.mjs`).
- Post: ffmpeg loudnorm (music -16 LUFS, voice -18), optional period filters (through-the-floor muffle, console crunch).
  Ship MP3 (q4) in `app/public/audio/...`, lazy-loaded.
- Console/cartridge music that must sound like real 1998 hardware can still be written as note data and rendered in code.

## Voice cast (Gemini prebuilt voices)
| Character | Voice | Notes |
|---|---|---|
| Mom | Sulafat | Approved (take A). Upstairs lines use the "downstairs" muffle filter when she shouts from the kitchen. |
| Dad | Algenib | Exasperated, good-humoured. |
| Gran | Vindemiatrix | Owner picked take 1 ("Gran, option 1" on the listening page). Gacrux was dropped (sounds Northern = location clue). |
| Crystal (little sister) | Leda | Cheeky, whiny. Transcribes as "Mum" when shouted: write lines as "Mom". |
| Game announcers | Fenrir | + crunchy console filter. |

## Name call-outs
Lines where family call the player by name ("JACK! Tea's ready!") are recorded once per first name in the Cast name
pools plus the most common 1999 UK first names, as `audio/voice/<lineId>.name-<lowercase first>.mp3`. Playback picks
the variant matching the player's chosen first name (any player called Jack gets the Jack version, not only the owner),
else falls back to the generic `<lineId>.mp3` that uses no name ("Tea's ready! Down you come!").
- Matching is by SOUND, not spelling (owner: "or Jak or Jaque you know variation"): names are reduced to a phonetic key
  (Double-Metaphone style, plus a small alias table for cases it misses), so Jack/Jak/Jac/Jakk/Jaque all hit the Jack
  recording. Files are named by the phonetic key's canonical name.
- A nightly job (outside the live container; key stays in ~/.secrets) lists chosen first names with no matching
  recording and generates their call-outs, verified by transcription, so new players hear their own name by the next day.
- Generator: `tools/audio/names/gen-names.mjs` (batched by default, robust splitter + raw archive, see below). The
  scheduled copy runs in `~/jack-audio/names/` (gen-names.mjs + `../lines-lib.mjs` = `~/jack-audio/lines-lib.mjs`;
  copy both after changing them). Timer `jack-names-callouts-2` (2026-10-28 07:15, env `MAX_REQ=70`, log
  `batched.log`). `node gen-names.mjs --dry-run` shows the plan; `--resplit` re-splits the raw archive.

Rules: neutral British accents only for family (no regional accent = no location clue); kid-safe; no cloning real people.

## Quota (found 2026-10-26)
Gemini TTS on our tier allows **100 generate requests per model per day** (resets ~07:00 UK). Budget it:
- Both generators take a hard request cap that counts every TTS HTTP attempt, retries included
  (`gen-lines.mjs --max-requests N`; `gen-names.mjs --max-requests N`, else env `MAX_REQ`, else 90), and stop cleanly
  on the daily-quota 429. `--dry-run` prints the plan without reading the key or calling the API.
- Transcription (verification) uses gemini-3.8-flash, which is not capped this way.
- Name call-outs: batched by default (15 names per request); the old one-request-per-name path is opt-in
  (`--per-name`) and capped the same way.
- Story/voice lines: <= 13 lines per request, one character + fx per request; keep ~10 requests/day spare.
- Scheduled runs: `systemctl --user list-timers --all` (jack-names-callouts-*, jack-voice-lines-*).

## Batch splitting and raw archive (both generators, `tools/audio/lines-lib.mjs`)
One TTS request voices many lines/names; the response is cut into clips at silences:
- `silencedetect` at a small minimum gap (0.25 s, -38 dB; also -42/-35 dB and 0.15 s at -38/-32 dB). Settings with
  fewer than n-1 internal gaps are skipped; if every setting has too few, that batch fails (no guessing).
- Start from the n-1 longest internal gaps, then a dynamic programme over all gaps picks the cut set that maximises
  total cut-gap length minus a penalty for implausible clip lengths (expected length from the text, calibrated to the
  batch's speaking rate; plausible band 0.35x..2.6x + 0.6 s slack). So a long pause inside a line is not chosen over a
  real separator. Variants that drop a leading/trailing junk segment (direction read aloud, laugh) compete too.
  Clips still outside the band are marked `suspect` (still verified, not dropped).
- Every clip is verified by transcription (lines: word overlap >= 0.8 and no leaked tag words; names: sound-alike
  first word, no extra words). If a clip fails, up to two alternative boundaries from other cut sets are tried.
  Only verified clips are written/listed; failures are recorded per line/name in the report with the reason.
- Every paid TTS response is saved as WAV + JSON sidecar (batch id, ordered ids/names, exact prompt, voice, model,
  time) in the raw archive, which the scripts never delete: lines `~/jack-audio/lines/raw/`, names
  `~/jack-audio/names/raw/` (`--raw DIR` to change). `--resplit` re-splits every archived batch offline (no TTS) and
  re-verifies whatever is not verified yet.
- Offline tests: `node tools/audio/test-split.mjs` (ffmpeg only: uneven gaps, 21-segment and 13-vs-12 cases, a long
  intra-line pause, leading junk, too-few-gaps failure, matcher, fx chains).

## Story voice lines (`tools/audio/gen-lines.mjs`)
313 lines (`tools/audio/voice-lines.json`; the trailing ` |` on most lines is table residue and is never sent to TTS).
- Plan: every unverified line is grouped by (character, fx) into batches of <= 13 (`--batch-size`), each line keeps
  its own `[tag]`: `[tag] line ...  ...  ... [tag] line`. Lines that failed verification twice (or whose batch failed
  to split twice) get one request each, after all batches. Requests left under `--max-requests` re-plan the
  failures in the same run (passes 2-3). Re-running skips verified clips, so extra runs are harmless.
- Each clip: trimmed, loudnorm -18 LUFS, verified on the clean clip, then `fx` applied (`downstairs` = hp180/lp2200 +
  echo; `console` = 22.05 kHz + light bitcrush + lp7000), so the muffle never causes false failures.
- Output: `--out DIR` (default `app/public/audio/voice/`): `<id>.mp3` (mono, q5) + `manifest.json`
  (`{id: {file, character, dur}}`, verified clips only). Progress/transcripts: `--report FILE` (default
  `tools/audio/lines-report.json`).
- Run: `node tools/audio/gen-lines.mjs --dry-run`, then `node tools/audio/gen-lines.mjs [--max-requests N=26]
  [--only id,batch,character]`; `--resplit` for archived raw batches.
- The scheduled runs work in a stable copy outside the worktree: `~/jack-audio/lines/` (gen-lines.mjs, lines-lib.mjs,
  voice-lines.json, lines-report.json), clips in `~/jack-audio/lines/voice/` (seeded with the 67 verified on 26 Oct),
  raw in `~/jack-audio/lines/raw/`, logs `~/jack-audio/lines/run-YYYY-MM-DD.log`. Transient user timers
  (`systemctl --user list-timers --all`):
  - `jack-voice-lines-1` 2026-10-28 08:15, `--max-requests 28` (the 07:15 name job takes 70 that day)
  - `jack-voice-lines-2` 2026-10-29 08:15, `--max-requests 90`
  - `jack-voice-lines-3` 2026-10-30 08:15, `--max-requests 90`
- **Before deploy**, install the verified clips into the repo (no API):
  `node tools/audio/gen-lines.mjs --out ~/jack-audio/lines/voice --report ~/jack-audio/lines/lines-report.json --install app/public/audio/voice`
  (copies every manifest-listed mp3 and merges `manifest.json`); also copy `~/jack-audio/lines/lines-report.json`
  over `tools/audio/lines-report.json` to keep the transcripts with the repo.

## In the game (js/st-voice.js, js/np-bubble.js)
- Manifest-driven: `audio/voice/manifest.json` (written by gen-lines / `--install`) lists the verified clips. The page
  loads it when idle; each clip is fetched and decoded the first time it's needed (and prefetched when a line is queued).
  A line with no clip plays as a speech bubble with the timed mouth, so new clips just start working once installed.
- Playback: WebAudio buffer -> PannerNode at the speaker's mouth (inverse distance, ref 1.4 m) -> lowpass/quieter when
  they're in another room or on another floor (not for clips already muffled with fx=downstairs) -> analyser -> Sound's
  `voice` bus (on the "Sound effects & voices" switch and the volume). Music dips to 55% and effects (telly, games) to
  70% while someone talks. Sound off, volume 0 or no user gesture yet: nothing is fetched or played.
- np-life holds a line back up to 4 s for its clip to decode so words and voice start together; a clip that starts late
  stretches the line to its real length. The painted mouth follows the analyser's level.
- Speech bubbles replace the bottom subtitle box; "Subtitles" in the pause menu brings the box back as well. Lines
  with nobody in the house to hang a bubble on (diary, narrators) still use the box.
- Not yet: name call-out clips (`callout=` lines play the generic line only).
