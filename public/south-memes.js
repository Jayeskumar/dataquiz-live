// =====================================================
//   South Indian Cinema Meme Pack
//   Tamil / Telugu / Kannada / Malayalam vibes
// =====================================================

// ---------- Correct Answer Reactions ----------
const CORRECT_REACTIONS = [
  { emoji: '🐐', text: 'GOAT-level answer machi!', cls: 'mass' },
  { emoji: '👑', text: 'Thalapathy mode activated!', cls: 'mass' },
  { emoji: '🌹', text: 'Pushpa style! Thaggede le!', cls: 'mass' },
  { emoji: '💪', text: 'Vaathi coming with the right answer!', cls: 'mass' },
  { emoji: '😎', text: 'Rocky Bhai approves. Vande Mataram!', cls: 'mass' },
  { emoji: '⚡', text: 'Vera level pa! Sema mass!', cls: 'mass' },
  { emoji: '🔥', text: 'Single take! Pakka winner!', cls: 'fire' },
  { emoji: '✨', text: 'Adhae sapavu! Top class machi!', cls: 'sparkle' },
  { emoji: '💃', text: 'Naatu Naatu winner! 🕺', cls: 'dance' },
  { emoji: '🦁', text: 'Salaar style! Boss mode ON.', cls: 'mass' },
  { emoji: '🌟', text: 'Magizhchi! Right answer da!', cls: 'sparkle' },
  { emoji: '💯', text: 'Pulli vaitha sapadu!', cls: 'mass' },
  { emoji: '🚀', text: 'Mind voice: Sema correct!', cls: 'fire' },
  { emoji: '🏆', text: 'Local-uh? Global-uh? Doesn\'t matter — CORRECT!', cls: 'mass' },
  { emoji: '👏', text: 'Vetri! Yenna scene-ah?', cls: 'sparkle' }
];

// ---------- Wrong Answer Reactions ----------
const WRONG_REACTIONS = [
  { emoji: '😭', text: 'Avana yaaru? Avana yaaru? 🙆', cls: 'cry' },
  { emoji: '🤦', text: 'Konjam over-a illa pa idhu?', cls: 'facepalm' },
  { emoji: '💔', text: 'Enna kodumai sir idhu!', cls: 'cry' },
  { emoji: '🥲', text: 'Yov... konjam padichirkanum!', cls: 'cry' },
  { emoji: '😅', text: 'Vadivelu reactions only mode 😬', cls: 'facepalm' },
  { emoji: '🙃', text: 'Mind voice: \"Yov!\" 🙄', cls: 'facepalm' },
  { emoji: '🥺', text: 'Daiva is watching... be careful 🙏', cls: 'cry' },
  { emoji: '🧠', text: 'Padichufy! Try maadi next time!', cls: 'facepalm' },
  { emoji: '🤔', text: 'Mama, idhu illa pa, vere answer!', cls: 'facepalm' },
  { emoji: '🥶', text: 'Cold shock-la irundha Soori face', cls: 'cry' },
  { emoji: '😬', text: 'Idhu konjam local-uh aagidichu', cls: 'facepalm' },
  { emoji: '🫠', text: 'Senthil-Goundamani confusion 100%', cls: 'cry' }
];

// ---------- Score-Based Reactions (final) ----------
const SCORE_MEMES = [
  { min: 0,  max: 19,  emoji: '😭', title: 'NAAYEY POTTA NAAYEY',
    tagline: 'Avana yaaru? Adhuvum padikkala! Time to hit the books, da.',
    meme: 'cry', color: '#ef4444' },
  { min: 20, max: 39,  emoji: '🥲', title: 'VADIVELU MODE',
    tagline: 'Theatres-la flop, library-la hit aagunga! Slowly slowly mass aaganum.',
    meme: 'cry', color: '#f97316' },
  { min: 40, max: 59,  emoji: '🤓', title: 'PADIKKURA PAYAN',
    tagline: 'Konjam more practice pa... aana azhugadhe! You got this energy.',
    meme: 'student', color: '#eab308' },
  { min: 60, max: 74,  emoji: '💪', title: 'MASS PLAYER',
    tagline: 'Vaathi coming with results! Decent mass machi, keep going!',
    meme: 'mass', color: '#84cc16' },
  { min: 75, max: 89,  emoji: '😎', title: 'ROCKY BHAI APPROVES',
    tagline: 'Vande Mataram! Solid performance pa! KGF Chapter Pass.',
    meme: 'bhai', color: '#22c55e' },
  { min: 90, max: 99,  emoji: '🐐', title: 'PUSHPA RAJ LEVEL',
    tagline: 'Thaggede le! Bilkul boss energy! Salaam from Mahishmati.',
    meme: 'pushpa', color: '#06b6d4' },
  { min: 100,max: 100, emoji: '👑', title: 'THALAPATHY MODE 👑',
    tagline: 'You\'re THE GOAT of this class! Single take. Mass entry. Perfect game.',
    meme: 'thalapathy', color: '#fbbf24' }
];

// ---------- Streak Combo Effects ----------
const COMBO_EFFECTS = [
  { min: 3,  max: 4,  text: 'MASS COMBO 🔥', color: '#f97316' },
  { min: 5,  max: 6,  text: 'VERA LEVEL ⚡', color: '#06b6d4' },
  { min: 7,  max: 9,  text: 'GOAT MODE 🐐', color: '#a855f7' },
  { min: 10, max: 99, text: 'UNSTOPPABLE 👑', color: '#fbbf24' }
];

function pickCorrect()  { return CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)]; }
function pickWrong()    { return WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)]; }
function pickScore(pct) { return SCORE_MEMES.find(m => pct >= m.min && pct <= m.max) || SCORE_MEMES[0]; }
function pickCombo(streak) { return COMBO_EFFECTS.find(c => streak >= c.min && streak <= c.max); }

// =====================================================
//   SVG Meme Templates — original stylized art
// =====================================================
const SI_SVG = {
  // Boss mode silhouette — raised collar, sunglasses, gold chain
  mass: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sun-m" cx="50%" cy="0%" r="80%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="60%" stop-color="#f97316" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#7c2d12" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="220" fill="#1a0030"/>
    <circle cx="100" cy="40" r="90" fill="url(#sun-m)"/>
    <g stroke="#fbbf24" stroke-width="1" opacity="0.6">
      <line x1="100" y1="50" x2="20"  y2="0"/>
      <line x1="100" y1="50" x2="180" y2="0"/>
      <line x1="100" y1="50" x2="0"   y2="60"/>
      <line x1="100" y1="50" x2="200" y2="60"/>
    </g>
    <!-- Head silhouette -->
    <ellipse cx="100" cy="80" rx="32" ry="38" fill="#1a1a1a"/>
    <!-- Collar (raised) -->
    <path d="M 60 130 L 70 100 L 100 110 L 130 100 L 140 130 L 140 200 L 60 200 Z" fill="#1a1a1a"/>
    <!-- Sunglasses -->
    <rect x="75" y="72" width="50" height="14" rx="3" fill="#000"/>
    <rect x="78" y="74" width="18" height="10" fill="#222" stroke="#fbbf24" stroke-width="0.5"/>
    <rect x="104" y="74" width="18" height="10" fill="#222" stroke="#fbbf24" stroke-width="0.5"/>
    <!-- Mustache -->
    <path d="M 85 100 Q 100 108 115 100 Q 110 96 100 96 Q 90 96 85 100 Z" fill="#1a1a1a"/>
    <!-- Gold chain -->
    <path d="M 80 130 Q 100 140 120 130" stroke="#fbbf24" stroke-width="2" fill="none"/>
    <circle cx="100" cy="142" r="6" fill="#fbbf24"/>
    <text x="100" y="146" text-anchor="middle" font-size="6" font-weight="bold" fill="#7c2d12">M</text>
  </svg>`,

  // Crying / Vadivelu-inspired sad face
  cry: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="220" fill="#1e293b"/>
    <circle cx="100" cy="110" r="80" fill="#fbbf24"/>
    <!-- Sad eyes -->
    <ellipse cx="75" cy="95" rx="10" ry="14" fill="white"/>
    <circle cx="75" cy="100" r="6" fill="#1a1a1a"/>
    <ellipse cx="125" cy="95" rx="10" ry="14" fill="white"/>
    <circle cx="125" cy="100" r="6" fill="#1a1a1a"/>
    <!-- Tears -->
    <path d="M 70 110 Q 65 130 70 150 Q 75 130 70 110 Z" fill="#3b82f6"/>
    <path d="M 130 110 Q 125 135 130 155 Q 135 135 130 110 Z" fill="#3b82f6"/>
    <!-- Frown -->
    <path d="M 70 150 Q 100 130 130 150" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- Mustache -->
    <path d="M 80 135 Q 100 142 120 135 Q 115 132 100 132 Q 85 132 80 135 Z" fill="#1a1a1a"/>
  </svg>`,

  // Pushpa Raj rose-throw inspired
  pushpa: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sun-p">
        <stop offset="0%" stop-color="#ef4444"/>
        <stop offset="100%" stop-color="#7c2d12" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="220" fill="#1a0a0a"/>
    <circle cx="100" cy="110" r="100" fill="url(#sun-p)" opacity="0.5"/>
    <!-- Rose petals falling -->
    <g fill="#dc2626" opacity="0.85">
      <ellipse cx="30"  cy="40"  rx="6" ry="9" transform="rotate(20 30 40)"/>
      <ellipse cx="170" cy="60"  rx="6" ry="9" transform="rotate(-15 170 60)"/>
      <ellipse cx="50"  cy="180" rx="6" ry="9" transform="rotate(40 50 180)"/>
      <ellipse cx="160" cy="190" rx="6" ry="9" transform="rotate(-30 160 190)"/>
      <ellipse cx="20"  cy="120" rx="6" ry="9" transform="rotate(60 20 120)"/>
      <ellipse cx="180" cy="130" rx="6" ry="9" transform="rotate(-50 180 130)"/>
    </g>
    <!-- Central rose -->
    <g transform="translate(100 110)">
      <circle r="32" fill="#7c2d12"/>
      <circle r="26" fill="#991b1b"/>
      <circle r="20" fill="#b91c1c"/>
      <circle r="14" fill="#dc2626"/>
      <circle r="8" fill="#ef4444"/>
      <path d="M -32 0 Q -42 -10 -50 -5 L -45 5 Z" fill="#15803d"/>
      <path d="M 32 0 Q 42 -10 50 -5 L 45 5 Z" fill="#15803d"/>
    </g>
    <text x="100" y="200" text-anchor="middle" font-family="Impact" font-size="18" fill="#fbbf24" font-weight="bold">THAGGEDE LE</text>
  </svg>`,

  // Thalapathy-style hero (sunglasses + smirk)
  thalapathy: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gold-t" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fde047"/>
        <stop offset="100%" stop-color="#a16207"/>
      </linearGradient>
    </defs>
    <rect width="200" height="220" fill="#000"/>
    <!-- Sun rays -->
    <g stroke="url(#gold-t)" stroke-width="2" opacity="0.5">
      <line x1="100" y1="110" x2="0"   y2="20"/>
      <line x1="100" y1="110" x2="200" y2="20"/>
      <line x1="100" y1="110" x2="0"   y2="100"/>
      <line x1="100" y1="110" x2="200" y2="100"/>
      <line x1="100" y1="110" x2="0"   y2="200"/>
      <line x1="100" y1="110" x2="200" y2="200"/>
    </g>
    <!-- Crown -->
    <path d="M 70 60 L 80 30 L 100 55 L 120 30 L 130 60 Z" fill="url(#gold-t)" stroke="#7c2d12" stroke-width="1"/>
    <rect x="70" y="60" width="60" height="8" fill="url(#gold-t)"/>
    <circle cx="80" cy="30" r="3" fill="#dc2626"/>
    <circle cx="100" cy="55" r="3" fill="#3b82f6"/>
    <circle cx="120" cy="30" r="3" fill="#22c55e"/>
    <!-- Head -->
    <circle cx="100" cy="110" r="40" fill="#8b6f47"/>
    <!-- Sunglasses -->
    <rect x="68" y="100" width="64" height="14" rx="2" fill="#000"/>
    <rect x="70" y="102" width="26" height="10" fill="#1a1a1a" stroke="#fde047" stroke-width="0.5"/>
    <rect x="104" y="102" width="26" height="10" fill="#1a1a1a" stroke="#fde047" stroke-width="0.5"/>
    <!-- Smirk -->
    <path d="M 85 135 Q 100 145 115 135" stroke="#1a1a1a" stroke-width="3" fill="none"/>
    <!-- Goatee -->
    <ellipse cx="100" cy="142" rx="6" ry="3" fill="#1a1a1a"/>
    <!-- Body silhouette -->
    <path d="M 60 170 Q 100 150 140 170 L 140 220 L 60 220 Z" fill="#1a1a1a"/>
    <text x="100" y="210" text-anchor="middle" font-family="Impact" font-size="13" fill="#fde047" font-weight="bold">THALAPATHY</text>
  </svg>`,

  // Rocky Bhai / KGF inspired (long hair, intense)
  bhai: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="220" fill="#0a0a0a"/>
    <!-- Fire effect at bottom -->
    <path d="M 0 220 Q 30 180 50 220 Q 80 170 110 220 Q 140 175 170 220 Q 190 185 200 220 Z" fill="#dc2626" opacity="0.5"/>
    <path d="M 0 220 Q 40 195 70 220 Q 100 195 130 220 Q 160 195 200 220 Z" fill="#f97316" opacity="0.7"/>
    <!-- Long hair -->
    <path d="M 60 80 Q 50 130 65 170 L 135 170 Q 150 130 140 80 Q 100 50 60 80 Z" fill="#1a1a1a"/>
    <!-- Face -->
    <ellipse cx="100" cy="100" rx="32" ry="38" fill="#a16207"/>
    <!-- Beard -->
    <path d="M 75 115 Q 100 145 125 115 Q 100 130 75 115 Z" fill="#1a1a1a"/>
    <!-- Intense eyes -->
    <ellipse cx="85" cy="95" rx="6" ry="4" fill="white"/>
    <circle cx="85" cy="95" r="3" fill="#1a1a1a"/>
    <ellipse cx="115" cy="95" rx="6" ry="4" fill="white"/>
    <circle cx="115" cy="95" r="3" fill="#1a1a1a"/>
    <!-- Eyebrows angled -->
    <path d="M 78 85 L 92 88" stroke="#1a1a1a" stroke-width="3"/>
    <path d="M 108 88 L 122 85" stroke="#1a1a1a" stroke-width="3"/>
    <!-- Cigar -->
    <rect x="125" y="118" width="20" height="4" fill="#7c2d12"/>
    <circle cx="148" cy="120" r="2" fill="#fbbf24"/>
    <text x="100" y="205" text-anchor="middle" font-family="Impact" font-size="14" fill="#dc2626" font-weight="bold">VANDE MATARAM</text>
  </svg>`,

  // Confused / face-palm
  facepalm: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="220" fill="#fef3c7"/>
    <!-- Question marks -->
    <text x="30" y="50" font-size="40" fill="#dc2626" opacity="0.7">?</text>
    <text x="160" y="50" font-size="40" fill="#dc2626" opacity="0.7">?</text>
    <text x="20" y="180" font-size="30" fill="#7c2d12" opacity="0.5">?</text>
    <text x="170" y="200" font-size="30" fill="#7c2d12" opacity="0.5">?</text>
    <!-- Head -->
    <circle cx="100" cy="120" r="55" fill="#fbbf24"/>
    <!-- Hand covering face -->
    <path d="M 60 95 Q 65 80 100 80 Q 135 80 140 95 Q 145 130 100 140 Q 55 130 60 95 Z" fill="#f59e0b"/>
    <!-- Eye peeking -->
    <ellipse cx="120" cy="115" rx="6" ry="3" fill="white"/>
    <circle cx="120" cy="115" r="2" fill="#1a1a1a"/>
    <!-- Frown -->
    <path d="M 80 155 Q 100 145 120 155" stroke="#1a1a1a" stroke-width="3" fill="none"/>
  </svg>`,

  // Pushpa shoulder pose
  // (omitted — using rose-throw above)

  // Sparkle / mass mode
  sparkle: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sp-grad">
        <stop offset="0%" stop-color="#fef3c7"/>
        <stop offset="40%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#7c2d12" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="220" fill="#1a0030"/>
    <circle cx="100" cy="110" r="100" fill="url(#sp-grad)" opacity="0.6"/>
    <!-- Big star -->
    <g transform="translate(100 100)">
      <polygon points="0,-40 12,-12 40,-12 18,8 28,40 0,22 -28,40 -18,8 -40,-12 -12,-12"
               fill="#fbbf24" stroke="#7c2d12" stroke-width="2"/>
    </g>
    <!-- Small sparkles -->
    <text x="40" y="60" font-size="20" fill="#fbbf24">✦</text>
    <text x="160" y="50" font-size="24" fill="#fde047">✧</text>
    <text x="30" y="180" font-size="22" fill="#fbbf24">✦</text>
    <text x="170" y="180" font-size="20" fill="#fde047">✧</text>
    <text x="80" y="200" font-size="16" fill="#fbbf24">✦</text>
  </svg>`,

  // Naatu Naatu dance
  dance: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="220" fill="#fff7ed"/>
    <!-- Music notes -->
    <text x="20" y="40" font-size="26" fill="#dc2626">♫</text>
    <text x="170" y="60" font-size="22" fill="#f97316">♪</text>
    <text x="30" y="180" font-size="24" fill="#dc2626">♬</text>
    <text x="160" y="200" font-size="20" fill="#f97316">♪</text>
    <!-- Dancer 1 -->
    <g transform="translate(70 90)">
      <circle cx="0" cy="0" r="14" fill="#a16207"/>
      <rect x="-10" y="14" width="20" height="40" fill="#dc2626"/>
      <line x1="-20" y1="25" x2="-30" y2="10" stroke="#a16207" stroke-width="4" stroke-linecap="round"/>
      <line x1="20"  y1="25" x2="30"  y2="10" stroke="#a16207" stroke-width="4" stroke-linecap="round"/>
      <line x1="-5"  y1="54" x2="-15" y2="80" stroke="#a16207" stroke-width="4" stroke-linecap="round"/>
      <line x1="5"   y1="54" x2="15"  y2="80" stroke="#a16207" stroke-width="4" stroke-linecap="round"/>
    </g>
    <!-- Dancer 2 -->
    <g transform="translate(130 90)">
      <circle cx="0" cy="0" r="14" fill="#92400e"/>
      <rect x="-10" y="14" width="20" height="40" fill="#f97316"/>
      <line x1="-20" y1="25" x2="-30" y2="40" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
      <line x1="20"  y1="25" x2="30"  y2="40" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
      <line x1="-5"  y1="54" x2="-15" y2="80" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
      <line x1="5"   y1="54" x2="15"  y2="80" stroke="#92400e" stroke-width="4" stroke-linecap="round"/>
    </g>
    <text x="100" y="210" text-anchor="middle" font-family="Impact" font-size="16" fill="#dc2626" font-weight="bold">NAATU NAATU</text>
  </svg>`,

  // Fire / Vaathi coming
  fire: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="fire-g" cx="50%" cy="100%" r="80%">
        <stop offset="0%" stop-color="#fef3c7"/>
        <stop offset="30%" stop-color="#fbbf24"/>
        <stop offset="60%" stop-color="#dc2626"/>
        <stop offset="100%" stop-color="#7c2d12"/>
      </radialGradient>
    </defs>
    <rect width="200" height="220" fill="url(#fire-g)"/>
    <!-- Fire shapes -->
    <path d="M 100 200 Q 70 150 75 100 Q 80 60 100 30 Q 120 60 125 100 Q 130 150 100 200 Z"
          fill="#fbbf24" opacity="0.9"/>
    <path d="M 100 200 Q 80 160 85 120 Q 90 80 100 60 Q 110 80 115 120 Q 120 160 100 200 Z"
          fill="#fde047" opacity="0.8"/>
    <path d="M 100 200 Q 90 170 95 140 Q 100 110 100 90 Q 100 110 105 140 Q 110 170 100 200 Z"
          fill="#fff" opacity="0.6"/>
    <!-- Sparks -->
    <circle cx="60" cy="80"  r="3" fill="#fbbf24"/>
    <circle cx="140" cy="60" r="2" fill="#fef3c7"/>
    <circle cx="50" cy="150" r="2" fill="#fbbf24"/>
    <circle cx="160" cy="140" r="3" fill="#fef3c7"/>
    <text x="100" y="210" text-anchor="middle" font-family="Impact" font-size="14" fill="#7c2d12" font-weight="bold">VAATHI COMING</text>
  </svg>`,

  // Student / padikkura payan
  student: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="220" fill="#dbeafe"/>
    <!-- Book stack -->
    <rect x="40" y="170" width="50" height="10" fill="#dc2626"/>
    <rect x="42" y="160" width="46" height="10" fill="#3b82f6"/>
    <rect x="44" y="150" width="42" height="10" fill="#22c55e"/>
    <!-- Head -->
    <circle cx="120" cy="100" r="38" fill="#fde68a"/>
    <!-- Glasses -->
    <rect x="100" y="92" width="40" height="14" rx="6" fill="none" stroke="#1a1a1a" stroke-width="3"/>
    <line x1="120" y1="99" x2="120" y2="99" stroke="#1a1a1a" stroke-width="2"/>
    <circle cx="110" cy="99" r="5" fill="#fff"/>
    <circle cx="130" cy="99" r="5" fill="#fff"/>
    <!-- Smile -->
    <path d="M 105 120 Q 120 130 135 120" stroke="#1a1a1a" stroke-width="2.5" fill="none"/>
    <!-- Body -->
    <rect x="95" y="135" width="50" height="50" fill="#3b82f6"/>
    <!-- Tie -->
    <polygon points="120,135 115,155 120,180 125,155" fill="#dc2626"/>
    <text x="100" y="210" text-anchor="middle" font-family="Impact" font-size="14" fill="#1e40af" font-weight="bold">PADIKKURA PAYAN</text>
  </svg>`
};

// Export functions on window for use in player.js / host.js
window.SI_MEMES = {
  pickCorrect, pickWrong, pickScore, pickCombo,
  SVG: SI_SVG,
  CORRECT_REACTIONS, WRONG_REACTIONS, SCORE_MEMES, COMBO_EFFECTS
};
