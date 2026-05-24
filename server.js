// =====================================================
//   DataQuiz Multiplayer Server
//   Node + Express + Socket.io — real-time classroom game
// =====================================================

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const Quizzes = require('./quizzes/library');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '500kb' }));

// =====================================================
//   Quiz REST API
// =====================================================

// List all quizzes (templates + custom)
app.get('/api/quizzes', (_req, res) => {
  res.json({ quizzes: Quizzes.listSummaries() });
});

// Get one quiz (without correct answers in raw form — for editing only)
app.get('/api/quizzes/:id', (req, res) => {
  const q = Quizzes.getById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  res.json(q);
});

// Create a new custom quiz
app.post('/api/quizzes', (req, res) => {
  const result = Quizzes.createCustom(req.body);
  if (!result.ok) return res.status(400).json({ errors: result.errors });
  res.json({ ok: true, quiz: { id: result.quiz.id, title: result.quiz.title } });
});

// Delete a custom quiz
app.delete('/api/quizzes/:id', (req, res) => {
  const q = Quizzes.getById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  if (q.isTemplate) return res.status(403).json({ error: 'Cannot delete template' });
  const result = Quizzes.deleteCustom(req.params.id);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});

// =====================================================
//   In-memory game state
// =====================================================
const rooms = new Map(); // code -> Room
const ANIMAL_WORDS = [
  'PANDA', 'TIGER', 'EAGLE', 'KOALA', 'OTTER',
  'SHARK', 'WOLF', 'PUMA', 'HAWK', 'LYNX'
];

function generateRoomCode() {
  let attempts = 0;
  while (attempts < 100) {
    const animal = ANIMAL_WORDS[Math.floor(Math.random() * ANIMAL_WORDS.length)];
    const num = Math.floor(Math.random() * 90 + 10);
    const code = `${animal}-${num}`;
    if (!rooms.has(code)) return code;
    attempts++;
  }
  return 'GAME-' + Math.floor(Math.random() * 9000 + 1000);
}

// =====================================================
//   Room class (logic per game)
// =====================================================
class Room {
  constructor(code, hostId, options) {
    this.code = code;
    this.hostId = hostId;
    this.players = new Map(); // socketId -> player
    this.questions = options.questions;
    this.quiz = options.quiz; // full quiz metadata { id, title, emoji, color, ... }
    this.timerSeconds = options.timerSeconds || 20;
    this.currentIndex = -1;
    this.state = 'lobby';            // lobby | question | reveal | finished
    this.questionStartTime = 0;
    this.autoRevealTimer = null;
    this.createdAt = Date.now();
  }

  addPlayer(socketId, name) {
    this.players.set(socketId, {
      id: socketId,
      name: name.trim().slice(0, 20) || 'Anon',
      score: 0,
      streak: 0,
      currentAnswer: null,
      answerTimeMs: null,
      isCorrect: null,
      lastPoints: 0
    });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  publicPlayers() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    }));
  }

  leaderboard() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        score: p.score,
        lastPoints: p.lastPoints,
        isCorrect: p.isCorrect
      }));
  }

  resetAnswers() {
    this.players.forEach(p => {
      p.currentAnswer = null;
      p.answerTimeMs = null;
      p.isCorrect = null;
      p.lastPoints = 0;
    });
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      this.state = 'finished';
      return null;
    }
    this.resetAnswers();
    this.state = 'question';
    this.questionStartTime = Date.now();
    return this.questions[this.currentIndex];
  }

  publicCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    return {
      index: this.currentIndex,
      total: this.questions.length,
      quizId: this.quiz.id,
      quizTitle: this.quiz.title,
      quizEmoji: this.quiz.emoji,
      difficulty: q.difficulty || 'medium',
      q: q.q,
      code: q.code || null,
      options: q.options,
      duration: this.timerSeconds
    };
  }

  submitAnswer(socketId, answerIdx) {
    const p = this.players.get(socketId);
    if (!p || this.state !== 'question' || p.currentAnswer !== null) return false;
    const elapsed = Date.now() - this.questionStartTime;
    p.currentAnswer = answerIdx;
    p.answerTimeMs = elapsed;
    return true;
  }

  allAnswered() {
    return this.players.size > 0 &&
      Array.from(this.players.values()).every(p => p.currentAnswer !== null);
  }

  computeReveal() {
    const q = this.questions[this.currentIndex];
    const maxTimeMs = this.timerSeconds * 1000;

    this.players.forEach(p => {
      const correct = p.currentAnswer === q.correct;
      let pts = 0;
      if (correct) {
        const timeFactor = p.answerTimeMs !== null
          ? Math.max(0, 1 - (p.answerTimeMs / maxTimeMs))
          : 0;
        pts = Math.round(500 + 500 * timeFactor);
        if (p.streak >= 3) pts = Math.round(pts * 1.2);
        if (p.streak >= 5) pts = Math.round(pts * 1.1);
        p.streak++;
      } else {
        p.streak = 0;
      }
      p.lastPoints = pts;
      p.score += pts;
      p.isCorrect = correct;
    });

    // Vote distribution
    const votes = new Array(q.options.length).fill(0);
    let totalVotes = 0;
    this.players.forEach(p => {
      if (p.currentAnswer !== null && p.currentAnswer >= 0 && p.currentAnswer < votes.length) {
        votes[p.currentAnswer]++;
        totalVotes++;
      }
    });

    this.state = 'reveal';

    return {
      correct: q.correct,
      explanation: q.exp,
      votes,
      totalAnswered: totalVotes,
      totalPlayers: this.players.size,
      perPlayer: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        answer: p.currentAnswer,
        isCorrect: p.isCorrect,
        lastPoints: p.lastPoints,
        score: p.score,
        timeMs: p.answerTimeMs
      })),
      leaderboard: this.leaderboard()
    };
  }
}

// =====================================================
//   Socket events
// =====================================================
io.on('connection', (socket) => {
  console.log('[connect]', socket.id);

  socket.on('disconnect', () => {
    console.log('[disconnect]', socket.id);
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (socket.data.role === 'host' && room.hostId === socket.id) {
      // Host left — end game
      clearTimeout(room.autoRevealTimer);
      io.to(code).emit('room:closed', { reason: 'Host left' });
      rooms.delete(code);
      console.log(`[room ${code}] closed (host left)`);
    } else if (socket.data.role === 'player') {
      room.removePlayer(socket.id);
      io.to(code).emit('room:players', room.publicPlayers());
      console.log(`[room ${code}] player left`);
    }
  });

  // ---------- HOST: create room ----------
  socket.on('host:create', (opts, cb) => {
    const quizId = opts.quizId;
    if (!quizId) return cb && cb({ ok: false, error: 'No quiz selected' });

    const quiz = Quizzes.getById(quizId);
    if (!quiz) return cb && cb({ ok: false, error: 'Quiz not found' });

    const count = Math.max(3, Math.min(quiz.questions.length, opts.count || 10));
    const timerSeconds = Math.max(10, Math.min(60, opts.timer || 20));

    const questions = Quizzes.getRandomQuestions(quizId, count);
    if (questions.length === 0) {
      return cb && cb({ ok: false, error: 'No questions in this quiz' });
    }

    const code = generateRoomCode();
    const room = new Room(code, socket.id, {
      questions,
      quiz: { id: quiz.id, title: quiz.title, emoji: quiz.emoji, color: quiz.color },
      timerSeconds
    });
    rooms.set(code, room);

    socket.join(code);
    socket.data.role = 'host';
    socket.data.roomCode = code;

    console.log(`[room ${code}] created — quiz=${quiz.title} count=${questions.length}`);
    cb && cb({
      ok: true,
      code,
      questionCount: questions.length,
      quizTitle: quiz.title,
      timerSeconds
    });
  });

  // ---------- PLAYER: join room ----------
  socket.on('player:join', ({ code, name }, cb) => {
    const room = rooms.get(code?.toUpperCase());
    if (!room) return cb && cb({ ok: false, error: 'Room not found' });
    if (room.state !== 'lobby') {
      return cb && cb({ ok: false, error: 'Game already started' });
    }
    // Check name duplicate
    const exists = Array.from(room.players.values())
      .some(p => p.name.toLowerCase() === (name || '').trim().toLowerCase());
    if (exists) return cb && cb({ ok: false, error: 'Name already taken' });

    room.addPlayer(socket.id, name || 'Anon');
    socket.join(room.code);
    socket.data.role = 'player';
    socket.data.roomCode = room.code;
    socket.data.playerName = name;

    cb && cb({ ok: true, code: room.code, playerId: socket.id });
    io.to(room.code).emit('room:players', room.publicPlayers());
    console.log(`[room ${room.code}] +player ${name}`);
  });

  // ---------- HOST: start game ----------
  socket.on('host:start', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.size === 0) {
      socket.emit('host:error', { msg: 'Need at least one player to start' });
      return;
    }
    pushNextQuestion(room);
  });

  // ---------- HOST: next question (skip reveal) ----------
  socket.on('host:next', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    pushNextQuestion(room);
  });

  // ---------- HOST: force reveal ----------
  socket.on('host:reveal', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id || room.state !== 'question') return;
    doReveal(room);
  });

  // ---------- HOST: end game ----------
  socket.on('host:end', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    finishGame(room);
  });

  // ---------- HOST: kick player ----------
  socket.on('host:kick', ({ playerId }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || room.hostId !== socket.id) return;
    if (!room.players.has(playerId)) return;
    io.to(playerId).emit('room:kicked');
    const targetSocket = io.sockets.sockets.get(playerId);
    if (targetSocket) targetSocket.disconnect(true);
    room.removePlayer(playerId);
    io.to(code).emit('room:players', room.publicPlayers());
  });

  // ---------- PLAYER: submit answer ----------
  socket.on('player:answer', ({ answer }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    const ok = room.submitAnswer(socket.id, answer);
    if (!ok) return;

    // Tell the host who answered (no answer leak)
    const player = room.players.get(socket.id);
    io.to(room.hostId).emit('host:playerAnswered', {
      playerId: socket.id,
      name: player.name,
      answeredCount: Array.from(room.players.values()).filter(p => p.currentAnswer !== null).length,
      totalPlayers: room.players.size
    });

    // If everyone answered, reveal immediately
    if (room.allAnswered()) {
      doReveal(room);
    }
  });
});

// =====================================================
//   Game flow helpers
// =====================================================
function pushNextQuestion(room) {
  clearTimeout(room.autoRevealTimer);
  const q = room.nextQuestion();
  if (!q) {
    finishGame(room);
    return;
  }
  const payload = room.publicCurrentQuestion();
  io.to(room.code).emit('room:question', payload);

  // Auto-reveal after timer + small grace
  room.autoRevealTimer = setTimeout(() => {
    if (room.state === 'question') doReveal(room);
  }, (room.timerSeconds + 1) * 1000);
}

function doReveal(room) {
  clearTimeout(room.autoRevealTimer);
  const reveal = room.computeReveal();
  io.to(room.code).emit('room:reveal', reveal);

  // Per-player personal result
  reveal.perPlayer.forEach(p => {
    io.to(p.id).emit('player:result', {
      isCorrect: p.isCorrect,
      lastPoints: p.lastPoints,
      score: p.score,
      correctAnswer: reveal.correct
    });
  });
}

function finishGame(room) {
  clearTimeout(room.autoRevealTimer);
  room.state = 'finished';
  io.to(room.code).emit('room:end', {
    leaderboard: room.leaderboard(),
    totalQuestions: room.questions.length
  });
  // Keep room alive briefly so players can see results
  setTimeout(() => {
    rooms.delete(room.code);
    console.log(`[room ${room.code}] cleaned up`);
  }, 10 * 60 * 1000);
}

// Cleanup stale lobbies (in case host disconnects silently)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.state === 'lobby' && now - room.createdAt > 30 * 60 * 1000) {
      rooms.delete(code);
      console.log(`[room ${code}] stale lobby cleanup`);
    }
  }
}, 5 * 60 * 1000);

// =====================================================
//   Health endpoint
// =====================================================
app.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    activeGames: Array.from(rooms.values()).filter(r => r.state !== 'lobby').length,
    uptime: process.uptime()
  });
});

// =====================================================
//   Start server
// =====================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  🧠 DataQuiz Multiplayer running`);
  console.log(`  http://localhost:${PORT}\n`);
});
