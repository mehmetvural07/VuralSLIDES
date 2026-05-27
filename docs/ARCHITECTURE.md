# Architecture

## Overview

oSlide2 is an Electron-based slide/presentation app built with vanilla JavaScript (no frameworks). The app runs in two main windows:

- **Home** (`home.html`) — project browser, theme gallery, settings
- **Editor** (`editor.html`) — slide canvas, element tools, AI assistant

A third window (`presentation.html`) renders the fullscreen slideshow.

## Process Model

```
┌─────────────────────────┐
│    Main Process         │
│    (main.js)            │
│                         │
│  ┌─ Window management   │
│  ├─ IPC handlers        │
│  ├─ File I/O (fs)       │
│  ├─ Config persistence  │
│  └─ Menu bar            │
└────────┬────────────────┘
         │ contextBridge (preload.js)
         │
┌────────▼──────────┐  ┌────────▼──────────┐  ┌────────▼──────────┐
│  Home Window      │  │  Editor Window    │  │  Presentation     │
│  (home.html)      │  │  (editor.html)    │  │  (presentation..  │
│                   │  │                   │  │     html)         │
│  - Project list   │  │  - Canvas + ruler │  │  - Fullscreen     │
│  - Theme gallery  │  │  - Slide thumbn.  │  │  - Drawing annot  │
│  - Settings panel │  │  - AI assistant   │  │  - Timer/counter  │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

## Module Dependency Graph (Editor)

```
services/theme.js         ThemeManager (dark/light/system)
       │
services/shortcuts.js     ShortcutManager (key bindings)
       │
services/i18n.js          I18n (translations tr/en)
       │
core/state.js             App/CoreState, undo/redo snapshots
       │
core/actions.js           Slide/element CRUD (addSlide, addEl, delEl…)
       │
ui/renderer.js            renderSlide, renderThumbs, renderAll
       │
ui/panels.js              showPanel (element property editor)
       │
ui/canvas.js              Drag/resize/multiselect/context menu (IIFE)
       │
services/fileManager.js   Image import via <input type="file">
services/export.js        buildExportHTML, exportPDF, exportPNG
services/ai-ui.js         initAI — chat drawer, slide generation
       │
pages/editor.js           init() — wires everything, auto-save, zoom
       └──→ exports: getData, loadData, saveProject, etc.
```

## Module Dependency Graph (Home)

```
services/theme.js         ThemeManager
services/i18n.js           I18n
services/shortcuts.js     ShortcutManager
services/projectManager.js  ProjectManager (config CRUD)
       │
pages/homeTheme.js        Theme CRUD (IIFE)
pages/homeSettings.js     Settings UI (IIFE)
pages/homeProject.js      Project CRUD, events, init (IIFE)
       │
pages/home.js             Orchestrator (4 lines)
```

## State Flow

```
User action (click / drag / keyboard)
       │
       ▼
actions.js ──save()──► snapshot push to CoreState.undo[]
       │
       ▼ mutates CoreState.slides / CoreState.sel / etc.
       │
       ▼
renderAll() ──► renderSlide() ──► DOM update (slide-container)
              ──► renderThumbs() ──► slide-list refresh
              ──► updateToolbar()  ──► button states
              ──► updateStatusBar()
```

### Undo/Redo

```
save()
  └─ push clone({ slides, cur }) to CoreState.undo[]
  └─ clear CoreState.redo[]
  └─ set CoreState.dirty = true

undo()
  └─ move current state → CoreState.redo[]
  └─ pop from CoreState.undo[] → restore slides + cur

redo()
  └─ move current state → CoreState.undo[]
  └─ pop from CoreState.redo[] → restore slides + cur
```

## Key Conventions

- All modules export globals via `window.*` (no bundler)
- State lives in `App` / `CoreState` global
- Call `save()` (snapshot) before every mutation, then `renderAll()`
- Theme: `ThemeManager.setTheme('dark'|'light'|'system')`
- i18n: `I18n.t('key')`, add keys to `locales/tr.json` and `locales/en.json`
- Shortcuts: `ShortcutManager.register(action, handler)` in page init
- No semicolons, single-line functions where possible, no comments
- Turkish strings in UI; migrate to `I18n.t()` keys when touching

## Canvas Coordinate System

- Fixed size: **960 × 540 px**
- Elements positioned absolutely within `#slide-container`
- Zoom via CSS transform `scale(zoomLevel)` on `#canvas`
