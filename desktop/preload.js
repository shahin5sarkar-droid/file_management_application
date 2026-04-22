const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileVault', {
  // Widget controls
  expand: () => ipcRenderer.invoke('widget:expand'),
  collapse: () => ipcRenderer.invoke('widget:collapse'),
  openPanel: () => ipcRenderer.invoke('widget:openPanel'),
  openInFinder: (folderPath) => ipcRenderer.invoke('widget:openInFinder', folderPath),

  // Panel controls
  closePanel: () => ipcRenderer.invoke('panel:close'),
  minimizePanel: () => ipcRenderer.invoke('panel:minimize'),

  // Folder operations
  listFolders: () => ipcRenderer.invoke('folders:list'),
  createFolder: (name) => ipcRenderer.invoke('folders:create', name),
  deleteFolder: (id) => ipcRenderer.invoke('folders:delete', id),
  renameFolder: (id, newName) => ipcRenderer.invoke('folders:rename', id, newName),
  getFolderContents: (id) => ipcRenderer.invoke('folders:contents', id),

  // File operations
  saveFile: (filePath, folderName) => ipcRenderer.invoke('files:save', filePath, folderName),
  deleteFile: (folderName, fileName) => ipcRenderer.invoke('files:delete', folderName, fileName),
});
