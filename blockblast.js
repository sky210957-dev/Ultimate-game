const SIZE = 8;
const SHAPES = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[1,1]],
  [[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[0,2],[1,2]],
];
const COLORS = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#22d3ee','#fb923c'];

export function initBlockBlast() {
  const gridEl = document.getElementById('bb-grid');
  const trayEl = document.getElementById('bb-tray');
  const scoreEl = document.getElementById('bb-score');
  const statusEl = document.getElementById('bb-status');
  const resetEl = document.getElementById('bb-reset');

  let grid, tray, score, best, currentDrag;

  function emptyGrid() { return Array.from({length:SIZE}, () => Array(SIZE).fill(null)); }

  function randomPiece() {
    const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    return { shape, color };
  }

  function init() {
    grid = emptyGrid();
    tray = [randomPiece(), randomPiece(), randomPiece()];
    score = 0;
    best = +(localStorage.getItem('bb-best') || 0);
    render();
    updateScore();
    statusEl.textContent = 'ลากบล็อกลงบนกระดาน';
  }

  function updateScore() {
    scoreEl.textContent = `คะแนน: ${score} | สูงสุด: ${best}`;
  }

  function render() {
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (grid[r][c]) {
        cell.classList.add('filled');
        cell.style.background = grid[r][c];
      }
      cell.dataset.r = r; cell.dataset.c = c;
      cell.addEventListener('dragover', e => e.preventDefault());
      cell.addEventListener('drop', e => onDrop(e, r, c));
      gridEl.appendChild(cell);
    }
    trayEl.innerHTML = '';
    tray.forEach((piece, i) => {
      if (!piece) {
        const ph = document.createElement('div');
        ph.style.width = '60px'; ph.style.height = '60px'; ph.style.opacity = '.2';
        trayEl.appendChild(ph);
        return;
      }
      const el = document.createElement('div');
      el.className = 'piece';
      el.draggable = true;
      el.dataset.idx = i;
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
      el.addEventListener('dragstart', () => { currentDrag = i; });
      el.addEventListener('touchstart', e => {
        currentDrag = i;
        highlightTarget(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      el.addEventListener('touchmove', e => {
        highlightTarget(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }, { passive: false });
      el.addEventListener('touchend', e => {
        const t = e.changedTouches[0];
        const target = document.elementFromPoint(t.clientX, t.clientY);
        if (target && target.classList.contains('cell')) tryPlace(currentDrag, +target.dataset.r, +target.dataset.c);
        clearHighlight();
        currentDrag = null;
      });
      trayEl.appendChild(el);
    });
  }

  function highlightTarget(x, y) {
    clearHighlight();
    const el = document.elementFromPoint(x, y);
    if (el && el.classList.contains('cell')) el.style.outline = '2px solid #facc15';
  }
  function clearHighlight() {
    gridEl.querySelectorAll('.cell').forEach(c => c.style.outline = '');
  }
  function onDrop(e, r, c) {
    e.preventDefault();
    if (currentDrag === null) return;
    tryPlace(currentDrag, r, c);
    currentDrag = null;
  }

  function tryPlace(idx, r, c) {
    const piece = tray[idx];
    if (!piece) return;
    for (const [dr, dc] of piece.shape) {
      const rr = r+dr, cc = c+dc;
      if (rr >= SIZE || cc >= SIZE || grid[rr][cc]) {
        statusEl.textContent = '❌ วางตรงนี้ไม่ได้';
        return;
      }
    }
    for (const [dr, dc] of piece.shape) grid[r+dr][c+dc] = piece.color;
    tray[idx] = null;
    let cleared = 0;
    for (let rr = 0; rr < SIZE; rr++) {
      if (grid[rr].every(v => v)) { grid[rr] = Array(SIZE).fill(null); cleared++; }
    }
    for (let cc = 0; cc < SIZE; cc++) {
      let full = true;
      for (let rr = 0; rr < SIZE; rr++) if (!grid[rr][cc]) { full = false; break; }
      if (full) { for (let rr = 0; rr < SIZE; rr++) grid[rr][cc] = null; cleared++; }
    }
    if (cleared) {
      score += cleared * 10 * cleared;
      statusEl.textContent = `🔥 ล้าง ${cleared} แถว/คอลัมน์! +${cleared*10*cleared}`;
    } else {
      score += piece.shape.length;
      statusEl.textContent = 'วางแล้ว';
    }
    if (score > best) { best = score; localStorage.setItem('bb-best', best); }
    updateScore();
    if (tray.every(p => !p)) {
      tray = [randomPiece(), randomPiece(), randomPiece()];
      statusEl.textContent = 'ชิ้นใหม่มาแล้ว!';
    }
    render();
    if (!canPlaceAny()) {
      statusEl.textContent = `💀 ไม่มีที่วางแล้ว! คะแนน ${score}`;
      setTimeout(() => { if (confirm('เกมจบ! เริ่มใหม่?')) init(); }, 100);
    }
  }

  function canPlaceAny() {
    for (let idx = 0; idx < tray.length; idx++) {
      const piece = tray[idx];
      if (!piece) continue;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        let ok = true;
        for (const [dr, dc] of piece.shape) {
          const rr = r+dr, cc = c+dc;
          if (rr >= SIZE || cc >= SIZE || grid[rr][cc]) { ok = false; break; }
        }
        if (ok) return true;
      }
    }
    return false;
  }

  resetEl.addEventListener('click', init);
  init();
}
