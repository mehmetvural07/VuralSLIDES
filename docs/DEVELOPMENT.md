# Development

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Running

```bash
npm start
```

This launches the Electron app with the home window.

## Project Structure

```
oSlide2/
├── main.js                  # Electron main process
├── preload.js               # contextBridge API
├── home.html                # Home page (project browser)
├── editor.html              # Editor page (slide canvas)
├── presentation.html        # Fullscreen presentation
├── package.json             # Dependencies & build config
├── AGENTS.md                # Agent instructions
├── docs/                    # Documentation
├── css/
│   ├── home.css             # Home page styles
│   ├── editor.css           # Editor page styles
│   └── presentation.css    # Presentation styles
├── js/
│   ├── core/
│   │   ├── state.js         # App state, undo/redo
│   │   └── actions.js       # Slide/element CRUD
│   ├── ui/
│   │   ├── renderer.js      # DOM rendering
│   │   ├── panels.js        # Properties panel
│   │   ├── canvas.js        # Canvas interactions
│   │   ├── themePicker.js   # Editor theme picker
│   │   └── settingsPanel.js # Editor settings panel
│   ├── services/
│   │   ├── theme.js         # ThemeManager
│   │   ├── shortcuts.js     # ShortcutManager
│   │   ├── i18n.js          # I18n manager
│   │   ├── projectManager.js # ProjectManager
│   │   ├── ai.js            # AI chat service
│   │   ├── ai-ui.js         # AI chat UI
│   │   ├── fileManager.js   # Image file import
│   │   ├── export.js        # PDF/PNG export
│   │   └── console.js       # Dev console
│   ├── pages/
│   │   ├── home.js          # Home orchestrator
│   │   ├── homeTheme.js     # Theme CRUD
│   │   ├── homeSettings.js  # Settings CRUD
│   │   ├── homeProject.js   # Project CRUD
│   │   ├── editor.js        # Editor init
│   │   └── presentation.js  # Presentation logic
│   └── locales/
│       ├── tr.json          # Turkish strings
│       └── en.json          # English strings
├── assets/
│   └── icon.png             # App icon (512×512)
├── installer/
│   └── oslide2.iss          # Inno Setup script
└── installer_app/           # Electron installer app (v1.0.0 deferred)
```

## Building

### Unsigned portable EXE
```bash
npm run build
```
Output: `dist/win-unpacked/oSlide2.exe`

### Signed portable EXE
```bash
set CSC_KEY_PASSWORD=1234 && npm run build
```
Note: Signing currently disabled — see `signAndEditExecutable: false` in electron-builder config.

### Inno Setup installer
```bash
npm run build:installer
```

## Known Issues

- **Signing**: `signtool.exe` hangs when signing with the self-signed cert — signing is disabled for all targets.
- **CRLF warnings**: Git may warn about LF→CRLF replacement on Windows; these are cosmetic.

## Debugging

- Open DevTools: `Ctrl+Shift+I` in the app window
- The app includes a dev console (`#dev-console`) accessible from the home page
- Set `ELECTRON_ENABLE_STACK_DUMPING=true` for crash diagnostics

## Canvas

- Coordinate system: 960 × 540 px fixed
- Zoom range: 0.25–3.0 (step 0.1), CSS transform scaling
- Snap-to-grid threshold: 6px
- Grid sizes: 10px, 20px, 50px
