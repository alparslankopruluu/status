const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

// High-resolution 22x22 Template Icon for macOS Status Bar / Windows Tray
// Solid silhouette for macOS dark/light mode compatibility
const TRAY_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAE4SURBVHgB7VRREsIgDDyavZsn8QReRV9AT+A9+BLxBL2bnqR302Y6HegIKrYzw2TYpkkbki0GjHnGmFfE5x+a34k+79v3bScitoh4g681zrkLhLGBsQWq/QzL7W3bPhCRBca/w1prvx6Px2uapg9y1mC6Y8+K191udwvDsF+v1ysw+Y15uV4eC36M43hP0/SBnE+E+Yc08yZ7h9oD2zYFmYj0yP0VfK3N/Jll2Ys0G3Icx5dZ1y/wHl3XZXwXvKx8m2aW+B4O497s3pX7l4j4xQ/B43K5vN3v9x1yPhG+h3Hh5/u+fxKRCcb/g20b5XwP9w7bNk4wXwV/0T+dTh9xHM/IeYZx4fN1XX/Xdf0k4j0RvgS9aZp35FwRPhFv13V9Z5omImIhz/8VjHnFmFcj4gN/n32Fq2e14wAAAABJRU5ErkJggg==';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
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

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('blur', () => {
    // Hide window when clicking outside like native macOS menu bar popovers
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });
}

function positionWindowNearTray() {
  if (!tray || !mainWindow) return;
  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  let y = Math.round(trayBounds.y + trayBounds.height + 4);

  // Bounds checks for screen edges
  if (x + windowBounds.width > screenWidth) {
    x = screenWidth - windowBounds.width - 12;
  }
  if (x < 12) x = 12;

  // On Windows, tray is usually at the bottom
  if (y + windowBounds.height > screenHeight) {
    y = Math.round(trayBounds.y - windowBounds.height - 4);
  }

  mainWindow.setPosition(x, y, false);
}

function createTray() {
  try {
    const icon = nativeImage.createFromDataURL(TRAY_ICON_BASE64);
    icon.setTemplateImage(true); // Native macOS dark/light mode status item
    tray = new Tray(icon);

    // Display title right in the macOS top status bar!
    if (process.platform === 'darwin') {
      tray.setTitle(' 🦉 78%');
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show StatusOwl',
        click: () => {
          if (mainWindow) {
            positionWindowNearTray();
            mainWindow.show();
            mainWindow.focus();
          }
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

    tray.setToolTip('StatusOwl - AI Assistant Quota Monitor');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          positionWindowNearTray();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (e) {
    console.error('Tray creation warning:', e);
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Position near tray on first show
  setTimeout(() => {
    if (mainWindow && tray) {
      positionWindowNearTray();
      mainWindow.show();
    }
  }, 300);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
