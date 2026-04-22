import React from 'react';
import { useApp } from '../context/AppContext';

const EXT_CLASS = {
  '.pdf': 'ext-pdf',
  '.doc': 'ext-doc',
  '.docx': 'ext-docx',
  '.txt': 'ext-txt',
  '.png': 'ext-img',
  '.jpg': 'ext-img',
  '.jpeg': 'ext-img',
  '.gif': 'ext-img',
  '.zip': 'ext-zip',
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function FileCard({ file, folderName }) {
  const { deleteFile } = useApp();
  const ext = file.ext || '';
  const extClass = EXT_CLASS[ext] || 'ext-other';
  const label = ext.replace('.', '') || '?';

  const handleDelete = async () => {
    if (window.confirm(`Delete "${file.name}"? This cannot be undone.`)) {
      try {
        await deleteFile(folderName, file.name);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="file-card" id={`file-card-${file.name.replace(/\W/g, '-')}`}>
      <div className={`file-ext-badge ${extClass}`}>{label}</div>
      <div className="file-info">
        <div className="file-name" title={file.name}>{file.name}</div>
        <div className="file-meta">
          {formatBytes(file.size)} · Added {formatDate(file.createdAt)}
        </div>
      </div>
      <button
        className="icon-btn danger"
        onClick={handleDelete}
        title="Delete file"
        id={`delete-file-${file.name.replace(/\W/g, '-')}`}
      >
        🗑
      </button>
    </div>
  );
}
