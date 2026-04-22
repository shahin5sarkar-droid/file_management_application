const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const folderService = require('./services/FolderService');
const fileService = require('./services/FileService');

let widgetWin = null;
let panelWin = null;

const WIDGET_SIZE = 80;
const EXPANDED_WIDTH = 320;
const EXPANDED_HEIGHT = 440;

function createWidgetWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  widgetWin = new BrowserWindow({
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    x: screenW - WIDGET_SIZE - 40,
    y: screenH - WIDGET_SIZE - 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    acceptFirstMouse: true,       // Grab drag events immediately
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widgetWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Allow the widget to receive dragged files
  widgetWin.webContents.on('will-navigate', (e) => e.preventDefault());
}

function createPanelWindow() {
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.focus();
    return;
  }

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  panelWin = new BrowserWindow({
    width: 850,
    height: 620,
    x: Math.round((screenW - 850) / 2),
    y: Math.round((screenH - 620) / 2),
    frame: false,
    transparent: true,
    resizable: true,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  panelWin.loadFile(path.join(__dirname, 'renderer', 'panel.html'));
  panelWin.on('closed', () => { panelWin = null; });
}

// ── Widget resize IPC ─────────────────────────────────────────────────
ipcMain.handle('widget:expand', () => {
  if (!widgetWin) return;
  const [x, y] = widgetWin.getPosition();
  // Expand upward and to the left so it stays in the corner
  widgetWin.setBounds({
    x: x - (EXPANDED_WIDTH - WIDGET_SIZE),
    y: y - (EXPANDED_HEIGHT - WIDGET_SIZE),
    width: EXPANDED_WIDTH,
    height: EXPANDED_HEIGHT,
  });
});

ipcMain.handle('widget:collapse', () => {
  if (!widgetWin) return;
  const [x, y] = widgetWin.getPosition();
  widgetWin.setBounds({
    x: x + (EXPANDED_WIDTH - WIDGET_SIZE),
    y: y + (EXPANDED_HEIGHT - WIDGET_SIZE),
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
  });
});

ipcMain.handle('widget:openPanel', () => {
  createPanelWindow();
});

ipcMain.handle('widget:openInFinder', (_e, folderPath) => {
  const targetPath = folderPath || path.join(require('os').homedir(), 'Documents', 'MyAppStorage');
  shell.openPath(targetPath);
});

ipcMain.handle('panel:close', () => {
  if (panelWin && !panelWin.isDestroyed()) panelWin.close();
});

ipcMain.handle('panel:minimize', () => {
  if (panelWin && !panelWin.isDestroyed()) panelWin.minimize();
});

// ── Folder / File IPC ─────────────────────────────────────────────────
ipcMain.handle('folders:list', async () => {
  try {
    return { success: true, folders: await folderService.listFolders() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folders:create', async (_e, folderName) => {
  try {
    const folder = await folderService.createFolder(folderName);
    return { success: true, folder };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folders:delete', async (_e, id) => {
  try {
    await folderService.deleteFolder(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folders:rename', async (_e, id, newName) => {
  try {
    const folder = await folderService.renameFolder(id, newName);
    return { success: true, folder };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('folders:contents', async (_e, id) => {
  try {
    const data = await folderService.getFolderContents(id);
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('files:save', async (_e, filePath, folderName) => {
  try {
    const result = await fileService.saveFileFromPath(filePath, folderName);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('files:delete', async (_e, folderName, fileName) => {
  try {
    await fileService.deleteFile(folderName, fileName);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── App lifecycle ─────────────────────────────────────────────────────
app.whenReady().then(createWidgetWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
});
