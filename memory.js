const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦'];

export function initMemory() {
  const boardEl = document.getElementById('mem-board');
  const statusEl = document.getElementById('mem-status');
  const modeEl = document.getElementById('mem-mode');
  const diffEl = document.getElementById('mem-diff');
  const resetEl = document.getElementById('mem-reset');

  let cards, flipped, matched, lock, scorePlayer, scoreBot, turn;

  function pairsByDiff() {
    return diffEl.value === 'easy' ? 4 : diffEl.value === 'medium' ? 6 : 8;
  }

  function init() {
    const pairs = pairsByDiff();
    const chosen = EMOJIS.slice(0, pairs);
    const deck = [...chosen, ...chosen];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    cards = deck.map((e, i) => ({ id:i, emoji:e, flipped:false, matched:false }));
    flipped = [];
    matched = 0;
    lock = false;
    scorePlayer = 0; scoreBot = 0;
    turn = 'player';
    updateStatus();
    render();
  }

  function render() {
    boardEl.innerHTML = '';
    cards.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'card';
      if (c.matched) el.classList.add('matched');
      if (c.flipped || c.matched) el.classList.add('flipped');
      el.textContent = (c.flipped || c.matched) ? c.emoji : '❓';
      el.addEventListener('click', () => onFlip(i));
      boardEl.appendChild(el);
    });
  }

  function updateStatus() {
    statusEl.textContent = `ผู้เล่น ${scorePlayer} : ${scoreBot} | จับคู่แล้ว ${matched}`;
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

  function resolvePair(who) {
    lock = true;
    const [a, b] = flipped;
    const ca = cards[a], cb = cards[b];
    if (ca.emoji === cb.emoji) {
      ca.matched = cb.matched = true;
      matched++;
      if (who === 'player') scorePlayer++; else scoreBot++;
      flipped = [];
      lock = false;
      updateStatus();
      render();
      if (matched === cards.length / 2) {
        statusEl.textContent = scorePlayer > scoreBot ? `🎉 ผู้เล่นชนะ! ${scorePlayer}:${scoreBot}` :
          scorePlayer < scoreBot ? `😵 บอทชนะ! ${scorePlayer}:${scoreBot}` : `🤝 เสมอ ${scorePlayer}:${scoreBot}`;
        return;
      }
      if (modeEl.value === 'bot' && who === 'player') {
        turn = 'bot';
        setTimeout(botTurn, 800);
      }
    } else {
      setTimeout(() => {
        ca.flipped = cb.flipped = false;
        flipped = [];
        lock = false;
        render();
        if (modeEl.value === 'bot' && who === 'player') {
          turn = 'bot';
          setTimeout(botTurn, 500);
        }
      }, 700);
    }
  }

  function botTurn() {
    if (lock) return;
    const diff = diffEl.value;
    const faceDown = cards.map((c,i) => (!c.flipped && !c.matched) ? i : null).filter(i => i !== null);
    if (faceDown.length === 0) return;

    const memoryChance = diff === 'easy' ? 0 : diff === 'medium' ? 0.3 : 0.9;
    let pickA, pickB;
    if (Math.random() < memoryChance) {
      const seen = {};
      for (const c of cards) {
        if (c.matched) continue;
        if (!seen[c.emoji]) seen[c.emoji] = [];
        seen[c.emoji].push(c.id);
      }
      const knownPair = Object.values(seen).find(arr => arr.length === 2 && faceDown.includes(arr[0]) && faceDown.includes(arr[1]));
      if (knownPair) { pickA = knownPair[0]; pickB = knownPair[1]; }
    }
    if (pickA === undefined) {
      pickA = faceDown[Math.floor(Math.random()*faceDown.length)];
      const rest = faceDown.filter(i => i !== pickA);
      pickB = rest[Math.floor(Math.random()*rest.length)];
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
