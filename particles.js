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

class ParticleEngine {
    constructor() {
        this.particles = [];
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

    addText(text, x, y, color = '#00f0ff', fontSize = 16) {
        this.floatingTexts.push(new FloatingText(text, x, y, color, fontSize));
    }

    update(dt, width = 800, height = 800) {
        // Update particles
        this.particles = this.particles.filter(p => p.update(dt));

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

        // Floating texts
        for (let i = 0; i < this.floatingTexts.length; i++) {
            this.floatingTexts[i].draw(ctx);
        }
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
    }
}

window.particleEngine = new ParticleEngine();
