import { $, randomChoice } from '../utils.js';

const N = 8;
const GLYPH = {
  'wK':'♔','wQ':'♕','wR':'♖','wB':'♗','wN':'♘','wP':'♙',
  'bK':'♚','bQ':'♛','bR':'♜','bB':'♝','bN':'♞','bP':'♟'
};

export function initChess() {
  const boardEl = $('ch-board'), statusEl = $('ch-status');
  const modeEl = $('ch-mode'), diffEl = $('ch-diff'), resetEl = $('ch-reset');
  let board, turn, selected, gameOver;
  let castling, enPassant;

  function init() {
    board = Array.from({length:N}, () => Array(N).fill(null));
    const back = ['R','N','B','Q','K','B','N','R'];
    for (let c = 0; c < N; c++) board[0][c] = { t: back[c], color:'b' };
    for (let c = 0; c < N; c++) board[1][c] = { t:'P', color:'b' };
    for (let c = 0; c < N; c++) board[6][c] = { t:'P', color:'w' };
    for (let c = 0; c < N; c++) board[7][c] = { t: back[c], color:'w' };
    turn = 'w'; selected = null; gameOver = false;
    castling = { wK:true, wQ:true, bK:true, bQ:true };
    enPassant = null;
    statusEl.textContent = 'ตาของขาว';
    render();
  }
  function inB(r,c) { return r>=0 && r<N && c>=0 && c<N; }
  function cloneBoard(b) { return b.map(row => row.map(p => p ? {...p} : null)); }
  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r + c) % 2 ? 'dark' : 'light');
      if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');
      const p = board[r][c];
      if (p) cell.textContent = GLYPH[p.color + p.t];
      if (p && p.t === 'K' && inCheck(p.color)) cell.classList.add('check');
      cell.addEventListener('click', () => onClick(r, c));
      boardEl.appendChild(cell);
    }
    if (selected) {
      for (const m of legalMoves(selected.r, selected.c)) boardEl.children[m.r * N + m.c].classList.add('valid');
    }
  }
  function pseudoMoves(b, r, c, ep) {
    const p = b[r][c];
    if (!p) return [];
    const res = [];
    const push = (rr,cc) => {
      if (inB(rr,cc) && (!b[rr][cc] || b[rr][cc].color !== p.color)) res.push({ r:rr, c:cc });
    };
    if (p.t === 'P') {
      const dir = p.color === 'w' ? -1 : 1;
      const startRow = p.color === 'w' ? 6 : 1;
      if (inB(r+dir,c) && !b[r+dir][c]) {
        res.push({ r:r+dir, c });
        if (r === startRow && !b[r+2*dir][c]) res.push({ r:r+2*dir, c, double:true });
      }
      for (const dc of [-1,1]) {
        if (inB(r+dir,c+dc)) {
          if (b[r+dir][c+dc] && b[r+dir][c+dc].color !== p.color) res.push({ r:r+dir, c:c+dc });
          if (ep && ep.r === r+dir && ep.c === c+dc) res.push({ r:r+dir, c:c+dc, ep:true });
        }
      }
    } else if (p.t === 'N') {
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) push(r+dr, c+dc);
    } else if (p.t === 'K') {
      for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) if (dr||dc) push(r+dr, c+dc);
    } else if (p.t === 'R' || p.t === 'B' || p.t === 'Q') {
      const dirs = [];
      if (p.t === 'R' || p.t === 'Q') dirs.push([1,0],[-1,0],[0,1],[0,-1]);
      if (p.t === 'B' || p.t === 'Q') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
      for (const [dr,dc] of dirs) {
        let rr = r+dr, cc = c+dc;
        while (inB(rr,cc)) {
          if (b[rr][cc]) { if (b[rr][cc].color !== p.color) res.push({r:rr,c:cc}); break; }
          res.push({r:rr,c:cc});
          rr += dr; cc += dc;
        }
      }
    }
    return res;
  }
  function inCheckWithBoard(b, color) {
    let kr = -1, kc = -1;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = b[r][c];
      if (p && p.t === 'K' && p.color === color) { kr = r; kc = c; }
    }
    if (kr === -1) return true;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = b[r][c];
      if (p && p.color !== color) for (const m of pseudoMoves(b, r, c, null)) if (m.r === kr && m.c === kc) return true;
    }
    return false;
  }
  function inCheck(color) { return inCheckWithBoard(board, color); }
  function inCheckWithBoardAfter(fr, fc, tr, tc, color) {
    const b = cloneBoard(board);
    b[tr][tc] = b[fr][fc];
    b[fr][fc] = null;
    return inCheckWithBoard(b, color);
  }
  function legalMoves(r, c) {
    const p = board[r][c];
    if (!p) return [];
    const moves = pseudoMoves(board, r, c, enPassant);
    if (p.t === 'K' && !inCheck(p.color)) {
      const row = p.color === 'w' ? 7 : 0;
      const key = p.color;
      if (castling[key + 'K'] && !board[row][5] && !board[row][6]) {
        if (!inCheckWithBoardAfter(row, 4, row, 5, p.color) && !inCheckWithBoardAfter(row, 4, row, 6, p.color))
          moves.push({ r:row, c:6, castle:'K' });
      }
      if (castling[key + 'Q'] && !board[row][1] && !board[row][2] && !board[row][3]) {
        if (!inCheckWithBoardAfter(row, 4, row, 3, p.color) && !inCheckWithBoardAfter(row, 4, row, 2, p.color))
          moves.push({ r:row, c:2, castle:'Q' });
      }
    }
    return moves.filter(m => {
      const cap = board[m.r][m.c];
      const epCap = m.ep ? board[m.r === 2 ? 3 : 4][m.c] : null;
      board[m.r][m.c] = p;
      board[r][c] = null;
      if (m.ep) board[m.r === 2 ? 3 : 4][m.c] = null;
      const ok = !inCheck(p.color);
      board[r][c] = p;
      board[m.r][m.c] = cap;
      if (m.ep) board[m.r === 2 ? 3 : 4][m.c] = epCap;
      return ok;
    });
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
    if (to.ep) board[fr][to.c] = null;
    board[to.r][to.c] = p;
    board[fr][fc] = null;
    if (to.castle === 'K') { board[to.r][5] = board[to.r][7]; board[to.r][7] = null; }
    else if (to.castle === 'Q') { board[to.r][3] = board[to.r][0]; board[to.r][0] = null; }
    if (p.t === 'P' && to.double) enPassant = { r: (fr + to.r) / 2, c: fc };
    else enPassant = null;
    if (p.t === 'P' && (to.r === 0 || to.r === N-1)) p.t = 'Q';
    if (p.t === 'K') {
      if (p.color === 'w') { castling.wK = castling.wQ = false; }
      else { castling.bK = castling.bQ = false; }
    }
    if (p.t === 'R') {
      if (fr === 7 && fc === 0) castling.wQ = false;
      if (fr === 7 && fc === 7) castling.wK = false;
      if (fr === 0 && fc === 0) castling.bQ = false;
      if (fr === 0 && fc === 7) castling.bK = false;
    }
    selected = null;
    const opp = turn === 'w' ? 'b' : 'w';
    turn = opp;
    const oppMoves = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const pc = board[r][c];
      if (pc && pc.color === opp) oppMoves.push(...legalMoves(r, c));
    }
    if (!oppMoves.length) {
      gameOver = true;
      statusEl.textContent = inCheck(opp) ? `🏆 ${opp === 'w' ? 'ดำ' : 'ขาว'} ชนะ (Checkmate)!` : '🤝 เสมอ (Stalemate)';
      render(); return;
    }
    statusEl.textContent = `ตาของ ${turn === 'w' ? 'ขาว' : 'ดำ'}${inCheck(turn) ? ' ⚠️ Check!' : ''}`;
    render();
    if (modeEl.value === 'bot' && turn === 'b') setTimeout(botMove, 400);
  }
  function evaluateBoardWithBoard(b) {
    const VAL = { P:100, N:320, B:330, R:500, Q:900, K:20000 };
    let s = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = b[r][c];
      if (!p) continue;
      let v = VAL[p.t];
      if (p.t === 'P') v += (p.color === 'w' ? (6 - r) : r) * 10;
      if (p.color === 'w') s += v; else s -= v;
    }
    return s;
  }
  function minimaxChess(b, depth, alpha, beta, isMax) {
    if (depth === 0) return evaluateBoardWithBoard(b);
    let best;
    const moves = [];
    const color = isMax ? 'w' : 'b';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = b[r][c];
      if (p && p.color === color) moves.push({ r, c });
    }
    if (isMax) {
      best = -Infinity;
      for (const from of moves) {
        for (const m of pseudoMoves(b, from.r, from.c, null)) {
          const cap = b[m.r][m.c];
          b[m.r][m.c] = b[from.r][from.c];
          b[from.r][from.c] = null;
          const s = minimaxChess(b, depth-1, alpha, beta, false);
          b[from.r][from.c] = b[m.r][m.c];
          b[m.r][m.c] = cap;
          best = Math.max(best, s);
          alpha = Math.max(alpha, best);
          if (beta <= alpha) return best;
        }
      }
      return best === -Infinity ? -99999 : best;
    } else {
      best = Infinity;
      for (const from of moves) {
        for (const m of pseudoMoves(b, from.r, from.c, null)) {
          const cap = b[m.r][m.c];
          b[m.r][m.c] = b[from.r][from.c];
          b[from.r][from.c] = null;
          const s = minimaxChess(b, depth-1, alpha, beta, true);
          b[from.r][from.c] = b[m.r][m.c];
          b[m.r][m.c] = cap;
          best = Math.min(best, s);
          beta = Math.min(beta, best);
          if (beta <= alpha) return best;
        }
      }
      return best === Infinity ? 99999 : best;
    }
  }
  function botMove() {
    if (gameOver) return;
    const diff = diffEl.value;
    const legal = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board[r][c];
      if (p && p.color === 'b') for (const m of legalMoves(r, c)) legal.push({ fr:r, fc:c, to:m });
    }
    if (!legal.length) return;
    let choice;
    if (diff === 'easy') choice = randomChoice(legal);
    else if (diff === 'medium') {
      const scored = legal.map(mv => {
        let s = 0;
        const cap = board[mv.to.r][mv.to.c];
        if (cap) s += ({ P:1,N:3,B:3,R:5,Q:9,K:100 })[cap.t] || 0;
        return { mv, s };
      });
      scored.sort((a,b) => b.s - a.s);
      choice = Math.random() < 0.5 ? randomChoice(legal) : scored[0].mv;
    } else {
      let best = -Infinity;
      for (const mv of legal) {
        const b = cloneBoard(board);
        b[mv.to.r][mv.to.c] = b[mv.fr][mv.fc];
        b[mv.fr][mv.fc] = null;
        if (mv.to.castle === 'K') { b[mv.to.r][5] = b[mv.to.r][7]; b[mv.to.r][7] = null; }
        if (mv.to.castle === 'Q') { b[mv.to.r][3] = b[mv.to.r][0]; b[mv.to.r][0] = null; }
        const s = minimaxChess(b, 2, -Infinity, Infinity, true);
        if (s > best) { best = s; choice = mv; }
      }
    }
    applyMove(choice.fr, choice.fc, choice.to);
  }
  resetEl.addEventListener('click', init);
  modeEl.addEventListener('change', init);
  diffEl.addEventListener('change', init);
  init();
}
