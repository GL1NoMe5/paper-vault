const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const iconPath = path.join(__dirname, '../dist/icon.svg');
  const windowOptions = {
    width: 480,
    height: 860,
    center: true,
    title: 'Уютный Бюджет',
    autoHideMenuBar: true,
    backgroundColor: '#FAF6F0',
    minWidth: 360,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  };

  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }

  const mainWindow = new BrowserWindow(windowOptions);

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
