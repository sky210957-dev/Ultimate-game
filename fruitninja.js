export function initFruitNinja() {
  const canvas = document.getElementById('fn-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('fn-score');
  const statusEl = document.getElementById('fn-status');
  const resetEl = document.getElementById('fn-reset');

  const FRUITS = [
    { e:'🍉', pts:1 }, { e:'🍎', pts:1 }, { e:'🍊', pts:1 },
    { e:'🍌', pts:1 }, { e:'🍇', pts:1 }, { e:'🍓', pts:2 },
    { e:'🍍', pts:2 }, { e:'🥝', pts:2 }
  ];

  let items = [], score = 0, timeLeft = 60, running = false;
  let spawnTimer, clockTimer, rafId;

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
    const fruit = FRUITS[Math.floor(Math.random()*FRUITS.length)];
    const x = 80 + Math.random() * (canvas.width - 160);
    items.push({
      x, y: canvas.height + 40,
      vx: (Math.random() - 0.5) * 2,
      vy: -(8 + Math.random() * 4),
      r: 28, isBomb,
      emoji: isBomb ? '💣' : fruit.e,
      pts: fruit.pts,
      rot: 0, vr: (Math.random() - 0.5) * 0.15,
    });
  }

  function update() {
    items.forEach(it => {
      it.x += it.vx;
      it.y += it.vy;
      it.vy += 0.25;
      it.rot += it.vr;
    });
    items = items.filter(it => it.y < canvas.height + 80);
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0f172a');
    g.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.font = `${it.r * 2}px serif`;
      ctx.fillText(it.emoji, 0, 0);
      ctx.restore();
    });
  }

  function loop() {
    update();
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }

  function hit(x, y) {
    if (!running) return;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const dx = it.x - x, dy = it.y - y;
      if (dx*dx + dy*dy < it.r * it.r) {
        if (it.isBomb) {
          score = Math.max(0, score - 5);
          statusEl.textContent = '💣 โดนระเบิด! -5';
        } else {
          score += it.pts;
          statusEl.textContent = `+${it.pts} คะแนน`;
        }
        items.splice(i, 1);
        updateScore();
        return;
      }
    }
  }

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    hit(x, y);
  });

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    const y = (t.clientY - rect.top) * (canvas.height / rect.height);
    hit(x, y);
    e.preventDefault();
  }, { passive: false });

  function updateScore() {
    scoreEl.textContent = `คะแนน: ${score} | เวลา: ${timeLeft}s`;
  }

  function start() {
    stop();
    score = 0; timeLeft = 60; items = []; running = true;
    updateScore();
    statusEl.textContent = 'คลิก/แตะผลไม้เพื่อเก็บแต้ม หลีกเลี่ยงระเบิด 💣';
    spawnTimer = setInterval(spawn, 600);
    clockTimer = setInterval(() => {
      timeLeft--;
      updateScore();
      if (timeLeft <= 0) end();
    }, 1000);
    loop();
  }

  function end() {
    running = false;
    clearInterval(spawnTimer);
    clearInterval(clockTimer);
    cancelAnimationFrame(rafId);
    statusEl.textContent = `⏰ หมดเวลา! คะแนนรวม ${score}`;
  }

  function stop() {
    running = false;
    clearInterval(spawnTimer);
    clearInterval(clockTimer);
    cancelAnimationFrame(rafId);
  }

  resetEl.addEventListener('click', start);
  start();
}
