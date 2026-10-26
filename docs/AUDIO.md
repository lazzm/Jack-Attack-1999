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
