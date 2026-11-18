import { randomChoice } from '../ai.js';

const ROWS = 6, COLS = 7;

export function initConnect4() {
  const boardEl = document.getElementById('c4-board');
  const statusEl = document.getElementById('c4-status');
  const modeEl = document.getElementById('c4-mode');
  const diffEl = document.getElementById('c4-diff');
  const resetEl = document.getElementById('c4-reset');

  let grid, turn, gameOver;

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (grid[r][c] === 'R') cell.classList.add('red');
        if (grid[r][c] === 'Y') cell.classList.add('yellow');
        cell.addEventListener('click', () => drop(c));
        boardEl.appendChild(cell);
      }
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
        render();
        const w = checkWin(r, c, color);
        if (w) {
          gameOver = true;
          statusEl.textContent = color === 'R' ? '🔴 แดงชนะ!' : '🟡 เหลืองชนะ!';
          return;
        }
        turn = color === 'R' ? 'Y' : 'R';
        statusEl.textContent = `ตาของ ${turn === 'R' ? 'แดง' : 'เหลือง'}`;
        if (modeEl.value === 'bot' && turn === 'Y') setTimeout(botMove, 400);
        return;
      }
    }
    statusEl.textContent = 'คอลัมน์เต็ม!';
  }

  function checkWin(r, c, color) {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr,dc] of dirs) {
      let count = 1;
      for (let k = 1; k < 4; k++) {
        const nr = r + dr*k, nc = c + dc*k;
        if (nr<0||nr>=ROWS||nc<0||nc>=COLS||grid[nr][nc] !== color) break;
        count++;
      }
      for (let k = 1; k < 4; k++) {
        const nr = r - dr*k, nc = c - dc*k;
        if (nr<0||nr>=ROWS||nc<0||nc>=COLS||grid[nr][nc] !== color) break;
        count++;
      }
      if (count >= 4) return true;
    }
    return false;
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
      col = w !== undefined && Math.random() < 0.6 ? w : randomChoice(valid);
    } else {
      col = findWinningCol('Y') ?? findWinningCol('R') ?? randomChoice(valid);
    }
    doDrop(col, 'Y');
  }

  function findWinningCol(color) {
    for (let c = 0; c < COLS; c++) {
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!grid[r][c]) {
          grid[r][c] = color;
          const w = checkWin(r, c, color);
          grid[r][c] = null;
          if (w) return c;
          break;
        }
      }
    }
    return undefined;
  }

  function reset() {
    grid = Array.from({length:ROWS}, () => Array(COLS).fill(null));
    turn = 'R';
    gameOver = false;
    statusEl.textContent = 'ตาของแดง';
    render();
  }

  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
}
