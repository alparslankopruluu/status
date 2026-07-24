const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;
let flightInterval = null;
let flightTimeout = null;
let isFlying = false;

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
    resizable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('blur', () => {
    // Blur behavior
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

  if (x + windowBounds.width > screenWidth) x = screenWidth - windowBounds.width - 12;
  if (x < 12) x = 12;
  if (y + windowBounds.height > screenHeight) y = Math.round(trayBounds.y - windowBounds.height - 4);

  mainWindow.setPosition(x, y, false);
}

function stopFlyingAnimation() {
  if (flightInterval) {
    clearInterval(flightInterval);
    flightInterval = null;
  }
  if (flightTimeout) {
    clearTimeout(flightTimeout);
    flightTimeout = null;
  }
  isFlying = false;
}

// 🦅 5-Second Flying Status Notification Engine
function trigger5SecondFlightNotification(statusMode = 'flying') {
  stopFlyingAnimation();
  if (!mainWindow) return;

  isFlying = true;
  mainWindow.setHasShadow(false);
  mainWindow.setSize(130, 130);
  mainWindow.show();

  if (mainWindow.webContents) {
    mainWindow.webContents.send('set-mode', 'flying-pet');
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  let currX = Math.floor(Math.random() * (screenWidth - 300)) + 100;
  let currY = Math.floor(screenHeight * 0.4);
  mainWindow.setPosition(currX, currY, false);

  // Target destination near top corner (menu bar)
  const targetX = screenWidth - 160;
  const targetY = 10;

  let stepCount = 0;
  const speed = 4; // Fast graceful 5-second flight across desktop

  flightInterval = setInterval(() => {
    if (!isFlying || !mainWindow) return;

    stepCount++;
    const dx = targetX - currX;
    const dy = targetY - currY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      // Reached corner: finish flight & vanish smoothly!
      stopFlyingAnimation();
      mainWindow.hide();
    } else {
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      const sineWave = Math.sin(stepCount * 0.2) * 2;

      currX += vx;
      currY += vy + sineWave;

      mainWindow.setPosition(Math.round(currX), Math.round(currY), false);

      if (mainWindow.webContents) {
        mainWindow.webContents.send('flight-facing', vx >= 0 ? 'right' : 'left');
      }
    }
  }, 25);

  // Hard cap at 5 seconds -> disappear into corner
  flightTimeout = setTimeout(() => {
    stopFlyingAnimation();
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  }, 5200);
}

function createTray() {
  try {
    const icon = nativeImage.createFromDataURL(TRAY_ICON_BASE64);
    icon.setTemplateImage(true);
    tray = new Tray(icon);

    if (process.platform === 'darwin') {
      tray.setTitle(' 🦉 85%');
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Status Panel',
        click: () => {
          stopFlyingAnimation();
          if (mainWindow) {
            mainWindow.setHasShadow(true);
            mainWindow.setSize(380, 600);
            positionWindowNearTray();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('set-mode', 'full');
          }
        },
      },
      {
        label: '✨ Test 5s Status Flight Event',
        click: () => {
          trigger5SecondFlightNotification('flying');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit StatusOwl',
        click: () => {
          stopFlyingAnimation();
          app.quit();
        },
      },
    ]);

    tray.setToolTip('StatusOwl - AI Quota Monitor');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          stopFlyingAnimation();
          mainWindow.hide();
        } else {
          stopFlyingAnimation();
          positionWindowNearTray();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('set-mode', 'full');
        }
      }
    });
  } catch (e) {
    console.error('Tray creation warning:', e);
  }
}

// IPC Listeners
ipcMain.on('set-window-size', (event, mode) => {
  if (!mainWindow) return;
  if (mode === 'flying-pet') {
    trigger5SecondFlightNotification('flying');
  } else if (mode === 'widget') {
    stopFlyingAnimation();
    mainWindow.setHasShadow(true);
    mainWindow.setSize(220, 260);
  } else {
    stopFlyingAnimation();
    mainWindow.setHasShadow(true);
    mainWindow.setSize(380, 600);
  }
});

ipcMain.on('trigger-5s-flight', (event, statusMode) => {
  trigger5SecondFlightNotification(statusMode);
});

app.whenReady().then(() => {
  createWindow();
  createTray();

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
  stopFlyingAnimation();
  if (process.platform !== 'darwin') app.quit();
});
