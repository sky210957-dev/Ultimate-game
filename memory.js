import { $, randomChoice, sleep, shuffle } from '../utils.js';

const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦄','🐢'];

export function initMemory() {
  const boardEl = $('mem-board'), statusEl = $('mem-status');
  const modeEl = $('mem-mode'), diffEl = $('mem-diff'), resetEl = $('mem-reset');
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
}
