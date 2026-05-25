#!/bin/bash
# ============================================================
#   Omni Forge by Nitzex Visual - macOS Installer
#   Copies the CEP extension into ~/Library/Application Support/Adobe/CEP/extensions/
#   and enables PlayerDebugMode so the unsigned panel will load.
# ============================================================
set -e

EXT_NAME="com.nitzexvisual.omniforge"
TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/$EXT_NAME"
SRC_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo
echo "  Omni Forge Installer (macOS)"
echo "  ----------------------------"
echo "  Source: $SRC_DIR"
echo "  Target: $TARGET_DIR"
echo

mkdir -p "$(dirname "$TARGET_DIR")"

if [ -d "$TARGET_DIR" ]; then
    echo "Removing previous install..."
    rm -rf "$TARGET_DIR"
fi

echo "Copying files..."
mkdir -p "$TARGET_DIR"
# Copy everything except dev-only directories
rsync -a \
    --exclude 'installers/' \
    --exclude 'keys/' \
    --exclude 'server/' \
    --exclude 'scripts/' \
    --exclude 'docs/' \
    --exclude '.git/' \
    --exclude '.github/' \
    --exclude 'node_modules/' \
    --exclude '.debug' \
    "$SRC_DIR/" "$TARGET_DIR/"

# Enable CEP PlayerDebugMode for all known CSXS versions
for v in 9 10 11 12 13; do
    defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
    defaults write "com.adobe.CSXS.$v" LogLevel 1 2>/dev/null || true
done

echo
echo "  ============================================================"
echo "   Installed successfully."
echo "   Launch After Effects, then open:"
echo "     Window > Extensions > Omni Forge"
echo "  ============================================================"
echo
read -p "Press Enter to close..."
