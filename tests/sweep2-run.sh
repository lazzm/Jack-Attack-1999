#!/bin/bash
# usage: sweep2-run.sh script.mjs [args]  (run via ~/bin/capped)
P=$(~/bin/freeport); D=$(mktemp -d /tmp/sweep-XXXX)
cd /opt/stacks/landing-qa-sweep2/app && PORT=$P DATA_DIR=$D ADMIN_TOKEN=testtoken node server.js >$D/server.log 2>&1 &
SP=$!
for i in $(seq 40); do curl -s localhost:$P >/dev/null && break; sleep 0.5; done
cd /opt/stacks/landing-qa-sweep2/tests && timeout ${TMO:-900} node "$@" http://localhost:$P
echo "--- server log"; grep -iE "error|fail" $D/server.log | head
kill $SP; sleep 1; rm -rf $D
