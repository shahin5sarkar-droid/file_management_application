import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import FileCard from './FileCard';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-dialog">
        <h3>⚠️ Confirm Delete</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel} id="confirm-cancel">Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} id="confirm-delete">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function FolderManagementView() {
  const { folders, selectedFolder, folderContents, loading, deleteFolder, renameFolder, selectFolder } = useApp();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  const handleRenameStart = (folder, e) => {
    e.stopPropagation();
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  };

  const handleRenameCommit = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      await renameFolder(id, renameValue.trim());
    } catch (err) {
      alert(err.message);
    } finally {
      setRenamingId(null);
    }
  };

  const handleDeleteClick = (folder, e) => {
    e.stopPropagation();
    setConfirmDelete(folder);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await deleteFolder(confirmDelete.id, confirmDelete.name);
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  // ── Folder selected: show contents ──
  if (selectedFolder) {
    const { folder, files } = folderContents;
    return (
      <div>
        <div className="section-header">
          <div>
            <div className="section-title">
              📁 {folder?.name || '…'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
              {folder?.path}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => selectFolder(null)} id="back-to-folders-btn">
            ← All Folders
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
            <div>Loading files…</div>
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">This folder is empty</div>
            <div className="empty-state-sub">Drag and drop files above to add them here</div>
          </div>
        ) : (
          <div className="files-list">
            {files.map((file) => (
              <FileCard key={file.name} file={file} folderName={folder?.name} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── All folders grid view ──
  return (
    <div>
      <div className="section-header">
        <span className="section-title">All Folders</span>
        <span className="section-count">{folders.length} folders</span>
      </div>

      {folders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <div className="empty-state-title">No folders yet</div>
          <div className="empty-state-sub">Drop a file above to create your first folder</div>
        </div>
      ) : (
        <div className="folders-grid">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="folder-card"
              onClick={() => renamingId !== folder.id && selectFolder(folder.id)}
              id={`folder-card-${folder.id}`}
            >
              <div className="folder-card-actions">
                <button
                  className="icon-btn"
                  onClick={(e) => handleRenameStart(folder, e)}
                  title="Rename folder"
                  id={`rename-folder-${folder.id}`}
                >✏️</button>
                <button
                  className="icon-btn danger"
                  onClick={(e) => handleDeleteClick(folder, e)}
                  title="Delete folder"
                  id={`delete-folder-${folder.id}`}
                >🗑</button>
              </div>

              <span className="folder-emoji">📁</span>

              {renamingId === folder.id ? (
                <input
                  className="rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameCommit(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCommit(folder.id);
                    if (e.key === 'Escape') setRenamingId(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  id={`rename-input-${folder.id}`}
                />
              ) : (
                <div className="folder-card-name" title={folder.name}>{folder.name}</div>
              )}

              <div className="folder-card-meta">
                {folder.fileCount ?? 0} {folder.fileCount === 1 ? 'file' : 'files'}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete folder "${confirmDelete.name}" and all its files? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
