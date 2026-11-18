import { randomChoice } from '../ai.js';

const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export function initXO() {
  const boardEl = document.getElementById('xo-board');
  const statusEl = document.getElementById('xo-status');
  const modeEl = document.getElementById('xo-mode');
  const diffEl = document.getElementById('xo-diff');
  const resetEl = document.getElementById('xo-reset');

  let board, player, gameOver;

  function render() {
    boardEl.innerHTML = '';
    board.forEach((v, i) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = v;
      cell.addEventListener('click', () => onClick(i));
      boardEl.appendChild(cell);
    });
  }

  function checkWinner(b) {
    for (const p of WIN) {
      if (b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]) return b[p[0]];
    }
    return b.every(c => c) ? 'draw' : null;
  }

  function onClick(i) {
    if (gameOver || board[i]) return;
    board[i] = player;
    afterMove();
  }

  function afterMove() {
    render();
    const w = checkWinner(board);
    if (w) {
      gameOver = true;
      statusEl.textContent = w === 'draw' ? 'เสมอ!' : `ผู้เล่น ${w} ชนะ!`;
      return;
    }
    player = player === 'X' ? 'O' : 'X';
    statusEl.textContent = `ตาของ ${player}`;
    if (modeEl.value === 'bot' && player === 'O') setTimeout(botMove, 350);
  }

  function botMove() {
    if (gameOver) return;
    const empty = board.map((v,i) => v ? null : i).filter(v => v !== null);
    if (empty.length === 0) return;
    const diff = diffEl.value;
    let move;
    if (diff === 'easy') move = randomChoice(empty);
    else if (diff === 'medium') {
      const winMove = findWinning('O') ?? findWinning('X');
      move = winMove !== undefined && Math.random() < 0.6 ? winMove : randomChoice(empty);
    } else {
      move = findWinning('O') ?? findWinning('X') ?? bestMove(empty);
    }
    board[move] = 'O';
    afterMove();
  }

  function findWinning(p) {
    for (const [a,b,c] of WIN) {
      const line = [board[a], board[b], board[c]];
      const cnt = line.filter(v => v === p).length;
      const emptyIdx = [a,b,c].filter(i => !board[i]);
      if (cnt === 2 && emptyIdx.length === 1) return emptyIdx[0];
    }
    return undefined;
  }

  function bestMove(empty) {
    if (board[4] === '') return 4;
    const corners = [0,2,6,8].filter(i => !board[i]);
    if (corners.length) return randomChoice(corners);
    return randomChoice(empty);
  }

  function reset() {
    board = Array(9).fill('');
    player = 'X';
    gameOver = false;
    statusEl.textContent = 'ตาของ X';
    render();
  }

  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
}
