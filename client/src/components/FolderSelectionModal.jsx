import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function FolderSelectionModal({ file, onClose }) {
  const { folders, createFolder, uploadFile } = useApp();
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (folders.length > 0 && !selectedFolderName) {
      setSelectedFolderName(folders[0].name);
    }
  }, [folders]);

  const handleNewFolderCreate = async () => {
    if (!newFolderName.trim()) return;
    setIsCreating(true);
    try {
      const folder = await createFolder(newFolderName.trim());
      setSelectedFolderName(folder.name);
      setNewFolderName('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFolderName) return;
    setUploading(true);
    try {
      await uploadFile(file, selectedFolderName);
      onClose();
    } catch (err) {
      alert(err.message);
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && newFolderName.trim()) handleNewFolderCreate();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="modal" role="dialog" aria-labelledby="modal-title">
        <div className="modal-header">
          <div className="modal-title" id="modal-title">Save file to folder</div>
          <div className="modal-file-info">
            📄 {file.name} &nbsp;·&nbsp; {formatBytes(file.size)}
          </div>
        </div>

        <div className="modal-body">
          {folders.length > 0 && (
            <>
              <div className="modal-section-label">Existing folders</div>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`folder-option ${selectedFolderName === folder.name ? 'selected' : ''}`}
                  onClick={() => setSelectedFolderName(folder.name)}
                  role="button"
                  tabIndex={0}
                  id={`modal-folder-${folder.id}`}
                >
                  <span style={{ fontSize: '20px' }}>📁</span>
                  <span className="folder-option-name">{folder.name}</span>
                  <span className="folder-option-count">{folder.fileCount ?? 0} files</span>
                  {selectedFolderName === folder.name && (
                    <span style={{ color: 'var(--accent)', fontSize: '16px' }}>✓</span>
                  )}
                </div>
              ))}
            </>
          )}

          <div className="modal-section-label">Create new folder</div>
          <div className="new-folder-row">
            <input
              type="text"
              className="input"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewFolderCreate()}
              id="new-folder-input"
              autoComplete="off"
            />
            <button
              className="btn btn-secondary"
              onClick={handleNewFolderCreate}
              disabled={!newFolderName.trim() || isCreating}
              id="create-folder-btn"
            >
              {isCreating ? <span className="spinner" /> : '+ Create'}
            </button>
          </div>

          {folders.length === 0 && !newFolderName && (
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 8 }}>
              No folders yet. Create one above to get started.
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} id="modal-cancel-btn">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFolderName || uploading}
            id="modal-save-btn"
          >
            {uploading ? <><span className="spinner" /> Saving…</> : '💾 Save to Folder'}
          </button>
        </div>
      </div>
    </div>
  );
}
