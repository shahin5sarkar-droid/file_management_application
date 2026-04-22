/* ====================================================================
   FILE VAULT — Full Management Panel Logic
   ==================================================================== */

const sidebarEl = document.getElementById('sidebarFolders');
const mainTitleEl = document.getElementById('mainTitle');
const mainSubEl = document.getElementById('mainSub');
const mainBodyEl = document.getElementById('mainBody');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMsg = document.getElementById('confirmMsg');
const confirmCancel = document.getElementById('confirmCancel');
const confirmOk = document.getElementById('confirmOk');

let folders = [];
let selectedFolderId = null;
let pendingConfirm = null;

// ── Window controls ───────────────────────────────────────────────────
document.getElementById('closeBtn').addEventListener('click', () => window.fileVault.closePanel());
document.getElementById('minBtn').addEventListener('click', () => window.fileVault.minimizePanel());

// ── Confirm dialog ────────────────────────────────────────────────────
function showConfirm(title, msg) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMsg.textContent = msg;
    confirmModal.classList.remove('modal-hidden');
    pendingConfirm = resolve;
  });
}

confirmCancel.addEventListener('click', () => {
  confirmModal.classList.add('modal-hidden');
  if (pendingConfirm) pendingConfirm(false);
});

confirmOk.addEventListener('click', () => {
  confirmModal.classList.add('modal-hidden');
  if (pendingConfirm) pendingConfirm(true);
});

// ── Helpers ───────────────────────────────────────────────────────────
function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
  catch { return ''; }
}

const EXT_MAP = {
  '.pdf':'ext-pdf', '.doc':'ext-doc', '.docx':'ext-doc',
  '.png':'ext-img', '.jpg':'ext-img', '.jpeg':'ext-img', '.gif':'ext-img',
};

function extClass(ext) { return EXT_MAP[ext] || 'ext-other'; }

// ── Load Folders ──────────────────────────────────────────────────────
async function loadFolders() {
  const r = await window.fileVault.listFolders();
  if (r.success) { folders = r.folders; renderSidebar(); }
}

// ── Sidebar ───────────────────────────────────────────────────────────
function renderSidebar() {
  let html = `<div class="sidebar-item ${selectedFolderId === null ? 'active' : ''}" data-id="all">
    🏠 <span style="flex:1">All Folders</span> <span class="count">${folders.length}</span>
  </div>`;

  folders.forEach((f) => {
    html += `<div class="sidebar-item ${selectedFolderId === f.id ? 'active' : ''}" data-id="${f.id}">
      📁 <span style="flex:1">${f.name}</span> <span class="count">${f.fileCount ?? 0}</span>
    </div>`;
  });

  sidebarEl.innerHTML = html;

  sidebarEl.querySelectorAll('.sidebar-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      selectedFolderId = id === 'all' ? null : id;
      renderSidebar();
      renderMain();
    });
  });
}

// ── Main Content ──────────────────────────────────────────────────────
async function renderMain() {
  if (selectedFolderId) {
    const r = await window.fileVault.getFolderContents(selectedFolderId);
    if (!r.success) return;
    mainTitleEl.textContent = `📁 ${r.folder.name}`;
    mainSubEl.textContent = r.folder.path;
    renderFiles(r.files, r.folder.name);
  } else {
    mainTitleEl.textContent = 'All Folders';
    mainSubEl.textContent = `${folders.length} folders`;
    renderFolderGrid();
  }
}

// ── Folder Grid ───────────────────────────────────────────────────────
function renderFolderGrid() {
  if (folders.length === 0) {
    mainBodyEl.innerHTML = `<div class="empty"><div class="icon">🗂️</div><div class="title">No folders yet</div><div>Drop files on the widget to get started</div></div>`;
    return;
  }

  mainBodyEl.innerHTML = `<div class="folder-grid">${folders.map((f) => `
    <div class="folder-card" data-id="${f.id}">
      <div class="actions">
        <div class="icon-btn rename-btn" data-id="${f.id}" data-name="${f.name}" title="Rename">✏️</div>
        <div class="icon-btn danger delete-btn" data-id="${f.id}" data-name="${f.name}" title="Delete">🗑</div>
      </div>
      <div class="emoji">📁</div>
      <div class="name">${f.name}</div>
      <div class="meta">${f.fileCount ?? 0} files</div>
    </div>
  `).join('')}</div>`;

  mainBodyEl.querySelectorAll('.folder-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.icon-btn')) return;
      selectedFolderId = card.dataset.id;
      renderSidebar();
      renderMain();
    });
  });

  mainBodyEl.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await showConfirm('Delete Folder', `Delete "${btn.dataset.name}" and all its files?`);
      if (ok) {
        await window.fileVault.deleteFolder(btn.dataset.id);
        await loadFolders();
        renderMain();
      }
    });
  });

  mainBodyEl.querySelectorAll('.rename-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const newName = prompt('Rename folder:', btn.dataset.name);
      if (newName && newName.trim()) {
        await window.fileVault.renameFolder(btn.dataset.id, newName.trim());
        await loadFolders();
        renderMain();
      }
    });
  });
}

// ── File List ─────────────────────────────────────────────────────────
function renderFiles(files, folderName) {
  if (!files || files.length === 0) {
    mainBodyEl.innerHTML = `<div class="empty"><div class="icon">📭</div><div class="title">This folder is empty</div><div>Drop files on the widget to add them here</div></div>`;
    return;
  }

  mainBodyEl.innerHTML = files.map((f) => `
    <div class="file-item">
      <div class="file-ext ${extClass(f.ext)}">${(f.ext || '?').replace('.','')}</div>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-meta">${formatBytes(f.size)} · ${formatDate(f.createdAt)}</div>
      </div>
      <div class="icon-btn danger file-delete" data-name="${f.name}" data-folder="${folderName}" title="Delete">🗑</div>
    </div>
  `).join('');

  mainBodyEl.querySelectorAll('.file-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await showConfirm('Delete File', `Delete "${btn.dataset.name}"?`);
      if (ok) {
        await window.fileVault.deleteFile(btn.dataset.folder, btn.dataset.name);
        await loadFolders();
        renderMain();
      }
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────
(async () => {
  await loadFolders();
  renderMain();
})();
