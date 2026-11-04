#!/usr/bin/env bash
# One caller-owned disposable server and one browser command, in the same shell.
set -u
cd "$(dirname "$0")/.." || exit 1
P=$(~/bin/freeport)
if [ "$P" -lt 18080 ] || [ "$P" -gt 18099 ]; then
 P=$(node -e 'const net=require("net");(async()=>{for(let p=18080;p<18100;p++){if(await new Promise(r=>{const s=net.createServer();s.once("error",()=>r(false));s.listen(p,"127.0.0.1",()=>s.close(()=>r(true)))})){console.log(p);return}}process.exit(1)})()') || exit 1
fi
D=$(mktemp -d /tmp/fixes5-XXXX)
mkdir -p tests/shots/fixes5
LOG="tests/shots/fixes5/$(basename "$1").server.log"
PORT=$P DATA_DIR=$D ADMIN_TOKEN=testtoken node tests/bonfire-server.cjs > "$LOG" 2>&1 & S=$!
trap 'kill "$S" 2>/dev/null; wait "$S" 2>/dev/null' EXIT
for i in {1..100}; do if curl -fsS "http://localhost:$P/" -o /dev/null 2>/dev/null; then break; fi; sleep .1; done
TEST=$1; shift
if [ -n "${FIXES5_TEST_LIMIT:-}" ]; then
 NODE_OPTIONS="--require=$PWD/tests/browser-budget.cjs" timeout --signal=INT --kill-after=10s "$FIXES5_TEST_LIMIT" node "$TEST" "http://localhost:$P" "$@"
else
 NODE_OPTIONS="--require=$PWD/tests/browser-budget.cjs" node "$TEST" "http://localhost:$P" "$@"
fi
C=$?
if grep -qi 'mod failed to load' "$LOG"; then cat "$LOG"; C=1; fi
printf '%s => exit %s (server PID %s, port %s)\n' "$TEST $*" "$C" "$S" "$P"
exit "$C"
