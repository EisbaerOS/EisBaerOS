#!/usr/bin/env bash

# User "eisbaer" erstellen falls nicht vorhanden
if ! id "eisbaer" &>/dev/null; then
    useradd -m -g users -G wheel,audio,video,storage -s /bin/zsh eisbaer
    passwd -d eisbaer # Kein Passwort
    
    # Sudo ohne Passwort für wheel Gruppe
    echo "%wheel ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/eisbaeros
fi

# Desktop-Ordner erstellen und Installer-Icon vorbereiten
mkdir -p /home/eisbaer/Desktop
cp /etc/skel/Desktop/install-eisbaeros.desktop /home/eisbaer/Desktop/ 2>/dev/null
chown -R eisbaer:users /home/eisbaer/
chmod +x /home/eisbaer/Desktop/install-eisbaeros.desktop

# Branding zur Laufzeit anwenden (umgeht pacman-Konflikte beim Bauen)
BRANDING_DIR="/etc/eisbaeros/branding"
if [ -d "$BRANDING_DIR" ]; then
    cp "$BRANDING_DIR/archlinux-logo.png" /usr/share/pixmaps/archlinux-logo.png 2>/dev/null
    cp "$BRANDING_DIR/org.kde.konsole.desktop" /usr/share/applications/org.kde.konsole.desktop 2>/dev/null
fi
