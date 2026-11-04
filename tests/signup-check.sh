#!/bin/bash
# All writes are confined to the checkout's screenshots and a disposable /tmp server.
set -u
export PW_TEST_SCREENSHOT_NO_FONTS_READY=1
cd "$(dirname "$0")/.."
mkdir -p tests/shots/signup/checks
CASE=${1:?Supply units, syntax, parody, signup, story, owner, mobile, onboard, arrival, popups or readonly}
if [ "$CASE" = units ]; then
  RESULT=0
  for file in tests/*-unit.cjs; do
    node "$file" >"tests/shots/signup/checks/$(basename "$file").log" 2>&1
    CODE=$?
    printf '%s => exit %s\n' "node $file" "$CODE"
    if [ "$CODE" != 0 ]; then RESULT=1; fi
  done
  exit "$RESULT"
fi
if [ "$CASE" = syntax ]; then
  RESULT=0
  while IFS= read -r file; do
    case "$file" in *.js|*.mjs|*.cjs) node --check "$file" || RESULT=1;; esac
  done < <(git diff --name-only; printf '%s\n' tests/signup-flow.mjs tests/signup-server.cjs)
  exit "$RESULT"
fi
if [ "$CASE" = parody ]; then exec node --expose-internals tests/parody-audit.cjs; fi
# freeport can return outside the worker's allowed range; probe that range in that case.
P=$(~/bin/freeport)
if [ "$P" -lt 18080 ] || [ "$P" -gt 18099 ]; then
  P=$(node -e 'const net=require("net");(async()=>{for(let p=18080;p<=18099;p++){const s=net.createServer();try{await new Promise((r,j)=>{s.once("error",j);s.listen(p,"127.0.0.1",r)});await new Promise(r=>s.close(r));console.log(p);return}catch{}}process.exit(1)})()')
fi
DATA=$(mktemp -d /tmp/jhp-signup-check-XXXXXX)
SERVER_PID=''
trap 'if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; fi' EXIT
URL=http://127.0.0.1:$P
start_server() {
  PORT=$P DATA_DIR=$DATA ADMIN_TOKEN=testtoken node "$1" >"tests/shots/signup/checks/$CASE-server.log" 2>&1 &
  SERVER_PID=$!
  for i in {1..80}; do if ! kill -0 "$SERVER_PID" 2>/dev/null; then echo "Our server exited"; exit 1; fi; if curl -fsS "$URL" -o /dev/null 2>/dev/null; then return; fi; sleep .1; done
  echo 'Server did not start'; exit 1
}
if [[ "$CASE" = signup* ]]; then
  start_server tests/signup-server.cjs
  node - "$URL" <<'JS'
const base=process.argv[2];fetch(base+'/admin/register',{method:'POST',headers:{'x-admin-token':'testtoken','content-type':'application/json'},body:JSON.stringify({name:'OldCodePlayer',pass:'Old-Code-Only-1999'})}).then(r=>{if(!r.ok)process.exit(1);console.log('Created legacy fixture using original server source')});
JS
  kill "$SERVER_PID"; wait "$SERVER_PID"; SERVER_PID=''
  # Compare hashes privately after the new UI has used the account. Never print them.
  node - "$DATA" <<'JS'
const fs=require('node:fs'),path=require('node:path'),dir=process.argv[2];const m=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8')).members.oldcodeplayer;fs.writeFileSync(path.join(dir,'legacy-fingerprint.json'),JSON.stringify({hash:m.hash,salt:m.salt,created:m.created}),{mode:0o600});
JS
fi
start_server tests/bonfire-server.cjs
case "$CASE" in
 identity-edit) node tests/signup-flow.mjs "$URL" identity-edit --identity-only;;
 journey) node tests/signup-flow.mjs "$URL" after-preview --journey-only;;
 baseline) node tests/signup-flow.mjs "$URL" before --journey-only;;
 baseline-full) node tests/signup-flow.mjs "$URL" before --skip-extras;;
 baseline-phone) node tests/signup-flow.mjs "$URL" before --devices=phone --skip-extras;;
 signup) SIGNUP_LEGACY=1 node tests/signup-flow.mjs "$URL" after;;
 signup-fallback) SIGNUP_LEGACY=1 node tests/signup-flow.mjs "$URL" after-fallback --fallback-only;;
 signup-extras) SIGNUP_LEGACY=1 node tests/signup-flow.mjs "$URL" after-extras --extras-only;;
 story) node tests/story-ch1.mjs "$URL";;
 owner) node tests/owner-tools.mjs "$URL";;
 mobile) node tests/mobile.mjs "$URL" --only=gate,story;;
 onboard) node tests/onboard.mjs "$URL" after phone;;
 arrival) node tests/onboard-arrival.mjs "$URL" 11-03 && node tests/onboard-arrival.mjs "$URL" 06-14;;
 popups) node tests/onboard-popups.mjs "$URL";;
 readonly) (cd tests && node live-readonly.mjs "$URL");;
 *) echo "Unknown check: $CASE"; exit 2;;
esac
RESULT=$?
if [[ "$CASE" = signup* ]]; then
  kill "$SERVER_PID"; wait "$SERVER_PID"; SERVER_PID=''
  node - "$DATA" <<'JS'
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),dir=process.argv[2];const m=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8')).members.oldcodeplayer,old=JSON.parse(fs.readFileSync(path.join(dir,'legacy-fingerprint.json'),'utf8'));for(const k of ['hash','salt','created'])assert.equal(m[k],old[k]);console.log('Legacy password hash, salt and creation record preserved');
JS
  if [ "$?" != 0 ]; then RESULT=1; fi
fi
if grep -qi 'mod failed to load' "tests/shots/signup/checks/$CASE-server.log"; then echo 'FAIL: mod failed to load'; RESULT=1; fi
printf 'bash tests/signup-check.sh %s\t%s\n' "$CASE" "$RESULT" >> tests/shots/signup/checks/results.tsv
exit "$RESULT"
