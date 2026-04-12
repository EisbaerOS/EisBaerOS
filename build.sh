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
rm -rf ./work

# Step 2.5: Generate Live USB Version Info
mkdir -p "$AIROOTFS/etc/eisbaeros"
cat <<EOF > "$AIROOTFS/etc/eisbaeros/live-version.json"
{
  "iso_id": "$(date +%Y-%m-%d-%H)",
  "build_date": "$(date --iso-8601=seconds)"
}
EOF

# Step 3: Build ISO
echo "Starte mkarchiso..."
mkarchiso -v -w ./work -o ./out ./EisBaerOS-Profile

echo ""
echo "Build abgeschlossen! Du findest die fertige ISO im Ordner 'out'."
