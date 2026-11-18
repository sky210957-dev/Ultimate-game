import { $ } from '../utils.js';

const SIZE = 8;
const SHAPES = [
  [[0,0]],
  [[0,0],[0,1]], [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[1,1]], [[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[1,1]], [[0,0],[0,1],[1,0]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,2]],
  [[0,1],[0,2],[1,0],[1,1]], [[0,0],[0,1],[1,1],[1,2]]
];
const COLORS = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#22d3ee','#fb923c'];

export function initBlockBlast() {
  const gridEl = $('bb-grid'), trayEl = $('bb-tray'), scoreEl = $('bb-score');
  const statusEl = $('bb-status'), resetEl = $('bb-reset');
  let grid, tray, score, best, selectedIdx, hoverR = -1, hoverC = -1, combo = 0;

  function emptyGrid() { return Array.from({length:SIZE}, () => Array(SIZE).fill(null)); }
  function randomPiece() {
    const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    return { shape, color };
  }
  function init() {
    grid = emptyGrid();
    tray = [randomPiece(), randomPiece(), randomPiece()];
    score = 0; combo = 0; selectedIdx = null;
    best = +(localStorage.getItem('bb-best') || 0);
    render(); updateScore();
    statusEl.textContent = 'เลือกชิ้น → คลิกช่องว่างเพื่อวาง';
  }
  function updateScore() {
    scoreEl.textContent = `คะแนน: ${score} | สูงสุด: ${best}${combo > 1 ? ' | Combo x' + combo : ''}`;
  }
  function canPlace(shape, r, c) {
    for (const [dr, dc] of shape) {
      const rr = r+dr, cc = c+dc;
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || grid[rr][cc]) return false;
    }
    return true;
  }
  function render() {
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (grid[r][c]) { cell.classList.add('filled'); cell.style.background = grid[r][c]; }
      cell.dataset.r = r; cell.dataset.c = c;
      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('mouseenter', () => onCellHover(r, c));
      cell.addEventListener('mouseleave', () => clearPreview());
      gridEl.appendChild(cell);
    }
    if (selectedIdx !== null && hoverR >= 0 && hoverC >= 0) {
      const piece = tray[selectedIdx];
      if (piece) {
        const ok = canPlace(piece.shape, hoverR, hoverC);
        for (const [dr, dc] of piece.shape) {
          const rr = hoverR+dr, cc = hoverC+dc;
          if (rr < SIZE && cc < SIZE) {
            const idx = rr * SIZE + cc;
            gridEl.children[idx].classList.add(ok ? 'preview-ok' : 'preview-bad');
          }
        }
      }
    }
    trayEl.innerHTML = '';
    tray.forEach((piece, i) => {
      if (!piece) {
        const ph = document.createElement('div');
        ph.style.width = '60px'; ph.style.height = '60px';
        trayEl.appendChild(ph);
        return;
      }
      const el = document.createElement('div');
      el.className = 'piece';
      if (selectedIdx === i) el.classList.add('selected');
      const maxR = Math.max(...piece.shape.map(([r]) => r));
      const maxC = Math.max(...piece.shape.map(([_,c]) => c));
      el.style.gridTemplateColumns = `repeat(${maxC+1}, 26px)`;
      el.style.gridTemplateRows = `repeat(${maxR+1}, 26px)`;
      for (let r = 0; r <= maxR; r++) for (let c = 0; c <= maxC; c++) {
        const sq = document.createElement('div');
        sq.className = 'sq';
        const filled = piece.shape.some(([sr,sc]) => sr === r && sc === c);
        sq.style.background = filled ? piece.color : 'transparent';
        el.appendChild(sq);
      }
      el.addEventListener('click', () => {
        selectedIdx = i;
        statusEl.textContent = 'เลือกชิ้นแล้ว — คลิกช่องบนกระดานเพื่อวาง';
        render();
      });
      trayEl.appendChild(el);
    });
  }
  function onCellHover(r, c) {
    if (selectedIdx === null) return;
    hoverR = r; hoverC = c;
    render();
  }
  function clearPreview() {
    hoverR = -1; hoverC = -1;
    gridEl.querySelectorAll('.cell').forEach(c => c.classList.remove('preview-ok', 'preview-bad'));
  }
  function onCellClick(r, c) {
    if (selectedIdx === null) { statusEl.textContent = 'เลือกชิ้นจากถาดก่อน'; return; }
    const piece = tray[selectedIdx];
    if (!piece || !canPlace(piece.shape, r, c)) {
      statusEl.textContent = '❌ วางตรงนี้ไม่ได้';
      return;
    }
    for (const [dr, dc] of piece.shape) grid[r+dr][c+dc] = piece.color;
    tray[selectedIdx] = null;
    selectedIdx = null;
    const toClear = [];
    for (let rr = 0; rr < SIZE; rr++) if (grid[rr].every(v => v)) toClear.push(...grid[rr].map((_,i) => [rr,i]));
    for (let cc = 0; cc < SIZE; cc++) {
      let full = true;
      for (let rr = 0; rr < SIZE; rr++) if (!grid[rr][cc]) { full = false; break; }
      if (full) for (let rr = 0; rr < SIZE; rr++) toClear.push([rr,cc]);
    }
    if (toClear.length) {
      const unique = [...new Map(toClear.map(x => [x.join(','), x])).values()];
      for (const [rr,cc] of unique) {
        const idx = rr * SIZE + cc;
        gridEl.children[idx].classList.add('clearing');
      }
      combo++;
      const gained = unique.length * 10 * combo;
      score += gained;
      statusEl.textContent = `🔥 ล้าง ${unique.length} ช่อง! +${gained} (Combo x${combo})`;
      setTimeout(() => {
        for (const [rr,cc] of unique) grid[rr][cc] = null;
        render();
      }, 300);
    } else {
      combo = 0;
      score += piece.shape.length;
      statusEl.textContent = 'วางแล้ว';
      render();
    }
    if (score > best) { best = score; localStorage.setItem('bb-best', best); }
    updateScore();
    if (tray.every(p => !p)) {
      tray = [randomPiece(), randomPiece(), randomPiece()];
      combo = 0;
    }
    setTimeout(() => {
      if (!canPlaceAny()) {
        statusEl.textContent = `💀 ไม่มีที่วางแล้ว! คะแนน ${score}`;
        setTimeout(() => { if (confirm('เกมจบ! เริ่มใหม่?')) init(); }, 100);
      }
    }, 350);
  }
  function canPlaceAny() {
    for (const piece of tray) {
      if (!piece) continue;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        if (canPlace(piece.shape, r, c)) return true;
      }
    }
    return false;
  }
  resetEl.addEventListener('click', init);
  init();
}
