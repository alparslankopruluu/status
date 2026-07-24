const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 580,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:1420');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('blur', () => {
    // Optionally hide when losing focus if desired
  });
}

function createTray() {
  // Simple tray icon fallback
  const iconPath = path.join(__dirname, 'icon.png');
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    // Fallback if icon png doesn't exist
    tray = new Tray(path.join(__dirname, '../public/owl-icon.svg'));
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show StatusOwl',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: 'Toggle Desktop Mascot Widget',
      click: () => {
        mainWindow.webContents.send('toggle-widget-mode');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit StatusOwl',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('StatusOwl - AI Quota Monitor');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  mainWindow.show();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
