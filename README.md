# 🐻‍❄️ EisBärOS

**EisBärOS** ist eine auf Arch Linux basierende Distribution mit KDE Plasma Desktop und einem eigenen grafischen Installer.

Entwickelt von [AxolotlDevs.de](https://axolotldevs.de) · [eisbaeros.de](https://eisbaeros.de)

## Features

- 🖥️ **KDE Plasma Desktop** – Modern und anpassbar
- 🧊 **Eigener grafischer Installer** – Ubuntu-ähnlicher Installationswizard (Electron-basiert)
- 🔧 **Archinstall Backend** – Zuverlässige Systeminstallation
- 🎨 **Eigenes Branding** – Wallpaper, Logos, Fastfetch-Konfiguration
- 🔊 **PipeWire Audio** – Modernes Audio-System out-of-the-box

## ISO bauen

### Voraussetzungen

- Arch Linux (oder Arch-basierte Distribution)
- `archiso` Paket installiert (`sudo pacman -S archiso`)

### Build starten

```bash
sudo ./build.sh
```

Die fertige ISO findest du im `out/` Ordner.

## Projektstruktur

```
├── build.sh                    # Build-Script
├── EisBaerOS-Profile/          # Archiso-Profil
│   ├── profiledef.sh           # Profil-Definition
│   ├── packages.x86_64         # Paketliste
│   ├── pacman.conf             # Pacman-Konfiguration
│   └── airootfs/               # Root-Dateisystem
│       ├── etc/                # System-Konfiguration
│       ├── usr/local/bin/      # EisBärOS Scripts
│       └── usr/local/share/    # Installer (Electron)
│           └── eisbaer-installer/
└── LOGO/                       # Logo-Dateien
```

## Lizenz

GPL-3.0 – Siehe [LICENSE](LICENSE)
