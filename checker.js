import { randomChoice } from '../ai.js';

const N = 8;

export function initChecker() {
  const boardEl = document.getElementById('ck-board');
  const statusEl = document.getElementById('ck-status');
  const modeEl = document.getElementById('ck-mode');
  const diffEl = document.getElementById('ck-diff');
  const resetEl = document.getElementById('ck-reset');

  let board, turn, selected, gameOver;

  function init() {
    board = Array.from({length:N}, () => Array(N).fill(null));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) board[r][c] = { color:'black', king:false };
          else if (r > 4) board[r][c] = { color:'red', king:false };
        }
      }
    }
    turn = 'red';
    selected = null;
    gameOver = false;
    statusEl.textContent = 'ตาของแดง';
    render();
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell ' + ((r + c) % 2 ? 'dark' : 'light');
        if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');
        const p = board[r][c];
        if (p) {
          const piece = document.createElement('div');
          piece.className = `piece ${p.color}${p.king ? ' king' : ''}`;
          cell.appendChild(piece);
        }
        cell.addEventListener('click', () => onClick(r, c));
        boardEl.appendChild(cell);
      }
    }
    if (selected) {
      const moves = getMoves(selected.r, selected.c);
      for (const m of moves) {
        const idx = m.tr * N + m.tc;
        boardEl.children[idx].classList.add('valid');
      }
    }
  }

  function onClick(r, c) {
    if (gameOver) return;
    if (modeEl.value === 'bot' && turn !== 'red') return;
    const p = board[r][c];
    if (selected) {
      const moves = getMoves(selected.r, selected.c);
      const move = moves.find(m => m.tr === r && m.tc === c);
      if (move) { applyMove(selected.r, selected.c, move); return; }
    }
    if (p && p.color === turn) { selected = { r, c }; render(); }
    else { selected = null; render(); }
  }

  function getMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    const dirs = [];
    if (p.king) dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    else if (p.color === 'red') dirs.push([-1,-1],[-1,1]);
    else dirs.push([1,-1],[1,1]);
    const moves = [], jumps = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!inB(nr,nc)) continue;
      if (!board[nr][nc]) moves.push({ tr:nr, tc:nc, jump:false });
      else if (board[nr][nc].color !== p.color) {
        const jr = r + dr*2, jc = c + dc*2;
        if (inB(jr,jc) && !board[jr][jc])
          jumps.push({ tr:jr, tc:jc, jump:true, cr:nr, cc:nc });
      }
    }
    if (jumps.length) return jumps;
    return moves;
  }

  function inB(r,c) { return r>=0 && r<N && c>=0 && c<N; }

  function applyMove(r, c, move) {
    const p = board[r][c];
    board[r][c] = null;
    board[move.tr][move.tc] = p;
    if (move.jump) board[move.cr][move.cc] = null;
    if (!p.king) {
      if (p.color === 'red' && move.tr === 0) p.king = true;
      if (p.color === 'black' && move.tr === N-1) p.king = true;
    }
    selected = null;
    const oppColor = turn === 'red' ? 'black' : 'red';
    if (!hasPieces(oppColor)) {
      gameOver = true;
      statusEl.textContent = turn === 'red' ? '🔴 แดงชนะ!' : '⚫ ดำชนะ!';
      render(); return;
    }
    turn = oppColor;
    statusEl.textContent = `ตาของ ${turn === 'red' ? 'แดง' : 'ดำ'}`;
    render();
    if (modeEl.value === 'bot' && turn === 'black') setTimeout(botMove, 500);
  }

  function hasPieces(color) {
    for (const row of board) for (const p of row) if (p && p.color === color) return true;
    return false;
  }

  function allMovesFor(color) {
    const all = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        for (const m of getMoves(r, c)) all.push({ r, c, m });
      }
    }
    return all;
  }

  function botMove() {
    if (gameOver) return;
    const diff = diffEl.value;
    const all = allMovesFor('black');
    if (!all.length) return;
    let choice;
    if (diff === 'easy') choice = randomChoice(all);
    else {
      const scored = all.map(mv => {
        let s = 0;
        if (mv.m.jump) s += 5;
        if (!board[mv.r][mv.c].king && mv.m.tr === N-1) s += 3;
        return { mv, s };
      });
      scored.sort((a,b) => b.s - a.s);
      if (diff === 'medium' && Math.random() < 0.5) choice = randomChoice(all);
      else choice = scored[0].mv;
    }
    applyMove(choice.r, choice.c, choice.m);
  }

  resetEl.addEventListener('click', init);
  modeEl.addEventListener('change', init);
  diffEl.addEventListener('change', init);
  init();
}
