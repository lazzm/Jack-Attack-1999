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
| Gran | Vindemiatrix / Achernar / Despina | Owner picking; Gacrux was dropped (sounds Northern = location clue). |
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

Rules: neutral British accents only for family (no regional accent = no location clue); kid-safe; no cloning real people.

## Quota (found 2026-10-26)
Gemini TTS on our tier allows **100 generate requests per model per day** (resets ~07:00 UK). Budget it:
- Name call-outs use batched requests (`BATCHED=1 node gen-names.mjs`): ~15 names voiced per request, split at
  silences, each clip verified by transcription (transcription uses gemini-3.8-flash, which is not capped this way).
- Story/voice lines: group lines per character into one request where possible; keep ~10 requests/day spare.
- A scheduled one-off run: `systemctl --user list-timers` (jack-names-callouts).

## Story voice lines (`tools/audio/gen-lines.mjs`)
313 lines in 26 batches (`tools/audio/voice-lines.json`; gran uses Vindemiatrix until the owner picks).
- One TTS request per batch: lines are sent as `[tag] line ...  ...  ... [tag] line` (per-line short tag), split at
  silences > 0.9 s (`--gap` to tune), segment count must equal line count or the whole batch is marked failed.
  Each clip is trimmed, loudnorm -18 LUFS, verified by transcription (word overlap >= 0.8, no leaked tag words), then
  `fx` applied (`downstairs` = hp180/lp2200 + echo; `console` = 22.05 kHz + light bitcrush + lp7000).
  Verification uses the clean clip, so the muffle never causes false failures.
- Output: `app/public/audio/voice/<id>.mp3` (mono, q5) + `voice/manifest.json` (`{id: {file, character, dur}}`, verified
  clips only). Progress/transcripts: `tools/audio/lines-report.json`. Re-running skips verified clips.
- Run: `node tools/audio/gen-lines.mjs --dry-run` (no API), then `node tools/audio/gen-lines.mjs [--max-requests N=26]
  [--only mom-plain-01,dad-plain-02]`. Stops cleanly on a daily-quota 429. Order: untried batches first, then
  individual retries (one request per failed line) with whatever `--max-requests` allows.
- Offline tests: `node tools/audio/test-split.mjs` (ffmpeg only: silence splitting, matcher, fx chains).
- Quota plan (100 TTS/day, resets ~07:00 UK): day 1 = name call-outs ~70 + lines 26 = ~96. Failed lines retry
  individually the following day (use `--max-requests` to cap). Transcription calls are not TTS-capped.
- Unverified in real use: whether Gemini leaves >0.9 s gaps for `...  ...`; if batches fail on segment count, try
  `--gap 0.6` or a longer separator before burning retries.
