import { randomChoice } from '../ai.js';

const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const EMOJI = { rock:'✊', paper:'✋', scissors:'✌️' };

export function initRPS() {
  const scoreEl = document.getElementById('rps-score');
  const statusEl = document.getElementById('rps-status');
  const choicesEl = document.getElementById('rps-choices');
  const modeEl = document.getElementById('rps-mode');
  const diffEl = document.getElementById('rps-diff');
  const resetEl = document.getElementById('rps-reset');

  let pScore = 0, bScore = 0, playerPick = null;

  function updateScore() {
    scoreEl.textContent = `ผู้เล่น ${pScore} : ${bScore} ${modeEl.value === 'bot' ? 'บอท' : 'ผู้เล่น 2'}`;
  }

  function botPick() {
    const diff = diffEl.value;
    if (diff === 'easy') return randomChoice(['rock','paper','scissors']);
    if (diff === 'medium') {
      if (playerPick && Math.random() < 0.3)
        return Object.keys(BEATS).find(k => BEATS[k] === playerPick);
      return randomChoice(['rock','paper','scissors']);
    }
    if (playerPick && Math.random() < 0.6)
      return Object.keys(BEATS).find(k => BEATS[k] === playerPick);
    return randomChoice(['rock','paper','scissors']);
  }

  function pick(player) {
    playerPick = player;
    const opp = botPick();
    let result;
    if (player === opp) result = '🤝 เสมอ';
    else if (BEATS[player] === opp) { pScore++; result = '🎉 คุณชนะ!'; }
    else { bScore++; result = '😵 คุณแพ้'; }
    statusEl.textContent = `${EMOJI[player]} vs ${EMOJI[opp]} — ${result}`;
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
    updateScore();
    statusEl.textContent = 'เลือกอาวุธ';
  });

  modeEl.addEventListener('change', () => {
    pScore = 0; bScore = 0; playerPick = null;
    updateScore();
    statusEl.textContent = 'เลือกอาวุธ';
  });

  updateScore();
}
