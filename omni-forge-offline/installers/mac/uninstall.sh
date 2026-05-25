#!/bin/bash
EXT_NAME="com.nitzexvisual.omniforge"
TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/$EXT_NAME"

if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo "Omni Forge uninstalled."
else
    echo "Omni Forge is not installed."
fi
read -p "Press Enter to close..."
