#!/usr/bin/env bash
# Builds a flat copy of the site (no sub-folders) for Cloudflare Pages drag-and-drop uploads.
# Output: ../play-on-display-site   Run from Git Bash:  bash build-cloudflare.sh
set -e
cd "$(dirname "$0")"
OUT="../play-on-display-site"
rm -rf "$OUT"
mkdir -p "$OUT"
cp css/*.css js/*.js index.html play.html table.html icon.svg manifest.webmanifest tv.apk "$OUT"/
# Point the pages at the flat files: "css/x.css" -> "x.css", "./js/x.js" -> "./x.js".
sed -i -E "s#([\"'(])(\./)?(css|js)/#\1\2#g" "$OUT"/*.html
echo "Built $(ls "$OUT" | wc -l) files in $OUT"
