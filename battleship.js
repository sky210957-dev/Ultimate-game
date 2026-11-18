import { $, randomChoice } from '../utils.js';

const SIZE = 7;
const SHIPS = [{len:5,name:'Carrier'},{len:4,name:'Battleship'},{len:3,name:'Cruiser'},{len:2,name:'Destroyer'}];

export function initBattleship() {
  const playerEl = $('bs-player'), enemyEl = $('bs-enemy');
  const statusEl = $('bs-status'), modeEl = $('bs-mode'), diffEl = $('bs-diff');
  const resetEl = $('bs-reset'), rotateEl = $('bs-rotate');
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
      return;
    }
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
  resetEl.addEventListener('click', reset);
  modeEl.addEventListener('change', reset);
  diffEl.addEventListener('change', reset);
  reset();
}
