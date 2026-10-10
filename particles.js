// Neon Cyberpunk Particle & FX Engine

class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.shape = shape; // 'circle', 'square', 'spark', 'ring'
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.2;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.rotation += this.vRot;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const progress = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = Math.min(1, progress * 1.5);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        const currentSize = Math.max(0.1, this.size * progress);

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'square') {
            ctx.fillRect(-currentSize / 2, -currentSize / 2, currentSize, currentSize);
        } else if (this.shape === 'spark') {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-currentSize * 2, 0);
            ctx.lineTo(currentSize * 2, 0);
            ctx.stroke();
        } else if (this.shape === 'ring') {
            ctx.lineWidth = 2;
            ctx.beginPath();
            const ringRadius = (1 - progress) * this.size * 3 + this.size;
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.shape === 'binary') {
            ctx.font = `900 ${Math.max(9, currentSize * 2.2)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', 0, 0);
        } else if (this.shape === 'flame') {
            ctx.beginPath();
            ctx.arc(0, 0, currentSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class FloatingText {
    constructor(text, x, y, color = '#00f0ff', fontSize = 16) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.fontSize = fontSize;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.vy = -1.2;
    }

    update(dt) {
        this.y += this.vy * dt * 60;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const progress = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.8);
        ctx.font = `900 ${this.fontSize}px 'Orbitron', 'Rajdhani', monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Shockwave {
    constructor(x, y, color = '#00f0ff', maxRadius = 50, life = 0.5) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.maxRadius = maxRadius;
        this.life = life;
        this.maxLife = life;
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const progress = 1 - Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.lineWidth = Math.max(1, (1 - progress) * 3);
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.beginPath();
        ctx.arc(this.x, this.y, progress * this.maxRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class ParticleEngine {
    constructor() {
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.ambientParticles = [];
        this.maxParticles = 600;
        this.initAmbient();
    }

    initAmbient() {
        this.ambientParticles = [];
        for (let i = 0; i < 40; i++) {
            this.ambientParticles.push({
                x: Math.random() * 800,
                y: Math.random() * 800,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4 - 0.2,
                size: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? '#00f0ff' : '#ff007f',
                alpha: Math.random() * 0.4 + 0.1
            });
        }
    }

    spawnBurst(x, y, color = '#00f0ff', count = 20, speed = 4) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const vel = (Math.random() * 0.8 + 0.2) * speed;
            const vx = Math.cos(angle) * vel;
            const vy = Math.sin(angle) * vel;
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 0.4 + 0.3;
            const shape = Math.random() > 0.6 ? 'spark' : (Math.random() > 0.5 ? 'square' : 'circle');
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, shape));
        }

        // Add an expanding shockwave ring
        this.particles.push(new Particle(x, y, 0, 0, color, 14, 0.45, 'ring'));
    }

    spawnDeathExplosion(segments, color = '#ff0055') {
        segments.forEach((seg, index) => {
            const delay = index * 0.02;
            setTimeout(() => {
                this.spawnBurst(seg.pixelX, seg.pixelY, color, 14, 6);
            }, delay * 1000);
        });
    }

    spawnTrailSparks(x, y, color = '#00f0ff', count = 2) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const vel = Math.random() * 1.5;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * vel,
                Math.sin(angle) * vel,
                color,
                Math.random() * 2.5 + 1,
                0.25,
                'circle'
            ));
        }
    }

    spawnEmpShockwave(x, y, radius = 180) {
        // High density ring explosion
        this.particles.push(new Particle(x, y, 0, 0, '#ffe600', radius / 2, 0.55, 'ring'));
        for (let i = 0; i < 45; i++) {
            const angle = (i / 45) * Math.PI * 2;
            const vel = 7 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * vel,
                Math.sin(angle) * vel,
                '#ffe600',
                3,
                0.4,
                'spark'
            ));
        }
    }

    spawnBinaryMatrixTrail(x, y, color = '#39ff14') {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push(new Particle(
            x + (Math.random() - 0.5) * 12,
            y + (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 0.4,
            Math.random() * 1.2 + 0.5,
            color,
            5,
            0.5,
            'binary'
        ));
    }

    spawnDriftSparks(x, y, dir, count = 4) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.atan2(-dir.y, -dir.x) + (Math.random() - 0.5) * 1.5;
            const vel = Math.random() * 4 + 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * vel,
                Math.sin(angle) * vel,
                Math.random() > 0.5 ? '#ff0055' : '#ffe600',
                Math.random() * 3 + 1.5,
                0.35,
                'spark'
            ));
        }
    }

    addDriftSparks(x, y, dir, count = 4) {
        this.spawnDriftSparks(x, y, dir, count);
    }

    spawnExplosion(x, y, color = '#ff0055', count = 20, speed = 5) {
        this.spawnBurst(x, y, color, count, speed);
    }

    spawnPortalWarp(x, y, color = '#00f0ff', count = 18) {
        // Expanding and imploding quantum rings
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 3 + 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                Math.random() * 3 + 2,
                0.55,
                'spark'
            ));
        }
        // Quantum pulse wave
        this.shockwaves.push(new Shockwave(x, y, color, 45, 0.45));
    }

    spawnWarpOverdriveRings(x, y, color = '#00f0ff') {
        this.shockwaves.push(new Shockwave(x, y, color, 75, 0.5));
        this.shockwaves.push(new Shockwave(x, y, '#ffffff', 50, 0.35));
        for (let i = 0; i < 22; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = (Math.PI * 2 * i) / 22;
            const speed = Math.random() * 4 + 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                Math.random() * 3 + 2,
                0.5,
                'ring'
            ));
        }
    }

    spawnRailgunImpact(x, y) {
        this.shockwaves.push(new Shockwave(x, y, '#ffe600', 70, 0.4));
        this.shockwaves.push(new Shockwave(x, y, '#00f0ff', 45, 0.25));
        for (let i = 0; i < 24; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.5 ? '#ffe600' : '#00f0ff',
                Math.random() * 3.5 + 2,
                0.35,
                'spark'
            ));
        }
    }

    spawnNaniteWeld(x, y) {
        this.shockwaves.push(new Shockwave(x, y, '#39ff14', 45, 0.35));
        for (let i = 0; i < 16; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.4 ? '#39ff14' : '#00f0ff',
                Math.random() * 2.5 + 1.5,
                0.35,
                'spark'
            ));
        }
    }

    spawnPulseNova(x, y) {
        this.shockwaves.push(new Shockwave(x, y, '#00f0ff', 130, 0.55));
        this.shockwaves.push(new Shockwave(x, y, '#ff007f', 90, 0.45));
        this.shockwaves.push(new Shockwave(x, y, '#ffffff', 55, 0.3));

        for (let i = 0; i < 36; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = (i * Math.PI * 2) / 36;
            const speed = Math.random() * 8 + 4;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 2 === 0 ? '#00f0ff' : '#ff007f',
                Math.random() * 3 + 2,
                0.45,
                'spark'
            ));
        }
        this.addText('⚡ PULSE NOVA! +150', x, y - 28, '#00f0ff', 20);
    }

    spawnVortexSiphonActivation(x, y) {
        this.shockwaves.push(new Shockwave(x, y, '#00f0ff', 110, 0.5));
        this.shockwaves.push(new Shockwave(x, y, '#ffe600', 70, 0.35));

        for (let i = 0; i < 28; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = (i * Math.PI * 2) / 28;
            const speed = Math.random() * 5 + 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 2 === 0 ? '#00f0ff' : '#ffe600',
                Math.random() * 2.5 + 2,
                0.4,
                'spark'
            ));
        }
    }

    spawnCloakDistortion(x, y) {
        this.shockwaves.push(new Shockwave(x, y, '#a855f7', 85, 0.4));
        for (let i = 0; i < 24; i++) {
            if (this.particles.length >= this.maxParticles) break;
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                Math.random() > 0.5 ? '#a855f7' : '#00f0ff',
                Math.random() * 3 + 1.5,
                0.4,
                'spark'
            ));
        }
    }

    spawnChronoDashAfterimage(body, color = '#ffe600') {
        if (!body || body.length === 0) return;
        const head = body[0];
        this.shockwaves.push(new Shockwave(head.pixelX, head.pixelY, '#ffe600', 95, 0.35));
        for (let i = 0; i < Math.min(body.length, 6); i++) {
            const seg = body[i];
            for (let k = 0; k < 3; k++) {
                if (this.particles.length >= this.maxParticles) break;
                this.particles.push(new Particle(
                    seg.pixelX + (Math.random() - 0.5) * 10,
                    seg.pixelY + (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    color,
                    Math.random() * 3 + 2,
                    0.35,
                    'spark'
                ));
            }
        }
    }

    spawnMineExplosion(x, y) {
        // High density explosive burst
        this.spawnExplosion(x, y, '#ff0055', 28);
        this.spawnExplosion(x, y, '#ffe600', 16);
        this.shockwaves.push(new Shockwave(x, y, '#ff0055', 65, 0.5));
        this.shockwaves.push(new Shockwave(x, y, '#ffffff', 40, 0.3));
    }

    spawnMineChainExplosion(x, y, chainIndex = 1) {
        this.spawnMineExplosion(x, y);
        const chainColor = chainIndex > 2 ? '#00f0ff' : '#ffe600';
        this.shockwaves.push(new Shockwave(x, y, chainColor, 60 + chainIndex * 15, 0.45));
        this.addText(`⚡ CHAIN x${chainIndex}! +${chainIndex * 150}`, x, y - 28, chainColor, 18 + Math.min(6, chainIndex * 2));
    }

    spawnElectricArc(x1, y1, x2, y2, color = '#00f0ff') {
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const steps = Math.max(3, Math.floor(dist / 20));
        for (let i = 0; i <= steps; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const t = i / steps;
            const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 8;
            const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 8;
            this.particles.push(new Particle(
                px, py,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                color,
                Math.random() * 2 + 1.5,
                0.25,
                'spark'
            ));
        }
    }

    spawnParryFlash(x, y) {
        // Kinetic deflector pulse
        this.shockwaves.push(new Shockwave(x, y, '#00f0ff', 65, 0.4));
        this.shockwaves.push(new Shockwave(x, y, '#39ff14', 45, 0.25));
        for (let i = 0; i < 28; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.5 ? '#00f0ff' : '#39ff14',
                Math.random() * 3.5 + 2,
                0.4,
                'spark'
            ));
        }
        this.addText('⚡ DEFLECT! +200', x, y - 22, '#39ff14', 20);
    }

    spawnTemporalDistortion(x, y) {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push(new Particle(
            x + (Math.random() - 0.5) * 24,
            y + (Math.random() - 0.5) * 24,
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4,
            '#00f0ff',
            5,
            0.5,
            'binary'
        ));
    }

    addText(text, x, y, color = '#00f0ff', fontSize = 16) {
        this.floatingTexts.push(new FloatingText(text, x, y, color, fontSize));
    }

    update(dt, width = 800, height = 800) {
        // Update particles
        this.particles = this.particles.filter(p => p.update(dt));

        // Update shockwaves
        this.shockwaves = this.shockwaves.filter(s => s.update(dt));

        // Update floating text
        this.floatingTexts = this.floatingTexts.filter(t => t.update(dt));

        // Update ambient drift
        for (const amb of this.ambientParticles) {
            amb.x += amb.vx * dt * 60;
            amb.y += amb.vy * dt * 60;
            if (amb.x < 0) amb.x = width;
            if (amb.x > width) amb.x = 0;
            if (amb.y < 0) amb.y = height;
            if (amb.y > height) amb.y = 0;
        }
    }

    draw(ctx, width = 800, height = 800) {
        // Ambient background dust
        ctx.save();
        for (const amb of this.ambientParticles) {
            ctx.fillStyle = amb.color;
            ctx.globalAlpha = amb.alpha;
            ctx.beginPath();
            ctx.arc(amb.x, amb.y, amb.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Active particles
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx);
        }

        // Active shockwaves
        for (let i = 0; i < this.shockwaves.length; i++) {
            this.shockwaves[i].draw(ctx);
        }

        // Floating texts
        for (let i = 0; i < this.floatingTexts.length; i++) {
            this.floatingTexts[i].draw(ctx);
        }
    }

    clear() {
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
    }
}

window.particleEngine = new ParticleEngine();
