import { $, randomChoice } from '../utils.js';

const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const EMOJI = { rock:'✊', paper:'✋', scissors:'✌️' };

export function initRPS() {
  const scoreEl = $('rps-score'), statusEl = $('rps-status');
  const choicesEl = $('rps-choices'), historyEl = $('rps-history');
  const modeEl = $('rps-mode'), diffEl = $('rps-diff'), resetEl = $('rps-reset');
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
}
