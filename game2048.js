import { $, randomChoice } from '../utils.js';

const SIZE = 4;

export function initGame2048() {
  const boardEl = $('g2048-board'), scoreEl = $('g2048-score'), statusEl = $('g2048-status');
  const resetEl = $('g2048-reset'), undoEl = $('g2048-undo');
  let grid, score, best, gameOver, prevState;

  function emptyGrid() { return Array.from({length:SIZE}, () => Array(SIZE).fill(0)); }
  function init() {
    grid = emptyGrid(); score = 0;
    best = +(localStorage.getItem('g2048-best') || 0);
    gameOver = false; prevState = null;
    addRandomTile(); addRandomTile();
    updateScore(); render();
    statusEl.textContent = 'ใช้ปุ่มลูกศร / WASD / ปัดหน้าจอ';
  }
  function addRandomTile() {
    const empties = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) empties.push([r, c]);
    if (!empties.length) return;
    const [r, c] = randomChoice(empties);
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  function updateScore() {
    if (score > best) { best = score; localStorage.setItem('g2048-best', best); }
    scoreEl.textContent = `คะแนน: ${score} | สูงสุด: ${best}`;
  }
  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      const v = grid[r][c];
      if (v) { tile.textContent = v; tile.dataset.v = v; }
      boardEl.appendChild(tile);
    }
  }
  function slideRow(row) {
    const filtered = row.filter(v => v);
    const merged = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i+1]) {
        const nv = filtered[i] * 2;
        merged.push(nv); gained += nv; i++;
      } else merged.push(filtered[i]);
    }
    while (merged.length < SIZE) merged.push(0);
    return { row: merged, gained };
  }
  function move(dir) {
    if (gameOver) return;
    prevState = { grid: grid.map(row => [...row]), score };
    let moved = false, totalGain = 0;
    const before = grid.map(row => [...row]);
    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < SIZE; r++) {
        let row = grid[r].slice();
        if (dir === 'right') row.reverse();
        const { row: newRow, gained } = slideRow(row);
        totalGain += gained;
        let finalRow = newRow;
        if (dir === 'right') finalRow.reverse();
        grid[r] = finalRow;
      }
    } else {
      for (let c = 0; c < SIZE; c++) {
        let col = grid.map(row => row[c]);
        if (dir === 'down') col.reverse();
        const { row: newCol, gained } = slideRow(col);
        totalGain += gained;
        let finalCol = newCol;
        if (dir === 'down') finalCol.reverse();
        for (let r = 0; r < SIZE; r++) grid[r][c] = finalCol[r];
      }
    }
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] !== before[r][c]) moved = true;
    if (moved) {
      score += totalGain; addRandomTile(); updateScore(); render();
      if (totalGain > 0) statusEl.textContent = `+${totalGain} คะแนน`;
      if (!canMove()) { gameOver = true; statusEl.textContent = `💀 ไม่มีที่ให้เดิน! คะแนน ${score}`; }
    }
  }
  function canMove() {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < SIZE-1 && grid[r][c] === grid[r][c+1]) return true;
      if (r < SIZE-1 && grid[r][c] === grid[r+1][c]) return true;
    }
    return false;
  }
  function undo() {
    if (!prevState) return;
    grid = prevState.grid; score = prevState.score;
    prevState = null; gameOver = false;
    updateScore(); render();
    statusEl.textContent = '↩️ ย้อนกลับแล้ว';
  }
  document.addEventListener('keydown', (e) => {
    if (!$('panel-game2048').classList.contains('active')) return;
    const map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down',
                  a:'left', d:'right', w:'up', s:'down' };
    const dir = map[e.key];
    if (dir) { e.preventDefault(); move(dir); }
  });
  document.querySelectorAll('.g2048-arrow').forEach(btn => btn.addEventListener('click', () => move(btn.dataset.dir)));
  let touchStart = null;
  boardEl.addEventListener('touchstart', e => { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  boardEl.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) move('right'); else if (dx < -30) move('left');
    } else {
      if (dy > 30) move('down'); else if (dy < -30) move('up');
    }
    touchStart = null;
  });
  resetEl.addEventListener('click', init);
  undoEl.addEventListener('click', undo);
  init();
}
