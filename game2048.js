const SIZE = 4;

export function initGame2048() {
  const boardEl = document.getElementById('g2048-board');
  const scoreEl = document.getElementById('g2048-score');
  const statusEl = document.getElementById('g2048-status');
  const resetEl = document.getElementById('g2048-reset');

  let grid, score, best, gameOver, won;

  function emptyGrid() {
    return Array.from({length:SIZE}, () => Array(SIZE).fill(0));
  }

  function init() {
    grid = emptyGrid();
    score = 0;
    best = +(localStorage.getItem('g2048-best') || 0);
    gameOver = false;
    won = false;
    addRandomTile();
    addRandomTile();
    updateScore();
    render();
    statusEl.textContent = 'ใช้ปุ่มลูกศร / WASD / ปัดหน้าจอ';
  }

  function addRandomTile() {
    const empties = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function updateScore() {
    if (score > best) {
      best = score;
      localStorage.setItem('g2048-best', best);
    }
    scoreEl.textContent = `คะแนน: ${score} | สูงสุด: ${best}`;
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        const v = grid[r][c];
        if (v) {
          tile.textContent = v;
          tile.dataset.v = v;
        } else {
          tile.textContent = '';
        }
        boardEl.appendChild(tile);
      }
    }
  }

  function slideRow(row) {
    // บีบซ้าย
    const filtered = row.filter(v => v);
    const merged = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i+1]) {
        const nv = filtered[i] * 2;
        merged.push(nv);
        gained += nv;
        if (nv === 2048 && !won) { won = true; statusEl.textContent = '🎉 คุณสร้าง 2048 ได้!'; }
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return { row: merged, gained };
  }

  function move(dir) {
    if (gameOver) return;
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

    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c] !== before[r][c]) moved = true;

    if (moved) {
      score += totalGain;
      addRandomTile();
      updateScore();
      render();
      if (totalGain > 0) statusEl.textContent = `+${totalGain} คะแนน`;
      if (!canMove()) {
        gameOver = true;
        statusEl.textContent = `💀 ไม่มีที่ให้เดินแล้ว! คะแนน ${score}`;
      }
    }
  }

  function canMove() {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return true;
        if (c < SIZE - 1 && grid[r][c] === grid[r][c+1]) return true;
        if (r < SIZE - 1 && grid[r][c] === grid[r+1][c]) return true;
      }
    return false;
  }

  // Input
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('panel-game2048').classList.contains('active')) return;
    const map = {
      ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down',
      a:'left', d:'right', w:'up', s:'down', A:'left', D:'right', W:'up', S:'down'
    };
    const dir = map[e.key];
    if (dir) { e.preventDefault(); move(dir); }
  });

  document.querySelectorAll('.g2048-arrow').forEach(btn => {
    btn.addEventListener('click', () => move(btn.dataset.dir));
  });

  // Touch swipe
  let touchStart = null;
  boardEl.addEventListener('touchstart', e => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  boardEl.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) move('right');
      else if (dx < -30) move('left');
    } else {
      if (dy > 30) move('down');
      else if (dy < -30) move('up');
    }
    touchStart = null;
  });

  resetEl.addEventListener('click', init);
  init();
}
