const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    relayCommand: (ch, act) => ipcRenderer.invoke('relay-command', ch, act),
    login: (phone) => ipcRenderer.invoke('api-login', phone),
    spendBonus: (phone, amt) => ipcRenderer.invoke('api-spend-bonus', phone, amt),
    addBonus: (phone, amt) => ipcRenderer.invoke('api-add-bonus', phone, amt),
    deposit: (phone, amt) => ipcRenderer.invoke('api-deposit', phone, amt),
    getSettings: () => ipcRenderer.invoke('api-get-settings'),
    saveSettings: (s) => ipcRenderer.invoke('api-save-settings', s),
    getWashId: () => ipcRenderer.invoke('get-wash-id'),
    setWashId: (id) => ipcRenderer.invoke('set-wash-id', id)
});