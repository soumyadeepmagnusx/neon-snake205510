// NeonSnake 2077 - Main Game Engine
// Open-source synthwave canvas arcade game

class NeonSnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Grid settings
        this.gridWidth = 36;
        this.gridHeight = 36;
        this.cellSize = 20;

        // Visual Canvas dimensions
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;

        // Game State
        this.mode = 'solo'; // 'solo', 'bots', 'local2p', 'online'
        this.difficulty = 'arcade'; // 'casual', 'arcade', 'overclocked'
        this.theme = 'neon2077'; // 'neon2077', 'outrun', 'matrix', 'cyberpunk'
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('neonSnake_highScore') || '0', 10);
        this.combo = 1;
        this.comboTimer = 0;

        // Game entities
        this.snakes = [];
        this.player1 = null;
        this.player2 = null;
        this.foods = [];
        this.obstacles = [];

        // Visual / Audio state
        this.cameraShake = 0;
        this.crtFilterEnabled = true;
        this.glowEnabled = true;

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
                if (e.code === 'KeyW' || (this.mode === 'solo' && e.code === 'ArrowUp')) {
                    this.player1.setDirection(0, -1);
                } else if (e.code === 'KeyS' || (this.mode === 'solo' && e.code === 'ArrowDown')) {
                    this.player1.setDirection(0, 1);
                } else if (e.code === 'KeyA' || (this.mode === 'solo' && e.code === 'ArrowLeft')) {
                    this.player1.setDirection(-1, 0);
                } else if (e.code === 'KeyD' || (this.mode === 'solo' && e.code === 'ArrowRight')) {
                    this.player1.setDirection(1, 0);
                }

                // Turbo Boost
                if (e.code === 'Space' || e.code === 'ShiftLeft') {
                    this.player1.setBoosting(true);
                    if (window.cyberAudio) window.cyberAudio.playBoost();
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

            // Player 2 controls (Arrow keys in local 2-Player mode)
            if (this.mode === 'local2p' && this.player2 && this.player2.isAlive) {
                if (e.code === 'ArrowUp') this.player2.setDirection(0, -1);
                else if (e.code === 'ArrowDown') this.player2.setDirection(0, 1);
                else if (e.code === 'ArrowLeft') this.player2.setDirection(-1, 0);
                else if (e.code === 'ArrowRight') this.player2.setDirection(1, 0);

                if (e.code === 'Enter' || e.code === 'ControlRight') {
                    this.player2.setBoosting(true);
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
            }

            if (this.mode === 'local2p' && this.player2) {
                if (e.code === 'Enter' || e.code === 'ControlRight') {
                    this.player2.setBoosting(false);
                }
            }
        });
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
                instructions.innerText = 'SURVIVAL MODE: Dodge laser obstacles, gather cyber cores, unleash turbo overdrive!';
            } else if (mode === 'bots') {
                instructions.innerText = 'BOT BATTLE: Arena deathmatch against AI snakes with intelligent pathfinding & traps!';
            } else if (mode === 'local2p') {
                instructions.innerText = 'LOCAL 2P: P1 uses WASD + SPACE. P2 uses ARROWS + ENTER. First to crash loses!';
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
        window.particleEngine.clear();

        // Speed interval based on difficulty
        let baseSpeed = 0.11;
        if (this.difficulty === 'casual') baseSpeed = 0.14;
        else if (this.difficulty === 'overclocked') baseSpeed = 0.08;

        const currentTheme = this.themes[this.theme] || this.themes.neon2077;

        // Hide overlay modals
        document.getElementById('startModal').style.display = 'none';
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('pauseModal').style.display = 'none';

        // Spawn Snakes according to mode
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

        // Spawn initial food batches
        for (let i = 0; i < 5; i++) {
            this.spawnFood();
        }

        this.updateHUD();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseModal').style.display = this.isPaused ? 'flex' : 'none';
    }

    generateObstacles(count) {
        this.obstacles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * (this.gridWidth - 8)) + 4;
            const y = Math.floor(Math.random() * (this.gridHeight - 8)) + 4;
            const isHorizontal = Math.random() > 0.5;
            const length = Math.floor(Math.random() * 3) + 2;

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
        let rand = Math.random() * totalWeight;
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
            x = Math.floor(Math.random() * this.gridWidth);
            y = Math.floor(Math.random() * this.gridHeight);
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
        const isPhasing = snake.phaseShiftTimer > 0;
        const isShielded = snake.spawnShieldTimer > 0 || snake.empShieldTimer > 0;

        // 1. Arena boundary check
        if (newHeadX < 0 || newHeadX >= gridWidth || newHeadY < 0 || newHeadY >= gridHeight) {
            if (isPhasing) {
                // Wrap around when phasing
                this.unlockAchievement('phaseWalker');
                return true;
            } else if (!isShielded) {
                this.cameraShake = 0.35;
                snake.kill();
                this.checkGameOver();
                return false;
            }
        }

        // 2. Obstacle collision
        for (const obs of this.obstacles) {
            if (obs.x === newHeadX && obs.y === newHeadY) {
                if (isPhasing) {
                    this.unlockAchievement('phaseWalker');
                } else if (!isShielded) {
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

        // Briefly stun / freeze enemy snakes
        for (const s of this.snakes) {
            if (s !== sourceSnake && s.isAlive) {
                s.moveTimer = -0.6; // Delay next step
                window.particleEngine.addText('STUNNED', s.gridX * 20, s.gridY * 20, '#ffe600', 14);
            }
        }
    }

    checkGameOver() {
        if (this.mode === 'solo' && this.player1 && !this.player1.isAlive) {
            this.triggerGameOver('CYBER CRASH: SYSTEM TERMINATED');
        } else if (this.mode === 'bots') {
            const living = this.snakes.filter(s => s.isAlive);
            if (!this.player1.isAlive) {
                this.triggerGameOver('NEXUS ELIMINATED YOU');
            } else if (living.length === 1 && living[0] === this.player1) {
                this.triggerGameOver('VICTORY: CYBER ARENA CONQUERED!');
            }
        } else if (this.mode === 'local2p') {
            const living = this.snakes.filter(s => s.isAlive);
            if (living.length <= 1) {
                const winner = living.length === 1 ? living[0].name : 'DRAW';
                this.triggerGameOver(`${winner} DOMINATES THE GRID!`);
            }
        } else if (this.mode === 'online') {
            const living = this.snakes.filter(s => s.isAlive);
            if (living.length <= 1) {
                const winner = living.length === 1 ? living[0].name : 'DRAW';
                this.triggerGameOver(`${winner} WINS DUEL!`);
            }
        }
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
            // Client receives host authoritative simulation
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

        // 3. Draw Obstacles (Neon Data Barriers)
        this.drawObstacles(ctx);

        // 4. Draw Foods & Powerups
        this.drawFoods(ctx);

        // 5. Draw Snakes
        for (const s of this.snakes) {
            s.draw(ctx, this.cellSize);
        }

        // 6. Draw Particles & Overlays
        window.particleEngine.draw(ctx, w, h);

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
        document.getElementById('scoreDisplay').innerText = this.score;
        document.getElementById('highScoreDisplay').innerText = this.highScore;
        document.getElementById('comboDisplay').innerText = `x${this.combo}`;

        if (this.player1) {
            const boostBar = document.getElementById('boostFill');
            if (boostBar) {
                boostBar.style.width = `${Math.round(this.player1.boostEnergy)}%`;
                boostBar.classList.toggle('depleted', this.player1.boostEnergy < 15);
            }

            // Power-up badge display
            const badgeContainer = document.getElementById('activePowerups');
            if (badgeContainer) {
                let badges = '';
                if (this.player1.phaseShiftTimer > 0) {
                    badges += `<span class="badge phase">PHASE (${Math.ceil(this.player1.phaseShiftTimer)}s)</span>`;
                }
                if (this.player1.multiplierTimer > 0) {
                    badges += `<span class="badge multiplier">3X MATRIX (${Math.ceil(this.player1.multiplierTimer)}s)</span>`;
                }
                if (this.player1.spawnShieldTimer > 0 || this.player1.empShieldTimer > 0) {
                    badges += `<span class="badge shield">SHIELD</span>`;
                }
                badgeContainer.innerHTML = badges;
            }
        }
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

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new NeonSnakeGame();
    requestAnimationFrame((t) => window.game.loop(t));
});
