const fs = require('fs').promises;
const path = require('path');

const BASE_PATH = path.join(require('os').homedir(), 'Documents', 'MyAppStorage');

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg',
  '.gif', '.mp4', '.mp3', '.zip', '.csv', '.xlsx', '.pptx',
];

class FileService {
  safePath(folderName, fileName) {
    const resolved = path.resolve(BASE_PATH, folderName, fileName || '');
    if (!resolved.startsWith(BASE_PATH)) throw new Error('Path traversal detected');
    return resolved;
  }

  isValidFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, reason: `File type ${ext} not allowed` };
    }
    return { valid: true };
  }

  async saveFileFromPath(sourcePath, folderName) {
    const fileName = path.basename(sourcePath);
    const validation = this.isValidFile(fileName);
    if (!validation.valid) throw new Error(validation.reason);

    const destPath = this.safePath(folderName, fileName);

    // Ensure folder exists
    const folderPath = path.dirname(destPath);
    await fs.mkdir(folderPath, { recursive: true });

    await fs.copyFile(sourcePath, destPath);
    return { name: fileName, path: destPath };
  }

  async deleteFile(folderName, fileName) {
    const filePath = this.safePath(folderName, fileName);
    await fs.unlink(filePath);
  }

  async getFolderFiles(folderName) {
    const folderPath = this.safePath(folderName, '');
    let entries;
    try { entries = await fs.readdir(folderPath); } catch { return []; }
    const files = await Promise.all(
      entries.map(async (name) => {
        const fullPath = path.join(folderPath, name);
        const stat = await fs.stat(fullPath);
        if (!stat.isFile()) return null;
        return { name, size: stat.size, createdAt: stat.birthtime, ext: path.extname(name).toLowerCase() };
      })
    );
    return files.filter(Boolean);
  }
}

module.exports = new FileService();
