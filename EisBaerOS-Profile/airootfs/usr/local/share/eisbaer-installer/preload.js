const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('installerAPI', {
    getDisks: () => ipcRenderer.invoke('get-disks'),
    startInstall: (config) => ipcRenderer.invoke('start-install', config),
    checkInternet: () => ipcRenderer.invoke('check-internet'),
    getWifiList: () => ipcRenderer.invoke('get-wifi-list'),
    connectWifi: (ssid, password) => ipcRenderer.invoke('connect-wifi', ssid, password),
    checkUpdates: () => ipcRenderer.invoke('check-updates'),
    getLocalVersion: () => ipcRenderer.invoke('get-local-version'),
    onInstallLog: (callback) => ipcRenderer.on('install-log', (_event, data) => callback(data)),
    onInstallExit: (callback) => ipcRenderer.on('install-exit', (_event, code) => callback(code)),
    rebootSystem: () => ipcRenderer.send('reboot-system')
});
