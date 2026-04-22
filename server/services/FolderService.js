const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./DatabaseService');

const BASE_PATH = path.join(process.env.HOME, 'Documents', 'MyAppStorage');

class FolderService {
  safeFolderPath(name) {
    const resolved = path.resolve(BASE_PATH, name);
    if (!resolved.startsWith(BASE_PATH)) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }

  async createFolder(folderName) {
    const sanitized = folderName.replace(/[^a-zA-Z0-9 _\-]/g, '').trim();
    if (!sanitized) throw new Error('Invalid folder name');
    const folderPath = this.safeFolderPath(sanitized);
    await fs.mkdir(folderPath, { recursive: true });

    const metadata = {
      id: uuidv4(),
      name: sanitized,
      path: folderPath,
      createdAt: new Date().toISOString(),
      fileCount: 0,
      files: [],
    };
    await db.saveFolderMetadata(metadata);
    return metadata;
  }

  async listFolders() {
    const folders = await db.loadFolders();
    // Sync real file counts from disk
    const synced = await Promise.all(
      folders.map(async (folder) => {
        try {
          const entries = await fs.readdir(folder.path);
          const fileCount = entries.length;
          return { ...folder, fileCount };
        } catch {
          return { ...folder, fileCount: 0 };
        }
      })
    );
    return synced;
  }

  async getFolderContents(id) {
    const folders = await db.loadFolders();
    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new Error('Folder not found');
    const fileService = require('./FileService');
    const files = await fileService.getFolderFiles(folder.name);
    return { folder, files };
  }

  async deleteFolder(id) {
    const folders = await db.loadFolders();
    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new Error('Folder not found');
    await fs.rm(folder.path, { recursive: true, force: true });
    await db.deleteFolderMetadata(id);
  }

  async renameFolder(id, newName) {
    const sanitized = newName.replace(/[^a-zA-Z0-9 _\-]/g, '').trim();
    if (!sanitized) throw new Error('Invalid folder name');
    const folders = await db.loadFolders();
    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new Error('Folder not found');

    const newPath = this.safeFolderPath(sanitized);
    await fs.rename(folder.path, newPath);
    const updated = await db.updateFolder(id, { name: sanitized, path: newPath });
    return updated;
  }
}

module.exports = new FolderService();
