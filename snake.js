// Cyber Snake Entity with Smooth Rendering, Turbo Boost, & Powerup States

class CyberSnake {
    constructor(id, name, colorScheme, startX, startY, startDir, isAi = false) {
        this.id = id;
        this.name = name;
        this.colorScheme = colorScheme; // { primary: '#00f0ff', secondary: '#0088cc', glow: '#00f0ff' }
        this.isAi = isAi;
        this.isAlive = true;

        this.gridX = startX;
        this.gridY = startY;
        this.dir = { ...startDir };
        this.nextDir = { ...startDir };
        this.dirQueue = [];

        // Body segments: array of { x, y, pixelX, pixelY }
        this.body = [];
        this.initialLength = 4;
        for (let i = 0; i < this.initialLength; i++) {
            this.body.push({
                x: startX - startDir.x * i,
                y: startY - startDir.y * i,
                pixelX: (startX - startDir.x * i) * 20 + 10,
                pixelY: (startY - startDir.y * i) * 20 + 10
            });
        }

        // Stats & Mechanics
        this.score = 0;
        this.kills = 0;
        this.boostEnergy = 100; // 0 - 100%
        this.isBoosting = false;
        this.phaseShiftTimer = 0; // seconds
        this.empShieldTimer = 0;
        this.multiplierTimer = 0;
        this.spawnShieldTimer = 2.5; // brief invulnerability at start

        // Movement Timing
        this.baseMoveInterval = 0.11; // base seconds per grid step
        this.moveTimer = 0;
    }

    setDirection(dx, dy) {
        // Prevent 180-degree instant reversal into own neck
        const lastDir = this.dirQueue.length > 0 ? this.dirQueue[this.dirQueue.length - 1] : this.dir;
        if (dx === -lastDir.x && dy === -lastDir.y) return;
        if (dx === lastDir.x && dy === lastDir.y) return;

        if (this.dirQueue.length < 2) {
            this.dirQueue.push({ x: dx, y: dy });
        }
    }

    setBoosting(boosting) {
        if (boosting && this.boostEnergy > 10) {
            this.isBoosting = true;
        } else {
            this.isBoosting = false;
        }
    }

    update(dt, gridWidth, gridHeight, onMoveStep) {
        if (!this.isAlive) return;

        // Timers
        if (this.phaseShiftTimer > 0) this.phaseShiftTimer -= dt;
        if (this.empShieldTimer > 0) this.empShieldTimer -= dt;
        if (this.multiplierTimer > 0) this.multiplierTimer -= dt;
        if (this.spawnShieldTimer > 0) this.spawnShieldTimer -= dt;

        // Boost Energy Management
        if (this.isBoosting) {
            this.boostEnergy -= dt * 45;
            if (this.boostEnergy <= 0) {
                this.boostEnergy = 0;
                this.isBoosting = false;
            }
        } else {
            this.boostEnergy = Math.min(100, this.boostEnergy + dt * 20);
        }

        // Speed calculation
        let speedMultiplier = 1.0;
        if (this.isBoosting) speedMultiplier = 2.1;
        const currentInterval = this.baseMoveInterval / speedMultiplier;

        this.moveTimer += dt;

        // Execute grid movement step when timer accumulates
        while (this.moveTimer >= currentInterval) {
            this.moveTimer -= currentInterval;

            // Shift next queued direction
            if (this.dirQueue.length > 0) {
                this.dir = this.dirQueue.shift();
            }

            // Calculate next grid head position
            const newHeadX = this.gridX + this.dir.x;
            const newHeadY = this.gridY + this.dir.y;

            // Trigger grid movement step callback (collision checking, food eating)
            const canProceed = onMoveStep(this, newHeadX, newHeadY, gridWidth, gridHeight);
            if (!canProceed || !this.isAlive) break;

            this.gridX = newHeadX;
            this.gridY = newHeadY;

            // Add new head position to body
            this.body.unshift({
                x: this.gridX,
                y: this.gridY,
                pixelX: this.gridX * 20 + 10,
                pixelY: this.gridY * 20 + 10
            });

            // If not growing, pop the tail
            if (!this.growPending) {
                this.body.pop();
            } else {
                this.growPending = false;
            }

            // Spawn boost sparks
            if (this.isBoosting && window.particleEngine) {
                window.particleEngine.spawnTrailSparks(
                    this.gridX * 20 + 10,
                    this.gridY * 20 + 10,
                    this.colorScheme.glow,
                    3
                );
            }
        }

        // Smooth pixel interpolation for segments
        const cellSize = 20;
        for (let i = 0; i < this.body.length; i++) {
            const seg = this.body[i];
            const targetX = seg.x * cellSize + cellSize / 2;
            const targetY = seg.y * cellSize + cellSize / 2;
            seg.pixelX += (targetX - seg.pixelX) * 0.45;
            seg.pixelY += (targetY - seg.pixelY) * 0.45;
        }
    }

    grow(amount = 1) {
        this.growPending = true;
        this.boostEnergy = Math.min(100, this.boostEnergy + 15);
    }

    kill() {
        if (!this.isAlive) return;
        this.isAlive = false;
        if (window.particleEngine) {
            window.particleEngine.spawnDeathExplosion(this.body, this.colorScheme.glow);
        }
        if (window.cyberAudio) {
            window.cyberAudio.playCrash();
        }
    }

    draw(ctx, cellSize = 20) {
        if (this.body.length === 0) return;

        ctx.save();

        const isPhasing = this.phaseShiftTimer > 0;
        const isShielded = this.spawnShieldTimer > 0 || this.empShieldTimer > 0;

        if (isPhasing) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.015) * 0.25;
        }

        // Draw light-ribbon / thermal trail connection along body
        if (this.body.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.body[0].pixelX, this.body[0].pixelY);
            for (let i = 1; i < this.body.length; i++) {
                ctx.lineTo(this.body[i].pixelX, this.body[i].pixelY);
            }
            ctx.lineWidth = this.isBoosting ? cellSize * 0.8 : cellSize * 0.6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = this.colorScheme.secondary;
            ctx.shadowBlur = this.isBoosting ? 20 : 10;
            ctx.shadowColor = this.colorScheme.glow;
            ctx.stroke();

            // Inner bright core ribbon
            ctx.beginPath();
            ctx.moveTo(this.body[0].pixelX, this.body[0].pixelY);
            for (let i = 1; i < this.body.length; i++) {
                ctx.lineTo(this.body[i].pixelX, this.body[i].pixelY);
            }
            ctx.lineWidth = cellSize * 0.3;
            ctx.strokeStyle = '#ffffff';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();
        }

        // Draw individual cyber nodes / segments
        for (let i = this.body.length - 1; i >= 0; i--) {
            const seg = this.body[i];
            const isHead = i === 0;
            const progress = 1 - (i / this.body.length);
            const radius = isHead ? cellSize * 0.48 : (cellSize * 0.32 + progress * 2);

            ctx.save();
            ctx.translate(seg.pixelX, seg.pixelY);

            // Glow aura
            ctx.shadowBlur = isHead ? 24 : 12;
            ctx.shadowColor = this.colorScheme.glow;

            // Node body
            ctx.beginPath();
            if (isHead) {
                ctx.fillStyle = '#ffffff';
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();

                // Cyber visor / eye optics facing travel direction
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff0055';
                ctx.fillStyle = '#ff0055';
                const eyeAngle = Math.atan2(this.dir.y, this.dir.x);
                const eyeDist = radius * 0.55;
                const eyeSpread = 0.45;

                const leftEyeX = Math.cos(eyeAngle - eyeSpread) * eyeDist;
                const leftEyeY = Math.sin(eyeAngle - eyeSpread) * eyeDist;
                const rightEyeX = Math.cos(eyeAngle + eyeSpread) * eyeDist;
                const rightEyeY = Math.sin(eyeAngle + eyeSpread) * eyeDist;

                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, 2.5, 0, Math.PI * 2);
                ctx.arc(rightEyeX, rightEyeY, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Segment ring / node
                ctx.fillStyle = this.colorScheme.primary;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();

                // Cyber tech core dot
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Shield aura ring if active
        if (isShielded) {
            const head = this.body[0];
            ctx.save();
            ctx.translate(head.pixelX, head.pixelY);
            ctx.beginPath();
            ctx.arc(0, 0, cellSize * 1.2, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffe600';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffe600';
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

window.CyberSnake = CyberSnake;
