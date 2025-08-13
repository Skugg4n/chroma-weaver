document.getElementById('fileInput').addEventListener('change', handleFileSelect);

let svgText = '';
let colors = [];

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    svgText = e.target.result;
    parseColors(svgText);
    document.getElementById('convertBtn').disabled = false;
  };
  reader.readAsText(file);
}

function parseColors(text) {
  colors = [];
  const regex = /fill="([^\"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const color = match[1];
    if (!colors.includes(color)) {
      colors.push(color);
    }
  }
  const tbody = document.querySelector('#colorTable tbody');
  tbody.innerHTML = '';
  colors.forEach(color => {
    const rgb = toRGB(color);
    const cmyk = rgbToCmyk(rgb);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="color-swatch" style="background:${color}"></span> ${color}</td>
      <td>
        C: <input type="number" min="0" max="100" value="${Math.round(cmyk.c * 100)}" step="1">
        M: <input type="number" min="0" max="100" value="${Math.round(cmyk.m * 100)}" step="1">
        Y: <input type="number" min="0" max="100" value="${Math.round(cmyk.y * 100)}" step="1">
        K: <input type="number" min="0" max="100" value="${Math.round(cmyk.k * 100)}" step="1">
      </td>
    `;
    tbody.appendChild(row);
  });
}

function toRGB(color) {
  let r, g, b;
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0,2), 16);
      g = parseInt(hex.slice(2,4), 16);
      b = parseInt(hex.slice(4,6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const parts = color.match(/\d+/g);
    r = parseInt(parts[0]);
    g = parseInt(parts[1]);
    b = parseInt(parts[2]);
  } else {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    const computed = ctx.fillStyle;
    return toRGB(computed);
  }
  return {r, g, b};
}

function rgbToCmyk({r, g, b}) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return {c: 0, m: 0, y: 0, k: 1};
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return {c, m, y, k};
}

document.getElementById('convertBtn').addEventListener('click', () => {
  const tbody = document.querySelector('#colorTable tbody');
  const rows = Array.from(tbody.rows);
  let newSvg = svgText;
  rows.forEach((row, idx) => {
    const color = colors[idx];
    const inputs = row.querySelectorAll('input');
    const c = parseInt(inputs[0].value) / 100;
    const m = parseInt(inputs[1].value) / 100;
    const y = parseInt(inputs[2].value) / 100;
    const k = parseInt(inputs[3].value) / 100;
    const cmykString = `device-cmyk(${c.toFixed(2)} ${m.toFixed(2)} ${y.toFixed(2)} ${k.toFixed(2)})`;
    const re = new RegExp(`fill="${color}"`, 'g');
    newSvg = newSvg.replace(re, `fill="${cmykString}"`);
  });
  downloadSVG(newSvg);
});

function downloadSVG(data) {
  const blob = new Blob([data], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'converted.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
