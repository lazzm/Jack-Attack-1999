# Jack Attack 1999 - browser tests

Playwright scripts that drive the real site in Chromium (uses the system browser at `/usr/bin/chromium`, no download).

    cd tests && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install

Start a throwaway dev server (never point tests at live data you care about):

    cd app && npm install && PORT=18080 DATA_DIR=/tmp/jhp-test ADMIN_TOKEN=testtoken node server.js

Then run a script with the base URL (or port) it expects, e.g.

    node smoke3.mjs http://localhost:18080     # main areas, desktop + phone
    node integ.mjs 18080                       # the big all-in-one (boot, logon, many programs, fake web)
    node standwake.mjs                         # refresh at the PC then stand up (edit the URL inside)
    node pcmouse.mjs                           # the desktop keeps the mouse after switching on from the room

Most print `no errors` / `NO ERRORS` when they pass. Screenshots go in `shots/` (git-ignored).
Some scripts have a hard-coded URL or port near the top: check before running. On the server they are run under
`systemd-run --user --scope -p MemoryMax=3G -p MemorySwapMax=0 -q node <script>` to cap memory.
