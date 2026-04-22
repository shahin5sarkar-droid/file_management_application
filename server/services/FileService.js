const fs = require('fs').promises;
const path = require('path');

const BASE_PATH = path.join(process.env.HOME, 'Documents', 'MyAppStorage');

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg',
  '.gif', '.mp4', '.mp3', '.zip', '.csv', '.xlsx', '.pptx',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

class FileService {
  safePath(relativeFolder, fileName) {
    const resolved = path.resolve(BASE_PATH, relativeFolder, fileName || '');
    if (!resolved.startsWith(BASE_PATH)) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }

  isValidFile(originalName, size) {
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, reason: `File type ${ext} not allowed` };
    }
    if (size > MAX_FILE_SIZE) {
      return { valid: false, reason: 'File exceeds 100 MB limit' };
    }
    return { valid: true };
  }

  async moveFile(sourcePath, folderName, fileName) {
    const destPath = this.safePath(folderName, fileName);
    await fs.copyFile(sourcePath, destPath);
    await fs.unlink(sourcePath);
    return destPath;
  }

  async deleteFile(folderName, fileName) {
    const filePath = this.safePath(folderName, fileName);
    await fs.unlink(filePath);
  }

  async getFileInfo(folderName, fileName) {
    const filePath = this.safePath(folderName, fileName);
    const stat = await fs.stat(filePath);
    return {
      name: fileName,
      size: stat.size,
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
      ext: path.extname(fileName).toLowerCase(),
    };
  }

  async getFolderFiles(folderName) {
    const folderPath = this.safePath(folderName, '');
    let entries;
    try {
      entries = await fs.readdir(folderPath);
    } catch {
      return [];
    }
    const files = await Promise.all(
      entries.map(async (name) => {
        const fullPath = path.join(folderPath, name);
        const stat = await fs.stat(fullPath);
        if (!stat.isFile()) return null;
        return {
          name,
          size: stat.size,
          createdAt: stat.birthtime,
          modifiedAt: stat.mtime,
          ext: path.extname(name).toLowerCase(),
        };
      })
    );
    return files.filter(Boolean);
  }
}

module.exports = new FileService();
