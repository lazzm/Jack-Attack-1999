# House-text identity sweep classification

Baseline: branch `identity-sweep`, before these edits. `rg -n -w 'Jack|Crystal|Dave|Luke|Callum|JackK' app/public/js app/mods` (equivalent to the requested whole-word grep). Counts below are **matching source lines**, not word occurrences. Each line has one primary classification; mixed lines are assigned HOUSE when they contain household-facing fields. Published names on those lines remain fixed. Uppercase/elongated shouts and existing Cast references were also checked separately.

HOUSE = the player's room/HUD, personal prop labels, family speech/records, household borrowed media and cartridge score seeds. ONLINE = Jack's published web/print, era OS/apps/games, credits/brands, authored fiction, shared online players/bots and JackNet content. The supplementary TECH column counts retained comments, fixed Cast identity definitions/compatibility maps, required tab title and excluded owner tooling. These matches are included in HOUSE/ONLINE by context; TECH is not an additional category. Comments were identified with the repository's existing Acorn parser, so multiline document bullets are counted as prose, not code comments.

Judgement calls:
- `cx-*`, all fake pages/forums/homepages, online fixed cast ids, magazine art/copy/credits and Jack brands remain unchanged. No authored bitmap asset was changed.
- `family-files.js` contains the family's own records on their PC; names and player/mate pronouns are household templates. Their internal office document keys and saved/player-authored files are preserved. Static letters, money owed, school/holiday notes and the sister's drawings all belong to this family.
- `family-phone.js` scripted 1999 texts belong to household mates; actual member SMS names/content stay as sent. `mods/sms.js` already derives senders from members, and `mods/story.js` sends progress ids, not names: neither needed edits.
- `ch-cat.js` returns Mom's authored templates to `mods/ch.js`; `ch-core.js` resolves them through the signed-in Cast when displaying feedback. No browser global was added to server-required catalogues and no economy code changed.
- `discs.js` borrowed owners/stickers, cupboard notes, personal borrowing list and drive-side household asides change. Published box reviews, Jack-authored software readmes/credits, built-in game characters and campaigns retain Jack's online cast. Existing borrowed disk/save identifiers remain unchanged.
- Emulated console/PC game text (`rm-g-*`, `pcgames*`, `discs-*`) is the authored game itself, retained under the owner's era-app rule. `rm-tv.js` score seeds representing mates who used the physical cartridges use household identities. Existing saved scores are untouched.
- `reading-books.js`: The Modem Mystery is published fiction with Jack/Dave/Crystal as its characters; those names stay. Personal annotations in the family phone directory and TV guide change. `family-pet.js` is the fake online graveyard's historical entries, retained.
- Hunt HQ, hidden web pages/files, published 1999 Calendar diary and the Hunt's author Jack remain fixed. Only clues that explicitly point at the physical bedroom/poster (`sx.js`, `sx-cat.js`, `mods/sx.js`) use your room.
- `boot.js` name hits are owner decision comments; boot/logon has no authored sentence identifying the player as Jack. Era system/app help and diagnostics are retained under the explicit era-app exclusion.
- `hs-edit.js` was excluded and not edited. No site/data/deploy/docker/version/changelog/git publication work was done.
- A supplementary gender-word check converted Gran’s BEST SON mug and growing-lad line. The mug uses `{me.son}` (daughter for Sarah), fits every letter, and repaints after binding. Game Lad and fictional children/TV characters remain unchanged.
- Landline inspection exposed its modal marker hiding its own dialogue; focus now owns the phone controls, the conversation stays visible, and the held keypad reads upright.
- Personal canvas ink is repainted after account binding; room labels and borrowed owners resolve dynamically. Small-print names are fitted without truncation. Diary objectives remain first person.

Baseline totals: **3059 matching lines** across **265 files**; HOUSE **404**, ONLINE **2655** (including **306** retained technical/comment lines).

| File | Total | HOUSE | ONLINE | Of which technical, retained |
| --- | ---: | ---: | ---: | ---: |
| `app/mods/arena.js` | 5 | 0 | 5 | 1 |
| `app/mods/ch.js` | 1 | 1 | 0 | 1 |
| `app/mods/cx.js` | 1 | 0 | 1 | 0 |
| `app/mods/econ.js` | 7 | 0 | 7 | 2 |
| `app/mods/events.js` | 2 | 0 | 2 | 1 |
| `app/mods/ex.js` | 1 | 0 | 1 | 0 |
| `app/mods/homepages.js` | 1 | 0 | 1 | 1 |
| `app/mods/hs.js` | 1 | 0 | 1 | 1 |
| `app/mods/jackbox.js` | 5 | 0 | 5 | 5 |
| `app/mods/jw.js` | 2 | 0 | 2 | 1 |
| `app/mods/lan.js` | 2 | 0 | 2 | 0 |
| `app/mods/lk.js` | 3 | 0 | 3 | 2 |
| `app/mods/loot.js` | 1 | 0 | 1 | 0 |
| `app/mods/md-people.js` | 34 | 0 | 34 | 0 |
| `app/mods/md-rooms.js` | 16 | 0 | 16 | 0 |
| `app/mods/md-world.js` | 12 | 0 | 12 | 0 |
| `app/mods/md.js` | 1 | 0 | 1 | 1 |
| `app/mods/pmx.js` | 1 | 0 | 1 | 1 |
| `app/mods/rm.js` | 1 | 0 | 1 | 1 |
| `app/mods/sx.js` | 3 | 2 | 1 | 0 |
| `app/public/js/app.js` | 5 | 0 | 5 | 1 |
| `app/public/js/apps-carta.js` | 2 | 0 | 2 | 0 |
| `app/public/js/apps-dos.js` | 53 | 0 | 53 | 5 |
| `app/public/js/apps-econ.js` | 20 | 0 | 20 | 2 |
| `app/public/js/apps-files.js` | 194 | 0 | 194 | 3 |
| `app/public/js/apps-fun.js` | 55 | 0 | 55 | 2 |
| `app/public/js/apps-games.js` | 19 | 0 | 19 | 1 |
| `app/public/js/apps-office.js` | 18 | 0 | 18 | 4 |
| `app/public/js/apps-programs.js` | 60 | 0 | 60 | 2 |
| `app/public/js/apps-social.js` | 6 | 0 | 6 | 0 |
| `app/public/js/apps-solitaire.js` | 16 | 0 | 16 | 2 |
| `app/public/js/apps-system.js` | 10 | 0 | 10 | 1 |
| `app/public/js/apps-web.js` | 14 | 0 | 14 | 2 |
| `app/public/js/apps-zone.js` | 10 | 0 | 10 | 1 |
| `app/public/js/apps.js` | 5 | 0 | 5 | 0 |
| `app/public/js/arcade.js` | 2 | 0 | 2 | 0 |
| `app/public/js/boot.js` | 2 | 0 | 2 | 2 |
| `app/public/js/bridge-dl-web.js` | 5 | 0 | 5 | 2 |
| `app/public/js/bridge-dl.js` | 1 | 0 | 1 | 0 |
| `app/public/js/bridge.js` | 7 | 0 | 7 | 0 |
| `app/public/js/calendar.js` | 14 | 0 | 14 | 0 |
| `app/public/js/carta-articles-a.js` | 3 | 0 | 3 | 0 |
| `app/public/js/carta-articles-b.js` | 6 | 0 | 6 | 0 |
| `app/public/js/carta-cd.js` | 1 | 0 | 1 | 0 |
| `app/public/js/carta-encyc.js` | 5 | 0 | 5 | 0 |
| `app/public/js/carta-mplayer.js` | 6 | 0 | 6 | 1 |
| `app/public/js/carta-stamp.js` | 1 | 0 | 1 | 0 |
| `app/public/js/carta-typing.js` | 4 | 0 | 4 | 0 |
| `app/public/js/cast.js` | 17 | 0 | 17 | 17 |
| `app/public/js/ch-bed.js` | 1 | 1 | 0 | 0 |
| `app/public/js/ch-cat.js` | 6 | 6 | 0 | 5 |
| `app/public/js/ch-core.js` | 7 | 7 | 0 | 3 |
| `app/public/js/ch-out.js` | 1 | 1 | 0 | 0 |
| `app/public/js/ch.js` | 6 | 3 | 3 | 3 |
| `app/public/js/cx-mag-a.js` | 65 | 0 | 65 | 0 |
| `app/public/js/cx-mag-b.js` | 52 | 0 | 52 | 0 |
| `app/public/js/cx-mag.js` | 7 | 0 | 7 | 1 |
| `app/public/js/cx-web-a.js` | 7 | 0 | 7 | 0 |
| `app/public/js/cx-web-b.js` | 4 | 0 | 4 | 0 |
| `app/public/js/desk.js` | 1 | 0 | 1 | 0 |
| `app/public/js/discs-boss.js` | 49 | 0 | 49 | 3 |
| `app/public/js/discs-city.js` | 39 | 0 | 39 | 3 |
| `app/public/js/discs-keepa.js` | 24 | 0 | 24 | 1 |
| `app/public/js/discs-park.js` | 25 | 0 | 25 | 1 |
| `app/public/js/discs-rts.js` | 39 | 0 | 39 | 1 |
| `app/public/js/discs-squigs.js` | 20 | 0 | 20 | 2 |
| `app/public/js/discs.js` | 58 | 27 | 31 | 3 |
| `app/public/js/dos-basic.js` | 3 | 0 | 3 | 1 |
| `app/public/js/dos-core.js` | 1 | 0 | 1 | 1 |
| `app/public/js/dos-games.js` | 11 | 0 | 11 | 1 |
| `app/public/js/dos-progs.js` | 19 | 0 | 19 | 2 |
| `app/public/js/dos-quest.js` | 30 | 0 | 30 | 1 |
| `app/public/js/dos-shell.js` | 38 | 0 | 38 | 2 |
| `app/public/js/econ-cat.js` | 6 | 0 | 6 | 2 |
| `app/public/js/econ-desk.js` | 2 | 0 | 2 | 2 |
| `app/public/js/econ-fun.js` | 3 | 0 | 3 | 0 |
| `app/public/js/econ-mkt.js` | 3 | 0 | 3 | 1 |
| `app/public/js/econ-town.js` | 4 | 0 | 4 | 1 |
| `app/public/js/econ-web.js` | 13 | 0 | 13 | 0 |
| `app/public/js/era-apps-ball.js` | 7 | 0 | 7 | 1 |
| `app/public/js/era-apps-dodgy.js` | 10 | 0 | 10 | 1 |
| `app/public/js/era-apps-dodgy2.js` | 15 | 0 | 15 | 1 |
| `app/public/js/era-apps-dodgy3.js` | 1 | 0 | 1 | 0 |
| `app/public/js/era-apps-media.js` | 13 | 0 | 13 | 1 |
| `app/public/js/era-apps-revenge.js` | 2 | 0 | 2 | 0 |
| `app/public/js/era-apps-savers.js` | 2 | 0 | 2 | 2 |
| `app/public/js/era-apps-seti.js` | 4 | 0 | 4 | 0 |
| `app/public/js/era-apps-staples.js` | 7 | 0 | 7 | 0 |
| `app/public/js/era-apps-sweep.js` | 2 | 0 | 2 | 0 |
| `app/public/js/era-apps.js` | 45 | 0 | 45 | 4 |
| `app/public/js/era-sites-bay.js` | 3 | 0 | 3 | 0 |
| `app/public/js/era-sites-dodgy.js` | 4 | 0 | 4 | 0 |
| `app/public/js/era-sites-fan.js` | 4 | 0 | 4 | 0 |
| `app/public/js/era-sites-fan2.js` | 5 | 0 | 5 | 0 |
| `app/public/js/era-sites-faq.js` | 17 | 0 | 17 | 0 |
| `app/public/js/era-sites-grotdot.js` | 4 | 0 | 4 | 1 |
| `app/public/js/era-sites-witch.js` | 3 | 0 | 3 | 0 |
| `app/public/js/era-sites.js` | 3 | 0 | 3 | 0 |
| `app/public/js/events-cat.js` | 5 | 0 | 5 | 1 |
| `app/public/js/events-guide.js` | 2 | 0 | 2 | 0 |
| `app/public/js/events-radio.js` | 7 | 0 | 7 | 1 |
| `app/public/js/events.js` | 6 | 0 | 6 | 1 |
| `app/public/js/ex-bay.js` | 1 | 0 | 1 | 0 |
| `app/public/js/ex-cat.js` | 5 | 0 | 5 | 1 |
| `app/public/js/ex-clash.js` | 2 | 0 | 2 | 1 |
| `app/public/js/ex-cup.js` | 3 | 0 | 3 | 0 |
| `app/public/js/ex-duel.js` | 5 | 0 | 5 | 5 |
| `app/public/js/ex-jobs.js` | 1 | 0 | 1 | 0 |
| `app/public/js/ex-shop.js` | 6 | 0 | 6 | 0 |
| `app/public/js/ex.js` | 5 | 0 | 5 | 1 |
| `app/public/js/family-files.js` | 125 | 125 | 0 | 2 |
| `app/public/js/family-pet.js` | 2 | 0 | 2 | 0 |
| `app/public/js/family-phone.js` | 27 | 27 | 0 | 2 |
| `app/public/js/family-print.js` | 1 | 1 | 0 | 0 |
| `app/public/js/family.js` | 13 | 13 | 0 | 5 |
| `app/public/js/flash.js` | 1 | 0 | 1 | 0 |
| `app/public/js/games-cards.js` | 16 | 0 | 16 | 4 |
| `app/public/js/games-chess.js` | 15 | 0 | 15 | 2 |
| `app/public/js/games-cube.js` | 6 | 0 | 6 | 1 |
| `app/public/js/games-grotlings.js` | 1 | 0 | 1 | 0 |
| `app/public/js/games-mahjong.js` | 9 | 0 | 9 | 1 |
| `app/public/js/games-pinball.js` | 7 | 0 | 7 | 1 |
| `app/public/js/games-pipe.js` | 6 | 0 | 6 | 1 |
| `app/public/js/games-podracer.js` | 7 | 0 | 7 | 1 |
| `app/public/js/games-puzzle.js` | 10 | 0 | 10 | 0 |
| `app/public/js/games-reversi.js` | 1 | 0 | 1 | 0 |
| `app/public/js/games-ski.js` | 3 | 0 | 3 | 0 |
| `app/public/js/grind-cat.js` | 3 | 0 | 3 | 0 |
| `app/public/js/grind-games-b.js` | 6 | 0 | 6 | 6 |
| `app/public/js/grind-hunt.js` | 1 | 0 | 1 | 0 |
| `app/public/js/grind-jobs.js` | 2 | 0 | 2 | 0 |
| `app/public/js/grind-rank.js` | 1 | 0 | 1 | 0 |
| `app/public/js/grind.js` | 1 | 0 | 1 | 0 |
| `app/public/js/guest.js` | 1 | 0 | 1 | 0 |
| `app/public/js/homepages-builder.js` | 2 | 0 | 2 | 0 |
| `app/public/js/homepages.js` | 1 | 0 | 1 | 0 |
| `app/public/js/hs-art.js` | 3 | 3 | 0 | 2 |
| `app/public/js/hs-edit.js` | 1 | 1 | 0 | 1 |
| `app/public/js/hs-environment.js` | 1 | 1 | 0 | 1 |
| `app/public/js/hs-house.js` | 9 | 9 | 0 | 6 |
| `app/public/js/hs-kit.js` | 1 | 1 | 0 | 1 |
| `app/public/js/hs-life.js` | 31 | 31 | 0 | 2 |
| `app/public/js/hs-mobile.js` | 10 | 10 | 0 | 1 |
| `app/public/js/hs-telly.js` | 1 | 1 | 0 | 0 |
| `app/public/js/hs-world.js` | 3 | 3 | 0 | 3 |
| `app/public/js/icons.js` | 5 | 0 | 5 | 1 |
| `app/public/js/ie.js` | 4 | 0 | 4 | 1 |
| `app/public/js/jackbox.js` | 5 | 0 | 5 | 2 |
| `app/public/js/jacktris.js` | 1 | 0 | 1 | 1 |
| `app/public/js/jsn-msgr.js` | 1 | 0 | 1 | 0 |
| `app/public/js/jsn-portal.js` | 5 | 0 | 5 | 0 |
| `app/public/js/jw-cat.js` | 9 | 0 | 9 | 0 |
| `app/public/js/jw-web.js` | 1 | 0 | 1 | 0 |
| `app/public/js/lan-ui.js` | 3 | 0 | 3 | 0 |
| `app/public/js/lan.js` | 3 | 0 | 3 | 2 |
| `app/public/js/leapday-x.js` | 2 | 0 | 2 | 0 |
| `app/public/js/leapday.js` | 3 | 0 | 3 | 2 |
| `app/public/js/loot-cat.js` | 10 | 0 | 10 | 0 |
| `app/public/js/loot-chest.js` | 1 | 0 | 1 | 0 |
| `app/public/js/loot-web.js` | 2 | 0 | 2 | 0 |
| `app/public/js/loot.js` | 2 | 0 | 2 | 0 |
| `app/public/js/magazine-cat.js` | 72 | 0 | 72 | 0 |
| `app/public/js/magazines.js` | 1 | 0 | 1 | 0 |
| `app/public/js/mail-gen.js` | 2 | 0 | 2 | 2 |
| `app/public/js/mail-tpl-a.js` | 18 | 0 | 18 | 1 |
| `app/public/js/mail-tpl-b.js` | 7 | 0 | 7 | 0 |
| `app/public/js/mail-tpl-c.js` | 3 | 0 | 3 | 0 |
| `app/public/js/md-apps.js` | 2 | 0 | 2 | 0 |
| `app/public/js/md-web.js` | 11 | 0 | 11 | 0 |
| `app/public/js/md.js` | 4 | 0 | 4 | 0 |
| `app/public/js/mp.js` | 7 | 0 | 7 | 1 |
| `app/public/js/news99-a.js` | 34 | 0 | 34 | 0 |
| `app/public/js/news99-b.js` | 42 | 0 | 42 | 1 |
| `app/public/js/news99.js` | 14 | 0 | 14 | 2 |
| `app/public/js/office-docs.js` | 50 | 0 | 50 | 1 |
| `app/public/js/office-pim.js` | 12 | 0 | 12 | 1 |
| `app/public/js/office-sheet.js` | 2 | 0 | 2 | 0 |
| `app/public/js/office-term.js` | 4 | 0 | 4 | 0 |
| `app/public/js/office-tools.js` | 6 | 0 | 6 | 0 |
| `app/public/js/office-wordpad.js` | 6 | 0 | 6 | 0 |
| `app/public/js/oldpc.js` | 1 | 0 | 1 | 0 |
| `app/public/js/pcgames-arena.js` | 18 | 0 | 18 | 1 |
| `app/public/js/pcgames-jaquake.js` | 21 | 0 | 21 | 5 |
| `app/public/js/pcgames-jrt.js` | 52 | 0 | 52 | 8 |
| `app/public/js/pcgames-spy.js` | 9 | 0 | 9 | 0 |
| `app/public/js/pcgames.js` | 35 | 0 | 35 | 0 |
| `app/public/js/pm-art.js` | 2 | 2 | 0 | 2 |
| `app/public/js/pm-cat.js` | 4 | 2 | 2 | 2 |
| `app/public/js/pm-gl.js` | 6 | 6 | 0 | 2 |
| `app/public/js/pm-media.js` | 12 | 11 | 1 | 2 |
| `app/public/js/rclick.js` | 3 | 0 | 3 | 0 |
| `app/public/js/reading-books.js` | 6 | 2 | 4 | 0 |
| `app/public/js/rm-3d.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-bits.js` | 11 | 10 | 1 | 2 |
| `app/public/js/rm-cat.js` | 22 | 22 | 0 | 2 |
| `app/public/js/rm-g-blocks.js` | 2 | 2 | 0 | 2 |
| `app/public/js/rm-g-dash.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-duel.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-fight.js` | 2 | 1 | 1 | 1 |
| `app/public/js/rm-g-fightkit.js` | 3 | 3 | 0 | 3 |
| `app/public/js/rm-g-grab.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-grav.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-hop.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-kart.js` | 2 | 1 | 1 | 1 |
| `app/public/js/rm-g-mon.js` | 5 | 5 | 0 | 5 |
| `app/public/js/rm-g-party.js` | 2 | 2 | 0 | 2 |
| `app/public/js/rm-g-plumb.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-racekit.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-rage.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-range.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-run.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-g-scrap.js` | 2 | 2 | 0 | 2 |
| `app/public/js/rm-g-sneak.js` | 3 | 3 | 0 | 3 |
| `app/public/js/rm-g-taxi.js` | 3 | 2 | 1 | 2 |
| `app/public/js/rm-g-teeny.js` | 3 | 3 | 0 | 3 |
| `app/public/js/rm-g-toy.js` | 3 | 2 | 1 | 2 |
| `app/public/js/rm-g-zeldo.js` | 4 | 4 | 0 | 4 |
| `app/public/js/rm-g-zero.js` | 5 | 4 | 1 | 4 |
| `app/public/js/rm-g-zip.js` | 1 | 1 | 0 | 1 |
| `app/public/js/rm-room.js` | 15 | 15 | 0 | 4 |
| `app/public/js/rm-tv.js` | 4 | 4 | 0 | 3 |
| `app/public/js/seasons-days.js` | 17 | 0 | 17 | 0 |
| `app/public/js/seasons-disc.js` | 13 | 0 | 13 | 0 |
| `app/public/js/seasons-y2k.js` | 1 | 0 | 1 | 0 |
| `app/public/js/seasons.js` | 13 | 0 | 13 | 2 |
| `app/public/js/setup-centre.js` | 6 | 0 | 6 | 0 |
| `app/public/js/setup-shack.js` | 10 | 0 | 10 | 0 |
| `app/public/js/setup.js` | 33 | 0 | 33 | 0 |
| `app/public/js/share-cards.js` | 1 | 0 | 1 | 0 |
| `app/public/js/share-cat.js` | 1 | 0 | 1 | 0 |
| `app/public/js/share-web.js` | 7 | 0 | 7 | 0 |
| `app/public/js/share.js` | 6 | 0 | 6 | 0 |
| `app/public/js/site-comics.js` | 39 | 0 | 39 | 5 |
| `app/public/js/site-data.js` | 31 | 0 | 31 | 2 |
| `app/public/js/site-hangout.js` | 2 | 0 | 2 | 1 |
| `app/public/js/site.js` | 27 | 0 | 27 | 4 |
| `app/public/js/social-irc.js` | 7 | 0 | 7 | 0 |
| `app/public/js/social-more.js` | 3 | 0 | 3 | 0 |
| `app/public/js/st-diary.js` | 7 | 7 | 0 | 1 |
| `app/public/js/sx-cat.js` | 5 | 2 | 3 | 0 |
| `app/public/js/sx-dos.js` | 4 | 0 | 4 | 0 |
| `app/public/js/sx-eggs.js` | 11 | 0 | 11 | 0 |
| `app/public/js/sx-hunt.js` | 18 | 0 | 18 | 0 |
| `app/public/js/sx-tracker.js` | 1 | 0 | 1 | 0 |
| `app/public/js/sx.js` | 14 | 1 | 13 | 1 |
| `app/public/js/system-help.js` | 62 | 0 | 62 | 0 |
| `app/public/js/system-progs.js` | 20 | 0 | 20 | 0 |
| `app/public/js/system-themes.js` | 2 | 0 | 2 | 0 |
| `app/public/js/system-welcome.js` | 21 | 0 | 21 | 0 |
| `app/public/js/timeline.js` | 26 | 0 | 26 | 2 |
| `app/public/js/title.js` | 2 | 0 | 2 | 2 |
| `app/public/js/toolbars-bars.js` | 7 | 0 | 7 | 0 |
| `app/public/js/web-engines-p.js` | 17 | 0 | 17 | 1 |
| `app/public/js/web-engines.js` | 11 | 0 | 11 | 4 |
| `app/public/js/web-p1.js` | 36 | 0 | 36 | 3 |
| `app/public/js/web-p2.js` | 48 | 0 | 48 | 0 |
| `app/public/js/web-p3.js` | 29 | 0 | 29 | 0 |
| `app/public/js/web-p4.js` | 48 | 0 | 48 | 3 |
| `app/public/js/web-p5.js` | 11 | 0 | 11 | 0 |
| `app/public/js/web-p6.js` | 27 | 0 | 27 | 2 |
| `app/public/js/web-p7.js` | 22 | 0 | 22 | 0 |
| `app/public/js/web-search.js` | 7 | 0 | 7 | 1 |
| `app/public/js/zone-core.js` | 1 | 0 | 1 | 0 |
| `app/public/js/zone-games.js` | 3 | 0 | 3 | 2 |
| `app/public/js/zone-site.js` | 24 | 0 | 24 | 2 |

Changed implementation files:

- `app/mods/sx.js` — physical-bedroom hints; Hunt authorship retained
- `app/public/js/ch-bed.js` — player’s chore thoughts
- `app/public/js/ch-cat.js` — Mom’s server-safe feedback templates
- `app/public/js/ch-core.js` — personalised Mom/inner-voice display
- `app/public/js/ch-out.js` — mate’s car-wash lettering
- `app/public/js/discs.js` — borrowed owners, stickers and cupboard notes
- `app/public/js/family-files.js` — household records, names and pronouns
- `app/public/js/family-phone.js` — scripted household SMS and phone title
- `app/public/js/family-print.js` — personal print-job owner fallback
- `app/public/js/family.js` — personal phone labels and file authors
- `app/public/js/hs-art.js` — personal photo caption
- `app/public/js/hs-house.js` — sister’s sign and house clues
- `app/public/js/hs-kit.js` — repaint personal ink after account binding
- `app/public/js/hs-life.js` — family voices, phone dialogue and fridge notes
- `app/public/js/hs-mobile.js` — personal phone prop and notifications
- `app/public/js/hs-telly.js` — personal home-video subtitle
- `app/public/js/hs-world.js` — generic pre-logon house heading
- `app/public/js/magazines.js` — resolve household directory annotations on paper
- `app/public/js/pm-art.js` — personal handwritten media/envelope artwork
- `app/public/js/pm-gl.js` — parcel addressee and refreshed personal SVG print
- `app/public/js/pm-media.js` — visiting mates, disks and parcel announcements
- `app/public/js/reading-books.js` — household directory/TV-guide annotations
- `app/public/js/rm-bits.js` — letters, cork board and treasure tin
- `app/public/js/rm-cat.js` — borrowed cartridge owners and house finds
- `app/public/js/rm-room.js` — named HUD, Dad’s note, mug and personal print
- `app/public/js/rm-tv.js` — house mates’ cartridge score seeds
- `app/public/js/st-diary.js` — personal diary titles and cover/page lettering
- `app/public/js/sx-cat.js` — physical-bedroom clue labels
- `app/public/js/sx.js` — physical-bedroom hints; Hunt authorship retained

Verification commands and final results:

- `node tests/identity-house.mjs` => exit 0; Sarah, non-owner Jack, owner Jack, fixed online cast, actual printed textures, visible landline, phone policy and refresh. Default runner starts a new Chromium process and throwaway server for each case.
- `node tests/identity-house.mjs --case=sarah` => exit 0; latest follow-up includes Gran’s daughter mug and corrected glide/resize captures.
- `node tests/identity-house.mjs --case=nonowner` => exit 0.
- `node tests/identity-house.mjs --case=owner` => exit 0.
- `SMOKE_SCALE=3 node tests/smoke.mjs` => exit 0; 12/12 passed. The polling helper now honours its documented scale; default timing is unchanged.
- `node tests/story-ch1.mjs http://127.0.0.1:18089` => exit 0, run by `/tmp/identity-story-run.mjs` with its own normal throwaway server, PID-based shutdown and no failed server mods. Only that runner’s temporary data directory was retained after automatic review rejected a shell cleanup using `rm -rf`; no live data was accessed.
- All 31 touched JavaScript/test files passed `node --check` individually; `git diff --check` => exit 0.

Earlier exploratory failures were corrected: a pre-logon placeholder captured into the HUD, an early HUD callback guard, and test interaction while the camera was frozen for a screenshot. Shared-browser combined trials were terminated by the environment; the passing runner isolates each renderer. The first smoke trial exposed the callback guard and an unscaled eight-second polling helper; its final rerun passed every check.

Captures inspected under `tests/shots/identity-house/`: Sarah HUD and Mom line; Dad’s handwriting; Gran’s daughter mug; physical diary/cover/pages; parcel label and in-world close-up; mobile LCD; fridge; 1366x860/1024x768 desktop; 390x844/844x390 JackOS; owner/non-owner Jack bedrooms and named, visible landline replies. `tests/shots/story/` contains the required story regression’s captures.

Not verified: physical hardware/gamepads and exhaustive every-date/every-dialogue traversal. No deployment, commit, push, Docker, production data, version, changelog or AGENTS.md changes. `hs-edit.js` remains untouched.
