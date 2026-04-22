import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderContents, setFolderContents] = useState({ folder: null, files: [] });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders/list');
      const data = await res.json();
      if (data.success) setFolders(data.folders);
    } catch {
      addToast('Could not connect to server', 'error');
    }
  }, [addToast]);

  const fetchFolderContents = useCallback(async (folderId) => {
    if (!folderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/${folderId}/contents`);
      const data = await res.json();
      if (data.success) setFolderContents({ folder: data.folder, files: data.files });
    } catch {
      addToast('Failed to load folder contents', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createFolder = useCallback(async (folderName) => {
    const res = await fetch('/api/folders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName }),
    });
    const data = await res.json();
    if (data.success) {
      await fetchFolders();
      addToast(`Folder "${folderName}" created`, 'success');
      return data.folder;
    }
    throw new Error(data.error);
  }, [fetchFolders, addToast]);

  const deleteFolder = useCallback(async (id, name) => {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchFolders();
      if (selectedFolder === id) { setSelectedFolder(null); setFolderContents({ folder: null, files: [] }); }
      addToast(`Folder "${name}" deleted`, 'success');
    } else throw new Error(data.error);
  }, [fetchFolders, selectedFolder, addToast]);

  const renameFolder = useCallback(async (id, newName) => {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (data.success) {
      await fetchFolders();
      if (selectedFolder === id) await fetchFolderContents(id);
      addToast(`Renamed to "${newName}"`, 'success');
    } else throw new Error(data.error);
  }, [fetchFolders, selectedFolder, fetchFolderContents, addToast]);

  const uploadFile = useCallback(async (file, folderName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderName', folderName);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      await fetchFolders();
      if (selectedFolder) await fetchFolderContents(selectedFolder);
      addToast(`"${file.name}" saved`, 'success');
    } else throw new Error(data.error);
  }, [fetchFolders, selectedFolder, fetchFolderContents, addToast]);

  const deleteFile = useCallback(async (folderName, fileName) => {
    const res = await fetch('/api/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName, fileName }),
    });
    const data = await res.json();
    if (data.success) {
      await fetchFolders();
      if (selectedFolder) await fetchFolderContents(selectedFolder);
      addToast(`"${fileName}" deleted`, 'success');
    } else throw new Error(data.error);
  }, [fetchFolders, selectedFolder, fetchFolderContents, addToast]);

  const selectFolder = useCallback((id) => {
    setSelectedFolder(id);
    if (id) fetchFolderContents(id);
    else setFolderContents({ folder: null, files: [] });
  }, [fetchFolderContents]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  return (
    <AppContext.Provider value={{
      folders, selectedFolder, folderContents, loading, toasts,
      fetchFolders, createFolder, deleteFolder, renameFolder,
      uploadFile, deleteFile, selectFolder, addToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
