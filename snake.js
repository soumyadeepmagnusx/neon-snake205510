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

        // Combat & Weaponry
        this.ammo = 5;
        this.maxAmmo = 5;
        this.ammoCooldown = 0;
        this.isBoss = false;
        this.bossHealth = 100;
        this.maxBossHealth = 100;

        // Tactical Secondary: Deployable Proximity Cyber Mines & Wormholes
        this.mines = 3;
        this.maxMines = 3;
        this.mineCooldown = 0;
        this.portalCooldown = 0;

        // Cyber Forge Cosmetics & Tactical Mechanics
        this.headModel = 'apex'; // 'apex', 'mecha', 'skull', 'lightcycle'
        this.trailStyle = 'ribbon'; // 'ribbon', 'matrix', 'plasma', 'hyperwave'
        this.isDrifting = false;

        // Tactical Kinetic Parry & Temporal Matrix Overclock
        this.parryTimer = 0;        // active parry defense window (0.55s)
        this.parryCooldown = 0;     // cooldown timer between parries
        this.parrySuccessCount = 0;
        this.mineChainCount = 0;
        this.warpOverdriveTimer = 0;
        this.warpOverdriveCount = 0;
        this.railgunShotCount = 0;
        this.naniteTimer = 0;
        this.nanitePulseTimer = 0;
        this.naniteCooldown = 0;
        this.naniteRepairCount = 0;
        this.overshield = false;
        this.overclockEnergy = 100; // 0 - 100%
        this.isOverclocked = false;

        // Movement Timing
        this.baseMoveInterval = 0.11; // base seconds per grid step
        this.moveTimer = 0;
    }

    triggerParry() {
        if (this.parryCooldown > 0 || !this.isAlive || this.body.length === 0) return false;
        this.parryTimer = 0.55;
        this.parryCooldown = 2.2;
        if (window.cyberAudio) window.cyberAudio.playParry();
        if (window.particleEngine) {
            window.particleEngine.addText('PARRY READY', this.body[0].pixelX, this.body[0].pixelY - 22, '#00f0ff', 13);
        }
        return true;
    }

    triggerNanites() {
        if (this.naniteCooldown > 0 || !this.isAlive || this.body.length === 0) return false;
        this.naniteTimer = 8.0;
        this.naniteCooldown = 14.0;
        this.overshield = true;
        if (window.cyberAudio) {
            window.cyberAudio.playNaniteRepair();
            if (this.id === 'player1') window.cyberAudio.announce('Nanite repair drone swarm deployed', true);
        }
        if (window.particleEngine) {
            window.particleEngine.spawnNaniteWeld(this.body[0].pixelX, this.body[0].pixelY);
            window.particleEngine.addText('⚡ NANITE DRONES ONLINE!', this.body[0].pixelX, this.body[0].pixelY - 24, '#39ff14', 16);
        }
        return true;
    }

    setOverclock(active) {
        if (active && this.overclockEnergy > 10 && this.isAlive) {
            if (!this.isOverclocked && window.cyberAudio) {
                window.cyberAudio.playSlowMo();
                window.cyberAudio.announce('Temporal overclock engaged', true);
            }
            this.isOverclocked = true;
        } else {
            this.isOverclocked = false;
        }
    }

    setDrifting(drifting) {
        this.isDrifting = drifting;
    }

    deployMine() {
        if (this.mines <= 0 || this.mineCooldown > 0 || !this.isAlive || this.body.length === 0) return null;
        this.mines--;
        this.mineCooldown = 0.8;
        if (window.cyberAudio) window.cyberAudio.playMineArm();

        const tail = this.body[this.body.length - 1];
        return {
            gridX: tail.x,
            gridY: tail.y,
            pixelX: tail.pixelX,
            pixelY: tail.pixelY,
            owner: this,
            armTimer: 0.6,
            isArmed: false,
            life: 25,
            radius: 14
        };
    }

    shootPlasma() {
        if (this.ammo <= 0 || this.ammoCooldown > 0 || !this.isAlive) return null;
        this.ammo--;
        this.ammoCooldown = 0.22;
        if (window.cyberAudio) window.cyberAudio.playLaser();
        
        return {
            x: this.body[0].pixelX,
            y: this.body[0].pixelY,
            vx: this.dir.x * 12,
            vy: this.dir.y * 12,
            color: this.colorScheme.glow,
            owner: this,
            life: 1.2
        };
    }

    shootRailgun() {
        if (this.ammo < 2 || this.ammoCooldown > 0 || !this.isAlive || this.body.length === 0) return null;
        this.ammo -= 2;
        this.ammoCooldown = 0.55;
        this.railgunShotCount = (this.railgunShotCount || 0) + 1;
        if (window.cyberAudio) {
            window.cyberAudio.playRailgunFire();
            if (this.id === 'player1') window.cyberAudio.announce('Railgun discharged', true);
        }

        return {
            x: this.body[0].pixelX,
            y: this.body[0].pixelY,
            vx: this.dir.x * 22,
            vy: this.dir.y * 22,
            color: '#ffe600',
            owner: this,
            isRailgun: true,
            pierceLimit: 5,
            pierceCount: 0,
            hitSnakes: new Set(),
            life: 1.6
        };
    }

    takeDamage(amount = 25) {
        if (this.spawnShieldTimer > 0 || this.empShieldTimer > 0) return false;
        if (window.cyberAudio) window.cyberAudio.playPlasmaHit();

        if (this.isBoss) {
            this.bossHealth -= amount;
            if (this.bossHealth <= 0) {
                this.kill();
                return 'destroyed';
            }
            return 'damaged';
        } else {
            // Shear 2 tail segments off
            if (this.body.length > 3) {
                const sheared = this.body.splice(this.body.length - 2, 2);
                return sheared;
            } else {
                this.kill();
                return 'destroyed';
            }
        }
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
        if (this.warpOverdriveTimer > 0) {
            this.warpOverdriveTimer -= dt;
            if (window.particleEngine && Math.random() < 0.35 && this.body.length > 0) {
                window.particleEngine.spawnTemporalDistortion(this.body[0].pixelX, this.body[0].pixelY);
            }
        }

        // Nanite Repair Drone Swarm
        if (this.naniteTimer > 0) {
            this.naniteTimer -= dt;
            this.nanitePulseTimer = (this.nanitePulseTimer || 0) + dt;
            if (this.nanitePulseTimer >= 1.6) {
                this.nanitePulseTimer = 0;
                this.grow(1);
                this.overshield = true;
                this.naniteRepairCount = (this.naniteRepairCount || 0) + 1;
                this.score += 50;
                if (window.particleEngine && this.body.length > 0) {
                    window.particleEngine.spawnNaniteWeld(this.body[0].pixelX, this.body[0].pixelY);
                    window.particleEngine.addText('⚡ REPAIRED +1', this.body[0].pixelX, this.body[0].pixelY - 22, '#39ff14', 14);
                }
                if (window.cyberAudio) window.cyberAudio.playNaniteRepair();
            }
        }
        if (this.naniteCooldown > 0) this.naniteCooldown -= dt;

        // Weapon & Ammo Cooldown
        if (this.ammoCooldown > 0) this.ammoCooldown -= dt;
        if (this.mineCooldown > 0) this.mineCooldown -= dt;
        if (this.portalCooldown > 0) this.portalCooldown -= dt;

        // Tactical Parry & Temporal Overclock Timers
        if (this.parryTimer > 0) this.parryTimer -= dt;
        if (this.parryCooldown > 0) this.parryCooldown -= dt;

        if (this.isOverclocked) {
            this.overclockEnergy = Math.max(0, this.overclockEnergy - dt * 26);
            if (this.overclockEnergy <= 0) {
                this.isOverclocked = false;
            }
            if (window.particleEngine && Math.random() < 0.4 && this.body.length > 0) {
                window.particleEngine.spawnTemporalDistortion(this.body[0].pixelX, this.body[0].pixelY);
            }
        } else {
            this.overclockEnergy = Math.min(100, this.overclockEnergy + dt * 14);
        }

        if (this.ammo < this.maxAmmo) {
            this.ammoRechargeTimer = (this.ammoRechargeTimer || 0) + dt;
            if (this.ammoRechargeTimer >= 2.2) {
                this.ammoRechargeTimer = 0;
                this.ammo = Math.min(this.maxAmmo, this.ammo + 1);
            }
        }

        if (this.mines < this.maxMines) {
            this.mineRechargeTimer = (this.mineRechargeTimer || 0) + dt;
            if (this.mineRechargeTimer >= 5.0) {
                this.mineRechargeTimer = 0;
                this.mines = Math.min(this.maxMines, this.mines + 1);
            }
        }

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
        if (this.isDrifting) speedMultiplier = 0.45; // Tactical Cyber Brake / Drift
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

            // Particle Trail Emissions
            if (window.particleEngine) {
                if (this.isBoosting) {
                    window.particleEngine.spawnTrailSparks(
                        this.gridX * 20 + 10,
                        this.gridY * 20 + 10,
                        this.colorScheme.glow,
                        3
                    );
                }
                if (this.isDrifting) {
                    window.particleEngine.spawnDriftSparks(
                        this.gridX * 20 + 10,
                        this.gridY * 20 + 10,
                        this.dir,
                        4
                    );
                }
                if (this.trailStyle === 'matrix' && Math.random() < 0.5) {
                    window.particleEngine.spawnBinaryMatrixTrail(
                        this.gridX * 20 + 10,
                        this.gridY * 20 + 10,
                        this.colorScheme.primary
                    );
                }
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

        const isPhasing = this.phaseShiftTimer > 0 || this.warpOverdriveTimer > 0;
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
            
            const trail = this.trailStyle || 'ribbon';
            if (trail === 'matrix') {
                ctx.lineWidth = this.isBoosting ? cellSize * 0.75 : cellSize * 0.5;
                ctx.strokeStyle = '#39ff14';
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#39ff14';
                ctx.setLineDash([8, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            } else if (trail === 'plasma') {
                ctx.lineWidth = this.isBoosting ? cellSize * 0.9 : cellSize * 0.65;
                const hue = (Date.now() * 0.1) % 360;
                ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
                ctx.shadowBlur = 22;
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.stroke();
            } else if (trail === 'hyperwave') {
                ctx.lineWidth = this.isBoosting ? cellSize * 0.85 : cellSize * 0.6;
                ctx.strokeStyle = '#ff00aa';
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#00f0ff';
                ctx.stroke();
            } else {
                // Classic Cyber Ribbon
                ctx.lineWidth = this.isBoosting ? cellSize * 0.8 : cellSize * 0.6;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = this.colorScheme.secondary;
                ctx.shadowBlur = this.isBoosting ? 20 : 10;
                ctx.shadowColor = this.colorScheme.glow;
                ctx.stroke();
            }

            // Inner bright core ribbon
            ctx.beginPath();
            ctx.moveTo(this.body[0].pixelX, this.body[0].pixelY);
            for (let i = 1; i < this.body.length; i++) {
                ctx.lineTo(this.body[i].pixelX, this.body[i].pixelY);
            }
            ctx.lineWidth = cellSize * 0.28;
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
            if (isHead) {
                const angle = Math.atan2(this.dir.y, this.dir.x);
                ctx.rotate(angle);

                const model = this.headModel || 'apex';
                if (model === 'mecha') {
                    // Armored Hexagonal Warhead
                    ctx.fillStyle = '#e6f7ff';
                    ctx.beginPath();
                    for (let s = 0; s < 6; s++) {
                        const a = (s * Math.PI) / 3;
                        const px = Math.cos(a) * radius * 1.05;
                        const py = Math.sin(a) * radius * 0.95;
                        if (s === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = this.colorScheme.primary;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Forward ram mandibles
                    ctx.fillStyle = '#ff0055';
                    ctx.beginPath();
                    ctx.moveTo(radius * 0.7, -radius * 0.6);
                    ctx.lineTo(radius * 1.4, -radius * 0.3);
                    ctx.lineTo(radius * 0.7, 0);
                    ctx.lineTo(radius * 1.4, radius * 0.3);
                    ctx.lineTo(radius * 0.7, radius * 0.6);
                    ctx.fill();

                    // Central target sensor
                    ctx.fillStyle = '#00f0ff';
                    ctx.beginPath();
                    ctx.arc(radius * 0.1, 0, 3, 0, Math.PI * 2);
                    ctx.fill();

                } else if (model === 'skull') {
                    // Cybernetic Skull
                    ctx.fillStyle = '#f0f3f8';
                    ctx.beginPath();
                    ctx.arc(-radius * 0.1, 0, radius * 0.85, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(radius * 0.1, -radius * 0.45, radius * 0.8, radius * 0.9);

                    // Hollow eye sockets
                    ctx.fillStyle = '#05070f';
                    ctx.beginPath();
                    ctx.arc(0, -radius * 0.3, 3.5, 0, Math.PI * 2);
                    ctx.arc(0, radius * 0.3, 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Red laser eye glare
                    ctx.fillStyle = '#ff0055';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff0055';
                    ctx.beginPath();
                    ctx.arc(0.5, -radius * 0.3, 1.8, 0, Math.PI * 2);
                    ctx.arc(0.5, radius * 0.3, 1.8, 0, Math.PI * 2);
                    ctx.fill();

                    // Grille lines
                    ctx.strokeStyle = '#05070f';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(radius * 0.35, -radius * 0.35); ctx.lineTo(radius * 0.35, radius * 0.35);
                    ctx.moveTo(radius * 0.6, -radius * 0.35); ctx.lineTo(radius * 0.6, radius * 0.35);
                    ctx.stroke();

                } else if (model === 'lightcycle') {
                    // Streamlined Tron Lightcycle Canopy
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.moveTo(radius * 1.25, 0);
                    ctx.lineTo(radius * 0.3, -radius * 0.85);
                    ctx.lineTo(-radius * 0.9, -radius * 0.7);
                    ctx.lineTo(-radius * 0.9, radius * 0.7);
                    ctx.lineTo(radius * 0.3, radius * 0.85);
                    ctx.closePath();
                    ctx.fill();

                    // Glowing wrap-around visor cockpit
                    ctx.fillStyle = this.colorScheme.glow;
                    ctx.shadowBlur = 16;
                    ctx.shadowColor = this.colorScheme.glow;
                    ctx.beginPath();
                    ctx.ellipse(radius * 0.15, 0, radius * 0.6, radius * 0.45, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Side runner strips
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-radius * 0.8, -radius * 0.6);
                    ctx.lineTo(radius * 0.6, -radius * 0.4);
                    ctx.moveTo(-radius * 0.8, radius * 0.6);
                    ctx.lineTo(radius * 0.6, radius * 0.4);
                    ctx.stroke();

                } else {
                    // 'apex': Aerodynamic Cyber Visor (Default)
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, radius * 1.1, radius * 0.85, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Sleek visor slit
                    ctx.fillStyle = this.colorScheme.glow;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = this.colorScheme.glow;
                    ctx.fillRect(radius * 0.1, -radius * 0.5, radius * 0.35, radius);

                    // Dual optic cores
                    ctx.fillStyle = '#ff0055';
                    ctx.beginPath();
                    ctx.arc(radius * 0.35, -radius * 0.28, 2.5, 0, Math.PI * 2);
                    ctx.arc(radius * 0.35, radius * 0.28, 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Crest fin
                    ctx.strokeStyle = this.colorScheme.primary;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-radius * 0.8, 0);
                    ctx.lineTo(radius * 0.2, 0);
                    ctx.stroke();
                }

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

        // Holographic Hexagonal Kinetic Deflector Barrier
        if (this.parryTimer > 0 && this.body.length > 0) {
            const head = this.body[0];
            ctx.save();
            ctx.translate(head.pixelX, head.pixelY);
            ctx.rotate(Date.now() * 0.009);

            const hexRadius = cellSize * 1.5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const px = Math.cos(angle) * hexRadius;
                const py = Math.sin(angle) * hexRadius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 24;
            ctx.shadowColor = '#00f0ff';
            ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
            ctx.fill();
            ctx.stroke();

            // Inner electric rotating ring
            ctx.beginPath();
            ctx.arc(0, 0, hexRadius * 0.65, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffe600';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffe600';
            ctx.setLineDash([6, 6]);
            ctx.stroke();

            ctx.restore();
        }

        // Quantum Warp Overdrive Dual-Color Aura
        if (this.warpOverdriveTimer > 0 && this.body.length > 0) {
            const head = this.body[0];
            ctx.save();
            ctx.translate(head.pixelX, head.pixelY);
            ctx.rotate(-Date.now() * 0.008);
            ctx.beginPath();
            ctx.arc(0, 0, cellSize * 1.35, 0, Math.PI * 2);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00f0ff';
            ctx.setLineDash([4, 6]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, cellSize * 1.05, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff7700';
            ctx.stroke();
            ctx.restore();
        }

        // Autonomous Orbiting Nanite Repair Drones
        if (this.naniteTimer > 0 && this.body.length > 0) {
            const head = this.body[0];
            ctx.save();
            ctx.translate(head.pixelX, head.pixelY);
            const droneOrbitRadius = cellSize * 1.55;
            const time = Date.now() * 0.007;
            for (let d = 0; d < 3; d++) {
                const angle = time + (d * Math.PI * 2) / 3;
                const dx = Math.cos(angle) * droneOrbitRadius;
                const dy = Math.sin(angle) * droneOrbitRadius;

                // Drone glow & core
                ctx.fillStyle = '#39ff14';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#39ff14';
                ctx.beginPath();
                ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Connecting beam to head
                ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(dx, dy);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Ablative Overshield Barrier
        if (this.overshield && this.body.length > 0) {
            const head = this.body[0];
            ctx.save();
            ctx.translate(head.pixelX, head.pixelY);
            ctx.rotate(Date.now() * 0.005);
            ctx.beginPath();
            ctx.arc(0, 0, cellSize * 1.4, 0, Math.PI * 2);
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#39ff14';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Boss Health Bar above head
        if (this.isBoss && this.body.length > 0) {
            const head = this.body[0];
            ctx.save();
            ctx.translate(head.pixelX, head.pixelY - cellSize * 1.6);
            ctx.font = "900 11px 'Orbitron', monospace";
            ctx.fillStyle = '#ff0055';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff0055';
            ctx.fillText(`⚡ ${this.name} [BOSS]`, 0, -6);

            // Bar background
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 1;
            ctx.strokeRect(-40, 0, 80, 8);
            ctx.fillRect(-40, 0, 80, 8);

            // Health fill
            const pct = Math.max(0, this.bossHealth / this.maxBossHealth);
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(-40, 0, 80 * pct, 8);
            ctx.restore();
        }

        ctx.restore();
    }
}

window.CyberSnake = CyberSnake;
