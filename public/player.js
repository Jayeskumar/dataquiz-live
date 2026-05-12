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

socket.on('player:result', (res) => {
  stopTimer();
  myScore = res.score;
  document.getElementById('topbarScore').textContent = myScore;
  document.getElementById('totalScore').textContent = myScore;

  const verdict = document.getElementById('resultVerdict');
  const emoji = document.getElementById('resultEmoji');
  const pts = document.getElementById('pointsEarned');

  if (res.isCorrect) {
    verdict.textContent = 'Correct! ✓';
    verdict.className = 'verdict correct';
    emoji.textContent = randomFrom(['🎉', '🚀', '⚡', '🔥', '🧠', '💯', '✨', '👑']);
    pts.textContent = '+' + res.lastPoints;
    pts.className = 'points-earned positive';
    confetti(40);
    playSound('correct');
  } else {
    verdict.textContent = 'Not this time';
    verdict.className = 'verdict wrong';
    emoji.textContent = randomFrom(['😅', '🤔', '🙃', '💀', '📚', '🔄']);
    if (myAnswer === null) {
      pts.textContent = 'Too slow';
      pts.className = 'points-earned';
    } else {
      pts.textContent = '0 points';
      pts.className = 'points-earned';
    }
    playSound('wrong');
  }
  showScreen('screenResult');
});

socket.on('room:end', (data) => {
  const me = data.leaderboard.find(p => p.name === myName);
  const rank = me?.rank ?? '—';
  const score = me?.score ?? myScore;
  document.getElementById('finalRank').textContent = '#' + rank;
  document.getElementById('finalScore').textContent = score;

  const title = document.getElementById('finalTitle');
  const emoji = document.getElementById('finalEmoji');
  if (rank === 1) {
    title.textContent = '🥇 You won!';
    emoji.textContent = '👑';
    bigConfetti();
    playSound('win');
  } else if (rank === 2) {
    title.textContent = '🥈 So close!';
    emoji.textContent = '🥈';
    confetti(80);
  } else if (rank === 3) {
    title.textContent = '🥉 Top 3!';
    emoji.textContent = '🥉';
    confetti(40);
  } else {
    title.textContent = 'Game Over!';
    emoji.textContent = '🎮';
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
  let remaining = duration;
  text.textContent = remaining;
  ring.style.strokeDashoffset = '0';
  ring.style.transition = 'none';
  ring.classList.remove('warning', 'danger');
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
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

let audioCtx;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'correct') {
      o.frequency.setValueAtTime(800, now);
      o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.start(now); o.stop(now + 0.3);
    } else if (type === 'wrong') {
      o.frequency.setValueAtTime(200, now);
      o.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.start(now); o.stop(now + 0.3);
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const oo = audioCtx.createOscillator();
        const gg = audioCtx.createGain();
        oo.connect(gg); gg.connect(audioCtx.destination);
        oo.frequency.setValueAtTime(f, now + i * 0.1);
        gg.gain.setValueAtTime(0.15, now + i * 0.1);
        gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        oo.start(now + i * 0.1); oo.stop(now + i * 0.1 + 0.3);
      });
    }
  } catch (e) {}
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
