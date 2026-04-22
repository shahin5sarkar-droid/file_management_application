import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { folders, selectedFolder, selectFolder } = useApp();

  const totalFiles = folders.reduce((acc, f) => acc + (f.fileCount || 0), 0);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🗂️</div>
          <span className="sidebar-title">File Vault</span>
        </div>
        <div className="sidebar-subtitle">Local file organizer</div>
      </div>

      <nav className="sidebar-folders">
        <div className="sidebar-section-label">Folders</div>

        <div
          className={`sidebar-folder-item ${selectedFolder === null ? 'active' : ''}`}
          onClick={() => selectFolder(null)}
          role="button"
          tabIndex={0}
          id="sidebar-all-folders"
        >
          <span className="sidebar-folder-icon">🏠</span>
          <span className="sidebar-folder-name">All Folders</span>
          <span className="sidebar-folder-count">{folders.length}</span>
        </div>

        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`sidebar-folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
            onClick={() => selectFolder(folder.id)}
            role="button"
            tabIndex={0}
            id={`sidebar-folder-${folder.id}`}
          >
            <span className="sidebar-folder-icon">📁</span>
            <span className="sidebar-folder-name">{folder.name}</span>
            <span className="sidebar-folder-count">{folder.fileCount ?? 0}</span>
          </div>
        ))}

        {folders.length === 0 && (
          <div style={{ padding: '16px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            No folders yet. Drop a file to create one!
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="storage-info">
          <strong>{folders.length}</strong> folders · <strong>{totalFiles}</strong> files
        </div>
        <div className="storage-info" style={{ marginTop: 4 }}>
          ~/Documents/MyAppStorage
        </div>
      </div>
    </aside>
  );
}
