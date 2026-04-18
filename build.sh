#!/usr/bin/env bash
set -e
# EisBärOS Build Script
# Usage:
#   sudo ./build.sh          → Incremental build (fast, reuses cached packages)
#   sudo ./build.sh --clean  → Full clean rebuild from scratch

START_TIME=$(date +%s)

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo ./build.sh"
  exit 1
fi

CLEAN=false
if [ "$1" == "--clean" ]; then
  CLEAN=true
fi

PROFILE="./EisBaerOS-Profile"
AIROOTFS="$PROFILE/airootfs"
WORK="./work"
OUT="./out"

echo ""
echo "══════════════════════════════════════"
echo "   EisBärOS ISO Builder"
echo "══════════════════════════════════════"
echo ""

# Step 1: Clean only if requested
if $CLEAN; then
  echo "▶ Clean build requested, removing work directory..."
  rm -rf "$WORK"
else
  echo "▶ Incremental build (use --clean for full rebuild)"
  # Only remove the ISO image cache, keep downloaded packages
  rm -rf "$WORK/iso"
fi
mkdir -p "$OUT"

# Step 2: Enable parallel downloads in the build environment
if ! grep -q "^ParallelDownloads" /etc/pacman.conf 2>/dev/null; then
  echo "▶ Enabling parallel downloads (5)..."
  sed -i 's/^#ParallelDownloads.*/ParallelDownloads = 5/' /etc/pacman.conf
fi

# Step 3: Generate Live USB Version Info
echo "▶ Generating version info..."
mkdir -p "$AIROOTFS/etc/eisbaeros"
cat <<EOF > "$AIROOTFS/etc/eisbaeros/live-version.json"
{
  "iso_id": "$(date +%Y-%m-%d-%H)",
  "build_date": "$(date --iso-8601=seconds)"
}
EOF

# Step 4: Prepare airootfs
mkdir -p "$AIROOTFS/usr/bin"

# Step 5: Build ISO
echo "▶ Starting mkarchiso..."
echo ""
mkarchiso -v -w "$WORK" -o "$OUT" "$PROFILE"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED / 60))
SECONDS=$((ELAPSED % 60))

echo ""
echo "══════════════════════════════════════"
echo "   ✓ Build complete!"
echo "   Time: ${MINUTES}m ${SECONDS}s"
echo "   ISO:  $(ls -t $OUT/*.iso 2>/dev/null | head -1)"
echo "══════════════════════════════════════"
echo ""
