let editorThemes = [];

async function showThemePicker() {
  if (window.electronAPI) {
    const cfg = await window.electronAPI.getConfig()
    editorThemes = cfg.projectThemes || []
  } else if (window.ProjectManager) {
    await window.ProjectManager.init()
    editorThemes = await window.ProjectManager.getThemes()
  }
  const list = document.getElementById('editor-theme-list')
  if (!list) return
  list.innerHTML = editorThemes.map(th => `
    <div class="editor-theme-item" data-id="${th.id}">
      <div class="editor-theme-preview" style="background:${th.canvasBg};padding:12px;border-radius:6px">
        <div style="color:${th.titleColor};font-family:${th.titleFont};font-size:16px;font-weight:700">Aa</div>
        <div style="color:${th.textColor};font-family:${th.textFont};font-size:11px;margin-top:4px">${window.esc ? window.esc(th.name) : th.name}</div>
      </div>
      <div class="editor-theme-name">${window.esc ? window.esc(th.name) : th.name}</div>
    </div>
  `).join('')
  list.querySelectorAll('.editor-theme-item').forEach(item => {
    item.onclick = () => applyEditorTheme(item.dataset.id)
  })
  const overlay = document.getElementById('editor-theme-overlay')
  if (overlay) overlay.classList.remove('hidden')
  if (window.lucide) lucide.createIcons()
}

function applyEditorTheme(themeId) {
  const th = editorThemes.find(t => t.id === themeId)
  if (!th) return
  if (window.App) window.App.projectTheme = th
  if (window.save) window.save()
  if (window.App && window.App.slides) {
    for (const s of window.App.slides) {
      s.background = th.canvasBg
      for (const el of s.elements) {
        const isTitle = el.type === 'title' || (el.fontSize >= 32 && el.bold)
        if (el.type === 'text' || el.type === 'title') {
          el.color = isTitle ? th.titleColor : th.textColor
          el.fontFamily = isTitle ? th.titleFont : th.textFont
        }
        el.animType = th.animType
        el.animDuration = th.animDuration
      }
    }
  }
  closeThemePicker()
  if (window.renderAll) window.renderAll()
}

function closeThemePicker() {
  const overlay = document.getElementById('editor-theme-overlay')
  if (overlay) overlay.classList.add('hidden')
}

window.showThemePicker = showThemePicker;
window.closeThemePicker = closeThemePicker;
