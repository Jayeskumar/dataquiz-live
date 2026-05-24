// =====================================================
//   Host view logic
// =====================================================

const socket = io();
let selectedQuizId = null;
let selectedQuizMaxQ = 10;
let roomCode = null;
let timerInterval = null;
let timerSeconds = 20;
let currentQuestion = null;
let playersById = new Map();

// =====================================================
//   Initialize: load available quizzes
// =====================================================
async function loadQuizzes() {
  try {
    const res = await fetch('/api/quizzes');
    const data = await res.json();
    const grid = document.getElementById('moduleGrid');
    grid.innerHTML = '';

    if (!data.quizzes || data.quizzes.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 3em; margin-bottom: 12px;">📋</div>
          <p>No quizzes available. Click <strong>Create New Quiz</strong> below.</p>
        </div>`;
      return;
    }

    data.quizzes.forEach((quiz, idx) => {
      const tile = document.createElement('div');
      tile.className = 'module-pick';
      if (idx === 0) tile.classList.add('selected');
      tile.dataset.id = quiz.id;
      tile.style.background = quiz.color || 'var(--surface)';
      tile.innerHTML = `
        <div class="mod-emoji">${quiz.emoji || '📝'}</div>
        <div class="mod-name">${escapeHTML(quiz.title)}</div>
        <div class="mod-count">${quiz.questionCount} Q ${quiz.isTemplate ? '· Template' : '· Custom'}</div>
        ${!quiz.isTemplate ? `<button class="quiz-del" onclick="event.stopPropagation(); deleteQuiz('${quiz.id}', '${escapeAttr(quiz.title)}')" title="Delete">×</button>` : ''}
      `;
      tile.onclick = () => selectQuiz(quiz.id, quiz.questionCount, tile);
      grid.appendChild(tile);

      // Auto-select the first quiz
      if (idx === 0) {
        selectedQuizId = quiz.id;
        selectedQuizMaxQ = quiz.questionCount;
        updateCountOptions(quiz.questionCount);
      }
    });
  } catch (e) {
    console.error('Failed to load quizzes', e);
  }
}

function selectQuiz(id, maxQ, el) {
  selectedQuizId = id;
  selectedQuizMaxQ = maxQ;
  document.querySelectorAll('.module-pick').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  updateCountOptions(maxQ);
}

function updateCountOptions(max) {
  const sel = document.getElementById('settingCount');
  if (!sel) return;
  const current = parseInt(sel.value) || 10;
  sel.innerHTML = '';
  const choices = [5, 10, 15, 20, 30].filter(n => n <= max);
  if (choices.length === 0) choices.push(max);
  choices.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = `${n} questions (~${Math.round(n * 0.6)} min)`;
    if (n === current || (current > max && n === choices[choices.length - 1])) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function deleteQuiz(id, title) {
  if (!confirm(`Delete quiz "${title}"? This cannot be undone.`)) return;
  try {
    const res = await fetch('/api/quizzes/' + encodeURIComponent(id), { method: 'DELETE' });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return showToast(e.error || 'Failed to delete', 'error');
    }
    showToast('✓ Quiz deleted', 'success');
    await loadQuizzes();
  } catch (e) { showToast('Network error', 'error'); }
}

// =====================================================
//   Create Room
// =====================================================
function createRoom() {
  if (!selectedQuizId) return showToast('Please pick a quiz first', 'error');
  const count = parseInt(document.getElementById('settingCount').value);
  const timer = parseInt(document.getElementById('settingTimer').value);
  timerSeconds = timer;

  socket.emit('host:create',
    { quizId: selectedQuizId, count, timer },
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

function escapeAttr(s) { return String(s).replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

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
  // Show the title card overlay for ~3 seconds before the first question
  const card = document.getElementById('titleCard');
  if (card) {
    card.style.display = 'flex';
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    setTimeout(() => { card.style.display = 'none'; }, 3000);
  }
  setTimeout(() => socket.emit('host:start'), 600);
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
let prevPlayerIds = new Set();
socket.on('room:players', (players) => {
  playersById = new Map(players.map(p => [p.id, p]));
  const list = document.getElementById('playersList');
  const empty = document.getElementById('emptyPlayers');
  document.getElementById('playerCount').textContent = players.length;

  if (players.length === 0) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'block';
    document.getElementById('startBtn').disabled = true;
    prevPlayerIds.clear();
    return;
  }
  list.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  document.getElementById('startBtn').disabled = false;

  const currentIds = new Set(players.map(p => p.id));
  const newJoins = players.filter(p => !prevPlayerIds.has(p.id));

  list.innerHTML = players.map(p => {
    const isNew = !prevPlayerIds.has(p.id);
    return `
      <div class="player-chip ${isNew ? 'new-join' : ''}">
        <div class="avatar">${escapeHTML(p.name[0].toUpperCase())}</div>
        <div>${escapeHTML(p.name)}</div>
      </div>
    `;
  }).join('');

  // Sound on new joiners (but not initial render)
  if (newJoins.length > 0 && prevPlayerIds.size > 0) {
    playSound('chime');
  } else if (newJoins.length > 0 && prevPlayerIds.size === 0) {
    // First player joins — soft chime
    playSound('chime');
  }
  prevPlayerIds = currentIds;
});

socket.on('room:question', (q) => {
  currentQuestion = q;
  playSound('whoosh');
  showScreen('screenQuestion');

  document.getElementById('qModule').textContent = q.quizTitle;
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
  playSound('drumroll');
  setTimeout(() => playSound('reveal'), 800);
  showScreen('screenReveal');

  const q = currentQuestion;
  document.getElementById('rModule').textContent = q.quizTitle;
  document.getElementById('rProgress').textContent = `${q.index + 1} / ${q.total}`;
  document.getElementById('rText').textContent = q.q;
  document.getElementById('rExplanation').textContent = data.explanation;

  // Vote bars with mass entry
  const maxVotes = Math.max(1, ...data.votes);
  const shapes = ['▲', '◆', '●', '■'];
  document.getElementById('rVoteBars').innerHTML = q.options.map((opt, i) => {
    const votes = data.votes[i] || 0;
    const pct = Math.round((votes / maxVotes) * 100);
    const correctClass = i === data.correct ? 'correct glow-pulse' : '';
    return `
      <div class="vote-bar-row c-${i} ${correctClass} hero-entry" style="animation-delay: ${i * 0.1}s;">
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

  // Celebrate based on how the class did
  const correctCount = data.perPlayer.filter(p => p.isCorrect).length;
  const total = data.perPlayer.length;
  if (total > 0) {
    const correctPct = correctCount / total;
    if (correctPct >= 0.8) {
      // Class crushed it
      rosePetalConfetti(50);
      showHostToast('🔥 SIX! Class smashed this one!', 'success');
    } else if (correctPct >= 0.5) {
      confetti(40);
      showHostToast('💪 Solid batting!', 'success');
    } else if (correctPct === 0) {
      showHostToast('🏏 All bowled out — tough question!', 'error');
    }
  }
});

function showHostToast(msg, type) {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.style.fontFamily = "'Impact', sans-serif";
  t.style.letterSpacing = '2px';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

socket.on('room:end', (data) => {
  stopTimer();
  showScreen('screenFinal');

  const lb = data.leaderboard;
  const podiumEl = document.getElementById('podium');
  const podiumOrder = []; // visual order: 2nd, 1st, 3rd
  if (lb[1]) podiumOrder.push({ p: lb[1], cls: 'second hero-entry', block: 'silver', n: 2, crown: '🥈', label: 'Vice Champion' });
  if (lb[0]) podiumOrder.push({ p: lb[0], cls: 'first  hero-entry', block: 'gold',   n: 1, crown: '👑', label: 'CHAMPION 🏏' });
  if (lb[2]) podiumOrder.push({ p: lb[2], cls: 'third  hero-entry', block: 'bronze', n: 3, crown: '🥉', label: 'Top 3' });

  podiumEl.innerHTML = podiumOrder.map(s => `
    <div class="podium-spot ${s.cls}">
      <div class="crown">${s.crown}</div>
      <div class="ply-name">${escapeHTML(s.p.name)}</div>
      <div style="font-size: 0.85em; color: var(--mass-gold); font-style: italic; margin-bottom: 4px;">${s.label}</div>
      <div class="ply-score">${s.p.score}</div>
      <div class="podium-block ${s.block} ${s.n === 1 ? 'glow-pulse' : ''}">${s.n}</div>
    </div>
  `).join('');

  renderLeaderboard('finalLeaderboard', lb.slice(3));

  // Massive celebration
  playSound('fanfare');
  setTimeout(() => playSound('applause'), 800);
  bigConfetti();
  rosePetalConfetti(150);
  setTimeout(() => rosePetalConfetti(100), 1000);
  setTimeout(() => bigConfetti(), 1800);
  document.body.classList.add('screen-shake', 'boss-flash');
  setTimeout(() => document.body.classList.remove('screen-shake', 'boss-flash'), 1500);
});

// Rose petal confetti
function rosePetalConfetti(n) {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#dc2626', '#b91c1c', '#991b1b', '#7c2d12', '#ef4444'];
  const ps = [];
  for (let i = 0; i < (n || 60); i++) {
    ps.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1.5,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rs: (Math.random() - 0.5) * 6,
      sway: Math.random() * 2 + 1,
      swayPhase: Math.random() * Math.PI * 2,
      life: 320
    });
  }
  function drawPetal(ctx, x, y, size, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot * Math.PI / 180);
    const grad = ctx.createLinearGradient(0, -size, 0, size);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ps.forEach((p, i) => {
      p.x += p.vx + Math.sin(p.swayPhase) * p.sway;
      p.y += p.vy;
      p.swayPhase += 0.05;
      p.rot += p.rs;
      p.life--;
      drawPetal(ctx, p.x, p.y, p.size, p.rot, p.color);
      if (p.life <= 0 || p.y > canvas.height + 20) ps.splice(i, 1);
    });
    if (ps.length > 0) requestAnimationFrame(step);
  }
  step();
}

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
  el.className = (el.className || '').replace(/\bstagger-in\b/g, '').trim() + ' stagger-in';
  // Re-trigger stagger animation
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
  const timerRing = ring.closest('.timer-ring');
  let remaining = duration;
  text.textContent = remaining;
  ring.style.strokeDashoffset = '0';
  ring.style.transition = 'none';
  ring.classList.remove('warning', 'danger');
  timerRing && timerRing.classList.remove('last-five');

  // Force reflow then begin animation
  void ring.getBoundingClientRect();
  ring.style.transition = `stroke-dashoffset ${duration}s linear, stroke 0.3s`;
  ring.style.strokeDashoffset = '283';

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    text.textContent = Math.max(0, remaining);
    if (remaining <= 5 && remaining > 0) {
      ring.classList.add('danger');
      timerRing && timerRing.classList.add('last-five');
      playSound('tickLow');
    } else if (remaining <= 10) {
      ring.classList.add('warning');
    }
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

// =====================================================
//   Sound (Web Audio API — no files needed)
// =====================================================
let audioCtx;
function _ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function _tone(freq, dur, opts = {}) {
  const ctx = _ctx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = opts.wave || 'sine';
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, ctx.currentTime + dur);
  g.gain.setValueAtTime(opts.gain || 0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.start(); o.stop(ctx.currentTime + dur);
}
function _noise(dur, opts = {}) {
  const ctx = _ctx();
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buffer;
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType || 'bandpass';
  filter.frequency.value = opts.freq || 1000;
  filter.Q.value = opts.Q || 1;
  src.connect(filter); filter.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(opts.gain || 0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.start(); src.stop(ctx.currentTime + dur);
}
function playSound(type) {
  try {
    if (type === 'chime') {
      _tone(1568, 0.4, { gain: 0.1 });
      setTimeout(() => _tone(2093, 0.3, { gain: 0.06 }), 60);
    } else if (type === 'whoosh') {
      _noise(0.4, { filterType: 'lowpass', freq: 600, gain: 0.08 });
    } else if (type === 'drumroll') {
      for (let i = 0; i < 18; i++) {
        setTimeout(() => _tone(70, 0.04, { wave: 'sawtooth', gain: 0.15 }), i * 60);
      }
    } else if (type === 'reveal') {
      _tone(523, 0.15, { gain: 0.12 });
      setTimeout(() => _tone(659, 0.15, { gain: 0.12 }), 100);
      setTimeout(() => _tone(784, 0.3, { gain: 0.15 }), 200);
    } else if (type === 'applause') {
      _noise(1.5, { filterType: 'bandpass', freq: 1500, Q: 0.5, gain: 0.1 });
      setTimeout(() => _noise(1.0, { filterType: 'bandpass', freq: 2500, gain: 0.08 }), 300);
    } else if (type === 'fanfare') {
      // Final winning fanfare
      const seq = [392, 523, 659, 784, 988, 1047];
      seq.forEach((f, i) => setTimeout(() => _tone(f, 0.4, { wave: 'triangle', gain: 0.15 }), i * 120));
      setTimeout(() => _noise(1.2, { filterType: 'highpass', freq: 4000, gain: 0.06 }), seq.length * 120);
    } else if (type === 'tick') {
      _tone(1400, 0.05, { wave: 'square', gain: 0.06 });
    } else if (type === 'tickLow') {
      _tone(800, 0.04, { wave: 'square', gain: 0.04 });
    }
  } catch (e) {}
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
loadQuizzes();
