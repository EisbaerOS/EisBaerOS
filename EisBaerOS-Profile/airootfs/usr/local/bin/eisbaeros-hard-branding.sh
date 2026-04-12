#!/usr/bin/env bash
# EisBärOS Hard Branding Script
# Dieses Script wird NACH dem Installer auf das installierte System angewendet.

echo "[EisBärOS] Finale Branding-Phase startet..."

# Wir suchen die Partition, auf der /etc/os-release liegt (die neue Installation)
# Wir schauen nach, was unter /mnt gemountet ist
TARGET_PART=$(lsblk -rn -o NAME,MOUNTPOINT | grep '/mnt$' | awk '{print $1}')

if [ -z "$TARGET_PART" ]; then
    # Wenn nicht gemountet, versuchen wir die größte Partition zu finden
    TARGET_PART=$(lsblk -ln -o NAME,SIZE,TYPE | grep 'part' | sort -hk2 | tail -n1 | awk '{print $1}')
    if [ -n "$TARGET_PART" ]; then
        echo "[EisBärOS] Mounten von /dev/$TARGET_PART nach /mnt..."
        mount /dev/$TARGET_PART /mnt 2>/dev/null
    fi
fi

if [ -d /mnt/etc ]; then
    # 1. Namen überall überschreiben
    cp /etc/os-release /mnt/etc/os-release
    cp /etc/os-release /mnt/usr/lib/os-release
    echo "EisBärOS" > /mnt/etc/hostname
    echo "EisBärOS (\l) (\n) (\t)" > /mnt/etc/issue
    
    # 2. Das Logo "fälschen" (Aus unserem sicheren Branding-Ordner)
    mkdir -p /mnt/usr/share/pixmaps
    cp /etc/eisbaeros/branding/archlinux-logo.png /mnt/usr/share/pixmaps/eisbaeros-logo.png 2>/dev/null
    cp /etc/eisbaeros/branding/archlinux-logo.png /mnt/usr/share/pixmaps/archlinux-logo.png 2>/dev/null
    
    # Icons für KDE
    mkdir -p /mnt/usr/share/icons/hicolor/48x48/apps
    cp /etc/eisbaeros/branding/archlinux-logo.png /mnt/usr/share/icons/hicolor/48x48/apps/eisbaeros-logo.png 2>/dev/null
    cp /etc/eisbaeros/branding/archlinux-logo.png /mnt/usr/share/icons/hicolor/48x48/apps/archlinux-logo.png 2>/dev/null

    # 3. Bootloader Name ändern
    if [ -f /mnt/etc/default/grub ]; then
        sed -i 's/GRUB_DISTRIBUTOR=.*/GRUB_DISTRIBUTOR="EisBärOS"/' /mnt/etc/default/grub
        arch-chroot /mnt grub-mkconfig -o /boot/grub/grub.cfg 2>/dev/null
    fi

    # 4. Fastfetch, Skel & Versions
    mkdir -p /mnt/etc/skel/.config/fastfetch
    cp /etc/eisbaeros/fastfetch-config.jsonc /mnt/etc/skel/.config/fastfetch/config.jsonc
    mkdir -p /mnt/etc/eisbaeros
    cp /etc/eisbaeros/logo.txt /mnt/etc/eisbaeros/logo.txt
    cp /etc/eisbaeros/logo.png /mnt/etc/eisbaeros/logo.png 2>/dev/null
    
    cat <<EOF > /mnt/etc/eisbaeros/os-version.json
{
  "install_system": "EisBärOS",
  "install_date": "$(date --iso-8601=seconds)"
}
EOF
    
    echo 'fastfetch' >> /mnt/etc/skel/.bashrc

    # 5. Services aktivieren
    cp /etc/eisbaeros/eisbaeros-firstboot.sh /mnt/usr/local/bin/eisbaeros-firstboot.sh
    chmod +x /mnt/usr/local/bin/eisbaeros-firstboot.sh
    cp /etc/eisbaeros/eisbaeros-firstboot.service /mnt/etc/systemd/system/eisbaeros-firstboot.service
    arch-chroot /mnt systemctl enable eisbaeros-firstboot.service 2>/dev/null

    # 6. EisBärOS Wallpaper auf installiertes System kopieren
    mkdir -p /mnt/usr/share/wallpapers/EisBaerOS/contents/images
    cp /usr/share/wallpapers/EisBaerOS/metadata.json /mnt/usr/share/wallpapers/EisBaerOS/metadata.json 2>/dev/null
    cp /usr/share/wallpapers/EisBaerOS/contents/images/3840x2160.png /mnt/usr/share/wallpapers/EisBaerOS/contents/images/3840x2160.png 2>/dev/null

    # 7. KDE Plasma-Konfiguration (Wallpaper als Standard) für neue User
    mkdir -p /mnt/etc/skel/.config/autostart
    cp /etc/skel/.config/autostart/eisbaeros-wallpaper.desktop /mnt/etc/skel/.config/autostart/eisbaeros-wallpaper.desktop 2>/dev/null

    # Auch für bereits angelegte User (z.B. den installierten Haupt-User)
    for USER_HOME in /mnt/home/*/; do
        if [ -d "$USER_HOME" ]; then
            mkdir -p "${USER_HOME}.config/autostart"
            cp /etc/skel/.config/autostart/eisbaeros-wallpaper.desktop "${USER_HOME}.config/autostart/eisbaeros-wallpaper.desktop" 2>/dev/null
            USER_NAME=$(basename "$USER_HOME")
            arch-chroot /mnt chown -R "$USER_NAME:$USER_NAME" "/home/$USER_NAME/.config" 2>/dev/null
        fi
    done

    echo "[EisBärOS] Alles auf EisBärOS umgestellt!"
    sync
    # Wir lassen es gemountet, falls der User nochmal schauen will, 
    # aber der Installer ist dann fertig.
fi
