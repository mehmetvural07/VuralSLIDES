const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let homeWindow;
let editorWindow;
let presentationWindow;

const CONFIG_PATH = path.join(app.getPath('userData'), 'oslide2_config.json');

/** Validates hex color format, defaults to #ffffff if invalid @param {string} color @returns {string} */
function validateThemeColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#ffffff'
}

/** Validates and normalizes config bounds/types @param {Object} cfg @returns {Object} */
function validateConfig(cfg) {
  if (!cfg) return getDefaultConfig()
  if (!cfg.settings) cfg.settings = getDefaultConfig().settings
  if (!cfg.projectThemes) cfg.projectThemes = getDefaultThemes()
  const s = cfg.settings
  if (!['dark', 'light', 'system'].includes(s.theme)) s.theme = 'dark'
  if (!['tr', 'en'].includes(s.language)) s.language = 'tr'
  if (typeof s.autoSave !== 'boolean') s.autoSave = true
  if (typeof s.autoSaveInterval !== 'number' || s.autoSaveInterval < 10 || s.autoSaveInterval > 600) s.autoSaveInterval = 60
  if (typeof s.recentCount !== 'number' || s.recentCount < 1 || s.recentCount > 50) s.recentCount = 10
  if (typeof s.gridSize !== 'number' || s.gridSize < 5 || s.gridSize > 100) s.gridSize = 20
  if (typeof s.defaultFontSize !== 'number' || s.defaultFontSize < 8 || s.defaultFontSize > 72) s.defaultFontSize = 16
  if (cfg.projectThemes) {
    cfg.projectThemes.forEach(t => {
      t.canvasBg = validateThemeColor(t.canvasBg)
      t.titleColor = validateThemeColor(t.titleColor)
      t.textColor = validateThemeColor(t.textColor)
    })
  }
  return cfg
}

/** Loads config from disk, returns defaults on failure @returns {Object} */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
      return validateConfig(cfg)
    }
  } catch (err) { console.error('loadConfig error:', err); }
  return getDefaultConfig()
}

/** @returns {Object} Default config object */
function getDefaultConfig() {
  return { projects: [], recentProjects: [], settings: {
    theme: 'dark', language: 'tr', autoSave: true, autoSaveInterval: 60,
    defaultTemplate: 'blank', recentCount: 10,
    snapToGrid: false, gridSize: 20,
    defaultFontFamily: 'Arial', defaultFontSize: 16,
    canvasBg: '#1a1a1a', autoOpenPanel: true, thumbSize: 'medium'
  }, projectThemes: getDefaultThemes(),   ai: {
    endpoint: 'https://g4f.space/api/groq/chat/completions',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 4096
  } }
}

/** @returns {Object[]} Default project theme presets */
function getDefaultThemes() {
  return [
    { id:'th_default', name:'Varsayılan', canvasBg:'#ffffff', titleColor:'#222222', titleFont:'Arial', textColor:'#333333', textFont:'Arial', animType:'fade', animDuration:0.5 },
    { id:'th_dark', name:'Karanlık', canvasBg:'#1e1e1e', titleColor:'#ffffff', titleFont:'Arial', textColor:'#e0e0e0', textFont:'Arial', animType:'fade', animDuration:0.5 },
    { id:'th_nature', name:'Doğa', canvasBg:'#f0f7e6', titleColor:'#2d5016', titleFont:'Georgia', textColor:'#3a6b1e', textFont:'Georgia', animType:'slide-up', animDuration:0.6 },
    { id:'th_ocean', name:'Okyanus', canvasBg:'#e6f3ff', titleColor:'#003366', titleFont:'Helvetica', textColor:'#004080', textFont:'Helvetica', animType:'slide-left', animDuration:0.5 },
    { id:'th_sunset', name:'Gün Batımı', canvasBg:'#2d1b00', titleColor:'#ffcc80', titleFont:'Georgia', textColor:'#ffb347', textFont:'Georgia', animType:'zoom-in', animDuration:0.6 }
  ]
}

/** Writes config to disk @param {Object} config @returns {void} */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) { console.error('saveConfig error:', err); }
}

function createHomeWindow() {
  homeWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false,
    title: 'oSlide2'
  });

  homeWindow.loadFile('home.html');
  homeWindow.once('ready-to-show', () => homeWindow.show());
  homeWindow.on('closed', () => { homeWindow = null; });
}

function createEditorWindow(projectData) {
  if (editorWindow) {
    editorWindow.focus();
    editorWindow.webContents.send('load-project', projectData);
    return;
  }

  editorWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false,
    title: 'oSlide2 - Editör'
  });

  editorWindow.loadFile('editor.html');
  editorWindow.webContents.once('did-finish-load', () => {
    editorWindow.webContents.send('load-project', projectData);
  });
  editorWindow.once('ready-to-show', () => editorWindow.show());

  editorWindow.on('closed', () => {
    editorWindow = null;
    Menu.setApplicationMenu(null);
    if (homeWindow) {
      homeWindow.show();
      homeWindow.webContents.send('refresh-home');
    }
  });

  createEditorMenu();
}

function createEditorMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        { label: 'Ana Ekrana Dön', click: () => { if (editorWindow) { editorWindow.close(); } } },
        { type: 'separator' },
        { label: 'Kaydet', accelerator: 'CmdOrCtrl+S', click: () => editorWindow?.webContents.send('menu-action', 'save') },
        { label: 'Farklı Kaydet', accelerator: 'CmdOrCtrl+Shift+S', click: () => editorWindow?.webContents.send('menu-action', 'save-as') },
        { type: 'separator' },
        { label: 'PDF Olarak Dışa Aktar', click: () => editorWindow?.webContents.send('menu-action', 'export-pdf') },
        { label: 'PNG Olarak Dışa Aktar', click: () => editorWindow?.webContents.send('menu-action', 'export-png') },
        { type: 'separator' },
        { role: 'quit', label: 'Çıkış' }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', click: () => editorWindow?.webContents.send('menu-action', 'undo') },
        { label: 'İleri Al', accelerator: 'CmdOrCtrl+Y', click: () => editorWindow?.webContents.send('menu-action', 'redo') },
        { type: 'separator' },
        { label: 'Seçili Öğeyi Sil', accelerator: 'Delete', click: () => editorWindow?.webContents.send('menu-action', 'delete') }
      ]
    },
    {
      label: 'Ekle',
      submenu: [
        { label: 'Metin', click: () => editorWindow?.webContents.send('menu-action', 'add-text') },
        { label: 'Başlık', click: () => editorWindow?.webContents.send('menu-action', 'add-title') },
        { label: 'Resim', click: () => editorWindow?.webContents.send('menu-action', 'add-image') },
        { label: 'Dikdörtgen', click: () => editorWindow?.webContents.send('menu-action', 'add-rect') },
        { label: 'Daire', click: () => editorWindow?.webContents.send('menu-action', 'add-circle') },
        { label: 'Ok', click: () => editorWindow?.webContents.send('menu-action', 'add-arrow') }
      ]
    },
    {
      label: 'Sunum',
      submenu: [
        { label: 'Sunumu Başlat', accelerator: 'F5', click: () => editorWindow?.webContents.send('menu-action', 'start-presentation') }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createPresentationWindow(data) {
  presentationWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  presentationWindow.loadFile('presentation.html');
  presentationWindow.webContents.once('did-finish-load', () => {
    presentationWindow.webContents.send('presentation-data', data);
  });
  presentationWindow.on('closed', () => { presentationWindow = null; });
}

// ─── IPC Handlers ────────────────────────────────────────

/** @returns {Object} Full config */
ipcMain.handle('get-config', () => loadConfig());

/** @param {Object} config @returns {boolean} */
ipcMain.handle('save-config', (event, config) => { saveConfig(config); return true; });

/** Opens/focuses editor window and hides home @returns {boolean} */
ipcMain.handle('open-editor', (event, projectData) => {
  createEditorWindow(projectData);
  if (homeWindow) homeWindow.hide();
  return true;
});

/** Duplicates a .slidelab file under a new project ID @returns {string|null} */
ipcMain.handle('duplicate-file', async (event, { sourcePath, newId, name }) => {
  try {
    const data = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const projectsDir = path.join(app.getPath('userData'), 'projects');
    fs.mkdirSync(projectsDir, { recursive: true });
    const filePath = path.join(projectsDir, `${newId}.slidelab`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    // Update config with new path
    const config = loadConfig();
    const p = config.projects.find(pr => pr.id === newId);
    if (p) { p.path = filePath; saveConfig(config); }
    return filePath;
  } catch (err) { console.error('duplicate-file error:', err); return null; }
});

/** Exports project via save dialog @returns {string|null} */
ipcMain.handle('export-project', async (event, { projectId, name, slideData }) => {
  const result = await dialog.showSaveDialog(homeWindow || editorWindow, {
    defaultPath: `${name || 'proje'}.slidelab`,
    filters: [{ name: 'Slide Projesi', extensions: ['slidelab'] }]
  });
  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, JSON.stringify(slideData, null, 2), 'utf-8');
      return result.filePath;
    } catch (err) { console.error('export-project error:', err); return null; }
  }
  return null;
});

/** Imports .slidelab via open dialog @returns {{filePath:string, slideData:Object}|null} */
ipcMain.handle('import-project', async () => {
  const result = await dialog.showOpenDialog(homeWindow || editorWindow, {
    filters: [{ name: 'Slide Projesi', extensions: ['slidelab'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
      return { filePath: result.filePaths[0], slideData: data };
    } catch (err) { console.error('import-project error:', err); return null; }
  }
  return null;
});

/** Generates a 300×169 thumbnail base64 from slide data @returns {string|null} */
ipcMain.handle('generate-thumbnail', async (event, slideData) => {
  try {
    const { BrowserWindow: OffscreenWindow } = require('electron');
    const thumbWin = new OffscreenWindow({
      width: 960, height: 540, show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    });
    const html = buildSlideHTML(slideData, 'default');
    await thumbWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const image = await thumbWin.webContents.capturePage();
    const resized = image.resize({ width: 300, height: 169 });
    const base64 = resized.toDataURL();
    thumbWin.close();
    return base64;
  } catch (err) { console.error('generate-thumbnail error:', err); return null; }
});

/** Creates a .slidelab file in userData/projects/ @returns {string|null} */
ipcMain.handle('create-project-file', async (event, { projectId, name, slideData }) => {
  const projectsDir = path.join(app.getPath('userData'), 'projects');
  try { fs.mkdirSync(projectsDir, { recursive: true }); } catch {}
  const fileName = `${projectId}.slidelab`;
  const filePath = path.join(projectsDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(slideData, null, 2), 'utf-8');
    // Update config with path
    const config = loadConfig();
    const p = config.projects.find(pr => pr.id === projectId);
    if (p) { p.path = filePath; saveConfig(config); }
    return filePath;
  } catch { return null; }
});

/** Shows home window and sends refresh @returns {boolean} */
ipcMain.handle('return-home', () => {
  if (homeWindow) { homeWindow.show(); homeWindow.webContents.send('refresh-home'); }
  return true;
});

/** Saves data to file (or opens save dialog if no path) @returns {string|null} */
ipcMain.handle('save-file', async (event, data, filePath) => {
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }
  const result = await dialog.showSaveDialog(editorWindow || homeWindow, {
    filters: [{ name: 'Slide Projesi', extensions: ['slidelab'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return result.filePath;
  }
  return null;
});

/** Opens save dialog and writes data @returns {string|null} */
ipcMain.handle('save-file-as', async (event, data) => {
  const result = await dialog.showSaveDialog(editorWindow || homeWindow, {
    filters: [{ name: 'Slide Projesi', extensions: ['slidelab'] }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return result.filePath;
  }
  return null;
});

/** Opens .slidelab file picker @returns {{data:Object, filePath:string, fileName:string}|null} */
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(homeWindow || editorWindow, {
    filters: [{ name: 'Slide Projesi', extensions: ['slidelab'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const fp = result.filePaths[0]
    const raw = fs.readFileSync(fp, 'utf-8')
    const data = JSON.parse(raw)
    const name = path.basename(fp, '.slidelab')
    return { data, filePath: fp, fileName: name }
  }
  return null;
});

/** Reads and parses a .slidelab file @returns {Object|null} */
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) { console.error('read-file error:', err); return null; }
});

/** Deletes a file from disk @returns {boolean} */
ipcMain.handle('delete-file', async (event, filePath) => {
  try { fs.unlinkSync(filePath); return true; } catch (err) { console.error('delete-file error:', err); return false; }
});

/** Saves and validates project themes @returns {boolean} */
ipcMain.handle('save-project-themes', (event, themes) => {
  const config = loadConfig()
  if (Array.isArray(themes)) {
    themes.forEach(t => {
      t.canvasBg = validateThemeColor(t.canvasBg)
      t.titleColor = validateThemeColor(t.titleColor)
      t.textColor = validateThemeColor(t.textColor)
    })
    config.projectThemes = themes
    saveConfig(config)
  }
  return true
})

/** Updates project metadata (slideCount, path, thumbnail) @returns {boolean} */
ipcMain.handle('update-project-meta', async (event, { projectId, slideCount, path: filePath, thumbnail }) => {
  const config = loadConfig();
  const p = config.projects.find(pr => pr.id === projectId);
  if (p) {
    p.slideCount = slideCount;
    p.lastModified = new Date().toISOString();
    if (filePath) p.path = filePath;
    if (thumbnail) p.thumbnail = thumbnail;
    saveConfig(config);
    return true;
  }
  return false;
});

/** Reads an image file and returns base64 + mime @returns {{data:string, mime:string, name:string}|null} */
ipcMain.handle('read-image', async (event, filePath) => {
  try {
    return await readImageFile(filePath);
  } catch (err) { console.error('read-image error:', err); return null; }
});

/** Opens native image file picker @returns {{data:string, mime:string, name:string}|null} */
ipcMain.handle('open-image-dialog', async () => {
  const result = await dialog.showOpenDialog(editorWindow, {
    filters: [{ name: 'Resimler', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return await readImageFile(result.filePaths[0]);
  }
  return null;
});

/** Reads image file → base64 + mime @param {string} filePath @returns {Promise<{data:string, mime:string, name:string}|null>} */
async function readImageFile(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { data: data.toString('base64'), mime, name: path.basename(filePath) };
  } catch (err) { console.error('readImageFile error:', err); return null; }
}

/** Opens a fullscreen presentation window @returns {boolean} */
ipcMain.handle('start-presentation', (event, data) => {
  createPresentationWindow(data);
  return true;
});

/** Renders HTML to PDF and saves via dialog @returns {boolean} */
ipcMain.handle('export-pdf', async (event, htmlContent) => {
  const result = await dialog.showSaveDialog(editorWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!result.canceled && result.filePath) {
    const { BrowserWindow: OffscreenWindow } = require('electron');
    const printWin = new OffscreenWindow({
      width: 1280, height: 720, show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    });
    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    const pdfData = await printWin.webContents.printToPDF({ printBackground: true });
    fs.writeFileSync(result.filePath, pdfData);
    printWin.close();
    return true;
  }
  return false;
});

/** Renders each slide as PNG and saves to chosen directory @returns {boolean} */
ipcMain.handle('export-png', async (event, data) => {
  const result = await dialog.showOpenDialog(editorWindow, { properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
    const dir = result.filePaths[0];
    const { BrowserWindow: OffscreenWindow } = require('electron');
    for (let i = 0; i < data.slides.length; i++) {
      const slide = data.slides[i];
      const html = buildSlideHTML(slide, data.theme);
      const printWin = new OffscreenWindow({
        width: 1280, height: 720, show: false,
        webPreferences: { contextIsolation: true, nodeIntegration: false }
      });
      await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      const image = await printWin.webContents.capturePage();
      const pngData = image.toPNG();
      fs.writeFileSync(path.join(dir, `slide-${String(i + 1).padStart(3, '0')}.png`), pngData);
      printWin.close();
    }
    return true;
  }
  return false;
});

/** @param {string} s @returns {string} HTML-escaped string */
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Builds an HTML string for a single slide (used in export/thumbnail)
 * @param {Object} slide - Slide data
 * @param {string} theme - Theme name
 * @returns {string} HTML document
 */
function buildSlideHTML(slide, theme) {
  const themeColors = {
    default: { bg: '#ffffff', text: '#333333', accent: '#ffd700' },
    dark: { bg: '#1e1e1e', text: '#e0e0e0', accent: '#ffd700' },
    nature: { bg: '#f0f7e6', text: '#2d5016', accent: '#ccbb00' },
    ocean: { bg: '#e6f3ff', text: '#003366', accent: '#ddcc00' }
  };
  const colors = themeColors[theme] || themeColors.default;
  const elements = slide.elements.map(el => {
    const extra = [];
    if (el.opacity !== undefined && el.opacity < 1) extra.push(`opacity:${el.opacity}`);
    if (el.rotation) extra.push(`transform:rotate(${el.rotation}deg)`);
    const extras = extra.join(';');
    const style = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${extras};${el.style || ''}`;
    switch (el.type) {
      case 'text': {
        const deco = []; if (el.underline) deco.push('underline'); if (el.strikethrough) deco.push('line-through');
        return `<div style="${style};font-size:${el.fontSize || 16}px;font-family:${el.fontFamily || 'Arial'};color:${el.color || colors.text};font-weight:${el.bold ? 'bold' : 'normal'};font-style:${el.italic ? 'italic' : 'normal'};text-decoration:${deco.join(' ')};background:${el.bgColor || 'transparent'};text-align:${el.textAlign || 'left'};overflow:hidden;word-wrap:break-word">${escHtml(el.content || '')}</div>`;
      }
      case 'image':
        return `<div style="${style};overflow:hidden"><img src="${el.src}" style="width:100%;height:100%;object-fit:contain" /></div>`;
      case 'rect':
        return `<div style="${style};background:${el.fill || '#ffd700'};border:${el.borderWidth || 2}px solid ${el.borderColor || '#ffd700'};border-radius:${el.borderRadius || 0}px"></div>`;
      case 'circle':
        return `<div style="${style};background:${el.fill || '#ffd700'};border:${el.borderWidth || 2}px solid ${el.borderColor || '#ffd700'};border-radius:50%"></div>`;
      case 'arrow':
        return `<div style="${style};display:flex;align-items:center;justify-content:center"><svg width="${el.width}" height="${el.height}" viewBox="0 0 ${el.width} ${el.height}"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${el.fill || '#ffd700'}" /></marker></defs><line x1="0" y1="${el.height / 2}" x2="${el.width}" y2="${el.height / 2}" stroke="${el.fill || '#ffd700'}" stroke-width="${el.borderWidth || 3}" marker-end="url(#arrowhead)" /></svg></div>`;
      default: return '';
    }
  }).join('\n');
  return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;background:${slide.background || colors.bg};font-family:Arial,sans-serif;color:${colors.text}}</style></head><body>${elements}</body></html>`;
}

/** Opens URL in the default system browser @returns {boolean} */
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
  return true;
});

app.whenReady().then(() => {
  createHomeWindow();
  Menu.setApplicationMenu(null);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!homeWindow) createHomeWindow();
});
