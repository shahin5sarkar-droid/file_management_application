import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import DragDropZone from './components/DragDropZone';
import FolderSelectionModal from './components/FolderSelectionModal';
import FolderManagementView from './components/FolderManagementView';

function ToastList() {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function MainApp() {
  const { selectedFolder } = useApp();
  const [droppedFile, setDroppedFile] = useState(null);

  const headerTitle = selectedFolder
    ? 'Folder Contents'
    : 'File Vault';
  const headerSub = selectedFolder
    ? 'Browse and manage files in this folder'
    : 'Drag & drop files to organize them into folders';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-panel">
        <header className="main-header">
          <div>
            <h1>{headerTitle}</h1>
            <p>{headerSub}</p>
          </div>
        </header>
        <div className="main-content">
          <DragDropZone onFileDrop={setDroppedFile} />
          <FolderManagementView />
        </div>
      </main>

      {droppedFile && (
        <FolderSelectionModal
          file={droppedFile}
          onClose={() => setDroppedFile(null)}
        />
      )}

      <ToastList />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
