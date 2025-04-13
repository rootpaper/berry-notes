const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, 'assets/icon.ico'),
  });

  mainWindow.loadFile('index.html');
  initDatabase();
  mainWindow.setMenu(null);
}

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'notes.db');

  db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES folders(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      folder_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS note_tags (
      note_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    )`);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.applicationMenu = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (db) {
    db.close();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.on('get-theme', (event) => {
  event.reply('theme-data', nativeTheme.shouldUseDarkColors);
});

ipcMain.on('set-theme', (event, isDark) => {
  event.reply('theme-data', isDark);
});

nativeTheme.on('updated', () => {
  mainWindow.webContents.send('theme-updated', nativeTheme.shouldUseDarkColors);
});

ipcMain.on('get-folders', (event) => {
  db.all(`SELECT * FROM folders`, (err, rows) => {
    event.reply('folders-data', rows || []);
  });
});

ipcMain.on('get-notes', (event, folderId) => {
  const query = folderId
    ? `SELECT * FROM notes WHERE folder_id = ? ORDER BY updated_at DESC`
    : `SELECT * FROM notes ORDER BY updated_at DESC`;

  const params = folderId ? [folderId] : [];

  db.all(query, params, (err, rows) => {
    event.reply('notes-data', rows || []);
  });
});

ipcMain.on('get-note', (event, noteId) => {
  db.get(`SELECT * FROM notes WHERE id = ?`, [noteId], (err, row) => {
    event.reply('note-data', row);
  });
});

ipcMain.on('save-note', (event, note) => {
  const now = new Date().toISOString();

  if (note.id) {
    db.run(
      `UPDATE notes SET title = ?, content = ?, folder_id = ?, updated_at = ? WHERE id = ?`,
      [note.title, note.content, note.folder_id, now, note.id],
      function (err) {
        event.reply('note-saved', { ...note, id: note.id });
      }
    );
  } else {
    db.run(
      `INSERT INTO notes (title, content, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [note.title, note.content, note.folder_id, now, now],
      function (err) {
        event.reply('note-saved', { ...note, id: this.lastID });
      }
    );
  }
});

ipcMain.on('create-folder', (event, folder) => {
  db.run(
    `INSERT INTO folders (name, parent_id) VALUES (?, ?)`,
    [folder.name, folder.parent_id],
    function (err) {
      event.reply('folder-created', { ...folder, id: this.lastID });
    }
  );
});

ipcMain.on('delete-note', (event, noteId) => {
  db.run(`DELETE FROM notes WHERE id = ?`, [noteId], (err) => {
    event.reply('note-deleted', noteId);
  });
});

ipcMain.on('search-notes', (event, searchTerm) => {
  db.all(
    `SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC`,
    [`%${searchTerm}%`, `%${searchTerm}%`],
    (err, rows) => {
      event.reply('search-results', rows || []);
    }
  );
});

ipcMain.on('save-image', async (event, imageData) => {
  try {
    const userDataPath = app.getPath('userData');
    const imagesDir = path.join(userDataPath, 'images');

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imageName = `image_${Date.now()}.png`;
    const imagePath = path.join(imagesDir, imageName);

    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(imagePath, base64Data, 'base64');

    event.reply('image-saved', `file://${imagePath}`);
  } catch (error) {
    event.reply('image-save-error', error.message);
  }
});