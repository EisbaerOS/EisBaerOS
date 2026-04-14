let currentStep = 'network'; // 'network' -> 'updates' -> 1 to 8
const totalSteps = 7; // Navigable Steps (8 is install)

let uiState = {
    lang: "en_US.UTF-8",
    keymap: "us",
    desktop: "kde",
    disk: ""
};

document.addEventListener('DOMContentLoaded', async () => {
    // Selectable lists logic
    setupListSelection('langList', (val) => uiState.lang = val);
    setupListSelection('kbList', (val) => uiState.keymap = val);
    setupListSelection('desktopList', (val) => uiState.desktop = val);

    // Load disks
    const disks = await window.installerAPI.getDisks();
    const select = document.getElementById('diskSelect');
    select.innerHTML = '';
    
    if (disks.length === 0) {
        select.innerHTML = '<option value="">No disks found</option>';
    } else {
        uiState.disk = `/dev/${disks[0].name}`;
        disks.forEach(disk => {
            const el = document.createElement('option');
            el.value = '/dev/' + disk.name;
            el.text = `/dev/${disk.name} - ${disk.size} (${disk.model || 'Unknown'})`;
            select.appendChild(el);
        });
    }

    // Button Logic
    document.getElementById('btnNext').addEventListener('click', nextStep);
    document.getElementById('btnBack').addEventListener('click', prevStep);
    document.getElementById('btnReboot').addEventListener('click', () => {
        window.installerAPI.rebootSystem();
    });
    
    document.getElementById('btnConnectWifi').addEventListener('click', async () => {
        const ssid = document.getElementById('wifiOptions').value;
        const pass = document.getElementById('wifiPassword').value;
        if(!ssid) return;
        
        document.getElementById('btnConnectWifi').disabled = true;
        document.getElementById('btnConnectWifi').textContent = "Connecting...";
        const res = await window.installerAPI.connectWifi(ssid, pass);
        if(res.success) {
            checkNetworkFlow();
        } else {
            document.getElementById('wifiError').textContent = res.error || "Connection failed";
            document.getElementById('btnConnectWifi').disabled = false;
            document.getElementById('btnConnectWifi').textContent = "Connect";
        }
    });

    updateUI();
    checkNetworkFlow();
});

let liveUpdatesData = null;

async function checkNetworkFlow() {
    document.getElementById('networkWifi').style.display = 'none';
    document.getElementById('networkStatus').textContent = "Testing internet connection...";
    const isOnline = await window.installerAPI.checkInternet();
    
    if (isOnline) {
        // Run updates check
        currentStep = 'updates';
        updateUI();
        await checkUpdatesFlow();
    } else {
        // Show Wi-Fi picker
        document.getElementById('networkStatus').textContent = "You are offline. Please connect to Wi-Fi to fetch updates and packages.";
        document.getElementById('networkWifi').style.display = 'block';
        
        const networks = await window.installerAPI.getWifiList();
        const sel = document.getElementById('wifiOptions');
        sel.innerHTML = '<option value="">Select a network</option>';
        networks.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.ssid;
            opt.text = `${n.ssid} (Signal: ${n.signal}%)`;
            sel.appendChild(opt);
        });
    }
}

async function checkUpdatesFlow() {
    document.getElementById('networkStatus').textContent = "Checking for Live-USB updates...";
    const updates = await window.installerAPI.checkUpdates();
    if (!updates || !updates.updates || updates.updates.length === 0) {
        currentStep = 1;
        updateUI();
        return;
    }
    
    const localVer = await window.installerAPI.getLocalVersion();
    const currentId = localVer.iso_id; // e.g. "2026-04-12-15"
    
    let hasNewUpdates = false;
    let hasForced = false;
    let html = '';
    
    updates.updates.forEach(u => {
        // If the update ID string comparison says the remote is newer
        if (u.id > currentId) {
            hasNewUpdates = true;
            if (u.state === 'forced') hasForced = true;
            html += `<div style="margin-bottom:10px;"><strong>${u.title} (${u.version})</strong> - ${u.state === 'forced' ? '<span style="color:red;">CRITICAL</span>' : 'Optional'}<br><ul style="margin:5px 0 0 20px;">`;
            u.changelog.forEach(log => {
                html += `<li>${log}</li>`;
            });
            html += `</ul></div>`;
        }
    });
    
    if (hasNewUpdates) {
        liveUpdatesData = { hasForced };
        document.getElementById('updatesList').innerHTML = html;
        if (hasForced) {
            document.getElementById('forcedUpdateWarning').style.display = 'block';
        }
        updateUI(); // refresh buttons state
    } else {
        currentStep = 1;
        updateUI();
    }
}

function setupListSelection(containerId, callback) {
    const container = document.getElementById(containerId);
    const items = container.querySelectorAll('.list-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            callback(item.getAttribute('data-val'));
        });
    });
}

function updateUI() {
    // Hide all steps
    document.getElementById('step-network').classList.remove('active');
    document.getElementById('step-updates').classList.remove('active');
    for (let i = 1; i <= 8; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if(stepEl) stepEl.classList.remove('active');
    }
    
    if (currentStep === 'network') {
        document.getElementById('step-network').classList.add('active');
    } else if (currentStep === 'updates') {
        document.getElementById('step-updates').classList.add('active');
    } else {
        document.getElementById(`step-${currentStep}`).classList.add('active');
    }

    // Dots mapping
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (typeof currentStep === 'number' && index < currentStep) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    // Button mapping
    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');

    if (currentStep === 'network') {
        btnBack.style.visibility = 'hidden';
        btnNext.style.display = 'none'; // Controlled by network flow
    } else if (currentStep === 'updates') {
        btnBack.style.visibility = 'hidden';
        btnNext.style.display = 'block';
        
        if (liveUpdatesData && liveUpdatesData.hasForced) {
            const chk = document.getElementById('chkIgnoreForced');
            btnNext.disabled = !chk.checked;
            chk.onchange = () => { btnNext.disabled = !chk.checked; };
        } else {
            btnNext.disabled = false;
        }
    } else if (currentStep === 1) {
        btnNext.style.display = 'block';
        btnBack.style.visibility = 'hidden';
        btnNext.disabled = false;
    } else if (typeof currentStep === 'number' && currentStep <= totalSteps) {
        btnNext.style.display = 'block';
        btnBack.style.visibility = 'visible';
        btnNext.disabled = false;
    }

    if (currentStep === totalSteps) {
        btnNext.textContent = 'Install';
    } else {
        btnNext.textContent = 'Continue';
    }

    // Action specific to steps
    if (currentStep === 7) {
        buildSummary();
    }
}

function buildSummary() {
    const t = document.getElementById('summaryTable');
    t.innerHTML = `
        <tr><td>Language</td><td>${uiState.lang}</td></tr>
        <tr><td>Keyboard</td><td>${uiState.keymap}</td></tr>
        <tr><td>Username</td><td>${document.getElementById('username').value || 'eisbaer'}</td></tr>
        <tr><td>Hostname</td><td>${document.getElementById('hostname').value || 'eisbaer-pc'}</td></tr>
        <tr><td>Desktop</td><td>${uiState.desktop}</td></tr>
        <tr><td>Target Drive</td><td>${document.getElementById('diskSelect').value}</td></tr>
        <tr><td>Filesystem</td><td>${document.getElementById('fsSelect').value}</td></tr>
        <tr><td>Bootloader</td><td>${document.getElementById('bootSelect').value}</td></tr>
    `;
}

async function nextStep() {
    if (currentStep === 3) {
        // Validate password
        const pwd = document.getElementById('password').value;
        const conf = document.getElementById('passwordConfirm').value;
        const errMsg = document.createElement('p');
        errMsg.className = "error-msg";
        errMsg.id = "tmpErr";
        
        const existing = document.getElementById('tmpErr');
        if(existing) existing.remove();

        if (pwd !== conf) {
            errMsg.textContent = "Passwords do not match.";
            document.getElementById('passwordConfirm').after(errMsg);
            return;
        }
    }

    if (currentStep === 'updates') {
        currentStep = 1;
        updateUI();
        return;
    }

    if (currentStep < totalSteps && typeof currentStep === 'number') {
        currentStep++;
        updateUI();
    } else if (currentStep === totalSteps) {
        startInstallation();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

function startInstallation() {
    currentStep = 8;
    updateUI();
    
    // Hide buttons during install
    document.getElementById('btnNext').style.display = 'none';
    document.getElementById('btnBack').style.display = 'none';
    document.getElementById('dotsContainer').style.visibility = 'hidden';

    const term = document.getElementById('terminalLog');
    
    // Construct archinstall config
    const fsType = document.getElementById('fsSelect').value;
    const profile = uiState.desktop !== 'minimal' ? {"type": "desktop", "custom_settings": { "desktop_environment": uiState.desktop }} : {"type": "minimal"};
    
    const config = {
        "bootloader": document.getElementById('bootSelect').value,
        "hostname": document.getElementById('hostname').value || 'eisbaer-pc',
        "timezone": document.getElementById('timezone').value || 'UTC',
        "audio": document.getElementById('audioSelect').value,
        "kernels": ["linux"],
        "packages": ["firefox", "flatpak"],
        "mirror_config": {
            "mirror_regions": {
                [document.getElementById('mirrorRegion').value || "Germany"]: []
            }
        },
        "network_config": {"type": document.getElementById('networkSelect').value},
        "profile_config": { "profile": profile },
        "locale_config": {
            "kb_layout": uiState.keymap,
            "sys_enc": "UTF-8",
            "sys_lang": uiState.lang.split('.')[0]
        },
        "users": [
            {
                "username": document.getElementById('username').value || 'eisbaer',
                "password": document.getElementById('password').value,
                "is_sudo": true
            }
        ]
    };

    const diskLayout = {
        [document.getElementById('diskSelect').value]: {
            "device": document.getElementById('diskSelect').value,
            "wipe": true,
            "partitions": [
                {
                    "mountpoint": "/boot",
                    "fs_type": "fat32",
                    "size": { "unit": "MiB", "value": 512 },
                    "status": "create",
                    "type": "primary",
                    "flags": ["boot"]
                },
                {
                    "mountpoint": "/",
                    "fs_type": fsType,
                    "size": { "unit": "Percent", "value": 100 },
                    "status": "create",
                    "type": "primary"
                }
            ]
        }
    };

    window.installerAPI.onInstallLog((log) => {
        term.textContent += log;
        term.scrollTop = term.scrollHeight; // Auto-scroll
    });

    window.installerAPI.onInstallExit((code) => {
        document.getElementById('progressAnim').style.display = 'none';
        
        if (code === 0) {
            document.getElementById('installTitle').textContent = "Installation Complete";
            document.getElementById('installDesc').innerHTML = "EisBärOS has been installed on your computer.<br><strong>Please remove your installation medium (USB/ISO)</strong>, then press Restart Now.";
            term.style.border = "1px solid #4CAF50";
            
            // Show Reboot Button
            document.getElementById('btnReboot').style.display = 'block';
            document.getElementById('dotsContainer').style.display = 'none';
            document.getElementById('btnNext').style.display = 'none';
        } else {
            document.getElementById('installTitle').textContent = "Installation Failed";
            document.getElementById('installTitle').style.color = "#E95420";
            document.getElementById('installDesc').textContent = "An error occurred during installation. Review the log above.";
            term.style.border = "1px solid #E95420";
        }
    });

    window.installerAPI.startInstall(config, diskLayout);
}
