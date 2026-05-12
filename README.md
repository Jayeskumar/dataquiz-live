# 🎮 DataQuiz Live — Multiplayer Classroom Quiz

A real-time **Kahoot-style** multiplayer quiz game for teaching data analysis.
The teacher hosts on a projector, students join from their phones, everyone plays together.

![Multiplayer](https://img.shields.io/badge/Multiplayer-Real--time-blueviolet) ![Tech](https://img.shields.io/badge/Tech-Socket.io-010101) ![Deploy](https://img.shields.io/badge/Deploy-Render-46e3b7) ![Players](https://img.shields.io/badge/Players-Unlimited-orange)

---

## 🎯 How It Works (Classroom Flow)

1. **Teacher** opens the app on a laptop/computer connected to the projector
2. Picks a topic + settings → gets a memorable room code (e.g., `PANDA-42`)
3. The projector shows the code + a QR code
4. **Students** open the app on their phones, scan the QR (or type the code)
5. Their names appear live on the teacher's screen as they join
6. Teacher clicks **Start** → questions appear on the projector AND on student phones (phones show only colored answer buttons)
7. Students tap their answer → faster = more points
8. After each question: vote distribution + live leaderboard
9. Final: 🥇 podium for top 3

Inspired by Kahoot, built specifically for data analysis lessons.

---

## ✨ Features

- **♾ Unlimited players** per room (limited only by your server's capacity)
- **Real-time synchronization** via WebSockets (Socket.io)
- **Memorable room codes** like `PANDA-42`, `TIGER-71`
- **QR code** for instant phone joining
- **Speed-based scoring** — answer faster = more points (max 1000, min 500 if correct)
- **Streak bonuses** — 3+ in a row = 1.2x multiplier, 5+ = 1.32x
- **Live vote distribution** on reveal screen
- **Podium ceremony** with confetti for winners
- **Module picker** — choose Pandas, NumPy, ML, etc., or "Mix of All"
- **Configurable timer** (15-45 seconds per question)
- **Configurable question count** (5-20 questions per game)
- **Host controls** — Reveal Now / Next / Kick player / End game
- **Auto-reveal** when all players have answered
- **Graceful disconnects** — players can drop in/out
- **Mobile-optimized** player UI (no zooming, tap-friendly buttons)
- **Sound FX + confetti** on the player side

---

## 🚀 Quick Start (Local)

```bash
cd quiz-multiplayer
npm install
npm start
```

Open `http://localhost:3000` in your browser. Click **Host a Game**.
Then on your phone (same WiFi, find your computer's IP) or another browser tab, open `http://YOUR_IP:3000` and click **Join Game** with the room code.

---

## 🌐 Deploy to Render (Free Tier, ~5 min)

This deploys as a **Web Service** (Node.js) — not a static site, because we need a real backend for Socket.io.

### Step 1: Push to GitHub

```bash
cd quiz-multiplayer
git init
git add .
git commit -m "Initial commit: DataQuiz Multiplayer"
git remote add origin https://github.com/YOUR_USERNAME/dataquiz-live.git
git push -u origin main
```

### Step 2: Create the Render service

1. Sign up at [render.com](https://render.com) (free)
2. **New +** → **Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`. Just confirm:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **Create Web Service**

Render will build & deploy. You'll get a URL like `https://dataquiz-live.onrender.com`.

### Step 3: Test it

- Open the URL on your projector
- Open it on your phone
- Play!

⚠️ **Note on Render's free tier**: The service spins down after ~15 min of inactivity. The first request after a sleep takes ~30 seconds to wake. For classroom use, **visit the URL 1-2 minutes before class** to wake it up.

For zero spin-down, upgrade to a paid plan ($7/mo Starter).

---

## 📂 Project Structure

```
quiz-multiplayer/
├── server.js              # Node + Express + Socket.io backend
├── questions.js           # Question database (~60 questions, 8 modules)
├── package.json
├── render.yaml            # Render deployment config
├── README.md              # This file
├── .gitignore
└── public/
    ├── index.html         # Landing — Host or Join
    ├── host.html          # Host's projector view + controls
    ├── player.html        # Student's phone view
    ├── style.css          # Shared stylesheet
    ├── host.js            # Host logic
    └── player.js          # Player logic
```

---

## 🎮 The Game Flow in Detail

### Host Setup
1. Visit `/host.html`
2. Pick a **topic** (Pandas, NumPy, ML, etc., or All)
3. Pick **# of questions** and **time per question**
4. Click **Create Room** → server generates a unique code

### Lobby
- The projector shows:
  - Big room code (e.g., `PANDA-42`)
  - QR code linking to `/?code=PANDA-42`
  - Live player list (avatars + names) — updates as students join
- Host clicks **Start Game** when ready

### Question Phase (~20s)
- Projector: Question text + 4 colored answer options + timer ring
- Phone: Just 4 colored buttons (no question text — they look at the projector). This is intentional — encourages students to look up
- Players tap → answer locked
- "X/N answered" counter updates live for the host

### Reveal Phase
- Projector: Bar chart of vote distribution per option, correct one highlighted
- Explanation shown
- Live leaderboard
- Phone: 🎉 "Correct! +850" or 💀 "Not this time, 0 points"

### Final Phase
- Top 3 podium with crowns
- Full leaderboard below
- Confetti for everyone
- Phone: Your final rank + total score

---

## 🎯 Scoring Logic

```
if correct:
  base_points = 500
  speed_bonus = (1 - time_taken / max_time) * 500
  total = base + speed_bonus
  if streak >= 3: total *= 1.2
  if streak >= 5: total *= 1.1  (compounds)
else:
  points = 0
  streak = 0
```

Max score per question = **1000 points** (correct + instant answer).
Slowest correct answer = **500 points**.

---

## 🛠️ Customization

### Add your own questions

Edit `questions.js`:

```js
{
  module: 'pandas',        // module key
  difficulty: 'medium',    // easy | medium | hard
  q: 'Your question?',
  code: 'optional\ncode',  // optional
  options: ['A', 'B', 'C', 'D'],
  correct: 2,              // index
  exp: 'Why C is correct...'
}
```

Add modules in `questions.js`:
```js
const MODULES = {
  yourkey: { name: 'Display Name', emoji: '🚀' },
  // ...
};
```

### Tweak scoring

In `server.js`, `Room.computeReveal()`:

```js
pts = Math.round(500 + 500 * timeFactor);  // change base/bonus
if (p.streak >= 3) pts = Math.round(pts * 1.2);  // change streak threshold
```

### Tweak default timer / question count

In `host.html` `<select>` defaults, or in `server.js` `host:create` handler defaults.

---

## 🧪 Troubleshooting

| Problem | Fix |
|---------|-----|
| Players can't join | Make sure they're on the SAME WiFi (local) or the deployed URL (online) |
| Questions not appearing on phones | Refresh both browsers; check the room code matches |
| "Connection lost" toast | Render free tier may have spun down. Wait 30s, retry |
| Host disconnects → game ends | Expected. We auto-close rooms when host leaves so players know |
| Cant scan QR code | Use the URL printed above the code |
| Need to kick a disruptive player | Host can kick from player list (not yet UI-wired, but `host:kick` is implemented) |

---

## 🎓 Classroom Tips

- **Practice mode first**: Run one round with yourself + a coworker before class
- **Project the host's screen**: Use HDMI or wireless cast to the classroom display
- **Big room code**: Use the lobby screen so EVERYONE can see and join
- **Make it competitive**: The leaderboard works as a great class engagement tool
- **Use the reveal explanations**: Each question has a teaching note — pause and explain
- **Pace yourself**: Don't rush "Next" — let students see why they were wrong
- **Mix it up**: Use module-specific games to focus on one topic per class
- **Tournament style**: Run multiple games over a semester; track top players

---

## 🔒 Security Notes

- No authentication — anyone with the room code can join
- Don't use real student names if privacy is a concern (use student IDs / nicknames)
- All state is in-memory — server restart wipes everything
- For sensitive use, deploy behind a private network or add auth

---

## 📜 License

MIT — use for teaching, training, workshops, conferences. Have fun.

---

## 🙏 Credits

Built for the Data Analysis Mastery Course.
Inspired by Kahoot, Mentimeter, and the joy of classroom competitions.

**Made for teachers, by educators who hated boring lectures.** 🎓

---

*Pro tip: Project the QR code on the big screen and watch the entire room pull out their phones at once. Magic.*
