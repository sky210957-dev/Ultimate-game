import { $, randomChoice } from '../utils.js';

const FRUITS = [
  { e:'🍉', pts:1 },{ e:'🍎', pts:1 },{ e:'🍊', pts:1 },{ e:'🍌', pts:1 },
  { e:'🍇', pts:1 },{ e:'🍓', pts:2 },{ e:'🍍', pts:2 },{ e:'🥝', pts:2 }
];

export function initFruitNinja() {
  const canvas = $('fn-canvas'), ctx = canvas.getContext('2d');
  const scoreEl = $('fn-score'), statusEl = $('fn-status'), resetEl = $('fn-reset');
  let items = [], halves = [], particles = [], slashTrail = [];
  let score = 0, timeLeft = 60, running = false, combo = 0, comboTimeout = null;
  let spawnTimer, clockTimer, rafId;
  let isSlashing = false, lastSlashPos = null;

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
    const fruit = randomChoice(FRUITS);
    const x = 80 + Math.random() * (canvas.width - 160);
    items.push({
      x, y: canvas.height + 40,
      vx: (Math.random() - 0.5) * 2,
      vy: -(9 + Math.random() * 4),
      r: 30, isBomb,
      emoji: isBomb ? '💣' : fruit.e,
      pts: fruit.pts,
      rot: 0, vr: (Math.random() - 0.5) * 0.15,
    });
  }
  function update() {
    items.forEach(it => { it.x += it.vx; it.y += it.vy; it.vy += 0.28; it.rot += it.vr; });
    items = items.filter(it => it.y < canvas.height + 100);
    halves.forEach(h => { h.x += h.vx; h.y += h.vy; h.vy += 0.3; h.rot += h.vr; h.life--; });
    halves = halves.filter(h => h.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; });
    particles = particles.filter(p => p.life > 0);
    slashTrail.forEach(t => t.life--);
    slashTrail = slashTrail.filter(t => t.life > 0);
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.font = `${it.r * 2}px serif`;
      ctx.fillText(it.emoji, 0, 0);
      ctx.restore();
    });
    halves.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.globalAlpha = Math.min(1, h.life / 20);
      ctx.font = `${h.r * 2}px serif`;
      ctx.fillText(h.emoji, 0, 0);
      ctx.restore();
    });
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (slashTrail.length > 1) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(slashTrail[0].x, slashTrail[0].y);
      for (let i = 1; i < slashTrail.length; i++) ctx.lineTo(slashTrail[i].x, slashTrail[i].y);
      ctx.stroke();
    }
    if (combo > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}`, canvas.width/2, 50);
    }
  }
  function loop() {
    update();
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }
  function slash(x, y) {
    if (!running) return;
    slashTrail.push({ x, y, life: 15 });
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const dx = it.x - x, dy = it.y - y;
      if (dx*dx + dy*dy < (it.r + 15) * it.r) {
        if (it.isBomb) {
          score = Math.max(0, score - 10);
          statusEl.textContent = '💣 โดนระเบิด! -10';
          combo = 0;
          for (let k = 0; k < 20; k++) {
            particles.push({
              x: it.x, y: it.y,
              vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
              r: 3, color: '#ef4444', life: 30, maxLife: 30
            });
          }
        } else {
          for (let h = 0; h < 2; h++) {
            halves.push({
              x: it.x, y: it.y,
              vx: (Math.random()-0.5)*6 + (h ? 2 : -2),
              vy: -3 - Math.random()*3,
              r: it.r * 0.7, emoji: it.emoji, rot: it.rot, vr: (Math.random()-0.5)*0.2,
              life: 40
            });
          }
          for (let k = 0; k < 8; k++) {
            particles.push({
              x: it.x, y: it.y,
              vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
              r: 2 + Math.random()*3, color: '#fbbf24', life: 20, maxLife: 20
            });
          }
          combo++;
          const pts = it.pts * (combo > 1 ? 2 : 1);
          score += pts;
          statusEl.textContent = `+${pts} ${combo > 1 ? `(Combo x${combo})` : ''}`;
          clearTimeout(comboTimeout);
          comboTimeout = setTimeout(() => { combo = 0; }, 1000);
        }
        items.splice(i, 1);
        updateScore();
      }
    }
  }
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - rect.left) * (canvas.width / rect.width),
      y: (t.clientY - rect.top) * (canvas.height / rect.height)
    };
  }
  canvas.addEventListener('mousedown', e => { isSlashing = true; const p = getPos(e); slash(p.x, p.y); lastSlashPos = p; });
  canvas.addEventListener('mousemove', e => {
    if (!isSlashing) return;
    const p = getPos(e);
    if (lastSlashPos) {
      for (let i = 1; i <= 5; i++) {
        slash(lastSlashPos.x + (p.x - lastSlashPos.x) * i/5, lastSlashPos.y + (p.y - lastSlashPos.y) * i/5);
      }
    }
    lastSlashPos = p;
  });
  canvas.addEventListener('mouseup', () => { isSlashing = false; lastSlashPos = null; });
  canvas.addEventListener('mouseleave', () => { isSlashing = false; lastSlashPos = null; });
  canvas.addEventListener('touchstart', e => { const p = getPos(e); slash(p.x, p.y); lastSlashPos = p; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    const p = getPos(e);
    if (lastSlashPos) {
      for (let i = 1; i <= 5; i++) {
        slash(lastSlashPos.x + (p.x - lastSlashPos.x) * i/5, lastSlashPos.y + (p.y - lastSlashPos.y) * i/5);
      }
    }
    lastSlashPos = p;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { lastSlashPos = null; });

  function updateScore() { scoreEl.textContent = `คะแนน: ${score} | เวลา: ${timeLeft}s`; }
  function start() {
    stop();
    score = 0; timeLeft = 60; items = []; halves = []; particles = []; slashTrail = [];
    combo = 0; running = true;
    updateScore();
    statusEl.textContent = 'ปาดนิ้ว/ลากเมาส์ฟันผลไม้';
    spawnTimer = setInterval(spawn, 500);
    clockTimer = setInterval(() => {
      timeLeft--; updateScore();
      if (timeLeft <= 0) end();
    }, 1000);
    loop();
  }
  function end() {
    running = false;
    clearInterval(spawnTimer); clearInterval(clockTimer); cancelAnimationFrame(rafId);
    statusEl.textContent = `⏰ หมดเวลา! คะแนนรวม ${score}`;
  }
  function stop() {
    running = false;
    clearInterval(spawnTimer); clearInterval(clockTimer); cancelAnimationFrame(rafId);
  }
  resetEl.addEventListener('click', start);
  start();
}
