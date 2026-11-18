import { randomChoice } from '../ai.js';

const N = 6;

export function initChess() {
  const boardEl = document.getElementById('ch-board');
  const statusEl = document.getElementById('ch-status');
  const modeEl = document.getElementById('ch-mode');
  const diffEl = document.getElementById('ch-diff');
  const resetEl = document.getElementById('ch-reset');

  const GLYPH = {
    'wK':'♔','wQ':'♕','wR':'♖','wB':'♗','wN':'♘','wP':'♙',
    'bK':'♚','bQ':'♛','bR':'♜','bB':'♝','bN':'♞','bP':'♟'
  };

  let board, turn, selected, gameOver;

  function init() {
    board = Array.from({length:N}, () => Array(N).fill(null));
    const back = ['R','N','B','Q','K','R'];
    for (let c = 0; c < N; c++) board[0][c] = { t: back[c], color:'b' };
    for (let c = 0; c < N; c++) board[1][c] = { t:'P', color:'b' };
    for (let c = 0; c < N; c++) board[4][c] = { t:'P', color:'w' };
    for (let c = 0; c < N; c++) board[5][c] = { t: back[c], color:'w' };
    turn = 'w'; selected = null; gameOver = false;
    statusEl.textContent = 'ตาของขาว';
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
        if (p) cell.textContent = GLYPH[p.color + p.t];
        cell.addEventListener('click', () => onClick(r, c));
        boardEl.appendChild(cell);
      }
    }
    if (selected) {
      for (const m of legalMoves(selected.r, selected.c)) {
        boardEl.children[m.r * N + m.c].classList.add('valid');
      }
    }
  }

  function inB(r,c) { return r>=0 && r<N && c>=0 && c<N; }

  function pseudoMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    const res = [];
    const push = (rr,cc) => {
      if (inB(rr,cc) && (!board[rr][cc] || board[rr][cc].color !== p.color)) res.push({r:rr,c:cc});
    };
    if (p.t === 'P') {
      const dir = p.color === 'w' ? -1 : 1;
      if (inB(r+dir,c) && !board[r+dir][c]) {
        res.push({r:r+dir,c});
        const startRow = p.color === 'w' ? 4 : 1;
        if (r === startRow && !board[r+2*dir][c]) res.push({r:r+2*dir,c});
      }
      for (const dc of [-1,1]) {
        if (inB(r+dir,c+dc) && board[r+dir][c+dc] && board[r+dir][c+dc].color !== p.color)
          res.push({r:r+dir,c:c+dc});
      }
    } else if (p.t === 'N') {
      const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr,dc] of deltas) push(r+dr, c+dc);
    } else if (p.t === 'K') {
      for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) if (dr||dc) push(r+dr, c+dc);
    } else if (p.t === 'R' || p.t === 'B' || p.t === 'Q') {
      const dirs = [];
      if (p.t === 'R' || p.t === 'Q') dirs.push([1,0],[-1,0],[0,1],[0,-1]);
      if (p.t === 'B' || p.t === 'Q') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
      for (const [dr,dc] of dirs) {
        let rr = r+dr, cc = c+dc;
        while (inB(rr,cc)) {
          if (board[rr][cc]) {
            if (board[rr][cc].color !== p.color) res.push({r:rr,c:cc});
            break;
          }
          res.push({r:rr,c:cc});
          rr += dr; cc += dc;
        }
      }
    }
    return res;
  }

  function legalMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    return pseudoMoves(r, c).filter(m => {
      const cap = board[m.r][m.c];
      board[m.r][m.c] = p;
      board[r][c] = null;
      const ok = !inCheck(p.color);
      board[r][c] = p;
      board[m.r][m.c] = cap;
      return ok;
    });
  }

  function inCheck(color) {
    let kr = -1, kc = -1;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board[r][c];
      if (p && p.t === 'K' && p.color === color) { kr = r; kc = c; }
    }
    if (kr === -1) return true;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board[r][c];
      if (p && p.color !== color) {
        for (const m of pseudoMoves(r, c)) {
          if (m.r === kr && m.c === kc) return true;
        }
      }
    }
    return false;
  }

  function onClick(r, c) {
    if (gameOver) return;
    if (modeEl.value === 'bot' && turn !== 'w') return;
    const p = board[r][c];
    if (selected) {
      const mv = legalMoves(selected.r, selected.c).find(m => m.r === r && m.c === c);
      if (mv) { applyMove(selected.r, selected.c, mv); return; }
    }
    if (p && p.color === turn) selected = { r, c };
    else selected = null;
    render();
  }

  function applyMove(fr, fc, to) {
    const p = board[fr][fc];
    board[to.r][to.c] = p;
    board[fr][fc] = null;
    if (p.t === 'P' && ((p.color === 'w' && to.r === 0) || (p.color === 'b' && to.r === N-1))) p.t = 'Q';
    selected = null;
    const opp = turn === 'w' ? 'b' : 'w';
    turn = opp;
    if (inCheck(opp) && !hasAnyLegalMove(opp)) {
      gameOver = true;
      statusEl.textContent = `🏆 ${opp === 'w' ? 'ดำ' : 'ขาว'} ชนะ (Checkmate)!`;
      render(); return;
    }
    statusEl.textContent = `ตาของ ${turn === 'w' ? 'ขาว' : 'ดำ'}${inCheck(turn) ? ' (Check!)' : ''}`;
    render();
    if (modeEl.value === 'bot' && turn === 'b') setTimeout(botMove, 500);
  }

  function hasAnyLegalMove(color) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board[r][c];
      if (p && p.color === color && legalMoves(r, c).length) return true;
    }
    return false;
  }

  function botMove() {
    if (gameOver) return;
    const diff = diffEl.value;
    const all = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board[r][c];
      if (p && p.color === 'b') {
        for (const m of legalMoves(r, c)) all.push({ fr:r, fc:c, to:m, cap: board[m.r][m.c] });
      }
    }
    if (!all.length) return;
    let choice;
    if (diff === 'easy') choice = randomChoice(all);
    else {
      const scored = all.map(mv => {
        let s = 0;
        if (mv.cap) s += ({ P:1,N:3,B:3,R:5,Q:9,K:100 })[mv.cap.t] || 0;
        return { mv, s };
      });
      scored.sort((a,b) => b.s - a.s);
      if (diff === 'medium' && Math.random() < 0.5) choice = randomChoice(all);
      else choice = scored[0].mv;
    }
    applyMove(choice.fr, choice.fc, choice.to);
  }

  resetEl.addEventListener('click', init);
  modeEl.addEventListener('change', init);
  diffEl.addEventListener('change', init);
  init();
}
