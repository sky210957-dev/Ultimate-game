import { randomChoice } from '../ai.js';

const SIZE = 7;
const SHIPS = [3, 2, 2, 1];

export function initBattleship() {
  const playerEl = document.getElementById('bs-player');
  const enemyEl = document.getElementById('bs-enemy');
  const statusEl = document.getElementById('bs-status');
  const modeEl = document.getElementById('bs-mode');
  const diffEl = document.getElementById('bs-diff');
  const resetEl = document.getElementById('bs-reset');

  let playerBoard, enemyBoard, placeIdx, turn, gameOver, enemyShips, playerShips;

  function newBoard() { return Array.from({length:SIZE*SIZE}, () => 0); }

  function placeShip(board, len) {
    for (let t = 0; t < 200; t++) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * SIZE);
      const c = Math.floor(Math.random() * SIZE);
      if (horiz) {
        if (c + len > SIZE) continue;
        let ok = true;
        for (let i = 0; i < len; i++) if (board[r*SIZE + c + i] === 1) ok = false;
        if (!ok) continue;
        for (let i = 0; i < len; i++) board[r*SIZE + c + i] = 1;
        return;
      } else {
        if (r + len > SIZE) continue;
        let ok = true;
        for (let i = 0; i < len; i++) if (board[(r+i)*SIZE + c] === 1) ok = false;
        if (!ok) continue;
        for (let i = 0; i < len; i++) board[(r+i)*SIZE + c] = 1;
        return;
      }
    }
  }

  function renderBoard(el, board, ships, showShips, onClickFn) {
    el.innerHTML = '';
    for (let i = 0; i < SIZE*SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (board[i] === 2) cell.classList.add('hit');
      if (ships && ships[i] && showShips) cell.classList.add('ship');
      if (onClickFn) cell.addEventListener('click', () => onClickFn(i));
      el.appendChild(cell);
    }
  }

  function placePlayerShip(i) {
    if (placeIdx >= SHIPS.length) return;
    const len = SHIPS[placeIdx];
    const r = Math.floor(i / SIZE), c = i % SIZE;
    if (c + len <= SIZE) {
      let ok = true;
      for (let k = 0; k < len; k++) if (playerShips[r*SIZE + c + k] === 1) ok = false;
      if (ok) {
        for (let k = 0; k < len; k++) playerShips[r*SIZE + c + k] = 1;
        placeIdx++;
        if (placeIdx >= SHIPS.length) { turn = 'player'; statusEl.textContent = 'ยิงเรือศัตรู!'; }
        else statusEl.textContent = `วางเรือยาว ${SHIPS[placeIdx]} ช่อง`;
        render(); return;
      }
    }
    if (r + len <= SIZE) {
      let ok = true;
      for (let k = 0; k < len; k++) if (playerShips[(r+k)*SIZE + c] === 1) ok = false;
      if (ok) {
        for (let k = 0; k < len; k++) playerShips[(r+k)*SIZE + c] = 1;
        placeIdx++;
        if (placeIdx >= SHIPS.length) { turn = 'player'; statusEl.textContent = 'ยิงเรือศัตรู!'; }
        else statusEl.textContent = `วางเรือยาว ${SHIPS[placeIdx]} ช่อง`;
        render(); return;
      }
    }
    statusEl.textContent = 'วางตรงนี้ไม่ได้';
  }

  function playerFire(i) {
    if (gameOver || turn !== 'player' || enemyBoard[i] === 2) return;
    if (enemyShips[i] === 1) {
      enemyBoard[i] = 2;
      statusEl.textContent = '🎯 โดน!';
      if (checkWin(enemyShips, enemyBoard)) {
        gameOver = true;
        statusEl.textContent = '🎉 คุณชนะ!';
        render(); return;
      }
    } else {
      enemyBoard[i] = 2;
      statusEl.textContent = '💧 พลาด';
    }
    turn = 'bot';
    render();
    setTimeout(botFire, 500);
  }

  function botFire() {
    if (gameOver) return;
    const diff = diffEl.value;
    let target;
    const empty = [];
    for (let i = 0; i < SIZE*SIZE; i++) if (playerBoard[i] !== 2) empty.push(i);

    if (diff === 'easy') target = randomChoice(empty);
    else if (diff === 'medium') {
      const hit = findHitNeighbor(playerBoard);
      target = hit !== undefined && Math.random() < 0.5 ? hit : randomChoice(empty);
    } else {
      const hit = findHitNeighbor(playerBoard);
      target = hit !== undefined ? hit : randomChoice(empty);
    }

    if (playerShips[target] === 1) {
      playerBoard[target] = 2;
      statusEl.textContent = '💥 บอทโดนเรือคุณ!';
      if (checkWin(playerShips, playerBoard)) {
        gameOver = true;
        statusEl.textContent = '😵 บอทชนะ!';
        render(); return;
      }
    } else {
      playerBoard[target] = 2;
      statusEl.textContent = '🌊 บอทพลาด';
    }
    turn = 'player';
    render();
  }

  function findHitNeighbor(board) {
    for (let i = 0; i < SIZE*SIZE; i++) {
      if (board[i] === 2) {
        const r = Math.floor(i/SIZE), c = i % SIZE;
        const neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
        for (const [nr,nc] of neighbors) {
          if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) {
            const idx = nr*SIZE + nc;
            if (board[idx] !== 2) return idx;
          }
        }
      }
    }
    return undefined;
  }

  function checkWin(ships, board) {
    for (let i = 0; i < SIZE*SIZE; i++) {
      if (ships[i] === 1 && board[i] !== 2) return false;
    }
    return true;
  }

  function render() {
    renderBoard(playerEl, playerBoard, playerShips, true, placeIdx < SHIPS.length ? placePlayerShip : null);
    renderBoard(enemyEl, enemyBoard, enemyShips, false, turn === 'player' && placeIdx >= SHIPS.length ? playerFire : null);
  }

  function reset() {
    playerBoard = newBoard();
    enemyBoard = newBoard();
    playerShips = newBoard();
    enemyShips = newBoard();
    SHIPS.forEach(len => placeShip(enemyShips, len));
    placeIdx = 0;
    turn = 'place';
    gameOver = false;
    statusEl.textContent = `วางเรือของคุณ (ยาว ${SHIPS[0]} ช่อง)`;
    render();
  }

  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
}
