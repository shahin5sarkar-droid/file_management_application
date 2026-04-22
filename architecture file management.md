# File Management App Architecture
## Drag-and-Drop File Organization System

---

## 1. SYSTEM OVERVIEW

A desktop/web application that allows users to:
- Drag and drop files (PDFs, documents, etc.)
- Choose to save files into existing folders OR create new folders
- Store all data locally on macOS
- Access folder structure from the app interface

---

## 2. TECHNOLOGY STACK

### Frontend
- **React.js** - UI framework
- **React DnD** or **react-beautiful-dnd** - Drag-and-drop functionality
- **Electron.js** (for desktop app) OR Web-based (runs in browser)
- **Tailwind CSS / Material-UI** - Styling

### Backend (Local)
- **Node.js with Express.js** - File operations & API
- **Electron Main Process** (if desktop app)
- **File System Module (fs)** - Read/write to macOS storage

### Storage
- **macOS File System** - Primary storage
- **JSON Database** (optional) - Track folder metadata
  - Example: `folders.json` to store folder paths & metadata

### Architecture Pattern
- **Electron Architecture** (Recommended for Desktop)
  - Main Process (backend) - handles file operations
  - Renderer Process (frontend) - React UI
- OR **Web + Node Server** (if browser-based)

---

## 3. APPLICATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Drag-and-Drop Zone                        │  │
│  │  (File input area with visual feedback)          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Modal/Dialog Component                       │  │
│  │  • Existing Folders List (dropdown/buttons)      │  │
│  │  • "Create New Folder" Input Field               │  │
│  │  • Confirm/Cancel Buttons                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Folder Management View                       │  │
│  │  • Display existing folders                      │  │
│  │  • Show folder contents                          │  │
│  │  • Delete/Rename folder options                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js/Electron)                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Express Routes / IPC Handlers                │  │
│  │  • POST /api/upload                              │  │
│  │  • POST /api/folders/create                      │  │
│  │  • GET /api/folders/list                         │  │
│  │  • DELETE /api/folders/:id                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     File Service Layer                           │  │
│  │  • Handle file uploads                           │  │
│  │  • Create/delete folders                         │  │
│  │  • Copy files to destination                     │  │
│  │  • Validate file types                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Database Service (folders.json)              │  │
│  │  • Track folder paths & metadata                 │  │
│  │  • Read/write folder information                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↓ File Operations
┌─────────────────────────────────────────────────────────┐
│          macOS FILE SYSTEM (Local Storage)              │
│                                                          │
│  ~/Documents/MyAppStorage/                              │
│  ├── Documents/                                         │
│  │   ├── college_notes.pdf                             │
│  │   └── research.pdf                                  │
│  ├── Projects/                                         │
│  │   ├── project1.pdf                                 │
│  │   └── project2.pdf                                 │
│  └── folders.json (metadata)                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. DETAILED COMPONENT BREAKDOWN

### 4.1 Frontend Components

#### A. DragDropZone Component
```
State:
  - isDragActive (boolean)
  - selectedFile (File object)

Props:
  - onFileDrop(file) - callback function

UI:
  - Dropzone area with visual feedback
  - File preview/name display
  - Drag-over state styling
```

#### B. FolderSelectionModal Component
```
State:
  - existingFolders (array)
  - newFolderName (string)
  - isCreatingNewFolder (boolean)

Props:
  - onSelectFolder(folderPath) - callback
  - onCancel() - callback
  - file (the dropped file)

UI:
  - List of existing folders with select buttons
  - Input field for new folder name
  - Create & Cancel buttons
```

#### C. FolderManagementView Component
```
State:
  - folders (array of folder objects)
  - selectedFolder (string)

UI:
  - Folder list/grid
  - File count badge per folder
  - Delete/Rename/Open folder actions
```

### 4.2 Backend Services

#### A. FileService
```javascript
class FileService {
  // Upload file to folder
  uploadFile(filePath, destinationFolder)
  
  // Copy file from temp to destination
  moveFile(sourcePath, destinationPath)
  
  // Validate file type
  isValidFile(file)
  
  // Get file stats
  getFileInfo(filePath)
}
```

#### B. FolderService
```javascript
class FolderService {
  // Create new folder
  createFolder(folderName, parentPath)
  
  // List all folders
  listFolders()
  
  // Get folder contents
  getFolderContents(folderPath)
  
  // Delete folder
  deleteFolder(folderPath)
  
  // Get folder metadata
  getFolderMetadata(folderId)
}
```

#### C. DatabaseService (folders.json)
```javascript
class DatabaseService {
  // Save folder metadata
  saveFolderMetadata(folder: {
    id, 
    name, 
    path, 
    createdAt, 
    fileCount
  })
  
  // Load all folders
  loadFolders()
  
  // Update folder info
  updateFolder(id, updates)
  
  // Delete folder metadata
  deleteFolderMetadata(id)
}
```

---

## 5. DATA FLOW

### User Action: Drag & Drop File

```
1. User drags college.pdf over drop zone
   ↓
2. Frontend detects drop event
   ↓
3. File preview shown in DragDropZone
   ↓
4. FolderSelectionModal opens
   ↓
5. Backend fetches existing folders via GET /api/folders/list
   ↓
6. Modal displays folders + "Create New" option
   ↓
7. User chooses:
   a) SELECT EXISTING FOLDER
      - POST /api/upload with {file, folderPath}
      - Backend copies file to folder
      - Database updates file count
      - UI shows success
      
   b) CREATE NEW FOLDER
      - User enters folder name
      - POST /api/folders/create with {folderName}
      - Backend creates folder in ~/Documents/MyAppStorage/
      - Database saves folder metadata
      - File automatically saves to new folder
      - UI refreshes folder list
```

---

## 6. FILE STRUCTURE

### Local Storage Directory Structure
```
~/Documents/MyAppStorage/
│
├── folders.json                 # Metadata database
│
├── Documents/                   # User-created folder
│   ├── college_notes.pdf
│   └── research.pdf
│
├── Projects/                    # User-created folder
│   ├── project1.pdf
│   └── project2.pdf
│
└── Reference/                   # User-created folder
    └── textbook.pdf
```

### folders.json Structure
```json
{
  "folders": [
    {
      "id": "folder_001",
      "name": "Documents",
      "path": "/Users/username/Documents/MyAppStorage/Documents",
      "createdAt": "2024-01-15T10:30:00Z",
      "fileCount": 2,
      "files": ["college_notes.pdf", "research.pdf"]
    },
    {
      "id": "folder_002",
      "name": "Projects",
      "path": "/Users/username/Documents/MyAppStorage/Projects",
      "createdAt": "2024-01-16T14:45:00Z",
      "fileCount": 2,
      "files": ["project1.pdf", "project2.pdf"]
    }
  ]
}
```

---

## 7. API ENDPOINTS (if using Node.js server)

### Core Endpoints

| Method | Endpoint | Purpose | Payload |
|--------|----------|---------|---------|
| GET | `/api/folders/list` | Get all folders | - |
| POST | `/api/folders/create` | Create new folder | `{ folderName: string }` |
| DELETE | `/api/folders/:id` | Delete folder | - |
| POST | `/api/upload` | Upload file to folder | `{ file: File, folderPath: string }` |
| GET | `/api/folders/:id/contents` | Get folder contents | - |
| PUT | `/api/folders/:id` | Update folder (rename) | `{ name: string }` |

---

## 8. IMPLEMENTATION APPROACH

### Option A: Desktop App (Recommended)
**Tool: Electron.js**

Pros:
- Full access to file system
- Runs offline
- Better drag-drop UX
- Native macOS integration

Structure:
```
electron-app/
├── main/                    # Electron main process
│   ├── index.js            # App entry
│   ├── preload.js          # Security bridge
│   └── services/           # FileService, FolderService
├── src/                     # React frontend
│   ├── components/         # React components
│   ├── pages/
│   ├── App.jsx
│   └── index.js
├── public/
└── package.json
```

### Option B: Web App + Node Server
**Tools: React + Express.js**

Pros:
- Cross-platform
- Easier deployment

Cons:
- Requires running Node server
- Network overhead (local)

---

## 9. SECURITY CONSIDERATIONS

1. **File Validation**
   - Check file extensions (whitelist: .pdf, .doc, .docx, etc.)
   - Validate file size limits
   - Scan for viruses (optional)

2. **Path Traversal Prevention**
   - Sanitize folder paths
   - Prevent access outside app directory
   - Use absolute paths only

3. **Permissions**
   - Request macOS file access permissions
   - Run with minimal privileges

4. **Data Privacy**
   - All files stored locally (no cloud sync)
   - No external API calls
   - User controls all data

---

## 10. KEY FEATURES ROADMAP

**Phase 1 (MVP)**
- Drag-and-drop file upload
- Create new folders
- Save to existing folders
- View folder structure

**Phase 2**
- Delete/rename folders
- Search files within folders
- File preview
- Recent files section

**Phase 3**
- Folder tagging/categories
- File metadata extraction
- Automated organization (by date, type)
- Sync across devices (optional)

---

## 11. TECHNOLOGY RECOMMENDATIONS

| Component | Technology | Reason |
|-----------|-----------|--------|
| Desktop App | Electron | Native macOS feel, file system access |
| Frontend | React + TypeScript | Type safety, reusable components |
| Styling | Tailwind CSS | Rapid UI development |
| File Operations | Node.js fs module | Native file system access |
| Drag-Drop | react-dnd | Robust, customizable |
| State Management | React Context / Zustand | Lightweight for this scope |
| Database | JSON file (folders.json) | Simple, no external dependencies |

---

## 12. DEVELOPMENT STEPS

1. **Setup Project**
   - Initialize Electron/React project
   - Install dependencies

2. **Build Frontend**
   - Create DragDropZone component
   - Create FolderSelectionModal
   - Create FolderManagementView

3. **Build Backend**
   - Implement FileService
   - Implement FolderService
   - Implement DatabaseService

4. **Connect Frontend to Backend**
   - Setup IPC (Electron) or HTTP (Node)
   - Test upload flow

5. **Add Features**
   - Delete/rename folders
   - File management
   - Error handling

6. **Test & Deploy**
   - Unit tests
   - Integration tests
   - Package for macOS

---

## 13. SAMPLE CODE STRUCTURE

### Backend Example: FileService (Node.js)
```javascript
const fs = require('fs').promises;
const path = require('path');

class FileService {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async uploadFile(sourceFile, destinationFolder) {
    try {
      const fileName = path.basename(sourceFile);
      const destPath = path.join(this.basePath, destinationFolder, fileName);
      
      await fs.copyFile(sourceFile, destPath);
      return { success: true, path: destPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = FileService;
```

### Frontend Example: DragDropZone (React)
```jsx
import React, { useState } from 'react';

const DragDropZone = ({ onFileDrop }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    onFileDrop(file);
  };

  return (
    <div
      onDragOver={handleDrag}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-4 border-dashed p-12 text-center cursor-pointer
        ${isDragging ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'}`}
    >
      <p className="text-lg font-semibold">Drag your file here</p>
      <p className="text-sm text-gray-500">or click to browse</p>
    </div>
  );
};

export default DragDropZone;
```

---

## SUMMARY

This architecture provides:
✅ Local-only storage (no cloud)
✅ Simple folder management
✅ Drag-and-drop UX
✅ Scalable backend
✅ Secure file operations
✅ Easy to extend with new features
