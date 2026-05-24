# ⚡ quizX — Multiplayer Quiz, Live

A real-time **Kahoot-style** multiplayer quiz platform. Host on a big screen, players join from their phones, everyone plays together. Built for any subject — code, history, vocabulary, trivia, anything.

![Multiplayer](https://img.shields.io/badge/Multiplayer-Real--time-blueviolet) ![Tech](https://img.shields.io/badge/Node-Socket.io-010101) ![Deploy](https://img.shields.io/badge/Deploy-Render-46e3b7) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 How It Works

1. **Host** opens the app and picks a quiz → gets a memorable room code (e.g. `PANDA-42`)
2. The host screen shows the code + a QR code
3. **Players** open the app on their phones, scan the QR or type the code, enter a name
4. Their names appear live on the host screen as they join
5. Host clicks **Start** → questions appear simultaneously
6. Players tap their answer → faster = more points
7. After each question: live vote distribution + leaderboard
8. Final: 🥇 podium for top 3

---

## ✨ Features

- 🎮 **Real-time multiplayer** via Socket.io
- 📱 **Phone-friendly** — players use any browser
- 🖥️ **Projector mode** — host screen shows the question + live leaderboard
- 🔑 **Memorable codes** — `PANDA-42`, `TIGER-71`, etc.
- 📷 **QR code** — instant joining
- ⏱️ **Speed-based scoring** — faster correct answers earn more
- 🔥 **Streak bonuses** — 3, 5, 7, 10+ correct in a row
- 🏆 **Live leaderboard** + podium ceremony
- 📝 **Create your own quizzes** in-app (no code)
- 📦 **Two starter templates**: Python, DSA in Java
- 💾 **Custom quizzes persist** to disk
- 📤📥 **JSON import/export** for sharing quizzes
- 🎨 **Rich animations** — sparkles, confetti, screen transitions, hero entries
- 🔊 **Sound effects** — pure Web Audio, no files needed

---

## 🚀 Deploy to Render (3 minutes)

1. Sign in at [dashboard.render.com](https://dashboard.render.com) with GitHub
2. Click **New + → Web Service**
3. Connect this repo
4. Render auto-detects `render.yaml`. Confirm:
   - Runtime: `Node`
   - Build: `npm install`
   - Start: `npm start`
   - Plan: **Free**
5. Click **Create Web Service**. Wait ~2-3 min for first build.

You'll get a URL like `https://your-app.onrender.com`. Share it with players.

> Render free tier sleeps after ~15 min idle — open the URL 1 min before class to wake it up.

---

## 💻 Run Locally

```bash
git clone https://github.com/Jayeskumar/dataquiz-live.git
cd dataquiz-live
npm install
npm start
# → http://localhost:3000
```

---

## 📝 Create a Quiz

Click **📝 Create Your Own Quiz** on the landing page (or visit `/create.html`).

- Title, description, emoji, theme color
- Add 3-50 questions
- Per question: text, optional code block, 2-4 options, mark the correct one, difficulty, explanation
- **💾 Save** → instantly available to all hosts
- **📤 Export JSON** → share with other teachers
- **📥 Import JSON** → load a shared quiz
- **📋 Load Template** → start from Python or DSA quiz as a base

---

## 📦 Templates Shipped In

| Template | Questions | Topics |
|----------|-----------|--------|
| 🐍 Python Programming | 20 | Variables, lists, dicts, OOP, exceptions, generators, comprehensions |
| ☕ DSA in Java | 20 | Arrays, ArrayList, LinkedList, Stack, Queue, BST, HashMap, sorting, complexity |

You can use them as-is, copy and modify, or build entirely new quizzes from scratch.

---

## 🏗️ Architecture

```
quizX/
├── server.js              Node + Express + Socket.io
├── quizzes/
│   ├── templates.js       Read-only starter quizzes
│   └── library.js         Storage + CRUD + validation
├── data/quizzes.json      Custom quizzes (gitignored, runtime)
├── public/
│   ├── index.html         Landing (host or join)
│   ├── host.html          Host control + projector view
│   ├── player.html        Phone gameplay view
│   ├── create.html        Quiz creator
│   ├── style.css          All styling + animations
│   ├── host.js
│   ├── player.js
│   ├── south-memes.js     Reaction memes
│   └── socket.io.js       (served by Socket.io)
├── render.yaml            Render deployment config
├── package.json
└── README.md
```

### REST API

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/quizzes` | List all (templates + custom) summaries |
| `GET`  | `/api/quizzes/:id` | Full quiz with answers + explanations |
| `POST` | `/api/quizzes` | Create custom quiz (validated, 3-50 questions, 2-4 options) |
| `DELETE` | `/api/quizzes/:id` | Remove a custom quiz (templates are protected) |
| `GET`  | `/healthz` | Health check |

### Socket Events

**Host → Server:** `host:create`, `host:start`, `host:next`, `host:reveal`, `host:end`, `host:kick`
**Player → Server:** `player:join`, `player:answer`
**Server → Room:** `room:players`, `room:question`, `room:reveal`, `room:end`, `room:closed`
**Server → Player only:** `player:result`, `room:kicked`

---

## 🎨 Scoring

- **500 points** for a correct answer (base)
- **+500 max** time bonus (faster = more)
- **×1.2** if streak ≥ 3
- **×1.1 extra** if streak ≥ 5

---

## 📜 License

MIT. Use it for teaching, training, parties — whatever.

---

**Built for fun. Inspired by Kahoot. Free forever.**
