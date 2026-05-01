<div align="center">
  <img src="LOGO/transparent_black_notext.png" alt="EisBärOS Logo" width="200">
  <h1>EisBärOS</h1>

  [![Build Status](https://github.com/EisbaerOS/EisBaerOS/actions/workflows/build.yml/badge.svg)](https://github.com/EisbaerOS/EisBaerOS/actions/workflows/build.yml)
  [![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](LICENSE)
  [![Platform: Arch Linux](https://img.shields.io/badge/Platform-Arch%20Linux-1793d1.svg?logo=arch-linux&logoColor=white)](https://archlinux.org)

  **A modern, reliable Arch Linux-based distribution featuring a streamlined CLI installation experience.**
  
  [Official Website](https://eisbaeros.de) • [AxoDevs](https://axodevs.de)
</div>

---

## 🛠️ Overview

EisBärOS is designed to provide a "just works" Arch Linux experience without sacrificing the power and flexibility of the Arch ecosystem. This version features a CLI-only live environment optimized for speed and reliability, utilizing the official `archinstall` backend.

### Key Features

| Feature | Description |
| :--- | :--- |
| **CLI Optimized** | Lightweight live environment designed specifically for system installation. |
| **Archinstall Core** | Leverages the official `archinstall` backend for maximum stability and compatibility. |
| **Custom Branding** | Pre-configured aesthetics and specialized package sets for the final installation. |
| **Performance** | Optimized build process and live environment for the fastest deployment. |

---

## 🏗️ Build System

EisBärOS uses a custom build wrapper for `mkarchiso` to ensure reproducible and fast ISO generation.

### Prerequisites

- **Arch Linux** host system
- **archiso** package: `sudo pacman -S archiso`

### Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EisbaerOS/EisBaerOS.git
   cd EisBaerOS
   ```

2. **Start the build process:**
   ```bash
   # Standard incremental build
   sudo ./build.sh

   # Clean build (removes cache)
   sudo ./build.sh --clean
   ```

The completed image will be available in the `out/` directory.

---

## 📂 Project Structure

```text
├── build.sh                    # Optimized build wrapper script
├── EisBaerOS-Profile/          # Official archiso profile configuration
│   ├── profiledef.sh           # Core profile metadata
│   ├── packages.x86_64         # Full package list for the ISO
│   ├── pacman.conf             # Build-time repository configuration
│   └── airootfs/               # Live system root filesystem
│       └── etc/                # Pre-configured system files
└── LOGO/                       # Branding assets and design files
```

---

## ⚖️ License

Distributed under the **GPL-2.0 License**. See `LICENSE` for more information.

<div align="center">
  <sub>Developed with ❤️ by <a href="https://axodevs.de">AxoDevs.de</a></sub>
</div>
