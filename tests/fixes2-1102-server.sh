#!/usr/bin/env bash
# Start server and browser command in one shell; never use live data.
set -eu
cd "$(dirname "$0")/.."
fix_data=$(mktemp -d /tmp/jhp-fixes2-1102-XXXXXX)
fix_port=18098
fix_log="tests/shots/fixes2-1102/server-$(date +%s).log"
mkdir -p tests/shots/fixes2-1102
if ss -ltn | rg -q ":${fix_port} "; then echo "Port ${fix_port} occupied"; exit 1; fi
(cd app && PORT="$fix_port" DATA_DIR="$fix_data" ADMIN_TOKEN=testtoken exec node server.js) >"$fix_log" 2>&1 &
fix_pid=$!
trap 'kill "$fix_pid" 2>/dev/null || true; wait "$fix_pid" 2>/dev/null || true; rm -rf "$fix_data"' EXIT
for i in {1..100}; do if curl -fsS "http://localhost:$fix_port/robots.txt" >/dev/null 2>&1; then break; fi; sleep .2; done
fix_result=0
timeout 1800 node "tests/$1" "http://localhost:$fix_port" "${@:2}" || fix_result=$?
if rg -n 'mod failed to load|jw: furni check' "$fix_log"; then exit 1; fi
exit "$fix_result"
