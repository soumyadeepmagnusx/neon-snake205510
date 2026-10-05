# ⚡ NEONSNAKE 2077

A high-octane synthwave & cyberpunk canvas arcade game built with vanilla JavaScript, featuring real-time WebRTC peer-to-peer multiplayer, autonomous AI bots, procedural Web Audio synthesis, audio spectrum visualization, and dynamic particle physics.

![NeonSnake 2077](https://img.shields.io/badge/Theme-Synthwave%202077-00f0ff?style=for-the-badge)
![WebRTC P2P](https://img.shields.io/badge/Multiplayer-WebRTC%20P2P-ff007f?style=for-the-badge)
![Audio Engine](https://img.shields.io/badge/Audio-Procedural%20Web%20Audio-39ff14?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/Tech-HTML5%20%7C%20Canvas%20%7C%20CSS3-ffe600?style=for-the-badge)

---

## 🎮 Highlights & Features

- **Cyberpunk Visuals & Effects**:
  - Animated retro perspective grid that pulses with the audio frequency.
  - Multi-node snakes with directional cyber optics, neon ribbons, and trailing particle exhaust.
  - Explosive particle engine: spark showers, expanding shockwaves, combat damage numbers, and ambient drifting dust.
  - Real-time CRT scanline shader with chromatic screen distortion and camera shake physics.
  - 4 Cyberpunk visual color palettes: *Neon 2077*, *Outrun Sunset*, *Matrix Acid*, and *Electric Gold*.

- **100% Procedural Web Audio Engine**:
  - Zero external MP3 or sound assets needed; loads instantly with zero network dependencies!
  - 124 BPM retro synthwave arpeggiated bassline, kick drums, snare/claps, offbeat hats, and synth leads.
  - Dynamic frequency visualizer spectrum rendered across the canvas background.
  - Procedural sound effects: food chime, turbo boost thrust roar, explosion impact, EMP shockwave, and phase warp tone.

- **4 Game Modes**:
  1. **⚡ Solo Cyber Run**: High-score survival against randomized laser barriers and escalating speeds.
  2. **🤖 Bot Battle Royale**: Arena deathmatch against AI snakes (*AI-Nexus* & *AI-Viper*) powered by open-space flood-fill heuristics and threat avoidance.
  3. **👥 Local 2-Player Versus**: Split keyboard duel on a single display (`WASD + Space` vs `Arrows + Enter`).
  4. **🌐 P2P Online Duel**: Zero-lag peer-to-peer multiplayer powered by WebRTC DataChannels (PeerJS). Instant 4-letter room code invite!

- **Cyber Power-Ups & Mechanics**:
  - **Turbo Overdrive**: Hold `Space` / `Shift` for a 2x speed burst leaving burning neon thermal trails.
  - **Neon Energy Core (Cyan)**: Base energy (+10 pts, grows body, restores boost energy).
  - **Overdrive Core (Lime)**: Instantly recharges boost meter to 100% + gives temporary invulnerability.
  - **Phase Matrix (Purple)**: Ghost phase through lethal walls and snake bodies for 6 seconds.
  - **EMP Shockwave (Yellow)**: Detonates an EMP ring clearing nearby obstacles and stunning enemy snakes.
  - **Multiplier Matrix (Orange)**: 3x score multiplier bonus.

- **Hall of Fame & Achievements**:
  - Persistent local leaderboard saving top scores, dates, and custom player handles.
  - In-game achievements toast system (Speed Demon, Ghost in the Net, Grid Blackout, Nexus Breaker, Century Mark).

- **Difficulty Settings**:
  - **Casual**: Relaxed speed and forgiving boundaries.
  - **Arcade**: Balanced retro arcade difficulty.
  - **Overclocked**: High-speed adrenaline rush for pro reflex gamers.

- **Responsive & Mobile Ready**:
  - Virtual on-screen D-pad and Turbo Boost button for mobile and tablet touchscreens.
  - Auto-scaling canvas that preserves aspect ratio on all screen sizes.

---

## 🕹️ Controls Guide

| Action | Player 1 (Desktop) | Player 2 (Local 2P) | Mobile / Touch |
| :--- | :--- | :--- | :--- |
| **Move Up** | `W` or `Up Arrow` | `Up Arrow` | `▲` D-Pad Button |
| **Move Down** | `S` or `Down Arrow` | `Down Arrow` | `▼` D-Pad Button |
| **Move Left** | `A` or `Left Arrow` | `Left Arrow` | `◀` D-Pad Button |
| **Move Right** | `D` or `Right Arrow` | `Right Arrow` | `▶` D-Pad Button |
| **Turbo Overdrive** | `Space` or `Left Shift` | `Enter` or `Right Ctrl` | `TURBO` Circle Button |
| **Pause / Resume** | `P` or `Escape` | `P` or `Escape` | Tap anywhere |

---

## 🚀 Quick Start

### Option 1: Direct Browser Launch
Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari).

### Option 2: Local HTTP Server (Recommended for WebRTC P2P)
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve -l 8080
```
Then navigate to `http://localhost:8080`.

---

## 🛠️ Project Architecture

```
neon-snake-2077/
├── index.html       # Game viewport, HUD, modals, and mobile touch interface
├── styles.css       # Synthwave visual styles, scanlines, glow, and theme palettes
├── audio.js         # Procedural Web Audio API synth and spectrum visualizer
├── particles.js     # Particle physics engine and floating combat text
├── snake.js         # Snake entity, physics, boosting, and power-up states
├── ai.js            # Heuristic pathfinding and threat avoidance bot controller
├── p2p.js           # WebRTC DataChannel peer-to-peer multiplayer manager
├── game.js          # Core loop, collision detection, game modes, and leaderboard
└── README.md        # Documentation and controls guide
```

---

## 📜 License

MIT License. Free to play, fork, and modify!
