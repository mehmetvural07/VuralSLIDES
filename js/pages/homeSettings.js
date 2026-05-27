(function() {
  let settingsCache = {}

  function setSettingField(id, value) {
    const el = document.getElementById(id)
    if (!el) return
    if (el.type === 'checkbox') el.checked = !!value
    else el.value = value != null ? value : ''
  }

  async function openSettings() {
    const settings = await ProjectManager.getSettings()
    settingsCache = { ...settings }
    setSettingField('set-language', settings.language)
    setSettingField('set-autosave', settings.autoSave)
    setSettingField('set-autosave-interval', settings.autoSaveInterval)
    setSettingField('set-default-template', settings.defaultTemplate)
    setSettingField('set-recent-count', settings.recentCount)
    setSettingField('set-snap', settings.snapToGrid)
    setSettingField('set-grid-size', settings.gridSize)
    setSettingField('set-font-family', settings.defaultFontFamily)
    setSettingField('set-font-size', settings.defaultFontSize)
    setSettingField('set-canvas-bg', settings.canvasBg)
    setSettingField('set-auto-panel', settings.autoOpenPanel)
    setSettingField('set-thumb-size', settings.thumbSize)

    document.getElementById('settings-overlay').classList.remove('hidden')

    const themeCards = document.querySelectorAll('.theme-card')
    themeCards.forEach(card => {
      card.classList.toggle('active', card.dataset.theme === settings.theme)
    })

    if (window.lucide) lucide.createIcons()
  }

  function closeSettings() {
    document.getElementById('settings-overlay').classList.add('hidden')
  }

  function switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'))
    document.querySelector(`.settings-tab[data-tab="${tabId}"]`)?.classList.add('active')
    document.getElementById(`tab-${tabId}`)?.classList.add('active')
  }

  function getSettingsValues() {
    const activeCard = document.querySelector('.theme-card.active')
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
    }
  }

  async function saveSettings() {
    const s = getSettingsValues()
    await ProjectManager.updateSettings(s)
    settingsCache = s
    ThemeManager.setTheme(s.theme)
    I18n.setLocale(s.language || 'tr')
    localStorage.setItem('oslide2_locale', s.language || 'tr')
    closeSettings()
  }

  window.openSettings = openSettings
  window.closeSettings = closeSettings
  window.switchSettingsTab = switchSettingsTab
  window.saveSettings = saveSettings
})()
