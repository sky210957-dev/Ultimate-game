import { $, randomChoice } from '../utils.js';

const ROWS = 6, COLS = 7;

export function initConnect4() {
  const boardEl = $('c4-board'), statusEl = $('c4-status');
  const modeEl = $('c4-mode'), diffEl = $('c4-diff'), resetEl = $('c4-reset');
  let grid, turn, gameOver, winCells;

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (grid[r][c] === 'R') cell.classList.add('red');
      if (grid[r][c] === 'Y') cell.classList.add('yellow');
      if (winCells && winCells.some(([wr,wc]) => wr === r && wc === c)) cell.classList.add('win');
      cell.addEventListener('click', () => drop(c));
      boardEl.appendChild(cell);
    }
  }
  function drop(c) {
    if (gameOver) return;
    if (modeEl.value === 'bot' && turn !== 'R') return;
    doDrop(c, turn);
  }
  function doDrop(c, color) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][c]) {
        grid[r][c] = color;
        const w = checkWin(r, c, color);
        if (w) {
          gameOver = true; winCells = w;
          statusEl.textContent = color === 'R' ? '🔴 แดงชนะ!' : '🟡 เหลืองชนะ!';
          render(); return;
        }
        turn = color === 'R' ? 'Y' : 'R';
        statusEl.textContent = `ตาของ ${turn === 'R' ? '🔴 แดง' : '🟡 เหลือง'}`;
        render();
        if (modeEl.value === 'bot' && turn === 'Y') setTimeout(botMove, 400);
        return;
      }
    }
  }
  function checkWin(r, c, color) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr,dc] of dirs) {
      const cells = [[r,c]];
      for (let k = 1; k < 4; k++) {
        const nr = r + dr*k, nc = c + dc*k;
        if (nr<0||nr>=ROWS||nc<0||nc>=COLS||grid[nr][nc] !== color) break;
        cells.push([nr,nc]);
      }
      for (let k = 1; k < 4; k++) {
        const nr = r - dr*k, nc = c - dc*k;
        if (nr<0||nr>=ROWS||nc<0||nc>=COLS||grid[nr][nc] !== color) break;
        cells.push([nr,nc]);
      }
      if (cells.length >= 4) return cells;
    }
    return null;
  }
  function getEmptyRow(c) {
    for (let r = ROWS-1; r >= 0; r--) if (!grid[r][c]) return r;
    return -1;
  }
  function evaluate() {
    let score = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === 'Y') score += r;
      else if (grid[r][c] === 'R') score -= r;
    }
    return score;
  }
  function minimax(depth, isMax, alpha, beta) {
    const empties = [];
    for (let c = 0; c < COLS; c++) if (!grid[0][c]) empties.push(c);
    if (depth === 0 || !empties.length) return evaluate();
    if (isMax) {
      let best = -Infinity;
      for (const c of empties) {
        const r = getEmptyRow(c);
        grid[r][c] = 'Y';
        let s = checkWin(r, c, 'Y') ? 10000 + depth : minimax(depth-1, false, alpha, beta);
        grid[r][c] = null;
        best = Math.max(best, s);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const c of empties) {
        const r = getEmptyRow(c);
        grid[r][c] = 'R';
        let s = checkWin(r, c, 'R') ? -10000 - depth : minimax(depth-1, true, alpha, beta);
        grid[r][c] = null;
        best = Math.min(best, s);
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }
  function findWinningCol(color) {
    for (let c = 0; c < COLS; c++) {
      const r = getEmptyRow(c);
      if (r < 0) continue;
      grid[r][c] = color;
      const w = checkWin(r, c, color);
      grid[r][c] = null;
      if (w) return c;
    }
    return undefined;
  }
  function botMove() {
    if (gameOver) return;
    const diff = diffEl.value;
    const valid = [];
    for (let c = 0; c < COLS; c++) if (!grid[0][c]) valid.push(c);
    if (!valid.length) return;
    let col;
    if (diff === 'easy') col = randomChoice(valid);
    else if (diff === 'medium') {
      const w = findWinningCol('Y') ?? findWinningCol('R');
      col = w !== undefined && Math.random() < 0.7 ? w : randomChoice(valid);
    } else {
      const w = findWinningCol('Y') ?? findWinningCol('R');
      if (w !== undefined) col = w;
      else {
        let best = -Infinity;
        for (const c of valid) {
          const r = getEmptyRow(c);
          grid[r][c] = 'Y';
          const s = minimax(4, false, -Infinity, Infinity);
          grid[r][c] = null;
          if (s > best) { best = s; col = c; }
        }
      }
    }
    doDrop(col, 'Y');
  }
  function reset() {
    grid = Array.from({length:ROWS}, () => Array(COLS).fill(null));
    turn = 'R'; gameOver = false; winCells = null;
    statusEl.textContent = 'ตาของ 🔴 แดง';
    render();
  }
  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
}
