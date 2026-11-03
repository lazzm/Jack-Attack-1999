#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
for file in app/mods/roam.js app/public/js/{ch-out,hs-environment,hs-house,hs-life,rm-g-fight,rm-room,rm-tv,roam,site}.js tests/{roam-sync-unit,fixes3-unit,neighbourhood-geometry}.cjs tests/fixes3-{art,geometry,pads}.mjs; do
 node --check "$file"
done
bash -n tests/fixes3-server.sh
node tests/roam-sync-unit.cjs
node tests/fixes3-unit.cjs
node tests/fixes3-geometry.mjs
node tests/neighbourhood-geometry.cjs
node tests/owner-tools-unit.cjs
node tests/fixes2-1102-unit.cjs
node --expose-internals tests/parody-audit.cjs
git diff --check
