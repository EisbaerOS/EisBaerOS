const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('installerAPI', {
    getDisks: () => ipcRenderer.invoke('get-disks'),
    startInstall: (config) => ipcRenderer.invoke('start-install', config),
    onInstallLog: (callback) => ipcRenderer.on('install-log', (_event, data) => callback(data)),
    onInstallExit: (callback) => ipcRenderer.on('install-exit', (_event, code) => callback(code)),
    rebootSystem: () => ipcRenderer.send('reboot-system')
});
