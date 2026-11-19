// ============================================
//  DODGE — Neon Survival
//  A small arcade game by [Your Name]
// ============================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');

const W = canvas.width;
const H = canvas.height;

// ---------- Game state ----------
const STATE = {
  READY: 'ready',
  PLAYING: 'playing',
  OVER: 'over',
};

let state = STATE.READY;

// ---------- Player ----------
const player = {
  x: W / 2,
  y: H - 80,
  width: 46,
  height: 14,
  speed: 6,
  color: '#00ffc8',
};

const keys = { left: false, right: false };

// ---------- Obstacles ----------
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 45; // frames
let difficultyTimer = 0;

// ---------- Score ----------
let score = 0;
let highScore = Number(localStorage.getItem('dodge-highscore') || 0);

// ---------- Input ----------
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;

  if ((e.key === ' ' || e.key === 'Enter') && state !== STATE.PLAYING) {
    startGame();
  }
});

window.addEventListener('keyup', (e) => {
  // ---------- Mobile Touch Controls ----------
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouch(e) {
  e.preventDefault(); // Screen scroll hone se rokne ke liye
  if (state !== STATE.PLAYING) return;
  
  if (e.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    // Jahan touch kiya hai, player ko wahan le jao
    const touchX = e.touches[0].clientX - rect.left;
    player.x = touchX; 
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
}

// ---------- Input (Keyboard) ----------
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;

  if ((e.key === ' ' || e.key === 'Enter') && state !== STATE.PLAYING) {
    startGame();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// Start Button (Click aur Touch dono ke liye)
startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startGame();
}, { passive: false });

// ---------- Helpers ----------
function random(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnObstacle() {
  const width = random(30, 90);
  const isHazard = Math.random() < 0.25; // 25% chance of pink (score)
  obstacles.push({
    x: random(0, W - width),
    y: -30,
    width,
    height: 18,
    speed: random(2.5, 5.5) + score * 0.01,
    color: isHazard ? '#ff2e88' : '#9b5cff',
    bonus: isHazard,
  });
}

function resetGame() {
  player.x = W / 2;
  obstacles = [];
  score = 0;
  spawnTimer = 0;
  spawnInterval = 45;
  difficultyTimer = 0;
  state = STATE.READY;
}

function startGame() {
  resetGame();
  state = STATE.PLAYING;
  overlay.classList.add('hidden');
}

function gameOver() {
  state = STATE.OVER;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('dodge-highscore', highScore);
  }
  showOverlay();
}

function showOverlay() {
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <h1>GAME OVER</h1>
    <p>Score: <strong>${score}</strong></p>
    <p class="hint">High Score: ${highScore}</p>
    <button id="restartBtn">PLAY AGAIN</button>
  `;
  document.getElementById('restartBtn').addEventListener('click', startGame);
}

// ---------- Update ----------
function update() {
  if (state !== STATE.PLAYING) return;

  // Player movement
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(player.width / 2, Math.min(W - player.width / 2, player.x));

  // Spawn
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  // Difficulty ramp
  difficultyTimer++;
  if (difficultyTimer >= 300) {
    difficultyTimer = 0;
    spawnInterval = Math.max(18, spawnInterval - 3);
  }

  // Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed;

    // Collision (AABB)
    const px = player.x - player.width / 2;
    const py = player.y - player.height / 2;
    if (
      px < o.x + o.width &&
      px + player.width > o.x &&
      py < o.y + o.height &&
      py + player.height > o.y
    ) {
      if (o.bonus) {
        score += 5;
        obstacles.splice(i, 1);
      } else {
        gameOver();
        return;
      }
      continue;
    }

    // Out of bounds → score
    if (o.y > H) {
      if (!o.bonus) score++;
      obstacles.splice(i, 1);
    }
  }
}

// ---------- Draw ----------
function drawGrid() {
  ctx.strokeStyle = 'rgba(0, 255, 200, 0.05)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height,
    6
  );
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  for (const o of obstacles) {
    ctx.save();
    ctx.shadowColor = o.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.width, o.height, 4);
    ctx.fill();
    ctx.restore();
  }
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = '#00ffc8';
  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 16, 32);

  ctx.fillStyle = '#6f7a91';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`BEST ${highScore}`, W - 16, 32);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  drawObstacles();
  drawPlayer();
  drawHUD();
}

// ---------- Game loop ----------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

loop();