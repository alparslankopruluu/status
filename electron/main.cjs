const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

// Base64 32x32 Owl Tray Icon (Cyan/Green Owl Face)
const OWL_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJ/SURBVHgB7VdNSgNBDJ5m/mwoIjh4FUE8g3gE7wH0CnoQ72H1BF4gHsCDeANBPAiKiKCIIFp/0k7SSScza9tV8GB3kpl8efneZNLEU+O5L/v9fr80Gg3L9Xpd0XW91mg0vubz+S3C4/EYpZTL5S5omibPzs4URVEUhK/i83q93m21WneY2/v9fs113Rt8Fv9bADAYDPh8PjeiKILgHh0djWq12gXedQFA8EwIvhgOh/jC2ePjo1atVq9x3QkAGo1Gk+Vy+Ww4HM6x/y263W48n887zWYT616A6XQ6xOfz+fj8/HzU7/fn+Mz7uFz/T6JcLrcwNz5f8+5iPpvNfnd3d+9xfSfg4+OjtVgsjkwm0wR9e3t7v0ajccv3k8kksdlsjguFwm2xWDwjVigULtFnTNDL5fItvjFvh8PhHq5p8b24uLjDNeNyuYy+7e3toW91dXXp9Xp/d/7g6wDAnp+fXyFm5vN5n6urqyvEX15eYhz+5/P5q5eXFzyjU2x0dHRlAEC4W6vVflAU1Wg0rm9vb08ODw8PCL+8vIS+w8PDI2gPDg6Op9PpsFardc/Ozm4x3qjT6VwbAIvFgnl+fv7j+vr66eDgwEV8fX19xPPx8fF5Pp8v+/3+Hn60vr4+x1jDfr9/iXUvAIBtvdfrDcfjMcW3s7OzH/P5HEE8gvhjY+VwONxDX+n3+/gG3xWLRZf46enpDe7Z7f8D4Pj42B6Px+f49g+/o6Oju1KpdIVvF11t/fPz00f86enpAeL39/df1uv1q7u7uwtc0+b8/HxH340B8F8A/AA4A/AAAPgC6q2H+Jt2v1QAAAAASUVORK5CYR5BAAA';

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
    // Keep popover window active
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL(OWL_ICON_DATA_URL);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show StatusOwl',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
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
