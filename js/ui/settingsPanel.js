let settingsCache = {};

function setSettingField(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = value != null ? value : '';
}

async function openSettings() {
  if (!window.electronAPI) return;
  const config = await window.electronAPI.getConfig();
  const s = config.settings || {};
  settingsCache = { ...s };

  setSettingField('set-language', s.language);
  setSettingField('set-autosave', s.autoSave);
  setSettingField('set-autosave-interval', s.autoSaveInterval);
  setSettingField('set-default-template', s.defaultTemplate);
  setSettingField('set-recent-count', s.recentCount);
  setSettingField('set-snap', s.snapToGrid);
  setSettingField('set-grid-size', s.gridSize);
  setSettingField('set-font-family', s.defaultFontFamily);
  setSettingField('set-font-size', s.defaultFontSize);
  setSettingField('set-canvas-bg', s.canvasBg);
  setSettingField('set-auto-panel', s.autoOpenPanel);
  setSettingField('set-thumb-size', s.thumbSize);

  document.getElementById('settings-overlay').classList.remove('hidden');

  if (window.lucide) lucide.createIcons();

  const themeCards = document.querySelectorAll('.theme-card');
  themeCards.forEach(card => {
    card.classList.toggle('active', card.dataset.theme === s.theme);
  });
}

function closeSettings() {
  const overlay = document.getElementById('settings-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function getSettingsValues() {
  const activeCard = document.querySelector('.theme-card.active');
  return {
    theme: activeCard?.dataset?.theme || 'dark',
    language: document.getElementById('set-language')?.value,
    autoSave: document.getElementById('set-autosave')?.checked,
    autoSaveInterval: parseInt(document.getElementById('set-autosave-interval')?.value) || 60,
    defaultTemplate: document.getElementById('set-default-template')?.value,
    recentCount: parseInt(document.getElementById('set-recent-count')?.value) || 10,
    snapToGrid: document.getElementById('set-snap')?.checked,
    gridSize: parseInt(document.getElementById('set-grid-size')?.value) || 20,
    defaultFontFamily: document.getElementById('set-font-family')?.value,
    defaultFontSize: parseInt(document.getElementById('set-font-size')?.value) || 16,
    canvasBg: document.getElementById('set-canvas-bg')?.value,
    autoOpenPanel: document.getElementById('set-auto-panel')?.checked,
    thumbSize: document.getElementById('set-thumb-size')?.value
  };
}

async function saveSettings() {
  const s = getSettingsValues();
  if (window.electronAPI) {
    const config = await window.electronAPI.getConfig();
    Object.assign(config.settings || {}, s);
    await window.electronAPI.saveConfig(config);
  }
  settingsCache = s;
  ThemeManager.setTheme(s.theme);
  I18n.setLocale(s.language || 'tr');
  localStorage.setItem('oslide2_locale', s.language || 'tr');
  if (window.setSnapEnabled) window.setSnapEnabled(s.snapToGrid !== false);
  if (window.startAutoSave) window.startAutoSave();
  closeSettings();
}

window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
