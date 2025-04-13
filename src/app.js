import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { FiSun, FiMoon, FiFolder, FiPlus, FiSearch, FiTag, FiSave, FiTrash2, FiEye, FiEdit, FiImage } from 'react-icons/fi';

const { ipcRenderer } = window.require('electron');

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
});

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    ipcRenderer.send('get-theme');
    ipcRenderer.on('theme-data', (event, isDark) => {
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    });
    ipcRenderer.on('theme-updated', (event, isDark) => {
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    });

    ipcRenderer.send('get-folders');
    ipcRenderer.send('get-notes');

    ipcRenderer.on('folders-data', (event, data) => {
      setFolders(data);
    });

    ipcRenderer.on('notes-data', (event, data) => {
      setNotes(data);
    });

    ipcRenderer.on('note-data', (event, data) => {
      setActiveNote(data);
    });

    ipcRenderer.on('note-saved', (event, data) => {
      if (selectedNote === data.id || !selectedNote) {
        setSelectedNote(data.id);
        setActiveNote(data);
      }
      refreshNotes();
    });

    ipcRenderer.on('folder-created', (event, data) => {
      setFolders([...folders, data]);
      setShowNewFolderInput(false);
      setNewFolderName('');
    });

    ipcRenderer.on('note-deleted', (event, noteId) => {
      if (selectedNote === noteId) {
        setSelectedNote(null);
        setActiveNote(null);
      }
      refreshNotes();
    });

    ipcRenderer.on('search-results', (event, data) => {
      setNotes(data);
    });



    return () => {
      ipcRenderer.removeAllListeners('theme-data');
      ipcRenderer.removeAllListeners('theme-updated');
      ipcRenderer.removeAllListeners('folders-data');
      ipcRenderer.removeAllListeners('notes-data');
      ipcRenderer.removeAllListeners('note-data');
      ipcRenderer.removeAllListeners('note-saved');
      ipcRenderer.removeAllListeners('folder-created');
      ipcRenderer.removeAllListeners('note-deleted');
      ipcRenderer.removeAllListeners('search-results');
    };
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      ipcRenderer.send('get-notes', selectedFolder);
    } else {
      ipcRenderer.send('get-notes');
    }
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedNote) {
      ipcRenderer.send('get-note', selectedNote);
    } else {
      setActiveNote(null);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (searchTerm) {
      ipcRenderer.send('search-notes', searchTerm);
    } else {
      refreshNotes();
    }
  }, [searchTerm]);

  const refreshNotes = () => {
    if (selectedFolder) {
      ipcRenderer.send('get-notes', selectedFolder);
    } else {
      ipcRenderer.send('get-notes');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    ipcRenderer.send('set-theme', newDarkMode);
  };

  const createNewNote = () => {
    const newNote = {
      title: 'New Note',
      content: '',
      folder_id: selectedFolder,
    };

    setActiveNote(newNote);
    setIsPreviewMode(false);
    ipcRenderer.send('save-note', newNote);
  };

  const saveNote = () => {
    if (activeNote) {
      ipcRenderer.send('save-note', activeNote);
    }
  };

  const deleteNote = () => {
    if (selectedNote && confirm('Are you sure you want to delete this note?')) {
      ipcRenderer.send('delete-note', selectedNote);
    }
  };

  const createFolder = () => {
    if (newFolderName.trim() === '') return;

    const newFolder = {
      name: newFolderName,
      parent_id: null,
    };

    ipcRenderer.send('create-folder', newFolder);
  };

  const handleEditorChange = (e) => {
    setActiveNote({
      ...activeNote,
      content: e.target.value,
    });
  };

  const handleTitleChange = (e) => {
    setActiveNote({
      ...activeNote,
      title: e.target.value,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {

    };
    reader.readAsDataURL(file);
  };

  const insertImageToEditor = (imagePath) => {
    if (!editorRef.current) return;
    if (!activeNote) {
      const newNote = {
        title: 'New Note',
        content: '',
        folder_id: selectedFolder,
      };
      setActiveNote(newNote);
      ipcRenderer.send('save-note', newNote);
      setActiveNote((prev) => ({
        ...prev,
        content: `![image](${imagePath})`,
      }));
      return;
    }

    const cursorPosition = editorRef.current.selectionStart;
    const textBeforeCursor = activeNote.content.substring(0, cursorPosition);
    const textAfterCursor = activeNote.content.substring(cursorPosition);
    const imageMarkdown = `![image](${imagePath})`;

    setActiveNote({
      ...activeNote,
      content: textBeforeCursor + imageMarkdown + textAfterCursor,
    });

    setTimeout(() => {
      editorRef.current.focus();
      editorRef.current.selectionStart = cursorPosition + imageMarkdown.length;
      editorRef.current.selectionEnd = cursorPosition + imageMarkdown.length;
    }, 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      if (file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = function (event) {
          ipcRenderer.send('save-image', event.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const sanitizedMarkdown = activeNote && DOMPurify.sanitize(marked(activeNote.content || ''));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveNote();
      }

      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeNote]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold">Berry Notes</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Folders</h2>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>

            {showNewFolderInput && (
              <div className="flex mb-2">
                <input
                  type="text"
                  placeholder="Folder name"
                  className="flex-grow p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                />
                <button
                  className="px-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                  onClick={createFolder}
                >
                  Add
                </button>
              </div>
            )}

            <ul>
              <li
                className={`py-1 px-2 rounded cursor-pointer flex items-center ${
                  selectedFolder === null
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedFolder(null)}
              >
                <FiFolder className="mr-2" /> All Notes
              </li>
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className={`py-1 px-2 rounded cursor-pointer flex items-center ${
                    selectedFolder === folder.id
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <FiFolder className="mr-2" /> {folder.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="w-80 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Notes</h2>
          <button
            onClick={createNewNote}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
          >
            <FiPlus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No notes found' : 'No notes yet'}
            </div>
          ) : (
            <ul>
              {notes.map((note) => (
                <li
                  key={note.id}
                  className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer ${
                    selectedNote === note.id
                      ? 'bg-blue-50 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedNote(note.id)}
                >
                  <h3 className="font-medium truncate">{note.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {note.content.replace(
                      /#{1,6}\s|!\[.*?\]\(.*?\)|```[\s\S]*?```|\[.*?\]\(.*?\)|<.*?>|(\*\*|\*|__|_)(.*?)\1/g,
                      '$2'
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDate(note.updated_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-grow h-full flex flex-col">
        {activeNote ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <input
                type="text"
                className="text-xl font-bold bg-transparent border-0 focus:outline-none focus:ring-0 w-full"
                value={activeNote.title || ''}
                onChange={handleTitleChange}
                placeholder="Note title"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
                >
                  {isPreviewMode ? <FiEdit className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
               
                <button
                  onClick={saveNote}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Save Note"
                >
                  <FiSave className="h-5 w-5" />
                </button>
                <button
                  onClick={deleteNote}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
                  title="Delete Note"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-hidden flex">
              {!isPreviewMode && (
                <textarea
                  ref={editorRef}
                  className="flex-grow p-4 resize-none focus:outline-none font-mono"
                  value={activeNote.content || ''}
                  onChange={handleEditorChange}
                  placeholder="Start writing your note here... (Markdown supported)"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              )}

              <div
                className={`${
                  isPreviewMode ? 'flex-grow' : 'w-1/2'
                } p-4 overflow-y-auto border-l border-gray-200 dark:border-gray-700 markdown-preview`}
                dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Select or create a note to get started</p>
              <button
                onClick={createNewNote}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));