(function() {
  let themes = []
  let editingThemeId = null
  window.editingThemeId = null

  function setThemePreview(th) {
    const title = document.getElementById('th-preview-title')
    const text = document.getElementById('th-preview-text')
    const preview = document.getElementById('th-preview')
    if (!title || !text || !preview) return
    preview.style.background = th.canvasBg || '#ffffff'
    title.style.color = th.titleColor || '#222'
    title.style.fontFamily = th.titleFont || 'Arial'
    text.style.color = th.textColor || '#333'
    text.style.fontFamily = th.textFont || 'Arial'
  }

  async function renderThemes() {
    themes = await ProjectManager.getThemes()
    const grid = document.getElementById('themes-grid')
    if (!grid) return
    grid.innerHTML = ''
    if (themes.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon">🎨</div><p>' + I18n.t('home.noThemes') + '</p></div>'
      return
    }
    themes.forEach((th, i) => {
      const card = document.createElement('div')
      card.className = 'theme-card2'
      card.style.animationDelay = (i * 0.04) + 's'
      card.dataset.id = th.id

      const preview = document.createElement('div')
      preview.className = 'theme-card2-preview'
      preview.style.background = th.canvasBg || '#ffffff'
      preview.innerHTML = `<div class="th-preview-title" style="color:${th.titleColor||'#222'};font-family:${th.titleFont||'Arial'}">Aa</div><div class="th-preview-text" style="color:${th.textColor||'#333'};font-family:${th.textFont||'Arial'}">${esc(th.name)}</div>`

      const body = document.createElement('div')
      body.className = 'theme-card2-body'

      const name = document.createElement('div')
      name.className = 'theme-card2-name'
      name.textContent = th.name

      const actions = document.createElement('div')
      actions.className = 'theme-card2-actions'
      const editBtn = document.createElement('button')
      editBtn.innerHTML = '<i data-lucide="pencil"></i>'
      editBtn.title = I18n.t('toolbar.edit')
      editBtn.onclick = (e) => { e.stopPropagation(); openThemeEditor(th.id) }
      const dupBtn = document.createElement('button')
      dupBtn.innerHTML = '<i data-lucide="copy"></i>'
      dupBtn.title = I18n.t('context.duplicate')
      dupBtn.onclick = async (e) => { e.stopPropagation(); await duplicateTheme(th.id); renderThemes(); if (window.lucide) lucide.createIcons() }
      const delBtn = document.createElement('button')
      delBtn.className = 'th-del'
      delBtn.innerHTML = '<i data-lucide="trash-2"></i>'
      delBtn.title = I18n.t('context.delete')
      delBtn.onclick = (e) => { e.stopPropagation(); deleteTheme(th.id) }

      actions.appendChild(editBtn)
      actions.appendChild(dupBtn)
      actions.appendChild(delBtn)
      body.appendChild(name)
      body.appendChild(actions)
      card.appendChild(preview)
      card.appendChild(body)
      card.onclick = () => openThemeEditor(th.id)
      grid.appendChild(card)
    })
    if (window.lucide) lucide.createIcons()
  }

  function openThemeEditor(id) {
    editingThemeId = id
    window.editingThemeId = id
    const th = id ? themes.find(t => t.id === id) : null
    const title = document.getElementById('theme-dlg-title')
    title.textContent = th ? I18n.t('theme.editTitle') : I18n.t('theme.newTitle')
    document.getElementById('th-name').value = th ? th.name : ''
    document.getElementById('th-canvasBg').value = th ? th.canvasBg : '#ffffff'
    document.getElementById('th-titleColor').value = th ? th.titleColor : '#222222'
    document.getElementById('th-textColor').value = th ? th.textColor : '#333333'
    document.getElementById('th-titleFont').value = th ? th.titleFont : 'Arial'
    document.getElementById('th-textFont').value = th ? th.textFont : 'Arial'
    document.getElementById('th-animType').value = th ? th.animType : 'fade'
    document.getElementById('th-animDuration').value = th ? th.animDuration : 0.5
    const delBtn = document.getElementById('theme-dlg-delete')
    delBtn.style.display = th ? '' : 'none'
    updateThemePreview()
    document.getElementById('theme-dlg-overlay').classList.remove('hidden')
  }

  function closeThemeEditor() {
    document.getElementById('theme-dlg-overlay').classList.add('hidden')
    editingThemeId = null
    window.editingThemeId = null
  }

  function getThemeFormValues() {
    return {
      name: document.getElementById('th-name').value.trim(),
      canvasBg: document.getElementById('th-canvasBg').value,
      titleColor: document.getElementById('th-titleColor').value,
      textColor: document.getElementById('th-textColor').value,
      titleFont: document.getElementById('th-titleFont').value,
      textFont: document.getElementById('th-textFont').value,
      animType: document.getElementById('th-animType').value,
      animDuration: parseFloat(document.getElementById('th-animDuration').value) || 0.5
    }
  }

  function updateThemePreview() {
    const vals = getThemeFormValues()
    setThemePreview(vals)
  }

  async function saveTheme() {
    const vals = getThemeFormValues()
    if (!vals.name) { alert(I18n.t('theme.nameRequired')); return }
    let list = [...themes]
    if (editingThemeId) {
      const idx = list.findIndex(t => t.id === editingThemeId)
      if (idx !== -1) list[idx] = { ...list[idx], ...vals }
    } else {
      const id = 'th_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      list.push({ id, ...vals })
    }
    await ProjectManager.saveThemes(list)
    themes = list
    closeThemeEditor()
    renderThemes()
    if (window.lucide) lucide.createIcons()
  }

  async function deleteTheme(id) {
    if (!confirm(I18n.t('confirm.deleteTheme'))) return
    let list = themes.filter(t => t.id !== id)
    await ProjectManager.saveThemes(list)
    themes = list
    renderThemes()
    if (window.lucide) lucide.createIcons()
  }

  async function duplicateTheme(id) {
    const th = themes.find(t => t.id === id)
    if (!th) return
    const newId = 'th_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const copy = { ...th, id: newId, name: th.name + I18n.t('theme.copySuffix') }
    themes.push(copy)
    await ProjectManager.saveThemes(themes)
  }

  window.renderThemes = renderThemes
  window.openThemeEditor = openThemeEditor
  window.closeThemeEditor = closeThemeEditor
  window.saveTheme = saveTheme
  window.deleteTheme = deleteTheme
  window.updateThemePreview = updateThemePreview
  window.duplicateTheme = duplicateTheme
  window.setThemePreview = setThemePreview
})()
