const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const currentLevelEl = document.getElementById('currentLevel');
const difficultyLabelEl = document.getElementById('difficultyLabel');
const stageTitleEl = document.getElementById('stageTitle');
const livesEl = document.getElementById('lives');
const bestRunEl = document.getElementById('bestRun');
const finalScoreEl = document.getElementById('finalScore');
const overlayMessage = document.getElementById('overlayMessage');
const achievementList = document.getElementById('achievementList');
const achievementToast = document.getElementById('achievementToast');
const leaderboardList = document.getElementById('leaderboardList');

const introScreen = document.getElementById('introScreen');
const appShell = document.getElementById('appShell');
const mainMenuModal = document.getElementById('mainMenuModal');
const settingsModal = document.getElementById('settingsModal');
const scoresModal = document.getElementById('scoresModal');
const gameOverModal = document.getElementById('gameOverModal');

const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const closeScoresBtn = document.getElementById('closeScoresBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const goMenuBtn = document.getElementById('goMenuBtn');
const newGameBtn = document.getElementById('newGameBtn');
const resumeBtn = document.getElementById('resumeBtn');
const scoresBtn = document.getElementById('scoresBtn');

const difficultyOptions = document.getElementById('difficultyOptions');
const difficultyOptionsModal = document.getElementById('difficultyOptionsModal');
const themeOptions = document.getElementById('themeOptions');
const themeOptionsModal = document.getElementById('themeOptionsModal');

const gridSize = 24;
const tileCount = canvas.width / gridSize;
const SAVE_KEY = 'snakeLegendsSave';
const SCORE_KEY = 'snakeLegendsScores';
const HIGH_KEY = 'snakeLegendsHighScore';
const THEME_KEY = 'snakeLegendsTheme';
const DIFFICULTY_KEY = 'snakeLegendsDifficulty';
const ACHIEVE_KEY = 'snakeLegendsAchievements';
const BESTRUN_KEY = 'snakeLegendsBestRun';

const difficulties = [
  { id: 'amateur', label: 'Amateur', speed: 190, bonus: 0 },
  { id: 'easy', label: 'Easy', speed: 165, bonus: 0 },
  { id: 'medium', label: 'Medium', speed: 140, bonus: 1 },
  { id: 'difficult', label: 'Difficult', speed: 118, bonus: 1 },
  { id: 'pro', label: 'Pro', speed: 100, bonus: 2 },
  { id: 'legendary', label: 'Legendary', speed: 84, bonus: 3 },
];

const themes = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'summer', label: 'Summer' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
  { id: 'spring', label: 'Spring' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
];

const levelNames = ['Neon Garden', 'Solar Drift', 'Crystal Ice', 'Coral Circuit', 'Volcanic Core', 'Legend Rift'];

const achievements = [
  { id: 'first-bite', name: 'First Bite', description: 'Eat your first fruit.', check: (s) => s.totalFood >= 1 },
  { id: 'score-25', name: 'Rising Serpent', description: 'Reach 25 points.', check: (s) => s.score >= 25 },
  { id: 'score-50', name: 'Snake Elite', description: 'Reach 50 points.', check: (s) => s.score >= 50 },
  { id: 'level-3', name: 'World Hopper', description: 'Reach level 3.', check: (s) => s.level >= 3 },
  { id: 'gem-hunter', name: 'Gem Hunter', description: 'Collect a bonus gem.', check: (s) => s.specialsCollected >= 1 },
  { id: 'power-master', name: 'Power Master', description: 'Use 3 power-ups.', check: (s) => s.powerupsUsed >= 3 },
  { id: 'legend-heart', name: 'Legend Heart', description: 'Finish a run above 80 points.', check: (s) => s.score >= 80 },
];

const audioCtx = window.AudioContext ? new AudioContext() : null;

const state = {
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: { x: 10, y: 10 },
  specialFood: null,
  powerUp: null,
  particles: [],
  obstacles: [],
  score: 0,
  highScore: Number(localStorage.getItem(HIGH_KEY) || 0),
  bestRun: Number(localStorage.getItem(BESTRUN_KEY) || 0),
  loopId: null,
  isRunning: false,
  isPaused: false,
  currentDifficulty: localStorage.getItem(DIFFICULTY_KEY) || 'medium',
  currentTheme: localStorage.getItem(THEME_KEY) || 'dark',
  level: 1,
  totalFood: 0,
  specialsCollected: 0,
  powerupsUsed: 0,
  lives: 1,
  shield: 0,
  magnet: 0,
  doubleScore: 0,
  speedBoost: 0,
  slowMotion: 0,
  tickMs: 140,
  pendingSave: false,
  shake: 0,
  lastTime: 0,
};

function boot() {
  applyTheme(state.currentTheme);
  renderDifficultyChips();
  renderThemeChips();
  renderAchievements();
  renderLeaderboard();
  setTimeout(() => {
    introScreen.classList.remove('active');
    introScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    mainMenuModal.classList.add('active');
    if (hasSavedGame()) updateResumeButtons(true); else updateResumeButtons(false);
    drawIdleBoard();
  }, 3400);
}

function getDifficulty() {
  return difficulties.find((d) => d.id === state.currentDifficulty) || difficulties[2];
}

function getSavedAchievements() {
  try { return JSON.parse(localStorage.getItem(ACHIEVE_KEY) || '[]'); }
  catch { return []; }
}

function saveAchievements(ids) {
  localStorage.setItem(ACHIEVE_KEY, JSON.stringify(ids));
}

function hasSavedGame() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

function renderDifficultyChips() {
  const renderInto = [difficultyOptions, difficultyOptionsModal];
  renderInto.forEach((wrap) => {
    wrap.innerHTML = '';
    difficulties.forEach((difficulty) => {
      const button = document.createElement('button');
      button.className = `chip ${difficulty.id === state.currentDifficulty ? 'active' : ''}`;
      button.textContent = difficulty.label;
      button.addEventListener('click', () => {
        state.currentDifficulty = difficulty.id;
        localStorage.setItem(DIFFICULTY_KEY, difficulty.id);
        difficultyLabelEl.textContent = difficulty.label;
        renderDifficultyChips();
        if (state.isRunning) applyDifficultySpeed();
      });
      wrap.appendChild(button);
    });
  });
  difficultyLabelEl.textContent = getDifficulty().label;
}

function renderThemeChips() {
  const renderInto = [themeOptions, themeOptionsModal];
  renderInto.forEach((wrap) => {
    wrap.innerHTML = '';
    themes.forEach((theme) => {
      const button = document.createElement('button');
      button.className = `chip theme-chip ${theme.id === state.currentTheme ? 'active' : ''}`;
      button.textContent = theme.label;
      button.addEventListener('click', () => {
        applyTheme(theme.id);
        renderThemeChips();
      });
      wrap.appendChild(button);
    });
  });
}

function applyTheme(themeId) {
  state.currentTheme = themeId;
  localStorage.setItem(THEME_KEY, themeId);
  const finalTheme = themeId === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : themeId;
  document.body.setAttribute('data-theme', finalTheme);
}

function renderAchievements() {
  const unlockedIds = new Set(getSavedAchievements());
  achievementList.innerHTML = '';
  achievements.forEach((item) => {
    const div = document.createElement('div');
    div.className = `achievement-item ${unlockedIds.has(item.id) ? '' : 'locked'}`;
    div.innerHTML = `<strong>${unlockedIds.has(item.id) ? '✅' : '🔒'} ${item.name}</strong><br><small>${item.description}</small>`;
    achievementList.appendChild(div);
  });
}

function unlockAchievement(id) {
  const unlockedIds = getSavedAchievements();
  if (unlockedIds.includes(id)) return;
  const achievement = achievements.find((item) => item.id === id);
  if (!achievement) return;
  unlockedIds.push(id);
  saveAchievements(unlockedIds);
  renderAchievements();
  achievementToast.textContent = `Achievement unlocked: ${achievement.name}`;
  achievementToast.classList.remove('hidden');
  playTone(660, 0.08, 'triangle');
  playTone(880, 0.12, 'sine', 0.06);
  clearTimeout(unlockAchievement.toastTimer);
  unlockAchievement.toastTimer = setTimeout(() => achievementToast.classList.add('hidden'), 2800);
}

function checkAchievements() {
  achievements.forEach((item) => {
    if (item.check(state)) unlockAchievement(item.id);
  });
}

function renderLeaderboard() {
  const scores = readScores();
  leaderboardList.innerHTML = '';
  if (!scores.length) {
    leaderboardList.innerHTML = '<div class="leaderboard-item"><span>No scores yet.</span><strong>Play now</strong></div>';
    return;
  }
  scores.slice(0, 8).forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'leaderboard-item';
    div.innerHTML = `<span>#${index + 1} ${entry.name}</span><strong>${entry.score}</strong>`;
    leaderboardList.appendChild(div);
  });
}

function readScores() {
  try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'); }
  catch { return []; }
}

function saveScore(score) {
  const scores = readScores();
  scores.push({ name: 'Player', score, at: Date.now() });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores.slice(0, 15)));
  renderLeaderboard();
}

function applyDifficultySpeed() {
  const difficulty = getDifficulty();
  let levelDrop = Math.min((state.level - 1) * 7, 28);
  state.tickMs = Math.max(60, difficulty.speed - levelDrop);
  if (state.speedBoost > 0) state.tickMs = Math.max(52, state.tickMs - 22);
  if (state.slowMotion > 0) state.tickMs += 20;
  difficultyLabelEl.textContent = difficulty.label;
}

function startNewGame() {
  const difficulty = getDifficulty();
  state.snake = [
    { x: 8, y: 15 },
    { x: 7, y: 15 },
    { x: 6, y: 15 },
    { x: 5, y: 15 },
    { x: 4, y: 15 },
  ];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.score = 0;
  state.level = 1;
  state.totalFood = 0;
  state.specialsCollected = 0;
  state.powerupsUsed = 0;
  state.specialFood = null;
  state.powerUp = null;
  state.particles = [];
  state.obstacles = [];
  state.isRunning = true;
  state.isPaused = false;
  state.lives = difficulty.id === 'legendary' ? 1 : 1;
  state.shield = 0;
  state.magnet = 0;
  state.doubleScore = 0;
  state.speedBoost = 0;
  state.slowMotion = 0;
  state.shake = 0;
  applyDifficultySpeed();
  generateObstacles();
  placeFood();
  queuePowerSpawn();
  updateHud();
  closeAllModals();
  saveGame();
  loop();
}

function resumeSavedGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) return;
    Object.assign(state, saved);
    state.highScore = Number(localStorage.getItem(HIGH_KEY) || state.highScore || 0);
    state.bestRun = Number(localStorage.getItem(BESTRUN_KEY) || state.bestRun || 0);
    state.isPaused = false;
    state.isRunning = true;
    closeAllModals();
    applyDifficultySpeed();
    updateHud();
    loop();
  } catch {
    startNewGame();
  }
}

function saveGame() {
  const snapshot = {
    snake: state.snake,
    direction: state.direction,
    nextDirection: state.nextDirection,
    food: state.food,
    specialFood: state.specialFood,
    powerUp: state.powerUp,
    particles: state.particles.slice(0, 30),
    obstacles: state.obstacles,
    score: state.score,
    highScore: state.highScore,
    bestRun: state.bestRun,
    currentDifficulty: state.currentDifficulty,
    currentTheme: state.currentTheme,
    level: state.level,
    totalFood: state.totalFood,
    specialsCollected: state.specialsCollected,
    powerupsUsed: state.powerupsUsed,
    lives: state.lives,
    shield: state.shield,
    magnet: state.magnet,
    doubleScore: state.doubleScore,
    speedBoost: state.speedBoost,
    slowMotion: state.slowMotion,
    tickMs: state.tickMs,
    shake: state.shake,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  updateResumeButtons(true);
}

function updateResumeButtons(enabled) {
  [resumeBtn, ...document.querySelectorAll('[data-action="resume"]')].forEach((button) => {
    button.disabled = !enabled;
    button.style.opacity = enabled ? '1' : '.5';
  });
}

function clearSavedGame() {
  localStorage.removeItem(SAVE_KEY);
  updateResumeButtons(false);
}

function closeAllModals() {
  [mainMenuModal, settingsModal, scoresModal, gameOverModal].forEach((modal) => {
    modal.classList.remove('active');
    modal.classList.add('hidden');
  });
}

function showModal(modal) {
  closeAllModals();
  modal.classList.remove('hidden');
  modal.classList.add('active');
}

function drawIdleBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGrid();
  drawCenteredText('Snake Legends', 'Press New Game');
}

function drawCenteredText(title, subtitle) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.textAlign = 'center';
  ctx.font = '800 44px Orbitron';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '500 20px Inter';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 24);
  ctx.restore();
}

function loop(now = performance.now()) {
  cancelAnimationFrame(state.loopId);
  state.loopId = requestAnimationFrame(loop);
  if (!state.lastTime) state.lastTime = now;
  const delta = now - state.lastTime;
  if (!state.isRunning || state.isPaused) {
    draw();
    state.lastTime = now;
    return;
  }
  if (delta >= state.tickMs) {
    state.lastTime = now;
    update();
  }
  draw();
}

function update() {
  state.direction = state.nextDirection;
  const head = { x: state.snake[0].x + state.direction.x, y: state.snake[0].y + state.direction.y };

  if (state.magnet > 0) {
    const dx = state.food.x - head.x;
    const dy = state.food.y - head.y;
    if (Math.abs(dx) + Math.abs(dy) <= 2) {
      head.x = state.food.x;
      head.y = state.food.y;
    }
  }

  const crashedIntoWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
  const crashedIntoSelf = state.snake.some((part) => part.x === head.x && part.y === head.y);
  const crashedIntoObstacle = state.obstacles.some((rock) => rock.x === head.x && rock.y === head.y);

  if (crashedIntoWall || crashedIntoSelf || crashedIntoObstacle) {
    if (state.shield > 0) {
      state.shield--;
      createBurst(state.snake[0].x, state.snake[0].y, '#7ef29a', 18);
      playTone(220, 0.08, 'square');
    } else {
      endGame();
      return;
    }
  } else {
    state.snake.unshift(head);
  }

  if (head.x === state.food.x && head.y === state.food.y) {
    state.totalFood += 1;
    const bonus = state.doubleScore > 0 ? 2 : 1;
    state.score += 1 + getDifficulty().bonus + bonus - 1;
    state.shake = 6;
    placeFood();
    createBurst(head.x, head.y, getCssVar('--food'), 14);
    playTone(420, 0.05, 'triangle');
    maybeSpawnSpecial();
    maybeSpawnPowerUp();
  } else if (state.specialFood && head.x === state.specialFood.x && head.y === state.specialFood.y) {
    state.specialsCollected += 1;
    state.score += state.specialFood.points + getDifficulty().bonus;
    createBurst(head.x, head.y, '#62b7ff', 26);
    playTone(520, 0.06, 'sine');
    playTone(760, 0.08, 'triangle', 0.05);
    state.specialFood = null;
  } else if (state.powerUp && head.x === state.powerUp.x && head.y === state.powerUp.y) {
    activatePowerUp(state.powerUp.type);
    state.powerUp = null;
  } else {
    state.snake.pop();
  }

  if (state.specialFood) state.specialFood.life -= 1;
  if (state.specialFood && state.specialFood.life <= 0) state.specialFood = null;
  if (state.powerUp) state.powerUp.life -= 1;
  if (state.powerUp && state.powerUp.life <= 0) state.powerUp = null;

  tickEffects();
  updateLevel();
  trimParticles();
  updateHud();
  checkAchievements();
  saveGame();
}

function tickEffects() {
  ['magnet', 'doubleScore', 'speedBoost', 'slowMotion'].forEach((name) => {
    if (state[name] > 0) state[name] -= 1;
  });
  applyDifficultySpeed();
}

function trimParticles() {
  state.particles = state.particles
    .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1, vy: p.vy * 0.98 }))
    .filter((p) => p.life > 0);
  if (state.shake > 0) state.shake -= 1;
}

function updateLevel() {
  const newLevel = Math.min(6, Math.floor(state.score / 12) + 1);
  if (newLevel !== state.level) {
    state.level = newLevel;
    generateObstacles();
    createBurst(state.snake[0].x, state.snake[0].y, getCssVar('--accent-2'), 32);
    showOverlay(`Level ${state.level}\n${levelNames[state.level - 1]}`);
    playTone(640, 0.06, 'triangle');
    playTone(860, 0.1, 'sine', 0.07);
    applyDifficultySpeed();
  }
}

function placeFood() {
  state.food = randomFreeCell();
}

function maybeSpawnSpecial() {
  if (!state.specialFood && Math.random() < 0.16) {
    state.specialFood = { ...randomFreeCell(), points: 5, life: 34 };
  }
}

function queuePowerSpawn() {
  if (!state.powerUp) maybeSpawnPowerUp();
}

function maybeSpawnPowerUp() {
  if (state.powerUp || Math.random() >= 0.18) return;
  const types = ['shield', 'magnet', 'doubleScore', 'speedBoost', 'slowMotion'];
  const type = types[Math.floor(Math.random() * types.length)];
  state.powerUp = { ...randomFreeCell(), type, life: 38 };
}

function activatePowerUp(type) {
  state.powerupsUsed += 1;
  const messages = {
    shield: 'Shield Ready',
    magnet: 'Magnet Active',
    doubleScore: 'Double Score',
    speedBoost: 'Speed Boost',
    slowMotion: 'Slow Motion',
  };
  if (type === 'shield') state.shield += 1;
  if (type === 'magnet') state.magnet = 18;
  if (type === 'doubleScore') state.doubleScore = 18;
  if (type === 'speedBoost') state.speedBoost = 18;
  if (type === 'slowMotion') state.slowMotion = 18;
  createBurst(state.snake[0].x, state.snake[0].y, getCssVar('--good'), 22);
  showOverlay(messages[type]);
  playTone(500, 0.07, 'square');
  playTone(620, 0.09, 'triangle', 0.05);
}

function randomFreeCell() {
  let cell = null;
  do {
    cell = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  } while (
    state.snake.some((s) => s.x === cell.x && s.y === cell.y) ||
    state.obstacles.some((o) => o.x === cell.x && o.y === cell.y) ||
    (state.specialFood && state.specialFood.x === cell.x && state.specialFood.y === cell.y) ||
    (state.powerUp && state.powerUp.x === cell.x && state.powerUp.y === cell.y)
  );
  return cell;
}

function generateObstacles() {
  state.obstacles = [];
  const obstacleCount = Math.max(0, (state.level - 1) * 3 + (getDifficulty().id === 'legendary' ? 4 : 0));
  for (let i = 0; i < obstacleCount; i++) {
    const rock = randomFreeCell();
    if (Math.abs(rock.x - state.snake[0].x) < 5 && Math.abs(rock.y - state.snake[0].y) < 5) continue;
    state.obstacles.push(rock);
  }
}

function draw() {
  ctx.save();
  if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  drawBackground();
  drawGrid();
  drawObstacles();
  drawFood();
  drawSpecialFood();
  drawPowerUp();
  drawSnake();
  drawParticles();
  drawEffectsStatus();
  ctx.restore();
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, hexToRgba(getCssVar('--bg'), 0.95));
  g.addColorStop(1, hexToRgba(getCssVar('--bg2'), 0.98));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = getCssVar('--grid-glow') || 'rgba(124,92,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i++) {
    const p = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObstacles() {
  state.obstacles.forEach((rock) => {
    const x = rock.x * gridSize;
    const y = rock.y * gridSize;
    const stone = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
    stone.addColorStop(0, 'rgba(255,255,255,0.26)');
    stone.addColorStop(1, 'rgba(60,70,90,0.95)');
    roundRect(x + 2, y + 2, gridSize - 4, gridSize - 4, 8, stone);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(x + 9, y + 9, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFood() {
  const x = state.food.x * gridSize + gridSize / 2;
  const y = state.food.y * gridSize + gridSize / 2;
  ctx.save();
  ctx.fillStyle = getCssVar('--food');
  ctx.beginPath();
  ctx.arc(x, y + 2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7de37c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.quadraticCurveTo(x + 4, y - 14, x + 10, y - 9);
  ctx.stroke();
  ctx.restore();
}

function drawSpecialFood() {
  if (!state.specialFood) return;
  const x = state.specialFood.x * gridSize + gridSize / 2;
  const y = state.specialFood.y * gridSize + gridSize / 2;
  ctx.save();
  ctx.fillStyle = '#6ab8ff';
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * 7, y + Math.sin(angle) * 7, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#c9ecff';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPowerUp() {
  if (!state.powerUp) return;
  const icons = {
    shield: '🛡',
    magnet: '🧲',
    doubleScore: '✦',
    speedBoost: '⚡',
    slowMotion: '❄',
  };
  const x = state.powerUp.x * gridSize + gridSize / 2;
  const y = state.powerUp.y * gridSize + gridSize / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '18px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(icons[state.powerUp.type], x, y + 1);
  ctx.restore();
}

function drawSnake() {
  state.snake.forEach((part, index) => {
    const x = part.x * gridSize;
    const y = part.y * gridSize;
    const isHead = index === 0;
    const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
    gradient.addColorStop(0, isHead ? '#9cffba' : '#51d48b');
    gradient.addColorStop(1, isHead ? '#1b9f57' : '#0f6f3c');
    roundRect(x + 1.5, y + 1.5, gridSize - 3, gridSize - 3, isHead ? 11 : 10, gradient);

    if (isHead) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + 8, y + 9, 3, 0, Math.PI * 2);
      ctx.arc(x + 16, y + 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10251a';
      ctx.beginPath();
      ctx.arc(x + 8, y + 9, 1.2, 0, Math.PI * 2);
      ctx.arc(x + 16, y + 9, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff6b7c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const tongueX = x + 12 + state.direction.x * 7;
      const tongueY = y + 16 + state.direction.y * 7;
      ctx.moveTo(x + 12, y + 12);
      ctx.lineTo(tongueX, tongueY);
      ctx.stroke();
    }
  });
}

function drawParticles() {
  state.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawEffectsStatus() {
  const effects = [];
  if (state.shield > 0) effects.push('Shield');
  if (state.magnet > 0) effects.push('Magnet');
  if (state.doubleScore > 0) effects.push('2x');
  if (state.speedBoost > 0) effects.push('Boost');
  if (state.slowMotion > 0) effects.push('Slow');
  if (!effects.length) return;
  ctx.save();
  ctx.font = '600 18px Inter';
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillText(`Effects: ${effects.join(' • ')}`, 18, 28);
  ctx.restore();
}

function createBurst(tileX, tileY, color, count = 12) {
  const originX = tileX * gridSize + gridSize / 2;
  const originY = tileY * gridSize + gridSize / 2;
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 4.8,
      vy: (Math.random() - 0.5) * 4.8,
      life: 18 + Math.random() * 12,
      maxLife: 28,
      radius: 2 + Math.random() * 4,
      color,
    });
  }
}

function showOverlay(text) {
  overlayMessage.innerHTML = text.replace(/\n/g, '<br>');
  overlayMessage.classList.remove('hidden');
  clearTimeout(showOverlay.timer);
  showOverlay.timer = setTimeout(() => overlayMessage.classList.add('hidden'), 1400);
}

function updateHud() {
  state.highScore = Math.max(state.highScore, state.score);
  localStorage.setItem(HIGH_KEY, String(state.highScore));
  state.bestRun = Math.max(state.bestRun, state.score);
  localStorage.setItem(BESTRUN_KEY, String(state.bestRun));
  scoreEl.textContent = state.score;
  highscoreEl.textContent = state.highScore;
  currentLevelEl.textContent = state.level;
  difficultyLabelEl.textContent = getDifficulty().label;
  stageTitleEl.textContent = `Level ${state.level} · ${levelNames[state.level - 1]}`;
  livesEl.textContent = state.lives;
  bestRunEl.textContent = state.bestRun;
}

function endGame() {
  state.isRunning = false;
  state.isPaused = false;
  finalScoreEl.textContent = state.score;
  createBurst(state.snake[0].x, state.snake[0].y, getCssVar('--danger'), 30);
  playTone(260, 0.15, 'sawtooth');
  playTone(180, 0.22, 'square', 0.08);
  saveScore(state.score);
  clearSavedGame();
  showModal(gameOverModal);
}

function togglePause() {
  if (!state.isRunning) return;
  state.isPaused = !state.isPaused;
  pauseBtn.textContent = state.isPaused ? '▶' : '⏸';
  if (state.isPaused) showOverlay('Paused');
}

function backToMenu() {
  state.isRunning = false;
  state.isPaused = false;
  pauseBtn.textContent = '⏸';
  saveGame();
  showModal(mainMenuModal);
  drawIdleBoard();
}

function openScores() {
  renderLeaderboard();
  showModal(scoresModal);
}

function roundRect(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function getCssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function hexToRgba(value, alpha) {
  if (value.startsWith('rgba') || value.startsWith('rgb')) return value;
  const hex = value.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function playTone(freq, duration = 0.06, type = 'sine', delay = 0) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

window.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };
  if (e.key === ' ' || e.key.toLowerCase() === 'p') {
    e.preventDefault();
    togglePause();
    return;
  }
  const next = keyMap[e.key] || keyMap[e.key.toLowerCase?.()];
  if (!next) return;
  if (next.x === -state.direction.x && next.y === -state.direction.y) return;
  state.nextDirection = next;
});

let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    state.nextDirection = dx > 0 && state.direction.x !== -1 ? { x: 1, y: 0 } : dx < 0 && state.direction.x !== 1 ? { x: -1, y: 0 } : state.nextDirection;
  } else {
    state.nextDirection = dy > 0 && state.direction.y !== -1 ? { x: 0, y: 1 } : dy < 0 && state.direction.y !== 1 ? { x: 0, y: -1 } : state.nextDirection;
  }
  touchStart = null;
}, { passive: true });

document.querySelectorAll('#touchControls button').forEach((button) => {
  button.addEventListener('click', () => {
    const dir = button.dataset.dir;
    const maps = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const next = maps[dir];
    if (next.x === -state.direction.x && next.y === -state.direction.y) return;
    state.nextDirection = next;
  });
});

document.querySelectorAll('[data-action="new"]').forEach((btn) => btn.addEventListener('click', startNewGame));
document.querySelectorAll('[data-action="resume"]').forEach((btn) => btn.addEventListener('click', () => hasSavedGame() ? resumeSavedGame() : null));
document.querySelectorAll('[data-action="scores"]').forEach((btn) => btn.addEventListener('click', openScores));
newGameBtn.addEventListener('click', startNewGame);
resumeBtn.addEventListener('click', () => hasSavedGame() && resumeSavedGame());
scoresBtn.addEventListener('click', openScores);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', startNewGame);
homeBtn.addEventListener('click', backToMenu);
settingsBtn.addEventListener('click', () => showModal(settingsModal));
closeSettingsBtn.addEventListener('click', () => showModal(mainMenuModal));
closeScoresBtn.addEventListener('click', () => showModal(mainMenuModal));
playAgainBtn.addEventListener('click', startNewGame);
goMenuBtn.addEventListener('click', () => showModal(mainMenuModal));

window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => {
  if (state.currentTheme === 'system') applyTheme('system');
});

boot();
