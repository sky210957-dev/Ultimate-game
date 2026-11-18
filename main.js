/* ============================================================
   MULTI-GAME HUB ULTIMATE v2 — main.js
   แก้บั๊ก + เพิ่ม debug + try-catch แยกแต่ละเกม
   ============================================================ */

// ---------- Debug System ----------
const debugStatus = document.getElementById('debug-status');
const errorBar = document.getElementById('error-bar');
let debugVisible = true;

window.toggleDebug = function() {
  debugVisible = !debugVisible;
  debugStatus.style.display = debugVisible ? 'inline' : 'none';
};

function setStatus(msg, isError = false) {
  console.log('[Hub]', msg);
  if (debugStatus) {
    debugStatus.textContent = msg;
    debugStatus.style.color = isError ? '#f87171' : '#22d3ee';
  }
  if (isError && errorBar) {
    errorBar.style.display = 'block';
    errorBar.textContent = '⚠️ ' + msg;
    setTimeout(() => { errorBar.style.display = 'none'; }, 5000);
  }
}

window.onerror = function(msg, src, line, col, err) {
  console.error('[Global Error]', msg, err);
  if (errorBar) {
    errorBar.style.display = 'block';
    errorBar.textContent = '⚠️ ' + msg + ' (line ' + line + ')';
  }
};

// ---------- Utils ----------
function $(id) { return document.getElementById(id); }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- NAV ----------
const GAMES = [
  { id:'xo', label:'❌⭕ XO' },
  { id:'battleship', label:'🚢 Battleship' },
  { id:'connect4', label:'🔴 Connect4' },
  { id:'memory', label:'🧠 Memory' },
  { id:'rps', label:'✊ RPS' },
  { id:'checker', label:'⚫ Checker' },
  { id:'chess', label:'♟️ Chess' },
  { id:'sudoku', label:'🧩 Sudoku' },
  { id:'game2048', label:'🔢 2048' },
  { id:'blockblast', label:'🧱 Block Blast' },
  { id:'fruitninja', label:'🍉 Fruit Ninja' },
];

(function buildNav(){
  const nav = $('nav');
  GAMES.forEach((g, i) => {
    const b = document.createElement('button');
    b.className = 'nav-btn' + (i === 0 ? ' active' : '');
    b.textContent = g.label;
    b.dataset.game = g.id;
    b.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(x => x.classList.toggle('active', x.dataset.game === g.id));
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + g.id));
      setStatus('เปิดเกม: ' + g.label);
    });
    nav.appendChild(b);
  });
  $('panel-xo').classList.add('active');
})();

// ============================================================
// XO
// ============================================================
function initXO() {
  setStatus('กำลัง init XO...');
  const boardEl = $('xo-board'), statusEl = $('xo-status');
  const modeEl = $('xo-mode'), diffEl = $('xo-diff'), resetEl = $('xo-reset');
  const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let board = Array(9).fill(''), player = 'X', gameOver = false, winLine = null;

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
  setStatus('✅ XO พร้อมเล่น');
}

// ============================================================
// BATTLESHIP (6x6)
// ============================================================
function initBattleship() {
  setStatus('กำลัง init Battleship...');
  const playerEl = $('bs-player'), enemyEl = $('bs-enemy');
  const statusEl = $('bs-status'), modeEl = $('bs-mode'), diffEl = $('bs-diff');
  const resetEl = $('bs-reset'), rotateEl = $('bs-rotate'), autoEl = $('bs-auto');
  const SIZE = 6;
  const SHIPS = [{len:4,name:'Carrier'},{len:3,name:'Cruiser'},{len:2,name:'Destroyer'},{len:1,name:'Patrol'}];
  let playerBoard, enemyBoard, placeIdx, turn, gameOver, enemyShips, playerShips;
  let horizontal = true;

  function newBoard() { return Array.from({length:SIZE*SIZE}, () => 0); }
  function canPlace(board, r, c, len, horiz) {
    if (horiz && c + len > SIZE) return false;
    if (!horiz && r + len > SIZE) return false;
    for (let i = 0; i < len; i++) {
      const rr = horiz ? r : r+i, cc = horiz ? c+i : c;
      if (board[rr*SIZE+cc] === 1) return false;
    }
    return true;
  }
  function placeShipRandom(board, len) {
    for (let t = 0; t < 500; t++) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * SIZE), c = Math.floor(Math.random() * SIZE);
      if (!canPlace(board, r, c, len, horiz)) continue;
      for (let i = 0; i < len; i++) board[horiz ? r*SIZE+c+i : (r+i)*SIZE+c] = 1;
      return true;
    }
    return false;
  }
  function autoPlaceAll() {
    playerShips = newBoard();
    SHIPS.forEach(s => placeShipRandom(playerShips, s.len));
    placeIdx = SHIPS.length;
    turn = 'player';
    rotateEl.disabled = true;
    statusEl.textContent = '🎯 ยิงเรือศัตรู!';
    render();
  }
  function previewShip(idx) {
    if (placeIdx >= SHIPS.length) return;
    const len = SHIPS[placeIdx].len;
    const r = Math.floor(idx / SIZE), c = idx % SIZE;
    const cells = [];
    const ok = canPlace(playerShips, r, c, len, horizontal);
    for (let i = 0; i < len; i++) {
      const rr = horizontal ? r : r+i, cc = horizontal ? c+i : c;
      if (rr < SIZE && cc < SIZE) cells.push(rr*SIZE+cc);
    }
    playerEl.querySelectorAll('.cell').forEach((el, i) => {
      el.classList.remove('preview', 'invalid');
      if (cells.includes(i)) el.classList.add(ok ? 'preview' : 'invalid');
    });
  }
  function placePlayerShip(i) {
    if (placeIdx >= SHIPS.length) return;
    const len = SHIPS[placeIdx].len;
    const r = Math.floor(i / SIZE), c = i % SIZE;
    if (!canPlace(playerShips, r, c, len, horizontal)) {
      statusEl.textContent = '❌ วางตรงนี้ไม่ได้'; return;
    }
    for (let k = 0; k < len; k++) {
      const rr = horizontal ? r : r+k, cc = horizontal ? c+k : c;
      playerShips[rr*SIZE+cc] = 1;
    }
    placeIdx++;
    if (placeIdx >= SHIPS.length) {
      turn = 'player';
      statusEl.textContent = '🎯 ยิงเรือศัตรู!';
      rotateEl.disabled = true;
    } else statusEl.textContent = `วางเรือ ${SHIPS[placeIdx].name} (ยาว ${SHIPS[placeIdx].len})`;
    render();
  }
  function renderBoard(el, board, ships, showShips, onClickFn) {
    el.innerHTML = '';
    for (let i = 0; i < SIZE*SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (board[i] === 2) cell.classList.add('hit');
      if (board[i] === 3) cell.classList.add('miss');
      if (ships && ships[i] && showShips) cell.classList.add('ship');
      if (onClickFn) {
        cell.addEventListener('click', () => onClickFn(i));
        cell.addEventListener('mouseenter', () => previewShip(i));
      }
      el.appendChild(cell);
    }
  }
  function playerFire(i) {
    if (gameOver || turn !== 'player' || enemyBoard[i] !== 0) return;
    if (enemyShips[i] === 1) {
      enemyBoard[i] = 2;
      statusEl.textContent = '🎯 โดน!';
      if (checkWin(enemyShips, enemyBoard)) { gameOver = true; statusEl.textContent = '🎉 คุณชนะ!'; render(); return; }
    } else {
      enemyBoard[i] = 3;
      statusEl.textContent = '💧 พลาด';
    }
    turn = 'bot'; render();
    setTimeout(botFire, 600);
  }
  function canPlaceUnknown(board, r, c, len, horiz) {
    if (horiz && c + len > SIZE) return false;
    if (!horiz && r + len > SIZE) return false;
    for (let i = 0; i < len; i++) {
      const rr = horiz ? r : r+i, cc = horiz ? c+i : c;
      if (board[rr*SIZE+cc] === 3) return false;
    }
    return true;
  }
  function findHitNeighbor(board) {
    for (let i = 0; i < SIZE*SIZE; i++) {
      if (board[i] === 2) {
        const r = Math.floor(i/SIZE), c = i % SIZE;
        for (const [nr,nc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) {
          if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) {
            const idx = nr*SIZE + nc;
            if (board[idx] === 0) return idx;
          }
        }
      }
    }
    return undefined;
  }
  function botFire() {
    if (gameOver) return;
    const diff = diffEl.value;
    let target;
    if (diff === 'easy') {
      const empty = [];
      for (let i = 0; i < SIZE*SIZE; i++) if (playerBoard[i] === 0) empty.push(i);
      target = randomChoice(empty);
    } else if (diff === 'medium') {
      const hit = findHitNeighbor(playerBoard);
      if (hit !== undefined && Math.random() < 0.6) target = hit;
      else {
        const empty = [];
        for (let i = 0; i < SIZE*SIZE; i++) if (playerBoard[i] === 0) empty.push(i);
        target = randomChoice(empty);
      }
    } else {
      const hit = findHitNeighbor(playerBoard);
      if (hit !== undefined) target = hit;
      else {
        const density = new Array(SIZE*SIZE).fill(0);
        for (const s of SHIPS) {
          for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
            for (const horiz of [true, false]) {
              if (!canPlaceUnknown(playerBoard, r, c, s.len, horiz)) continue;
              for (let k = 0; k < s.len; k++) density[horiz ? r*SIZE+c+k : (r+k)*SIZE+c]++;
            }
          }
        }
        let max = -1;
        for (let i = 0; i < SIZE*SIZE; i++) {
          if (playerBoard[i] !== 0) continue;
          if (density[i] > max) { max = density[i]; target = i; }
        }
      }
    }
    if (playerShips[target] === 1) {
      playerBoard[target] = 2;
      statusEl.textContent = '💥 บอทโดนเรือคุณ!';
      if (checkWin(playerShips, playerBoard)) { gameOver = true; statusEl.textContent = '😵 บอทชนะ!'; render(); return; }
    } else {
      playerBoard[target] = 3;
      statusEl.textContent = '🌊 บอทพลาด';
    }
    turn = 'player';
    render();
  }
  function checkWin(ships, board) {
    for (let i = 0; i < SIZE*SIZE; i++) if (ships[i] === 1 && board[i] !== 2) return false;
    return true;
  }
  function render() {
    renderBoard(playerEl, playerBoard, playerShips, true, placeIdx < SHIPS.length ? placePlayerShip : null);
    renderBoard(enemyEl, enemyBoard, enemyShips, false, turn === 'player' && placeIdx >= SHIPS.length ? playerFire : null);
  }
  function reset() {
    playerBoard = newBoard(); enemyBoard = newBoard();
    playerShips = newBoard(); enemyShips = newBoard();
    SHIPS.forEach(s => placeShipRandom(enemyShips, s.len));
    placeIdx = 0; turn = 'place'; gameOver = false;
    horizontal = true; rotateEl.disabled = false;
    rotateEl.textContent = '🔄 หมุนแนวนอน';
    statusEl.textContent = `วางเรือ ${SHIPS[0].name} (ยาว ${SHIPS[0].len})`;
    render();
  }
  rotateEl.addEventListener('click', () => {
    horizontal = !horizontal;
    rotateEl.textContent = horizontal ? '🔄 หมุนแนวนอน' : '🔄 หมุนแนวตั้ง';
  });
  autoEl.addEventListener('click', autoPlaceAll);
  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
  setStatus('✅ Battleship พร้อมเล่น');
}

// ============================================================
// CONNECT 4
// ============================================================
function initConnect4() {
  setStatus('กำลัง init Connect4...');
  const boardEl = $('c4-board'), statusEl = $('c4-status');
  const modeEl = $('c4-mode'), diffEl = $('c4-diff'), resetEl = $('c4-reset');
  const ROWS = 6, COLS = 7;
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
          const s = minimax(3, false, -Infinity, Infinity);
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
  setStatus('✅ Connect4 พร้อมเล่น');
}

// ============================================================
// MEMORY
// ============================================================
function initMemory() {
  setStatus('กำลัง init Memory...');
  const boardEl = $('mem-board'), statusEl = $('mem-status');
  const modeEl = $('mem-mode'), diffEl = $('mem-diff'), resetEl = $('mem-reset');
  const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦄','🐢'];
  let cards, flipped, matched, lock, scorePlayer, scoreBot, turn;

  function pairsByDiff() { return diffEl.value === 'easy' ? 4 : diffEl.value === 'medium' ? 6 : 8; }
  function init() {
    const pairs = pairsByDiff();
    const chosen = EMOJIS.slice(0, pairs);
    const deck = shuffle([...chosen, ...chosen]);
    cards = deck.map((e, i) => ({ id:i, emoji:e, flipped:false, matched:false }));
    flipped = []; matched = 0; lock = false;
    scorePlayer = 0; scoreBot = 0; turn = 'player';
    updateStatus(); render();
  }
  function render() {
    boardEl.innerHTML = '';
    cards.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'card';
      if (c.flipped || c.matched) el.classList.add('flipped');
      if (c.matched) el.classList.add('matched');
      const back = document.createElement('div');
      back.className = 'face back';
      back.textContent = '?';
      const front = document.createElement('div');
      front.className = 'face front';
      front.textContent = c.emoji;
      el.appendChild(back); el.appendChild(front);
      el.addEventListener('click', () => onFlip(i));
      boardEl.appendChild(el);
    });
  }
  function updateStatus() {
    statusEl.textContent = `คุณ ${scorePlayer} : ${scoreBot} บอท | จับคู่ ${matched}/${cards.length/2}`;
  }
  function onFlip(i) {
    if (lock || turn !== 'player') return;
    const c = cards[i];
    if (c.matched || c.flipped) return;
    c.flipped = true;
    flipped.push(i);
    render();
    if (flipped.length === 2) resolvePair('player');
  }
  async function resolvePair(who) {
    lock = true;
    const [a, b] = flipped;
    const ca = cards[a], cb = cards[b];
    await sleep(500);
    if (ca.emoji === cb.emoji) {
      ca.matched = cb.matched = true;
      matched++;
      if (who === 'player') scorePlayer++; else scoreBot++;
      flipped = []; lock = false;
      updateStatus(); render();
      if (matched === cards.length / 2) {
        statusEl.textContent = scorePlayer > scoreBot ? `🎉 คุณชนะ! ${scorePlayer}:${scoreBot}` :
          scorePlayer < scoreBot ? `😵 บอทชนะ! ${scorePlayer}:${scoreBot}` : `🤝 เสมอ ${scorePlayer}:${scoreBot}`;
        return;
      }
      if (modeEl.value === 'bot' && who === 'player') { turn = 'bot'; setTimeout(botTurn, 600); }
    } else {
      ca.flipped = cb.flipped = false;
      flipped = []; lock = false; render();
      if (modeEl.value === 'bot' && who === 'player') { turn = 'bot'; setTimeout(botTurn, 400); }
    }
  }
  function botTurn() {
    if (lock) return;
    const diff = diffEl.value;
    const faceDown = cards.map((c,i) => (!c.flipped && !c.matched) ? i : null).filter(i => i !== null);
    if (!faceDown.length) return;
    const memoryChance = diff === 'easy' ? 0 : diff === 'medium' ? 0.3 : 0.85;
    let pickA, pickB;
    if (Math.random() < memoryChance) {
      const seen = {};
      for (const c of cards) {
        if (c.matched) continue;
        if (!seen[c.emoji]) seen[c.emoji] = [];
        seen[c.emoji].push(c.id);
      }
      const known = Object.values(seen).find(arr => arr.length === 2 && faceDown.includes(arr[0]) && faceDown.includes(arr[1]));
      if (known) { pickA = known[0]; pickB = known[1]; }
    }
    if (pickA === undefined) {
      pickA = randomChoice(faceDown);
      const rest = faceDown.filter(i => i !== pickA);
      pickB = randomChoice(rest);
    }
    cards[pickA].flipped = true;
    cards[pickB].flipped = true;
    flipped = [pickA, pickB];
    render();
    setTimeout(() => resolvePair('bot'), 700);
  }
  resetEl.addEventListener('click', init);
  modeEl.addEventListener('change', init);
  diffEl.addEventListener('change', init);
  init();
  setStatus('✅ Memory พร้อมเล่น');
}

// ============================================================
// RPS
// ============================================================
function initRPS() {
  setStatus('กำลัง init RPS...');
  const scoreEl = $('rps-score'), statusEl = $('rps-status');
  const choicesEl = $('rps-choices'), historyEl = $('rps-history');
  const modeEl = $('rps-mode'), diffEl = $('rps-diff'), resetEl = $('rps-reset');
  const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
  const EMOJI = { rock:'✊', paper:'✋', scissors:'✌️' };
  let pScore = 0, bScore = 0, playerPick = null;
  let history = [], historyUI = [];
  let markov = { rock:{rock:0,paper:0,scissors:0}, paper:{rock:0,paper:0,scissors:0}, scissors:{rock:0,paper:0,scissors:0} };

  function updateScore() {
    scoreEl.textContent = `คุณ ${pScore} : ${bScore} ${modeEl.value === 'bot' ? 'บอท' : 'ผู้เล่น 2'}`;
  }
  function renderHistory() {
    historyEl.innerHTML = '';
    historyUI.slice(-10).forEach(h => {
      const span = document.createElement('span');
      span.textContent = h.text;
      if (h.result === 'win') span.classList.add('win');
      if (h.result === 'loss') span.classList.add('loss');
      historyEl.appendChild(span);
    });
  }
  function botPick() {
    const diff = diffEl.value;
    if (diff === 'easy') return randomChoice(['rock','paper','scissors']);
    if (diff === 'medium') {
      if (playerPick && Math.random() < 0.3) return Object.keys(BEATS).find(k => BEATS[k] === playerPick);
      return randomChoice(['rock','paper','scissors']);
    }
    if (history.length === 0) return randomChoice(['rock','paper','scissors']);
    const last = history[history.length-1];
    const trans = markov[last];
    const total = trans.rock + trans.paper + trans.scissors;
    let predicted;
    if (total >= 3) {
      const max = Math.max(trans.rock, trans.paper, trans.scissors);
      const cands = Object.keys(trans).filter(k => trans[k] === max);
      predicted = randomChoice(cands);
    } else predicted = randomChoice(['rock','paper','scissors']);
    return Object.keys(BEATS).find(k => BEATS[k] === predicted);
  }
  function pick(player) {
    playerPick = player;
    const opp = botPick();
    if (history.length > 0) markov[history[history.length-1]][player]++;
    history.push(player);
    let result, resultType;
    if (player === opp) { result = '🤝 เสมอ'; resultType = 'draw'; }
    else if (BEATS[player] === opp) { pScore++; result = '🎉 คุณชนะ!'; resultType = 'win'; }
    else { bScore++; result = '😵 คุณแพ้'; resultType = 'loss'; }
    statusEl.textContent = `${EMOJI[player]} vs ${EMOJI[opp]} — ${result}`;
    historyUI.push({ text: `${EMOJI[player]}${EMOJI[opp]}`, result: resultType });
    renderHistory();
    updateScore();
  }
  function friendPick(player, slot) {
    if (slot === 'p1') {
      playerPick = player;
      statusEl.textContent = `ผู้เล่น 1 เลือก ${EMOJI[player]} — ผู้เล่น 2 เลือก`;
    } else {
      if (!playerPick) return;
      const p1 = playerPick, p2 = player;
      let result;
      if (p1 === p2) result = '🤝 เสมอ';
      else if (BEATS[p1] === p2) { pScore++; result = '🎉 ผู้เล่น 1 ชนะ!'; }
      else { bScore++; result = '🎉 ผู้เล่น 2 ชนะ!'; }
      statusEl.textContent = `${EMOJI[p1]} vs ${EMOJI[p2]} — ${result}`;
      playerPick = null;
      updateScore();
    }
  }
  choicesEl.addEventListener('click', e => {
    const btn = e.target.closest('.rps-btn');
    if (!btn) return;
    const c = btn.dataset.c;
    if (modeEl.value === 'bot') pick(c);
    else friendPick(c, playerPick ? 'p2' : 'p1');
  });
  resetEl.addEventListener('click', () => {
    pScore = 0; bScore = 0; playerPick = null;
    history = []; historyUI = [];
    markov = { rock:{rock:0,paper:0,scissors:0}, paper:{rock:0,paper:0,scissors:0}, scissors:{rock:0,paper:0,scissors:0} };
    updateScore(); renderHistory();
    statusEl.textContent = 'เลือกอาวุธ';
  });
  modeEl.addEventListener('change', () => {
    pScore = 0; bScore = 0; playerPick = null;
    history = []; historyUI = [];
    updateScore(); renderHistory();
    statusEl.textContent = 'เลือกอาวุธ';
  });
  updateScore();
  setStatus('✅ RPS พร้อมเล่น');
}

// ============================================================
// CHECKERS
// ============================================================
function initChecker() {
  setStatus('กำลัง init Checkers...');
  const boardEl = $('ck-board'), statusEl = $('ck-status');
  const modeEl = $('ck-mode'), diffEl = $('ck-diff'), resetEl = $('ck-reset');
  const N = 8;
  let board, turn, selected, gameOver, mustJumpFrom;

  function init() {
    board = Array.from({length:N}, () => Array(N).fill(null));
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = { color:'black', king:false };
        else if (r > 4) board[r][c] = { color:'red', king:false };
      }
    }
    turn = 'red'; selected = null; gameOver = false; mustJumpFrom = null;
    statusEl.textContent = 'ตาของ 🔴 แดง';
    render();
  }
  function cloneBoard(b) { return b.map(row => row.map(p => p ? {...p} : null)); }
  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((r + c) % 2 ? 'dark' : 'light');
      if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');
      if (mustJumpFrom && mustJumpFrom.r === r && mustJumpFrom.c === c) cell.classList.add('selected');
      const p = board[r][c];
      if (p) {
        const piece = document.createElement('div');
        piece.className = `piece ${p.color}${p.king ? ' king' : ''}`;
        cell.appendChild(piece);
      }
      cell.addEventListener('click', () => onClick(r, c));
      boardEl.appendChild(cell);
    }
    if (selected || mustJumpFrom) {
      const from = mustJumpFrom || selected;
      const moves = getMoves(board, from.r, from.c);
      for (const m of moves) boardEl.children[m.tr * N + m.tc].classList.add('valid');
    }
  }
  function onClick(r, c) {
    if (gameOver) return;
    if (modeEl.value === 'bot' && turn !== 'red') return;
    if (mustJumpFrom) {
      const moves = getMoves(board, mustJumpFrom.r, mustJumpFrom.c);
      const mv = moves.find(m => m.tr === r && m.tc === c);
      if (mv) { applyMove(mustJumpFrom.r, mustJumpFrom.c, mv); return; }
      return;
    }
    const p = board[r][c];
    if (selected) {
      const mv = getMoves(board, selected.r, selected.c).find(m => m.tr === r && m.tc === c);
      if (mv) { applyMove(selected.r, selected.c, mv); return; }
    }
    if (p && p.color === turn) { selected = { r, c }; render(); }
    else { selected = null; render(); }
  }
  function getMoves(b, r, c) {
    const p = b[r][c];
    if (!p) return [];
    const dirs = [];
    if (p.king) dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    else if (p.color === 'red') dirs.push([-1,-1],[-1,1]);
    else dirs.push([1,-1],[1,1]);
    const jumps = [], moves = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (!inB(nr,nc)) continue;
      if (!b[nr][nc]) moves.push({ tr:nr, tc:nc, jump:false });
      else if (b[nr][nc].color !== p.color) {
        const jr = r + dr*2, jc = c + dc*2;
        if (inB(jr,jc) && !b[jr][jc]) jumps.push({ tr:jr, tc:jc, jump:true, cr:nr, cc:nc });
      }
    }
    if (jumps.length) return jumps;
    return moves;
  }
  function inB(r,c) { return r>=0 && r<N && c>=0 && c<N; }
  function allMoves(b, color) {
    const all = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = b[r][c];
      if (p && p.color === color) for (const m of getMoves(b, r, c)) all.push({ r, c, m });
    }
    return all;
  }
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
    if (move.jump) {
      const more = getMoves(board, move.tr, move.tc).filter(m => m.jump);
      if (more.length) {
        mustJumpFrom = { r: move.tr, c: move.tc };
        statusEl.textContent = `ต้องกินต่อ! (${turn === 'red' ? '🔴' : '⚫'})`;
        render(); return;
      }
    }
    mustJumpFrom = null;
    const opp = turn === 'red' ? 'black' : 'red';
    if (!hasPieces(board, opp)) { gameOver = true; statusEl.textContent = turn === 'red' ? '🔴 แดงชนะ!' : '⚫ ดำชนะ!'; render(); return; }
    turn = opp;
    statusEl.textContent = `ตาของ ${turn === 'red' ? '🔴 แดง' : '⚫ ดำ'}`;
    render();
    if (modeEl.value === 'bot' && turn === 'black') setTimeout(botMove, 500);
  }
  function hasPieces(b, color) {
    for (const row of b) for (const p of row) if (p && p.color === color) return true;
    return false;
  }
  function evaluate(b, color) {
    let s = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = b[r][c];
      if (!p) continue;
      let v = p.king ? 3 : 1;
      if (p.color === color) s += v; else s -= v;
    }
    return s;
  }
  function botMove() {
    if (gameOver) return;
    const diff = diffEl.value;
    const all = allMoves(board, 'black');
    if (!all.length) return;
    let choice;
    if (diff === 'easy') choice = randomChoice(all);
    else {
      const scored = all.map(mv => {
        let s = 0;
        if (mv.m.jump) s += 10;
        if (!board[mv.r][mv.c].king && mv.m.tr === N-1) s += 5;
        return { mv, s };
      });
      scored.sort((a,b) => b.s - a.s);
      choice = diff === 'medium' && Math.random() < 0.5 ? randomChoice(all) : scored[0].mv;
    }
    applyMove(choice.r, choice.c, choice.m);
  }
  resetEl.addEventListener('click', init);
  modeEl.addEventListener('change', init);
  diffEl.addEventListener('change', init);
  init();
  setStatus('✅ Checkers พร้อมเล่น');
}

// ============================================================
// CHESS
// ============================================================
function initChess() {
  setStatus('กำลัง init Chess...');
  const boardEl = $('ch-board'), statusEl = $('ch-status');
  const modeEl = $('ch-mode'), diffEl = $('ch-diff'), resetEl = $('ch-reset');
  const N = 8;
  const GLYPH = { 'wK':'♔','wQ':'♕','wR':'♖','wB':'♗','wN':'♘','wP':'♙','bK':'♚','bQ':'♛','bR':'♜','bB':'♝','bN':'♞','bP':'♟' };
  let board, turn, selected, gameOver, castling, enPassant;

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
  setStatus('✅ Chess พร้อมเล่น');
}

// ============================================================
// SUDOKU
// ============================================================
function initSudoku() {
  setStatus('กำลัง init Sudoku...');
  const boardEl = $('sd-board'), padEl = $('sd-pad'), statusEl = $('sd-status');
  const diffEl = $('sd-diff'), resetEl = $('sd-reset'), hintEl = $('sd-hint'), checkEl = $('sd-check');
  const pencilEl = $('sd-pencil');
  const N = 9, BOX = 3;
  let solution = [], userGrid = [], givenMask = [], pencilGrid = [], selected = null;
  let pencilMode = false;

  function emptyGrid() { return Array.from({length:N}, () => Array(N).fill(0)); }
  function isValid(grid, r, c, n) {
    for (let i = 0; i < N; i++) if (grid[r][i] === n || grid[i][c] === n) return false;
    const br = Math.floor(r/BOX)*BOX, bc = Math.floor(c/BOX)*BOX;
    for (let i = 0; i < BOX; i++) for (let j = 0; j < BOX; j++) if (grid[br+i][bc+j] === n) return false;
    return true;
  }
  function solve(grid) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c] === 0) {
        for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n;
            if (solve(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
    return true;
  }
  function countSolutions(grid, limit) {
    let count = 0;
    function bt() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (grid[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              bt();
              grid[r][c] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
      count++;
    }
    bt();
    return count;
  }
  function generate(diff) {
    const full = emptyGrid();
    solve(full);
    const p = full.map(row => [...row]);
    const cells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push([r, c]);
    shuffle(cells);
    const removeCount = diff === 'easy' ? 35 : diff === 'medium' ? 45 : 52;
    let removed = 0;
    for (const [r, c] of cells) {
      if (removed >= removeCount) break;
      const backup = p[r][c];
      p[r][c] = 0;
      if (countSolutions(p.map(row => [...row]), 2) !== 1) p[r][c] = backup;
      else removed++;
    }
    return { puzzle: p, solution: full };
  }
  function render() {
    boardEl.innerHTML = '';
    const selVal = selected ? userGrid[selected.r][selected.c] : 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (givenMask[r] && givenMask[r][c]) cell.classList.add('given');
      if (selected) {
        if (selected.r === r && selected.c === c) cell.classList.add('selected');
        else if (selected.r === r || selected.c === c || (Math.floor(selected.r/3) === Math.floor(r/3) && Math.floor(selected.c/3) === Math.floor(c/3)))
          cell.classList.add('related');
        if (selVal && userGrid[r] && userGrid[r][c] === selVal && !(selected.r === r && selected.c === c))
          cell.classList.add('same-value');
      }
      const v = userGrid[r] ? userGrid[r][c] : 0;
      if (v) {
        cell.textContent = v;
        if (!givenMask[r][c]) cell.classList.add('user');
        if (!givenMask[r][c] && v !== solution[r][c]) cell.classList.add('error');
      } else if (pencilGrid[r] && pencilGrid[r][c] && pencilGrid[r][c].size) {
        const pencil = document.createElement('div');
        pencil.className = 'pencil';
        for (let n = 1; n <= 9; n++) {
          const span = document.createElement('span');
          span.textContent = pencilGrid[r][c].has(n) ? n : '';
          pencil.appendChild(span);
        }
        cell.appendChild(pencil);
      }
      cell.addEventListener('click', () => { selected = { r, c }; render(); });
      boardEl.appendChild(cell);
    }
  }
  function renderPad() {
    padEl.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const b = document.createElement('button');
      let count = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (userGrid[r][c] === n) count++;
      b.innerHTML = `${n}<span class="count">${Math.max(0, 9 - count)}</span>`;
      if (count >= 9) b.classList.add('done');
      b.addEventListener('click', () => placeNumber(n));
      padEl.appendChild(b);
    }
    const erase = document.createElement('button');
    erase.textContent = '⌫';
    erase.className = 'erase';
    erase.addEventListener('click', () => placeNumber(0));
    padEl.appendChild(erase);
  }
  function placeNumber(n) {
    if (!selected) { statusEl.textContent = 'เลือกช่องก่อน'; return; }
    const { r, c } = selected;
    if (givenMask[r][c]) { statusEl.textContent = 'ช่องนี้เป็นตัวเลขตั้งต้น'; return; }
    if (pencilMode && n !== 0) {
      if (!pencilGrid[r][c]) pencilGrid[r][c] = new Set();
      if (pencilGrid[r][c].has(n)) pencilGrid[r][c].delete(n);
      else pencilGrid[r][c].add(n);
    } else {
      userGrid[r][c] = n;
      pencilGrid[r][c] = null;
    }
    render(); renderPad();
    if (isComplete()) statusEl.textContent = '🎉 ยินดีด้วย! คุณแก้ Sudoku สำเร็จ!';
    else statusEl.textContent = 'ใส่แล้ว';
  }
  function isComplete() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (userGrid[r][c] !== solution[r][c]) return false;
    return true;
  }
  function hint() {
    const empties = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!givenMask[r][c] && userGrid[r][c] !== solution[r][c]) empties.push([r, c]);
    if (!empties.length) { statusEl.textContent = 'ทำเสร็จแล้ว!'; return; }
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    userGrid[r][c] = solution[r][c];
    pencilGrid[r][c] = null;
    selected = { r, c };
    render(); renderPad();
    statusEl.textContent = '💡 ใส่คำใบ้ให้ 1 ช่อง';
    if (isComplete()) statusEl.textContent = '🎉 ยินดีด้วย! คุณแก้ Sudoku สำเร็จ!';
  }
  function checkErrors() {
    let errors = 0, empty = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (givenMask[r][c]) continue;
      if (userGrid[r][c] === 0) empty++;
      else if (userGrid[r][c] !== solution[r][c]) errors++;
    }
    if (!errors && !empty) statusEl.textContent = '🎉 ถูกต้องทั้งหมด!';
    else if (errors) statusEl.textContent = `❌ มีตัวเลขผิด ${errors} ช่อง, ว่าง ${empty} ช่อง`;
    else statusEl.textContent = `✅ ไม่มีตัวเลขผิด, เหลืออีก ${empty} ช่อง`;
    render();
  }
  function newGame() {
    statusEl.textContent = 'กำลังสร้าง Sudoku...';
    setTimeout(() => {
      const { puzzle, solution: s } = generate(diffEl.value);
      solution = s;
      userGrid = puzzle.map(row => [...row]);
      givenMask = puzzle.map(row => row.map(v => v !== 0));
      pencilGrid = Array.from({length:N}, () => Array(N).fill(null));
      selected = null;
      render(); renderPad();
      statusEl.textContent = 'เลือกช่องแล้วใส่ตัวเลข 1-9';
    }, 50);
  }
  pencilEl.addEventListener('click', () => {
    pencilMode = !pencilMode;
    pencilEl.textContent = pencilMode ? '✏️ Pencil: เปิด' : '✏️ Pencil: ปิด';
  });
  resetEl.addEventListener('click', newGame);
  hintEl.addEventListener('click', hint);
  checkEl.addEventListener('click', checkErrors);
  diffEl.addEventListener('change', newGame);
  newGame();
  setStatus('✅ Sudoku พร้อมเล่น');
}

// ============================================================
// 2048
// ============================================================
function initGame2048() {
  setStatus('กำลัง init 2048...');
  const boardEl = $('g2048-board'), scoreEl = $('g2048-score'), statusEl = $('g2048-status');
  const resetEl = $('g2048-reset'), undoEl = $('g2048-undo');
  const SIZE = 4;
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
  setStatus('✅ 2048 พร้อมเล่น');
}

// ============================================================
// BLOCK BLAST
// ============================================================
function initBlockBlast() {
  setStatus('กำลัง init Block Blast...');
  const gridEl = $('bb-grid'), trayEl = $('bb-tray'), scoreEl = $('bb-score');
  const statusEl = $('bb-status'), resetEl = $('bb-reset');
  const SIZE = 8;
  const SHAPES = [
    [[0,0]],
    [[0,0],[0,1]], [[0,0],[1,0]],
    [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
    [[0,0],[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
    [[0,0],[1,0],[1,1]], [[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,1]], [[0,0],[0,1],[1,0]],
    [[0,0],[1,0],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,2]]
  ];
  const COLORS = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#22d3ee','#fb923c'];
  let grid, tray, score, best, selectedIdx, combo = 0;

  function emptyGrid() { return Array.from({length:SIZE}, () => Array(SIZE).fill(null)); }
  function randomPiece() {
    const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    return { shape, color };
  }
  function init() {
    grid = emptyGrid();
    tray = [randomPiece(), randomPiece(), randomPiece()];
    score = 0; combo = 0; selectedIdx = null;
    best = +(localStorage.getItem('bb-best') || 0);
    render(); updateScore();
    statusEl.textContent = 'แตะชิ้น → แตะช่องว่างเพื่อวาง';
  }
  function updateScore() {
    scoreEl.textContent = `คะแนน: ${score} | สูงสุด: ${best}${combo > 1 ? ' | Combo x' + combo : ''}`;
  }
  function canPlace(shape, r, c) {
    for (const [dr, dc] of shape) {
      const rr = r+dr, cc = c+dc;
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || grid[rr][cc]) return false;
    }
    return true;
  }
  function render() {
    gridEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (grid[r][c]) { cell.classList.add('filled'); cell.style.background = grid[r][c]; }
      cell.addEventListener('click', () => onCellClick(r, c));
      gridEl.appendChild(cell);
    }
    trayEl.innerHTML = '';
    tray.forEach((piece, i) => {
      if (!piece) {
        const ph = document.createElement('div');
        ph.style.width = '60px'; ph.style.height = '60px';
        trayEl.appendChild(ph);
        return;
      }
      const el = document.createElement('div');
      el.className = 'piece';
      if (selectedIdx === i) el.classList.add('selected');
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
      el.addEventListener('click', () => {
        selectedIdx = i;
        statusEl.textContent = `เลือกชิ้นแล้ว (${piece.shape.length} ช่อง) — แตะช่องบนกระดานเพื่อวาง`;
        render();
      });
      trayEl.appendChild(el);
    });
  }
  function onCellClick(r, c) {
    if (selectedIdx === null) { statusEl.textContent = 'แตะชิ้นจากถาดก่อน'; return; }
    const piece = tray[selectedIdx];
    if (!piece || !canPlace(piece.shape, r, c)) {
      statusEl.textContent = '❌ วางตรงนี้ไม่ได้';
      return;
    }
    for (const [dr, dc] of piece.shape) grid[r+dr][c+dc] = piece.color;
    tray[selectedIdx] = null;
    selectedIdx = null;
    const toClear = [];
    for (let rr = 0; rr < SIZE; rr++) if (grid[rr].every(v => v)) toClear.push(...grid[rr].map((_,i) => [rr,i]));
    for (let cc = 0; cc < SIZE; cc++) {
      let full = true;
      for (let rr = 0; rr < SIZE; rr++) if (!grid[rr][cc]) { full = false; break; }
      if (full) for (let rr = 0; rr < SIZE; rr++) toClear.push([rr,cc]);
    }
    if (toClear.length) {
      const unique = [...new Map(toClear.map(x => [x.join(','), x])).values()];
      combo++;
      const gained = unique.length * 10 * combo;
      score += gained;
      statusEl.textContent = `🔥 ล้าง ${unique.length} ช่อง! +${gained} (Combo x${combo})`;
      for (const [rr,cc] of unique) grid[rr][cc] = null;
    } else {
      combo = 0;
      score += piece.shape.length;
      statusEl.textContent = 'วางแล้ว';
    }
    if (score > best) { best = score; localStorage.setItem('bb-best', best); }
    updateScore();
    if (tray.every(p => !p)) {
      tray = [randomPiece(), randomPiece(), randomPiece()];
      combo = 0;
    }
    render();
    setTimeout(() => {
      if (!canPlaceAny()) {
        statusEl.textContent = `💀 ไม่มีที่วางแล้ว! คะแนน ${score}`;
        setTimeout(() => { if (confirm('เกมจบ! เริ่มใหม่?')) init(); }, 100);
      }
    }, 200);
  }
  function canPlaceAny() {
    for (const piece of tray) {
      if (!piece) continue;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        if (canPlace(piece.shape, r, c)) return true;
      }
    }
    return false;
  }
  resetEl.addEventListener('click', init);
  init();
  setStatus('✅ Block Blast พร้อมเล่น');
}

// ============================================================
// FRUIT NINJA
// ============================================================
function initFruitNinja() {
  setStatus('กำลัง init Fruit Ninja...');
  const canvas = $('fn-canvas'), ctx = canvas.getContext('2d');
  const scoreEl = $('fn-score'), statusEl = $('fn-status'), resetEl = $('fn-reset');
  const FRUITS = [
    { e:'🍉', pts:1 },{ e:'🍎', pts:1 },{ e:'🍊', pts:1 },{ e:'🍌', pts:1 },
    { e:'🍇', pts:1 },{ e:'🍓', pts:2 },{ e:'🍍', pts:2 },{ e:'🥝', pts:2 }
  ];
  let items = [], halves = [], particles = [], slashTrail = [];
  let score = 0, timeLeft = 60, running = false, combo = 0, comboTimeout = null;
  let spawnTimer, clockTimer, rafId;
  let isSlashing = false, lastSlashPos = null;

  function resize() {
    const w = Math.min(canvas.parentElement.clientWidth, 700);
    canvas.width = w;
    canvas.height = Math.round(w * 0.6);
  }
  window.addEventListener('resize', resize);
  resize();

  function spawn() {
    if (!running) return;
    const isBomb = Math.random() < 0.15;
    const fruit = randomChoice(FRUITS);
    const x = 80 + Math.random() * (canvas.width - 160);
    items.push({
      x, y: canvas.height + 40,
      vx: (Math.random() - 0.5) * 2,
      vy: -(9 + Math.random() * 4),
      r: 30, isBomb,
      emoji: isBomb ? '💣' : fruit.e,
      pts: fruit.pts,
      rot: 0, vr: (Math.random() - 0.5) * 0.15,
    });
  }
  function update() {
    items.forEach(it => { it.x += it.vx; it.y += it.vy; it.vy += 0.28; it.rot += it.vr; });
    items = items.filter(it => it.y < canvas.height + 100);
    halves.forEach(h => { h.x += h.vx; h.y += h.vy; h.vy += 0.3; h.rot += h.vr; h.life--; });
    halves = halves.filter(h => h.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; });
    particles = particles.filter(p => p.life > 0);
    slashTrail.forEach(t => t.life--);
    slashTrail = slashTrail.filter(t => t.life > 0);
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.font = `${it.r * 2}px serif`;
      ctx.fillText(it.emoji, 0, 0);
      ctx.restore();
    });
    halves.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.globalAlpha = Math.min(1, h.life / 20);
      ctx.font = `${h.r * 2}px serif`;
      ctx.fillText(h.emoji, 0, 0);
      ctx.restore();
    });
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (slashTrail.length > 1) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(slashTrail[0].x, slashTrail[0].y);
      for (let i = 1; i < slashTrail.length; i++) ctx.lineTo(slashTrail[i].x, slashTrail[i].y);
      ctx.stroke();
    }
    if (combo > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}`, canvas.width/2, 50);
    }
  }
  function loop() {
    update();
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }
  function slash(x, y) {
    if (!running) return;
    slashTrail.push({ x, y, life: 15 });
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const dx = it.x - x, dy = it.y - y;
      if (dx*dx + dy*dy < (it.r + 15) * it.r) {
        if (it.isBomb) {
          score = Math.max(0, score - 10);
          statusEl.textContent = '💣 โดนระเบิด! -10';
          combo = 0;
          for (let k = 0; k < 20; k++) {
            particles.push({
              x: it.x, y: it.y,
              vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
              r: 3, color: '#ef4444', life: 30, maxLife: 30
            });
          }
        } else {
          for (let h = 0; h < 2; h++) {
            halves.push({
              x: it.x, y: it.y,
              vx: (Math.random()-0.5)*6 + (h ? 2 : -2),
              vy: -3 - Math.random()*3,
              r: it.r * 0.7, emoji: it.emoji, rot: it.rot, vr: (Math.random()-0.5)*0.2,
              life: 40
            });
          }
          for (let k = 0; k < 8; k++) {
            particles.push({
              x: it.x, y: it.y,
              vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
              r: 2 + Math.random()*3, color: '#fbbf24', life: 20, maxLife: 20
            });
          }
          combo++;
          const pts = it.pts * (combo > 1 ? 2 : 1);
          score += pts;
          statusEl.textContent = `+${pts} ${combo > 1 ? `(Combo x${combo})` : ''}`;
          clearTimeout(comboTimeout);
          comboTimeout = setTimeout(() => { combo = 0; }, 1000);
        }
        items.splice(i, 1);
        updateScore();
      }
    }
  }
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * (canvas.width / rect.width),
      y: (t.clientY - rect.top) * (canvas.height / rect.height)
    };
  }
  canvas.addEventListener('mousedown', e => { isSlashing = true; const p = getPos(e); slash(p.x, p.y); lastSlashPos = p; });
  canvas.addEventListener('mousemove', e => {
    if (!isSlashing) return;
    const p = getPos(e);
    if (lastSlashPos) {
      for (let i = 1; i <= 5; i++) {
        slash(lastSlashPos.x + (p.x - lastSlashPos.x) * i/5, lastSlashPos.y + (p.y - lastSlashPos.y) * i/5);
      }
    }
    lastSlashPos = p;
  });
  canvas.addEventListener('mouseup', () => { isSlashing = false; lastSlashPos = null; });
  canvas.addEventListener('mouseleave', () => { isSlashing = false; lastSlashPos = null; });
  canvas.addEventListener('touchstart', e => { const p = getPos(e); slash(p.x, p.y); lastSlashPos = p; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    const p = getPos(e);
    if (lastSlashPos) {
      for (let i = 1; i <= 5; i++) {
        slash(lastSlashPos.x + (p.x - lastSlashPos.x) * i/5, lastSlashPos.y + (p.y - lastSlashPos.y) * i/5);
      }
    }
    lastSlashPos = p;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { lastSlashPos = null; });

  function updateScore() { scoreEl.textContent = `คะแนน: ${score} | เวลา: ${timeLeft}s`; }
  function start() {
    stop();
    score = 0; timeLeft = 60; items = []; halves = []; particles = []; slashTrail = [];
    combo = 0; running = true;
    updateScore();
    statusEl.textContent = 'ปาดนิ้ว/ลากเมาส์ฟันผลไม้';
    spawnTimer = setInterval(spawn, 500);
    clockTimer = setInterval(() => {
      timeLeft--; updateScore();
      if (timeLeft <= 0) end();
    }, 1000);
    loop();
  }
  function end() {
    running = false;
    clearInterval(spawnTimer); clearInterval(clockTimer); cancelAnimationFrame(rafId);
    statusEl.textContent = `⏰ หมดเวลา! คะแนนรวม ${score}`;
  }
  function stop() {
    running = false;
    clearInterval(spawnTimer); clearInterval(clockTimer); cancelAnimationFrame(rafId);
  }
  resetEl.addEventListener('click', start);
  start();
  setStatus('✅ Fruit Ninja พร้อมเล่น');
}

// ============================================================
// BOOT — try-catch แยกเกม ถ้าเกมใด crash เกมอื่นยังเล่นได้
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const games = [
    { name: 'XO', fn: initXO },
    { name: 'Battleship', fn: initBattleship },
    { name: 'Connect4', fn: initConnect4 },
    { name: 'Memory', fn: initMemory },
    { name: 'RPS', fn: initRPS },
    { name: 'Checkers', fn: initChecker },
    { name: 'Chess', fn: initChess },
    { name: 'Sudoku', fn: initSudoku },
    { name: '2048', fn: initGame2048 },
    { name: 'Block Blast', fn: initBlockBlast },
    { name: 'Fruit Ninja', fn: initFruitNinja },
  ];
  let ok = 0, fail = 0;
  for (const g of games) {
    try {
      g.fn();
      ok++;
    } catch (err) {
      fail++;
      console.error(`[${g.name}] init failed:`, err);
      setStatus(`❌ ${g.name} init ไม่สำเร็จ: ${err.message}`, true);
    }
  }
  setTimeout(() => {
    setStatus(`✅ โหลดเสร็จ: ${ok} เกม / ล้มเหลว ${fail} เกม — คลิกเกมเพื่อเล่น`);
  }, 300);
});
