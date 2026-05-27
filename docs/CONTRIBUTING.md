# Contributing

## Code Style

- **No semicolons** — project convention
- Single-line functions where possible
- No comments in code — keep it clean
- **JSDoc**: Add JSDoc comments to all exported functions and complex types (see [JSDoc-STYLE.md](JSDoc-STYLE.md))
- Turkish strings in UI for now; migrate to `I18n.t()` keys when touching
- Use `I18n.t('key')` for translatable strings; add keys to both `locales/tr.json` and `locales/en.json`

## Architecture Conventions

- All modules export globals via `window.*` (no bundler)
- State lives in `App` / `CoreState` global (`js/core/state.js`)
- Undo/redo: call `save()` before every mutation, then `renderAll()`
- Theme: use `ThemeManager.setTheme()` with values `'dark'`, `'light'`, `'system'`
- Shortcuts: register via `ShortcutManager.register(action, handler)` in page init

## JS Module Load Order

Modules are loaded via `<script>` tags in HTML — see `home.html` and `editor.html` for the exact order. The dependency chain is:

### Home page
1. `services/theme.js`
2. `services/i18n.js`
3. `services/shortcuts.js`
4. `services/projectManager.js`
5. `pages/homeTheme.js`
6. `pages/homeSettings.js`
7. `pages/homeProject.js`
8. `pages/home.js`

### Editor page
1. `services/theme.js`
2. `services/shortcuts.js`
3. `services/i18n.js`
4. `services/projectManager.js`
5. `services/ai.js`
6. `core/state.js`
7. `core/actions.js`
8. `ui/renderer.js`
9. `ui/panels.js`
10. `ui/canvas.js`
11. `services/fileManager.js`
12. `services/export.js`
13. `services/ai-ui.js`
14. `ui/themePicker.js`
15. `ui/settingsPanel.js`
16. `pages/editor.js`

## Adding a New Feature

1. If it needs new state, add it to `CoreState` in `state.js`
2. If it mutates slides/elements, add action functions in `actions.js`
3. Add rendering logic in `renderer.js` if new element types or visual changes
4. Add UI controls in the relevant HTML file
5. Register IPC handlers in `main.js` and expose them in `preload.js`
6. Wire up events in `pages/editor.js` or `pages/homeProject.js`

## Security

- Never use `--allow-file-access-from-files` flag
- Images go through IPC (base64), not file:// paths
- `renderMD()` sanitizes href to only allow `http://` and `https://` protocols
- Cert password must be set via `CSC_KEY_PASSWORD` env var (NOT in package.json)

## Pull Request Process

1. Test your changes with `npm start`
2. Make sure the app builds: `npm run build`
3. Update locale files if adding new UI strings
4. Update `AGENTS.md` if adding new modules or changing conventions
