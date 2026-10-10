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

  - **⚡ Hyper-Drive Plasma Railgun**: Press `G` (or touch `RAILGUN`) to consume 2 ammo cores and discharge a hyper-velocity piercing particle beam. Blasts straight through lines of neon obstacles, deals +55 damage across multiple hostile snakes in a single shot (+300 bonus score per piercing strike), and features ionized sub-bass acoustics!
  - **💥 Cyber Shockwave Pulse Nova**: Press `T` (or touch `NOVA`) to discharge an expanding 360° kinetic shockwave ring. Deflects incoming hostile plasma projectiles in all directions, shatters nearby arena obstacles into energy cores, repels and stuns rival cyber snakes, and emits multi-ring holographic resonance acoustics!
  - **🛰️ Nanite Repair Drones & Hull Overshield**: Press `H` or `N` (or touch `REPAIR`) to launch 3 autonomous orbiting nanite repair micro-drones. Nanites actively reconstruct sheared tail nodes (+1 segment every 1.6s) and generate an ablative **Hull Overshield Barrier** that absorbs a fatal boundary or body impact to keep your run alive!
  - **🛡️ Kinetic Deflector Parry**: Press `V` (or touch `PARRY`) to deploy a rotating hexagonal barrier. Deflects incoming enemy plasma bolts back at the attacker at 1.5x velocity with electric matrix green sparks, awards +200 deflection points, and cuts through sweeping laser death beams!
  - **⚡ Temporal Matrix Overclock**: Hold `Z` or `X` (or touch `SLOW-MO`) to enter temporal bullet-time, slowing arena physics, hostile AI, and hazards down to 38% speed while you execute pinpoint evasive maneuvers!
  - **🌀 Linked Quantum Portals & Warp Overdrive**: Two active wormhole gates (`GATE α` [Cyan] and `GATE Ω` [Orange]) link across the arena with an animated chromatic spatial alignment vector beam. Traversing a portal triggers a 3.5s **Quantum Warp Overdrive** surge (+100 score, ghost invulnerability phase shimmer, concentric quantum rings, and dedicated HUD badge), plus vector guidance on the Holographic Tactical Radar!
  - **💣 Deployable Proximity Cyber Mines & EMP Combos**: Press `E` or `Q` to lay armed triangular mines behind your tail. Nearby mines link into glowing electric hazard arcs, and detonating one triggers cascading chain-reaction explosions. Collecting an EMP Core overloads all armed grid mines in a synchronized blast wave!
  - **⚡ Electric Proximity Hazard Arcs**: Armed mines positioned near each other automatically synchronize, creating animated high-voltage arcing fences that deny enemy maneuvering corridors.
  - **⏪ Vintage VCR Fatal Replay**: Relive your fatal crash in slow-motion with vintage retro VCR tracking lines, blinking `REC ●` indicators, tape static, and retro audio rewind effects.
  - **🎙️ Synthesized Cyber Voice Announcer**: Integrated robotic neural voice announcing game events in real-time (*"Grid initialized"*, *"Quantum warp"*, *"Anomaly detected"*, *"Critical failure"*).
  - **🌱 Seeded Daily Challenge Generator**: Enter a reproducible mission seed (e.g. `DAILY-2077`, `#NEXUS-01`) to generate deterministic arenas, competing on fair ground with identical obstacle and powerup spawns!
  - **🛠️ Cyber Forge Chassis Customizer**: Equip 4 distinct chassis head models (*Apex Visor*, *Mecha Horn*, *Cyber Skull*, *Tron Lightcycle*) and 4 customizable trail FX (*Neon Ribbon*, *Matrix Pulse*, *RGB Plasma*, *Hyperwave*).
  - **⚡ Tactical Drift / Cyber Brake**: Press `B` or `C` to scrub speed by 55%, carve tight pinpoint hairpins, and emit intense friction spark showers.
  - **🛰️ Holographic Tactical Radar**: Real-time minimap radar tracking food clusters, rival snake vectors, boss movements, portals, and mines.
  - **👻 Ghost Time-Trial Racer**: Automatically records your personal best solo run and plays it back as a neon shadow snake so you can race against your own record!
  - **⚡ Dynamic Grid Anomalies**: Random cosmic cyber weather events (*Solar Overcharge* with 2x score, *EMP Storm* clearing all barriers, *Neon Eclipse* stealth mode).
  - **⏱️ Slow-Mo Bullet-Time Death Cam**: High-impact time dilation (`0.22x` speed) on crashes with chromatic screen shudder.
  - **📊 Tactical Debrief Scorecard Exporter**: Generate encrypted mission reports, copy formatted ASCII debriefs to your clipboard, or save a high-res PNG scorecard snapshot directly from the game-over screen.
  - **📱 Progressive Web App (PWA) Offline Play**: Built with an offline Service Worker and Web App Manifest—installable as a native standalone desktop or mobile application.
  - **🎵 Multi-Track Procedural Jukebox**: Switch between 3 synthwave compositions (*Cyber City 2077* [124 BPM], *Outrun Sunset* [114 BPM], *Hyperdrive* [140 BPM]).

- **5 Intense Game Modes**:
  1. **⚡ Solo Cyber Run**: High-score survival against randomized laser barriers and escalating speeds.
  2. **🤖 Bot Battle Royale**: Arena deathmatch against AI snakes (*AI-Nexus* & *AI-Viper*) armed with plasma cannons and threat-evasion brains.
  3. **🐉 Boss Raid (Leviathan)**: Confront the armored *Cyber Leviathan*—a 16-segment behemoth with 120 HP, laser attacks, and boss health bars.
  4. **👥 Local 2-Player Versus**: Split keyboard duel on a single display (`WASD + Space + F` vs `Arrows + Enter + L`).
  5. **🌐 P2P Online Duel**: Zero-lag peer-to-peer multiplayer powered by WebRTC DataChannels (PeerJS). Instant 4-letter room code invite!

- **Cyber Combat & Power-Ups**:
  - **⚡ Plasma Cannon**: Press `F` / `J` to shoot high-velocity plasma bolts that shatter obstacles and shear enemy snake segments into collectible food bits!
  - **💣 Proximity Cyber Mines**: Press `E` / `Q` to drop stationary explosive proximity mines that trigger on enemy approach.
  - **🌀 Quantum Wormhole Gates**: Navigate through portals to escape pinches or launch cross-arena plasma cannon surprise shots.
  - **⚠️ Rotating Laser Sweep**: Central arena death beams that activate periodically and sweep 360° across the grid.
  - **Turbo Overdrive**: Hold `Space` / `Shift` for a 2x speed burst leaving burning neon thermal trails.
  - **Neon Energy Core (Cyan)**: Base energy (+10 pts, grows body, restores ammo and boost).
  - **Overdrive Core (Lime)**: Instantly recharges boost meter to 100% + gives temporary invulnerability.
  - **Phase Matrix (Purple)**: Ghost phase through lethal walls, lasers, and snake bodies for 6 seconds.
  - **EMP Shockwave (Yellow)**: Detonates an EMP ring clearing nearby obstacles and stunning enemy snakes.
  - **Multiplier Matrix (Orange)**: 3x score multiplier bonus.

- **Hall of Fame & Achievements**:
  - Persistent local leaderboard saving top scores, dates, and custom player handles.
  - In-game achievements toast system (Speed Demon, Ghost in the Net, Grid Blackout, Nexus Breaker, Plasma Deadeye, Leviathan Down, Century Mark).

- **Difficulty Settings**:
  - **Casual**: Relaxed speed and forgiving boundaries.
  - **Arcade**: Balanced retro arcade difficulty.
  - **Overclocked**: High-speed adrenaline rush for pro reflex gamers with active laser hazards.

- **Controller & Touch Ready**:
  - Full native **HTML5 Gamepad API** integration with vibration/rumble support (Xbox, PlayStation, Bluetooth controllers).
  - Virtual on-screen D-pad and dedicated **DRIFT**, **MINE**, **FIRE** & **TURBO** action buttons for mobile touchscreens.

---

## 🕹️ Controls Guide

| Action | Player 1 (Desktop) | Player 2 (Local 2P) | Gamepad (Controller) | Mobile / Touch |
| :--- | :--- | :--- | :--- | :--- |
| **Move** | `WASD` or `Arrow Keys` | `Arrow Keys` | Left Stick / D-Pad | `▲ ◀ ▼ ▶` D-Pad |
| **Turbo Overdrive** | `Space` or `Left Shift` | `Enter` or `Right Ctrl` | `A` Button / `RT` | `TURBO` Button |
| **Tactical Drift / Brake** | `B` or `C` | N/A | `B` Button / `LT` | `DRIFT` Button |
| **Kinetic Parry Barrier** | `V` | N/A | `X` Button / `LB` | `PARRY` Button |
| **Temporal Overclock** | `Z` or `X` | N/A | Left Trigger / `LT` | `SLOW-MO` Button |
| **Drop Proximity Mine** | `E` or `Q` | N/A | `Y` Button | `MINE` Button |
| **Shoot Plasma Cannon** | `F` or `J` | `L` or `Numpad 0` | Right Bumper / `RB` | `FIRE` Button |
| **Hyper-Drive Railgun** | `G` | N/A | Left Trigger / `LT` | `RAILGUN` Button |
| **Cyber Pulse Nova** | `T` | N/A | Right Stick / `R3` | `NOVA` Button |
| **Nanite Repair Swarm** | `H` or `N` | N/A | Right Stick / `R3` | `REPAIR` Button |
| **Instant VCR Replay** | `R` (on Game Over) | N/A | N/A | `VCR REPLAY` Button |
| **Pause / Resume** | `P` or `Escape` | `P` or `Escape` | `Start` Button | Tap anywhere |

---

## 🚀 Quick Start

### Option 1: Direct Browser Launch
Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari).

### Option 2: Local HTTP Server (Recommended for WebRTC P2P & PWA)
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
├── particles.js     # Particle physics engine, floating text, and drift friction sparks
├── snake.js         # Snake entity, physics, Cyber Forge heads, and trail renderers
├── ai.js            # Heuristic pathfinding and threat avoidance bot controller
├── p2p.js           # WebRTC DataChannel peer-to-peer multiplayer manager
├── game.js          # Core loop, collision detection, game modes, and debrief exporter
├── sw.js            # PWA Service Worker for complete offline play
├── manifest.json    # Web App Manifest for mobile/desktop installation
├── favicon.svg      # Cyberpunk neon snake SVG vector icon
└── README.md        # Documentation and controls guide
```

---

## 📜 License

MIT License. Free to play, fork, and modify!
