const fs = require('fs').promises;
const path = require('path');

const BASE_PATH = path.join(process.env.HOME, 'Documents', 'MyAppStorage');
const DB_PATH = path.join(BASE_PATH, 'folders.json');

class DatabaseService {
  async ensureDb() {
    try {
      await fs.access(BASE_PATH);
    } catch {
      await fs.mkdir(BASE_PATH, { recursive: true });
    }
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify({ folders: [] }, null, 2));
    }
  }

  async loadFolders() {
    await this.ensureDb();
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw).folders;
  }

  async saveFolderMetadata(folder) {
    await this.ensureDb();
    const data = await this.loadFolders();
    data.push(folder);
    await fs.writeFile(DB_PATH, JSON.stringify({ folders: data }, null, 2));
    return folder;
  }

  async updateFolder(id, updates) {
    await this.ensureDb();
    const folders = await this.loadFolders();
    const idx = folders.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Folder not found');
    folders[idx] = { ...folders[idx], ...updates };
    await fs.writeFile(DB_PATH, JSON.stringify({ folders }, null, 2));
    return folders[idx];
  }

  async deleteFolderMetadata(id) {
    await this.ensureDb();
    const folders = await this.loadFolders();
    const filtered = folders.filter((f) => f.id !== id);
    await fs.writeFile(DB_PATH, JSON.stringify({ folders: filtered }, null, 2));
  }
}

module.exports = new DatabaseService();
