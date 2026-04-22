const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const folderService = require('./services/FolderService');
const fileService = require('./services/FileService');

const app = express();
const PORT = 3001;

// Temp upload directory
const TEMP_DIR = path.join(os.tmpdir(), 'file-vault-uploads');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Multer config — store uploads in temp dir first
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ─── FOLDER ROUTES ────────────────────────────────────────────────────────────

// GET /api/folders/list
app.get('/api/folders/list', async (_req, res) => {
  try {
    const folders = await folderService.listFolders();
    res.json({ success: true, folders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/folders/create  { folderName }
app.post('/api/folders/create', async (req, res) => {
  try {
    const { folderName } = req.body;
    if (!folderName) return res.status(400).json({ success: false, error: 'folderName required' });
    const folder = await folderService.createFolder(folderName);
    res.json({ success: true, folder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/folders/:id
app.delete('/api/folders/:id', async (req, res) => {
  try {
    await folderService.deleteFolder(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/folders/:id  { name }
app.put('/api/folders/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name required' });
    const folder = await folderService.renameFolder(req.params.id, name);
    res.json({ success: true, folder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/folders/:id/contents
app.get('/api/folders/:id/contents', async (req, res) => {
  try {
    const data = await folderService.getFolderContents(req.params.id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── FILE ROUTES ──────────────────────────────────────────────────────────────

// POST /api/upload  multipart: file + folderName
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const { folderName } = req.body;
    if (!folderName) return res.status(400).json({ success: false, error: 'folderName required' });

    // Validate file type
    const validation = fileService.isValidFile(req.file.originalname, req.file.size);
    if (!validation.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: validation.reason });
    }

    // Move from temp to destination
    const destPath = await fileService.moveFile(
      req.file.path,
      folderName,
      req.file.originalname
    );

    res.json({ success: true, path: destPath, name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/files  { folderName, fileName }
app.delete('/api/files', async (req, res) => {
  try {
    const { folderName, fileName } = req.body;
    await fileService.deleteFile(folderName, fileName);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🗂  File Vault Server running at http://localhost:${PORT}`);
  console.log(`📁  Storage: ${path.join(process.env.HOME, 'Documents', 'MyAppStorage')}\n`);
});
