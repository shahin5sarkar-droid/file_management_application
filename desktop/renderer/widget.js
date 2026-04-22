/* ====================================================================
   FILE VAULT WIDGET — Widget Logic

   Interactions:
     - Single-click icon  → expand to show folders + create option
     - Double-click icon  → open ~/Documents/MyAppStorage/ in Finder
     - Click a folder     → open that folder in Finder
     - Drag file over     → expand, drop onto folder to save
     - Escape / ✕ button  → collapse back to icon
   ==================================================================== */

const compactEl = document.getElementById('compact');
const expandedEl = document.getElementById('expanded');
const folderListEl = document.getElementById('folderList');
const dragFileNameEl = document.getElementById('dragFileName');
const newFolderInput = document.getElementById('newFolderInput');
const createFolderBtn = document.getElementById('createFolderBtn');
const toastEl = document.getElementById('toast');

let isExpanded = false;
let folders = [];
let collapseTimer = null;
let lastDragOver = 0;
let isDraggingFile = false;
let clickTimer = null;
let pendingDropFiles = null;  // Holds files dropped before typing a folder name

// ── Toast Helper ──────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  toastEl.textContent = (type === 'success' ? '✅ ' : '❌ ') + message;
  toastEl.className = `toast ${type}`;
  toastEl.classList.remove('hidden');
  clearTimeout(toastEl._timeout);
  toastEl._timeout = setTimeout(() => toastEl.classList.add('hidden'), 2500);
}

// ── Load Folders ──────────────────────────────────────────────────────
async function loadFolders() {
  const result = await window.fileVault.listFolders();
  if (result.success) {
    folders = result.folders;
    renderFolderList();
  }
}

// ── Render Folder List ────────────────────────────────────────────────
function renderFolderList() {
  if (folders.length === 0) {
    folderListEl.innerHTML = `
      <div class="folder-empty">
        <div class="folder-empty-icon">📁</div>
        <div>No folders yet</div>
        <div style="margin-top:4px;color:var(--text-muted)">Create one below</div>
      </div>
    `;
    return;
  }

  folderListEl.innerHTML = folders.map((folder) => `
    <div class="folder-drop-item"
         data-folder-name="${folder.name}"
         data-folder-id="${folder.id}"
         data-folder-path="${folder.path}"
         draggable="false">
      <span class="folder-drop-emoji">📁</span>
      <div class="folder-drop-info">
        <div class="folder-drop-name">${folder.name}</div>
        <div class="folder-drop-meta">${folder.fileCount} ${folder.fileCount === 1 ? 'file' : 'files'}</div>
      </div>
      <span class="folder-drop-badge">${folder.fileCount}</span>
    </div>
  `).join('');

  // Attach handlers to each folder item
  folderListEl.querySelectorAll('.folder-drop-item').forEach((item) => {
    let itemDragCounter = 0;

    // ── Click → open folder in Finder ──
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isDraggingFile) return; // don't open Finder during a drag
      const folderPath = item.dataset.folderPath;
      if (folderPath) {
        window.fileVault.openInFinder(folderPath);
        setTimeout(() => collapseWidget(), 500);
      }
    });

    // ── Drag-and-drop onto folder ──
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      resetCollapseTimer();
    });

    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      itemDragCounter++;
      item.classList.add('drag-over');
      resetCollapseTimer();
    });

    item.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      itemDragCounter--;
      if (itemDragCounter <= 0) {
        itemDragCounter = 0;
        item.classList.remove('drag-over');
      }
    });

    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearCollapseTimer();
      itemDragCounter = 0;
      isDraggingFile = false;
      item.classList.remove('drag-over');
      item.classList.add('saving');

      const folderName = item.dataset.folderName;
      const files = e.dataTransfer.files;

      if (files.length === 0) {
        showToast('No file detected', 'error');
        item.classList.remove('saving');
        return;
      }

      try {
        for (const file of files) {
          const filePath = file.path;
          if (!filePath) {
            showToast('Cannot read file path', 'error');
            continue;
          }
          const result = await window.fileVault.saveFile(filePath, folderName);
          if (result.success) {
            showToast(`Saved "${result.name}"`);
          } else {
            showToast(result.error, 'error');
          }
        }
        await loadFolders();
      } catch (err) {
        showToast(err.message || 'Save failed', 'error');
      } finally {
        item.classList.remove('saving');
      }
    });
  });
}

// ── Expand / Collapse ─────────────────────────────────────────────────
async function expandWidget() {
  if (isExpanded) return;
  isExpanded = true;

  // Expand window first, then show UI
  await window.fileVault.expand();
  await new Promise((r) => setTimeout(r, 150));

  await loadFolders();
  compactEl.classList.add('hidden');
  expandedEl.classList.remove('hidden');

  // Update header text based on context
  const titleEl = document.querySelector('.expanded-title span');
  if (isDraggingFile) {
    titleEl.textContent = 'Drop into folder';
    dragFileNameEl.style.display = '';
  } else {
    titleEl.textContent = 'Your Folders';
    dragFileNameEl.style.display = 'none';
  }
}

function collapseWidget() {
  if (!isExpanded) return;
  isExpanded = false;
  isDraggingFile = false;
  clearCollapseTimer();
  expandedEl.classList.add('hidden');
  compactEl.classList.remove('hidden');
  compactEl.classList.remove('drag-active');
  dragFileNameEl.textContent = '';
  pendingDropFiles = null; // Clear held files on collapse
  newFolderInput.placeholder = "New folder name…";
  document.querySelector('.new-folder-section').classList.remove('has-files');
  window.fileVault.collapse();
}

// ── Collapse Timer (Disabled per user request) ──────────────────────
function resetCollapseTimer() {}
function clearCollapseTimer() {}

// ── Compact Icon: Right-click (two-finger tap) → expand folders ───────
compactEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFile = false;
  expandWidget();
});

// ── Compact Icon: Double-click → open in Finder ───────────────────────
compactEl.addEventListener('dblclick', (e) => {
  e.preventDefault();
  e.stopPropagation();
  window.fileVault.openInFinder();
});

// Block default context menu on the whole document
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// ── Global Drag Detection ─────────────────────────────────────────────

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  isDraggingFile = true;
  resetCollapseTimer();

  if (!isExpanded) {
    compactEl.classList.add('drag-active');
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      dragFileNameEl.textContent = `📄 ${e.dataTransfer.items.length} file(s) ready to drop`;
    }
    expandWidget();
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  resetCollapseTimer();
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  // Don't collapse — timer handles it
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  if (isExpanded && isDraggingFile) {
    showToast('Drop onto a folder to save', 'error');
    resetCollapseTimer();
  }
});

// ── Close Button on Expanded Panel ────────────────────────────────────
const closeBtn = document.createElement('button');
closeBtn.textContent = '✕';
closeBtn.style.cssText = 'position:absolute;top:12px;right:14px;background:none;border:none;color:var(--text-dim);font-size:16px;cursor:pointer;padding:4px;border-radius:4px;transition:all 0.2s;z-index:10;';
closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = 'var(--text)'; closeBtn.style.background = 'rgba(255,255,255,0.08)'; });
closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = 'var(--text-dim)'; closeBtn.style.background = 'none'; });
closeBtn.addEventListener('click', collapseWidget);
document.querySelector('.expanded-header').style.position = 'relative';
document.querySelector('.expanded-header').appendChild(closeBtn);

// ── Create Folder ─────────────────────────────────────────────────────
createFolderBtn.addEventListener('click', createNewFolder);
newFolderInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') createNewFolder();
  if (e.key === 'Escape') collapseWidget();
});

// Drop to hold file, then create folder to save
const newFolderSection = document.querySelector('.new-folder-section');

newFolderSection.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
  resetCollapseTimer();
});

newFolderSection.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  newFolderSection.classList.add('drag-over');
  resetCollapseTimer();
});

newFolderSection.addEventListener('dragleave', (e) => {
  e.stopPropagation();
  newFolderSection.classList.remove('drag-over');
});

newFolderSection.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearCollapseTimer();
  newFolderSection.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length === 0) {
    showToast('No file detected', 'error');
    return;
  }

  // Hold the files in memory
  pendingDropFiles = files;
  
  if (newFolderInput.value.trim()) {
    // A name is already entered — instantly create and save!
    createNewFolder();
  } else {
    // Update UI to prompt for name
    newFolderInput.placeholder = `Save ${files.length} file(s). Enter name...`;
    newFolderSection.classList.add('has-files');
    newFolderInput.focus();
    showToast('File held. Now enter folder name.', 'success');
  }
});

async function createNewFolder() {
  const name = newFolderInput.value.trim();
  if (!name) {
    newFolderInput.focus();
    return;
  }
  createFolderBtn.textContent = '…';
  createFolderBtn.disabled = true;
  try {
    const result = await window.fileVault.createFolder(name);
    if (result.success) {
      // 1. Show success
      showToast(`"${name}" created`);
      newFolderInput.value = '';
      await loadFolders();

      // 2. Save any pending files into the new folder
      if (pendingDropFiles && pendingDropFiles.length > 0) {
        let savedCount = 0;
        for (const file of pendingDropFiles) {
          const filePath = file.path;
          if (!filePath) continue;
          
          const saveRes = await window.fileVault.saveFile(filePath, name);
          if (saveRes.success) savedCount++;
        }
        
        if (savedCount > 0) {
          showToast(`Saved ${savedCount} file(s) to "${name}"`);
        } else {
          showToast('Failed to save held files', 'error');
        }
        
        // Reset state
        pendingDropFiles = null;
        newFolderInput.placeholder = "New folder name…";
        newFolderSection.classList.remove('has-files');
      }
    } else {
      showToast(result.error, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    createFolderBtn.textContent = '+';
    createFolderBtn.disabled = false;
    newFolderInput.focus();
  }
}

// ── Escape to collapse ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') collapseWidget();
});

// ── Collapse when clicking outside ────────────────────────────────────
window.addEventListener('blur', () => {
  if (isExpanded) {
    collapseWidget();
  }
});

// ── Initial load ──────────────────────────────────────────────────────
loadFolders();
