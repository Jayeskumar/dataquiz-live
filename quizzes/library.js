// =====================================================
//   Quiz Library
//   Templates (read-only) + custom quizzes (persisted to disk)
// =====================================================

const fs = require('fs');
const path = require('path');
const { TEMPLATES } = require('./templates');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'quizzes.json');

// In-memory store of custom quizzes (loaded from disk on boot)
let customQuizzes = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      customQuizzes = JSON.parse(raw);
      if (!Array.isArray(customQuizzes)) customQuizzes = [];
    }
  } catch (e) {
    console.error('Failed to load custom quizzes:', e.message);
    customQuizzes = [];
  }
}

function saveToDisk() {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(customQuizzes, null, 2));
  } catch (e) {
    console.error('Failed to save custom quizzes:', e.message);
  }
}

loadFromDisk();

// =====================================================
//   Public API
// =====================================================
function listSummaries() {
  const all = [...TEMPLATES, ...customQuizzes];
  return all.map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    emoji: q.emoji,
    color: q.color,
    isTemplate: !!q.isTemplate,
    questionCount: q.questions.length,
    createdAt: q.createdAt || null
  }));
}

function getById(id) {
  return TEMPLATES.find(q => q.id === id) || customQuizzes.find(q => q.id === id);
}

function getRandomQuestions(quizId, count) {
  const quiz = getById(quizId);
  if (!quiz) return [];
  const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function validateQuiz(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return ['Invalid payload'];
  if (!input.title || typeof input.title !== 'string') errors.push('Title required');
  if (input.title && input.title.length > 80) errors.push('Title too long (max 80 chars)');
  if (!Array.isArray(input.questions) || input.questions.length < 3) {
    errors.push('At least 3 questions required');
  }
  if (input.questions && input.questions.length > 50) errors.push('Max 50 questions per quiz');
  (input.questions || []).forEach((q, i) => {
    if (!q.q || typeof q.q !== 'string') errors.push(`Q${i + 1}: question text required`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
      errors.push(`Q${i + 1}: must have 2-4 options`);
    }
    if (q.options && q.options.some(o => !o || typeof o !== 'string')) {
      errors.push(`Q${i + 1}: option text cannot be empty`);
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || (q.options && q.correct >= q.options.length)) {
      errors.push(`Q${i + 1}: invalid correct option index`);
    }
    if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty)) {
      errors.push(`Q${i + 1}: difficulty must be easy/medium/hard`);
    }
  });
  return errors;
}

function createCustom(input) {
  const errors = validateQuiz(input);
  if (errors.length) return { ok: false, errors };

  const id = 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const quiz = {
    id,
    title: input.title.trim(),
    description: (input.description || '').trim().slice(0, 300),
    emoji: input.emoji || '📝',
    color: input.color || 'linear-gradient(135deg, #6366f1, #ec4899)',
    isTemplate: false,
    createdAt: Date.now(),
    questions: input.questions.map(q => ({
      q: q.q.trim(),
      code: q.code ? q.code.trim() : undefined,
      options: q.options.map(o => o.trim()),
      correct: q.correct,
      difficulty: q.difficulty || 'medium',
      exp: (q.exp || '').trim()
    }))
  };
  customQuizzes.push(quiz);
  saveToDisk();
  return { ok: true, quiz };
}

function deleteCustom(id) {
  const idx = customQuizzes.findIndex(q => q.id === id);
  if (idx < 0) return { ok: false, error: 'Not found' };
  customQuizzes.splice(idx, 1);
  saveToDisk();
  return { ok: true };
}

module.exports = {
  listSummaries,
  getById,
  getRandomQuestions,
  createCustom,
  deleteCustom,
  validateQuiz
};
