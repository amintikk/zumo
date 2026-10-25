#!/usr/bin/env bash
# Build and publish to the zumo container (~/docker/zumo), served at https://zumo.aminox.dev
set -euo pipefail
cd "$(dirname "$0")"
TARGET="${ZUMO_HTML_DIR:-$HOME/docker/zumo/data/html}"

npm run build
rsync -a --delete --exclude=_headers --exclude=_redirects build/ "$TARGET/"
echo "Publicado en $TARGET"
