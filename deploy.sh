#!/bin/sh
# Deploy: copy the working tree (app/) to the served copy (site/), stamp every ?v= with a fresh build id
# so Cloudflare can never mix cached old files with new ones, then restart the container.
# Order matters: Cloudflare caches ?v= URLs for hours, INCLUDING Traefik's 404 while the container restarts.
# So the new index.html (with the new stamps) only goes live once the restarted server answers through Cloudflare.
set -e
cd "$(dirname "$0")"
BUILD="$(node -p "require('./app/package.json').version")-$(date +%y%m%d%H%M%S)"
# the database is sacred: snapshot it before anything changes (the server also keeps its own rolling backups)
mkdir -p data/backups && [ -f data/state.json ] && cp -p data/state.json "data/backups/state-predeploy-$(date +%Y%m%d-%H%M%S).json"
rsync -a --delete --exclude public/index.html app/ site/
if [ "$1" != "--static" ]; then
  docker compose up -d --force-recreate landing >/dev/null
  i=0
  until [ "$(curl -s -o /dev/null -w '%{http_code}' https://jacklm.com/healthz)" = "200" ]; do
    i=$((i+1)); [ $i -gt 90 ] && { echo "server did not come back!"; exit 1; }; sleep 2
  done
  sleep 3
fi
cp app/public/index.html site/public/index.html.new
sed -i -E "s/\?v=[0-9A-Za-z.\-]+/?v=$BUILD/g" site/public/index.html.new
mv site/public/index.html.new site/public/index.html
echo "deployed $BUILD"
