#!/bin/bash
# EisBärOS First-Boot Setup Script
# Runs once after first installation, then disables itself.

echo "[EisBärOS] Erster Start wird eingerichtet..."

# Flathub Repository hinzufügen
if command -v flatpak &> /dev/null; then
    echo "[EisBärOS] Flathub Repository wird aktiviert..."
    flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
    echo "[EisBärOS] Flathub erfolgreich aktiviert!"
fi

# Service deaktivieren (nur einmal ausführen)
systemctl disable eisbaeros-firstboot.service

echo "[EisBärOS] Einrichtung abgeschlossen!"
