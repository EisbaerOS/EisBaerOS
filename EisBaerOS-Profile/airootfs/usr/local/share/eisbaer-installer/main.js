const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        title: 'EisBärOS Installer',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC: Check Internet
ipcMain.handle('check-internet', async () => {
    try {
        const response = await fetch('https://connection.eisbaeros.de/');
        if (response.ok) {
            const text = await response.text();
            if (text.includes('hiiii 👋')) return true;
        }
    } catch (e) {
        // Fallback to HTTP
        try {
            const fallback = await fetch('http://connection.eisbaeros.de/');
            if (fallback.ok) {
                const text = await fallback.text();
                if (text.includes('hiiii 👋')) return true;
            }
        } catch (err) {
            return false;
        }
    }
    return false;
});

// IPC: Get WiFi List
ipcMain.handle('get-wifi-list', async () => {
    return new Promise((resolve) => {
        exec('nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list', (error, stdout) => {
            if (error) {
                resolve([]);
                return;
            }
            const networks = stdout.split('\n').filter(l => l.trim() !== '').map(line => {
                const parts = line.split(':');
                return {
                    ssid: parts[0],
                    signal: parts[1],
                    security: parts[2]
                };
            }).filter(n => n.ssid); // filter hidden
            resolve(networks);
        });
    });
});

// IPC: Connect WiFi
ipcMain.handle('connect-wifi', async (event, ssid, password) => {
    return new Promise((resolve) => {
        const cmd = password 
            ? `nmcli dev wifi connect "${ssid}" password "${password}"`
            : `nmcli dev wifi connect "${ssid}"`;
            
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, error: stderr || error.message });
            } else {
                resolve({ success: true });
            }
        });
    });
});

// IPC: Check Updates
ipcMain.handle('check-updates', async () => {
    try {
        const response = await fetch('https://updates-live.eisbaeros.de/stable.json');
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        // Silently fail if updates server is offline but internet check passed
        return null;
    }
    return null;
});

// IPC: Read Local Version
ipcMain.handle('get-local-version', () => {
    try {
        const data = fs.readFileSync('/etc/eisbaeros/live-version.json', 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { iso_id: "Unknown" };
    }
});

// IPC: Get Disks
ipcMain.handle('get-disks', async () => {
    return new Promise((resolve) => {
        exec('lsblk -J -d -n -o NAME,SIZE,MODEL', (error, stdout) => {
            if (error) {
                resolve([]);
                return;
            }
            try {
                const parsed = JSON.parse(stdout);
                resolve(parsed.blockdevices || []);
            } catch (e) {
                resolve([]);
            }
        });
    });
});

// IPC: Start Install
ipcMain.handle('start-install', async (event, config) => {
    const configPath = '/tmp/eisbaer_config.json';
    const mountpoint = '/mnt/archinstall';

    // Extract disk info from config and remove it (we handle partitioning ourselves)
    const diskDevice = config._disk_device;
    const fsType = config._fs_type || 'ext4';
    const wantSwap = config._swap || false;
    const encPassword = config._enc_password || '';
    
    // Remove our internal fields before passing to archinstall
    delete config._disk_device;
    delete config._fs_type;
    delete config._swap;
    delete config._enc_password;

    // Set disk_config to pre_mounted_config pointing to our mountpoint
    config.disk_config = {
        "config_type": "pre_mounted_config",
        "mountpoint": mountpoint
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Build commands
    const partCmds = [];
    
    partCmds.push(`echo ''`);
    partCmds.push(`echo '══════════════════════════════════════════════'`);
    partCmds.push(`echo '   EisBärOS Installer'`);
    partCmds.push(`echo '══════════════════════════════════════════════'`);
    partCmds.push(`echo ''`);
    
    // Clean pacman.conf (silent)
    partCmds.push("sed -i '/^# EndeavourOS/,$d' /etc/pacman.conf 2>/dev/null || true");
    partCmds.push("sed -i '/^\\[endeavouros\\]/,$d' /etc/pacman.conf 2>/dev/null || true");
    partCmds.push("rm -f /var/lib/pacman/sync/endeavouros.* 2>/dev/null || true");
    
    // Init keyring
    partCmds.push(`echo '▶ Step 1/3: Preparing package keyring...'`);
    partCmds.push('pacman-key --init 2>&1 | tail -1');
    partCmds.push('pacman-key --populate archlinux 2>&1 | tail -1');
    partCmds.push('pacman -Syy --noconfirm --noprogressbar archlinux-keyring > /dev/null 2>&1');
    partCmds.push(`echo '  ✓ Keyring ready'`);
    
    // Optimize mirrors and enable parallel downloads
    partCmds.push(`echo ''`);
    partCmds.push(`echo '▶ Step 2/3: Optimizing download speed...'`);
    partCmds.push(`sed -i 's/^#ParallelDownloads.*/ParallelDownloads = 10/' /etc/pacman.conf`);
    partCmds.push(`sed -i 's/^ParallelDownloads.*/ParallelDownloads = 10/' /etc/pacman.conf`);
    partCmds.push(`echo '  Finding fastest mirrors...'`);
    partCmds.push(`reflector --latest 10 --protocol https --sort rate --save /etc/pacman.d/mirrorlist 2>/dev/null || echo '  (reflector unavailable, using default mirrors)'`);
    partCmds.push(`echo '  ✓ Mirrors optimized'`);
    
    partCmds.push(`echo ''`);
    partCmds.push(`echo '▶ Step 3/3: Installing EisBärOS via archinstall...'`);
    partCmds.push(`echo '  This process is fully automated. Please wait.'`);
    partCmds.push(`echo ''`);
    
    // Run archinstall directly
    partCmds.push(`archinstall --config ${configPath} --no-pkg-lookups --debug --silent`);

    const command = partCmds.join(' && ');
    const installProcess = spawn('pkexec', ['bash', '-c', command]);

    installProcess.stdout.on('data', (data) => {
        mainWindow.webContents.send('install-log', data.toString());
    });

    installProcess.stderr.on('data', (data) => {
        mainWindow.webContents.send('install-log', `ERROR: ${data.toString()}`);
    });

    installProcess.on('close', (code) => {
        mainWindow.webContents.send('install-exit', code);
    });
    
    return true;
});

// IPC: Reboot System
ipcMain.on('reboot-system', () => {
    exec('reboot');
});
