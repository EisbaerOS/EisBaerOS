# 🐻‍❄️ EisBärOS

**EisBärOS** is an Arch Linux-based distribution featuring the KDE Plasma Desktop and a custom graphical installer.

Developed by [AxolotlDevs.de](https://axolotldevs.de) · [eisbaeros.de](https://eisbaeros.de)

## Features

- 🖥️ **KDE Plasma Desktop** – Modern and customizable
- 🧊 **Custom Graphical Installer** – Ubuntu-like installation wizard (Electron-based)
- 🔧 **Archinstall Backend** – Reliable system installation
- 🎨 **Custom Branding** – Wallpapers, logos, Fastfetch configuration
- 🔊 **PipeWire Audio** – Modern audio system out-of-the-box

## Building the ISO

### Prerequisites

- Arch Linux (or an Arch-based distribution)
- `archiso` package installed (`sudo pacman -S archiso`)

### Start Build

```bash
sudo ./build.sh
```

You can find the built ISO in the `out/` directory.

## Project Structure

```
├── build.sh                    # Build script
├── EisBaerOS-Profile/          # Archiso profile
│   ├── profiledef.sh           # Profile definition
│   ├── packages.x86_64         # Package list
│   ├── pacman.conf             # Pacman configuration
│   └── airootfs/               # Root filesystem
│       ├── etc/                # System configuration
│       ├── usr/local/bin/      # EisBärOS scripts
│       └── usr/local/share/    # Installer (Electron)
│           └── eisbaer-installer/
└── LOGO/                       # Logo files
```

## License

GPL-2.0 – See [LICENSE](LICENSE) for details.
