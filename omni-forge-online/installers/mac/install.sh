#!/bin/bash
# ============================================================
#   Omni Forge by Nitzex Visual - macOS Installer v1.0.1
# ============================================================
set -e

EXT_NAME="com.nitzexvisual.omniforge"
TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/$EXT_NAME"
SRC_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo
echo "  ============================================================"
echo "   Omni Forge Installer (macOS)"
echo "  ============================================================"
echo

# Refuse to run while AE is open - file replace fails silently otherwise
if pgrep -x "After Effects" >/dev/null 2>&1 || pgrep -f "Adobe After Effects" >/dev/null 2>&1; then
    echo "  ERROR: After Effects is currently running."
    echo
    echo "   Please:"
    echo "     1. Save your AE work"
    echo "     2. Quit After Effects completely (Cmd+Q)"
    echo "     3. Verify in Activity Monitor that 'After Effects' is gone"
    echo "     4. Run this installer again"
    echo
    read -p "Press Enter to close..."
    exit 1
fi

echo "  Source: $SRC_DIR"
echo "  Target: $TARGET_DIR"
echo

mkdir -p "$(dirname "$TARGET_DIR")"
[ -d "$TARGET_DIR" ] && rm -rf "$TARGET_DIR" && echo "Removed previous install."
mkdir -p "$TARGET_DIR"


echo "Copying files..."
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

# Verify a critical file actually got copied
if [ ! -f "$TARGET_DIR/client/js/bridge.js" ]; then
    echo "  ERROR: bridge.js missing after copy. Install incomplete."
    read -p "Press Enter to close..."
    exit 1
fi

# Stamp version marker
echo "1.0.4" > "$TARGET_DIR/.installed-version"

# Enable CEP PlayerDebugMode for all CSXS versions
for v in 9 10 11 12 13; do
    defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1 2>/dev/null || true
    defaults write "com.adobe.CSXS.$v" LogLevel 1 2>/dev/null || true
done

echo
echo "  ============================================================"
echo "   Installed successfully (v1.0.4)."
echo
echo "   1. Launch After Effects"
echo "   2. Window > Extensions > Omni Forge"
echo "   3. Activate with a key from keys/keys.txt"
echo "  ============================================================"
echo
read -p "Press Enter to close..."
