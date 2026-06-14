const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');
const axios = require('axios');
const path = require('path');
const os = require('os');

let mainWindow;
let relayPort = null;
let serverUrl = 'http://localhost:3000';
let washId = 1;

// Поиск сервера в локальной сети
async function findServer() {
    const interfaces = os.networkInterfaces();
    let localIp = null;
    
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192.168.')) {
                localIp = net.address;
                break;
            }
        }
    }
    
    if (!localIp) {
        console.log('[ERROR] Cannot detect local IP');
        return;
    }
    
    const baseIp = localIp.substring(0, localIp.lastIndexOf('.') + 1);
    
    for (let i = 1; i <= 10; i++) {
        const testUrl = `http://${baseIp}${i}:3000/api/settings/1`;
        try {
            const response = await axios.get(testUrl, { timeout: 500 });
            if (response.status === 200) {
                serverUrl = `http://${baseIp}${i}:3000`;
                console.log(`[SERVER] Found at ${serverUrl}`);
                return;
            }
        } catch(e) {}
    }
    console.log('[SERVER] Not found, using localhost');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        fullscreen: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.loadFile('index.html');
}

async function sendRelayCommand(channel, action) {
    if (!relayPort) return;
    const cmd = `AT+${channel}${action === 'on' ? 'ON' : 'OFF'}\r\n`;
    relayPort.write(cmd);
    console.log(`[RELAY] ${cmd}`);
}

function connectRelay(portPath) {
    try {
        relayPort = new SerialPort({ path: portPath, baudRate: 9600 });
        relayPort.on('open', () => console.log(`[RELAY] Connected to ${portPath}`));
        relayPort.on('error', (err) => console.error('[RELAY] Error:', err));
    } catch (err) {
        console.error('[RELAY] Failed:', err);
    }
}

// API
async function apiCall(endpoint, data) {
    try {
        const res = await axios.post(`${serverUrl}/api/${endpoint}`, data);
        return res.data;
    } catch (e) {
        console.error(`[API] ${endpoint} failed:`, e.message);
        return { success: false };
    }
}

ipcMain.handle('relay-command', (e, ch, act) => sendRelayCommand(ch, act));
ipcMain.handle('api-login', (e, phone) => apiCall('login', { phone }));
ipcMain.handle('api-spend-bonus', (e, phone, amt) => apiCall('spend_bonus', { phone, amount: amt, wash_id: washId }));
ipcMain.handle('api-add-bonus', (e, phone, amt) => apiCall('add_bonus', { phone, amount: amt, wash_id: washId }));
ipcMain.handle('api-deposit', (e, phone, amt) => apiCall('deposit', { phone, amount: amt, wash_id: washId }));
ipcMain.handle('api-get-settings', () => apiCall('settings', { wash_id: washId }));
ipcMain.handle('api-save-settings', (e, settings) => apiCall('settings', { wash_id: washId, settings }));
ipcMain.handle('get-wash-id', () => washId);
ipcMain.handle('set-wash-id', (e, id) => { washId = id; });

app.whenReady().then(async () => {
    await findServer();
    createWindow();
    // Автоподключение к реле можно добавить позже
});