import { initXO } from './games/xo.js';
import { initBattleship } from './games/battleship.js';
import { initConnect4 } from './games/connect4.js';
import { initMemory } from './games/memory.js';
import { initRPS } from './games/rps.js';
import { initChecker } from './games/checker.js';
import { initChess } from './games/chess.js';
import { initSudoku } from './games/sudoku.js';
import { initGame2048 } from './games/game2048.js';
import { initBlockBlast } from './games/blockblast.js';
import { initFruitNinja } from './games/fruitninja.js';
import { $ } from './utils.js';

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

const nav = $('nav');
GAMES.forEach((g, i) => {
  const b = document.createElement('button');
  b.className = 'nav-btn' + (i === 0 ? ' active' : '');
  b.textContent = g.label;
  b.dataset.game = g.id;
  b.addEventListener('click', () => switchGame(g.id));
  nav.appendChild(b);
});

function switchGame(id) {
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.game === id));
  document.querySelectorAll('.panel').forEach(p =>
    p.classList.toggle('active', p.id === 'panel-' + id));
}

$('panel-xo').classList.add('active');

initXO();
initBattleship();
initConnect4();
initMemory();
initRPS();
initChecker();
initChess();
initSudoku();
initGame2048();
initBlockBlast();
initFruitNinja();
