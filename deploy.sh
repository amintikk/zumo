#!/usr/bin/env bash
# Build and publish to the zumo container (~/docker/zumo), served at https://zumo.aminox.dev
set -euo pipefail
cd "$(dirname "$0")"
TARGET="${ZUMO_HTML_DIR:-$HOME/docker/zumo/data/html}"

npm run build
rsync -a --delete --exclude=_headers --exclude=_redirects build/ "$TARGET/"
echo "Publicado en $TARGET"

# Counter service ("zumo en cifras"): copy and restart only if it changed
STATS="${ZUMO_STATS_FILE:-$HOME/docker/zumo/stats/server.mjs}"
if ! cmp -s stats-server/server.mjs "$STATS"; then
  cp stats-server/server.mjs "$STATS"
  docker restart zumo-stats >/dev/null
  echo "Contador actualizado"
fi
