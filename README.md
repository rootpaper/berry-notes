# Berry Notes

Berry Notes is a lightweight, Markdown-based note-taking application built with Electron and React. It allows users to organize notes into folders, edit notes in Markdown, and preview them in real-time. The application supports light and dark themes with smooth transitions and a clean, minimalistic interface.

## Features

- **Folder-Based Organization**: Create and manage folders to categorize your notes.
- **Markdown Editor**: Write notes in Markdown with a live preview pane.
- **Theme Support**: Toggle between light and dark themes with smooth transitions.
- **Search Functionality**: Quickly find notes by searching titles and content.
- **Cross-Platform**: Runs on Windows, macOS, and Linux via Electron.
- **Minimalistic UI**: Clean design with no distractions, focusing on note-taking.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/rootpaper/berry-notes.git
   cd berry-notes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Project Structure

```
berry-notes/
├── index.html        # Main HTML file
├── main.js           # Electron main process (window and theme management)
├── app.js            # React application (UI and logic)
├── styles.css        # CSS styles for light and dark themes
├── package.json      # Project metadata and dependencies
└── README.md         # This file
```

## Usage

1. **Create a Folder**:
   - In the sidebar, enter a folder name in the input field and click "Add".
   - Select a folder to view its notes or choose "All Notes" to see everything.

2. **Manage Notes**:
   - Click "New Note" to create a note in the active folder.
   - Edit the note title and content in the Markdown editor.
   - Use the "Delete" button to remove a note.
   - The preview pane updates in real-time as you type.

3. **Search Notes**:
   - Use the search bar in the sidebar to filter notes by title or content.

4. **Switch Themes**:
   - Click the sun/moon icon in the editor toolbar to toggle between light and dark themes.
   - Theme changes are saved and applied instantly with smooth transitions.

## Styling

- **Light Theme**:
  - Background: Light gray (`#f3f4f6`)
  - Selected folders/notes: Soft blue (`#dbeafe`, `#eff6ff`)
  - Text: Dark gray (`#1f2937`)

- **Dark Theme**:
  - Background: Dark gray (`#1f2937`)
  - Selected folders/notes: White (`#ffffff`) with dark text (`#1f2937`)
  - Buttons: White (`#ffffff`) with dark text (`#1f2937`)
  - Text: Light gray (`#f3f4f6`)

- **Transitions**: All color changes (background, text, borders) use `0.3s ease` for smoothness.

## Notes
- **Security**: Currently uses `nodeIntegration: true` and `contextIsolation: false` for simplicity. For production, consider enabling `contextIsolation` and using a `preload.js` script.
- **Markdown Rendering**: Uses `react-markdown` for rendering Markdown content in the preview pane.

## Development

### Dependencies
- `electron`: For building the desktop application
- `react`, `react-dom`: For the UI
- `react-markdown`: For Markdown rendering

### Scripts
- `npm start`: Runs the app in development mode
- `npm run build`: (Optional) Build the app for production (requires additional setup)

### Customization
- **Add Features**: Extend `app.js` to include new functionality like note tagging or export options.
- **Styling**: Modify `styles.css` to adjust colors, layouts, or add new themes.
- **Security**: Update `main.js` to enable `contextIsolation` and add a `preload.js` script.

## Troubleshooting

- **Theme Issues**: If themes don't switch, check the console for errors in `app.js` (theme IPC events).
- **Notes Not Saving**: Ensure `setNotes` updates correctly in `app.js`.
- **UI Glitches**: Verify `styles.css` is loaded in `index.html` and classes match `app.js`.

For detailed debugging, enable DevTools by adding `mainWindow.webContents.openDevTools()` in `main.js`.

## Contributing

Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit changes (`git commit -m "Add feature"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/) and [React](https://reactjs.org/).
- Inspired by minimalistic note-taking apps like Notion and Obsidian.
