#!/usr/bin/env bash

# EisBärOS Dynamic Mode Monitor
# Swaps system logos based on KDE Plasma Color Scheme (Dark/Light)

LOGO_DARK="/etc/eisbaeros/branding/logo-dark.png"   # Black logo for Light theme
LOGO_LIGHT="/etc/eisbaeros/branding/logo-light.png" # White logo for Dark theme
TARGET_LOGO="/usr/share/pixmaps/archlinux-logo.png"

# Function to update logo
update_logo() {
    local scheme=$(kreadconfig5 --group "Colors" --key "ColorScheme" 2>/dev/null)
    
    # We hijack the archlinux-logo.png path which KDE uses by default
    # Note: logo-light.png (white) is for Dark Mode!
    # Note: logo-dark.png (black) is for Light Mode!

    if [[ "$scheme" == *"Dark"* ]] || [[ "$scheme" == "" ]]; then
        # Default to Light logo (on dark bg) if unknown or dark
        if [[ ! -L "$TARGET_LOGO" ]] || [[ "$(readlink -f $TARGET_LOGO)" != "$LOGO_LIGHT" ]]; then
            sudo ln -sf "$LOGO_LIGHT" "$TARGET_LOGO"
        fi
    else
        # Light mode detected -> use Dark logo
        if [[ ! -L "$TARGET_LOGO" ]] || [[ "$(readlink -f $TARGET_LOGO)" != "$LOGO_DARK" ]]; then
            sudo ln -sf "$LOGO_DARK" "$TARGET_LOGO"
        fi
    fi
}

# Initial update
update_logo

# Loop to monitor changes (since dbus monitoring is complex, we poll every 5s)
while true; do
    sleep 5
    update_logo
done
