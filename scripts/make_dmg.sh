#!/bin/bash
# Electric Eye DMG Packager (High Signal Version)
set -euo pipefail

APP_BUNDLE="ElectricEye.app"
ICON_NAME="electric_eye"
DMG_NAME="electric_eye"
VOLUME_NAME="Electric Eye"
PACKAGE_ROOT="$VOLUME_NAME"
STAGING_DIR=""
TMP_DMG=""
SQUARE_ICON=""

cleanup() {
  rm -rf "$ICON_NAME.iconset" "${STAGING_DIR:-}" "${TMP_DMG:-}" "${SQUARE_ICON:-}"
}

trap cleanup EXIT

echo "Orbital construction initiated..."

# Prepare Icon Asset Catalog
SQUARE_ICON="${TMPDIR:-/tmp}/${ICON_NAME}_source.$$.png"
sips -Z 1024 icon.png --out "$SQUARE_ICON"
sips -p 1024 1024 --padColor 000000 "$SQUARE_ICON" --out "$SQUARE_ICON"

mkdir -p "$ICON_NAME.iconset"
sips -z 16 16     "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_16x16.png"
sips -z 32 32     "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_16x16@2x.png"
sips -z 32 32     "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_32x32.png"
sips -z 64 64     "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_32x32@2x.png"
sips -z 128 128   "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_128x128.png"
sips -z 256 256   "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_128x128@2x.png"
sips -z 256 256   "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_256x256.png"
sips -z 512 512   "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_256x256@2x.png"
sips -z 512 512   "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_512x512.png"
sips -z 1024 1024 "$SQUARE_ICON" --out "$ICON_NAME.iconset/icon_512x512@2x.png"

iconutil -c icns "$ICON_NAME.iconset"
cp "$ICON_NAME.icns" "$APP_BUNDLE/Contents/Resources/" 2>/dev/null || echo "Icon generated (skipping app bundle injection for web-stack)"

# Create distribution DMG
mkdir -p dist
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${DMG_NAME}.XXXXXX")"
TMP_DMG="${TMPDIR:-/tmp}/${DMG_NAME}.$$.dmg"
rm -f "$TMP_DMG"
mkdir -p "$STAGING_DIR/$PACKAGE_ROOT"
rsync -a \
  --exclude ".git" \
  --exclude ".DS_Store" \
  --exclude "dist" \
  --exclude "frontend/node_modules" \
  --exclude "backend/node_modules" \
  ./ "$STAGING_DIR/$PACKAGE_ROOT/"
hdiutil create -volname "$VOLUME_NAME" -srcfolder "$STAGING_DIR/$PACKAGE_ROOT" -ov -format UDZO "$TMP_DMG"
mv "$TMP_DMG" "dist/$DMG_NAME.dmg"

# Cleanup
echo "Deployment package finalized at dist/$DMG_NAME.dmg"
