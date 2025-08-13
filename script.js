const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const tableBody = document.getElementById('tableBody');
const convertBtn = document.getElementById('convertBtn');
const resetBtn = document.getElementById('resetBtn');
const fileInfo = document.getElementById('fileInfo');
const msg = document.getElementById('msg');

let originalSvgText = '';
let foundHexes = new Set();

fileInput.addEventListener('change', e => loadFile(e.target.files?.[0]));
['dragenter','dragover'].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag'); })
);
['dragleave','drop'].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag'); })
);
dropzone.addEventListener('drop', e => {
  const f = e.dataTransfer?.files?.[0]; if (f) loadFile(f);
});

resetBtn.addEventListener('click', () => {
  originalSvgText = ''; foundHexes.clear(); tableBody.innerHTML = '';
  convertBtn.disabled = true; resetBtn.disabled = true; fileInfo.textContent = '';
  fileInput.value = '';
  msg.textContent = '';
});

convertBtn.addEventListener('click', () => {
  try {
    const map = collectMapping();
    const out = applyMapping(originalSvgText, map);
    download('converted.svg', out);
    msg.textContent = 'Converted file downloaded.';
  } catch (e) {
    msg.textContent = 'Conversion failed: ' + e.message;
  }
});

function loadFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.svg')) {
    msg.textContent = 'Please choose an .svg file.'; return;
  }
  const r = new FileReader();
  r.onload = () => {
    originalSvgText = String(r.result || '');
    if (!originalSvgText.includes('<svg')) {
      msg.textContent = 'Not an SVG or file is empty.'; return;
    }
    buildTableFromSvg(originalSvgText);
    convertBtn.disabled = false; resetBtn.disabled = false;
    fileInfo.textContent = `Loaded: ${file.name} (${file.size} bytes)`;
    msg.textContent = '';
  };
  r.onerror = () => msg.textContent = 'Failed to read file.';
  r.readAsText(file);
}

function buildTableFromSvg(svg) {
  foundHexes = new Set();
  // Extract fill="#rrggbb" (flat fills)
  const re = /fill\s*=\s*["']\s*(#[0-9a-fA-F]{6})\s*["']/g;
  let m; while ((m = re.exec(svg))) foundHexes.add(m[1].toLowerCase());
  tableBody.innerHTML = '';
  if (foundHexes.size === 0) {
    tableBody.innerHTML = `<tr><td colspan="2"><span class="muted">No flat hex fills found.</span></td></tr>`;
    return;
  }
  for (const hex of Array.from(foundHexes).sort()) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${hex}</code></td>
      <td>
        <input type="number" min="0" max="100" step="1" placeholder="C" class="cmyk" style="width:64px">
        <input type="number" min="0" max="100" step="1" placeholder="M" class="cmyk" style="width:64px">
        <input type="number" min="0" max="100" step="1" placeholder="Y" class="cmyk" style="width:64px">
        <input type="number" min="0" max="100" step="1" placeholder="K" class="cmyk" style="width:64px">
      </td>`;
    tr.dataset.hex = hex;
    tableBody.appendChild(tr);
  }
}

function collectMapping() {
  const rows = [...tableBody.querySelectorAll('tr')];
  if (rows.length === 0 || foundHexes.size === 0) throw new Error('No colors to convert.');
  const map = {};
  for (const tr of rows) {
    const inputs = tr.querySelectorAll('input.cmyk');
    if (inputs.length !== 4) continue;
    const vals = [...inputs].map(i => clamp(parseInt(i.value || '0', 10), 0, 100));
    map[tr.dataset.hex] = vals; // [C,M,Y,K]
  }
  return map;
}

function applyMapping(svg, map) {
  // Replace fill hexes with CMYK as a custom attribute and keep original hex for safety:
  // e.g., fill="#ff0000" -> fill="#ff0000" cmyk="0,100,100,0"
  for (const [hex, [c,m,y,k]] of Object.entries(map)) {
    const re = new RegExp(`(fill\\s*=\\s*["'])${escapeRegExp(hex)}(\\s*["'])`, 'gi');
    svg = svg.replace(re, `$1${hex}$2 cmyk="${c},${m},${y},${k}"`);
  }
  return svg;
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: 'image/svg+xml'}));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, isFinite(n)?n:0));
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
