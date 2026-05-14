// =====================================================
//   Player view logic
// =====================================================

const socket = io();
let myName = '';
let myScore = 0;
let currentQuestion = null;
let myAnswer = null;
let timerInterval = null;

// Pre-fill from sessionStorage (if came via landing page)
const savedCode = sessionStorage.getItem('dq_code');
const savedName = sessionStorage.getItem('dq_name');
if (savedCode) document.getElementById('codeInput').value = savedCode;
if (savedName) document.getElementById('nameInput').value = savedName;

// Auto-join if both prefilled
if (savedCode && savedName) {
  setTimeout(() => join(), 200);
}

// =====================================================
//   Screens
// =====================================================
function showScreen(id) {
  document.querySelectorAll('.screen-section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// =====================================================
//   Join
// =====================================================
function join() {
  const code = document.getElementById('codeInput').value.trim().toUpperCase();
  const name = document.getElementById('nameInput').value.trim();
  if (!code) return showToast('Enter the game code', 'error');
  if (!name) return showToast('Enter your name', 'error');

  socket.emit('player:join', { code, name }, (resp) => {
    if (!resp || !resp.ok) {
      showToast(resp?.error || 'Failed to join', 'error');
      return;
    }
    myName = name;
    sessionStorage.setItem('dq_code', code);
    sessionStorage.setItem('dq_name', name);
    document.getElementById('welcomeName').textContent = name;
    document.getElementById('waitingCode').textContent = code;
    document.getElementById('topbarName').textContent = name;
    document.getElementById('topbar').style.display = 'block';
    playSound('chime');
    showScreen('screenWaiting');
  });
}

// =====================================================
//   Submit answer
// =====================================================
function submitAnswer(idx) {
  if (myAnswer !== null) return;
  myAnswer = idx;
  const opt = currentQuestion.options[idx];

  // Visually lock the picked button
  const buttons = document.querySelectorAll('#pAnswers .answer-btn');
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i !== idx) b.classList.add('dimmed');
  });

  socket.emit('player:answer', { answer: idx });

  // Show waiting screen
  setTimeout(() => {
    document.getElementById('yourAnswer').textContent = opt;
    showScreen('screenAnswered');
  }, 400);
}

// =====================================================
//   Sockets
// =====================================================
socket.on('room:question', (q) => {
  currentQuestion = q;
  myAnswer = null;
  playSound('whoosh');
  document.getElementById('aProgress').textContent = `${q.index + 1} / ${q.total}`;

  // Render answer buttons (only — text is on the projector)
  const shapes = ['▲', '◆', '●', '■', '★', '♥'];
  const answers = document.getElementById('pAnswers');
  answers.innerHTML = q.options.map((_, i) => `
    <button class="answer-btn color-${i}" onclick="submitAnswer(${i})">
      <div class="shape">${shapes[i] || '◯'}</div>
      <div style="flex:1; font-size: 1.1em;">${shapes[i] || '◯'}</div>
    </button>
  `).join('');

  startTimer(q.duration);
  showScreen('screenAnswer');
});

let myStreak = 0;

socket.on('player:result', (res) => {
  stopTimer();
  myScore = res.score;
  document.getElementById('topbarScore').textContent = myScore;
  document.getElementById('totalScore').textContent = myScore;

  const verdict = document.getElementById('resultVerdict');
  const emoji = document.getElementById('resultEmoji');
  const pts = document.getElementById('pointsEarned');
  const reactionCard = document.getElementById('reactionCard');
  const reactionEmoji = document.getElementById('reactionEmoji');
  const reactionText = document.getElementById('reactionText');

  // Reset animation classes by re-applying
  [emoji, verdict, pts].forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });

  if (res.isCorrect) {
    myStreak++;
    verdict.textContent = 'Correct! ✓';
    verdict.className = 'verdict correct punch-dialogue';
    pts.textContent = '+' + res.lastPoints;
    pts.className = 'points-earned positive mass-entry';

    // South Indian reaction
    const reaction = window.SI_MEMES.pickCorrect();
    emoji.textContent = reaction.emoji;
    emoji.className = 'big-emoji punch-dialogue';
    reactionEmoji.textContent = reaction.emoji;
    reactionText.textContent = reaction.text;
    reactionCard.className = `reaction-card cls-${reaction.cls} mass-entry`;
    reactionCard.style.display = 'block';

    // Streak combo banner
    const combo = window.SI_MEMES.pickCombo(myStreak);
    if (combo) showComboBanner(combo);

    // Effects
    rosePetalConfetti(60);
    document.body.classList.add('bullet-time');
    setTimeout(() => document.body.classList.remove('bullet-time'), 1200);
    playSound('correct');
  } else {
    myStreak = 0;
    verdict.textContent = 'Not this time';
    verdict.className = 'verdict wrong punch-dialogue';

    const reaction = window.SI_MEMES.pickWrong();
    emoji.textContent = reaction.emoji;
    emoji.className = 'big-emoji punch-dialogue';
    reactionEmoji.textContent = reaction.emoji;
    reactionText.textContent = reaction.text;
    reactionCard.className = `reaction-card cls-${reaction.cls} mass-entry`;
    reactionCard.style.display = 'block';

    if (myAnswer === null) {
      pts.textContent = 'Too slow!';
    } else {
      pts.textContent = '0 points';
    }
    pts.className = 'points-earned';
    playSound('wrong');
    document.body.classList.add('vibrate');
    setTimeout(() => document.body.classList.remove('vibrate'), 450);
  }
  showScreen('screenResult');
});

function showComboBanner(combo) {
  const existing = document.querySelector('.combo-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = 'combo-banner';
  banner.textContent = combo.text;
  banner.style.background = `linear-gradient(135deg, ${combo.color}, var(--mass-gold))`;
  document.body.appendChild(banner);
  playSound('combo');
  setTimeout(() => banner.remove(), 2200);
}

socket.on('room:end', (data) => {
  const me = data.leaderboard.find(p => p.name === myName);
  const rank = me?.rank ?? '—';
  const score = me?.score ?? myScore;
  const totalPlayers = data.leaderboard.length || 1;
  const pct = Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100);

  document.getElementById('finalRank').textContent = '#' + rank;
  document.getElementById('finalScore').textContent = score;

  // Score-based south indian meme
  const scoreMeme = window.SI_MEMES.pickScore(pct);
  document.getElementById('finalTitle').textContent = scoreMeme.title;
  document.getElementById('finalTagline').textContent = scoreMeme.tagline;
  document.getElementById('finalMemeImg').innerHTML = window.SI_MEMES.SVG[scoreMeme.meme] || '';

  // Effects based on rank
  if (rank === 1) {
    bigConfetti();
    rosePetalConfetti(120);
    playSound('win');
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 600);
  } else if (rank === 2) {
    confetti(80);
    rosePetalConfetti(60);
  } else if (rank === 3) {
    confetti(40);
  }

  showScreen('screenFinal');
});

socket.on('room:closed', () => {
  showToast('The host left — game ended', 'error');
  setTimeout(() => window.location.href = '/', 2500);
});

socket.on('room:kicked', () => {
  showScreen('screenKicked');
});

socket.on('connect_error', () => showToast('Connection lost', 'error'));

// Enter key in input
document.getElementById('nameInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') join();
});

// =====================================================
//   Timer
// =====================================================
function startTimer(duration) {
  const ring = document.getElementById('pRingFg');
  const text = document.getElementById('pRingText');
  const timerRing = ring.closest('.timer-ring');
  let remaining = duration;
  text.textContent = remaining;
  ring.style.strokeDashoffset = '0';
  ring.style.transition = 'none';
  ring.classList.remove('warning', 'danger');
  timerRing && timerRing.classList.remove('last-five');
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
      if (myAnswer === null) playSound('tick');
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
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

let audioCtx;
function _ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Generic tone helper
function _tone(freq, dur, opts = {}) {
  const ctx = _ctx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  if (opts.filter) {
    const bp = ctx.createBiquadFilter();
    bp.type = opts.filter;
    bp.frequency.value = freq;
    g.connect(bp);
    bp.connect(ctx.destination);
  } else {
    g.connect(ctx.destination);
  }
  o.type = opts.wave || 'sine';
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, ctx.currentTime + dur);
  g.gain.setValueAtTime(opts.gain || 0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.start();
  o.stop(ctx.currentTime + dur);
}

// White noise burst (for applause/whoosh)
function _noise(dur, opts = {}) {
  const ctx = _ctx();
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType || 'bandpass';
  filter.frequency.value = opts.freq || 1000;
  filter.Q.value = opts.Q || 1;
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  g.gain.setValueAtTime(opts.gain || 0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.start();
  src.stop(ctx.currentTime + dur);
}

function playSound(type) {
  try {
    const ctx = _ctx();
    const now = ctx.currentTime;
    if (type === 'correct') {
      _tone(800, 0.3, { wave: 'sine', glide: 1200 });
      _tone(1200, 0.25, { wave: 'triangle', gain: 0.08 });
    } else if (type === 'wrong') {
      _tone(200, 0.3, { wave: 'square', glide: 100, gain: 0.12 });
    } else if (type === 'win') {
      // Triumphant arpeggio
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        setTimeout(() => _tone(f, 0.35, { wave: 'triangle', gain: 0.15 }), i * 100);
      });
      // Cymbal-ish noise
      setTimeout(() => _noise(0.8, { filterType: 'highpass', freq: 4000, gain: 0.06 }), 500);
    } else if (type === 'combo') {
      // Cinematic punch
      _tone(80,  0.6, { wave: 'sawtooth', gain: 0.18, glide: 40 });
      setTimeout(() => _tone(1200, 0.3, { wave: 'sine', gain: 0.12 }), 80);
      setTimeout(() => _noise(0.3, { filterType: 'bandpass', freq: 2000, gain: 0.08 }), 0);
    } else if (type === 'tick') {
      // Short urgent tick
      _tone(1400, 0.05, { wave: 'square', gain: 0.08 });
    } else if (type === 'whoosh') {
      // Filter sweep noise
      _noise(0.35, { filterType: 'lowpass', freq: 800, gain: 0.1 });
    } else if (type === 'chime') {
      // Bright bell - join sound
      _tone(1568, 0.4, { wave: 'sine', gain: 0.12 });
      setTimeout(() => _tone(2093, 0.3, { wave: 'sine', gain: 0.08 }), 60);
    } else if (type === 'drumroll') {
      // Rumbling rolling drum
      for (let i = 0; i < 16; i++) {
        setTimeout(() => _tone(60, 0.04, { wave: 'sawtooth', gain: 0.18 }), i * 50);
      }
    } else if (type === 'applause') {
      // Sustained noise = crowd
      _noise(1.2, { filterType: 'bandpass', freq: 1500, Q: 0.5, gain: 0.1 });
      setTimeout(() => _noise(0.8, { filterType: 'bandpass', freq: 2500, Q: 0.5, gain: 0.08 }), 200);
    } else if (type === 'six') {
      // Cricket-six celebration: low boom + ascending
      _tone(80, 0.4, { wave: 'sawtooth', glide: 30, gain: 0.16 });
      setTimeout(() => {
        [659, 880, 1318].forEach((f, i) => setTimeout(() => _tone(f, 0.25, { wave: 'triangle', gain: 0.12 }), i * 90));
      }, 100);
    }
  } catch (e) {}
}

// Rose petal confetti - South Indian mass-style
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
      life: 300
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

function confetti(n) {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const ps = [];
  for (let i = 0; i < (n || 40); i++) {
    ps.push({
      x: canvas.width / 2, y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 5,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rs: (Math.random() - 0.5) * 10,
      life: 100
    });
  }
  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ps.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.5;
      p.rot += p.rs; p.life--;
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
  for (let i = 0; i < 3; i++) setTimeout(() => confetti(60), i * 350);
}

// Particles bg
(function initParticles() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const s = Math.random() * 40 + 20;
    p.style.width = s + 'px';
    p.style.height = s + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 15 + 's';
    c.appendChild(p);
  }
})();
