function renderSlide() {
  const c = document.getElementById('slide-container');
  const s = slide();
  if (!s || !c) return;
  c.style.background = s.background || '#fff';
  document.getElementById('canvas').style.background = s.background || '#fff';
  if (document.activeElement?.closest?.('.canvas-el.text-el[contenteditable]')) return;
  
  const existingEls = Array.from(c.children).filter(child => child.classList.contains('canvas-el'));
  const elIds = new Set(s.elements.map(el => el.id));
  
  for (const child of existingEls) {
    if (!elIds.has(child.dataset.id)) {
      c.removeChild(child);
    }
  }

  s.elements.forEach((el, i) => {
    let d = c.querySelector(`.canvas-el[data-id="${el.id}"]`);
    if (!d) {
      d = document.createElement('div');
      d.dataset.id = el.id;
      c.appendChild(d);
    }
    
    const isSel = el.id === App.sel || App.selectedIds?.includes(el.id);
    d.className = 'canvas-el' + ((el.type === 'text' || el.type === 'title') ? ' text-el' : '') + (isSel ? ' selected' : '');
    
    let css = `left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;z-index:${i}`;
    if (el.opacity !== undefined && el.opacity < 1) css += `;opacity:${el.opacity}`;
    if (el.rotation) css += `;transform:rotate(${el.rotation}deg)`;
    d.style.cssText = css;
    
    d.innerHTML = '';
    renderEl(d, el);
    addHandles(d);
  });
  
  if (window.updateStatusBar) window.updateStatusBar();
}

function renderEl(d, el) {
  switch (el.type) {
    case 'title':
    case 'text':
      d.contentEditable = true;
      d.textContent = el.content || '';
      applyTextStyle(d, el);
      break;
    case 'image':
      const img = document.createElement('img');
      img.src = el.src;
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none';
      d.appendChild(img);
      d.style.overflow = 'hidden';
      break;
    case 'rect':
      d.style.background = el.fill || '#ffd700';
      d.style.border = `${el.borderWidth || 2}px solid ${el.borderColor || '#ffd700'}`;
      d.style.borderRadius = (el.borderRadius || 0) + 'px';
      break;
    case 'circle':
      d.style.background = el.fill || '#ffd700';
      d.style.border = `${el.borderWidth || 2}px solid ${el.borderColor || '#ffd700'}`;
      d.style.borderRadius = '50%';
      break;
    case 'arrow':
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', `0 0 ${el.width} ${el.height}`);
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      m.setAttribute('id', 'ah_' + el.id);
      m.setAttribute('markerWidth', '10');
      m.setAttribute('markerHeight', '7');
      m.setAttribute('refX', '10');
      m.setAttribute('refY', '3.5');
      m.setAttribute('orient', 'auto');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      p.setAttribute('points', '0 0, 10 3.5, 0 7');
      p.setAttribute('fill', el.fill || '#ffd700');
      m.appendChild(p);
      defs.appendChild(m);
      svg.appendChild(defs);
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', '0');
      l.setAttribute('y1', el.height / 2);
      l.setAttribute('x2', el.width);
      l.setAttribute('y2', el.height / 2);
      l.setAttribute('stroke', el.fill || '#ffd700');
      l.setAttribute('stroke-width', el.borderWidth || 3);
      l.setAttribute('marker-end', 'url(#ah_' + el.id + ')');
      svg.appendChild(l);
      svg.style.pointerEvents = 'none';
      d.appendChild(svg);
      break;
  }
}

function applyTextStyle(d, el) {
  d.style.fontSize = (el.fontSize || 16) + 'px';
  d.style.fontFamily = el.fontFamily || 'Arial';
  d.style.color = el.color || '#333';
  d.style.fontWeight = el.bold ? 'bold' : 'normal';
  d.style.fontStyle = el.italic ? 'italic' : 'normal';
  d.style.textAlign = el.textAlign || 'left';
  const deco = [];
  if (el.underline) deco.push('underline');
  if (el.strikethrough) deco.push('line-through');
  d.style.textDecoration = deco.join(' ');
  d.style.background = el.bgColor || 'transparent';
  d.style.overflow = 'hidden';
  d.style.wordWrap = 'break-word';
  d.style.outline = 'none';
  d.style.border = 'none';
}

function addHandles(d) {
  for (const p of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
    const h = document.createElement('div');
    h.className = 'rh ' + p;
    d.appendChild(h);
  }
}

function renderThumbs() {
  const list = document.getElementById('slide-list');
  if (!list) return;
  list.innerHTML = '';
  App.slides.forEach((s, i) => {
    const t = document.createElement('div');
    t.className = 'slide-thumb' + (i === App.cur ? ' active' : '');
    t.dataset.index = i;
    t.draggable = true;
    const n = document.createElement('span');
    n.className = 'thumb-number';
    n.textContent = i + 1;
    t.appendChild(n);
    const del = document.createElement('button');
    del.className = 'thumb-del';
    del.textContent = '×';
    del.onclick = e => { e.stopPropagation(); delSlide(i); };
    t.appendChild(del);
    const inner = document.createElement('div');
    inner.className = 'thumb-inner';
    inner.style.background = s.background || '#fff';
    s.elements.forEach(el => {
      const x = document.createElement('div');
      x.style.cssText = `position:absolute;left:${el.x * 0.2}px;top:${el.y * 0.2}px;width:${el.width * 0.2}px;height:${el.height * 0.2}px`;
      if (el.type === 'text' || el.type === 'title') {
        x.textContent = el.content || '';
        x.style.fontSize = ((el.fontSize || 16) * 0.2) + 'px';
        x.style.color = el.color || '#333';
        x.style.overflow = 'hidden';
        x.style.fontFamily = el.fontFamily || 'Arial';
      } else if (el.type === 'image') {
        x.style.background = `url(${el.src}) center/contain no-repeat`;
      } else if (el.type === 'rect') {
        x.style.background = el.fill || '#ffd700';
        x.style.borderRadius = ((el.borderRadius || 0) * 0.2) + 'px';
      } else if (el.type === 'circle') {
        x.style.background = el.fill || '#ffd700';
        x.style.borderRadius = '50%';
      } else if (el.type === 'arrow') {
        x.style.borderTop = `${(el.borderWidth || 3) * 0.2}px solid ${el.fill || '#ffd700'}`;
      }
      inner.appendChild(x);
    });
    t.appendChild(inner);
    t.onclick = () => selectSlide(i);
    t.ondragstart = e => { e.dataTransfer.setData('text/plain', i); t.classList.add('drag-over'); };
    t.ondragend = () => t.classList.remove('drag-over');
    t.ondragover = e => e.preventDefault();
    t.ondrop = e => {
      e.preventDefault();
      const f = parseInt(e.dataTransfer.getData('text/plain'));
      if (f !== i) moveSlide(f, i);
    };
    list.appendChild(t);
  });
}

function renderAll() {
  renderSlide();
  renderThumbs();
  updateToolbar();
  const bgInput = document.getElementById('slide-bg-color');
  if (bgInput) bgInput.value = slide()?.background || '#ffffff';
  if (window.updateStatusBar) window.updateStatusBar();
}

function updateToolbar() {
  const el = selEl();
  const bold = document.querySelector('[data-action="bold"]');
  const italic = document.querySelector('[data-action="italic"]');
  const ul = document.querySelector('[data-action="underline"]');
  const st = document.querySelector('[data-action="strikethrough"]');
  const font = document.getElementById('font-family-select');
  const size = document.getElementById('font-size-select');
  const color = document.getElementById('text-color-input');
  const bg = document.getElementById('text-bg-color');
  if (el && el.type === 'text') {
    bold?.classList.toggle('active', !!el.bold);
    italic?.classList.toggle('active', !!el.italic);
    ul?.classList.toggle('active', !!el.underline);
    st?.classList.toggle('active', !!el.strikethrough);
    if (font) font.value = el.fontFamily || 'Arial';
    if (size) size.value = String(el.fontSize || 16);
    if (color) color.value = el.color || '#333';
    if (bg) bg.value = el.bgColor || '#000000';
  } else {
    bold?.classList.remove('active');
    italic?.classList.remove('active');
    ul?.classList.remove('active');
    st?.classList.remove('active');
  }
}

window.renderSlide = renderSlide;
window.renderThumbs = renderThumbs;
window.renderAll = renderAll;
window.updateToolbar = updateToolbar;
