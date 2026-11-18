const N = 9;
const BOX = 3;

export function initSudoku() {
  const boardEl = document.getElementById('sd-board');
  const padEl = document.getElementById('sd-pad');
  const statusEl = document.getElementById('sd-status');
  const diffEl = document.getElementById('sd-diff');
  const resetEl = document.getElementById('sd-reset');
  const hintEl = document.getElementById('sd-hint');
  const checkEl = document.getElementById('sd-check');

  let solution = [], puzzle = [], userGrid = [], givenMask = [], selected = null;

  function emptyGrid() { return Array.from({length:N}, () => Array(N).fill(0)); }

  function isValid(grid, r, c, n) {
    for (let i = 0; i < N; i++) {
      if (grid[r][i] === n) return false;
      if (grid[i][c] === n) return false;
    }
    const br = Math.floor(r/BOX) * BOX, bc = Math.floor(c/BOX) * BOX;
    for (let i = 0; i < BOX; i++)
      for (let j = 0; j < BOX; j++)
        if (grid[br+i][bc+j] === n) return false;
    return true;
  }

  function solve(grid) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c] === 0) {
          const nums = shuffle([1,2,3,4,5,6,7,8,9]);
          for (const n of nums) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              if (solve(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function countSolutions(grid, limit = 2) {
    let count = 0;
    function backtrack() {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (grid[r][c] === 0) {
            for (let n = 1; n <= 9; n++) {
              if (isValid(grid, r, c, n)) {
                grid[r][c] = n;
                backtrack();
                grid[r][c] = 0;
                if (count >= limit) return;
              }
            }
            return;
          }
        }
      }
      count++;
    }
    backtrack();
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
      const copy = p.map(row => [...row]);
      if (countSolutions(copy, 2) !== 1) p[r][c] = backup;
      else removed++;
    }
    return { puzzle: p, solution: full };
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (givenMask[r][c]) cell.classList.add('given');
        if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');
        const v = userGrid[r][c];
        if (v) {
          cell.textContent = v;
          if (!givenMask[r][c]) cell.classList.add('user');
        }
        cell.addEventListener('click', () => {
          selected = { r, c };
          render();
        });
        boardEl.appendChild(cell);
      }
    }
  }

  function renderPad() {
    padEl.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const b = document.createElement('button');
      b.textContent = n;
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
    userGrid[r][c] = n;
    render();
    if (n !== 0 && n !== solution[r][c]) statusEl.textContent = '❌ ตัวเลขนี้ผิด';
    else statusEl.textContent = 'ใส่แล้ว';
    if (isComplete()) statusEl.textContent = '🎉 ยินดีด้วย! คุณแก้ Sudoku สำเร็จ!';
  }

  function isComplete() {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (userGrid[r][c] !== solution[r][c]) return false;
    return true;
  }

  function hint() {
    const empties = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (!givenMask[r][c] && userGrid[r][c] !== solution[r][c]) empties.push([r, c]);
    if (!empties.length) { statusEl.textContent = 'ทำเสร็จแล้ว!'; return; }
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    userGrid[r][c] = solution[r][c];
    selected = { r, c };
    render();
    statusEl.textContent = '💡 ใส่คำใบ้ให้ 1 ช่อง';
    if (isComplete()) statusEl.textContent = '🎉 ยินดีด้วย! คุณแก้ Sudoku สำเร็จ!';
  }

  function checkErrors() {
    let errors = 0, empty = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (givenMask[r][c]) continue;
        if (userGrid[r][c] === 0) empty++;
        else if (userGrid[r][c] !== solution[r][c]) errors++;
      }
    }
    if (empty === 0 && errors === 0) statusEl.textContent = '🎉 ถูกต้องทั้งหมด!';
    else if (errors > 0) statusEl.textContent = `❌ มีตัวเลขผิด ${errors} ช่อง, ว่าง ${empty} ช่อง`;
    else statusEl.textContent = `✅ ไม่มีตัวเลขผิด, เหลืออีก ${empty} ช่อง`;
  }

  function newGame() {
    statusEl.textContent = 'กำลังสร้าง Sudoku...';
    setTimeout(() => {
      const { puzzle: p, solution: s } = generate(diffEl.value);
      solution = s;
      puzzle = p;
      userGrid = p.map(row => [...row]);
      givenMask = p.map(row => row.map(v => v !== 0));
      selected = null;
      render();
      renderPad();
      statusEl.textContent = 'เลือกช่องแล้วใส่ตัวเลข 1-9';
    }, 50);
  }

  resetEl.addEventListener('click', newGame);
  hintEl.addEventListener('click', hint);
  checkEl.addEventListener('click', checkErrors);
  diffEl.addEventListener('change', newGame);
  newGame();
}
