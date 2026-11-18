import { $, randomChoice } from '../utils.js';

const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export function initXO() {
  const boardEl = $('xo-board'), statusEl = $('xo-status');
  const modeEl = $('xo-mode'), diffEl = $('xo-diff'), resetEl = $('xo-reset');
  let board, player, gameOver, winLine;

  function render() {
    boardEl.innerHTML = '';
    board.forEach((v, i) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (v ? ' taken' : '');
      if (winLine && winLine.includes(i)) cell.classList.add('win');
      cell.textContent = v;
      cell.addEventListener('click', () => onClick(i));
      boardEl.appendChild(cell);
    });
  }
  function checkWinner(b) {
    for (const p of WIN) if (b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]) return { w: b[p[0]], line: p };
    return b.every(c => c) ? { w: 'draw', line: null } : null;
  }
  function onClick(i) {
    if (gameOver || board[i]) return;
    if (modeEl.value === 'bot' && player !== 'X') return;
    board[i] = player;
    afterMove();
  }
  function afterMove() {
    const r = checkWinner(board);
    if (r) {
      gameOver = true; winLine = r.line;
      statusEl.textContent = r.w === 'draw' ? '🤝 เสมอ!' : `🎉 ผู้เล่น ${r.w} ชนะ!`;
      render(); return;
    }
    render();
    player = player === 'X' ? 'O' : 'X';
    statusEl.textContent = `ตาของ ${player}`;
    if (modeEl.value === 'bot' && player === 'O') setTimeout(botMove, 300);
  }
  function minimax(b, depth, isMax, alpha, beta) {
    const r = checkWinner(b);
    if (r) {
      if (r.w === 'O') return 10 - depth;
      if (r.w === 'X') return depth - 10;
      return 0;
    }
    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) if (!b[i]) {
        b[i] = 'O';
        best = Math.max(best, minimax(b, depth+1, false, alpha, beta));
        b[i] = '';
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) if (!b[i]) {
        b[i] = 'X';
        best = Math.min(best, minimax(b, depth+1, true, alpha, beta));
        b[i] = '';
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }
  function findWinning(p) {
    for (const [a,b,c] of WIN) {
      const line = [board[a],board[b],board[c]];
      const cnt = line.filter(v => v === p).length;
      const emp = [a,b,c].filter(i => !board[i]);
      if (cnt === 2 && emp.length === 1) return emp[0];
    }
    return undefined;
  }
  function botMove() {
    if (gameOver) return;
    const empty = board.map((v,i) => v ? null : i).filter(v => v !== null);
    if (!empty.length) return;
    const diff = diffEl.value;
    let move;
    if (diff === 'easy') move = randomChoice(empty);
    else if (diff === 'medium') {
      const w = findWinning('O') ?? findWinning('X');
      move = w !== undefined && Math.random() < 0.7 ? w : randomChoice(empty);
    } else {
      let best = -Infinity;
      for (const i of empty) {
        board[i] = 'O';
        const s = minimax(board, 0, false, -Infinity, Infinity);
        board[i] = '';
        if (s > best) { best = s; move = i; }
      }
    }
    board[move] = 'O';
    afterMove();
  }
  function reset() {
    board = Array(9).fill('');
    player = 'X'; gameOver = false; winLine = null;
    statusEl.textContent = 'ตาของ X';
    render();
  }
  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
}
