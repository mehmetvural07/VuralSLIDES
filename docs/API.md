# IPC API Reference

All renderer ↔ main process communication flows through `preload.js` via `contextBridge.exposeInMainWorld('electronAPI', ...)`.

## Config

### `getConfig()`
- **Returns**: `Config` object
- **Description**: Loads full config from `oslide2_config.json` in `userData`.

### `saveConfig(config)`
- **Params**: `config` — full config object
- **Returns**: `true`
- **Description**: Writes config to disk.

---

## Project Operations

### `openEditor(projectData)`
- **Params**: `projectData` — slide data with optional `_projectId`, `_projectName`, `_projectPath`, `_projectTheme`, `_fromFile`
- **Description**: Opens (or focuses) the editor window and sends `load-project` with the data. Hides the home window.

### `returnHome()`
- **Description**: Shows the home window and sends `refresh-home`.

### `createProjectFile({ projectId, name, slideData })`
- **Returns**: `filePath` (string) or `null`
- **Description**: Saves a `.slidelab` file to `{userData}/projects/{projectId}.slidelab` and updates the project's `path` in config.

### `updateProjectMeta({ projectId, slideCount, path, thumbnail })`
- **Returns**: `true` / `false`
- **Description**: Updates a project's metadata in the config (slide count, last modified, file path, thumbnail).

---

## File Operations

### `saveFile(data, filePath)`
- **Returns**: `filePath` (string) or `null`
- **Description**: If `filePath` is provided, writes data directly. Otherwise opens a save dialog.

### `saveFileAs(data)`
- **Returns**: `filePath` (string) or `null`
- **Description**: Opens a save dialog and writes data to the chosen path.

### `openFileDialog()`
- **Returns**: `{ data, filePath, fileName }` or `null`
- **Description**: Opens a file picker for `.slidelab` files. Returns parsed JSON, full path, and base file name (without extension).

### `readFile(filePath)`
- **Returns**: Parsed JSON or `null`
- **Description**: Reads and parses a `.slidelab` file from disk.

### `deleteFile(filePath)`
- **Returns**: `true` / `false`
- **Description**: Deletes a file from disk.

### `duplicateFile({ sourcePath, newId, name })`
- **Returns**: `newFilePath` (string) or `null`
- **Description**: Copies a `.slidelab` file to a new ID under `{userData}/projects/`.

---

## Export / Import

### `exportProject({ projectId, name, slideData })`
- **Returns**: `filePath` (string) or `null`
- **Description**: Save dialog → writes `.slidelab` file.

### `importProject()`
- **Returns**: `{ filePath, slideData }` or `null`
- **Description**: Open dialog → reads `.slidelab` file.

### `exportPDF(htmlContent)`
- **Returns**: `true` / `false`
- **Description**: Opens save dialog → renders HTML in offscreen `BrowserWindow` → `printToPDF()` → writes `.pdf`.

### `exportPNG(data)`
- **Returns**: `true` / `false`
- **Description**: Directory picker → renders each slide in offscreen `BrowserWindow` → `capturePage()` → writes `slide-001.png` etc.

---

## Image

### `openImageDialog()`
- **Returns**: `{ data (base64), mime, name }` or `null`
- **Description**: Opens a file picker for `png/jpg/gif/webp`, reads the file as base64.

### `readImage(filePath)` (declared in preload but not implemented in main.js)
- Note: This channel name is exposed in preload but has no corresponding `ipcMain.handle('read-image')` in main.js.

---

## Presentation

### `startPresentation(data)`
- **Description**: Creates a fullscreen, frameless `BrowserWindow` and sends `presentation-data`.

---

## Thumbnail

### `generateThumbnail(slideData)`
- **Returns**: `base64` data URL or `null`
- **Description**: Renders a slide in offscreen `BrowserWindow` (960×540) → captures page → resizes to 300×169 → returns base64.

---

## Project Themes

### `saveProjectThemes(themes)`
- **Params**: `themes` — array of theme objects
- **Returns**: `true`
- **Description**: Saves project themes into config.

---

## External Links

### `openExternal(url)`
- **Description**: Opens URL in the system's default browser via `shell.openExternal()`.

---

## Renderer ← Main Events

| Channel | Payload | Trigger |
|---|---|---|
| `menu-action` | `action` (string) | Native menu bar item clicked |
| `file-open` | `data` (parsed JSON) | OS file association open |
| `load-project` | `projectData` (object) | Editor opened / focused from home |
| `refresh-home` | — | Editor closed, refresh home |
| `presentation-data` | `data` (object) | Presentation window loaded |

## Config Shape

```json
{
  "projects": [{ "id", "name", "path", "lastModified", "created", "slideCount", "thumbnail", "favorite" }],
  "recentProjects": ["proj_id_1", "proj_id_2"],
  "settings": {
    "theme": "dark", "language": "tr", "autoSave": true,
    "autoSaveInterval": 60, "defaultTemplate": "blank",
    "recentCount": 10, "snapToGrid": false, "gridSize": 20,
    "defaultFontFamily": "Arial", "defaultFontSize": 16,
    "canvasBg": "#1a1a1a", "autoOpenPanel": true, "thumbSize": "medium"
  },
  "projectThemes": [{ "id", "name", "canvasBg", "titleColor", "textColor", "titleFont", "textFont", "animType", "animDuration" }],
  "ai": { "endpoint", "model", "temperature", "maxTokens" }
}
```

## .slidelab File Format

```json
{
  "version": 1,
  "theme": "dark",
  "slides": [
    {
      "id": "sl_1",
      "background": "#111111",
      "transition": "fade",
      "elements": [
        { "id": "el_1", "type": "title", "content": "…", "x": 60, "y": 180, "width": 840, "height": 80, "fontSize": 72, "fontFamily": "Arial", "color": "#FFD700", "bold": true, "textAlign": "center", "animType": "fade", "animDuration": 0.5, "animDelay": 0 }
      ]
    }
  ]
}
```
