// NeonSnake 2077 - Main Game Engine
// Open-source synthwave canvas arcade game

class NeonSnakeGame {
    constructor() {
        this.canvas = document.getElementById('snakeCanvas') || document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Grid settings
        this.gridWidth = 36;
        this.gridHeight = 36;
        this.cellSize = 20;

        // Visual Canvas dimensions
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;

        // Game State
        this.mode = 'solo'; // 'solo', 'bots', 'boss', 'local2p', 'online'
        this.difficulty = 'arcade'; // 'casual', 'arcade', 'overclocked'
        this.theme = 'neon2077'; // 'neon2077', 'outrun', 'matrix', 'cyberpunk'
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('neonSnake_highScore') || '0', 10);
        this.combo = 1;
        this.comboTimer = 0;

        // Entities & Combat
        this.snakes = [];
        this.player1 = null;
        this.player2 = null;
        this.bossSnake = null;
        this.foods = [];
        this.obstacles = [];
        this.projectiles = [];

        // Laser Sweep Arena Hazard
        this.laserSweepTimer = 0;
        this.laserSweepActive = false;
        this.laserSweepAngle = 0;

        // Visual / Audio state
        this.cameraShake = 0;
        this.crtFilterEnabled = true;
        this.glowEnabled = true;

        // Gamepad State
        this.gamepadConnected = false;
        this.gamepadLastButtons = {};

        // Advanced Systems: Tactical Radar, Ghost Time-Trial, Cyber Anomalies, Death-Cam
        this.radarEnabled = true;
        this.ghostEnabled = true;
        this.currentRunRecord = [];
        this.bestRunRecord = JSON.parse(localStorage.getItem('neonSnake_bestRunReplay') || 'null');
        this.ghostStep = 0;

        this.activeAnomaly = null; // null, 'SOLAR_OVERCHARGE', 'EMP_STORM', 'NEON_ECLIPSE'
        this.anomalyTimer = 0;
        this.anomalyDuration = 0;

        this.deathCamActive = false;
        this.deathCamTimer = 0;
        this.timeDilation = 1.0;

        // Quantum Portals & Proximity Mines
        this.portals = [];
        this.mines = [];

        // Vintage VCR Death Replay System
        this.replayBuffer = [];
        this.isVcrReplaying = false;
        this.vcrPlaybackIndex = 0;

        // Seeded PRNG for Reproducible / Daily Challenge Runs
        this.customSeed = null;
        this.seedRng = null;

        // Color palettes for themes
        this.themes = {
            neon2077: {
                bg: '#060713',
                grid: '#0d1835',
                border: '#00f0ff',
                p1: { primary: '#00f0ff', secondary: '#0066aa', glow: '#00f0ff' },
                p2: { primary: '#ff007f', secondary: '#aa0055', glow: '#ff007f' },
                bot1: { primary: '#39ff14', secondary: '#1e8808', glow: '#39ff14' },
                bot2: { primary: '#ffe600', secondary: '#aa9900', glow: '#ffe600' }
            },
            outrun: {
                bg: '#14051a',
                grid: '#2f083a',
                border: '#ff00aa',
                p1: { primary: '#ff5e36', secondary: '#a82c0e', glow: '#ff5e36' },
                p2: { primary: '#00f0ff', secondary: '#007799', glow: '#00f0ff' },
                bot1: { primary: '#e000ff', secondary: '#770088', glow: '#e000ff' },
                bot2: { primary: '#ffe600', secondary: '#998800', glow: '#ffe600' }
            },
            matrix: {
                bg: '#030c04',
                grid: '#0a290d',
                border: '#39ff14',
                p1: { primary: '#39ff14', secondary: '#136b04', glow: '#39ff14' },
                p2: { primary: '#55ff77', secondary: '#15802d', glow: '#55ff77' },
                bot1: { primary: '#aaff55', secondary: '#4e8517', glow: '#aaff55' },
                bot2: { primary: '#ffffff', secondary: '#888888', glow: '#ffffff' }
            },
            cyberpunk: {
                bg: '#0a0b10',
                grid: '#201f05',
                border: '#ffe600',
                p1: { primary: '#ffe600', secondary: '#998800', glow: '#ffe600' },
                p2: { primary: '#00f0ff', secondary: '#007799', glow: '#00f0ff' },
                bot1: { primary: '#ff0055', secondary: '#880022', glow: '#ff0055' },
                bot2: { primary: '#39ff14', secondary: '#1e8808', glow: '#39ff14' }
            }
        };

        // Achievements system
        this.achievements = {
            firstCore: { id: 'firstCore', title: 'First Hack', desc: 'Collect your first energy core', unlocked: false },
            turboDash: { id: 'turboDash', title: 'Speed Demon', desc: 'Sustain turbo boost to empty', unlocked: false },
            phaseWalker: { id: 'phaseWalker', title: 'Ghost in the Net', desc: 'Phase shift through a lethal barrier', unlocked: false },
            empBlast: { id: 'empBlast', title: 'Grid Blackout', desc: 'Detonate an EMP shockwave', unlocked: false },
            botSlayer: { id: 'botSlayer', title: 'Nexus Breaker', desc: 'Destroy an enemy AI snake', unlocked: false },
            plasmaSniper: { id: 'plasmaSniper', title: 'Plasma Deadeye', desc: 'Blast and eliminate an enemy with plasma cannon', unlocked: false },
            bossHunter: { id: 'bossHunter', title: 'Leviathan Down', desc: 'Defeat the Cyber Leviathan Boss', unlocked: false },
            centuryScore: { id: 'centuryScore', title: 'Century Mark', desc: 'Score over 100 points in one run', unlocked: false }
        };
        this.loadAchievements();

        // Hall of Fame Leaderboard
        this.leaderboard = JSON.parse(localStorage.getItem('neonSnake_leaderboard') || '[]');

        // Timing
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTimer = 0;

        // P2P networking timer
        this.p2pSyncTimer = 0;

        this.initControls();
        this.setupEventListeners();
        this.updateHUD();
    }

    loadAchievements() {
        const saved = JSON.parse(localStorage.getItem('neonSnake_achievements') || '{}');
        for (const key in saved) {
            if (this.achievements[key]) {
                this.achievements[key].unlocked = saved[key];
            }
        }
    }

    unlockAchievement(id) {
        if (this.achievements[id] && !this.achievements[id].unlocked) {
            this.achievements[id].unlocked = true;
            const saved = {};
            for (const k in this.achievements) saved[k] = this.achievements[k].unlocked;
            localStorage.setItem('neonSnake_achievements', JSON.stringify(saved));
            this.showAchievementToast(this.achievements[id]);
        }
    }

    showAchievementToast(ach) {
        const toast = document.getElementById('achievementToast');
        if (toast) {
            toast.innerHTML = `🏆 <strong>ACHIEVEMENT UNLOCKED:</strong> ${ach.title}<br><span style="font-size:11px;color:#aaa;">${ach.desc}</span>`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }
        if (window.cyberAudio) window.cyberAudio.playPowerup();
    }

    initControls() {
        this.keys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Start audio on first user key/click
            if (window.cyberAudio) window.cyberAudio.init();

            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.isRunning && !this.gameOver) {
                    this.togglePause();
                }
                return;
            }

            if (!this.isRunning || this.isPaused || this.gameOver) return;

            // Player 1 controls (WASD / Arrows in solo)
            if (this.player1 && this.player1.isAlive) {
                if (e.code === 'KeyW' || (this.mode !== 'local2p' && e.code === 'ArrowUp')) {
                    this.player1.setDirection(0, -1);
                } else if (e.code === 'KeyS' || (this.mode !== 'local2p' && e.code === 'ArrowDown')) {
                    this.player1.setDirection(0, 1);
                } else if (e.code === 'KeyA' || (this.mode !== 'local2p' && e.code === 'ArrowLeft')) {
                    this.player1.setDirection(-1, 0);
                } else if (e.code === 'KeyD' || (this.mode !== 'local2p' && e.code === 'ArrowRight')) {
                    this.player1.setDirection(1, 0);
                }

                // Turbo Boost
                if (e.code === 'Space' || e.code === 'ShiftLeft') {
                    this.player1.setBoosting(true);
                    if (window.cyberAudio) window.cyberAudio.playBoost();
                }

                // Tactical Drift / Brake (B or C)
                if (e.code === 'KeyB' || e.code === 'KeyC') {
                    this.player1.setDrifting(true);
                    if (window.particleEngine && this.player1.body.length > 0) {
                        window.particleEngine.addDriftSparks(this.player1.body[0].pixelX, this.player1.body[0].pixelY, this.player1.dir);
                    }
                }

                // Plasma Cannon Fire (F or J)
                if (e.code === 'KeyF' || e.code === 'KeyJ') {
                    this.firePlayerPlasma(this.player1);
                }

                // Hyper Railgun Piercing Charge Beam (G)
                if (e.code === 'KeyG') {
                    this.firePlayerRailgun(this.player1);
                }

                // Deploy Proximity Cyber Mine (E or Q)
                if (e.code === 'KeyE' || e.code === 'KeyQ') {
                    this.deployPlayerMine(this.player1);
                }

                // Kinetic Parry / Deflector Barrier (V)
                if (e.code === 'KeyV') {
                    this.player1.triggerParry();
                }

                // Temporal Matrix Overclock (Z or X)
                if (e.code === 'KeyZ' || e.code === 'KeyX') {
                    this.player1.setOverclock(true);
                }

                // Nanite Repair Drone Swarm (H or N)
                if (e.code === 'KeyH' || e.code === 'KeyN') {
                    this.player1.triggerNanites();
                }

                // Cyber Shockwave Pulse Nova (T)
                if (e.code === 'KeyT') {
                    this.triggerPlayerPulseNova(this.player1);
                }

                // Send P2P input if in online mode
                if (this.mode === 'online' && !window.cyberP2P.isHost) {
                    window.cyberP2P.send({
                        type: 'INPUT_MOVE',
                        dir: this.player1.dirQueue.length > 0 ? this.player1.dirQueue[this.player1.dirQueue.length - 1] : this.player1.dir,
                        boost: this.player1.isBoosting
                    });
                }
            }

            // VCR Replay Keyboard Shortcuts
            if (this.isVcrReplaying && (e.code === 'Escape' || e.code === 'Space')) {
                this.stopVcrReplay();
            } else if (this.gameOver && e.code === 'KeyR') {
                this.startVcrReplay();
            }

            // Player 2 controls (Arrow keys in local 2-Player mode)
            if (this.mode === 'local2p' && this.player2 && this.player2.isAlive) {
                if (e.code === 'ArrowUp') this.player2.setDirection(0, -1);
                else if (e.code === 'ArrowDown') this.player2.setDirection(0, 1);
                else if (e.code === 'ArrowLeft') this.player2.setDirection(-1, 0);
                else if (e.code === 'ArrowRight') this.player2.setDirection(1, 0);

                if (e.code === 'Enter' || e.code === 'ControlRight') {
                    this.player2.setBoosting(true);
                }

                if (e.code === 'Numpad0' || e.code === 'KeyL') {
                    this.firePlayerPlasma(this.player2);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (this.player1) {
                if (e.code === 'Space' || e.code === 'ShiftLeft') {
                    this.player1.setBoosting(false);
                    if (this.mode === 'online' && !window.cyberP2P.isHost) {
                        window.cyberP2P.send({ type: 'INPUT_BOOST', boost: false });
                    }
                }

                if (e.code === 'KeyB' || e.code === 'KeyC') {
                    this.player1.setDrifting(false);
                }

                if (e.code === 'KeyZ' || e.code === 'KeyX') {
                    this.player1.setOverclock(false);
                }
            }

            if (this.mode === 'local2p' && this.player2) {
                if (e.code === 'Enter' || e.code === 'ControlRight') {
                    this.player2.setBoosting(false);
                }
            }
        });

        // Gamepad event listeners
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepadConnected = true;
            window.particleEngine.addText('GAMEPAD LINKED', this.canvas.width / 2, this.canvas.height / 2, '#39ff14', 18);
        });
        window.addEventListener('gamepaddisconnected', () => {
            this.gamepadConnected = false;
        });
    }

    firePlayerPlasma(snake) {
        if (!snake || !snake.isAlive) return;
        const proj = snake.shootPlasma();
        if (proj) {
            this.projectiles.push(proj);
            this.cameraShake = Math.max(this.cameraShake, 0.15);
            this.updateHUD();
        }
    }

    firePlayerRailgun(snake) {
        if (!snake || !snake.isAlive) return;
        const proj = snake.shootRailgun();
        if (proj) {
            this.projectiles.push(proj);
            this.cameraShake = Math.max(this.cameraShake, 0.45);
            if (window.particleEngine) {
                window.particleEngine.spawnRailgunImpact(proj.x, proj.y);
                window.particleEngine.addText('⚡ HYPER RAILGUN!', proj.x, proj.y - 20, '#ffe600', 18);
            }
            this.updateHUD();
        } else if (snake.ammo < 2 && snake === this.player1 && snake.body.length > 0) {
            if (window.particleEngine) {
                window.particleEngine.addText('NEED 2 AMMO', snake.body[0].pixelX, snake.body[0].pixelY - 18, '#ff0055', 13);
            }
        }
    }

    triggerPlayerPulseNova(snake) {
        if (!snake || !snake.isAlive) return;
        const triggered = snake.triggerPulseNova();
        if (triggered && snake.body.length > 0) {
            const hx = snake.body[0].pixelX;
            const hy = snake.body[0].pixelY;
            this.cameraShake = Math.max(this.cameraShake, 0.5);

            // 1. Shatter nearby obstacles
            const novaRadius = this.cellSize * 5.0;
            this.obstacles = this.obstacles.filter(obs => {
                const ox = obs.x * this.cellSize + this.cellSize / 2;
                const oy = obs.y * this.cellSize + this.cellSize / 2;
                if (Math.hypot(ox - hx, oy - hy) <= novaRadius) {
                    if (window.particleEngine) {
                        window.particleEngine.spawnBurst(ox, oy, '#00f0ff', 12, 3);
                    }
                    if (snake === this.player1) this.score += 25;
                    return false;
                }
                return true;
            });

            // 2. Repel and redirect incoming projectiles
            for (const p of this.projectiles) {
                if (Math.hypot(p.x - hx, p.y - hy) <= novaRadius * 1.3) {
                    const angle = Math.atan2(p.y - hy, p.x - hx);
                    const speed = Math.hypot(p.vx, p.vy) * 1.4;
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                    p.owner = snake;
                    p.color = '#00f0ff';
                    p.life = 1.2;
                    if (window.particleEngine) {
                        window.particleEngine.spawnBurst(p.x, p.y, '#00f0ff', 6, 2);
                    }
                }
            }

            // 3. Repel and stun enemy snakes
            for (const other of this.snakes) {
                if (other === snake || !other.isAlive || other.body.length === 0) continue;
                const dist = Math.hypot(other.body[0].pixelX - hx, other.body[0].pixelY - hy);
                if (dist <= novaRadius * 1.2) {
                    other.moveTimer = -0.55;
                    other.takeDamage(35);
                    if (window.particleEngine) {
                        window.particleEngine.addText('REPULSED!', other.body[0].pixelX, other.body[0].pixelY - 20, '#ff007f', 16);
                    }
                }
            }

            this.updateHUD();
        }
    }

    pollGamepad() {
        if (!navigator.getGamepads) return;
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0];
        if (!gp || !this.player1 || !this.player1.isAlive) return;

        // Stick / D-Pad axes
        const axisX = gp.axes[0] || 0;
        const axisY = gp.axes[1] || 0;
        const deadzone = 0.45;

        // Direction mapping
        if (axisY < -deadzone || gp.buttons[12]?.pressed) {
            this.player1.setDirection(0, -1);
        } else if (axisY > deadzone || gp.buttons[13]?.pressed) {
            this.player1.setDirection(0, 1);
        } else if (axisX < -deadzone || gp.buttons[14]?.pressed) {
            this.player1.setDirection(-1, 0);
        } else if (axisX > deadzone || gp.buttons[15]?.pressed) {
            this.player1.setDirection(1, 0);
        }

        // Boost (A button or Right Trigger)
        const boostPressed = gp.buttons[0]?.pressed || gp.buttons[7]?.pressed;
        this.player1.setBoosting(boostPressed);

        // Tactical Drift / Brake (B button or Left Trigger)
        const driftPressed = !!(gp.buttons[1]?.pressed || gp.buttons[6]?.pressed);
        this.player1.setDrifting(driftPressed);
        if (driftPressed && window.particleEngine && this.player1.body.length > 0) {
            window.particleEngine.addDriftSparks(this.player1.body[0].pixelX, this.player1.body[0].pixelY, this.player1.dir);
        }

        // Shoot Plasma (X button or Right Bumper)
        const shootPressed = gp.buttons[2]?.pressed || gp.buttons[5]?.pressed;
        if (shootPressed && !this.gamepadLastButtons.shoot) {
            this.firePlayerPlasma(this.player1);
            if (gp.vibrationActuator && gp.vibrationActuator.playEffect) {
                gp.vibrationActuator.playEffect('dual-rumble', {
                    startDelay: 0,
                    duration: 120,
                    weakMagnitude: 0.6,
                    strongMagnitude: 0.3
                });
            }
        }
        this.gamepadLastButtons.shoot = shootPressed;

        // Deploy Proximity Mine (Y button or Left Bumper)
        const minePressed = gp.buttons[3]?.pressed || gp.buttons[4]?.pressed;
        if (minePressed && !this.gamepadLastButtons.mine) {
            this.deployPlayerMine(this.player1);
        }
        this.gamepadLastButtons.mine = minePressed;

        // Hyper Railgun (Left Trigger button 6)
        const railgunPressed = gp.buttons[6]?.pressed;
        if (railgunPressed && !this.gamepadLastButtons.railgun) {
            this.firePlayerRailgun(this.player1);
        }
        this.gamepadLastButtons.railgun = railgunPressed;
    }

    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                const mode = e.currentTarget.dataset.mode;
                this.setMode(mode);
            });
        });

        // Difficulty selector
        const diffSelect = document.getElementById('difficultySelect');
        if (diffSelect) {
            diffSelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                if (window.cyberAudio) window.cyberAudio.playClick();
            });
        }

        // Theme selector
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.theme = e.target.value;
                document.body.className = `theme-${this.theme}`;
                if (window.cyberAudio) window.cyberAudio.playClick();
            });
        }

        // Cyber Forge Selectors
        const headModelSelect = document.getElementById('headModelSelect');
        if (headModelSelect) {
            headModelSelect.value = localStorage.getItem('neonSnake_headModel') || 'apex';
            headModelSelect.addEventListener('change', (e) => {
                localStorage.setItem('neonSnake_headModel', e.target.value);
                if (this.player1) this.player1.headModel = e.target.value;
                if (window.cyberAudio) window.cyberAudio.playClick();
            });
        }

        const trailStyleSelect = document.getElementById('trailStyleSelect');
        if (trailStyleSelect) {
            trailStyleSelect.value = localStorage.getItem('neonSnake_trailStyle') || 'ribbon';
            trailStyleSelect.addEventListener('change', (e) => {
                localStorage.setItem('neonSnake_trailStyle', e.target.value);
                if (this.player1) this.player1.trailStyle = e.target.value;
                if (window.cyberAudio) window.cyberAudio.playClick();
            });
        }

        // Tactical Debrief Buttons
        const copyDebriefBtn = document.getElementById('btnCopyDebrief');
        if (copyDebriefBtn) {
            copyDebriefBtn.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                this.exportTacticalDebrief();
            });
        }

        const downloadSnapshotBtn = document.getElementById('btnDownloadSnapshot');
        if (downloadSnapshotBtn) {
            downloadSnapshotBtn.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                this.downloadDebriefSnapshot();
            });
        }

        // Vintage VCR Death Replay Button
        const vcrBtn = document.getElementById('btnVcrReplay');
        if (vcrBtn) {
            vcrBtn.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                this.startVcrReplay();
            });
        }

        // Voice Announcer Toggle Button
        const voiceBtn = document.getElementById('voiceToggleBtn');
        if (voiceBtn) {
            const isVoiceOn = localStorage.getItem('neonSnake_voiceEnabled') !== 'false';
            voiceBtn.innerText = isVoiceOn ? '🎙️ VOICE ON' : '🎙️ VOICE OFF';
            voiceBtn.classList.toggle('active', isVoiceOn);
            voiceBtn.addEventListener('click', () => {
                if (window.cyberAudio) {
                    const next = window.cyberAudio.toggleVoice();
                    voiceBtn.innerText = next ? '🎙️ VOICE ON' : '🎙️ VOICE OFF';
                    voiceBtn.classList.toggle('active', next);
                    window.cyberAudio.playClick();
                    if (next) window.cyberAudio.announce('Comms online.');
                }
            });
        }

        // Mission Seed Input for Reproducible Daily Challenge
        const seedInput = document.getElementById('missionSeedInput');
        if (seedInput) {
            seedInput.addEventListener('input', (e) => {
                this.customSeed = e.target.value.trim() || null;
            });
        }

        // Canvas click handler (exits VCR replay if active)
        this.canvas.addEventListener('click', () => {
            if (this.isVcrReplaying) {
                if (window.cyberAudio) window.cyberAudio.playClick();
                this.stopVcrReplay();
            }
        });

        // Start / Restart / Resume buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            if (window.cyberAudio) {
                window.cyberAudio.playClick();
                window.cyberAudio.startMusic();
            }
            this.startGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            if (window.cyberAudio) window.cyberAudio.playClick();
            this.saveLeaderboardScore();
            this.startGame();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            if (window.cyberAudio) window.cyberAudio.playClick();
            this.togglePause();
        });

        // Leaderboard modal toggle
        const lbBtn = document.getElementById('leaderboardBtn');
        const lbModal = document.getElementById('leaderboardModal');
        const lbClose = document.getElementById('closeLeaderboardBtn');

        if (lbBtn && lbModal) {
            lbBtn.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                this.renderLeaderboard();
                lbModal.style.display = 'flex';
            });
        }
        if (lbClose && lbModal) {
            lbClose.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                lbModal.style.display = 'none';
            });
        }

        // Audio toggle
        const audioBtn = document.getElementById('audioToggleBtn');
        audioBtn.addEventListener('click', () => {
            if (window.cyberAudio) {
                const muted = window.cyberAudio.toggleMute();
                audioBtn.innerHTML = muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
                audioBtn.classList.toggle('muted', muted);
            }
        });

        // CRT filter toggle
        const crtToggle = document.getElementById('crtToggleBtn');
        if (crtToggle) {
            crtToggle.addEventListener('click', () => {
                this.crtFilterEnabled = !this.crtFilterEnabled;
                document.getElementById('crtOverlay').style.display = this.crtFilterEnabled ? 'block' : 'none';
                crtToggle.classList.toggle('active', this.crtFilterEnabled);
                if (window.cyberAudio) window.cyberAudio.playClick();
            });
        }

        // P2P Room Host / Join Buttons
        const hostBtn = document.getElementById('p2pHostBtn');
        const joinBtn = document.getElementById('p2pJoinBtn');
        const roomInput = document.getElementById('p2pRoomInput');
        const p2pStatus = document.getElementById('p2pStatus');

        if (hostBtn) {
            hostBtn.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                p2pStatus.innerText = 'Creating room...';
                window.cyberP2P.initHost({
                    onHostReady: (code) => {
                        p2pStatus.innerHTML = `ROOM: <span class="neon-highlight">${code}</span> (Waiting for rival...)`;
                        roomInput.value = code;
                    },
                    onConnected: () => {
                        p2pStatus.innerText = 'RIVAL CONNECTED! Starting Duel...';
                        setTimeout(() => this.startGame(), 1200);
                    },
                    onDisconnected: () => {
                        p2pStatus.innerText = 'Rival disconnected.';
                    },
                    onData: (data) => this.handleP2PData(data),
                    onError: (err) => { p2pStatus.innerText = `Error: ${err}`; }
                });
            });
        }

        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                if (window.cyberAudio) window.cyberAudio.playClick();
                const code = roomInput.value.trim();
                if (!code) {
                    p2pStatus.innerText = 'Please enter a 4-letter room code!';
                    return;
                }
                p2pStatus.innerText = `Connecting to ${code}...`;
                window.cyberP2P.initClient(code, {
                    onConnected: () => {
                        p2pStatus.innerText = 'CONNECTED TO HOST! Duel starting...';
                    },
                    onDisconnected: () => {
                        p2pStatus.innerText = 'Host disconnected.';
                    },
                    onData: (data) => this.handleP2PData(data),
                    onError: (err) => { p2pStatus.innerText = `Error: ${err}`; }
                });
            });
        }

        // Procedural Track Switcher
        const trackBtn = document.getElementById('trackToggleBtn');
        if (trackBtn) {
            trackBtn.addEventListener('click', () => {
                if (window.cyberAudio) {
                    const nextTrk = window.cyberAudio.nextTrack();
                    trackBtn.innerText = `🎵 ${nextTrk.name.split(' ')[0]}`;
                    window.particleEngine.addText(`TRACK: ${nextTrk.name}`, this.canvas.width / 2, 80, '#00f0ff', 15);
                }
            });
        }

        // Radar Minimap Toggle
        const radarBtn = document.getElementById('radarToggleBtn');
        if (radarBtn) {
            radarBtn.addEventListener('click', () => {
                this.radarEnabled = !this.radarEnabled;
                radarBtn.classList.toggle('active', this.radarEnabled);
                radarBtn.innerText = this.radarEnabled ? 'RADAR ON' : 'RADAR OFF';
                if (window.cyberAudio) window.cyberAudio.playClick();
            });
        }

        // Virtual Touch Controls for Mobile
        this.setupTouchControls();
    }

    setupTouchControls() {
        const bindTouch = (id, action) => {
            const el = document.getElementById(id);
            if (!el) return;
            const trigger = (e) => {
                e.preventDefault();
                if (window.cyberAudio) window.cyberAudio.init();
                action();
            };
            el.addEventListener('touchstart', trigger, { passive: false });
            el.addEventListener('mousedown', trigger);
        };

        bindTouch('touchUp', () => this.player1 && this.player1.setDirection(0, -1));
        bindTouch('touchDown', () => this.player1 && this.player1.setDirection(0, 1));
        bindTouch('touchLeft', () => this.player1 && this.player1.setDirection(-1, 0));
        bindTouch('touchRight', () => this.player1 && this.player1.setDirection(1, 0));

        const boostBtn = document.getElementById('touchBoost');
        if (boostBtn) {
            const startBoost = (e) => {
                e.preventDefault();
                if (this.player1) {
                    this.player1.setBoosting(true);
                    if (window.cyberAudio) window.cyberAudio.playBoost();
                }
            };
            const endBoost = (e) => {
                e.preventDefault();
                if (this.player1) this.player1.setBoosting(false);
            };
            boostBtn.addEventListener('touchstart', startBoost, { passive: false });
            boostBtn.addEventListener('touchend', endBoost, { passive: false });
            boostBtn.addEventListener('mousedown', startBoost);
            boostBtn.addEventListener('mouseup', endBoost);
        }

        // Virtual Drift button
        const driftBtn = document.getElementById('touchDrift');
        if (driftBtn) {
            const startDrift = (e) => {
                e.preventDefault();
                if (this.player1) {
                    this.player1.setDrifting(true);
                    if (window.particleEngine && this.player1.body.length > 0) {
                        window.particleEngine.addDriftSparks(this.player1.body[0].pixelX, this.player1.body[0].pixelY, this.player1.dir);
                    }
                }
            };
            const endDrift = (e) => {
                e.preventDefault();
                if (this.player1) this.player1.setDrifting(false);
            };
            driftBtn.addEventListener('touchstart', startDrift, { passive: false });
            driftBtn.addEventListener('touchend', endDrift, { passive: false });
            driftBtn.addEventListener('mousedown', startDrift);
            driftBtn.addEventListener('mouseup', endDrift);
        }

        // Virtual Fire button
        const fireBtn = document.getElementById('touchFire');
        if (fireBtn) {
            bindTouch('touchFire', () => {
                this.firePlayerPlasma(this.player1);
            });
        }

        // Virtual Mine button
        const mineTouchBtn = document.getElementById('touchMine');
        if (mineTouchBtn) {
            bindTouch('touchMine', () => {
                this.deployPlayerMine(this.player1);
            });
        }

        // Virtual Parry Deflector button
        const parryTouchBtn = document.getElementById('touchParry');
        if (parryTouchBtn) {
            bindTouch('touchParry', () => {
                if (this.player1) this.player1.triggerParry();
            });
        }

        // Virtual Hyper Railgun button
        const railgunTouchBtn = document.getElementById('touchRailgun');
        if (railgunTouchBtn) {
            bindTouch('touchRailgun', () => {
                this.firePlayerRailgun(this.player1);
            });
        }

        // Virtual Temporal Overclock button
        const overclockBtn = document.getElementById('touchOverclock');
        if (overclockBtn) {
            const startOverclock = (e) => {
                e.preventDefault();
                if (this.player1) this.player1.setOverclock(true);
            };
            const endOverclock = (e) => {
                e.preventDefault();
                if (this.player1) this.player1.setOverclock(false);
            };
            overclockBtn.addEventListener('touchstart', startOverclock, { passive: false });
            overclockBtn.addEventListener('touchend', endOverclock, { passive: false });
            overclockBtn.addEventListener('mousedown', startOverclock);
            overclockBtn.addEventListener('mouseup', endOverclock);
        }

        // Virtual Nanite Repair button
        const repairTouchBtn = document.getElementById('touchRepair');
        if (repairTouchBtn) {
            bindTouch('touchRepair', () => {
                if (this.player1) this.player1.triggerNanites();
            });
        }

        // Virtual Cyber Shockwave Nova button
        const novaTouchBtn = document.getElementById('touchNova');
        if (novaTouchBtn) {
            bindTouch('touchNova', () => {
                this.triggerPlayerPulseNova(this.player1);
            });
        }
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide P2P lobby panel
        const p2pLobby = document.getElementById('p2pLobby');
        if (p2pLobby) {
            p2pLobby.style.display = mode === 'online' ? 'block' : 'none';
        }

        // Update instruction text
        const instructions = document.getElementById('modeInstructions');
        if (instructions) {
            if (mode === 'solo') {
                instructions.innerText = 'SURVIVAL MODE: Dodge laser obstacles & rotating sweep rays, gather cyber cores, fire plasma cannon [F]!';
            } else if (mode === 'bots') {
                instructions.innerText = 'BOT BATTLE: Arena deathmatch against AI snakes with intelligent pathfinding, traps & laser fire!';
            } else if (mode === 'boss') {
                instructions.innerText = 'BOSS RAID: Defeat CYBER LEVIATHAN—an armored 16-segment behemoth with plasma cannons and 120 HP!';
            } else if (mode === 'local2p') {
                instructions.innerText = 'LOCAL 2P: P1 (WASD + Space + F). P2 (Arrows + Enter + L). First to crash loses!';
            } else if (mode === 'online') {
                instructions.innerText = 'P2P MULTIPLAYER: Create or join a room via WebRTC DataChannel to duel directly!';
            }
        }
    }

    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.gameOver = false;
        this.score = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.snakes = [];
        this.foods = [];
        this.obstacles = [];
        this.projectiles = [];
        this.mines = [];
        this.portals = [];
        this.replayBuffer = [];
        this.isVcrReplaying = false;
        this.laserSweepTimer = 0;
        this.laserSweepActive = false;
        this.laserSweepAngle = 0;
        this.currentRunRecord = [];
        this.ghostStep = 0;
        this.activeAnomaly = null;
        this.anomalyTimer = 0;
        this.deathCamActive = false;
        this.timeDilation = 1.0;
        window.particleEngine.clear();

        // Initialize PRNG if custom seed specified
        if (this.customSeed) {
            this.initSeedRng(this.customSeed);
            window.particleEngine.addText(`SEED: ${this.customSeed}`, this.canvas.width / 2, 90, '#ffe600', 14);
        } else {
            this.seedRng = null;
        }

        // Voice announcement
        if (window.cyberAudio) {
            window.cyberAudio.announce("Grid initialized. Commencing run.");
        }

        // Speed interval based on difficulty
        let baseSpeed = 0.11;
        if (this.difficulty === 'casual') baseSpeed = 0.14;
        else if (this.difficulty === 'overclocked') baseSpeed = 0.08;

        const currentTheme = this.themes[this.theme] || this.themes.neon2077;

        // Hide overlay modals
        document.getElementById('startModal').style.display = 'none';
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('pauseModal').style.display = 'none';

        // Spawn entities according to mode
        if (this.mode === 'solo') {
            this.player1 = new CyberSnake('p1', 'NEON RUNNER', currentTheme.p1, 10, 18, { x: 1, y: 0 });
            this.player1.baseMoveInterval = baseSpeed;
            this.snakes.push(this.player1);
            this.generateObstacles(this.difficulty === 'overclocked' ? 8 : (this.difficulty === 'casual' ? 4 : 6));
        } else if (this.mode === 'bots') {
            this.player1 = new CyberSnake('p1', 'YOU', currentTheme.p1, 8, 8, { x: 1, y: 0 });
            this.player1.baseMoveInterval = baseSpeed;

            const bot1 = new CyberSnake('bot1', 'AI-NEXUS', currentTheme.p2, 27, 27, { x: -1, y: 0 }, true);
            const bot2 = new CyberSnake('bot2', 'AI-VIPER', currentTheme.bot1, 27, 8, { x: 0, y: 1 }, true);
            bot1.baseMoveInterval = baseSpeed * 1.05;
            bot2.baseMoveInterval = baseSpeed * 1.05;

            this.snakes.push(this.player1, bot1, bot2);
            this.generateObstacles(4);
        } else if (this.mode === 'boss') {
            this.player1 = new CyberSnake('p1', 'YOU', currentTheme.p1, 6, 18, { x: 1, y: 0 });
            this.player1.baseMoveInterval = baseSpeed;

            this.bossSnake = new CyberSnake('boss', 'CYBER LEVIATHAN', currentTheme.p2, 28, 18, { x: -1, y: 0 }, true);
            this.bossSnake.isBoss = true;
            this.bossSnake.bossHealth = 120;
            this.bossSnake.maxBossHealth = 120;
            this.bossSnake.baseMoveInterval = baseSpeed * 1.15;
            for (let i = 0; i < 12; i++) this.bossSnake.grow();

            this.snakes.push(this.player1, this.bossSnake);
            this.generateObstacles(4);
            if (window.cyberAudio) window.cyberAudio.playBossAlarm();
        } else if (this.mode === 'local2p') {
            this.player1 = new CyberSnake('p1', 'PLAYER 1', currentTheme.p1, 8, 18, { x: 1, y: 0 });
            this.player2 = new CyberSnake('p2', 'PLAYER 2', currentTheme.p2, 27, 18, { x: -1, y: 0 });
            this.player1.baseMoveInterval = baseSpeed;
            this.player2.baseMoveInterval = baseSpeed;
            this.snakes.push(this.player1, this.player2);
            this.generateObstacles(4);
        } else if (this.mode === 'online') {
            this.player1 = new CyberSnake('p1', 'HOST', currentTheme.p1, 8, 18, { x: 1, y: 0 });
            this.player2 = new CyberSnake('p2', 'GUEST', currentTheme.p2, 27, 18, { x: -1, y: 0 });
            this.player1.baseMoveInterval = baseSpeed;
            this.player2.baseMoveInterval = baseSpeed;
            this.snakes.push(this.player1, this.player2);
        }

        // Apply Cyber Forge preferences to Player 1
        if (this.player1) {
            this.player1.headModel = localStorage.getItem('neonSnake_headModel') || 'apex';
            this.player1.trailStyle = localStorage.getItem('neonSnake_trailStyle') || 'ribbon';
        }

        // Spawn initial food batches
        for (let i = 0; i < 6; i++) {
            this.spawnFood();
        }

        // Spawn Linked Quantum Portals
        this.spawnPortals();

        this.updateHUD();
    }

    initSeedRng(seedStr) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
        }
        let a = h >>> 0;
        this.seedRng = function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    random() {
        return this.seedRng ? this.seedRng() : Math.random();
    }

    findFreeGridPos() {
        let x, y, occupied;
        let attempts = 0;
        do {
            x = Math.floor(this.random() * (this.gridWidth - 6)) + 3;
            y = Math.floor(this.random() * (this.gridHeight - 6)) + 3;
            occupied = this.isOccupied(x, y);
            attempts++;
        } while (occupied && attempts < 100);
        return { x, y };
    }

    spawnPortals() {
        this.portals = [];
        const p1 = this.findFreeGridPos();
        const p2 = this.findFreeGridPos();

        this.portals.push({
            id: 'alpha',
            name: 'PORTAL α',
            x: p1.x,
            y: p1.y,
            pixelX: p1.x * this.cellSize + this.cellSize / 2,
            pixelY: p1.y * this.cellSize + this.cellSize / 2,
            color: '#00f0ff',
            targetIndex: 1,
            pulse: 0
        });

        this.portals.push({
            id: 'omega',
            name: 'PORTAL Ω',
            x: p2.x,
            y: p2.y,
            pixelX: p2.x * this.cellSize + this.cellSize / 2,
            pixelY: p2.y * this.cellSize + this.cellSize / 2,
            color: '#ff7700',
            targetIndex: 0,
            pulse: Math.PI
        });
    }

    deployPlayerMine(snake) {
        if (!snake || !snake.isAlive) return;
        const mine = snake.deployMine();
        if (mine) {
            this.mines.push(mine);
            if (window.particleEngine) {
                window.particleEngine.addText('MINE ARMED', mine.pixelX, mine.pixelY - 12, '#ffe600', 12);
            }
            this.updateHUD();
        }
    }

    updatePortals(dt) {
        for (const portal of this.portals) {
            portal.pulse = (portal.pulse + dt * 4) % (Math.PI * 2);
        }

        // Projectiles entering portals
        for (const proj of this.projectiles) {
            for (const p of this.portals) {
                const dist = Math.hypot(proj.x - p.pixelX, proj.y - p.pixelY);
                if (dist < this.cellSize * 0.9 && !proj.teleported) {
                    const target = this.portals[p.targetIndex];
                    if (target) {
                        proj.x = target.pixelX + (proj.vx > 0 ? 16 : (proj.vx < 0 ? -16 : 0));
                        proj.y = target.pixelY + (proj.vy > 0 ? 16 : (proj.vy < 0 ? -16 : 0));
                        proj.teleported = true;
                        if (window.particleEngine) {
                            window.particleEngine.spawnPortalWarp(p.pixelX, p.pixelY, p.color, 8);
                            window.particleEngine.spawnPortalWarp(target.pixelX, target.pixelY, target.color, 8);
                        }
                    }
                    break;
                }
            }
        }
    }

    updateMines(dt) {
        for (let m = this.mines.length - 1; m >= 0; m--) {
            const mine = this.mines[m];
            mine.life -= dt;
            if (mine.armTimer > 0) {
                mine.armTimer -= dt;
                if (mine.armTimer <= 0) mine.isArmed = true;
            }

            if (mine.life <= 0) {
                this.mines.splice(m, 1);
                continue;
            }

            if (mine.isArmed) {
                let triggered = false;
                for (const snake of this.snakes) {
                    if (!snake.isAlive || snake.body.length === 0) continue;
                    if (snake === mine.owner && mine.life > 23.5) continue;

                    for (const seg of snake.body) {
                        const dist = Math.hypot(seg.pixelX - mine.pixelX, seg.pixelY - mine.pixelY);
                        if (dist < this.cellSize * 1.5) {
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) break;
                }

                if (!triggered) {
                    for (const proj of this.projectiles) {
                        if (Math.hypot(proj.x - mine.pixelX, proj.y - mine.pixelY) < this.cellSize) {
                            triggered = true;
                            break;
                        }
                    }
                }

                if (triggered) {
                    this.detonateMine(mine, 1);
                }
            }
        }
    }

    detonateMine(mine, chainIndex = 1) {
        const mineIdx = this.mines.indexOf(mine);
        if (mineIdx === -1) return;
        this.mines.splice(mineIdx, 1);

        const owner = mine.owner;
        const chainBonus = chainIndex * 150;
        if (owner) {
            owner.score += chainBonus;
            if (chainIndex > 1) {
                owner.mineChainCount = (owner.mineChainCount || 0) + 1;
            }
        }

        if (window.particleEngine) {
            if (chainIndex > 1) {
                window.particleEngine.spawnMineChainExplosion(mine.pixelX, mine.pixelY, chainIndex);
            } else {
                window.particleEngine.spawnMineExplosion(mine.pixelX, mine.pixelY);
                window.particleEngine.addText('MINE DETONATED!', mine.pixelX, mine.pixelY - 18, '#ff0055', 18);
            }
        }

        if (window.cyberAudio) {
            if (chainIndex > 1) {
                window.cyberAudio.playMineChain(chainIndex);
                if (chainIndex >= 3) {
                    window.cyberAudio.announce('Maximum chain detonation', true);
                }
            } else {
                window.cyberAudio.playMineDetonate();
            }
        }

        this.cameraShake = Math.max(this.cameraShake, Math.min(0.8, 0.35 + chainIndex * 0.1));

        for (const snake of this.snakes) {
            if (!snake.isAlive || snake.body.length === 0) continue;
            const headDist = Math.hypot(snake.body[0].pixelX - mine.pixelX, snake.body[0].pixelY - mine.pixelY);
            if (headDist < this.cellSize * 3.5) {
                if (snake.isBoss) {
                    const dmg = 40 + chainIndex * 10;
                    snake.takeDamage(dmg);
                    if (window.particleEngine) {
                        window.particleEngine.addText(`-${dmg} HP`, snake.body[0].pixelX, snake.body[0].pixelY - 25, '#ffe600', 18);
                    }
                } else if (snake !== mine.owner) {
                    const dropCount = Math.min(3, Math.max(1, snake.body.length - 2));
                    for (let k = 0; k < dropCount; k++) {
                        const popped = snake.body.pop();
                        if (popped) {
                            this.foods.push({
                                x: popped.x,
                                y: popped.y,
                                pixelX: popped.pixelX,
                                pixelY: popped.pixelY,
                                type: 'normal',
                                color: '#ff0055',
                                points: 15,
                                createdAt: performance.now()
                            });
                        }
                    }
                }
            }
        }

        this.obstacles = this.obstacles.filter(obs => {
            const obPixX = obs.x * this.cellSize + this.cellSize / 2;
            const obPixY = obs.y * this.cellSize + this.cellSize / 2;
            return Math.hypot(obPixX - mine.pixelX, obPixY - mine.pixelY) > this.cellSize * 2.2;
        });

        // Cascading chain reaction: detonate adjacent armed mines
        const chainRadius = this.cellSize * 4.8;
        const adjacentMines = this.mines.filter(other => {
            if (!other.isArmed || other === mine) return false;
            return Math.hypot(other.pixelX - mine.pixelX, other.pixelY - mine.pixelY) <= chainRadius;
        });

        for (const adj of adjacentMines) {
            if (window.particleEngine) {
                window.particleEngine.spawnElectricArc(mine.pixelX, mine.pixelY, adj.pixelX, adj.pixelY, '#00f0ff');
            }
            this.detonateMine(adj, chainIndex + 1);
        }
    }

    recordReplayFrame() {
        if (!this.player1 || this.player1.body.length === 0) return;
        const frame = {
            p1: {
                dir: { ...this.player1.dir },
                body: this.player1.body.map(s => ({ x: s.x, y: s.y, px: s.pixelX, py: s.pixelY })),
                score: this.player1.score,
                isBoosting: this.player1.isBoosting
            },
            snakes: this.snakes.filter(s => s !== this.player1 && s.isAlive).map(s => ({
                id: s.id,
                head: { px: s.body[0]?.pixelX, py: s.body[0]?.pixelY },
                color: s.colorScheme.glow
            })),
            projectiles: this.projectiles.map(p => ({ x: p.x, y: p.y, color: p.color })),
            foods: this.foods.map(f => ({ x: f.x, y: f.y, color: f.color })),
            time: performance.now()
        };

        this.replayBuffer.push(frame);
        if (this.replayBuffer.length > 120) {
            this.replayBuffer.shift();
        }
    }

    startVcrReplay() {
        if (this.replayBuffer.length < 5) return;
        this.isVcrReplaying = true;
        this.vcrPlaybackIndex = 0;
        document.getElementById('gameOverModal').style.display = 'none';
        if (window.particleEngine) {
            window.particleEngine.addText('<< VCR REPLAY >>', this.canvas.width / 2, this.canvas.height / 2, '#39ff14', 22);
        }
    }

    stopVcrReplay() {
        this.isVcrReplaying = false;
        document.getElementById('gameOverModal').style.display = 'flex';
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseModal').style.display = this.isPaused ? 'flex' : 'none';
    }

    generateObstacles(count) {
        this.obstacles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(this.random() * (this.gridWidth - 8)) + 4;
            const y = Math.floor(this.random() * (this.gridHeight - 8)) + 4;
            const isHorizontal = this.random() > 0.5;
            const length = Math.floor(this.random() * 3) + 2;

            for (let l = 0; l < length; l++) {
                const ox = isHorizontal ? x + l : x;
                const oy = isHorizontal ? y : y + l;
                this.obstacles.push({ x: ox, y: oy });
            }
        }
    }

    spawnFood() {
        const types = [
            { type: 'normal', color: '#00f0ff', weight: 65, points: 10 },
            { type: 'overdrive', color: '#39ff14', weight: 12, points: 25 },
            { type: 'phase', color: '#d000ff', weight: 11, points: 30 },
            { type: 'emp', color: '#ffe600', weight: 6, points: 50 },
            { type: 'multiplier', color: '#ff7700', weight: 6, points: 40 }
        ];

        // Weighted random selection
        const totalWeight = types.reduce((acc, t) => acc + t.weight, 0);
        let rand = this.random() * totalWeight;
        let chosenType = types[0];
        for (const t of types) {
            if (rand < t.weight) {
                chosenType = t;
                break;
            }
            rand -= t.weight;
        }

        // Find empty cell
        let x, y, occupied;
        let attempts = 0;
        do {
            x = Math.floor(this.random() * this.gridWidth);
            y = Math.floor(this.random() * this.gridHeight);
            occupied = this.isOccupied(x, y);
            attempts++;
        } while (occupied && attempts < 100);

        if (!occupied) {
            this.foods.push({
                x, y,
                type: chosenType.type,
                color: chosenType.color,
                points: chosenType.points,
                createdAt: performance.now()
            });
        }
    }

    isOccupied(x, y) {
        for (const obs of this.obstacles) {
            if (obs.x === x && obs.y === y) return true;
        }
        for (const f of this.foods) {
            if (f.x === x && f.y === y) return true;
        }
        for (const s of this.snakes) {
            if (!s.isAlive) continue;
            for (const seg of s.body) {
                if (seg.x === x && seg.y === y) return true;
            }
        }
        return false;
    }

    onSnakeMoveStep(snake, newHeadX, newHeadY, gridWidth, gridHeight) {
        const isPhasing = snake.phaseShiftTimer > 0 || snake.warpOverdriveTimer > 0;
        const isShielded = snake.spawnShieldTimer > 0 || snake.empShieldTimer > 0;

        const checkOvershieldSave = () => {
            if (snake.overshield) {
                snake.overshield = false;
                if (window.particleEngine && snake.body.length > 0) {
                    window.particleEngine.spawnBurst(snake.body[0].pixelX, snake.body[0].pixelY, '#39ff14', 22, 5);
                    window.particleEngine.addText('🛡️ OVERSHIELD SAVED!', snake.body[0].pixelX, snake.body[0].pixelY - 22, '#39ff14', 18);
                }
                if (window.cyberAudio) {
                    window.cyberAudio.playParry();
                    if (snake === this.player1) window.cyberAudio.announce('Overshield absorbed impact', true);
                }
                this.cameraShake = Math.max(this.cameraShake, 0.4);
                return true;
            }
            return false;
        };

        // 1. Arena boundary check
        if (newHeadX < 0 || newHeadX >= gridWidth || newHeadY < 0 || newHeadY >= gridHeight) {
            if (isPhasing) {
                this.unlockAchievement('phaseWalker');
                return true;
            } else if (!isShielded) {
                if (checkOvershieldSave()) return true;
                this.cameraShake = 0.35;
                snake.kill();
                this.checkGameOver();
                return false;
            }
        }

        // Quantum Portal Traversal
        if (snake.portalCooldown <= 0) {
            for (let i = 0; i < this.portals.length; i++) {
                const p = this.portals[i];
                if (p.x === newHeadX && p.y === newHeadY) {
                    const target = this.portals[p.targetIndex];
                    if (target) {
                        newHeadX = (target.x + snake.dir.x + gridWidth) % gridWidth;
                        newHeadY = (target.y + snake.dir.y + gridHeight) % gridHeight;
                        snake.portalCooldown = 1.6;
                        snake.warpOverdriveTimer = 3.5;
                        snake.warpOverdriveCount = (snake.warpOverdriveCount || 0) + 1;
                        snake.score += 100;

                        if (window.particleEngine) {
                            window.particleEngine.spawnPortalWarp(p.pixelX, p.pixelY, p.color);
                            window.particleEngine.spawnPortalWarp(target.pixelX, target.pixelY, target.color);
                            window.particleEngine.spawnWarpOverdriveRings(target.pixelX, target.pixelY, target.color);
                            window.particleEngine.addText('WARP OVERDRIVE! +100', target.pixelX, target.pixelY - 24, '#00f0ff', 18);
                        }
                        if (window.cyberAudio) {
                            window.cyberAudio.playPortalWarpOverdrive();
                            if (snake === this.player1) window.cyberAudio.announce('Quantum overdrive engaged', true);
                        }
                        break;
                    }
                }
            }
        }

        // 2. Obstacle collision
        for (const obs of this.obstacles) {
            if (obs.x === newHeadX && obs.y === newHeadY) {
                if (isPhasing) {
                    this.unlockAchievement('phaseWalker');
                } else if (!isShielded) {
                    if (checkOvershieldSave()) return true;
                    this.cameraShake = 0.4;
                    snake.kill();
                    this.checkGameOver();
                    return false;
                }
            }
        }

        // 3. Other snakes & self-tail collision
        for (const other of this.snakes) {
            if (!other.isAlive) continue;

            for (let i = 0; i < other.body.length; i++) {
                const seg = other.body[i];

                if (seg.x === newHeadX && seg.y === newHeadY) {
                    // Head-on-head collision
                    if (other !== snake && i === 0) {
                        this.cameraShake = 0.5;
                        snake.kill();
                        other.kill();
                        this.checkGameOver();
                        return false;
                    }

                    // Body collision
                    if (!isPhasing && !isShielded) {
                        if (checkOvershieldSave()) return true;
                        this.cameraShake = 0.45;
                        snake.kill();
                        if (other !== snake) {
                            other.kills++;
                            other.score += 150;
                            window.particleEngine.addText('+150 CYBER KILL!', other.gridX * 20, other.gridY * 20, '#ff0055', 20);
                            if (other === this.player1) this.unlockAchievement('botSlayer');
                        }
                        this.checkGameOver();
                        return false;
                    }
                }
            }
        }

        // 4. Food collision
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            if (food.x === newHeadX && food.y === newHeadY) {
                this.consumeFood(snake, food);
                this.foods.splice(i, 1);
                this.spawnFood();
                break;
            }
        }

        return true;
    }

    consumeFood(snake, food) {
        snake.grow();
        // Also replenish 1 ammo
        snake.ammo = Math.min(snake.maxAmmo, snake.ammo + 1);

        let earnedPoints = food.points;
        if (snake.multiplierTimer > 0) {
            earnedPoints *= 3;
        }

        // Combo system for player 1
        if (snake === this.player1) {
            this.unlockAchievement('firstCore');
            this.combo++;
            this.comboTimer = 3.5;
            earnedPoints *= Math.min(4, this.combo);
            this.score += earnedPoints;

            if (this.score >= 100) this.unlockAchievement('centuryScore');

            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('neonSnake_highScore', this.highScore.toString());
            }
        }

        const pixelX = food.x * this.cellSize + 10;
        const pixelY = food.y * this.cellSize + 10;

        // Power-up specific activation
        if (food.type === 'normal') {
            window.particleEngine.spawnBurst(pixelX, pixelY, food.color, 16, 4);
            window.particleEngine.addText(`+${earnedPoints}`, pixelX, pixelY, '#00f0ff', 16);
            if (window.cyberAudio) window.cyberAudio.playEat(false);
        } else if (food.type === 'overdrive') {
            snake.boostEnergy = 100;
            snake.spawnShieldTimer = 3.0;
            window.particleEngine.spawnBurst(pixelX, pixelY, food.color, 24, 6);
            window.particleEngine.addText('OVERDRIVE!', pixelX, pixelY, '#39ff14', 18);
            if (window.cyberAudio) window.cyberAudio.playPowerup();
        } else if (food.type === 'phase') {
            snake.phaseShiftTimer = 6.0;
            window.particleEngine.spawnBurst(pixelX, pixelY, food.color, 24, 5);
            window.particleEngine.addText('PHASE SHIFT!', pixelX, pixelY, '#d000ff', 18);
            if (window.cyberAudio) window.cyberAudio.playPhase();
        } else if (food.type === 'emp') {
            snake.empShieldTimer = 4.0;
            this.triggerEmpBlast(snake);
            window.particleEngine.addText('EMP SHOCKWAVE!', pixelX, pixelY, '#ffe600', 20);
            if (window.cyberAudio) window.cyberAudio.playEmp();
            if (snake === this.player1) this.unlockAchievement('empBlast');
        } else if (food.type === 'multiplier') {
            snake.multiplierTimer = 8.0;
            window.particleEngine.spawnBurst(pixelX, pixelY, food.color, 25, 6);
            window.particleEngine.addText('3X MATRIX!', pixelX, pixelY, '#ff7700', 18);
            if (window.cyberAudio) window.cyberAudio.playPowerup();
        }

        this.updateHUD();
    }

    triggerEmpBlast(sourceSnake) {
        this.cameraShake = 0.5;
        const cx = sourceSnake.gridX * this.cellSize + 10;
        const cy = sourceSnake.gridY * this.cellSize + 10;
        window.particleEngine.spawnEmpShockwave(cx, cy, 200);

        // Clear obstacles within 7 grid distance
        this.obstacles = this.obstacles.filter(obs => {
            const dist = Math.hypot(obs.x - sourceSnake.gridX, obs.y - sourceSnake.gridY);
            if (dist <= 7) {
                window.particleEngine.spawnBurst(obs.x * 20 + 10, obs.y * 20 + 10, '#ffe600', 8, 3);
                return false;
            }
            return true;
        });

        // Tactical EMP Overload: Detonate all active armed mines across the grid
        const armedMines = [...this.mines.filter(m => m.isArmed)];
        if (armedMines.length > 0) {
            window.particleEngine.addText('⚡ MINES OVERLOADED!', cx, cy - 25, '#ffe600', 16);
            armedMines.forEach((m, idx) => {
                setTimeout(() => {
                    if (this.mines.includes(m)) {
                        m.owner = sourceSnake; // Credit source snake
                        this.detonateMine(m, idx + 1);
                    }
                }, idx * 75);
            });
        }

        // Briefly stun / freeze enemy snakes
        for (const s of this.snakes) {
            if (s !== sourceSnake && s.isAlive) {
                s.moveTimer = -0.6;
                window.particleEngine.addText('STUNNED', s.gridX * 20, s.gridY * 20, '#ffe600', 14);
            }
        }
    }

    updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= dt;

            // Spawn trail spark
            if (Math.random() < 0.3) {
                window.particleEngine.spawnTrailSparks(p.x, p.y, p.color, 1);
            }

            // Arena boundary hit
            if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height || p.life <= 0) {
                window.particleEngine.spawnBurst(p.x, p.y, p.color, 6, 2);
                this.projectiles.splice(i, 1);
                continue;
            }

            const gridX = Math.floor(p.x / this.cellSize);
            const gridY = Math.floor(p.y / this.cellSize);

            // Obstacle collision
            let hitObstacle = false;
            for (let oIdx = this.obstacles.length - 1; oIdx >= 0; oIdx--) {
                const obs = this.obstacles[oIdx];
                if (obs.x === gridX && obs.y === gridY) {
                    this.obstacles.splice(oIdx, 1);
                    if (p.isRailgun) {
                        window.particleEngine.spawnRailgunImpact(p.x, p.y);
                        window.particleEngine.addText('+50 PIERCE!', p.x, p.y, '#ffe600', 15);
                        if (p.owner === this.player1) this.score += 50;
                        if (window.cyberAudio) window.cyberAudio.playRailgunFire();
                        // Railgun pierces straight through obstacles without stopping!
                    } else {
                        window.particleEngine.spawnBurst(p.x, p.y, '#ff0055', 16, 4);
                        window.particleEngine.addText('+20 BLAST', p.x, p.y, '#ff0055', 14);
                        if (p.owner === this.player1) this.score += 20;
                        this.projectiles.splice(i, 1);
                        hitObstacle = true;
                        if (window.cyberAudio) window.cyberAudio.playPlasmaHit();
                        break;
                    }
                }
            }
            if (hitObstacle) continue;

            // Snake collision
            let hitSnake = false;
            for (const target of this.snakes) {
                if (target === p.owner || !target.isAlive) continue;
                if (p.isRailgun && p.hitSnakes && p.hitSnakes.has(target)) continue;

                for (let sIdx = 0; sIdx < target.body.length; sIdx++) {
                    const seg = target.body[sIdx];
                    const dist = Math.hypot(p.x - seg.pixelX, p.y - seg.pixelY);

                    if (dist < this.cellSize * (p.isRailgun ? 1.15 : 0.85)) {
                        if (p.isRailgun && p.hitSnakes) {
                            p.hitSnakes.add(target);
                        }

                        // Tactical Kinetic Parry Deflection!
                        if (target.parryTimer > 0 && sIdx === 0) {
                            p.vx = -p.vx * 1.5;
                            p.vy = -p.vy * 1.5;
                            p.owner = target;
                            p.color = '#39ff14';
                            p.life = 1.4;
                            target.score += 200;
                            target.parrySuccessCount = (target.parrySuccessCount || 0) + 1;
                            if (window.particleEngine) {
                                window.particleEngine.spawnParryFlash(p.x, p.y);
                            }
                            if (window.cyberAudio) {
                                window.cyberAudio.playParry();
                                window.cyberAudio.announce('Deflection confirmed', true);
                            }
                            this.cameraShake = Math.max(this.cameraShake, 0.35);
                            hitSnake = true;
                            break;
                        }

                        const dmg = p.isRailgun ? 55 : 25;
                        const outcome = target.takeDamage(dmg);
                        if (p.isRailgun) {
                            window.particleEngine.spawnRailgunImpact(p.x, p.y);
                            window.particleEngine.addText('⚡ PIERCED! +300', p.x, p.y - 18, '#ffe600', 18);
                            if (p.owner === this.player1) this.score += 300;
                            this.cameraShake = Math.max(this.cameraShake, 0.45);
                        } else {
                            window.particleEngine.spawnBurst(p.x, p.y, p.color, 20, 5);
                            this.cameraShake = Math.max(this.cameraShake, 0.3);
                        }

                        if (outcome === 'destroyed') {
                            window.particleEngine.addText('+250 DESTROYED!', p.x, p.y, '#ff0055', 22);
                            if (p.owner === this.player1) {
                                this.score += 250;
                                this.unlockAchievement('plasmaSniper');
                                if (target === this.bossSnake) this.unlockAchievement('bossHunter');
                            }
                            this.checkGameOver();
                        } else if (Array.isArray(outcome)) {
                            // Turn sheared segments into collectible energy food bits!
                            for (const sheared of outcome) {
                                this.foods.push({
                                    x: sheared.x,
                                    y: sheared.y,
                                    type: 'normal',
                                    color: '#00f0ff',
                                    points: 15,
                                    createdAt: performance.now()
                                });
                            }
                            window.particleEngine.addText('SHEARED!', p.x, p.y, '#ffe600', 16);
                        }

                        if (p.isRailgun) {
                            p.pierceCount = (p.pierceCount || 0) + 1;
                            if (p.pierceCount >= (p.pierceLimit || 5)) {
                                this.projectiles.splice(i, 1);
                                hitSnake = true;
                                break;
                            }
                        } else {
                            this.projectiles.splice(i, 1);
                            hitSnake = true;
                            break;
                        }
                    }
                }
                if (hitSnake) break;
            }
        }
    }

    updateLaserSweepHazard(dt) {
        // Rotating laser hazard active in solo, overclocked, and boss mode
        if (this.mode !== 'solo' && this.mode !== 'boss' && this.difficulty !== 'overclocked') return;

        this.laserSweepTimer += dt;
        if (this.laserSweepTimer >= 14.0 && !this.laserSweepActive) {
            this.laserSweepActive = true;
            this.laserSweepAngle = 0;
            window.particleEngine.addText('⚠️ LASER SWEEP ACTIVE!', this.canvas.width / 2, 60, '#ff0055', 18);
            if (window.cyberAudio) window.cyberAudio.playBossAlarm();
        }

        if (this.laserSweepActive) {
            this.laserSweepAngle += dt * 1.6; // rotation speed
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            // Check if any snake intersects the laser beam
            const beamDist = this.canvas.width * 0.7;
            const endX = centerX + Math.cos(this.laserSweepAngle) * beamDist;
            const endY = centerY + Math.sin(this.laserSweepAngle) * beamDist;

            for (const snake of this.snakes) {
                if (!snake.isAlive || snake.phaseShiftTimer > 0 || snake.spawnShieldTimer > 0) continue;

                // Tactical Parry: deflects the laser beam harmlessly!
                if (snake.parryTimer > 0) {
                    if (snake === this.player1 && !snake.laserParriedThisSweep && snake.body.length > 0) {
                        snake.laserParriedThisSweep = true;
                        snake.score += 150;
                        snake.parrySuccessCount = (snake.parrySuccessCount || 0) + 1;
                        if (window.particleEngine) {
                            window.particleEngine.addText('⚡ LASER PARRIED! +150', snake.body[0].pixelX, snake.body[0].pixelY - 20, '#39ff14', 18);
                        }
                        if (window.cyberAudio) window.cyberAudio.playParry();
                    }
                    continue;
                }

                for (const seg of snake.body) {
                    const distToBeam = this.pointToSegmentDistance(seg.pixelX, seg.pixelY, centerX, centerY, endX, endY);
                    if (distToBeam < 10) {
                        snake.kill();
                        this.checkGameOver();
                        break;
                    }
                }
            }

            if (this.laserSweepAngle >= Math.PI * 2) {
                this.laserSweepActive = false;
                this.laserSweepTimer = 0;
                if (this.player1) this.player1.laserParriedThisSweep = false;
            }
        }
    }

    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    checkGameOver() {
        if (this.deathCamActive) return;

        let isOver = false;
        let msg = '';

        if (this.mode === 'solo' && this.player1 && !this.player1.isAlive) {
            isOver = true;
            msg = 'CYBER CRASH: SYSTEM TERMINATED';
        } else if (this.mode === 'bots') {
            const living = this.snakes.filter(s => s.isAlive);
            if (!this.player1.isAlive) {
                isOver = true;
                msg = 'NEXUS ELIMINATED YOU';
            } else if (living.length === 1 && living[0] === this.player1) {
                isOver = true;
                msg = 'VICTORY: CYBER ARENA CONQUERED!';
            }
        } else if (this.mode === 'boss') {
            if (!this.player1.isAlive) {
                isOver = true;
                msg = 'LEVIATHAN CRUSHED YOU';
            } else if (this.bossSnake && !this.bossSnake.isAlive) {
                isOver = true;
                msg = '🏆 LEVIATHAN SLAIN! VICTORY!';
            }
        } else if (this.mode === 'local2p') {
            const living = this.snakes.filter(s => s.isAlive);
            if (living.length <= 1) {
                isOver = true;
                msg = living.length === 1 ? `${living[0].name} DOMINATES THE GRID!` : 'DRAW';
            }
        } else if (this.mode === 'online') {
            const living = this.snakes.filter(s => s.isAlive);
            if (living.length <= 1) {
                isOver = true;
                msg = living.length === 1 ? `${living[0].name} WINS DUEL!` : 'DRAW';
            }
        }

        if (isOver) {
            this.triggerDeathCam(msg);
        }
    }

    triggerDeathCam(msg) {
        this.deathCamActive = true;
        this.deathCamTimer = 1.3;
        this.cameraShake = 0.6;
        window.particleEngine.addText('// CRITICAL FATALITY //', this.canvas.width / 2, this.canvas.height / 2, '#ff0055', 24);

        // Record high score ghost run in solo
        if (this.mode === 'solo' && this.score >= this.highScore && this.currentRunRecord.length > 20) {
            this.bestRunRecord = this.currentRunRecord;
            localStorage.setItem('neonSnake_bestRunReplay', JSON.stringify(this.bestRunRecord));
        }

        setTimeout(() => {
            this.deathCamActive = false;
            this.triggerGameOver(msg);
        }, 1300);
    }

    triggerGameOver(msg) {
        this.gameOver = true;
        this.isRunning = false;
        const modal = document.getElementById('gameOverModal');
        document.getElementById('gameOverTitle').innerText = msg;
        document.getElementById('finalScore').innerText = `FINAL SCORE: ${this.score}`;
        modal.style.display = 'flex';
    }

    saveLeaderboardScore() {
        const input = document.getElementById('playerHandleInput');
        const handle = (input && input.value.trim()) ? input.value.trim().toUpperCase().substring(0, 10) : 'CYBER_RUNNER';
        
        if (this.score > 0) {
            this.leaderboard.push({
                handle,
                score: this.score,
                date: new Date().toLocaleDateString()
            });
            this.leaderboard.sort((a, b) => b.score - a.score);
            this.leaderboard = this.leaderboard.slice(0, 10);
            localStorage.setItem('neonSnake_leaderboard', JSON.stringify(this.leaderboard));
        }
    }

    renderLeaderboard() {
        const list = document.getElementById('leaderboardList');
        if (!list) return;
        if (this.leaderboard.length === 0) {
            list.innerHTML = '<div style="color:#718096;text-align:center;padding:12px;">No scores logged yet. Set the grid on fire!</div>';
            return;
        }

        let html = '';
        this.leaderboard.forEach((entry, idx) => {
            html += `
                <div class="leaderboard-row">
                    <span class="rank">#${idx + 1}</span>
                    <span class="handle">${entry.handle}</span>
                    <span class="score">${entry.score} PTS</span>
                </div>
            `;
        });
        list.innerHTML = html;
    }

    update(dt) {
        if (!this.isRunning || this.isPaused) return;

        // Bullet-Time Dilation on Fatality / Death Cam
        if (this.deathCamActive) {
            dt *= 0.22;
        }

        // Poll Gamepad input
        this.pollGamepad();

        // Update Cyber Grid Anomalies (Solar Flare, EMP Storm, Neon Eclipse)
        this.updateCyberAnomalies(dt);

        // Record solo run frame for Ghost Time-Trial Racer
        if (this.mode === 'solo' && this.player1 && this.player1.isAlive && !this.deathCamActive) {
            this.currentRunRecord.push({
                x: this.player1.gridX,
                y: this.player1.gridY,
                body: this.player1.body.map(b => ({ px: b.pixelX, py: b.pixelY }))
            });
        }

        // Camera shake decay
        if (this.cameraShake > 0) {
            this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
        }

        // Combo decay
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                this.updateHUD();
            }
        }

        // AI Snakes thinking
        for (const s of this.snakes) {
            if (s.isAi && s.isAlive) {
                window.cyberAi.think(s, this.snakes, this.foods, this.obstacles, this.gridWidth, this.gridHeight);
            }
        }

        // Update all snakes
        for (const s of this.snakes) {
            s.update(dt, this.gridWidth, this.gridHeight, (snake, nx, ny, gw, gh) => {
                return this.onSnakeMoveStep(snake, nx, ny, gw, gh);
            });
        }

        // Update projectiles & combat collisions
        this.updateProjectiles(dt);

        // Update Laser Sweep Hazard
        this.updateLaserSweepHazard(dt);

        // Update Quantum Portals & Proximity Mines
        this.updatePortals(dt);
        this.updateMines(dt);

        // Record Replay Frame for VCR Fatal Replay
        if (this.isRunning && !this.gameOver && this.player1 && this.player1.isAlive) {
            this.recordReplayFrame();
        }

        // Update particles and visual dust
        window.particleEngine.update(dt, this.canvas.width, this.canvas.height);

        // Host P2P state broadcasting
        if (this.mode === 'online' && window.cyberP2P.isHost && window.cyberP2P.isConnected) {
            this.p2pSyncTimer += dt;
            if (this.p2pSyncTimer >= 0.05) { // 20Hz sync
                this.p2pSyncTimer = 0;
                this.broadcastP2PState();
            }
        }

        this.updateHUD();
    }

    broadcastP2PState() {
        const payload = {
            type: 'SYNC_STATE',
            snakes: this.snakes.map(s => ({
                id: s.id,
                isAlive: s.isAlive,
                gridX: s.gridX,
                gridY: s.gridY,
                dir: s.dir,
                body: s.body.map(b => ({ x: b.x, y: b.y })),
                isBoosting: s.isBoosting,
                score: s.score
            })),
            foods: this.foods,
            obstacles: this.obstacles
        };
        window.cyberP2P.send(payload);
    }

    handleP2PData(data) {
        if (!data) return;

        if (data.type === 'INPUT_MOVE' && window.cyberP2P.isHost && this.player2) {
            this.player2.setDirection(data.dir.x, data.dir.y);
            if (data.boost !== undefined) this.player2.setBoosting(data.boost);
        } else if (data.type === 'INPUT_BOOST' && window.cyberP2P.isHost && this.player2) {
            this.player2.setBoosting(data.boost);
        } else if (data.type === 'SYNC_STATE' && !window.cyberP2P.isHost) {
            this.foods = data.foods;
            this.obstacles = data.obstacles;
            for (const sData of data.snakes) {
                let targetSnake = this.snakes.find(s => s.id === sData.id);
                if (targetSnake) {
                    targetSnake.isAlive = sData.isAlive;
                    targetSnake.gridX = sData.gridX;
                    targetSnake.gridY = sData.gridY;
                    targetSnake.dir = sData.dir;
                    targetSnake.isBoosting = sData.isBoosting;
                    targetSnake.score = sData.score;
                    if (sData.body) {
                        targetSnake.body = sData.body.map(b => ({
                            x: b.x,
                            y: b.y,
                            pixelX: b.x * 20 + 10,
                            pixelY: b.y * 20 + 10
                        }));
                    }
                }
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const currentTheme = this.themes[this.theme] || this.themes.neon2077;

        ctx.save();

        // Apply screen shake
        if (this.cameraShake > 0) {
            const shakeMagnitude = this.cameraShake * 10;
            const sx = (Math.random() - 0.5) * shakeMagnitude;
            const sy = (Math.random() - 0.5) * shakeMagnitude;
            ctx.translate(sx, sy);
        }

        // Clear with themed dark cyber void
        ctx.fillStyle = currentTheme.bg;
        ctx.fillRect(0, 0, w, h);

        // 1. Draw Live Audio Visualizer Bars in Background
        this.drawAudioVisualizer(ctx, w, h);

        // 2. Draw Synthwave Neon Perspective Grid
        this.drawCyberGrid(ctx, w, h, currentTheme);

        // 3. Draw Cyber Grid Anomaly Overlays (Solar Flare / Neon Eclipse)
        this.drawCyberAnomalies(ctx, w, h);

        // 4. Draw Ghost Time-Trial Shadow Racer
        this.drawGhostRacer(ctx);

        // 5. Draw Laser Sweep Hazard if active
        this.drawLaserSweepHazard(ctx, w, h);

        // 6. Draw Obstacles (Neon Data Barriers)
        this.drawObstacles(ctx);

        // 7. Draw Quantum Portals
        this.drawPortals(ctx);

        // 8. Draw Proximity Cyber Mines
        this.drawMines(ctx);

        // 9. Draw Foods & Powerups
        this.drawFoods(ctx);

        // 10. Draw Snakes
        for (const s of this.snakes) {
            s.draw(ctx, this.cellSize);
        }

        // 11. Draw Plasma Projectiles
        this.drawProjectiles(ctx);

        // 12. Draw Holographic Tactical Radar / Minimap
        this.drawTacticalRadar(ctx);

        // 13. Draw Particles & Overlays
        window.particleEngine.draw(ctx, w, h);

        // 14. Retro VCR Death Replay Overlay
        if (this.isVcrReplaying) {
            this.drawVcrReplay(ctx, w, h);
        }

        // 15. Temporal Matrix Overclock VFX
        if (this.player1 && this.player1.isOverclocked) {
            this.drawOverclockVfx(ctx, w, h);
        }

        ctx.restore();
    }

    drawProjectiles(ctx) {
        ctx.save();
        for (const p of this.projectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fillStyle = '#ffffff';

            if (p.isRailgun) {
                // Hyper-Drive Railgun Piercing Beam
                const angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 24;
                ctx.fillStyle = '#ffe600';
                ctx.fillRect(-24, -6, 48, 12);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-22, -2.5, 44, 5);

                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(-8, 0, 8, 0, Math.PI * 2);
                ctx.arc(8, 0, 8, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Standard Plasma bolt capsule
                const angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-8, -3, 16, 6);

                // Core white hot line
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-6, -1, 12, 2);
            }

            ctx.restore();
        }
        ctx.restore();
    }

    drawPortals(ctx) {
        // Quantum Spatial Alignment Vector Beam
        if (this.portals.length >= 2) {
            const p1 = this.portals[0];
            const p2 = this.portals[1];
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.pixelX, p1.pixelY);
            ctx.lineTo(p2.pixelX, p2.pixelY);
            const grad = ctx.createLinearGradient(p1.pixelX, p1.pixelY, p2.pixelX, p2.pixelY);
            grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.38)');
            grad.addColorStop(1, 'rgba(255, 119, 0, 0.25)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -Date.now() * 0.025;
            ctx.stroke();
            ctx.restore();
        }

        for (const portal of this.portals) {
            ctx.save();
            ctx.translate(portal.pixelX, portal.pixelY);

            // Rotating elliptical quantum rings
            ctx.shadowBlur = 18;
            ctx.shadowColor = portal.color;
            ctx.strokeStyle = portal.color;
            ctx.lineWidth = 2.5;

            // Outer ring
            ctx.beginPath();
            ctx.ellipse(0, 0, this.cellSize * 0.85, this.cellSize * 0.55, portal.pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Inner counter-rotating ring
            ctx.beginPath();
            ctx.ellipse(0, 0, this.cellSize * 0.55, this.cellSize * 0.35, -portal.pulse * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Swirling black hole center
            ctx.fillStyle = 'rgba(6, 7, 19, 0.85)';
            ctx.beginPath();
            ctx.arc(0, 0, this.cellSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Portal Label
            ctx.font = "900 9px 'Orbitron', monospace";
            ctx.fillStyle = portal.color;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 8;
            ctx.fillText(portal.id === 'alpha' ? 'GATE α' : 'GATE Ω', 0, -this.cellSize * 0.95);

            ctx.restore();
        }
    }

    drawMines(ctx) {
        // Draw electric perimeter arcs between nearby armed mines
        if (this.mines.length > 1) {
            ctx.save();
            for (let i = 0; i < this.mines.length; i++) {
                const m1 = this.mines[i];
                if (!m1.isArmed) continue;
                for (let j = i + 1; j < this.mines.length; j++) {
                    const m2 = this.mines[j];
                    if (!m2.isArmed) continue;
                    const d = Math.hypot(m1.pixelX - m2.pixelX, m1.pixelY - m2.pixelY);
                    if (d < this.cellSize * 6.5) {
                        ctx.beginPath();
                        ctx.moveTo(m1.pixelX, m1.pixelY);
                        const segments = 5;
                        for (let s = 1; s < segments; s++) {
                            const t = s / segments;
                            const mx = m1.pixelX + (m2.pixelX - m1.pixelX) * t;
                            const my = m1.pixelY + (m2.pixelY - m1.pixelY) * t;
                            const jitter = (Math.sin(Date.now() * 0.02 + s * 4) + (Math.random() - 0.5)) * 4.5;
                            ctx.lineTo(mx + jitter, my + jitter);
                        }
                        ctx.lineTo(m2.pixelX, m2.pixelY);
                        ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
                        ctx.lineWidth = 1.6;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#00f0ff';
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
        }

        for (const mine of this.mines) {
            ctx.save();
            ctx.translate(mine.pixelX, mine.pixelY);

            const isArmed = mine.isArmed;
            const glowColor = isArmed ? '#ff0055' : '#ffe600';
            ctx.shadowBlur = isArmed ? 16 : 8;
            ctx.shadowColor = glowColor;

            // Hazard Proximity Detection Ring
            if (isArmed) {
                const ringRadius = this.cellSize * 1.4 + Math.sin(Date.now() * 0.01) * 3;
                ctx.beginPath();
                ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 0, 85, 0.35)';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Spinning triangular cyber mine body
            ctx.rotate(Date.now() * (isArmed ? 0.004 : 0.001));
            ctx.fillStyle = '#0a0d18';
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2;

            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const a = (i * Math.PI * 2) / 3;
                const px = Math.cos(a) * 9;
                const py = Math.sin(a) * 9;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Core blinking optic
            ctx.fillStyle = isArmed ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#ff0055' : '#ffffff') : '#ffe600';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    drawVcrReplay(ctx, w, h) {
        if (!this.isVcrReplaying || this.replayBuffer.length === 0) return;

        // Dark tape backdrop to isolate replay
        ctx.save();
        ctx.fillStyle = 'rgba(6, 7, 19, 0.75)';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();

        const frame = this.replayBuffer[this.vcrPlaybackIndex];
        if (frame) {
            // Draw recorded snake
            ctx.save();
            if (frame.p1 && frame.p1.body && frame.p1.body.length > 0) {
                if (frame.p1.body.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(frame.p1.body[0].px, frame.p1.body[0].py);
                    for (let i = 1; i < frame.p1.body.length; i++) {
                        ctx.lineTo(frame.p1.body[i].px, frame.p1.body[i].py);
                    }
                    ctx.lineWidth = 10;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#00f0ff';
                    ctx.shadowBlur = 18;
                    ctx.shadowColor = '#00f0ff';
                    ctx.stroke();

                    // Inner bright core
                    ctx.beginPath();
                    ctx.moveTo(frame.p1.body[0].px, frame.p1.body[0].py);
                    for (let i = 1; i < frame.p1.body.length; i++) {
                        ctx.lineTo(frame.p1.body[i].px, frame.p1.body[i].py);
                    }
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#ffffff';
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = '#ffffff';
                    ctx.stroke();
                }

                for (let i = 0; i < frame.p1.body.length; i++) {
                    const b = frame.p1.body[i];
                    ctx.fillStyle = i === 0 ? '#ffffff' : '#00f0ff';
                    ctx.shadowBlur = 14;
                    ctx.shadowColor = '#00f0ff';
                    ctx.beginPath();
                    ctx.arc(b.px, b.py, i === 0 ? 9 : 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // Advance replay frame
        this.vcrPlaybackIndex++;
        if (this.vcrPlaybackIndex >= this.replayBuffer.length) {
            this.vcrPlaybackIndex = 0;
        }

        // Retro VCR Overlay Graphics
        ctx.save();
        // Tracking noise lines
        const trackY = (Date.now() * 0.15) % h;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, trackY, w, 8);
        ctx.fillRect(0, (trackY + 120) % h, w, 4);

        // VCR On-Screen Display (OSD)
        ctx.font = "900 16px 'Orbitron', monospace";
        ctx.fillStyle = '#39ff14';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#39ff14';
        ctx.textAlign = 'left';

        // Blinking REC dot
        const isBlink = Math.floor(Date.now() / 450) % 2 === 0;
        if (isBlink) {
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.beginPath();
            ctx.arc(28, 38, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.fillText('PLAY ▷  SP  -00:0' + Math.floor(this.vcrPlaybackIndex / 30) + ':' + (this.vcrPlaybackIndex % 30).toString().padStart(2, '0'), 42, 43);

        ctx.font = "700 11px monospace";
        ctx.fillText('VCR TRACKING: AUTO // CASSETTE_2077', 42, 62);

        // Exit notice
        ctx.font = "900 12px 'Orbitron', monospace";
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.textAlign = 'center';
        ctx.fillText('[ PRESS ESCAPE OR CLICK TO RETURN ]', w / 2, h - 25);

        ctx.restore();
    }

    drawLaserSweepHazard(ctx, w, h) {
        if (!this.laserSweepActive) return;
        const cx = w / 2;
        const cy = h / 2;
        const beamDist = w * 0.7;
        const endX = cx + Math.cos(this.laserSweepAngle) * beamDist;
        const endY = cy + Math.sin(this.laserSweepAngle) * beamDist;

        ctx.save();
        // Turret core
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0055';
        ctx.fill();

        // Laser beam
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff0055';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0055';
        ctx.stroke();

        // Inner beam
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.restore();
    }

    drawAudioVisualizer(ctx, w, h) {
        if (!window.cyberAudio || !window.cyberAudio.getVisualizerData) return;
        const freqData = window.cyberAudio.getVisualizerData();
        if (!freqData) return;

        ctx.save();
        const barCount = 32;
        const barWidth = w / barCount;

        for (let i = 0; i < barCount; i++) {
            const val = freqData[i] || 0;
            const barHeight = (val / 255) * (h * 0.28);
            const x = i * barWidth;
            const y = h - barHeight;

            const alpha = 0.08 + (val / 255) * 0.15;
            ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }
        ctx.restore();
    }

    updateCyberAnomalies(dt) {
        this.anomalyTimer += dt;
        if (!this.activeAnomaly && this.anomalyTimer >= 20.0) {
            this.anomalyTimer = 0;
            const events = ['SOLAR_OVERCHARGE', 'EMP_STORM', 'NEON_ECLIPSE'];
            this.activeAnomaly = events[Math.floor(Math.random() * events.length)];
            this.anomalyDuration = 8.5;
            window.particleEngine.addText(`⚠️ ANOMALY: ${this.activeAnomaly.replace('_', ' ')}`, this.canvas.width / 2, 80, '#ffe600', 16);
            if (window.cyberAudio) window.cyberAudio.playPowerup();

            if (this.activeAnomaly === 'EMP_STORM') {
                this.obstacles = [];
                for (let i = 0; i < 4; i++) this.spawnFood();
            }
        }

        if (this.activeAnomaly) {
            this.anomalyDuration -= dt;
            if (this.anomalyDuration <= 0) {
                this.activeAnomaly = null;
            }
        }
    }

    drawCyberAnomalies(ctx, w, h) {
        if (!this.activeAnomaly) return;
        ctx.save();
        if (this.activeAnomaly === 'SOLAR_OVERCHARGE') {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.09)';
            ctx.fillRect(0, 0, w, h);
        } else if (this.activeAnomaly === 'NEON_ECLIPSE') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(0, 0, w, h);
        } else if (this.activeAnomaly === 'EMP_STORM') {
            if (Math.random() < 0.15) {
                ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
                ctx.fillRect(0, 0, w, h);
            }
        }
        ctx.restore();
    }

    drawGhostRacer(ctx) {
        if (!this.ghostEnabled || this.mode !== 'solo' || !this.bestRunRecord || this.bestRunRecord.length === 0) return;
        const frame = this.bestRunRecord[this.ghostStep % this.bestRunRecord.length];
        this.ghostStep++;
        if (!frame || !frame.body || frame.body.length === 0) return;

        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(performance.now() * 0.008) * 0.15;
        ctx.strokeStyle = '#b026ff';
        ctx.lineWidth = this.cellSize * 0.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([6, 6]);

        ctx.beginPath();
        ctx.moveTo(frame.body[0].px, frame.body[0].py);
        for (let i = 1; i < frame.body.length; i++) {
            ctx.lineTo(frame.body[i].px, frame.body[i].py);
        }
        ctx.stroke();

        // Ghost head visor
        ctx.beginPath();
        ctx.arc(frame.body[0].px, frame.body[0].py, this.cellSize * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#b026ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#b026ff';
        ctx.fill();

        ctx.restore();
    }

    drawTacticalRadar(ctx) {
        if (!this.radarEnabled) return;
        const size = 95;
        const rx = this.canvas.width - size - 14;
        const ry = 14;

        ctx.save();
        ctx.translate(rx, ry);

        // Frame & Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, size, size);
        ctx.fillRect(0, 0, size, size);

        // Crosshairs
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
        ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
        ctx.stroke();

        // Radar Sweep Needle
        const sweepAngle = (performance.now() * 0.0025) % (Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2);
        ctx.lineTo(size / 2 + Math.cos(sweepAngle) * (size / 2), size / 2 + Math.sin(sweepAngle) * (size / 2));
        ctx.stroke();

        // Scale factors
        const scaleX = size / this.gridWidth;
        const scaleY = size / this.gridHeight;

        // Food blips (cyan)
        ctx.fillStyle = '#00f0ff';
        for (const f of this.foods) {
            ctx.fillRect(f.x * scaleX, f.y * scaleY, 2, 2);
        }

        // Quantum Portal blips & Spatial Vector (dual-color)
        if (this.portals.length >= 2) {
            const p1 = this.portals[0];
            const p2 = this.portals[1];
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
            ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        for (const p of this.portals) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x * scaleX - 1.5, p.y * scaleY - 1.5, 3.5, 3.5);
        }

        // Proximity Mine blips
        ctx.fillStyle = '#ffe600';
        for (const m of this.mines) {
            ctx.fillRect(m.gridX * scaleX - 1, m.gridY * scaleY - 1, 2.5, 2.5);
        }

        // Snake heads
        for (const s of this.snakes) {
            if (!s.isAlive) continue;
            ctx.fillStyle = (s === this.player1) ? '#39ff14' : '#ff0055';
            ctx.fillRect(s.gridX * scaleX - 1.5, s.gridY * scaleY - 1.5, 3.5, 3.5);
        }

        ctx.font = "900 8px 'Orbitron', monospace";
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('RADAR//2077', 4, 10);
        ctx.restore();
    }

    drawCyberGrid(ctx, w, h, currentTheme) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = currentTheme.grid;

        // Grid lines
        for (let x = 0; x <= w; x += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y <= h; y += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Glowing arena perimeter border
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = currentTheme.border;
        ctx.shadowBlur = 12;
        ctx.shadowColor = currentTheme.border;
        ctx.strokeRect(1, 1, w - 2, h - 2);

        ctx.restore();
    }

    drawObstacles(ctx) {
        if (this.obstacles.length === 0) return;
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        for (const obs of this.obstacles) {
            const px = obs.x * this.cellSize;
            const py = obs.y * this.cellSize;
            ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
            ctx.strokeRect(px + 4, py + 4, this.cellSize - 8, this.cellSize - 8);
        }
        ctx.restore();
    }

    drawFoods(ctx) {
        const time = performance.now() * 0.005;
        ctx.save();

        for (const food of this.foods) {
            const px = food.x * this.cellSize + this.cellSize / 2;
            const py = food.y * this.cellSize + this.cellSize / 2;
            const pulse = Math.sin(time + food.x + food.y) * 2;
            const radius = Math.max(3, this.cellSize * 0.35 + pulse);

            ctx.save();
            ctx.translate(px, py);
            ctx.shadowBlur = 14;
            ctx.shadowColor = food.color;
            ctx.fillStyle = food.color;

            // Rotating cyber core
            ctx.rotate(time * 0.5);
            if (food.type === 'normal') {
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-2, -2, 4, 4);
            } else if (food.type === 'overdrive') {
                ctx.beginPath();
                ctx.moveTo(0, -radius * 1.3);
                ctx.lineTo(radius * 1.3, 0);
                ctx.lineTo(0, radius * 1.3);
                ctx.lineTo(-radius * 1.3, 0);
                ctx.closePath();
                ctx.fill();
            } else if (food.type === 'phase') {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const hx = Math.cos(angle) * radius * 1.2;
                    const hy = Math.sin(angle) * radius * 1.2;
                    if (i === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
            } else if (food.type === 'emp' || food.type === 'multiplier') {
                ctx.fillRect(-radius * 1.2, -3, radius * 2.4, 6);
                ctx.fillRect(-3, -radius * 1.2, 6, radius * 2.4);
            }

            ctx.restore();
        }
        ctx.restore();
    }

    updateHUD() {
        const scoreVal = document.getElementById('score-val');
        if (scoreVal) {
            scoreVal.innerText = this.score.toString().padStart(4, '0');
        }
        const scoreDisp = document.getElementById('scoreDisplay');
        if (scoreDisp) scoreDisp.innerText = this.score;

        const highScoreDisp = document.getElementById('highScoreDisplay');
        if (highScoreDisp) highScoreDisp.innerText = this.highScore;

        const comboDisp = document.getElementById('comboDisplay');
        if (comboDisp) comboDisp.innerText = `x${this.combo}`;

        if (this.player1) {
            const boostBar = document.getElementById('boostFill');
            if (boostBar) {
                boostBar.style.width = `${Math.round(this.player1.boostEnergy)}%`;
                boostBar.classList.toggle('depleted', this.player1.boostEnergy < 15);
            }

            // Power-up badge & ammo display
            const badgeContainer = document.getElementById('activePowerups');
            if (badgeContainer) {
                let badges = '';
                // Ammo and Mines pips
                badges += `<span class="badge ammo">⚡ ${this.player1.ammo}/${this.player1.maxAmmo}</span>`;
                badges += `<span class="badge mine">💣 ${this.player1.mines}/${this.player1.maxMines}</span>`;

                if (this.player1.phaseShiftTimer > 0) {
                    badges += `<span class="badge phase">PHASE (${Math.ceil(this.player1.phaseShiftTimer)}s)</span>`;
                }
                if (this.player1.multiplierTimer > 0) {
                    badges += `<span class="badge multiplier">3X MATRIX (${Math.ceil(this.player1.multiplierTimer)}s)</span>`;
                }
                if (this.player1.spawnShieldTimer > 0 || this.player1.empShieldTimer > 0) {
                    badges += `<span class="badge shield">SHIELD</span>`;
                }
                if (this.player1.parryTimer > 0) {
                    badges += `<span class="badge parry" style="border-color:#00f0ff; color:#00f0ff; box-shadow:0 0 10px #00f0ff;">PARRY DEFLECT</span>`;
                }
                if (this.player1.warpOverdriveTimer > 0) {
                    badges += `<span class="badge warp" style="border-color:#00f0ff; color:#00f0ff; box-shadow:0 0 10px #00f0ff;">WARP OVERDRIVE (${Math.ceil(this.player1.warpOverdriveTimer)}s)</span>`;
                }
                if (this.player1.naniteTimer > 0) {
                    badges += `<span class="badge nanite">NANITES (${Math.ceil(this.player1.naniteTimer)}s)</span>`;
                }
                if (this.player1.overshield) {
                    badges += `<span class="badge shield" style="border-color:#39ff14; color:#39ff14; box-shadow:0 0 10px #39ff14;">OVERSHIELD</span>`;
                }
                if (this.player1.isOverclocked) {
                    badges += `<span class="badge overclock" style="border-color:#ff007f; color:#ff007f; box-shadow:0 0 10px #ff007f;">OVERCLOCK 38%</span>`;
                }
                badgeContainer.innerHTML = badges;
            }
        }
    }

    exportTacticalDebrief() {
        const p = this.player1;
        const score = p ? p.score : this.score;
        const kills = p ? p.kills : 0;
        const length = p ? p.body.length : 0;
        const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const debriefText = [
            `=========================================`,
            `  NEON_SNAKE.2077 // TACTICAL DEBRIEF`,
            `=========================================`,
            `TIMESTAMP      : ${dateStr}`,
            `PILOT CALLSIGN : ${p ? p.name : 'AGENT'}`,
            `OPERATION MODE : ${this.mode.toUpperCase()} [${this.difficulty.toUpperCase()}]`,
            `CYBER CHASSIS  : ${(p?.headModel || 'apex').toUpperCase()} // ${(p?.trailStyle || 'ribbon').toUpperCase()} TRAIL`,
            `-----------------------------------------`,
            `FINAL SCORE    : ${score.toString().padStart(6, '0')}`,
            `HIGH SCORE     : ${this.highScore.toString().padStart(6, '0')}`,
            `CHASSIS LENGTH : ${length} NODES`,
            `HOSTILE KILLS  : ${kills} UNITS`,
            `KINETIC PARRIES: ${p?.parrySuccessCount || 0} DEFLECTIONS`,
            `EMP MINE CHAINS: ${p?.mineChainCount || 0} OVERLOADS`,
            `QUANTUM WARPS  : ${p?.warpOverdriveCount || 0} OVERDRIVES`,
            `RAILGUN SHOTS  : ${p?.railgunShotCount || 0} PIERCING BURSTS`,
            `NANITE REPAIRS : ${p?.naniteRepairCount || 0} RECONSTRUCTIONS`,
            `PULSE NOVAS   : ${p?.pulseNovaCount || 0} DISCHARGES`,
            `COMBAT STATUS  : ${this.bossSnake && !this.bossSnake.isAlive ? 'CYBER LEVIATHAN SLAIN' : 'MISSION TERMINATED'}`,
            `=========================================`,
            `GRID PROTOCOL: VERIFIED & LOGGED`,
            `PLAY AT: https://soumyadeepmagnusx.github.io/neon-snake205510/`
        ].join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(debriefText).then(() => {
                if (window.particleEngine) {
                    window.particleEngine.addText('MISSION REPORT COPIED!', this.canvas.width / 2, this.canvas.height / 2, '#39ff14', 18);
                }
            }).catch(() => {
                this.fallbackCopyText(debriefText);
            });
        } else {
            this.fallbackCopyText(debriefText);
        }
        return debriefText;
    }

    fallbackCopyText(text) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (window.particleEngine) {
                window.particleEngine.addText('MISSION REPORT COPIED!', this.canvas.width / 2, this.canvas.height / 2, '#39ff14', 18);
            }
        } catch (e) {
            console.warn('Copy debrief fallback error', e);
        }
    }

    downloadDebriefSnapshot() {
        try {
            const dataUrl = this.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `NEON_SNAKE_2077_SCORECARD_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            if (window.particleEngine) {
                window.particleEngine.addText('SNAPSHOT DOWNLOADED', this.canvas.width / 2, this.canvas.height / 2, '#00f0ff', 18);
            }
        } catch (e) {
            console.error('Snapshot export failed', e);
        }
    }

    drawOverclockVfx(ctx, w, h) {
        ctx.save();
        // Radial temporal warp tunnel
        const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.72);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        grad.addColorStop(1, 'rgba(138, 43, 226, 0.28)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Cyber matrix time dilation banner
        ctx.font = "900 12px 'Orbitron', monospace";
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ MATRIX OVERCLOCK ACTIVE // TEMPORAL DILATION 38%', w / 2, 45);
        ctx.restore();
    }

    loop(currentTime) {
        const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
        this.lastTime = currentTime;

        // FPS calculation
        this.frameCount++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 0.5) {
            this.fps = Math.round(this.frameCount / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
            const fpsEl = document.getElementById('fpsCounter');
            if (fpsEl) fpsEl.innerText = `${this.fps} FPS`;
        }

        if (this.isVcrReplaying) {
            this.draw();
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        // Matrix Temporal Overclock Dilation (38% speed bullet-time simulation)
        const effectiveDt = (this.player1 && this.player1.isOverclocked) ? dt * 0.38 : dt;

        this.update(effectiveDt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new NeonSnakeGame();
    window.startGame = function() {
        if (window.game) {
            if (window.cyberAudio) {
                window.cyberAudio.playClick();
                window.cyberAudio.startMusic();
            }
            window.game.startGame();
        }
    };
    requestAnimationFrame((t) => window.game.loop(t));

    // Register PWA Service Worker for Offline Arcade Play
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('PWA ServiceWorker notice:', err);
        });
    }
});
