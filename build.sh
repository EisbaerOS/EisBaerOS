#!/usr/bin/env bash
set -e
# EisBärOS Build Script
# This will build the .iso file of EisBärOS

if [ "$EUID" -ne 0 ]; then
  echo "Bitte führe dieses Skript als root aus (sudo ./build.sh)."
  exit 1
fi

echo "Starte Build für EisBärOS..."

# Step 1: Prepare airootfs
echo "Vorbereitung von airootfs..."
AIROOTFS="./EisBaerOS-Profile/airootfs"
mkdir -p "$AIROOTFS/usr/bin"

# Step 2: Clear old iso build artifacts
mkdir -p ./out
rm -rf /tmp/archiso-tmp

# Step 3: Build ISO
echo "Starte mkarchiso..."
mkarchiso -v -w /tmp/archiso-tmp -o ./out ./EisBaerOS-Profile

echo ""
echo "Build abgeschlossen! Du findest die fertige ISO im Ordner 'out'."
