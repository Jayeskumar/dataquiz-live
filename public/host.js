// =====================================================
//   Host view logic
// =====================================================

const socket = io();
let selectedModule = 'all';
let roomCode = null;
let timerInterval = null;
let timerSeconds = 20;
let currentQuestion = null;
let playersById = new Map();

// =====================================================
//   Initialize: load modules
// =====================================================
async function loadModules() {
  try {
    const res = await fetch('/api/modules');
    const data = await res.json();
    const grid = document.getElementById('moduleGrid');

    // "All" tile first
    const totalCount = Object.values(data.counts).reduce((a, b) => a + b, 0);
    grid.innerHTML = '';
    const allTile = document.createElement('div');
    allTile.className = 'module-pick selected';
    allTile.dataset.key = 'all';
    allTile.innerHTML = `
      <div class="mod-emoji">🎲</div>
      <div class="mod-name">Mix of All</div>
      <div class="mod-count">${totalCount} Q</div>
    `;
    allTile.onclick = () => selectModule('all', allTile);
    grid.appendChild(allTile);

    Object.entries(data.modules).forEach(([key, mod]) => {
      const tile = document.createElement('div');
      tile.className = 'module-pick';
      tile.dataset.key = key;
      tile.innerHTML = `
        <div class="mod-emoji">${mod.emoji}</div>
        <div class="mod-name">${mod.name}</div>
        <div class="mod-count">${data.counts[key]} Q</div>
      `;
      tile.onclick = () => selectModule(key, tile);
      grid.appendChild(tile);
    });
  } catch (e) {
    console.error('Failed to load modules', e);
  }
}

function selectModule(key, el) {
  selectedModule = key;
  document.querySelectorAll('.module-pick').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
}

// =====================================================
//   Create Room
// =====================================================
function createRoom() {
  const count = parseInt(document.getElementById('settingCount').value);
  const timer = parseInt(document.getElementById('settingTimer').value);
  timerSeconds = timer;

  socket.emit('host:create',
    { moduleKey: selectedModule, count, timer },
    (resp) => {
      if (!resp || !resp.ok) {
        showToast(resp?.error || 'Failed to create room', 'error');
        return;
      }
      roomCode = resp.code;
      showLobby();
    }
  );
}

function showLobby() {
  showScreen('screenLobby');
  document.getElementById('lobbyCode').textContent = roomCode;

  // Show join URL
  const origin = window.location.origin;
  document.getElementById('joinUrlText').textContent = origin.replace(/^https?:\/\//, '');

  // QR code
  const qrUrl = `${origin}/?code=${encodeURIComponent(roomCode)}`;
  const qrEl = document.getElementById('qrcode');
  qrEl.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrEl, {
      text: qrUrl,
      width: 160,
      height: 160,
      colorDark: '#1a0f3a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
}

// =====================================================
//   Game flow
// =====================================================
function startGame() {
  socket.emit('host:start');
}

function nextQuestion() {
  socket.emit('host:next');
}

function forceReveal() {
  socket.emit('host:reveal');
}

function endGame() {
  if (confirm('End the game now?')) socket.emit('host:end');
}

// =====================================================
//   Screen switcher
// =====================================================
function showScreen(id) {
  document.querySelectorAll('.screen-section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// =====================================================
//   Socket listeners
// =====================================================
socket.on('room:players', (players) => {
  playersById = new Map(players.map(p => [p.id, p]));
  const list = document.getElementById('playersList');
  const empty = document.getElementById('emptyPlayers');
  document.getElementById('playerCount').textContent = players.length;

  if (players.length === 0) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'block';
    document.getElementById('startBtn').disabled = true;
    return;
  }
  list.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  document.getElementById('startBtn').disabled = false;

  list.innerHTML = players.map(p => `
    <div class="player-chip">
      <div class="avatar">${escapeHTML(p.name[0].toUpperCase())}</div>
      <div>${escapeHTML(p.name)}</div>
    </div>
  `).join('');
});

socket.on('room:question', (q) => {
  currentQuestion = q;
  showScreen('screenQuestion');

  document.getElementById('qModule').textContent = q.moduleName;
  const diff = document.getElementById('qDifficulty');
  diff.textContent = q.difficulty.toUpperCase();
  diff.className = 'tag difficulty ' + q.difficulty;
  document.getElementById('qProgress').textContent = `${q.index + 1} / ${q.total}`;
  document.getElementById('qText').textContent = q.q;

  const codeEl = document.getElementById('qCode');
  if (q.code) {
    codeEl.textContent = q.code;
    codeEl.style.display = 'block';
  } else {
    codeEl.style.display = 'none';
  }

  // Answer buttons (host view, color-coded, no interaction)
  const answersEl = document.getElementById('qAnswers');
  const shapes = ['▲', '◆', '●', '■', '★', '♥'];
  answersEl.innerHTML = q.options.map((opt, i) => `
    <div class="answer-btn color-${i}">
      <div class="shape">${shapes[i] || '◯'}</div>
      <div>${escapeHTML(opt)}</div>
    </div>
  `).join('');

  // Reset answer count
  document.getElementById('answeredCount').textContent = '0';
  document.getElementById('answeredTotal').textContent = playersById.size;

  // Start timer animation
  startTimer(q.duration);
});

socket.on('host:playerAnswered', ({ answeredCount, totalPlayers }) => {
  document.getElementById('answeredCount').textContent = answeredCount;
  document.getElementById('answeredTotal').textContent = totalPlayers;
});

socket.on('room:reveal', (data) => {
  stopTimer();
  showScreen('screenReveal');

  const q = currentQuestion;
  document.getElementById('rModule').textContent = q.moduleName;
  document.getElementById('rProgress').textContent = `${q.index + 1} / ${q.total}`;
  document.getElementById('rText').textContent = q.q;
  document.getElementById('rExplanation').textContent = data.explanation;

  // Vote bars
  const maxVotes = Math.max(1, ...data.votes);
  const shapes = ['▲', '◆', '●', '■'];
  document.getElementById('rVoteBars').innerHTML = q.options.map((opt, i) => {
    const votes = data.votes[i] || 0;
    const pct = Math.round((votes / maxVotes) * 100);
    const correctClass = i === data.correct ? 'correct' : '';
    return `
      <div class="vote-bar-row c-${i} ${correctClass}">
        <div class="vote-bar-fill" style="width: ${pct}%;"></div>
        <div class="vote-bar-content">
          <span style="font-size: 1.3em;">${shapes[i] || '◯'}</span>
          <span class="opt-text">${escapeHTML(opt)}</span>
          <span class="vote-num">${votes}</span>
        </div>
      </div>
    `;
  }).join('');

  // Leaderboard
  renderLeaderboard('revealLeaderboard', data.leaderboard);

  if (data.leaderboard.length > 0 && data.perPlayer.some(p => p.isCorrect)) {
    confetti(40);
  }
});

socket.on('room:end', (data) => {
  stopTimer();
  showScreen('screenFinal');

  const lb = data.leaderboard;
  // Build podium for top 3
  const podiumEl = document.getElementById('podium');
  const podiumOrder = []; // [silver(2), gold(1), bronze(3)]
  if (lb[1]) podiumOrder.push({ p: lb[1], cls: 'second',  block: 'silver', n: 2, crown: '🥈' });
  if (lb[0]) podiumOrder.push({ p: lb[0], cls: 'first',   block: 'gold',   n: 1, crown: '👑' });
  if (lb[2]) podiumOrder.push({ p: lb[2], cls: 'third',   block: 'bronze', n: 3, crown: '🥉' });
  podiumEl.innerHTML = podiumOrder.map(s => `
    <div class="podium-spot ${s.cls}">
      <div class="crown">${s.crown}</div>
      <div class="ply-name">${escapeHTML(s.p.name)}</div>
      <div class="ply-score">${s.p.score}</div>
      <div class="podium-block ${s.block}">${s.n}</div>
    </div>
  `).join('');

  renderLeaderboard('finalLeaderboard', lb.slice(3));

  bigConfetti();
});

socket.on('host:error', ({ msg }) => {
  showToast(msg, 'error');
});

socket.on('connect_error', () => showToast('Connection lost', 'error'));

// =====================================================
//   Leaderboard render
// =====================================================
function renderLeaderboard(containerId, entries) {
  const el = document.getElementById(containerId);
  if (!entries || entries.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = entries.map(e => `
    <div class="leaderboard-row rank-${e.rank}">
      <div class="rank">#${e.rank}</div>
      <div class="name">${escapeHTML(e.name)}</div>
      <div class="last-points ${e.lastPoints > 0 ? 'positive' : ''}">
        ${e.lastPoints !== undefined ? (e.lastPoints > 0 ? '+' + e.lastPoints : '—') : ''}
      </div>
      <div class="total-score">${e.score}</div>
    </div>
  `).join('');
}

// =====================================================
//   Timer
// =====================================================
function startTimer(duration) {
  const ring = document.getElementById('ringFg');
  const text = document.getElementById('ringText');
  let remaining = duration;
  text.textContent = remaining;
  ring.style.strokeDashoffset = '0';
  ring.style.transition = 'none';
  ring.classList.remove('warning', 'danger');

  // Force reflow then begin animation
  void ring.getBoundingClientRect();
  ring.style.transition = `stroke-dashoffset ${duration}s linear, stroke 0.3s`;
  ring.style.strokeDashoffset = '283';

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    text.textContent = Math.max(0, remaining);
    if (remaining <= 5) ring.classList.add('danger');
    else if (remaining <= 10) ring.classList.add('warning');
    if (remaining <= 0) clearInterval(timerInterval);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

// =====================================================
//   Helpers
// =====================================================
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}

function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Confetti
function confetti(n) {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const ps = [];
  for (let i = 0; i < (n || 50); i++) {
    ps.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 4 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rs: (Math.random() - 0.5) * 10,
      life: 200
    });
  }
  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ps.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.rot += p.rs;
      p.life--;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      if (p.life <= 0 || p.y > canvas.height) ps.splice(i, 1);
    });
    if (ps.length > 0) requestAnimationFrame(step);
  }
  step();
}
function bigConfetti() {
  for (let i = 0; i < 4; i++) setTimeout(() => confetti(80), i * 400);
}

// Particles bg
(function initParticles() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const s = Math.random() * 60 + 20;
    p.style.width = s + 'px';
    p.style.height = s + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 15 + 's';
    c.appendChild(p);
  }
})();

// Boot
loadModules();
