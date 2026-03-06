const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: "Kontakt | Parametr Axtarışı",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    serverProcess = fork(path.join(__dirname, 'server.js'), [], {
        env: {
            PORT: 3000,
            HEADLESS: 'true'
        }
    });

    setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
    }, 3000);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (serverProcess) serverProcess.kill();
        app.quit();
    }
});
