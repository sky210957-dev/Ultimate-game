import { $, shuffle } from '../utils.js';

const N = 9, BOX = 3;

export function initSudoku() {
  const boardEl = $('sd-board'), padEl = $('sd-pad'), statusEl = $('sd-status');
  const diffEl = $('sd-diff'), resetEl = $('sd-reset'), hintEl = $('sd-hint'), checkEl = $('sd-check');
  const pencilEl = $('sd-pencil');
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
  function countSolutions(grid, limit = 2) {
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
    const removeCount = diff === 'easy' ? 40 : diff === 'medium' ? 50 : 56;
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
      if (givenMask[r][c]) cell.classList.add('given');
      if (selected) {
        if (selected.r === r && selected.c === c) cell.classList.add('selected');
        else if (selected.r === r || selected.c === c || (Math.floor(selected.r/3) === Math.floor(r/3) && Math.floor(selected.c/3) === Math.floor(c/3)))
          cell.classList.add('related');
        if (selVal && userGrid[r][c] === selVal && !(selected.r === r && selected.c === c))
          cell.classList.add('same-value');
      }
      const v = userGrid[r][c];
      if (v) {
        cell.textContent = v;
        if (!givenMask[r][c]) cell.classList.add('user');
        if (!givenMask[r][c] && v !== solution[r][c]) cell.classList.add('error');
      } else if (pencilGrid[r][c] && pencilGrid[r][c].size) {
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
}
