#!/usr/bin/env bash
# Build, sign, and notarize Buddy desktop app for macOS.
# Requires: Apple Developer ID Application cert, App Store Connect API Key (.p8), and env vars below.

set -e

# Script dir and load .env.signing
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
if [[ -f "$SCRIPT_DIR/.env.signing" ]]; then
  set -a
  source "$SCRIPT_DIR/.env.signing"
  set +a
fi

# --- Config (override via env) ---
APPLE_ISSUER_ID="${APPLE_ISSUER_ID:-e2ea14e8-55fa-434b-b8a3-8e9ddd3d0742}"
APPLE_KEY_ID="${APPLE_KEY_ID:-PR88795KN9}"
# APPLE_API_KEY_PATH = path to your .p8 key file (absolute or relative to desktop/)
# SIGN_IDENTITY = "Developer ID Application: Your Name (TEAM_ID)"

# Resolve relative APPLE_API_KEY_PATH to script dir
if [[ -n "$APPLE_API_KEY_PATH" ]] && [[ "$APPLE_API_KEY_PATH" != /* ]]; then
  APPLE_API_KEY_PATH="$SCRIPT_DIR/$APPLE_API_KEY_PATH"
fi

APP_NAME="Buddy"
BUILD_DIR="build/bin"
APP_PATH="${BUILD_DIR}/${APP_NAME}.app"
DMG_NAME="${APP_NAME}.dmg"
# Notarization: Apple accepts .dmg, .pkg, .zip (not .deb — .deb is Linux only)
SUBMIT_ARTIFACT="$DMG_NAME"

echo "=== Buddy macOS Build, Sign & Notarize ==="

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: This script must run on macOS."
  exit 1
fi

if [[ -z "$APPLE_API_KEY_PATH" ]]; then
  echo "Error: APPLE_API_KEY_PATH is not set."
  echo "Set it in desktop/.env.signing, e.g.: export APPLE_API_KEY_PATH=\"/path/to/AuthKey_xxx.p8\""
  exit 1
fi
if [[ ! -f "$APPLE_API_KEY_PATH" ]]; then
  echo "Error: App Store Connect API key file not found: $APPLE_API_KEY_PATH"
  echo "Check APPLE_API_KEY_PATH in desktop/.env.signing (use absolute path or path relative to desktop/)."
  exit 1
fi

if [[ -z "$SIGN_IDENTITY" ]]; then
  echo "Error: SIGN_IDENTITY must be set to your 'Developer ID Application' certificate name."
  echo "Example: export SIGN_IDENTITY=\"Developer ID Application: Buddy Team (XXXXXXXX)\""
  echo "Find it in Keychain Access or run: security find-identity -v -p codesigning"
  exit 1
fi

# Notarization requires "Developer ID Application" (not Apple Development / Mac Developer)
if [[ "$SIGN_IDENTITY" != *"Developer ID Application"* ]]; then
  echo "Error: Notarization requires a 'Developer ID Application' certificate."
  echo "Your SIGN_IDENTITY is: $SIGN_IDENTITY"
  echo ""
  echo "Create one at: https://developer.apple.com/account/resources/certificates/list"
  echo "  → Click + → 'Developer ID Application' → create, download, double-click to install in Keychain."
  echo "Then set SIGN_IDENTITY in .env.signing to the exact name (e.g. 'Developer ID Application: Your Name (TEAM_ID)')."
  echo ""
  echo "Available signing identities:"
  security find-identity -v -p codesigning 2>/dev/null | grep -E "Developer ID Application|^\s+[0-9]+\)" || true
  exit 1
fi

# --- Build ---
echo ""
echo "--- Building (darwin/universal) ---"
cd "$(dirname "$0")"
wails build -platform darwin/universal

if [[ ! -d "$APP_PATH" ]]; then
  echo "Error: Expected $APP_PATH not found after build."
  exit 1
fi

# Fix Info.plist: unescaped & in XML breaks notarization and spctl ("malformed plist")
INFO_PLIST="$APP_PATH/Contents/Info.plist"
if [[ -f "$INFO_PLIST" ]]; then
  if grep -q '&' "$INFO_PLIST" && ! grep -q '&amp;' "$INFO_PLIST"; then
    echo "--- Fixing unescaped & in Info.plist ---"
    sed -i '' 's/ & / \&amp; /g' "$INFO_PLIST"
  fi
  plutil -lint "$INFO_PLIST" >/dev/null 2>&1 || { echo "Error: Info.plist invalid after fix."; exit 1; }
fi

# --- Sign (hardened runtime, innermost first; do not use --deep) ---
echo ""
echo "--- Signing with Developer ID (innermost first) ---"
MACOS_BIN="$APP_PATH/Contents/MacOS/$APP_NAME"
# 1. Sign nested .dylib and .framework (if any)
while IFS= read -r -d '' f; do
  codesign --force --options runtime --timestamp -s "$SIGN_IDENTITY" "$f"
done < <(find "$APP_PATH" -name "*.dylib" -type f -print0 2>/dev/null)
while IFS= read -r -d '' f; do
  codesign --force --options runtime --timestamp -s "$SIGN_IDENTITY" "$f"
done < <(find "$APP_PATH" -name "*.framework" -type d -print0 2>/dev/null)
# 2. Sign main executable
codesign --force --options runtime --timestamp -s "$SIGN_IDENTITY" "$MACOS_BIN"
# 3. Sign app bundle
codesign --force --options runtime --timestamp -s "$SIGN_IDENTITY" "$APP_PATH"

echo "  Main binary: $(codesign -dv "$MACOS_BIN" 2>&1 | grep -E '^Authority=' || true)"
echo "  App bundle:  $(codesign -dv "$APP_PATH" 2>&1 | grep -E '^Authority=' || true)"

# --- Create DMG for notarization (Apple accepts .dmg; .deb is Linux-only and cannot be notarized) ---
echo ""
echo "--- Creating DMG for notarization ---"
rm -f "$DMG_NAME"
hdiutil create -volname "$APP_NAME" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_NAME"

# --- Notarize ---
echo ""
echo "--- Submitting DMG to Apple for notarization (this may take a few minutes) ---"
NOTARY_OUTPUT=$(xcrun notarytool submit "$SUBMIT_ARTIFACT" \
  --key "$APPLE_API_KEY_PATH" \
  --key-id "$APPLE_KEY_ID" \
  --issuer "$APPLE_ISSUER_ID" \
  --wait 2>&1) || true
echo "$NOTARY_OUTPUT"

SUBMISSION_ID=$(echo "$NOTARY_OUTPUT" | grep -E "id: [a-f0-9-]{36}" | tail -1 | sed 's/.*id: *\([a-f0-9-]*\).*/\1/')
STATUS=$(echo "$NOTARY_OUTPUT" | grep "status:" | tail -1 | sed 's/.*status: *\([A-Za-z]*\).*/\1/' | tr -d ' ')

if [[ "$STATUS" != "Accepted" ]]; then
  echo ""
  echo "!!! Notarization failed (status: $STATUS). Apple's log:"
  echo "---"
  if [[ -n "$SUBMISSION_ID" ]]; then
    xcrun notarytool log "$SUBMISSION_ID" \
      --key "$APPLE_API_KEY_PATH" \
      --key-id "$APPLE_KEY_ID" \
      --issuer "$APPLE_ISSUER_ID" 2>&1 || true
  fi
  echo "---"
  echo "Fix the issues above, then run this script again."
  rm -f "$DMG_NAME"
  exit 1
fi

# --- Staple ticket to DMG ---
echo ""
echo "--- Stapling notarization ticket to DMG ---"
xcrun stapler staple "$DMG_NAME"

# --- Cleanup (keep DMG; it's the distributable) ---
# Optionally also staple to .app so the unpacked app is valid when opened from DMG
xcrun stapler staple "$APP_PATH" 2>/dev/null || true

echo ""
echo "=== Done ==="
echo "Signed and notarized DMG: $DMG_NAME"
echo "Distribute $DMG_NAME to users (double-click to mount and drag app to Applications)."
