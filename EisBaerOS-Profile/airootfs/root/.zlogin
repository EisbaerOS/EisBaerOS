# fix for screen readers
if grep -Fqa 'accessibility=' /proc/cmdline &> /dev/null; then
    setopt SINGLE_LINE_ZLE
fi

~.automated_script.sh

# Wir starten den Installer nicht mehr automatisch im Terminal,
# da wir jetzt eine grafische Live-Umgebung haben.
# Der Nutzer kann das Icon auf dem Desktop verwenden.

echo ""
echo "=========================================="
echo "  Willkommen bei EisBärOS!"
echo "  Boote grafische Oberfläche..."
echo "=========================================="
echo ""
