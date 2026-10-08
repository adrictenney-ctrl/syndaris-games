#!/usr/bin/env bash
# Builds the flat site and publishes it straight to playondisplay.com (Cloudflare Worker
# "playondisplay"), then copies the same files to the Dropbox folder. Needs Node.js and a
# one-time "wrangler login".   Run from Git Bash:  bash deploy-cloudflare.sh
set -e
cd "$(dirname "$0")"
bash build-cloudflare.sh
export PATH="/c/Program Files/nodejs:$(cygpath -u "$APPDATA")/npm:$PATH"
wrangler deploy
DEST="/c/Users/adric/Dropbox/Play On Display site"
# Overwrite in place (deleting the folder first fights with Dropbox while it syncs).
if [ -d "$(dirname "$DEST")" ]; then mkdir -p "$DEST" && cp -rf ../play-on-display-site/. "$DEST"/ && echo "Copied to Dropbox"; fi
