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
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Using pkexec to elevate privileges, clean pacman.conf, init keyring, sync mirrors, then run archinstall
    const command = [
        // Remove any non-official repos (e.g. endeavouros) from pacman.conf to prevent mirror failures
        "sed -i '/^# EndeavourOS/,$d' /etc/pacman.conf",
        "sed -i '/^\\[endeavouros\\]/,$d' /etc/pacman.conf",
        // Remove stale sync DBs for removed repos
        "rm -f /var/lib/pacman/sync/endeavouros.*",
        // Init keyring and sync
        'pacman-key --init',
        'pacman-key --populate archlinux',
        'pacman -Syy --noconfirm archlinux-keyring',
        `archinstall --config ${configPath} --silent`
    ].join(' && ');
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
