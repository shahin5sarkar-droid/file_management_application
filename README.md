# File Vault Widget 🗂️

A native macOS desktop widget built with Electron. File Vault acts as a compact, always-on-top drop zone on your desktop, allowing you to instantly organize files into folders without opening Finder windows.

## Features

- **Always on top:** A small unobtrusive widget that sits in the corner of your screen.
- **Drag & Drop Organization:** Drag files from anywhere and drop them directly into your predefined folders.
- **Instant Folder Creation:** Drop a file onto the "+" icon to instantly create a new folder and save the file inside it.
- **Full Management Panel:** A complete built-in file manager to rename, delete, and view your stored files.
- **Local Storage:** All files are stored safely on your local machine at `~/Documents/MyAppStorage/`.

---

## 🚀 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your Mac.

### 1. Clone the repository
```bash
git clone https://github.com/shahin5sarkar-droid/file_management_application.git
cd file_management_application
```

### 2. Install Dependencies
Navigate to the `desktop` directory where the Electron app lives and install the required packages:
```bash
cd desktop
npm install
```

### 3. Run the App
Launch the widget by running:
```bash
npm start
```
*The widget will appear in the bottom-right corner of your screen.*

---

## 📖 How to Use

The widget is designed around simple mouse gestures and drag-and-drop:

| Action | Result |
|---|---|
| **Two-finger tap (Right-click)** on icon | Expands the widget to show your folder list |
| **Double-click** on icon | Opens the main storage directory in Finder |
| **Drag a file** over the icon | Expands the widget to show drop zones |
| **Drop a file** onto a folder | Saves the file into that folder and collapses the widget |
| **Click a folder** in the list | Opens that specific folder in Finder |

### How to Create a New Folder & Save a File
1. Expand the widget (Two-finger tap).
2. Drag your file and drop it into the "New folder name..." area at the bottom.
3. The widget will turn green and "hold" your file.
4. Type the name of your new folder.
5. Press **Enter**. The folder is created and your file is instantly saved inside it.

---

## Architecture
- **Framework:** Electron.js (Main process & Renderer)
- **Styling:** Vanilla CSS (Glassmorphism & Dark Mode)
- **Storage:** Local File System (`fs`) with metadata tracked in a local `folders.json` database.
