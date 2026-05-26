function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildExportHTML() {
  let h = '';
  getData().slides.forEach((s, i) => {
    h += `<div class="sp" style="background:${s.background || '#fff'}">`;
    s.elements.forEach(el => {
      const st = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;opacity:${el.opacity !== undefined ? el.opacity : 1};transform:rotate(${el.rotation || 0}deg)`;
      if (el.type === 'text') {
        const deco = [];
        if (el.underline) deco.push('underline');
        if (el.strikethrough) deco.push('line-through');
        h += `<div style="${st};font-size:${el.fontSize || 16}px;font-family:${el.fontFamily || 'Arial'};color:${el.color || '#333'};font-weight:${el.bold ? 'bold' : 'normal'};font-style:${el.italic ? 'italic' : 'normal'};text-decoration:${deco.join(' ')};background:${el.bgColor || 'transparent'};text-align:${el.textAlign || 'left'};overflow:hidden;word-wrap:break-word">${escHtml(el.content || '')}</div>`;
      } else if (el.type === 'image') {
        h += `<div style="${st};overflow:hidden"><img src="${el.src}" style="width:100%;height:100%;object-fit:contain"></div>`;
      } else if (el.type === 'rect') {
        h += `<div style="${st};background:${el.fill || '#ffd700'};border:${el.borderWidth || 2}px solid ${el.borderColor || '#ffd700'};border-radius:${el.borderRadius || 0}px"></div>`;
      } else if (el.type === 'circle') {
        h += `<div style="${st};background:${el.fill || '#ffd700'};border:${el.borderWidth || 2}px solid ${el.borderColor || '#ffd700'};border-radius:50%"></div>`;
      } else if (el.type === 'arrow') {
        h += `<div style="${st}"><svg width="${el.width}" height="${el.height}" viewBox="0 0 ${el.width} ${el.height}"><defs><marker id="ex_${el.id}" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${el.fill || '#ffd700'}"/></marker></defs><line x1="0" y1="${el.height / 2}" x2="${el.width}" y2="${el.height / 2}" stroke="${el.fill || '#ffd700'}" stroke-width="${el.borderWidth || 3}" marker-end="url(#ex_${el.id})"/></svg></div>`;
      }
    });
    h += '</div>';
  });
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111}.sp{width:960px;height:540px;position:relative;overflow:hidden;margin:20px auto;box-shadow:0 2px 10px rgba(0,0,0,0.3)}</style></head><body>' + h + '</body></html>';
}

async function exportPDF() {
  if (window.electronAPI) await window.electronAPI.exportPDF(buildExportHTML());
}

async function exportPNG() {
  if (window.electronAPI) await window.electronAPI.exportPNG(getData());
}

window.escHtml = escHtml;
window.buildExportHTML = buildExportHTML;
window.exportPDF = exportPDF;
window.exportPNG = exportPNG;
